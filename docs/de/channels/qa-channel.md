---
read_when:
    - Sie binden den synthetischen QA-Transport in einen lokalen oder CI-Testlauf ein
    - Sie benötigen die Konfigurationsoberfläche des mitgelieferten qa-channel.
    - Sie entwickeln die End-to-End-QA-Automatisierung iterativ weiter
summary: Synthetisches Plugin für Kanäle der Slack-Klasse für deterministische OpenClaw-QA-Szenarien
title: QA-Kanal
x-i18n:
    generated_at: "2026-07-12T01:23:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f33af6ef31515e0cab0ee2540f48f3ffea8aba3d13915dc8cf66111599354187
    source_path: channels/qa-channel.md
    workflow: 16
---

`qa-channel` ist ein repo-lokaler synthetischer Nachrichtentransport für die automatisierte OpenClaw-QA (`extensions/qa-channel`, privates Paket, von paketierten Installationen ausgeschlossen). Es handelt sich nicht um einen produktiven Kanal – er dient dazu, dieselbe Kanal-Plugin-Grenze zu testen, die von realen Transporten verwendet wird, wobei der Zustand deterministisch und vollständig einsehbar bleibt.

## Funktionsweise

- Zielsyntax nach Slack-Vorbild:
  - `dm:<user>`
  - `channel:<room>`
  - `group:<room>`
  - `thread:<room>/<thread>`
- Gemeinsame `channel:`- und `group:`-Unterhaltungen werden Agenten als Gruppen-/Kanalraum-Interaktionen bereitgestellt, sodass sie dieselben Richtlinien für sichtbare Antworten und das Routing von Nachrichtenwerkzeugen durchlaufen, die auch von Discord, Slack, Telegram und ähnlichen Transporten verwendet werden.
- HTTP-gestützter synthetischer Bus zum Einspeisen eingehender Nachrichten, Erfassen ausgehender Transkripte, Erstellen von Threads sowie für Reaktionen, Bearbeitungen, Löschvorgänge und Such-/Leseaktionen.
- Hostseitiger Selbsttest-Runner, der einen Markdown-Bericht in `.artifacts/qa-e2e/` schreibt.

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
  bestimmten Gruppen-/Kanalraum geantwortet wird (Standard: false). `groups."*"` legt den Standardwert fest;
  raumspezifische `tools` / `toolsBySender` legen Überschreibungen der Werkzeugrichtlinie fest.
- `defaultTo` – Ausweichziel, wenn keines angegeben ist.
- `actions.messages` / `actions.reactions` / `actions.search` / `actions.threads` – aktionsbezogene Werkzeugfreigabe.

Schlüssel für mehrere Konten auf oberster Ebene:

- `accounts` – Zuordnung benannter kontospezifischer Überschreibungen, indiziert nach Konto-ID.
- `defaultAccount` – bevorzugte Konto-ID, wenn mehrere Konten konfiguriert sind.

## Runner

Hostseitiger Selbsttest (schreibt einen Markdown-Bericht unter `.artifacts/qa-e2e/`):

```bash
pnpm qa:e2e
```

Dieser wird über `qa-lab` geleitet, startet den QA-Bus im Repository, fährt den `qa-channel`-Runtime-Ausschnitt hoch und führt einen deterministischen Selbsttest aus.

Vollständige, repositorygestützte Szenariosuite:

```bash
pnpm openclaw qa suite
```

Führt Szenarien parallel in der QA-Gateway-Lane aus. Szenarien, Profile und Provider-Modi finden Sie in der [QA-Übersicht](/de/concepts/qa-e2e-automation).

Docker-gestützte QA-Website (Gateway und Debugger-UI von QA Lab in einem Stack):

```bash
pnpm qa:lab:up
```

Erstellt die QA-Website, startet den Docker-gestützten Stack aus Gateway und QA Lab und gibt die QA-Lab-URL aus. Dort können Sie Szenarien auswählen, die Modell-Lane festlegen, einzelne Durchläufe starten und die Ergebnisse live verfolgen. Der QA-Lab-Debugger ist vom ausgelieferten Control-UI-Bundle getrennt.

## Verwandte Themen

- [QA-Übersicht](/de/concepts/qa-e2e-automation) – Gesamtarchitektur, Transportadapter, Erstellung von Szenarien
- [Matrix-QA](/de/concepts/qa-matrix) – Beispiel für einen Live-Transport-Runner, der einen realen Kanal ansteuert
- [Kopplung](/de/channels/pairing)
- [Gruppen](/de/channels/groups)
- [Kanalübersicht](/de/channels)
