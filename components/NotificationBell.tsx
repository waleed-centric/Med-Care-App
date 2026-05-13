"use client";

import { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Bell, Check, X, Loader2 } from "lucide-react";
import { seeAllNotifications } from "@/hooks/notifications";
import { respondToAppointment } from "@/hooks/appointments";

interface Notification {
  _id: string;
  message: string;
  type: string;
  appointmentId?: any; // Changed to any to handle populated object
  read: boolean;
  createdAt: string;
  [key: string]: any;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingState, setProcessingState] = useState<{ id: string, action: 'accept' | 'decline' } | null>(null);
  const [open, setOpen] = useState(false);

  const fetchNotifications = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const data = await seeAllNotifications();
      // Handle both array and { notifications: [...] } formats
      const list = Array.isArray(data) ? data : data?.notifications || [];
      setNotifications(list);
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchNotifications(true);

    // Poll every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications(false);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (open) {
      fetchNotifications(false);
    }
  }, [open]);

  const handleRespond = async (appointmentId: string, action: "accept" | "decline", notificationId: string) => {
    setProcessingState({ id: notificationId, action });
    try {
      await respondToAppointment(appointmentId, action);
      // Refresh list to show updated status
      fetchNotifications();
    } catch (error) {
      console.error("Error responding to appointment", error);
      alert("Failed to update appointment status");
    } finally {
      setProcessingState(null);
    }
  };

  const hasPendingActions = notifications.some(
    (n) => n.appointmentId?.status === "submitted"
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
          <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          {hasPendingActions && (
            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500" />
          )}
        </Button>
      </PopoverTrigger>
    <PopoverContent className="w-80 p-0 bg-white" align="end">
        <div className="p-4 border-b">
            <h4 className="font-medium leading-none">Notifications</h4>
        </div>
        <div className="max-h-[300px] overflow-y-auto">
            {loading ? (
                <div className="flex justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                </div>
            ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                    No notifications
                </div>
            ) : (
                <div className="divide-y">
                    {notifications.map((notif) => {
                        const status = notif.appointmentId?.status;
                        let statusColor = "";
                        let statusText = "";

                        if (status === 'pending') {
                            statusColor = "bg-green-50 border-green-200";
                            statusText = "Accepted";
                        } else if (status === 'cancelled') {
                            statusColor = "bg-red-50 border-red-200";
                            statusText = "Declined";
                        } else if (status === 'submitted') {
                            statusColor = "bg-blue-50 border-blue-200";
                        }

                        return (
                            <div key={notif._id} className={`p-4 flex flex-col gap-2 ${statusColor} border-l-4`}>
                                <div className="flex justify-between items-start">
                                    <p className="text-sm">{notif.message}</p>
                                    {statusText && (
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                            status === 'pending' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                            {statusText}
                                        </span>
                                    )}
                                </div>
                                {/* Show actions if appointmentId is present and status is submitted */}
                                {notif.appointmentId && notif.appointmentId.status === 'submitted' && (
                                    <div className="flex gap-2 mt-2">
                                        <Button 
                                            size="sm" 
                                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                                            onClick={() => handleRespond(notif.appointmentId._id, "accept", notif._id)}
                                            disabled={!!processingState}
                                        >
                                            {processingState?.id === notif._id && processingState.action === 'accept' ? (
                                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                            ) : (
                                                <Check className="h-4 w-4 mr-1" />
                                            )}
                                            Accept
                                        </Button>
                                        <Button 
                                            size="sm" 
                                            variant="destructive"
                                            className="w-full"
                                            onClick={() => handleRespond(notif.appointmentId._id, "decline", notif._id)}
                                            disabled={!!processingState}
                                        >
                                            {processingState?.id === notif._id && processingState.action === 'decline' ? (
                                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                            ) : (
                                                <X className="h-4 w-4 mr-1" />
                                            )}
                                            Decline
                                        </Button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
