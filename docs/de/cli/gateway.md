---
read_when:
    - Gateway über die CLI ausführen (Entwicklung oder Server)
    - Gateway-Authentifizierung, Bind-Modi und Konnektivität debuggen
    - Gateways über Bonjour erkennen (lokal + Wide-Area-DNS-SD)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — Gateways ausführen, abfragen und ermitteln
title: Gateway
x-i18n:
    generated_at: "2026-06-27T17:18:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: de9aaeff1b592e867ffadf49a076e6e0f7069b966244b19d4eed91993c3ad738
    source_path: cli/gateway.md
    workflow: 16
---

Das Gateway ist der WebSocket-Server von OpenClaw (Kanäle, Knoten, Sitzungen, Hooks). Unterbefehle auf dieser Seite befinden sich unter `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Bonjour-Erkennung" href="/de/gateway/bonjour">
    Lokale mDNS- + Wide-Area-DNS-SD-Einrichtung.
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
    - Standardmäßig verweigert das Gateway den Start, sofern `gateway.mode=local` nicht in `~/.openclaw/openclaw.json` gesetzt ist. Verwenden Sie `--allow-unconfigured` für Ad-hoc-/Entwicklungsläufe.
    - Von `openclaw onboard --mode local` und `openclaw setup` wird erwartet, dass sie `gateway.mode=local` schreiben. Wenn die Datei existiert, aber `gateway.mode` fehlt, behandeln Sie das als beschädigte oder überschriebene Konfiguration und reparieren Sie sie, anstatt den lokalen Modus implizit anzunehmen.
    - Wenn die Datei existiert und `gateway.mode` fehlt, behandelt das Gateway dies als verdächtigen Konfigurationsschaden und verweigert es, für Sie „lokal zu raten“.
    - Binden über Loopback hinaus ohne Authentifizierung wird blockiert (Sicherheitsleitplanke).
    - `lan`, `tailnet` und `custom` werden derzeit über reine IPv4-BYOH-Pfade aufgelöst.
    - IPv6-only-BYOH wird auf diesem Pfad derzeit nicht nativ unterstützt. Verwenden Sie einen IPv4-Sidecar oder Proxy, wenn der Host selbst IPv6-only ist.
    - `SIGUSR1` löst bei Autorisierung einen prozessinternen Neustart aus (`commands.restart` ist standardmäßig aktiviert; setzen Sie `commands.restart: false`, um manuelle Neustarts zu blockieren, während Anwenden/Aktualisieren über Gateway-Tool/Konfiguration weiterhin erlaubt bleibt).
    - `SIGINT`-/`SIGTERM`-Handler stoppen den Gateway-Prozess, stellen aber keinen benutzerdefinierten Terminalzustand wieder her. Wenn Sie die CLI mit einer TUI oder Raw-Mode-Eingabe umschließen, stellen Sie das Terminal vor dem Beenden wieder her.

  </Accordion>
</AccordionGroup>

### Optionen

<ParamField path="--port <port>" type="number">
  WebSocket-Port (Standard kommt aus Konfiguration/Umgebung; normalerweise `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  Listener-Bindemodus. `lan`, `tailnet` und `custom` werden derzeit über reine IPv4-Pfade aufgelöst.
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
  Gateway-Passwort aus einer Datei lesen.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Gateway über Tailscale bereitstellen.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Tailscale-Serve-/Funnel-Konfiguration beim Herunterfahren zurücksetzen.
</ParamField>
<ParamField path="--bind custom + gateway.customBindHost" type="string">
  Erwartet derzeit eine IPv4-Adresse. Für IPv6-only-BYOH platzieren Sie einen IPv4-Sidecar oder Proxy vor dem Gateway und richten OpenClaw auf diesen IPv4-Endpunkt.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Gateway-Start ohne `gateway.mode=local` in der Konfiguration erlauben. Umgeht die Startschutzprüfung nur für Ad-hoc-/Entwicklungs-Bootstrap; schreibt oder repariert die Konfigurationsdatei nicht.
</ParamField>
<ParamField path="--dev" type="boolean">
  Entwicklungskonfiguration und Workspace erstellen, falls sie fehlen (überspringt BOOTSTRAP.md).
</ParamField>
<ParamField path="--reset" type="boolean">
  Entwicklungskonfiguration, Anmeldedaten, Sitzungen und Workspace zurücksetzen (erfordert `--dev`).
</ParamField>
<ParamField path="--force" type="boolean">
  Vor dem Start jeden vorhandenen Listener am ausgewählten Port beenden.
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
  Rohe Modell-Stream-Ereignisse nach jsonl protokollieren.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Pfad für Rohstream-jsonl.
</ParamField>

## Gateway neu starten

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
```

`openclaw gateway restart --safe` bittet das laufende Gateway, aktive OpenClaw-Arbeit vor dem Neustart vorab zu prüfen. Wenn Warteschlangenoperationen, Antwortzustellung, eingebettete Läufe oder Aufgabenläufe aktiv sind, meldet das Gateway die Blocker, führt doppelte sichere Neustartanforderungen zusammen und startet neu, sobald die aktive Arbeit abgearbeitet ist. Einfaches `restart` behält aus Kompatibilitätsgründen das bestehende Service-Manager-Verhalten bei. Verwenden Sie `--force` nur, wenn Sie ausdrücklich den sofortigen Überschreibungspfad wünschen.

`openclaw gateway restart --safe --skip-deferral` führt denselben OpenClaw-bewussten koordinierten Neustart wie `--safe` aus, umgeht aber die Zurückstellungssperre für aktive Arbeit, sodass das Gateway den Neustart sofort ausgibt, selbst wenn Blocker gemeldet werden. Verwenden Sie dies als Operator-Notausstieg, wenn eine Zurückstellung durch einen hängenden Aufgabenlauf festgehalten wurde und `--safe` allein unbegrenzt warten würde. `--skip-deferral` erfordert `--safe`.

<Warning>
Inline-`--password` kann in lokalen Prozesslisten offengelegt werden. Bevorzugen Sie `--password-file`, Umgebung oder ein SecretRef-gestütztes `gateway.auth.password`.
</Warning>

### Gateway-Profiling

- Setzen Sie `OPENCLAW_GATEWAY_STARTUP_TRACE=1`, um Phasenzeiten während des Gateway-Starts zu protokollieren, einschließlich `eventLoopMax`-Verzögerung pro Phase und Plugin-Lookup-Table-Zeiten für Installationsindex, Manifest-Registry, Startplanung und Owner-Map-Arbeit.
- Setzen Sie `OPENCLAW_GATEWAY_RESTART_TRACE=1`, um neustartbezogene `restart trace:`-Zeilen für Neustartsignalverarbeitung, Abarbeitung aktiver Arbeit, Herunterfahrphasen, nächsten Start, Bereitschaftszeitpunkt und Speichermetriken zu protokollieren.
- Setzen Sie `OPENCLAW_DIAGNOSTICS=timeline` mit `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>`, um eine Best-Effort-JSONL-Startdiagnose-Timeline für externe QA-Harnesses zu schreiben. Sie können das Flag auch mit `diagnostics.flags: ["timeline"]` in der Konfiguration aktivieren; der Pfad wird weiterhin über die Umgebung bereitgestellt. Fügen Sie `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` hinzu, um Event-Loop-Samples einzubeziehen.
- Führen Sie zuerst `pnpm build` aus, dann `pnpm test:startup:gateway -- --runs 5 --warmup 1`, um den Gateway-Start gegen den gebauten CLI-Einstieg zu benchmarken. Der Benchmark zeichnet erste Prozessausgabe, `/healthz`, `/readyz`, Start-Trace-Zeiten, Event-Loop-Verzögerung und Plugin-Lookup-Table-Zeitdetails auf.
- Führen Sie zuerst `pnpm build` aus, dann `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5`, um den prozessinternen Gateway-Neustart gegen den gebauten CLI-Einstieg unter macOS oder Linux zu benchmarken. Der Neustart-Benchmark verwendet SIGUSR1, aktiviert sowohl Start- als auch Neustart-Traces im Kindprozess und zeichnet das nächste `/healthz`, das nächste `/readyz`, Ausfallzeit, Bereitschaftszeitpunkt, CPU, RSS und Neustart-Trace-Metriken auf.
- Behandeln Sie `/healthz` als Liveness und `/readyz` als nutzbare Bereitschaft. Trace-Zeilen und Benchmark-Ausgabe dienen der Owner-Zuordnung; behandeln Sie nicht eine einzelne Trace-Spanne oder ein einzelnes Sample als vollständige Performance-Schlussfolgerung.

## Ein laufendes Gateway abfragen

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
    - `--expect-final`: auf eine „finale“ Antwort warten (Agent-Aufrufe).

  </Tab>
</Tabs>

<Note>
Wenn Sie `--url` setzen, fällt die CLI nicht auf Konfigurations- oder Umgebungsanmeldedaten zurück. Übergeben Sie `--token` oder `--password` explizit. Fehlende explizite Anmeldedaten sind ein Fehler.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway health --port 18789
```

Der HTTP-Endpunkt `/healthz` ist ein Liveness-Probe: Er gibt zurück, sobald der Server HTTP beantworten kann. Der HTTP-Endpunkt `/readyz` ist strenger und bleibt rot, solange Start-Plugin-Sidecars, Kanäle oder konfigurierte Hooks noch zur Ruhe kommen. Lokale oder authentifizierte detaillierte Bereitschaftsantworten enthalten einen `eventLoop`-Diagnoseblock mit Event-Loop-Verzögerung, Event-Loop-Auslastung, CPU-Core-Verhältnis und einem `degraded`-Flag.

<ParamField path="--port <port>" type="number">
  Ziel ist ein lokales local loopback-Gateway auf diesem Port. Dies überschreibt `OPENCLAW_GATEWAY_URL` und `OPENCLAW_GATEWAY_PORT` für den Health-Aufruf.
</ParamField>

### `gateway usage-cost`

Nutzungskosten-Zusammenfassungen aus Sitzungslogs abrufen.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --agent work --json
openclaw gateway usage-cost --all-agents
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  Anzahl der einzubeziehenden Tage.
</ParamField>
<ParamField path="--agent <id>" type="string">
  Kostenübersicht auf eine konfigurierte Agent-ID begrenzen.
</ParamField>
<ParamField path="--all-agents" type="boolean">
  Kostenübersicht über alle konfigurierten Agenten aggregieren. Kann nicht mit `--agent` kombiniert werden.
</ParamField>

### `gateway stability`

Den aktuellen Diagnose-Stabilitätsrecorder von einem laufenden Gateway abrufen.

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
  Nach Diagnoseereignistyp filtern, z. B. `payload.large` oder `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Nur Ereignisse nach einer Diagnose-Sequenznummer einbeziehen.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Ein persistiertes Stabilitäts-Bundle lesen, anstatt das laufende Gateway aufzurufen. Verwenden Sie `--bundle latest` (oder nur `--bundle`) für das neueste Bundle im Zustandsverzeichnis, oder übergeben Sie direkt einen Bundle-JSON-Pfad.
</ParamField>
<ParamField path="--export" type="boolean">
  Eine teilbare Support-Diagnose-ZIP schreiben, anstatt Stabilitätsdetails auszugeben.
</ParamField>
<ParamField path="--output <path>" type="string">
  Ausgabepfad für `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Datenschutz- und Bundle-Verhalten">
    - Datensätze behalten operative Metadaten: Ereignisnamen, Zähler, Bytegrößen, Speicherwerte, Warteschlangen-/Sitzungszustand, Kanal-/Plugin-Namen und redigierte Sitzungszusammenfassungen. Sie behalten keine Chattexte, Webhook-Bodys, Tool-Ausgaben, Rohanforderungs- oder Rohantwortbodys, Tokens, Cookies, geheime Werte, Hostnamen oder rohen Sitzungs-IDs. Setzen Sie `diagnostics.enabled: false`, um den Recorder vollständig zu deaktivieren.
    - Bei fatalen Gateway-Beendigungen, Shutdown-Timeouts und Neustart-Startfehlern schreibt OpenClaw denselben Diagnose-Snapshot nach `~/.openclaw/logs/stability/openclaw-stability-*.json`, wenn der Recorder Ereignisse enthält. Prüfen Sie das neueste Bundle mit `openclaw gateway stability --bundle latest`; `--limit`, `--type` und `--since-seq` gelten ebenfalls für Bundle-Ausgaben.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Schreibt eine lokale Diagnose-ZIP, die zum Anhängen an Fehlerberichte vorgesehen ist. Informationen zum Datenschutzmodell und Bundle-Inhalt finden Sie unter [Diagnoseexport](/de/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Ausgabe-Zip-Pfad. Standardmäßig ein Support-Export unter dem Zustandsverzeichnis.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Maximale Anzahl bereinigter Protokollzeilen, die eingeschlossen werden.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  Maximale Anzahl von Protokollbytes, die untersucht werden.
</ParamField>
<ParamField path="--url <url>" type="string">
  Gateway WebSocket-URL für die Zustandsmomentaufnahme.
</ParamField>
<ParamField path="--token <token>" type="string">
  Gateway-Token für die Zustandsmomentaufnahme.
</ParamField>
<ParamField path="--password <password>" type="string">
  Gateway-Passwort für die Zustandsmomentaufnahme.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  Timeout für Status-/Zustandsmomentaufnahme.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  Suche nach dauerhaft gespeichertem Stabilitäts-Bundle überspringen.
</ParamField>
<ParamField path="--json" type="boolean">
  Geschriebenen Pfad, Größe und Manifest als JSON ausgeben.
</ParamField>

Der Export enthält ein Manifest, eine Markdown-Zusammenfassung, die Konfigurationsform, bereinigte Konfigurationsdetails, bereinigte Protokollzusammenfassungen, bereinigte Gateway-Status-/Zustandsmomentaufnahmen und das neueste Stabilitäts-Bundle, sofern eines vorhanden ist.

Er ist zum Teilen gedacht. Er behält Betriebsdetails, die beim Debugging helfen, etwa sichere OpenClaw-Protokollfelder, Subsystemnamen, Statuscodes, Dauern, konfigurierte Modi, Ports, Plugin-IDs, Provider-IDs, nicht geheime Funktionseinstellungen und geschwärzte Betriebsprotokollmeldungen. Er lässt Chattext, Webhook-Bodys, Tool-Ausgaben, Zugangsdaten, Cookies, Konto-/Nachrichtenkennungen, Prompt-/Anweisungstext, Hostnamen und geheime Werte aus oder schwärzt sie. Wenn eine LogTape-artige Meldung wie Nutzungs-/Chat-/Tool-Nutzlasttext aussieht, behält der Export nur bei, dass eine Meldung ausgelassen wurde, sowie deren Byteanzahl.

### `gateway status`

`gateway status` zeigt den Gateway-Dienst (launchd/systemd/schtasks) sowie optional eine Prüfung der Konnektivitäts-/Authentifizierungsfähigkeit.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Ein explizites Prüfziel hinzufügen. Konfigurierter Remote-Zugriff + localhost werden weiterhin geprüft.
</ParamField>
<ParamField path="--token <token>" type="string">
  Token-Authentifizierung für die Prüfung.
</ParamField>
<ParamField path="--password <password>" type="string">
  Passwortauthentifizierung für die Prüfung.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Prüf-Timeout.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  Konnektivitätsprüfung überspringen (nur Dienstansicht).
</ParamField>
<ParamField path="--deep" type="boolean">
  Auch Dienste auf Systemebene scannen.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Die standardmäßige Konnektivitätsprüfung zu einer Leseprüfung erweitern und mit einem Nicht-Null-Code beenden, wenn diese Leseprüfung fehlschlägt. Kann nicht mit `--no-probe` kombiniert werden.
</ParamField>

<AccordionGroup>
  <Accordion title="Statussemantik">
    - `gateway status` bleibt für Diagnosen verfügbar, auch wenn die lokale CLI-Konfiguration fehlt oder ungültig ist.
    - Das standardmäßige `gateway status` weist den Dienstzustand, WebSocket-Verbindung und die zur Handshake-Zeit sichtbare Authentifizierungsfähigkeit nach. Es weist keine Lese-/Schreib-/Admin-Vorgänge nach.
    - Diagnoseprüfungen verändern bei der erstmaligen Geräteauthentifizierung nichts: Sie verwenden ein vorhandenes zwischengespeichertes Geräte-Token erneut, sofern eines existiert, erstellen aber keine neue CLI-Geräteidentität oder keinen schreibgeschützten Gerätekopplungsdatensatz nur zur Statusprüfung.
    - `gateway status` löst konfigurierte Authentifizierungs-SecretRefs für die Prüf-Authentifizierung auf, wenn möglich.
    - Wenn ein erforderlicher Authentifizierungs-SecretRef in diesem Befehlspfad nicht aufgelöst ist, meldet `gateway status --json` `rpc.authWarning`, wenn Prüfkonnektivität/-authentifizierung fehlschlägt; übergeben Sie `--token`/`--password` explizit oder lösen Sie zuerst die geheime Quelle auf.
    - Wenn die Prüfung erfolgreich ist, werden Warnungen zu nicht aufgelösten Authentifizierungsreferenzen unterdrückt, um Fehlalarme zu vermeiden.
    - Wenn Prüfungen aktiviert sind, enthält die JSON-Ausgabe `gateway.version`, wenn der laufende Gateway sie meldet; `--require-rpc` kann auf die RPC-Nutzlast `status.runtimeVersion` zurückfallen, wenn die nachfolgende Handshake-Prüfung keine Versionsmetadaten bereitstellen kann.
    - Verwenden Sie `--require-rpc` in Skripten und Automatisierung, wenn ein lauschender Dienst nicht ausreicht und auch RPC-Aufrufe mit Lesebereich fehlerfrei sein müssen.
    - `--deep` fügt einen Best-Effort-Scan nach zusätzlichen launchd-/systemd-/schtasks-Installationen hinzu. Wenn mehrere gateway-artige Dienste erkannt werden, gibt die menschlich lesbare Ausgabe Bereinigungshinweise aus und warnt, dass die meisten Setups einen Gateway pro Maschine ausführen sollten.
    - `--deep` meldet auch eine aktuelle Gateway-Supervisor-Neustartübergabe, wenn der Dienstprozess sauber für einen Neustart durch einen externen Supervisor beendet wurde.
    - `--deep` führt die Konfigurationsvalidierung im Plugin-bewussten Modus (`pluginValidation: "full"`) aus und zeigt Warnungen aus konfigurierten Plugin-Manifesten an (zum Beispiel fehlende Metadaten zur Kanalkonfiguration), damit Installations- und Update-Smoke-Checks sie erkennen. Das standardmäßige `gateway status` behält den schnellen schreibgeschützten Pfad bei, der die Plugin-Validierung überspringt.
    - Die menschlich lesbare Ausgabe enthält den aufgelösten Dateiprotokollpfad sowie die Momentaufnahme der CLI-gegen-Dienst-Konfigurationspfade/-gültigkeit, um Profil- oder Zustandsverzeichnis-Abweichungen zu diagnostizieren.

  </Accordion>
  <Accordion title="Linux-systemd-Prüfungen auf Authentifizierungsdrift">
    - Bei Linux-systemd-Installationen lesen Prüfungen auf Dienst-Authentifizierungsdrift sowohl `Environment=`- als auch `EnvironmentFile=`-Werte aus der Unit (einschließlich `%h`, zitierter Pfade, mehrerer Dateien und optionaler `-`-Dateien).
    - Drift-Prüfungen lösen `gateway.auth.token`-SecretRefs mithilfe der zusammengeführten Laufzeitumgebung auf (zuerst Dienstbefehlsumgebung, dann Prozessumgebung als Fallback).
    - Wenn Token-Authentifizierung nicht effektiv aktiv ist (expliziter `gateway.auth.mode` von `password`/`none`/`trusted-proxy` oder nicht gesetzter Modus, bei dem Passwort gewinnen kann und kein Token-Kandidat gewinnen kann), überspringen Token-Drift-Prüfungen die Auflösung des Konfigurations-Tokens.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` ist der Befehl zum „alles debuggen“. Er prüft immer:

- Ihren konfigurierten Remote-Gateway (falls gesetzt) und
- localhost (loopback) **auch wenn Remote konfiguriert ist**.

Wenn Sie `--url` übergeben, wird dieses explizite Ziel vor beiden hinzugefügt. Die menschlich lesbare Ausgabe beschriftet die Ziele als:

- `URL (explicit)`
- `Remote (configured)` oder `Remote (configured, inactive)`
- `Local loopback`

<Note>
Wenn mehrere Prüfziele erreichbar sind, gibt er alle aus. Ein SSH-Tunnel, eine TLS-/Proxy-URL und eine konfigurierte Remote-URL können alle auf denselben Gateway zeigen, auch wenn sich ihre Transportports unterscheiden; `multiple_gateways` ist für unterschiedliche oder identitätsunklare erreichbare Gateways reserviert. Mehrere Gateways werden unterstützt, wenn Sie isolierte Profile verwenden (z. B. einen Rettungs-Bot), aber die meisten Installationen führen weiterhin einen einzelnen Gateway aus.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  Diesen Port für das lokale local loopback-Prüfziel und den Remote-Port des SSH-Tunnels verwenden. Ohne `--url` wählt dies das lokale local loopback-Ziel anstelle der konfigurierten Gateway-Umgebungs-URL, des Umgebungsports oder der Remote-Ziele aus.
</ParamField>

<AccordionGroup>
  <Accordion title="Interpretation">
    - `Reachable: yes` bedeutet, dass mindestens ein Ziel eine WebSocket-Verbindung akzeptiert hat.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` meldet, was die Prüfung über die Authentifizierung nachweisen konnte. Das ist getrennt von Erreichbarkeit.
    - `Read probe: ok` bedeutet, dass auch Detail-RPC-Aufrufe mit Lesebereich (`health`/`status`/`system-presence`/`config.get`) erfolgreich waren.
    - `Read probe: limited - missing scope: operator.read` bedeutet, dass die Verbindung erfolgreich war, RPC mit Lesebereich jedoch eingeschränkt ist. Dies wird als **beeinträchtigte** Erreichbarkeit gemeldet, nicht als vollständiger Fehler.
    - `Read probe: failed` nach `Connect: ok` bedeutet, dass der Gateway die WebSocket-Verbindung akzeptiert hat, die nachfolgenden Lesediagnosen jedoch eine Zeitüberschreitung hatten oder fehlgeschlagen sind. Auch dies ist **beeinträchtigte** Erreichbarkeit, kein unerreichbarer Gateway.
    - Wie `gateway status` verwendet die Prüfung vorhandene zwischengespeicherte Geräteauthentifizierung erneut, erstellt aber keine erstmalige Geräteidentität oder Kopplungszustand.
    - Der Exit-Code ist nur dann ungleich null, wenn kein geprüftes Ziel erreichbar ist.

  </Accordion>
  <Accordion title="JSON-Ausgabe">
    Oberste Ebene:

    - `ok`: Mindestens ein Ziel ist erreichbar.
    - `degraded`: Mindestens ein Ziel hat eine Verbindung akzeptiert, aber die vollständige Detail-RPC-Diagnose nicht abgeschlossen.
    - `capability`: Beste über erreichbare Ziele hinweg gesehene Fähigkeit (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` oder `unknown`).
    - `primaryTargetId`: Bestes Ziel, das in dieser Reihenfolge als aktiver Gewinner behandelt werden soll: explizite URL, SSH-Tunnel, konfigurierter Remote-Zugriff, dann local loopback.
    - `warnings[]`: Best-Effort-Warnungsdatensätze mit `code`, `message` und optionalen `targetIds`.
    - `network`: Hinweise zu local loopback-/Tailnet-URLs, abgeleitet aus aktueller Konfiguration und Host-Netzwerk.
    - `discovery.timeoutMs` und `discovery.count`: Das tatsächlich verwendete Discovery-Budget/die Ergebnisanzahl für diesen Prüfdurchlauf.

    Pro Ziel (`targets[].connect`):

    - `ok`: Erreichbarkeit nach Verbindungsaufbau + beeinträchtigte Klassifizierung.
    - `rpcOk`: Vollständiger Detail-RPC-Erfolg.
    - `scopeLimited`: Detail-RPC fehlgeschlagen wegen fehlendem Operator-Bereich.

    Pro Ziel (`targets[].auth`):

    - `role`: In `hello-ok` gemeldete Authentifizierungsrolle, sofern verfügbar.
    - `scopes`: In `hello-ok` gemeldete gewährte Bereiche, sofern verfügbar.
    - `capability`: Die angezeigte Klassifizierung der Authentifizierungsfähigkeit für dieses Ziel.

  </Accordion>
  <Accordion title="Häufige Warncodes">
    - `ssh_tunnel_failed`: Einrichtung des SSH-Tunnels fehlgeschlagen; der Befehl ist auf direkte Prüfungen zurückgefallen.
    - `multiple_gateways`: Unterschiedliche Gateway-Identitäten waren erreichbar, oder OpenClaw konnte nicht nachweisen, dass erreichbare Ziele derselbe Gateway sind. Ein SSH-Tunnel, eine Proxy-URL oder eine konfigurierte Remote-URL zu demselben Gateway löst diese Warnung nicht aus.
    - `auth_secretref_unresolved`: Ein konfigurierter Authentifizierungs-SecretRef konnte für ein fehlgeschlagenes Ziel nicht aufgelöst werden.
    - `probe_scope_limited`: WebSocket-Verbindung erfolgreich, aber die Leseprüfung wurde durch fehlendes `operator.read` eingeschränkt.

  </Accordion>
</AccordionGroup>

#### Remote über SSH (Parität zur Mac-App)

Der macOS-App-Modus „Remote über SSH“ verwendet eine lokale Portweiterleitung, sodass der Remote-Gateway (der möglicherweise nur an loopback gebunden ist) unter `ws://127.0.0.1:<port>` erreichbar wird.

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
  Den ersten erkannten Gateway-Host als SSH-Ziel aus dem aufgelösten Discovery-Endpunkt auswählen (`local.` plus die konfigurierte Wide-Area-Domain, falls vorhanden). Nur-TXT-Hinweise werden ignoriert.
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
  Gateway WebSocket-URL.
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

Verwenden Sie `--wrapper`, wenn der verwaltete Dienst über ein anderes ausführbares Programm gestartet werden muss, zum Beispiel über einen
Secrets-Manager-Shim oder einen Run-as-Helper. Der Wrapper erhält die normalen Gateway-Argumente und ist
dafür verantwortlich, schließlich `openclaw` oder Node mit diesen Argumenten per exec zu starten.

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
ausführbare Datei ist, schreibt den Wrapper in die `ProgramArguments` des Dienstes und persistiert
`OPENCLAW_WRAPPER` in der Dienstumgebung für spätere erzwungene Neuinstallationen, Updates und Doctor-
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
    - Unter macOS verwendet `gateway stop` standardmäßig `launchctl bootout`, wodurch der LaunchAgent aus der aktuellen Boot-Sitzung entfernt wird, ohne eine Deaktivierung zu persistieren — die automatische KeepAlive-Wiederherstellung bleibt für künftige Abstürze aktiv und `gateway start` aktiviert sauber wieder, ohne ein manuelles `launchctl enable`. Übergeben Sie `--disable`, um KeepAlive und RunAtLoad dauerhaft zu unterdrücken, sodass der Gateway bis zum nächsten expliziten `gateway start` nicht neu startet; verwenden Sie dies, wenn ein manueller Stopp Neustarts des Systems überdauern soll.
    - `gateway restart --safe` weist den laufenden Gateway an, aktive OpenClaw-Arbeit vorab zu prüfen und den Neustart aufzuschieben, bis Antwortzustellung, eingebettete Läufe und Task-Läufe abgearbeitet sind. `--safe` kann nicht mit `--force` oder `--wait` kombiniert werden.
    - `gateway restart --wait 30s` überschreibt das konfigurierte Drain-Budget für den Neustart für diesen Neustart. Reine Zahlen sind Millisekunden; Einheiten wie `s`, `m` und `h` werden akzeptiert. `--wait 0` wartet unbegrenzt.
    - `gateway restart --safe --skip-deferral` führt den OpenClaw-bewussten sicheren Neustart aus, umgeht jedoch das Aufschub-Gate, sodass der Gateway den Neustart sofort ausgibt, auch wenn Blocker gemeldet werden. Operator-Ausweg für festhängende Task-Lauf-Aufschübe; erfordert `--safe`.
    - `gateway restart --force` überspringt das Drain aktiver Arbeit und startet sofort neu. Verwenden Sie dies, wenn ein Operator die aufgeführten Task-Blocker bereits geprüft hat und den Gateway jetzt wieder verfügbar haben möchte.
    - Lebenszyklusbefehle akzeptieren `--json` für Skripting.

  </Accordion>
  <Accordion title="Authentifizierung und SecretRefs zur Installationszeit">
    - Wenn Token-Authentifizierung ein Token erfordert und `gateway.auth.token` SecretRef-verwaltet ist, validiert `gateway install`, dass die SecretRef auflösbar ist, persistiert das aufgelöste Token jedoch nicht in Dienstumgebungsmetadaten.
    - Wenn Token-Authentifizierung ein Token erfordert und die konfigurierte Token-SecretRef nicht aufgelöst werden kann, schlägt die Installation geschlossen fehl, statt Fallback-Klartext zu persistieren.
    - Für Passwortauthentifizierung bei `gateway run` bevorzugen Sie `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` oder ein SecretRef-gestütztes `gateway.auth.password` gegenüber inline `--password`.
    - Im abgeleiteten Authentifizierungsmodus lockert ein nur in der Shell gesetztes `OPENCLAW_GATEWAY_PASSWORD` die Token-Anforderungen bei der Installation nicht; verwenden Sie dauerhafte Konfiguration (`gateway.auth.password` oder Konfigurations-`env`), wenn Sie einen verwalteten Dienst installieren.
    - Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, wird die Installation blockiert, bis der Modus explizit gesetzt wird.

  </Accordion>
</AccordionGroup>

## Gateways entdecken (Bonjour)

`gateway discover` scannt nach Gateway-Beacons (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): Wählen Sie eine Domain (Beispiel: `openclaw.internal.`) und richten Sie Split-DNS + einen DNS-Server ein; siehe [Bonjour](/de/gateway/bonjour).

Nur Gateways mit aktivierter Bonjour-Erkennung (Standard) bewerben den Beacon.

Wide-Area-Erkennungsdatensätze können diese TXT-Hinweise enthalten:

- `role` (Hinweis zur Gateway-Rolle)
- `transport` (Transporthinweis, z. B. `gateway`)
- `gatewayPort` (WebSocket-Port, üblicherweise `18789`)
- `sshPort` (nur vollständiger Erkennungsmodus; Clients verwenden standardmäßig SSH-Ziele auf `22`, wenn er fehlt)
- `tailnetDns` (MagicDNS-Hostname, sofern verfügbar)
- `gatewayTls` / `gatewayTlsSha256` (TLS aktiviert + Zertifikatsfingerabdruck)
- `cliPath` (nur vollständiger Erkennungsmodus)

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
- Die CLI scannt `local.` plus die konfigurierte Wide-Area-Domain, wenn eine aktiviert ist.
- `wsUrl` in der JSON-Ausgabe wird aus dem aufgelösten Dienst-Endpunkt abgeleitet, nicht aus reinen TXT-Hinweisen wie `lanHost` oder `tailnetDns`.
- Bei `local.` mDNS und Wide-Area DNS-SD werden `sshPort` und `cliPath` nur veröffentlicht, wenn `discovery.mdns.mode` auf `full` gesetzt ist.

</Note>

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Gateway-Runbook](/de/gateway)
