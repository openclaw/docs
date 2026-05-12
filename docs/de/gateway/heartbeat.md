---
read_when:
    - Heartbeat-Taktung oder Nachrichten anpassen
    - Zwischen Heartbeat und Cron für geplante Aufgaben entscheiden
sidebarTitle: Heartbeat
summary: Heartbeat-Abrufnachrichten und Benachrichtigungsregeln
title: Heartbeat
x-i18n:
    generated_at: "2026-05-12T23:30:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 247a0fe25ef6e47ec447e6c911ac66af4ab669e15dba886c967250b56e9f1a9c
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat vs. Cron?** Siehe [Automatisierung](/de/automation) für Hinweise dazu, wann Sie welches verwenden sollten.
</Note>

Heartbeat führt **periodische Agent-Durchläufe** in der Hauptsitzung aus, damit das Modell alles melden kann, was Aufmerksamkeit benötigt, ohne Sie mit Nachrichten zu überfluten.

Heartbeat ist ein geplanter Durchlauf in der Hauptsitzung — er erstellt **keine** [Hintergrundaufgaben](/de/automation/tasks)-Einträge. Aufgabeneinträge sind für losgelöste Arbeit vorgesehen (ACP-Durchläufe, Subagents, isolierte Cron-Jobs).

Fehlerbehebung: [Geplante Aufgaben](/de/automation/cron-jobs#troubleshooting)

## Schnellstart (Einsteiger)

<Steps>
  <Step title="Takt auswählen">
    Lassen Sie Heartbeats aktiviert (Standard ist `30m` oder `1h` für Anthropic-OAuth-/Token-Authentifizierung, einschließlich Wiederverwendung der Claude CLI) oder legen Sie Ihren eigenen Takt fest.
  </Step>
  <Step title="HEARTBEAT.md hinzufügen (optional)">
    Erstellen Sie eine kleine `HEARTBEAT.md`-Checkliste oder einen `tasks:`-Block im Agent-Arbeitsbereich.
  </Step>
  <Step title="Festlegen, wohin Heartbeat-Nachrichten gesendet werden sollen">
    `target: "none"` ist der Standard; setzen Sie `target: "last"`, um an den letzten Kontakt zu routen.
  </Step>
  <Step title="Optionale Feinabstimmung">
    - Aktivieren Sie die Zustellung von Heartbeat-Reasoning für mehr Transparenz.
    - Verwenden Sie leichtgewichtigen Bootstrap-Kontext, wenn Heartbeat-Durchläufe nur `HEARTBEAT.md` benötigen.
    - Aktivieren Sie isolierte Sitzungen, um zu vermeiden, dass bei jedem Heartbeat der vollständige Gesprächsverlauf gesendet wird.
    - Beschränken Sie Heartbeats auf aktive Stunden (Ortszeit).

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
        skipWhenBusy: true, // optional: also defer when this agent's subagent or nested lanes are busy
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // optional: send separate `Reasoning:` message too
      },
    },
  },
}
```

## Standardwerte

- Intervall: `30m` (oder `1h`, wenn Anthropic-OAuth-/Token-Authentifizierung als Authentifizierungsmodus erkannt wird, einschließlich Wiederverwendung der Claude CLI). Setzen Sie `agents.defaults.heartbeat.every` oder pro Agent `agents.list[].heartbeat.every`; verwenden Sie `0m`, um zu deaktivieren.
- Prompt-Text (konfigurierbar über `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Der Heartbeat-Prompt wird **wörtlich** als Benutzernachricht gesendet. Der System-Prompt enthält nur dann einen Abschnitt "Heartbeat", wenn Heartbeats für den Standard-Agent aktiviert sind, und der Durchlauf wird intern markiert.
- Wenn Heartbeats mit `0m` deaktiviert sind, lassen normale Durchläufe `HEARTBEAT.md` ebenfalls aus dem Bootstrap-Kontext weg, damit das Modell keine reinen Heartbeat-Anweisungen sieht.
- Aktive Stunden (`heartbeat.activeHours`) werden in der konfigurierten Zeitzone geprüft. Außerhalb des Fensters werden Heartbeats bis zum nächsten Tick innerhalb des Fensters übersprungen.
- Heartbeats werden automatisch zurückgestellt, während Cron-Arbeit aktiv ist oder in der Warteschlange steht. Setzen Sie `heartbeat.skipWhenBusy: true`, um einen Agent auch bei seinen eigenen sitzungsschlüsselbasierten Subagent- oder verschachtelten Befehls-Lanes zurückzustellen; Geschwister-Agents pausieren nicht mehr nur deshalb, weil ein anderer Agent Subagent-Arbeit ausführt.

## Wofür der Heartbeat-Prompt gedacht ist

Der Standard-Prompt ist absichtlich breit gefasst:

- **Hintergrundaufgaben**: "Consider outstanding tasks" regt den Agent dazu an, Folgemaßnahmen zu prüfen (Posteingang, Kalender, Erinnerungen, Arbeit in der Warteschlange) und alles Dringende zu melden.
- **Menschlicher Check-in**: "Checkup sometimes on your human during day time" regt eine gelegentliche, leichtgewichtige Nachricht wie "Benötigen Sie etwas?" an, vermeidet aber nächtliche Nachrichten durch Verwendung Ihrer konfigurierten lokalen Zeitzone (siehe [Zeitzone](/de/concepts/timezone)).

Heartbeat kann auf abgeschlossene [Hintergrundaufgaben](/de/automation/tasks) reagieren, aber ein Heartbeat-Durchlauf selbst erstellt keinen Aufgabeneintrag.

Wenn ein Heartbeat etwas sehr Spezifisches tun soll (z. B. "Gmail-PubSub-Statistiken prüfen" oder "Gateway-Integrität verifizieren"), setzen Sie `agents.defaults.heartbeat.prompt` (oder `agents.list[].heartbeat.prompt`) auf einen benutzerdefinierten Text (wird wörtlich gesendet).

## Antwortvertrag

- Wenn nichts Aufmerksamkeit benötigt, antworten Sie mit **`HEARTBEAT_OK`**.
- Tool-fähige Heartbeat-Durchläufe können stattdessen `heartbeat_respond` mit `notify: false` für kein sichtbares Update oder `notify: true` plus `notificationText` für eine Warnung aufrufen. Wenn vorhanden, hat die strukturierte Tool-Antwort Vorrang vor dem Text-Fallback.
- Während Heartbeat-Durchläufen behandelt OpenClaw `HEARTBEAT_OK` als Bestätigung, wenn es am **Anfang oder Ende** der Antwort erscheint. Das Token wird entfernt und die Antwort verworfen, wenn der verbleibende Inhalt **≤ `ackMaxChars`** ist (Standard: 300).
- Wenn `HEARTBEAT_OK` in der **Mitte** einer Antwort erscheint, wird es nicht besonders behandelt.
- Für Warnungen **nicht** `HEARTBEAT_OK` einschließen; geben Sie nur den Warntext zurück.

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
        skipWhenBusy: false, // default: false; true also waits for this agent's subagent/nested lanes
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

### Umfang und Vorrang

- `agents.defaults.heartbeat` legt das globale Heartbeat-Verhalten fest.
- `agents.list[].heartbeat` wird darüber zusammengeführt; wenn irgendein Agent einen `heartbeat`-Block hat, führen **nur diese Agents** Heartbeats aus.
- `channels.defaults.heartbeat` legt Sichtbarkeitsstandardwerte für alle Kanäle fest.
- `channels.<channel>.heartbeat` überschreibt Kanalstandardwerte.
- `channels.<channel>.accounts.<id>.heartbeat` (Multi-Account-Kanäle) überschreibt kanalbezogene Einstellungen.

### Heartbeats pro Agent

Wenn ein Eintrag in `agents.list[]` einen `heartbeat`-Block enthält, führen **nur diese Agents** Heartbeats aus. Der agentbezogene Block wird über `agents.defaults.heartbeat` zusammengeführt (Sie können also gemeinsame Standardwerte einmal setzen und pro Agent überschreiben).

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

Außerhalb dieses Fensters (vor 9 Uhr oder nach 22 Uhr Eastern) werden Heartbeats übersprungen. Der nächste geplante Tick innerhalb des Fensters wird normal ausgeführt.

### 24/7-Einrichtung

Wenn Heartbeats den ganzen Tag laufen sollen, verwenden Sie eines dieser Muster:

- Lassen Sie `activeHours` vollständig weg (keine Zeitfensterbeschränkung; dies ist das Standardverhalten).
- Setzen Sie ein Ganztagsfenster: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
Setzen Sie nicht dieselbe `start`- und `end`-Zeit (zum Beispiel `08:00` bis `08:00`). Das wird als Fenster mit Breite null behandelt, sodass Heartbeats immer übersprungen werden.
</Warning>

### Multi-Account-Beispiel

Verwenden Sie `accountId`, um ein bestimmtes Konto auf Multi-Account-Kanälen wie Telegram anzusteuern:

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

### Feldhinweise

<ParamField path="every" type="string">
  Heartbeat-Intervall (Dauer-String; Standardeinheit = Minuten).
</ParamField>
<ParamField path="model" type="string">
  Optionale Modellüberschreibung für Heartbeat-Durchläufe (`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  Wenn aktiviert, wird zusätzlich die separate `Reasoning:`-Nachricht zugestellt, sofern verfügbar (gleiche Form wie `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  Wenn true, verwenden Heartbeat-Durchläufe leichtgewichtigen Bootstrap-Kontext und behalten nur `HEARTBEAT.md` aus den Arbeitsbereich-Bootstrap-Dateien bei.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  Wenn true, läuft jeder Heartbeat in einer frischen Sitzung ohne vorherigen Gesprächsverlauf. Verwendet dasselbe Isolationsmuster wie Cron `sessionTarget: "isolated"`. Reduziert die Token-Kosten pro Heartbeat drastisch. Kombinieren Sie dies mit `lightContext: true` für maximale Einsparungen. Das Zustellungsrouting verwendet weiterhin den Kontext der Hauptsitzung.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  Wenn true, werden Heartbeat-Durchläufe bei zusätzlichen ausgelasteten Lanes dieses Agent zurückgestellt: seinem eigenen sitzungsschlüsselbasierten Subagent oder verschachtelter Befehlsarbeit. Cron-Lanes stellen Heartbeats immer zurück, auch ohne dieses Flag, sodass Hosts mit lokalen Modellen Cron- und Heartbeat-Prompts nicht gleichzeitig ausführen.
</ParamField>
<ParamField path="session" type="string">
  Optionaler Sitzungsschlüssel für Heartbeat-Durchläufe.

- `main` (Standard): Hauptsitzung des Agent.
- Expliziter Sitzungsschlüssel (aus `openclaw sessions --json` oder der [Sessions-CLI](/de/cli/sessions) kopieren).
- Sitzungsschlüsselformate: siehe [Sitzungen](/de/concepts/session) und [Gruppen](/de/channels/groups).

</ParamField>
<ParamField path="target" type="string">
- `last`: an den zuletzt verwendeten externen Kanal zustellen.
- expliziter Kanal: jede konfigurierte Kanal- oder Plugin-ID, zum Beispiel `discord`, `matrix`, `telegram` oder `whatsapp`.
- `none` (Standard): Heartbeat ausführen, aber extern **nicht zustellen**.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  Steuert das Verhalten für direkte/DM-Zustellung. `allow`: direkte/DM-Heartbeat-Zustellung zulassen. `block`: direkte/DM-Zustellung unterdrücken (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  Optionale Empfängerüberschreibung (kanalspezifische ID, z. B. E.164 für WhatsApp oder eine Telegram-Chat-ID). Verwenden Sie für Telegram-Themen/Threads `<chatId>:topic:<messageThreadId>`.

</ParamField>
<ParamField path="accountId" type="string">
  Optionale Konto-ID für Multi-Account-Kanäle. Bei `target: "last"` gilt die Konto-ID für den aufgelösten letzten Kanal, wenn dieser Konten unterstützt; andernfalls wird sie ignoriert. Wenn die Konto-ID keinem konfigurierten Konto für den aufgelösten Kanal entspricht, wird die Zustellung übersprungen.

</ParamField>
<ParamField path="prompt" type="string">
  Überschreibt den standardmäßigen Prompt-Textkörper (nicht zusammengeführt).

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  Maximal zulässige Zeichen nach `HEARTBEAT_OK` vor der Zustellung.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  Wenn wahr, werden Tool-Fehlerwarnungs-Payloads während Heartbeat-Läufen unterdrückt.

</ParamField>
<ParamField path="activeHours" type="object">
  Beschränkt Heartbeat-Läufe auf ein Zeitfenster. Objekt mit `start` (HH:MM, einschließlich; verwenden Sie `00:00` für Tagesbeginn), `end` (HH:MM ausschließlich; `24:00` für Tagesende zulässig) und optional `timezone`.

- Ausgelassen oder `"user"`: verwendet Ihr `agents.defaults.userTimezone`, falls gesetzt, andernfalls wird auf die Zeitzone des Hostsystems zurückgegriffen.
- `"local"`: verwendet immer die Zeitzone des Hostsystems.
- Beliebiger IANA-Bezeichner (z. B. `America/New_York`): wird direkt verwendet; falls ungültig, wird auf das oben beschriebene Verhalten von `"user"` zurückgegriffen.
- `start` und `end` dürfen für ein aktives Zeitfenster nicht gleich sein; gleiche Werte werden als Fenster mit Breite null behandelt (immer außerhalb des Fensters).
- Außerhalb des aktiven Zeitfensters werden Heartbeats bis zum nächsten Tick innerhalb des Fensters übersprungen.

</ParamField>

## Zustellverhalten

<AccordionGroup>
  <Accordion title="Sitzungs- und Ziel-Routing">
    - Heartbeats laufen standardmäßig in der Hauptsitzung des Agenten (`agent:<id>:<mainKey>`) oder in `global`, wenn `session.scope = "global"` ist. Setzen Sie `session`, um eine bestimmte Kanal-Sitzung (Discord/WhatsApp/usw.) zu verwenden.
    - `session` wirkt sich nur auf den Laufkontext aus; die Zustellung wird durch `target` und `to` gesteuert.
    - Um an einen bestimmten Kanal/Empfänger zuzustellen, setzen Sie `target` + `to`. Mit `target: "last"` verwendet die Zustellung den letzten externen Kanal für diese Sitzung.
    - Heartbeat-Zustellungen erlauben direkte/DM-Ziele standardmäßig. Setzen Sie `directPolicy: "block"`, um Sendungen an direkte Ziele zu unterdrücken, während der Heartbeat-Turn weiterhin ausgeführt wird.
    - Wenn die Hauptwarteschlange, die Ziel-Sitzungs-Lane, die Cron-Lane oder ein aktiver Cron-Job belegt ist, wird der Heartbeat übersprungen und später erneut versucht.
    - Wenn `skipWhenBusy: true` gilt, verschieben auch der sitzungsschlüsselgebundene Subagent dieses Agenten und verschachtelte Lanes Heartbeat-Läufe. Belegte Lanes anderer Agenten verschieben diesen Agenten nicht.
    - Wenn `target` kein externes Ziel auflöst, findet der Lauf trotzdem statt, es wird aber keine ausgehende Nachricht gesendet.

  </Accordion>
  <Accordion title="Sichtbarkeit und Überspringverhalten">
    - Wenn `showOk`, `showAlerts` und `useIndicator` alle deaktiviert sind, wird der Lauf vorab mit `reason=alerts-disabled` übersprungen.
    - Wenn nur die Alarmzustellung deaktiviert ist, kann OpenClaw den Heartbeat trotzdem ausführen, Fälligkeitszeitstempel von Aufgaben aktualisieren, den Leerlaufzeitstempel der Sitzung wiederherstellen und den nach außen gerichteten Alarm-Payload unterdrücken.
    - Wenn das aufgelöste Heartbeat-Ziel Tippen unterstützt, zeigt OpenClaw Tippen an, während der Heartbeat-Lauf aktiv ist. Dies verwendet dasselbe Ziel, an das der Heartbeat Chat-Ausgabe senden würde, und wird durch `typingMode: "never"` deaktiviert.

  </Accordion>
  <Accordion title="Sitzungslebenszyklus und Audit">
    - Reine Heartbeat-Antworten halten die Sitzung **nicht** aktiv. Heartbeat-Metadaten können die Sitzungszeile aktualisieren, aber der Leerlaufablauf verwendet `lastInteractionAt` aus der letzten echten Benutzer-/Kanalnachricht, und der tägliche Ablauf verwendet `sessionStartedAt`.
    - Control UI und WebChat-Verlauf blenden Heartbeat-Prompts und reine OK-Bestätigungen aus. Das zugrunde liegende Sitzungstranskript kann diese Turns für Audit/Wiedergabe weiterhin enthalten.
    - Entkoppelte [Hintergrundaufgaben](/de/automation/tasks) können ein Systemereignis einreihen und den Heartbeat wecken, wenn die Hauptsitzung schnell etwas bemerken soll. Dieses Wecken macht den Heartbeat-Lauf nicht zu einer Hintergrundaufgabe.

  </Accordion>
</AccordionGroup>

## Sichtbarkeitssteuerung

Standardmäßig werden `HEARTBEAT_OK`-Bestätigungen unterdrückt, während Alarminhalt zugestellt wird. Sie können dies pro Kanal oder pro Konto anpassen:

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

Priorität: pro Konto → pro Kanal → Kanal-Standards → eingebaute Standards.

### Was jedes Flag bewirkt

- `showOk`: sendet eine `HEARTBEAT_OK`-Bestätigung, wenn das Modell eine reine OK-Antwort zurückgibt.
- `showAlerts`: sendet den Alarminhalt, wenn das Modell eine Nicht-OK-Antwort zurückgibt.
- `useIndicator`: gibt Indikatorereignisse für UI-Statusflächen aus.

Wenn **alle drei** falsch sind, überspringt OpenClaw den Heartbeat-Lauf vollständig (kein Modellaufruf).

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

### Gängige Muster

| Ziel                                       | Konfiguration                                                                            |
| ------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Standardverhalten (stille OKs, Alarme an)  | _(keine Konfiguration erforderlich)_                                                     |
| Vollständig still (keine Nachrichten, kein Indikator) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Nur Indikator (keine Nachrichten)          | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OKs nur in einem Kanal                     | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (optional)

Wenn eine Datei `HEARTBEAT.md` im Arbeitsbereich vorhanden ist, weist der standardmäßige Prompt den Agenten an, sie zu lesen. Stellen Sie sie sich als Ihre „Heartbeat-Checkliste“ vor: klein, stabil und sicher genug, um sie alle 30 Minuten einzubeziehen.

Bei normalen Läufen wird `HEARTBEAT.md` nur injiziert, wenn Heartbeat-Anleitung für den Standardagenten aktiviert ist. Das Deaktivieren der Heartbeat-Kadenz mit `0m` oder das Setzen von `includeSystemPromptSection: false` lässt sie aus dem normalen Bootstrap-Kontext weg.

Wenn `HEARTBEAT.md` vorhanden, aber effektiv leer ist (nur Leerzeilen und Markdown-Überschriften wie `# Heading`), überspringt OpenClaw den Heartbeat-Lauf, um API-Aufrufe zu sparen. Dieses Überspringen wird als `reason=empty-heartbeat-file` gemeldet. Wenn die Datei fehlt, läuft der Heartbeat trotzdem, und das Modell entscheidet, was zu tun ist.

Halten Sie sie sehr klein (kurze Checkliste oder Erinnerungen), um Prompt-Aufblähung zu vermeiden.

Beispiel für `HEARTBEAT.md`:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### `tasks:`-Blöcke

`HEARTBEAT.md` unterstützt außerdem einen kleinen strukturierten `tasks:`-Block für intervallbasierte Prüfungen innerhalb des Heartbeat selbst.

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
    - OpenClaw parst den `tasks:`-Block und prüft jede Aufgabe gegen ihr eigenes `interval`.
    - Nur **fällige** Aufgaben werden für diesen Tick in den Heartbeat-Prompt aufgenommen.
    - Wenn keine Aufgaben fällig sind, wird der Heartbeat vollständig übersprungen (`reason=no-tasks-due`), um einen unnötigen Modellaufruf zu vermeiden.
    - Nicht-Aufgaben-Inhalt in `HEARTBEAT.md` bleibt erhalten und wird nach der Liste fälliger Aufgaben als zusätzlicher Kontext angehängt.
    - Zeitstempel der letzten Ausführung von Aufgaben werden im Sitzungszustand (`heartbeatTaskState`) gespeichert, sodass Intervalle normale Neustarts überstehen.
    - Aufgabenzeitstempel werden erst fortgeschrieben, nachdem ein Heartbeat-Lauf seinen normalen Antwortpfad abgeschlossen hat. Übersprungene `empty-heartbeat-file`- / `no-tasks-due`-Läufe markieren Aufgaben nicht als abgeschlossen.

  </Accordion>
</AccordionGroup>

Der Aufgabenmodus ist nützlich, wenn Sie eine Heartbeat-Datei verwenden möchten, die mehrere periodische Prüfungen enthält, ohne bei jedem Tick für alle zu bezahlen.

### Kann der Agent HEARTBEAT.md aktualisieren?

Ja — wenn Sie ihn darum bitten.

`HEARTBEAT.md` ist nur eine normale Datei im Arbeitsbereich des Agenten, daher können Sie dem Agenten (in einem normalen Chat) zum Beispiel sagen:

- „Aktualisieren Sie `HEARTBEAT.md`, um eine tägliche Kalenderprüfung hinzuzufügen.“
- „Schreiben Sie `HEARTBEAT.md` kürzer um und konzentrieren Sie sie auf Inbox-Follow-ups.“

Wenn dies proaktiv geschehen soll, können Sie auch eine explizite Zeile in Ihren Heartbeat-Prompt aufnehmen, etwa: „Wenn die Checkliste veraltet ist, aktualisieren Sie HEARTBEAT.md mit einer besseren.“

<Warning>
Legen Sie keine Geheimnisse (API-Schlüssel, Telefonnummern, private Tokens) in `HEARTBEAT.md` ab — sie wird Teil des Prompt-Kontexts.
</Warning>

## Manuelles Wecken (bei Bedarf)

Sie können ein Systemereignis einreihen und mit Folgendem einen sofortigen Heartbeat auslösen:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Wenn mehrere Agenten `heartbeat` konfiguriert haben, führt ein manuelles Wecken jeden dieser Agenten-Heartbeats sofort aus.

Verwenden Sie `--mode next-heartbeat`, um auf den nächsten geplanten Tick zu warten.

## Reasoning-Zustellung (optional)

Standardmäßig stellen Heartbeats nur den finalen „Antwort“-Payload zu.

Wenn Sie Transparenz möchten, aktivieren Sie:

- `agents.defaults.heartbeat.includeReasoning: true`

Wenn aktiviert, stellen Heartbeats außerdem eine separate Nachricht mit dem Präfix `Reasoning:` zu (dieselbe Form wie `/reasoning on`). Das kann nützlich sein, wenn der Agent mehrere Sitzungen/Codexes verwaltet und Sie sehen möchten, warum er entschieden hat, Sie anzupingen — es kann aber auch mehr interne Details preisgeben, als Sie möchten. In Gruppenchats sollte es vorzugsweise deaktiviert bleiben.

## Kostenbewusstsein

Heartbeats führen vollständige Agenten-Turns aus. Kürzere Intervalle verbrauchen mehr Tokens. So reduzieren Sie Kosten:

- Verwenden Sie `isolatedSession: true`, um das Senden des vollständigen Gesprächsverlaufs zu vermeiden (~100K Tokens auf ~2–5K pro Lauf).
- Verwenden Sie `lightContext: true`, um Bootstrap-Dateien auf nur `HEARTBEAT.md` zu begrenzen.
- Setzen Sie ein günstigeres `model` (z. B. `ollama/llama3.2:1b`).
- Halten Sie `HEARTBEAT.md` klein.
- Verwenden Sie `target: "none"`, wenn Sie nur interne Zustandsaktualisierungen möchten.

## Kontextüberlauf nach Heartbeat

Wenn ein Heartbeat zuvor eine bestehende Sitzung auf einem kleineren lokalen Modell zurückgelassen hat, zum Beispiel einem Ollama-Modell mit einem 32k-Fenster, und der nächste Turn der Hauptsitzung einen Kontextüberlauf meldet, setzen Sie das Laufzeitmodell der Sitzung auf das konfigurierte primäre Modell zurück. Die Reset-Nachricht von OpenClaw weist darauf hin, wenn das letzte Laufzeitmodell mit dem konfigurierten `heartbeat.model` übereinstimmt.

Aktuelle Heartbeats bewahren das bestehende Laufzeitmodell der gemeinsamen Sitzung nach Abschluss des Laufs. Sie können weiterhin `isolatedSession: true` verwenden, um Heartbeats in einer frischen Sitzung auszuführen, dies mit `lightContext: true` für den kleinsten Prompt kombinieren oder ein Heartbeat-Modell mit einem Kontextfenster wählen, das groß genug für die gemeinsame Sitzung ist.

## Verwandte Themen

- [Automatisierung](/de/automation) — alle Automatisierungsmechanismen auf einen Blick
- [Hintergrundaufgaben](/de/automation/tasks) — wie entkoppelte Arbeit nachverfolgt wird
- [Zeitzone](/de/concepts/timezone) — wie sich die Zeitzone auf die Heartbeat-Planung auswirkt
- [Fehlerbehebung](/de/automation/cron-jobs#troubleshooting) — Automatisierungsprobleme debuggen
