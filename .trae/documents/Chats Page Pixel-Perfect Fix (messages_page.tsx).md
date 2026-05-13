## Goal
- Chats page ko reference image jaisa bilkul pixel‑perfect banana.

## Reason
- Abhi layout duplicate aur messy hai; user experience weak hai.

## Issues Found (short)
- Duplicate chat panel: lines ~666–708 “Chat Card” aur ~712–990 “Right Main Chat Window” — do headers aajate hain.
- Messages section mein image block duplicate (lines ~799–803 aur ~809–813).
- Contact list badges/timestamps styling reference se different.
- Top bar spacing/search pill aur "Active Now" toggle styling mismatch.

## Kaise Karenge (actions)
1. Duplicate chat header hatao
- lines ~666–708 ka "Chat Card" block remove.
- Sirf "Right Main Chat Window" ko rakho taake single chat pane ho.

2. Image block duplicate clean-up
- messages rendering se second image block (lines ~809–813) delete, pehla hi rehne do.

3. Top bar polish
- Search input: `rounded-2xl bg-[#F3F4F6] px-4 py-3`, icon left absolute, focus ring.
- "Active Now" Switch: checked color `#9AC63F`, spacing exactly like screenshot.
- Profile pill: dark bg `#111827`, avatar 32px, ChevronDown.

4. Conversations card styling
- Card title "Conversations" aur right plus button.
- List row: avatar 48px, online dot, name bold, right timestamp (`format(..., "p")`).
- Subtext: call type ("audio call"/"video call") as light gray; role badge "Marketer" green pill.
- Selected row bg `#F3F4F6`.

5. Chat header exact look
- Name uppercase style (e.g., CHANTAL JARRELL), subtext "Last seen recently".
- Right icons: phone, video, search — rounded xl, light gray bg.

6. Message bubbles theme
- Sent bubbles green `#9AC63F` white text, rounded‑xl, shadow‑sm.
- Call chips (video/audio): icon + label inside bubble, tap‑to‑dial when recipientPeerId hai.
- Timestamp + check/double‑check icons alignment right.

7. Composer
- Left: emoji, attach, camera options as rounded‑xl.
- Input white border `#E5E7EB`, send button solid green.
- Voice note state: record/red pulse, then preview + send/delete.

8. Mobile behavior
- Back button show on md<, sidebar hide jab chat open; existing logic rehne de (showSidebar toggles).

9. Accessibility
- Sab buttons par `aria-label`, focus-visible rings; color contrast AA maintain.

10. Verification steps
- Run build, open preview, widths check: left list `md:w-[360px] lg:w-[420px]`, right flex‑1.
- Scroll behavior: only right pane scrolls messages.
- Cross‑browser quick check (Chrome/Edge).

## Code Changes (diff-style examples)
- Remove duplicate chat header:
```tsx
// DELETE this block entirely
{selectedContact && (
  <div className="...">  // lines ~666–708
    ...
  </div>
)}
```
- Remove second image block:
```tsx
// DELETE duplicate
{message?.type === "image" && message?.url && (
  <Link ...>
    <img ... />
  </Link>
)} // lines ~809–813
```
- Minor class tweaks where noted (search, switches, pills) to match colors/spacing.

## Expected Result
- Single, clean chat layout; left conversations + right chat exactly like reference.
- No weird duplicate headers; bubbles/chips consistent; interactions smooth.

## Example
- After fix: header shows "CHANTAL JARRELL" with call/search icons; right side bubbles green with video/audio labels and check marks; left list shows timestamps and "Marketer" badge.