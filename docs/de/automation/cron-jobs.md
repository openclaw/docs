---
read_when:
    - Planen von Hintergrundjobs oder Aufweckvorgängen
    - Externe Trigger (Webhooks, Gmail) in OpenClaw einbinden
    - Entscheiden zwischen Heartbeat und Cron für geplante Aufgaben
sidebarTitle: Scheduled tasks
summary: Geplante Jobs, Webhooks und Gmail-PubSub-Trigger für den Gateway-Scheduler
title: Geplante Aufgaben
x-i18n:
    generated_at: "2026-04-26T11:22:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 41908a34ddec3359e414ff4fbca128cc30db53273ee96a6dd12026da950b95ec
    source_path: automation/cron-jobs.md
    workflow: 15
---

Cron ist der integrierte Scheduler des Gateway. Er speichert Jobs dauerhaft, weckt den Agenten zum richtigen Zeitpunkt und kann Ausgaben zurück an einen Chat-Kanal oder einen Webhook-Endpunkt liefern.

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

## So funktioniert Cron

- Cron läuft **innerhalb** des Gateway-Prozesses (nicht innerhalb des Modells).
- Job-Definitionen werden unter `~/.openclaw/cron/jobs.json` gespeichert, sodass Neustarts keine Zeitpläne verlieren.
- Der Laufzeit-Ausführungsstatus wird daneben in `~/.openclaw/cron/jobs-state.json` gespeichert. Wenn Sie Cron-Definitionen in Git nachverfolgen, versionieren Sie `jobs.json` und setzen Sie `jobs-state.json` in `.gitignore`.
- Nach der Aufteilung können ältere OpenClaw-Versionen `jobs.json` lesen, behandeln Jobs jedoch möglicherweise als neu, da Laufzeitfelder jetzt in `jobs-state.json` liegen.
- Alle Cron-Ausführungen erzeugen Datensätze für [Hintergrundaufgaben](/de/automation/tasks).
- Einmalige Jobs (`--at`) werden nach erfolgreicher Ausführung standardmäßig automatisch gelöscht.
- Isolierte Cron-Ausführungen schließen nach bestem Bemühen erfasste Browser-Tabs/Prozesse für ihre `cron:<jobId>`-Sitzung, wenn der Lauf abgeschlossen ist, damit losgelöste Browser-Automatisierung keine verwaisten Prozesse hinterlässt.
- Isolierte Cron-Ausführungen schützen auch vor veralteten Bestätigungsantworten. Wenn das erste Ergebnis nur ein vorläufiges Status-Update ist (`on it`, `pulling everything together` und ähnliche Hinweise) und kein untergeordneter Subagent-Lauf mehr für die endgültige Antwort zuständig ist, fordert OpenClaw vor der Zustellung einmal erneut das tatsächliche Ergebnis an.

<a id="maintenance"></a>

<Note>
Die Aufgabenabstimmung für Cron ist zuerst laufzeitverwaltet, danach durch dauerhafte Verlaufsdaten abgesichert: Eine aktive Cron-Aufgabe bleibt aktiv, solange die Cron-Laufzeit diesen Job noch als laufend verfolgt, selbst wenn noch eine alte untergeordnete Sitzungszeile existiert. Sobald die Laufzeit den Job nicht mehr verwaltet und das Kulanzfenster von 5 Minuten abgelaufen ist, prüfen Wartungsprüfungen persistierte Ausführungsprotokolle und den Job-Status für den passenden Lauf `cron:<jobId>:<startedAt>`. Wenn diese dauerhafte Historie ein terminales Ergebnis zeigt, wird das Aufgabenjournal daraus abgeschlossen; andernfalls kann die Gateway-verwaltete Wartung die Aufgabe als `lost` markieren. Eine Offline-CLI-Prüfung kann aus der dauerhaften Historie wiederherstellen, behandelt ihre eigene leere aktive In-Process-Job-Menge jedoch nicht als Beweis dafür, dass ein Gateway-verwalteter Cron-Lauf verschwunden ist.
</Note>

## Zeitplantypen

| Typ     | CLI-Flag | Beschreibung                                           |
| ------- | -------- | ------------------------------------------------------ |
| `at`    | `--at`   | Einmaliger Zeitstempel (ISO 8601 oder relativ wie `20m`) |
| `every` | `--every`| Festes Intervall                                       |
| `cron`  | `--cron` | Cron-Ausdruck mit 5 oder 6 Feldern mit optionalem `--tz` |

Zeitstempel ohne Zeitzone werden als UTC behandelt. Fügen Sie `--tz America/New_York` hinzu, um nach lokaler Uhrzeit zu planen.

Wiederkehrende Ausdrücke zur vollen Stunde werden automatisch um bis zu 5 Minuten gestaffelt, um Lastspitzen zu verringern. Verwenden Sie `--exact`, um exaktes Timing zu erzwingen, oder `--stagger 30s` für ein explizites Fenster.

### Day-of-month und day-of-week verwenden ODER-Logik

Cron-Ausdrücke werden von [croner](https://github.com/Hexagon/croner) geparst. Wenn sowohl die Felder day-of-month als auch day-of-week keine Wildcards sind, trifft croner zu, wenn **eines** der beiden Felder passt — nicht beide. Das ist das Standardverhalten von Vixie cron.

```
# Beabsichtigt: "9 Uhr am 15., aber nur wenn es ein Montag ist"
# Tatsächlich:  "9 Uhr an jedem 15., UND 9 Uhr an jedem Montag"
0 9 15 * 1
```

Dies wird etwa 5–6 Mal pro Monat ausgelöst statt 0–1 Mal pro Monat. OpenClaw verwendet hier das standardmäßige ODER-Verhalten von Croner. Um beide Bedingungen zu verlangen, verwenden Sie den `+`-Modifikator für day-of-week von Croner (`0 9 15 * +1`) oder planen Sie nach einem Feld und prüfen Sie das andere in der Eingabeaufforderung oder dem Befehl Ihres Jobs.

## Ausführungsstile

| Stil            | Wert für `--session` | Läuft in                 | Am besten geeignet für          |
| --------------- | -------------------- | ------------------------ | ------------------------------- |
| Hauptsitzung    | `main`               | Nächster Heartbeat-Turn  | Erinnerungen, Systemereignisse  |
| Isoliert        | `isolated`           | Dediziertes `cron:<jobId>` | Berichte, Hintergrundaufgaben |
| Aktuelle Sitzung| `current`            | Bei Erstellung gebunden  | Kontextbezogene wiederkehrende Arbeit |
| Benutzerdefinierte Sitzung | `session:custom-id` | Persistente benannte Sitzung | Workflows, die auf Verlauf aufbauen |

<AccordionGroup>
  <Accordion title="Hauptsitzung vs. isoliert vs. benutzerdefiniert">
    Jobs der **Hauptsitzung** stellen ein Systemereignis in die Warteschlange und wecken optional den Heartbeat (`--wake now` oder `--wake next-heartbeat`). Diese Systemereignisse verlängern nicht die Frische für tägliche/inaktive Zurücksetzungen der Zielsitzung. **Isolierte** Jobs führen einen dedizierten Agent-Turn mit einer frischen Sitzung aus. **Benutzerdefinierte Sitzungen** (`session:xxx`) behalten Kontext über mehrere Läufe hinweg bei und ermöglichen damit Workflows wie tägliche Standups, die auf vorherigen Zusammenfassungen aufbauen.
  </Accordion>
  <Accordion title="Was 'frische Sitzung' bei isolierten Jobs bedeutet">
    Bei isolierten Jobs bedeutet „frische Sitzung“ eine neue Transkript-/Sitzungs-ID für jeden Lauf. OpenClaw kann sichere Präferenzen wie Thinking-/Fast-/Verbose-Einstellungen, Labels und explizite, vom Benutzer ausgewählte Modell-/Auth-Overrides übernehmen, übernimmt aber keinen umgebenden Gesprächskontext aus einer älteren Cron-Zeile: Kanal-/Gruppen-Routing, Sende- oder Warteschlangenrichtlinie, erhöhte Rechte, Ursprung oder ACP-Laufzeitbindung. Verwenden Sie `current` oder `session:<id>`, wenn ein wiederkehrender Job bewusst auf demselben Gesprächskontext aufbauen soll.
  </Accordion>
  <Accordion title="Laufzeit-Bereinigung">
    Bei isolierten Jobs umfasst das Herunterfahren der Laufzeit jetzt nach bestem Bemühen die Browser-Bereinigung für diese Cron-Sitzung. Fehler bei der Bereinigung werden ignoriert, damit weiterhin das tatsächliche Cron-Ergebnis zählt.

    Isolierte Cron-Ausführungen geben außerdem alle gebündelten MCP-Laufzeitinstanzen frei, die für den Job über den gemeinsamen Laufzeit-Bereinigungspfad erstellt wurden. Das entspricht dem Abbau von MCP-Clients für Hauptsitzungen und benutzerdefinierte Sitzungen, sodass isolierte Cron-Jobs keine `stdio`-Kindprozesse oder langlebigen MCP-Verbindungen über mehrere Läufe hinweg offen lassen.

  </Accordion>
  <Accordion title="Subagent- und Discord-Zustellung">
    Wenn isolierte Cron-Ausführungen Subagents orchestrieren, bevorzugt die Zustellung ebenfalls die endgültige Ausgabe des letzten Nachfahren statt veraltetem vorläufigem Text des übergeordneten Prozesses. Wenn Nachfahren noch laufen, unterdrückt OpenClaw diese partielle Aktualisierung des übergeordneten Prozesses, statt sie anzukündigen.

    Für reine Textankündigungsziele in Discord sendet OpenClaw den kanonischen endgültigen Assistententext einmal, statt sowohl gestreamte/zwischenzeitliche Text-Payloads als auch die endgültige Antwort erneut abzuspielen. Medien und strukturierte Discord-Payloads werden weiterhin als separate Payloads zugestellt, damit Anhänge und Komponenten nicht verloren gehen.

  </Accordion>
</AccordionGroup>

### Payload-Optionen für isolierte Jobs

<ParamField path="--message" type="string" required>
  Eingabeaufforderungstext (erforderlich für isolierte Jobs).
</ParamField>
<ParamField path="--model" type="string">
  Modell-Override; verwendet das für den Job ausgewählte erlaubte Modell.
</ParamField>
<ParamField path="--thinking" type="string">
  Thinking-Level-Override.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Einfügen von Workspace-Bootstrap-Dateien überspringen.
</ParamField>
<ParamField path="--tools" type="string">
  Beschränkt, welche Tools der Job verwenden kann, zum Beispiel `--tools exec,read`.
</ParamField>

`--model` verwendet das für diesen Job ausgewählte erlaubte Modell. Wenn das angeforderte Modell nicht erlaubt ist, protokolliert Cron eine Warnung und greift stattdessen auf die Modellauswahl des Jobs für Agent/Standard zurück. Konfigurierte Fallback-Ketten gelten weiterhin, aber ein einfaches Modell-Override ohne explizite Fallback-Liste pro Job hängt nicht länger das primäre Agent-Modell als zusätzliches verborgenes Wiederholungsziel an.

Die Prioritätsreihenfolge der Modellauswahl für isolierte Jobs ist:

1. Gmail-Hook-Modell-Override (wenn der Lauf von Gmail stammt und dieses Override erlaubt ist)
2. `model` in der Payload pro Job
3. Vom Benutzer ausgewähltes gespeichertes Modell-Override für die Cron-Sitzung
4. Modellauswahl für Agent/Standard

Der Fast-Modus folgt ebenfalls der aufgelösten Live-Auswahl. Wenn die ausgewählte Modellkonfiguration `params.fastMode` hat, verwenden isolierte Cron-Ausführungen dies standardmäßig. Ein gespeichertes Sitzungs-`fastMode`-Override hat in beide Richtungen weiterhin Vorrang vor der Konfiguration.

Wenn ein isolierter Lauf auf eine Live-Modellwechsel-Übergabe trifft, versucht Cron es mit dem gewechselten Provider/Modell erneut und speichert diese Live-Auswahl für den aktiven Lauf vor dem erneuten Versuch. Wenn der Wechsel auch ein neues Auth-Profil mitbringt, speichert Cron auch dieses Auth-Profil-Override für den aktiven Lauf. Wiederholungen sind begrenzt: Nach dem ersten Versuch plus 2 Wiederholungen nach Wechsel bricht Cron ab, statt endlos zu schleifen.

## Zustellung und Ausgabe

| Modus      | Was passiert                                                      |
| ---------- | ----------------------------------------------------------------- |
| `announce` | Liefert den endgültigen Text ersatzweise an das Ziel, wenn der Agent nicht gesendet hat |
| `webhook`  | Sendet die Ereignis-Payload nach Abschluss per POST an eine URL   |
| `none`     | Keine Ersatz-Zustellung durch den Runner                          |

Verwenden Sie `--announce --channel telegram --to "-1001234567890"` für die Kanalzustellung. Für Telegram-Forenthemen verwenden Sie `-1001234567890:topic:123`. Slack-/Discord-/Mattermost-Ziele sollten explizite Präfixe verwenden (`channel:<id>`, `user:<id>`). Matrix-Raum-IDs sind groß-/kleinschreibungssensitiv; verwenden Sie die exakte Raum-ID oder die Form `room:!room:server` aus Matrix.

Bei isolierten Jobs ist die Chat-Zustellung gemeinsam genutzt. Wenn eine Chat-Route verfügbar ist, kann der Agent das Tool `message` auch dann verwenden, wenn der Job `--no-deliver` nutzt. Wenn der Agent an das konfigurierte/aktuelle Ziel sendet, überspringt OpenClaw die Ersatzankündigung. Andernfalls steuern `announce`, `webhook` und `none` nur, was der Runner nach dem Agent-Turn mit der endgültigen Antwort macht.

Wenn ein Agent aus einem aktiven Chat heraus eine isolierte Erinnerung erstellt, speichert OpenClaw das erhaltene Live-Zustellungsziel für die Ersatzankündigungsroute. Interne Sitzungsschlüssel können kleingeschrieben sein; Provider-Zustellungsziele werden aus diesen Schlüsseln nicht rekonstruiert, wenn aktueller Chat-Kontext verfügbar ist.

Fehlerbenachrichtigungen folgen einem separaten Zielpfad:

- `cron.failureDestination` legt einen globalen Standard für Fehlerbenachrichtigungen fest.
- `job.delivery.failureDestination` überschreibt diesen pro Job.
- Wenn keines von beiden gesetzt ist und der Job bereits über `announce` zustellt, fallen Fehlerbenachrichtigungen jetzt auf dieses primäre Ankündigungsziel zurück.
- `delivery.failureDestination` wird nur bei Jobs mit `sessionTarget="isolated"` unterstützt, es sei denn, der primäre Zustellungsmodus ist `webhook`.

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
  <Tab title="Modell- und Thinking-Override">
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

Gateway kann HTTP-Webhook-Endpunkte für externe Trigger bereitstellen. In der Konfiguration aktivieren:

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

    Felder: `message` (erforderlich), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Zugeordnete Hooks (POST /hooks/<name>)">
    Benutzerdefinierte Hook-Namen werden über `hooks.mappings` in der Konfiguration aufgelöst. Zuordnungen können beliebige Payloads mithilfe von Vorlagen oder Code-Transformationen in `wake`- oder `agent`-Aktionen umwandeln.
  </Accordion>
</AccordionGroup>

<Warning>
Halten Sie Hook-Endpunkte hinter loopback, tailnet oder einem vertrauenswürdigen Reverse Proxy.

- Verwenden Sie ein dediziertes Hook-Token; verwenden Sie Gateway-Auth-Tokens nicht erneut.
- Belassen Sie `hooks.path` auf einem dedizierten Unterpfad; `/` wird abgelehnt.
- Setzen Sie `hooks.allowedAgentIds`, um explizites `agentId`-Routing zu begrenzen.
- Belassen Sie `hooks.allowRequestSessionKey=false`, sofern Sie keine vom Aufrufer ausgewählten Sitzungen benötigen.
- Wenn Sie `hooks.allowRequestSessionKey` aktivieren, setzen Sie zusätzlich `hooks.allowedSessionKeyPrefixes`, um zulässige Formen von Sitzungsschlüsseln einzuschränken.
- Hook-Payloads werden standardmäßig mit Sicherheitsgrenzen umschlossen.
  </Warning>

## Gmail-PubSub-Integration

Verbinden Sie Gmail-Posteingangstrigger über Google PubSub mit OpenClaw.

<Note>
**Voraussetzungen:** `gcloud` CLI, `gog` (gogcli), aktivierte OpenClaw-Hooks, Tailscale für den öffentlichen HTTPS-Endpunkt.
</Note>

### Einrichtung per Assistent (empfohlen)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Dies schreibt die Konfiguration `hooks.gmail`, aktiviert das Gmail-Preset und verwendet Tailscale Funnel für den Push-Endpunkt.

### Automatischer Gateway-Start

Wenn `hooks.enabled=true` und `hooks.gmail.account` gesetzt ist, startet das Gateway beim Booten `gog gmail watch serve` und erneuert die Überwachung automatisch. Setzen Sie `OPENCLAW_SKIP_GMAIL_WATCHER=1`, um dies zu deaktivieren.

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
  <Step title="Überwachung starten">
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
# Alle Jobs auflisten
openclaw cron list

# Einen Job anzeigen, einschließlich aufgelöster Zustellungsroute
openclaw cron show <jobId>

# Einen Job bearbeiten
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# Einen Job jetzt sofort ausführen
openclaw cron run <jobId>

# Nur ausführen, wenn fällig
openclaw cron run <jobId> --due

# Ausführungsverlauf anzeigen
openclaw cron runs --id <jobId> --limit 50

# Einen Job löschen
openclaw cron remove <jobId>

# Agent-Auswahl (Setups mit mehreren Agenten)
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops
openclaw cron edit <jobId> --clear-agent
```

<Note>
Hinweis zum Modell-Override:

- `openclaw cron add|edit --model ...` ändert das ausgewählte Modell des Jobs.
- Wenn das Modell erlaubt ist, wird genau dieser Provider/dieses Modell an den isolierten Agent-Lauf übergeben.
- Wenn es nicht erlaubt ist, warnt Cron und greift auf die Modellauswahl des Jobs für Agent/Standard zurück.
- Konfigurierte Fallback-Ketten gelten weiterhin, aber ein einfaches `--model`-Override ohne explizite Fallback-Liste pro Job fällt nicht länger stillschweigend auf das primäre Agent-Modell als zusätzliches Wiederholungsziel zurück.
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

Der Laufzeitstatus-Sidecar wird aus `cron.store` abgeleitet: Ein `.json`-Store wie `~/clawd/cron/jobs.json` verwendet `~/clawd/cron/jobs-state.json`, während ein Store-Pfad ohne Suffix `.json` `-state.json` anhängt.

Cron deaktivieren: `cron.enabled: false` oder `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Wiederholungsverhalten">
    **Wiederholung für einmalige Jobs**: Vorübergehende Fehler (Rate-Limit, Überlastung, Netzwerk, Serverfehler) werden mit exponentiellem Backoff bis zu 3 Mal wiederholt. Permanente Fehler deaktivieren sofort.

    **Wiederholung für wiederkehrende Jobs**: Exponentieller Backoff (30 s bis 60 min) zwischen Wiederholungen. Der Backoff wird nach dem nächsten erfolgreichen Lauf zurückgesetzt.

  </Accordion>
  <Accordion title="Wartung">
    `cron.sessionRetention` (Standard `24h`) bereinigt Sitzungseinträge isolierter Läufe. `cron.runLog.maxBytes` / `cron.runLog.keepLines` bereinigen Ausführungsprotokolldateien automatisch.
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
    - Vergewissern Sie sich, dass das Gateway kontinuierlich läuft.
    - Prüfen Sie bei `cron`-Zeitplänen die Zeitzone (`--tz`) im Vergleich zur Host-Zeitzone.
    - `reason: not-due` in der Ausführungsausgabe bedeutet, dass eine manuelle Ausführung mit `openclaw cron run <jobId> --due` geprüft wurde und der Job noch nicht fällig war.
  </Accordion>
  <Accordion title="Cron wurde ausgelöst, aber keine Zustellung">
    - Der Zustellungsmodus `none` bedeutet, dass keine Ersatzsendung durch den Runner zu erwarten ist. Der Agent kann dennoch direkt mit dem Tool `message` senden, wenn eine Chat-Route verfügbar ist.
    - Ein fehlendes/ungültiges Zustellungsziel (`channel`/`to`) bedeutet, dass ausgehende Zustellung übersprungen wurde.
    - Bei Matrix können kopierte oder ältere Jobs mit kleingeschriebenen Raum-IDs in `delivery.to` fehlschlagen, da Matrix-Raum-IDs groß-/kleinschreibungssensitiv sind. Bearbeiten Sie den Job auf den exakten Wert `!room:server` oder `room:!room:server` aus Matrix.
    - Kanal-Auth-Fehler (`unauthorized`, `Forbidden`) bedeuten, dass die Zustellung durch Anmeldedaten blockiert wurde.
    - Wenn der isolierte Lauf nur das stille Token (`NO_REPLY` / `no_reply`) zurückgibt, unterdrückt OpenClaw die direkte ausgehende Zustellung und auch den Fallback-Pfad für die in die Warteschlange gestellte Zusammenfassung, sodass nichts zurück in den Chat gepostet wird.
    - Wenn der Agent dem Benutzer selbst eine Nachricht senden soll, prüfen Sie, dass der Job eine nutzbare Route hat (`channel: "last"` mit einem vorherigen Chat oder einen expliziten Kanal/ein explizites Ziel).
  </Accordion>
  <Accordion title="Cron oder Heartbeat scheint ein Rollover im Stil /new zu verhindern">
    - Die Frische für tägliche und Inaktivitäts-Zurücksetzungen basiert nicht auf `updatedAt`; siehe [Sitzungsverwaltung](/de/concepts/session#session-lifecycle).
    - Cron-Weckereignisse, Heartbeat-Läufe, `exec`-Benachrichtigungen und Gateway-Bookkeeping können die Sitzungszeile für Routing/Status aktualisieren, verlängern aber nicht `sessionStartedAt` oder `lastInteractionAt`.
    - Bei älteren Zeilen, die erstellt wurden, bevor diese Felder existierten, kann OpenClaw `sessionStartedAt` aus dem JSONL-Sitzungs-Header des Transkripts wiederherstellen, wenn die Datei noch verfügbar ist. Ältere Inaktivitätszeilen ohne `lastInteractionAt` verwenden diese wiederhergestellte Startzeit als Basis für Inaktivität.
  </Accordion>
  <Accordion title="Fallstricke bei Zeitzonen">
    - Cron ohne `--tz` verwendet die Zeitzone des Gateway-Hosts.
    - `at`-Zeitpläne ohne Zeitzone werden als UTC behandelt.
    - Heartbeat `activeHours` verwendet die konfigurierte Zeitzonenauflösung.
  </Accordion>
</AccordionGroup>

## Verwandt

- [Automatisierung & Aufgaben](/de/automation) — alle Automatisierungsmechanismen auf einen Blick
- [Hintergrundaufgaben](/de/automation/tasks) — Aufgabenjournal für Cron-Ausführungen
- [Heartbeat](/de/gateway/heartbeat) — periodische Hauptsitzungs-Turns
- [Zeitzone](/de/concepts/timezone) — Zeitzonenkonfiguration
