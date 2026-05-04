---
read_when:
    - Sie müssen das vom Betreiber verwaltete Proxy-Routing vor der Bereitstellung validieren
    - Sie müssen OpenClaw-Transportdatenverkehr lokal zur Fehlerbehebung erfassen
    - Sie möchten Debug-Proxy-Sitzungen, Blobs oder integrierte Abfragevoreinstellungen untersuchen
summary: CLI-Referenz für `openclaw proxy`, einschließlich der betreiberverwalteten Proxy-Validierung und des lokalen Inspektors für Debug-Proxy-Erfassungen
title: Proxy
x-i18n:
    generated_at: "2026-05-04T18:23:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 092c4e946dcab5e78e37d6fc77bb067b7a649368f8571fa127e462a85fa14ce5
    source_path: cli/proxy.md
    workflow: 16
---

# `openclaw proxy`

Validieren Sie das vom Betreiber verwaltete Proxy-Routing, oder führen Sie den lokalen expliziten Debug-Proxy aus und prüfen Sie den erfassten Datenverkehr.

Verwenden Sie `validate`, um einen vom Betreiber verwalteten Forward-Proxy vor der Aktivierung des OpenClaw-Proxy-Routings vorab zu prüfen. Die anderen Befehle sind Debugging-Werkzeuge für Untersuchungen auf Transportebene: Sie können einen lokalen Proxy starten, einen untergeordneten Befehl mit aktivierter Erfassung ausführen, Erfassungssitzungen auflisten, häufige Datenverkehrsmuster abfragen, erfasste Blobs lesen und lokale Erfassungsdaten bereinigen.

## Befehle

```bash
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy validate [--json] [--proxy-url <url>] [--allowed-url <url>] [--denied-url <url>] [--apns-reachable] [--apns-authority <url>] [--timeout-ms <ms>]
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

## Validieren

`openclaw proxy validate` prüft die effektive vom Betreiber verwaltete Proxy-URL aus `--proxy-url`, der Konfiguration oder `OPENCLAW_PROXY_URL`. Es meldet ein Konfigurationsproblem, wenn kein Proxy aktiviert und konfiguriert ist; verwenden Sie `--proxy-url` für eine einmalige Vorabprüfung, bevor Sie die Konfiguration ändern. Standardmäßig wird überprüft, dass ein öffentliches Ziel über den Proxy erfolgreich erreichbar ist und dass der Proxy keinen temporären Loopback-Canary erreichen kann. Benutzerdefinierte verweigerte Ziele werden bei Fehlern verweigernd behandelt: HTTP-Antworten und mehrdeutige Transportfehler schlagen beide fehl, sofern Sie kein bereitstellungsspezifisches Verweigerungssignal separat überprüfen können. Fügen Sie `--apns-reachable` hinzu, um zusätzlich einen APNs-HTTP/2-CONNECT-Tunnel über den Proxy zu öffnen und zu bestätigen, dass Sandbox-APNs antwortet; die Prüfung verwendet absichtlich ein ungültiges Provider-Token, daher ist eine APNs-Antwort `403 InvalidProviderToken` ein erfolgreiches Erreichbarkeitssignal.

Optionen:

- `--json`: Gibt maschinenlesbares JSON aus.
- `--proxy-url <url>`: Validiert diese Proxy-URL anstelle von Konfiguration oder Umgebung.
- `--allowed-url <url>`: Fügt ein Ziel hinzu, das über den Proxy erfolgreich erreichbar sein soll. Wiederholen Sie die Option, um mehrere Ziele zu prüfen.
- `--denied-url <url>`: Fügt ein Ziel hinzu, das vom Proxy blockiert werden soll. Wiederholen Sie die Option, um mehrere Ziele zu prüfen.
- `--apns-reachable`: Überprüft zusätzlich, dass Sandbox-APNs-HTTP/2 über den Proxy erreichbar ist.
- `--apns-authority <url>`: APNs-Autorität, die mit `--apns-reachable` geprüft wird (`https://api.sandbox.push.apple.com` standardmäßig; Produktion ist `https://api.push.apple.com`).
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
- `run` startet einen lokalen Debug-Proxy und führt dann den Befehl nach `--` aus.
- Die direkte Upstream-Weiterleitung des Debug-Proxys öffnet Upstream-Sockets für Diagnosezwecke. Wenn der von OpenClaw verwaltete Proxy-Modus aktiv ist, ist die direkte Weiterleitung für Proxy-Anfragen und CONNECT-Tunnel standardmäßig deaktiviert; setzen Sie `OPENCLAW_DEBUG_PROXY_ALLOW_DIRECT_CONNECT_WITH_MANAGED_PROXY=1` nur für genehmigte lokale Diagnosen.
- `validate` beendet sich mit Code 1, wenn die Proxy-Konfiguration oder Zielprüfungen fehlschlagen.
- Erfassungen sind lokale Debugging-Daten; verwenden Sie `openclaw proxy purge`, wenn Sie fertig sind.

## Verwandte Themen

- [CLI reference](/de/cli)
- [Network Proxy](/de/security/network-proxy)
- [Trusted proxy auth](/de/gateway/trusted-proxy-auth)
