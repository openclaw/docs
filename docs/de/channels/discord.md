---
read_when:
    - Arbeiten an Discord-Kanalfunktionen
summary: Status des Discord-Bot-Supports, Funktionen und Konfiguration
title: Discord
x-i18n:
    generated_at: "2026-04-23T06:25:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1a500da6a2aa080f1c38efd3510bef000abc61059fdc0ff3cb14a62ad292cf9a
    source_path: channels/discord.md
    workflow: 15
---

# Discord (Bot API)

Status: bereit für DMs und Serverkanäle über das offizielle Discord-Gateway.

<CardGroup cols={3}>
  <Card title="Kopplung" icon="link" href="/de/channels/pairing">
    Discord-DMs verwenden standardmäßig den Kopplungsmodus.
  </Card>
  <Card title="Slash-Befehle" icon="terminal" href="/de/tools/slash-commands">
    Natives Befehlsverhalten und Befehlskatalog.
  </Card>
  <Card title="Fehlerbehebung bei Kanälen" icon="wrench" href="/de/channels/troubleshooting">
    Kanalübergreifende Diagnose- und Reparaturabläufe.
  </Card>
</CardGroup>

## Schnelleinrichtung

Sie müssen eine neue Anwendung mit einem Bot erstellen, den Bot zu Ihrem Server hinzufügen und ihn mit OpenClaw koppeln. Wir empfehlen, Ihren Bot zu Ihrem eigenen privaten Server hinzuzufügen. Falls Sie noch keinen haben, [erstellen Sie zuerst einen](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (wählen Sie **Create My Own > For me and my friends**).

<Steps>
  <Step title="Eine Discord-Anwendung und einen Bot erstellen">
    Gehen Sie zum [Discord Developer Portal](https://discord.com/developers/applications) und klicken Sie auf **New Application**. Geben Sie ihr einen Namen wie „OpenClaw“.

    Klicken Sie in der Seitenleiste auf **Bot**. Setzen Sie den **Username** auf den Namen, den Sie Ihrem OpenClaw-Agenten geben.

  </Step>

  <Step title="Privilegierte Intents aktivieren">
    Bleiben Sie auf der Seite **Bot**, scrollen Sie nach unten zu **Privileged Gateway Intents** und aktivieren Sie:

    - **Message Content Intent** (erforderlich)
    - **Server Members Intent** (empfohlen; erforderlich für Rollen-Allowlists und Namens-zu-ID-Abgleich)
    - **Presence Intent** (optional; nur für Präsenzaktualisierungen erforderlich)

  </Step>

  <Step title="Ihren Bot-Token kopieren">
    Scrollen Sie auf der Seite **Bot** wieder nach oben und klicken Sie auf **Reset Token**.

    <Note>
    Trotz des Namens wird dadurch Ihr erster Token erzeugt — es wird nichts „zurückgesetzt“.
    </Note>

    Kopieren Sie den Token und speichern Sie ihn irgendwo. Das ist Ihr **Bot Token** und Sie werden ihn gleich benötigen.

  </Step>

  <Step title="Eine Einladungs-URL erzeugen und den Bot zu Ihrem Server hinzufügen">
    Klicken Sie in der Seitenleiste auf **OAuth2**. Sie erzeugen eine Einladungs-URL mit den richtigen Berechtigungen, um den Bot zu Ihrem Server hinzuzufügen.

    Scrollen Sie nach unten zu **OAuth2 URL Generator** und aktivieren Sie:

    - `bot`
    - `applications.commands`

    Darunter erscheint ein Abschnitt **Bot Permissions**. Aktivieren Sie mindestens:

    **General Permissions**
      - Kanäle anzeigen
    **Text Permissions**
      - Nachrichten senden
      - Nachrichtenverlauf lesen
      - Links einbetten
      - Dateien anhängen
      - Reaktionen hinzufügen (optional)

    Dies ist der Basissatz für normale Textkanäle. Wenn Sie vorhaben, in Discord-Threads zu posten, einschließlich Forum- oder Medienkanal-Abläufen, die einen Thread erstellen oder fortsetzen, aktivieren Sie zusätzlich **Send Messages in Threads**.
    Kopieren Sie die erzeugte URL unten, fügen Sie sie in Ihren Browser ein, wählen Sie Ihren Server aus und klicken Sie auf **Continue**, um die Verbindung herzustellen. Sie sollten Ihren Bot jetzt im Discord-Server sehen.

  </Step>

  <Step title="Developer Mode aktivieren und Ihre IDs sammeln">
    Zurück in der Discord-App müssen Sie den Developer Mode aktivieren, damit Sie interne IDs kopieren können.

    1. Klicken Sie auf **User Settings** (Zahnradsymbol neben Ihrem Avatar) → **Advanced** → aktivieren Sie **Developer Mode**
    2. Klicken Sie mit der rechten Maustaste auf Ihr **Serversymbol** in der Seitenleiste → **Copy Server ID**
    3. Klicken Sie mit der rechten Maustaste auf Ihren **eigenen Avatar** → **Copy User ID**

    Speichern Sie Ihre **Server ID** und **User ID** zusammen mit Ihrem Bot Token — Sie senden alle drei im nächsten Schritt an OpenClaw.

  </Step>

  <Step title="DMs von Servermitgliedern erlauben">
    Damit die Kopplung funktioniert, muss Discord Ihrem Bot erlauben, Ihnen eine DM zu senden. Klicken Sie mit der rechten Maustaste auf Ihr **Serversymbol** → **Privacy Settings** → aktivieren Sie **Direct Messages**.

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

    Wenn OpenClaw bereits als Hintergrunddienst läuft, starten Sie es über die OpenClaw-Mac-App oder durch Stoppen und erneutes Starten des Prozesses `openclaw gateway run` neu.

  </Step>

  <Step title="OpenClaw konfigurieren und koppeln">

    <Tabs>
      <Tab title="Ihren Agenten fragen">
        Chatten Sie mit Ihrem OpenClaw-Agenten auf einem vorhandenen Kanal (z. B. Telegram) und teilen Sie es ihm mit. Wenn Discord Ihr erster Kanal ist, verwenden Sie stattdessen die Registerkarte CLI / config.

        > „Ich habe meinen Discord-Bot-Token bereits in der Konfiguration gesetzt. Bitte schließen Sie die Discord-Einrichtung mit der User ID `<user_id>` und der Server ID `<server_id>` ab.“
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

        Klartext-`token`-Werte werden unterstützt. SecretRef-Werte werden ebenfalls für `channels.discord.token` über env/file/exec-Provider unterstützt. Siehe [Secrets Management](/de/gateway/secrets).

      </Tab>
    </Tabs>

  </Step>

  <Step title="Erste DM-Kopplung genehmigen">
    Warten Sie, bis das Gateway läuft, und senden Sie dann Ihrem Bot in Discord eine DM. Er antwortet mit einem Kopplungscode.

    <Tabs>
      <Tab title="Ihren Agenten fragen">
        Senden Sie den Kopplungscode an Ihren Agenten auf Ihrem bestehenden Kanal:

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

    Sie sollten jetzt per DM in Discord mit Ihrem Agenten chatten können.

  </Step>
</Steps>

<Note>
Die Token-Auflösung ist kontobewusst. Token-Werte aus der Konfiguration haben Vorrang vor dem Env-Fallback. `DISCORD_BOT_TOKEN` wird nur für das Standardkonto verwendet.
Für erweiterte ausgehende Aufrufe (message-Tool/Kanalaktionen) wird ein expliziter `token` pro Aufruf für diesen Aufruf verwendet. Dies gilt für Sende- und Lese-/Probe-Aktionen (zum Beispiel read/search/fetch/thread/pins/permissions). Konto-Richtlinien/Wiederholungseinstellungen kommen weiterhin aus dem ausgewählten Konto im aktiven Laufzeit-Snapshot.
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

  <Step title="Antworten ohne @mention erlauben">
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

  <Step title="Speicher in Serverkanälen einplanen">
    Standardmäßig wird Langzeitspeicher (`MEMORY.md`) nur in DM-Sitzungen geladen. In Serverkanälen wird `MEMORY.md` nicht automatisch geladen.

    <Tabs>
      <Tab title="Ihren Agenten fragen">
        > „Wenn ich in Discord-Kanälen Fragen stelle, verwende `memory_search` oder `memory_get`, wenn du Langzeitkontext aus `MEMORY.md` brauchst.“
      </Tab>
      <Tab title="Manuell">
        Wenn Sie in jedem Kanal gemeinsam genutzten Kontext benötigen, legen Sie die stabilen Anweisungen in `AGENTS.md` oder `USER.md` ab (sie werden in jede Sitzung injiziert). Bewahren Sie Langzeitnotizen in `MEMORY.md` auf und greifen Sie bei Bedarf mit memory-Tools darauf zu.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Erstellen Sie jetzt einige Kanäle auf Ihrem Discord-Server und beginnen Sie zu chatten. Ihr Agent kann den Kanalnamen sehen, und jeder Kanal erhält seine eigene isolierte Sitzung — so können Sie `#coding`, `#home`, `#research` oder was auch immer zu Ihrem Arbeitsablauf passt einrichten.

## Laufzeitmodell

- Gateway besitzt die Discord-Verbindung.
- Das Routing von Antworten ist deterministisch: Eingehende Discord-Antworten gehen zurück an Discord.
- Standardmäßig (`session.dmScope=main`) teilen direkte Chats die Hauptsitzung des Agenten (`agent:main:main`).
- Serverkanäle sind isolierte Sitzungsschlüssel (`agent:<agentId>:discord:channel:<channelId>`).
- Gruppen-DMs werden standardmäßig ignoriert (`channels.discord.dm.groupEnabled=false`).
- Native Slash-Befehle laufen in isolierten Befehlssitzungen (`agent:<agentId>:discord:slash:<userId>`), während weiterhin `CommandTargetSessionKey` zur gerouteten Konversationssitzung mitgeführt wird.

## Forumkanäle

Discord-Forum- und Medienkanäle akzeptieren nur Thread-Beiträge. OpenClaw unterstützt zwei Möglichkeiten, sie zu erstellen:

- Senden Sie eine Nachricht an das Forum-Parent (`channel:<forumId>`), um automatisch einen Thread zu erstellen. Der Thread-Titel verwendet die erste nicht leere Zeile Ihrer Nachricht.
- Verwenden Sie `openclaw message thread create`, um einen Thread direkt zu erstellen. Übergeben Sie für Forumkanäle nicht `--message-id`.

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

OpenClaw unterstützt Discord-Komponenten-v2-Container für Agentennachrichten. Verwenden Sie das message-Tool mit einer `components`-Payload. Interaktionsergebnisse werden als normale eingehende Nachrichten zurück an den Agenten geleitet und folgen den bestehenden Discord-Einstellungen für `replyToMode`.

Unterstützte Blöcke:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Aktionszeilen erlauben bis zu 5 Schaltflächen oder ein einzelnes Auswahlmenü
- Auswahltypen: `string`, `user`, `role`, `mentionable`, `channel`

Standardmäßig sind Komponenten nur einmal verwendbar. Setzen Sie `components.reusable=true`, um zuzulassen, dass Schaltflächen, Auswahlen und Formulare mehrfach verwendet werden können, bis sie ablaufen.

Um einzuschränken, wer auf eine Schaltfläche klicken darf, setzen Sie `allowedUsers` auf dieser Schaltfläche (Discord-Benutzer-IDs, Tags oder `*`). Wenn dies konfiguriert ist, erhalten nicht übereinstimmende Benutzer eine ephemere Ablehnung.

Die Slash-Befehle `/model` und `/models` öffnen einen interaktiven Modellauswähler mit Dropdowns für Provider und Modell plus einem Submit-Schritt. Sofern `commands.modelsWrite=false` nicht gesetzt ist, unterstützt `/models add` auch das Hinzufügen eines neuen Provider-/Modelleintrags aus dem Chat, und neu hinzugefügte Modelle werden ohne Neustart des Gateway angezeigt. Die Antwort des Auswählers ist ephemer, und nur der aufrufende Benutzer kann sie verwenden.

Dateianhänge:

- `file`-Blöcke müssen auf eine Anhangsreferenz zeigen (`attachment://<filename>`)
- Stellen Sie den Anhang über `media`/`path`/`filePath` bereit (einzelne Datei); verwenden Sie `media-gallery` für mehrere Dateien
- Verwenden Sie `filename`, um den Upload-Namen zu überschreiben, wenn er der Anhangsreferenz entsprechen soll

Modalformulare:

- Fügen Sie `components.modal` mit bis zu 5 Feldern hinzu
- Feldtypen: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw fügt automatisch eine Trigger-Schaltfläche hinzu

Beispiel:

```json5
{
  channel: "discord",
  action: "send",
  to: "channel:123456789012345678",
  message: "Optionaler Fallback-Text",
  components: {
    reusable: true,
    text: "Wählen Sie einen Pfad",
    blocks: [
      {
        type: "actions",
        buttons: [
          {
            label: "Genehmigen",
            style: "success",
            allowedUsers: ["123456789012345678"],
          },
          { label: "Ablehnen", style: "danger" },
        ],
      },
      {
        type: "actions",
        select: {
          type: "string",
          placeholder: "Wählen Sie eine Option",
          options: [
            { label: "Option A", value: "a" },
            { label: "Option B", value: "b" },
          ],
        },
      },
    ],
    modal: {
      title: "Details",
      triggerLabel: "Formular öffnen",
      fields: [
        { type: "text", label: "Anfragende Person" },
        {
          type: "select",
          label: "Priorität",
          options: [
            { label: "Niedrig", value: "low" },
            { label: "Hoch", value: "high" },
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

    DM-Zielformat für die Zustellung:

    - `user:<id>`
    - `<@id>`-Erwähnung

    Reine numerische IDs sind mehrdeutig und werden abgelehnt, sofern kein expliziter Benutzer-/Kanal-Zieltyp angegeben wird.

  </Tab>

  <Tab title="Serverrichtlinie">
    Die Behandlung von Servern wird durch `channels.discord.groupPolicy` gesteuert:

    - `open`
    - `allowlist`
    - `disabled`

    Die sichere Basislinie, wenn `channels.discord` vorhanden ist, ist `allowlist`.

    Verhalten von `allowlist`:

    - Der Server muss mit `channels.discord.guilds` übereinstimmen (`id` bevorzugt, Slug akzeptiert)
    - optionale Sender-Allowlists: `users` (stabile IDs empfohlen) und `roles` (nur Rollen-IDs); wenn eines von beiden konfiguriert ist, sind Sender erlaubt, wenn sie mit `users` ODER `roles` übereinstimmen
    - direktes Namens-/Tag-Matching ist standardmäßig deaktiviert; aktivieren Sie `channels.discord.dangerouslyAllowNameMatching: true` nur als Kompatibilitätsmodus für Notfälle
    - Namen/Tags werden für `users` unterstützt, aber IDs sind sicherer; `openclaw security audit` warnt, wenn Namens-/Tag-Einträge verwendet werden
    - wenn für einen Server `channels` konfiguriert ist, werden nicht aufgeführte Kanäle verweigert
    - wenn ein Server keinen `channels`-Block hat, sind alle Kanäle in diesem allowlisteten Server erlaubt

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

    Wenn Sie nur `DISCORD_BOT_TOKEN` setzen und keinen `channels.discord`-Block erstellen, ist der Laufzeit-Fallback `groupPolicy="allowlist"` (mit einer Warnung in den Logs), auch wenn `channels.defaults.groupPolicy` auf `open` gesetzt ist.

  </Tab>

  <Tab title="Erwähnungen und Gruppen-DMs">
    Nachrichten in Servern sind standardmäßig durch Erwähnungen geschützt.

    Die Erkennung von Erwähnungen umfasst:

    - explizite Bot-Erwähnung
    - konfigurierte Erwähnungsmuster (`agents.list[].groupChat.mentionPatterns`, Fallback `messages.groupChat.mentionPatterns`)
    - implizites Antwort-an-Bot-Verhalten in unterstützten Fällen

    `requireMention` wird pro Server/Kanal konfiguriert (`channels.discord.guilds...`).
    `ignoreOtherMentions` verwirft optional Nachrichten, die einen anderen Benutzer/eine andere Rolle erwähnen, aber nicht den Bot (ausgenommen @everyone/@here).

    Gruppen-DMs:

    - Standard: ignoriert (`dm.groupEnabled=false`)
    - optionale Allowlist über `dm.groupChannels` (Kanal-IDs oder Slugs)

  </Tab>
</Tabs>

### Rollenbasiertes Agent-Routing

Verwenden Sie `bindings[].match.roles`, um Discord-Servermitglieder anhand der Rollen-ID an unterschiedliche Agenten weiterzuleiten. Rollenbasierte Bindings akzeptieren nur Rollen-IDs und werden nach Peer- oder Parent-Peer-Bindings und vor rein serverbezogenen Bindings ausgewertet. Wenn ein Binding zusätzlich andere Match-Felder setzt (zum Beispiel `peer` + `guildId` + `roles`), müssen alle konfigurierten Felder übereinstimmen.

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

    Presence Intent ist optional und nur erforderlich, wenn Sie Präsenzaktualisierungen empfangen möchten. Das Setzen der Bot-Präsenz (`setPresence`) erfordert nicht, dass Präsenzaktualisierungen für Mitglieder aktiviert werden.

  </Accordion>

  <Accordion title="OAuth-Scopes und Basisberechtigungen">
    OAuth-URL-Generator:

    - Scopes: `bot`, `applications.commands`

    Typische Basisberechtigungen:

    **General Permissions**
      - Kanäle anzeigen
    **Text Permissions**
      - Nachrichten senden
      - Nachrichtenverlauf lesen
      - Links einbetten
      - Dateien anhängen
      - Reaktionen hinzufügen (optional)

    Dies ist der Basissatz für normale Textkanäle. Wenn Sie vorhaben, in Discord-Threads zu posten, einschließlich Forum- oder Medienkanal-Abläufen, die einen Thread erstellen oder fortsetzen, aktivieren Sie zusätzlich **Send Messages in Threads**.
    Vermeiden Sie `Administrator`, sofern es nicht ausdrücklich erforderlich ist.

  </Accordion>

  <Accordion title="IDs kopieren">
    Aktivieren Sie den Discord Developer Mode und kopieren Sie dann:

    - Server-ID
    - Kanal-ID
    - Benutzer-ID

    Bevorzugen Sie numerische IDs in der OpenClaw-Konfiguration für zuverlässige Audits und Prüfungen.

  </Accordion>
</AccordionGroup>

## Native Befehle und Befehlsauthentifizierung

- `commands.native` hat standardmäßig den Wert `"auto"` und ist für Discord aktiviert.
- Kanalbezogenes Override: `channels.discord.commands.native`.
- `commands.native=false` entfernt explizit zuvor registrierte native Discord-Befehle.
- Die Authentifizierung nativer Befehle verwendet dieselben Discord-Allowlists/-Richtlinien wie die normale Nachrichtenverarbeitung.
- Befehle können in der Discord-Benutzeroberfläche weiterhin für Benutzer sichtbar sein, die nicht autorisiert sind; bei der Ausführung wird die OpenClaw-Authentifizierung dennoch erzwungen und „not authorized“ zurückgegeben.

Siehe [Slash-Befehle](/de/tools/slash-commands) für Befehlskatalog und Verhalten.

Standardmäßige Einstellungen für Slash-Befehle:

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

    Hinweis: `off` deaktiviert implizites Antwort-Threading. Explizite `[[reply_to_*]]`-Tags werden weiterhin berücksichtigt.
    `first` hängt immer die implizite native Antwortreferenz an die erste ausgehende Discord-Nachricht des Turns an.
    `batched` hängt die implizite native Antwortreferenz von Discord nur an, wenn der
    eingehende Turn ein entprellter Stapel mehrerer Nachrichten war. Dies ist nützlich,
    wenn Sie native Antworten hauptsächlich für mehrdeutige, burstartige Chats möchten, nicht für jeden
    einzelnen Nachrichtenturn.

    Nachrichten-IDs werden im Kontext/Verlauf bereitgestellt, damit Agenten bestimmte Nachrichten ansprechen können.

  </Accordion>

  <Accordion title="Live-Stream-Vorschau">
    OpenClaw kann Entwurfsantworten streamen, indem eine temporäre Nachricht gesendet und bearbeitet wird, während Text eintrifft.

    - `channels.discord.streaming` steuert das Vorschau-Streaming (`off` | `partial` | `block` | `progress`, Standard: `off`).
    - Der Standard bleibt `off`, weil Discord-Vorschauänderungen schnell an Ratenlimits stoßen können, insbesondere wenn mehrere Bots oder Gateways dasselbe Konto oder denselben Serververkehr teilen.
    - `progress` wird aus Konsistenzgründen kanalübergreifend akzeptiert und auf Discord auf `partial` abgebildet.
    - `channels.discord.streamMode` ist ein veralteter Alias und wird automatisch migriert.
    - `partial` bearbeitet eine einzelne Vorschau-Nachricht, sobald Tokens eintreffen.
    - `block` sendet Entwurfsblöcke in Chunk-Größe (verwenden Sie `draftChunk`, um Größe und Umbruchpunkte anzupassen).
    - Medien-, Fehler- und explizite-Antwort-Finals brechen ausstehende Vorschau-Bearbeitungen ab, ohne vor der normalen Zustellung einen temporären Entwurf zu flushen.
    - `streaming.preview.toolProgress` steuert, ob Tool-/Fortschrittsaktualisierungen dieselbe Entwurfsvorschau-Nachricht wiederverwenden (Standard: `true`). Setzen Sie `false`, um separate Tool-/Fortschrittsnachrichten beizubehalten.

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

    Standardwerte für das Chunking im Modus `block` (begrenzt auf `channels.discord.textChunkLimit`):

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
    Verlaufskontext für Server:

    - `channels.discord.historyLimit` Standard `20`
    - Fallback: `messages.groupChat.historyLimit`
    - `0` deaktiviert

    DM-Verlaufssteuerungen:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Thread-Verhalten:

    - Discord-Threads werden als Kanalsitzungen geroutet
    - Parent-Thread-Metadaten können für die Verknüpfung mit der Parent-Sitzung verwendet werden
    - Thread-Konfiguration übernimmt die Konfiguration des Parent-Kanals, sofern kein threadspezifischer Eintrag existiert

    Kanalthemen werden als **nicht vertrauenswürdiger** Kontext injiziert (nicht als Systemprompt).
    Antwort- und zitierter-Nachricht-Kontext bleiben derzeit wie empfangen.
    Discord-Allowlists steuern in erster Linie, wer den Agenten auslösen kann, nicht eine vollständige Schwärzungsgrenze für ergänzenden Kontext.

  </Accordion>

  <Accordion title="Thread-gebundene Sitzungen für Subagenten">
    Discord kann einen Thread an ein Sitzungsziel binden, sodass nachfolgende Nachrichten in diesem Thread weiterhin an dieselbe Sitzung geroutet werden (einschließlich Subagent-Sitzungen).

    Befehle:

    - `/focus <target>` bindet den aktuellen/neuen Thread an ein Subagent-/Sitzungsziel
    - `/unfocus` entfernt die aktuelle Thread-Bindung
    - `/agents` zeigt aktive Läufe und den Bindungsstatus
    - `/session idle <duration|off>` prüft/aktualisiert die automatische Entkopplung bei Inaktivität für fokussierte Bindings
    - `/session max-age <duration|off>` prüft/aktualisiert das harte Maximalalter für fokussierte Bindings

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
        spawnSubagentSessions: false, // optional aktivieren
      },
    },
  },
}
```

    Hinweise:

    - `session.threadBindings.*` setzt globale Standardwerte.
    - `channels.discord.threadBindings.*` überschreibt das Discord-Verhalten.
    - `spawnSubagentSessions` muss auf true gesetzt sein, damit Threads für `sessions_spawn({ thread: true })` automatisch erstellt/gebunden werden.
    - `spawnAcpSessions` muss auf true gesetzt sein, damit Threads für ACP (`/acp spawn ... --thread ...` oder `sessions_spawn({ runtime: "acp", thread: true })`) automatisch erstellt/gebunden werden.
    - Wenn Thread-Bindings für ein Konto deaktiviert sind, sind `/focus` und verwandte Thread-Binding-Operationen nicht verfügbar.

    Siehe [Sub-Agents](/de/tools/subagents), [ACP Agents](/de/tools/acp-agents) und [Konfigurationsreferenz](/de/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Persistente ACP-Kanal-Bindings">
    Für stabile, „always-on“ ACP-Arbeitsbereiche konfigurieren Sie typisierte ACP-Bindings auf oberster Ebene, die auf Discord-Konversationen zielen.

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

    - `/acp spawn codex --bind here` bindet den aktuellen Discord-Kanal oder Thread direkt vor Ort und hält zukünftige Nachrichten an dieselbe ACP-Sitzung geroutet.
    - Das kann weiterhin bedeuten: „Eine neue Codex-ACP-Sitzung starten“, aber es wird dadurch nicht von selbst ein neuer Discord-Thread erstellt. Der bestehende Kanal bleibt die Chat-Oberfläche.
    - Codex kann weiterhin in seinem eigenen `cwd` oder Backend-Arbeitsbereich auf der Festplatte laufen. Dieser Arbeitsbereich ist Laufzeitstatus, kein Discord-Thread.
    - Thread-Nachrichten können das ACP-Binding des Parent-Kanals übernehmen.
    - In einem gebundenen Kanal oder Thread setzen `/new` und `/reset` dieselbe ACP-Sitzung direkt vor Ort zurück.
    - Temporäre Thread-Bindings funktionieren weiterhin und können die Zielauflösung überschreiben, solange sie aktiv sind.
    - `spawnAcpSessions` ist nur erforderlich, wenn OpenClaw einen Child-Thread über `--thread auto|here` erstellen/binden muss. Es ist nicht erforderlich für `/acp spawn ... --bind here` im aktuellen Kanal.

    Siehe [ACP Agents](/de/tools/acp-agents) für Details zum Binding-Verhalten.

  </Accordion>

  <Accordion title="Reaktionsbenachrichtigungen">
    Reaktionsbenachrichtigungsmodus pro Server:

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
    - Emoji-Fallback der Agent-Identität (`agents.list[].identity.emoji`, sonst "👀")

    Hinweise:

    - Discord akzeptiert Unicode-Emoji oder benutzerdefinierte Emoji-Namen.
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
    Leiten Sie den Discord-Gateway-WebSocket-Verkehr und REST-Lookups beim Start (Anwendungs-ID + Allowlist-Auflösung) über einen HTTP(S)-Proxy mit `channels.discord.proxy`.

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
    Aktivieren Sie die PluralKit-Auflösung, um proxyte Nachrichten der Systemmitglied-Identität zuzuordnen:

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
    - Lookups verwenden die ursprüngliche Nachrichten-ID und sind auf ein Zeitfenster begrenzt
    - wenn der Lookup fehlschlägt, werden proxyte Nachrichten als Bot-Nachrichten behandelt und verworfen, es sei denn, `allowBots=true`

  </Accordion>

  <Accordion title="Präsenzkonfiguration">
    Präsenzaktualisierungen werden angewendet, wenn Sie ein Status- oder Aktivitätsfeld setzen oder Auto-Präsenz aktivieren.

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

    Aktivitätsbeispiel (benutzerdefinierter Status ist der Standard-Aktivitätstyp):

```json5
{
  channels: {
    discord: {
      activity: "Fokuszeit",
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
      activity: "Live-Coding",
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

    Beispiel für Auto-Präsenz (Signal für Laufzeitstatus):

```json5
{
  channels: {
    discord: {
      autoPresence: {
        enabled: true,
        intervalMs: 30000,
        minUpdateIntervalMs: 15000,
        exhaustedText: "Token erschöpft",
      },
    },
  },
}
```

    Auto-Präsenz ordnet die Laufzeitverfügbarkeit dem Discord-Status zu: healthy => online, degraded oder unknown => idle, exhausted oder unavailable => dnd. Optionale Textüberschreibungen:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (unterstützt den Platzhalter `{reason}`)

  </Accordion>

  <Accordion title="Genehmigungen in Discord">
    Discord unterstützt schaltflächenbasierte Genehmigungsverarbeitung in DMs und kann Genehmigungsaufforderungen optional im Ursprungskanal veröffentlichen.

    Konfigurationspfad:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (optional; greift nach Möglichkeit auf `commands.ownerAllowFrom` zurück)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, Standard: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord aktiviert native Exec-Genehmigungen automatisch, wenn `enabled` nicht gesetzt oder `"auto"` ist und mindestens eine genehmigende Person aufgelöst werden kann, entweder aus `execApprovals.approvers` oder aus `commands.ownerAllowFrom`. Discord leitet Exec-Genehmiger nicht aus kanalbezogenem `allowFrom`, veraltetem `dm.allowFrom` oder Direct-Message-`defaultTo` ab. Setzen Sie `enabled: false`, um Discord explizit als nativen Genehmigungsclient zu deaktivieren.

    Wenn `target` auf `channel` oder `both` gesetzt ist, ist die Genehmigungsaufforderung im Kanal sichtbar. Nur aufgelöste genehmigende Personen können die Schaltflächen verwenden; andere Benutzer erhalten eine ephemere Ablehnung. Genehmigungsaufforderungen enthalten den Befehlstext, aktivieren Sie die Zustellung im Kanal daher nur in vertrauenswürdigen Kanälen. Wenn die Kanal-ID nicht aus dem Sitzungsschlüssel abgeleitet werden kann, greift OpenClaw auf Zustellung per DM zurück.

    Discord rendert außerdem die gemeinsam genutzten Genehmigungsschaltflächen, die von anderen Chat-Kanälen verwendet werden. Der native Discord-Adapter ergänzt hauptsächlich Genehmiger-DM-Routing und Kanal-Fanout.
    Wenn diese Schaltflächen vorhanden sind, sind sie die primäre Genehmigungs-UX; OpenClaw
    sollte einen manuellen `/approve`-Befehl nur dann einschließen, wenn das Tool-Ergebnis sagt,
    dass Chat-Genehmigungen nicht verfügbar sind oder eine manuelle Genehmigung der einzige Weg ist.

    Die Gateway-Authentifizierung für diesen Handler verwendet denselben gemeinsam genutzten Vertrag zur Auflösung von Anmeldedaten wie andere Gateway-Clients:

    - env-first lokale Authentifizierung (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`, dann `gateway.auth.*`)
    - im lokalen Modus kann `gateway.remote.*` nur dann als Fallback verwendet werden, wenn `gateway.auth.*` nicht gesetzt ist; konfigurierte, aber nicht aufgelöste lokale SecretRefs schlagen fail-closed fehl
    - Remote-Mode-Unterstützung über `gateway.remote.*`, sofern zutreffend
    - URL-Overrides sind override-sicher: CLI-Overrides verwenden keine impliziten Anmeldedaten erneut, und Env-Overrides verwenden nur Env-Anmeldedaten

    Verhalten bei der Genehmigungsauflösung:

    - IDs mit dem Präfix `plugin:` werden über `plugin.approval.resolve` aufgelöst.
    - Andere IDs werden über `exec.approval.resolve` aufgelöst.
    - Discord führt hier keinen zusätzlichen Fallback-Hop von exec zu plugin aus; das Präfix
      der ID entscheidet, welche Gateway-Methode aufgerufen wird.

    Exec-Genehmigungen laufen standardmäßig nach 30 Minuten ab. Wenn Genehmigungen mit
    unbekannten Genehmigungs-IDs fehlschlagen, überprüfen Sie die Auflösung der genehmigenden Person, die Feature-Aktivierung und
    ob die Art der zugestellten Genehmigungs-ID mit der ausstehenden Anfrage übereinstimmt.

    Zugehörige Dokumentation: [Exec-Genehmigungen](/de/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## Tools und Action-Gates

Discord-Nachrichtenaktionen umfassen Messaging-, Kanaladministrations-, Moderations-, Präsenz- und Metadatenaktionen.

Kernbeispiele:

- Messaging: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- Reaktionen: `react`, `reactions`, `emojiList`
- Moderation: `timeout`, `kick`, `ban`
- Präsenz: `setPresence`

Die Aktion `event-create` akzeptiert einen optionalen Parameter `image` (URL oder lokaler Dateipfad), um das Titelbild des geplanten Ereignisses zu setzen.

Action-Gates befinden sich unter `channels.discord.actions.*`.

Standardverhalten der Gates:

| Action group                                                                                                                                                             | Default   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | aktiviert |
| roles                                                                                                                                                                    | deaktiviert |
| moderation                                                                                                                                                               | deaktiviert |
| presence                                                                                                                                                                 | deaktiviert |

## Components v2 UI

OpenClaw verwendet Discord-Komponenten v2 für Exec-Genehmigungen und kontextübergreifende Markierungen. Discord-Nachrichtenaktionen können auch `components` für benutzerdefinierte UI akzeptieren (fortgeschritten; erfordert das Erstellen einer Komponenten-Payload über das Discord-Tool), während ältere `embeds` weiterhin verfügbar, aber nicht empfohlen sind.

- `channels.discord.ui.components.accentColor` setzt die Akzentfarbe, die von Discord-Komponentencontainern verwendet wird (hex).
- Pro Konto mit `channels.discord.accounts.<id>.ui.components.accentColor` setzen.
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

OpenClaw kann Discord-Sprachkanälen für Echtzeit-, fortlaufende Gespräche beitreten. Dies ist getrennt von Sprach-Nachrichtenanhängen.

Anforderungen:

- Aktivieren Sie native Befehle (`commands.native` oder `channels.discord.commands.native`).
- Konfigurieren Sie `channels.discord.voice`.
- Der Bot benötigt die Berechtigungen Connect + Speak im Ziel-Sprachkanal.

Verwenden Sie den nur für Discord verfügbaren nativen Befehl `/vc join|leave|status`, um Sitzungen zu steuern. Der Befehl verwendet den Standard-Agenten des Kontos und folgt denselben Allowlist- und Gruppenrichtlinienregeln wie andere Discord-Befehle.

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
- Sprachtranskript-Turns leiten den Eigentümerstatus aus Discord-`allowFrom` (oder `dm.allowFrom`) ab; Sprecher, die keine Eigentümer sind, können nicht auf nur für Eigentümer verfügbare Tools zugreifen (zum Beispiel `gateway` und `cron`).
- Sprachfunktionen sind standardmäßig aktiviert; setzen Sie `channels.discord.voice.enabled=false`, um sie zu deaktivieren.
- `voice.daveEncryption` und `voice.decryptionFailureTolerance` werden an die Join-Optionen von `@discordjs/voice` durchgereicht.
- Die Standardwerte von `@discordjs/voice` sind `daveEncryption=true` und `decryptionFailureTolerance=24`, wenn sie nicht gesetzt sind.
- OpenClaw überwacht außerdem Entschlüsselungsfehler beim Empfang und stellt die Verbindung automatisch wieder her, indem der Sprachkanal nach wiederholten Fehlern in einem kurzen Zeitfenster verlassen und erneut beigetreten wird.
- Wenn Empfangslogs wiederholt `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` anzeigen, kann dies der vorgelagerte Fehler beim Empfang in `@discordjs/voice` sein, der in [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) verfolgt wird.

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
  <Accordion title="Nicht erlaubte Intents verwendet oder Bot sieht keine Servernachrichten">

    - Message Content Intent aktivieren
    - Server Members Intent aktivieren, wenn Sie von Benutzer-/Mitgliederauflösung abhängig sind
    - Gateway nach dem Ändern von Intents neu starten

  </Accordion>

  <Accordion title="Servernachrichten werden unerwartet blockiert">

    - `groupPolicy` prüfen
    - Server-Allowlist unter `channels.discord.guilds` prüfen
    - wenn eine Server-`channels`-Map existiert, sind nur aufgeführte Kanäle erlaubt
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
    - Sender durch Server-/Kanal-`users`-Allowlist blockiert

  </Accordion>

  <Accordion title="Lang laufende Handler laufen ab oder Antworten werden dupliziert">

    Typische Logs:

    - `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
    - `Slow listener detected ...`
    - `discord inbound worker timed out after ...`

    Stellschraube für Listener-Budget:

    - Einzelkonto: `channels.discord.eventQueue.listenerTimeout`
    - Mehrere Konten: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

    Stellschraube für Worker-Laufzeit-Timeout:

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
    nur dann, wenn Sie ein separates Sicherheitsventil für in der Warteschlange stehende Agent-Turns möchten.

  </Accordion>

  <Accordion title="Abweichungen bei Berechtigungsprüfungen">
    Berechtigungsprüfungen von `channels status --probe` funktionieren nur für numerische Kanal-IDs.

    Wenn Sie Slug-Schlüssel verwenden, kann das Laufzeit-Matching weiterhin funktionieren, aber die Prüfung kann Berechtigungen nicht vollständig verifizieren.

  </Accordion>

  <Accordion title="Probleme mit DMs und Kopplung">

    - DM deaktiviert: `channels.discord.dm.enabled=false`
    - DM-Richtlinie deaktiviert: `channels.discord.dmPolicy="disabled"` (veraltet: `channels.discord.dm.policy`)
    - Warten auf Genehmigung der Kopplung im Modus `pairing`

  </Accordion>

  <Accordion title="Bot-zu-Bot-Schleifen">
    Standardmäßig werden von Bots verfasste Nachrichten ignoriert.

    Wenn Sie `channels.discord.allowBots=true` setzen, verwenden Sie strenge Erwähnungs- und Allowlist-Regeln, um Schleifenverhalten zu vermeiden.
    Bevorzugen Sie `channels.discord.allowBots="mentions"`, um nur Bot-Nachrichten zu akzeptieren, die den Bot erwähnen.

  </Accordion>

  <Accordion title="Voice-STT-Ausfälle mit DecryptionFailed(...)">

    - OpenClaw aktuell halten (`openclaw update`), damit die Wiederherstellungslogik für den Discord-Spracherhalt vorhanden ist
    - bestätigen, dass `channels.discord.voice.daveEncryption=true` gesetzt ist (Standard)
    - mit `channels.discord.voice.decryptionFailureTolerance=24` beginnen (Upstream-Standard) und nur bei Bedarf anpassen
    - Logs beobachten auf:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - wenn Fehler nach automatischem erneuten Beitritt weiter auftreten, Logs sammeln und mit [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) vergleichen

  </Accordion>
</AccordionGroup>

## Verweise auf die Konfigurationsreferenz

Primäre Referenz:

- [Konfigurationsreferenz - Discord](/de/gateway/configuration-reference#discord)

Wichtige Discord-Felder:

- Start/Auth: `enabled`, `token`, `accounts.*`, `allowBots`
- Richtlinie: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- Befehl: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- Ereigniswarteschlange: `eventQueue.listenerTimeout` (Listener-Budget), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Inbound-Worker: `inboundWorker.runTimeoutMs`
- Antwort/Verlauf: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- Zustellung: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- Streaming: `streaming` (veralteter Alias: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- Medien/Wiederholungen: `mediaMaxMb`, `retry`
  - `mediaMaxMb` begrenzt ausgehende Discord-Uploads (Standard: `100MB`)
- Aktionen: `actions.*`
- Präsenz: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- Funktionen: `threadBindings`, oberstes `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

## Sicherheit und Betrieb

- Behandeln Sie Bot-Tokens als Geheimnisse (`DISCORD_BOT_TOKEN` in überwachten Umgebungen bevorzugt).
- Gewähren Sie Discord-Berechtigungen nach dem Least-Privilege-Prinzip.
- Wenn Bereitstellung/Status von Befehlen veraltet ist, starten Sie das Gateway neu und prüfen Sie erneut mit `openclaw channels status --probe`.

## Verwandt

- [Kopplung](/de/channels/pairing)
- [Gruppen](/de/channels/groups)
- [Kanal-Routing](/de/channels/channel-routing)
- [Sicherheit](/de/gateway/security)
- [Multi-Agent-Routing](/de/concepts/multi-agent)
- [Fehlerbehebung](/de/channels/troubleshooting)
- [Slash-Befehle](/de/tools/slash-commands)
