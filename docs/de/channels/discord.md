---
read_when:
    - Arbeiten an Discord-Kanalfunktionen
summary: Status der Discord-Bot-Unterstützung, Funktionen und Konfiguration
title: Discord
x-i18n:
    generated_at: "2026-04-25T13:40:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 685dd2dce8a299233b14e7bdd5f502ee92f740b7dbb3104e86e0c2f36aabcfe1
    source_path: channels/discord.md
    workflow: 15
---

Bereit für DMs und Serverkanäle über das offizielle Discord-Gateway.

<CardGroup cols={3}>
  <Card title="Kopplung" icon="link" href="/de/channels/pairing">
    Discord-DMs verwenden standardmäßig den Kopplungsmodus.
  </Card>
  <Card title="Slash-Befehle" icon="terminal" href="/de/tools/slash-commands">
    Natives Befehlsverhalten und Befehlskatalog.
  </Card>
  <Card title="Fehlerbehebung für Kanäle" icon="wrench" href="/de/channels/troubleshooting">
    Kanalübergreifende Diagnose und Reparaturablauf.
  </Card>
</CardGroup>

## Schnelleinrichtung

Sie müssen eine neue Anwendung mit einem Bot erstellen, den Bot zu Ihrem Server hinzufügen und ihn mit OpenClaw koppeln. Wir empfehlen, Ihren Bot zu Ihrem eigenen privaten Server hinzuzufügen. Wenn Sie noch keinen haben, [erstellen Sie zuerst einen](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (wählen Sie **Create My Own > For me and my friends**).

<Steps>
  <Step title="Eine Discord-Anwendung und einen Bot erstellen">
    Gehen Sie zum [Discord Developer Portal](https://discord.com/developers/applications) und klicken Sie auf **New Application**. Geben Sie ihr einen Namen wie „OpenClaw“.

    Klicken Sie in der Seitenleiste auf **Bot**. Setzen Sie den **Username** auf den Namen, den Sie Ihrem OpenClaw-Agenten geben.

  </Step>

  <Step title="Privilegierte Intents aktivieren">
    Bleiben Sie auf der Seite **Bot**, scrollen Sie nach unten zu **Privileged Gateway Intents** und aktivieren Sie:

    - **Message Content Intent** (erforderlich)
    - **Server Members Intent** (empfohlen; erforderlich für Rollen-Allowlists und die Zuordnung von Namen zu IDs)
    - **Presence Intent** (optional; nur für Presence-Updates erforderlich)

  </Step>

  <Step title="Ihren Bot-Token kopieren">
    Scrollen Sie auf der Seite **Bot** wieder nach oben und klicken Sie auf **Reset Token**.

    <Note>
    Trotz des Namens wird dadurch Ihr erster Token erzeugt — es wird nichts „zurückgesetzt“.
    </Note>

    Kopieren Sie den Token und speichern Sie ihn an einem sicheren Ort. Dies ist Ihr **Bot Token**, und Sie werden ihn gleich benötigen.

  </Step>

  <Step title="Eine Einladungs-URL generieren und den Bot zu Ihrem Server hinzufügen">
    Klicken Sie in der Seitenleiste auf **OAuth2**. Sie erstellen eine Einladungs-URL mit den richtigen Berechtigungen, um den Bot zu Ihrem Server hinzuzufügen.

    Scrollen Sie nach unten zu **OAuth2 URL Generator** und aktivieren Sie:

    - `bot`
    - `applications.commands`

    Darunter wird ein Abschnitt **Bot Permissions** angezeigt. Aktivieren Sie mindestens:

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (optional)

    Dies ist die Basismenge für normale Textkanäle. Wenn Sie vorhaben, in Discord-Threads zu posten, einschließlich Forum- oder Medienkanal-Workflows, die einen Thread erstellen oder fortführen, aktivieren Sie außerdem **Send Messages in Threads**.
    Kopieren Sie die unten generierte URL, fügen Sie sie in Ihren Browser ein, wählen Sie Ihren Server aus und klicken Sie auf **Continue**, um die Verbindung herzustellen. Sie sollten Ihren Bot jetzt auf dem Discord-Server sehen.

  </Step>

  <Step title="Developer Mode aktivieren und Ihre IDs erfassen">
    Zurück in der Discord-App müssen Sie den Developer Mode aktivieren, damit Sie interne IDs kopieren können.

    1. Klicken Sie auf **User Settings** (Zahnradsymbol neben Ihrem Avatar) → **Advanced** → schalten Sie **Developer Mode** ein
    2. Klicken Sie mit der rechten Maustaste auf Ihr **Server-Symbol** in der Seitenleiste → **Copy Server ID**
    3. Klicken Sie mit der rechten Maustaste auf Ihren **eigenen Avatar** → **Copy User ID**

    Speichern Sie Ihre **Server ID** und **User ID** zusammen mit Ihrem Bot Token — Sie senden alle drei im nächsten Schritt an OpenClaw.

  </Step>

  <Step title="DMs von Servermitgliedern erlauben">
    Damit die Kopplung funktioniert, muss Discord Ihrem Bot erlauben, Ihnen DMs zu senden. Klicken Sie mit der rechten Maustaste auf Ihr **Server-Symbol** → **Privacy Settings** → schalten Sie **Direct Messages** ein.

    Dadurch können Servermitglieder (einschließlich Bots) Ihnen DMs senden. Lassen Sie diese Option aktiviert, wenn Sie Discord-DMs mit OpenClaw verwenden möchten. Wenn Sie nur Serverkanäle verwenden möchten, können Sie DMs nach der Kopplung deaktivieren.

  </Step>

  <Step title="Ihren Bot-Token sicher setzen (nicht im Chat senden)">
    Ihr Discord-Bot-Token ist ein Geheimnis (wie ein Passwort). Setzen Sie ihn auf dem Rechner, auf dem OpenClaw ausgeführt wird, bevor Sie Ihrem Agenten schreiben.

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

    Wenn OpenClaw bereits als Hintergrunddienst läuft, starten Sie es über die OpenClaw-Mac-App neu oder indem Sie den Prozess `openclaw gateway run` stoppen und erneut starten.

  </Step>

  <Step title="OpenClaw konfigurieren und koppeln">

    <Tabs>
      <Tab title="Ihren Agenten fragen">
        Chatten Sie mit Ihrem OpenClaw-Agenten auf einem vorhandenen Kanal (z. B. Telegram) und teilen Sie ihm dies mit. Wenn Discord Ihr erster Kanal ist, verwenden Sie stattdessen den Tab CLI / config.

        > „Ich habe meinen Discord-Bot-Token bereits in der Konfiguration gesetzt. Bitte schließe die Discord-Einrichtung mit der User ID `<user_id>` und der Server ID `<server_id>` ab.“
      </Tab>
      <Tab title="CLI / config">
        Wenn Sie dateibasierte Konfiguration bevorzugen, setzen Sie Folgendes:

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

        Unverschlüsselte `token`-Werte werden unterstützt. SecretRef-Werte werden ebenfalls für `channels.discord.token` über env/file/exec-Provider unterstützt. Siehe [Secrets Management](/de/gateway/secrets).

      </Tab>
    </Tabs>

  </Step>

  <Step title="Erste DM-Kopplung genehmigen">
    Warten Sie, bis das Gateway läuft, und senden Sie dann Ihrem Bot eine DM in Discord. Er antwortet mit einem Kopplungscode.

    <Tabs>
      <Tab title="Ihren Agenten fragen">
        Senden Sie den Kopplungscode an Ihren Agenten auf Ihrem vorhandenen Kanal:

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

    Sie sollten nun in der Lage sein, per DM mit Ihrem Agenten in Discord zu chatten.

  </Step>
</Steps>

<Note>
Die Token-Auflösung ist kontobewusst. Token-Werte in der Konfiguration haben Vorrang vor dem Env-Fallback. `DISCORD_BOT_TOKEN` wird nur für das Standardkonto verwendet.
Für erweiterte ausgehende Aufrufe (Nachrichtentool/Kanalaktionen) wird ein expliziter aufrufbezogener `token` für diesen Aufruf verwendet. Dies gilt für Sende- und Lese-/Probe-Aktionen (zum Beispiel read/search/fetch/thread/pins/permissions). Kontorichtlinien/Wiederholungseinstellungen stammen weiterhin aus dem ausgewählten Konto im aktiven Laufzeit-Snapshot.
</Note>

## Empfohlen: Einen Server-Arbeitsbereich einrichten

Sobald DMs funktionieren, können Sie Ihren Discord-Server als vollständigen Arbeitsbereich einrichten, in dem jeder Kanal seine eigene Agentensitzung mit eigenem Kontext erhält. Dies wird für private Server empfohlen, auf denen nur Sie und Ihr Bot sind.

<Steps>
  <Step title="Ihren Server zur Server-Allowlist hinzufügen">
    Dadurch kann Ihr Agent in jedem Kanal auf Ihrem Server antworten, nicht nur in DMs.

    <Tabs>
      <Tab title="Ihren Agenten fragen">
        > „Füge meine Discord-Server-ID `<server_id>` zur Server-Allowlist hinzu“
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

  <Step title="Antworten ohne @Erwähnung erlauben">
    Standardmäßig antwortet Ihr Agent in Serverkanälen nur, wenn er mit @ erwähnt wird. Für einen privaten Server möchten Sie wahrscheinlich, dass er auf jede Nachricht antwortet.

    <Tabs>
      <Tab title="Ihren Agenten fragen">
        > „Erlaube meinem Agenten, auf diesem Server zu antworten, ohne mit @ erwähnt werden zu müssen“
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

  <Step title="Speicherverhalten in Serverkanälen planen">
    Standardmäßig wird Langzeitspeicher (`MEMORY.md`) nur in DM-Sitzungen geladen. Serverkanäle laden `MEMORY.md` nicht automatisch.

    <Tabs>
      <Tab title="Ihren Agenten fragen">
        > „Wenn ich in Discord-Kanälen Fragen stelle, verwende memory_search oder memory_get, wenn du Langzeitkontext aus `MEMORY.md` benötigst.“
      </Tab>
      <Tab title="Manuell">
        Wenn Sie gemeinsamen Kontext in jedem Kanal benötigen, legen Sie die stabilen Anweisungen in `AGENTS.md` oder `USER.md` ab (sie werden für jede Sitzung eingefügt). Behalten Sie Langzeitnotizen in `MEMORY.md` und greifen Sie bei Bedarf mit Speichertools darauf zu.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Erstellen Sie jetzt einige Kanäle auf Ihrem Discord-Server und beginnen Sie zu chatten. Ihr Agent kann den Kanalnamen sehen, und jeder Kanal erhält seine eigene isolierte Sitzung — so können Sie `#coding`, `#home`, `#research` oder alles einrichten, was zu Ihrem Workflow passt.

## Laufzeitmodell

- Gateway verwaltet die Discord-Verbindung.
- Das Antwort-Routing ist deterministisch: Eingehende Discord-Nachrichten antworten wieder an Discord.
- Standardmäßig (`session.dmScope=main`) teilen direkte Chats die Hauptsitzung des Agenten (`agent:main:main`).
- Serverkanäle sind isolierte Sitzungsschlüssel (`agent:<agentId>:discord:channel:<channelId>`).
- Gruppen-DMs werden standardmäßig ignoriert (`channels.discord.dm.groupEnabled=false`).
- Native Slash-Befehle laufen in isolierten Befehlssitzungen (`agent:<agentId>:discord:slash:<userId>`), tragen aber weiterhin `CommandTargetSessionKey` zur weitergeleiteten Gesprächssitzung.
- Die rein textbasierte Cron-/Heartbeat-Ankündigungszustellung an Discord verwendet genau einmal die endgültige für den Assistenten sichtbare Antwort.
  Medien- und strukturierte Komponenten-Payloads bleiben mehrnachrichtlich, wenn der Agent mehrere zustellbare Payloads ausgibt.

## Forum-Kanäle

Discord-Forum- und Medienkanäle akzeptieren nur Thread-Beiträge. OpenClaw unterstützt zwei Möglichkeiten, sie zu erstellen:

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

OpenClaw unterstützt Discord-Komponenten-v2-Container für Agentennachrichten. Verwenden Sie das Nachrichtentool mit einer `components`-Payload. Interaktionsergebnisse werden als normale eingehende Nachrichten zurück an den Agenten weitergeleitet und folgen den bestehenden Discord-Einstellungen für `replyToMode`.

Unterstützte Blöcke:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Aktionszeilen erlauben bis zu 5 Schaltflächen oder ein einzelnes Auswahlmenü
- Auswahltypen: `string`, `user`, `role`, `mentionable`, `channel`

Standardmäßig sind Komponenten zur einmaligen Verwendung. Setzen Sie `components.reusable=true`, um Schaltflächen, Auswahlen und Formulare mehrfach verwenden zu können, bis sie ablaufen.

Um einzuschränken, wer auf eine Schaltfläche klicken kann, setzen Sie `allowedUsers` auf dieser Schaltfläche (Discord-Benutzer-IDs, Tags oder `*`). Wenn dies konfiguriert ist, erhalten nicht passende Benutzer eine ephemere Ablehnung.

Die Slash-Befehle `/model` und `/models` öffnen eine interaktive Modellauswahl mit Dropdowns für Provider, Modell und kompatible Laufzeit sowie einem Submit-Schritt. `/models add` ist veraltet und gibt jetzt statt der Modellregistrierung aus dem Chat eine Veraltungsmeldung zurück. Die Antwort der Auswahl ist ephemer, und nur der aufrufende Benutzer kann sie verwenden.

Dateianhänge:

- `file`-Blöcke müssen auf eine Attachment-Referenz zeigen (`attachment://<filename>`)
- Stellen Sie das Attachment über `media`/`path`/`filePath` bereit (einzelne Datei); verwenden Sie `media-gallery` für mehrere Dateien
- Verwenden Sie `filename`, um den Upload-Namen zu überschreiben, wenn er mit der Attachment-Referenz übereinstimmen soll

Modale Formulare:

- Fügen Sie `components.modal` mit bis zu 5 Feldern hinzu
- Feldtypen: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw fügt automatisch eine Auslöseschaltfläche hinzu

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

    Wenn die DM-Richtlinie nicht `open` ist, werden unbekannte Benutzer blockiert (oder im Modus `pairing` zur Kopplung aufgefordert).

    Vorrang bei mehreren Konten:

    - `channels.discord.accounts.default.allowFrom` gilt nur für das Konto `default`.
    - Benannte Konten übernehmen `channels.discord.allowFrom`, wenn ihr eigenes `allowFrom` nicht gesetzt ist.
    - Benannte Konten übernehmen nicht `channels.discord.accounts.default.allowFrom`.

    DM-Zielformat für die Zustellung:

    - `user:<id>`
    - `<@id>`-Erwähnung

    Reine numerische IDs sind mehrdeutig und werden abgelehnt, sofern nicht explizit eine Benutzer-/Kanalzielart angegeben ist.

  </Tab>

  <Tab title="Server-Richtlinie">
    Die Serverbehandlung wird durch `channels.discord.groupPolicy` gesteuert:

    - `open`
    - `allowlist`
    - `disabled`

    Die sichere Baseline, wenn `channels.discord` vorhanden ist, ist `allowlist`.

    Verhalten von `allowlist`:

    - Der Server muss mit `channels.discord.guilds` übereinstimmen (`id` bevorzugt, Slug akzeptiert)
    - optionale Sender-Allowlists: `users` (stabile IDs empfohlen) und `roles` (nur Rollen-IDs); wenn eines von beiden konfiguriert ist, sind Sender erlaubt, wenn sie mit `users` ODER `roles` übereinstimmen
    - direkte Namens-/Tag-Zuordnung ist standardmäßig deaktiviert; aktivieren Sie `channels.discord.dangerouslyAllowNameMatching: true` nur als Kompatibilitätsmodus für den Notfall
    - Namen/Tags werden für `users` unterstützt, aber IDs sind sicherer; `openclaw security audit` warnt, wenn Namens-/Tag-Einträge verwendet werden
    - wenn für einen Server `channels` konfiguriert ist, werden nicht aufgeführte Kanäle abgelehnt
    - wenn ein Server keinen `channels`-Block hat, sind alle Kanäle in diesem per Allowlist zugelassenen Server erlaubt

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

    Wenn Sie nur `DISCORD_BOT_TOKEN` setzen und keinen `channels.discord`-Block erstellen, ist das Laufzeit-Fallback `groupPolicy="allowlist"` (mit einer Warnung in den Logs), selbst wenn `channels.defaults.groupPolicy` `open` ist.

  </Tab>

  <Tab title="Erwähnungen und Gruppen-DMs">
    Servernachrichten sind standardmäßig durch Erwähnungen geschützt.

    Die Erkennung von Erwähnungen umfasst:

    - explizite Bot-Erwähnung
    - konfigurierte Erwähnungsmuster (`agents.list[].groupChat.mentionPatterns`, Fallback `messages.groupChat.mentionPatterns`)
    - implizites Antwort-an-Bot-Verhalten in unterstützten Fällen

    `requireMention` wird pro Server/Kanal konfiguriert (`channels.discord.guilds...`).
    `ignoreOtherMentions` verwirft optional Nachrichten, die einen anderen Benutzer/eine andere Rolle erwähnen, aber nicht den Bot (außer @everyone/@here).

    Gruppen-DMs:

    - Standard: ignoriert (`dm.groupEnabled=false`)
    - optionale Allowlist über `dm.groupChannels` (Kanal-IDs oder Slugs)

  </Tab>
</Tabs>

### Rollenbasiertes Agenten-Routing

Verwenden Sie `bindings[].match.roles`, um Discord-Servermitglieder anhand der Rollen-ID an verschiedene Agenten weiterzuleiten. Rollenbasierte Bindings akzeptieren nur Rollen-IDs und werden nach Peer- oder Parent-Peer-Bindings und vor reinen Server-Bindings ausgewertet. Wenn ein Binding außerdem andere Match-Felder setzt (zum Beispiel `peer` + `guildId` + `roles`), müssen alle konfigurierten Felder übereinstimmen.

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
- Die native Befehlsauthentifizierung verwendet dieselben Discord-Allowlists/-Richtlinien wie die normale Nachrichtenverarbeitung.
- Befehle können in der Discord-Benutzeroberfläche weiterhin für Benutzer sichtbar sein, die nicht autorisiert sind; die Ausführung erzwingt dennoch die OpenClaw-Authentifizierung und gibt „not authorized“ zurück.

Siehe [Slash-Befehle](/de/tools/slash-commands) für Befehlskatalog und Verhalten.

Standard-Slash-Befehlseinstellungen:

- `ephemeral: true`

## Funktionsdetails

<AccordionGroup>
  <Accordion title="Antwort-Tags und native Antworten">
    Discord unterstützt Antwort-Tags in der Agentenausgabe:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Gesteuert durch `channels.discord.replyToMode`:

    - `off` (Standard)
    - `first`
    - `all`
    - `batched`

    Hinweis: `off` deaktiviert implizites Antwort-Threading. Explizite `[[reply_to_*]]`-Tags werden weiterhin beachtet.
    `first` hängt die implizite native Antwortreferenz von Discord immer an die erste ausgehende Discord-Nachricht des Turns an.
    `batched` hängt die implizite native Antwortreferenz von Discord nur an, wenn der
    eingehende Turn ein entprellter Batch aus mehreren Nachrichten war. Das ist nützlich,
    wenn Sie native Antworten hauptsächlich für mehrdeutige, stoßweise Chats möchten und nicht für jeden
    einzelnen Turn mit nur einer Nachricht.

    Nachrichten-IDs werden im Kontext/Verlauf sichtbar gemacht, damit Agenten bestimmte Nachrichten gezielt ansprechen können.

  </Accordion>

  <Accordion title="Live-Stream-Vorschau">
    OpenClaw kann Entwurfsantworten streamen, indem eine temporäre Nachricht gesendet und bearbeitet wird, während Text eintrifft. `channels.discord.streaming` akzeptiert `off` (Standard) | `partial` | `block` | `progress`. `progress` wird in Discord auf `partial` abgebildet; `streamMode` ist ein veralteter Alias und wird automatisch migriert.

    Der Standard bleibt `off`, da Discord-Vorschau-Bearbeitungen schnell an Ratenlimits stoßen, wenn mehrere Bots oder Gateways sich ein Konto teilen.

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
    - `block` sendet Entwurfsblöcke in passender Größe (verwenden Sie `draftChunk`, um Größe und Umbruchpunkte anzupassen, begrenzt auf `textChunkLimit`).
    - Medien-, Fehler- und explizite Antwort-Finals brechen ausstehende Vorschau-Bearbeitungen ab.
    - `streaming.preview.toolProgress` (Standard `true`) steuert, ob Tool-/Fortschrittsaktualisierungen die Vorschaunachricht wiederverwenden.

    Vorschau-Streaming ist nur für Text; Medienantworten fallen auf die normale Zustellung zurück. Wenn `block`-Streaming explizit aktiviert ist, überspringt OpenClaw den Vorschau-Stream, um doppeltes Streaming zu vermeiden.

  </Accordion>

  <Accordion title="Verlauf, Kontext und Thread-Verhalten">
    Server-Verlaufskontext:

    - `channels.discord.historyLimit` Standard `20`
    - Fallback: `messages.groupChat.historyLimit`
    - `0` deaktiviert

    DM-Verlaufssteuerung:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Thread-Verhalten:

    - Discord-Threads werden als Kanalsitzungen geroutet und übernehmen die Konfiguration des Elternkanals, sofern nichts überschrieben wird.
    - `channels.discord.thread.inheritParent` (Standard `false`) ermöglicht bei neuen Auto-Threads das Initialisieren aus dem übergeordneten Transkript. Kontospezifische Überschreibungen liegen unter `channels.discord.accounts.<id>.thread.inheritParent`.
    - Reaktionen des Nachrichtentools können `user:<id>`-DM-Ziele auflösen.
    - `guilds.<guild>.channels.<channel>.requireMention: false` bleibt beim Aktivierungs-Fallback in der Antwortphase erhalten.

    Kanalthemen werden als **nicht vertrauenswürdiger** Kontext eingefügt. Allowlists steuern, wer den Agenten auslösen kann, sind aber keine vollständige Grenze zur Schwärzung von Zusatzkontext.

  </Accordion>

  <Accordion title="Thread-gebundene Sitzungen für Unteragenten">
    Discord kann einen Thread an ein Sitzungsziel binden, sodass Folgemeldungen in diesem Thread weiterhin an dieselbe Sitzung weitergeleitet werden (einschließlich Unteragentensitzungen).

    Befehle:

    - `/focus <target>` bindet den aktuellen/neuen Thread an ein Unteragent-/Sitzungsziel
    - `/unfocus` entfernt die aktuelle Thread-Bindung
    - `/agents` zeigt aktive Läufe und den Bindungsstatus
    - `/session idle <duration|off>` zeigt die automatische Entbindung bei Inaktivität für fokussierte Bindungen an/aktualisiert sie
    - `/session max-age <duration|off>` zeigt das harte maximale Alter für fokussierte Bindungen an/aktualisiert es

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
    - `spawnSubagentSessions` muss `true` sein, um Threads für `sessions_spawn({ thread: true })` automatisch zu erstellen/zu binden.
    - `spawnAcpSessions` muss `true` sein, um Threads für ACP (`/acp spawn ... --thread ...` oder `sessions_spawn({ runtime: "acp", thread: true })`) automatisch zu erstellen/zu binden.
    - Wenn Thread-Bindungen für ein Konto deaktiviert sind, sind `/focus` und verwandte Thread-Bindungsoperationen nicht verfügbar.

    Siehe [Unteragenten](/de/tools/subagents), [ACP Agents](/de/tools/acp-agents) und [Konfigurationsreferenz](/de/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Persistente ACP-Kanalbindungen">
    Für stabile „always-on“-ACP-Arbeitsbereiche konfigurieren Sie ACP-Bindings mit typisierter oberster Ebene, die auf Discord-Unterhaltungen abzielen.

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

    - `/acp spawn codex --bind here` bindet den aktuellen Kanal oder Thread direkt vor Ort und hält zukünftige Nachrichten in derselben ACP-Sitzung. Thread-Nachrichten übernehmen die Bindung des übergeordneten Kanals.
    - In einem gebundenen Kanal oder Thread setzen `/new` und `/reset` dieselbe ACP-Sitzung direkt vor Ort zurück. Temporäre Thread-Bindungen können die Zielauflösung überschreiben, solange sie aktiv sind.
    - `spawnAcpSessions` ist nur erforderlich, wenn OpenClaw einen untergeordneten Thread über `--thread auto|here` erstellen/binden muss.

    Siehe [ACP Agents](/de/tools/acp-agents) für Details zum Bindungsverhalten.

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

    Reihenfolge der Auflösung:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - Fallback auf das Emoji der Agentenidentität (`agents.list[].identity.emoji`, sonst "👀")

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
    Leiten Sie Discord-Gateway-WebSocket-Datenverkehr und REST-Lookups beim Start (Anwendungs-ID + Allowlist-Auflösung) über einen HTTP(S)-Proxy mit `channels.discord.proxy`.

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    Kontospezifische Überschreibung:

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
    Aktivieren Sie die PluralKit-Auflösung, um weitergeleitete Nachrichten der Systemmitgliedsidentität zuzuordnen:

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
    - Anzeigenamen von Mitgliedern werden nur dann nach Name/Slug abgeglichen, wenn `channels.discord.dangerouslyAllowNameMatching: true`
    - Lookups verwenden die ursprüngliche Nachrichten-ID und sind zeitfensterbegrenzt
    - wenn der Lookup fehlschlägt, werden weitergeleitete Nachrichten als Bot-Nachrichten behandelt und verworfen, es sei denn, `allowBots=true`

  </Accordion>

  <Accordion title="Presence-Konfiguration">
    Presence-Updates werden angewendet, wenn Sie ein Status- oder Aktivitätsfeld setzen oder wenn Sie automatische Presence aktivieren.

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

    Beispiel für automatische Presence (Signal für Laufzeitintegrität):

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

    Automatische Presence bildet die Laufzeitverfügbarkeit auf den Discord-Status ab: healthy => online, degraded oder unknown => idle, exhausted oder unavailable => dnd. Optionale Textüberschreibungen:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (unterstützt den Platzhalter `{reason}`)

  </Accordion>

  <Accordion title="Freigaben in Discord">
    Discord unterstützt schaltflächenbasierte Freigabeverarbeitung in DMs und kann optional Freigabeaufforderungen im Ursprungskanal veröffentlichen.

    Konfigurationspfad:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (optional; greift nach Möglichkeit auf `commands.ownerAllowFrom` zurück)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, Standard: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord aktiviert native Exec-Freigaben automatisch, wenn `enabled` nicht gesetzt oder `"auto"` ist und mindestens ein Freigeber aufgelöst werden kann, entweder aus `execApprovals.approvers` oder aus `commands.ownerAllowFrom`. Discord leitet Exec-Freigeber nicht aus Kanal-`allowFrom`, veraltetem `dm.allowFrom` oder `defaultTo` für Direktnachrichten ab. Setzen Sie `enabled: false`, um Discord explizit als nativen Freigabe-Client zu deaktivieren.

    Wenn `target` `channel` oder `both` ist, ist die Freigabeaufforderung im Kanal sichtbar. Nur aufgelöste Freigeber können die Schaltflächen verwenden; andere Benutzer erhalten eine ephemere Ablehnung. Freigabeaufforderungen enthalten den Befehlstext, aktivieren Sie daher die Zustellung an Kanäle nur in vertrauenswürdigen Kanälen. Wenn die Kanal-ID nicht aus dem Sitzungsschlüssel abgeleitet werden kann, greift OpenClaw auf die Zustellung per DM zurück.

    Discord rendert auch die gemeinsamen Freigabeschaltflächen, die von anderen Chat-Kanälen verwendet werden. Der native Discord-Adapter ergänzt hauptsächlich das DM-Routing für Freigeber und das Fanout in Kanäle.
    Wenn diese Schaltflächen vorhanden sind, sind sie die primäre Freigabe-UX; OpenClaw
    sollte einen manuellen `/approve`-Befehl nur dann einfügen, wenn das Tool-Ergebnis besagt,
    dass Chat-Freigaben nicht verfügbar sind oder die manuelle Freigabe der einzige Weg ist.

    Gateway-Authentifizierung und Freigabeauflösung folgen dem gemeinsamen Gateway-Client-Vertrag (`plugin:`-IDs werden über `plugin.approval.resolve` aufgelöst, andere IDs über `exec.approval.resolve`). Freigaben laufen standardmäßig nach 30 Minuten ab.

    Siehe [Exec approvals](/de/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Tools und Aktions-Gates

Discord-Nachrichtenaktionen umfassen Nachrichtenübermittlung, Kanaladministration, Moderation, Presence- und Metadatenaktionen.

Kernbeispiele:

- Nachrichtenübermittlung: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- Reaktionen: `react`, `reactions`, `emojiList`
- Moderation: `timeout`, `kick`, `ban`
- Presence: `setPresence`

Die Aktion `event-create` akzeptiert einen optionalen Parameter `image` (URL oder lokaler Dateipfad), um das Titelbild des geplanten Ereignisses festzulegen.

Aktions-Gates befinden sich unter `channels.discord.actions.*`.

Standardverhalten der Gates:

| Aktionsgruppe                                                                                                                                                            | Standard |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | aktiviert |
| roles                                                                                                                                                                    | deaktiviert |
| moderation                                                                                                                                                               | deaktiviert |
| presence                                                                                                                                                                 | deaktiviert |

## Components v2 UI

OpenClaw verwendet Discord components v2 für Exec-Freigaben und kontextübergreifende Markierungen. Discord-Nachrichtenaktionen können auch `components` für benutzerdefinierte UI akzeptieren (fortgeschritten; erfordert das Erstellen einer Komponenten-Payload über das Discord-Tool), während veraltete `embeds` weiterhin verfügbar bleiben, aber nicht empfohlen werden.

- `channels.discord.ui.components.accentColor` setzt die Akzentfarbe, die von Discord-Komponentencontainern verwendet wird (Hex).
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

## Sprache

Discord hat zwei verschiedene Sprachoberflächen: Echtzeit-**Sprachkanäle** (fortlaufende Unterhaltungen) und **Anhänge mit Sprachnachrichten** (das Format mit Wellenformvorschau). Das Gateway unterstützt beides.

### Sprachkanäle

Checkliste für die Einrichtung:

1. Aktivieren Sie Message Content Intent im Discord Developer Portal.
2. Aktivieren Sie Server Members Intent, wenn Rollen-/Benutzer-Allowlists verwendet werden.
3. Laden Sie den Bot mit den Scopes `bot` und `applications.commands` ein.
4. Gewähren Sie Connect, Speak, Send Messages und Read Message History im Ziel-Sprachkanal.
5. Aktivieren Sie native Befehle (`commands.native` oder `channels.discord.commands.native`).
6. Konfigurieren Sie `channels.discord.voice`.

Verwenden Sie `/vc join|leave|status`, um Sitzungen zu steuern. Der Befehl verwendet den Standard-Agenten des Kontos und folgt denselben Allowlist- und Gruppenrichtlinien wie andere Discord-Befehle.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

Beispiel für automatischen Beitritt:

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
- `voice.model` überschreibt nur das LLM, das für Antworten in Discord-Sprachkanälen verwendet wird. Lassen Sie es unset, um das weitergeleitete Agentenmodell zu übernehmen.
- STT verwendet `tools.media.audio`; `voice.model` beeinflusst die Transkription nicht.
- Sprachtranskriptions-Turns leiten den Eigentümerstatus aus Discord-`allowFrom` (oder `dm.allowFrom`) ab; Sprecher ohne Eigentümerstatus können nicht auf Tools zugreifen, die nur für Eigentümer bestimmt sind (zum Beispiel `gateway` und `cron`).
- Sprache ist standardmäßig aktiviert; setzen Sie `channels.discord.voice.enabled=false`, um sie zu deaktivieren.
- `voice.daveEncryption` und `voice.decryptionFailureTolerance` werden an die Join-Optionen von `@discordjs/voice` durchgereicht.
- Die Standardwerte von `@discordjs/voice` sind `daveEncryption=true` und `decryptionFailureTolerance=24`, wenn sie nicht gesetzt sind.
- OpenClaw überwacht auch Entschlüsselungsfehler beim Empfang und stellt sich automatisch wieder her, indem es den Sprachkanal nach wiederholten Fehlern in einem kurzen Zeitfenster verlässt und erneut betritt.
- Wenn in den Empfangslogs nach einem Update wiederholt `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` angezeigt wird, erfassen Sie einen Abhängigkeitsbericht und Logs. Die gebündelte `@discordjs/voice`-Linie enthält den Upstream-Padding-Fix aus discord.js PR #11449, der discord.js-Issue #11419 geschlossen hat.

Pipeline für Sprachkanäle:

- Discord-PCM-Erfassung wird in eine temporäre WAV-Datei umgewandelt.
- `tools.media.audio` verarbeitet STT, zum Beispiel `openai/gpt-4o-mini-transcribe`.
- Das Transkript wird durch normalen Discord-Ingress und normales Routing gesendet.
- `voice.model` überschreibt, wenn gesetzt, nur das Antwort-LLM für diesen Sprachkanal-Turn.
- `voice.tts` wird über `messages.tts` zusammengeführt; das resultierende Audio wird im beigetretenen Kanal abgespielt.

Zugangsdaten werden pro Komponente aufgelöst: LLM-Routen-Authentifizierung für `voice.model`, STT-Authentifizierung für `tools.media.audio` und TTS-Authentifizierung für `messages.tts`/`voice.tts`.

### Sprachnachrichten

Discord-Sprachnachrichten zeigen eine Wellenformvorschau an und erfordern OGG/Opus-Audio. OpenClaw erzeugt die Wellenform automatisch, benötigt dafür aber `ffmpeg` und `ffprobe` auf dem Gateway-Host, um die Dateien zu prüfen und zu konvertieren.

- Geben Sie einen **lokalen Dateipfad** an (URLs werden abgelehnt).
- Lassen Sie Textinhalt weg (Discord lehnt Text + Sprachnachricht in derselben Payload ab).
- Jedes Audioformat wird akzeptiert; OpenClaw konvertiert bei Bedarf zu OGG/Opus.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Nicht erlaubte Intents verwendet oder der Bot sieht keine Servernachrichten">

    - Message Content Intent aktivieren
    - Server Members Intent aktivieren, wenn Sie von der Auflösung von Benutzer-/Mitgliedsdaten abhängen
    - Gateway nach dem Ändern von Intents neu starten

  </Accordion>

  <Accordion title="Servernachrichten werden unerwartet blockiert">

    - `groupPolicy` überprüfen
    - Server-Allowlist unter `channels.discord.guilds` überprüfen
    - wenn eine `channels`-Zuordnung für den Server existiert, sind nur aufgeführte Kanäle erlaubt
    - Verhalten von `requireMention` und Erwähnungsmuster überprüfen

    Nützliche Prüfungen:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention ist false, aber weiterhin blockiert">
    Häufige Ursachen:

    - `groupPolicy="allowlist"` ohne passende Server-/Kanal-Allowlist
    - `requireMention` an der falschen Stelle konfiguriert (muss unter `channels.discord.guilds` oder unter dem Kanaleintrag stehen)
    - Absender durch die `users`-Allowlist des Servers/Kanals blockiert

  </Accordion>

  <Accordion title="Lang laufende Handler laufen in ein Timeout oder erzeugen doppelte Antworten">

    Typische Logs:

    - `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
    - `Slow listener detected ...`
    - `discord inbound worker timed out after ...`

    Steuerung für das Listener-Budget:

    - Einzelkonto: `channels.discord.eventQueue.listenerTimeout`
    - Mehrere Konten: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

    Steuerung für das Worker-Run-Timeout:

    - Einzelkonto: `channels.discord.inboundWorker.runTimeoutMs`
    - Mehrere Konten: `channels.discord.accounts.<accountId>.inboundWorker.runTimeoutMs`
    - Standard: `1800000` (30 Minuten); setzen Sie `0`, um es zu deaktivieren

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

    Verwenden Sie `eventQueue.listenerTimeout` für langsame Listener-Einrichtung und `inboundWorker.runTimeoutMs`
    nur dann, wenn Sie ein separates Sicherheitsventil für in die Warteschlange gestellte Agenten-Turns möchten.

  </Accordion>

  <Accordion title="Abweichungen bei der Berechtigungsprüfung">
    Berechtigungsprüfungen von `channels status --probe` funktionieren nur für numerische Kanal-IDs.

    Wenn Sie Slug-Schlüssel verwenden, kann das Laufzeit-Matching weiterhin funktionieren, aber die Probe kann Berechtigungen nicht vollständig verifizieren.

  </Accordion>

  <Accordion title="DM- und Kopplungsprobleme">

    - DM deaktiviert: `channels.discord.dm.enabled=false`
    - DM-Richtlinie deaktiviert: `channels.discord.dmPolicy="disabled"` (veraltet: `channels.discord.dm.policy`)
    - wartet im Modus `pairing` auf Genehmigung der Kopplung

  </Accordion>

  <Accordion title="Bot-zu-Bot-Schleifen">
    Standardmäßig werden von Bots verfasste Nachrichten ignoriert.

    Wenn Sie `channels.discord.allowBots=true` setzen, verwenden Sie strenge Erwähnungs- und Allowlist-Regeln, um Schleifenverhalten zu vermeiden.
    Bevorzugen Sie `channels.discord.allowBots="mentions"`, um nur Bot-Nachrichten zu akzeptieren, die den Bot erwähnen.

  </Accordion>

  <Accordion title="Voice-STT fällt mit DecryptionFailed(...) aus">

    - halten Sie OpenClaw aktuell (`openclaw update`), damit die Wiederherstellungslogik für den Empfang von Discord-Voice vorhanden ist
    - bestätigen Sie `channels.discord.voice.daveEncryption=true` (Standard)
    - beginnen Sie mit `channels.discord.voice.decryptionFailureTolerance=24` (Upstream-Standard) und passen Sie es nur bei Bedarf an
    - beobachten Sie die Logs auf:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - wenn Fehler nach dem automatischen erneuten Beitritt weiterhin auftreten, sammeln Sie Logs und vergleichen Sie sie mit dem Upstream-Verlauf zu DAVE-Empfang in [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) und [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Konfigurationsreferenz

Primäre Referenz: [Konfigurationsreferenz - Discord](/de/gateway/config-channels#discord).

<Accordion title="Signalstarke Discord-Felder">

- Start/Authentifizierung: `enabled`, `token`, `accounts.*`, `allowBots`
- Richtlinie: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- Befehl: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- Ereigniswarteschlange: `eventQueue.listenerTimeout` (Listener-Budget), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Inbound-Worker: `inboundWorker.runTimeoutMs`
- Antwort/Verlauf: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- Zustellung: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- Streaming: `streaming` (veralteter Alias: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- Medien/Wiederholung: `mediaMaxMb` (begrenzt ausgehende Discord-Uploads, Standard `100MB`), `retry`
- Aktionen: `actions.*`
- Presence: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- Funktionen: `threadBindings`, oberstes `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `Heartbeat`, `responsePrefix`

</Accordion>

## Sicherheit und Betrieb

- Behandeln Sie Bot-Tokens als Geheimnisse (`DISCORD_BOT_TOKEN` wird in überwachten Umgebungen bevorzugt).
- Gewähren Sie nur die minimal erforderlichen Discord-Berechtigungen.
- Wenn die Bereitstellung/der Zustand von Befehlen veraltet ist, starten Sie das Gateway neu und prüfen Sie erneut mit `openclaw channels status --probe`.

## Verwandt

<CardGroup cols={2}>
  <Card title="Kopplung" icon="link" href="/de/channels/pairing">
    Koppeln Sie einen Discord-Benutzer mit dem Gateway.
  </Card>
  <Card title="Gruppen" icon="users" href="/de/channels/groups">
    Verhalten von Gruppenchats und Allowlists.
  </Card>
  <Card title="Kanalrouting" icon="route" href="/de/channels/channel-routing">
    Eingehende Nachrichten an Agenten weiterleiten.
  </Card>
  <Card title="Sicherheit" icon="shield" href="/de/gateway/security">
    Bedrohungsmodell und Härtung.
  </Card>
  <Card title="Multi-Agenten-Routing" icon="sitemap" href="/de/concepts/multi-agent">
    Server und Kanäle Agenten zuordnen.
  </Card>
  <Card title="Slash-Befehle" icon="terminal" href="/de/tools/slash-commands">
    Verhalten nativer Befehle.
  </Card>
</CardGroup>
