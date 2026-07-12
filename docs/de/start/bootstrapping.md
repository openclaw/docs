---
read_when:
    - Verstehen, was beim ersten Agentenlauf geschieht
    - Erläuterung, wo sich die Bootstrapping-Dateien befinden
    - Debugging der Identitätseinrichtung beim Onboarding
sidebarTitle: Bootstrapping
summary: Agent-Bootstrapping-Ritual, das die Arbeitsbereichs- und Identitätsdateien initialisiert
title: Agenten-Bootstrapping
x-i18n:
    generated_at: "2026-07-12T16:01:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: d8356684e8567b02f558ce2b455a20019e55579e5dcb4625bb441d66656098e0
    source_path: start/bootstrapping.md
    workflow: 16
---

Bootstrapping ist das Ritual beim ersten Start, das einen neuen Agent-Arbeitsbereich mit Ausgangsdateien versieht und
den Agent bei der Wahl einer Identität begleitet. Es wird einmal ausgeführt, direkt nach
dem Onboarding, beim ersten echten Durchlauf des Agenten.

## Was geschieht

Beim ersten Durchlauf mit einem brandneuen Arbeitsbereich (standardmäßig `~/.openclaw/workspace`)
führt OpenClaw Folgendes aus:

- Erstellt die Ausgangsdateien `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` und `BOOTSTRAP.md`.
- Lässt den Agent den Anweisungen in `BOOTSTRAP.md` folgen: einem freien Gespräch (keinem festen Frage-und-Antwort-Formular), um einen Namen, eine Persönlichkeit und einen Stil festzulegen.
- Schreibt die gewonnenen Erkenntnisse in `IDENTITY.md`, `USER.md` und `SOUL.md`.
- Löscht `BOOTSTRAP.md`, sobald der Arbeitsbereich konfiguriert erscheint, sodass das Ritual nur einmal ausgeführt wird.

Ein Arbeitsbereich gilt als konfiguriert, sobald `SOUL.md`, `IDENTITY.md` oder `USER.md`
von der jeweiligen Startvorlage abweicht oder ein Ordner `memory/` vorhanden ist.

<Note>
`BOOTSTRAP.md` deckt das vollständige Gespräch zur Identitätsfindung ab. Den Inhalt finden Sie in der
[Vorlage für BOOTSTRAP.md](/de/reference/templates/BOOTSTRAP).
</Note>

## Ausführungen mit eingebetteten und lokalen Modellen

Bei Ausführungen mit eingebetteten oder lokalen Modellen hält OpenClaw `BOOTSTRAP.md` aus dem
privilegierten Systemkontext heraus. Beim ersten primären interaktiven Durchlauf
übergibt es den Dateiinhalt dennoch über den Benutzer-Prompt, sodass auch Modelle, die
das Tool `read` nicht zuverlässig aufrufen, das Ritual abschließen können. Wenn der aktuelle
Durchlauf nicht sicher auf den Arbeitsbereich zugreifen kann, erhält der Agent statt einer
allgemeinen Begrüßung einen kurzen Hinweis auf ein eingeschränktes Bootstrapping.

## Bootstrapping überspringen

Um diesen Vorgang bei einem bereits vorbereiteten Arbeitsbereich zu überspringen, führen Sie Folgendes aus:

```bash
openclaw onboard --skip-bootstrap
```

## Ausführungsort

Das Bootstrapping wird immer auf dem Gateway-Host ausgeführt. Wenn die macOS-App eine Verbindung zu einem
entfernten Gateway herstellt, befinden sich der Arbeitsbereich und seine Bootstrap-Dateien auf diesem entfernten
Computer, nicht auf dem Mac.

<Note>
Wenn der Gateway auf einem anderen Computer ausgeführt wird, bearbeiten Sie die Arbeitsbereichsdateien auf dem Gateway-
Host (zum Beispiel `user@gateway-host:~/.openclaw/workspace`).
</Note>

## Zugehörige Dokumentation

- Onboarding der macOS-App: [Onboarding](/de/start/onboarding)
- Struktur des Arbeitsbereichs: [Agent-Arbeitsbereich](/de/concepts/agent-workspace)
- Inhalt der Vorlage: [Vorlage für BOOTSTRAP.md](/de/reference/templates/BOOTSTRAP)
