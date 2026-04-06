---
read_when:
    - Einrichtung von Slack oder Fehlerbehebung für den Slack-Socket-/HTTP-Modus
summary: Slack-Einrichtung und Laufzeitverhalten (Socket Mode + HTTP Events API)
title: Slack
x-i18n:
    generated_at: "2026-04-06T03:07:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7e4ff2ce7d92276d62f4f3d3693ddb56ca163d5fdc2f1082ff7ba3421fada69c
    source_path: channels/slack.md
    workflow: 15
---

# Slack

Status: produktionsreif für DMs + Kanäle über Slack-App-Integrationen. Der Standardmodus ist Socket Mode; der HTTP Events API-Modus wird ebenfalls unterstützt.

<CardGroup cols={3}>
  <Card title="Kopplung" icon="link" href="/de/channels/pairing">
    Slack-DMs verwenden standardmäßig den Kopplungsmodus.
  </Card>
  <Card title="Slash-Befehle" icon="terminal" href="/de/tools/slash-commands">
    Natives Befehlsverhalten und Befehlskatalog.
  </Card>
  <Card title="Fehlerbehebung für Kanäle" icon="wrench" href="/de/channels/troubleshooting">
    Kanalübergreifende Diagnose- und Reparaturleitfäden.
  </Card>
</CardGroup>

## Schnelleinrichtung

<Tabs>
  <Tab title="Socket Mode (Standard)">
    <Steps>
      <Step title="Slack-App und Tokens erstellen">
        In den Slack-App-Einstellungen:

        - **Socket Mode** aktivieren
        - **App Token** (`xapp-...`) mit `connections:write` erstellen
        - App installieren und **Bot Token** (`xoxb-...`) kopieren
      </Step>

      <Step title="OpenClaw konfigurieren">

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      appToken: "xapp-...",
      botToken: "xoxb-...",
    },
  },
}
```

        Env-Fallback (nur Standardkonto):

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="App-Ereignisse abonnieren">
        Bot-Ereignisse abonnieren für:

        - `app_mention`
        - `message.channels`, `message.groups`, `message.im`, `message.mpim`
        - `reaction_added`, `reaction_removed`
        - `member_joined_channel`, `member_left_channel`
        - `channel_rename`
        - `pin_added`, `pin_removed`

        Außerdem in App Home die **Messages Tab** für DMs aktivieren.
      </Step>

      <Step title="Gateway starten">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP Events API-Modus">
    <Steps>
      <Step title="Slack-App für HTTP konfigurieren">

        - Modus auf HTTP setzen (`channels.slack.mode="http"`)
        - Slack-**Signing Secret** kopieren
        - Request URL für Event Subscriptions + Interactivity + Slash-Befehle auf denselben Webhook-Pfad setzen (Standard: `/slack/events`)

      </Step>

      <Step title="OpenClaw-HTTP-Modus konfigurieren">

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      botToken: "xoxb-...",
      signingSecret: "your-signing-secret",
      webhookPath: "/slack/events",
    },
  },
}
```

      </Step>

      <Step title="Eindeutige Webhook-Pfade für HTTP mit mehreren Konten verwenden">
        HTTP-Modus pro Konto wird unterstützt.

        Geben Sie jedem Konto einen eigenen `webhookPath`, damit Registrierungen nicht kollidieren.
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Manifest- und Scope-Checkliste

<AccordionGroup>
  <Accordion title="Beispiel für ein Slack-App-Manifest" defaultOpen>

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw",
      "always_online": true
    },
    "app_home": {
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "reactions:read",
        "reactions:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    }
  }
}
```

  </Accordion>

  <Accordion title="Optionale User-Token-Scopes (Leseoperationen)">
    Wenn Sie `channels.slack.userToken` konfigurieren, sind typische Lese-Scopes:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (wenn Sie von Slack-Suchlesevorgängen abhängen)

  </Accordion>
</AccordionGroup>

## Token-Modell

- `botToken` + `appToken` sind für Socket Mode erforderlich.
- HTTP-Modus erfordert `botToken` + `signingSecret`.
- `botToken`, `appToken`, `signingSecret` und `userToken` akzeptieren Klartext-Strings oder SecretRef-Objekte.
- Konfigurations-Tokens überschreiben das Env-Fallback.
- Das Env-Fallback `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` gilt nur für das Standardkonto.
- `userToken` (`xoxp-...`) ist nur per Konfiguration verfügbar (kein Env-Fallback) und verwendet standardmäßig schreibgeschütztes Verhalten (`userTokenReadOnly: true`).
- Optional: Fügen Sie `chat:write.customize` hinzu, wenn ausgehende Nachrichten die aktive Agent-Identität verwenden sollen (benutzerdefinierter `username` und Icon). `icon_emoji` verwendet die Syntax `:emoji_name:`.

Verhalten des Status-Snapshots:

- Die Inspektion von Slack-Konten verfolgt pro Anmeldedaten `*Source`- und `*Status`-Felder (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Der Status ist `available`, `configured_unavailable` oder `missing`.
- `configured_unavailable` bedeutet, dass das Konto über SecretRef oder eine andere nicht-inline Secret-Quelle konfiguriert ist, der aktuelle Befehls-/Laufzeitpfad den tatsächlichen Wert aber nicht auflösen konnte.
- Im HTTP-Modus ist `signingSecretStatus` enthalten; im Socket Mode ist das erforderliche Paar `botTokenStatus` + `appTokenStatus`.

<Tip>
Für Aktionen/Verzeichnislesevorgänge kann das User-Token bevorzugt werden, wenn es konfiguriert ist. Für Schreibvorgänge bleibt das Bot-Token bevorzugt; Schreibvorgänge mit User-Token sind nur erlaubt, wenn `userTokenReadOnly: false` gesetzt ist und das Bot-Token nicht verfügbar ist.
</Tip>

## Aktionen und Steuerungen

Slack-Aktionen werden über `channels.slack.actions.*` gesteuert.

Verfügbare Aktionsgruppen in den aktuellen Slack-Tools:

| Gruppe     | Standard |
| ---------- | -------- |
| messages   | aktiviert |
| reactions  | aktiviert |
| pins       | aktiviert |
| memberInfo | aktiviert |
| emojiList  | aktiviert |

Aktuelle Slack-Nachrichtenaktionen umfassen `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` und `emoji-list`.

## Zugriffskontrolle und Routing

<Tabs>
  <Tab title="DM-Richtlinie">
    `channels.slack.dmPolicy` steuert den DM-Zugriff (veraltet: `channels.slack.dm.policy`):

    - `pairing` (Standard)
    - `allowlist`
    - `open` (erfordert, dass `channels.slack.allowFrom` `"*"` enthält; veraltet: `channels.slack.dm.allowFrom`)
    - `disabled`

    DM-Flags:

    - `dm.enabled` (standardmäßig true)
    - `channels.slack.allowFrom` (bevorzugt)
    - `dm.allowFrom` (veraltet)
    - `dm.groupEnabled` (Gruppen-DMs standardmäßig false)
    - `dm.groupChannels` (optionale MPIM-Allowlist)

    Priorität bei mehreren Konten:

    - `channels.slack.accounts.default.allowFrom` gilt nur für das `default`-Konto.
    - Benannte Konten übernehmen `channels.slack.allowFrom`, wenn ihr eigenes `allowFrom` nicht gesetzt ist.
    - Benannte Konten übernehmen nicht `channels.slack.accounts.default.allowFrom`.

    Die Kopplung in DMs verwendet `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Kanalrichtlinie">
    `channels.slack.groupPolicy` steuert die Kanalverarbeitung:

    - `open`
    - `allowlist`
    - `disabled`

    Die Kanal-Allowlist befindet sich unter `channels.slack.channels` und sollte stabile Kanal-IDs verwenden.

    Laufzeithinweis: Wenn `channels.slack` vollständig fehlt (nur Env-Einrichtung), verwendet die Laufzeit als Fallback `groupPolicy="allowlist"` und protokolliert eine Warnung (selbst wenn `channels.defaults.groupPolicy` gesetzt ist).

    Namens-/ID-Auflösung:

    - Einträge in der Kanal-Allowlist und der DM-Allowlist werden beim Start aufgelöst, wenn der Token-Zugriff dies erlaubt
    - nicht aufgelöste Kanalnamenseinträge bleiben wie konfiguriert erhalten, werden für das Routing standardmäßig aber ignoriert
    - eingehende Autorisierung und Kanalrouting sind standardmäßig ID-first; direktes Abgleichen von Benutzernamen/Slugs erfordert `channels.slack.dangerouslyAllowNameMatching: true`

  </Tab>

  <Tab title="Erwähnungen und Kanalbenutzer">
    Kanalnachrichten sind standardmäßig durch Erwähnungen gesteuert.

    Erwähnungsquellen:

    - explizite App-Erwähnung (`<@botId>`)
    - Regex-Muster für Erwähnungen (`agents.list[].groupChat.mentionPatterns`, Fallback `messages.groupChat.mentionPatterns`)
    - implizites Antwortverhalten in Threads an den Bot

    Kontrollen pro Kanal (`channels.slack.channels.<id>`; Namen nur über Startauflösung oder `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (Allowlist)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - Schlüsselformat für `toolsBySender`: `id:`, `e164:`, `username:`, `name:` oder Platzhalter `"*"`
      (ältere Schlüssel ohne Präfix werden weiterhin nur `id:` zugeordnet)

  </Tab>
</Tabs>

## Threading, Sitzungen und Antwort-Tags

- DMs werden als `direct` geroutet; Kanäle als `channel`; MPIMs als `group`.
- Mit dem Standardwert `session.dmScope=main` werden Slack-DMs in die Hauptsitzung des Agenten zusammengeführt.
- Kanalsitzungen: `agent:<agentId>:slack:channel:<channelId>`.
- Thread-Antworten können bei Bedarf Thread-Sitzungssuffixe (`:thread:<threadTs>`) erstellen.
- `channels.slack.thread.historyScope` hat standardmäßig den Wert `thread`; `thread.inheritParent` standardmäßig `false`.
- `channels.slack.thread.initialHistoryLimit` steuert, wie viele vorhandene Thread-Nachrichten beim Start einer neuen Thread-Sitzung abgerufen werden (Standard `20`; `0` zum Deaktivieren).

Steuerungen für Antwort-Threads:

- `channels.slack.replyToMode`: `off|first|all|batched` (Standard `off`)
- `channels.slack.replyToModeByChatType`: pro `direct|group|channel`
- älterer Fallback für direkte Chats: `channels.slack.dm.replyToMode`

Manuelle Antwort-Tags werden unterstützt:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Hinweis: `replyToMode="off"` deaktiviert **sämtliches** Antwort-Threading in Slack, einschließlich expliziter `[[reply_to_*]]`-Tags. Das unterscheidet sich von Telegram, wo explizite Tags auch im Modus `"off"` weiterhin berücksichtigt werden. Der Unterschied spiegelt die Threading-Modelle der Plattformen wider: Slack-Threads blenden Nachrichten im Kanal aus, während Telegram-Antworten im Haupt-Chatverlauf sichtbar bleiben.

## Bestätigungsreaktionen

`ackReaction` sendet ein Bestätigungs-Emoji, während OpenClaw eine eingehende Nachricht verarbeitet.

Reihenfolge der Auflösung:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- Emoji-Fallback der Agent-Identität (`agents.list[].identity.emoji`, sonst "👀")

Hinweise:

- Slack erwartet Shortcodes (zum Beispiel `"eyes"`).
- Verwenden Sie `""`, um die Reaktion für das Slack-Konto oder global zu deaktivieren.

## Text-Streaming

`channels.slack.streaming` steuert das Verhalten der Live-Vorschau:

- `off`: Live-Vorschau-Streaming deaktivieren.
- `partial` (Standard): Vorschautext durch die neueste Teilausgabe ersetzen.
- `block`: Vorschauaktualisierungen in Blöcken anhängen.
- `progress`: Fortschrittsstatustext während der Generierung anzeigen und anschließend den endgültigen Text senden.

`channels.slack.nativeStreaming` steuert das native Slack-Text-Streaming, wenn `streaming` auf `partial` gesetzt ist (Standard: `true`).

- Damit natives Text-Streaming angezeigt wird, muss ein Antwort-Thread verfügbar sein. Die Thread-Auswahl folgt weiterhin `replyToMode`. Ohne einen solchen wird die normale Entwurfsvorschau verwendet.
- Medien und Nicht-Text-Nutzlasten greifen auf die normale Zustellung zurück.
- Wenn das Streaming mitten in einer Antwort fehlschlägt, greift OpenClaw für die verbleibenden Nutzlasten auf die normale Zustellung zurück.

Entwurfsvorschau statt nativem Slack-Text-Streaming verwenden:

```json5
{
  channels: {
    slack: {
      streaming: "partial",
      nativeStreaming: false,
    },
  },
}
```

Veraltete Schlüssel:

- `channels.slack.streamMode` (`replace | status_final | append`) wird automatisch zu `channels.slack.streaming` migriert.
- boolesches `channels.slack.streaming` wird automatisch zu `channels.slack.nativeStreaming` migriert.

## Fallback für Tippreaktionen

`typingReaction` fügt der eingehenden Slack-Nachricht vorübergehend eine Reaktion hinzu, während OpenClaw eine Antwort verarbeitet, und entfernt sie wieder, wenn der Durchlauf abgeschlossen ist. Das ist besonders nützlich außerhalb von Thread-Antworten, die standardmäßig den Statusindikator "is typing..." verwenden.

Reihenfolge der Auflösung:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Hinweise:

- Slack erwartet Shortcodes (zum Beispiel `"hourglass_flowing_sand"`).
- Die Reaktion ist Best-Effort; die Bereinigung wird automatisch versucht, nachdem die Antwort oder der Fehlerpfad abgeschlossen ist.

## Medien, Chunking und Zustellung

<AccordionGroup>
  <Accordion title="Eingehende Anhänge">
    Slack-Dateianhänge werden von von Slack gehosteten privaten URLs heruntergeladen (token-authentifizierter Request-Ablauf) und bei erfolgreichem Abruf und zulässigen Größenbeschränkungen in den Media Store geschrieben.

    Die Laufzeit-Obergrenze für eingehende Daten beträgt standardmäßig `20MB`, sofern sie nicht durch `channels.slack.mediaMaxMb` überschrieben wird.

  </Accordion>

  <Accordion title="Ausgehender Text und Dateien">
    - Text-Chunks verwenden `channels.slack.textChunkLimit` (Standard 4000)
    - `channels.slack.chunkMode="newline"` aktiviert zuerst absatzbasiertes Aufteilen
    - Dateisendungen verwenden Slack-Upload-APIs und können Thread-Antworten (`thread_ts`) enthalten
    - die Obergrenze für ausgehende Medien folgt `channels.slack.mediaMaxMb`, wenn konfiguriert; andernfalls verwenden Kanalsendungen MIME-Typ-Standards aus der Medienpipeline
  </Accordion>

  <Accordion title="Zustellungsziele">
    Bevorzugte explizite Ziele:

    - `user:<id>` für DMs
    - `channel:<id>` für Kanäle

    Slack-DMs werden beim Senden an Benutzerziele über die Slack-Konversations-APIs geöffnet.

  </Accordion>
</AccordionGroup>

## Befehle und Slash-Verhalten

- Der automatische Modus für native Befehle ist für Slack **deaktiviert** (`commands.native: "auto"` aktiviert keine nativen Slack-Befehle).
- Aktivieren Sie native Slack-Befehlshandler mit `channels.slack.commands.native: true` (oder global `commands.native: true`).
- Wenn native Befehle aktiviert sind, registrieren Sie passende Slash-Befehle in Slack (`/<command>`-Namen), mit einer Ausnahme:
  - Registrieren Sie `/agentstatus` für den Statusbefehl (Slack reserviert `/status`)
- Wenn native Befehle nicht aktiviert sind, können Sie einen einzelnen konfigurierten Slash-Befehl über `channels.slack.slashCommand` ausführen.
- Native Argumentmenüs passen ihre Renderstrategie jetzt an:
  - bis zu 5 Optionen: Button-Blöcke
  - 6-100 Optionen: statisches Auswahlmenü
  - mehr als 100 Optionen: externe Auswahl mit asynchroner Optionsfilterung, wenn Handler für Interaktivitätsoptionen verfügbar sind
  - wenn codierte Optionswerte die Slack-Grenzen überschreiten, greift der Ablauf auf Buttons zurück
- Für lange Optionsnutzlasten verwenden Slash-Befehls-Argumentmenüs einen Bestätigungsdialog, bevor ein ausgewählter Wert übermittelt wird.

Standardwerte für Slash-Befehle:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

Slash-Sitzungen verwenden isolierte Schlüssel:

- `agent:<agentId>:slack:slash:<userId>`

und leiten die Befehlsausführung weiterhin gegen die Sitzung der Zielkonversation weiter (`CommandTargetSessionKey`).

## Interaktive Antworten

Slack kann vom Agenten erstellte interaktive Antwortsteuerelemente rendern, aber diese Funktion ist standardmäßig deaktiviert.

Global aktivieren:

```json5
{
  channels: {
    slack: {
      capabilities: {
        interactiveReplies: true,
      },
    },
  },
}
```

Oder nur für ein Slack-Konto aktivieren:

```json5
{
  channels: {
    slack: {
      accounts: {
        ops: {
          capabilities: {
            interactiveReplies: true,
          },
        },
      },
    },
  },
}
```

Wenn aktiviert, können Agenten Slack-spezifische Antwortdirektiven ausgeben:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Diese Direktiven werden in Slack Block Kit kompiliert und leiten Klicks oder Auswahlen über den vorhandenen Slack-Interaktionsereignispfad zurück.

Hinweise:

- Dies ist eine Slack-spezifische Benutzeroberfläche. Andere Kanäle übersetzen Slack-Block-Kit-Direktiven nicht in ihre eigenen Button-Systeme.
- Die Werte interaktiver Callbacks sind von OpenClaw erzeugte intransparente Tokens, keine rohen agentenerstellten Werte.
- Wenn generierte interaktive Blöcke die Slack-Block-Kit-Grenzen überschreiten würden, greift OpenClaw auf die ursprüngliche Textantwort zurück, anstatt eine ungültige Blocks-Nutzlast zu senden.

## Exec-Freigaben in Slack

Slack kann als nativer Freigabe-Client mit interaktiven Buttons und Interaktionen fungieren, anstatt auf die Web UI oder das Terminal zurückzugreifen.

- Exec-Freigaben verwenden `channels.slack.execApprovals.*` für natives DM-/Kanal-Routing.
- Plugin-Freigaben können weiterhin über dieselbe Slack-native Button-Oberfläche aufgelöst werden, wenn die Anfrage bereits in Slack landet und der Freigabe-ID-Typ `plugin:` ist.
- Die Autorisierung der Freigebenden wird weiterhin erzwungen: Nur als Freigebende identifizierte Benutzer können Anfragen über Slack genehmigen oder ablehnen.

Dies verwendet dieselbe gemeinsame Oberfläche für Freigabe-Buttons wie andere Kanäle. Wenn `interactivity` in Ihren Slack-App-Einstellungen aktiviert ist, werden Freigabeaufforderungen direkt als Block-Kit-Buttons in der Konversation gerendert.
Wenn diese Buttons vorhanden sind, sind sie die primäre UX für Freigaben; OpenClaw
sollte einen manuellen `/approve`-Befehl nur dann einschließen, wenn das Tool-Ergebnis angibt, dass Chat-Freigaben nicht verfügbar sind oder eine manuelle Freigabe der einzige Weg ist.

Konfigurationspfad:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (optional; verwendet nach Möglichkeit `commands.ownerAllowFrom` als Fallback)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, Standard: `dm`)
- `agentFilter`, `sessionFilter`

Slack aktiviert native Exec-Freigaben automatisch, wenn `enabled` nicht gesetzt ist oder `"auto"` verwendet wird und mindestens eine freigebende Person aufgelöst wird. Setzen Sie `enabled: false`, um Slack explizit als nativen Freigabe-Client zu deaktivieren.
Setzen Sie `enabled: true`, um native Freigaben zu erzwingen, wenn Freigebende aufgelöst werden.

Standardverhalten ohne explizite Slack-Exec-Freigabekonfiguration:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Eine explizite Slack-native Konfiguration ist nur erforderlich, wenn Sie Freigebende überschreiben, Filter hinzufügen oder sich für eine Zustellung im Ursprungs-Chat entscheiden möchten:

```json5
{
  channels: {
    slack: {
      execApprovals: {
        enabled: true,
        approvers: ["U12345678"],
        target: "both",
      },
    },
  },
}
```

Gemeinsame Weiterleitung über `approvals.exec` ist getrennt. Verwenden Sie sie nur, wenn Aufforderungen für Exec-Freigaben auch an andere Chats oder explizite Ziele außerhalb des Bandes weitergeleitet werden müssen. Die gemeinsame Weiterleitung über `approvals.plugin` ist ebenfalls getrennt; Slack-native Buttons können Plugin-Freigaben weiterhin auflösen, wenn diese Anfragen bereits in Slack landen.

Dasselbe Chat-`/approve` funktioniert auch in Slack-Kanälen und DMs, die bereits Befehle unterstützen. Siehe [Exec-Freigaben](/de/tools/exec-approvals) für das vollständige Modell zur Weiterleitung von Freigaben.

## Ereignisse und Betriebsverhalten

- Nachrichtenbearbeitungen/-löschungen/Thread-Broadcasts werden in Systemereignisse abgebildet.
- Reaktionsereignisse zum Hinzufügen/Entfernen werden in Systemereignisse abgebildet.
- Beitritt/Austritt von Mitgliedern, erstellte/umbenannte Kanäle und Ereignisse zum Hinzufügen/Entfernen von Pins werden in Systemereignisse abgebildet.
- `channel_id_changed` kann Kanalkonfigurationsschlüssel migrieren, wenn `configWrites` aktiviert ist.
- Kanal-Thema/-Zweck-Metadaten werden als nicht vertrauenswürdiger Kontext behandelt und können in den Routing-Kontext eingebunden werden.
- Thread-Starter und anfängliche Thread-Verlaufs-Initialisierung werden gegebenenfalls durch konfigurierte Absender-Allowlists gefiltert.
- Block-Aktionen und modale Interaktionen geben strukturierte `Slack interaction: ...`-Systemereignisse mit umfangreichen Nutzlastfeldern aus:
  - Block-Aktionen: ausgewählte Werte, Labels, Picker-Werte und `workflow_*`-Metadaten
  - modale Ereignisse `view_submission` und `view_closed` mit gerouteten Kanalmetadaten und Formulareingaben

## Verweise auf die Konfigurationsreferenz

Primäre Referenz:

- [Konfigurationsreferenz - Slack](/de/gateway/configuration-reference#slack)

  Wichtige Slack-Felder:
  - Modus/Auth: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
  - DM-Zugriff: `dm.enabled`, `dmPolicy`, `allowFrom` (veraltet: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
  - Kompatibilitätsschalter: `dangerouslyAllowNameMatching` (Notfalloption; deaktiviert lassen, sofern nicht erforderlich)
  - Kanalzugriff: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
  - Threading/Verlauf: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
  - Zustellung: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `nativeStreaming`
  - Betrieb/Funktionen: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Keine Antworten in Kanälen">
    Prüfen Sie der Reihe nach:

    - `groupPolicy`
    - Kanal-Allowlist (`channels.slack.channels`)
    - `requireMention`
    - Allowlist `users` pro Kanal

    Nützliche Befehle:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="DM-Nachrichten werden ignoriert">
    Prüfen Sie:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (oder veraltet `channels.slack.dm.policy`)
    - Kopplungsfreigaben / Allowlist-Einträge

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket-Modus stellt keine Verbindung her">
    Validieren Sie Bot- + App-Tokens sowie die Aktivierung von Socket Mode in den Slack-App-Einstellungen.

    Wenn `openclaw channels status --probe --json` `botTokenStatus` oder
    `appTokenStatus: "configured_unavailable"` anzeigt, ist das Slack-Konto
    konfiguriert, aber die aktuelle Laufzeit konnte den durch SecretRef
    abgesicherten Wert nicht auflösen.

  </Accordion>

  <Accordion title="HTTP-Modus empfängt keine Ereignisse">
    Validieren Sie:

    - Signing Secret
    - Webhook-Pfad
    - Slack Request URLs (Events + Interactivity + Slash Commands)
    - eindeutigen `webhookPath` pro HTTP-Konto

    Wenn `signingSecretStatus: "configured_unavailable"` in Konto-Snapshots
    erscheint, ist das HTTP-Konto konfiguriert, aber die aktuelle Laufzeit
    konnte das durch SecretRef abgesicherte Signing Secret nicht auflösen.

  </Accordion>

  <Accordion title="Native/Slash-Befehle werden nicht ausgelöst">
    Prüfen Sie, ob Sie Folgendes beabsichtigt haben:

    - nativen Befehlsmodus (`channels.slack.commands.native: true`) mit passenden in Slack registrierten Slash-Befehlen
    - oder Einzel-Slash-Befehlsmodus (`channels.slack.slashCommand.enabled: true`)

    Prüfen Sie außerdem `commands.useAccessGroups` sowie Kanal-/Benutzer-Allowlists.

  </Accordion>
</AccordionGroup>

## Verwandt

- [Kopplung](/de/channels/pairing)
- [Gruppen](/de/channels/groups)
- [Sicherheit](/de/gateway/security)
- [Kanalrouting](/de/channels/channel-routing)
- [Fehlerbehebung](/de/channels/troubleshooting)
- [Konfiguration](/de/gateway/configuration)
- [Slash-Befehle](/de/tools/slash-commands)
