---
read_when:
    - Sie binden den synthetischen QA-Transport in einen lokalen oder CI-Testlauf ein
    - Sie benötigen die Konfigurationsoberfläche des mitgelieferten qa-channel-Plugins
    - Sie arbeiten iterativ an der End-to-End-QA-Automatisierung.
summary: Synthetisches Plugin für Slack-ähnliche Kanäle für deterministische OpenClaw-QA-Szenarien
title: QA-Kanal
x-i18n:
    generated_at: "2026-07-16T12:29:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a43c35e197116a6bd44b238010eb508aed23dea99ab872d10e6fc853b5f4d4a7
    source_path: channels/qa-channel.md
    workflow: 16
---

`qa-channel` ist ein repo-lokaler synthetischer Nachrichtentransport für die automatisierte OpenClaw-QA (`extensions/qa-channel`, privates Paket, von paketierten Installationen ausgeschlossen). Es handelt sich nicht um einen produktiven Kanal – er dient dazu, dieselbe Kanal-Plugin-Grenze zu testen, die von realen Transporten verwendet wird, während der Zustand deterministisch und vollständig einsehbar bleibt.

## Funktionsweise

- Slack-ähnliche Zielgrammatik:
  - `dm:<user>`
  - `channel:<room>`
  - `group:<room>`
  - `thread:<room>/<thread>`
- Gemeinsame `channel:`- und `group:`-Unterhaltungen werden Agenten als Gesprächsrunden in Gruppen-/Kanalräumen bereitgestellt, sodass sie dieselbe Routing-Richtlinie für sichtbare Antworten und Nachrichtentools testen, die von Discord, Slack, Telegram und ähnlichen Transporten verwendet wird.
- HTTP-gestützter synthetischer Bus für das Einspeisen eingehender Nachrichten, das Erfassen ausgehender Transkripte, das Erstellen von Threads, Reaktionen, Bearbeitungen, Löschvorgänge sowie Such-/Leseaktionen.
- Hostseitiger Selbsttest-Runner, der einen Markdown-Bericht nach `.artifacts/qa-e2e/` schreibt.

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

- `enabled` – Hauptschalter für dieses Konto.
- `name` – optionale Anzeigebezeichnung.
- `baseUrl` – URL des synthetischen Busses. Das Konto gilt als konfiguriert, sobald dieser Wert festgelegt ist.
- `botUserId` – synthetische Bot-Benutzer-ID, die in der Zielgrammatik verwendet wird (Standard: `openclaw`).
- `botDisplayName` – Anzeigename für ausgehende Nachrichten (Standard: `OpenClaw QA`).
- `pollTimeoutMs` – Wartefenster für Long Polling. Ganzzahl zwischen 100 und 30000 (Standard: 1000).
- `allowFrom` – Zulassungsliste für Absender (Benutzer-IDs oder `"*"`; Standard: `["*"]`). Direktnachrichten unterliegen
  immer der Richtlinie `open`; die Gruppenrichtlinie mit Zulassungsliste verwendet ebenfalls diese synthetischen
  Absender-IDs.
- `groupPolicy` – Richtlinie für gemeinsame Räume: `"open"` (Standard), `"allowlist"` oder
  `"disabled"`.
- `groupAllowFrom` – optionale Absender-Zulassungsliste für gemeinsame Räume. Wenn sie unter
  `"allowlist"` ausgelassen wird, greift QA Channel auf `allowFrom` zurück.
- `groups.<room>.requireMention` – erfordert eine Erwähnung des Bots, bevor in einem
  bestimmten Gruppen-/Kanalraum geantwortet wird (Standard: false). `groups."*"` legt den Standard fest;
  raumspezifische `tools` / `toolsBySender` legen Überschreibungen der Tool-Richtlinie fest.
- `defaultTo` – Ausweichziel, wenn keines angegeben ist.
- `actions.messages` / `actions.reactions` / `actions.search` / `actions.threads` – aktionsspezifische Tool-Zugriffssteuerung.

Kontenübergreifende Schlüssel auf oberster Ebene:

- `accounts` – Datensatz benannter kontospezifischer Überschreibungen, indiziert nach Konto-ID.
- `defaultAccount` – bevorzugte Konto-ID, wenn mehrere Konten konfiguriert sind.

## Runner

Hostseitiger Selbsttest (schreibt einen Markdown-Bericht unter `.artifacts/qa-e2e/`):

```bash
pnpm qa:e2e
```

Dieser wird durch `qa-lab` geleitet, startet den repo-internen QA-Bus, bootet den Runtime-Ausschnitt `qa-channel` und führt einen deterministischen Selbsttest aus.

Vollständige repo-gestützte Szenariosuite:

```bash
pnpm openclaw qa suite
```

Führt Szenarien parallel in der QA-Gateway-Lane aus. Szenarien, Profile und Provider-Modi finden Sie in der [QA-Übersicht](/de/concepts/qa-e2e-automation).

Docker-gestützte QA-Site (Gateway + QA-Lab-Debugger-Benutzeroberfläche in einem Stack):

```bash
pnpm qa:lab:up
```

Erstellt die QA-Site, startet den Docker-gestützten Gateway- und QA-Lab-Stack und gibt die QA-Lab-URL aus. Dort können Sie Szenarien auswählen, die Modell-Lane festlegen, einzelne Läufe starten und die Ergebnisse live verfolgen. Der QA-Lab-Debugger ist vom ausgelieferten Control-UI-Bundle getrennt.

## Verwandte Themen

- [QA-Übersicht](/de/concepts/qa-e2e-automation) – Gesamtstack, Transportadapter, Matrix-Profile und Szenarioerstellung
- [Kopplung](/de/channels/pairing)
- [Gruppen](/de/channels/groups)
- [Kanalübersicht](/de/channels)
