---
read_when:
    - Heartbeat-Takt oder Nachrichten anpassen
    - Entscheidung zwischen Heartbeat und Cron für geplante Aufgaben
sidebarTitle: Heartbeat
summary: Heartbeat-Abrufmeldungen und Benachrichtigungsregeln
title: Heartbeat
x-i18n:
    generated_at: "2026-04-30T06:54:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2bafae7cafb9163015a112c074d36ab070c71d1d7ba1c7c0834e6720521f4275
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat oder Cron?** Siehe [Automatisierung & Aufgaben](/de/automation) für Hinweise dazu, wann Sie was verwenden sollten.
</Note>

Heartbeat führt **periodische Agent-Turns** in der Hauptsitzung aus, damit das Modell alles melden kann, was Aufmerksamkeit erfordert, ohne Sie mit Nachrichten zu überfluten.

Heartbeat ist ein geplanter Turn in der Hauptsitzung — er erstellt **keine** [Hintergrundaufgaben](/de/automation/tasks)-Einträge. Aufgabeneinträge sind für losgelöste Arbeit gedacht (ACP-Läufe, Subagents, isolierte Cron-Jobs).

Fehlerbehebung: [Geplante Aufgaben](/de/automation/cron-jobs#troubleshooting)

## Schnellstart (Einsteiger)

<Steps>
  <Step title="Takt auswählen">
    Lassen Sie Heartbeats aktiviert (Standard ist `30m` oder `1h` für Anthropic OAuth-/Token-Authentifizierung, einschließlich Claude CLI-Wiederverwendung), oder legen Sie Ihren eigenen Takt fest.
  </Step>
  <Step title="HEARTBEAT.md hinzufügen (optional)">
    Erstellen Sie eine kleine `HEARTBEAT.md`-Checkliste oder einen `tasks:`-Block im Agent-Arbeitsbereich.
  </Step>
  <Step title="Festlegen, wohin Heartbeat-Nachrichten gesendet werden sollen">
    `target: "none"` ist die Standardeinstellung; setzen Sie `target: "last"`, um an den letzten Kontakt weiterzuleiten.
  </Step>
  <Step title="Optionale Feinabstimmung">
    - Aktivieren Sie die Zustellung von Heartbeat-Reasoning für mehr Transparenz.
    - Verwenden Sie schlanken Bootstrap-Kontext, wenn Heartbeat-Läufe nur `HEARTBEAT.md` benötigen.
    - Aktivieren Sie isolierte Sitzungen, um zu vermeiden, dass bei jedem Heartbeat der vollständige Konversationsverlauf gesendet wird.
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

## Standardeinstellungen

- Intervall: `30m` (oder `1h`, wenn Anthropic OAuth-/Token-Authentifizierung als Authentifizierungsmodus erkannt wird, einschließlich Claude CLI-Wiederverwendung). Setzen Sie `agents.defaults.heartbeat.every` oder pro Agent `agents.list[].heartbeat.every`; verwenden Sie `0m`, um es zu deaktivieren.
- Prompt-Text (konfigurierbar über `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Der Heartbeat-Prompt wird **wortgetreu** als Benutzernachricht gesendet. Der System-Prompt enthält nur dann einen Abschnitt „Heartbeat“, wenn Heartbeats für den Standard-Agent aktiviert sind, und der Lauf wird intern entsprechend markiert.
- Wenn Heartbeats mit `0m` deaktiviert sind, lassen normale Läufe außerdem `HEARTBEAT.md` aus dem Bootstrap-Kontext aus, sodass das Modell keine reinen Heartbeat-Anweisungen sieht.
- Aktive Zeiten (`heartbeat.activeHours`) werden in der konfigurierten Zeitzone geprüft. Außerhalb des Zeitfensters werden Heartbeats bis zum nächsten Tick innerhalb des Fensters übersprungen.
- Heartbeats werden automatisch zurückgestellt, während Cron-Arbeit aktiv ist oder in der Warteschlange steht. Setzen Sie `heartbeat.skipWhenBusy: true`, um auch bei zusätzlichen ausgelasteten Lanes (Subagent- oder verschachtelte Befehlsarbeit) zurückzustellen; das ist nützlich für lokales Ollama und andere eingeschränkte Single-Runtime-Hosts.

## Wofür der Heartbeat-Prompt gedacht ist

Der Standard-Prompt ist bewusst breit gefasst:

- **Hintergrundaufgaben**: „Ausstehende Aufgaben berücksichtigen“ weist den Agent an, Nachfassaktionen zu prüfen (Posteingang, Kalender, Erinnerungen, Arbeit in der Warteschlange) und alles Dringende zu melden.
- **Check-in beim Menschen**: „Tagsüber gelegentlich bei Ihrem Menschen nachfragen“ regt eine gelegentliche kurze „Benötigen Sie etwas?“-Nachricht an, vermeidet aber nächtliche Nachrichtenflut durch Verwendung Ihrer konfigurierten lokalen Zeitzone (siehe [Zeitzone](/de/concepts/timezone)).

Heartbeat kann auf abgeschlossene [Hintergrundaufgaben](/de/automation/tasks) reagieren, aber ein Heartbeat-Lauf selbst erstellt keinen Aufgabeneintrag.

Wenn ein Heartbeat etwas sehr Spezifisches tun soll (z. B. „Gmail-PubSub-Statistiken prüfen“ oder „Gateway-Zustand verifizieren“), setzen Sie `agents.defaults.heartbeat.prompt` (oder `agents.list[].heartbeat.prompt`) auf einen benutzerdefinierten Text (wortgetreu gesendet).

## Antwortvertrag

- Wenn nichts Aufmerksamkeit benötigt, antworten Sie mit **`HEARTBEAT_OK`**.
- Während Heartbeat-Läufen behandelt OpenClaw `HEARTBEAT_OK` als Bestätigung, wenn es am **Anfang oder Ende** der Antwort erscheint. Das Token wird entfernt, und die Antwort wird verworfen, wenn der verbleibende Inhalt **≤ `ackMaxChars`** ist (Standard: 300).
- Wenn `HEARTBEAT_OK` in der **Mitte** einer Antwort erscheint, wird es nicht besonders behandelt.
- Für Warnmeldungen **fügen Sie `HEARTBEAT_OK` nicht ein**; geben Sie nur den Warntext zurück.

Außerhalb von Heartbeats wird ein versehentliches `HEARTBEAT_OK` am Anfang/Ende einer Nachricht entfernt und protokolliert; eine Nachricht, die nur `HEARTBEAT_OK` enthält, wird verworfen.

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
        target: "last", // default: none | options: last | none | <channel id> (core or plugin, e.g. "bluebubbles")
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
- `agents.list[].heartbeat` wird darüber zusammengeführt; wenn ein Agent einen `heartbeat`-Block hat, führen **nur diese Agents** Heartbeats aus.
- `channels.defaults.heartbeat` legt Sichtbarkeitsstandards für alle Kanäle fest.
- `channels.<channel>.heartbeat` überschreibt Kanalstandards.
- `channels.<channel>.accounts.<id>.heartbeat` (Multi-Account-Kanäle) überschreibt Einstellungen pro Kanal.

### Heartbeats pro Agent

Wenn ein Eintrag in `agents.list[]` einen `heartbeat`-Block enthält, führen **nur diese Agents** Heartbeats aus. Der Block pro Agent wird über `agents.defaults.heartbeat` zusammengeführt (Sie können also gemeinsame Standardeinstellungen einmal festlegen und pro Agent überschreiben).

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

### Beispiel für aktive Zeiten

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

Außerhalb dieses Fensters (vor 9 Uhr oder nach 22 Uhr Eastern Time) werden Heartbeats übersprungen. Der nächste geplante Tick innerhalb des Fensters wird normal ausgeführt.

### 24/7-Einrichtung

Wenn Heartbeats den ganzen Tag laufen sollen, verwenden Sie eines dieser Muster:

- Lassen Sie `activeHours` vollständig weg (keine Zeitfensterbeschränkung; dies ist das Standardverhalten).
- Legen Sie ein ganztägiges Fenster fest: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
Setzen Sie nicht dieselbe `start`- und `end`-Zeit (zum Beispiel `08:00` bis `08:00`). Das wird als Fenster mit Breite null behandelt, sodass Heartbeats immer übersprungen werden.
</Warning>

### Multi-Account-Beispiel

Verwenden Sie `accountId`, um ein bestimmtes Konto auf Multi-Account-Kanälen wie Telegram anzusprechen:

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
  Optionale Modellüberschreibung für Heartbeat-Läufe (`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  Wenn aktiviert, wird auch die separate `Reasoning:`-Nachricht zugestellt, sofern verfügbar (dieselbe Form wie `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  Wenn true, verwenden Heartbeat-Läufe schlanken Bootstrap-Kontext und behalten nur `HEARTBEAT.md` aus den Workspace-Bootstrap-Dateien.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  Wenn true, läuft jeder Heartbeat in einer frischen Sitzung ohne vorherigen Konversationsverlauf. Verwendet dasselbe Isolationsmuster wie Cron `sessionTarget: "isolated"`. Reduziert die Token-Kosten pro Heartbeat drastisch. Kombinieren Sie dies mit `lightContext: true`, um maximal zu sparen. Die Zustellungsweiterleitung verwendet weiterhin den Kontext der Hauptsitzung.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  Wenn true, werden Heartbeat-Läufe bei zusätzlichen ausgelasteten Lanes zurückgestellt: Subagent- oder verschachtelte Befehlsarbeit. Cron-Lanes stellen Heartbeats immer zurück, auch ohne dieses Flag, damit Hosts mit lokalen Modellen Cron- und Heartbeat-Prompts nicht gleichzeitig ausführen.
</ParamField>
<ParamField path="session" type="string">
  Optionaler Sitzungsschlüssel für Heartbeat-Läufe.

- `main` (Standard): Hauptsitzung des Agent.
- Expliziter Sitzungsschlüssel (aus `openclaw sessions --json` oder der [Sitzungs-CLI](/de/cli/sessions) kopieren).
- Sitzungsschlüssel-Formate: siehe [Sitzungen](/de/concepts/session) und [Gruppen](/de/channels/groups).

</ParamField>
<ParamField path="target" type="string">
- `last`: an den zuletzt verwendeten externen Kanal zustellen.
- expliziter Kanal: jede konfigurierte Kanal- oder Plugin-ID, zum Beispiel `discord`, `matrix`, `telegram` oder `whatsapp`.
- `none` (Standard): Heartbeat ausführen, aber extern **nicht zustellen**.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  Steuert das Verhalten für Direkt-/DM-Zustellung. `allow`: direkte/DM-Heartbeat-Zustellung erlauben. `block`: direkte/DM-Zustellung unterdrücken (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  Optionale Empfängerüberschreibung (kanalspezifische ID, z. B. E.164 für WhatsApp oder eine Telegram-Chat-ID). Für Telegram-Themen/-Threads verwenden Sie `<chatId>:topic:<messageThreadId>`.

</ParamField>
<ParamField path="accountId" type="string">
  Optionale Konto-ID für Multi-Account-Kanäle. Wenn `target: "last"` gesetzt ist, gilt die Konto-ID für den aufgelösten letzten Kanal, sofern dieser Konten unterstützt; andernfalls wird sie ignoriert. Wenn die Konto-ID keinem konfigurierten Konto für den aufgelösten Kanal entspricht, wird die Zustellung übersprungen.

</ParamField>
<ParamField path="prompt" type="string">
  Überschreibt den Standard-Prompt-Text (wird nicht zusammengeführt).

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  Maximal zulässige Zeichen nach `HEARTBEAT_OK` vor der Zustellung.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  Wenn true, werden Nutzlasten für Tool-Fehlerwarnungen während Heartbeat-Läufen unterdrückt.

</ParamField>
<ParamField path="activeHours" type="object">
  Beschränkt Heartbeat-Läufe auf ein Zeitfenster. Objekt mit `start` (HH:MM, inklusiv; verwenden Sie `00:00` für den Tagesanfang), `end` (HH:MM exklusiv; `24:00` für das Tagesende erlaubt) und optional `timezone`.

- Ausgelassen oder `"user"`: verwendet `agents.defaults.userTimezone`, wenn gesetzt, andernfalls wird auf die Zeitzone des Hostsystems zurückgegriffen.
- `"local"`: verwendet immer die Zeitzone des Hostsystems.
- Jede IANA-Kennung (z. B. `America/New_York`): wird direkt verwendet; falls ungültig, wird auf das oben beschriebene `"user"`-Verhalten zurückgegriffen.
- `start` und `end` dürfen für ein aktives Zeitfenster nicht identisch sein; gleiche Werte werden als Breite null behandelt (immer außerhalb des Fensters).
- Außerhalb des aktiven Zeitfensters werden Heartbeats bis zum nächsten Tick innerhalb des Fensters übersprungen.

</ParamField>

## Zustellverhalten

<AccordionGroup>
  <Accordion title="Sitzung und Ziel-Routing">
    - Heartbeats laufen standardmäßig in der Hauptsitzung des Agenten (`agent:<id>:<mainKey>`) oder in `global`, wenn `session.scope = "global"` ist. Setzen Sie `session`, um dies auf eine bestimmte Kanalsitzung (Discord/WhatsApp/usw.) zu überschreiben.
    - `session` wirkt sich nur auf den Ausführungskontext aus; die Zustellung wird durch `target` und `to` gesteuert.
    - Um an einen bestimmten Kanal/Empfänger zuzustellen, setzen Sie `target` + `to`. Mit `target: "last"` verwendet die Zustellung den letzten externen Kanal für diese Sitzung.
    - Heartbeat-Zustellungen erlauben standardmäßig direkte/DM-Ziele. Setzen Sie `directPolicy: "block"`, um Sendungen an direkte Ziele zu unterdrücken, während der Heartbeat-Durchlauf weiterhin ausgeführt wird.
    - Wenn die Hauptwarteschlange, die Ziel-Sitzungsspur, die Cron-Spur oder ein aktiver Cron-Job ausgelastet ist, wird der Heartbeat übersprungen und später erneut versucht.
    - Wenn `skipWhenBusy: true` ist, verschieben Subagenten- und verschachtelte Spuren Heartbeat-Läufe ebenfalls.
    - Wenn `target` kein externes Ziel auflöst, findet der Lauf trotzdem statt, aber es wird keine ausgehende Nachricht gesendet.

  </Accordion>
  <Accordion title="Sichtbarkeit und Überspringverhalten">
    - Wenn `showOk`, `showAlerts` und `useIndicator` alle deaktiviert sind, wird der Lauf vorab mit `reason=alerts-disabled` übersprungen.
    - Wenn nur die Alarmzustellung deaktiviert ist, kann OpenClaw den Heartbeat weiterhin ausführen, Fälligkeitszeitstempel von Aufgaben aktualisieren, den Leerlaufzeitstempel der Sitzung wiederherstellen und die nach außen gerichtete Alarmnutzlast unterdrücken.
    - Wenn das aufgelöste Heartbeat-Ziel Tippen unterstützt, zeigt OpenClaw Tippen an, solange der Heartbeat-Lauf aktiv ist. Dies verwendet dasselbe Ziel, an das der Heartbeat Chat-Ausgaben senden würde, und wird durch `typingMode: "never"` deaktiviert.

  </Accordion>
  <Accordion title="Sitzungslebenszyklus und Audit">
    - Reine Heartbeat-Antworten halten die Sitzung **nicht** am Leben. Heartbeat-Metadaten können die Sitzungszeile aktualisieren, aber der Leerlaufablauf verwendet `lastInteractionAt` aus der letzten echten Benutzer-/Kanalnachricht, und der tägliche Ablauf verwendet `sessionStartedAt`.
    - Verlauf in Control UI und WebChat blendet Heartbeat-Prompts und reine OK-Bestätigungen aus. Das zugrunde liegende Sitzungstranskript kann diese Turns für Audit/Wiedergabe weiterhin enthalten.
    - Losgelöste [Hintergrundaufgaben](/de/automation/tasks) können ein Systemereignis einreihen und Heartbeat wecken, wenn die Hauptsitzung schnell etwas bemerken sollte. Dieses Wecken macht den Heartbeat-Lauf nicht zu einer Hintergrundaufgabe.

  </Accordion>
</AccordionGroup>

## Sichtbarkeitssteuerungen

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

Priorität: pro Konto → pro Kanal → Kanal-Standardeinstellungen → integrierte Standardeinstellungen.

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

| Ziel                                            | Konfiguration                                                                            |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Standardverhalten (stille OKs, Alarme an)       | _(keine Konfiguration erforderlich)_                                                     |
| Vollständig still (keine Nachrichten, kein Indikator) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Nur Indikator (keine Nachrichten)               | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OKs nur in einem Kanal                          | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (optional)

Wenn eine `HEARTBEAT.md`-Datei im Arbeitsbereich existiert, weist der Standard-Prompt den Agenten an, sie zu lesen. Betrachten Sie sie als Ihre „Heartbeat-Checkliste“: klein, stabil und sicher genug, um alle 30 Minuten einbezogen zu werden.

Bei normalen Läufen wird `HEARTBEAT.md` nur eingefügt, wenn Heartbeat-Anleitung für den Standardagenten aktiviert ist. Wenn Sie die Heartbeat-Kadenz mit `0m` deaktivieren oder `includeSystemPromptSection: false` setzen, wird sie aus dem normalen Bootstrap-Kontext weggelassen.

Wenn `HEARTBEAT.md` existiert, aber effektiv leer ist (nur Leerzeilen und Markdown-Überschriften wie `# Heading`), überspringt OpenClaw den Heartbeat-Lauf, um API-Aufrufe zu sparen. Dieses Überspringen wird als `reason=empty-heartbeat-file` gemeldet. Wenn die Datei fehlt, läuft der Heartbeat trotzdem und das Modell entscheidet, was zu tun ist.

Halten Sie sie winzig (kurze Checkliste oder Erinnerungen), um Prompt-Aufblähung zu vermeiden.

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
    - Wenn keine Aufgaben fällig sind, wird der Heartbeat vollständig übersprungen (`reason=no-tasks-due`), um einen verschwendeten Modellaufruf zu vermeiden.
    - Nicht-Aufgaben-Inhalt in `HEARTBEAT.md` bleibt erhalten und wird nach der Liste fälliger Aufgaben als zusätzlicher Kontext angehängt.
    - Zeitstempel der letzten Aufgabenausführung werden im Sitzungsstatus (`heartbeatTaskState`) gespeichert, sodass Intervalle normale Neustarts überstehen.
    - Aufgabenzeitstempel werden erst weitergeschrieben, nachdem ein Heartbeat-Lauf seinen normalen Antwortpfad abgeschlossen hat. Übersprungene `empty-heartbeat-file`- / `no-tasks-due`-Läufe markieren Aufgaben nicht als abgeschlossen.

  </Accordion>
</AccordionGroup>

Der Aufgabenmodus ist nützlich, wenn eine Heartbeat-Datei mehrere periodische Prüfungen enthalten soll, ohne bei jedem Tick für alle zu bezahlen.

### Kann der Agent HEARTBEAT.md aktualisieren?

Ja, wenn Sie ihn darum bitten.

`HEARTBEAT.md` ist nur eine normale Datei im Arbeitsbereich des Agenten, daher können Sie dem Agenten (in einem normalen Chat) etwa Folgendes sagen:

- „Aktualisiere `HEARTBEAT.md`, um eine tägliche Kalenderprüfung hinzuzufügen.“
- „Schreibe `HEARTBEAT.md` neu, damit sie kürzer ist und sich auf Inbox-Nachfassaktionen konzentriert.“

Wenn dies proaktiv geschehen soll, können Sie auch eine explizite Zeile in Ihren Heartbeat-Prompt aufnehmen, etwa: „Wenn die Checkliste veraltet ist, aktualisiere HEARTBEAT.md mit einer besseren.“

<Warning>
Legen Sie keine Geheimnisse (API-Schlüssel, Telefonnummern, private Tokens) in `HEARTBEAT.md` ab — sie wird Teil des Prompt-Kontexts.
</Warning>

## Manuelles Wecken (bei Bedarf)

Sie können ein Systemereignis einreihen und einen sofortigen Heartbeat auslösen mit:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Wenn mehrere Agenten `heartbeat` konfiguriert haben, führt ein manuelles Wecken jeden dieser Agenten-Heartbeats sofort aus.

Verwenden Sie `--mode next-heartbeat`, um bis zum nächsten geplanten Tick zu warten.

## Reasoning-Zustellung (optional)

Standardmäßig stellen Heartbeats nur die finale „Antwort“-Nutzlast zu.

Wenn Sie Transparenz wünschen, aktivieren Sie:

- `agents.defaults.heartbeat.includeReasoning: true`

Wenn aktiviert, stellen Heartbeats außerdem eine separate Nachricht mit dem Präfix `Reasoning:` zu (dieselbe Form wie `/reasoning on`). Das kann nützlich sein, wenn der Agent mehrere Sitzungen/Codexe verwaltet und Sie sehen möchten, warum er entschieden hat, Sie anzupingen — es kann aber auch mehr interne Details preisgeben, als Sie möchten. Lassen Sie es in Gruppenchats vorzugsweise ausgeschaltet.

## Kostenbewusstsein

Heartbeats führen vollständige Agenten-Turns aus. Kürzere Intervalle verbrauchen mehr Tokens. So senken Sie die Kosten:

- Verwenden Sie `isolatedSession: true`, um zu vermeiden, den vollständigen Gesprächsverlauf zu senden (~100K Tokens herunter auf ~2-5K pro Lauf).
- Verwenden Sie `lightContext: true`, um Bootstrap-Dateien auf nur `HEARTBEAT.md` zu beschränken.
- Setzen Sie ein günstigeres `model` (z. B. `ollama/llama3.2:1b`).
- Halten Sie `HEARTBEAT.md` klein.
- Verwenden Sie `target: "none"`, wenn Sie nur interne Statusaktualisierungen wünschen.

## Kontextüberlauf nach Heartbeat

Wenn ein Heartbeat ein kleineres lokales Modell verwendet, zum Beispiel ein Ollama-Modell mit einem 32k-Fenster, und der nächste Turn der Hauptsitzung einen Kontextüberlauf meldet, prüfen Sie, ob der vorherige Heartbeat die Sitzung auf dem Heartbeat-Modell belassen hat. Die Reset-Nachricht von OpenClaw weist darauf hin, wenn das letzte Laufzeitmodell mit dem konfigurierten `heartbeat.model` übereinstimmt.

Verwenden Sie `isolatedSession: true`, um Heartbeats in einer frischen Sitzung auszuführen, kombinieren Sie dies mit `lightContext: true` für den kleinsten Prompt, oder wählen Sie ein Heartbeat-Modell mit einem Kontextfenster, das groß genug für die gemeinsam genutzte Sitzung ist.

## Verwandt

- [Automation & Aufgaben](/de/automation) — alle Automatisierungsmechanismen auf einen Blick
- [Hintergrundaufgaben](/de/automation/tasks) — wie losgelöste Arbeit nachverfolgt wird
- [Zeitzone](/de/concepts/timezone) — wie die Zeitzone die Heartbeat-Planung beeinflusst
- [Fehlerbehebung](/de/automation/cron-jobs#troubleshooting) — Automatisierungsprobleme debuggen
