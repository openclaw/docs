---
read_when:
    - Sie möchten schnell den Zustand des laufenden Gateway prüfen
summary: CLI-Referenz für `openclaw health` (Gateway-Zustandssnapshot über RPC)
title: Systemzustand
x-i18n:
    generated_at: "2026-05-06T09:02:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 443684af04efce2c54a6679e13b0bff0a5c1869f85d60fae0e853aed0a362226
    source_path: cli/health.md
    workflow: 16
---

# `openclaw health`

Ruft den Integritätsstatus vom laufenden Gateway ab.

Optionen:

- `--json`: maschinenlesbare Ausgabe
- `--timeout <ms>`: Verbindungszeitlimit in Millisekunden (Standard `10000`)
- `--verbose`: ausführliche Protokollierung
- `--debug`: Alias für `--verbose`

Beispiele:

```bash
openclaw health
openclaw health --json
openclaw health --timeout 2500
openclaw health --verbose
openclaw health --debug
```

Hinweise:

- Standardmäßig fragt `openclaw health` das laufende Gateway nach seinem Integritäts-Snapshot. Wenn das
  Gateway bereits einen aktuellen zwischengespeicherten Snapshot hat, kann es diese zwischengespeicherte Payload zurückgeben und
  im Hintergrund aktualisieren.
- `--verbose` erzwingt eine Live-Prüfung, gibt Details zur Gateway-Verbindung aus und erweitert die
  menschenlesbare Ausgabe über alle konfigurierten Konten und Agenten hinweg.
- Die Ausgabe enthält Session Stores pro Agent, wenn mehrere Agenten konfiguriert sind.

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Gateway-Integritätsstatus](/de/gateway/health)
