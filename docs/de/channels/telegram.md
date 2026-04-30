---
read_when:
    - Arbeiten an Telegram-Funktionen oder Webhooks
summary: Status, Funktionen und Konfiguration der Telegram-Bot-Unterstützung
title: Telegram
x-i18n:
    generated_at: "2026-04-30T16:27:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: d18ca6c7ab39d7d34848c562857661501d8364329f6e5a266213aa23846047dd
    source_path: channels/telegram.md
    workflow: 16
---

Produktionsreif für Bot-DMs und Gruppen über grammY. Long Polling ist der Standardmodus; der Webhook-Modus ist optional.

<CardGroup cols={3}>
  <Card title="Kopplung" icon="link" href="/de/channels/pairing">
    Die Standard-DM-Richtlinie für Telegram ist Kopplung.
  </Card>
  <Card title="Channel-Fehlerbehebung" icon="wrench" href="/de/channels/troubleshooting">
    Channel-übergreifende Diagnose- und Reparatur-Playbooks.
  </Card>
  <Card title="Gateway-Konfiguration" icon="settings" href="/de/gateway/configuration">
    Vollständige Muster und Beispiele für die Channel-Konfiguration.
  </Card>
</CardGroup>

## Schnelleinrichtung

<Steps>
  <Step title="Bot-Token in BotFather erstellen">
    Öffnen Sie Telegram und chatten Sie mit **@BotFather** (prüfen Sie, dass der Handle genau `@BotFather` lautet).

    Führen Sie `/newbot` aus, folgen Sie den Eingabeaufforderungen und speichern Sie das Token.

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
    Telegram verwendet **nicht** `openclaw channels login telegram`; konfigurieren Sie das Token in der Konfiguration/Env und starten Sie dann das Gateway.

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
    Fügen Sie den Bot zu Ihrer Gruppe hinzu und setzen Sie dann `channels.telegram.groups` und `groupPolicy` passend zu Ihrem Zugriffsmodell.
  </Step>
</Steps>

<Note>
Die Reihenfolge der Token-Auflösung ist kontobewusst. In der Praxis haben Konfigurationswerte Vorrang vor dem Env-Fallback, und `TELEGRAM_BOT_TOKEN` gilt nur für das Standardkonto.
</Note>

## Telegram-seitige Einstellungen

<AccordionGroup>
  <Accordion title="Datenschutzmodus und Gruppensichtbarkeit">
    Telegram-Bots verwenden standardmäßig den **Datenschutzmodus**, der begrenzt, welche Gruppennachrichten sie empfangen.

    Wenn der Bot alle Gruppennachrichten sehen muss, tun Sie eines von beidem:

    - Deaktivieren Sie den Datenschutzmodus über `/setprivacy`, oder
    - machen Sie den Bot zum Gruppenadministrator.

    Wenn Sie den Datenschutzmodus umschalten, entfernen Sie den Bot in jeder Gruppe und fügen Sie ihn erneut hinzu, damit Telegram die Änderung übernimmt.

  </Accordion>

  <Accordion title="Gruppenberechtigungen">
    Der Administratorstatus wird in den Telegram-Gruppeneinstellungen gesteuert.

    Admin-Bots empfangen alle Gruppennachrichten, was für durchgängig aktive Gruppenfunktionen nützlich ist.

  </Accordion>

  <Accordion title="Hilfreiche BotFather-Schalter">

    - `/setjoingroups`, um Gruppenhinzufügungen zu erlauben/zu verweigern
    - `/setprivacy` für das Verhalten der Gruppensichtbarkeit

  </Accordion>
</AccordionGroup>

## Zugriffskontrolle und Aktivierung

<Tabs>
  <Tab title="DM-Richtlinie">
    `channels.telegram.dmPolicy` steuert den Zugriff auf Direktnachrichten:

    - `pairing` (Standard)
    - `allowlist` (erfordert mindestens eine Absender-ID in `allowFrom`)
    - `open` (erfordert, dass `allowFrom` `"*"` enthält)
    - `disabled`

    `dmPolicy: "open"` mit `allowFrom: ["*"]` lässt jedes Telegram-Konto, das den Bot-Benutzernamen findet oder errät, den Bot befehligen. Verwenden Sie dies nur für absichtlich öffentliche Bots mit streng eingeschränkten Tools; Bots mit einem einzigen Besitzer sollten `allowlist` mit numerischen Benutzer-IDs verwenden.

    `channels.telegram.allowFrom` akzeptiert numerische Telegram-Benutzer-IDs. Die Präfixe `telegram:` / `tg:` werden akzeptiert und normalisiert.
    In Multi-Konto-Konfigurationen wird ein restriktives oberstes `channels.telegram.allowFrom` als Sicherheitsgrenze behandelt: `allowFrom: ["*"]`-Einträge auf Kontoebene machen dieses Konto nicht öffentlich, sofern die effektive Konto-Allowlist nach dem Zusammenführen nicht weiterhin einen expliziten Platzhalter enthält.
    `dmPolicy: "allowlist"` mit leerem `allowFrom` blockiert alle DMs und wird von der Konfigurationsvalidierung abgelehnt.
    Die Einrichtung fragt nur nach numerischen Benutzer-IDs.
    Wenn Sie aktualisiert haben und Ihre Konfiguration `@username`-Allowlist-Einträge enthält, führen Sie `openclaw doctor --fix` aus, um sie aufzulösen (bestmöglich; erfordert ein Telegram-Bot-Token).
    Wenn Sie sich zuvor auf Pairing-Store-Allowlist-Dateien verlassen haben, kann `openclaw doctor --fix` Einträge in Allowlist-Abläufen in `channels.telegram.allowFrom` wiederherstellen (zum Beispiel, wenn `dmPolicy: "allowlist"` noch keine expliziten IDs hat).

    Für Bots mit einem einzigen Besitzer sollten Sie `dmPolicy: "allowlist"` mit expliziten numerischen `allowFrom`-IDs bevorzugen, damit die Zugriffsrichtlinie dauerhaft in der Konfiguration bleibt (statt von früheren Kopplungsgenehmigungen abhängig zu sein).

    Häufige Verwirrung: Die Genehmigung der DM-Kopplung bedeutet nicht „dieser Absender ist überall autorisiert“.
    Kopplung gewährt DM-Zugriff. Wenn noch kein Befehlsbesitzer existiert, setzt die erste genehmigte Kopplung außerdem `commands.ownerAllowFrom`, sodass nur Besitzer betreffenden Befehle und Exec-Genehmigungen ein explizites Operatorkonto haben.
    Die Absenderautorisierung in Gruppen kommt weiterhin aus expliziten Konfigurations-Allowlists.
    Wenn Sie möchten, dass „ich einmal autorisiert bin und sowohl DMs als auch Gruppenbefehle funktionieren“, setzen Sie Ihre numerische Telegram-Benutzer-ID in `channels.telegram.allowFrom`; stellen Sie für nur Besitzer betreffende Befehle sicher, dass `commands.ownerAllowFrom` `telegram:<your user id>` enthält.

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
         - mit `groupPolicy: "open"`: Jede Gruppe kann Gruppen-ID-Prüfungen bestehen
         - mit `groupPolicy: "allowlist"` (Standard): Gruppen werden blockiert, bis Sie `groups`-Einträge (oder `"*"`) hinzufügen
       - `groups` konfiguriert: fungiert als Allowlist (explizite IDs oder `"*"`)

    2. **Welche Absender in Gruppen erlaubt sind** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (Standard)
       - `disabled`

    `groupAllowFrom` wird für die Gruppen-Absenderfilterung verwendet. Wenn es nicht gesetzt ist, fällt Telegram auf `allowFrom` zurück.
    `groupAllowFrom`-Einträge sollten numerische Telegram-Benutzer-IDs sein (Präfixe `telegram:` / `tg:` werden normalisiert).
    Legen Sie keine Telegram-Gruppen- oder Supergruppen-Chat-IDs in `groupAllowFrom` ab. Negative Chat-IDs gehören unter `channels.telegram.groups`.
    Nicht numerische Einträge werden für die Absenderautorisierung ignoriert.
    Sicherheitsgrenze (`2026.2.25+`): Gruppen-Absenderauthentifizierung erbt **keine** DM-Pairing-Store-Genehmigungen.
    Kopplung bleibt nur für DMs. Setzen Sie für Gruppen `groupAllowFrom` oder `allowFrom` pro Gruppe/pro Thema.
    Wenn `groupAllowFrom` nicht gesetzt ist, fällt Telegram auf die Konfiguration `allowFrom` zurück, nicht auf den Pairing Store.
    Praktisches Muster für Bots mit einem einzigen Besitzer: Setzen Sie Ihre Benutzer-ID in `channels.telegram.allowFrom`, lassen Sie `groupAllowFrom` unset und erlauben Sie die Zielgruppen unter `channels.telegram.groups`.
    Laufzeithinweis: Wenn `channels.telegram` vollständig fehlt, verwendet die Runtime standardmäßig das ausfallsichere `groupPolicy="allowlist"`, sofern `channels.defaults.groupPolicy` nicht explizit gesetzt ist.

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

      - Legen Sie negative Telegram-Gruppen- oder Supergruppen-Chat-IDs wie `-1001234567890` unter `channels.telegram.groups` ab.
      - Legen Sie Telegram-Benutzer-IDs wie `8734062810` unter `groupAllowFrom` ab, wenn Sie einschränken möchten, welche Personen innerhalb einer erlaubten Gruppe den Bot auslösen können.
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

    Gruppen-Chat-ID abrufen:

    - Leiten Sie eine Gruppennachricht an `@userinfobot` / `@getidsbot` weiter
    - oder lesen Sie `chat.id` aus `openclaw logs --follow`
    - oder prüfen Sie `getUpdates` der Bot API

  </Tab>
</Tabs>

## Laufzeitverhalten

- Telegram gehört dem Gateway-Prozess.
- Das Routing ist deterministisch: Telegram-Eingänge antworten zurück an Telegram (das Modell wählt keine Channels).
- Eingehende Nachrichten werden in den gemeinsamen Channel-Umschlag mit Antwortmetadaten und Medienplatzhaltern normalisiert.
- Gruppensitzungen werden nach Gruppen-ID isoliert. Forumthemen hängen `:topic:<threadId>` an, um Themen zu isolieren.
- DM-Nachrichten können `message_thread_id` enthalten; OpenClaw routet sie mit thread-bewussten Sitzungsschlüsseln und bewahrt die Thread-ID für Antworten.
- Long Polling verwendet den grammY Runner mit Sequenzierung pro Chat/pro Thread. Die allgemeine Runner-Sink-Parallelität verwendet `agents.defaults.maxConcurrent`.
- Long Polling ist innerhalb jedes Gateway-Prozesses geschützt, sodass immer nur ein aktiver Poller gleichzeitig ein Bot-Token verwenden kann. Wenn Sie weiterhin `getUpdates`-409-Konflikte sehen, verwendet wahrscheinlich ein anderes OpenClaw-Gateway, Skript oder externer Poller dasselbe Token.
- Long-Polling-Watchdog-Neustarts werden standardmäßig nach 120 Sekunden ohne abgeschlossene `getUpdates`-Liveness ausgelöst. Erhöhen Sie `channels.telegram.pollingStallThresholdMs` nur, wenn Ihre Bereitstellung während lang laufender Arbeit weiterhin fälschliche Polling-Stall-Neustarts sieht. Der Wert ist in Millisekunden angegeben und von `30000` bis `600000` zulässig; Überschreibungen pro Konto werden unterstützt.
- Die Telegram Bot API unterstützt keine Lesebestätigungen (`sendReadReceipts` gilt nicht).

## Funktionsreferenz

<AccordionGroup>
  <Accordion title="Live-Stream-Vorschau (Nachrichtenbearbeitungen)">
    OpenClaw kann Teilantworten in Echtzeit streamen:

    - direkte Chats: Vorschaunachricht + `editMessageText`
    - Gruppen/Themen: Vorschaunachricht + `editMessageText`

    Anforderung:

    - `channels.telegram.streaming` ist `off | partial | block | progress` (Standard: `partial`)
    - `progress` wird auf Telegram auf `partial` abgebildet (Kompatibilität mit Channel-übergreifender Benennung)
    - `streaming.preview.toolProgress` steuert, ob Tool-/Fortschrittsaktualisierungen dieselbe bearbeitete Vorschaunachricht wiederverwenden (Standard: `true`, wenn Vorschau-Streaming aktiv ist)
    - ältere `channels.telegram.streamMode`- und boolesche `streaming`-Werte werden erkannt; führen Sie `openclaw doctor --fix` aus, um sie zu `channels.telegram.streaming.mode` zu migrieren

    Tool-Fortschritts-Vorschauaktualisierungen sind die kurzen „Working...“-Zeilen, die angezeigt werden, während Tools laufen, zum Beispiel Befehlsausführung, Dateilesevorgänge, Planungsaktualisierungen oder Patch-Zusammenfassungen. Telegram lässt diese standardmäßig aktiviert, um dem veröffentlichten OpenClaw-Verhalten ab `v2026.4.22` und später zu entsprechen. Um die bearbeitete Vorschau für Antworttext beizubehalten, aber Tool-Fortschrittszeilen auszublenden, setzen Sie:

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

    Verwenden Sie `streaming.mode: "off"` nur, wenn Sie ausschließlich finale Zustellung möchten: Telegram-Vorschauänderungen sind deaktiviert, und generisches Tool-/Fortschrittsgerede wird unterdrückt, statt als eigenständige „Working...“-Nachrichten gesendet zu werden. Genehmigungsaufforderungen, Medien-Payloads und Fehler werden weiterhin über die normale finale Zustellung geroutet. Verwenden Sie `streaming.preview.toolProgress: false`, wenn Sie nur Antwortvorschau-Bearbeitungen beibehalten und zugleich Tool-Fortschrittsstatuszeilen ausblenden möchten.

    Für reine Textantworten:

    - kurze Vorschauen für Direktnachrichten/Gruppen/Themen: OpenClaw behält dieselbe Vorschau-Nachricht bei und führt eine abschließende Bearbeitung direkt daran durch
    - Vorschauen, die älter als etwa eine Minute sind: OpenClaw sendet die fertige Antwort als neue finale Nachricht und räumt anschließend die Vorschau auf, sodass der sichtbare Zeitstempel in Telegram die Abschlusszeit statt der Erstellungszeit der Vorschau widerspiegelt

    Bei komplexen Antworten (zum Beispiel Medien-Payloads) fällt OpenClaw auf die normale finale Zustellung zurück und räumt anschließend die Vorschau-Nachricht auf.

    Vorschau-Streaming ist getrennt von Block-Streaming. Wenn Block-Streaming für Telegram ausdrücklich aktiviert ist, überspringt OpenClaw den Vorschau-Stream, um doppeltes Streaming zu vermeiden.

    Nur Telegram: Reasoning-Stream:

    - `/reasoning stream` sendet Reasoning während der Generierung an die Live-Vorschau
    - die finale Antwort wird ohne Reasoning-Text gesendet

  </Accordion>

  <Accordion title="Formatierung und HTML-Fallback">
    Ausgehender Text verwendet Telegram `parse_mode: "HTML"`.

    - Markdown-ähnlicher Text wird zu Telegram-sicherem HTML gerendert.
    - Rohes Modell-HTML wird escaped, um Telegram-Parse-Fehler zu reduzieren.
    - Wenn Telegram geparstes HTML ablehnt, versucht OpenClaw es erneut als Klartext.

    Link-Vorschauen sind standardmäßig aktiviert und können mit `channels.telegram.linkPreview: false` deaktiviert werden.

  </Accordion>

  <Accordion title="Native Befehle und benutzerdefinierte Befehle">
    Die Registrierung des Telegram-Befehlsmenüs wird beim Start mit `setMyCommands` verarbeitet.

    Standardwerte für native Befehle:

    - `commands.native: "auto"` aktiviert native Befehle für Telegram

    Benutzerdefinierte Einträge zum Befehlsmenü hinzufügen:

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
    - Plugin-/Skill-Befehle können beim Eingeben weiterhin funktionieren, auch wenn sie nicht im Telegram-Menü angezeigt werden

    Wenn native Befehle deaktiviert sind, werden integrierte Befehle entfernt. Benutzerdefinierte/Plugin-Befehle können bei entsprechender Konfiguration weiterhin registriert werden.

    Häufige Einrichtungsfehler:

    - `setMyCommands failed` mit `BOT_COMMANDS_TOO_MUCH` bedeutet, dass das Telegram-Menü nach dem Kürzen immer noch übergelaufen ist; reduzieren Sie Plugin-/Skill-/benutzerdefinierte Befehle oder deaktivieren Sie `channels.telegram.commands.native`.
    - Wenn `deleteWebhook`, `deleteMyCommands` oder `setMyCommands` mit `404: Not Found` fehlschlägt, während direkte Bot-API-curl-Befehle funktionieren, kann das bedeuten, dass `channels.telegram.apiRoot` auf den vollständigen `/bot<TOKEN>`-Endpunkt gesetzt wurde. `apiRoot` darf nur der Bot-API-Root sein, und `openclaw doctor --fix` entfernt ein versehentliches angehängtes `/bot<TOKEN>`.
    - `getMe returned 401` bedeutet, dass Telegram das konfigurierte Bot-Token abgelehnt hat. Aktualisieren Sie `botToken`, `tokenFile` oder `TELEGRAM_BOT_TOKEN` mit dem aktuellen BotFather-Token; OpenClaw stoppt vor dem Polling, daher wird dies nicht als Fehler beim Webhook-Aufräumen gemeldet.
    - `setMyCommands failed` mit Netzwerk-/Fetch-Fehlern bedeutet in der Regel, dass ausgehendes DNS/HTTPS zu `api.telegram.org` blockiert ist.

    ### Geräte-Pairing-Befehle (`device-pair`-Plugin)

    Wenn das `device-pair`-Plugin installiert ist:

    1. `/pair` generiert Einrichtungscode
    2. Code in die iOS-App einfügen
    3. `/pair pending` listet ausstehende Anfragen auf (einschließlich Rolle/Scopes)
    4. Anfrage genehmigen:
       - `/pair approve <requestId>` für ausdrückliche Genehmigung
       - `/pair approve`, wenn nur eine Anfrage aussteht
       - `/pair approve latest` für die neueste

    Der Einrichtungscode enthält ein kurzlebiges Bootstrap-Token. Die integrierte Bootstrap-Übergabe hält das primäre Node-Token bei `scopes: []`; jedes übergebene Operator-Token bleibt auf `operator.approvals`, `operator.read`, `operator.talk.secrets` und `operator.write` begrenzt. Bootstrap-Scope-Prüfungen sind rollenpräfixiert, sodass diese Operator-Allowlist nur Operator-Anfragen erfüllt; Nicht-Operator-Rollen benötigen weiterhin Scopes unter ihrem eigenen Rollenpräfix.

    Wenn ein Gerät es mit geänderten Auth-Details erneut versucht (zum Beispiel Rolle/Scopes/öffentlicher Schlüssel), wird die vorherige ausstehende Anfrage ersetzt und die neue Anfrage verwendet eine andere `requestId`. Führen Sie `/pair pending` vor der Genehmigung erneut aus.

    Weitere Details: [Pairing](/de/channels/pairing#pair-via-telegram-recommended-for-ios).

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

    Das Legacy-Format `capabilities: ["inlineButtons"]` wird `inlineButtons: "all"` zugeordnet.

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
    Telegram-Tool-Aktionen umfassen:

    - `sendMessage` (`to`, `content`, optional `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, optional `iconColor`, `iconCustomEmojiId`)

    Kanal-Nachrichtenaktionen stellen ergonomische Aliase bereit (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Steuerungen für Gating:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (Standard: deaktiviert)

    Hinweis: `edit` und `topic-create` sind derzeit standardmäßig aktiviert und haben keine separaten `channels.telegram.actions.*`-Schalter.
    Runtime-Sendungen verwenden den aktiven Config-/Secrets-Snapshot (Start/Reload), daher führen Aktionspfade keine Ad-hoc-Neuauflösung von SecretRef pro Sendung aus.

    Semantik zum Entfernen von Reaktionen: [/tools/reactions](/de/tools/reactions)

  </Accordion>

  <Accordion title="Tags für Antwort-Threading">
    Telegram unterstützt explizite Antwort-Threading-Tags in generierter Ausgabe:

    - `[[reply_to_current]]` antwortet auf die auslösende Nachricht
    - `[[reply_to:<id>]]` antwortet auf eine bestimmte Telegram-Nachrichten-ID

    `channels.telegram.replyToMode` steuert die Verarbeitung:

    - `off` (Standard)
    - `first`
    - `all`

    Wenn Antwort-Threading aktiviert ist und der ursprüngliche Telegram-Text oder die ursprüngliche Beschriftung verfügbar ist, fügt OpenClaw automatisch einen nativen Telegram-Zitatauszug ein. Telegram begrenzt nativen Zitattext auf 1024 UTF-16-Codeeinheiten, daher werden längere Nachrichten vom Anfang an zitiert und fallen auf eine einfache Antwort zurück, wenn Telegram das Zitat ablehnt.

    Hinweis: `off` deaktiviert implizites Antwort-Threading. Explizite `[[reply_to_*]]`-Tags werden weiterhin beachtet.

  </Accordion>

  <Accordion title="Forum-Themen und Thread-Verhalten">
    Forum-Supergruppen:

    - Themen-Sitzungsschlüssel hängen `:topic:<threadId>` an
    - Antworten und Tippen zielen auf den Themen-Thread
    - Themen-Config-Pfad:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Sonderfall allgemeines Thema (`threadId=1`):

    - Nachrichtensendungen lassen `message_thread_id` weg (Telegram lehnt `sendMessage(...thread_id=1)` ab)
    - Tippaktionen enthalten weiterhin `message_thread_id`

    Themenvererbung: Themeneinträge erben Gruppeneinstellungen, sofern sie nicht überschrieben werden (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` ist nur themenspezifisch und wird nicht von Gruppenstandards geerbt.

    **Agent-Routing pro Thema**: Jedes Thema kann an einen anderen Agent weitergeleitet werden, indem `agentId` in der Themen-Config gesetzt wird. Dadurch erhält jedes Thema seinen eigenen isolierten Workspace, Speicher und seine eigene Sitzung. Beispiel:

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

    **Persistente ACP-Themenbindung**: Forum-Themen können ACP-Harness-Sitzungen über typisierte ACP-Bindings auf oberster Ebene pinnen (`bindings[]` mit `type: "acp"` und `match.channel: "telegram"`, `peer.kind: "group"` sowie einer themenqualifizierten ID wie `-1001234567890:topic:42`). Derzeit auf Forum-Themen in Gruppen/Supergruppen beschränkt. Siehe [ACP Agents](/de/tools/acp-agents).

    **Thread-gebundener ACP-Spawn aus dem Chat**: `/acp spawn <agent> --thread here|auto` bindet das aktuelle Thema an eine neue ACP-Sitzung; Folgebeiträge werden direkt dorthin geleitet. OpenClaw pinnt die Spawn-Bestätigung im Thema. Erfordert `channels.telegram.threadBindings.spawnAcpSessions=true`.

    Der Template-Kontext stellt `MessageThreadId` und `IsForum` bereit. Direktnachricht-Chats mit `message_thread_id` behalten Direktnachricht-Routing bei, verwenden aber thread-fähige Sitzungsschlüssel.

  </Accordion>

  <Accordion title="Audio, Video und Sticker">
    ### Audio-Nachrichten

    Telegram unterscheidet zwischen Sprachnachrichten und Audiodateien.

    - Standard: Verhalten wie Audiodatei
    - Tag `[[audio_as_voice]]` in der Agent-Antwort, um Versand als Sprachnachricht zu erzwingen
    - eingehende Sprachnachrichten-Transkripte werden im Agent-Kontext als maschinell generierter,
      nicht vertrauenswürdiger Text gerahmt; Erwähnungserkennung verwendet weiterhin das rohe
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

    ### Video-Nachrichten

    Telegram unterscheidet zwischen Videodateien und Videonachrichten.

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

    Videonachrichten unterstützen keine Beschriftungen; bereitgestellter Nachrichtentext wird separat gesendet.

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

    Wenn aktiviert, stellt OpenClaw Systemereignisse wie die folgenden in die Warteschlange:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Config:

    - `channels.telegram.reactionNotifications`: `off | own | all` (Standard: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (Standard: `minimal`)

    Hinweise:

    - `own` bedeutet nur Benutzerreaktionen auf vom Bot gesendete Nachrichten (Best-Effort über den Cache gesendeter Nachrichten).
    - Reaktionsereignisse beachten weiterhin die Telegram-Zugriffskontrollen (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); nicht autorisierte Absender werden verworfen.
    - Telegram stellt in Reaktions-Updates keine Thread-IDs bereit.
      - Nicht-Forum-Gruppen werden an die Gruppenchat-Sitzung geleitet
      - Forum-Gruppen werden an die Sitzung des allgemeinen Gruppenthemas (`:topic:1`) geleitet, nicht an das exakte Ursprungsthema

    `allowed_updates` für Polling/Webhook enthält `message_reaction` automatisch.

  </Accordion>

  <Accordion title="Bestätigungsreaktionen">
    `ackReaction` sendet ein Bestätigungs-Emoji, während OpenClaw eine eingehende Nachricht verarbeitet.

    Auflösungsreihenfolge:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - Fallback auf Emoji der Agent-Identität (`agents.list[].identity.emoji`, sonst "👀")

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
    Standard ist Long Polling. Setzen Sie für den Webhook-Modus `channels.telegram.webhookUrl` und `channels.telegram.webhookSecret`; optional `webhookPath`, `webhookHost`, `webhookPort` (Standardwerte `/telegram-webhook`, `127.0.0.1`, `8787`).

    Der lokale Listener bindet an `127.0.0.1:8787`. Für öffentlichen Ingress setzen Sie entweder einen Reverse Proxy vor den lokalen Port oder setzen `webhookHost: "0.0.0.0"` bewusst.

    Der Webhook-Modus validiert Request-Guards, das geheime Telegram-Token und den JSON-Body, bevor `200` an Telegram zurückgegeben wird.
    OpenClaw verarbeitet das Update anschließend asynchron über dieselben Bot-Lanes pro Chat/pro Thema, die auch Long Polling verwendet. Dadurch blockieren langsame Agent-Turns nicht Telegrams Zustellungs-ACK.

  </Accordion>

  <Accordion title="Limits, Wiederholungen und CLI-Ziele">
    - `channels.telegram.textChunkLimit` ist standardmäßig 4000.
    - `channels.telegram.chunkMode="newline"` bevorzugt Absatzgrenzen (Leerzeilen), bevor nach Länge aufgeteilt wird.
    - `channels.telegram.mediaMaxMb` (Standard 100) begrenzt die Größe eingehender und ausgehender Telegram-Medien.
    - `channels.telegram.timeoutSeconds` überschreibt das Timeout des Telegram-API-Clients (wenn nicht gesetzt, gilt der grammY-Standard). Bot-Clients für Long Polling begrenzen konfigurierte Werte unterhalb des 45-Sekunden-Request-Guards von `getUpdates`, damit inaktive Polls nicht abgebrochen werden, bevor das 30-Sekunden-Poll-Fenster abgeschlossen ist.
    - `channels.telegram.pollingStallThresholdMs` ist standardmäßig `120000`; passen Sie den Wert nur bei falsch-positiven Polling-Stall-Neustarts zwischen `30000` und `600000` an.
    - Der Gruppen-Kontextverlauf verwendet `channels.telegram.historyLimit` oder `messages.groupChat.historyLimit` (Standard 50); `0` deaktiviert ihn.
    - Zusätzlicher Kontext aus Antworten/Zitaten/Weiterleitungen wird derzeit unverändert weitergegeben.
    - Telegram-Allowlists steuern primär, wer den Agent auslösen kann, und sind keine vollständige Redaktionsgrenze für zusätzlichen Kontext.
    - Steuerung des DM-Verlaufs:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - Die Konfiguration `channels.telegram.retry` gilt für Telegram-Sendehilfen (CLI/Tools/Aktionen) bei behebbaren ausgehenden API-Fehlern. Die Zustellung der endgültigen Antwort für eingehende Nachrichten verwendet ebenfalls eine begrenzte Safe-Send-Wiederholung bei Telegram-Fehlern vor dem Verbindungsaufbau, wiederholt jedoch keine mehrdeutigen Netzwerk-Envelopes nach dem Senden, die sichtbare Nachrichten duplizieren könnten.

    Das CLI-Sendeziel kann eine numerische Chat-ID oder ein Benutzername sein:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Telegram-Umfragen verwenden `openclaw message poll` und unterstützen Forum-Themen:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Nur für Telegram geltende Umfrage-Flags:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` für Forum-Themen (oder verwenden Sie ein `:topic:`-Ziel)

    Das Senden über Telegram unterstützt außerdem:

    - `--presentation` mit `buttons`-Blöcken für Inline-Tastaturen, wenn `channels.telegram.capabilities.inlineButtons` dies zulässt
    - `--pin` oder `--delivery '{"pin":true}'`, um angeheftete Zustellung anzufordern, wenn der Bot in diesem Chat anheften kann
    - `--force-document`, um ausgehende Bilder und GIFs als Dokumente statt als komprimierte Foto- oder animierte Medien-Uploads zu senden

    Aktionssteuerung:

    - `channels.telegram.actions.sendMessage=false` deaktiviert ausgehende Telegram-Nachrichten, einschließlich Umfragen
    - `channels.telegram.actions.poll=false` deaktiviert das Erstellen von Telegram-Umfragen, während reguläres Senden aktiviert bleibt

  </Accordion>

  <Accordion title="Exec-Genehmigungen in Telegram">
    Telegram unterstützt Exec-Genehmigungen in Genehmiger-DMs und kann Prompts optional im ursprünglichen Chat oder Thema posten. Genehmiger müssen numerische Telegram-Benutzer-IDs sein.

    Konfigurationspfad:

    - `channels.telegram.execApprovals.enabled` (aktiviert sich automatisch, wenn mindestens ein Genehmiger auflösbar ist)
    - `channels.telegram.execApprovals.approvers` (fällt auf numerische Besitzer-IDs aus `commands.ownerAllowFrom` zurück)
    - `channels.telegram.execApprovals.target`: `dm` (Standard) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` und `defaultTo` steuern, wer mit dem Bot sprechen kann und wohin er normale Antworten sendet. Sie machen niemanden zu einem Exec-Genehmiger. Das erste genehmigte DM-Pairing initialisiert `commands.ownerAllowFrom`, wenn noch kein Befehlsbesitzer vorhanden ist, sodass die Einrichtung mit einem Besitzer weiterhin funktioniert, ohne IDs unter `execApprovals.approvers` zu duplizieren.

    Die Kanalzustellung zeigt den Befehlstext im Chat; aktivieren Sie `channel` oder `both` nur in vertrauenswürdigen Gruppen/Themen. Wenn der Prompt in einem Forum-Thema landet, bewahrt OpenClaw das Thema für den Genehmigungs-Prompt und die Nachverfolgung. Exec-Genehmigungen laufen standardmäßig nach 30 Minuten ab.

    Inline-Genehmigungsbuttons erfordern außerdem, dass `channels.telegram.capabilities.inlineButtons` die Zieloberfläche (`dm`, `group` oder `all`) zulässt. Genehmigungs-IDs mit dem Präfix `plugin:` werden über Plugin-Genehmigungen aufgelöst; andere werden zuerst über Exec-Genehmigungen aufgelöst.

    Siehe [Exec-Genehmigungen](/de/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Steuerung von Fehlerantworten

Wenn der Agent auf einen Zustellungs- oder Provider-Fehler stößt, kann Telegram entweder mit dem Fehlertext antworten oder ihn unterdrücken. Zwei Konfigurationsschlüssel steuern dieses Verhalten:

| Schlüssel                           | Werte             | Standard | Beschreibung                                                                                     |
| ----------------------------------- | ----------------- | -------- | ----------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`  | `reply` sendet eine freundliche Fehlermeldung an den Chat. `silent` unterdrückt Fehlerantworten vollständig. |
| `channels.telegram.errorCooldownMs` | Zahl (ms)         | `60000`  | Mindestzeit zwischen Fehlerantworten an denselben Chat. Verhindert Fehlerspam während Ausfällen.        |

Überschreibungen pro Account, pro Gruppe und pro Thema werden unterstützt (dieselbe Vererbung wie bei anderen Telegram-Konfigurationsschlüsseln).

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

    - Wenn `requireMention=false` ist, muss der Telegram-Datenschutzmodus vollständige Sichtbarkeit erlauben.
      - BotFather: `/setprivacy` -> Deaktivieren
      - entfernen Sie den Bot anschließend aus der Gruppe und fügen Sie ihn erneut hinzu
    - `openclaw channels status` warnt, wenn die Konfiguration Gruppennachrichten ohne Erwähnung erwartet.
    - `openclaw channels status --probe` kann explizite numerische Gruppen-IDs prüfen; der Platzhalter `"*"` kann nicht auf Mitgliedschaft geprüft werden.
    - Schneller Sitzungstest: `/activation always`.

  </Accordion>

  <Accordion title="Bot sieht überhaupt keine Gruppennachrichten">

    - Wenn `channels.telegram.groups` vorhanden ist, muss die Gruppe aufgeführt sein (oder `"*"` enthalten)
    - verifizieren Sie die Bot-Mitgliedschaft in der Gruppe
    - prüfen Sie Protokolle: `openclaw logs --follow` für Gründe zum Überspringen

  </Accordion>

  <Accordion title="Befehle funktionieren teilweise oder gar nicht">

    - autorisieren Sie Ihre Absenderidentität (Pairing und/oder numerisches `allowFrom`)
    - Befehlsautorisierung gilt weiterhin, auch wenn die Gruppenrichtlinie `open` ist
    - `setMyCommands failed` mit `BOT_COMMANDS_TOO_MUCH` bedeutet, dass das native Menü zu viele Einträge enthält; reduzieren Sie Plugin-/Skill-/benutzerdefinierte Befehle oder deaktivieren Sie native Menüs
    - Startaufrufe von `deleteMyCommands` / `setMyCommands` sind begrenzt und werden bei Request-Timeout einmal über Telegrams Transport-Fallback wiederholt. Dauerhafte Netzwerk-/Fetch-Fehler weisen normalerweise auf DNS-/HTTPS-Erreichbarkeitsprobleme zu `api.telegram.org` hin

  </Accordion>

  <Accordion title="Start meldet nicht autorisiertes Token">

    - `getMe returned 401` ist ein Telegram-Authentifizierungsfehler für das konfigurierte Bot-Token.
    - Kopieren oder regenerieren Sie das Bot-Token in BotFather erneut und aktualisieren Sie dann `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` oder `TELEGRAM_BOT_TOKEN` für den Standard-Account.
    - `deleteWebhook 401 Unauthorized` während des Starts ist ebenfalls ein Authentifizierungsfehler; dies als "kein Webhook vorhanden" zu behandeln, würde denselben Fehler durch ein ungültiges Token nur auf spätere API-Aufrufe verschieben.
    - Wenn `deleteWebhook` während des Polling-Starts mit einem vorübergehenden Netzwerkfehler fehlschlägt, prüft OpenClaw `getWebhookInfo`; wenn Telegram eine leere Webhook-URL meldet, wird Polling fortgesetzt, weil die Bereinigung bereits erfüllt ist.

  </Accordion>

  <Accordion title="Polling- oder Netzwerkinstabilität">

    - Node 22+ + benutzerdefinierter Fetch/Proxy kann sofortiges Abbruchverhalten auslösen, wenn `AbortSignal`-Typen nicht übereinstimmen.
    - Einige Hosts lösen `api.telegram.org` zuerst zu IPv6 auf; fehlerhafter ausgehender IPv6-Verkehr kann sporadische Ausfälle der Telegram-API verursachen.
    - Wenn Logs `TypeError: fetch failed` oder `Network request for 'getUpdates' failed!` enthalten, wiederholt OpenClaw diese nun als wiederherstellbare Netzwerkfehler.
    - Wenn Telegram-Sockets in einem kurzen festen Takt erneuert werden, prüfen Sie, ob `channels.telegram.timeoutSeconds` niedrig ist; Long-Polling-Bot-Clients begrenzen konfigurierte Werte unterhalb des `getUpdates`-Request-Guards, aber ältere Releases konnten jeden Poll abbrechen, wenn dies unter dem Long-Poll-Timeout gesetzt war.
    - Wenn Logs `Polling stall detected` enthalten, startet OpenClaw das Polling neu und baut den Telegram-Transport nach standardmäßig 120 Sekunden ohne abgeschlossene Long-Poll-Liveness neu auf.
    - `openclaw channels status --probe` und `openclaw doctor` warnen, wenn ein laufendes Polling-Konto nach der Start-Gnadenfrist `getUpdates` nicht abgeschlossen hat, wenn ein laufendes Webhook-Konto nach der Start-Gnadenfrist `setWebhook` nicht abgeschlossen hat oder wenn die letzte erfolgreiche Polling-Transportaktivität veraltet ist.
    - Erhöhen Sie `channels.telegram.pollingStallThresholdMs` nur, wenn lang laufende `getUpdates`-Aufrufe gesund sind, Ihr Host aber weiterhin fälschliche Polling-Stall-Neustarts meldet. Dauerhafte Stalls deuten in der Regel auf Proxy-, DNS-, IPv6- oder TLS-Egress-Probleme zwischen dem Host und `api.telegram.org` hin.
    - Telegram berücksichtigt für den Bot-API-Transport auch Proxy-Umgebungsvariablen des Prozesses, darunter `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` und deren Varianten in Kleinbuchstaben. `NO_PROXY` / `no_proxy` kann `api.telegram.org` weiterhin umgehen.
    - Wenn der von OpenClaw verwaltete Proxy über `OPENCLAW_PROXY_URL` für eine Dienstumgebung konfiguriert ist und keine Standard-Proxy-Umgebungsvariable vorhanden ist, verwendet Telegram diese URL ebenfalls für den Bot-API-Transport.
    - Leiten Sie Telegram-API-Aufrufe auf VPS-Hosts mit instabilem direktem Egress/TLS über `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ verwendet standardmäßig `autoSelectFamily=true` (außer WSL2) und `dnsResultOrder=ipv4first`.
    - Wenn Ihr Host WSL2 ist oder ausdrücklich besser mit reinem IPv4-Verhalten funktioniert, erzwingen Sie die Family-Auswahl:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Antworten aus dem RFC-2544-Benchmark-Bereich (`198.18.0.0/15`) sind
      für Telegram-Mediendownloads bereits standardmäßig erlaubt. Wenn ein vertrauenswürdiger Fake-IP- oder
      transparenter Proxy `api.telegram.org` während Mediendownloads auf eine andere
      private/interne/Special-Use-Adresse umschreibt, können Sie den Telegram-spezifischen Bypass
      aktivieren:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Dieselbe Aktivierung ist pro Konto unter
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork` verfügbar.
    - Wenn Ihr Proxy Telegram-Medienhosts zu `198.18.x.x` auflöst, lassen Sie das
      gefährliche Flag zunächst deaktiviert. Telegram-Medien erlauben den RFC-2544-
      Benchmark-Bereich bereits standardmäßig.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` schwächt die Telegram-
      Medien-SSRF-Schutzmaßnahmen. Verwenden Sie es nur für vertrauenswürdige, betreiberkontrollierte Proxy-
      Umgebungen wie Clash-, Mihomo- oder Surge-Fake-IP-Routing, wenn diese
      private oder Special-Use-Antworten außerhalb des RFC-2544-Benchmark-
      Bereichs synthetisieren. Lassen Sie es für normalen öffentlichen Telegram-Internetzugriff deaktiviert.
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

Weitere Hilfe: [Kanal-Fehlerbehebung](/de/channels/troubleshooting).

## Konfigurationsreferenz

Primäre Referenz: [Konfigurationsreferenz - Telegram](/de/gateway/config-channels#telegram).

<Accordion title="High-signal Telegram fields">

- Start/Auth: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` muss auf eine reguläre Datei verweisen; Symlinks werden abgelehnt)
- Zugriffskontrolle: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` auf oberster Ebene (`type: "acp"`)
- Exec-Genehmigungen: `execApprovals`, `accounts.*.execApprovals`
- Befehl/Menü: `commands.native`, `commands.nativeSkills`, `customCommands`
- Threads/Antworten: `replyToMode`
- Streaming: `streaming` (Vorschau), `streaming.preview.toolProgress`, `blockStreaming`
- Formatierung/Zustellung: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- Medien/Netzwerk: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- Benutzerdefinierter API-Root: `apiRoot` (nur Bot-API-Root; `/bot<TOKEN>` nicht einschließen)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- Aktionen/Fähigkeiten: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- Reaktionen: `reactionNotifications`, `reactionLevel`
- Fehler: `errorPolicy`, `errorCooldownMs`
- Schreibvorgänge/Verlauf: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Priorität bei mehreren Konten: Wenn zwei oder mehr Konto-IDs konfiguriert sind, setzen Sie `channels.telegram.defaultAccount` (oder schließen Sie `channels.telegram.accounts.default` ein), um das Standard-Routing explizit zu machen. Andernfalls fällt OpenClaw auf die erste normalisierte Konto-ID zurück und `openclaw doctor` warnt. Benannte Konten erben `channels.telegram.allowFrom` / `groupAllowFrom`, aber keine `accounts.default.*`-Werte.
</Note>

## Verwandt

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/de/channels/pairing">
    Koppeln Sie einen Telegram-Benutzer mit dem Gateway.
  </Card>
  <Card title="Groups" icon="users" href="/de/channels/groups">
    Verhalten der Allowlist für Gruppen und Themen.
  </Card>
  <Card title="Channel routing" icon="route" href="/de/channels/channel-routing">
    Eingehende Nachrichten an Agenten routen.
  </Card>
  <Card title="Security" icon="shield" href="/de/gateway/security">
    Bedrohungsmodell und Härtung.
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/de/concepts/multi-agent">
    Gruppen und Themen Agenten zuordnen.
  </Card>
  <Card title="Troubleshooting" icon="wrench" href="/de/channels/troubleshooting">
    Kanalübergreifende Diagnosen.
  </Card>
</CardGroup>
