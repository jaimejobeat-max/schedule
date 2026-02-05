
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
        <div className="p-4 bg-white rounded-lg shadow-lg">
            <div className="mb-4 flex flex-wrap gap-2 justify-center">
                {Object.entries(BRANCH_COLORS).map(([id, color]) => (
                    <div key={id} className="flex items-center gap-1 px-2 py-1 rounded border" style={{ backgroundColor: color }}>
                        <span className="text-xs font-semibold">{BRANCH_NAMES[id]}</span>
                    </div>
                ))}
            </div>

            <div className="calendar-container">
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
