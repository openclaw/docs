---
read_when:
    - Anpassen der Heartbeat-Kadenz oder -Nachrichten
    - Zwischen Heartbeat und Cron für geplante Aufgaben entscheiden
sidebarTitle: Heartbeat
summary: Heartbeat-Abfragenachrichten und Benachrichtigungsregeln
title: Heartbeat
x-i18n:
    generated_at: "2026-05-10T19:35:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0c4a4076ff4c7a88b47a9bb4daff56b3075173e79409a991ac564ad6ab305a9d
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat vs. Cron?** Siehe [Automatisierung & Aufgaben](/de/automation) für Hinweise dazu, wann Sie welches verwenden sollten.
</Note>

Heartbeat führt **periodische Agent-Durchläufe** in der Hauptsitzung aus, damit das Modell alles melden kann, was Aufmerksamkeit erfordert, ohne Sie mit Nachrichten zu überfluten.

Heartbeat ist ein geplanter Durchlauf in der Hauptsitzung — es erstellt **keine** [Hintergrundaufgaben](/de/automation/tasks)-Einträge. Aufgabeneinträge sind für abgekoppelte Arbeit gedacht (ACP-Läufe, Subagenten, isolierte Cron-Jobs).

Fehlerbehebung: [Geplante Aufgaben](/de/automation/cron-jobs#troubleshooting)

## Schnellstart (Anfänger)

<Steps>
  <Step title="Pick a cadence">
    Lassen Sie Heartbeats aktiviert (Standard ist `30m` oder `1h` bei Anthropic OAuth-/Token-Authentifizierung, einschließlich Claude CLI-Wiederverwendung) oder legen Sie Ihre eigene Frequenz fest.
  </Step>
  <Step title="Add HEARTBEAT.md (optional)">
    Erstellen Sie eine kurze `HEARTBEAT.md`-Checkliste oder einen `tasks:`-Block im Agent-Arbeitsbereich.
  </Step>
  <Step title="Decide where heartbeat messages should go">
    `target: "none"` ist der Standard; setzen Sie `target: "last"`, um an den letzten Kontakt weiterzuleiten.
  </Step>
  <Step title="Optional tuning">
    - Aktivieren Sie die Heartbeat-Reasoning-Zustellung für Transparenz.
    - Verwenden Sie schlanken Bootstrap-Kontext, wenn Heartbeat-Läufe nur `HEARTBEAT.md` benötigen.
    - Aktivieren Sie isolierte Sitzungen, um nicht bei jedem Heartbeat den vollständigen Gesprächsverlauf zu senden.
    - Beschränken Sie Heartbeats auf aktive Zeiten (Ortszeit).

  </Step>
</Steps>

Beispielkonfiguration:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // explicit delivery to last contact (default is "none")
        directPolicy: "allow", // default: allow direct/DM targets; set "block" to suppress
        lightContext: true, // optional: only inject HEARTBEAT.md from bootstrap files
        isolatedSession: true, // optional: fresh session each run (no conversation history)
        skipWhenBusy: true, // optional: also defer when subagent or nested lanes are busy
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // optional: send separate `Reasoning:` message too
      },
    },
  },
}
```

## Standards

- Intervall: `30m` (oder `1h`, wenn Anthropic OAuth-/Token-Authentifizierung als Authentifizierungsmodus erkannt wird, einschließlich Claude CLI-Wiederverwendung). Setzen Sie `agents.defaults.heartbeat.every` oder agentenspezifisch `agents.list[].heartbeat.every`; verwenden Sie `0m` zum Deaktivieren.
- Prompt-Text (konfigurierbar über `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Der Heartbeat-Prompt wird **wortwörtlich** als Benutzernachricht gesendet. Der System-Prompt enthält nur dann einen Abschnitt „Heartbeat“, wenn Heartbeats für den Standard-Agenten aktiviert sind, und der Lauf wird intern markiert.
- Wenn Heartbeats mit `0m` deaktiviert sind, lassen normale Läufe auch `HEARTBEAT.md` aus dem Bootstrap-Kontext weg, damit das Modell keine Heartbeat-spezifischen Anweisungen sieht.
- Aktive Zeiten (`heartbeat.activeHours`) werden in der konfigurierten Zeitzone geprüft. Außerhalb des Zeitfensters werden Heartbeats bis zum nächsten Tick innerhalb des Fensters übersprungen.
- Heartbeats werden automatisch zurückgestellt, während Cron-Arbeit aktiv ist oder in der Warteschlange steht. Setzen Sie `heartbeat.skipWhenBusy: true`, um auch bei zusätzlich ausgelasteten Lanes (Subagenten oder verschachtelte Befehlsarbeit) zurückzustellen; das ist nützlich für lokales Ollama und andere eingeschränkte Single-Runtime-Hosts.

## Wofür der Heartbeat-Prompt gedacht ist

Der Standard-Prompt ist absichtlich breit gefasst:

- **Hintergrundaufgaben**: „Ausstehende Aufgaben berücksichtigen“ regt den Agenten an, Folgepunkte zu prüfen (Posteingang, Kalender, Erinnerungen, wartende Arbeit) und alles Dringende sichtbar zu machen.
- **Check-in beim Menschen**: „Tagsüber gelegentlich bei Ihrem Menschen nachfragen“ regt gelegentlich eine kurze Nachricht wie „Brauchen Sie etwas?“ an, vermeidet aber nächtliche Nachrichtenflut durch Verwendung Ihrer konfigurierten lokalen Zeitzone (siehe [Zeitzone](/de/concepts/timezone)).

Heartbeat kann auf abgeschlossene [Hintergrundaufgaben](/de/automation/tasks) reagieren, aber ein Heartbeat-Lauf selbst erstellt keinen Aufgabeneintrag.

Wenn ein Heartbeat etwas sehr Spezifisches tun soll (z. B. „Gmail-PubSub-Statistiken prüfen“ oder „Gateway-Zustand verifizieren“), setzen Sie `agents.defaults.heartbeat.prompt` (oder `agents.list[].heartbeat.prompt`) auf einen benutzerdefinierten Text (wird wortwörtlich gesendet).

## Antwortvertrag

- Wenn nichts Aufmerksamkeit erfordert, antworten Sie mit **`HEARTBEAT_OK`**.
- Tool-fähige Heartbeat-Läufe können stattdessen `heartbeat_respond` mit `notify: false` für keine sichtbare Aktualisierung aufrufen oder `notify: true` plus `notificationText` für einen Alarm. Wenn vorhanden, hat die strukturierte Tool-Antwort Vorrang vor dem Text-Fallback.
- Während Heartbeat-Läufen behandelt OpenClaw `HEARTBEAT_OK` als Bestätigung, wenn es am **Anfang oder Ende** der Antwort erscheint. Das Token wird entfernt, und die Antwort wird verworfen, wenn der verbleibende Inhalt **≤ `ackMaxChars`** ist (Standard: 300).
- Wenn `HEARTBEAT_OK` in der **Mitte** einer Antwort erscheint, wird es nicht besonders behandelt.
- Für Alarme **nicht** `HEARTBEAT_OK` einschließen; geben Sie nur den Alarmtext zurück.

Außerhalb von Heartbeats wird ein verirrtes `HEARTBEAT_OK` am Anfang/Ende einer Nachricht entfernt und protokolliert; eine Nachricht, die nur `HEARTBEAT_OK` enthält, wird verworfen.

## Konfiguration

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // default: 30m (0m disables)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // default: false (deliver separate Reasoning: message when available)
        lightContext: false, // default: false; true keeps only HEARTBEAT.md from workspace bootstrap files
        isolatedSession: false, // default: false; true runs each heartbeat in a fresh session (no conversation history)
        skipWhenBusy: false, // default: false; true also waits for subagent/nested lanes
        target: "last", // default: none | options: last | none | <channel id> (core or plugin, e.g. "imessage")
        to: "+15551234567", // optional channel-specific override
        accountId: "ops-bot", // optional multi-account channel id
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // max chars allowed after HEARTBEAT_OK
      },
    },
  },
}
```

### Geltungsbereich und Vorrang

- `agents.defaults.heartbeat` legt das globale Heartbeat-Verhalten fest.
- `agents.list[].heartbeat` wird darübergelegt; wenn irgendein Agent einen `heartbeat`-Block hat, führen **nur diese Agenten** Heartbeats aus.
- `channels.defaults.heartbeat` legt Sichtbarkeitsstandards für alle Kanäle fest.
- `channels.<channel>.heartbeat` überschreibt Kanalstandards.
- `channels.<channel>.accounts.<id>.heartbeat` (Kanäle mit mehreren Konten) überschreibt Einstellungen pro Kanal.

### Heartbeats pro Agent

Wenn ein Eintrag in `agents.list[]` einen `heartbeat`-Block enthält, führen **nur diese Agents** Heartbeats aus. Der Block pro Agent wird über `agents.defaults.heartbeat` gelegt (Sie können also gemeinsame Defaults einmal festlegen und sie pro Agent überschreiben).

Beispiel: zwei Agents, nur der zweite Agent führt Heartbeats aus.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // explicit delivery to last contact (default is "none")
      },
    },
    list: [
      { id: "main", default: true },
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "whatsapp",
          to: "+15551234567",
          timeoutSeconds: 45,
          prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        },
      },
    ],
  },
}
```

### Beispiel für aktive Stunden

Beschränken Sie Heartbeats auf Geschäftszeiten in einer bestimmten Zeitzone:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // explicit delivery to last contact (default is "none")
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York", // optional; uses your userTimezone if set, otherwise host tz
        },
      },
    },
  },
}
```

Außerhalb dieses Zeitfensters (vor 9 Uhr oder nach 22 Uhr Eastern Time) werden Heartbeats übersprungen. Der nächste geplante Tick innerhalb des Fensters wird normal ausgeführt.

### 24/7-Einrichtung

Wenn Sie möchten, dass Heartbeats den ganzen Tag ausgeführt werden, verwenden Sie eines dieser Muster:

- Lassen Sie `activeHours` vollständig weg (keine Zeitfensterbeschränkung; dies ist das Standardverhalten).
- Legen Sie ein ganztägiges Fenster fest: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
Legen Sie nicht dieselbe Zeit für `start` und `end` fest (zum Beispiel `08:00` bis `08:00`). Das wird als Fenster mit einer Breite von null behandelt, sodass Heartbeats immer übersprungen werden.
</Warning>

### Multi-Account-Beispiel

Verwenden Sie `accountId`, um ein bestimmtes Konto in Multi-Account-Kanälen wie Telegram anzusteuern:

```json5
{
  agents: {
    list: [
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "telegram",
          to: "12345678:topic:42", // optional: route to a specific topic/thread
          accountId: "ops-bot",
        },
      },
    ],
  },
  channels: {
    telegram: {
      accounts: {
        "ops-bot": { botToken: "YOUR_TELEGRAM_BOT_TOKEN" },
      },
    },
  },
}
```

### Hinweise zu Feldern

<ParamField path="every" type="string">
  Heartbeat-Intervall (Dauerzeichenfolge; Standardeinheit = Minuten).
</ParamField>
<ParamField path="model" type="string">
  Optionale Modellüberschreibung für Heartbeat-Ausführungen (`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  Wenn aktiviert, wird auch die separate Nachricht `Reasoning:` zugestellt, sofern verfügbar (gleiche Form wie `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  Wenn true, verwenden Heartbeat-Ausführungen einen leichtgewichtigen Bootstrap-Kontext und behalten nur `HEARTBEAT.md` aus den Workspace-Bootstrap-Dateien.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  Wenn true, wird jeder Heartbeat in einer frischen Sitzung ohne vorherigen Konversationsverlauf ausgeführt. Verwendet dasselbe Isolationsmuster wie Cron `sessionTarget: "isolated"`. Reduziert die Token-Kosten pro Heartbeat drastisch. Kombinieren Sie dies mit `lightContext: true`, um maximale Einsparungen zu erzielen. Das Zustellungs-Routing verwendet weiterhin den Kontext der Hauptsitzung.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  Wenn true, werden Heartbeat-Ausführungen bei zusätzlich belegten Lanes aufgeschoben: Subagent- oder verschachtelte Befehlsarbeit. Cron-Lanes schieben Heartbeats immer auf, auch ohne dieses Flag, sodass Hosts mit lokalen Modellen Cron- und Heartbeat-Prompts nicht gleichzeitig ausführen.
</ParamField>
<ParamField path="session" type="string">
  Optionaler Sitzungsschlüssel für Heartbeat-Ausführungen.

- `main` (Standard): Hauptsitzung des Agents.
- Expliziter Sitzungsschlüssel (kopieren Sie ihn aus `openclaw sessions --json` oder der [Sitzungs-CLI](/de/cli/sessions)).
- Sitzungsschlüsselformate: siehe [Sitzungen](/de/concepts/session) und [Gruppen](/de/channels/groups).

</ParamField>
<ParamField path="target" type="string">
- `last`: an den zuletzt verwendeten externen Kanal zustellen.
- Expliziter Kanal: jeder konfigurierte Kanal oder jede konfigurierte Plugin-ID, zum Beispiel `discord`, `matrix`, `telegram` oder `whatsapp`.
- `none` (Standard): den Heartbeat ausführen, aber **nicht extern zustellen**.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  Steuert das Verhalten für Direkt-/DM-Zustellung. `allow`: Direkt-/DM-Heartbeat-Zustellung erlauben. `block`: Direkt-/DM-Zustellung unterdrücken (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  Optionale Empfängerüberschreibung (kanalspezifische ID, z. B. E.164 für WhatsApp oder eine Telegram-Chat-ID). Verwenden Sie für Telegram-Themen/-Threads `<chatId>:topic:<messageThreadId>`.

</ParamField>
<ParamField path="accountId" type="string">
  Optionale Konto-ID für Multi-Account-Kanäle. Bei `target: "last"` gilt die Konto-ID für den aufgelösten letzten Kanal, wenn er Konten unterstützt; andernfalls wird sie ignoriert. Wenn die Konto-ID keinem konfigurierten Konto für den aufgelösten Kanal entspricht, wird die Zustellung übersprungen.

</ParamField>
<ParamField path="prompt" type="string">
  Überschreibt den Standard-Prompt-Text (wird nicht zusammengeführt).

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  Maximal zulässige Zeichenanzahl nach `HEARTBEAT_OK` vor der Zustellung.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  Wenn true, werden Warn-Payloads zu Tool-Fehlern während Heartbeat-Läufen unterdrückt.

</ParamField>
<ParamField path="activeHours" type="object">
  Beschränkt Heartbeat-Läufe auf ein Zeitfenster. Objekt mit `start` (HH:MM, inklusiv; verwenden Sie `00:00` für den Tagesbeginn), `end` (HH:MM, exklusiv; `24:00` für das Tagesende zulässig) und optional `timezone`.

- Ausgelassen oder `"user"`: verwendet Ihr `agents.defaults.userTimezone`, falls gesetzt, andernfalls wird auf die Zeitzone des Hostsystems zurückgegriffen.
- `"local"`: verwendet immer die Zeitzone des Hostsystems.
- Beliebige IANA-Kennung (z. B. `America/New_York`): wird direkt verwendet; falls ungültig, wird auf das oben beschriebene `"user"`-Verhalten zurückgegriffen.
- `start` und `end` dürfen für ein aktives Zeitfenster nicht identisch sein; gleiche Werte werden als Breite null behandelt (immer außerhalb des Fensters).
- Außerhalb des aktiven Zeitfensters werden Heartbeats bis zum nächsten Tick innerhalb des Fensters übersprungen.

</ParamField>

## Zustellungsverhalten

<AccordionGroup>
  <Accordion title="Sitzungs- und Ziel-Routing">
    - Heartbeats laufen standardmäßig in der Hauptsitzung des Agenten (`agent:<id>:<mainKey>`) oder in `global`, wenn `session.scope = "global"` ist. Setzen Sie `session`, um auf eine bestimmte Kanalsitzung (Discord/WhatsApp/usw.) zu wechseln.
    - `session` betrifft nur den Laufkontext; die Zustellung wird durch `target` und `to` gesteuert.
    - Um an einen bestimmten Kanal/Empfänger zuzustellen, setzen Sie `target` + `to`. Mit `target: "last"` verwendet die Zustellung den letzten externen Kanal für diese Sitzung.
    - Heartbeat-Zustellungen erlauben standardmäßig direkte/DM-Ziele. Setzen Sie `directPolicy: "block"`, um Sendungen an direkte Ziele zu unterdrücken, während der Heartbeat-Turn weiterhin ausgeführt wird.
    - Wenn die Hauptwarteschlange, die Ziel-Sitzungs-Lane, die Cron-Lane oder ein aktiver Cron-Job ausgelastet ist, wird der Heartbeat übersprungen und später erneut versucht.
    - Wenn `skipWhenBusy: true`, verzögern auch Subagent- und verschachtelte Lanes Heartbeat-Läufe.
    - Wenn `target` kein externes Ziel auflöst, findet der Lauf trotzdem statt, aber es wird keine ausgehende Nachricht gesendet.

  </Accordion>
  <Accordion title="Sichtbarkeit und Überspringverhalten">
    - Wenn `showOk`, `showAlerts` und `useIndicator` alle deaktiviert sind, wird der Lauf vorab mit `reason=alerts-disabled` übersprungen.
    - Wenn nur die Alarmzustellung deaktiviert ist, kann OpenClaw den Heartbeat weiterhin ausführen, Fälligkeits-Zeitstempel von Tasks aktualisieren, den Leerlauf-Zeitstempel der Sitzung wiederherstellen und den nach außen gerichteten Alarm-Payload unterdrücken.
    - Wenn das aufgelöste Heartbeat-Ziel Tippen unterstützt, zeigt OpenClaw Tippen an, solange der Heartbeat-Lauf aktiv ist. Dies verwendet dasselbe Ziel, an das der Heartbeat Chat-Ausgaben senden würde, und wird durch `typingMode: "never"` deaktiviert.

  </Accordion>
  <Accordion title="Sitzungslebenszyklus und Audit">
    - Reine Heartbeat-Antworten halten die Sitzung **nicht** am Leben. Heartbeat-Metadaten können die Sitzungszeile aktualisieren, aber der Leerlaufablauf verwendet `lastInteractionAt` aus der letzten echten Benutzer-/Kanalnachricht, und der tägliche Ablauf verwendet `sessionStartedAt`.
    - Control-UI- und WebChat-Verläufe blenden Heartbeat-Prompts und reine OK-Bestätigungen aus. Das zugrunde liegende Sitzungstranskript kann diese Turns für Audit/Wiedergabe weiterhin enthalten.
    - Losgelöste [Hintergrund-Tasks](/de/automation/tasks) können ein Systemereignis einreihen und Heartbeat aufwecken, wenn die Hauptsitzung etwas schnell bemerken sollte. Dieses Aufwecken macht den Heartbeat-Lauf nicht zu einem Hintergrund-Task.

  </Accordion>
</AccordionGroup>

## Sichtbarkeitssteuerung

Standardmäßig werden `HEARTBEAT_OK`-Bestätigungen unterdrückt, während Alarminhalte zugestellt werden. Sie können dies pro Kanal oder pro Konto anpassen:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # Hide HEARTBEAT_OK (default)
      showAlerts: true # Show alert messages (default)
      useIndicator: true # Emit indicator events (default)
  telegram:
    heartbeat:
      showOk: true # Show OK acknowledgments on Telegram
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # Suppress alert delivery for this account
```

Priorität: pro Konto → pro Kanal → Kanal-Defaults → integrierte Defaults.

### Was jedes Flag bewirkt

- `showOk`: sendet eine `HEARTBEAT_OK`-Bestätigung, wenn das Modell eine reine OK-Antwort zurückgibt.
- `showAlerts`: sendet den Alarminhalt, wenn das Modell eine Nicht-OK-Antwort zurückgibt.
- `useIndicator`: gibt Indikatorereignisse für UI-Statusflächen aus.

Wenn **alle drei** false sind, überspringt OpenClaw den Heartbeat-Lauf vollständig (kein Modellaufruf).

### Beispiele pro Kanal und pro Konto

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false
      showAlerts: true
      useIndicator: true
  slack:
    heartbeat:
      showOk: true # all Slack accounts
    accounts:
      ops:
        heartbeat:
          showAlerts: false # suppress alerts for the ops account only
  telegram:
    heartbeat:
      showOk: true
```

### Häufige Muster

| Ziel                                     | Konfiguration                                                                            |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| Standardverhalten (stille OKs, Alarme an) | _(keine Konfiguration erforderlich)_                                                     |
| Vollständig still (keine Nachrichten, kein Indikator) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Nur Indikator (keine Nachrichten)        | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OKs nur in einem Kanal                   | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (optional)

Wenn im Workspace eine Datei `HEARTBEAT.md` vorhanden ist, weist der Standard-Prompt den Agenten an, sie zu lesen. Betrachten Sie sie als Ihre „Heartbeat-Checkliste“: klein, stabil und sicher genug, um sie alle 30 Minuten einzubeziehen.

Bei normalen Läufen wird `HEARTBEAT.md` nur injiziert, wenn Heartbeat-Anweisungen für den Standardagenten aktiviert sind. Wenn Sie den Heartbeat-Rhythmus mit `0m` deaktivieren oder `includeSystemPromptSection: false` setzen, wird sie aus dem normalen Bootstrap-Kontext ausgelassen.

Wenn `HEARTBEAT.md` vorhanden, aber effektiv leer ist (nur Leerzeilen und Markdown-Überschriften wie `# Heading`), überspringt OpenClaw den Heartbeat-Lauf, um API-Aufrufe zu sparen. Dieses Überspringen wird als `reason=empty-heartbeat-file` gemeldet. Wenn die Datei fehlt, läuft der Heartbeat trotzdem und das Modell entscheidet, was zu tun ist.

Halten Sie sie winzig (kurze Checkliste oder Erinnerungen), um Prompt-Aufblähung zu vermeiden.

Beispiel für `HEARTBEAT.md`:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### `tasks:`-Blöcke

`HEARTBEAT.md` unterstützt außerdem einen kleinen strukturierten `tasks:`-Block für intervallbasierte Prüfungen innerhalb von Heartbeat selbst.

Beispiel:

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "Check for urgent unread emails and flag anything time sensitive."
- name: calendar-scan
  interval: 2h
  prompt: "Check for upcoming meetings that need prep or follow-up."

# Additional instructions

- Keep alerts short.
- If nothing needs attention after all due tasks, reply HEARTBEAT_OK.
```

<AccordionGroup>
  <Accordion title="Verhalten">
    - OpenClaw parst den `tasks:`-Block und prüft jeden Task gegen sein eigenes `interval`.
    - Nur **fällige** Tasks werden für diesen Tick in den Heartbeat-Prompt aufgenommen.
    - Wenn keine Tasks fällig sind, wird der Heartbeat vollständig übersprungen (`reason=no-tasks-due`), um einen unnötigen Modellaufruf zu vermeiden.
    - Nicht-Task-Inhalte in `HEARTBEAT.md` bleiben erhalten und werden als zusätzlicher Kontext nach der Liste der fälligen Tasks angehängt.
    - Zeitstempel der letzten Task-Ausführung werden im Sitzungszustand (`heartbeatTaskState`) gespeichert, sodass Intervalle normale Neustarts überstehen.
    - Task-Zeitstempel werden erst weitergeschrieben, nachdem ein Heartbeat-Lauf seinen normalen Antwortpfad abgeschlossen hat. Übersprungene `empty-heartbeat-file`- / `no-tasks-due`-Läufe markieren Tasks nicht als abgeschlossen.

  </Accordion>
</AccordionGroup>

Der Task-Modus ist nützlich, wenn Sie eine Heartbeat-Datei verwenden möchten, die mehrere periodische Prüfungen enthält, ohne bei jedem Tick für alle zu bezahlen.

### Kann der Agent HEARTBEAT.md aktualisieren?

Ja — wenn Sie ihn darum bitten.

`HEARTBEAT.md` ist nur eine normale Datei im Agenten-Workspace, sodass Sie dem Agenten (in einem normalen Chat) zum Beispiel Folgendes sagen können:

- „Aktualisiere `HEARTBEAT.md`, um eine tägliche Kalenderprüfung hinzuzufügen.“
- „Schreibe `HEARTBEAT.md` neu, damit sie kürzer ist und sich auf Inbox-Follow-ups konzentriert.“

Wenn dies proaktiv geschehen soll, können Sie auch eine explizite Zeile in Ihren Heartbeat-Prompt aufnehmen, etwa: „Wenn die Checkliste veraltet ist, aktualisiere HEARTBEAT.md mit einer besseren.“

<Warning>
Legen Sie keine Secrets (API-Schlüssel, Telefonnummern, private Tokens) in `HEARTBEAT.md` ab — sie wird Teil des Prompt-Kontexts.
</Warning>

## Manuelles Aufwecken (bei Bedarf)

Sie können ein Systemereignis einreihen und einen sofortigen Heartbeat auslösen mit:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Wenn für mehrere Agenten `heartbeat` konfiguriert ist, führt ein manuelles Aufwecken jeden dieser Agenten-Heartbeats sofort aus.

Verwenden Sie `--mode next-heartbeat`, um auf den nächsten geplanten Tick zu warten.

## Reasoning-Zustellung (optional)

Standardmäßig stellen Heartbeats nur den finalen „Antwort“-Payload zu.

Wenn Sie Transparenz wünschen, aktivieren Sie:

- `agents.defaults.heartbeat.includeReasoning: true`

Wenn aktiviert, stellen Heartbeats zusätzlich eine separate Nachricht mit dem Präfix `Reasoning:` zu (gleiche Form wie `/reasoning on`). Das kann nützlich sein, wenn der Agent mehrere Sitzungen/Codexes verwaltet und Sie sehen möchten, warum er entschieden hat, Sie anzupingen — es kann aber auch mehr interne Details offenlegen, als Sie möchten. Lassen Sie es in Gruppenchats vorzugsweise deaktiviert.

## Kostenbewusstsein

Heartbeats führen vollständige Agenten-Turns aus. Kürzere Intervalle verbrauchen mehr Tokens. So reduzieren Sie Kosten:

- Verwenden Sie `isolatedSession: true`, um zu vermeiden, dass der vollständige Gesprächsverlauf gesendet wird (ca. 100K Tokens herunter auf ca. 2-5K pro Lauf).
- Verwenden Sie `lightContext: true`, um Bootstrap-Dateien auf nur `HEARTBEAT.md` zu beschränken.
- Setzen Sie ein günstigeres `model` (z. B. `ollama/llama3.2:1b`).
- Halten Sie `HEARTBEAT.md` klein.
- Verwenden Sie `target: "none"`, wenn Sie nur interne Zustandsaktualisierungen möchten.

## Kontextüberlauf nach Heartbeat

Wenn ein Heartbeat zuvor eine bestehende Sitzung auf einem kleineren lokalen Modell zurückgelassen hat, zum Beispiel einem Ollama-Modell mit einem 32k-Fenster, und der nächste Hauptsitzungs-Turn einen Kontextüberlauf meldet, setzen Sie das Laufzeitmodell der Sitzung wieder auf das konfigurierte Primärmodell zurück. Die Reset-Nachricht von OpenClaw weist darauf hin, wenn das letzte Laufzeitmodell mit dem konfigurierten `heartbeat.model` übereinstimmt.

Aktuelle Heartbeats behalten das bestehende Laufzeitmodell der gemeinsamen Sitzung nach Abschluss des Laufs bei. Sie können weiterhin `isolatedSession: true` verwenden, um Heartbeats in einer frischen Sitzung auszuführen, dies mit `lightContext: true` für den kleinsten Prompt kombinieren oder ein Heartbeat-Modell mit einem Kontextfenster wählen, das groß genug für die gemeinsame Sitzung ist.

## Verwandt

- [Automation & Tasks](/de/automation) — alle Automatisierungsmechanismen auf einen Blick
- [Hintergrund-Tasks](/de/automation/tasks) — wie losgelöste Arbeit nachverfolgt wird
- [Zeitzone](/de/concepts/timezone) — wie die Zeitzone die Heartbeat-Planung beeinflusst
- [Fehlerbehebung](/de/automation/cron-jobs#troubleshooting) — Automatisierungsprobleme debuggen
