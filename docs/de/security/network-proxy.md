---
read_when:
    - Sie möchten mehrschichtigen Schutz vor SSRF- und DNS-Rebinding-Angriffen.
    - Konfigurieren eines externen Forward-Proxys für den OpenClaw-Laufzeitdatenverkehr
summary: So leiten Sie den HTTP- und WebSocket-Datenverkehr der OpenClaw-Laufzeit durch einen vom Betreiber verwalteten Filter-Proxy weiter
title: Netzwerk-Proxy
x-i18n:
    generated_at: "2026-07-12T15:54:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: fd82684a17a79242891eca69c549c0bfcdd5bde40fa4e791dda7f2b62c473c89
    source_path: security/network-proxy.md
    workflow: 16
---

OpenClaw kann HTTP- und WebSocket-Datenverkehr zur Laufzeit über einen vom Betreiber verwalteten Forward-Proxy leiten. Dies ist eine optionale mehrschichtige Schutzmaßnahme: zentrale Kontrolle des ausgehenden Datenverkehrs, stärkerer SSRF-Schutz und Überprüfbarkeit der Ziele an der Netzwerkgrenze. Da der Proxy das Ziel zum Verbindungszeitpunkt auswertet, also nach der DNS-Auflösung und unmittelbar bevor er die Upstream-Verbindung öffnet, verkleinert er außerdem das Zeitfenster, auf das ein DNS-Rebinding-Angriff zwischen einer früheren DNS-Prüfung auf Anwendungsebene und der tatsächlichen ausgehenden Verbindung angewiesen ist. Eine einheitliche Proxy-Richtlinie bietet Betreibern zudem eine zentrale Stelle, um Zielregeln, Netzwerksegmentierung, Ratenbegrenzungen oder Positivlisten für ausgehende Verbindungen durchzusetzen, ohne OpenClaw neu erstellen zu müssen.

OpenClaw liefert keinen Proxy mit, lädt keinen herunter, startet, konfiguriert oder zertifiziert keinen. Sie betreiben die Proxy-Technologie, die zu Ihrer Umgebung passt; OpenClaw leitet seine eigenen HTTP- und WebSocket-Clients darüber.

## Konfiguration

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

Sie können die URL auch über die Umgebung festlegen, während `proxy.enabled: true` in der Konfiguration verbleibt:

```bash
OPENCLAW_PROXY_URL=http://127.0.0.1:3128 openclaw gateway run
```

`proxy.proxyUrl` hat Vorrang vor `OPENCLAW_PROXY_URL`. Wenn `proxy.enabled` auf `true` gesetzt ist, aber keine gültige URL aufgelöst werden kann, schlagen geschützte Befehle beim Start fehl, anstatt auf direkten Netzwerkzugriff zurückzufallen.

| Schlüssel              | Typ                                  | Standardwert   | Hinweise                                                                                                                                                                         |
| ---------------------- | ------------------------------------ | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `proxy.enabled`        | Boolescher Wert                      | nicht gesetzt  | Muss auf `true` gesetzt sein, um das Routing zu aktivieren.                                                                                                                      |
| `proxy.proxyUrl`       | Zeichenfolge                         | nicht gesetzt  | Forward-Proxy-URL mit `http://` oder `https://`. In der URL eingebettete Zugangsdaten werden als vertraulich behandelt und in Snapshots/Protokollen unkenntlich gemacht.          |
| `proxy.tls.caFile`     | Zeichenfolge                         | nicht gesetzt  | CA-Bundle zur Überprüfung eines mit einer privaten CA signierten `https://`-Proxy-Endpunkts.                                                                                      |
| `proxy.loopbackMode`   | `gateway-only` \| `proxy` \| `block` | `gateway-only` | Steuert das Umgehungsverhalten für Loopback-Verbindungen; siehe unten.                                                                                                           |

Speichern Sie bei verwalteten Gateway-Diensten die URL in der Konfiguration, damit sie eine Neuinstallation überdauert, anstatt sich auf Umgebungsvariablen eines Vordergrundprozesses zu verlassen:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

Die Ausweichoption über die Umgebungsvariable `OPENCLAW_PROXY_URL` eignet sich am besten für Vordergrundausführungen. Um sie mit einem installierten Dienst zu verwenden, tragen Sie sie in die dauerhafte Umgebung des Dienstes ein (`$OPENCLAW_STATE_DIR/.env`, standardmäßig `~/.openclaw/.env`) und installieren Sie ihn anschließend erneut, damit launchd/systemd/Geplante Aufgaben sie übernimmt.

### HTTPS-Proxy-Endpunkt mit einer privaten CA

```yaml
proxy:
  enabled: true
  proxyUrl: https://proxy.corp.example:8443
  tls:
    caFile: /etc/openclaw/proxy-ca.pem
```

`proxy.tls.caFile` überprüft das TLS-Zertifikat des Proxy-Endpunkts selbst. Es handelt sich weder um eine Vertrauenseinstellung für einen MITM am Ziel noch um ein Clientzertifikat oder einen Ersatz für die Zielrichtlinie des Proxys. Verwenden Sie stattdessen `NODE_EXTRA_CA_CERTS` nur dann, wenn der gesamte Node-Prozess bereits beim Start einer zusätzlichen CA vertrauen muss (beispielsweise bei einem unternehmensweiten TLS-Inspektionssystem, das jedes Zertifikat eines HTTPS-Ziels neu signiert) — diese Variable gilt prozessweit und muss vor dem Start von Node gesetzt werden. OpenClaw kann sie daher nicht während der Ausführung anwenden, wie dies bei `proxy.tls.caFile` möglich ist. Bevorzugen Sie `proxy.tls.caFile`, um HTTPS-Proxy-Endpunkten zu vertrauen: Diese Einstellung ist auf das verwaltete Proxy-Routing beschränkt und gilt nicht für den gesamten Prozess.

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl https://proxy.corp.example:8443
openclaw config set proxy.tls.caFile /etc/openclaw/proxy-ca.pem
openclaw gateway run
```

## Funktionsweise des Routings

Mit `proxy.enabled: true` und einer gültigen URL leiten geschützte Laufzeitprozesse (`openclaw gateway run`, `openclaw node run`, `openclaw agent --local`) normalen ausgehenden HTTP- und WebSocket-Datenverkehr über den Proxy:

```text
OpenClaw-Prozess
  fetch, node:http, node:https, WebSocket-Clients  -> Betreiber-Proxy -> Ziel
```

Intern installiert OpenClaw [Proxyline](https://github.com/openclaw/proxyline) als Routing-Laufzeit auf Prozessebene. Sie deckt `fetch`, auf undici basierende Clients, `node:http`/`node:https`, gängige WebSocket-Clients und von Hilfsfunktionen erstellte `CONNECT`-Tunnel ab. Außerdem ersetzt sie von Aufrufern bereitgestellte Node-HTTP-Agents, sodass Clients mit expliziten Agents (einschließlich `axios`, `got`, `node-fetch` und ähnlichen auf Node-Agents basierenden Clients) den Proxy nicht unbemerkt umgehen können.

Das Schema der Proxy-URL beschreibt die Verbindung von OpenClaw zum Proxy, nicht zum endgültigen Ziel:

- `http://proxy.example:3128` — unverschlüsseltes TCP zum Proxy; OpenClaw sendet HTTP-Proxy-Anfragen, einschließlich `CONNECT` für HTTPS-Ziele.
- `https://proxy.example:8443` — OpenClaw baut TLS zum Proxy selbst auf (einschließlich Überprüfung des Proxy-Zertifikats) und sendet dann HTTP-Proxy-Anfragen innerhalb dieser Sitzung.

Ziel-TLS ist unabhängig vom TLS des Proxy-Endpunkts: Bei einem HTTPS-Ziel fordert OpenClaw den Proxy stets zu einem `CONNECT`-Tunnel auf und startet die TLS-Verbindung zum Ziel durch diesen Tunnel.

Während der Proxy aktiv ist, löscht OpenClaw `no_proxy`/`NO_PROXY`. Diese Umgehungslisten basieren auf Zielen; blieben `localhost` oder `127.0.0.1` darin enthalten, könnten SSRF-Ziele den Proxy vollständig umgehen. Beim Herunterfahren stellt OpenClaw die vorherige Proxy-Umgebung wieder her und setzt den zwischengespeicherten Routing-Zustand zurück.

Einige Plugins besitzen einen benutzerdefinierten Transport, der auch bei aktivem Routing auf Prozessebene eine eigene Proxy-Anbindung benötigt. Der Bot-API-Client von Telegram verwendet einen eigenen HTTP/1-undici-Dispatcher und berücksichtigt separat die Proxy-Umgebungsvariablen des Prozesses sowie die Ausweichoption `OPENCLAW_PROXY_URL`.

### Gateway-Loopback-Modus

Lokale Clients der Gateway-Steuerungsebene stellen normalerweise eine Verbindung zu einem Loopback-WebSocket wie `ws://127.0.0.1:18789` her. `proxy.loopbackMode` steuert, ob dieser Datenverkehr den verwalteten Proxy umgeht:

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
  loopbackMode: gateway-only # gateway-only, proxy oder block
```

| Modus                    | Verhalten                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gateway-only` (Standardwert) | OpenClaw registriert die aktive Gateway-Loopback-Autorität als Ausnahme für direkte Verbindungen, sodass lokaler Gateway-WebSocket-Datenverkehr ohne Proxy verbunden wird. Benutzerdefinierte Loopback-Ports funktionieren, da die Ausnahme auf den exakt konfigurierten Host/Port abzielt. Das mitgelieferte Browser-Plugin registriert dieselbe Art von Ausnahme für die exakten lokalen CDP-Bereitschafts- und DevTools-WebSocket-URLs verwalteter, von OpenClaw gestarteter Browser; der mitgelieferte Provider für Ollama-Speichereinbettungen besitzt einen enger gefassten, abgesicherten direkten Pfad für seinen exakt konfigurierten hostlokalen Loopback-Ursprung für Einbettungen. |
| `proxy`                  | Es werden keine Loopback-Ausnahmen registriert; Gateway- und Ollama-Loopback-Datenverkehr wird über den Proxy geleitet. Ein entfernter Proxy muss zum Loopback-Dienst des OpenClaw-Hosts zurückrouten können (beispielsweise über einen erreichbaren Hostnamen, eine IP-Adresse oder einen Tunnel) — ein gewöhnlicher entfernter Proxy löst `127.0.0.1`/`localhost` relativ zu sich selbst auf, nicht relativ zum OpenClaw-Host.                                                                                                                                                                                                                    |
| `block`                  | OpenClaw verweigert Gateway-Loopback-Verbindungen der Steuerungsebene sowie abgesicherte Ollama-Loopback-Verbindungen für Einbettungen, bevor ein Socket geöffnet wird.                                                                                                                                                                                                                                                                                                                                                                                                                                   |

Die Umgehung für die Gateway-Steuerungsebene ist auf `localhost` und URLs mit expliziten Loopback-IP-Adressen beschränkt — verwenden Sie `ws://127.0.0.1:18789`, `ws://[::1]:18789` oder `ws://localhost:18789`. Andere Hostnamen werden wie gewöhnlicher Datenverkehr geroutet.

### Container

Bei Befehlen der Form `openclaw --container ...` leitet OpenClaw `OPENCLAW_PROXY_URL` an die für den Container bestimmte untergeordnete CLI weiter, sofern die Variable gesetzt ist. Die URL muss aus dem Container heraus erreichbar sein — `127.0.0.1` verweist dort auf den Container selbst, nicht auf den Host. OpenClaw weist Loopback-Proxy-URLs für containerbezogene Befehle zurück, sofern Sie diese Prüfung nicht ausdrücklich mit `OPENCLAW_CONTAINER_ALLOW_LOOPBACK_PROXY_URL=1` außer Kraft setzen.

## Verwandte Proxy-Begriffe

- `proxy.enabled` / `proxy.proxyUrl` — ausgehendes Forward-Proxy-Routing für den Laufzeitdatenverkehr. Diese Seite.
- `gateway.auth.mode: "trusted-proxy"` — eingehende identitätsbasierte Reverse-Proxy-Authentifizierung für den Gateway-Zugriff. Siehe [Authentifizierung über einen vertrauenswürdigen Proxy](/de/gateway/trusted-proxy-auth).
- `openclaw proxy` — lokaler Debug-Proxy und Erfassungsinspektor für Entwicklung und Support. Siehe [openclaw proxy](/de/cli/proxy).
- `tools.web.fetch.useTrustedEnvProxy` — optionale Aktivierung für `web_fetch`, damit ein vom Betreiber kontrollierter HTTP(S)-Umgebungsproxy DNS auflösen kann, während standardmäßig strikte DNS-Bindung und Hostnamenrichtlinien beibehalten werden. Siehe [Webabruf](/de/tools/web-fetch#trusted-env-proxy).
- Kanal- oder Provider-spezifische Proxy-Einstellungen — eigentümerspezifische Überschreibungen für einen einzelnen Transport. Bevorzugen Sie den verwalteten Netzwerk-Proxy für die zentrale Kontrolle des ausgehenden Datenverkehrs in der gesamten Laufzeit.

## Validieren des Proxys

Die Zielrichtlinie des Proxys ist die tatsächliche Sicherheitsgrenze; OpenClaw kann nicht überprüfen, ob Ihr Proxy die richtigen Ziele blockiert. Konfigurieren Sie ihn so, dass er:

- nur an Loopback oder eine private vertrauenswürdige Schnittstelle gebunden ist, die ausschließlich für den OpenClaw-Prozess/-Host/-Container bzw. das Dienstkonto erreichbar ist.
- Ziele selbst auflöst und sie nach der DNS-Auflösung zum Verbindungszeitpunkt anhand ihrer IP-Adresse blockiert, sowohl für unverschlüsseltes HTTP als auch für HTTPS-`CONNECT`-Tunnel.
- zielbasierte Umgehungen für Loopback-, private, linklokale, Metadaten-, Multicast-, reservierte und Dokumentationsadressbereiche zurückweist.
- Positivlisten für Hostnamen vermeidet, sofern Sie dem DNS-Auflösungspfad nicht vollständig vertrauen.
- Ziel, Entscheidung, Status und Grund protokolliert — niemals Anfragetexte, Autorisierungsheader, Cookies oder andere Geheimnisse.
- die Richtlinie unter Versionskontrolle hält und Änderungen daran als sicherheitskritisch prüft.

Validieren Sie die Konfiguration über denselben Host/Container bzw. dasselbe Dienstkonto, unter dem OpenClaw ausgeführt wird:

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

Bei einem HTTPS-Proxy-Endpunkt mit privater CA:

```bash
openclaw proxy validate --proxy-url https://proxy.corp.example:8443 --proxy-ca-file /etc/openclaw/proxy-ca.pem
```

| Flag                     | Zweck                                                                |
| ------------------------ | -------------------------------------------------------------------- |
| `--proxy-url <url>`      | Diese URL validieren, statt Konfiguration/Umgebung aufzulösen.       |
| `--proxy-ca-file <path>` | CA-Bundle für einen HTTPS-Proxy-Endpunkt.                             |
| `--allowed-url <url>`    | Ziel, das voraussichtlich erreichbar ist (wiederholbar).             |
| `--denied-url <url>`     | Ziel, das voraussichtlich blockiert wird (wiederholbar).              |
| `--apns-reachable`       | Zusätzlich prüfen, ob der Proxy eine direkte APNs-HTTP/2-Sandbox-Prüfung tunneln kann. |
| `--apns-authority <url>` | Die mit `--apns-reachable` geprüfte APNs-Authority überschreiben.     |
| `--timeout-ms <ms>`      | Zeitüberschreitung pro Anfrage.                                      |
| `--json`                 | Maschinenlesbare Ausgabe.                                            |

Wenn `proxy.enabled` nicht `true` ist und kein `--proxy-url` angegeben wird, meldet der Befehl ein Konfigurationsproblem, statt eine Validierung durchzuführen; übergeben Sie `--proxy-url` für eine einmalige Vorabprüfung, bevor Sie die Konfiguration ändern.

Ohne `--allowed-url`/`--denied-url` lauten die Standardprüfungen: `https://example.com/` muss erfolgreich sein, und ein temporärer Loopback-Canary-Server, den der Proxy nicht erreichen darf, muss blockiert werden. Die Loopback-Prüfung ist bei einem Transportfehler oder bei einer Nicht-2xx-Antwort ohne das laufbezogene Token des Canary erfolgreich; sie schlägt bei einer 2xx-Antwort ohne das Token fehl (ein unerwarteter Erfolg durch etwas anderes als den Canary) und insbesondere bei jeder Antwort mit dem passenden Token, da dies beweist, dass der Proxy tatsächlich ein Loopback-Ziel weitergeleitet hat, das er hätte ablehnen müssen. Benutzerdefinierte `--denied-url`-Ziele verfügen über kein solches Canary-Token und sind daher nach dem Fail-Closed-Prinzip ausgelegt: Jede HTTP-Antwort gilt als erreichbar (Fehlschlag), und ein Transportfehler wird als nicht eindeutig statt als nachweislich blockiert gemeldet, weil OpenClaw nicht bestätigen kann, ob Ihr Proxy einen erreichbaren Ursprung abgelehnt hat oder etwas anderes fehlgeschlagen ist. `--apns-reachable` sendet absichtlich ein ungültiges Provider-Token, sodass eine Antwort vom Typ `403 InvalidProviderToken` als Nachweis gilt, dass der Tunnel Apple erreicht hat. Der Befehl wird bei jedem Validierungsfehler mit `1` beendet; Anmeldedaten in der Proxy-URL werden sowohl in der Text- als auch in der JSON-Ausgabe unkenntlich gemacht.

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

Ausgangsbasis für eine Sperrliste für jeden Forward-Proxy, jede Firewall oder jede Egress-Richtlinie. OpenClaws eigener SSRF-Klassifikator befindet sich in `src/infra/net/ssrf.ts` und `packages/net-policy/src/ip.ts` (`BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, das RFC-2544-Benchmark-Präfix und die Behandlung eingebetteter IPv4-Adressen für NAT64-/6to4-/Teredo-/ISATAP-/IPv4-gemappte Formen) — nützliche Referenzen, aber OpenClaw exportiert diese Regeln nicht und erzwingt sie nicht in Ihrem externen Proxy.

| Bereich oder Host                                                                     | Grund für die Blockierung                          |
| ------------------------------------------------------------------------------------ | ------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | IPv4-Loopback                                     |
| `::1/128`                                                                            | IPv6-Loopback                                     |
| `0.0.0.0/8`, `::/128`                                                                | Nicht spezifizierte Adressen / Adressen dieses Netzwerks |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | Private RFC-1918-Netzwerke                        |
| `169.254.0.0/16`, `fe80::/10`                                                        | Linklokal, einschließlich gängiger Cloud-Metadatenpfade |
| `169.254.169.254`, `metadata.google.internal`                                        | Cloud-Metadatendienste                            |
| `100.64.0.0/10`                                                                      | Gemeinsam genutzter Adressraum für Carrier-Grade NAT |
| `198.18.0.0/15`, `2001:2::/48`                                                       | Benchmark-Bereiche                                |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | Sondernutzungs- und Dokumentationsbereiche        |
| `224.0.0.0/4`, `ff00::/8`                                                            | Multicast                                         |
| `240.0.0.0/4`                                                                        | Reserviertes IPv4                                 |
| `fc00::/7`, `fec0::/10`                                                              | Lokale/private IPv6-Bereiche                      |
| `100::/64`, `2001:20::/28`                                                           | IPv6-Verwerfungs- und ORCHIDv2-Bereiche           |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | NAT64-Präfixe mit eingebettetem IPv4              |
| `2002::/16`, `2001::/32`                                                             | 6to4 und Teredo mit eingebettetem IPv4            |
| `::/96`, `::ffff:0:0/96`                                                             | IPv4-kompatibles und IPv4-gemapptes IPv6          |

Fügen Sie alle zusätzlichen Metadaten-Hosts oder reservierten Bereiche hinzu, die Ihr Cloud-Provider oder Ihre Netzwerkplattform dokumentiert.

## Einschränkungen

| Oberfläche                                                   | Status des verwalteten Proxys                                                                                                                            |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fetch`, `node:http`, `node:https`, gängige WebSocket-Clients | Werden bei entsprechender Konfiguration über verwaltete Proxy-Hooks geleitet.                                                                            |
| Direktes APNs-HTTP/2                                         | Wird über den verwalteten APNs-`CONNECT`-Helper geleitet.                                                                                                 |
| Loopback der Gateway-Steuerungsebene                          | Nur für die exakt konfigurierte lokale Loopback-Gateway-URL direkt.                                                                                      |
| Upstream-Weiterleitung des Debug-Proxys                       | Deaktiviert, solange der verwaltete Proxy-Modus aktiv ist, sofern sie nicht ausdrücklich für lokale Diagnosen aktiviert wurde.                           |
| IRC                                                          | Unverarbeitetes TCP/TLS; wird vom verwalteten HTTP-Proxy-Modus nicht weitergeleitet. Setzen Sie `channels.irc.enabled: false`, wenn Ihre Bereitstellung den gesamten ausgehenden Datenverkehr durch den Forward-Proxy leiten muss. |
| Andere unverarbeitete `net`-, `tls`- oder `http2`-Clientaufrufe | Müssen vor dem Einbringen durch den Schutzmechanismus für unverarbeitete Sockets klassifiziert werden.                                                    |

- Dies ist eine Abdeckung auf Prozessebene für JavaScript-HTTP-/WebSocket-Clients, keine Netzwerksandbox auf Betriebssystemebene.
- Unverarbeitete `net`-, `tls`- und `http2`-Sockets, native Add-ons und untergeordnete Prozesse außerhalb von OpenClaw können das Node-Routing umgehen, sofern sie nicht Proxy-Umgebungsvariablen übernehmen und berücksichtigen. Abgezweigte untergeordnete OpenClaw-CLI-Prozesse übernehmen die verwaltete Proxy-URL und den Zustand von `proxy.loopbackMode`.
- Lokale WebUIs von Benutzern und lokale Modellserver werden nicht durch eine allgemeine Umgehung des lokalen Netzwerks abgedeckt — nehmen Sie sie bei Bedarf in die Zulassungsliste der Proxy-Richtlinie des Betreibers auf. Eine Ausnahme bildet der geschützte direkte Pfad des gebündelten Ollama-Providers für Memory-Embeddings, der auf den exakten hostlokalen Loopback-Ursprung aus seiner konfigurierten `baseUrl` beschränkt ist; Ollama-Hosts im LAN, Tailnet, privaten Netzwerk und öffentlichen Netzwerk verwenden weiterhin den verwalteten Proxy.
- Die direkte Upstream-Weiterleitung des lokalen Debug-Proxys (für Proxy-Anfragen und `CONNECT`-Tunnel) ist standardmäßig deaktiviert, solange der verwaltete Proxy-Modus aktiv ist; aktivieren Sie sie nur für genehmigte lokale Diagnosen.
- OpenClaw untersucht, testet oder zertifiziert Ihre Proxy-Richtlinie nicht. Behandeln Sie Änderungen an der Proxy-Richtlinie als sicherheitskritische betriebliche Änderungen.
