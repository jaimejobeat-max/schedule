
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

    // Hover Preview State
    const [previewData, setPreviewData] = useState<{ imageUrl: string | null; description: string } | null>(null);
    const [previewPosition, setPreviewPosition] = useState<{ x: number; y: number } | null>(null);
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

    // Effect to refetch events when filter changes
    useEffect(() => {
        calendarRef.current?.getApi().refetchEvents();
    }, [selectedBranch]);

    // Fetch events function for FullCalendar
    const fetchEvents = async (info: any, successCallback: any, failureCallback: any) => {
        try {
            const response = await axios.get("/api/schedule", {
                params: {
                    start: info.startStr,
                    end: info.endStr,
                },
            });

            let mappedEvents = response.data.map((evt: any) => ({
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

    const handleEventMouseEnter = (info: any) => {
        // Only on desktop
        if (window.innerWidth < 768) return;

        const url = info.event.url;
        if (!url) return;

        // Use info.el which gives the main event element, ensuring we get the full box
        const rect = info.el.getBoundingClientRect();

        // Position to the right of the event
        let x = rect.right + 15; // Increased padding slightly
        const y = rect.top;

        // If it goes off screen on the right, switch to left
        if (x + 300 > window.innerWidth) {
            x = rect.left - 315;
        }

        setPreviewPosition({ x, y });
        setPreviewData(null); // Reset previous data
        setIsLoadingPreview(true);

        // Debounce fetch
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);

        hoverTimeoutRef.current = setTimeout(async () => {
            try {
                const res = await axios.get(`/api/schedule/preview?url=${encodeURIComponent(url)}`);
                setPreviewData(res.data);
            } catch (err) {
                console.error("Failed to load preview", err);
            } finally {
                setIsLoadingPreview(false);
            }
        }, 500); // 500ms delay
    };

    const handleEventMouseLeave = () => {
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        setPreviewPosition(null);
        setPreviewData(null);
        setIsLoadingPreview(false);
    };

    return (
        <div className="p-4 md:p-6 bg-white/30 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl relative">
            {/* Hover Preview Tooltip */}
            {previewPosition && (
                <div
                    className="fixed z-50 w-72 bg-white/90 backdrop-blur-md rounded-xl shadow-2xl border border-white/20 overflow-hidden transition-all duration-200"
                    style={{
                        top: previewPosition.y,
                        left: previewPosition.x,
                        pointerEvents: 'none', // Allow clicking through if needed, but mainly to prevent flickering
                    }}
                >
                    {isLoadingPreview ? (
                        <div className="p-4 flex items-center justify-center text-gray-500 text-sm h-32">
                            <svg className="animate-spin h-5 w-5 mr-2 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Loading preview...
                        </div>
                    ) : (
                        <div>
                            {previewData?.imageUrl && (
                                <div className="relative h-40 w-full bg-gray-100">
                                    <img
                                        src={previewData.imageUrl}
                                        alt="Preview"
                                        className="object-cover w-full h-full"
                                    />
                                </div>
                            )}
                            <div className="p-3">
                                <p className="text-xs text-gray-700 line-clamp-4 leading-relaxed">
                                    {previewData?.description || "No description available."}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Header: Legend + Link Button */}
            <div className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
                {/* Legend (Filter Buttons) */}
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    <button
                        onClick={() => setSelectedBranch(null)}
                        className={`px-3 py-1.5 rounded-full border shadow-sm transition-all duration-200 text-xs font-bold tracking-wide ${selectedBranch === null
                            ? "bg-gray-800 text-white border-gray-800 scale-105"
                            : "bg-white/50 text-gray-600 border-white/40 hover:bg-white/80"
                            }`}
                    >
                        ALL
                    </button>
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
                    eventMouseEnter={handleEventMouseEnter}
                    eventMouseLeave={handleEventMouseLeave}
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
