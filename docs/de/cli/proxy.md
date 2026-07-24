---
read_when:
    - Sie müssen das vom Betreiber verwaltete Proxy-Routing vor der Bereitstellung validieren.
    - Sie müssen den OpenClaw-Transportdatenverkehr zur Fehlerbehebung lokal erfassen
    - Sie möchten Debug-Proxy-Sitzungen, Blobs oder integrierte Abfragevoreinstellungen prüfen
summary: CLI-Referenz für `openclaw proxy`, einschließlich der Validierung betreiberverwalteter Proxys und des lokalen Inspektors für Debug-Proxy-Aufzeichnungen
title: Proxy
x-i18n:
    generated_at: "2026-07-24T03:45:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 91583f785032bfffe455a1963804108550f6fbb735ac4de1dd91d0ca5ae0df35
    source_path: cli/proxy.md
    workflow: 16
---

# `openclaw proxy`

Validieren Sie das betreiberverwaltete Proxy-Routing oder führen Sie den lokalen expliziten Debug-Proxy aus und untersuchen Sie den erfassten Datenverkehr.

```bash
openclaw proxy validate [--json] [--proxy-url <url>] [--proxy-ca-file <path>] [--allowed-url <url>] [--denied-url <url>] [--apns-reachable] [--apns-authority <url>] [--timeout-ms <ms>]
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

`validate` führt Vorabprüfungen für einen betreiberverwalteten Forward-Proxy durch. Die übrigen Befehle sind Debugging-Werkzeuge für Untersuchungen auf Transportebene: Sie starten einen lokalen erfassenden Proxy, führen einen untergeordneten Befehl darüber aus, listen Erfassungssitzungen auf, fragen Datenverkehrsmuster ab, lesen erfasste Blobs und löschen lokale Erfassungsdaten.

## Validieren

Prüft die effektive betreiberverwaltete Proxy-URL aus `--proxy-url`, der Konfiguration (`proxy.proxyUrl`) oder `OPENCLAW_PROXY_URL` in dieser Prioritätsreihenfolge. Meldet ein Konfigurationsproblem, wenn kein Proxy aktiviert und konfiguriert ist; übergeben Sie `--proxy-url` für eine einmalige Vorabprüfung, ohne die Konfiguration zu ändern.

Verwaltete Proxy-URLs verwenden `http://` für einen einfachen Forward-Proxy-Listener oder `https://`, wenn OpenClaw zunächst eine TLS-Verbindung zum Proxy-Endpunkt selbst herstellen muss, bevor Proxy-Anfragen gesendet werden. Verwenden Sie `--proxy-ca-file`, um einer privaten CA für diese TLS-Verbindung zu vertrauen.

Standardmäßig werden folgende Prüfungen ausgeführt:

- eine **zulässige** Prüfung für `https://example.com/` (mit `--allowed-url` überschreiben/ergänzen, wiederholbar)
- eine **abgelehnte** Prüfung für einen temporären Loopback-Canary (mit `--denied-url` überschreiben, wiederholbar)

Benutzerdefinierte `--denied-url`-Ziele arbeiten nach dem Fail-Closed-Prinzip: Sowohl HTTP-Antworten als auch mehrdeutige Transportfehler gelten als Fehlschläge, sofern Sie nicht unabhängig ein bereitstellungsspezifisches Ablehnungssignal verifizieren können. Der integrierte Loopback-Canary ist das einzige Ziel, bei dem ein Transportfehler als Nachweis der Blockierung gilt.

Fügen Sie `--apns-reachable` hinzu, um außerdem einen APNs-HTTP/2-CONNECT-Tunnel durch den Proxy zu öffnen und zu bestätigen, dass die APNs-Sandbox antwortet. Die Prüfung sendet absichtlich ein ungültiges Provider-Token, daher gilt eine APNs-Antwort vom Typ `403 InvalidProviderToken` als erfolgreiches Erreichbarkeitssignal (nicht als Fehlschlag).

### Optionen

| Flag                     | Wirkung                                                                                                             |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `--json`                 | gibt maschinenlesbares JSON aus                                                                                        |
| `--proxy-url <url>`      | validiert diese `http://`- oder `https://`-Proxy-URL anstelle der Konfiguration oder Umgebungsvariablen                                              |
| `--proxy-ca-file <path>` | vertraut dieser PEM-CA-Datei für die TLS-Verifizierung eines HTTPS-Proxy-Endpunkts                                             |
| `--allowed-url <url>`    | Ziel, das über den Proxy voraussichtlich erfolgreich erreichbar ist (wiederholbar)                                                     |
| `--denied-url <url>`     | Ziel, das voraussichtlich vom Proxy blockiert wird (wiederholbar)                                                       |
| `--apns-reachable`       | verifiziert außerdem, dass APNs-HTTP/2 in der Sandbox über den Proxy erreichbar ist                                                     |
| `--apns-authority <url>` | zu prüfende APNs-Authority (Standard: `https://api.sandbox.push.apple.com`; Produktion: `https://api.push.apple.com`) |
| `--timeout-ms <ms>`      | Zeitüberschreitung pro Anfrage                                                                                                |

Wird mit Exit-Code 1 beendet, wenn die Proxy-Konfiguration oder die Zielprüfungen fehlschlagen.

Bereitstellungshinweise und Ablehnungssemantik finden Sie unter [Netzwerk-Proxy](/de/security/network-proxy).

## Debug-Proxy

`start` startet einen lokalen erfassenden Proxy und gibt dessen URL, den Pfad zum CA-Zertifikat und den Pfad zur Erfassungsdatenbank aus; beenden Sie ihn mit Ctrl+C. Standardmäßig erfolgt die Bindung an `127.0.0.1`, sofern `--host` nicht festgelegt ist.

`run` startet einen lokalen Debug-Proxy und führt anschließend `<cmd...>` (nach `--`) mit angewendeten Proxy-Umgebungsvariablen in einer eigenen Erfassungssitzung aus.

Die direkte Upstream-Weiterleitung des Debug-Proxys öffnet Upstream-Sockets für Diagnosezwecke. Wenn der verwaltete Proxy-Modus von OpenClaw aktiv ist, ist die direkte Weiterleitung für Proxy-Anfragen und CONNECT-Tunnel standardmäßig deaktiviert; legen Sie `OPENCLAW_DEBUG_PROXY_ALLOW_DIRECT_CONNECT_WITH_MANAGED_PROXY=1` nur für genehmigte lokale Diagnosen fest.

`coverage` gibt einen JSON-Bericht (`summary` und `entries` pro Transport) darüber aus, welche Transporte erfasst werden, ausschließlich über den Proxy laufen oder nicht abgedeckt sind.

`sessions` listet die letzten Erfassungssitzungen auf (`--limit`, Standard: 20).

`query --preset <name>` führt eine integrierte Abfrage für den erfassten Datenverkehr aus, die optional auf `--session <id>` beschränkt werden kann. Voreinstellungen:

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

`blob --id <blobId>` gibt den Rohinhalt eines erfassten Nutzdaten-Blobs aus.

`purge` löscht sämtliche Metadaten und Blobs des erfassten Datenverkehrs. Erfassungen sind lokale Debugging-Daten; löschen Sie sie nach Abschluss.

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Netzwerk-Proxy](/de/security/network-proxy)
- [Authentifizierung über vertrauenswürdigen Proxy](/de/gateway/trusted-proxy-auth)
