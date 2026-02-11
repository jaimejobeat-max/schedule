import { NextRequest, NextResponse } from 'next/server';
import { fetchScheduleDetail } from '@/lib/scraper';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get('url');

    if (!url) {
        return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Basic security check: ensure it's the target domain
    if (!url.includes('raysoda.cafe24.com')) {
        return NextResponse.json({ error: 'Invalid domain' }, { status: 400 });
    }

    console.log(`Fetching preview for ${url}`);

    const detail = await fetchScheduleDetail(url);

    if (!detail) {
        return NextResponse.json({ error: 'Failed to fetch detail' }, { status: 500 });
    }

    return NextResponse.json(detail);
}
