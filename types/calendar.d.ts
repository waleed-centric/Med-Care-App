export interface Event {
  id: string;
  title: string;
  clientName: string;
  preferredDate: string;
  preferredTime: string;
  location: string;
  address: string;
  image?: string;
  age: string;
  sex: "male" | "female";
  signature?: string;
  type: "client-meeting" | "festival" | "staff-meeting" | "general-meeting";
  description: string;
}

export interface CalendarEvent extends Event {
  start: Date;
  end: Date;
}
