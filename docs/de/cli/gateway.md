---
read_when:
    - Gateway über die CLI ausführen (Entwicklung oder Server)
    - Debugging von Gateway-Authentifizierung, Bind-Modi und Konnektivität
    - Gateways über Bonjour erkennen (lokal + Wide-Area-DNS-SD)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — Gateways ausführen, abfragen und entdecken
title: Gateway
x-i18n:
    generated_at: "2026-07-01T05:34:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 80f329ebd154f6fd0e87869c498c58fc6d5276a21934f8a36837653bd68a2d22
    source_path: cli/gateway.md
    workflow: 16
---

The Gateway ist der WebSocket-Server von OpenClaw (Kanäle, Nodes, Sitzungen, Hooks). Die Unterbefehle auf dieser Seite befinden sich unter `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Bonjour-Discovery" href="/de/gateway/bonjour">
    Lokale mDNS- + Wide-Area-DNS-SD-Einrichtung.
  </Card>
  <Card title="Discovery-Übersicht" href="/de/gateway/discovery">
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
    - Standardmäßig verweigert der Gateway den Start, sofern `gateway.mode=local` nicht in `~/.openclaw/openclaw.json` gesetzt ist. Verwenden Sie `--allow-unconfigured` für Ad-hoc-/Entwicklungsläufe.
    - Von `openclaw onboard --mode local` und `openclaw setup` wird erwartet, dass sie `gateway.mode=local` schreiben. Wenn die Datei existiert, aber `gateway.mode` fehlt, behandeln Sie dies als beschädigte oder überschriebene Konfiguration und reparieren Sie sie, statt implizit den lokalen Modus anzunehmen.
    - Wenn die Datei existiert und `gateway.mode` fehlt, behandelt der Gateway dies als verdächtige Konfigurationsbeschädigung und verweigert es, für Sie „lokal zu raten“.
    - Binden über Loopback hinaus ohne Authentifizierung wird blockiert (Sicherheitsleitplanke).
    - `lan`, `tailnet` und `custom` werden derzeit über reine IPv4-BYOH-Pfade aufgelöst.
    - Reines IPv6-BYOH wird auf diesem Pfad heute nicht nativ unterstützt. Verwenden Sie einen IPv4-Sidecar oder -Proxy, wenn der Host selbst nur IPv6 unterstützt.
    - `SIGUSR1` löst bei Autorisierung einen prozessinternen Neustart aus (`commands.restart` ist standardmäßig aktiviert; setzen Sie `commands.restart: false`, um manuelle Neustarts zu blockieren, während Anwenden/Aktualisieren von Gateway-Tool/-Konfiguration weiterhin erlaubt bleibt).
    - `SIGINT`-/`SIGTERM`-Handler stoppen den Gateway-Prozess, stellen aber keinen benutzerdefinierten Terminalzustand wieder her. Wenn Sie die CLI mit einer TUI oder Raw-Mode-Eingabe umschließen, stellen Sie das Terminal vor dem Beenden wieder her.

  </Accordion>
</AccordionGroup>

### Optionen

<ParamField path="--port <port>" type="number">
  WebSocket-Port (Standardwert kommt aus Konfiguration/Umgebung; normalerweise `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  Listener-Bind-Modus. `lan`, `tailnet` und `custom` werden derzeit über reine IPv4-Pfade aufgelöst.
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
  Den Gateway über Tailscale bereitstellen.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Tailscale-Serve-/Funnel-Konfiguration beim Herunterfahren zurücksetzen.
</ParamField>
<ParamField path="--bind custom + gateway.customBindHost" type="string">
  Erwartet heute eine IPv4-Adresse. Für reines IPv6-BYOH platzieren Sie einen IPv4-Sidecar oder -Proxy vor dem Gateway und richten OpenClaw auf diesen IPv4-Endpunkt aus.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Gateway-Start ohne `gateway.mode=local` in der Konfiguration erlauben. Umgeht die Startschutzprüfung nur für Ad-hoc-/Entwicklungs-Bootstrap; schreibt oder repariert die Konfigurationsdatei nicht.
</ParamField>
<ParamField path="--dev" type="boolean">
  Entwicklungskonfiguration + Workspace erstellen, falls fehlend (überspringt BOOTSTRAP.md).
</ParamField>
<ParamField path="--reset" type="boolean">
  Entwicklungskonfiguration + Anmeldedaten + Sitzungen + Workspace zurücksetzen (erfordert `--dev`).
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
  WebSocket-Log-Stil.
</ParamField>
<ParamField path="--compact" type="boolean">
  Alias für `--ws-log compact`.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  Rohe Modellstream-Ereignisse nach jsonl loggen.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Pfad für rohen Stream-jsonl.
</ParamField>

## Gateway neu starten

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
```

`openclaw gateway restart --safe` fordert den laufenden Gateway auf, aktive Arbeit vorab zu prüfen und einen zusammengefassten Neustart zu planen, nachdem aktive Arbeit abgeflossen ist. Der standardmäßige sichere Neustart wartet bis zum konfigurierten `gateway.reload.deferralTimeoutMs` (Standard 5 Minuten) auf aktive Arbeit; wenn dieses Budget abläuft, wird der Neustart erzwungen. Setzen Sie `gateway.reload.deferralTimeoutMs` auf `0`, um unbegrenzt sicher zu warten, ohne jemals zu erzwingen. Einfaches `restart` behält das vorhandene Service-Manager-Verhalten bei; `--force` bleibt der sofortige Überschreibungspfad.

`openclaw gateway restart --safe --skip-deferral` führt denselben OpenClaw-bewussten koordinierten Neustart wie `--safe` aus, umgeht aber die Verzögerungssperre für aktive Arbeit, sodass der Gateway den Neustart sofort ausgibt, auch wenn Blocker gemeldet werden. Verwenden Sie es als Operator-Ausweg, wenn eine Verzögerung durch einen hängengebliebenen Aufgabenlauf festgehalten wurde und `--safe` allein durch `gateway.reload.deferralTimeoutMs` begrenzt sein kann. `--skip-deferral` erfordert `--safe`.

<Warning>
Inline-`--password` kann in lokalen Prozesslisten offengelegt werden. Bevorzugen Sie `--password-file`, env oder ein SecretRef-gestütztes `gateway.auth.password`.
</Warning>

### Gateway-Profiling

- Setzen Sie `OPENCLAW_GATEWAY_STARTUP_TRACE=1`, um Phasenzeiten während des Gateway-Starts zu loggen, einschließlich `eventLoopMax`-Verzögerung pro Phase und Plugin-Lookup-Table-Zeiten für Installed-Index, Manifest-Registry, Startplanung und Owner-Map-Arbeit.
- Setzen Sie `OPENCLAW_GATEWAY_RESTART_TRACE=1`, um neustartbezogene `restart trace:`-Zeilen für Neustartsignalbehandlung, Abfluss aktiver Arbeit, Herunterfahrphasen, nächsten Start, Ready-Timing und Speichermetriken zu loggen.
- Setzen Sie `OPENCLAW_DIAGNOSTICS=timeline` mit `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>`, um eine Best-Effort-JSONL-Startdiagnose-Timeline für externe QA-Harnesses zu schreiben. Sie können das Flag auch mit `diagnostics.flags: ["timeline"]` in der Konfiguration aktivieren; der Pfad wird weiterhin per env bereitgestellt. Fügen Sie `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` hinzu, um Event-Loop-Samples einzubeziehen.
- Führen Sie zuerst `pnpm build` aus, dann `pnpm test:startup:gateway -- --runs 5 --warmup 1`, um den Gateway-Start gegen den gebauten CLI-Einstieg zu benchmarken. Der Benchmark erfasst die erste Prozessausgabe, `/healthz`, `/readyz`, Start-Trace-Zeiten, Event-Loop-Verzögerung und Timing-Details der Plugin-Lookup-Tables.
- Führen Sie zuerst `pnpm build` aus, dann `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5`, um den prozessinternen Gateway-Neustart gegen den gebauten CLI-Einstieg auf macOS oder Linux zu benchmarken. Der Neustart-Benchmark verwendet SIGUSR1, aktiviert sowohl Start- als auch Neustart-Traces im Child-Prozess und erfasst das nächste `/healthz`, das nächste `/readyz`, Ausfallzeit, Ready-Timing, CPU, RSS und Neustart-Trace-Metriken.
- Behandeln Sie `/healthz` als Liveness und `/readyz` als nutzbare Readiness. Trace-Zeilen und Benchmark-Ausgabe dienen der Owner-Zuordnung; behandeln Sie keinen einzelnen Trace-Span oder einzelnen Sample als vollständiges Performance-Fazit.

## Laufenden Gateway abfragen

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
    - `--timeout <ms>`: Timeout/Budget (variiert je nach Befehl).
    - `--expect-final`: auf eine „final“-Antwort warten (Agent-Aufrufe).

  </Tab>
</Tabs>

<Note>
Wenn Sie `--url` setzen, fällt die CLI nicht auf Anmeldedaten aus Konfiguration oder Umgebung zurück. Übergeben Sie `--token` oder `--password` explizit. Fehlende explizite Anmeldedaten sind ein Fehler.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway health --port 18789
```

Der HTTP-Endpunkt `/healthz` ist eine Liveness-Probe: Er antwortet, sobald der Server HTTP beantworten kann. Der HTTP-Endpunkt `/readyz` ist strenger und bleibt rot, während Start-Plugin-Sidecars, Kanäle oder konfigurierte Hooks noch stabilisieren. Lokale oder authentifizierte detaillierte Readiness-Antworten enthalten einen `eventLoop`-Diagnoseblock mit Event-Loop-Verzögerung, Event-Loop-Auslastung, CPU-Kern-Verhältnis und einem `degraded`-Flag.

<ParamField path="--port <port>" type="number">
  Einen lokalen local loopback Gateway auf diesem Port ansprechen. Dies überschreibt `OPENCLAW_GATEWAY_URL` und `OPENCLAW_GATEWAY_PORT` für den Health-Aufruf.
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
  Kostenzusammenfassung auf eine konfigurierte Agent-ID begrenzen.
</ParamField>
<ParamField path="--all-agents" type="boolean">
  Kostenzusammenfassung über alle konfigurierten Agents aggregieren. Kann nicht mit `--agent` kombiniert werden.
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
  Maximale Anzahl aktueller Ereignisse, die einbezogen werden sollen (max. `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  Nach Diagnoseereignistyp filtern, z. B. `payload.large` oder `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Nur Ereignisse nach einer Diagnosesequenznummer einbeziehen.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Ein persistiertes Stabilitäts-Bundle lesen, statt den laufenden Gateway aufzurufen. Verwenden Sie `--bundle latest` (oder nur `--bundle`) für das neueste Bundle unter dem State-Verzeichnis, oder übergeben Sie direkt einen Bundle-JSON-Pfad.
</ParamField>
<ParamField path="--export" type="boolean">
  Eine teilbare Support-Diagnose-ZIP schreiben, statt Stabilitätsdetails auszugeben.
</ParamField>
<ParamField path="--output <path>" type="string">
  Ausgabepfad für `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Datenschutz und Bundle-Verhalten">
    - Aufzeichnungen behalten operative Metadaten: Ereignisnamen, Zählwerte, Byte-Größen, Speichermesswerte, Queue-/Sitzungsstatus, Genehmigungs-IDs, Kanal-/Plugin-Namen und geschwärzte Sitzungszusammenfassungen. Sie behalten keine Chattexte, Webhook-Bodies, Tool-Ausgaben, rohen Request- oder Response-Bodies, Tokens, Cookies, Geheimwerte, Hostnamen oder rohen Sitzungs-IDs. Setzen Sie `diagnostics.enabled: false`, um den Recorder vollständig zu deaktivieren.
    - Bei fatalen Gateway-Beendigungen, Shutdown-Timeouts und Neustart-Startfehlern schreibt OpenClaw denselben Diagnose-Snapshot nach `~/.openclaw/logs/stability/openclaw-stability-*.json`, wenn der Recorder Ereignisse hat. Prüfen Sie das neueste Bundle mit `openclaw gateway stability --bundle latest`; `--limit`, `--type` und `--since-seq` gelten ebenfalls für Bundle-Ausgaben.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Schreibt eine lokale Diagnose-ZIP, die zum Anhängen an Fehlerberichte gedacht ist. Informationen zum Datenschutzmodell und zu Bundle-Inhalten finden Sie unter [Diagnoseexport](/de/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Ausgabe-ZIP-Pfad. Standardmäßig ein Support-Export unter dem State-Verzeichnis.
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

Der Export enthält ein Manifest, eine Markdown-Zusammenfassung, die Config-Form, bereinigte Config-Details, bereinigte Logzusammenfassungen, bereinigte Gateway-Status-/Health-Snapshots und das neueste Stabilitäts-Bundle, sofern eines vorhanden ist.

Er ist zum Teilen vorgesehen. Er behält Betriebsdetails bei, die beim Debugging helfen, zum Beispiel sichere OpenClaw-Logfelder, Subsystemnamen, Statuscodes, Laufzeiten, konfigurierte Modi, Ports, Plugin-IDs, Provider-IDs, nicht geheime Feature-Einstellungen und geschwärzte Betriebslogmeldungen. Er lässt Chattext, Webhook-Bodys, Tool-Ausgaben, Zugangsdaten, Cookies, Konto-/Nachrichtenkennungen, Prompt-/Anweisungstext, Hostnamen und geheime Werte aus oder schwärzt sie. Wenn eine LogTape-artige Meldung wie Nutzungs-, Chat- oder Tool-Payload-Text aussieht, behält der Export nur bei, dass eine Meldung ausgelassen wurde, sowie deren Byteanzahl.

### `gateway status`

`gateway status` zeigt den Gateway-Dienst (launchd/systemd/schtasks) sowie optional eine Prüfung der Konnektivitäts-/Auth-Fähigkeit.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Ein explizites Prüfziel hinzufügen. Konfigurierte Remote-Ziele und localhost werden weiterhin geprüft.
</ParamField>
<ParamField path="--token <token>" type="string">
  Token-Auth für die Prüfung.
</ParamField>
<ParamField path="--password <password>" type="string">
  Passwort-Auth für die Prüfung.
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
  Die standardmäßige Konnektivitätsprüfung zu einer Leseprüfung hochstufen und mit einem Nicht-Null-Code beenden, wenn diese Leseprüfung fehlschlägt. Kann nicht mit `--no-probe` kombiniert werden.
</ParamField>

<AccordionGroup>
  <Accordion title="Statussemantik">
    - `gateway status` bleibt für Diagnosen verfügbar, selbst wenn die lokale CLI-Config fehlt oder ungültig ist.
    - Das standardmäßige `gateway status` weist Dienststatus, WebSocket-Verbindung und die zum Handshake-Zeitpunkt sichtbare Auth-Fähigkeit nach. Es weist keine Lese-/Schreib-/Admin-Operationen nach.
    - Diagnoseprüfungen verändern bei erstmaliger Geräte-Auth nichts: Sie verwenden ein vorhandenes gecachtes Geräte-Token wieder, wenn eines existiert, erstellen aber keine neue CLI-Geräteidentität und keinen schreibgeschützten Geräte-Pairing-Eintrag nur zur Statusprüfung.
    - `gateway status` löst konfigurierte Auth-SecretRefs für Prüf-Auth auf, wenn möglich.
    - Wenn ein erforderlicher Auth-SecretRef in diesem Befehlspfad nicht aufgelöst ist, meldet `gateway status --json` `rpc.authWarning`, wenn Prüf-Konnektivität/Auth fehlschlägt; übergeben Sie `--token`/`--password` explizit oder lösen Sie zuerst die Secret-Quelle auf.
    - Wenn die Prüfung erfolgreich ist, werden Warnungen zu nicht aufgelösten Auth-Refs unterdrückt, um Fehlalarme zu vermeiden.
    - Wenn Prüfungen aktiviert sind, enthält die JSON-Ausgabe `gateway.version`, wenn der laufende Gateway sie meldet; `--require-rpc` kann auf den RPC-Payload `status.runtimeVersion` zurückfallen, wenn die nachfolgende Handshake-Prüfung keine Versionsmetadaten bereitstellen kann.
    - Verwenden Sie `--require-rpc` in Skripten und Automatisierung, wenn ein lauschender Dienst nicht ausreicht und auch RPC-Aufrufe mit Lese-Scope funktionieren müssen.
    - `--deep` fügt einen Best-Effort-Scan nach zusätzlichen launchd-/systemd-/schtasks-Installationen hinzu. Wenn mehrere Gateway-ähnliche Dienste erkannt werden, gibt die menschenlesbare Ausgabe Bereinigungshinweise aus und warnt, dass die meisten Setups einen Gateway pro Maschine ausführen sollten.
    - `--deep` meldet außerdem eine kürzliche Übergabe eines Gateway-Supervisor-Neustarts, wenn der Dienstprozess sauber für einen externen Supervisor-Neustart beendet wurde.
    - `--deep` führt Config-Validierung im Plugin-bewussten Modus (`pluginValidation: "full"`) aus und zeigt Warnungen aus konfigurierten Plugin-Manifesten an (zum Beispiel fehlende Metadaten zur Channel-Config), damit Installations- und Update-Smoke-Checks sie erfassen. Das standardmäßige `gateway status` behält den schnellen schreibgeschützten Pfad bei, der Plugin-Validierung überspringt.
    - Die menschenlesbare Ausgabe enthält den aufgelösten Datei-Logpfad sowie einen Snapshot der CLI-gegen-Dienst-Config-Pfade/-Gültigkeit, um Drift bei Profilen oder State-Verzeichnissen zu diagnostizieren.

  </Accordion>
  <Accordion title="Linux-systemd-Auth-Drift-Prüfungen">
    - Bei Linux-systemd-Installationen lesen Dienst-Auth-Drift-Prüfungen sowohl `Environment=`- als auch `EnvironmentFile=`-Werte aus der Unit (einschließlich `%h`, zitierter Pfade, mehrerer Dateien und optionaler `-`-Dateien).
    - Drift-Prüfungen lösen `gateway.auth.token`-SecretRefs mithilfe zusammengeführter Runtime-Env auf (zuerst Dienstbefehls-Env, dann Prozess-Env als Fallback).
    - Wenn Token-Auth nicht effektiv aktiv ist (expliziter `gateway.auth.mode` von `password`/`none`/`trusted-proxy` oder nicht gesetzter Modus, bei dem Passwort gewinnen kann und kein Token-Kandidat gewinnen kann), überspringen Token-Drift-Prüfungen die Auflösung des Config-Tokens.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` ist der Befehl zum „alles debuggen“. Er prüft immer:

- Ihren konfigurierten Remote-Gateway (falls gesetzt) und
- localhost (local loopback) **selbst wenn Remote konfiguriert ist**.

Wenn Sie `--url` übergeben, wird dieses explizite Ziel vor beiden hinzugefügt. Die menschenlesbare Ausgabe beschriftet die Ziele als:

- `URL (explicit)`
- `Remote (configured)` oder `Remote (configured, inactive)`
- `Local loopback`

<Note>
Wenn mehrere Prüfziele erreichbar sind, gibt der Befehl alle aus. Ein SSH-Tunnel, eine TLS-/Proxy-URL und eine konfigurierte Remote-URL können alle auf denselben Gateway zeigen, auch wenn sich ihre Transportports unterscheiden; `multiple_gateways` ist für unterschiedliche oder identitätsunklare erreichbare Gateways reserviert. Mehrere Gateways werden unterstützt, wenn Sie isolierte Profile verwenden (z. B. einen Rescue-Bot), aber die meisten Installationen führen weiterhin einen einzelnen Gateway aus.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  Diesen Port für das lokale local loopback-Prüfziel und den Remote-Port des SSH-Tunnels verwenden. Ohne `--url` wählt dies das lokale local loopback-Ziel statt der konfigurierten Gateway-Environment-URL, des Environment-Ports oder Remote-Ziele aus.
</ParamField>

<AccordionGroup>
  <Accordion title="Interpretation">
    - `Reachable: yes` bedeutet, dass mindestens ein Ziel eine WebSocket-Verbindung akzeptiert hat.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` meldet, was die Prüfung über Auth nachweisen konnte. Dies ist von der Erreichbarkeit getrennt.
    - `Read probe: ok` bedeutet, dass Detail-RPC-Aufrufe mit Lese-Scope (`health`/`status`/`system-presence`/`config.get`) ebenfalls erfolgreich waren.
    - `Read probe: limited - missing scope: operator.read` bedeutet, dass die Verbindung erfolgreich war, aber der Lese-Scope-RPC eingeschränkt ist. Dies wird als **eingeschränkte** Erreichbarkeit gemeldet, nicht als vollständiger Fehler.
    - `Read probe: failed` nach `Connect: ok` bedeutet, dass der Gateway die WebSocket-Verbindung akzeptiert hat, nachfolgende Lesediagnosen jedoch einen Timeout hatten oder fehlgeschlagen sind. Auch dies ist **eingeschränkte** Erreichbarkeit, kein unerreichbarer Gateway.
    - Wie `gateway status` verwendet probe vorhandene gecachte Geräte-Auth wieder, erstellt aber keine erstmalige Geräteidentität oder Pairing-State.
    - Der Exit-Code ist nur dann ungleich null, wenn kein geprüftes Ziel erreichbar ist.

  </Accordion>
  <Accordion title="JSON-Ausgabe">
    Oberste Ebene:

    - `ok`: Mindestens ein Ziel ist erreichbar.
    - `degraded`: Mindestens ein Ziel hat eine Verbindung akzeptiert, aber keine vollständigen Detail-RPC-Diagnosen abgeschlossen.
    - `capability`: beste Fähigkeit über erreichbare Ziele hinweg (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` oder `unknown`).
    - `primaryTargetId`: bestes Ziel, das in dieser Reihenfolge als aktiver Gewinner behandelt werden soll: explizite URL, SSH-Tunnel, konfigurierte Remote-Verbindung, dann local loopback.
    - `warnings[]`: Best-Effort-Warndatensätze mit `code`, `message` und optionalen `targetIds`.
    - `network`: local loopback-/tailnet-URL-Hinweise, abgeleitet aus aktueller Config und Host-Netzwerk.
    - `discovery.timeoutMs` und `discovery.count`: das tatsächliche Discovery-Budget bzw. die Ergebnisanzahl, die für diesen Prüf-Durchlauf verwendet wurden.

    Pro Ziel (`targets[].connect`):

    - `ok`: Erreichbarkeit nach Verbindung plus eingeschränkte Klassifizierung.
    - `rpcOk`: vollständiger Detail-RPC-Erfolg.
    - `scopeLimited`: Detail-RPC ist wegen fehlendem Operator-Scope fehlgeschlagen.

    Pro Ziel (`targets[].auth`):

    - `role`: in `hello-ok` gemeldete Auth-Rolle, wenn verfügbar.
    - `scopes`: in `hello-ok` gemeldete gewährte Scopes, wenn verfügbar.
    - `capability`: die für dieses Ziel angezeigte Auth-Fähigkeitsklassifizierung.

  </Accordion>
  <Accordion title="Häufige Warncodes">
    - `ssh_tunnel_failed`: Einrichtung des SSH-Tunnels fehlgeschlagen; der Befehl ist auf direkte Prüfungen zurückgefallen.
    - `multiple_gateways`: unterschiedliche Gateway-Identitäten waren erreichbar, oder OpenClaw konnte nicht nachweisen, dass erreichbare Ziele derselbe Gateway sind. Ein SSH-Tunnel, eine Proxy-URL oder eine konfigurierte Remote-URL zum selben Gateway löst diese Warnung nicht aus.
    - `auth_secretref_unresolved`: Ein konfigurierter Auth-SecretRef konnte für ein fehlgeschlagenes Ziel nicht aufgelöst werden.
    - `probe_scope_limited`: WebSocket-Verbindung war erfolgreich, aber die Leseprüfung wurde durch fehlendes `operator.read` eingeschränkt.

  </Accordion>
</AccordionGroup>

#### Remote über SSH (Parität zur Mac-App)

Der macOS-App-Modus „Remote over SSH“ verwendet eine lokale Portweiterleitung, sodass der Remote-Gateway (der möglicherweise nur an Loopback gebunden ist) unter `ws://127.0.0.1:<port>` erreichbar wird.

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
  Den ersten erkannten Gateway-Host als SSH-Ziel aus dem aufgelösten Discovery-Endpunkt auswählen (`local.` plus die konfigurierte Wide-Area-Domain, falls vorhanden). Nur-TXT-Hinweise werden ignoriert.
</ParamField>

Config (optional, als Standardwerte verwendet):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

Low-Level-RPC-Helfer.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

<ParamField path="--params <json>" type="string" default="{}">
  JSON-Objektzeichenfolge für params.
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
  Hauptsächlich für Agent-artige RPCs, die Zwischenereignisse vor einem finalen Payload streamen.
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
dafür verantwortlich, schließlich `openclaw` oder Node mit diesen Argumenten per exec auszuführen.

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

Sie können den Wrapper auch über die Umgebung festlegen. `gateway install` prüft, ob der Pfad eine
ausführbare Datei ist, schreibt den Wrapper in die Dienst-`ProgramArguments` und speichert
`OPENCLAW_WRAPPER` in der Dienstumgebung für spätere erzwungene Neuinstallationen, Updates und Doctor-
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
    - `gateway restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start`: `--json`
    - `gateway stop`: `--disable`, `--json`

  </Accordion>
  <Accordion title="Lifecycle-Verhalten">
    - Verwenden Sie `gateway restart`, um einen verwalteten Dienst neu zu starten. Verketten Sie `gateway stop` und `gateway start` nicht als Ersatz für einen Neustart.
    - Unter macOS verwendet `gateway stop` standardmäßig `launchctl bootout`, wodurch der LaunchAgent aus der aktuellen Boot-Sitzung entfernt wird, ohne eine Deaktivierung dauerhaft zu speichern — die automatische KeepAlive-Wiederherstellung bleibt für künftige Abstürze aktiv, und `gateway start` aktiviert sauber wieder, ohne ein manuelles `launchctl enable`. Übergeben Sie `--disable`, um KeepAlive und RunAtLoad dauerhaft zu unterdrücken, damit der Gateway bis zum nächsten ausdrücklichen `gateway start` nicht erneut startet; verwenden Sie dies, wenn ein manueller Stopp Neustarts des Systems überdauern soll.
    - `gateway restart --safe` bittet den laufenden Gateway, aktive Arbeit vorab zu prüfen und einen zusammengefassten Neustart zu planen, nachdem aktive Arbeit abgearbeitet ist. Der standardmäßige sichere Neustart wartet bis zum konfigurierten `gateway.reload.deferralTimeoutMs` (Standard: 5 Minuten) auf aktive Arbeit; wenn dieses Budget abläuft, wird der Neustart erzwungen. Setzen Sie `gateway.reload.deferralTimeoutMs` auf `0`, um unbegrenzt sicher zu warten, ohne jemals zu erzwingen. `--safe` kann nicht mit `--force` oder `--wait` kombiniert werden.
    - `gateway restart --wait 30s` überschreibt das konfigurierte Neustart-Drain-Budget für diesen Neustart. Bloße Zahlen sind Millisekunden; Einheiten wie `s`, `m` und `h` werden akzeptiert. `--wait 0` wartet unbegrenzt.
    - `gateway restart --safe --skip-deferral` führt den OpenClaw-bewussten sicheren Neustart aus, umgeht aber die Aufschubprüfung, sodass der Gateway den Neustart sofort ausgibt, selbst wenn Blocker gemeldet werden. Operator-Notausstieg für Aufschübe durch festhängende Task-Ausführungen; erfordert `--safe`.
    - `gateway restart --force` überspringt das Abarbeiten aktiver Arbeit und startet sofort neu. Verwenden Sie dies, wenn ein Operator die aufgelisteten Task-Blocker bereits geprüft hat und den Gateway jetzt wieder verfügbar haben möchte.
    - Lifecycle-Befehle akzeptieren `--json` für Skripting.

  </Accordion>
  <Accordion title="Auth und SecretRefs zur Installationszeit">
    - Wenn Token-Auth ein Token erfordert und `gateway.auth.token` SecretRef-verwaltet ist, prüft `gateway install`, ob die SecretRef auflösbar ist, speichert das aufgelöste Token aber nicht in den Dienstumgebungsmetadaten.
    - Wenn Token-Auth ein Token erfordert und die konfigurierte Token-SecretRef nicht aufgelöst werden kann, schlägt die Installation fail-closed fehl, statt Fallback-Klartext zu speichern.
    - Für Passwort-Auth bei `gateway run` bevorzugen Sie `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` oder ein SecretRef-gestütztes `gateway.auth.password` gegenüber inline `--password`.
    - Im abgeleiteten Auth-Modus lockert ein nur in der Shell gesetztes `OPENCLAW_GATEWAY_PASSWORD` die Token-Anforderungen für die Installation nicht; verwenden Sie dauerhafte Konfiguration (`gateway.auth.password` oder config `env`), wenn Sie einen verwalteten Dienst installieren.
    - Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, wird die Installation blockiert, bis der Modus ausdrücklich gesetzt wird.

  </Accordion>
</AccordionGroup>

## Gateways entdecken (Bonjour)

`gateway discover` sucht nach Gateway-Beacons (`_openclaw-gw._tcp`).

- Multicast-DNS-SD: `local.`
- Unicast-DNS-SD (Wide-Area Bonjour): Wählen Sie eine Domain (Beispiel: `openclaw.internal.`) und richten Sie Split-DNS + einen DNS-Server ein; siehe [Bonjour](/de/gateway/bonjour).

Nur Gateways mit aktivierter Bonjour-Erkennung (Standard) kündigen den Beacon an.

Wide-Area-Erkennungsdatensätze können diese TXT-Hinweise enthalten:

- `role` (Hinweis auf die Gateway-Rolle)
- `transport` (Transporthinweis, z. B. `gateway`)
- `gatewayPort` (WebSocket-Port, normalerweise `18789`)
- `sshPort` (nur im vollständigen Erkennungsmodus; Clients setzen SSH-Ziele standardmäßig auf `22`, wenn er fehlt)
- `tailnetDns` (MagicDNS-Hostname, wenn verfügbar)
- `gatewayTls` / `gatewayTlsSha256` (TLS aktiviert + Zertifikatsfingerabdruck)
- `cliPath` (nur im vollständigen Erkennungsmodus)

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
- Die CLI durchsucht `local.` plus die konfigurierte Wide-Area-Domain, wenn eine aktiviert ist.
- `wsUrl` in der JSON-Ausgabe wird aus dem aufgelösten Dienst-Endpunkt abgeleitet, nicht aus reinen TXT-Hinweisen wie `lanHost` oder `tailnetDns`.
- Bei `local.` mDNS und Wide-Area-DNS-SD werden `sshPort` und `cliPath` nur veröffentlicht, wenn `discovery.mdns.mode` auf `full` gesetzt ist.

</Note>

## Verwandt

- [CLI-Referenz](/de/cli)
- [Gateway-Runbook](/de/gateway)
