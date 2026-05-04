---
read_when:
    - Sie möchten mehrschichtigen Schutz gegen SSRF- und DNS-Rebinding-Angriffe
    - Konfigurieren eines externen Forward-Proxys für OpenClaw-Laufzeitverkehr
summary: So leiten Sie den HTTP- und WebSocket-Datenverkehr der OpenClaw-Laufzeit über einen vom Betreiber verwalteten Filter-Proxy
title: Netzwerk-Proxy
x-i18n:
    generated_at: "2026-05-04T02:25:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: cd5594324e8c6b7da51d903e98fda0feacb8970e0b15d980f7a249d6641461c9
    source_path: security/network-proxy.md
    workflow: 16
---

# Netzwerk-Proxy

OpenClaw kann Runtime-HTTP- und WebSocket-Datenverkehr über einen von Betreibern verwalteten Forward-Proxy leiten. Dies ist eine optionale mehrschichtige Verteidigung für Bereitstellungen, die zentrale Egress-Kontrolle, stärkeren SSRF-Schutz und bessere Netzwerk-Auditierbarkeit wünschen.

OpenClaw liefert, lädt, startet, konfiguriert oder zertifiziert keinen Proxy. Sie betreiben die Proxy-Technologie, die zu Ihrer Umgebung passt, und OpenClaw leitet normale prozesslokale HTTP- und WebSocket-Clients darüber.

## Warum einen Proxy verwenden?

Ein Proxy gibt Betreibern einen zentralen Netzwerk-Kontrollpunkt für ausgehenden HTTP- und WebSocket-Datenverkehr. Das kann auch außerhalb der SSRF-Härtung nützlich sein:

- Zentrale Richtlinie: Pflegen Sie eine Egress-Richtlinie, statt sich darauf zu verlassen, dass jede HTTP-Aufrufstelle der Anwendung die Netzwerkregeln korrekt umsetzt.
- Prüfungen zum Verbindungszeitpunkt: Bewerten Sie das Ziel nach der DNS-Auflösung und unmittelbar bevor der Proxy die Upstream-Verbindung öffnet.
- Schutz vor DNS-Rebinding: Verringern Sie die Lücke zwischen einer DNS-Prüfung auf Anwendungsebene und der tatsächlichen ausgehenden Verbindung.
- Breitere JavaScript-Abdeckung: Leiten Sie gewöhnliche `fetch`, `node:http`, `node:https`, WebSocket, axios, got, node-fetch und ähnliche Clients über denselben Pfad.
- Auditierbarkeit: Protokollieren Sie erlaubte und verweigerte Ziele an der Egress-Grenze.
- Betriebliche Kontrolle: Erzwingen Sie Zielregeln, Netzwerksegmentierung, Ratenbegrenzungen oder ausgehende Allowlists, ohne OpenClaw neu zu bauen.

Proxy-Routing ist eine Guardrail auf Prozessebene für normalen HTTP- und WebSocket-Egress. Es gibt Betreibern einen fail-closed Pfad, um unterstützte JavaScript-HTTP-Clients über ihren eigenen filternden Proxy zu leiten, ist aber keine Netzwerk-Sandbox auf Betriebssystemebene und bedeutet nicht, dass OpenClaw die Zielrichtlinie des Proxy zertifiziert.

## Wie OpenClaw Datenverkehr weiterleitet

Wenn `proxy.enabled=true` gesetzt und eine Proxy-URL konfiguriert ist, leiten geschützte Runtime-Prozesse wie `openclaw gateway run`, `openclaw node run` und `openclaw agent --local` normalen HTTP- und WebSocket-Egress über den konfigurierten Proxy:

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

Der öffentliche Vertrag ist das Routing-Verhalten, nicht die internen Node-Hooks, mit denen es implementiert wird. OpenClaw Gateway-Control-Plane-WebSocket-Clients verwenden einen schmalen direkten Pfad für local loopback-Gateway-RPC-Datenverkehr, wenn die Gateway-URL `localhost` oder eine literale Loopback-IP wie `127.0.0.1` oder `[::1]` verwendet. Dieser Control-Plane-Pfad muss Loopback-Gateways erreichen können, selbst wenn der Betreiber-Proxy Loopback-Ziele blockiert. Normale Runtime-HTTP- und WebSocket-Anfragen verwenden weiterhin den konfigurierten Proxy.

Intern verwendet OpenClaw zwei Routing-Hooks auf Prozessebene für diese Funktion:

- Undici-Dispatcher-Routing deckt `fetch`, undici-basierte Clients und Transports ab, die ihren eigenen undici-Dispatcher bereitstellen.
- `global-agent`-Routing deckt Aufrufer von Node-Core `node:http` und `node:https` ab, einschließlich vieler Bibliotheken, die auf `http.request`, `https.request`, `http.get` und `https.get` aufsetzen. Der verwaltete Proxy-Modus erzwingt diesen globalen Agent, damit explizite Node-HTTP-Agents den Betreiber-Proxy nicht versehentlich umgehen.

Einige Plugins besitzen eigene Transports, die explizite Proxy-Verdrahtung benötigen, selbst wenn Routing auf Prozessebene vorhanden ist. Beispielsweise verwendet der Bot-API-Transport von Telegram seinen eigenen HTTP/1-undici-Dispatcher und berücksichtigt daher Prozess-Proxy-Umgebungsvariablen plus den verwalteten Fallback `OPENCLAW_PROXY_URL` in diesem ownerspezifischen Transportpfad.

Die Proxy-URL selbst muss `http://` verwenden. HTTPS-Ziele werden über den Proxy weiterhin mit HTTP `CONNECT` unterstützt; dies bedeutet nur, dass OpenClaw einen einfachen HTTP-Forward-Proxy-Listener wie `http://127.0.0.1:3128` erwartet.

Während der Proxy aktiv ist, leert OpenClaw `no_proxy`, `NO_PROXY` und `GLOBAL_AGENT_NO_PROXY`. Diese Umgehungslisten sind zielbasiert, sodass `localhost` oder `127.0.0.1` dort riskante SSRF-Ziele den filternden Proxy umgehen lassen würden.

Beim Herunterfahren stellt OpenClaw die vorherige Proxy-Umgebung wieder her und setzt den zwischengespeicherten Prozess-Routing-Zustand zurück.

## Verwandte Proxy-Begriffe

- `proxy.enabled` / `proxy.proxyUrl`: ausgehendes Forward-Proxy-Routing für OpenClaw-Runtime-Egress. Diese Seite dokumentiert diese Funktion.
- `gateway.auth.mode: "trusted-proxy"`: eingehende identitätsbewusste Reverse-Proxy-Authentifizierung für Gateway-Zugriff. Siehe [Trusted-Proxy-Authentifizierung](/de/gateway/trusted-proxy-auth).
- `openclaw proxy`: lokaler Debug-Proxy und Capture-Inspector für Entwicklung und Support. Siehe [openclaw proxy](/de/cli/proxy).
- Kanal- oder Provider-spezifische Proxy-Einstellungen: ownerspezifische Overrides für einen bestimmten Transport. Bevorzugen Sie den verwalteten Netzwerk-Proxy, wenn das Ziel zentrale Egress-Kontrolle über die Runtime hinweg ist.

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

Wenn `enabled=true` gesetzt ist, aber keine gültige Proxy-URL konfiguriert ist, schlagen geschützte Befehle beim Start fehl, statt auf direkten Netzwerkzugriff zurückzufallen.

Für verwaltete Gateway-Dienste, die mit `openclaw gateway start` gestartet werden, sollten Sie die URL bevorzugt in der Konfiguration speichern:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

Der Umgebungs-Fallback eignet sich am besten für Vordergrundläufe. Wenn Sie ihn mit einem installierten Dienst verwenden, legen Sie `OPENCLAW_PROXY_URL` in der dauerhaften Umgebung des Dienstes ab, etwa in `$OPENCLAW_STATE_DIR/.env` oder `~/.openclaw/.env`, und installieren Sie den Dienst dann neu, damit launchd, systemd oder Scheduled Tasks das Gateway mit diesem Wert startet.

Für `openclaw --container ...`-Befehle leitet OpenClaw `OPENCLAW_PROXY_URL` an die containerbezogene Child-CLI weiter, wenn sie gesetzt ist. Die URL muss aus dem Container heraus erreichbar sein; `127.0.0.1` verweist auf den Container selbst, nicht auf den Host. OpenClaw weist Loopback-Proxy-URLs für containerbezogene Befehle zurück, es sei denn, Sie überschreiben diese Sicherheitsprüfung ausdrücklich.

## Proxy-Anforderungen

Die Proxy-Richtlinie ist die Sicherheitsgrenze. OpenClaw kann nicht überprüfen, ob der Proxy die richtigen Ziele blockiert.

Konfigurieren Sie den Proxy so, dass er:

- Nur an Loopback oder eine private vertrauenswürdige Schnittstelle bindet.
- Den Zugriff so einschränkt, dass nur der OpenClaw-Prozess, Host, Container oder das Dienstkonto ihn verwenden kann.
- Ziele selbst auflöst und Ziel-IPs nach der DNS-Auflösung blockiert.
- Richtlinien zum Verbindungszeitpunkt sowohl für einfache HTTP-Anfragen als auch für HTTPS-`CONNECT`-Tunnel anwendet.
- Zielbasierte Umgehungen für Loopback-, private, Link-Local-, Metadata-, Multicast-, reservierte oder Dokumentationsbereiche ablehnt.
- Hostname-Allowlists vermeidet, sofern Sie dem DNS-Auflösungspfad nicht vollständig vertrauen.
- Ziel, Entscheidung, Status und Grund protokolliert, ohne Request-Bodies, Autorisierungs-Header, Cookies oder andere Secrets zu protokollieren.
- Die Proxy-Richtlinie unter Versionskontrolle hält und Änderungen wie sicherheitssensitive Konfiguration prüft.

## Empfohlene blockierte Ziele

Verwenden Sie diese Denylist als Ausgangspunkt für jeden Forward-Proxy, jede Firewall oder jede Egress-Richtlinie.

Die Klassifizierungslogik auf OpenClaw-Anwendungsebene befindet sich in `src/infra/net/ssrf.ts` und `src/shared/net/ip.ts`. Die relevanten Parity-Hooks sind `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX` und die eingebettete IPv4-Sentinel-Behandlung für NAT64, 6to4, Teredo, ISATAP und IPv4-mapped Formen. Diese Dateien sind nützliche Referenzen bei der Pflege einer externen Proxy-Richtlinie, aber OpenClaw exportiert oder erzwingt diese Regeln nicht automatisch in Ihrem Proxy.

| Bereich oder Host                                                                    | Warum blockieren                                    |
| ------------------------------------------------------------------------------------ | --------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | IPv4-Loopback                                       |
| `::1/128`                                                                            | IPv6-Loopback                                       |
| `0.0.0.0/8`, `::/128`                                                                | Nicht spezifizierte und This-Network-Adressen       |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | Private RFC1918-Netzwerke                           |
| `169.254.0.0/16`, `fe80::/10`                                                        | Link-Local-Adressen und gängige Cloud-Metadata-Pfade |
| `169.254.169.254`, `metadata.google.internal`                                        | Cloud-Metadata-Dienste                              |
| `100.64.0.0/10`                                                                      | Gemeinsamer Adressraum für Carrier-Grade-NAT        |
| `198.18.0.0/15`, `2001:2::/48`                                                       | Benchmarking-Bereiche                               |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | Special-Use- und Dokumentationsbereiche             |
| `224.0.0.0/4`, `ff00::/8`                                                            | Multicast                                           |
| `240.0.0.0/4`                                                                        | Reserviertes IPv4                                   |
| `fc00::/7`, `fec0::/10`                                                              | Lokale/private IPv6-Bereiche                        |
| `100::/64`, `2001:20::/28`                                                           | IPv6-Discard- und ORCHIDv2-Bereiche                 |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | NAT64-Präfixe mit eingebettetem IPv4                |
| `2002::/16`, `2001::/32`                                                             | 6to4 und Teredo mit eingebettetem IPv4              |
| `::/96`, `::ffff:0:0/96`                                                             | IPv4-kompatibles und IPv4-mapped IPv6               |

Wenn Ihr Cloud-Provider oder Ihre Netzwerkplattform zusätzliche Metadata-Hosts oder reservierte Bereiche dokumentiert, fügen Sie auch diese hinzu.

## Validierung

Validieren Sie den Proxy von demselben Host, Container oder Dienstkonto aus, auf dem OpenClaw läuft:

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

Standardmäßig prüft der Befehl, wenn keine benutzerdefinierten Ziele angegeben sind, dass `https://example.com/` erfolgreich ist, und startet einen temporären Loopback-Canary, den der Proxy nicht erreichen darf. Die standardmäßige verweigerte Prüfung besteht, wenn der Proxy eine Nicht-2xx-Verweigerungsantwort zurückgibt oder den Canary mit einem Transportfehler blockiert; sie schlägt fehl, wenn eine erfolgreiche Antwort den Canary erreicht. Wenn kein Proxy aktiviert und konfiguriert ist, meldet die Validierung ein Konfigurationsproblem; verwenden Sie `--proxy-url` für einen einmaligen Preflight, bevor Sie die Konfiguration ändern. Verwenden Sie `--allowed-url` und `--denied-url`, um bereitstellungsspezifische Erwartungen zu testen. Benutzerdefinierte verweigerte Ziele sind fail-closed: Jede HTTP-Antwort bedeutet, dass das Ziel über den Proxy erreichbar war, und jeder Transportfehler wird als nicht schlüssig gemeldet, weil OpenClaw nicht beweisen kann, dass der Proxy einen erreichbaren Origin blockiert hat. Bei einem Validierungsfehler beendet sich der Befehl mit Code 1.

Verwenden Sie `--json` für Automatisierung. Die JSON-Ausgabe enthält das Gesamtergebnis, die effektive Proxy-Konfigurationsquelle, alle Konfigurationsfehler und jede Zielprüfung. Anmeldedaten in Proxy-URLs werden in Text- und JSON-Ausgabe redigiert:

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

Sie können die Validierung auch manuell mit `curl` durchführen:

```bash
curl -x http://127.0.0.1:3128 https://example.com/
curl -x http://127.0.0.1:3128 http://127.0.0.1/
curl -x http://127.0.0.1:3128 http://169.254.169.254/
```

Die öffentliche Anfrage sollte erfolgreich sein. Die Loopback- und Metadatenanfragen sollten vom Proxy blockiert werden. Bei `openclaw proxy validate` kann der integrierte Loopback-Canary eine Proxy-Ablehnung von einem erreichbaren Ursprung unterscheiden. Benutzerdefinierte `--denied-url`-Prüfungen haben diesen Canary nicht. Behandeln Sie daher sowohl HTTP-Antworten als auch mehrdeutige Transportfehler als Validierungsfehler, es sei denn, Ihr Proxy stellt ein bereitstellungsspezifisches Ablehnungssignal bereit, das Sie separat verifizieren können.

Aktivieren Sie anschließend das OpenClaw-Proxy-Routing:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway run
```

oder setzen Sie:

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

## Grenzen

- Der Proxy verbessert die Abdeckung für prozesslokale JavaScript-HTTP- und WebSocket-Clients, ist aber keine Netzwerk-Sandbox auf Betriebssystemebene.
- Rohe `net`-, `tls`- und `http2`-Sockets, native Add-ons und Kindprozesse können Proxy-Routing auf Node-Ebene umgehen, sofern sie Proxy-Umgebungsvariablen nicht erben und beachten.
- IRC ist ein roher TCP/TLS-Kanal außerhalb des vom Betreiber verwalteten Forward-Proxy-Routings. In Bereitstellungen, die erfordern, dass der gesamte ausgehende Datenverkehr über diesen Forward Proxy läuft, setzen Sie `channels.irc.enabled=false`, sofern direkter IRC-Ausgang nicht ausdrücklich genehmigt ist.
- Benutzerlokale WebUIs und lokale Modellserver sollten bei Bedarf in der Proxy-Richtlinie des Betreibers auf die Allowlist gesetzt werden; OpenClaw stellt dafür keinen allgemeinen Bypass für lokale Netzwerke bereit.
- Der Proxy-Bypass der Gateway-Control-Plane ist absichtlich auf `localhost` und wörtliche Loopback-IP-URLs beschränkt. Verwenden Sie `ws://127.0.0.1:18789`, `ws://[::1]:18789` oder `ws://localhost:18789` für lokale direkte Gateway-Control-Plane-Verbindungen; andere Hostnamen werden wie gewöhnlicher hostnamenbasierter Datenverkehr geroutet.
- OpenClaw prüft, testet oder zertifiziert Ihre Proxy-Richtlinie nicht.
- Behandeln Sie Änderungen an Proxy-Richtlinien als sicherheitsrelevante betriebliche Änderungen.
