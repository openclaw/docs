---
read_when:
    - Hintergrundjobs oder Aufweckvorgänge planen
    - Externe Trigger (Webhooks, Gmail) in OpenClaw einbinden
    - Zwischen Heartbeat und Cron für geplante Aufgaben entscheiden
sidebarTitle: Scheduled tasks
summary: Geplante Jobs, Webhooks und Gmail-PubSub-Trigger für den Gateway-Scheduler
title: Geplante Aufgaben
x-i18n:
    generated_at: "2026-05-02T06:26:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: cdda94c3c31e4530e0944cd8f5667a7eb567fcff8e602d6a86d5699d078e9b48
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron ist der integrierte Scheduler des Gateways. Er persistiert Jobs, weckt den Agent zur richtigen Zeit und kann Ausgaben zurück an einen Chatkanal oder einen Webhook-Endpunkt liefern.

## Schnellstart

<Steps>
  <Step title="Add a one-shot reminder">
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
  <Step title="Check your jobs">
    ```bash
    openclaw cron list
    openclaw cron show <job-id>
    ```
  </Step>
  <Step title="See run history">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## Wie Cron funktioniert

- Cron läuft **innerhalb des Gateway**-Prozesses (nicht innerhalb des Modells).
- Jobdefinitionen werden unter `~/.openclaw/cron/jobs.json` persistiert, sodass Neustarts keine Zeitpläne verlieren.
- Der Laufzeit-Ausführungszustand wird daneben in `~/.openclaw/cron/jobs-state.json` persistiert. Wenn Sie Cron-Definitionen in Git verfolgen, verfolgen Sie `jobs.json` und nehmen Sie `jobs-state.json` in die Gitignore auf.
- Nach der Aufteilung können ältere OpenClaw-Versionen `jobs.json` lesen, behandeln Jobs aber möglicherweise als neu, weil Laufzeitfelder jetzt in `jobs-state.json` liegen.
- Wenn `jobs.json` bearbeitet wird, während das Gateway läuft oder gestoppt ist, vergleicht OpenClaw die geänderten Zeitplanfelder mit ausstehenden Laufzeit-Slot-Metadaten und löscht veraltete `nextRunAtMs`-Werte. Reine Formatierungsänderungen oder Umschreibungen, die nur die Schlüsselreihenfolge ändern, behalten den ausstehenden Slot bei.
- Alle Cron-Ausführungen erstellen [Hintergrundaufgaben](/de/automation/tasks)-Einträge.
- Beim Start des Gateways werden überfällige isolierte Agent-Turn-Jobs außerhalb des Kanalverbindungsfensters neu geplant, statt sofort wiedergegeben zu werden, sodass Discord-/Telegram-Start und die Einrichtung nativer Befehle nach Neustarts reaktionsfähig bleiben.
- Einmalige Jobs (`--at`) werden nach Erfolg standardmäßig automatisch gelöscht.
- Isolierte Cron-Ausführungen schließen nach bestem Aufwand nachverfolgte Browser-Tabs/-Prozesse für ihre `cron:<jobId>`-Sitzung, wenn die Ausführung abgeschlossen ist, sodass abgekoppelte Browser-Automatisierung keine verwaisten Prozesse zurücklässt.
- Isolierte Cron-Ausführungen schützen außerdem vor veralteten Bestätigungsantworten. Wenn das erste Ergebnis nur eine vorläufige Statusaktualisierung ist (`on it`, `pulling everything together` und ähnliche Hinweise) und kein untergeordneter Subagent-Lauf mehr für die endgültige Antwort verantwortlich ist, fordert OpenClaw einmal erneut das tatsächliche Ergebnis an, bevor es zugestellt wird.
- Isolierte Cron-Ausführungen bevorzugen strukturierte Metadaten zu Ausführungsverweigerungen aus dem eingebetteten Lauf und fallen dann auf bekannte finale Zusammenfassungs-/Ausgabemarker wie `SYSTEM_RUN_DENIED` und `INVALID_REQUEST` zurück, sodass ein blockierter Befehl nicht als grüner Lauf gemeldet wird.
- Isolierte Cron-Ausführungen behandeln auch Agent-Fehler auf Laufebene als Jobfehler, selbst wenn keine Antwortnutzlast erzeugt wird, sodass Modell-/Provider-Fehler Fehlerzähler erhöhen und Fehlerbenachrichtigungen auslösen, statt den Job als erfolgreich abzuschließen.
- Wenn ein isolierter Agent-Turn-Job `timeoutSeconds` erreicht, bricht Cron den zugrunde liegenden Agent-Lauf ab und gibt ihm ein kurzes Bereinigungsfenster. Wenn der Lauf nicht ausläuft, löscht Gateway-eigene Bereinigung die Sitzungszuständigkeit dieses Laufs zwangsweise, bevor Cron die Zeitüberschreitung aufzeichnet, sodass eingereihte Chatarbeit nicht hinter einer veralteten Verarbeitungssitzung zurückbleibt.

<a id="maintenance"></a>

<Note>
Die Aufgabenabstimmung für Cron ist zuerst laufzeiteigen und danach durch dauerhafte Historie abgesichert: Eine aktive Cron-Aufgabe bleibt aktiv, solange die Cron-Laufzeit diesen Job noch als laufend nachverfolgt, selbst wenn noch eine alte untergeordnete Sitzungszeile existiert. Sobald die Laufzeit den Job nicht mehr besitzt und das 5-Minuten-Nachfristfenster abläuft, prüft die Wartung persistierte Laufprotokolle und den Jobzustand für den passenden `cron:<jobId>:<startedAt>`-Lauf. Wenn diese dauerhafte Historie ein finales Ergebnis zeigt, wird das Aufgabenbuch daraus finalisiert; andernfalls kann Gateway-eigene Wartung die Aufgabe als `lost` markieren. Offline-CLI-Audit kann aus dauerhafter Historie wiederherstellen, behandelt aber seine eigene leere aktive Jobmenge im Prozess nicht als Nachweis dafür, dass ein Gateway-eigener Cron-Lauf verschwunden ist.
</Note>

## Zeitplantypen

| Art     | CLI-Flag  | Beschreibung                                                   |
| ------- | --------- | -------------------------------------------------------------- |
| `at`    | `--at`    | Einmaliger Zeitstempel (ISO 8601 oder relativ wie `20m`)       |
| `every` | `--every` | Festes Intervall                                               |
| `cron`  | `--cron`  | Cron-Ausdruck mit 5 oder 6 Feldern und optionalem `--tz`       |

Zeitstempel ohne Zeitzone werden als UTC behandelt. Fügen Sie `--tz America/New_York` für lokale Wall-Clock-Planung hinzu.

Wiederkehrende Ausdrücke zur vollen Stunde werden automatisch um bis zu 5 Minuten gestaffelt, um Lastspitzen zu reduzieren. Verwenden Sie `--exact`, um präzises Timing zu erzwingen, oder `--stagger 30s` für ein explizites Fenster.

### Tag-des-Monats und Tag-der-Woche verwenden OR-Logik

Cron-Ausdrücke werden von [croner](https://github.com/Hexagon/croner) geparst. Wenn sowohl das Tag-des-Monats- als auch das Tag-der-Woche-Feld keine Wildcards sind, stimmt croner überein, wenn **eines von beiden** Feldern übereinstimmt, nicht beide. Dies ist standardmäßiges Vixie-Cron-Verhalten.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Dies wird etwa 5- bis 6-mal pro Monat ausgelöst statt 0- bis 1-mal pro Monat. OpenClaw verwendet hier Croners standardmäßiges OR-Verhalten. Um beide Bedingungen zu verlangen, verwenden Sie Croners `+`-Tag-der-Woche-Modifikator (`0 9 15 * +1`) oder planen Sie auf einem Feld und prüfen Sie das andere im Prompt oder Befehl Ihres Jobs.

## Ausführungsstile

| Stil                | `--session`-Wert    | Wird ausgeführt in      | Am besten geeignet für                         |
| ------------------- | ------------------- | ----------------------- | ---------------------------------------------- |
| Hauptsitzung        | `main`              | Nächster Heartbeat-Turn | Erinnerungen, Systemereignisse                 |
| Isoliert            | `isolated`          | Dediziertes `cron:<jobId>` | Berichte, Hintergrundarbeiten               |
| Aktuelle Sitzung    | `current`           | Bei Erstellung gebunden | Kontextabhängige wiederkehrende Arbeit         |
| Benutzerdefinierte Sitzung | `session:custom-id` | Persistente benannte Sitzung | Workflows, die auf Historie aufbauen |

<AccordionGroup>
  <Accordion title="Main session vs isolated vs custom">
    **Hauptsitzungs**-Jobs reihen ein Systemereignis ein und wecken optional den Heartbeat (`--wake now` oder `--wake next-heartbeat`). Diese Systemereignisse verlängern die Frische für tägliche/inaktive Zurücksetzung der Zielsitzung nicht. **Isolierte** Jobs führen einen dedizierten Agent-Turn mit einer frischen Sitzung aus. **Benutzerdefinierte Sitzungen** (`session:xxx`) persistieren Kontext über Läufe hinweg und ermöglichen Workflows wie tägliche Standups, die auf vorherigen Zusammenfassungen aufbauen.
  </Accordion>
  <Accordion title="What 'fresh session' means for isolated jobs">
    Für isolierte Jobs bedeutet „frische Sitzung“ eine neue Transkript-/Sitzungs-ID für jeden Lauf. OpenClaw kann sichere Einstellungen wie Thinking-/Fast-/Verbose-Einstellungen, Labels und explizit vom Benutzer ausgewählte Modell-/Auth-Überschreibungen übernehmen, erbt aber keinen umgebenden Konversationskontext aus einer älteren Cron-Zeile: Kanal-/Gruppenrouting, Sende- oder Warteschlangenrichtlinie, Elevation, Ursprung oder ACP-Laufzeitbindung. Verwenden Sie `current` oder `session:<id>`, wenn ein wiederkehrender Job absichtlich auf demselben Konversationskontext aufbauen soll.
  </Accordion>
  <Accordion title="Runtime cleanup">
    Für isolierte Jobs umfasst das Laufzeit-Teardown jetzt Browser-Bereinigung nach bestem Aufwand für diese Cron-Sitzung. Bereinigungsfehler werden ignoriert, sodass weiterhin das tatsächliche Cron-Ergebnis maßgeblich bleibt.

    Isolierte Cron-Ausführungen entsorgen außerdem alle gebündelten MCP-Laufzeitinstanzen, die für den Job über den gemeinsamen Laufzeit-Bereinigungspfad erstellt wurden. Dies entspricht dem Abbau von MCP-Clients für Hauptsitzungen und benutzerdefinierte Sitzungen, sodass isolierte Cron-Jobs keine stdio-Kindprozesse oder langlebigen MCP-Verbindungen über Läufe hinweg leaken.

  </Accordion>
  <Accordion title="Subagent and Discord delivery">
    Wenn isolierte Cron-Ausführungen Subagents orchestrieren, bevorzugt die Zustellung außerdem die endgültige untergeordnete Ausgabe gegenüber veraltetem vorläufigem Elterntext. Wenn untergeordnete Läufe noch laufen, unterdrückt OpenClaw diese teilweise Elternaktualisierung, statt sie anzukündigen.

    Für reine Text-Discord-Ankündigungsziele sendet OpenClaw den kanonischen finalen Assistententext einmal, statt sowohl gestreamte/zwischenzeitliche Textnutzlasten als auch die finale Antwort erneut abzuspielen. Medien und strukturierte Discord-Nutzlasten werden weiterhin als separate Nutzlasten zugestellt, damit Anhänge und Komponenten nicht verworfen werden.

  </Accordion>
</AccordionGroup>

### Nutzlastoptionen für isolierte Jobs

<ParamField path="--message" type="string" required>
  Prompt-Text (für isolierte Jobs erforderlich).
</ParamField>
<ParamField path="--model" type="string">
  Modellüberschreibung; verwendet das ausgewählte erlaubte Modell für den Job.
</ParamField>
<ParamField path="--thinking" type="string">
  Überschreibung des Thinking-Levels.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Überspringt die Injektion der Workspace-Bootstrap-Datei.
</ParamField>
<ParamField path="--tools" type="string">
  Beschränkt, welche Tools der Job verwenden kann, zum Beispiel `--tools exec,read`.
</ParamField>

`--model` verwendet das ausgewählte erlaubte Modell als primäres Modell dieses Jobs. Es ist nicht dasselbe wie eine Chat-Sitzungsüberschreibung per `/model`: konfigurierte Fallback-Ketten gelten weiterhin, wenn das primäre Modell des Jobs fehlschlägt. Wenn das angeforderte Modell nicht erlaubt ist oder nicht aufgelöst werden kann, schlägt Cron den Lauf mit einem expliziten Validierungsfehler fehl, statt stillschweigend auf die Agent-/Standardmodellauswahl des Jobs zurückzufallen.

Cron-Jobs können auch `fallbacks` auf Nutzlastebene tragen. Wenn vorhanden, ersetzt diese Liste die konfigurierte Fallback-Kette für den Job. Verwenden Sie `fallbacks: []` in der Job-Nutzlast/API, wenn Sie einen strikten Cron-Lauf möchten, der nur das ausgewählte Modell versucht. Wenn ein Job `--model`, aber weder Nutzlast- noch konfigurierte Fallbacks hat, übergibt OpenClaw eine explizite leere Fallback-Überschreibung, damit das primäre Agent-Modell nicht als verstecktes zusätzliches Wiederholungsziel angehängt wird.

Die Modell-Auswahlpriorität für isolierte Jobs ist:

1. Gmail-Hook-Modellüberschreibung (wenn der Lauf von Gmail kam und diese Überschreibung erlaubt ist)
2. Pro-Job-Nutzlast `model`
3. Vom Benutzer ausgewählte gespeicherte Cron-Sitzungsmodellüberschreibung
4. Agent-/Standardmodellauswahl

Fast Mode folgt ebenfalls der aufgelösten Live-Auswahl. Wenn die ausgewählte Modellkonfiguration `params.fastMode` hat, verwendet isolierter Cron dies standardmäßig. Eine gespeicherte Sitzungsüberschreibung `fastMode` gewinnt weiterhin in beide Richtungen gegenüber der Konfiguration.

Wenn ein isolierter Lauf auf eine Live-Modellwechsel-Übergabe trifft, versucht Cron es mit dem gewechselten Provider/Modell erneut und persistiert diese Live-Auswahl vor dem erneuten Versuch für den aktiven Lauf. Wenn der Wechsel auch ein neues Auth-Profil enthält, persistiert Cron diese Auth-Profilüberschreibung ebenfalls für den aktiven Lauf. Wiederholungen sind begrenzt: Nach dem ersten Versuch plus 2 Wechsel-Wiederholungen bricht Cron ab, statt endlos zu schleifen.

Bevor ein isolierter Cron-Lauf in den Agent-Runner eintritt, prüft OpenClaw erreichbare lokale Provider-Endpunkte für konfigurierte `api: "ollama"`- und `api: "openai-completions"`-Provider, deren `baseUrl` local loopback, privates Netzwerk oder `.local` ist. Wenn dieser Endpunkt down ist, wird der Lauf als `skipped` mit einem klaren Provider-/Modellfehler aufgezeichnet, statt einen Modellaufruf zu starten. Das Endpunktergebnis wird 5 Minuten lang zwischengespeichert, sodass viele fällige Jobs, die denselben toten lokalen Ollama-, vLLM-, SGLang- oder LM Studio-Server verwenden, eine kleine Probe teilen, statt einen Request-Sturm zu erzeugen. Übersprungene Provider-Preflight-Läufe erhöhen den Execution-Error-Backoff nicht; aktivieren Sie `failureAlert.includeSkipped`, wenn Sie wiederholte Überspringungsbenachrichtigungen möchten.

## Zustellung und Ausgabe

| Modus      | Was geschieht                                                                    |
| ---------- | --------------------------------------------------------------------------------- |
| `announce` | Liefert finalen Text per Fallback an das Ziel, wenn der Agent nicht gesendet hat |
| `webhook`  | Sendet fertige Ereignisnutzlast per POST an eine URL                             |
| `none`     | Keine Runner-Fallback-Zustellung                                                 |

Verwenden Sie `--announce --channel telegram --to "-1001234567890"` für die Zustellung an Kanäle. Verwenden Sie für Telegram-Forumsthemen `-1001234567890:topic:123`; direkte RPC-/Konfigurationsaufrufer können auch `delivery.threadId` als String oder Zahl übergeben. Slack-/Discord-/Mattermost-Ziele sollten explizite Präfixe verwenden (`channel:<id>`, `user:<id>`). Matrix-Raum-IDs unterscheiden Groß- und Kleinschreibung; verwenden Sie die exakte Raum-ID oder die Form `room:!room:server` aus Matrix.

Wenn die announce-Zustellung `channel: "last"` verwendet oder `channel` auslässt, kann ein Ziel mit Provider-Präfix wie `telegram:123` den Kanal auswählen, bevor Cron auf den Sitzungsverlauf oder einen einzelnen konfigurierten Kanal zurückfällt. Nur Präfixe, die vom geladenen Plugin angekündigt werden, sind Provider-Selektoren. Wenn `delivery.channel` explizit ist, muss das Zielpräfix denselben Provider benennen; beispielsweise wird `channel: "whatsapp"` mit `to: "telegram:123"` abgelehnt, statt WhatsApp die Telegram-ID als Telefonnummer interpretieren zu lassen. Zielart- und Dienstpräfixe wie `channel:<id>`, `user:<id>`, `imessage:<handle>` und `sms:<number>` bleiben kanaleigene Zielsyntax, keine Provider-Selektoren.

Für isolierte Jobs wird die Chat-Zustellung geteilt. Wenn eine Chat-Route verfügbar ist, kann der Agent das Tool `message` verwenden, selbst wenn der Job `--no-deliver` nutzt. Wenn der Agent an das konfigurierte/aktuelle Ziel sendet, überspringt OpenClaw die Fallback-announce-Zustellung. Andernfalls steuern `announce`, `webhook` und `none` nur, was der Runner nach dem Agent-Durchlauf mit der finalen Antwort macht.

Wenn ein Agent eine isolierte Erinnerung aus einem aktiven Chat erstellt, speichert OpenClaw das beibehaltene Live-Zustellungsziel für die Fallback-announce-Route. Interne Sitzungsschlüssel können kleingeschrieben sein; Provider-Zustellungsziele werden nicht aus diesen Schlüsseln rekonstruiert, wenn aktueller Chat-Kontext verfügbar ist.

Fehlerbenachrichtigungen folgen einem separaten Zielpfad:

- `cron.failureDestination` legt einen globalen Standard für Fehlerbenachrichtigungen fest.
- `job.delivery.failureDestination` überschreibt diesen pro Job.
- Wenn keines von beiden gesetzt ist und der Job bereits über `announce` zustellt, fallen Fehlerbenachrichtigungen jetzt auf dieses primäre announce-Ziel zurück.
- `delivery.failureDestination` wird nur für Jobs mit `sessionTarget="isolated"` unterstützt, sofern der primäre Zustellungsmodus nicht `webhook` ist.
- `failureAlert.includeSkipped: true` nimmt einen Job oder eine globale Cron-Warnrichtlinie in wiederholte Warnungen zu übersprungenen Läufen auf. Übersprungene Läufe behalten einen separaten Zähler für aufeinanderfolgende Überspringungen, sodass sie den Backoff für Ausführungsfehler nicht beeinflussen.

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

Gateway kann HTTP-Webhook-Endpunkte für externe Auslöser bereitstellen. Aktivieren Sie sie in der Konfiguration:

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

Token in der Query-Zeichenfolge werden abgelehnt.

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    Ein Systemereignis für die Hauptsitzung in die Warteschlange stellen:

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
    Einen isolierten Agent-Durchlauf ausführen:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    Felder: `message` (erforderlich), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `fallbacks`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Mapped hooks (POST /hooks/<name>)">
    Benutzerdefinierte Hook-Namen werden über `hooks.mappings` in der Konfiguration aufgelöst. Mappings können beliebige Payloads mit Vorlagen oder Code-Transformationen in `wake`- oder `agent`-Aktionen umwandeln.
  </Accordion>
</AccordionGroup>

<Warning>
Halten Sie Hook-Endpunkte hinter loopback, Tailnet oder einem vertrauenswürdigen Reverse Proxy.

- Verwenden Sie ein dediziertes Hook-Token; verwenden Sie keine Gateway-Authentifizierungstoken wieder.
- Halten Sie `hooks.path` auf einem dedizierten Unterpfad; `/` wird abgelehnt.
- Setzen Sie `hooks.allowedAgentIds`, um explizites `agentId`-Routing zu begrenzen.
- Belassen Sie `hooks.allowRequestSessionKey=false`, sofern Sie keine vom Aufrufer ausgewählten Sitzungen benötigen.
- Wenn Sie `hooks.allowRequestSessionKey` aktivieren, setzen Sie auch `hooks.allowedSessionKeyPrefixes`, um zulässige Sitzungsschlüssel-Formen einzuschränken.
- Hook-Payloads werden standardmäßig mit Sicherheitsgrenzen umschlossen.

</Warning>

## Gmail-PubSub-Integration

Verbinden Sie Gmail-Posteingangsauslöser über Google PubSub mit OpenClaw.

<Note>
**Voraussetzungen:** `gcloud` CLI, `gog` (gogcli), aktivierte OpenClaw-Hooks, Tailscale für den öffentlichen HTTPS-Endpunkt.
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
    Wählen Sie das GCP-Projekt aus, das den von `gog` verwendeten OAuth-Client besitzt:

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

### Gmail-Modell-Override

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
Hinweis zum Modell-Override:

- `openclaw cron add|edit --model ...` ändert das ausgewählte Modell des Jobs.
- Wenn das Modell zulässig ist, erreicht genau dieser Provider/dieses Modell den isolierten Agent-Durchlauf.
- Wenn es nicht zulässig ist oder nicht aufgelöst werden kann, lässt Cron den Lauf mit einem expliziten Validierungsfehler fehlschlagen.
- Konfigurierte Fallback-Ketten gelten weiterhin, weil Cron `--model` ein Job-Primärmodell ist, kein Sitzungs-Override für `/model`.
- Payload `fallbacks` ersetzt konfigurierte Fallbacks für diesen Job; `fallbacks: []` deaktiviert Fallbacks und macht den Lauf strikt.
- Ein einfaches `--model` ohne explizite oder konfigurierte Fallback-Liste fällt nicht als stilles zusätzliches Wiederholungsziel auf das Agent-Primärmodell durch.

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

`maxConcurrentRuns` begrenzt sowohl geplante Cron-Dispatches als auch die Ausführung isolierter Agent-Durchläufe. Isolierte Cron-Agent-Durchläufe verwenden intern die dedizierte Ausführungsspur `cron-nested` der Warteschlange. Wenn Sie diesen Wert erhöhen, können unabhängige Cron-LLM-Läufe parallel fortschreiten, statt nur ihre äußeren Cron-Wrapper zu starten. Die gemeinsam genutzte Nicht-Cron-Spur `nested` wird durch diese Einstellung nicht erweitert.

Der Runtime-State-Sidecar wird aus `cron.store` abgeleitet: Ein `.json`-Store wie `~/clawd/cron/jobs.json` verwendet `~/clawd/cron/jobs-state.json`, während ein Store-Pfad ohne `.json`-Suffix `-state.json` anhängt.

Wenn Sie `jobs.json` manuell bearbeiten, lassen Sie `jobs-state.json` aus der Versionskontrolle heraus. OpenClaw verwendet diesen Sidecar für ausstehende Slots, aktive Marker, Metadaten zum letzten Lauf und die Schedule-Identität, die dem Scheduler mitteilt, wann ein extern bearbeiteter Job ein frisches `nextRunAtMs` benötigt.

Cron deaktivieren: `cron.enabled: false` oder `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Retry behavior">
    **Einmalige Wiederholung**: Vorübergehende Fehler (Ratenbegrenzung, Überlastung, Netzwerk, Serverfehler) werden bis zu 3-mal mit exponentiellem Backoff wiederholt. Permanente Fehler deaktivieren sofort.

    **Wiederkehrende Wiederholung**: exponentieller Backoff (30s bis 60m) zwischen Wiederholungen. Der Backoff wird nach dem nächsten erfolgreichen Lauf zurückgesetzt.

  </Accordion>
  <Accordion title="Maintenance">
    `cron.sessionRetention` (Standard `24h`) bereinigt Einträge isolierter Laufsitzungen. `cron.runLog.maxBytes` / `cron.runLog.keepLines` bereinigen Run-Log-Dateien automatisch.
  </Accordion>
</AccordionGroup>

## Fehlerbehebung

### Befehlskette

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
  <Accordion title="Cron not firing">
    - Prüfen Sie `cron.enabled` und die Umgebungsvariable `OPENCLAW_SKIP_CRON`.
    - Bestätigen Sie, dass der Gateway kontinuierlich läuft.
    - Prüfen Sie bei `cron`-Schedules die Zeitzone (`--tz`) gegenüber der Host-Zeitzone.
    - `reason: not-due` in der Lauf-Ausgabe bedeutet, dass der manuelle Lauf mit `openclaw cron run <jobId> --due` geprüft wurde und der Job noch nicht fällig war.

  </Accordion>
  <Accordion title="Cron wurde ausgelöst, aber keine Zustellung">
    - Zustellmodus `none` bedeutet, dass kein Fallback-Versand durch den Runner erwartet wird. Der Agent kann weiterhin direkt mit dem `message`-Tool senden, wenn eine Chat-Route verfügbar ist.
    - Fehlendes/ungültiges Zustellziel (`channel`/`to`) bedeutet, dass der ausgehende Versand übersprungen wurde.
    - Bei Matrix können kopierte oder ältere Jobs mit kleingeschriebenen `delivery.to`-Raum-IDs fehlschlagen, weil Matrix-Raum-IDs zwischen Groß- und Kleinschreibung unterscheiden. Bearbeiten Sie den Job auf den exakten Wert `!room:server` oder `room:!room:server` aus Matrix.
    - Kanal-Authentifizierungsfehler (`unauthorized`, `Forbidden`) bedeuten, dass die Zustellung durch Anmeldedaten blockiert wurde.
    - Wenn der isolierte Lauf nur das stille Token (`NO_REPLY` / `no_reply`) zurückgibt, unterdrückt OpenClaw die direkte ausgehende Zustellung und auch den Fallback-Pfad für die eingereihte Zusammenfassung, sodass nichts zurück in den Chat gepostet wird.
    - Wenn der Agent dem Benutzer selbst eine Nachricht senden soll, prüfen Sie, ob der Job eine nutzbare Route hat (`channel: "last"` mit einem vorherigen Chat oder einen expliziten Kanal/ein explizites Ziel).

  </Accordion>
  <Accordion title="Cron oder Heartbeat scheint /new-style-Rollover zu verhindern">
    - Die Aktualität für tägliche und Inaktivitäts-Resets basiert nicht auf `updatedAt`; siehe [Sitzungsverwaltung](/de/concepts/session#session-lifecycle).
    - Cron-Weckvorgänge, Heartbeat-Läufe, Exec-Benachrichtigungen und Gateway-Buchhaltung können die Sitzungszeile für Routing/Status aktualisieren, verlängern aber nicht `sessionStartedAt` oder `lastInteractionAt`.
    - Für Legacy-Zeilen, die erstellt wurden, bevor diese Felder existierten, kann OpenClaw `sessionStartedAt` aus dem JSONL-Sitzungsheader des Transkripts wiederherstellen, wenn die Datei noch verfügbar ist. Legacy-Inaktivitätszeilen ohne `lastInteractionAt` verwenden diese wiederhergestellte Startzeit als ihre Inaktivitäts-Baseline.

  </Accordion>
  <Accordion title="Zeitzonen-Fallstricke">
    - Cron ohne `--tz` verwendet die Zeitzone des Gateway-Hosts.
    - `at`-Zeitpläne ohne Zeitzone werden als UTC behandelt.
    - Heartbeat `activeHours` verwendet die konfigurierte Zeitzonenauflösung.

  </Accordion>
</AccordionGroup>

## Verwandte Themen

- [Automatisierung und Aufgaben](/de/automation) — alle Automatisierungsmechanismen auf einen Blick
- [Hintergrundaufgaben](/de/automation/tasks) — Aufgabenbuch für Cron-Ausführungen
- [Heartbeat](/de/gateway/heartbeat) — periodische Turns in der Hauptsitzung
- [Zeitzone](/de/concepts/timezone) — Zeitzonenkonfiguration
