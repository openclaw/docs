---
read_when:
    - Hintergrundjobs oder Weckvorgänge planen
    - Externe Trigger (Webhooks, Gmail) in OpenClaw einbinden
    - Zwischen Heartbeat und Cron für geplante Aufgaben entscheiden
sidebarTitle: Scheduled tasks
summary: Geplante Jobs, Webhooks und Gmail-PubSub-Trigger für den Gateway-Scheduler
title: Geplante Aufgaben
x-i18n:
    generated_at: "2026-05-10T19:21:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: b837fc5c4cd2647bdab98b0421d2f89a528164c8eb93e7851428c73f8f59dccb
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron ist der integrierte Scheduler des Gateway. Er persistiert Jobs, weckt den Agent zum richtigen Zeitpunkt und kann Ausgaben an einen Chat-Kanal oder Webhook-Endpunkt zurückliefern.

## Schnellstart

<Steps>
  <Step title="Einmalige Erinnerung hinzufügen">
    ```bash
    openclaw cron add \
      --name "Reminder" \
      --at "2026-02-01T16:00:00Z" \
      --session main \
      --system-event "Reminder: check the cron docs draft" \
      --wake now \
      --delete-after-run
    ```
  </Step>
  <Step title="Ihre Jobs prüfen">
    ```bash
    openclaw cron list
    openclaw cron show <job-id>
    ```
  </Step>
  <Step title="Ausführungsverlauf anzeigen">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## Funktionsweise von Cron

- Cron läuft **innerhalb des Gateway**-Prozesses (nicht innerhalb des Modells).
- Job-Definitionen werden unter `~/.openclaw/cron/jobs.json` persistiert, damit Zeitpläne bei Neustarts nicht verloren gehen.
- Der Ausführungszustand zur Laufzeit wird daneben in `~/.openclaw/cron/jobs-state.json` persistiert. Wenn Sie Cron-Definitionen in git nachverfolgen, verfolgen Sie `jobs.json` und nehmen Sie `jobs-state.json` in gitignore auf.
- Nach der Aufteilung können ältere OpenClaw-Versionen `jobs.json` lesen, behandeln Jobs aber möglicherweise als neu, weil Laufzeitfelder jetzt in `jobs-state.json` liegen.
- Wenn `jobs.json` bearbeitet wird, während der Gateway läuft oder gestoppt ist, vergleicht OpenClaw die geänderten Zeitplanfelder mit ausstehenden Laufzeit-Slot-Metadaten und löscht veraltete `nextRunAtMs`-Werte. Reine Formatierungsänderungen oder Umschreibungen, die nur die Schlüsselreihenfolge betreffen, behalten den ausstehenden Slot bei.
- Alle Cron-Ausführungen erzeugen Datensätze für [Hintergrundaufgaben](/de/automation/tasks).
- Beim Start des Gateway werden überfällige isolierte Agent-Turn-Jobs außerhalb des Kanalverbindungsfensters neu geplant, statt sofort erneut abgespielt zu werden, damit Discord-/Telegram-Start und Einrichtung nativer Befehle nach Neustarts reaktionsfähig bleiben.
- Einmalige Jobs (`--at`) werden nach erfolgreicher Ausführung standardmäßig automatisch gelöscht.
- Isolierte Cron-Ausführungen schließen nach bestem Aufwand nachverfolgte Browser-Tabs/-Prozesse für ihre `cron:<jobId>`-Sitzung, wenn die Ausführung abgeschlossen ist, damit losgelöste Browser-Automatisierung keine verwaisten Prozesse zurücklässt.
- Isolierte Cron-Ausführungen, die die eng gefasste Cron-Selbstbereinigungsberechtigung erhalten, können weiterhin den Scheduler-Status, eine selbst gefilterte Liste ihres aktuellen Jobs und den Ausführungsverlauf dieses Jobs lesen, damit Status-/Heartbeat-Prüfungen ihren eigenen Zeitplan prüfen können, ohne breiteren Zugriff zur Cron-Mutation zu erhalten.
- Isolierte Cron-Ausführungen schützen außerdem vor veralteten Bestätigungsantworten. Wenn das erste Ergebnis nur eine vorläufige Statusaktualisierung ist (`on it`, `pulling everything together` und ähnliche Hinweise) und kein nachgelagerter Subagent-Run weiterhin für die endgültige Antwort verantwortlich ist, fordert OpenClaw vor der Zustellung einmal erneut das tatsächliche Ergebnis an.
- Isolierte Cron-Ausführungen bevorzugen strukturierte Metadaten zu Ausführungsverweigerungen aus dem eingebetteten Run und greifen dann auf bekannte finale Zusammenfassungs-/Ausgabemarkierungen wie `SYSTEM_RUN_DENIED` und `INVALID_REQUEST` zurück, damit ein blockierter Befehl nicht als erfolgreicher Run gemeldet wird.
- Isolierte Cron-Ausführungen behandeln außerdem Agent-Fehler auf Run-Ebene als Job-Fehler, auch wenn keine Antwortnutzlast erzeugt wird, damit Modell-/Provider-Fehler Fehlerzähler erhöhen und Fehlerbenachrichtigungen auslösen, statt den Job als erfolgreich abzuschließen.
- Wenn ein isolierter Agent-Turn-Job `timeoutSeconds` erreicht, bricht Cron den zugrunde liegenden Agent-Run ab und gibt ihm ein kurzes Bereinigungsfenster. Wenn der Run nicht ausläuft, erzwingt die Gateway-eigene Bereinigung die Freigabe der Sitzungszuordnung dieses Runs, bevor Cron das Timeout protokolliert, damit wartende Chat-Arbeit nicht hinter einer veralteten Verarbeitungssitzung zurückbleibt.
- Wenn ein isolierter Agent-Turn vor dem Start des Runners oder vor dem ersten Modellaufruf hängen bleibt, protokolliert Cron ein phasenspezifisches Timeout wie `setup timed out before runner start` oder `stalled before first model call (last phase: context-engine)`. Diese Watchdogs decken eingebettete Provider und CLI-gestützte Provider ab, bevor deren externer CLI-Prozess tatsächlich gestartet wird, und werden unabhängig von langen `timeoutSeconds`-Werten begrenzt, damit Kaltstart-/Auth-/Kontextfehler schnell sichtbar werden, statt auf das vollständige Job-Budget zu warten.

<a id="maintenance"></a>

<Note>
Aufgabenabgleich für Cron ist zuerst laufzeiteigen und erst danach durch dauerhaften Verlauf gestützt: Eine aktive Cron-Aufgabe bleibt live, solange die Cron-Laufzeit diesen Job noch als laufend nachverfolgt, selbst wenn noch eine alte untergeordnete Sitzungszeile existiert. Sobald die Laufzeit den Job nicht mehr besitzt und das 5-minütige Kulanzfenster abläuft, prüfen Wartungschecks persistierte Run-Protokolle und den Job-Zustand für den passenden `cron:<jobId>:<startedAt>`-Run. Wenn dieser dauerhafte Verlauf ein terminales Ergebnis zeigt, wird das Aufgaben-Ledger daraus finalisiert; andernfalls kann die Gateway-eigene Wartung die Aufgabe als `lost` markieren. Offline-CLI-Audit kann aus dem dauerhaften Verlauf wiederherstellen, behandelt aber seine eigene leere prozessinterne Menge aktiver Jobs nicht als Beweis dafür, dass ein Gateway-eigener Cron-Run verschwunden ist.
</Note>

## Zeitplantypen

| Art     | CLI-Flag  | Beschreibung                                             |
| ------- | --------- | -------------------------------------------------------- |
| `at`    | `--at`    | Einmaliger Zeitstempel (ISO 8601 oder relativ wie `20m`) |
| `every` | `--every` | Festes Intervall                                         |
| `cron`  | `--cron`  | 5- oder 6-Feld-Cron-Ausdruck mit optionalem `--tz`        |

Zeitstempel ohne Zeitzone werden als UTC behandelt. Fügen Sie `--tz America/New_York` für lokale Wall-Clock-Planung hinzu.

Wiederkehrende Ausdrücke zur vollen Stunde werden automatisch um bis zu 5 Minuten gestaffelt, um Lastspitzen zu reduzieren. Verwenden Sie `--exact`, um präzises Timing zu erzwingen, oder `--stagger 30s` für ein explizites Fenster.

### Tag des Monats und Wochentag verwenden ODER-Logik

Cron-Ausdrücke werden von [croner](https://github.com/Hexagon/croner) geparst. Wenn sowohl das Feld für den Tag des Monats als auch das Feld für den Wochentag keine Wildcards sind, trifft croner zu, wenn **eines** der Felder übereinstimmt, nicht beide. Dies ist das Standardverhalten von Vixie cron.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Dies wird etwa 5- bis 6-mal pro Monat ausgelöst statt 0- bis 1-mal pro Monat. OpenClaw verwendet hier Croners standardmäßiges ODER-Verhalten. Um beide Bedingungen zu verlangen, verwenden Sie Croners `+`-Wochentagsmodifikator (`0 9 15 * +1`) oder planen Sie nach einem Feld und prüfen Sie das andere im Prompt oder Befehl Ihres Jobs.

## Ausführungsarten

| Art              | `--session`-Wert   | Läuft in                 | Am besten für                               |
| ---------------- | ------------------ | ------------------------ | ------------------------------------------ |
| Hauptsitzung     | `main`             | Nächster Heartbeat-Turn  | Erinnerungen, Systemereignisse             |
| Isoliert         | `isolated`         | Dediziertes `cron:<jobId>` | Berichte, Hintergrundarbeiten              |
| Aktuelle Sitzung | `current`          | Bei Erstellung gebunden  | Kontextbewusste wiederkehrende Arbeit      |
| Eigene Sitzung   | `session:custom-id` | Persistente benannte Sitzung | Workflows, die auf Verlauf aufbauen    |

<AccordionGroup>
  <Accordion title="Hauptsitzung vs. isoliert vs. eigene Sitzung">
    Jobs in der **Hauptsitzung** stellen ein Systemereignis in die Warteschlange und wecken optional den Heartbeat (`--wake now` oder `--wake next-heartbeat`). Diese Systemereignisse verlängern die Aktualität für tägliche/Idle-Resets der Zielsitzung nicht. **Isolierte** Jobs führen einen dedizierten Agent-Turn mit einer frischen Sitzung aus. **Eigene Sitzungen** (`session:xxx`) persistieren Kontext über Ausführungen hinweg und ermöglichen Workflows wie tägliche Standups, die auf vorherigen Zusammenfassungen aufbauen.
  </Accordion>
  <Accordion title="Was „frische Sitzung“ für isolierte Jobs bedeutet">
    Für isolierte Jobs bedeutet „frische Sitzung“ eine neue Transcript-/Sitzungs-ID für jede Ausführung. OpenClaw kann sichere Präferenzen wie thinking-/fast-/verbose-Einstellungen, Labels und explizit vom Benutzer ausgewählte Modell-/Auth-Overrides übernehmen, erbt aber keinen umgebenden Gesprächskontext aus einer älteren Cron-Zeile: Kanal-/Gruppen-Routing, Sende- oder Warteschlangenrichtlinie, Elevation, Ursprung oder ACP-Laufzeitbindung. Verwenden Sie `current` oder `session:<id>`, wenn ein wiederkehrender Job bewusst auf demselben Gesprächskontext aufbauen soll.
  </Accordion>
  <Accordion title="Laufzeitbereinigung">
    Für isolierte Jobs umfasst der Laufzeit-Teardown jetzt die Browser-Bereinigung nach bestem Aufwand für diese Cron-Sitzung. Bereinigungsfehler werden ignoriert, damit weiterhin das tatsächliche Cron-Ergebnis maßgeblich bleibt.

    Isolierte Cron-Ausführungen entsorgen außerdem alle gebündelten MCP-Laufzeitinstanzen, die für den Job erstellt wurden, über den gemeinsamen Laufzeitbereinigungspfad. Dies entspricht der Art, wie MCP-Clients für Hauptsitzungen und eigene Sitzungen heruntergefahren werden, damit isolierte Cron-Jobs keine stdio-Kindprozesse oder langlebigen MCP-Verbindungen über Ausführungen hinweg verlieren.

  </Accordion>
  <Accordion title="Subagent- und Discord-Zustellung">
    Wenn isolierte Cron-Ausführungen Subagents orchestrieren, bevorzugt die Zustellung ebenfalls die finale Ausgabe des Nachkommen gegenüber veraltetem vorläufigem Eltertext. Wenn Nachkommen noch laufen, unterdrückt OpenClaw diese teilweise Elternaktualisierung, statt sie anzukündigen.

    Für reine Text-Discord-Ankündigungsziele sendet OpenClaw den kanonischen finalen Assistententext einmal, statt sowohl gestreamte/zwischenzeitliche Textnutzlasten als auch die finale Antwort erneut abzuspielen. Medien und strukturierte Discord-Nutzlasten werden weiterhin als separate Nutzlasten zugestellt, damit Anhänge und Komponenten nicht verworfen werden.

  </Accordion>
</AccordionGroup>

### Nutzlastoptionen für isolierte Jobs

<ParamField path="--message" type="string" required>
  Prompt-Text (für isoliert erforderlich).
</ParamField>
<ParamField path="--model" type="string">
  Modell-Override; verwendet das ausgewählte zulässige Modell für den Job.
</ParamField>
<ParamField path="--thinking" type="string">
  Thinking-Level-Override.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Workspace-Bootstrap-Dateiinjektion überspringen.
</ParamField>
<ParamField path="--tools" type="string">
  Einschränken, welche Tools der Job verwenden darf, zum Beispiel `--tools exec,read`.
</ParamField>

`--model` verwendet das ausgewählte zulässige Modell als primäres Modell dieses Jobs. Es ist nicht dasselbe wie ein `/model`-Override einer Chat-Sitzung: Konfigurierte Fallback-Ketten gelten weiterhin, wenn das primäre Job-Modell fehlschlägt. Wenn das angeforderte Modell nicht zulässig ist oder nicht aufgelöst werden kann, lässt Cron den Run mit einem expliziten Validierungsfehler fehlschlagen, statt stillschweigend auf die Agent-/Standardmodellauswahl des Jobs zurückzufallen.

Cron-Jobs können außerdem `fallbacks` auf Nutzlastebene enthalten. Wenn vorhanden, ersetzt diese Liste die konfigurierte Fallback-Kette für den Job. Verwenden Sie `fallbacks: []` in der Job-Nutzlast/API, wenn Sie einen strikten Cron-Run möchten, der nur das ausgewählte Modell versucht. Wenn ein Job `--model` hat, aber weder Nutzlast- noch konfigurierte Fallbacks, übergibt OpenClaw einen expliziten leeren Fallback-Override, damit das primäre Agent-Modell nicht als verborgenes zusätzliches Wiederholungsziel angehängt wird.

Priorität der Modellauswahl für isolierte Jobs:

1. Gmail-Hook-Modell-Override (wenn der Run von Gmail stammt und dieser Override zulässig ist)
2. `model` pro Job-Nutzlast
3. Vom Benutzer ausgewählter gespeicherter Cron-Sitzungsmodell-Override
4. Agent-/Standardmodellauswahl

Der Fast-Modus folgt ebenfalls der aufgelösten Live-Auswahl. Wenn die ausgewählte Modellkonfiguration `params.fastMode` hat, verwendet isoliertes Cron dies standardmäßig. Ein gespeicherter Sitzungs-`fastMode`-Override hat weiterhin Vorrang vor der Konfiguration in beide Richtungen.

Wenn eine isolierte Ausführung auf eine Live-Modellwechsel-Übergabe trifft, versucht Cron es erneut mit dem gewechselten Provider/Modell und persistiert diese Live-Auswahl für den aktiven Run, bevor es erneut versucht. Wenn der Wechsel auch ein neues Auth-Profil mitbringt, persistiert Cron auch diesen Auth-Profil-Override für den aktiven Run. Wiederholungen sind begrenzt: Nach dem ersten Versuch plus 2 Wechsel-Wiederholungen bricht Cron ab, statt endlos zu schleifen.

Bevor ein isolierter Cron-Lauf in den Agent-Runner eintritt, prüft OpenClaw erreichbare lokale Provider-Endpunkte für konfigurierte Provider mit `api: "ollama"` und `api: "openai-completions"`, deren `baseUrl` Loopback, privates Netzwerk oder `.local` ist. Wenn dieser Endpunkt nicht verfügbar ist, wird der Lauf als `skipped` mit einem klaren Provider-/Modellfehler aufgezeichnet, statt einen Modellaufruf zu starten. Das Endpunktergebnis wird 5 Minuten lang zwischengespeichert, sodass viele fällige Jobs, die denselben nicht erreichbaren lokalen Ollama-, vLLM-, SGLang- oder LM Studio-Server verwenden, eine kleine gemeinsame Prüfung nutzen, statt eine Anfragelawine zu erzeugen. Übersprungene Provider-Preflight-Läufe erhöhen das Backoff für Ausführungsfehler nicht; aktivieren Sie `failureAlert.includeSkipped`, wenn Sie wiederholte Benachrichtigungen über Überspringungen wünschen.

## Zustellung und Ausgabe

| Modus      | Was passiert                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | Fallback-Zustellung des finalen Texts an das Ziel, wenn der Agent nicht gesendet hat |
| `webhook`  | POST der abgeschlossenen Ereignis-Payload an eine URL               |
| `none`     | Keine Fallback-Zustellung durch den Runner                          |

Verwenden Sie `--announce --channel telegram --to "-1001234567890"` für die Kanalzustellung. Für Telegram-Forenthemen verwenden Sie `-1001234567890:topic:123`; direkte RPC-/Konfigurationsaufrufer können auch `delivery.threadId` als Zeichenfolge oder Zahl übergeben. Slack-/Discord-/Mattermost-Ziele sollten explizite Präfixe verwenden (`channel:<id>`, `user:<id>`). Matrix-Raum-IDs unterscheiden Groß- und Kleinschreibung; verwenden Sie die exakte Raum-ID oder die Form `room:!room:server` aus Matrix.

Wenn die Announce-Zustellung `channel: "last"` verwendet oder `channel` auslässt, kann ein Provider-präfigiertes Ziel wie `telegram:123` den Kanal auswählen, bevor Cron auf den Sitzungsverlauf oder einen einzelnen konfigurierten Kanal zurückfällt. Nur Präfixe, die vom geladenen Plugin beworben werden, sind Provider-Selektoren. Wenn `delivery.channel` explizit ist, muss das Zielpräfix denselben Provider benennen; zum Beispiel wird `channel: "whatsapp"` mit `to: "telegram:123"` abgelehnt, statt WhatsApp die Telegram-ID als Telefonnummer interpretieren zu lassen. Zielart- und Dienstpräfixe wie `channel:<id>`, `user:<id>`, `imessage:<handle>` und `sms:<number>` bleiben kanalbezogene Zielsyntax, keine Provider-Selektoren.

Für isolierte Jobs wird die Chat-Zustellung geteilt. Wenn eine Chat-Route verfügbar ist, kann der Agent das Tool `message` auch dann verwenden, wenn der Job `--no-deliver` nutzt. Wenn der Agent an das konfigurierte/aktuelle Ziel sendet, überspringt OpenClaw die Fallback-Ankündigung. Andernfalls steuern `announce`, `webhook` und `none` nur, was der Runner nach dem Agent-Turn mit der finalen Antwort macht.

Wenn ein Agent aus einem aktiven Chat heraus eine isolierte Erinnerung erstellt, speichert OpenClaw das beibehaltene Live-Zustellungsziel für die Fallback-Announce-Route. Interne Sitzungsschlüssel können kleingeschrieben sein; Provider-Zustellungsziele werden nicht aus diesen Schlüsseln rekonstruiert, wenn aktueller Chat-Kontext verfügbar ist.

Implizite Announce-Zustellung verwendet konfigurierte Kanal-Allowlists, um veraltete Ziele zu validieren und umzuleiten. Genehmigungen aus dem DM-Pairing-Store sind keine Empfänger für Fallback-Automatisierung; setzen Sie `delivery.to` oder konfigurieren Sie den `allowFrom`-Eintrag des Kanals, wenn ein geplanter Job proaktiv an eine DM senden soll.

Fehlerbenachrichtigungen folgen einem separaten Zielpfad:

- `cron.failureDestination` legt einen globalen Standard für Fehlerbenachrichtigungen fest.
- `job.delivery.failureDestination` überschreibt dies pro Job.
- Wenn keines von beiden gesetzt ist und der Job bereits über `announce` zustellt, fallen Fehlerbenachrichtigungen nun auf dieses primäre Announce-Ziel zurück.
- `delivery.failureDestination` wird nur bei Jobs mit `sessionTarget="isolated"` unterstützt, außer der primäre Zustellungsmodus ist `webhook`.
- `failureAlert.includeSkipped: true` nimmt einen Job oder eine globale Cron-Alarmrichtlinie in wiederholte Benachrichtigungen für übersprungene Läufe auf. Übersprungene Läufe behalten einen separaten Zähler für aufeinanderfolgende Überspringungen, sodass sie das Backoff für Ausführungsfehler nicht beeinflussen.

## CLI-Beispiele

<Tabs>
  <Tab title="One-shot reminder">
    ```bash
    openclaw cron add \
      --name "Calendar check" \
      --at "20m" \
      --session main \
      --system-event "Next heartbeat: check calendar." \
      --wake now
    ```
  </Tab>
  <Tab title="Recurring isolated job">
    ```bash
    openclaw cron add \
      --name "Morning brief" \
      --cron "0 7 * * *" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --message "Summarize overnight updates." \
      --announce \
      --channel slack \
      --to "channel:C1234567890"
    ```
  </Tab>
  <Tab title="Model and thinking override">
    ```bash
    openclaw cron add \
      --name "Deep analysis" \
      --cron "0 6 * * 1" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --message "Weekly deep analysis of project progress." \
      --model "opus" \
      --thinking high \
      --announce
    ```
  </Tab>
</Tabs>

## Webhooks

Gateway kann HTTP-Webhook-Endpunkte für externe Trigger bereitstellen. Aktivieren Sie sie in der Konfiguration:

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
  },
}
```

### Authentifizierung

Jede Anfrage muss das Hook-Token per Header enthalten:

- `Authorization: Bearer <token>` (empfohlen)
- `x-openclaw-token: <token>`

Query-String-Tokens werden abgelehnt.

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    Stellt ein Systemereignis für die Hauptsitzung in die Warteschlange:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/wake \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"text":"New email received","mode":"now"}'
    ```

    <ParamField path="text" type="string" required>
      Ereignisbeschreibung.
    </ParamField>
    <ParamField path="mode" type="string" default="now">
      `now` oder `next-heartbeat`.
    </ParamField>

  </Accordion>
  <Accordion title="POST /hooks/agent">
    Führt einen isolierten Agent-Turn aus:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    Felder: `message` (erforderlich), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `fallbacks`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Mapped hooks (POST /hooks/<name>)">
    Benutzerdefinierte Hook-Namen werden über `hooks.mappings` in der Konfiguration aufgelöst. Mappings können beliebige Payloads mit Vorlagen oder Code-Transformationen in `wake`- oder `agent`-Aktionen transformieren.
  </Accordion>
</AccordionGroup>

<Warning>
Halten Sie Hook-Endpunkte hinter Loopback, Tailnet oder einem vertrauenswürdigen Reverse-Proxy.

- Verwenden Sie ein dediziertes Hook-Token; verwenden Sie Gateway-Auth-Tokens nicht wieder.
- Belassen Sie `hooks.path` auf einem dedizierten Unterpfad; `/` wird abgelehnt.
- Setzen Sie `hooks.allowedAgentIds`, um explizites `agentId`-Routing zu begrenzen.
- Belassen Sie `hooks.allowRequestSessionKey=false`, außer Sie benötigen vom Aufrufer ausgewählte Sitzungen.
- Wenn Sie `hooks.allowRequestSessionKey` aktivieren, setzen Sie auch `hooks.allowedSessionKeyPrefixes`, um zulässige Sitzungsschlüsselformen einzugrenzen.
- Hook-Payloads werden standardmäßig mit Sicherheitsgrenzen umschlossen.

</Warning>

## Gmail-PubSub-Integration

Verbinden Sie Gmail-Posteingangstrigger über Google PubSub mit OpenClaw.

<Note>
**Voraussetzungen:** `gcloud`-CLI, `gog` (gogcli), aktivierte OpenClaw-Hooks, Tailscale für den öffentlichen HTTPS-Endpunkt.
</Note>

### Wizard-Einrichtung (empfohlen)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Dies schreibt die `hooks.gmail`-Konfiguration, aktiviert das Gmail-Preset und verwendet Tailscale Funnel für den Push-Endpunkt.

### Automatischer Gateway-Start

Wenn `hooks.enabled=true` und `hooks.gmail.account` gesetzt ist, startet der Gateway beim Booten `gog gmail watch serve` und erneuert die Watch automatisch. Setzen Sie `OPENCLAW_SKIP_GMAIL_WATCHER=1`, um dies zu deaktivieren.

### Manuelle einmalige Einrichtung

<Steps>
  <Step title="Select the GCP project">
    Wählen Sie das GCP-Projekt aus, dem der von `gog` verwendete OAuth-Client gehört:

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="Create topic and grant Gmail push access">
    ```bash
    gcloud pubsub topics create gog-gmail-watch
    gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
      --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
      --role=roles/pubsub.publisher
    ```
  </Step>
  <Step title="Start the watch">
    ```bash
    gog gmail watch start \
      --account openclaw@gmail.com \
      --label INBOX \
      --topic projects/<project-id>/topics/gog-gmail-watch
    ```
  </Step>
</Steps>

### Gmail-Modellüberschreibung

```json5
{
  hooks: {
    gmail: {
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

## Jobs verwalten

```bash
# List all jobs
openclaw cron list

# Show one job, including resolved delivery route
openclaw cron show <jobId>

# Edit a job
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# Force run a job now
openclaw cron run <jobId>

# Run only if due
openclaw cron run <jobId> --due

# View run history
openclaw cron runs --id <jobId> --limit 50

# Delete a job
openclaw cron remove <jobId>

# Agent selection (multi-agent setups)
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops
openclaw cron edit <jobId> --clear-agent
```

<Note>
Hinweis zur Modellüberschreibung:

- `openclaw cron add|edit --model ...` ändert das ausgewählte Modell des Jobs.
- Wenn das Modell erlaubt ist, erreicht genau dieses Provider-/Modellpaar den isolierten Agent-Lauf.
- Wenn es nicht erlaubt ist oder nicht aufgelöst werden kann, schlägt Cron den Lauf mit einem expliziten Validierungsfehler fehl.
- Konfigurierte Fallback-Ketten gelten weiterhin, da Cron `--model` ein Job-Primary ist, keine Sitzungsüberschreibung per `/model`.
- Payload `fallbacks` ersetzt konfigurierte Fallbacks für diesen Job; `fallbacks: []` deaktiviert Fallbacks und macht den Lauf strikt.
- Ein einfaches `--model` ohne explizite oder konfigurierte Fallback-Liste fällt nicht als stilles zusätzliches Wiederholungsziel auf das Agent-Primary zurück.

</Note>

## Konfiguration

```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 1,
    retry: {
      maxAttempts: 3,
      backoffMs: [60000, 120000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "server_error"],
    },
    webhookToken: "replace-with-dedicated-webhook-token",
    sessionRetention: "24h",
    runLog: { maxBytes: "2mb", keepLines: 2000 },
  },
}
```

`maxConcurrentRuns` begrenzt sowohl den geplanten Cron-Dispatch als auch die Ausführung isolierter Agent-Turns. Isolierte Cron-Agent-Turns verwenden intern die dedizierte Ausführungsspur `cron-nested` der Warteschlange. Wenn Sie diesen Wert erhöhen, können unabhängige Cron-LLM-Läufe parallel voranschreiten, statt nur ihre äußeren Cron-Wrapper zu starten. Die gemeinsam genutzte Nicht-Cron-Spur `nested` wird durch diese Einstellung nicht verbreitert.

Der Sidecar für den Laufzeitstatus wird aus `cron.store` abgeleitet: Ein `.json`-Store wie `~/clawd/cron/jobs.json` verwendet `~/clawd/cron/jobs-state.json`, während ein Store-Pfad ohne `.json`-Suffix `-state.json` anhängt.

Wenn Sie `jobs.json` manuell bearbeiten, lassen Sie `jobs-state.json` aus der Versionskontrolle heraus. OpenClaw verwendet diesen Sidecar für ausstehende Slots, aktive Marker, Metadaten zum letzten Lauf und die Planungsidentität, anhand derer der Scheduler erkennt, wann ein extern bearbeiteter Job ein frisches `nextRunAtMs` benötigt.

Cron deaktivieren: `cron.enabled: false` oder `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Retry behavior">
    **Einmalige Wiederholung**: Vorübergehende Fehler (Ratenlimit, Überlastung, Netzwerk, Serverfehler) werden bis zu 3-mal mit exponentiellem Backoff wiederholt. Permanente Fehler deaktivieren sofort.

    **Wiederkehrende Wiederholung**: exponentielles Backoff (30 s bis 60 min) zwischen Wiederholungen. Das Backoff wird nach dem nächsten erfolgreichen Lauf zurückgesetzt.

  </Accordion>
  <Accordion title="Maintenance">
    `cron.sessionRetention` (Standard `24h`) bereinigt isolierte Lauf-Sitzungseinträge. `cron.runLog.maxBytes` / `cron.runLog.keepLines` bereinigen Laufprotokolldateien automatisch.
  </Accordion>
</AccordionGroup>

## Fehlerbehebung

### Befehlsleiter

```bash
openclaw status
openclaw gateway status
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
openclaw doctor
```

<AccordionGroup>
  <Accordion title="Cron wird nicht ausgelöst">
    - Prüfen Sie `cron.enabled` und die Umgebungsvariable `OPENCLAW_SKIP_CRON`.
    - Stellen Sie sicher, dass der Gateway dauerhaft läuft.
    - Prüfen Sie bei `cron`-Zeitplänen die Zeitzone (`--tz`) im Vergleich zur Host-Zeitzone.
    - `reason: not-due` in der Laufausgabe bedeutet, dass ein manueller Lauf mit `openclaw cron run <jobId> --due` geprüft wurde und der Job noch nicht fällig war.

  </Accordion>
  <Accordion title="Cron wurde ausgelöst, aber keine Zustellung">
    - Der Zustellmodus `none` bedeutet, dass kein Fallback-Versand durch den Runner erwartet wird. Der Agent kann weiterhin direkt mit dem Tool `message` senden, wenn eine Chat-Route verfügbar ist.
    - Ein fehlendes/ungültiges Zustellziel (`channel`/`to`) bedeutet, dass ausgehende Nachrichten übersprungen wurden.
    - Bei Matrix können kopierte oder ältere Jobs mit kleingeschriebenen `delivery.to`-Raum-IDs fehlschlagen, da Matrix-Raum-IDs Groß- und Kleinschreibung beachten. Bearbeiten Sie den Job auf den exakten Wert `!room:server` oder `room:!room:server` aus Matrix.
    - Channel-Authentifizierungsfehler (`unauthorized`, `Forbidden`) bedeuten, dass die Zustellung durch Anmeldedaten blockiert wurde.
    - Wenn der isolierte Lauf nur das stille Token (`NO_REPLY` / `no_reply`) zurückgibt, unterdrückt OpenClaw die direkte ausgehende Zustellung und unterdrückt auch den Fallback-Pfad der eingereihten Zusammenfassung, sodass nichts zurück in den Chat gepostet wird.
    - Wenn der Agent selbst eine Nachricht an den Benutzer senden soll, prüfen Sie, ob der Job eine verwendbare Route hat (`channel: "last"` mit einem vorherigen Chat oder einen expliziten Channel/ein explizites Ziel).

  </Accordion>
  <Accordion title="Cron oder Heartbeat scheint /new-style-Rollover zu verhindern">
    - Die Aktualität für tägliche und inaktive Zurücksetzungen basiert nicht auf `updatedAt`; siehe [Sitzungsverwaltung](/de/concepts/session#session-lifecycle).
    - Cron-Weckvorgänge, Heartbeat-Läufe, Exec-Benachrichtigungen und Gateway-Buchhaltung können die Sitzungszeile für Routing/Status aktualisieren, aber sie verlängern weder `sessionStartedAt` noch `lastInteractionAt`.
    - Für ältere Zeilen, die erstellt wurden, bevor diese Felder existierten, kann OpenClaw `sessionStartedAt` aus dem JSONL-Sitzungsheader des Transkripts wiederherstellen, wenn die Datei noch verfügbar ist. Ältere inaktive Zeilen ohne `lastInteractionAt` verwenden diese wiederhergestellte Startzeit als Ausgangspunkt für Inaktivität.

  </Accordion>
  <Accordion title="Fallstricke bei Zeitzonen">
    - Cron ohne `--tz` verwendet die Zeitzone des Gateway-Hosts.
    - `at`-Zeitpläne ohne Zeitzone werden als UTC behandelt.
    - Heartbeat `activeHours` verwendet die konfigurierte Zeitzonenauflösung.

  </Accordion>
</AccordionGroup>

## Verwandte Themen

- [Automatisierung und Aufgaben](/de/automation) — alle Automatisierungsmechanismen auf einen Blick
- [Hintergrundaufgaben](/de/automation/tasks) — Aufgabenbuch für Cron-Ausführungen
- [Heartbeat](/de/gateway/heartbeat) — regelmäßige Turns der Hauptsitzung
- [Zeitzone](/de/concepts/timezone) — Zeitzonenkonfiguration
