---
read_when:
    - Planen von Hintergrundjobs oder Wakeups
    - Externe Trigger (Webhooks, Gmail) in OpenClaw integrieren
    - Entscheiden zwischen Heartbeat und Cron für geplante Aufgaben
summary: Geplante Jobs, Webhooks und Gmail-PubSub-Trigger für den Gateway-Scheduler
title: Geplante Aufgaben
x-i18n:
    generated_at: "2026-04-25T13:40:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9ed4dc7222b601b37d98cf1575ced7fd865987882a8c5b28245c5d2423b4cc56
    source_path: automation/cron-jobs.md
    workflow: 15
---

Cron ist der integrierte Scheduler des Gateway. Er speichert Jobs dauerhaft, weckt den Agenten zur richtigen Zeit auf und kann Ausgaben an einen Chat-Kanal oder einen Webhook-Endpunkt zurückliefern.

## Schnellstart

```bash
# Eine einmalige Erinnerung hinzufügen
openclaw cron add \
  --name "Reminder" \
  --at "2026-02-01T16:00:00Z" \
  --session main \
  --system-event "Reminder: check the cron docs draft" \
  --wake now \
  --delete-after-run

# Ihre Jobs prüfen
openclaw cron list
openclaw cron show <job-id>

# Laufverlauf anzeigen
openclaw cron runs --id <job-id>
```

## So funktioniert Cron

- Cron läuft **innerhalb des Gateway**-Prozesses (nicht innerhalb des Modells).
- Job-Definitionen werden unter `~/.openclaw/cron/jobs.json` dauerhaft gespeichert, sodass Neustarts Zeitpläne nicht verlieren.
- Der Laufzeit-Ausführungsstatus wird daneben in `~/.openclaw/cron/jobs-state.json` gespeichert. Wenn Sie Cron-Definitionen in Git nachverfolgen, verfolgen Sie `jobs.json` und setzen Sie `jobs-state.json` auf Git-Ignorieren.
- Nach der Aufteilung können ältere OpenClaw-Versionen `jobs.json` lesen, behandeln Jobs jedoch möglicherweise als neu, weil Laufzeitfelder jetzt in `jobs-state.json` liegen.
- Alle Cron-Ausführungen erstellen Einträge für [Hintergrundaufgaben](/de/automation/tasks).
- Einmalige Jobs (`--at`) werden nach erfolgreicher Ausführung standardmäßig automatisch gelöscht.
- Isolierte Cron-Läufe schließen nach bestem Bemühen verfolgte Browser-Tabs/-Prozesse für ihre `cron:<jobId>`-Sitzung, wenn der Lauf abgeschlossen ist, sodass abgekoppelte Browser-Automatisierung keine verwaisten Prozesse hinterlässt.
- Isolierte Cron-Läufe schützen außerdem vor veralteten Bestätigungsantworten. Wenn das erste Ergebnis nur ein vorläufiges Status-Update ist (`on it`, `pulling everything together` und ähnliche Hinweise) und kein nachgelagerter Subagent-Lauf mehr für die endgültige Antwort verantwortlich ist, fordert OpenClaw vor der Zustellung noch einmal das tatsächliche Ergebnis an.

<a id="maintenance"></a>

Die Aufgabenabstimmung für Cron ist laufzeiteigen: Eine aktive Cron-Aufgabe bleibt aktiv, solange die Cron-Laufzeit diesen Job noch als laufend verfolgt, auch wenn noch eine alte untergeordnete Sitzungszeile existiert.
Sobald die Laufzeit den Job nicht mehr besitzt und das 5-Minuten-Gnadenfenster abgelaufen ist, kann die Wartung die Aufgabe als `lost` markieren.

## Zeitplantypen

| Typ     | CLI-Flag | Beschreibung                                                |
| ------- | -------- | ----------------------------------------------------------- |
| `at`    | `--at`   | Einmaliger Zeitstempel (ISO 8601 oder relativ wie `20m`)    |
| `every` | `--every`| Festes Intervall                                            |
| `cron`  | `--cron` | Cron-Ausdruck mit 5 oder 6 Feldern mit optionalem `--tz`    |

Zeitstempel ohne Zeitzone werden als UTC behandelt. Fügen Sie `--tz America/New_York` für lokale Wanduhr-Planung hinzu.

Wiederkehrende Ausdrücke zur vollen Stunde werden automatisch um bis zu 5 Minuten gestaffelt, um Lastspitzen zu reduzieren. Verwenden Sie `--exact`, um exaktes Timing zu erzwingen, oder `--stagger 30s` für ein explizites Fenster.

### Day-of-month und day-of-week verwenden ODER-Logik

Cron-Ausdrücke werden von [croner](https://github.com/Hexagon/croner) geparst. Wenn sowohl die Felder day-of-month als auch day-of-week keine Wildcards sind, gleicht croner ab, wenn **eines** der beiden Felder passt — nicht beide. Dies ist das Standardverhalten von Vixie cron.

```
# Beabsichtigt: "9 Uhr am 15., nur wenn es ein Montag ist"
# Tatsächlich:  "9 Uhr an jedem 15., UND 9 Uhr an jedem Montag"
0 9 15 * 1
```

Dies wird etwa 5–6 Mal pro Monat ausgelöst statt 0–1 Mal pro Monat. OpenClaw verwendet hier das standardmäßige ODER-Verhalten von Croner. Um beide Bedingungen zu verlangen, verwenden Sie den `+`-Modifier für day-of-week von Croner (`0 9 15 * +1`) oder planen Sie nach einem Feld und prüfen Sie das andere im Prompt oder Befehl Ihres Jobs.

## Ausführungsstile

| Stil            | Wert von `--session` | Läuft in                 | Am besten geeignet für           |
| --------------- | -------------------- | ------------------------ | -------------------------------- |
| Hauptsitzung    | `main`               | Nächster Heartbeat-Turn  | Erinnerungen, Systemereignisse   |
| Isoliert        | `isolated`           | Dediziertes `cron:<jobId>` | Berichte, Hintergrundarbeiten  |
| Aktuelle Sitzung| `current`            | Beim Erstellen gebunden  | Kontextabhängige wiederkehrende Arbeit |
| Benutzerdefinierte Sitzung | `session:custom-id` | Dauerhafte benannte Sitzung | Workflows, die auf Verlauf aufbauen |

Jobs der **Hauptsitzung** reihen ein Systemereignis ein und wecken optional den Heartbeat (`--wake now` oder `--wake next-heartbeat`). **Isolierte** Jobs führen einen dedizierten Agent-Turn mit einer frischen Sitzung aus. **Benutzerdefinierte Sitzungen** (`session:xxx`) behalten Kontext über mehrere Läufe hinweg bei und ermöglichen Workflows wie tägliche Standups, die auf vorherigen Zusammenfassungen aufbauen.

Bei isolierten Jobs bedeutet „frische Sitzung“ eine neue Transkript-/Sitzungs-ID für jeden Lauf. OpenClaw kann sichere Präferenzen wie Einstellungen für thinking/fast/verbose, Labels und explizit vom Benutzer ausgewählte Modell-/Auth-Overrides übernehmen, erbt jedoch keinen umgebenden Gesprächskontext aus einer älteren Cron-Zeile: Kanal-/Gruppenrouting, Sende- oder Warteschlangenrichtlinie, Erhöhung, Ursprung oder ACP-Laufzeitbindung. Verwenden Sie `current` oder `session:<id>`, wenn ein wiederkehrender Job bewusst auf demselben Gesprächskontext aufbauen soll.

Bei isolierten Jobs umfasst der Laufzeitabbau jetzt auch bestmögliche Browser-Bereinigung für diese Cron-Sitzung. Bereinigungsfehler werden ignoriert, damit das tatsächliche Cron-Ergebnis weiterhin Vorrang hat.

Isolierte Cron-Läufe entsorgen außerdem alle gebündelten MCP-Laufzeitinstanzen, die für den Job über den gemeinsamen Laufzeit-Bereinigungspfad erstellt wurden. Das entspricht dem Abbau von MCP-Clients für Hauptsitzungen und benutzerdefinierte Sitzungen, sodass isolierte Cron-Jobs keine stdio-Child-Prozesse oder langlebigen MCP-Verbindungen über mehrere Läufe hinweg leaken.

Wenn isolierte Cron-Läufe Subagenten orchestrieren, bevorzugt die Zustellung außerdem die endgültige Ausgabe von Nachfahren gegenüber veraltetem vorläufigem Text des Elternteils. Wenn Nachfahren noch laufen, unterdrückt OpenClaw dieses teilweise Update des Elternteils, statt es anzukündigen.

Für reine Text-Discord-Ankündigungsziele sendet OpenClaw den kanonischen endgültigen Assistententext einmal, statt sowohl gestreamte/zwischenzeitliche Text-Payloads als auch die endgültige Antwort erneut wiederzugeben. Medien und strukturierte Discord-Payloads werden weiterhin als separate Payloads zugestellt, damit Anhänge und Komponenten nicht verloren gehen.

### Payload-Optionen für isolierte Jobs

- `--message`: Prompt-Text (für isolierte Jobs erforderlich)
- `--model` / `--thinking`: Overrides für Modell und Denkstufe
- `--light-context`: Injektion der Workspace-Bootstrap-Datei überspringen
- `--tools exec,read`: einschränken, welche Tools der Job verwenden kann

`--model` verwendet das für diesen Job ausgewählte erlaubte Modell. Wenn das angeforderte Modell nicht erlaubt ist, protokolliert Cron eine Warnung und greift stattdessen auf die Modellauswahl des Agenten/Standards für diesen Job zurück. Konfigurierte Fallback-Ketten gelten weiterhin, aber ein reines Modell-Override ohne explizite Fallback-Liste pro Job hängt das primäre Agentenmodell nicht mehr als verborgenes zusätzliches Wiederholungsziel an.

Die Priorität der Modellauswahl für isolierte Jobs ist:

1. Gmail-Hook-Modell-Override (wenn der Lauf von Gmail kam und dieses Override erlaubt ist)
2. `model` in der Payload pro Job
3. Vom Benutzer ausgewähltes gespeichertes Modell-Override der Cron-Sitzung
4. Modellauswahl des Agenten/Standards

Der Fast-Modus folgt ebenfalls der aufgelösten Live-Auswahl. Wenn die ausgewählte Modellkonfiguration `params.fastMode` hat, verwendet isoliertes Cron dies standardmäßig. Ein gespeichertes Sitzungs-Override für `fastMode` hat in beide Richtungen weiterhin Vorrang vor der Konfiguration.

Wenn ein isolierter Lauf auf eine Live-Modellwechsel-Übergabe trifft, versucht Cron es mit dem gewechselten Provider/Modell erneut und speichert diese Live-Auswahl vor dem erneuten Versuch für den aktiven Lauf. Wenn der Wechsel auch ein neues Auth-Profil mitbringt, speichert Cron auch dieses Auth-Profil-Override für den aktiven Lauf. Wiederholungen sind begrenzt: Nach dem ersten Versuch plus 2 Wechsel-Wiederholungen bricht Cron ab, statt endlos zu schleifen.

## Zustellung und Ausgabe

| Modus      | Was passiert                                                       |
| ---------- | ------------------------------------------------------------------ |
| `announce` | Stellt den endgültigen Text ersatzweise an das Ziel zu, wenn der Agent nicht gesendet hat |
| `webhook`  | Sendet die Payload des abgeschlossenen Ereignisses per POST an eine URL |
| `none`     | Keine Fallback-Zustellung durch den Runner                         |

Verwenden Sie `--announce --channel telegram --to "-1001234567890"` für die Kanalzustellung. Für Telegram-Forenthemen verwenden Sie `-1001234567890:topic:123`. Slack-/Discord-/Mattermost-Ziele sollten explizite Präfixe verwenden (`channel:<id>`, `user:<id>`).

Bei isolierten Jobs ist die Chat-Zustellung gemeinsam. Wenn eine Chat-Route verfügbar ist, kann der Agent das Tool `message` auch dann verwenden, wenn der Job `--no-deliver` nutzt. Wenn der Agent an das konfigurierte/aktuelle Ziel sendet, überspringt OpenClaw das Fallback-announce. Andernfalls steuern `announce`, `webhook` und `none` nur, was der Runner nach dem Agent-Turn mit der endgültigen Antwort macht.

Fehlerbenachrichtigungen folgen einem separaten Zielpfad:

- `cron.failureDestination` setzt einen globalen Standard für Fehlerbenachrichtigungen.
- `job.delivery.failureDestination` überschreibt dies pro Job.
- Wenn keines von beiden gesetzt ist und der Job bereits über `announce` zustellt, greifen Fehlerbenachrichtigungen jetzt auf dieses primäre Ankündigungsziel zurück.
- `delivery.failureDestination` wird nur bei Jobs mit `sessionTarget="isolated"` unterstützt, sofern der primäre Zustellmodus nicht `webhook` ist.

## CLI-Beispiele

Einmalige Erinnerung (Hauptsitzung):

```bash
openclaw cron add \
  --name "Calendar check" \
  --at "20m" \
  --session main \
  --system-event "Next heartbeat: check calendar." \
  --wake now
```

Wiederkehrender isolierter Job mit Zustellung:

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

Isolierter Job mit Modell- und thinking-Override:

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

Jede Anfrage muss das Hook-Token über einen Header enthalten:

- `Authorization: Bearer <token>` (empfohlen)
- `x-openclaw-token: <token>`

Tokens in Query-Strings werden abgelehnt.

### POST /hooks/wake

Ein Systemereignis für die Hauptsitzung einreihen:

```bash
curl -X POST http://127.0.0.1:18789/hooks/wake \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"text":"New email received","mode":"now"}'
```

- `text` (erforderlich): Ereignisbeschreibung
- `mode` (optional): `now` (Standard) oder `next-heartbeat`

### POST /hooks/agent

Einen isolierten Agent-Turn ausführen:

```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
```

Felder: `message` (erforderlich), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `thinking`, `timeoutSeconds`.

### Zugeordnete Hooks (POST /hooks/\<name\>)

Benutzerdefinierte Hook-Namen werden über `hooks.mappings` in der Konfiguration aufgelöst. Zuordnungen können beliebige Payloads mit Vorlagen oder Code-Transformationen in Aktionen vom Typ `wake` oder `agent` umwandeln.

### Sicherheit

- Halten Sie Hook-Endpunkte hinter loopback, tailnet oder einem vertrauenswürdigen Reverse-Proxy.
- Verwenden Sie ein dediziertes Hook-Token; verwenden Sie Gateway-Auth-Tokens nicht wieder.
- Halten Sie `hooks.path` auf einem dedizierten Unterpfad; `/` wird abgelehnt.
- Setzen Sie `hooks.allowedAgentIds`, um explizites `agentId`-Routing zu begrenzen.
- Lassen Sie `hooks.allowRequestSessionKey=false`, sofern Sie keine vom Aufrufer ausgewählten Sitzungen benötigen.
- Wenn Sie `hooks.allowRequestSessionKey` aktivieren, setzen Sie auch `hooks.allowedSessionKeyPrefixes`, um erlaubte Formen von Sitzungsschlüsseln einzuschränken.
- Hook-Payloads werden standardmäßig mit Sicherheitsgrenzen umschlossen.

## Gmail-PubSub-Integration

Verbinden Sie Gmail-Posteingangs-Trigger über Google PubSub mit OpenClaw.

**Voraussetzungen**: `gcloud` CLI, `gog` (gogcli), OpenClaw-Hooks aktiviert, Tailscale für den öffentlichen HTTPS-Endpunkt.

### Einrichtung per Assistent (empfohlen)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Dies schreibt die Konfiguration `hooks.gmail`, aktiviert das Gmail-Preset und verwendet Tailscale Funnel für den Push-Endpunkt.

### Automatischer Gateway-Start

Wenn `hooks.enabled=true` und `hooks.gmail.account` gesetzt ist, startet das Gateway beim Booten `gog gmail watch serve` und erneuert den Watch automatisch. Setzen Sie `OPENCLAW_SKIP_GMAIL_WATCHER=1`, um dies zu deaktivieren.

### Manuelle einmalige Einrichtung

1. Wählen Sie das GCP-Projekt aus, dem der von `gog` verwendete OAuth-Client gehört:

```bash
gcloud auth login
gcloud config set project <project-id>
gcloud services enable gmail.googleapis.com pubsub.googleapis.com
```

2. Erstellen Sie das Topic und gewähren Sie Gmail Push-Zugriff:

```bash
gcloud pubsub topics create gog-gmail-watch
gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
  --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
  --role=roles/pubsub.publisher
```

3. Starten Sie den Watch:

```bash
gog gmail watch start \
  --account openclaw@gmail.com \
  --label INBOX \
  --topic projects/<project-id>/topics/gog-gmail-watch
```

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

# Einen Job anzeigen, einschließlich aufgelöster Zustellroute
openclaw cron show <jobId>

# Einen Job bearbeiten
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# Einen Job jetzt erzwingen
openclaw cron run <jobId>

# Nur ausführen, wenn fällig
openclaw cron run <jobId> --due

# Laufverlauf anzeigen
openclaw cron runs --id <jobId> --limit 50

# Einen Job löschen
openclaw cron remove <jobId>

# Agentenauswahl (Multi-Agent-Setups)
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops
openclaw cron edit <jobId> --clear-agent
```

Hinweis zum Modell-Override:

- `openclaw cron add|edit --model ...` ändert das ausgewählte Modell des Jobs.
- Wenn das Modell erlaubt ist, erreicht genau dieser Provider/dieses Modell den isolierten Agent-Lauf.
- Wenn es nicht erlaubt ist, gibt Cron eine Warnung aus und greift auf die Modellwahl des Agenten/Standards für den Job zurück.
- Konfigurierte Fallback-Ketten gelten weiterhin, aber ein einfaches `--model`-Override ohne explizite Fallback-Liste pro Job fällt nicht mehr auf das primäre Agentenmodell als stilles zusätzliches Wiederholungsziel zurück.

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

Das Laufzeit-State-Sidecar wird aus `cron.store` abgeleitet: Ein `.json`-Store wie
`~/clawd/cron/jobs.json` verwendet `~/clawd/cron/jobs-state.json`, während ein Store-Pfad
ohne Suffix `.json` `-state.json` anhängt.

Cron deaktivieren: `cron.enabled: false` oder `OPENCLAW_SKIP_CRON=1`.

**Wiederholung bei einmaligen Jobs**: Vorübergehende Fehler (Rate-Limit, Überlastung, Netzwerk, Serverfehler) werden mit exponentiellem Backoff bis zu 3-mal erneut versucht. Permanente Fehler werden sofort deaktiviert.

**Wiederholung bei wiederkehrenden Jobs**: Exponentieller Backoff (30 s bis 60 min) zwischen Wiederholungen. Der Backoff wird nach dem nächsten erfolgreichen Lauf zurückgesetzt.

**Wartung**: `cron.sessionRetention` (Standard `24h`) bereinigt isolierte Run-Session-Einträge. `cron.runLog.maxBytes` / `cron.runLog.keepLines` bereinigen Run-Log-Dateien automatisch.

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

### Cron wird nicht ausgelöst

- Prüfen Sie `cron.enabled` und die Umgebungsvariable `OPENCLAW_SKIP_CRON`.
- Bestätigen Sie, dass das Gateway kontinuierlich läuft.
- Prüfen Sie bei `cron`-Zeitplänen die Zeitzone (`--tz`) im Vergleich zur Host-Zeitzone.
- `reason: not-due` in der Run-Ausgabe bedeutet, dass ein manueller Lauf mit `openclaw cron run <jobId> --due` geprüft wurde und der Job noch nicht fällig war.

### Cron wurde ausgelöst, aber keine Zustellung

- Zustellmodus `none` bedeutet, dass kein Runner-Fallback-Versand erwartet wird. Der Agent kann mit dem Tool `message` dennoch direkt senden, wenn eine Chat-Route verfügbar ist.
- Fehlendes/ungültiges Zustellziel (`channel`/`to`) bedeutet, dass ausgehende Zustellung übersprungen wurde.
- Fehler bei der Kanalautorisierung (`unauthorized`, `Forbidden`) bedeuten, dass die Zustellung durch Anmeldedaten blockiert wurde.
- Wenn der isolierte Lauf nur das stille Token (`NO_REPLY` / `no_reply`) zurückgibt, unterdrückt OpenClaw die direkte ausgehende Zustellung und auch den Fallback-Pfad für die Zusammenfassung in der Warteschlange, sodass nichts in den Chat zurückgepostet wird.
- Wenn der Agent dem Benutzer selbst eine Nachricht senden soll, prüfen Sie, dass der Job eine nutzbare Route hat (`channel: "last"` mit einem vorherigen Chat oder ein expliziter Kanal/ein explizites Ziel).

### Fallstricke bei Zeitzonen

- Cron ohne `--tz` verwendet die Zeitzone des Gateway-Hosts.
- `at`-Zeitpläne ohne Zeitzone werden als UTC behandelt.
- `activeHours` von Heartbeat verwendet die konfigurierte Zeitzonenauflösung.

## Verwandt

- [Automatisierung & Aufgaben](/de/automation) — alle Automatisierungsmechanismen auf einen Blick
- [Hintergrundaufgaben](/de/automation/tasks) — Aufgabenprotokoll für Cron-Ausführungen
- [Heartbeat](/de/gateway/heartbeat) — periodische Turns der Hauptsitzung
- [Zeitzone](/de/concepts/timezone) — Zeitzonenkonfiguration
