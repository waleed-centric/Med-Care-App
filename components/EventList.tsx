import { Event } from "@/types/calendar.d";
import { Avatar } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";

interface EventListProps {
  events: Event[];
}

export function EventList({ events }: any) {
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
    <div className="flex flex-col h-full">
      <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-b">
        <h2 className="text-base sm:text-lg font-semibold">Upcoming Appointments</h2>
      </div>
      <ScrollArea className="flex-1 px-3 sm:px-4 lg:px-6 max-h-screen overflow-y-auto">
        <div className="space-y-4 sm:space-y-6 py-3 sm:py-4">
          <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">You are have</h3>
          {events
            ?.filter((event: any) => event?.marketer === user?.id && event?.form?.preferredDate && event?.form?.preferredTime)
            .map((event: any) => (
              <div key={event._id} className="flex items-start space-x-3 sm:space-x-4">
                <Avatar className="mt-1">
                  <div className="w-full h-full bg-[#ff9e58]" />
                </Avatar>
                <div className="space-y-1">
                  <h4 className="text-xs sm:text-sm font-medium leading-none">{event?.form?.clientName}</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {event?.form?.preferredDate ? format(new Date(event.form.preferredDate), "dd MMM yyyy") : "Invalid date"} by {event?.form?.preferredTime}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">{event.address}</p>
                </div>
              </div>
            ))}
        </div>
      </ScrollArea>
    </div>
  );
}
