---
read_when:
    - Ausführen des Gateways über die CLI (Entwicklung oder Server)
    - Fehlerbehebung bei Gateway-Authentifizierung, Bindungsmodi und Konnektivität
    - Gateways über Bonjour erkennen (lokal + Wide-Area-DNS-SD)
    - Integration einer externen Prozessüberwachung für den Gateway
sidebarTitle: Gateway
summary: OpenClaw-Gateway-CLI (`openclaw gateway`) — Gateways ausführen, abfragen und erkennen
title: Gateway
x-i18n:
    generated_at: "2026-07-24T04:18:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0188d7c79571ebf8f350295775625533a83cb2eb909bcc8763e8ce81806d2214
    source_path: cli/gateway.md
    workflow: 16
---

Der Gateway ist der WebSocket-Server von OpenClaw (Kanäle, Nodes, Sitzungen, Hooks). Alle nachfolgenden Unterbefehle befinden sich unter `openclaw gateway ...`.

<CardGroup cols={3}>
  <Card title="Bonjour-Erkennung" href="/de/gateway/bonjour">
    Einrichtung von lokalem mDNS und Wide-Area-DNS-SD.
  </Card>
  <Card title="Übersicht zur Erkennung" href="/de/gateway/discovery">
    Wie OpenClaw Gateways bekannt gibt und findet.
  </Card>
  <Card title="Konfiguration" href="/de/gateway/configuration">
    Übergeordnete Gateway-Konfigurationsschlüssel.
  </Card>
</CardGroup>

## Gateway ausführen

```bash
openclaw gateway
openclaw gateway run   # äquivalente, explizite Form
```

<AccordionGroup>
  <Accordion title="Startverhalten">
    - Der Start wird verweigert, sofern `gateway.mode=local` nicht in `~/.openclaw/openclaw.json` festgelegt ist. Verwenden Sie `--allow-unconfigured` für Ad-hoc-/Entwicklungsausführungen; damit wird die Schutzprüfung umgangen, ohne die Konfiguration zu schreiben oder zu reparieren.
    - Wenn beim Start eine reparierbare ungültige Konfiguration gefunden wird, bietet ein interaktives Terminal an, `openclaw doctor --fix` auszuführen, und versucht den Start nach Zustimmung einmal erneut. Nicht interaktive Ausführungen reparieren niemals automatisch, sondern geben stattdessen den Befehl aus. Ist die reparierte Konfiguration weiterhin ungültig, bleibt der Start angehalten.
    - `openclaw onboard --mode local` und `openclaw setup` schreiben `gateway.mode=local`. Wenn die Konfigurationsdatei vorhanden ist, aber `gateway.mode` fehlt, wird dies als beschädigte oder überschriebene Konfiguration behandelt, und der Gateway versucht nicht, `local` für Sie zu erraten — führen Sie das Onboarding erneut aus, legen Sie den Schlüssel manuell fest oder übergeben Sie `--allow-unconfigured`.
    - Eine Bindung über die Loopback-Schnittstelle hinaus wird ohne Authentifizierung blockiert.
    - Die `--bind`-Werte `lan`, `tailnet` und `custom` werden derzeit ausschließlich über IPv4-Pfade aufgelöst; reine IPv6-Setups mit eigenem Host benötigen einen IPv4-Sidecar oder Proxy vor dem Gateway.
    - `SIGUSR1` löst bei entsprechender Autorisierung einen prozessinternen Neustart aus. `commands.restart` (Standard: aktiviert) steuert extern gesendete `SIGUSR1`; setzen Sie den Wert auf `false`, um manuelle Neustarts durch Betriebssystemsignale zu blockieren. Das agentenseitige Werkzeug `gateway` ist schreibgeschützt; Agenten fordern einen Neustart über das von Menschen genehmigte Delegierungswerkzeug `openclaw` an.
    - `SIGINT`/`SIGTERM` beenden den Prozess, stellen jedoch keinen benutzerdefinierten Terminalzustand wieder her — wenn Sie die CLI in eine TUI oder eine Eingabe im Raw-Modus einbetten, stellen Sie das Terminal vor dem Beenden selbst wieder her.

  </Accordion>
</AccordionGroup>

### Optionen

<ParamField path="--port <port>" type="number">
  WebSocket-Port (Standard aus Konfiguration/Umgebung; üblicherweise `18789`).
</ParamField>
<ParamField path="--bind <mode>" type="string">
  Bindungsmodus: `loopback` (Standard), `lan`, `tailnet`, `auto`, `custom`.
</ParamField>
<ParamField path="--token <token>" type="string">
  Gemeinsames Token für `connect.params.auth.token`. Standardmäßig `OPENCLAW_GATEWAY_TOKEN`, sofern festgelegt.
</ParamField>
<ParamField path="--auth <mode>" type="string">
  Authentifizierungsmodus: `none`, `token`, `password`, `trusted-proxy`.
</ParamField>
<ParamField path="--password <password>" type="string">
  Passwort für `--auth password`.
</ParamField>
<ParamField path="--password-file <path>" type="string">
  Das Gateway-Passwort aus einer Datei lesen.
</ParamField>
<ParamField path="--tailscale <mode>" type="string">
  Tailscale-Bereitstellung: `off`, `serve`, `funnel`.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Tailscale-Serve-/Funnel-Konfiguration beim Herunterfahren zurücksetzen.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Starten, ohne `gateway.mode=local` durchzusetzen. Nur für Ad-hoc-/Entwicklungs-Bootstrapping; die Konfiguration wird weder dauerhaft gespeichert noch repariert.
</ParamField>
<ParamField path="--dev" type="boolean">
  Bei Bedarf eine Entwicklungskonfiguration und einen Workspace erstellen (überspringt `BOOTSTRAP.md`).
</ParamField>
<ParamField path="--dev-ambient-channels" type="boolean">
  Einem Entwicklungs-Gateway erlauben, Kanäle automatisch anhand vorhandener Umgebungsvariablen zu konfigurieren. Erfordert `--dev`.
</ParamField>
<ParamField path="--reset" type="boolean">
  Entwicklungskonfiguration, Anmeldedaten, Sitzungen und Workspace zurücksetzen. Erfordert `--dev`.
</ParamField>
<ParamField path="--force" type="boolean">
  Vor dem Start alle vorhandenen Listener am Zielport beenden. In einer nicht interaktiven Shell wird das Beenden eines verifizierten Gateway-Listeners verweigert; verwenden Sie stattdessen `--dev` oder eine isolierte `--profile` mit einem freien Port.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Ausführliche Protokollierung nach stdout/stderr.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  In der Konsole nur CLI-Backend-Protokolle anzeigen (aktiviert außerdem stdout/stderr).
</ParamField>
<ParamField path="--ws-log <style>" type="string" default="auto">
  WebSocket-Protokollstil: `auto`, `full`, `compact`.
</ParamField>
<ParamField path="--compact" type="boolean">
  Alias für `--ws-log compact`.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  Unverarbeitete Modell-Stream-Ereignisse in JSONL protokollieren.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  JSONL-Pfad für den unverarbeiteten Stream.
</ParamField>

`--claude-cli-logs` ist ein veralteter Alias für `--cli-backend-logs`.

Legen Sie für `--bind custom` `gateway.customBindHost` auf eine IPv4-Adresse fest. Jede andere Adresse als `127.0.0.1` oder `0.0.0.0` erfordert außerdem `127.0.0.1` am selben Port für Clients auf demselben Host; der Start schlägt fehl, wenn einer der Listener keine Bindung herstellen kann. Der Platzhalter `0.0.0.0` fügt keinen separaten erforderlichen Alias hinzu. Reine IPv6-Setups mit eigenem Host benötigen einen IPv4-Sidecar oder Proxy vor dem Gateway.

## Gateway neu starten

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
openclaw gateway restart --wait 30s
```

`--safe` fordert den laufenden Gateway auf, aktive Arbeit vorab zu prüfen und einen einzigen zusammengefassten Neustart zu planen, nachdem diese Arbeit abgeschlossen ist. Die Wartezeit ist auf 5 Minuten begrenzt; nach Ablauf des Zeitbudgets wird der Neustart erzwungen. `--safe` kann nicht mit `--force` oder `--wait` kombiniert werden.

`--skip-deferral` umgeht bei einem sicheren Neustart die Zurückstellung wegen aktiver Arbeit, sodass der Gateway selbst bei gemeldeten Blockierungen sofort neu startet. Dies erfordert `--safe` — verwenden Sie diese Option, wenn eine Zurückstellung durch eine außer Kontrolle geratene Aufgabe festhängt.

`--wait <duration>` überschreibt das Zeitbudget für das Abschließen aktiver Arbeit bei einem gewöhnlichen (nicht sicheren) Neustart. Akzeptiert reine Millisekundenwerte oder die Einheitensuffixe `ms`, `s`, `m`, `h`, `d` (z. B. `30s`, `5m`, `1h30m`); `--wait 0` wartet unbegrenzt. Nicht kompatibel mit `--force` oder `--safe`.

`--force` überspringt das Abschließen aktiver Arbeit und startet sofort neu. Ein gewöhnliches `restart` (ohne Flags) behält das bestehende Neustartverhalten des Dienstmanagers bei.

<Warning>
Inline angegebenes `--password` kann in lokalen Prozesslisten offengelegt werden. Bevorzugen Sie `--password-file`, die Umgebung oder ein durch SecretRef gestütztes `gateway.auth.password`.
</Warning>

### Externe Prozessüberwachungen

Legen Sie `OPENCLAW_SUPERVISOR_MODE=external` nur fest, wenn ein anderer Prozessmanager den Lebenszyklus des Gateways verwaltet. In diesem Modus gilt:

- `openclaw gateway restart` behält das bestehende sichere, erzwungene und zeitlich begrenzte Neustartverhalten bei, richtet sich jedoch an den verifizierten laufenden Gateway statt an launchd, systemd oder die Aufgabenplanung.
- Native Vorgänge zum Installieren, Starten, Stoppen und Deinstallieren des Dienstes werden mit dem Hinweis verweigert, die externe Prozessüberwachung zu verwenden.
- Die Selbstaktualisierung von OpenClaw wird verweigert, damit die Prozessüberwachung den Gateway stoppen, die Laufzeit ersetzen und fertigstellen sowie ihn sicher neu starten kann.
- Bei einem Neustart mit einem neuen Prozess wird vor dem ordnungsgemäßen Beenden eine zeitlich begrenzte SQLite-Übergabe geschrieben. Schlägt die Persistierung fehl, greift der Gateway auf einen prozessinternen Neustart zurück, statt ohne nutzbare Übergabe beendet zu werden.

`OPENCLAW_SERVICE_REPAIR_POLICY=external` bleibt eine separate Reparaturrichtlinie des Doctors. Sie deklariert keine Laufzeitverantwortung; Prozessüberwachungen, die beide Verhaltensweisen benötigen, sollten beide Variablen festlegen.

Externe Prozessüberwachungen können Neustartübergaben über den verborgenen Maschinenvertrag aushandeln und verarbeiten:

```bash
openclaw gateway restart-handoff capabilities --json
openclaw gateway restart-handoff consume --expected-pid <pid> --json
```

Die Protokollversion `1` unterstützt den Vorgang `consume`. Bei der Verarbeitung werden die erwartete PID und die begrenzten Übergabefelder innerhalb einer einzigen sofortigen SQLite-Transaktion validiert. Eine akzeptierte Übergabe wird gelöscht, bevor der Erfolg zurückgegeben wird, sodass nebenläufige oder wiederholte Verbraucher sie nicht beide akzeptieren können. Eine nicht übereinstimmende PID bleibt für den passenden Eigentümer erhalten; fehlende, abgelaufene und ungültige Zeilen autorisieren keinen Neustart.

Gültige Maschinenanfragen geben JSON mit dem Exit-Code `0` zurück, einschließlich Ergebnissen ohne Neustart. Ungültige Argumente geben `reason: "invalid-expected-pid"` mit dem Exit-Code `2` zurück; Fehler des Zustandsspeichers geben `reason: "store-unavailable"` mit dem Exit-Code `1` zurück. Prozessüberwachungen sollten `capabilities` mit genau der Laufzeit oder dem Starter prüfen, die bzw. den sie verwenden werden, statt die Unterstützung aus einer OpenClaw-Versionszeichenfolge abzuleiten oder das private SQLite-Schema direkt zu lesen.

### Gateway-Profiling

- `OPENCLAW_GATEWAY_STARTUP_TRACE=1` protokolliert beim Start die Phasenzeiten, einschließlich der Verzögerung `eventLoopMax` pro Phase und der Zeiten für Plugin-Lookup-Tabellen (Installationsindex, Manifestregistrierung, Startplanung und Arbeit an der Eigentümerzuordnung).
- `OPENCLAW_GATEWAY_RESTART_TRACE=1` protokolliert auf den Neustart bezogene `restart trace:`-Zeilen: Signalverarbeitung, Abschluss aktiver Arbeit, Phasen des Herunterfahrens, nächster Start, Zeit bis zur Bereitschaft und Speicherkennzahlen.
- `OPENCLAW_DIAGNOSTICS=timeline` mit `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` schreibt nach bestem Bemühen eine JSONL-Zeitleiste der Startdiagnose für externe QA-Harnesses (entspricht der Konfiguration `diagnostics.flags: ["timeline"]`; der Pfad kann weiterhin nur über die Umgebung festgelegt werden). Fügen Sie `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` hinzu, um Ereignisschleifen-Stichproben einzubeziehen.
- `pnpm build` und anschließend `pnpm test:startup:gateway -- --runs 5 --warmup 1` messen die Gateway-Startleistung anhand des gebauten CLI-Einstiegspunkts: erste Prozessausgabe, `/healthz`, `/readyz`, Zeiten der Startablaufverfolgung, Ereignisschleifenverzögerung und Zeiten der Plugin-Lookup-Tabellen.
- `pnpm build` und anschließend `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5` messen den prozessinternen Neustart unter macOS oder Linux (unter Windows nicht unterstützt; der Neustart erfordert `SIGUSR1`). Verwendet `SIGUSR1`, aktiviert beide Ablaufverfolgungen im untergeordneten Prozess und erfasst die nächste `/healthz`, die nächste `/readyz`, Ausfallzeit, Zeit bis zur Bereitschaft, CPU, RSS und Kennzahlen der Neustartablaufverfolgung.
- `/healthz` bezeichnet die Lebendigkeit; `/readyz` bezeichnet die nutzbare Bereitschaft. Behandeln Sie Ablaufverfolgungszeilen und Benchmark-Ausgaben als Signal für die Zuordnung zum Verantwortlichen, nicht als vollständige Leistungsbeurteilung anhand einer einzelnen Zeitspanne oder Stichprobe.

## Laufenden Gateway abfragen

Alle Abfragebefehle verwenden WebSocket-RPC.

<Tabs>
  <Tab title="Ausgabemodi">
    - Standard: menschenlesbar (im TTY farbig).
    - `--json`: maschinenlesbares JSON (ohne Gestaltung/Fortschrittsanzeige).
    - `--no-color` (oder `NO_COLOR=1`): ANSI deaktivieren und das menschenlesbare Layout beibehalten.

  </Tab>
  <Tab title="Gemeinsame Optionen">
    - `--url <url>`: WebSocket-URL des Gateways.
    - `--token <token>`: Gateway-Token.
    - `--password <password>`: Gateway-Passwort.
    - `--timeout <ms>`: Zeitüberschreitung/Zeitbudget (Standard variiert je nach Befehl; siehe die einzelnen Befehle unten).
    - `--expect-final`: auf eine „endgültige“ Antwort warten (Agentenaufrufe).

  </Tab>
</Tabs>

<Note>
Wenn Sie `--url` festlegen, greift die CLI nicht auf Anmeldedaten aus der Konfiguration oder Umgebung zurück. Übergeben Sie `--token` oder `--password` ausdrücklich. Fehlende explizite Anmeldedaten führen zu einem Fehler.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway health --port 18789
```

`/healthz` ist eine Liveness-Prüfung: Sie kehrt zurück, sobald der Server HTTP-Anfragen beantworten kann. `/readyz` ist strenger und bleibt rot, solange Plugin-Sidecars, Kanäle oder konfigurierte Hooks beim Start noch nicht vollständig bereit sind. Lokale oder authentifizierte detaillierte `/readyz`-Antworten enthalten einen `eventLoop`-Diagnoseblock (Verzögerung, Auslastung, CPU-Kern-Verhältnis, `degraded`-Flag).

<ParamField path="--port <port>" type="number">
  Verwendet auf diesem Port ein lokales Loopback-Gateway als Ziel. Überschreibt für diesen Aufruf `OPENCLAW_GATEWAY_URL` und `OPENCLAW_GATEWAY_PORT`.
</ParamField>

### `gateway usage-cost`

Ruft Zusammenfassungen der Nutzungskosten aus Sitzungsprotokollen ab.

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
  Beschränkt die Zusammenfassung auf die ID eines konfigurierten Agenten.
</ParamField>
<ParamField path="--all-agents" type="boolean">
  Aggregiert über alle konfigurierten Agenten hinweg. Kann nicht mit `--agent` kombiniert werden.
</ParamField>

### `gateway stability`

Ruft die aktuelle diagnostische Stabilitätsaufzeichnung von einem laufenden Gateway ab.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  Maximale Anzahl einzubeziehender aktueller Ereignisse (maximal `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  Filtert nach dem Typ des Diagnoseereignisses, z. B. `payload.large` oder `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Bezieht nur Ereignisse nach einer diagnostischen Sequenznummer ein.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Liest ein persistiertes Stabilitätspaket, anstatt das laufende Gateway aufzurufen. `--bundle latest` (oder nur `--bundle`) wählt das neueste Paket im Zustandsverzeichnis aus; Sie können auch direkt einen JSON-Pfad zu einem Paket übergeben.
</ParamField>
<ParamField path="--export" type="boolean">
  Schreibt eine teilbare ZIP-Datei mit Supportdiagnosen, anstatt Stabilitätsdetails auszugeben.
</ParamField>
<ParamField path="--output <path>" type="string">
  Ausgabepfad für `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Datenschutz und Paketverhalten">
    - Datensätze enthalten betriebliche Metadaten: Ereignisnamen, Anzahlen, Bytegrößen, Speicherwerte, Warteschlangen-/Sitzungsstatus, Genehmigungs-IDs, Kanal-/Plugin-Namen und redigierte Sitzungszusammenfassungen. Ausgeschlossen sind Chattext, Webhook-Inhalte, Tool-Ausgaben, unverarbeitete Anfrage-/Antwortinhalte, Token, Cookies, geheime Werte, Hostnamen und unverarbeitete Sitzungs-IDs. Setzen Sie `diagnostics.enabled: false`, um die Aufzeichnung vollständig zu deaktivieren.
    - Bei schwerwiegenden Gateway-Abbrüchen, Zeitüberschreitungen beim Herunterfahren und Startfehlern nach einem Neustart wird derselbe Diagnose-Snapshot nach `~/.openclaw/logs/stability/openclaw-stability-*.json` geschrieben, sofern die Aufzeichnung Ereignisse enthält. Prüfen Sie das neueste Paket mit `openclaw gateway stability --bundle latest`; `--limit`, `--type` und `--since-seq` gelten auch für die Paketausgabe.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Schreibt eine lokale Diagnose-ZIP-Datei für Fehlerberichte. Informationen zum Datenschutzmodell und zum Paketinhalt finden Sie unter [Diagnoseexport](/de/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Ausgabepfad der ZIP-Datei. Standardmäßig wird ein Supportexport im Zustandsverzeichnis erstellt.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Maximale Anzahl einzubeziehender bereinigter Protokollzeilen.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  Maximale Anzahl zu untersuchender Protokollbytes.
</ParamField>
<ParamField path="--url <url>" type="string">
  WebSocket-URL des Gateways für den Integritäts-Snapshot.
</ParamField>
<ParamField path="--token <token>" type="string">
  Gateway-Token für den Integritäts-Snapshot.
</ParamField>
<ParamField path="--password <password>" type="string">
  Gateway-Passwort für den Integritäts-Snapshot.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  Zeitüberschreitung für den Status-/Integritäts-Snapshot.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  Überspringt die Suche nach einem persistierten Stabilitätspaket.
</ParamField>
<ParamField path="--json" type="boolean">
  Gibt den geschriebenen Pfad, die Größe und das Manifest als JSON aus.
</ParamField>

Der Export enthält: `manifest.json` (Dateiinventar), `summary.md` (Markdown-Zusammenfassung), `diagnostics.json` (übergeordnete Zusammenfassung von Konfiguration, Protokollen, Erkennung, Stabilität, Status und Integrität), `config/sanitized.json`, `status/gateway-status.json`, `health/gateway-health.json`, `logs/openclaw-sanitized.jsonl` und, sofern ein Paket vorhanden ist, `stability/latest.json`.

Er ist für die Weitergabe vorgesehen. Er bewahrt für die Fehlerdiagnose nützliche betriebliche Details auf – unbedenkliche Protokollfelder, Subsystemnamen, Statuscodes, Zeitspannen, konfigurierte Modi, Ports, Plugin-/Provider-IDs, nicht geheime Funktionseinstellungen und redigierte betriebliche Protokollmeldungen – und lässt Chattext, Webhook-Inhalte, Tool-Ausgaben, Anmeldedaten, Cookies, Konto-/Nachrichtenkennungen, Prompt-/Anweisungstext, Hostnamen und geheime Werte aus oder redigiert sie. Wenn eine Protokollmeldung wie Nutzungs-, Chat- oder Tool-Nutzlasttext aussieht (z. B. „Benutzer sagte“, „Chattext“, „Tool-Ausgabe“, „Webhook-Inhalt“), enthält der Export lediglich den Hinweis, dass eine Nachricht ausgelassen wurde, sowie deren Byteanzahl.

### `gateway status`

Zeigt den Gateway-Dienst (launchd/systemd/schtasks) sowie optional eine Verbindungs-/Authentifizierungsprüfung an.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Fügt ein explizites Prüfziel hinzu. Das konfigurierte entfernte Ziel und localhost werden weiterhin geprüft.
</ParamField>
<ParamField path="--token <token>" type="string">
  Token-Authentifizierung für die Prüfung.
</ParamField>
<ParamField path="--password <password>" type="string">
  Passwortauthentifizierung für die Prüfung.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Zeitüberschreitung der Prüfung.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  Überspringt die Verbindungsprüfung (reine Dienstansicht).
</ParamField>
<ParamField path="--deep" type="boolean">
  Durchsucht auch Dienste auf Systemebene.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Erweitert die Verbindungsprüfung zu einer Leseprüfung und beendet den Vorgang bei einem Fehler mit einem von null verschiedenen Statuscode. Kann nicht mit `--no-probe` kombiniert werden.
</ParamField>

<AccordionGroup>
  <Accordion title="Statussemantik">
    - Bleibt für Diagnosen verfügbar, selbst wenn die lokale CLI-Konfiguration fehlt oder ungültig ist.
    - Die Standardausgabe weist den Dienststatus, die WebSocket-Verbindung und die beim Handshake sichtbare Authentifizierungsfunktion nach – nicht Lese-, Schreib- oder Administratorvorgänge.
    - Prüfungen verändern bei der erstmaligen Geräteauthentifizierung nichts: Sie verwenden ein vorhandenes zwischengespeichertes Geräte-Token, erstellen jedoch niemals nur zur Statusprüfung eine neue CLI-Geräteidentität oder einen schreibgeschützten Kopplungsdatensatz.
    - Löst konfigurierte Authentifizierungs-SecretRefs für die Prüfauthentifizierung nach Möglichkeit auf. Wenn ein erforderlicher SecretRef nicht aufgelöst ist, meldet `--json` bei einem Fehler der Prüfverbindung/-authentifizierung `rpc.authWarning`; übergeben Sie `--token`/`--password` explizit oder korrigieren Sie die Geheimnisquelle. Warnungen wegen nicht aufgelöster Authentifizierung werden unterdrückt, sobald die Prüfung erfolgreich ist.
    - Die JSON-Ausgabe enthält `gateway.version`, wenn das laufende Gateway dies meldet; `--require-rpc` kann auf die `status.runtimeVersion`-RPC-Nutzlast zurückgreifen, wenn die Handshake-Prüfung keine Versionsmetadaten bereitstellen kann.
    - Verwenden Sie `--require-rpc` in Skripten und Automatisierungen, wenn ein lauschender Dienst nicht ausreicht und auch RPC mit Leseberechtigung funktionsfähig sein muss.
    - `--deep` sucht nach zusätzlichen launchd-/systemd-/schtasks-Installationen; wenn mehrere Gateway-ähnliche Dienste gefunden werden, gibt die menschenlesbare Ausgabe Bereinigungshinweise aus (in der Regel sollte pro Rechner ein Gateway ausgeführt werden) und meldet gegebenenfalls eine kürzlich erfolgte Neustartübergabe des Supervisors.
    - `--deep` führt außerdem eine Konfigurationsvalidierung im Plugin-kompatiblen Modus (`pluginValidation: "full"`) aus und zeigt Warnungen aus Plugin-Manifesten an (z. B. fehlende Metadaten zur Kanalkonfiguration). Das standardmäßige `gateway status` behält den schnellen schreibgeschützten Pfad bei, der die Plugin-Validierung überspringt.
    - Die menschenlesbare Ausgabe enthält den aufgelösten Pfad der Dateiprotokolle sowie die Konfigurationspfade und deren Gültigkeit für CLI und Dienst, um Abweichungen bei Profilen oder Zustandsverzeichnissen leichter zu diagnostizieren.
    - Die menschenlesbare Ausgabe enthält `Gateway heap:` mit dem angewendeten Grenzwert und dessen adaptiver Herleitung. Die JSON-Ausgabe stellt denselben Bericht als `service.gatewayHeap` bereit.

  </Accordion>
  <Accordion title="Prüfungen auf Authentifizierungsabweichungen bei Linux systemd">
    - Prüfungen auf Abweichungen bei der Dienstauthentifizierung lesen sowohl `Environment=` als auch `EnvironmentFile=` aus der Unit (einschließlich `%h`, Pfaden in Anführungszeichen, mehreren Dateien und optionalen `-`-Dateien).
    - Löst `gateway.auth.token`-SecretRefs mithilfe der zusammengeführten Laufzeitumgebung auf (zuerst die Befehlsumgebung des Dienstes, danach ersatzweise die Prozessumgebung).
    - Prüfungen auf Token-Abweichungen überspringen die Auflösung des Konfigurations-Tokens, wenn die Token-Authentifizierung faktisch nicht aktiv ist (`gateway.auth.mode` explizit `password`/`none`/`trusted-proxy` oder kein Modus festgelegt ist, sodass das Passwort Vorrang haben kann und kein Token-Kandidat Vorrang erhalten kann).

  </Accordion>
</AccordionGroup>

### `gateway probe`

Der Befehl zum „Debuggen von allem“. Er prüft immer:

- Ihr konfiguriertes entferntes Gateway (sofern festgelegt) und
- localhost (Loopback), **selbst wenn ein entferntes Gateway konfiguriert ist**.

Durch die Übergabe von `--url` wird dieses explizite Ziel vor den beiden anderen hinzugefügt. Die menschenlesbare Ausgabe kennzeichnet Ziele mit `URL (explicit)`, `Remote (configured)` / `Remote (configured, inactive)` und `Local loopback`.

<Note>
Wenn mehrere Prüfziele erreichbar sind, werden alle ausgegeben. Ein SSH-Tunnel, eine TLS-/Proxy-URL und eine konfigurierte entfernte URL können selbst bei unterschiedlichen Transportports auf dasselbe Gateway verweisen; `multiple_gateways` ist für verschiedene oder hinsichtlich ihrer Identität nicht eindeutig bestimmbare erreichbare Gateways reserviert. Die Ausführung mehrerer Gateways wird für isolierte Profile unterstützt (z. B. einen Rettungs-Bot), die meisten Installationen führen jedoch nur ein Gateway aus.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  Verwendet diesen Port für das lokale Loopback-Prüfziel und den entfernten Port des SSH-Tunnels. Ohne `--url` wird damit ausschließlich das lokale Loopback-Ziel ausgewählt, nicht die konfigurierte Gateway-Umgebungs-URL, der Umgebungsport oder entfernte Ziele.
</ParamField>

<AccordionGroup>
  <Accordion title="Interpretation">
    - `Reachable: yes` bedeutet, dass mindestens ein Ziel eine WebSocket-Verbindung akzeptiert hat.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` meldet unabhängig von der Erreichbarkeit, was die Prüfung hinsichtlich der Authentifizierung nachweisen konnte.
    - `Read probe: ok` bedeutet, dass auch Detail-RPC-Aufrufe mit Leseberechtigung (`health`/`status`/`system-presence`/`config.get`) erfolgreich waren.
    - `Read probe: limited - missing scope: operator.read` bedeutet, dass die Verbindung erfolgreich hergestellt wurde, RPC mit Leseberechtigung jedoch eingeschränkt ist. Dies wird als **beeinträchtigte** Erreichbarkeit und nicht als vollständiger Fehler gemeldet.
    - `Read probe: failed` nach `Connect: ok` bedeutet, dass die WebSocket-Verbindung hergestellt wurde, nachfolgende Lesediagnosen jedoch das Zeitlimit überschritten haben oder fehlgeschlagen sind – ebenfalls **beeinträchtigt**, nicht unerreichbar.
    - Wie `gateway status` verwendet die Prüfung eine vorhandene zwischengespeicherte Geräteauthentifizierung, erstellt jedoch keine erstmalige Geräteidentität oder keinen Kopplungsstatus.
    - Der Exit-Code ist nur dann von null verschieden, wenn keines der geprüften Ziele erreichbar ist.

  </Accordion>
  <Accordion title="JSON-Ausgabe">
    Oberste Ebene:

    - `ok`: Mindestens ein Ziel ist erreichbar.
    - `degraded`: Mindestens ein Ziel hat eine Verbindung akzeptiert, aber die vollständige RPC-Detaildiagnose nicht abgeschlossen.
    - `capability`: Beste bei den erreichbaren Zielen festgestellte Fähigkeit (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` oder `unknown`).
    - `primaryTargetId`: Bestes Ziel, das als aktiver Gewinner behandelt werden soll, in dieser Reihenfolge: explizite URL, SSH-Tunnel, konfiguriertes Remote-Ziel, lokale Loopback-Adresse.
    - `warnings[]`: Nach bestem Bemühen erstellte Warnungsdatensätze mit `code`, `message` und optional `targetIds`.
    - `network`: Aus der aktuellen Konfiguration und der Host-Netzwerkkonfiguration abgeleitete URL-Hinweise für lokale Loopback-Adressen bzw. das Tailnet.
    - `discovery.timeoutMs` / `discovery.count`: Das für diesen Prüfdurchlauf tatsächlich verwendete Ermittlungsbudget bzw. die tatsächliche Ergebnisanzahl.

    Pro Ziel (`targets[].connect`): `ok` (Erreichbarkeit und Klassifizierung als eingeschränkt), `rpcOk` (Erfolg des vollständigen Detail-RPC), `scopeLimited` (Detail-RPC wegen fehlenden Operator-Bereichs fehlgeschlagen).

    Pro Ziel (`targets[].auth`): `role` und `scopes` werden, sofern verfügbar, in `hello-ok` gemeldet, zusammen mit der ausgegebenen Klassifizierung `capability`.

  </Accordion>
  <Accordion title="Häufige Warncodes">
    - `ssh_tunnel_failed`: Die Einrichtung des SSH-Tunnels ist fehlgeschlagen; der Befehl ist auf direkte Prüfungen ausgewichen.
    - `multiple_gateways`: Unterschiedliche Gateway-Identitäten waren erreichbar oder OpenClaw konnte nicht nachweisen, dass die erreichbaren Ziele dasselbe Gateway sind. Ein SSH-Tunnel, eine Proxy-URL oder eine konfigurierte Remote-URL zum selben Gateway löst dies nicht aus.
    - `auth_secretref_unresolved`: Eine konfigurierte Authentifizierungs-SecretRef konnte für ein fehlgeschlagenes Ziel nicht aufgelöst werden.
    - `probe_scope_limited`: Die WebSocket-Verbindung wurde erfolgreich hergestellt, aber die Leseprüfung war aufgrund des fehlenden `operator.read` eingeschränkt.
    - `local_tls_runtime_unavailable`: TLS ist für das lokale Gateway aktiviert, aber OpenClaw konnte den Fingerabdruck des lokalen Zertifikats nicht laden.

  </Accordion>
</AccordionGroup>

#### Remote-Zugriff über SSH (Funktionsgleichheit mit der Mac-App)

Der Modus „Remote over SSH“ der macOS-App verwendet eine lokale Portweiterleitung, sodass ein entferntes Gateway, das nur über die Loopback-Adresse erreichbar ist, unter `ws://127.0.0.1:<port>` erreichbar wird.

CLI-Entsprechung:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` oder `user@host:port` (der Port ist standardmäßig `22`).
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  Identitätsdatei.
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  Wählt den ersten ermittelten Gateway-Host vom aufgelösten Ermittlungsendpunkt als SSH-Ziel aus (`local.` sowie gegebenenfalls die konfigurierte Wide-Area-Domain). Reine TXT-Hinweise werden ignoriert.
</ParamField>

Konfigurationsstandardwerte (optional): `gateway.remote.sshTarget`, `gateway.remote.sshIdentity`.

### `gateway call <method>`

RPC-Hilfsprogramm auf niedriger Ebene.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"limit": 200}'
```

<ParamField path="--params <json>" type="string" default="{}">
  JSON-Objektzeichenfolge für Parameter.
</ParamField>
<ParamField path="--url <url>" type="string">
  WebSocket-URL des Gateways.
</ParamField>
<ParamField path="--token <token>" type="string">
  Gateway-Token.
</ParamField>
<ParamField path="--password <password>" type="string">
  Gateway-Passwort.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Zeitüberschreitungsbudget.
</ParamField>
<ParamField path="--expect-final" type="boolean">
  Hauptsächlich für Agenten-RPCs, die Zwischenereignisse streamen, bevor die endgültigen Nutzdaten gesendet werden.
</ParamField>
<ParamField path="--json" type="boolean">
  Maschinenlesbare JSON-Ausgabe.
</ParamField>

<Note>
`--params` muss gültiges JSON sein, und jede Methode validiert ihre eigene Parameterstruktur (zusätzliche oder falsch benannte Felder werden abgelehnt).
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

Verwenden Sie `--wrapper`, wenn der verwaltete Dienst über eine andere ausführbare Datei gestartet werden muss, beispielsweise über einen Shim für die Geheimnisverwaltung oder ein Hilfsprogramm zur Ausführung unter einer anderen Identität. Der Wrapper erhält die normalen Gateway-Argumente und ist dafür verantwortlich, schließlich `openclaw` oder Node mit diesen Argumenten auszuführen.

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

Sie können den Wrapper auch über die Umgebung festlegen. `gateway install` validiert, dass der Pfad auf eine ausführbare Datei verweist, schreibt den Wrapper in den `ProgramArguments` des Dienstes und speichert `OPENCLAW_WRAPPER` dauerhaft in der Dienstumgebung für spätere erzwungene Neuinstallationen, Aktualisierungen und Reparaturen durch den Doctor.

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
    - `gateway install`: `--port`, `--runtime <node>` (Standard: `node`), `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start`: `--json`
    - `gateway stop`: `--disable`, `--force`, `--json`

  </Accordion>
  <Accordion title="Lebenszyklusverhalten">
    - `gateway start` ist idempotent: Wenn der verwaltete Dienst bereits ausgeführt wird, meldet der Befehl den laufenden Prozess und lässt ihn unverändert. Ein geladener, aber angehaltener Dienst wird wie bisher gestartet.
    - Verwenden Sie `gateway restart`, um einen verwalteten Dienst neu zu starten. Verketten Sie `gateway stop` und `gateway start` nicht als Ersatz für einen Neustart.
    - In einer nicht interaktiven Shell erfordert `gateway stop` die Option `--force`. Interaktive Terminals behalten das bestehende Verhalten ohne Eingabeaufforderung bei. Bevorzugen Sie für Automatisierungen und Tests `gateway run --dev` oder eine isolierte `--profile` mit einem freien Port.
    - Unter macOS verwendet `gateway stop` standardmäßig `launchctl bootout`. Dadurch wird der LaunchAgent aus der aktuellen Startsitzung entfernt, ohne eine Deaktivierung zu persistieren – die automatische Wiederherstellung durch KeepAlive bleibt bei zukünftigen Abstürzen aktiv, und `gateway start` aktiviert den Dienst ohne ein manuelles `launchctl enable` ordnungsgemäß wieder. Übergeben Sie `--disable`, um KeepAlive und RunAtLoad dauerhaft zu unterdrücken, sodass der Gateway bis zum nächsten expliziten `gateway start` nicht erneut gestartet wird. Verwenden Sie dies, wenn ein manuelles Anhalten Neustarts des Systems überdauern soll.
    - Änderungen am Gateway-Lebenszyklus hängen nach dem Best-Effort-Prinzip Schlüssel-Wert-Auditdatensätze an `<state-dir>/logs/gateway-restart.log` an. Dazu gehören Start-, Stopp- und Neustartvorgänge der CLI, sichere Neustartanforderungen, Supervisor-Neustarts und abgekoppelte Übergaben.
    - Lebenszyklusbefehle akzeptieren `--json` für Skripte.

  </Accordion>
  <Accordion title="Heap-Dimensionierung des verwalteten Gateways">
    - `gateway install` schreibt für den verwalteten Gateway-Dienst einen ausschließlich den Heap betreffenden Wert für `NODE_OPTIONS`. Wenn Node eine Container- oder Dienstbegrenzung meldet, werden 50 % des begrenzten Arbeitsspeichers angestrebt, andernfalls 50 % des physischen Arbeitsspeichers.
    - Der nominelle Zielbereich beträgt 2048–8192 MiB, ergänzt durch eine Obergrenze, die 75 % für nativen Spielraum vorbehält. Auf kleinen Hosts kann diese Spielraumbegrenzung das angewendete Limit unter die nominelle Untergrenze von 2048 MiB senken.
    - Ein gültiger expliziter Wert für `--max-old-space-size`, der bereits im installierten Dienst gespeichert ist, bleibt bei erzwungenen Neuinstallationen und Reparaturen durch doctor erhalten. Andere Flags von `NODE_OPTIONS` werden nicht in den verwalteten Dienst übernommen.
    - Das in der umgebenden Shell gesetzte `NODE_OPTIONS` überschreibt diese Richtlinie nicht. Verwenden Sie `gateway status` oder `doctor`, um den installierten Wert zu prüfen. Führen Sie `openclaw gateway install --force` aus, um ältere Dienstmetadaten neu zu erzeugen, die keine verwaltete Heap-Einstellung enthalten.
    - Die Richtlinie gilt nur für den verwalteten Gateway-Dienst. Im Vordergrund ausgeführte `gateway run`, Node-Dienste und manuell erstellte Supervisor-Units behalten ihre eigene Laufzeitkonfiguration bei.

  </Accordion>
  <Accordion title="Authentifizierung und SecretRefs zum Installationszeitpunkt">
    - Wenn die Token-Authentifizierung ein Token erfordert und `gateway.auth.token` über SecretRef verwaltet wird, prüft `gateway install`, ob die SecretRef aufgelöst werden kann, persistiert das aufgelöste Token jedoch nicht in den Umgebungsmetadaten des Dienstes.
    - Wenn die Token-Authentifizierung ein Token erfordert und die konfigurierte Token-SecretRef nicht aufgelöst werden kann, schlägt die Installation sicher fehl, anstatt ersatzweise Klartext zu persistieren.
    - Bevorzugen Sie für die Passwortauthentifizierung auf `gateway run` die Optionen `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` oder ein durch SecretRef gestütztes `gateway.auth.password` gegenüber einem inline angegebenen `--password`.
    - Im abgeleiteten Authentifizierungsmodus lockert ein ausschließlich in der Shell gesetztes `OPENCLAW_GATEWAY_PASSWORD` die Token-Anforderungen der Installation nicht. Verwenden Sie bei der Installation eines verwalteten Dienstes eine dauerhafte Konfiguration (`gateway.auth.password` oder die Konfiguration `env`).
    - Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, wird die Installation blockiert, bis der Modus explizit festgelegt wurde.

  </Accordion>
</AccordionGroup>

## Gateways erkennen (Bonjour)

`gateway discover` sucht nach Gateway-Beacons (`_openclaw-gw._tcp`).

- Multicast-DNS-SD: `local.`
- Unicast-DNS-SD (Wide-Area Bonjour): Wählen Sie eine Domain (Beispiel: `openclaw.internal.`) und richten Sie Split-DNS sowie einen DNS-Server ein; siehe [Bonjour](/de/gateway/bonjour).

Nur Gateways mit aktivierter Bonjour-Erkennung (Standard) kündigen den Beacon an.

TXT-Hinweise in jedem Beacon: `role` (Hinweis zur Gateway-Rolle), `transport` (Transporthinweis, z. B. `gateway`), `gatewayPort` (WebSocket-Port, normalerweise `18789`), `tailnetDns` (MagicDNS-Hostname, sofern verfügbar), `gatewayTls` / `gatewayTlsSha256` (TLS aktiviert + Zertifikatfingerabdruck). `sshPort` und `cliPath` werden nur im vollständigen Erkennungsmodus veröffentlicht (`discovery.mdns.mode: "full"`; Standard ist `"minimal"`, wodurch sie ausgelassen werden – Clients verwenden dann standardmäßig Port `22` für SSH-Ziele).

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Zeitüberschreitung pro Befehl (Durchsuchen/Auflösen).
</ParamField>
<ParamField path="--json" type="boolean">
  Maschinenlesbare Ausgabe (deaktiviert außerdem Formatierung und Fortschrittsanzeige).
</ParamField>

Beispiele:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- Durchsucht `local.` sowie die konfigurierte Wide-Area-Domain, wenn eine aktiviert ist.
- `wsUrl` in der JSON-Ausgabe wird aus dem aufgelösten Dienstendpunkt abgeleitet, nicht aus reinen TXT-Hinweisen wie `lanHost` oder `tailnetDns`.
- `discovery.mdns.mode` steuert die Veröffentlichung von `sshPort`/`cliPath` sowohl über `local.`-mDNS als auch über Wide-Area-DNS-SD (siehe oben).

</Note>

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Gateway-Betriebshandbuch](/de/gateway)
