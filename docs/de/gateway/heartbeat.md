---
read_when:
    - Heartbeat-Takt oder Nachrichtenübermittlung anpassen
    - Entscheidung zwischen Heartbeat und Cron für geplante Aufgaben
sidebarTitle: Heartbeat
summary: Heartbeat-Abfragenachrichten und Benachrichtigungsregeln
title: Heartbeat
x-i18n:
    generated_at: "2026-07-24T04:34:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 39b03b0c68dc7392d9750ebcd1a7253d65064811e1974184955ce71dbeafdeda
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat oder Cron?** Unter [Automatisierung](/de/automation) finden Sie Hinweise dazu, wann Sie welche Option verwenden sollten.
</Note>

Heartbeat führt in der Hauptsitzung **regelmäßige Agent-Durchläufe** aus, damit das Modell auf alles aufmerksam machen kann, was Beachtung erfordert, ohne Sie mit Nachrichten zu überhäufen.

Heartbeat ist ein geplanter Durchlauf der Hauptsitzung – dabei werden **keine** Datensätze für [Hintergrundaufgaben](/de/automation/tasks) erstellt. Aufgabendatensätze sind für entkoppelte Arbeiten vorgesehen (ACP-Ausführungen, Subagenten, isolierte Cron-Jobs).

Intern wird das Heartbeat-Intervall vom Cron-Scheduler verwaltet: Der Gateway verwaltet pro Agent mit aktiviertem Heartbeat einen systemeigenen Cron-Job (in `openclaw cron list --all` als `Heartbeat (agent-id)` sichtbar). Die Heartbeat-Konfiguration bleibt die Eingabe für den gewünschten Zustand, während der persistierte Überwachungszeitplan den tatsächlichen Takt und die anschließende Abkühlphase des Runners steuert. Der Gateway übernimmt Konfigurationsänderungen beim Start und beim erneuten Laden der Konfiguration; `openclaw doctor --fix` kann fehlende oder veraltete Überwachungszeilen vor dem nächsten Start des Gateways erzeugen. Bearbeiten Sie `agents.*.heartbeat`, nicht den Cron-Job.

Geplante Heartbeats benötigen Cron. Wenn `cron.enabled` auf `false` oder `OPENCLAW_SKIP_CRON=1` gesetzt ist, protokolliert der Gateway beim Start eine Warnung und führt keine geplanten Heartbeats aus; manuelle und ereignisgesteuerte Heartbeat-Aktivierungen bleiben verfügbar. Es gibt keinen separaten Heartbeat-Ausweich-Timer.

Fehlerbehebung: [Geplante Aufgaben](/de/automation/cron-jobs#troubleshooting)

## Schnellstart (Einsteiger)

<Steps>
  <Step title="Intervall auswählen">
    Lassen Sie Heartbeats aktiviert (Standard ist `30m` oder `1h`, wenn Anthropic-OAuth-/Token-Authentifizierung konfiguriert ist, einschließlich der Wiederverwendung der Claude CLI), oder legen Sie ein eigenes Intervall fest.
  </Step>
  <Step title="Überwachungsnotizen hinzufügen (optional)">
    Speichern Sie mit `openclaw cron scratch <jobId> --set "..."` eine kurze Checkliste in den Notizen der Heartbeat-Überwachung.
  </Step>
  <Step title="Ziel für Heartbeat-Nachrichten festlegen">
    `target: "none"` ist der Standard; legen Sie `target: "last"` fest, um Nachrichten an den letzten Kontakt weiterzuleiten.
  </Step>
  <Step title="Optionale Feinabstimmung">
    - Verwenden Sie einen leichtgewichtigen Bootstrap-Kontext, wenn Heartbeat-Ausführungen nur die Überwachungsnotizen benötigen.
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
        directPolicy: "allow", // Standard: direkte/DM-Ziele zulassen; zum Unterdrücken auf "block" setzen
        lightContext: true, // optional: Workspace-Bootstrap-Dateien bei Heartbeat-Ausführungen überspringen
        isolatedSession: true, // optional: bei jeder Ausführung eine neue Sitzung (kein Gesprächsverlauf)
        // activeHours: { start: "08:00", end: "24:00" },
      },
    },
  },
}
```

## Standardwerte

- Intervall: `30m`. Durch Anwenden der Anthropic-Provider-Standardwerte wird dieses auf `1h` erhöht, wenn der aufgelöste Authentifizierungsmodus OAuth/Token ist (einschließlich der Wiederverwendung der Claude CLI), jedoch nur, solange `heartbeat.every` nicht gesetzt ist. Legen Sie `agents.defaults.heartbeat.every` oder agentenspezifisch `agents.entries.*.heartbeat.every` fest; verwenden Sie `0m` zum Deaktivieren.
- Prompt-Inhalt (über `agents.defaults.heartbeat.prompt` konfigurierbar): `Follow the heartbeat monitor scratch context when provided. Recurring tasks are cron jobs; create or change their schedules with cron tools or the openclaw cron CLI, not heartbeat scratch. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Zeitüberschreitung: Heartbeat-Durchläufe ohne festgelegten Wert verwenden `agents.defaults.timeoutSeconds`, wenn dieser Wert gesetzt ist. Andernfalls verwenden sie das Heartbeat-Intervall, begrenzt auf 600 Sekunden. Legen Sie `agents.defaults.heartbeat.timeoutSeconds` oder agentenspezifisch `agents.entries.*.heartbeat.timeoutSeconds` für längere Heartbeat-Arbeiten fest.
- Der Heartbeat-Prompt wird **wortgetreu** als Benutzernachricht gesendet. Der System-Prompt enthält einen Abschnitt „Heartbeats“, wenn Heartbeats für den Standard-Agent aktiviert sind, und die Ausführung wird intern gekennzeichnet.
- Wenn Heartbeats mit `0m` deaktiviert werden, bleibt der Überwachungs-Cron-Job bestehen, wird jedoch deaktiviert, und seine Notizen bleiben erhalten, bis Sie das Intervall wieder aktivieren.
- Wenn Cron selbst deaktiviert ist, werden geplante Heartbeats nicht ausgeführt, auch wenn das Heartbeat-Intervall weiterhin aktiviert ist.
- Aktive Zeiten (`heartbeat.activeHours`) werden in der konfigurierten Zeitzone geprüft. Außerhalb des Zeitfensters werden Heartbeats bis zum nächsten Takt innerhalb des Zeitfensters übersprungen.
- Heartbeats werden automatisch zurückgestellt, während Cron-Arbeit aktiv ist oder in der Warteschlange steht oder während sitzungsschlüsselgebundene Subagenten- oder verschachtelte Befehls-Lanes dieses Agenten ausgelastet sind. Gleichgeordnete Agenten pausieren einander nicht.

## Zweck des Heartbeat-Prompts

Der Standard-Prompt ist bewusst allgemein gehalten:

- **Hintergrundaufgaben**: „Ausstehende Aufgaben berücksichtigen“ regt den Agenten dazu an, Folgeaktivitäten zu prüfen (Posteingang, Kalender, Erinnerungen, Arbeiten in der Warteschlange) und auf dringende Punkte hinzuweisen.
- **Nachfrage beim Menschen**: „Gelegentlich tagsüber nach dem Menschen sehen“ regt zu einer gelegentlichen kurzen Nachricht wie „Benötigen Sie etwas?“ an, vermeidet jedoch nächtliche Nachrichtenfluten, indem Ihre konfigurierte lokale Zeitzone verwendet wird (siehe [Zeitzone](/de/concepts/timezone)).

Heartbeat kann auf abgeschlossene [Hintergrundaufgaben](/de/automation/tasks) reagieren, aber eine Heartbeat-Ausführung selbst erstellt keinen Aufgabendatensatz.

Wenn ein Heartbeat etwas sehr Bestimmtes ausführen soll (z. B. „Gmail-PubSub-Statistiken prüfen“ oder „Funktionszustand des Gateways überprüfen“), legen Sie `agents.defaults.heartbeat.prompt` (oder `agents.entries.*.heartbeat.prompt`) auf einen benutzerdefinierten Inhalt fest (wird wortgetreu gesendet).

## Antwortvertrag

- Wenn nichts beachtet werden muss, antworten Sie mit **`HEARTBEAT_OK`**.
- Heartbeat-Ausführungen können stattdessen `heartbeat_respond` mit `notify: false` für keine sichtbare Aktualisierung oder `notify: true` zusammen mit `notificationText` für eine Warnmeldung aufrufen. Falls vorhanden, hat die strukturierte Werkzeugantwort Vorrang vor dem Text-Ausweichwert.
- Ein aussagekräftiges `heartbeat_respond`-Ergebnis mit `notify: false` bleibt unsichtbar, wird jedoch als begrenzter interner Kontext für den nächsten Benutzerdurchlauf in dieser Sitzung gespeichert. `no_change`-Bestätigungen und sichtbare Benachrichtigungen werden nicht auf diese Weise gespeichert.
- Während Heartbeat-Ausführungen behandelt OpenClaw `HEARTBEAT_OK` als Bestätigung, wenn es am **Anfang oder Ende** der Antwort erscheint. Das Token wird entfernt und die Antwort verworfen, wenn der verbleibende Inhalt höchstens 300 Zeichen umfasst.
- Wenn `HEARTBEAT_OK` in der **Mitte** einer Antwort erscheint, wird es nicht besonders behandelt.
- Fügen Sie bei Warnmeldungen `HEARTBEAT_OK` **nicht** ein; geben Sie nur den Warntext zurück.

Außerhalb von Heartbeats wird ein unbeabsichtigtes `HEARTBEAT_OK` am Anfang/Ende einer Nachricht entfernt und protokolliert; eine Nachricht, die nur aus `HEARTBEAT_OK` besteht, wird verworfen.

## Konfiguration

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // Standard: 30m (0m deaktiviert)
        model: "anthropic/claude-opus-4-6",
        lightContext: false, // Standard: false; true überspringt Workspace-Bootstrap-Dateien bei Heartbeat-Ausführungen
        isolatedSession: false, // Standard: false; true führt jeden Heartbeat in einer neuen Sitzung aus (kein Gesprächsverlauf)
        target: "last", // Standard: none | Optionen: last | none | <channel id> (Kern oder Plugin, z. B. "imessage")
        to: "+15551234567", // optionale kanalspezifische Überschreibung
        accountId: "ops-bot", // optionale Kanal-ID bei mehreren Konten
        prompt: "Folgen Sie dem Notizkontext der Heartbeat-Überwachung, sofern er bereitgestellt wird. Wiederkehrende Aufgaben sind Cron-Jobs; erstellen oder ändern Sie deren Zeitpläne mit Cron-Werkzeugen oder der openclaw cron CLI, nicht mit Heartbeat-Notizen. Leiten Sie keine alten Aufgaben aus früheren Chats ab und wiederholen Sie sie nicht. Wenn nichts beachtet werden muss, antworten Sie mit HEARTBEAT_OK.",
      },
    },
  },
}
```

### Geltungsbereich und Rangfolge

- `agents.defaults.heartbeat` legt das globale Heartbeat-Verhalten fest.
- `agents.entries.*.heartbeat` wird darübergelegt; wenn ein Agent einen `heartbeat`-Block besitzt, führen **nur diese Agenten** Heartbeats aus.
- `channels.defaults.heartbeatVisibility` legt die Standardsichtbarkeit für alle Kanäle fest.
- `channels.<channel>.heartbeatVisibility` überschreibt die Kanalstandardwerte.
- `channels.<channel>.accounts.<id>.heartbeatVisibility` (Kanäle mit mehreren Konten) überschreibt die kanalspezifischen Einstellungen.

### Agentenspezifische Heartbeats

Wenn ein `agents.entries.*`-Eintrag einen `heartbeat`-Block enthält, führen **nur diese Agenten** Heartbeats aus. Der agentenspezifische Block wird über `agents.defaults.heartbeat` gelegt (sodass Sie gemeinsame Standardwerte einmal festlegen und agentenspezifisch überschreiben können).

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
          prompt: "Folgen Sie dem Notizkontext der Heartbeat-Überwachung, sofern er bereitgestellt wird. Wiederkehrende Aufgaben sind Cron-Jobs; erstellen oder ändern Sie deren Zeitpläne mit Cron-Werkzeugen oder der openclaw cron CLI, nicht mit Heartbeat-Notizen. Leiten Sie keine alten Aufgaben aus früheren Chats ab und wiederholen Sie sie nicht. Wenn nichts beachtet werden muss, antworten Sie mit HEARTBEAT_OK.",
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
          timezone: "America/New_York", // optional; verwendet Ihre userTimezone, falls gesetzt, andernfalls die Zeitzone des Hosts
        },
      },
    },
  },
}
```

Außerhalb dieses Zeitfensters (vor 9 Uhr oder nach 22 Uhr Eastern Time) werden Heartbeats übersprungen. Der nächste geplante Takt innerhalb des Zeitfensters wird normal ausgeführt.

### Einrichtung für 24/7

Wenn Heartbeats den ganzen Tag ausgeführt werden sollen, verwenden Sie eines dieser Muster:

- Lassen Sie `activeHours` vollständig weg (keine Beschränkung auf ein Zeitfenster; dies ist das Standardverhalten).
- Legen Sie ein ganztägiges Zeitfenster fest: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
Legen Sie für `start` und `end` nicht dieselbe Uhrzeit fest (beispielsweise `08:00` bis `08:00`). Dies wird als Zeitfenster mit einer Breite von null behandelt, sodass Heartbeats immer übersprungen werden.
</Warning>

### Beispiel mit mehreren Konten

Verwenden Sie `accountId`, um ein bestimmtes Konto auf Kanälen mit mehreren Konten wie Telegram anzusprechen:

```json5
{
  agents: {
    list: [
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "telegram",
          to: "12345678:topic:42", // optional: Weiterleitung an ein bestimmtes Thema/einen bestimmten Thread
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
  Heartbeat-Intervall (Zeitdauer-Zeichenfolge; Standardeinheit = Minuten).
</ParamField>
<ParamField path="model" type="string">
  Optionale Modellüberschreibung für Heartbeat-Ausführungen (`provider/model`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  Wenn dieser Wert „true“ ist, verwenden Heartbeat-Ausführungen einen leichtgewichtigen Bootstrap-Kontext und überspringen Workspace-Bootstrap-Dateien. Die Überwachungsnotizen werden in beiden Fällen vom Heartbeat-Runner eingefügt.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  Wenn dieser Wert „true“ ist, wird jeder Heartbeat in einer neuen Sitzung ohne vorherigen Gesprächsverlauf ausgeführt. Verwendet dasselbe Isolationsmuster wie Cron `sessionTarget: "isolated"`. Reduziert die Token-Kosten pro Heartbeat erheblich. Kombinieren Sie dies mit `lightContext: true`, um maximal zu sparen. Das Zustellungsrouting verwendet weiterhin den Kontext der Hauptsitzung.
</ParamField>
<ParamField path="session" type="string">
  Optionaler Sitzungsschlüssel für Heartbeat-Ausführungen.

- `main` (Standard): Hauptsitzung des Agenten.
- Expliziter Sitzungsschlüssel (aus `openclaw sessions --json` oder der [Sitzungs-CLI](/de/cli/sessions) kopieren).
- Formate für Sitzungsschlüssel: siehe [Sitzungen](/de/concepts/session) und [Gruppen](/de/channels/groups).

</ParamField>
<ParamField path="target" type="string">
- `last`: Zustellung an den zuletzt verwendeten externen Kanal.
- Expliziter Kanal: eine beliebige konfigurierte Kanal- oder Plugin-ID, zum Beispiel `discord`, `matrix`, `telegram` oder `whatsapp`.
- `none` (Standard): Heartbeat ausführen, aber **nicht extern zustellen**.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  Steuert das Zustellungsverhalten für Direktnachrichten/DMs. `allow`: Heartbeat-Zustellung per Direktnachricht/DM zulassen. `block`: Zustellung per Direktnachricht/DM unterdrücken (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  Optionale Überschreibung des Empfängers (kanalspezifische ID, z. B. E.164 für WhatsApp oder eine Telegram-Chat-ID). Verwenden Sie für Telegram-Themen/Threads `<chatId>:topic:<messageThreadId>`.

</ParamField>
<ParamField path="accountId" type="string">
  Optionale Konto-ID für Kanäle mit mehreren Konten. Bei `target: "last"` gilt die Konto-ID für den ermittelten letzten Kanal, sofern dieser Konten unterstützt; andernfalls wird sie ignoriert. Wenn die Konto-ID mit keinem konfigurierten Konto des ermittelten Kanals übereinstimmt, wird die Zustellung übersprungen.

</ParamField>
<ParamField path="prompt" type="string">
  Überschreibt den standardmäßigen Prompt-Inhalt (wird nicht zusammengeführt).

</ParamField>
<ParamField path="timeoutSeconds" type="number" default="global timeout or min(every, 600)">
  Maximale Anzahl von Sekunden, die ein Heartbeat-Agentendurchlauf dauern darf, bevor er abgebrochen wird. Lassen Sie den Wert ungesetzt, um `agents.defaults.timeoutSeconds` zu verwenden, sofern festgelegt; andernfalls wird das Heartbeat-Intervall mit einer Obergrenze von 600 Sekunden verwendet.

</ParamField>
<ParamField path="activeHours" type="object">
  Beschränkt Heartbeat-Ausführungen auf ein Zeitfenster. Objekt mit `start` (HH:MM, einschließlich; verwenden Sie `00:00` für den Tagesbeginn), `end` (HH:MM, ausschließlich; `24:00` für das Tagesende zulässig) und optional `timezone`.

- Nicht angegeben oder `"user"`: Verwendet Ihre Einstellung `agents.defaults.userTimezone`, sofern festgelegt; andernfalls wird auf die Zeitzone des Hostsystems zurückgegriffen.
- `"local"`: Verwendet immer die Zeitzone des Hostsystems.
- Beliebige IANA-Kennung (z. B. `America/New_York`): wird direkt verwendet; ist sie ungültig, wird auf das oben beschriebene Verhalten von `"user"` zurückgegriffen.
- `start` und `end` dürfen für ein aktives Zeitfenster nicht identisch sein; identische Werte werden als Zeitfenster der Breite null behandelt (immer außerhalb des Zeitfensters).
- Außerhalb des aktiven Zeitfensters werden Heartbeats bis zum nächsten Tick innerhalb des Zeitfensters übersprungen.

</ParamField>

## Zustellungsverhalten

<AccordionGroup>
  <Accordion title="Sitzungs- und Ziel-Routing">
    - Heartbeats werden standardmäßig in der Hauptsitzung des Agenten ausgeführt (`agent:<id>:<mainKey>`) oder in `global`, wenn `session.scope = "global"`. Legen Sie `session` fest, um stattdessen eine bestimmte Kanalsitzung (Discord/WhatsApp/usw.) zu verwenden.
    - `session` wirkt sich nur auf den Ausführungskontext aus; die Zustellung wird durch `target` und `to` gesteuert.
    - Legen Sie für die Zustellung an einen bestimmten Kanal/Empfänger `target` und `to` fest. Bei `target: "last"` verwendet die Zustellung den letzten externen Kanal dieser Sitzung.
    - Heartbeat-Zustellungen lassen Ziele für Direktnachrichten/DMs standardmäßig zu. Legen Sie `directPolicy: "block"` fest, um Sendungen an direkte Ziele zu unterdrücken und den Heartbeat-Durchlauf dennoch auszuführen.
    - Wenn die Hauptwarteschlange, die Ziel-Sitzungsspur, die Cron-Spur oder ein aktiver Cron-Auftrag ausgelastet ist, wird der Heartbeat übersprungen und später erneut versucht.
    - Wenn `target` kein externes Ziel ergibt, wird der Durchlauf dennoch ausgeführt, aber keine ausgehende Nachricht gesendet.

  </Accordion>
  <Accordion title="Sichtbarkeit und Überspringverhalten">
    - Wenn `showOk`, `showAlerts` und `useIndicator` alle deaktiviert sind, wird der Durchlauf von vornherein als `reason=alerts-disabled` übersprungen.
    - Wenn nur die Alarmzustellung deaktiviert ist, kann OpenClaw den Heartbeat dennoch ausführen, die Zeitstempel fälliger Aufgaben aktualisieren, den Leerlaufzeitstempel der Sitzung wiederherstellen und die nach außen gerichtete Alarmnutzlast unterdrücken.
    - Wenn das ermittelte Heartbeat-Ziel eine Tippanzeige unterstützt, zeigt OpenClaw diese während der aktiven Heartbeat-Ausführung an. Hierfür wird dasselbe Ziel verwendet, an das der Heartbeat seine Chat-Ausgabe senden würde; durch `typingMode: "never"` wird die Anzeige deaktiviert.

  </Accordion>
  <Accordion title="Sitzungslebenszyklus und Audit">
    - Reine Heartbeat-Antworten halten die Sitzung **nicht** aktiv. Heartbeat-Metadaten können den Sitzungsdatensatz aktualisieren, aber für den Ablauf wegen Inaktivität wird `lastInteractionAt` aus der letzten echten Benutzer-/Kanalnachricht verwendet und für den täglichen Ablauf `sessionStartedAt`.
    - Der Verlauf in Control UI und WebChat blendet Heartbeat-Prompts und reine OK-Bestätigungen aus. Das zugrunde liegende Sitzungsprotokoll kann diese Durchläufe für Audit/Wiedergabe weiterhin enthalten.
    - Abgekoppelte [Hintergrundaufgaben](/de/automation/tasks) können ein Systemereignis einreihen und den Heartbeat aktivieren, wenn die Hauptsitzung schnell auf etwas aufmerksam gemacht werden soll. Diese Aktivierung macht die Heartbeat-Ausführung nicht zu einer Hintergrundaufgabe.

  </Accordion>
</AccordionGroup>

## Sichtbarkeitssteuerung

Standardmäßig werden `HEARTBEAT_OK`-Bestätigungen unterdrückt, während Alarminhalte zugestellt werden. Sie können dies pro Kanal oder pro Konto anpassen:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # HEARTBEAT_OK ausblenden (Standard)
      showAlerts: true # Alarmmeldungen anzeigen (Standard)
      useIndicator: true # Indikatorereignisse ausgeben (Standard)
  telegram:
    heartbeat:
      showOk: true # OK-Bestätigungen in Telegram anzeigen
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # Alarmzustellung für dieses Konto unterdrücken
```

Priorität: pro Konto → pro Kanal → Kanalstandards → integrierte Standards.

### Funktion der einzelnen Flags

- `showOk`: Sendet eine `HEARTBEAT_OK`-Bestätigung, wenn das Modell eine reine OK-Antwort zurückgibt.
- `showAlerts`: Sendet den Alarminhalt, wenn das Modell eine andere Antwort als OK zurückgibt.
- `useIndicator`: Gibt Indikatorereignisse für UI-Statusoberflächen aus.

Wenn **alle drei** auf „false“ gesetzt sind, überspringt OpenClaw die Heartbeat-Ausführung vollständig (kein Modellaufruf).

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
          showAlerts: false # Alarme nur für das ops-Konto unterdrücken
  telegram:
    heartbeat:
      showOk: true
```

### Häufige Muster

| Ziel                                               | Konfiguration                                                                            |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Standardverhalten (stille OKs, Alarme aktiviert)   | _(keine Konfiguration erforderlich)_                                                     |
| Vollständig still (keine Nachrichten, kein Indikator) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Nur Indikator (keine Nachrichten)                  | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OKs nur in einem Kanal                             | `channels.telegram.heartbeat: { showOk: true }`                                          |

## Monitor-Arbeitsnotiz (optional)

Jeder Cron-Auftrag eines Heartbeat-Monitors besitzt ein privates Arbeitsdokument, das in der gemeinsamen Zustandsdatenbank gespeichert wird. Betrachten Sie es als Ihre „Heartbeat-Checkliste“: klein, stabil und geeignet, alle 30 Minuten berücksichtigt zu werden. Wenn eine Arbeitsnotiz vorhanden ist, wird ihr Inhalt an den Heartbeat-Prompt angehängt.

Verwalten Sie sie mit der Cron-CLI (die Auftrags-ID stammt aus `openclaw cron list --all`):

```bash
openclaw cron scratch <jobId>                 # aktuelle Arbeitsnotiz ausgeben
openclaw cron scratch <jobId> --set "..."     # durch den exakten Text ersetzen
openclaw cron scratch <jobId> --file notes.md # durch den Inhalt einer Datei ersetzen (- für stdin)
openclaw cron scratch <jobId> --unset         # entfernen
```

Schreibvorgänge sind durch Compare-and-Swap geschützt: Übergeben Sie `--expected-revision <n>`, damit der Vorgang fehlschlägt, statt eine gleichzeitige Änderung zu überschreiben. Die Arbeitsnotiz ist auf 256 KiB begrenzt und erscheint niemals in der Ausgabe von `cron list`/`cron runs`.

Der Agent kann auch seine eigene Arbeitsnotiz aktualisieren: Während eines Heartbeat-Durchlaufs akzeptiert `heartbeat_respond` eine optionale Zeichenfolge `scratch`, die die Arbeitsnotiz des Monitors für zukünftige Heartbeats vollständig ersetzt.

<Note>
**Migration von HEARTBEAT.md oder einem ausschließlich in der Konfiguration festgelegten Intervall?** Führen Sie `openclaw doctor --fix` aus. Doctor erstellt oder aktualisiert zunächst die systemeigenen Monitor-Datensätze anhand von `agents.*.heartbeat`, importiert anschließend die Datei `HEARTBEAT.md` aus dem Arbeitsbereich jedes Agenten in die Arbeitsnotiz des Monitors, wandelt alle gültigen alten `tasks:`-Einträge in Cron-Aufträge um, archiviert das Original im Zustandsverzeichnis (`backups/heartbeat-migration/`) und entfernt die Datei. Für ein stabiles Upgrade-Zeitfenster bleibt eine nicht migrierte alte Datei als schreibgeschützter Fallback erhalten, wenn keine Revision der Arbeitsnotiz vorhanden ist. Dabei weist eine Gateway-Warnung auf Doctor hin; neue Arbeitsbereiche und abgeschlossene Migrationen verwenden ausschließlich die Arbeitsnotiz aus der Datenbank.
</Note>

Wenn eine Arbeitsnotiz vorhanden, aber praktisch leer ist (nur Leerzeilen, Markdown-/HTML-Kommentare, Markdown-Überschriften wie `# Heading`, Begrenzungsmarkierungen oder leere Checklisten-Platzhalter), überspringt OpenClaw die Heartbeat-Ausführung, um API-Aufrufe einzusparen. Dieses Überspringen wird als `reason=empty-heartbeat-file` gemeldet. Wenn keine Arbeitsnotiz vorhanden ist, wird der Heartbeat dennoch ausgeführt und das Modell entscheidet, was zu tun ist.

Halten Sie sie klein (kurze Checkliste oder Erinnerungen), um ein unnötiges Anwachsen des Prompts zu vermeiden.

Beispiel für eine Arbeitsnotiz:

```md
# Heartbeat-Checkliste

- Kurz prüfen: Gibt es etwas Dringendes in den Posteingängen?
- Wenn es Tag ist und nichts anderes ansteht, kurz und mit geringem Aufwand nach dem Rechten sehen.
- Wenn eine Aufgabe blockiert ist, notieren, _was fehlt_, und Peter beim nächsten Mal fragen.
```

### Wiederkehrende Prüfungen mit Cron planen

Die Heartbeat-Arbeitsnotiz ist Prompt-Kontext und kein Planer. Erstellen Sie jede wiederkehrende Prüfung als [Cron-Auftrag](/de/automation/cron-jobs), damit sie über ein eigenes Intervall, einen eigenen Aktivierungsstatus und einen eigenen Ausführungsverlauf verfügt. Cron-Aufträge können weiterhin auf die Hauptsitzung zielen, wenn für die Prüfung der normale Gesprächskontext verwendet werden soll.

Ältere Arbeitsnotizen können einen strukturierten `tasks:`-Block enthalten. Führen Sie nach dem Upgrade einmal `openclaw doctor --fix` aus: Doctor wandelt jeden gültigen Eintrag in einen unabhängig geplanten Cron-Auftrag um, behält dessen Intervall und den bisherigen Zeitpunkt der letzten Ausführung bei und entfernt den ausgemusterten Block, während der umgebende Text der Arbeitsnotiz erhalten bleibt. Heartbeat-Ausführungen zur Laufzeit interpretieren `tasks:`-Text nicht als Zeitpläne.

Von Doctor erstellte Heartbeat-Aufgaben behalten die Schutzmechanismen für aktive Stunden, Abklingzeit, Überflutung und Auslastung des Heartbeats bei. Gleichzeitig fällige Aufträge können zu einem einzigen Heartbeat-Durchlauf zusammengefasst werden. Ein Termin außerhalb der aktiven Stunden wird übersprungen und beim nächsten Cron-Termin erneut versucht.

### Kann der Agent seine Arbeitsnotiz aktualisieren?

Ja. Während eines Heartbeat-Durchlaufs kann der Agent einen `scratch`-Wert an `heartbeat_respond` übergeben, um den Monitor-Text für zukünftige Heartbeats vollständig zu ersetzen. Sie können ihn auch in einem normalen Chat auffordern, `openclaw cron scratch <jobId> --set ...` auszuführen, oder die Arbeitsnotiz mit demselben Befehl selbst bearbeiten. Verwalten Sie wiederkehrende Zeitpläne mit Cron, statt Planersyntax in die Arbeitsnotiz zu schreiben.

<Warning>
Speichern Sie keine Geheimnisse (API-Schlüssel, Telefonnummern, private Token) in der Monitor-Arbeitsnotiz – sie werden Teil des Prompt-Kontexts.
</Warning>

## Manuelle Aktivierung (bei Bedarf)

Verwenden Sie `openclaw system event`, um ein Systemereignis einzureihen und optional sofort einen Heartbeat auszulösen:

```bash
openclaw system event --text "Auf dringende Nachfassaktionen prüfen" --mode now
```

| Flag                         | Beschreibung                                                                                      |
| ---------------------------- | ------------------------------------------------------------------------------------------------ |
| `--text <text>`              | Systemereignistext (erforderlich).                                                                    |
| `--mode <mode>`              | `now` führt sofort einen Heartbeat aus; `next-heartbeat` (Standard) wartet auf den nächsten geplanten Ausführungszeitpunkt. |
| `--session-key <sessionKey>` | Legt eine bestimmte Sitzung als Ziel des Ereignisses fest; standardmäßig wird die Hauptsitzung des Agenten verwendet.                   |
| `--json`                     | Gibt JSON aus.                                                                                     |

Wenn kein `--session-key` angegeben ist und für mehrere Agenten `heartbeat` konfiguriert ist, führt `--mode now` die Heartbeats aller dieser Agenten sofort aus.

Zugehörige Heartbeat-Steuerelemente in derselben CLI-Gruppe:

```bash
openclaw system heartbeat last     # letztes Heartbeat-Ereignis anzeigen
openclaw system heartbeat enable   # Heartbeats aktivieren
openclaw system heartbeat disable  # Heartbeats deaktivieren
```

## Kostenbewusstsein

Heartbeats führen vollständige Agentendurchläufe aus. Kürzere Intervalle verbrauchen mehr Token. So reduzieren Sie die Kosten:

- Verwenden Sie `isolatedSession: true`, damit nicht der vollständige Gesprächsverlauf gesendet wird (von ~100K Token auf ~2-5K pro Ausführung).
- Verwenden Sie `lightContext: true`, um Workspace-Bootstrap-Dateien bei Heartbeat-Ausführungen zu überspringen.
- Legen Sie ein günstigeres `model` fest (z. B. `ollama/llama3.2:1b`).
- Halten Sie den Arbeitsspeicher des Monitors klein.
- Verwenden Sie `target: "none"`, wenn Sie nur interne Statusaktualisierungen wünschen.

## Kontextüberlauf nach einem Heartbeat

Heartbeats behalten nach Abschluss der Ausführung das vorhandene Laufzeitmodell der gemeinsamen Sitzung bei. Daher kann ein Heartbeat, der eine Sitzung auf ein kleineres lokales Modell umgestellt hat (beispielsweise ein Ollama-Modell mit einem Kontextfenster von 32k), dieses Modell für den nächsten Durchlauf der Hauptsitzung aktiv lassen. Wenn dieser nächste Durchlauf dann einen Kontextüberlauf meldet und das zuletzt verwendete Laufzeitmodell der Sitzung mit dem konfigurierten `heartbeat.model` übereinstimmt, nennt die Wiederherstellungsmeldung von OpenClaw das Übergreifen des Heartbeat-Modells als wahrscheinliche Ursache und schlägt eine Korrektur vor.

So vermeiden Sie dies: Verwenden Sie `isolatedSession: true`, um Heartbeats in einer neuen Sitzung auszuführen (optional zusammen mit `lightContext: true` für den kleinstmöglichen Prompt), oder wählen Sie ein Heartbeat-Modell mit einem Kontextfenster, das groß genug für die gemeinsame Sitzung ist.

## Verwandte Themen

- [Automatisierung](/de/automation) – alle Automatisierungsmechanismen auf einen Blick
- [Hintergrundaufgaben](/de/automation/tasks) – wie abgekoppelte Arbeit nachverfolgt wird
- [Zeitzone](/de/concepts/timezone) – wie sich die Zeitzone auf die Heartbeat-Planung auswirkt
- [Fehlerbehebung](/de/automation/cron-jobs#troubleshooting) – Automatisierungsprobleme diagnostizieren
