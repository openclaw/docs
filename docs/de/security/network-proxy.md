---
read_when:
    - Sie möchten einen mehrschichtigen Schutz vor SSRF- und DNS-Rebinding-Angriffen.
    - Konfigurieren eines externen Forward-Proxys für den OpenClaw-Laufzeitdatenverkehr
summary: So leiten Sie den HTTP- und WebSocket-Datenverkehr der OpenClaw-Laufzeit über einen vom Betreiber verwalteten Filter-Proxy weiter
title: Netzwerk-Proxy
x-i18n:
    generated_at: "2026-07-24T04:42:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e948189d691e2cfe32e911e24071fd77157397b510d606423ef738c2565071b5
    source_path: security/network-proxy.md
    workflow: 16
---

OpenClaw kann HTTP- und WebSocket-Datenverkehr zur Laufzeit über einen vom Betreiber verwalteten Forward-Proxy leiten. Dies ist eine optionale mehrschichtige Schutzmaßnahme: zentrale Kontrolle des ausgehenden Datenverkehrs, stärkerer SSRF-Schutz und Nachvollziehbarkeit der Ziele an der Netzwerkgrenze. Da der Proxy das Ziel beim Verbindungsaufbau prüft, also nach der DNS-Auflösung und unmittelbar vor dem Öffnen der Upstream-Verbindung, verkleinert er außerdem das Zeitfenster, auf das ein DNS-Rebinding-Angriff zwischen einer früheren DNS-Prüfung auf Anwendungsebene und der tatsächlichen ausgehenden Verbindung angewiesen ist. Eine einheitliche Proxy-Richtlinie bietet Betreibern zudem eine zentrale Stelle, um Zielregeln, Netzwerksegmentierung, Ratenbegrenzungen oder Positivlisten für ausgehende Verbindungen durchzusetzen, ohne OpenClaw neu erstellen zu müssen.

OpenClaw liefert keinen Proxy mit, lädt keinen herunter, startet oder konfiguriert keinen und zertifiziert keinen. Sie betreiben die für Ihre Umgebung geeignete Proxy-Technologie; OpenClaw leitet seine eigenen HTTP- und WebSocket-Clients darüber.

## Konfiguration

```yaml
proxy:
  proxyUrl: http://127.0.0.1:3128
```

Sie können die URL auch über die Umgebung festlegen:

```bash
OPENCLAW_PROXY_URL=http://127.0.0.1:3128 openclaw gateway run
```

`proxy.proxyUrl` hat Vorrang vor `OPENCLAW_PROXY_URL`. Eine konfigurierte URL aktiviert die verwaltete Proxy-Weiterleitung; durch Entfernen beider URLs wird sie deaktiviert.

| Schlüssel              | Typ                                  | Standardwert   | Hinweise                                                                                                                                 |
| ---------------------- | ------------------------------------ | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `proxy.proxyUrl`     | Zeichenfolge                         | nicht gesetzt  | Forward-Proxy-URL mit `http://` oder `https://`. In die URL eingebettete Anmeldedaten werden als vertraulich behandelt und in Snapshots/Protokollen unkenntlich gemacht. |
| `proxy.tls.caFile`     | Zeichenfolge                         | nicht gesetzt  | CA-Bundle zur Überprüfung eines mit einer privaten CA signierten `https://`-Proxy-Endpunkts.                                      |
| `proxy.loopbackMode`     | `gateway-only` \| `proxy` \| `block` | `gateway-only` | Steuert das Verhalten bei der Loopback-Umgehung; siehe unten.                                                                            |

Speichern Sie bei verwalteten Gateway-Diensten die URL in der Konfiguration, damit sie eine Neuinstallation übersteht, statt sich auf die Umgebung eines Vordergrundprozesses zu verlassen:

```bash
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

Die Ausweichlösung über die Umgebungsvariable `OPENCLAW_PROXY_URL` eignet sich am besten für Vordergrundausführungen. Um sie mit einem installierten Dienst zu verwenden, legen Sie sie in der dauerhaften Umgebung des Dienstes ab (`$OPENCLAW_STATE_DIR/.env`, standardmäßig `~/.openclaw/.env`) und installieren Sie den Dienst anschließend neu, damit launchd/systemd/Geplante Aufgaben sie übernehmen.

### HTTPS-Proxy-Endpunkt mit einer privaten CA

```yaml
proxy:
  proxyUrl: https://proxy.corp.example:8443
  tls:
    caFile: /etc/openclaw/proxy-ca.pem
```

`proxy.tls.caFile` überprüft das eigene TLS-Zertifikat des Proxy-Endpunkts. Es ist weder eine MITM-Vertrauenseinstellung für Ziele noch ein Clientzertifikat oder ein Ersatz für die Zielrichtlinie des Proxys. Verwenden Sie stattdessen `NODE_EXTRA_CA_CERTS` nur, wenn der gesamte Node-Prozess bereits beim Start einer zusätzlichen CA vertrauen muss (beispielsweise bei einem unternehmensweiten TLS-Inspektionssystem, das jedes HTTPS-Zielzertifikat neu signiert) — diese Variable gilt prozessweit und muss vor dem Start von Node gesetzt werden. Daher kann OpenClaw sie nicht wie `proxy.tls.caFile` während der Ausführung anwenden. Bevorzugen Sie `proxy.tls.caFile` für das Vertrauen in HTTPS-Proxy-Endpunkte: Diese Einstellung ist auf die verwaltete Proxy-Weiterleitung beschränkt und gilt nicht für den gesamten Prozess.

```bash
openclaw config set proxy.proxyUrl https://proxy.corp.example:8443
openclaw config set proxy.tls.caFile /etc/openclaw/proxy-ca.pem
openclaw gateway run
```

## Funktionsweise der Weiterleitung

Mit einer gültigen Proxy-URL leiten geschützte Laufzeitprozesse (`openclaw gateway run`, `openclaw node run`, `openclaw agent --local`) gewöhnlichen ausgehenden HTTP- und WebSocket-Datenverkehr über den Proxy:

```text
OpenClaw-Prozess
  fetch, node:http, node:https, WebSocket-Clients  -> Betreiber-Proxy -> Ziel
```

Intern installiert OpenClaw [Proxyline](https://github.com/openclaw/proxyline) als prozessweite Laufzeit für die Weiterleitung. Sie deckt `fetch`, auf undici basierende Clients, `node:http`/`node:https`, gängige WebSocket-Clients und von Hilfsfunktionen erstellte `CONNECT`-Tunnel ab. Außerdem ersetzt sie von Aufrufern bereitgestellte Node-HTTP-Agents, sodass ausdrücklich angegebene Agents (einschließlich `axios`, `got`, `node-fetch` und ähnlicher auf Node-Agents basierender Clients) den Proxy nicht unbemerkt umgehen können.

Das Schema der Proxy-URL beschreibt die Verbindung von OpenClaw zum Proxy, nicht zum endgültigen Ziel:

- `http://proxy.example:3128` — unverschlüsselte TCP-Verbindung zum Proxy; OpenClaw sendet HTTP-Proxy-Anfragen, einschließlich `CONNECT` für HTTPS-Ziele.
- `https://proxy.example:8443` — OpenClaw baut eine TLS-Verbindung zum Proxy selbst auf (wobei das Zertifikat des Proxys überprüft wird) und sendet anschließend innerhalb dieser Sitzung HTTP-Proxy-Anfragen.

Ziel-TLS ist unabhängig vom TLS des Proxy-Endpunkts: Bei einem HTTPS-Ziel fordert OpenClaw vom Proxy stets einen `CONNECT`-Tunnel an und startet Ziel-TLS durch diesen Tunnel.

Während der Proxy aktiv ist, löscht OpenClaw `no_proxy`/`NO_PROXY`. Diese Umgehungslisten beziehen sich auf Ziele; würden `localhost` oder `127.0.0.1` darin verbleiben, könnten SSRF-Ziele den Proxy vollständig umgehen. Beim Herunterfahren stellt OpenClaw die vorherige Proxy-Umgebung wieder her und setzt den zwischengespeicherten Weiterleitungsstatus zurück.

Einige Plugins verfügen über einen eigenen Transport, der auch bei aktiver prozessweiter Weiterleitung eine separate Proxy-Anbindung benötigt. Der Bot-API-Client von Telegram verwendet einen eigenen HTTP/1-undici-Dispatcher und berücksichtigt separat sowohl die Proxy-Umgebungsvariablen des Prozesses als auch die Ausweichlösung `OPENCLAW_PROXY_URL`.

### Gateway-Loopback-Modus

Lokale Clients der Gateway-Steuerungsebene stellen normalerweise eine Verbindung zu einem Loopback-WebSocket wie `ws://127.0.0.1:18789` her. `proxy.loopbackMode` steuert, ob dieser Datenverkehr den verwalteten Proxy umgeht:

```yaml
proxy:
  proxyUrl: http://127.0.0.1:3128
  loopbackMode: gateway-only # gateway-only, proxy, or block
```

Ein konfiguriertes `proxyUrl` oder `OPENCLAW_PROXY_URL` aktiviert die verwaltete Weiterleitung. Legen Sie
`proxy.enabled: false` nur als erweiterte Deaktivierungsoption fest, bei der die URL gespeichert bleibt,
ohne sie zu aktivieren.

| Modus                         | Verhalten                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gateway-only` (Standard) | OpenClaw registriert die aktive Loopback-Autorität des Gateways als Ausnahme für Direktverbindungen, sodass lokaler Gateway-WebSocket-Datenverkehr ohne den Proxy verbunden wird. Benutzerdefinierte Loopback-Ports funktionieren, weil die Ausnahme genau auf den konfigurierten Host/Port ausgerichtet ist. Das mitgelieferte Browser-Plugin registriert dieselbe Art von Ausnahme für die genauen lokalen CDP-Bereitschafts- und DevTools-WebSocket-URLs der von OpenClaw gestarteten verwalteten Browser; der mitgelieferte Ollama-Provider für Memory-Embeddings verfügt über einen enger gefassten, abgesicherten direkten Pfad für seinen genau konfigurierten hostlokalen Loopback-Ursprung für Embeddings. |
| `proxy`            | Es werden keine Loopback-Ausnahmen registriert; Gateway- und Ollama-Loopback-Datenverkehr wird über den Proxy geleitet. Ein entfernter Proxy muss zurück zum Loopback-Dienst des OpenClaw-Hosts routen können (beispielsweise über einen erreichbaren Hostnamen, eine IP-Adresse oder einen Tunnel) — ein standardmäßiger entfernter Proxy löst `127.0.0.1`/`localhost` relativ zu sich selbst auf, nicht relativ zum OpenClaw-Host.                                                                                                                                    |
| `block`            | OpenClaw verweigert Loopback-Verbindungen zur Gateway-Steuerungsebene und abgesicherte Ollama-Loopback-Verbindungen für Embeddings, bevor ein Socket geöffnet wird.                                                                                                                                                                                                                                                                                                                                                                                                     |

Die Umgehung für die Gateway-Steuerungsebene ist auf `localhost` und URLs mit wörtlichen Loopback-IP-Adressen beschränkt — verwenden Sie `ws://127.0.0.1:18789`, `ws://[::1]:18789` oder `ws://localhost:18789`. Andere Hostnamen werden wie gewöhnlicher Datenverkehr weitergeleitet.

### Container

Für `openclaw --container ...`-Befehle leitet OpenClaw `OPENCLAW_PROXY_URL` an die untergeordnete, auf den Container ausgerichtete CLI weiter, sofern die Variable gesetzt ist. Die URL muss aus dem Container heraus erreichbar sein — `127.0.0.1` bezieht sich dort auf den Container selbst, nicht auf den Host. OpenClaw lehnt Loopback-Proxy-URLs für auf Container ausgerichtete Befehle ab, sofern Sie diese Prüfung nicht ausdrücklich mit `OPENCLAW_CONTAINER_ALLOW_LOOPBACK_PROXY_URL=1` außer Kraft setzen.

## Verwandte Proxy-Begriffe

- `proxy.enabled` / `proxy.proxyUrl` — ausgehende Forward-Proxy-Weiterleitung für Laufzeitdatenverkehr. Diese Seite.
- `gateway.auth.mode: "trusted-proxy"` — eingehende identitätsbasierte Reverse-Proxy-Authentifizierung für den Gateway-Zugriff. Siehe [Authentifizierung über vertrauenswürdige Proxys](/de/gateway/trusted-proxy-auth).
- `openclaw proxy` — lokaler Debug-Proxy und Erfassungsinspektor für Entwicklung und Support. Siehe [openclaw proxy](/de/cli/proxy).
- `tools.web.fetch.useTrustedEnvProxy` — optionale Aktivierung für `web_fetch`, damit ein vom Betreiber kontrollierter HTTP(S)-Umgebungsproxy DNS auflösen kann, während standardmäßig eine strikte DNS-Bindung und Hostnamenrichtlinie beibehalten werden. Siehe [Webabruf](/de/tools/web-fetch#trusted-env-proxy).
- Kanal- oder Provider-spezifische Proxy-Einstellungen — Eigentümer-spezifische Überschreibungen für einen einzelnen Transport. Bevorzugen Sie für die zentrale Kontrolle des ausgehenden Datenverkehrs über die gesamte Laufzeit hinweg den verwalteten Netzwerk-Proxy.

## Proxy validieren

Die Zielrichtlinie des Proxys bildet die tatsächliche Sicherheitsgrenze; OpenClaw kann nicht überprüfen, ob Ihr Proxy die richtigen Ziele blockiert. Konfigurieren Sie ihn so, dass er:

- nur an Loopback oder eine private vertrauenswürdige Schnittstelle gebunden ist, die ausschließlich für den OpenClaw-Prozess/-Host/-Container bzw. das Dienstkonto erreichbar ist.
- Ziele selbst auflöst und nach der DNS-Auflösung beim Verbindungsaufbau anhand der IP-Adresse blockiert, sowohl für unverschlüsseltes HTTP als auch für HTTPS-`CONNECT`-Tunnel.
- zielbasierte Umgehungen für Loopback-, private, link-lokale, Metadaten-, Multicast-, reservierte und Dokumentationsadressbereiche ablehnt.
- Hostnamen-Positivlisten vermeidet, sofern Sie dem DNS-Auflösungspfad nicht vollständig vertrauen.
- Ziel, Entscheidung, Status und Grund protokolliert — niemals Anfragetexte, Autorisierungsheader, Cookies oder andere Geheimnisse.
- die Richtlinie unter Versionskontrolle hält und Änderungen als sicherheitsrelevant überprüft.

Validieren Sie vom selben Host/Container/Dienstkonto aus, unter dem OpenClaw ausgeführt wird:

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

Mit einem HTTPS-Proxy-Endpunkt mit privater CA:

```bash
openclaw proxy validate --proxy-url https://proxy.corp.example:8443 --proxy-ca-file /etc/openclaw/proxy-ca.pem
```

| Flag                     | Zweck                                                                |
| ------------------------ | -------------------------------------------------------------------- |
| `--proxy-url <url>`      | Diese URL validieren, statt die Konfiguration/Umgebung aufzulösen.   |
| `--proxy-ca-file <path>` | CA-Bundle für einen HTTPS-Proxy-Endpunkt.                            |
| `--allowed-url <url>`    | Ziel, bei dem ein Erfolg erwartet wird (wiederholbar).               |
| `--denied-url <url>`     | Ziel, das erwartungsgemäß blockiert wird (wiederholbar).             |
| `--apns-reachable`       | Zusätzlich prüfen, ob der Proxy einen direkten APNs-HTTP/2-Test der Sandbox tunneln kann. |
| `--apns-authority <url>` | Die mit `--apns-reachable` geprüfte APNs-Autorität überschreiben.    |
| `--timeout-ms <ms>`      | Zeitüberschreitung pro Anfrage.                                      |
| `--json`                 | Maschinenlesbare Ausgabe.                                            |

Wenn keine Konfiguration, Umgebungsvariable oder kein Wert für `--proxy-url` verfügbar ist, meldet der Befehl ein Konfigurationsproblem; übergeben Sie `--proxy-url` für eine einmalige Vorabprüfung, bevor Sie die Konfiguration ändern.

Ohne `--allowed-url`/`--denied-url` lauten die Standardprüfungen: `https://example.com/` muss erfolgreich sein, und ein temporärer Loopback-Canary-Server, den der Proxy nicht erreichen darf, muss blockiert werden. Die Loopback-Prüfung ist bei einem Transportfehler oder bei einer Nicht-2xx-Antwort ohne das laufbezogene Token des Canary erfolgreich; sie schlägt bei einer 2xx-Antwort ohne das Token fehl (ein unerwarteter Erfolg von etwas anderem als dem Canary) und insbesondere bei jeder Antwort mit dem übereinstimmenden Token, da dies beweist, dass der Proxy tatsächlich ein Loopback-Ziel weitergeleitet hat, das er hätte ablehnen müssen. Benutzerdefinierte `--denied-url`-Ziele haben kein solches Canary-Token und verhalten sich daher nach dem Fail-Closed-Prinzip: Jede HTTP-Antwort gilt als erreichbar (Fehlschlag), und ein Transportfehler wird als nicht eindeutig gemeldet und nicht als nachweislich blockiert, da OpenClaw nicht bestätigen kann, ob Ihr Proxy einen erreichbaren Ursprung abgelehnt hat oder etwas anderes fehlgeschlagen ist. `--apns-reachable` sendet absichtlich ein ungültiges Provider-Token, sodass eine `403 InvalidProviderToken`-Antwort als Nachweis gilt, dass der Tunnel Apple erreicht hat. Der Befehl wird bei jedem Validierungsfehler mit `1` beendet; Anmeldedaten in der Proxy-URL werden sowohl in der Text- als auch in der JSON-Ausgabe unkenntlich gemacht.

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
    { "kind": "allowed", "url": "https://example.com/", "ok": true, "status": 200 },
    { "kind": "apns", "url": "https://api.sandbox.push.apple.com", "ok": true, "status": 403 }
  ]
}
```

Manuelle `curl`-Prüfung (die öffentliche Anfrage sollte erfolgreich sein; die Loopback- und Metadatenanfragen sollten vom Proxy selbst blockiert werden — `curl` allein kann eine Ablehnung durch den Proxy nicht von einem nicht erreichbaren Ursprung unterscheiden, wie es der integrierte Canary von `openclaw proxy validate` kann):

```bash
curl -x http://127.0.0.1:3128 https://example.com/
curl -x http://127.0.0.1:3128 http://127.0.0.1/
curl -x http://127.0.0.1:3128 http://169.254.169.254/
```

## Empfohlene blockierte Ziele

Ausgangsbasis für eine Sperrliste in jedem Forward-Proxy sowie in jeder Firewall- oder Egress-Richtlinie. Der OpenClaw-eigene SSRF-Klassifikator befindet sich in `src/infra/net/ssrf.ts` und `packages/net-policy/src/ip.ts` (`BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, das RFC-2544-Benchmark-Präfix und die Behandlung eingebetteter IPv4-Adressen für NAT64-/6to4-/Teredo-/ISATAP-/IPv4-Mapped-Formen) — nützliche Referenzen, OpenClaw exportiert oder erzwingt diese Regeln jedoch nicht in Ihrem externen Proxy.

| Bereich oder Host                                                                    | Grund für die Blockierung                          |
| ------------------------------------------------------------------------------------ | ------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | IPv4-Loopback                                     |
| `::1/128`                                                                            | IPv6-Loopback                                     |
| `0.0.0.0/8`, `::/128`                                                                | Nicht spezifizierte Adressen/Adressen dieses Netzwerks |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | Private RFC-1918-Netzwerke                        |
| `169.254.0.0/16`, `fe80::/10`                                                        | Link-lokal, einschließlich gängiger Cloud-Metadatenpfade |
| `169.254.169.254`, `metadata.google.internal`                                        | Cloud-Metadatendienste                            |
| `100.64.0.0/10`                                                                      | Gemeinsam genutzter Adressraum für Carrier-Grade-NAT |
| `198.18.0.0/15`, `2001:2::/48`                                                       | Benchmark-Bereiche                                |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | Bereiche für besondere Verwendung und Dokumentation |
| `224.0.0.0/4`, `ff00::/8`                                                            | Multicast                                         |
| `240.0.0.0/4`                                                                        | Reserviertes IPv4                                 |
| `fc00::/7`, `fec0::/10`                                                              | Lokale/private IPv6-Bereiche                      |
| `100::/64`, `2001:20::/28`                                                           | IPv6-Discard- und ORCHIDv2-Bereiche               |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | NAT64-Präfixe mit eingebettetem IPv4              |
| `2002::/16`, `2001::/32`                                                             | 6to4 und Teredo mit eingebettetem IPv4            |
| `::/96`, `::ffff:0:0/96`                                                             | IPv4-kompatibles und IPv4-gemapptes IPv6          |

Fügen Sie alle zusätzlichen Metadaten-Hosts oder reservierten Bereiche hinzu, die Ihr Cloud-Provider oder Ihre Netzwerkplattform dokumentiert.

## Einschränkungen

| Oberfläche                                                   | Status des verwalteten Proxys                                                                                                                            |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fetch`, `node:http`, `node:https`, gängige WebSocket-Clients | Werden bei entsprechender Konfiguration über verwaltete Proxy-Hooks geleitet.                                                                            |
| Direktes APNs-HTTP/2                                         | Wird über den verwalteten APNs-`CONNECT`-Helper geleitet.                                                                                       |
| Loopback der Gateway-Steuerungsebene                         | Nur für die exakt konfigurierte lokale Loopback-Gateway-URL direkt.                                                                                      |
| Upstream-Weiterleitung des Debug-Proxys                      | Ist im verwalteten Proxy-Modus deaktiviert, sofern sie nicht ausdrücklich für lokale Diagnosen aktiviert wurde.                                          |
| IRC                                                          | Raw-TCP/TLS; wird nicht über den verwalteten HTTP-Proxy-Modus geleitet. Legen Sie `channels.irc.enabled: false` fest, wenn Ihre Bereitstellung den gesamten Egress-Datenverkehr durch den Forward-Proxy leiten muss. |
| Andere Raw-Client-Aufrufe von `net`, `tls` oder `http2` | Müssen vor der Übernahme durch den Raw-Socket-Guard klassifiziert werden.                                                                                 |

- Dies ist eine Abdeckung auf Prozessebene für JavaScript-HTTP-/WebSocket-Clients, keine Netzwerksandbox auf Betriebssystemebene.
- Raw-Sockets von `net`, `tls`, `http2`, native Add-ons und untergeordnete Prozesse, die nicht zu OpenClaw gehören, können das Routing auf Node-Ebene umgehen, sofern sie Proxy-Umgebungsvariablen nicht erben und berücksichtigen. Abgespaltene untergeordnete OpenClaw-CLI-Prozesse erben die verwaltete Proxy-URL und den `proxy.loopbackMode`-Status.
- Lokale WebUIs von Benutzern und lokale Modellserver werden nicht durch eine allgemeine Umgehung des lokalen Netzwerks abgedeckt — nehmen Sie sie bei Bedarf in die Positivliste der Proxy-Richtlinie des Betreibers auf. Die Ausnahme ist der geschützte direkte Pfad des gebündelten Ollama-Providers für Memory-Embeddings, der auf den exakten hostlokalen Loopback-Ursprung aus seinem konfigurierten `baseUrl` beschränkt ist; Ollama-Hosts im LAN, Tailnet, privaten Netzwerk und öffentlichen Netzwerk verwenden weiterhin den verwalteten Proxy.
- Die direkte Upstream-Weiterleitung des lokalen Debug-Proxys (für Proxy-Anfragen und `CONNECT`-Tunnel) ist standardmäßig deaktiviert, solange der verwaltete Proxy-Modus aktiv ist; aktivieren Sie sie nur für genehmigte lokale Diagnosen.
- OpenClaw prüft, testet oder zertifiziert Ihre Proxy-Richtlinie nicht. Behandeln Sie Änderungen an der Proxy-Richtlinie als sicherheitskritische betriebliche Änderungen.
