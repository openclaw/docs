---
read_when:
    - Gateway über die CLI ausführen (Entwicklung oder Server)
    - Debugging von Gateway-Authentifizierung, Bind-Modi und Konnektivität
    - Gateways über Bonjour entdecken (lokal + Wide-Area-DNS-SD)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — Gateways ausführen, abfragen und entdecken
title: Gateway
x-i18n:
    generated_at: "2026-06-30T13:58:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c33900a9bdc61c1e922e424dbfce139c6591a7a5071ed8263b172e19bdf653b
    source_path: cli/gateway.md
    workflow: 16
---

Der Gateway ist der WebSocket-Server von OpenClaw (Kanäle, Nodes, Sitzungen, Hooks). Die Unterbefehle auf dieser Seite befinden sich unter `openclaw gateway …`.

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
    - Standardmäßig verweigert der Gateway den Start, sofern `gateway.mode=local` nicht in `~/.openclaw/openclaw.json` gesetzt ist. Verwenden Sie `--allow-unconfigured` für Ad-hoc-/Dev-Ausführungen.
    - Von `openclaw onboard --mode local` und `openclaw setup` wird erwartet, dass sie `gateway.mode=local` schreiben. Wenn die Datei vorhanden ist, aber `gateway.mode` fehlt, behandeln Sie dies als beschädigte oder überschriebene Konfiguration und reparieren Sie sie, statt den lokalen Modus implizit anzunehmen.
    - Wenn die Datei vorhanden ist und `gateway.mode` fehlt, behandelt der Gateway dies als verdächtige Konfigurationsbeschädigung und verweigert es, für Sie „lokal zu raten“.
    - Binden außerhalb von Loopback ohne Authentifizierung wird blockiert (Sicherheitsleitplanke).
    - `lan`, `tailnet` und `custom` werden derzeit über reine IPv4-BYOH-Pfade aufgelöst.
    - Reines IPv6-BYOH wird auf diesem Pfad derzeit nicht nativ unterstützt. Verwenden Sie einen IPv4-Sidecar oder Proxy, wenn der Host selbst nur IPv6 unterstützt.
    - `SIGUSR1` löst einen In-Process-Neustart aus, wenn er autorisiert ist (`commands.restart` ist standardmäßig aktiviert; setzen Sie `commands.restart: false`, um manuelle Neustarts zu blockieren, während Anwendung/Aktualisierung von Gateway-Tool/Konfiguration weiterhin erlaubt bleiben).
    - `SIGINT`-/`SIGTERM`-Handler stoppen den Gateway-Prozess, stellen aber keinen benutzerdefinierten Terminalzustand wieder her. Wenn Sie die CLI mit einer TUI oder Raw-Mode-Eingabe umschließen, stellen Sie das Terminal vor dem Beenden wieder her.

  </Accordion>
</AccordionGroup>

### Optionen

<ParamField path="--port <port>" type="number">
  WebSocket-Port (Standard stammt aus Konfiguration/Env; üblicherweise `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  Bindemodus des Listeners. `lan`, `tailnet` und `custom` werden derzeit über reine IPv4-Pfade aufgelöst.
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
  Erwartet derzeit eine IPv4-Adresse. Für reines IPv6-BYOH platzieren Sie einen IPv4-Sidecar oder Proxy vor dem Gateway und verweisen OpenClaw auf diesen IPv4-Endpunkt.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Gateway-Start ohne `gateway.mode=local` in der Konfiguration zulassen. Umgeht die Startschutzprüfung nur für Ad-hoc-/Dev-Bootstrap; schreibt oder repariert die Konfigurationsdatei nicht.
</ParamField>
<ParamField path="--dev" type="boolean">
  Dev-Konfiguration und Workspace erstellen, falls sie fehlen (überspringt BOOTSTRAP.md).
</ParamField>
<ParamField path="--reset" type="boolean">
  Dev-Konfiguration, Anmeldedaten, Sitzungen und Workspace zurücksetzen (erfordert `--dev`).
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
  Rohereignisse des Modellstreams in jsonl protokollieren.
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

`openclaw gateway restart --safe` weist den laufenden Gateway an, aktive Arbeit vorab zu prüfen und einen zusammengefassten Neustart zu planen, nachdem aktive Arbeit abgearbeitet wurde. Der standardmäßige sichere Neustart wartet bis zur konfigurierten Dauer `gateway.reload.deferralTimeoutMs` auf aktive Arbeit (Standard: 5 Minuten); wenn dieses Budget abläuft, wird der Neustart erzwungen. Setzen Sie `gateway.reload.deferralTimeoutMs` auf `0`, um unbegrenzt sicher zu warten, ohne jemals zu erzwingen. Einfaches `restart` behält das bestehende Service-Manager-Verhalten bei; `--force` bleibt der unmittelbare Überschreibungspfad.

`openclaw gateway restart --safe --skip-deferral` führt denselben OpenClaw-bewussten koordinierten Neustart wie `--safe` aus, umgeht jedoch die Zurückstellungsprüfung für aktive Arbeit, sodass der Gateway den Neustart sofort ausgibt, selbst wenn Blocker gemeldet werden. Verwenden Sie dies als Ausweichmöglichkeit für Operatoren, wenn eine Zurückstellung durch eine festhängende Task-Ausführung blockiert wurde und `--safe` allein möglicherweise durch `gateway.reload.deferralTimeoutMs` begrenzt ist. `--skip-deferral` erfordert `--safe`.

<Warning>
Inline-`--password` kann in lokalen Prozesslisten sichtbar werden. Bevorzugen Sie `--password-file`, Env oder ein SecretRef-gestütztes `gateway.auth.password`.
</Warning>

### Gateway-Profiling

- Setzen Sie `OPENCLAW_GATEWAY_STARTUP_TRACE=1`, um Phasenzeiten während des Gateway-Starts zu protokollieren, einschließlich `eventLoopMax`-Verzögerung pro Phase und Plugin-Lookup-Table-Zeiten für installierten Index, Manifest-Registry, Startplanung und Owner-Map-Arbeit.
- Setzen Sie `OPENCLAW_GATEWAY_RESTART_TRACE=1`, um neustartspezifische `restart trace:`-Zeilen für Neustartsignalbehandlung, Abwarten aktiver Arbeit, Herunterfahrphasen, nächsten Start, Bereitschaftszeitpunkt und Speichermetriken zu protokollieren.
- Setzen Sie `OPENCLAW_DIAGNOSTICS=timeline` mit `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>`, um eine Best-Effort-JSONL-Startdiagnose-Zeitleiste für externe QA-Harnesse zu schreiben. Sie können das Flag auch mit `diagnostics.flags: ["timeline"]` in der Konfiguration aktivieren; der Pfad wird weiterhin über Env bereitgestellt. Fügen Sie `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` hinzu, um Event-Loop-Samples einzuschließen.
- Führen Sie zuerst `pnpm build` aus, dann `pnpm test:startup:gateway -- --runs 5 --warmup 1`, um den Gateway-Start gegen den gebauten CLI-Einstieg zu benchmarken. Der Benchmark erfasst die erste Prozessausgabe, `/healthz`, `/readyz`, Start-Trace-Zeiten, Event-Loop-Verzögerung und Zeitdetails der Plugin-Lookup-Table.
- Führen Sie zuerst `pnpm build` aus, dann `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5`, um den In-Process-Gateway-Neustart gegen den gebauten CLI-Einstieg auf macOS oder Linux zu benchmarken. Der Neustart-Benchmark verwendet SIGUSR1, aktiviert sowohl Start- als auch Neustart-Traces im Child-Prozess und erfasst nächstes `/healthz`, nächstes `/readyz`, Ausfallzeit, Bereitschaftszeitpunkt, CPU, RSS und Neustart-Trace-Metriken.
- Behandeln Sie `/healthz` als Lebendigkeitsprüfung und `/readyz` als nutzbare Bereitschaft. Trace-Zeilen und Benchmark-Ausgabe dienen der Owner-Zuordnung; behandeln Sie nicht eine einzelne Trace-Spanne oder ein einzelnes Sample als vollständige Performance-Schlussfolgerung.

## Laufenden Gateway abfragen

Alle Abfragebefehle verwenden WebSocket-RPC.

<Tabs>
  <Tab title="Ausgabemodi">
    - Standard: menschenlesbar (farbig in TTY).
    - `--json`: maschinenlesbares JSON (ohne Styling/Spinner).
    - `--no-color` (oder `NO_COLOR=1`): ANSI deaktivieren, während das menschliche Layout beibehalten wird.

  </Tab>
  <Tab title="Gemeinsame Optionen">
    - `--url <url>`: Gateway-WebSocket-URL.
    - `--token <token>`: Gateway-Token.
    - `--password <password>`: Gateway-Passwort.
    - `--timeout <ms>`: Timeout/Budget (variiert je nach Befehl).
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

Der HTTP-Endpunkt `/healthz` ist eine Lebendigkeitsprobe: Er liefert zurück, sobald der Server HTTP beantworten kann. Der HTTP-Endpunkt `/readyz` ist strenger und bleibt rot, solange Start-Plugin-Sidecars, Kanäle oder konfigurierte Hooks noch stabilisiert werden. Lokale oder authentifizierte detaillierte Bereitschaftsantworten enthalten einen `eventLoop`-Diagnoseblock mit Event-Loop-Verzögerung, Event-Loop-Auslastung, CPU-Kern-Verhältnis und einem `degraded`-Flag.

<ParamField path="--port <port>" type="number">
  Einen lokalen local loopback-Gateway auf diesem Port ansprechen. Dies überschreibt `OPENCLAW_GATEWAY_URL` und `OPENCLAW_GATEWAY_PORT` für den Health-Aufruf.
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
  Anzahl der einzuschließenden Tage.
</ParamField>
<ParamField path="--agent <id>" type="string">
  Die Kostenzusammenfassung auf eine konfigurierte Agent-ID begrenzen.
</ParamField>
<ParamField path="--all-agents" type="boolean">
  Die Kostenzusammenfassung über alle konfigurierten Agents aggregieren. Kann nicht mit `--agent` kombiniert werden.
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
  Maximale Anzahl aktueller einzuschließender Ereignisse (max. `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  Nach Diagnoseereignistyp filtern, z. B. `payload.large` oder `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Nur Ereignisse nach einer Diagnose-Sequenznummer einschließen.
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
    - Datensätze behalten Betriebsmetadaten: Ereignisnamen, Zählwerte, Bytegrößen, Speicherwerte, Queue-/Sitzungszustand, Kanal-/Plugin-Namen und redigierte Sitzungszusammenfassungen. Sie behalten keinen Chattext, keine Webhook-Bodys, Tool-Ausgaben, rohen Anfrage- oder Antwort-Bodys, Tokens, Cookies, Geheimwerte, Hostnamen oder rohen Sitzungs-IDs. Setzen Sie `diagnostics.enabled: false`, um den Recorder vollständig zu deaktivieren.
    - Bei fatalen Gateway-Beendigungen, Shutdown-Timeouts und Neustart-Startfehlern schreibt OpenClaw denselben Diagnose-Snapshot nach `~/.openclaw/logs/stability/openclaw-stability-*.json`, wenn der Recorder Ereignisse hat. Prüfen Sie das neueste Bundle mit `openclaw gateway stability --bundle latest`; `--limit`, `--type` und `--since-seq` gelten ebenfalls für Bundle-Ausgaben.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Schreibt eine lokale Diagnose-ZIP, die zum Anhängen an Fehlerberichte vorgesehen ist. Zum Datenschutzmodell und zu Bundle-Inhalten siehe [Diagnoseexport](/de/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Ausgabepfad der ZIP-Datei. Standardmäßig ein Support-Export im Zustandsverzeichnis.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Maximale Anzahl bereinigter Protokollzeilen, die einbezogen werden.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  Maximale Protokollbytes, die geprüft werden.
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
  Suche nach persistiertem Stabilitätsbundle überspringen.
</ParamField>
<ParamField path="--json" type="boolean">
  Geschriebenen Pfad, Größe und Manifest als JSON ausgeben.
</ParamField>

Der Export enthält ein Manifest, eine Markdown-Zusammenfassung, die Konfigurationsform, bereinigte Konfigurationsdetails, bereinigte Protokollzusammenfassungen, bereinigte Gateway-Status-/Health-Snapshots und das neueste Stabilitätsbundle, sofern eines vorhanden ist.

Er ist zum Teilen gedacht. Er behält Betriebsdetails bei, die beim Debugging helfen, etwa sichere OpenClaw-Protokollfelder, Subsystemnamen, Statuscodes, Dauern, konfigurierte Modi, Ports, Plugin-IDs, Provider-IDs, nicht geheime Funktionseinstellungen und geschwärzte operative Protokollmeldungen. Er lässt Chattext, Webhook-Bodys, Tool-Ausgaben, Zugangsdaten, Cookies, Konto-/Nachrichtenkennungen, Prompt-/Anweisungstext, Hostnamen und geheime Werte aus oder schwärzt sie. Wenn eine LogTape-artige Nachricht wie Nutzlasttext von Benutzer/Chat/Tool aussieht, behält der Export nur bei, dass eine Nachricht ausgelassen wurde, plus ihre Byteanzahl.

### `gateway status`

`gateway status` zeigt den Gateway-Dienst (launchd/systemd/schtasks) sowie optional eine Prüfung der Konnektivitäts-/Authentifizierungsfähigkeit.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Ein explizites Prüfziel hinzufügen. Konfigurierte Remote- und localhost-Ziele werden weiterhin geprüft.
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
  Die standardmäßige Konnektivitätsprüfung auf eine Leseprüfung hochstufen und mit einem von null verschiedenen Exit-Code beenden, wenn diese Leseprüfung fehlschlägt. Kann nicht mit `--no-probe` kombiniert werden.
</ParamField>

<AccordionGroup>
  <Accordion title="Status semantics">
    - `gateway status` bleibt für Diagnosen verfügbar, auch wenn die lokale CLI-Konfiguration fehlt oder ungültig ist.
    - Standardmäßig weist `gateway status` den Dienststatus, die WebSocket-Verbindung und die beim Handshake sichtbare Authentifizierungsfähigkeit nach. Lese-/Schreib-/Admin-Operationen werden nicht nachgewiesen.
    - Diagnoseprüfungen verändern nichts an der erstmaligen Geräteauthentifizierung: Sie verwenden ein vorhandenes zwischengespeichertes Geräte-Token wieder, sofern eines vorhanden ist, erstellen aber keine neue CLI-Geräteidentität und keinen schreibgeschützten Geräte-Pairing-Datensatz nur zur Statusprüfung.
    - `gateway status` löst konfigurierte Authentifizierungs-SecretRefs nach Möglichkeit für die Prüfauthentifizierung auf.
    - Wenn ein erforderlicher Authentifizierungs-SecretRef in diesem Befehlspfad nicht aufgelöst wird, meldet `gateway status --json` `rpc.authWarning`, wenn Konnektivität/Authentifizierung der Prüfung fehlschlägt; übergeben Sie `--token`/`--password` explizit oder lösen Sie zuerst die Secret-Quelle auf.
    - Wenn die Prüfung erfolgreich ist, werden Warnungen zu nicht aufgelösten Authentifizierungsreferenzen unterdrückt, um False Positives zu vermeiden.
    - Wenn die Prüfung aktiviert ist, enthält die JSON-Ausgabe `gateway.version`, sofern der laufende Gateway sie meldet; `--require-rpc` kann auf die RPC-Nutzlast `status.runtimeVersion` zurückfallen, wenn die nachfolgende Handshake-Prüfung keine Versionsmetadaten liefern kann.
    - Verwenden Sie `--require-rpc` in Skripten und Automatisierung, wenn ein lauschender Dienst nicht ausreicht und auch RPC-Aufrufe mit Leseberechtigung funktionsfähig sein müssen.
    - `--deep` fügt einen Best-Effort-Scan nach zusätzlichen launchd-/systemd-/schtasks-Installationen hinzu. Wenn mehrere gateway-artige Dienste erkannt werden, gibt die menschenlesbare Ausgabe Bereinigungshinweise aus und warnt, dass die meisten Setups einen Gateway pro Maschine ausführen sollten.
    - `--deep` meldet außerdem eine kürzliche Übergabe eines Gateway-Supervisor-Neustarts, wenn der Dienstprozess sauber für einen externen Supervisor-Neustart beendet wurde.
    - `--deep` führt die Konfigurationsvalidierung im Plugin-bewussten Modus (`pluginValidation: "full"`) aus und zeigt konfigurierte Plugin-Manifestwarnungen (zum Beispiel fehlende Metadaten für Kanalkonfigurationen), damit Installations- und Update-Smoke-Checks sie erfassen. Standardmäßig behält `gateway status` den schnellen schreibgeschützten Pfad bei, der die Plugin-Validierung überspringt.
    - Die menschenlesbare Ausgabe enthält den aufgelösten Dateiprotokollpfad sowie einen Snapshot der CLI-gegen-Dienst-Konfigurationspfade/-gültigkeit, um Profil- oder Zustandsverzeichnis-Abweichungen zu diagnostizieren.

  </Accordion>
  <Accordion title="Linux systemd auth-drift checks">
    - Bei Linux-systemd-Installationen lesen Prüfungen auf Authentifizierungsdrift sowohl `Environment=`- als auch `EnvironmentFile=`-Werte aus der Unit (einschließlich `%h`, zitierter Pfade, mehrerer Dateien und optionaler `-`-Dateien).
    - Drift-Prüfungen lösen `gateway.auth.token`-SecretRefs über die zusammengeführte Laufzeitumgebung auf (zuerst Dienstbefehlsumgebung, dann Prozessumgebung als Fallback).
    - Wenn Token-Authentifizierung nicht effektiv aktiv ist (expliziter `gateway.auth.mode` von `password`/`none`/`trusted-proxy` oder nicht gesetzter Modus, bei dem Passwort gewinnen kann und kein Token-Kandidat gewinnen kann), überspringen Token-Drift-Prüfungen die Auflösung des Konfigurationstokens.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` ist der Befehl zum „alles debuggen“. Er prüft immer:

- Ihren konfigurierten Remote-Gateway (falls gesetzt) und
- localhost (Loopback) **auch wenn Remote konfiguriert ist**.

Wenn Sie `--url` übergeben, wird dieses explizite Ziel vor beiden hinzugefügt. Die menschenlesbare Ausgabe beschriftet die Ziele als:

- `URL (explicit)`
- `Remote (configured)` oder `Remote (configured, inactive)`
- `Local loopback`

<Note>
Wenn mehrere Prüfziele erreichbar sind, werden alle ausgegeben. Ein SSH-Tunnel, eine TLS-/Proxy-URL und eine konfigurierte Remote-URL können alle auf denselben Gateway zeigen, auch wenn sich ihre Transportports unterscheiden; `multiple_gateways` ist für unterschiedliche oder identitätsunklare erreichbare Gateways reserviert. Mehrere Gateways werden unterstützt, wenn Sie isolierte Profile verwenden (z. B. einen Rettungsbot), aber die meisten Installationen führen weiterhin einen einzelnen Gateway aus.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  Diesen Port für das lokale local loopback-Prüfziel und den Remote-Port des SSH-Tunnels verwenden. Ohne `--url` wählt dies das lokale local loopback-Ziel statt der konfigurierten Gateway-Umgebungs-URL, des Umgebungsports oder der Remote-Ziele aus.
</ParamField>

<AccordionGroup>
  <Accordion title="Interpretation">
    - `Reachable: yes` bedeutet, dass mindestens ein Ziel eine WebSocket-Verbindung angenommen hat.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` meldet, was die Prüfung über die Authentifizierung nachweisen konnte. Das ist von der Erreichbarkeit getrennt.
    - `Read probe: ok` bedeutet, dass Detail-RPC-Aufrufe mit Leseberechtigung (`health`/`status`/`system-presence`/`config.get`) ebenfalls erfolgreich waren.
    - `Read probe: limited - missing scope: operator.read` bedeutet, dass die Verbindung erfolgreich war, der RPC mit Leseberechtigung aber eingeschränkt ist. Dies wird als **beeinträchtigte** Erreichbarkeit gemeldet, nicht als vollständiger Fehler.
    - `Read probe: failed` nach `Connect: ok` bedeutet, dass der Gateway die WebSocket-Verbindung angenommen hat, nachfolgende Lesediagnosen aber in einen Timeout gelaufen oder fehlgeschlagen sind. Auch dies ist **beeinträchtigte** Erreichbarkeit, kein unerreichbarer Gateway.
    - Wie `gateway status` verwendet die Prüfung vorhandene zwischengespeicherte Geräteauthentifizierung wieder, erstellt aber keine erstmalige Geräteidentität oder keinen Pairing-Zustand.
    - Der Exit-Code ist nur dann von null verschieden, wenn kein geprüftes Ziel erreichbar ist.

  </Accordion>
  <Accordion title="JSON output">
    Oberste Ebene:

    - `ok`: Mindestens ein Ziel ist erreichbar.
    - `degraded`: Mindestens ein Ziel hat eine Verbindung angenommen, aber die vollständige Detail-RPC-Diagnose nicht abgeschlossen.
    - `capability`: Beste Fähigkeit, die über erreichbare Ziele hinweg gesehen wurde (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` oder `unknown`).
    - `primaryTargetId`: Bestes Ziel, das in dieser Reihenfolge als aktiver Gewinner behandelt werden soll: explizite URL, SSH-Tunnel, konfigurierte Remote-Adresse, dann local loopback.
    - `warnings[]`: Best-Effort-Warndatensätze mit `code`, `message` und optionalen `targetIds`.
    - `network`: Hinweise zu local loopback-/Tailnet-URLs, abgeleitet aus aktueller Konfiguration und Host-Netzwerk.
    - `discovery.timeoutMs` und `discovery.count`: das tatsächliche Discovery-Budget und die Ergebnisanzahl, die für diesen Prüfdurchlauf verwendet wurden.

    Pro Ziel (`targets[].connect`):

    - `ok`: Erreichbarkeit nach Verbindungsaufbau plus Einstufung als beeinträchtigt.
    - `rpcOk`: Vollständiger Detail-RPC-Erfolg.
    - `scopeLimited`: Detail-RPC ist wegen fehlender Operator-Berechtigung fehlgeschlagen.

    Pro Ziel (`targets[].auth`):

    - `role`: Authentifizierungsrolle, die in `hello-ok` gemeldet wird, sofern verfügbar.
    - `scopes`: Erteilte Berechtigungsumfänge, die in `hello-ok` gemeldet werden, sofern verfügbar.
    - `capability`: Die angezeigte Klassifizierung der Authentifizierungsfähigkeit für dieses Ziel.

  </Accordion>
  <Accordion title="Common warning codes">
    - `ssh_tunnel_failed`: SSH-Tunnel-Einrichtung fehlgeschlagen; der Befehl ist auf direkte Prüfungen zurückgefallen.
    - `multiple_gateways`: Unterschiedliche Gateway-Identitäten waren erreichbar, oder OpenClaw konnte nicht nachweisen, dass erreichbare Ziele derselbe Gateway sind. Ein SSH-Tunnel, eine Proxy-URL oder eine konfigurierte Remote-URL zum selben Gateway löst diese Warnung nicht aus.
    - `auth_secretref_unresolved`: Ein konfigurierter Authentifizierungs-SecretRef konnte für ein fehlgeschlagenes Ziel nicht aufgelöst werden.
    - `probe_scope_limited`: WebSocket-Verbindung erfolgreich, aber die Leseprüfung war durch fehlendes `operator.read` eingeschränkt.

  </Accordion>
</AccordionGroup>

#### Remote über SSH (Parität zur Mac-App)

Der macOS-App-Modus „Remote über SSH“ verwendet eine lokale Portweiterleitung, sodass der Remote-Gateway (der möglicherweise nur an Loopback gebunden ist) unter `ws://127.0.0.1:<port>` erreichbar wird.

CLI-Entsprechung:

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

Verwenden Sie `--wrapper`, wenn der verwaltete Dienst über eine andere ausführbare Datei gestartet werden muss, zum Beispiel einen
Secrets-Manager-Shim oder einen Ausführen-als-Helfer. Der Wrapper erhält die normalen Gateway-Argumente und ist
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
ausführbare Datei ist, schreibt den Wrapper in die `ProgramArguments` des Dienstes und persistiert
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
  <Accordion title="Lifecycle-Verhalten">
    - Verwenden Sie `gateway restart`, um einen verwalteten Dienst neu zu starten. Verketten Sie `gateway stop` und `gateway start` nicht als Ersatz für einen Neustart.
    - Unter macOS verwendet `gateway stop` standardmäßig `launchctl bootout`. Dadurch wird der LaunchAgent aus der aktuellen Boot-Sitzung entfernt, ohne eine Deaktivierung zu persistieren — die automatische KeepAlive-Wiederherstellung bleibt für zukünftige Abstürze aktiv, und `gateway start` aktiviert sauber erneut, ohne ein manuelles `launchctl enable`. Übergeben Sie `--disable`, um KeepAlive und RunAtLoad dauerhaft zu unterdrücken, sodass der Gateway bis zum nächsten expliziten `gateway start` nicht erneut startet; verwenden Sie dies, wenn ein manueller Stopp Neustarts des Systems überdauern soll.
    - `gateway restart --safe` fordert den laufenden Gateway auf, aktive Arbeit vorab zu prüfen und einen zusammengefassten Neustart zu planen, nachdem aktive Arbeit abgearbeitet ist. Der standardmäßige sichere Neustart wartet bis zum konfigurierten `gateway.reload.deferralTimeoutMs` (Standard: 5 Minuten) auf aktive Arbeit; wenn dieses Zeitbudget abläuft, wird der Neustart erzwungen. Setzen Sie `gateway.reload.deferralTimeoutMs` auf `0`, um unbegrenzt sicher zu warten, ohne jemals zu erzwingen. `--safe` kann nicht mit `--force` oder `--wait` kombiniert werden.
    - `gateway restart --wait 30s` überschreibt das konfigurierte Ablaufbudget für diesen Neustart. Bloße Zahlen sind Millisekunden; Einheiten wie `s`, `m` und `h` werden akzeptiert. `--wait 0` wartet unbegrenzt.
    - `gateway restart --safe --skip-deferral` führt den OpenClaw-bewussten sicheren Neustart aus, umgeht aber die Aufschub-Sperre, sodass der Gateway den Neustart sofort ausgibt, selbst wenn Blocker gemeldet werden. Dies ist ein Notausstieg für Operatoren bei hängenden Task-Run-Aufschüben; erfordert `--safe`.
    - `gateway restart --force` überspringt das Abarbeiten aktiver Arbeit und startet sofort neu. Verwenden Sie dies, wenn ein Operator die aufgelisteten Task-Blocker bereits geprüft hat und den Gateway jetzt wieder verfügbar haben möchte.
    - Lifecycle-Befehle akzeptieren `--json` für Skripting.

  </Accordion>
  <Accordion title="Authentifizierung und SecretRefs zur Installationszeit">
    - Wenn Token-Authentifizierung ein Token erfordert und `gateway.auth.token` SecretRef-verwaltet ist, prüft `gateway install`, ob die SecretRef auflösbar ist, persistiert das aufgelöste Token aber nicht in Dienstumgebungsmetadaten.
    - Wenn Token-Authentifizierung ein Token erfordert und die konfigurierte Token-SecretRef nicht aufgelöst ist, schlägt die Installation geschlossen fehl, statt Fallback-Klartext zu persistieren.
    - Für Passwortauthentifizierung bei `gateway run` bevorzugen Sie `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` oder ein SecretRef-gestütztes `gateway.auth.password` gegenüber inline `--password`.
    - Im abgeleiteten Authentifizierungsmodus lockert ein nur in der Shell gesetztes `OPENCLAW_GATEWAY_PASSWORD` die Token-Anforderungen für die Installation nicht; verwenden Sie dauerhafte Konfiguration (`gateway.auth.password` oder config `env`), wenn Sie einen verwalteten Dienst installieren.
    - Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, wird die Installation blockiert, bis der Modus explizit gesetzt ist.

  </Accordion>
</AccordionGroup>

## Gateways ermitteln (Bonjour)

`gateway discover` sucht nach Gateway-Beacons (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): Wählen Sie eine Domain (Beispiel: `openclaw.internal.`) und richten Sie Split-DNS + einen DNS-Server ein; siehe [Bonjour](/de/gateway/bonjour).

Nur Gateways mit aktivierter Bonjour-Erkennung (Standard) veröffentlichen den Beacon.

Wide-Area-Erkennungsdatensätze können diese TXT-Hinweise enthalten:

- `role` (Hinweis auf Gateway-Rolle)
- `transport` (Transporthinweis, z. B. `gateway`)
- `gatewayPort` (WebSocket-Port, üblicherweise `18789`)
- `sshPort` (nur vollständiger Erkennungsmodus; Clients verwenden standardmäßig SSH-Ziele auf `22`, wenn er fehlt)
- `tailnetDns` (MagicDNS-Hostname, wenn verfügbar)
- `gatewayTls` / `gatewayTlsSha256` (TLS aktiviert + Zertifikatsfingerprint)
- `cliPath` (nur vollständiger Erkennungsmodus)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Zeitlimit pro Befehl (Suchen/Auflösen).
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
- `wsUrl` in der JSON-Ausgabe wird aus dem aufgelösten Dienstendpunkt abgeleitet, nicht aus reinen TXT-Hinweisen wie `lanHost` oder `tailnetDns`.
- Bei `local.` mDNS und Wide-Area DNS-SD werden `sshPort` und `cliPath` nur veröffentlicht, wenn `discovery.mdns.mode` auf `full` gesetzt ist.

</Note>

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Gateway-Runbook](/de/gateway)
