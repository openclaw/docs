---
read_when:
    - Gateway über die CLI ausführen (Entwicklung oder Server)
    - Debugging von Gateway-Authentifizierung, Bind-Modi und Konnektivität
    - Gateways über Bonjour erkennen (lokales + Wide-Area-DNS-SD)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — Gateways ausführen, abfragen und ermitteln
title: Gateway
x-i18n:
    generated_at: "2026-05-02T22:17:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: f7f948a8f0ee6e065afa02f354e690ad5cc4f71bdb8b8674f1b0396c439ab242
    source_path: cli/gateway.md
    workflow: 16
---

Das Gateway ist der WebSocket-Server von OpenClaw (Kanäle, Nodes, Sitzungen, Hooks). Die Unterbefehle auf dieser Seite gehören zu `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Bonjour-Erkennung" href="/de/gateway/bonjour">
    Lokale Einrichtung für mDNS + Wide-Area-DNS-SD.
  </Card>
  <Card title="Erkennungsübersicht" href="/de/gateway/discovery">
    Wie OpenClaw Gateways bekannt macht und findet.
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
    - Standardmäßig verweigert das Gateway den Start, sofern `gateway.mode=local` nicht in `~/.openclaw/openclaw.json` gesetzt ist. Verwenden Sie `--allow-unconfigured` für Ad-hoc-/Entwicklungsläufe.
    - `openclaw onboard --mode local` und `openclaw setup` sollen `gateway.mode=local` schreiben. Wenn die Datei existiert, aber `gateway.mode` fehlt, behandeln Sie dies als beschädigte oder überschriebene Konfiguration und reparieren Sie sie, statt implizit lokalen Modus anzunehmen.
    - Wenn die Datei existiert und `gateway.mode` fehlt, behandelt das Gateway dies als verdächtigen Konfigurationsschaden und weigert sich, für Sie „lokal zu raten“.
    - Das Binden über Loopback hinaus ohne Authentifizierung ist blockiert (Sicherheitsleitplanke).
    - `SIGUSR1` löst einen In-Process-Neustart aus, wenn er autorisiert ist (`commands.restart` ist standardmäßig aktiviert; setzen Sie `commands.restart: false`, um manuellen Neustart zu blockieren, während Anwenden/Aktualisieren von Gateway-Tool/-Konfiguration weiterhin erlaubt bleibt).
    - `SIGINT`/`SIGTERM`-Handler stoppen den Gateway-Prozess, stellen aber keinen benutzerdefinierten Terminalzustand wieder her. Wenn Sie die CLI mit einer TUI oder Raw-Mode-Eingabe umschließen, stellen Sie das Terminal vor dem Beenden wieder her.

  </Accordion>
</AccordionGroup>

### Optionen

<ParamField path="--port <port>" type="number">
  WebSocket-Port (Standard kommt aus Konfiguration/Umgebung; üblicherweise `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  Bind-Modus des Listeners.
</ParamField>
<ParamField path="--auth <token|password>" type="string">
  Authentifizierungsmodus überschreiben.
</ParamField>
<ParamField path="--token <token>" type="string">
  Token überschreiben (setzt auch `OPENCLAW_GATEWAY_TOKEN` für den Prozess).
</ParamField>
<ParamField path="--password <password>" type="string">
  Passwort überschreiben.
</ParamField>
<ParamField path="--password-file <path>" type="string">
  Gateway-Passwort aus einer Datei lesen.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Gateway über Tailscale bereitstellen.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Tailscale-serve/funnel-Konfiguration beim Herunterfahren zurücksetzen.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Gateway-Start ohne `gateway.mode=local` in der Konfiguration erlauben. Umgeht die Startschutzprüfung nur für Ad-hoc-/Entwicklungs-Bootstrap; schreibt oder repariert die Konfigurationsdatei nicht.
</ParamField>
<ParamField path="--dev" type="boolean">
  Entwicklungskonfiguration + Arbeitsbereich erstellen, falls sie fehlen (überspringt BOOTSTRAP.md).
</ParamField>
<ParamField path="--reset" type="boolean">
  Entwicklungskonfiguration + Zugangsdaten + Sitzungen + Arbeitsbereich zurücksetzen (erfordert `--dev`).
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
  Rohereignisse des Modell-Streams in JSONL protokollieren.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  JSONL-Pfad für Roh-Streams.
</ParamField>

<Warning>
Inline angegebenes `--password` kann in lokalen Prozessauflistungen offengelegt werden. Verwenden Sie bevorzugt `--password-file`, Umgebungsvariablen oder ein durch SecretRef gestütztes `gateway.auth.password`.
</Warning>

### Startprofiling

- Setzen Sie `OPENCLAW_GATEWAY_STARTUP_TRACE=1`, um Phasenzeiten während des Gateway-Starts zu protokollieren, einschließlich `eventLoopMax`-Verzögerung je Phase und Plugin-Lookup-Table-Zeiten für installierten Index, Manifest-Registry, Startplanung und Owner-Map-Arbeit.
- Setzen Sie `OPENCLAW_DIAGNOSTICS=timeline` mit `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>`, um nach bestem Aufwand eine JSONL-Zeitachse der Startdiagnose für externe QA-Harnesses zu schreiben. Sie können das Flag auch mit `diagnostics.flags: ["timeline"]` in der Konfiguration aktivieren; der Pfad wird weiterhin über die Umgebung bereitgestellt. Fügen Sie `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` hinzu, um Event-Loop-Stichproben einzubeziehen.
- Führen Sie `pnpm test:startup:gateway -- --runs 5 --warmup 1` aus, um den Gateway-Start zu benchmarken. Der Benchmark zeichnet die erste Prozessausgabe, `/healthz`, `/readyz`, Starttrace-Zeiten, Event-Loop-Verzögerung und Zeitdetails der Plugin-Lookup-Table auf.

## Laufendes Gateway abfragen

Alle Abfragebefehle verwenden WebSocket-RPC.

<Tabs>
  <Tab title="Ausgabemodi">
    - Standard: menschenlesbar (farbig in TTY).
    - `--json`: maschinenlesbares JSON (ohne Styling/Spinner).
    - `--no-color` (oder `NO_COLOR=1`): ANSI deaktivieren, während das menschenlesbare Layout beibehalten wird.

  </Tab>
  <Tab title="Gemeinsame Optionen">
    - `--url <url>`: Gateway-WebSocket-URL.
    - `--token <token>`: Gateway-Token.
    - `--password <password>`: Gateway-Passwort.
    - `--timeout <ms>`: Timeout/Budget (variiert je Befehl).
    - `--expect-final`: auf eine „final“-Antwort warten (Agent-Aufrufe).

  </Tab>
</Tabs>

<Note>
Wenn Sie `--url` setzen, fällt die CLI nicht auf Konfigurations- oder Umgebungs-Zugangsdaten zurück. Übergeben Sie `--token` oder `--password` explizit. Fehlende explizite Zugangsdaten sind ein Fehler.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

Der HTTP-Endpunkt `/healthz` ist eine Liveness-Probe: Er antwortet, sobald der Server HTTP beantworten kann. Der HTTP-Endpunkt `/readyz` ist strenger und bleibt rot, solange Plugin-Sidecars beim Start, Kanäle oder konfigurierte Hooks sich noch stabilisieren. Lokale oder authentifizierte detaillierte Readiness-Antworten enthalten einen `eventLoop`-Diagnoseblock mit Event-Loop-Verzögerung, Event-Loop-Auslastung, CPU-Kernverhältnis und einem `degraded`-Flag.

### `gateway usage-cost`

Nutzungskostenübersichten aus Sitzungslogs abrufen.

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
  Maximale Anzahl aktueller Ereignisse, die aufgenommen werden (max. `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  Nach Diagnoseereignistyp filtern, etwa `payload.large` oder `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Nur Ereignisse nach einer Diagnose-Sequenznummer einbeziehen.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Ein persistiertes Stabilitäts-Bundle lesen, statt das laufende Gateway aufzurufen. Verwenden Sie `--bundle latest` (oder einfach `--bundle`) für das neueste Bundle im Zustandsverzeichnis, oder übergeben Sie direkt einen Bundle-JSON-Pfad.
</ParamField>
<ParamField path="--export" type="boolean">
  Eine teilbare Support-Diagnose-ZIP schreiben, statt Stabilitätsdetails auszugeben.
</ParamField>
<ParamField path="--output <path>" type="string">
  Ausgabepfad für `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Datenschutz und Bundle-Verhalten">
    - Datensätze bewahren operative Metadaten auf: Ereignisnamen, Zählwerte, Byte-Größen, Speichermesswerte, Warteschlangen-/Sitzungsstatus, Kanal-/Plugin-Namen und redigierte Sitzungszusammenfassungen. Sie bewahren keinen Chattext, keine Webhook-Nachrichtenkörper, keine Tool-Ausgaben, keine Rohinhalte von Anfragen oder Antworten, keine Token, Cookies, geheimen Werte, Hostnamen oder rohen Sitzungs-IDs auf. Setzen Sie `diagnostics.enabled: false`, um den Rekorder vollständig zu deaktivieren.
    - Bei fatalen Gateway-Beendigungen, Shutdown-Timeouts und Startfehlern nach einem Neustart schreibt OpenClaw denselben Diagnose-Snapshot nach `~/.openclaw/logs/stability/openclaw-stability-*.json`, wenn der Rekorder Ereignisse enthält. Prüfen Sie das neueste Bundle mit `openclaw gateway stability --bundle latest`; `--limit`, `--type` und `--since-seq` gelten auch für die Bundle-Ausgabe.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Eine lokale Diagnose-ZIP schreiben, die zum Anhängen an Fehlerberichte vorgesehen ist. Zum Datenschutzmodell und den Bundle-Inhalten siehe [Diagnoseexport](/de/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  ZIP-Ausgabepfad. Standard ist ein Support-Export im Zustandsverzeichnis.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Maximale Anzahl bereinigter Logzeilen, die aufgenommen werden.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  Maximale Anzahl zu prüfender Log-Bytes.
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

Der Export enthält ein Manifest, eine Markdown-Zusammenfassung, Konfigurationsstruktur, bereinigte Konfigurationsdetails, bereinigte Logzusammenfassungen, bereinigte Gateway-Status-/Health-Snapshots und das neueste Stabilitäts-Bundle, wenn eines vorhanden ist.

Er ist zum Teilen gedacht. Er bewahrt operative Details auf, die beim Debugging helfen, etwa unbedenkliche OpenClaw-Logfelder, Subsystemnamen, Statuscodes, Dauerwerte, konfigurierte Modi, Ports, Plugin-IDs, Provider-IDs, nicht geheime Feature-Einstellungen und redigierte operative Logmeldungen. Er lässt Chattext, Webhook-Nachrichtenkörper, Tool-Ausgaben, Zugangsdaten, Cookies, Konto-/Nachrichtenkennungen, Prompt-/Instruktionstext, Hostnamen und geheime Werte aus oder redigiert sie. Wenn eine Nachricht im LogTape-Stil wie Benutzer-/Chat-/Tool-Payload-Text aussieht, bewahrt der Export nur auf, dass eine Nachricht ausgelassen wurde, plus ihre Byte-Anzahl.

### `gateway status`

`gateway status` zeigt den Gateway-Dienst (launchd/systemd/schtasks) sowie optional eine Prüfung der Verbindungs-/Authentifizierungsfähigkeit.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Ein explizites Prüfziel hinzufügen. Konfiguriertes Remote-Ziel + localhost werden weiterhin geprüft.
</ParamField>
<ParamField path="--token <token>" type="string">
  Token-Authentifizierung für die Prüfung.
</ParamField>
<ParamField path="--password <password>" type="string">
  Passwort-Authentifizierung für die Prüfung.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Prüf-Timeout.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  Verbindungsprüfung überspringen (Nur-Dienst-Ansicht).
</ParamField>
<ParamField path="--deep" type="boolean">
  Auch Dienste auf Systemebene scannen.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Die standardmäßige Verbindungsprüfung zu einer Leseprüfung erweitern und mit einem Nicht-Null-Exitcode beenden, wenn diese Leseprüfung fehlschlägt. Kann nicht mit `--no-probe` kombiniert werden.
</ParamField>

<AccordionGroup>
  <Accordion title="Statussemantik">
    - `gateway status` bleibt für Diagnosen verfügbar, selbst wenn die lokale CLI-Konfiguration fehlt oder ungültig ist.
    - Das standardmäßige `gateway status` weist den Servicestatus, die WebSocket-Verbindung und die beim Handshake sichtbare Authentifizierungsfähigkeit nach. Es weist keine Lese-/Schreib-/Admin-Operationen nach.
    - Diagnose-Probes verändern bei der erstmaligen Geräteauthentifizierung nichts: Sie verwenden ein vorhandenes zwischengespeichertes Geräte-Token erneut, falls eines existiert, erstellen aber keine neue CLI-Geräteidentität oder einen schreibgeschützten Geräte-Pairing-Eintrag nur zur Statusprüfung.
    - `gateway status` löst konfigurierte Auth-SecretRefs für Probe-Authentifizierung auf, wenn möglich.
    - Wenn ein erforderlicher Auth-SecretRef in diesem Befehlspfad nicht aufgelöst wird, meldet `gateway status --json` `rpc.authWarning`, wenn Probe-Konnektivität/-Authentifizierung fehlschlägt; übergeben Sie `--token`/`--password` explizit oder lösen Sie zuerst die Secret-Quelle auf.
    - Wenn die Probe erfolgreich ist, werden Warnungen zu nicht aufgelösten Auth-Refs unterdrückt, um Fehlalarme zu vermeiden.
    - Verwenden Sie `--require-rpc` in Skripten und Automatisierung, wenn ein lauschender Service nicht ausreicht und auch RPC-Aufrufe mit Lese-Scope fehlerfrei sein müssen.
    - `--deep` fügt einen Best-Effort-Scan nach zusätzlichen launchd/systemd/schtasks-Installationen hinzu. Wenn mehrere gateway-ähnliche Services erkannt werden, gibt die menschenlesbare Ausgabe Hinweise zur Bereinigung aus und warnt, dass die meisten Setups einen Gateway pro Maschine ausführen sollten.
    - Die menschenlesbare Ausgabe enthält den aufgelösten Pfad der Datei-Logs sowie eine Momentaufnahme der CLI-gegen-Service-Konfigurationspfade/-Gültigkeit, um Profil- oder Statusverzeichnis-Abweichungen zu diagnostizieren.

  </Accordion>
  <Accordion title="Auth-Drift-Prüfungen für Linux systemd">
    - Bei Linux-systemd-Installationen lesen Service-Auth-Drift-Prüfungen sowohl `Environment=`- als auch `EnvironmentFile=`-Werte aus der Unit (einschließlich `%h`, zitierter Pfade, mehrerer Dateien und optionaler `-`-Dateien).
    - Drift-Prüfungen lösen `gateway.auth.token`-SecretRefs mithilfe der zusammengeführten Laufzeit-Umgebung auf (zuerst Service-Befehlsumgebung, dann Prozessumgebung als Fallback).
    - Wenn Token-Authentifizierung nicht effektiv aktiv ist (expliziter `gateway.auth.mode` von `password`/`none`/`trusted-proxy` oder nicht gesetzter Modus, bei dem Passwort gewinnen kann und kein Token-Kandidat gewinnen kann), überspringen Token-Drift-Prüfungen die Auflösung des Konfigurationstokens.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` ist der Befehl zum „Alles debuggen“. Er probt immer:

- Ihren konfigurierten Remote-Gateway (falls gesetzt), und
- localhost (loopback) **auch wenn Remote konfiguriert ist**.

Wenn Sie `--url` übergeben, wird dieses explizite Ziel vor beiden hinzugefügt. Die menschenlesbare Ausgabe beschriftet die Ziele als:

- `URL (explicit)`
- `Remote (configured)` oder `Remote (configured, inactive)`
- `Local loopback`

<Note>
Wenn mehrere Gateways erreichbar sind, gibt der Befehl alle aus. Mehrere Gateways werden unterstützt, wenn Sie isolierte Profile/Ports verwenden (z. B. einen Rettungs-Bot), aber die meisten Installationen führen weiterhin einen einzelnen Gateway aus.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="Interpretation">
    - `Reachable: yes` bedeutet, dass mindestens ein Ziel eine WebSocket-Verbindung akzeptiert hat.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` meldet, was die Probe über die Authentifizierung nachweisen konnte. Das ist von der Erreichbarkeit getrennt.
    - `Read probe: ok` bedeutet, dass Detail-RPC-Aufrufe mit Lese-Scope (`health`/`status`/`system-presence`/`config.get`) ebenfalls erfolgreich waren.
    - `Read probe: limited - missing scope: operator.read` bedeutet, dass die Verbindung erfolgreich war, RPC mit Lese-Scope aber eingeschränkt ist. Dies wird als **beeinträchtigte** Erreichbarkeit gemeldet, nicht als vollständiger Fehler.
    - `Read probe: failed` nach `Connect: ok` bedeutet, dass der Gateway die WebSocket-Verbindung akzeptiert hat, die nachfolgenden Lesediagnosen aber eine Zeitüberschreitung hatten oder fehlgeschlagen sind. Auch dies ist **beeinträchtigte** Erreichbarkeit, kein unerreichbarer Gateway.
    - Wie `gateway status` verwendet die Probe vorhandene zwischengespeicherte Geräteauthentifizierung erneut, erstellt aber keine erstmalige Geräteidentität oder Pairing-Zustand.
    - Der Exit-Code ist nur dann ungleich null, wenn kein geprüftes Ziel erreichbar ist.

  </Accordion>
  <Accordion title="JSON-Ausgabe">
    Oberste Ebene:

    - `ok`: mindestens ein Ziel ist erreichbar.
    - `degraded`: mindestens ein Ziel hat eine Verbindung akzeptiert, aber die vollständige Detail-RPC-Diagnose nicht abgeschlossen.
    - `capability`: beste über erreichbare Ziele beobachtete Fähigkeit (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` oder `unknown`).
    - `primaryTargetId`: bestes Ziel, das in dieser Reihenfolge als aktiver Gewinner behandelt werden soll: explizite URL, SSH-Tunnel, konfigurierter Remote, dann local loopback.
    - `warnings[]`: Best-Effort-Warnungsdatensätze mit `code`, `message` und optionalen `targetIds`.
    - `network`: local loopback-/Tailnet-URL-Hinweise, abgeleitet aus der aktuellen Konfiguration und Host-Netzwerkumgebung.
    - `discovery.timeoutMs` und `discovery.count`: das tatsächlich verwendete Discovery-Budget bzw. die Ergebnisanzahl für diesen Probe-Durchlauf.

    Pro Ziel (`targets[].connect`):

    - `ok`: Erreichbarkeit nach Verbindung + Einstufung als beeinträchtigt.
    - `rpcOk`: vollständiger Detail-RPC-Erfolg.
    - `scopeLimited`: Detail-RPC ist wegen fehlendem Operator-Scope fehlgeschlagen.

    Pro Ziel (`targets[].auth`):

    - `role`: Auth-Rolle, wie in `hello-ok` gemeldet, wenn verfügbar.
    - `scopes`: gewährte Scopes, wie in `hello-ok` gemeldet, wenn verfügbar.
    - `capability`: die offengelegte Auth-Fähigkeitseinstufung für dieses Ziel.

  </Accordion>
  <Accordion title="Häufige Warncodes">
    - `ssh_tunnel_failed`: SSH-Tunnel-Einrichtung fehlgeschlagen; der Befehl ist auf direkte Probes zurückgefallen.
    - `multiple_gateways`: mehr als ein Ziel war erreichbar; dies ist ungewöhnlich, sofern Sie nicht absichtlich isolierte Profile ausführen, etwa einen Rettungs-Bot.
    - `auth_secretref_unresolved`: ein konfigurierter Auth-SecretRef konnte für ein fehlgeschlagenes Ziel nicht aufgelöst werden.
    - `probe_scope_limited`: WebSocket-Verbindung erfolgreich, aber die Lese-Probe wurde durch fehlendes `operator.read` eingeschränkt.

  </Accordion>
</AccordionGroup>

#### Remote über SSH (Parität zur Mac-App)

Der Modus „Remote over SSH“ der macOS-App verwendet eine lokale Portweiterleitung, sodass der Remote-Gateway (der möglicherweise nur an loopback gebunden ist) unter `ws://127.0.0.1:<port>` erreichbar wird.

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
  Wählt den ersten gefundenen Gateway-Host als SSH-Ziel aus dem aufgelösten Discovery-Endpunkt (`local.` plus die konfigurierte Wide-Area-Domain, falls vorhanden). Reine TXT-Hinweise werden ignoriert.
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
  JSON-Objekt-Zeichenfolge für Parameter.
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
  Zeitüberschreitungsbudget.
</ParamField>
<ParamField path="--expect-final" type="boolean">
  Hauptsächlich für agentenartige RPCs, die Zwischenereignisse vor einer finalen Payload streamen.
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

### Mit einem Wrapper installieren

Verwenden Sie `--wrapper`, wenn der verwaltete Service über ein anderes ausführbares Programm starten muss, zum Beispiel einen
Secrets-Manager-Shim oder einen Run-as-Helfer. Der Wrapper erhält die normalen Gateway-Argumente und ist
dafür verantwortlich, am Ende `openclaw` oder Node mit diesen Argumenten auszuführen.

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
ausführbare Datei ist, schreibt den Wrapper in die Service-`ProgramArguments` und persistiert
`OPENCLAW_WRAPPER` in der Service-Umgebung für spätere erzwungene Neuinstallationen, Updates und Doctor-
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
    - `gateway restart`: `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start|stop`: `--json`

  </Accordion>
  <Accordion title="Lebenszyklusverhalten">
    - Verwenden Sie `gateway restart`, um einen verwalteten Service neu zu starten. Verketten Sie `gateway stop` und `gateway start` nicht als Ersatz für einen Neustart; unter macOS deaktiviert `gateway stop` absichtlich den LaunchAgent, bevor er gestoppt wird.
    - `gateway restart --wait 30s` überschreibt das konfigurierte Drain-Budget für diesen Neustart. Zahlen ohne Einheit sind Millisekunden; Einheiten wie `s`, `m` und `h` werden akzeptiert. `--wait 0` wartet unbegrenzt.
    - `gateway restart --force` überspringt den Drain für aktive Arbeit und startet sofort neu. Verwenden Sie dies, wenn ein Operator die aufgelisteten Task-Blocker bereits geprüft hat und den Gateway jetzt wieder verfügbar machen möchte.
    - Lebenszyklusbefehle akzeptieren `--json` für Skripting.

  </Accordion>
  <Accordion title="Auth und SecretRefs zur Installationszeit">
    - Wenn Token-Authentifizierung ein Token erfordert und `gateway.auth.token` SecretRef-verwaltet ist, prüft `gateway install`, dass der SecretRef auflösbar ist, persistiert das aufgelöste Token aber nicht in Service-Umgebungsmetadaten.
    - Wenn Token-Authentifizierung ein Token erfordert und der konfigurierte Token-SecretRef nicht aufgelöst ist, schlägt die Installation geschlossen fehl, statt Fallback-Klartext zu persistieren.
    - Für Passwortauthentifizierung bei `gateway run` bevorzugen Sie `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` oder ein SecretRef-gestütztes `gateway.auth.password` gegenüber inline `--password`.
    - Im abgeleiteten Auth-Modus lockert ein nur in der Shell gesetztes `OPENCLAW_GATEWAY_PASSWORD` die Token-Anforderungen für die Installation nicht; verwenden Sie dauerhafte Konfiguration (`gateway.auth.password` oder Konfigurations-`env`), wenn Sie einen verwalteten Service installieren.
    - Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, wird die Installation blockiert, bis der Modus explizit gesetzt ist.

  </Accordion>
</AccordionGroup>

## Gateways entdecken (Bonjour)

`gateway discover` sucht nach Gateway-Beacons (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): Wählen Sie eine Domain (Beispiel: `openclaw.internal.`) und richten Sie Split-DNS + einen DNS-Server ein; siehe [Bonjour](/de/gateway/bonjour).

Nur Gateways mit aktivierter Bonjour-Discovery (Standard) kündigen den Beacon an.

Wide-Area-Discovery-Datensätze enthalten (TXT):

- `role` (Gateway-Rollenhinweis)
- `transport` (Transporthinweis, z. B. `gateway`)
- `gatewayPort` (WebSocket-Port, normalerweise `18789`)
- `sshPort` (optional; Clients setzen SSH-Ziele standardmäßig auf `22`, wenn er fehlt)
- `tailnetDns` (MagicDNS-Hostname, wenn verfügbar)
- `gatewayTls` / `gatewayTlsSha256` (TLS aktiviert + Zertifikatsfingerabdruck)
- `cliPath` (Remote-Installationshinweis, der in die Wide-Area-Zone geschrieben wird)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Timeout pro Befehl (browse/resolve).
</ParamField>
<ParamField path="--json" type="boolean">
  Maschinenlesbare Ausgabe (deaktiviert auch Formatierung/Spinner).
</ParamField>

Beispiele:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- Die CLI scannt `local.` sowie die konfigurierte Wide-Area-Domain, wenn eine aktiviert ist.
- `wsUrl` in der JSON-Ausgabe wird aus dem aufgelösten Service-Endpunkt abgeleitet, nicht aus reinen TXT-Hinweisen wie `lanHost` oder `tailnetDns`.
- Bei `local.` mDNS werden `sshPort` und `cliPath` nur gesendet, wenn `discovery.mdns.mode` auf `full` gesetzt ist. Wide-Area-DNS-SD schreibt weiterhin `cliPath`; `sshPort` bleibt auch dort optional.

</Note>

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Gateway-Runbook](/de/gateway)
