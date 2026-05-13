## Goal
- Submit pe aur form fill ke dauran complete form ka JSON banana aur **state** mein rakhna, jismein har field hamesha nazar aaye (missing ho to `null` ya empty defaults), files bhi (avatar + multiple certificates) base64 ke sath.

## Kyun Zaroori
- Debug/verify asaan hota hai jab har field consistently dikh rahi ho, chahe user ne fill na kiya ho. Is se API contract clear rehta hai.

## Implementation
1. **Types aur Defaults**
- `FullDoctorRegistrationPayload` type define karen (firstname, lastname, middlename, dateOfBirth, phone, email, password, confirmPassword, address{street, streetLine2, city, region, postalCode, country}, specialization, workExperience, services[], education, about, avatarFile{ name,size,type,base64 } | null, certificates[] of same file object, role).
- `defaultPayload` object banayein jismein sab fields present hon (strings "", arrays `[]`, files `null`).

2. **React State**
- `const [debugPayload, setDebugPayload] = useState<FullDoctorRegistrationPayload>(defaultPayload)` add karein.

3. **Helpers**
- `fileToBase64(file: File)` aur `filesToBase64(files: File[])` helpers rakhein.
- `normalizeValuesToPayload(v)` function likhein:
  - `v = form.getValues()` se values lein.
  - Har field ko defaults ke sath merge karein (agar missing ho to default). 
  - `avatarFile` ko `{name,size,type,base64}` banayein; agar na ho to `null`.
  - `certificates` ko array banaein (multiple support), har file ko `{name,size,type,base64}`.

4. **Live Update**
- `useEffect(() => { const sub = form.watch(async () => setDebugPayload(await normalizeValuesToPayload(form.getValues()))); return () => sub.unsubscribe(); }, [])` taake har change pe state update ho.

5. **Submit & Buttons**
- Submit pe: `const payload = await normalizeValuesToPayload(form.getValues()); setDebugPayload(payload); console.log(JSON.stringify(payload, null, 2));`.
- Ek `Debug` button bhi rakhein: click pe current normalized payload console.log + state update.

6. **UI (Optional)**
- Chhota toggle/addon: "Show Debug JSON" → `<pre>{JSON.stringify(debugPayload, null, 2)}</pre>` taake UI me bhi dekha ja sake. By default hidden.

## Expected Result
- Console aur state mein hamesha full payload milega: missing fields `null`/"" set honge; files base64 ke sath aayengi; certificates multiple handle honge.

## Short Example
- `debugPayload`:
```
{
  firstname: "", lastname: "", middlename: "",
  address: { street: "", streetLine2: "", city: "", region: "", postalCode: "", country: "" },
  services: [], education: "", about: "",
  avatarFile: null,
  certificates: [],
  role: "doctor"
}
```

## Steps to Apply (Code)
1. Type + `defaultPayload` add karein.
2. `useState(debugPayload)` add karein.
3. Helpers (base64 + normalize) add karein.
4. `form.watch` subscription se `setDebugPayload` live update karein.
5. Submit & Debug button par `normalizeValuesToPayload` use karke `console.log` karein.

Confirm kar dein — phir mein ye changes implement kar ke verify kar dunga.