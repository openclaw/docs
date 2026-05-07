---
read_when:
    - Hintergrundjobs oder Weckvorgänge planen
    - Externe Trigger (Webhooks, Gmail) in OpenClaw einbinden
    - Zwischen Heartbeat und Cron für geplante Aufgaben entscheiden
sidebarTitle: Scheduled tasks
summary: Geplante Jobs, Webhooks und Gmail-PubSub-Trigger für den Gateway-Scheduler
title: Geplante Aufgaben
x-i18n:
    generated_at: "2026-05-07T01:51:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4771847517f526ec537a940773c70141e056bdc5a7b735099f40c6ea10e18162
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron ist der integrierte Scheduler des Gateways. Er speichert Jobs dauerhaft, weckt den Agenten zum richtigen Zeitpunkt und kann Ausgaben an einen Chat-Kanal oder Webhook-Endpunkt zurückliefern.

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

## Funktionsweise von Cron

- Cron läuft **innerhalb des Gateway**-Prozesses (nicht innerhalb des Modells).
- Job-Definitionen werden dauerhaft unter `~/.openclaw/cron/jobs.json` gespeichert, damit Zeitpläne bei Neustarts nicht verloren gehen.
- Der Laufzeitausführungsstatus wird daneben in `~/.openclaw/cron/jobs-state.json` gespeichert. Wenn Sie Cron-Definitionen in Git verfolgen, verfolgen Sie `jobs.json` und nehmen Sie `jobs-state.json` in gitignore auf.
- Nach der Aufteilung können ältere OpenClaw-Versionen `jobs.json` lesen, behandeln Jobs aber möglicherweise als neu, weil Laufzeitfelder jetzt in `jobs-state.json` liegen.
- Wenn `jobs.json` bearbeitet wird, während der Gateway läuft oder gestoppt ist, vergleicht OpenClaw die geänderten Zeitplanfelder mit ausstehenden Laufzeit-Slot-Metadaten und löscht veraltete `nextRunAtMs`-Werte. Reine Formatierungsänderungen oder Umschreibungen, die nur die Schlüsselreihenfolge ändern, behalten den ausstehenden Slot bei.
- Alle Cron-Ausführungen erstellen [Hintergrundaufgaben](/de/automation/tasks)-Datensätze.
- Beim Start des Gateways werden überfällige isolierte Agent-Turn-Jobs aus dem Kanalverbindungsfenster heraus neu geplant, statt sofort wiedergegeben zu werden, damit der Start von Discord/Telegram und die Einrichtung nativer Befehle nach Neustarts reaktionsfähig bleiben.
- Einmalige Jobs (`--at`) werden nach erfolgreicher Ausführung standardmäßig automatisch gelöscht.
- Isolierte Cron-Ausführungen schließen nach bestem Aufwand nachverfolgte Browser-Tabs/Prozesse für ihre `cron:<jobId>`-Sitzung, wenn die Ausführung abgeschlossen ist, damit losgelöste Browser-Automatisierung keine verwaisten Prozesse zurücklässt.
- Isolierte Cron-Ausführungen, die die enge Cron-Selbstbereinigungsberechtigung erhalten, können weiterhin den Scheduler-Status und eine selbstgefilterte Liste ihres aktuellen Jobs lesen, sodass Status-/Heartbeat-Prüfungen ihren eigenen Zeitplan einsehen können, ohne breiteren Cron-Änderungszugriff zu erhalten.
- Isolierte Cron-Ausführungen schützen auch vor veralteten Bestätigungsantworten. Wenn das erste Ergebnis nur eine vorläufige Statusaktualisierung ist (`on it`, `pulling everything together` und ähnliche Hinweise) und keine nachgelagerte Subagent-Ausführung noch für die finale Antwort verantwortlich ist, fordert OpenClaw einmal erneut das tatsächliche Ergebnis an, bevor es zugestellt wird.
- Isolierte Cron-Ausführungen bevorzugen strukturierte Metadaten zu Ausführungsverweigerungen aus der eingebetteten Ausführung und fallen dann auf bekannte finale Zusammenfassungs-/Ausgabemarker wie `SYSTEM_RUN_DENIED` und `INVALID_REQUEST` zurück, sodass ein blockierter Befehl nicht als erfolgreiche Ausführung gemeldet wird.
- Isolierte Cron-Ausführungen behandeln außerdem Agent-Fehler auf Ausführungsebene als Job-Fehler, selbst wenn kein Antwortpayload erzeugt wird, sodass Modell-/Provider-Fehler Fehlerzähler erhöhen und Fehlerbenachrichtigungen auslösen, statt den Job als erfolgreich abzuschließen.
- Wenn ein isolierter Agent-Turn-Job `timeoutSeconds` erreicht, bricht Cron die zugrunde liegende Agent-Ausführung ab und gibt ihr ein kurzes Bereinigungsfenster. Wenn die Ausführung nicht ausläuft, löscht Gateway-eigene Bereinigung die Sitzungszuordnung dieser Ausführung zwangsweise, bevor Cron die Zeitüberschreitung protokolliert, damit eingereihte Chat-Arbeit nicht hinter einer veralteten Verarbeitungssitzung zurückbleibt.

<a id="maintenance"></a>

<Note>
Aufgabenabgleich für Cron ist zuerst laufzeiteigen und erst danach durch dauerhafte Historie gestützt: Eine aktive Cron-Aufgabe bleibt aktiv, solange die Cron-Laufzeit diesen Job noch als laufend verfolgt, selbst wenn noch eine alte untergeordnete Sitzungszeile existiert. Sobald die Laufzeit den Job nicht mehr besitzt und das 5-minütige Kulanzfenster abläuft, prüfen Wartungsroutinen gespeicherte Ausführungslogs und den Job-Status für die passende `cron:<jobId>:<startedAt>`-Ausführung. Wenn diese dauerhafte Historie ein finales Ergebnis zeigt, wird das Aufgabenledger daraus finalisiert; andernfalls kann Gateway-eigene Wartung die Aufgabe als `lost` markieren. Das Offline-CLI-Audit kann aus dauerhafter Historie wiederherstellen, behandelt seine eigene leere prozessinterne Menge aktiver Jobs aber nicht als Beweis dafür, dass eine Gateway-eigene Cron-Ausführung verschwunden ist.
</Note>

## Zeitplantypen

| Art     | CLI-Flag  | Beschreibung                                                       |
| ------- | --------- | ------------------------------------------------------------------ |
| `at`    | `--at`    | Einmaliger Zeitstempel (ISO 8601 oder relativ wie `20m`)           |
| `every` | `--every` | Festes Intervall                                                   |
| `cron`  | `--cron`  | Cron-Ausdruck mit 5 oder 6 Feldern und optionalem `--tz`           |

Zeitstempel ohne Zeitzone werden als UTC behandelt. Fügen Sie `--tz America/New_York` für Zeitplanung nach lokaler Uhrzeit hinzu.

Wiederkehrende Ausdrücke zur vollen Stunde werden automatisch um bis zu 5 Minuten gestaffelt, um Lastspitzen zu reduzieren. Verwenden Sie `--exact`, um präzises Timing zu erzwingen, oder `--stagger 30s` für ein explizites Fenster.

### Tag-des-Monats und Wochentag verwenden ODER-Logik

Cron-Ausdrücke werden von [croner](https://github.com/Hexagon/croner) geparst. Wenn sowohl das Tag-des-Monats- als auch das Wochentagsfeld keine Wildcards sind, passt croner, wenn **eines der beiden** Felder passt, nicht beide. Dies ist standardmäßiges Vixie-Cron-Verhalten.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Dies wird etwa 5- bis 6-mal pro Monat ausgelöst statt 0- bis 1-mal pro Monat. OpenClaw verwendet hier Croners standardmäßiges ODER-Verhalten. Um beide Bedingungen zu erzwingen, verwenden Sie Croners `+`-Wochentagsmodifikator (`0 9 15 * +1`) oder planen Sie über ein Feld und prüfen Sie das andere im Prompt oder Befehl Ihres Jobs.

## Ausführungsstile

| Stil                      | `--session`-Wert   | Läuft in                    | Am besten geeignet für                          |
| ------------------------- | ------------------ | --------------------------- | ----------------------------------------------- |
| Hauptsitzung              | `main`             | Nächster Heartbeat-Turn     | Erinnerungen, Systemereignisse                  |
| Isoliert                  | `isolated`         | Dediziertes `cron:<jobId>`  | Berichte, Hintergrundarbeiten                   |
| Aktuelle Sitzung          | `current`          | Beim Erstellen gebunden     | Kontextbewusste wiederkehrende Arbeit           |
| Benutzerdefinierte Sitzung | `session:custom-id` | Dauerhafte benannte Sitzung | Workflows, die auf Historie aufbauen            |

<AccordionGroup>
  <Accordion title="Main session vs isolated vs custom">
    Jobs der **Hauptsitzung** reihen ein Systemereignis ein und wecken optional den Heartbeat (`--wake now` oder `--wake next-heartbeat`). Diese Systemereignisse verlängern die Aktualität für tägliche/Leerlauf-Zurücksetzungen der Zielsitzung nicht. **Isolierte** Jobs führen einen dedizierten Agent-Turn mit einer frischen Sitzung aus. **Benutzerdefinierte Sitzungen** (`session:xxx`) behalten Kontext über Ausführungen hinweg bei und ermöglichen Workflows wie tägliche Standups, die auf früheren Zusammenfassungen aufbauen.
  </Accordion>
  <Accordion title="What 'fresh session' means for isolated jobs">
    Für isolierte Jobs bedeutet „frische Sitzung“ eine neue Transcript-/Sitzungs-ID für jede Ausführung. OpenClaw kann sichere Präferenzen wie Denk-/Schnell-/Ausführlich-Einstellungen, Labels und explizit vom Benutzer ausgewählte Modell-/Authentifizierungsüberschreibungen übernehmen, erbt aber keinen umgebenden Gesprächskontext aus einer älteren Cron-Zeile: Kanal-/Gruppenrouting, Sende- oder Warteschlangenrichtlinie, Erhöhung, Ursprung oder ACP-Laufzeitbindung. Verwenden Sie `current` oder `session:<id>`, wenn ein wiederkehrender Job bewusst auf demselben Gesprächskontext aufbauen soll.
  </Accordion>
  <Accordion title="Runtime cleanup">
    Für isolierte Jobs umfasst der Laufzeitabbau jetzt Browser-Bereinigung nach bestem Aufwand für diese Cron-Sitzung. Bereinigungsfehler werden ignoriert, damit das eigentliche Cron-Ergebnis weiterhin Vorrang hat.

    Isolierte Cron-Ausführungen entsorgen außerdem alle gebündelten MCP-Laufzeitinstanzen, die für den Job erstellt wurden, über den gemeinsamen Laufzeitbereinigungspfad. Dies entspricht dem Abbau von MCP-Clients der Hauptsitzung und benutzerdefinierter Sitzungen, sodass isolierte Cron-Jobs keine stdio-Kindprozesse oder langlebigen MCP-Verbindungen über Ausführungen hinweg lecken.

  </Accordion>
  <Accordion title="Subagent and Discord delivery">
    Wenn isolierte Cron-Ausführungen Subagents orchestrieren, bevorzugt die Zustellung außerdem die finale Ausgabe des nachgelagerten Laufs gegenüber veraltetem vorläufigem übergeordnetem Text. Wenn nachgelagerte Läufe noch ausgeführt werden, unterdrückt OpenClaw diese teilweise übergeordnete Aktualisierung, statt sie anzukündigen.

    Für reine Text-Ankündigungsziele in Discord sendet OpenClaw den kanonischen finalen Assistententext einmal, statt sowohl gestreamte/zwischenzeitliche Textpayloads als auch die finale Antwort erneut wiederzugeben. Medien und strukturierte Discord-Payloads werden weiterhin als separate Payloads zugestellt, damit Anhänge und Komponenten nicht verworfen werden.

  </Accordion>
</AccordionGroup>

### Payload-Optionen für isolierte Jobs

<ParamField path="--message" type="string" required>
  Prompt-Text (für isolierte Jobs erforderlich).
</ParamField>
<ParamField path="--model" type="string">
  Modellüberschreibung; verwendet das ausgewählte zulässige Modell für den Job.
</ParamField>
<ParamField path="--thinking" type="string">
  Überschreibung des Denklevels.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Workspace-Bootstrap-Dateiinjektion überspringen.
</ParamField>
<ParamField path="--tools" type="string">
  Beschränken, welche Tools der Job verwenden kann, zum Beispiel `--tools exec,read`.
</ParamField>

`--model` verwendet das ausgewählte zulässige Modell als primäres Modell dieses Jobs. Es ist nicht dasselbe wie eine Chat-Sitzungs-Überschreibung mit `/model`: konfigurierte Fallback-Ketten gelten weiterhin, wenn das primäre Job-Modell fehlschlägt. Wenn das angeforderte Modell nicht zulässig ist oder nicht aufgelöst werden kann, lässt Cron die Ausführung mit einem expliziten Validierungsfehler fehlschlagen, statt stillschweigend auf die Agent-/Standardmodellauswahl des Jobs zurückzufallen.

Wenn ältere oder manuell bearbeitete `jobs.json`-Einträge `payload.model` als `"default"`, `"null"`, eine leere Zeichenfolge oder JSON-`null` speichern, führen Sie `openclaw doctor --fix` aus. Doctor entfernt diese ungültigen dauerhaft gespeicherten Überschreibungs-Sentinels; die Laufzeit unterstützt sie nicht als Fallback-Aliasse. Lassen Sie das Modellfeld weg, um die normale Agent-/Standardmodellauswahl zu verwenden.

Cron-Jobs können außerdem Payload-Level-`fallbacks` enthalten. Wenn vorhanden, ersetzt diese Liste die konfigurierte Fallback-Kette für den Job. Verwenden Sie `fallbacks: []` im Job-Payload/API, wenn Sie eine strikte Cron-Ausführung möchten, die nur das ausgewählte Modell versucht. Wenn ein Job `--model`, aber weder Payload- noch konfigurierte Fallbacks hat, übergibt OpenClaw eine explizite leere Fallback-Überschreibung, damit das primäre Agent-Modell nicht als verborgenes zusätzliches Wiederholungsziel angehängt wird.

Die Priorität der Modellauswahl für isolierte Jobs ist:

1. Gmail-Hook-Modellüberschreibung (wenn die Ausführung von Gmail kam und diese Überschreibung zulässig ist)
2. Pro-Job-Payload-`model`
3. Vom Benutzer ausgewählte gespeicherte Cron-Sitzungsmodellüberschreibung
4. Agent-/Standardmodellauswahl

Der Schnellmodus folgt ebenfalls der aufgelösten Live-Auswahl. Wenn die ausgewählte Modellkonfiguration `params.fastMode` hat, verwendet isolierter Cron dies standardmäßig. Eine gespeicherte Sitzungsüberschreibung `fastMode` gewinnt weiterhin in beide Richtungen gegenüber der Konfiguration.

Wenn eine isolierte Ausführung auf eine Live-Modellwechsel-Übergabe trifft, wiederholt Cron mit dem gewechselten Provider/Modell und speichert diese Live-Auswahl für die aktive Ausführung, bevor erneut versucht wird. Wenn der Wechsel auch ein neues Authentifizierungsprofil enthält, speichert Cron diese Authentifizierungsprofilüberschreibung ebenfalls für die aktive Ausführung. Wiederholungen sind begrenzt: Nach dem ersten Versuch plus 2 Wechselwiederholungen bricht Cron ab, statt endlos zu schleifen.

Bevor eine isolierte Cron-Ausführung in den Agent Runner eintritt, prüft OpenClaw erreichbare lokale Provider-Endpunkte für konfigurierte `api: "ollama"`- und `api: "openai-completions"`-Provider, deren `baseUrl` loopback, ein privates Netzwerk oder `.local` ist. Wenn dieser Endpunkt nicht erreichbar ist, wird die Ausführung als `skipped` mit einem klaren Provider-/Modellfehler protokolliert, statt einen Modellaufruf zu starten. Das Endpunktergebnis wird 5 Minuten zwischengespeichert, sodass viele fällige Jobs, die denselben ausgefallenen lokalen Ollama-, vLLM-, SGLang- oder LM Studio-Server verwenden, eine kleine Prüfung teilen, statt einen Anfrageansturm zu erzeugen. Übersprungene Provider-Preflight-Ausführungen erhöhen den Ausführungsfehler-Backoff nicht; aktivieren Sie `failureAlert.includeSkipped`, wenn Sie wiederholte Überspringungsbenachrichtigungen möchten.

## Zustellung und Ausgabe

| Modus      | Was passiert                                                                              |
| ---------- | ------------------------------------------------------------------------------------------ |
| `announce` | Endgültigen Text ersatzweise an das Ziel zustellen, wenn der Agent ihn nicht gesendet hat |
| `webhook`  | Fertiges Event-Payload per POST an eine URL senden                                        |
| `none`     | Keine Runner-Fallback-Zustellung                                                          |

Verwenden Sie `--announce --channel telegram --to "-1001234567890"` für die Kanalzustellung. Verwenden Sie für Telegram-Forumsthemen `-1001234567890:topic:123`; direkte RPC-/Config-Aufrufer können außerdem `delivery.threadId` als Zeichenfolge oder Zahl übergeben. Slack-/Discord-/Mattermost-Ziele sollten explizite Präfixe verwenden (`channel:<id>`, `user:<id>`). Matrix-Raum-IDs beachten Groß-/Kleinschreibung; verwenden Sie die exakte Raum-ID oder die Form `room:!room:server` aus Matrix.

Wenn die Announce-Zustellung `channel: "last"` verwendet oder `channel` auslässt, kann ein Provider-präfigiertes Ziel wie `telegram:123` den Kanal auswählen, bevor Cron auf den Sitzungsverlauf oder einen einzelnen konfigurierten Kanal zurückfällt. Nur Präfixe, die vom geladenen Plugin angekündigt werden, sind Provider-Selektoren. Wenn `delivery.channel` explizit ist, muss das Zielpräfix denselben Provider benennen; zum Beispiel wird `channel: "whatsapp"` mit `to: "telegram:123"` abgelehnt, statt WhatsApp die Telegram-ID als Telefonnummer interpretieren zu lassen. Zielart- und Dienstpräfixe wie `channel:<id>`, `user:<id>`, `imessage:<handle>` und `sms:<number>` bleiben kanaleigene Zielsyntax, keine Provider-Selektoren.

Für isolierte Jobs wird die Chat-Zustellung gemeinsam genutzt. Wenn eine Chat-Route verfügbar ist, kann der Agent das Tool `message` verwenden, auch wenn der Job `--no-deliver` nutzt. Wenn der Agent an das konfigurierte/aktuelle Ziel sendet, überspringt OpenClaw die Fallback-Ankündigung. Andernfalls steuern `announce`, `webhook` und `none` nur, was der Runner nach dem Agent-Durchlauf mit der endgültigen Antwort macht.

Wenn ein Agent aus einem aktiven Chat heraus eine isolierte Erinnerung erstellt, speichert OpenClaw das beibehaltene Live-Zustellungsziel für die Fallback-Ankündigungsroute. Interne Sitzungsschlüssel können kleingeschrieben sein; Provider-Zustellungsziele werden nicht aus diesen Schlüsseln rekonstruiert, wenn der aktuelle Chat-Kontext verfügbar ist.

Die implizite Announce-Zustellung verwendet konfigurierte Kanal-Allowlists, um veraltete Ziele zu validieren und umzuleiten. DM-Genehmigungen aus dem Pairing-Store sind keine Empfänger für Fallback-Automatisierung; legen Sie `delivery.to` fest oder konfigurieren Sie den `allowFrom`-Eintrag des Kanals, wenn ein geplanter Job proaktiv an eine DM senden soll.

Fehlerbenachrichtigungen folgen einem separaten Zielpfad:

- `cron.failureDestination` legt einen globalen Standard für Fehlerbenachrichtigungen fest.
- `job.delivery.failureDestination` überschreibt dies pro Job.
- Wenn keines von beiden festgelegt ist und der Job bereits über `announce` zustellt, fallen Fehlerbenachrichtigungen jetzt auf dieses primäre Announce-Ziel zurück.
- `delivery.failureDestination` wird nur für Jobs mit `sessionTarget="isolated"` unterstützt, es sei denn, der primäre Zustellmodus ist `webhook`.
- `failureAlert.includeSkipped: true` aktiviert für einen Job oder eine globale Cron-Alert-Richtlinie wiederholte Alerts für übersprungene Ausführungen. Übersprungene Ausführungen behalten einen separaten Zähler für aufeinanderfolgende Überspringungen, sodass sie das Backoff bei Ausführungsfehlern nicht beeinflussen.

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

Gateway kann HTTP-Webhook-Endpunkte für externe Trigger bereitstellen. Aktivieren Sie sie in der Config:

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

Jede Anfrage muss das Hook-Token über einen Header enthalten:

- `Authorization: Bearer <token>` (empfohlen)
- `x-openclaw-token: <token>`

Tokens in Query-Strings werden abgelehnt.

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    Stellt ein System-Event für die Hauptsitzung in die Warteschlange:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/wake \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"text":"New email received","mode":"now"}'
    ```

    <ParamField path="text" type="string" required>
      Event-Beschreibung.
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
    Benutzerdefinierte Hook-Namen werden über `hooks.mappings` in der Config aufgelöst. Zuordnungen können beliebige Payloads mit Templates oder Code-Transformationen in `wake`- oder `agent`-Aktionen umwandeln.
  </Accordion>
</AccordionGroup>

<Warning>
Halten Sie Hook-Endpunkte hinter loopback, Tailnet oder einem vertrauenswürdigen Reverse Proxy.

- Verwenden Sie ein dediziertes Hook-Token; verwenden Sie keine Gateway-Auth-Tokens erneut.
- Behalten Sie `hooks.path` auf einem dedizierten Unterpfad; `/` wird abgelehnt.
- Legen Sie `hooks.allowedAgentIds` fest, um explizites `agentId`-Routing zu begrenzen.
- Behalten Sie `hooks.allowRequestSessionKey=false` bei, es sei denn, Sie benötigen vom Aufrufer ausgewählte Sitzungen.
- Wenn Sie `hooks.allowRequestSessionKey` aktivieren, legen Sie auch `hooks.allowedSessionKeyPrefixes` fest, um erlaubte Sitzungsschlüssel-Formen einzuschränken.
- Hook-Payloads werden standardmäßig mit Sicherheitsgrenzen umschlossen.

</Warning>

## Gmail-PubSub-Integration

Verbinden Sie Gmail-Posteingangstrigger über Google PubSub mit OpenClaw.

<Note>
**Voraussetzungen:** `gcloud`-CLI, `gog` (gogcli), aktivierte OpenClaw-Hooks, Tailscale für den öffentlichen HTTPS-Endpunkt.
</Note>

### Assistenteneinrichtung (empfohlen)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Dies schreibt die `hooks.gmail`-Config, aktiviert das Gmail-Preset und verwendet Tailscale Funnel für den Push-Endpunkt.

### Gateway-Autostart

Wenn `hooks.enabled=true` und `hooks.gmail.account` festgelegt ist, startet Gateway beim Booten `gog gmail watch serve` und erneuert die Watch automatisch. Legen Sie `OPENCLAW_SKIP_GMAIL_WATCHER=1` fest, um dies zu deaktivieren.

### Manuelle einmalige Einrichtung

<Steps>
  <Step title="GCP-Projekt auswählen">
    Wählen Sie das GCP-Projekt aus, das den von `gog` verwendeten OAuth-Client besitzt:

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
- Wenn es nicht erlaubt ist oder nicht aufgelöst werden kann, lässt Cron die Ausführung mit einem expliziten Validierungsfehler fehlschlagen.
- Konfigurierte Fallback-Ketten gelten weiterhin, weil Cron `--model` eine primäre Job-Auswahl ist, keine Sitzungsüberschreibung per `/model`.
- Payload `fallbacks` ersetzt konfigurierte Fallbacks für diesen Job; `fallbacks: []` deaktiviert den Fallback und macht die Ausführung strikt.
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

`maxConcurrentRuns` begrenzt sowohl geplante Cron-Dispatches als auch die Ausführung isolierter Agent-Durchläufe. Isolierte Cron-Agent-Durchläufe verwenden intern die dedizierte Ausführungsspur `cron-nested` der Warteschlange. Wenn Sie diesen Wert erhöhen, können unabhängige Cron-LLM-Ausführungen parallel vorankommen, statt nur ihre äußeren Cron-Wrapper zu starten. Die gemeinsam genutzte Nicht-Cron-Spur `nested` wird durch diese Einstellung nicht erweitert.

Der Runtime-State-Sidecar wird aus `cron.store` abgeleitet: Ein `.json`-Store wie `~/clawd/cron/jobs.json` verwendet `~/clawd/cron/jobs-state.json`, während ein Store-Pfad ohne `.json`-Suffix `-state.json` anhängt.

Wenn Sie `jobs.json` manuell bearbeiten, lassen Sie `jobs-state.json` aus der Versionskontrolle heraus. OpenClaw verwendet diesen Sidecar für ausstehende Slots, aktive Marker, Metadaten zur letzten Ausführung und die Zeitplanidentität, die dem Scheduler mitteilt, wann ein extern bearbeiteter Job ein frisches `nextRunAtMs` benötigt.

Cron deaktivieren: `cron.enabled: false` oder `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Wiederholungsverhalten">
    **Einmalige Wiederholung**: Vorübergehende Fehler (Rate Limit, Überlastung, Netzwerk, Serverfehler) werden bis zu 3-mal mit exponentiellem Backoff wiederholt. Permanente Fehler deaktivieren sofort.

    **Wiederkehrende Wiederholung**: Exponentieller Backoff (30s bis 60m) zwischen Wiederholungen. Der Backoff wird nach der nächsten erfolgreichen Ausführung zurückgesetzt.

  </Accordion>
  <Accordion title="Wartung">
    `cron.sessionRetention` (Standard `24h`) bereinigt isolierte Einträge für Ausführungssitzungen. `cron.runLog.maxBytes` / `cron.runLog.keepLines` bereinigen Run-Log-Dateien automatisch.
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
    - Bestätigen Sie, dass Gateway kontinuierlich läuft.
    - Prüfen Sie bei `cron`-Zeitplänen die Zeitzone (`--tz`) im Vergleich zur Host-Zeitzone.
    - `reason: not-due` in der Ausführungsausgabe bedeutet, dass die manuelle Ausführung mit `openclaw cron run <jobId> --due` geprüft wurde und der Job noch nicht fällig war.

  </Accordion>
  <Accordion title="Cron wurde ausgelöst, aber es erfolgte keine Zustellung">
    - Zustellmodus `none` bedeutet, dass kein Fallback-Versand des Runners erwartet wird. Der Agent kann weiterhin direkt mit dem `message`-Tool senden, wenn eine Chat-Route verfügbar ist.
    - Ein fehlendes/ungültiges Zustellungsziel (`channel`/`to`) bedeutet, dass ausgehende Nachrichten übersprungen wurden.
    - Bei Matrix können kopierte oder ältere Jobs mit `delivery.to`-Raum-IDs in Kleinschreibung fehlschlagen, weil Matrix-Raum-IDs zwischen Groß- und Kleinschreibung unterscheiden. Bearbeiten Sie den Job so, dass er den exakten Wert `!room:server` oder `room:!room:server` aus Matrix verwendet.
    - Kanal-Authentifizierungsfehler (`unauthorized`, `Forbidden`) bedeuten, dass die Zustellung durch Anmeldedaten blockiert wurde.
    - Wenn der isolierte Lauf nur das stumme Token (`NO_REPLY` / `no_reply`) zurückgibt, unterdrückt OpenClaw die direkte ausgehende Zustellung und auch den Fallback-Pfad für die eingereihte Zusammenfassung, sodass nichts zurück in den Chat gepostet wird.
    - Wenn der Agent dem Benutzer selbst eine Nachricht senden soll, prüfen Sie, ob der Job eine nutzbare Route hat (`channel: "last"` mit einem vorherigen Chat oder einen expliziten Kanal/ein explizites Ziel).

  </Accordion>
  <Accordion title="Cron oder Heartbeat scheint den /new-style-Rollover zu verhindern">
    - Die Aktualität für tägliche und Leerlauf-Zurücksetzungen basiert nicht auf `updatedAt`; siehe [Sitzungsverwaltung](/de/concepts/session#session-lifecycle).
    - Cron-Aufrufe, Heartbeat-Läufe, Exec-Benachrichtigungen und Gateway-Buchhaltung können die Sitzungszeile für Routing/Status aktualisieren, erweitern aber nicht `sessionStartedAt` oder `lastInteractionAt`.
    - Für ältere Zeilen, die erstellt wurden, bevor diese Felder existierten, kann OpenClaw `sessionStartedAt` aus dem Sitzungs-Header der Transcript-JSONL wiederherstellen, sofern die Datei noch verfügbar ist. Ältere Leerlaufzeilen ohne `lastInteractionAt` verwenden diese wiederhergestellte Startzeit als Leerlauf-Basislinie.

  </Accordion>
  <Accordion title="Fallstricke bei Zeitzonen">
    - Cron ohne `--tz` verwendet die Zeitzone des Gateway-Hosts.
    - `at`-Zeitpläne ohne Zeitzone werden als UTC behandelt.
    - Heartbeat `activeHours` verwendet die konfigurierte Zeitzonenauflösung.

  </Accordion>
</AccordionGroup>

## Verwandte Themen

- [Automatisierung & Aufgaben](/de/automation) — alle Automatisierungsmechanismen auf einen Blick
- [Hintergrundaufgaben](/de/automation/tasks) — Aufgaben-Ledger für Cron-Ausführungen
- [Heartbeat](/de/gateway/heartbeat) — regelmäßige Turns der Hauptsitzung
- [Zeitzone](/de/concepts/timezone) — Zeitzonenkonfiguration
