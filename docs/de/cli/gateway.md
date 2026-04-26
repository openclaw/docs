---
read_when:
    - Das Gateway über die CLI ausführen (Entwicklung oder Server)
    - Authentifizierung, Bind-Modi und Konnektivität des Gateway debuggen
    - Gateways über Bonjour erkennen (lokales und Wide-Area-DNS-SD)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — Gateways ausführen, abfragen und erkennen
title: Gateway
x-i18n:
    generated_at: "2026-04-26T11:26:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: c8cdca95676f0b098e2dd79ff4245a32eaae82711ed6c2b7e39522331872cfd9
    source_path: cli/gateway.md
    workflow: 15
---

Das Gateway ist der WebSocket-Server von OpenClaw (Channels, Nodes, Sitzungen, Hooks). Unterbefehle auf dieser Seite liegen unter `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Bonjour-Erkennung" href="/de/gateway/bonjour">
    Lokale mDNS- + Wide-Area-DNS-SD-Einrichtung.
  </Card>
  <Card title="Überblick über Erkennung" href="/de/gateway/discovery">
    Wie OpenClaw Gateways ankündigt und findet.
  </Card>
  <Card title="Konfiguration" href="/de/gateway/configuration">
    Konfigurationsschlüssel des Gateway auf oberster Ebene.
  </Card>
</CardGroup>

## Das Gateway ausführen

Einen lokalen Gateway-Prozess ausführen:

```bash
openclaw gateway
```

Alias im Vordergrund:

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="Startverhalten">
    - Standardmäßig verweigert das Gateway den Start, sofern nicht `gateway.mode=local` in `~/.openclaw/openclaw.json` gesetzt ist. Verwenden Sie `--allow-unconfigured` für Ad-hoc-/Entwicklungsstarts.
    - Es wird erwartet, dass `openclaw onboard --mode local` und `openclaw setup` `gateway.mode=local` schreiben. Wenn die Datei existiert, aber `gateway.mode` fehlt, behandeln Sie das als beschädigte oder überschriebenen Konfiguration und reparieren Sie sie, statt implizit den lokalen Modus anzunehmen.
    - Wenn die Datei existiert und `gateway.mode` fehlt, behandelt das Gateway dies als verdächtigen Konfigurationsschaden und verweigert es, für Sie „lokal zu raten“.
    - Binden außerhalb von Loopback ohne Authentifizierung wird blockiert (Sicherheitsleitplanke).
    - `SIGUSR1` löst einen In-Process-Neustart aus, wenn dies autorisiert ist (`commands.restart` ist standardmäßig aktiviert; setzen Sie `commands.restart: false`, um manuelle Neustarts zu blockieren, während Gateway-Tool-/Konfigurationsanwendung/-aktualisierung weiterhin erlaubt bleiben).
    - `SIGINT`-/`SIGTERM`-Handler stoppen den Gateway-Prozess, stellen aber keinen benutzerdefinierten Terminalzustand wieder her. Wenn Sie die CLI mit einer TUI oder Raw-Mode-Eingabe umschließen, stellen Sie das Terminal vor dem Beenden wieder her.
  </Accordion>
</AccordionGroup>

### Optionen

<ParamField path="--port <port>" type="number">
  WebSocket-Port (Standard stammt aus Konfiguration/env; normalerweise `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  Bind-Modus des Listeners.
</ParamField>
<ParamField path="--auth <token|password>" type="string">
  Überschreibung des Authentifizierungsmodus.
</ParamField>
<ParamField path="--token <token>" type="string">
  Token-Überschreibung (setzt auch `OPENCLAW_GATEWAY_TOKEN` für den Prozess).
</ParamField>
<ParamField path="--password <password>" type="string">
  Passwort-Überschreibung.
</ParamField>
<ParamField path="--password-file <path>" type="string">
  Das Gateway-Passwort aus einer Datei lesen.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Das Gateway über Tailscale bereitstellen.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Tailscale-Serve-/Funnel-Konfiguration beim Herunterfahren zurücksetzen.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Gateway-Start ohne `gateway.mode=local` in der Konfiguration erlauben. Umgeht die Startschutzvorrichtung nur für Ad-hoc-/Entwicklungs-Bootstrap; schreibt oder repariert die Konfigurationsdatei nicht.
</ParamField>
<ParamField path="--dev" type="boolean">
  Eine Entwicklungs-Konfiguration + einen Workspace erstellen, falls nicht vorhanden (überspringt BOOTSTRAP.md).
</ParamField>
<ParamField path="--reset" type="boolean">
  Entwicklungs-Konfiguration + Anmeldedaten + Sitzungen + Workspace zurücksetzen (erfordert `--dev`).
</ParamField>
<ParamField path="--force" type="boolean">
  Jeden vorhandenen Listener auf dem ausgewählten Port vor dem Start beenden.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Ausführliche Logs.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  Nur CLI-Backend-Logs in der Konsole anzeigen (und stdout/stderr aktivieren).
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  Stil des WebSocket-Logs.
</ParamField>
<ParamField path="--compact" type="boolean">
  Alias für `--ws-log compact`.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  Rohe Modell-Stream-Ereignisse in jsonl protokollieren.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Pfad für rohen Stream-jsonl.
</ParamField>

<Warning>
Inline-`--password` kann in lokalen Prozesslisten sichtbar sein. Bevorzugen Sie `--password-file`, env oder ein SecretRef-gestütztes `gateway.auth.password`.
</Warning>

### Start-Profiling

- Setzen Sie `OPENCLAW_GATEWAY_STARTUP_TRACE=1`, um Phasenzeiten während des Gateway-Starts zu protokollieren.
- Führen Sie `pnpm test:startup:gateway -- --runs 5 --warmup 1` aus, um den Gateway-Start zu benchmarken. Der Benchmark zeichnet die erste Prozessausgabe, `/healthz`, `/readyz` und Start-Trace-Zeiten auf.

## Ein laufendes Gateway abfragen

Alle Abfragebefehle verwenden WebSocket-RPC.

<Tabs>
  <Tab title="Ausgabemodi">
    - Standard: menschenlesbar (mit Farben in TTY).
    - `--json`: maschinenlesbares JSON (ohne Styling/Spinner).
    - `--no-color` (oder `NO_COLOR=1`): ANSI deaktivieren, aber menschenlesbares Layout beibehalten.
  </Tab>
  <Tab title="Gemeinsame Optionen">
    - `--url <url>`: Gateway-WebSocket-URL.
    - `--token <token>`: Gateway-Token.
    - `--password <password>`: Gateway-Passwort.
    - `--timeout <ms>`: Timeout/Budget (variiert je nach Befehl).
    - `--expect-final`: auf eine „final“-Antwort warten (Agent-Aufrufe).
  </Tab>
</Tabs>

<Note>
Wenn Sie `--url` setzen, greift die CLI nicht auf Anmeldedaten aus Konfiguration oder Umgebung zurück. Übergeben Sie `--token` oder `--password` explizit. Fehlende explizite Anmeldedaten sind ein Fehler.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

Der HTTP-Endpunkt `/healthz` ist ein Liveness-Probe: Er antwortet, sobald der Server HTTP beantworten kann. Der HTTP-Endpunkt `/readyz` ist strenger und bleibt rot, während Startup-Sidecars, Channels oder konfigurierte Hooks noch hochfahren.

### `gateway usage-cost`

Nutzungs-/Kostenzusammenfassungen aus Sitzungslogs abrufen.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  Anzahl der einzubeziehenden Tage.
</ParamField>

### `gateway stability`

Den aktuellen diagnostischen Stabilitätsrekorder von einem laufenden Gateway abrufen.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  Maximale Anzahl aktueller Ereignisse, die einbezogen werden sollen (max. `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  Nach diagnostischem Ereignistyp filtern, etwa `payload.large` oder `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Nur Ereignisse nach einer diagnostischen Sequenznummer einbeziehen.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Ein persistiertes Stabilitäts-Bundle lesen, statt das laufende Gateway aufzurufen. Verwenden Sie `--bundle latest` (oder einfach `--bundle`) für das neueste Bundle unter dem Statusverzeichnis, oder übergeben Sie direkt einen Bundle-JSON-Pfad.
</ParamField>
<ParamField path="--export" type="boolean">
  Statt Stabilitätsdetails auszugeben, eine teilbare Support-Diagnose-Zip-Datei schreiben.
</ParamField>
<ParamField path="--output <path>" type="string">
  Ausgabepfad für `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Datenschutz und Bundle-Verhalten">
    - Aufzeichnungen behalten Betriebsmetadaten: Ereignisnamen, Zählwerte, Byte-Größen, Speichermesswerte, Queue-/Sitzungszustand, Channel-/Plugin-Namen und redigierte Sitzungszusammenfassungen. Sie enthalten keinen Chat-Text, keine Webhook-Bodies, keine Tool-Ausgaben, keine rohen Anfrage- oder Antwort-Bodies, keine Tokens, keine Cookies, keine Secret-Werte, keine Hostnamen und keine rohen Sitzungs-IDs. Setzen Sie `diagnostics.enabled: false`, um den Rekorder vollständig zu deaktivieren.
    - Bei fatalen Gateway-Beendigungen, Shutdown-Timeouts und Neustart-Startfehlern schreibt OpenClaw denselben Diagnose-Snapshot nach `~/.openclaw/logs/stability/openclaw-stability-*.json`, wenn der Rekorder Ereignisse hat. Prüfen Sie das neueste Bundle mit `openclaw gateway stability --bundle latest`; `--limit`, `--type` und `--since-seq` gelten auch für die Bundle-Ausgabe.
  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Eine lokale Diagnose-Zip-Datei schreiben, die zum Anhängen an Bug-Reports gedacht ist. Zum Datenschutzmodell und Bundle-Inhalt siehe [Diagnostics Export](/de/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Ausgabepfad der Zip-Datei. Standardmäßig ein Support-Export unter dem Statusverzeichnis.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Maximale Anzahl bereinigter Log-Zeilen, die einbezogen werden.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  Maximale Anzahl von Log-Bytes, die geprüft werden.
</ParamField>
<ParamField path="--url <url>" type="string">
  Gateway-WebSocket-URL für den Health-Snapshot.
</ParamField>
<ParamField path="--token <token>" type="string">
  Gateway-Token für den Health-Snapshot.
</ParamField>
<ParamField path="--password <password>" type="string">
  Gateway-Passwort für den Health-Snapshot.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  Timeout für Status-/Health-Snapshot.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  Persistierte Stabilitäts-Bundle-Suche überspringen.
</ParamField>
<ParamField path="--json" type="boolean">
  Den geschriebenen Pfad, die Größe und das Manifest als JSON ausgeben.
</ParamField>

Der Export enthält ein Manifest, eine Markdown-Zusammenfassung, die Konfigurationsform, bereinigte Konfigurationsdetails, bereinigte Log-Zusammenfassungen, bereinigte Gateway-Status-/Health-Snapshots und das neueste Stabilitäts-Bundle, sofern eines vorhanden ist.

Er ist zum Teilen gedacht. Er enthält Betriebsdetails, die beim Debuggen helfen, etwa sichere OpenClaw-Logfelder, Subsystemnamen, Statuscodes, Dauern, konfigurierte Modi, Ports, Plugin-IDs, Provider-IDs, nicht geheime Feature-Einstellungen und redigierte operative Log-Meldungen. Ausgelassen oder redigiert werden Chat-Text, Webhook-Bodies, Tool-Ausgaben, Anmeldedaten, Cookies, Konto-/Nachrichtenkennungen, Prompt-/Instruktionstext, Hostnamen und Secret-Werte. Wenn eine LogTape-artige Nachricht wie Benutzer-/Chat-/Tool-Payload-Text aussieht, behält der Export nur bei, dass eine Nachricht ausgelassen wurde, plus deren Byte-Anzahl.

### `gateway status`

`gateway status` zeigt den Gateway-Service (launchd/systemd/schtasks) plus optional eine Probe von Konnektivitäts-/Authentifizierungsfähigkeit.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Ein explizites Probe-Ziel hinzufügen. Konfiguriertes Remote + localhost werden weiterhin geprüft.
</ParamField>
<ParamField path="--token <token>" type="string">
  Token-Authentifizierung für die Probe.
</ParamField>
<ParamField path="--password <password>" type="string">
  Passwort-Authentifizierung für die Probe.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Probe-Timeout.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  Konnektivitätsprobe überspringen (nur Service-Ansicht).
</ParamField>
<ParamField path="--deep" type="boolean">
  Auch systemweite Services scannen.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Die Standard-Konnektivitätsprobe auf eine Lese-Probe hochstufen und mit Nicht-Null beenden, wenn diese Lese-Probe fehlschlägt. Kann nicht mit `--no-probe` kombiniert werden.
</ParamField>

<AccordionGroup>
  <Accordion title="Statussemantik">
    - `gateway status` bleibt für Diagnosen verfügbar, auch wenn die lokale CLI-Konfiguration fehlt oder ungültig ist.
    - Standardmäßig weist `gateway status` den Servicestatus, die WebSocket-Verbindung und die beim Handshake sichtbare Authentifizierungsfähigkeit nach. Es weist keine Lese-/Schreib-/Admin-Operationen nach.
    - Diagnose-Probes sind für erstmalige Geräteauthentifizierung nicht mutierend: Sie verwenden ein vorhandenes zwischengespeichertes Gerätetoken erneut, sofern eines existiert, erstellen aber keine neue CLI-Geräteidentität oder schreibgeschützten Geräte-Pairing-Eintrag nur zur Statusprüfung.
    - `gateway status` löst konfigurierte Auth-SecretRefs für die Probe-Authentifizierung nach Möglichkeit auf.
    - Wenn ein erforderliches Auth-SecretRef in diesem Befehlspfad nicht aufgelöst ist, meldet `gateway status --json` `rpc.authWarning`, wenn Probe-Konnektivität/-Authentifizierung fehlschlägt; übergeben Sie `--token`/`--password` explizit oder lösen Sie zuerst die Secret-Quelle auf.
    - Wenn die Probe erfolgreich ist, werden Warnungen zu nicht aufgelösten Auth-Referenzen unterdrückt, um Fehlalarme zu vermeiden.
    - Verwenden Sie `--require-rpc` in Skripten und Automatisierungen, wenn ein lauschender Service nicht ausreicht und auch RPC-Aufrufe mit Leseberechtigung fehlerfrei sein müssen.
    - `--deep` fügt eine Best-Effort-Prüfung auf zusätzliche launchd-/systemd-/schtasks-Installationen hinzu. Wenn mehrere Gateway-ähnliche Services erkannt werden, gibt die menschenlesbare Ausgabe Hinweise zur Bereinigung aus und warnt, dass die meisten Setups ein Gateway pro Maschine ausführen sollten.
    - Die menschenlesbare Ausgabe enthält den aufgelösten Dateilogpfad plus den Snapshot der Konfigurationspfade/-gültigkeit von CLI gegenüber Service, um Profil- oder State-Dir-Drift zu diagnostizieren.
  </Accordion>
  <Accordion title="Linux-systemd-Prüfungen auf Auth-Drift">
    - Bei Linux-systemd-Installationen lesen Prüfungen auf Service-Auth-Drift sowohl `Environment=`- als auch `EnvironmentFile=`-Werte aus der Unit (einschließlich `%h`, in Anführungszeichen gesetzter Pfade, mehrerer Dateien und optionaler `-`-Dateien).
    - Drift-Prüfungen lösen `gateway.auth.token`-SecretRefs mit der zusammengeführten Laufzeitumgebung auf (zuerst Service-Befehlsumgebung, dann Fallback auf Prozessumgebung).
    - Wenn Token-Authentifizierung effektiv nicht aktiv ist (explizites `gateway.auth.mode` von `password`/`none`/`trusted-proxy` oder nicht gesetzter Modus, bei dem Passwort gewinnen kann und kein Token-Kandidat gewinnen kann), überspringen Prüfungen auf Token-Drift die Auflösung des Konfigurations-Tokens.
  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` ist der Befehl „alles debuggen“. Er prüft immer:

- Ihr konfiguriertes Remote-Gateway (falls gesetzt), und
- localhost (loopback) **auch dann, wenn ein Remote konfiguriert ist**.

Wenn Sie `--url` übergeben, wird dieses explizite Ziel vor beiden hinzugefügt. Die menschenlesbare Ausgabe kennzeichnet die Ziele als:

- `URL (explicit)`
- `Remote (configured)` oder `Remote (configured, inactive)`
- `local loopback`

<Note>
Wenn mehrere Gateways erreichbar sind, werden alle ausgegeben. Mehrere Gateways werden unterstützt, wenn Sie isolierte Profile/Ports verwenden (z. B. einen Rescue-Bot), aber die meisten Installationen führen weiterhin ein einzelnes Gateway aus.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="Interpretation">
    - `Reachable: yes` bedeutet, dass mindestens ein Ziel eine WebSocket-Verbindung akzeptiert hat.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` gibt an, was die Probe über die Authentifizierung nachweisen konnte. Dies ist von der Erreichbarkeit getrennt.
    - `Read probe: ok` bedeutet, dass auch RPC-Detailaufrufe mit Leseberechtigung (`health`/`status`/`system-presence`/`config.get`) erfolgreich waren.
    - `Read probe: limited - missing scope: operator.read` bedeutet, dass die Verbindung erfolgreich war, aber der RPC-Aufruf mit Leseberechtigung eingeschränkt war. Dies wird als **beeinträchtigte** Erreichbarkeit gemeldet, nicht als vollständiger Fehler.
    - Wie `gateway status` verwendet die Probe vorhandene zwischengespeicherte Geräteauthentifizierung erneut, erstellt aber keine erstmalige Geräteidentität oder Pairing-Zustand.
    - Der Exit-Code ist nur dann ungleich null, wenn kein geprüftes Ziel erreichbar ist.
  </Accordion>
  <Accordion title="JSON-Ausgabe">
    Oberste Ebene:

    - `ok`: mindestens ein Ziel ist erreichbar.
    - `degraded`: bei mindestens einem Ziel war der RPC-Detailaufruf wegen eingeschränkter Scopes limitiert.
    - `capability`: beste Fähigkeit, die unter den erreichbaren Zielen gesehen wurde (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` oder `unknown`).
    - `primaryTargetId`: bestes Ziel, das in dieser Reihenfolge als aktiver Gewinner behandelt werden soll: explizite URL, SSH-Tunnel, konfiguriertes Remote, dann local loopback.
    - `warnings[]`: Best-Effort-Warnungseinträge mit `code`, `message` und optionalen `targetIds`.
    - `network`: URL-Hinweise für local loopback/Tailnet, abgeleitet aus der aktuellen Konfiguration und Host-Netzwerkumgebung.
    - `discovery.timeoutMs` und `discovery.count`: das tatsächliche Discovery-Budget bzw. die tatsächliche Ergebnisanzahl, die für diesen Probe-Durchlauf verwendet wurden.

    Pro Ziel (`targets[].connect`):

    - `ok`: Erreichbarkeit nach Verbindung + Klassifizierung als beeinträchtigt.
    - `rpcOk`: voller Erfolg des RPC-Detailaufrufs.
    - `scopeLimited`: RPC-Detailaufruf ist wegen fehlender Operator-Scopes fehlgeschlagen.

    Pro Ziel (`targets[].auth`):

    - `role`: in `hello-ok` gemeldete Auth-Rolle, sofern verfügbar.
    - `scopes`: in `hello-ok` gemeldete gewährte Scopes, sofern verfügbar.
    - `capability`: die für dieses Ziel sichtbare Klassifizierung der Auth-Fähigkeit.

  </Accordion>
  <Accordion title="Häufige Warncodes">
    - `ssh_tunnel_failed`: Einrichtung des SSH-Tunnels ist fehlgeschlagen; der Befehl ist auf direkte Probes zurückgefallen.
    - `multiple_gateways`: Mehr als ein Ziel war erreichbar; das ist ungewöhnlich, es sei denn, Sie betreiben absichtlich isolierte Profile, etwa einen Rescue-Bot.
    - `auth_secretref_unresolved`: Ein konfiguriertes Auth-SecretRef konnte für ein fehlgeschlagenes Ziel nicht aufgelöst werden.
    - `probe_scope_limited`: Die WebSocket-Verbindung war erfolgreich, aber die Lese-Probe war durch fehlendes `operator.read` eingeschränkt.
  </Accordion>
</AccordionGroup>

#### Remote über SSH (Parität zur Mac-App)

Der Modus „Remote over SSH“ der macOS-App verwendet eine lokale Portweiterleitung, sodass das Remote-Gateway (das möglicherweise nur an loopback gebunden ist) unter `ws://127.0.0.1:<port>` erreichbar wird.

CLI-Äquivalent:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` oder `user@host:port` (Port ist standardmäßig `22`).
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  Identity-Datei.
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  Den zuerst erkannten Gateway-Host als SSH-Ziel aus dem aufgelösten Discovery-Endpunkt auswählen (`local.` plus die konfigurierte Wide-Area-Domain, sofern vorhanden). Nur-TXT-Hinweise werden ignoriert.
</ParamField>

Konfiguration (optional, wird als Standard verwendet):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

Low-Level-RPC-Helfer.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

<ParamField path="--params <json>" type="string" default="{}">
  JSON-Objektzeichenfolge für Parameter.
</ParamField>
<ParamField path="--url <url>" type="string">
  Gateway-WebSocket-URL.
</ParamField>
<ParamField path="--token <token>" type="string">
  Gateway-Token.
</ParamField>
<ParamField path="--password <password>" type="string">
  Gateway-Passwort.
</ParamField>
<ParamField path="--timeout <ms>" type="number">
  Timeout-Budget.
</ParamField>
<ParamField path="--expect-final" type="boolean">
  Hauptsächlich für RPCs im Agent-Stil, die Zwischenereignisse streamen, bevor eine finale Payload kommt.
</ParamField>
<ParamField path="--json" type="boolean">
  Maschinenlesbare JSON-Ausgabe.
</ParamField>

<Note>
`--params` muss gültiges JSON sein.
</Note>

## Den Gateway-Service verwalten

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

<AccordionGroup>
  <Accordion title="Befehlsoptionen">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
    - `gateway uninstall|start|stop|restart`: `--json`
  </Accordion>
  <Accordion title="Hinweise zu Service-Installation und -Lebenszyklus">
    - `gateway install` unterstützt `--port`, `--runtime`, `--token`, `--force`, `--json`.
    - Verwenden Sie `gateway restart`, um einen verwalteten Service neu zu starten. Verketten Sie nicht `gateway stop` und `gateway start` als Ersatz für einen Neustart; unter macOS deaktiviert `gateway stop` den LaunchAgent absichtlich, bevor er gestoppt wird.
    - Wenn Token-Authentifizierung ein Token erfordert und `gateway.auth.token` per SecretRef verwaltet wird, validiert `gateway install`, dass das SecretRef auflösbar ist, persistiert aber das aufgelöste Token nicht in die Umgebungsmetadaten des Services.
    - Wenn Token-Authentifizierung ein Token erfordert und das konfigurierte Token-SecretRef nicht aufgelöst ist, schlägt die Installation fail-closed fehl, statt Fallback-Klartext zu persistieren.
    - Für Passwort-Authentifizierung bei `gateway run` sollten Sie `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` oder ein SecretRef-gestütztes `gateway.auth.password` gegenüber Inline-`--password` bevorzugen.
    - Im abgeleiteten Auth-Modus lockert ein nur in der Shell gesetztes `OPENCLAW_GATEWAY_PASSWORD` die Token-Anforderungen für die Installation nicht; verwenden Sie dauerhafte Konfiguration (`gateway.auth.password` oder Konfigurations-`env`), wenn Sie einen verwalteten Service installieren.
    - Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, wird die Installation blockiert, bis der Modus explizit gesetzt wird.
    - Lebenszyklusbefehle akzeptieren `--json` für Skripterstellung.
  </Accordion>
</AccordionGroup>

## Gateways erkennen (Bonjour)

`gateway discover` scannt nach Gateway-Beacons (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): Wählen Sie eine Domain (Beispiel: `openclaw.internal.`) und richten Sie Split-DNS + einen DNS-Server ein; siehe [Bonjour](/de/gateway/bonjour).

Nur Gateways mit aktivierter Bonjour-Erkennung (Standard) kündigen das Beacon an.

Wide-Area-Discovery-Einträge enthalten (TXT):

- `role` (Rollenhinweis des Gateway)
- `transport` (Transporthinweis, z. B. `gateway`)
- `gatewayPort` (WebSocket-Port, normalerweise `18789`)
- `sshPort` (optional; Clients verwenden standardmäßig `22` als SSH-Ziel, wenn er fehlt)
- `tailnetDns` (MagicDNS-Hostname, sofern verfügbar)
- `gatewayTls` / `gatewayTlsSha256` (TLS aktiviert + Zertifikat-Fingerprint)
- `cliPath` (Hinweis für Remote-Installation, der in die Wide-Area-Zone geschrieben wird)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Timeout pro Befehl (browse/resolve).
</ParamField>
<ParamField path="--json" type="boolean">
  Maschinenlesbare Ausgabe (deaktiviert auch Styling/Spinner).
</ParamField>

Beispiele:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- Die CLI scannt `local.` plus die konfigurierte Wide-Area-Domain, wenn eine aktiviert ist.
- `wsUrl` in der JSON-Ausgabe wird aus dem aufgelösten Service-Endpunkt abgeleitet, nicht aus Nur-TXT-Hinweisen wie `lanHost` oder `tailnetDns`.
- Bei `local.` mDNS werden `sshPort` und `cliPath` nur dann ausgestrahlt, wenn `discovery.mdns.mode` auf `full` steht. Wide-Area-DNS-SD schreibt weiterhin `cliPath`; `sshPort` bleibt auch dort optional.
</Note>

## Verwandt

- [CLI reference](/de/cli)
- [Gateway runbook](/de/gateway)
