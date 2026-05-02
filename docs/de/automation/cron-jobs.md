---
read_when:
    - Planen von Hintergrundaufgaben oder Weckereignissen
    - Externe Trigger (Webhooks, Gmail) in OpenClaw einbinden
    - Zwischen Heartbeat und Cron für geplante Aufgaben entscheiden
sidebarTitle: Scheduled tasks
summary: Geplante Jobs, Webhooks und Gmail-PubSub-Trigger für den Gateway-Scheduler
title: Geplante Aufgaben
x-i18n:
    generated_at: "2026-05-02T20:41:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: d7c70042c28b08140d664678ef42146942158512dce1f41c988be0f2dd9bedf5
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron ist der integrierte Scheduler des Gateways. Er speichert Jobs dauerhaft, weckt den Agenten zum richtigen Zeitpunkt und kann Ausgaben zurück an einen Chat-Kanal oder einen Webhook-Endpunkt liefern.

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
  <Step title="Ausführungshistorie anzeigen">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## Funktionsweise von Cron

- Cron läuft **innerhalb des Gateway**-Prozesses (nicht innerhalb des Modells).
- Job-Definitionen werden unter `~/.openclaw/cron/jobs.json` dauerhaft gespeichert, sodass Zeitpläne bei Neustarts nicht verloren gehen.
- Der Laufzeit-Ausführungsstatus wird daneben in `~/.openclaw/cron/jobs-state.json` gespeichert. Wenn Sie Cron-Definitionen in Git verfolgen, verfolgen Sie `jobs.json` und nehmen Sie `jobs-state.json` in Gitignore auf.
- Nach der Aufteilung können ältere OpenClaw-Versionen `jobs.json` lesen, Jobs aber möglicherweise als neu behandeln, weil Laufzeitfelder jetzt in `jobs-state.json` liegen.
- Wenn `jobs.json` bearbeitet wird, während das Gateway läuft oder gestoppt ist, vergleicht OpenClaw die geänderten Zeitplanfelder mit ausstehenden Laufzeit-Slot-Metadaten und löscht veraltete `nextRunAtMs`-Werte. Reine Formatierungsänderungen oder Umschreibungen, die nur die Schlüsselreihenfolge betreffen, behalten den ausstehenden Slot bei.
- Alle Cron-Ausführungen erstellen Datensätze für [Hintergrundaufgaben](/de/automation/tasks).
- Beim Gateway-Start werden überfällige isolierte Agent-Turn-Jobs aus dem Kanalverbindungsfenster heraus neu geplant, statt sofort erneut abgespielt zu werden, sodass Discord/Telegram-Start und native Befehlseinrichtung nach Neustarts reaktionsfähig bleiben.
- Einmalige Jobs (`--at`) werden nach erfolgreicher Ausführung standardmäßig automatisch gelöscht.
- Isolierte Cron-Ausführungen schließen nach bestem Aufwand verfolgte Browser-Tabs/-Prozesse für ihre `cron:<jobId>`-Sitzung, wenn die Ausführung abgeschlossen ist, sodass abgekoppelte Browserautomatisierung keine verwaisten Prozesse zurücklässt.
- Isolierte Cron-Ausführungen schützen außerdem vor veralteten Bestätigungsantworten. Wenn das erste Ergebnis nur eine zwischenzeitliche Statusaktualisierung ist (`on it`, `pulling everything together` und ähnliche Hinweise) und keine nachgelagerte Subagent-Ausführung noch für die endgültige Antwort verantwortlich ist, fordert OpenClaw einmal erneut das tatsächliche Ergebnis vor der Zustellung an.
- Isolierte Cron-Ausführungen bevorzugen strukturierte Metadaten zu Ausführungsverweigerungen aus der eingebetteten Ausführung und fallen dann auf bekannte finale Zusammenfassungs-/Ausgabemarker wie `SYSTEM_RUN_DENIED` und `INVALID_REQUEST` zurück, sodass ein blockierter Befehl nicht als erfolgreiche Ausführung gemeldet wird.
- Isolierte Cron-Ausführungen behandeln außerdem Fehler auf Ausführungsebene des Agenten als Job-Fehler, selbst wenn keine Antwortnutzlast erzeugt wird, sodass Modell-/Provider-Fehler Fehlerzähler erhöhen und Fehlerbenachrichtigungen auslösen, statt den Job als erfolgreich abzuschließen.
- Wenn ein isolierter Agent-Turn-Job `timeoutSeconds` erreicht, bricht Cron die zugrunde liegende Agent-Ausführung ab und gibt ihr ein kurzes Bereinigungsfenster. Wenn die Ausführung nicht ausläuft, erzwingt Gateway-eigene Bereinigung die Freigabe der Sitzungszuordnung dieser Ausführung, bevor Cron den Timeout protokolliert, sodass wartende Chat-Arbeit nicht hinter einer veralteten Verarbeitungssitzung zurückbleibt.

<a id="maintenance"></a>

<Note>
Der Aufgabenabgleich für Cron ist zuerst laufzeiteigen und danach durch dauerhafte Historie gestützt: Eine aktive Cron-Aufgabe bleibt live, solange die Cron-Laufzeit diesen Job noch als laufend verfolgt, selbst wenn noch eine alte untergeordnete Sitzungszeile existiert. Sobald die Laufzeit den Job nicht mehr besitzt und das 5-minütige Kulanzfenster abläuft, prüft die Wartung gespeicherte Ausführungsprotokolle und den Job-Status für die passende `cron:<jobId>:<startedAt>`-Ausführung. Wenn diese dauerhafte Historie ein terminales Ergebnis zeigt, wird das Aufgabenbuch daraus finalisiert; andernfalls kann Gateway-eigene Wartung die Aufgabe als `lost` markieren. Die Offline-CLI-Prüfung kann aus dauerhafter Historie wiederherstellen, behandelt aber die eigene leere In-Process-Menge aktiver Jobs nicht als Beweis dafür, dass eine Gateway-eigene Cron-Ausführung verschwunden ist.
</Note>

## Zeitplantypen

| Art     | CLI-Flag  | Beschreibung                                                   |
| ------- | --------- | -------------------------------------------------------------- |
| `at`    | `--at`    | Einmaliger Zeitstempel (ISO 8601 oder relativ wie `20m`)       |
| `every` | `--every` | Festes Intervall                                               |
| `cron`  | `--cron`  | 5-Feld- oder 6-Feld-Cron-Ausdruck mit optionalem `--tz`        |

Zeitstempel ohne Zeitzone werden als UTC behandelt. Fügen Sie `--tz America/New_York` für lokale Wanduhr-Planung hinzu.

Wiederkehrende Ausdrücke zur vollen Stunde werden automatisch um bis zu 5 Minuten versetzt, um Lastspitzen zu reduzieren. Verwenden Sie `--exact`, um präzises Timing zu erzwingen, oder `--stagger 30s` für ein explizites Fenster.

### Tag-des-Monats und Wochentag verwenden ODER-Logik

Cron-Ausdrücke werden von [croner](https://github.com/Hexagon/croner) geparst. Wenn sowohl das Tag-des-Monats- als auch das Wochentagsfeld keine Wildcards sind, stimmt croner überein, wenn **eines** der Felder übereinstimmt, nicht beide. Das ist das Standardverhalten von Vixie cron.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Dies wird etwa 5–6 Mal pro Monat ausgelöst statt 0–1 Mal pro Monat. OpenClaw verwendet hier Croners standardmäßiges ODER-Verhalten. Um beide Bedingungen zu verlangen, verwenden Sie Croners `+`-Wochentagsmodifikator (`0 9 15 * +1`) oder planen Sie nach einem Feld und prüfen Sie das andere im Prompt oder Befehl Ihres Jobs.

## Ausführungsstile

| Stil             | `--session`-Wert   | Läuft in                 | Am besten für                               |
| ---------------- | ------------------ | ------------------------ | ------------------------------------------ |
| Hauptsitzung     | `main`             | Nächster Heartbeat-Turn  | Erinnerungen, Systemereignisse             |
| Isoliert         | `isolated`         | Dediziertes `cron:<jobId>` | Berichte, Hintergrundarbeiten            |
| Aktuelle Sitzung | `current`          | Bei Erstellung gebunden  | Kontextbewusste wiederkehrende Arbeit      |
| Benutzerdefinierte Sitzung | `session:custom-id` | Persistente benannte Sitzung | Workflows, die auf Historie aufbauen |

<AccordionGroup>
  <Accordion title="Hauptsitzung vs. isoliert vs. benutzerdefiniert">
    Jobs in der **Hauptsitzung** reihen ein Systemereignis ein und wecken optional den Heartbeat (`--wake now` oder `--wake next-heartbeat`). Diese Systemereignisse verlängern die Frische für tägliche/Leerlauf-Resets der Zielsitzung nicht. **Isolierte** Jobs führen einen dedizierten Agent-Turn mit einer frischen Sitzung aus. **Benutzerdefinierte Sitzungen** (`session:xxx`) behalten Kontext über Ausführungen hinweg bei und ermöglichen Workflows wie tägliche Standups, die auf früheren Zusammenfassungen aufbauen.
  </Accordion>
  <Accordion title="Was „frische Sitzung“ für isolierte Jobs bedeutet">
    Für isolierte Jobs bedeutet „frische Sitzung“ eine neue Transkript-/Sitzungs-ID für jede Ausführung. OpenClaw kann sichere Präferenzen wie Thinking-/Fast-/Verbose-Einstellungen, Labels und explizit vom Benutzer ausgewählte Modell-/Auth-Overrides übernehmen, erbt aber keinen umgebenden Gesprächskontext aus einer älteren Cron-Zeile: Kanal-/Gruppen-Routing, Sende- oder Warteschlangenrichtlinie, Erhöhung, Ursprung oder ACP-Laufzeitbindung. Verwenden Sie `current` oder `session:<id>`, wenn ein wiederkehrender Job bewusst auf demselben Gesprächskontext aufbauen soll.
  </Accordion>
  <Accordion title="Laufzeitbereinigung">
    Für isolierte Jobs umfasst der Laufzeitabbau jetzt eine Best-Effort-Browserbereinigung für diese Cron-Sitzung. Bereinigungsfehler werden ignoriert, damit das tatsächliche Cron-Ergebnis weiterhin Vorrang hat.

    Isolierte Cron-Ausführungen entsorgen außerdem alle gebündelten MCP-Laufzeitinstanzen, die für den Job erstellt wurden, über den gemeinsamen Laufzeitbereinigungspfad. Das entspricht dem Abbau von MCP-Clients für Hauptsitzungen und benutzerdefinierte Sitzungen, sodass isolierte Cron-Jobs keine stdio-Kindprozesse oder langlebigen MCP-Verbindungen über Ausführungen hinweg zurücklassen.

  </Accordion>
  <Accordion title="Subagent- und Discord-Zustellung">
    Wenn isolierte Cron-Ausführungen Subagents orchestrieren, bevorzugt die Zustellung ebenfalls die finale Ausgabe eines Nachkommen gegenüber veraltetem vorläufigem Text des Elternlaufs. Wenn Nachkommen noch laufen, unterdrückt OpenClaw diese teilweise Elternaktualisierung, statt sie anzukündigen.

    Für reine Text-Discord-Ankündigungsziele sendet OpenClaw den kanonischen finalen Assistententext einmal, statt sowohl gestreamte/zwischenzeitliche Textnutzlasten als auch die finale Antwort erneut abzuspielen. Medien und strukturierte Discord-Nutzlasten werden weiterhin als separate Nutzlasten zugestellt, damit Anhänge und Komponenten nicht verworfen werden.

  </Accordion>
</AccordionGroup>

### Nutzlastoptionen für isolierte Jobs

<ParamField path="--message" type="string" required>
  Prompt-Text (für isoliert erforderlich).
</ParamField>
<ParamField path="--model" type="string">
  Modell-Override; verwendet das ausgewählte erlaubte Modell für den Job.
</ParamField>
<ParamField path="--thinking" type="string">
  Thinking-Level-Override.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Überspringt die Injektion von Workspace-Bootstrap-Dateien.
</ParamField>
<ParamField path="--tools" type="string">
  Schränkt ein, welche Tools der Job verwenden kann, zum Beispiel `--tools exec,read`.
</ParamField>

`--model` verwendet das ausgewählte erlaubte Modell als primäres Modell dieses Jobs. Es ist nicht dasselbe wie ein Chat-Sitzungs-`/model`-Override: Konfigurierte Fallback-Ketten gelten weiterhin, wenn das primäre Job-Modell fehlschlägt. Wenn das angeforderte Modell nicht erlaubt ist oder nicht aufgelöst werden kann, lässt Cron die Ausführung mit einem expliziten Validierungsfehler fehlschlagen, statt stillschweigend auf die Agent-/Standardmodellauswahl des Jobs zurückzufallen.

Cron-Jobs können außerdem `fallbacks` auf Nutzlastebene enthalten. Wenn vorhanden, ersetzt diese Liste die konfigurierte Fallback-Kette für den Job. Verwenden Sie `fallbacks: []` in der Job-Nutzlast/API, wenn Sie eine strikte Cron-Ausführung möchten, die nur das ausgewählte Modell versucht. Wenn ein Job `--model`, aber weder Nutzlast- noch konfigurierte Fallbacks hat, übergibt OpenClaw einen explizit leeren Fallback-Override, damit das primäre Agent-Modell nicht als verstecktes zusätzliches Wiederholungsziel angehängt wird.

Die Modell-Auswahlpriorität für isolierte Jobs lautet:

1. Gmail-Hook-Modell-Override (wenn die Ausführung von Gmail kam und dieser Override erlaubt ist)
2. Pro-Job-Nutzlast `model`
3. Vom Benutzer ausgewählter gespeicherter Cron-Sitzungsmodell-Override
4. Agent-/Standardmodellauswahl

Fast Mode folgt ebenfalls der aufgelösten Live-Auswahl. Wenn die ausgewählte Modellkonfiguration `params.fastMode` hat, verwendet isoliertes Cron dies standardmäßig. Ein gespeicherter Sitzungs-`fastMode`-Override hat weiterhin Vorrang vor der Konfiguration, in beide Richtungen.

Wenn eine isolierte Ausführung auf eine Live-Modellwechsel-Übergabe trifft, wiederholt Cron mit dem gewechselten Provider/Modell und speichert diese Live-Auswahl für die aktive Ausführung, bevor erneut versucht wird. Wenn der Wechsel auch ein neues Auth-Profil enthält, speichert Cron diesen Auth-Profil-Override ebenfalls für die aktive Ausführung. Wiederholungen sind begrenzt: Nach dem ersten Versuch plus 2 Wechsel-Wiederholungen bricht Cron ab, statt endlos zu schleifen.

Bevor eine isolierte Cron-Ausführung in den Agent Runner eintritt, prüft OpenClaw erreichbare lokale Provider-Endpunkte für konfigurierte `api: "ollama"`- und `api: "openai-completions"`-Provider, deren `baseUrl` loopback, privates Netzwerk oder `.local` ist. Wenn dieser Endpunkt nicht verfügbar ist, wird die Ausführung mit einem klaren Provider-/Modellfehler als `skipped` protokolliert, statt einen Modellaufruf zu starten. Das Endpunktergebnis wird 5 Minuten zwischengespeichert, sodass viele fällige Jobs, die denselben ausgefallenen lokalen Ollama-, vLLM-, SGLang- oder LM Studio-Server verwenden, eine kleine Probe teilen, statt einen Anfragesturm zu erzeugen. Übersprungene Provider-Preflight-Ausführungen erhöhen das Backoff für Ausführungsfehler nicht; aktivieren Sie `failureAlert.includeSkipped`, wenn Sie wiederholte Übersprungsbenachrichtigungen wünschen.

## Zustellung und Ausgabe

| Modus      | Was passiert                                                       |
| ---------- | ------------------------------------------------------------------ |
| `announce` | Liefert finalen Text als Fallback an das Ziel, wenn der Agent nicht gesendet hat |
| `webhook`  | Sendet fertige Ereignisnutzlast per POST an eine URL               |
| `none`     | Keine Runner-Fallback-Zustellung                                   |

Verwenden Sie `--announce --channel telegram --to "-1001234567890"` für die Kanalzustellung. Verwenden Sie für Telegram-Forumthemen `-1001234567890:topic:123`; direkte RPC-/Konfigurationsaufrufer können auch `delivery.threadId` als Zeichenfolge oder Zahl übergeben. Slack-/Discord-/Mattermost-Ziele sollten explizite Präfixe verwenden (`channel:<id>`, `user:<id>`). Matrix-Raum-IDs beachten Groß-/Kleinschreibung; verwenden Sie die exakte Raum-ID oder die Form `room:!room:server` aus Matrix.

Wenn die Ankündigungszustellung `channel: "last"` verwendet oder `channel` auslässt, kann ein Ziel mit Provider-Präfix wie `telegram:123` den Kanal auswählen, bevor Cron auf den Sitzungsverlauf oder einen einzelnen konfigurierten Kanal zurückfällt. Nur Präfixe, die vom geladenen Plugin angekündigt werden, sind Provider-Selektoren. Wenn `delivery.channel` explizit ist, muss das Zielpräfix denselben Provider benennen; zum Beispiel wird `channel: "whatsapp"` mit `to: "telegram:123"` abgelehnt, statt WhatsApp die Telegram-ID als Telefonnummer interpretieren zu lassen. Zielart- und Dienstpräfixe wie `channel:<id>`, `user:<id>`, `imessage:<handle>` und `sms:<number>` bleiben kanaleigene Zielsyntax, keine Provider-Selektoren.

Für isolierte Jobs wird die Chat-Zustellung geteilt. Wenn eine Chat-Route verfügbar ist, kann der Agent das `message`-Tool verwenden, selbst wenn der Job `--no-deliver` nutzt. Wenn der Agent an das konfigurierte/aktuelle Ziel sendet, überspringt OpenClaw die Fallback-Ankündigung. Andernfalls steuern `announce`, `webhook` und `none` nur, was der Runner nach dem Agent-Durchlauf mit der finalen Antwort macht.

Wenn ein Agent aus einem aktiven Chat eine isolierte Erinnerung erstellt, speichert OpenClaw das beibehaltene Live-Zustellziel für die Fallback-Ankündigungsroute. Interne Sitzungsschlüssel können klein geschrieben sein; Provider-Zustellziele werden nicht aus diesen Schlüsseln rekonstruiert, wenn aktueller Chat-Kontext verfügbar ist.

Implizite Ankündigungszustellung verwendet konfigurierte Kanal-Allowlists, um veraltete Ziele zu validieren und umzuleiten. DM-Genehmigungen aus dem Pairing-Store sind keine Empfänger für Fallback-Automatisierung; setzen Sie `delivery.to` oder konfigurieren Sie den `allowFrom`-Eintrag des Kanals, wenn ein geplanter Job proaktiv an eine DM senden soll.

Fehlerbenachrichtigungen folgen einem separaten Zielpfad:

- `cron.failureDestination` legt einen globalen Standard für Fehlerbenachrichtigungen fest.
- `job.delivery.failureDestination` überschreibt diesen pro Job.
- Wenn keines von beiden gesetzt ist und der Job bereits über `announce` zustellt, fallen Fehlerbenachrichtigungen jetzt auf dieses primäre Ankündigungsziel zurück.
- `delivery.failureDestination` wird nur bei Jobs mit `sessionTarget="isolated"` unterstützt, außer der primäre Zustellmodus ist `webhook`.
- `failureAlert.includeSkipped: true` aktiviert für einen Job oder eine globale Cron-Alarmrichtlinie wiederholte Warnungen zu übersprungenen Läufen. Übersprungene Läufe behalten einen separaten Zähler für aufeinanderfolgende Überspringungen, sodass sie den Backoff für Ausführungsfehler nicht beeinflussen.

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

Gateway kann HTTP-Webhook-Endpunkte für externe Auslöser bereitstellen. Aktivieren Sie dies in der Konfiguration:

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

Query-String-Token werden abgelehnt.

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
  <Accordion title="Mapped hooks (POST /hooks/<name>)">
    Benutzerdefinierte Hook-Namen werden über `hooks.mappings` in der Konfiguration aufgelöst. Mappings können beliebige Payloads mit Templates oder Code-Transformationen in `wake`- oder `agent`-Aktionen umwandeln.
  </Accordion>
</AccordionGroup>

<Warning>
Halten Sie Hook-Endpunkte hinter loopback, tailnet oder einem vertrauenswürdigen Reverse-Proxy.

- Verwenden Sie ein dediziertes Hook-Token; verwenden Sie Gateway-Authentifizierungstoken nicht erneut.
- Belassen Sie `hooks.path` auf einem dedizierten Unterpfad; `/` wird abgelehnt.
- Setzen Sie `hooks.allowedAgentIds`, um explizites `agentId`-Routing zu begrenzen.
- Belassen Sie `hooks.allowRequestSessionKey=false`, sofern Sie keine vom Aufrufer ausgewählten Sitzungen benötigen.
- Wenn Sie `hooks.allowRequestSessionKey` aktivieren, setzen Sie auch `hooks.allowedSessionKeyPrefixes`, um zulässige Sitzungsschlüsselformen einzuschränken.
- Hook-Payloads werden standardmäßig mit Sicherheitsgrenzen umschlossen.

</Warning>

## Gmail-PubSub-Integration

Verbinden Sie Gmail-Posteingangsauslöser über Google PubSub mit OpenClaw.

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
- Wenn das Modell erlaubt ist, erreicht exakt dieser Provider/dieses Modell den isolierten Agent-Durchlauf.
- Wenn es nicht erlaubt ist oder nicht aufgelöst werden kann, lässt Cron den Lauf mit einem expliziten Validierungsfehler fehlschlagen.
- Konfigurierte Fallback-Ketten gelten weiterhin, da Cron `--model` ein Job-Primärmodell ist, keine Sitzungsüberschreibung per `/model`.
- Payload `fallbacks` ersetzt konfigurierte Fallbacks für diesen Job; `fallbacks: []` deaktiviert Fallbacks und macht den Lauf strikt.
- Ein einfaches `--model` ohne explizite oder konfigurierte Fallback-Liste fällt nicht stillschweigend auf das primäre Agent-Modell als zusätzliches Wiederholungsziel durch.

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

`maxConcurrentRuns` begrenzt sowohl die geplante Cron-Dispatch-Ausführung als auch die Ausführung isolierter Agent-Durchläufe. Isolierte Cron-Agent-Durchläufe verwenden intern die dedizierte Ausführungsspur `cron-nested` der Warteschlange, sodass eine Erhöhung dieses Werts unabhängige Cron-LLM-Läufe parallel voranschreiten lässt, statt nur ihre äußeren Cron-Wrapper zu starten. Die gemeinsame Nicht-Cron-Spur `nested` wird durch diese Einstellung nicht erweitert.

Der Runtime-State-Sidecar wird aus `cron.store` abgeleitet: Ein `.json`-Store wie `~/clawd/cron/jobs.json` verwendet `~/clawd/cron/jobs-state.json`, während ein Store-Pfad ohne `.json`-Suffix `-state.json` anhängt.

Wenn Sie `jobs.json` manuell bearbeiten, lassen Sie `jobs-state.json` aus der Versionsverwaltung heraus. OpenClaw verwendet diesen Sidecar für ausstehende Slots, aktive Marker, Metadaten zum letzten Lauf und die Planungsidentität, die dem Scheduler mitteilt, wann ein extern bearbeiteter Job ein frisches `nextRunAtMs` benötigt.

Cron deaktivieren: `cron.enabled: false` oder `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Retry behavior">
    **Einmalige Wiederholung**: Temporäre Fehler (Ratenlimit, Überlastung, Netzwerk, Serverfehler) werden bis zu 3-mal mit exponentiellem Backoff wiederholt. Permanente Fehler deaktivieren sofort.

    **Wiederkehrende Wiederholung**: exponentieller Backoff (30 s bis 60 m) zwischen Wiederholungen. Der Backoff wird nach dem nächsten erfolgreichen Lauf zurückgesetzt.

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
  <Accordion title="Cron not firing">
    - Prüfen Sie `cron.enabled` und die Umgebungsvariable `OPENCLAW_SKIP_CRON`.
    - Bestätigen Sie, dass der Gateway kontinuierlich läuft.
    - Prüfen Sie bei `cron`-Zeitplänen die Zeitzone (`--tz`) im Vergleich zur Host-Zeitzone.
    - `reason: not-due` in der Laufausgabe bedeutet, dass der manuelle Lauf mit `openclaw cron run <jobId> --due` geprüft wurde und der Job noch nicht fällig war.

  </Accordion>
  <Accordion title="Cron wurde ausgelöst, aber keine Zustellung erfolgte">
    - Zustellmodus `none` bedeutet, dass kein Runner-Fallback-Versand erwartet wird. Der Agent kann weiterhin direkt mit dem `message`-Tool senden, wenn eine Chat-Route verfügbar ist.
    - Ein fehlendes/ungültiges Zustellziel (`channel`/`to`) bedeutet, dass ausgehende Nachrichten übersprungen wurden.
    - Bei Matrix können kopierte oder Legacy-Jobs mit kleingeschriebenen `delivery.to`-Raum-IDs fehlschlagen, weil Matrix-Raum-IDs zwischen Groß- und Kleinschreibung unterscheiden. Bearbeiten Sie den Job auf den exakten Wert `!room:server` oder `room:!room:server` aus Matrix.
    - Channel-Authentifizierungsfehler (`unauthorized`, `Forbidden`) bedeuten, dass die Zustellung durch Zugangsdaten blockiert wurde.
    - Wenn der isolierte Lauf nur das stille Token (`NO_REPLY` / `no_reply`) zurückgibt, unterdrückt OpenClaw die direkte ausgehende Zustellung und auch den Fallback-Pfad für die eingereihte Zusammenfassung, sodass nichts zurück in den Chat gepostet wird.
    - Wenn der Agent dem Benutzer selbst eine Nachricht senden soll, prüfen Sie, ob der Job eine nutzbare Route hat (`channel: "last"` mit einem vorherigen Chat oder einen expliziten Channel/ein explizites Ziel).

  </Accordion>
  <Accordion title="Cron oder Heartbeat scheint /new-style-Rollover zu verhindern">
    - Die Aktualität für tägliche und Leerlauf-Zurücksetzungen basiert nicht auf `updatedAt`; siehe [Sitzungsverwaltung](/de/concepts/session#session-lifecycle).
    - Cron-Weckrufe, Heartbeat-Läufe, Exec-Benachrichtigungen und Gateway-Buchhaltung können die Sitzungszeile für Routing/Status aktualisieren, verlängern aber weder `sessionStartedAt` noch `lastInteractionAt`.
    - Für Legacy-Zeilen, die erstellt wurden, bevor diese Felder existierten, kann OpenClaw `sessionStartedAt` aus dem JSONL-Sitzungsheader des Transkripts wiederherstellen, wenn die Datei noch verfügbar ist. Legacy-Leerlaufzeilen ohne `lastInteractionAt` verwenden diese wiederhergestellte Startzeit als Leerlauf-Basiswert.

  </Accordion>
  <Accordion title="Stolperfallen bei Zeitzonen">
    - Cron ohne `--tz` verwendet die Zeitzone des Gateway-Hosts.
    - `at`-Zeitpläne ohne Zeitzone werden als UTC behandelt.
    - Heartbeat-`activeHours` verwendet die konfigurierte Zeitzonenauflösung.

  </Accordion>
</AccordionGroup>

## Verwandt

- [Automatisierung & Aufgaben](/de/automation) — alle Automatisierungsmechanismen auf einen Blick
- [Hintergrundaufgaben](/de/automation/tasks) — Aufgabenjournal für Cron-Ausführungen
- [Heartbeat](/de/gateway/heartbeat) — regelmäßige Turns in der Hauptsitzung
- [Zeitzone](/de/concepts/timezone) — Zeitzonenkonfiguration
