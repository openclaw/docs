---
read_when:
    - Anpassen der Heartbeat-Frequenz oder Nachrichteninhalte
    - Entscheidung zwischen Heartbeat und Cron für geplante Aufgaben
summary: Heartbeat-Polling-Nachrichten und Benachrichtigungsregeln
title: Heartbeat
x-i18n:
    generated_at: "2026-04-11T02:45:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: e4485072148753076d909867a623696829bf4a82dcd0479b95d5d0cae43100b0
    source_path: gateway/heartbeat.md
    workflow: 15
---

# Heartbeat (Gateway)

> **Heartbeat oder Cron?** Unter [Automatisierung & Aufgaben](/de/automation) finden Sie Hinweise dazu, wann was verwendet werden sollte.

Heartbeat führt **periodische Agent-Turns** in der Hauptsitzung aus, damit das Modell alles hervorheben kann, was Aufmerksamkeit braucht, ohne Sie zuzuspammen.

Heartbeat ist ein geplanter Turn in der Hauptsitzung — dabei werden **keine** Einträge für [Hintergrundaufgaben](/de/automation/tasks) erstellt.
Aufgabeneinträge sind für entkoppelte Arbeit gedacht (ACP-Läufe, Subagenten, isolierte Cron-Jobs).

Fehlerbehebung: [Geplante Aufgaben](/de/automation/cron-jobs#troubleshooting)

## Schnellstart (Anfänger)

1. Lassen Sie Heartbeats aktiviert (Standard ist `30m` bzw. `1h` bei Anthropic-OAuth-/Token-Authentifizierung, einschließlich Claude-CLI-Wiederverwendung) oder legen Sie Ihre eigene Frequenz fest.
2. Erstellen Sie eine kleine Checkliste in `HEARTBEAT.md` oder einen `tasks:`-Block im Agent-Workspace (optional, aber empfohlen).
3. Entscheiden Sie, wohin Heartbeat-Nachrichten gesendet werden sollen (`target: "none"` ist der Standard; setzen Sie `target: "last"`, um an den letzten Kontakt zu senden).
4. Optional: Aktivieren Sie die Zustellung von Heartbeat-Reasoning für mehr Transparenz.
5. Optional: Verwenden Sie einen leichtgewichtigen Bootstrap-Kontext, wenn Heartbeat-Läufe nur `HEARTBEAT.md` benötigen.
6. Optional: Aktivieren Sie isolierte Sitzungen, um zu vermeiden, bei jedem Heartbeat den vollständigen Gesprächsverlauf zu senden.
7. Optional: Beschränken Sie Heartbeats auf aktive Stunden (Ortszeit).

Beispielkonfiguration:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // explizite Zustellung an den letzten Kontakt (Standard ist "none")
        directPolicy: "allow", // Standard: direkte/DM-Ziele erlauben; auf "block" setzen, um sie zu unterdrücken
        lightContext: true, // optional: nur HEARTBEAT.md aus Bootstrap-Dateien injizieren
        isolatedSession: true, // optional: bei jedem Lauf frische Sitzung (kein Gesprächsverlauf)
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // optional: zusätzlich separate `Reasoning:`-Nachricht senden
      },
    },
  },
}
```

## Standardwerte

- Intervall: `30m` (oder `1h`, wenn Anthropic-OAuth-/Token-Authentifizierung der erkannte Auth-Modus ist, einschließlich Claude-CLI-Wiederverwendung). Legen Sie `agents.defaults.heartbeat.every` oder pro Agent `agents.list[].heartbeat.every` fest; verwenden Sie `0m`, um zu deaktivieren.
- Prompt-Text (konfigurierbar über `agents.defaults.heartbeat.prompt`):
  `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Der Heartbeat-Prompt wird **unverändert** als Benutzernachricht gesendet. Der System-
  Prompt enthält nur dann einen Abschnitt „Heartbeat“, wenn Heartbeats für den
  Standard-Agenten aktiviert sind und der Lauf intern entsprechend markiert ist.
- Wenn Heartbeats mit `0m` deaktiviert sind, lassen normale Läufe `HEARTBEAT.md`
  ebenfalls aus dem Bootstrap-Kontext weg, damit das Modell keine nur für Heartbeats gedachten Anweisungen sieht.
- Aktive Stunden (`heartbeat.activeHours`) werden in der konfigurierten Zeitzone geprüft.
  Außerhalb des Fensters werden Heartbeats bis zum nächsten Tick innerhalb des Fensters übersprungen.

## Wofür der Heartbeat-Prompt gedacht ist

Der Standard-Prompt ist absichtlich breit formuliert:

- **Hintergrundaufgaben**: „Consider outstanding tasks“ stößt den Agenten dazu an,
  offene Nachverfolgungen (Posteingang, Kalender, Erinnerungen, wartende Arbeit) zu prüfen und alles Dringende hervorzuheben.
- **Check-in beim Menschen**: „Checkup sometimes on your human during day time“ stößt
  gelegentliche leichtgewichtige Nachrichten wie „Brauchst du etwas?“ an, vermeidet aber nächtlichen Spam durch Verwendung Ihrer konfigurierten lokalen Zeitzone (siehe [/concepts/timezone](/de/concepts/timezone)).

Heartbeat kann auf abgeschlossene [Hintergrundaufgaben](/de/automation/tasks) reagieren, aber ein Heartbeat-Lauf selbst erstellt keinen Aufgabeneintrag.

Wenn ein Heartbeat etwas sehr Spezifisches tun soll (z. B. „check Gmail PubSub
stats“ oder „verify gateway health“), setzen Sie `agents.defaults.heartbeat.prompt` (oder
`agents.list[].heartbeat.prompt`) auf einen benutzerdefinierten Textkörper (wird unverändert gesendet).

## Antwortvertrag

- Wenn nichts Aufmerksamkeit braucht, antworten Sie mit **`HEARTBEAT_OK`**.
- Während Heartbeat-Läufen behandelt OpenClaw `HEARTBEAT_OK` als Bestätigung, wenn es
  am **Anfang oder Ende** der Antwort erscheint. Das Token wird entfernt und die Antwort
  verworfen, wenn der verbleibende Inhalt **≤ `ackMaxChars`** ist (Standard: 300).
- Wenn `HEARTBEAT_OK` in der **Mitte** einer Antwort erscheint, wird es nicht besonders behandelt.
- Für Warnungen **kein** `HEARTBEAT_OK` einschließen; geben Sie nur den Warntext zurück.

Außerhalb von Heartbeats wird ein versehentliches `HEARTBEAT_OK` am Anfang/Ende einer Nachricht entfernt
und protokolliert; eine Nachricht, die nur aus `HEARTBEAT_OK` besteht, wird verworfen.

## Konfiguration

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // Standard: 30m (0m deaktiviert)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // Standard: false (separate Reasoning:-Nachricht senden, wenn verfügbar)
        lightContext: false, // Standard: false; true behält nur HEARTBEAT.md aus Workspace-Bootstrap-Dateien
        isolatedSession: false, // Standard: false; true führt jeden Heartbeat in einer frischen Sitzung aus (kein Gesprächsverlauf)
        target: "last", // Standard: none | Optionen: last | none | <channel id> (Core oder Plugin, z. B. "bluebubbles")
        to: "+15551234567", // optionaler kanalspezifischer Override
        accountId: "ops-bot", // optionale Kanal-ID für Multi-Account-Kanäle
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // maximale Anzahl von Zeichen nach HEARTBEAT_OK
      },
    },
  },
}
```

### Geltungsbereich und Priorität

- `agents.defaults.heartbeat` legt das globale Heartbeat-Verhalten fest.
- `agents.list[].heartbeat` wird darübergelegt; wenn irgendein Agent einen `heartbeat`-Block hat, führen **nur diese Agenten** Heartbeats aus.
- `channels.defaults.heartbeat` legt Sichtbarkeitsstandards für alle Kanäle fest.
- `channels.<channel>.heartbeat` überschreibt die Kanalstandards.
- `channels.<channel>.accounts.<id>.heartbeat` (Multi-Account-Kanäle) überschreibt pro Kanal die Einstellungen.

### Heartbeats pro Agent

Wenn irgendein Eintrag in `agents.list[]` einen `heartbeat`-Block enthält, führen **nur diese Agenten**
Heartbeats aus. Der Block pro Agent wird über `agents.defaults.heartbeat`
gelegt (so können gemeinsame Standardwerte einmal gesetzt und pro Agent überschrieben werden).

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
          timezone: "America/New_York", // optional; verwendet Ihre userTimezone, falls gesetzt, andernfalls die Zeitzone des Hosts
        },
      },
    },
  },
}
```

Außerhalb dieses Fensters (vor 9 Uhr oder nach 22 Uhr Eastern Time) werden Heartbeats übersprungen. Der nächste geplante Tick innerhalb des Fensters läuft normal.

### 24/7-Setup

Wenn Heartbeats den ganzen Tag laufen sollen, verwenden Sie eines dieser Muster:

- Lassen Sie `activeHours` ganz weg (keine Einschränkung auf ein Zeitfenster; das ist das Standardverhalten).
- Setzen Sie ein ganztägiges Fenster: `activeHours: { start: "00:00", end: "24:00" }`.

Setzen Sie nicht dieselbe Uhrzeit für `start` und `end` (zum Beispiel `08:00` bis `08:00`).
Das wird als Fenster mit Breite null behandelt, daher werden Heartbeats immer übersprungen.

### Beispiel für Multi-Account

Verwenden Sie `accountId`, um bei Multi-Account-Kanälen wie Telegram ein bestimmtes Konto anzusprechen:

```json5
{
  agents: {
    list: [
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "telegram",
          to: "12345678:topic:42", // optional: an ein bestimmtes Topic/einen bestimmten Thread senden
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

### Hinweise zu den Feldern

- `every`: Heartbeat-Intervall (Dauerstring; Standard-Einheit = Minuten).
- `model`: optionaler Modell-Override für Heartbeat-Läufe (`provider/model`).
- `includeReasoning`: wenn aktiviert, wird auch die separate `Reasoning:`-Nachricht zugestellt, sofern verfügbar.
- `lightContext`: wenn `true`, verwenden Heartbeat-Läufe einen leichtgewichtigen Bootstrap-Kontext und behalten aus den Workspace-Bootstrap-Dateien nur `HEARTBEAT.md`.
- `isolatedSession`: wenn `true`, läuft jeder Heartbeat in einer frischen Sitzung ohne vorherigen Gesprächsverlauf. Verwendet dasselbe Isolationsmuster wie Cron mit `sessionTarget: "isolated"`. Reduziert die Token-Kosten pro Heartbeat erheblich. Für maximale Einsparungen mit `lightContext: true` kombinieren. Das Zustellungsrouting nutzt weiterhin den Kontext der Hauptsitzung.
- `session`: optionaler Sitzungsschlüssel für Heartbeat-Läufe.
  - `main` (Standard): Hauptsitzung des Agenten.
  - expliziter Sitzungsschlüssel (kopieren aus `openclaw sessions --json` oder der [sessions CLI](/cli/sessions)).
  - Formate von Sitzungsschlüsseln: siehe [Sessions](/de/concepts/session) und [Groups](/de/channels/groups).
- `target`:
  - `last`: an den zuletzt verwendeten externen Kanal zustellen.
  - expliziter Kanal: jeder konfigurierte Kanal oder jede Plugin-ID, zum Beispiel `discord`, `matrix`, `telegram` oder `whatsapp`.
  - `none` (Standard): den Heartbeat ausführen, aber **nicht** extern zustellen.
- `directPolicy`: steuert das Verhalten für direkte/DM-Zustellung:
  - `allow` (Standard): direkte/DM-Heartbeat-Zustellung erlauben.
  - `block`: direkte/DM-Zustellung unterdrücken (`reason=dm-blocked`).
- `to`: optionaler Empfänger-Override (kanalspezifische ID, z. B. E.164 für WhatsApp oder eine Telegram-Chat-ID). Für Telegram-Topics/-Threads verwenden Sie `<chatId>:topic:<messageThreadId>`.
- `accountId`: optionale Konto-ID für Multi-Account-Kanäle. Bei `target: "last"` gilt die Konto-ID für den aufgelösten letzten Kanal, falls dieser Konten unterstützt; andernfalls wird sie ignoriert. Wenn die Konto-ID nicht zu einem konfigurierten Konto für den aufgelösten Kanal passt, wird die Zustellung übersprungen.
- `prompt`: überschreibt den Standard-Prompt-Text (wird nicht zusammengeführt).
- `ackMaxChars`: maximale Anzahl von Zeichen nach `HEARTBEAT_OK`, bevor zugestellt wird.
- `suppressToolErrorWarnings`: wenn `true`, werden Warn-Payloads für Tool-Fehler während Heartbeat-Läufen unterdrückt.
- `activeHours`: beschränkt Heartbeat-Läufe auf ein Zeitfenster. Objekt mit `start` (HH:MM, inklusive; verwenden Sie `00:00` für Tagesbeginn), `end` (HH:MM, exklusiv; `24:00` ist für Tagesende erlaubt) und optional `timezone`.
  - Weggelassen oder `"user"`: verwendet Ihre `agents.defaults.userTimezone`, falls gesetzt, andernfalls die Zeitzone des Host-Systems.
  - `"local"`: verwendet immer die Zeitzone des Host-Systems.
  - Beliebiger IANA-Bezeichner (z. B. `America/New_York`): wird direkt verwendet; falls ungültig, wird auf das oben beschriebene `"user"`-Verhalten zurückgegriffen.
  - `start` und `end` dürfen für ein aktives Fenster nicht gleich sein; gleiche Werte werden als Fenster mit Breite null behandelt (immer außerhalb des Fensters).
  - Außerhalb des aktiven Fensters werden Heartbeats bis zum nächsten Tick innerhalb des Fensters übersprungen.

## Zustellungsverhalten

- Heartbeats laufen standardmäßig in der Hauptsitzung des Agenten (`agent:<id>:<mainKey>`),
  oder in `global`, wenn `session.scope = "global"` ist. Setzen Sie `session`, um auf eine
  bestimmte Kanalsitzung (Discord/WhatsApp/etc.) umzuschalten.
- `session` wirkt sich nur auf den Laufkontext aus; die Zustellung wird durch `target` und `to` gesteuert.
- Um an einen bestimmten Kanal/Empfänger zuzustellen, setzen Sie `target` + `to`. Mit
  `target: "last"` verwendet die Zustellung den zuletzt verwendeten externen Kanal für diese Sitzung.
- Heartbeat-Zustellungen erlauben standardmäßig direkte/DM-Ziele. Setzen Sie `directPolicy: "block"`, um direkte Ziele zu unterdrücken und den Heartbeat-Turn trotzdem auszuführen.
- Wenn die Hauptwarteschlange ausgelastet ist, wird der Heartbeat übersprungen und später erneut versucht.
- Wenn `target` zu keinem externen Ziel aufgelöst wird, findet der Lauf trotzdem statt, aber es wird
  keine ausgehende Nachricht gesendet.
- Wenn `showOk`, `showAlerts` und `useIndicator` alle deaktiviert sind, wird der Lauf vorab als `reason=alerts-disabled` übersprungen.
- Wenn nur die Alarmzustellung deaktiviert ist, kann OpenClaw den Heartbeat trotzdem ausführen, Zeitstempel fälliger Aufgaben aktualisieren, den Leerlauf-Zeitstempel der Sitzung wiederherstellen und die ausgehende Alarm-Payload unterdrücken.
- Reine Heartbeat-Antworten halten die Sitzung **nicht** aktiv; der letzte `updatedAt`-
  Wert wird wiederhergestellt, sodass das Idle-Ablaufverhalten normal bleibt.
- Entkoppelte [Hintergrundaufgaben](/de/automation/tasks) können ein Systemereignis in die Warteschlange stellen und Heartbeat aufwecken, wenn die Hauptsitzung etwas schnell bemerken soll. Dieses Aufwecken macht den Heartbeat-Lauf nicht zu einer Hintergrundaufgabe.

## Sichtbarkeitssteuerung

Standardmäßig werden `HEARTBEAT_OK`-Bestätigungen unterdrückt, während Alarminhalt
zugestellt wird. Sie können das pro Kanal oder pro Konto anpassen:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # HEARTBEAT_OK ausblenden (Standard)
      showAlerts: true # Alarmnachrichten anzeigen (Standard)
      useIndicator: true # Indikatorereignisse ausgeben (Standard)
  telegram:
    heartbeat:
      showOk: true # OK-Bestätigungen auf Telegram anzeigen
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # Alarmzustellung für dieses Konto unterdrücken
```

Priorität: pro Konto → pro Kanal → Kanalstandards → eingebaute Standardwerte.

### Was die einzelnen Flags bewirken

- `showOk`: sendet eine `HEARTBEAT_OK`-Bestätigung, wenn das Modell eine reine OK-Antwort zurückgibt.
- `showAlerts`: sendet den Alarminhalt, wenn das Modell eine Nicht-OK-Antwort zurückgibt.
- `useIndicator`: gibt Indikatorereignisse für UI-Statusoberflächen aus.

Wenn **alle drei** `false` sind, überspringt OpenClaw den Heartbeat-Lauf vollständig (kein Modellaufruf).

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
          showAlerts: false # Alarme nur für das ops-Konto unterdrücken
  telegram:
    heartbeat:
      showOk: true
```

### Häufige Muster

| Ziel | Konfiguration |
| ---- | ------------- |
| Standardverhalten (stille OKs, Alarme an) | _(keine Konfiguration nötig)_ |
| Vollständig still (keine Nachrichten, kein Indikator) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Nur Indikator (keine Nachrichten) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }` |
| OKs nur in einem Kanal | `channels.telegram.heartbeat: { showOk: true }` |

## HEARTBEAT.md (optional)

Wenn im Workspace eine Datei `HEARTBEAT.md` existiert, weist der Standard-Prompt den
Agenten an, sie zu lesen. Betrachten Sie sie als Ihre „Heartbeat-Checkliste“: klein, stabil und
sicher genug, um sie alle 30 Minuten einzubinden.

Bei normalen Läufen wird `HEARTBEAT.md` nur eingebunden, wenn Heartbeat-Anleitung
für den Standard-Agenten aktiviert ist. Das Deaktivieren der Heartbeat-Frequenz mit `0m` oder
das Setzen von `includeSystemPromptSection: false` entfernt sie aus dem normalen Bootstrap-
Kontext.

Wenn `HEARTBEAT.md` existiert, aber praktisch leer ist (nur Leerzeilen und Markdown-
Überschriften wie `# Heading`), überspringt OpenClaw den Heartbeat-Lauf, um API-Aufrufe zu sparen.
Dieses Überspringen wird als `reason=empty-heartbeat-file` gemeldet.
Wenn die Datei fehlt, läuft der Heartbeat trotzdem, und das Modell entscheidet, was zu tun ist.

Halten Sie sie klein (kurze Checkliste oder Erinnerungen), um Prompt-Bloat zu vermeiden.

Beispiel für `HEARTBEAT.md`:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it’s daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### `tasks:`-Blöcke

`HEARTBEAT.md` unterstützt außerdem einen kleinen strukturierten `tasks:`-Block für
intervallbasierte Prüfungen innerhalb von Heartbeat selbst.

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
- Wenn keine Aufgaben fällig sind, wird der Heartbeat vollständig übersprungen (`reason=no-tasks-due`), um einen unnötigen Modellaufruf zu vermeiden.
- Nicht aufgabenbezogener Inhalt in `HEARTBEAT.md` bleibt erhalten und wird nach der Liste der fälligen Aufgaben als zusätzlicher Kontext angehängt.
- Zeitstempel des letzten Laufs von Aufgaben werden im Sitzungsstatus (`heartbeatTaskState`) gespeichert, sodass Intervalle normale Neustarts überstehen.
- Aufgabenzeitstempel werden erst aktualisiert, nachdem ein Heartbeat-Lauf seinen normalen Antwortpfad abgeschlossen hat. Übersprungene Läufe mit `empty-heartbeat-file` / `no-tasks-due` markieren Aufgaben nicht als abgeschlossen.

Der Aufgabenmodus ist nützlich, wenn Sie möchten, dass eine Heartbeat-Datei mehrere periodische Prüfungen enthält, ohne bei jedem Tick für alle zu zahlen.

### Kann der Agent `HEARTBEAT.md` aktualisieren?

Ja — wenn Sie ihn dazu auffordern.

`HEARTBEAT.md` ist einfach eine normale Datei im Agent-Workspace, daher können Sie dem
Agenten (in einem normalen Chat) zum Beispiel Folgendes sagen:

- „Aktualisiere `HEARTBEAT.md`, um eine tägliche Kalenderprüfung hinzuzufügen.“
- „Schreibe `HEARTBEAT.md` so um, dass sie kürzer ist und sich auf Inbox-Nachverfolgungen konzentriert.“

Wenn Sie möchten, dass das proaktiv geschieht, können Sie auch eine explizite Zeile in
Ihren Heartbeat-Prompt aufnehmen, zum Beispiel: „If the checklist becomes stale, update HEARTBEAT.md
with a better one.“

Sicherheitshinweis: Schreiben Sie keine Geheimnisse (API-Schlüssel, Telefonnummern, private Tokens) in
`HEARTBEAT.md` — sie wird Teil des Prompt-Kontexts.

## Manuelles Aufwecken (on-demand)

Sie können ein Systemereignis in die Warteschlange stellen und einen sofortigen Heartbeat auslösen mit:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Wenn mehrere Agenten `heartbeat` konfiguriert haben, führt ein manuelles Aufwecken Heartbeats für jeden dieser
Agenten sofort aus.

Verwenden Sie `--mode next-heartbeat`, um bis zum nächsten geplanten Tick zu warten.

## Zustellung von Reasoning (optional)

Standardmäßig stellen Heartbeats nur die finale „Antwort“-Payload zu.

Wenn Sie Transparenz möchten, aktivieren Sie:

- `agents.defaults.heartbeat.includeReasoning: true`

Wenn aktiviert, stellen Heartbeats zusätzlich eine separate Nachricht mit dem Präfix
`Reasoning:` zu (dieselbe Form wie bei `/reasoning on`). Das kann nützlich sein, wenn der Agent
mehrere Sitzungen/Codexes verwaltet und Sie sehen möchten, warum er sich entschieden hat, Sie anzupingen —
es kann aber auch mehr interne Details preisgeben, als Sie möchten. Lassen Sie es in Gruppenchats
nach Möglichkeit deaktiviert.

## Kostenbewusstsein

Heartbeats führen vollständige Agent-Turns aus. Kürzere Intervalle verbrauchen mehr Tokens. So reduzieren Sie die Kosten:

- Verwenden Sie `isolatedSession: true`, um das Senden des vollständigen Gesprächsverlaufs zu vermeiden (~100K Tokens auf ~2-5K pro Lauf).
- Verwenden Sie `lightContext: true`, um Bootstrap-Dateien nur auf `HEARTBEAT.md` zu beschränken.
- Setzen Sie ein günstigeres `model` (z. B. `ollama/llama3.2:1b`).
- Halten Sie `HEARTBEAT.md` klein.
- Verwenden Sie `target: "none"`, wenn Sie nur interne Statusaktualisierungen möchten.

## Verwandt

- [Automatisierung & Aufgaben](/de/automation) — alle Automatisierungsmechanismen auf einen Blick
- [Hintergrundaufgaben](/de/automation/tasks) — wie entkoppelte Arbeit nachverfolgt wird
- [Zeitzone](/de/concepts/timezone) — wie die Zeitzone die Heartbeat-Planung beeinflusst
- [Fehlerbehebung](/de/automation/cron-jobs#troubleshooting) — Debugging von Automatisierungsproblemen
