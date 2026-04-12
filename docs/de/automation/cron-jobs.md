---
read_when:
    - Planen von Hintergrundjobs oder Aufweckvorgängen
    - Externe Trigger (Webhooks, Gmail) in OpenClaw integrieren
    - Entscheidung zwischen Heartbeat und Cron für geplante Aufgaben
summary: Geplante Jobs, Webhooks und Gmail-PubSub-Trigger für den Gateway-Scheduler
title: Geplante Aufgaben
x-i18n:
    generated_at: "2026-04-12T06:16:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: f42bcaeedd0595d025728d7f236a724a0ebc67b6813c57233f4d739b3088317f
    source_path: automation/cron-jobs.md
    workflow: 15
---

# Geplante Aufgaben (Cron)

Cron ist der integrierte Scheduler des Gateway. Er speichert Jobs dauerhaft, weckt den Agenten zur richtigen Zeit auf und kann Ausgaben zurück an einen Chat-Kanal oder einen Webhook-Endpunkt liefern.

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
- Jobs werden unter `~/.openclaw/cron/jobs.json` gespeichert, damit Neustarts keine Zeitpläne verlieren.
- Alle Cron-Ausführungen erstellen Einträge für [Hintergrundaufgaben](/de/automation/tasks).
- Einmalige Jobs (`--at`) werden standardmäßig nach erfolgreicher Ausführung automatisch gelöscht.
- Isolierte Cron-Ausführungen schließen nach bestem Bemühen verfolgte Browser-Tabs/Prozesse für ihre Session `cron:<jobId>`, wenn die Ausführung abgeschlossen ist, damit losgelöste Browser-Automatisierung keine verwaisten Prozesse hinterlässt.
- Isolierte Cron-Ausführungen schützen außerdem vor veralteten Bestätigungsantworten. Wenn das erste Ergebnis nur eine vorläufige Statusaktualisierung ist (`on it`, `pulling everything together` und ähnliche Hinweise) und keine untergeordnete Subagent-Ausführung mehr für die endgültige Antwort verantwortlich ist, fordert OpenClaw vor der Zustellung noch einmal das tatsächliche Ergebnis an.

<a id="maintenance"></a>

Die Aufgabenabstimmung für Cron wird von der Laufzeit verwaltet: Eine aktive Cron-Aufgabe bleibt aktiv, solange die Cron-Laufzeit diesen Job noch als laufend verfolgt, auch wenn noch ein alter untergeordneter Session-Eintrag existiert.
Sobald die Laufzeit den Job nicht mehr verwaltet und das Kulanzfenster von 5 Minuten abgelaufen ist, kann die Wartung die Aufgabe als `lost` markieren.

## Zeitplantypen

| Art     | CLI-Flag | Beschreibung                                                  |
| ------- | -------- | ------------------------------------------------------------- |
| `at`    | `--at`   | Einmaliger Zeitstempel (ISO 8601 oder relativ wie `20m`)      |
| `every` | `--every`| Festes Intervall                                              |
| `cron`  | `--cron` | 5-Feld- oder 6-Feld-Cron-Ausdruck mit optionalem `--tz`       |

Zeitstempel ohne Zeitzone werden als UTC behandelt. Fügen Sie `--tz America/New_York` hinzu, um nach lokaler Uhrzeit zu planen.

Wiederkehrende Ausdrücke zur vollen Stunde werden automatisch um bis zu 5 Minuten gestaffelt, um Lastspitzen zu verringern. Verwenden Sie `--exact`, um exaktes Timing zu erzwingen, oder `--stagger 30s` für ein explizites Zeitfenster.

### Tag des Monats und Wochentag verwenden ODER-Logik

Cron-Ausdrücke werden von [croner](https://github.com/Hexagon/croner) geparst. Wenn sowohl die Felder für Tag des Monats als auch Wochentag nicht mit Wildcards versehen sind, trifft croner zu, wenn **eines** der beiden Felder zutrifft — nicht beide. Das ist das Standardverhalten von Vixie cron.

```
# Beabsichtigt: "9 Uhr am 15., aber nur wenn es ein Montag ist"
# Tatsächlich:  "9 Uhr an jedem 15., UND 9 Uhr an jedem Montag"
0 9 15 * 1
```

Das wird etwa 5–6 Mal pro Monat ausgelöst statt 0–1 Mal pro Monat. OpenClaw verwendet hier das standardmäßige ODER-Verhalten von Croner. Um beide Bedingungen zu verlangen, verwenden Sie den `+`-Wochentagsmodifikator von Croner (`0 9 15 * +1`) oder planen Sie nach einem Feld und prüfen Sie das andere im Prompt oder Befehl Ihres Jobs.

## Ausführungsstile

| Stil            | Wert für `--session` | Läuft in                  | Am besten geeignet für             |
| --------------- | -------------------- | ------------------------- | ---------------------------------- |
| Hauptsession    | `main`               | Nächster Heartbeat-Turn   | Erinnerungen, Systemereignisse     |
| Isoliert        | `isolated`           | Dedizierte `cron:<jobId>` | Berichte, Hintergrundaufgaben      |
| Aktuelle Session| `current`            | Beim Erstellen gebunden   | Wiederkehrende kontextbezogene Arbeit |
| Benutzerdefinierte Session | `session:custom-id` | Persistente benannte Session | Workflows, die auf Verlauf aufbauen |

Jobs der **Hauptsession** reihen ein Systemereignis ein und wecken optional den Heartbeat auf (`--wake now` oder `--wake next-heartbeat`). **Isolierte** Jobs führen einen dedizierten Agent-Turn mit einer frischen Session aus. **Benutzerdefinierte Sessions** (`session:xxx`) behalten Kontext über Ausführungen hinweg bei und ermöglichen so Workflows wie tägliche Standups, die auf früheren Zusammenfassungen aufbauen.

Für isolierte Jobs umfasst das Laufzeit-Teardown nun auch eine Browser-Bereinigung nach bestem Bemühen für diese Cron-Session. Fehler bei der Bereinigung werden ignoriert, damit das eigentliche Cron-Ergebnis weiterhin Vorrang hat.

Wenn isolierte Cron-Ausführungen Subagenten orchestrieren, bevorzugt die Zustellung außerdem die endgültige Ausgabe der Nachfolger gegenüber veraltetem vorläufigem Text des Elternteils. Wenn Nachfolger noch laufen, unterdrückt OpenClaw diese partielle Aktualisierung des Elternteils, anstatt sie anzukündigen.

### Nutzlastoptionen für isolierte Jobs

- `--message`: Prompt-Text (für isolierte Jobs erforderlich)
- `--model` / `--thinking`: Überschreibungen für Modell und Thinking-Stufe
- `--light-context`: Workspace-Bootstrap-Dateiinjektion überspringen
- `--tools exec,read`: einschränken, welche Tools der Job verwenden darf

`--model` verwendet das für diesen Job ausgewählte zulässige Modell. Wenn das angeforderte Modell nicht zulässig ist, protokolliert Cron eine Warnung und greift stattdessen auf die Modellauswahl des Jobs-Agenten/Standards zurück. Konfigurierte Fallback-Ketten gelten weiterhin, aber eine einfache Modellüberschreibung ohne explizite Fallback-Liste pro Job hängt den primären Agenten nicht länger als verstecktes zusätzliches Retry-Ziel an.

Die Priorität der Modellauswahl für isolierte Jobs ist:

1. Modellüberschreibung des Gmail-Hooks (wenn die Ausführung von Gmail stammt und diese Überschreibung zulässig ist)
2. `model` in der Nutzlast pro Job
3. Gespeicherte Modellüberschreibung der Cron-Session
4. Modellauswahl des Agenten/Standards

Der Fast-Modus folgt ebenfalls der aufgelösten Live-Auswahl. Wenn die ausgewählte Modellkonfiguration `params.fastMode` hat, verwendet isoliertes Cron dies standardmäßig. Eine gespeicherte Überschreibung der Session für `fastMode` hat in beide Richtungen weiterhin Vorrang vor der Konfiguration.

Wenn eine isolierte Ausführung auf eine Live-Modellwechsel-Übergabe stößt, wiederholt Cron den Versuch mit dem gewechselten Provider/Modell und speichert diese Live-Auswahl vor dem erneuten Versuch. Wenn der Wechsel auch ein neues Auth-Profil mitbringt, speichert Cron auch diese Überschreibung des Auth-Profils. Wiederholungen sind begrenzt: Nach dem ersten Versuch plus 2 Wechsel-Wiederholungen bricht Cron ab, statt endlos zu schleifen.

## Zustellung und Ausgabe

| Modus      | Was passiert                                                |
| ---------- | ----------------------------------------------------------- |
| `announce` | Zusammenfassung an Zielkanal liefern (Standard für isolierte Jobs) |
| `webhook`  | Ereignis-Nutzlast nach Abschluss per POST an eine URL senden |
| `none`     | Nur intern, keine Zustellung                                |

Verwenden Sie `--announce --channel telegram --to "-1001234567890"` für die Zustellung an einen Kanal. Für Telegram-Forenthemen verwenden Sie `-1001234567890:topic:123`. Slack-/Discord-/Mattermost-Ziele sollten explizite Präfixe verwenden (`channel:<id>`, `user:<id>`).

Bei Cron-eigenen isolierten Jobs besitzt der Runner den finalen Zustellpfad. Der Agent wird aufgefordert, eine Klartextzusammenfassung zurückzugeben, und diese Zusammenfassung wird dann über `announce` oder `webhook` gesendet oder bei `none` intern behalten. `--no-deliver` gibt die Zustellung nicht an den Agenten zurück; stattdessen bleibt die Ausführung intern.

Wenn in der ursprünglichen Aufgabe ausdrücklich steht, dass eine externe Empfängerin oder ein externer Empfänger benachrichtigt werden soll, sollte der Agent in seiner Ausgabe notieren, an wen/wo diese Nachricht gehen soll, statt zu versuchen, sie direkt zu senden.

Benachrichtigungen bei Fehlern folgen einem separaten Zielpfad:

- `cron.failureDestination` setzt einen globalen Standard für Fehlerbenachrichtigungen.
- `job.delivery.failureDestination` überschreibt dies pro Job.
- Wenn keines von beiden gesetzt ist und der Job bereits per `announce` zustellt, fallen Fehlerbenachrichtigungen nun auf dieses primäre Ankündigungsziel zurück.
- `delivery.failureDestination` wird nur für Jobs mit `sessionTarget="isolated"` unterstützt, es sei denn, der primäre Zustellmodus ist `webhook`.

## CLI-Beispiele

Einmalige Erinnerung (Hauptsession):

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

Isolierter Job mit Überschreibung von Modell und Thinking:

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

Das Gateway kann HTTP-Webhook-Endpunkte für externe Trigger bereitstellen. Aktivierung in der Konfiguration:

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

Ein Systemereignis für die Hauptsession einreihen:

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
  -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4-mini"}'
```

Felder: `message` (erforderlich), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `thinking`, `timeoutSeconds`.

### Zugeordnete Hooks (POST /hooks/\<name\>)

Benutzerdefinierte Hook-Namen werden über `hooks.mappings` in der Konfiguration aufgelöst. Zuordnungen können beliebige Nutzlasten mit Vorlagen oder Code-Transformationen in Aktionen vom Typ `wake` oder `agent` umwandeln.

### Sicherheit

- Halten Sie Hook-Endpunkte hinter loopback, tailnet oder einem vertrauenswürdigen Reverse-Proxy.
- Verwenden Sie ein dediziertes Hook-Token; verwenden Sie keine Gateway-Auth-Tokens erneut.
- Halten Sie `hooks.path` auf einem dedizierten Unterpfad; `/` wird abgelehnt.
- Setzen Sie `hooks.allowedAgentIds`, um explizites `agentId`-Routing zu begrenzen.
- Lassen Sie `hooks.allowRequestSessionKey=false`, sofern Sie keine vom Aufrufer ausgewählten Sessions benötigen.
- Wenn Sie `hooks.allowRequestSessionKey` aktivieren, setzen Sie außerdem `hooks.allowedSessionKeyPrefixes`, um erlaubte Formen von Session-Keys einzuschränken.
- Hook-Nutzlasten werden standardmäßig mit Sicherheitsgrenzen umschlossen.

## Gmail-PubSub-Integration

Verbinden Sie Gmail-Posteingangs-Trigger über Google PubSub mit OpenClaw.

**Voraussetzungen**: `gcloud` CLI, `gog` (gogcli), aktivierte OpenClaw-Hooks, Tailscale für den öffentlichen HTTPS-Endpunkt.

### Einrichtung per Assistent (empfohlen)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Dies schreibt die Konfiguration `hooks.gmail`, aktiviert das Gmail-Preset und verwendet Tailscale Funnel für den Push-Endpunkt.

### Gateway-Autostart

Wenn `hooks.enabled=true` und `hooks.gmail.account` gesetzt ist, startet das Gateway beim Booten `gog gmail watch serve` und erneuert den Watch automatisch. Setzen Sie `OPENCLAW_SKIP_GMAIL_WATCHER=1`, um dies zu deaktivieren.

### Manuelle einmalige Einrichtung

1. Wählen Sie das GCP-Projekt aus, dem der von `gog` verwendete OAuth-Client gehört:

```bash
gcloud auth login
gcloud config set project <project-id>
gcloud services enable gmail.googleapis.com pubsub.googleapis.com
```

2. Thema erstellen und Gmail-Push-Zugriff gewähren:

```bash
gcloud pubsub topics create gog-gmail-watch
gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
  --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
  --role=roles/pubsub.publisher
```

3. Den Watch starten:

```bash
gog gmail watch start \
  --account openclaw@gmail.com \
  --label INBOX \
  --topic projects/<project-id>/topics/gog-gmail-watch
```

### Modellüberschreibung für Gmail

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

# Einen Job jetzt erzwingen
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

Hinweis zur Modellüberschreibung:

- `openclaw cron add|edit --model ...` ändert das für den Job ausgewählte Modell.
- Wenn das Modell zulässig ist, erreicht genau dieser Provider/dieses Modell die isolierte Agent-Ausführung.
- Wenn es nicht zulässig ist, gibt Cron eine Warnung aus und greift auf die Modell-Auswahl des Jobs-Agenten/Standards zurück.
- Konfigurierte Fallback-Ketten gelten weiterhin, aber eine einfache Überschreibung mit `--model` ohne explizite Fallback-Liste pro Job fällt nicht länger stillschweigend auf den primären Agenten als zusätzliches Retry-Ziel zurück.

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

Cron deaktivieren: `cron.enabled: false` oder `OPENCLAW_SKIP_CRON=1`.

**Wiederholungen für einmalige Jobs**: Vorübergehende Fehler (Rate-Limit, Überlastung, Netzwerk, Serverfehler) werden mit exponentiellem Backoff bis zu 3-mal wiederholt. Permanente Fehler werden sofort deaktiviert.

**Wiederholungen für wiederkehrende Jobs**: Exponentielles Backoff (30s bis 60m) zwischen Wiederholungen. Das Backoff wird nach der nächsten erfolgreichen Ausführung zurückgesetzt.

**Wartung**: `cron.sessionRetention` (Standard `24h`) entfernt Einträge isolierter Ausführungs-Sessions. `cron.runLog.maxBytes` / `cron.runLog.keepLines` kürzen Ausführungs-Logdateien automatisch.

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
- Stellen Sie sicher, dass das Gateway kontinuierlich läuft.
- Prüfen Sie bei `cron`-Zeitplänen die Zeitzone (`--tz`) im Verhältnis zur Zeitzone des Hosts.
- `reason: not-due` in der Ausführungsausgabe bedeutet, dass die manuelle Ausführung mit `openclaw cron run <jobId> --due` geprüft wurde und der Job noch nicht fällig war.

### Cron wurde ausgelöst, aber keine Zustellung

- Der Zustellmodus `none` bedeutet, dass keine externe Nachricht erwartet wird.
- Fehlt das Zustellziel oder ist es ungültig (`channel`/`to`), wurde der Versand ausgelassen.
- Auth-Fehler des Kanals (`unauthorized`, `Forbidden`) bedeuten, dass die Zustellung durch Anmeldedaten blockiert wurde.
- Wenn die isolierte Ausführung nur das stille Token (`NO_REPLY` / `no_reply`) zurückgibt, unterdrückt OpenClaw die direkte externe Zustellung und auch den Fallback-Pfad für die Warteschlangen-Zusammenfassung, sodass nichts an den Chat zurückgesendet wird.
- Erwarten Sie bei Cron-eigenen isolierten Jobs nicht, dass der Agent das Nachrichtentool als Fallback verwendet. Der Runner verwaltet die finale Zustellung; `--no-deliver` hält sie intern, statt einen direkten Versand zu erlauben.

### Fallstricke bei Zeitzonen

- Cron ohne `--tz` verwendet die Zeitzone des Gateway-Hosts.
- `at`-Zeitpläne ohne Zeitzone werden als UTC behandelt.
- Heartbeat `activeHours` verwendet die konfigurierte Zeitzonenauflösung.

## Verwandt

- [Automatisierung & Aufgaben](/de/automation) — alle Automatisierungsmechanismen auf einen Blick
- [Hintergrundaufgaben](/de/automation/tasks) — Aufgabenprotokoll für Cron-Ausführungen
- [Heartbeat](/de/gateway/heartbeat) — periodische Turns der Hauptsession
- [Zeitzone](/de/concepts/timezone) — Zeitzonenkonfiguration
