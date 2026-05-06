---
read_when:
    - Verstehen, was beim ersten Agentenlauf passiert
    - Erläuterung, wo Bootstrap-Dateien liegen
    - Fehlerbehebung bei der Einrichtung der Onboarding-Identität
sidebarTitle: Bootstrapping
summary: Agent-Bootstrap-Ritual, das den Arbeitsbereich und die Identitätsdateien initialisiert
title: Agenten-Bootstrapping
x-i18n:
    generated_at: "2026-05-06T07:03:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: e25f05ca47184068b87f0bf8b7dea1c427f4ed48edde170a74888d586b8a606d
    source_path: start/bootstrapping.md
    workflow: 16
---

Bootstrapping ist das **Erstlauf**-Ritual, das einen Agent-Arbeitsbereich vorbereitet und
Identitätsdetails sammelt. Es erfolgt nach dem Onboarding, wenn der Agent zum
ersten Mal startet.

## Was Bootstrapping bewirkt

Beim ersten Agent-Lauf richtet OpenClaw den Arbeitsbereich ein (Standard:
`~/.openclaw/workspace`):

- Legt `AGENTS.md`, `BOOTSTRAP.md`, `IDENTITY.md`, `USER.md` an.
- Führt ein kurzes Frage-und-Antwort-Ritual aus (jeweils eine Frage).
- Schreibt Identität und Einstellungen in `IDENTITY.md`, `USER.md`, `SOUL.md`.
- Entfernt `BOOTSTRAP.md` nach Abschluss, damit es nur einmal ausgeführt wird.

Für eingebettete/lokale Modellausführungen hält OpenClaw `BOOTSTRAP.md` aus dem
privilegierten Systemkontext heraus. Beim primären interaktiven Erstlauf übergibt
es den Dateiinhalt dennoch im Benutzer-Prompt, damit Modelle, die das Tool
`read` nicht zuverlässig aufrufen, das Ritual abschließen können. Wenn der
aktuelle Lauf nicht sicher auf den Arbeitsbereich zugreifen kann, erhält der
Agent stattdessen einen eingeschränkten Bootstrap-Hinweis anstelle einer
allgemeinen Begrüßung.

## Bootstrapping überspringen

Um dies für einen vorbefüllten Arbeitsbereich zu überspringen, führen Sie `openclaw onboard --skip-bootstrap` aus.

## Wo es ausgeführt wird

Bootstrapping wird immer auf dem **Gateway-Host** ausgeführt. Wenn die macOS-App
eine Verbindung zu einem entfernten Gateway herstellt, befinden sich der
Arbeitsbereich und die Bootstrapping-Dateien auf diesem entfernten Rechner.

<Note>
Wenn der Gateway auf einem anderen Rechner ausgeführt wird, bearbeiten Sie die
Arbeitsbereichsdateien auf dem Gateway-Host (zum Beispiel `user@gateway-host:~/.openclaw/workspace`).
</Note>

## Zugehörige Dokumentation

- macOS-App-Onboarding: [Onboarding](/de/start/onboarding)
- Arbeitsbereichslayout: [Agent-Arbeitsbereich](/de/concepts/agent-workspace)
