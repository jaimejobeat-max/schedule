
"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import { useEffect, useState, useRef } from "react";
import axios from "axios";

// Color mapping for branches
const BRANCH_COLORS: Record<string, string> = {
    Layer20: "#BAFFC9", // Green
    layer7: "#BAE1FF", // Blue
    Layer41: "#FFFFBA", // Yellow
    Layer26: "#FFDFBA", // Orange
    Layer27: "#E0BBE4", // Purple
    Layer11: "#FFC3A0", // Peach
    Layerhannam: "#D5AAFF", // Lavender
};

const BRANCH_NAMES: Record<string, string> = {
    Layer20: "20",
    layer7: "7",
    Layer41: "41",
    Layer26: "26",
    Layer27: "27",
    Layer11: "11",
    Layerhannam: "Hannam",
};

export default function Calendar() {
    const [events, setEvents] = useState([]);
    const calendarRef = useRef<FullCalendar>(null);
    const [initialView, setInitialView] = useState("dayGridMonth");

    const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
    const [filterMode, setFilterMode] = useState<'all' | 'schedule' | 'special' | 'provisional' | 'wedding'>('schedule');

    const TARGET_SYMBOLS = ["*", "**", "***", "^", "^^", "^^^"];

    useEffect(() => {
        // Detect mobile and set initial view to list
        if (window.innerWidth < 768) {
            setInitialView("listMonth");
        }
    }, []);

    // Auto-refresh every 5 minutes (300,000 ms)
    useEffect(() => {
        const interval = setInterval(() => {
            console.log("Auto-refreshing events...");
            calendarRef.current?.getApi().refetchEvents();
        }, 300000);

        return () => clearInterval(interval);
    }, []);

    // Effect to refetch events when filter or mode changes
    useEffect(() => {
        calendarRef.current?.getApi().refetchEvents();
    }, [selectedBranch, filterMode]);

    // Fetch events function for FullCalendar
    const fetchEvents = async (info: any, successCallback: any, failureCallback: any) => {
        try {
            const response = await axios.get("/api/schedule", {
                params: {
                    start: info.startStr,
                    end: info.endStr,
                },
            });

            let mappedEvents = response.data
                .filter((evt: any) => {
                    if (filterMode === 'all') return true; // Show everything

                    const fullTitle = evt.title || "";
                    // Clean title: Remove [BranchName] prefix and trim
                    // Regex to remove [Anything] at the start
                    const content = fullTitle.replace(/^\[[^\]]+\]\s*/, "").trim();

                    const isSpecial = TARGET_SYMBOLS.includes(content);
                    const isProvisional = content.includes("++");
                    const isWedding = content.includes("(WED)");

                    // If it's hong_schedule, ONLY show it if it's a wedding event
                    if (evt.extendedProps.boardId === 'hong_schedule' && !isWedding) {
                        return false;
                    }

                    if (filterMode === 'special') {
                        return isSpecial;
                    } else if (filterMode === 'provisional') {
                        return isProvisional;
                    } else if (filterMode === 'wedding') {
                        return isWedding;
                    } else {
                        // schedule mode: Exclude special, provisional, and wedding
                        return !isSpecial && !isProvisional && !isWedding;
                    }
                })
                .map((evt: any) => ({
                    ...evt,
                    backgroundColor: BRANCH_COLORS[evt.extendedProps.boardId] || "#cccccc",
                    borderColor: BRANCH_COLORS[evt.extendedProps.boardId] || "#cccccc",
                    textColor: "#000000", // Dark text for pastel background
                }));

            // Filter logic
            if (selectedBranch) {
                mappedEvents = mappedEvents.filter((evt: any) => evt.extendedProps.boardId === selectedBranch);
            }

            successCallback(mappedEvents);
        } catch (error) {
            console.error("Error fetching events", error);
            failureCallback(error);
        }
    };

    const handleEventClick = (info: any) => {
        info.jsEvent.preventDefault(); // Prevent default browser navigation if needed (though we want to open link)
        if (info.event.url) {
            window.open(info.event.url, "_blank");
        }
    };

    return (
        <div className="p-4 md:p-6 bg-white/30 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl">
            {/* Header: Legend + Link Button */}
            <div className="mb-6 flex flex-col gap-4">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    {/* Combined Filters (Mode + Branch) */}
                    <div className="flex flex-wrap gap-2 justify-center md:justify-start items-center">
                        {/* 1. ALL Button */}
                        <button
                            onClick={() => {
                                setSelectedBranch(null);
                                setFilterMode('all');
                            }}
                            className={`px-3 py-1.5 rounded-full border shadow-sm transition-all duration-200 text-xs font-bold tracking-wide ${filterMode === 'all' && selectedBranch === null
                                ? "bg-gray-800 text-white border-gray-800 scale-105"
                                : "bg-white/50 text-gray-600 border-white/40 hover:bg-white/80"
                                }`}
                        >
                            ALL
                        </button>

                        {/* 2. Schedule Button */}
                        <button
                            onClick={() => setFilterMode('schedule')}
                            className={`px-3 py-1.5 rounded-full border shadow-sm transition-all duration-200 text-xs font-bold tracking-wide ${filterMode === 'schedule'
                                ? "bg-gray-800 text-white border-gray-800 scale-105"
                                : "bg-white/50 text-gray-600 border-white/40 hover:bg-white/80"
                                }`}
                        >
                            Schedule
                        </button>

                        {/* 3. Special Button */}
                        <button
                            onClick={() => setFilterMode('special')}
                            className={`px-3 py-1.5 rounded-full border shadow-sm transition-all duration-200 text-xs font-bold tracking-wide ${filterMode === 'special'
                                ? "bg-gray-800 text-white border-gray-800 scale-105"
                                : "bg-white/50 text-gray-600 border-white/40 hover:bg-white/80"
                                }`}
                        >
                            답사 & 특이사항
                        </button>

                        {/* 4. Wedding Button */}
                        <button
                            onClick={() => setFilterMode('wedding')}
                            className={`px-3 py-1.5 rounded-full border shadow-sm transition-all duration-200 text-xs font-bold tracking-wide ${filterMode === 'wedding'
                                ? "bg-gray-800 text-white border-gray-800 scale-105"
                                : "bg-white/50 text-gray-600 border-white/40 hover:bg-white/80"
                                }`}
                        >
                            웨딩
                        </button>

                        {/* 5. Provisional Button (Moved before branches) */}
                        <button
                            onClick={() => setFilterMode('provisional')}
                            className={`px-3 py-1.5 rounded-full border shadow-sm transition-all duration-200 text-xs font-bold tracking-wide ${filterMode === 'provisional'
                                ? "bg-gray-800 text-white border-gray-800 scale-105"
                                : "bg-white text-gray-600 border-white/40 hover:bg-white/80"
                                }`}
                            style={{
                                backgroundColor: filterMode === 'provisional' ? undefined : '#FFFFFF',
                            }}
                        >
                            가부킹
                        </button>

                        {/* 5. Branch Buttons */}
                        {Object.entries(BRANCH_COLORS).map(([id, color]) => (
                            <button
                                key={id}
                                onClick={() => setSelectedBranch(selectedBranch === id ? null : id)}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded-full border shadow-sm transition-all duration-200 ${selectedBranch === id ? "ring-2 ring-offset-1 ring-gray-400 scale-105" : "hover:opacity-80"
                                    }`}
                                style={{
                                    backgroundColor: color,
                                    borderColor: "rgba(255,255,255,0.4)",
                                    opacity: selectedBranch && selectedBranch !== id ? 0.4 : 1,
                                }}
                            >
                                <span className="text-xs font-bold text-gray-800 tracking-wide">{BRANCH_NAMES[id]}</span>
                            </button>
                        ))}
                    </div>

                    {/* Right Link Button */}
                    <div className="flex-shrink-0">
                        <a
                            href="https://raysoda.cafe24.com/zeroboard/zboard.php?id=hong_schedule"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center px-4 py-2 text-sm font-bold text-gray-700 rounded-lg shadow-sm border border-white/40 transition-all duration-200 hover:opacity-80 active:scale-95"
                            style={{
                                backgroundColor: '#A0C4FF', // Pastel Blue
                                height: '2.5rem', // Match standard button height
                                fontSize: '0.875rem', // Match standard button font size
                            }}
                        >
                            hongdae ↗
                        </a>
                    </div>
                </div>
            </div>

            <div className="calendar-container glass-calendar">
                <style jsx global>{`
                    /* Desktop styles */
                    .glass-calendar .fc-toolbar-title {
                        font-family: inherit !important;
                        font-size: 1.5rem !important;
                        font-weight: 300 !important; /* Thin font */
                        color: #1f2937 !important;
                        letter-spacing: -0.025em;
                        display: flex !important;
                        align-items: center !important;
                        height: 2.5rem !important; /* Match button height */
                        margin: 0 !important;
                        padding: 0 1rem !important; /* Add padding like buttons */
                    }

                    /* Mobile styles */
                    @media (max-width: 768px) {
                        .glass-calendar .fc-toolbar {
                            flex-wrap: wrap;
                            gap: 0.5rem;
                            justify-content: center !important;
                        }
                        .glass-calendar .fc-toolbar-title {
                            font-size: 1.25rem !important;
                            width: auto !important; /* Allow auto width to respect padding */
                            text-align: center;
                            order: -1;
                            margin-bottom: 0.5rem !important;
                            justify-content: center; /* Center content */
                            flex-grow: 0; /* Prevent taking full width if we want it button-like */
                        }
                        .glass-calendar .fc-toolbar-chunk {
                            display: flex;
                            justify-content: center;
                            gap: 0.25rem;
                            width: 100%; /* Ensure chunks take row */
                        }
                        /* First chunk (prev/next/today) and Third chunk (views) share row */
                        .glass-calendar .fc-toolbar-chunk:first-child {
                             justify-content: flex-end; /* Align closer to title if title is middle? No, keep logic simple */
                             order: 2; /* Move chunks below title */
                             width: auto;
                        }
                        .glass-calendar .fc-toolbar-chunk:last-child {
                             order: 3;
                             width: auto;
                        }
                        .glass-calendar .fc-toolbar-title {
                            width: 100% !important; /* Keep full width for title on top row */
                        }
                    }

                    .glass-calendar .fc-button-primary {
                        background-color: rgba(255, 255, 255, 0.5) !important;
                        border-color: rgba(255, 255, 255, 0.4) !important;
                        color: #374151 !important;
                        backdrop-filter: blur(4px);
                        font-weight: 600 !important;
                        text-transform: capitalize;
                        border-radius: 0.5rem !important; /* More rounded like Hongdae button */
                        height: 2.5rem !important; /* Consistent height */
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                    }
                    .glass-calendar .fc-button-primary:hover {
                        background-color: rgba(255, 255, 255, 0.8) !important;
                    }
                    .glass-calendar .fc-button-active {
                        background-color: rgba(255, 255, 255, 1) !important;
                        color: #000 !important;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    }
                    .fc-event {
                        border-radius: 6px !important;
                        border: none !important;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                    }
                    /* Highlight today in list view */
                    .glass-calendar .fc-list-day.fc-day-today {
                        background-color: rgba(255, 235, 59, 0.5) !important;
                    }
                    .glass-calendar .fc-list-day.fc-day-today > * {
                        background-color: rgba(255, 235, 59, 0.5) !important;
                        color: #1f2937 !important;
                    }
                `}</style>
                <FullCalendar
                    key={initialView} /* Force remount on view change to ensure mobile default works */
                    ref={calendarRef}
                    plugins={[dayGridPlugin, interactionPlugin, timeGridPlugin, listPlugin]}
                    initialView={initialView}
                    titleFormat={{ year: 'numeric', month: '2-digit' }}
                    listDayFormat={{ month: '2-digit', day: '2-digit', weekday: 'short' }}
                    customButtons={{
                        customToday: {
                            text: 'today',
                            click: function () {
                                const calendarApi = calendarRef.current?.getApi();
                                if (calendarApi) {
                                    calendarApi.today();
                                    setTimeout(() => {
                                        const todayEl = document.querySelector('.fc-day-today');
                                        if (todayEl) {
                                            todayEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                        }
                                    }, 200);
                                }
                            }
                        }
                    }}
                    headerToolbar={{
                        left: "prev,next,customToday",
                        center: "title",
                        right: "dayGridMonth,dayGridWeek,listMonth",
                    }}
                    events={fetchEvents}
                    eventClick={handleEventClick}
                    datesSet={(arg) => {
                        // When switching to List view, verify if we need to scroll to today and highlight events
                        if (arg.view.type === 'listMonth') {
                            setTimeout(() => {
                                const todayHeader = document.querySelector('.fc-list-day.fc-day-today');
                                if (todayHeader) {
                                    // Scroll to today
                                    todayHeader.scrollIntoView({ behavior: 'instant', block: 'center' });

                                    // Highlight events under today
                                    let nextSibling = todayHeader.nextElementSibling;
                                    while (nextSibling && nextSibling.classList.contains('fc-list-event')) {
                                        // Apply yellow background to the event row
                                        (nextSibling as HTMLElement).style.backgroundColor = 'rgba(255, 235, 59, 0.3)';
                                        nextSibling = nextSibling.nextElementSibling;
                                    }
                                }
                            }, 300); // 300ms delay to ensure rendering matches
                        }
                    }}
                    height="auto"
                    aspectRatio={1.5}
                />
            </div>
            {/* Disclaimer / Footer */}
            <div className="mt-4 text-center text-xs text-gray-500">
                <p>Showing events for: {selectedBranch ? BRANCH_NAMES[selectedBranch] : "All Branches"}</p>
            </div>
        </div>
    );
}
