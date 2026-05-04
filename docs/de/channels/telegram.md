---
read_when:
    - Arbeiten an Telegram-Funktionen oder Webhooks
summary: Supportstatus, Funktionen und Konfiguration des Telegram-Bots
title: Telegram
x-i18n:
    generated_at: "2026-05-04T07:02:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6ef1b019a6a0e261b33972b5edffaedd29310b1333d112bade2e79e9d56887c6
    source_path: channels/telegram.md
    workflow: 16
---

Produktionsbereit für Bot-DMs und Gruppen über grammY. Long Polling ist der Standardmodus; Webhook-Modus ist optional.

<CardGroup cols={3}>
  <Card title="Kopplung" icon="link" href="/de/channels/pairing">
    Die Standard-DM-Richtlinie für Telegram ist Kopplung.
  </Card>
  <Card title="Kanal-Fehlerbehebung" icon="wrench" href="/de/channels/troubleshooting">
    Kanalübergreifende Diagnosen und Reparatur-Playbooks.
  </Card>
  <Card title="Gateway-Konfiguration" icon="settings" href="/de/gateway/configuration">
    Vollständige Kanalkonfigurationsmuster und Beispiele.
  </Card>
</CardGroup>

## Schnelle Einrichtung

<Steps>
  <Step title="Bot-Token in BotFather erstellen">
    Öffnen Sie Telegram und chatten Sie mit **@BotFather** (bestätigen Sie, dass der Handle genau `@BotFather` lautet).

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
    Telegram verwendet **nicht** `openclaw channels login telegram`; konfigurieren Sie das Token in config/env und starten Sie dann das Gateway.

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
    Fügen Sie den Bot zu Ihrer Gruppe hinzu und legen Sie dann `channels.telegram.groups` und `groupPolicy` passend zu Ihrem Zugriffsmodell fest.
  </Step>
</Steps>

<Note>
Die Reihenfolge der Token-Auflösung ist kontobewusst. In der Praxis haben Konfigurationswerte Vorrang vor dem Env-Fallback, und `TELEGRAM_BOT_TOKEN` gilt nur für das Standardkonto.
</Note>

## Telegram-seitige Einstellungen

<AccordionGroup>
  <Accordion title="Privatsphäremodus und Gruppensichtbarkeit">
    Telegram-Bots verwenden standardmäßig den **Privatsphäremodus**, der einschränkt, welche Gruppennachrichten sie empfangen.

    Wenn der Bot alle Gruppennachrichten sehen muss, entweder:

    - deaktivieren Sie den Privatsphäremodus über `/setprivacy`, oder
    - machen Sie den Bot zum Gruppenadministrator.

    Wenn Sie den Privatsphäremodus umschalten, entfernen Sie den Bot aus jeder Gruppe und fügen Sie ihn erneut hinzu, damit Telegram die Änderung anwendet.

  </Accordion>

  <Accordion title="Gruppenberechtigungen">
    Der Administratorstatus wird in den Telegram-Gruppeneinstellungen gesteuert.

    Administrator-Bots empfangen alle Gruppennachrichten, was für immer aktive Gruppenfunktionen nützlich ist.

  </Accordion>

  <Accordion title="Hilfreiche BotFather-Umschalter">

    - `/setjoingroups`, um Gruppenhinzufügungen zu erlauben/zu verweigern
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

    `dmPolicy: "open"` mit `allowFrom: ["*"]` erlaubt jedem Telegram-Konto, das den Bot-Benutzernamen findet oder errät, dem Bot Befehle zu geben. Verwenden Sie dies nur für bewusst öffentliche Bots mit stark eingeschränkten Tools; Bots mit einem einzelnen Owner sollten `allowlist` mit numerischen Benutzer-IDs verwenden.

    `channels.telegram.allowFrom` akzeptiert numerische Telegram-Benutzer-IDs. Präfixe `telegram:` / `tg:` werden akzeptiert und normalisiert.
    In Mehrkontokonfigurationen wird ein restriktives `channels.telegram.allowFrom` auf oberster Ebene als Sicherheitsgrenze behandelt: Kontospezifische `allowFrom: ["*"]`-Einträge machen dieses Konto nicht öffentlich, es sei denn, die effektive Allowlist des Kontos enthält nach dem Zusammenführen weiterhin einen expliziten Platzhalter.
    `dmPolicy: "allowlist"` mit leerem `allowFrom` blockiert alle DMs und wird von der Konfigurationsvalidierung abgelehnt.
    Die Einrichtung fragt nur nach numerischen Benutzer-IDs.
    Wenn Sie ein Upgrade durchgeführt haben und Ihre Konfiguration `@username`-Allowlist-Einträge enthält, führen Sie `openclaw doctor --fix` aus, um sie aufzulösen (nach bestem Bemühen; erfordert ein Telegram-Bot-Token).
    Wenn Sie zuvor Allowlist-Dateien des Kopplungsspeichers verwendet haben, kann `openclaw doctor --fix` Einträge in Allowlist-Flows in `channels.telegram.allowFrom` wiederherstellen (zum Beispiel, wenn `dmPolicy: "allowlist"` noch keine expliziten IDs hat).

    Für Bots mit einem einzelnen Owner bevorzugen Sie `dmPolicy: "allowlist"` mit expliziten numerischen `allowFrom`-IDs, damit die Zugriffsrichtlinie dauerhaft in der Konfiguration liegt (statt von früheren Kopplungsgenehmigungen abzuhängen).

    Häufige Verwirrung: Die Genehmigung einer DM-Kopplung bedeutet nicht „dieser Absender ist überall autorisiert“.
    Kopplung gewährt DM-Zugriff. Wenn noch kein Befehls-Owner existiert, setzt die erste genehmigte Kopplung auch `commands.ownerAllowFrom`, sodass Owner-only-Befehle und Exec-Genehmigungen ein explizites Betreiberkonto haben.
    Die Autorisierung von Gruppenabsendern stammt weiterhin aus expliziten Konfigurations-Allowlists.
    Wenn Sie möchten „Ich bin einmal autorisiert und sowohl DMs als auch Gruppenbefehle funktionieren“, setzen Sie Ihre numerische Telegram-Benutzer-ID in `channels.telegram.allowFrom`; stellen Sie für Owner-only-Befehle sicher, dass `commands.ownerAllowFrom` `telegram:<your user id>` enthält.

    ### Ihre Telegram-Benutzer-ID finden

    Sicherer (kein Drittanbieter-Bot):

    1. Senden Sie Ihrem Bot eine DM.
    2. Führen Sie `openclaw logs --follow` aus.
    3. Lesen Sie `from.id`.

    Offizielle Bot-API-Methode:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Drittanbietermethode (weniger privat): `@userinfobot` oder `@getidsbot`.

  </Tab>

  <Tab title="Gruppenrichtlinie und Allowlists">
    Zwei Steuerungen gelten zusammen:

    1. **Welche Gruppen erlaubt sind** (`channels.telegram.groups`)
       - keine `groups`-Konfiguration:
         - mit `groupPolicy: "open"`: Jede Gruppe kann Gruppen-ID-Prüfungen bestehen
         - mit `groupPolicy: "allowlist"` (Standard): Gruppen werden blockiert, bis Sie `groups`-Einträge (oder `"*"`) hinzufügen
       - `groups` konfiguriert: fungiert als Allowlist (explizite IDs oder `"*"`)

    2. **Welche Absender in Gruppen erlaubt sind** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (Standard)
       - `disabled`

    `groupAllowFrom` wird für die Filterung von Gruppenabsendern verwendet. Wenn nicht gesetzt, fällt Telegram auf `allowFrom` zurück.
    `groupAllowFrom`-Einträge sollten numerische Telegram-Benutzer-IDs sein (Präfixe `telegram:` / `tg:` werden normalisiert).
    Tragen Sie keine Telegram-Gruppen- oder Supergruppen-Chat-IDs in `groupAllowFrom` ein. Negative Chat-IDs gehören unter `channels.telegram.groups`.
    Nicht numerische Einträge werden für die Absenderautorisierung ignoriert.
    Sicherheitsgrenze (`2026.2.25+`): Die Authentifizierung von Gruppenabsendern erbt **keine** Genehmigungen aus dem DM-Kopplungsspeicher.
    Kopplung bleibt nur für DMs. Legen Sie für Gruppen `groupAllowFrom` oder `allowFrom` pro Gruppe/pro Topic fest.
    Wenn `groupAllowFrom` nicht gesetzt ist, fällt Telegram auf die Konfiguration `allowFrom` zurück, nicht auf den Kopplungsspeicher.
    Praktisches Muster für Bots mit einem einzelnen Owner: Setzen Sie Ihre Benutzer-ID in `channels.telegram.allowFrom`, lassen Sie `groupAllowFrom` unset und erlauben Sie die Zielgruppen unter `channels.telegram.groups`.
    Laufzeithinweis: Wenn `channels.telegram` vollständig fehlt, verwendet die Laufzeit standardmäßig fail-closed `groupPolicy="allowlist"`, es sei denn, `channels.defaults.groupPolicy` ist explizit gesetzt.

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

      - Setzen Sie negative Telegram-Gruppen- oder Supergruppen-Chat-IDs wie `-1001234567890` unter `channels.telegram.groups`.
      - Setzen Sie Telegram-Benutzer-IDs wie `8734062810` unter `groupAllowFrom`, wenn Sie begrenzen möchten, welche Personen innerhalb einer erlaubten Gruppe den Bot auslösen können.
      - Verwenden Sie `groupAllowFrom: ["*"]` nur, wenn jedes Mitglied einer erlaubten Gruppe mit dem Bot sprechen können soll.

    </Warning>

  </Tab>

  <Tab title="Erwähnungsverhalten">
    Gruppenantworten erfordern standardmäßig eine Erwähnung.

    Die Erwähnung kann kommen von:

    - nativer `@botusername`-Erwähnung, oder
    - Erwähnungsmustern in:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Sitzungsbezogene Befehlsumschalter:

    - `/activation always`
    - `/activation mention`

    Diese aktualisieren nur den Sitzungszustand. Verwenden Sie Konfiguration für Persistenz.

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

    Gruppen-Chat-ID erhalten:

    - leiten Sie eine Gruppennachricht an `@userinfobot` / `@getidsbot` weiter
    - oder lesen Sie `chat.id` aus `openclaw logs --follow`
    - oder prüfen Sie Bot API `getUpdates`

  </Tab>
</Tabs>

## Laufzeitverhalten

- Telegram gehört zum Gateway-Prozess.
- Das Routing ist deterministisch: Eingehende Telegram-Nachrichten werden an Telegram beantwortet (das Modell wählt keine Kanäle aus).
- Eingehende Nachrichten werden in den gemeinsamen Kanalumschlag mit Antwortmetadaten und Medienplatzhaltern normalisiert.
- Gruppensitzungen werden nach Gruppen-ID isoliert. Forum-Topics hängen `:topic:<threadId>` an, um Topics isoliert zu halten.
- DM-Nachrichten können `message_thread_id` enthalten; OpenClaw erhält die Thread-ID für Antworten, hält DMs aber standardmäßig in der flachen Sitzung. Konfigurieren Sie `channels.telegram.dm.threadReplies: "inbound"`, `channels.telegram.direct.<chatId>.threadReplies: "inbound"`, `requireTopic: true` oder eine passende Topic-Konfiguration, wenn Sie bewusst DM-Topic-Sitzungsisolation wünschen.
- Long Polling verwendet grammY Runner mit Sequenzierung pro Chat/pro Thread. Die gesamte Runner-Sink-Parallelität verwendet `agents.defaults.maxConcurrent`.
- Long Polling wird innerhalb jedes Gateway-Prozesses geschützt, sodass immer nur ein aktiver Poller ein Bot-Token gleichzeitig verwenden kann. Wenn Sie weiterhin `getUpdates`-409-Konflikte sehen, verwendet wahrscheinlich ein anderes OpenClaw-Gateway, Skript oder externer Poller dasselbe Token.
- Neustarts des Long-Polling-Watchdogs werden standardmäßig nach 120 Sekunden ohne abgeschlossene `getUpdates`-Liveness ausgelöst. Erhöhen Sie `channels.telegram.pollingStallThresholdMs` nur, wenn Ihre Bereitstellung bei lang laufenden Arbeiten weiterhin falsche Polling-Stall-Neustarts sieht. Der Wert ist in Millisekunden angegeben und von `30000` bis `600000` zulässig; kontospezifische Überschreibungen werden unterstützt.
- Die Telegram Bot API bietet keine Unterstützung für Lesebestätigungen (`sendReadReceipts` gilt nicht).

## Funktionsreferenz

<AccordionGroup>
  <Accordion title="Live-Stream-Vorschau (Nachrichtenbearbeitungen)">
    OpenClaw kann Teilantworten in Echtzeit streamen:

    - direkte Chats: Vorschaunachricht + `editMessageText`
    - Gruppen/Topics: Vorschaunachricht + `editMessageText`

    Anforderung:

    - `channels.telegram.streaming` ist `off | partial | block | progress` (Standard: `partial`)
    - `progress` hält einen bearbeitbaren Statusentwurf und aktualisiert ihn mit Tool-Fortschritt bis zur finalen Zustellung
    - `streaming.preview.toolProgress` steuert, ob Tool-/Fortschrittsaktualisierungen dieselbe bearbeitete Vorschaunachricht wiederverwenden (Standard: `true`, wenn Vorschau-Streaming aktiv ist)
    - `streaming.preview.commandText` steuert Befehls-/Exec-Details innerhalb dieser Tool-Fortschrittszeilen: `raw` (Standard, erhält veröffentlichtes Verhalten) oder `status` (nur Tool-Label)
    - veraltete `channels.telegram.streamMode`- und boolesche `streaming`-Werte werden erkannt; führen Sie `openclaw doctor --fix` aus, um sie nach `channels.telegram.streaming.mode` zu migrieren

    Tool-Fortschrittsvorschau-Aktualisierungen sind die kurzen Statuszeilen, die angezeigt werden, während Tools laufen, zum Beispiel Befehlsausführung, Dateilesevorgänge, Planungsaktualisierungen oder Patch-Zusammenfassungen. Telegram lässt diese standardmäßig aktiviert, um dem veröffentlichten OpenClaw-Verhalten ab `v2026.4.22` und später zu entsprechen. Um die bearbeitete Vorschau für Antworttext beizubehalten, aber Tool-Fortschrittszeilen auszublenden, setzen Sie:

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

    Um Tool-Fortschritt sichtbar zu halten, aber Befehls-/Exec-Text auszublenden, setzen Sie:

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

    Für den Fortschrittsentwurfsmodus legen Sie dieselbe Richtlinie für Befehlstext unter `streaming.progress` ab:

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

    Verwenden Sie `streaming.mode: "off"` nur, wenn Sie ausschließlich finale Zustellung wünschen: Telegram-Vorschau-Bearbeitungen sind deaktiviert, und generisches Tool-/Fortschrittsrauschen wird unterdrückt, statt als eigenständige Statusmeldungen gesendet zu werden. Genehmigungsabfragen, Mediennutzlasten und Fehler laufen weiterhin über die normale finale Zustellung. Verwenden Sie `streaming.preview.toolProgress: false`, wenn Sie nur Antwortvorschau-Bearbeitungen beibehalten möchten, während Sie die Statuszeilen zum Tool-Fortschritt ausblenden.

    <Note>
      Ausgewählte Telegram-Zitatantworten sind die Ausnahme. Wenn `replyToMode` `"first"`, `"all"` oder `"batched"` ist und die eingehende Nachricht ausgewählten Zitattext enthält, sendet OpenClaw die finale Antwort über Telegrams nativen Zitatantwort-Pfad, statt die Antwortvorschau zu bearbeiten. Deshalb kann `streaming.preview.toolProgress` für diesen Durchlauf die kurzen Statuszeilen nicht anzeigen. Antworten auf die aktuelle Nachricht ohne ausgewählten Zitattext behalten weiterhin Vorschau-Streaming bei. Setzen Sie `replyToMode: "off"`, wenn Sichtbarkeit des Tool-Fortschritts wichtiger ist als native Zitatantworten, oder setzen Sie `streaming.preview.toolProgress: false`, um den Kompromiss anzuerkennen.
    </Note>

    Für reine Textantworten:

    - kurze DM-/Gruppen-/Themenvorschauen: OpenClaw behält dieselbe Vorschaunachricht bei und führt eine finale Bearbeitung direkt dort aus, sofern nach dem Erscheinen der Vorschau keine sichtbare Nicht-Vorschaunachricht gesendet wurde
    - Vorschauen, denen sichtbare Nicht-Vorschauausgabe folgt: OpenClaw sendet die abgeschlossene Antwort als neue finale Nachricht und räumt die ältere Vorschau auf, sodass die finale Antwort nach der Zwischenausgabe erscheint
    - Vorschauen, die älter als etwa eine Minute sind: OpenClaw sendet die abgeschlossene Antwort als neue finale Nachricht und räumt danach die Vorschau auf, sodass Telegrams sichtbarer Zeitstempel die Abschlusszeit statt der Erstellungszeit der Vorschau widerspiegelt

    Bei komplexen Antworten (zum Beispiel Mediennutzlasten) fällt OpenClaw auf die normale finale Zustellung zurück und räumt anschließend die Vorschaunachricht auf.

    Vorschau-Streaming ist getrennt von Block-Streaming. Wenn Block-Streaming für Telegram explizit aktiviert ist, überspringt OpenClaw den Vorschaustream, um doppeltes Streaming zu vermeiden.

    Reiner Telegram-Reasoning-Stream:

    - `/reasoning stream` sendet Reasoning während der Generierung an die Live-Vorschau
    - die Reasoning-Vorschau wird nach finaler Zustellung gelöscht; verwenden Sie `/reasoning on`, wenn Reasoning sichtbar bleiben soll
    - die finale Antwort wird ohne Reasoning-Text gesendet

  </Accordion>

  <Accordion title="Formatierung und HTML-Fallback">
    Ausgehender Text verwendet Telegram `parse_mode: "HTML"`.

    - Markdown-ähnlicher Text wird in Telegram-sicheres HTML gerendert.
    - Rohes Modell-HTML wird escaped, um Telegram-Parse-Fehler zu reduzieren.
    - Wenn Telegram geparstes HTML ablehnt, versucht OpenClaw es erneut als Klartext.

    Linkvorschauen sind standardmäßig aktiviert und können mit `channels.telegram.linkPreview: false` deaktiviert werden.

  </Accordion>

  <Accordion title="Native Befehle und benutzerdefinierte Befehle">
    Die Registrierung des Telegram-Befehlsmenüs wird beim Start mit `setMyCommands` verarbeitet.

    Standardwerte für native Befehle:

    - `commands.native: "auto"` aktiviert native Befehle für Telegram

    Benutzerdefinierte Befehlsmenüeinträge hinzufügen:

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

    - Namen werden normalisiert (führendes `/` entfernen, Kleinbuchstaben)
    - gültiges Muster: `a-z`, `0-9`, `_`, Länge `1..32`
    - benutzerdefinierte Befehle können native Befehle nicht überschreiben
    - Konflikte/Duplikate werden übersprungen und protokolliert

    Hinweise:

    - benutzerdefinierte Befehle sind nur Menüeinträge; sie implementieren kein Verhalten automatisch
    - Plugin-/Skill-Befehle können bei Eingabe weiterhin funktionieren, auch wenn sie im Telegram-Menü nicht angezeigt werden

    Wenn native Befehle deaktiviert sind, werden integrierte Befehle entfernt. Benutzerdefinierte/Plugin-Befehle können sich weiterhin registrieren, wenn sie konfiguriert sind.

    Häufige Einrichtungsfehler:

    - `setMyCommands failed` mit `BOT_COMMANDS_TOO_MUCH` bedeutet, dass das Telegram-Menü nach dem Kürzen weiterhin überfüllt war; reduzieren Sie Plugin-/Skill-/benutzerdefinierte Befehle oder deaktivieren Sie `channels.telegram.commands.native`.
    - Wenn `deleteWebhook`, `deleteMyCommands` oder `setMyCommands` mit `404: Not Found` fehlschlagen, während direkte Bot-API-curl-Befehle funktionieren, kann das bedeuten, dass `channels.telegram.apiRoot` auf den vollständigen `/bot<TOKEN>`-Endpunkt gesetzt wurde. `apiRoot` darf nur der Bot-API-Root sein, und `openclaw doctor --fix` entfernt ein versehentliches abschließendes `/bot<TOKEN>`.
    - `getMe returned 401` bedeutet, dass Telegram das konfigurierte Bot-Token abgelehnt hat. Aktualisieren Sie `botToken`, `tokenFile` oder `TELEGRAM_BOT_TOKEN` mit dem aktuellen BotFather-Token; OpenClaw stoppt vor dem Polling, daher wird dies nicht als Webhook-Bereinigungsfehler gemeldet.
    - `setMyCommands failed` mit Netzwerk-/Fetch-Fehlern bedeutet normalerweise, dass ausgehendes DNS/HTTPS zu `api.telegram.org` blockiert ist.

    ### Befehle zur Gerätekopplung (`device-pair`-Plugin)

    Wenn das `device-pair`-Plugin installiert ist:

    1. `/pair` erzeugt Einrichtungscode
    2. Code in die iOS-App einfügen
    3. `/pair pending` listet ausstehende Anfragen auf (einschließlich Rolle/Scopes)
    4. die Anfrage genehmigen:
       - `/pair approve <requestId>` für explizite Genehmigung
       - `/pair approve`, wenn nur eine ausstehende Anfrage vorhanden ist
       - `/pair approve latest` für die aktuellste Anfrage

    Der Einrichtungscode trägt ein kurzlebiges Bootstrap-Token. Die integrierte Bootstrap-Übergabe belässt das primäre Node-Token bei `scopes: []`; jedes übergebene Operator-Token bleibt auf `operator.approvals`, `operator.read`, `operator.talk.secrets` und `operator.write` begrenzt. Bootstrap-Scope-Prüfungen sind rollenpräfixiert, daher erfüllt diese Operator-Allowlist nur Operator-Anfragen; Nicht-Operator-Rollen benötigen weiterhin Scopes unter ihrem eigenen Rollenpräfix.

    Wenn ein Gerät mit geänderten Authentifizierungsdetails erneut versucht (zum Beispiel Rolle/Scopes/öffentlicher Schlüssel), wird die vorherige ausstehende Anfrage ersetzt und die neue Anfrage verwendet eine andere `requestId`. Führen Sie `/pair pending` erneut aus, bevor Sie genehmigen.

    Weitere Details: [Kopplung](/de/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="Inline-Buttons">
    Inline-Tastatur-Scope konfigurieren:

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

    Veraltetes `capabilities: ["inlineButtons"]` wird `inlineButtons: "all"` zugeordnet.

    Beispiel für Nachrichtenaktion:

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
    Telegram-Tool-Aktionen enthalten:

    - `sendMessage` (`to`, `content`, optional `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, optional `iconColor`, `iconCustomEmojiId`)

    Channel-Nachrichtenaktionen stellen ergonomische Aliasse bereit (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Gating-Steuerelemente:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (Standard: deaktiviert)

    Hinweis: `edit` und `topic-create` sind derzeit standardmäßig aktiviert und haben keine separaten `channels.telegram.actions.*`-Schalter.
    Laufzeit-Sends verwenden den aktiven Config-/Secrets-Snapshot (Start/Reload), daher führen Aktionspfade keine Ad-hoc-Neuauflösung von SecretRef pro Send aus.

    Semantik zum Entfernen von Reactions: [/tools/reactions](/de/tools/reactions)

  </Accordion>

  <Accordion title="Tags für Antwort-Threading">
    Telegram unterstützt explizite Tags für Antwort-Threading in generierter Ausgabe:

    - `[[reply_to_current]]` antwortet auf die auslösende Nachricht
    - `[[reply_to:<id>]]` antwortet auf eine bestimmte Telegram-Nachrichten-ID

    `channels.telegram.replyToMode` steuert die Verarbeitung:

    - `off` (Standard)
    - `first`
    - `all`

    Wenn Antwort-Threading aktiviert ist und der ursprüngliche Telegram-Text oder die Beschriftung verfügbar ist, fügt OpenClaw automatisch einen nativen Telegram-Zitatauszug ein. Telegram begrenzt nativen Zitattext auf 1024 UTF-16-Codeeinheiten, daher werden längere Nachrichten vom Anfang an zitiert und fallen auf eine einfache Antwort zurück, wenn Telegram das Zitat ablehnt.

    Hinweis: `off` deaktiviert implizites Antwort-Threading. Explizite `[[reply_to_*]]`-Tags werden weiterhin berücksichtigt.

  </Accordion>

  <Accordion title="Forumthemen und Thread-Verhalten">
    Forum-Supergruppen:

    - Themen-Sitzungsschlüssel hängen `:topic:<threadId>` an
    - Antworten und Tippanzeige zielen auf den Themen-Thread
    - Themen-Config-Pfad:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Spezialfall allgemeines Thema (`threadId=1`):

    - Nachrichten-Sends lassen `message_thread_id` aus (Telegram lehnt `sendMessage(...thread_id=1)` ab)
    - Tippaktionen enthalten weiterhin `message_thread_id`

    Themenvererbung: Themeneinträge erben Gruppeneinstellungen, sofern sie nicht überschrieben werden (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` ist nur themenspezifisch und wird nicht von Gruppenstandardwerten geerbt.

    **Agent-Routing pro Thema**: Jedes Thema kann zu einem anderen Agent routen, indem `agentId` in der Themen-Config gesetzt wird. Dadurch erhält jedes Thema seinen eigenen isolierten Workspace, Speicher und seine eigene Sitzung. Beispiel:

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

    **Persistente ACP-Themenbindung**: Forumthemen können ACP-Harness-Sitzungen über typisierte ACP-Bindings der obersten Ebene anpinnen (`bindings[]` mit `type: "acp"` und `match.channel: "telegram"`, `peer.kind: "group"` sowie einer themenqualifizierten ID wie `-1001234567890:topic:42`). Derzeit auf Forumthemen in Gruppen/Supergruppen beschränkt. Siehe [ACP Agents](/de/tools/acp-agents).

    **Thread-gebundener ACP-Spawn aus dem Chat**: `/acp spawn <agent> --thread here|auto` bindet das aktuelle Thema an eine neue ACP-Sitzung; Folgebeiträge werden direkt dorthin geroutet. OpenClaw pinnt die Spawn-Bestätigung im Thema an. Erfordert, dass `channels.telegram.threadBindings.spawnSessions` aktiviert bleibt (Standard: `true`).

    Der Template-Kontext stellt `MessageThreadId` und `IsForum` bereit. DM-Chats mit `message_thread_id` behalten standardmäßig DM-Routing und Antwortmetadaten in flachen Sitzungen bei; thread-aware Sitzungsschlüssel werden nur verwendet, wenn `threadReplies: "inbound"`, `threadReplies: "always"`, `requireTopic: true` oder eine passende Themenkonfiguration konfiguriert ist. Verwenden Sie `channels.telegram.dm.threadReplies` auf oberster Ebene für den Kontostandard oder `direct.<chatId>.threadReplies` für eine einzelne DM.

  </Accordion>

  <Accordion title="Audio, Video und Sticker">
    ### Audionachrichten

    Telegram unterscheidet Sprachnachrichten von Audiodateien.

    - Standard: Audiodateiverhalten
    - Tag `[[audio_as_voice]]` in der Agent-Antwort, um das Senden als Sprachnachricht zu erzwingen
    - Eingehende Transkripte von Sprachnachrichten werden im Agent-Kontext als maschinell erzeugter,
      nicht vertrauenswürdiger Text gerahmt; die Erwähnungserkennung verwendet weiterhin das rohe
      Transkript, sodass erwähnungsgesteuerte Sprachnachrichten weiter funktionieren.

    Beispiel für Nachrichtenaktion:

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

    Beispiel für Nachrichtenaktion:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    Videonotizen unterstützen keine Bildunterschriften; bereitgestellter Nachrichtentext wird separat gesendet.

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

    Wenn aktiviert, stellt OpenClaw Systemereignisse wie diese in die Warteschlange:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Konfiguration:

    - `channels.telegram.reactionNotifications`: `off | own | all` (Standard: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (Standard: `minimal`)

    Hinweise:

    - `own` bedeutet nur Benutzerreaktionen auf vom Bot gesendete Nachrichten (Best-Effort über Cache gesendeter Nachrichten).
    - Reaktionsereignisse beachten weiterhin Telegram-Zugriffskontrollen (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); nicht autorisierte Absender werden verworfen.
    - Telegram stellt in Reaktions-Updates keine Thread-IDs bereit.
      - Nicht-Forum-Gruppen routen zur Gruppenchat-Sitzung
      - Forum-Gruppen routen zur Sitzung des allgemeinen Themas der Gruppe (`:topic:1`), nicht zum genauen ursprünglichen Thema

    `allowed_updates` für Polling/Webhook enthält `message_reaction` automatisch.

  </Accordion>

  <Accordion title="Ack-Reaktionen">
    `ackReaction` sendet ein Bestätigungs-Emoji, während OpenClaw eine eingehende Nachricht verarbeitet.

    Auflösungsreihenfolge:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - Fallback auf Emoji der Agent-Identität (`agents.list[].identity.emoji`, sonst "👀")

    Hinweise:

    - Telegram erwartet Unicode-Emoji (zum Beispiel "👀").
    - Verwenden Sie `""`, um die Reaktion für einen Channel oder ein Konto zu deaktivieren.

  </Accordion>

  <Accordion title="Konfigurationsschreibvorgänge aus Telegram-Ereignissen und -Befehlen">
    Channel-Konfigurationsschreibvorgänge sind standardmäßig aktiviert (`configWrites !== false`).

    Durch Telegram ausgelöste Schreibvorgänge umfassen:

    - Gruppenmigrationsereignisse (`migrate_to_chat_id`) zum Aktualisieren von `channels.telegram.groups`
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

    Der lokale Listener bindet an `127.0.0.1:8787`. Für öffentlichen Eingang setzen Sie entweder einen Reverse Proxy vor den lokalen Port oder setzen Sie bewusst `webhookHost: "0.0.0.0"`.

    Der Webhook-Modus validiert Request Guards, das Telegram-Secret-Token und den JSON-Body, bevor `200` an Telegram zurückgegeben wird.
    OpenClaw verarbeitet das Update anschließend asynchron über dieselben Bot-Lanes pro Chat/pro Thema wie beim Long Polling, sodass langsame Agent-Durchläufe das Zustellungs-ACK von Telegram nicht blockieren.

  </Accordion>

  <Accordion title="Limits, Wiederholung und CLI-Ziele">
    - `channels.telegram.textChunkLimit` ist standardmäßig 4000.
    - `channels.telegram.chunkMode="newline"` bevorzugt Absatzgrenzen (Leerzeilen) vor der Längenaufteilung.
    - `channels.telegram.mediaMaxMb` (Standard 100) begrenzt die Größe eingehender und ausgehender Telegram-Medien.
    - `channels.telegram.mediaGroupFlushMs` (Standard 500) steuert, wie lange Telegram-Alben/Mediengruppen gepuffert werden, bevor OpenClaw sie als eine eingehende Nachricht ausliefert. Erhöhen Sie den Wert, wenn Albenteile verspätet eintreffen; verringern Sie ihn, um die Antwortlatenz für Alben zu reduzieren.
    - `channels.telegram.timeoutSeconds` überschreibt das Timeout des Telegram-API-Clients (wenn nicht gesetzt, gilt der grammY-Standard). Bot-Clients begrenzen konfigurierte Werte unterhalb des 60-Sekunden-Guards für ausgehende Text-/Typing-Requests, damit grammY die sichtbare Antwortzustellung nicht abbricht, bevor OpenClaws Transport-Guard und Fallback ausgeführt werden können. Long Polling verwendet weiterhin einen 45-Sekunden-Request-Guard für `getUpdates`, damit inaktive Polls nicht unbegrenzt aufgegeben werden.
    - `channels.telegram.pollingStallThresholdMs` ist standardmäßig `120000`; passen Sie den Wert nur bei falsch-positiven Polling-Stall-Neustarts zwischen `30000` und `600000` an.
    - Gruppen-Kontexthistorie verwendet `channels.telegram.historyLimit` oder `messages.groupChat.historyLimit` (Standard 50); `0` deaktiviert sie.
    - Ergänzender Kontext für Antworten/Zitate/Weiterleitungen wird derzeit unverändert weitergegeben.
    - Telegram-Allowlists steuern hauptsächlich, wer den Agent auslösen kann, nicht eine vollständige Schwelle zur Schwärzung ergänzender Kontexte.
    - DM-Historiensteuerung:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - Die Konfiguration `channels.telegram.retry` gilt für Telegram-Sendehelfer (CLI/Tools/Aktionen) bei wiederherstellbaren ausgehenden API-Fehlern. Die Zustellung der endgültigen eingehenden Antwort verwendet ebenfalls eine begrenzte Safe-Send-Wiederholung bei Telegram-Fehlern vor der Verbindung, wiederholt aber keine mehrdeutigen Netzwerkumschläge nach dem Senden, die sichtbare Nachrichten duplizieren könnten.

    CLI-Sendeziel kann eine numerische Chat-ID oder ein Benutzername sein:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Telegram-Polls verwenden `openclaw message poll` und unterstützen Forum-Themen:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Nur für Telegram verfügbare Poll-Flags:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` für Forum-Themen (oder verwenden Sie ein `:topic:`-Ziel)

    Telegram-Senden unterstützt außerdem:

    - `--presentation` mit `buttons`-Blöcken für Inline-Tastaturen, wenn `channels.telegram.capabilities.inlineButtons` dies erlaubt
    - `--pin` oder `--delivery '{"pin":true}'`, um angeheftete Zustellung anzufordern, wenn der Bot in diesem Chat anheften kann
    - `--force-document`, um ausgehende Bilder und GIFs als Dokumente statt als komprimierte Foto- oder Animated-Media-Uploads zu senden

    Aktionssteuerung:

    - `channels.telegram.actions.sendMessage=false` deaktiviert ausgehende Telegram-Nachrichten, einschließlich Polls
    - `channels.telegram.actions.poll=false` deaktiviert die Erstellung von Telegram-Polls, während reguläres Senden aktiviert bleibt

  </Accordion>

  <Accordion title="Exec-Freigaben in Telegram">
    Telegram unterstützt Exec-Freigaben in Freigabe-DMs und kann optional Prompts im ursprünglichen Chat oder Thema posten. Freigebende Personen müssen numerische Telegram-Benutzer-IDs sein.

    Konfigurationspfad:

    - `channels.telegram.execApprovals.enabled` (wird automatisch aktiviert, wenn mindestens eine freigebende Person auflösbar ist)
    - `channels.telegram.execApprovals.approvers` (fällt auf numerische Besitzer-IDs aus `commands.ownerAllowFrom` zurück)
    - `channels.telegram.execApprovals.target`: `dm` (Standard) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` und `defaultTo` steuern, wer mit dem Bot sprechen kann und wohin er normale Antworten sendet. Sie machen niemanden zur exec-freigebenden Person. Die erste genehmigte DM-Kopplung initialisiert `commands.ownerAllowFrom`, wenn noch kein Befehlsbesitzer vorhanden ist, sodass die Einrichtung mit einem Besitzer weiterhin funktioniert, ohne IDs unter `execApprovals.approvers` zu duplizieren.

    Die Channel-Zustellung zeigt den Befehlstext im Chat; aktivieren Sie `channel` oder `both` nur in vertrauenswürdigen Gruppen/Themen. Wenn der Prompt in einem Forum-Thema landet, behält OpenClaw das Thema für den Freigabe-Prompt und die Folgeaktion bei. Exec-Freigaben laufen standardmäßig nach 30 Minuten ab.

    Inline-Freigabeschaltflächen erfordern außerdem, dass `channels.telegram.capabilities.inlineButtons` die Zieloberfläche (`dm`, `group` oder `all`) erlaubt. Freigabe-IDs mit Präfix `plugin:` werden über Plugin-Freigaben aufgelöst; andere werden zuerst über Exec-Freigaben aufgelöst.

    Siehe [Exec-Freigaben](/de/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Steuerung von Fehlerantworten

Wenn der Agent auf einen Zustellungs- oder Provider-Fehler trifft, kann Telegram entweder mit dem Fehlertext antworten oder ihn unterdrücken. Zwei Konfigurationsschlüssel steuern dieses Verhalten:

| Schlüssel                           | Werte             | Standard | Beschreibung                                                                                         |
| ----------------------------------- | ----------------- | -------- | ---------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`  | `reply` sendet eine freundliche Fehlermeldung an den Chat. `silent` unterdrückt Fehlerantworten vollständig. |
| `channels.telegram.errorCooldownMs` | Zahl (ms)         | `60000`  | Mindestzeit zwischen Fehlerantworten an denselben Chat. Verhindert Fehler-Spam während Ausfällen.    |

Überschreibungen pro Konto, pro Gruppe und pro Thema werden unterstützt (dieselbe Vererbung wie bei anderen Telegram-Konfigurationsschlüsseln).

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

    - Wenn `requireMention=false`, muss der Telegram-Privatsphärenmodus vollständige Sichtbarkeit erlauben.
      - BotFather: `/setprivacy` -> Deaktivieren
      - entfernen Sie den Bot anschließend aus der Gruppe und fügen Sie ihn erneut hinzu
    - `openclaw channels status` warnt, wenn die Konfiguration nicht erwähnte Gruppennachrichten erwartet.
    - `openclaw channels status --probe` kann explizite numerische Gruppen-IDs prüfen; Wildcard `"*"` kann nicht auf Mitgliedschaft geprüft werden.
    - Schneller Sitzungstest: `/activation always`.

  </Accordion>

  <Accordion title="Bot sieht überhaupt keine Gruppennachrichten">

    - wenn `channels.telegram.groups` vorhanden ist, muss die Gruppe aufgeführt sein (oder `"*"` enthalten)
    - Bot-Mitgliedschaft in der Gruppe prüfen
    - Logs prüfen: `openclaw logs --follow` für Gründe für das Überspringen

  </Accordion>

  <Accordion title="Befehle funktionieren teilweise oder gar nicht">

    - autorisieren Sie Ihre Absenderidentität (Pairing und/oder numerisches `allowFrom`)
    - Befehlsautorisierung gilt weiterhin, auch wenn die Gruppenrichtlinie `open` ist
    - `setMyCommands failed` mit `BOT_COMMANDS_TOO_MUCH` bedeutet, dass das native Menü zu viele Einträge hat; reduzieren Sie Plugin-/Skill-/benutzerdefinierte Befehle oder deaktivieren Sie native Menüs
    - `deleteMyCommands`- / `setMyCommands`-Startaufrufe und `sendChatAction`-Tippaufrufe sind begrenzt und werden bei einem Anfrage-Timeout einmal über Telegrams Transport-Fallback erneut versucht. Anhaltende Netzwerk-/Fetch-Fehler weisen üblicherweise auf DNS-/HTTPS-Erreichbarkeitsprobleme zu `api.telegram.org` hin

  </Accordion>

  <Accordion title="Start meldet nicht autorisiertes Token">

    - `getMe returned 401` ist ein Telegram-Authentifizierungsfehler für das konfigurierte Bot-Token.
    - Kopieren oder generieren Sie das Bot-Token in BotFather erneut und aktualisieren Sie dann `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` oder `TELEGRAM_BOT_TOKEN` für das Standardkonto.
    - `deleteWebhook 401 Unauthorized` während des Starts ist ebenfalls ein Authentifizierungsfehler; es als „kein Webhook vorhanden“ zu behandeln, würde denselben Fehler durch ein ungültiges Token nur auf spätere API-Aufrufe verschieben.

  </Accordion>

  <Accordion title="Polling- oder Netzwerkinstabilität">

    - Node 22+ mit benutzerdefiniertem Fetch/Proxy kann sofortiges Abbruchverhalten auslösen, wenn AbortSignal-Typen nicht übereinstimmen.
    - Einige Hosts lösen `api.telegram.org` zuerst nach IPv6 auf; fehlerhafter IPv6-Egress kann zeitweilige Telegram-API-Fehler verursachen.
    - Wenn Logs `TypeError: fetch failed` oder `Network request for 'getUpdates' failed!` enthalten, versucht OpenClaw diese jetzt als wiederherstellbare Netzwerkfehler erneut.
    - Beim Polling-Start verwendet OpenClaw die erfolgreiche `getMe`-Startprüfung für grammY erneut, sodass der Runner vor dem ersten `getUpdates` kein zweites `getMe` benötigt.
    - Wenn `deleteWebhook` beim Polling-Start mit einem vorübergehenden Netzwerkfehler fehlschlägt, fährt OpenClaw mit Long Polling fort, statt einen weiteren Control-Plane-Aufruf vor dem Polling auszuführen. Ein weiterhin aktiver Webhook zeigt sich als `getUpdates`-Konflikt; OpenClaw baut dann den Telegram-Transport neu auf und versucht die Webhook-Bereinigung erneut.
    - Wenn Telegram-Sockets in einem kurzen festen Takt wiederverwendet werden, prüfen Sie auf einen niedrigen Wert für `channels.telegram.timeoutSeconds`; Bot-Clients begrenzen konfigurierte Werte unterhalb der Guards für ausgehende Anfragen und `getUpdates`, aber ältere Releases konnten jeden Poll oder jede Antwort abbrechen, wenn dieser Wert unter diesen Guards lag.
    - Wenn Logs `Polling stall detected` enthalten, startet OpenClaw das Polling neu und baut den Telegram-Transport nach standardmäßig 120 Sekunden ohne abgeschlossene Long-Poll-Liveness neu auf.
    - `openclaw channels status --probe` und `openclaw doctor` warnen, wenn ein laufendes Polling-Konto nach der Start-Kulanzzeit `getUpdates` nicht abgeschlossen hat, wenn ein laufendes Webhook-Konto nach der Start-Kulanzzeit `setWebhook` nicht abgeschlossen hat oder wenn die letzte erfolgreiche Polling-Transportaktivität veraltet ist.
    - Erhöhen Sie `channels.telegram.pollingStallThresholdMs` nur, wenn lang laufende `getUpdates`-Aufrufe fehlerfrei sind, Ihr Host aber weiterhin fälschliche Polling-Stall-Neustarts meldet. Anhaltende Stalls weisen üblicherweise auf Proxy-, DNS-, IPv6- oder TLS-Egress-Probleme zwischen dem Host und `api.telegram.org` hin.
    - Telegram berücksichtigt außerdem Prozess-Proxy-Umgebungsvariablen für den Bot-API-Transport, einschließlich `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` und deren kleingeschriebene Varianten. `NO_PROXY` / `no_proxy` kann `api.telegram.org` weiterhin umgehen.
    - Wenn der von OpenClaw verwaltete Proxy über `OPENCLAW_PROXY_URL` für eine Service-Umgebung konfiguriert ist und keine Standard-Proxy-Umgebungsvariable vorhanden ist, verwendet Telegram diese URL ebenfalls für den Bot-API-Transport.
    - Leiten Sie auf VPS-Hosts mit instabilem direktem Egress/TLS Telegram-API-Aufrufe über `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ verwendet standardmäßig `autoSelectFamily=true` (außer WSL2). Die Reihenfolge der Telegram-DNS-Ergebnisse berücksichtigt zuerst `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, dann `channels.telegram.network.dnsResultOrder`, dann die Prozessvorgabe wie `NODE_OPTIONS=--dns-result-order=ipv4first`; wenn nichts davon zutrifft, fällt Node 22+ auf `ipv4first` zurück.
    - Wenn Ihr Host WSL2 ist oder ausdrücklich mit reinem IPv4-Verhalten besser funktioniert, erzwingen Sie die Family-Auswahl:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Antworten aus dem RFC-2544-Benchmark-Bereich (`198.18.0.0/15`) sind für Telegram-Mediendownloads standardmäßig bereits erlaubt. Wenn ein vertrauenswürdiger Fake-IP- oder transparenter Proxy `api.telegram.org` während Mediendownloads auf eine andere private/interne/Special-Use-Adresse umschreibt, können Sie den nur für Telegram geltenden Bypass aktivieren:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Dieselbe Opt-in-Option ist pro Konto unter
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork` verfügbar.
    - Wenn Ihr Proxy Telegram-Medienhosts in `198.18.x.x` auflöst, lassen Sie das
      gefährliche Flag zunächst deaktiviert. Telegram-Medien erlauben den RFC-2544-
      Benchmark-Bereich bereits standardmäßig.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` schwächt Telegram-
      Medien-SSRF-Schutzmechanismen. Verwenden Sie es nur für vertrauenswürdige,
      operatorgesteuerte Proxy-Umgebungen wie Clash-, Mihomo- oder Surge-Fake-IP-
      Routing, wenn diese private oder Special-Use-Antworten außerhalb des RFC-2544-
      Benchmark-Bereichs erzeugen. Lassen Sie es für normalen öffentlichen
      Telegram-Zugriff über das Internet deaktiviert.
    </Warning>

    - Umgebungs-Overrides (temporär):
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - DNS-Antworten prüfen:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

Weitere Hilfe: [Kanal-Fehlerbehebung](/de/channels/troubleshooting).

## Konfigurationsreferenz

Primäre Referenz: [Konfigurationsreferenz - Telegram](/de/gateway/config-channels#telegram).

<Accordion title="Aussagekräftige Telegram-Felder">

- Start/Authentifizierung: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` muss auf eine reguläre Datei verweisen; Symlinks werden abgelehnt)
- Zugriffskontrolle: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, Top-Level-`bindings[]` (`type: "acp"`)
- Ausführungsgenehmigungen: `execApprovals`, `accounts.*.execApprovals`
- Befehl/Menü: `commands.native`, `commands.nativeSkills`, `customCommands`
- Threading/Antworten: `replyToMode`, `dm.threadReplies`, `direct.*.threadReplies`
- Streaming: `streaming` (Vorschau), `streaming.preview.toolProgress`, `blockStreaming`
- Formatierung/Zustellung: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- Medien/Netzwerk: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- Benutzerdefinierte API-Root: `apiRoot` (nur Bot-API-Root; `/bot<TOKEN>` nicht einschließen)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- Aktionen/Fähigkeiten: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- Reaktionen: `reactionNotifications`, `reactionLevel`
- Fehler: `errorPolicy`, `errorCooldownMs`
- Schreibvorgänge/Verlauf: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Priorität bei mehreren Konten: Wenn zwei oder mehr Konto-IDs konfiguriert sind, legen Sie `channels.telegram.defaultAccount` fest (oder fügen Sie `channels.telegram.accounts.default` hinzu), um das Standard-Routing explizit zu machen. Andernfalls fällt OpenClaw auf die erste normalisierte Konto-ID zurück und `openclaw doctor` warnt. Benannte Konten erben `channels.telegram.allowFrom` / `groupAllowFrom`, aber keine `accounts.default.*`-Werte.
</Note>

## Verwandt

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/de/channels/pairing">
    Koppeln Sie einen Telegram-Benutzer mit dem Gateway.
  </Card>
  <Card title="Gruppen" icon="users" href="/de/channels/groups">
    Allowlist-Verhalten für Gruppen und Themen.
  </Card>
  <Card title="Kanal-Routing" icon="route" href="/de/channels/channel-routing">
    Eingehende Nachrichten an Agenten weiterleiten.
  </Card>
  <Card title="Sicherheit" icon="shield" href="/de/gateway/security">
    Bedrohungsmodell und Härtung.
  </Card>
  <Card title="Multi-Agent-Routing" icon="sitemap" href="/de/concepts/multi-agent">
    Gruppen und Themen Agenten zuordnen.
  </Card>
  <Card title="Fehlerbehebung" icon="wrench" href="/de/channels/troubleshooting">
    Kanalübergreifende Diagnose.
  </Card>
</CardGroup>
