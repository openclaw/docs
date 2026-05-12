---
read_when:
    - Planen von Hintergrundaufgaben oder Weckvorgängen
    - Externe Trigger (Webhooks, Gmail) in OpenClaw einbinden
    - Entscheidung zwischen Heartbeat und Cron für geplante Aufgaben
sidebarTitle: Scheduled tasks
summary: Geplante Jobs, Webhooks und Gmail-PubSub-Trigger für den Gateway-Scheduler
title: Geplante Aufgaben
x-i18n:
    generated_at: "2026-05-12T00:56:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: a713c6aa2467e3c0331fe94605ba83d542632e5e426e94019d6958ef91da1da3
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron ist der integrierte Scheduler des Gateway. Er persistiert Jobs, weckt den Agent zur richtigen Zeit und kann Ausgaben zurück an einen Chat-Kanal oder einen Webhook-Endpunkt liefern.

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
    openclaw cron get <job-id>
    openclaw cron show <job-id>
    ```
  </Step>
  <Step title="Ausführungsverlauf anzeigen">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## So funktioniert Cron

- Cron läuft **innerhalb des Gateway**-Prozesses (nicht innerhalb des Modells).
- Job-Definitionen werden unter `~/.openclaw/cron/jobs.json` persistiert, damit Zeitpläne bei Neustarts nicht verloren gehen.
- Der Laufzeit-Ausführungszustand wird daneben in `~/.openclaw/cron/jobs-state.json` persistiert. Wenn Sie Cron-Definitionen in Git verfolgen, verfolgen Sie `jobs.json` und nehmen Sie `jobs-state.json` in gitignore auf.
- Nach der Aufteilung können ältere OpenClaw-Versionen `jobs.json` lesen, Jobs aber möglicherweise als neu behandeln, weil Laufzeitfelder jetzt in `jobs-state.json` liegen.
- Wenn `jobs.json` bearbeitet wird, während der Gateway läuft oder gestoppt ist, vergleicht OpenClaw die geänderten Zeitplanfelder mit den ausstehenden Metadaten des Laufzeit-Slots und löscht veraltete `nextRunAtMs`-Werte. Reine Formatierungsänderungen oder Umschreibungen nur der Schlüsselreihenfolge behalten den ausstehenden Slot bei.
- Alle Cron-Ausführungen erstellen Datensätze für [Hintergrundaufgaben](/de/automation/tasks).
- Beim Gateway-Start werden überfällige isolierte Agent-Turn-Jobs außerhalb des Kanalverbindungsfensters neu geplant, statt sofort wiedergegeben zu werden, sodass Discord-/Telegram-Start und Einrichtung nativer Befehle nach Neustarts reaktionsfähig bleiben.
- Einmalige Jobs (`--at`) löschen sich nach erfolgreicher Ausführung standardmäßig automatisch.
- Isolierte Cron-Ausführungen schließen nach bestem Aufwand nachverfolgte Browser-Tabs/-Prozesse für ihre `cron:<jobId>`-Sitzung, wenn die Ausführung abgeschlossen ist, damit getrennte Browser-Automatisierung keine verwaisten Prozesse zurücklässt.
- Isolierte Cron-Ausführungen, die die enge Cron-Selbstbereinigungsfreigabe erhalten, können weiterhin den Scheduler-Status, eine selbst gefilterte Liste ihres aktuellen Jobs und den Ausführungsverlauf dieses Jobs lesen, sodass Status-/Heartbeat-Prüfungen ihren eigenen Zeitplan einsehen können, ohne weitergehenden Zugriff auf Cron-Mutationen zu erhalten.
- Isolierte Cron-Ausführungen schützen außerdem vor veralteten Bestätigungsantworten. Wenn das erste Ergebnis nur eine vorläufige Statusaktualisierung ist (`on it`, `pulling everything together` und ähnliche Hinweise) und keine nachgelagerte Subagent-Ausführung weiterhin für die endgültige Antwort verantwortlich ist, fragt OpenClaw vor der Zustellung einmal erneut nach dem tatsächlichen Ergebnis.
- Isolierte Cron-Ausführungen bevorzugen strukturierte Metadaten zu Ausführungsverweigerungen aus der eingebetteten Ausführung und fallen dann auf bekannte Marker in abschließender Zusammenfassung/Ausgabe wie `SYSTEM_RUN_DENIED` und `INVALID_REQUEST` zurück, damit ein blockierter Befehl nicht als erfolgreiche Ausführung gemeldet wird.
- Isolierte Cron-Ausführungen behandeln außerdem Ausführungsfehler auf Agent-Ebene als Job-Fehler, auch wenn keine Antwortnutzlast erzeugt wird, sodass Modell-/Provider-Fehler Fehlerzähler erhöhen und Fehlerbenachrichtigungen auslösen, statt den Job als erfolgreich abzuschließen.
- Wenn ein isolierter Agent-Turn-Job `timeoutSeconds` erreicht, bricht Cron die zugrunde liegende Agent-Ausführung ab und gibt ihr ein kurzes Bereinigungsfenster. Wenn die Ausführung nicht ausläuft, erzwingt Gateway-eigene Bereinigung das Freigeben der Sitzungszuständigkeit dieser Ausführung, bevor Cron das Timeout aufzeichnet, sodass eingereihte Chat-Arbeit nicht hinter einer veralteten Verarbeitungssitzung zurückbleibt.
- Wenn ein isolierter Agent-Turn vor dem Start des Runners oder vor dem ersten Modellaufruf hängen bleibt, zeichnet Cron ein phasenspezifisches Timeout wie `setup timed out before runner start` oder `stalled before first model call (last phase: context-engine)` auf. Diese Watchdogs decken eingebettete Provider und CLI-gestützte Provider ab, bevor deren externer CLI-Prozess tatsächlich gestartet wird, und sind unabhängig von langen `timeoutSeconds`-Werten begrenzt, damit Kaltstart-/Auth-/Kontextfehler schnell sichtbar werden, statt auf das gesamte Job-Budget zu warten.

<a id="maintenance"></a>

<Note>
Aufgabenabgleich für Cron ist zuerst laufzeitgesteuert und erst danach durch dauerhafte Historie gestützt: Eine aktive Cron-Aufgabe bleibt aktiv, solange die Cron-Laufzeit diesen Job noch als laufend nachverfolgt, selbst wenn noch eine alte untergeordnete Sitzungszeile existiert. Sobald die Laufzeit den Job nicht mehr besitzt und das 5-minütige Kulanzfenster abläuft, prüfen Wartungschecks persistierte Ausführungsprotokolle und den Job-Zustand für die passende `cron:<jobId>:<startedAt>`-Ausführung. Wenn diese dauerhafte Historie ein terminales Ergebnis zeigt, wird das Aufgaben-Ledger daraus finalisiert; andernfalls kann Gateway-eigene Wartung die Aufgabe als `lost` markieren. Offline-CLI-Audit kann aus dauerhafter Historie wiederherstellen, behandelt aber die eigene leere prozessinterne Menge aktiver Jobs nicht als Beweis dafür, dass eine Gateway-eigene Cron-Ausführung verschwunden ist.
</Note>

## Zeitplantypen

| Art     | CLI-Flag  | Beschreibung                                            |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | Einmaliger Zeitstempel (ISO 8601 oder relativ wie `20m`) |
| `every` | `--every` | Festes Intervall                                       |
| `cron`  | `--cron`  | 5-Feld- oder 6-Feld-Cron-Ausdruck mit optionalem `--tz` |

Zeitstempel ohne Zeitzone werden als UTC behandelt. Fügen Sie `--tz America/New_York` für lokale Wanduhr-Zeitplanung hinzu.

Wiederkehrende Ausdrücke zur vollen Stunde werden automatisch um bis zu 5 Minuten gestaffelt, um Lastspitzen zu reduzieren. Verwenden Sie `--exact`, um exaktes Timing zu erzwingen, oder `--stagger 30s` für ein explizites Fenster.

### Tag-des-Monats und Tag-der-Woche verwenden ODER-Logik

Cron-Ausdrücke werden von [croner](https://github.com/Hexagon/croner) geparst. Wenn sowohl die Felder für Tag des Monats als auch Tag der Woche keine Wildcards sind, passt croner, wenn **eines der beiden** Felder passt — nicht beide. Das ist das Standardverhalten von Vixie cron.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Dies wird etwa 5–6 Mal pro Monat ausgelöst statt 0–1 Mal pro Monat. OpenClaw verwendet hier das standardmäßige ODER-Verhalten von Croner. Um beide Bedingungen zu verlangen, verwenden Sie Croners `+`-Tag-der-Woche-Modifikator (`0 9 15 * +1`) oder planen Sie über ein Feld und prüfen Sie das andere im Prompt oder Befehl Ihres Jobs.

## Ausführungsarten

| Stil             | `--session`-Wert   | Läuft in                 | Am besten geeignet für          |
| ---------------- | ------------------ | ------------------------ | ------------------------------- |
| Hauptsitzung     | `main`             | Nächster Heartbeat-Turn  | Erinnerungen, Systemereignisse  |
| Isoliert         | `isolated`         | Dediziertes `cron:<jobId>` | Berichte, Hintergrundarbeiten |
| Aktuelle Sitzung | `current`          | Beim Erstellen gebunden  | Kontextbewusste wiederkehrende Arbeit |
| Benutzerdefinierte Sitzung | `session:custom-id` | Persistente benannte Sitzung | Workflows, die auf Historie aufbauen |

<AccordionGroup>
  <Accordion title="Hauptsitzung vs. isoliert vs. benutzerdefiniert">
    Jobs der **Hauptsitzung** reihen ein Systemereignis ein und wecken optional den Heartbeat (`--wake now` oder `--wake next-heartbeat`). Diese Systemereignisse verlängern nicht die Aktualität für tägliche/Leerlauf-Zurücksetzungen der Zielsitzung. **Isolierte** Jobs führen einen dedizierten Agent-Turn mit einer frischen Sitzung aus. **Benutzerdefinierte Sitzungen** (`session:xxx`) persistieren Kontext über Ausführungen hinweg und ermöglichen Workflows wie tägliche Standups, die auf vorherigen Zusammenfassungen aufbauen.
  </Accordion>
  <Accordion title="Was „frische Sitzung“ für isolierte Jobs bedeutet">
    Für isolierte Jobs bedeutet „frische Sitzung“ eine neue Transcript-/Sitzungs-ID für jede Ausführung. OpenClaw kann sichere Präferenzen wie Denk-/Schnell-/Verbose-Einstellungen, Labels und explizit vom Benutzer ausgewählte Modell-/Auth-Overrides übernehmen, erbt aber keinen Umgebungs-Konversationskontext aus einer älteren Cron-Zeile: Kanal-/Gruppen-Routing, Sende- oder Queue-Richtlinie, Erhöhung, Ursprung oder ACP-Laufzeitbindung. Verwenden Sie `current` oder `session:<id>`, wenn ein wiederkehrender Job absichtlich auf demselben Konversationskontext aufbauen soll.
  </Accordion>
  <Accordion title="Laufzeitbereinigung">
    Für isolierte Jobs umfasst der Laufzeit-Abbau jetzt die Browserbereinigung nach bestem Aufwand für diese Cron-Sitzung. Bereinigungsfehler werden ignoriert, sodass weiterhin das tatsächliche Cron-Ergebnis Vorrang hat.

    Isolierte Cron-Ausführungen entsorgen außerdem alle gebündelten MCP-Laufzeitinstanzen, die für den Job erstellt wurden, über den gemeinsamen Laufzeit-Bereinigungspfad. Dies entspricht der Art, wie MCP-Clients von Hauptsitzungen und benutzerdefinierten Sitzungen abgebaut werden, sodass isolierte Cron-Jobs keine stdio-Kindprozesse oder langlebigen MCP-Verbindungen über Ausführungen hinweg leaken.

  </Accordion>
  <Accordion title="Subagent- und Discord-Zustellung">
    Wenn isolierte Cron-Ausführungen Subagents orchestrieren, bevorzugt die Zustellung ebenfalls die endgültige Ausgabe eines Nachkommen gegenüber veraltetem vorläufigem Text des Elternteils. Wenn Nachkommen noch laufen, unterdrückt OpenClaw diese teilweise Elternaktualisierung, statt sie anzukündigen.

    Für reine Text-Discord-Ankündigungsziele sendet OpenClaw den kanonischen endgültigen Assistant-Text einmal, statt sowohl gestreamte/zwischenzeitliche Textnutzlasten als auch die endgültige Antwort erneut wiederzugeben. Medien und strukturierte Discord-Nutzlasten werden weiterhin als separate Nutzlasten zugestellt, damit Anhänge und Komponenten nicht verworfen werden.

  </Accordion>
</AccordionGroup>

### Nutzlastoptionen für isolierte Jobs

<ParamField path="--message" type="string" required>
  Prompt-Text (für isolierte Jobs erforderlich).
</ParamField>
<ParamField path="--model" type="string">
  Modell-Override; verwendet das ausgewählte erlaubte Modell für den Job.
</ParamField>
<ParamField path="--thinking" type="string">
  Override für Denkstufe.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Workspace-Bootstrap-Dateiinjektion überspringen.
</ParamField>
<ParamField path="--tools" type="string">
  Beschränken, welche Tools der Job verwenden kann, zum Beispiel `--tools exec,read`.
</ParamField>

`--model` verwendet das ausgewählte erlaubte Modell als primäres Modell dieses Jobs. Es ist nicht dasselbe wie ein `/model`-Override einer Chat-Sitzung: Konfigurierte Fallback-Ketten gelten weiterhin, wenn das primäre Job-Modell fehlschlägt. Wenn das angeforderte Modell nicht erlaubt ist oder nicht aufgelöst werden kann, lässt Cron die Ausführung mit einem expliziten Validierungsfehler fehlschlagen, statt still auf die Agent-/Standardmodellauswahl des Jobs zurückzufallen.

Cron-Jobs können außerdem `fallbacks` auf Nutzlastebene tragen. Wenn vorhanden, ersetzt diese Liste die konfigurierte Fallback-Kette für den Job. Verwenden Sie `fallbacks: []` in der Job-Nutzlast/API, wenn Sie eine strikte Cron-Ausführung möchten, die nur das ausgewählte Modell versucht. Wenn ein Job `--model` hat, aber weder Nutzlast- noch konfigurierte Fallbacks, übergibt OpenClaw einen explizit leeren Fallback-Override, sodass das primäre Agent-Modell nicht als verstecktes zusätzliches Wiederholungsziel angehängt wird.

Die Priorität der Modellauswahl für isolierte Jobs ist:

1. Gmail-Hook-Modell-Override (wenn die Ausführung von Gmail kam und dieser Override erlaubt ist)
2. `model` pro Job-Nutzlast
3. Vom Benutzer ausgewählter gespeicherter Cron-Sitzungsmodell-Override
4. Agent-/Standardmodellauswahl

Der schnelle Modus folgt ebenfalls der aufgelösten Live-Auswahl. Wenn die ausgewählte Modellkonfiguration `params.fastMode` hat, verwendet isoliertes Cron dies standardmäßig. Ein gespeicherter Sitzungs-`fastMode`-Override hat weiterhin in beide Richtungen Vorrang vor der Konfiguration.

Wenn eine isolierte Ausführung eine Live-Modellwechsel-Übergabe erreicht, wiederholt Cron mit dem gewechselten Provider/Modell und persistiert diese Live-Auswahl für die aktive Ausführung vor dem erneuten Versuch. Wenn der Wechsel auch ein neues Auth-Profil enthält, persistiert Cron auch diesen Auth-Profil-Override für die aktive Ausführung. Wiederholungen sind begrenzt: Nach dem ersten Versuch plus 2 Wechsel-Wiederholungen bricht Cron ab, statt endlos zu laufen.

Bevor ein isolierter Cron-Lauf in den Agent-Runner eintritt, prüft OpenClaw erreichbare lokale Provider-Endpunkte für konfigurierte `api: "ollama"`- und `api: "openai-completions"`-Provider, deren `baseUrl` Loopback, privates Netzwerk oder `.local` ist. Wenn dieser Endpunkt nicht verfügbar ist, wird der Lauf als `skipped` mit einem klaren Provider-/Modellfehler aufgezeichnet, statt einen Modellaufruf zu starten. Das Endpunktergebnis wird 5 Minuten lang zwischengespeichert, sodass viele fällige Jobs, die denselben nicht erreichbaren lokalen Ollama-, vLLM-, SGLang- oder LM Studio-Server verwenden, eine kleine Probe teilen, statt eine Anfrageflut zu erzeugen. Übersprungene Provider-Preflight-Läufe erhöhen das Execution-Error-Backoff nicht; aktivieren Sie `failureAlert.includeSkipped`, wenn Sie wiederholte Benachrichtigungen über übersprungene Läufe wünschen.

## Zustellung und Ausgabe

| Modus      | Was geschieht                                                      |
| ---------- | ------------------------------------------------------------------ |
| `announce` | Fallback-Zustellung des finalen Texts an das Ziel, wenn der Agent nicht gesendet hat |
| `webhook`  | POST mit Finished-Event-Payload an eine URL                        |
| `none`     | Keine Runner-Fallback-Zustellung                                   |

Verwenden Sie `--announce --channel telegram --to "-1001234567890"` für die Kanalzustellung. Für Telegram-Forumsthemen verwenden Sie `-1001234567890:topic:123`; direkte RPC-/Konfigurationsaufrufer können außerdem `delivery.threadId` als String oder Zahl übergeben. Slack-/Discord-/Mattermost-Ziele sollten explizite Präfixe verwenden (`channel:<id>`, `user:<id>`). Matrix-Raum-IDs beachten Groß-/Kleinschreibung; verwenden Sie die exakte Raum-ID oder die Form `room:!room:server` aus Matrix.

Wenn die Announce-Zustellung `channel: "last"` verwendet oder `channel` auslässt, kann ein mit Provider-Präfix versehenes Ziel wie `telegram:123` den Kanal auswählen, bevor Cron auf den Sitzungsverlauf oder einen einzelnen konfigurierten Kanal zurückfällt. Nur Präfixe, die vom geladenen Plugin bekanntgegeben werden, sind Provider-Selektoren. Wenn `delivery.channel` explizit ist, muss das Zielpräfix denselben Provider benennen; zum Beispiel wird `channel: "whatsapp"` mit `to: "telegram:123"` abgelehnt, statt WhatsApp die Telegram-ID als Telefonnummer interpretieren zu lassen. Zielart- und Dienstpräfixe wie `channel:<id>`, `user:<id>`, `imessage:<handle>` und `sms:<number>` bleiben kanaleigene Zielsyntax, keine Provider-Selektoren.

Für isolierte Jobs wird die Chat-Zustellung geteilt. Wenn eine Chat-Route verfügbar ist, kann der Agent das `message`-Tool auch dann verwenden, wenn der Job `--no-deliver` nutzt. Wenn der Agent an das konfigurierte/aktuelle Ziel sendet, überspringt OpenClaw die Fallback-Announce-Zustellung. Andernfalls steuern `announce`, `webhook` und `none` nur, was der Runner nach dem Agent-Turn mit der finalen Antwort macht.

Wenn ein Agent aus einem aktiven Chat heraus eine isolierte Erinnerung erstellt, speichert OpenClaw das beibehaltene Live-Zustellungsziel für die Fallback-Announce-Route. Interne Sitzungsschlüssel können kleingeschrieben sein; Provider-Zustellungsziele werden nicht aus diesen Schlüsseln rekonstruiert, wenn aktueller Chat-Kontext verfügbar ist.

Implizite Announce-Zustellung verwendet konfigurierte Kanal-Allowlists, um veraltete Ziele zu validieren und umzuleiten. Genehmigungen aus dem DM-Pairing-Store sind keine Empfänger für Fallback-Automatisierung; setzen Sie `delivery.to` oder konfigurieren Sie den `allowFrom`-Eintrag des Kanals, wenn ein geplanter Job proaktiv an eine DM senden soll.

Fehlerbenachrichtigungen folgen einem separaten Zielpfad:

- `cron.failureDestination` legt einen globalen Standard für Fehlerbenachrichtigungen fest.
- `job.delivery.failureDestination` überschreibt diesen pro Job.
- Wenn keines davon gesetzt ist und der Job bereits über `announce` zustellt, fallen Fehlerbenachrichtigungen jetzt auf dieses primäre Announce-Ziel zurück.
- `delivery.failureDestination` wird nur für Jobs mit `sessionTarget="isolated"` unterstützt, sofern der primäre Zustellmodus nicht `webhook` ist.
- `failureAlert.includeSkipped: true` nimmt einen Job oder die globale Cron-Alarmrichtlinie in wiederholte Alerts für übersprungene Läufe auf. Übersprungene Läufe führen einen separaten Zähler für aufeinanderfolgende Überspringungen, sodass sie das Execution-Error-Backoff nicht beeinflussen.

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

Jede Anfrage muss das Hook-Token über einen Header enthalten:

- `Authorization: Bearer <token>` (empfohlen)
- `x-openclaw-token: <token>`

Tokens in Query-Strings werden abgelehnt.

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
    Benutzerdefinierte Hook-Namen werden über `hooks.mappings` in der Konfiguration aufgelöst. Mappings können beliebige Payloads mit Templates oder Code-Transformationen in `wake`- oder `agent`-Aktionen umwandeln.
  </Accordion>
</AccordionGroup>

<Warning>
Halten Sie Hook-Endpunkte hinter Loopback, Tailnet oder einem vertrauenswürdigen Reverse Proxy.

- Verwenden Sie ein dediziertes Hook-Token; verwenden Sie keine Gateway-Auth-Tokens wieder.
- Halten Sie `hooks.path` auf einem dedizierten Unterpfad; `/` wird abgelehnt.
- Setzen Sie `hooks.allowedAgentIds`, um explizites `agentId`-Routing zu begrenzen.
- Belassen Sie `hooks.allowRequestSessionKey=false`, sofern Sie keine vom Aufrufer ausgewählten Sitzungen benötigen.
- Wenn Sie `hooks.allowRequestSessionKey` aktivieren, setzen Sie auch `hooks.allowedSessionKeyPrefixes`, um erlaubte Formen von Sitzungsschlüsseln einzuschränken.
- Hook-Payloads werden standardmäßig mit Sicherheitsgrenzen umschlossen.

</Warning>

## Gmail-PubSub-Integration

Verbinden Sie Gmail-Inbox-Trigger über Google PubSub mit OpenClaw.

<Note>
**Voraussetzungen:** `gcloud`-CLI, `gog` (gogcli), aktivierte OpenClaw-Hooks, Tailscale für den öffentlichen HTTPS-Endpunkt.
</Note>

### Wizard-Einrichtung (empfohlen)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Dies schreibt die `hooks.gmail`-Konfiguration, aktiviert das Gmail-Preset und verwendet Tailscale Funnel für den Push-Endpunkt.

### Gateway-Autostart

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

# Get one stored job as JSON
openclaw cron get <jobId>

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

- `openclaw cron add|edit --model ...` ändert das für den Job ausgewählte Modell.
- Wenn das Modell erlaubt ist, erreicht genau dieser Provider/dieses Modell den isolierten Agent-Lauf.
- Wenn es nicht erlaubt ist oder nicht aufgelöst werden kann, schlägt Cron den Lauf mit einem expliziten Validierungsfehler fehl.
- Konfigurierte Fallback-Ketten gelten weiterhin, weil Cron `--model` ein Job-Primary ist, keine Sitzungsüberschreibung per `/model`.
- Payload-`fallbacks` ersetzt konfigurierte Fallbacks für diesen Job; `fallbacks: []` deaktiviert Fallback und macht den Lauf strikt.
- Ein einfaches `--model` ohne explizite oder konfigurierte Fallback-Liste fällt nicht als stilles zusätzliches Retry-Ziel auf das primäre Agent-Modell durch.

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

`maxConcurrentRuns` begrenzt sowohl die geplante Cron-Ausführung als auch die isolierte Agent-Turn-Ausführung. Isolierte Cron-Agent-Turns verwenden intern die dedizierte `cron-nested`-Ausführungsspur der Warteschlange. Wenn Sie diesen Wert erhöhen, können unabhängige Cron-LLM-Läufe parallel fortschreiten, statt nur ihre äußeren Cron-Wrapper zu starten. Die gemeinsame Nicht-Cron-`nested`-Spur wird durch diese Einstellung nicht erweitert.

Der Runtime-State-Sidecar wird aus `cron.store` abgeleitet: Ein `.json`-Store wie `~/clawd/cron/jobs.json` verwendet `~/clawd/cron/jobs-state.json`, während ein Store-Pfad ohne `.json`-Suffix `-state.json` anhängt.

Wenn Sie `jobs.json` manuell bearbeiten, lassen Sie `jobs-state.json` aus der Versionskontrolle heraus. OpenClaw verwendet diesen Sidecar für ausstehende Slots, aktive Markierungen, Last-Run-Metadaten und die Schedule-Identität, die dem Scheduler mitteilt, wann ein extern bearbeiteter Job ein frisches `nextRunAtMs` benötigt.

Cron deaktivieren: `cron.enabled: false` oder `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Retry behavior">
    **Einmaliger Retry**: Vorübergehende Fehler (Rate Limit, Überlastung, Netzwerk, Serverfehler) werden bis zu 3 Mal mit exponentiellem Backoff erneut versucht. Dauerhafte Fehler deaktivieren sofort.

    **Wiederkehrender Retry**: exponentieller Backoff (30 s bis 60 min) zwischen Retries. Backoff wird nach dem nächsten erfolgreichen Lauf zurückgesetzt.

  </Accordion>
  <Accordion title="Wartung">
    `cron.sessionRetention` (Standard `24h`) bereinigt isolierte Run-Session-Einträge. `cron.runLog.maxBytes` / `cron.runLog.keepLines` bereinigen Run-Log-Dateien automatisch.
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
  <Accordion title="Cron wird nicht ausgelöst">
    - Prüfen Sie `cron.enabled` und die Umgebungsvariable `OPENCLAW_SKIP_CRON`.
    - Bestätigen Sie, dass der Gateway kontinuierlich läuft.
    - Prüfen Sie bei `cron`-Zeitplänen die Zeitzone (`--tz`) im Vergleich zur Host-Zeitzone.
    - `reason: not-due` in der Ausführungsausgabe bedeutet, dass eine manuelle Ausführung mit `openclaw cron run <jobId> --due` geprüft wurde und der Job noch nicht fällig war.

  </Accordion>
  <Accordion title="Cron wurde ausgelöst, aber es erfolgt keine Zustellung">
    - Der Zustellmodus `none` bedeutet, dass kein Runner-Fallback-Versand erwartet wird. Der Agent kann weiterhin direkt mit dem `message`-Tool senden, wenn eine Chat-Route verfügbar ist.
    - Fehlendes/ungültiges Zustellziel (`channel`/`to`) bedeutet, dass ausgehende Zustellung übersprungen wurde.
    - Bei Matrix können kopierte oder Legacy-Jobs mit kleingeschriebenen `delivery.to`-Raum-IDs fehlschlagen, weil Matrix-Raum-IDs zwischen Groß- und Kleinschreibung unterscheiden. Bearbeiten Sie den Job auf den exakten Wert `!room:server` oder `room:!room:server` aus Matrix.
    - Kanal-Authentifizierungsfehler (`unauthorized`, `Forbidden`) bedeuten, dass die Zustellung durch Anmeldedaten blockiert wurde.
    - Wenn die isolierte Ausführung nur das stille Token (`NO_REPLY` / `no_reply`) zurückgibt, unterdrückt OpenClaw die direkte ausgehende Zustellung und auch den Fallback-Pfad mit der eingereihten Zusammenfassung, sodass nichts zurück in den Chat gepostet wird.
    - Wenn der Agent dem Benutzer selbst eine Nachricht senden soll, prüfen Sie, ob der Job eine nutzbare Route hat (`channel: "last"` mit einem vorherigen Chat oder einen expliziten Kanal/ein explizites Ziel).

  </Accordion>
  <Accordion title="Cron oder Heartbeat scheint /new-artigen Wechsel zu verhindern">
    - Die Aktualität für tägliche und Leerlauf-Zurücksetzungen basiert nicht auf `updatedAt`; siehe [Sitzungsverwaltung](/de/concepts/session#session-lifecycle).
    - Cron-Wakeups, Heartbeat-Ausführungen, Exec-Benachrichtigungen und Gateway-Buchhaltung können die Sitzungszeile für Routing/Status aktualisieren, erweitern aber nicht `sessionStartedAt` oder `lastInteractionAt`.
    - Bei Legacy-Zeilen, die erstellt wurden, bevor diese Felder existierten, kann OpenClaw `sessionStartedAt` aus dem JSONL-Sitzungsheader des Transkripts wiederherstellen, wenn die Datei noch verfügbar ist. Legacy-Leerlaufzeilen ohne `lastInteractionAt` verwenden diese wiederhergestellte Startzeit als ihre Leerlauf-Baseline.

  </Accordion>
  <Accordion title="Fallstricke bei Zeitzonen">
    - Cron ohne `--tz` verwendet die Zeitzone des Gateway-Hosts.
    - `at`-Zeitpläne ohne Zeitzone werden als UTC behandelt.
    - Heartbeat `activeHours` verwendet die konfigurierte Zeitzonenauflösung.

  </Accordion>
</AccordionGroup>

## Verwandte Themen

- [Automatisierung](/de/automation) — alle Automatisierungsmechanismen auf einen Blick
- [Hintergrundaufgaben](/de/automation/tasks) — Aufgaben-Ledger für Cron-Ausführungen
- [Heartbeat](/de/gateway/heartbeat) — regelmäßige Turns der Hauptsitzung
- [Zeitzone](/de/concepts/timezone) — Zeitzonenkonfiguration
