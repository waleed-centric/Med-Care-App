// components/DoctorCalendarView.tsx
"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import "@/components/DoctorCalendarView/styles.css";
import { Button } from "./ui/button";
import DoctorCalendarViewModal from "./DoctorCalendarViewModal";
import Cookies from "js-cookie";

interface EventData {
  id: string;
  clientName: string;
  sex: string;
  date: string;
  time: string;
  address: string;
  signature?: string;
}

interface DoctorCalendarViewProps {
  events: any[];
}

export default function DoctorCalendarView({ events }: DoctorCalendarViewProps) {
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [user, setUser] = useState<any>();

  useEffect(() => {
    const cookieUser = Cookies.get("user");

    if (cookieUser) {
      const parsedUser = JSON.parse(cookieUser); // parse string → object
      setUser(parsedUser);
      console.log("parsedUser - ", parsedUser);
    }
  }, []);

  return (
    <>
      <div className="w-full h-full p-4">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "today prev,next",
            center: "title",
            right: "dayGridMonth,dayGridWeek,dayGridDay",
          }}
          events={events
            ?.filter((ev: any) => ev?.marketer === user?.id && ev?.form?.preferredDate && ev?.form?.preferredTime)
            ?.map((ev: any) => {
              const rawDate = ev.form.preferredDate;
              const [hours, minutes] = ev.form.preferredTime.split(":");
              const date = new Date(rawDate);
              date.setHours(Number(hours), Number(minutes), 0, 0);

              return {
                id: ev._id,
                title: ev.form.clientName || "Untitled",
                start: date.toISOString(),
              };
            })}
          eventClick={(info) => {
            const ev = events?.find((e: any) => e._id === info.event.id);
            if (ev) setSelectedEvent(ev);
          }}
          height="auto"
          contentHeight="auto"
        />
      </div>

      {/* Modal for details */}
      <DoctorCalendarViewModal selectedEvent={selectedEvent} setSelectedEvent={setSelectedEvent} />
    </>
  );
}
