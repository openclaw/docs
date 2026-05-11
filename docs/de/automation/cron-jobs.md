---
read_when:
    - Planen von Hintergrundaufgaben oder Aufweckereignissen
    - Externe Trigger (Webhooks, Gmail) in OpenClaw einbinden
    - Entscheidung zwischen Heartbeat und Cron für geplante Aufgaben
sidebarTitle: Scheduled tasks
summary: Geplante Jobs, Webhooks und Gmail-PubSub-Trigger für den Gateway-Scheduler
title: Geplante Aufgaben
x-i18n:
    generated_at: "2026-05-11T20:20:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 56af55d8151b22dedb5ad02c2eb5e706711e1435c806dbc2e2ef71b13ebde3b9
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron ist der integrierte Scheduler des Gateways. Er speichert Jobs dauerhaft, weckt den Agent zur richtigen Zeit und kann Ausgaben zurück an einen Chat-Kanal oder Webhook-Endpunkt liefern.

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

## Funktionsweise von Cron

- Cron läuft **innerhalb des Gateway**-Prozesses (nicht innerhalb des Modells).
- Job-Definitionen werden unter `~/.openclaw/cron/jobs.json` gespeichert, sodass Neustarts keine Zeitpläne verlieren.
- Der Laufzeit-Ausführungszustand wird daneben in `~/.openclaw/cron/jobs-state.json` gespeichert. Wenn Sie Cron-Definitionen in Git nachverfolgen, verfolgen Sie `jobs.json` und nehmen Sie `jobs-state.json` in gitignore auf.
- Nach der Aufteilung können ältere OpenClaw-Versionen `jobs.json` lesen, behandeln Jobs aber möglicherweise als neu, weil Laufzeitfelder jetzt in `jobs-state.json` liegen.
- Wenn `jobs.json` bearbeitet wird, während das Gateway läuft oder gestoppt ist, vergleicht OpenClaw die geänderten Zeitplanfelder mit ausstehenden Laufzeit-Slot-Metadaten und löscht veraltete `nextRunAtMs`-Werte. Reine Formatierungen oder Umschreibungen nur der Schlüsselreihenfolge behalten den ausstehenden Slot bei.
- Alle Cron-Ausführungen erstellen Datensätze für [Hintergrundaufgaben](/de/automation/tasks).
- Beim Gateway-Start werden überfällige isolierte Agent-Turn-Jobs aus dem Kanal-Verbindungsfenster heraus neu geplant, statt sofort erneut abgespielt zu werden, sodass Discord/Telegram-Start und native Befehlskonfiguration nach Neustarts reaktionsfähig bleiben.
- Einmalige Jobs (`--at`) werden standardmäßig nach erfolgreicher Ausführung automatisch gelöscht.
- Isolierte Cron-Ausführungen schließen nach bestem Aufwand nachverfolgte Browser-Tabs/-Prozesse für ihre `cron:<jobId>`-Sitzung, wenn die Ausführung abgeschlossen ist, sodass getrennte Browser-Automatisierung keine verwaisten Prozesse zurücklässt.
- Isolierte Cron-Ausführungen, die die enge Cron-Selbstbereinigungsberechtigung erhalten, können weiterhin den Scheduler-Status, eine selbst gefilterte Liste ihres aktuellen Jobs und den Ausführungsverlauf dieses Jobs lesen, sodass Status-/Heartbeat-Prüfungen ihren eigenen Zeitplan einsehen können, ohne breiteren Zugriff auf Cron-Mutationen zu erhalten.
- Isolierte Cron-Ausführungen schützen auch vor veralteten Bestätigungsantworten. Wenn das erste Ergebnis nur eine vorläufige Statusmeldung ist (`on it`, `pulling everything together` und ähnliche Hinweise) und kein nachgelagerter Subagent-Lauf noch für die endgültige Antwort verantwortlich ist, fordert OpenClaw vor der Zustellung einmal erneut das tatsächliche Ergebnis an.
- Isolierte Cron-Ausführungen bevorzugen strukturierte Ausführungsverweigerungs-Metadaten aus dem eingebetteten Lauf und fallen dann auf bekannte Marker für finale Zusammenfassung/Ausgabe wie `SYSTEM_RUN_DENIED` und `INVALID_REQUEST` zurück, sodass ein blockierter Befehl nicht als erfolgreicher Lauf gemeldet wird.
- Isolierte Cron-Ausführungen behandeln auch agentbezogene Fehler auf Laufebene als Job-Fehler, selbst wenn keine Antwortnutzlast erzeugt wird, sodass Modell-/Provider-Fehler Fehlerzähler erhöhen und Fehlerbenachrichtigungen auslösen, statt den Job als erfolgreich abzuschließen.
- Wenn ein isolierter Agent-Turn-Job `timeoutSeconds` erreicht, bricht Cron den zugrunde liegenden Agent-Lauf ab und gibt ihm ein kurzes Bereinigungsfenster. Wenn der Lauf nicht ausläuft, räumt eine Gateway-eigene Bereinigung die Sitzungszuordnung dieses Laufs zwangsweise frei, bevor Cron den Timeout aufzeichnet, sodass wartende Chat-Arbeit nicht hinter einer veralteten Verarbeitungssitzung zurückbleibt.
- Wenn ein isolierter Agent-Turn ins Stocken gerät, bevor der Runner startet oder bevor der erste Modellaufruf erfolgt, zeichnet Cron einen phasenspezifischen Timeout wie `setup timed out before runner start` oder `stalled before first model call (last phase: context-engine)` auf. Diese Watchdogs decken eingebettete Provider und CLI-gestützte Provider ab, bevor deren externer CLI-Prozess tatsächlich gestartet wird, und sind unabhängig von langen `timeoutSeconds`-Werten begrenzt, sodass Cold-Start-/Auth-/Kontextfehler schnell sichtbar werden, statt auf das vollständige Job-Budget zu warten.

<a id="maintenance"></a>

<Note>
Der Aufgabenabgleich für Cron ist zuerst laufzeitverantwortet und erst danach durch dauerhaften Verlauf abgesichert: Eine aktive Cron-Aufgabe bleibt live, solange die Cron-Laufzeit diesen Job weiterhin als laufend verfolgt, selbst wenn noch eine alte untergeordnete Sitzungszeile vorhanden ist. Sobald die Laufzeit den Job nicht mehr besitzt und das 5-Minuten-Kulanzfenster abläuft, prüft die Wartung gespeicherte Laufprotokolle und den Job-Zustand für den passenden `cron:<jobId>:<startedAt>`-Lauf. Wenn dieser dauerhafte Verlauf ein terminales Ergebnis zeigt, wird das Aufgaben-Ledger daraus finalisiert; andernfalls kann Gateway-eigene Wartung die Aufgabe als `lost` markieren. Eine Offline-CLI-Prüfung kann aus dauerhaftem Verlauf wiederherstellen, behandelt aber ihre eigene leere prozessinterne Menge aktiver Jobs nicht als Beweis dafür, dass ein Gateway-eigener Cron-Lauf verschwunden ist.
</Note>

## Zeitplantypen

| Art     | CLI-Flag  | Beschreibung                                             |
| ------- | --------- | -------------------------------------------------------- |
| `at`    | `--at`    | Einmaliger Zeitstempel (ISO 8601 oder relativ wie `20m`) |
| `every` | `--every` | Festes Intervall                                         |
| `cron`  | `--cron`  | Cron-Ausdruck mit 5 oder 6 Feldern und optionalem `--tz` |

Zeitstempel ohne Zeitzone werden als UTC behandelt. Fügen Sie `--tz America/New_York` für lokale Wall-Clock-Planung hinzu.

Wiederkehrende Ausdrücke zur vollen Stunde werden automatisch um bis zu 5 Minuten gestaffelt, um Lastspitzen zu reduzieren. Verwenden Sie `--exact`, um eine genaue Zeitplanung zu erzwingen, oder `--stagger 30s` für ein explizites Fenster.

### Tag-des-Monats und Tag-der-Woche verwenden ODER-Logik

Cron-Ausdrücke werden von [croner](https://github.com/Hexagon/croner) geparst. Wenn sowohl die Felder für Tag des Monats als auch Tag der Woche keine Wildcards sind, stimmt croner überein, wenn **eines** der Felder übereinstimmt, nicht beide. Das ist das standardmäßige Vixie-cron-Verhalten.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Dies löst etwa 5- bis 6-mal pro Monat aus statt 0- bis 1-mal pro Monat. OpenClaw verwendet hier das standardmäßige ODER-Verhalten von Croner. Um beide Bedingungen zu verlangen, verwenden Sie Croners `+`-Tag-der-Woche-Modifikator (`0 9 15 * +1`) oder planen Sie nach einem Feld und prüfen Sie das andere im Prompt oder Befehl Ihres Jobs.

## Ausführungsstile

| Stil              | `--session`-Wert   | Läuft in                 | Am besten für                         |
| ----------------- | ------------------ | ------------------------ | ------------------------------------- |
| Hauptsitzung      | `main`             | Nächster Heartbeat-Turn  | Erinnerungen, Systemereignisse        |
| Isoliert          | `isolated`         | Dediziertes `cron:<jobId>` | Berichte, Hintergrundarbeiten       |
| Aktuelle Sitzung  | `current`          | Bei Erstellung gebunden  | Kontextbewusste wiederkehrende Arbeit |
| Benutzerdefinierte Sitzung | `session:custom-id` | Dauerhafte benannte Sitzung | Workflows, die auf Verlauf aufbauen |

<AccordionGroup>
  <Accordion title="Hauptsitzung vs. isoliert vs. benutzerdefiniert">
    Jobs der **Hauptsitzung** reihen ein Systemereignis ein und wecken optional den Heartbeat (`--wake now` oder `--wake next-heartbeat`). Diese Systemereignisse verlängern nicht die Aktualität für tägliche/Inaktivitäts-Resets der Zielsitzung. **Isolierte** Jobs führen einen dedizierten Agent-Turn mit einer frischen Sitzung aus. **Benutzerdefinierte Sitzungen** (`session:xxx`) behalten Kontext über Ausführungen hinweg bei und ermöglichen Workflows wie tägliche Standups, die auf vorherigen Zusammenfassungen aufbauen.
  </Accordion>
  <Accordion title="Was „frische Sitzung“ für isolierte Jobs bedeutet">
    Bei isolierten Jobs bedeutet „frische Sitzung“ eine neue Transcript-/Sitzungs-ID für jede Ausführung. OpenClaw kann sichere Präferenzen wie thinking/fast/verbose-Einstellungen, Labels und explizit vom Benutzer ausgewählte Modell-/Auth-Überschreibungen übernehmen, erbt aber keinen umgebenden Gesprächskontext aus einer älteren Cron-Zeile: Kanal-/Gruppen-Routing, Sende- oder Warteschlangenrichtlinie, Elevation, Ursprung oder ACP-Laufzeitbindung. Verwenden Sie `current` oder `session:<id>`, wenn ein wiederkehrender Job absichtlich auf demselben Gesprächskontext aufbauen soll.
  </Accordion>
  <Accordion title="Laufzeitbereinigung">
    Bei isolierten Jobs umfasst der Laufzeit-Abbau jetzt eine Browser-Bereinigung nach bestem Aufwand für diese Cron-Sitzung. Bereinigungsfehler werden ignoriert, sodass weiterhin das tatsächliche Cron-Ergebnis maßgeblich bleibt.

    Isolierte Cron-Ausführungen entsorgen außerdem alle gebündelten MCP-Laufzeitinstanzen, die für den Job erstellt wurden, über den gemeinsamen Laufzeitbereinigungspfad. Das entspricht dem Abbau von MCP-Clients für Hauptsitzungen und benutzerdefinierte Sitzungen, sodass isolierte Cron-Jobs keine stdio-Kindprozesse oder langlebigen MCP-Verbindungen über Ausführungen hinweg verlieren.

  </Accordion>
  <Accordion title="Subagent- und Discord-Zustellung">
    Wenn isolierte Cron-Ausführungen Subagents orchestrieren, bevorzugt die Zustellung ebenfalls die finale Ausgabe des Nachfahren gegenüber veraltetem vorläufigem Text des Elternlaufs. Wenn Nachfahren noch laufen, unterdrückt OpenClaw diese teilweise Elternaktualisierung, statt sie anzukündigen.

    Für reine Text-Ziele für Discord-Ankündigungen sendet OpenClaw den kanonischen finalen Assistententext einmal, statt sowohl gestreamte/zwischenzeitliche Textnutzlasten als auch die endgültige Antwort erneut abzuspielen. Medien und strukturierte Discord-Nutzlasten werden weiterhin als separate Nutzlasten zugestellt, sodass Anhänge und Komponenten nicht verworfen werden.

  </Accordion>
</AccordionGroup>

### Nutzlastoptionen für isolierte Jobs

<ParamField path="--message" type="string" required>
  Prompt-Text (für isolierte Ausführung erforderlich).
</ParamField>
<ParamField path="--model" type="string">
  Modellüberschreibung; verwendet das ausgewählte erlaubte Modell für den Job.
</ParamField>
<ParamField path="--thinking" type="string">
  Überschreibung der Denkstufe.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Überspringt die Workspace-Bootstrap-Dateiinjektion.
</ParamField>
<ParamField path="--tools" type="string">
  Beschränkt, welche Tools der Job verwenden kann, zum Beispiel `--tools exec,read`.
</ParamField>

`--model` verwendet das ausgewählte erlaubte Modell als primäres Modell dieses Jobs. Es ist nicht dasselbe wie eine `/model`-Überschreibung in einer Chat-Sitzung: Konfigurierte Fallback-Ketten gelten weiterhin, wenn das primäre Job-Modell fehlschlägt. Wenn das angeforderte Modell nicht erlaubt ist oder nicht aufgelöst werden kann, lässt Cron die Ausführung mit einem expliziten Validierungsfehler fehlschlagen, statt stillschweigend auf die Agent-/Standardmodellauswahl des Jobs zurückzufallen.

Cron-Jobs können auch `fallbacks` auf Nutzlastebene enthalten. Wenn vorhanden, ersetzt diese Liste die konfigurierte Fallback-Kette für den Job. Verwenden Sie `fallbacks: []` in der Job-Nutzlast/API, wenn Sie eine strikte Cron-Ausführung wünschen, die nur das ausgewählte Modell versucht. Wenn ein Job `--model`, aber weder Nutzlast- noch konfigurierte Fallbacks hat, übergibt OpenClaw eine explizit leere Fallback-Überschreibung, damit das primäre Agent-Modell nicht als verborgenes zusätzliches Wiederholungsziel angehängt wird.

Die Reihenfolge der Modellauswahl für isolierte Jobs ist:

1. Gmail-Hook-Modellüberschreibung (wenn der Lauf von Gmail kam und diese Überschreibung erlaubt ist)
2. `model` pro Job-Nutzlast
3. Vom Benutzer ausgewählte gespeicherte Cron-Sitzungsmodellüberschreibung
4. Agent-/Standardmodellauswahl

Der Schnellmodus folgt ebenfalls der aufgelösten Live-Auswahl. Wenn die ausgewählte Modellkonfiguration `params.fastMode` hat, verwendet isoliertes Cron dies standardmäßig. Eine gespeicherte Sitzungsüberschreibung für `fastMode` hat in beide Richtungen weiterhin Vorrang vor der Konfiguration.

Wenn eine isolierte Ausführung eine Live-Modellwechsel-Übergabe erreicht, wiederholt Cron mit dem gewechselten Provider/Modell und speichert diese Live-Auswahl vor der Wiederholung für den aktiven Lauf. Wenn der Wechsel auch ein neues Auth-Profil mitbringt, speichert Cron diese Auth-Profil-Überschreibung ebenfalls für den aktiven Lauf. Wiederholungen sind begrenzt: Nach dem ersten Versuch plus 2 Wechsel-Wiederholungen bricht Cron ab, statt endlos weiterzulaufen.

Bevor ein isolierter Cron-Lauf in den Agent-Runner gelangt, prüft OpenClaw erreichbare lokale Provider-Endpunkte für konfigurierte Provider mit `api: "ollama"` und `api: "openai-completions"`, deren `baseUrl` Loopback, ein privates Netzwerk oder `.local` ist. Wenn dieser Endpunkt nicht verfügbar ist, wird der Lauf mit einem klaren Provider-/Modellfehler als `skipped` erfasst, statt einen Modellaufruf zu starten. Das Endpunktergebnis wird 5 Minuten lang zwischengespeichert, sodass viele fällige Jobs, die denselben nicht erreichbaren lokalen Ollama-, vLLM-, SGLang- oder LM Studio-Server verwenden, eine einzige kleine Prüfung teilen, statt einen Anfrageansturm zu erzeugen. Übersprungene Provider-Preflight-Läufe erhöhen den Backoff für Ausführungsfehler nicht; aktivieren Sie `failureAlert.includeSkipped`, wenn Sie wiederholte Überspringungsbenachrichtigungen erhalten möchten.

## Zustellung und Ausgabe

| Modus      | Was passiert                                                                 |
| ---------- | ---------------------------------------------------------------------------- |
| `announce` | Liefert finalen Text als Fallback an das Ziel, wenn der Agent nicht gesendet hat |
| `webhook`  | Sendet das Nutzdatenereignis zum Abschluss per POST an eine URL              |
| `none`     | Keine Fallback-Zustellung durch den Runner                                   |

Verwenden Sie `--announce --channel telegram --to "-1001234567890"` für die Kanalzustellung. Für Telegram-Forum-Themen verwenden Sie `-1001234567890:topic:123`; direkte RPC-/Konfigurationsaufrufer können auch `delivery.threadId` als Zeichenfolge oder Zahl übergeben. Slack-/Discord-/Mattermost-Ziele sollten explizite Präfixe verwenden (`channel:<id>`, `user:<id>`). Matrix-Raum-IDs beachten Groß-/Kleinschreibung; verwenden Sie die exakte Raum-ID oder die Form `room:!room:server` aus Matrix.

Wenn die Announce-Zustellung `channel: "last"` verwendet oder `channel` auslässt, kann ein Provider-präfixiertes Ziel wie `telegram:123` den Kanal auswählen, bevor Cron auf die Sitzungsverlaufsdaten oder einen einzelnen konfigurierten Kanal zurückfällt. Nur Präfixe, die vom geladenen Plugin angekündigt werden, sind Provider-Selektoren. Wenn `delivery.channel` explizit ist, muss das Zielpräfix denselben Provider benennen; beispielsweise wird `channel: "whatsapp"` mit `to: "telegram:123"` abgelehnt, statt WhatsApp die Telegram-ID als Telefonnummer interpretieren zu lassen. Zieltyp- und Dienstpräfixe wie `channel:<id>`, `user:<id>`, `imessage:<handle>` und `sms:<number>` bleiben kanalverwaltete Zielsyntax, keine Provider-Selektoren.

Für isolierte Jobs wird die Chat-Zustellung gemeinsam genutzt. Wenn eine Chat-Route verfügbar ist, kann der Agent das Tool `message` verwenden, auch wenn der Job `--no-deliver` nutzt. Wenn der Agent an das konfigurierte/aktuelle Ziel sendet, überspringt OpenClaw die Fallback-Ankündigung. Andernfalls steuern `announce`, `webhook` und `none` nur, was der Runner nach dem Agent-Turn mit der finalen Antwort macht.

Wenn ein Agent aus einem aktiven Chat eine isolierte Erinnerung erstellt, speichert OpenClaw das beibehaltene Live-Zustellungsziel für die Fallback-Announce-Route. Interne Sitzungsschlüssel können kleingeschrieben sein; Provider-Zustellungsziele werden nicht aus diesen Schlüsseln rekonstruiert, wenn aktueller Chat-Kontext verfügbar ist.

Implizite Announce-Zustellung verwendet konfigurierte Kanal-Allowlists, um veraltete Ziele zu validieren und umzuleiten. DM-Genehmigungen aus dem Pairing-Speicher sind keine Fallback-Automatisierungsempfänger; setzen Sie `delivery.to` oder konfigurieren Sie den `allowFrom`-Eintrag des Kanals, wenn ein geplanter Job proaktiv an eine DM senden soll.

Fehlerbenachrichtigungen folgen einem separaten Zielpfad:

- `cron.failureDestination` legt einen globalen Standard für Fehlerbenachrichtigungen fest.
- `job.delivery.failureDestination` überschreibt diesen pro Job.
- Wenn keines von beiden gesetzt ist und der Job bereits über `announce` zustellt, fallen Fehlerbenachrichtigungen jetzt auf dieses primäre Announce-Ziel zurück.
- `delivery.failureDestination` wird nur bei Jobs mit `sessionTarget="isolated"` unterstützt, außer der primäre Zustellmodus ist `webhook`.
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
  <Tab title="Modell- und Denkmodus-Override">
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
  <Accordion title="Zugeordnete Hooks (POST /hooks/<name>)">
    Benutzerdefinierte Hook-Namen werden über `hooks.mappings` in der Konfiguration aufgelöst. Zuordnungen können beliebige Nutzdaten mit Vorlagen oder Code-Transformationen in `wake`- oder `agent`-Aktionen umwandeln.
  </Accordion>
</AccordionGroup>

<Warning>
Halten Sie Hook-Endpunkte hinter Loopback, Tailnet oder einem vertrauenswürdigen Reverse Proxy.

- Verwenden Sie ein dediziertes Hook-Token; verwenden Sie Gateway-Auth-Tokens nicht erneut.
- Belassen Sie `hooks.path` auf einem dedizierten Unterpfad; `/` wird abgelehnt.
- Setzen Sie `hooks.allowedAgentIds`, um explizites `agentId`-Routing zu begrenzen.
- Belassen Sie `hooks.allowRequestSessionKey=false`, sofern Sie keine vom Aufrufer ausgewählten Sitzungen benötigen.
- Wenn Sie `hooks.allowRequestSessionKey` aktivieren, setzen Sie auch `hooks.allowedSessionKeyPrefixes`, um zulässige Sitzungsschlüsselformen einzuschränken.
- Hook-Nutzdaten werden standardmäßig mit Sicherheitsgrenzen umschlossen.

</Warning>

## Gmail-PubSub-Integration

Verbinden Sie Gmail-Posteingangstrigger über Google PubSub mit OpenClaw.

<Note>
**Voraussetzungen:** `gcloud`-CLI, `gog` (gogcli), aktivierte OpenClaw-Hooks, Tailscale für den öffentlichen HTTPS-Endpunkt.
</Note>

### Einrichtung per Assistent (empfohlen)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Dies schreibt die `hooks.gmail`-Konfiguration, aktiviert das Gmail-Preset und verwendet Tailscale Funnel für den Push-Endpunkt.

### Automatischer Gateway-Start

Wenn `hooks.enabled=true` und `hooks.gmail.account` gesetzt ist, startet der Gateway beim Booten `gog gmail watch serve` und erneuert die Watch automatisch. Setzen Sie `OPENCLAW_SKIP_GMAIL_WATCHER=1`, um dies zu deaktivieren.

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
Hinweis zum Modell-Override:

- `openclaw cron add|edit --model ...` ändert das ausgewählte Modell des Jobs.
- Wenn das Modell erlaubt ist, erreicht genau dieser Provider/dieses Modell den isolierten Agent-Lauf.
- Wenn es nicht erlaubt ist oder nicht aufgelöst werden kann, lässt Cron den Lauf mit einem expliziten Validierungsfehler fehlschlagen.
- Konfigurierte Fallback-Ketten gelten weiterhin, da Cron `--model` ein primäres Job-Modell ist, kein `/model`-Override der Sitzung.
- Die Nutzlast `fallbacks` ersetzt konfigurierte Fallbacks für diesen Job; `fallbacks: []` deaktiviert Fallbacks und macht den Lauf strikt.
- Ein einfaches `--model` ohne explizite oder konfigurierte Fallback-Liste fällt nicht als stilles zusätzliches Wiederholungsziel auf das primäre Agent-Modell zurück.

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

`maxConcurrentRuns` begrenzt sowohl geplante Cron-Dispatches als auch die Ausführung isolierter Agent-Turns. Isolierte Cron-Agent-Turns verwenden intern die dedizierte Ausführungsspur `cron-nested` der Warteschlange. Wenn Sie diesen Wert erhöhen, können unabhängige Cron-LLM-Läufe parallel voranschreiten, statt nur ihre äußeren Cron-Wrapper zu starten. Die gemeinsam genutzte Nicht-Cron-Spur `nested` wird durch diese Einstellung nicht erweitert.

Der Runtime-State-Sidecar wird aus `cron.store` abgeleitet: Ein `.json`-Store wie `~/clawd/cron/jobs.json` verwendet `~/clawd/cron/jobs-state.json`, während ein Store-Pfad ohne `.json`-Suffix `-state.json` anhängt.

Wenn Sie `jobs.json` manuell bearbeiten, lassen Sie `jobs-state.json` aus der Versionskontrolle heraus. OpenClaw verwendet diesen Sidecar für ausstehende Slots, aktive Marker, Metadaten zum letzten Lauf und die Zeitplanidentität, die dem Scheduler mitteilt, wann ein extern bearbeiteter Job ein frisches `nextRunAtMs` benötigt.

Cron deaktivieren: `cron.enabled: false` oder `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Wiederholungsverhalten">
    **Einmalige Wiederholung**: Vorübergehende Fehler (Rate Limit, Überlastung, Netzwerk, Serverfehler) werden bis zu 3-mal mit exponentiellem Backoff wiederholt. Permanente Fehler deaktivieren sofort.

    **Wiederkehrende Wiederholung**: Exponentieller Backoff (30 s bis 60 min) zwischen Wiederholungen. Der Backoff wird nach dem nächsten erfolgreichen Lauf zurückgesetzt.

  </Accordion>
  <Accordion title="Wartung">
    `cron.sessionRetention` (Standard `24h`) bereinigt isolierte Lauf-Session-Einträge. `cron.runLog.maxBytes` / `cron.runLog.keepLines` bereinigen Run-Log-Dateien automatisch.
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
    - Prüfen Sie `cron.enabled` und die Env-Var `OPENCLAW_SKIP_CRON`.
    - Stellen Sie sicher, dass der Gateway kontinuierlich läuft.
    - Prüfen Sie bei `cron`-Zeitplänen die Zeitzone (`--tz`) im Vergleich zur Zeitzone des Hosts.
    - `reason: not-due` in der Lauf-Ausgabe bedeutet, dass ein manueller Lauf mit `openclaw cron run <jobId> --due` geprüft wurde und der Job noch nicht fällig war.

  </Accordion>
  <Accordion title="Cron wurde ausgelöst, aber keine Zustellung">
    - Zustellmodus `none` bedeutet, dass kein Runner-Fallback-Versand erwartet wird. Der Agent kann weiterhin direkt mit dem `message`-Tool senden, wenn eine Chat-Route verfügbar ist.
    - Fehlendes/ungültiges Zustellziel (`channel`/`to`) bedeutet, dass ausgehende Zustellung übersprungen wurde.
    - Bei Matrix können kopierte oder Legacy-Jobs mit kleingeschriebenen `delivery.to`-Raum-IDs fehlschlagen, weil Matrix-Raum-IDs zwischen Groß- und Kleinschreibung unterscheiden. Bearbeiten Sie den Job auf den exakten Wert `!room:server` oder `room:!room:server` aus Matrix.
    - Fehler bei der Kanal-Authentifizierung (`unauthorized`, `Forbidden`) bedeuten, dass die Zustellung durch Anmeldedaten blockiert wurde.
    - Wenn der isolierte Lauf nur das Silent-Token (`NO_REPLY` / `no_reply`) zurückgibt, unterdrückt OpenClaw die direkte ausgehende Zustellung und auch den Fallback-Pfad der eingereihten Zusammenfassung, sodass nichts zurück in den Chat gepostet wird.
    - Wenn der Agent die Nachricht selbst an den Benutzer senden soll, prüfen Sie, ob der Job eine nutzbare Route hat (`channel: "last"` mit einem vorherigen Chat oder einen expliziten Kanal/ein explizites Ziel).

  </Accordion>
  <Accordion title="Cron oder Heartbeat scheint den /new-style-Rollover zu verhindern">
    - Die Aktualität für tägliche und Leerlauf-Resets basiert nicht auf `updatedAt`; siehe [Session-Verwaltung](/de/concepts/session#session-lifecycle).
    - Cron-Wakeups, Heartbeat-Läufe, Exec-Benachrichtigungen und Gateway-Buchhaltung können die Session-Zeile für Routing/Status aktualisieren, erweitern aber nicht `sessionStartedAt` oder `lastInteractionAt`.
    - Für Legacy-Zeilen, die erstellt wurden, bevor diese Felder existierten, kann OpenClaw `sessionStartedAt` aus dem JSONL-Session-Header des Transkripts wiederherstellen, sofern die Datei noch verfügbar ist. Legacy-Leerlaufzeilen ohne `lastInteractionAt` verwenden diese wiederhergestellte Startzeit als Leerlauf-Basiswert.

  </Accordion>
  <Accordion title="Fallstricke bei Zeitzonen">
    - Cron ohne `--tz` verwendet die Zeitzone des Gateway-Hosts.
    - `at`-Zeitpläne ohne Zeitzone werden als UTC behandelt.
    - Heartbeat `activeHours` verwendet die konfigurierte Zeitzonenauflösung.

  </Accordion>
</AccordionGroup>

## Verwandte Themen

- [Automatisierung & Aufgaben](/de/automation) — alle Automatisierungsmechanismen auf einen Blick
- [Hintergrundaufgaben](/de/automation/tasks) — Aufgabenbuch für Cron-Ausführungen
- [Heartbeat](/de/gateway/heartbeat) — periodische Turns der Haupt-Session
- [Zeitzone](/de/concepts/timezone) — Zeitzonenkonfiguration
