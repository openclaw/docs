---
read_when:
    - Arbeiten an Discord-Kanalfunktionen
summary: Status der Discord-Bot-Unterstützung, Funktionen und Konfiguration
title: Discord
x-i18n:
    generated_at: "2026-04-26T11:22:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68f4e1885aab2438c38ef3735b752968b7e1ed70795d1c3903fad20ff183d3ca
    source_path: channels/discord.md
    workflow: 15
---

Bereit für DMs und Serverkanäle über das offizielle Discord Gateway.

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

## Schnellstart

Sie müssen eine neue Anwendung mit einem Bot erstellen, den Bot zu Ihrem Server hinzufügen und ihn mit OpenClaw koppeln. Wir empfehlen, Ihren Bot zu Ihrem eigenen privaten Server hinzuzufügen. Falls Sie noch keinen haben, [erstellen Sie zuerst einen](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (wählen Sie **Create My Own > For me and my friends**).

<Steps>
  <Step title="Eine Discord-Anwendung und einen Bot erstellen">
    Gehen Sie zum [Discord Developer Portal](https://discord.com/developers/applications) und klicken Sie auf **New Application**. Geben Sie ihr einen Namen wie „OpenClaw“.

    Klicken Sie in der Seitenleiste auf **Bot**. Setzen Sie den **Username** auf den Namen, den Ihr OpenClaw-Agent tragen soll.

  </Step>

  <Step title="Privilegierte Intents aktivieren">
    Bleiben Sie auf der Seite **Bot**, scrollen Sie nach unten zu **Privileged Gateway Intents** und aktivieren Sie:

    - **Message Content Intent** (erforderlich)
    - **Server Members Intent** (empfohlen; erforderlich für Rollen-Allowlist und Abgleich von Namen zu IDs)
    - **Presence Intent** (optional; nur für Presence-Updates erforderlich)

  </Step>

  <Step title="Ihren Bot-Token kopieren">
    Scrollen Sie auf der Seite **Bot** wieder nach oben und klicken Sie auf **Reset Token**.

    <Note>
    Trotz des Namens wird hier Ihr erster Token erzeugt — es wird nichts „zurückgesetzt“.
    </Note>

    Kopieren Sie den Token und speichern Sie ihn an einem sicheren Ort. Das ist Ihr **Bot Token**, und Sie werden ihn gleich benötigen.

  </Step>

  <Step title="Eine Einladungs-URL erzeugen und den Bot zu Ihrem Server hinzufügen">
    Klicken Sie in der Seitenleiste auf **OAuth2**. Sie erzeugen eine Einladungs-URL mit den richtigen Berechtigungen, um den Bot zu Ihrem Server hinzuzufügen.

    Scrollen Sie nach unten zu **OAuth2 URL Generator** und aktivieren Sie:

    - `bot`
    - `applications.commands`

    Darunter erscheint ein Abschnitt **Bot Permissions**. Aktivieren Sie mindestens:

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (optional)

    Dies ist die Grundmenge für normale Textkanäle. Wenn Sie in Discord-Threads posten möchten, einschließlich Forum- oder Medienkanal-Workflows, die einen Thread erstellen oder fortsetzen, aktivieren Sie zusätzlich **Send Messages in Threads**.
    Kopieren Sie die unten erzeugte URL, fügen Sie sie in Ihren Browser ein, wählen Sie Ihren Server aus und klicken Sie auf **Continue**, um die Verbindung herzustellen. Sie sollten Ihren Bot jetzt auf dem Discord-Server sehen.

  </Step>

  <Step title="Developer Mode aktivieren und Ihre IDs erfassen">
    Zurück in der Discord-App müssen Sie den Developer Mode aktivieren, damit Sie interne IDs kopieren können.

    1. Klicken Sie auf **User Settings** (Zahnradsymbol neben Ihrem Avatar) → **Advanced** → **Developer Mode** aktivieren
    2. Klicken Sie in der Seitenleiste mit der rechten Maustaste auf Ihr **Server-Symbol** → **Copy Server ID**
    3. Klicken Sie mit der rechten Maustaste auf Ihren **eigenen Avatar** → **Copy User ID**

    Speichern Sie Ihre **Server ID** und **User ID** zusammen mit Ihrem Bot Token — Sie senden alle drei im nächsten Schritt an OpenClaw.

  </Step>

  <Step title="DMs von Servermitgliedern erlauben">
    Damit die Kopplung funktioniert, muss Discord Ihrem Bot erlauben, Ihnen eine DM zu senden. Klicken Sie mit der rechten Maustaste auf Ihr **Server-Symbol** → **Privacy Settings** → **Direct Messages** aktivieren.

    Dadurch können Servermitglieder (einschließlich Bots) Ihnen DMs senden. Lassen Sie dies aktiviert, wenn Sie Discord-DMs mit OpenClaw verwenden möchten. Wenn Sie nur Serverkanäle verwenden möchten, können Sie DMs nach der Kopplung deaktivieren.

  </Step>

  <Step title="Ihren Bot-Token sicher setzen (nicht im Chat senden)">
    Ihr Discord-Bot-Token ist ein Geheimnis (wie ein Passwort). Setzen Sie ihn auf dem Rechner, auf dem OpenClaw läuft, bevor Sie Ihrem Agenten schreiben.

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

    Wenn OpenClaw bereits als Hintergrunddienst läuft, starten Sie es über die OpenClaw-Mac-App neu oder indem Sie den Prozess `openclaw gateway run` beenden und erneut starten.

  </Step>

  <Step title="OpenClaw konfigurieren und koppeln">

    <Tabs>
      <Tab title="Ihren Agenten fragen">
        Chatten Sie mit Ihrem OpenClaw-Agenten auf einem vorhandenen Kanal (z. B. Telegram) und teilen Sie es ihm mit. Wenn Discord Ihr erster Kanal ist, verwenden Sie stattdessen den Reiter CLI / config.

        > "Ich habe meinen Discord-Bot-Token bereits in der Konfiguration gesetzt. Bitte schließen Sie die Discord-Einrichtung mit User ID `<user_id>` und Server ID `<server_id>` ab."
      </Tab>
      <Tab title="CLI / config">
        Wenn Sie dateibasierte Konfiguration bevorzugen, setzen Sie:

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

        Klartextwerte für `token` werden unterstützt. SecretRef-Werte werden ebenfalls für `channels.discord.token` über Env-/Datei-/Exec-Provider unterstützt. Siehe [Secrets Management](/de/gateway/secrets).

      </Tab>
    </Tabs>

  </Step>

  <Step title="Erste DM-Kopplung genehmigen">
    Warten Sie, bis das Gateway läuft, und senden Sie dann Ihrem Bot in Discord eine DM. Er antwortet mit einem Kopplungscode.

    <Tabs>
      <Tab title="Ihren Agenten fragen">
        Senden Sie den Kopplungscode an Ihren Agenten auf Ihrem vorhandenen Kanal:

        > "Genehmigen Sie diesen Discord-Kopplungscode: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    Kopplungscodes laufen nach 1 Stunde ab.

    Sie sollten jetzt per DM mit Ihrem Agenten in Discord chatten können.

  </Step>
</Steps>

<Note>
Die Token-Auflösung ist kontobewusst. Token-Werte in der Konfiguration haben Vorrang vor dem Env-Fallback. `DISCORD_BOT_TOKEN` wird nur für das Standardkonto verwendet.
Für erweiterte ausgehende Aufrufe (Nachrichten-Tool-/Kanalaktionen) wird ein expliziter aufrufbezogener `token` für diesen Aufruf verwendet. Das gilt für Sende- sowie Lese-/Probe-artige Aktionen (zum Beispiel read/search/fetch/thread/pins/permissions). Konto-Richtlinien- und Retry-Einstellungen stammen weiterhin aus dem ausgewählten Konto im aktiven Laufzeit-Snapshot.
</Note>

## Empfohlen: Einen Server-Arbeitsbereich einrichten

Sobald DMs funktionieren, können Sie Ihren Discord-Server als vollständigen Arbeitsbereich einrichten, in dem jeder Kanal seine eigene Agentensitzung mit eigenem Kontext erhält. Dies wird für private Server empfohlen, auf denen nur Sie und Ihr Bot sind.

<Steps>
  <Step title="Ihren Server zur Server-Allowlist hinzufügen">
    Dadurch kann Ihr Agent auf Ihrem Server in jedem Kanal antworten, nicht nur in DMs.

    <Tabs>
      <Tab title="Ihren Agenten fragen">
        > "Fügen Sie meine Discord Server ID `<server_id>` zur Server-Allowlist hinzu"
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
    Standardmäßig antwortet Ihr Agent in Serverkanälen nur, wenn er mit @ erwähnt wird. Für einen privaten Server möchten Sie wahrscheinlich, dass er auf jede Nachricht antwortet.

    <Tabs>
      <Tab title="Ihren Agenten fragen">
        > "Erlauben Sie meinem Agenten, auf diesem Server zu antworten, ohne mit @ erwähnt werden zu müssen"
      </Tab>
      <Tab title="Konfiguration">
        Setzen Sie `requireMention: false` in Ihrer Serverkonfiguration:

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

  <Step title="Speicher in Serverkanälen einplanen">
    Standardmäßig wird Langzeitspeicher (`MEMORY.md`) nur in DM-Sitzungen geladen. In Serverkanälen wird `MEMORY.md` nicht automatisch geladen.

    <Tabs>
      <Tab title="Ihren Agenten fragen">
        > "Wenn ich in Discord-Kanälen Fragen stelle, verwenden Sie `memory_search` oder `memory_get`, wenn Sie Langzeitkontext aus `MEMORY.md` benötigen."
      </Tab>
      <Tab title="Manuell">
        Wenn Sie gemeinsam genutzten Kontext in jedem Kanal benötigen, legen Sie die stabilen Anweisungen in `AGENTS.md` oder `USER.md` ab (sie werden in jede Sitzung injiziert). Bewahren Sie Langzeitnotizen in `MEMORY.md` auf und greifen Sie bei Bedarf mit Speicher-Tools darauf zu.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Erstellen Sie jetzt einige Kanäle auf Ihrem Discord-Server und beginnen Sie zu chatten. Ihr Agent kann den Kanalnamen sehen, und jeder Kanal erhält seine eigene isolierte Sitzung — so können Sie `#coding`, `#home`, `#research` oder alles einrichten, was zu Ihrem Workflow passt.

## Laufzeitmodell

- Das Gateway verwaltet die Discord-Verbindung.
- Das Antwort-Routing ist deterministisch: eingehende Discord-Antworten gehen an Discord zurück.
- Discord-Server-/Kanalmetadaten werden als nicht vertrauenswürdiger Kontext zum Modell-Prompt hinzugefügt, nicht als für Benutzer sichtbares Antwortpräfix. Wenn ein Modell diesen Umschlag zurückkopiert, entfernt OpenClaw die kopierten Metadaten aus ausgehenden Antworten und aus zukünftigem Wiedergabekontext.
- Standardmäßig (`session.dmScope=main`) teilen direkte Chats die Hauptsitzung des Agenten (`agent:main:main`).
- Serverkanäle verwenden isolierte Sitzungsschlüssel (`agent:<agentId>:discord:channel:<channelId>`).
- Gruppen-DMs werden standardmäßig ignoriert (`channels.discord.dm.groupEnabled=false`).
- Native Slash-Befehle laufen in isolierten Befehlssitzungen (`agent:<agentId>:discord:slash:<userId>`), tragen aber weiterhin `CommandTargetSessionKey` in die weitergeleitete Unterhaltungssitzung.
- Die Zustellung textbasierter Cron-/Heartbeat-Ankündigungen an Discord verwendet genau einmal die endgültige, für den Assistenten sichtbare Antwort. Medien- und strukturierte Komponenten-Payloads bleiben mehrteilig, wenn der Agent mehrere zustellbare Payloads ausgibt.

## Forum-Kanäle

Discord-Forum- und Medienkanäle akzeptieren nur Thread-Beiträge. OpenClaw unterstützt zwei Wege, sie zu erstellen:

- Senden Sie eine Nachricht an das Forum-Parent (`channel:<forumId>`), um automatisch einen Thread zu erstellen. Der Thread-Titel verwendet die erste nicht leere Zeile Ihrer Nachricht.
- Verwenden Sie `openclaw message thread create`, um einen Thread direkt zu erstellen. Übergeben Sie für Forum-Kanäle nicht `--message-id`.

Beispiel: An das Forum-Parent senden, um einen Thread zu erstellen

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Beispiel: Einen Forum-Thread explizit erstellen

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Forum-Parents akzeptieren keine Discord-Komponenten. Wenn Sie Komponenten benötigen, senden Sie an den Thread selbst (`channel:<threadId>`).

## Interaktive Komponenten

OpenClaw unterstützt Discord-Komponenten-v2-Container für Agentennachrichten. Verwenden Sie das Nachrichten-Tool mit einer `components`-Payload. Interaktionsergebnisse werden als normale eingehende Nachrichten an den Agenten zurückgeleitet und folgen den bestehenden Discord-Einstellungen für `replyToMode`.

Unterstützte Blöcke:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Aktionszeilen erlauben bis zu 5 Schaltflächen oder ein einzelnes Auswahlmenü
- Auswahltypen: `string`, `user`, `role`, `mentionable`, `channel`

Standardmäßig sind Komponenten nur einmal verwendbar. Setzen Sie `components.reusable=true`, damit Schaltflächen, Auswahlen und Formulare mehrfach verwendet werden können, bis sie ablaufen.

Um einzuschränken, wer auf eine Schaltfläche klicken kann, setzen Sie `allowedUsers` auf dieser Schaltfläche (Discord-Benutzer-IDs, Tags oder `*`). Wenn dies konfiguriert ist, erhalten nicht passende Benutzer eine ephemere Ablehnung.

Die Slash-Befehle `/model` und `/models` öffnen eine interaktive Modellauswahl mit Dropdowns für Provider, Modell und kompatible Laufzeit sowie einem Schritt zum Absenden. `/models add` ist veraltet und gibt jetzt statt einer Registrierung von Modellen aus dem Chat eine Deprecation-Meldung zurück. Die Antwort der Auswahl ist ephemer, und nur der aufrufende Benutzer kann sie verwenden.

Dateianhänge:

- `file`-Blöcke müssen auf eine Attachment-Referenz zeigen (`attachment://<filename>`)
- Stellen Sie den Anhang über `media`/`path`/`filePath` bereit (einzelne Datei); verwenden Sie `media-gallery` für mehrere Dateien
- Verwenden Sie `filename`, um den Upload-Namen zu überschreiben, wenn er mit der Attachment-Referenz übereinstimmen soll

Modale Formulare:

- Fügen Sie `components.modal` mit bis zu 5 Feldern hinzu
- Feldtypen: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw fügt automatisch eine Trigger-Schaltfläche hinzu

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

    Priorität bei mehreren Konten:

    - `channels.discord.accounts.default.allowFrom` gilt nur für das Konto `default`.
    - Benannte Konten übernehmen `channels.discord.allowFrom`, wenn ihr eigenes `allowFrom` nicht gesetzt ist.
    - Benannte Konten übernehmen nicht `channels.discord.accounts.default.allowFrom`.

    DM-Zielformat für Zustellung:

    - `user:<id>`
    - `<@id>`-Erwähnung

    Reine numerische IDs sind mehrdeutig und werden abgelehnt, sofern nicht explizit eine Benutzer-/Kanal-Zielart angegeben ist.

  </Tab>

  <Tab title="Server-Richtlinie">
    Die Verarbeitung von Servern wird über `channels.discord.groupPolicy` gesteuert:

    - `open`
    - `allowlist`
    - `disabled`

    Die sichere Basislinie, wenn `channels.discord` vorhanden ist, ist `allowlist`.

    Verhalten von `allowlist`:

    - Der Server muss mit `channels.discord.guilds` übereinstimmen (`id` bevorzugt, Slug akzeptiert)
    - optionale Sender-Allowlists: `users` (stabile IDs empfohlen) und `roles` (nur Rollen-IDs); wenn eines von beiden konfiguriert ist, sind Sender erlaubt, wenn sie mit `users` ODER `roles` übereinstimmen
    - direktes Abgleichen von Namen/Tags ist standardmäßig deaktiviert; aktivieren Sie `channels.discord.dangerouslyAllowNameMatching: true` nur als Break-Glass-Kompatibilitätsmodus
    - Namen/Tags werden für `users` unterstützt, aber IDs sind sicherer; `openclaw security audit` warnt, wenn Namen-/Tag-Einträge verwendet werden
    - wenn für einen Server `channels` konfiguriert ist, werden nicht aufgeführte Kanäle verweigert
    - wenn ein Server keinen `channels`-Block hat, sind alle Kanäle in diesem per Allowlist freigegebenen Server erlaubt

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

    Wenn Sie nur `DISCORD_BOT_TOKEN` setzen und keinen `channels.discord`-Block erstellen, ist das Laufzeit-Fallback `groupPolicy="allowlist"` (mit einer Warnung in den Logs), selbst wenn `channels.defaults.groupPolicy` auf `open` steht.

  </Tab>

  <Tab title="Erwähnungen und Gruppen-DMs">
    Servernachrichten sind standardmäßig an Erwähnungen gebunden.

    Die Erkennung von Erwähnungen umfasst:

    - explizite Bot-Erwähnung
    - konfigurierte Erwähnungsmuster (`agents.list[].groupChat.mentionPatterns`, Fallback `messages.groupChat.mentionPatterns`)
    - implizites Reply-to-Bot-Verhalten in unterstützten Fällen

    `requireMention` wird pro Server/Kanal konfiguriert (`channels.discord.guilds...`).
    `ignoreOtherMentions` verwirft optional Nachrichten, die einen anderen Benutzer/eine andere Rolle erwähnen, aber nicht den Bot (ausgenommen @everyone/@here).

    Gruppen-DMs:

    - Standard: ignoriert (`dm.groupEnabled=false`)
    - optionale Allowlist über `dm.groupChannels` (Kanal-IDs oder Slugs)

  </Tab>
</Tabs>

### Rollenbasiertes Agenten-Routing

Verwenden Sie `bindings[].match.roles`, um Discord-Servermitglieder anhand der Rollen-ID an verschiedene Agenten weiterzuleiten. Rollenbasierte Bindings akzeptieren nur Rollen-IDs und werden nach Peer- oder Parent-Peer-Bindings und vor rein serverbasierten Bindings ausgewertet. Wenn ein Binding auch andere Match-Felder setzt (zum Beispiel `peer` + `guildId` + `roles`), müssen alle konfigurierten Felder übereinstimmen.

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

## Native Befehle und Befehlsauthentifizierung

- `commands.native` ist standardmäßig `"auto"` und für Discord aktiviert.
- Kanalbezogene Überschreibung: `channels.discord.commands.native`.
- `commands.native=false` entfernt explizit zuvor registrierte native Discord-Befehle.
- Die Authentifizierung nativer Befehle verwendet dieselben Discord-Allowlists/-Richtlinien wie die normale Nachrichtenverarbeitung.
- Befehle können in der Discord-UI weiterhin für Benutzer sichtbar sein, die nicht autorisiert sind; die Ausführung erzwingt dennoch die OpenClaw-Authentifizierung und gibt „nicht autorisiert“ zurück.

Siehe [Slash-Befehle](/de/tools/slash-commands) für Befehlskatalog und Verhalten.

Standardmäßige Einstellungen für Slash-Befehle:

- `ephemeral: true`

## Funktionsdetails

<AccordionGroup>
  <Accordion title="Reply-Tags und native Antworten">
    Discord unterstützt Reply-Tags in der Agentenausgabe:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Gesteuert durch `channels.discord.replyToMode`:

    - `off` (Standard)
    - `first`
    - `all`
    - `batched`

    Hinweis: `off` deaktiviert implizites Reply-Threading. Explizite `[[reply_to_*]]`-Tags werden weiterhin beachtet.
    `first` hängt die implizite native Reply-Referenz immer an die erste ausgehende Discord-Nachricht für den Zug an.
    `batched` hängt Discords implizite native Reply-Referenz nur an, wenn der eingehende Zug ein entprelltes Batch aus mehreren Nachrichten war. Das ist nützlich, wenn Sie native Antworten vor allem für mehrdeutige, stoßweise Chats möchten und nicht für jeden einzelnen Nachrichtenzug.

    Nachrichten-IDs werden im Kontext/Verlauf offengelegt, sodass Agenten bestimmte Nachrichten gezielt adressieren können.

  </Accordion>

  <Accordion title="Live-Stream-Vorschau">
    OpenClaw kann Entwurfsantworten streamen, indem eine temporäre Nachricht gesendet und beim Eintreffen von Text bearbeitet wird. `channels.discord.streaming` verwendet `off` (Standard) | `partial` | `block` | `progress`. `progress` wird auf Discord auf `partial` abgebildet; `streamMode` ist ein veralteter Alias und wird automatisch migriert.

    Standardmäßig bleibt es bei `off`, weil Bearbeitungen der Discord-Vorschau schnell auf Rate Limits treffen, wenn mehrere Bots oder Gateways ein Konto gemeinsam nutzen.

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

    - `partial` bearbeitet eine einzelne Vorschaunachricht, während Tokens eintreffen.
    - `block` gibt Entwurfsblöcke aus (verwenden Sie `draftChunk`, um Größe und Umbruchpunkte anzupassen, begrenzt durch `textChunkLimit`).
    - Medien, Fehler und explizite Reply-Finals brechen ausstehende Vorschaubearbeitungen ab.
    - `streaming.preview.toolProgress` (Standard `true`) steuert, ob Tool-/Fortschrittsaktualisierungen die Vorschaunachricht wiederverwenden.

    Vorschau-Streaming ist nur für Text; Medienantworten fallen auf normale Zustellung zurück. Wenn `block`-Streaming explizit aktiviert ist, überspringt OpenClaw den Vorschau-Stream, um doppeltes Streaming zu vermeiden.

  </Accordion>

  <Accordion title="Verlauf, Kontext und Thread-Verhalten">
    Kontext für Serververlauf:

    - `channels.discord.historyLimit` Standard `20`
    - Fallback: `messages.groupChat.historyLimit`
    - `0` deaktiviert

    Verlaufseinstellungen für DMs:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Thread-Verhalten:

    - Discord-Threads werden als Kanalsitzungen geroutet und übernehmen die Konfiguration des Parent-Kanals, sofern sie nicht überschrieben wird.
    - `channels.discord.thread.inheritParent` (Standard `false`) meldet neue Auto-Threads für Seeding aus dem Parent-Transkript an. Kontoabhängige Überschreibungen befinden sich unter `channels.discord.accounts.<id>.thread.inheritParent`.
    - Reaktionen des Nachrichten-Tools können `user:<id>`-DM-Ziele auflösen.
    - `guilds.<guild>.channels.<channel>.requireMention: false` bleibt während des Aktivierungs-Fallbacks in der Antwortphase erhalten.

    Kanalthemen werden als **nicht vertrauenswürdiger** Kontext injiziert. Allowlists steuern, wer den Agenten auslösen kann, sind aber keine vollständige Redaktionsgrenze für Zusatzkontext.

  </Accordion>

  <Accordion title="Thread-gebundene Sitzungen für Sub-Agents">
    Discord kann einen Thread an ein Sitzungsziel binden, sodass Folgemeldungen in diesem Thread weiterhin an dieselbe Sitzung geroutet werden (einschließlich Sub-Agent-Sitzungen).

    Befehle:

    - `/focus <target>` bindet den aktuellen/neuen Thread an ein Sub-Agent-/Sitzungsziel
    - `/unfocus` entfernt die aktuelle Thread-Bindung
    - `/agents` zeigt aktive Läufe und den Bindungsstatus
    - `/session idle <duration|off>` prüft/aktualisiert automatische Entkopplung bei Inaktivität für fokussierte Bindungen
    - `/session max-age <duration|off>` prüft/aktualisiert das harte maximale Alter für fokussierte Bindungen

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
    - `spawnSubagentSessions` muss `true` sein, damit Threads für `sessions_spawn({ thread: true })` automatisch erstellt/gebunden werden.
    - `spawnAcpSessions` muss `true` sein, damit Threads für ACP (`/acp spawn ... --thread ...` oder `sessions_spawn({ runtime: "acp", thread: true })`) automatisch erstellt/gebunden werden.
    - Wenn Thread-Bindings für ein Konto deaktiviert sind, sind `/focus` und verwandte Thread-Binding-Operationen nicht verfügbar.

    Siehe [Sub-Agents](/de/tools/subagents), [ACP Agents](/de/tools/acp-agents) und [Configuration Reference](/de/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Persistente ACP-Kanal-Bindings">
    Für stabile „always-on“-ACP-Arbeitsbereiche konfigurieren Sie typisierte ACP-Bindings auf oberster Ebene, die auf Discord-Unterhaltungen zielen.

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

    - `/acp spawn codex --bind here` bindet den aktuellen Kanal oder Thread direkt und hält zukünftige Nachrichten auf derselben ACP-Sitzung. Thread-Nachrichten übernehmen das Binding des Parent-Kanals.
    - In einem gebundenen Kanal oder Thread setzen `/new` und `/reset` dieselbe ACP-Sitzung direkt zurück. Temporäre Thread-Bindings können die Zielauflösung überschreiben, solange sie aktiv sind.
    - `spawnAcpSessions` ist nur erforderlich, wenn OpenClaw einen untergeordneten Thread über `--thread auto|here` erstellen/binden muss.

    Siehe [ACP Agents](/de/tools/acp-agents) für Details zum Binding-Verhalten.

  </Accordion>

  <Accordion title="Reaktionsbenachrichtigungen">
    Reaktionsbenachrichtigungsmodus pro Server:

    - `off`
    - `own` (Standard)
    - `all`
    - `allowlist` (verwendet `guilds.<id>.users`)

    Reaktionsereignisse werden in Systemereignisse umgewandelt und an die weitergeleitete Discord-Sitzung angehängt.

  </Accordion>

  <Accordion title="Bestätigungsreaktionen">
    `ackReaction` sendet ein Bestätigungs-Emoji, während OpenClaw eine eingehende Nachricht verarbeitet.

    Auflösungsreihenfolge:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - Emoji-Fallback der Agentenidentität (`agents.list[].identity.emoji`, andernfalls "👀")

    Hinweise:

    - Discord akzeptiert Unicode-Emojis oder benutzerdefinierte Emoji-Namen.
    - Verwenden Sie `""`, um die Reaktion für einen Kanal oder ein Konto zu deaktivieren.

  </Accordion>

  <Accordion title="Konfigurationsschreibvorgänge">
    Kanalinitiierte Konfigurationsschreibvorgänge sind standardmäßig aktiviert.

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
    Leiten Sie den Discord-Gateway-WebSocket-Verkehr und REST-Lookups beim Start (Anwendungs-ID + Allowlist-Auflösung) mit `channels.discord.proxy` über einen HTTP(S)-Proxy.

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
    Aktivieren Sie die PluralKit-Auflösung, um weitergeleitete Nachrichten der Identität eines Systemmitglieds zuzuordnen:

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // optional; für private Systeme erforderlich
      },
    },
  },
}
```

    Hinweise:

    - Allowlists können `pk:<memberId>` verwenden
    - Anzeigenamen von Mitgliedern werden nur nach Name/Slug abgeglichen, wenn `channels.discord.dangerouslyAllowNameMatching: true`
    - Lookups verwenden die ursprüngliche Nachrichten-ID und sind auf ein Zeitfenster begrenzt
    - wenn der Lookup fehlschlägt, werden weitergeleitete Nachrichten als Bot-Nachrichten behandelt und verworfen, sofern nicht `allowBots=true`

  </Accordion>

  <Accordion title="Presence-Konfiguration">
    Presence-Updates werden angewendet, wenn Sie ein Status- oder Aktivitätsfeld setzen oder wenn Sie Auto Presence aktivieren.

    Beispiel nur für den Status:

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

    Beispiel für Auto Presence (Laufzeit-Zustandssignal):

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

    Auto Presence ordnet die Laufzeitverfügbarkeit dem Discord-Status zu: healthy => online, degraded oder unknown => idle, exhausted oder unavailable => dnd. Optionale Textüberschreibungen:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (unterstützt den Platzhalter `{reason}`)

  </Accordion>

  <Accordion title="Genehmigungen in Discord">
    Discord unterstützt buttonbasierte Genehmigungsverarbeitung in DMs und kann Genehmigungsaufforderungen optional im Ursprungskanal posten.

    Konfigurationspfad:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (optional; fällt nach Möglichkeit auf `commands.ownerAllowFrom` zurück)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, Standard: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord aktiviert native Exec-Genehmigungen automatisch, wenn `enabled` nicht gesetzt oder `"auto"` ist und mindestens ein Genehmiger aufgelöst werden kann, entweder aus `execApprovals.approvers` oder aus `commands.ownerAllowFrom`. Discord leitet Exec-Genehmiger nicht aus kanalbezogenem `allowFrom`, veraltetem `dm.allowFrom` oder direktem `defaultTo` ab. Setzen Sie `enabled: false`, um Discord explizit als nativen Genehmigungs-Client zu deaktivieren.

    Wenn `target` auf `channel` oder `both` gesetzt ist, ist die Genehmigungsaufforderung im Kanal sichtbar. Nur aufgelöste Genehmiger können die Schaltflächen verwenden; andere Benutzer erhalten eine ephemere Ablehnung. Genehmigungsaufforderungen enthalten den Befehlstext. Aktivieren Sie die Kanalauslieferung daher nur in vertrauenswürdigen Kanälen. Wenn die Kanal-ID nicht aus dem Sitzungsschlüssel abgeleitet werden kann, fällt OpenClaw auf DM-Zustellung zurück.

    Discord rendert auch die gemeinsamen Genehmigungsschaltflächen, die von anderen Chatkanälen verwendet werden. Der native Discord-Adapter ergänzt hauptsächlich Genehmiger-DM-Routing und Kanal-Fanout.
    Wenn diese Schaltflächen vorhanden sind, sind sie die primäre Genehmigungs-UX; OpenClaw
    sollte nur dann einen manuellen `/approve`-Befehl einschließen, wenn das Tool-Ergebnis sagt,
    dass Chat-Genehmigungen nicht verfügbar sind oder manuelle Genehmigung der einzige Weg ist.

    Gateway-Authentifizierung und Genehmigungsauflösung folgen dem gemeinsamen Gateway-Client-Vertrag (`plugin:`-IDs werden über `plugin.approval.resolve` aufgelöst; andere IDs über `exec.approval.resolve`). Genehmigungen laufen standardmäßig nach 30 Minuten ab.

    Siehe [Exec-Genehmigungen](/de/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Tools und Action-Gates

Discord-Nachrichtenaktionen umfassen Messaging-, Kanaladministrations-, Moderations-, Presence- und Metadatenaktionen.

Kernbeispiele:

- Messaging: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- Reaktionen: `react`, `reactions`, `emojiList`
- Moderation: `timeout`, `kick`, `ban`
- Presence: `setPresence`

Die Aktion `event-create` akzeptiert einen optionalen Parameter `image` (URL oder lokaler Dateipfad), um das Coverbild des geplanten Ereignisses zu setzen.

Action-Gates befinden sich unter `channels.discord.actions.*`.

Standardverhalten der Gates:

| Aktionsgruppe                                                                                                                                                             | Standard |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | aktiviert |
| roles                                                                                                                                                                     | deaktiviert |
| moderation                                                                                                                                                                | deaktiviert |
| presence                                                                                                                                                                  | deaktiviert |

## Components v2 UI

OpenClaw verwendet Discord-Komponenten v2 für Exec-Genehmigungen und kanalübergreifende Markierungen. Discord-Nachrichtenaktionen können auch `components` für benutzerdefinierte UI akzeptieren (fortgeschritten; erfordert das Erstellen einer Komponenten-Payload über das Discord-Tool), während veraltete `embeds` weiterhin verfügbar, aber nicht empfohlen sind.

- `channels.discord.ui.components.accentColor` setzt die Akzentfarbe, die von Discord-Komponenten-Containern verwendet wird (hex).
- Pro Konto setzen mit `channels.discord.accounts.<id>.ui.components.accentColor`.
- `embeds` werden ignoriert, wenn Components v2 vorhanden sind.

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

## Sprache

Discord hat zwei unterschiedliche Sprachoberflächen: Echtzeit-**Sprachkanäle** (fortlaufende Unterhaltungen) und **Voice-Message-Anhänge** (das Format mit Wellenformvorschau). Das Gateway unterstützt beide.

### Sprachkanäle

Checkliste für die Einrichtung:

1. Aktivieren Sie Message Content Intent im Discord Developer Portal.
2. Aktivieren Sie Server Members Intent, wenn Rollen-/Benutzer-Allowlists verwendet werden.
3. Laden Sie den Bot mit den Scopes `bot` und `applications.commands` ein.
4. Gewähren Sie im Ziel-Sprachkanal Connect, Speak, Send Messages und Read Message History.
5. Aktivieren Sie native Befehle (`commands.native` oder `channels.discord.commands.native`).
6. Konfigurieren Sie `channels.discord.voice`.

Verwenden Sie `/vc join|leave|status`, um Sitzungen zu steuern. Der Befehl verwendet den Standard-Agenten des Kontos und folgt denselben Allowlist- und Group-Policy-Regeln wie andere Discord-Befehle.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

Beispiel für Auto-Join:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.4-mini",
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
          openai: { voice: "onyx" },
        },
      },
    },
  },
}
```

Hinweise:

- `voice.tts` überschreibt `messages.tts` nur für die Sprachwiedergabe.
- `voice.model` überschreibt nur das für Discord-Sprachkanalantworten verwendete LLM. Lassen Sie es ungesetzt, um das Modell des weitergeleiteten Agenten zu übernehmen.
- STT verwendet `tools.media.audio`; `voice.model` beeinflusst die Transkription nicht.
- Sprachtranskriptionszüge leiten den Owner-Status aus Discord `allowFrom` (oder `dm.allowFrom`) ab; Sprecher ohne Owner-Status können nicht auf Tools zugreifen, die nur für Owner verfügbar sind (zum Beispiel `gateway` und `cron`).
- Sprache ist standardmäßig aktiviert; setzen Sie `channels.discord.voice.enabled=false`, um sie zu deaktivieren.
- `voice.daveEncryption` und `voice.decryptionFailureTolerance` werden an die Join-Optionen von `@discordjs/voice` durchgereicht.
- Die Standardwerte von `@discordjs/voice` sind `daveEncryption=true` und `decryptionFailureTolerance=24`, wenn sie nicht gesetzt sind.
- OpenClaw überwacht auch Entschlüsselungsfehler beim Empfang und stellt sich nach wiederholten Fehlern in einem kurzen Zeitfenster automatisch wieder her, indem der Sprachkanal verlassen und erneut betreten wird.
- Wenn Empfangslogs nach einem Update wiederholt `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` anzeigen, erfassen Sie einen Abhängigkeitsbericht und Logs. Die gebündelte `@discordjs/voice`-Version enthält den Upstream-Padding-Fix aus discord.js PR #11449, der discord.js Issue #11419 geschlossen hat.

Pipeline für Sprachkanäle:

- Discord-PCM-Erfassung wird in eine temporäre WAV-Datei umgewandelt.
- `tools.media.audio` übernimmt STT, zum Beispiel `openai/gpt-4o-mini-transcribe`.
- Das Transkript wird durch den normalen Discord-Ingress und das normale Routing gesendet.
- `voice.model` überschreibt, wenn gesetzt, nur das Antwort-LLM für diesen Sprachkanal-Zug.
- `voice.tts` wird über `messages.tts` zusammengeführt; das resultierende Audio wird im beigetretenen Kanal abgespielt.

Anmeldedaten werden pro Komponente aufgelöst: LLM-Route-Authentifizierung für `voice.model`, STT-Authentifizierung für `tools.media.audio` und TTS-Authentifizierung für `messages.tts`/`voice.tts`.

### Voice Messages

Discord-Voice-Messages zeigen eine Wellenformvorschau an und erfordern OGG/Opus-Audio. OpenClaw erzeugt die Wellenform automatisch, benötigt dafür aber `ffmpeg` und `ffprobe` auf dem Gateway-Host für Analyse und Konvertierung.

- Geben Sie einen **lokalen Dateipfad** an (URLs werden abgelehnt).
- Lassen Sie Textinhalt weg (Discord lehnt Text + Voice Message in derselben Payload ab).
- Jedes Audioformat wird akzeptiert; OpenClaw konvertiert bei Bedarf in OGG/Opus.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Nicht erlaubte Intents verwendet oder Bot sieht keine Servernachrichten">

    - Message Content Intent aktivieren
    - Server Members Intent aktivieren, wenn Sie von der Auflösung von Benutzern/Mitgliedern abhängen
    - Gateway nach Änderung der Intents neu starten

  </Accordion>

  <Accordion title="Servernachrichten werden unerwartet blockiert">

    - `groupPolicy` prüfen
    - Server-Allowlist unter `channels.discord.guilds` prüfen
    - wenn die `channels`-Map des Servers vorhanden ist, sind nur aufgeführte Kanäle erlaubt
    - Verhalten von `requireMention` und Erwähnungsmuster prüfen

    Nützliche Prüfungen:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false, aber weiterhin blockiert">
    Häufige Ursachen:

    - `groupPolicy="allowlist"` ohne passende Server-/Kanal-Allowlist
    - `requireMention` an der falschen Stelle konfiguriert (muss unter `channels.discord.guilds` oder dem Kanaleintrag stehen)
    - Absender durch die `users`-Allowlist des Servers/Kanals blockiert

  </Accordion>

  <Accordion title="Lang laufende Handler laufen in Timeouts oder erzeugen doppelte Antworten">

    Typische Logs:

    - `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
    - `Slow listener detected ...`
    - `discord inbound worker timed out after ...`

    Parameter für das Listener-Budget:

    - Einzelkonto: `channels.discord.eventQueue.listenerTimeout`
    - Mehrere Konten: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

    Parameter für das Worker-Run-Timeout:

    - Einzelkonto: `channels.discord.inboundWorker.runTimeoutMs`
    - Mehrere Konten: `channels.discord.accounts.<accountId>.inboundWorker.runTimeoutMs`
    - Standard: `1800000` (30 Minuten); setzen Sie `0`, um es zu deaktivieren

    Empfohlene Basislinie:

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

    Verwenden Sie `eventQueue.listenerTimeout` für langsame Listener-Einrichtung und `inboundWorker.runTimeoutMs`
    nur dann, wenn Sie ein separates Sicherheitsventil für in die Warteschlange gestellte Agentenzüge möchten.

  </Accordion>

  <Accordion title="Abweichungen bei der Berechtigungsprüfung">
    Berechtigungsprüfungen mit `channels status --probe` funktionieren nur für numerische Kanal-IDs.

    Wenn Sie Slug-Schlüssel verwenden, kann das Laufzeit-Matching weiterhin funktionieren, aber die Probe kann Berechtigungen nicht vollständig verifizieren.

  </Accordion>

  <Accordion title="DM- und Kopplungsprobleme">

    - DM deaktiviert: `channels.discord.dm.enabled=false`
    - DM-Richtlinie deaktiviert: `channels.discord.dmPolicy="disabled"` (veraltet: `channels.discord.dm.policy`)
    - Warten auf Genehmigung der Kopplung im Modus `pairing`

  </Accordion>

  <Accordion title="Bot-zu-Bot-Schleifen">
    Standardmäßig werden von Bots verfasste Nachrichten ignoriert.

    Wenn Sie `channels.discord.allowBots=true` setzen, verwenden Sie strikte Erwähnungs- und Allowlist-Regeln, um Schleifenverhalten zu vermeiden.
    Bevorzugen Sie `channels.discord.allowBots="mentions"`, um nur Bot-Nachrichten zu akzeptieren, die den Bot erwähnen.

  </Accordion>

  <Accordion title="Voice-STT-Ausfälle mit DecryptionFailed(...)">

    - OpenClaw aktuell halten (`openclaw update`), damit die Wiederherstellungslogik für Discord-Voice-Empfang vorhanden ist
    - bestätigen, dass `channels.discord.voice.daveEncryption=true` gesetzt ist (Standard)
    - mit `channels.discord.voice.decryptionFailureTolerance=24` (Upstream-Standard) beginnen und nur bei Bedarf anpassen
    - Logs beobachten auf:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - wenn die Fehler nach automatischem Rejoin weiterhin auftreten, Logs erfassen und mit dem Upstream-DAVE-Empfangsverlauf in [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) und [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) vergleichen

  </Accordion>
</AccordionGroup>

## Konfigurationsreferenz

Primäre Referenz: [Konfigurationsreferenz - Discord](/de/gateway/config-channels#discord).

<Accordion title="Signalstarke Discord-Felder">

- Start/Authentifizierung: `enabled`, `token`, `accounts.*`, `allowBots`
- Richtlinie: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- Befehle: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- Ereigniswarteschlange: `eventQueue.listenerTimeout` (Listener-Budget), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Inbound-Worker: `inboundWorker.runTimeoutMs`
- Antwort/Verlauf: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- Zustellung: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- Streaming: `streaming` (veralteter Alias: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- Medien/Retry: `mediaMaxMb` (begrenzt ausgehende Discord-Uploads, Standard `100MB`), `retry`
- Aktionen: `actions.*`
- Presence: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- Funktionen: `threadBindings`, oberste Ebene `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## Sicherheit und Betrieb

- Behandeln Sie Bot-Tokens als Geheimnisse (`DISCORD_BOT_TOKEN` wird in überwachten Umgebungen bevorzugt).
- Vergeben Sie Discord-Berechtigungen nach dem Prinzip der geringsten Rechte.
- Wenn der Befehls-Deploy-/Status veraltet ist, starten Sie das Gateway neu und prüfen Sie erneut mit `openclaw channels status --probe`.

## Verwandt

<CardGroup cols={2}>
  <Card title="Kopplung" icon="link" href="/de/channels/pairing">
    Einen Discord-Benutzer mit dem Gateway koppeln.
  </Card>
  <Card title="Gruppen" icon="users" href="/de/channels/groups">
    Verhalten von Gruppenchats und Allowlists.
  </Card>
  <Card title="Kanal-Routing" icon="route" href="/de/channels/channel-routing">
    Eingehende Nachrichten an Agenten weiterleiten.
  </Card>
  <Card title="Sicherheit" icon="shield" href="/de/gateway/security">
    Bedrohungsmodell und Härtung.
  </Card>
  <Card title="Multi-Agent-Routing" icon="sitemap" href="/de/concepts/multi-agent">
    Server und Kanäle Agenten zuordnen.
  </Card>
  <Card title="Slash-Befehle" icon="terminal" href="/de/tools/slash-commands">
    Verhalten nativer Befehle.
  </Card>
</CardGroup>
