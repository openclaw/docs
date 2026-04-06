---
read_when:
    - Arbeiten an Discord-Kanalfunktionen
summary: Status, Funktionen und Konfiguration der Discord-Bot-Unterstützung
title: Discord
x-i18n:
    generated_at: "2026-04-06T03:08:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 54af2176a1b4fa1681e3f07494def0c652a2730165058848000e71a59e2a9d08
    source_path: channels/discord.md
    workflow: 15
---

# Discord (Bot API)

Status: bereit für DMs und Guild-Kanäle über das offizielle Discord-Gateway.

<CardGroup cols={3}>
  <Card title="Kopplung" icon="link" href="/de/channels/pairing">
    Discord-DMs verwenden standardmäßig den Kopplungsmodus.
  </Card>
  <Card title="Slash-Befehle" icon="terminal" href="/de/tools/slash-commands">
    Natives Befehlsverhalten und Befehlskatalog.
  </Card>
  <Card title="Fehlerbehebung für Kanäle" icon="wrench" href="/de/channels/troubleshooting">
    Kanalübergreifende Diagnose- und Reparaturabläufe.
  </Card>
</CardGroup>

## Schnelleinrichtung

Sie müssen eine neue Anwendung mit einem Bot erstellen, den Bot zu Ihrem Server hinzufügen und ihn mit OpenClaw koppeln. Wir empfehlen, Ihren Bot zu Ihrem eigenen privaten Server hinzuzufügen. Wenn Sie noch keinen haben, [erstellen Sie zuerst einen](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (wählen Sie **Create My Own > For me and my friends**).

<Steps>
  <Step title="Discord-Anwendung und Bot erstellen">
    Gehen Sie zum [Discord Developer Portal](https://discord.com/developers/applications) und klicken Sie auf **New Application**. Geben Sie ihr einen Namen wie „OpenClaw“.

    Klicken Sie in der Seitenleiste auf **Bot**. Setzen Sie den **Username** auf den Namen, den Ihr OpenClaw-Agent tragen soll.

  </Step>

  <Step title="Privilegierte Intents aktivieren">
    Bleiben Sie auf der Seite **Bot**, scrollen Sie nach unten zu **Privileged Gateway Intents** und aktivieren Sie:

    - **Message Content Intent** (erforderlich)
    - **Server Members Intent** (empfohlen; erforderlich für Rollen-Allowlisten und Abgleich von Namen zu IDs)
    - **Presence Intent** (optional; nur für Presence-Updates erforderlich)

  </Step>

  <Step title="Bot-Token kopieren">
    Scrollen Sie auf der Seite **Bot** wieder nach oben und klicken Sie auf **Reset Token**.

    <Note>
    Trotz des Namens wird dadurch Ihr erstes Token erzeugt — es wird nichts „zurückgesetzt“.
    </Note>

    Kopieren Sie das Token und speichern Sie es an einem sicheren Ort. Das ist Ihr **Bot Token**, und Sie werden es gleich benötigen.

  </Step>

  <Step title="Einladungs-URL erzeugen und den Bot zu Ihrem Server hinzufügen">
    Klicken Sie in der Seitenleiste auf **OAuth2**. Sie erzeugen eine Einladungs-URL mit den richtigen Berechtigungen, um den Bot zu Ihrem Server hinzuzufügen.

    Scrollen Sie nach unten zu **OAuth2 URL Generator** und aktivieren Sie:

    - `bot`
    - `applications.commands`

    Darunter erscheint ein Abschnitt **Bot Permissions**. Aktivieren Sie:

    - View Channels
    - Send Messages
    - Read Message History
    - Embed Links
    - Attach Files
    - Add Reactions (optional)

    Kopieren Sie die unten erzeugte URL, fügen Sie sie in Ihren Browser ein, wählen Sie Ihren Server aus und klicken Sie auf **Continue**, um die Verbindung herzustellen. Sie sollten Ihren Bot nun auf dem Discord-Server sehen.

  </Step>

  <Step title="Developer Mode aktivieren und Ihre IDs erfassen">
    Zurück in der Discord-App müssen Sie den Developer Mode aktivieren, damit Sie interne IDs kopieren können.

    1. Klicken Sie auf **User Settings** (Zahnradsymbol neben Ihrem Avatar) → **Advanced** → aktivieren Sie **Developer Mode**
    2. Klicken Sie in der Seitenleiste mit der rechten Maustaste auf Ihr **Server-Symbol** → **Copy Server ID**
    3. Klicken Sie mit der rechten Maustaste auf Ihren **eigenen Avatar** → **Copy User ID**

    Speichern Sie Ihre **Server ID** und **User ID** zusammen mit Ihrem Bot Token — im nächsten Schritt senden Sie alle drei an OpenClaw.

  </Step>

  <Step title="DMs von Servermitgliedern erlauben">
    Damit die Kopplung funktioniert, muss Discord Ihrem Bot erlauben, Ihnen eine DM zu senden. Klicken Sie mit der rechten Maustaste auf Ihr **Server-Symbol** → **Privacy Settings** → aktivieren Sie **Direct Messages**.

    Dadurch können Servermitglieder (einschließlich Bots) Ihnen DMs senden. Lassen Sie dies aktiviert, wenn Sie Discord-DMs mit OpenClaw verwenden möchten. Wenn Sie nur Guild-Kanäle verwenden möchten, können Sie DMs nach der Kopplung deaktivieren.

  </Step>

  <Step title="Bot-Token sicher setzen (nicht im Chat senden)">
    Ihr Discord-Bot-Token ist ein Geheimnis (wie ein Passwort). Setzen Sie es auf dem Rechner, auf dem OpenClaw läuft, bevor Sie Ihrem Agenten Nachrichten senden.

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

    Wenn OpenClaw bereits als Hintergrunddienst läuft, starten Sie es über die OpenClaw Mac app oder durch Stoppen und erneutes Starten des Prozesses `openclaw gateway run` neu.

  </Step>

  <Step title="OpenClaw konfigurieren und koppeln">

    <Tabs>
      <Tab title="Fragen Sie Ihren Agenten">
        Chatten Sie mit Ihrem OpenClaw-Agenten auf einem bereits vorhandenen Kanal (z. B. Telegram) und teilen Sie ihm dies mit. Wenn Discord Ihr erster Kanal ist, verwenden Sie stattdessen den Tab CLI / config.

        > „Ich habe mein Discord-Bot-Token bereits in der Konfiguration gesetzt. Bitte schließe die Discord-Einrichtung mit der User ID `<user_id>` und der Server ID `<server_id>` ab.“
      </Tab>
      <Tab title="CLI / config">
        Wenn Sie eine dateibasierte Konfiguration bevorzugen, setzen Sie Folgendes:

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: {
        source: "env",
        provider: "default",
        id: "DISCORD_BOT_TOKEN",
      },
    },
  },
}
```

        Env-Fallback für das Standardkonto:

```bash
DISCORD_BOT_TOKEN=...
```

        Klartextwerte für `token` werden unterstützt. SecretRef-Werte werden ebenfalls für `channels.discord.token` über env/file/exec-Provider unterstützt. Siehe [Secrets Management](/de/gateway/secrets).

      </Tab>
    </Tabs>

  </Step>

  <Step title="Erste DM-Kopplung genehmigen">
    Warten Sie, bis das Gateway läuft, und senden Sie dann Ihrem Bot eine DM in Discord. Er antwortet mit einem Kopplungscode.

    <Tabs>
      <Tab title="Fragen Sie Ihren Agenten">
        Senden Sie den Kopplungscode auf Ihrem bestehenden Kanal an Ihren Agenten:

        > „Genehmige diesen Discord-Kopplungscode: `<CODE>`“
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    Kopplungscodes laufen nach 1 Stunde ab.

    Sie sollten nun per DM mit Ihrem Agenten in Discord chatten können.

  </Step>
</Steps>

<Note>
Die Token-Auflösung ist kontobewusst. Tokenwerte in der Konfiguration haben Vorrang vor dem Env-Fallback. `DISCORD_BOT_TOKEN` wird nur für das Standardkonto verwendet.
Für erweiterte ausgehende Aufrufe (message-Tool/Kanalaktionen) wird ein explizites aufrufbezogenes `token` für diesen Aufruf verwendet. Dies gilt für Sende- sowie Lese-/Probe-artige Aktionen (zum Beispiel read/search/fetch/thread/pins/permissions). Kontorichtlinie- und Wiederholungseinstellungen stammen weiterhin aus dem ausgewählten Konto im aktiven Runtime-Snapshot.
</Note>

## Empfohlen: Einen Guild-Workspace einrichten

Sobald DMs funktionieren, können Sie Ihren Discord-Server als vollständigen Workspace einrichten, in dem jeder Kanal seine eigene Agentensitzung mit eigenem Kontext erhält. Das wird für private Server empfohlen, auf denen nur Sie und Ihr Bot sind.

<Steps>
  <Step title="Ihren Server zur Guild-Allowlist hinzufügen">
    Dadurch kann Ihr Agent in jedem Kanal auf Ihrem Server antworten, nicht nur in DMs.

    <Tabs>
      <Tab title="Fragen Sie Ihren Agenten">
        > „Füge meine Discord Server ID `<server_id>` zur Guild-Allowlist hinzu“
      </Tab>
      <Tab title="Konfiguration">

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        YOUR_SERVER_ID: {
          requireMention: true,
          users: ["YOUR_USER_ID"],
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="Antworten ohne @mention erlauben">
    Standardmäßig antwortet Ihr Agent in Guild-Kanälen nur, wenn er per @ erwähnt wird. Für einen privaten Server möchten Sie wahrscheinlich, dass er auf jede Nachricht antwortet.

    <Tabs>
      <Tab title="Fragen Sie Ihren Agenten">
        > „Erlaube meinem Agenten, auf diesem Server zu antworten, ohne per @ erwähnt werden zu müssen“
      </Tab>
      <Tab title="Konfiguration">
        Setzen Sie `requireMention: false` in Ihrer Guild-Konfiguration:

```json5
{
  channels: {
    discord: {
      guilds: {
        YOUR_SERVER_ID: {
          requireMention: false,
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="Speicher in Guild-Kanälen planen">
    Standardmäßig wird der Langzeitspeicher (`MEMORY.md`) nur in DM-Sitzungen geladen. Guild-Kanäle laden `MEMORY.md` nicht automatisch.

    <Tabs>
      <Tab title="Fragen Sie Ihren Agenten">
        > „Wenn ich in Discord-Kanälen Fragen stelle, verwende memory_search oder memory_get, wenn du langfristigen Kontext aus MEMORY.md brauchst.“
      </Tab>
      <Tab title="Manuell">
        Wenn Sie gemeinsamen Kontext in jedem Kanal benötigen, legen Sie die stabilen Anweisungen in `AGENTS.md` oder `USER.md` ab (sie werden in jede Sitzung injiziert). Behalten Sie Langzeitnotizen in `MEMORY.md` und greifen Sie bei Bedarf mit Speicher-Tools darauf zu.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Erstellen Sie nun einige Kanäle auf Ihrem Discord-Server und beginnen Sie mit dem Chatten. Ihr Agent kann den Kanalnamen sehen, und jeder Kanal erhält seine eigene isolierte Sitzung — so können Sie `#coding`, `#home`, `#research` oder alles einrichten, was zu Ihrem Workflow passt.

## Runtime-Modell

- Das Gateway besitzt die Discord-Verbindung.
- Antwort-Routing ist deterministisch: Eingehende Discord-Nachrichten werden an Discord zurückbeantwortet.
- Standardmäßig (`session.dmScope=main`) teilen direkte Chats die Hauptsitzung des Agenten (`agent:main:main`).
- Guild-Kanäle sind isolierte Sitzungsschlüssel (`agent:<agentId>:discord:channel:<channelId>`).
- Gruppen-DMs werden standardmäßig ignoriert (`channels.discord.dm.groupEnabled=false`).
- Native Slash-Befehle laufen in isolierten Befehlssitzungen (`agent:<agentId>:discord:slash:<userId>`), während weiterhin `CommandTargetSessionKey` an die geroutete Konversationssitzung übergeben wird.

## Forum-Kanäle

Discord-Forum- und Medienkanäle akzeptieren nur Thread-Beiträge. OpenClaw unterstützt zwei Möglichkeiten, sie zu erstellen:

- Senden Sie eine Nachricht an das Forum-Elternelement (`channel:<forumId>`), um automatisch einen Thread zu erstellen. Der Thread-Titel verwendet die erste nicht leere Zeile Ihrer Nachricht.
- Verwenden Sie `openclaw message thread create`, um direkt einen Thread zu erstellen. Übergeben Sie für Forum-Kanäle kein `--message-id`.

Beispiel: An das Forum-Elternelement senden, um einen Thread zu erstellen

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Beispiel: Einen Forum-Thread explizit erstellen

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Forum-Elternelemente akzeptieren keine Discord-Komponenten. Wenn Sie Komponenten benötigen, senden Sie an den Thread selbst (`channel:<threadId>`).

## Interaktive Komponenten

OpenClaw unterstützt Discord-Komponenten-v2-Container für Agentennachrichten. Verwenden Sie das message-Tool mit einer `components`-Payload. Interaktionsergebnisse werden als normale eingehende Nachrichten an den Agenten zurückgeleitet und folgen den bestehenden Discord-Einstellungen für `replyToMode`.

Unterstützte Blöcke:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Aktionszeilen erlauben bis zu 5 Buttons oder ein einzelnes Auswahlmenü
- Auswahltypen: `string`, `user`, `role`, `mentionable`, `channel`

Standardmäßig sind Komponenten einmalig nutzbar. Setzen Sie `components.reusable=true`, um Buttons, Auswahlen und Formulare mehrfach verwendbar zu machen, bis sie ablaufen.

Um einzuschränken, wer auf einen Button klicken kann, setzen Sie `allowedUsers` auf diesem Button (Discord-Benutzer-IDs, Tags oder `*`). Wenn dies konfiguriert ist, erhalten nicht passende Benutzer eine ephemere Ablehnung.

Die Slash-Befehle `/model` und `/models` öffnen eine interaktive Modellauswahl mit Dropdowns für Provider und Modell sowie einem Schritt zum Absenden. Die Antwort der Auswahl ist ephemer, und nur der aufrufende Benutzer kann sie verwenden.

Dateianhänge:

- `file`-Blöcke müssen auf eine Attachment-Referenz zeigen (`attachment://<filename>`)
- Stellen Sie den Anhang über `media`/`path`/`filePath` bereit (einzelne Datei); verwenden Sie `media-gallery` für mehrere Dateien
- Verwenden Sie `filename`, um den Upload-Namen zu überschreiben, wenn er mit der Attachment-Referenz übereinstimmen soll

Modale Formulare:

- Fügen Sie `components.modal` mit bis zu 5 Feldern hinzu
- Feldtypen: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw fügt automatisch einen Auslöser-Button hinzu

Beispiel:

```json5
{
  channel: "discord",
  action: "send",
  to: "channel:123456789012345678",
  message: "Optional fallback text",
  components: {
    reusable: true,
    text: "Choose a path",
    blocks: [
      {
        type: "actions",
        buttons: [
          {
            label: "Approve",
            style: "success",
            allowedUsers: ["123456789012345678"],
          },
          { label: "Decline", style: "danger" },
        ],
      },
      {
        type: "actions",
        select: {
          type: "string",
          placeholder: "Pick an option",
          options: [
            { label: "Option A", value: "a" },
            { label: "Option B", value: "b" },
          ],
        },
      },
    ],
    modal: {
      title: "Details",
      triggerLabel: "Open form",
      fields: [
        { type: "text", label: "Requester" },
        {
          type: "select",
          label: "Priority",
          options: [
            { label: "Low", value: "low" },
            { label: "High", value: "high" },
          ],
        },
      ],
    },
  },
}
```

## Zugriffskontrolle und Routing

<Tabs>
  <Tab title="DM-Richtlinie">
    `channels.discord.dmPolicy` steuert den DM-Zugriff (veraltet: `channels.discord.dm.policy`):

    - `pairing` (Standard)
    - `allowlist`
    - `open` (erfordert, dass `channels.discord.allowFrom` `"*"` enthält; veraltet: `channels.discord.dm.allowFrom`)
    - `disabled`

    Wenn die DM-Richtlinie nicht offen ist, werden unbekannte Benutzer blockiert (oder im Modus `pairing` zur Kopplung aufgefordert).

    Vorrang bei mehreren Konten:

    - `channels.discord.accounts.default.allowFrom` gilt nur für das `default`-Konto.
    - Benannte Konten erben `channels.discord.allowFrom`, wenn ihr eigenes `allowFrom` nicht gesetzt ist.
    - Benannte Konten erben nicht `channels.discord.accounts.default.allowFrom`.

    DM-Zielformat für die Zustellung:

    - `user:<id>`
    - `<@id>`-Erwähnung

    Reine numerische IDs sind mehrdeutig und werden abgelehnt, sofern kein expliziter Benutzer-/Kanal-Zieltyp angegeben ist.

  </Tab>

  <Tab title="Guild-Richtlinie">
    Die Behandlung von Guilds wird durch `channels.discord.groupPolicy` gesteuert:

    - `open`
    - `allowlist`
    - `disabled`

    Sichere Baseline, wenn `channels.discord` vorhanden ist, ist `allowlist`.

    Verhalten von `allowlist`:

    - Die Guild muss `channels.discord.guilds` entsprechen (`id` bevorzugt, Slug akzeptiert)
    - optionale Sender-Allowlisten: `users` (stabile IDs empfohlen) und `roles` (nur Rollen-IDs); wenn eines von beiden konfiguriert ist, sind Sender erlaubt, wenn sie `users` ODER `roles` entsprechen
    - direktes Matching nach Name/Tag ist standardmäßig deaktiviert; aktivieren Sie `channels.discord.dangerouslyAllowNameMatching: true` nur als Break-Glass-Kompatibilitätsmodus
    - Namen/Tags werden für `users` unterstützt, aber IDs sind sicherer; `openclaw security audit` warnt, wenn Name-/Tag-Einträge verwendet werden
    - wenn für eine Guild `channels` konfiguriert ist, werden nicht aufgeführte Kanäle verweigert
    - wenn eine Guild keinen `channels`-Block hat, sind alle Kanäle in dieser allowlisteten Guild erlaubt

    Beispiel:

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "123456789012345678": {
          requireMention: true,
          ignoreOtherMentions: true,
          users: ["987654321098765432"],
          roles: ["123456789012345678"],
          channels: {
            general: { allow: true },
            help: { allow: true, requireMention: true },
          },
        },
      },
    },
  },
}
```

    Wenn Sie nur `DISCORD_BOT_TOKEN` setzen und keinen `channels.discord`-Block erstellen, ist das Runtime-Fallback `groupPolicy="allowlist"` (mit einer Warnung in den Logs), auch wenn `channels.defaults.groupPolicy` auf `open` steht.

  </Tab>

  <Tab title="Erwähnungen und Gruppen-DMs">
    Guild-Nachrichten sind standardmäßig an Erwähnungen gebunden.

    Die Erkennung von Erwähnungen umfasst:

    - explizite Bot-Erwähnung
    - konfigurierte Erwähnungsmuster (`agents.list[].groupChat.mentionPatterns`, Fallback `messages.groupChat.mentionPatterns`)
    - implizites Antwort-an-Bot-Verhalten in unterstützten Fällen

    `requireMention` wird pro Guild/Kanal konfiguriert (`channels.discord.guilds...`).
    `ignoreOtherMentions` verwirft optional Nachrichten, die einen anderen Benutzer/eine andere Rolle erwähnen, aber nicht den Bot (ausgenommen @everyone/@here).

    Gruppen-DMs:

    - Standard: ignoriert (`dm.groupEnabled=false`)
    - optionale Allowlist über `dm.groupChannels` (Kanal-IDs oder Slugs)

  </Tab>
</Tabs>

### Rollenbasiertes Agent-Routing

Verwenden Sie `bindings[].match.roles`, um Discord-Guild-Mitglieder anhand der Rollen-ID an unterschiedliche Agenten zu routen. Rollenbasierte Bindings akzeptieren nur Rollen-IDs und werden nach Peer- oder Parent-Peer-Bindings und vor reinen Guild-Bindings ausgewertet. Wenn ein Binding zusätzlich andere Match-Felder setzt (zum Beispiel `peer` + `guildId` + `roles`), müssen alle konfigurierten Felder übereinstimmen.

```json5
{
  bindings: [
    {
      agentId: "opus",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
        roles: ["111111111111111111"],
      },
    },
    {
      agentId: "sonnet",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
      },
    },
  ],
}
```

## Einrichtung im Developer Portal

<AccordionGroup>
  <Accordion title="App und Bot erstellen">

    1. Discord Developer Portal -> **Applications** -> **New Application**
    2. **Bot** -> **Add Bot**
    3. Bot-Token kopieren

  </Accordion>

  <Accordion title="Privilegierte Intents">
    Aktivieren Sie unter **Bot -> Privileged Gateway Intents**:

    - Message Content Intent
    - Server Members Intent (empfohlen)

    Presence Intent ist optional und nur erforderlich, wenn Sie Presence-Updates empfangen möchten. Das Setzen der Bot-Presence (`setPresence`) erfordert nicht, dass Presence-Updates für Mitglieder aktiviert sind.

  </Accordion>

  <Accordion title="OAuth-Scopes und Basisberechtigungen">
    OAuth-URL-Generator:

    - Scopes: `bot`, `applications.commands`

    Typische Basisberechtigungen:

    - View Channels
    - Send Messages
    - Read Message History
    - Embed Links
    - Attach Files
    - Add Reactions (optional)

    Vermeiden Sie `Administrator`, sofern nicht ausdrücklich erforderlich.

  </Accordion>

  <Accordion title="IDs kopieren">
    Aktivieren Sie den Discord Developer Mode und kopieren Sie dann:

    - Server-ID
    - Kanal-ID
    - Benutzer-ID

    Bevorzugen Sie numerische IDs in der OpenClaw-Konfiguration für zuverlässige Audits und Probes.

  </Accordion>
</AccordionGroup>

## Native Befehle und Befehlsauthentifizierung

- `commands.native` hat standardmäßig den Wert `"auto"` und ist für Discord aktiviert.
- Kanalbezogene Überschreibung: `channels.discord.commands.native`.
- `commands.native=false` löscht explizit zuvor registrierte native Discord-Befehle.
- Die Authentifizierung nativer Befehle verwendet dieselben Discord-Allowlisten/-Richtlinien wie die normale Nachrichtenverarbeitung.
- Befehle können in der Discord-Benutzeroberfläche weiterhin für Benutzer sichtbar sein, die nicht autorisiert sind; die Ausführung erzwingt dennoch die OpenClaw-Authentifizierung und gibt „nicht autorisiert“ zurück.

Siehe [Slash commands](/de/tools/slash-commands) für Befehlskatalog und Verhalten.

Standardmäßige Einstellungen für Slash-Befehle:

- `ephemeral: true`

## Funktionsdetails

<AccordionGroup>
  <Accordion title="Antwort-Tags und native Antworten">
    Discord unterstützt Antwort-Tags in der Agent-Ausgabe:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Gesteuert durch `channels.discord.replyToMode`:

    - `off` (Standard)
    - `first`
    - `all`
    - `batched`

    Hinweis: `off` deaktiviert implizites Antwort-Threading. Explizite Tags `[[reply_to_*]]` werden weiterhin beachtet.
    `first` hängt die implizite native Antwortreferenz immer an die erste ausgehende Discord-Nachricht des Turns an.
    `batched` hängt Discords implizite native Antwortreferenz nur an, wenn der
    eingehende Turn ein entprellter Stapel mehrerer Nachrichten war. Das ist nützlich,
    wenn Sie native Antworten hauptsächlich für mehrdeutige, stoßweise Chats möchten,
    nicht für jeden einzelnen Nachrichtenturn.

    Nachrichten-IDs werden im Kontext/Verlauf sichtbar gemacht, sodass Agenten bestimmte Nachrichten adressieren können.

  </Accordion>

  <Accordion title="Live-Stream-Vorschau">
    OpenClaw kann Entwurfsantworten streamen, indem eine temporäre Nachricht gesendet und während des Eintreffens von Text bearbeitet wird.

    - `channels.discord.streaming` steuert das Vorschau-Streaming (`off` | `partial` | `block` | `progress`, Standard: `off`).
    - Der Standard bleibt `off`, weil Discord-Vorschau-Bearbeitungen schnell an Rate Limits stoßen können, besonders wenn mehrere Bots oder Gateways dasselbe Konto oder denselben Guild-Traffic nutzen.
    - `progress` wird aus Gründen der kanalübergreifenden Konsistenz akzeptiert und in Discord auf `partial` abgebildet.
    - `channels.discord.streamMode` ist ein veralteter Alias und wird automatisch migriert.
    - `partial` bearbeitet eine einzelne Vorschaunachricht, während Tokens eintreffen.
    - `block` sendet Entwurfsblöcke in Chunk-Größe (verwenden Sie `draftChunk`, um Größe und Umbruchpunkte anzupassen).

    Beispiel:

```json5
{
  channels: {
    discord: {
      streaming: "partial",
    },
  },
}
```

    Standardwerte für Chunking im Modus `block` (begrenzt durch `channels.discord.textChunkLimit`):

```json5
{
  channels: {
    discord: {
      streaming: "block",
      draftChunk: {
        minChars: 200,
        maxChars: 800,
        breakPreference: "paragraph",
      },
    },
  },
}
```

    Vorschau-Streaming ist nur für Text; Medienantworten fallen auf normale Zustellung zurück.

    Hinweis: Vorschau-Streaming ist vom Block-Streaming getrennt. Wenn Block-Streaming für Discord explizit
    aktiviert ist, überspringt OpenClaw den Vorschau-Stream, um doppeltes Streaming zu vermeiden.

  </Accordion>

  <Accordion title="Verlauf, Kontext und Thread-Verhalten">
    Guild-Verlaufskontext:

    - `channels.discord.historyLimit` Standard `20`
    - Fallback: `messages.groupChat.historyLimit`
    - `0` deaktiviert

    Steuerung des DM-Verlaufs:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Thread-Verhalten:

    - Discord-Threads werden als Kanalsitzungen geroutet
    - übergeordnete Thread-Metadaten können für Parent-Session-Verknüpfungen genutzt werden
    - Thread-Konfiguration erbt die Konfiguration des übergeordneten Kanals, sofern kein threadspezifischer Eintrag existiert

    Kanalthemen werden als **nicht vertrauenswürdiger** Kontext injiziert (nicht als System-Prompt).
    Antwort- und Zitierte-Nachricht-Kontext bleibt derzeit wie empfangen erhalten.
    Discord-Allowlisten steuern in erster Linie, wer den Agenten auslösen kann, nicht eine vollständige Redaktionsgrenze für ergänzenden Kontext.

  </Accordion>

  <Accordion title="Thread-gebundene Sitzungen für Subagents">
    Discord kann einen Thread an ein Sitzungsziel binden, sodass Folgebotschaften in diesem Thread weiterhin an dieselbe Sitzung geleitet werden (einschließlich Subagent-Sitzungen).

    Befehle:

    - `/focus <target>` bindet aktuellen/neuen Thread an ein Subagent-/Sitzungsziel
    - `/unfocus` entfernt die aktuelle Thread-Bindung
    - `/agents` zeigt aktive Läufe und den Bindungsstatus
    - `/session idle <duration|off>` prüft/aktualisiert das automatische Lösen der Fokusbindung bei Inaktivität
    - `/session max-age <duration|off>` prüft/aktualisiert das feste maximale Alter für fokussierte Bindungen

    Konfiguration:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        idleHours: 24,
        maxAgeHours: 0,
        spawnSubagentSessions: false, // Opt-in
      },
    },
  },
}
```

    Hinweise:

    - `session.threadBindings.*` setzt globale Standardwerte.
    - `channels.discord.threadBindings.*` überschreibt das Discord-Verhalten.
    - `spawnSubagentSessions` muss auf true gesetzt sein, um Threads für `sessions_spawn({ thread: true })` automatisch zu erstellen/zu binden.
    - `spawnAcpSessions` muss auf true gesetzt sein, um Threads für ACP (`/acp spawn ... --thread ...` oder `sessions_spawn({ runtime: "acp", thread: true })`) automatisch zu erstellen/zu binden.
    - Wenn Thread-Bindings für ein Konto deaktiviert sind, sind `/focus` und verwandte Thread-Binding-Operationen nicht verfügbar.

    Siehe [Sub-agents](/de/tools/subagents), [ACP Agents](/de/tools/acp-agents) und [Configuration Reference](/de/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Persistente ACP-Kanal-Bindungen">
    Für stabile „always-on“-ACP-Workspaces konfigurieren Sie ACP-Bindungen auf oberster Ebene mit Typisierung, die auf Discord-Konversationen zielen.

    Konfigurationspfad:

    - `bindings[]` mit `type: "acp"` und `match.channel: "discord"`

    Beispiel:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": {
              requireMention: false,
            },
          },
        },
      },
    },
  },
}
```

    Hinweise:

    - `/acp spawn codex --bind here` bindet den aktuellen Discord-Kanal oder Thread direkt und hält zukünftige Nachrichten weiterhin an dieselbe ACP-Sitzung geroutet.
    - Das kann weiterhin bedeuten: „eine frische Codex-ACP-Sitzung starten“, aber es erstellt nicht von selbst einen neuen Discord-Thread. Der bestehende Kanal bleibt die Chat-Oberfläche.
    - Codex kann weiterhin in seinem eigenen `cwd` oder Backend-Workspace auf der Festplatte laufen. Dieser Workspace ist Runtime-Zustand, kein Discord-Thread.
    - Thread-Nachrichten können die ACP-Bindung des übergeordneten Kanals erben.
    - In einem gebundenen Kanal oder Thread setzen `/new` und `/reset` dieselbe ACP-Sitzung direkt zurück.
    - Temporäre Thread-Bindings funktionieren weiterhin und können die Zielauflösung überschreiben, solange sie aktiv sind.
    - `spawnAcpSessions` ist nur erforderlich, wenn OpenClaw einen Child-Thread über `--thread auto|here` erstellen/binden muss. Es ist nicht erforderlich für `/acp spawn ... --bind here` im aktuellen Kanal.

    Siehe [ACP Agents](/de/tools/acp-agents) für Details zum Binding-Verhalten.

  </Accordion>

  <Accordion title="Reaktionsbenachrichtigungen">
    Reaktionsbenachrichtigungsmodus pro Guild:

    - `off`
    - `own` (Standard)
    - `all`
    - `allowlist` (verwendet `guilds.<id>.users`)

    Reaktionsereignisse werden in Systemereignisse umgewandelt und an die geroutete Discord-Sitzung angehängt.

  </Accordion>

  <Accordion title="Bestätigungsreaktionen">
    `ackReaction` sendet ein Bestätigungs-Emoji, während OpenClaw eine eingehende Nachricht verarbeitet.

    Auflösungsreihenfolge:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - Fallback auf Agentenidentitäts-Emoji (`agents.list[].identity.emoji`, sonst "👀")

    Hinweise:

    - Discord akzeptiert Unicode-Emoji oder benutzerdefinierte Emoji-Namen.
    - Verwenden Sie `""`, um die Reaktion für einen Kanal oder ein Konto zu deaktivieren.

  </Accordion>

  <Accordion title="Konfigurationsschreibvorgänge">
    Durch den Kanal initiierte Konfigurationsschreibvorgänge sind standardmäßig aktiviert.

    Dies betrifft `/config set|unset`-Abläufe (wenn Befehlsfunktionen aktiviert sind).

    Deaktivieren:

```json5
{
  channels: {
    discord: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="Gateway-Proxy">
    Leiten Sie Discord-Gateway-WebSocket-Traffic und Startup-REST-Lookups (Anwendungs-ID + Allowlist-Auflösung) über einen HTTP(S)-Proxy mit `channels.discord.proxy`.

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    Überschreibung pro Konto:

```json5
{
  channels: {
    discord: {
      accounts: {
        primary: {
          proxy: "http://proxy.example:8080",
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="PluralKit-Unterstützung">
    Aktivieren Sie die PluralKit-Auflösung, um proxied messages der Identität von Systemmitgliedern zuzuordnen:

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // optional; erforderlich für private Systeme
      },
    },
  },
}
```

    Hinweise:

    - Allowlisten können `pk:<memberId>` verwenden
    - Anzeigenamen von Mitgliedern werden nur dann nach Name/Slug abgeglichen, wenn `channels.discord.dangerouslyAllowNameMatching: true` gesetzt ist
    - Lookups verwenden die ursprüngliche Nachrichten-ID und sind zeitfensterbegrenzt
    - wenn der Lookup fehlschlägt, werden proxied messages als Bot-Nachrichten behandelt und verworfen, sofern nicht `allowBots=true` gesetzt ist

  </Accordion>

  <Accordion title="Presence-Konfiguration">
    Presence-Updates werden angewendet, wenn Sie ein Status- oder Aktivitätsfeld setzen oder Auto Presence aktivieren.

    Beispiel nur für Status:

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    Aktivitätsbeispiel (Custom Status ist der Standard-Aktivitätstyp):

```json5
{
  channels: {
    discord: {
      activity: "Focus time",
      activityType: 4,
    },
  },
}
```

    Streaming-Beispiel:

```json5
{
  channels: {
    discord: {
      activity: "Live coding",
      activityType: 1,
      activityUrl: "https://twitch.tv/openclaw",
    },
  },
}
```

    Zuordnung der Aktivitätstypen:

    - 0: Playing
    - 1: Streaming (erfordert `activityUrl`)
    - 2: Listening
    - 3: Watching
    - 4: Custom (verwendet den Aktivitätstext als Statuszustand; Emoji ist optional)
    - 5: Competing

    Beispiel für Auto Presence (Runtime-Gesundheitssignal):

```json5
{
  channels: {
    discord: {
      autoPresence: {
        enabled: true,
        intervalMs: 30000,
        minUpdateIntervalMs: 15000,
        exhaustedText: "token exhausted",
      },
    },
  },
}
```

    Auto Presence ordnet die Runtime-Verfügbarkeit dem Discord-Status zu: healthy => online, degraded oder unknown => idle, exhausted oder unavailable => dnd. Optionale Textüberschreibungen:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (unterstützt den Platzhalter `{reason}`)

  </Accordion>

  <Accordion title="Genehmigungen in Discord">
    Discord unterstützt button-basierte Genehmigungsverarbeitung in DMs und kann Genehmigungsaufforderungen optional im ursprünglichen Kanal veröffentlichen.

    Konfigurationspfad:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (optional; verwendet nach Möglichkeit `commands.ownerAllowFrom` als Fallback)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, Standard: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord aktiviert native Exec-Genehmigungen automatisch, wenn `enabled` nicht gesetzt oder `"auto"` ist und mindestens ein Genehmigender aufgelöst werden kann, entweder aus `execApprovals.approvers` oder aus `commands.ownerAllowFrom`. Discord leitet Exec-Genehmigende nicht aus kanalbezogenem `allowFrom`, veraltetem `dm.allowFrom` oder Direct-Message-`defaultTo` ab. Setzen Sie `enabled: false`, um Discord explizit als nativen Genehmigungs-Client zu deaktivieren.

    Wenn `target` den Wert `channel` oder `both` hat, ist die Genehmigungsaufforderung im Kanal sichtbar. Nur aufgelöste Genehmigende können die Buttons verwenden; andere Benutzer erhalten eine ephemere Ablehnung. Genehmigungsaufforderungen enthalten den Befehlstext, daher sollten Sie die Zustellung im Kanal nur in vertrauenswürdigen Kanälen aktivieren. Wenn die Kanal-ID nicht aus dem Sitzungsschlüssel abgeleitet werden kann, fällt OpenClaw auf DM-Zustellung zurück.

    Discord rendert auch die gemeinsamen Genehmigungs-Buttons, die von anderen Chat-Kanälen verwendet werden. Der native Discord-Adapter ergänzt hauptsächlich DM-Routing für Genehmigende und Kanal-Fanout.
    Wenn diese Buttons vorhanden sind, sind sie die primäre UX für Genehmigungen; OpenClaw
    sollte einen manuellen `/approve`-Befehl nur dann einfügen, wenn das Tool-Ergebnis angibt,
    dass Chat-Genehmigungen nicht verfügbar sind oder die manuelle Genehmigung der einzige Weg ist.

    Die Gateway-Authentifizierung für diesen Handler verwendet denselben gemeinsamen Vertrag zur Auflösung von Anmeldedaten wie andere Gateway-Clients:

    - env-first local auth (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` dann `gateway.auth.*`)
    - im lokalen Modus kann `gateway.remote.*` nur dann als Fallback verwendet werden, wenn `gateway.auth.*` nicht gesetzt ist; konfigurierte, aber nicht aufgelöste lokale SecretRefs schlagen fail-closed fehl
    - Unterstützung des Remote-Modus über `gateway.remote.*`, wenn anwendbar
    - URL-Überschreibungen sind override-sicher: CLI-Überschreibungen verwenden keine impliziten Anmeldedaten erneut, und Env-Überschreibungen verwenden nur Env-Anmeldedaten

    Verhalten bei der Genehmigungsauflösung:

    - IDs mit dem Präfix `plugin:` werden über `plugin.approval.resolve` aufgelöst.
    - Andere IDs werden über `exec.approval.resolve` aufgelöst.
    - Discord führt hier keinen zusätzlichen Exec-zu-Plugin-Fallback-Schritt aus; das ID-Präfix
      entscheidet, welche Gateway-Methode aufgerufen wird.

    Exec-Genehmigungen laufen standardmäßig nach 30 Minuten ab. Wenn Genehmigungen mit
    unbekannten Genehmigungs-IDs fehlschlagen, überprüfen Sie die Auflösung der Genehmigenden,
    die Aktivierung der Funktion und dass die zugestellte Genehmigungs-ID-Art zur ausstehenden Anfrage passt.

    Zugehörige Dokumentation: [Exec approvals](/de/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## Tools und Action-Gates

Discord-Nachrichtenaktionen umfassen Messaging, Kanalverwaltung, Moderation, Presence und Metadatenaktionen.

Zentrale Beispiele:

- Messaging: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- Reaktionen: `react`, `reactions`, `emojiList`
- Moderation: `timeout`, `kick`, `ban`
- Presence: `setPresence`

Action-Gates befinden sich unter `channels.discord.actions.*`.

Standardverhalten der Gates:

| Action-Gruppe                                                                                                                                                            | Standard |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | aktiviert |
| roles                                                                                                                                                                    | deaktiviert |
| moderation                                                                                                                                                               | deaktiviert |
| presence                                                                                                                                                                 | deaktiviert |

## Components v2 UI

OpenClaw verwendet Discord components v2 für Exec-Genehmigungen und kontextübergreifende Markierungen. Discord-Nachrichtenaktionen können auch `components` für benutzerdefinierte UI akzeptieren (fortgeschritten; erfordert das Erstellen einer Komponenten-Payload über das Discord-Tool), während veraltete `embeds` weiterhin verfügbar, aber nicht empfohlen sind.

- `channels.discord.ui.components.accentColor` setzt die Akzentfarbe, die für Discord-Komponentencontainer verwendet wird (Hex).
- Pro Konto setzen mit `channels.discord.accounts.<id>.ui.components.accentColor`.
- `embeds` werden ignoriert, wenn components v2 vorhanden sind.

Beispiel:

```json5
{
  channels: {
    discord: {
      ui: {
        components: {
          accentColor: "#5865F2",
        },
      },
    },
  },
}
```

## Sprachkanäle

OpenClaw kann Discord-Sprachkanälen für Echtzeit- und fortlaufende Gespräche beitreten. Dies ist getrennt von Anhängen mit Sprachnachrichten.

Anforderungen:

- Aktivieren Sie native Befehle (`commands.native` oder `channels.discord.commands.native`).
- Konfigurieren Sie `channels.discord.voice`.
- Der Bot benötigt Connect- und Speak-Berechtigungen im Ziel-Sprachkanal.

Verwenden Sie den nur für Discord verfügbaren nativen Befehl `/vc join|leave|status`, um Sitzungen zu steuern. Der Befehl verwendet den Standard-Agenten des Kontos und folgt denselben Allowlist- und Group-Policy-Regeln wie andere Discord-Befehle.

Beispiel für automatischen Beitritt:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        tts: {
          provider: "openai",
          openai: { voice: "alloy" },
        },
      },
    },
  },
}
```

Hinweise:

- `voice.tts` überschreibt `messages.tts` nur für die Sprachwiedergabe.
- Voice-Transcript-Turns leiten den Owner-Status aus Discord-`allowFrom` (oder `dm.allowFrom`) ab; Sprecher ohne Owner-Status können nicht auf owner-only Tools zugreifen (zum Beispiel `gateway` und `cron`).
- Voice ist standardmäßig aktiviert; setzen Sie `channels.discord.voice.enabled=false`, um es zu deaktivieren.
- `voice.daveEncryption` und `voice.decryptionFailureTolerance` werden an die Join-Optionen von `@discordjs/voice` durchgereicht.
- Die Standardwerte von `@discordjs/voice` sind `daveEncryption=true` und `decryptionFailureTolerance=24`, wenn nichts gesetzt ist.
- OpenClaw überwacht außerdem Entschlüsselungsfehler beim Empfang und stellt automatisch wieder her, indem der Sprachkanal nach wiederholten Fehlern in einem kurzen Zeitfenster verlassen und erneut betreten wird.
- Wenn Empfangsprotokolle wiederholt `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` anzeigen, kann dies der Upstream-Fehler von `@discordjs/voice` beim Empfang sein, der in [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) verfolgt wird.

## Sprachnachrichten

Discord-Sprachnachrichten zeigen eine Wellenformvorschau an und erfordern OGG/Opus-Audio plus Metadaten. OpenClaw erzeugt die Wellenform automatisch, benötigt dafür aber `ffmpeg` und `ffprobe`, die auf dem Gateway-Host verfügbar sein müssen, um Audiodateien zu prüfen und zu konvertieren.

Anforderungen und Einschränkungen:

- Geben Sie einen **lokalen Dateipfad** an (URLs werden abgelehnt).
- Lassen Sie Textinhalt weg (Discord erlaubt nicht Text + Sprachnachricht in derselben Payload).
- Jedes Audioformat wird akzeptiert; OpenClaw konvertiert bei Bedarf zu OGG/Opus.

Beispiel:

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Nicht erlaubte Intents verwendet oder Bot sieht keine Guild-Nachrichten">

    - Message Content Intent aktivieren
    - Server Members Intent aktivieren, wenn Sie von Benutzer-/Mitgliedsauflösung abhängig sind
    - Gateway nach Änderung der Intents neu starten

  </Accordion>

  <Accordion title="Guild-Nachrichten werden unerwartet blockiert">

    - `groupPolicy` prüfen
    - Guild-Allowlist unter `channels.discord.guilds` prüfen
    - wenn die Guild-`channels`-Map existiert, sind nur aufgeführte Kanäle erlaubt
    - Verhalten von `requireMention` und Erwähnungsmustern prüfen

    Nützliche Prüfungen:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false, aber weiterhin blockiert">
    Häufige Ursachen:

    - `groupPolicy="allowlist"` ohne passende Guild-/Kanal-Allowlist
    - `requireMention` an der falschen Stelle konfiguriert (muss unter `channels.discord.guilds` oder im Kanaleintrag stehen)
    - Sender durch Guild-/Kanal-`users`-Allowlist blockiert

  </Accordion>

  <Accordion title="Lang laufende Handler laufen ab oder erzeugen doppelte Antworten">

    Typische Logs:

    - `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
    - `Slow listener detected ...`
    - `discord inbound worker timed out after ...`

    Schalter für Listener-Budget:

    - Einzelkonto: `channels.discord.eventQueue.listenerTimeout`
    - Mehrere Konten: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

    Schalter für Worker-Lauf-Timeout:

    - Einzelkonto: `channels.discord.inboundWorker.runTimeoutMs`
    - Mehrere Konten: `channels.discord.accounts.<accountId>.inboundWorker.runTimeoutMs`
    - Standard: `1800000` (30 Minuten); setzen Sie `0`, um zu deaktivieren

    Empfohlene Baseline:

```json5
{
  channels: {
    discord: {
      accounts: {
        default: {
          eventQueue: {
            listenerTimeout: 120000,
          },
          inboundWorker: {
            runTimeoutMs: 1800000,
          },
        },
      },
    },
  },
}
```

    Verwenden Sie `eventQueue.listenerTimeout` für langsames Listener-Setup und `inboundWorker.runTimeoutMs`
    nur dann, wenn Sie ein separates Sicherheitsventil für in der Warteschlange stehende Agent-Turns möchten.

  </Accordion>

  <Accordion title="Abweichungen bei der Berechtigungsprüfung">
    Berechtigungsprüfungen von `channels status --probe` funktionieren nur für numerische Kanal-IDs.

    Wenn Sie Slug-Schlüssel verwenden, kann das Runtime-Matching weiterhin funktionieren, aber Probe kann die Berechtigungen nicht vollständig überprüfen.

  </Accordion>

  <Accordion title="DM- und Kopplungsprobleme">

    - DM deaktiviert: `channels.discord.dm.enabled=false`
    - DM-Richtlinie deaktiviert: `channels.discord.dmPolicy="disabled"` (veraltet: `channels.discord.dm.policy`)
    - wartet auf Genehmigung der Kopplung im Modus `pairing`

  </Accordion>

  <Accordion title="Bot-zu-Bot-Schleifen">
    Standardmäßig werden von Bots verfasste Nachrichten ignoriert.

    Wenn Sie `channels.discord.allowBots=true` setzen, verwenden Sie strenge Erwähnungs- und Allowlist-Regeln, um Schleifenverhalten zu vermeiden.
    Bevorzugen Sie `channels.discord.allowBots="mentions"`, um nur Bot-Nachrichten zu akzeptieren, die den Bot erwähnen.

  </Accordion>

  <Accordion title="Voice-STT-Ausfälle mit DecryptionFailed(...)">

    - halten Sie OpenClaw aktuell (`openclaw update`), damit die Discord-Wiederherstellungslogik für Voice-Empfang vorhanden ist
    - bestätigen Sie `channels.discord.voice.daveEncryption=true` (Standard)
    - beginnen Sie mit `channels.discord.voice.decryptionFailureTolerance=24` (Upstream-Standard) und passen Sie nur bei Bedarf an
    - überwachen Sie Logs auf:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - wenn Fehler nach automatischem erneuten Beitritt weiter auftreten, sammeln Sie Logs und vergleichen Sie sie mit [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419)

  </Accordion>
</AccordionGroup>

## Verweise auf die Konfigurationsreferenz

Primäre Referenz:

- [Configuration reference - Discord](/de/gateway/configuration-reference#discord)

Signalstarke Discord-Felder:

- Start/Auth: `enabled`, `token`, `accounts.*`, `allowBots`
- Richtlinie: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- Befehl: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- Ereigniswarteschlange: `eventQueue.listenerTimeout` (Listener-Budget), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Inbound-Worker: `inboundWorker.runTimeoutMs`
- Antwort/Verlauf: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- Zustellung: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- Streaming: `streaming` (veralteter Alias: `streamMode`), `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- Medien/Wiederholung: `mediaMaxMb`, `retry`
  - `mediaMaxMb` begrenzt ausgehende Discord-Uploads (Standard: `100MB`)
- Aktionen: `actions.*`
- Presence: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- Funktionen: `threadBindings`, oberstes `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

## Sicherheit und Betrieb

- Behandeln Sie Bot-Tokens als Geheimnisse (`DISCORD_BOT_TOKEN` bevorzugt in überwachten Umgebungen).
- Gewähren Sie Discord-Berechtigungen mit minimalen Rechten.
- Wenn der Bereitstellungs-/Statuszustand von Befehlen veraltet ist, starten Sie das Gateway neu und prüfen Sie erneut mit `openclaw channels status --probe`.

## Verwandt

- [Kopplung](/de/channels/pairing)
- [Gruppen](/de/channels/groups)
- [Kanal-Routing](/de/channels/channel-routing)
- [Sicherheit](/de/gateway/security)
- [Multi-Agent-Routing](/de/concepts/multi-agent)
- [Fehlerbehebung](/de/channels/troubleshooting)
- [Slash-Befehle](/de/tools/slash-commands)
