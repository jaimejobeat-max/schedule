import { NextRequest, NextResponse } from 'next/server';
import { fetchSchedules } from '@/lib/scraper';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const startParam = searchParams.get('start');
    const endParam = searchParams.get('end');

    // Default to current date if not provided
    let targetDate = new Date();

    // If start is provided (e.g., 2026-01-26), add ~7 days to get into the main month
    if (startParam) {
        const startDate = new Date(startParam);
        targetDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    }

    const year = targetDate.getFullYear();
    const month = targetDate.getMonth() + 1; // JS months are 0-indexed

    console.log(`Fetching schedules for ${year}-${month}`);

    const events = await fetchSchedules(year, month);

    return NextResponse.json(events);
}
