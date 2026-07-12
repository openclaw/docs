---
read_when:
    - Heartbeat-Intervall oder Nachrichtenübermittlung anpassen
    - Entscheidung zwischen Heartbeat und Cron für geplante Aufgaben
sidebarTitle: Heartbeat
summary: Heartbeat-Abfragenachrichten und Benachrichtigungsregeln
title: Heartbeat
x-i18n:
    generated_at: "2026-07-12T01:38:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bc43539cde0bf4e00ee57d510d2188c4e7cc82d67e13b9f86ac5fc37c3c176d2
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat oder Cron?** Unter [Automatisierung](/de/automation) finden Sie Hinweise dazu, wann Sie welches verwenden sollten.
</Note>

Heartbeat führt in der Hauptsitzung **regelmäßige Agent-Durchläufe** aus, damit das Modell auf alles aufmerksam machen kann, was Ihre Beachtung erfordert, ohne Sie mit Nachrichten zu überhäufen.

Heartbeat ist ein geplanter Durchlauf der Hauptsitzung – dabei werden **keine** Datensätze für [Hintergrundaufgaben](/de/automation/tasks) erstellt. Aufgabendatensätze sind für entkoppelte Arbeiten vorgesehen (ACP-Durchläufe, Subagenten, isolierte Cron-Aufträge).

Fehlerbehebung: [Geplante Aufgaben](/de/automation/cron-jobs#troubleshooting)

## Schnellstart (für Einsteiger)

<Steps>
  <Step title="Intervall auswählen">
    Lassen Sie Heartbeats aktiviert (Standard ist `30m` beziehungsweise `1h`, wenn Anthropic-OAuth-/Token-Authentifizierung konfiguriert ist, einschließlich der Wiederverwendung der Claude CLI), oder legen Sie ein eigenes Intervall fest.
  </Step>
  <Step title="HEARTBEAT.md hinzufügen (optional)">
    Erstellen Sie im Agent-Arbeitsbereich eine kurze Checkliste in `HEARTBEAT.md` oder einen `tasks:`-Block.
  </Step>
  <Step title="Ziel für Heartbeat-Nachrichten festlegen">
    `target: "none"` ist die Standardeinstellung; legen Sie `target: "last"` fest, um Nachrichten an den letzten Kontakt weiterzuleiten.
  </Step>
  <Step title="Optionale Feinabstimmung">
    - Aktivieren Sie zur besseren Nachvollziehbarkeit die Übermittlung der Heartbeat-Begründung.
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
        directPolicy: "allow", // Standard: Direkt-/DM-Ziele zulassen; zum Unterdrücken "block" festlegen
        lightContext: true, // optional: aus Bootstrap-Dateien nur HEARTBEAT.md einfügen
        isolatedSession: true, // optional: bei jedem Durchlauf neue Sitzung (kein Gesprächsverlauf)
        skipWhenBusy: true, // optional: auch zurückstellen, wenn Subagent- oder verschachtelte Ausführungsspuren dieses Agenten beschäftigt sind
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // optional: zusätzlich separate `Thinking`-Nachricht senden
      },
    },
  },
}
```

## Standardwerte

- Intervall: `30m`. Beim Anwenden der Standardeinstellungen des Anthropic-Providers wird es auf `1h` erhöht, wenn der ermittelte Authentifizierungsmodus OAuth/Token ist (einschließlich der Wiederverwendung der Claude CLI), jedoch nur, solange `heartbeat.every` nicht festgelegt ist. Legen Sie `agents.defaults.heartbeat.every` oder agentenspezifisch `agents.list[].heartbeat.every` fest; mit `0m` deaktivieren Sie Heartbeat.
- Prompt-Inhalt (über `agents.defaults.heartbeat.prompt` konfigurierbar): `Lies HEARTBEAT.md, falls die Datei existiert (Arbeitsbereichskontext). Befolge sie strikt. Leite keine alten Aufgaben aus früheren Chats ab und wiederhole sie nicht. Wenn nichts beachtet werden muss, antworte mit HEARTBEAT_OK.`
- Zeitüberschreitung: Heartbeat-Durchläufe ohne festgelegten Wert verwenden `agents.defaults.timeoutSeconds`, sofern dieser Wert festgelegt ist. Andernfalls verwenden sie das Heartbeat-Intervall, begrenzt auf 600 Sekunden. Legen Sie für längere Heartbeat-Arbeiten `agents.defaults.heartbeat.timeoutSeconds` oder agentenspezifisch `agents.list[].heartbeat.timeoutSeconds` fest.
- Der Heartbeat-Prompt wird **unverändert** als Benutzernachricht gesendet. Der System-Prompt enthält nur dann einen Abschnitt „Heartbeats“, wenn Heartbeats für den Standard-Agenten aktiviert sind (und `includeSystemPromptSection` nicht `false` ist); außerdem wird der Durchlauf intern gekennzeichnet.
- Wenn Heartbeats mit `0m` deaktiviert sind, lassen normale Durchläufe `HEARTBEAT.md` ebenfalls aus dem Bootstrap-Kontext aus, damit das Modell keine ausschließlich für Heartbeat bestimmten Anweisungen sieht.
- Aktive Zeiten (`heartbeat.activeHours`) werden in der konfigurierten Zeitzone geprüft. Außerhalb des Zeitfensters werden Heartbeats bis zum nächsten Ausführungszeitpunkt innerhalb des Fensters übersprungen.
- Heartbeats werden automatisch zurückgestellt, während Cron-Arbeiten aktiv sind oder in der Warteschlange stehen. Legen Sie `heartbeat.skipWhenBusy: true` fest, um einen Agenten auch dann zurückzustellen, wenn sein eigener sitzungsschlüsselgebundener Subagent oder verschachtelte Befehlsausführungsspuren beschäftigt sind; nebengeordnete Agenten werden nicht mehr angehalten, nur weil ein anderer Agent laufende Subagent-Arbeiten hat.

## Zweck des Heartbeat-Prompts

Der Standard-Prompt ist bewusst allgemein gehalten:

- **Hintergrundaufgaben**: „Ausstehende Aufgaben berücksichtigen“ veranlasst den Agenten, Folgevorgänge (Posteingang, Kalender, Erinnerungen, Arbeiten in der Warteschlange) zu prüfen und auf Dringendes hinzuweisen.
- **Nachfrage beim Menschen**: „Erkundigen Sie sich tagsüber gelegentlich bei Ihrem Menschen“ regt zu einer gelegentlichen kurzen Nachricht wie „Benötigen Sie etwas?“ an, vermeidet jedoch nächtliche Nachrichten durch Verwendung Ihrer konfigurierten lokalen Zeitzone (siehe [Zeitzone](/de/concepts/timezone)).

Heartbeat kann auf abgeschlossene [Hintergrundaufgaben](/de/automation/tasks) reagieren, ein Heartbeat-Durchlauf selbst erstellt jedoch keinen Aufgabendatensatz.

Wenn ein Heartbeat etwas Bestimmtes tun soll (beispielsweise „Gmail-PubSub-Statistiken prüfen“ oder „Zustand des Gateways überprüfen“), legen Sie für `agents.defaults.heartbeat.prompt` (oder `agents.list[].heartbeat.prompt`) einen benutzerdefinierten Inhalt fest, der unverändert gesendet wird.

## Antwortvertrag

- Wenn nichts beachtet werden muss, antworten Sie mit **`HEARTBEAT_OK`**.
- Heartbeat-Durchläufe können stattdessen `heartbeat_respond` mit `notify: false` aufrufen, wenn keine sichtbare Aktualisierung erfolgen soll, oder `notify: true` zusammen mit `notificationText` für eine Warnung. Falls vorhanden, hat die strukturierte Tool-Antwort Vorrang vor dem textbasierten Rückfallwert.
- Während Heartbeat-Durchläufen behandelt OpenClaw `HEARTBEAT_OK` als Bestätigung, wenn es am **Anfang oder Ende** der Antwort steht. Das Token wird entfernt und die Antwort verworfen, wenn der verbleibende Inhalt **≤ `ackMaxChars`** ist (Standard: 300).
- Wenn `HEARTBEAT_OK` in der **Mitte** einer Antwort vorkommt, wird es nicht besonders behandelt.
- Fügen Sie bei Warnungen **kein** `HEARTBEAT_OK` ein; geben Sie nur den Warntext zurück.

Außerhalb von Heartbeats wird ein versehentlich am Anfang oder Ende einer Nachricht stehendes `HEARTBEAT_OK` entfernt und protokolliert; eine Nachricht, die ausschließlich aus `HEARTBEAT_OK` besteht, wird verworfen.

## Konfiguration

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // Standard: 30m (0m deaktiviert)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // Standard: false (separate Thinking-Nachricht zustellen, wenn verfügbar)
        lightContext: false, // Standard: false; bei true wird aus den Bootstrap-Dateien des Arbeitsbereichs nur HEARTBEAT.md beibehalten
        isolatedSession: false, // Standard: false; bei true läuft jeder Heartbeat in einer neuen Sitzung (kein Gesprächsverlauf)
        skipWhenBusy: false, // Standard: false; bei true wird auch auf Subagent-/verschachtelte Ausführungsspuren dieses Agenten gewartet
        target: "last", // Standard: none | Optionen: last | none | <channel id> (Kern oder Plugin, z. B. "imessage")
        to: "+15551234567", // optionale kanalspezifische Überschreibung
        accountId: "ops-bot", // optionale Kanal-ID für mehrere Konten
        prompt: "Lies HEARTBEAT.md, falls die Datei existiert (Arbeitsbereichskontext). Befolge sie strikt. Leite keine alten Aufgaben aus früheren Chats ab und wiederhole sie nicht. Wenn nichts beachtet werden muss, antworte mit HEARTBEAT_OK.",
        includeSystemPromptSection: true, // Standard: true; false lässt den System-Prompt-Abschnitt ## Heartbeats für den Standard-Agenten aus
        ackMaxChars: 300, // maximal zulässige Zeichenanzahl nach HEARTBEAT_OK
      },
    },
  },
}
```

### Geltungsbereich und Vorrang

- `agents.defaults.heartbeat` legt das globale Heartbeat-Verhalten fest.
- `agents.list[].heartbeat` wird darübergelegt; wenn irgendein Agent einen `heartbeat`-Block besitzt, führen **nur diese Agenten** Heartbeats aus.
- `channels.defaults.heartbeat` legt die Sichtbarkeitsstandardwerte für alle Kanäle fest.
- `channels.<channel>.heartbeat` überschreibt die Kanalstandardwerte.
- `channels.<channel>.accounts.<id>.heartbeat` (Kanäle mit mehreren Konten) überschreibt die kanalspezifischen Einstellungen.

### Agentenspezifische Heartbeats

Wenn irgendein Eintrag in `agents.list[]` einen `heartbeat`-Block enthält, führen **nur diese Agenten** Heartbeats aus. Der agentenspezifische Block wird über `agents.defaults.heartbeat` gelegt (Sie können gemeinsame Standardwerte also einmal festlegen und für einzelne Agenten überschreiben).

Beispiel: Zwei Agenten, nur der zweite Agent führt Heartbeats aus.

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
          prompt: "Lies HEARTBEAT.md, falls die Datei existiert (Arbeitsbereichskontext). Befolge sie strikt. Leite keine alten Aufgaben aus früheren Chats ab und wiederhole sie nicht. Wenn nichts beachtet werden muss, antworte mit HEARTBEAT_OK.",
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
        target: "last", // explizite Zustellung an den letzten Kontakt (Standard ist "none")
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

Außerhalb dieses Zeitfensters (vor 9 Uhr oder nach 22 Uhr Ostküstenzeit) werden Heartbeats übersprungen. Der nächste geplante Ausführungszeitpunkt innerhalb des Fensters wird normal ausgeführt.

### Rund-um-die-Uhr-Konfiguration

Wenn Heartbeats den ganzen Tag ausgeführt werden sollen, verwenden Sie eines dieser Muster:

- Lassen Sie `activeHours` vollständig weg (keine Zeitfensterbeschränkung; dies ist das Standardverhalten).
- Legen Sie ein ganztägiges Zeitfenster fest: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
Legen Sie für `start` und `end` nicht dieselbe Uhrzeit fest (beispielsweise `08:00` bis `08:00`). Dies wird als Zeitfenster ohne Dauer behandelt, sodass Heartbeats immer übersprungen werden.
</Warning>

### Beispiel für mehrere Konten

Verwenden Sie `accountId`, um auf Kanälen mit mehreren Konten wie Telegram ein bestimmtes Konto anzusprechen:

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
  Heartbeat-Intervall (Zeitdauerzeichenfolge; Standardeinheit = Minuten).
</ParamField>
<ParamField path="model" type="string">
  Optionale Modellüberschreibung für Heartbeat-Durchläufe (`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  Wenn aktiviert, wird auch die separate `Thinking`-Nachricht zugestellt, sofern verfügbar (dieselbe Struktur wie bei `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  Wenn `true`, verwenden Heartbeat-Durchläufe einen schlanken Bootstrap-Kontext und behalten aus den Bootstrap-Dateien des Arbeitsbereichs nur `HEARTBEAT.md` bei.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  Wenn `true`, läuft jeder Heartbeat in einer neuen Sitzung ohne vorherigen Gesprächsverlauf. Verwendet dasselbe Isolationsmuster wie Cron mit `sessionTarget: "isolated"`. Dies reduziert die Token-Kosten pro Heartbeat erheblich. Kombinieren Sie dies mit `lightContext: true`, um maximale Einsparungen zu erzielen. Die Zustellungsweiterleitung verwendet weiterhin den Kontext der Hauptsitzung.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  Wenn `true`, werden Heartbeat-Durchläufe bei zusätzlichen ausgelasteten Ausführungsspuren dieses Agenten zurückgestellt: seinem eigenen sitzungsschlüsselgebundenen Subagenten oder verschachtelten Befehlsarbeiten. Cron-Ausführungsspuren stellen Heartbeats auch ohne dieses Flag immer zurück, damit Hosts mit lokalen Modellen Cron- und Heartbeat-Prompts nicht gleichzeitig ausführen.
</ParamField>
<ParamField path="session" type="string">
  Optionaler Sitzungsschlüssel für Heartbeat-Durchläufe.

- `main` (Standard): Hauptsitzung des Agenten.
- Expliziter Sitzungsschlüssel (aus `openclaw sessions --json` oder der [Sitzungs-CLI](/de/cli/sessions) kopieren).
- Formate für Sitzungsschlüssel: siehe [Sitzungen](/de/concepts/session) und [Gruppen](/de/channels/groups).

</ParamField>
<ParamField path="target" type="string">
- `last`: an den zuletzt verwendeten externen Kanal zustellen.
- Expliziter Kanal: jeder konfigurierte Kanal oder jede Plugin-ID, beispielsweise `discord`, `matrix`, `telegram` oder `whatsapp`.
- `none` (Standard): Heartbeat ausführen, aber **nicht extern zustellen**.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  Steuert das Verhalten bei der Direkt-/DM-Zustellung. `allow`: Direkt-/DM-Zustellung von Heartbeats zulassen. `block`: Direkt-/DM-Zustellung unterdrücken (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  Optionale Überschreibung des Empfängers (kanalspezifische ID, z. B. E.164 für WhatsApp oder eine Telegram-Chat-ID). Verwenden Sie für Telegram-Themen/Threads `<chatId>:topic:<messageThreadId>`.

</ParamField>
<ParamField path="accountId" type="string">
  Optionale Konto-ID für Kanäle mit mehreren Konten. Bei `target: "last"` gilt die Konto-ID für den ermittelten letzten Kanal, sofern dieser Konten unterstützt; andernfalls wird sie ignoriert. Wenn die Konto-ID keinem konfigurierten Konto des ermittelten Kanals entspricht, wird die Zustellung übersprungen.

</ParamField>
<ParamField path="prompt" type="string">
  Überschreibt den standardmäßigen Prompt-Inhalt (wird nicht zusammengeführt).

</ParamField>
<ParamField path="includeSystemPromptSection" type="boolean" default="true">
  Legt fest, ob der System-Prompt-Abschnitt `## Heartbeats` des Standard-Agenten eingefügt wird. Setzen Sie den Wert auf `false`, um das Heartbeat-Laufzeitverhalten (Intervall, Zustellung, HEARTBEAT.md) beizubehalten und gleichzeitig die Heartbeat-Anweisungen aus dem System-Prompt des Agenten wegzulassen.

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  Maximale Anzahl der nach `HEARTBEAT_OK` vor der Zustellung zulässigen Zeichen.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  Unterdrückt bei Aktivierung Warnmeldungs-Nutzlasten zu Tool-Fehlern während Heartbeat-Ausführungen.

</ParamField>
<ParamField path="timeoutSeconds" type="number" default="global timeout or min(every, 600)">
  Maximale Anzahl von Sekunden, die ein Heartbeat-Agentendurchlauf dauern darf, bevor er abgebrochen wird. Lassen Sie den Wert ungesetzt, um `agents.defaults.timeoutSeconds` zu verwenden, sofern dieser Wert festgelegt ist; andernfalls wird das Heartbeat-Intervall auf höchstens 600 Sekunden begrenzt.

</ParamField>
<ParamField path="activeHours" type="object">
  Beschränkt Heartbeat-Ausführungen auf ein Zeitfenster. Objekt mit `start` (HH:MM, einschließlich; verwenden Sie `00:00` für den Tagesbeginn), `end` (HH:MM, ausschließlich; `24:00` ist für das Tagesende zulässig) und optional `timezone`.

- Nicht angegeben oder `"user"`: Verwendet Ihre Einstellung `agents.defaults.userTimezone`, sofern festgelegt; andernfalls wird auf die Zeitzone des Hostsystems zurückgegriffen.
- `"local"`: Verwendet immer die Zeitzone des Hostsystems.
- Beliebiger IANA-Bezeichner (z. B. `America/New_York`): Wird direkt verwendet; bei einem ungültigen Wert wird auf das oben beschriebene Verhalten von `"user"` zurückgegriffen.
- `start` und `end` dürfen für ein aktives Zeitfenster nicht gleich sein; gleiche Werte werden als Zeitfenster ohne Breite behandelt (immer außerhalb des Zeitfensters).
- Außerhalb des aktiven Zeitfensters werden Heartbeats bis zum nächsten Tick innerhalb des Zeitfensters übersprungen.

</ParamField>

## Zustellungsverhalten

<AccordionGroup>
  <Accordion title="Sitzungs- und Zielweiterleitung">
    - Heartbeats werden standardmäßig in der Hauptsitzung des Agenten ausgeführt (`agent:<id>:<mainKey>`) oder in `global`, wenn `session.scope = "global"` gilt. Legen Sie `session` fest, um stattdessen eine bestimmte Kanalsitzung (Discord/WhatsApp usw.) zu verwenden.
    - `session` wirkt sich nur auf den Ausführungskontext aus; die Zustellung wird durch `target` und `to` gesteuert.
    - Um an einen bestimmten Kanal/Empfänger zuzustellen, legen Sie `target` und `to` fest. Bei `target: "last"` verwendet die Zustellung den letzten externen Kanal dieser Sitzung.
    - Heartbeat-Zustellungen erlauben standardmäßig direkte Ziele bzw. Direktnachrichtenziele. Legen Sie `directPolicy: "block"` fest, um Sendungen an direkte Ziele zu unterdrücken, während der Heartbeat-Durchlauf weiterhin ausgeführt wird.
    - Wenn die Hauptwarteschlange, die Spur der Zielsitzung, die Cron-Spur oder ein aktiver Cron-Auftrag ausgelastet ist, wird der Heartbeat übersprungen und später erneut versucht.
    - Bei `skipWhenBusy: true` verschieben auch die sitzungsschlüsselgebundenen Subagenten- und verschachtelten Spuren dieses Agenten Heartbeat-Ausführungen. Ausgelastete Spuren anderer Agenten führen bei diesem Agenten zu keiner Verschiebung.
    - Wenn `target` kein externes Ziel ergibt, wird der Durchlauf dennoch ausgeführt, aber keine ausgehende Nachricht gesendet.

  </Accordion>
  <Accordion title="Sichtbarkeit und Überspringverhalten">
    - Wenn `showOk`, `showAlerts` und `useIndicator` alle deaktiviert sind, wird der Durchlauf von vornherein mit `reason=alerts-disabled` übersprungen.
    - Wenn nur die Zustellung von Warnungen deaktiviert ist, kann OpenClaw den Heartbeat dennoch ausführen, die Zeitstempel fälliger Aufgaben aktualisieren, den Leerlaufzeitstempel der Sitzung wiederherstellen und die nach außen gerichtete Warnungs-Nutzlast unterdrücken.
    - Wenn das ermittelte Heartbeat-Ziel eine Tippanzeige unterstützt, zeigt OpenClaw während der aktiven Heartbeat-Ausführung eine Tippanzeige an. Dabei wird dasselbe Ziel verwendet, an das der Heartbeat seine Chat-Ausgabe senden würde; mit `typingMode: "never"` wird dies deaktiviert.

  </Accordion>
  <Accordion title="Sitzungslebenszyklus und Audit">
    - Reine Heartbeat-Antworten halten die Sitzung **nicht** aktiv. Heartbeat-Metadaten können die Sitzungszeile aktualisieren, aber der Leerlaufablauf verwendet `lastInteractionAt` aus der letzten tatsächlichen Benutzer-/Kanalnachricht und der tägliche Ablauf verwendet `sessionStartedAt`.
    - Der Verlauf in der Control UI und in WebChat blendet Heartbeat-Prompts und reine OK-Bestätigungen aus. Das zugrunde liegende Sitzungsprotokoll kann diese Durchläufe weiterhin für Audits/Wiederholungen enthalten.
    - Losgelöste [Hintergrundaufgaben](/de/automation/tasks) können ein Systemereignis in die Warteschlange stellen und den Heartbeat aufwecken, wenn die Hauptsitzung schnell auf etwas aufmerksam gemacht werden soll. Dieses Aufwecken macht aus der Heartbeat-Ausführung keine Hintergrundaufgabe.

  </Accordion>
</AccordionGroup>

## Sichtbarkeitssteuerung

Standardmäßig werden `HEARTBEAT_OK`-Bestätigungen unterdrückt, während Warnungsinhalte zugestellt werden. Sie können dies pro Kanal oder pro Konto anpassen:

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

Priorität: pro Konto → pro Kanal → Kanalstandards → integrierte Standards.

### Funktion der einzelnen Optionen

- `showOk`: Sendet eine `HEARTBEAT_OK`-Bestätigung, wenn das Modell eine reine OK-Antwort zurückgibt.
- `showAlerts`: Sendet den Warnungsinhalt, wenn das Modell eine andere als eine OK-Antwort zurückgibt.
- `useIndicator`: Gibt Indikatorereignisse für UI-Statusoberflächen aus.

Wenn **alle drei** den Wert `false` haben, überspringt OpenClaw die Heartbeat-Ausführung vollständig (kein Modellaufruf).

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
      showOk: true # alle Slack-Konten
    accounts:
      ops:
        heartbeat:
          showAlerts: false # Warnungen nur für das Betriebskonto unterdrücken
  telegram:
    heartbeat:
      showOk: true
```

### Häufige Muster

| Ziel                                             | Konfiguration                                                                            |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Standardverhalten (stille OKs, Warnungen aktiv)  | _(keine Konfiguration erforderlich)_                                                     |
| Vollständig still (keine Nachrichten/Indikatoren) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Nur Indikator (keine Nachrichten)                | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OKs nur in einem Kanal                           | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (optional)

Wenn im Arbeitsbereich eine Datei `HEARTBEAT.md` vorhanden ist, weist der Standard-Prompt den Agenten an, sie zu lesen. Betrachten Sie sie als Ihre „Heartbeat-Checkliste“: klein, stabil und sicher genug, um sie alle 30 Minuten zu berücksichtigen.

Bei normalen Ausführungen wird `HEARTBEAT.md` nur eingefügt, wenn die Heartbeat-Anleitung für den Standard-Agenten aktiviert ist. Durch Deaktivieren des Heartbeat-Intervalls mit `0m` oder Festlegen von `includeSystemPromptSection: false` wird sie aus dem normalen Bootstrap-Kontext weggelassen.

In der nativen Codex-Laufzeitumgebung wird der Inhalt von `HEARTBEAT.md` nicht wie andere Bootstrap-Dateien in den Durchlauf eingefügt. Wenn die Datei vorhanden ist und Inhalt enthält, der nicht nur aus Leerraum besteht, verweist ein Hinweis zum Heartbeat-Zusammenarbeitsmodus Codex auf die Datei und weist Codex an, sie vor dem Fortfahren zu lesen.

Wenn `HEARTBEAT.md` vorhanden, aber praktisch leer ist (nur Leerzeilen, Markdown-/HTML-Kommentare, Markdown-Überschriften wie `# Heading`, Begrenzungsmarkierungen oder leere Checklisten-Platzhalter), überspringt OpenClaw die Heartbeat-Ausführung, um API-Aufrufe einzusparen. Dieses Überspringen wird als `reason=empty-heartbeat-file` gemeldet. Wenn die Datei fehlt, wird der Heartbeat dennoch ausgeführt und das Modell entscheidet, was zu tun ist.

Halten Sie sie sehr klein (kurze Checkliste oder Erinnerungen), um ein Aufblähen des Prompts zu vermeiden.

Beispiel für `HEARTBEAT.md`:

```md
# Heartbeat-Checkliste

- Kurzer Überblick: Gibt es etwas Dringendes in den Posteingängen?
- Wenn es tagsüber ist und nichts anderes ansteht, eine kurze, unkomplizierte Rückmeldung geben.
- Wenn eine Aufgabe blockiert ist, notieren, _was fehlt_, und Peter beim nächsten Mal fragen.
```

### `tasks:`-Blöcke

`HEARTBEAT.md` unterstützt außerdem einen kleinen strukturierten `tasks:`-Block für intervallbasierte Prüfungen innerhalb des Heartbeats selbst.

Beispiel:

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "Nach dringenden ungelesenen E-Mails suchen und alles Zeitkritische kennzeichnen."
- name: calendar-scan
  interval: 2h
  prompt: "Nach bevorstehenden Besprechungen suchen, die Vorbereitung oder Nachbereitung erfordern."

# Zusätzliche Anweisungen

- Warnungen kurz halten.
- Wenn nach allen fälligen Aufgaben nichts beachtet werden muss, mit HEARTBEAT_OK antworten.
```

<AccordionGroup>
  <Accordion title="Verhalten">
    - OpenClaw analysiert den `tasks:`-Block und prüft jede Aufgabe anhand ihres eigenen `interval`.
    - Nur **fällige** Aufgaben werden für diesen Tick in den Heartbeat-Prompt aufgenommen.
    - Wenn keine Aufgaben fällig sind, wird der Heartbeat vollständig übersprungen (`reason=no-tasks-due`), um einen unnötigen Modellaufruf zu vermeiden.
    - Inhalte in `HEARTBEAT.md`, die nicht zu Aufgaben gehören, bleiben erhalten und werden nach der Liste der fälligen Aufgaben als zusätzlicher Kontext angefügt.
    - Die Zeitstempel der letzten Aufgabenausführung werden im Sitzungsstatus (`heartbeatTaskState`) gespeichert, sodass die Intervalle normale Neustarts überstehen.
    - Aufgabenzeitstempel werden erst fortgeschrieben, nachdem eine Heartbeat-Ausführung ihren normalen Antwortpfad abgeschlossen hat. Übersprungene Ausführungen aufgrund von `empty-heartbeat-file` / `no-tasks-due` markieren Aufgaben nicht als abgeschlossen.

  </Accordion>
</AccordionGroup>

Der Aufgabenmodus ist nützlich, wenn Sie mehrere regelmäßige Prüfungen in einer einzigen Heartbeat-Datei verwalten möchten, ohne bei jedem Tick für alle Prüfungen zu bezahlen.

### Kann der Agent HEARTBEAT.md aktualisieren?

Ja – wenn Sie ihn darum bitten.

`HEARTBEAT.md` ist lediglich eine normale Datei im Arbeitsbereich des Agenten. Daher können Sie dem Agenten (in einem normalen Chat) beispielsweise Folgendes mitteilen:

- „Aktualisieren Sie `HEARTBEAT.md`, um eine tägliche Kalenderprüfung hinzuzufügen.“
- „Überarbeiten Sie `HEARTBEAT.md`, sodass die Datei kürzer ist und sich auf Nachfassaktionen im Posteingang konzentriert.“

Wenn dies proaktiv geschehen soll, können Sie außerdem eine ausdrückliche Zeile in Ihren Heartbeat-Prompt aufnehmen, beispielsweise: „Wenn die Checkliste veraltet ist, aktualisieren Sie HEARTBEAT.md mit einer besseren Version.“

<Warning>
Speichern Sie keine Geheimnisse (API-Schlüssel, Telefonnummern, private Tokens) in `HEARTBEAT.md` – die Datei wird Teil des Prompt-Kontexts.
</Warning>

## Manuelles Aufwecken (bei Bedarf)

Verwenden Sie `openclaw system event`, um ein Systemereignis in die Warteschlange zu stellen und optional sofort einen Heartbeat auszulösen:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

| Option                       | Beschreibung                                                                                                      |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `--text <text>`              | Text des Systemereignisses (erforderlich).                                                                        |
| `--mode <mode>`              | `now` führt sofort einen Heartbeat aus; `next-heartbeat` (Standard) wartet bis zum nächsten geplanten Tick.       |
| `--session-key <sessionKey>` | Richtet das Ereignis an eine bestimmte Sitzung; standardmäßig wird die Hauptsitzung des Agenten verwendet.        |
| `--json`                     | Gibt JSON aus.                                                                                                    |

Wenn kein `--session-key` angegeben ist und für mehrere Agenten `heartbeat` konfiguriert wurde, führt `--mode now` die Heartbeats all dieser Agenten sofort aus.

Zugehörige Heartbeat-Steuerelemente in derselben CLI-Gruppe:

```bash
openclaw system heartbeat last     # letztes Heartbeat-Ereignis anzeigen
openclaw system heartbeat enable   # Heartbeats aktivieren
openclaw system heartbeat disable  # Heartbeats deaktivieren
```

## Zustellung von Schlussfolgerungen (optional)

Standardmäßig liefern Heartbeats nur die abschließende „Antwort“-Nutzlast.

Wenn Sie Transparenz wünschen, aktivieren Sie:

- `agents.defaults.heartbeat.includeReasoning: true`

Wenn diese Option aktiviert ist, liefern Heartbeats außerdem eine separate Nachricht mit dem Präfix `Thinking` (im selben Format wie bei `/reasoning on`). Dies kann hilfreich sein, wenn der Agent mehrere Sitzungen/Codex-Instanzen verwaltet und Sie nachvollziehen möchten, warum er sich bei Ihnen gemeldet hat. Es kann jedoch auch mehr interne Details preisgeben, als Sie möchten. Lassen Sie diese Option in Gruppenchats vorzugsweise deaktiviert.

## Kostenbewusstsein

Heartbeats führen vollständige Agent-Durchläufe aus. Kürzere Intervalle verbrauchen mehr Tokens. So reduzieren Sie die Kosten:

- Verwenden Sie `isolatedSession: true`, damit nicht der vollständige Gesprächsverlauf gesendet wird (Reduzierung von etwa 100.000 Tokens auf etwa 2.000–5.000 pro Durchlauf).
- Verwenden Sie `lightContext: true`, um die Bootstrap-Dateien auf `HEARTBEAT.md` zu beschränken.
- Legen Sie ein günstigeres `model` fest (z. B. `ollama/llama3.2:1b`).
- Halten Sie `HEARTBEAT.md` klein.
- Verwenden Sie `target: "none"`, wenn Sie nur interne Statusaktualisierungen wünschen.

## Kontextüberlauf nach einem Heartbeat

Heartbeats behalten nach Abschluss des Durchlaufs das bestehende Laufzeitmodell der gemeinsamen Sitzung bei. Daher kann ein Heartbeat, der eine Sitzung auf ein kleineres lokales Modell umgestellt hat (beispielsweise ein Ollama-Modell mit einem Kontextfenster von 32.000 Tokens), dieses Modell für den nächsten Durchlauf der Hauptsitzung beibehalten. Wenn dieser nächste Durchlauf daraufhin einen Kontextüberlauf meldet und das letzte Laufzeitmodell der Sitzung dem konfigurierten `heartbeat.model` entspricht, nennt die Wiederherstellungsnachricht von OpenClaw das Übergreifen des Heartbeat-Modells als wahrscheinliche Ursache und schlägt eine Lösung vor.

Um dies zu vermeiden, verwenden Sie `isolatedSession: true`, damit Heartbeats in einer neuen Sitzung ausgeführt werden (optional zusammen mit `lightContext: true` für den kleinstmöglichen Prompt), oder wählen Sie ein Heartbeat-Modell mit einem Kontextfenster, das groß genug für die gemeinsame Sitzung ist.

## Verwandte Themen

- [Automatisierung](/de/automation) – alle Automatisierungsmechanismen auf einen Blick
- [Hintergrundaufgaben](/de/automation/tasks) – wie entkoppelte Arbeit nachverfolgt wird
- [Zeitzone](/de/concepts/timezone) – wie sich die Zeitzone auf die Heartbeat-Planung auswirkt
- [Fehlerbehebung](/de/automation/cron-jobs#troubleshooting) – Fehlerdiagnose bei Automatisierungsproblemen
