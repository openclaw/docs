---
read_when:
    - Heartbeat-Intervall oder Nachrichten anpassen
    - Entscheidung zwischen Heartbeat und Cron für geplante Aufgaben
sidebarTitle: Heartbeat
summary: Heartbeat-Abfragenachrichten und Benachrichtigungsregeln
title: Heartbeat
x-i18n:
    generated_at: "2026-07-12T15:23:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: bc43539cde0bf4e00ee57d510d2188c4e7cc82d67e13b9f86ac5fc37c3c176d2
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat oder Cron?** Unter [Automatisierung](/de/automation) finden Sie Hinweise dazu, wann Sie was verwenden sollten.
</Note>

Heartbeat führt in der Hauptsitzung **regelmäßige Agentendurchläufe** aus, damit das Modell Sie auf alles aufmerksam machen kann, was Ihre Aufmerksamkeit erfordert, ohne Sie mit Nachrichten zu überfluten.

Heartbeat ist ein geplanter Durchlauf in der Hauptsitzung – dabei werden **keine** Datensätze für [Hintergrundaufgaben](/de/automation/tasks) erstellt. Aufgabendatensätze sind für entkoppelte Arbeiten vorgesehen (ACP-Durchläufe, Subagenten, isolierte Cron-Aufträge).

Fehlerbehebung: [Geplante Aufgaben](/de/automation/cron-jobs#troubleshooting)

## Schnellstart (für Einsteiger)

<Steps>
  <Step title="Intervall auswählen">
    Lassen Sie Heartbeats aktiviert (Standard ist `30m` oder `1h`, wenn Anthropic-OAuth-/Token-Authentifizierung konfiguriert ist, einschließlich der Wiederverwendung der Claude CLI), oder legen Sie ein eigenes Intervall fest.
  </Step>
  <Step title="HEARTBEAT.md hinzufügen (optional)">
    Erstellen Sie im Agent-Arbeitsbereich eine kurze Checkliste in `HEARTBEAT.md` oder einen `tasks:`-Block.
  </Step>
  <Step title="Ziel für Heartbeat-Nachrichten festlegen">
    `target: "none"` ist die Standardeinstellung; legen Sie `target: "last"` fest, um Nachrichten an den letzten Kontakt weiterzuleiten.
  </Step>
  <Step title="Optionale Feinabstimmung">
    - Aktivieren Sie für mehr Transparenz die Übermittlung der Heartbeat-Schlussfolgerungen.
    - Verwenden Sie einen schlanken Bootstrap-Kontext, wenn Heartbeat-Durchläufe nur `HEARTBEAT.md` benötigen.
    - Aktivieren Sie isolierte Sitzungen, damit nicht bei jedem Heartbeat der vollständige Gesprächsverlauf gesendet wird.
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
        target: "last", // explizite Zustellung an den letzten Kontakt (Standard ist "none")
        directPolicy: "allow", // Standard: direkte/DM-Ziele zulassen; auf "block" setzen, um sie zu unterdrücken
        lightContext: true, // optional: aus Bootstrap-Dateien nur HEARTBEAT.md einfügen
        isolatedSession: true, // optional: bei jedem Durchlauf eine neue Sitzung (kein Gesprächsverlauf)
        skipWhenBusy: true, // optional: auch zurückstellen, wenn der Subagent oder verschachtelte Ausführungspfade dieses Agenten ausgelastet sind
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // optional: zusätzlich eine separate `Thinking`-Nachricht senden
      },
    },
  },
}
```

## Standardeinstellungen

- Intervall: `30m`. Durch Anwenden der Standardwerte des Anthropic-Providers wird dieses Intervall auf `1h` erhöht, wenn der ermittelte Authentifizierungsmodus OAuth/Token ist (einschließlich der Wiederverwendung der Claude CLI), jedoch nur, solange `heartbeat.every` nicht festgelegt ist. Legen Sie `agents.defaults.heartbeat.every` oder agentenspezifisch `agents.list[].heartbeat.every` fest; verwenden Sie `0m` zum Deaktivieren.
- Prompt-Text (konfigurierbar über `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Zeitüberschreitung: Heartbeat-Durchläufe ohne festgelegten Wert verwenden `agents.defaults.timeoutSeconds`, sofern dieser Wert festgelegt ist. Andernfalls verwenden sie das Heartbeat-Intervall, begrenzt auf 600 Sekunden. Legen Sie für längere Heartbeat-Aufgaben `agents.defaults.heartbeat.timeoutSeconds` oder agentenspezifisch `agents.list[].heartbeat.timeoutSeconds` fest.
- Der Heartbeat-Prompt wird **wortgetreu** als Benutzernachricht gesendet. Der System-Prompt enthält nur dann einen Abschnitt „Heartbeats“, wenn Heartbeats für den Standard-Agenten aktiviert sind (und `includeSystemPromptSection` nicht `false` ist); der Durchlauf wird intern entsprechend gekennzeichnet.
- Wenn Heartbeats mit `0m` deaktiviert sind, lassen normale Durchläufe außerdem `HEARTBEAT.md` aus dem Bootstrap-Kontext weg, damit das Modell keine ausschließlich für Heartbeats bestimmten Anweisungen sieht.
- Die aktiven Zeiten (`heartbeat.activeHours`) werden in der konfigurierten Zeitzone geprüft. Außerhalb des Zeitfensters werden Heartbeats bis zum nächsten Tick innerhalb des Zeitfensters übersprungen.
- Heartbeats werden automatisch aufgeschoben, solange Cron-Aufgaben aktiv sind oder sich in der Warteschlange befinden. Legen Sie zusätzlich `heartbeat.skipWhenBusy: true` fest, um einen Agenten auch bei eigenen, an den Sitzungsschlüssel gebundenen Subagenten- oder verschachtelten Befehls-Lanes aufzuschieben; parallele Agenten werden nicht mehr angehalten, nur weil bei einem anderen Agenten Subagenten-Aufgaben ausgeführt werden.

## Wofür der Heartbeat-Prompt vorgesehen ist

Der Standard-Prompt ist absichtlich allgemein gehalten:

- **Hintergrundaufgaben**: „Ausstehende Aufgaben berücksichtigen“ veranlasst den Agenten, Folgeaufgaben (Posteingang, Kalender, Erinnerungen, Aufgaben in der Warteschlange) zu prüfen und auf dringende Angelegenheiten hinzuweisen.
- **Nachfragen beim Menschen**: „Gelegentlich tagsüber nach Ihrem Menschen sehen“ regt zu einer gelegentlichen kurzen Nachricht wie „Benötigen Sie etwas?“ an, vermeidet jedoch nächtlichen Spam durch Verwendung Ihrer konfigurierten lokalen Zeitzone (siehe [Zeitzone](/de/concepts/timezone)).

Heartbeat kann auf abgeschlossene [Hintergrundaufgaben](/de/automation/tasks) reagieren, ein Heartbeat-Durchlauf selbst erstellt jedoch keinen Aufgabendatensatz.

Wenn ein Heartbeat etwas sehr Bestimmtes ausführen soll (z. B. „Gmail-PubSub-Statistiken prüfen“ oder „Zustand des Gateways überprüfen“), legen Sie `agents.defaults.heartbeat.prompt` (oder `agents.list[].heartbeat.prompt`) auf einen benutzerdefinierten Text fest (der wortgetreu gesendet wird).

## Antwortvertrag

- Wenn nichts Aufmerksamkeit erfordert, antworten Sie mit **`HEARTBEAT_OK`**.
- Heartbeat-Durchläufe können stattdessen `heartbeat_respond` mit `notify: false` für keine sichtbare Aktualisierung oder mit `notify: true` und `notificationText` für eine Warnung aufrufen. Falls vorhanden, hat die strukturierte Tool-Antwort Vorrang vor dem Text-Fallback.
- Während Heartbeat-Durchläufen behandelt OpenClaw `HEARTBEAT_OK` als Bestätigung, wenn es am **Anfang oder Ende** der Antwort steht. Das Token wird entfernt, und die Antwort wird verworfen, wenn der verbleibende Inhalt **≤ `ackMaxChars`** ist (Standard: 300).
- Wenn `HEARTBEAT_OK` in der **Mitte** einer Antwort steht, wird es nicht besonders behandelt.
- Fügen Sie bei Warnungen **nicht** `HEARTBEAT_OK` ein; geben Sie nur den Warntext zurück.

Außerhalb von Heartbeats wird ein versehentliches `HEARTBEAT_OK` am Anfang oder Ende einer Nachricht entfernt und protokolliert; eine Nachricht, die ausschließlich aus `HEARTBEAT_OK` besteht, wird verworfen.

## Konfiguration

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // Standard: 30m (0m deaktiviert)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // Standard: false (separate Thinking-Nachricht zustellen, sofern verfügbar)
        lightContext: false, // Standard: false; true behält von den Workspace-Bootstrap-Dateien nur HEARTBEAT.md bei
        isolatedSession: false, // Standard: false; true führt jeden Heartbeat in einer neuen Sitzung aus (ohne Gesprächsverlauf)
        skipWhenBusy: false, // Standard: false; true wartet zusätzlich auf die Subagenten-/verschachtelten Lanes dieses Agenten
        target: "last", // Standard: none | Optionen: last | none | <channel id> (Core oder Plugin, z. B. "imessage")
        to: "+15551234567", // optionale kanalspezifische Überschreibung
        accountId: "ops-bot", // optionale Kanal-ID für mehrere Konten
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        includeSystemPromptSection: true, // Standard: true; false lässt den System-Prompt-Abschnitt ## Heartbeats für den Standard-Agenten weg
        ackMaxChars: 300, // maximal zulässige Zeichenanzahl nach HEARTBEAT_OK
      },
    },
  },
}
```

### Geltungsbereich und Rangfolge

- `agents.defaults.heartbeat` legt das globale Heartbeat-Verhalten fest.
- `agents.list[].heartbeat` wird darübergelegt; wenn ein Agent einen `heartbeat`-Block hat, führen **nur diese Agenten** Heartbeats aus.
- `channels.defaults.heartbeat` legt die standardmäßige Sichtbarkeit für alle Kanäle fest.
- `channels.<channel>.heartbeat` überschreibt die Kanalstandards.
- `channels.<channel>.accounts.<id>.heartbeat` (Kanäle mit mehreren Konten) überschreibt die Einstellungen für den jeweiligen Kanal.

### Agentenspezifische Heartbeats

Wenn ein Eintrag in `agents.list[]` einen `heartbeat`-Block enthält, führen **nur diese Agenten** Heartbeats aus. Der agentenspezifische Block wird über `agents.defaults.heartbeat` gelegt (sodass Sie gemeinsame Standardwerte einmal festlegen und pro Agent überschreiben können).

Beispiel: zwei Agenten, wobei nur der zweite Agent Heartbeats ausführt.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // explizite Zustellung an den letzten Kontakt (Standardwert ist "none")
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
          prompt: "Lesen Sie HEARTBEAT.md, falls die Datei vorhanden ist (Workspace-Kontext). Befolgen Sie die Anweisungen strikt. Leiten Sie keine alten Aufgaben aus früheren Chats ab und wiederholen Sie sie nicht. Wenn nichts Ihre Aufmerksamkeit erfordert, antworten Sie mit HEARTBEAT_OK.",
        },
      },
    ],
  },
}
```

### Beispiel für aktive Zeiten

Beschränken Sie Heartbeats auf die Geschäftszeiten in einer bestimmten Zeitzone:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // explizite Zustellung an den letzten Kontakt (Standardwert ist "none")
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York", // optional; verwendet userTimezone, falls festgelegt, andernfalls die Zeitzone des Hosts
        },
      },
    },
  },
}
```

Außerhalb dieses Zeitfensters (vor 9 Uhr oder nach 22 Uhr Eastern Time) werden Heartbeats übersprungen. Der nächste geplante Durchlauf innerhalb des Zeitfensters wird normal ausgeführt.

### Rund-um-die-Uhr-Konfiguration

Wenn Heartbeats den ganzen Tag ausgeführt werden sollen, verwenden Sie eines dieser Muster:

- Lassen Sie `activeHours` vollständig weg (keine Einschränkung durch ein Zeitfenster; dies ist das Standardverhalten).
- Legen Sie ein ganztägiges Zeitfenster fest: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
Legen Sie für `start` und `end` nicht dieselbe Uhrzeit fest (beispielsweise `08:00` bis `08:00`). Dies wird als Zeitfenster ohne Dauer behandelt, sodass Heartbeats immer übersprungen werden.
</Warning>

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
          to: "12345678:topic:42", // optional: an ein bestimmtes Thema/einen bestimmten Thread weiterleiten
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

<ParamField path="every" type="string">
  Heartbeat-Intervall (Zeichenfolge für eine Dauer; Standardeinheit = Minuten).
</ParamField>
<ParamField path="model" type="string">
  Optionale Modellüberschreibung für Heartbeat-Durchläufe (`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  Wenn aktiviert, wird zusätzlich die separate Nachricht `Thinking` zugestellt, sofern verfügbar (dasselbe Format wie bei `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  Wenn auf „true“ gesetzt, verwenden Heartbeat-Durchläufe einen schlanken Bootstrap-Kontext und behalten aus den Workspace-Bootstrap-Dateien nur `HEARTBEAT.md` bei.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  Wenn auf „true“ gesetzt, wird jeder Heartbeat in einer neuen Sitzung ohne vorherigen Gesprächsverlauf ausgeführt. Verwendet dasselbe Isolationsmuster wie Cron mit `sessionTarget: "isolated"`. Reduziert die Token-Kosten pro Heartbeat erheblich. Kombinieren Sie dies mit `lightContext: true`, um maximale Einsparungen zu erzielen. Für die Zustellungsweiterleitung wird weiterhin der Kontext der Hauptsitzung verwendet.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  Wenn auf „true“ gesetzt, werden Heartbeat-Durchläufe aufgeschoben, wenn die zusätzlichen Ausführungsspuren dieses Agenten ausgelastet sind: sein eigener sitzungsschlüsselgebundener Subagent oder verschachtelte Befehlsausführung. Cron-Ausführungsspuren schieben Heartbeats auch ohne dieses Flag immer auf, sodass Hosts für lokale Modelle Cron- und Heartbeat-Prompts nicht gleichzeitig ausführen.
</ParamField>
<ParamField path="session" type="string">
  Optionaler Sitzungsschlüssel für Heartbeat-Durchläufe.

- `main` (Standard): Hauptsitzung des Agenten.
- Expliziter Sitzungsschlüssel (aus `openclaw sessions --json` oder der [Sitzungs-CLI](/de/cli/sessions) kopieren).
- Formate für Sitzungsschlüssel: siehe [Sitzungen](/de/concepts/session) und [Gruppen](/de/channels/groups).

</ParamField>
<ParamField path="target" type="string">
- `last`: an den zuletzt verwendeten externen Kanal zustellen.
- expliziter Kanal: ein beliebiger konfigurierter Kanal oder eine Plugin-ID, beispielsweise `discord`, `matrix`, `telegram` oder `whatsapp`.
- `none` (Standard): den Heartbeat ausführen, aber **nicht extern zustellen**.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  Steuert das Verhalten bei direkter Zustellung bzw. Zustellung per Direktnachricht. `allow`: direkte Heartbeat-Zustellung bzw. Zustellung per Direktnachricht zulassen. `block`: direkte Zustellung bzw. Zustellung per Direktnachricht unterdrücken (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  Optionale Überschreibung des Empfängers (kanalspezifische ID, z. B. E.164 für WhatsApp oder eine Telegram-Chat-ID). Verwenden Sie für Telegram-Themen/Threads `<chatId>:topic:<messageThreadId>`.

</ParamField>
<ParamField path="accountId" type="string">
  Optionale Konto-ID für Kanäle mit mehreren Konten. Bei `target: "last"` gilt die Konto-ID für den ermittelten letzten Kanal, sofern dieser Konten unterstützt; andernfalls wird sie ignoriert. Wenn die Konto-ID keinem konfigurierten Konto für den ermittelten Kanal entspricht, wird die Zustellung übersprungen.

</ParamField>
<ParamField path="prompt" type="string">
  Überschreibt den standardmäßigen Prompt-Inhalt (wird nicht zusammengeführt).

</ParamField>
<ParamField path="includeSystemPromptSection" type="boolean" default="true">
  Legt fest, ob der System-Prompt-Abschnitt `## Heartbeats` des Standard-Agenten eingefügt wird. Setzen Sie den Wert auf `false`, um das Heartbeat-Laufzeitverhalten (Intervall, Zustellung, HEARTBEAT.md) beizubehalten, während die Heartbeat-Anweisungen im System-Prompt des Agenten ausgelassen werden.

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  Maximal zulässige Zeichenanzahl nach `HEARTBEAT_OK` vor der Zustellung.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  Wenn der Wert „true“ ist, werden bei Heartbeat-Ausführungen Warninhalte zu Tool-Fehlern unterdrückt.

</ParamField>
<ParamField path="timeoutSeconds" type="number" default="global timeout or min(every, 600)">
  Maximal zulässige Anzahl von Sekunden für einen Heartbeat-Agentendurchlauf, bevor er abgebrochen wird. Lassen Sie den Wert nicht gesetzt, um `agents.defaults.timeoutSeconds` zu verwenden, sofern festgelegt; andernfalls wird das auf 600 Sekunden begrenzte Heartbeat-Intervall verwendet.

</ParamField>
<ParamField path="activeHours" type="object">
  Beschränkt Heartbeat-Ausführungen auf ein Zeitfenster. Objekt mit `start` (HH:MM, einschließlich; verwenden Sie `00:00` für den Tagesbeginn), `end` (HH:MM, ausschließlich; `24:00` ist für das Tagesende zulässig) und optional `timezone`.

- Nicht angegeben oder `"user"`: Verwendet Ihre Einstellung `agents.defaults.userTimezone`, sofern festgelegt; andernfalls wird auf die Zeitzone des Hostsystems zurückgegriffen.
- `"local"`: Verwendet immer die Zeitzone des Hostsystems.
- Beliebige IANA-Kennung (z. B. `America/New_York`): Wird direkt verwendet; ist sie ungültig, wird auf das oben beschriebene Verhalten von `"user"` zurückgegriffen.
- `start` und `end` dürfen für ein aktives Zeitfenster nicht identisch sein; identische Werte werden als Zeitfenster ohne Dauer behandelt (immer außerhalb des Zeitfensters).
- Außerhalb des aktiven Zeitfensters werden Heartbeats bis zum nächsten Tick innerhalb des Zeitfensters übersprungen.

</ParamField>

## Zustellungsverhalten

<AccordionGroup>
  <Accordion title="Sitzungs- und Zielrouting">
    - Heartbeats werden standardmäßig in der Hauptsitzung des Agenten ausgeführt (`agent:<id>:<mainKey>`) oder in `global`, wenn `session.scope = "global"` gilt. Legen Sie `session` fest, um stattdessen eine bestimmte Kanalsitzung (Discord/WhatsApp/usw.) zu verwenden.
    - `session` wirkt sich nur auf den Ausführungskontext aus; die Zustellung wird durch `target` und `to` gesteuert.
    - Um an einen bestimmten Kanal/Empfänger zuzustellen, legen Sie `target` und `to` fest. Bei `target: "last"` verwendet die Zustellung den letzten externen Kanal dieser Sitzung.
    - Heartbeat-Zustellungen erlauben standardmäßig direkte/DM-Ziele. Legen Sie `directPolicy: "block"` fest, um Sendungen an direkte Ziele zu unterdrücken, während der Heartbeat-Durchlauf weiterhin ausgeführt wird.
    - Wenn die Hauptwarteschlange, die Lane der Zielsitzung, die Cron-Lane oder ein aktiver Cron-Job ausgelastet ist, wird der Heartbeat übersprungen und später erneut versucht.
    - Bei `skipWhenBusy: true` verschieben auch die sitzungsschlüsselgebundenen Subagenten- und verschachtelten Lanes dieses Agenten Heartbeat-Ausführungen. Ausgelastete Lanes anderer Agenten verschieben die Ausführungen dieses Agenten nicht.
    - Wenn `target` zu keinem externen Ziel aufgelöst wird, findet die Ausführung trotzdem statt, es wird jedoch keine ausgehende Nachricht gesendet.

  </Accordion>
  <Accordion title="Sichtbarkeits- und Überspringverhalten">
    - Wenn `showOk`, `showAlerts` und `useIndicator` alle deaktiviert sind, wird die Ausführung vorab mit `reason=alerts-disabled` übersprungen.
    - Wenn nur die Zustellung von Warnungen deaktiviert ist, kann OpenClaw den Heartbeat weiterhin ausführen, die Zeitstempel fälliger Aufgaben aktualisieren, den Leerlaufzeitstempel der Sitzung wiederherstellen und den nach außen gerichteten Warninhalt unterdrücken.
    - Wenn das ermittelte Heartbeat-Ziel Tippanzeigen unterstützt, zeigt OpenClaw während der aktiven Heartbeat-Ausführung eine Tippanzeige an. Dafür wird dasselbe Ziel verwendet, an das der Heartbeat die Chat-Ausgabe senden würde; durch `typingMode: "never"` wird dies deaktiviert.

  </Accordion>
  <Accordion title="Sitzungslebenszyklus und Audit">
    - Reine Heartbeat-Antworten halten die Sitzung **nicht** aktiv. Heartbeat-Metadaten können die Sitzungszeile aktualisieren, aber für den Ablauf wegen Inaktivität wird `lastInteractionAt` aus der letzten echten Benutzer-/Kanalnachricht verwendet und für den täglichen Ablauf `sessionStartedAt`.
    - Der Verlauf in Control UI und WebChat blendet Heartbeat-Prompts und reine OK-Bestätigungen aus. Das zugrunde liegende Sitzungsprotokoll kann diese Durchläufe weiterhin zu Audit- und Wiedergabezwecken enthalten.
    - Abgekoppelte [Hintergrundaufgaben](/de/automation/tasks) können ein Systemereignis in die Warteschlange einreihen und den Heartbeat aktivieren, wenn die Hauptsitzung schnell auf etwas aufmerksam gemacht werden soll. Diese Aktivierung macht die Heartbeat-Ausführung nicht zu einer Hintergrundaufgabe.

  </Accordion>
</AccordionGroup>

## Sichtbarkeitssteuerung

Standardmäßig werden `HEARTBEAT_OK`-Bestätigungen unterdrückt, während Warninhalte zugestellt werden. Sie können dies pro Kanal oder pro Konto anpassen:

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

Priorität: pro Konto → pro Kanal → Kanalstandards → integrierte Standards.

### Funktion der einzelnen Flags

- `showOk`: Sendet eine `HEARTBEAT_OK`-Bestätigung, wenn das Modell eine reine OK-Antwort zurückgibt.
- `showAlerts`: Sendet den Warninhalt, wenn das Modell keine OK-Antwort zurückgibt.
- `useIndicator`: Gibt Indikatorereignisse für UI-Statusoberflächen aus.

Wenn **alle drei** auf „false“ gesetzt sind, überspringt OpenClaw die Heartbeat-Ausführung vollständig (kein Modellaufruf).

### Beispiele für Einstellungen pro Kanal und pro Konto

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

| Ziel                                          | Konfiguration                                                                            |
| --------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Standardverhalten (stille OKs, Warnungen ein) | _(keine Konfiguration erforderlich)_                                                     |
| Vollständig still (keine Nachrichten, kein Indikator) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Nur Indikator (keine Nachrichten)             | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OKs nur in einem Kanal                        | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (optional)

Wenn im Arbeitsbereich eine Datei `HEARTBEAT.md` vorhanden ist, weist der Standard-Prompt den Agenten an, sie zu lesen. Betrachten Sie sie als Ihre „Heartbeat-Checkliste“: klein, stabil und sicher genug, um sie alle 30 Minuten zu berücksichtigen.

Bei normalen Ausführungen wird `HEARTBEAT.md` nur eingefügt, wenn Heartbeat-Anweisungen für den Standard-Agenten aktiviert sind. Wenn Sie den Heartbeat-Takt mit `0m` deaktivieren oder `includeSystemPromptSection: false` festlegen, wird sie im normalen Bootstrap-Kontext weggelassen.

Im nativen Codex-Harness wird der Inhalt von `HEARTBEAT.md` nicht wie andere Bootstrap-Dateien in den Turn eingefügt. Wenn die Datei vorhanden ist und Inhalt enthält, der nicht nur aus Leerraum besteht, verweist ein Hinweis zum Heartbeat-Kollaborationsmodus Codex auf die Datei und weist Codex an, sie vor dem Fortfahren zu lesen.

Wenn `HEARTBEAT.md` vorhanden, aber praktisch leer ist (nur Leerzeilen, Markdown-/HTML-Kommentare, Markdown-Überschriften wie `# Heading`, Fence-Markierungen oder leere Checklisten-Platzhalter), überspringt OpenClaw die Heartbeat-Ausführung, um API-Aufrufe zu sparen. Dieses Überspringen wird als `reason=empty-heartbeat-file` gemeldet. Wenn die Datei fehlt, wird der Heartbeat dennoch ausgeführt, und das Modell entscheidet, was zu tun ist.

Halten Sie sie sehr klein (kurze Checkliste oder Erinnerungen), um den Prompt nicht unnötig aufzublähen.

Beispiel für `HEARTBEAT.md`:

```md
# Heartbeat-Checkliste

- Kurz prüfen: Gibt es etwas Dringendes in den Posteingängen?
- Wenn es tagsüber ist und nichts anderes ansteht, kurz und ohne großen Aufwand nachfragen.
- Wenn eine Aufgabe blockiert ist, notieren, _was fehlt_, und Peter beim nächsten Mal fragen.
```

### `tasks:`-Blöcke

`HEARTBEAT.md` unterstützt außerdem einen kleinen strukturierten `tasks:`-Block für intervallbasierte Prüfungen innerhalb des Heartbeats selbst.

Beispiel:

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "Auf dringende ungelesene E-Mails prüfen und alles als zeitkritisch kennzeichnen, was zeitnah bearbeitet werden muss."
- name: calendar-scan
  interval: 2h
  prompt: "Auf bevorstehende Besprechungen prüfen, die Vorbereitung oder Nachbereitung erfordern."

# Zusätzliche Anweisungen

- Warnmeldungen kurz halten.
- Wenn nach allen fälligen Aufgaben nichts Aufmerksamkeit erfordert, mit HEARTBEAT_OK antworten.
```

<AccordionGroup>
  <Accordion title="Verhalten">
    - OpenClaw analysiert den `tasks:`-Block und prüft jede Aufgabe anhand ihres eigenen `interval`.
    - Nur **fällige** Aufgaben werden für diesen Durchlauf in den Heartbeat-Prompt aufgenommen.
    - Wenn keine Aufgaben fällig sind, wird der Heartbeat vollständig übersprungen (`reason=no-tasks-due`), um einen unnötigen Modellaufruf zu vermeiden.
    - Inhalte in `HEARTBEAT.md`, die nicht zu Aufgaben gehören, bleiben erhalten und werden nach der Liste der fälligen Aufgaben als zusätzlicher Kontext angehängt.
    - Die Zeitstempel der letzten Aufgabenausführung werden im Sitzungsstatus (`heartbeatTaskState`) gespeichert, sodass Intervalle normale Neustarts überstehen.
    - Aufgabenzeitstempel werden erst aktualisiert, nachdem eine Heartbeat-Ausführung ihren normalen Antwortpfad abgeschlossen hat. Übersprungene Ausführungen mit `empty-heartbeat-file` / `no-tasks-due` markieren Aufgaben nicht als abgeschlossen.

  </Accordion>
</AccordionGroup>

Der Aufgabenmodus ist nützlich, wenn eine einzelne Heartbeat-Datei mehrere regelmäßige Prüfungen enthalten soll, ohne dass bei jedem Durchlauf alle ausgeführt werden müssen.

### Kann der Agent HEARTBEAT.md aktualisieren?

Ja – wenn Sie ihn darum bitten.

`HEARTBEAT.md` ist lediglich eine normale Datei im Arbeitsbereich des Agenten. Sie können dem Agenten daher (in einem normalen Chat) beispielsweise Folgendes mitteilen:

- „Aktualisiere `HEARTBEAT.md`, um eine tägliche Kalenderprüfung hinzuzufügen.“
- „Schreibe `HEARTBEAT.md` so um, dass die Datei kürzer ist und sich auf Nachfassaktionen im Posteingang konzentriert.“

Wenn dies proaktiv geschehen soll, können Sie außerdem eine ausdrückliche Zeile wie die folgende in Ihren Heartbeat-Prompt aufnehmen: „Wenn die Checkliste veraltet ist, aktualisiere HEARTBEAT.md mit einer besseren Version.“

<Warning>
Speichern Sie keine Geheimnisse (API-Schlüssel, Telefonnummern, private Token) in `HEARTBEAT.md` – die Datei wird Teil des Prompt-Kontexts.
</Warning>

## Manuelles Aufwecken (bei Bedarf)

Verwenden Sie `openclaw system event`, um ein Systemereignis in die Warteschlange zu stellen und optional sofort einen Heartbeat auszulösen:

```bash
openclaw system event --text "Auf dringende Nachfassaktionen prüfen" --mode now
```

| Flag                         | Beschreibung                                                                                                      |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `--text <text>`              | Text des Systemereignisses (erforderlich).                                                                        |
| `--mode <mode>`              | `now` führt sofort einen Heartbeat aus; `next-heartbeat` (Standard) wartet auf den nächsten geplanten Durchlauf.   |
| `--session-key <sessionKey>` | Richtet das Ereignis an eine bestimmte Sitzung; standardmäßig wird die Hauptsitzung des Agenten verwendet.         |
| `--json`                     | Gibt JSON aus.                                                                                                    |

Wenn kein `--session-key` angegeben ist und für mehrere Agenten `heartbeat` konfiguriert ist, führt `--mode now` die Heartbeats aller dieser Agenten sofort aus.

Zugehörige Heartbeat-Steuerelemente in derselben CLI-Gruppe:

```bash
openclaw system heartbeat last     # letztes Heartbeat-Ereignis anzeigen
openclaw system heartbeat enable   # Heartbeats aktivieren
openclaw system heartbeat disable  # Heartbeats deaktivieren
```

## Übermittlung der Reasoning-Ausgabe (optional)

Standardmäßig liefern Heartbeats nur die abschließende „Antwort“-Nutzlast.

Wenn Sie Transparenz wünschen, aktivieren Sie:

- `agents.defaults.heartbeat.includeReasoning: true`

Wenn diese Option aktiviert ist, liefern Heartbeats außerdem eine separate Nachricht mit dem Präfix `Thinking` (im selben Format wie `/reasoning on`). Dies kann nützlich sein, wenn der Agent mehrere Sitzungen/Codex-Instanzen verwaltet und Sie sehen möchten, warum er entschieden hat, Sie anzupingen – es kann jedoch auch mehr interne Details preisgeben, als Ihnen lieb ist. In Gruppenchats sollten Sie diese Option vorzugsweise deaktiviert lassen.

## Kostenbewusstsein

Heartbeats führen vollständige Agent-Durchläufe aus. Kürzere Intervalle verbrauchen mehr Token. So reduzieren Sie die Kosten:

- Verwenden Sie `isolatedSession: true`, damit nicht der vollständige Gesprächsverlauf gesendet wird (~100K Token werden auf ~2-5K pro Durchlauf reduziert).
- Verwenden Sie `lightContext: true`, um die Bootstrap-Dateien auf `HEARTBEAT.md` zu beschränken.
- Legen Sie ein günstigeres `model` fest (z. B. `ollama/llama3.2:1b`).
- Halten Sie `HEARTBEAT.md` klein.
- Verwenden Sie `target: "none"`, wenn Sie nur interne Statusaktualisierungen wünschen.

## Kontextüberlauf nach einem Heartbeat

Heartbeats behalten nach Abschluss des Durchlaufs das bestehende Laufzeitmodell der gemeinsam genutzten Sitzung bei. Daher kann ein Heartbeat, der eine Sitzung auf ein kleineres lokales Modell umgestellt hat (beispielsweise ein Ollama-Modell mit einem Kontextfenster von 32k), dieses Modell für den nächsten Durchlauf der Hauptsitzung beibehalten. Wenn dieser nächste Durchlauf dann einen Kontextüberlauf meldet und das letzte Laufzeitmodell der Sitzung dem konfigurierten `heartbeat.model` entspricht, nennt die Wiederherstellungsnachricht von OpenClaw das Übergreifen des Heartbeat-Modells als wahrscheinliche Ursache und schlägt eine Lösung vor.

Um dies zu vermeiden, verwenden Sie `isolatedSession: true`, damit Heartbeats in einer neuen Sitzung ausgeführt werden (optional in Kombination mit `lightContext: true` für den kleinstmöglichen Prompt), oder wählen Sie ein Heartbeat-Modell mit einem Kontextfenster, das groß genug für die gemeinsam genutzte Sitzung ist.

## Verwandte Themen

- [Automatisierung](/de/automation) – alle Automatisierungsmechanismen auf einen Blick
- [Hintergrundaufgaben](/de/automation/tasks) – wie losgelöste Arbeit nachverfolgt wird
- [Zeitzone](/de/concepts/timezone) – wie sich die Zeitzone auf die Heartbeat-Planung auswirkt
- [Fehlerbehebung](/de/automation/cron-jobs#troubleshooting) – Fehlerbehebung bei Automatisierungsproblemen
