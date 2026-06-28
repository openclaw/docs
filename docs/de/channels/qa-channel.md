---
read_when:
    - Sie binden den synthetischen QA-Transport in einen lokalen oder CI-Testlauf ein
    - Sie benötigen die mitgelieferte qa-channel-Konfigurationsschnittstelle
    - Sie arbeiten iterativ an der End-to-End-QA-Automatisierung
summary: Synthetisches Kanal-Plugin der Slack-Klasse für deterministische OpenClaw-QA-Szenarien
title: QA-Kanal
x-i18n:
    generated_at: "2026-05-10T19:23:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f28962032bc5f6b228de731ae6bd9a22831604b506b7073aeffba19ac22e0e8
    source_path: channels/qa-channel.md
    workflow: 16
    postprocess_version: locale-links-v1
---

`qa-channel` ist ein gebündelter synthetischer Nachrichtentransport für automatisierte OpenClaw-QA. Es ist kein Produktionskanal - er existiert, um dieselbe Channel-Plugin-Grenze auszuüben, die von echten Transporten verwendet wird, während der Zustand deterministisch und vollständig einsehbar bleibt.

## Was es macht

- Zielgrammatik der Slack-Klasse:
  - `dm:<user>`
  - `channel:<room>`
  - `group:<room>`
  - `thread:<room>/<thread>`
- Geteilte `channel:`- und `group:`-Unterhaltungen werden Agenten als Gruppen-/Kanalraum-Turns angezeigt, sodass sie dieselbe Richtlinie für sichtbare Antworten und Message-Tool-Routing ausüben, die von Discord, Slack, Telegram und ähnlichen Transporten verwendet wird.
- HTTP-gestützter synthetischer Bus für Inbound-Nachrichteninjektion, Outbound-Transkripterfassung, Thread-Erstellung, Reaktionen, Bearbeitungen, Löschungen sowie Such-/Leseaktionen.
- Hostseitiger Self-Check-Runner, der einen Markdown-Bericht nach `.artifacts/qa-e2e/` schreibt.

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

Kontoschlüssel:

- `enabled` - Master-Umschalter für dieses Konto.
- `name` - optionale Anzeige-Bezeichnung.
- `baseUrl` - URL des synthetischen Busses.
- `botUserId` - Bot-Benutzer-ID im Matrix-Stil, die in der Zielgrammatik verwendet wird.
- `botDisplayName` - Anzeigename für ausgehende Nachrichten.
- `pollTimeoutMs` - Wartefenster für Long-Polling. Ganzzahl zwischen 100 und 30000.
- `allowFrom` - Sender-Allowlist (Benutzer-IDs oder `"*"`). Direktnachrichten und
  die Allowlist-Gruppenrichtlinie verwenden beide diese synthetischen Sender-IDs.
- `groupPolicy` - Richtlinie für geteilte Räume: `"open"` (Standard), `"allowlist"` oder
  `"disabled"`.
- `groupAllowFrom` - optionale Sender-Allowlist für geteilte Räume. Wenn sie unter
  `"allowlist"` ausgelassen wird, fällt QA Channel auf `allowFrom` zurück.
- `groups.<room>.requireMention` - erfordert eine Bot-Erwähnung, bevor in einem
  bestimmten Gruppen-/Kanalraum geantwortet wird. `groups."*"` legt den Standard fest.
- `defaultTo` - Ausweichziel, wenn keines angegeben ist.
- `actions.messages` / `actions.reactions` / `actions.search` / `actions.threads` - Tool-Gating pro Aktion.

Mehrkontoschlüssel auf oberster Ebene:

- `accounts` - Datensatz benannter kontospezifischer Überschreibungen, nach Konto-ID geschlüsselt.
- `defaultAccount` - bevorzugte Konto-ID, wenn mehrere konfiguriert sind.

## Runner

Hostseitiger Self-Check (schreibt einen Markdown-Bericht unter `.artifacts/qa-e2e/`):

```bash
pnpm qa:e2e
```

Dies wird über `qa-lab` geleitet, startet den QA-Bus im Repository, bootet den gebündelten `qa-channel`-Runtime-Abschnitt und führt einen deterministischen Self-Check aus.

Vollständige repositorygestützte Szenario-Suite:

```bash
pnpm openclaw qa suite
```

Führt Szenarien parallel gegen die QA-Gateway-Lane aus. Szenarien, Profile und Provider-Modi finden Sie in der [QA-Übersicht](/de/concepts/qa-e2e-automation).

Docker-gestützte QA-Site (Gateway + QA Lab-Debugger-UI in einem Stack):

```bash
pnpm qa:lab:up
```

Baut die QA-Site, startet den Docker-gestützten Gateway- + QA Lab-Stack und gibt die QA Lab-URL aus. Von dort aus können Sie Szenarien auswählen, die Modell-Lane wählen, einzelne Läufe starten und Ergebnisse live beobachten. Der QA Lab-Debugger ist vom ausgelieferten Control-UI-Bundle getrennt.

## Verwandte Themen

- [QA-Übersicht](/de/concepts/qa-e2e-automation) - gesamter Stack, Transport-Adapter, Szenarioerstellung
- [Matrix-QA](/de/concepts/qa-matrix) - beispielhafter Live-Transport-Runner, der einen echten Kanal steuert
- [Kopplung](/de/channels/pairing)
- [Gruppen](/de/channels/groups)
- [Kanalübersicht](/de/channels)
