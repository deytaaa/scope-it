# Project: AI project-intake chat

A web app that replaces a static requirements form with a conversational AI agent. The agent acts like an experienced project consultant, asks follow-up questions one at a time, extracts structured data as the conversation progresses, and generates a review-ready project summary once enough information has been gathered.

Placeholder name used in this doc: `scope-it`. 

---

## 1. Tech stack

- **Frontend + backend:** Next.js (App Router). Route Handlers serve as the Node.js backend — no separate backend service.
- **Database:** PostgreSQL. One table for messages, one for the structured requirements record (relational columns + a `JSONB` column for flexible fields).
- **ORM:** Prisma.
- **AI:** Google Gemini API via `@google/genai`. Model is `gemini-2.5-flash`, but **must be read from an environment variable, never hardcoded** — see note in Section 4.
- **Hosting:** Vercel (app) + Supabase (managed Postgres).
- **Notifications:** Resend (email) when a summary is ready for review.
- **Rate limiting:** Upstash Redis (per-IP session and message caps).

---

## 2. Folder structure

```
/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                    # landing page (hero + start chat)
│   ├── chat/
│   │   └── [sessionId]/page.tsx    # conversation UI
│   ├── admin/
│   │   ├── page.tsx                # list of submissions
│   │   └── [id]/page.tsx           # single submission detail
│   └── api/
│       ├── session/route.ts        # POST — create a new session
│       ├── chat/route.ts           # POST — send a message, get next question
│       └── summary/[id]/route.ts   # GET — fetch a generated summary
├── lib/
│   ├── db.ts                       # Prisma client singleton
│   ├── gemini.ts                   # Gemini client wrapper
│   ├── requirements-schema.ts      # JSON schema used for structured output
│   ├── completion-check.ts         # backend-owned "is this done?" logic
│   ├── notify.ts                   # Resend email trigger
│   └── rate-limit.ts               # Upstash rate limiter
├── prisma/
│   └── schema.prisma
├── components/
│   ├── chat/
│   │   ├── ChatWindow.tsx
│   │   ├── MessageBubble.tsx
│   │   └── ChatInput.tsx
│   ├── landing/
│   │   ├── Hero.tsx
│   │   └── CoverageCards.tsx
│   └── ui/                         # Pill, Card, KbdBadge, etc.
├── styles/
│   └── globals.css                 # design tokens as CSS variables
├── .env.local
└── package.json
```

---

## 3. Environment variables

```
# Pooled connection (Supavisor, port 6543) — used by the app at runtime
DATABASE_URL="postgres://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct connection (port 5432) — used only by Prisma CLI for migrations
DIRECT_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"

GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash

RESEND_API_KEY=
ADMIN_NOTIFICATION_EMAIL=

UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

**Important note on `GEMINI_MODEL`:** Gemini 2.5 Flash has a published shutdown date and there have been reports of early/intermittent outages ahead of that date. Do not hardcode the model string anywhere in the codebase — always read `process.env.GEMINI_MODEL` through `lib/gemini.ts`. If 2.5 Flash becomes unreliable, swapping to `gemini-3.5-flash` or `gemini-3.1-flash-lite` should require changing this one value only.

---

## 4. Database schema (Prisma)

Supabase's pooler (Supavisor) is required on Vercel — serverless functions open a new connection per invocation, and a direct connection will exhaust Supabase's connection limit under load. Runtime queries go through the pooled URL; only `prisma migrate` uses the direct one.

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")   // pooled — used by Prisma Client at runtime
  directUrl = env("DIRECT_URL")     // direct — used only by `prisma migrate`
}

generator client {
  provider = "prisma-client-js"
}

model Session {
  id           String        @id @default(cuid())
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  status       String        @default("active") // active | complete | abandoned
  contactEmail String?
  messages     Message[]
  requirement  Requirement?
}

model Message {
  id        String   @id @default(cuid())
  sessionId String
  session   Session  @relation(fields: [sessionId], references: [id])
  role      String   // "user" | "assistant"
  content   String
  createdAt DateTime @default(now())
}

model Requirement {
  id              String   @id @default(cuid())
  sessionId       String   @unique
  session         Session  @relation(fields: [sessionId], references: [id])

  projectType     String?
  purposeGoals    String?
  targetAudience  String?
  coreFeatures    Json?    // string[]
  designPrefs     Json?    // { style, colors, inspirationUrls: string[] }
  brandingAssets  Json?    // { hasLogo, hasContent, notes }
  techStack       String?
  timeline        String?
  budget          String?
  additionalNotes String?

  isComplete      Boolean  @default(false)
  summaryMarkdown String?
  updatedAt       DateTime @updatedAt
}
```

**Note for `lib/db.ts`:** Supabase's pooler runs in transaction mode, which doesn't support prepared statements. If connection errors show up under load, add `?pgbouncer=true` to `DATABASE_URL` (already included above) and keep the Prisma client a singleton (`globalThis` pattern) so dev-mode hot reloads don't spawn extra connections.

---

## 5. AI integration — structured output

Every turn, call Gemini with the full conversation history plus this response schema (via `responseSchema` + `responseMimeType: "application/json"`). This guarantees valid, parseable JSON — never regex-parse a free-text reply.

```json
{
  "type": "object",
  "properties": {
    "reply_to_user": { "type": "string" },
    "next_question": { "type": "string" },
    "extracted_fields": {
      "type": "object",
      "properties": {
        "projectType": { "type": "string" },
        "purposeGoals": { "type": "string" },
        "targetAudience": { "type": "string" },
        "coreFeatures": { "type": "array", "items": { "type": "string" } },
        "designPrefs": { "type": "string" },
        "brandingAssets": { "type": "string" },
        "techStack": { "type": "string" },
        "timeline": { "type": "string" },
        "budget": { "type": "string" },
        "additionalNotes": { "type": "string" }
      }
    },
    "model_thinks_complete": { "type": "boolean" }
  },
  "required": ["reply_to_user", "extracted_fields", "model_thinks_complete"]
}
```

Only include a field in `extracted_fields` when the user's latest message actually provided new or updated information for it — merge into the existing `Requirement` row rather than overwriting the whole object.

**System prompt for the agent persona should instruct it to:**
- Act like an experienced project consultant — warm, professional, curious.
- Ask exactly one question per turn.
- If an answer is vague (e.g. "make it modern"), ask a sharper follow-up instead of guessing — never fill in `extracted_fields` from an assumption.
- Never ask about a field that's already filled unless clarifying an existing vague answer.

---

## 6. Completion logic (backend-owned, not model-owned)

Do not let `model_thinks_complete` alone decide when to stop. Treat it as a hint; validate against a hard checklist in `lib/completion-check.ts`:

```
REQUIRED_FIELDS = [
  "projectType",
  "purposeGoals",
  "targetAudience",
  "coreFeatures",
  "designPrefs",
]

OPTIONAL_BUT_ASK_ONCE = [
  "brandingAssets",
  "techStack",
  "timeline",
  "budget",
]
```

A session is only eligible for summary generation when every field in `REQUIRED_FIELDS` is non-empty **and** every field in `OPTIONAL_BUT_ASK_ONCE` has either a value or an explicit "skip" from the user. This prevents both premature summaries and infinite loops.

**Hard cap:** stop the conversation and force summary generation at 25 user turns regardless of completeness, to control cost and prevent runaway sessions. Mark such sessions clearly (e.g. `status: "complete-partial"`) so partial info is visible in the admin view.

---

## 7. Conversation flow

1. User lands on `/`, starts a session → `POST /api/session` creates a `Session` row, redirects to `/chat/[sessionId]`.
2. User sends a message → `POST /api/chat` with `{ sessionId, message }`.
3. Handler: save the user `Message`, call Gemini with history + schema, save the assistant `Message`, upsert `extracted_fields` into `Requirement`.
4. Run `completion-check.ts`. If not complete, return `reply_to_user` + `next_question` to the client.
5. If complete (or turn cap hit), generate a markdown summary from the `Requirement` row, save to `summaryMarkdown`, set `status: "complete"`, trigger `lib/notify.ts`.
6. Admin sees the notification, opens `/admin/[id]` to review.

Summary should include: project title, overview, business objectives, target audience, full feature list, design preferences, technical requirements, timeline/budget if provided, and additional notes — generate this as a deterministic template filled from the `Requirement` row, not a fresh free-text model call, so it can't drop or invent details.

---

## 8. Rate limiting and abuse protection

In `lib/rate-limit.ts`, using Upstash:
- Max 5 new sessions per IP per hour.
- Max 25 messages per session (see turn cap above).
- Reject requests exceeding these with a plain 429 and a friendly client-side message — don't expose internals.

---

## 9. Design system

Dark, monospace, high-contrast, minimal — no accent color, restraint over decoration.

**Tokens (`styles/globals.css`):**

```css
:root {
  --bg-page: #0a0a0a;
  --bg-card: #111111;
  --bg-chrome: #151515;
  --border: #262626;
  --text-primary: #f5f5f5;
  --text-secondary: #8a8a85;
  --text-muted: #5a5a55;
  --radius-card: 8px;
  --radius-pill: 20px;
  --font-mono: "JetBrains Mono", ui-monospace, "SF Mono", monospace;
}
```

**Typography:** monospace throughout, including body copy — not just code. Load `JetBrains Mono` via `next/font/google`. Sentence case everywhere, no title case, no all-caps except intentional labels.

**Component patterns:**
- **Pill CTA button** — solid `--text-primary` fill, `--bg-page` text, `border-radius: var(--radius-pill)`. Used for primary actions like "start a conversation."
- **Bordered card** — `background: var(--bg-card)`, `border: 0.5px solid var(--border)`, `border-radius: var(--radius-card)`, padding `14px 16px`. No shadows, no gradients.
- **Kbd badge** — small bordered rounded rect (e.g. `↵`) for keyboard hints next to inputs.
- **Chat input row** — bordered rect matching card style, placeholder text in `--text-muted`, submit hint (`↵`) right-aligned.

**Layout:** generous whitespace, no dense chrome. The landing page hero should read almost identically to the mockup already produced in this conversation — headline, subtext, chat input preview, and a 3-card "what we'll cover" grid (project basics / features and design / logistics).

**What to avoid:** any accent color beyond the grayscale palette above, drop shadows, gradients, rounded corners on single-sided borders, disabled-looking buttons.

---

## 10. Admin view

- `/admin` — table of sessions: status, created date, project type (if known), link to detail.
- `/admin/[id]` — renders `summaryMarkdown`, plus raw `Requirement` fields and full message transcript for context. No public auth needed at MVP stage if the route is unlisted, but plan for basic password gate (`ADMIN_PASSWORD` env var + simple middleware check) before real traffic.

---

## 11. Build order (suggested milestones)

Backend first, fully tested, before any UI is built. The frontend is just a client for an API that already works.

**Phase 1 — scaffold**
1. Scaffold Next.js + Prisma + Postgres connection. Run the migration for `Session`/`Message`/`Requirement` and confirm the tables exist in the database (`prisma studio` or a direct query).

**Phase 2 — backend, end to end**
2. Build `lib/db.ts` (Prisma client singleton).
3. Build `lib/gemini.ts` and `lib/requirements-schema.ts` — the Gemini client wrapper and the structured-output schema from Section 5. Test in isolation first: a throwaway script that sends one hardcoded message and confirms the JSON response matches the schema, before wiring it into any route.
4. Build `lib/completion-check.ts` (Section 6). Unit-test it directly with a few fake `Requirement` objects — some incomplete, some complete, one hitting the turn cap — and confirm it returns the right verdict for each, without needing a real API call.
5. Build `POST /api/session` and `POST /api/chat`. Test with `curl` or a REST client, not the browser:
   - Create a session, confirm a row appears in `Session`.
   - Send a sequence of messages simulating a full conversation, confirm `Message` rows accumulate and `Requirement` fields populate correctly turn by turn.
   - Confirm the route stops advancing and flips `status: "complete"` once `completion-check.ts` is satisfied.
6. Build deterministic summary generation and `GET /api/summary/[id]`. Test against a `Requirement` row seeded directly in the database, and separately against the completed session from step 5.
7. Build `lib/rate-limit.ts` and wire it into `/api/session` and `/api/chat`. Test by exceeding the caps deliberately and confirming a 429 comes back.
8. Build `lib/notify.ts`. Test by manually flipping a session to `status: "complete"` and confirming the email fires.

At the end of Phase 2, the whole backend should be exercisable with nothing but `curl`/a REST client — a full conversation from session creation to summary to notification, with no frontend involved.

**Phase 3 — frontend**
9. Build design tokens + landing page (`/`) matching Section 9.
10. Build the chat UI (`/chat/[sessionId]`) — message list + input, calling the already-tested `/api/chat`.
11. Build `/admin` and `/admin/[id]`, reading from the already-tested `/api/summary/[id]`.

**Phase 4 — hardening**
12. Add basic admin auth gate before going live.