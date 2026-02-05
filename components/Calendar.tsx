
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

    // Fetch events function for FullCalendar
    const fetchEvents = async (info: any, successCallback: any, failureCallback: any) => {
        try {
            const response = await axios.get("/api/schedule", {
                params: {
                    start: info.startStr,
                    end: info.endStr,
                },
            });

            const mappedEvents = response.data.map((evt: any) => ({
                ...evt,
                backgroundColor: BRANCH_COLORS[evt.extendedProps.boardId] || "#cccccc",
                borderColor: BRANCH_COLORS[evt.extendedProps.boardId] || "#cccccc",
                textColor: "#000000", // Dark text for pastel background
            }));

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
            <div className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
                {/* Legend in Center/Left */}
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    {Object.entries(BRANCH_COLORS).map(([id, color]) => (
                        <div key={id} className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-white/40 shadow-sm" style={{ backgroundColor: color }}>
                            <span className="text-xs font-bold text-gray-800 tracking-wide">{BRANCH_NAMES[id]}</span>
                        </div>
                    ))}
                </div>

                {/* Right Link Button */}
                <div className="flex-shrink-0">
                    <a
                        href="https://raysoda.cafe24.com/zeroboard/zboard.php?id=hong_schedule"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-4 py-2 bg-white/50 hover:bg-white/80 active:scale-95 text-sm font-bold text-gray-700 rounded-xl shadow-sm border border-white/40 transition-all duration-200"
                    >
                        hongdae ↗
                    </a>
                </div>
            </div>

            <div className="calendar-container glass-calendar">
                <style jsx global>{`
                    .glass-calendar .fc-toolbar-title {
                        font-size: 1.25rem !important;
                        font-weight: 700 !important;
                        color: #1f2937 !important;
                    }
                    .glass-calendar .fc-button-primary {
                        background-color: rgba(255, 255, 255, 0.5) !important;
                        border-color: rgba(255, 255, 255, 0.4) !important;
                        color: #374151 !important;
                        backdrop-filter: blur(4px);
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
                `}</style>
                <FullCalendar
                    ref={calendarRef}
                    plugins={[dayGridPlugin, interactionPlugin, timeGridPlugin, listPlugin]}
                    initialView={initialView}
                    headerToolbar={{
                        left: "prev,next today",
                        center: "title",
                        right: "dayGridMonth,timeGridWeek,listMonth",
                    }}
                    events={fetchEvents}
                    eventClick={handleEventClick}
                    height="auto"
                    aspectRatio={1.5}
                />
            </div>
        </div>
    );
}
