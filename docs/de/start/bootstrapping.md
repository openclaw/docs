---
read_when:
    - Verstehen, was beim ersten Agentenlauf geschieht
    - Erklärung, wo sich die Bootstrapping-Dateien befinden
    - Fehlerbehebung bei der Identitätseinrichtung während des Onboardings
sidebarTitle: Bootstrapping
summary: Agent-Bootstrapping-Ritual, das die Workspace- und Identitätsdateien initialisiert
title: Agent-Bootstrapping
x-i18n:
    generated_at: "2026-07-24T05:17:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: efb47e1a6a86d68aef1aa1662fe9c5def9a4e5b45649b84aeb9060bfcba21a5d
    source_path: start/bootstrapping.md
    workflow: 16
---

Bootstrapping ist das Ritual beim ersten Start, das einen neuen Agenten-Arbeitsbereich mit Ausgangsdaten befüllt und
den Agenten durch die Auswahl einer Identität führt. Es wird einmal ausgeführt, direkt nach
dem Onboarding, beim ersten echten Durchlauf des Agenten.

## Was geschieht

Beim ersten Durchlauf mit einem brandneuen Arbeitsbereich (Standard: `~/.openclaw/workspace`)
führt OpenClaw folgende Schritte aus:

- Legt `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` und `BOOTSTRAP.md` an.
- Lässt den Agenten eine auf drei Schritte begrenzte Entstehungssequenz durchlaufen: Er fragt, wie Sie ihn
  nennen möchten, teilt einen kurzen Satz zu Persönlichkeit und Grundstimmung mit und fragt, ob Sie
  die minimale empfohlene Plugin-Auswahl oder maximalen Komfort wünschen.
- Speichert die vereinbarte Identität zweimal: in `IDENTITY.md` und `SOUL.md` (was der
  Agent über sich selbst liest) sowie über `openclaw agents set-identity` (was Kanäle
  und die Benutzeroberfläche anzeigen).
- Liest die bereits während des Onboardings gespeicherten App-Empfehlungen, ohne erneut zu prüfen.
  Offizielle Plugins verwenden `openclaw plugins install <id>`; Skills von Drittanbietern aus ClawHub
  müssen weiterhin ausdrücklich aktiviert werden. Nachdem die Auswahl verarbeitet wurde, bestätigt der Agent
  das gespeicherte Angebot, damit er nie wieder danach fragt.
- Löscht `BOOTSTRAP.md`, sobald der Arbeitsbereich konfiguriert erscheint, sodass das Ritual nur einmal ausgeführt wird.

Ein Arbeitsbereich gilt als konfiguriert, sobald `SOUL.md`, `IDENTITY.md` oder `USER.md`
von seiner jeweiligen Ausgangsvorlage abweicht oder ein Ordner namens `memory/` vorhanden ist.

<Note>
`BOOTSTRAP.md` umfasst das vollständige Identitätsgespräch. Den Inhalt finden Sie unter
[BOOTSTRAP.md-Vorlage](/de/reference/templates/BOOTSTRAP).
</Note>

## Eingebettete und lokale Modellläufe

Bei eingebetteten oder lokalen Modellläufen hält OpenClaw `BOOTSTRAP.md` aus dem
privilegierten Systemkontext heraus. Beim ersten primären interaktiven Durchlauf
übergibt OpenClaw den Dateiinhalt dennoch über den Benutzer-Prompt, sodass Modelle, die
das Tool `read` nicht zuverlässig aufrufen, das Ritual trotzdem abschließen können. Wenn der aktuelle
Durchlauf nicht sicher auf den Arbeitsbereich zugreifen kann, erhält der Agent statt
einer allgemeinen Begrüßung einen kurzen Hinweis auf ein eingeschränktes Bootstrapping.

## Bootstrapping überspringen

Um diesen Vorgang in einem vorab befüllten Arbeitsbereich zu überspringen, führen Sie Folgendes aus:

```bash
openclaw onboard --skip-bootstrap
```

## Ausführungsort

Das Bootstrapping wird immer auf dem Gateway-Host ausgeführt. Wenn die macOS-App eine Verbindung zu einem
entfernten Gateway herstellt, befinden sich der Arbeitsbereich und seine Bootstrapping-Dateien auf diesem entfernten
Rechner und nicht auf dem Mac.

<Note>
Wenn das Gateway auf einem anderen Rechner ausgeführt wird, bearbeiten Sie die Arbeitsbereichsdateien auf dem Gateway-
Host (zum Beispiel `user@gateway-host:~/.openclaw/workspace`).
</Note>

## Zugehörige Dokumentation

- Onboarding der macOS-App: [Onboarding](/de/start/onboarding)
- Aufbau des Arbeitsbereichs: [Agenten-Arbeitsbereich](/de/concepts/agent-workspace)
- Vorlageninhalt: [BOOTSTRAP.md-Vorlage](/de/reference/templates/BOOTSTRAP)
