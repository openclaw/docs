---
read_when:
    - Ausführen des Gateways über die CLI (Entwicklung oder Server)
    - Fehlerbehebung bei Gateway-Authentifizierung, Bindungsmodi und Konnektivität
    - Gateways über Bonjour erkennen (lokal + Wide-Area-DNS-SD)
sidebarTitle: Gateway
summary: OpenClaw-Gateway-CLI (`openclaw gateway`) — Gateways ausführen, abfragen und erkennen
title: Gateway
x-i18n:
    generated_at: "2026-07-12T01:31:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 75f8f4bebe585b213f486f08bf20015aeb89ca4d179f6d96c1008ec9d1cd00ea
    source_path: cli/gateway.md
    workflow: 16
---

Der Gateway ist der WebSocket-Server von OpenClaw (Kanäle, Nodes, Sitzungen, Hooks). Alle folgenden Unterbefehle befinden sich unter `openclaw gateway ...`.

<CardGroup cols={3}>
  <Card title="Bonjour-Erkennung" href="/de/gateway/bonjour">
    Einrichtung von lokalem mDNS und großräumigem DNS-SD.
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
openclaw gateway run   # gleichwertige, explizite Form
```

<AccordionGroup>
  <Accordion title="Startverhalten">
    - Der Start wird verweigert, sofern `gateway.mode=local` nicht in `~/.openclaw/openclaw.json` festgelegt ist. Verwenden Sie `--allow-unconfigured` für Ad-hoc-/Entwicklungsläufe; dies umgeht die Schutzprüfung, ohne die Konfiguration zu schreiben oder zu reparieren.
    - `openclaw onboard --mode local` und `openclaw setup` schreiben `gateway.mode=local`. Wenn die Konfigurationsdatei vorhanden ist, aber `gateway.mode` fehlt, wird dies als beschädigte oder überschriebene Konfiguration behandelt, und der Gateway nimmt nicht eigenständig `local` für Sie an — führen Sie das Onboarding erneut aus, legen Sie den Schlüssel manuell fest oder übergeben Sie `--allow-unconfigured`.
    - Eine Bindung über Loopback hinaus wird ohne Authentifizierung blockiert.
    - Die `--bind`-Werte `lan`, `tailnet` und `custom` werden derzeit ausschließlich über IPv4-Pfade aufgelöst; reine IPv6-Installationen mit eigenem Host benötigen einen IPv4-Sidecar oder Proxy vor dem Gateway.
    - `SIGUSR1` löst bei entsprechender Autorisierung einen prozessinternen Neustart aus. `commands.restart` (Standard: aktiviert) steuert extern gesendete `SIGUSR1`-Signale; setzen Sie den Wert auf `false`, um manuelle Neustarts über Betriebssystemsignale zu blockieren, während Neustarts über den Befehl `gateway restart`, das Gateway-Tool sowie das Anwenden oder Aktualisieren der Konfiguration weiterhin möglich bleiben.
    - `SIGINT`/`SIGTERM` beenden den Prozess, stellen jedoch keinen benutzerdefinierten Terminalzustand wieder her — wenn Sie die CLI in eine TUI oder eine Eingabe im Rohmodus einbetten, stellen Sie das Terminal vor dem Beenden selbst wieder her.

  </Accordion>
</AccordionGroup>

### Optionen

<ParamField path="--port <port>" type="number">
  WebSocket-Port (Standardwert aus Konfiguration/Umgebung; üblicherweise `18789`).
</ParamField>
<ParamField path="--bind <mode>" type="string">
  Bindungsmodus: `loopback` (Standard), `lan`, `tailnet`, `auto`, `custom`.
</ParamField>
<ParamField path="--token <token>" type="string">
  Gemeinsames Token für `connect.params.auth.token`. Verwendet standardmäßig `OPENCLAW_GATEWAY_TOKEN`, falls gesetzt.
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
  Tailscale-Freigabe: `off`, `serve`, `funnel`.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Tailscale-Serve-/Funnel-Konfiguration beim Herunterfahren zurücksetzen.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Ohne Erzwingung von `gateway.mode=local` starten. Nur für Ad-hoc-/Entwicklungsinitialisierung; speichert oder repariert die Konfiguration nicht.
</ParamField>
<ParamField path="--dev" type="boolean">
  Eine Entwicklungskonfiguration und einen Arbeitsbereich erstellen, falls diese fehlen (`BOOTSTRAP.md` wird übersprungen).
</ParamField>
<ParamField path="--reset" type="boolean">
  Entwicklungskonfiguration, Anmeldedaten, Sitzungen und Arbeitsbereich zurücksetzen. Erfordert `--dev`.
</ParamField>
<ParamField path="--force" type="boolean">
  Vor dem Start jeden vorhandenen Listener am Zielport beenden.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Ausführliche Protokollierung nach stdout/stderr.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  Nur CLI-Backend-Protokolle in der Konsole anzeigen (aktiviert auch stdout/stderr).
</ParamField>
<ParamField path="--ws-log <style>" type="string" default="auto">
  WebSocket-Protokollstil: `auto`, `full`, `compact`.
</ParamField>
<ParamField path="--compact" type="boolean">
  Alias für `--ws-log compact`.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  Unverarbeitete Modellstream-Ereignisse in JSONL protokollieren.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  JSONL-Pfad für den unverarbeiteten Stream.
</ParamField>

`--claude-cli-logs` ist ein veralteter Alias für `--cli-backend-logs`.

Legen Sie für `--bind custom` `gateway.customBindHost` auf eine IPv4-Adresse fest. Jede andere Adresse als `127.0.0.1` oder `0.0.0.0` erfordert zusätzlich `127.0.0.1` am selben Port für Clients auf demselben Host; der Start schlägt fehl, wenn einer der beiden Listener keine Bindung herstellen kann. Der Platzhalter `0.0.0.0` fügt keinen separaten erforderlichen Alias hinzu. Reine IPv6-Installationen mit eigenem Host benötigen einen IPv4-Sidecar oder Proxy vor dem Gateway.

## Gateway neu starten

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
openclaw gateway restart --wait 30s
```

`--safe` weist den laufenden Gateway an, aktive Arbeiten vorab zu prüfen und einen zusammengefassten Neustart zu planen, nachdem diese Arbeiten abgeschlossen sind. Die Wartezeit wird durch `gateway.reload.deferralTimeoutMs` begrenzt (Standard: 5 Minuten / `300000`); nach Ablauf des Zeitbudgets wird der Neustart erzwungen. Setzen Sie `deferralTimeoutMs: 0`, um unbegrenzt zu warten (mit regelmäßigen Warnungen über weiterhin ausstehende Arbeiten), anstatt den Neustart zu erzwingen. `--safe` kann nicht mit `--force` oder `--wait` kombiniert werden.

`--skip-deferral` umgeht bei einem sicheren Neustart die Aufschubsperre für aktive Arbeiten, sodass der Gateway auch bei gemeldeten Blockierungen sofort neu startet. Die Option erfordert `--safe` — verwenden Sie sie, wenn ein Aufschub wegen einer außer Kontrolle geratenen Aufgabe hängen bleibt.

`--wait <duration>` überschreibt das Zeitbudget für das Abschließen aktiver Arbeiten bei einem gewöhnlichen (nicht sicheren) Neustart. Akzeptiert Millisekunden ohne Einheit oder die Einheitssuffixe `ms`, `s`, `m`, `h`, `d` (z. B. `30s`, `5m`, `1h30m`); `--wait 0` wartet unbegrenzt. Nicht mit `--force` oder `--safe` kompatibel.

`--force` überspringt das Abschließen aktiver Arbeiten und startet sofort neu. Ein gewöhnlicher `restart` (ohne Optionen) behält das bestehende Neustartverhalten des Dienstmanagers bei.

<Warning>
Ein direkt angegebenes `--password` kann in lokalen Prozesslisten sichtbar sein. Verwenden Sie vorzugsweise `--password-file`, eine Umgebungsvariable oder ein durch SecretRef gestütztes `gateway.auth.password`.
</Warning>

### Gateway-Profiling

- `OPENCLAW_GATEWAY_STARTUP_TRACE=1` protokolliert beim Start die Phasenzeiten, einschließlich der `eventLoopMax`-Verzögerung je Phase und der Zeiten für Plugin-Nachschlagetabellen (Installationsindex, Manifestregistrierung, Startplanung, Zuordnung zu Verantwortlichen).
- `OPENCLAW_GATEWAY_RESTART_TRACE=1` protokolliert neustartspezifische Zeilen mit `restart trace:`: Signalverarbeitung, Abschluss aktiver Arbeiten, Herunterfahrphasen, nächster Start, Bereitschaftszeit und Speicherkennzahlen.
- `OPENCLAW_DIAGNOSTICS=timeline` schreibt zusammen mit `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` nach bestem Bemühen eine JSONL-Diagnosezeitleiste des Starts für externe QA-Testsysteme (entspricht der Konfiguration `diagnostics.flags: ["timeline"]`; der Pfad ist weiterhin nur über eine Umgebungsvariable verfügbar). Fügen Sie `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` hinzu, um Ereignisschleifen-Messwerte einzubeziehen.
- `pnpm build` und anschließend `pnpm test:startup:gateway -- --runs 5 --warmup 1` messen den Gateway-Start anhand des erstellten CLI-Einstiegspunkts: erste Prozessausgabe, `/healthz`, `/readyz`, Zeiten der Startablaufverfolgung, Ereignisschleifen-Verzögerung und Zeit der Plugin-Nachschlagetabelle.
- `pnpm build` und anschließend `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5` messen den prozessinternen Neustart unter macOS oder Linux (unter Windows nicht unterstützt; der Neustart erfordert `SIGUSR1`). Der Test verwendet `SIGUSR1`, aktiviert beide Ablaufverfolgungen im untergeordneten Prozess und zeichnet das nächste `/healthz`, das nächste `/readyz`, die Ausfallzeit, die Bereitschaftszeit, CPU, RSS und Neustart-Ablaufverfolgungskennzahlen auf.
- `/healthz` zeigt die Betriebsfähigkeit an; `/readyz` zeigt die Nutzungsbereitschaft an. Behandeln Sie Ablaufverfolgungszeilen und Benchmark-Ausgaben als Hinweise für die Zuordnung zu Verantwortlichen, nicht als vollständige Leistungsbewertung auf Grundlage eines einzelnen Zeitabschnitts oder Messwerts.

## Einen laufenden Gateway abfragen

Alle Abfragebefehle verwenden WebSocket-RPC.

<Tabs>
  <Tab title="Ausgabemodi">
    - Standard: menschenlesbar (in einer TTY farbig).
    - `--json`: maschinenlesbares JSON (ohne Gestaltung/Fortschrittsanzeige).
    - `--no-color` (oder `NO_COLOR=1`): ANSI deaktivieren und dabei das menschenlesbare Layout beibehalten.

  </Tab>
  <Tab title="Gemeinsame Optionen">
    - `--url <url>`: WebSocket-URL des Gateways.
    - `--token <token>`: Gateway-Token.
    - `--password <password>`: Gateway-Passwort.
    - `--timeout <ms>`: Zeitüberschreitung/Zeitbudget (Standardwert variiert je Befehl; siehe die einzelnen Befehle unten).
    - `--expect-final`: auf eine „final“-Antwort warten (Agent-Aufrufe).

  </Tab>
</Tabs>

<Note>
Wenn Sie `--url` festlegen, greift die CLI nicht ersatzweise auf Anmeldedaten aus der Konfiguration oder der Umgebung zurück. Übergeben Sie `--token` oder `--password` ausdrücklich. Fehlende explizite Anmeldedaten führen zu einem Fehler.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway health --port 18789
```

`/healthz` ist eine Betriebsfähigkeitsprüfung: Sie antwortet, sobald der Server HTTP-Anfragen beantworten kann. `/readyz` ist strenger und bleibt rot, solange beim Start Plugin-Sidecars, Kanäle oder konfigurierte Hooks noch nicht vollständig bereit sind. Lokale oder authentifizierte ausführliche `/readyz`-Antworten enthalten einen `eventLoop`-Diagnoseblock (Verzögerung, Auslastung, CPU-Kern-Verhältnis, Kennzeichen `degraded`).

<ParamField path="--port <port>" type="number">
  Einen lokalen Gateway über local loopback an diesem Port ansprechen. Überschreibt für diesen Aufruf `OPENCLAW_GATEWAY_URL` und `OPENCLAW_GATEWAY_PORT`.
</ParamField>

### `gateway usage-cost`

Zusammenfassungen der Nutzungskosten aus Sitzungsprotokollen abrufen.

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
  Die Zusammenfassung auf eine konfigurierte Agent-ID beschränken.
</ParamField>
<ParamField path="--all-agents" type="boolean">
  Über alle konfigurierten Agents aggregieren. Kann nicht mit `--agent` kombiniert werden.
</ParamField>

### `gateway stability`

Die aktuelle diagnostische Stabilitätsaufzeichnung von einem laufenden Gateway abrufen.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  Maximale Anzahl einzubeziehender aktueller Ereignisse (höchstens `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  Nach diagnostischem Ereignistyp filtern, z. B. `payload.large` oder `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Nur Ereignisse nach einer diagnostischen Sequenznummer einbeziehen.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Ein gespeichertes Stabilitätspaket lesen, anstatt den laufenden Gateway aufzurufen. `--bundle latest` (oder nur `--bundle`) wählt das neueste Paket im Zustandsverzeichnis aus; Sie können auch direkt einen JSON-Pfad zu einem Paket übergeben.
</ParamField>
<ParamField path="--export" type="boolean">
  Eine teilbare ZIP-Datei mit Supportdiagnosen schreiben, anstatt Stabilitätsdetails auszugeben.
</ParamField>
<ParamField path="--output <path>" type="string">
  Ausgabepfad für `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Datenschutz und Paketverhalten">
    - Aufzeichnungen bewahren betriebliche Metadaten auf: Ereignisnamen, Anzahlen, Bytegrößen, Speicherwerte, Warteschlangen-/Sitzungsstatus, Genehmigungs-IDs, Kanal-/Plugin-Namen und redigierte Sitzungszusammenfassungen. Ausgeschlossen sind Chattexte, Webhook-Inhalte, Tool-Ausgaben, unverarbeitete Anfrage-/Antwortinhalte, Tokens, Cookies, geheime Werte, Hostnamen und unverarbeitete Sitzungs-IDs. Setzen Sie `diagnostics.enabled: false`, um die Aufzeichnung vollständig zu deaktivieren.
    - Schwerwiegende Gateway-Beendigungen, Zeitüberschreitungen beim Herunterfahren und Startfehler nach Neustarts schreiben denselben Diagnose-Snapshot nach `~/.openclaw/logs/stability/openclaw-stability-*.json`, wenn die Aufzeichnung Ereignisse enthält. Untersuchen Sie das neueste Paket mit `openclaw gateway stability --bundle latest`; `--limit`, `--type` und `--since-seq` gelten auch für die Paketausgabe.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Eine lokale Diagnose-ZIP-Datei für Fehlerberichte schreiben. Informationen zum Datenschutzmodell und zum Paketinhalt finden Sie unter [Diagnoseexport](/de/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Pfad der ZIP-Ausgabedatei. Standardmäßig wird ein Support-Export im Zustandsverzeichnis erstellt.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Maximale Anzahl der einzuschließenden bereinigten Protokollzeilen.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  Maximale Anzahl der zu untersuchenden Protokollbytes.
</ParamField>
<ParamField path="--url <url>" type="string">
  Gateway-WebSocket-URL für die Integritätsmomentaufnahme.
</ParamField>
<ParamField path="--token <token>" type="string">
  Gateway-Token für die Integritätsmomentaufnahme.
</ParamField>
<ParamField path="--password <password>" type="string">
  Gateway-Passwort für die Integritätsmomentaufnahme.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  Zeitlimit für die Status-/Integritätsmomentaufnahme.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  Suche nach einem persistent gespeicherten Stabilitätspaket überspringen.
</ParamField>
<ParamField path="--json" type="boolean">
  Den geschriebenen Pfad, die Größe und das Manifest als JSON ausgeben.
</ParamField>

Der Export bündelt: `manifest.json` (Dateiinventar), `summary.md` (Markdown-Zusammenfassung), `diagnostics.json` (übergeordnete Zusammenfassung von Konfiguration, Protokollen, Erkennung, Stabilität, Status und Integrität), `config/sanitized.json`, `status/gateway-status.json`, `health/gateway-health.json`, `logs/openclaw-sanitized.jsonl` sowie `stability/latest.json`, wenn ein Paket vorhanden ist.

Er ist für die Weitergabe konzipiert. Er behält für die Fehlerdiagnose nützliche Betriebsdetails bei – sichere Protokollfelder, Subsystemnamen, Statuscodes, Zeitdauern, konfigurierte Modi, Ports, Plugin-/Provider-IDs, nicht geheime Funktionseinstellungen und redigierte betriebliche Protokollmeldungen – und lässt Chattexte, Webhook-Inhalte, Werkzeugausgaben, Anmeldedaten, Cookies, Konto-/Nachrichtenkennungen, Prompt-/Anweisungstexte, Hostnamen und geheime Werte weg oder redigiert sie. Wenn eine Protokollmeldung wie Nutzungsdaten aus Benutzer-, Chat- oder Werkzeuginteraktionen aussieht (z. B. „Benutzer sagte“, „Chattext“, „Werkzeugausgabe“, „Webhook-Inhalt“), behält der Export nur die Information bei, dass eine Nachricht ausgelassen wurde, sowie deren Byteanzahl.

### `gateway status`

Zeigt den Gateway-Dienst (launchd/systemd/schtasks) sowie eine optionale Verbindungs-/Authentifizierungsprüfung an.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Ein explizites Prüfziel hinzufügen. Das konfigurierte entfernte Ziel und localhost werden weiterhin geprüft.
</ParamField>
<ParamField path="--token <token>" type="string">
  Token-Authentifizierung für die Prüfung.
</ParamField>
<ParamField path="--password <password>" type="string">
  Passwortauthentifizierung für die Prüfung.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Zeitlimit der Prüfung.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  Verbindungsprüfung überspringen (nur Dienstansicht).
</ParamField>
<ParamField path="--deep" type="boolean">
  Auch systemweite Dienste durchsuchen.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Die Verbindungsprüfung zu einer Leseprüfung erweitern und bei einem Fehlschlag mit einem von null verschiedenen Code beenden. Nicht mit `--no-probe` kombinierbar.
</ParamField>

<AccordionGroup>
  <Accordion title="Statussemantik">
    - Bleibt für Diagnosezwecke verfügbar, auch wenn die lokale CLI-Konfiguration fehlt oder ungültig ist.
    - Die Standardausgabe weist den Dienststatus, die WebSocket-Verbindung und die beim Handshake sichtbare Authentifizierungsberechtigung nach – nicht Lese-, Schreib- oder Administratorvorgänge.
    - Prüfungen verändern bei der erstmaligen Geräteauthentifizierung nichts: Sie verwenden ein vorhandenes zwischengespeichertes Geräte-Token erneut, erstellen jedoch niemals nur zur Statusprüfung eine neue CLI-Geräteidentität oder einen schreibgeschützten Kopplungsdatensatz.
    - Löst konfigurierte SecretRefs für die Authentifizierung nach Möglichkeit für die Prüfauthentifizierung auf. Wenn ein erforderlicher SecretRef nicht aufgelöst ist, meldet `--json` `rpc.authWarning`, falls die Verbindung oder Authentifizierung der Prüfung fehlschlägt. Übergeben Sie `--token`/`--password` explizit oder korrigieren Sie die Secret-Quelle. Warnungen wegen nicht aufgelöster Authentifizierung werden unterdrückt, sobald die Prüfung erfolgreich ist.
    - Die JSON-Ausgabe enthält `gateway.version`, wenn das laufende Gateway diese meldet. `--require-rpc` kann auf die RPC-Nutzlast `status.runtimeVersion` zurückgreifen, wenn die Handshake-Prüfung keine Versionsmetadaten liefern kann.
    - Verwenden Sie `--require-rpc` in Skripten und Automatisierungen, wenn ein lauschender Dienst nicht ausreicht und auch RPC mit Leseberechtigung funktionsfähig sein muss.
    - `--deep` sucht nach zusätzlichen launchd-/systemd-/schtasks-Installationen. Wenn mehrere Gateway-ähnliche Dienste gefunden werden, gibt die menschenlesbare Ausgabe Bereinigungshinweise aus (normalerweise sollte pro Computer ein Gateway ausgeführt werden) und meldet gegebenenfalls eine kürzlich erfolgte Neustartübergabe durch den Supervisor.
    - `--deep` führt außerdem die Konfigurationsvalidierung in einem Plugin-kompatiblen Modus (`pluginValidation: "full"`) aus und zeigt Warnungen zu Plugin-Manifesten an (z. B. fehlende Metadaten zur Kanalkonfiguration). Der standardmäßige Befehl `gateway status` behält den schnellen schreibgeschützten Pfad bei, der die Plugin-Validierung überspringt.
    - Die menschenlesbare Ausgabe enthält den aufgelösten Pfad der Protokolldatei sowie die Konfigurationspfade und deren Gültigkeit für CLI und Dienst, um Abweichungen bei Profilen oder Zustandsverzeichnissen leichter zu diagnostizieren.

  </Accordion>
  <Accordion title="Prüfungen auf Authentifizierungsabweichungen unter Linux systemd">
    - Prüfungen auf Abweichungen bei der Dienstauthentifizierung lesen sowohl `Environment=` als auch `EnvironmentFile=` aus der Unit (einschließlich `%h`, Pfaden in Anführungszeichen, mehreren Dateien und optionalen Dateien mit `-`).
    - Löst SecretRefs für `gateway.auth.token` mithilfe der zusammengeführten Laufzeitumgebung auf (zuerst die Befehlsumgebung des Dienstes, anschließend ersatzweise die Prozessumgebung).
    - Prüfungen auf Token-Abweichungen überspringen die Auflösung des Konfigurations-Tokens, wenn die Token-Authentifizierung faktisch nicht aktiv ist (`gateway.auth.mode` ist explizit `password`/`none`/`trusted-proxy`, oder der Modus ist nicht festgelegt, wobei das Passwort Vorrang haben kann und kein Token-Kandidat Vorrang erhalten kann).

  </Accordion>
</AccordionGroup>

### `gateway probe`

Der Befehl zur umfassenden Fehlerdiagnose. Er prüft immer:

- Ihr konfiguriertes entferntes Gateway (falls festgelegt) und
- localhost (local loopback), **selbst wenn ein entferntes Gateway konfiguriert ist**.

Durch Übergabe von `--url` wird dieses explizite Ziel vor den beiden anderen hinzugefügt. Die menschenlesbare Ausgabe kennzeichnet die Ziele als `URL (explicit)`, `Remote (configured)` / `Remote (configured, inactive)` und `Local loopback`.

<Note>
Wenn mehrere Prüfziele erreichbar sind, werden alle ausgegeben. Ein SSH-Tunnel, eine TLS-/Proxy-URL und eine konfigurierte Remote-URL können selbst bei unterschiedlichen Transportports auf dasselbe Gateway verweisen. `multiple_gateways` ist unterschiedlichen oder hinsichtlich ihrer Identität nicht eindeutig bestimmbaren erreichbaren Gateways vorbehalten. Der Betrieb mehrerer Gateways wird für isolierte Profile unterstützt (z. B. einen Rettungs-Bot), die meisten Installationen führen jedoch nur ein Gateway aus.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  Diesen Port für das lokale local-loopback-Prüfziel und den Remote-Port des SSH-Tunnels verwenden. Ohne `--url` wird dadurch ausschließlich das lokale local-loopback-Ziel ausgewählt und nicht die konfigurierte Gateway-Umgebungs-URL, der Umgebungsport oder entfernte Ziele.
</ParamField>

<AccordionGroup>
  <Accordion title="Interpretation">
    - `Reachable: yes` bedeutet, dass mindestens ein Ziel eine WebSocket-Verbindung akzeptiert hat.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` gibt unabhängig von der Erreichbarkeit an, welche Authentifizierungsberechtigung die Prüfung nachweisen konnte.
    - `Read probe: ok` bedeutet, dass auch RPC-Aufrufe mit Leseberechtigung für Detailinformationen (`health`/`status`/`system-presence`/`config.get`) erfolgreich waren.
    - `Read probe: limited - missing scope: operator.read` bedeutet, dass die Verbindung erfolgreich war, RPC mit Leseberechtigung jedoch eingeschränkt ist. Dies wird als **beeinträchtigte** Erreichbarkeit und nicht als vollständiger Ausfall gemeldet.
    - `Read probe: failed` nach `Connect: ok` bedeutet, dass die WebSocket-Verbindung hergestellt wurde, die anschließende Lesediagnose jedoch das Zeitlimit überschritten hat oder fehlgeschlagen ist – ebenfalls **beeinträchtigt**, nicht unerreichbar.
    - Wie `gateway status` verwendet die Prüfung eine vorhandene zwischengespeicherte Geräteauthentifizierung erneut, erstellt jedoch keine erstmalige Geräteidentität oder keinen Kopplungsstatus.
    - Der Exit-Code ist nur dann von null verschieden, wenn kein geprüftes Ziel erreichbar ist.

  </Accordion>
  <Accordion title="JSON-Ausgabe">
    Oberste Ebene:

    - `ok`: Mindestens ein Ziel ist erreichbar.
    - `degraded`: Mindestens ein Ziel hat eine Verbindung akzeptiert, aber die vollständige RPC-Detaildiagnose nicht abgeschlossen.
    - `capability`: Beste bei den erreichbaren Zielen festgestellte Berechtigung (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` oder `unknown`).
    - `primaryTargetId`: Bestes Ziel, das als aktiver Gewinner behandelt werden soll, in folgender Reihenfolge: explizite URL, SSH-Tunnel, konfiguriertes entferntes Ziel, local loopback.
    - `warnings[]`: Nach bestem Bemühen erstellte Warnungsdatensätze mit `code`, `message` und optional `targetIds`.
    - `network`: URL-Hinweise für local loopback/Tailnet, die aus der aktuellen Konfiguration und der Hostnetzwerkkonfiguration abgeleitet werden.
    - `discovery.timeoutMs` / `discovery.count`: Das tatsächlich für diesen Prüfdurchlauf verwendete Erkennungsbudget bzw. die Ergebnisanzahl.

    Pro Ziel (`targets[].connect`): `ok` (Erreichbarkeit und Einstufung der Beeinträchtigung), `rpcOk` (vollständiger Erfolg der RPC-Detaildiagnose), `scopeLimited` (Detail-RPC ist aufgrund fehlender Operator-Berechtigung fehlgeschlagen).

    Pro Ziel (`targets[].auth`): `role` und `scopes`, wie in `hello-ok` gemeldet, sofern verfügbar, sowie die ausgegebene `capability`-Einstufung.

  </Accordion>
  <Accordion title="Häufige Warncodes">
    - `ssh_tunnel_failed`: Die Einrichtung des SSH-Tunnels ist fehlgeschlagen; der Befehl ist auf direkte Prüfungen zurückgefallen.
    - `multiple_gateways`: Unterschiedliche Gateway-Identitäten waren erreichbar oder OpenClaw konnte nicht nachweisen, dass die erreichbaren Ziele dasselbe Gateway sind. Ein SSH-Tunnel, eine Proxy-URL oder eine konfigurierte Remote-URL zu demselben Gateway löst dies nicht aus.
    - `auth_secretref_unresolved`: Ein konfigurierter SecretRef für die Authentifizierung konnte für ein fehlgeschlagenes Ziel nicht aufgelöst werden.
    - `probe_scope_limited`: Die WebSocket-Verbindung war erfolgreich, die Leseprüfung war jedoch durch das fehlende `operator.read` eingeschränkt.
    - `local_tls_runtime_unavailable`: Lokales Gateway-TLS ist aktiviert, OpenClaw konnte jedoch den Fingerabdruck des lokalen Zertifikats nicht laden.

  </Accordion>
</AccordionGroup>

#### Entfernt über SSH (Funktionsgleichheit mit der Mac-App)

Der Modus „Remote over SSH“ der macOS-App verwendet eine lokale Portweiterleitung, damit ein ausschließlich über local loopback zugängliches entferntes Gateway unter `ws://127.0.0.1:<port>` erreichbar wird.

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
  Den zuerst erkannten Gateway-Host aus dem aufgelösten Erkennungsendpunkt (`local.` sowie gegebenenfalls die konfigurierte Weitverkehrsdomäne) als SSH-Ziel auswählen. Hinweise, die ausschließlich aus TXT-Einträgen bestehen, werden ignoriert.
</ParamField>

Konfigurationsstandardwerte (optional): `gateway.remote.sshTarget`, `gateway.remote.sshIdentity`.

### `gateway call <method>`

RPC-Hilfsbefehl auf niedriger Ebene.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"limit": 200}'
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
<ParamField path="--timeout <ms>" type="number" default="10000">
  Zeitlimitbudget.
</ParamField>
<ParamField path="--expect-final" type="boolean">
  Hauptsächlich für agentenartige RPCs, die vor einer abschließenden Nutzlast Zwischenereignisse streamen.
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

Verwenden Sie `--wrapper`, wenn der verwaltete Dienst über eine andere ausführbare Datei gestartet werden muss, beispielsweise über einen Shim für die Secret-Verwaltung oder einen Hilfsbefehl zur Ausführung unter einem bestimmten Benutzerkonto. Der Wrapper erhält die normalen Gateway-Argumente und ist dafür verantwortlich, schließlich `openclaw` oder Node mit diesen Argumenten per `exec` auszuführen.

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

Sie können den Wrapper auch über die Umgebung festlegen. `gateway install` prüft, ob der Pfad eine ausführbare Datei ist, schreibt den Wrapper in die `ProgramArguments` des Dienstes und speichert `OPENCLAW_WRAPPER` in der Dienstumgebung für spätere erzwungene Neuinstallationen, Aktualisierungen und Reparaturen durch Doctor.

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
    - `gateway install`: `--port`, `--runtime <node|bun>` (Standardwert: `node`), `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start`: `--json`
    - `gateway stop`: `--disable`, `--json`

  </Accordion>
  <Accordion title="Lebenszyklusverhalten">
    - Verwenden Sie `gateway restart`, um einen verwalteten Dienst neu zu starten. Verketten Sie nicht `gateway stop` und `gateway start` als Ersatz für einen Neustart.
    - Unter macOS verwendet `gateway stop` standardmäßig `launchctl bootout`. Dadurch wird der LaunchAgent aus der aktuellen Startsitzung entfernt, ohne dauerhaft deaktiviert zu werden – die automatische Wiederherstellung durch KeepAlive bleibt für zukünftige Abstürze aktiv, und `gateway start` aktiviert den Dienst ordnungsgemäß wieder, ohne dass ein manuelles `launchctl enable` erforderlich ist. Übergeben Sie `--disable`, um KeepAlive und RunAtLoad dauerhaft zu unterdrücken, sodass der Gateway erst nach dem nächsten expliziten `gateway start` erneut gestartet wird. Verwenden Sie diese Option, wenn ein manueller Stopp Neustarts des Systems überdauern soll.
    - Lebenszyklusbefehle akzeptieren `--json` zur Verwendung in Skripten.

  </Accordion>
  <Accordion title="Authentifizierung und SecretRefs bei der Installation">
    - Wenn die Token-Authentifizierung ein Token erfordert und `gateway.auth.token` über eine SecretRef verwaltet wird, prüft `gateway install`, ob die SecretRef aufgelöst werden kann, speichert das aufgelöste Token jedoch nicht in den Umgebungsmetadaten des Dienstes.
    - Wenn die Token-Authentifizierung ein Token erfordert und die konfigurierte Token-SecretRef nicht aufgelöst werden kann, schlägt die Installation sicher fehl, anstatt ersatzweise Klartext zu speichern.
    - Bevorzugen Sie für die Passwortauthentifizierung bei `gateway run` `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` oder ein durch eine SecretRef gestütztes `gateway.auth.password` gegenüber einem direkt angegebenen `--password`.
    - Im abgeleiteten Authentifizierungsmodus lockert ein nur in der Shell gesetztes `OPENCLAW_GATEWAY_PASSWORD` die Token-Anforderungen für die Installation nicht. Verwenden Sie bei der Installation eines verwalteten Dienstes eine dauerhafte Konfiguration (`gateway.auth.password` oder `env` in der Konfiguration).
    - Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht festgelegt ist, wird die Installation blockiert, bis der Modus explizit festgelegt wurde.

  </Accordion>
</AccordionGroup>

## Gateways ermitteln (Bonjour)

`gateway discover` sucht nach Gateway-Beacons (`_openclaw-gw._tcp`).

- Multicast-DNS-SD: `local.`
- Unicast-DNS-SD (Bonjour für Weitverkehrsnetze): Wählen Sie eine Domain (Beispiel: `openclaw.internal.`) und richten Sie Split-DNS sowie einen DNS-Server ein; siehe [Bonjour](/de/gateway/bonjour).

Nur Gateways mit aktivierter Bonjour-Ermittlung (Standard) kündigen den Beacon an.

TXT-Hinweise in jedem Beacon: `role` (Hinweis auf die Gateway-Rolle), `transport` (Hinweis auf den Transport, z. B. `gateway`), `gatewayPort` (WebSocket-Port, normalerweise `18789`), `tailnetDns` (MagicDNS-Hostname, sofern verfügbar), `gatewayTls` / `gatewayTlsSha256` (TLS aktiviert und Zertifikat-Fingerabdruck). `sshPort` und `cliPath` werden nur im vollständigen Ermittlungsmodus veröffentlicht (`discovery.mdns.mode: "full"`; Standardwert ist `"minimal"`, wodurch sie ausgelassen werden – Clients verwenden dann standardmäßig Port `22` für SSH-Ziele).

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Zeitlimit pro Befehl (Durchsuchen/Auflösen).
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
- Durchsucht `local.` sowie die konfigurierte Weitverkehrs-Domain, sofern eine aktiviert ist.
- `wsUrl` in der JSON-Ausgabe wird aus dem aufgelösten Dienstendpunkt abgeleitet, nicht aus reinen TXT-Hinweisen wie `lanHost` oder `tailnetDns`.
- `discovery.mdns.mode` steuert die Veröffentlichung von `sshPort`/`cliPath` sowohl für `local.`-mDNS als auch für Weitverkehrs-DNS-SD (siehe oben).

</Note>

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Gateway-Betriebshandbuch](/de/gateway)
