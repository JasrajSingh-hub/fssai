# Project Context

## What This Repo Is

`Nfssi` is a hackathon-style civic tech prototype for Indian street food vendors. The app helps vendors describe their business in Hindi, Hinglish, or English and turns that into a guided FSSAI-style registration flow.

The core idea is:

1. Take natural language input from a vendor.
2. Use OpenAI on the backend to extract structured business details.
3. Run deterministic eligibility and hygiene checks.
4. Generate a mock payment flow and a QR-based vendor pass.

This is not an official government service.

## Main User Flow

The intended journey is:

1. Landing page
2. Intake screen for voice or text input
3. AI extraction and business review
4. Eligibility check
5. Hygiene checklist
6. Document upload or synthetic demo asset
7. Mock payment
8. Vendor pass generation
9. Public pass verification

## Repository Layout

- `frontend/`: Next.js app router frontend
- `backend/`: Express + TypeScript API
- `README.md`: high-level product overview and live links
- `PROJECT_STATUS.md`: build status and remaining tasks

## Frontend

The frontend lives in `frontend/src/app` and uses:

- Next.js 14 App Router
- Tailwind CSS
- Mobile-first layouts
- Voice input through the Web Speech API
- QR code generation for the pass screen

Key pages include:

- `frontend/src/app/page.tsx`: landing page
- `frontend/src/app/intake/page.tsx`: intake flow
- `frontend/src/app/review/page.tsx`: AI review and edit step
- `frontend/src/app/hygiene/page.tsx`: hygiene checklist
- `frontend/src/app/payment/page.tsx`: mock payment step
- `frontend/src/app/vendor-pass/page.tsx`: pass generation
- `frontend/src/app/verify-pass/[passId]/page.tsx`: public verification

## Backend

The backend lives in `backend/src` and provides:

- Authentication routes
- Intake analysis routes
- Application and eligibility routes
- Hygiene and payment routes
- Vendor pass generation and verification routes

Important implementation pieces:

- `backend/src/services/ai.service.ts`: OpenAI extraction logic
- `backend/src/services/eligibility.service.ts`: deterministic registration rules
- `backend/src/services/hygiene.service.ts`: hygiene checklist logic
- `backend/src/services/payment.service.ts`: mock payment flow
- `backend/src/services/vendorPass.service.ts`: QR pass generation

## Data Model

The backend uses MongoDB/Mongoose models for:

- `User`
- `Application`
- `Payment`
- `VendorPass`

The project is designed to avoid collecting real sensitive information such as Aadhaar or PAN.

## Testing

There are backend test files under `backend/test` covering:

- auth flow
- intake
- eligibility
- hygiene
- payment
- verification
- end-to-end behavior

## Deployment

The project appears to be deployed as:

- Frontend: Vercel
- Backend: Railway

The README and status file both mention live URLs and deployment details.

## Editing Notes

- Keep the AI role narrow: extraction only, not legal decisions.
- Preserve the mock-vs-real boundary described in `README.md`.
- If you change flow or domain language, update this file and `README.md` together.
- If you add a new major page or API route, document it here so future work has a quick map.

