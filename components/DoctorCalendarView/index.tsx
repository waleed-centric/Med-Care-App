'use client'

import React from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { Event } from '@/types/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"


import "./styles.css"

const CalendarView = ({ events }: { events: Event[] }) => {
  return (
    <div className='w-full h-full p-4'>
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'today prev,next',
          center: 'title',
          right: 'dayGridMonth,dayGridWeek,dayGridDay'
        }}
        events={events}
        eventContent={renderEventContent}
      />
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderEventContent(eventInfo: any) {
  return (
    <Popover>
      <PopoverTrigger className='overflow-hidden w-full'>
        <div className='flex flex-col text-black text-start text-xs w-full'>
          <b>{eventInfo.event.extendedProps.time}</b>
          <i className='text-sm'>{eventInfo.event.title}</i>
          <i className='text-sm w-full'>{eventInfo.event.extendedProps.location}</i>
        </div>
      </PopoverTrigger>
      <PopoverContent className='bg-[#fbeade] border-l-4 border-l-[#ff9e58]'>
        <div className="p-2">
          <h3 className="font-bold mb-2">{eventInfo.event.title}</h3>
          <p className="text-sm mb-1"><b>Time:</b> {eventInfo.event.extendedProps.time}</p>
          <p className="text-sm mb-1"><b>Location:</b> {eventInfo.event.extendedProps.location}</p>
          <p className="text-sm"><b>Type:</b> {eventInfo.event.extendedProps.type}</p>
        </div>

      </PopoverContent>
    </Popover>

  )
}

export default CalendarView