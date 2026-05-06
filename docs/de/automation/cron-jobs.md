---
read_when:
    - Hintergrundaufgaben oder Weckvorgänge planen
    - Externe Trigger (Webhooks, Gmail) in OpenClaw einbinden
    - Zwischen Heartbeat und Cron für geplante Aufgaben entscheiden
sidebarTitle: Scheduled tasks
summary: Geplante Jobs, Webhooks und Gmail-PubSub-Trigger für den Gateway-Scheduler
title: Geplante Aufgaben
x-i18n:
    generated_at: "2026-05-06T17:52:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19c3505408ab7602775dc1168c2c7a626986fa2a15ef02a44dc864d5ec538bfe
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron ist der integrierte Zeitplaner des Gateways. Cron speichert Jobs dauerhaft, weckt den Agenten zur richtigen Zeit und kann Ausgaben an einen Chat-Kanal oder Webhook-Endpunkt zurückliefern.

## Schnellstart

<Steps>
  <Step title="Fügen Sie eine einmalige Erinnerung hinzu">
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
  <Step title="Prüfen Sie Ihre Jobs">
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

## Wie Cron funktioniert

- Cron läuft **innerhalb des Gateway**-Prozesses (nicht innerhalb des Modells).
- Jobdefinitionen werden unter `~/.openclaw/cron/jobs.json` dauerhaft gespeichert, sodass Zeitpläne bei Neustarts nicht verloren gehen.
- Der Ausführungszustand zur Laufzeit wird daneben in `~/.openclaw/cron/jobs-state.json` gespeichert. Wenn Sie Cron-Definitionen in Git nachverfolgen, nehmen Sie `jobs.json` auf und ignorieren Sie `jobs-state.json` per Gitignore.
- Nach der Aufteilung können ältere OpenClaw-Versionen `jobs.json` lesen, Jobs aber möglicherweise als neu behandeln, weil Laufzeitfelder nun in `jobs-state.json` liegen.
- Wenn `jobs.json` bearbeitet wird, während der Gateway läuft oder gestoppt ist, vergleicht OpenClaw die geänderten Zeitplanfelder mit ausstehenden Laufzeit-Slot-Metadaten und entfernt veraltete `nextRunAtMs`-Werte. Reine Formatierungsänderungen oder Umschreibungen nur der Schlüsselreihenfolge behalten den ausstehenden Slot bei.
- Alle Cron-Ausführungen erstellen Datensätze für [Hintergrundaufgaben](/de/automation/tasks).
- Beim Start des Gateways werden überfällige isolierte Agent-Turn-Jobs aus dem Kanalverbindungsfenster heraus neu geplant, statt sofort erneut abgespielt zu werden, damit Discord-/Telegram-Start und native Befehlseinrichtung nach Neustarts reaktionsfähig bleiben.
- Einmalige Jobs (`--at`) löschen sich nach erfolgreicher Ausführung standardmäßig automatisch.
- Isolierte Cron-Ausführungen schließen nach Best Effort nachverfolgte Browser-Tabs/-Prozesse für ihre `cron:<jobId>`-Session, wenn die Ausführung abgeschlossen ist, sodass getrennte Browserautomatisierung keine verwaisten Prozesse zurücklässt.
- Isolierte Cron-Ausführungen, die die enge Cron-Selbstbereinigungsberechtigung erhalten, können weiterhin den Scheduler-Status und eine selbstgefilterte Liste ihres aktuellen Jobs lesen, sodass Status-/Heartbeat-Prüfungen ihren eigenen Zeitplan untersuchen können, ohne breiteren Zugriff auf Cron-Mutationen zu erhalten.
- Isolierte Cron-Ausführungen schützen auch vor veralteten Bestätigungsantworten. Wenn das erste Ergebnis nur eine zwischenzeitliche Statusmeldung ist (`on it`, `pulling everything together` und ähnliche Hinweise) und keine nachgelagerte Subagent-Ausführung noch für die endgültige Antwort verantwortlich ist, fordert OpenClaw vor der Zustellung einmal erneut das eigentliche Ergebnis an.
- Isolierte Cron-Ausführungen bevorzugen strukturierte Metadaten zur Ausführungsverweigerung aus der eingebetteten Ausführung und greifen dann auf bekannte Markierungen für endgültige Zusammenfassungen/Ausgaben wie `SYSTEM_RUN_DENIED` und `INVALID_REQUEST` zurück, sodass ein blockierter Befehl nicht als erfolgreiche Ausführung gemeldet wird.
- Isolierte Cron-Ausführungen behandeln außerdem Agent-Fehler auf Ausführungsebene als Jobfehler, selbst wenn keine Antwortnutzlast erzeugt wird. So erhöhen Modell-/Provider-Fehler die Fehlerzähler und lösen Fehlerbenachrichtigungen aus, statt den Job als erfolgreich abzuschließen.
- Wenn ein isolierter Agent-Turn-Job `timeoutSeconds` erreicht, bricht Cron die zugrunde liegende Agent-Ausführung ab und gibt ihr ein kurzes Bereinigungsfenster. Wenn die Ausführung nicht ausläuft, entfernt die Gateway-eigene Bereinigung die Session-Eigentümerschaft dieser Ausführung zwangsweise, bevor Cron den Timeout aufzeichnet, sodass in der Warteschlange befindliche Chat-Arbeit nicht hinter einer veralteten verarbeitenden Session zurückbleibt.

<a id="maintenance"></a>

<Note>
Die Aufgabenabstimmung für Cron ist zuerst laufzeiteigen und erst danach durch dauerhafte Historie abgesichert: Eine aktive Cron-Aufgabe bleibt aktiv, solange die Cron-Laufzeit diesen Job noch als laufend nachverfolgt, selbst wenn noch eine alte untergeordnete Session-Zeile existiert. Sobald die Laufzeit den Job nicht mehr besitzt und das 5-Minuten-Kulanzfenster abläuft, prüfen Wartungschecks persistierte Ausführungsprotokolle und den Jobzustand für die passende `cron:<jobId>:<startedAt>`-Ausführung. Wenn diese dauerhafte Historie ein terminales Ergebnis zeigt, wird das Aufgabenbuch daraus finalisiert; andernfalls kann die Gateway-eigene Wartung die Aufgabe als `lost` markieren. Offline-CLI-Audit kann aus dauerhafter Historie wiederherstellen, behandelt aber die eigene leere aktive In-Process-Jobmenge nicht als Beweis dafür, dass eine Gateway-eigene Cron-Ausführung verschwunden ist.
</Note>

## Zeitplantypen

| Art     | CLI-Flag  | Beschreibung                                             |
| ------- | --------- | -------------------------------------------------------- |
| `at`    | `--at`    | Einmaliger Zeitstempel (ISO 8601 oder relativ wie `20m`) |
| `every` | `--every` | Festes Intervall                                         |
| `cron`  | `--cron`  | Cron-Ausdruck mit 5 oder 6 Feldern und optionalem `--tz` |

Zeitstempel ohne Zeitzone werden als UTC behandelt. Fügen Sie `--tz America/New_York` für lokale Wanduhrplanung hinzu.

Wiederkehrende Ausdrücke zur vollen Stunde werden automatisch um bis zu 5 Minuten gestaffelt, um Lastspitzen zu reduzieren. Verwenden Sie `--exact`, um präzises Timing zu erzwingen, oder `--stagger 30s` für ein explizites Fenster.

### Tag des Monats und Wochentag verwenden OR-Logik

Cron-Ausdrücke werden von [croner](https://github.com/Hexagon/croner) geparst. Wenn sowohl das Feld für den Tag des Monats als auch das Feld für den Wochentag kein Platzhalter ist, stimmt croner überein, wenn **eines der beiden** Felder passt, nicht beide. Dies ist standardmäßiges Vixie-Cron-Verhalten.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Dies löst etwa 5–6 Mal pro Monat aus statt 0–1 Mal pro Monat. OpenClaw verwendet hier Croners standardmäßiges OR-Verhalten. Um beide Bedingungen zu verlangen, verwenden Sie Croners `+`-Wochentagsmodifikator (`0 9 15 * +1`) oder planen Sie nach einem Feld und prüfen Sie das andere im Prompt oder Befehl Ihres Jobs.

## Ausführungsstile

| Stil             | `--session`-Wert   | Läuft in                 | Am besten für                        |
| ---------------- | ------------------ | ------------------------ | ------------------------------------ |
| Hauptsession     | `main`             | Nächster Heartbeat-Turn  | Erinnerungen, Systemereignisse       |
| Isoliert         | `isolated`         | Dedizierte `cron:<jobId>` | Berichte, Hintergrundaufgaben        |
| Aktuelle Session | `current`          | Bei Erstellung gebunden  | Kontextbewusste wiederkehrende Arbeit |
| Eigene Session   | `session:custom-id` | Dauerhafte benannte Session | Workflows, die auf Historie aufbauen |

<AccordionGroup>
  <Accordion title="Hauptsession vs. isoliert vs. eigene Session">
    Jobs der **Hauptsession** stellen ein Systemereignis in die Warteschlange und wecken optional den Heartbeat (`--wake now` oder `--wake next-heartbeat`). Diese Systemereignisse verlängern nicht die Frische für tägliche/Leerlauf-Zurücksetzungen der Zielsession. **Isolierte** Jobs führen einen dedizierten Agent-Turn mit einer frischen Session aus. **Eigene Sessions** (`session:xxx`) behalten Kontext über Ausführungen hinweg bei und ermöglichen Workflows wie tägliche Standups, die auf vorherigen Zusammenfassungen aufbauen.
  </Accordion>
  <Accordion title="Was „frische Session“ für isolierte Jobs bedeutet">
    Bei isolierten Jobs bedeutet „frische Session“ eine neue Transcript-/Session-ID für jede Ausführung. OpenClaw kann sichere Präferenzen wie Thinking-/Fast-/Verbose-Einstellungen, Labels und explizit vom Benutzer ausgewählte Modell-/Auth-Overrides übernehmen, erbt aber keinen umgebenden Gesprächskontext aus einer älteren Cron-Zeile: Kanal-/Gruppenrouting, Sende- oder Warteschlangenrichtlinie, Elevation, Ursprung oder ACP-Laufzeitbindung. Verwenden Sie `current` oder `session:<id>`, wenn ein wiederkehrender Job bewusst auf demselben Gesprächskontext aufbauen soll.
  </Accordion>
  <Accordion title="Laufzeitbereinigung">
    Bei isolierten Jobs umfasst der Laufzeitabbau nun Best-Effort-Browserbereinigung für diese Cron-Session. Bereinigungsfehler werden ignoriert, sodass weiterhin das eigentliche Cron-Ergebnis zählt.

    Isolierte Cron-Ausführungen entsorgen außerdem alle gebündelten MCP-Laufzeitinstanzen, die für den Job erstellt wurden, über den gemeinsamen Laufzeitbereinigungspfad. Dies entspricht dem Abbau von MCP-Clients für Hauptsession und eigene Session, sodass isolierte Cron-Jobs keine stdio-Kindprozesse oder langlebigen MCP-Verbindungen über Ausführungen hinweg verlieren.

  </Accordion>
  <Accordion title="Subagent- und Discord-Zustellung">
    Wenn isolierte Cron-Ausführungen Subagents orchestrieren, bevorzugt die Zustellung ebenfalls die endgültige Ausgabe des Nachkommen gegenüber veraltetem Zwischentext des übergeordneten Laufs. Wenn Nachkommen noch laufen, unterdrückt OpenClaw diese teilweise übergeordnete Aktualisierung, statt sie anzukündigen.

    Für reine Text-Ankündigungsziele in Discord sendet OpenClaw den kanonischen endgültigen Assistententext einmal, statt sowohl gestreamte/zwischenzeitliche Textnutzlasten als auch die endgültige Antwort erneut abzuspielen. Medien und strukturierte Discord-Nutzlasten werden weiterhin als separate Nutzlasten zugestellt, damit Anhänge und Komponenten nicht verworfen werden.

  </Accordion>
</AccordionGroup>

### Nutzlastoptionen für isolierte Jobs

<ParamField path="--message" type="string" required>
  Prompttext (für isolierte Jobs erforderlich).
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
  Einschränken, welche Tools der Job verwenden kann, zum Beispiel `--tools exec,read`.
</ParamField>

`--model` verwendet das ausgewählte zulässige Modell als primäres Modell dieses Jobs. Es ist nicht dasselbe wie ein `/model`-Override für Chat-Sessions: Konfigurierte Fallback-Ketten gelten weiterhin, wenn das primäre Jobmodell fehlschlägt. Wenn das angeforderte Modell nicht zulässig ist oder nicht aufgelöst werden kann, schlägt Cron die Ausführung mit einem expliziten Validierungsfehler fehl, statt stillschweigend auf die Agent-/Standardmodellauswahl des Jobs zurückzufallen.

Cron-Jobs können außerdem `fallbacks` auf Nutzlastebene enthalten. Wenn vorhanden, ersetzt diese Liste die konfigurierte Fallback-Kette für den Job. Verwenden Sie `fallbacks: []` in der Jobnutzlast/API, wenn Sie eine strikte Cron-Ausführung möchten, die nur das ausgewählte Modell versucht. Wenn ein Job `--model`, aber weder Nutzlast- noch konfigurierte Fallbacks hat, übergibt OpenClaw einen expliziten leeren Fallback-Override, damit das primäre Agent-Modell nicht als verstecktes zusätzliches Wiederholungsziel angehängt wird.

Die Priorität der Modellauswahl für isolierte Jobs ist:

1. Gmail-Hook-Modell-Override (wenn die Ausführung aus Gmail kam und dieser Override zulässig ist)
2. `model` pro Jobnutzlast
3. Vom Benutzer ausgewählter gespeicherter Cron-Session-Modell-Override
4. Agent-/Standardmodellauswahl

Fast Mode folgt ebenfalls der aufgelösten Live-Auswahl. Wenn die ausgewählte Modellkonfiguration `params.fastMode` hat, verwendet isolierter Cron dies standardmäßig. Ein gespeicherter Session-`fastMode`-Override hat weiterhin Vorrang vor der Konfiguration, in beide Richtungen.

Wenn eine isolierte Ausführung eine Live-Modellwechsel-Übergabe erreicht, versucht Cron es erneut mit dem gewechselten Provider/Modell und speichert diese Live-Auswahl vor dem erneuten Versuch für die aktive Ausführung. Wenn der Wechsel auch ein neues Auth-Profil mitbringt, speichert Cron diesen Auth-Profil-Override ebenfalls für die aktive Ausführung. Wiederholungen sind begrenzt: Nach dem ersten Versuch plus 2 Wechselwiederholungen bricht Cron ab, statt endlos zu laufen.

Bevor eine isolierte Cron-Ausführung in den Agent Runner eintritt, prüft OpenClaw erreichbare lokale Provider-Endpunkte für konfigurierte `api: "ollama"`- und `api: "openai-completions"`-Provider, deren `baseUrl` loopback, private-network oder `.local` ist. Wenn dieser Endpunkt ausgefallen ist, wird die Ausführung als `skipped` mit einem klaren Provider-/Modellfehler aufgezeichnet, statt einen Modellaufruf zu starten. Das Endpunktergebnis wird 5 Minuten zwischengespeichert, sodass viele fällige Jobs, die denselben ausgefallenen lokalen Ollama-, vLLM-, SGLang- oder LM Studio-Server verwenden, eine kleine gemeinsame Prüfung nutzen, statt einen Anfragesturm zu erzeugen. Übersprungene Provider-Preflight-Ausführungen erhöhen den Ausführungsfehler-Backoff nicht; aktivieren Sie `failureAlert.includeSkipped`, wenn Sie wiederholte Übersprungsbenachrichtigungen wünschen.

## Zustellung und Ausgabe

| Modus      | Was passiert                                                                    |
| ---------- | ------------------------------------------------------------------------------- |
| `announce` | Finalen Text als Fallback an das Ziel zustellen, wenn der Agent nicht gesendet hat |
| `webhook`  | Fertige Ereignisnutzlast per POST an eine URL senden                            |
| `none`     | Keine Fallback-Zustellung durch den Runner                                      |

Verwenden Sie `--announce --channel telegram --to "-1001234567890"` für die Zustellung an Kanäle. Für Telegram-Forumthemen verwenden Sie `-1001234567890:topic:123`; direkte RPC-/Konfigurationsaufrufer können außerdem `delivery.threadId` als Zeichenfolge oder Zahl übergeben. Slack-/Discord-/Mattermost-Ziele sollten explizite Präfixe verwenden (`channel:<id>`, `user:<id>`). Matrix-Raum-IDs unterscheiden zwischen Groß- und Kleinschreibung; verwenden Sie die exakte Raum-ID oder die Form `room:!room:server` aus Matrix.

Wenn die announce-Zustellung `channel: "last"` verwendet oder `channel` auslässt, kann ein Provider-präfixiertes Ziel wie `telegram:123` den Kanal auswählen, bevor Cron auf den Sitzungsverlauf oder einen einzelnen konfigurierten Kanal zurückfällt. Nur Präfixe, die vom geladenen Plugin angekündigt werden, sind Provider-Selektoren. Wenn `delivery.channel` explizit ist, muss das Zielpräfix denselben Provider benennen; beispielsweise wird `channel: "whatsapp"` mit `to: "telegram:123"` abgelehnt, anstatt WhatsApp die Telegram-ID als Telefonnummer interpretieren zu lassen. Zieltyp- und Dienstpräfixe wie `channel:<id>`, `user:<id>`, `imessage:<handle>` und `sms:<number>` bleiben kanaleigene Zielsyntax, keine Provider-Selektoren.

Für isolierte Jobs wird die Chat-Zustellung geteilt. Wenn eine Chat-Route verfügbar ist, kann der Agent das Tool `message` auch dann verwenden, wenn der Job `--no-deliver` verwendet. Wenn der Agent an das konfigurierte/aktuelle Ziel sendet, überspringt OpenClaw die fallback-announce-Zustellung. Andernfalls steuern `announce`, `webhook` und `none` nur, was der Runner nach dem Agent-Durchlauf mit der finalen Antwort macht.

Wenn ein Agent eine isolierte Erinnerung aus einem aktiven Chat erstellt, speichert OpenClaw das beibehaltene Live-Zustellungsziel für die fallback-announce-Route. Interne Sitzungsschlüssel können kleingeschrieben sein; Provider-Zustellungsziele werden nicht aus diesen Schlüsseln rekonstruiert, wenn aktueller Chat-Kontext verfügbar ist.

Implizite announce-Zustellung verwendet konfigurierte Kanal-Allowlists, um veraltete Ziele zu validieren und umzuleiten. Genehmigungen im DM-Pairing-Store sind keine Empfänger für Fallback-Automatisierung; setzen Sie `delivery.to` oder konfigurieren Sie den Kanal-Eintrag `allowFrom`, wenn ein geplanter Job proaktiv an eine DM senden soll.

Fehlerbenachrichtigungen folgen einem separaten Zielpfad:

- `cron.failureDestination` legt einen globalen Standard für Fehlerbenachrichtigungen fest.
- `job.delivery.failureDestination` überschreibt dies pro Job.
- Wenn keines von beiden gesetzt ist und der Job bereits über `announce` zustellt, fallen Fehlerbenachrichtigungen jetzt auf dieses primäre announce-Ziel zurück.
- `delivery.failureDestination` wird nur bei Jobs mit `sessionTarget="isolated"` unterstützt, es sei denn, der primäre Zustellmodus ist `webhook`.
- `failureAlert.includeSkipped: true` nimmt einen Job oder eine globale Cron-Warnrichtlinie in wiederholte Warnungen für übersprungene Läufe auf. Übersprungene Läufe behalten einen separaten Zähler für aufeinanderfolgende Überspringungen, sodass sie den Backoff für Ausführungsfehler nicht beeinflussen.

## CLI-Beispiele

<Tabs>
  <Tab title="Einmalige Erinnerung">
    ```bash
    openclaw cron add \
      --name "Calendar check" \
      --at "20m" \
      --session main \
      --system-event "Next heartbeat: check calendar." \
      --wake now
    ```
  </Tab>
  <Tab title="Wiederkehrender isolierter Job">
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
  <Tab title="Modell- und Thinking-Überschreibung">
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

Gateway kann HTTP-Webhook-Endpunkte für externe Trigger bereitstellen. Aktivieren Sie dies in der Konfiguration:

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

Token in Query-Strings werden abgelehnt.

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
    Führt einen isolierten Agent-Durchlauf aus:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    Felder: `message` (erforderlich), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `fallbacks`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Zugeordnete Hooks (POST /hooks/<name>)">
    Benutzerdefinierte Hook-Namen werden über `hooks.mappings` in der Konfiguration aufgelöst. Zuordnungen können beliebige Payloads mit Vorlagen oder Code-Transformationen in `wake`- oder `agent`-Aktionen umwandeln.
  </Accordion>
</AccordionGroup>

<Warning>
Halten Sie Hook-Endpunkte hinter loopback, tailnet oder einem vertrauenswürdigen Reverse Proxy.

- Verwenden Sie ein dediziertes Hook-Token; verwenden Sie Gateway-Authentifizierungstoken nicht wieder.
- Belassen Sie `hooks.path` auf einem dedizierten Unterpfad; `/` wird abgelehnt.
- Setzen Sie `hooks.allowedAgentIds`, um explizites `agentId`-Routing zu begrenzen.
- Belassen Sie `hooks.allowRequestSessionKey=false`, es sei denn, Sie benötigen sitzungen, die vom Aufrufer ausgewählt werden.
- Wenn Sie `hooks.allowRequestSessionKey` aktivieren, setzen Sie außerdem `hooks.allowedSessionKeyPrefixes`, um die erlaubten Sitzungsschlüssel-Formen einzuschränken.
- Hook-Payloads werden standardmäßig mit Sicherheitsgrenzen umschlossen.

</Warning>

## Gmail-PubSub-Integration

Verbinden Sie Gmail-Posteingangstrigger über Google PubSub mit OpenClaw.

<Note>
**Voraussetzungen:** `gcloud`-CLI, `gog` (gogcli), aktivierte OpenClaw-Hooks, Tailscale für den öffentlichen HTTPS-Endpunkt.
</Note>

### Einrichtung per Wizard (empfohlen)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Dies schreibt die Konfiguration `hooks.gmail`, aktiviert die Gmail-Voreinstellung und verwendet Tailscale Funnel für den Push-Endpunkt.

### Automatischer Gateway-Start

Wenn `hooks.enabled=true` und `hooks.gmail.account` gesetzt ist, startet der Gateway beim Booten `gog gmail watch serve` und erneuert den Watch automatisch. Setzen Sie `OPENCLAW_SKIP_GMAIL_WATCHER=1`, um dies zu deaktivieren.

### Manuelle einmalige Einrichtung

<Steps>
  <Step title="GCP-Projekt auswählen">
    Wählen Sie das GCP-Projekt aus, dem der von `gog` verwendete OAuth-Client gehört:

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="Topic erstellen und Gmail-Push-Zugriff gewähren">
    ```bash
    gcloud pubsub topics create gog-gmail-watch
    gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
      --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
      --role=roles/pubsub.publisher
    ```
  </Step>
  <Step title="Watch starten">
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
- Wenn das Modell erlaubt ist, erreicht genau dieser Provider/dieses Modell den isolierten Agent-Durchlauf.
- Wenn es nicht erlaubt ist oder nicht aufgelöst werden kann, lässt Cron den Lauf mit einem expliziten Validierungsfehler fehlschlagen.
- Konfigurierte Fallback-Ketten gelten weiterhin, weil Cron `--model` ein primäres Job-Modell ist, keine Sitzungsüberschreibung von `/model`.
- Payload `fallbacks` ersetzt konfigurierte Fallbacks für diesen Job; `fallbacks: []` deaktiviert Fallbacks und macht den Lauf strikt.
- Ein einfaches `--model` ohne explizite oder konfigurierte Fallback-Liste fällt nicht stillschweigend als zusätzliches Wiederholungsziel auf das primäre Agent-Modell zurück.

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

`maxConcurrentRuns` begrenzt sowohl die geplante Cron-Dispatch-Ausführung als auch die Ausführung isolierter Agent-Durchläufe. Isolierte Cron-Agent-Durchläufe verwenden intern die dedizierte Ausführungsspur `cron-nested` der Warteschlange. Wenn Sie diesen Wert erhöhen, können unabhängige Cron-LLM-Läufe parallel fortschreiten, statt nur ihre äußeren Cron-Wrapper zu starten. Die gemeinsame Nicht-Cron-Spur `nested` wird durch diese Einstellung nicht erweitert.

Der Runtime-State-Sidecar wird aus `cron.store` abgeleitet: Ein `.json`-Store wie `~/clawd/cron/jobs.json` verwendet `~/clawd/cron/jobs-state.json`, während ein Store-Pfad ohne `.json`-Suffix `-state.json` anhängt.

Wenn Sie `jobs.json` manuell bearbeiten, nehmen Sie `jobs-state.json` nicht in die Versionskontrolle auf. OpenClaw verwendet diesen Sidecar für ausstehende Slots, aktive Marker, Metadaten zum letzten Lauf und die Zeitplanidentität, die dem Scheduler mitteilt, wann ein extern bearbeiteter Job ein frisches `nextRunAtMs` benötigt.

Cron deaktivieren: `cron.enabled: false` oder `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Wiederholungsverhalten">
    **Einmalige Wiederholung**: Vorübergehende Fehler (Ratenlimit, Überlastung, Netzwerk, Serverfehler) werden bis zu 3 Mal mit exponentiellem Backoff wiederholt. Dauerhafte Fehler deaktivieren sofort.

    **Wiederkehrende Wiederholung**: Exponentieller Backoff (30 s bis 60 min) zwischen Wiederholungen. Der Backoff wird nach dem nächsten erfolgreichen Lauf zurückgesetzt.

  </Accordion>
  <Accordion title="Wartung">
    `cron.sessionRetention` (Standard `24h`) bereinigt isolierte Run-Session-Einträge. `cron.runLog.maxBytes` / `cron.runLog.keepLines` bereinigen Run-Log-Dateien automatisch.
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
    - Prüfen Sie `cron.enabled` und die Env-Var `OPENCLAW_SKIP_CRON`.
    - Bestätigen Sie, dass der Gateway dauerhaft läuft.
    - Prüfen Sie bei `cron`-Zeitplänen die Zeitzone (`--tz`) gegenüber der Host-Zeitzone.
    - `reason: not-due` in der Lauf-Ausgabe bedeutet, dass der manuelle Lauf mit `openclaw cron run <jobId> --due` geprüft wurde und der Job noch nicht fällig war.

  </Accordion>
  <Accordion title="Cron ausgelöst, aber keine Zustellung">
    - Zustellmodus `none` bedeutet, dass kein Runner-Fallback-Versand erwartet wird. Der Agent kann weiterhin direkt mit dem Tool `message` senden, wenn eine Chat-Route verfügbar ist.
    - Fehlendes/ungültiges Zustellziel (`channel`/`to`) bedeutet, dass ausgehende Nachrichten übersprungen wurden.
    - Für Matrix können kopierte oder ältere Jobs mit kleingeschriebenen `delivery.to`-Raum-IDs fehlschlagen, weil Matrix-Raum-IDs zwischen Groß- und Kleinschreibung unterscheiden. Bearbeiten Sie den Job auf den exakten Wert `!room:server` oder `room:!room:server` aus Matrix.
    - Channel-Authentifizierungsfehler (`unauthorized`, `Forbidden`) bedeuten, dass die Zustellung durch Anmeldedaten blockiert wurde.
    - Wenn der isolierte Lauf nur das Silent-Token (`NO_REPLY` / `no_reply`) zurückgibt, unterdrückt OpenClaw die direkte ausgehende Zustellung und auch den Fallback-Pfad für die in die Warteschlange gestellte Zusammenfassung, sodass nichts zurück in den Chat gepostet wird.
    - Wenn der Agent dem Benutzer selbst eine Nachricht senden soll, prüfen Sie, ob der Job eine nutzbare Route hat (`channel: "last"` mit einem vorherigen Chat oder einen expliziten Channel/Ziel).

  </Accordion>
  <Accordion title="Cron oder Heartbeat scheint den /new-style-Rollover zu verhindern">
    - Die Aktualität für tägliche und Leerlauf-Resets basiert nicht auf `updatedAt`; siehe [Sitzungsverwaltung](/de/concepts/session#session-lifecycle).
    - Cron-Weckvorgänge, Heartbeat-Läufe, Exec-Benachrichtigungen und Gateway-Buchhaltung können die Sitzungszeile für Routing/Status aktualisieren, erweitern aber nicht `sessionStartedAt` oder `lastInteractionAt`.
    - Für ältere Zeilen, die erstellt wurden, bevor diese Felder existierten, kann OpenClaw `sessionStartedAt` aus dem JSONL-Sitzungsheader des Transkripts wiederherstellen, wenn die Datei noch verfügbar ist. Ältere Leerlaufzeilen ohne `lastInteractionAt` verwenden diese wiederhergestellte Startzeit als ihre Leerlauf-Baseline.

  </Accordion>
  <Accordion title="Zeitzonen-Fallstricke">
    - Cron ohne `--tz` verwendet die Zeitzone des Gateway-Hosts.
    - `at`-Zeitpläne ohne Zeitzone werden als UTC behandelt.
    - Heartbeat `activeHours` verwendet die konfigurierte Zeitzonenauflösung.

  </Accordion>
</AccordionGroup>

## Verwandt

- [Automatisierung & Aufgaben](/de/automation) — alle Automatisierungsmechanismen auf einen Blick
- [Hintergrundaufgaben](/de/automation/tasks) — Aufgaben-Ledger für Cron-Ausführungen
- [Heartbeat](/de/gateway/heartbeat) — periodische Turns der Hauptsitzung
- [Zeitzone](/de/concepts/timezone) — Zeitzonenkonfiguration
