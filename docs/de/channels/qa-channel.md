---
read_when:
    - Sie binden den synthetischen QA-Transport in einen lokalen oder CI-Testlauf ein
    - Sie benötigen die mitgelieferte qa-channel-Konfigurationsoberfläche
    - Sie arbeiten iterativ an der End-to-End-QA-Automatisierung
summary: Synthetisches Kanal-Plugin der Slack-Klasse für deterministische OpenClaw-QA-Szenarien
title: QA-Kanal
x-i18n:
    generated_at: "2026-05-01T06:41:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: efe057812de1fbc6d89d2b6d5860cd6af4648c3e86913efa3a69267c4e8c57b4
    source_path: channels/qa-channel.md
    workflow: 16
---

`qa-channel` ist ein mitgelieferter synthetischer Nachrichtentransport für automatisierte OpenClaw-QA. Er ist kein Produktionskanal — er dient dazu, dieselbe Kanal-Plugin-Grenze zu prüfen, die von echten Transporten verwendet wird, während der Zustand deterministisch und vollständig überprüfbar bleibt.

## Was er tut

- Zielgrammatik der Slack-Klasse:
  - `dm:<user>`
  - `channel:<room>`
  - `group:<room>`
  - `thread:<room>/<thread>`
- Gemeinsame `channel:`- und `group:`-Konversationen werden Agenten als Gruppen-/Kanalraum-Turns bereitgestellt, sodass sie dieselbe Routing-Richtlinie für sichtbare Antworten und Nachrichten-Tools prüfen, die von Discord, Slack, Telegram und ähnlichen Transporten verwendet wird.
- HTTP-gestützter synthetischer Bus zum Einspeisen eingehender Nachrichten, Erfassen ausgehender Transkripte, Erstellen von Threads, Reaktionen, Bearbeitungen, Löschungen sowie Such-/Leseaktionen.
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

Kontoschlüssel:

- `enabled` — Hauptschalter für dieses Konto.
- `name` — optionales Anzeigelabel.
- `baseUrl` — URL des synthetischen Busses.
- `botUserId` — Bot-Benutzer-ID im Matrix-Stil, die in der Zielgrammatik verwendet wird.
- `botDisplayName` — Anzeigename für ausgehende Nachrichten.
- `pollTimeoutMs` — Wartefenster für Long Polling. Ganzzahl zwischen 100 und 30000.
- `allowFrom` — Absender-Allowlist (Benutzer-IDs oder `"*"`).
- `defaultTo` — Fallback-Ziel, wenn keines angegeben ist.
- `actions.messages` / `actions.reactions` / `actions.search` / `actions.threads` — Tool-Gating pro Aktion.

Multi-Account-Schlüssel auf der obersten Ebene:

- `accounts` — Datensatz benannter kontoabhängiger Überschreibungen, nach Konto-ID geschlüsselt.
- `defaultAccount` — bevorzugte Konto-ID, wenn mehrere konfiguriert sind.

## Runner

Host-seitiger Self-Check (schreibt einen Markdown-Bericht unter `.artifacts/qa-e2e/`):

```bash
pnpm qa:e2e
```

Dies läuft über `qa-lab`, startet den QA-Bus im Repo, bootet den mitgelieferten `qa-channel`-Runtime-Ausschnitt und führt einen deterministischen Self-Check aus.

Vollständige repo-gestützte Szenario-Suite:

```bash
pnpm openclaw qa suite
```

Führt Szenarien parallel gegen die QA-Gateway-Lane aus. Siehe [QA-Überblick](/de/concepts/qa-e2e-automation) für Szenarien, Profile und Provider-Modi.

Docker-gestützte QA-Site (Gateway + QA Lab-Debugger-UI in einem Stack):

```bash
pnpm qa:lab:up
```

Baut die QA-Site, startet den Docker-gestützten Gateway- + QA Lab-Stack und gibt die QA Lab-URL aus. Von dort aus können Sie Szenarien auswählen, die Modell-Lane wählen, einzelne Läufe starten und Ergebnisse live verfolgen. Der QA Lab-Debugger ist vom ausgelieferten Control UI-Bundle getrennt.

## Verwandt

- [QA-Überblick](/de/concepts/qa-e2e-automation) — Gesamt-Stack, Transportadapter, Szenarioerstellung
- [Matrix-QA](/de/concepts/qa-matrix) — Beispiel für einen Live-Transport-Runner, der einen echten Kanal steuert
- [Koppeln](/de/channels/pairing)
- [Gruppen](/de/channels/groups)
- [Kanalüberblick](/de/channels)
