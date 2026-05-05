---
read_when:
    - Gateway über die CLI ausführen (Entwicklung oder Server)
    - Fehlersuche bei Gateway-Authentifizierung, Bind-Modi und Konnektivität
    - Gateways über Bonjour erkennen (lokales + Wide-Area-DNS-SD)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — Gateways ausführen, abfragen und entdecken
title: Gateway
x-i18n:
    generated_at: "2026-05-05T01:44:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 521558189b150b2faa22f95ec32419ac9e02c5f47c72b9095f40d1432840c038
    source_path: cli/gateway.md
    workflow: 16
---

Der Gateway ist OpenClaws WebSocket-Server (Kanäle, Nodes, Sitzungen, Hooks). Die Unterbefehle auf dieser Seite befinden sich unter `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Bonjour-Erkennung" href="/de/gateway/bonjour">
    Lokale mDNS- und Wide-Area-DNS-SD-Einrichtung.
  </Card>
  <Card title="Erkennungsübersicht" href="/de/gateway/discovery">
    Wie OpenClaw Gateways ankündigt und findet.
  </Card>
  <Card title="Konfiguration" href="/de/gateway/configuration">
    Gateway-Konfigurationsschlüssel auf oberster Ebene.
  </Card>
</CardGroup>

## Gateway ausführen

Führen Sie einen lokalen Gateway-Prozess aus:

```bash
openclaw gateway
```

Vordergrund-Alias:

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="Startverhalten">
    - Standardmäßig verweigert der Gateway den Start, wenn `gateway.mode=local` nicht in `~/.openclaw/openclaw.json` gesetzt ist. Verwenden Sie `--allow-unconfigured` für Ad-hoc-/Entwicklungs-Ausführungen.
    - Von `openclaw onboard --mode local` und `openclaw setup` wird erwartet, dass sie `gateway.mode=local` schreiben. Wenn die Datei existiert, aber `gateway.mode` fehlt, behandeln Sie dies als beschädigte oder überschriebene Konfiguration und reparieren Sie sie, statt implizit den lokalen Modus anzunehmen.
    - Wenn die Datei existiert und `gateway.mode` fehlt, behandelt der Gateway dies als verdächtige Konfigurationsbeschädigung und weigert sich, für Sie „lokal zu erraten“.
    - Das Binden über loopback hinaus ohne Authentifizierung wird blockiert (Sicherheitsleitplanke).
    - `SIGUSR1` löst einen Neustart im Prozess aus, wenn er autorisiert ist (`commands.restart` ist standardmäßig aktiviert; setzen Sie `commands.restart: false`, um manuelle Neustarts zu blockieren, während Anwenden/Aktualisieren von Gateway-Tools/-Konfiguration weiterhin erlaubt bleibt).
    - `SIGINT`-/`SIGTERM`-Handler stoppen den Gateway-Prozess, stellen aber keinen benutzerdefinierten Terminalzustand wieder her. Wenn Sie die CLI mit einer TUI oder Raw-Mode-Eingabe umschließen, stellen Sie das Terminal vor dem Beenden wieder her.

  </Accordion>
</AccordionGroup>

### Optionen

<ParamField path="--port <port>" type="number">
  WebSocket-Port (Standardwert stammt aus Konfiguration/Env; üblicherweise `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  Bindungsmodus des Listeners.
</ParamField>
<ParamField path="--auth <token|password>" type="string">
  Überschreibung des Authentifizierungsmodus.
</ParamField>
<ParamField path="--token <token>" type="string">
  Token-Überschreibung (setzt außerdem `OPENCLAW_GATEWAY_TOKEN` für den Prozess).
</ParamField>
<ParamField path="--password <password>" type="string">
  Passwort-Überschreibung.
</ParamField>
<ParamField path="--password-file <path>" type="string">
  Das Gateway-Passwort aus einer Datei lesen.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Den Gateway über Tailscale verfügbar machen.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Tailscale-Serve-/Funnel-Konfiguration beim Herunterfahren zurücksetzen.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Gateway-Start ohne `gateway.mode=local` in der Konfiguration erlauben. Umgeht die Startschutzprüfung nur für Ad-hoc-/Entwicklungs-Bootstrap; schreibt oder repariert die Konfigurationsdatei nicht.
</ParamField>
<ParamField path="--dev" type="boolean">
  Eine Entwicklungskonfiguration und einen Workspace erstellen, falls sie fehlen (überspringt BOOTSTRAP.md).
</ParamField>
<ParamField path="--reset" type="boolean">
  Entwicklungskonfiguration, Anmeldedaten, Sitzungen und Workspace zurücksetzen (erfordert `--dev`).
</ParamField>
<ParamField path="--force" type="boolean">
  Vor dem Start jeden vorhandenen Listener auf dem ausgewählten Port beenden.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Ausführliche Logs.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  Nur CLI-Backend-Logs in der Konsole anzeigen (und stdout/stderr aktivieren).
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  WebSocket-Logstil.
</ParamField>
<ParamField path="--compact" type="boolean">
  Alias für `--ws-log compact`.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  Rohereignisse des Modellstreams als jsonl protokollieren.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  jsonl-Pfad für Rohstreams.
</ParamField>

## Gateway neu starten

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --force
```

`openclaw gateway restart --safe` fordert den laufenden Gateway auf, aktive OpenClaw-Arbeit vor dem Neustart per Preflight zu prüfen. Wenn eingereihte Vorgänge, Antwortzustellung, eingebettete Ausführungen oder Task-Ausführungen aktiv sind, meldet der Gateway die Blocker, fasst doppelte sichere Neustartanforderungen zusammen und startet neu, sobald die aktive Arbeit abgearbeitet ist. Einfaches `restart` behält aus Kompatibilitätsgründen das bestehende Service-Manager-Verhalten bei. Verwenden Sie `--force` nur, wenn Sie ausdrücklich den unmittelbaren Override-Pfad möchten.

<Warning>
Inline-`--password` kann in lokalen Prozesslisten offengelegt werden. Bevorzugen Sie `--password-file`, Env oder ein SecretRef-gestütztes `gateway.auth.password`.
</Warning>

### Start-Profiling

- Setzen Sie `OPENCLAW_GATEWAY_STARTUP_TRACE=1`, um Phasenzeiten während des Gateway-Starts zu protokollieren, einschließlich `eventLoopMax`-Verzögerung pro Phase und Plugin-Lookup-Table-Zeiten für installierten Index, Manifest-Registry, Startplanung und Owner-Map-Arbeit.
- Setzen Sie `OPENCLAW_DIAGNOSTICS=timeline` mit `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>`, um eine Best-Effort-JSONL-Startdiagnose-Zeitleiste für externe QA-Harnesses zu schreiben. Sie können das Flag auch mit `diagnostics.flags: ["timeline"]` in der Konfiguration aktivieren; der Pfad wird weiterhin über Env bereitgestellt. Fügen Sie `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` hinzu, um Event-Loop-Samples einzuschließen.
- Führen Sie `pnpm test:startup:gateway -- --runs 5 --warmup 1` aus, um den Gateway-Start zu benchmarken. Der Benchmark zeichnet die erste Prozessausgabe, `/healthz`, `/readyz`, Start-Trace-Zeiten, Event-Loop-Verzögerung und Zeitdetails der Plugin-Lookup-Table auf.

## Laufenden Gateway abfragen

Alle Abfragebefehle verwenden WebSocket-RPC.

<Tabs>
  <Tab title="Ausgabemodi">
    - Standard: menschenlesbar (in TTY farbig).
    - `--json`: maschinenlesbares JSON (ohne Styling/Spinner).
    - `--no-color` (oder `NO_COLOR=1`): ANSI deaktivieren, während das menschenlesbare Layout beibehalten wird.

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
Wenn Sie `--url` setzen, fällt die CLI nicht auf Konfigurations- oder Umgebungs-Anmeldedaten zurück. Übergeben Sie `--token` oder `--password` explizit. Fehlende explizite Anmeldedaten sind ein Fehler.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

Der HTTP-Endpunkt `/healthz` ist eine Liveness-Probe: Er antwortet, sobald der Server HTTP beantworten kann. Der HTTP-Endpunkt `/readyz` ist strenger und bleibt rot, solange Start-Plugin-Sidecars, Kanäle oder konfigurierte Hooks noch hochfahren. Lokale oder authentifizierte detaillierte Readiness-Antworten enthalten einen `eventLoop`-Diagnoseblock mit Event-Loop-Verzögerung, Event-Loop-Auslastung, CPU-Kern-Verhältnis und einem `degraded`-Flag.

### `gateway usage-cost`

Nutzungs- und Kostenzusammenfassungen aus Sitzungslogs abrufen.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  Anzahl der einzubeziehenden Tage.
</ParamField>

### `gateway stability`

Den aktuellen Diagnose-Stabilitätsrekorder von einem laufenden Gateway abrufen.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  Maximale Anzahl einzubeziehender aktueller Ereignisse (max. `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  Nach Diagnoseereignistyp filtern, etwa `payload.large` oder `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Nur Ereignisse nach einer Diagnosesequenznummer einschließen.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Ein persistiertes Stabilitäts-Bundle lesen, statt den laufenden Gateway aufzurufen. Verwenden Sie `--bundle latest` (oder nur `--bundle`) für das neueste Bundle unter dem Zustandsverzeichnis, oder übergeben Sie direkt einen Bundle-JSON-Pfad.
</ParamField>
<ParamField path="--export" type="boolean">
  Eine teilbare Support-Diagnose-ZIP schreiben, statt Stabilitätsdetails auszugeben.
</ParamField>
<ParamField path="--output <path>" type="string">
  Ausgabepfad für `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Datenschutz und Bundle-Verhalten">
    - Datensätze behalten operative Metadaten: Ereignisnamen, Zähler, Bytegrößen, Speicherwerte, Queue-/Sitzungszustand, Kanal-/Plugin-Namen und redigierte Sitzungszusammenfassungen. Sie behalten keinen Chattext, keine Webhook-Bodys, Tool-Ausgaben, rohen Anfrage- oder Antwortbodys, Tokens, Cookies, geheimen Werte, Hostnamen oder rohen Sitzungs-IDs. Setzen Sie `diagnostics.enabled: false`, um den Rekorder vollständig zu deaktivieren.
    - Bei fatalen Gateway-Exits, Shutdown-Timeouts und Startfehlern nach Neustarts schreibt OpenClaw denselben Diagnose-Snapshot nach `~/.openclaw/logs/stability/openclaw-stability-*.json`, wenn der Rekorder Ereignisse enthält. Prüfen Sie das neueste Bundle mit `openclaw gateway stability --bundle latest`; `--limit`, `--type` und `--since-seq` gelten ebenfalls für die Bundle-Ausgabe.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Eine lokale Diagnose-ZIP schreiben, die zum Anhängen an Fehlerberichte gedacht ist. Informationen zum Datenschutzmodell und zu den Bundle-Inhalten finden Sie unter [Diagnoseexport](/de/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Ausgabe-ZIP-Pfad. Standardmäßig ein Support-Export unter dem Zustandsverzeichnis.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Maximale Anzahl bereinigter Logzeilen, die eingeschlossen werden.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  Maximale Anzahl Logbytes, die geprüft werden.
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
  Lookup persistierter Stabilitäts-Bundles überspringen.
</ParamField>
<ParamField path="--json" type="boolean">
  Den geschriebenen Pfad, die Größe und das Manifest als JSON ausgeben.
</ParamField>

Der Export enthält ein Manifest, eine Markdown-Zusammenfassung, Konfigurationsform, bereinigte Konfigurationsdetails, bereinigte Logzusammenfassungen, bereinigte Gateway-Status-/Health-Snapshots und das neueste Stabilitäts-Bundle, falls eines existiert.

Er ist zum Teilen gedacht. Er behält operative Details, die beim Debugging helfen, etwa sichere OpenClaw-Logfelder, Subsystemnamen, Statuscodes, Dauern, konfigurierte Modi, Ports, Plugin-IDs, Provider-IDs, nicht geheime Feature-Einstellungen und redigierte operative Logmeldungen. Er lässt Chattext, Webhook-Bodys, Tool-Ausgaben, Anmeldedaten, Cookies, Konto-/Nachrichtenkennungen, Prompt-/Anweisungstext, Hostnamen und geheime Werte aus oder redigiert sie. Wenn eine LogTape-artige Meldung wie Benutzer-/Chat-/Tool-Nutzlasttext aussieht, behält der Export nur bei, dass eine Meldung ausgelassen wurde, plus deren Byteanzahl.

### `gateway status`

`gateway status` zeigt den Gateway-Dienst (launchd/systemd/schtasks) plus eine optionale Prüfung der Konnektivitäts-/Authentifizierungsfähigkeit.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Fügt ein explizites Probe-Ziel hinzu. Konfigurierte Remote-Ziele und localhost werden weiterhin geprüft.
</ParamField>
<ParamField path="--token <token>" type="string">
  Token-Auth für die Probe.
</ParamField>
<ParamField path="--password <password>" type="string">
  Passwort-Auth für die Probe.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Probe-Timeout.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  Überspringt die Konnektivitäts-Probe (nur Service-Ansicht).
</ParamField>
<ParamField path="--deep" type="boolean">
  Auch systemweite Services scannen.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Stuft die Standard-Konnektivitäts-Probe zu einer Lese-Probe hoch und beendet mit einem Nicht-Null-Code, wenn diese Lese-Probe fehlschlägt. Kann nicht mit `--no-probe` kombiniert werden.
</ParamField>

<AccordionGroup>
  <Accordion title="Statussemantik">
    - `gateway status` bleibt für Diagnosen verfügbar, auch wenn die lokale CLI-Konfiguration fehlt oder ungültig ist.
    - Standardmäßig weist `gateway status` den Service-Status, die WebSocket-Verbindung und die zum Handshake-Zeitpunkt sichtbare Auth-Fähigkeit nach. Lese-/Schreib-/Admin-Operationen werden damit nicht nachgewiesen.
    - Diagnose-Probes verändern bei erstmaliger Geräte-Auth nichts: Sie verwenden ein vorhandenes zwischengespeichertes Geräte-Token erneut, falls eines existiert, erstellen aber keine neue CLI-Geräteidentität und keinen schreibgeschützten Geräte-Pairing-Eintrag nur zur Statusprüfung.
    - `gateway status` löst konfigurierte Auth-SecretRefs nach Möglichkeit für die Probe-Auth auf.
    - Wenn eine erforderliche Auth-SecretRef in diesem Befehlspfad nicht aufgelöst wird, meldet `gateway status --json` `rpc.authWarning`, wenn Probe-Konnektivität/Auth fehlschlägt; übergeben Sie `--token`/`--password` explizit oder lösen Sie zuerst die Secret-Quelle auf.
    - Wenn die Probe erfolgreich ist, werden Warnungen zu nicht aufgelösten Auth-Refs unterdrückt, um Fehlalarme zu vermeiden.
    - Verwenden Sie `--require-rpc` in Skripten und Automatisierung, wenn ein lauschender Service nicht ausreicht und auch RPC-Aufrufe mit Lesebereich fehlerfrei sein müssen.
    - `--deep` fügt einen Best-Effort-Scan nach zusätzlichen launchd-/systemd-/schtasks-Installationen hinzu. Wenn mehrere gateway-artige Services erkannt werden, gibt die Ausgabe für Menschen Bereinigungshinweise aus und warnt, dass die meisten Setups ein Gateway pro Maschine ausführen sollten.
    - Die Ausgabe für Menschen enthält den aufgelösten Dateilogpfad sowie eine Momentaufnahme der CLI-gegen-Service-Konfigurationspfade und ihrer Gültigkeit, um Profil- oder State-Dir-Abweichungen zu diagnostizieren.

  </Accordion>
  <Accordion title="Linux-systemd-Prüfungen auf Auth-Drift">
    - Bei Linux-systemd-Installationen lesen Prüfungen auf Service-Auth-Drift sowohl `Environment=`- als auch `EnvironmentFile=`-Werte aus der Unit (einschließlich `%h`, zitierter Pfade, mehrerer Dateien und optionaler `-`-Dateien).
    - Drift-Prüfungen lösen `gateway.auth.token`-SecretRefs mit der zusammengeführten Runtime-Umgebung auf (zuerst Service-Befehlsumgebung, dann Prozessumgebung als Fallback).
    - Wenn Token-Auth nicht effektiv aktiv ist (expliziter `gateway.auth.mode` von `password`/`none`/`trusted-proxy` oder nicht gesetzter Modus, bei dem Passwort gewinnen kann und kein Token-Kandidat gewinnen kann), überspringen Token-Drift-Prüfungen die Auflösung des Konfigurationstokens.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` ist der Befehl zum „alles debuggen“. Er prüft immer:

- Ihr konfiguriertes Remote-Gateway (falls gesetzt) und
- localhost (loopback) **auch wenn Remote konfiguriert ist**.

Wenn Sie `--url` übergeben, wird dieses explizite Ziel vor beiden hinzugefügt. Die Ausgabe für Menschen kennzeichnet die Ziele als:

- `URL (explicit)`
- `Remote (configured)` oder `Remote (configured, inactive)`
- `Local loopback`

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
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` meldet, was die Probe über Auth nachweisen konnte. Dies ist getrennt von der Erreichbarkeit.
    - `Read probe: ok` bedeutet, dass Detail-RPC-Aufrufe mit Lesebereich (`health`/`status`/`system-presence`/`config.get`) ebenfalls erfolgreich waren.
    - `Read probe: limited - missing scope: operator.read` bedeutet, dass die Verbindung erfolgreich war, aber RPC mit Lesebereich eingeschränkt ist. Dies wird als **eingeschränkte** Erreichbarkeit gemeldet, nicht als vollständiger Fehler.
    - `Read probe: failed` nach `Connect: ok` bedeutet, dass das Gateway die WebSocket-Verbindung akzeptiert hat, aber nachfolgende Lesediagnosen ein Timeout hatten oder fehlgeschlagen sind. Auch dies ist **eingeschränkte** Erreichbarkeit, kein unerreichbares Gateway.
    - Wie `gateway status` verwendet die Probe vorhandene zwischengespeicherte Geräte-Auth erneut, erstellt aber keine erstmalige Geräteidentität oder keinen Pairing-Zustand.
    - Der Exit-Code ist nur dann ungleich null, wenn kein geprüftes Ziel erreichbar ist.

  </Accordion>
  <Accordion title="JSON-Ausgabe">
    Oberste Ebene:

    - `ok`: Mindestens ein Ziel ist erreichbar.
    - `degraded`: Mindestens ein Ziel hat eine Verbindung akzeptiert, aber keine vollständigen Detail-RPC-Diagnosen abgeschlossen.
    - `capability`: beste Fähigkeit, die über erreichbare Ziele hinweg beobachtet wurde (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` oder `unknown`).
    - `primaryTargetId`: bestes Ziel, das in dieser Reihenfolge als aktiver Gewinner behandelt werden soll: explizite URL, SSH-Tunnel, konfiguriertes Remote-Ziel, dann local loopback.
    - `warnings[]`: Best-Effort-Warnungsdatensätze mit `code`, `message` und optionalen `targetIds`.
    - `network`: local loopback-/Tailnet-URL-Hinweise, abgeleitet aus aktueller Konfiguration und Host-Netzwerk.
    - `discovery.timeoutMs` und `discovery.count`: das tatsächliche Discovery-Budget und die Ergebnisanzahl, die für diesen Probe-Durchlauf verwendet wurden.

    Pro Ziel (`targets[].connect`):

    - `ok`: Erreichbarkeit nach Verbindung plus eingeschränkter Klassifizierung.
    - `rpcOk`: vollständiger Detail-RPC-Erfolg.
    - `scopeLimited`: Detail-RPC ist wegen fehlendem Operator-Bereich fehlgeschlagen.

    Pro Ziel (`targets[].auth`):

    - `role`: in `hello-ok` gemeldete Auth-Rolle, falls verfügbar.
    - `scopes`: in `hello-ok` gemeldete gewährte Bereiche, falls verfügbar.
    - `capability`: die offengelegte Auth-Fähigkeitsklassifizierung für dieses Ziel.

  </Accordion>
  <Accordion title="Häufige Warncodes">
    - `ssh_tunnel_failed`: Einrichtung des SSH-Tunnels fehlgeschlagen; der Befehl ist auf direkte Probes zurückgefallen.
    - `multiple_gateways`: Mehr als ein Ziel war erreichbar; dies ist ungewöhnlich, sofern Sie nicht absichtlich isolierte Profile ausführen, zum Beispiel einen Rescue-Bot.
    - `auth_secretref_unresolved`: Eine konfigurierte Auth-SecretRef konnte für ein fehlgeschlagenes Ziel nicht aufgelöst werden.
    - `probe_scope_limited`: WebSocket-Verbindung war erfolgreich, aber die Lese-Probe wurde durch fehlendes `operator.read` eingeschränkt.

  </Accordion>
</AccordionGroup>

#### Remote über SSH (Parität zur Mac-App)

Der macOS-App-Modus „Remote über SSH“ verwendet eine lokale Portweiterleitung, sodass das Remote-Gateway (das möglicherweise nur an loopback gebunden ist) unter `ws://127.0.0.1:<port>` erreichbar wird.

CLI-Äquivalent:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` oder `user@host:port` (Port ist standardmäßig `22`).
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  Identitätsdatei.
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  Wählt den ersten erkannten Gateway-Host aus dem aufgelösten Discovery-Endpunkt als SSH-Ziel aus (`local.` plus die konfigurierte Wide-Area-Domain, falls vorhanden). Reine TXT-Hinweise werden ignoriert.
</ParamField>

Konfiguration (optional, als Standardwerte verwendet):

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
  Hauptsächlich für agent-artige RPCs, die Zwischenereignisse vor einer finalen Nutzlast streamen.
</ParamField>
<ParamField path="--json" type="boolean">
  Maschinenlesbare JSON-Ausgabe.
</ParamField>

<Note>
`--params` muss gültiges JSON sein.
</Note>

## Gateway-Service verwalten

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

### Mit einem Wrapper installieren

Verwenden Sie `--wrapper`, wenn der verwaltete Service über eine andere ausführbare Datei starten muss, zum Beispiel einen
Secrets-Manager-Shim oder einen Run-as-Helfer. Der Wrapper erhält die normalen Gateway-Argumente und ist
dafür verantwortlich, am Ende `openclaw` oder Node mit diesen Argumenten per exec auszuführen.

```bash
cat > ~/.local/bin/openclaw-doppler <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
exec doppler run --project my-project --config production -- openclaw "$@"
EOF
chmod +x ~/.local/bin/openclaw-doppler

openclaw gateway install --wrapper ~/.local/bin/openclaw-doppler --force
openclaw gateway restart
```

Sie können den Wrapper auch über die Umgebung setzen. `gateway install` prüft, dass der Pfad eine
ausführbare Datei ist, schreibt den Wrapper in die Service-`ProgramArguments` und speichert
`OPENCLAW_WRAPPER` in der Service-Umgebung für spätere erzwungene Neuinstallationen, Updates und Doctor-
Reparaturen.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

Um einen gespeicherten Wrapper zu entfernen, leeren Sie `OPENCLAW_WRAPPER` während der Neuinstallation:

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="Befehlsoptionen">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--safe`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start|stop`: `--json`

  </Accordion>
  <Accordion title="Lifecycle-Verhalten">
    - Verwenden Sie `gateway restart`, um einen verwalteten Service neu zu starten. Verketten Sie `gateway stop` und `gateway start` nicht als Ersatz für einen Neustart; unter macOS deaktiviert `gateway stop` den LaunchAgent absichtlich, bevor er ihn stoppt.
    - `gateway restart --safe` fordert das laufende Gateway auf, aktive OpenClaw-Arbeit vorab zu prüfen und den Neustart aufzuschieben, bis Antwortzustellung, eingebettete Ausführungen und Task-Ausführungen abgearbeitet sind. `--safe` kann nicht mit `--force` oder `--wait` kombiniert werden.
    - `gateway restart --wait 30s` überschreibt das konfigurierte Restart-Drain-Budget für diesen Neustart. Reine Zahlen sind Millisekunden; Einheiten wie `s`, `m` und `h` werden akzeptiert. `--wait 0` wartet unbegrenzt.
    - `gateway restart --force` überspringt das Abarbeiten aktiver Arbeit und startet sofort neu. Verwenden Sie dies, wenn ein Operator die aufgeführten Task-Blocker bereits geprüft hat und das Gateway jetzt wieder verfügbar haben möchte.
    - Lifecycle-Befehle akzeptieren `--json` für Skripting.

  </Accordion>
  <Accordion title="Authentifizierung und SecretRefs zur Installationszeit">
    - Wenn Token-Authentifizierung ein Token erfordert und `gateway.auth.token` von SecretRef verwaltet wird, validiert `gateway install`, dass die SecretRef auflösbar ist, speichert das aufgelöste Token aber nicht in den Metadaten der Service-Umgebung.
    - Wenn Token-Authentifizierung ein Token erfordert und die konfigurierte Token-SecretRef nicht aufgelöst ist, schlägt die Installation geschlossen fehl, statt Ersatz-Klartext zu speichern.
    - Verwenden Sie für Passwortauthentifizierung bei `gateway run` bevorzugt `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` oder ein durch SecretRef gestütztes `gateway.auth.password` anstelle von inline `--password`.
    - Im abgeleiteten Authentifizierungsmodus lockert ein nur in der Shell gesetztes `OPENCLAW_GATEWAY_PASSWORD` die Anforderungen an Installations-Token nicht; verwenden Sie dauerhafte Konfiguration (`gateway.auth.password` oder config `env`), wenn Sie einen verwalteten Service installieren.
    - Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, wird die Installation blockiert, bis der Modus ausdrücklich gesetzt wird.

  </Accordion>
</AccordionGroup>

## Gateways erkennen (Bonjour)

`gateway discover` sucht nach Gateway-Beacons (`_openclaw-gw._tcp`).

- Multicast-DNS-SD: `local.`
- Unicast-DNS-SD (Wide-Area Bonjour): Wählen Sie eine Domain (Beispiel: `openclaw.internal.`) und richten Sie Split-DNS + einen DNS-Server ein; siehe [Bonjour](/de/gateway/bonjour).

Nur Gateways mit aktivierter Bonjour-Erkennung (Standard) kündigen das Beacon an.

Wide-Area-Erkennungseinträge enthalten (TXT):

- `role` (Hinweis auf Gateway-Rolle)
- `transport` (Transporthinweis, z. B. `gateway`)
- `gatewayPort` (WebSocket-Port, üblicherweise `18789`)
- `sshPort` (optional; Clients verwenden standardmäßig SSH-Ziele mit `22`, wenn er fehlt)
- `tailnetDns` (MagicDNS-Hostname, sofern verfügbar)
- `gatewayTls` / `gatewayTlsSha256` (TLS aktiviert + Zertifikatsfingerabdruck)
- `cliPath` (Remote-Installationshinweis, der in die Wide-Area-Zone geschrieben wird)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Zeitlimit pro Befehl (Durchsuchen/Auflösen).
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
- Die CLI durchsucht `local.` plus die konfigurierte Wide-Area-Domain, wenn eine aktiviert ist.
- `wsUrl` in der JSON-Ausgabe wird aus dem aufgelösten Service-Endpunkt abgeleitet, nicht aus reinen TXT-Hinweisen wie `lanHost` oder `tailnetDns`.
- Bei `local.` mDNS werden `sshPort` und `cliPath` nur gesendet, wenn `discovery.mdns.mode` auf `full` gesetzt ist. Wide-Area-DNS-SD schreibt weiterhin `cliPath`; `sshPort` bleibt dort ebenfalls optional.

</Note>

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Gateway-Runbook](/de/gateway)
