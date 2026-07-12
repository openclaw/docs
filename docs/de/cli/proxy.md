---
read_when:
    - Sie müssen das vom Betreiber verwaltete Proxy-Routing vor der Bereitstellung validieren.
    - Sie müssen den OpenClaw-Transportdatenverkehr zur Fehlerbehebung lokal erfassen
    - Sie möchten Debug-Proxy-Sitzungen, Blobs oder integrierte Abfragevoreinstellungen untersuchen
summary: CLI-Referenz für `openclaw proxy`, einschließlich der vom Betreiber verwalteten Proxy-Validierung und des lokalen Inspektors für Debug-Proxy-Aufzeichnungen
title: Proxy
x-i18n:
    generated_at: "2026-07-12T15:14:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 91583f785032bfffe455a1963804108550f6fbb735ac4de1dd91d0ca5ae0df35
    source_path: cli/proxy.md
    workflow: 16
---

# `openclaw proxy`

Validieren Sie das vom Betreiber verwaltete Proxy-Routing oder führen Sie den lokalen expliziten Debug-Proxy aus und untersuchen Sie den erfassten Datenverkehr.

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

`validate` führt Vorabprüfungen für einen vom Betreiber verwalteten Forward-Proxy durch. Die übrigen Befehle sind Debugging-Werkzeuge für Untersuchungen auf Transportebene: Starten Sie einen lokalen Proxy mit Datenverkehrserfassung, führen Sie einen untergeordneten Befehl darüber aus, listen Sie Erfassungssitzungen auf, fragen Sie Datenverkehrsmuster ab, lesen Sie erfasste Blobs und löschen Sie lokale Erfassungsdaten.

## Validierung

Prüft die effektive URL des vom Betreiber verwalteten Proxys aus `--proxy-url`, der Konfiguration (`proxy.proxyUrl`) oder `OPENCLAW_PROXY_URL` in dieser Prioritätsreihenfolge. Meldet ein Konfigurationsproblem, wenn kein Proxy aktiviert und konfiguriert ist; übergeben Sie `--proxy-url` für eine einmalige Vorabprüfung, ohne die Konfiguration zu ändern.

Verwaltete Proxy-URLs verwenden `http://` für einen einfachen Forward-Proxy-Listener oder `https://`, wenn OpenClaw zunächst TLS zum Proxy-Endpunkt aufbauen muss, bevor Proxy-Anfragen gesendet werden. Verwenden Sie `--proxy-ca-file`, um einer privaten CA für diese TLS-Verbindung zu vertrauen.

Standardmäßig werden folgende Prüfungen ausgeführt:

- eine **zulässige** Prüfung für `https://example.com/` (mit `--allowed-url` überschreiben/ergänzen, wiederholbar)
- eine **abgewiesene** Prüfung für einen temporären Loopback-Canary (mit `--denied-url` überschreiben, wiederholbar)

Benutzerdefinierte Ziele für `--denied-url` arbeiten nach dem Fail-Closed-Prinzip: Sowohl HTTP-Antworten als auch mehrdeutige Transportfehler gelten als Fehler, sofern Sie nicht unabhängig ein bereitstellungsspezifisches Ablehnungssignal verifizieren können. Der integrierte Loopback-Canary ist das einzige Ziel, bei dem ein Transportfehler als Nachweis einer Blockierung gilt.

Fügen Sie `--apns-reachable` hinzu, um zusätzlich einen APNs-HTTP/2-CONNECT-Tunnel durch den Proxy zu öffnen und zu bestätigen, dass die APNs-Sandbox antwortet. Die Prüfung sendet absichtlich ein ungültiges Provider-Token, daher gilt eine APNs-Antwort vom Typ `403 InvalidProviderToken` als erfolgreiches Erreichbarkeitssignal (nicht als Fehler).

### Optionen

| Flag                     | Wirkung                                                                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `--json`                 | gibt maschinenlesbares JSON aus                                                                                                       |
| `--proxy-url <url>`      | validiert diese `http://`-/`https://`-Proxy-URL anstelle der Konfiguration oder Umgebungsvariable                                     |
| `--proxy-ca-file <path>` | vertraut dieser PEM-CA-Datei bei der TLS-Verifizierung eines HTTPS-Proxy-Endpunkts                                                     |
| `--allowed-url <url>`    | Ziel, das über den Proxy erfolgreich erreichbar sein soll (wiederholbar)                                                              |
| `--denied-url <url>`     | Ziel, das vom Proxy blockiert werden soll (wiederholbar)                                                                               |
| `--apns-reachable`       | überprüft zusätzlich, ob APNs-HTTP/2 der Sandbox über den Proxy erreichbar ist                                                        |
| `--apns-authority <url>` | zu prüfende APNs-Authority (Standard: `https://api.sandbox.push.apple.com`; Produktion: `https://api.push.apple.com`)                  |
| `--timeout-ms <ms>`      | Zeitüberschreitung pro Anfrage                                                                                                        |

Wird mit Code 1 beendet, wenn die Proxy-Konfiguration oder Zielprüfungen fehlschlagen.

Bereitstellungshinweise und Informationen zur Ablehnungssemantik finden Sie unter [Netzwerk-Proxy](/de/security/network-proxy).

## Debug-Proxy

`start` startet einen lokalen Proxy mit Datenverkehrserfassung und gibt dessen URL, den Pfad zum CA-Zertifikat und den Pfad zur Erfassungsdatenbank aus; beenden Sie ihn mit Ctrl+C. Standardmäßig erfolgt die Bindung an `127.0.0.1`, sofern `--host` nicht festgelegt ist.

`run` startet einen lokalen Debug-Proxy und führt anschließend `<cmd...>` (nach `--`) mit angewendeter Proxy-Umgebung in einer eigenen Erfassungssitzung aus.

Die direkte Upstream-Weiterleitung des Debug-Proxys öffnet zu Diagnosezwecken Upstream-Sockets. Wenn der verwaltete Proxy-Modus von OpenClaw aktiv ist, ist die direkte Weiterleitung für Proxy-Anfragen und CONNECT-Tunnel standardmäßig deaktiviert; setzen Sie `OPENCLAW_DEBUG_PROXY_ALLOW_DIRECT_CONNECT_WITH_MANAGED_PROXY=1` nur für genehmigte lokale Diagnosen.

`coverage` gibt einen JSON-Bericht (`summary` und transportbezogene `entries`) darüber aus, welche Transporte erfasst werden, ausschließlich über den Proxy laufen oder nicht abgedeckt sind.

`sessions` listet die letzten Erfassungssitzungen auf (`--limit`, Standard: 20).

`query --preset <name>` führt eine integrierte Abfrage für den erfassten Datenverkehr aus, optional beschränkt auf `--session <id>`. Voreinstellungen:

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

`blob --id <blobId>` gibt den Rohinhalt eines erfassten Nutzdaten-Blobs aus.

`purge` löscht alle Metadaten und Blobs des erfassten Datenverkehrs. Erfassungen sind lokale Debugging-Daten; löschen Sie sie nach Abschluss.

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Netzwerk-Proxy](/de/security/network-proxy)
- [Vertrauenswürdige Proxy-Authentifizierung](/de/gateway/trusted-proxy-auth)
