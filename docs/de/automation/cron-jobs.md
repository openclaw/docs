---
read_when:
    - Planung von Hintergrundjobs oder Weckvorgängen
    - Einbindung externer Trigger (Webhooks, Gmail) in OpenClaw
    - Entscheidung zwischen Heartbeat und Cron für geplante Aufgaben
summary: Geplante Jobs, Webhooks und Gmail-PubSub-Trigger für den Gateway-Planer
title: Geplante Aufgaben
x-i18n:
    generated_at: "2026-04-11T02:44:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04d94baa152de17d78515f7d545f099fe4810363ab67e06b465e489737f54665
    source_path: automation/cron-jobs.md
    workflow: 15
---

# Geplante Aufgaben (Cron)

Cron ist der integrierte Planer des Gateway. Er speichert Jobs dauerhaft, weckt den Agenten zum richtigen Zeitpunkt und kann Ausgaben zurück an einen Chat-Kanal oder einen Webhook-Endpunkt senden.

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

# Ausführungsverlauf anzeigen
openclaw cron runs --id <job-id>
```

## So funktioniert Cron

- Cron läuft **innerhalb des Gateway**-Prozesses (nicht innerhalb des Modells).
- Jobs werden unter `~/.openclaw/cron/jobs.json` dauerhaft gespeichert, damit Neustarts keine Zeitpläne verlieren.
- Alle Cron-Ausführungen erstellen Einträge für [Hintergrundaufgaben](/de/automation/tasks).
- Einmalige Jobs (`--at`) werden nach erfolgreicher Ausführung standardmäßig automatisch gelöscht.
- Isolierte Cron-Ausführungen schließen nach bestem Bemühen verfolgte Browser-Tabs/Prozesse für ihre Sitzung `cron:<jobId>`, wenn die Ausführung abgeschlossen ist, damit abgekoppelte Browser-Automatisierung keine verwaisten Prozesse hinterlässt.
- Isolierte Cron-Ausführungen schützen außerdem vor veralteten Bestätigungsantworten. Wenn das erste Ergebnis nur eine vorläufige Statusaktualisierung ist (`on it`, `pulling everything together` und ähnliche Hinweise) und keine untergeordnete Subagent-Ausführung mehr für die endgültige Antwort verantwortlich ist, fordert OpenClaw vor der Zustellung noch einmal das tatsächliche Ergebnis an.

<a id="maintenance"></a>

Die Aufgabenabstimmung für Cron liegt in der Laufzeitumgebung: Eine aktive Cron-Aufgabe bleibt aktiv, solange die Cron-Laufzeit diesen Job noch als laufend verfolgt, selbst wenn noch eine alte untergeordnete Sitzungszeile existiert.
Sobald die Laufzeit den Job nicht mehr verwaltet und das 5-Minuten-Gnadenfenster abgelaufen ist, kann die Wartung die Aufgabe als `lost` markieren.

## Zeitplantypen

| Art     | CLI-Flag | Beschreibung                                                |
| ------- | -------- | ----------------------------------------------------------- |
| `at`    | `--at`   | Einmaliger Zeitstempel (ISO 8601 oder relativ wie `20m`)    |
| `every` | `--every`| Festes Intervall                                            |
| `cron`  | `--cron` | 5-Feld- oder 6-Feld-Cron-Ausdruck mit optionalem `--tz`     |

Zeitstempel ohne Zeitzone werden als UTC behandelt. Fügen Sie `--tz America/New_York` hinzu, um nach lokaler Uhrzeit zu planen.

Wiederkehrende Ausdrücke zur vollen Stunde werden automatisch um bis zu 5 Minuten gestaffelt, um Lastspitzen zu verringern. Verwenden Sie `--exact`, um exaktes Timing zu erzwingen, oder `--stagger 30s` für ein explizites Fenster.

## Ausführungsstile

| Stil             | Wert für `--session` | Läuft in                 | Am besten geeignet für           |
| ---------------- | -------------------- | ------------------------ | -------------------------------- |
| Hauptsitzung     | `main`               | Nächster Heartbeat-Turn  | Erinnerungen, Systemereignisse   |
| Isoliert         | `isolated`           | Dediziertes `cron:<jobId>` | Berichte, Hintergrundaufgaben  |
| Aktuelle Sitzung | `current`            | Bei Erstellung gebunden  | Kontextbewusste wiederkehrende Arbeit |
| Benutzerdefinierte Sitzung | `session:custom-id` | Dauerhafte benannte Sitzung | Workflows, die auf Verlauf aufbauen |

Jobs der **Hauptsitzung** reihen ein Systemereignis ein und können optional den Heartbeat wecken (`--wake now` oder `--wake next-heartbeat`). **Isolierte** Jobs führen einen dedizierten Agenten-Turn mit einer frischen Sitzung aus. **Benutzerdefinierte Sitzungen** (`session:xxx`) behalten den Kontext über mehrere Ausführungen hinweg bei und ermöglichen Workflows wie tägliche Standups, die auf vorherigen Zusammenfassungen aufbauen.

Bei isolierten Jobs umfasst das Aufräumen der Laufzeit jetzt die Bereinigung des Browsers für diese Cron-Sitzung nach bestem Bemühen. Fehler bei der Bereinigung werden ignoriert, damit das eigentliche Cron-Ergebnis Vorrang hat.

Wenn isolierte Cron-Ausführungen Subagenten orchestrieren, bevorzugt die Zustellung außerdem die endgültige Ausgabe des Nachfolgers gegenüber veraltetem vorläufigem Text des Elternteils. Wenn Nachfolger noch laufen, unterdrückt OpenClaw diese teilweise Elternaktualisierung, statt sie anzukündigen.

### Nutzlastoptionen für isolierte Jobs

- `--message`: Prompt-Text (für isolierte Jobs erforderlich)
- `--model` / `--thinking`: Überschreibungen für Modell und Thinking-Stufe
- `--light-context`: Überspringt die Injektion von Bootstrap-Dateien für den Workspace
- `--tools exec,read`: Beschränkt, welche Tools der Job verwenden kann

`--model` verwendet das für diesen Job ausgewählte erlaubte Modell. Wenn das angeforderte Modell nicht erlaubt ist, protokolliert Cron eine Warnung und fällt stattdessen auf die Modellauswahl des Job-Agenten bzw. des Standardmodells zurück. Konfigurierte Fallback-Ketten gelten weiterhin, aber eine einfache Modellüberschreibung ohne explizite Fallback-Liste pro Job hängt das primäre Agentenmodell nicht mehr als verborgenes zusätzliches Wiederholungsziel an.

Die Priorität der Modellauswahl für isolierte Jobs ist:

1. Gmail-Hook-Modellüberschreibung (wenn die Ausführung von Gmail stammt und diese Überschreibung erlaubt ist)
2. `model` in der Nutzlast pro Job
3. Gespeicherte Modellüberschreibung der Cron-Sitzung
4. Modellauswahl des Agenten/Standardmodells

Der Schnellmodus folgt ebenfalls der aufgelösten Live-Auswahl. Wenn die ausgewählte Modellkonfiguration `params.fastMode` hat, verwendet isoliertes Cron das standardmäßig. Eine gespeicherte Sitzungsüberschreibung für `fastMode` hat in beide Richtungen weiterhin Vorrang vor der Konfiguration.

Wenn eine isolierte Ausführung auf eine Live-Modellwechsel-Übergabe trifft, versucht Cron es mit dem gewechselten Provider/Modell erneut und speichert diese Live-Auswahl vor dem Wiederholungsversuch. Wenn der Wechsel auch ein neues Authentifizierungsprofil enthält, speichert Cron auch diese Überschreibung des Authentifizierungsprofils dauerhaft. Wiederholungen sind begrenzt: Nach dem ersten Versuch plus 2 Wiederholungsversuchen nach Wechsel bricht Cron ab, statt endlos zu schleifen.

## Zustellung und Ausgabe

| Modus      | Was passiert                                              |
| ---------- | --------------------------------------------------------- |
| `announce` | Sendet eine Zusammenfassung an den Zielkanal (Standard für isolierte Jobs) |
| `webhook`  | Sendet per POST die Nutzlast des abgeschlossenen Ereignisses an eine URL |
| `none`     | Nur intern, keine Zustellung                              |

Verwenden Sie `--announce --channel telegram --to "-1001234567890"` für die Zustellung an einen Kanal. Für Telegram-Forenthemen verwenden Sie `-1001234567890:topic:123`. Ziele für Slack/Discord/Mattermost sollten explizite Präfixe verwenden (`channel:<id>`, `user:<id>`).

Bei isolierten Jobs in Besitz von Cron steuert der Runner den endgültigen Zustellpfad. Der Agent wird aufgefordert, eine Klartext-Zusammenfassung zurückzugeben, und diese Zusammenfassung wird dann per `announce` oder `webhook` gesendet oder bei `none` intern behalten. `--no-deliver` gibt die Zustellung nicht an den Agenten zurück; die Ausführung bleibt intern.

Wenn die ursprüngliche Aufgabe explizit sagt, dass ein externer Empfänger benachrichtigt werden soll, sollte der Agent in seiner Ausgabe angeben, wer/wo dieser Empfänger ist, statt zu versuchen, die Nachricht direkt zu senden.

Fehlerbenachrichtigungen folgen einem separaten Zielpfad:

- `cron.failureDestination` legt einen globalen Standard für Fehlerbenachrichtigungen fest.
- `job.delivery.failureDestination` überschreibt dies pro Job.
- Wenn keines von beiden gesetzt ist und der Job bereits per `announce` zustellt, greifen Fehlerbenachrichtigungen jetzt standardmäßig auf dieses primäre Ankündigungsziel zurück.
- `delivery.failureDestination` wird nur für Jobs mit `sessionTarget="isolated"` unterstützt, sofern der primäre Zustellmodus nicht `webhook` ist.

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

Isolierter Job mit Überschreibung für Modell und Thinking:

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

Das Gateway kann HTTP-Webhooks-Endpunkte für externe Trigger bereitstellen. In der Konfiguration aktivieren:

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

Tokens in der Query-String werden abgelehnt.

### POST /hooks/wake

Reiht ein Systemereignis für die Hauptsitzung ein:

```bash
curl -X POST http://127.0.0.1:18789/hooks/wake \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"text":"New email received","mode":"now"}'
```

- `text` (erforderlich): Ereignisbeschreibung
- `mode` (optional): `now` (Standard) oder `next-heartbeat`

### POST /hooks/agent

Führt einen isolierten Agenten-Turn aus:

```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4-mini"}'
```

Felder: `message` (erforderlich), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `thinking`, `timeoutSeconds`.

### Zugeordnete Hooks (POST /hooks/\<name\>)

Benutzerdefinierte Hook-Namen werden über `hooks.mappings` in der Konfiguration aufgelöst. Zuordnungen können beliebige Nutzlasten mit Vorlagen oder Code-Transformationen in Aktionen vom Typ `wake` oder `agent` umwandeln.

### Sicherheit

- Halten Sie Hook-Endpunkte hinter loopback, tailnet oder einem vertrauenswürdigen Reverse-Proxy.
- Verwenden Sie ein dediziertes Hook-Token; verwenden Sie keine Gateway-Authentifizierungstokens erneut.
- Halten Sie `hooks.path` auf einem dedizierten Unterpfad; `/` wird abgelehnt.
- Setzen Sie `hooks.allowedAgentIds`, um explizites `agentId`-Routing einzuschränken.
- Lassen Sie `hooks.allowRequestSessionKey=false`, es sei denn, Sie benötigen vom Aufrufer ausgewählte Sitzungen.
- Wenn Sie `hooks.allowRequestSessionKey` aktivieren, setzen Sie auch `hooks.allowedSessionKeyPrefixes`, um erlaubte Formen von Sitzungsschlüsseln einzuschränken.
- Hook-Nutzlasten werden standardmäßig mit Sicherheitsgrenzen umschlossen.

## Gmail-PubSub-Integration

Verbinden Sie Gmail-Posteingangs-Trigger über Google PubSub mit OpenClaw.

**Voraussetzungen**: `gcloud` CLI, `gog` (gogcli), aktivierte OpenClaw-Hooks, Tailscale für den öffentlichen HTTPS-Endpunkt.

### Assistentengestützte Einrichtung (empfohlen)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Dies schreibt die Konfiguration `hooks.gmail`, aktiviert die Gmail-Voreinstellung und verwendet Tailscale Funnel für den Push-Endpunkt.

### Automatischer Gateway-Start

Wenn `hooks.enabled=true` und `hooks.gmail.account` gesetzt ist, startet das Gateway beim Booten `gog gmail watch serve` und erneuert die Watch automatisch. Setzen Sie `OPENCLAW_SKIP_GMAIL_WATCHER=1`, um dies zu deaktivieren.

### Manuelle einmalige Einrichtung

1. Wählen Sie das GCP-Projekt aus, dem der von `gog` verwendete OAuth-Client gehört:

```bash
gcloud auth login
gcloud config set project <project-id>
gcloud services enable gmail.googleapis.com pubsub.googleapis.com
```

2. Thema erstellen und Gmail Push-Zugriff gewähren:

```bash
gcloud pubsub topics create gog-gmail-watch
gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
  --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
  --role=roles/pubsub.publisher
```

3. Die Watch starten:

```bash
gog gmail watch start \
  --account openclaw@gmail.com \
  --label INBOX \
  --topic projects/<project-id>/topics/gog-gmail-watch
```

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
# Alle Jobs auflisten
openclaw cron list

# Einen Job bearbeiten
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# Einen Job sofort ausführen
openclaw cron run <jobId>

# Nur ausführen, wenn fällig
openclaw cron run <jobId> --due

# Ausführungsverlauf anzeigen
openclaw cron runs --id <jobId> --limit 50

# Einen Job löschen
openclaw cron remove <jobId>

# Agentenauswahl (Setups mit mehreren Agenten)
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops
openclaw cron edit <jobId> --clear-agent
```

Hinweis zur Modellüberschreibung:

- `openclaw cron add|edit --model ...` ändert das ausgewählte Modell des Jobs.
- Wenn das Modell erlaubt ist, erreicht genau dieser Provider/dieses Modell die isolierte Agenten-Ausführung.
- Wenn es nicht erlaubt ist, warnt Cron und fällt auf die Modellauswahl des Job-Agenten bzw. des Standardmodells zurück.
- Konfigurierte Fallback-Ketten gelten weiterhin, aber eine einfache `--model`-Überschreibung ohne explizite Fallback-Liste pro Job fällt nicht mehr stillschweigend auf das primäre Agentenmodell als zusätzliches Wiederholungsziel zurück.

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
    webhookToken: "durch-ein-dediziertes-webhook-token-ersetzen",
    sessionRetention: "24h",
    runLog: { maxBytes: "2mb", keepLines: 2000 },
  },
}
```

Cron deaktivieren: `cron.enabled: false` oder `OPENCLAW_SKIP_CRON=1`.

**Wiederholungen für einmalige Jobs**: Vorübergehende Fehler (Ratenbegrenzung, Überlastung, Netzwerk, Serverfehler) werden mit exponentiellem Backoff bis zu 3-mal wiederholt. Permanente Fehler führen zur sofortigen Deaktivierung.

**Wiederholungen für wiederkehrende Jobs**: Exponentieller Backoff (30s bis 60m) zwischen Wiederholungsversuchen. Der Backoff wird nach der nächsten erfolgreichen Ausführung zurückgesetzt.

**Wartung**: `cron.sessionRetention` (Standard `24h`) bereinigt Einträge isolierter Ausführungs-Sitzungen. `cron.runLog.maxBytes` / `cron.runLog.keepLines` bereinigen Ausführungsprotokolldateien automatisch.

## Fehlerbehebung

### Befehlsabfolge

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
- Prüfen Sie bei `cron`-Zeitplänen die Zeitzone (`--tz`) im Vergleich zur Zeitzone des Hosts.
- `reason: not-due` in der Ausführungsausgabe bedeutet, dass die manuelle Ausführung mit `openclaw cron run <jobId> --due` geprüft wurde und der Job noch nicht fällig war.

### Cron wurde ausgelöst, aber keine Zustellung

- Zustellmodus `none` bedeutet, dass keine externe Nachricht erwartet wird.
- Fehlendes/ungültiges Zustellziel (`channel`/`to`) bedeutet, dass ausgehende Zustellung übersprungen wurde.
- Kanal-Authentifizierungsfehler (`unauthorized`, `Forbidden`) bedeuten, dass die Zustellung durch Anmeldedaten blockiert wurde.
- Wenn die isolierte Ausführung nur das stille Token (`NO_REPLY` / `no_reply`) zurückgibt, unterdrückt OpenClaw die direkte ausgehende Zustellung und auch den Fallback-Pfad für die in die Warteschlange gestellte Zusammenfassung, sodass nichts in den Chat zurückgesendet wird.
- Erwarten Sie bei Cron-gesteuerten isolierten Jobs nicht, dass der Agent das Nachrichtentool als Fallback verwendet. Der Runner steuert die endgültige Zustellung; `--no-deliver` hält sie intern, statt ein direktes Senden zu erlauben.

### Fallstricke bei Zeitzonen

- Cron ohne `--tz` verwendet die Zeitzone des Gateway-Hosts.
- `at`-Zeitpläne ohne Zeitzone werden als UTC behandelt.
- Heartbeat `activeHours` verwendet die konfigurierte Zeitzonenauflösung.

## Verwandt

- [Automatisierung & Aufgaben](/de/automation) — alle Automatisierungsmechanismen auf einen Blick
- [Hintergrundaufgaben](/de/automation/tasks) — Aufgabenprotokoll für Cron-Ausführungen
- [Heartbeat](/de/gateway/heartbeat) — periodische Hauptsitzungs-Turns
- [Zeitzone](/de/concepts/timezone) — Zeitzonenkonfiguration
