---
read_when:
    - Verstehen, was beim ersten Agentenlauf geschieht
    - Erläuterung, wo sich die Bootstrapping-Dateien befinden
    - Fehlerbehebung bei der Identitätseinrichtung während des Onboardings
sidebarTitle: Bootstrapping
summary: Agent-Bootstrapping-Ritual, das die Arbeitsbereichs- und Identitätsdateien initialisiert
title: Agenten-Bootstrapping
x-i18n:
    generated_at: "2026-07-12T02:10:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d8356684e8567b02f558ce2b455a20019e55579e5dcb4625bb441d66656098e0
    source_path: start/bootstrapping.md
    workflow: 16
---

Bootstrapping ist das Ritual beim ersten Start, das einen neuen Agent-Arbeitsbereich mit den Ausgangsdateien versieht und den Agenten durch die Auswahl einer Identität führt. Es wird einmal ausgeführt, direkt nach dem Onboarding, beim ersten echten Durchlauf des Agenten.

## Was geschieht

Beim ersten Durchlauf mit einem vollständig neuen Arbeitsbereich (standardmäßig `~/.openclaw/workspace`) führt OpenClaw folgende Schritte aus:

- Erstellt die Ausgangsdateien `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` und `BOOTSTRAP.md`.
- Lässt den Agenten den Anweisungen in `BOOTSTRAP.md` folgen: ein frei geführtes Gespräch (kein festes Frage-Antwort-Formular), um einen Namen, eine Persönlichkeit und eine Grundstimmung festzulegen.
- Schreibt die gewonnenen Informationen in `IDENTITY.md`, `USER.md` und `SOUL.md`.
- Löscht `BOOTSTRAP.md`, sobald der Arbeitsbereich konfiguriert erscheint, sodass das Ritual nur einmal ausgeführt wird.

Ein Arbeitsbereich gilt als konfiguriert, sobald `SOUL.md`, `IDENTITY.md` oder `USER.md` von der jeweiligen Ausgangsvorlage abweicht oder ein Ordner `memory/` vorhanden ist.

<Note>
`BOOTSTRAP.md` deckt das vollständige Gespräch zur Identitätsfindung ab. Den Inhalt finden Sie unter [Vorlage für BOOTSTRAP.md](/de/reference/templates/BOOTSTRAP).
</Note>

## Durchläufe mit eingebetteten und lokalen Modellen

Bei Durchläufen mit eingebetteten oder lokalen Modellen hält OpenClaw `BOOTSTRAP.md` aus dem privilegierten Systemkontext heraus. Beim ersten primären interaktiven Durchlauf übergibt OpenClaw den Dateiinhalt dennoch über den Benutzer-Prompt, sodass auch Modelle, die das Tool `read` nicht zuverlässig aufrufen, das Ritual abschließen können. Wenn der aktuelle Durchlauf nicht sicher auf den Arbeitsbereich zugreifen kann, erhält der Agent anstelle einer allgemeinen Begrüßung einen kurzen Hinweis zu einem eingeschränkten Bootstrapping.

## Bootstrapping überspringen

Um diesen Vorgang bei einem bereits vorbereiteten Arbeitsbereich zu überspringen, führen Sie Folgendes aus:

```bash
openclaw onboard --skip-bootstrap
```

## Ausführungsort

Das Bootstrapping wird immer auf dem Gateway-Host ausgeführt. Wenn die macOS-App eine Verbindung zu einem entfernten Gateway herstellt, befinden sich der Arbeitsbereich und dessen Bootstrap-Dateien auf diesem entfernten Rechner, nicht auf dem Mac.

<Note>
Wenn das Gateway auf einem anderen Rechner ausgeführt wird, bearbeiten Sie die Dateien des Arbeitsbereichs auf dem Gateway-Host (zum Beispiel `user@gateway-host:~/.openclaw/workspace`).
</Note>

## Zugehörige Dokumentation

- Onboarding der macOS-App: [Onboarding](/de/start/onboarding)
- Struktur des Arbeitsbereichs: [Agent-Arbeitsbereich](/de/concepts/agent-workspace)
- Vorlageninhalt: [Vorlage für BOOTSTRAP.md](/de/reference/templates/BOOTSTRAP)
