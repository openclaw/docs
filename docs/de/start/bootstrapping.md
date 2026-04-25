---
read_when:
    - Verstehen, was beim ersten Agentenlauf passiert
    - Erklären, wo die Bootstrapping-Dateien liegen
    - Fehlerbehebung bei der Einrichtung der Onboarding-Identität
sidebarTitle: Bootstrapping
summary: Agent-Bootstrapping-Ritual, das den Arbeitsbereich und Identitätsdateien initial befüllt
title: Agent-Bootstrapping
x-i18n:
    generated_at: "2026-04-25T13:56:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 435eb2a14707623903ab7873774cc8d4489b960719cf6a525d547983f8338027
    source_path: start/bootstrapping.md
    workflow: 15
---

Bootstrapping ist das **Erststart**-Ritual, das einen Agent-Arbeitsbereich vorbereitet und
Identitätsdetails erfasst. Es geschieht nach dem Onboarding, wenn der Agent zum
ersten Mal startet.

## Was Bootstrapping macht

Beim ersten Agentenlauf bootstrappt OpenClaw den Arbeitsbereich (Standard:
`~/.openclaw/workspace`):

- Legt `AGENTS.md`, `BOOTSTRAP.md`, `IDENTITY.md`, `USER.md` an.
- Führt ein kurzes Frage-und-Antwort-Ritual aus (jeweils eine Frage).
- Schreibt Identität und Präferenzen nach `IDENTITY.md`, `USER.md`, `SOUL.md`.
- Entfernt `BOOTSTRAP.md` nach Abschluss, sodass es nur einmal ausgeführt wird.

## Bootstrapping überspringen

Um dies für einen bereits vorbereiteten Arbeitsbereich zu überspringen, führen Sie `openclaw onboard --skip-bootstrap` aus.

## Wo es ausgeführt wird

Bootstrapping wird immer auf dem **Gateway-Host** ausgeführt. Wenn die macOS-App sich mit
einem entfernten Gateway verbindet, befinden sich der Arbeitsbereich und die Bootstrapping-Dateien auf diesem entfernten
Rechner.

<Note>
Wenn das Gateway auf einem anderen Rechner läuft, bearbeiten Sie die Arbeitsbereichsdateien auf dem Gateway-
Host (zum Beispiel `user@gateway-host:~/.openclaw/workspace`).
</Note>

## Verwandte Dokumente

- Onboarding der macOS-App: [Onboarding](/de/start/onboarding)
- Layout des Arbeitsbereichs: [Agent-Arbeitsbereich](/de/concepts/agent-workspace)
