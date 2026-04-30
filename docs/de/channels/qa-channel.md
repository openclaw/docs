---
read_when:
    - Sie binden den synthetischen QA-Transport in einen lokalen oder CI-Testlauf ein
    - Sie benötigen die mitgelieferte qa-channel-Konfigurationsoberfläche
    - Sie arbeiten iterativ an der End-to-End-QA-Automatisierung
summary: Synthetisches Kanal-Plugin der Slack-Klasse für deterministische OpenClaw-QA-Szenarien
title: QA-Kanal
x-i18n:
    generated_at: "2026-04-30T06:41:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: e1de1f52da1a14c845cf2a536ddc6f36ab52ed6364f68d9ece32ce272e2a2f96
    source_path: channels/qa-channel.md
    workflow: 16
---

`qa-channel` ist ein gebündelter synthetischer Nachrichtentransport für automatisierte OpenClaw-QA. Er ist kein Produktionskanal — er dient dazu, dieselbe Channel-Plugin-Grenze zu testen, die von echten Transporten verwendet wird, während der Zustand deterministisch und vollständig inspizierbar bleibt.

## Funktion

- Slack-artige Zielgrammatik:
  - `dm:<user>`
  - `channel:<room>`
  - `thread:<room>/<thread>`
- HTTP-gestützter synthetischer Bus für das Einschleusen eingehender Nachrichten, das Erfassen ausgehender Transkripte, Thread-Erstellung, Reaktionen, Bearbeitungen, Löschungen sowie Such-/Leseaktionen.
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

- `enabled` — Hauptschalter für dieses Konto.
- `name` — optionale Anzeigebezeichnung.
- `baseUrl` — URL des synthetischen Busses.
- `botUserId` — Bot-Benutzer-ID im Matrix-Stil, die in der Zielgrammatik verwendet wird.
- `botDisplayName` — Anzeigename für ausgehende Nachrichten.
- `pollTimeoutMs` — Wartefenster für Long Polling. Ganzzahl zwischen 100 und 30000.
- `allowFrom` — Absender-Allowlist (Benutzer-IDs oder `"*"`).
- `defaultTo` — Fallback-Ziel, wenn keines angegeben wird.
- `actions.messages` / `actions.reactions` / `actions.search` / `actions.threads` — Tool-Freischaltung pro Aktion.

Multi-Account-Schlüssel auf oberster Ebene:

- `accounts` — Zuordnung benannter kontospezifischer Überschreibungen, indiziert nach Konto-ID.
- `defaultAccount` — bevorzugte Konto-ID, wenn mehrere konfiguriert sind.

## Runner

Hostseitiger Self-Check (schreibt einen Markdown-Bericht unter `.artifacts/qa-e2e/`):

```bash
pnpm qa:e2e
```

Dies läuft über `qa-lab`, startet den QA-Bus im Repository, bootet das gebündelte `qa-channel`-Runtime-Slice und führt einen deterministischen Self-Check aus.

Vollständige repo-gestützte Szenario-Suite:

```bash
pnpm openclaw qa suite
```

Führt Szenarien parallel gegen die QA-Gateway-Lane aus. Siehe [QA-Übersicht](/de/concepts/qa-e2e-automation) für Szenarien, Profile und Provider-Modi.

Docker-gestützte QA-Site (Gateway + QA-Lab-Debugger-UI in einem Stack):

```bash
pnpm qa:lab:up
```

Baut die QA-Site, startet den Docker-gestützten Gateway- + QA-Lab-Stack und gibt die QA-Lab-URL aus. Von dort aus können Sie Szenarien auswählen, die Modell-Lane wählen, einzelne Läufe starten und Ergebnisse live verfolgen. Der QA-Lab-Debugger ist vom ausgelieferten Control-UI-Bundle getrennt.

## Verwandte Themen

- [QA-Übersicht](/de/concepts/qa-e2e-automation) — Gesamt-Stack, Transportadapter, Szenarioerstellung
- [Matrix-QA](/de/concepts/qa-matrix) — Beispiel für einen Live-Transport-Runner, der einen echten Kanal steuert
- [Kopplung](/de/channels/pairing)
- [Gruppen](/de/channels/groups)
- [Channel-Übersicht](/de/channels)
