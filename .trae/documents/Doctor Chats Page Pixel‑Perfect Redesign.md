## Goal
- Doctor Messages (Chats) page ko reference image ke mutabiq pixel‑perfect banana.

## Kyun
- Clear, professional UI; easy navigation; accessibility; cross‑device consistency.

## Kya Karna Hai (High‑Level)
1. Layout ko 2‑panel card design mein convert: left conversations list + right chat window.
2. Top bar: search field soft‑gray rounded, Active Now toggle, notifications, profile pill.
3. Left panel: search input, list items with avatar, name, timestamp, 3‑dots; hover shadow; active item highlight.
4. Right panel header: avatar + name + last seen; actions (video, phone, search) rounded ghost buttons.
5. Messages area: clean spacing, date stamp to the right, message bubble styles; image/video/file/voice message cards.
6. Composer: attachment icon left, large rounded input center, green send button right.
7. Responsive breakpoints: desktop ≥1024px, tablet 768–1023px, mobile ≤767px with collapsible sidebar.
8. Accessibility: roles, aria‑labels, focus rings, color contrast.
9. Smooth transitions: hover/focus/active states; micro animations for list/select.
10. TypeScript typing: Contact, Message, Conversation; prop types for small components.

## Detailed Implementation
### 1) Structure
- Wrapper: flex, gap‑6, rounded‑xl cards; background `#F9FAFB`.
- Left Card: `bg-white rounded-2xl border border-[#E5E7EB] p-6` width `lg:w-[420px]`, `md:w-[360px]`, `w-full` mobile.
- Right Card: `flex-1 bg-white rounded-2xl border border-[#E5E7EB] p-6`.

### 2) Top Bar (inside page)
- Search input: `rounded-2xl bg-[#F3F4F6] pl-12 py-3` with search icon; consistent with dashboard.
- Right cluster: Active Now + bell + profile pill (dark background) — same classes as dashboard for consistency.

### 3) Left Panel
- Local search field inside left card: soft‑gray rounded.
- Conversation item:
  - Layout: avatar 48px, name bold, timestamp right, 3‑dots button.
  - States: hover `bg-[#F9FAFB]`, active `bg-[#F3F4F6]` with left accent bar.
  - Unread badge: subtle gray pill when `unread>0`.
- Scroll area: custom thin scrollbar.

### 4) Right Header
- Leading: avatar + name (bold) + last seen (small gray).
- Trailing actions: 3 square ghost buttons (video, phone, search): `bg-[#F9FAFB] hover:bg-[#E5E7EB] rounded-xl p-2`.

### 5) Messages Content
- Date stamp: top‑right `text-[#6B7280]` small.
- Message bubble:
  - Sent: green theme `bg-[#9AC63F] text-white` with slight shadow.
  - Received: white bubble `border border-[#E5E7EB]` shadow‑sm.
  - Spacing: `max-w-[680px]` desktop, `lg:max-w-[540px]`, `md:max-w-[420px]`, `sm:max-w-[85%]`.
- Attachments:
  - Image/video: rounded thumb with overlay play icon.
  - File: icon + filename pill.
  - Voice: inline audio control styled.

### 6) Composer (Bottom)
- Container: `bg-[#F9FAFB] rounded-2xl p-4 border border-[#E5E7EB]`.
- Left: attachment button circle.
- Center: input `rounded-2xl bg-white border border-[#E5E7EB] pl-12 py-3 placeholder:text-[#9CA3AF]`.
- Right: send button pill `bg-[#9AC63F] hover:bg-[#85af34]` with plane icon.

### 7) Responsive Rules
- Desktop (≥1024): 2 columns; fixed left width; right flex.
- Tablet (768–1023): left `md:w-1/3`; right `md:w-2/3`; icons shrink, paddings reduce.
- Mobile (≤767): sidebar toggles; header shows back arrow; composer full width; messages list vertical.

### 8) Accessibility
- Buttons: `aria-label` for actions (video call, audio call, search, attach, send).
- Focus: `focus-visible:ring-2 ring-[#9AC63F]` and `rounded`.
- Color contrast: ensure AA contrast on text/background; avoid low‑contrast grays.
- Landmarks: `role="navigation"` for sidebar, `role="main"` for chat window.

### 9) Transitions & Performance
- Transitions: `transition-colors`, `duration-200`; avoid heavy animations.
- Virtualized list (optional later). For now, efficient renders and memoized small components.

### 10) Components & Typing
- Components to create/refactor inside same file (or separate):
  - `ConversationItem`, `ChatHeader`, `MessageBubble`, `Composer`.
- Types:
  - `type Contact = { _id: string; firstname:string; lastname:string; avatarUrl?:string; isOnline?:boolean; role?:string }`.
  - `type Message = { id:string|number; text?:string; type:"text"|"image"|"video"|"file"|"voice"|"missedCall"|"audioCall"|"videoCall"; url?:string; timestamp:string; sender?:{ _id:string } }`.
  - `type Conversation = { _id:string; participants:any[]; lastMessage:string; updatedAt:string; unread?:number }`.

### 11) Clean Code Practices
- Reuse existing hooks and state; no API changes.
- Keep styles Tailwind‑based; extract repeated classes into constants if needed.
- No inline styles except minor layout fixes.

## Milestones
1. Frame cards + top bar polish.
2. Left list item design + states.
3. Right header + actions.
4. Message bubble themes + attachments styling.
5. Composer + responsive tweaks.
6. Accessibility pass + transitions.
7. Cross‑browser spot check (Chrome, Edge, Firefox) + build.

## Verification Checklist
- Visual match to reference (padding, spacing, colors, typography).
- Interactions: hover/focus/active; sidebar toggle on mobile.
- Accessibility: keyboard navigation, labels, AA contrast.
- Performance: smooth scrolling, no jank.
- Responsiveness: desktop/tablet/mobile layouts verified.

## Note
- Ye plan UI changes only karta hai; business logic/hooks same rahenge. Confirm karein to main code implement karke preview dikhata hun.