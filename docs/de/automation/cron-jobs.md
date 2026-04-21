---
read_when:
    - Hintergrundjobs oder Aufweckvorgänge planen
    - Externe Trigger (Webhooks, Gmail) in OpenClaw integrieren
    - Zwischen Heartbeat und Cron für geplante Aufgaben entscheiden
summary: Geplante Jobs, Webhooks und Gmail-PubSub-Trigger für den Gateway-Scheduler
title: Geplante Aufgaben
x-i18n:
    generated_at: "2026-04-21T13:35:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: ac08f67af43bc85a1713558899a220c935479620f1ef74aa76336259daac2828
    source_path: automation/cron-jobs.md
    workflow: 15
---

# Geplante Aufgaben (Cron)

Cron ist der integrierte Scheduler des Gateway. Er speichert Jobs dauerhaft, weckt den Agenten zum richtigen Zeitpunkt und kann Ausgaben zurück an einen Chat-Kanal oder einen Webhook-Endpunkt zustellen.

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

# Ausführungsverlauf anzeigen
openclaw cron runs --id <job-id>
```

## So funktioniert Cron

- Cron läuft **innerhalb des Gateway**-Prozesses (nicht innerhalb des Modells).
- Job-Definitionen werden unter `~/.openclaw/cron/jobs.json` dauerhaft gespeichert, sodass Neustarts Zeitpläne nicht verlieren.
- Der Laufzeit-Ausführungsstatus wird daneben in `~/.openclaw/cron/jobs-state.json` gespeichert. Wenn Sie Cron-Definitionen in Git verfolgen, verfolgen Sie `jobs.json` und fügen Sie `jobs-state.json` zu `.gitignore` hinzu.
- Nach der Aufteilung können ältere OpenClaw-Versionen `jobs.json` lesen, behandeln Jobs aber möglicherweise als neu, weil Laufzeitfelder jetzt in `jobs-state.json` liegen.
- Alle Cron-Ausführungen erzeugen Einträge für [Hintergrundaufgaben](/de/automation/tasks).
- Einmalige Jobs (`--at`) werden nach erfolgreicher Ausführung standardmäßig automatisch gelöscht.
- Isolierte Cron-Ausführungen schließen nach bestem Bemühen verfolgte Browser-Tabs/Prozesse für ihre Sitzung `cron:<jobId>`, wenn die Ausführung abgeschlossen ist, damit abgekoppelte Browser-Automatisierung keine verwaisten Prozesse hinterlässt.
- Isolierte Cron-Ausführungen schützen auch vor veralteten Bestätigungsantworten. Wenn das erste Ergebnis nur ein vorläufiges Status-Update ist (`on it`, `pulling everything together` und ähnliche Hinweise) und keine nachgeordnete Subagent-Ausführung noch für die endgültige Antwort verantwortlich ist, fordert OpenClaw einmal erneut zum eigentlichen Ergebnis auf, bevor es zugestellt wird.

<a id="maintenance"></a>

Die Aufgabenabstimmung für Cron gehört der Laufzeit: Eine aktive Cron-Aufgabe bleibt aktiv, solange die Cron-Laufzeit diesen Job noch als laufend verfolgt, selbst wenn noch ein alter Kind-Sitzungseintrag existiert.
Sobald die Laufzeit den Job nicht mehr besitzt und das 5-Minuten-Gnadenfenster abgelaufen ist, kann die Wartung die Aufgabe als `lost` markieren.

## Zeitplantypen

| Art     | CLI-Flag | Beschreibung                                                  |
| ------- | -------- | ------------------------------------------------------------- |
| `at`    | `--at`   | Einmaliger Zeitstempel (ISO 8601 oder relativ wie `20m`)      |
| `every` | `--every`| Fester Intervall                                              |
| `cron`  | `--cron` | Cron-Ausdruck mit 5 oder 6 Feldern mit optionalem `--tz`      |

Zeitstempel ohne Zeitzone werden als UTC behandelt. Fügen Sie `--tz America/New_York` für eine lokale Uhrzeitplanung hinzu.

Wiederkehrende Ausdrücke zur vollen Stunde werden automatisch um bis zu 5 Minuten gestaffelt, um Lastspitzen zu reduzieren. Verwenden Sie `--exact`, um exaktes Timing zu erzwingen, oder `--stagger 30s` für ein explizites Fenster.

### Tag des Monats und Wochentag verwenden ODER-Logik

Cron-Ausdrücke werden von [croner](https://github.com/Hexagon/croner) geparst. Wenn sowohl die Felder für Tag des Monats als auch Wochentag kein Wildcard sind, trifft croner zu, wenn **eines** der Felder passt — nicht beide. Dies ist das standardmäßige Vixie-Cron-Verhalten.

```
# Beabsichtigt: "9 Uhr am 15., aber nur wenn es ein Montag ist"
# Tatsächlich: "9 Uhr an jedem 15., UND 9 Uhr an jedem Montag"
0 9 15 * 1
```

Dies wird etwa 5–6-mal pro Monat ausgelöst statt 0–1-mal pro Monat. OpenClaw verwendet hier das standardmäßige ODER-Verhalten von Croner. Um beide Bedingungen zu verlangen, verwenden Sie den `+`-Wochentag-Modifikator von Croner (`0 9 15 * +1`) oder planen Sie nach einem Feld und prüfen Sie das andere im Prompt oder Befehl Ihres Jobs.

## Ausführungsstile

| Stil            | Wert von `--session` | Läuft in                 | Am besten geeignet für          |
| --------------- | -------------------- | ------------------------ | -------------------------------- |
| Hauptsitzung    | `main`               | Nächste Heartbeat-Runde  | Erinnerungen, Systemereignisse   |
| Isoliert        | `isolated`           | Dedizierte `cron:<jobId>`| Berichte, Hintergrundaufgaben    |
| Aktuelle Sitzung| `current`            | Bei Erstellung gebunden  | Kontextbewusste wiederkehrende Arbeit |
| Benutzerdefinierte Sitzung | `session:custom-id` | Dauerhafte benannte Sitzung | Workflows, die auf Verlauf aufbauen |

Jobs in der **Hauptsitzung** stellen ein Systemereignis in die Warteschlange und wecken optional den Heartbeat (`--wake now` oder `--wake next-heartbeat`). **Isolierte** Jobs führen eine dedizierte Agent-Runde mit einer frischen Sitzung aus. **Benutzerdefinierte Sitzungen** (`session:xxx`) behalten Kontext über mehrere Ausführungen hinweg bei und ermöglichen Workflows wie tägliche Standups, die auf vorherigen Zusammenfassungen aufbauen.

Bei isolierten Jobs umfasst der Laufzeitabbau jetzt auch die Browser-Bereinigung nach bestem Bemühen für diese Cron-Sitzung. Fehler bei der Bereinigung werden ignoriert, sodass das tatsächliche Cron-Ergebnis weiterhin Vorrang hat.

Wenn isolierte Cron-Ausführungen Subagenten orchestrieren, bevorzugt die Zustellung außerdem die endgültige Ausgabe der nachgeordneten Ausführung gegenüber veraltetem vorläufigem Text der übergeordneten Ausführung. Wenn nachgeordnete Ausführungen noch laufen, unterdrückt OpenClaw dieses partielle Update der übergeordneten Ausführung, statt es anzukündigen.

### Payload-Optionen für isolierte Jobs

- `--message`: Prompt-Text (für isolierte Jobs erforderlich)
- `--model` / `--thinking`: Überschreibungen für Modell und Thinking-Level
- `--light-context`: Dateiinjektion beim Workspace-Bootstrap überspringen
- `--tools exec,read`: einschränken, welche Tools der Job verwenden kann

`--model` verwendet das für diesen Job ausgewählte erlaubte Modell. Wenn das angeforderte Modell nicht erlaubt ist, protokolliert Cron eine Warnung und fällt stattdessen auf die Modellauswahl des Agenten/Standardmodells für den Job zurück. Konfigurierte Fallback-Ketten gelten weiterhin, aber eine einfache Modellüberschreibung ohne explizite jobbezogene Fallback-Liste hängt das primäre Agentenmodell nicht mehr als verborgenes zusätzliches Wiederholungsziel an.

Die Reihenfolge der Modellauswahl für isolierte Jobs ist:

1. Modellüberschreibung des Gmail-Hooks (wenn die Ausführung von Gmail kam und diese Überschreibung erlaubt ist)
2. Jobbezogenes Payload-`model`
3. Gespeicherte Modellüberschreibung der Cron-Sitzung
4. Modellauswahl des Agenten/Standardmodells

Der Fast-Modus folgt ebenfalls der aufgelösten Live-Auswahl. Wenn die ausgewählte Modellkonfiguration `params.fastMode` hat, verwendet isoliertes Cron dies standardmäßig. Eine gespeicherte Sitzungsüberschreibung für `fastMode` hat in beide Richtungen weiterhin Vorrang vor der Konfiguration.

Wenn eine isolierte Ausführung auf eine Live-Modellwechsel-Übergabe trifft, versucht Cron es mit dem gewechselten Provider/Modell erneut und speichert diese Live-Auswahl vor dem erneuten Versuch. Wenn der Wechsel auch ein neues Auth-Profil enthält, speichert Cron auch diese Überschreibung des Auth-Profils. Wiederholungen sind begrenzt: Nach dem ersten Versuch plus 2 Wechsel-Wiederholungen bricht Cron ab, statt endlos zu schleifen.

## Zustellung und Ausgabe

| Modus      | Was passiert                                                     |
| ---------- | ---------------------------------------------------------------- |
| `announce` | Stellt den finalen Text ersatzweise an das Ziel zu, falls der Agent nichts gesendet hat |
| `webhook`  | POSTet die Nutzlast des abgeschlossenen Ereignisses an eine URL  |
| `none`     | Keine Fallback-Zustellung durch den Runner                       |

Verwenden Sie `--announce --channel telegram --to "-1001234567890"` für die Zustellung an einen Kanal. Für Telegram-Forenthemen verwenden Sie `-1001234567890:topic:123`. Ziele für Slack/Discord/Mattermost sollten explizite Präfixe verwenden (`channel:<id>`, `user:<id>`).

Bei isolierten Jobs ist die Chat-Zustellung gemeinsam genutzt. Wenn eine Chat-Route verfügbar ist, kann der Agent das Tool `message` verwenden, auch wenn der Job `--no-deliver` verwendet. Wenn der Agent an das konfigurierte/aktuelle Ziel sendet, überspringt OpenClaw das Fallback-`announce`. Andernfalls steuern `announce`, `webhook` und `none` nur, was der Runner nach der Agent-Runde mit der endgültigen Antwort macht.

Fehlerbenachrichtigungen folgen einem separaten Zielpfad:

- `cron.failureDestination` setzt einen globalen Standard für Fehlerbenachrichtigungen.
- `job.delivery.failureDestination` überschreibt dies pro Job.
- Wenn keines von beiden gesetzt ist und der Job bereits über `announce` zustellt, fallen Fehlerbenachrichtigungen jetzt auf dieses primäre `announce`-Ziel zurück.
- `delivery.failureDestination` wird nur bei Jobs mit `sessionTarget="isolated"` unterstützt, es sei denn, der primäre Zustellmodus ist `webhook`.

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

Isolierter Job mit Modell- und Thinking-Überschreibung:

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

Das Gateway kann HTTP-Webhook-Endpunkte für externe Trigger bereitstellen. In der Konfiguration aktivieren:

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

Stellt ein Systemereignis für die Hauptsitzung in die Warteschlange:

```bash
curl -X POST http://127.0.0.1:18789/hooks/wake \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"text":"New email received","mode":"now"}'
```

- `text` (erforderlich): Ereignisbeschreibung
- `mode` (optional): `now` (Standard) oder `next-heartbeat`

### POST /hooks/agent

Führt eine isolierte Agent-Runde aus:

```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4-mini"}'
```

Felder: `message` (erforderlich), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `thinking`, `timeoutSeconds`.

### Zugeordnete Hooks (POST /hooks/\<name\>)

Benutzerdefinierte Hook-Namen werden über `hooks.mappings` in der Konfiguration aufgelöst. Zuordnungen können beliebige Payloads mit Vorlagen oder Code-Transformationen in Aktionen vom Typ `wake` oder `agent` umwandeln.

### Sicherheit

- Halten Sie Hook-Endpunkte hinter Loopback, Tailnet oder einem vertrauenswürdigen Reverse-Proxy.
- Verwenden Sie ein dediziertes Hook-Token; verwenden Sie keine Gateway-Auth-Tokens erneut.
- Halten Sie `hooks.path` auf einem dedizierten Unterpfad; `/` wird abgelehnt.
- Setzen Sie `hooks.allowedAgentIds`, um explizites `agentId`-Routing zu begrenzen.
- Belassen Sie `hooks.allowRequestSessionKey=false`, es sei denn, Sie benötigen vom Aufrufer ausgewählte Sitzungen.
- Wenn Sie `hooks.allowRequestSessionKey` aktivieren, setzen Sie auch `hooks.allowedSessionKeyPrefixes`, um erlaubte Formen von Sitzungsschlüsseln einzuschränken.
- Hook-Payloads werden standardmäßig mit Sicherheitsgrenzen umschlossen.

## Gmail-PubSub-Integration

Verbinden Sie Gmail-Posteingangs-Trigger über Google PubSub mit OpenClaw.

**Voraussetzungen**: `gcloud`-CLI, `gog` (gogcli), aktivierte OpenClaw-Hooks, Tailscale für den öffentlichen HTTPS-Endpunkt.

### Einrichtung per Assistent (empfohlen)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Dies schreibt die Konfiguration `hooks.gmail`, aktiviert das Gmail-Preset und verwendet Tailscale Funnel für den Push-Endpunkt.

### Gateway-Autostart

Wenn `hooks.enabled=true` und `hooks.gmail.account` gesetzt ist, startet das Gateway beim Booten `gog gmail watch serve` und erneuert die Watch automatisch. Setzen Sie `OPENCLAW_SKIP_GMAIL_WATCHER=1`, um dies zu deaktivieren.

### Manuelle einmalige Einrichtung

1. Wählen Sie das GCP-Projekt aus, dem der von `gog` verwendete OAuth-Client gehört:

```bash
gcloud auth login
gcloud config set project <project-id>
gcloud services enable gmail.googleapis.com pubsub.googleapis.com
```

2. Topic erstellen und Gmail Push-Zugriff gewähren:

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

# Einen Job anzeigen, einschließlich aufgelöster Zustellroute
openclaw cron show <jobId>

# Einen Job bearbeiten
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# Einen Job jetzt erzwungen ausführen
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
- Wenn das Modell erlaubt ist, erreicht genau dieser Provider/dieses Modell die isolierte Agent-Ausführung.
- Wenn es nicht erlaubt ist, gibt Cron eine Warnung aus und fällt auf die Auswahl des Agenten-/Standardmodells des Jobs zurück.
- Konfigurierte Fallback-Ketten gelten weiterhin, aber eine einfache `--model`-Überschreibung ohne explizite jobbezogene Fallback-Liste fällt nicht mehr stillschweigend auf das primäre Agentenmodell als zusätzliches Wiederholungsziel zurück.

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

Der Laufzeit-Zustands-Sidecar wird aus `cron.store` abgeleitet: Ein `.json`-Store wie
`~/clawd/cron/jobs.json` verwendet `~/clawd/cron/jobs-state.json`, während ein Store-Pfad
ohne `.json`-Suffix `-state.json` anhängt.

Cron deaktivieren: `cron.enabled: false` oder `OPENCLAW_SKIP_CRON=1`.

**Wiederholungen für Einmaljobs**: Vorübergehende Fehler (Rate-Limit, Überlastung, Netzwerk, Serverfehler) werden mit exponentiellem Backoff bis zu 3-mal wiederholt. Permanente Fehler werden sofort deaktiviert.

**Wiederholungen für wiederkehrende Jobs**: Exponentieller Backoff (30 s bis 60 min) zwischen Wiederholungen. Der Backoff wird nach der nächsten erfolgreichen Ausführung zurückgesetzt.

**Wartung**: `cron.sessionRetention` (Standard `24h`) bereinigt isolierte Lauf-Sitzungseinträge. `cron.runLog.maxBytes` / `cron.runLog.keepLines` bereinigen Run-Log-Dateien automatisch.

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
- Prüfen Sie bei `cron`-Zeitplänen die Zeitzone (`--tz`) im Vergleich zur Zeitzone des Hosts.
- `reason: not-due` in der Ausführungsausgabe bedeutet, dass die manuelle Ausführung mit `openclaw cron run <jobId> --due` geprüft wurde und der Job noch nicht fällig war.

### Cron wurde ausgelöst, aber keine Zustellung

- Zustellmodus `none` bedeutet, dass keine Fallback-Zustellung durch den Runner zu erwarten ist. Der Agent kann bei verfügbarer Chat-Route weiterhin direkt mit dem Tool `message` senden.
- Fehlendes/ungültiges Zustellziel (`channel`/`to`) bedeutet, dass ausgehende Zustellung übersprungen wurde.
- Kanal-Authentifizierungsfehler (`unauthorized`, `Forbidden`) bedeuten, dass die Zustellung durch Anmeldedaten blockiert wurde.
- Wenn die isolierte Ausführung nur das stille Token (`NO_REPLY` / `no_reply`) zurückgibt, unterdrückt OpenClaw die direkte ausgehende Zustellung und auch den Fallback-Pfad der in die Warteschlange gestellten Zusammenfassung, sodass nichts zurück in den Chat gepostet wird.
- Wenn der Agent dem Nutzer selbst eine Nachricht senden soll, prüfen Sie, dass der Job eine nutzbare Route hat (`channel: "last"` mit einem vorherigen Chat oder ein expliziter Kanal/ein explizites Ziel).

### Zeitzonen-Fallstricke

- Cron ohne `--tz` verwendet die Zeitzone des Gateway-Hosts.
- `at`-Zeitpläne ohne Zeitzone werden als UTC behandelt.
- Heartbeat-`activeHours` verwendet die konfigurierte Zeitzonenauflösung.

## Verwandt

- [Automatisierung & Aufgaben](/de/automation) — alle Automatisierungsmechanismen auf einen Blick
- [Hintergrundaufgaben](/de/automation/tasks) — Aufgabenprotokoll für Cron-Ausführungen
- [Heartbeat](/de/gateway/heartbeat) — periodische Runden der Hauptsitzung
- [Zeitzone](/de/concepts/timezone) — Zeitzonenkonfiguration
