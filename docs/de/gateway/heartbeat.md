---
read_when:
    - Anpassung der Heartbeat-Frequenz oder Nachrichtenübermittlung
    - Entscheidung zwischen Heartbeat und Cron für geplante Aufgaben
summary: Heartbeat-Abfragenachrichten und Benachrichtigungsregeln
title: Heartbeat
x-i18n:
    generated_at: "2026-04-25T13:46:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 17353a03bbae7ad564548e767099f8596764e2cf9bc3d457ec9fc3482ba7d71c
    source_path: gateway/heartbeat.md
    workflow: 15
---

> **Heartbeat oder Cron?** Siehe [Automation & Tasks](/de/automation) für Hinweise, wann welches verwendet werden sollte.

Heartbeat führt **periodische Agenten-Turns** in der Hauptsitzung aus, damit das Modell
alles hervorheben kann, was Aufmerksamkeit benötigt, ohne Sie zu spammen.

Heartbeat ist ein geplanter Main-Session-Turn — er erstellt **keine** Datensätze für [Hintergrundaufgaben](/de/automation/tasks).
Task-Datensätze sind für entkoppelte Arbeit gedacht (ACP-Läufe, Unteragenten, isolierte Cron-Jobs).

Fehlerbehebung: [Geplante Aufgaben](/de/automation/cron-jobs#troubleshooting)

## Schnellstart (für Einsteiger)

1. Lassen Sie Heartbeats aktiviert (Standard ist `30m`, oder `1h` bei Anthropic-OAuth-/Token-Auth, einschließlich Claude-CLI-Wiederverwendung) oder setzen Sie Ihre eigene Frequenz.
2. Erstellen Sie eine kleine Checkliste in `HEARTBEAT.md` oder einen `tasks:`-Block im Agent-Workspace (optional, aber empfohlen).
3. Entscheiden Sie, wohin Heartbeat-Nachrichten gesendet werden sollen (`target: "none"` ist der Standard; setzen Sie `target: "last"`, um an den letzten Kontakt zu routen).
4. Optional: Aktivieren Sie die Zustellung von Heartbeat-Reasoning für mehr Transparenz.
5. Optional: Verwenden Sie leichtgewichtigen Bootstrap-Kontext, wenn Heartbeat-Läufe nur `HEARTBEAT.md` benötigen.
6. Optional: Aktivieren Sie isolierte Sitzungen, um nicht bei jedem Heartbeat den vollständigen Gesprächsverlauf zu senden.
7. Optional: Beschränken Sie Heartbeats auf aktive Stunden (Ortszeit).

Beispielkonfiguration:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // explizite Zustellung an den letzten Kontakt (Standard ist "none")
        directPolicy: "allow", // Standard: direkte/DM-Ziele erlauben; auf "block" setzen, um zu unterdrücken
        lightContext: true, // optional: nur HEARTBEAT.md aus Bootstrap-Dateien injizieren
        isolatedSession: true, // optional: bei jedem Lauf frische Sitzung (kein Gesprächsverlauf)
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // optional: separate `Reasoning:`-Nachricht ebenfalls senden
      },
    },
  },
}
```

## Standardwerte

- Intervall: `30m` (oder `1h`, wenn Anthropic-OAuth-/Token-Auth der erkannte Auth-Modus ist, einschließlich Claude-CLI-Wiederverwendung). Setzen Sie `agents.defaults.heartbeat.every` oder pro Agent `agents.list[].heartbeat.every`; verwenden Sie `0m` zum Deaktivieren.
- Prompt-Textkörper (konfigurierbar über `agents.defaults.heartbeat.prompt`):
  `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Der Heartbeat-Prompt wird **wörtlich** als Benutzernachricht gesendet. Der System-
  Prompt enthält nur dann einen Abschnitt „Heartbeat“, wenn Heartbeats für den
  Standard-Agenten aktiviert sind und der Lauf intern entsprechend markiert ist.
- Wenn Heartbeats mit `0m` deaktiviert sind, lassen normale Läufe auch `HEARTBEAT.md`
  aus dem Bootstrap-Kontext weg, sodass das Modell keine Heartbeat-spezifischen Anweisungen sieht.
- Aktive Stunden (`heartbeat.activeHours`) werden in der konfigurierten Zeitzone geprüft.
  Außerhalb des Fensters werden Heartbeats bis zum nächsten Tick innerhalb des Fensters übersprungen.

## Wofür der Heartbeat-Prompt gedacht ist

Der Standard-Prompt ist absichtlich breit gehalten:

- **Hintergrundaufgaben**: „Consider outstanding tasks“ veranlasst den Agenten,
  Folgeaufgaben zu prüfen (Posteingang, Kalender, Erinnerungen, Warteschlangenarbeit) und alles Dringende hervorzuheben.
- **Menschlicher Check-in**: „Checkup sometimes on your human during day time“ veranlasst eine
  gelegentliche leichte Nachricht wie „Brauchst du etwas?“, vermeidet aber nächtlichen Spam,
  indem Ihre konfigurierte lokale Zeitzone verwendet wird (siehe [/concepts/timezone](/de/concepts/timezone)).

Heartbeat kann auf abgeschlossene [Hintergrundaufgaben](/de/automation/tasks) reagieren, aber ein Heartbeat-Lauf selbst erstellt keinen Task-Datensatz.

Wenn Sie möchten, dass ein Heartbeat etwas sehr Spezifisches tut (z. B. „Gmail-PubSub-
Statistiken prüfen“ oder „Gateway-Zustand verifizieren“), setzen Sie `agents.defaults.heartbeat.prompt` (oder
`agents.list[].heartbeat.prompt`) auf einen benutzerdefinierten Textkörper (wird wörtlich gesendet).

## Antwortvertrag

- Wenn nichts Aufmerksamkeit erfordert, antworten Sie mit **`HEARTBEAT_OK`**.
- Während Heartbeat-Läufen behandelt OpenClaw `HEARTBEAT_OK` als Bestätigung, wenn es
  am **Anfang oder Ende** der Antwort erscheint. Das Token wird entfernt und die Antwort wird
  verworfen, wenn der verbleibende Inhalt **≤ `ackMaxChars`** ist (Standard: 300).
- Wenn `HEARTBEAT_OK` in der **Mitte** einer Antwort erscheint, wird es nicht
  speziell behandelt.
- Für Warnmeldungen: Fügen Sie **nicht** `HEARTBEAT_OK` ein; geben Sie nur den Warntext zurück.

Außerhalb von Heartbeats wird ein verirrtes `HEARTBEAT_OK` am Anfang/Ende einer Nachricht entfernt
und protokolliert; eine Nachricht, die nur aus `HEARTBEAT_OK` besteht, wird verworfen.

## Konfiguration

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // Standard: 30m (0m deaktiviert)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // Standard: false (separate Reasoning:-Nachricht zustellen, wenn verfügbar)
        lightContext: false, // Standard: false; true behält nur HEARTBEAT.md aus Workspace-Bootstrap-Dateien
        isolatedSession: false, // Standard: false; true führt jeden Heartbeat in einer frischen Sitzung aus (kein Gesprächsverlauf)
        target: "last", // Standard: none | Optionen: last | none | <channel id> (core oder Plugin, z. B. "bluebubbles")
        to: "+15551234567", // optionales kanalspezifisches Override
        accountId: "ops-bot", // optionale Multi-Account-Kanal-ID
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // maximal erlaubte Zeichen nach HEARTBEAT_OK
      },
    },
  },
}
```

### Geltungsbereich und Vorrang

- `agents.defaults.heartbeat` setzt globales Heartbeat-Verhalten.
- `agents.list[].heartbeat` wird darüber zusammengeführt; wenn irgendein Agent einen `heartbeat`-Block hat, führen **nur diese Agenten** Heartbeats aus.
- `channels.defaults.heartbeat` setzt Standards für die Sichtbarkeit in allen Kanälen.
- `channels.<channel>.heartbeat` überschreibt Kanalstandards.
- `channels.<channel>.accounts.<id>.heartbeat` (Kanäle mit mehreren Konten) überschreibt pro-Kanal-Einstellungen.

### Heartbeats pro Agent

Wenn irgendein Eintrag in `agents.list[]` einen `heartbeat`-Block enthält, führen **nur diese Agenten**
Heartbeats aus. Der Block pro Agent wird über `agents.defaults.heartbeat`
zusammengeführt (so können Sie gemeinsame Standardwerte einmal setzen und pro Agent überschreiben).

Beispiel: zwei Agenten, nur der zweite Agent führt Heartbeats aus.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // explizite Zustellung an den letzten Kontakt (Standard ist "none")
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
        target: "last", // explizite Zustellung an den letzten Kontakt (Standard ist "none")
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York", // optional; verwendet userTimezone, falls gesetzt, sonst die Host-Zeitzone
        },
      },
    },
  },
}
```

Außerhalb dieses Fensters (vor 9 Uhr oder nach 22 Uhr Eastern) werden Heartbeats übersprungen. Der nächste geplante Tick innerhalb des Fensters läuft normal.

### 24/7-Einrichtung

Wenn Sie möchten, dass Heartbeats den ganzen Tag laufen, verwenden Sie eines dieser Muster:

- Lassen Sie `activeHours` ganz weg (keine Zeitfensterbeschränkung; das ist das Standardverhalten).
- Setzen Sie ein Ganztagsfenster: `activeHours: { start: "00:00", end: "24:00" }`.

Setzen Sie nicht dieselbe `start`- und `end`-Zeit (zum Beispiel `08:00` bis `08:00`).
Das wird als Fenster mit Nullbreite behandelt, sodass Heartbeats immer übersprungen werden.

### Beispiel für mehrere Konten

Verwenden Sie `accountId`, um ein bestimmtes Konto in Kanälen mit mehreren Konten wie Telegram anzusprechen:

```json5
{
  agents: {
    list: [
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "telegram",
          to: "12345678:topic:42", // optional: an ein bestimmtes Topic/einen bestimmten Thread routen
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

- `every`: Heartbeat-Intervall (Dauer-String; Standardeinheit = Minuten).
- `model`: optionales Modell-Override für Heartbeat-Läufe (`provider/model`).
- `includeReasoning`: wenn aktiviert, wird auch die separate `Reasoning:`-Nachricht zugestellt, wenn verfügbar (gleiche Form wie bei `/reasoning on`).
- `lightContext`: wenn true, verwenden Heartbeat-Läufe leichtgewichtigen Bootstrap-Kontext und behalten nur `HEARTBEAT.md` aus Workspace-Bootstrap-Dateien.
- `isolatedSession`: wenn true, läuft jeder Heartbeat in einer frischen Sitzung ohne vorherigen Gesprächsverlauf. Verwendet dasselbe Isolationsmuster wie Cron `sessionTarget: "isolated"`. Reduziert die Token-Kosten pro Heartbeat drastisch. Kombinieren Sie es mit `lightContext: true` für maximale Einsparungen. Das Zustellungsrouting verwendet weiterhin den Kontext der Hauptsitzung.
- `session`: optionaler Sitzungsschlüssel für Heartbeat-Läufe.
  - `main` (Standard): Hauptsitzung des Agenten.
  - Expliziter Sitzungsschlüssel (kopieren Sie ihn aus `openclaw sessions --json` oder der [Sessions-CLI](/de/cli/sessions)).
  - Formate der Sitzungsschlüssel: siehe [Sessions](/de/concepts/session) und [Groups](/de/channels/groups).
- `target`:
  - `last`: an den zuletzt verwendeten externen Kanal zustellen.
  - expliziter Kanal: jeder konfigurierte Kanal oder jede Plugin-ID, zum Beispiel `discord`, `matrix`, `telegram` oder `whatsapp`.
  - `none` (Standard): den Heartbeat ausführen, aber **nicht extern zustellen**.
- `directPolicy`: steuert das Verhalten bei direkter/DM-Zustellung:
  - `allow` (Standard): direkte/DM-Heartbeat-Zustellung erlauben.
  - `block`: direkte/DM-Zustellung unterdrücken (`reason=dm-blocked`).
- `to`: optionales Empfänger-Override (kanalspezifische ID, z. B. E.164 für WhatsApp oder eine Telegram-Chat-ID). Für Telegram-Topics/-Threads verwenden Sie `<chatId>:topic:<messageThreadId>`.
- `accountId`: optionale Konto-ID für Kanäle mit mehreren Konten. Wenn `target: "last"` gilt, wird die Konto-ID auf den aufgelösten letzten Kanal angewendet, sofern dieser Konten unterstützt; andernfalls wird sie ignoriert. Wenn die Konto-ID keinem konfigurierten Konto des aufgelösten Kanals entspricht, wird die Zustellung übersprungen.
- `prompt`: überschreibt den Standard-Prompt-Textkörper (wird nicht zusammengeführt).
- `ackMaxChars`: maximal erlaubte Zeichen nach `HEARTBEAT_OK`, bevor zugestellt wird.
- `suppressToolErrorWarnings`: wenn true, werden Payloads für Tool-Fehlerwarnungen während Heartbeat-Läufen unterdrückt.
- `activeHours`: beschränkt Heartbeat-Läufe auf ein Zeitfenster. Objekt mit `start` (HH:MM, inklusiv; `00:00` für Tagesbeginn), `end` (HH:MM exklusiv; `24:00` für Tagesende erlaubt) und optional `timezone`.
  - Weggelassen oder `"user"`: verwendet `agents.defaults.userTimezone`, falls gesetzt, andernfalls die Zeitzone des Host-Systems.
  - `"local"`: verwendet immer die Zeitzone des Host-Systems.
  - Beliebige IANA-Kennung (z. B. `America/New_York`): wird direkt verwendet; falls ungültig, wird auf das oben genannte Verhalten von `"user"` zurückgegriffen.
  - `start` und `end` dürfen für ein aktives Fenster nicht gleich sein; gleiche Werte werden als Nullbreite behandelt (immer außerhalb des Fensters).
  - Außerhalb des aktiven Fensters werden Heartbeats bis zum nächsten Tick innerhalb des Fensters übersprungen.

## Zustellungsverhalten

- Heartbeats laufen standardmäßig in der Hauptsitzung des Agenten (`agent:<id>:<mainKey>`),
  oder `global`, wenn `session.scope = "global"` ist. Setzen Sie `session`, um auf eine
  bestimmte Kanalsitzung (Discord/WhatsApp/etc.) zu überschreiben.
- `session` beeinflusst nur den Laufkontext; die Zustellung wird durch `target` und `to` gesteuert.
- Um an einen bestimmten Kanal/Empfänger zuzustellen, setzen Sie `target` + `to`. Mit
  `target: "last"` verwendet die Zustellung den letzten externen Kanal für diese Sitzung.
- Heartbeat-Zustellungen erlauben standardmäßig direkte/DM-Ziele. Setzen Sie `directPolicy: "block"`, um direkte Zustellungen zu unterdrücken, während der Heartbeat-Turn weiterhin ausgeführt wird.
- Wenn die Hauptwarteschlange beschäftigt ist, wird der Heartbeat übersprungen und später erneut versucht.
- Wenn `target` zu keinem externen Ziel aufgelöst wird, findet der Lauf trotzdem statt, aber es
  wird keine ausgehende Nachricht gesendet.
- Wenn `showOk`, `showAlerts` und `useIndicator` alle deaktiviert sind, wird der Lauf vorab als `reason=alerts-disabled` übersprungen.
- Wenn nur die Zustellung von Warnungen deaktiviert ist, kann OpenClaw den Heartbeat dennoch ausführen, Fälligkeitszeitstempel von Aufgaben aktualisieren, den Idle-Zeitstempel der Sitzung wiederherstellen und die ausgehende Warn-Payload unterdrücken.
- Wenn das aufgelöste Heartbeat-Ziel Tippen unterstützt, zeigt OpenClaw während
  des aktiven Heartbeat-Laufs Tippen an. Dabei wird dasselbe Ziel verwendet, an das
  der Heartbeat Chat-Ausgaben senden würde, und dies wird durch `typingMode: "never"` deaktiviert.
- Antworten nur für Heartbeat halten die Sitzung **nicht** aktiv; das letzte `updatedAt`
  wird wiederhergestellt, sodass Idle-Ablauf normal funktioniert.
- Der Verlauf in Control UI und WebChat blendet Heartbeat-Prompts und reine OK-
  Bestätigungen aus. Das zugrunde liegende Sitzungsprotokoll kann diese
  Turns weiterhin für Audit/Wiedergabe enthalten.
- Entkoppelte [Hintergrundaufgaben](/de/automation/tasks) können ein Systemereignis in die Warteschlange stellen und Heartbeat wecken, wenn die Hauptsitzung etwas schnell bemerken soll. Dieses Wecken macht den Heartbeat-Lauf nicht zu einer Hintergrundaufgabe.

## Sichtbarkeitssteuerung

Standardmäßig werden Bestätigungen mit `HEARTBEAT_OK` unterdrückt, während Warninhalte
zugestellt werden. Sie können dies pro Kanal oder pro Konto anpassen:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # HEARTBEAT_OK ausblenden (Standard)
      showAlerts: true # Warnmeldungen anzeigen (Standard)
      useIndicator: true # Indikatorereignisse ausgeben (Standard)
  telegram:
    heartbeat:
      showOk: true # OK-Bestätigungen in Telegram anzeigen
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # Warnzustellung für dieses Konto unterdrücken
```

Vorrang: pro Konto → pro Kanal → Kanalstandards → eingebaute Standardwerte.

### Was jede Markierung bewirkt

- `showOk`: sendet eine `HEARTBEAT_OK`-Bestätigung, wenn das Modell eine reine OK-Antwort zurückgibt.
- `showAlerts`: sendet den Warninhalt, wenn das Modell eine nicht-OK-Antwort zurückgibt.
- `useIndicator`: gibt Indikatorereignisse für UI-Statusoberflächen aus.

Wenn **alle drei** false sind, überspringt OpenClaw den Heartbeat-Lauf vollständig (kein Modellaufruf).

### Beispiele pro Kanal vs. pro Konto

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false
      showAlerts: true
      useIndicator: true
  slack:
    heartbeat:
      showOk: true # alle Slack-Konten
    accounts:
      ops:
        heartbeat:
          showAlerts: false # Warnungen nur für das ops-Konto unterdrücken
  telegram:
    heartbeat:
      showOk: true
```

### Häufige Muster

| Ziel                                     | Konfiguration                                                                            |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| Standardverhalten (stille OKs, Warnungen an) | _(keine Konfiguration erforderlich)_                                                  |
| Vollständig still (keine Nachrichten, kein Indikator) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Nur Indikator (keine Nachrichten)        | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }` |
| OKs nur in einem Kanal                   | `channels.telegram.heartbeat: { showOk: true }`                                         |

## HEARTBEAT.md (optional)

Wenn im Workspace eine Datei `HEARTBEAT.md` existiert, weist der Standard-Prompt den
Agenten an, sie zu lesen. Stellen Sie sie sich als Ihre „Heartbeat-Checkliste“ vor: klein, stabil und
sicher genug, um sie alle 30 Minuten einzubeziehen.

Bei normalen Läufen wird `HEARTBEAT.md` nur eingefügt, wenn Heartbeat-Anleitung für den
Standard-Agenten aktiviert ist. Wenn Sie die Heartbeat-Frequenz mit `0m` deaktivieren oder
`includeSystemPromptSection: false` setzen, wird sie aus dem normalen Bootstrap-
Kontext weggelassen.

Wenn `HEARTBEAT.md` existiert, aber effektiv leer ist (nur Leerzeilen und Markdown-
Überschriften wie `# Heading`), überspringt OpenClaw den Heartbeat-Lauf, um API-Aufrufe zu sparen.
Dieses Überspringen wird als `reason=empty-heartbeat-file` gemeldet.
Wenn die Datei fehlt, läuft der Heartbeat trotzdem und das Modell entscheidet, was zu tun ist.

Halten Sie sie klein (kurze Checkliste oder Erinnerungen), um Prompt-Aufblähung zu vermeiden.

Beispiel für `HEARTBEAT.md`:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it’s daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### `tasks:`-Blöcke

`HEARTBEAT.md` unterstützt außerdem einen kleinen strukturierten `tasks:`-Block für intervallbasierte
Prüfungen direkt innerhalb von Heartbeat.

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

Verhalten:

- OpenClaw parst den `tasks:`-Block und prüft jede Aufgabe anhand ihres eigenen `interval`.
- Nur **fällige** Aufgaben werden für diesen Tick in den Heartbeat-Prompt aufgenommen.
- Wenn keine Aufgaben fällig sind, wird der Heartbeat vollständig übersprungen (`reason=no-tasks-due`), um keinen Modellaufruf zu verschwenden.
- Inhalt außerhalb der Aufgaben in `HEARTBEAT.md` bleibt erhalten und wird nach der Liste der fälligen Aufgaben als zusätzlicher Kontext angehängt.
- Zeitstempel des letzten Aufgabenlaufs werden im Sitzungszustand (`heartbeatTaskState`) gespeichert, sodass Intervalle normale Neustarts überdauern.
- Aufgabenzeitstempel werden nur dann weitergesetzt, nachdem ein Heartbeat-Lauf seinen normalen Antwortpfad abgeschlossen hat. Übersprungene Läufe wegen `empty-heartbeat-file` / `no-tasks-due` markieren Aufgaben nicht als abgeschlossen.

Der Aufgabenmodus ist nützlich, wenn Sie in einer Heartbeat-Datei mehrere periodische Prüfungen halten möchten, ohne bei jedem Tick für alle zu bezahlen.

### Kann der Agent HEARTBEAT.md aktualisieren?

Ja — wenn Sie ihn darum bitten.

`HEARTBEAT.md` ist einfach eine normale Datei im Agent-Workspace, daher können Sie dem
Agenten (in einem normalen Chat) etwa Folgendes sagen:

- „Aktualisiere `HEARTBEAT.md`, um eine tägliche Kalenderprüfung hinzuzufügen.“
- „Schreibe `HEARTBEAT.md` um, damit sie kürzer ist und sich auf Inbox-Follow-ups konzentriert.“

Wenn Sie möchten, dass dies proaktiv geschieht, können Sie auch eine explizite Zeile in
Ihren Heartbeat-Prompt aufnehmen wie: „Wenn die Checkliste veraltet ist, aktualisiere HEARTBEAT.md
mit einer besseren.“

Sicherheitshinweis: Legen Sie keine Geheimnisse (API-Schlüssel, Telefonnummern, private Tokens) in
`HEARTBEAT.md` ab — sie wird Teil des Prompt-Kontexts.

## Manuelles Wecken (on demand)

Sie können ein Systemereignis in die Warteschlange stellen und mit Folgendem einen sofortigen Heartbeat auslösen:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Wenn mehrere Agenten `heartbeat` konfiguriert haben, führt ein manuelles Wecken jeden dieser
Agenten-Heartbeats sofort aus.

Verwenden Sie `--mode next-heartbeat`, um bis zum nächsten geplanten Tick zu warten.

## Zustellung von Reasoning (optional)

Standardmäßig stellen Heartbeats nur die endgültige „Antwort“-Payload zu.

Wenn Sie Transparenz möchten, aktivieren Sie:

- `agents.defaults.heartbeat.includeReasoning: true`

Wenn dies aktiviert ist, stellen Heartbeats auch eine separate Nachricht mit dem Präfix
`Reasoning:` zu (gleiche Form wie bei `/reasoning on`). Das kann nützlich sein, wenn der Agent
mehrere Sitzungen/Codexe verwaltet und Sie sehen möchten, warum er entschieden hat, Sie anzupingen
— es kann aber auch mehr interne Details preisgeben, als Sie möchten. Lassen Sie es
in Gruppenchats bevorzugt deaktiviert.

## Kostenbewusstsein

Heartbeats führen vollständige Agenten-Turns aus. Kürzere Intervalle verbrauchen mehr Tokens. Zur Kostensenkung:

- Verwenden Sie `isolatedSession: true`, um nicht den vollständigen Gesprächsverlauf zu senden (~100K Tokens auf ~2-5K pro Lauf).
- Verwenden Sie `lightContext: true`, um Bootstrap-Dateien auf nur `HEARTBEAT.md` zu beschränken.
- Setzen Sie ein günstigeres `model` (z. B. `ollama/llama3.2:1b`).
- Halten Sie `HEARTBEAT.md` klein.
- Verwenden Sie `target: "none"`, wenn Sie nur interne Zustandsaktualisierungen möchten.

## Verwandt

- [Automation & Tasks](/de/automation) — alle Automatisierungsmechanismen auf einen Blick
- [Background Tasks](/de/automation/tasks) — wie entkoppelte Arbeit verfolgt wird
- [Timezone](/de/concepts/timezone) — wie die Zeitzone die Heartbeat-Planung beeinflusst
- [Fehlerbehebung](/de/automation/cron-jobs#troubleshooting) — Debugging von Automatisierungsproblemen
