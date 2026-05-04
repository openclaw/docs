---
read_when:
    - Sie müssen das vom Betreiber verwaltete Proxy-Routing vor der Bereitstellung validieren
    - Sie müssen den OpenClaw-Transportdatenverkehr lokal zur Fehlersuche erfassen
    - Sie möchten Debug-Proxy-Sitzungen, Blobs oder integrierte Abfragevoreinstellungen prüfen
summary: CLI-Referenz für `openclaw proxy`, einschließlich der betreiberverwalteten Proxy-Validierung und der lokalen Prüfansicht für Debug-Proxy-Erfassungen
title: Proxy
x-i18n:
    generated_at: "2026-05-04T06:41:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9589bedafb97c31bcb6536a04307cd0c6550e1f307693bd4401785d79f34a1eb
    source_path: cli/proxy.md
    workflow: 16
---

# `openclaw proxy`

Validieren Sie vom Betreiber verwaltetes Proxy-Routing oder führen Sie den lokalen expliziten Debug-Proxy aus
und prüfen Sie erfassten Traffic.

Verwenden Sie `validate`, um einen vom Betreiber verwalteten Forward-Proxy vor dem Aktivieren des
OpenClaw-Proxy-Routings vorab zu prüfen. Die anderen Befehle sind Debugging-Werkzeuge für
Untersuchungen auf Transportebene: Sie können einen lokalen Proxy starten, einen untergeordneten Befehl
mit aktivierter Erfassung ausführen, Erfassungssitzungen auflisten, häufige Traffic-Muster abfragen, erfasste
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

`openclaw proxy validate` prüft die effektive vom Betreiber verwaltete Proxy-URL aus
`--proxy-url`, der Konfiguration oder `OPENCLAW_PROXY_URL`. Es meldet ein Konfigurationsproblem, wenn
kein Proxy aktiviert und konfiguriert ist; verwenden Sie `--proxy-url` für eine einmalige Vorabprüfung,
bevor Sie die Konfiguration ändern. Standardmäßig wird geprüft, ob ein öffentliches Ziel
über den Proxy erfolgreich erreicht wird und ob der Proxy keinen temporären Loopback-Canary erreichen kann.
Benutzerdefinierte abgelehnte Ziele sind fail-closed: HTTP-Antworten und mehrdeutige
Transportfehler schlagen beide fehl, sofern Sie kein bereitstellungsspezifisches Ablehnungssignal
separat verifizieren können.

Optionen:

- `--json`: Maschinenlesbares JSON ausgeben.
- `--proxy-url <url>`: Diese Proxy-URL statt Konfiguration oder env validieren.
- `--allowed-url <url>`: Ein Ziel hinzufügen, das über den Proxy erfolgreich sein soll. Wiederholen, um mehrere Ziele zu prüfen.
- `--denied-url <url>`: Ein Ziel hinzufügen, das vom Proxy blockiert werden soll. Wiederholen, um mehrere Ziele zu prüfen.
- `--timeout-ms <ms>`: Zeitlimit pro Anfrage in Millisekunden.

Siehe [Netzwerk-Proxy](/de/security/network-proxy) für Hinweise zur Bereitstellung und
Ablehnungssemantik.

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
- `run` startet einen lokalen Debug-Proxy und führt anschließend den Befehl nach `--` aus.
- Das direkte Upstream-Forwarding des Debug-Proxys öffnet Upstream-Sockets für Diagnosen. Wenn der von OpenClaw verwaltete Proxy-Modus aktiv ist, ist direktes Forwarding für Proxy-Anfragen und CONNECT-Tunnel standardmäßig deaktiviert; setzen Sie `OPENCLAW_DEBUG_PROXY_ALLOW_DIRECT_CONNECT_WITH_MANAGED_PROXY=1` nur für genehmigte lokale Diagnosen.
- `validate` wird mit Code 1 beendet, wenn die Proxy-Konfiguration oder Zielprüfungen fehlschlagen.
- Erfassungen sind lokale Debugging-Daten; verwenden Sie `openclaw proxy purge`, wenn Sie fertig sind.

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Netzwerk-Proxy](/de/security/network-proxy)
- [Authentifizierung für vertrauenswürdige Proxys](/de/gateway/trusted-proxy-auth)
