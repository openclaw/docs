---
read_when:
    - Arbeiten an Telegram-Funktionen oder Webhooks
summary: Status, Funktionen und Konfiguration der Telegram-Bot-Unterstützung
title: Telegram
x-i18n:
    generated_at: "2026-07-16T12:31:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 51c155afeb147b92a55f181be269ce13c4fd6b609a94d680cd7e091cd4a7c236
    source_path: channels/telegram.md
    workflow: 16
---

Produktionsbereit für Bot-DMs und Gruppen über grammY. Long Polling ist der standardmäßige Transport; der Webhook-Modus ist optional.

<CardGroup cols={3}>
  <Card title="Kopplung" icon="link" href="/de/channels/pairing">
    Die standardmäßige DM-Richtlinie für Telegram ist die Kopplung.
  </Card>
  <Card title="Fehlerbehebung für Kanäle" icon="wrench" href="/de/channels/troubleshooting">
    Kanalübergreifende Diagnose- und Reparaturleitfäden.
  </Card>
  <Card title="Gateway-Konfiguration" icon="settings" href="/de/gateway/configuration">
    Vollständige Konfigurationsmuster und Beispiele für Kanäle.
  </Card>
</CardGroup>

## Schnelleinrichtung

<Steps>
  <Step title="Bot-Token in BotFather erstellen">
    Beide Abläufe führen zu einem Token, das Sie in OpenClaw einfügen – wählen Sie einen davon:

    - **Chat-Ablauf**: Öffnen Sie Telegram, beginnen Sie einen Chat mit **@BotFather** (vergewissern Sie sich, dass der Handle exakt `@BotFather` lautet), führen Sie `/newbot` aus, folgen Sie den Aufforderungen und speichern Sie das Token.
    - **Web-Ablauf**: Öffnen Sie [die Web-App von BotFather](https://t.me/BotFather?startapp) – sie funktioniert in jedem Telegram-Client, einschließlich [web.telegram.org](https://web.telegram.org) – erstellen Sie den Bot in der Benutzeroberfläche und kopieren Sie sein Token.

  </Step>

  <Step title="Token und DM-Richtlinie konfigurieren">

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "123:abc",
      dmPolicy: "pairing",
      groups: { "*": { requireMention: true } },
    },
  },
}
```

    Umgebungsvariablen-Fallback: `TELEGRAM_BOT_TOKEN` (nur Standardkonto; benannte Konten müssen `botToken` oder `tokenFile` verwenden).
    Telegram verwendet `openclaw channels login telegram` **nicht**; legen Sie das Token in der Konfiguration oder Umgebung fest und starten Sie anschließend das Gateway.

  </Step>

  <Step title="Gateway starten und erste DM genehmigen">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Kopplungscodes laufen nach 1 Stunde ab.

  </Step>

  <Step title="Bot zu einer Gruppe hinzufügen">
    Fügen Sie den Bot Ihrer Gruppe hinzu und ermitteln Sie anschließend die beiden IDs, die für den Gruppenzugriff erforderlich sind:

    - Ihre Telegram-Benutzer-ID für `allowFrom` / `groupAllowFrom`
    - die Telegram-Gruppenchat-ID als Schlüssel unter `channels.telegram.groups`

    Ermitteln Sie die Gruppenchat-ID über `openclaw logs --follow`, einen Bot für weitergeleitete IDs oder `getUpdates` der Bot API. Nachdem die Gruppe zugelassen wurde, bestätigt `/whoami@<bot_username>` die Benutzer- und Gruppen-IDs.

    Negative Supergruppen-IDs, die mit `-100` beginnen, sind Gruppenchat-IDs. Sie gehören unter `channels.telegram.groups`, nicht unter `groupAllowFrom`.

  </Step>
</Steps>

<Note>
Die Token-Auflösung berücksichtigt das Konto: `tokenFile` hat Vorrang vor `botToken`, dieses wiederum vor der Umgebung; die Konfiguration hat stets Vorrang vor `TELEGRAM_BOT_TOKEN` (das nur für das Standardkonto aufgelöst wird). Nach einem erfolgreichen Start speichert OpenClaw die Bot-Identität bis zu 24 Stunden im Cache, sodass bei Neustarts ein zusätzlicher Aufruf von `getMe` entfällt; durch Ändern oder Entfernen des Tokens wird dieser Cache geleert.
</Note>

## Telegram-seitige Einstellungen

<AccordionGroup>
  <Accordion title="Datenschutzmodus und Gruppensichtbarkeit">
    Telegram-Bots verwenden standardmäßig den **Privacy Mode**, der einschränkt, welche Gruppennachrichten sie empfangen.

    Um alle Gruppennachrichten zu sehen, können Sie entweder:

    - den Datenschutzmodus über `/setprivacy` deaktivieren oder
    - den Bot zum Gruppenadministrator machen.

    Nachdem Sie den Datenschutzmodus umgeschaltet haben, entfernen Sie den Bot aus jeder Gruppe und fügen Sie ihn erneut hinzu, damit Telegram die Änderung anwendet.

  </Accordion>

  <Accordion title="Gruppenberechtigungen">
    Der Administratorstatus wird in den Telegram-Gruppeneinstellungen festgelegt. Administrator-Bots empfangen alle Gruppennachrichten, was für ein dauerhaft aktives Gruppenverhalten nützlich ist.
  </Accordion>

  <Accordion title="Hilfreiche BotFather-Umschalter">

    - `/setjoingroups` – Hinzufügen zu Gruppen erlauben/verbieten
    - `/setprivacy` – Verhalten der Gruppensichtbarkeit

    Dieselben Einstellungen sind in [der Web-App von BotFather](https://t.me/BotFather?startapp) verfügbar, falls Sie eine Benutzeroberfläche gegenüber Chat-Befehlen bevorzugen.

  </Accordion>
</AccordionGroup>

## Dashboard-Mini-App

Führen Sie `/dashboard` in einer DM mit dem Bot aus, um das OpenClaw-Dashboard innerhalb von Telegram zu öffnen.

Voraussetzungen:

- `gateway.tailscale.mode: "serve"` oder `"funnel"` für die veröffentlichte HTTPS-URL der Mini-App.
- Ihre numerische Telegram-Benutzer-ID muss in der effektiven `allowFrom` des ausgewählten Kontos oder in `commands.ownerAllowFrom` enthalten sein.
- Verwenden Sie eine DM. In Gruppen antwortet `/dashboard` mit `open this in a DM with the bot` und sendet keine Schaltfläche.
- Docker-Installationen: Serve-/Funnel-Modi erfordern, dass das Gateway neben `tailscaled` an die Loopback-Schnittstelle gebunden ist; Bridge-Netzwerke mit veröffentlichten Ports können diese Anforderung nicht erfüllen. Führen Sie den Gateway-Container mit `network_mode: host` aus und binden Sie den Host-Socket `tailscaled` (`/var/run/tailscale`) sowie die CLI `tailscale` in den Container ein.

Die Mini-App ist ein ausschließlich für Tailscale vorgesehener v1-Pfad und unterstützt keinen Telegram-Web-iframe.

## Zugriffskontrolle und Aktivierung

### Bot-Identität in Gruppen

In Gruppen und Forenthemen richtet eine explizite Erwähnung des konfigurierten Bot-Handles (zum Beispiel `@my_bot`) die Nachricht an den ausgewählten OpenClaw-Agenten, selbst wenn sich der Persona-Name des Agenten vom Telegram-Benutzernamen unterscheidet. Die Richtlinie für das Schweigen in Gruppen gilt weiterhin für nicht zugehörigen Datenverkehr, aber der Bot-Handle selbst ist niemals „jemand anderes“.

<Tabs>
  <Tab title="DM-Richtlinie">
    `channels.telegram.dmPolicy` steuert den Zugriff auf Direktnachrichten:

    - `pairing` (Standard)
    - `allowlist` (erfordert mindestens eine Absender-ID in `allowFrom`)
    - `open` (erfordert, dass `allowFrom` den Wert `"*"` enthält)
    - `disabled`

    Mit `dmPolicy: "open"` und `allowFrom: ["*"]` kann jedes Telegram-Konto, das den Benutzernamen des Bots findet oder errät, dem Bot Befehle erteilen. Verwenden Sie dies nur für bewusst öffentliche Bots mit stark eingeschränkten Werkzeugen; Bots mit einem einzelnen Eigentümer sollten `allowlist` mit numerischen Benutzer-IDs verwenden.

    `channels.telegram.allowFrom` akzeptiert numerische Telegram-Benutzer-IDs. Die Präfixe `telegram:` / `tg:` werden akzeptiert und normalisiert.
    In Konfigurationen mit mehreren Konten bildet eine restriktive `channels.telegram.allowFrom` auf oberster Ebene eine Sicherheitsgrenze: Eine `allowFrom: ["*"]` auf Kontoebene macht dieses Konto nicht öffentlich, sofern die zusammengeführte effektive Zulassungsliste nicht weiterhin einen expliziten Platzhalter enthält.
    `dmPolicy: "allowlist"` mit leerer `allowFrom` blockiert alle DMs und wird von der Konfigurationsvalidierung abgelehnt.
    Die Einrichtung fragt ausschließlich nach numerischen Benutzer-IDs. Wenn Ihre Konfiguration Einträge in der Zulassungsliste `@username` aus einer älteren Einrichtung enthält, führen Sie `openclaw doctor --fix` aus, um sie nach Möglichkeit in numerische IDs aufzulösen (erfordert ein Telegram-Bot-Token).
    Falls Sie zuvor Zulassungslistendateien des Kopplungsspeichers verwendet haben, kann `openclaw doctor --fix` die Einträge für Zulassungslisten-Abläufe nach `channels.telegram.allowFrom` übernehmen (beispielsweise wenn `dmPolicy: "allowlist"` noch keine expliziten IDs enthält).

    Für Bots mit einem einzelnen Eigentümer ist `dmPolicy: "allowlist"` mit expliziten numerischen `allowFrom`-IDs den vorherigen Kopplungsgenehmigungen vorzuziehen.

    Häufiges Missverständnis: Die Genehmigung einer DM-Kopplung bedeutet nicht, dass „dieser Absender überall autorisiert ist“. Die Kopplung gewährt ausschließlich DM-Zugriff. Wenn noch kein Befehlseigentümer vorhanden ist, legt die erste genehmigte Kopplung außerdem `commands.ownerAllowFrom` fest und weist damit Befehlen, die nur dem Eigentümer vorbehalten sind, sowie Ausführungsgenehmigungen ein explizites Betreiberkonto zu. Die Autorisierung von Gruppenabsendern stammt weiterhin aus expliziten Zulassungslisten in der Konfiguration.
    Um mit einer Identität sowohl für DMs als auch für Gruppenbefehle autorisiert zu sein, tragen Sie Ihre numerische Telegram-Benutzer-ID in `channels.telegram.allowFrom` ein und stellen Sie für Befehle, die nur dem Eigentümer vorbehalten sind, sicher, dass `commands.ownerAllowFrom` den Wert `telegram:<your user id>` enthält.

    ### Ihre Telegram-Benutzer-ID ermitteln

    Sicherer (kein Drittanbieter-Bot): Senden Sie Ihrem Bot eine DM, führen Sie `openclaw logs --follow` aus und lesen Sie `from.id`.

    Offizielle Bot-API-Methode:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Drittanbieter (weniger vertraulich): `@userinfobot` oder `@getidsbot`.

  </Tab>

  <Tab title="Gruppenrichtlinie und Zulassungslisten">
    Zwei Steuerungen gelten gemeinsam:

    1. **Welche Gruppen sind zugelassen** (`channels.telegram.groups`)
       - keine `groups`-Konfiguration, `groupPolicy: "open"`: Jede Gruppe besteht die Prüfung der Gruppen-ID
       - keine `groups`-Konfiguration, `groupPolicy: "allowlist"` (Standard): Alle Gruppen werden blockiert, bis Sie `groups`-Einträge (oder `"*"`) hinzufügen
       - `groups` konfiguriert: fungiert als Zulassungsliste (explizite IDs oder `"*"`)

    2. **Welche Absender sind in Gruppen zugelassen** (`channels.telegram.groupPolicy`)
       - `open` / `allowlist` (Standard) / `disabled`

    `groupAllowFrom` filtert Gruppenabsender; wenn nicht festgelegt, greift Telegram auf `allowFrom` zurück (nicht auf den Kopplungsspeicher – die Authentifizierung von Gruppenabsendern übernimmt niemals Genehmigungen aus dem DM-Kopplungsspeicher; dies ist seit `2026.2.25` eine Sicherheitsgrenze).
    Einträge in `groupAllowFrom` sollten numerische Telegram-Benutzer-IDs sein (die Präfixe `telegram:` / `tg:` werden normalisiert); nicht numerische Einträge werden ignoriert. Tragen Sie hier keine Gruppen- oder Supergruppen-Chat-IDs ein – negative Chat-IDs gehören unter `channels.telegram.groups`.
    Praktisches Muster für Bots mit einem einzelnen Eigentümer: Legen Sie Ihre Benutzer-ID in `channels.telegram.allowFrom` fest, lassen Sie `groupAllowFrom` ungesetzt und lassen Sie die Zielgruppen unter `channels.telegram.groups` zu.
    Wenn `channels.telegram` vollständig in der Konfiguration fehlt, verwendet die Laufzeit standardmäßig das restriktive `groupPolicy="allowlist"`, sofern `channels.defaults.groupPolicy` nicht ausdrücklich festgelegt ist.

    Gruppeneinrichtung nur für den Eigentümer:

```json5
{
  channels: {
    telegram: {
      enabled: true,
      dmPolicy: "pairing",
      allowFrom: ["<YOUR_TELEGRAM_USER_ID>"],
      groupPolicy: "allowlist",
      groups: {
        "<GROUP_CHAT_ID>": {
          requireMention: true,
        },
      },
    },
  },
}
```

    Testen Sie aus der Gruppe mit `@<bot_username> ping`. Gewöhnliche Gruppennachrichten lösen den Bot nicht aus, solange `requireMention: true`.

    Jedes Mitglied in einer bestimmten Gruppe zulassen:

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          groupPolicy: "open",
          requireMention: false,
        },
      },
    },
  },
}
```

    Nur bestimmte Benutzer innerhalb einer bestimmten Gruppe zulassen:

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          requireMention: true,
          allowFrom: ["8734062810", "745123456"],
        },
      },
    },
  },
}
```

    <Warning>
      Häufiger Fehler: `groupAllowFrom` ist keine Gruppenzulassungsliste.

      - Negative Telegram-Gruppen-/Supergruppen-Chat-IDs (`-1001234567890`) gehören unter `channels.telegram.groups`.
      - Telegram-Benutzer-IDs (`8734062810`) gehören unter `groupAllowFrom`, um einzuschränken, welche Personen innerhalb einer zugelassenen Gruppe den Bot auslösen können.
      - Verwenden Sie `groupAllowFrom: ["*"]` nur, um jedem Mitglied einer zugelassenen Gruppe die Kommunikation mit dem Bot zu ermöglichen.

    </Warning>

  </Tab>

  <Tab title="Erwähnungsverhalten">
    Gruppenantworten erfordern standardmäßig eine Erwähnung. Eine Erwähnung kann aus Folgendem stammen:

    - einer nativen `@botusername`-Erwähnung oder
    - einem Erwähnungsmuster in `agents.list[].groupChat.mentionPatterns` oder `messages.groupChat.mentionPatterns`

    Umschalter auf Sitzungsebene (nur Zustand, nicht persistent gespeichert): `/activation always`, `/activation mention`. Verwenden Sie für dauerhafte Speicherung die Konfiguration:

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { requireMention: false },
      },
    },
  },
}
```

    Der Gruppenverlaufskontext ist stets aktiviert und durch `historyLimit` begrenzt. Legen Sie `channels.telegram.historyLimit: 0` fest, um das Gruppenverlaufsfenster zu deaktivieren. `openclaw doctor --fix` entfernt den außer Betrieb genommenen Schlüssel `includeGroupHistoryContext`.

    Gruppenchat-ID ermitteln: Leiten Sie eine Gruppennachricht an `@userinfobot` / `@getidsbot` weiter, lesen Sie `chat.id` aus `openclaw logs --follow`, prüfen Sie `getUpdates` der Bot API oder führen Sie – sobald die Gruppe zugelassen ist – `/whoami@<bot_username>` aus.

  </Tab>
</Tabs>

## Laufzeitverhalten

- Telegram wird innerhalb des Gateway-Prozesses ausgeführt.
- Das Routing ist deterministisch: Eingehende Telegram-Nachrichten werden über Telegram beantwortet (das Modell wählt keine Kanäle aus).
- Eingehende Nachrichten werden in den gemeinsamen Kanal-Umschlag mit Antwortmetadaten, Medienplatzhaltern und dauerhaft gespeichertem Antwortkettenkontext für Antworten normalisiert, die das Gateway beobachtet hat.
- Gruppensitzungen werden anhand der Gruppen-ID isoliert. Bei Forumsthemen wird `:topic:<threadId>` angehängt.
- DM-Nachrichten können `message_thread_id` enthalten; OpenClaw behält dies für Antworten bei. DM-Themensitzungen werden nur aufgeteilt, wenn Telegram `getMe` für den Bot als `has_topics_enabled: true` meldet; andernfalls verbleiben DMs in der flachen Sitzung.
- Long Polling verwendet den grammY-Runner mit einer Sequenzierung pro Chat und Thread. Die Nebenläufigkeit der Runner-Senke verwendet `agents.defaults.maxConcurrent`.
- Beim Start mit mehreren Konten wird die Anzahl gleichzeitiger `getMe`-Prüfungen begrenzt, damit bei großen Bot-Flotten nicht alle Kontoprüfungen gleichzeitig ausgeführt werden.
- Jeder Gateway-Prozess schützt das Long Polling, sodass jeweils nur ein aktiver Poller ein Bot-Token verwenden kann. Anhaltende `getUpdates`-409-Konflikte weisen auf ein anderes OpenClaw-Gateway, ein Skript oder einen externen Poller hin, das beziehungsweise der dasselbe Token verwendet.
- Der Polling-Watchdog führt standardmäßig nach 120 Sekunden ohne abgeschlossene `getUpdates`-Aktivitätsbestätigung einen Neustart durch. Erhöhen Sie `channels.telegram.pollingStallThresholdMs` (30000-600000, kontospezifische Überschreibungen werden unterstützt) nur, wenn es in Ihrer Bereitstellung während lang laufender Vorgänge zu fälschlichen Neustarts wegen eines vermeintlichen Polling-Stillstands kommt.
- Die Telegram Bot API unterstützt keine Lesebestätigungen (`sendReadReceipts` ist nicht anwendbar).

<Note>
  `channels.telegram.dm.threadReplies` und `channels.telegram.direct.<chatId>.threadReplies` wurden entfernt. Führen Sie nach dem Upgrade `openclaw doctor --fix` aus, wenn Ihre Konfiguration diese Schlüssel noch enthält. Das Routing von DM-Themen folgt nun Telegram `getMe.has_topics_enabled` (gesteuert durch den Thread-Modus von BotFather): Bots mit aktivierten Themen verwenden Thread-spezifische DM-Sitzungen, wenn Telegram `message_thread_id` sendet; andere DMs verbleiben in der flachen Sitzung.
</Note>

## Funktionsübersicht

<AccordionGroup>
  <Accordion title="Live-Stream-Vorschau (Nachrichtenbearbeitungen)">
    OpenClaw streamt Teilantworten in Echtzeit in Direktchats, Gruppen und Themen: Es sendet eine Vorschaunachricht, führt anschließend wiederholt `editMessageText` aus und schließt die Nachricht an Ort und Stelle ab.

    - `channels.telegram.streaming` ist `off | partial | block | progress` (Standard: `partial`)
    - Kurze Vorschauen der ersten Antwort werden entprellt und nach einer begrenzten Verzögerung erstellt, wenn die Ausführung noch aktiv ist
    - `progress` behält einen einzelnen bearbeitbaren Statusentwurf für den Werkzeugfortschritt bei, zeigt die stabile Statusbezeichnung an, wenn Antwortaktivität vor dem Werkzeugfortschritt eintritt, löscht ihn bei Abschluss und sendet die endgültige Antwort als normale Nachricht
    - `streaming.preview.toolProgress` steuert, ob Werkzeug-/Fortschrittsaktualisierungen dieselbe bearbeitete Vorschaunachricht wiederverwenden (Standard: `true`, wenn Vorschau-Streaming aktiv ist)
    - `streaming.preview.commandText` steuert Befehls-/Ausführungsdetails innerhalb dieser Zeilen: `raw` (Standard) oder `status` (nur Werkzeugbezeichnung)
    - `streaming.progress.commentary` (Standard: `false`) aktiviert Kommentar-/Präambeltext des Assistenten im temporären Fortschrittsentwurf
    - Veraltete `channels.telegram.streamMode`-, boolesche `streaming`-Werte und außer Betrieb genommene Schlüssel für native Entwurfsvorschauen werden erkannt; führen Sie `openclaw doctor --fix` aus, um sie zu migrieren

    Werkzeugfortschrittszeilen sind die kurzen Statusaktualisierungen, die während der Ausführung von Werkzeugen angezeigt werden (Befehlsausführung, Lesen von Dateien, Planungsaktualisierungen, Patch-Zusammenfassungen sowie Codex-Präambeln/-Kommentare im App-Server-Modus). Bei Telegram sind diese standardmäßig aktiviert (entspricht dem veröffentlichten Verhalten ab `v2026.4.22`).

    Antwortvorschau-Bearbeitungen beibehalten, aber Werkzeugfortschrittszeilen ausblenden:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": { "toolProgress": false }
          }
        }
      }
    }
    ```

    Werkzeugfortschritt sichtbar lassen, aber Befehls-/Ausführungstext ausblenden:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": { "commandText": "status" }
          }
        }
      }
    }
    ```

    Der Modus `progress` zeigt den Werkzeugfortschritt an, ohne die endgültige Antwort in diese Nachricht einzufügen. Legen Sie die Richtlinie für Befehlstext unter `streaming.progress` fest:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "progress",
            "progress": {
              "toolProgress": true,
              "commandText": "status"
            }
          }
        }
      }
    }
    ```

    `streaming.mode: "off"` deaktiviert Vorschaubearbeitungen und unterdrückt allgemeine Werkzeug-/Fortschrittsmeldungen, statt sie als eigenständige Statusnachrichten zu senden; Genehmigungsaufforderungen, Medien und Fehler werden weiterhin über die normale endgültige Zustellung weitergeleitet. `streaming.preview.toolProgress: false` behält nur die Bearbeitungen der Antwortvorschau bei.

    <Note>
      Antworten auf ausgewählte Zitate bilden die Ausnahme. Wenn `replyToMode` den Wert `first`, `all` oder `batched` hat und die eingehende Nachricht ausgewählten Zitattext enthält, sendet OpenClaw die endgültige Antwort über den nativen Telegram-Pfad für Zitatantworten, statt die Antwortvorschau zu bearbeiten. Daher kann `streaming.preview.toolProgress` in diesem Durchlauf keine Statuszeilen anzeigen. Antworten auf die aktuelle Nachricht ohne ausgewählten Zitattext werden weiterhin gestreamt. Legen Sie `replyToMode: "off"` fest, wenn die Sichtbarkeit des Werkzeugfortschritts wichtiger als native Zitatantworten ist, oder `streaming.preview.toolProgress: false`, um diesen Kompromiss zu akzeptieren.
    </Note>

    Bei reinen Textantworten erhalten kurze Vorschauen die endgültige Bearbeitung an Ort und Stelle; bei langen endgültigen Antworten, die in mehrere Nachrichten aufgeteilt werden, wird die Vorschau als erster Abschnitt wiederverwendet und anschließend nur der Rest gesendet; endgültige Antworten im Fortschrittsmodus löschen den Statusentwurf und verwenden die normale endgültige Zustellung; schlägt die endgültige Bearbeitung fehl, bevor der Abschluss bestätigt wurde, greift OpenClaw auf die normale endgültige Zustellung zurück und bereinigt die veraltete Vorschau. Bei komplexen Antworten (Mediennutzlasten) greift OpenClaw immer auf die normale endgültige Zustellung zurück und bereinigt die Vorschau.

    Vorschau-Streaming und Block-Streaming schließen sich gegenseitig aus — wenn Block-Streaming ausdrücklich aktiviert ist, überspringt OpenClaw den Vorschau-Stream, um doppeltes Streaming zu vermeiden.

    Schlussfolgerungen: `/reasoning stream` streamt Schlussfolgerungen während der Generierung in die Live-Vorschau und löscht die Schlussfolgerungsvorschau nach der endgültigen Zustellung (verwenden Sie `/reasoning on`, um sie sichtbar zu lassen). Die endgültige Antwort wird ohne Schlussfolgerungstext gesendet.

  </Accordion>

  <Accordion title="Formatierung umfangreicher Nachrichten">
    Ausgehender Text verwendet standardmäßig normale Telegram-HTML-Nachrichten, die in aktuellen Clients lesbar sind: fett, kursiv, Links, Code, Spoiler, Zitate — keine ausschließlich umfangreichen Blöcke der Bot API 10.2 (native Tabellen, Details, Rich Media, Formeln).

    Umfangreiche Nachrichten der Bot API 10.2 aktivieren:

```json5
{
  channels: {
    telegram: {
      richMessages: true,
    },
  },
}
```

    Wenn aktiviert: Der Agent wird darüber informiert, dass umfangreiche Nachrichten für diesen Bot/dieses Konto verfügbar sind (einschließlich des unterstützten Erstellungsvertrags für Markdown und HTML-Inseln); Markdown-Text wird über die Markdown-IR von OpenClaw als typisierte umfangreiche Blöcke der Bot API 10.2 gerendert (Überschriften, Tabellen, Details, Checklisten, Rich Media, Formeln, Karten, Collagen); Medienbeschriftungen verwenden weiterhin Telegram-HTML-Beschriftungen (umfangreiche Nachrichten ersetzen Beschriftungen nicht, und Beschriftungen sind auf 1024 Zeichen begrenzt).

    Dadurch wird Modelltext von den Rich-Markdown-Sonderzeichen von Telegram ferngehalten, sodass Währungsangaben wie `$400-600K` nicht als Mathematik interpretiert werden. Langer umfangreicher Text wird automatisch entsprechend den Telegram-Grenzwerten aufgeteilt. Tabellen mit mehr als 20 Spalten greifen auf einen Codeblock zurück.

    Standard: deaktiviert, aus Gründen der Client-Kompatibilität — einige aktuelle Desktop-, Web-, Android- und Drittanbieter-Clients stellen akzeptierte umfangreiche Nachrichten als nicht unterstützt dar. Lassen Sie diese Option deaktiviert, sofern sie nicht von jedem mit dem Bot verwendeten Client gerendert werden kann. `/status` zeigt an, ob umfangreiche Nachrichten für die aktuelle Sitzung aktiviert oder deaktiviert sind.

    Linkvorschauen sind standardmäßig aktiviert. `channels.telegram.linkPreview: false` deaktiviert die automatische Entitätserkennung für umfangreichen Text.

  </Accordion>

  <Accordion title="Native Befehle und benutzerdefinierte Befehle">
    Das Befehlsmenü von Telegram wird beim Start mit `setMyCommands` registriert. `commands.native: "auto"` aktiviert native Befehle für Telegram.

    Benutzerdefinierte Einträge zum Befehlsmenü hinzufügen:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Git-Sicherung" },
        { command: "generate", description: "Bild erstellen" },
      ],
    },
  },
}
```

    Regeln: Namen werden normalisiert (vorangestelltes `/` wird entfernt, Umwandlung in Kleinbuchstaben); gültiges Muster `a-z`, `0-9`, `_`, Länge 1-32; benutzerdefinierte Befehle können native Befehle nicht überschreiben; Konflikte/Duplikate werden übersprungen und protokolliert.

    Benutzerdefinierte Befehle sind lediglich Menüeinträge — sie implementieren nicht automatisch ein Verhalten. Plugin-/Skill-Befehle können bei manueller Eingabe weiterhin funktionieren, auch wenn sie nicht im Telegram-Menü angezeigt werden. Wenn native Befehle deaktiviert sind, werden integrierte Befehle entfernt; benutzerdefinierte/Plugin-Befehle können bei entsprechender Konfiguration weiterhin registriert werden.

    Häufige Einrichtungsfehler:

    - `setMyCommands failed` mit `BOT_COMMANDS_TOO_MUCH` nach einem erneuten Kürzungsversuch bedeutet, dass das Menü weiterhin überläuft; reduzieren Sie die Anzahl der Plugin-/Skill-/benutzerdefinierten Befehle oder deaktivieren Sie `channels.telegram.commands.native`.
    - Wenn `deleteWebhook`, `deleteMyCommands` oder `setMyCommands` mit `404: Not Found` fehlschlägt, während direkte Bot-API-curl-Befehle funktionieren, bedeutet dies normalerweise, dass `channels.telegram.apiRoot` auf den vollständigen `/bot<TOKEN>`-Endpunkt gesetzt wurde. `apiRoot` darf nur die Bot-API-Basisadresse enthalten; `openclaw doctor --fix` entfernt ein versehentlich angehängtes `/bot<TOKEN>`.
    - `getMe returned 401` bedeutet, dass Telegram das konfigurierte Bot-Token abgelehnt hat. Aktualisieren Sie `botToken`, `tokenFile` oder `TELEGRAM_BOT_TOKEN` (Standardkonto) mit dem aktuellen BotFather-Token; OpenClaw beendet sich vor dem Polling, damit dies nicht als Fehler bei der Webhook-Bereinigung gemeldet wird.
    - `setMyCommands failed` mit Netzwerk-/Abruffehlern bedeutet normalerweise, dass ausgehende DNS-/HTTPS-Verbindungen zu `api.telegram.org` blockiert werden.

    ### Befehle zur Gerätekopplung (`device-pair`-Plugin)

    Nach der Installation:

    1. `/pair` erzeugt einen Einrichtungscode
    2. Fügen Sie den Code in der iOS-App ein
    3. `/pair pending` listet ausstehende Anfragen auf (einschließlich Rolle/Berechtigungsumfängen)
    4. Genehmigen: `/pair approve <requestId>`, `/pair approve` (nur ausstehende Anfrage) oder `/pair approve latest`

    Wenn ein Gerät den Vorgang mit geänderten Authentifizierungsdetails (Rolle, Berechtigungsumfänge, öffentlicher Schlüssel) erneut versucht, wird die vorherige ausstehende Anfrage durch eine neue `requestId` ersetzt; führen Sie `/pair pending` vor der Genehmigung erneut aus.

    Weitere Einzelheiten: [Kopplung](/de/channels/pairing#pair-via-telegram).

  </Accordion>

  <Accordion title="Inline-Schaltflächen">
    Geltungsbereich der Inline-Tastatur konfigurieren:

```json5
{
  channels: {
    telegram: {
      capabilities: {
        inlineButtons: "allowlist",
      },
    },
  },
}
```

    Kontospezifische Überschreibung:

```json5
{
  channels: {
    telegram: {
      accounts: {
        main: {
          capabilities: {
            inlineButtons: "allowlist",
          },
        },
      },
    },
  },
}
```

    Geltungsbereiche: `off`, `dm`, `group`, `all`, `allowlist` (Standard). Das veraltete `capabilities: ["inlineButtons"]` wird `"all"` zugeordnet.

    Beispiel für eine Nachrichtenaktion:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Wählen Sie eine Option:",
  buttons: [
    [
      { text: "Ja", callback_data: "yes" },
      { text: "Nein", callback_data: "no" },
    ],
    [{ text: "Abbrechen", callback_data: "cancel" }],
  ],
}
```

    Beispiel für eine Mini-App-Schaltfläche:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "App öffnen:",
  presentation: {
    blocks: [
      {
        type: "buttons",
        buttons: [{ label: "Starten", web_app: { url: "https://example.com/app" } }],
      },
    ],
  },
}
```

    `web_app`-Schaltflächen funktionieren nur in privaten Chats zwischen einem Benutzer und dem Bot.

    Callback-Klicks, die nicht von einem registrierten interaktiven Plugin-Handler beansprucht werden, werden dem Agenten als Text übergeben: `callback_data: <value>`.

  </Accordion>

  <Accordion title="Telegram-Nachrichtenaktionen für Agenten und Automatisierung">
    Aktionen:

    - `sendMessage` (`to`, `content`, optional `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content` oder `caption`, optionale `presentation`-Inline-Schaltflächen; reine Schaltflächenbearbeitungen aktualisieren das Antwort-Markup)
    - `createForumTopic` (`chatId`, `name`, optional `iconColor`, `iconCustomEmojiId`)

    Ergonomische Aliasse: `send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`.

    Aktivierung: `channels.telegram.actions.sendMessage`, `deleteMessage`, `reactions`, `sticker` (Standard: deaktiviert). `edit`, `createForumTopic` und `editForumTopic` sind standardmäßig ohne eigenen Schalter aktiviert.
    Laufzeit-Sendevorgänge verwenden den beim Start oder Neuladen aktiven Konfigurations-/Secrets-Snapshot, sodass Aktionspfade die Werte von `SecretRef` nicht bei jedem Sendevorgang erneut auflösen.

    Semantik zum Entfernen von Reaktionen: [/tools/reactions](/de/tools/reactions).

  </Accordion>

  <Accordion title="Tags für Antwort-Threads">
    Explizite Tags für Antwort-Threads in generierten Ausgaben:

    - `[[reply_to_current]]` — antwortet auf die auslösende Nachricht
    - `[[reply_to:<id>]]` — antwortet auf eine bestimmte Nachrichten-ID

    `channels.telegram.replyToMode`: `off` (Standard), `first`, `all`.

    Wenn Antwort-Threads aktiviert sind und der ursprüngliche Text beziehungsweise die ursprüngliche Beschriftung verfügbar ist, fügt OpenClaw automatisch einen nativen Zitat-Auszug hinzu. Telegram begrenzt nativen Zitattext auf 1024 UTF-16-Codeeinheiten; bei längeren Nachrichten wird ab dem Anfang zitiert und auf eine einfache Antwort zurückgegriffen, falls Telegram das Zitat ablehnt.

    `off` deaktiviert nur implizite Antwort-Threads; explizite `[[reply_to_*]]`-Tags werden weiterhin berücksichtigt.

  </Accordion>

  <Accordion title="Forumsthemen und Thread-Verhalten">
    Forum-Supergruppen: An Sitzungsschlüssel für Themen wird `:topic:<threadId>` angehängt; Antworten und Tippanzeigen richten sich an den Themen-Thread; der Konfigurationspfad für Themen ist `channels.telegram.groups.<chatId>.topics.<threadId>`.

    Das allgemeine Thema (`threadId=1`) ist ein Sonderfall: Beim Senden von Nachrichten wird `message_thread_id` ausgelassen (Telegram lehnt `sendMessage(...thread_id=1)` mit „Thread nicht gefunden“ ab), Tippaktionen enthalten jedoch weiterhin `message_thread_id` (empirisch erforderlich, damit die Tippanzeige erscheint).

    Themeneinträge erben Gruppeneinstellungen, sofern sie nicht überschrieben werden (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`). `agentId` gilt nur für Themen und wird nicht von den Gruppenstandards geerbt. `topics."*"` legt Standards für jedes Thema in dieser Gruppe fest; exakte Themen-IDs haben weiterhin Vorrang vor `"*"`.

    **Agenten-Routing pro Thema**: Jedes Thema kann über `agentId` in der Themenkonfiguration an einen anderen Agenten weitergeleitet werden und erhält so einen eigenen Arbeitsbereich, eigenen Speicher und eine eigene Sitzung:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // Allgemeines Thema -> Hauptagent
                "3": { agentId: "zu" },        // Entwicklungsthema -> Agent zu
                "5": { agentId: "coder" }      // Codeüberprüfung -> Agent coder
              }
            }
          }
        }
      }
    }
    ```

    Jedes Thema besitzt anschließend einen eigenen Sitzungsschlüssel, beispielsweise `agent:zu:telegram:group:-1001234567890:topic:3`.

    **Persistente ACP-Themenbindung**: Forumsthemen können ACP-Harness-Sitzungen über typisierte Bindungen auf oberster Ebene anheften (`bindings[]` mit `type: "acp"`, `match.channel: "telegram"`, `peer.kind: "group"` und einer themenspezifischen ID wie `-1001234567890:topic:42`). Derzeit auf Forumsthemen in Gruppen/Supergruppen beschränkt. Siehe [ACP-Agenten](/de/tools/acp-agents).

    **Thread-gebundener ACP-Start aus dem Chat**: `/acp spawn <agent> --thread here|auto` bindet das aktuelle Thema an eine neue ACP-Sitzung; Folgenachrichten werden direkt dorthin weitergeleitet und OpenClaw heftet die Startbestätigung im Thema an. Erfordert `channels.telegram.threadBindings.spawnSessions` (Standard: `true`).

    Der Vorlagenkontext stellt `MessageThreadId` und `IsForum` bereit. DM-Chats mit `message_thread_id` behalten Antwortmetadaten bei, verwenden Thread-fähige Sitzungsschlüssel jedoch nur, wenn Telegram `getMe` als `has_topics_enabled: true` meldet.
    Die eingestellten Überschreibungen `dm.threadReplies` und `direct.*.threadReplies` wurden entfernt; der Thread-Modus von BotFather ist die einzige maßgebliche Quelle. Führen Sie `openclaw doctor --fix` aus, um veraltete Konfigurationsschlüssel zu entfernen.

  </Accordion>

  <Accordion title="Audio, Video und Sticker">
    ### Audionachrichten

    Telegram unterscheidet Sprachnachrichten von Audiodateien. Standard: Verhalten als Audiodatei; verwenden Sie den Tag `[[audio_as_voice]]` in der Agentenantwort, um das Senden als Sprachnachricht zu erzwingen. Transkripte eingehender Sprachnachrichten werden im Agentenkontext als maschinell erzeugter, nicht vertrauenswürdiger Text dargestellt, die Erwähnungserkennung verwendet jedoch weiterhin das Rohtranskript, sodass durch Erwähnungen beschränkte Sprachnachrichten weiterhin funktionieren.

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/voice.ogg",
  asVoice: true,
}
```

    ### Videonachrichten

    Telegram unterscheidet Videodateien von Videonachrichten. Videonachrichten unterstützen keine Beschriftungen; bereitgestellter Nachrichtentext wird separat gesendet.

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    ### Standorte und Veranstaltungsorte

    Verwenden Sie die bestehende Aktion `send` mit einem eigenständigen `location`-Objekt. Koordinaten senden eine native Markierung; wenn sowohl `name` als auch `address` hinzugefügt werden, wird eine native Ortskarte gesendet. Standortangaben können nicht mit Nachrichtentext oder Medien kombiniert werden.

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  location: {
    latitude: 48.858844,
    longitude: 2.294351,
    accuracy: 12,
    name: "Eiffelturm",
    address: "Champ de Mars, Paris",
  },
}
```

    ### Sticker

    Eingehend: Statisches WEBP wird heruntergeladen und verarbeitet (Platzhalter `<media:sticker>`); animiertes TGS und Video-WEBM werden übersprungen.

    Sticker-Kontextfelder: `Sticker.emoji`, `Sticker.setName`, `Sticker.fileId`, `Sticker.fileUniqueId`, `Sticker.cachedDescription`. Beschreibungen werden im SQLite-Plugin-Status von OpenClaw zwischengespeichert, um wiederholte Vision-Aufrufe zu reduzieren.

    Sticker-Aktionen aktivieren:

```json5
{
  channels: {
    telegram: {
      actions: {
        sticker: true,
      },
    },
  },
}
```

    Senden:

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    Zwischengespeicherte Sticker durchsuchen:

```json5
{
  action: "sticker-search",
  channel: "telegram",
  query: "winkende Katze",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="Reaktionsbenachrichtigungen">
    Telegram-Reaktionen treffen als `message_reaction`-Aktualisierungen getrennt von Nachrichten-Payloads ein. Wenn diese Funktion aktiviert ist, stellt OpenClaw Systemereignisse wie `Telegram reaction added: 👍 by Alice (@alice) on msg 42` in die Warteschlange.

    - `channels.telegram.reactionNotifications`: `off | own | all` (Standard: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (Standard: `minimal`)

    `own` bedeutet nur Benutzerreaktionen auf vom Bot gesendete Nachrichten (Best-Effort über einen Cache gesendeter Nachrichten). Reaktionsereignisse berücksichtigen weiterhin die Telegram-Zugriffskontrollen (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); nicht autorisierte Absender werden verworfen.

    Telegram stellt in Reaktionsaktualisierungen keine Thread-IDs bereit: Gruppen ohne Forum werden an die Gruppenchat-Sitzung weitergeleitet; Forumgruppen an die Sitzung des allgemeinen Themas (`:topic:1`), nicht an das exakte Ursprungsthema.

    `allowed_updates` für Polling/Webhook schließen `message_reaction` automatisch ein.

  </Accordion>

  <Accordion title="Bestätigungsreaktionen">
    `ackReaction` sendet ein Bestätigungs-Emoji, während OpenClaw eine eingehende Nachricht verarbeitet. `messages.ackReactionScope` bestimmt, *wann* es gesendet wird.

    **Reihenfolge der Emoji-Auflösung:**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - Fallback auf das Emoji der Agentenidentität (`agents.list[].identity.emoji`, andernfalls „👀“)

    Telegram erwartet ein Unicode-Emoji (beispielsweise „👀“); verwenden Sie `""`, um die Reaktion für einen Kanal oder ein Konto zu deaktivieren.

    **Geltungsbereich (`messages.ackReactionScope`, Standard `"group-mentions"`; derzeit keine Überschreibung auf Telegram-Konto- oder Telegram-Kanalebene):**

    `all` (DMs + Gruppen einschließlich umgebender Raumereignisse), `direct` (nur DMs), `group-all` (jede Gruppennachricht außer umgebenden Raumereignissen, keine DMs), `group-mentions` (Gruppen, wenn der Bot erwähnt wird; **keine DMs** — Standard), `off` / `none` (deaktiviert).

    <Note>
    Der Standard-Geltungsbereich (`group-mentions`) löst in DMs oder umgebenden Raumereignissen keine Bestätigungsreaktionen aus. Verwenden Sie `direct` oder `all` für DMs; nur `all` bestätigt umgebende Raumereignisse. Dieser Wert wird beim Start des Telegram-Providers gelesen, daher ist ein Neustart des Gateway erforderlich, damit die Änderung wirksam wird.
    </Note>

  </Accordion>

  <Accordion title="Konfigurationsschreibvorgänge aus Telegram-Ereignissen und -Befehlen">
    Schreibvorgänge an der Kanalkonfiguration sind standardmäßig aktiviert (`configWrites !== false`). Durch Telegram ausgelöste Schreibvorgänge umfassen Gruppenmigrationsereignisse (`migrate_to_chat_id`, aktualisiert `channels.telegram.groups`) sowie `/config set` / `/config unset` (erfordert aktivierte Befehle).

    Deaktivieren:

```json5
{
  channels: {
    telegram: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="Long Polling im Vergleich zu Webhook">
    Standardmäßig wird Long Polling verwendet. Legen Sie für den Webhook-Modus `channels.telegram.webhookUrl` und `channels.telegram.webhookSecret` fest; optional `webhookPath` (Standard `/telegram-webhook`), `webhookHost` (Standard `127.0.0.1`), `webhookPort` (Standard `8787`), `webhookCertPath` (PEM des selbstsignierten Zertifikats für Installationen mit direkter IP oder ohne Domain).

    Im Long-Polling-Modus speichert OpenClaw seine Neustart-Wassermarke erst dauerhaft, nachdem eine Aktualisierung erfolgreich weitergeleitet wurde; bei einem fehlgeschlagenen Handler bleibt diese Aktualisierung im selben Prozess wiederholbar, statt als abgeschlossen markiert zu werden.

    Der lokale Listener bindet standardmäßig an `127.0.0.1:8787`. Schalten Sie für öffentlichen Eingang einen Reverse-Proxy vor den lokalen Port oder legen Sie `webhookHost: "0.0.0.0"` bewusst fest.

    Der Webhook-Modus validiert Anfrageschutzmechanismen, das geheime Telegram-Token und den JSON-Body und übergibt die Aktualisierung anschließend an seine dauerhafte Eingangswarteschlange, bevor eine leere `200` zurückgegeben wird. Eine erfolgreiche dauerhafte Übernahme schließt `x-openclaw-delivery-accepted: durable` ein; Antworten zu Integritätsprüfung, Routing, Authentifizierung, Validierung und Speicherfehlern lassen diesen Header aus. Reverse-Proxys und Host-Controller können den Header verlangen, um die Übernahme durch OpenClaw von einer generischen leeren `200` zu unterscheiden, ohne die Annahme aus dem Antwortzeitpunkt abzuleiten.

    OpenClaw verarbeitet die Aktualisierung anschließend asynchron über dieselben Bot-Lanes pro Chat und Thema wie beim Long Polling, sodass langsame Agentendurchläufe das Zustellungs-ACK von Telegram nicht aufhalten.

  </Accordion>

  <Accordion title="Limits, Wiederholungsversuche und CLI-Ziele">
    - `channels.telegram.textChunkLimit` standardmäßig 4000; `streaming.chunkMode="newline"` bevorzugt Absatzgrenzen (Leerzeilen), bevor nach Länge aufgeteilt wird.
    - `channels.telegram.mediaMaxMb` (Standardwert 100) begrenzt die Größe eingehender und ausgehender Medien.
    - `channels.telegram.mediaGroupFlushMs` (Standardwert 500, Bereich 10-60000) steuert, wie lange Alben bzw. Mediengruppen gepuffert werden, bevor OpenClaw sie als eine eingehende Nachricht weiterleitet. Erhöhen Sie den Wert, wenn Teile eines Albums verspätet eintreffen; verringern Sie ihn, um die Antwortlatenz bei Alben zu reduzieren.
    - `channels.telegram.timeoutSeconds` überschreibt das Zeitlimit des API-Clients (wenn nicht festgelegt, gilt der grammY-Standardwert). Bot-Clients begrenzen konfigurierte Werte unterhalb der 60-sekündigen Schutzfrist für ausgehende Text-/Tippanfragen, damit grammY die sichtbare Antwortzustellung nicht abbricht, bevor die Transportschutzfrist und der Fallback von OpenClaw ausgeführt werden können. Long Polling verwendet weiterhin eine 45-sekündige Schutzfrist für `getUpdates`-Anfragen, damit inaktive Polling-Anfragen nicht unbegrenzt offengelassen werden.
    - `channels.telegram.pollingStallThresholdMs` verwendet standardmäßig 120000; passen Sie den Wert nur bei fälschlich erkannten Polling-Blockaden auf einen Wert zwischen 30000 und 600000 an.
    - Der Gruppen-Kontextverlauf verwendet `channels.telegram.historyLimit` oder `messages.groupChat.historyLimit` (Standardwert 50); `0` deaktiviert ihn.
    - Zusätzlicher Kontext aus Antworten, Zitaten und Weiterleitungen wird in einem ausgewählten Gesprächskontextfenster normalisiert, wenn das Gateway die übergeordneten Nachrichten erfasst hat; der Cache erfasster Nachrichten befindet sich im SQLite-Plugin-Status von OpenClaw und `openclaw doctor --fix` importiert ältere Begleitdateien. Telegram enthält pro Update nur einen flachen `reply_to_message`, sodass Ketten, die älter als der Cache sind, auf diese Nutzlast beschränkt sind.
    - Telegram-Zulassungslisten steuern primär, wer den Agenten auslösen kann; sie bilden keine vollständige Schwärzungsgrenze für zusätzlichen Kontext.
    - Direktnachrichtenverlauf: `channels.telegram.dmHistoryLimit`, `channels.telegram.dms["<user_id>"].historyLimit`.
    - `channels.telegram.retry` gilt für Telegram-Sendehilfen (CLI/Tools/Aktionen) bei behebbaren ausgehenden API-Fehlern. Die Zustellung der endgültigen Antwort auf eingehende Nachrichten verwendet bei Fehlern vor dem Verbindungsaufbau einen begrenzten sicheren Wiederholungsversuch, wiederholt jedoch keine mehrdeutigen Netzwerkvorgänge nach dem Senden, die sichtbare Nachrichten duplizieren könnten.

    Sendeziele der CLI und des Nachrichten-Tools akzeptieren eine numerische Chat-ID, einen Benutzernamen oder ein Forenthema als Ziel:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
```

    Umfragen verwenden `openclaw message poll` und unterstützen Forenthemen:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Ausschließlich für Telegram verfügbare Umfrage-Flags: `--poll-duration-seconds` (5-600), `--poll-anonymous`, `--poll-public`, `--thread-id` (oder ein `:topic:`-Ziel). `--poll-option` wiederholt den Vorgang 2-12-mal (Telegrams Obergrenze für Optionen).

    Das Senden über Telegram unterstützt außerdem `--presentation` mit `buttons`-Blöcken für Inline-Tastaturen (wenn `channels.telegram.capabilities.inlineButtons` dies zulässt), `--pin` oder `--delivery '{"pin":true}'` zum Anfordern einer angehefteten Zustellung, sofern der Bot in diesem Chat Nachrichten anheften kann, sowie `--force-document`, um ausgehende Bilder, GIFs und Videos als Dokumente statt als komprimierte, animierte oder Video-Uploads zu senden.

    Aktionssteuerung: `channels.telegram.actions.sendMessage=false` deaktiviert alle ausgehenden Nachrichten einschließlich Umfragen; `channels.telegram.actions.poll=false` deaktiviert das Erstellen von Umfragen, während reguläre Sendevorgänge aktiviert bleiben.

  </Accordion>

  <Accordion title="Ausführungsfreigaben in Telegram">
    Telegram unterstützt Ausführungsfreigaben in Direktnachrichten an Genehmigende und kann Aufforderungen optional im ursprünglichen Chat oder Thema veröffentlichen. Genehmigende müssen durch numerische Telegram-Benutzer-IDs angegeben werden.

    - `channels.telegram.execApprovals.enabled` (`"auto"` aktiviert die Funktion, wenn mindestens eine genehmigende Person aufgelöst werden kann)
    - `channels.telegram.execApprovals.approvers` (greift auf numerische Eigentümer-IDs aus `commands.ownerAllowFrom` zurück)
    - `channels.telegram.execApprovals.target`: `dm` (Standardwert) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` und `defaultTo` steuern, wer mit dem Bot kommunizieren kann und wohin er normale Antworten sendet – sie machen eine Person nicht zu einer genehmigenden Person für Ausführungen. Die erste genehmigte Direktnachrichten-Kopplung initialisiert `commands.ownerAllowFrom`, wenn noch kein Befehlseigentümer vorhanden ist, sodass Konfigurationen mit einem Eigentümer funktionieren, ohne IDs unter `execApprovals.approvers` zu duplizieren.

    Bei der Zustellung im Kanal wird der Befehlstext im Chat angezeigt; aktivieren Sie `channel` oder `both` nur in vertrauenswürdigen Gruppen bzw. Themen. Wenn die Aufforderung in einem Forenthema eingeht, behält OpenClaw das Thema für die Freigabeaufforderung und die Folgemeldung bei. Ausführungsfreigaben laufen standardmäßig nach 30 Minuten ab.

    Inline-Schaltflächen für Freigaben setzen außerdem voraus, dass `channels.telegram.capabilities.inlineButtons` die Zieloberfläche zulässt (`dm`, `group` oder `all`). Freigabe-IDs mit dem Präfix `plugin:` werden über Plugin-Freigaben aufgelöst; andere werden zuerst über Ausführungsfreigaben aufgelöst.

    Siehe [Ausführungsfreigaben](/de/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Steuerung von Fehlerantworten

Wenn beim Agenten ein Zustellungs- oder Provider-Fehler auftritt, steuert die Fehlerrichtlinie, ob Fehlermeldungen den Telegram-Chat erreichen:

| Schlüssel                            | Werte                      | Standardwert    | Beschreibung                                                                                                                                                                                            |
| ------------------------------------ | -------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `always`, `once`, `silent` | `always`        | `always` sendet jede Fehlermeldung an den Chat. `once` sendet jede eindeutige Fehlermeldung einmal pro Abkühlzeitfenster (wiederholte identische Fehler werden unterdrückt). `silent` sendet niemals Fehlermeldungen an den Chat. |
| `channels.telegram.errorCooldownMs` | Zahl (ms)                  | `14400000` (4h) | Abkühlzeitfenster für die Richtlinie `once`. Nachdem ein Fehler gesendet wurde, wird dieselbe Nachricht unterdrückt, bis dieses Intervall abgelaufen ist. Verhindert eine Flut von Fehlermeldungen während Ausfällen. |

Überschreibungen pro Konto, Gruppe und Thema werden unterstützt (dieselbe Vererbung wie bei anderen Telegram-Konfigurationsschlüsseln).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "always",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // Fehler in dieser Gruppe unterdrücken
        },
      },
    },
  },
}
```

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Bot antwortet nicht auf Gruppennachrichten ohne Erwähnung">

    - Wenn `requireMention=false`, muss der Datenschutzmodus von Telegram vollständige Sichtbarkeit zulassen: BotFather `/setprivacy` -> Disable; entfernen Sie den Bot anschließend aus der Gruppe und fügen Sie ihn erneut hinzu.
    - `openclaw channels status` warnt, wenn die Konfiguration Gruppennachrichten ohne Erwähnung erwartet.
    - `openclaw channels status --probe` prüft explizite numerische Gruppen-IDs; für den Platzhalter `"*"` kann die Mitgliedschaft nicht geprüft werden.
    - Schneller Sitzungstest: `/activation always`.

  </Accordion>

  <Accordion title="Bot sieht überhaupt keine Gruppennachrichten">

    - Wenn `channels.telegram.groups` vorhanden ist, muss die Gruppe aufgeführt sein (oder `"*"` enthalten).
    - Überprüfen Sie die Mitgliedschaft des Bots in der Gruppe.
    - Prüfen Sie `openclaw logs --follow` auf Gründe für das Überspringen.

  </Accordion>

  <Accordion title="Befehle funktionieren nur teilweise oder überhaupt nicht">

    - Autorisieren Sie Ihre Absenderidentität (Kopplung und/oder numerischer `allowFrom`); die Befehlsautorisierung gilt weiterhin, auch wenn die Gruppenrichtlinie `open` lautet.
    - `setMyCommands failed` zusammen mit `BOT_COMMANDS_TOO_MUCH` bedeutet, dass das native Menü zu viele Einträge enthält; reduzieren Sie die Plugin-, Skill- oder benutzerdefinierten Befehle oder deaktivieren Sie native Menüs.
    - Startaufrufe für `deleteMyCommands` / `setMyCommands` sowie Tippaufrufe für `sendChatAction` sind begrenzt und werden bei einer Anfragezeitüberschreitung einmal über Telegrams Transport-Fallback wiederholt. Anhaltende Netzwerk-/Abruffehler bedeuten normalerweise, dass DNS/HTTPS zu `api.telegram.org` nicht erreichbar ist.

  </Accordion>

  <Accordion title="Beim Start wird ein nicht autorisiertes Token gemeldet">

    - `getMe returned 401` ist ein Telegram-Authentifizierungsfehler für das konfigurierte Bot-Token. Kopieren Sie das Token in BotFather erneut oder generieren Sie es neu und aktualisieren Sie anschließend `channels.telegram.botToken`, `tokenFile`, `accounts.<id>.botToken` oder `TELEGRAM_BOT_TOKEN` (Standardkonto).
    - `deleteWebhook 401 Unauthorized` während des Starts ist ebenfalls ein Authentifizierungsfehler; ihn als „kein Webhook vorhanden“ zu behandeln, würde denselben Fehler aufgrund eines ungültigen Tokens lediglich auf einen späteren API-Aufruf verschieben.

  </Accordion>

  <Accordion title="Polling- oder Netzwerkprobleme">

    - Node 22+ mit einer benutzerdefinierten Fetch-/Proxy-Konfiguration kann sofortige Abbrüche auslösen, wenn die Typen von `AbortSignal` nicht übereinstimmen.
    - Einige Hosts lösen `api.telegram.org` zuerst zu IPv6 auf; ein fehlerhafter ausgehender IPv6-Datenverkehr verursacht sporadische API-Fehler.
    - Protokolle mit `TypeError: fetch failed` oder `Network request for 'getUpdates' failed!` werden als behebbare Netzwerkfehler erneut versucht.
    - Während des Polling-Starts verwendet OpenClaw die erfolgreiche `getMe`-Startprüfung für grammY erneut, sodass der Runner vor dem ersten `getUpdates` keinen zweiten `getMe` benötigt.
    - Wenn `deleteWebhook` während des Polling-Starts aufgrund eines vorübergehenden Netzwerkfehlers fehlschlägt, fährt OpenClaw mit Long Polling fort, anstatt einen weiteren Aufruf der Steuerungsebene vor dem Polling auszuführen. Ein weiterhin aktiver Webhook zeigt sich dann als `getUpdates`-Konflikt; OpenClaw erstellt den Transport neu und versucht erneut, den Webhook zu bereinigen.
    - Wenn Telegram-Sockets in einem kurzen festen Takt neu aufgebaut werden, prüfen Sie, ob `channels.telegram.timeoutSeconds` zu niedrig ist – Bot-Clients begrenzen konfigurierte Werte unterhalb der Schutzfristen für ausgehende Anfragen und `getUpdates`-Anfragen, ältere Versionen konnten jedoch jedes Polling oder jede Antwort abbrechen, wenn der Wert unter diesen Schutzfristen lag.
    - `Polling stall detected` in Protokollen bedeutet, dass OpenClaw das Polling neu startet und den Transport neu erstellt, wenn standardmäßig 120 Sekunden lang keine abgeschlossene Long-Poll-Aktivität festgestellt wurde.
    - `openclaw channels status --probe` und `openclaw doctor` warnen, wenn ein aktives Polling-Konto nach Ablauf der Startfrist kein `getUpdates` abgeschlossen hat, ein aktives Webhook-Konto nach Ablauf der Startfrist kein `setWebhook` abgeschlossen hat oder die letzte erfolgreiche Polling-Transportaktivität veraltet ist.
    - Erhöhen Sie `channels.telegram.pollingStallThresholdMs` nur, wenn lang laufende `getUpdates`-Aufrufe ordnungsgemäß funktionieren, Ihr Host aber weiterhin fälschlich erkannte Polling-Blockaden meldet. Anhaltende Blockaden weisen normalerweise auf Probleme mit Proxy, DNS, IPv6 oder ausgehendem TLS-Datenverkehr zu `api.telegram.org` hin.
    - Telegram berücksichtigt die Proxy-Umgebungsvariablen des Prozesses für den Bot-API-Transport: `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` sowie Varianten in Kleinschreibung. `NO_PROXY` / `no_proxy` können `api.telegram.org` weiterhin umgehen.
    - Wenn `OPENCLAW_PROXY_URL` für eine Dienstumgebung festgelegt ist und keine standardmäßige Proxy-Umgebungsvariable vorhanden ist, verwendet Telegram diese URL ebenfalls für den Bot-API-Transport.
    - Leiten Sie Telegram-API-Aufrufe auf VPS-Hosts mit instabiler direkter ausgehender Verbindung bzw. TLS-Verbindung über einen Proxy:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ verwendet standardmäßig `autoSelectFamily=true` (außer unter WSL2). Die Reihenfolge der Telegram-DNS-Ergebnisse berücksichtigt `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, dann `channels.telegram.network.dnsResultOrder` und anschließend den Prozessstandard (zum Beispiel `NODE_OPTIONS=--dns-result-order=ipv4first`); falls nichts davon zutrifft, wird unter Node 22+ auf `ipv4first` zurückgegriffen.
    - Erzwingen Sie unter WSL2 oder wenn ein reiner IPv4-Betrieb besser funktioniert die Auswahl der Adressfamilie:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Antworten aus dem RFC-2544-Benchmarkbereich (`198.18.0.0/15`) sind für Telegram-Mediendownloads bereits standardmäßig zulässig. Wenn ein vertrauenswürdiger Fake-IP- oder transparenter Proxy `api.telegram.org` während Mediendownloads in eine andere private, interne oder für besondere Zwecke reservierte Adresse umschreibt, aktivieren Sie die ausschließlich für Telegram geltende Umgehung:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Dieselbe Aktivierungsoption ist pro Konto unter `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork` verfügbar.
    - Wenn Ihr Proxy Telegram-Medienhosts in `198.18.x.x` auflöst, lassen Sie das gefährliche Flag zunächst deaktiviert – dieser Bereich ist bereits standardmäßig zulässig.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` schwächt den SSRF-Schutz für Telegram-Medien. Verwenden Sie diese Option nur für vertrauenswürdige, vom Betreiber kontrollierte Proxy-Umgebungen (Fake-IP-Routing mit Clash, Mihomo oder Surge), die private oder für besondere Zwecke reservierte Antworten außerhalb des RFC-2544-Benchmarkbereichs erzeugen. Lassen Sie sie für den normalen Telegram-Zugriff über das öffentliche Internet deaktiviert.
    </Warning>

    - Temporäre Umgebungsüberschreibungen: `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`, `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`, `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`.
    - Überprüfen Sie die DNS-Antworten:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

Weitere Hilfe: [Fehlerbehebung für Kanäle](/de/channels/troubleshooting).

## Konfigurationsreferenz

Primäre Referenz: [Konfigurationsreferenz – Telegram](/de/gateway/config-channels#telegram).

<Accordion title="Wichtige Telegram-Felder">

- Start/Authentifizierung: `enabled`, `botToken`, `tokenFile` (muss eine reguläre Datei sein; symbolische Links werden abgelehnt), `accounts.*`
- Zugriffskontrolle: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, auf oberster Ebene `bindings[]` (`type: "acp"`)
- Themenstandards: `groups.<chatId>.topics."*"` gilt für nicht zugeordnete Forumsthemen; exakte Themen-IDs überschreiben den Wert
- Ausführungsgenehmigungen: `execApprovals`, `accounts.*.execApprovals`
- Befehle/Menü: `commands.native`, `commands.nativeSkills`, `customCommands`
- Threads/Antworten: `replyToMode`, `threadBindings`
- Streaming: `streaming` (Modi `off | partial | block | progress`), `streaming.preview.toolProgress`
- Formatierung/Zustellung: `textChunkLimit`, `streaming.chunkMode`, `richMessages`, `markdown.tables` (`off | bullets | code | block`), `linkPreview`, `responsePrefix`
- Medien/Netzwerk: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- Benutzerdefinierter API-Stamm: `apiRoot` (nur Bot-API-Stamm; `/bot<TOKEN>` nicht einschließen), `trustedLocalFileRoots` (absolute `file_path`-Stämme einer selbst gehosteten Bot API)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`, `webhookPort`, `webhookCertPath`
- Aktionen/Funktionen: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker|createForumTopic|editForumTopic`
- Reaktionen: `reactionNotifications`, `reactionLevel`
- Fehler: `errorPolicy`, `errorCooldownMs`, `silentErrorReplies`
- Schreibvorgänge/Verlauf: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Priorität bei mehreren Konten: Wenn zwei oder mehr Konto-IDs konfiguriert sind, legen Sie `channels.telegram.defaultAccount` fest (oder schließen Sie `channels.telegram.accounts.default` ein), um das Standard-Routing ausdrücklich anzugeben. Andernfalls greift OpenClaw auf die erste normalisierte Konto-ID zurück und `openclaw doctor` gibt eine Warnung aus. Benannte Konten übernehmen `channels.telegram.allowFrom` / `groupAllowFrom`, jedoch keine Werte von `accounts.default.*`.
</Note>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Kopplung" icon="link" href="/de/channels/pairing">
    Koppeln Sie einen Telegram-Benutzer mit dem Gateway.
  </Card>
  <Card title="Gruppen" icon="users" href="/de/channels/groups">
    Verhalten der Positivliste für Gruppen und Themen.
  </Card>
  <Card title="Kanal-Routing" icon="route" href="/de/channels/channel-routing">
    Leiten Sie eingehende Nachrichten an Agenten weiter.
  </Card>
  <Card title="Sicherheit" icon="shield" href="/de/gateway/security">
    Bedrohungsmodell und Absicherung.
  </Card>
  <Card title="Multi-Agent-Routing" icon="sitemap" href="/de/concepts/multi-agent">
    Ordnen Sie Gruppen und Themen Agenten zu.
  </Card>
  <Card title="Fehlerbehebung" icon="wrench" href="/de/channels/troubleshooting">
    Kanalübergreifende Diagnose.
  </Card>
</CardGroup>
