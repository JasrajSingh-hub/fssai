# StreetSanitation & VendorPass 🍲
> **AI-Powered FSSAI Compliance for Indian Street Food Vendors**
> *Speak in Hindi/Hinglish — Get your Vendor Pass in minutes*

---

## 🌐 Live Demo

| | URL |
|---|---|
| **Frontend (Submit This)** | https://nfssi.vercel.app |
| **Backend API** | https://zonal-unity-production-21fa.up.railway.app/api/v1/health |

---

## 🚀 Try It Now

1. Open **https://nfssi.vercel.app**
2. Click **"Try Demo"** — no registration needed
3. Type or speak your business in Hindi/Hinglish/English
   - Try: *"Main momo bechta hoon sector 17 pe"*
   - Try: *"Chai aur samosa ka thela chalata hoon"*
   - Try: *"I run a home tiffin kitchen"*
4. Complete the journey → get your QR Vendor Pass

---

## 📌 What We Built

India has 10M+ street food vendors who need FSSAI Basic Registration to operate legally. The FSSAI portal is English-only, full of legal jargon — most vendors skip it and risk fines.

**Our solution:** Vendor speaks naturally in Hindi/Hinglish → OpenAI GPT-4o-mini extracts structured business data → deterministic eligibility engine → hygiene checklist → digital QR Vendor Pass.

**OpenAI is the core.** It converts unstructured Hindi/Hinglish speech into structured regulatory data. Without it, the system cannot understand what a vendor sells.

---

## 🔄 Full Journey

```
1. Landing Page     → "Start My Application" or "Try Demo"
2. Intake Screen    → Speak/type in Hindi, Hinglish, or English
3. AI Extraction    → GPT-4o-mini extracts business type + food categories
4. Business Review  → Confirm or edit the extracted data
5. Eligibility      → Deterministic engine → Basic Registration ₹100/yr
6. Hygiene Audit    → 6-item Schedule 4 self-audit checklist
7. Document Upload  → Synthetic stall photo (demo generator built-in)
8. Mock Payment     → ₹100 simulation (no real money)
9. QR Vendor Pass   → Digital pass with scannable QR code
10. Pass Verify     → Public URL to verify any pass
```

---

## 🤖 How OpenAI is Used

```
Vendor says: "Main momo bechta hoon sector 17 chawk pe"
                        ↓
        GPT-4o-mini (backend only, strict JSON schema)
                        ↓
  {
    "kind_of_business": "street_food_vendor",
    "food_categories": ["Momos / Dumplings", "Street Snacks"],
    "business_description": "Momo stall at Sector 17 Chawk",
    "language": "Hinglish",
    "missing_information": ["Water source", "Waste disposal"]
  }
                        ↓
    Deterministic eligibility engine (no AI for legal decisions)
                        ↓
    FSSAI Basic Registration → ₹100/yr → Form A → QR Pass
```

---

## 🧪 What's Mocked vs Real

| Feature | Status |
|---|---|
| OpenAI language extraction | ✅ REAL — GPT-4o-mini |
| FSSAI eligibility engine | ✅ REAL — deterministic rules |
| Schedule 4 hygiene checklist | ✅ REAL — actual FSSAI standard |
| MongoDB data persistence | ✅ REAL — Atlas cloud DB |
| ₹100 Payment | 🟡 MOCK — button simulation, no UPI/card |
| OTP verification | 🟡 MOCK — auto session |
| Aadhaar / PAN | 🟡 MOCK — explicitly blocked, zero PII |
| Government DB lookup | 🟡 MOCK — synthetic IDs only |
| Document verification | 🟡 MOCK — canvas-generated watermarked image |

---

## 🛠️ Tech Stack

### Frontend
- Next.js 14 (App Router) + Tailwind CSS
- Mobile-first (360px+), works on Android Chrome
- Voice input via Web Speech API (Hindi/Hinglish/English)
- QR Code generation via `qrcode.react`
- Deployed on **Vercel**

### Backend
- Node.js + Express + TypeScript
- MongoDB Atlas + Mongoose
- JWT authentication
- OpenAI Node.js SDK (`gpt-4o-mini`)
- Deterministic fallback parser (offline keyword matching)
- Deployed on **Railway**

---

## 🔐 Security & Civic Tech Guardrails

1. **Zero Real PII** — No Aadhaar, PAN, bank details collected or stored
2. **Backend-Only OpenAI** — API key never exposed to browser
3. **Deterministic Legal Decisions** — AI only interprets language, never makes regulatory decisions
4. **Sanitized QR Payload** — QR codes encode only synthetic non-sensitive references
5. **No Financial Gateways** — 100% simulated payments
6. **Civic Prototype Disclaimer** — Every screen prominently shows this is not an official government service

---

## 📡 API

Base URL: `https://zonal-unity-production-21fa.up.railway.app/api/v1`

| Method | Route | Purpose |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/auth/register` | Register vendor |
| POST | `/auth/login` | Login |
| POST | `/intake/analyze` | AI language intake ← OpenAI here |
| GET | `/applications/:id` | Get application |
| POST | `/applications/:id/check-eligibility` | Eligibility check |
| PATCH | `/applications/:id/hygiene` | Submit hygiene audit |
| POST | `/applications/:id/payment/simulate` | Mock payment |
| POST | `/applications/:id/pass` | Generate QR pass |
| GET | `/vendor-pass/:passId` | Public pass verification |

---

## 📄 License
Built for hackathon and civic tech demonstration purposes.
Independent Civic UX Prototype — NOT AN OFFICIAL FSSAI SERVICE.
