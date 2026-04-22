---
read_when:
    - Anpassen der Heartbeat-Frequenz oder der Nachrichtenübermittlung
    - Entscheidung zwischen Heartbeat und Cron für geplante Aufgaben
summary: Heartbeat-Abfragemeldungen und Benachrichtigungsregeln
title: Heartbeat
x-i18n:
    generated_at: "2026-04-22T06:22:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 13004e4e20b02b08aaf16f22cdf664d0b59da69446ecb30453db51ffdfd1d267
    source_path: gateway/heartbeat.md
    workflow: 15
---

# Heartbeat (Gateway)

> **Heartbeat oder Cron?** Siehe [Automatisierung & Aufgaben](/de/automation) für Hinweise dazu, wann welches verwendet werden sollte.

Heartbeat führt **periodische Agent-Durchläufe** in der Hauptsitzung aus, damit das Modell alles hervorheben kann, was Aufmerksamkeit benötigt, ohne dich zuzuspammen.

Heartbeat ist ein geplanter Durchlauf der Hauptsitzung — dabei werden **keine** Datensätze für [Hintergrundaufgaben](/de/automation/tasks) erstellt.
Aufgabendatensätze sind für entkoppelte Arbeit gedacht (ACP-Läufe, Subagents, isolierte Cron-Jobs).

Fehlerbehebung: [Geplante Aufgaben](/de/automation/cron-jobs#troubleshooting)

## Schnellstart (für Einsteiger)

1. Lass Heartbeats aktiviert (Standard ist `30m`, oder `1h` bei Anthropic OAuth-/Token-Authentifizierung, einschließlich Claude CLI-Wiederverwendung) oder lege deine eigene Frequenz fest.
2. Erstelle eine kleine Checkliste in `HEARTBEAT.md` oder einen `tasks:`-Block im Agent-Workspace (optional, aber empfohlen).
3. Entscheide, wohin Heartbeat-Nachrichten gesendet werden sollen (`target: "none"` ist der Standard; setze `target: "last"`, um an den letzten Kontakt zu senden).
4. Optional: Aktiviere die Zustellung von Heartbeat-Reasoning für mehr Transparenz.
5. Optional: Verwende einen schlanken Bootstrap-Kontext, wenn Heartbeat-Läufe nur `HEARTBEAT.md` benötigen.
6. Optional: Aktiviere isolierte Sitzungen, damit nicht bei jedem Heartbeat der vollständige Gesprächsverlauf gesendet wird.
7. Optional: Beschränke Heartbeats auf aktive Stunden (Ortszeit).

Beispielkonfiguration:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // explizite Zustellung an den letzten Kontakt (Standard ist "none")
        directPolicy: "allow", // Standard: direkte/DM-Ziele erlauben; auf "block" setzen, um sie zu unterdrücken
        lightContext: true, // optional: nur HEARTBEAT.md aus den Bootstrap-Dateien injizieren
        isolatedSession: true, // optional: neue Sitzung bei jedem Lauf (kein Gesprächsverlauf)
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // optional: auch separate `Reasoning:`-Nachricht senden
      },
    },
  },
}
```

## Standardwerte

- Intervall: `30m` (oder `1h`, wenn Anthropic OAuth-/Token-Authentifizierung der erkannte Authentifizierungsmodus ist, einschließlich Claude CLI-Wiederverwendung). Setze `agents.defaults.heartbeat.every` oder pro Agent `agents.list[].heartbeat.every`; verwende `0m`, um Heartbeat zu deaktivieren.
- Prompt-Text (konfigurierbar über `agents.defaults.heartbeat.prompt`):
  `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Der Heartbeat-Prompt wird **wörtlich** als Benutzernachricht gesendet. Der System-
  Prompt enthält nur dann einen Abschnitt „Heartbeat“, wenn Heartbeats für den
  Standard-Agent aktiviert sind und der Lauf intern entsprechend markiert ist.
- Wenn Heartbeats mit `0m` deaktiviert sind, lassen normale Läufe auch `HEARTBEAT.md`
  aus dem Bootstrap-Kontext weg, damit das Modell keine nur für Heartbeat bestimmten Anweisungen sieht.
- Aktive Stunden (`heartbeat.activeHours`) werden in der konfigurierten Zeitzone geprüft.
  Außerhalb des Zeitfensters werden Heartbeats bis zum nächsten Tick innerhalb des Fensters übersprungen.

## Wofür der Heartbeat-Prompt gedacht ist

Der Standard-Prompt ist absichtlich allgemein gehalten:

- **Hintergrundaufgaben**: „Consider outstanding tasks“ veranlasst den Agenten dazu,
  offene Nachverfolgungen (Posteingang, Kalender, Erinnerungen, anstehende Arbeit) zu prüfen
  und alles Dringende hervorzuheben.
- **Check-in beim Menschen**: „Checkup sometimes on your human during day time“ veranlasst eine
  gelegentliche, leichte Nachricht wie „Brauchst du etwas?“, vermeidet aber nächtlichen Spam,
  indem deine konfigurierte lokale Zeitzone verwendet wird (siehe [/concepts/timezone](/de/concepts/timezone)).

Heartbeat kann auf abgeschlossene [Hintergrundaufgaben](/de/automation/tasks) reagieren, aber ein Heartbeat-Lauf selbst erstellt keinen Aufgabendatensatz.

Wenn ein Heartbeat etwas sehr Spezifisches tun soll (z. B. „Gmail-PubSub-Statistiken prüfen“
oder „Gateway-Status verifizieren“), setze `agents.defaults.heartbeat.prompt` (oder
`agents.list[].heartbeat.prompt`) auf einen benutzerdefinierten Text (wird wörtlich gesendet).

## Antwortvertrag

- Wenn nichts Aufmerksamkeit benötigt, antworte mit **`HEARTBEAT_OK`**.
- Während Heartbeat-Läufen behandelt OpenClaw `HEARTBEAT_OK` als Bestätigung, wenn es
  am **Anfang oder Ende** der Antwort erscheint. Das Token wird entfernt und die Antwort wird
  verworfen, wenn der verbleibende Inhalt **≤ `ackMaxChars`** ist (Standard: 300).
- Wenn `HEARTBEAT_OK` in der **Mitte** einer Antwort erscheint, wird es nicht
  speziell behandelt.
- Bei Warnmeldungen **`HEARTBEAT_OK` nicht** einschließen; gib nur den Warntext zurück.

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
        includeReasoning: false, // Standard: false (separate Reasoning:-Nachricht zustellen, wenn verfügbar)
        lightContext: false, // Standard: false; true behält nur HEARTBEAT.md aus den Workspace-Bootstrap-Dateien
        isolatedSession: false, // Standard: false; true führt jeden Heartbeat in einer neuen Sitzung aus (kein Gesprächsverlauf)
        target: "last", // Standard: none | Optionen: last | none | <channel id> (Core oder Plugin, z. B. "bluebubbles")
        to: "+15551234567", // optionaler kanalspezifischer Override
        accountId: "ops-bot", // optionale Multi-Account-Kanal-ID
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // maximal zulässige Zeichen nach HEARTBEAT_OK
      },
    },
  },
}
```

### Geltungsbereich und Vorrang

- `agents.defaults.heartbeat` legt das globale Heartbeat-Verhalten fest.
- `agents.list[].heartbeat` wird darüber zusammengeführt; wenn irgendein Agent einen `heartbeat`-Block hat, führen **nur diese Agents** Heartbeats aus.
- `channels.defaults.heartbeat` legt Standards für die Sichtbarkeit auf allen Channels fest.
- `channels.<channel>.heartbeat` überschreibt die Channel-Standards.
- `channels.<channel>.accounts.<id>.heartbeat` (bei Multi-Account-Channels) überschreibt die Einstellungen pro Channel.

### Heartbeats pro Agent

Wenn ein Eintrag in `agents.list[]` einen `heartbeat`-Block enthält, führen **nur diese Agents**
Heartbeats aus. Der Block pro Agent wird über `agents.defaults.heartbeat`
zusammengeführt (damit du gemeinsame Standardwerte einmal festlegen und pro Agent überschreiben kannst).

Beispiel: zwei Agents, nur der zweite Agent führt Heartbeats aus.

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

Beschränke Heartbeats auf Geschäftszeiten in einer bestimmten Zeitzone:

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
          timezone: "America/New_York", // optional; verwendet deine userTimezone, falls gesetzt, sonst die Host-Zeitzone
        },
      },
    },
  },
}
```

Außerhalb dieses Fensters (vor 9 Uhr oder nach 22 Uhr Eastern Time) werden Heartbeats übersprungen. Der nächste geplante Tick innerhalb des Fensters läuft normal.

### 24/7-Einrichtung

Wenn Heartbeats den ganzen Tag laufen sollen, verwende eines dieser Muster:

- `activeHours` ganz weglassen (keine Einschränkung auf ein Zeitfenster; das ist das Standardverhalten).
- Ein ganztägiges Fenster setzen: `activeHours: { start: "00:00", end: "24:00" }`.

Setze nicht dieselbe Zeit für `start` und `end` (zum Beispiel `08:00` bis `08:00`).
Das wird als Zeitfenster mit Nullbreite behandelt, daher werden Heartbeats immer übersprungen.

### Multi-Account-Beispiel

Verwende `accountId`, um ein bestimmtes Konto auf Multi-Account-Channels wie Telegram anzusprechen:

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

- `every`: Heartbeat-Intervall (Dauer-String; Standardeinheit = Minuten).
- `model`: optionales Modell-Override für Heartbeat-Läufe (`provider/model`).
- `includeReasoning`: wenn aktiviert, wird zusätzlich die separate `Reasoning:`-Nachricht zugestellt, sofern verfügbar (gleiche Form wie bei `/reasoning on`).
- `lightContext`: wenn auf true gesetzt, verwenden Heartbeat-Läufe einen schlanken Bootstrap-Kontext und behalten nur `HEARTBEAT.md` aus den Workspace-Bootstrap-Dateien.
- `isolatedSession`: wenn auf true gesetzt, läuft jeder Heartbeat in einer neuen Sitzung ohne vorherigen Gesprächsverlauf. Verwendet dasselbe Isolationsmuster wie Cron `sessionTarget: "isolated"`. Reduziert die Token-Kosten pro Heartbeat drastisch. Für maximale Einsparungen mit `lightContext: true` kombinieren. Das Zustellungsrouting verwendet weiterhin den Kontext der Hauptsitzung.
- `session`: optionaler Sitzungsschlüssel für Heartbeat-Läufe.
  - `main` (Standard): Hauptsitzung des Agenten.
  - Expliziter Sitzungsschlüssel (kopieren aus `openclaw sessions --json` oder der [Sessions-CLI](/cli/sessions)).
  - Formate für Sitzungsschlüssel: siehe [Sitzungen](/de/concepts/session) und [Gruppen](/de/channels/groups).
- `target`:
  - `last`: an den zuletzt verwendeten externen Channel zustellen.
  - expliziter Channel: jede konfigurierte Channel- oder Plugin-ID, zum Beispiel `discord`, `matrix`, `telegram` oder `whatsapp`.
  - `none` (Standard): Heartbeat ausführen, aber **nicht** extern zustellen.
- `directPolicy`: steuert das Zustellungsverhalten für direkte Nachrichten/DMs:
  - `allow` (Standard): direkte/DM-Heartbeat-Zustellung erlauben.
  - `block`: direkte/DM-Zustellung unterdrücken (`reason=dm-blocked`).
- `to`: optionale Empfängerüberschreibung (kanalspezifische ID, z. B. E.164 für WhatsApp oder eine Telegram-Chat-ID). Für Telegram-Topics/Threads verwende `<chatId>:topic:<messageThreadId>`.
- `accountId`: optionale Konto-ID für Multi-Account-Channels. Bei `target: "last"` wird die Konto-ID auf den ermittelten letzten Channel angewendet, wenn dieser Konten unterstützt; andernfalls wird sie ignoriert. Wenn die Konto-ID nicht zu einem konfigurierten Konto für den ermittelten Channel passt, wird die Zustellung übersprungen.
- `prompt`: überschreibt den Standard-Prompt-Text (wird nicht zusammengeführt).
- `ackMaxChars`: maximal zulässige Zeichen nach `HEARTBEAT_OK`, bevor zugestellt wird.
- `suppressToolErrorWarnings`: wenn auf true gesetzt, werden Warn-Payloads für Tool-Fehler während Heartbeat-Läufen unterdrückt.
- `activeHours`: beschränkt Heartbeat-Läufe auf ein Zeitfenster. Objekt mit `start` (HH:MM, inklusive; verwende `00:00` für Tagesbeginn), `end` (HH:MM exklusiv; `24:00` ist als Tagesende erlaubt) und optional `timezone`.
  - Weggelassen oder `"user"`: verwendet deine `agents.defaults.userTimezone`, falls gesetzt, andernfalls die Zeitzone des Host-Systems.
  - `"local"`: verwendet immer die Zeitzone des Host-Systems.
  - Beliebiger IANA-Bezeichner (z. B. `America/New_York`): wird direkt verwendet; falls ungültig, wird auf das oben beschriebene Verhalten von `"user"` zurückgegriffen.
  - `start` und `end` dürfen für ein aktives Fenster nicht gleich sein; gleiche Werte werden als Nullbreite behandelt (immer außerhalb des Fensters).
  - Außerhalb des aktiven Fensters werden Heartbeats bis zum nächsten Tick innerhalb des Fensters übersprungen.

## Zustellungsverhalten

- Heartbeats werden standardmäßig in der Hauptsitzung des Agenten ausgeführt (`agent:<id>:<mainKey>`),
  oder in `global`, wenn `session.scope = "global"` gesetzt ist. Setze `session`, um
  auf eine bestimmte Channel-Sitzung zu überschreiben (Discord/WhatsApp/etc.).
- `session` beeinflusst nur den Ausführungskontext; die Zustellung wird durch `target` und `to` gesteuert.
- Um an einen bestimmten Channel/Empfänger zuzustellen, setze `target` + `to`. Mit
  `target: "last"` verwendet die Zustellung den letzten externen Channel für diese Sitzung.
- Heartbeat-Zustellungen erlauben standardmäßig direkte/DM-Ziele. Setze `directPolicy: "block"`, um Zustellungen an direkte Ziele zu unterdrücken, während der Heartbeat-Durchlauf weiterhin ausgeführt wird.
- Wenn die Hauptwarteschlange beschäftigt ist, wird der Heartbeat übersprungen und später erneut versucht.
- Wenn `target` zu keinem externen Ziel aufgelöst wird, findet der Lauf trotzdem statt, aber es
  wird keine ausgehende Nachricht gesendet.
- Wenn `showOk`, `showAlerts` und `useIndicator` alle deaktiviert sind, wird der Lauf vorab als `reason=alerts-disabled` übersprungen.
- Wenn nur die Zustellung von Warnmeldungen deaktiviert ist, kann OpenClaw den Heartbeat trotzdem ausführen, Zeitstempel fälliger Aufgaben aktualisieren, den Leerlauf-Zeitstempel der Sitzung wiederherstellen und die externe Warn-Payload unterdrücken.
- Wenn das aufgelöste Heartbeat-Ziel Tippindikatoren unterstützt, zeigt OpenClaw während
  des aktiven Heartbeat-Laufs einen Tippindikator an. Dabei wird dasselbe Ziel verwendet, an das der Heartbeat
  Chat-Ausgaben senden würde, und dies wird durch `typingMode: "never"` deaktiviert.
- Heartbeat-only-Antworten halten die Sitzung **nicht** aktiv; das letzte `updatedAt`
  wird wiederhergestellt, sodass das Leerlauf-Timeout sich normal verhält.
- Entkoppelte [Hintergrundaufgaben](/de/automation/tasks) können ein Systemereignis in die Warteschlange stellen und Heartbeat wecken, wenn die Hauptsitzung etwas schnell bemerken soll. Dieses Wecken macht den Heartbeat-Lauf nicht zu einer Hintergrundaufgabe.

## Sichtbarkeitssteuerung

Standardmäßig werden Bestätigungen mit `HEARTBEAT_OK` unterdrückt, während Warninhalt
zugestellt wird. Du kannst dies pro Channel oder pro Konto anpassen:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # HEARTBEAT_OK ausblenden (Standard)
      showAlerts: true # Warnmeldungen anzeigen (Standard)
      useIndicator: true # Indikatorereignisse ausgeben (Standard)
  telegram:
    heartbeat:
      showOk: true # OK-Bestätigungen auf Telegram anzeigen
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # Warnzustellung für dieses Konto unterdrücken
```

Vorrang: pro Konto → pro Channel → Channel-Standardwerte → integrierte Standardwerte.

### Was jede Option bewirkt

- `showOk`: sendet eine Bestätigung mit `HEARTBEAT_OK`, wenn das Modell eine reine OK-Antwort zurückgibt.
- `showAlerts`: sendet den Warninhalt, wenn das Modell eine Nicht-OK-Antwort zurückgibt.
- `useIndicator`: gibt Indikatorereignisse für UI-Statusoberflächen aus.

Wenn **alle drei** auf false gesetzt sind, überspringt OpenClaw den Heartbeat-Lauf vollständig (kein Modellaufruf).

### Beispiele pro Channel vs. pro Konto

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

### Gängige Muster

| Ziel                                     | Konfiguration                                                                           |
| ---------------------------------------- | --------------------------------------------------------------------------------------- |
| Standardverhalten (stumme OKs, Warnungen an) | _(keine Konfiguration erforderlich)_                                                |
| Vollständig stumm (keine Nachrichten, kein Indikator) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Nur Indikator (keine Nachrichten)        | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OKs nur in einem Channel                 | `channels.telegram.heartbeat: { showOk: true }`                                         |

## HEARTBEAT.md (optional)

Wenn im Workspace eine Datei `HEARTBEAT.md` existiert, weist der Standard-Prompt den
Agenten an, sie zu lesen. Betrachte sie als deine „Heartbeat-Checkliste“: klein, stabil und
sicher, um sie alle 30 Minuten einzubinden.

Bei normalen Läufen wird `HEARTBEAT.md` nur injiziert, wenn Heartbeat-Hinweise
für den Standard-Agent aktiviert sind. Wenn die Heartbeat-Frequenz mit `0m` deaktiviert wird oder
`includeSystemPromptSection: false` gesetzt ist, wird sie aus dem normalen Bootstrap-
Kontext weggelassen.

Wenn `HEARTBEAT.md` existiert, aber praktisch leer ist (nur Leerzeilen und Markdown-
Überschriften wie `# Heading`), überspringt OpenClaw den Heartbeat-Lauf, um API-Aufrufe zu sparen.
Dieses Überspringen wird als `reason=empty-heartbeat-file` gemeldet.
Wenn die Datei fehlt, läuft der Heartbeat trotzdem und das Modell entscheidet, was zu tun ist.

Halte sie klein (kurze Checkliste oder Erinnerungen), um Prompt-Bloat zu vermeiden.

Beispiel für `HEARTBEAT.md`:

```md
# Heartbeat-Checkliste

- Kurzer Scan: Gibt es etwas Dringendes in den Posteingängen?
- Wenn es tagsüber ist, einen leichten Check-in machen, falls sonst nichts aussteht.
- Wenn eine Aufgabe blockiert ist, _was fehlt_ notieren und Peter beim nächsten Mal fragen.
```

### `tasks:`-Blöcke

`HEARTBEAT.md` unterstützt außerdem einen kleinen strukturierten `tasks:`-Block für intervallbasierte
Prüfungen innerhalb von Heartbeat selbst.

Beispiel:

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "Check for urgent unread emails and flag anything time sensitive."
- name: calendar-scan
  interval: 2h
  prompt: "Check for upcoming meetings that need prep or follow-up."

# Zusätzliche Anweisungen

- Warnungen kurz halten.
- Wenn nach allen fälligen Aufgaben nichts Aufmerksamkeit benötigt, mit HEARTBEAT_OK antworten.
```

Verhalten:

- OpenClaw parst den `tasks:`-Block und prüft jede Aufgabe anhand ihres eigenen `interval`.
- Nur **fällige** Aufgaben werden für diesen Tick in den Heartbeat-Prompt aufgenommen.
- Wenn keine Aufgaben fällig sind, wird der Heartbeat vollständig übersprungen (`reason=no-tasks-due`), um einen unnötigen Modellaufruf zu vermeiden.
- Nicht aufgabenbezogener Inhalt in `HEARTBEAT.md` bleibt erhalten und wird nach der Liste der fälligen Aufgaben als zusätzlicher Kontext angehängt.
- Zeitstempel der letzten Ausführung von Aufgaben werden im Sitzungsstatus (`heartbeatTaskState`) gespeichert, sodass Intervalle normale Neustarts überdauern.
- Aufgabenzeitstempel werden erst aktualisiert, nachdem ein Heartbeat-Lauf seinen normalen Antwortpfad abgeschlossen hat. Übersprungene Läufe mit `empty-heartbeat-file` / `no-tasks-due` markieren Aufgaben nicht als erledigt.

Der Aufgabenmodus ist nützlich, wenn du in einer Heartbeat-Datei mehrere periodische Prüfungen unterbringen möchtest, ohne bei jedem Tick für alle zu bezahlen.

### Kann der Agent HEARTBEAT.md aktualisieren?

Ja — wenn du ihn darum bittest.

`HEARTBEAT.md` ist einfach eine normale Datei im Agent-Workspace, daher kannst du dem
Agenten (in einem normalen Chat) zum Beispiel sagen:

- „Aktualisiere `HEARTBEAT.md`, um eine tägliche Kalenderprüfung hinzuzufügen.“
- „Schreibe `HEARTBEAT.md` kürzer und fokussiere sie auf Nachverfolgungen im Posteingang.“

Wenn du möchtest, dass dies proaktiv geschieht, kannst du auch eine explizite Zeile in
deinen Heartbeat-Prompt aufnehmen, etwa: „If the checklist becomes stale, update HEARTBEAT.md
with a better one.“

Sicherheitshinweis: Lege keine Geheimnisse (API-Schlüssel, Telefonnummern, private Tokens) in
`HEARTBEAT.md` ab — sie wird Teil des Prompt-Kontexts.

## Manuelles Wecken (bei Bedarf)

Du kannst ein Systemereignis in die Warteschlange stellen und einen sofortigen Heartbeat auslösen mit:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Wenn mehrere Agents `heartbeat` konfiguriert haben, führt ein manuelles Wecken jeden dieser
Agent-Heartbeats sofort aus.

Verwende `--mode next-heartbeat`, um auf den nächsten geplanten Tick zu warten.

## Reasoning-Zustellung (optional)

Standardmäßig liefern Heartbeats nur die finale „Antwort“-Payload.

Wenn du Transparenz möchtest, aktiviere:

- `agents.defaults.heartbeat.includeReasoning: true`

Wenn aktiviert, liefern Heartbeats zusätzlich eine separate Nachricht mit dem Präfix
`Reasoning:` (gleiche Form wie bei `/reasoning on`). Das kann nützlich sein, wenn der Agent
mehrere Sitzungen/Codexes verwaltet und du sehen möchtest, warum er entschieden hat, dich
anzupingen — es kann aber auch mehr interne Details preisgeben, als dir lieb ist. Lass es
in Gruppenchats besser deaktiviert.

## Kostenbewusstsein

Heartbeats führen vollständige Agent-Durchläufe aus. Kürzere Intervalle verbrauchen mehr Tokens. So reduzierst du die Kosten:

- Verwende `isolatedSession: true`, um das Senden des vollständigen Gesprächsverlaufs zu vermeiden (~100K Tokens auf ~2-5K pro Lauf).
- Verwende `lightContext: true`, um Bootstrap-Dateien nur auf `HEARTBEAT.md` zu beschränken.
- Setze ein günstigeres `model` (z. B. `ollama/llama3.2:1b`).
- Halte `HEARTBEAT.md` klein.
- Verwende `target: "none"`, wenn du nur interne Statusaktualisierungen möchtest.

## Verwandt

- [Automatisierung & Aufgaben](/de/automation) — alle Automatisierungsmechanismen auf einen Blick
- [Hintergrundaufgaben](/de/automation/tasks) — wie entkoppelte Arbeit nachverfolgt wird
- [Zeitzone](/de/concepts/timezone) — wie die Zeitzone die Heartbeat-Planung beeinflusst
- [Fehlerbehebung](/de/automation/cron-jobs#troubleshooting) — Debugging von Automatisierungsproblemen
