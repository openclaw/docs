---
read_when:
    - Das Gateway über die CLI ausführen (Entwicklung oder Server)
    - Debuggen von Gateway-Authentifizierung, Bind-Modi und Konnektivität
    - Gateways über Bonjour erkennen (lokales und Wide-Area-DNS-SD)
summary: OpenClaw Gateway-CLI (`openclaw gateway`) — Gateways ausführen, abfragen und erkennen
title: Gateway
x-i18n:
    generated_at: "2026-04-23T06:26:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60706df4d3c49271c4b53029eaae16672dde534c7f6f4ce68e04b58fb0cfa467
    source_path: cli/gateway.md
    workflow: 15
---

# Gateway-CLI

Das Gateway ist der WebSocket-Server von OpenClaw (Kanäle, Nodes, Sessions, Hooks).

Unterbefehle auf dieser Seite befinden sich unter `openclaw gateway …`.

Verwandte Dokumentation:

- [/gateway/bonjour](/de/gateway/bonjour)
- [/gateway/discovery](/de/gateway/discovery)
- [/gateway/configuration](/de/gateway/configuration)

## Das Gateway ausführen

Einen lokalen Gateway-Prozess ausführen:

```bash
openclaw gateway
```

Alias für den Vordergrundbetrieb:

```bash
openclaw gateway run
```

Hinweise:

- Standardmäßig verweigert das Gateway den Start, sofern `gateway.mode=local` nicht in `~/.openclaw/openclaw.json` gesetzt ist. Verwenden Sie `--allow-unconfigured` für Ad-hoc-/Entwicklungs-Ausführungen.
- Es wird erwartet, dass `openclaw onboard --mode local` und `openclaw setup` `gateway.mode=local` schreiben. Wenn die Datei existiert, aber `gateway.mode` fehlt, behandeln Sie das als beschädigte oder überschriebenen Konfiguration und reparieren Sie sie, statt implizit vom lokalen Modus auszugehen.
- Wenn die Datei existiert und `gateway.mode` fehlt, behandelt das Gateway dies als verdächtige Konfigurationsbeschädigung und verweigert es, für Sie „lokal zu erraten“.
- Binden außerhalb von loopback ohne Authentifizierung wird blockiert (Sicherheitsleitplanke).
- `SIGUSR1` löst einen prozessinternen Neustart aus, wenn autorisiert (`commands.restart` ist standardmäßig aktiviert; setzen Sie `commands.restart: false`, um den manuellen Neustart zu blockieren, während Gateway-Tool-/Konfigurationsanwendung/-aktualisierung weiterhin erlaubt bleiben).
- `SIGINT`-/`SIGTERM`-Handler stoppen den Gateway-Prozess, stellen jedoch keinen benutzerdefinierten Terminalzustand wieder her. Wenn Sie die CLI mit einer TUI oder Eingabe im Raw-Mode umschließen, stellen Sie das Terminal vor dem Beenden wieder her.

### Optionen

- `--port <port>`: WebSocket-Port (Standard kommt aus Konfiguration/Umgebung; normalerweise `18789`).
- `--bind <loopback|lan|tailnet|auto|custom>`: Bind-Modus des Listeners.
- `--auth <token|password>`: Überschreibung des Authentifizierungsmodus.
- `--token <token>`: Token-Überschreibung (setzt auch `OPENCLAW_GATEWAY_TOKEN` für den Prozess).
- `--password <password>`: Passwort-Überschreibung. Warnung: Inline-Passwörter können in lokalen Prozesslisten sichtbar sein.
- `--password-file <path>`: Gateway-Passwort aus einer Datei lesen.
- `--tailscale <off|serve|funnel>`: Das Gateway über Tailscale verfügbar machen.
- `--tailscale-reset-on-exit`: Tailscale-Serve-/Funnel-Konfiguration beim Herunterfahren zurücksetzen.
- `--allow-unconfigured`: Gateway-Start ohne `gateway.mode=local` in der Konfiguration erlauben. Dies umgeht die Startleitplanke nur für Ad-hoc-/Entwicklungs-Bootstrap und schreibt oder repariert die Konfigurationsdatei nicht.
- `--dev`: eine Entwicklungs-Konfiguration + Workspace erstellen, falls fehlend (überspringt `BOOTSTRAP.md`).
- `--reset`: Entwicklungs-Konfiguration + Anmeldedaten + Sessions + Workspace zurücksetzen (erfordert `--dev`).
- `--force`: vorhandenen Listener auf dem ausgewählten Port vor dem Start beenden.
- `--verbose`: ausführliche Logs.
- `--cli-backend-logs`: nur CLI-Backend-Logs in der Konsole anzeigen (und stdout/stderr aktivieren).
- `--ws-log <auto|full|compact>`: Stil des WebSocket-Logs (Standard `auto`).
- `--compact`: Alias für `--ws-log compact`.
- `--raw-stream`: rohe Modell-Stream-Ereignisse in jsonl protokollieren.
- `--raw-stream-path <path>`: Pfad für rohe Stream-jsonl.

Start-Profiling:

- Setzen Sie `OPENCLAW_GATEWAY_STARTUP_TRACE=1`, um Phasen-Timings während des Gateway-Starts zu protokollieren.
- Führen Sie `pnpm test:startup:gateway -- --runs 5 --warmup 1` aus, um den Gateway-Start zu benchmarken. Das Benchmark zeichnet die erste Prozessausgabe, `/healthz`, `/readyz` und Startup-Trace-Timings auf.

## Ein laufendes Gateway abfragen

Alle Abfragebefehle verwenden WebSocket-RPC.

Ausgabemodi:

- Standard: menschenlesbar (mit Farben in TTY).
- `--json`: maschinenlesbares JSON (ohne Styling/Spinner).
- `--no-color` (oder `NO_COLOR=1`): ANSI deaktivieren, menschenlesbares Layout aber beibehalten.

Gemeinsame Optionen (wo unterstützt):

- `--url <url>`: Gateway-WebSocket-URL.
- `--token <token>`: Gateway-Token.
- `--password <password>`: Gateway-Passwort.
- `--timeout <ms>`: Timeout/Budget (variiert je nach Befehl).
- `--expect-final`: auf eine „final“-Antwort warten (Agent-Aufrufe).

Hinweis: Wenn Sie `--url` setzen, greift die CLI nicht auf Konfigurations- oder Umgebungs-Anmeldedaten zurück.
Übergeben Sie `--token` oder `--password` explizit. Fehlende explizite Anmeldedaten sind ein Fehler.

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

Der HTTP-Endpunkt `/healthz` ist ein Liveness-Probe: Er antwortet, sobald der Server HTTP beantworten kann. Der HTTP-Endpunkt `/readyz` ist strenger und bleibt rot, während Startup-Sidecars, Kanäle oder konfigurierte Hooks noch hochfahren.

### `gateway usage-cost`

Nutzungskosten-Zusammenfassungen aus Session-Logs abrufen.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

Optionen:

- `--days <days>`: Anzahl der einzubeziehenden Tage (Standard `30`).

### `gateway stability`

Den aktuellen Diagnose-Stabilitätsrekorder von einem laufenden Gateway abrufen.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

Optionen:

- `--limit <limit>`: maximale Anzahl aktueller Ereignisse, die einbezogen werden sollen (Standard `25`, Maximum `1000`).
- `--type <type>`: nach Diagnoseereignistyp filtern, z. B. `payload.large` oder `diagnostic.memory.pressure`.
- `--since-seq <seq>`: nur Ereignisse nach einer Diagnose-Sequenznummer einbeziehen.
- `--bundle [path]`: ein persistiertes Stabilitäts-Bundle lesen, statt das laufende Gateway aufzurufen. Verwenden Sie `--bundle latest` (oder einfach `--bundle`) für das neueste Bundle unter dem Statusverzeichnis, oder übergeben Sie direkt einen Bundle-JSON-Pfad.
- `--export`: ein teilbares ZIP mit Support-Diagnosen schreiben, statt Stabilitätsdetails auszugeben.
- `--output <path>`: Ausgabepfad für `--export`.

Hinweise:

- Der Rekorder ist standardmäßig aktiv. Setzen Sie `diagnostics.enabled: false` nur dann, wenn Sie die Gateway-Diagnose-Heartbeat-Erfassung deaktivieren müssen.
- Aufzeichnungen behalten betriebliche Metadaten: Ereignisnamen, Anzahlen, Byte-Größen, Speicherwerte, Queue-/Session-Status, Kanal-/Plugin-Namen und redigierte Session-Zusammenfassungen. Sie enthalten keinen Chat-Text, keine Webhook-Bodys, keine Tool-Ausgaben, keine rohen Anfrage- oder Antwort-Bodys, keine Tokens, keine Cookies, keine Secret-Werte, keine Hostnamen und keine rohen Session-IDs.
- Bei fatalen Gateway-Abbrüchen, Shutdown-Timeouts und Neustart-Startfehlern schreibt OpenClaw denselben Diagnose-Schnappschuss nach `~/.openclaw/logs/stability/openclaw-stability-*.json`, wenn der Rekorder Ereignisse hat. Prüfen Sie das neueste Bundle mit `openclaw gateway stability --bundle latest`; `--limit`, `--type` und `--since-seq` gelten auch für die Bundle-Ausgabe.

### `gateway diagnostics export`

Ein lokales Diagnose-ZIP schreiben, das zum Anhängen an Fehlerberichte gedacht ist.

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

Optionen:

- `--output <path>`: Ausgabepfad des ZIP. Standardmäßig ein Support-Export unter dem Statusverzeichnis.
- `--log-lines <count>`: maximale Anzahl bereinigter Log-Zeilen, die einbezogen werden sollen (Standard `5000`).
- `--log-bytes <bytes>`: maximale Anzahl zu prüfender Log-Bytes (Standard `1000000`).
- `--url <url>`: Gateway-WebSocket-URL für den Health-Schnappschuss.
- `--token <token>`: Gateway-Token für den Health-Schnappschuss.
- `--password <password>`: Gateway-Passwort für den Health-Schnappschuss.
- `--timeout <ms>`: Timeout für Status-/Health-Schnappschuss (Standard `3000`).
- `--no-stability-bundle`: Suche nach persistiertem Stabilitäts-Bundle überspringen.
- `--json`: den geschriebenen Pfad, die Größe und das Manifest als JSON ausgeben.

Der Export enthält ein Manifest, eine Markdown-Zusammenfassung, die Form der Konfiguration, bereinigte Konfigurationsdetails, bereinigte Log-Zusammenfassungen, bereinigte Gateway-Status-/Health-Schnappschüsse und das neueste Stabilitäts-Bundle, falls eines existiert.

Er ist zum Teilen gedacht. Er behält betriebliche Details, die beim Debuggen helfen, etwa sichere OpenClaw-Log-Felder, Subsystemnamen, Statuscodes, Dauern, konfigurierte Modi, Ports, Plugin-IDs, Provider-IDs, nicht geheime Feature-Einstellungen und redigierte betriebliche Log-Meldungen. Er lässt Chat-Text, Webhook-Bodys, Tool-Ausgaben, Anmeldedaten, Cookies, Konto-/Nachrichtenkennungen, Prompt-/Anweisungstext, Hostnamen und Secret-Werte weg oder redigiert sie. Wenn eine Nachricht im LogTape-Stil wie Benutzer-/Chat-/Tool-Payload-Text aussieht, behält der Export nur bei, dass eine Nachricht ausgelassen wurde, plus deren Byte-Anzahl.

### `gateway status`

`gateway status` zeigt den Gateway-Dienst (launchd/systemd/schtasks) plus optional eine Prüfung von Konnektivität/Auth-Fähigkeit.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

Optionen:

- `--url <url>`: ein explizites Probe-Ziel hinzufügen. Konfiguriertes Remote + localhost werden weiterhin geprüft.
- `--token <token>`: Token-Authentifizierung für die Probe.
- `--password <password>`: Passwort-Authentifizierung für die Probe.
- `--timeout <ms>`: Probe-Timeout (Standard `10000`).
- `--no-probe`: Konnektivitätsprüfung überspringen (nur Dienstansicht).
- `--deep`: auch Dienste auf Systemebene scannen.
- `--require-rpc`: die Standard-Konnektivitätsprüfung auf eine Leseprüfung hochstufen und mit einem Nicht-Null-Code beenden, wenn diese Leseprüfung fehlschlägt. Kann nicht mit `--no-probe` kombiniert werden.

Hinweise:

- `gateway status` bleibt für Diagnosen verfügbar, auch wenn die lokale CLI-Konfiguration fehlt oder ungültig ist.
- Standardmäßiges `gateway status` weist Dienststatus, WebSocket-Verbindung und die beim Handshake sichtbare Authentifizierungsfähigkeit nach. Es weist keine Lese-/Schreib-/Admin-Operationen nach.
- `gateway status` löst konfigurierte Auth-SecretRefs für die Probe-Authentifizierung auf, wenn möglich.
- Wenn ein erforderlicher Auth-SecretRef in diesem Befehlspfad nicht aufgelöst ist, meldet `gateway status --json` `rpc.authWarning`, wenn Probe-Konnektivität/Auth fehlschlägt; übergeben Sie `--token`/`--password` explizit oder lösen Sie die Secret-Quelle zuerst auf.
- Wenn die Probe erfolgreich ist, werden Warnungen zu nicht aufgelösten Auth-Referenzen unterdrückt, um Fehlalarme zu vermeiden.
- Verwenden Sie `--require-rpc` in Skripten und Automatisierungen, wenn ein lauschender Dienst nicht ausreicht und auch Lese-Scope-RPC-Aufrufe funktionsfähig sein müssen.
- `--deep` fügt eine Best-Effort-Suche nach zusätzlichen launchd-/systemd-/schtasks-Installationen hinzu. Wenn mehrere gatewayähnliche Dienste erkannt werden, gibt die menschenlesbare Ausgabe Hinweise zur Bereinigung aus und warnt davor, dass die meisten Setups ein Gateway pro Rechner ausführen sollten.
- Die menschenlesbare Ausgabe enthält den aufgelösten Dateilog-Pfad sowie den Schnappschuss von CLI- vs.-Dienst-Konfigurationspfaden/-Gültigkeit, um Profil- oder Statusverzeichnis-Drift zu diagnostizieren.
- Bei Linux-systemd-Installationen lesen Prüfungen auf Auth-Drift sowohl `Environment=`- als auch `EnvironmentFile=`-Werte aus der Unit (einschließlich `%h`, in Anführungszeichen gesetzter Pfade, mehrerer Dateien und optionaler `-`-Dateien).
- Drift-Prüfungen lösen `gateway.auth.token`-SecretRefs mithilfe der zusammengeführten Laufzeitumgebung auf (zuerst Service-Befehlsumgebung, dann Fallback auf Prozessumgebung).
- Wenn Token-Authentifizierung effektiv nicht aktiv ist (explizites `gateway.auth.mode` von `password`/`none`/`trusted-proxy` oder nicht gesetzter Modus, bei dem Passwort gewinnen kann und kein Token-Kandidat gewinnen kann), überspringen Token-Drift-Prüfungen die Auflösung des Konfigurations-Tokens.

### `gateway probe`

`gateway probe` ist der Befehl zum „Alles debuggen“. Er prüft immer:

- Ihr konfiguriertes Remote-Gateway (falls gesetzt), und
- localhost (local loopback) **selbst dann, wenn Remote konfiguriert ist**.

Wenn Sie `--url` übergeben, wird dieses explizite Ziel vor beiden hinzugefügt. Die menschenlesbare Ausgabe beschriftet die
Ziele wie folgt:

- `URL (explicit)`
- `Remote (configured)` oder `Remote (configured, inactive)`
- `Local loopback`

Wenn mehrere Gateways erreichbar sind, werden sie alle ausgegeben. Mehrere Gateways werden unterstützt, wenn Sie isolierte Profile/Ports verwenden (z. B. einen Rescue-Bot), aber die meisten Installationen führen weiterhin nur ein Gateway aus.

```bash
openclaw gateway probe
openclaw gateway probe --json
```

Interpretation:

- `Reachable: yes` bedeutet, dass mindestens ein Ziel eine WebSocket-Verbindung akzeptiert hat.
- `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` meldet, was die Probe in Bezug auf Authentifizierung nachweisen konnte. Dies ist von der Erreichbarkeit getrennt.
- `Read probe: ok` bedeutet, dass auch RPC-Aufrufe mit Lese-Scope (`health`/`status`/`system-presence`/`config.get`) erfolgreich waren.
- `Read probe: limited - missing scope: operator.read` bedeutet, dass die Verbindung erfolgreich war, RPC mit Lese-Scope jedoch eingeschränkt ist. Dies wird als **beeinträchtigte** Erreichbarkeit gemeldet, nicht als vollständiger Fehler.
- Der Exit-Code ist nur dann ungleich null, wenn keines der geprüften Ziele erreichbar ist.

JSON-Hinweise (`--json`):

- Oberste Ebene:
  - `ok`: mindestens ein Ziel ist erreichbar.
  - `degraded`: mindestens ein Ziel hatte scope-begrenztes Detail-RPC.
  - `capability`: beste über erreichbare Ziele hinweg erkannte Fähigkeit (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` oder `unknown`).
  - `primaryTargetId`: bestes Ziel, das in dieser Reihenfolge als aktiver Gewinner behandelt wird: explizite URL, SSH-Tunnel, konfiguriertes Remote, dann local loopback.
  - `warnings[]`: Best-Effort-Warnungseinträge mit `code`, `message` und optional `targetIds`.
  - `network`: URL-Hinweise für local loopback/Tailnet, abgeleitet aus aktueller Konfiguration und Host-Netzwerk.
  - `discovery.timeoutMs` und `discovery.count`: das tatsächlich für diesen Probe-Durchlauf verwendete Discovery-Budget/Ergebnisanzahl.
- Pro Ziel (`targets[].connect`):
  - `ok`: Erreichbarkeit nach Verbindungsaufbau + degraded-Klassifizierung.
  - `rpcOk`: vollständiger Erfolg des Detail-RPC.
  - `scopeLimited`: Detail-RPC ist wegen fehlendem Operator-Scope fehlgeschlagen.
- Pro Ziel (`targets[].auth`):
  - `role`: in `hello-ok` gemeldete Auth-Rolle, wenn verfügbar.
  - `scopes`: in `hello-ok` gemeldete gewährte Scopes, wenn verfügbar.
  - `capability`: die für dieses Ziel angezeigte Klassifizierung der Auth-Fähigkeit.

Häufige Warncodes:

- `ssh_tunnel_failed`: Einrichtung des SSH-Tunnels fehlgeschlagen; der Befehl ist auf direkte Probes zurückgefallen.
- `multiple_gateways`: mehr als ein Ziel war erreichbar; das ist ungewöhnlich, außer Sie betreiben absichtlich isolierte Profile, etwa einen Rescue-Bot.
- `auth_secretref_unresolved`: ein konfigurierter Auth-SecretRef konnte für ein fehlgeschlagenes Ziel nicht aufgelöst werden.
- `probe_scope_limited`: WebSocket-Verbindung war erfolgreich, aber die Lese-Probe war durch fehlendes `operator.read` eingeschränkt.

#### Remote über SSH (Parität zur Mac-App)

Der Modus „Remote über SSH“ der macOS-App verwendet eine lokale Port-Weiterleitung, sodass das Remote-Gateway (das möglicherweise nur an loopback gebunden ist) unter `ws://127.0.0.1:<port>` erreichbar wird.

CLI-Äquivalent:

```bash
openclaw gateway probe --ssh user@gateway-host
```

Optionen:

- `--ssh <target>`: `user@host` oder `user@host:port` (Port ist standardmäßig `22`).
- `--ssh-identity <path>`: Identitätsdatei.
- `--ssh-auto`: den ersten erkannten Gateway-Host als SSH-Ziel aus dem aufgelösten
  Discovery-Endpunkt auswählen (`local.` plus die konfigurierte Wide-Area-Domain, falls vorhanden). Reine TXT-Hinweise werden ignoriert.

Konfiguration (optional, wird als Standard verwendet):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

Low-Level-RPC-Helfer.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

Optionen:

- `--params <json>`: JSON-Objektzeichenfolge für Parameter (Standard `{}`)
- `--url <url>`
- `--token <token>`
- `--password <password>`
- `--timeout <ms>`
- `--expect-final`
- `--json`

Hinweise:

- `--params` muss gültiges JSON sein.
- `--expect-final` ist hauptsächlich für Agent-artige RPCs gedacht, die Zwischenereignisse vor einer finalen Payload streamen.

## Den Gateway-Dienst verwalten

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

Befehlsoptionen:

- `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `gateway uninstall|start|stop|restart`: `--json`

Hinweise:

- `gateway install` unterstützt `--port`, `--runtime`, `--token`, `--force`, `--json`.
- Wenn Token-Authentifizierung ein Token erfordert und `gateway.auth.token` über SecretRef verwaltet wird, validiert `gateway install`, dass der SecretRef auflösbar ist, speichert das aufgelöste Token aber nicht in den Umgebungsmetadaten des Dienstes.
- Wenn Token-Authentifizierung ein Token erfordert und der konfigurierte Token-SecretRef nicht aufgelöst ist, schlägt die Installation fail-closed fehl, anstatt Fallback-Klartext zu speichern.
- Für Passwort-Authentifizierung bei `gateway run` bevorzugen Sie `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` oder ein SecretRef-gestütztes `gateway.auth.password` statt Inline-`--password`.
- Im abgeleiteten Auth-Modus lockert ein reines Shell-`OPENCLAW_GATEWAY_PASSWORD` die Token-Anforderungen bei der Installation nicht; verwenden Sie dauerhafte Konfiguration (`gateway.auth.password` oder Konfig-`env`), wenn Sie einen verwalteten Dienst installieren.
- Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, wird die Installation blockiert, bis der Modus explizit gesetzt wird.
- Lifecycle-Befehle akzeptieren `--json` für Skripting.

## Gateways erkennen (Bonjour)

`gateway discover` sucht nach Gateway-Beacons (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area-Bonjour): eine Domain wählen (Beispiel: `openclaw.internal.`) und Split-DNS + einen DNS-Server einrichten; siehe [/gateway/bonjour](/de/gateway/bonjour)

Nur Gateways mit aktivierter Bonjour-Erkennung (Standard) senden den Beacon.

Wide-Area-Discovery-Einträge enthalten (TXT):

- `role` (Hinweis auf die Gateway-Rolle)
- `transport` (Transporthinweis, z. B. `gateway`)
- `gatewayPort` (WebSocket-Port, normalerweise `18789`)
- `sshPort` (optional; Clients setzen SSH-Ziele standardmäßig auf `22`, wenn er fehlt)
- `tailnetDns` (MagicDNS-Hostname, wenn verfügbar)
- `gatewayTls` / `gatewayTlsSha256` (TLS aktiviert + Zertifikats-Fingerprint)
- `cliPath` (Hinweis für Remote-Installation, in die Wide-Area-Zone geschrieben)

### `gateway discover`

```bash
openclaw gateway discover
```

Optionen:

- `--timeout <ms>`: Timeout pro Befehl (browse/resolve); Standard `2000`.
- `--json`: maschinenlesbare Ausgabe (deaktiviert auch Styling/Spinner).

Beispiele:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

Hinweise:

- Die CLI durchsucht `local.` sowie die konfigurierte Wide-Area-Domain, wenn eine aktiviert ist.
- `wsUrl` in der JSON-Ausgabe wird aus dem aufgelösten Service-Endpunkt abgeleitet, nicht aus reinen TXT-Hinweisen
  wie `lanHost` oder `tailnetDns`.
- Bei `local.`-mDNS werden `sshPort` und `cliPath` nur übertragen, wenn
  `discovery.mdns.mode` auf `full` gesetzt ist. Wide-Area-DNS-SD schreibt weiterhin `cliPath`; `sshPort`
  bleibt dort ebenfalls optional.
