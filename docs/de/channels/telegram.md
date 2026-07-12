---
read_when:
    - Arbeiten an Telegram-Funktionen oder Webhooks
summary: Status, Funktionen und Konfiguration der Telegram-Bot-Unterstützung
title: Telegram
x-i18n:
    generated_at: "2026-07-12T15:06:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 8aa81fb0a1bc2953305591f5b616e5caebfee24c5fab04737c5e2eaa02be4559
    source_path: channels/telegram.md
    workflow: 16
---

Produktionsbereit für Bot-Direktnachrichten und Gruppen über grammY. Long Polling ist der Standardtransport; der Webhook-Modus ist optional.

<CardGroup cols={3}>
  <Card title="Kopplung" icon="link" href="/de/channels/pairing">
    Die standardmäßige Direktnachrichtenrichtlinie für Telegram ist die Kopplung.
  </Card>
  <Card title="Fehlerbehebung für Kanäle" icon="wrench" href="/de/channels/troubleshooting">
    Kanalübergreifende Diagnose- und Reparaturleitfäden.
  </Card>
  <Card title="Gateway-Konfiguration" icon="settings" href="/de/gateway/configuration">
    Vollständige Muster und Beispiele für die Kanalkonfiguration.
  </Card>
</CardGroup>

## Schnelleinrichtung

<Steps>
  <Step title="Bot-Token in BotFather erstellen">
    Beide Vorgehensweisen liefern ein Token, das Sie in OpenClaw einfügen – wählen Sie eine davon:

    - **Chat-Verfahren**: Öffnen Sie Telegram, beginnen Sie einen Chat mit **@BotFather** (vergewissern Sie sich, dass der Handle genau `@BotFather` lautet), führen Sie `/newbot` aus, folgen Sie den Anweisungen und speichern Sie das Token.
    - **Web-Verfahren**: Öffnen Sie [die Web-App von BotFather](https://t.me/BotFather?startapp) – sie funktioniert in jedem Telegram-Client, einschließlich [web.telegram.org](https://web.telegram.org) – erstellen Sie den Bot in der Benutzeroberfläche und kopieren Sie dessen Token.

  </Step>

  <Step title="Token und Direktnachrichtenrichtlinie konfigurieren">

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

    Umgebungsvariablen-Ausweichlösung: `TELEGRAM_BOT_TOKEN` (nur für das Standardkonto; benannte Konten müssen `botToken` oder `tokenFile` verwenden).
    Telegram verwendet **nicht** `openclaw channels login telegram`; legen Sie das Token in der Konfiguration oder Umgebung fest und starten Sie anschließend das Gateway.

  </Step>

  <Step title="Gateway starten und erste Direktnachricht genehmigen">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Kopplungscodes laufen nach 1 Stunde ab.

  </Step>

  <Step title="Bot einer Gruppe hinzufügen">
    Fügen Sie den Bot Ihrer Gruppe hinzu und ermitteln Sie anschließend die beiden IDs, die für den Gruppenzugriff erforderlich sind:

    - Ihre Telegram-Benutzer-ID für `allowFrom` / `groupAllowFrom`
    - die Telegram-Gruppenchat-ID als Schlüssel unter `channels.telegram.groups`

    Ermitteln Sie die Gruppenchat-ID über `openclaw logs --follow`, einen Bot für weitergeleitete IDs oder `getUpdates` der Bot API. Nachdem die Gruppe zugelassen wurde, bestätigt `/whoami@<bot_username>` die Benutzer- und Gruppen-IDs.

    Negative Supergruppen-IDs, die mit `-100` beginnen, sind Gruppenchat-IDs. Sie gehören unter `channels.telegram.groups`, nicht unter `groupAllowFrom`.

  </Step>
</Steps>

<Note>
Die Token-Auflösung berücksichtigt das Konto: `tokenFile` hat Vorrang vor `botToken`, das wiederum Vorrang vor der Umgebungsvariable hat; die Konfiguration hat stets Vorrang vor `TELEGRAM_BOT_TOKEN` (das nur für das Standardkonto aufgelöst wird). Nach einem erfolgreichen Start speichert OpenClaw die Bot-Identität bis zu 24 Stunden im Cache, sodass bei Neustarts ein zusätzlicher `getMe`-Aufruf entfällt; durch Ändern oder Entfernen des Tokens wird dieser Cache geleert.
</Note>

## Telegram-seitige Einstellungen

<AccordionGroup>
  <Accordion title="Datenschutzmodus und Gruppensichtbarkeit">
    Telegram-Bots verwenden standardmäßig den **Privacy Mode**, der einschränkt, welche Gruppennachrichten sie empfangen.

    Um alle Gruppennachrichten zu sehen, können Sie entweder:

    - den Datenschutzmodus über `/setprivacy` deaktivieren oder
    - den Bot zum Gruppenadministrator machen.

    Nachdem Sie den Datenschutzmodus umgeschaltet haben, entfernen Sie den Bot aus jeder Gruppe und fügen Sie ihn erneut hinzu, damit Telegram die Änderung übernimmt.

  </Accordion>

  <Accordion title="Gruppenberechtigungen">
    Der Administratorstatus wird in den Telegram-Gruppeneinstellungen gesteuert. Administrator-Bots empfangen alle Gruppennachrichten, was für dauerhaft aktives Gruppenverhalten nützlich ist.
  </Accordion>

  <Accordion title="Hilfreiche BotFather-Schalter">

    - `/setjoingroups` – das Hinzufügen zu Gruppen erlauben/ablehnen
    - `/setprivacy` – Verhalten der Gruppensichtbarkeit

    Dieselben Einstellungen sind in [der Web-App von BotFather](https://t.me/BotFather?startapp) verfügbar, falls Sie eine Benutzeroberfläche gegenüber Chat-Befehlen bevorzugen.

  </Accordion>
</AccordionGroup>

## Dashboard-Mini-App

Führen Sie `/dashboard` in einer Direktnachricht an den Bot aus, um das OpenClaw-Dashboard innerhalb von Telegram zu öffnen.

Anforderungen:

- `gateway.tailscale.mode: "serve"` oder `"funnel"` für die veröffentlichte HTTPS-URL der Mini-App.
- Ihre numerische Telegram-Benutzer-ID muss im effektiven `allowFrom` des ausgewählten Kontos oder in `commands.ownerAllowFrom` enthalten sein.
- Verwenden Sie eine Direktnachricht. In Gruppen antwortet `/dashboard` mit `open this in a DM with the bot` und sendet keine Schaltfläche.
- Docker-Installationen: Serve-/Funnel-Modi erfordern, dass das Gateway neben `tailscaled` an die Loopback-Schnittstelle gebunden wird, was Bridge-Netzwerke mit veröffentlichten Ports nicht erfüllen können. Führen Sie den Gateway-Container mit `network_mode: host` aus und binden Sie den `tailscaled`-Socket des Hosts (`/var/run/tailscale`) sowie die `tailscale`-CLI in den Container ein.

Die Mini-App ist ein ausschließlich für Tailscale vorgesehener v1-Pfad und unterstützt keinen Telegram-Web-Iframe.

## Zugriffskontrolle und Aktivierung

### Bot-Identität in Gruppen

In Gruppen und Forenthemen richtet eine explizite Erwähnung des konfigurierten Bot-Handles (zum Beispiel `@my_bot`) die Nachricht an den ausgewählten OpenClaw-Agenten, selbst wenn sich der Persona-Name des Agenten vom Telegram-Benutzernamen unterscheidet. Die Richtlinie zur Stummschaltung in Gruppen gilt weiterhin für nicht zugehörigen Datenverkehr, aber das Bot-Handle selbst ist niemals „jemand anderes“.

<Tabs>
  <Tab title="DM-Richtlinie">
    `channels.telegram.dmPolicy` steuert den Zugriff auf Direktnachrichten:

    - `pairing` (Standard)
    - `allowlist` (erfordert mindestens eine Absender-ID in `allowFrom`)
    - `open` (erfordert, dass `allowFrom` `"*"` enthält)
    - `disabled`

    Mit `dmPolicy: "open"` und `allowFrom: ["*"]` kann jedes Telegram-Konto, das den Benutzernamen des Bots findet oder errät, dem Bot Befehle erteilen. Verwenden Sie dies nur für absichtlich öffentliche Bots mit stark eingeschränkten Tools; Bots mit nur einem Eigentümer sollten `allowlist` mit numerischen Benutzer-IDs verwenden.

    `channels.telegram.allowFrom` akzeptiert numerische Telegram-Benutzer-IDs. Die Präfixe `telegram:` / `tg:` werden akzeptiert und normalisiert.
    In Konfigurationen mit mehreren Konten bildet ein restriktives `channels.telegram.allowFrom` auf oberster Ebene eine Sicherheitsgrenze: Ein `allowFrom: ["*"]` auf Kontoebene macht dieses Konto nicht öffentlich, sofern die zusammengeführte effektive Zulassungsliste nicht weiterhin einen expliziten Platzhalter enthält.
    `dmPolicy: "allowlist"` mit leerem `allowFrom` blockiert alle DMs und wird von der Konfigurationsvalidierung abgelehnt.
    Die Einrichtung fragt ausschließlich nach numerischen Benutzer-IDs. Wenn Ihre Konfiguration `@username`-Einträge in der Zulassungsliste aus einer älteren Einrichtung enthält, führen Sie `openclaw doctor --fix` aus, um sie in numerische IDs aufzulösen (nach bestem Bemühen; erfordert ein Telegram-Bot-Token).
    Wenn Sie sich zuvor auf Zulassungslistendateien des Pairing-Speichers verlassen haben, kann `openclaw doctor --fix` Einträge für Zulassungslistenabläufe in `channels.telegram.allowFrom` wiederherstellen (zum Beispiel, wenn für `dmPolicy: "allowlist"` noch keine expliziten IDs vorhanden sind).

    Bevorzugen Sie für Bots mit nur einem Eigentümer `dmPolicy: "allowlist"` mit expliziten numerischen `allowFrom`-IDs, statt sich auf frühere Pairing-Genehmigungen zu verlassen.

    Häufiges Missverständnis: Die Genehmigung eines DM-Pairings bedeutet nicht „Dieser Absender ist überall autorisiert“. Pairing gewährt ausschließlich Zugriff auf DMs. Wenn noch kein Befehlseigentümer vorhanden ist, legt das erste genehmigte Pairing außerdem `commands.ownerAllowFrom` fest, wodurch Befehle nur für Eigentümer und Ausführungsgenehmigungen einem expliziten Betreiberkonto zugeordnet werden. Die Absenderautorisierung in Gruppen stammt weiterhin aus expliziten Konfigurations-Zulassungslisten.
    So autorisieren Sie dieselbe Identität sowohl für DMs als auch für Gruppenbefehle: Tragen Sie Ihre numerische Telegram-Benutzer-ID in `channels.telegram.allowFrom` ein und stellen Sie für Befehle nur für Eigentümer sicher, dass `commands.ownerAllowFrom` den Eintrag `telegram:<your user id>` enthält.

    ### Ihre Telegram-Benutzer-ID ermitteln

    Sicherer (kein Drittanbieter-Bot): Senden Sie Ihrem Bot eine DM, führen Sie `openclaw logs --follow` aus und lesen Sie `from.id`.

    Offizielle Bot-API-Methode:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Drittanbieter (weniger privat): `@userinfobot` oder `@getidsbot`.

  </Tab>

  <Tab title="Gruppenrichtlinie und Zulassungslisten">
    Zwei Steuerungen gelten gemeinsam:

    1. **Welche Gruppen zulässig sind** (`channels.telegram.groups`)
       - keine `groups`-Konfiguration, `groupPolicy: "open"`: Jede Gruppe besteht die Gruppen-ID-Prüfungen
       - keine `groups`-Konfiguration, `groupPolicy: "allowlist"` (Standard): Alle Gruppen werden blockiert, bis Sie `groups`-Einträge (oder `"*"`) hinzufügen
       - `groups` konfiguriert: fungiert als Zulassungsliste (explizite IDs oder `"*"`)

    2. **Welche Absender in Gruppen zulässig sind** (`channels.telegram.groupPolicy`)
       - `open` / `allowlist` (Standard) / `disabled`

    `groupAllowFrom` filtert Gruppenabsender; wenn es nicht festgelegt ist, greift Telegram auf `allowFrom` zurück (nicht auf den Pairing-Speicher – die Gruppenabsender-Authentifizierung übernimmt niemals Genehmigungen aus dem DM-Pairing-Speicher; dies ist seit `2026.2.25` eine Sicherheitsgrenze).
    Einträge in `groupAllowFrom` sollten numerische Telegram-Benutzer-IDs sein (die Präfixe `telegram:` / `tg:` werden normalisiert); nicht numerische Einträge werden ignoriert. Tragen Sie hier keine Chat-IDs von Gruppen oder Supergruppen ein – negative Chat-IDs gehören unter `channels.telegram.groups`.
    Praktisches Muster für Bots mit nur einem Eigentümer: Legen Sie Ihre Benutzer-ID in `channels.telegram.allowFrom` fest, lassen Sie `groupAllowFrom` nicht gesetzt und erlauben Sie die Zielgruppen unter `channels.telegram.groups`.
    Wenn `channels.telegram` vollständig in der Konfiguration fehlt, verwendet die Laufzeit standardmäßig die ausfallsichere Einstellung `groupPolicy="allowlist"`, sofern `channels.defaults.groupPolicy` nicht explizit festgelegt ist.

    Gruppeneinrichtung nur für Eigentümer:

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

    Testen Sie aus der Gruppe heraus mit `@<bot_username> ping`. Einfache Gruppennachrichten lösen den Bot nicht aus, solange `requireMention: true` gilt.

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

      - Negative Chat-IDs von Telegram-Gruppen/Supergruppen (`-1001234567890`) gehören unter `channels.telegram.groups`.
      - Telegram-Benutzer-IDs (`8734062810`) gehören unter `groupAllowFrom`, um einzuschränken, welche Personen innerhalb einer zulässigen Gruppe den Bot auslösen können.
      - Verwenden Sie `groupAllowFrom: ["*"]` nur, um jedem Mitglied einer zulässigen Gruppe die Kommunikation mit dem Bot zu gestatten.

    </Warning>

  </Tab>

  <Tab title="Erwähnungsverhalten">
    Gruppenantworten erfordern standardmäßig eine Erwähnung. Eine Erwähnung kann aus Folgendem stammen:

    - einer nativen `@botusername`-Erwähnung oder
    - einem Erwähnungsmuster in `agents.list[].groupChat.mentionPatterns` oder `messages.groupChat.mentionPatterns`

    Umschalter auf Sitzungsebene (nur Zustand, nicht persistent): `/activation always`, `/activation mention`. Verwenden Sie für Persistenz die Konfiguration:

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

    Der Gruppenverlaufskontext ist immer aktiviert und durch `historyLimit` begrenzt. Legen Sie `channels.telegram.historyLimit: 0` fest, um das Gruppenverlaufsfenster zu deaktivieren. `openclaw doctor --fix` entfernt den eingestellten Schlüssel `includeGroupHistoryContext`.

    So ermitteln Sie die Gruppen-Chat-ID: Leiten Sie eine Gruppennachricht an `@userinfobot` / `@getidsbot` weiter, lesen Sie `chat.id` aus `openclaw logs --follow`, prüfen Sie `getUpdates` der Bot API oder führen Sie (sobald die Gruppe zugelassen ist) `/whoami@<bot_username>` aus.

  </Tab>
</Tabs>

## Laufzeitverhalten

- Telegram wird innerhalb des Gateway-Prozesses ausgeführt.
- Das Routing ist deterministisch: Auf eingehende Telegram-Nachrichten wird über Telegram geantwortet (das Modell wählt keine Kanäle aus).
- Eingehende Nachrichten werden in den gemeinsamen Kanal-Umschlag mit Antwortmetadaten, Medienplatzhaltern und dauerhaft gespeichertem Antwortkettenkontext für Antworten normalisiert, die das Gateway beobachtet hat.
- Gruppensitzungen werden anhand der Gruppen-ID isoliert. Bei Forenthemen wird `:topic:<threadId>` angehängt.
- Direktnachrichten können `message_thread_id` enthalten; OpenClaw behält diese ID für Antworten bei. Sitzungen für Direktnachrichtenthemen werden nur aufgeteilt, wenn Telegram `getMe` für den Bot mit `has_topics_enabled: true` antwortet; andernfalls verbleiben Direktnachrichten in der nicht unterteilten Sitzung.
- Long Polling verwendet den grammY-Runner mit einer Sequenzierung pro Chat und Thread. Die Nebenläufigkeit der Runner-Senke verwendet `agents.defaults.maxConcurrent`.
- Beim Start mit mehreren Konten wird die Anzahl gleichzeitiger `getMe`-Abfragen begrenzt, damit bei großen Bot-Flotten nicht alle Kontoabfragen gleichzeitig aufgefächert werden.
- Jeder Gateway-Prozess schützt Long Polling so, dass jeweils nur ein aktiver Poller ein Bot-Token verwenden kann. Dauerhafte 409-Konflikte bei `getUpdates` weisen auf ein anderes OpenClaw-Gateway, ein Skript oder einen externen Poller hin, das bzw. der dasselbe Token verwendet.
- Der Polling-Watchdog startet standardmäßig neu, wenn 120 Sekunden lang keine abgeschlossene `getUpdates`-Aktivitätsprüfung erfolgt. Erhöhen Sie `channels.telegram.pollingStallThresholdMs` (30000-600000, Überschreibungen pro Konto werden unterstützt) nur, wenn Ihre Bereitstellung bei lang laufenden Vorgängen fälschlicherweise Neustarts wegen eines Polling-Stillstands verzeichnet.
- Die Telegram Bot API unterstützt keine Lesebestätigungen (`sendReadReceipts` ist nicht anwendbar).

<Note>
  `channels.telegram.dm.threadReplies` und `channels.telegram.direct.<chatId>.threadReplies` wurden entfernt. Führen Sie nach dem Upgrade `openclaw doctor --fix` aus, wenn Ihre Konfiguration diese Schlüssel noch enthält. Das Routing von Direktnachrichtenthemen richtet sich nun nach Telegrams `getMe.has_topics_enabled` (gesteuert durch den Thread-Modus von BotFather): Bots mit aktivierten Themen verwenden threadbezogene Direktnachrichtensitzungen, wenn Telegram `message_thread_id` sendet; andere Direktnachrichten verbleiben in der nicht unterteilten Sitzung.
</Note>

## Funktionsreferenz

<AccordionGroup>
  <Accordion title="Live-Stream-Vorschau (Nachrichtenbearbeitungen)">
    OpenClaw streamt Teilantworten in Echtzeit in Direktchats, Gruppen und Themen: Zunächst wird eine Vorschaunachricht gesendet, dann wiederholt `editMessageText` aufgerufen und die Nachricht schließlich direkt an Ort und Stelle fertiggestellt.

    - `channels.telegram.streaming` ist `off | partial | block | progress` (Standard: `partial`)
    - kurze Vorschauen der anfänglichen Antwort werden entprellt und nach einer begrenzten Verzögerung umgesetzt, wenn der Vorgang noch aktiv ist
    - `progress` behält einen einzelnen bearbeitbaren Statusentwurf für den Werkzeugfortschritt bei, zeigt die stabile Statusbezeichnung an, wenn Antwortaktivität vor dem Werkzeugfortschritt eintrifft, löscht ihn beim Abschluss und sendet die endgültige Antwort als normale Nachricht
    - `streaming.preview.toolProgress` steuert, ob Werkzeug-/Fortschrittsaktualisierungen dieselbe bearbeitete Vorschaunachricht wiederverwenden (Standard: `true`, wenn Vorschau-Streaming aktiv ist)
    - `streaming.preview.commandText` steuert Befehls-/Ausführungsdetails innerhalb dieser Zeilen: `raw` (Standard) oder `status` (nur Werkzeugbezeichnung)
    - `streaming.progress.commentary` (Standard: `false`) aktiviert Kommentar-/Präambeltext des Assistenten im temporären Fortschrittsentwurf
    - veraltete Werte für `channels.telegram.streamMode`, boolesche `streaming`-Werte und ausgemusterte Schlüssel für native Entwurfsvorschauen werden erkannt; führen Sie `openclaw doctor --fix` aus, um sie zu migrieren

    Werkzeugfortschrittszeilen sind die kurzen Statusaktualisierungen, die während der Ausführung von Werkzeugen angezeigt werden (Befehlsausführung, Lesen von Dateien, Planungsaktualisierungen, Patch-Zusammenfassungen, Codex-Präambel/-Kommentare im App-Server-Modus). Telegram aktiviert diese standardmäßig (entspricht dem veröffentlichten Verhalten ab `v2026.4.22`).

    Bearbeitungen der Antwortvorschau beibehalten, aber Werkzeugfortschrittszeilen ausblenden:

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

    Der Modus `progress` zeigt den Werkzeugfortschritt an, ohne die endgültige Antwort in diese Nachricht hineinzubearbeiten. Legen Sie die Richtlinie für Befehlstext unter `streaming.progress` ab:

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

    `streaming.mode: "off"` deaktiviert Vorschaubearbeitungen und unterdrückt allgemeine Werkzeug-/Fortschrittsmeldungen, statt sie als eigenständige Statusmeldungen zu senden; Genehmigungsaufforderungen, Medien und Fehler werden weiterhin über die normale endgültige Zustellung weitergeleitet. `streaming.preview.toolProgress: false` behält nur Bearbeitungen der Antwortvorschau bei.

    <Note>
      Antworten auf ausgewählte Zitate bilden die Ausnahme. Wenn `replyToMode` den Wert `first`, `all` oder `batched` hat und die eingehende Nachricht ausgewählten Zitattext enthält, sendet OpenClaw die endgültige Antwort über Telegrams nativen Pfad für Zitatantworten, statt die Antwortvorschau zu bearbeiten. Daher kann `streaming.preview.toolProgress` in diesem Durchlauf keine Statuszeilen anzeigen. Antworten auf die aktuelle Nachricht ohne ausgewählten Zitattext werden weiterhin gestreamt. Setzen Sie `replyToMode: "off"`, wenn die Sichtbarkeit des Werkzeugfortschritts wichtiger ist als native Zitatantworten, oder `streaming.preview.toolProgress: false`, wenn Sie diesen Kompromiss akzeptieren.
    </Note>

    Bei reinen Textantworten: Kurze Vorschauen erhalten die endgültige Bearbeitung direkt an Ort und Stelle; bei langen endgültigen Antworten, die in mehrere Nachrichten aufgeteilt werden, wird die Vorschau als erstes Segment wiederverwendet und anschließend nur der Rest gesendet; endgültige Antworten im Fortschrittsmodus löschen den Statusentwurf und verwenden die normale endgültige Zustellung; schlägt die endgültige Bearbeitung fehl, bevor der Abschluss bestätigt wurde, greift OpenClaw auf die normale endgültige Zustellung zurück und bereinigt die veraltete Vorschau. Bei komplexen Antworten (Medien-Nutzdaten) greift OpenClaw immer auf die normale endgültige Zustellung zurück und bereinigt die Vorschau.

    Vorschau-Streaming und Block-Streaming schließen sich gegenseitig aus — wenn Block-Streaming ausdrücklich aktiviert ist, überspringt OpenClaw den Vorschau-Stream, um doppeltes Streaming zu vermeiden.

    Schlussfolgerungen: `/reasoning stream` streamt die Schlussfolgerungen während der Generierung in die Live-Vorschau und löscht die Vorschau der Schlussfolgerungen nach der endgültigen Zustellung (verwenden Sie `/reasoning on`, damit sie sichtbar bleibt). Die endgültige Antwort wird ohne Schlussfolgerungstext gesendet.

  </Accordion>

  <Accordion title="Formatierung umfangreicher Nachrichten">
    Ausgehender Text verwendet standardmäßig normale Telegram-HTML-Nachrichten, die in aktuellen Clients lesbar sind: fett, kursiv, Links, Code, Spoiler, Zitate — keine ausschließlich umfangreichen Blöcke der Bot API 10.1 (native Tabellen, Details, Rich Media, Formeln).

    Aktivieren Sie umfangreiche Nachrichten der Bot API 10.1:

```json5
{
  channels: {
    telegram: {
      richMessages: true,
    },
  },
}
```

    Wenn aktiviert: Der Agent wird darüber informiert, dass für diesen Bot/dieses Konto umfangreiche Nachrichten verfügbar sind; Markdown-Text wird über OpenClaws Markdown-IR als umfangreiches Telegram-HTML gerendert; explizite umfangreiche HTML-Nutzdaten behalten unterstützte Tags der Bot API 10.1 bei (Überschriften, Tabellen, Details, Rich Media, Formeln); Medienbeschriftungen verwenden weiterhin Telegram-HTML-Beschriftungen (umfangreiche Nachrichten ersetzen Beschriftungen nicht, und Beschriftungen sind auf 1024 Zeichen begrenzt).

    Dadurch bleibt Modelltext von Telegrams speziellen Rich-Markdown-Zeichen fern, sodass Währungsangaben wie `$400-600K` nicht als Mathematik interpretiert werden. Langer umfangreicher Text wird automatisch entsprechend den Telegram-Grenzwerten aufgeteilt. Tabellen mit mehr als 20 Spalten greifen auf einen Codeblock zurück.

    Standard: deaktiviert, aus Gründen der Client-Kompatibilität — einige aktuelle Desktop-, Web-, Android- und Drittanbieter-Clients stellen akzeptierte umfangreiche Nachrichten als nicht unterstützt dar. Lassen Sie diese Option deaktiviert, sofern nicht jeder mit dem Bot verwendete Client sie darstellen kann. `/status` zeigt an, ob umfangreiche Nachrichten für die aktuelle Sitzung aktiviert oder deaktiviert sind.

    Linkvorschauen sind standardmäßig aktiviert. `channels.telegram.linkPreview: false` deaktiviert die automatische Entitätserkennung für umfangreichen Text.

  </Accordion>

  <Accordion title="Native und benutzerdefinierte Befehle">
    Das Befehlsmenü von Telegram wird beim Start mit `setMyCommands` registriert. `commands.native: "auto"` aktiviert native Befehle für Telegram.

    Fügen Sie benutzerdefinierte Einträge zum Befehlsmenü hinzu:

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

    Regeln: Namen werden normalisiert (führendes `/` entfernen, in Kleinbuchstaben umwandeln); gültiges Muster `a-z`, `0-9`, `_`, Länge 1-32; benutzerdefinierte Befehle können native Befehle nicht überschreiben; Konflikte/Duplikate werden übersprungen und protokolliert.

    Benutzerdefinierte Befehle sind nur Menüeinträge — sie implementieren nicht automatisch ein Verhalten. Plugin-/Skill-Befehle können bei manueller Eingabe weiterhin funktionieren, auch wenn sie nicht im Telegram-Menü angezeigt werden. Wenn native Befehle deaktiviert sind, werden integrierte Befehle entfernt; benutzerdefinierte/Plugin-Befehle können bei entsprechender Konfiguration weiterhin registriert werden.

    Häufige Einrichtungsfehler:

    - `setMyCommands failed` mit `BOT_COMMANDS_TOO_MUCH` nach einem erneuten Kürzungsversuch bedeutet, dass das Menü weiterhin zu viele Einträge enthält; reduzieren Sie Plugin-/Skill-/benutzerdefinierte Befehle oder deaktivieren Sie `channels.telegram.commands.native`.
    - Wenn `deleteWebhook`, `deleteMyCommands` oder `setMyCommands` mit `404: Not Found` fehlschlägt, während direkte Bot-API-curl-Befehle funktionieren, bedeutet dies normalerweise, dass `channels.telegram.apiRoot` auf den vollständigen Endpunkt `/bot<TOKEN>` gesetzt wurde. `apiRoot` darf nur der Stamm der Bot API sein; `openclaw doctor --fix` entfernt ein versehentlich angehängtes `/bot<TOKEN>`.
    - `getMe returned 401` bedeutet, dass Telegram das konfigurierte Bot-Token abgelehnt hat. Aktualisieren Sie `botToken`, `tokenFile` oder `TELEGRAM_BOT_TOKEN` (Standardkonto) mit dem aktuellen BotFather-Token; OpenClaw stoppt vor dem Polling, sodass dies nicht als Fehler bei der Webhook-Bereinigung gemeldet wird.
    - `setMyCommands failed` mit Netzwerk-/Abruffehlern bedeutet normalerweise, dass ausgehende DNS-/HTTPS-Verbindungen zu `api.telegram.org` blockiert sind.

    ### Befehle zur Gerätekopplung (`device-pair`-Plugin)

    Wenn installiert:

    1. `/pair` erzeugt einen Einrichtungscode
    2. Fügen Sie den Code in der iOS-App ein
    3. `/pair pending` listet ausstehende Anfragen auf (einschließlich Rolle/Berechtigungsumfängen)
    4. Genehmigen: `/pair approve <requestId>`, `/pair approve` (einzige ausstehende Anfrage) oder `/pair approve latest`

    Wenn ein Gerät einen erneuten Versuch mit geänderten Authentifizierungsdetails (Rolle, Berechtigungsumfänge, öffentlicher Schlüssel) unternimmt, wird die vorherige ausstehende Anfrage durch eine neue `requestId` ersetzt; führen Sie vor der Genehmigung erneut `/pair pending` aus.

    Weitere Einzelheiten: [Kopplung](/de/channels/pairing#pair-via-telegram).

  </Accordion>

  <Accordion title="Inline-Schaltflächen">
    Konfigurieren Sie den Geltungsbereich der Inline-Tastatur:

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

    Überschreibung pro Konto:

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

    Geltungsbereiche: `off`, `dm`, `group`, `all`, `allowlist` (Standard). Veraltetes `capabilities: ["inlineButtons"]` wird `"all"` zugeordnet.

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

    Callback-Klicks, die nicht von einem registrierten interaktiven Plugin-Handler beansprucht werden, werden als Text an den Agenten übergeben: `callback_data: <value>`.

  </Accordion>

  <Accordion title="Telegram-Nachrichtenaktionen für Agenten und Automatisierung">
    Aktionen:

    - `sendMessage` (`to`, `content`, optional `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content` oder `caption`, optionale Inline-Schaltflächen in `presentation`; Änderungen nur an Schaltflächen aktualisieren das Antwort-Markup)
    - `createForumTopic` (`chatId`, `name`, optional `iconColor`, `iconCustomEmojiId`)

    Ergonomische Aliasse: `send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`.

    Aktivierung: `channels.telegram.actions.sendMessage`, `deleteMessage`, `reactions`, `sticker` (Standard: deaktiviert). `edit`, `createForumTopic` und `editForumTopic` sind standardmäßig aktiviert und haben keinen eigenen Umschalter.
    Zur Laufzeit verwenden Sendevorgänge den aktiven Konfigurations-/Secrets-Snapshot vom Start bzw. Neuladen, sodass Aktionspfade `SecretRef`-Werte nicht bei jedem Senden erneut auflösen.

    Semantik beim Entfernen von Reaktionen: [/tools/reactions](/de/tools/reactions).

  </Accordion>

  <Accordion title="Tags für Antwort-Threads">
    Explizite Tags für Antwort-Threads in generierter Ausgabe:

    - `[[reply_to_current]]` — antwortet auf die auslösende Nachricht
    - `[[reply_to:<id>]]` — antwortet auf eine bestimmte Nachrichten-ID

    `channels.telegram.replyToMode`: `off` (Standard), `first`, `all`.

    Wenn Antwort-Threads aktiviert sind und der ursprüngliche Text bzw. die ursprüngliche Bildunterschrift verfügbar ist, fügt OpenClaw automatisch einen nativen Zitat-Auszug hinzu. Telegram begrenzt nativen Zitattext auf 1024 UTF-16-Codeeinheiten; bei längeren Nachrichten wird vom Anfang an zitiert und auf eine einfache Antwort zurückgegriffen, wenn Telegram das Zitat ablehnt.

    `off` deaktiviert nur implizite Antwort-Threads; explizite `[[reply_to_*]]`-Tags werden weiterhin berücksichtigt.

  </Accordion>

  <Accordion title="Forenthemen und Thread-Verhalten">
    Forum-Supergruppen: An Sitzungsschlüssel für Themen wird `:topic:<threadId>` angehängt; Antworten und Tippanzeigen werden an den Themen-Thread gerichtet; der Konfigurationspfad für Themen lautet `channels.telegram.groups.<chatId>.topics.<threadId>`.

    Das allgemeine Thema (`threadId=1`) ist ein Sonderfall: Beim Senden von Nachrichten wird `message_thread_id` weggelassen (Telegram lehnt `sendMessage(...thread_id=1)` mit "thread not found" ab), Tippaktionen enthalten jedoch weiterhin `message_thread_id` (empirisch erforderlich, damit die Tippanzeige erscheint).

    Themeneinträge erben Gruppeneinstellungen, sofern sie nicht überschrieben werden (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`). `agentId` gilt nur für Themen und wird nicht von den Gruppenstandardwerten geerbt. `topics."*"` legt Standardwerte für jedes Thema in dieser Gruppe fest; exakte Themen-IDs haben weiterhin Vorrang vor `"*"`.

    **Agent-Routing pro Thema**: Jedes Thema kann über `agentId` in der Themenkonfiguration an einen anderen Agenten weitergeleitet werden und erhält dadurch einen eigenen Arbeitsbereich, Speicher und eine eigene Sitzung:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // Allgemeines Thema -> Hauptagent
                "3": { agentId: "zu" },        // Entwicklungsthema -> Agent zu
                "5": { agentId: "coder" }      // Code-Review -> Agent coder
              }
            }
          }
        }
      }
    }
    ```

    Jedes Thema besitzt anschließend einen eigenen Sitzungsschlüssel, zum Beispiel `agent:zu:telegram:group:-1001234567890:topic:3`.

    **Persistente ACP-Themenbindung**: Forenthemen können ACP-Harness-Sitzungen über typisierte Bindungen auf oberster Ebene anheften (`bindings[]` mit `type: "acp"`, `match.channel: "telegram"`, `peer.kind: "group"` und einer themenspezifischen ID wie `-1001234567890:topic:42`). Derzeit auf Forenthemen in Gruppen/Supergruppen beschränkt. Siehe [ACP-Agenten](/de/tools/acp-agents).

    **Thread-gebundener ACP-Start aus dem Chat**: `/acp spawn <agent> --thread here|auto` bindet das aktuelle Thema an eine neue ACP-Sitzung; Folgenachrichten werden direkt dorthin geleitet, und OpenClaw heftet die Startbestätigung innerhalb des Themas an. Erfordert `channels.telegram.threadBindings.spawnSessions` (Standard: `true`).

    Der Vorlagenkontext stellt `MessageThreadId` und `IsForum` bereit. Direktnachrichten-Chats mit `message_thread_id` behalten Antwortmetadaten bei, verwenden Thread-spezifische Sitzungsschlüssel jedoch nur, wenn Telegram `getMe` den Wert `has_topics_enabled: true` meldet.
    Die eingestellten Überschreibungen `dm.threadReplies` und `direct.*.threadReplies` wurden entfernt; der Thread-Modus von BotFather ist die alleinige maßgebliche Quelle. Führen Sie `openclaw doctor --fix` aus, um veraltete Konfigurationsschlüssel zu entfernen.

  </Accordion>

  <Accordion title="Audio, Video und Sticker">
    ### Audionachrichten

    Telegram unterscheidet Sprachnachrichten von Audiodateien. Standard: Verhalten als Audiodatei; verwenden Sie den Tag `[[audio_as_voice]]` in der Antwort des Agenten, um das Senden als Sprachnachricht zu erzwingen. Transkripte eingehender Sprachnachrichten werden im Agentenkontext als maschinell erzeugter, nicht vertrauenswürdiger Text gekennzeichnet, die Erwähnungserkennung verwendet jedoch weiterhin das Rohtranskript, sodass durch Erwähnungen beschränkte Sprachnachrichten weiterhin funktionieren.

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

    Telegram unterscheidet Videodateien von Videonachrichten. Videonachrichten unterstützen keine Bildunterschriften; bereitgestellter Nachrichtentext wird separat gesendet.

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

    Verwenden Sie die vorhandene Aktion `send` mit einem eigenständigen `location`-Objekt. Koordinaten senden eine native Markierung; wenn sowohl `name` als auch `address` hinzugefügt werden, wird eine native Ortskarte gesendet. Standortangaben können nicht zusammen mit Nachrichtentext oder Medien gesendet werden.

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

  <Accordion title="Reaction notifications">
    Telegram-Reaktionen gehen als `message_reaction`-Updates ein, getrennt von den Nachrichtennutzdaten. Wenn diese Funktion aktiviert ist, stellt OpenClaw Systemereignisse wie `Telegram reaction added: 👍 by Alice (@alice) on msg 42` in die Warteschlange.

    - `channels.telegram.reactionNotifications`: `off | own | all` (Standard: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (Standard: `minimal`)

    `own` bezeichnet ausschließlich Reaktionen von Benutzern auf vom Bot gesendete Nachrichten (nach bestem Bemühen über einen Cache gesendeter Nachrichten). Für Reaktionsereignisse gelten weiterhin die Telegram-Zugriffskontrollen (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); nicht autorisierte Absender werden verworfen.

    Telegram stellt in Reaktionsaktualisierungen keine Thread-IDs bereit: Nicht-Forum-Gruppen werden an die Gruppenchat-Sitzung weitergeleitet; Forum-Gruppen werden an die Sitzung des allgemeinen Themas (`:topic:1`) weitergeleitet, nicht an das genaue Ursprungsthema.

    `allowed_updates` für Polling/Webhook enthält automatisch `message_reaction`.

  </Accordion>

  <Accordion title="Bestätigungsreaktionen">
    `ackReaction` sendet ein Bestätigungs-Emoji, während OpenClaw eine eingehende Nachricht verarbeitet. `messages.ackReactionScope` legt fest, *wann* es gesendet wird.

    **Reihenfolge der Emoji-Auflösung:**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - Fallback auf das Emoji der Agentenidentität (`agents.list[].identity.emoji`, andernfalls "👀")

    Telegram erwartet ein Unicode-Emoji (zum Beispiel "👀"); verwenden Sie `""`, um die Reaktion für einen Kanal oder ein Konto zu deaktivieren.

    **Geltungsbereich (`messages.ackReactionScope`, Standardwert `"group-mentions"`; derzeit keine Überschreibung pro Telegram-Konto oder Telegram-Kanal):**

    `all` (Direktnachrichten + Gruppen, einschließlich umgebender Raumereignisse), `direct` (nur Direktnachrichten), `group-all` (jede Gruppennachricht außer umgebenden Raumereignissen, keine Direktnachrichten), `group-mentions` (Gruppen, wenn der Bot erwähnt wird; **keine Direktnachrichten** — Standardwert), `off` / `none` (deaktiviert).

    <Note>
    Im standardmäßigen Geltungsbereich (`group-mentions`) werden bei Direktnachrichten oder umgebenden Raumereignissen keine Bestätigungsreaktionen ausgelöst. Verwenden Sie `direct` oder `all` für Direktnachrichten; nur `all` bestätigt umgebende Raumereignisse. Dieser Wert wird beim Start des Telegram-Providers gelesen. Daher ist ein Neustart des Gateways erforderlich, damit die Änderung wirksam wird.
    </Note>

  </Accordion>

  <Accordion title="Konfigurationsänderungen durch Telegram-Ereignisse und -Befehle">
    Schreibzugriffe auf die Kanalkonfiguration sind standardmäßig aktiviert (`configWrites !== false`). Durch Telegram ausgelöste Schreibvorgänge umfassen Gruppenmigrationsereignisse (`migrate_to_chat_id`, aktualisiert `channels.telegram.groups`) sowie `/config set` / `/config unset` (erfordert die Aktivierung der Befehle).

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
    Standardmäßig wird Long Polling verwendet. Legen Sie für den Webhook-Modus `channels.telegram.webhookUrl` und `channels.telegram.webhookSecret` fest; optional sind `webhookPath` (Standardwert `/telegram-webhook`), `webhookHost` (Standardwert `127.0.0.1`), `webhookPort` (Standardwert `8787`) und `webhookCertPath` (selbstsigniertes Zertifikat im PEM-Format für Konfigurationen mit direkter IP-Adresse oder ohne Domain).

    Im Long-Polling-Modus speichert OpenClaw seine Neustartmarke erst, nachdem eine Aktualisierung erfolgreich zugestellt wurde; bei einem fehlgeschlagenen Handler bleibt diese Aktualisierung im selben Prozess wiederholbar, statt als abgeschlossen markiert zu werden.

    Der lokale Listener bindet standardmäßig an `127.0.0.1:8787`. Schalten Sie für öffentlichen eingehenden Datenverkehr einen Reverse-Proxy vor den lokalen Port oder legen Sie bewusst `webhookHost: "0.0.0.0"` fest.

    Der Webhook-Modus validiert die Anfrageprüfungen, das geheime Telegram-Token und den JSON-Body und schreibt die Aktualisierung anschließend in seine persistente Warteschlange für eingehende Daten, bevor er eine leere `200`-Antwort zurückgibt. Eine erfolgreiche persistente Übernahme enthält `x-openclaw-delivery-accepted: durable`; Antworten zu Systemzustand, Routing, Authentifizierung, Validierung und Speicherfehlern enthalten diesen Header nicht. Reverse-Proxys und Host-Controller können den Header voraussetzen, um die Übernahme durch OpenClaw von einer generischen leeren `200`-Antwort zu unterscheiden, ohne die Annahme aus der Antwortzeit abzuleiten.

    OpenClaw verarbeitet die Aktualisierung anschließend asynchron über dieselben Bot-Verarbeitungsspuren pro Chat und Thema, die auch beim Long Polling verwendet werden. Dadurch halten langsame Agentendurchläufe die Zustellbestätigung von Telegram nicht auf.

  </Accordion>

  <Accordion title="Limits, Wiederholungsversuche und CLI-Ziele">
    - `channels.telegram.textChunkLimit` ist standardmäßig 4000; `streaming.chunkMode="newline"` bevorzugt Absatzgrenzen (Leerzeilen), bevor nach Länge aufgeteilt wird.
    - `channels.telegram.mediaMaxMb` (Standardwert 100) begrenzt die Größe eingehender und ausgehender Medien.
    - `channels.telegram.mediaGroupFlushMs` (Standardwert 500, Bereich 10-60000) steuert, wie lange Alben/Mediengruppen gepuffert werden, bevor OpenClaw sie als eine eingehende Nachricht weiterleitet. Erhöhen Sie den Wert, wenn Teile eines Albums verspätet eintreffen; verringern Sie ihn, um die Antwortlatenz bei Alben zu reduzieren.
    - `channels.telegram.timeoutSeconds` überschreibt das Zeitlimit des API-Clients (wenn nicht festgelegt, gilt der grammY-Standardwert). Bot-Clients begrenzen konfigurierte Werte unterhalb der 60-sekündigen Schutzfrist für ausgehende Text-/Tippanfragen, damit grammY die sichtbare Antwortzustellung nicht abbricht, bevor die Transportschutzfrist und der Fallback von OpenClaw ausgeführt werden können. Long Polling verwendet weiterhin eine 45-sekündige Schutzfrist für `getUpdates`-Anfragen, damit inaktive Abfragen nicht unbegrenzt aufgegeben werden.
    - `channels.telegram.pollingStallThresholdMs` ist standardmäßig 120000; passen Sie den Wert nur bei falsch-positiven Neustarts aufgrund eines Polling-Stillstands innerhalb des Bereichs von 30000 bis 600000 an.
    - Der Gruppen-Kontextverlauf verwendet `channels.telegram.historyLimit` oder `messages.groupChat.historyLimit` (Standardwert 50); `0` deaktiviert ihn.
    - Zusätzlicher Kontext aus Antworten/Zitaten/Weiterleitungen wird in einem ausgewählten Konversationskontextfenster normalisiert, wenn der Gateway die übergeordneten Nachrichten erfasst hat; der Cache erfasster Nachrichten befindet sich im SQLite-Plugin-Status von OpenClaw, und `openclaw doctor --fix` importiert veraltete Sidecar-Dateien. Telegram enthält pro Aktualisierung nur ein flaches `reply_to_message`, daher sind Ketten, die älter als der Cache sind, auf diese Nutzlast beschränkt.
    - Telegram-Zulassungslisten steuern in erster Linie, wer den Agent auslösen kann; sie bilden keine vollständige Schwärzungsgrenze für zusätzlichen Kontext.
    - Direktnachrichtenverlauf: `channels.telegram.dmHistoryLimit`, `channels.telegram.dms["<user_id>"].historyLimit`.
    - `channels.telegram.retry` gilt für Telegram-Sendehilfen (CLI/Tools/Aktionen) bei behebbaren ausgehenden API-Fehlern. Die Zustellung der endgültigen eingehenden Antwort verwendet bei Fehlern vor dem Verbindungsaufbau einen begrenzten sicheren Wiederholungsversuch, wiederholt jedoch keine mehrdeutigen Netzwerkvorgänge nach dem Senden, die sichtbare Nachrichten duplizieren könnten.

    Sendeziele der CLI und des Nachrichten-Tools akzeptieren eine numerische Chat-ID, einen Benutzernamen oder ein Forenthemenziel:

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

    Nur für Telegram verfügbare Umfrage-Flags: `--poll-duration-seconds` (5-600), `--poll-anonymous`, `--poll-public`, `--thread-id` (oder ein `:topic:`-Ziel). `--poll-option` wird 2-12-mal wiederholt (Telegrams Obergrenze für Optionen).

    Das Senden über Telegram unterstützt außerdem `--presentation` mit `buttons`-Blöcken für Inline-Tastaturen (wenn `channels.telegram.capabilities.inlineButtons` dies zulässt), `--pin` oder `--delivery '{"pin":true}'`, um eine angeheftete Zustellung anzufordern, wenn der Bot in diesem Chat Nachrichten anheften darf, sowie `--force-document`, um ausgehende Bilder, GIFs und Videos als Dokumente statt als komprimierte/animierte/Video-Uploads zu senden.

    Aktionssteuerung: `channels.telegram.actions.sendMessage=false` deaktiviert alle ausgehenden Nachrichten einschließlich Umfragen; `channels.telegram.actions.poll=false` deaktiviert die Erstellung von Umfragen, während reguläres Senden aktiviert bleibt.

  </Accordion>

  <Accordion title="Ausführungsgenehmigungen in Telegram">
    Telegram unterstützt Ausführungsgenehmigungen in Direktnachrichten an Genehmigende und kann Aufforderungen optional im ursprünglichen Chat oder Thema veröffentlichen. Genehmigende müssen numerische Telegram-Benutzer-IDs besitzen.

    - `channels.telegram.execApprovals.enabled` (`"auto"` aktiviert die Funktion, wenn mindestens eine genehmigende Person aufgelöst werden kann)
    - `channels.telegram.execApprovals.approvers` (greift auf numerische Eigentümer-IDs aus `commands.ownerAllowFrom` zurück)
    - `channels.telegram.execApprovals.target`: `dm` (Standardwert) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` und `defaultTo` steuern, wer mit dem Bot sprechen kann und wohin er normale Antworten sendet — sie machen eine Person nicht zu einer genehmigenden Person für Ausführungen. Die erste genehmigte Kopplung per Direktnachricht initialisiert `commands.ownerAllowFrom`, wenn noch kein Befehlseigentümer vorhanden ist. Dadurch funktionieren Konfigurationen mit einem Eigentümer, ohne IDs unter `execApprovals.approvers` zu duplizieren.

    Bei der Kanalzustellung wird der Befehlstext im Chat angezeigt; aktivieren Sie `channel` oder `both` nur in vertrauenswürdigen Gruppen/Themen. Wenn die Aufforderung in einem Forenthema eintrifft, behält OpenClaw das Thema für die Genehmigungsaufforderung und die nachfolgende Nachricht bei. Ausführungsgenehmigungen laufen standardmäßig nach 30 Minuten ab.

    Inline-Genehmigungsschaltflächen erfordern außerdem, dass `channels.telegram.capabilities.inlineButtons` die Zieloberfläche (`dm`, `group` oder `all`) zulässt. Genehmigungs-IDs mit dem Präfix `plugin:` werden über Plugin-Genehmigungen aufgelöst; andere werden zuerst über Ausführungsgenehmigungen aufgelöst.

    Siehe [Ausführungsgenehmigungen](/de/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Steuerung von Fehlerantworten

Wenn beim Agent ein Zustellungs- oder Provider-Fehler auftritt, steuert die Fehlerrichtlinie, ob Fehlermeldungen den Telegram-Chat erreichen:

| Schlüssel                             | Werte                      | Standardwert    | Beschreibung                                                                                                                                                                                                                     |
| ------------------------------------- | -------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`       | `always`, `once`, `silent` | `always`        | `always` sendet jede Fehlermeldung an den Chat. `once` sendet jede eindeutige Fehlermeldung einmal pro Abkühlzeitfenster (wiederholte identische Fehler werden unterdrückt). `silent` sendet niemals Fehlermeldungen an den Chat. |
| `channels.telegram.errorCooldownMs`   | Zahl (ms)                  | `14400000` (4h) | Abkühlzeitfenster für die Richtlinie `once`. Nachdem ein Fehler gesendet wurde, wird dieselbe Nachricht unterdrückt, bis dieses Intervall abgelaufen ist. Verhindert eine Flut von Fehlermeldungen bei Ausfällen.                  |

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
  <Accordion title="Bot reagiert nicht auf Gruppennachrichten ohne Erwähnung">

    - Wenn `requireMention=false` gilt, muss der Telegram-Datenschutzmodus vollständige Sichtbarkeit zulassen: BotFather `/setprivacy` -> Disable; entfernen Sie den Bot anschließend aus der Gruppe und fügen Sie ihn erneut hinzu.
    - `openclaw channels status` warnt, wenn die Konfiguration Gruppennachrichten ohne Erwähnung erwartet.
    - `openclaw channels status --probe` prüft explizite numerische Gruppen-IDs; die Mitgliedschaft für den Platzhalter `"*"` kann nicht geprüft werden.
    - Schneller Sitzungstest: `/activation always`.

  </Accordion>

  <Accordion title="Bot sieht überhaupt keine Gruppennachrichten">

    - Wenn `channels.telegram.groups` vorhanden ist, muss die Gruppe aufgeführt sein (oder `"*"` enthalten sein).
    - Überprüfen Sie die Mitgliedschaft des Bots in der Gruppe.
    - Prüfen Sie `openclaw logs --follow` auf Gründe für das Überspringen.

  </Accordion>

  <Accordion title="Befehle funktionieren nur teilweise oder gar nicht">

    - Autorisieren Sie Ihre Absenderidentität (Kopplung und/oder numerisches `allowFrom`); die Befehlsautorisierung gilt auch dann, wenn die Gruppenrichtlinie `open` lautet.
    - `setMyCommands failed` mit `BOT_COMMANDS_TOO_MUCH` bedeutet, dass das native Menü zu viele Einträge enthält; reduzieren Sie Plugin-/Skill-/benutzerdefinierte Befehle oder deaktivieren Sie native Menüs.
    - Die Startaufrufe `deleteMyCommands` / `setMyCommands` und die Tippaufrufe `sendChatAction` sind zeitlich begrenzt und werden bei einer Anfragezeitüberschreitung einmal über den Telegram-Transport-Fallback wiederholt. Anhaltende Netzwerk-/Abruffehler bedeuten normalerweise, dass DNS/HTTPS zu `api.telegram.org` nicht erreichbar ist.

  </Accordion>

  <Accordion title="Beim Start wird ein nicht autorisiertes Token gemeldet">

    - `getMe returned 401` ist ein Telegram-Authentifizierungsfehler für das konfigurierte Bot-Token. Kopieren Sie das Token erneut aus BotFather oder generieren Sie es dort neu und aktualisieren Sie anschließend `channels.telegram.botToken`, `tokenFile`, `accounts.<id>.botToken` oder `TELEGRAM_BOT_TOKEN` (Standardkonto).
    - `deleteWebhook 401 Unauthorized` während des Starts ist ebenfalls ein Authentifizierungsfehler; ihn als „kein Webhook vorhanden“ zu behandeln, würde denselben Fehler durch ein ungültiges Token lediglich bis zu einem späteren API-Aufruf verzögern.

  </Accordion>

  <Accordion title="Polling- oder Netzwerkinstabilität">

    - Node 22+ mit einer benutzerdefinierten Fetch-/Proxy-Konfiguration kann sofortiges Abbruchverhalten auslösen, wenn die `AbortSignal`-Typen nicht übereinstimmen.
    - Einige Hosts lösen `api.telegram.org` zuerst zu IPv6 auf; ein fehlerhafter IPv6-Ausgang verursacht sporadische API-Fehler.
    - Protokolleinträge mit `TypeError: fetch failed` oder `Network request for 'getUpdates' failed!` werden als behebbare Netzwerkfehler erneut versucht.
    - Beim Polling-Start verwendet OpenClaw die erfolgreiche anfängliche `getMe`-Prüfung für grammY erneut, sodass der Runner vor dem ersten `getUpdates` kein zweites `getMe` benötigt.
    - Wenn `deleteWebhook` während des Polling-Starts aufgrund eines vorübergehenden Netzwerkfehlers fehlschlägt, fährt OpenClaw mit Long Polling fort, statt einen weiteren Steuerungsebenenaufruf vor dem Polling auszuführen. Ein weiterhin aktiver Webhook zeigt sich dann als `getUpdates`-Konflikt; OpenClaw baut den Transport neu auf und versucht die Webhook-Bereinigung erneut.
    - Wenn Telegram-Sockets in einem kurzen festen Rhythmus erneuert werden, prüfen Sie, ob `channels.telegram.timeoutSeconds` zu niedrig ist — Bot-Clients begrenzen konfigurierte Werte unterhalb der Schutzfristen für ausgehende Anfragen und `getUpdates`; ältere Versionen konnten jedoch jede Abfrage oder Antwort abbrechen, wenn der Wert unterhalb dieser Schutzfristen lag.
    - `Polling stall detected` in den Protokollen bedeutet, dass OpenClaw das Polling neu startet und den Transport neu aufbaut, nachdem standardmäßig 120 Sekunden lang keine abgeschlossene Long-Poll-Aktivität festgestellt wurde.
    - `openclaw channels status --probe` und `openclaw doctor` warnen, wenn ein laufendes Polling-Konto nach der Starttoleranzphase `getUpdates` nicht abgeschlossen hat, ein laufendes Webhook-Konto nach der Starttoleranzphase `setWebhook` nicht abgeschlossen hat oder die letzte erfolgreiche Aktivität des Polling-Transports veraltet ist.
    - Erhöhen Sie `channels.telegram.pollingStallThresholdMs` nur, wenn lang laufende `getUpdates`-Aufrufe ordnungsgemäß funktionieren, Ihr Host aber weiterhin falsch-positive Neustarts aufgrund eines Polling-Stillstands meldet. Anhaltende Stillstände weisen üblicherweise auf Probleme mit Proxy, DNS, IPv6 oder dem TLS-Ausgang zu `api.telegram.org` hin.
    - Telegram berücksichtigt die Proxy-Umgebungsvariablen des Prozesses für den Bot-API-Transport: `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` sowie Varianten in Kleinbuchstaben. `NO_PROXY` / `no_proxy` können `api.telegram.org` weiterhin umgehen.
    - Wenn `OPENCLAW_PROXY_URL` für eine Dienstumgebung festgelegt ist und keine standardmäßige Proxy-Umgebungsvariable vorhanden ist, verwendet Telegram diese URL ebenfalls für den Bot-API-Transport.
    - Leiten Sie Telegram-API-Aufrufe auf VPS-Hosts mit instabilem direktem Ausgang/TLS durch einen Proxy:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ verwendet standardmäßig `autoSelectFamily=true` (außer unter WSL2). Die Reihenfolge der Telegram-DNS-Ergebnisse berücksichtigt zuerst `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, dann `channels.telegram.network.dnsResultOrder` und anschließend den Prozessstandard (beispielsweise `NODE_OPTIONS=--dns-result-order=ipv4first`). Wenn nichts davon gilt, wird unter Node 22+ auf `ipv4first` zurückgegriffen.
    - Erzwingen Sie unter WSL2 oder wenn ausschließliches IPv4-Verhalten besser funktioniert die Auswahl der Adressfamilie:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Antworten aus dem RFC-2544-Benchmarkbereich (`198.18.0.0/15`) sind für Telegram-Mediendownloads bereits standardmäßig zulässig. Wenn ein vertrauenswürdiger Fake-IP- oder transparenter Proxy `api.telegram.org` während Mediendownloads auf eine andere private, interne oder für besondere Zwecke reservierte Adresse umschreibt, aktivieren Sie die ausschließlich für Telegram geltende Umgehung:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Dieselbe Aktivierung ist pro Konto unter `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork` verfügbar.
    - Wenn Ihr Proxy Telegram-Medienhosts in `198.18.x.x` auflöst, lassen Sie das gefährliche Flag zunächst deaktiviert – dieser Bereich ist bereits standardmäßig zulässig.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` schwächt den SSRF-Schutz für Telegram-Medien. Verwenden Sie diese Option nur für vertrauenswürdige, vom Betreiber kontrollierte Proxy-Umgebungen (Clash-, Mihomo- oder Surge-Fake-IP-Routing), die private oder für besondere Zwecke reservierte Antworten außerhalb des RFC-2544-Benchmarkbereichs erzeugen. Lassen Sie sie für den normalen Telegram-Zugriff über das öffentliche Internet deaktiviert.
    </Warning>

    - Temporäre Umgebungsüberschreibungen: `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`, `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`, `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`.
    - DNS-Antworten überprüfen:

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
- Zugriffssteuerung: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` auf oberster Ebene (`type: "acp"`)
- Themenvorgaben: `groups.<chatId>.topics."*"` gilt für nicht zugeordnete Forenthemen; exakte Themen-IDs überschreiben diese Vorgabe
- Ausführungsgenehmigungen: `execApprovals`, `accounts.*.execApprovals`
- Befehle/Menü: `commands.native`, `commands.nativeSkills`, `customCommands`
- Threads/Antworten: `replyToMode`, `threadBindings`
- Streaming: `streaming` (Modi `off | partial | block | progress`), `streaming.preview.toolProgress`
- Formatierung/Zustellung: `textChunkLimit`, `streaming.chunkMode`, `richMessages`, `markdown.tables` (`off | bullets | code | block`), `linkPreview`, `responsePrefix`
- Medien/Netzwerk: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- Benutzerdefinierter API-Stammpfad: `apiRoot` (nur der Bot-API-Stammpfad; `/bot<TOKEN>` nicht einschließen), `trustedLocalFileRoots` (absolute `file_path`-Stammpfade der selbst gehosteten Bot API)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`, `webhookPort`, `webhookCertPath`
- Aktionen/Funktionen: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker|createForumTopic|editForumTopic`
- Reaktionen: `reactionNotifications`, `reactionLevel`
- Fehler: `errorPolicy`, `errorCooldownMs`, `silentErrorReplies`
- Schreibvorgänge/Verlauf: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Priorität bei mehreren Konten: Wenn zwei oder mehr Konto-IDs konfiguriert sind, legen Sie `channels.telegram.defaultAccount` fest (oder schließen Sie `channels.telegram.accounts.default` ein), um das Standard-Routing explizit zu machen. Andernfalls greift OpenClaw auf die erste normalisierte Konto-ID zurück und `openclaw doctor` gibt eine Warnung aus. Benannte Konten übernehmen `channels.telegram.allowFrom` / `groupAllowFrom`, jedoch keine Werte aus `accounts.default.*`.
</Note>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Kopplung" icon="link" href="/de/channels/pairing">
    Koppeln Sie einen Telegram-Benutzer mit dem Gateway.
  </Card>
  <Card title="Gruppen" icon="users" href="/de/channels/groups">
    Verhalten der Zulassungslisten für Gruppen und Themen.
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
