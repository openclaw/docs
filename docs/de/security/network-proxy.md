---
read_when:
    - Sie möchten mehrschichtige Verteidigung gegen SSRF- und DNS-Rebinding-Angriffe
    - Konfigurieren eines externen Forward-Proxys für den Laufzeitdatenverkehr von OpenClaw
summary: So leiten Sie HTTP- und WebSocket-Datenverkehr der OpenClaw-Laufzeit über einen vom Betreiber verwalteten Filterproxy
title: Netzwerkproxy
x-i18n:
    generated_at: "2026-04-30T07:15:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: c4e879f787571410acdda55dcdbb5fd77aef1d24045af5c9208cba51330a70ca
    source_path: security/network-proxy.md
    workflow: 16
---

# Netzwerk-Proxy

OpenClaw kann HTTP- und WebSocket-Datenverkehr zur Laufzeit über einen vom Betreiber verwalteten Forward-Proxy leiten. Dies ist eine optionale Defense-in-Depth-Maßnahme für Bereitstellungen, die zentrale Egress-Kontrolle, stärkeren SSRF-Schutz und bessere Netzwerkprüfbarkeit wünschen.

OpenClaw liefert keinen Proxy aus, lädt keinen Proxy herunter, startet, konfiguriert oder zertifiziert keinen Proxy. Sie betreiben die Proxy-Technologie, die zu Ihrer Umgebung passt, und OpenClaw leitet normale prozesslokale HTTP- und WebSocket-Clients darüber.

## Warum einen Proxy verwenden?

Ein Proxy bietet Betreibern einen zentralen Netzwerkkontrollpunkt für ausgehenden HTTP- und WebSocket-Datenverkehr. Das kann auch außerhalb der SSRF-Härtung nützlich sein:

- Zentrale Richtlinie: Verwalten Sie eine Egress-Richtlinie, statt sich darauf zu verlassen, dass jede HTTP-Aufrufstelle der Anwendung die Netzwerkregeln korrekt umsetzt.
- Prüfungen beim Verbindungsaufbau: Bewerten Sie das Ziel nach der DNS-Auflösung und unmittelbar bevor der Proxy die Upstream-Verbindung öffnet.
- Schutz vor DNS-Rebinding: Verringern Sie die Lücke zwischen einer DNS-Prüfung auf Anwendungsebene und der tatsächlichen ausgehenden Verbindung.
- Breitere JavaScript-Abdeckung: Leiten Sie gewöhnliche `fetch`-, `node:http`-, `node:https`-, WebSocket-, axios-, got-, node-fetch- und ähnliche Clients über denselben Pfad.
- Prüfbarkeit: Protokollieren Sie zugelassene und abgelehnte Ziele an der Egress-Grenze.
- Operative Kontrolle: Erzwingen Sie Zielregeln, Netzwerksegmentierung, Ratenbegrenzungen oder ausgehende Allowlists, ohne OpenClaw neu zu bauen.

Proxy-Routing ist eine Guardrail auf Prozessebene für normalen HTTP- und WebSocket-Egress. Es gibt Betreibern einen Fail-Closed-Pfad, um unterstützte JavaScript-HTTP-Clients durch ihren eigenen filternden Proxy zu leiten, ist aber keine Netzwerk-Sandbox auf Betriebssystemebene und bewirkt nicht, dass OpenClaw die Zielrichtlinie des Proxys zertifiziert.

## Wie OpenClaw Datenverkehr leitet

Wenn `proxy.enabled=true` gesetzt und eine Proxy-URL konfiguriert ist, leiten geschützte Laufzeitprozesse wie `openclaw gateway run`, `openclaw node run` und `openclaw agent --local` normalen HTTP- und WebSocket-Egress über den konfigurierten Proxy:

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

Der öffentliche Vertrag ist das Routing-Verhalten, nicht die internen Node-Hooks, mit denen es implementiert wird. OpenClaw Gateway-Control-Plane-WebSocket-Clients verwenden einen schmalen direkten Pfad für local loopback-Gateway-RPC-Datenverkehr, wenn die Gateway-URL `localhost` oder eine literale Loopback-IP wie `127.0.0.1` oder `[::1]` verwendet. Dieser Control-Plane-Pfad muss Loopback-Gateways erreichen können, selbst wenn der Betreiber-Proxy Loopback-Ziele blockiert. Normale HTTP- und WebSocket-Anfragen zur Laufzeit verwenden weiterhin den konfigurierten Proxy.

Intern verwendet OpenClaw zwei Routing-Hooks auf Prozessebene für diese Funktion:

- Undici-Dispatcher-Routing deckt `fetch`, Undici-basierte Clients und Transports ab, die ihren eigenen Undici-Dispatcher bereitstellen.
- `global-agent`-Routing deckt Node-Core-Aufrufer von `node:http` und `node:https` ab, einschließlich vieler Bibliotheken, die auf `http.request`, `https.request`, `http.get` und `https.get` aufbauen. Der verwaltete Proxy-Modus erzwingt diesen globalen Agent, damit explizite Node-HTTP-Agents den Betreiber-Proxy nicht versehentlich umgehen.

Einige Plugins besitzen benutzerdefinierte Transports, die explizite Proxy-Verdrahtung benötigen, auch wenn Routing auf Prozessebene vorhanden ist. Beispielsweise verwendet der Bot-API-Transport von Telegram seinen eigenen HTTP/1-Undici-Dispatcher und berücksichtigt daher Prozess-Proxy-Umgebungsvariablen plus den verwalteten `OPENCLAW_PROXY_URL`-Fallback in diesem owner-spezifischen Transport-Pfad.

Die Proxy-URL selbst muss `http://` verwenden. HTTPS-Ziele werden über den Proxy mit HTTP `CONNECT` weiterhin unterstützt; das bedeutet nur, dass OpenClaw einen einfachen HTTP-Forward-Proxy-Listener wie `http://127.0.0.1:3128` erwartet.

Während der Proxy aktiv ist, löscht OpenClaw `no_proxy`, `NO_PROXY` und `GLOBAL_AGENT_NO_PROXY`. Diese Bypass-Listen sind zielbasiert, daher würden Einträge wie `localhost` oder `127.0.0.1` es risikoreichen SSRF-Zielen erlauben, den filternden Proxy zu umgehen.

Beim Herunterfahren stellt OpenClaw die vorherige Proxy-Umgebung wieder her und setzt den zwischengespeicherten Prozess-Routing-Zustand zurück.

## Verwandte Proxy-Begriffe

- `proxy.enabled` / `proxy.proxyUrl`: Ausgehendes Forward-Proxy-Routing für OpenClaw-Laufzeit-Egress. Diese Seite dokumentiert diese Funktion.
- `gateway.auth.mode: "trusted-proxy"`: Eingehende identitätsbewusste Reverse-Proxy-Authentifizierung für Gateway-Zugriff. Siehe [Trusted-Proxy-Authentifizierung](/de/gateway/trusted-proxy-auth).
- `openclaw proxy`: Lokaler Debug-Proxy und Capture-Inspektor für Entwicklung und Support. Siehe [openclaw proxy](/de/cli/proxy).
- Kanal- oder Provider-spezifische Proxy-Einstellungen: owner-spezifische Überschreibungen für einen bestimmten Transport. Bevorzugen Sie den verwalteten Netzwerk-Proxy, wenn das Ziel eine zentrale Egress-Kontrolle über die Laufzeit hinweg ist.

## Konfiguration

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

Sie können die URL auch über die Umgebung bereitstellen, während `proxy.enabled=true` in der Konfiguration gesetzt bleibt:

```bash
OPENCLAW_PROXY_URL=http://127.0.0.1:3128 openclaw gateway run
```

`proxy.proxyUrl` hat Vorrang vor `OPENCLAW_PROXY_URL`.

Wenn `enabled=true` gesetzt ist, aber keine gültige Proxy-URL konfiguriert wurde, schlagen geschützte Befehle beim Start fehl, statt auf direkten Netzwerkzugriff zurückzufallen.

Für verwaltete Gateway-Dienste, die mit `openclaw gateway start` gestartet werden, sollten Sie die URL in der Konfiguration speichern:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

Der Umgebungs-Fallback eignet sich am besten für Vordergrundläufe. Wenn Sie ihn mit einem installierten Dienst verwenden, legen Sie `OPENCLAW_PROXY_URL` in die dauerhafte Umgebung des Dienstes, zum Beispiel `$OPENCLAW_STATE_DIR/.env` oder `~/.openclaw/.env`, und installieren Sie den Dienst anschließend neu, damit launchd, systemd oder Scheduled Tasks das Gateway mit diesem Wert startet.

Für `openclaw --container ...`-Befehle leitet OpenClaw `OPENCLAW_PROXY_URL` an die containerorientierte Child-CLI weiter, wenn es gesetzt ist. Die URL muss aus dem Container heraus erreichbar sein; `127.0.0.1` verweist auf den Container selbst, nicht auf den Host. OpenClaw lehnt Loopback-Proxy-URLs für containerorientierte Befehle ab, sofern Sie diese Sicherheitsprüfung nicht explizit überschreiben.

## Proxy-Anforderungen

Die Proxy-Richtlinie ist die Sicherheitsgrenze. OpenClaw kann nicht überprüfen, ob der Proxy die richtigen Ziele blockiert.

Konfigurieren Sie den Proxy so, dass er:

- nur an Loopback oder eine private vertrauenswürdige Schnittstelle bindet.
- den Zugriff so einschränkt, dass nur der OpenClaw-Prozess, Host, Container oder das Dienstkonto ihn verwenden kann.
- Ziele selbst auflöst und Ziel-IPs nach der DNS-Auflösung blockiert.
- die Richtlinie beim Verbindungsaufbau sowohl für einfache HTTP-Anfragen als auch für HTTPS-`CONNECT`-Tunnel anwendet.
- zielbasierte Bypässe für Loopback-, private, Link-Local-, Metadaten-, Multicast-, reservierte oder Dokumentationsbereiche ablehnt.
- Hostnamen-Allowlists vermeidet, sofern Sie dem DNS-Auflösungspfad nicht vollständig vertrauen.
- Ziel, Entscheidung, Status und Grund protokolliert, ohne Request-Bodies, Autorisierungs-Header, Cookies oder andere Geheimnisse zu protokollieren.
- Proxy-Richtlinien unter Versionskontrolle hält und Änderungen wie sicherheitssensible Konfiguration prüft.

## Empfohlene blockierte Ziele

Verwenden Sie diese Denylist als Ausgangspunkt für jeden Forward-Proxy, jede Firewall oder jede Egress-Richtlinie.

Die Klassifizierungslogik auf OpenClaw-Anwendungsebene liegt in `src/infra/net/ssrf.ts` und `src/shared/net/ip.ts`. Die relevanten Parity-Hooks sind `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX` und die eingebettete IPv4-Sentinel-Behandlung für NAT64, 6to4, Teredo, ISATAP und IPv4-gemappte Formen. Diese Dateien sind nützliche Referenzen bei der Pflege einer externen Proxy-Richtlinie, aber OpenClaw exportiert oder erzwingt diese Regeln nicht automatisch in Ihrem Proxy.

| Bereich oder Host                                                                    | Warum blockieren                                    |
| ------------------------------------------------------------------------------------ | --------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | IPv4-Loopback                                      |
| `::1/128`                                                                            | IPv6-Loopback                                      |
| `0.0.0.0/8`, `::/128`                                                                | Nicht spezifizierte und This-Network-Adressen       |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | Private RFC1918-Netzwerke                          |
| `169.254.0.0/16`, `fe80::/10`                                                        | Link-Local-Adressen und gängige Cloud-Metadatenpfade |
| `169.254.169.254`, `metadata.google.internal`                                        | Cloud-Metadatendienste                             |
| `100.64.0.0/10`                                                                      | Gemeinsam genutzter Carrier-Grade-NAT-Adressraum   |
| `198.18.0.0/15`, `2001:2::/48`                                                       | Benchmarking-Bereiche                              |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | Special-Use- und Dokumentationsbereiche            |
| `224.0.0.0/4`, `ff00::/8`                                                            | Multicast                                          |
| `240.0.0.0/4`                                                                        | Reserviertes IPv4                                  |
| `fc00::/7`, `fec0::/10`                                                              | Lokale/private IPv6-Bereiche                       |
| `100::/64`, `2001:20::/28`                                                           | IPv6-Discard- und ORCHIDv2-Bereiche                |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | NAT64-Präfixe mit eingebettetem IPv4               |
| `2002::/16`, `2001::/32`                                                             | 6to4 und Teredo mit eingebettetem IPv4             |
| `::/96`, `::ffff:0:0/96`                                                             | IPv4-kompatibles und IPv4-gemapptes IPv6           |

Wenn Ihr Cloud-Provider oder Ihre Netzwerkplattform zusätzliche Metadaten-Hosts oder reservierte Bereiche dokumentiert, fügen Sie diese ebenfalls hinzu.

## Validierung

Validieren Sie den Proxy von demselben Host, Container oder Dienstkonto aus, auf dem OpenClaw ausgeführt wird:

```bash
curl -x http://127.0.0.1:3128 https://example.com/
curl -x http://127.0.0.1:3128 http://127.0.0.1/
curl -x http://127.0.0.1:3128 http://169.254.169.254/
```

Die öffentliche Anfrage sollte erfolgreich sein. Die Loopback- und Metadatenanfragen sollten am Proxy fehlschlagen.

Aktivieren Sie dann OpenClaw-Proxy-Routing:

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
- Rohe `net`-, `tls`- und `http2`-Sockets, native Addons und Child-Prozesse können Node-Level-Proxy-Routing umgehen, sofern sie Proxy-Umgebungsvariablen nicht erben und beachten.
- Lokale WebUIs von Benutzern und lokale Modellserver sollten bei Bedarf in der Betreiber-Proxy-Richtlinie auf die Allowlist gesetzt werden; OpenClaw stellt für sie keinen allgemeinen lokalen Netzwerk-Bypass bereit.
- Der Gateway-Control-Plane-Proxy-Bypass ist absichtlich auf `localhost` und literale Loopback-IP-URLs beschränkt. Verwenden Sie `ws://127.0.0.1:18789`, `ws://[::1]:18789` oder `ws://localhost:18789` für lokale direkte Gateway-Control-Plane-Verbindungen; andere Hostnamen werden wie gewöhnlicher hostnamenbasierter Datenverkehr geleitet.
- OpenClaw inspiziert, testet oder zertifiziert Ihre Proxy-Richtlinie nicht.
- Behandeln Sie Änderungen an Proxy-Richtlinien als sicherheitssensible operative Änderungen.
