## Goal
- "Connected" dikh raha hai lekin chat nahi ja rahi. Isko theek karna hai taake dono taraf messages aayein.

## Kyun Important
- PeerJS chat data channel per hoti hai. Agar sirf ek side connect kare aur dusri side incoming connection ko handle na kare, to receive/send nahi hota.

## Masla Kya Hai
- `peer.on('connection', ...)` listener missing hai (incoming data channel accept nahi ho rahi). Is wajah se remote side par dataConn set nahi hota, aur messages receive/send block ho jaate hain.

## Kaise Theek Karenge
1. **CallProvider mein incoming connection handle**
   - Add: `peer.on('connection', (conn) => { dataConnRef.current = conn; conn.on('open', setConnected=true); conn.on('data', msg => emitMessage(msg)); conn.on('close', setConnected=false); })`
   - Ek `emitMessage` function rakhenge jo chat page ko messages de.

2. **Context mein chat helpers expose**
   - `openChatConnection(remoteId)` → `peer.connect(remoteId)` kare, refs set kare.
   - `sendChatMessage(text)` → `dataConnRef.current.send({ type: 'text', text })`.
   - `onChatMessage` callback register karne ka method de (page subscribe kare).

3. **PeerChat page update**
   - Page `openChatConnection(remoteId)` aur `sendChatMessage(text)` use kare.
   - `onChatMessage` se incoming messages ko list mein add kare.
   - Agar remote pe sirf accept ho raha hai (no manual connect), tab bhi `peer.on('connection')` se auto connect ho jayega.

4. **Error/Retry**
   - `close/error` pe `connected=false`, Reconnect button enable.
   - Message send disabled jab tak `dataConnRef.current?.open` na ho.

5. **Verification**
   - Do browsers: A → copy MyPeerID; B → paste RemoteID; Connect.
   - A se message bheje → B par bubble aaye; B reply kare → A par bubble aaye.
   - Audio/Video buttons test; overlay play/mute/end sahi chale.

## Expected Result
- Chat dono taraf real-time chalegi; Connected/Disconnected states sahi reflect honge.

## Short Code Changes (Approval ke baad apply karunga)
- `context/CallProvider.tsx`
```ts
useEffect(() => {
  if (!newPeer) return;
  newPeer.on('connection', (conn) => {
    dataConnRef.current = conn;
    conn.on('open', () => setConnected(true));
    conn.on('data', (msg) => pushMessage(msg));
    conn.on('close', () => setConnected(false));
    conn.on('error', () => setConnected(false));
  });
}, []);

const openChatConnection = (remoteId: string) => {
  const conn = peer.connect(remoteId);
  dataConnRef.current = conn;
  // same open/data/close handlers as above
};

const sendChatMessage = (text: string) => {
  const conn = dataConnRef.current;
  if (conn?.open) conn.send({ type: 'text', text });
};
```
- `app/peer-chat/page.tsx`
```ts
// replace local connect/send with context: openChatConnection(remoteId), sendChatMessage(text)
// subscribe: onChatMessage((msg) => setChat([...chat, convert(msg)]))
```

Kya main ye changes apply karun? Approval milte hi implement karke test bhi kar dunga.