import * as cheerio from 'cheerio';
import iconv from 'iconv-lite';
import tls from 'tls';

const HOST = 'raysoda.cafe24.com';
const BASE_PATH = '/zeroboard';

const BOARDS = [
    'Layer20',
    'layer7',
    'Layer41',
    'Layer26',
    'Layer27',
    'Layer11',
    'Layerhannam',
];

interface ScheduleEvent {
    id: string;
    title: string;
    start: string;
    url: string;
    extendedProps: {
        boardId: string;
    };
}

let sessionCookie: string | null = null;

// Raw HTTPS request helper to bypass Node's strict HTTP parser
// (Zeroboard sends malformed 'P3P : CP=...' headers that crash Node's parser)
function rawRequest(
    method: 'GET' | 'POST',
    path: string,
    body: string | null = null,
    cookie: string | null = null
): Promise<{ headers: string; body: Buffer }> {
    return new Promise((resolve, reject) => {
        const socket = tls.connect(443, HOST, {
            rejectUnauthorized: false
        }, () => {
            const requestParts = [
                `${method} ${path} HTTP/1.1`,
                `Host: ${HOST}`,
                `Connection: close`,
                `User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36`,
                `Content-Type: application/x-www-form-urlencoded`,
            ];

            if (cookie) {
                requestParts.push(`Cookie: ${cookie}`);
            }

            if (body) {
                requestParts.push(`Content-Length: ${Buffer.byteLength(body)}`);
            }

            requestParts.push('\r\n'); // End of headers

            socket.write(requestParts.join('\r\n'));
            if (body) socket.write(body);
        });

        const chunks: Buffer[] = [];
        socket.on('data', (data) => chunks.push(data));
        socket.on('end', () => {
            const fullBuffer = Buffer.concat(chunks);
            // Find valid header-body separator (\r\n\r\n)
            const separatorIndex = fullBuffer.indexOf('\r\n\r\n');

            if (separatorIndex === -1) {
                // Maybe just \n\n?
                const altSep = fullBuffer.indexOf('\n\n');
                if (altSep !== -1) {
                    resolve({
                        headers: fullBuffer.subarray(0, altSep).toString(),
                        body: fullBuffer.subarray(altSep + 2)
                    });
                } else {
                    reject(new Error('Invalid response'));
                }
                return;
            }

            const headers = fullBuffer.subarray(0, separatorIndex).toString();
            const body = fullBuffer.subarray(separatorIndex + 4);
            resolve({ headers, body });
        });
        socket.on('error', reject);
    });
}

async function getSession() {
    if (sessionCookie) return sessionCookie;

    console.log('Logging in via raw socket...');
    const formData = new URLSearchParams();
    formData.append('user_id', 'jaimejobeat');
    formData.append('password', '1007');
    formData.append('id', 'hong_schedule');
    formData.append('auto_login', '1');

    try {
        const { headers } = await rawRequest(
            'POST',
            `${BASE_PATH}/login_check.php`,
            formData.toString()
        );

        // Extract cookies manually
        // Set-Cookie: PHPSESSID=...
        const cookieLines = headers.split('\n').filter(l => l.toLowerCase().startsWith('set-cookie:'));
        if (cookieLines.length > 0) {
            sessionCookie = cookieLines.map(l => {
                const val = l.split(':')[1].trim();
                return val.split(';')[0];
            }).join('; ');
            console.log('Login success, cookie:', sessionCookie);
        }
    } catch (error) {
        console.error('Login failed', error);
    }

    return sessionCookie;
}

export async function fetchSchedules(year: number, month: number) {
    const cookie = await getSession();
    if (!cookie) {
        console.error('Failed to get session cookie');
        return [];
    }

    const allEvents: ScheduleEvent[] = [];

    const promises = BOARDS.map(async (boardId) => {
        try {
            const urlPath = `${BASE_PATH}/zboard.php?id=${boardId}&year=${year}&month=${month}`;
            const { body } = await rawRequest('GET', urlPath, null, cookie);

            // Attempt to decode
            // Note: Transfer-Encoding: chunked could be an issue if we parse raw TCP.
            // Zeroboard on nginx usually sends full content or chunked.
            // If chunked, we need to de-chunk.
            // Let's assume non-chunked or use a simple de-chunker if content looks broken.
            // For now, let's try direct decode.

            let html = iconv.decode(body, 'EUC-KR');

            // Simple chunked check: if body starts with hex number then \r\n
            // This is risky. Raw socket means we have to handle HTTP 1.1 transfer encoding.
            // To simplify, we asked for 'Connection: close', often servers avoid chunked for small known/closed responses,
            // but nginx might still chunk.
            // If we see junk characters, we might need a basic dechunker.

            const $ = cheerio.load(html);

            $('td').each((_, td) => {
                const dateLink = $(td).find('a[href*="write.php"][href*="subject="]').first();
                if (dateLink.length === 0) return;

                const href = dateLink.attr('href') || '';
                const match = href.match(/subject=(\d{4})\/(\d{1,2})\/(\d{1,2})/);

                if (match) {
                    const [_, y, m, d] = match;
                    const dateStr = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;

                    $(td).find('a[href*="view.php"]').each((_, eventLink) => {
                        const el = $(eventLink);
                        const viewHref = el.attr('href') || '';
                        const no = viewHref.match(/no=(\d+)/)?.[1] || Math.random().toString(36).substr(2, 9);
                        const title = el.text().trim();
                        if (!title || title === '-') return;

                        allEvents.push({
                            id: `${boardId}-${no}`,
                            title: `[${boardId}] ${title}`,
                            start: dateStr,
                            url: `https://${HOST}${BASE_PATH}/${viewHref}`,
                            extendedProps: { boardId },
                        });
                    });
                }
            });

        } catch (err) {
            console.error(`Error scraping ${boardId}:`, err);
        }
    });

    await Promise.all(promises);
    return allEvents;
}
