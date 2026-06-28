---
read_when:
    - Sie möchten schnell den Betriebszustand des laufenden Gateway prüfen
summary: CLI-Referenz für `openclaw health` (Gateway-Zustands-Snapshot über RPC)
title: Zustand
x-i18n:
    generated_at: "2026-05-10T19:28:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 26be7bbbf75c2eca1213fe145fdeeab6fee96798dff457278ac69a20145bf75d
    source_path: cli/health.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# `openclaw health`

Ruft den Health-Status vom laufenden Gateway ab.

## Optionen

| Flag             | Standardwert | Beschreibung                                                              |
| ---------------- | ------------ | ------------------------------------------------------------------------- |
| `--json`         | `false`      | Gibt maschinenlesbares JSON statt Text aus.                               |
| `--timeout <ms>` | `10000`      | Verbindungs-Timeout in Millisekunden.                                     |
| `--verbose`      | `false`      | Ausführliche Protokollierung. Erzwingt eine Live-Prüfung und erweitert die Ausgabe pro Agent. |
| `--debug`        | `false`      | Alias für `--verbose`.                                                    |

Beispiele:

```bash
openclaw health
openclaw health --json
openclaw health --timeout 2500
openclaw health --verbose
openclaw health --debug
```

Hinweise:

- Standardmäßig fragt `openclaw health` das laufende Gateway nach seinem Health-Snapshot.
  Wenn das Gateway bereits einen frischen zwischengespeicherten Snapshot hat, kann es diese
  zwischengespeicherte Nutzlast zurückgeben und im Hintergrund aktualisieren.
- `--verbose` erzwingt eine Live-Prüfung, gibt Verbindungsdetails des Gateway aus und
  erweitert die menschenlesbare Ausgabe über alle konfigurierten Konten und Agenten hinweg.
- Die Ausgabe enthält Session Stores pro Agent, wenn mehrere Agenten konfiguriert sind.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Gateway-Health](/de/gateway/health)
