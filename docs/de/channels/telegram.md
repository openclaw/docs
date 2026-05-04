---
read_when:
    - Arbeiten an Telegram-Funktionen oder Webhooks
summary: Status, Funktionen und Konfiguration der Telegram-Bot-Unterstützung
title: Telegram
x-i18n:
    generated_at: "2026-05-04T09:36:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5711d53cf908a14024bc5a94f7d590bb4bcb6963a1d78049d7782871f4eae932
    source_path: channels/telegram.md
    workflow: 16
---

Produktionsreif für Bot-Direktnachrichten und Gruppen über grammY. Long Polling ist der Standardmodus; Webhook-Modus ist optional.

<CardGroup cols={3}>
  <Card title="Kopplung" icon="link" href="/de/channels/pairing">
    Die Standardrichtlinie für Telegram-Direktnachrichten ist Kopplung.
  </Card>
  <Card title="Kanal-Fehlerbehebung" icon="wrench" href="/de/channels/troubleshooting">
    Kanalübergreifende Diagnosen und Reparatur-Playbooks.
  </Card>
  <Card title="Gateway-Konfiguration" icon="settings" href="/de/gateway/configuration">
    Vollständige Muster und Beispiele für die Kanalkonfiguration.
  </Card>
</CardGroup>

## Schnellkonfiguration

<Steps>
  <Step title="Bot-Token in BotFather erstellen">
    Öffnen Sie Telegram und chatten Sie mit **@BotFather** (bestätigen Sie, dass der Handle genau `@BotFather` ist).

    Führen Sie `/newbot` aus, folgen Sie den Eingabeaufforderungen und speichern Sie das Token.

  </Step>

  <Step title="Token und Richtlinie für Direktnachrichten konfigurieren">

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
    Telegram verwendet **nicht** `openclaw channels login telegram`; konfigurieren Sie das Token in der Konfiguration/Env und starten Sie dann den Gateway.

  </Step>

  <Step title="Gateway starten und erste Direktnachricht genehmigen">

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
Die Reihenfolge der Token-Auflösung ist kontobewusst. In der Praxis haben Konfigurationswerte Vorrang vor dem Env-Fallback, und `TELEGRAM_BOT_TOKEN` gilt nur für das Standardkonto.
</Note>

## Telegram-seitige Einstellungen

<AccordionGroup>
  <Accordion title="Privatsphäre-Modus und Gruppensichtbarkeit">
    Telegram-Bots verwenden standardmäßig den **Privatsphäre-Modus**, der begrenzt, welche Gruppennachrichten sie empfangen.

    Wenn der Bot alle Gruppennachrichten sehen muss, können Sie entweder:

    - den Privatsphäre-Modus über `/setprivacy` deaktivieren oder
    - den Bot zum Gruppenadmin machen.

    Wenn Sie den Privatsphäre-Modus umschalten, entfernen Sie den Bot in jeder Gruppe und fügen ihn erneut hinzu, damit Telegram die Änderung anwendet.

  </Accordion>

  <Accordion title="Gruppenberechtigungen">
    Der Adminstatus wird in den Telegram-Gruppeneinstellungen gesteuert.

    Admin-Bots empfangen alle Gruppennachrichten, was für dauerhaft aktives Gruppenverhalten nützlich ist.

  </Accordion>

  <Accordion title="Hilfreiche BotFather-Umschalter">

    - `/setjoingroups`, um Gruppenhinzufügungen zu erlauben/zu verweigern
    - `/setprivacy` für das Verhalten der Gruppensichtbarkeit

  </Accordion>
</AccordionGroup>

## Zugriffskontrolle und Aktivierung

<Tabs>
  <Tab title="Richtlinie für Direktnachrichten">
    `channels.telegram.dmPolicy` steuert den Zugriff auf Direktnachrichten:

    - `pairing` (Standard)
    - `allowlist` (erfordert mindestens eine Absender-ID in `allowFrom`)
    - `open` (erfordert, dass `allowFrom` `"*"` enthält)
    - `disabled`

    `dmPolicy: "open"` mit `allowFrom: ["*"]` erlaubt jedem Telegram-Konto, das den Bot-Benutzernamen findet oder errät, dem Bot Befehle zu geben. Verwenden Sie dies nur für bewusst öffentliche Bots mit stark eingeschränkten Tools; Bots mit einem Besitzer sollten `allowlist` mit numerischen Benutzer-IDs verwenden.

    `channels.telegram.allowFrom` akzeptiert numerische Telegram-Benutzer-IDs. Präfixe `telegram:` / `tg:` werden akzeptiert und normalisiert.
    In Konfigurationen mit mehreren Konten wird ein restriktives `channels.telegram.allowFrom` auf oberster Ebene als Sicherheitsgrenze behandelt: Kontospezifische Einträge `allowFrom: ["*"]` machen dieses Konto nicht öffentlich, es sei denn, die effektive Allowlist des Kontos enthält nach dem Zusammenführen weiterhin einen expliziten Platzhalter.
    `dmPolicy: "allowlist"` mit leerem `allowFrom` blockiert alle Direktnachrichten und wird von der Konfigurationsvalidierung abgelehnt.
    Die Einrichtung fragt nur nach numerischen Benutzer-IDs.
    Wenn Sie aktualisiert haben und Ihre Konfiguration `@username`-Allowlist-Einträge enthält, führen Sie `openclaw doctor --fix` aus, um sie aufzulösen (Best Effort; erfordert ein Telegram-Bot-Token).
    Wenn Sie sich zuvor auf Allowlist-Dateien im Kopplungsspeicher verlassen haben, kann `openclaw doctor --fix` Einträge in Allowlist-Abläufen in `channels.telegram.allowFrom` wiederherstellen (zum Beispiel, wenn `dmPolicy: "allowlist"` noch keine expliziten IDs hat).

    Für Bots mit einem Besitzer bevorzugen Sie `dmPolicy: "allowlist"` mit expliziten numerischen `allowFrom`-IDs, damit die Zugriffsrichtlinie dauerhaft in der Konfiguration bleibt (statt von früheren Kopplungsgenehmigungen abzuhängen).

    Häufige Verwechslung: Die Genehmigung der Direktnachrichten-Kopplung bedeutet nicht „dieser Absender ist überall autorisiert“.
    Die Kopplung gewährt Zugriff auf Direktnachrichten. Wenn noch kein Befehlsbesitzer existiert, setzt die erste genehmigte Kopplung außerdem `commands.ownerAllowFrom`, sodass Besitzerbefehle und Exec-Genehmigungen ein explizites Bedienerkonto haben.
    Die Autorisierung von Gruppenabsendern kommt weiterhin aus expliziten Konfigurations-Allowlists.
    Wenn Sie möchten, dass „ich einmal autorisiert bin und sowohl Direktnachrichten als auch Gruppenbefehle funktionieren“, legen Sie Ihre numerische Telegram-Benutzer-ID in `channels.telegram.allowFrom` ab; stellen Sie für Besitzerbefehle sicher, dass `commands.ownerAllowFrom` `telegram:<your user id>` enthält.

    ### Ihre Telegram-Benutzer-ID finden

    Sicherer (kein Drittanbieter-Bot):

    1. Senden Sie Ihrem Bot eine Direktnachricht.
    2. Führen Sie `openclaw logs --follow` aus.
    3. Lesen Sie `from.id`.

    Offizielle Bot-API-Methode:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Drittanbieter-Methode (weniger privat): `@userinfobot` oder `@getidsbot`.

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
    `groupAllowFrom`-Einträge sollten numerische Telegram-Benutzer-IDs sein (`telegram:`- / `tg:`-Präfixe werden normalisiert).
    Legen Sie keine Telegram-Gruppen- oder Supergruppen-Chat-IDs in `groupAllowFrom` ab. Negative Chat-IDs gehören unter `channels.telegram.groups`.
    Nicht numerische Einträge werden für die Absenderautorisierung ignoriert.
    Sicherheitsgrenze (`2026.2.25+`): Die Gruppenabsender-Authentifizierung erbt **keine** Genehmigungen aus dem Direktnachrichten-Kopplungsspeicher.
    Kopplung bleibt nur für Direktnachrichten. Legen Sie für Gruppen `groupAllowFrom` oder gruppen-/themenspezifisches `allowFrom` fest.
    Wenn `groupAllowFrom` nicht gesetzt ist, fällt Telegram auf die Konfiguration `allowFrom` zurück, nicht auf den Kopplungsspeicher.
    Praktisches Muster für Bots mit einem Besitzer: Legen Sie Ihre Benutzer-ID in `channels.telegram.allowFrom` fest, lassen Sie `groupAllowFrom` unset und erlauben Sie die Zielgruppen unter `channels.telegram.groups`.
    Laufzeithinweis: Wenn `channels.telegram` vollständig fehlt, verwendet die Laufzeit standardmäßig ein ausfallsicher geschlossenes `groupPolicy="allowlist"`, sofern `channels.defaults.groupPolicy` nicht explizit gesetzt ist.

    Beispiel: Beliebige Mitglieder in einer bestimmten Gruppe erlauben:

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
      Häufiger Fehler: `groupAllowFrom` ist keine Allowlist für Telegram-Gruppen.

      - Legen Sie negative Telegram-Gruppen- oder Supergruppen-Chat-IDs wie `-1001234567890` unter `channels.telegram.groups` ab.
      - Legen Sie Telegram-Benutzer-IDs wie `8734062810` unter `groupAllowFrom` ab, wenn Sie einschränken möchten, welche Personen innerhalb einer erlaubten Gruppe den Bot auslösen können.
      - Verwenden Sie `groupAllowFrom: ["*"]` nur, wenn jedes Mitglied einer erlaubten Gruppe mit dem Bot sprechen können soll.

    </Warning>

  </Tab>

  <Tab title="Erwähnungsverhalten">
    Gruppenantworten erfordern standardmäßig eine Erwähnung.

    Die Erwähnung kann stammen von:

    - nativer `@botusername`-Erwähnung oder
    - Erwähnungsmustern in:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Befehlsumschalter auf Sitzungsebene:

    - `/activation always`
    - `/activation mention`

    Diese aktualisieren nur den Sitzungszustand. Verwenden Sie die Konfiguration für Persistenz.

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

    - eine Gruppennachricht an `@userinfobot` / `@getidsbot` weiterleiten
    - oder `chat.id` aus `openclaw logs --follow` lesen
    - oder Bot-API `getUpdates` inspizieren

  </Tab>
</Tabs>

## Laufzeitverhalten

- Telegram gehört dem Gateway-Prozess.
- Das Routing ist deterministisch: Eingehende Telegram-Nachrichten werden an Telegram beantwortet (das Modell wählt keine Kanäle aus).
- Eingehende Nachrichten werden in die gemeinsame Kanalhülle mit Antwortmetadaten und Medienplatzhaltern normalisiert.
- Gruppensitzungen werden nach Gruppen-ID isoliert. Forenthemen hängen `:topic:<threadId>` an, um Themen isoliert zu halten.
- Direktnachrichten können `message_thread_id` enthalten; OpenClaw erhält die Thread-ID für Antworten, hält Direktnachrichten standardmäßig aber in der flachen Sitzung. Konfigurieren Sie `channels.telegram.dm.threadReplies: "inbound"`, `channels.telegram.direct.<chatId>.threadReplies: "inbound"`, `requireTopic: true` oder eine passende Themenkonfiguration, wenn Sie bewusst Themensitzungsisolierung für Direktnachrichten wünschen.
- Long Polling verwendet den grammY-Runner mit Sequenzierung pro Chat/pro Thread. Die gesamte Runner-Sink-Parallelität verwendet `agents.defaults.maxConcurrent`.
- Long Polling wird innerhalb jedes Gateway-Prozesses geschützt, sodass jeweils nur ein aktiver Poller ein Bot-Token verwenden kann. Wenn Sie weiterhin `getUpdates`-409-Konflikte sehen, verwendet wahrscheinlich ein anderer OpenClaw-Gateway, ein Skript oder ein externer Poller dasselbe Token.
- Neustarts durch den Long-Polling-Watchdog werden standardmäßig nach 120 Sekunden ohne abgeschlossene `getUpdates`-Lebendigkeit ausgelöst. Erhöhen Sie `channels.telegram.pollingStallThresholdMs` nur, wenn Ihre Bereitstellung während langlaufender Arbeit weiterhin fälschliche Polling-Stall-Neustarts sieht. Der Wert ist in Millisekunden und von `30000` bis `600000` erlaubt; Überschreibungen pro Konto werden unterstützt.
- Die Telegram Bot API unterstützt keine Lesebestätigungen (`sendReadReceipts` gilt nicht).

## Funktionsreferenz

<AccordionGroup>
  <Accordion title="Live-Stream-Vorschau (Nachrichtenbearbeitungen)">
    OpenClaw kann Teilantworten in Echtzeit streamen:

    - direkte Chats: Vorschaunachricht + `editMessageText`
    - Gruppen/Themen: Vorschaunachricht + `editMessageText`

    Anforderung:

    - `channels.telegram.streaming` ist `off | partial | block | progress` (Standard: `partial`)
    - `progress` hält einen bearbeitbaren Statusentwurf vor und aktualisiert ihn bis zur endgültigen Zustellung mit Tool-Fortschritt
    - `streaming.preview.toolProgress` steuert, ob Tool-/Fortschrittsaktualisierungen dieselbe bearbeitete Vorschaunachricht wiederverwenden (Standard: `true`, wenn Vorschau-Streaming aktiv ist)
    - `streaming.preview.commandText` steuert Befehls-/Exec-Details in diesen Tool-Fortschrittszeilen: `raw` (Standard, bewahrt veröffentlichtes Verhalten) oder `status` (nur Tool-Label)
    - ältere Werte für `channels.telegram.streamMode` und boolesche `streaming`-Werte werden erkannt; führen Sie `openclaw doctor --fix` aus, um sie nach `channels.telegram.streaming.mode` zu migrieren

    Tool-Fortschrittsvorschau-Updates sind die kurzen Statuszeilen, die angezeigt werden, während Tools laufen, zum Beispiel Befehlsausführung, Dateilesen, Planungsupdates oder Patch-Zusammenfassungen. Telegram hält diese standardmäßig aktiviert, um dem veröffentlichten OpenClaw-Verhalten ab `v2026.4.22` und später zu entsprechen. Um die bearbeitete Vorschau für Antworttext beizubehalten, aber Tool-Fortschrittszeilen auszublenden, legen Sie fest:

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

    Um Tool-Fortschritt sichtbar zu lassen, aber Befehls-/Exec-Text auszublenden, legen Sie fest:

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

    Verwenden Sie `streaming.mode: "off"` nur, wenn Sie ausschließlich die finale Zustellung wünschen: Telegram-Vorschauänderungen sind deaktiviert und allgemeines Tool-/Fortschrittsrauschen wird unterdrückt, statt als eigenständige Statusmeldungen gesendet zu werden. Genehmigungsaufforderungen, Medien-Payloads und Fehler laufen weiterhin über die normale finale Zustellung. Verwenden Sie `streaming.preview.toolProgress: false`, wenn Sie nur Antwortvorschauänderungen beibehalten möchten, während die Tool-Fortschrittsstatuszeilen ausgeblendet werden.

    <Note>
      Ausgewählte Telegram-Zitatantworten sind die Ausnahme. Wenn `replyToMode` `"first"`, `"all"` oder `"batched"` ist und die eingehende Nachricht ausgewählten Zitattext enthält, sendet OpenClaw die finale Antwort über Telegrams nativen Zitatantwortpfad, statt die Antwortvorschau zu bearbeiten. Deshalb kann `streaming.preview.toolProgress` die kurzen Statuszeilen für diesen Durchlauf nicht anzeigen. Antworten auf die aktuelle Nachricht ohne ausgewählten Zitattext behalten weiterhin Vorschau-Streaming. Setzen Sie `replyToMode: "off"`, wenn Tool-Fortschrittssichtbarkeit wichtiger ist als native Zitatantworten, oder setzen Sie `streaming.preview.toolProgress: false`, um den Zielkonflikt anzuerkennen.
    </Note>

    Für reine Textantworten:

    - kurze DM-/Gruppen-/Themenvorschauen: OpenClaw behält dieselbe Vorschaunachricht bei und führt eine finale Bearbeitung an Ort und Stelle aus, außer nachdem die Vorschau erschienen ist, wurde eine sichtbare Nicht-Vorschau-Nachricht gesendet
    - Vorschauen, gefolgt von sichtbarer Nicht-Vorschau-Ausgabe: OpenClaw sendet die vollständige Antwort als neue finale Nachricht und räumt die ältere Vorschau auf, sodass die finale Antwort nach der Zwischenausgabe erscheint
    - Vorschauen, die älter als etwa eine Minute sind: OpenClaw sendet die vollständige Antwort als neue finale Nachricht und räumt danach die Vorschau auf, sodass Telegrams sichtbarer Zeitstempel die Abschlusszeit statt der Erstellungszeit der Vorschau widerspiegelt

    Bei komplexen Antworten (zum Beispiel Medien-Payloads) fällt OpenClaw auf die normale finale Zustellung zurück und räumt anschließend die Vorschaunachricht auf.

    Vorschau-Streaming ist getrennt von Block-Streaming. Wenn Block-Streaming für Telegram ausdrücklich aktiviert ist, überspringt OpenClaw den Vorschau-Stream, um doppeltes Streaming zu vermeiden.

    Nur-Telegram-Reasoning-Stream:

    - `/reasoning stream` sendet Reasoning während der Generierung an die Live-Vorschau
    - die Reasoning-Vorschau wird nach der finalen Zustellung gelöscht; verwenden Sie `/reasoning on`, wenn Reasoning sichtbar bleiben soll
    - die finale Antwort wird ohne Reasoning-Text gesendet

  </Accordion>

  <Accordion title="Formatierung und HTML-Fallback">
    Ausgehender Text verwendet Telegram `parse_mode: "HTML"`.

    - Markdown-ähnlicher Text wird zu Telegram-sicherem HTML gerendert.
    - Rohes Modell-HTML wird escaped, um Telegram-Parsingfehler zu reduzieren.
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

    - Namen werden normalisiert (führendes `/` entfernen, Kleinschreibung)
    - gültiges Muster: `a-z`, `0-9`, `_`, Länge `1..32`
    - benutzerdefinierte Befehle können native Befehle nicht überschreiben
    - Konflikte/Duplikate werden übersprungen und protokolliert

    Hinweise:

    - benutzerdefinierte Befehle sind nur Menüeinträge; sie implementieren kein Verhalten automatisch
    - Plugin-/Skill-Befehle können weiterhin funktionieren, wenn sie eingegeben werden, auch wenn sie nicht im Telegram-Menü angezeigt werden

    Wenn native Befehle deaktiviert sind, werden integrierte Befehle entfernt. Benutzerdefinierte/Plugin-Befehle können sich weiterhin registrieren, wenn sie konfiguriert sind.

    Häufige Einrichtungsfehler:

    - `setMyCommands failed` mit `BOT_COMMANDS_TOO_MUCH` bedeutet, dass das Telegram-Menü nach dem Kürzen weiterhin übergelaufen ist; reduzieren Sie Plugin-/Skill-/benutzerdefinierte Befehle oder deaktivieren Sie `channels.telegram.commands.native`.
    - Wenn `deleteWebhook`, `deleteMyCommands` oder `setMyCommands` mit `404: Not Found` fehlschlägt, während direkte Bot-API-curl-Befehle funktionieren, kann das bedeuten, dass `channels.telegram.apiRoot` auf den vollständigen `/bot<TOKEN>`-Endpunkt gesetzt wurde. `apiRoot` darf nur der Bot-API-Root sein, und `openclaw doctor --fix` entfernt ein versehentlich angehängtes `/bot<TOKEN>`.
    - `getMe returned 401` bedeutet, dass Telegram das konfigurierte Bot-Token abgelehnt hat. Aktualisieren Sie `botToken`, `tokenFile` oder `TELEGRAM_BOT_TOKEN` mit dem aktuellen BotFather-Token; OpenClaw stoppt vor dem Polling, sodass dies nicht als Webhook-Bereinigungsfehler gemeldet wird.
    - `setMyCommands failed` mit Netzwerk-/Fetch-Fehlern bedeutet normalerweise, dass ausgehendes DNS/HTTPS zu `api.telegram.org` blockiert ist.

    ### Gerätekopplungsbefehle (`device-pair`-Plugin)

    Wenn das `device-pair`-Plugin installiert ist:

    1. `/pair` generiert Einrichtungscode
    2. Code in iOS-App einfügen
    3. `/pair pending` listet ausstehende Anfragen auf (einschließlich Rolle/Scopes)
    4. Anfrage genehmigen:
       - `/pair approve <requestId>` für ausdrückliche Genehmigung
       - `/pair approve`, wenn es nur eine ausstehende Anfrage gibt
       - `/pair approve latest` für die neueste

    Der Einrichtungscode enthält ein kurzlebiges Bootstrap-Token. Die integrierte Bootstrap-Übergabe behält das primäre Node-Token bei `scopes: []`; jedes übergebene Operator-Token bleibt auf `operator.approvals`, `operator.read`, `operator.talk.secrets` und `operator.write` begrenzt. Bootstrap-Scope-Prüfungen sind rollenpräfixiert, sodass diese Operator-Allowlist nur Operator-Anfragen erfüllt; Nicht-Operator-Rollen benötigen weiterhin Scopes unter ihrem eigenen Rollenpräfix.

    Wenn ein Gerät es mit geänderten Authentifizierungsdetails erneut versucht (zum Beispiel Rolle/Scopes/öffentlicher Schlüssel), wird die vorherige ausstehende Anfrage ersetzt und die neue Anfrage verwendet eine andere `requestId`. Führen Sie `/pair pending` erneut aus, bevor Sie genehmigen.

    Weitere Details: [Kopplung](/de/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="Inline-Buttons">
    Inline-Keyboard-Scope konfigurieren:

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

    Veraltetes `capabilities: ["inlineButtons"]` wird auf `inlineButtons: "all"` abgebildet.

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

    Callback-Klicks werden als Text an den Agenten übergeben:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Telegram-Nachrichtenaktionen für Agenten und Automatisierung">
    Telegram-Tool-Aktionen umfassen:

    - `sendMessage` (`to`, `content`, optional `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, optional `iconColor`, `iconCustomEmojiId`)

    Kanal-Nachrichtenaktionen stellen ergonomische Aliase bereit (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Gate-Steuerungen:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (Standard: deaktiviert)

    Hinweis: `edit` und `topic-create` sind derzeit standardmäßig aktiviert und haben keine separaten `channels.telegram.actions.*`-Schalter.
    Runtime-Sendungen verwenden den aktiven Konfigurations-/Secrets-Snapshot (Start/Reload), sodass Aktionspfade keine Ad-hoc-Neuauflösung von SecretRef pro Sendung durchführen.

    Semantik zum Entfernen von Reaktionen: [/tools/reactions](/de/tools/reactions)

  </Accordion>

  <Accordion title="Tags für Antwort-Threading">
    Telegram unterstützt explizite Tags für Antwort-Threading in generierter Ausgabe:

    - `[[reply_to_current]]` antwortet auf die auslösende Nachricht
    - `[[reply_to:<id>]]` antwortet auf eine bestimmte Telegram-Nachrichten-ID

    `channels.telegram.replyToMode` steuert die Verarbeitung:

    - `off` (Standard)
    - `first`
    - `all`

    Wenn Antwort-Threading aktiviert ist und der ursprüngliche Telegram-Text oder die Beschriftung verfügbar ist, fügt OpenClaw automatisch einen nativen Telegram-Zitatauszug ein. Telegram begrenzt nativen Zitattext auf 1024 UTF-16-Codeeinheiten, sodass längere Nachrichten vom Anfang an zitiert werden und auf eine einfache Antwort zurückfallen, wenn Telegram das Zitat ablehnt.

    Hinweis: `off` deaktiviert implizites Antwort-Threading. Explizite `[[reply_to_*]]`-Tags werden weiterhin beachtet.

  </Accordion>

  <Accordion title="Forenthemen und Thread-Verhalten">
    Forum-Supergruppen:

    - Themen-Sitzungsschlüssel hängen `:topic:<threadId>` an
    - Antworten und Tippanzeigen zielen auf den Themen-Thread
    - Themen-Konfigurationspfad:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Sonderfall allgemeines Thema (`threadId=1`):

    - Nachrichtensendungen lassen `message_thread_id` weg (Telegram lehnt `sendMessage(...thread_id=1)` ab)
    - Tippaktionen enthalten weiterhin `message_thread_id`

    Themenvererbung: Themeneinträge erben Gruppeneinstellungen, sofern sie nicht überschrieben werden (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` ist nur themenspezifisch und erbt nicht von Gruppenvorgaben.

    **Agenten-Routing pro Thema**: Jedes Thema kann zu einem anderen Agenten routen, indem `agentId` in der Themenkonfiguration gesetzt wird. Dadurch erhält jedes Thema seinen eigenen isolierten Arbeitsbereich, Speicher und seine eigene Sitzung. Beispiel:

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

    **Persistente ACP-Themenbindung**: Forenthemen können ACP-Harness-Sitzungen über typisierte ACP-Bindings auf oberster Ebene fixieren (`bindings[]` mit `type: "acp"` und `match.channel: "telegram"`, `peer.kind: "group"` sowie einer themenqualifizierten ID wie `-1001234567890:topic:42`). Derzeit auf Forenthemen in Gruppen/Supergruppen beschränkt. Siehe [ACP-Agenten](/de/tools/acp-agents).

    **Thread-gebundener ACP-Spawn aus dem Chat**: `/acp spawn <agent> --thread here|auto` bindet das aktuelle Thema an eine neue ACP-Sitzung; Folgebeiträge werden direkt dorthin geroutet. OpenClaw fixiert die Spawn-Bestätigung im Thema. Erfordert, dass `channels.telegram.threadBindings.spawnSessions` aktiviert bleibt (Standard: `true`).

    Vorlagenkontext stellt `MessageThreadId` und `IsForum` bereit. DM-Chats mit `message_thread_id` behalten standardmäßig DM-Routing und Antwortmetadaten in flachen Sitzungen bei; sie verwenden Thread-bewusste Sitzungsschlüssel nur, wenn sie mit `threadReplies: "inbound"`, `threadReplies: "always"`, `requireTopic: true` oder einer passenden Themenkonfiguration konfiguriert sind. Verwenden Sie `channels.telegram.dm.threadReplies` auf oberster Ebene für den Account-Standard oder `direct.<chatId>.threadReplies` für eine einzelne DM.

  </Accordion>

  <Accordion title="Audio, Video und Sticker">
    ### Audionachrichten

    Telegram unterscheidet Sprachnotizen von Audiodateien.

    - Standard: Audiodateiverhalten
    - Tag `[[audio_as_voice]]` in der Agent-Antwort, um das Senden als Sprachnotiz zu erzwingen
    - Eingehende Transkripte von Sprachnotizen werden im Agent-Kontext als maschinell generierter,
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
    Telegram-Reaktionen kommen als `message_reaction`-Updates an (getrennt von Nachrichten-Payloads).

    Wenn aktiviert, stellt OpenClaw Systemereignisse wie diese in die Warteschlange:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Konfiguration:

    - `channels.telegram.reactionNotifications`: `off | own | all` (Standard: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (Standard: `minimal`)

    Hinweise:

    - `own` bedeutet nur Benutzerreaktionen auf vom Bot gesendete Nachrichten (Best Effort über den Cache gesendeter Nachrichten).
    - Reaktionsereignisse beachten weiterhin Telegram-Zugriffskontrollen (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); nicht autorisierte Absender werden verworfen.
    - Telegram stellt in Reaktionsupdates keine Thread-IDs bereit.
      - Nicht-Forumgruppen werden an die Gruppenchat-Sitzung geroutet
      - Forumgruppen werden an die Sitzung des allgemeinen Gruppenthemas (`:topic:1`) geroutet, nicht an das genaue Ursprungsthema

    `allowed_updates` für Polling/Webhook enthält automatisch `message_reaction`.

  </Accordion>

  <Accordion title="Ack-Reaktionen">
    `ackReaction` sendet ein Bestätigungs-Emoji, während OpenClaw eine eingehende Nachricht verarbeitet.

    Auflösungsreihenfolge:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - Fallback auf Agent-Identitäts-Emoji (`agents.list[].identity.emoji`, sonst "👀")

    Hinweise:

    - Telegram erwartet Unicode-Emoji (zum Beispiel "👀").
    - Verwenden Sie `""`, um die Reaktion für einen Kanal oder Account zu deaktivieren.

  </Accordion>

  <Accordion title="Konfigurationsschreibvorgänge aus Telegram-Ereignissen und -Befehlen">
    Schreibvorgänge für die Kanalkonfiguration sind standardmäßig aktiviert (`configWrites !== false`).

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
    Standard ist Long Polling. Für den Webhook-Modus legen Sie `channels.telegram.webhookUrl` und `channels.telegram.webhookSecret` fest; optional `webhookPath`, `webhookHost`, `webhookPort` (Standardwerte `/telegram-webhook`, `127.0.0.1`, `8787`).

    Der lokale Listener bindet an `127.0.0.1:8787`. Für öffentlichen Ingress schalten Sie entweder einen Reverse Proxy vor den lokalen Port oder setzen Sie bewusst `webhookHost: "0.0.0.0"`.

    Der Webhook-Modus validiert Request-Guards, das geheime Telegram-Token und den JSON-Body, bevor `200` an Telegram zurückgegeben wird.
    OpenClaw verarbeitet das Update anschließend asynchron über dieselben Bot-Lanes pro Chat/pro Thema, die auch Long Polling verwendet, sodass langsame Agent-Runden den Zustellungs-ACK von Telegram nicht blockieren.

  </Accordion>

  <Accordion title="Limits, Wiederholung und CLI-Ziele">
    - Der Standardwert von `channels.telegram.textChunkLimit` ist 4000.
    - `channels.telegram.chunkMode="newline"` bevorzugt Absatzgrenzen (Leerzeilen), bevor nach Länge aufgeteilt wird.
    - `channels.telegram.mediaMaxMb` (Standard 100) begrenzt die Größe eingehender und ausgehender Telegram-Medien.
    - `channels.telegram.mediaGroupFlushMs` (Standard 500) steuert, wie lange Telegram-Alben/Mediengruppen gepuffert werden, bevor OpenClaw sie als eine eingehende Nachricht weiterleitet. Erhöhen Sie den Wert, wenn Albumteile spät ankommen; verringern Sie ihn, um die Antwortlatenz für Alben zu reduzieren.
    - `channels.telegram.timeoutSeconds` überschreibt das Timeout des Telegram-API-Clients (wenn nicht gesetzt, gilt der grammY-Standard). Bot-Clients begrenzen konfigurierte Werte unterhalb des 60-Sekunden-Request-Guards für ausgehenden Text/Typing, damit grammY die sichtbare Antwortzustellung nicht abbricht, bevor OpenClaws Transport-Guard und Fallback laufen können. Long Polling verwendet weiterhin einen 45-Sekunden-`getUpdates`-Request-Guard, damit inaktive Polls nicht unbegrenzt aufgegeben werden.
    - `channels.telegram.pollingStallThresholdMs` ist standardmäßig `120000`; passen Sie den Wert nur bei falsch positiven Neustarts wegen Polling-Stalls zwischen `30000` und `600000` an.
    - Der Gruppen-Kontextverlauf verwendet `channels.telegram.historyLimit` oder `messages.groupChat.historyLimit` (Standard 50); `0` deaktiviert ihn.
    - Zusätzlicher Kontext aus Antworten/Zitaten/Weiterleitungen wird derzeit unverändert übergeben.
    - Telegram-Allowlists steuern primär, wer den Agent auslösen kann, und sind keine vollständige Grenze für die Schwärzung von Zusatzkontext.
    - Steuerelemente für den DM-Verlauf:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - Die Konfiguration `channels.telegram.retry` gilt für Telegram-Sendehilfen (CLI/Tools/Aktionen) bei behebbaren ausgehenden API-Fehlern. Die Zustellung der finalen eingehenden Antwort verwendet ebenfalls eine begrenzte Safe-Send-Wiederholung bei Telegram-Pre-Connect-Fehlern, wiederholt jedoch keine mehrdeutigen Netzwerkumschläge nach dem Senden, die sichtbare Nachrichten duplizieren könnten.

    CLI- und Message-Tool-Sendeziele können eine numerische Chat-ID, ein Benutzername oder ein Forum-Themenziel sein:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
```

    Telegram-Polls verwenden `openclaw message poll` und unterstützen Forumthemen:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Nur Telegram betreffende Poll-Flags:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` für Forumthemen (oder verwenden Sie ein `:topic:`-Ziel)

    Telegram-Senden unterstützt außerdem:

    - `--presentation` mit `buttons`-Blöcken für Inline-Keyboards, wenn `channels.telegram.capabilities.inlineButtons` dies erlaubt
    - `--pin` oder `--delivery '{"pin":true}'`, um angeheftete Zustellung anzufordern, wenn der Bot in diesem Chat anheften kann
    - `--force-document`, um ausgehende Bilder und GIFs als Dokumente statt als komprimierte Foto- oder animierte Medien-Uploads zu senden

    Aktionssteuerung:

    - `channels.telegram.actions.sendMessage=false` deaktiviert ausgehende Telegram-Nachrichten einschließlich Polls
    - `channels.telegram.actions.poll=false` deaktiviert die Erstellung von Telegram-Polls, während reguläres Senden aktiviert bleibt

  </Accordion>

  <Accordion title="Exec-Genehmigungen in Telegram">
    Telegram unterstützt Exec-Genehmigungen in Genehmiger-DMs und kann Prompts optional im ursprünglichen Chat oder Thema posten. Genehmiger müssen numerische Telegram-Benutzer-IDs sein.

    Konfigurationspfad:

    - `channels.telegram.execApprovals.enabled` (aktiviert sich automatisch, wenn mindestens ein Genehmiger auflösbar ist)
    - `channels.telegram.execApprovals.approvers` (fällt auf numerische Besitzer-IDs aus `commands.ownerAllowFrom` zurück)
    - `channels.telegram.execApprovals.target`: `dm` (Standard) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` und `defaultTo` steuern, wer mit dem Bot sprechen kann und wohin er normale Antworten sendet. Sie machen niemanden zu einem Exec-Genehmiger. Die erste genehmigte DM-Kopplung initialisiert `commands.ownerAllowFrom`, wenn noch kein Befehlsbesitzer existiert, sodass die Ein-Besitzer-Einrichtung weiterhin funktioniert, ohne IDs unter `execApprovals.approvers` zu duplizieren.

    Kanalzustellung zeigt den Befehlstext im Chat; aktivieren Sie `channel` oder `both` nur in vertrauenswürdigen Gruppen/Themen. Wenn der Prompt in einem Forumthema landet, behält OpenClaw das Thema für den Genehmigungsprompt und die Folgeaktion bei. Exec-Genehmigungen laufen standardmäßig nach 30 Minuten ab.

    Inline-Genehmigungsbuttons erfordern außerdem, dass `channels.telegram.capabilities.inlineButtons` die Zieloberfläche (`dm`, `group` oder `all`) erlaubt. Genehmigungs-IDs mit Präfix `plugin:` werden über Plugin-Genehmigungen aufgelöst; andere werden zuerst über Exec-Genehmigungen aufgelöst.

    Siehe [Exec-Genehmigungen](/de/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Steuerelemente für Fehlerantworten

Wenn der Agent auf einen Zustellungs- oder Provider-Fehler stößt, kann Telegram entweder mit dem Fehlertext antworten oder ihn unterdrücken. Zwei Konfigurationsschlüssel steuern dieses Verhalten:

| Schlüssel                           | Werte             | Standard | Beschreibung                                                                                          |
| ----------------------------------- | ----------------- | -------- | ----------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`  | `reply` sendet eine freundliche Fehlermeldung an den Chat. `silent` unterdrückt Fehlerantworten ganz. |
| `channels.telegram.errorCooldownMs` | Zahl (ms)         | `60000`  | Mindestzeit zwischen Fehlerantworten an denselben Chat. Verhindert Fehlerspam während Ausfällen.      |

Überschreibungen pro Account, pro Gruppe und pro Thema werden unterstützt (gleiche Vererbung wie bei anderen Telegram-Konfigurationsschlüsseln).

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
  <Accordion title="Bot reagiert nicht auf Gruppenmeldungen ohne Erwähnung">

    - Wenn `requireMention=false` gilt, muss der Telegram-Datenschutzmodus vollständige Sichtbarkeit erlauben.
      - BotFather: `/setprivacy` -> Deaktivieren
      - entfernen Sie dann den Bot und fügen Sie ihn der Gruppe erneut hinzu
    - `openclaw channels status` warnt, wenn die Konfiguration nicht erwähnte Gruppennachrichten erwartet.
    - `openclaw channels status --probe` kann explizite numerische Gruppen-IDs prüfen; die Wildcard `"*"` kann nicht per Mitgliedschaftsprüfung geprüft werden.
    - schneller Sitzungstest: `/activation always`.

  </Accordion>

  <Accordion title="Bot sieht überhaupt keine Gruppennachrichten">

    - wenn `channels.telegram.groups` vorhanden ist, muss die Gruppe aufgelistet sein (oder `"*"` enthalten)
    - prüfen Sie die Bot-Mitgliedschaft in der Gruppe
    - prüfen Sie die Logs: `openclaw logs --follow` für Gründe für das Überspringen

  </Accordion>

  <Accordion title="Befehle funktionieren teilweise oder gar nicht">

    - autorisieren Sie Ihre Senderidentität (Pairing und/oder numerisches `allowFrom`)
    - Befehlsautorisierung gilt weiterhin, auch wenn die Gruppenrichtlinie `open` ist
    - `setMyCommands failed` mit `BOT_COMMANDS_TOO_MUCH` bedeutet, dass das native Menü zu viele Einträge hat; reduzieren Sie Plugin-/Skill-/benutzerdefinierte Befehle oder deaktivieren Sie native Menüs
    - `deleteMyCommands`- / `setMyCommands`-Startaufrufe und `sendChatAction`-Typing-Aufrufe sind begrenzt und werden bei Request-Timeout einmal über Telegrams Transport-Fallback wiederholt. Anhaltende Netzwerk-/Fetch-Fehler weisen normalerweise auf DNS-/HTTPS-Erreichbarkeitsprobleme zu `api.telegram.org` hin

  </Accordion>

  <Accordion title="Start meldet nicht autorisiertes Token">

    - `getMe returned 401` ist ein Telegram-Authentifizierungsfehler für das konfigurierte Bot-Token.
    - Kopieren oder generieren Sie das Bot-Token in BotFather erneut und aktualisieren Sie dann `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` oder `TELEGRAM_BOT_TOKEN` für das Standardkonto.
    - `deleteWebhook 401 Unauthorized` während des Starts ist ebenfalls ein Authentifizierungsfehler; dies als „kein Webhook vorhanden“ zu behandeln, würde denselben Fehler durch ein ungültiges Token nur auf spätere API-Aufrufe verschieben.

  </Accordion>

  <Accordion title="Polling- oder Netzwerkinstabilität">

    - Node 22+ und benutzerdefinierte Fetch-/Proxy-Konfigurationen können sofortiges Abbruchverhalten auslösen, wenn AbortSignal-Typen nicht übereinstimmen.
    - Manche Hosts lösen `api.telegram.org` zuerst zu IPv6 auf; defekter IPv6-Egress kann intermittierende Telegram-API-Fehler verursachen.
    - Wenn Logs `TypeError: fetch failed` oder `Network request for 'getUpdates' failed!` enthalten, wiederholt OpenClaw diese nun als behebbare Netzwerkfehler.
    - Beim Polling-Start verwendet OpenClaw den erfolgreichen `getMe`-Starttest für grammY erneut, sodass der Runner kein zweites `getMe` vor dem ersten `getUpdates` benötigt.
    - Wenn `deleteWebhook` beim Polling-Start mit einem vorübergehenden Netzwerkfehler fehlschlägt, fährt OpenClaw mit Long Polling fort, statt einen weiteren Control-Plane-Aufruf vor dem Polling auszuführen. Ein weiterhin aktiver Webhook wird als `getUpdates`-Konflikt sichtbar; OpenClaw baut dann den Telegram-Transport neu auf und versucht die Webhook-Bereinigung erneut.
    - Wenn Telegram-Sockets in einem kurzen festen Rhythmus erneuert werden, prüfen Sie, ob `channels.telegram.timeoutSeconds` niedrig ist; Bot-Clients begrenzen konfigurierte Werte unterhalb der Guards für ausgehende Requests und `getUpdates`, ältere Releases konnten jedoch jede Abfrage oder Antwort abbrechen, wenn dies unterhalb dieser Guards gesetzt war.
    - Wenn Logs `Polling stall detected` enthalten, startet OpenClaw Polling neu und baut den Telegram-Transport standardmäßig nach 120 Sekunden ohne abgeschlossene Long-Poll-Liveness neu auf.
    - `openclaw channels status --probe` und `openclaw doctor` warnen, wenn ein laufendes Polling-Konto nach der Start-Toleranz kein `getUpdates` abgeschlossen hat, wenn ein laufendes Webhook-Konto nach der Start-Toleranz kein `setWebhook` abgeschlossen hat oder wenn die letzte erfolgreiche Polling-Transportaktivität veraltet ist.
    - Erhöhen Sie `channels.telegram.pollingStallThresholdMs` nur, wenn lang laufende `getUpdates`-Aufrufe gesund sind, Ihr Host aber weiterhin falsche Polling-Stall-Neustarts meldet. Anhaltende Stalls deuten normalerweise auf Proxy-, DNS-, IPv6- oder TLS-Egress-Probleme zwischen Host und `api.telegram.org` hin.
    - Telegram berücksichtigt außerdem Prozess-Proxy-Env für den Bot-API-Transport, einschließlich `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` und deren Kleinschreibungsvarianten. `NO_PROXY` / `no_proxy` kann `api.telegram.org` weiterhin umgehen.
    - Wenn der von OpenClaw verwaltete Proxy für eine Service-Umgebung über `OPENCLAW_PROXY_URL` konfiguriert ist und keine standardmäßige Proxy-Env vorhanden ist, verwendet Telegram diese URL ebenfalls für den Bot-API-Transport.
    - Leiten Sie auf VPS-Hosts mit instabilem direktem Egress/TLS Telegram-API-Aufrufe über `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ setzt standardmäßig `autoSelectFamily=true` (außer WSL2). Die Telegram-DNS-Ergebnisreihenfolge berücksichtigt `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, dann `channels.telegram.network.dnsResultOrder`, dann den Prozessstandard wie `NODE_OPTIONS=--dns-result-order=ipv4first`; wenn nichts davon gilt, fällt Node 22+ auf `ipv4first` zurück.
    - Wenn Ihr Host WSL2 ist oder ausdrücklich besser mit reinem IPv4-Verhalten funktioniert, erzwingen Sie die Family-Auswahl:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Antworten aus dem RFC-2544-Benchmark-Bereich (`198.18.0.0/15`) sind für Telegram-Mediendownloads bereits standardmäßig erlaubt. Wenn ein vertrauenswürdiger Fake-IP- oder transparenter Proxy `api.telegram.org` während Mediendownloads auf eine andere private/interne/Special-Use-Adresse umschreibt, können Sie den nur für Telegram geltenden Bypass aktivieren:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Dieselbe Opt-in-Option ist pro Konto unter
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork` verfügbar.
    - Wenn Ihr Proxy Telegram-Medienhosts zu `198.18.x.x` auflöst, lassen Sie das gefährliche Flag zunächst deaktiviert. Telegram-Medien erlauben den RFC-2544-Benchmark-Bereich bereits standardmäßig.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` schwächt Telegram-Medien-SSRF-Schutzmaßnahmen. Verwenden Sie es nur für vertrauenswürdige, betreiberkontrollierte Proxy-Umgebungen wie Clash, Mihomo oder Surge-Fake-IP-Routing, wenn diese private oder Special-Use-Antworten außerhalb des RFC-2544-Benchmark-Bereichs synthetisieren. Lassen Sie es für normalen öffentlichen Internetzugriff auf Telegram deaktiviert.
    </Warning>

    - Umgebungs-Overrides (temporär):
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

<Accordion title="Telegram-Felder mit hoher Aussagekraft">

- Start/Authentifizierung: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` muss auf eine reguläre Datei verweisen; Symlinks werden abgelehnt)
- Zugriffskontrolle: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` auf oberster Ebene (`type: "acp"`)
- Ausführungsgenehmigungen: `execApprovals`, `accounts.*.execApprovals`
- Befehl/Menü: `commands.native`, `commands.nativeSkills`, `customCommands`
- Threads/Antworten: `replyToMode`, `dm.threadReplies`, `direct.*.threadReplies`
- Streaming: `streaming` (Vorschau), `streaming.preview.toolProgress`, `blockStreaming`
- Formatierung/Zustellung: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- Medien/Netzwerk: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- benutzerdefinierter API-Root: `apiRoot` (nur Bot-API-Root; schließen Sie `/bot<TOKEN>` nicht ein)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- Aktionen/Fähigkeiten: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- Reaktionen: `reactionNotifications`, `reactionLevel`
- Fehler: `errorPolicy`, `errorCooldownMs`
- Schreibvorgänge/Verlauf: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Multi-Account-Priorität: Wenn zwei oder mehr Konto-IDs konfiguriert sind, setzen Sie `channels.telegram.defaultAccount` (oder schließen Sie `channels.telegram.accounts.default` ein), um das Standard-Routing explizit zu machen. Andernfalls fällt OpenClaw auf die erste normalisierte Konto-ID zurück und `openclaw doctor` warnt. Benannte Konten erben `channels.telegram.allowFrom` / `groupAllowFrom`, aber keine Werte aus `accounts.default.*`.
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
    Leiten Sie eingehende Nachrichten an Agenten weiter.
  </Card>
  <Card title="Sicherheit" icon="shield" href="/de/gateway/security">
    Bedrohungsmodell und Härtung.
  </Card>
  <Card title="Multi-Agent-Routing" icon="sitemap" href="/de/concepts/multi-agent">
    Ordnen Sie Gruppen und Themen Agenten zu.
  </Card>
  <Card title="Fehlerbehebung" icon="wrench" href="/de/channels/troubleshooting">
    Channel-übergreifende Diagnose.
  </Card>
</CardGroup>
