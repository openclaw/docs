---
read_when:
    - Ausführen des Gateways über die CLI (Entwicklung oder Server)
    - Fehlerbehebung bei Gateway-Authentifizierung, Bindungsmodi und Konnektivität
    - Gateways über Bonjour erkennen (lokal + Wide-Area-DNS-SD)
sidebarTitle: Gateway
summary: OpenClaw-Gateway-CLI (`openclaw gateway`) — Gateways ausführen, abfragen und erkennen
title: Gateway
x-i18n:
    generated_at: "2026-07-12T15:08:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 75f8f4bebe585b213f486f08bf20015aeb89ca4d179f6d96c1008ec9d1cd00ea
    source_path: cli/gateway.md
    workflow: 16
---

Der Gateway ist der WebSocket-Server von OpenClaw (Kanäle, Nodes, Sitzungen, Hooks). Alle folgenden Unterbefehle befinden sich unter `openclaw gateway ...`.

<CardGroup cols={3}>
  <Card title="Bonjour-Erkennung" href="/de/gateway/bonjour">
    Einrichtung von lokalem mDNS und Wide-Area-DNS-SD.
  </Card>
  <Card title="Überblick über die Erkennung" href="/de/gateway/discovery">
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
    - Der Start wird verweigert, sofern `gateway.mode=local` nicht in `~/.openclaw/openclaw.json` festgelegt ist. Verwenden Sie `--allow-unconfigured` für Ad-hoc-/Entwicklungsläufe; damit wird die Schutzprüfung umgangen, ohne die Konfiguration zu schreiben oder zu reparieren.
    - `openclaw onboard --mode local` und `openclaw setup` schreiben `gateway.mode=local`. Wenn die Konfigurationsdatei vorhanden ist, aber `gateway.mode` fehlt, wird dies als beschädigte/überschriebene Konfiguration behandelt, und der Gateway weigert sich, für Sie `local` zu vermuten — führen Sie das Onboarding erneut aus, legen Sie den Schlüssel manuell fest oder übergeben Sie `--allow-unconfigured`.
    - Eine Bindung über die Loopback-Schnittstelle hinaus wird ohne Authentifizierung blockiert.
    - Die `--bind`-Werte `lan`, `tailnet` und `custom` werden derzeit ausschließlich über IPv4-Pfade aufgelöst; reine IPv6-Setups mit eigenem Host benötigen einen IPv4-Sidecar oder Proxy vor dem Gateway.
    - `SIGUSR1` löst bei entsprechender Autorisierung einen prozessinternen Neustart aus. `commands.restart` (Standard: aktiviert) steuert extern gesendete `SIGUSR1`-Signale; setzen Sie den Wert auf `false`, um manuelle Neustarts über Betriebssystemsignale zu blockieren, während Neustarts über den Befehl `gateway restart`, das Gateway-Tool sowie das Anwenden/Aktualisieren der Konfiguration weiterhin möglich bleiben.
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
  Starten, ohne `gateway.mode=local` zu erzwingen. Nur für Ad-hoc-/Entwicklungs-Bootstrap; die Konfiguration wird weder dauerhaft gespeichert noch repariert.
</ParamField>
<ParamField path="--dev" type="boolean">
  Bei Bedarf eine Entwicklungskonfiguration und einen Workspace erstellen (`BOOTSTRAP.md` wird übersprungen).
</ParamField>
<ParamField path="--reset" type="boolean">
  Entwicklungskonfiguration, Anmeldedaten, Sitzungen und Workspace zurücksetzen. Erfordert `--dev`.
</ParamField>
<ParamField path="--force" type="boolean">
  Vor dem Start jeden vorhandenen Listener am Zielport beenden.
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
  Rohereignisse des Modellstreams als JSONL protokollieren.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  JSONL-Pfad für den Rohstream.
</ParamField>

`--claude-cli-logs` ist ein veralteter Alias für `--cli-backend-logs`.

Legen Sie für `--bind custom` `gateway.customBindHost` auf eine IPv4-Adresse fest. Für jede andere Adresse als `127.0.0.1` oder `0.0.0.0` ist für Clients auf demselben Host zusätzlich `127.0.0.1` am selben Port erforderlich; der Start schlägt fehl, wenn einer der beiden Listener keine Bindung herstellen kann. Der Platzhalter `0.0.0.0` fügt keinen separaten erforderlichen Alias hinzu. Reine IPv6-Setups mit eigenem Host benötigen einen IPv4-Sidecar oder Proxy vor dem Gateway.

## Gateway neu starten

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
openclaw gateway restart --wait 30s
```

`--safe` weist den laufenden Gateway an, aktive Arbeit vorab zu prüfen und einen einzigen zusammengefassten Neustart zu planen, nachdem diese Arbeit abgeschlossen ist. Die Wartezeit wird durch `gateway.reload.deferralTimeoutMs` begrenzt (Standard: 5 Minuten / `300000`); nach Ablauf des Zeitbudgets wird der Neustart erzwungen. Legen Sie `deferralTimeoutMs: 0` fest, um unbegrenzt zu warten (mit regelmäßigen Warnungen, dass der Vorgang noch aussteht), statt den Neustart zu erzwingen. `--safe` kann nicht mit `--force` oder `--wait` kombiniert werden.

`--skip-deferral` umgeht bei einem sicheren Neustart die Verzögerungssperre für aktive Arbeit, sodass der Gateway trotz gemeldeter Blockierer sofort neu startet. Die Option erfordert `--safe` — verwenden Sie sie, wenn eine Verzögerung aufgrund einer außer Kontrolle geratenen Aufgabe festhängt.

`--wait <duration>` überschreibt das Zeitbudget für das Auslaufen aktiver Arbeit bei einem normalen (nicht sicheren) Neustart. Akzeptiert Millisekunden ohne Einheit oder die Einheitssuffixe `ms`, `s`, `m`, `h`, `d` (z. B. `30s`, `5m`, `1h30m`); `--wait 0` wartet unbegrenzt. Nicht mit `--force` oder `--safe` kompatibel.

`--force` überspringt das Auslaufen aktiver Arbeit und startet sofort neu. Ein normaler `restart` (ohne Flags) behält das bestehende Neustartverhalten des Dienstmanagers bei.

<Warning>
Ein direkt angegebenes `--password` kann in lokalen Prozesslisten sichtbar sein. Verwenden Sie vorzugsweise `--password-file`, eine Umgebungsvariable oder ein durch SecretRef bereitgestelltes `gateway.auth.password`.
</Warning>

### Gateway-Profiling

- `OPENCLAW_GATEWAY_STARTUP_TRACE=1` protokolliert Phasenzeiten während des Starts, einschließlich der `eventLoopMax`-Verzögerung pro Phase und der Zeiten für Plugin-Nachschlagetabellen (installierter Index, Manifest-Registrierung, Startplanung, Owner-Map-Verarbeitung).
- `OPENCLAW_GATEWAY_RESTART_TRACE=1` protokolliert auf den Neustart bezogene Zeilen mit `restart trace:`: Signalverarbeitung, Auslaufen aktiver Arbeit, Phasen des Herunterfahrens, nächster Start, Bereitschaftszeitpunkt und Arbeitsspeichermetriken.
- `OPENCLAW_DIAGNOSTICS=timeline` schreibt mit `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` nach bestem Bemühen eine JSONL-Zeitleiste der Startdiagnose für externe QA-Testsysteme (entspricht der Konfiguration `diagnostics.flags: ["timeline"]`; der Pfad kann weiterhin nur über die Umgebung festgelegt werden). Fügen Sie `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` hinzu, um Ereignisschleifen-Messwerte einzuschließen.
- `pnpm build` und anschließend `pnpm test:startup:gateway -- --runs 5 --warmup 1` messen den Gateway-Start anhand des erstellten CLI-Einstiegspunkts: erste Prozessausgabe, `/healthz`, `/readyz`, Zeitmessungen der Startablaufverfolgung, Ereignisschleifenverzögerung und Zeitmessung der Plugin-Nachschlagetabelle.
- `pnpm build` und anschließend `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5` messen den prozessinternen Neustart unter macOS oder Linux (unter Windows nicht unterstützt; der Neustart erfordert `SIGUSR1`). Verwendet `SIGUSR1`, aktiviert beide Ablaufverfolgungen im untergeordneten Prozess und zeichnet das nächste `/healthz`, das nächste `/readyz`, die Ausfallzeit, den Bereitschaftszeitpunkt, CPU, RSS und Metriken der Neustartablaufverfolgung auf.
- `/healthz` steht für Erreichbarkeit; `/readyz` für nutzbare Bereitschaft. Behandeln Sie Ablaufverfolgungszeilen und Benchmark-Ausgaben als Hinweise zur Zuordnung zum verantwortlichen Bereich, nicht als vollständige Leistungsbewertung anhand einer einzelnen Zeitspanne oder Stichprobe.

## Laufenden Gateway abfragen

Alle Abfragebefehle verwenden WebSocket-RPC.

<Tabs>
  <Tab title="Ausgabemodi">
    - Standard: menschenlesbar (in einer TTY farbig).
    - `--json`: maschinenlesbares JSON (ohne Formatierung/Spinner).
    - `--no-color` (oder `NO_COLOR=1`): ANSI deaktivieren und das menschenlesbare Layout beibehalten.

  </Tab>
  <Tab title="Gemeinsame Optionen">
    - `--url <url>`: WebSocket-URL des Gateways.
    - `--token <token>`: Gateway-Token.
    - `--password <password>`: Gateway-Passwort.
    - `--timeout <ms>`: Zeitüberschreitung/Zeitbudget (Standard variiert je nach Befehl; siehe die einzelnen Befehle unten).
    - `--expect-final`: auf eine „final“-Antwort warten (Agent-Aufrufe).

  </Tab>
</Tabs>

<Note>
Wenn Sie `--url` festlegen, greift die CLI nicht ersatzweise auf Anmeldedaten aus der Konfiguration oder Umgebung zurück. Übergeben Sie `--token` oder `--password` ausdrücklich. Fehlende explizite Anmeldedaten führen zu einem Fehler.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway health --port 18789
```

`/healthz` ist eine Erreichbarkeitsprüfung: Sie antwortet, sobald der Server HTTP-Anfragen beantworten kann. `/readyz` ist strenger und bleibt rot, solange Plugin-Sidecars, Kanäle oder konfigurierte Hooks beim Start noch nicht vollständig initialisiert sind. Lokale oder authentifizierte detaillierte `/readyz`-Antworten enthalten einen `eventLoop`-Diagnoseblock (Verzögerung, Auslastung, CPU-Kern-Verhältnis, Flag `degraded`).

<ParamField path="--port <port>" type="number">
  Einen lokalen Loopback-Gateway an diesem Port ansprechen. Überschreibt für diesen Aufruf `OPENCLAW_GATEWAY_URL` und `OPENCLAW_GATEWAY_PORT`.
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
  Anzahl der einzuschließenden Tage.
</ParamField>
<ParamField path="--agent <id>" type="string">
  Die Zusammenfassung auf die ID eines konfigurierten Agenten beschränken.
</ParamField>
<ParamField path="--all-agents" type="boolean">
  Über alle konfigurierten Agenten aggregieren. Kann nicht mit `--agent` kombiniert werden.
</ParamField>

### `gateway stability`

Die aktuelle Aufzeichnung der Diagnosestabilität von einem laufenden Gateway abrufen.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  Maximale Anzahl einzuschließender aktueller Ereignisse (maximal `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  Nach Diagnoseereignistyp filtern, z. B. `payload.large` oder `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Nur Ereignisse nach einer Diagnosesequenznummer einschließen.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Ein dauerhaft gespeichertes Stabilitätspaket lesen, statt den laufenden Gateway aufzurufen. `--bundle latest` (oder nur `--bundle`) wählt das neueste Paket im Zustandsverzeichnis aus; Sie können auch direkt einen JSON-Pfad zu einem Paket übergeben.
</ParamField>
<ParamField path="--export" type="boolean">
  Eine teilbare ZIP-Datei mit Supportdiagnosen schreiben, statt Stabilitätsdetails auszugeben.
</ParamField>
<ParamField path="--output <path>" type="string">
  Ausgabepfad für `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Datenschutz und Paketverhalten">
    - Aufzeichnungen enthalten betriebliche Metadaten: Ereignisnamen, Anzahlen, Bytegrößen, Arbeitsspeicherwerte, Warteschlangen-/Sitzungszustand, Genehmigungs-IDs, Kanal-/Plugin-Namen und redigierte Sitzungszusammenfassungen. Ausgeschlossen sind Chattext, Webhook-Inhalte, Tool-Ausgaben, rohe Anfrage-/Antwortinhalte, Tokens, Cookies, geheime Werte, Hostnamen und rohe Sitzungs-IDs. Legen Sie `diagnostics.enabled: false` fest, um die Aufzeichnung vollständig zu deaktivieren.
    - Schwerwiegende Gateway-Beendigungen, Zeitüberschreitungen beim Herunterfahren und Startfehler bei Neustarts schreiben denselben Diagnose-Snapshot nach `~/.openclaw/logs/stability/openclaw-stability-*.json`, wenn die Aufzeichnung Ereignisse enthält. Prüfen Sie das neueste Paket mit `openclaw gateway stability --bundle latest`; `--limit`, `--type` und `--since-seq` gelten auch für die Paketausgabe.

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
  Pfad der Ausgabe-ZIP-Datei. Standardmäßig wird ein Support-Export im Zustandsverzeichnis erstellt.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Maximale Anzahl bereinigter Protokollzeilen, die eingeschlossen werden.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  Maximale Anzahl zu untersuchender Protokollbytes.
</ParamField>
<ParamField path="--url <url>" type="string">
  Gateway-WebSocket-URL für die Zustandsmomentaufnahme.
</ParamField>
<ParamField path="--token <token>" type="string">
  Gateway-Token für die Zustandsmomentaufnahme.
</ParamField>
<ParamField path="--password <password>" type="string">
  Gateway-Passwort für die Zustandsmomentaufnahme.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  Zeitüberschreitung für die Status-/Zustandsmomentaufnahme.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  Suche nach einem gespeicherten Stabilitätspaket überspringen.
</ParamField>
<ParamField path="--json" type="boolean">
  Den geschriebenen Pfad, die Größe und das Manifest als JSON ausgeben.
</ParamField>

Der Export bündelt: `manifest.json` (Dateiinventar), `summary.md` (Markdown-Zusammenfassung), `diagnostics.json` (übergeordnete Zusammenfassung von Konfiguration/Protokollen/Erkennung/Stabilität/Status/Zustand), `config/sanitized.json`, `status/gateway-status.json`, `health/gateway-health.json`, `logs/openclaw-sanitized.jsonl` und `stability/latest.json`, wenn ein Paket vorhanden ist.

Er ist für die Weitergabe konzipiert. Er behält Betriebsdetails bei, die für die Fehlersuche nützlich sind – sichere Protokollfelder, Subsystemnamen, Statuscodes, Zeitspannen, konfigurierte Modi, Ports, Plugin-/Provider-IDs, nicht geheime Funktionseinstellungen und redigierte betriebliche Protokollmeldungen – und lässt Chattext, Webhook-Inhalte, Werkzeugausgaben, Anmeldedaten, Cookies, Konto-/Nachrichtenkennungen, Prompt-/Anweisungstext, Hostnamen und geheime Werte weg oder redigiert sie. Wenn eine Protokollmeldung wie Nutzlasttext aus Benutzer-, Chat- oder Werkzeugdaten aussieht (z. B. „Benutzer sagte“, „Chattext“, „Werkzeugausgabe“, „Webhook-Inhalt“), enthält der Export nur die Information, dass eine Nachricht ausgelassen wurde, sowie deren Byteanzahl.

### `gateway status`

Zeigt den Gateway-Dienst (launchd/systemd/schtasks) sowie optional eine Verbindungs-/Authentifizierungsprüfung an.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Ein explizites Prüfziel hinzufügen. Die konfigurierte Gegenstelle und localhost werden weiterhin geprüft.
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
  Die Verbindungsprüfung überspringen (reine Dienstansicht).
</ParamField>
<ParamField path="--deep" type="boolean">
  Auch systemweite Dienste durchsuchen.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Die Verbindungsprüfung zu einer Leseprüfung erweitern und bei einem Fehlschlag mit einem von null verschiedenen Status beenden. Kann nicht mit `--no-probe` kombiniert werden.
</ParamField>

<AccordionGroup>
  <Accordion title="Statussemantik">
    - Bleibt für Diagnosen verfügbar, selbst wenn die lokale CLI-Konfiguration fehlt oder ungültig ist.
    - Die Standardausgabe weist den Dienstzustand, die WebSocket-Verbindung und die beim Handshake sichtbare Authentifizierungsfähigkeit nach – nicht Lese-, Schreib- oder Administratorvorgänge.
    - Prüfungen verändern bei der erstmaligen Geräteauthentifizierung nichts: Sie verwenden ein vorhandenes zwischengespeichertes Geräte-Token erneut, erstellen jedoch niemals nur zur Statusprüfung eine neue CLI-Geräteidentität oder einen schreibgeschützten Kopplungsdatensatz.
    - Löst konfigurierte Authentifizierungs-SecretRefs für die Prüfauthentifizierung nach Möglichkeit auf. Wenn eine erforderliche SecretRef nicht aufgelöst ist, meldet `--json` bei einem Fehlschlag der Prüfverbindung/-authentifizierung `rpc.authWarning`; übergeben Sie `--token`/`--password` explizit oder korrigieren Sie die Geheimnisquelle. Warnungen zu nicht aufgelöster Authentifizierung werden unterdrückt, sobald die Prüfung erfolgreich ist.
    - Die JSON-Ausgabe enthält `gateway.version`, wenn das laufende Gateway sie meldet; `--require-rpc` kann auf die RPC-Nutzlast `status.runtimeVersion` zurückgreifen, wenn die Handshake-Prüfung keine Versionsmetadaten liefern kann.
    - Verwenden Sie `--require-rpc` in Skripten/Automatisierungen, wenn ein lauschender Dienst nicht ausreicht und auch RPC mit Leseberechtigung funktionsfähig sein muss.
    - `--deep` sucht nach zusätzlichen launchd-/systemd-/schtasks-Installationen; wenn mehrere Gateway-ähnliche Dienste gefunden werden, gibt die menschenlesbare Ausgabe Bereinigungshinweise aus (normalerweise sollte pro Rechner ein Gateway ausgeführt werden) und meldet gegebenenfalls eine kürzlich erfolgte Übergabe nach einem Supervisor-Neustart.
    - `--deep` führt außerdem die Konfigurationsvalidierung im Plugin-fähigen Modus (`pluginValidation: "full"`) aus und zeigt Warnungen zum Plugin-Manifest an (z. B. fehlende Metadaten zur Kanalkonfiguration). Der standardmäßige Befehl `gateway status` behält den schnellen schreibgeschützten Pfad bei, der die Plugin-Validierung überspringt.
    - Die menschenlesbare Ausgabe enthält den aufgelösten Pfad der Dateiprotokollierung sowie die Konfigurationspfade und deren Gültigkeit für CLI und Dienst, um Abweichungen bei Profilen oder Zustandsverzeichnissen leichter zu diagnostizieren.

  </Accordion>
  <Accordion title="Linux-systemd-Prüfungen auf Authentifizierungsabweichungen">
    - Prüfungen auf Abweichungen bei der Dienstauthentifizierung lesen sowohl `Environment=` als auch `EnvironmentFile=` aus der Unit (einschließlich `%h`, Pfaden in Anführungszeichen, mehreren Dateien und optionalen `-`-Dateien).
    - Löst SecretRefs für `gateway.auth.token` mithilfe der zusammengeführten Laufzeitumgebung auf (zuerst die Umgebung des Dienstbefehls, dann ersatzweise die Prozessumgebung).
    - Prüfungen auf Token-Abweichungen überspringen die Auflösung des Konfigurations-Tokens, wenn die Token-Authentifizierung faktisch nicht aktiv ist (`gateway.auth.mode` ist explizit `password`/`none`/`trusted-proxy`, oder der Modus ist nicht gesetzt, sodass das Passwort Vorrang haben kann und kein Token-Kandidat Vorrang erhalten kann).

  </Accordion>
</AccordionGroup>

### `gateway probe`

Der Befehl zum „Debuggen von allem“. Er prüft immer:

- Ihr konfiguriertes entferntes Gateway (falls festgelegt) und
- localhost (Loopback), **selbst wenn eine Gegenstelle konfiguriert ist**.

Durch Übergabe von `--url` wird dieses explizite Ziel vor den beiden anderen hinzugefügt. Die menschenlesbare Ausgabe kennzeichnet die Ziele als `URL (explicit)`, `Remote (configured)` / `Remote (configured, inactive)` und `Local loopback`.

<Note>
Wenn mehrere Prüfziele erreichbar sind, werden alle ausgegeben. Ein SSH-Tunnel, eine TLS-/Proxy-URL und eine konfigurierte Gegenstellen-URL können selbst bei unterschiedlichen Transportports auf dasselbe Gateway verweisen; `multiple_gateways` ist unterschiedlichen oder hinsichtlich ihrer Identität mehrdeutigen erreichbaren Gateways vorbehalten. Mehrere Gateways werden für isolierte Profile unterstützt (z. B. einen Rettungs-Bot), die meisten Installationen führen jedoch nur ein Gateway aus.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  Diesen Port für das lokale Loopback-Prüfziel und den entfernten Port des SSH-Tunnels verwenden. Ohne `--url` wird damit nur das lokale Loopback-Ziel ausgewählt, statt der konfigurierten Gateway-Umgebungs-URL, des Umgebungsports oder entfernter Ziele.
</ParamField>

<AccordionGroup>
  <Accordion title="Interpretation">
    - `Reachable: yes` bedeutet, dass mindestens ein Ziel eine WebSocket-Verbindung akzeptiert hat.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` gibt getrennt von der Erreichbarkeit an, was die Prüfung hinsichtlich der Authentifizierung nachweisen konnte.
    - `Read probe: ok` bedeutet, dass auch die detaillierten RPC-Aufrufe mit Leseberechtigung (`health`/`status`/`system-presence`/`config.get`) erfolgreich waren.
    - `Read probe: limited - missing scope: operator.read` bedeutet, dass die Verbindung erfolgreich war, RPC mit Leseberechtigung jedoch eingeschränkt ist. Dies wird als **beeinträchtigte** Erreichbarkeit gemeldet, nicht als vollständiger Fehlschlag.
    - `Read probe: failed` nach `Connect: ok` bedeutet, dass die WebSocket-Verbindung hergestellt wurde, nachfolgende Lesediagnosen jedoch eine Zeitüberschreitung hatten oder fehlschlugen – ebenfalls **beeinträchtigt**, nicht unerreichbar.
    - Wie `gateway status` verwendet die Prüfung vorhandene zwischengespeicherte Geräteauthentifizierung erneut, erstellt jedoch keine erstmalige Geräteidentität oder keinen Kopplungszustand.
    - Der Beendigungscode ist nur dann von null verschieden, wenn kein geprüftes Ziel erreichbar ist.

  </Accordion>
  <Accordion title="JSON-Ausgabe">
    Oberste Ebene:

    - `ok`: Mindestens ein Ziel ist erreichbar.
    - `degraded`: Mindestens ein Ziel hat eine Verbindung akzeptiert, aber die vollständige detaillierte RPC-Diagnose nicht abgeschlossen.
    - `capability`: Beste bei den erreichbaren Zielen festgestellte Fähigkeit (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` oder `unknown`).
    - `primaryTargetId`: Bestes Ziel, das als aktiver Gewinner behandelt werden soll, in dieser Reihenfolge: explizite URL, SSH-Tunnel, konfigurierte Gegenstelle, lokales Loopback.
    - `warnings[]`: Nach bestem Bemühen erstellte Warnungsdatensätze mit `code`, `message` und optional `targetIds`.
    - `network`: Hinweise zu lokalen Loopback-/Tailnet-URLs, die aus der aktuellen Konfiguration und der Hostnetzwerkumgebung abgeleitet werden.
    - `discovery.timeoutMs` / `discovery.count`: Das tatsächlich für diesen Prüfdurchlauf verwendete Erkennungsbudget bzw. die Ergebnisanzahl.

    Pro Ziel (`targets[].connect`): `ok` (Erreichbarkeit + Klassifizierung der Beeinträchtigung), `rpcOk` (vollständiger Erfolg der detaillierten RPC-Diagnose), `scopeLimited` (detailliertes RPC aufgrund fehlender Operator-Berechtigung fehlgeschlagen).

    Pro Ziel (`targets[].auth`): In `hello-ok` gemeldete `role` und `scopes`, sofern verfügbar, sowie die angezeigte `capability`-Klassifizierung.

  </Accordion>
  <Accordion title="Häufige Warncodes">
    - `ssh_tunnel_failed`: Die Einrichtung des SSH-Tunnels ist fehlgeschlagen; der Befehl ist auf direkte Prüfungen zurückgefallen.
    - `multiple_gateways`: Unterschiedliche Gateway-Identitäten waren erreichbar oder OpenClaw konnte nicht nachweisen, dass die erreichbaren Ziele dasselbe Gateway sind. Ein SSH-Tunnel, eine Proxy-URL oder eine konfigurierte Gegenstellen-URL zum selben Gateway löst dies nicht aus.
    - `auth_secretref_unresolved`: Eine konfigurierte Authentifizierungs-SecretRef konnte für ein fehlgeschlagenes Ziel nicht aufgelöst werden.
    - `probe_scope_limited`: Die WebSocket-Verbindung war erfolgreich, aber die Leseprüfung wurde durch das fehlende `operator.read` eingeschränkt.
    - `local_tls_runtime_unavailable`: Lokales Gateway-TLS ist aktiviert, aber OpenClaw konnte den Fingerabdruck des lokalen Zertifikats nicht laden.

  </Accordion>
</AccordionGroup>

#### Gegenstelle über SSH (entspricht der Mac-App)

Der Modus „Remote over SSH“ der macOS-App verwendet eine lokale Portweiterleitung, sodass ein ausschließlich über Loopback zugängliches entferntes Gateway unter `ws://127.0.0.1:<port>` erreichbar wird.

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
  Den ersten erkannten Gateway-Host aus dem aufgelösten Erkennungsendpunkt als SSH-Ziel auswählen (`local.` sowie gegebenenfalls die konfigurierte WAN-Domain). Reine TXT-Hinweise werden ignoriert.
</ParamField>

Optionale Konfigurationsstandardwerte: `gateway.remote.sshTarget`, `gateway.remote.sshIdentity`.

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
  Gateway-WebSocket-URL.
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
  Hauptsächlich für RPCs im Agentenstil, die vor einer abschließenden Nutzlast Zwischenereignisse streamen.
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

Verwenden Sie `--wrapper`, wenn der verwaltete Dienst über eine andere ausführbare Datei gestartet werden muss, beispielsweise einen Shim für die Geheimnisverwaltung oder ein Hilfsprogramm zur Ausführung unter einer anderen Identität. Der Wrapper erhält die normalen Gateway-Argumente und ist dafür verantwortlich, schließlich `openclaw` oder Node mit diesen Argumenten auszuführen.

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
    - `gateway install`: `--port`, `--runtime <node|bun>` (Standard: `node`), `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start`: `--json`
    - `gateway stop`: `--disable`, `--json`

  </Accordion>
  <Accordion title="Lebenszyklusverhalten">
    - Verwenden Sie `gateway restart`, um einen verwalteten Dienst neu zu starten. Verketten Sie nicht `gateway stop` und `gateway start` als Ersatz für einen Neustart.
    - Unter macOS verwendet `gateway stop` standardmäßig `launchctl bootout`. Dadurch wird der LaunchAgent aus der aktuellen Startsitzung entfernt, ohne eine Deaktivierung dauerhaft zu speichern — die automatische KeepAlive-Wiederherstellung bleibt bei zukünftigen Abstürzen aktiv, und `gateway start` aktiviert den Dienst wieder ordnungsgemäß, ohne dass `launchctl enable` manuell ausgeführt werden muss. Übergeben Sie `--disable`, um KeepAlive und RunAtLoad dauerhaft zu unterdrücken, sodass der Gateway erst nach dem nächsten expliziten `gateway start` erneut gestartet wird; verwenden Sie dies, wenn ein manuelles Beenden Neustarts des Systems überdauern soll.
    - Lebenszyklusbefehle akzeptieren `--json` für die Skripterstellung.

  </Accordion>
  <Accordion title="Authentifizierung und SecretRefs zum Installationszeitpunkt">
    - Wenn die Token-Authentifizierung ein Token erfordert und `gateway.auth.token` über SecretRef verwaltet wird, prüft `gateway install`, ob die SecretRef aufgelöst werden kann, speichert das aufgelöste Token jedoch nicht in den Umgebungsmetadaten des Dienstes.
    - Wenn die Token-Authentifizierung ein Token erfordert und die konfigurierte Token-SecretRef nicht aufgelöst werden kann, schlägt die Installation sicher fehl, anstatt ersatzweise Klartext zu speichern.
    - Bevorzugen Sie für die Passwortauthentifizierung bei `gateway run` `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` oder ein SecretRef-gestütztes `gateway.auth.password` gegenüber einem direkt angegebenen `--password`.
    - Im abgeleiteten Authentifizierungsmodus lockert ein nur in der Shell gesetztes `OPENCLAW_GATEWAY_PASSWORD` die Token-Anforderungen der Installation nicht; verwenden Sie beim Installieren eines verwalteten Dienstes eine dauerhafte Konfiguration (`gateway.auth.password` oder `env` in der Konfiguration).
    - Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht festgelegt ist, wird die Installation blockiert, bis der Modus explizit festgelegt wurde.

  </Accordion>
</AccordionGroup>

## Gateways erkennen (Bonjour)

`gateway discover` sucht nach Gateway-Beacons (`_openclaw-gw._tcp`).

- Multicast-DNS-SD: `local.`
- Unicast-DNS-SD (Bonjour für Weitverkehrsnetze): Wählen Sie eine Domain (Beispiel: `openclaw.internal.`) und richten Sie Split-DNS sowie einen DNS-Server ein; siehe [Bonjour](/de/gateway/bonjour).

Nur Gateways mit aktivierter Bonjour-Erkennung (Standard) kündigen den Beacon an.

TXT-Hinweise in jedem Beacon: `role` (Hinweis zur Gateway-Rolle), `transport` (Hinweis zum Transport, z. B. `gateway`), `gatewayPort` (WebSocket-Port, normalerweise `18789`), `tailnetDns` (MagicDNS-Hostname, sofern verfügbar), `gatewayTls` / `gatewayTlsSha256` (TLS aktiviert + Zertifikat-Fingerabdruck). `sshPort` und `cliPath` werden nur im vollständigen Erkennungsmodus veröffentlicht (`discovery.mdns.mode: "full"`; Standard ist `"minimal"`, wodurch sie ausgelassen werden — Clients verwenden dann standardmäßig Port `22` für SSH-Ziele).

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Zeitüberschreitung pro Befehl (Suchen/Auflösen).
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
- Durchsucht `local.` sowie die konfigurierte Weitverkehrs-Domain, wenn eine aktiviert ist.
- `wsUrl` in der JSON-Ausgabe wird aus dem aufgelösten Dienstendpunkt abgeleitet, nicht aus reinen TXT-Hinweisen wie `lanHost` oder `tailnetDns`.
- `discovery.mdns.mode` steuert die Veröffentlichung von `sshPort`/`cliPath` sowohl für `local.`-mDNS als auch für Weitverkehrs-DNS-SD (siehe oben).

</Note>

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Gateway-Betriebshandbuch](/de/gateway)
