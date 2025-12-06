# 🚚 Frontend for EC2-based Serverless Execution Platform

## "Lambda Execution as a Delivery Journey" UI

### Overview

This frontend provides a real-time, visual, highly transparent interface for a Lambda-like FaaS platform running on EC2 Runner Pools.

Unlike AWS Lambda's opaque execution pipeline, this UI shows each execution step as a parcel-delivery journey, making debugging and monitoring intuitive and engaging.

The goal is to build a developer-friendly dashboard that visualizes complex execution flows through storytelling.

---

## Core UX Concept

**Every function execution = One parcel delivery journey.**

| Execution State | Delivery Metaphor | UI Representation |
|----------------|-------------------|-------------------|
| `REQUEST_RECEIVED` | Pickup Requested | Delivery start card + timestamp |
| `CODE_FETCHING` | Sorting Center | Conveyor belt / sorting icon animation |
| `SANDBOX_PREPARING` | Warehouse Processing | Preparation animation + status highlight |
| `EXECUTING` | In Transit | Animated truck moving across a timeline |
| `COMPLETED` | Delivered | Success badge + completion node |
| `FAILED` / `TIMEOUT` | Delivery Incident | Error node + failure details |

---

## Frontend Objectives

- Provide full transparency of execution steps
- Create an intuitive state machine → delivery journey mapping
- Show real-time status updates via SSE/WebSocket
- Offer a visual debugging experience with timeline, logs, and metrics
- Build a clean, modern, DevOps-style UI optimized for engineers

---

## Main Screens & Their Roles

### 1. Dashboard

**Purpose**
- Real-time overview of recent function runs.

**Key UI elements**
- Execution summary metrics (success rate, avg. latency, etc.)
- "Parcel cards" representing recent runs
- Real-time feed (SSE/WebSocket)
- Filters: by status, function, timeframe

**Visual Style**
- Dashboard cards
- Mini delivery timeline inside each card
- Animated status indicators (pulse, fade, slide)

---

### 2. Function List

**Purpose**
- Manage and inspect all deployed functions.

**Key UI elements**
- Table/card view with search & filters
- Each function row includes:
  - Recent success rate
  - Last execution
  - Runtime information
  - "Run Test" button → opens invoke modal

**UX Focus**
- Fast scanning of many functions
- Clear stats & quick actions

---

### 3. Function Detail

**Purpose**
- Show per-function metadata and recent executions.

**Tabs**
- **Overview**: stats, charts, configuration info
- **Recent Executions**: list with sortable columns
- **Settings** (read-only for now)

**Interactions**
- Clicking an execution → execution detail view

---

### 4. Execution Detail (Core Screen)

This is the heart of the UI.

**Components**

1. **Delivery Journey Timeline**
   - Horizontal or vertical stepper
   - Icons for each delivery stage
   - Time taken per stage
   - Highlighted current step with animation
   - Error indicators for failed steps

2. **Real-time Logs**
   - Log streaming with scroll lock
   - Stage-based filtering: Fetching / Sandbox / Execution
   - Syntax highlighting

3. **Metadata Panel**
   - Runner ID
   - Sandbox ID
   - Request payload
   - Response body
   - Timing breakdown

---

### 5. Runner Monitoring

**Purpose**: Visualize EC2 Runner Pool state.

**UI elements**
- Runner cards: Idle / Busy / Error
- Mini metrics (CPU, memory)
- Current executing function
- Runner detail modal with logs or execution history

This section boosts the observability principle of the platform.

---

### 6. Invoke Modal

**UI elements**
- JSON editor for payload
- Optional headers/queries
- "Execute" button
- After execution → link to delivery journey page

---

## Design Style Guide

### 1. Modern DevOps Dashboard

- Semi-dark theme
- High readability
- Data-first layouts

### 2. Logistics Storytelling

- Parcel / truck / warehouse icons
- Animated transitions between stages
- Simple, friendly illustrations

### 3. Real-time Interaction

- Live updates, blinking indicators
- Smooth timeline transitions

### 4. Minimalist & Developer-friendly

- Monospace logs
- Minimal clutter
- Clear status colors (green/blue/red/yellow)

---

## Frontend Tech Stack

- **React** + **TypeScript** + **Vite**
- **SSE** or **WebSocket** for real-time updates
- **MUI** / **Tailwind CSS** for UI components
- **Zustand** or **Recoil** for state management
- **React Query** for server state
- **Lottie** for micro-animations
- **CodeMirror** / **Monaco** for JSON editor
- **Victory.js** / **Recharts** for small charts

---

## Future Enhancements

- Step-level latency analytics
- Compare two executions visually
- Dark/light theme toggle
- Clickable sandbox introspection
- AI-based failure explanation
- Animation presets for each delivery stage
