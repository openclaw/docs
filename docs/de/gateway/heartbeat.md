---
read_when:
    - Heartbeat-Taktung oder Nachrichten anpassen
    - Entscheiden zwischen Heartbeat und Cron für geplante Aufgaben
sidebarTitle: Heartbeat
summary: Heartbeat-Polling-Nachrichten und Benachrichtigungsregeln
title: Heartbeat
x-i18n:
    generated_at: "2026-04-26T11:28:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe0d3e9c531062d90e8e24cb7795fed20bc0985c3eadc8ed367295fc2544d14e
    source_path: gateway/heartbeat.md
    workflow: 15
---

<Note>
**Heartbeat oder Cron?** Hinweise dazu, wann welches verwendet werden sollte, finden Sie unter [Automatisierung & Aufgaben](/de/automation).
</Note>

Heartbeat führt **periodische Agent-Turns** in der Hauptsitzung aus, damit das Modell alles hervorheben kann, was Aufmerksamkeit benötigt, ohne Sie zu überfluten.

Heartbeat ist ein geplanter Turn der Hauptsitzung — er erstellt **keine** Datensätze für [Hintergrundaufgaben](/de/automation/tasks). Aufgabendatensätze sind für losgelöste Arbeit gedacht (ACP-Läufe, Subagents, isolierte Cron-Jobs).

Fehlerbehebung: [Geplante Aufgaben](/de/automation/cron-jobs#troubleshooting)

## Schnellstart (für Einsteiger)

<Steps>
  <Step title="Eine Taktung wählen">
    Lassen Sie Heartbeats aktiviert (Standard ist `30m`, oder `1h` für Anthropic-OAuth-/Token-Auth, einschließlich Wiederverwendung der Claude CLI) oder legen Sie Ihre eigene Taktung fest.
  </Step>
  <Step title="HEARTBEAT.md hinzufügen (optional)">
    Erstellen Sie im Agent-Workspace eine kleine Checkliste `HEARTBEAT.md` oder einen Block `tasks:`.
  </Step>
  <Step title="Entscheiden, wohin Heartbeat-Nachrichten gesendet werden sollen">
    `target: "none"` ist der Standard; setzen Sie `target: "last"`, um an den letzten Kontakt zu senden.
  </Step>
  <Step title="Optionale Feinabstimmung">
    - Aktivieren Sie die Zustellung von Heartbeat-Reasoning für mehr Transparenz.
    - Verwenden Sie leichtgewichtigen Bootstrap-Kontext, wenn Heartbeat-Läufe nur `HEARTBEAT.md` benötigen.
    - Aktivieren Sie isolierte Sitzungen, um nicht bei jedem Heartbeat den vollständigen Gesprächsverlauf zu senden.
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
        target: "last", // explizite Zustellung an den letzten Kontakt (Standard ist "none")
        directPolicy: "allow", // Standard: direkte/DM-Ziele erlauben; auf "block" setzen, um sie zu unterdrücken
        lightContext: true, // optional: nur HEARTBEAT.md aus den Bootstrap-Dateien injizieren
        isolatedSession: true, // optional: frische Sitzung bei jedem Lauf (kein Gesprächsverlauf)
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // optional: auch separate Nachricht `Reasoning:` senden
      },
    },
  },
}
```

## Standardwerte

- Intervall: `30m` (oder `1h`, wenn Anthropic-OAuth-/Token-Auth der erkannte Auth-Modus ist, einschließlich Wiederverwendung der Claude CLI). Setzen Sie `agents.defaults.heartbeat.every` oder pro Agent `agents.list[].heartbeat.every`; verwenden Sie `0m`, um zu deaktivieren.
- Prompt-Text (konfigurierbar über `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Der Heartbeat-Prompt wird **wortwörtlich** als Benutzernachricht gesendet. Der System-Prompt enthält nur dann einen Abschnitt „Heartbeat“, wenn Heartbeats für den Standard-Agenten aktiviert sind und der Lauf intern entsprechend markiert ist.
- Wenn Heartbeats mit `0m` deaktiviert sind, lassen normale Läufe auch `HEARTBEAT.md` aus dem Bootstrap-Kontext weg, damit das Modell keine nur für Heartbeats bestimmten Anweisungen sieht.
- Aktive Stunden (`heartbeat.activeHours`) werden in der konfigurierten Zeitzone geprüft. Außerhalb des Fensters werden Heartbeats bis zum nächsten Tick innerhalb des Fensters übersprungen.

## Wofür der Heartbeat-Prompt gedacht ist

Der Standard-Prompt ist bewusst allgemein gehalten:

- **Hintergrundaufgaben**: „Consider outstanding tasks“ veranlasst den Agenten, offene Nachverfolgungen zu prüfen (Posteingang, Kalender, Erinnerungen, eingereihte Arbeit) und alles Dringende hervorzuheben.
- **Check-in beim Menschen**: „Checkup sometimes on your human during day time“ veranlasst gelegentlich zu einer leichten Nachricht wie „anything you need?“, vermeidet aber nächtlichen Spam durch Verwendung Ihrer konfigurierten lokalen Zeitzone (siehe [Zeitzone](/de/concepts/timezone)).

Heartbeat kann auf abgeschlossene [Hintergrundaufgaben](/de/automation/tasks) reagieren, aber ein Heartbeat-Lauf selbst erstellt keinen Aufgabendatensatz.

Wenn ein Heartbeat etwas sehr Bestimmtes tun soll (z. B. „Gmail-PubSub-Statistiken prüfen“ oder „Gateway-Health verifizieren“), setzen Sie `agents.defaults.heartbeat.prompt` (oder `agents.list[].heartbeat.prompt`) auf einen benutzerdefinierten Textkörper (wird wortwörtlich gesendet).

## Antwortvertrag

- Wenn nichts Aufmerksamkeit erfordert, antworten Sie mit **`HEARTBEAT_OK`**.
- Während Heartbeat-Läufen behandelt OpenClaw `HEARTBEAT_OK` als Bestätigung, wenn es am **Anfang oder Ende** der Antwort erscheint. Das Token wird entfernt und die Antwort wird verworfen, wenn der verbleibende Inhalt **≤ `ackMaxChars`** ist (Standard: 300).
- Wenn `HEARTBEAT_OK` in der **Mitte** einer Antwort erscheint, wird es nicht besonders behandelt.
- Fügen Sie bei Warnmeldungen **nicht** `HEARTBEAT_OK` ein; geben Sie nur den Warntext zurück.

Außerhalb von Heartbeats wird ein verirrtes `HEARTBEAT_OK` am Anfang/Ende einer Nachricht entfernt und protokolliert; eine Nachricht, die nur aus `HEARTBEAT_OK` besteht, wird verworfen.

## Konfiguration

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // Standard: 30m (0m deaktiviert)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // Standard: false (separate Nachricht `Reasoning:` senden, wenn verfügbar)
        lightContext: false, // Standard: false; true behält nur HEARTBEAT.md aus den Workspace-Bootstrap-Dateien
        isolatedSession: false, // Standard: false; true führt jeden Heartbeat in einer frischen Sitzung aus (kein Gesprächsverlauf)
        target: "last", // Standard: none | Optionen: last | none | <channel id> (Core oder Plugin, z. B. "bluebubbles")
        to: "+15551234567", // optionales kanalspezifisches Override
        accountId: "ops-bot", // optionale Multi-Account-Kanal-ID
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // maximale Zeichenzahl nach HEARTBEAT_OK
      },
    },
  },
}
```

### Geltungsbereich und Priorität

- `agents.defaults.heartbeat` legt das globale Heartbeat-Verhalten fest.
- `agents.list[].heartbeat` wird darübergelegt; wenn irgendein Agent einen Block `heartbeat` hat, führen **nur diese Agenten** Heartbeats aus.
- `channels.defaults.heartbeat` legt Sichtbarkeits-Standardwerte für alle Kanäle fest.
- `channels.<channel>.heartbeat` überschreibt die Kanal-Standardwerte.
- `channels.<channel>.accounts.<id>.heartbeat` (Multi-Account-Kanäle) überschreibt pro Kanal.

### Heartbeats pro Agent

Wenn irgendein Eintrag `agents.list[]` einen Block `heartbeat` enthält, führen **nur diese Agenten** Heartbeats aus. Der Block pro Agent wird über `agents.defaults.heartbeat` gelegt (damit Sie gemeinsame Standardwerte einmal setzen und pro Agent überschreiben können).

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

Heartbeats auf Geschäftszeiten in einer bestimmten Zeitzone beschränken:

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
          timezone: "America/New_York", // optional; verwendet Ihre userTimezone, falls gesetzt, sonst die Host-Zeitzone
        },
      },
    },
  },
}
```

Außerhalb dieses Fensters (vor 9 Uhr oder nach 22 Uhr Eastern) werden Heartbeats übersprungen. Der nächste geplante Tick innerhalb des Fensters läuft normal.

### 24/7-Setup

Wenn Heartbeats den ganzen Tag laufen sollen, verwenden Sie eines dieser Muster:

- `activeHours` vollständig weglassen (keine Einschränkung durch Zeitfenster; das ist das Standardverhalten).
- Ein ganztägiges Fenster setzen: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
Setzen Sie nicht dieselbe Uhrzeit für `start` und `end` (zum Beispiel `08:00` bis `08:00`). Das wird als Fenster mit Nullbreite behandelt, sodass Heartbeats immer übersprungen werden.
</Warning>

### Multi-Account-Beispiel

Verwenden Sie `accountId`, um ein bestimmtes Konto in Multi-Account-Kanälen wie Telegram anzusprechen:

```json5
{
  agents: {
    list: [
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "telegram",
          to: "12345678:topic:42", // optional: an ein bestimmtes Topic/Thread senden
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
  Optionales Modell-Override für Heartbeat-Läufe (`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  Wenn aktiviert, wird auch die separate Nachricht `Reasoning:` gesendet, wenn verfügbar (gleiche Form wie bei `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  Wenn true, verwenden Heartbeat-Läufe leichtgewichtigen Bootstrap-Kontext und behalten nur `HEARTBEAT.md` aus den Workspace-Bootstrap-Dateien.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  Wenn true, läuft jeder Heartbeat in einer frischen Sitzung ohne vorherigen Gesprächsverlauf. Verwendet dasselbe Isolationsmuster wie Cron `sessionTarget: "isolated"`. Reduziert die Token-Kosten pro Heartbeat drastisch. Für maximale Einsparungen mit `lightContext: true` kombinieren. Das Zustellungsrouting verwendet weiterhin den Kontext der Hauptsitzung.
</ParamField>
<ParamField path="session" type="string">
  Optionaler Sitzungsschlüssel für Heartbeat-Läufe.

- `main` (Standard): Hauptsitzung des Agenten.
- Expliziter Sitzungsschlüssel (kopieren aus `openclaw sessions --json` oder der [Sessions-CLI](/de/cli/sessions)).
- Formate von Sitzungsschlüsseln: siehe [Sitzungen](/de/concepts/session) und [Gruppen](/de/channels/groups).
</ParamField>
  <ParamField path="target" type="string">
- `last`: an den zuletzt verwendeten externen Kanal zustellen.
- expliziter Kanal: jeder konfigurierte Kanal oder jede Plugin-ID, zum Beispiel `discord`, `matrix`, `telegram` oder `whatsapp`.
- `none` (Standard): Heartbeat ausführen, aber **nicht extern zustellen**.
  </ParamField>
  <ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  Steuert das Zustellungsverhalten für direkte/DM-Ziele. `allow`: direkte/DM-Heartbeat-Zustellung erlauben. `block`: direkte/DM-Zustellung unterdrücken (`reason=dm-blocked`).
  </ParamField>
  <ParamField path="to" type="string">
  Optionales Empfänger-Override (kanalspezifische ID, z. B. E.164 für WhatsApp oder eine Telegram-Chat-ID). Für Telegram-Topics/Threads verwenden Sie `<chatId>:topic:<messageThreadId>`.
  </ParamField>
  <ParamField path="accountId" type="string">
  Optionale Konto-ID für Multi-Account-Kanäle. Bei `target: "last"` gilt die Konto-ID für den aufgelösten letzten Kanal, wenn dieser Konten unterstützt; andernfalls wird sie ignoriert. Wenn die Konto-ID nicht zu einem konfigurierten Konto für den aufgelösten Kanal passt, wird die Zustellung übersprungen.
  </ParamField>
  <ParamField path="prompt" type="string">
  Überschreibt den Standard-Prompt-Textkörper (wird nicht zusammengeführt).
  </ParamField>
  <ParamField path="ackMaxChars" type="number" default="300">
  Maximale Zeichenzahl, die nach `HEARTBEAT_OK` vor der Zustellung erlaubt ist.
  </ParamField>
  <ParamField path="suppressToolErrorWarnings" type="boolean">
  Wenn true, werden Payloads mit Tool-Fehlerwarnungen während Heartbeat-Läufen unterdrückt.
  </ParamField>
  <ParamField path="activeHours" type="object">
  Beschränkt Heartbeat-Läufe auf ein Zeitfenster. Objekt mit `start` (HH:MM, inklusive; verwenden Sie `00:00` für Tagesbeginn), `end` (HH:MM exklusiv; `24:00` ist für Tagesende erlaubt) und optional `timezone`.

- Weggelassen oder `"user"`: verwendet `agents.defaults.userTimezone`, falls gesetzt, andernfalls die Zeitzone des Host-Systems.
- `"local"`: verwendet immer die Zeitzone des Host-Systems.
- Jede IANA-Kennung (z. B. `America/New_York`): wird direkt verwendet; falls ungültig, wird auf das oben beschriebene Verhalten für `"user"` zurückgegriffen.
- `start` und `end` dürfen für ein aktives Fenster nicht gleich sein; gleiche Werte werden als Fenster mit Nullbreite behandelt (immer außerhalb des Fensters).
- Außerhalb des aktiven Fensters werden Heartbeats bis zum nächsten Tick innerhalb des Fensters übersprungen.
  </ParamField>

## Zustellungsverhalten

<AccordionGroup>
  <Accordion title="Sitzungs- und Zielrouting">
    - Heartbeats laufen standardmäßig in der Hauptsitzung des Agenten (`agent:<id>:<mainKey>`), oder in `global`, wenn `session.scope = "global"` gilt. Setzen Sie `session`, um auf eine bestimmte Kanalsitzung (Discord/WhatsApp/etc.) umzuleiten.
    - `session` beeinflusst nur den Laufkontext; die Zustellung wird durch `target` und `to` gesteuert.
    - Um an einen bestimmten Kanal/Empfänger zuzustellen, setzen Sie `target` + `to`. Bei `target: "last"` verwendet die Zustellung den letzten externen Kanal für diese Sitzung.
    - Heartbeat-Zustellungen erlauben standardmäßig direkte/DM-Ziele. Setzen Sie `directPolicy: "block"`, um Sendungen an direkte Ziele zu unterdrücken, während der Heartbeat-Turn weiterhin ausgeführt wird.
    - Wenn die Hauptwarteschlange ausgelastet ist, wird der Heartbeat übersprungen und später erneut versucht.
    - Wenn `target` zu keinem externen Ziel aufgelöst wird, findet der Lauf dennoch statt, aber es wird keine ausgehende Nachricht gesendet.
  </Accordion>
  <Accordion title="Sichtbarkeit und Überspringverhalten">
    - Wenn `showOk`, `showAlerts` und `useIndicator` alle deaktiviert sind, wird der Lauf sofort mit `reason=alerts-disabled` übersprungen.
    - Wenn nur die Warnungszustellung deaktiviert ist, kann OpenClaw den Heartbeat dennoch ausführen, Zeitstempel für fällige Aufgaben aktualisieren, den Idle-Zeitstempel der Sitzung wiederherstellen und die ausgehende Warnungs-Payload unterdrücken.
    - Wenn das aufgelöste Heartbeat-Ziel Tippen unterstützt, zeigt OpenClaw während des aktiven Heartbeat-Laufs eine Tippen-Anzeige an. Dabei wird dasselbe Ziel verwendet, an das auch Chat-Ausgaben des Heartbeat gesendet würden, und dies wird durch `typingMode: "never"` deaktiviert.
  </Accordion>
  <Accordion title="Sitzungslebenszyklus und Audit">
    - Heartbeat-only-Antworten halten die Sitzung **nicht** aktiv. Heartbeat-Metadaten können die Sitzungszeile aktualisieren, aber das Idle-Ablaufen verwendet `lastInteractionAt` aus der letzten echten Benutzer-/Kanalnachricht, und tägliches Ablaufen verwendet `sessionStartedAt`.
    - Der Verlauf in Control UI und WebChat blendet Heartbeat-Prompts und reine OK-Bestätigungen aus. Das zugrunde liegende Sitzungs-Transkript kann diese Turns für Audit/Replay dennoch enthalten.
    - Losgelöste [Hintergrundaufgaben](/de/automation/tasks) können ein Systemereignis in die Warteschlange stellen und den Heartbeat wecken, wenn die Hauptsitzung etwas schnell bemerken soll. Dieses Wecken macht den Heartbeat-Lauf nicht zu einer Hintergrundaufgabe.
  </Accordion>
</AccordionGroup>

## Sichtbarkeitssteuerung

Standardmäßig werden Bestätigungen `HEARTBEAT_OK` unterdrückt, während Warnungsinhalte zugestellt werden. Sie können dies pro Kanal oder pro Konto anpassen:

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
          showAlerts: false # Warnungszustellung für dieses Konto unterdrücken
```

Priorität: pro Konto → pro Kanal → Kanal-Standardwerte → eingebaute Standardwerte.

### Was die einzelnen Flags tun

- `showOk`: sendet eine Bestätigung `HEARTBEAT_OK`, wenn das Modell eine reine OK-Antwort zurückgibt.
- `showAlerts`: sendet den Warnungsinhalt, wenn das Modell eine Antwort ohne OK zurückgibt.
- `useIndicator`: gibt Indikatorereignisse für UI-Statusoberflächen aus.

Wenn **alle drei** auf false stehen, überspringt OpenClaw den Heartbeat-Lauf vollständig (kein Modellaufruf).

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
| Standardverhalten (stille OKs, Warnungen an) | _(keine Konfiguration nötig)_                                                         |
| Vollständig still (keine Nachrichten, kein Indikator) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Nur Indikator (keine Nachrichten)        | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }` |
| OKs nur in einem Kanal                   | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (optional)

Wenn im Workspace eine Datei `HEARTBEAT.md` existiert, weist der Standard-Prompt den Agenten an, sie zu lesen. Sie können sie sich als Ihre „Heartbeat-Checkliste“ vorstellen: klein, stabil und sicher genug, um sie alle 30 Minuten einzubinden.

Bei normalen Läufen wird `HEARTBEAT.md` nur injiziert, wenn Heartbeat-Hinweise für den Standard-Agenten aktiviert sind. Das Deaktivieren der Heartbeat-Taktung mit `0m` oder das Setzen von `includeSystemPromptSection: false` lässt sie aus dem normalen Bootstrap-Kontext weg.

Wenn `HEARTBEAT.md` existiert, aber effektiv leer ist (nur Leerzeilen und Markdown-Überschriften wie `# Heading`), überspringt OpenClaw den Heartbeat-Lauf, um API-Aufrufe zu sparen. Dieses Überspringen wird als `reason=empty-heartbeat-file` gemeldet. Wenn die Datei fehlt, läuft der Heartbeat trotzdem und das Modell entscheidet, was zu tun ist.

Halten Sie sie klein (kurze Checkliste oder Erinnerungen), um Prompt-Bloat zu vermeiden.

Beispiel für `HEARTBEAT.md`:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### `tasks:`-Blöcke

`HEARTBEAT.md` unterstützt außerdem einen kleinen strukturierten Block `tasks:` für intervallbasierte Prüfungen innerhalb des Heartbeat selbst.

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
    - OpenClaw parst den Block `tasks:` und prüft jede Aufgabe anhand ihres eigenen `interval`.
    - Nur **fällige** Aufgaben werden für diesen Tick in den Heartbeat-Prompt aufgenommen.
    - Wenn keine Aufgaben fällig sind, wird der Heartbeat vollständig übersprungen (`reason=no-tasks-due`), um einen verschwendeten Modellaufruf zu vermeiden.
    - Inhalt außerhalb der Aufgaben in `HEARTBEAT.md` bleibt erhalten und wird nach der Liste fälliger Aufgaben als zusätzlicher Kontext angehängt.
    - Zeitstempel der letzten Ausführung von Aufgaben werden im Sitzungsstatus (`heartbeatTaskState`) gespeichert, sodass Intervalle normale Neustarts überstehen.
    - Aufgabenzeitstempel werden erst fortgeschrieben, nachdem ein Heartbeat-Lauf seinen normalen Antwortpfad abgeschlossen hat. Übersprungene Läufe wegen `empty-heartbeat-file` / `no-tasks-due` markieren Aufgaben nicht als abgeschlossen.
  </Accordion>
</AccordionGroup>

Der Aufgabenmodus ist nützlich, wenn Sie möchten, dass eine Heartbeat-Datei mehrere periodische Prüfungen enthält, ohne bei jedem Tick für alle zu bezahlen.

### Kann der Agent `HEARTBEAT.md` aktualisieren?

Ja — wenn Sie ihn dazu auffordern.

`HEARTBEAT.md` ist einfach eine normale Datei im Agent-Workspace, sodass Sie dem Agenten (in einem normalen Chat) so etwas sagen können wie:

- „Aktualisiere `HEARTBEAT.md`, um eine tägliche Kalenderprüfung hinzuzufügen.“
- „Schreibe `HEARTBEAT.md` so um, dass sie kürzer ist und sich auf Nachverfolgungen im Posteingang konzentriert.“

Wenn dies proaktiv geschehen soll, können Sie auch eine explizite Zeile in Ihren Heartbeat-Prompt aufnehmen, etwa: „If the checklist becomes stale, update HEARTBEAT.md with a better one.“

<Warning>
Legen Sie keine Geheimnisse (API-Schlüssel, Telefonnummern, private Tokens) in `HEARTBEAT.md` ab — sie wird Teil des Prompt-Kontexts.
</Warning>

## Manuelles Wecken (auf Abruf)

Sie können ein Systemereignis in die Warteschlange stellen und einen sofortigen Heartbeat auslösen mit:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Wenn mehrere Agenten `heartbeat` konfiguriert haben, führt ein manuelles Wecken die Heartbeats aller dieser Agenten sofort aus.

Verwenden Sie `--mode next-heartbeat`, um auf den nächsten geplanten Tick zu warten.

## Reasoning-Zustellung (optional)

Standardmäßig liefern Heartbeats nur die finale „Antwort“-Payload.

Wenn Sie Transparenz wünschen, aktivieren Sie:

- `agents.defaults.heartbeat.includeReasoning: true`

Wenn aktiviert, liefern Heartbeats zusätzlich eine separate Nachricht mit dem Präfix `Reasoning:` (gleiche Form wie bei `/reasoning on`). Das kann nützlich sein, wenn der Agent mehrere Sitzungen/Codexes verwaltet und Sie sehen möchten, warum er entschieden hat, Sie anzupingen — es kann aber auch mehr interne Details preisgeben, als Ihnen lieb ist. In Gruppenchats sollten Sie es eher deaktiviert lassen.

## Kostenbewusstsein

Heartbeats führen vollständige Agent-Turns aus. Kürzere Intervalle verbrauchen mehr Tokens. Um Kosten zu reduzieren:

- Verwenden Sie `isolatedSession: true`, um das Senden des vollständigen Gesprächsverlaufs zu vermeiden (~100K Tokens auf ~2-5K pro Lauf).
- Verwenden Sie `lightContext: true`, um Bootstrap-Dateien auf nur `HEARTBEAT.md` zu beschränken.
- Setzen Sie ein günstigeres `model` (z. B. `ollama/llama3.2:1b`).
- Halten Sie `HEARTBEAT.md` klein.
- Verwenden Sie `target: "none"`, wenn Sie nur interne Statusaktualisierungen möchten.

## Verwandt

- [Automatisierung & Aufgaben](/de/automation) — alle Automatisierungsmechanismen auf einen Blick
- [Hintergrundaufgaben](/de/automation/tasks) — wie losgelöste Arbeit nachverfolgt wird
- [Zeitzone](/de/concepts/timezone) — wie die Zeitzone die Heartbeat-Planung beeinflusst
- [Fehlerbehebung](/de/automation/cron-jobs#troubleshooting) — Debugging von Automatisierungsproblemen
