---
read_when:
    - Sie möchten mehrschichtigen Schutz vor SSRF- und DNS-Rebinding-Angriffen
    - Externen Forward-Proxy für OpenClaw-Laufzeitdatenverkehr konfigurieren
summary: So leiten Sie OpenClaw-Laufzeit-HTTP- und WebSocket-Datenverkehr über einen vom Betreiber verwalteten Filter-Proxy
title: Netzwerkproxy
x-i18n:
    generated_at: "2026-06-27T18:13:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3fc68d950037922ba3dc983c94a71bac3374750a02ef25f2c046cf782410be68
    source_path: security/network-proxy.md
    workflow: 16
---

OpenClaw kann HTTP- und WebSocket-Traffic zur Laufzeit über einen vom Betreiber verwalteten Forward-Proxy leiten. Dies ist eine optionale Defense-in-Depth-Maßnahme für Deployments, die zentrale Egress-Kontrolle, stärkeren SSRF-Schutz und bessere Netzwerk-Auditierbarkeit wünschen.

OpenClaw liefert keinen Proxy aus, lädt keinen Proxy herunter, startet, konfiguriert oder zertifiziert keinen Proxy. Sie betreiben die Proxy-Technologie, die zu Ihrer Umgebung passt, und OpenClaw leitet normale prozesslokale HTTP- und WebSocket-Clients darüber.

## Warum einen Proxy verwenden

Ein Proxy gibt Betreibern einen zentralen Netzwerk-Kontrollpunkt für ausgehenden HTTP- und WebSocket-Traffic. Das kann auch außerhalb der SSRF-Härtung nützlich sein:

- Zentrale Richtlinie: Pflegen Sie eine Egress-Richtlinie, statt sich darauf zu verlassen, dass jede HTTP-Aufrufstelle der Anwendung Netzwerkregeln korrekt umsetzt.
- Prüfungen beim Verbindungsaufbau: Bewerten Sie das Ziel nach der DNS-Auflösung und unmittelbar bevor der Proxy die Upstream-Verbindung öffnet.
- Schutz vor DNS-Rebinding: Verringern Sie die Lücke zwischen einer DNS-Prüfung auf Anwendungsebene und der tatsächlichen ausgehenden Verbindung.
- Breitere JavaScript-Abdeckung: Leiten Sie normale `fetch`-, `node:http`-, `node:https`-, WebSocket-, axios-, got-, node-fetch- und ähnliche Clients über denselben Pfad.
- Auditierbarkeit: Protokollieren Sie erlaubte und verweigerte Ziele an der Egress-Grenze.
- Operative Kontrolle: Erzwingen Sie Zielregeln, Netzwerksegmentierung, Ratenlimits oder ausgehende Allowlists, ohne OpenClaw neu zu bauen.

Proxy-Routing ist eine Schutzleitplanke auf Prozessebene für normalen HTTP- und WebSocket-Egress. Es gibt Betreibern einen fail-closed Pfad, um unterstützte JavaScript-HTTP-Clients über ihren eigenen filternden Proxy zu leiten, ist aber keine Netzwerksandbox auf Betriebssystemebene und bedeutet nicht, dass OpenClaw die Zielrichtlinie des Proxys zertifiziert.

## Wie OpenClaw Traffic leitet

Wenn `proxy.enabled=true` und eine Proxy-URL konfiguriert ist, leiten geschützte Laufzeitprozesse wie `openclaw gateway run`, `openclaw node run` und `openclaw agent --local` normalen HTTP- und WebSocket-Egress über den konfigurierten Proxy:

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

Der öffentliche Vertrag ist das Routing-Verhalten, nicht die internen Node-Hooks, mit denen es implementiert wird. OpenClaw Gateway-Control-Plane-WebSocket-Clients verwenden einen engen direkten Pfad für lokalen local loopback Gateway-RPC-Traffic, wenn die Gateway-URL `localhost` oder eine wörtliche Loopback-IP wie `127.0.0.1` oder `[::1]` verwendet. Dieser Control-Plane-Pfad muss Loopback-Gateways erreichen können, auch wenn der Betreiber-Proxy Loopback-Ziele blockiert. Normale HTTP- und WebSocket-Anfragen zur Laufzeit verwenden weiterhin den konfigurierten Proxy.

Intern installiert OpenClaw Proxyline als Routing-Laufzeit auf Prozessebene für diese Funktion. Proxyline deckt `fetch`, undici-basierte Clients, Node-Core-Aufrufer von `node:http` / `node:https`, gängige WebSocket-Clients und von Helfern erstellte CONNECT-Tunnel ab. Der verwaltete Proxy-Modus ersetzt vom Aufrufer bereitgestellte Node-HTTP-Agents, damit explizite Agents den Betreiber-Proxy nicht versehentlich umgehen.

Einige Plugins besitzen eigene Transports, die explizite Proxy-Verdrahtung benötigen, selbst wenn Routing auf Prozessebene vorhanden ist. Beispielsweise verwendet Telegrams Bot-API-Transport seinen eigenen HTTP/1-undici-Dispatcher und berücksichtigt daher die Prozess-Proxy-Umgebung plus den verwalteten `OPENCLAW_PROXY_URL`-Fallback in diesem owner-spezifischen Transportpfad.

Die Proxy-URL selbst kann entweder `http://` oder `https://` verwenden. Diese Schemas beschreiben die Verbindung von OpenClaw zum Proxy-Endpunkt:

- `http://proxy.example:3128`: OpenClaw öffnet eine einfache TCP-Verbindung zum Forward-Proxy und sendet HTTP-Proxy-Anfragen, einschließlich `CONNECT` für HTTPS-Ziele.
- `https://proxy.example:8443`: OpenClaw öffnet TLS zum Proxy-Endpunkt, verifiziert das Proxy-Zertifikat und sendet dann HTTP-Proxy-Anfragen innerhalb dieser TLS-Sitzung.

Ziel-HTTPS ist von Proxy-Endpunkt-TLS getrennt. Für ein HTTPS-Ziel fordert OpenClaw weiterhin beim Proxy einen HTTP-`CONNECT`-Tunnel an und startet dann Ziel-TLS durch diesen Tunnel.

Während der Proxy aktiv ist, leert OpenClaw `no_proxy` und `NO_PROXY`. Diese Bypass-Listen sind zielbasiert; wenn `localhost` oder `127.0.0.1` dort verblieben, könnten hochriskante SSRF-Ziele den filternden Proxy umgehen.

Beim Herunterfahren stellt OpenClaw die vorherige Proxy-Umgebung wieder her und setzt den zwischengespeicherten Prozess-Routing-Zustand zurück.

## Verwandte Proxy-Begriffe

- `proxy.enabled` / `proxy.proxyUrl`: ausgehendes Forward-Proxy-Routing für OpenClaw-Laufzeit-Egress. Diese Seite dokumentiert diese Funktion.
- `gateway.auth.mode: "trusted-proxy"`: eingehende identitätsbewusste Reverse-Proxy-Authentifizierung für Gateway-Zugriff. Siehe [Trusted-Proxy-Auth](/de/gateway/trusted-proxy-auth).
- `openclaw proxy`: lokaler Debug-Proxy und Capture-Inspector für Entwicklung und Support. Siehe [openclaw proxy](/de/cli/proxy).
- `tools.web.fetch.useTrustedEnvProxy`: Opt-in für `web_fetch`, damit ein betreiberkontrollierter HTTP(S)-Env-Proxy DNS auflösen kann, während standardmäßig striktes DNS-Pinning und Hostname-Richtlinie beibehalten werden. Siehe [Web Fetch](/de/tools/web-fetch#trusted-env-proxy).
- Channel- oder Provider-spezifische Proxy-Einstellungen: owner-spezifische Overrides für einen bestimmten Transport. Bevorzugen Sie den verwalteten Netzwerk-Proxy, wenn das Ziel zentrale Egress-Kontrolle über die Laufzeit hinweg ist.

## Konfiguration

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

Für einen HTTPS-Proxy-Endpunkt mit privater Proxy-CA:

```yaml
proxy:
  enabled: true
  proxyUrl: https://proxy.corp.example:8443
  tls:
    caFile: /etc/openclaw/proxy-ca.pem
```

Sie können die URL auch über die Umgebung bereitstellen, während `proxy.enabled=true` in der Konfiguration bleibt:

```bash
OPENCLAW_PROXY_URL=http://127.0.0.1:3128 openclaw gateway run
```

`proxy.proxyUrl` hat Vorrang vor `OPENCLAW_PROXY_URL`.

### Gateway-Loopback-Modus

Lokale Gateway-Control-Plane-Clients verbinden sich üblicherweise mit einem Loopback-WebSocket wie `ws://127.0.0.1:18789`. Verwenden Sie `proxy.loopbackMode`, um festzulegen, wie Loopback-Ausnahmen des verwalteten Proxys funktionieren, während der verwaltete Proxy aktiv ist:

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
  loopbackMode: gateway-only # gateway-only, proxy, or block
```

- `gateway-only` (Standard): OpenClaw registriert die Gateway-Loopback-Authority in Proxylines verwalteter Bypass-Richtlinie, damit lokaler Gateway-WebSocket-Traffic direkt verbinden kann. Benutzerdefinierte Loopback-Gateway-Ports funktionieren, weil Host und Port der aktiven Gateway-URL registriert werden. Das gebündelte Browser-Plugin kann außerdem die exakten lokalen CDP-Readiness- und DevTools-WebSocket-Endpunkte für von OpenClaw gestartete verwaltete Browser registrieren, und der gebündelte Ollama-Memory-Embedding-Provider kann seinen eigenen engeren geschützten direkten Pfad für den exakt konfigurierten hostlokalen Loopback-Embedding-Origin verwenden.
- `proxy`: OpenClaw registriert keine Gateway- oder Ollama-Loopback-Bypasses, daher wird dieser Loopback-Traffic über den verwalteten Proxy gesendet. Wenn der Proxy remote ist, muss er spezielles Routing für den Loopback-Dienst des OpenClaw-Hosts bereitstellen, etwa durch Zuordnung zu einem vom Proxy erreichbaren Hostnamen, einer IP oder einem Tunnel. Standardmäßige Remote-Proxys lösen `127.0.0.1` und `localhost` vom Proxy-Host aus auf, nicht vom OpenClaw-Host.
- `block`: OpenClaw verweigert Gateway-Loopback-Control-Plane-Verbindungen und geschützte Ollama-hostlokale Embedding-Loopback-Verbindungen, bevor ein Socket geöffnet wird.

Wenn `enabled=true` ist, aber keine gültige Proxy-URL konfiguriert ist, schlagen geschützte Befehle beim Start fehl, statt auf direkten Netzwerkzugriff zurückzufallen.

Für verwaltete Gateway-Dienste, die mit `openclaw gateway start` gestartet werden, speichern Sie die URL vorzugsweise in der Konfiguration:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

Der Umgebungs-Fallback eignet sich am besten für Vordergrundläufe. Wenn Sie ihn mit einem installierten Dienst verwenden, legen Sie `OPENCLAW_PROXY_URL` in der dauerhaften Umgebung des Dienstes ab, etwa in `$OPENCLAW_STATE_DIR/.env` oder `~/.openclaw/.env`, und installieren Sie den Dienst anschließend neu, damit launchd, systemd oder Scheduled Tasks das Gateway mit diesem Wert starten.

Für `openclaw --container ...`-Befehle leitet OpenClaw `OPENCLAW_PROXY_URL` an die containerbezogene Child-CLI weiter, wenn es gesetzt ist. Die URL muss aus dem Container heraus erreichbar sein; `127.0.0.1` bezieht sich auf den Container selbst, nicht auf den Host. OpenClaw weist Loopback-Proxy-URLs für containerbezogene Befehle zurück, sofern Sie diese Sicherheitsprüfung nicht ausdrücklich überschreiben.

## Proxy-Anforderungen

Die Proxy-Richtlinie ist die Sicherheitsgrenze. OpenClaw kann nicht verifizieren, dass der Proxy die richtigen Ziele blockiert.

Konfigurieren Sie den Proxy so, dass er:

- nur an Loopback oder eine private vertrauenswürdige Schnittstelle bindet.
- den Zugriff so einschränkt, dass nur der OpenClaw-Prozess, Host, Container oder das Dienstkonto ihn verwenden kann.
- Ziele selbst auflöst und Ziel-IPs nach der DNS-Auflösung blockiert.
- Richtlinien beim Verbindungsaufbau sowohl für einfache HTTP-Anfragen als auch für HTTPS-`CONNECT`-Tunnel anwendet.
- zielbasierte Bypasses für Loopback-, private, linklokale, Metadaten-, Multicast-, reservierte oder Dokumentationsbereiche zurückweist.
- Hostname-Allowlists vermeidet, sofern Sie dem DNS-Auflösungspfad nicht vollständig vertrauen.
- Ziel, Entscheidung, Status und Grund protokolliert, ohne Request-Bodies, Authorization-Header, Cookies oder andere Geheimnisse zu protokollieren.
- die Proxy-Richtlinie unter Versionskontrolle hält und Änderungen wie sicherheitssensitive Konfiguration prüft.

## Empfohlene blockierte Ziele

Verwenden Sie diese Denylist als Ausgangspunkt für jeden Forward-Proxy, jede Firewall oder jede Egress-Richtlinie.

Die Klassifizierungslogik auf OpenClaw-Anwendungsebene befindet sich in `src/infra/net/ssrf.ts` und `packages/net-policy/src/ip.ts`. Die relevanten Paritäts-Hooks sind `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX` und die eingebettete IPv4-Sentinel-Behandlung für NAT64-, 6to4-, Teredo-, ISATAP- und IPv4-mapped-Formen. Diese Dateien sind nützliche Referenzen bei der Pflege einer externen Proxy-Richtlinie, aber OpenClaw exportiert oder erzwingt diese Regeln nicht automatisch in Ihrem Proxy.

| Bereich oder Host                                                                      | Warum blockieren                                      |
| -------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                    | IPv4-loopback                                         |
| `::1/128`                                                                              | IPv6-loopback                                         |
| `0.0.0.0/8`, `::/128`                                                                  | Nicht spezifizierte Adressen und Adressen dieses Netzes |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                        | Private RFC1918-Netzwerke                            |
| `169.254.0.0/16`, `fe80::/10`                                                          | Link-lokale Adressen und gängige Cloud-Metadatenpfade |
| `169.254.169.254`, `metadata.google.internal`                                          | Cloud-Metadatendienste                               |
| `100.64.0.0/10`                                                                        | Gemeinsamer Adressraum für Carrier-Grade-NAT          |
| `198.18.0.0/15`, `2001:2::/48`                                                         | Benchmarking-Bereiche                                |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32`   | Bereiche für Sondernutzung und Dokumentation          |
| `224.0.0.0/4`, `ff00::/8`                                                              | Multicast                                             |
| `240.0.0.0/4`                                                                          | Reserviertes IPv4                                    |
| `fc00::/7`, `fec0::/10`                                                                | Lokale/private IPv6-Bereiche                         |
| `100::/64`, `2001:20::/28`                                                             | IPv6-Discard- und ORCHIDv2-Bereiche                  |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                       | NAT64-Präfixe mit eingebettetem IPv4                 |
| `2002::/16`, `2001::/32`                                                               | 6to4 und Teredo mit eingebettetem IPv4               |
| `::/96`, `::ffff:0:0/96`                                                               | IPv4-kompatibles und IPv4-gemapptes IPv6             |

Wenn Ihr Cloud-Provider oder Ihre Netzwerkplattform zusätzliche Metadaten-Hosts oder reservierte Bereiche dokumentiert, fügen Sie diese ebenfalls hinzu.

## Validierung

Validieren Sie den Proxy von demselben Host, Container oder Dienstkonto aus, auf dem OpenClaw läuft:

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

Für einen HTTPS-Proxy-Endpunkt, der von einer privaten CA signiert ist:

```bash
openclaw proxy validate --proxy-url https://proxy.corp.example:8443 --proxy-ca-file /etc/openclaw/proxy-ca.pem
```

Wenn standardmäßig keine benutzerdefinierten Ziele angegeben sind, prüft der Befehl, dass `https://example.com/` erfolgreich ist, und startet einen temporären loopback-Canary, den der Proxy nicht erreichen darf. Die standardmäßige verweigerte Prüfung gilt als bestanden, wenn der Proxy eine Nicht-2xx-Verweigerungsantwort zurückgibt oder den Canary mit einem Transportfehler blockiert; sie schlägt fehl, wenn eine erfolgreiche Antwort den Canary erreicht. Wenn kein Proxy aktiviert und konfiguriert ist, meldet die Validierung ein Konfigurationsproblem; verwenden Sie `--proxy-url` für einen einmaligen Preflight, bevor Sie die Konfiguration ändern. Verwenden Sie `--allowed-url` und `--denied-url`, um deployment-spezifische Erwartungen zu testen. Fügen Sie `--apns-reachable` hinzu, um außerdem zu prüfen, ob die direkte APNs-HTTP/2-Zustellung einen CONNECT-Tunnel durch den Proxy öffnen und eine Sandbox-APNs-Antwort empfangen kann; die Prüfung verwendet absichtlich ein ungültiges Provider-Token, daher wird `403 InvalidProviderToken` erwartet und zählt als erreichbar. Benutzerdefinierte verweigerte Ziele sind fail-closed: Jede HTTP-Antwort bedeutet, dass das Ziel über den Proxy erreichbar war, und jeder Transportfehler wird als nicht eindeutig gemeldet, weil OpenClaw nicht beweisen kann, dass der Proxy einen erreichbaren Ursprung blockiert hat. Bei einem Validierungsfehler beendet sich der Befehl mit Code 1.

Verwenden Sie `--json` für Automatisierung. Die JSON-Ausgabe enthält das Gesamtergebnis, die effektive Quelle der Proxy-Konfiguration, etwaige Konfigurationsfehler und jede Zielprüfung. Anmeldedaten in Proxy-URLs werden in Text- und JSON-Ausgaben redigiert:

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

Die öffentliche Anfrage sollte erfolgreich sein. Die loopback- und Metadatenanfragen sollten vom Proxy blockiert werden. Bei `openclaw proxy validate` kann der integrierte loopback-Canary eine Proxy-Verweigerung von einem erreichbaren Ursprung unterscheiden. Benutzerdefinierte `--denied-url`-Prüfungen haben diesen Canary nicht. Behandeln Sie daher sowohl HTTP-Antworten als auch mehrdeutige Transportfehler als Validierungsfehler, sofern Ihr Proxy kein deployment-spezifisches Verweigerungssignal bereitstellt, das Sie separat prüfen können.

## Proxy-CA-Vertrauen

Verwenden Sie das verwaltete `proxy.tls.caFile`, wenn der Proxy-Endpunkt selbst ein Zertifikat verwendet, das von einer privaten CA signiert wurde:

```yaml
proxy:
  enabled: true
  proxyUrl: https://proxy.corp.example:8443
  tls:
    caFile: /etc/openclaw/proxy-ca.pem
```

Diese CA wird für die TLS-Verifizierung des Proxy-Endpunkts verwendet. Sie ist keine MITM-Vertrauenseinstellung für Ziele, kein Client-Zertifikat und kein Ersatz für die Zielrichtlinie des Proxys.

Verwenden Sie `NODE_EXTRA_CA_CERTS` nur, wenn der gesamte Node-Prozess ab Prozessstart einer zusätzlichen CA vertrauen muss, etwa wenn ein Unternehmenssystem zur TLS-Inspektion Zielzertifikate für jeden HTTPS-Client im Prozess neu signiert. `NODE_EXTRA_CA_CERTS` ist prozessglobal und muss vorhanden sein, bevor Node startet. Bevorzugen Sie `proxy.tls.caFile` für das Vertrauen in HTTPS-Proxy-Endpunkte, weil es auf verwaltetes Proxy-Routing beschränkt ist.

Aktivieren Sie dann das OpenClaw-Proxy-Routing:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl https://proxy.corp.example:8443
openclaw config set proxy.tls.caFile /etc/openclaw/proxy-ca.pem
openclaw gateway run
```

oder setzen Sie:

```yaml
proxy:
  enabled: true
  proxyUrl: https://proxy.corp.example:8443
  tls:
    caFile: /etc/openclaw/proxy-ca.pem
```

## Grenzen

- Der Proxy verbessert die Abdeckung für prozesslokale JavaScript-HTTP- und WebSocket-Clients, ist aber keine Netzwerk-Sandbox auf Betriebssystemebene.
- Gateway-loopback-Control-Plane-Verkehr verwendet standardmäßig eine direkte lokale Umgehung über `proxy.loopbackMode: "gateway-only"`. OpenClaw implementiert diese Umgehung, indem die aktive Gateway-loopback-Authority in der verwalteten Umgehungsrichtlinie von Proxyline registriert wird. Betreiber können `proxy.loopbackMode: "proxy"` setzen, um Gateway-loopback-Verkehr durch den verwalteten Proxy zu senden, oder `proxy.loopbackMode: "block"`, um loopback-Gateway-Verbindungen zu verweigern. Siehe [Gateway-loopback-Modus](#gateway-loopback-mode) für den Hinweis zum Remote-Proxy.
- Raw-`net`-, `tls`- und `http2`-Sockets, native Add-ons und Nicht-OpenClaw-Child-Prozesse können Proxy-Routing auf Node-Ebene umgehen, sofern sie Proxy-Umgebungsvariablen nicht erben und respektieren. Geforkte OpenClaw-Child-CLIs erben die verwaltete Proxy-URL und den Zustand von `proxy.loopbackMode`.
- IRC ist ein Raw-TCP/TLS-Kanal außerhalb des vom Betreiber verwalteten Forward-Proxy-Routings. In Deployments, die den gesamten Egress über diesen Forward-Proxy erfordern, setzen Sie `channels.irc.enabled=false`, sofern direkter IRC-Egress nicht ausdrücklich genehmigt ist.
- Der lokale Debug-Proxy ist ein Diagnosewerkzeug. Seine direkte Upstream-Weiterleitung für Proxy-Anfragen und CONNECT-Tunnel ist standardmäßig deaktiviert, während der verwaltete Proxy-Modus aktiv ist; aktivieren Sie direkte Weiterleitung nur für genehmigte lokale Diagnosen.
- Lokale WebUIs von Benutzern und lokale Modellserver sollten bei Bedarf in der Betreiber-Proxy-Richtlinie allowlisted werden; OpenClaw stellt dafür keine allgemeine Umgehung des lokalen Netzwerks bereit. Der gebündelte Ollama-Memory-Embedding-Provider ist enger gefasst: Er kann einen geschützten direkten Pfad nur für den exakt host-lokalen loopback-Embedding-Ursprung verwenden, der aus der konfigurierten `baseUrl` abgeleitet wird, damit host-lokale Embeddings weiter funktionieren, wenn der verwaltete Proxy Host-loopback nicht erreichen kann. LAN-, Tailnet-, private Netzwerk- und öffentliche Ollama-Embedding-Hosts verwenden weiterhin den verwalteten Proxy-Pfad. `proxy.loopbackMode: "proxy"` sendet diesen Ollama-loopback-Verkehr durch den verwalteten Proxy, und `proxy.loopbackMode: "block"` verweigert ihn, bevor eine Verbindung geöffnet wird.
- Die Proxy-Umgehung der Gateway-Control-Plane ist absichtlich auf `localhost` und literale loopback-IP-URLs beschränkt. Verwenden Sie `ws://127.0.0.1:18789`, `ws://[::1]:18789` oder `ws://localhost:18789` für lokale direkte Gateway-Control-Plane-Verbindungen; andere Hostnamen werden wie gewöhnlicher hostnamenbasierter Verkehr geroutet.
- OpenClaw inspiziert, testet oder zertifiziert Ihre Proxy-Richtlinie nicht.
- Behandeln Sie Änderungen an Proxy-Richtlinien als sicherheitssensible betriebliche Änderungen.

| Oberfläche                                                   | Status des verwalteten Proxys                                                                      |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `fetch`, `node:http`, `node:https`, gängige WebSocket-Clients | Wird bei Konfiguration über verwaltete Proxy-Hooks geroutet.                                       |
| Direkte APNs-HTTP/2-Verbindung                              | Wird über den verwalteten APNs-CONNECT-Helfer geroutet.                                            |
| Gateway-Control-Plane-loopback                               | Direkt nur für die konfigurierte lokale loopback-Gateway-URL.                                      |
| Debug-Proxy-Upstream-Weiterleitung                           | Deaktiviert, während der verwaltete Proxy-Modus aktiv ist, sofern nicht ausdrücklich für lokale Diagnosen aktiviert. |
| IRC                                                          | Raw-TCP/TLS; wird vom verwalteten HTTP-Proxy-Modus nicht proxied. Deaktivieren, sofern direkter IRC-Egress nicht genehmigt ist. |
| Andere Raw-`net`-, `tls`- oder `http2`-Client-Aufrufe         | Müssen vor dem Landen durch den Raw-Socket-Guard klassifiziert werden.                             |
