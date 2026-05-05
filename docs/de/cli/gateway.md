---
read_when:
    - Gateway über die CLI ausführen (Entwicklung oder Server)
    - Fehlersuche bei Gateway-Authentifizierung, Bind-Modi und Konnektivität
    - Ermitteln von Gateways über Bonjour (lokales + Wide-Area-DNS-SD)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — Gateways ausführen, abfragen und ermitteln
title: Gateway
x-i18n:
    generated_at: "2026-05-05T08:25:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89f798724971151cdd297fcdbbc1fe79dedc19f57521f2ad2c1fff0f9acf9b24
    source_path: cli/gateway.md
    workflow: 16
---

Der Gateway ist der WebSocket-Server von OpenClaw (Kanäle, Nodes, Sitzungen, Hooks). Unterbefehle auf dieser Seite befinden sich unter `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Bonjour-Erkennung" href="/de/gateway/bonjour">
    Einrichtung von lokalem mDNS + Wide-Area-DNS-SD.
  </Card>
  <Card title="Erkennungsübersicht" href="/de/gateway/discovery">
    Wie OpenClaw Gateways ankündigt und findet.
  </Card>
  <Card title="Konfiguration" href="/de/gateway/configuration">
    Gateway-Konfigurationsschlüssel der obersten Ebene.
  </Card>
</CardGroup>

## Gateway ausführen

Führen Sie einen lokalen Gateway-Prozess aus:

```bash
openclaw gateway
```

Foreground-Alias:

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="Startverhalten">
    - Standardmäßig verweigert der Gateway den Start, sofern `gateway.mode=local` nicht in `~/.openclaw/openclaw.json` gesetzt ist. Verwenden Sie `--allow-unconfigured` für Ad-hoc-/Entwicklungsläufe.
    - Von `openclaw onboard --mode local` und `openclaw setup` wird erwartet, dass sie `gateway.mode=local` schreiben. Wenn die Datei vorhanden ist, aber `gateway.mode` fehlt, behandeln Sie dies als beschädigte oder überschrieben konfigurierte Datei und reparieren Sie sie, statt implizit den lokalen Modus anzunehmen.
    - Wenn die Datei vorhanden ist und `gateway.mode` fehlt, behandelt der Gateway dies als verdächtige Konfigurationsbeschädigung und verweigert es, für Sie „lokal zu raten“.
    - Das Binden über loopback hinaus ohne Authentifizierung wird blockiert (Sicherheitsleitplanke).
    - `SIGUSR1` löst einen prozessinternen Neustart aus, wenn autorisiert (`commands.restart` ist standardmäßig aktiviert; setzen Sie `commands.restart: false`, um manuelle Neustarts zu blockieren, während das Anwenden/Aktualisieren von Gateway-Tools und -Konfiguration weiterhin erlaubt bleibt).
    - `SIGINT`-/`SIGTERM`-Handler stoppen den Gateway-Prozess, stellen aber keinen benutzerdefinierten Terminalzustand wieder her. Wenn Sie die CLI mit einer TUI oder Raw-Mode-Eingabe umschließen, stellen Sie das Terminal vor dem Beenden wieder her.

  </Accordion>
</AccordionGroup>

### Optionen

<ParamField path="--port <port>" type="number">
  WebSocket-Port (Standardwert stammt aus Konfiguration/Umgebung; üblicherweise `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  Listener-Bind-Modus.
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
  Gateway-Start ohne `gateway.mode=local` in der Konfiguration erlauben. Umgeht den Startschutz nur für Ad-hoc-/Entwicklungs-Bootstrap; schreibt oder repariert die Konfigurationsdatei nicht.
</ParamField>
<ParamField path="--dev" type="boolean">
  Entwicklungskonfiguration + Arbeitsbereich erstellen, falls fehlend (überspringt BOOTSTRAP.md).
</ParamField>
<ParamField path="--reset" type="boolean">
  Entwicklungskonfiguration + Zugangsdaten + Sitzungen + Arbeitsbereich zurücksetzen (erfordert `--dev`).
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
  WebSocket-Logstil.
</ParamField>
<ParamField path="--compact" type="boolean">
  Alias für `--ws-log compact`.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  Rohereignisse des Modellstreams nach jsonl protokollieren.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Raw-Stream-jsonl-Pfad.
</ParamField>

## Gateway neu starten

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --force
```

`openclaw gateway restart --safe` weist den laufenden Gateway an, aktive OpenClaw-Arbeit vor dem Neustart per Preflight zu prüfen. Wenn Warteschlangenoperationen, Antwortzustellung, eingebettete Läufe oder Taskläufe aktiv sind, meldet der Gateway die Blocker, fasst doppelte sichere Neustartanforderungen zusammen und startet neu, sobald die aktive Arbeit abgearbeitet ist. Einfaches `restart` behält aus Kompatibilitätsgründen das bestehende Service-Manager-Verhalten bei. Verwenden Sie `--force` nur, wenn Sie ausdrücklich den unmittelbaren Override-Pfad möchten.

<Warning>
Inline-`--password` kann in lokalen Prozesslisten offengelegt werden. Bevorzugen Sie `--password-file`, Umgebungsvariablen oder ein SecretRef-gestütztes `gateway.auth.password`.
</Warning>

### Start-Profiling

- Setzen Sie `OPENCLAW_GATEWAY_STARTUP_TRACE=1`, um Phasen-Timings während des Gateway-Starts zu protokollieren, einschließlich `eventLoopMax`-Verzögerung pro Phase und Plugin-Lookup-Table-Timings für installierten Index, Manifest-Registry, Startplanung und Owner-Map-Arbeit.
- Setzen Sie `OPENCLAW_DIAGNOSTICS=timeline` mit `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>`, um eine Best-Effort-JSONL-Startdiagnose-Timeline für externe QA-Harnesses zu schreiben. Sie können das Flag auch mit `diagnostics.flags: ["timeline"]` in der Konfiguration aktivieren; der Pfad wird weiterhin über die Umgebung bereitgestellt. Fügen Sie `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` hinzu, um Event-Loop-Samples einzuschließen.
- Führen Sie `pnpm test:startup:gateway -- --runs 5 --warmup 1` aus, um den Gateway-Start zu benchmarken. Der Benchmark erfasst die erste Prozessausgabe, `/healthz`, `/readyz`, Start-Trace-Timings, Event-Loop-Verzögerung und Plugin-Lookup-Table-Timingdetails.

## Laufenden Gateway abfragen

Alle Abfragebefehle verwenden WebSocket-RPC.

<Tabs>
  <Tab title="Ausgabemodi">
    - Standard: menschenlesbar (in TTY farbig).
    - `--json`: maschinenlesbares JSON (kein Styling/Spinner).
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

Der HTTP-Endpunkt `/healthz` ist eine Liveness-Probe: Er gibt zurück, sobald der Server HTTP beantworten kann. Der HTTP-Endpunkt `/readyz` ist strenger und bleibt rot, solange Start-Plugin-Sidecars, Kanäle oder konfigurierte Hooks noch stabilisiert werden. Lokale oder authentifizierte detaillierte Readiness-Antworten enthalten einen `eventLoop`-Diagnoseblock mit Event-Loop-Verzögerung, Event-Loop-Auslastung, CPU-Kern-Verhältnis und einem `degraded`-Flag.

### `gateway usage-cost`

Nutzungs- und Kostenzusammenfassungen aus Sitzungslogs abrufen.

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
  Maximale Anzahl einzuschließender aktueller Ereignisse (max. `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  Nach Diagnoseereignistyp filtern, zum Beispiel `payload.large` oder `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Nur Ereignisse nach einer Diagnosesequenznummer einschließen.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Ein persistiertes Stabilitäts-Bundle lesen, statt den laufenden Gateway aufzurufen. Verwenden Sie `--bundle latest` (oder nur `--bundle`) für das neueste Bundle im Zustandsverzeichnis, oder übergeben Sie direkt einen Bundle-JSON-Pfad.
</ParamField>
<ParamField path="--export" type="boolean">
  Eine teilbare Support-Diagnose-ZIP schreiben, statt Stabilitätsdetails auszugeben.
</ParamField>
<ParamField path="--output <path>" type="string">
  Ausgabepfad für `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Datenschutz und Bundle-Verhalten">
    - Datensätze behalten Betriebsmetadaten: Ereignisnamen, Zählungen, Bytegrößen, Speichermesswerte, Warteschlangen-/Sitzungsstatus, Kanal-/Plugin-Namen und geschwärzte Sitzungszusammenfassungen. Sie behalten keine Chattexte, Webhook-Bodys, Tool-Ausgaben, rohe Anfrage- oder Antwort-Bodys, Tokens, Cookies, geheime Werte, Hostnamen oder rohen Sitzungs-IDs. Setzen Sie `diagnostics.enabled: false`, um den Rekorder vollständig zu deaktivieren.
    - Bei fatalen Gateway-Beendigungen, Shutdown-Timeouts und Startfehlern nach einem Neustart schreibt OpenClaw denselben Diagnose-Snapshot nach `~/.openclaw/logs/stability/openclaw-stability-*.json`, wenn der Rekorder Ereignisse enthält. Prüfen Sie das neueste Bundle mit `openclaw gateway stability --bundle latest`; `--limit`, `--type` und `--since-seq` gelten auch für Bundle-Ausgaben.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Schreibt eine lokale Diagnose-ZIP, die für das Anhängen an Fehlerberichte ausgelegt ist. Informationen zum Datenschutzmodell und Bundle-Inhalt finden Sie unter [Diagnoseexport](/de/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Ausgabepfad der ZIP. Standardmäßig ein Support-Export im Zustandsverzeichnis.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Maximale Anzahl sanitizter Logzeilen, die eingeschlossen werden.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  Maximale Anzahl an Logbytes, die geprüft werden.
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
  Den geschriebenen Pfad, die Größe und das Manifest als JSON ausgeben.
</ParamField>

Der Export enthält ein Manifest, eine Markdown-Zusammenfassung, Konfigurationsform, sanitizte Konfigurationsdetails, sanitizte Logzusammenfassungen, sanitizte Gateway-Status-/Health-Snapshots und das neueste Stabilitäts-Bundle, sofern eines vorhanden ist.

Er ist zum Teilen gedacht. Er behält Betriebsdetails, die beim Debugging helfen, wie sichere OpenClaw-Logfelder, Subsystemnamen, Statuscodes, Dauern, konfigurierte Modi, Ports, Plugin-IDs, Provider-IDs, nicht geheime Feature-Einstellungen und geschwärzte Betriebslogmeldungen. Er lässt Chattexte, Webhook-Bodys, Tool-Ausgaben, Zugangsdaten, Cookies, Konto-/Nachrichtenkennungen, Prompt-/Anweisungstext, Hostnamen und geheime Werte aus oder schwärzt sie. Wenn eine LogTape-artige Nachricht wie Benutzer-/Chat-/Tool-Payload-Text aussieht, behält der Export nur bei, dass eine Nachricht ausgelassen wurde, plus ihre Byteanzahl.

### `gateway status`

`gateway status` zeigt den Gateway-Dienst (launchd/systemd/schtasks) plus eine optionale Prüfung der Konnektivitäts-/Authentifizierungsfähigkeit.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Fügen Sie ein explizites Probe-Ziel hinzu. Konfigurierte Remote-Instanz und localhost werden weiterhin geprüft.
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
  Überspringen Sie die Konnektivitäts-Probe (nur Service-Ansicht).
</ParamField>
<ParamField path="--deep" type="boolean">
  Auch systemweite Services scannen.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Stufen Sie die standardmäßige Konnektivitäts-Probe zu einer Lese-Probe hoch und beenden Sie mit einem Exit-Code ungleich null, wenn diese Lese-Probe fehlschlägt. Kann nicht mit `--no-probe` kombiniert werden.
</ParamField>

<AccordionGroup>
  <Accordion title="Statussemantik">
    - `gateway status` bleibt für Diagnosen verfügbar, auch wenn die lokale CLI-Konfiguration fehlt oder ungültig ist.
    - Der standardmäßige `gateway status` weist Service-Status, WebSocket-Verbindung und die beim Handshake sichtbare Authentifizierungs-Capability nach. Lese-/Schreib-/Admin-Operationen werden damit nicht nachgewiesen.
    - Diagnose-Probes verändern bei der erstmaligen Geräteauthentifizierung nichts: Sie verwenden ein vorhandenes zwischengespeichertes Geräte-Token erneut, falls eines existiert, erstellen aber keine neue CLI-Geräteidentität und keinen schreibgeschützten Geräte-Pairing-Datensatz, nur um den Status zu prüfen.
    - `gateway status` löst konfigurierte Authentifizierungs-SecretRefs nach Möglichkeit für die Probe-Authentifizierung auf.
    - Wenn ein erforderliches Authentifizierungs-SecretRef in diesem Befehlspfad nicht aufgelöst wird, meldet `gateway status --json` `rpc.authWarning`, wenn Probe-Konnektivität/-Authentifizierung fehlschlägt; übergeben Sie `--token`/`--password` explizit oder lösen Sie zuerst die Secret-Quelle auf.
    - Wenn die Probe erfolgreich ist, werden Warnungen zu nicht aufgelösten Authentifizierungsreferenzen unterdrückt, um falsch positive Meldungen zu vermeiden.
    - Verwenden Sie `--require-rpc` in Skripten und Automatisierung, wenn ein lauschender Service nicht ausreicht und auch RPC-Aufrufe mit Lese-Scope fehlerfrei funktionieren müssen.
    - `--deep` fügt einen Best-Effort-Scan nach zusätzlichen launchd-/systemd-/schtasks-Installationen hinzu. Wenn mehrere gateway-ähnliche Services erkannt werden, gibt die menschenlesbare Ausgabe Bereinigungshinweise aus und warnt, dass die meisten Setups ein Gateway pro Maschine ausführen sollten.
    - `--deep` meldet auch eine aktuelle Übergabe für einen Neustart des Gateway-Supervisors, wenn der Service-Prozess für einen Neustart durch einen externen Supervisor sauber beendet wurde.
    - Die menschenlesbare Ausgabe enthält den aufgelösten Dateilogpfad sowie eine Momentaufnahme der CLI- und Service-Konfigurationspfade/-Gültigkeit, um Abweichungen bei Profilen oder Statusverzeichnissen zu diagnostizieren.

  </Accordion>
  <Accordion title="Linux-systemd-Prüfungen auf Authentifizierungsdrift">
    - Bei Linux-systemd-Installationen lesen Prüfungen auf Service-Authentifizierungsdrift sowohl `Environment=`- als auch `EnvironmentFile=`-Werte aus der Unit (einschließlich `%h`, Pfaden in Anführungszeichen, mehreren Dateien und optionalen `-`-Dateien).
    - Drift-Prüfungen lösen `gateway.auth.token`-SecretRefs mithilfe der zusammengeführten Laufzeitumgebung auf (zuerst Service-Befehlsumgebung, dann Prozessumgebung als Fallback).
    - Wenn Token-Authentifizierung nicht effektiv aktiv ist (expliziter `gateway.auth.mode` von `password`/`none`/`trusted-proxy` oder nicht gesetzter Modus, bei dem das Passwort gewinnen kann und kein Token-Kandidat gewinnen kann), überspringen Token-Drift-Prüfungen die Auflösung des Konfigurationstokens.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` ist der Befehl zum „Alles debuggen“. Er prüft immer:

- Ihr konfiguriertes Remote-Gateway (falls gesetzt) und
- localhost (Loopback) **auch wenn Remote konfiguriert ist**.

Wenn Sie `--url` übergeben, wird dieses explizite Ziel vor beiden hinzugefügt. Die menschenlesbare Ausgabe beschriftet die Ziele als:

- `URL (explicit)`
- `Remote (configured)` oder `Remote (configured, inactive)`
- `Local loopback`

<Note>
Wenn mehrere Gateways erreichbar sind, gibt der Befehl alle aus. Mehrere Gateways werden unterstützt, wenn Sie isolierte Profile/Ports verwenden (z. B. einen Rettungsbot), aber die meisten Installationen führen weiterhin ein einzelnes Gateway aus.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="Interpretation">
    - `Reachable: yes` bedeutet, dass mindestens ein Ziel eine WebSocket-Verbindung angenommen hat.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` meldet, was die Probe über die Authentifizierung nachweisen konnte. Dies ist von der Erreichbarkeit getrennt.
    - `Read probe: ok` bedeutet, dass Detail-RPC-Aufrufe mit Lese-Scope (`health`/`status`/`system-presence`/`config.get`) ebenfalls erfolgreich waren.
    - `Read probe: limited - missing scope: operator.read` bedeutet, dass die Verbindung erfolgreich war, der RPC mit Lese-Scope aber eingeschränkt ist. Dies wird als **eingeschränkte** Erreichbarkeit gemeldet, nicht als vollständiger Fehler.
    - `Read probe: failed` nach `Connect: ok` bedeutet, dass das Gateway die WebSocket-Verbindung angenommen hat, die anschließenden Lesediagnosen aber ein Timeout erreicht haben oder fehlgeschlagen sind. Auch dies ist **eingeschränkte** Erreichbarkeit, kein unerreichbares Gateway.
    - Wie `gateway status` verwendet die Probe vorhandene zwischengespeicherte Geräteauthentifizierung erneut, erstellt aber keine erstmalige Geräteidentität oder keinen Pairing-Status.
    - Der Exit-Code ist nur dann ungleich null, wenn kein geprüftes Ziel erreichbar ist.

  </Accordion>
  <Accordion title="JSON-Ausgabe">
    Oberste Ebene:

    - `ok`: Mindestens ein Ziel ist erreichbar.
    - `degraded`: Mindestens ein Ziel hat eine Verbindung angenommen, aber keine vollständige Detail-RPC-Diagnose abgeschlossen.
    - `capability`: Beste Capability, die über erreichbare Ziele hinweg gesehen wurde (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` oder `unknown`).
    - `primaryTargetId`: Bestes Ziel, das in dieser Reihenfolge als aktiver Gewinner behandelt werden soll: explizite URL, SSH-Tunnel, konfigurierte Remote-Instanz, dann local loopback.
    - `warnings[]`: Best-Effort-Warnungsdatensätze mit `code`, `message` und optionalen `targetIds`.
    - `network`: Hinweise auf local loopback-/Tailnet-URLs, abgeleitet aus aktueller Konfiguration und Host-Netzwerk.
    - `discovery.timeoutMs` und `discovery.count`: Das tatsächlich verwendete Discovery-Budget und die Ergebnisanzahl für diesen Probe-Durchlauf.

    Pro Ziel (`targets[].connect`):

    - `ok`: Erreichbarkeit nach Verbindung plus Klassifizierung als eingeschränkt.
    - `rpcOk`: Vollständiger Detail-RPC-Erfolg.
    - `scopeLimited`: Detail-RPC ist wegen fehlendem Operator-Scope fehlgeschlagen.

    Pro Ziel (`targets[].auth`):

    - `role`: Authentifizierungsrolle, die in `hello-ok` gemeldet wurde, sofern verfügbar.
    - `scopes`: Gewährte Scopes, die in `hello-ok` gemeldet wurden, sofern verfügbar.
    - `capability`: Die offengelegte Authentifizierungs-Capability-Klassifizierung für dieses Ziel.

  </Accordion>
  <Accordion title="Häufige Warncodes">
    - `ssh_tunnel_failed`: SSH-Tunnel-Einrichtung ist fehlgeschlagen; der Befehl ist auf direkte Probes zurückgefallen.
    - `multiple_gateways`: Mehr als ein Ziel war erreichbar; dies ist ungewöhnlich, sofern Sie nicht absichtlich isolierte Profile ausführen, etwa einen Rettungsbot.
    - `auth_secretref_unresolved`: Ein konfiguriertes Authentifizierungs-SecretRef konnte für ein fehlgeschlagenes Ziel nicht aufgelöst werden.
    - `probe_scope_limited`: WebSocket-Verbindung war erfolgreich, aber die Lese-Probe wurde durch fehlendes `operator.read` eingeschränkt.

  </Accordion>
</AccordionGroup>

#### Remote über SSH (Parität zur Mac-App)

Der Modus „Remote über SSH“ der macOS-App verwendet eine lokale Portweiterleitung, damit das Remote-Gateway (das möglicherweise nur an Loopback gebunden ist) unter `ws://127.0.0.1:<port>` erreichbar wird.

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
  Wählen Sie den ersten erkannten Gateway-Host als SSH-Ziel aus dem aufgelösten Discovery-Endpunkt (`local.` plus die konfigurierte Wide-Area-Domain, falls vorhanden). Nur-TXT-Hinweise werden ignoriert.
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
  Hauptsächlich für agentenartige RPCs, die Zwischenereignisse vor einer finalen Nutzlast streamen.
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

Verwenden Sie `--wrapper`, wenn der verwaltete Service über eine andere ausführbare Datei starten muss, zum Beispiel ein
Secrets-Manager-Shim oder ein Run-as-Helfer. Der Wrapper erhält die normalen Gateway-Argumente und ist
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
    - `gateway restart`: `--safe`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start|stop`: `--json`

  </Accordion>
  <Accordion title="Lebenszyklusverhalten">
    - Verwenden Sie `gateway restart`, um einen verwalteten Service neu zu starten. Verketten Sie `gateway stop` und `gateway start` nicht als Ersatz für einen Neustart; unter macOS deaktiviert `gateway stop` den LaunchAgent absichtlich, bevor er gestoppt wird.
    - `gateway restart --safe` fordert das laufende Gateway auf, aktive OpenClaw-Arbeit vorab zu prüfen und den Neustart aufzuschieben, bis Antwortzustellung, eingebettete Ausführungen und Task-Ausführungen abgearbeitet sind. `--safe` kann nicht mit `--force` oder `--wait` kombiniert werden.
    - `gateway restart --wait 30s` überschreibt das konfigurierte Drain-Budget für den Neustart für diesen Neustart. Reine Zahlen sind Millisekunden; Einheiten wie `s`, `m` und `h` werden akzeptiert. `--wait 0` wartet unbegrenzt.
    - `gateway restart --force` überspringt das Leerlaufen aktiver Arbeit und startet sofort neu. Verwenden Sie dies, wenn ein Operator die aufgeführten Task-Blocker bereits geprüft hat und das Gateway jetzt wieder verfügbar haben möchte.
    - Lebenszyklusbefehle akzeptieren `--json` für Skripting.

  </Accordion>
  <Accordion title="Auth and SecretRefs at install time">
    - Wenn die Token-Authentifizierung einen Token erfordert und `gateway.auth.token` über SecretRef verwaltet wird, validiert `gateway install`, dass die SecretRef auflösbar ist, speichert den aufgelösten Token aber nicht in den Service-Umgebungsmetadaten.
    - Wenn die Token-Authentifizierung einen Token erfordert und die konfigurierte Token-SecretRef nicht aufgelöst ist, schlägt die Installation geschlossen fehl, statt Fallback-Klartext zu speichern.
    - Verwenden Sie für die Passwortauthentifizierung bei `gateway run` bevorzugt `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` oder ein SecretRef-gestütztes `gateway.auth.password` statt eines inline angegebenen `--password`.
    - Im abgeleiteten Authentifizierungsmodus lockert ein nur in der Shell gesetztes `OPENCLAW_GATEWAY_PASSWORD` die Token-Anforderungen für die Installation nicht; verwenden Sie dauerhafte Konfiguration (`gateway.auth.password` oder Konfigurations-`env`), wenn Sie einen verwalteten Service installieren.
    - Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, wird die Installation blockiert, bis der Modus explizit gesetzt wird.

  </Accordion>
</AccordionGroup>

## Gateways entdecken (Bonjour)

`gateway discover` sucht nach Gateway-Beacons (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): Wählen Sie eine Domain (Beispiel: `openclaw.internal.`) und richten Sie Split-DNS + einen DNS-Server ein; siehe [Bonjour](/de/gateway/bonjour).

Nur Gateways mit aktivierter Bonjour-Erkennung (Standard) veröffentlichen den Beacon.

Wide-Area-Erkennungseinträge enthalten (TXT):

- `role` (Hinweis auf die Gateway-Rolle)
- `transport` (Transporthinweis, z. B. `gateway`)
- `gatewayPort` (WebSocket-Port, normalerweise `18789`)
- `sshPort` (optional; Clients verwenden standardmäßig `22` als SSH-Ziel, wenn er fehlt)
- `tailnetDns` (MagicDNS-Hostname, sofern verfügbar)
- `gatewayTls` / `gatewayTlsSha256` (TLS aktiviert + Zertifikatsfingerabdruck)
- `cliPath` (Remote-Installationshinweis, der in die Wide-Area-Zone geschrieben wird)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Zeitüberschreitung pro Befehl (Durchsuchen/Auflösen).
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
- `wsUrl` in der JSON-Ausgabe wird aus dem aufgelösten Service-Endpunkt abgeleitet, nicht aus reinen TXT-Hinweisen wie `lanHost` oder `tailnetDns`.
- Bei `local.` mDNS werden `sshPort` und `cliPath` nur übertragen, wenn `discovery.mdns.mode` auf `full` gesetzt ist. Wide-Area DNS-SD schreibt weiterhin `cliPath`; `sshPort` bleibt auch dort optional.

</Note>

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Gateway-Runbook](/de/gateway)
