---
read_when:
    - Sie binden den synthetischen QA-Transport in einen lokalen oder CI-Testlauf ein
    - Sie benötigen die Konfigurationsoberfläche des gebündelten qa-channel.
    - Sie entwickeln die End-to-End-QA-Automatisierung iterativ weiter
summary: Synthetisches Plugin für Slack-ähnliche Kanäle für deterministische OpenClaw-QA-Szenarien
title: QA-Kanal
x-i18n:
    generated_at: "2026-07-12T15:00:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f33af6ef31515e0cab0ee2540f48f3ffea8aba3d13915dc8cf66111599354187
    source_path: channels/qa-channel.md
    workflow: 16
---

`qa-channel` ist ein repo-lokaler synthetischer Nachrichtentransport für automatisierte OpenClaw-QA (`extensions/qa-channel`, privates Paket, von paketierten Installationen ausgeschlossen). Er ist kein produktiver Kanal – er dient dazu, dieselbe Kanal-Plugin-Grenze zu testen, die von realen Transporten verwendet wird, während der Zustand deterministisch und vollständig einsehbar bleibt.

## Funktionsweise

- Zielsyntax nach Slack-Art:
  - `dm:<user>`
  - `channel:<room>`
  - `group:<room>`
  - `thread:<room>/<thread>`
- Gemeinsame `channel:`- und `group:`-Unterhaltungen werden Agenten als Gruppen-/Kanalraum-Interaktionen bereitgestellt, sodass sie dieselben Richtlinien für sichtbare Antworten und das Routing von Nachrichtentools durchlaufen, die von Discord, Slack, Telegram und ähnlichen Transporten verwendet werden.
- HTTP-gestützter synthetischer Bus zum Einspeisen eingehender Nachrichten, Erfassen ausgehender Transkripte, Erstellen von Threads sowie für Reaktionen, Bearbeitungen, Löschungen und Such-/Leseaktionen.
- Hostseitiger Selbsttest-Runner, der einen Markdown-Bericht unter `.artifacts/qa-e2e/` schreibt.

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
- `botUserId` – synthetische Bot-Benutzer-ID, die in der Zielsyntax verwendet wird (Standard: `openclaw`).
- `botDisplayName` – Anzeigename für ausgehende Nachrichten (Standard: `OpenClaw QA`).
- `pollTimeoutMs` – Wartefenster für Long Polling. Ganzzahl zwischen 100 und 30000 (Standard: 1000).
- `allowFrom` – Zulassungsliste für Absender (Benutzer-IDs oder `"*"`; Standard: `["*"]`). Direktnachrichten verwenden
  immer die Richtlinie `open`; die Gruppenrichtlinie mit Zulassungsliste verwendet ebenfalls diese synthetischen
  Absender-IDs.
- `groupPolicy` – Richtlinie für gemeinsam genutzte Räume: `"open"` (Standard), `"allowlist"` oder
  `"disabled"`.
- `groupAllowFrom` – optionale Absender-Zulassungsliste für gemeinsam genutzte Räume. Wenn sie bei
  `"allowlist"` nicht angegeben ist, greift QA Channel auf `allowFrom` zurück.
- `groups.<room>.requireMention` – erfordert eine Erwähnung des Bots, bevor in einem
  bestimmten Gruppen-/Kanalraum geantwortet wird (Standard: false). `groups."*"` legt den Standard fest;
  raumspezifische `tools` / `toolsBySender` legen Überschreibungen der Tool-Richtlinie fest.
- `defaultTo` – Ausweichziel, wenn keines angegeben wird.
- `actions.messages` / `actions.reactions` / `actions.search` / `actions.threads` – aktionsspezifische Tool-Zugriffssteuerung.

Kontenübergreifende Schlüssel auf oberster Ebene:

- `accounts` – Datensatz benannter, kontospezifischer Überschreibungen, indiziert nach Konto-ID.
- `defaultAccount` – bevorzugte Konto-ID, wenn mehrere konfiguriert sind.

## Runner

Hostseitiger Selbsttest (schreibt einen Markdown-Bericht unter `.artifacts/qa-e2e/`):

```bash
pnpm qa:e2e
```

Dieser wird über `qa-lab` geleitet, startet den repo-internen QA-Bus, fährt den Runtime-Ausschnitt von `qa-channel` hoch und führt einen deterministischen Selbsttest aus.

Vollständige repo-gestützte Szenariosuite:

```bash
pnpm openclaw qa suite
```

Führt Szenarien parallel in der QA-Gateway-Lane aus. Informationen zu Szenarien, Profilen und Provider-Modi finden Sie in der [QA-Übersicht](/de/concepts/qa-e2e-automation).

Docker-gestützte QA-Site (Gateway und QA-Lab-Debugger-Benutzeroberfläche in einem Stack):

```bash
pnpm qa:lab:up
```

Erstellt die QA-Site, startet den Docker-gestützten Stack aus Gateway und QA Lab und gibt die QA-Lab-URL aus. Dort können Sie Szenarien auswählen, die Modell-Lane festlegen, einzelne Läufe starten und die Ergebnisse live verfolgen. Der QA-Lab-Debugger ist vom ausgelieferten Control-UI-Bundle getrennt.

## Verwandte Themen

- [QA-Übersicht](/de/concepts/qa-e2e-automation) – Gesamt-Stack, Transportadapter und Szenarioerstellung
- [Matrix-QA](/de/concepts/qa-matrix) – Beispiel für einen Live-Transport-Runner, der einen realen Kanal steuert
- [Kopplung](/de/channels/pairing)
- [Gruppen](/de/channels/groups)
- [Kanalübersicht](/de/channels)
