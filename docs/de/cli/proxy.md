---
read_when:
    - Sie müssen das vom Betreiber verwaltete Proxy-Routing vor der Bereitstellung validieren
    - Sie müssen OpenClaw-Transportdatenverkehr lokal zur Fehlerbehebung erfassen
    - Sie möchten Debug-Proxy-Sitzungen, Blobs oder integrierte Abfragevorgaben untersuchen
summary: CLI-Referenz für `openclaw proxy`, einschließlich der betreiberverwalteten Proxy-Validierung und des Inspektors für Mitschnitte des lokalen Debug-Proxys
title: Proxy
x-i18n:
    generated_at: "2026-05-01T06:41:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: e0820de861bfe1ec14e0c1624d636d6474b5fedd317e3ba1baaa61f6530e06e9
    source_path: cli/proxy.md
    workflow: 16
---

# `openclaw proxy`

Validieren Sie vom Operator verwaltetes Proxy-Routing, oder führen Sie den lokalen expliziten Debug-Proxy aus
und prüfen Sie den erfassten Traffic.

Verwenden Sie `validate`, um einen vom Operator verwalteten Forward-Proxy vor der Aktivierung von
OpenClaw Proxy-Routing vorab zu prüfen. Die anderen Befehle sind Debugging-Werkzeuge für
Untersuchungen auf Transportebene: Sie können einen lokalen Proxy starten, einen untergeordneten Befehl
mit aktivierter Erfassung ausführen, Erfassungssitzungen auflisten, gängige Traffic-Muster abfragen, erfasste
Blobs lesen und lokale Erfassungsdaten löschen.

## Befehle

```bash
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy validate [--json] [--proxy-url <url>] [--allowed-url <url>] [--denied-url <url>] [--timeout-ms <ms>]
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

## Validieren

`openclaw proxy validate` prüft die effektive vom Operator verwaltete Proxy-URL aus
`--proxy-url`, der Konfiguration oder `OPENCLAW_PROXY_URL`. Der Befehl meldet ein Konfigurationsproblem, wenn
kein Proxy aktiviert und konfiguriert ist; verwenden Sie `--proxy-url` für eine einmalige Vorabprüfung,
bevor Sie die Konfiguration ändern. Standardmäßig wird verifiziert, dass ein öffentliches Ziel
über den Proxy erfolgreich erreicht wird und dass der Proxy keinen temporären local loopback-Canary erreichen kann.
Benutzerdefinierte verweigerte Ziele sind fail-closed: HTTP-Antworten und mehrdeutige
Transportfehler schlagen beide fehl, sofern Sie kein bereitstellungsspezifisches Verweigerungssignal
separat verifizieren können.

Optionen:

- `--json`: gibt maschinenlesbares JSON aus.
- `--proxy-url <url>`: validiert diese Proxy-URL statt Konfiguration oder Env.
- `--allowed-url <url>`: fügt ein Ziel hinzu, das über den Proxy erfolgreich erreichbar sein soll. Wiederholen Sie die Option, um mehrere Ziele zu prüfen.
- `--denied-url <url>`: fügt ein Ziel hinzu, das vom Proxy blockiert werden soll. Wiederholen Sie die Option, um mehrere Ziele zu prüfen.
- `--timeout-ms <ms>`: Zeitlimit pro Anfrage in Millisekunden.

Siehe [Network Proxy](/de/security/network-proxy) für Bereitstellungshinweise und Verweigerungssemantik.

## Abfrage-Presets

`openclaw proxy query --preset <name>` akzeptiert:

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

## Hinweise

- `start` verwendet standardmäßig `127.0.0.1`, sofern `--host` nicht gesetzt ist.
- `run` startet einen lokalen Debug-Proxy und führt danach den Befehl nach `--` aus.
- `validate` beendet sich mit Code 1, wenn Proxy-Konfiguration oder Zielprüfungen fehlschlagen.
- Erfassungen sind lokale Debugging-Daten; verwenden Sie `openclaw proxy purge`, wenn Sie fertig sind.

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Network Proxy](/de/security/network-proxy)
- [Trusted proxy auth](/de/gateway/trusted-proxy-auth)
