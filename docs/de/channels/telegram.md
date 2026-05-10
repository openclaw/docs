---
read_when:
    - Arbeiten an Telegram-Funktionen oder Webhooks
summary: Status der Telegram-Bot-Unterstützung, Funktionen und Konfiguration
title: Telegram
x-i18n:
    generated_at: "2026-05-10T19:23:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 87fc2994ced5e3c845b35f8c134ca04de317e83c3c2414de2dea4779a763f17e
    source_path: channels/telegram.md
    workflow: 16
---

Produktionsreif für Bot-DMs und Gruppen über grammY. Long Polling ist der Standardmodus; der Webhook-Modus ist optional.

<CardGroup cols={3}>
  <Card title="Kopplung" icon="link" href="/de/channels/pairing">
    Die Standard-DM-Richtlinie für Telegram ist Kopplung.
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
    Öffnen Sie Telegram und chatten Sie mit **@BotFather** (bestätigen Sie, dass der Handle genau `@BotFather` ist).

    Führen Sie `/newbot` aus, folgen Sie den Anweisungen und speichern Sie das Token.

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
    Telegram verwendet **nicht** `openclaw channels login telegram`; konfigurieren Sie das Token in config/env und starten Sie dann den Gateway.

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
    Telegram-Bots verwenden standardmäßig den **Datenschutzmodus**, der einschränkt, welche Gruppennachrichten sie empfangen.

    Wenn der Bot alle Gruppennachrichten sehen muss, entweder:

    - deaktivieren Sie den Datenschutzmodus über `/setprivacy`, oder
    - machen Sie den Bot zum Gruppenadministrator.

    Wenn Sie den Datenschutzmodus umschalten, entfernen Sie den Bot in jeder Gruppe und fügen Sie ihn erneut hinzu, damit Telegram die Änderung übernimmt.

  </Accordion>

  <Accordion title="Gruppenberechtigungen">
    Der Administratorstatus wird in den Telegram-Gruppeneinstellungen gesteuert.

    Admin-Bots empfangen alle Gruppennachrichten, was für dauerhaft aktives Gruppenverhalten nützlich ist.

  </Accordion>

  <Accordion title="Nützliche BotFather-Umschalter">

    - `/setjoingroups`, um das Hinzufügen zu Gruppen zu erlauben/zu verweigern
    - `/setprivacy` für das Sichtbarkeitsverhalten in Gruppen

  </Accordion>
</AccordionGroup>

## Zugriffskontrolle und Aktivierung

<Tabs>
  <Tab title="DM-Richtlinie">
    `channels.telegram.dmPolicy` steuert den Zugriff auf Direktnachrichten:

    - `pairing` (Standard)
    - `allowlist` (erfordert mindestens eine Sender-ID in `allowFrom`)
    - `open` (erfordert, dass `allowFrom` `"*"` enthält)
    - `disabled`

    `dmPolicy: "open"` mit `allowFrom: ["*"]` erlaubt jedem Telegram-Konto, das den Bot-Benutzernamen findet oder errät, dem Bot Befehle zu geben. Verwenden Sie dies nur für bewusst öffentliche Bots mit stark eingeschränkten Tools; Bots mit einem Owner sollten `allowlist` mit numerischen Benutzer-IDs verwenden.

    `channels.telegram.allowFrom` akzeptiert numerische Telegram-Benutzer-IDs. Präfixe `telegram:` / `tg:` werden akzeptiert und normalisiert.
    In Multi-Account-Konfigurationen wird ein restriktives `channels.telegram.allowFrom` auf oberster Ebene als Sicherheitsgrenze behandelt: Kontospezifische Einträge `allowFrom: ["*"]` machen dieses Konto nicht öffentlich, es sei denn, die effektive Konto-Allowlist enthält nach dem Zusammenführen weiterhin einen expliziten Platzhalter.
    `dmPolicy: "allowlist"` mit leerem `allowFrom` blockiert alle DMs und wird von der Konfigurationsvalidierung abgelehnt.
    Die Einrichtung fragt nur nach numerischen Benutzer-IDs.
    Wenn Sie ein Upgrade durchgeführt haben und Ihre Konfiguration `@username`-Allowlist-Einträge enthält, führen Sie `openclaw doctor --fix` aus, um sie aufzulösen (Best-Effort; erfordert ein Telegram-Bot-Token).
    Wenn Sie sich zuvor auf Pairing-Store-Allowlist-Dateien verlassen haben, kann `openclaw doctor --fix` Einträge in Allowlist-Flows nach `channels.telegram.allowFrom` wiederherstellen (zum Beispiel, wenn `dmPolicy: "allowlist"` noch keine expliziten IDs hat).

    Für Bots mit einem Owner sollten Sie `dmPolicy: "allowlist"` mit expliziten numerischen `allowFrom`-IDs bevorzugen, damit die Zugriffsrichtlinie dauerhaft in der Konfiguration bleibt (statt von früheren Pairing-Genehmigungen abzuhängen).

    Häufige Verwirrung: DM-Pairing-Genehmigung bedeutet nicht „dieser Sender ist überall autorisiert“.
    Pairing gewährt DM-Zugriff. Wenn noch kein Befehls-Owner existiert, setzt das erste genehmigte Pairing außerdem `commands.ownerAllowFrom`, sodass Owner-only-Befehle und Exec-Genehmigungen ein explizites Operator-Konto haben.
    Die Autorisierung von Gruppensendern kommt weiterhin aus expliziten Konfigurations-Allowlists.
    Wenn Sie möchten, dass „ich einmal autorisiert bin und sowohl DMs als auch Gruppenbefehle funktionieren“, setzen Sie Ihre numerische Telegram-Benutzer-ID in `channels.telegram.allowFrom`; stellen Sie für Owner-only-Befehle sicher, dass `commands.ownerAllowFrom` `telegram:<your user id>` enthält.

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
    Zwei Steuerungen gelten zusammen:

    1. **Welche Gruppen erlaubt sind** (`channels.telegram.groups`)
       - keine `groups`-Konfiguration:
         - mit `groupPolicy: "open"`: Jede Gruppe kann Gruppen-ID-Prüfungen bestehen
         - mit `groupPolicy: "allowlist"` (Standard): Gruppen werden blockiert, bis Sie `groups`-Einträge (oder `"*"`) hinzufügen
       - `groups` konfiguriert: agiert als Allowlist (explizite IDs oder `"*"`)

    2. **Welche Sender in Gruppen erlaubt sind** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (Standard)
       - `disabled`

    `groupAllowFrom` wird für das Filtern von Gruppensendern verwendet. Wenn nicht gesetzt, fällt Telegram auf `allowFrom` zurück.
    `groupAllowFrom`-Einträge sollten numerische Telegram-Benutzer-IDs sein (Präfixe `telegram:` / `tg:` werden normalisiert).
    Tragen Sie keine Telegram-Gruppen- oder Supergroup-Chat-IDs in `groupAllowFrom` ein. Negative Chat-IDs gehören unter `channels.telegram.groups`.
    Nicht numerische Einträge werden für die Senderautorisierung ignoriert.
    Sicherheitsgrenze (`2026.2.25+`): Gruppensender-Auth erbt **keine** DM-Pairing-Store-Genehmigungen.
    Pairing bleibt DM-only. Legen Sie für Gruppen `groupAllowFrom` oder `allowFrom` pro Gruppe/pro Topic fest.
    Wenn `groupAllowFrom` nicht gesetzt ist, fällt Telegram auf config `allowFrom` zurück, nicht auf den Pairing-Store.
    Praktisches Muster für Bots mit einem Owner: Setzen Sie Ihre Benutzer-ID in `channels.telegram.allowFrom`, lassen Sie `groupAllowFrom` ungesetzt und erlauben Sie die Zielgruppen unter `channels.telegram.groups`.
    Laufzeit-Hinweis: Wenn `channels.telegram` vollständig fehlt, verwendet die Laufzeit standardmäßig fail-closed `groupPolicy="allowlist"`, sofern `channels.defaults.groupPolicy` nicht explizit gesetzt ist.

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

      - Tragen Sie negative Telegram-Gruppen- oder Supergroup-Chat-IDs wie `-1001234567890` unter `channels.telegram.groups` ein.
      - Tragen Sie Telegram-Benutzer-IDs wie `8734062810` unter `groupAllowFrom` ein, wenn Sie begrenzen möchten, welche Personen innerhalb einer erlaubten Gruppe den Bot auslösen können.
      - Verwenden Sie `groupAllowFrom: ["*"]` nur, wenn jedes Mitglied einer erlaubten Gruppe mit dem Bot sprechen können soll.

    </Warning>

  </Tab>

  <Tab title="Erwähnungsverhalten">
    Gruppenantworten erfordern standardmäßig eine Erwähnung.

    Die Erwähnung kann stammen von:

    - nativer `@botusername`-Erwähnung, oder
    - Erwähnungsmustern in:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Sitzungsbezogene Befehls-Umschalter:

    - `/activation always`
    - `/activation mention`

    Diese aktualisieren nur den Sitzungszustand. Verwenden Sie für Persistenz die Konfiguration.

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
- Routing ist deterministisch: Eingehende Telegram-Nachrichten werden an Telegram beantwortet (das Modell wählt keine Channels aus).
- Eingehende Nachrichten werden in die gemeinsame Channel-Hülle normalisiert, mit Antwortmetadaten, Medien-Platzhaltern und persistiertem Antwortkettenkontext für Telegram-Antworten, die der Gateway beobachtet hat.
- Gruppensitzungen werden nach Gruppen-ID isoliert. Forum-Topics hängen `:topic:<threadId>` an, um Topics isoliert zu halten.
- DM-Nachrichten können `message_thread_id` enthalten; OpenClaw bewahrt die Thread-ID für Antworten auf, hält DMs aber standardmäßig in der flachen Sitzung. Konfigurieren Sie `channels.telegram.dm.threadReplies: "inbound"`, `channels.telegram.direct.<chatId>.threadReplies: "inbound"`, `requireTopic: true` oder eine passende Topic-Konfiguration, wenn Sie absichtlich DM-Topic-Sitzungsisolation wünschen.
- Long Polling verwendet den grammY Runner mit Sequenzierung pro Chat/pro Thread. Die gesamte Runner-Sink-Parallelität verwendet `agents.defaults.maxConcurrent`.
- Long Polling ist innerhalb jedes Gateway-Prozesses geschützt, sodass jeweils nur ein aktiver Poller ein Bot-Token verwenden kann. Wenn Sie weiterhin `getUpdates`-409-Konflikte sehen, verwendet wahrscheinlich ein anderer OpenClaw-Gateway, ein Skript oder ein externer Poller dasselbe Token.
- Long-Polling-Watchdog-Neustarts werden standardmäßig nach 120 Sekunden ohne abgeschlossene `getUpdates`-Liveness ausgelöst. Erhöhen Sie `channels.telegram.pollingStallThresholdMs` nur, wenn Ihre Bereitstellung während lang laufender Arbeit weiterhin fälschliche Polling-Stall-Neustarts sieht. Der Wert ist in Millisekunden angegeben und von `30000` bis `600000` erlaubt; kontospezifische Overrides werden unterstützt.
- Die Telegram Bot API unterstützt keine Lesebestätigungen (`sendReadReceipts` gilt nicht).

## Funktionsreferenz

<AccordionGroup>
  <Accordion title="Livestream-Vorschau (Nachrichtenbearbeitungen)">
    OpenClaw kann Teilantworten in Echtzeit streamen:

    - direkte Chats: Vorschaunachricht + `editMessageText`
    - Gruppen/Topics: Vorschaunachricht + `editMessageText`

    Anforderung:

    - `channels.telegram.streaming` ist `off | partial | block | progress` (Standard: `partial`)
    - `progress` behält einen bearbeitbaren Statusentwurf für Tool-Fortschritt bei, löscht ihn bei Abschluss und sendet die finale Antwort als normale Nachricht
    - `streaming.preview.toolProgress` steuert, ob Tool-/Fortschrittsupdates dieselbe bearbeitete Vorschaunachricht wiederverwenden (Standard: `true`, wenn Vorschau-Streaming aktiv ist)
    - `streaming.preview.commandText` steuert Befehls-/Exec-Details innerhalb dieser Tool-Fortschrittszeilen: `raw` (Standard, bewahrt veröffentlichtes Verhalten) oder `status` (nur Tool-Label)
    - Legacy-`channels.telegram.streamMode` und boolesche `streaming`-Werte werden erkannt; führen Sie `openclaw doctor --fix` aus, um sie nach `channels.telegram.streaming.mode` zu migrieren

    Tool-Fortschritts-Vorschauupdates sind die kurzen Statuszeilen, die angezeigt werden, während Tools laufen, zum Beispiel Befehlsausführung, Dateilesevorgänge, Planungsupdates oder Patch-Zusammenfassungen. Telegram hält diese standardmäßig aktiviert, um dem veröffentlichten OpenClaw-Verhalten ab `v2026.4.22` zu entsprechen. Um die bearbeitete Vorschau für Antworttext beizubehalten, aber Tool-Fortschrittszeilen auszublenden, setzen Sie:

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

    Um den Tool-Fortschritt sichtbar zu lassen, aber Befehls-/Exec-Text auszublenden, legen Sie Folgendes fest:

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

    Verwenden Sie den Modus `progress`, wenn sichtbarer Tool-Fortschritt gewünscht ist, ohne die finale Antwort in dieselbe Nachricht zu editieren. Legen Sie die Richtlinie für Befehlstext unter `streaming.progress` ab:

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

    Verwenden Sie `streaming.mode: "off"` nur, wenn Sie ausschließlich finale Zustellung wünschen: Telegram-Vorschau-Edits sind deaktiviert, und allgemeines Tool-/Fortschrittsrauschen wird unterdrückt, statt als eigenständige Statusmeldungen gesendet zu werden. Genehmigungsaufforderungen, Medien-Payloads und Fehler laufen weiterhin über die normale finale Zustellung. Verwenden Sie `streaming.preview.toolProgress: false`, wenn Sie nur Antwortvorschau-Edits beibehalten, aber die Statuszeilen zum Tool-Fortschritt ausblenden möchten.

    <Note>
      Ausgewählte Telegram-Zitatantworten sind die Ausnahme. Wenn `replyToMode` `"first"`, `"all"` oder `"batched"` ist und die eingehende Nachricht ausgewählten Zitattext enthält, sendet OpenClaw die finale Antwort über Telegrams nativen Zitatantwort-Pfad, statt die Antwortvorschau zu editieren. Daher kann `streaming.preview.toolProgress` die kurzen Statuszeilen für diesen Durchlauf nicht anzeigen. Antworten auf die aktuelle Nachricht ohne ausgewählten Zitattext behalten weiterhin Vorschau-Streaming bei. Setzen Sie `replyToMode: "off"`, wenn Sichtbarkeit des Tool-Fortschritts wichtiger ist als native Zitatantworten, oder setzen Sie `streaming.preview.toolProgress: false`, um den Kompromiss anzuerkennen.
    </Note>

    Für reine Textantworten:

    - kurze Vorschauen in DMs/Gruppen/Themen: OpenClaw behält dieselbe Vorschaunachricht bei und führt den finalen Edit direkt darin aus
    - lange finale Textantworten, die in mehrere Telegram-Nachrichten aufgeteilt werden, verwenden die vorhandene Vorschau nach Möglichkeit als ersten finalen Abschnitt erneut und senden danach nur die restlichen Abschnitte
    - finale Antworten im Fortschrittsmodus leeren den Statusentwurf und verwenden normale finale Zustellung, statt den Entwurf in die Antwort zu editieren
    - wenn der finale Edit fehlschlägt, bevor der vollständige Text bestätigt wurde, verwendet OpenClaw normale finale Zustellung und räumt die veraltete Vorschau auf

    Für komplexe Antworten (zum Beispiel Medien-Payloads) fällt OpenClaw auf normale finale Zustellung zurück und räumt anschließend die Vorschaunachricht auf.

    Vorschau-Streaming ist getrennt von Block-Streaming. Wenn Block-Streaming für Telegram explizit aktiviert ist, überspringt OpenClaw den Vorschau-Stream, um doppeltes Streaming zu vermeiden.

    Nur-Telegram-Reasoning-Stream:

    - `/reasoning stream` sendet Reasoning während der Generierung an die Live-Vorschau
    - die Reasoning-Vorschau wird nach der finalen Zustellung gelöscht; verwenden Sie `/reasoning on`, wenn Reasoning sichtbar bleiben soll
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

    - Namen werden normalisiert (führendes `/` entfernen, Kleinschreibung)
    - gültiges Muster: `a-z`, `0-9`, `_`, Länge `1..32`
    - benutzerdefinierte Befehle können native Befehle nicht überschreiben
    - Konflikte/Duplikate werden übersprungen und protokolliert

    Hinweise:

    - benutzerdefinierte Befehle sind nur Menüeinträge; sie implementieren nicht automatisch Verhalten
    - Plugin-/Skill-Befehle können weiterhin funktionieren, wenn sie eingegeben werden, selbst wenn sie nicht im Telegram-Menü angezeigt werden

    Wenn native Befehle deaktiviert sind, werden integrierte Befehle entfernt. Benutzerdefinierte/Plugin-Befehle können sich weiterhin registrieren, wenn sie konfiguriert sind.

    Häufige Einrichtungsfehler:

    - `setMyCommands failed` mit `BOT_COMMANDS_TOO_MUCH` bedeutet, dass das Telegram-Menü nach dem Kürzen immer noch übergelaufen ist; reduzieren Sie Plugin-/Skill-/benutzerdefinierte Befehle oder deaktivieren Sie `channels.telegram.commands.native`.
    - Fehler bei `deleteWebhook`, `deleteMyCommands` oder `setMyCommands` mit `404: Not Found`, während direkte Bot-API-curl-Befehle funktionieren, können bedeuten, dass `channels.telegram.apiRoot` auf den vollständigen `/bot<TOKEN>`-Endpunkt gesetzt wurde. `apiRoot` darf nur der Bot-API-Stamm sein, und `openclaw doctor --fix` entfernt ein versehentlich angehängtes `/bot<TOKEN>`.
    - `getMe returned 401` bedeutet, dass Telegram das konfigurierte Bot-Token abgelehnt hat. Aktualisieren Sie `botToken`, `tokenFile` oder `TELEGRAM_BOT_TOKEN` mit dem aktuellen BotFather-Token; OpenClaw hält vor dem Polling an, daher wird dies nicht als Webhook-Bereinigungsfehler gemeldet.
    - `setMyCommands failed` mit Netzwerk-/Fetch-Fehlern bedeutet normalerweise, dass ausgehendes DNS/HTTPS zu `api.telegram.org` blockiert ist.

    ### Geräte-Pairing-Befehle (`device-pair`-Plugin)

    Wenn das `device-pair`-Plugin installiert ist:

    1. `/pair` erzeugt Einrichtungscode
    2. Code in die iOS-App einfügen
    3. `/pair pending` listet ausstehende Anfragen auf (einschließlich Rolle/Scopes)
    4. Anfrage genehmigen:
       - `/pair approve <requestId>` für explizite Genehmigung
       - `/pair approve`, wenn nur eine Anfrage aussteht
       - `/pair approve latest` für die neueste

    Der Einrichtungscode enthält ein kurzlebiges Bootstrap-Token. Die integrierte Bootstrap-Übergabe hält das primäre Node-Token bei `scopes: []`; jedes übergebene Operator-Token bleibt auf `operator.approvals`, `operator.read`, `operator.talk.secrets` und `operator.write` begrenzt. Bootstrap-Scope-Prüfungen sind rollenpräfixiert, sodass diese Operator-Allowlist nur Operator-Anfragen erfüllt; Nicht-Operator-Rollen benötigen weiterhin Scopes unter ihrem eigenen Rollenpräfix.

    Wenn ein Gerät es mit geänderten Auth-Details erneut versucht (zum Beispiel Rolle/Scopes/öffentlicher Schlüssel), wird die vorherige ausstehende Anfrage ersetzt und die neue Anfrage verwendet eine andere `requestId`. Führen Sie vor der Genehmigung erneut `/pair pending` aus.

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

    Callback-Klicks werden als Text an den Agent weitergegeben:
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
    Laufzeitsendungen verwenden den aktiven Config-/Secrets-Snapshot (Start/Reload), sodass Aktionspfade keine Ad-hoc-Neuauflösung von SecretRef pro Sendung durchführen.

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

    Wenn Antwort-Threading aktiviert ist und der ursprüngliche Telegram-Text oder die ursprüngliche Beschriftung verfügbar ist, fügt OpenClaw automatisch einen nativen Telegram-Zitatauszug hinzu. Telegram begrenzt nativen Zitattext auf 1024 UTF-16-Codeeinheiten, daher werden längere Nachrichten vom Anfang an zitiert und fallen auf eine einfache Antwort zurück, wenn Telegram das Zitat ablehnt.

    Hinweis: `off` deaktiviert implizites Antwort-Threading. Explizite `[[reply_to_*]]`-Tags werden weiterhin berücksichtigt.

  </Accordion>

  <Accordion title="Forenthemen und Thread-Verhalten">
    Forum-Supergruppen:

    - Topic-Sitzungsschlüssel hängen `:topic:<threadId>` an
    - Antworten und Eingabeanzeigen zielen auf den Themen-Thread
    - Topic-Config-Pfad:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Spezialfall allgemeines Thema (`threadId=1`):

    - Nachrichtenversand lässt `message_thread_id` aus (Telegram lehnt `sendMessage(...thread_id=1)` ab)
    - Eingabeaktionen enthalten weiterhin `message_thread_id`

    Topic-Vererbung: Topic-Einträge erben Gruppeneinstellungen, sofern sie nicht überschrieben werden (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` ist nur Topic-spezifisch und wird nicht von Gruppenstandards geerbt.

    **Agent-Routing pro Topic**: Jedes Topic kann durch Setzen von `agentId` in der Topic-Config an einen anderen Agent weitergeleitet werden. Dadurch erhält jedes Topic seinen eigenen isolierten Arbeitsbereich, Speicher und seine eigene Sitzung. Beispiel:

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

    Jedes Topic hat dann seinen eigenen Sitzungsschlüssel: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Persistente ACP-Topic-Bindung**: Forenthemen können ACP-Harness-Sitzungen über typisierte ACP-Bindungen auf oberster Ebene pinnen (`bindings[]` mit `type: "acp"` und `match.channel: "telegram"`, `peer.kind: "group"` sowie einer Topic-qualifizierten ID wie `-1001234567890:topic:42`). Derzeit auf Forenthemen in Gruppen/Supergruppen beschränkt. Siehe [ACP-Agents](/de/tools/acp-agents).

    **Thread-gebundener ACP-Spawn aus dem Chat**: `/acp spawn <agent> --thread here|auto` bindet das aktuelle Topic an eine neue ACP-Sitzung; Folgeantworten werden direkt dorthin geleitet. OpenClaw pinnt die Spawn-Bestätigung im Topic. Erfordert, dass `channels.telegram.threadBindings.spawnSessions` aktiviert bleibt (Standard: `true`).

    Der Template-Kontext stellt `MessageThreadId` und `IsForum` bereit. DM-Chats mit `message_thread_id` behalten standardmaessig DM-Routing und Antwortmetadaten in flachen Sitzungen bei; sie verwenden threadbewusste Sitzungsschluessel nur, wenn sie mit `threadReplies: "inbound"`, `threadReplies: "always"`, `requireTopic: true` oder einer passenden Themenkonfiguration konfiguriert sind. Verwenden Sie `channels.telegram.dm.threadReplies` auf oberster Ebene fuer den Account-Standard oder `direct.<chatId>.threadReplies` fuer eine einzelne DM.

  </Accordion>

  <Accordion title="Audio, Video und Sticker">
    ### Audionachrichten

    Telegram unterscheidet zwischen Sprachnotizen und Audiodateien.

    - Standard: Verhalten wie Audiodatei
    - Tag `[[audio_as_voice]]` in der Agent-Antwort, um das Senden als Sprachnotiz zu erzwingen
    - Eingehende Transkripte von Sprachnotizen werden im Agent-Kontext als maschinell erzeugter,
      nicht vertrauenswuerdiger Text gerahmt; die Erkennung von Erwaehnungen verwendet weiterhin das rohe
      Transkript, sodass erwaehnungsgesteuerte Sprachnachrichten weiter funktionieren.

    Beispiel fuer eine Nachrichtenaktion:

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

    Telegram unterscheidet zwischen Videodateien und Videonotizen.

    Beispiel fuer eine Nachrichtenaktion:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    Videonotizen unterstuetzen keine Bildunterschriften; bereitgestellter Nachrichtentext wird separat gesendet.

    ### Sticker

    Verarbeitung eingehender Sticker:

    - statisches WEBP: heruntergeladen und verarbeitet (Platzhalter `<media:sticker>`)
    - animiertes TGS: uebersprungen
    - Video-WEBM: uebersprungen

    Sticker-Kontextfelder:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    Sticker-Cachedatei:

    - `~/.openclaw/telegram/sticker-cache.json`

    Sticker werden einmal beschrieben (wenn moeglich) und zwischengespeichert, um wiederholte Vision-Aufrufe zu reduzieren.

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

    Wenn aktiviert, reiht OpenClaw Systemereignisse ein wie:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Konfiguration:

    - `channels.telegram.reactionNotifications`: `off | own | all` (Standard: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (Standard: `minimal`)

    Hinweise:

    - `own` bedeutet nur Benutzerreaktionen auf vom Bot gesendete Nachrichten (Best-Effort ueber den Cache gesendeter Nachrichten).
    - Reaktionsereignisse beachten weiterhin die Telegram-Zugriffskontrollen (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); nicht autorisierte Absender werden verworfen.
    - Telegram stellt in Reaktionsupdates keine Thread-IDs bereit.
      - Nicht-Forum-Gruppen werden an die Gruppenchat-Sitzung weitergeleitet
      - Forum-Gruppen werden an die allgemeine Themensitzung der Gruppe (`:topic:1`) weitergeleitet, nicht an das exakte urspruengliche Thema

    `allowed_updates` fuer Polling/Webhook schliesst `message_reaction` automatisch ein.

  </Accordion>

  <Accordion title="Ack-Reaktionen">
    `ackReaction` sendet ein Bestaetigungs-Emoji, waehrend OpenClaw eine eingehende Nachricht verarbeitet.

    Aufloesungsreihenfolge:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - Fallback auf Emoji der Agent-Identitaet (`agents.list[].identity.emoji`, andernfalls "👀")

    Hinweise:

    - Telegram erwartet Unicode-Emoji (zum Beispiel "👀").
    - Verwenden Sie `""`, um die Reaktion fuer einen Kanal oder Account zu deaktivieren.

  </Accordion>

  <Accordion title="Konfigurationsschreibvorgaenge aus Telegram-Ereignissen und -Befehlen">
    Schreibvorgaenge fuer die Kanalkonfiguration sind standardmaessig aktiviert (`configWrites !== false`).

    Von Telegram ausgeloeste Schreibvorgaenge umfassen:

    - Gruppenmigrationsereignisse (`migrate_to_chat_id`) zum Aktualisieren von `channels.telegram.groups`
    - `/config set` und `/config unset` (erfordert Befehlsaktivierung)

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
    Standard ist Long Polling. Fuer den Webhook-Modus setzen Sie `channels.telegram.webhookUrl` und `channels.telegram.webhookSecret`; optional `webhookPath`, `webhookHost`, `webhookPort` (Standardwerte `/telegram-webhook`, `127.0.0.1`, `8787`).

    Im Long-Polling-Modus persistiert OpenClaw seine Neustart-Watermark erst, nachdem ein Update erfolgreich dispatcht wurde. Wenn ein Handler fehlschlaegt, bleibt dieses Update im selben Prozess erneut versuchbar und wird fuer die Neustart-Deduplizierung nicht als abgeschlossen geschrieben.

    Der lokale Listener bindet an `127.0.0.1:8787`. Fuer oeffentlichen Ingress stellen Sie entweder einen Reverse Proxy vor den lokalen Port oder setzen `webhookHost: "0.0.0.0"` bewusst.

    Der Webhook-Modus validiert Request-Guards, das geheime Telegram-Token und den JSON-Body, bevor `200` an Telegram zurueckgegeben wird.
    OpenClaw verarbeitet das Update anschliessend asynchron ueber dieselben Bot-Lanes pro Chat/pro Thema, die auch Long Polling verwendet, sodass langsame Agent-Durchlaeufe das Delivery-ACK von Telegram nicht blockieren.

  </Accordion>

  <Accordion title="Limits, Wiederholung und CLI-Ziele">
    - `channels.telegram.textChunkLimit` ist standardmaessig 4000.
    - `channels.telegram.chunkMode="newline"` bevorzugt Absatzgrenzen (Leerzeilen) vor der Laengenaufteilung.
    - `channels.telegram.mediaMaxMb` (Standard 100) begrenzt die Groesse eingehender und ausgehender Telegram-Medien.
    - `channels.telegram.mediaGroupFlushMs` (Standard 500) steuert, wie lange Telegram-Alben/Mediengruppen gepuffert werden, bevor OpenClaw sie als eine eingehende Nachricht dispatcht. Erhoehen Sie den Wert, wenn Albenteile verspaetet eintreffen; verringern Sie ihn, um die Antwortlatenz fuer Alben zu reduzieren.
    - `channels.telegram.timeoutSeconds` ueberschreibt das Timeout des Telegram-API-Clients (wenn nicht gesetzt, gilt der grammY-Standard). Bot-Clients begrenzen konfigurierte Werte unterhalb des 60-Sekunden-Guards fuer ausgehende Text-/Typing-Requests, damit grammY sichtbare Antwortzustellung nicht abbricht, bevor OpenClaws Transport-Guard und Fallback ausgefuehrt werden koennen. Long Polling verwendet weiterhin einen 45-Sekunden-Request-Guard fuer `getUpdates`, damit inaktive Polls nicht unbegrenzt aufgegeben werden.
    - `channels.telegram.pollingStallThresholdMs` ist standardmaessig `120000`; passen Sie den Wert nur bei falsch positiven Neustarts wegen Polling-Stalls zwischen `30000` und `600000` an.
    - Der Gruppen-Kontextverlauf verwendet `channels.telegram.historyLimit` oder `messages.groupChat.historyLimit` (Standard 50); `0` deaktiviert ihn.
    - Ergaenzender Kontext fuer Antworten/Zitate/Weiterleitungen wird in ein ausgewaehltes Konversationskontextfenster normalisiert, wenn das Gateway die uebergeordneten Nachrichten beobachtet hat; der Cache beobachteter Nachrichten wird neben dem Sitzungsspeicher persistiert. Telegram nimmt in Updates nur ein flaches `reply_to_message` auf, sodass Ketten, die aelter als der Cache sind, auf Telegrams aktuelle Update-Payload begrenzt sind.
    - Telegram-Allowlists steuern in erster Linie, wer den Agent ausloesen kann, und sind keine vollstaendige Redaktionsgrenze fuer ergaenzenden Kontext.
    - DM-Verlaufsteuerungen:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - Die Konfiguration `channels.telegram.retry` gilt fuer Telegram-Sendehilfen (CLI/Tools/Aktionen) bei behebbaren ausgehenden API-Fehlern. Die Zustellung abschliessender Antworten fuer eingehende Nachrichten verwendet ebenfalls eine begrenzte Safe-Send-Wiederholung fuer Telegram-Pre-Connect-Fehler, wiederholt jedoch keine mehrdeutigen Netzwerkumschlaege nach dem Senden, die sichtbare Nachrichten duplizieren koennten.

    Sendeziele fuer CLI und Nachrichten-Tool koennen numerische Chat-ID, Benutzername oder ein Forumsthemenziel sein:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
```

    Telegram-Polls verwenden `openclaw message poll` und unterstuetzen Forumsthemen:

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
    - `--thread-id` fuer Forumsthemen (oder verwenden Sie ein `:topic:`-Ziel)

    Telegram-Senden unterstuetzt ausserdem:

    - `--presentation` mit `buttons`-Bloecken fuer Inline-Tastaturen, wenn `channels.telegram.capabilities.inlineButtons` dies zulaesst
    - `--pin` oder `--delivery '{"pin":true}'`, um angepinnte Zustellung anzufordern, wenn der Bot in diesem Chat anpinnen kann
    - `--force-document`, um ausgehende Bilder und GIFs als Dokumente statt als komprimierte Foto- oder animierte Medien-Uploads zu senden

    Aktions-Gating:

    - `channels.telegram.actions.sendMessage=false` deaktiviert ausgehende Telegram-Nachrichten einschliesslich Polls
    - `channels.telegram.actions.poll=false` deaktiviert das Erstellen von Telegram-Polls, waehrend regulaeres Senden aktiviert bleibt

  </Accordion>

  <Accordion title="Exec-Freigaben in Telegram">
    Telegram unterstuetzt Exec-Freigaben in Freigeber-DMs und kann Prompts optional im urspruenglichen Chat oder Thema posten. Freigeber muessen numerische Telegram-Benutzer-IDs sein.

    Konfigurationspfad:

    - `channels.telegram.execApprovals.enabled` (aktiviert sich automatisch, wenn mindestens ein Freigeber aufloesbar ist)
    - `channels.telegram.execApprovals.approvers` (faellt auf numerische Owner-IDs aus `commands.ownerAllowFrom` zurueck)
    - `channels.telegram.execApprovals.target`: `dm` (Standard) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` und `defaultTo` steuern, wer mit dem Bot sprechen kann und wohin er normale Antworten sendet. Sie machen niemanden zu einem Exec-Freigeber. Die erste genehmigte DM-Kopplung initialisiert `commands.ownerAllowFrom`, wenn noch kein Befehls-Owner existiert, sodass die Einrichtung mit einem Owner weiterhin funktioniert, ohne IDs unter `execApprovals.approvers` zu duplizieren.

    Die Kanalzustellung zeigt den Befehlstext im Chat an; aktivieren Sie `channel` oder `both` nur in vertrauenswuerdigen Gruppen/Themen. Wenn der Prompt in einem Forumsthema landet, bewahrt OpenClaw das Thema fuer den Freigabe-Prompt und die Folgeantwort. Exec-Freigaben laufen standardmaessig nach 30 Minuten ab.

    Inline-Freigabeschaltflaechen erfordern ebenfalls, dass `channels.telegram.capabilities.inlineButtons` die Zieloberflaeche (`dm`, `group` oder `all`) zulaesst. Freigabe-IDs mit Praefix `plugin:` werden ueber Plugin-Freigaben aufgeloest; andere werden zuerst ueber Exec-Freigaben aufgeloest.

    Siehe [Exec-Freigaben](/de/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Steuerung von Fehlerantworten

Wenn der Agent auf einen Zustellungs- oder Provider-Fehler trifft, kann Telegram entweder mit dem Fehlertext antworten oder ihn unterdruecken. Zwei Konfigurationsschluessel steuern dieses Verhalten:

| Schluessel                           | Werte             | Standard | Beschreibung                                                                                                     |
| ------------------------------------ | ----------------- | -------- | ---------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`      | `reply`, `silent` | `reply`  | `reply` sendet eine freundliche Fehlermeldung an den Chat. `silent` unterdrueckt Fehlerantworten vollstaendig.   |
| `channels.telegram.errorCooldownMs`  | Zahl (ms)         | `60000`  | Mindestzeit zwischen Fehlerantworten an denselben Chat. Verhindert Fehler-Spam waehrend Ausfaellen.              |

Ueberschreibungen pro Account, pro Gruppe und pro Thema werden unterstuetzt (dieselbe Vererbung wie bei anderen Telegram-Konfigurationsschluesseln).

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

    - Wenn `requireMention=false` ist, muss der Datenschutzmodus von Telegram vollständige Sichtbarkeit zulassen.
      - BotFather: `/setprivacy` -> Deaktivieren
      - Entfernen Sie den Bot anschließend aus der Gruppe und fügen Sie ihn wieder hinzu.
    - `openclaw channels status` warnt, wenn die Konfiguration Gruppennachrichten ohne Erwähnung erwartet.
    - `openclaw channels status --probe` kann explizite numerische Gruppen-IDs prüfen; der Platzhalter `"*"` kann nicht per Mitgliedschaftsprüfung geprüft werden.
    - Schneller Sitzungstest: `/activation always`.

  </Accordion>

  <Accordion title="Bot sieht überhaupt keine Gruppennachrichten">

    - Wenn `channels.telegram.groups` vorhanden ist, muss die Gruppe aufgeführt sein (oder `"*"` enthalten).
    - Prüfen Sie die Bot-Mitgliedschaft in der Gruppe.
    - Prüfen Sie die Logs auf Gründe für das Überspringen: `openclaw logs --follow`.

  </Accordion>

  <Accordion title="Befehle funktionieren nur teilweise oder gar nicht">

    - Autorisieren Sie Ihre Absenderidentität (Pairing und/oder numerisches `allowFrom`).
    - Die Befehlsautorisierung gilt weiterhin, auch wenn die Gruppenrichtlinie `open` ist.
    - `setMyCommands failed` mit `BOT_COMMANDS_TOO_MUCH` bedeutet, dass das native Menü zu viele Einträge hat; reduzieren Sie Plugin-/Skill-/benutzerdefinierte Befehle oder deaktivieren Sie native Menüs.
    - `deleteMyCommands`-/`setMyCommands`-Startaufrufe und `sendChatAction`-Tippenaufrufe sind begrenzt und werden bei Request-Timeout einmal über Telegrams Transport-Fallback wiederholt. Anhaltende Netzwerk-/Fetch-Fehler weisen normalerweise auf DNS-/HTTPS-Erreichbarkeitsprobleme zu `api.telegram.org` hin.

  </Accordion>

  <Accordion title="Start meldet nicht autorisiertes Token">

    - `getMe returned 401` ist ein Telegram-Authentifizierungsfehler für das konfigurierte Bot-Token.
    - Kopieren oder regenerieren Sie das Bot-Token in BotFather erneut und aktualisieren Sie dann `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` oder `TELEGRAM_BOT_TOKEN` für das Standardkonto.
    - `deleteWebhook 401 Unauthorized` während des Starts ist ebenfalls ein Authentifizierungsfehler; ihn als „kein Webhook vorhanden“ zu behandeln, würde denselben Fehler wegen ungültigem Token nur auf spätere API-Aufrufe verschieben.

  </Accordion>

  <Accordion title="Polling- oder Netzwerkinstabilität">

    - Node 22+ und benutzerdefiniertes Fetch/Proxy können sofortiges Abbruchverhalten auslösen, wenn AbortSignal-Typen nicht übereinstimmen.
    - Einige Hosts lösen `api.telegram.org` zuerst zu IPv6 auf; defekter IPv6-Egress kann zeitweise Telegram-API-Fehler verursachen.
    - Wenn Logs `TypeError: fetch failed` oder `Network request for 'getUpdates' failed!` enthalten, wiederholt OpenClaw diese nun als behebbare Netzwerkfehler.
    - Beim Polling-Start verwendet OpenClaw die erfolgreiche `getMe`-Startprüfung für grammY erneut, sodass der Runner kein zweites `getMe` vor dem ersten `getUpdates` benötigt.
    - Wenn `deleteWebhook` beim Polling-Start mit einem vorübergehenden Netzwerkfehler fehlschlägt, fährt OpenClaw mit Long Polling fort, statt einen weiteren Control-Plane-Aufruf vor dem Polling auszuführen. Ein weiterhin aktiver Webhook erscheint als `getUpdates`-Konflikt; OpenClaw baut dann den Telegram-Transport neu auf und versucht die Webhook-Bereinigung erneut.
    - Wenn Telegram-Sockets in einem kurzen festen Takt recycelt werden, prüfen Sie auf einen niedrigen Wert für `channels.telegram.timeoutSeconds`; Bot-Clients begrenzen konfigurierte Werte unterhalb der Outbound- und `getUpdates`-Request-Guards, aber ältere Releases konnten jeden Poll oder jede Antwort abbrechen, wenn dies unterhalb dieser Guards gesetzt war.
    - Wenn Logs `Polling stall detected` enthalten, startet OpenClaw das Polling neu und baut den Telegram-Transport standardmäßig nach 120 Sekunden ohne abgeschlossene Long-Poll-Lebendigkeit neu auf.
    - `openclaw channels status --probe` und `openclaw doctor` warnen, wenn ein laufendes Polling-Konto nach der Startkulanz kein `getUpdates` abgeschlossen hat, wenn ein laufendes Webhook-Konto nach der Startkulanz kein `setWebhook` abgeschlossen hat oder wenn die letzte erfolgreiche Polling-Transportaktivität veraltet ist.
    - Erhöhen Sie `channels.telegram.pollingStallThresholdMs` nur, wenn lang laufende `getUpdates`-Aufrufe gesund sind, Ihr Host aber weiterhin fälschliche Polling-Stall-Neustarts meldet. Anhaltende Stillstände weisen normalerweise auf Proxy-, DNS-, IPv6- oder TLS-Egress-Probleme zwischen dem Host und `api.telegram.org` hin.
    - Telegram berücksichtigt auch Prozess-Proxy-Umgebungsvariablen für den Bot-API-Transport, darunter `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` und deren kleingeschriebene Varianten. `NO_PROXY` / `no_proxy` können `api.telegram.org` weiterhin umgehen.
    - Wenn der von OpenClaw verwaltete Proxy über `OPENCLAW_PROXY_URL` für eine Serviceumgebung konfiguriert ist und keine standardmäßige Proxy-Umgebungsvariable vorhanden ist, verwendet Telegram diese URL ebenfalls für den Bot-API-Transport.
    - Leiten Sie Telegram-API-Aufrufe auf VPS-Hosts mit instabilem direktem Egress/TLS über `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ setzt standardmäßig `autoSelectFamily=true` (außer WSL2). Die Reihenfolge der Telegram-DNS-Ergebnisse berücksichtigt zuerst `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, dann `channels.telegram.network.dnsResultOrder`, dann den Prozessstandard wie `NODE_OPTIONS=--dns-result-order=ipv4first`; wenn nichts zutrifft, fällt Node 22+ auf `ipv4first` zurück.
    - Wenn Ihr Host WSL2 ist oder explizit besser mit IPv4-only-Verhalten funktioniert, erzwingen Sie die Familienauswahl:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Antworten aus dem RFC-2544-Benchmarkbereich (`198.18.0.0/15`) sind für Telegram-Mediendownloads standardmäßig bereits erlaubt. Wenn ein vertrauenswürdiger Fake-IP- oder transparenter Proxy `api.telegram.org` während Mediendownloads auf eine andere private/interne/Special-Use-Adresse umschreibt, können Sie sich für den nur für Telegram geltenden Bypass anmelden:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Dieselbe Opt-in-Option ist pro Konto unter
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork` verfügbar.
    - Wenn Ihr Proxy Telegram-Medienhosts zu `198.18.x.x` auflöst, lassen Sie
      den gefährlichen Schalter zunächst ausgeschaltet. Telegram-Medien erlauben den RFC-2544-
      Benchmarkbereich bereits standardmäßig.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` schwächt Telegram-
      Medien-SSRF-Schutzmaßnahmen. Verwenden Sie es nur für vertrauenswürdige, operator-kontrollierte Proxy-
      Umgebungen wie Clash-, Mihomo- oder Surge-Fake-IP-Routing, wenn diese private oder Special-Use-Antworten außerhalb des RFC-2544-Benchmark-
      bereichs synthetisieren. Lassen Sie es für normalen öffentlichen Internetzugriff auf Telegram ausgeschaltet.
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

Weitere Hilfe: [Fehlerbehebung für Kanäle](/de/channels/troubleshooting).

## Konfigurationsreferenz

Primäre Referenz: [Konfigurationsreferenz - Telegram](/de/gateway/config-channels#telegram).

<Accordion title="Wichtige Telegram-Felder">

- Start/Authentifizierung: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` muss auf eine reguläre Datei zeigen; Symlinks werden abgelehnt)
- Zugriffskontrolle: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, Top-Level-`bindings[]` (`type: "acp"`)
- Ausführungsgenehmigungen: `execApprovals`, `accounts.*.execApprovals`
- Befehl/Menü: `commands.native`, `commands.nativeSkills`, `customCommands`
- Threads/Antworten: `replyToMode`, `dm.threadReplies`, `direct.*.threadReplies`
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
Priorität bei mehreren Konten: Wenn zwei oder mehr Konto-IDs konfiguriert sind, setzen Sie `channels.telegram.defaultAccount` (oder schließen Sie `channels.telegram.accounts.default` ein), um das Standardrouting explizit zu machen. Andernfalls fällt OpenClaw auf die erste normalisierte Konto-ID zurück und `openclaw doctor` warnt. Benannte Konten erben `channels.telegram.allowFrom` / `groupAllowFrom`, aber nicht die Werte von `accounts.default.*`.
</Note>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/de/channels/pairing">
    Koppeln Sie einen Telegram-Benutzer mit dem Gateway.
  </Card>
  <Card title="Gruppen" icon="users" href="/de/channels/groups">
    Verhalten von Gruppen- und Themen-Allowlist.
  </Card>
  <Card title="Kanalrouting" icon="route" href="/de/channels/channel-routing">
    Leiten Sie eingehende Nachrichten an Agenten weiter.
  </Card>
  <Card title="Sicherheit" icon="shield" href="/de/gateway/security">
    Bedrohungsmodell und Härtung.
  </Card>
  <Card title="Multi-Agent-Routing" icon="sitemap" href="/de/concepts/multi-agent">
    Ordnen Sie Gruppen und Themen Agenten zu.
  </Card>
  <Card title="Fehlerbehebung" icon="wrench" href="/de/channels/troubleshooting">
    Kanalübergreifende Diagnose.
  </Card>
</CardGroup>
