---
read_when:
    - Sie möchten mehrschichtigen Schutz gegen SSRF- und DNS-Rebinding-Angriffe
    - Konfigurieren eines externen Forward-Proxys für OpenClaw-Runtime-Datenverkehr
summary: So leiten Sie den HTTP- und WebSocket-Datenverkehr der OpenClaw-Laufzeit über einen vom Betreiber verwalteten Filter-Proxy
title: Netzwerk-Proxy
x-i18n:
    generated_at: "2026-05-06T18:00:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: aed1cd94ce6a32cd8a3f6c7e579011992af87c1ccc40eb53efaa83b020a6792b
    source_path: security/network-proxy.md
    workflow: 16
---

OpenClaw kann HTTP- und WebSocket-Laufzeitdatenverkehr über einen vom Betreiber verwalteten Forward Proxy leiten. Dies ist optionale Defense in Depth für Bereitstellungen, die zentrale Egress-Kontrolle, stärkeren SSRF-Schutz und bessere Netzwerkauditierbarkeit wünschen.

OpenClaw liefert keinen Proxy mit, lädt keinen herunter, startet keinen, konfiguriert keinen und zertifiziert keinen Proxy. Sie betreiben die Proxy-Technologie, die zu Ihrer Umgebung passt, und OpenClaw leitet normale prozesslokale HTTP- und WebSocket-Clients darüber.

## Warum einen Proxy verwenden

Ein Proxy gibt Betreibern einen zentralen Netzwerkkontrollpunkt für ausgehenden HTTP- und WebSocket-Datenverkehr. Das kann auch außerhalb der SSRF-Härtung nützlich sein:

- Zentrale Richtlinie: eine Egress-Richtlinie pflegen, statt sich darauf zu verlassen, dass jede HTTP-Aufrufstelle der Anwendung die Netzwerkregeln korrekt umsetzt.
- Prüfungen beim Verbindungsaufbau: das Ziel nach der DNS-Auflösung und unmittelbar bevor der Proxy die Upstream-Verbindung öffnet bewerten.
- Schutz vor DNS-Rebinding: die Lücke zwischen einer DNS-Prüfung auf Anwendungsebene und der tatsächlichen ausgehenden Verbindung verringern.
- Breitere JavaScript-Abdeckung: gewöhnliche `fetch`-, `node:http`-, `node:https`-, WebSocket-, axios-, got-, node-fetch- und ähnliche Clients über denselben Pfad leiten.
- Auditierbarkeit: zugelassene und abgelehnte Ziele an der Egress-Grenze protokollieren.
- Betriebliche Kontrolle: Zielregeln, Netzwerksegmentierung, Ratenbegrenzungen oder ausgehende Allowlists durchsetzen, ohne OpenClaw neu zu bauen.

Proxy-Routing ist eine Schutzvorrichtung auf Prozessebene für normalen HTTP- und WebSocket-Egress. Es gibt Betreibern einen fail-closed Pfad, um unterstützte JavaScript-HTTP-Clients über ihren eigenen filternden Proxy zu leiten, ist aber keine Netzwerksandbox auf Betriebssystemebene und veranlasst OpenClaw nicht dazu, die Zielrichtlinie des Proxys zu zertifizieren.

## Wie OpenClaw Datenverkehr leitet

Wenn `proxy.enabled=true` und eine Proxy-URL konfiguriert ist, leiten geschützte Laufzeitprozesse wie `openclaw gateway run`, `openclaw node run` und `openclaw agent --local` normalen HTTP- und WebSocket-Egress über den konfigurierten Proxy:

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

Der öffentliche Vertrag ist das Routing-Verhalten, nicht die internen Node-Hooks, die zu seiner Implementierung verwendet werden. OpenClaw Gateway-Control-Plane-WebSocket-Clients verwenden einen schmalen direkten Pfad für lokalen Gateway-RPC-Datenverkehr über local loopback, wenn die Gateway-URL `localhost` oder eine literale Loopback-IP wie `127.0.0.1` oder `[::1]` verwendet. Dieser Control-Plane-Pfad muss Loopback-Gateways erreichen können, auch wenn der Betreiber-Proxy Loopback-Ziele blockiert. Normale HTTP- und WebSocket-Anfragen zur Laufzeit verwenden weiterhin den konfigurierten Proxy.

Intern verwendet OpenClaw zwei Routing-Hooks auf Prozessebene für diese Funktion:

- Undici-Dispatcher-Routing deckt `fetch`, undici-basierte Clients und Transports ab, die ihren eigenen undici-Dispatcher bereitstellen.
- `global-agent`-Routing deckt Node-Core-Aufrufer von `node:http` und `node:https` ab, einschließlich vieler Bibliotheken, die auf `http.request`, `https.request`, `http.get` und `https.get` aufsetzen. Der verwaltete Proxy-Modus erzwingt diesen globalen Agent, damit explizite Node-HTTP-Agents den Betreiber-Proxy nicht versehentlich umgehen.

Einige Plugins besitzen benutzerdefinierte Transports, die explizite Proxy-Verkabelung benötigen, selbst wenn Routing auf Prozessebene vorhanden ist. Zum Beispiel verwendet der Bot-API-Transport von Telegram seinen eigenen HTTP/1-undici-Dispatcher und berücksichtigt daher Prozess-Proxy-Umgebungsvariablen plus den verwalteten Fallback `OPENCLAW_PROXY_URL` in diesem besitzerspezifischen Transportpfad.

Die Proxy-URL selbst muss `http://` verwenden. HTTPS-Ziele werden weiterhin über den Proxy mit HTTP `CONNECT` unterstützt; dies bedeutet nur, dass OpenClaw einen einfachen HTTP-Forward-Proxy-Listener wie `http://127.0.0.1:3128` erwartet.

Während der Proxy aktiv ist, löscht OpenClaw `no_proxy`, `NO_PROXY` und `GLOBAL_AGENT_NO_PROXY`. Diese Umgehungslisten sind zielbasiert, daher würden `localhost` oder `127.0.0.1` darin hochriskanten SSRF-Zielen erlauben, den filternden Proxy zu überspringen.

Beim Herunterfahren stellt OpenClaw die vorherige Proxy-Umgebung wieder her und setzt den zwischengespeicherten Prozess-Routing-Zustand zurück.

## Verwandte Proxy-Begriffe

- `proxy.enabled` / `proxy.proxyUrl`: ausgehendes Forward-Proxy-Routing für OpenClaw-Laufzeit-Egress. Diese Seite dokumentiert diese Funktion.
- `gateway.auth.mode: "trusted-proxy"`: eingehende identitätsbewusste Reverse-Proxy-Authentifizierung für Gateway-Zugriff. Siehe [Trusted Proxy Auth](/de/gateway/trusted-proxy-auth).
- `openclaw proxy`: lokaler Debug-Proxy und Capture-Inspector für Entwicklung und Support. Siehe [openclaw proxy](/de/cli/proxy).
- `tools.web.fetch.useTrustedEnvProxy`: Opt-in für `web_fetch`, damit ein betreibergesteuerter HTTP(S)-Umgebungsproxy DNS auflösen kann, während die standardmäßig strikte DNS-Pinning- und Hostnamenrichtlinie beibehalten wird. Siehe [Web Fetch](/de/tools/web-fetch#trusted-env-proxy).
- Kanal- oder Provider-spezifische Proxy-Einstellungen: besitzerspezifische Überschreibungen für einen bestimmten Transport. Bevorzugen Sie den verwalteten Netzwerk-Proxy, wenn das Ziel zentrale Egress-Kontrolle über die Laufzeit hinweg ist.

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

### Gateway-Loopback-Modus

Lokale Gateway-Control-Plane-Clients verbinden sich normalerweise mit einem Loopback-WebSocket wie `ws://127.0.0.1:18789`. Verwenden Sie `proxy.loopbackMode`, um auszuwählen, wie sich dieser Datenverkehr verhält, während der verwaltete Proxy aktiv ist:

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
  loopbackMode: gateway-only # gateway-only, proxy, or block
```

- `gateway-only` (Standard): OpenClaw registriert die Gateway-Loopback-Authority im aktiven `global-agent`-`NO_PROXY`-Controller, damit lokaler Gateway-WebSocket-Datenverkehr direkt verbinden kann. Benutzerdefinierte Loopback-Gateway-Ports funktionieren, weil Host und Port der aktiven Gateway-URL registriert werden.
- `proxy`: OpenClaw registriert keine Gateway-Loopback-`NO_PROXY`-Authority, daher wird lokaler Gateway-Datenverkehr über den verwalteten Proxy gesendet. Wenn der Proxy entfernt ist, muss er spezielles Routing für den Loopback-Dienst des OpenClaw-Hosts bereitstellen, etwa durch Zuordnung zu einem über den Proxy erreichbaren Hostnamen, einer IP oder einem Tunnel. Standardmäßige entfernte Proxys lösen `127.0.0.1` und `localhost` vom Proxy-Host aus auf, nicht vom OpenClaw-Host.
- `block`: OpenClaw verweigert Loopback-Gateway-Control-Plane-Verbindungen, bevor ein Socket geöffnet wird.

Wenn `enabled=true` ist, aber keine gültige Proxy-URL konfiguriert ist, schlagen geschützte Befehle beim Start fehl, statt auf direkten Netzwerkzugriff zurückzufallen.

Für verwaltete Gateway-Dienste, die mit `openclaw gateway start` gestartet werden, speichern Sie die URL vorzugsweise in der Konfiguration:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

Der Umgebungs-Fallback eignet sich am besten für Vordergrundläufe. Wenn Sie ihn mit einem installierten Dienst verwenden, legen Sie `OPENCLAW_PROXY_URL` in der dauerhaften Umgebung des Dienstes ab, etwa in `$OPENCLAW_STATE_DIR/.env` oder `~/.openclaw/.env`, und installieren Sie den Dienst anschließend erneut, damit launchd, systemd oder Scheduled Tasks das Gateway mit diesem Wert startet.

Für `openclaw --container ...`-Befehle leitet OpenClaw `OPENCLAW_PROXY_URL` an die containerbezogene untergeordnete CLI weiter, wenn sie gesetzt ist. Die URL muss aus dem Container heraus erreichbar sein; `127.0.0.1` verweist auf den Container selbst, nicht auf den Host. OpenClaw lehnt Loopback-Proxy-URLs für containerbezogene Befehle ab, sofern Sie diese Sicherheitsprüfung nicht ausdrücklich überschreiben.

## Proxy-Anforderungen

Die Proxy-Richtlinie ist die Sicherheitsgrenze. OpenClaw kann nicht überprüfen, ob der Proxy die richtigen Ziele blockiert.

Konfigurieren Sie den Proxy so, dass er:

- nur an Loopback oder eine private vertrauenswürdige Schnittstelle bindet.
- den Zugriff einschränkt, sodass nur der OpenClaw-Prozess, -Host, -Container oder das Dienstkonto ihn verwenden kann.
- Ziele selbst auflöst und Ziel-IPs nach der DNS-Auflösung blockiert.
- Richtlinien beim Verbindungsaufbau sowohl für einfache HTTP-Anfragen als auch für HTTPS-`CONNECT`-Tunnel anwendet.
- zielbasierte Umgehungen für Loopback-, private, linklokale, Metadata-, Multicast-, reservierte oder Dokumentationsbereiche ablehnt.
- Hostnamen-Allowlists vermeidet, sofern Sie dem DNS-Auflösungspfad nicht vollständig vertrauen.
- Ziel, Entscheidung, Status und Grund protokolliert, ohne Request-Bodies, Autorisierungs-Header, Cookies oder andere Geheimnisse zu protokollieren.
- die Proxy-Richtlinie unter Versionskontrolle hält und Änderungen wie sicherheitssensitive Konfiguration prüft.

## Empfohlene blockierte Ziele

Verwenden Sie diese Denylist als Ausgangspunkt für jeden Forward Proxy, jede Firewall oder jede Egress-Richtlinie.

Die Klassifizierungslogik auf OpenClaw-Anwendungsebene befindet sich in `src/infra/net/ssrf.ts` und `src/shared/net/ip.ts`. Die relevanten Parity-Hooks sind `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX` und die eingebettete IPv4-Sentinel-Behandlung für NAT64, 6to4, Teredo, ISATAP und IPv4-mapped Formen. Diese Dateien sind nützliche Referenzen bei der Pflege einer externen Proxy-Richtlinie, aber OpenClaw exportiert oder erzwingt diese Regeln nicht automatisch in Ihrem Proxy.

| Bereich oder Host                                                                    | Warum blockieren                                     |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | IPv4-Loopback                                        |
| `::1/128`                                                                            | IPv6-Loopback                                        |
| `0.0.0.0/8`, `::/128`                                                                | Nicht spezifizierte und This-Network-Adressen        |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | Private RFC1918-Netzwerke                            |
| `169.254.0.0/16`, `fe80::/10`                                                        | Linklokale Adressen und gängige Cloud-Metadata-Pfade |
| `169.254.169.254`, `metadata.google.internal`                                        | Cloud-Metadata-Dienste                               |
| `100.64.0.0/10`                                                                      | Gemeinsam genutzter Carrier-grade-NAT-Adressraum     |
| `198.18.0.0/15`, `2001:2::/48`                                                       | Benchmarking-Bereiche                                |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | Special-use- und Dokumentationsbereiche              |
| `224.0.0.0/4`, `ff00::/8`                                                            | Multicast                                            |
| `240.0.0.0/4`                                                                        | Reserviertes IPv4                                    |
| `fc00::/7`, `fec0::/10`                                                              | Lokale/private IPv6-Bereiche                         |
| `100::/64`, `2001:20::/28`                                                           | IPv6-Discard- und ORCHIDv2-Bereiche                  |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | NAT64-Präfixe mit eingebettetem IPv4                 |
| `2002::/16`, `2001::/32`                                                             | 6to4 und Teredo mit eingebettetem IPv4               |
| `::/96`, `::ffff:0:0/96`                                                             | IPv4-kompatibles und IPv4-mapped IPv6                |

Wenn Ihr Cloud-Provider oder Ihre Netzwerkplattform zusätzliche Metadata-Hosts oder reservierte Bereiche dokumentiert, fügen Sie auch diese hinzu.

## Validierung

Validieren Sie den Proxy von demselben Host, Container oder Dienstkonto aus, das OpenClaw ausführt:

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

Standardmäßig prüft der Befehl, wenn keine benutzerdefinierten Ziele angegeben sind, dass `https://example.com/` erfolgreich ist, und startet einen temporären Loopback-Canary, den der Proxy nicht erreichen darf. Die standardmäßige verweigerte Prüfung gilt als bestanden, wenn der Proxy eine Nicht-2xx-Ablehnungsantwort zurückgibt oder den Canary mit einem Transportfehler blockiert; sie schlägt fehl, wenn eine erfolgreiche Antwort den Canary erreicht. Wenn kein Proxy aktiviert und konfiguriert ist, meldet die Validierung ein Konfigurationsproblem; verwenden Sie `--proxy-url` für einen einmaligen Preflight, bevor Sie die Konfiguration ändern. Verwenden Sie `--allowed-url` und `--denied-url`, um bereitstellungsspezifische Erwartungen zu testen. Fügen Sie `--apns-reachable` hinzu, um auch zu prüfen, ob direkte APNs-HTTP/2-Zustellung einen CONNECT-Tunnel durch den Proxy öffnen und eine Sandbox-APNs-Antwort empfangen kann; der Test verwendet absichtlich ein ungültiges Provider-Token, daher wird `403 InvalidProviderToken` erwartet und zählt als erreichbar. Benutzerdefinierte verweigerte Ziele arbeiten nach dem Fail-Closed-Prinzip: Jede HTTP-Antwort bedeutet, dass das Ziel über den Proxy erreichbar war, und jeder Transportfehler wird als nicht eindeutig gemeldet, weil OpenClaw nicht beweisen kann, dass der Proxy einen erreichbaren Ursprung blockiert hat. Bei einem Validierungsfehler beendet sich der Befehl mit Code 1.

Verwenden Sie `--json` für Automatisierung. Die JSON-Ausgabe enthält das Gesamtergebnis, die effektive Quelle der Proxy-Konfiguration, alle Konfigurationsfehler und jede Zielprüfung. Anmeldedaten in der Proxy-URL werden in Text- und JSON-Ausgaben unkenntlich gemacht:

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
    },
    {
      "kind": "apns",
      "url": "https://api.sandbox.push.apple.com",
      "ok": true,
      "status": 403
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

Die öffentliche Anfrage sollte erfolgreich sein. Die Loopback- und Metadatenanfragen sollten vom Proxy blockiert werden. Bei `openclaw proxy validate` kann der integrierte Loopback-Canary eine Proxy-Ablehnung von einem erreichbaren Ursprung unterscheiden. Benutzerdefinierte `--denied-url`-Prüfungen haben diesen Canary nicht, behandeln Sie daher sowohl HTTP-Antworten als auch mehrdeutige Transportfehler als Validierungsfehler, es sei denn, Ihr Proxy stellt ein bereitstellungsspezifisches Ablehnungssignal bereit, das Sie separat prüfen können.

Aktivieren Sie dann OpenClaw-Proxy-Routing:

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

## Grenzen

- Der Proxy verbessert die Abdeckung für prozesslokale JavaScript-HTTP- und WebSocket-Clients, ist aber keine Netzwerk-Sandbox auf Betriebssystemebene.
- Gateway-Loopback-Control-Plane-Traffic verwendet standardmäßig eine direkte lokale Umgehung über `proxy.loopbackMode: "gateway-only"`. OpenClaw implementiert diese Umgehung, indem die aktive Gateway-Loopback-Authority im verwalteten `global-agent`-`NO_PROXY`-Controller registriert wird. Betreiber können `proxy.loopbackMode: "proxy"` festlegen, um Gateway-Loopback-Traffic über den verwalteten Proxy zu senden, oder `proxy.loopbackMode: "block"` festlegen, um Loopback-Gateway-Verbindungen zu verweigern. Siehe [Gateway-Loopback-Modus](#gateway-loopback-mode) für den Hinweis zum Remote-Proxy.
- Raw-`net`-, `tls`- und `http2`-Sockets, native Add-ons und Nicht-OpenClaw-Kindprozesse können Proxy-Routing auf Node-Ebene umgehen, sofern sie Proxy-Umgebungsvariablen nicht erben und beachten. Geforkte OpenClaw-Kind-CLIs erben die verwaltete Proxy-URL und den `proxy.loopbackMode`-Status.
- IRC ist ein Raw-TCP/TLS-Kanal außerhalb des vom Betreiber verwalteten Forward-Proxy-Routings. Legen Sie in Bereitstellungen, die sämtlichen ausgehenden Traffic über diesen Forward-Proxy erfordern, `channels.irc.enabled=false` fest, sofern direkter IRC-Egress nicht ausdrücklich genehmigt ist.
- Der lokale Debug-Proxy ist Diagnosewerkzeug, und seine direkte Upstream-Weiterleitung für Proxy-Anfragen und CONNECT-Tunnel ist standardmäßig deaktiviert, solange der verwaltete Proxy-Modus aktiv ist; aktivieren Sie direkte Weiterleitung nur für genehmigte lokale Diagnosen.
- Lokale WebUIs von Benutzern und lokale Modellserver sollten bei Bedarf in der Betreiber-Proxy-Richtlinie allowlisted werden; OpenClaw stellt für sie keine allgemeine Umgehung des lokalen Netzwerks bereit.
- Die Proxy-Umgehung der Gateway-Control-Plane ist absichtlich auf `localhost` und literale Loopback-IP-URLs beschränkt. Verwenden Sie `ws://127.0.0.1:18789`, `ws://[::1]:18789` oder `ws://localhost:18789` für lokale direkte Gateway-Control-Plane-Verbindungen; andere Hostnamen werden wie gewöhnlicher hostnamebasierter Traffic geroutet.
- OpenClaw prüft, testet oder zertifiziert Ihre Proxy-Richtlinie nicht.
- Behandeln Sie Änderungen an Proxy-Richtlinien als sicherheitssensible betriebliche Änderungen.
