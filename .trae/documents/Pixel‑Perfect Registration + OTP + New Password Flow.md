## Overview

* `app/doctor/chats/page.tsx` ka pura design (layout, sidebar, header, middle panel, chat window, input bar) copy karke `app/doctor/messages/page.tsx` mein apply karna; logic aur functionality same rehni hai.

## Key Differences

* Chats mein contact name `contact.name` hai; Messages mein `firstname` + `lastname` use hoga.

* Rendering pe har list/map ke agay `Array.isArray(...)` guards rahenge taake null se crash na ho.

## Implementation Steps

1. Imports align

* `Image`, `Switch`, aur icons: `Bell`, `ChevronDown`, `Grid`, `Calendar`, `MessageSquare`, `FileText`, `Stethoscope`, `Phone as PhoneIcon`, `MoreVertical` ko imports mein add/align.

1. Root layout & Sidebar

* Root container: `div.flex h-screen bg-[#F5F5F5]`.

* Left `aside` doctor-style: logo block (EXCELCONNECT + subline), nav links same styling; active link Messages: `href="/doctor/messages"`, label `Messages`.

1. Global header bar

* Center-top header: left search input, right side `Active Now` switch, `Bell` icon, profile avatar + name + chevron.

* Classes exactly doctor-style (`rounded-2xl`, `border-[#E5E7EB]`, `bg-white`).

1. Middle panel (conversation list)

* Card: `w-[360px] bg-white rounded-2xl border border-[#E5E7EB]`.

* Top search bar.

* Contact items: avatar via `<Image>`, name `{firstname} {lastname}`, `lastMessage`, `timestamp` (`format(new Date(...), "p")`), online dot.

1. Right panel (chat window)

* Header: selected contact avatar, name, last seen; buttons for audio/video call; search toggle.

* Messages list: `filteredMessages` map, bubble style doctor-style (`bg-[#9AC63F]` for own, `bg-white border` for others), voice/image/file/video rendering blocks same.

* Footer input bar: emoji, attach, camera, text field, send, voice record; hidden file inputs.

1. Logic preservation

* Existing hooks, state, handlers (`handleSelectContact`, `handleSend`, uploads, voice, delete, presence\`) untouched.

* Only JSX/markup/styling replace/update; array guards remain.

1. Verification

* Run `npx tsc --noEmit` for typecheck.

* Run `npm run dev` and open `http://localhost:3001/doctor/messages` to visually confirm sidebar + layout match doctor chats.

## Notes

* Nav labels: chats page shows `Chats`; messages page label will be `Messages` to match route.

* SSR safety: no change; page already client-side.

* No secrets or keys added.

## Deliverable

* Updated `app/doctor/messages/page.tsx` with doctor-style full design including left sidebar, without breaking functionality.

