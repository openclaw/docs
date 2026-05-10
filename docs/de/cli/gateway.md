---
read_when:
    - Gateway über die CLI ausführen (Entwicklung oder Server)
    - Fehlerbehebung bei Gateway-Authentifizierung, Bind-Modi und Konnektivität
    - Gateways über Bonjour erkennen (lokales + Wide-Area-DNS-SD)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — Gateways starten, abfragen und ermitteln
title: Gateway
x-i18n:
    generated_at: "2026-05-10T19:28:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7e436abba80f643f3b0bfc0a7d2f344beb18c3849a49e5d0825767ae7a81ae1d
    source_path: cli/gateway.md
    workflow: 16
---

Der Gateway ist der WebSocket-Server von OpenClaw (Kanäle, Nodes, Sitzungen, Hooks). Die Unterbefehle auf dieser Seite befinden sich unter `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Bonjour discovery" href="/de/gateway/bonjour">
    Einrichtung von lokalem mDNS + Wide-Area DNS-SD.
  </Card>
  <Card title="Discovery overview" href="/de/gateway/discovery">
    Wie OpenClaw Gateways bekannt macht und findet.
  </Card>
  <Card title="Configuration" href="/de/gateway/configuration">
    Gateway-Konfigurationsschlüssel der obersten Ebene.
  </Card>
</CardGroup>

## Gateway ausführen

Starten Sie einen lokalen Gateway-Prozess:

```bash
openclaw gateway
```

Vordergrund-Alias:

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="Startup behavior">
    - Standardmäßig verweigert der Gateway den Start, wenn `gateway.mode=local` nicht in `~/.openclaw/openclaw.json` gesetzt ist. Verwenden Sie `--allow-unconfigured` für Ad-hoc-/Entwicklungsläufe.
    - Von `openclaw onboard --mode local` und `openclaw setup` wird erwartet, dass sie `gateway.mode=local` schreiben. Wenn die Datei existiert, aber `gateway.mode` fehlt, behandeln Sie dies als beschädigte oder überschriebene Konfiguration und reparieren Sie sie, statt implizit den lokalen Modus anzunehmen.
    - Wenn die Datei existiert und `gateway.mode` fehlt, behandelt der Gateway dies als verdächtige Konfigurationsbeschädigung und weigert sich, für Sie „lokal zu raten“.
    - Binden über loopback hinaus ohne Authentifizierung wird blockiert (Sicherheitsleitplanke).
    - `SIGUSR1` löst bei Autorisierung einen prozessinternen Neustart aus (`commands.restart` ist standardmäßig aktiviert; setzen Sie `commands.restart: false`, um manuelle Neustarts zu blockieren, während Gateway-Tool-/Konfigurations-Apply-/Update-Vorgänge weiterhin erlaubt bleiben).
    - `SIGINT`-/`SIGTERM`-Handler stoppen den Gateway-Prozess, stellen jedoch keinen benutzerdefinierten Terminalzustand wieder her. Wenn Sie die CLI mit einer TUI oder Eingabe im Raw-Modus einbetten, stellen Sie das Terminal vor dem Beenden wieder her.

  </Accordion>
</AccordionGroup>

### Optionen

<ParamField path="--port <port>" type="number">
  WebSocket-Port (Standardwert kommt aus Konfiguration/Umgebung; normalerweise `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  Bind-Modus des Listeners.
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
  Tailscale-serve-/funnel-Konfiguration beim Herunterfahren zurücksetzen.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Gateway-Start ohne `gateway.mode=local` in der Konfiguration erlauben. Umgeht die Startschutzprüfung nur für Ad-hoc-/Entwicklungs-Bootstraps; schreibt oder repariert die Konfigurationsdatei nicht.
</ParamField>
<ParamField path="--dev" type="boolean">
  Eine Entwicklungskonfiguration + Workspace erstellen, falls sie fehlen (überspringt BOOTSTRAP.md).
</ParamField>
<ParamField path="--reset" type="boolean">
  Entwicklungskonfiguration + Zugangsdaten + Sitzungen + Workspace zurücksetzen (erfordert `--dev`).
</ParamField>
<ParamField path="--force" type="boolean">
  Vor dem Start jeden bestehenden Listener auf dem ausgewählten Port beenden.
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
  Rohe Modell-Stream-Ereignisse in jsonl loggen.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Pfad für rohen Stream in jsonl.
</ParamField>

## Gateway neu starten

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
```

`openclaw gateway restart --safe` fordert den laufenden Gateway auf, aktive OpenClaw-Arbeit vor dem Neustart vorab zu prüfen. Wenn Warteschlangenoperationen, Antwortzustellung, eingebettete Läufe oder Task-Läufe aktiv sind, meldet der Gateway die Blocker, fasst doppelte sichere Neustartanforderungen zusammen und startet neu, sobald die aktive Arbeit abgearbeitet ist. Das einfache `restart` behält aus Kompatibilitätsgründen das bestehende Verhalten des Service-Managers bei. Verwenden Sie `--force` nur, wenn Sie ausdrücklich den sofortigen Überschreibungspfad wünschen.

`openclaw gateway restart --safe --skip-deferral` führt denselben OpenClaw-bewussten koordinierten Neustart wie `--safe` aus, umgeht jedoch die Aufschubprüfung für aktive Arbeit, sodass der Gateway den Neustart sofort ausgibt, auch wenn Blocker gemeldet werden. Verwenden Sie dies als Operator-Ausweg, wenn ein Aufschub durch einen hängengebliebenen Task-Lauf festgehalten wird und `--safe` allein unbegrenzt warten würde. `--skip-deferral` erfordert `--safe`.

<Warning>
Inline-`--password` kann in lokalen Prozesslisten offengelegt werden. Bevorzugen Sie `--password-file`, Umgebungsvariablen oder ein SecretRef-gestütztes `gateway.auth.password`.
</Warning>

### Startprofiling

- Setzen Sie `OPENCLAW_GATEWAY_STARTUP_TRACE=1`, um Phasen-Timings während des Gateway-Starts zu loggen, einschließlich `eventLoopMax`-Verzögerung pro Phase und Plugin-Lookup-Table-Timings für Installed-Index, Manifest-Registry, Startplanung und Owner-Map-Arbeit.
- Setzen Sie `OPENCLAW_DIAGNOSTICS=timeline` mit `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>`, um eine Best-Effort-JSONL-Startdiagnose-Timeline für externe QA-Harnesses zu schreiben. Sie können das Flag auch mit `diagnostics.flags: ["timeline"]` in der Konfiguration aktivieren; der Pfad wird weiterhin über die Umgebung bereitgestellt. Fügen Sie `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` hinzu, um Event-Loop-Samples einzubeziehen.
- Führen Sie `pnpm test:startup:gateway -- --runs 5 --warmup 1` aus, um den Gateway-Start zu benchmarken. Der Benchmark erfasst die erste Prozessausgabe, `/healthz`, `/readyz`, Start-Trace-Timings, Event-Loop-Verzögerung und Timing-Details der Plugin-Lookup-Table.

## Einen laufenden Gateway abfragen

Alle Abfragebefehle verwenden WebSocket-RPC.

<Tabs>
  <Tab title="Output modes">
    - Standard: menschenlesbar (farbig im TTY).
    - `--json`: maschinenlesbares JSON (kein Styling/Spinner).
    - `--no-color` (oder `NO_COLOR=1`): ANSI deaktivieren, während das menschenlesbare Layout beibehalten wird.

  </Tab>
  <Tab title="Shared options">
    - `--url <url>`: Gateway-WebSocket-URL.
    - `--token <token>`: Gateway-Token.
    - `--password <password>`: Gateway-Passwort.
    - `--timeout <ms>`: Timeout/Budget (variiert je nach Befehl).
    - `--expect-final`: auf eine „finale“ Antwort warten (Agent-Aufrufe).

  </Tab>
</Tabs>

<Note>
Wenn Sie `--url` setzen, greift die CLI nicht auf Konfigurations- oder Umgebungs-Zugangsdaten zurück. Übergeben Sie `--token` oder `--password` explizit. Fehlende explizite Zugangsdaten sind ein Fehler.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

Der HTTP-Endpoint `/healthz` ist ein Liveness-Probe: Er gibt zurück, sobald der Server HTTP beantworten kann. Der HTTP-Endpoint `/readyz` ist strenger und bleibt rot, solange Start-Plugin-Sidecars, Kanäle oder konfigurierte Hooks noch initialisiert werden. Lokale oder authentifizierte detaillierte Bereitschaftsantworten enthalten einen `eventLoop`-Diagnoseblock mit Event-Loop-Verzögerung, Event-Loop-Auslastung, CPU-Kern-Verhältnis und einem `degraded`-Flag.

### `gateway usage-cost`

Nutzungskosten-Zusammenfassungen aus Sitzungslogs abrufen.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  Anzahl der einzubeziehenden Tage.
</ParamField>

### `gateway stability`

Den aktuellen Diagnosestabilitäts-Recorder von einem laufenden Gateway abrufen.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  Maximale Anzahl aktueller Ereignisse, die einbezogen werden (max. `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  Nach Diagnoseereignistyp filtern, etwa `payload.large` oder `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Nur Ereignisse nach einer Diagnose-Sequenznummer einbeziehen.
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
  <Accordion title="Privacy and bundle behavior">
    - Aufzeichnungen behalten operative Metadaten: Ereignisnamen, Zählwerte, Bytegrößen, Speicherwerte, Warteschlangen-/Sitzungszustand, Kanal-/Plugin-Namen und redigierte Sitzungszusammenfassungen. Sie speichern keinen Chattext, keine Webhook-Bodies, Tool-Ausgaben, rohen Anfrage- oder Antwort-Bodies, Tokens, Cookies, geheimen Werte, Hostnamen oder rohen Sitzungs-IDs. Setzen Sie `diagnostics.enabled: false`, um den Recorder vollständig zu deaktivieren.
    - Bei fatalen Gateway-Beendigungen, Shutdown-Timeouts und Neustart-Startfehlern schreibt OpenClaw denselben Diagnose-Snapshot nach `~/.openclaw/logs/stability/openclaw-stability-*.json`, wenn der Recorder Ereignisse enthält. Prüfen Sie das neueste Bundle mit `openclaw gateway stability --bundle latest`; `--limit`, `--type` und `--since-seq` gelten ebenfalls für die Bundle-Ausgabe.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Eine lokale Diagnose-ZIP schreiben, die zum Anhängen an Fehlerberichte vorgesehen ist. Informationen zum Datenschutzmodell und Bundle-Inhalt finden Sie unter [Diagnoseexport](/de/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Ausgabe-ZIP-Pfad. Standardmäßig ein Support-Export unter dem Zustandsverzeichnis.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Maximale Anzahl bereinigter Logzeilen, die einbezogen werden.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  Maximale Anzahl zu prüfender Logbytes.
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

Der Export enthält ein Manifest, eine Markdown-Zusammenfassung, die Konfigurationsstruktur, bereinigte Konfigurationsdetails, bereinigte Logzusammenfassungen, bereinigte Gateway-Status-/Health-Snapshots und das neueste Stabilitäts-Bundle, sofern eines vorhanden ist.

Er ist zum Teilen vorgesehen. Er behält operative Details, die beim Debugging helfen, etwa sichere OpenClaw-Logfelder, Subsystemnamen, Statuscodes, Dauern, konfigurierte Modi, Ports, Plugin-IDs, Provider-IDs, nicht geheime Feature-Einstellungen und redigierte operative Logmeldungen. Er lässt Chattext, Webhook-Bodies, Tool-Ausgaben, Zugangsdaten, Cookies, Konto-/Nachrichtenkennungen, Prompt-/Anweisungstext, Hostnamen und geheime Werte aus oder redigiert sie. Wenn eine LogTape-artige Meldung wie Benutzer-/Chat-/Tool-Payload-Text aussieht, behält der Export nur bei, dass eine Meldung ausgelassen wurde, plus deren Byteanzahl.

### `gateway status`

`gateway status` zeigt den Gateway-Dienst (launchd/systemd/schtasks) plus einen optionalen Probe für Konnektivität/Authentifizierungsfähigkeit.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Fügt ein explizites Prüfziel hinzu. Konfigurierte Remote- und localhost-Ziele werden weiterhin geprüft.
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
  Überspringt die Konnektivitätsprüfung (nur Dienstansicht).
</ParamField>
<ParamField path="--deep" type="boolean">
  Prüft auch Dienste auf Systemebene.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Erweitert die standardmäßige Konnektivitätsprüfung zu einer Leseprüfung und beendet den Vorgang mit einem Exit-Code ungleich null, wenn diese Leseprüfung fehlschlägt. Kann nicht mit `--no-probe` kombiniert werden.
</ParamField>

<AccordionGroup>
  <Accordion title="Status-Semantik">
    - `gateway status` bleibt für Diagnosen verfügbar, selbst wenn die lokale CLI-Konfiguration fehlt oder ungültig ist.
    - Der standardmäßige `gateway status` weist Dienststatus, WebSocket-Verbindung und die beim Handshake sichtbare Authentifizierungsfähigkeit nach. Er weist keine Lese-/Schreib-/Admin-Vorgänge nach.
    - Diagnoseprüfungen verändern bei der erstmaligen Geräteauthentifizierung nichts: Sie verwenden ein vorhandenes zwischengespeichertes Geräte-Token erneut, wenn eines existiert, erstellen aber keine neue CLI-Geräteidentität oder keinen schreibgeschützten Gerätekopplungsdatensatz, nur um den Status zu prüfen.
    - `gateway status` löst konfigurierte Authentifizierungs-SecretRefs für die Prüf-Authentifizierung auf, wenn möglich.
    - Wenn ein erforderlicher Authentifizierungs-SecretRef in diesem Befehlspfad nicht aufgelöst wird, meldet `gateway status --json` `rpc.authWarning`, wenn Prüf-Konnektivität/-Authentifizierung fehlschlägt; übergeben Sie `--token`/`--password` explizit oder lösen Sie zuerst die Secret-Quelle auf.
    - Wenn die Prüfung erfolgreich ist, werden Warnungen zu nicht aufgelösten Auth-Refs unterdrückt, um Fehlalarme zu vermeiden.
    - Verwenden Sie `--require-rpc` in Skripten und Automatisierung, wenn ein lauschender Dienst nicht ausreicht und auch RPC-Aufrufe mit Leseberechtigung fehlerfrei sein müssen.
    - `--deep` fügt eine Best-Effort-Prüfung auf zusätzliche launchd-/systemd-/schtasks-Installationen hinzu. Wenn mehrere Gateway-ähnliche Dienste erkannt werden, gibt die menschenlesbare Ausgabe Bereinigungshinweise aus und warnt, dass die meisten Setups ein Gateway pro Maschine ausführen sollten.
    - `--deep` meldet außerdem eine kürzliche Neustartübergabe des Gateway-Supervisors, wenn der Dienstprozess sauber für einen Neustart durch einen externen Supervisor beendet wurde.
    - Die menschenlesbare Ausgabe enthält den aufgelösten Datei-Logpfad sowie eine Momentaufnahme der CLI- und Dienst-Konfigurationspfade/-gültigkeit, um Profil- oder Zustandsverzeichnis-Abweichungen zu diagnostizieren.

  </Accordion>
  <Accordion title="Linux-systemd-Prüfungen auf Authentifizierungsabweichungen">
    - Bei Linux-systemd-Installationen lesen Prüfungen auf Dienst-Authentifizierungsabweichungen sowohl `Environment=`- als auch `EnvironmentFile=`-Werte aus der Unit (einschließlich `%h`, zitierter Pfade, mehrerer Dateien und optionaler `-`-Dateien).
    - Abweichungsprüfungen lösen `gateway.auth.token`-SecretRefs mithilfe der zusammengeführten Laufzeitumgebung auf (zuerst Dienstbefehlsumgebung, dann Prozessumgebung als Fallback).
    - Wenn Token-Authentifizierung nicht effektiv aktiv ist (expliziter `gateway.auth.mode` von `password`/`none`/`trusted-proxy` oder nicht gesetzter Modus, bei dem das Passwort gewinnen kann und kein Token-Kandidat gewinnen kann), überspringen Token-Abweichungsprüfungen die Auflösung des Konfigurations-Tokens.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` ist der Befehl zum „alles debuggen“. Er prüft immer:

- Ihr konfiguriertes Remote-Gateway (falls gesetzt) und
- localhost (local loopback) **auch wenn Remote konfiguriert ist**.

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
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` meldet, was die Prüfung zur Authentifizierung nachweisen konnte. Dies ist von der Erreichbarkeit getrennt.
    - `Read probe: ok` bedeutet, dass auch Detail-RPC-Aufrufe mit Leseberechtigung (`health`/`status`/`system-presence`/`config.get`) erfolgreich waren.
    - `Read probe: limited - missing scope: operator.read` bedeutet, dass die Verbindung erfolgreich war, der RPC mit Leseberechtigung aber eingeschränkt ist. Dies wird als **eingeschränkte** Erreichbarkeit gemeldet, nicht als vollständiger Fehler.
    - `Read probe: failed` nach `Connect: ok` bedeutet, dass das Gateway die WebSocket-Verbindung akzeptiert hat, die anschließenden Lesediagnosen aber eine Zeitüberschreitung hatten oder fehlgeschlagen sind. Auch dies ist **eingeschränkte** Erreichbarkeit, kein unerreichbares Gateway.
    - Wie `gateway status` verwendet die Prüfung vorhandene zwischengespeicherte Geräteauthentifizierung erneut, erstellt aber keine erstmalige Geräteidentität oder keinen Kopplungszustand.
    - Der Exit-Code ist nur dann ungleich null, wenn kein geprüftes Ziel erreichbar ist.

  </Accordion>
  <Accordion title="JSON-Ausgabe">
    Oberste Ebene:

    - `ok`: Mindestens ein Ziel ist erreichbar.
    - `degraded`: Mindestens ein Ziel hat eine Verbindung akzeptiert, aber keine vollständigen Detail-RPC-Diagnosen abgeschlossen.
    - `capability`: beste über erreichbare Ziele gesehene Fähigkeit (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` oder `unknown`).
    - `primaryTargetId`: bestes Ziel, das in dieser Reihenfolge als aktiver Gewinner behandelt werden soll: explizite URL, SSH-Tunnel, konfigurierte Remote-Adresse, dann local loopback.
    - `warnings[]`: Best-Effort-Warnungsdatensätze mit `code`, `message` und optionalen `targetIds`.
    - `network`: local loopback-/Tailnet-URL-Hinweise, abgeleitet aus der aktuellen Konfiguration und dem Host-Netzwerk.
    - `discovery.timeoutMs` und `discovery.count`: das tatsächliche Discovery-Budget und die Ergebnisanzahl, die für diesen Prüfungsdurchlauf verwendet wurden.

    Pro Ziel (`targets[].connect`):

    - `ok`: Erreichbarkeit nach Verbindung + eingeschränkter Klassifizierung.
    - `rpcOk`: vollständiger Detail-RPC-Erfolg.
    - `scopeLimited`: Detail-RPC ist wegen fehlender Operator-Berechtigung fehlgeschlagen.

    Pro Ziel (`targets[].auth`):

    - `role`: Authentifizierungsrolle, die in `hello-ok` gemeldet wurde, sofern verfügbar.
    - `scopes`: gewährte Berechtigungen, die in `hello-ok` gemeldet wurden, sofern verfügbar.
    - `capability`: die sichtbare Klassifizierung der Authentifizierungsfähigkeit für dieses Ziel.

  </Accordion>
  <Accordion title="Häufige Warncodes">
    - `ssh_tunnel_failed`: Einrichtung des SSH-Tunnels ist fehlgeschlagen; der Befehl ist auf direkte Prüfungen zurückgefallen.
    - `multiple_gateways`: Mehr als ein Ziel war erreichbar; dies ist ungewöhnlich, es sei denn, Sie führen absichtlich isolierte Profile aus, z. B. einen Rettungs-Bot.
    - `auth_secretref_unresolved`: Ein konfigurierter Authentifizierungs-SecretRef konnte für ein fehlgeschlagenes Ziel nicht aufgelöst werden.
    - `probe_scope_limited`: WebSocket-Verbindung war erfolgreich, aber die Leseprüfung wurde durch fehlendes `operator.read` eingeschränkt.

  </Accordion>
</AccordionGroup>

#### Remote über SSH (Parität zur Mac-App)

Der macOS-App-Modus „Remote over SSH“ verwendet eine lokale Portweiterleitung, damit das Remote-Gateway (das möglicherweise nur an loopback gebunden ist) unter `ws://127.0.0.1:<port>` erreichbar wird.

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
  Wählt den ersten gefundenen Gateway-Host als SSH-Ziel aus dem aufgelösten Discovery-Endpunkt aus (`local.` plus die konfigurierte Wide-Area-Domain, falls vorhanden). Nur-TXT-Hinweise werden ignoriert.
</ParamField>

Konfiguration (optional, wird als Standardwerte verwendet):

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
  Hauptsächlich für agentenartige RPCs, die Zwischenereignisse vor einer finalen Nutzlast streamen.
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

### Mit einem Wrapper installieren

Verwenden Sie `--wrapper`, wenn der verwaltete Dienst über eine andere ausführbare Datei gestartet werden muss, zum Beispiel über einen
Secrets-Manager-Shim oder einen Run-as-Helfer. Der Wrapper erhält die normalen Gateway-Argumente und ist
dafür verantwortlich, schließlich `openclaw` oder Node mit diesen Argumenten auszuführen.

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

Sie können den Wrapper auch über die Umgebung festlegen. `gateway install` validiert, dass der Pfad eine
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
    - `gateway restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start`: `--json`
    - `gateway stop`: `--disable`, `--json`

  </Accordion>
  <Accordion title="Lebenszyklusverhalten">
    - Verwenden Sie `gateway restart`, um einen verwalteten Dienst neu zu starten. Verketten Sie `gateway stop` und `gateway start` nicht als Ersatz für einen Neustart.
    - Unter macOS verwendet `gateway stop` standardmäßig `launchctl bootout`, wodurch der LaunchAgent aus der aktuellen Startsitzung entfernt wird, ohne eine Deaktivierung dauerhaft zu speichern — die automatische KeepAlive-Wiederherstellung bleibt für zukünftige Abstürze aktiv, und `gateway start` aktiviert den Dienst wieder sauber ohne ein manuelles `launchctl enable`. Übergeben Sie `--disable`, um KeepAlive und RunAtLoad dauerhaft zu unterdrücken, sodass der Gateway erst beim nächsten expliziten `gateway start` erneut startet; verwenden Sie dies, wenn ein manueller Stopp Neustarts des Systems überdauern soll.
    - `gateway restart --safe` bittet den laufenden Gateway, aktive OpenClaw-Arbeit vorab zu prüfen und den Neustart aufzuschieben, bis Antwortzustellung, eingebettete Ausführungen und Task-Ausführungen abgearbeitet sind. `--safe` kann nicht mit `--force` oder `--wait` kombiniert werden.
    - `gateway restart --wait 30s` überschreibt das konfigurierte Drain-Budget für den Neustart für diesen Neustart. Reine Zahlen sind Millisekunden; Einheiten wie `s`, `m` und `h` werden akzeptiert. `--wait 0` wartet unbegrenzt.
    - `gateway restart --safe --skip-deferral` führt den OpenClaw-bewussten sicheren Neustart aus, umgeht jedoch das Aufschub-Gate, sodass der Gateway den Neustart sofort auslöst, selbst wenn Blocker gemeldet werden. Dies ist ein Ausweg für Operatoren bei Aufschüben durch hängengebliebene Task-Ausführungen; erfordert `--safe`.
    - `gateway restart --force` überspringt das Abarbeiten aktiver Arbeit und startet sofort neu. Verwenden Sie dies, wenn ein Operator die aufgeführten Task-Blocker bereits geprüft hat und den Gateway jetzt wieder verfügbar machen möchte.
    - Lebenszyklusbefehle akzeptieren `--json` für Skripting.

  </Accordion>
  <Accordion title="Auth und SecretRefs zur Installationszeit">
    - Wenn Token-Auth ein Token erfordert und `gateway.auth.token` per SecretRef verwaltet wird, validiert `gateway install`, dass der SecretRef auflösbar ist, speichert das aufgelöste Token jedoch nicht dauerhaft in den Metadaten der Dienstumgebung.
    - Wenn Token-Auth ein Token erfordert und der konfigurierte Token-SecretRef nicht aufgelöst werden kann, schlägt die Installation geschlossen fehl, statt Klartext als Fallback dauerhaft zu speichern.
    - Für Passwort-Auth bei `gateway run` bevorzugen Sie `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` oder ein SecretRef-gestütztes `gateway.auth.password` gegenüber inline angegebenem `--password`.
    - Im abgeleiteten Auth-Modus lockert ein nur in der Shell gesetztes `OPENCLAW_GATEWAY_PASSWORD` die Token-Anforderungen für die Installation nicht; verwenden Sie dauerhafte Konfiguration (`gateway.auth.password` oder config `env`), wenn Sie einen verwalteten Dienst installieren.
    - Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, wird die Installation blockiert, bis der Modus explizit gesetzt wurde.

  </Accordion>
</AccordionGroup>

## Gateways entdecken (Bonjour)

`gateway discover` sucht nach Gateway-Beacons (`_openclaw-gw._tcp`).

- Multicast-DNS-SD: `local.`
- Unicast-DNS-SD (Wide-Area Bonjour): Wählen Sie eine Domain (Beispiel: `openclaw.internal.`) und richten Sie Split-DNS sowie einen DNS-Server ein; siehe [Bonjour](/de/gateway/bonjour).

Nur Gateways mit aktivierter Bonjour-Erkennung (Standard) bewerben den Beacon.

Wide-Area-Erkennungsdatensätze enthalten (TXT):

- `role` (Hinweis auf die Gateway-Rolle)
- `transport` (Transporthinweis, z. B. `gateway`)
- `gatewayPort` (WebSocket-Port, normalerweise `18789`)
- `sshPort` (optional; Clients verwenden standardmäßig `22` als SSH-Ziel, wenn dieser Wert fehlt)
- `tailnetDns` (MagicDNS-Hostname, sofern verfügbar)
- `gatewayTls` / `gatewayTlsSha256` (TLS aktiviert + Zertifikat-Fingerabdruck)
- `cliPath` (Hinweis für Remote-Installation, der in die Wide-Area-Zone geschrieben wird)

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
- Die CLI durchsucht `local.` sowie die konfigurierte Wide-Area-Domain, wenn eine aktiviert ist.
- `wsUrl` in der JSON-Ausgabe wird aus dem aufgelösten Dienst-Endpunkt abgeleitet, nicht aus reinen TXT-Hinweisen wie `lanHost` oder `tailnetDns`.
- Bei `local.` mDNS werden `sshPort` und `cliPath` nur gesendet, wenn `discovery.mdns.mode` auf `full` gesetzt ist. Wide-Area-DNS-SD schreibt weiterhin `cliPath`; `sshPort` bleibt auch dort optional.

</Note>

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Gateway-Runbook](/de/gateway)
