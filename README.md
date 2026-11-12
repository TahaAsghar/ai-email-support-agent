# AI Email Support Agent

An automated AI-powered customer support agent built for **BaristaCraft** (an e-commerce coffee gear retailer). It automatically polls Gmail for new customer emails, runs guardrail checks, classifies queries using LLM triage agents, queries a PostgreSQL-backed Knowledge Base, applies business decision logic, auto-replies to answerable questions, and escalates complex queries (e.g. damages, refund requests, safety issues) to human support agents. It also includes an admin web dashboard built with React for managing tickets, events, and knowledge base entries.

---

## Key Features

- 📧 **Gmail Integration**: Automatically checks inbox, handles message threads, labels processed messages (`ai-processed`), and applies escalation tags (`needs-human`).
- 🛡️ **Guardrails & Filters**: Filters out sent emails, internal messages, automated out-of-office replies, and bulk/junk mailing lists.
- 🤖 **Two-Stage AI Agent Architecture (PydanticAI)**:
  - **Classifier / Triage Agent**: Categorizes messages into product sections (espresso machines, coffee grinders, shipping, returns/warranty) and flags always-escalate conditions (safety issues, refund demands, legal threats, etc.).
  - **Support Agent**: Dynamically inspects the database knowledge base to draft accurate, brand-compliant plain text responses without making forbidden promises (e.g., promising unapproved refunds or dates).
- ⚙️ **Rules Engine & Decision Pipeline**: Evaluates product issues against defined resolution paths (e.g., pressure-checks, replacement parts, or full replacements) before deciding whether to reply directly or escalate to human support.
- 🗄️ **PostgreSQL Database & Event Tracking**: Stores customer tickets, incoming/outgoing message history, event processing logs with retry mechanisms, and knowledge base entries.
- 💻 **Admin Dashboard UI**: Built with React 19, Vite, TypeScript, and Tailwind CSS for real-time monitoring of tickets, processing logs, manual polling triggers, and an inline Knowledge Base editor.
- 📊 **FastAPI Dashboard Backend**: Exposes REST endpoints protected with HTTP Basic Authentication and serves the production-built React dashboard.
- ⏱️ **Automated Poller**: Polling loop that continuously processes new inbox messages based on configured polling intervals.

---

## Project Structure

```text
ai-email-support-agent/
├── app/
│   ├── ai/
│   │   ├── agent.py          # Support Agent (KB inspection, reply generation & validation)
│   │   ├── classifier.py     # Triage Agent (email classification & human escalation detection)
│   │   ├── descision.py      # Core decision pipeline combining AI & business rules
│   │   ├── rules.py          # Business logic for issue resolution & next steps
│   │   └── schemas.py        # Pydantic models for structured agent outputs & decisions
│   ├── db.py                 # PostgreSQL connection & query operations (psycopg3)
│   ├── gmail.py              # Gmail API wrapper (messages, threads, labels, replies)
│   ├── guardrails.py         # Filters for skipping auto-replies, bulk mail, and internal messages
│   ├── main.py               # FastAPI application with API routes & static dashboard mounting
│   ├── pipeline.py           # Message processing workflow and state management
│   └── poller.py             # Periodic background poller for fetching new Gmail messages
├── frontend/                 # Admin Dashboard Frontend (React 19 + Vite + TypeScript + Tailwind)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── tickets.tsx        # Ticket history & message viewer page
│   │   │   ├── events.tsx         # Processing event log viewer
│   │   │   ├── knowledge-base.tsx # Knowledge Base view & inline editor
│   │   │   └── login.tsx          # Basic Auth login screen
│   │   ├── lib/              # API client and type definitions
│   │   ├── App.tsx           # Main App router and authentication state
│   │   └── main.tsx          # Application entry point
│   ├── dist/                 # Production web build (served by FastAPI)
│   ├── vite.config.ts        # Vite configuration & backend proxy settings
│   └── package.json          # Frontend dependencies & scripts
├── scripts/
│   ├── get_refresh_token.py  # OAuth helper script to obtain Google refresh tokens
│   └── gmail_checker.py      # CLI script for testing single email retrieval & reply
├── playground/
│   └── try_pipeline.py       # Playground script for testing the decision pipeline locally
├── config.py                 # Application settings managed via Pydantic BaseSettings
├── pyproject.toml            # Project dependencies and script entry points
└── .env.example              # Example environment variables template
```

---

## Environment Configuration

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

| Variable | Description |
| --- | --- |
| `GOOGLE_CLIENT_ID` | Google OAuth 2.0 Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 2.0 Client Secret |
| `GOOGLE_REFRESH_TOKEN` | OAuth Refresh Token for Gmail API access |
| `DATABASE_URL` | PostgreSQL connection string |
| `CLASSIFIER_MODEL` | LLM model identifier for email classification |
| `AGENT_MODEL` | LLM model identifier for support agent reply generation |
| `BASE_URL` | Base URL for LLM provider API |
| `API_KEY` | API key for LLM provider API |
| `POLL_INTERVAL_SECONDS` | Polling frequency in seconds (default: `30`) |
| `DASHBOARD_USERNAME` | Username for accessing the FastAPI dashboard endpoints |
| `DASHBOARD_PASSWORD` | Password for accessing the FastAPI dashboard endpoints |

---

## Setup & Installation

1. **Install Backend Dependencies**:
   This project uses [`uv`](https://github.com/astral-sh/uv) or standard Python package managers:
   ```bash
   uv sync
   ```

2. **Install Frontend Dependencies & Build Dashboard**:
   ```bash
   cd frontend
   npm install
   npm run build
   cd ..
   ```

3. **Set up Gmail API Credentials**:
   Run the helper script to complete OAuth authorization and generate your `GOOGLE_REFRESH_TOKEN`:
   ```bash
   uv run python scripts/get_refresh_token.py
   ```

4. **Database Migration**:
   Apply the SQL migration located in `supabase/migrations/` to your PostgreSQL instance.

---

## Running the Application

### 1. Run the Gmail Poller
To start polling Gmail for incoming customer messages:
```bash
uv run python -m app.poller
```

### 2. Run the FastAPI Server & Admin Dashboard
To start the backend web server (which serves API routes and mounts the built frontend dashboard at `http://localhost:8000`):
```bash
uv run uvicorn app.main:app --reload
```

### 3. Run Frontend Development Server (Optional)
For active frontend development with Hot Module Replacement (HMR):
```bash
cd frontend
npm run dev
```
*(Vite automatically proxies `/api` calls to `http://127.0.0.1:8000`).*

### 4. Test the Decision Pipeline Locally
Run the playground test script:
```bash
uv run python playground/try_pipeline.py
```
