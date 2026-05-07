---
read_when:
    - Sie möchten mehrschichtige Verteidigung gegen SSRF- und DNS-Rebinding-Angriffe
    - Konfigurieren eines externen Forward-Proxys für den Runtime-Datenverkehr von OpenClaw
summary: So leiten Sie OpenClaw-Laufzeitdatenverkehr für HTTP und WebSocket über einen vom Betreiber verwalteten Filter-Proxy
title: Netzwerk-Proxy
x-i18n:
    generated_at: "2026-05-07T16:23:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 22895b7c5521927b7145f55dff9b777e701691f01a6421db0f5b1ff489734775
    source_path: security/network-proxy.md
    workflow: 16
---

OpenClaw kann HTTP- und WebSocket-Traffic zur Laufzeit über einen vom Operator verwalteten Forward-Proxy leiten. Dies ist eine optionale mehrschichtige Absicherung für Deployments, die zentrale Egress-Kontrolle, stärkeren SSRF-Schutz und bessere Netzwerkprüfbarkeit wünschen.

OpenClaw liefert keinen Proxy aus, lädt keinen herunter, startet, konfiguriert oder zertifiziert keinen Proxy. Sie betreiben die Proxy-Technologie, die zu Ihrer Umgebung passt, und OpenClaw leitet normale prozesslokale HTTP- und WebSocket-Clients darüber.

## Warum einen Proxy verwenden

Ein Proxy gibt Operatoren einen zentralen Netzwerkkontrollpunkt für ausgehenden HTTP- und WebSocket-Traffic. Das kann auch außerhalb der SSRF-Härtung nützlich sein:

- Zentrale Policy: Pflegen Sie eine Egress-Policy, statt sich darauf zu verlassen, dass jede HTTP-Aufrufstelle der Anwendung die Netzwerkregeln korrekt umsetzt.
- Prüfungen beim Verbindungsaufbau: Bewerten Sie das Ziel nach der DNS-Auflösung und unmittelbar bevor der Proxy die Upstream-Verbindung öffnet.
- Schutz vor DNS-Rebinding: Verringern Sie die Lücke zwischen einer DNS-Prüfung auf Anwendungsebene und der tatsächlichen ausgehenden Verbindung.
- Breitere JavaScript-Abdeckung: Leiten Sie gewöhnliche `fetch`-, `node:http`-, `node:https`-, WebSocket-, axios-, got-, node-fetch- und ähnliche Clients über denselben Pfad.
- Prüfbarkeit: Protokollieren Sie erlaubte und abgelehnte Ziele an der Egress-Grenze.
- Betriebliche Kontrolle: Erzwingen Sie Zielregeln, Netzwerksegmentierung, Rate-Limits oder ausgehende Allowlists, ohne OpenClaw neu zu bauen.

Proxy-Routing ist eine prozessweite Schutzplanke für normalen HTTP- und WebSocket-Egress. Es gibt Operatoren einen Fail-Closed-Pfad, um unterstützte JavaScript-HTTP-Clients über ihren eigenen filternden Proxy zu leiten, ist aber keine Netzwerk-Sandbox auf Betriebssystemebene und bedeutet nicht, dass OpenClaw die Ziel-Policy des Proxys zertifiziert.

## Wie OpenClaw Traffic leitet

Wenn `proxy.enabled=true` ist und eine Proxy-URL konfiguriert wurde, leiten geschützte Laufzeitprozesse wie `openclaw gateway run`, `openclaw node run` und `openclaw agent --local` normalen HTTP- und WebSocket-Egress über den konfigurierten Proxy:

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

Der öffentliche Vertrag ist das Routing-Verhalten, nicht die internen Node-Hooks, mit denen es implementiert wird. OpenClaw Gateway-Control-Plane-WebSocket-Clients verwenden einen schmalen direkten Pfad für local loopback-Gateway-RPC-Traffic, wenn die Gateway-URL `localhost` oder eine literale Loopback-IP wie `127.0.0.1` oder `[::1]` verwendet. Dieser Control-Plane-Pfad muss Loopback-Gateways erreichen können, selbst wenn der Operator-Proxy Loopback-Ziele blockiert. Normale HTTP- und WebSocket-Anfragen zur Laufzeit verwenden weiterhin den konfigurierten Proxy.

Intern verwendet OpenClaw für diese Funktion zwei prozessweite Routing-Hooks:

- Undici-Dispatcher-Routing deckt `fetch`, Undici-basierte Clients und Transporte ab, die ihren eigenen Undici-Dispatcher bereitstellen.
- `global-agent`-Routing deckt Node-Core-Aufrufer von `node:http` und `node:https` ab, einschließlich vieler Bibliotheken, die auf `http.request`, `https.request`, `http.get` und `https.get` aufbauen. Der verwaltete Proxy-Modus erzwingt diesen globalen Agent, damit explizite Node-HTTP-Agents den Operator-Proxy nicht versehentlich umgehen.

Einige Plugins besitzen eigene Transporte, die explizite Proxy-Verdrahtung benötigen, selbst wenn prozessweites Routing vorhanden ist. Beispielsweise verwendet der Bot-API-Transport von Telegram seinen eigenen HTTP/1-Undici-Dispatcher und berücksichtigt daher die Prozess-Proxy-Umgebung plus den verwalteten `OPENCLAW_PROXY_URL`-Fallback in diesem eigentümerspezifischen Transportpfad.

Die Proxy-URL selbst muss `http://` verwenden. HTTPS-Ziele werden über den Proxy mit HTTP `CONNECT` weiterhin unterstützt; dies bedeutet nur, dass OpenClaw einen einfachen HTTP-Forward-Proxy-Listener wie `http://127.0.0.1:3128` erwartet.

Während der Proxy aktiv ist, löscht OpenClaw `no_proxy`, `NO_PROXY` und `GLOBAL_AGENT_NO_PROXY`. Diese Bypass-Listen sind zielbasiert, daher würden `localhost` oder `127.0.0.1` darin ermöglichen, dass risikoreiche SSRF-Ziele den filternden Proxy umgehen.

Beim Herunterfahren stellt OpenClaw die vorherige Proxy-Umgebung wieder her und setzt den zwischengespeicherten Prozess-Routing-Zustand zurück.

## Verwandte Proxy-Begriffe

- `proxy.enabled` / `proxy.proxyUrl`: ausgehendes Forward-Proxy-Routing für OpenClaw-Laufzeit-Egress. Diese Seite dokumentiert diese Funktion.
- `gateway.auth.mode: "trusted-proxy"`: eingehende identitätsbewusste Reverse-Proxy-Authentifizierung für Gateway-Zugriff. Siehe [Vertrauenswürdige Proxy-Authentifizierung](/de/gateway/trusted-proxy-auth).
- `openclaw proxy`: lokaler Debug-Proxy und Capture-Inspector für Entwicklung und Support. Siehe [openclaw proxy](/de/cli/proxy).
- `tools.web.fetch.useTrustedEnvProxy`: Opt-in für `web_fetch`, damit ein operatorgesteuerter HTTP(S)-Umgebungsproxy DNS auflösen kann, während die standardmäßig strikte DNS-Pinning- und Hostname-Policy beibehalten wird. Siehe [Web fetch](/de/tools/web-fetch#trusted-env-proxy).
- Kanal- oder Provider-spezifische Proxy-Einstellungen: eigentümerspezifische Overrides für einen bestimmten Transport. Bevorzugen Sie den verwalteten Netzwerk-Proxy, wenn das Ziel zentrale Egress-Kontrolle über die Laufzeit hinweg ist.

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

Lokale Gateway-Control-Plane-Clients verbinden sich normalerweise mit einem Loopback-WebSocket wie `ws://127.0.0.1:18789`. Verwenden Sie `proxy.loopbackMode`, um auszuwählen, wie sich dieser Traffic verhält, während der verwaltete Proxy aktiv ist:

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
  loopbackMode: gateway-only # gateway-only, proxy, or block
```

- `gateway-only` (Standard): OpenClaw registriert die Gateway-Loopback-Autorität im aktiven `global-agent`-`NO_PROXY`-Controller, damit lokaler Gateway-WebSocket-Traffic direkt verbinden kann. Benutzerdefinierte Loopback-Gateway-Ports funktionieren, weil Host und Port der aktiven Gateway-URL registriert werden.
- `proxy`: OpenClaw registriert keine Gateway-Loopback-`NO_PROXY`-Autorität, sodass lokaler Gateway-Traffic über den verwalteten Proxy gesendet wird. Wenn der Proxy remote ist, muss er spezielles Routing für den Loopback-Dienst des OpenClaw-Hosts bereitstellen, etwa durch Zuordnung zu einem vom Proxy erreichbaren Hostnamen, einer IP oder einem Tunnel. Standardmäßige Remote-Proxys lösen `127.0.0.1` und `localhost` vom Proxy-Host aus auf, nicht vom OpenClaw-Host.
- `block`: OpenClaw verweigert Loopback-Gateway-Control-Plane-Verbindungen, bevor ein Socket geöffnet wird.

Wenn `enabled=true` ist, aber keine gültige Proxy-URL konfiguriert wurde, schlagen geschützte Befehle beim Start fehl, statt auf direkten Netzwerkzugriff zurückzufallen.

Für verwaltete Gateway-Dienste, die mit `openclaw gateway start` gestartet werden, sollten Sie die URL bevorzugt in der Konfiguration speichern:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

Der Umgebungs-Fallback eignet sich am besten für Vordergrundläufe. Wenn Sie ihn mit einem installierten Dienst verwenden, legen Sie `OPENCLAW_PROXY_URL` in der dauerhaften Umgebung des Dienstes ab, etwa in `$OPENCLAW_STATE_DIR/.env` oder `~/.openclaw/.env`, und installieren Sie den Dienst anschließend erneut, damit launchd, systemd oder Scheduled Tasks das Gateway mit diesem Wert startet.

Für `openclaw --container ...`-Befehle leitet OpenClaw `OPENCLAW_PROXY_URL` an die containerbezogene untergeordnete CLI weiter, wenn es gesetzt ist. Die URL muss aus dem Container heraus erreichbar sein; `127.0.0.1` verweist auf den Container selbst, nicht auf den Host. OpenClaw lehnt Loopback-Proxy-URLs für containerbezogene Befehle ab, es sei denn, Sie überschreiben diese Sicherheitsprüfung ausdrücklich.

## Proxy-Anforderungen

Die Proxy-Policy ist die Sicherheitsgrenze. OpenClaw kann nicht überprüfen, ob der Proxy die richtigen Ziele blockiert.

Konfigurieren Sie den Proxy so, dass er:

- Nur an Loopback oder eine private vertrauenswürdige Schnittstelle bindet.
- Den Zugriff so beschränkt, dass nur der OpenClaw-Prozess, Host, Container oder das Dienstkonto ihn verwenden kann.
- Ziele selbst auflöst und Ziel-IPs nach der DNS-Auflösung blockiert.
- Die Policy beim Verbindungsaufbau sowohl für einfache HTTP-Anfragen als auch für HTTPS-`CONNECT`-Tunnel anwendet.
- Zielbasierte Bypässe für Loopback-, private, linklokale, Metadaten-, Multicast-, reservierte oder Dokumentationsbereiche ablehnt.
- Hostname-Allowlists vermeidet, es sei denn, Sie vertrauen dem DNS-Auflösungspfad vollständig.
- Ziel, Entscheidung, Status und Grund protokolliert, ohne Anfragetexte, Autorisierungs-Header, Cookies oder andere Geheimnisse zu protokollieren.
- Proxy-Policy unter Versionskontrolle hält und Änderungen wie sicherheitssensitive Konfiguration prüft.

## Empfohlene blockierte Ziele

Verwenden Sie diese Denylist als Ausgangspunkt für jeden Forward-Proxy, jede Firewall oder jede Egress-Policy.

Die Klassifikationslogik auf OpenClaw-Anwendungsebene befindet sich in `src/infra/net/ssrf.ts` und `src/shared/net/ip.ts`. Die relevanten Paritäts-Hooks sind `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX` und die eingebettete IPv4-Sentinel-Behandlung für NAT64, 6to4, Teredo, ISATAP und IPv4-mapped-Formen. Diese Dateien sind nützliche Referenzen, wenn Sie eine externe Proxy-Policy pflegen, aber OpenClaw exportiert oder erzwingt diese Regeln nicht automatisch in Ihrem Proxy.

| Bereich oder Host                                                                    | Warum blockieren                                      |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | IPv4-Loopback                                        |
| `::1/128`                                                                            | IPv6-Loopback                                        |
| `0.0.0.0/8`, `::/128`                                                                | Nicht angegebene Adressen und Adressen dieses Netzwerks |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | Private RFC1918-Netzwerke                            |
| `169.254.0.0/16`, `fe80::/10`                                                        | Linklokale Adressen und gängige Cloud-Metadatenpfade |
| `169.254.169.254`, `metadata.google.internal`                                        | Cloud-Metadatendienste                               |
| `100.64.0.0/10`                                                                      | Gemeinsam genutzter Carrier-grade-NAT-Adressraum     |
| `198.18.0.0/15`, `2001:2::/48`                                                       | Benchmarking-Bereiche                                |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | Spezialnutzungs- und Dokumentationsbereiche          |
| `224.0.0.0/4`, `ff00::/8`                                                            | Multicast                                            |
| `240.0.0.0/4`                                                                        | Reserviertes IPv4                                    |
| `fc00::/7`, `fec0::/10`                                                              | Lokale/private IPv6-Bereiche                         |
| `100::/64`, `2001:20::/28`                                                           | IPv6-Discard- und ORCHIDv2-Bereiche                  |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | NAT64-Präfixe mit eingebettetem IPv4                 |
| `2002::/16`, `2001::/32`                                                             | 6to4 und Teredo mit eingebettetem IPv4               |
| `::/96`, `::ffff:0:0/96`                                                             | IPv4-kompatibles und IPv4-mapped IPv6                |

Wenn Ihr Cloud-Provider oder Ihre Netzwerkplattform zusätzliche Metadaten-Hosts oder reservierte Bereiche dokumentiert, fügen Sie diese ebenfalls hinzu.

## Validierung

Validieren Sie den Proxy vom selben Host, Container oder Dienstkonto aus, auf dem OpenClaw ausgeführt wird:

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

Standardmäßig prüft der Befehl, wenn keine benutzerdefinierten Ziele angegeben sind, dass `https://example.com/` erfolgreich ist, und startet einen temporären Loopback-Canary, den der Proxy nicht erreichen darf. Die standardmäßige Verweigerungsprüfung ist erfolgreich, wenn der Proxy eine Nicht-2xx-Ablehnungsantwort zurückgibt oder den Canary mit einem Transportfehler blockiert; sie schlägt fehl, wenn eine erfolgreiche Antwort den Canary erreicht. Wenn kein Proxy aktiviert und konfiguriert ist, meldet die Validierung ein Konfigurationsproblem; verwenden Sie `--proxy-url` für einen einmaligen Preflight-Check, bevor Sie die Konfiguration ändern. Verwenden Sie `--allowed-url` und `--denied-url`, um bereitstellungsspezifische Erwartungen zu testen. Fügen Sie `--apns-reachable` hinzu, um außerdem zu prüfen, ob direkte APNs-HTTP/2-Zustellung über den Proxy einen CONNECT-Tunnel öffnen und eine Sandbox-APNs-Antwort empfangen kann; die Prüfung verwendet absichtlich ein ungültiges Provider-Token, daher wird `403 InvalidProviderToken` erwartet und als erreichbar gewertet. Benutzerdefinierte verweigerte Ziele sind fail-closed: Jede HTTP-Antwort bedeutet, dass das Ziel über den Proxy erreichbar war, und jeder Transportfehler wird als nicht schlüssig gemeldet, weil OpenClaw nicht beweisen kann, dass der Proxy einen erreichbaren Ursprung blockiert hat. Bei einem Validierungsfehler beendet sich der Befehl mit Code 1.

Verwenden Sie `--json` für Automatisierung. Die JSON-Ausgabe enthält das Gesamtergebnis, die effektive Quelle der Proxy-Konfiguration, alle Konfigurationsfehler und jede Zielprüfung. Anmeldedaten in der Proxy-URL werden in Text- und JSON-Ausgabe geschwärzt:

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

Die öffentliche Anfrage sollte erfolgreich sein. Die Loopback- und Metadatenanfragen sollten vom Proxy blockiert werden. Bei `openclaw proxy validate` kann der integrierte Loopback-Canary eine Proxy-Verweigerung von einem erreichbaren Ursprung unterscheiden. Benutzerdefinierte `--denied-url`-Prüfungen haben diesen Canary nicht. Behandeln Sie daher sowohl HTTP-Antworten als auch mehrdeutige Transportfehler als Validierungsfehler, sofern Ihr Proxy kein bereitstellungsspezifisches Verweigerungssignal bereitstellt, das Sie separat verifizieren können.

Aktivieren Sie anschließend OpenClaw-Proxy-Routing:

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

- Der Proxy verbessert die Abdeckung für prozesslokale JavaScript-HTTP- und WebSocket-Clients, ist aber keine Netzwerksandbox auf Betriebssystemebene.
- Gateway-Loopback-Traffic der Control Plane verwendet standardmäßig eine direkte lokale Umgehung über `proxy.loopbackMode: "gateway-only"`. OpenClaw implementiert diese Umgehung, indem die aktive Gateway-Loopback-Autorität im verwalteten `global-agent`-`NO_PROXY`-Controller registriert wird. Betreiber können `proxy.loopbackMode: "proxy"` setzen, um Gateway-Loopback-Traffic über den verwalteten Proxy zu senden, oder `proxy.loopbackMode: "block"`, um Loopback-Gateway-Verbindungen zu verweigern. Siehe [Gateway-Loopback-Modus](#gateway-loopback-mode) für den Hinweis zum Remote-Proxy.
- Roh-`net`-, `tls`- und `http2`-Sockets, native Addons und Nicht-OpenClaw-Kindprozesse können Proxy-Routing auf Node-Ebene umgehen, sofern sie Proxy-Umgebungsvariablen nicht erben und beachten. Geforkte OpenClaw-Child-CLIs erben die verwaltete Proxy-URL und den Zustand von `proxy.loopbackMode`.
- IRC ist ein Roh-TCP/TLS-Kanal außerhalb des vom Betreiber verwalteten Forward-Proxy-Routings. Setzen Sie in Bereitstellungen, die sämtlichen ausgehenden Datenverkehr über diesen Forward Proxy erzwingen, `channels.irc.enabled=false`, sofern direkter IRC-Egress nicht ausdrücklich genehmigt ist.
- Der lokale Debug-Proxy ist Diagnosewerkzeug, und seine direkte Upstream-Weiterleitung für Proxy-Anfragen und CONNECT-Tunnel ist standardmäßig deaktiviert, solange der verwaltete Proxy-Modus aktiv ist; aktivieren Sie direkte Weiterleitung nur für genehmigte lokale Diagnosen.
- Lokale WebUIs der Benutzer und lokale Modellserver sollten bei Bedarf in der Betreiber-Proxy-Richtlinie auf die Allowlist gesetzt werden; OpenClaw stellt dafür keine allgemeine Umgehung des lokalen Netzwerks bereit.
- Die Proxy-Umgehung für die Gateway-Control-Plane ist absichtlich auf `localhost` und wörtliche Loopback-IP-URLs begrenzt. Verwenden Sie `ws://127.0.0.1:18789`, `ws://[::1]:18789` oder `ws://localhost:18789` für direkte lokale Gateway-Control-Plane-Verbindungen; andere Hostnamen werden wie gewöhnlicher hostnamenbasierter Traffic geroutet.
- OpenClaw prüft, testet oder zertifiziert Ihre Proxy-Richtlinie nicht.
- Behandeln Sie Änderungen an der Proxy-Richtlinie als sicherheitssensible betriebliche Änderungen.

| Oberfläche                                                  | Status des verwalteten Proxys                                                                                         |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `fetch`, `node:http`, `node:https`, gängige WebSocket-Clients | Wird bei Konfiguration über verwaltete Proxy-Hooks geroutet.                                                          |
| Direkte APNs-HTTP/2                                        | Wird über den verwalteten APNs-CONNECT-Helfer geroutet.                                                               |
| Gateway-Control-Plane-Loopback                             | Direkt nur für die konfigurierte lokale Loopback-Gateway-URL.                                                         |
| Debug-Proxy-Upstream-Weiterleitung                         | Deaktiviert, solange der verwaltete Proxy-Modus aktiv ist, sofern nicht ausdrücklich für lokale Diagnosen aktiviert.  |
| IRC                                                        | Roh-TCP/TLS; wird im verwalteten HTTP-Proxy-Modus nicht proxied. Deaktivieren, sofern direkter IRC-Egress nicht genehmigt ist. |
| Andere rohe `net`-, `tls`- oder `http2`-Clientaufrufe       | Müssen vor dem Landing durch den Raw-Socket-Guard klassifiziert werden.                                               |
