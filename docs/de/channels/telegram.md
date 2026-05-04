---
read_when:
    - Arbeiten an Telegram-Funktionen oder Webhooks
summary: Supportstatus, Funktionen und Konfiguration für den Telegram-Bot
title: Telegram
x-i18n:
    generated_at: "2026-05-04T06:41:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7f49db5f3fe8fd724e53a2ae3d226446f248bf9d021fcc01c1cf816649381d2
    source_path: channels/telegram.md
    workflow: 16
---

Produktionsreif für Bot-DMs und Gruppen über grammY. Long Polling ist der Standardmodus; der Webhook-Modus ist optional.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/de/channels/pairing">
    Die Standard-DM-Richtlinie für Telegram ist Pairing.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/de/channels/troubleshooting">
    Kanalübergreifende Diagnosen und Reparatur-Playbooks.
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/de/gateway/configuration">
    Vollständige Channel-Konfigurationsmuster und Beispiele.
  </Card>
</CardGroup>

## Schnelle Einrichtung

<Steps>
  <Step title="Create the bot token in BotFather">
    Öffnen Sie Telegram und chatten Sie mit **@BotFather** (stellen Sie sicher, dass der Handle exakt `@BotFather` lautet).

    Führen Sie `/newbot` aus, folgen Sie den Eingabeaufforderungen und speichern Sie das Token.

  </Step>

  <Step title="Configure token and DM policy">

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
    Telegram verwendet **nicht** `openclaw channels login telegram`; konfigurieren Sie das Token in der Konfiguration/Umgebung und starten Sie dann den Gateway.

  </Step>

  <Step title="Start gateway and approve first DM">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Pairing-Codes laufen nach 1 Stunde ab.

  </Step>

  <Step title="Add the bot to a group">
    Fügen Sie den Bot Ihrer Gruppe hinzu und setzen Sie dann `channels.telegram.groups` und `groupPolicy` passend zu Ihrem Zugriffsmodell.
  </Step>
</Steps>

<Note>
Die Reihenfolge der Token-Auflösung ist kontobewusst. In der Praxis haben Konfigurationswerte Vorrang vor dem Env-Fallback, und `TELEGRAM_BOT_TOKEN` gilt nur für das Standardkonto.
</Note>

## Telegram-seitige Einstellungen

<AccordionGroup>
  <Accordion title="Privacy mode and group visibility">
    Telegram-Bots verwenden standardmäßig den **Privatsphäre-Modus**, der begrenzt, welche Gruppennachrichten sie empfangen.

    Wenn der Bot alle Gruppennachrichten sehen muss, können Sie entweder:

    - den Privatsphäre-Modus über `/setprivacy` deaktivieren oder
    - den Bot zum Gruppenadministrator machen.

    Wenn Sie den Privatsphäre-Modus umschalten, entfernen Sie den Bot aus jeder Gruppe und fügen Sie ihn erneut hinzu, damit Telegram die Änderung übernimmt.

  </Accordion>

  <Accordion title="Group permissions">
    Der Adminstatus wird in den Telegram-Gruppeneinstellungen gesteuert.

    Admin-Bots empfangen alle Gruppennachrichten, was für dauerhaft aktive Gruppenfunktionen nützlich ist.

  </Accordion>

  <Accordion title="Helpful BotFather toggles">

    - `/setjoingroups`, um Gruppenhinzufügungen zu erlauben/zu verweigern
    - `/setprivacy` für das Verhalten der Gruppensichtbarkeit

  </Accordion>
</AccordionGroup>

## Zugriffskontrolle und Aktivierung

<Tabs>
  <Tab title="DM policy">
    `channels.telegram.dmPolicy` steuert den Zugriff auf Direktnachrichten:

    - `pairing` (Standard)
    - `allowlist` (erfordert mindestens eine Absender-ID in `allowFrom`)
    - `open` (erfordert, dass `allowFrom` `"*"` enthält)
    - `disabled`

    `dmPolicy: "open"` mit `allowFrom: ["*"]` erlaubt jedem Telegram-Konto, das den Bot-Benutzernamen findet oder errät, dem Bot Befehle zu geben. Verwenden Sie dies nur für bewusst öffentliche Bots mit stark eingeschränkten Tools; Bots mit einem einzelnen Besitzer sollten `allowlist` mit numerischen Benutzer-IDs verwenden.

    `channels.telegram.allowFrom` akzeptiert numerische Telegram-Benutzer-IDs. Präfixe `telegram:` / `tg:` werden akzeptiert und normalisiert.
    In Multi-Konto-Konfigurationen wird ein restriktives `channels.telegram.allowFrom` auf oberster Ebene als Sicherheitsgrenze behandelt: `allowFrom: ["*"]`-Einträge auf Kontoebene machen dieses Konto nicht öffentlich, es sei denn, die effektive Konto-Allowlist enthält nach dem Zusammenführen weiterhin einen expliziten Platzhalter.
    `dmPolicy: "allowlist"` mit leerem `allowFrom` blockiert alle DMs und wird von der Konfigurationsvalidierung abgelehnt.
    Die Einrichtung fragt nur nach numerischen Benutzer-IDs.
    Wenn Sie ein Upgrade durchgeführt haben und Ihre Konfiguration `@username`-Allowlist-Einträge enthält, führen Sie `openclaw doctor --fix` aus, um sie aufzulösen (nach bestem Bemühen; erfordert ein Telegram-Bot-Token).
    Wenn Sie sich zuvor auf Pairing-Store-Allowlist-Dateien verlassen haben, kann `openclaw doctor --fix` Einträge in Allowlist-Flows in `channels.telegram.allowFrom` wiederherstellen (zum Beispiel, wenn `dmPolicy: "allowlist"` noch keine expliziten IDs hat).

    Für Bots mit einem einzelnen Besitzer bevorzugen Sie `dmPolicy: "allowlist"` mit expliziten numerischen `allowFrom`-IDs, damit die Zugriffsrichtlinie dauerhaft in der Konfiguration liegt (statt von früheren Pairing-Genehmigungen abzuhängen).

    Häufige Verwirrung: DM-Pairing-Genehmigung bedeutet nicht „dieser Absender ist überall autorisiert“.
    Pairing gewährt DM-Zugriff. Wenn noch kein Befehlsbesitzer existiert, setzt das erste genehmigte Pairing außerdem `commands.ownerAllowFrom`, damit Besitzer-only-Befehle und Ausführungsgenehmigungen ein explizites Operatorkonto haben.
    Die Autorisierung von Gruppensendern kommt weiterhin aus expliziten Konfigurations-Allowlists.
    Wenn Sie möchten: „Ich bin einmal autorisiert und sowohl DMs als auch Gruppenbefehle funktionieren“, setzen Sie Ihre numerische Telegram-Benutzer-ID in `channels.telegram.allowFrom`; stellen Sie für Besitzer-only-Befehle sicher, dass `commands.ownerAllowFrom` `telegram:<your user id>` enthält.

    ### Ihre Telegram-Benutzer-ID finden

    Sicherer (kein Drittanbieter-Bot):

    1. Schreiben Sie Ihrem Bot eine DM.
    2. Führen Sie `openclaw logs --follow` aus.
    3. Lesen Sie `from.id`.

    Offizielle Bot-API-Methode:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Drittanbieter-Methode (weniger privat): `@userinfobot` oder `@getidsbot`.

  </Tab>

  <Tab title="Group policy and allowlists">
    Zwei Steuerungen gelten zusammen:

    1. **Welche Gruppen erlaubt sind** (`channels.telegram.groups`)
       - keine `groups`-Konfiguration:
         - mit `groupPolicy: "open"`: Jede Gruppe kann Gruppen-ID-Prüfungen bestehen
         - mit `groupPolicy: "allowlist"` (Standard): Gruppen werden blockiert, bis Sie `groups`-Einträge hinzufügen (oder `"*"`)
       - `groups` konfiguriert: wirkt als Allowlist (explizite IDs oder `"*"`)

    2. **Welche Absender in Gruppen erlaubt sind** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (Standard)
       - `disabled`

    `groupAllowFrom` wird für die Gruppensender-Filterung verwendet. Wenn es nicht gesetzt ist, fällt Telegram auf `allowFrom` zurück.
    `groupAllowFrom`-Einträge sollten numerische Telegram-Benutzer-IDs sein (Präfixe `telegram:` / `tg:` werden normalisiert).
    Setzen Sie keine Telegram-Gruppen- oder Supergruppen-Chat-IDs in `groupAllowFrom`. Negative Chat-IDs gehören unter `channels.telegram.groups`.
    Nicht numerische Einträge werden für die Senderautorisierung ignoriert.
    Sicherheitsgrenze (`2026.2.25+`): Gruppensender-Auth erbt **keine** DM-Pairing-Store-Genehmigungen.
    Pairing bleibt DM-only. Legen Sie für Gruppen `groupAllowFrom` oder `allowFrom` pro Gruppe/pro Thema fest.
    Wenn `groupAllowFrom` nicht gesetzt ist, fällt Telegram auf die Konfiguration `allowFrom` zurück, nicht auf den Pairing-Store.
    Praktisches Muster für Bots mit einem einzelnen Besitzer: Setzen Sie Ihre Benutzer-ID in `channels.telegram.allowFrom`, lassen Sie `groupAllowFrom` unset und erlauben Sie die Zielgruppen unter `channels.telegram.groups`.
    Laufzeithinweis: Wenn `channels.telegram` vollständig fehlt, verwendet die Laufzeit standardmäßig fail-closed `groupPolicy="allowlist"`, sofern `channels.defaults.groupPolicy` nicht explizit gesetzt ist.

    Beispiel: Jedes Mitglied in einer bestimmten Gruppe erlauben:

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
      - Verwenden Sie `groupAllowFrom: ["*"]` nur, wenn jedes Mitglied einer erlaubten Gruppe mit dem Bot sprechen dürfen soll.

    </Warning>

  </Tab>

  <Tab title="Mention behavior">
    Gruppenantworten erfordern standardmäßig eine Erwähnung.

    Die Erwähnung kann stammen von:

    - nativer `@botusername`-Erwähnung oder
    - Erwähnungsmustern in:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Befehlsumschaltungen auf Sitzungsebene:

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

    Gruppen-Chat-ID abrufen:

    - Leiten Sie eine Gruppennachricht an `@userinfobot` / `@getidsbot` weiter
    - oder lesen Sie `chat.id` aus `openclaw logs --follow`
    - oder prüfen Sie Bot API `getUpdates`

  </Tab>
</Tabs>

## Laufzeitverhalten

- Telegram gehört dem Gateway-Prozess.
- Routing ist deterministisch: Eingehende Telegram-Antworten gehen zurück an Telegram (das Modell wählt keine Channels).
- Eingehende Nachrichten werden in den gemeinsamen Channel-Umschlag mit Antwortmetadaten und Medienplatzhaltern normalisiert.
- Gruppensitzungen werden nach Gruppen-ID isoliert. Forum-Themen hängen `:topic:<threadId>` an, um Themen isoliert zu halten.
- DM-Nachrichten können `message_thread_id` enthalten; OpenClaw bewahrt die Thread-ID für Antworten, hält DMs standardmäßig aber in der flachen Sitzung. Konfigurieren Sie `channels.telegram.dm.threadReplies: "inbound"`, `channels.telegram.direct.<chatId>.threadReplies: "inbound"`, `requireTopic: true` oder eine passende Themenkonfiguration, wenn Sie absichtlich DM-Themensitzungsisolation möchten.
- Long Polling verwendet grammY runner mit Sequenzierung pro Chat/pro Thread. Die Gesamt-Runner-Sink-Nebenläufigkeit verwendet `agents.defaults.maxConcurrent`.
- Long Polling wird innerhalb jedes Gateway-Prozesses geschützt, sodass jeweils nur ein aktiver Poller ein Bot-Token verwenden kann. Wenn Sie weiterhin `getUpdates`-409-Konflikte sehen, verwendet wahrscheinlich ein anderer OpenClaw-Gateway, ein Skript oder ein externer Poller dasselbe Token.
- Neustarts des Long-Polling-Watchdogs werden standardmäßig nach 120 Sekunden ohne abgeschlossene `getUpdates`-Liveness ausgelöst. Erhöhen Sie `channels.telegram.pollingStallThresholdMs` nur, wenn Ihre Bereitstellung während lang laufender Arbeit weiterhin falsche Polling-Stall-Neustarts sieht. Der Wert ist in Millisekunden und von `30000` bis `600000` erlaubt; Überschreibungen pro Konto werden unterstützt.
- Die Telegram Bot API unterstützt keine Lesebestätigungen (`sendReadReceipts` gilt nicht).

## Funktionsreferenz

<AccordionGroup>
  <Accordion title="Live stream preview (message edits)">
    OpenClaw kann Teilantworten in Echtzeit streamen:

    - Direktchats: Vorschaunachricht + `editMessageText`
    - Gruppen/Themen: Vorschaunachricht + `editMessageText`

    Anforderung:

    - `channels.telegram.streaming` ist `off | partial | block | progress` (Standard: `partial`)
    - `progress` behält einen editierbaren Statusentwurf und aktualisiert ihn mit Tool-Fortschritt bis zur finalen Zustellung
    - `streaming.preview.toolProgress` steuert, ob Tool-/Fortschrittsupdates dieselbe bearbeitete Vorschaunachricht wiederverwenden (Standard: `true`, wenn Vorschau-Streaming aktiv ist)
    - Legacy-Werte `channels.telegram.streamMode` und boolesche `streaming`-Werte werden erkannt; führen Sie `openclaw doctor --fix` aus, um sie nach `channels.telegram.streaming.mode` zu migrieren

    Vorschau-Updates für Tool-Fortschritt sind die kurzen Statuszeilen, die angezeigt werden, während Tools laufen, zum Beispiel Befehlsausführung, Dateilesevorgänge, Planungsupdates oder Patch-Zusammenfassungen. Telegram lässt diese standardmäßig aktiviert, um dem veröffentlichten OpenClaw-Verhalten ab `v2026.4.22` und später zu entsprechen. Um die bearbeitete Vorschau für Antworttext beizubehalten, aber Tool-Fortschrittszeilen auszublenden, setzen Sie:

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

    Verwenden Sie `streaming.mode: "off"` nur, wenn Sie ausschließlich finale Auslieferung wünschen: Telegram-Vorschau-Edits werden deaktiviert, und generisches Tool-/Fortschrittsrauschen wird unterdrückt, statt als eigenständige Statusmeldungen gesendet zu werden. Genehmigungsabfragen, Medien-Payloads und Fehler werden weiterhin über die normale finale Auslieferung geleitet. Verwenden Sie `streaming.preview.toolProgress: false`, wenn Sie nur Antwortvorschau-Edits beibehalten und gleichzeitig die Tool-Fortschrittsstatuszeilen ausblenden möchten.

    <Note>
      Telegram-Antworten auf ausgewählte Zitate sind die Ausnahme. Wenn `replyToMode` `"first"`, `"all"` oder `"batched"` ist und die eingehende Nachricht ausgewählten Zitattext enthält, sendet OpenClaw die finale Antwort über Telegrams nativen Zitat-Antwortpfad, statt die Antwortvorschau zu bearbeiten. Daher kann `streaming.preview.toolProgress` die kurzen Statuszeilen für diesen Durchlauf nicht anzeigen. Antworten auf aktuelle Nachrichten ohne ausgewählten Zitattext behalten weiterhin Preview Streaming. Setzen Sie `replyToMode: "off"`, wenn die Sichtbarkeit des Tool-Fortschritts wichtiger ist als native Zitatantworten, oder setzen Sie `streaming.preview.toolProgress: false`, um den Kompromiss bewusst zu akzeptieren.
    </Note>

    Für reine Textantworten:

    - kurze DM-/Gruppen-/Themenvorschauen: OpenClaw behält dieselbe Vorschaunachricht bei und führt eine finale Bearbeitung an Ort und Stelle aus, sofern nach dem Erscheinen der Vorschau keine sichtbare Nicht-Vorschaunachricht gesendet wurde
    - Vorschauen, gefolgt von sichtbarer Nicht-Vorschauausgabe: OpenClaw sendet die fertige Antwort als neue finale Nachricht und räumt die ältere Vorschau auf, sodass die finale Antwort nach der Zwischenausgabe erscheint
    - Vorschauen, die älter als etwa eine Minute sind: OpenClaw sendet die fertige Antwort als neue finale Nachricht und räumt anschließend die Vorschau auf, sodass Telegrams sichtbarer Zeitstempel die Abschlusszeit statt der Erstellungszeit der Vorschau widerspiegelt

    Bei komplexen Antworten (zum Beispiel Medien-Payloads) fällt OpenClaw auf die normale finale Auslieferung zurück und räumt anschließend die Vorschaunachricht auf.

    Preview Streaming ist getrennt von Block Streaming. Wenn Block Streaming für Telegram ausdrücklich aktiviert ist, überspringt OpenClaw den Vorschaustream, um doppeltes Streaming zu vermeiden.

    Reiner Telegram-Reasoning-Stream:

    - `/reasoning stream` sendet Reasoning während der Generierung an die Live-Vorschau
    - die Reasoning-Vorschau wird nach der finalen Auslieferung gelöscht; verwenden Sie `/reasoning on`, wenn Reasoning sichtbar bleiben soll
    - die finale Antwort wird ohne Reasoning-Text gesendet

  </Accordion>

  <Accordion title="Formatierung und HTML-Fallback">
    Ausgehender Text verwendet Telegram `parse_mode: "HTML"`.

    - Markdown-ähnlicher Text wird zu Telegram-sicherem HTML gerendert.
    - Rohes Modell-HTML wird escaped, um Telegram-Parsefehler zu reduzieren.
    - Wenn Telegram geparstes HTML ablehnt, versucht OpenClaw es erneut als Klartext.

    Linkvorschauen sind standardmäßig aktiviert und können mit `channels.telegram.linkPreview: false` deaktiviert werden.

  </Accordion>

  <Accordion title="Native Befehle und benutzerdefinierte Befehle">
    Die Registrierung des Telegram-Befehlsmenüs wird beim Start mit `setMyCommands` verarbeitet.

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
    - Plugin-/Skills-Befehle können weiterhin funktionieren, wenn sie eingegeben werden, auch wenn sie nicht im Telegram-Menü angezeigt werden

    Wenn native Befehle deaktiviert sind, werden integrierte Befehle entfernt. Benutzerdefinierte/Plugin-Befehle können sich weiterhin registrieren, wenn sie konfiguriert sind.

    Häufige Einrichtungsfehler:

    - `setMyCommands failed` mit `BOT_COMMANDS_TOO_MUCH` bedeutet, dass das Telegram-Menü nach dem Kürzen immer noch überlaufen ist; reduzieren Sie Plugin-/Skills-/benutzerdefinierte Befehle oder deaktivieren Sie `channels.telegram.commands.native`.
    - Wenn `deleteWebhook`, `deleteMyCommands` oder `setMyCommands` mit `404: Not Found` fehlschlägt, während direkte Bot-API-curl-Befehle funktionieren, kann das bedeuten, dass `channels.telegram.apiRoot` auf den vollständigen `/bot<TOKEN>`-Endpunkt gesetzt wurde. `apiRoot` darf nur der Bot-API-Root sein, und `openclaw doctor --fix` entfernt ein versehentlich angehängtes `/bot<TOKEN>`.
    - `getMe returned 401` bedeutet, dass Telegram das konfigurierte Bot-Token abgelehnt hat. Aktualisieren Sie `botToken`, `tokenFile` oder `TELEGRAM_BOT_TOKEN` mit dem aktuellen BotFather-Token; OpenClaw stoppt vor dem Polling, sodass dies nicht als Webhook-Aufräumfehler gemeldet wird.
    - `setMyCommands failed` mit Netzwerk-/Fetch-Fehlern bedeutet normalerweise, dass ausgehendes DNS/HTTPS zu `api.telegram.org` blockiert ist.

    ### Gerätekopplungsbefehle (`device-pair`-Plugin)

    Wenn das `device-pair`-Plugin installiert ist:

    1. `/pair` erzeugt Einrichtungscode
    2. Code in der iOS-App einfügen
    3. `/pair pending` listet ausstehende Anfragen auf (einschließlich Rolle/Scopes)
    4. Anfrage genehmigen:
       - `/pair approve <requestId>` für ausdrückliche Genehmigung
       - `/pair approve`, wenn es nur eine ausstehende Anfrage gibt
       - `/pair approve latest` für die neueste

    Der Einrichtungscode enthält ein kurzlebiges Bootstrap-Token. Die integrierte Bootstrap-Übergabe hält das primäre Node-Token bei `scopes: []`; jedes übergebene Operator-Token bleibt auf `operator.approvals`, `operator.read`, `operator.talk.secrets` und `operator.write` begrenzt. Bootstrap-Scope-Prüfungen sind rollenpräfixiert, sodass diese Operator-Allowlist nur Operator-Anfragen erfüllt; Nicht-Operator-Rollen benötigen weiterhin Scopes unter ihrem eigenen Rollenpräfix.

    Wenn ein Gerät es mit geänderten Authentifizierungsdetails erneut versucht (zum Beispiel Rolle/Scopes/öffentlicher Schlüssel), wird die vorherige ausstehende Anfrage ersetzt und die neue Anfrage verwendet eine andere `requestId`. Führen Sie `/pair pending` vor der Genehmigung erneut aus.

    Weitere Details: [Kopplung](/de/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="Inline-Schaltflächen">
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

    Veraltetes `capabilities: ["inlineButtons"]` wird auf `inlineButtons: "all"` abgebildet.

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

    Channel-Nachrichtenaktionen stellen ergonomische Aliase bereit (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Gating-Steuerungen:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (Standard: deaktiviert)

    Hinweis: `edit` und `topic-create` sind derzeit standardmäßig aktiviert und haben keine separaten `channels.telegram.actions.*`-Schalter.
    Laufzeit-Sendevorgänge verwenden den aktiven Konfigurations-/Secrets-Snapshot (Start/Reload), sodass Aktionspfade keine Ad-hoc-Neuauflösung von SecretRef pro Sendevorgang durchführen.

    Semantik zum Entfernen von Reaktionen: [/tools/reactions](/de/tools/reactions)

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

    Hinweis: `off` deaktiviert implizites Antwort-Threading. Explizite `[[reply_to_*]]`-Tags werden weiterhin berücksichtigt.

  </Accordion>

  <Accordion title="Forumsthemen und Thread-Verhalten">
    Forum-Supergruppen:

    - Themenschlüssel für Sessions hängen `:topic:<threadId>` an
    - Antworten und Tippen zielen auf den Themen-Thread
    - Pfad der Themenkonfiguration:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Sonderfall allgemeines Thema (`threadId=1`):

    - Nachrichtensendungen lassen `message_thread_id` weg (Telegram lehnt `sendMessage(...thread_id=1)` ab)
    - Tippaktionen enthalten weiterhin `message_thread_id`

    Themenvererbung: Themeneinträge erben Gruppeneinstellungen, sofern sie nicht überschrieben werden (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` ist themenspezifisch und erbt nicht von Gruppenvorgaben.

    **Agent-Routing pro Thema**: Jedes Thema kann durch Setzen von `agentId` in der Themenkonfiguration an einen anderen Agenten weitergeleitet werden. Dadurch erhält jedes Thema seinen eigenen isolierten Workspace, Speicher und seine eigene Session. Beispiel:

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

    Danach hat jedes Thema seinen eigenen Session-Schlüssel: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Persistente ACP-Themenbindung**: Forumsthemen können ACP-Harness-Sessions über typisierte ACP-Bindings auf oberster Ebene pinnen (`bindings[]` mit `type: "acp"` und `match.channel: "telegram"`, `peer.kind: "group"` sowie einer themenqualifizierten ID wie `-1001234567890:topic:42`). Derzeit auf Forumsthemen in Gruppen/Supergruppen begrenzt. Siehe [ACP-Agenten](/de/tools/acp-agents).

    **Thread-gebundener ACP-Spawn aus dem Chat**: `/acp spawn <agent> --thread here|auto` bindet das aktuelle Thema an eine neue ACP-Session; Folgeanfragen werden direkt dorthin geleitet. OpenClaw pinnt die Spawn-Bestätigung im Thema. Erfordert, dass `channels.telegram.threadBindings.spawnSessions` aktiviert bleibt (Standard: `true`).

    Der Template-Kontext stellt `MessageThreadId` und `IsForum` bereit. DM-Chats mit `message_thread_id` behalten standardmäßig DM-Routing und Antwortmetadaten auf flachen Sessions; sie verwenden thread-bewusste Session-Schlüssel nur, wenn sie mit `threadReplies: "inbound"`, `threadReplies: "always"`, `requireTopic: true` oder einer passenden Themenkonfiguration konfiguriert sind. Verwenden Sie `channels.telegram.dm.threadReplies` auf oberster Ebene für die Kontovorgabe oder `direct.<chatId>.threadReplies` für eine einzelne DM.

  </Accordion>

  <Accordion title="Audio, Video und Sticker">
    ### Audionachrichten

    Telegram unterscheidet Sprachnotizen von Audiodateien.

    - Standard: Audiodateiverhalten
    - Tag `[[audio_as_voice]]` in der Agentenantwort, um das Senden als Sprachnotiz zu erzwingen
    - Eingehende Sprachnotiz-Transkripte werden im Agentenkontext als maschinell erzeugter,
      nicht vertrauenswürdiger Text gerahmt; Erwähnungserkennung verwendet weiterhin das rohe
      Transkript, sodass erwähnungsgesteuerte Sprachnachrichten weiterhin funktionieren.

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

    Videonotizen unterstützen keine Bildunterschriften; bereitgestellter Nachrichtentext wird separat gesendet.

    ### Sticker

    Behandlung eingehender Sticker:

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

    - `own` bedeutet nur Benutzerreaktionen auf vom Bot gesendete Nachrichten (Best-Effort über den Cache gesendeter Nachrichten).
    - Reaktionsereignisse beachten weiterhin die Telegram-Zugriffssteuerungen (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); nicht autorisierte Absender werden verworfen.
    - Telegram stellt in Reaktions-Updates keine Thread-IDs bereit.
      - Nicht-Forum-Gruppen werden an die Gruppenchat-Sitzung geleitet
      - Forum-Gruppen werden an die allgemeine Themen-Sitzung der Gruppe (`:topic:1`) geleitet, nicht an das exakte ursprüngliche Thema

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
    - Verwenden Sie `""`, um die Reaktion für einen Kanal oder ein Konto zu deaktivieren.

  </Accordion>

  <Accordion title="Konfigurationsschreibvorgänge aus Telegram-Ereignissen und -Befehlen">
    Schreibvorgänge für die Kanal-Konfiguration sind standardmäßig aktiviert (`configWrites !== false`).

    Von Telegram ausgelöste Schreibvorgänge umfassen:

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
    Standard ist Long Polling. Legen Sie für den Webhook-Modus `channels.telegram.webhookUrl` und `channels.telegram.webhookSecret` fest; optional `webhookPath`, `webhookHost`, `webhookPort` (Standardwerte `/telegram-webhook`, `127.0.0.1`, `8787`).

    Der lokale Listener bindet an `127.0.0.1:8787`. Für öffentlichen Ingress setzen Sie entweder einen Reverse-Proxy vor den lokalen Port oder legen `webhookHost: "0.0.0.0"` bewusst fest.

    Der Webhook-Modus validiert Request-Guards, das geheime Telegram-Token und den JSON-Body, bevor `200` an Telegram zurückgegeben wird.
    OpenClaw verarbeitet das Update dann asynchron über dieselben Bot-Lanes pro Chat/pro Thema wie beim Long Polling, sodass langsame Agent-Durchläufe das Zustellungs-ACK von Telegram nicht blockieren.

  </Accordion>

  <Accordion title="Limits, Wiederholung und CLI-Ziele">
    - `channels.telegram.textChunkLimit` ist standardmäßig 4000.
    - `channels.telegram.chunkMode="newline"` bevorzugt Absatzgrenzen (Leerzeilen) vor der Aufteilung nach Länge.
    - `channels.telegram.mediaMaxMb` (Standard 100) begrenzt die Größe eingehender und ausgehender Telegram-Medien.
    - `channels.telegram.mediaGroupFlushMs` (Standard 500) steuert, wie lange Telegram-Alben/Mediengruppen gepuffert werden, bevor OpenClaw sie als eine eingehende Nachricht weitergibt. Erhöhen Sie den Wert, wenn Albumteile spät eintreffen; verringern Sie ihn, um die Antwortlatenz für Alben zu reduzieren.
    - `channels.telegram.timeoutSeconds` überschreibt das Timeout des Telegram-API-Clients (wenn nicht gesetzt, gilt der grammY-Standard). Bot-Clients begrenzen konfigurierte Werte unterhalb des 60-Sekunden-Request-Guards für ausgehende Text-/Typing-Anfragen, damit grammY die sichtbare Antwortzustellung nicht abbricht, bevor OpenClaws Transport-Guard und Fallback ausgeführt werden können. Long Polling verwendet weiterhin einen 45-Sekunden-Request-Guard für `getUpdates`, damit inaktive Polls nicht unbegrenzt aufgegeben werden.
    - `channels.telegram.pollingStallThresholdMs` ist standardmäßig `120000`; passen Sie den Wert nur bei falsch-positiven Polling-Stall-Neustarts zwischen `30000` und `600000` an.
    - Der Verlauf des Gruppenkontexts verwendet `channels.telegram.historyLimit` oder `messages.groupChat.historyLimit` (Standard 50); `0` deaktiviert ihn.
    - Zusätzlicher Kontext für Antwort/Zitat/Weiterleitung wird derzeit so weitergegeben, wie er empfangen wurde.
    - Telegram-Zulassungslisten steuern primär, wer den Agent auslösen kann, nicht eine vollständige Redaktionsgrenze für Zusatzkontext.
    - Steuerungen für den DM-Verlauf:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - Die Konfiguration `channels.telegram.retry` gilt für Telegram-Sendehelfer (CLI/Tools/Aktionen) bei behebbaren ausgehenden API-Fehlern. Die Zustellung der endgültigen eingehenden Antwort verwendet ebenfalls eine begrenzte Safe-Send-Wiederholung bei Telegram-Fehlern vor der Verbindung, wiederholt jedoch keine mehrdeutigen Netzwerk-Hüllen nach dem Senden, die sichtbare Nachrichten duplizieren könnten.

    Das CLI-Sendeziel kann eine numerische Chat-ID oder ein Benutzername sein:

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

    Nur-Telegram-Poll-Flags:

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
    - `channels.telegram.actions.poll=false` deaktiviert das Erstellen von Telegram-Polls, während reguläre Sends aktiviert bleiben

  </Accordion>

  <Accordion title="Exec-Genehmigungen in Telegram">
    Telegram unterstützt Exec-Genehmigungen in Genehmiger-DMs und kann Prompts optional im ursprünglichen Chat oder Thema posten. Genehmiger müssen numerische Telegram-Benutzer-IDs sein.

    Konfigurationspfad:

    - `channels.telegram.execApprovals.enabled` (aktiviert sich automatisch, wenn mindestens ein Genehmiger auflösbar ist)
    - `channels.telegram.execApprovals.approvers` (fällt auf numerische Besitzer-IDs aus `commands.ownerAllowFrom` zurück)
    - `channels.telegram.execApprovals.target`: `dm` (Standard) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` und `defaultTo` steuern, wer mit dem Bot sprechen kann und wohin er normale Antworten sendet. Sie machen niemanden zu einem Exec-Genehmiger. Die erste genehmigte DM-Kopplung bootstrapt `commands.ownerAllowFrom`, wenn noch kein Befehlsbesitzer vorhanden ist, sodass die Einrichtung mit einem Besitzer weiterhin funktioniert, ohne IDs unter `execApprovals.approvers` zu duplizieren.

    Die Kanalzustellung zeigt den Befehlstext im Chat; aktivieren Sie `channel` oder `both` nur in vertrauenswürdigen Gruppen/Themen. Wenn der Prompt in einem Forum-Thema landet, bewahrt OpenClaw das Thema für den Genehmigungs-Prompt und die Folgeaktion. Exec-Genehmigungen laufen standardmäßig nach 30 Minuten ab.

    Inline-Genehmigungsbuttons erfordern außerdem, dass `channels.telegram.capabilities.inlineButtons` die Zieloberfläche (`dm`, `group` oder `all`) erlaubt. Genehmigungs-IDs mit dem Präfix `plugin:` werden über Plugin-Genehmigungen aufgelöst; andere werden zuerst über Exec-Genehmigungen aufgelöst.

    Siehe [Exec-Genehmigungen](/de/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Steuerung von Fehlerantworten

Wenn der Agent auf einen Zustellungs- oder Provider-Fehler stößt, kann Telegram entweder mit dem Fehlertext antworten oder ihn unterdrücken. Zwei Konfigurationsschlüssel steuern dieses Verhalten:

| Schlüssel                           | Werte             | Standard | Beschreibung                                                                                              |
| ----------------------------------- | ----------------- | -------- | --------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`  | `reply` sendet eine freundliche Fehlermeldung an den Chat. `silent` unterdrückt Fehlerantworten vollständig. |
| `channels.telegram.errorCooldownMs` | Zahl (ms)         | `60000`  | Mindestzeit zwischen Fehlerantworten an denselben Chat. Verhindert Fehler-Spam während Ausfällen.         |

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
  <Accordion title="Bot antwortet nicht auf Gruppennachrichten ohne Erwähnung">

    - Wenn `requireMention=false`, muss der Telegram-Privatsphäre-Modus vollständige Sichtbarkeit erlauben.
      - BotFather: `/setprivacy` -> Deaktivieren
      - Entfernen Sie den Bot anschließend aus der Gruppe und fügen Sie ihn erneut hinzu
    - `openclaw channels status` warnt, wenn die Konfiguration Gruppennachrichten ohne Erwähnung erwartet.
    - `openclaw channels status --probe` kann explizite numerische Gruppen-IDs prüfen; die Wildcard `"*"` kann nicht auf Mitgliedschaft geprüft werden.
    - Schneller Sitzungstest: `/activation always`.

  </Accordion>

  <Accordion title="Bot sieht überhaupt keine Gruppennachrichten">

    - Wenn `channels.telegram.groups` vorhanden ist, muss die Gruppe aufgeführt sein (oder `"*"` enthalten)
    - Bot-Mitgliedschaft in der Gruppe verifizieren
    - Logs prüfen: `openclaw logs --follow` für Gründe zum Überspringen

  </Accordion>

  <Accordion title="Befehle funktionieren teilweise oder gar nicht">

    - Autorisieren Sie Ihre Absenderidentität (Kopplung und/oder numerisches `allowFrom`)
    - Befehlsautorisierung gilt weiterhin, auch wenn die Gruppenrichtlinie `open` ist
    - `setMyCommands failed` mit `BOT_COMMANDS_TOO_MUCH` bedeutet, dass das native Menü zu viele Einträge hat; reduzieren Sie Plugin-/Skill-/benutzerdefinierte Befehle oder deaktivieren Sie native Menüs
    - `deleteMyCommands`- / `setMyCommands`-Startaufrufe und `sendChatAction`-Typing-Aufrufe sind begrenzt und werden bei Request-Timeout einmal über Telegrams Transport-Fallback wiederholt. Anhaltende Netzwerk-/Fetch-Fehler weisen in der Regel auf DNS-/HTTPS-Erreichbarkeitsprobleme zu `api.telegram.org` hin

  </Accordion>

  <Accordion title="Start meldet nicht autorisiertes Token">

    - `getMe returned 401` ist ein Telegram-Authentifizierungsfehler für das konfigurierte Bot-Token.
    - Kopieren oder generieren Sie das Bot-Token in BotFather erneut und aktualisieren Sie dann `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` oder `TELEGRAM_BOT_TOKEN` für das Standardkonto.
    - `deleteWebhook 401 Unauthorized` beim Start ist ebenfalls ein Authentifizierungsfehler; dies als „kein Webhook vorhanden“ zu behandeln, würde denselben Fehler durch ein ungültiges Token nur auf spätere API-Aufrufe verschieben.

  </Accordion>

  <Accordion title="Polling oder Netzwerkinstabilität">

    - Node 22+ + benutzerdefiniertes fetch/Proxy kann sofortiges Abbruchverhalten auslösen, wenn AbortSignal-Typen nicht übereinstimmen.
    - Einige Hosts lösen `api.telegram.org` zuerst zu IPv6 auf; defekter IPv6-Egress kann zu zeitweiligen Telegram-API-Fehlern führen.
    - Wenn Logs `TypeError: fetch failed` oder `Network request for 'getUpdates' failed!` enthalten, wiederholt OpenClaw diese nun als wiederherstellbare Netzwerkfehler.
    - Beim Polling-Start verwendet OpenClaw den erfolgreichen Start-`getMe`-Probe für grammY wieder, sodass der Runner vor dem ersten `getUpdates` keinen zweiten `getMe` benötigt.
    - Wenn `deleteWebhook` beim Polling-Start mit einem vorübergehenden Netzwerkfehler fehlschlägt, fährt OpenClaw mit Long Polling fort, statt einen weiteren Control-Plane-Aufruf vor dem Polling auszuführen. Ein weiterhin aktiver Webhook erscheint als `getUpdates`-Konflikt; OpenClaw baut dann den Telegram-Transport neu auf und versucht die Webhook-Bereinigung erneut.
    - Wenn Telegram-Sockets in einem kurzen festen Takt wiederverwendet werden, prüfen Sie auf einen niedrigen Wert für `channels.telegram.timeoutSeconds`; Bot-Clients begrenzen konfigurierte Werte unterhalb der ausgehenden und `getUpdates`-Request-Guards, ältere Releases konnten jedoch jeden Poll oder jede Antwort abbrechen, wenn dies unter diese Guards gesetzt war.
    - Wenn Logs `Polling stall detected` enthalten, startet OpenClaw standardmäßig das Polling neu und baut den Telegram-Transport neu auf, nachdem 120 Sekunden lang keine abgeschlossene Long-Poll-Liveness festgestellt wurde.
    - `openclaw channels status --probe` und `openclaw doctor` warnen, wenn ein laufendes Polling-Konto nach der Start-Kulanzzeit `getUpdates` nicht abgeschlossen hat, wenn ein laufendes Webhook-Konto nach der Start-Kulanzzeit `setWebhook` nicht abgeschlossen hat oder wenn die letzte erfolgreiche Polling-Transportaktivität veraltet ist.
    - Erhöhen Sie `channels.telegram.pollingStallThresholdMs` nur, wenn lang laufende `getUpdates`-Aufrufe gesund sind, Ihr Host aber weiterhin fälschliche Polling-Stall-Neustarts meldet. Dauerhafte Stalls deuten in der Regel auf Proxy-, DNS-, IPv6- oder TLS-Egress-Probleme zwischen dem Host und `api.telegram.org` hin.
    - Telegram berücksichtigt für den Bot-API-Transport auch Prozess-Proxy-Umgebungsvariablen, einschließlich `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` und deren Kleinschreibungsvarianten. `NO_PROXY` / `no_proxy` kann `api.telegram.org` weiterhin umgehen.
    - Wenn der von OpenClaw verwaltete Proxy über `OPENCLAW_PROXY_URL` für eine Service-Umgebung konfiguriert ist und keine Standard-Proxy-Umgebungsvariable vorhanden ist, verwendet Telegram diese URL ebenfalls für den Bot-API-Transport.
    - Leiten Sie Telegram-API-Aufrufe auf VPS-Hosts mit instabilem direktem Egress/TLS über `channels.telegram.proxy`:

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

    - Antworten aus dem RFC-2544-Benchmark-Bereich (`198.18.0.0/15`) sind für Telegram-Mediendownloads standardmäßig bereits erlaubt. Wenn ein vertrauenswürdiger Fake-IP- oder transparenter Proxy `api.telegram.org` während Mediendownloads auf eine andere private/interne/Sondernutzungsadresse umschreibt, können Sie den Telegram-spezifischen Bypass aktivieren:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Dasselbe Opt-in ist pro Konto unter
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork` verfügbar.
    - Wenn Ihr Proxy Telegram-Medienhosts nach `198.18.x.x` auflöst, lassen Sie
      das gefährliche Flag zunächst deaktiviert. Telegram-Medien erlauben den
      RFC-2544-Benchmark-Bereich standardmäßig bereits.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` schwächt die Telegram-
      Medien-SSRF-Schutzmaßnahmen. Verwenden Sie es nur für vertrauenswürdige, vom Betreiber kontrollierte Proxy-
      Umgebungen wie Clash-, Mihomo- oder Surge-Fake-IP-Routing, wenn diese
      private oder Sondernutzungsantworten außerhalb des RFC-2544-Benchmark-
      Bereichs synthetisieren. Lassen Sie es für normalen öffentlichen Telegram-Zugriff deaktiviert.
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

<Accordion title="Telegram-Felder mit hoher Aussagekraft">

- Start/Authentifizierung: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` muss auf eine reguläre Datei zeigen; Symlinks werden abgelehnt)
- Zugriffskontrolle: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` auf oberster Ebene (`type: "acp"`)
- Ausführungsgenehmigungen: `execApprovals`, `accounts.*.execApprovals`
- Befehl/Menü: `commands.native`, `commands.nativeSkills`, `customCommands`
- Threading/Antworten: `replyToMode`, `dm.threadReplies`, `direct.*.threadReplies`
- Streaming: `streaming` (Vorschau), `streaming.preview.toolProgress`, `blockStreaming`
- Formatierung/Zustellung: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- Medien/Netzwerk: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- benutzerdefinierte API-Root: `apiRoot` (nur Bot-API-Root; `/bot<TOKEN>` nicht einschließen)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- Aktionen/Fähigkeiten: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- Reaktionen: `reactionNotifications`, `reactionLevel`
- Fehler: `errorPolicy`, `errorCooldownMs`
- Schreibvorgänge/Verlauf: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Priorität bei mehreren Konten: Wenn zwei oder mehr Konto-IDs konfiguriert sind, setzen Sie `channels.telegram.defaultAccount` (oder schließen Sie `channels.telegram.accounts.default` ein), um das Standard-Routing explizit zu machen. Andernfalls fällt OpenClaw auf die erste normalisierte Konto-ID zurück, und `openclaw doctor` warnt. Benannte Konten erben `channels.telegram.allowFrom` / `groupAllowFrom`, jedoch keine Werte von `accounts.default.*`.
</Note>

## Verwandt

<CardGroup cols={2}>
  <Card title="Kopplung" icon="link" href="/de/channels/pairing">
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
    Channel-übergreifende Diagnosen.
  </Card>
</CardGroup>
