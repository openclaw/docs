---
read_when:
    - Arbeiten an Discord-Kanalfunktionen
summary: Discord-Bot-Unterstützungsstatus, Fähigkeiten und Konfiguration
title: Discord
x-i18n:
    generated_at: "2026-04-22T04:19:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 613ae39bc4b8c5661cbaab4f70a57af584f296581c3ce54ddaef0feab44e7e42
    source_path: channels/discord.md
    workflow: 15
---

# Discord (Bot-API)

Status: bereit für DMs und Serverkanäle über das offizielle Discord-Gateway.

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
  <Step title="Eine Discord-Anwendung und einen Bot erstellen">
    Gehen Sie zum [Discord Developer Portal](https://discord.com/developers/applications) und klicken Sie auf **New Application**. Geben Sie ihr einen Namen wie „OpenClaw“.

    Klicken Sie in der Seitenleiste auf **Bot**. Setzen Sie den **Username** auf den Namen, den Ihr OpenClaw-Agent tragen soll.

  </Step>

  <Step title="Privilegierte Intents aktivieren">
    Bleiben Sie auf der Seite **Bot**, scrollen Sie nach unten zu **Privileged Gateway Intents** und aktivieren Sie:

    - **Message Content Intent** (erforderlich)
    - **Server Members Intent** (empfohlen; erforderlich für Rollen-Allowlist und Name-zu-ID-Abgleich)
    - **Presence Intent** (optional; nur für Präsenzaktualisierungen erforderlich)

  </Step>

  <Step title="Ihren Bot-Token kopieren">
    Scrollen Sie auf der Seite **Bot** wieder nach oben und klicken Sie auf **Reset Token**.

    <Note>
    Trotz des Namens wird damit Ihr erster Token erzeugt — es wird nichts „zurückgesetzt“.
    </Note>

    Kopieren Sie den Token und speichern Sie ihn irgendwo. Das ist Ihr **Bot Token**, und Sie werden ihn gleich benötigen.

  </Step>

  <Step title="Eine Einladungs-URL generieren und den Bot zu Ihrem Server hinzufügen">
    Klicken Sie in der Seitenleiste auf **OAuth2**. Sie generieren eine Einladungs-URL mit den richtigen Berechtigungen, um den Bot zu Ihrem Server hinzuzufügen.

    Scrollen Sie nach unten zu **OAuth2 URL Generator** und aktivieren Sie:

    - `bot`
    - `applications.commands`

    Darunter erscheint ein Abschnitt **Bot Permissions**. Aktivieren Sie:

    - Kanäle anzeigen
    - Nachrichten senden
    - Nachrichtenverlauf lesen
    - Links einbetten
    - Dateien anhängen
    - Reaktionen hinzufügen (optional)

    Kopieren Sie die generierte URL unten, fügen Sie sie in Ihren Browser ein, wählen Sie Ihren Server aus und klicken Sie auf **Continue**, um die Verbindung herzustellen. Sie sollten Ihren Bot jetzt im Discord-Server sehen.

  </Step>

  <Step title="Developer Mode aktivieren und Ihre IDs erfassen">
    Zurück in der Discord-App müssen Sie den Developer Mode aktivieren, damit Sie interne IDs kopieren können.

    1. Klicken Sie auf **User Settings** (Zahnradsymbol neben Ihrem Avatar) → **Advanced** → schalten Sie **Developer Mode** ein
    2. Rechtsklick auf Ihr **Serversymbol** in der Seitenleiste → **Copy Server ID**
    3. Rechtsklick auf Ihren **eigenen Avatar** → **Copy User ID**

    Speichern Sie Ihre **Server ID** und **User ID** zusammen mit Ihrem Bot Token — Sie senden alle drei im nächsten Schritt an OpenClaw.

  </Step>

  <Step title="DMs von Servermitgliedern erlauben">
    Damit die Kopplung funktioniert, muss Discord Ihrem Bot erlauben, Ihnen DMs zu senden. Rechtsklick auf Ihr **Serversymbol** → **Privacy Settings** → schalten Sie **Direct Messages** ein.

    Dadurch können Servermitglieder (einschließlich Bots) Ihnen DMs senden. Lassen Sie dies aktiviert, wenn Sie Discord-DMs mit OpenClaw verwenden möchten. Wenn Sie nur Serverkanäle verwenden möchten, können Sie DMs nach der Kopplung wieder deaktivieren.

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
      <Tab title="Fragen Sie Ihren Agenten">
        Chatten Sie mit Ihrem OpenClaw-Agenten auf einem vorhandenen Kanal (z. B. Telegram) und teilen Sie es ihm mit. Wenn Discord Ihr erster Kanal ist, verwenden Sie stattdessen den Tab CLI / config.

        > „Ich habe meinen Discord-Bot-Token bereits in der Konfiguration gesetzt. Bitte schließe die Discord-Einrichtung mit User ID `<user_id>` und Server ID `<server_id>` ab.“
      </Tab>
      <Tab title="CLI / config">
        Wenn Sie eine dateibasierte Konfiguration bevorzugen, setzen Sie:

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

        Klartextwerte für `token` werden unterstützt. SecretRef-Werte werden ebenfalls für `channels.discord.token` über die Anbieter env/file/exec unterstützt. Siehe [Secrets Management](/de/gateway/secrets).

      </Tab>
    </Tabs>

  </Step>

  <Step title="Erste DM-Kopplung genehmigen">
    Warten Sie, bis das Gateway läuft, und senden Sie dann Ihrem Bot eine DM in Discord. Er antwortet mit einem Kopplungscode.

    <Tabs>
      <Tab title="Fragen Sie Ihren Agenten">
        Senden Sie den Kopplungscode auf Ihrem vorhandenen Kanal an Ihren Agenten:

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

    Sie sollten jetzt per DM mit Ihrem Agenten in Discord chatten können.

  </Step>
</Steps>

<Note>
Die Token-Auflösung ist kontoabhängig. Token-Werte aus der Konfiguration haben Vorrang vor dem Env-Fallback. `DISCORD_BOT_TOKEN` wird nur für das Standardkonto verwendet.
Für erweiterte ausgehende Aufrufe (Nachrichten-Tool/Kanalaktionen) wird ein explizites `token` pro Aufruf für diesen Aufruf verwendet. Das gilt für Sende- sowie Lese-/Probe-Aktionen (zum Beispiel read/search/fetch/thread/pins/permissions). Konto-Richtlinie/Wiederholungs-Einstellungen stammen weiterhin aus dem ausgewählten Konto im aktiven Laufzeit-Snapshot.
</Note>

## Empfohlen: Einen Server-Workspace einrichten

Sobald DMs funktionieren, können Sie Ihren Discord-Server als vollständigen Workspace einrichten, in dem jeder Kanal seine eigene Agentensitzung mit eigenem Kontext erhält. Das wird für private Server empfohlen, auf denen nur Sie und Ihr Bot sind.

<Steps>
  <Step title="Ihren Server zur Server-Allowlist hinzufügen">
    Dadurch kann Ihr Agent in jedem Kanal auf Ihrem Server antworten, nicht nur in DMs.

    <Tabs>
      <Tab title="Fragen Sie Ihren Agenten">
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
      <Tab title="Fragen Sie Ihren Agenten">
        > „Erlaube meinem Agenten, auf diesem Server zu antworten, ohne dass er mit @ erwähnt werden muss“
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

  <Step title="Speicher für Serverkanäle einplanen">
    Standardmäßig wird Langzeitspeicher (`MEMORY.md`) nur in DM-Sitzungen geladen. Serverkanäle laden `MEMORY.md` nicht automatisch.

    <Tabs>
      <Tab title="Fragen Sie Ihren Agenten">
        > „Wenn ich in Discord-Kanälen Fragen stelle, verwende memory_search oder memory_get, wenn du Langzeitkontext aus MEMORY.md benötigst.“
      </Tab>
      <Tab title="Manuell">
        Wenn Sie gemeinsamen Kontext in jedem Kanal benötigen, legen Sie die stabilen Anweisungen in `AGENTS.md` oder `USER.md` ab (sie werden für jede Sitzung injiziert). Bewahren Sie Langzeitnotizen in `MEMORY.md` auf und greifen Sie bei Bedarf mit Speicher-Tools darauf zu.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Erstellen Sie jetzt einige Kanäle auf Ihrem Discord-Server und beginnen Sie zu chatten. Ihr Agent kann den Kanalnamen sehen, und jeder Kanal erhält seine eigene isolierte Sitzung — sodass Sie `#coding`, `#home`, `#research` oder was auch immer zu Ihrem Workflow passt einrichten können.

## Laufzeitmodell

- Das Gateway verwaltet die Discord-Verbindung.
- Die Antwortweiterleitung ist deterministisch: Eingehende Discord-Antworten gehen zurück an Discord.
- Standardmäßig (`session.dmScope=main`) teilen direkte Chats die Hauptsitzung des Agenten (`agent:main:main`).
- Serverkanäle sind isolierte Sitzungsschlüssel (`agent:<agentId>:discord:channel:<channelId>`).
- Gruppen-DMs werden standardmäßig ignoriert (`channels.discord.dm.groupEnabled=false`).
- Native Slash-Befehle laufen in isolierten Befehlssitzungen (`agent:<agentId>:discord:slash:<userId>`), tragen aber weiterhin `CommandTargetSessionKey` zur weitergeleiteten Unterhaltungssitzung.

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

OpenClaw unterstützt Discord-Komponenten-v2-Container für Agentennachrichten. Verwenden Sie das Nachrichten-Tool mit einer `components`-Payload. Interaktionsergebnisse werden als normale eingehende Nachrichten zurück an den Agenten geleitet und folgen den vorhandenen Discord-Einstellungen für `replyToMode`.

Unterstützte Blöcke:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Aktionszeilen erlauben bis zu 5 Buttons oder ein einzelnes Auswahlmenü
- Auswahltypen: `string`, `user`, `role`, `mentionable`, `channel`

Standardmäßig sind Komponenten einmalig nutzbar. Setzen Sie `components.reusable=true`, damit Buttons, Auswahlen und Formulare mehrfach verwendet werden können, bis sie ablaufen.

Um einzuschränken, wer auf einen Button klicken kann, setzen Sie `allowedUsers` auf diesem Button (Discord-Benutzer-IDs, Tags oder `*`). Wenn dies konfiguriert ist, erhalten nicht passende Benutzer eine ephemere Ablehnung.

Die Slash-Befehle `/model` und `/models` öffnen eine interaktive Modellauswahl mit Dropdowns für Anbieter und Modell sowie einem Schritt zum Absenden. Die Antwort der Auswahl ist ephemer, und nur der aufrufende Benutzer kann sie verwenden.

Dateianhänge:

- `file`-Blöcke müssen auf eine Anhangsreferenz zeigen (`attachment://<filename>`)
- Stellen Sie den Anhang über `media`/`path`/`filePath` bereit (einzelne Datei); verwenden Sie `media-gallery` für mehrere Dateien
- Verwenden Sie `filename`, um den Upload-Namen zu überschreiben, wenn er mit der Anhangsreferenz übereinstimmen soll

Modale Formulare:

- Fügen Sie `components.modal` mit bis zu 5 Feldern hinzu
- Feldtypen: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw fügt automatisch einen Auslöse-Button hinzu

Beispiel:

```json5
{
  channel: "discord",
  action: "send",
  to: "channel:123456789012345678",
  message: "Optionaler Fallback-Text",
  components: {
    reusable: true,
    text: "Wähle einen Pfad",
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
          placeholder: "Wähle eine Option",
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

    Reine numerische IDs sind mehrdeutig und werden abgelehnt, sofern nicht explizit eine Benutzer-/Kanal-Zielart angegeben ist.

  </Tab>

  <Tab title="Serverrichtlinie">
    Die Behandlung von Servern wird durch `channels.discord.groupPolicy` gesteuert:

    - `open`
    - `allowlist`
    - `disabled`

    Die sichere Basislinie, wenn `channels.discord` existiert, ist `allowlist`.

    Verhalten von `allowlist`:

    - Der Server muss mit `channels.discord.guilds` übereinstimmen (`id` bevorzugt, Slug akzeptiert)
    - optionale Sender-Allowlists: `users` (stabile IDs empfohlen) und `roles` (nur Rollen-IDs); wenn eines von beiden konfiguriert ist, sind Sender erlaubt, wenn sie mit `users` ODER `roles` übereinstimmen
    - direkte Namens-/Tag-Übereinstimmung ist standardmäßig deaktiviert; aktivieren Sie `channels.discord.dangerouslyAllowNameMatching: true` nur als Kompatibilitätsmodus für Notfälle
    - Namen/Tags werden für `users` unterstützt, aber IDs sind sicherer; `openclaw security audit` warnt, wenn Namens-/Tag-Einträge verwendet werden
    - wenn ein Server `channels` konfiguriert hat, werden nicht aufgeführte Kanäle abgelehnt
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

    Wenn Sie nur `DISCORD_BOT_TOKEN` setzen und keinen `channels.discord`-Block erstellen, ist das Laufzeit-Fallback `groupPolicy="allowlist"` (mit einer Warnung in den Logs), selbst wenn `channels.defaults.groupPolicy` `open` ist.

  </Tab>

  <Tab title="Erwähnungen und Gruppen-DMs">
    Servernachrichten sind standardmäßig durch Erwähnungen eingeschränkt.

    Die Erwähnungserkennung umfasst:

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

### Rollenbasiertes Agenten-Routing

Verwenden Sie `bindings[].match.roles`, um Discord-Servermitglieder anhand ihrer Rollen-ID an unterschiedliche Agenten weiterzuleiten. Rollenbasierte Bindings akzeptieren nur Rollen-IDs und werden nach Peer- oder Parent-Peer-Bindings und vor rein serverbasierten Bindings ausgewertet. Wenn ein Binding auch andere Match-Felder setzt (zum Beispiel `peer` + `guildId` + `roles`), müssen alle konfigurierten Felder übereinstimmen.

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
    OAuth URL Generator:

    - Scopes: `bot`, `applications.commands`

    Typische Basisberechtigungen:

    - Kanäle anzeigen
    - Nachrichten senden
    - Nachrichtenverlauf lesen
    - Links einbetten
    - Dateien anhängen
    - Reaktionen hinzufügen (optional)

    Vermeiden Sie `Administrator`, sofern dies nicht ausdrücklich erforderlich ist.

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

- `commands.native` ist standardmäßig `"auto"` und für Discord aktiviert.
- Kanalbezogene Überschreibung: `channels.discord.commands.native`.
- `commands.native=false` löscht explizit zuvor registrierte native Discord-Befehle.
- Die Authentifizierung nativer Befehle verwendet dieselben Discord-Allowlists/-Richtlinien wie die normale Nachrichtenverarbeitung.
- Befehle können in der Discord-Benutzeroberfläche weiterhin für nicht autorisierte Benutzer sichtbar sein; die Ausführung erzwingt dennoch die OpenClaw-Authentifizierung und gibt „nicht autorisiert“ zurück.

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
    `first` hängt immer die implizite native Antwortreferenz an die erste ausgehende Discord-Nachricht für den Turn an.
    `batched` hängt Discords implizite native Antwortreferenz nur an, wenn der
    eingehende Turn ein entprellter Stapel mehrerer Nachrichten war. Das ist nützlich,
    wenn Sie native Antworten hauptsächlich für mehrdeutige, schubweise Chats möchten, nicht für jeden
    einzelnen Einzelnachrichten-Turn.

    Nachrichten-IDs werden in Kontext/Verlauf sichtbar gemacht, damit Agenten gezielt bestimmte Nachrichten ansprechen können.

  </Accordion>

  <Accordion title="Live-Stream-Vorschau">
    OpenClaw kann Antwortentwürfe streamen, indem eine temporäre Nachricht gesendet und beim Eintreffen von Text bearbeitet wird.

    - `channels.discord.streaming` steuert Vorschau-Streaming (`off` | `partial` | `block` | `progress`, Standard: `off`).
    - Standardmäßig bleibt es bei `off`, weil Discord-Vorschau-Bearbeitungen schnell an Ratenlimits stoßen können, insbesondere wenn mehrere Bots oder Gateways dasselbe Konto oder denselben Serververkehr gemeinsam nutzen.
    - `progress` wird aus Gründen der kanalübergreifenden Konsistenz akzeptiert und in Discord auf `partial` abgebildet.
    - `channels.discord.streamMode` ist ein veralteter Alias und wird automatisch migriert.
    - `partial` bearbeitet eine einzelne Vorschaunachricht, während Tokens eintreffen.
    - `block` gibt Entwurfsblöcke aus (verwenden Sie `draftChunk`, um Größe und Umbruchpunkte anzupassen).
    - Finale Medien-, Fehler- und explizite-Antwort-Zustellungen brechen ausstehende Vorschau-Bearbeitungen ab, ohne vor der normalen Zustellung einen temporären Entwurf zu flushen.
    - `streaming.preview.toolProgress` steuert, ob Tool-/Fortschrittsaktualisierungen dieselbe Entwurfsvorschaunachricht wiederverwenden (Standard: `true`). Setzen Sie `false`, um separate Tool-/Fortschrittsnachrichten beizubehalten.

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

    `block`-Modus-Chunking-Standards (begrenzt auf `channels.discord.textChunkLimit`):

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

    Hinweis: Vorschau-Streaming ist getrennt von Block-Streaming. Wenn Block-Streaming für Discord explizit
    aktiviert ist, überspringt OpenClaw den Vorschau-Stream, um doppeltes Streaming zu vermeiden.

  </Accordion>

  <Accordion title="Verlauf, Kontext und Thread-Verhalten">
    Verlaufskontext für Server:

    - `channels.discord.historyLimit` Standard `20`
    - Fallback: `messages.groupChat.historyLimit`
    - `0` deaktiviert

    Verlaufssteuerung für DMs:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Thread-Verhalten:

    - Discord-Threads werden als Kanalsitzungen weitergeleitet
    - Parent-Thread-Metadaten können für Parent-Sitzungs-Verknüpfung verwendet werden
    - Thread-Konfiguration übernimmt die Parent-Kanalkonfiguration, sofern kein thread-spezifischer Eintrag existiert

    Kanalthemen werden als **nicht vertrauenswürdiger** Kontext injiziert (nicht als System-Prompt).
    Antwort- und Zitatnachrichtenkontext bleibt derzeit so erhalten, wie er empfangen wurde.
    Discord-Allowlists steuern in erster Linie, wer den Agenten auslösen kann, nicht eine vollständige Redaktionsgrenze für zusätzlichen Kontext.

  </Accordion>

  <Accordion title="Thread-gebundene Sitzungen für Subagenten">
    Discord kann einen Thread an ein Sitzungsziel binden, sodass Folgemeldungen in diesem Thread weiterhin an dieselbe Sitzung weitergeleitet werden (einschließlich Subagenten-Sitzungen).

    Befehle:

    - `/focus <target>` bindet aktuellen/neuen Thread an ein Subagent-/Sitzungsziel
    - `/unfocus` entfernt die aktuelle Thread-Bindung
    - `/agents` zeigt aktive Läufe und den Bindungsstatus
    - `/session idle <duration|off>` prüft/aktualisiert automatische Inaktivitäts-Aufhebung des Fokus für fokussierte Bindings
    - `/session max-age <duration|off>` prüft/aktualisiert harte maximale Laufzeit für fokussierte Bindings

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

    - `session.threadBindings.*` setzt globale Standards.
    - `channels.discord.threadBindings.*` überschreibt das Discord-Verhalten.
    - `spawnSubagentSessions` muss `true` sein, um Threads für `sessions_spawn({ thread: true })` automatisch zu erstellen/zu binden.
    - `spawnAcpSessions` muss `true` sein, um Threads für ACP (`/acp spawn ... --thread ...` oder `sessions_spawn({ runtime: "acp", thread: true })`) automatisch zu erstellen/zu binden.
    - Wenn Thread-Bindings für ein Konto deaktiviert sind, sind `/focus` und zugehörige Thread-Binding-Operationen nicht verfügbar.

    Siehe [Sub-Agenten](/de/tools/subagents), [ACP Agents](/de/tools/acp-agents) und [Configuration Reference](/de/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Persistente ACP-Kanal-Bindings">
    Für stabile, „immer aktive“ ACP-Workspaces konfigurieren Sie ACP-Bindings auf oberster Ebene mit Typisierung, die auf Discord-Unterhaltungen zielen.

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

    - `/acp spawn codex --bind here` bindet den aktuellen Discord-Kanal oder Thread direkt vor Ort und sorgt dafür, dass künftige Nachrichten weiter an dieselbe ACP-Sitzung geleitet werden.
    - Das kann weiterhin bedeuten: „eine frische Codex-ACP-Sitzung starten“, aber es erstellt nicht selbstständig einen neuen Discord-Thread. Der vorhandene Kanal bleibt die Chat-Oberfläche.
    - Codex kann weiterhin in seinem eigenen `cwd` oder Backend-Workspace auf der Festplatte laufen. Dieser Workspace ist Laufzeitstatus, kein Discord-Thread.
    - Thread-Nachrichten können das ACP-Binding des übergeordneten Kanals übernehmen.
    - In einem gebundenen Kanal oder Thread setzen `/new` und `/reset` dieselbe ACP-Sitzung direkt vor Ort zurück.
    - Temporäre Thread-Bindings funktionieren weiterhin und können die Zielauflösung überschreiben, solange sie aktiv sind.
    - `spawnAcpSessions` ist nur erforderlich, wenn OpenClaw einen untergeordneten Thread über `--thread auto|here` erstellen/binden muss. Für `/acp spawn ... --bind here` im aktuellen Kanal ist es nicht erforderlich.

    Siehe [ACP Agents](/de/tools/acp-agents) für Details zum Binding-Verhalten.

  </Accordion>

  <Accordion title="Benachrichtigungen über Reaktionen">
    Modus für Reaktionsbenachrichtigungen pro Server:

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
    - Emoji-Fallback der Agentenidentität (`agents.list[].identity.emoji`, sonst "👀")

    Hinweise:

    - Discord akzeptiert Unicode-Emojis oder benutzerdefinierte Emoji-Namen.
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
    - Anzeigenamen von Mitgliedern werden nur dann über Namen/Slug abgeglichen, wenn `channels.discord.dangerouslyAllowNameMatching: true`
    - Lookups verwenden die ursprüngliche Nachrichten-ID und sind auf ein Zeitfenster beschränkt
    - wenn das Lookup fehlschlägt, werden weitergeleitete Nachrichten als Bot-Nachrichten behandelt und verworfen, es sei denn, `allowBots=true`

  </Accordion>

  <Accordion title="Präsenzkonfiguration">
    Präsenzaktualisierungen werden angewendet, wenn Sie ein Status- oder Aktivitätsfeld setzen oder wenn Sie automatische Präsenz aktivieren.

    Beispiel nur mit Status:

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

    - 0: Spielen
    - 1: Streaming (erfordert `activityUrl`)
    - 2: Zuhören
    - 3: Zuschauen
    - 4: Benutzerdefiniert (verwendet den Aktivitätstext als Statuszustand; Emoji ist optional)
    - 5: Im Wettbewerb

    Beispiel für automatische Präsenz (Signal für Laufzeitintegrität):

```json5
{
  channels: {
    discord: {
      autoPresence: {
        enabled: true,
        intervalMs: 30000,
        minUpdateIntervalMs: 15000,
        exhaustedText: "Token aufgebraucht",
      },
    },
  },
}
```

    Die automatische Präsenz ordnet die Laufzeitverfügbarkeit dem Discord-Status zu: gesund => online, beeinträchtigt oder unbekannt => idle, aufgebraucht oder nicht verfügbar => dnd. Optionale Textüberschreibungen:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (unterstützt den Platzhalter `{reason}`)

  </Accordion>

  <Accordion title="Genehmigungen in Discord">
    Discord unterstützt die buttonbasierte Behandlung von Genehmigungen in DMs und kann Genehmigungsaufforderungen optional im auslösenden Kanal veröffentlichen.

    Konfigurationspfad:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (optional; fällt wenn möglich auf `commands.ownerAllowFrom` zurück)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, Standard: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord aktiviert native Exec-Genehmigungen automatisch, wenn `enabled` nicht gesetzt oder `"auto"` ist und mindestens ein Genehmigender aufgelöst werden kann, entweder aus `execApprovals.approvers` oder aus `commands.ownerAllowFrom`. Discord leitet Exec-Genehmigende nicht aus Kanal-`allowFrom`, veraltetem `dm.allowFrom` oder `defaultTo` für Direktnachrichten ab. Setzen Sie `enabled: false`, um Discord explizit als nativen Genehmigungs-Client zu deaktivieren.

    Wenn `target` auf `channel` oder `both` gesetzt ist, ist die Genehmigungsaufforderung im Kanal sichtbar. Nur aufgelöste Genehmigende können die Buttons verwenden; andere Benutzer erhalten eine ephemere Ablehnung. Genehmigungsaufforderungen enthalten den Befehlstext, aktivieren Sie die Kanalauslieferung daher nur in vertrauenswürdigen Kanälen. Wenn die Kanal-ID nicht aus dem Sitzungsschlüssel abgeleitet werden kann, fällt OpenClaw auf die Zustellung per DM zurück.

    Discord rendert außerdem die gemeinsamen Genehmigungsbuttons, die von anderen Chat-Kanälen verwendet werden. Der native Discord-Adapter ergänzt hauptsächlich die Weiterleitung von Genehmigenden-DMs und die Kanalverteilung.
    Wenn diese Buttons vorhanden sind, sind sie die primäre UX für Genehmigungen; OpenClaw
    sollte einen manuellen `/approve`-Befehl nur dann einfügen, wenn das Tool-Ergebnis angibt,
    dass Chat-Genehmigungen nicht verfügbar sind oder die manuelle Genehmigung der einzige Weg ist.

    Die Gateway-Authentifizierung für diesen Handler verwendet denselben gemeinsam genutzten Vertrag zur Anmeldeinformationsauflösung wie andere Gateway-Clients:

    - lokale Authentifizierung mit Env-Priorität (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`, dann `gateway.auth.*`)
    - im lokalen Modus kann `gateway.remote.*` nur dann als Fallback verwendet werden, wenn `gateway.auth.*` nicht gesetzt ist; konfigurierte, aber nicht aufgelöste lokale SecretRefs schlagen fail-closed fehl
    - Unterstützung für den Remote-Modus über `gateway.remote.*`, wenn anwendbar
    - URL-Überschreibungen sind Override-sicher: CLI-Überschreibungen verwenden keine impliziten Anmeldedaten erneut, und Env-Überschreibungen verwenden nur Env-Anmeldedaten

    Verhalten bei der Genehmigungsauflösung:

    - IDs mit dem Präfix `plugin:` werden über `plugin.approval.resolve` aufgelöst.
    - Andere IDs werden über `exec.approval.resolve` aufgelöst.
    - Discord führt hier keinen zusätzlichen Exec-zu-Plugin-Fallback-Schritt aus; das
      ID-Präfix entscheidet, welche Gateway-Methode aufgerufen wird.

    Exec-Genehmigungen laufen standardmäßig nach 30 Minuten ab. Wenn Genehmigungen mit
    unbekannten Genehmigungs-IDs fehlschlagen, prüfen Sie die Auflösung der Genehmigenden, die Funktionsaktivierung und
    ob die Art der ausgelieferten Genehmigungs-ID mit der ausstehenden Anfrage übereinstimmt.

    Zugehörige Dokumentation: [Exec-Genehmigungen](/de/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## Tools und Action-Gates

Discord-Nachrichtenaktionen umfassen Messaging-, Kanaladmin-, Moderations-, Präsenz- und Metadatenaktionen.

Kernbeispiele:

- Messaging: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- Reaktionen: `react`, `reactions`, `emojiList`
- Moderation: `timeout`, `kick`, `ban`
- Präsenz: `setPresence`

Die Aktion `event-create` akzeptiert einen optionalen Parameter `image` (URL oder lokaler Dateipfad), um das Titelbild des geplanten Ereignisses zu setzen.

Action-Gates befinden sich unter `channels.discord.actions.*`.

Standardverhalten der Gates:

| Action group                                                                                                                                                             | Standard |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | aktiviert |
| roles                                                                                                                                                                    | deaktiviert |
| moderation                                                                                                                                                               | deaktiviert |
| presence                                                                                                                                                                 | deaktiviert |

## Components v2 UI

OpenClaw verwendet Discord-Components-v2 für Exec-Genehmigungen und kontextübergreifende Markierungen. Discord-Nachrichtenaktionen können auch `components` für benutzerdefinierte UI akzeptieren (fortgeschritten; erfordert die Konstruktion einer Komponenten-Payload über das Discord-Tool), während veraltete `embeds` weiterhin verfügbar bleiben, aber nicht empfohlen werden.

- `channels.discord.ui.components.accentColor` setzt die Akzentfarbe, die von Discord-Komponentencontainern verwendet wird (hex).
- Pro Konto mit `channels.discord.accounts.<id>.ui.components.accentColor` setzen.
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

## Sprachkanäle

OpenClaw kann Discord-Sprachkanälen für Echtzeit-Unterhaltungen mit kontinuierlichem Austausch beitreten. Dies ist getrennt von Anhängen mit Sprachnachrichten.

Voraussetzungen:

- Aktivieren Sie native Befehle (`commands.native` oder `channels.discord.commands.native`).
- Konfigurieren Sie `channels.discord.voice`.
- Der Bot benötigt die Berechtigungen Verbinden + Sprechen im Ziel-Sprachkanal.

Verwenden Sie den nur für Discord verfügbaren nativen Befehl `/vc join|leave|status`, um Sitzungen zu steuern. Der Befehl verwendet den Standardagenten des Kontos und folgt denselben Allowlist- und Gruppenrichtlinien wie andere Discord-Befehle.

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

- `voice.tts` überschreibt `messages.tts` nur für die Sprachausgabe.
- Sprachtranskript-Turns leiten den Eigentümerstatus aus Discord `allowFrom` (oder `dm.allowFrom`) ab; Sprecher, die keine Eigentümer sind, können nicht auf Tools zugreifen, die nur Eigentümern vorbehalten sind (zum Beispiel `gateway` und `cron`).
- Voice ist standardmäßig aktiviert; setzen Sie `channels.discord.voice.enabled=false`, um es zu deaktivieren.
- `voice.daveEncryption` und `voice.decryptionFailureTolerance` werden an die Join-Optionen von `@discordjs/voice` durchgereicht.
- Die Standardwerte von `@discordjs/voice` sind `daveEncryption=true` und `decryptionFailureTolerance=24`, falls nichts gesetzt ist.
- OpenClaw überwacht auch Entschlüsselungsfehler beim Empfang und stellt sich automatisch wieder her, indem es den Sprachkanal nach wiederholten Fehlern in einem kurzen Zeitfenster verlässt und erneut beitritt.
- Wenn Empfangslogs wiederholt `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` anzeigen, kann dies der Upstream-Empfangsfehler von `@discordjs/voice` sein, der in [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) verfolgt wird.

## Sprachnachrichten

Discord-Sprachnachrichten zeigen eine Waveform-Vorschau an und erfordern OGG/Opus-Audio plus Metadaten. OpenClaw erzeugt die Waveform automatisch, aber dafür müssen `ffmpeg` und `ffprobe` auf dem Gateway-Host verfügbar sein, um Audiodateien zu prüfen und zu konvertieren.

Anforderungen und Einschränkungen:

- Geben Sie einen **lokalen Dateipfad** an (URLs werden abgelehnt).
- Lassen Sie Textinhalt weg (Discord erlaubt nicht Text + Sprachnachricht in derselben Payload).
- Jedes Audioformat wird akzeptiert; OpenClaw konvertiert bei Bedarf in OGG/Opus.

Beispiel:

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Nicht erlaubte Intents verwendet oder Bot sieht keine Servernachrichten">

    - aktivieren Sie Message Content Intent
    - aktivieren Sie Server Members Intent, wenn Sie von Benutzer-/Mitgliederauflösung abhängen
    - starten Sie das Gateway nach dem Ändern von Intents neu

  </Accordion>

  <Accordion title="Servernachrichten unerwartet blockiert">

    - prüfen Sie `groupPolicy`
    - prüfen Sie die Server-Allowlist unter `channels.discord.guilds`
    - wenn eine `channels`-Zuordnung für den Server existiert, sind nur aufgeführte Kanäle erlaubt
    - prüfen Sie das Verhalten von `requireMention` und die Erwähnungsmuster

    Nützliche Prüfungen:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false, aber trotzdem blockiert">
    Häufige Ursachen:

    - `groupPolicy="allowlist"` ohne passende Server-/Kanal-Allowlist
    - `requireMention` an der falschen Stelle konfiguriert (muss unter `channels.discord.guilds` oder im Kanaleintrag stehen)
    - Absender durch `users`-Allowlist des Servers/Kanals blockiert

  </Accordion>

  <Accordion title="Lang laufende Handler laufen in ein Timeout oder erzeugen doppelte Antworten">

    Typische Logs:

    - `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
    - `Slow listener detected ...`
    - `discord inbound worker timed out after ...`

    Regler für Listener-Budget:

    - Einzelkonto: `channels.discord.eventQueue.listenerTimeout`
    - mehrere Konten: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

    Regler für Worker-Laufzeit-Timeout:

    - Einzelkonto: `channels.discord.inboundWorker.runTimeoutMs`
    - mehrere Konten: `channels.discord.accounts.<accountId>.inboundWorker.runTimeoutMs`
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
    nur dann, wenn Sie ein separates Sicherheitsventil für in die Warteschlange eingereihte Agenten-Turns möchten.

  </Accordion>

  <Accordion title="Abweichungen bei Berechtigungsaudits">
    Berechtigungsprüfungen von `channels status --probe` funktionieren nur für numerische Kanal-IDs.

    Wenn Sie Slug-Schlüssel verwenden, kann das Laufzeit-Matching weiterhin funktionieren, aber die Prüfung kann Berechtigungen nicht vollständig verifizieren.

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

  <Accordion title="Voice-STT bricht mit DecryptionFailed(...) ab">

    - halten Sie OpenClaw aktuell (`openclaw update`), damit die Wiederherstellungslogik für den Empfang von Discord-Voice vorhanden ist
    - bestätigen Sie `channels.discord.voice.daveEncryption=true` (Standard)
    - beginnen Sie mit `channels.discord.voice.decryptionFailureTolerance=24` (Upstream-Standard) und passen Sie nur bei Bedarf an
    - beobachten Sie die Logs auf:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - wenn die Fehler nach dem automatischen erneuten Beitritt weiter auftreten, sammeln Sie Logs und vergleichen Sie sie mit [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419)

  </Accordion>
</AccordionGroup>

## Verweise auf die Konfigurationsreferenz

Primäre Referenz:

- [Configuration Reference - Discord](/de/gateway/configuration-reference#discord)

Wichtige Discord-Felder:

- Start/Auth: `enabled`, `token`, `accounts.*`, `allowBots`
- Richtlinie: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- Befehl: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- Ereigniswarteschlange: `eventQueue.listenerTimeout` (Listener-Budget), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Inbound-Worker: `inboundWorker.runTimeoutMs`
- Antwort/Verlauf: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- Zustellung: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- Streaming: `streaming` (veralteter Alias: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- Medien/Wiederholung: `mediaMaxMb`, `retry`
  - `mediaMaxMb` begrenzt ausgehende Discord-Uploads (Standard: `100MB`)
- Aktionen: `actions.*`
- Präsenz: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- Funktionen: `threadBindings`, oberste Ebene `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

## Sicherheit und Betrieb

- Behandeln Sie Bot-Tokens als Geheimnisse (`DISCORD_BOT_TOKEN` in überwachten Umgebungen bevorzugt).
- Vergeben Sie Discord-Berechtigungen nach dem Least-Privilege-Prinzip.
- Wenn Bereitstellung/Status von Befehlen veraltet ist, starten Sie das Gateway neu und prüfen Sie erneut mit `openclaw channels status --probe`.

## Verwandt

- [Kopplung](/de/channels/pairing)
- [Gruppen](/de/channels/groups)
- [Kanal-Routing](/de/channels/channel-routing)
- [Sicherheit](/de/gateway/security)
- [Multi-Agent-Routing](/de/concepts/multi-agent)
- [Fehlerbehebung](/de/channels/troubleshooting)
- [Slash-Befehle](/de/tools/slash-commands)
