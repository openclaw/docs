---
read_when:
    - Planen von Hintergrundaufgaben oder Aufweckvorgängen
    - Externe Trigger (Webhooks, Gmail) in OpenClaw einbinden
    - Entscheidung zwischen Heartbeat und Cron für geplante Aufgaben
sidebarTitle: Scheduled tasks
summary: Geplante Jobs, Webhooks und Gmail-PubSub-Trigger für den Gateway-Scheduler
title: Geplante Aufgaben
x-i18n:
    generated_at: "2026-04-30T06:38:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 021e623bdea786178e0948e9905360c897c26d31fdf866e9af8cfc9538968d60
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron ist der integrierte Scheduler des Gateway. Er speichert Jobs dauerhaft, weckt den Agent zum richtigen Zeitpunkt und kann Ausgaben zurück an einen Chat-Kanal oder einen Webhook-Endpunkt liefern.

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
  <Step title="Ausführungsverlauf ansehen">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## Wie Cron funktioniert

- Cron läuft **innerhalb des Gateway**-Prozesses (nicht innerhalb des Modells).
- Job-Definitionen werden unter `~/.openclaw/cron/jobs.json` gespeichert, sodass Zeitpläne bei Neustarts nicht verloren gehen.
- Der Ausführungszustand zur Laufzeit wird daneben in `~/.openclaw/cron/jobs-state.json` gespeichert. Wenn Sie Cron-Definitionen in git nachverfolgen, verfolgen Sie `jobs.json` und nehmen Sie `jobs-state.json` in gitignore auf.
- Nach der Aufteilung können ältere OpenClaw-Versionen `jobs.json` lesen, Jobs aber möglicherweise als neu behandeln, weil Laufzeitfelder jetzt in `jobs-state.json` liegen.
- Wenn `jobs.json` bearbeitet wird, während das Gateway läuft oder gestoppt ist, vergleicht OpenClaw die geänderten Zeitplanfelder mit ausstehenden Laufzeit-Slot-Metadaten und löscht veraltete `nextRunAtMs`-Werte. Reine Formatierungsänderungen oder Umschreibungen nur der Schlüsselreihenfolge behalten den ausstehenden Slot bei.
- Alle Cron-Ausführungen erstellen Datensätze für [Hintergrundaufgaben](/de/automation/tasks).
- Beim Start des Gateway werden überfällige isolierte Agent-Turn-Jobs aus dem Verbindungsfenster des Kanals heraus neu geplant, statt sofort erneut abgespielt zu werden, sodass Discord-/Telegram-Start und die Einrichtung nativer Befehle nach Neustarts reaktionsfähig bleiben.
- Einmalige Jobs (`--at`) werden standardmäßig nach erfolgreicher Ausführung automatisch gelöscht.
- Isolierte Cron-Läufe schließen nach bestem Aufwand nachverfolgte Browser-Tabs/-Prozesse für ihre `cron:<jobId>`-Sitzung, wenn der Lauf abgeschlossen ist, sodass losgelöste Browserautomatisierung keine verwaisten Prozesse zurücklässt.
- Isolierte Cron-Läufe schützen außerdem vor veralteten Bestätigungsantworten. Wenn das erste Ergebnis nur eine Zwischenstatusmeldung ist (`on it`, `pulling everything together` und ähnliche Hinweise) und kein untergeordneter Subagent-Lauf mehr für die endgültige Antwort verantwortlich ist, fordert OpenClaw vor der Zustellung einmal erneut das tatsächliche Ergebnis an.
- Isolierte Cron-Läufe bevorzugen strukturierte Metadaten zur Ausführungsverweigerung aus dem eingebetteten Lauf und fallen dann auf bekannte abschließende Zusammenfassungs-/Ausgabemarker wie `SYSTEM_RUN_DENIED` und `INVALID_REQUEST` zurück, sodass ein blockierter Befehl nicht als erfolgreicher Lauf gemeldet wird.
- Isolierte Cron-Läufe behandeln außerdem agentenbezogene Fehler auf Laufebene als Job-Fehler, selbst wenn keine Antwortnutzlast erzeugt wird, sodass Modell-/Provider-Fehler Fehlerzähler erhöhen und Fehlerbenachrichtigungen auslösen, statt den Job als erfolgreich abzuschließen.
- Wenn ein isolierter Agent-Turn-Job `timeoutSeconds` erreicht, bricht Cron den zugrunde liegenden Agent-Lauf ab und gibt ihm ein kurzes Bereinigungsfenster. Wenn der Lauf nicht ausläuft, löscht die vom Gateway verwaltete Bereinigung die Sitzungszuständigkeit dieses Laufs zwangsweise, bevor Cron das Timeout erfasst, sodass wartende Chat-Arbeit nicht hinter einer veralteten Verarbeitungssitzung zurückbleibt.

<a id="maintenance"></a>

<Note>
Die Aufgabenabstimmung für Cron ist zuerst laufzeitverwaltet und danach durch dauerhafte Historie abgesichert: Eine aktive Cron-Aufgabe bleibt aktiv, solange die Cron-Laufzeit diesen Job noch als laufend verfolgt, selbst wenn noch eine alte untergeordnete Sitzungszeile existiert. Sobald die Laufzeit den Job nicht mehr besitzt und das 5-Minuten-Nachlauffenster abläuft, prüft die Wartung persistierte Ausführungsprotokolle und den Job-Zustand für den passenden `cron:<jobId>:<startedAt>`-Lauf. Wenn diese dauerhafte Historie ein terminales Ergebnis zeigt, wird das Aufgabenbuch daraus finalisiert; andernfalls kann die vom Gateway verwaltete Wartung die Aufgabe als `lost` markieren. Die Offline-CLI-Prüfung kann aus dauerhafter Historie wiederherstellen, behandelt aber ihre eigene leere prozessinterne Menge aktiver Jobs nicht als Beweis dafür, dass ein vom Gateway verwalteter Cron-Lauf verschwunden ist.
</Note>

## Zeitplantypen

| Art     | CLI-Flag  | Beschreibung                                                     |
| ------- | --------- | ---------------------------------------------------------------- |
| `at`    | `--at`    | Einmaliger Zeitstempel (ISO 8601 oder relativ wie `20m`)         |
| `every` | `--every` | Festes Intervall                                                 |
| `cron`  | `--cron`  | Cron-Ausdruck mit 5 oder 6 Feldern und optionalem `--tz`         |

Zeitstempel ohne Zeitzone werden als UTC behandelt. Fügen Sie `--tz America/New_York` für lokale Wanduhrplanung hinzu.

Wiederkehrende Ausdrücke zur vollen Stunde werden automatisch um bis zu 5 Minuten gestaffelt, um Lastspitzen zu reduzieren. Verwenden Sie `--exact`, um präzises Timing zu erzwingen, oder `--stagger 30s` für ein explizites Fenster.

### Tag-des-Monats und Wochentag verwenden ODER-Logik

Cron-Ausdrücke werden von [croner](https://github.com/Hexagon/croner) geparst. Wenn sowohl das Feld für Tag-des-Monats als auch das Feld für Wochentag keine Wildcards sind, stimmt croner überein, wenn **eines der beiden** Felder passt, nicht beide. Das ist das Standardverhalten von Vixie cron.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Dies wird etwa 5 bis 6 Mal pro Monat ausgelöst statt 0 bis 1 Mal pro Monat. OpenClaw verwendet hier Croners standardmäßiges ODER-Verhalten. Um beide Bedingungen zu verlangen, verwenden Sie Croners Wochentag-Modifikator `+` (`0 9 15 * +1`) oder planen Sie über ein Feld und prüfen Sie das andere im Prompt oder Befehl Ihres Jobs.

## Ausführungsstile

| Stil              | `--session`-Wert   | Läuft in                  | Am besten geeignet für                    |
| ----------------- | ------------------ | ------------------------- | ----------------------------------------- |
| Hauptsitzung      | `main`             | Nächster Heartbeat-Turn   | Erinnerungen, Systemereignisse            |
| Isoliert          | `isolated`         | Dedizierte `cron:<jobId>` | Berichte, Hintergrundaufgaben             |
| Aktuelle Sitzung  | `current`          | Bei Erstellung gebunden   | Kontextbewusste wiederkehrende Arbeit     |
| Benutzerdefiniert | `session:custom-id`| Persistente benannte Sitzung | Workflows, die auf Historie aufbauen   |

<AccordionGroup>
  <Accordion title="Hauptsitzung vs. isoliert vs. benutzerdefiniert">
    Jobs in der **Hauptsitzung** stellen ein Systemereignis in die Warteschlange und wecken optional den Heartbeat (`--wake now` oder `--wake next-heartbeat`). Diese Systemereignisse verlängern nicht die Frische für tägliche oder Inaktivitäts-Resets der Zielsitzung. **Isolierte** Jobs führen einen dedizierten Agent-Turn mit einer frischen Sitzung aus. **Benutzerdefinierte Sitzungen** (`session:xxx`) speichern Kontext über Läufe hinweg und ermöglichen Workflows wie tägliche Standups, die auf vorherigen Zusammenfassungen aufbauen.
  </Accordion>
  <Accordion title="Was „frische Sitzung“ für isolierte Jobs bedeutet">
    Für isolierte Jobs bedeutet „frische Sitzung“ eine neue Transkript-/Sitzungs-ID für jeden Lauf. OpenClaw kann sichere Präferenzen wie Thinking-/Fast-/Verbose-Einstellungen, Labels und ausdrücklich vom Benutzer ausgewählte Modell-/Auth-Overrides übernehmen, erbt aber keinen umgebenden Gesprächskontext aus einer älteren Cron-Zeile: Kanal-/Gruppenrouting, Sende- oder Warteschlangenrichtlinie, Rechteerhöhung, Ursprung oder ACP-Laufzeitbindung. Verwenden Sie `current` oder `session:<id>`, wenn ein wiederkehrender Job absichtlich auf demselben Gesprächskontext aufbauen soll.
  </Accordion>
  <Accordion title="Laufzeitbereinigung">
    Für isolierte Jobs umfasst der Laufzeitabbau jetzt Browserbereinigung nach bestem Aufwand für diese Cron-Sitzung. Bereinigungsfehler werden ignoriert, sodass das tatsächliche Cron-Ergebnis weiterhin Vorrang hat.

    Isolierte Cron-Läufe entsorgen außerdem alle gebündelten MCP-Laufzeitinstanzen, die für den Job erstellt wurden, über den gemeinsamen Laufzeitbereinigungspfad. Das entspricht dem Abbau von MCP-Clients in Hauptsitzungen und benutzerdefinierten Sitzungen, sodass isolierte Cron-Jobs keine stdio-Kindprozesse oder langlebigen MCP-Verbindungen über Läufe hinweg leaken.

  </Accordion>
  <Accordion title="Subagent- und Discord-Zustellung">
    Wenn isolierte Cron-Läufe Subagents orchestrieren, bevorzugt die Zustellung außerdem die endgültige Ausgabe des untergeordneten Laufs gegenüber veraltetem Zwischeninhalt des Elternlaufs. Wenn untergeordnete Läufe noch aktiv sind, unterdrückt OpenClaw diese teilweise Elternaktualisierung, statt sie anzukündigen.

    Für reine Text-Ankündigungsziele in Discord sendet OpenClaw den kanonischen endgültigen Assistententext einmal, statt sowohl gestreamte/zwischenzeitliche Textnutzlasten als auch die endgültige Antwort erneut abzuspielen. Medien und strukturierte Discord-Nutzlasten werden weiterhin als separate Nutzlasten zugestellt, damit Anhänge und Komponenten nicht verworfen werden.

  </Accordion>
</AccordionGroup>

### Nutzlastoptionen für isolierte Jobs

<ParamField path="--message" type="string" required>
  Prompt-Text (für isolierte Jobs erforderlich).
</ParamField>
<ParamField path="--model" type="string">
  Modell-Override; verwendet das ausgewählte zulässige Modell für den Job.
</ParamField>
<ParamField path="--thinking" type="string">
  Thinking-Level-Override.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Injektion der Workspace-Bootstrap-Datei überspringen.
</ParamField>
<ParamField path="--tools" type="string">
  Beschränkt, welche Tools der Job verwenden kann, zum Beispiel `--tools exec,read`.
</ParamField>

`--model` verwendet das ausgewählte zulässige Modell als primäres Modell dieses Jobs. Es ist nicht dasselbe wie ein `/model`-Override für eine Chat-Sitzung: Konfigurierte Fallback-Ketten gelten weiterhin, wenn das primäre Job-Modell fehlschlägt. Wenn das angeforderte Modell nicht zulässig ist oder nicht aufgelöst werden kann, schlägt Cron den Lauf mit einem expliziten Validierungsfehler fehl, statt stillschweigend auf die Agent-/Standardmodellauswahl des Jobs zurückzufallen.

Cron-Jobs können außerdem `fallbacks` auf Nutzlastebene enthalten. Wenn vorhanden, ersetzt diese Liste die konfigurierte Fallback-Kette für den Job. Verwenden Sie `fallbacks: []` in der Job-Nutzlast/API, wenn Sie einen strikten Cron-Lauf wünschen, der nur das ausgewählte Modell versucht. Wenn ein Job `--model`, aber weder Nutzlast- noch konfigurierte Fallbacks hat, übergibt OpenClaw einen expliziten leeren Fallback-Override, sodass das primäre Agent-Modell nicht als verstecktes zusätzliches Wiederholungsziel angehängt wird.

Die Modell-Auswahlpriorität für isolierte Jobs lautet:

1. Gmail-Hook-Modell-Override (wenn der Lauf von Gmail kam und dieser Override zulässig ist)
2. Pro-Job-Nutzlast `model`
3. Vom Benutzer ausgewählter gespeicherter Cron-Sitzungsmodell-Override
4. Agent-/Standardmodellauswahl

Der Fast-Modus folgt ebenfalls der aufgelösten Live-Auswahl. Wenn die ausgewählte Modellkonfiguration `params.fastMode` enthält, verwendet isoliertes Cron dies standardmäßig. Ein gespeicherter Sitzungs-Override `fastMode` hat in beide Richtungen weiterhin Vorrang vor der Konfiguration.

Wenn ein isolierter Lauf eine Live-Modellwechsel-Übergabe erreicht, versucht Cron es erneut mit dem gewechselten Provider/Modell und speichert diese Live-Auswahl vor dem erneuten Versuch für den aktiven Lauf. Wenn der Wechsel auch ein neues Auth-Profil mitbringt, speichert Cron auch diesen Auth-Profil-Override für den aktiven Lauf. Wiederholungen sind begrenzt: Nach dem ersten Versuch plus 2 Wechsel-Wiederholungen bricht Cron ab, statt endlos zu schleifen.

Bevor ein isolierter Cron-Lauf in den Agent-Runner eintritt, prüft OpenClaw erreichbare lokale Provider-Endpunkte für konfigurierte `api: "ollama"`- und `api: "openai-completions"`-Provider, deren `baseUrl` local loopback, privates Netzwerk oder `.local` ist. Wenn dieser Endpunkt ausgefallen ist, wird der Lauf als `skipped` mit einem klaren Provider-/Modellfehler erfasst, statt einen Modellaufruf zu starten. Das Endpunktergebnis wird 5 Minuten zwischengespeichert, sodass viele fällige Jobs, die denselben nicht erreichbaren lokalen Ollama-, vLLM-, SGLang- oder LM Studio-Server verwenden, eine kleine gemeinsame Prüfung nutzen, statt einen Anfragesturm zu erzeugen. Übersprungene Provider-Preflight-Läufe erhöhen den Backoff für Ausführungsfehler nicht; aktivieren Sie `failureAlert.includeSkipped`, wenn Sie wiederholte Übersprungsbenachrichtigungen wünschen.

## Zustellung und Ausgabe

| Modus      | Was geschieht                                                              |
| ---------- | -------------------------------------------------------------------------- |
| `announce` | Liefert finalen Text ersatzweise an das Ziel, wenn der Agent nicht gesendet hat |
| `webhook`  | Sendet die Nutzlast des abgeschlossenen Ereignisses per POST an eine URL   |
| `none`     | Keine Fallback-Zustellung durch den Runner                                 |

Verwenden Sie `--announce --channel telegram --to "-1001234567890"` für die Kanalzustellung. Für Telegram-Forenthemen verwenden Sie `-1001234567890:topic:123`; direkte RPC-/Konfigurationsaufrufer können auch `delivery.threadId` als Zeichenfolge oder Zahl übergeben. Slack-/Discord-/Mattermost-Ziele sollten explizite Präfixe verwenden (`channel:<id>`, `user:<id>`). Matrix-Raum-IDs beachten Groß- und Kleinschreibung; verwenden Sie die exakte Raum-ID oder die Form `room:!room:server` aus Matrix.

Für isolierte Jobs wird die Chat-Zustellung geteilt. Wenn eine Chat-Route verfügbar ist, kann der Agent das Tool `message` verwenden, auch wenn der Job `--no-deliver` nutzt. Wenn der Agent an das konfigurierte/aktuelle Ziel sendet, überspringt OpenClaw die Fallback-Ankündigung. Andernfalls steuern `announce`, `webhook` und `none` nur, was der Runner nach dem Agent-Durchlauf mit der finalen Antwort macht.

Wenn ein Agent eine isolierte Erinnerung aus einem aktiven Chat erstellt, speichert OpenClaw das beibehaltene Live-Zustellungsziel für die Fallback-Ankündigungsroute. Interne Sitzungsschlüssel können kleingeschrieben sein; Provider-Zustellungsziele werden nicht aus diesen Schlüsseln rekonstruiert, wenn der aktuelle Chat-Kontext verfügbar ist.

Fehlerbenachrichtigungen folgen einem separaten Zielpfad:

- `cron.failureDestination` legt einen globalen Standard für Fehlerbenachrichtigungen fest.
- `job.delivery.failureDestination` überschreibt dies pro Job.
- Wenn keines von beiden gesetzt ist und der Job bereits über `announce` zustellt, fallen Fehlerbenachrichtigungen jetzt auf dieses primäre Ankündigungsziel zurück.
- `delivery.failureDestination` wird nur für Jobs mit `sessionTarget="isolated"` unterstützt, sofern der primäre Zustellungsmodus nicht `webhook` ist.
- `failureAlert.includeSkipped: true` aktiviert für einen Job oder eine globale Cron-Alert-Richtlinie wiederholte Alerts zu übersprungenen Läufen. Übersprungene Läufe behalten einen separaten Zähler für aufeinanderfolgende Überspringungen, sodass sie das Backoff für Ausführungsfehler nicht beeinflussen.

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

Tokens in der Query-Zeichenfolge werden abgelehnt.

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
Bewahren Sie Hook-Endpunkte hinter local loopback, Tailnet oder einem vertrauenswürdigen Reverse-Proxy auf.

- Verwenden Sie ein dediziertes Hook-Token; verwenden Sie Gateway-Auth-Tokens nicht erneut.
- Belassen Sie `hooks.path` auf einem dedizierten Unterpfad; `/` wird abgelehnt.
- Setzen Sie `hooks.allowedAgentIds`, um explizites `agentId`-Routing zu begrenzen.
- Belassen Sie `hooks.allowRequestSessionKey=false`, sofern Sie keine vom Aufrufer ausgewählten Sitzungen benötigen.
- Wenn Sie `hooks.allowRequestSessionKey` aktivieren, setzen Sie auch `hooks.allowedSessionKeyPrefixes`, um zulässige Sitzungsschlüssel-Formen einzuschränken.
- Hook-Payloads werden standardmäßig mit Sicherheitsgrenzen umschlossen.

</Warning>

## Gmail-PubSub-Integration

Verbinden Sie Gmail-Posteingangstrigger über Google PubSub mit OpenClaw.

<Note>
**Voraussetzungen:** `gcloud` CLI, `gog` (gogcli), aktivierte OpenClaw-Hooks, Tailscale für den öffentlichen HTTPS-Endpunkt.
</Note>

### Wizard-Einrichtung (empfohlen)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Dies schreibt die `hooks.gmail`-Konfiguration, aktiviert das Gmail-Preset und verwendet Tailscale Funnel für den Push-Endpunkt.

### Gateway-Autostart

Wenn `hooks.enabled=true` und `hooks.gmail.account` gesetzt ist, startet der Gateway beim Booten `gog gmail watch serve` und erneuert den Watch automatisch. Setzen Sie `OPENCLAW_SKIP_GMAIL_WATCHER=1`, um dies zu deaktivieren.

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
- Wenn das Modell erlaubt ist, erreicht genau dieser Provider/dieses Modell den isolierten Agent-Lauf.
- Wenn es nicht erlaubt ist oder nicht aufgelöst werden kann, lässt Cron den Lauf mit einem expliziten Validierungsfehler fehlschlagen.
- Konfigurierte Fallback-Ketten gelten weiterhin, da Cron `--model` eine primäre Jobeinstellung ist, keine Sitzungsüberschreibung per `/model`.
- Payload `fallbacks` ersetzt konfigurierte Fallbacks für diesen Job; `fallbacks: []` deaktiviert Fallbacks und macht den Lauf strikt.
- Ein einfaches `--model` ohne explizite oder konfigurierte Fallback-Liste fällt nicht stillschweigend als zusätzliches Retry-Ziel auf das primäre Agent-Modell zurück.

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

`maxConcurrentRuns` begrenzt sowohl die geplante Cron-Ausführung als auch die Ausführung isolierter Agent-Durchläufe. Isolierte Cron-Agent-Durchläufe verwenden intern die dedizierte Ausführungslane `cron-nested` der Warteschlange. Wenn Sie diesen Wert erhöhen, können unabhängige Cron-LLM-Läufe parallel fortschreiten, statt nur ihre äußeren Cron-Wrapper zu starten. Die gemeinsam genutzte Nicht-Cron-Lane `nested` wird durch diese Einstellung nicht verbreitert.

Der Runtime-State-Sidecar wird von `cron.store` abgeleitet: Ein `.json`-Store wie `~/clawd/cron/jobs.json` verwendet `~/clawd/cron/jobs-state.json`, während an einen Store-Pfad ohne `.json`-Suffix `-state.json` angehängt wird.

Wenn Sie `jobs.json` manuell bearbeiten, nehmen Sie `jobs-state.json` nicht in die Versionskontrolle auf. OpenClaw verwendet diesen Sidecar für ausstehende Slots, aktive Marker, Metadaten zum letzten Lauf und die Schedule-Identität, die dem Scheduler mitteilt, wann ein extern bearbeiteter Job ein frisches `nextRunAtMs` benötigt.

Cron deaktivieren: `cron.enabled: false` oder `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Retry behavior">
    **Einmaliger Retry**: Vorübergehende Fehler (Rate Limit, Überlastung, Netzwerk, Serverfehler) werden bis zu 3-mal mit exponentiellem Backoff wiederholt. Permanente Fehler deaktivieren sofort.

    **Wiederkehrender Retry**: exponentielles Backoff (30 s bis 60 min) zwischen Wiederholungen. Das Backoff wird nach dem nächsten erfolgreichen Lauf zurückgesetzt.

  </Accordion>
  <Accordion title="Maintenance">
    `cron.sessionRetention` (Standard `24h`) bereinigt Einträge isolierter Lauf-Sitzungen. `cron.runLog.maxBytes` / `cron.runLog.keepLines` bereinigen Run-Log-Dateien automatisch.
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
    - Prüfen Sie `cron.enabled` und die Env-Var `OPENCLAW_SKIP_CRON`.
    - Bestätigen Sie, dass der Gateway kontinuierlich läuft.
    - Überprüfen Sie bei `cron`-Schedules die Zeitzone (`--tz`) im Vergleich zur Host-Zeitzone.
    - `reason: not-due` in der Laufausgabe bedeutet, dass der manuelle Lauf mit `openclaw cron run <jobId> --due` geprüft wurde und der Job noch nicht fällig war.

  </Accordion>
  <Accordion title="Cron fired but no delivery">
    - Zustellungsmodus `none` bedeutet, dass kein Fallback-Senden durch den Runner erwartet wird. Der Agent kann weiterhin direkt mit dem Tool `message` senden, wenn eine Chat-Route verfügbar ist.
    - Fehlendes/ungültiges Zustellungsziel (`channel`/`to`) bedeutet, dass ausgehende Zustellung übersprungen wurde.
    - Bei Matrix können kopierte oder alte Jobs mit kleingeschriebenen `delivery.to`-Raum-IDs fehlschlagen, weil Matrix-Raum-IDs Groß- und Kleinschreibung beachten. Bearbeiten Sie den Job auf den exakten Wert `!room:server` oder `room:!room:server` aus Matrix.
    - Kanal-Auth-Fehler (`unauthorized`, `Forbidden`) bedeuten, dass die Zustellung durch Anmeldedaten blockiert wurde.
    - Wenn der isolierte Lauf nur das Silent-Token (`NO_REPLY` / `no_reply`) zurückgibt, unterdrückt OpenClaw die direkte ausgehende Zustellung und auch den Fallback-Pfad der eingereihten Zusammenfassung, sodass nichts zurück in den Chat gepostet wird.
    - Wenn der Agent dem Benutzer selbst eine Nachricht senden soll, prüfen Sie, ob der Job eine verwendbare Route hat (`channel: "last"` mit einem vorherigen Chat oder ein expliziter Kanal/ein explizites Ziel).

  </Accordion>
  <Accordion title="Cron oder Heartbeat scheint den /new-style-Wechsel zu verhindern">
    - Die Aktualität für tägliche Zurücksetzungen und Zurücksetzungen bei Inaktivität basiert nicht auf `updatedAt`; siehe [Sitzungsverwaltung](/de/concepts/session#session-lifecycle).
    - Cron-Aktivierungen, Heartbeat-Läufe, Exec-Benachrichtigungen und Gateway-Verwaltungsdaten können die Sitzungszeile für Routing/Status aktualisieren, sie verlängern jedoch nicht `sessionStartedAt` oder `lastInteractionAt`.
    - Für Legacy-Zeilen, die erstellt wurden, bevor diese Felder existierten, kann OpenClaw `sessionStartedAt` aus dem JSONL-Sitzungsheader des Transkripts wiederherstellen, wenn die Datei noch verfügbar ist. Legacy-Inaktivitätszeilen ohne `lastInteractionAt` verwenden diese wiederhergestellte Startzeit als ihre Inaktivitäts-Basislinie.

  </Accordion>
  <Accordion title="Zeitzonen-Fallstricke">
    - Cron ohne `--tz` verwendet die Zeitzone des Gateway-Hosts.
    - `at`-Zeitpläne ohne Zeitzone werden als UTC behandelt.
    - Heartbeat `activeHours` verwendet die konfigurierte Zeitzonenauflösung.

  </Accordion>
</AccordionGroup>

## Verwandte Themen

- [Automatisierung und Aufgaben](/de/automation) — alle Automatisierungsmechanismen auf einen Blick
- [Hintergrundaufgaben](/de/automation/tasks) — Aufgabenjournal für Cron-Ausführungen
- [Heartbeat](/de/gateway/heartbeat) — regelmäßige Turns der Hauptsitzung
- [Zeitzone](/de/concepts/timezone) — Zeitzonenkonfiguration
