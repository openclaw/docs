---
read_when:
    - Arbeiten an Telegram-Funktionen oder Webhooks
summary: Telegram-Bot-Supportstatus, Funktionen und Konfiguration
title: Telegram
x-i18n:
    generated_at: "2026-04-25T13:42:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 24c32a83e86358afb662c9c354a1b538c90693d07dcc048eaf047dabd6822f7e
    source_path: channels/telegram.md
    workflow: 15
---

Produktionsreif für Bot-DMs und Gruppen über grammY. Long Polling ist der Standardmodus; der Webhook-Modus ist optional.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/de/channels/pairing">
    Die Standard-DM-Richtlinie für Telegram ist Pairing.
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
  <Step title="Erstellen Sie das Bot-Token in BotFather">
    Öffnen Sie Telegram und chatten Sie mit **@BotFather** (stellen Sie sicher, dass der Handle genau `@BotFather` ist).

    Führen Sie `/newbot` aus, folgen Sie den Anweisungen und speichern Sie das Token.

  </Step>

  <Step title="Konfigurieren Sie Token und DM-Richtlinie">

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

  <Step title="Starten Sie das Gateway und genehmigen Sie die erste DM">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Pairing-Codes laufen nach 1 Stunde ab.

  </Step>

  <Step title="Fügen Sie den Bot zu einer Gruppe hinzu">
    Fügen Sie den Bot Ihrer Gruppe hinzu und setzen Sie dann `channels.telegram.groups` und `groupPolicy` passend zu Ihrem Zugriffsmodell.
  </Step>
</Steps>

<Note>
Die Auflösung des Tokens ist kontobewusst. In der Praxis haben Werte in der Konfiguration Vorrang vor dem Env-Fallback, und `TELEGRAM_BOT_TOKEN` gilt nur für das Standardkonto.
</Note>

## Einstellungen auf der Telegram-Seite

<AccordionGroup>
  <Accordion title="Datenschutzmodus und Gruppensichtbarkeit">
    Telegram-Bots verwenden standardmäßig den **Privacy Mode**, der einschränkt, welche Gruppennachrichten sie empfangen.

    Wenn der Bot alle Gruppennachrichten sehen muss, gehen Sie wie folgt vor:

    - deaktivieren Sie den Datenschutzmodus über `/setprivacy`, oder
    - machen Sie den Bot zu einem Gruppenadministrator.

    Wenn Sie den Datenschutzmodus umschalten, entfernen Sie den Bot aus jeder Gruppe und fügen Sie ihn erneut hinzu, damit Telegram die Änderung anwendet.

  </Accordion>

  <Accordion title="Gruppenberechtigungen">
    Der Administratorstatus wird in den Telegram-Gruppeneinstellungen gesteuert.

    Admin-Bots empfangen alle Gruppennachrichten, was für ein stets aktives Gruppenverhalten nützlich ist.

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
    - `allowlist` (erfordert mindestens eine Absender-ID in `allowFrom`)
    - `open` (erfordert, dass `allowFrom` `"*"` enthält)
    - `disabled`

    `channels.telegram.allowFrom` akzeptiert numerische Telegram-Benutzer-IDs. Präfixe `telegram:` / `tg:` werden akzeptiert und normalisiert.
    `dmPolicy: "allowlist"` mit leerem `allowFrom` blockiert alle DMs und wird von der Konfigurationsvalidierung abgelehnt.
    Die Einrichtung fragt nur nach numerischen Benutzer-IDs.
    Wenn Sie ein Upgrade durchgeführt haben und Ihre Konfiguration `@username`-Allowlist-Einträge enthält, führen Sie `openclaw doctor --fix` aus, um sie aufzulösen (Best Effort; erfordert ein Telegram-Bot-Token).
    Wenn Sie sich zuvor auf Allowlist-Dateien im Pairing-Speicher verlassen haben, kann `openclaw doctor --fix` Einträge in `channels.telegram.allowFrom` für Allowlist-Abläufe wiederherstellen (zum Beispiel, wenn `dmPolicy: "allowlist"` noch keine expliziten IDs hat).

    Für Bots mit einem Eigentümer sollten Sie `dmPolicy: "allowlist"` mit expliziten numerischen `allowFrom`-IDs bevorzugen, damit die Zugriffsrichtlinie dauerhaft in der Konfiguration bleibt (statt von früheren Pairing-Genehmigungen abzuhängen).

    Häufiges Missverständnis: Die Genehmigung des DM-Pairings bedeutet nicht „dieser Absender ist überall autorisiert“.
    Pairing gewährt nur DM-Zugriff. Die Autorisierung von Absendern in Gruppen stammt weiterhin aus expliziten Allowlist-Konfigurationen.
    Wenn Sie möchten, dass „ich einmal autorisiert bin und sowohl DMs als auch Gruppenbefehle funktionieren“, tragen Sie Ihre numerische Telegram-Benutzer-ID in `channels.telegram.allowFrom` ein.

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
         - mit `groupPolicy: "open"`: jede Gruppe kann die Prüfungen der Gruppen-ID bestehen
         - mit `groupPolicy: "allowlist"` (Standard): Gruppen werden blockiert, bis Sie `groups`-Einträge (oder `"*"`) hinzufügen
       - `groups` konfiguriert: wirkt als Allowlist (explizite IDs oder `"*"`)

    2. **Welche Absender in Gruppen erlaubt sind** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (Standard)
       - `disabled`

    `groupAllowFrom` wird für die Filterung von Gruppenabsendern verwendet. Wenn es nicht gesetzt ist, greift Telegram auf `allowFrom` zurück.
    `groupAllowFrom`-Einträge sollten numerische Telegram-Benutzer-IDs sein (Präfixe `telegram:` / `tg:` werden normalisiert).
    Legen Sie Telegram-Gruppen- oder Supergroup-Chat-IDs nicht in `groupAllowFrom` ab. Negative Chat-IDs gehören unter `channels.telegram.groups`.
    Nicht numerische Einträge werden für die Autorisierung von Absendern ignoriert.
    Sicherheitsgrenze (`2026.2.25+`): Die Authentifizierung von Gruppenabsendern übernimmt **nicht** Genehmigungen aus dem DM-Pairing-Speicher.
    Pairing bleibt nur für DMs. Für Gruppen setzen Sie `groupAllowFrom` oder `allowFrom` pro Gruppe/pro Topic.
    Wenn `groupAllowFrom` nicht gesetzt ist, greift Telegram auf `allowFrom` aus der Konfiguration zurück, nicht auf den Pairing-Speicher.
    Praktisches Muster für Bots mit einem Eigentümer: Setzen Sie Ihre Benutzer-ID in `channels.telegram.allowFrom`, lassen Sie `groupAllowFrom` ungesetzt und erlauben Sie die Zielgruppen unter `channels.telegram.groups`.
    Laufzeithinweis: Wenn `channels.telegram` vollständig fehlt, verwendet die Laufzeit standardmäßig fail-closed `groupPolicy="allowlist"`, es sei denn, `channels.defaults.groupPolicy` ist explizit gesetzt.

    Beispiel: Jedes Mitglied in einer bestimmten Gruppe zulassen:

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

    Beispiel: Nur bestimmte Benutzer innerhalb einer bestimmten Gruppe zulassen:

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

      - Legen Sie negative Telegram-Gruppen- oder Supergroup-Chat-IDs wie `-1001234567890` unter `channels.telegram.groups` ab.
      - Legen Sie Telegram-Benutzer-IDs wie `8734062810` unter `groupAllowFrom` ab, wenn Sie einschränken möchten, welche Personen innerhalb einer erlaubten Gruppe den Bot auslösen können.
      - Verwenden Sie `groupAllowFrom: ["*"]` nur dann, wenn jedes Mitglied einer erlaubten Gruppe mit dem Bot sprechen können soll.
    </Warning>

  </Tab>

  <Tab title="Erwähnungsverhalten">
    Antworten in Gruppen erfordern standardmäßig eine Erwähnung.

    Eine Erwähnung kann erfolgen durch:

    - native `@botusername`-Erwähnung, oder
    - Erwähnungsmuster in:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Sitzungsbezogene Befehlsumschalter:

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

    Die Gruppen-Chat-ID abrufen:

    - eine Gruppennachricht an `@userinfobot` / `@getidsbot` weiterleiten
    - oder `chat.id` aus `openclaw logs --follow` lesen
    - oder die Bot-API `getUpdates` prüfen

  </Tab>
</Tabs>

## Laufzeitverhalten

- Telegram gehört dem Gateway-Prozess.
- Das Routing ist deterministisch: Eingehende Telegram-Antworten gehen zurück an Telegram (das Modell wählt keine Kanäle aus).
- Eingehende Nachrichten werden in den gemeinsamen Kanal-Umschlag mit Antwortmetadaten und Medien-Platzhaltern normalisiert.
- Gruppensitzungen werden nach Gruppen-ID isoliert. Foren-Topics hängen `:topic:<threadId>` an, um Topics isoliert zu halten.
- DM-Nachrichten können `message_thread_id` enthalten; OpenClaw routet sie mit thread-sensitiven Sitzungsschlüsseln und bewahrt die Thread-ID für Antworten.
- Long Polling verwendet den grammY-Runner mit Sequenzierung pro Chat/pro Thread. Die gesamte Runner-Sink-Parallelität verwendet `agents.defaults.maxConcurrent`.
- Long Polling ist innerhalb jedes Gateway-Prozesses geschützt, sodass jeweils nur ein aktiver Poller ein Bot-Token verwenden kann. Wenn Sie weiterhin `getUpdates`-409-Konflikte sehen, verwendet wahrscheinlich ein anderes OpenClaw-Gateway, Skript oder ein externer Poller dasselbe Token.
- Neustarts des Long-Polling-Watchdogs werden standardmäßig nach 120 Sekunden ohne abgeschlossene `getUpdates`-Liveness ausgelöst. Erhöhen Sie `channels.telegram.pollingStallThresholdMs` nur, wenn Ihre Bereitstellung weiterhin falsche Neustarts wegen Polling-Stillstand während lang laufender Arbeit sieht. Der Wert ist in Millisekunden angegeben und von `30000` bis `600000` erlaubt; Überschreibungen pro Konto werden unterstützt.
- Die Telegram Bot API unterstützt keine Lesebestätigungen (`sendReadReceipts` gilt nicht).

## Funktionsreferenz

<AccordionGroup>
  <Accordion title="Live-Stream-Vorschau (Nachrichtenbearbeitungen)">
    OpenClaw kann partielle Antworten in Echtzeit streamen:

    - Direktchats: Vorschau-Nachricht + `editMessageText`
    - Gruppen/Topics: Vorschau-Nachricht + `editMessageText`

    Voraussetzung:

    - `channels.telegram.streaming` ist `off | partial | block | progress` (Standard: `partial`)
    - `progress` wird auf Telegram auf `partial` abgebildet (Kompatibilität mit kanalübergreifender Benennung)
    - `streaming.preview.toolProgress` steuert, ob Tool-/Fortschrittsaktualisierungen dieselbe bearbeitete Vorschau-Nachricht wiederverwenden (Standard: `true`, wenn Vorschau-Streaming aktiv ist)
    - Legacy-`channels.telegram.streamMode` und boolesche `streaming`-Werte werden erkannt; führen Sie `openclaw doctor --fix` aus, um sie nach `channels.telegram.streaming.mode` zu migrieren

    Tool-Fortschritts-Vorschauaktualisierungen sind die kurzen Zeilen wie „Working...“, die angezeigt werden, während Tools laufen, zum Beispiel bei Befehlsausführung, Dateilesevorgängen, Planungsaktualisierungen oder Patch-Zusammenfassungen. Telegram lässt diese standardmäßig aktiviert, um dem veröffentlichten OpenClaw-Verhalten ab `v2026.4.22` zu entsprechen. Um die bearbeitete Vorschau für Antworttext beizubehalten, aber die Tool-Fortschrittszeilen auszublenden, setzen Sie:

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

    Verwenden Sie `streaming.mode: "off"` nur dann, wenn Sie Telegram-Vorschaubearbeitungen vollständig deaktivieren möchten. Verwenden Sie `streaming.preview.toolProgress: false`, wenn Sie nur die Tool-Fortschrittsstatuszeilen deaktivieren möchten.

    Für reine Textantworten:

    - DM: OpenClaw behält dieselbe Vorschau-Nachricht bei und führt eine abschließende Bearbeitung direkt darin aus (keine zweite Nachricht)
    - Gruppe/Topic: OpenClaw behält dieselbe Vorschau-Nachricht bei und führt eine abschließende Bearbeitung direkt darin aus (keine zweite Nachricht)

    Für komplexe Antworten (zum Beispiel Medien-Nutzlasten) greift OpenClaw auf die normale endgültige Zustellung zurück und bereinigt dann die Vorschau-Nachricht.

    Vorschau-Streaming ist vom Block-Streaming getrennt. Wenn Block-Streaming für Telegram explizit aktiviert ist, überspringt OpenClaw den Vorschau-Stream, um doppeltes Streaming zu vermeiden.

    Wenn nativer Draft-Transport nicht verfügbar ist oder abgelehnt wird, greift OpenClaw automatisch auf `sendMessage` + `editMessageText` zurück.

    Telegram-spezifischer Reasoning-Stream:

    - `/reasoning stream` sendet Reasoning während der Generierung an die Live-Vorschau
    - die endgültige Antwort wird ohne Reasoning-Text gesendet

  </Accordion>

  <Accordion title="Formatierung und HTML-Fallback">
    Ausgehender Text verwendet Telegram `parse_mode: "HTML"`.

    - Markdown-ähnlicher Text wird in Telegram-sicheres HTML gerendert.
    - Rohes Modell-HTML wird escaped, um Telegram-Parse-Fehler zu reduzieren.
    - Wenn Telegram geparstes HTML ablehnt, versucht OpenClaw es erneut als Klartext.

    Link-Vorschauen sind standardmäßig aktiviert und können mit `channels.telegram.linkPreview: false` deaktiviert werden.

  </Accordion>

  <Accordion title="Native Befehle und benutzerdefinierte Befehle">
    Die Registrierung des nativen Telegram-Befehlsmenüs wird beim Start mit `setMyCommands` durchgeführt.

    Standardwerte für native Befehle:

    - `commands.native: "auto"` aktiviert native Befehle für Telegram

    Benutzerdefinierte Einträge zum Befehlsmenü hinzufügen:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Git-Backup" },
        { command: "generate", description: "Ein Bild erstellen" },
      ],
    },
  },
}
```

    Regeln:

    - Namen werden normalisiert (führendes `/` entfernen, kleinschreiben)
    - gültiges Muster: `a-z`, `0-9`, `_`, Länge `1..32`
    - benutzerdefinierte Befehle können native Befehle nicht überschreiben
    - Konflikte/Duplikate werden übersprungen und protokolliert

    Hinweise:

    - benutzerdefinierte Befehle sind nur Menüeinträge; sie implementieren kein Verhalten automatisch
    - Plugin-/Skill-Befehle können weiterhin funktionieren, wenn sie eingegeben werden, auch wenn sie nicht im Telegram-Menü angezeigt werden

    Wenn native Befehle deaktiviert sind, werden integrierte Befehle entfernt. Benutzerdefinierte/Plugin-Befehle können bei entsprechender Konfiguration weiterhin registriert werden.

    Häufige Einrichtungsfehler:

    - `setMyCommands failed` mit `BOT_COMMANDS_TOO_MUCH` bedeutet, dass das Telegram-Menü auch nach dem Kürzen noch überfüllt war; reduzieren Sie Plugin-/Skill-/benutzerdefinierte Befehle oder deaktivieren Sie `channels.telegram.commands.native`.
    - `setMyCommands failed` mit Netzwerk-/Fetch-Fehlern bedeutet in der Regel, dass ausgehendes DNS/HTTPS zu `api.telegram.org` blockiert ist.

    ### Geräte-Pairing-Befehle (Plugin `device-pair`)

    Wenn das Plugin `device-pair` installiert ist:

    1. `/pair` erzeugt einen Einrichtungscode
    2. Code in die iOS-App einfügen
    3. `/pair pending` listet ausstehende Anfragen auf (einschließlich Rolle/Scopes)
    4. die Anfrage genehmigen:
       - `/pair approve <requestId>` für explizite Genehmigung
       - `/pair approve`, wenn es nur eine ausstehende Anfrage gibt
       - `/pair approve latest` für die neueste

    Der Einrichtungscode enthält ein kurzlebiges Bootstrap-Token. Die integrierte Bootstrap-Übergabe hält das primäre Node-Token bei `scopes: []`; jedes übergebene Operator-Token bleibt auf `operator.approvals`, `operator.read`, `operator.talk.secrets` und `operator.write` beschränkt. Bootstrap-Scop-Prüfungen sind rollenpräfixbasiert, sodass diese Operator-Allowlist nur Operator-Anfragen erfüllt; Rollen, die keine Operatoren sind, benötigen weiterhin Scopes unter ihrem eigenen Rollenpräfix.

    Wenn ein Gerät es mit geänderten Authentifizierungsdetails erneut versucht (zum Beispiel Rolle/Scopes/öffentlicher Schlüssel), wird die vorherige ausstehende Anfrage ersetzt und die neue Anfrage verwendet eine andere `requestId`. Führen Sie vor der Genehmigung erneut `/pair pending` aus.

    Weitere Details: [Pairing](/de/channels/pairing#pair-via-telegram-recommended-for-ios).

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

    Geltungsbereiche:

    - `off`
    - `dm`
    - `group`
    - `all`
    - `allowlist` (Standard)

    Legacy-`capabilities: ["inlineButtons"]` wird auf `inlineButtons: "all"` abgebildet.

    Beispiel für Nachrichtenaktion:

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

    Nachrichtenaktionen des Kanals stellen ergonomische Aliase bereit (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Gating-Steuerelemente:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (Standard: deaktiviert)

    Hinweis: `edit` und `topic-create` sind derzeit standardmäßig aktiviert und haben keine separaten `channels.telegram.actions.*`-Umschalter.
    Laufzeitsendungen verwenden den aktiven Snapshot aus Konfiguration/Secrets (Start/Reload), daher führen Aktionspfade keine Ad-hoc-Neuauflösung von SecretRef pro Sendevorgang durch.

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

    Hinweis: `off` deaktiviert implizites Antwort-Threading. Explizite `[[reply_to_*]]`-Tags werden weiterhin berücksichtigt.

  </Accordion>

  <Accordion title="Forum-Topics und Thread-Verhalten">
    Forum-Supergroups:

    - Topic-Sitzungsschlüssel hängen `:topic:<threadId>` an
    - Antworten und Tippindikatoren zielen auf den Topic-Thread
    - Topic-Konfigurationspfad:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Sonderfall „Allgemeines Topic“ (`threadId=1`):

    - Nachrichtensendungen lassen `message_thread_id` weg (Telegram lehnt `sendMessage(...thread_id=1)` ab)
    - Tippaktionen enthalten weiterhin `message_thread_id`

    Topic-Vererbung: Topic-Einträge erben Gruppeneinstellungen, sofern sie nicht überschrieben werden (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` ist nur für Topics und wird nicht von Gruppenstandards geerbt.

    **Agent-Routing pro Topic**: Jedes Topic kann durch Setzen von `agentId` in der Topic-Konfiguration an einen anderen Agenten weitergeleitet werden. Dadurch erhält jedes Topic seinen eigenen isolierten Workspace, Speicher und seine eigene Sitzung. Beispiel:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // Allgemeines Topic → main-Agent
                "3": { agentId: "zu" },        // Dev-Topic → zu-Agent
                "5": { agentId: "coder" }      // Code-Review → coder-Agent
              }
            }
          }
        }
      }
    }
    ```

    Jedes Topic hat dann seinen eigenen Sitzungsschlüssel: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Persistente ACP-Topic-Bindung**: Forum-Topics können ACP-Harness-Sitzungen über typisierte ACP-Bindings der obersten Ebene anheften (`bindings[]` mit `type: "acp"` und `match.channel: "telegram"`, `peer.kind: "group"` sowie einer Topic-qualifizierten ID wie `-1001234567890:topic:42`). Derzeit auf Forum-Topics in Gruppen/Supergroups beschränkt. Siehe [ACP Agents](/de/tools/acp-agents).

    **Thread-gebundener ACP-Spawn aus dem Chat**: `/acp spawn <agent> --thread here|auto` bindet das aktuelle Topic an eine neue ACP-Sitzung; Folge-Nachrichten werden direkt dorthin geleitet. OpenClaw pinnt die Spawn-Bestätigung innerhalb des Topics an. Erfordert `channels.telegram.threadBindings.spawnAcpSessions=true`.

    Der Template-Kontext stellt `MessageThreadId` und `IsForum` bereit. DM-Chats mit `message_thread_id` behalten das DM-Routing bei, verwenden aber thread-sensitive Sitzungsschlüssel.

  </Accordion>

  <Accordion title="Audio, Video und Sticker">
    ### Audionachrichten

    Telegram unterscheidet zwischen Sprachnotizen und Audiodateien.

    - Standard: Verhalten als Audiodatei
    - Tag `[[audio_as_voice]]` in der Agentenantwort, um das Senden als Sprachnotiz zu erzwingen

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

    Telegram unterscheidet zwischen Videodateien und Video-Notizen.

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

    Video-Notizen unterstützen keine Bildunterschriften; bereitgestellter Nachrichtentext wird separat gesendet.

    ### Sticker

    Verarbeitung eingehender Sticker:

    - statisches WEBP: wird heruntergeladen und verarbeitet (Platzhalter `<media:sticker>`)
    - animiertes TGS: wird übersprungen
    - Video-WEBM: wird übersprungen

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

    Sticker-Aktion zum Senden:

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

  <Accordion title="Benachrichtigungen über Reaktionen">
    Telegram-Reaktionen kommen als `message_reaction`-Updates an (getrennt von Nachrichten-Nutzlasten).

    Wenn aktiviert, reiht OpenClaw Systemereignisse ein wie:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Konfiguration:

    - `channels.telegram.reactionNotifications`: `off | own | all` (Standard: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (Standard: `minimal`)

    Hinweise:

    - `own` bedeutet nur Benutzerreaktionen auf vom Bot gesendete Nachrichten (Best Effort über den Cache gesendeter Nachrichten).
    - Reaktionsereignisse berücksichtigen weiterhin die Telegram-Zugriffskontrollen (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); nicht autorisierte Absender werden verworfen.
    - Telegram stellt in Reaktions-Updates keine Thread-IDs bereit.
      - Nicht-Forum-Gruppen werden an die Gruppenchatsitzung geleitet
      - Forum-Gruppen werden an die Sitzung des allgemeinen Group-Topics (`:topic:1`) geleitet, nicht an das genaue ursprüngliche Topic

    `allowed_updates` für Polling/Webhook schließen `message_reaction` automatisch ein.

  </Accordion>

  <Accordion title="Ack-Reaktionen">
    `ackReaction` sendet ein Bestätigungs-Emoji, während OpenClaw eine eingehende Nachricht verarbeitet.

    Reihenfolge der Auflösung:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - Fallback auf das Emoji der Agentenidentität (`agents.list[].identity.emoji`, sonst "👀")

    Hinweise:

    - Telegram erwartet Unicode-Emojis (zum Beispiel "👀").
    - Verwenden Sie `""`, um die Reaktion für einen Kanal oder ein Konto zu deaktivieren.

  </Accordion>

  <Accordion title="Konfigurationsschreibvorgänge durch Telegram-Ereignisse und -Befehle">
    Schreibvorgänge in die Kanalkonfiguration sind standardmäßig aktiviert (`configWrites !== false`).

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
    Standard ist Long Polling. Für den Webhook-Modus setzen Sie `channels.telegram.webhookUrl` und `channels.telegram.webhookSecret`; optional `webhookPath`, `webhookHost`, `webhookPort` (Standardwerte `/telegram-webhook`, `127.0.0.1`, `8787`).

    Der lokale Listener bindet an `127.0.0.1:8787`. Für öffentlichen Ingress schalten Sie entweder einen Reverse Proxy vor den lokalen Port oder setzen bewusst `webhookHost: "0.0.0.0"`.

    Der Webhook-Modus validiert Request-Guards, das geheime Telegram-Token und den JSON-Body, bevor `200` an Telegram zurückgegeben wird.
    OpenClaw verarbeitet das Update dann asynchron über dieselben Bot-Lanes pro Chat/pro Topic, die auch beim Long Polling verwendet werden, sodass langsame Agenten-Turns das Telegram-Delivery-ACK nicht blockieren.

  </Accordion>

  <Accordion title="Limits, Wiederholungen und CLI-Ziele">
    - `channels.telegram.textChunkLimit` hat standardmäßig den Wert 4000.
    - `channels.telegram.chunkMode="newline"` bevorzugt Absatzgrenzen (Leerzeilen) vor dem Aufteilen nach Länge.
    - `channels.telegram.mediaMaxMb` (Standard 100) begrenzt die Größe eingehender und ausgehender Telegram-Medien.
    - `channels.telegram.timeoutSeconds` überschreibt das Timeout des Telegram-API-Clients (wenn nicht gesetzt, gilt der grammY-Standard).
    - `channels.telegram.pollingStallThresholdMs` ist standardmäßig `120000`; passen Sie es nur zwischen `30000` und `600000` an, wenn es zu falsch-positiven Neustarts wegen Polling-Stillstand kommt.
    - der Verlauf des Gruppenkontexts verwendet `channels.telegram.historyLimit` oder `messages.groupChat.historyLimit` (Standard 50); `0` deaktiviert ihn.
    - zusätzlicher Kontext aus Antworten/Zitaten/Weiterleitungen wird derzeit wie empfangen weitergegeben.
    - Telegram-Allowlists steuern in erster Linie, wer den Agenten auslösen kann, nicht eine vollständige Redaktionsgrenze für zusätzlichen Kontext.
    - DM-Verlaufssteuerung:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - die Konfiguration `channels.telegram.retry` gilt für Telegram-Sendehilfen (CLI/Tools/Aktionen) bei behebbaren ausgehenden API-Fehlern.

    Das CLI-Sendeziel kann eine numerische Chat-ID oder ein Benutzername sein:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Telegram-Polls verwenden `openclaw message poll` und unterstützen Forum-Topics:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Telegram-spezifische Poll-Flags:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` für Forum-Topics (oder verwenden Sie ein `:topic:`-Ziel)

    Telegram-Senden unterstützt außerdem:

    - `--presentation` mit `buttons`-Blöcken für Inline-Tastaturen, wenn `channels.telegram.capabilities.inlineButtons` dies für die Zieloberfläche erlaubt
    - `--pin` oder `--delivery '{"pin":true}'`, um angeheftete Zustellung anzufordern, wenn der Bot in diesem Chat anheften kann
    - `--force-document`, um ausgehende Bilder und GIFs als Dokumente statt als komprimierte Foto- oder animierte Medien-Uploads zu senden

    Aktions-Gating:

    - `channels.telegram.actions.sendMessage=false` deaktiviert ausgehende Telegram-Nachrichten, einschließlich Polls
    - `channels.telegram.actions.poll=false` deaktiviert die Erstellung von Telegram-Polls, während reguläre Sendungen aktiviert bleiben

  </Accordion>

  <Accordion title="Exec-Genehmigungen in Telegram">
    Telegram unterstützt Exec-Genehmigungen in DMs von Genehmigern und kann Aufforderungen optional im ursprünglichen Chat oder Topic posten. Genehmiger müssen numerische Telegram-Benutzer-IDs sein.

    Konfigurationspfad:

    - `channels.telegram.execApprovals.enabled` (wird automatisch aktiviert, wenn mindestens ein Genehmiger auflösbar ist)
    - `channels.telegram.execApprovals.approvers` (greift auf numerische Eigentümer-IDs aus `allowFrom` / `defaultTo` zurück)
    - `channels.telegram.execApprovals.target`: `dm` (Standard) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    Kanalzustellung zeigt den Befehlstext im Chat an; aktivieren Sie `channel` oder `both` nur in vertrauenswürdigen Gruppen/Topics. Wenn die Aufforderung in einem Forum-Topic landet, bewahrt OpenClaw das Topic für die Genehmigungsaufforderung und die Nachverfolgung. Exec-Genehmigungen laufen standardmäßig nach 30 Minuten ab.

    Inline-Genehmigungsschaltflächen erfordern außerdem, dass `channels.telegram.capabilities.inlineButtons` die Zieloberfläche erlaubt (`dm`, `group` oder `all`). Genehmigungs-IDs mit dem Präfix `plugin:` werden über Plugin-Genehmigungen aufgelöst; andere werden zuerst über Exec-Genehmigungen aufgelöst.

    Siehe [Exec approvals](/de/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Steuerung von Fehlerantworten

Wenn beim Agenten ein Zustellungs- oder Provider-Fehler auftritt, kann Telegram entweder mit dem Fehlertext antworten oder ihn unterdrücken. Zwei Konfigurationsschlüssel steuern dieses Verhalten:

| Schlüssel                            | Werte             | Standard | Beschreibung                                                                                           |
| ------------------------------------ | ----------------- | -------- | ------------------------------------------------------------------------------------------------------ |
| `channels.telegram.errorPolicy`      | `reply`, `silent` | `reply`  | `reply` sendet eine benutzerfreundliche Fehlermeldung an den Chat. `silent` unterdrückt Fehlerantworten vollständig. |
| `channels.telegram.errorCooldownMs`  | Zahl (ms)         | `60000`  | Mindestzeit zwischen Fehlerantworten an denselben Chat. Verhindert Fehler-Spam bei Ausfällen.         |

Überschreibungen pro Konto, pro Gruppe und pro Topic werden unterstützt (gleiche Vererbung wie bei anderen Telegram-Konfigurationsschlüsseln).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "reply",
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

    - Wenn `requireMention=false`, muss der Telegram-Datenschutzmodus volle Sichtbarkeit erlauben.
      - BotFather: `/setprivacy` -> Deaktivieren
      - dann Bot aus der Gruppe entfernen und erneut hinzufügen
    - `openclaw channels status` warnt, wenn die Konfiguration unerwähnte Gruppennachrichten erwartet.
    - `openclaw channels status --probe` kann explizite numerische Gruppen-IDs prüfen; der Platzhalter `"*"` kann nicht per Mitgliedschaft geprüft werden.
    - schneller Sitzungstest: `/activation always`.

  </Accordion>

  <Accordion title="Bot sieht überhaupt keine Gruppennachrichten">

    - wenn `channels.telegram.groups` vorhanden ist, muss die Gruppe aufgeführt sein (oder `"*"` enthalten)
    - überprüfen Sie die Bot-Mitgliedschaft in der Gruppe
    - prüfen Sie die Logs: `openclaw logs --follow` auf Gründe für das Überspringen

  </Accordion>

  <Accordion title="Befehle funktionieren teilweise oder gar nicht">

    - autorisieren Sie Ihre Absenderidentität (Pairing und/oder numerisches `allowFrom`)
    - die Befehlsautorisierung gilt weiterhin, auch wenn die Gruppenrichtlinie `open` ist
    - `setMyCommands failed` mit `BOT_COMMANDS_TOO_MUCH` bedeutet, dass das native Menü zu viele Einträge hat; reduzieren Sie Plugin-/Skill-/benutzerdefinierte Befehle oder deaktivieren Sie native Menüs
    - `setMyCommands failed` mit Netzwerk-/Fetch-Fehlern weist in der Regel auf Probleme mit der DNS-/HTTPS-Erreichbarkeit von `api.telegram.org` hin

  </Accordion>

  <Accordion title="Polling- oder Netzwerk-Instabilität">

    - Node 22+ + benutzerdefinierter Fetch/Proxy kann sofortiges Abbruchverhalten auslösen, wenn AbortSignal-Typen nicht übereinstimmen.
    - Einige Hosts lösen `api.telegram.org` zuerst zu IPv6 auf; fehlerhafter IPv6-Egress kann zu intermittierenden Telegram-API-Fehlern führen.
    - Wenn die Logs `TypeError: fetch failed` oder `Network request for 'getUpdates' failed!` enthalten, versucht OpenClaw diese jetzt als behebbare Netzwerkfehler erneut.
    - Wenn die Logs `Polling stall detected` enthalten, startet OpenClaw das Polling neu und baut den Telegram-Transport nach standardmäßig 120 Sekunden ohne abgeschlossene Long-Poll-Liveness neu auf.
    - Erhöhen Sie `channels.telegram.pollingStallThresholdMs` nur, wenn lang laufende `getUpdates`-Aufrufe in Ordnung sind, Ihr Host aber weiterhin falsch-positive Neustarts wegen Polling-Stillstand meldet. Anhaltende Stillstände weisen in der Regel auf Probleme mit Proxy, DNS, IPv6 oder TLS-Egress zwischen dem Host und `api.telegram.org` hin.
    - Auf VPS-Hosts mit instabilem direktem Egress/TLS leiten Sie Telegram-API-Aufrufe über `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ verwendet standardmäßig `autoSelectFamily=true` (außer WSL2) und `dnsResultOrder=ipv4first`.
    - Wenn Ihr Host WSL2 ist oder explizit besser mit reinem IPv4-Verhalten funktioniert, erzwingen Sie die Familienauswahl:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC-2544-Benchmarkbereichs-Antworten (`198.18.0.0/15`) sind für Telegram-Mediendownloads standardmäßig bereits erlaubt. Wenn ein vertrauenswürdiger Fake-IP- oder transparenter Proxy `api.telegram.org` bei Mediendownloads auf eine andere private/interne/spezielle Adresse umschreibt, können Sie den nur für Telegram geltenden Bypass aktivieren:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Dasselbe Opt-in ist auch pro Konto unter
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork` verfügbar.
    - Wenn Ihr Proxy Telegram-Media-Hosts in `198.18.x.x` auflöst, lassen Sie das gefährliche Flag zunächst deaktiviert. Telegram-Medien erlauben den RFC-2544-Benchmarkbereich standardmäßig bereits.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` schwächt die SSRF-Schutzmaßnahmen für Telegram-Medien.
      Verwenden Sie dies nur in vertrauenswürdigen, vom Betreiber kontrollierten Proxy-Umgebungen wie Clash, Mihomo oder Surge mit Fake-IP-Routing, wenn diese private oder spezielle Antworten außerhalb des RFC-2544-Benchmarkbereichs synthetisieren. Lassen Sie es für normalen öffentlichen Telegram-Internetzugang deaktiviert.
    </Warning>

    - Umgebungsüberschreibungen (vorübergehend):
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

Mehr Hilfe: [Fehlerbehebung für Kanäle](/de/channels/troubleshooting).

## Konfigurationsreferenz

Primäre Referenz: [Konfigurationsreferenz - Telegram](/de/gateway/config-channels#telegram).

<Accordion title="Wichtige Telegram-Felder">

- Start/Auth: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` muss auf eine reguläre Datei zeigen; Symlinks werden abgelehnt)
- Zugriffskontrolle: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` auf oberster Ebene (`type: "acp"`)
- Exec-Genehmigungen: `execApprovals`, `accounts.*.execApprovals`
- Befehl/Menü: `commands.native`, `commands.nativeSkills`, `customCommands`
- Threading/Antworten: `replyToMode`
- Streaming: `streaming` (Vorschau), `streaming.preview.toolProgress`, `blockStreaming`
- Formatierung/Zustellung: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- Medien/Netzwerk: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- Aktionen/Fähigkeiten: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- Reaktionen: `reactionNotifications`, `reactionLevel`
- Fehler: `errorPolicy`, `errorCooldownMs`
- Schreibvorgänge/Verlauf: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Priorität bei mehreren Konten: Wenn zwei oder mehr Konto-IDs konfiguriert sind, setzen Sie `channels.telegram.defaultAccount` (oder fügen Sie `channels.telegram.accounts.default` ein), um das Standard-Routing explizit festzulegen. Andernfalls greift OpenClaw auf die erste normalisierte Konto-ID zurück und `openclaw doctor` gibt eine Warnung aus. Benannte Konten erben `channels.telegram.allowFrom` / `groupAllowFrom`, aber nicht `accounts.default.*`-Werte.
</Note>

## Verwandt

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/de/channels/pairing">
    Einen Telegram-Benutzer mit dem Gateway pairen.
  </Card>
  <Card title="Gruppen" icon="users" href="/de/channels/groups">
    Verhalten von Allowlist für Gruppen und Topics.
  </Card>
  <Card title="Kanal-Routing" icon="route" href="/de/channels/channel-routing">
    Eingehende Nachrichten an Agenten weiterleiten.
  </Card>
  <Card title="Sicherheit" icon="shield" href="/de/gateway/security">
    Bedrohungsmodell und Härtung.
  </Card>
  <Card title="Routing für mehrere Agenten" icon="sitemap" href="/de/concepts/multi-agent">
    Gruppen und Topics Agenten zuordnen.
  </Card>
  <Card title="Fehlerbehebung" icon="wrench" href="/de/channels/troubleshooting">
    Kanalübergreifende Diagnose.
  </Card>
</CardGroup>
