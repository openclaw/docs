---
read_when:
    - Sie binden den synthetischen QA-Transport in einen lokalen oder CI-Testlauf ein
    - Sie benötigen die Konfigurationsoberfläche des gebündelten qa-channel
    - Sie arbeiten iterativ an der End-to-End-QA-Automatisierung
summary: Synthetisches Kanal-Plugin der Slack-Klasse für deterministische OpenClaw-QA-Szenarien
title: QA-Kanal
x-i18n:
    generated_at: "2026-05-06T06:40:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1990b64d8a3ed158b11fc08742f774c5355ee25b68402ec447b92316109ac2f2
    source_path: channels/qa-channel.md
    workflow: 16
---

`qa-channel` ist ein mitgelieferter synthetischer Nachrichtentransport für automatisierte OpenClaw-QA. Er ist kein Produktionskanal - er dient dazu, dieselbe Plugin-Grenze für Channels auszuüben, die von echten Transporten verwendet wird, während der Zustand deterministisch und vollständig einsehbar bleibt.

## Was es tut

- Slack-ähnliche Zielgrammatik:
  - `dm:<user>`
  - `channel:<room>`
  - `group:<room>`
  - `thread:<room>/<thread>`
- Geteilte `channel:`- und `group:`-Unterhaltungen werden Agents als Gruppen-/Channel-Raum-Turns bereitgestellt, sodass sie dieselbe Routing-Richtlinie für sichtbare Antworten und Message-Tools ausüben, die von Discord, Slack, Telegram und ähnlichen Transporten verwendet wird.
- HTTP-gestützter synthetischer Bus für das Einspeisen eingehender Nachrichten, das Erfassen ausgehender Transkripte, Thread-Erstellung, Reaktionen, Bearbeitungen, Löschungen sowie Such-/Leseaktionen.
- Host-seitiger Self-Check-Runner, der einen Markdown-Bericht nach `.artifacts/qa-e2e/` schreibt.

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

Account-Schlüssel:

- `enabled` - Hauptschalter für diesen Account.
- `name` - optionales Anzeigelabel.
- `baseUrl` - URL des synthetischen Busses.
- `botUserId` - Matrix-artige Bot-Benutzer-ID, die in der Zielgrammatik verwendet wird.
- `botDisplayName` - Anzeigename für ausgehende Nachrichten.
- `pollTimeoutMs` - Long-Poll-Wartefenster. Ganzzahl zwischen 100 und 30000.
- `allowFrom` - Sender-Allowlist (Benutzer-IDs oder `"*"`).
- `defaultTo` - Fallback-Ziel, wenn keines angegeben ist.
- `actions.messages` / `actions.reactions` / `actions.search` / `actions.threads` - Tool-Gating pro Aktion.

Multi-Account-Schlüssel auf oberster Ebene:

- `accounts` - Datensatz benannter accountbezogener Überschreibungen, nach Account-ID verschlüsselt.
- `defaultAccount` - bevorzugte Account-ID, wenn mehrere konfiguriert sind.

## Runner

Host-seitiger Self-Check (schreibt einen Markdown-Bericht unter `.artifacts/qa-e2e/`):

```bash
pnpm qa:e2e
```

Dies läuft über `qa-lab`, startet den QA-Bus im Repository, bootet den mitgelieferten `qa-channel`-Runtime-Slice und führt einen deterministischen Self-Check aus.

Vollständige repositorygestützte Szenario-Suite:

```bash
pnpm openclaw qa suite
```

Führt Szenarien parallel gegen die QA-Gateway-Lane aus. Siehe [QA-Übersicht](/de/concepts/qa-e2e-automation) für Szenarien, Profile und Provider-Modi.

Docker-gestützte QA-Site (Gateway + QA-Lab-Debugger-UI in einem Stack):

```bash
pnpm qa:lab:up
```

Baut die QA-Site, startet den Docker-gestützten Gateway- + QA-Lab-Stack und gibt die QA-Lab-URL aus. Von dort aus können Sie Szenarien auswählen, die Modell-Lane wählen, einzelne Läufe starten und Ergebnisse live verfolgen. Der QA-Lab-Debugger ist vom ausgelieferten Control-UI-Bundle getrennt.

## Verwandt

- [QA-Übersicht](/de/concepts/qa-e2e-automation) - Gesamt-Stack, Transportadapter, Szenario-Authoring
- [Matrix-QA](/de/concepts/qa-matrix) - beispielhafter Live-Transport-Runner, der einen echten Channel steuert
- [Pairing](/de/channels/pairing)
- [Gruppen](/de/channels/groups)
- [Channel-Übersicht](/de/channels)
