## Goal
- Nayi page banani hai jismein PeerJS se chatting aur audio/video calling chale.

## Kyun Zaroori
- Direct P2P (peer-to-peer) se fast chat/call hota hai; server load kam; UX better.

## Route & Files
- Page route: `app/peer-chat/page.tsx`.
- Reuse existing context: `context/CallProvider.tsx` (Peer init, call controls).
- Simple components within page: ChatBox, ConnectPanel, VideoArea.

## PeerJS Setup
- Usi Peer ko use karna jo `PeerProvider` bana raha hai.
- Page par show: `myPeerId` (copy button) taake dusra banda aapka ID paste kare.
- Remote peer ID input: `remotePeerId` field.

## Chat (Data Connection)
- Function add: `openChatConnection(remoteId)` in `CallProvider`:
  - `dataConnRef.current = peer.connect(remoteId)`
  - `dataConnRef.current.on('open')` → status "Connected".
  - `dataConnRef.current.on('data', msg)` → messages list update.
- Function add: `sendChatMessage(text)`:
  - `dataConnRef.current.send({ type: 'text', text })`.
- Page UI:
  - Messages list (left/right bubble based on sender).
  - Input + send button.

## Audio/Video Calling
- Buttons: `Start Audio`, `Start Video`.
- Use existing context functions:
  - `startAudioCall(remotePeerId)`
  - `startVideoCall(remotePeerId)`
- Overlay: `CallOverlay` already UI dikhata hai (ringing, connected, mute, end).

## UI Design (Simple, Clean)
- Top: My Peer ID (copy), Remote Peer ID input, Connect button.
- Middle Left: Chat messages + input.
- Middle Right: Video area (remote video full, local picture-in-picture).
- Bottom: Call controls: Audio, Video.

## Error Handling
- Device check before call (already added):
  - Agar mic/camera missing → `unavailable` state.
  - Video call auto audio pe fallback agar camera missing.
- Chat connection retry: agar band ho jaye to user ko "Reconnect" button.

## Permissions & Env
- Run on HTTPS or `localhost` (media permissions ke liye).
- Browser se mic/cam allow karna hoga.

## Testing Steps
1. Page khol ke My Peer ID copy karein.
2. Dusra browser/device pe Remote Peer ID paste karke "Connect" karein.
3. Chat: text bhejein; dono taraf bubble show honi chahiye.
4. Audio call start karein; overlay par timer aur controls kaam karein.
5. Video call start karein; camera na ho to audio fallback; agar dono hon to video streams dikhein.
6. End call → overlay band, media tracks stop.

## Expected Result
- Real-time chat via PeerJS data channel.
- Audio/video calls reliable; fallback jab device na mile.

## Chhota Example (Flow)
- Remote Peer ID set → Connect → "Connected".
- Message "Salam" bheja → dusri side par bubble dikh gaya.
- Video call button → call overlay open, remote stream dikh gayi.

## Implementation Steps (Kaise karenge)
1. Naya page file `app/peer-chat/page.tsx` banayenge.
2. Page ko `PeerProvider` ke andar render hoga (layouts already wrap karte hain).
3. `CallProvider` mein 2 functions add karenge:
   - `openChatConnection(remoteId)`
   - `sendChatMessage(text)`
4. Page UI wire karenge:
   - My Peer ID display
   - Remote ID input + Connect
   - Chat list + input
   - Audio/Video buttons
5. Manual QA (do browsers/devices pe) karein.

Kya is plan par proceed karun? Confirmation dein; phir main file add karke pura feature wire kar deta hun.