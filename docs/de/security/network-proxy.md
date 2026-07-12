---
read_when:
    - Sie möchten mehrschichtigen Schutz vor SSRF- und DNS-Rebinding-Angriffen.
    - Konfigurieren eines externen Forward-Proxys für den OpenClaw-Laufzeitdatenverkehr
summary: So leiten Sie den HTTP- und WebSocket-Datenverkehr der OpenClaw-Laufzeit über einen vom Betreiber verwalteten Filter-Proxy weiter
title: Netzwerk-Proxy
x-i18n:
    generated_at: "2026-07-12T02:10:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fd82684a17a79242891eca69c549c0bfcdd5bde40fa4e791dda7f2b62c473c89
    source_path: security/network-proxy.md
    workflow: 16
---

OpenClaw kann HTTP- und WebSocket-Datenverkehr zur Laufzeit über einen vom Betreiber verwalteten Forward-Proxy leiten. Dies ist eine optionale mehrschichtige Schutzmaßnahme: zentrale Kontrolle ausgehender Verbindungen, stärkerer SSRF-Schutz und Nachvollziehbarkeit der Ziele an der Netzwerkgrenze. Da der Proxy das Ziel beim Verbindungsaufbau prüft, also nach der DNS-Auflösung und unmittelbar bevor er die Upstream-Verbindung öffnet, verkleinert er außerdem das Zeitfenster, das ein DNS-Rebinding-Angriff zwischen einer früheren DNS-Prüfung auf Anwendungsebene und der tatsächlichen ausgehenden Verbindung ausnutzt. Eine zentrale Proxy-Richtlinie bietet Betreibern zudem eine einzige Stelle, an der sie Zielregeln, Netzwerksegmentierung, Ratenbegrenzungen oder Positivlisten für ausgehende Verbindungen durchsetzen können, ohne OpenClaw neu erstellen zu müssen.

OpenClaw liefert keinen Proxy mit, lädt keinen herunter, startet oder konfiguriert keinen und zertifiziert keine Proxy-Lösung. Sie betreiben die für Ihre Umgebung geeignete Proxy-Technologie; OpenClaw leitet seine eigenen HTTP- und WebSocket-Clients darüber.

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

`proxy.proxyUrl` hat Vorrang vor `OPENCLAW_PROXY_URL`. Wenn `proxy.enabled` auf `true` gesetzt ist, aber keine gültige URL ermittelt werden kann, schlagen geschützte Befehle beim Start fehl, statt auf direkten Netzwerkzugriff zurückzufallen.

| Schlüssel              | Typ                                  | Standardwert   | Hinweise                                                                                                                                                                                |
| ---------------------- | ------------------------------------ | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `proxy.enabled`        | boolescher Wert                      | nicht gesetzt  | Muss auf `true` gesetzt sein, um die Weiterleitung zu aktivieren.                                                                                                                       |
| `proxy.proxyUrl`       | Zeichenfolge                         | nicht gesetzt  | Forward-Proxy-URL mit `http://` oder `https://`. In der URL eingebettete Anmeldedaten werden als vertraulich behandelt und in Snapshots sowie Protokollen unkenntlich gemacht.           |
| `proxy.tls.caFile`     | Zeichenfolge                         | nicht gesetzt  | CA-Bundle zur Überprüfung eines mit einer privaten CA signierten `https://`-Proxy-Endpunkts.                                                                                            |
| `proxy.loopbackMode`   | `gateway-only` \| `proxy` \| `block` | `gateway-only` | Steuert das Umgehungsverhalten für local loopback; siehe unten.                                                                                                                         |

Speichern Sie bei verwalteten Gateway-Diensten die URL in der Konfiguration, damit sie eine Neuinstallation übersteht, statt sich auf die Umgebung eines Vordergrundprozesses zu verlassen:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

Die Umgebungsfallback-Variable `OPENCLAW_PROXY_URL` eignet sich am besten für Ausführungen im Vordergrund. Um sie mit einem installierten Dienst zu verwenden, legen Sie sie in der dauerhaften Umgebung des Dienstes ab (`$OPENCLAW_STATE_DIR/.env`, standardmäßig `~/.openclaw/.env`) und installieren Sie anschließend neu, damit launchd/systemd/Geplante Aufgaben sie übernimmt.

### HTTPS-Proxy-Endpunkt mit privater CA

```yaml
proxy:
  enabled: true
  proxyUrl: https://proxy.corp.example:8443
  tls:
    caFile: /etc/openclaw/proxy-ca.pem
```

`proxy.tls.caFile` überprüft das TLS-Zertifikat des Proxy-Endpunkts selbst. Es handelt sich weder um eine Vertrauenseinstellung für einen Man-in-the-Middle-Angriff auf das Ziel noch um ein Clientzertifikat oder einen Ersatz für die Zielrichtlinie des Proxys. Verwenden Sie stattdessen `NODE_EXTRA_CA_CERTS` nur, wenn der gesamte Node-Prozess bereits beim Start einer zusätzlichen CA vertrauen muss, etwa wenn ein unternehmensweites TLS-Inspektionssystem jedes HTTPS-Zielzertifikat neu signiert. Diese Variable gilt prozessweit und muss vor dem Start von Node gesetzt werden, sodass OpenClaw sie nicht wie `proxy.tls.caFile` während der Ausführung anwenden kann. Bevorzugen Sie `proxy.tls.caFile`, um einem HTTPS-Proxy-Endpunkt zu vertrauen: Diese Einstellung ist auf die verwaltete Proxy-Weiterleitung beschränkt und gilt nicht für den gesamten Prozess.

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl https://proxy.corp.example:8443
openclaw config set proxy.tls.caFile /etc/openclaw/proxy-ca.pem
openclaw gateway run
```

## Funktionsweise der Weiterleitung

Mit `proxy.enabled: true` und einer gültigen URL leiten geschützte Laufzeitprozesse (`openclaw gateway run`, `openclaw node run`, `openclaw agent --local`) normalen ausgehenden HTTP- und WebSocket-Datenverkehr über den Proxy:

```text
OpenClaw-Prozess
  fetch-, node:http-, node:https- und WebSocket-Clients  -> Betreiber-Proxy -> Ziel
```

Intern installiert OpenClaw [Proxyline](https://github.com/openclaw/proxyline) als prozessweite Laufzeitkomponente für die Weiterleitung. Sie deckt `fetch`, auf undici basierende Clients, `node:http`/`node:https`, gängige WebSocket-Clients und von Hilfsfunktionen erstellte `CONNECT`-Tunnel ab. Außerdem ersetzt sie von Aufrufern bereitgestellte Node-HTTP-Agents, sodass explizite Agents – darunter `axios`, `got`, `node-fetch` und ähnliche auf Node-Agents basierende Clients – den Proxy nicht unbemerkt umgehen können.

Das URL-Schema des Proxys beschreibt die Verbindung von OpenClaw zum Proxy, nicht zum endgültigen Ziel:

- `http://proxy.example:3128` — unverschlüsseltes TCP zum Proxy; OpenClaw sendet HTTP-Proxy-Anfragen, einschließlich `CONNECT` für HTTPS-Ziele.
- `https://proxy.example:8443` — OpenClaw stellt eine TLS-Verbindung zum Proxy selbst her und überprüft dessen Zertifikat; anschließend sendet es innerhalb dieser Sitzung HTTP-Proxy-Anfragen.

Die TLS-Verbindung zum Ziel ist von der TLS-Verbindung zum Proxy-Endpunkt unabhängig: Bei einem HTTPS-Ziel fordert OpenClaw vom Proxy immer einen `CONNECT`-Tunnel an und startet die TLS-Verbindung zum Ziel durch diesen Tunnel.

Während der Proxy aktiv ist, löscht OpenClaw `no_proxy`/`NO_PROXY`. Diese Umgehungslisten basieren auf Zielen; würden `localhost` oder `127.0.0.1` darin verbleiben, könnten SSRF-Ziele den Proxy vollständig umgehen. Beim Herunterfahren stellt OpenClaw die vorherige Proxy-Umgebung wieder her und setzt den zwischengespeicherten Weiterleitungsstatus zurück.

Einige Plugins besitzen einen benutzerdefinierten Transport, der selbst bei aktiver prozessweiter Weiterleitung eine eigene Proxy-Anbindung benötigt. Der Bot-API-Client von Telegram verwendet einen eigenen HTTP/1-undici-Dispatcher und berücksichtigt separat die Proxy-Umgebungsvariablen des Prozesses sowie den Fallback `OPENCLAW_PROXY_URL`.

### local loopback-Modus des Gateways

Lokale Clients der Gateway-Steuerungsebene stellen normalerweise eine Verbindung zu einem local loopback-WebSocket wie `ws://127.0.0.1:18789` her. `proxy.loopbackMode` steuert, ob dieser Datenverkehr den verwalteten Proxy umgeht:

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
  loopbackMode: gateway-only # gateway-only, proxy, or block
```

| Modus                    | Verhalten                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gateway-only` (Standardwert) | OpenClaw registriert die aktive local loopback-Adresse des Gateways als Ausnahme für direkte Verbindungen, sodass lokaler Gateway-WebSocket-Datenverkehr ohne den Proxy verbunden wird. Benutzerdefinierte local loopback-Ports funktionieren, da sich die Ausnahme auf die exakt konfigurierte Kombination aus Host und Port bezieht. Das mitgelieferte Browser-Plugin registriert dieselbe Art von Ausnahme für die exakten lokalen URLs der CDP-Bereitschaft und des DevTools-WebSockets von durch OpenClaw gestarteten verwalteten Browsern. Der mitgelieferte Provider für Ollama-Speichereinbettungen besitzt einen enger gefassten, geschützten direkten Pfad für seinen exakt konfigurierten, hostlokalen local loopback-Ursprung für Einbettungen. |
| `proxy`                  | Es werden keine local loopback-Ausnahmen registriert; local loopback-Datenverkehr des Gateways und von Ollama wird über den Proxy geleitet. Ein entfernter Proxy muss den Datenverkehr zum local loopback-Dienst des OpenClaw-Hosts zurückleiten können, beispielsweise über einen erreichbaren Hostnamen, eine IP-Adresse oder einen Tunnel. Ein gewöhnlicher entfernter Proxy löst `127.0.0.1`/`localhost` relativ zu sich selbst auf, nicht relativ zum OpenClaw-Host.                                                                                                                                                                                                                      |
| `block`                  | OpenClaw verweigert local loopback-Verbindungen zur Gateway-Steuerungsebene und geschützte local loopback-Einbettungsverbindungen von Ollama, bevor ein Socket geöffnet wird.                                                                                                                                                                                                                                                                                                                                                                                                                                                   |

Die Umgehung für die Gateway-Steuerungsebene ist auf `localhost` und URLs mit ausdrücklichen local loopback-IP-Adressen beschränkt. Verwenden Sie `ws://127.0.0.1:18789`, `ws://[::1]:18789` oder `ws://localhost:18789`. Andere Hostnamen werden wie gewöhnlicher Datenverkehr weitergeleitet.

### Container

Bei Befehlen der Form `openclaw --container ...` reicht OpenClaw `OPENCLAW_PROXY_URL` an die auf den Container ausgerichtete untergeordnete CLI weiter, sofern die Variable gesetzt ist. Die URL muss aus dem Container heraus erreichbar sein. `127.0.0.1` bezieht sich dort auf den Container selbst, nicht auf den Host. OpenClaw lehnt local loopback-Proxy-URLs für containerbezogene Befehle ab, sofern Sie diese Prüfung nicht ausdrücklich mit `OPENCLAW_CONTAINER_ALLOW_LOOPBACK_PROXY_URL=1` außer Kraft setzen.

## Verwandte Proxy-Begriffe

- `proxy.enabled` / `proxy.proxyUrl` — ausgehende Forward-Proxy-Weiterleitung für Laufzeitdatenverkehr. Diese Seite.
- `gateway.auth.mode: "trusted-proxy"` — eingehende, identitätsbasierte Reverse-Proxy-Authentifizierung für den Gateway-Zugriff. Siehe [Authentifizierung über einen vertrauenswürdigen Proxy](/de/gateway/trusted-proxy-auth).
- `openclaw proxy` — lokaler Debug-Proxy und Inspektor für aufgezeichneten Datenverkehr zur Entwicklung und Unterstützung. Siehe [openclaw proxy](/de/cli/proxy).
- `tools.web.fetch.useTrustedEnvProxy` — optionale Einstellung für `web_fetch`, mit der ein vom Betreiber kontrollierter HTTP(S)-Proxy aus der Umgebung DNS auflösen darf, während standardmäßig strikte DNS-Bindung und Hostnamenrichtlinien beibehalten werden. Siehe [Webabruf](/de/tools/web-fetch#trusted-env-proxy).
- Kanal- oder Provider-spezifische Proxy-Einstellungen — eigentümerspezifische Außerkraftsetzungen für einen einzelnen Transport. Bevorzugen Sie den verwalteten Netzwerk-Proxy für die zentrale Kontrolle ausgehender Verbindungen in der gesamten Laufzeit.

## Validieren des Proxys

Die Zielrichtlinie des Proxys bildet die tatsächliche Sicherheitsgrenze; OpenClaw kann nicht überprüfen, ob Ihr Proxy die richtigen Ziele blockiert. Konfigurieren Sie ihn so, dass er:

- ausschließlich an local loopback oder eine private, vertrauenswürdige Schnittstelle gebunden ist, die nur für den OpenClaw-Prozess, -Host, -Container oder das Dienstkonto erreichbar ist;
- Ziele selbst auflöst und nach der DNS-Auflösung beim Verbindungsaufbau anhand der IP-Adresse blockiert, sowohl für unverschlüsseltes HTTP als auch für HTTPS-`CONNECT`-Tunnel;
- zielbasierte Umgehungen für local loopback-, private, Link-Local-, Metadaten-, Multicast-, reservierte und Dokumentationsadressbereiche ablehnt;
- Positivlisten für Hostnamen vermeidet, sofern Sie dem DNS-Auflösungspfad nicht vollständig vertrauen;
- Ziel, Entscheidung, Status und Grund protokolliert, jedoch niemals Anfragetexte, Autorisierungsheader, Cookies oder andere Geheimnisse;
- die Richtlinie unter Versionskontrolle hält und Änderungen als sicherheitsrelevant prüft.

Validieren Sie vom selben Host, Container oder Dienstkonto aus, unter dem OpenClaw ausgeführt wird:

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

Bei einem HTTPS-Proxy-Endpunkt mit privater CA:

```bash
openclaw proxy validate --proxy-url https://proxy.corp.example:8443 --proxy-ca-file /etc/openclaw/proxy-ca.pem
```

| Flag                     | Zweck                                                                 |
| ------------------------ | --------------------------------------------------------------------- |
| `--proxy-url <url>`      | Diese URL validieren, anstatt Konfiguration/Umgebung aufzulösen.      |
| `--proxy-ca-file <path>` | CA-Bündel für einen HTTPS-Proxy-Endpunkt.                              |
| `--allowed-url <url>`    | Ziel, das erwartungsgemäß erreichbar sein muss (wiederholbar).        |
| `--denied-url <url>`     | Ziel, das erwartungsgemäß blockiert sein muss (wiederholbar).         |
| `--apns-reachable`       | Zusätzlich prüfen, ob der Proxy eine direkte HTTP/2-Testanfrage an die APNs-Sandbox tunneln kann. |
| `--apns-authority <url>` | Die mit `--apns-reachable` geprüfte APNs-Autorität überschreiben.     |
| `--timeout-ms <ms>`      | Zeitüberschreitung pro Anfrage.                                       |
| `--json`                 | Maschinenlesbare Ausgabe.                                             |

Wenn `proxy.enabled` nicht `true` ist und kein `--proxy-url` angegeben wurde, meldet der Befehl ein Konfigurationsproblem, anstatt eine Validierung durchzuführen. Übergeben Sie `--proxy-url` für eine einmalige Vorabprüfung, bevor Sie die Konfiguration ändern.

Ohne `--allowed-url`/`--denied-url` werden standardmäßig folgende Prüfungen durchgeführt: `https://example.com/` muss erreichbar sein, und ein temporärer local-loopback-Canary-Server, den der Proxy nicht erreichen darf, muss blockiert werden. Die local-loopback-Prüfung gilt bei einem Transportfehler oder bei einer Nicht-2xx-Antwort ohne das für den jeweiligen Durchlauf erzeugte Token des Canary-Servers als bestanden. Sie schlägt bei einer 2xx-Antwort ohne das Token fehl, da dies einen unerwarteten Erfolg durch etwas anderes als den Canary-Server darstellt, und insbesondere bei jeder Antwort mit dem passenden Token, da dies beweist, dass der Proxy tatsächlich ein local-loopback-Ziel weitergeleitet hat, das er hätte blockieren müssen. Benutzerdefinierte `--denied-url`-Ziele besitzen kein solches Canary-Token und werden daher nach dem Fail-Closed-Prinzip behandelt: Jede HTTP-Antwort bedeutet, dass das Ziel erreichbar ist (Fehlschlag), während ein Transportfehler als nicht eindeutig und nicht als nachweislich blockiert gemeldet wird, weil OpenClaw nicht bestätigen kann, ob Ihr Proxy einen erreichbaren Ursprung blockiert hat oder ein anderer Fehler aufgetreten ist. `--apns-reachable` sendet absichtlich ein ungültiges Provider-Token, sodass eine Antwort vom Typ `403 InvalidProviderToken` als Nachweis gilt, dass der Tunnel Apple erreicht hat. Bei jedem Validierungsfehler wird der Befehl mit `1` beendet. Zugangsdaten in der Proxy-URL werden sowohl in der Text- als auch in der JSON-Ausgabe unkenntlich gemacht.

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

Manuelle Prüfung mit `curl` (die öffentliche Anfrage sollte erfolgreich sein; die local-loopback- und Metadatenanfragen sollten vom Proxy selbst blockiert werden — `curl` allein kann eine Ablehnung durch den Proxy nicht von einem nicht erreichbaren Ursprung unterscheiden, wie dies der integrierte Canary von `openclaw proxy validate` kann):

```bash
curl -x http://127.0.0.1:3128 https://example.com/
curl -x http://127.0.0.1:3128 http://127.0.0.1/
curl -x http://127.0.0.1:3128 http://169.254.169.254/
```

## Empfohlene blockierte Ziele

Ausgangspunkt für eine Sperrliste für jeden Forward-Proxy, jede Firewall oder jede Richtlinie für ausgehenden Datenverkehr. OpenClaws eigener SSRF-Klassifikator befindet sich in `src/infra/net/ssrf.ts` und `packages/net-policy/src/ip.ts` (`BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, das Benchmark-Präfix gemäß RFC 2544 und die Verarbeitung eingebetteter IPv4-Adressen für NAT64-/6to4-/Teredo-/ISATAP-/IPv4-gemappte Formen) — nützliche Referenzen, jedoch exportiert oder erzwingt OpenClaw diese Regeln nicht in Ihrem externen Proxy.

| Bereich oder Host                                                                    | Grund für die Blockierung                         |
| ------------------------------------------------------------------------------------ | ------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | IPv4-local-loopback                               |
| `::1/128`                                                                            | IPv6-local-loopback                               |
| `0.0.0.0/8`, `::/128`                                                                | Nicht spezifizierte Adressen / Adressen dieses Netzwerks |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | Private Netzwerke gemäß RFC 1918                  |
| `169.254.0.0/16`, `fe80::/10`                                                        | Link-lokale Adressen, einschließlich gängiger Pfade zu Cloud-Metadaten |
| `169.254.169.254`, `metadata.google.internal`                                        | Cloud-Metadatendienste                            |
| `100.64.0.0/10`                                                                      | Gemeinsam genutzter Adressbereich für Carrier-Grade-NAT |
| `198.18.0.0/15`, `2001:2::/48`                                                       | Benchmark-Bereiche                                |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | Bereiche für besondere Zwecke und Dokumentation   |
| `224.0.0.0/4`, `ff00::/8`                                                            | Multicast                                         |
| `240.0.0.0/4`                                                                        | Reservierter IPv4-Bereich                         |
| `fc00::/7`, `fec0::/10`                                                              | Lokale/private IPv6-Bereiche                      |
| `100::/64`, `2001:20::/28`                                                           | IPv6-Verwerfungs- und ORCHIDv2-Bereiche           |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | NAT64-Präfixe mit eingebettetem IPv4              |
| `2002::/16`, `2001::/32`                                                             | 6to4 und Teredo mit eingebettetem IPv4            |
| `::/96`, `::ffff:0:0/96`                                                             | IPv4-kompatibles und IPv4-gemapptes IPv6          |

Fügen Sie alle weiteren Metadaten-Hosts oder reservierten Bereiche hinzu, die Ihr Cloud-Provider oder Ihre Netzwerkplattform dokumentiert.

## Einschränkungen

| Oberfläche                                                   | Status des verwalteten Proxys                                                                                                                              |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fetch`, `node:http`, `node:https`, gängige WebSocket-Clients | Werden bei entsprechender Konfiguration über die Hooks des verwalteten Proxys geleitet.                                                                    |
| Direkte HTTP/2-Verbindungen zu APNs                          | Werden über den verwalteten APNs-`CONNECT`-Helper geleitet.                                                                                                 |
| local-loopback der Gateway-Steuerungsebene                   | Nur für die exakt konfigurierte lokale local-loopback-Gateway-URL direkt.                                                                                   |
| Weiterleitung an den Upstream durch den Debug-Proxy          | Ist bei aktivem verwaltetem Proxy-Modus deaktiviert, sofern sie nicht ausdrücklich für lokale Diagnosen aktiviert wurde.                                    |
| IRC                                                          | Verwendet unproxied TCP/TLS-Rohverbindungen. Legen Sie `channels.irc.enabled: false` fest, wenn Ihre Bereitstellung den gesamten ausgehenden Datenverkehr über den Forward-Proxy leiten muss. |
| Andere Client-Aufrufe über `net`, `tls` oder `http2`         | Müssen vor der Übernahme durch den Schutzmechanismus für Raw-Sockets klassifiziert werden.                                                                  |

- Dies bietet Abdeckung auf Prozessebene für JavaScript-HTTP-/WebSocket-Clients, jedoch keine Netzwerksandbox auf Betriebssystemebene.
- Raw-Sockets über `net`, `tls` und `http2`, native Add-ons sowie untergeordnete Prozesse, die nicht zu OpenClaw gehören, können das Routing auf Node-Ebene umgehen, sofern sie Proxy-Umgebungsvariablen nicht erben und berücksichtigen. Durch Forking gestartete untergeordnete OpenClaw-CLI-Prozesse erben die URL des verwalteten Proxys und den Zustand von `proxy.loopbackMode`.
- Lokale WebUIs der Benutzer und lokale Modellserver werden nicht durch eine allgemeine Umgehung für das lokale Netzwerk abgedeckt — nehmen Sie sie bei Bedarf in die Zulassungsliste der Proxy-Richtlinie des Betreibers auf. Eine Ausnahme ist der geschützte direkte Pfad des gebündelten Ollama-Providers für Speicher-Embeddings, der auf den exakten hostlokalen local-loopback-Ursprung aus dessen konfigurierter `baseUrl` beschränkt ist. Ollama-Hosts im LAN, Tailnet, privaten Netzwerk oder öffentlichen Netzwerk verwenden weiterhin den verwalteten Proxy.
- Die direkte Weiterleitung des lokalen Debug-Proxys an den Upstream ist sowohl für Proxy-Anfragen als auch für `CONNECT`-Tunnel standardmäßig deaktiviert, solange der verwaltete Proxy-Modus aktiv ist. Aktivieren Sie sie ausschließlich für genehmigte lokale Diagnosen.
- OpenClaw überprüft, testet oder zertifiziert Ihre Proxy-Richtlinie nicht. Behandeln Sie Änderungen an der Proxy-Richtlinie als sicherheitskritische betriebliche Änderungen.
