---
read_when:
    - Sie möchten mehrschichtige Abwehrmaßnahmen gegen SSRF- und DNS-Rebinding-Angriffe
    - Konfigurieren eines externen Forward-Proxys für OpenClaw-Laufzeitdatenverkehr
summary: So leiten Sie HTTP- und WebSocket-Datenverkehr der OpenClaw-Laufzeit über einen vom Betreiber verwalteten Filter-Proxy
title: Netzwerk-Proxy
x-i18n:
    generated_at: "2026-05-01T06:45:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9207d349e4410e38631ae7665be19b536e4a4128a4e80dd095e802804dfd66a3
    source_path: security/network-proxy.md
    workflow: 16
---

# Netzwerk-Proxy

OpenClaw kann HTTP- und WebSocket-Datenverkehr zur Laufzeit über einen vom Betreiber verwalteten Forward Proxy leiten. Dies ist eine optionale zusätzliche Schutzebene für Bereitstellungen, die zentrale Kontrolle des ausgehenden Datenverkehrs, stärkeren SSRF-Schutz und bessere Netzwerk-Auditierbarkeit benötigen.

OpenClaw liefert keinen Proxy aus, lädt keinen herunter, startet keinen, konfiguriert keinen und zertifiziert keinen. Sie betreiben die Proxy-Technologie, die zu Ihrer Umgebung passt, und OpenClaw leitet normale prozesslokale HTTP- und WebSocket-Clients darüber.

## Warum einen Proxy verwenden?

Ein Proxy gibt Betreibern einen zentralen Netzwerk-Kontrollpunkt für ausgehenden HTTP- und WebSocket-Datenverkehr. Das kann auch außerhalb der SSRF-Härtung nützlich sein:

- Zentrale Richtlinie: Pflegen Sie eine Egress-Richtlinie, statt sich darauf zu verlassen, dass jede HTTP-Aufrufstelle der Anwendung die Netzwerkregeln korrekt umsetzt.
- Prüfungen beim Verbindungsaufbau: Bewerten Sie das Ziel nach der DNS-Auflösung und unmittelbar bevor der Proxy die Upstream-Verbindung öffnet.
- Schutz vor DNS-Rebinding: Verringern Sie die Lücke zwischen einer DNS-Prüfung auf Anwendungsebene und der tatsächlichen ausgehenden Verbindung.
- Breitere JavaScript-Abdeckung: Leiten Sie gewöhnliche `fetch`-, `node:http`-, `node:https`-, WebSocket-, axios-, got-, node-fetch- und ähnliche Clients über denselben Pfad.
- Auditierbarkeit: Protokollieren Sie erlaubte und abgelehnte Ziele an der Egress-Grenze.
- Betriebskontrolle: Erzwingen Sie Zielregeln, Netzwerksegmentierung, Ratenlimits oder ausgehende Allowlists, ohne OpenClaw neu zu erstellen.

Proxy-Routing ist eine Schutzvorkehrung auf Prozessebene für normalen HTTP- und WebSocket-Egress. Es gibt Betreibern einen Fail-Closed-Pfad, um unterstützte JavaScript-HTTP-Clients über ihren eigenen filternden Proxy zu leiten, ist aber keine Netzwerk-Sandbox auf Betriebssystemebene und lässt OpenClaw die Zielrichtlinie des Proxys nicht zertifizieren.

## Wie OpenClaw Datenverkehr leitet

Wenn `proxy.enabled=true` ist und eine Proxy-URL konfiguriert wurde, leiten geschützte Laufzeitprozesse wie `openclaw gateway run`, `openclaw node run` und `openclaw agent --local` normalen HTTP- und WebSocket-Egress über den konfigurierten Proxy:

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

Der öffentliche Vertrag ist das Routing-Verhalten, nicht die internen Node-Hooks, mit denen es implementiert wird. WebSocket-Clients der OpenClaw Gateway Control Plane verwenden einen schmalen direkten Pfad für local loopback Gateway-RPC-Datenverkehr, wenn die Gateway-URL `localhost` oder eine wörtliche Loopback-IP wie `127.0.0.1` oder `[::1]` verwendet. Dieser Control-Plane-Pfad muss loopback Gateways erreichen können, selbst wenn der Betreiber-Proxy Loopback-Ziele blockiert. Normale HTTP- und WebSocket-Anfragen zur Laufzeit verwenden weiterhin den konfigurierten Proxy.

Intern verwendet OpenClaw für diese Funktion zwei Routing-Hooks auf Prozessebene:

- Undici-Dispatcher-Routing deckt `fetch`, Undici-gestützte Clients und Transports ab, die ihren eigenen Undici-Dispatcher bereitstellen.
- `global-agent`-Routing deckt Node-Core-Aufrufer von `node:http` und `node:https` ab, einschließlich vieler Bibliotheken, die auf `http.request`, `https.request`, `http.get` und `https.get` aufbauen. Der verwaltete Proxy-Modus erzwingt diesen globalen Agent, damit explizite Node-HTTP-Agents den Betreiber-Proxy nicht versehentlich umgehen.

Einige Plugins besitzen benutzerdefinierte Transports, die explizite Proxy-Verdrahtung benötigen, selbst wenn Routing auf Prozessebene vorhanden ist. Zum Beispiel verwendet Telegrams Bot-API-Transport seinen eigenen HTTP/1-Undici-Dispatcher und berücksichtigt daher die Prozess-Proxy-Umgebung sowie den verwalteten `OPENCLAW_PROXY_URL`-Fallback in diesem eigentümerspezifischen Transportpfad.

Die Proxy-URL selbst muss `http://` verwenden. HTTPS-Ziele werden über den Proxy weiterhin mit HTTP `CONNECT` unterstützt; das bedeutet nur, dass OpenClaw einen einfachen HTTP-Forward-Proxy-Listener wie `http://127.0.0.1:3128` erwartet.

Während der Proxy aktiv ist, löscht OpenClaw `no_proxy`, `NO_PROXY` und `GLOBAL_AGENT_NO_PROXY`. Diese Bypass-Listen sind zielbasiert, daher würden Einträge wie `localhost` oder `127.0.0.1` risikoreichen SSRF-Zielen erlauben, den filternden Proxy zu umgehen.

Beim Herunterfahren stellt OpenClaw die vorherige Proxy-Umgebung wieder her und setzt zwischengespeicherten Prozess-Routing-Zustand zurück.

## Verwandte Proxy-Begriffe

- `proxy.enabled` / `proxy.proxyUrl`: ausgehendes Forward-Proxy-Routing für OpenClaw-Egress zur Laufzeit. Diese Seite dokumentiert diese Funktion.
- `gateway.auth.mode: "trusted-proxy"`: eingehende identitätsbewusste Reverse-Proxy-Authentifizierung für Gateway-Zugriff. Siehe [Trusted-Proxy-Authentifizierung](/de/gateway/trusted-proxy-auth).
- `openclaw proxy`: lokaler Debug-Proxy und Capture-Inspector für Entwicklung und Support. Siehe [openclaw proxy](/de/cli/proxy).
- Channel- oder Provider-spezifische Proxy-Einstellungen: eigentümerspezifische Überschreibungen für einen bestimmten Transport. Bevorzugen Sie den verwalteten Netzwerk-Proxy, wenn das Ziel zentrale Egress-Kontrolle über die Laufzeit hinweg ist.

## Konfiguration

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

Sie können die URL auch über die Umgebung bereitstellen, während `proxy.enabled=true` in der Konfiguration bleibt:

```bash
OPENCLAW_PROXY_URL=http://127.0.0.1:3128 openclaw gateway run
```

`proxy.proxyUrl` hat Vorrang vor `OPENCLAW_PROXY_URL`.

Wenn `enabled=true` ist, aber keine gültige Proxy-URL konfiguriert wurde, schlagen geschützte Befehle beim Start fehl, statt auf direkten Netzwerkzugriff zurückzufallen.

Für verwaltete Gateway-Dienste, die mit `openclaw gateway start` gestartet werden, sollten Sie die URL bevorzugt in der Konfiguration speichern:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

Der Umgebungs-Fallback eignet sich am besten für Vordergrundausführungen. Wenn Sie ihn mit einem installierten Dienst verwenden, legen Sie `OPENCLAW_PROXY_URL` in der dauerhaften Umgebung des Dienstes ab, zum Beispiel in `$OPENCLAW_STATE_DIR/.env` oder `~/.openclaw/.env`, und installieren Sie den Dienst anschließend neu, damit launchd, systemd oder Scheduled Tasks das Gateway mit diesem Wert starten.

Für `openclaw --container ...`-Befehle leitet OpenClaw `OPENCLAW_PROXY_URL` an die containerzielgerichtete untergeordnete CLI weiter, wenn es gesetzt ist. Die URL muss aus dem Container heraus erreichbar sein; `127.0.0.1` verweist auf den Container selbst, nicht auf den Host. OpenClaw lehnt Loopback-Proxy-URLs für containerzielgerichtete Befehle ab, sofern Sie diese Sicherheitsprüfung nicht ausdrücklich überschreiben.

## Proxy-Anforderungen

Die Proxy-Richtlinie ist die Sicherheitsgrenze. OpenClaw kann nicht überprüfen, dass der Proxy die richtigen Ziele blockiert.

Konfigurieren Sie den Proxy so, dass er:

- nur an loopback oder eine private vertrauenswürdige Schnittstelle bindet.
- den Zugriff so beschränkt, dass nur der OpenClaw-Prozess, Host, Container oder das Dienstkonto ihn verwenden kann.
- Ziele selbst auflöst und Ziel-IPs nach der DNS-Auflösung blockiert.
- Richtlinien beim Verbindungsaufbau sowohl für einfache HTTP-Anfragen als auch für HTTPS-`CONNECT`-Tunnel anwendet.
- zielbasierte Bypasses für loopback-, private, link-local-, Metadaten-, Multicast-, reservierte oder Dokumentationsbereiche ablehnt.
- Hostname-Allowlists vermeidet, sofern Sie dem DNS-Auflösungspfad nicht vollständig vertrauen.
- Ziel, Entscheidung, Status und Grund protokolliert, ohne Anfragebodies, Autorisierungsheader, Cookies oder andere Geheimnisse zu protokollieren.
- Proxy-Richtlinien unter Versionskontrolle hält und Änderungen wie sicherheitssensible Konfiguration prüft.

## Empfohlene blockierte Ziele

Verwenden Sie diese Denylist als Ausgangspunkt für jeden Forward Proxy, jede Firewall oder jede Egress-Richtlinie.

Die Klassifizierungslogik von OpenClaw auf Anwendungsebene befindet sich in `src/infra/net/ssrf.ts` und `src/shared/net/ip.ts`. Die relevanten Parity-Hooks sind `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX` und die eingebettete IPv4-Sentinel-Behandlung für NAT64, 6to4, Teredo, ISATAP und IPv4-gemappte Formen. Diese Dateien sind nützliche Referenzen bei der Pflege einer externen Proxy-Richtlinie, aber OpenClaw exportiert oder erzwingt diese Regeln nicht automatisch in Ihrem Proxy.

| Bereich oder Host                                                                    | Warum blockieren                                     |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | IPv4-loopback                                        |
| `::1/128`                                                                            | IPv6-loopback                                        |
| `0.0.0.0/8`, `::/128`                                                                | Nicht spezifizierte Adressen und Adressen dieses Netzwerks |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | Private Netzwerke nach RFC1918                       |
| `169.254.0.0/16`, `fe80::/10`                                                        | Link-local-Adressen und gängige Cloud-Metadatenpfade |
| `169.254.169.254`, `metadata.google.internal`                                        | Cloud-Metadatendienste                               |
| `100.64.0.0/10`                                                                      | Gemeinsamer Adressraum für Carrier-grade NAT         |
| `198.18.0.0/15`, `2001:2::/48`                                                       | Benchmarking-Bereiche                                |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | Special-use- und Dokumentationsbereiche              |
| `224.0.0.0/4`, `ff00::/8`                                                            | Multicast                                            |
| `240.0.0.0/4`                                                                        | Reserviertes IPv4                                    |
| `fc00::/7`, `fec0::/10`                                                              | Lokale/private IPv6-Bereiche                         |
| `100::/64`, `2001:20::/28`                                                           | IPv6-Discard- und ORCHIDv2-Bereiche                  |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | NAT64-Präfixe mit eingebettetem IPv4                 |
| `2002::/16`, `2001::/32`                                                             | 6to4 und Teredo mit eingebettetem IPv4               |
| `::/96`, `::ffff:0:0/96`                                                             | IPv4-kompatibles und IPv4-gemapptes IPv6             |

Wenn Ihr Cloud-Provider oder Ihre Netzwerkplattform zusätzliche Metadaten-Hosts oder reservierte Bereiche dokumentiert, fügen Sie diese ebenfalls hinzu.

## Validierung

Validieren Sie den Proxy vom selben Host, Container oder Dienstkonto aus, auf dem OpenClaw läuft:

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

Standardmäßig prüft der Befehl, wenn keine benutzerdefinierten Ziele angegeben werden, dass `https://example.com/` erfolgreich ist, und startet einen temporären Loopback-Canary, den der Proxy nicht erreichen darf. Die standardmäßige Prüfung für abgelehnte Ziele ist erfolgreich, wenn der Proxy eine Nicht-2xx-Ablehnungsantwort zurückgibt oder den Canary mit einem Transportfehler blockiert; sie schlägt fehl, wenn eine erfolgreiche Antwort den Canary erreicht. Wenn kein Proxy aktiviert und konfiguriert ist, meldet die Validierung ein Konfigurationsproblem; verwenden Sie `--proxy-url` für einen einmaligen Preflight, bevor Sie die Konfiguration ändern. Verwenden Sie `--allowed-url` und `--denied-url`, um bereitstellungsspezifische Erwartungen zu testen. Benutzerdefinierte abgelehnte Ziele sind fail-closed: Jede HTTP-Antwort bedeutet, dass das Ziel über den Proxy erreichbar war, und jeder Transportfehler wird als nicht schlüssig gemeldet, weil OpenClaw nicht beweisen kann, dass der Proxy einen erreichbaren Ursprung blockiert hat. Bei einem Validierungsfehler beendet sich der Befehl mit Code 1.

Verwenden Sie `--json` für Automatisierung. Die JSON-Ausgabe enthält das Gesamtergebnis, die effektive Quelle der Proxy-Konfiguration, etwaige Konfigurationsfehler und jede Zielprüfung. Proxy-URL-Anmeldedaten werden in Text- und JSON-Ausgabe redigiert:

```json
{
  "ok": true,
  "config": {
    "enabled": true,
    "proxyUrl": "http://127.0.0.1:3128/",
    "source": "override",
    "errors": []
  },
  "checks": [
    {
      "kind": "allowed",
      "url": "https://example.com/",
      "ok": true,
      "status": 200
    }
  ]
}
```

Sie können auch manuell mit `curl` validieren:

```bash
curl -x http://127.0.0.1:3128 https://example.com/
curl -x http://127.0.0.1:3128 http://127.0.0.1/
curl -x http://127.0.0.1:3128 http://169.254.169.254/
```

Die öffentliche Anfrage sollte erfolgreich sein. Die Loopback- und Metadatenanfragen sollten vom Proxy blockiert werden. Bei `openclaw proxy validate` kann die integrierte Loopback-Canary eine Proxy-Ablehnung von einem erreichbaren Ursprung unterscheiden. Benutzerdefinierte Prüfungen mit `--denied-url` verfügen nicht über diese Canary. Behandeln Sie daher sowohl HTTP-Antworten als auch mehrdeutige Transportfehler als Validierungsfehler, es sei denn, Ihr Proxy stellt ein bereitstellungsspezifisches Ablehnungssignal bereit, das Sie separat verifizieren können.

Aktivieren Sie anschließend das OpenClaw-Proxy-Routing:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway run
```

oder legen Sie Folgendes fest:

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

## Einschränkungen

- Der Proxy verbessert die Abdeckung für prozesslokale JavaScript-HTTP- und WebSocket-Clients, ist aber keine Netzwerk-Sandbox auf Betriebssystemebene.
- Raw-`net`-, `tls`- und `http2`-Sockets, native Add-ons und Kindprozesse können Node-Level-Proxy-Routing umgehen, sofern sie Proxy-Umgebungsvariablen nicht erben und beachten.
- Lokale WebUIs und lokale Modellserver von Benutzern sollten bei Bedarf in der Proxy-Richtlinie des Betreibers auf die Zulassungsliste gesetzt werden; OpenClaw stellt für sie keinen allgemeinen Bypass für lokale Netzwerke bereit.
- Der Proxy-Bypass der Gateway-Control-Plane ist absichtlich auf `localhost` und literale Loopback-IP-URLs beschränkt. Verwenden Sie `ws://127.0.0.1:18789`, `ws://[::1]:18789` oder `ws://localhost:18789` für lokale direkte Gateway-Control-Plane-Verbindungen; andere Hostnamen werden wie gewöhnlicher hostnamebasierter Datenverkehr geroutet.
- OpenClaw prüft, testet oder zertifiziert Ihre Proxy-Richtlinie nicht.
- Behandeln Sie Änderungen an der Proxy-Richtlinie als sicherheitsrelevante Betriebsänderungen.
