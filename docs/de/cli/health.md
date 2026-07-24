---
read_when:
    - Sie möchten schnell den Zustand des laufenden Gateways überprüfen
summary: CLI-Referenz für `openclaw health` (Gateway-Zustandsübersicht über RPC)
title: Integrität
x-i18n:
    generated_at: "2026-07-24T04:29:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 51cc0e3dd61af3e6fa460dd646bfa1c3e5bd1a52da860eac26c12101151d081d
    source_path: cli/health.md
    workflow: 16
---

# `openclaw health`

Rufen Sie über WebSocket-RPC eine Zustandsübersicht vom laufenden Gateway ab (keine direkten Channel-Sockets von der CLI).

## Optionen

| Flag             | Standardwert | Beschreibung                                                                       |
| ---------------- | ------------ | ---------------------------------------------------------------------------------- |
| `--json`         | `false` | Gibt maschinenlesbares JSON anstelle von Text aus.                                 |
| `--timeout <ms>` | `10000` | Zeitüberschreitung der Verbindung in Millisekunden.                                |
| `--verbose`      | `false` | Erzwingt eine Live-Prüfung und erweitert die Ausgabe auf alle konfigurierten Konten und Agenten. |
| `--debug`        | `false` | Alias für `--verbose`.                                                      |

Beispiele:

```bash
openclaw health
openclaw health --json
openclaw health --timeout 2500
openclaw health --verbose
openclaw health --debug
```

## Verhalten

- Ohne `--verbose` kann das Gateway eine zwischengespeicherte Übersicht zurückgeben (bis zu 60 Sekunden aktuell und gegenüber dem Live-Zustand der Channel-Laufzeit unverändert) und sie im Hintergrund für den nächsten Aufrufer aktualisieren.
- `--verbose` erzwingt eine Live-Prüfung (kontospezifische Prüfungen pro Channel), gibt Details zur Gateway-Verbindung aus und erweitert die menschenlesbare Ausgabe auf alle konfigurierten Konten und Agenten, statt nur den Standardagenten anzuzeigen.
- `--json` gibt stets die vollständige Übersicht zurück: Channels, kontospezifische Prüfungen, Plugin-Ladestatus, Quarantänestatus der Kontext-Engine, Status des Modellpreis-Caches, Zustand der Ereignisschleife, Dead Letters der Zustellungswarteschlange und sitzungsbezogene Speicher pro Agent.
- Wenn ausgehende Zustellungen oder eingehende Channel-Ereignisse als Dead Letters abgelegt werden, meldet die Textausgabe deren Anzahl und das Alter des ältesten Fehlers. Die Anzahl eingehender Ereignisse wird nach Channel-Konto gruppiert; einzelne Ereignisse können Sie mit [`openclaw channels dead-letters`](/de/cli/channels#inbound-dead-letters) untersuchen oder wiederherstellen.

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [`openclaw status`](/de/cli/status) — lokale Diagnose und Channel-Prüfungen ohne vollständige Zustandsübersicht
- [Gateway-Zustand](/de/gateway/health)
