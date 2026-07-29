# Master Prompt — KhetiTantra Build

I'm attaching four project documents: **SOP**, **PRD**, **TSD (Tech Stack Document)**, and **DSD (Design System Document)**. Read all four fully before writing any code — they are the single source of truth for this project and take precedence over your own defaults.

## One correction to the SOP
Ignore any mention of Android Studio as a required install for day-to-day development. We are **not** using Android Studio or an emulator as part of the core workflow. This is an **Expo (React Native) project** producing two outputs from one codebase:
1. A responsive web build (primary dev/demo target)
2. An Android APK via **EAS Build** (cloud build — no local Android Studio/SDK needed)

Android Studio is only relevant if we later need a local emulator for debugging, which is out of scope for now.

## What KhetiTantra is
A cross-platform app for Indian farmers to log crop cycles, track income/expenses per crop, see profit/loss automatically, and ask an AI assistant (Groq) for farming advice grounded in their own ledger data. Full context, personas, and functional requirements are in the PRD — treat every requirement tagged **M (must-have)** as non-negotiable for v1.0; **S** and **C** items only if time/budget allows.

## Non-negotiable technical rules (from the TSD/SOP — do not deviate)
- Stack: Expo SDK 57 (RN 0.86), JavaScript/JSX (no TypeScript), Expo Router, NativeWind + react-native-reusables, TanStack Query + Zustand, Supabase (Postgres/Auth/RLS/Edge Functions), Groq via Edge Function proxy only.
- **The Groq API key must never appear in client code, the APK, or the web bundle.** All AI calls go through the `ask-groq` Supabase Edge Function, which validates the caller's JWT server-side.
- **Row Level Security must be enabled on every table**, with owner-only policies (`auth.uid() = user_id`), before any feature using that table is considered done. This is the top-priority security requirement — verify with two different test accounts before marking any module complete.
- Use the exact database schema in SOP §6 (profiles, crops, transactions, ai_conversations, ai_messages, plus the `crop_profit` view and the auth.users → profiles trigger) as the single source of truth. Don't redesign it without flagging the change to me first.
- Dashboard figures must come from the `crop_profit` database view, never computed client-side, so web and Android always agree.
- Follow the design tokens, color palette, and per-module UI guidance in the DSD exactly (Leaf Green primary, Harvest Gold secondary, Sand background, Clay Red for loss/errors — never color alone for loss indicators). Minimum 16sp body text, 48dp touch targets, icon paired with every label — this app's primary user has low digital literacy and WhatsApp-level app experience, so simplicity is a hard requirement, not a nice-to-have.

## How I want you to work
1. **Confirm you've read all four documents** and summarize the build order back to me before writing code.
2. Build strictly in the phase order defined in SOP §9 (Foundation → Auth/Profile → Crop Management → Ledger → Analytics Dashboard → AI Assistant → Polish/Accessibility → Testing/Build). Do not start a phase until the previous phase's exit criterion is met.
3. Before each phase, tell me what you're about to build and which PRD requirement IDs (e.g. FR-C1, FR-AI4) it satisfies.
4. After each phase, tell me exactly how to verify it (what to click, what to check in Supabase, which two test accounts to use for RLS checks) using the relevant checks from SOP §10.
5. Set up the Supabase project and schema (SOP §6) and the Edge Function (SOP §8) yourself where you have the access to do so; where you don't (e.g. creating the actual Supabase project, setting secrets), give me the exact CLI commands to run myself, in order.
6. Keep environment variables and secrets exactly as scoped in the TSD §8 — only `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in the client `.env`; `GROQ_API_KEY` only ever in Supabase Edge Function secrets.
7. If you think a documented decision is a mistake, say so and explain why — but don't silently change it.
8. If something in the PRD, SOP, TSD, or DSD conflicts with something I say in chat, point out the conflict before proceeding instead of guessing which one wins.

## First deliverable
Start with **Phase 1 — Foundation** only: project scaffold, Expo Router navigation shell with tab bar, theme tokens matching the DSD palette, and the four reusable components (Button, Input, Card, EmptyState). Confirm the app boots on web before moving to Phase 2.
