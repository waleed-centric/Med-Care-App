"use client";

import React, { useState, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin, { DateClickArg } from "@fullcalendar/interaction";
import { Event } from "@/types/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SignatureCanvas from "react-signature-canvas";
import { EventClickArg, EventContentArg } from "@fullcalendar/core";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import "./styles.css";
import { Textarea } from "../ui/textarea";
import { format } from "date-fns";
import Cookies from "js-cookie";

type Props = {
  events: any[];
  onAddEvent: (event: Event) => void;
  onUpdateEvent: (event: Event) => void;
  onDeleteEvent: (id: string) => void;
};

const CalendarView = ({ events, onAddEvent, onUpdateEvent, onDeleteEvent }: Props) => {
  const sigCanvas = useRef<SignatureCanvas | null>(null);

  const [openForm, setOpenForm] = useState(false);
  const [openDetails, setOpenDetails] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [form, setForm] = useState({
    id: "",
    clientName: "",
    sex: "male",
    age: "",
    preferredDate: "",
    preferredTime: "",
    address: "",
    signature: "",
    description: "",
  });
  const [user, setUser] = useState<any>();

  useEffect(() => {
    const cookieUser = Cookies.get("user");

    if (cookieUser) {
      const parsedUser = JSON.parse(cookieUser); // parse string → object
      setUser(parsedUser);
      console.log("parsedUser - ", parsedUser);
    }
  }, []);

  useEffect(() => {
    if (openForm && sigCanvas.current) {
      if (form.signature) {
        sigCanvas.current.fromDataURL(form.signature);
      } else {
        sigCanvas.current.clear();
      }
    }
  }, [openForm, form.signature]);

  //  When clicking on a date
  const handleDateClick = (info: DateClickArg) => {
    setForm({ id: "", clientName: "", sex: "male", age: "", preferredDate: info.dateStr, preferredTime: "", address: "", signature: "", description: "" });
    setOpenForm(true);
  };

  // When clicking on an existing event
  const handleEventClick = (info: EventClickArg) => {
    const found = events.find((ev) => ev._id === info.event.id);
    if (found) {
      setSelectedEvent(found);
      setOpenDetails(true);
    }
  };

  // Save signature to state
  // const saveSignature = () => {
  //   if (sigCanvasRef.current) {
  //     const dataUrl = sigCanvasRef.current.getTrimmedCanvas().toDataURL("image/png")
  //     setForm({ ...form, signature: dataUrl })
  //   }
  // }

  // const clearSignature = () => {
  //   sigCanvasRef.current?.clear()
  //   setForm({ ...form, signature: "" })
  // }

  // Submit for Add / Edit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let signatureData = form.signature;
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      signatureData = sigCanvas.current.getCanvas().toDataURL("image/png");
    }

    const newEvent: Event = {
      id: form.id || String(Date.now()),
      title: form.clientName,
      clientName: form.clientName,
      preferredDate: form.preferredDate,
      preferredTime: form.preferredTime,
      address: form.address,
      location: form.address, // Assuming location is the same as address
      type: "client-meeting",
      sex: "male",
      age: form.age,
      signature: signatureData,
      description: form.description,
    };

    if (form.id) {
      onUpdateEvent(newEvent);
    } else {
      onAddEvent(newEvent);
    }

    setOpenForm(false);
  };

  const handleDelete = () => {
    if (selectedEvent) {
      onDeleteEvent(selectedEvent.id);
      setOpenDetails(false);
    }
  };

  const handleEdit = () => {
    if (selectedEvent) {
      setForm({
        id: selectedEvent.id,
        clientName: selectedEvent.title,
        sex: selectedEvent.sex || "male",
        age: selectedEvent.age || "",
        preferredDate: selectedEvent.preferredDate,
        preferredTime: selectedEvent.preferredTime,
        address: selectedEvent.address || "",
        signature: selectedEvent.signature || "",
        description: selectedEvent.description || "",
      });
      setOpenDetails(false);
      setOpenForm(true);
    }
  };

  return (
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
        height="auto"
        contentHeight="auto"
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        eventContent={renderEventContent}
      />

      {/* Add / Edit Form */}
      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="overflow-y-scroll max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit Appointment" : "New Appointment"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 ">
            <div>
              <Label>Client Name</Label>
              <Input value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} required />
            </div>

            <div>
              <Label>Sex</Label>
              <Select value={form.sex} onValueChange={(val) => setForm({ ...form, sex: val as "male" | "female" })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sex" />
                </SelectTrigger>
                <SelectContent className="bg-white shadow-md border rounded-md">
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Age</Label>
              <Input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} required />
            </div>

            <div>
              <Label>Date</Label>
              <Input type="date" value={form.preferredDate} onChange={(e) => setForm({ ...form, preferredDate: e.target.value })} required />
            </div>

            <div>
              <Label>Time</Label>
              <Input type="time" value={form.preferredTime} onChange={(e) => setForm({ ...form, preferredTime: e.target.value })} required />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the reason for appointment" rows={4} maxLength={500} required />
            </div>

            <div>
              <Label>Address</Label>
              <Input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Enter address" required />
            </div>

            <div>
              <Label>Signature</Label>
              <div className="border rounded-md p-2">
                <SignatureCanvas
                  ref={sigCanvas}
                  penColor="black"
                  canvasProps={{ width: 400, height: 150, className: "border w-full h-[150px]" }}
                  onEnd={() => {
                    if (sigCanvas.current) {
                      const data = sigCanvas.current.getCanvas().toDataURL("image/png");
                      setForm({ ...form, signature: data });
                    }
                  }}
                  backgroundColor="white"
                />
              </div>
              <div className="flex justify-between mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    sigCanvas.current?.clear();
                    setForm({ ...form, signature: "" });
                  }}>
                  Clear
                </Button>
              </div>
            </div>

            <Button type="submit" className="w-full bg-secondary cursor-pointer">
              {form.id ? "Update Appointment" : "Add Appointment"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Details View */}
      <Dialog open={openDetails} onOpenChange={setOpenDetails}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-2">
              <p>
                <b>Client:</b> {selectedEvent?.form?.clientName}
              </p>
              <p>
                <b>Sex:</b> {selectedEvent?.form?.sex}
              </p>
              <p>
                <b>Age:</b> {selectedEvent?.form?.age}
              </p>
              <p>
                <b>Date:</b> {format(new Date(selectedEvent?.form?.preferredDate), "dd MMM yyyy")}
              </p>
              <p>
                <b>Time:</b> {selectedEvent?.form?.preferredTime}
              </p>
              <p>
                <b>Address:</b> {selectedEvent?.form?.address}
              </p>
              {selectedEvent.signature && (
                <div>
                  <b>Signature:</b>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selectedEvent.signature} alt="Signature" className="mt-2 border rounded-md w-40" />
                </div>
              )}
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={handleEdit}>
                  Edit
                </Button>
                <Button variant="destructive" onClick={handleDelete}>
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
const renderEventContent = (eventInfo: EventContentArg) => {
  return (
    <div className="text-black">
      <strong>{eventInfo.event.title}</strong>
      <div>{eventInfo.event.extendedProps.time}</div>
      <div>{eventInfo.event.extendedProps.address}</div>
    </div>
  );
};

export default CalendarView;
