// components/DoctorCalendarView.tsx
"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import "@/components/DoctorCalendarView/styles.css";
import { Button } from "./ui/button";
import { confirmAppointment } from "@/hooks/appointments";
import { format, isValid } from "date-fns";

// interface EventData {
//   id: string;
//   clientName: string;
//   sex: string;
//   date: string;
//   time: string;
//   address: string;
//   signature?: string;
// }

// interface DoctorCalendarViewProps {
//   selectedEvent: EventData[];
//   setSelectedEvent: any;
// }

export default function DoctorCalendarViewModal({ selectedEvent, setSelectedEvent }: any) {
  const handleConfirmAppointment = async () => {
    try {
      const response = await confirmAppointment(selectedEvent?._id);
      setSelectedEvent(null);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      {/* Modal for details */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-md">
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedEvent?.form?.clientName}</DialogTitle>
                <DialogDescription>Appointment details</DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <p>
                  <strong>Date: </strong>
                  {(() => {
                    const rawDate = selectedEvent?.date || selectedEvent?.form?.preferredDate;
                    if (!rawDate) return "N/A";

                    const parsedDate = new Date(rawDate);
                    return isValid(parsedDate) ? format(parsedDate, "dd MMM yyyy") : "Invalid date";
                  })()}
                </p>
                <p>
                  <strong>Time:</strong> {selectedEvent?.form?.preferredTime}
                </p>
                <p>
                  <strong>Description:</strong> {selectedEvent?.description}
                </p>
                {/* {selectedEvent?.sex && (
                  <p>
                    <strong>Sex:</strong> {selectedEvent?.sex}
                  </p>
                )} */}
                {selectedEvent.status != "accepted" && (
                  <Button onClick={handleConfirmAppointment} className="cursor-pointer">
                    Confirm
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
