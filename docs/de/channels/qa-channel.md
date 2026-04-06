---
read_when:
    - Sie binden den synthetischen QA-Transport in einen lokalen oder CI-Teslauf ein
    - Sie benötigen die gebündelte qa-channel-Konfigurationsoberfläche
    - Sie arbeiten iterativ an der End-to-End-QA-Automatisierung
summary: Synthetisches Slack-ähnliches Kanal-Plugin für deterministische OpenClaw-QA-Szenarien
title: QA-Kanal
x-i18n:
    generated_at: "2026-04-06T03:06:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3b88cd73df2f61b34ad1eb83c3450f8fe15a51ac69fbb5a9eca0097564d67a06
    source_path: channels/qa-channel.md
    workflow: 15
---

# QA-Kanal

`qa-channel` ist ein gebündelter synthetischer Nachrichtentransport für automatisierte OpenClaw-QA.

Er ist kein Produktionskanal. Er dient dazu, dieselbe Kanal-Plugin-Grenze zu testen,
die von echten Transporten verwendet wird, während der Status deterministisch und vollständig
prüfbar bleibt.

## Was es heute macht

- Slack-ähnliche Zielgrammatik:
  - `dm:<user>`
  - `channel:<room>`
  - `thread:<room>/<thread>`
- HTTP-gestützter synthetischer Bus für:
  - Injektion eingehender Nachrichten
  - Erfassung ausgehender Transkripte
  - Thread-Erstellung
  - Reaktionen
  - Bearbeitungen
  - Löschungen
  - Such- und Leseaktionen
- Gebündelter hostseitiger Self-Check-Runner, der einen Markdown-Bericht schreibt

## Konfiguration

```json
{
  "channels": {
    "qa-channel": {
      "baseUrl": "http://127.0.0.1:43123",
      "botUserId": "openclaw",
      "botDisplayName": "OpenClaw QA",
      "allowFrom": ["*"],
      "pollTimeoutMs": 1000
    }
  }
}
```

Unterstützte Kontoschlüssel:

- `baseUrl`
- `botUserId`
- `botDisplayName`
- `pollTimeoutMs`
- `allowFrom`
- `defaultTo`
- `actions.messages`
- `actions.reactions`
- `actions.search`
- `actions.threads`

## Runner

Aktueller vertikaler Ausschnitt:

```bash
pnpm qa:e2e
```

Dies wird jetzt über die gebündelte `qa-lab`-Erweiterung geleitet. Sie startet den
QA-Bus im Repository, fährt den gebündelten `qa-channel`-Runtime-Ausschnitt hoch, führt
einen deterministischen Self-Check aus und schreibt einen Markdown-Bericht unter
`.artifacts/qa-e2e/`.

Private Debugger-Benutzeroberfläche:

```bash
pnpm qa:lab:build
pnpm openclaw qa ui
```

Vollständige repository-gestützte QA-Suite:

```bash
pnpm openclaw qa suite
```

Dadurch wird der private QA-Debugger unter einer lokalen URL gestartet, getrennt vom
ausgelieferten Control UI-Bundle.

## Umfang

Der aktuelle Umfang ist bewusst eng gefasst:

- Bus + Plugin-Transport
- Thread-Routing-Grammatik
- kanalgebundene Nachrichtenaktionen
- Markdown-Berichterstellung

Folgearbeiten werden Folgendes hinzufügen:

- Dockerisierte OpenClaw-Orchestrierung
- Ausführung einer Provider-/Modell-Matrix
- umfassendere Szenarioerkennung
- später OpenClaw-native Orchestrierung
