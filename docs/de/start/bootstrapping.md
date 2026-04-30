---
read_when:
    - Was beim ersten Agentenlauf passiert
    - Erläutern, wo Bootstrapping-Dateien liegen
    - Fehlerbehebung bei der Einrichtung der Onboarding-Identität
sidebarTitle: Bootstrapping
summary: Agent-Bootstrapping-Ritual, das den Arbeitsbereich und die Identitätsdateien initialisiert
title: Agent-Bootstrapping
x-i18n:
    generated_at: "2026-04-30T07:15:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: de829f82016ae1e4dcd7714502ca8d11755556fed18b985a7e2bada4149a2d46
    source_path: start/bootstrapping.md
    workflow: 16
---

Die Initialisierung ist das **Erstausführungsritual**, das einen Agent-Arbeitsbereich vorbereitet und
Identitätsdetails erfasst. Sie erfolgt nach dem Onboarding, wenn der Agent zum
ersten Mal startet.

## Was die Initialisierung bewirkt

Beim ersten Agent-Lauf initialisiert OpenClaw den Arbeitsbereich (Standard:
`~/.openclaw/workspace`):

- Erstellt `AGENTS.md`, `BOOTSTRAP.md`, `IDENTITY.md`, `USER.md` mit Startinhalten.
- Führt einen kurzen Frage-Antwort-Ablauf aus (jeweils eine Frage).
- Schreibt Identität und Einstellungen in `IDENTITY.md`, `USER.md`, `SOUL.md`.
- Entfernt nach Abschluss `BOOTSTRAP.md`, damit sie nur einmal ausgeführt wird.

Bei eingebetteten/lokalen Modellläufen hält OpenClaw `BOOTSTRAP.md` aus dem
privilegierten Systemkontext heraus. Beim primären interaktiven ersten Lauf
übergibt es die Dateiinhalte weiterhin im Benutzer-Prompt, damit Modelle, die
das Tool `read` nicht zuverlässig aufrufen, den Ablauf abschließen können. Wenn
der aktuelle Lauf nicht sicher auf den Arbeitsbereich zugreifen kann, erhält der
Agent statt einer allgemeinen Begrüßung einen eingeschränkten Initialisierungshinweis.

## Initialisierung überspringen

Um dies für einen vorbefüllten Arbeitsbereich zu überspringen, führen Sie `openclaw onboard --skip-bootstrap` aus.

## Ausführungsort

Die Initialisierung läuft immer auf dem **Gateway-Host**. Wenn die macOS-App eine
Verbindung zu einem entfernten Gateway herstellt, befinden sich der Arbeitsbereich
und die Initialisierungsdateien auf diesem entfernten Rechner.

<Note>
Wenn das Gateway auf einem anderen Rechner läuft, bearbeiten Sie Arbeitsbereichsdateien auf dem Gateway-
Host (zum Beispiel `user@gateway-host:~/.openclaw/workspace`).
</Note>

## Zugehörige Dokumentation

- Onboarding der macOS-App: [Onboarding](/de/start/onboarding)
- Arbeitsbereichsstruktur: [Agent-Arbeitsbereich](/de/concepts/agent-workspace)
