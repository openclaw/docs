---
read_when:
    - Gateway über die CLI ausführen (Entwicklung oder Server)
    - Fehlersuche bei Gateway-Authentifizierung, Bind-Modi und Konnektivität
    - Erkennung von Gateways über Bonjour (lokal + Wide-Area-DNS-SD)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — Gateways ausführen, abfragen und entdecken
title: Gateway
x-i18n:
    generated_at: "2026-04-30T06:45:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: fe53f1ec289bf463766634a9b03bc234e109fdddf35b3fa3958fb8c5255c81a9
    source_path: cli/gateway.md
    workflow: 16
---

Der Gateway ist OpenClaws WebSocket-Server (Kanäle, Nodes, Sitzungen, Hooks). Unterbefehle auf dieser Seite befinden sich unter `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Bonjour discovery" href="/de/gateway/bonjour">
    Lokale mDNS- und Wide-Area-DNS-SD-Einrichtung.
  </Card>
  <Card title="Discovery overview" href="/de/gateway/discovery">
    Wie OpenClaw Gateways ankündigt und findet.
  </Card>
  <Card title="Configuration" href="/de/gateway/configuration">
    Gateway-Konfigurationsschlüssel auf oberster Ebene.
  </Card>
</CardGroup>

## Gateway ausführen

Führen Sie einen lokalen Gateway-Prozess aus:

```bash
openclaw gateway
```

Alias für den Vordergrund:

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="Startup behavior">
    - Standardmäßig verweigert der Gateway den Start, sofern `gateway.mode=local` nicht in `~/.openclaw/openclaw.json` gesetzt ist. Verwenden Sie `--allow-unconfigured` für Ad-hoc-/Entwicklungsläufe.
    - Von `openclaw onboard --mode local` und `openclaw setup` wird erwartet, dass sie `gateway.mode=local` schreiben. Wenn die Datei existiert, aber `gateway.mode` fehlt, behandeln Sie dies als beschädigte oder überschriebene Konfiguration und reparieren Sie sie, statt implizit den lokalen Modus anzunehmen.
    - Wenn die Datei existiert und `gateway.mode` fehlt, behandelt der Gateway dies als verdächtigen Konfigurationsschaden und weigert sich, für Sie „lokal zu erraten“.
    - Binden über Loopback hinaus ohne Authentifizierung wird blockiert (Sicherheitsleitplanke).
    - `SIGUSR1` löst bei Autorisierung einen prozessinternen Neustart aus (`commands.restart` ist standardmäßig aktiviert; setzen Sie `commands.restart: false`, um manuelle Neustarts zu blockieren, während Gateway-Tool-/Konfigurations-Apply-/Update-Vorgänge weiterhin erlaubt bleiben).
    - `SIGINT`-/`SIGTERM`-Handler stoppen den Gateway-Prozess, stellen jedoch keinen benutzerdefinierten Terminalzustand wieder her. Wenn Sie die CLI mit einer TUI oder Raw-Mode-Eingabe umschließen, stellen Sie das Terminal vor dem Beenden wieder her.

  </Accordion>
</AccordionGroup>

### Optionen

<ParamField path="--port <port>" type="number">
  WebSocket-Port (Standard kommt aus Konfiguration/Umgebung; üblicherweise `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  Bindemodus des Listeners.
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
  Gateway-Passwort aus einer Datei lesen.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Gateway über Tailscale verfügbar machen.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Tailscale-Serve-/Funnel-Konfiguration beim Herunterfahren zurücksetzen.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Gateway-Start ohne `gateway.mode=local` in der Konfiguration erlauben. Umgeht die Startschutzprüfung nur für Ad-hoc-/Entwicklungs-Bootstrap; schreibt oder repariert die Konfigurationsdatei nicht.
</ParamField>
<ParamField path="--dev" type="boolean">
  Entwicklungskonfiguration und Arbeitsbereich erstellen, falls sie fehlen (überspringt BOOTSTRAP.md).
</ParamField>
<ParamField path="--reset" type="boolean">
  Entwicklungskonfiguration, Zugangsdaten, Sitzungen und Arbeitsbereich zurücksetzen (erfordert `--dev`).
</ParamField>
<ParamField path="--force" type="boolean">
  Vor dem Start einen vorhandenen Listener auf dem ausgewählten Port beenden.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Ausführliche Logs.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  Nur CLI-Backend-Logs in der Konsole anzeigen (und stdout/stderr aktivieren).
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  WebSocket-Log-Stil.
</ParamField>
<ParamField path="--compact" type="boolean">
  Alias für `--ws-log compact`.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  Rohdatenereignisse des Modellstreams in jsonl protokollieren.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  jsonl-Pfad für Rohstreams.
</ParamField>

<Warning>
Inline-`--password` kann in lokalen Prozesslisten offengelegt werden. Bevorzugen Sie `--password-file`, Umgebungsvariablen oder ein SecretRef-gestütztes `gateway.auth.password`.
</Warning>

### Startprofilierung

- Setzen Sie `OPENCLAW_GATEWAY_STARTUP_TRACE=1`, um Phasenzeiten während des Gateway-Starts zu protokollieren, einschließlich `eventLoopMax`-Verzögerung pro Phase und Plugin-Lookup-Table-Zeiten für installierten Index, Manifest-Registry, Startplanung und Owner-Map-Arbeit.
- Setzen Sie `OPENCLAW_DIAGNOSTICS=timeline` mit `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>`, um eine Best-Effort-JSONL-Startdiagnose-Timeline für externe QA-Harnesses zu schreiben. Sie können das Flag auch mit `diagnostics.flags: ["timeline"]` in der Konfiguration aktivieren; der Pfad wird weiterhin über die Umgebung bereitgestellt. Fügen Sie `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` hinzu, um Event-Loop-Samples einzuschließen.
- Führen Sie `pnpm test:startup:gateway -- --runs 5 --warmup 1` aus, um den Gateway-Start zu benchmarken. Der Benchmark zeichnet die erste Prozessausgabe, `/healthz`, `/readyz`, Start-Trace-Zeiten, Event-Loop-Verzögerung und Timingdetails der Plugin-Lookup-Table auf.

## Laufenden Gateway abfragen

Alle Abfragebefehle verwenden WebSocket-RPC.

<Tabs>
  <Tab title="Output modes">
    - Standard: menschenlesbar (in TTY farbig).
    - `--json`: maschinenlesbares JSON (ohne Styling/Spinner).
    - `--no-color` (oder `NO_COLOR=1`): ANSI deaktivieren, während das menschenlesbare Layout beibehalten wird.

  </Tab>
  <Tab title="Shared options">
    - `--url <url>`: Gateway-WebSocket-URL.
    - `--token <token>`: Gateway-Token.
    - `--password <password>`: Gateway-Passwort.
    - `--timeout <ms>`: Timeout/Budget (variiert je nach Befehl).
    - `--expect-final`: auf eine „final“-Antwort warten (Agentenaufrufe).

  </Tab>
</Tabs>

<Note>
Wenn Sie `--url` setzen, fällt die CLI nicht auf Zugangsdaten aus Konfiguration oder Umgebung zurück. Übergeben Sie `--token` oder `--password` explizit. Fehlende explizite Zugangsdaten sind ein Fehler.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

Der HTTP-Endpunkt `/healthz` ist ein Liveness-Probe: Er antwortet, sobald der Server HTTP beantworten kann. Der HTTP-Endpunkt `/readyz` ist strenger und bleibt rot, während Start-Sidecars, Kanäle oder konfigurierte Hooks noch stabilisiert werden. Lokale oder authentifizierte detaillierte Readiness-Antworten enthalten einen `eventLoop`-Diagnoseblock mit Event-Loop-Verzögerung, Event-Loop-Auslastung, CPU-Kern-Verhältnis und einem `degraded`-Flag.

### `gateway usage-cost`

Nutzungs-Kosten-Zusammenfassungen aus Sitzungslogs abrufen.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  Anzahl der einzuschließenden Tage.
</ParamField>

### `gateway stability`

Aktuellen Diagnose-Stabilitätsrekorder von einem laufenden Gateway abrufen.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  Maximale Anzahl der einzuschließenden aktuellen Ereignisse (max. `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  Nach Diagnoseereignistyp filtern, etwa `payload.large` oder `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Nur Ereignisse nach einer Diagnose-Sequenznummer einschließen.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Ein persistiertes Stabilitäts-Bundle lesen, statt den laufenden Gateway aufzurufen. Verwenden Sie `--bundle latest` (oder nur `--bundle`) für das neueste Bundle im Zustandsverzeichnis, oder übergeben Sie direkt einen Bundle-JSON-Pfad.
</ParamField>
<ParamField path="--export" type="boolean">
  Eine teilbare ZIP-Datei mit Supportdiagnosen schreiben, statt Stabilitätsdetails auszugeben.
</ParamField>
<ParamField path="--output <path>" type="string">
  Ausgabepfad für `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Privacy and bundle behavior">
    - Datensätze behalten Betriebsmetadaten: Ereignisnamen, Zählwerte, Bytegrößen, Speichermesswerte, Warteschlangen-/Sitzungszustand, Kanal-/Plugin-Namen und redigierte Sitzungszusammenfassungen. Sie behalten keinen Chattext, keine Webhook-Bodys, Tool-Ausgaben, rohen Anfrage- oder Antwort-Bodys, Tokens, Cookies, geheimen Werte, Hostnamen oder rohen Sitzungs-IDs. Setzen Sie `diagnostics.enabled: false`, um den Rekorder vollständig zu deaktivieren.
    - Bei fatalen Gateway-Beendigungen, Shutdown-Timeouts und Neustart-Startfehlern schreibt OpenClaw denselben Diagnosesnapshot nach `~/.openclaw/logs/stability/openclaw-stability-*.json`, wenn der Rekorder Ereignisse hat. Prüfen Sie das neueste Bundle mit `openclaw gateway stability --bundle latest`; `--limit`, `--type` und `--since-seq` gelten auch für Bundle-Ausgaben.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Schreibt eine lokale Diagnose-ZIP-Datei, die zum Anhängen an Fehlerberichte gedacht ist. Informationen zum Datenschutzmodell und zu Bundle-Inhalten finden Sie unter [Diagnoseexport](/de/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Ausgabe-ZIP-Pfad. Standardmäßig ein Supportexport im Zustandsverzeichnis.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Maximale Anzahl bereinigter Logzeilen, die eingeschlossen werden.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  Maximale Anzahl von Logbytes, die geprüft werden.
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
  Suche nach persistiertem Stabilitäts-Bundle überspringen.
</ParamField>
<ParamField path="--json" type="boolean">
  Geschriebenen Pfad, Größe und Manifest als JSON ausgeben.
</ParamField>

Der Export enthält ein Manifest, eine Markdown-Zusammenfassung, die Konfigurationsform, bereinigte Konfigurationsdetails, bereinigte Logzusammenfassungen, bereinigte Gateway-Status-/Health-Snapshots und das neueste Stabilitäts-Bundle, sofern eines existiert.

Er ist zum Teilen gedacht. Er behält Betriebsdetails, die beim Debuggen helfen, etwa sichere OpenClaw-Logfelder, Subsystemnamen, Statuscodes, Dauern, konfigurierte Modi, Ports, Plugin-IDs, Provider-IDs, nicht geheime Feature-Einstellungen und redigierte betriebliche Logmeldungen. Er lässt Chattext, Webhook-Bodys, Tool-Ausgaben, Zugangsdaten, Cookies, Konto-/Nachrichtenkennungen, Prompt-/Anweisungstext, Hostnamen und geheime Werte aus oder redigiert sie. Wenn eine LogTape-artige Nachricht wie Benutzer-/Chat-/Tool-Payload-Text aussieht, behält der Export nur bei, dass eine Nachricht ausgelassen wurde, plus ihre Byteanzahl.

### `gateway status`

`gateway status` zeigt den Gateway-Dienst (launchd/systemd/schtasks) sowie optional einen Probe von Konnektivität/Authentifizierungsfähigkeit.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Ein explizites Probe-Ziel hinzufügen. Konfigurierte Remote- und localhost-Ziele werden weiterhin geprüft.
</ParamField>
<ParamField path="--token <token>" type="string">
  Token-Authentifizierung für den Probe.
</ParamField>
<ParamField path="--password <password>" type="string">
  Passwort-Authentifizierung für den Probe.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Probe-Timeout.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  Konnektivitäts-Probe überspringen (nur Dienstansicht).
</ParamField>
<ParamField path="--deep" type="boolean">
  Auch Dienste auf Systemebene scannen.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Den standardmäßigen Konnektivitäts-Probe zu einem Lese-Probe hochstufen und mit einem von null verschiedenen Code beenden, wenn dieser Lese-Probe fehlschlägt. Kann nicht mit `--no-probe` kombiniert werden.
</ParamField>

<AccordionGroup>
  <Accordion title="Statussemantik">
    - `gateway status` bleibt für Diagnosen verfügbar, selbst wenn die lokale CLI-Konfiguration fehlt oder ungültig ist.
    - Standardmäßiges `gateway status` weist Dienststatus, WebSocket-Verbindung und die zum Handshake-Zeitpunkt sichtbare Authentifizierungsfähigkeit nach. Es weist keine Lese-/Schreib-/Admin-Operationen nach.
    - Diagnoseprüfungen verändern bei erstmaliger Geräteauthentifizierung nichts: Sie verwenden ein vorhandenes zwischengespeichertes Geräte-Token erneut, wenn eines existiert, erstellen aber keine neue CLI-Geräteidentität oder schreibgeschützten Geräte-Pairing-Datensatz nur zur Statusprüfung.
    - `gateway status` löst konfigurierte Auth-SecretRefs nach Möglichkeit für Prüf-Authentifizierung auf.
    - Wenn ein erforderlicher Auth-SecretRef in diesem Befehlspfad nicht aufgelöst wird, meldet `gateway status --json` `rpc.authWarning`, wenn Prüf-Konnektivität/Authentifizierung fehlschlägt; übergeben Sie `--token`/`--password` explizit oder lösen Sie zuerst die Secret-Quelle auf.
    - Wenn die Prüfung erfolgreich ist, werden Warnungen zu nicht aufgelösten Auth-Refs unterdrückt, um falsch positive Meldungen zu vermeiden.
    - Verwenden Sie `--require-rpc` in Skripten und Automatisierung, wenn ein lauschender Dienst nicht ausreicht und auch RPC-Aufrufe mit Leseumfang fehlerfrei sein müssen.
    - `--deep` fügt einen Best-Effort-Scan nach zusätzlichen launchd/systemd/schtasks-Installationen hinzu. Wenn mehrere Gateway-ähnliche Dienste erkannt werden, gibt die menschenlesbare Ausgabe Bereinigungshinweise aus und warnt, dass die meisten Setups ein Gateway pro Maschine ausführen sollten.
    - Die menschenlesbare Ausgabe enthält den aufgelösten Datei-Logpfad sowie eine Momentaufnahme der CLI-gegen-Dienst-Konfigurationspfade/-Gültigkeit, um Profil- oder State-Dir-Abweichungen zu diagnostizieren.

  </Accordion>
  <Accordion title="Linux-systemd-Prüfungen auf Auth-Drift">
    - Bei Linux-systemd-Installationen lesen Prüfungen auf Dienst-Auth-Drift sowohl `Environment=`- als auch `EnvironmentFile=`-Werte aus der Unit (einschließlich `%h`, zitierter Pfade, mehrerer Dateien und optionaler `-`-Dateien).
    - Drift-Prüfungen lösen `gateway.auth.token`-SecretRefs mithilfe der zusammengeführten Laufzeitumgebung auf (zuerst Dienstbefehlsumgebung, dann Prozessumgebung als Fallback).
    - Wenn Token-Auth nicht effektiv aktiv ist (explizites `gateway.auth.mode` von `password`/`none`/`trusted-proxy` oder nicht gesetzter Modus, bei dem Passwort gewinnen kann und kein Token-Kandidat gewinnen kann), überspringen Token-Drift-Prüfungen die Auflösung des Konfigurations-Tokens.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` ist der Befehl zum „Alles debuggen“. Er prüft immer:

- Ihr konfiguriertes Remote-Gateway (falls gesetzt), und
- localhost (loopback) **auch wenn Remote konfiguriert ist**.

Wenn Sie `--url` übergeben, wird dieses explizite Ziel vor beiden hinzugefügt. Die menschenlesbare Ausgabe kennzeichnet die Ziele als:

- `URL (explicit)`
- `Remote (configured)` oder `Remote (configured, inactive)`
- `Local loopback`

<Note>
Wenn mehrere Gateways erreichbar sind, gibt der Befehl alle aus. Mehrere Gateways werden unterstützt, wenn Sie isolierte Profile/Ports verwenden (z. B. einen Rettungs-Bot), aber die meisten Installationen führen weiterhin ein einzelnes Gateway aus.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="Interpretation">
    - `Reachable: yes` bedeutet, dass mindestens ein Ziel eine WebSocket-Verbindung akzeptiert hat.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` meldet, was die Prüfung über Auth nachweisen konnte. Dies ist von Erreichbarkeit getrennt.
    - `Read probe: ok` bedeutet, dass Detail-RPC-Aufrufe mit Leseumfang (`health`/`status`/`system-presence`/`config.get`) ebenfalls erfolgreich waren.
    - `Read probe: limited - missing scope: operator.read` bedeutet, dass die Verbindung erfolgreich war, aber RPC mit Leseumfang eingeschränkt ist. Dies wird als **beeinträchtigte** Erreichbarkeit gemeldet, nicht als vollständiger Fehler.
    - `Read probe: failed` nach `Connect: ok` bedeutet, dass das Gateway die WebSocket-Verbindung akzeptiert hat, aber nachfolgende Lesediagnosen mit Timeout beendet wurden oder fehlgeschlagen sind. Auch dies ist **beeinträchtigte** Erreichbarkeit, kein unerreichbares Gateway.
    - Wie `gateway status` verwendet die Prüfung vorhandene zwischengespeicherte Geräteauthentifizierung erneut, erstellt aber keine erstmalige Geräteidentität oder keinen Pairing-Status.
    - Der Exit-Code ist nur dann ungleich null, wenn kein geprüftes Ziel erreichbar ist.

  </Accordion>
  <Accordion title="JSON-Ausgabe">
    Oberste Ebene:

    - `ok`: mindestens ein Ziel ist erreichbar.
    - `degraded`: mindestens ein Ziel hat eine Verbindung akzeptiert, aber die vollständige Detail-RPC-Diagnose nicht abgeschlossen.
    - `capability`: beste über erreichbare Ziele gesehene Fähigkeit (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` oder `unknown`).
    - `primaryTargetId`: bestes Ziel, das in dieser Reihenfolge als aktiver Gewinner behandelt werden soll: explizite URL, SSH-Tunnel, konfiguriertes Remote-Ziel, dann local loopback.
    - `warnings[]`: Best-Effort-Warndatensätze mit `code`, `message` und optionalen `targetIds`.
    - `network`: Hinweise zu local loopback-/Tailnet-URLs, abgeleitet aus aktueller Konfiguration und Host-Netzwerk.
    - `discovery.timeoutMs` und `discovery.count`: das tatsächliche Discovery-Budget/die tatsächliche Ergebnisanzahl, die für diesen Prüfdurchlauf verwendet wurde.

    Pro Ziel (`targets[].connect`):

    - `ok`: Erreichbarkeit nach Verbindungsaufbau + Einstufung als beeinträchtigt.
    - `rpcOk`: vollständiger Detail-RPC-Erfolg.
    - `scopeLimited`: Detail-RPC ist wegen fehlendem Operator-Umfang fehlgeschlagen.

    Pro Ziel (`targets[].auth`):

    - `role`: in `hello-ok` gemeldete Auth-Rolle, wenn verfügbar.
    - `scopes`: in `hello-ok` gemeldete gewährte Umfänge, wenn verfügbar.
    - `capability`: die für dieses Ziel angezeigte Auth-Fähigkeitsklassifizierung.

  </Accordion>
  <Accordion title="Häufige Warncodes">
    - `ssh_tunnel_failed`: SSH-Tunnel-Einrichtung ist fehlgeschlagen; der Befehl ist auf direkte Prüfungen zurückgefallen.
    - `multiple_gateways`: mehr als ein Ziel war erreichbar; dies ist ungewöhnlich, es sei denn, Sie führen absichtlich isolierte Profile aus, z. B. einen Rettungs-Bot.
    - `auth_secretref_unresolved`: ein konfigurierter Auth-SecretRef konnte für ein fehlgeschlagenes Ziel nicht aufgelöst werden.
    - `probe_scope_limited`: WebSocket-Verbindung war erfolgreich, aber die Leseprüfung wurde durch fehlendes `operator.read` eingeschränkt.

  </Accordion>
</AccordionGroup>

#### Remote über SSH (Parität mit Mac-App)

Der macOS-App-Modus „Remote over SSH“ verwendet eine lokale Portweiterleitung, sodass das Remote-Gateway (das möglicherweise nur an loopback gebunden ist) unter `ws://127.0.0.1:<port>` erreichbar wird.

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
  Wählt den zuerst gefundenen Gateway-Host als SSH-Ziel aus dem aufgelösten Discovery-Endpunkt (`local.` plus die konfigurierte Wide-Area-Domain, falls vorhanden). Reine TXT-Hinweise werden ignoriert.
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
  Hauptsächlich für Agentenartige RPCs, die Zwischenereignisse vor einer finalen Nutzlast streamen.
</ParamField>
<ParamField path="--json" type="boolean">
  Maschinenlesbare JSON-Ausgabe.
</ParamField>

<Note>
`--params` muss gültiges JSON sein.
</Note>

## Gateway-Dienst verwalten

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

### Mit Wrapper installieren

Verwenden Sie `--wrapper`, wenn der verwaltete Dienst über ein anderes ausführbares Programm starten muss, zum Beispiel ein
Secrets-Manager-Shim oder ein Run-as-Helfer. Der Wrapper erhält die normalen Gateway-Argumente und ist
dafür verantwortlich, letztlich `openclaw` oder Node mit diesen Argumenten auszuführen.

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

Sie können den Wrapper auch über die Umgebung setzen. `gateway install` validiert, dass der Pfad eine
ausführbare Datei ist, schreibt den Wrapper in die Dienst-`ProgramArguments` und persistiert
`OPENCLAW_WRAPPER` in der Dienstumgebung für spätere erzwungene Neuinstallationen, Updates und doctor-
Reparaturen.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

Um einen persistierten Wrapper zu entfernen, leeren Sie `OPENCLAW_WRAPPER` während der Neuinstallation:

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="Befehlsoptionen">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway uninstall|start|stop|restart`: `--json`

  </Accordion>
  <Accordion title="Lifecycle-Verhalten">
    - Verwenden Sie `gateway restart`, um einen verwalteten Dienst neu zu starten. Verketten Sie nicht `gateway stop` und `gateway start` als Restart-Ersatz; unter macOS deaktiviert `gateway stop` absichtlich den LaunchAgent, bevor er gestoppt wird.
    - Lifecycle-Befehle akzeptieren `--json` für Skripting.

  </Accordion>
  <Accordion title="Auth und SecretRefs zur Installationszeit">
    - Wenn Token-Auth ein Token erfordert und `gateway.auth.token` SecretRef-verwaltet ist, validiert `gateway install`, dass der SecretRef auflösbar ist, persistiert das aufgelöste Token aber nicht in Dienstumgebungsmetadaten.
    - Wenn Token-Auth ein Token erfordert und der konfigurierte Token-SecretRef nicht aufgelöst ist, schlägt die Installation geschlossen fehl, statt Fallback-Klartext zu persistieren.
    - Für Passwort-Auth bei `gateway run` bevorzugen Sie `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` oder ein SecretRef-gestütztes `gateway.auth.password` gegenüber inline `--password`.
    - Im abgeleiteten Auth-Modus lockert rein shellbasiertes `OPENCLAW_GATEWAY_PASSWORD` die Installations-Token-Anforderungen nicht; verwenden Sie dauerhafte Konfiguration (`gateway.auth.password` oder Konfigurations-`env`), wenn Sie einen verwalteten Dienst installieren.
    - Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, wird die Installation blockiert, bis der Modus explizit gesetzt ist.

  </Accordion>
</AccordionGroup>

## Gateways entdecken (Bonjour)

`gateway discover` scannt nach Gateway-Beacons (`_openclaw-gw._tcp`).

- Multicast-DNS-SD: `local.`
- Unicast-DNS-SD (Wide-Area Bonjour): Wählen Sie eine Domain (Beispiel: `openclaw.internal.`) und richten Sie Split-DNS + einen DNS-Server ein; siehe [Bonjour](/de/gateway/bonjour).

Nur Gateways mit aktivierter Bonjour-Discovery (Standard) veröffentlichen den Beacon.

Wide-Area-Discovery-Datensätze enthalten (TXT):

- `role` (Gateway-Rollenhinweis)
- `transport` (Transporthinweis, z. B. `gateway`)
- `gatewayPort` (WebSocket-Port, normalerweise `18789`)
- `sshPort` (optional; Clients verwenden standardmäßig `22` als SSH-Ziel, wenn dies fehlt)
- `tailnetDns` (MagicDNS-Hostname, wenn verfügbar)
- `gatewayTls` / `gatewayTlsSha256` (TLS aktiviert + Zertifikat-Fingerabdruck)
- `cliPath` (Remote-Installationshinweis, der in die Wide-Area-Zone geschrieben wird)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Timeout pro Befehl (Durchsuchen/Auflösen).
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
- `wsUrl` in der JSON-Ausgabe wird aus dem aufgelösten Service-Endpunkt abgeleitet, nicht aus reinen TXT-Hinweisen wie `lanHost` oder `tailnetDns`.
- Bei `local.`-mDNS werden `sshPort` und `cliPath` nur angekündigt, wenn `discovery.mdns.mode` auf `full` gesetzt ist. Wide-Area-DNS-SD schreibt weiterhin `cliPath`; `sshPort` bleibt auch dort optional.

</Note>

## Verwandt

- [CLI-Referenz](/de/cli)
- [Gateway-Runbook](/de/gateway)
