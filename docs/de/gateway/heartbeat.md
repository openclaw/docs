---
read_when:
    - Heartbeat-Takt oder Messaging anpassen
    - Entscheidung zwischen Heartbeat und Cron für geplante Aufgaben
sidebarTitle: Heartbeat
summary: Heartbeat-Abrufnachrichten und Benachrichtigungsregeln
title: Heartbeat
x-i18n:
    generated_at: "2026-06-27T17:30:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 415c8f8f18143320a015e44237471b09b8fc091975f78dd9de025310df39645b
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat oder Cron?** Siehe [Automation](/de/automation) für Hinweise, wann Sie was verwenden sollten.
</Note>

Heartbeat führt **regelmäßige Agent-Turns** in der Hauptsitzung aus, damit das Modell alles melden kann, was Aufmerksamkeit erfordert, ohne Sie mit Nachrichten zu überfluten.

Heartbeat ist ein geplanter Turn in der Hauptsitzung — er erstellt **keine** [Hintergrundaufgaben](/de/automation/tasks)-Einträge. Aufgabeneinträge sind für entkoppelte Arbeit gedacht (ACP-Läufe, Subagenten, isolierte Cron-Jobs).

Fehlerbehebung: [Geplante Aufgaben](/de/automation/cron-jobs#troubleshooting)

## Schnellstart (Einsteiger)

<Steps>
  <Step title="Pick a cadence">
    Lassen Sie Heartbeats aktiviert (Standard ist `30m`, oder `1h` bei Anthropic OAuth-/Token-Authentifizierung, einschließlich Wiederverwendung der Claude CLI) oder legen Sie Ihren eigenen Takt fest.
  </Step>
  <Step title="Add HEARTBEAT.md (optional)">
    Erstellen Sie eine kurze `HEARTBEAT.md`-Checkliste oder einen `tasks:`-Block im Agent-Arbeitsbereich.
  </Step>
  <Step title="Decide where heartbeat messages should go">
    `target: "none"` ist die Standardeinstellung; setzen Sie `target: "last"`, um an den letzten Kontakt weiterzuleiten.
  </Step>
  <Step title="Optional tuning">
    - Aktivieren Sie die Zustellung von Heartbeat-Reasoning für Transparenz.
    - Verwenden Sie leichtgewichtigen Bootstrap-Kontext, wenn Heartbeat-Läufe nur `HEARTBEAT.md` benötigen.
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
        // includeReasoning: true, // optional: send separate `Thinking` message too
      },
    },
  },
}
```

## Standardwerte

- Intervall: `30m` (oder `1h`, wenn Anthropic OAuth-/Token-Authentifizierung als Authentifizierungsmodus erkannt wird, einschließlich Wiederverwendung der Claude CLI). Setzen Sie `agents.defaults.heartbeat.every` oder pro Agent `agents.list[].heartbeat.every`; verwenden Sie `0m`, um es zu deaktivieren.
- Prompt-Text (konfigurierbar über `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Timeout: Nicht gesetzte Heartbeat-Turns verwenden `agents.defaults.timeoutSeconds`, wenn gesetzt. Andernfalls verwenden sie den Heartbeat-Takt, begrenzt auf 600 Sekunden. Setzen Sie `agents.defaults.heartbeat.timeoutSeconds` oder pro Agent `agents.list[].heartbeat.timeoutSeconds` für längere Heartbeat-Arbeit.
- Der Heartbeat-Prompt wird **wortgetreu** als Benutzernachricht gesendet. Der System-Prompt enthält nur dann einen Abschnitt „Heartbeat“, wenn Heartbeats für den Standard-Agent aktiviert sind, und der Lauf wird intern markiert.
- Wenn Heartbeats mit `0m` deaktiviert sind, lassen normale Läufe auch `HEARTBEAT.md` aus dem Bootstrap-Kontext weg, damit das Modell keine Heartbeat-spezifischen Anweisungen sieht.
- Aktive Stunden (`heartbeat.activeHours`) werden in der konfigurierten Zeitzone geprüft. Außerhalb des Fensters werden Heartbeats bis zum nächsten Tick innerhalb des Fensters übersprungen.
- Heartbeats werden automatisch zurückgestellt, während Cron-Arbeit aktiv ist oder in der Warteschlange steht. Setzen Sie `heartbeat.skipWhenBusy: true`, um einen Agent auch bei seinen eigenen sitzungsschlüsselgebundenen Subagenten- oder verschachtelten Befehls-Lanes zurückzustellen; gleichgeordnete Agenten pausieren nicht mehr nur deshalb, weil ein anderer Agent Subagenten-Arbeit ausführt.

## Wofür der Heartbeat-Prompt gedacht ist

Der Standard-Prompt ist absichtlich breit gefasst:

- **Hintergrundaufgaben**: „Ausstehende Aufgaben berücksichtigen“ regt den Agent an, Follow-ups zu prüfen (Posteingang, Kalender, Erinnerungen, wartende Arbeit) und alles Dringende zu melden.
- **Menschlicher Check-in**: „Tagsüber gelegentlich bei Ihrem Menschen nachfragen“ regt gelegentlich eine leichtgewichtige Nachricht wie „Brauchen Sie etwas?“ an, vermeidet aber nächtliche Störungen, indem Ihre konfigurierte lokale Zeitzone verwendet wird (siehe [Zeitzone](/de/concepts/timezone)).

Heartbeat kann auf abgeschlossene [Hintergrundaufgaben](/de/automation/tasks) reagieren, aber ein Heartbeat-Lauf selbst erstellt keinen Aufgabeneintrag.

Wenn ein Heartbeat etwas sehr Spezifisches tun soll (z. B. „Gmail-PubSub-Statistiken prüfen“ oder „Gateway-Zustand verifizieren“), setzen Sie `agents.defaults.heartbeat.prompt` (oder `agents.list[].heartbeat.prompt`) auf einen benutzerdefinierten Text (wird wortgetreu gesendet).

## Antwortvertrag

- Wenn nichts Aufmerksamkeit erfordert, antworten Sie mit **`HEARTBEAT_OK`**.
- Tool-fähige Heartbeat-Läufe können stattdessen `heartbeat_respond` mit `notify: false` für kein sichtbares Update aufrufen, oder `notify: true` plus `notificationText` für eine Warnung. Wenn vorhanden, hat die strukturierte Tool-Antwort Vorrang vor dem Text-Fallback.
- Während Heartbeat-Läufen behandelt OpenClaw `HEARTBEAT_OK` als Bestätigung, wenn es am **Anfang oder Ende** der Antwort erscheint. Das Token wird entfernt und die Antwort verworfen, wenn der verbleibende Inhalt **≤ `ackMaxChars`** ist (Standard: 300).
- Wenn `HEARTBEAT_OK` in der **Mitte** einer Antwort erscheint, wird es nicht besonders behandelt.
- Bei Warnungen **nicht** `HEARTBEAT_OK` einschließen; geben Sie nur den Warntext zurück.

Außerhalb von Heartbeats wird ein versehentliches `HEARTBEAT_OK` am Anfang/Ende einer Nachricht entfernt und protokolliert; eine Nachricht, die nur `HEARTBEAT_OK` enthält, wird verworfen.

## Konfiguration

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // default: 30m (0m disables)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // default: false (deliver separate Thinking message when available)
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

### Geltungsbereich und Vorrang

- `agents.defaults.heartbeat` legt das globale Heartbeat-Verhalten fest.
- `agents.list[].heartbeat` wird darübergelegt; wenn ein Agent einen `heartbeat`-Block hat, führen **nur diese Agenten** Heartbeats aus.
- `channels.defaults.heartbeat` legt Sichtbarkeitsstandards für alle Kanäle fest.
- `channels.<channel>.heartbeat` überschreibt Kanalstandardwerte.
- `channels.<channel>.accounts.<id>.heartbeat` (Multi-Account-Kanäle) überschreibt Einstellungen pro Kanal.

### Heartbeats pro Agent

Wenn ein Eintrag in `agents.list[]` einen `heartbeat`-Block enthält, führen **nur diese Agenten** Heartbeats aus. Der Block pro Agent wird über `agents.defaults.heartbeat` gelegt (Sie können also gemeinsame Standardwerte einmal setzen und pro Agent überschreiben).

Beispiel: zwei Agenten, nur der zweite Agent führt Heartbeats aus.

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

Außerhalb dieses Fensters (vor 9 Uhr oder nach 22 Uhr Eastern Time) werden Heartbeats übersprungen. Der nächste geplante Tick innerhalb des Fensters läuft normal.

### 24/7-Einrichtung

Wenn Heartbeats den ganzen Tag laufen sollen, verwenden Sie eines dieser Muster:

- Lassen Sie `activeHours` vollständig weg (keine Zeitfenster-Beschränkung; dies ist das Standardverhalten).
- Setzen Sie ein ganztägiges Fenster: `activeHours: { start: "00:00", end: "24:00" }`.

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
  Heartbeat-Intervall (Dauerzeichenfolge; Standardeinheit = Minuten).
</ParamField>
<ParamField path="model" type="string">
  Optionale Modellüberschreibung für Heartbeat-Läufe (`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  Wenn aktiviert, wird auch die separate `Thinking`-Nachricht zugestellt, sofern verfügbar (gleiche Form wie `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  Wenn true, verwenden Heartbeat-Läufe leichtgewichtigen Bootstrap-Kontext und behalten nur `HEARTBEAT.md` aus den Workspace-Bootstrap-Dateien bei.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  Wenn true, läuft jeder Heartbeat in einer frischen Sitzung ohne vorherigen Gesprächsverlauf. Verwendet dasselbe Isolationsmuster wie Cron `sessionTarget: "isolated"`. Reduziert die Token-Kosten pro Heartbeat erheblich. Kombinieren Sie dies mit `lightContext: true` für maximale Einsparungen. Die Zustellungsweiterleitung verwendet weiterhin den Kontext der Hauptsitzung.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  Wenn true, werden Heartbeat-Läufe bei zusätzlichen ausgelasteten Lanes dieses Agent zurückgestellt: bei seinem eigenen sitzungsschlüsselgebundenen Subagenten oder verschachtelter Befehlsarbeit. Cron-Lanes stellen Heartbeats immer zurück, auch ohne dieses Flag, damit Hosts mit lokalen Modellen Cron- und Heartbeat-Prompts nicht gleichzeitig ausführen.
</ParamField>
<ParamField path="session" type="string">
  Optionaler Sitzungsschlüssel für Heartbeat-Läufe.

- `main` (Standard): Hauptsitzung des Agent.
- Expliziter Sitzungsschlüssel (aus `openclaw sessions --json` oder der [Sitzungs-CLI](/de/cli/sessions) kopieren).
- Sitzungsschlüsselformate: siehe [Sitzungen](/de/concepts/session) und [Gruppen](/de/channels/groups).

</ParamField>
<ParamField path="target" type="string">
- `last`: an den zuletzt verwendeten externen Kanal zustellen.
- Expliziter Kanal: jede konfigurierte Kanal- oder Plugin-ID, zum Beispiel `discord`, `matrix`, `telegram` oder `whatsapp`.
- `none` (Standard): Heartbeat ausführen, aber extern **nicht zustellen**.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  Steuert das Zustellungsverhalten für Direktnachrichten/DMs. `allow`: direkte/DM-Heartbeat-Zustellung erlauben. `block`: direkte/DM-Zustellung unterdrücken (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  Optionale Empfängerüberschreibung (kanalspezifische ID, z. B. E.164 für WhatsApp oder eine Telegram-Chat-ID). Verwenden Sie für Telegram-Themen/Threads `<chatId>:topic:<messageThreadId>`.

</ParamField>
<ParamField path="accountId" type="string">
  Optionale Konto-ID für Kanäle mit mehreren Konten. Bei `target: "last"` gilt die Konto-ID für den aufgelösten letzten Kanal, wenn dieser Konten unterstützt; andernfalls wird sie ignoriert. Wenn die Konto-ID keinem konfigurierten Konto für den aufgelösten Kanal entspricht, wird die Zustellung übersprungen.

</ParamField>
<ParamField path="prompt" type="string">
  Überschreibt den Standard-Prompt-Textkörper (wird nicht zusammengeführt).

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  Maximal zulässige Zeichen nach `HEARTBEAT_OK` vor der Zustellung.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  Wenn wahr, werden Warn-Payloads zu Tool-Fehlern während Heartbeat-Läufen unterdrückt.

</ParamField>
<ParamField path="timeoutSeconds" type="number" default="global timeout or min(every, 600)">
  Maximale Anzahl Sekunden, die ein Heartbeat-Agentendurchlauf dauern darf, bevor er abgebrochen wird. Nicht setzen, um `agents.defaults.timeoutSeconds` zu verwenden, sofern gesetzt; andernfalls wird die Heartbeat-Kadenz auf höchstens 600 Sekunden begrenzt.

</ParamField>
<ParamField path="activeHours" type="object">
  Beschränkt Heartbeat-Läufe auf ein Zeitfenster. Objekt mit `start` (HH:MM, inklusiv; verwenden Sie `00:00` für den Tagesbeginn), `end` (HH:MM exklusiv; `24:00` für das Tagesende zulässig) und optional `timezone`.

- Ausgelassen oder `"user"`: verwendet Ihr `agents.defaults.userTimezone`, sofern gesetzt, andernfalls wird auf die Zeitzone des Hostsystems zurückgegriffen.
- `"local"`: verwendet immer die Zeitzone des Hostsystems.
- Beliebige IANA-Kennung (z. B. `America/New_York`): wird direkt verwendet; falls ungültig, wird auf das oben beschriebene Verhalten von `"user"` zurückgegriffen.
- `start` und `end` dürfen für ein aktives Fenster nicht gleich sein; gleiche Werte werden als Breite null behandelt (immer außerhalb des Fensters).
- Außerhalb des aktiven Fensters werden Heartbeats bis zum nächsten Tick innerhalb des Fensters übersprungen.

</ParamField>

## Zustellungsverhalten

<AccordionGroup>
  <Accordion title="Sitzungs- und Ziel-Routing">
    - Heartbeats laufen standardmäßig in der Hauptsitzung des Agenten (`agent:<id>:<mainKey>`) oder in `global`, wenn `session.scope = "global"` ist. Setzen Sie `session`, um auf eine bestimmte Kanalsitzung (Discord/WhatsApp/usw.) umzuschalten.
    - `session` betrifft nur den Laufkontext; die Zustellung wird durch `target` und `to` gesteuert.
    - Um an einen bestimmten Kanal/Empfänger zuzustellen, setzen Sie `target` + `to`. Mit `target: "last"` verwendet die Zustellung den letzten externen Kanal für diese Sitzung.
    - Heartbeat-Zustellungen erlauben direkte/DM-Ziele standardmäßig. Setzen Sie `directPolicy: "block"`, um Sendungen an direkte Ziele zu unterdrücken, während der Heartbeat-Durchlauf weiterhin ausgeführt wird.
    - Wenn die Hauptwarteschlange, die Ziel-Sitzungsspur, die Cron-Spur oder ein aktiver Cron-Job ausgelastet ist, wird der Heartbeat übersprungen und später erneut versucht.
    - Wenn `skipWhenBusy: true` ist, verschieben auch der sitzungsschlüsselbasierte Subagent dieses Agenten und verschachtelte Spuren Heartbeat-Läufe. Ausgelastete Spuren anderer Agenten verschieben diesen Agenten nicht.
    - Wenn `target` auf kein externes Ziel aufgelöst wird, findet der Lauf trotzdem statt, aber es wird keine ausgehende Nachricht gesendet.

  </Accordion>
  <Accordion title="Sichtbarkeit und Überspringverhalten">
    - Wenn `showOk`, `showAlerts` und `useIndicator` alle deaktiviert sind, wird der Lauf vorab mit `reason=alerts-disabled` übersprungen.
    - Wenn nur die Alarmzustellung deaktiviert ist, kann OpenClaw den Heartbeat trotzdem ausführen, Fälligkeitszeitstempel von Aufgaben aktualisieren, den Leerlaufzeitstempel der Sitzung wiederherstellen und den nach außen gerichteten Alarm-Payload unterdrücken.
    - Wenn das aufgelöste Heartbeat-Ziel Tippen unterstützt, zeigt OpenClaw Tippen an, während der Heartbeat-Lauf aktiv ist. Dies verwendet dasselbe Ziel, an das der Heartbeat Chat-Ausgabe senden würde, und wird durch `typingMode: "never"` deaktiviert.

  </Accordion>
  <Accordion title="Sitzungslebenszyklus und Audit">
    - Reine Heartbeat-Antworten halten die Sitzung **nicht** am Leben. Heartbeat-Metadaten können die Sitzungszeile aktualisieren, aber der Leerlaufablauf verwendet `lastInteractionAt` aus der letzten echten Benutzer-/Kanalnachricht, und der tägliche Ablauf verwendet `sessionStartedAt`.
    - Die Verlaufshistorie von Control UI und WebChat blendet Heartbeat-Prompts und reine OK-Bestätigungen aus. Das zugrunde liegende Sitzungstranskript kann diese Durchläufe für Audit/Wiedergabe weiterhin enthalten.
    - Abgekoppelte [Hintergrundaufgaben](/de/automation/tasks) können ein Systemereignis einreihen und Heartbeat wecken, wenn die Hauptsitzung schnell etwas bemerken soll. Dieses Wecken macht den Heartbeat-Lauf nicht zu einer Hintergrundaufgabe.

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

Priorität: pro Konto → pro Kanal → Kanalstandards → integrierte Standards.

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

### Häufige Muster

| Ziel                                      | Konfiguration                                                                            |
| ----------------------------------------- | ---------------------------------------------------------------------------------------- |
| Standardverhalten (stille OKs, Alarme an) | _(keine Konfiguration erforderlich)_                                                     |
| Vollständig still (keine Nachrichten, kein Indikator) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Nur Indikator (keine Nachrichten)         | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OKs nur in einem Kanal                    | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (optional)

Wenn im Workspace eine Datei `HEARTBEAT.md` vorhanden ist, weist der Standard-Prompt den Agenten an, sie zu lesen. Betrachten Sie sie als Ihre „Heartbeat-Checkliste“: klein, stabil und sicher genug, um sie alle 30 Minuten zu berücksichtigen.

Bei normalen Läufen wird `HEARTBEAT.md` nur eingefügt, wenn Heartbeat-Anleitung für den Standardagenten aktiviert ist. Das Deaktivieren der Heartbeat-Kadenz mit `0m` oder das Setzen von `includeSystemPromptSection: false` lässt sie aus dem normalen Bootstrap-Kontext weg.

Im nativen Codex-Harness wird der Inhalt von `HEARTBEAT.md` nicht in den Durchlauf eingefügt. Wenn die Datei vorhanden ist und Inhalt enthält, der nicht nur aus Leerraum besteht, verweisen die Heartbeat-Anweisungen für den Kollaborationsmodus Codex auf die Datei und weisen ihn an, sie vor dem Fortfahren zu lesen.

Wenn `HEARTBEAT.md` vorhanden, aber praktisch leer ist (nur Leerzeilen, Markdown-/HTML-Kommentare, Markdown-Überschriften wie `# Heading`, Fence-Markierungen oder leere Checklisten-Stubs), überspringt OpenClaw den Heartbeat-Lauf, um API-Aufrufe zu sparen. Dieses Überspringen wird als `reason=empty-heartbeat-file` gemeldet. Wenn die Datei fehlt, läuft der Heartbeat trotzdem, und das Modell entscheidet, was zu tun ist.

Halten Sie sie sehr klein (kurze Checkliste oder Erinnerungen), um Prompt-Aufblähung zu vermeiden.

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
    - OpenClaw analysiert den `tasks:`-Block und prüft jede Aufgabe gegen ihr eigenes `interval`.
    - Nur **fällige** Aufgaben werden für diesen Tick in den Heartbeat-Prompt aufgenommen.
    - Wenn keine Aufgaben fällig sind, wird der Heartbeat vollständig übersprungen (`reason=no-tasks-due`), um einen verschwendeten Modellaufruf zu vermeiden.
    - Nicht-Aufgaben-Inhalte in `HEARTBEAT.md` bleiben erhalten und werden nach der Liste fälliger Aufgaben als zusätzlicher Kontext angehängt.
    - Zeitstempel der letzten Aufgabenausführung werden im Sitzungsstatus (`heartbeatTaskState`) gespeichert, sodass Intervalle normale Neustarts überdauern.
    - Aufgabenzeitstempel werden erst weitergesetzt, nachdem ein Heartbeat-Lauf seinen normalen Antwortpfad abgeschlossen hat. Übersprungene Läufe mit `empty-heartbeat-file` / `no-tasks-due` markieren Aufgaben nicht als abgeschlossen.

  </Accordion>
</AccordionGroup>

Der Aufgabenmodus ist nützlich, wenn Sie in einer Heartbeat-Datei mehrere regelmäßige Prüfungen ablegen möchten, ohne bei jedem Tick für alle zu bezahlen.

### Kann der Agent HEARTBEAT.md aktualisieren?

Ja — wenn Sie ihn darum bitten.

`HEARTBEAT.md` ist nur eine normale Datei im Agenten-Workspace, daher können Sie dem Agenten (in einem normalen Chat) zum Beispiel sagen:

- „Aktualisieren Sie `HEARTBEAT.md`, um eine tägliche Kalenderprüfung hinzuzufügen.“
- „Schreiben Sie `HEARTBEAT.md` neu, damit sie kürzer ist und sich auf Inbox-Follow-ups konzentriert.“

Wenn dies proaktiv geschehen soll, können Sie auch eine explizite Zeile in Ihren Heartbeat-Prompt aufnehmen, etwa: „Wenn die Checkliste veraltet ist, aktualisieren Sie HEARTBEAT.md mit einer besseren.“

<Warning>
Legen Sie keine Geheimnisse (API-Schlüssel, Telefonnummern, private Tokens) in `HEARTBEAT.md` ab — sie wird Teil des Prompt-Kontexts.
</Warning>

## Manuelles Wecken (bei Bedarf)

Sie können ein Systemereignis einreihen und mit folgendem Befehl einen sofortigen Heartbeat auslösen:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Wenn für mehrere Agenten `heartbeat` konfiguriert ist, führt ein manuelles Wecken jeden dieser Agenten-Heartbeats sofort aus.

Verwenden Sie `--mode next-heartbeat`, um auf den nächsten geplanten Tick zu warten.

## Reasoning-Zustellung (optional)

Standardmäßig liefern Heartbeats nur den finalen „Antwort“-Payload.

Wenn Sie Transparenz wünschen, aktivieren Sie:

- `agents.defaults.heartbeat.includeReasoning: true`

Wenn aktiviert, liefern Heartbeats außerdem eine separate Nachricht mit dem Präfix `Thinking` (gleiche Form wie `/reasoning on`). Das kann nützlich sein, wenn der Agent mehrere Sitzungen/Codexes verwaltet und Sie sehen möchten, warum er entschieden hat, Sie anzupingen — es kann aber auch mehr interne Details preisgeben, als Sie möchten. In Gruppenchats sollten Sie es bevorzugt deaktiviert lassen.

## Kostenbewusstsein

Heartbeats führen vollständige Agentendurchläufe aus. Kürzere Intervalle verbrauchen mehr Tokens. So reduzieren Sie Kosten:

- Verwenden Sie `isolatedSession: true`, um zu vermeiden, die vollständige Konversationshistorie zu senden (~100K Tokens herunter auf ~2-5K pro Lauf).
- Verwenden Sie `lightContext: true`, um Bootstrap-Dateien auf nur `HEARTBEAT.md` zu beschränken.
- Setzen Sie ein günstigeres `model` (z. B. `ollama/llama3.2:1b`).
- Halten Sie `HEARTBEAT.md` klein.
- Verwenden Sie `target: "none"`, wenn Sie nur interne Statusaktualisierungen möchten.

## Kontextüberlauf nach Heartbeat

Wenn ein Heartbeat zuvor eine bestehende Sitzung auf einem kleineren lokalen Modell hinterlassen hat, zum Beispiel einem Ollama-Modell mit einem 32k-Fenster, und der nächste Hauptsitzungsdurchlauf einen Kontextüberlauf meldet, setzen Sie das Sitzungs-Laufzeitmodell wieder auf das konfigurierte primäre Modell zurück. Die Zurücksetzungsnachricht von OpenClaw weist darauf hin, wenn das letzte Laufzeitmodell mit dem konfigurierten `heartbeat.model` übereinstimmt.

Aktuelle Heartbeats bewahren das bestehende Laufzeitmodell der gemeinsamen Sitzung, nachdem der Lauf abgeschlossen ist. Sie können weiterhin `isolatedSession: true` verwenden, um Heartbeats in einer frischen Sitzung auszuführen, dies mit `lightContext: true` für den kleinsten Prompt kombinieren oder ein Heartbeat-Modell mit einem Kontextfenster wählen, das groß genug für die gemeinsame Sitzung ist.

## Verwandt

- [Automatisierung](/de/automation) — alle Automatisierungsmechanismen auf einen Blick
- [Hintergrundaufgaben](/de/automation/tasks) — wie losgelöste Arbeit nachverfolgt wird
- [Zeitzone](/de/concepts/timezone) — wie die Zeitzone die Heartbeat-Planung beeinflusst
- [Fehlerbehebung](/de/automation/cron-jobs#troubleshooting) — Automatisierungsprobleme debuggen
