---
read_when:
    - Arbeiten an Telegram-Funktionen oder Webhooks
summary: Status, Funktionen und Konfiguration der Telegram-Bot-Unterstützung
title: Telegram
x-i18n:
    generated_at: "2026-05-05T06:16:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 03c75169335378482b80f1ceb669cefaa034ad3e589cf5f1d14c8252608ee46a
    source_path: channels/telegram.md
    workflow: 16
---

Für Produktionsumgebungen geeignet für Bot-DMs und Gruppen über grammY. Long Polling ist der Standardmodus; Webhook-Modus ist optional.

<CardGroup cols={3}>
  <Card title="Kopplung" icon="link" href="/de/channels/pairing">
    Die standardmäßige DM-Richtlinie für Telegram ist Kopplung.
  </Card>
  <Card title="Channel-Fehlerbehebung" icon="wrench" href="/de/channels/troubleshooting">
    Channel-übergreifende Diagnosen und Reparatur-Playbooks.
  </Card>
  <Card title="Gateway-Konfiguration" icon="settings" href="/de/gateway/configuration">
    Vollständige Channel-Konfigurationsmuster und Beispiele.
  </Card>
</CardGroup>

## Schnelle Einrichtung

<Steps>
  <Step title="Bot-Token in BotFather erstellen">
    Öffnen Sie Telegram und chatten Sie mit **@BotFather** (stellen Sie sicher, dass der Handle exakt `@BotFather` lautet).

    Führen Sie `/newbot` aus, folgen Sie den Aufforderungen und speichern Sie das Token.

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

    Env-Fallback: `TELEGRAM_BOT_TOKEN=...` (nur Standardkonto).
    Telegram verwendet **nicht** `openclaw channels login telegram`; konfigurieren Sie das Token in Konfiguration/Env und starten Sie dann das Gateway.

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
    Fügen Sie den Bot Ihrer Gruppe hinzu und legen Sie dann `channels.telegram.groups` und `groupPolicy` passend zu Ihrem Zugriffsmodell fest.
  </Step>
</Steps>

<Note>
Die Token-Auflösungsreihenfolge ist kontobewusst. In der Praxis haben Konfigurationswerte Vorrang vor dem Env-Fallback, und `TELEGRAM_BOT_TOKEN` gilt nur für das Standardkonto.
</Note>

## Telegram-seitige Einstellungen

<AccordionGroup>
  <Accordion title="Privatsphäre-Modus und Gruppensichtbarkeit">
    Telegram-Bots verwenden standardmäßig den **Privatsphäre-Modus**, der einschränkt, welche Gruppennachrichten sie empfangen.

    Wenn der Bot alle Gruppennachrichten sehen muss, tun Sie entweder Folgendes:

    - Deaktivieren Sie den Privatsphäre-Modus über `/setprivacy`, oder
    - machen Sie den Bot zum Gruppenadministrator.

    Wenn Sie den Privatsphäre-Modus umschalten, entfernen Sie den Bot aus jeder Gruppe und fügen Sie ihn erneut hinzu, damit Telegram die Änderung anwendet.

  </Accordion>

  <Accordion title="Gruppenberechtigungen">
    Der Administratorstatus wird in den Telegram-Gruppeneinstellungen gesteuert.

    Admin-Bots empfangen alle Gruppennachrichten, was für ständig aktives Gruppenverhalten nützlich ist.

  </Accordion>

  <Accordion title="Hilfreiche BotFather-Schalter">

    - `/setjoingroups`, um das Hinzufügen zu Gruppen zu erlauben/zu verweigern
    - `/setprivacy` für das Verhalten der Gruppensichtbarkeit

  </Accordion>
</AccordionGroup>

## Zugriffskontrolle und Aktivierung

<Tabs>
  <Tab title="DM-Richtlinie">
    `channels.telegram.dmPolicy` steuert den Direktnachrichtenzugriff:

    - `pairing` (Standard)
    - `allowlist` (erfordert mindestens eine Absender-ID in `allowFrom`)
    - `open` (erfordert, dass `allowFrom` `"*"` enthält)
    - `disabled`

    `dmPolicy: "open"` mit `allowFrom: ["*"]` erlaubt jedem Telegram-Konto, das den Bot-Benutzernamen findet oder errät, den Bot zu steuern. Verwenden Sie dies nur für bewusst öffentliche Bots mit streng eingeschränkten Tools; Bots mit einem einzelnen Eigentümer sollten `allowlist` mit numerischen Benutzer-IDs verwenden.

    `channels.telegram.allowFrom` akzeptiert numerische Telegram-Benutzer-IDs. `telegram:`- / `tg:`-Präfixe werden akzeptiert und normalisiert.
    In Mehrkontokonfigurationen wird ein restriktives `channels.telegram.allowFrom` auf oberster Ebene als Sicherheitsgrenze behandelt: `allowFrom: ["*"]`-Einträge auf Kontoebene machen dieses Konto nicht öffentlich, sofern die effektive Konto-Allowlist nach dem Zusammenführen nicht weiterhin einen expliziten Platzhalter enthält.
    `dmPolicy: "allowlist"` mit leerem `allowFrom` blockiert alle DMs und wird von der Konfigurationsvalidierung abgelehnt.
    Die Einrichtung fragt nur nach numerischen Benutzer-IDs.
    Wenn Sie ein Upgrade durchgeführt haben und Ihre Konfiguration `@username`-Allowlist-Einträge enthält, führen Sie `openclaw doctor --fix` aus, um sie aufzulösen (Best-Effort; erfordert ein Telegram-Bot-Token).
    Wenn Sie sich zuvor auf Allowlist-Dateien im Kopplungsspeicher verlassen haben, kann `openclaw doctor --fix` Einträge in Allowlist-Abläufen in `channels.telegram.allowFrom` wiederherstellen (zum Beispiel wenn `dmPolicy: "allowlist"` noch keine expliziten IDs hat).

    Für Bots mit einem einzelnen Eigentümer bevorzugen Sie `dmPolicy: "allowlist"` mit expliziten numerischen `allowFrom`-IDs, damit die Zugriffsrichtlinie dauerhaft in der Konfiguration liegt (statt von früheren Kopplungsgenehmigungen abhängig zu sein).

    Häufige Verwirrung: Die DM-Kopplungsgenehmigung bedeutet nicht „dieser Absender ist überall autorisiert“.
    Kopplung gewährt DM-Zugriff. Wenn noch kein Befehlseigentümer existiert, setzt die erste genehmigte Kopplung außerdem `commands.ownerAllowFrom`, damit eigentümerexklusive Befehle und Exec-Genehmigungen ein explizites Operatorkonto haben.
    Die Absenderautorisierung in Gruppen stammt weiterhin aus expliziten Konfigurations-Allowlists.
    Wenn Sie möchten, dass „ich einmal autorisiert bin und sowohl DMs als auch Gruppenbefehle funktionieren“, tragen Sie Ihre numerische Telegram-Benutzer-ID in `channels.telegram.allowFrom` ein; stellen Sie für eigentümerexklusive Befehle sicher, dass `commands.ownerAllowFrom` `telegram:<your user id>` enthält.

    ### Ihre Telegram-Benutzer-ID finden

    Sicherer (kein Drittanbieter-Bot):

    1. Senden Sie Ihrem Bot eine DM.
    2. Führen Sie `openclaw logs --follow` aus.
    3. Lesen Sie `from.id`.

    Offizielle Bot-API-Methode:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Drittanbieter-Methode (weniger privat): `@userinfobot` oder `@getidsbot`.

  </Tab>

  <Tab title="Gruppenrichtlinie und Allowlists">
    Zwei Steuerungen gelten gemeinsam:

    1. **Welche Gruppen erlaubt sind** (`channels.telegram.groups`)
       - keine `groups`-Konfiguration:
         - mit `groupPolicy: "open"`: Jede Gruppe kann Gruppen-ID-Prüfungen passieren
         - mit `groupPolicy: "allowlist"` (Standard): Gruppen werden blockiert, bis Sie `groups`-Einträge (oder `"*"`) hinzufügen
       - `groups` konfiguriert: wirkt als Allowlist (explizite IDs oder `"*"`)

    2. **Welche Absender in Gruppen erlaubt sind** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (Standard)
       - `disabled`

    `groupAllowFrom` wird für die Filterung von Gruppenabsendern verwendet. Falls nicht gesetzt, fällt Telegram auf `allowFrom` zurück.
    `groupAllowFrom`-Einträge sollten numerische Telegram-Benutzer-IDs sein (`telegram:`- / `tg:`-Präfixe werden normalisiert).
    Tragen Sie keine Telegram-Gruppen- oder Supergruppen-Chat-IDs in `groupAllowFrom` ein. Negative Chat-IDs gehören unter `channels.telegram.groups`.
    Nicht numerische Einträge werden für die Absenderautorisierung ignoriert.
    Sicherheitsgrenze (`2026.2.25+`): Die Gruppenabsenderauthentifizierung erbt **keine** DM-Genehmigungen aus dem Kopplungsspeicher.
    Kopplung bleibt nur für DMs. Legen Sie für Gruppen `groupAllowFrom` oder `allowFrom` pro Gruppe/pro Thema fest.
    Wenn `groupAllowFrom` nicht gesetzt ist, fällt Telegram auf die Konfiguration `allowFrom` zurück, nicht auf den Kopplungsspeicher.
    Praktisches Muster für Bots mit einem einzelnen Eigentümer: Legen Sie Ihre Benutzer-ID in `channels.telegram.allowFrom` fest, lassen Sie `groupAllowFrom` unset und erlauben Sie die Zielgruppen unter `channels.telegram.groups`.
    Laufzeithinweis: Wenn `channels.telegram` vollständig fehlt, verwendet die Laufzeit standardmäßig fail-closed `groupPolicy="allowlist"`, sofern `channels.defaults.groupPolicy` nicht explizit gesetzt ist.

    Beispiel: Beliebiges Mitglied in einer bestimmten Gruppe erlauben:

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

    Beispiel: Nur bestimmte Benutzer innerhalb einer bestimmten Gruppe erlauben:

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
      Häufiger Fehler: `groupAllowFrom` ist keine Telegram-Gruppen-Allowlist.

      - Tragen Sie negative Telegram-Gruppen- oder Supergruppen-Chat-IDs wie `-1001234567890` unter `channels.telegram.groups` ein.
      - Tragen Sie Telegram-Benutzer-IDs wie `8734062810` unter `groupAllowFrom` ein, wenn Sie begrenzen möchten, welche Personen innerhalb einer erlaubten Gruppe den Bot auslösen können.
      - Verwenden Sie `groupAllowFrom: ["*"]` nur, wenn jedes Mitglied einer erlaubten Gruppe mit dem Bot sprechen können soll.

    </Warning>

  </Tab>

  <Tab title="Erwähnungsverhalten">
    Gruppenantworten erfordern standardmäßig eine Erwähnung.

    Erwähnung kann aus Folgendem stammen:

    - native `@botusername`-Erwähnung, oder
    - Erwähnungsmuster in:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Befehlsumschaltungen auf Sitzungsebene:

    - `/activation always`
    - `/activation mention`

    Diese aktualisieren nur den Sitzungsstatus. Verwenden Sie die Konfiguration für Persistenz.

    Beispiel für persistente Konfiguration:

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

    Gruppen-Chat-ID abrufen:

    - Leiten Sie eine Gruppennachricht an `@userinfobot` / `@getidsbot` weiter
    - oder lesen Sie `chat.id` aus `openclaw logs --follow`
    - oder prüfen Sie Bot-API `getUpdates`

  </Tab>
</Tabs>

## Laufzeitverhalten

- Telegram gehört zum Gateway-Prozess.
- Das Routing ist deterministisch: Telegram-Eingänge antworten zurück an Telegram (das Modell wählt keine Channels aus).
- Eingehende Nachrichten werden in den gemeinsamen Channel-Umschlag mit Antwortmetadaten und Medienplatzhaltern normalisiert.
- Gruppensitzungen werden nach Gruppen-ID isoliert. Forumsthemen hängen `:topic:<threadId>` an, um Themen isoliert zu halten.
- DM-Nachrichten können `message_thread_id` enthalten; OpenClaw bewahrt die Thread-ID für Antworten auf, hält DMs aber standardmäßig in der flachen Sitzung. Konfigurieren Sie `channels.telegram.dm.threadReplies: "inbound"`, `channels.telegram.direct.<chatId>.threadReplies: "inbound"`, `requireTopic: true` oder eine passende Themenkonfiguration, wenn Sie bewusst DM-Themensitzungsisolierung wünschen.
- Long Polling verwendet grammY runner mit Sequenzierung pro Chat/pro Thread. Die gesamte Runner-Sink-Parallelität verwendet `agents.defaults.maxConcurrent`.
- Long Polling wird innerhalb jedes Gateway-Prozesses geschützt, sodass nur ein aktiver Poller gleichzeitig ein Bot-Token verwenden kann. Wenn Sie weiterhin `getUpdates`-409-Konflikte sehen, verwendet wahrscheinlich ein anderes OpenClaw-Gateway, Skript oder externer Poller dasselbe Token.
- Neustarts durch den Long-Polling-Watchdog werden standardmäßig nach 120 Sekunden ohne abgeschlossene `getUpdates`-Liveness ausgelöst. Erhöhen Sie `channels.telegram.pollingStallThresholdMs` nur, wenn Ihre Bereitstellung bei lang laufender Arbeit weiterhin falsche Polling-Stall-Neustarts sieht. Der Wert ist in Millisekunden angegeben und von `30000` bis `600000` erlaubt; Überschreibungen pro Konto werden unterstützt.
- Die Telegram Bot API unterstützt keine Lesebestätigungen (`sendReadReceipts` gilt nicht).

## Funktionsreferenz

<AccordionGroup>
  <Accordion title="Live-Stream-Vorschau (Nachrichtenbearbeitungen)">
    OpenClaw kann Teilantworten in Echtzeit streamen:

    - direkte Chats: Vorschaunachricht + `editMessageText`
    - Gruppen/Themen: Vorschaunachricht + `editMessageText`

    Anforderung:

    - `channels.telegram.streaming` ist `off | partial | block | progress` (Standard: `partial`)
    - `progress` hält einen bearbeitbaren Statusentwurf vor und aktualisiert ihn mit Tool-Fortschritt bis zur endgültigen Zustellung
    - `streaming.preview.toolProgress` steuert, ob Tool-/Fortschrittsaktualisierungen dieselbe bearbeitete Vorschaunachricht wiederverwenden (Standard: `true`, wenn Vorschau-Streaming aktiv ist)
    - `streaming.preview.commandText` steuert Befehls-/Exec-Details innerhalb dieser Tool-Fortschrittszeilen: `raw` (Standard, bewahrt veröffentlichtes Verhalten) oder `status` (nur Tool-Label)
    - Legacy-`channels.telegram.streamMode` und boolesche `streaming`-Werte werden erkannt; führen Sie `openclaw doctor --fix` aus, um sie zu `channels.telegram.streaming.mode` zu migrieren

    Tool-Fortschrittsvorschau-Aktualisierungen sind die kurzen Statuszeilen, die angezeigt werden, während Tools ausgeführt werden, zum Beispiel Befehlsausführung, Dateilesevorgänge, Planungsaktualisierungen oder Patch-Zusammenfassungen. Telegram hält diese standardmäßig aktiviert, um dem veröffentlichten OpenClaw-Verhalten ab `v2026.4.22` und später zu entsprechen. Um die bearbeitete Vorschau für Antworttext beizubehalten, aber Tool-Fortschrittszeilen auszublenden, legen Sie fest:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": {
              "toolProgress": false
            }
          }
        }
      }
    }
    ```

    Um Tool-Fortschritt sichtbar zu halten, aber Befehls-/Exec-Text auszublenden, legen Sie fest:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": {
              "commandText": "status"
            }
          }
        }
      }
    }
    ```

    Für den Fortschrittsentwurfsmodus legen Sie dieselbe Befehls-Text-Richtlinie unter `streaming.progress` ab:

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

    Verwenden Sie `streaming.mode: "off"` nur, wenn Sie ausschließlich die endgültige Zustellung wünschen: Telegram-Vorschau-Bearbeitungen sind deaktiviert und allgemeines Tool-/Fortschrittsrauschen wird unterdrückt, statt als eigenständige Statusmeldungen gesendet zu werden. Genehmigungsabfragen, Medien-Payloads und Fehler werden weiterhin über die normale endgültige Zustellung geleitet. Verwenden Sie `streaming.preview.toolProgress: false`, wenn Sie nur Antwortvorschau-Bearbeitungen beibehalten möchten, während die Tool-Fortschrittsstatuszeilen ausgeblendet werden.

    <Note>
      Telegram-Antworten mit ausgewählten Zitaten sind die Ausnahme. Wenn `replyToMode` `"first"`, `"all"` oder `"batched"` ist und die eingehende Nachricht ausgewählten Zitattext enthält, sendet OpenClaw die endgültige Antwort über Telegrams nativen Zitat-Antwortpfad, statt die Antwortvorschau zu bearbeiten, sodass `streaming.preview.toolProgress` die kurzen Statuszeilen für diesen Durchlauf nicht anzeigen kann. Antworten auf aktuelle Nachrichten ohne ausgewählten Zitattext behalten weiterhin Vorschau-Streaming. Setzen Sie `replyToMode: "off"`, wenn die Sichtbarkeit des Tool-Fortschritts wichtiger ist als native Zitatantworten, oder setzen Sie `streaming.preview.toolProgress: false`, um den Kompromiss anzuerkennen.
    </Note>

    Für reine Textantworten:

    - kurze Vorschauen in Direktnachrichten/Gruppen/Themen: OpenClaw behält dieselbe Vorschaunachricht bei und führt eine abschließende Bearbeitung an Ort und Stelle aus, sofern nach Erscheinen der Vorschau keine sichtbare Nicht-Vorschau-Nachricht gesendet wurde
    - lange endgültige Textantworten, die in mehrere Telegram-Nachrichten aufgeteilt werden, verwenden die vorhandene Vorschau nach Möglichkeit als ersten endgültigen Abschnitt wieder und senden danach nur die verbleibenden Abschnitte
    - Vorschauen, auf die sichtbare Nicht-Vorschau-Ausgabe folgt: OpenClaw sendet die fertige Antwort als neue endgültige Nachricht und bereinigt die ältere Vorschau, sodass die endgültige Antwort nach der Zwischenausgabe erscheint
    - Vorschauen, die älter als ungefähr eine Minute sind: OpenClaw sendet die fertige Antwort als neue endgültige Nachricht und bereinigt anschließend die Vorschau, sodass Telegrams sichtbarer Zeitstempel die Abschlusszeit statt der Erstellungszeit der Vorschau widerspiegelt

    Für komplexe Antworten (zum Beispiel Medien-Payloads) fällt OpenClaw auf die normale endgültige Zustellung zurück und bereinigt anschließend die Vorschaunachricht.

    Vorschau-Streaming ist von Block-Streaming getrennt. Wenn Block-Streaming für Telegram explizit aktiviert ist, überspringt OpenClaw den Vorschaustream, um doppeltes Streaming zu vermeiden.

    Reiner Telegram-Reasoning-Stream:

    - `/reasoning stream` sendet Reasoning während der Generierung an die Live-Vorschau
    - die Reasoning-Vorschau wird nach der endgültigen Zustellung gelöscht; verwenden Sie `/reasoning on`, wenn Reasoning sichtbar bleiben soll
    - die endgültige Antwort wird ohne Reasoning-Text gesendet

  </Accordion>

  <Accordion title="Formatierung und HTML-Fallback">
    Ausgehender Text verwendet Telegram `parse_mode: "HTML"`.

    - Markdown-ähnlicher Text wird in Telegram-sicheres HTML gerendert.
    - Rohes Modell-HTML wird escaped, um Telegram-Parsingfehler zu reduzieren.
    - Wenn Telegram geparstes HTML ablehnt, versucht OpenClaw es erneut als Klartext.

    Linkvorschauen sind standardmäßig aktiviert und können mit `channels.telegram.linkPreview: false` deaktiviert werden.

  </Accordion>

  <Accordion title="Native Befehle und benutzerdefinierte Befehle">
    Die Registrierung des Telegram-Befehlsmenüs wird beim Start mit `setMyCommands` durchgeführt.

    Standardwerte für native Befehle:

    - `commands.native: "auto"` aktiviert native Befehle für Telegram

    Fügen Sie benutzerdefinierte Befehlsmenüeinträge hinzu:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Git backup" },
        { command: "generate", description: "Create an image" },
      ],
    },
  },
}
```

    Regeln:

    - Namen werden normalisiert (führendes `/` entfernen, Kleinschreibung)
    - gültiges Muster: `a-z`, `0-9`, `_`, Länge `1..32`
    - benutzerdefinierte Befehle können native Befehle nicht überschreiben
    - Konflikte/Duplikate werden übersprungen und protokolliert

    Hinweise:

    - benutzerdefinierte Befehle sind nur Menüeinträge; sie implementieren kein Verhalten automatisch
    - Plugin-/Skill-Befehle können weiterhin funktionieren, wenn sie eingegeben werden, auch wenn sie nicht im Telegram-Menü angezeigt werden

    Wenn native Befehle deaktiviert sind, werden integrierte Befehle entfernt. Benutzerdefinierte/Plugin-Befehle können bei entsprechender Konfiguration weiterhin registriert werden.

    Häufige Einrichtungsfehler:

    - `setMyCommands failed` mit `BOT_COMMANDS_TOO_MUCH` bedeutet, dass das Telegram-Menü nach dem Kürzen immer noch überläuft; reduzieren Sie Plugin-/Skill-/benutzerdefinierte Befehle oder deaktivieren Sie `channels.telegram.commands.native`.
    - Wenn `deleteWebhook`, `deleteMyCommands` oder `setMyCommands` mit `404: Not Found` fehlschlägt, während direkte Bot-API-curl-Befehle funktionieren, kann das bedeuten, dass `channels.telegram.apiRoot` auf den vollständigen `/bot<TOKEN>`-Endpoint gesetzt wurde. `apiRoot` darf nur der Bot-API-Root sein, und `openclaw doctor --fix` entfernt ein versehentlich angehängtes `/bot<TOKEN>`.
    - `getMe returned 401` bedeutet, dass Telegram das konfigurierte Bot-Token abgelehnt hat. Aktualisieren Sie `botToken`, `tokenFile` oder `TELEGRAM_BOT_TOKEN` mit dem aktuellen BotFather-Token; OpenClaw stoppt vor dem Polling, sodass dies nicht als Webhook-Bereinigungsfehler gemeldet wird.
    - `setMyCommands failed` mit Netzwerk-/Fetch-Fehlern bedeutet in der Regel, dass ausgehendes DNS/HTTPS zu `api.telegram.org` blockiert ist.

    ### Geräte-Kopplungsbefehle (`device-pair`-Plugin)

    Wenn das `device-pair`-Plugin installiert ist:

    1. `/pair` generiert Einrichtungscode
    2. Code in der iOS-App einfügen
    3. `/pair pending` listet ausstehende Anfragen auf (einschließlich Rolle/Scopes)
    4. genehmigen Sie die Anfrage:
       - `/pair approve <requestId>` für explizite Genehmigung
       - `/pair approve`, wenn es nur eine ausstehende Anfrage gibt
       - `/pair approve latest` für die neueste

    Der Einrichtungscode enthält ein kurzlebiges Bootstrap-Token. Die integrierte Bootstrap-Übergabe hält das primäre Node-Token bei `scopes: []`; jedes übergebene Operator-Token bleibt auf `operator.approvals`, `operator.read`, `operator.talk.secrets` und `operator.write` begrenzt. Bootstrap-Scope-Prüfungen sind rollenpräfixiert, sodass diese Operator-Allowlist nur Operator-Anfragen erfüllt; Nicht-Operator-Rollen benötigen weiterhin Scopes unter ihrem eigenen Rollenpräfix.

    Wenn ein Gerät es mit geänderten Authentifizierungsdetails erneut versucht (zum Beispiel Rolle/Scopes/öffentlicher Schlüssel), wird die vorherige ausstehende Anfrage ersetzt und die neue Anfrage verwendet eine andere `requestId`. Führen Sie `/pair pending` vor der Genehmigung erneut aus.

    Weitere Details: [Kopplung](/de/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="Inline-Schaltflächen">
    Konfigurieren Sie den Inline-Tastatur-Scope:

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

    Scopes:

    - `off`
    - `dm`
    - `group`
    - `all`
    - `allowlist` (Standard)

    Legacy-`capabilities: ["inlineButtons"]` wird auf `inlineButtons: "all"` abgebildet.

    Beispiel für eine Nachrichtenaktion:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Choose an option:",
  buttons: [
    [
      { text: "Yes", callback_data: "yes" },
      { text: "No", callback_data: "no" },
    ],
    [{ text: "Cancel", callback_data: "cancel" }],
  ],
}
```

    Callback-Klicks werden als Text an den Agent übergeben:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Telegram-Nachrichtenaktionen für Agents und Automatisierung">
    Telegram-Tool-Aktionen umfassen:

    - `sendMessage` (`to`, `content`, optional `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, optional `iconColor`, `iconCustomEmojiId`)

    Kanal-Nachrichtenaktionen stellen ergonomische Aliasse bereit (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Steuerungskontrollen:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (Standard: deaktiviert)

    Hinweis: `edit` und `topic-create` sind derzeit standardmäßig aktiviert und haben keine separaten `channels.telegram.actions.*`-Schalter.
    Laufzeit-Sends verwenden den aktiven Konfigurations-/Secrets-Snapshot (Start/Reload), daher führen Aktionspfade keine Ad-hoc-Neuauflösung von SecretRef pro Send aus.

    Semantik zum Entfernen von Reactions: [/tools/reactions](/de/tools/reactions)

  </Accordion>

  <Accordion title="Antwort-Threading-Tags">
    Telegram unterstützt explizite Antwort-Threading-Tags in generierter Ausgabe:

    - `[[reply_to_current]]` antwortet auf die auslösende Nachricht
    - `[[reply_to:<id>]]` antwortet auf eine bestimmte Telegram-Nachrichten-ID

    `channels.telegram.replyToMode` steuert die Verarbeitung:

    - `off` (Standard)
    - `first`
    - `all`

    Wenn Antwort-Threading aktiviert ist und der ursprüngliche Telegram-Text oder die Beschriftung verfügbar ist, fügt OpenClaw automatisch einen nativen Telegram-Zitatauszug ein. Telegram begrenzt nativen Zitattext auf 1024 UTF-16-Codeeinheiten, sodass längere Nachrichten vom Anfang an zitiert werden und auf eine einfache Antwort zurückfallen, wenn Telegram das Zitat ablehnt.

    Hinweis: `off` deaktiviert implizites Antwort-Threading. Explizite `[[reply_to_*]]`-Tags werden weiterhin beachtet.

  </Accordion>

  <Accordion title="Forumthemen und Thread-Verhalten">
    Forum-Supergroups:

    - Themen-Sitzungsschlüssel hängen `:topic:<threadId>` an
    - Antworten und Tippen zielen auf den Themen-Thread
    - Themen-Konfigurationspfad:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Sonderfall allgemeines Thema (`threadId=1`):

    - Nachrichtensendungen lassen `message_thread_id` aus (Telegram lehnt `sendMessage(...thread_id=1)` ab)
    - Tippaktionen enthalten weiterhin `message_thread_id`

    Themenvererbung: Themeneinträge erben Gruppeneinstellungen, sofern sie nicht überschrieben werden (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` ist nur themenspezifisch und erbt nicht aus Gruppenvorgaben.

    **Agent-Routing pro Thema**: Jedes Thema kann zu einem anderen Agent geleitet werden, indem `agentId` in der Themenkonfiguration gesetzt wird. Dadurch erhält jedes Thema seinen eigenen isolierten Workspace, Speicher und seine eigene Sitzung. Beispiel:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // General topic → main agent
                "3": { agentId: "zu" },        // Dev topic → zu agent
                "5": { agentId: "coder" }      // Code review → coder agent
              }
            }
          }
        }
      }
    }
    ```

    Jedes Thema hat dann seinen eigenen Sitzungsschlüssel: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Persistente ACP-Themenbindung**: Forumthemen können ACP-Harness-Sitzungen über typisierte ACP-Bindings auf oberster Ebene anheften (`bindings[]` mit `type: "acp"` und `match.channel: "telegram"`, `peer.kind: "group"` sowie einer themenqualifizierten ID wie `-1001234567890:topic:42`). Derzeit auf Forumthemen in Gruppen/Supergroups beschränkt. Siehe [ACP Agents](/de/tools/acp-agents).

    **Thread-gebundener ACP-Spawn aus dem Chat**: `/acp spawn <agent> --thread here|auto` bindet das aktuelle Thema an eine neue ACP-Sitzung; Folgebeiträge werden direkt dorthin geleitet. OpenClaw heftet die Spawn-Bestätigung im Thema an. Erfordert, dass `channels.telegram.threadBindings.spawnSessions` aktiviert bleibt (Standard: `true`).

    Vorlagenkontext stellt `MessageThreadId` und `IsForum` bereit. DM-Chats mit `message_thread_id` behalten DM-Routing und Antwortmetadaten standardmäßig in flachen Sitzungen; sie verwenden thread-bewusste Sitzungsschlüssel nur, wenn sie mit `threadReplies: "inbound"`, `threadReplies: "always"`, `requireTopic: true` oder einer passenden Themenkonfiguration konfiguriert sind. Verwenden Sie `channels.telegram.dm.threadReplies` auf oberster Ebene für die Konto-Voreinstellung oder `direct.<chatId>.threadReplies` für eine einzelne DM.

  </Accordion>

  <Accordion title="Audio, Video und Sticker">
    ### Audionachrichten

    Telegram unterscheidet Sprachnotizen von Audiodateien.

    - Standard: Verhalten wie bei Audiodateien
    - Tag `[[audio_as_voice]]` in der Agent-Antwort, um das Senden als Sprachnotiz zu erzwingen
    - Eingehende Sprachnotiz-Transkripte werden im Agent-Kontext als maschinell erzeugter,
      nicht vertrauenswürdiger Text eingerahmt; die Erwähnungserkennung verwendet weiterhin das Roh-
      Transkript, sodass erwähnungsgebundene Sprachnachrichten weiterhin funktionieren.

    Beispiel für eine Nachrichtenaktion:

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

    Telegram unterscheidet Videodateien von Videonotizen.

    Beispiel für eine Nachrichtenaktion:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    Videonotizen unterstützen keine Beschriftungen; bereitgestellter Nachrichtentext wird separat gesendet.

    ### Sticker

    Verarbeitung eingehender Sticker:

    - statisches WEBP: heruntergeladen und verarbeitet (Platzhalter `<media:sticker>`)
    - animiertes TGS: übersprungen
    - Video-WEBM: übersprungen

    Sticker-Kontextfelder:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    Sticker-Cache-Datei:

    - `~/.openclaw/telegram/sticker-cache.json`

    Sticker werden einmal beschrieben (wenn möglich) und zwischengespeichert, um wiederholte Vision-Aufrufe zu reduzieren.

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

    Sticker-Aktion senden:

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    Zwischengespeicherte Sticker suchen:

```json5
{
  action: "sticker-search",
  channel: "telegram",
  query: "cat waving",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="Reaktionsbenachrichtigungen">
    Telegram-Reaktionen treffen als `message_reaction`-Updates ein (getrennt von Nachrichten-Payloads).

    Wenn aktiviert, reiht OpenClaw Systemereignisse wie diese ein:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Konfiguration:

    - `channels.telegram.reactionNotifications`: `off | own | all` (Standard: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (Standard: `minimal`)

    Hinweise:

    - `own` bedeutet nur Benutzerreaktionen auf vom Bot gesendete Nachrichten (Best Effort über den Cache gesendeter Nachrichten).
    - Reaktionsereignisse beachten weiterhin die Telegram-Zugriffssteuerungen (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); nicht autorisierte Absender werden verworfen.
    - Telegram stellt in Reaktionsupdates keine Thread-IDs bereit.
      - Nicht-Forum-Gruppen werden zur Gruppenchat-Sitzung geroutet
      - Forum-Gruppen werden zur allgemeinen Themensitzung der Gruppe geroutet (`:topic:1`), nicht zum exakten ursprünglichen Thema

    `allowed_updates` für Polling/Webhook enthält automatisch `message_reaction`.

  </Accordion>

  <Accordion title="Ack-Reaktionen">
    `ackReaction` sendet ein Bestätigungs-Emoji, während OpenClaw eine eingehende Nachricht verarbeitet.

    Auflösungsreihenfolge:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - Fallback auf das Emoji der Agent-Identität (`agents.list[].identity.emoji`, andernfalls "👀")

    Hinweise:

    - Telegram erwartet Unicode-Emoji (zum Beispiel "👀").
    - Verwenden Sie `""`, um die Reaktion für einen Channel oder ein Konto zu deaktivieren.

  </Accordion>

  <Accordion title="Konfigurationsschreibvorgänge aus Telegram-Ereignissen und -Befehlen">
    Schreibvorgänge für die Channel-Konfiguration sind standardmäßig aktiviert (`configWrites !== false`).

    Von Telegram ausgelöste Schreibvorgänge umfassen:

    - Gruppenmigrationserereignisse (`migrate_to_chat_id`) zum Aktualisieren von `channels.telegram.groups`
    - `/config set` und `/config unset` (erfordert aktivierte Befehle)

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

  <Accordion title="Long Polling vs. Webhook">
    Standard ist Long Polling. Für den Webhook-Modus setzen Sie `channels.telegram.webhookUrl` und `channels.telegram.webhookSecret`; optional `webhookPath`, `webhookHost`, `webhookPort` (Standardwerte `/telegram-webhook`, `127.0.0.1`, `8787`).

    Der lokale Listener bindet an `127.0.0.1:8787`. Für öffentlichen Eingang setzen Sie entweder einen Reverse-Proxy vor den lokalen Port oder legen bewusst `webhookHost: "0.0.0.0"` fest.

    Der Webhook-Modus validiert Request-Guards, das geheime Telegram-Token und den JSON-Body, bevor `200` an Telegram zurückgegeben wird.
    OpenClaw verarbeitet das Update anschließend asynchron über dieselben Bot-Lanes pro Chat/pro Thema, die auch Long Polling verwendet, sodass langsame Agent-Turns das Zustellungs-ACK von Telegram nicht blockieren.

  </Accordion>

  <Accordion title="Limits, Wiederholung und CLI-Ziele">
    - `channels.telegram.textChunkLimit` ist standardmäßig 4000.
    - `channels.telegram.chunkMode="newline"` bevorzugt Absatzgrenzen (Leerzeilen) vor längenbasierter Aufteilung.
    - `channels.telegram.mediaMaxMb` (Standard 100) begrenzt die Größe eingehender und ausgehender Telegram-Medien.
    - `channels.telegram.mediaGroupFlushMs` (Standard 500) steuert, wie lange Telegram-Alben/Mediengruppen gepuffert werden, bevor OpenClaw sie als eine eingehende Nachricht ausliefert. Erhöhen Sie den Wert, wenn Albumteile verspätet eintreffen; verringern Sie ihn, um die Antwortlatenz für Alben zu reduzieren.
    - `channels.telegram.timeoutSeconds` überschreibt das Timeout des Telegram-API-Clients (wenn nicht gesetzt, gilt der grammY-Standard). Bot-Clients begrenzen konfigurierte Werte unterhalb des 60-Sekunden-Guards für ausgehende Text-/Typing-Requests, damit grammY die sichtbare Antwortzustellung nicht abbricht, bevor der Transport-Guard und Fallback von OpenClaw ausgeführt werden können. Long Polling verwendet weiterhin einen 45-Sekunden-Request-Guard für `getUpdates`, damit inaktive Polls nicht unbegrenzt aufgegeben werden.
    - `channels.telegram.pollingStallThresholdMs` ist standardmäßig `120000`; passen Sie den Wert nur bei falsch-positiven Polling-Stall-Neustarts zwischen `30000` und `600000` an.
    - Gruppen-Kontextverlauf verwendet `channels.telegram.historyLimit` oder `messages.groupChat.historyLimit` (Standard 50); `0` deaktiviert ihn.
    - Ergänzender Kontext aus Antworten/Zitaten/Weiterleitungen wird derzeit unverändert weitergegeben.
    - Telegram-Allowlists steuern primär, wer den Agent auslösen kann, nicht eine vollständige Redaktionsgrenze für ergänzenden Kontext.
    - DM-Verlaufssteuerungen:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - Die Konfiguration `channels.telegram.retry` gilt für Telegram-Sendehilfen (CLI/Tools/Aktionen) bei behebbaren ausgehenden API-Fehlern. Die Zustellung der eingehenden finalen Antwort verwendet ebenfalls einen begrenzten Safe-Send-Retry für Telegram-Fehler vor dem Verbindungsaufbau, wiederholt jedoch keine uneindeutigen Netzwerkumschläge nach dem Senden, die sichtbare Nachrichten duplizieren könnten.

    CLI- und Message-Tool-Sendeziele können numerische Chat-ID, Benutzername oder ein Forum-Themenziel sein:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
```

    Telegram-Polls verwenden `openclaw message poll` und unterstützen Forum-Themen:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Nur für Telegram geltende Poll-Flags:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` für Forum-Themen (oder verwenden Sie ein `:topic:`-Ziel)

    Telegram-Senden unterstützt außerdem:

    - `--presentation` mit `buttons`-Blöcken für Inline-Tastaturen, wenn `channels.telegram.capabilities.inlineButtons` dies erlaubt
    - `--pin` oder `--delivery '{"pin":true}'`, um angeheftete Zustellung anzufordern, wenn der Bot in diesem Chat anheften kann
    - `--force-document`, um ausgehende Bilder und GIFs als Dokumente statt als komprimierte Foto- oder animierte Medien-Uploads zu senden

    Aktions-Gating:

    - `channels.telegram.actions.sendMessage=false` deaktiviert ausgehende Telegram-Nachrichten, einschließlich Polls
    - `channels.telegram.actions.poll=false` deaktiviert die Erstellung von Telegram-Polls, während reguläres Senden aktiviert bleibt

  </Accordion>

  <Accordion title="Exec-Genehmigungen in Telegram">
    Telegram unterstützt Exec-Genehmigungen in Genehmiger-DMs und kann Prompts optional im ursprünglichen Chat oder Thema posten. Genehmiger müssen numerische Telegram-Benutzer-IDs sein.

    Konfigurationspfad:

    - `channels.telegram.execApprovals.enabled` (automatisch aktiviert, wenn mindestens ein Genehmiger auflösbar ist)
    - `channels.telegram.execApprovals.approvers` (fällt auf numerische Owner-IDs aus `commands.ownerAllowFrom` zurück)
    - `channels.telegram.execApprovals.target`: `dm` (Standard) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` und `defaultTo` steuern, wer mit dem Bot sprechen kann und wohin er normale Antworten sendet. Sie machen niemanden zu einem Exec-Genehmiger. Die erste genehmigte DM-Kopplung bootstrapt `commands.ownerAllowFrom`, wenn noch kein Befehls-Owner existiert, sodass die Ein-Owner-Einrichtung weiterhin funktioniert, ohne IDs unter `execApprovals.approvers` zu duplizieren.

    Channel-Zustellung zeigt den Befehlstext im Chat; aktivieren Sie `channel` oder `both` nur in vertrauenswürdigen Gruppen/Themen. Wenn der Prompt in einem Forum-Thema landet, bewahrt OpenClaw das Thema für den Genehmigungs-Prompt und die Nachverfolgung. Exec-Genehmigungen laufen standardmäßig nach 30 Minuten ab.

    Inline-Genehmigungsschaltflächen erfordern außerdem, dass `channels.telegram.capabilities.inlineButtons` die Zieloberfläche (`dm`, `group` oder `all`) erlaubt. Genehmigungs-IDs mit dem Präfix `plugin:` werden über Plugin-Genehmigungen aufgelöst; andere werden zuerst über Exec-Genehmigungen aufgelöst.

    Siehe [Exec-Genehmigungen](/de/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Steuerung von Fehlerantworten

Wenn der Agent auf einen Zustellungs- oder Provider-Fehler stößt, kann Telegram entweder mit dem Fehlertext antworten oder ihn unterdrücken. Zwei Konfigurationsschlüssel steuern dieses Verhalten:

| Schlüssel                           | Werte             | Standard | Beschreibung                                                                                         |
| ----------------------------------- | ----------------- | -------- | ---------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`  | `reply` sendet eine freundliche Fehlermeldung an den Chat. `silent` unterdrückt Fehlerantworten vollständig. |
| `channels.telegram.errorCooldownMs` | Zahl (ms)         | `60000`  | Mindestzeit zwischen Fehlerantworten an denselben Chat. Verhindert Fehler-Spam während Ausfällen.     |

Überschreibungen pro Konto, Gruppe und Thema werden unterstützt (gleiche Vererbung wie bei anderen Telegram-Konfigurationsschlüsseln).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "reply",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // suppress errors in this group
        },
      },
    },
  },
}
```

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Bot reagiert nicht auf Gruppennachrichten ohne Erwähnung">

    - Wenn `requireMention=false` gesetzt ist, muss der Telegram-Datenschutzmodus vollständige Sichtbarkeit zulassen.
      - BotFather: `/setprivacy` -> Deaktivieren
      - dann den Bot aus der Gruppe entfernen und erneut hinzufügen
    - `openclaw channels status` warnt, wenn die Konfiguration nicht erwähnte Gruppennachrichten erwartet.
    - `openclaw channels status --probe` kann explizite numerische Gruppen-IDs prüfen; die Mitgliedschaft des Platzhalters `"*"` kann nicht geprüft werden.
    - schneller Sitzungstest: `/activation always`.

  </Accordion>

  <Accordion title="Bot sieht Gruppennachrichten überhaupt nicht">

    - Wenn `channels.telegram.groups` vorhanden ist, muss die Gruppe aufgeführt sein (oder `"*"` enthalten).
    - Bot-Mitgliedschaft in der Gruppe prüfen
    - Protokolle prüfen: `openclaw logs --follow` auf Gründe für Überspringen

  </Accordion>

  <Accordion title="Befehle funktionieren teilweise oder gar nicht">

    - Autorisieren Sie Ihre Absenderidentität (Pairing und/oder numerisches `allowFrom`).
    - Die Befehlsautorisierung gilt weiterhin, auch wenn die Gruppenrichtlinie `open` ist.
    - `setMyCommands failed` mit `BOT_COMMANDS_TOO_MUCH` bedeutet, dass das native Menü zu viele Einträge hat; reduzieren Sie Plugin-/Skill-/benutzerdefinierte Befehle oder deaktivieren Sie native Menüs.
    - `deleteMyCommands`- / `setMyCommands`-Startaufrufe und `sendChatAction`-Tippen-Aufrufe sind begrenzt und werden bei Request-Timeout einmal über den Telegram-Transport-Fallback wiederholt. Dauerhafte Netzwerk-/Fetch-Fehler deuten in der Regel auf DNS-/HTTPS-Erreichbarkeitsprobleme zu `api.telegram.org` hin.

  </Accordion>

  <Accordion title="Start meldet nicht autorisiertes Token">

    - `getMe returned 401` ist ein Telegram-Authentifizierungsfehler für das konfigurierte Bot-Token.
    - Kopieren oder generieren Sie das Bot-Token in BotFather erneut, und aktualisieren Sie dann `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` oder `TELEGRAM_BOT_TOKEN` für das Standardkonto.
    - `deleteWebhook 401 Unauthorized` während des Starts ist ebenfalls ein Authentifizierungsfehler; dies als „kein Webhook vorhanden“ zu behandeln, würde denselben Fehler durch ungültiges Token nur auf spätere API-Aufrufe verschieben.

  </Accordion>

  <Accordion title="Polling- oder Netzwerkinstabilität">

    - Node 22+ und benutzerdefinierte Fetch-/Proxy-Konfigurationen können sofortiges Abbruchverhalten auslösen, wenn AbortSignal-Typen nicht übereinstimmen.
    - Einige Hosts lösen `api.telegram.org` zuerst zu IPv6 auf; defekter IPv6-Ausgang kann zeitweise Telegram-API-Fehler verursachen.
    - Wenn Protokolle `TypeError: fetch failed` oder `Network request for 'getUpdates' failed!` enthalten, wiederholt OpenClaw diese jetzt als behebbare Netzwerkfehler.
    - Beim Polling-Start verwendet OpenClaw die erfolgreiche Startprüfung `getMe` für grammY erneut, sodass der Runner kein zweites `getMe` vor dem ersten `getUpdates` benötigt.
    - Wenn `deleteWebhook` beim Polling-Start mit einem vorübergehenden Netzwerkfehler fehlschlägt, fährt OpenClaw mit Long Polling fort, statt einen weiteren Control-Plane-Aufruf vor dem Polling auszuführen. Ein noch aktiver Webhook erscheint als `getUpdates`-Konflikt; OpenClaw baut dann den Telegram-Transport neu auf und versucht erneut, den Webhook zu bereinigen.
    - Wenn Telegram-Sockets in einem kurzen festen Rhythmus erneuert werden, prüfen Sie auf einen niedrigen Wert für `channels.telegram.timeoutSeconds`; Bot-Clients begrenzen konfigurierte Werte unterhalb der Outbound- und `getUpdates`-Request-Guards, ältere Versionen konnten jedoch jeden Poll oder jede Antwort abbrechen, wenn dies unterhalb dieser Guards gesetzt war.
    - Wenn Protokolle `Polling stall detected` enthalten, startet OpenClaw standardmäßig das Polling neu und baut den Telegram-Transport nach 120 Sekunden ohne abgeschlossene Long-Poll-Liveness neu auf.
    - `openclaw channels status --probe` und `openclaw doctor` warnen, wenn ein laufendes Polling-Konto nach der Startkulanz kein `getUpdates` abgeschlossen hat, wenn ein laufendes Webhook-Konto nach der Startkulanz kein `setWebhook` abgeschlossen hat oder wenn die letzte erfolgreiche Polling-Transportaktivität veraltet ist.
    - Erhöhen Sie `channels.telegram.pollingStallThresholdMs` nur, wenn lang laufende `getUpdates`-Aufrufe gesund sind, Ihr Host aber weiterhin fälschliche Polling-Stall-Neustarts meldet. Dauerhafte Stalls deuten in der Regel auf Proxy-, DNS-, IPv6- oder TLS-Ausgangsprobleme zwischen Host und `api.telegram.org` hin.
    - Telegram berücksichtigt außerdem Prozess-Proxy-Umgebungsvariablen für den Bot-API-Transport, einschließlich `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` und deren kleingeschriebene Varianten. `NO_PROXY` / `no_proxy` kann `api.telegram.org` weiterhin umgehen.
    - Wenn der von OpenClaw verwaltete Proxy in einer Service-Umgebung über `OPENCLAW_PROXY_URL` konfiguriert ist und keine Standard-Proxy-Umgebungsvariable vorhanden ist, verwendet Telegram diese URL ebenfalls für den Bot-API-Transport.
    - Auf VPS-Hosts mit instabilem direktem Ausgang/TLS leiten Sie Telegram-API-Aufrufe über `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ verwendet standardmäßig `autoSelectFamily=true` (außer WSL2). Die Reihenfolge der Telegram-DNS-Ergebnisse berücksichtigt `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, dann `channels.telegram.network.dnsResultOrder`, dann den Prozessstandard wie `NODE_OPTIONS=--dns-result-order=ipv4first`; wenn nichts davon zutrifft, fällt Node 22+ auf `ipv4first` zurück.
    - Wenn Ihr Host WSL2 ist oder ausdrücklich besser mit reinem IPv4-Verhalten funktioniert, erzwingen Sie die Family-Auswahl:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Antworten aus dem RFC-2544-Benchmark-Bereich (`198.18.0.0/15`) sind für Telegram-Mediendownloads standardmäßig bereits erlaubt. Wenn ein vertrauenswürdiger Fake-IP- oder transparenter Proxy `api.telegram.org` während Mediendownloads auf eine andere private/interne/Special-Use-Adresse umschreibt, können Sie sich für die nur Telegram betreffende Umgehung entscheiden:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Dieselbe Opt-in-Option ist pro Konto unter
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork` verfügbar.
    - Wenn Ihr Proxy Telegram-Medienhosts in `198.18.x.x` auflöst, lassen Sie die gefährliche Option zunächst deaktiviert. Telegram-Medien erlauben den RFC-2544-Benchmark-Bereich bereits standardmäßig.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` schwächt die SSRF-Schutzmaßnahmen für Telegram-Medien. Verwenden Sie dies nur für vertrauenswürdige, operatorgesteuerte Proxy-Umgebungen wie Clash-, Mihomo- oder Surge-Fake-IP-Routing, wenn diese private oder Special-Use-Antworten außerhalb des RFC-2544-Benchmark-Bereichs synthetisieren. Lassen Sie es für normalen öffentlichen Internetzugriff auf Telegram deaktiviert.
    </Warning>

    - Umgebungsüberschreibungen (temporär):
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - DNS-Antworten validieren:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

Weitere Hilfe: [Channel-Fehlerbehebung](/de/channels/troubleshooting).

## Konfigurationsreferenz

Primäre Referenz: [Konfigurationsreferenz - Telegram](/de/gateway/config-channels#telegram).

<Accordion title="Wichtige Telegram-Felder">

- Start/Authentifizierung: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` muss auf eine reguläre Datei verweisen; Symlinks werden abgelehnt)
- Zugriffskontrolle: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` auf oberster Ebene (`type: "acp"`)
- Ausführungsgenehmigungen: `execApprovals`, `accounts.*.execApprovals`
- Befehl/Menü: `commands.native`, `commands.nativeSkills`, `customCommands`
- Threads/Antworten: `replyToMode`, `dm.threadReplies`, `direct.*.threadReplies`
- Streaming: `streaming` (Vorschau), `streaming.preview.toolProgress`, `blockStreaming`
- Formatierung/Zustellung: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- Medien/Netzwerk: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- benutzerdefinierter API-Root: `apiRoot` (nur Bot-API-Root; `/bot<TOKEN>` nicht einschließen)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- Aktionen/Fähigkeiten: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- Reaktionen: `reactionNotifications`, `reactionLevel`
- Fehler: `errorPolicy`, `errorCooldownMs`
- Schreibvorgänge/Verlauf: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Priorität bei mehreren Konten: Wenn zwei oder mehr Konto-IDs konfiguriert sind, setzen Sie `channels.telegram.defaultAccount` (oder fügen Sie `channels.telegram.accounts.default` hinzu), um das Standardrouting explizit zu machen. Andernfalls fällt OpenClaw auf die erste normalisierte Konto-ID zurück und `openclaw doctor` warnt. Benannte Konten erben `channels.telegram.allowFrom` / `groupAllowFrom`, aber keine `accounts.default.*`-Werte.
</Note>

## Verwandt

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/de/channels/pairing">
    Koppeln Sie einen Telegram-Benutzer mit dem Gateway.
  </Card>
  <Card title="Gruppen" icon="users" href="/de/channels/groups">
    Allowlist-Verhalten für Gruppen und Themen.
  </Card>
  <Card title="Channel-Routing" icon="route" href="/de/channels/channel-routing">
    Eingehende Nachrichten an Agenten routen.
  </Card>
  <Card title="Sicherheit" icon="shield" href="/de/gateway/security">
    Bedrohungsmodell und Härtung.
  </Card>
  <Card title="Multi-Agent-Routing" icon="sitemap" href="/de/concepts/multi-agent">
    Gruppen und Themen Agenten zuordnen.
  </Card>
  <Card title="Fehlerbehebung" icon="wrench" href="/de/channels/troubleshooting">
    Channel-übergreifende Diagnosen.
  </Card>
</CardGroup>
