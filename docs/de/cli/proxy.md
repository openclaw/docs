---
read_when:
    - Sie müssen das vom Betreiber verwaltete Proxy-Routing vor der Bereitstellung validieren
    - Sie müssen OpenClaw-Transportdatenverkehr lokal zum Debuggen erfassen
    - Sie möchten Debug-Proxy-Sitzungen, Blobs oder integrierte Abfragevorgaben prüfen
summary: CLI-Referenz für `openclaw proxy`, einschließlich operatorverwalteter Proxy-Validierung und lokalem Debug-Proxy-Erfassungsinspektor
title: Proxy
x-i18n:
    generated_at: "2026-06-27T17:20:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c3883373f2aa6d365ed93bcb9f7da2bb9281b8bd061d1842bc5bef0f43b7ccb9
    source_path: cli/proxy.md
    workflow: 16
---

# `openclaw proxy`

Validieren Sie das vom Betreiber verwaltete Proxy-Routing oder führen Sie den lokalen expliziten Debug-Proxy aus
und untersuchen Sie den erfassten Traffic.

Verwenden Sie `validate`, um einen vom Betreiber verwalteten Forward-Proxy vor dem Aktivieren
des OpenClaw Proxy-Routings vorab zu prüfen. Die anderen Befehle sind Debugging-Tools für
Untersuchungen auf Transportebene: Sie können einen lokalen Proxy starten, einen untergeordneten Befehl
mit aktivierter Erfassung ausführen, Erfassungssitzungen auflisten, häufige Traffic-Muster abfragen,
erfasste Blobs lesen und lokale Erfassungsdaten bereinigen.

## Befehle

```bash
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy validate [--json] [--proxy-url <url>] [--proxy-ca-file <path>] [--allowed-url <url>] [--denied-url <url>] [--apns-reachable] [--apns-authority <url>] [--timeout-ms <ms>]
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

## Validieren

`openclaw proxy validate` prüft die effektive vom Betreiber verwaltete Proxy-URL aus
`--proxy-url`, der Konfiguration oder `OPENCLAW_PROXY_URL`. Verwaltete Proxy-URLs können
`http://` für einen einfachen Forward-Proxy-Listener oder `https://` verwenden, wenn OpenClaw
TLS zum Proxy-Endpunkt öffnen muss, bevor Proxy-Anfragen gesendet werden. Es meldet ein
Konfigurationsproblem, wenn kein Proxy aktiviert und konfiguriert ist; verwenden Sie `--proxy-url` für eine
einmalige Vorabprüfung, bevor Sie die Konfiguration ändern. Fügen Sie `--proxy-ca-file` hinzu, um einer
privaten CA für die TLS-Verbindung zu einem HTTPS-Proxy-Endpunkt zu vertrauen. Standardmäßig wird
überprüft, dass ein öffentliches Ziel über den Proxy erfolgreich erreicht wird und dass der Proxy
einen temporären loopback-Canary nicht erreichen kann. Benutzerdefinierte abgelehnte Ziele sind
fail-closed: HTTP-Antworten und mehrdeutige Transportfehler schlagen beide fehl, sofern Sie
kein deployment-spezifisches Ablehnungssignal separat verifizieren können. Fügen Sie
`--apns-reachable` hinzu, um zusätzlich einen APNs-HTTP/2-CONNECT-Tunnel durch den Proxy zu öffnen
und zu bestätigen, dass Sandbox-APNs antwortet; die Prüfung verwendet absichtlich ein ungültiges
Provider-Token, daher ist eine APNs-Antwort `403 InvalidProviderToken` ein erfolgreiches
Erreichbarkeitssignal.

Optionen:

- `--json`: Gibt maschinenlesbares JSON aus.
- `--proxy-url <url>`: Validiert diese `http://`- oder `https://`-Proxy-URL anstelle von Konfiguration oder Umgebung.
- `--proxy-ca-file <path>`: Vertraut dieser PEM-CA-Datei für die TLS-Verifizierung eines HTTPS-Proxy-Endpunkts.
- `--allowed-url <url>`: Fügt ein Ziel hinzu, das über den Proxy erfolgreich erreichbar sein soll. Wiederholen Sie dies, um mehrere Ziele zu prüfen.
- `--denied-url <url>`: Fügt ein Ziel hinzu, das vom Proxy blockiert werden soll. Wiederholen Sie dies, um mehrere Ziele zu prüfen.
- `--apns-reachable`: Überprüft zusätzlich, dass Sandbox-APNs-HTTP/2 über den Proxy erreichbar ist.
- `--apns-authority <url>`: APNs-Authority, die mit `--apns-reachable` geprüft wird (`https://api.sandbox.push.apple.com` standardmäßig; Produktion ist `https://api.push.apple.com`).
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
- Die direkte Upstream-Weiterleitung des Debug-Proxys öffnet Upstream-Sockets für Diagnosezwecke. Wenn der von OpenClaw verwaltete Proxy-Modus aktiv ist, ist die direkte Weiterleitung für Proxy-Anfragen und CONNECT-Tunnel standardmäßig deaktiviert; setzen Sie `OPENCLAW_DEBUG_PROXY_ALLOW_DIRECT_CONNECT_WITH_MANAGED_PROXY=1` nur für genehmigte lokale Diagnosen.
- `validate` wird mit Code 1 beendet, wenn die Proxy-Konfiguration oder Zielprüfungen fehlschlagen.
- Erfassungen sind lokale Debugging-Daten; verwenden Sie `openclaw proxy purge`, wenn Sie fertig sind.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Netzwerk-Proxy](/de/security/network-proxy)
- [Trusted-Proxy-Authentifizierung](/de/gateway/trusted-proxy-auth)
