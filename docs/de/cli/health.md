---
read_when:
    - Sie möchten den Status des laufenden Gateways schnell überprüfen
summary: CLI-Referenz für `openclaw health` (Momentaufnahme des Gateway-Zustands über RPC)
title: Zustand
x-i18n:
    generated_at: "2026-07-12T15:12:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a26ce5ade9ab56c9751c3dde814c38a1e01e74d91c2fd57e56d3c44ca529d0d8
    source_path: cli/health.md
    workflow: 16
---

# `openclaw health`

Ruft über WebSocket-RPC eine Zustandsmomentaufnahme vom laufenden Gateway ab (keine direkten Channel-Sockets von der CLI).

## Optionen

| Flag             | Standardwert | Beschreibung                                                                                                                 |
| ---------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `--json`         | `false`      | Gibt maschinenlesbares JSON anstelle von Text aus.                                                                           |
| `--timeout <ms>` | `10000`      | Zeitüberschreitung für die Verbindung in Millisekunden.                                                                      |
| `--verbose`      | `false`      | Erzwingt eine Live-Prüfung und erweitert die Ausgabe auf alle konfigurierten Konten und Agenten.                              |
| `--debug`        | `false`      | Alias für `--verbose`.                                                                                                       |

Beispiele:

```bash
openclaw health
openclaw health --json
openclaw health --timeout 2500
openclaw health --verbose
openclaw health --debug
```

## Verhalten

- Ohne `--verbose` kann das Gateway eine zwischengespeicherte Momentaufnahme zurückgeben (bis zu 60 Sekunden aktuell und gegenüber dem Live-Zustand der Channel-Laufzeit unverändert) und sie im Hintergrund für den nächsten Aufrufer aktualisieren.
- `--verbose` erzwingt eine Live-Prüfung (Prüfungen der Konten pro Channel), gibt Details zur Gateway-Verbindung aus und erweitert die menschenlesbare Ausgabe auf alle konfigurierten Konten und Agenten, statt nur auf den Standardagenten.
- `--json` gibt immer die vollständige Momentaufnahme zurück: Channels, Prüfungen pro Konto, Plugin-Ladestatus, Quarantänestatus der Kontext-Engine, Cache-Status der Modellpreise, Zustand der Ereignisschleife und Sitzungsspeicher pro Agent.

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [`openclaw status`](/de/cli/status) — lokale Diagnose und Channel-Prüfungen ohne vollständige Zustandsmomentaufnahme
- [Gateway-Zustand](/de/gateway/health)
