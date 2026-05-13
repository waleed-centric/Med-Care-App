// components/ContactModal.tsx
"use client";

import { useState } from "react";
import { X, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Contact {
  email: string;
  firstname: string;
  lastname: string;
  id?: number;
  name?: string;
  role?: string;
  _id?: string;
  lastMessage?: string;
  timestamp?: string;
  unread?: number;
  avatar?: string;
  isOnline?: boolean;
  isGroup?: boolean;
  status: string;
}

interface ContactModalProps {
  open: boolean;
  onClose: () => void;
  contacts: Contact[];
  onSelectContact: (contact: Contact) => void;
}

export default function ContactModal({ open, onClose, contacts, onSelectContact }: ContactModalProps) {
  const [search, setSearch] = useState("");
  // console.log(contacts, "contacts");
  const filteredContacts = contacts?.filter((contact) => contact?.firstname?.toLowerCase().includes(search.toLowerCase()) || contact?.lastname?.toLowerCase().includes(search.toLowerCase()));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full rounded-2xl p-0">
        <DialogHeader className="flex justify-between items-center px-4 py-3 border-b">
          <DialogTitle className="text-lg font-semibold">New Chat</DialogTitle>
          <button onClick={onClose} className=" rounded hover:bg-gray-100">
            {/* <X className="w-5 h-5" /> */}
          </button>
        </DialogHeader>

        {/* Search Bar */}
        <div className="flex items-center gap-2 px-4 py-2 border-b">
          <Search className="w-4 h-4 text-gray-500" />
          <Input placeholder="Search contacts..." value={search} onChange={(e) => setSearch(e.target.value)} className="border-none focus:ring-0 shadow-none" />
        </div>

        {/* Contact List */}
        <div className="max-h-80 overflow-y-auto">
          {filteredContacts?.length > 0 ? (
            filteredContacts.map((contact) => (
              <div
                key={contact?._id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer"
                onClick={() => {
                  onSelectContact(contact); // Trigger handler
                  onClose(); // Close modal after selecting
                }}>
                <Avatar className="relative">
                  <AvatarImage src={contact.avatar} alt={contact.name} />
                  <AvatarFallback>
                    {contact?.firstname?.charAt(0)}
                    {contact?.lastname?.charAt(0)}
                  </AvatarFallback>
                  {contact?.isOnline ? <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div> : <div className="absolute bottom-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>}
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {contact?.firstname} {contact?.lastname}
                  </p>
                  <div className="flex justify-between items-center mt-1">
                    <p className={`text-xs text-black truncate capitalize ${contact?.role === "doctor" ? "bg-blue-300" : contact?.role === "marketer" ? "bg-green-300" : ""} rounded p-1`}>{contact?.role}</p>
                  </div>
                  {/* <p className="text-sm text-gray-500 truncate">{contact?.email}</p> */}
                </div>
                {/* {contact.online && <span className="w-3 h-3 bg-green-500 rounded-full" />} */}
              </div>
            ))
          ) : (
            <p className="p-4 text-gray-500 text-center">No contacts found</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
