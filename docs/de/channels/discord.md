---
read_when:
    - Arbeiten an Discord-Kanalfunktionen
summary: Status der Discord-Bot-Unterstützung, Funktionen und Konfiguration
title: Discord
x-i18n:
    generated_at: "2026-05-07T13:13:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 805a093452b7af1c844919cdf776d898c6fd39f63f1bf363967dd471842eebd5
    source_path: channels/discord.md
    workflow: 16
---

Bereit für DMs und Gildenkanäle über das offizielle Discord-Gateway.

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
  <Step title="Discord-Anwendung und Bot erstellen">
    Gehen Sie zum [Discord Developer Portal](https://discord.com/developers/applications) und klicken Sie auf **New Application**. Nennen Sie sie zum Beispiel „OpenClaw“.

    Klicken Sie in der Seitenleiste auf **Bot**. Setzen Sie den **Username** auf den Namen, den Sie für Ihren OpenClaw-Agenten verwenden.

  </Step>

  <Step title="Privilegierte Intents aktivieren">
    Bleiben Sie auf der Seite **Bot**, scrollen Sie nach unten zu **Privileged Gateway Intents** und aktivieren Sie:

    - **Message Content Intent** (erforderlich)
    - **Server Members Intent** (empfohlen; erforderlich für Rollen-Zulassungslisten und Name-zu-ID-Zuordnung)
    - **Presence Intent** (optional; nur für Presence-Aktualisierungen erforderlich)

  </Step>

  <Step title="Bot-Token kopieren">
    Scrollen Sie auf der Seite **Bot** wieder nach oben und klicken Sie auf **Reset Token**.

    <Note>
    Trotz des Namens wird dadurch Ihr erstes Token erzeugt — es wird nichts „zurückgesetzt“.
    </Note>

    Kopieren Sie das Token und speichern Sie es irgendwo. Dies ist Ihr **Bot Token**, und Sie werden es gleich benötigen.

  </Step>

  <Step title="Einladungs-URL generieren und Bot zu Ihrem Server hinzufügen">
    Klicken Sie in der Seitenleiste auf **OAuth2**. Sie generieren eine Einladungs-URL mit den richtigen Berechtigungen, um den Bot zu Ihrem Server hinzuzufügen.

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

    Dies ist die Basisberechtigung für normale Textkanäle. Wenn Sie in Discord-Threads posten möchten, einschließlich Forum- oder Medienkanal-Workflows, die einen Thread erstellen oder fortführen, aktivieren Sie außerdem **Send Messages in Threads**.
    Kopieren Sie die generierte URL unten, fügen Sie sie in Ihren Browser ein, wählen Sie Ihren Server aus und klicken Sie auf **Continue**, um die Verbindung herzustellen. Sie sollten Ihren Bot nun auf dem Discord-Server sehen.

  </Step>

  <Step title="Developer Mode aktivieren und Ihre IDs erfassen">
    Zurück in der Discord-App müssen Sie den Developer Mode aktivieren, damit Sie interne IDs kopieren können.

    1. Klicken Sie auf **User Settings** (Zahnradsymbol neben Ihrem Avatar) → **Advanced** → aktivieren Sie **Developer Mode**
    2. Klicken Sie mit der rechten Maustaste auf Ihr **Serversymbol** in der Seitenleiste → **Copy Server ID**
    3. Klicken Sie mit der rechten Maustaste auf Ihren **eigenen Avatar** → **Copy User ID**

    Speichern Sie Ihre **Server ID** und **User ID** zusammen mit Ihrem Bot Token — Sie senden alle drei im nächsten Schritt an OpenClaw.

  </Step>

  <Step title="DMs von Servermitgliedern zulassen">
    Damit die Kopplung funktioniert, muss Discord Ihrem Bot erlauben, Ihnen eine DM zu senden. Klicken Sie mit der rechten Maustaste auf Ihr **Serversymbol** → **Privacy Settings** → aktivieren Sie **Direct Messages**.

    Dadurch können Servermitglieder (einschließlich Bots) Ihnen DMs senden. Lassen Sie dies aktiviert, wenn Sie Discord-DMs mit OpenClaw verwenden möchten. Wenn Sie nur Gildenkanäle verwenden möchten, können Sie DMs nach der Kopplung deaktivieren.

  </Step>

  <Step title="Bot-Token sicher setzen (nicht im Chat senden)">
    Ihr Discord-Bot-Token ist ein Geheimnis (wie ein Passwort). Setzen Sie es auf dem Computer, auf dem OpenClaw läuft, bevor Sie Ihrem Agenten eine Nachricht senden.

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
cat > discord.patch.json5 <<'JSON5'
{
  channels: {
    discord: {
      enabled: true,
      token: { source: "env", provider: "default", id: "DISCORD_BOT_TOKEN" },
    },
  },
}
JSON5
openclaw config patch --file ./discord.patch.json5 --dry-run
openclaw config patch --file ./discord.patch.json5
openclaw gateway
```

    Wenn OpenClaw bereits als Hintergrunddienst läuft, starten Sie es über die OpenClaw-Mac-App neu oder indem Sie den Prozess `openclaw gateway run` stoppen und neu starten.
    Führen Sie bei verwalteten Dienstinstallationen `openclaw gateway install` aus einer Shell aus, in der `DISCORD_BOT_TOKEN` vorhanden ist, oder speichern Sie die Variable in `~/.openclaw/.env`, damit der Dienst die env-SecretRef nach dem Neustart auflösen kann.
    Wenn Ihr Host durch Discords Anwendungsabfrage beim Start blockiert oder ratenbegrenzt wird, setzen Sie die Discord-Anwendungs-/Client-ID aus dem Developer Portal, damit der Start diesen REST-Aufruf überspringen kann. Verwenden Sie `channels.discord.applicationId` für das Standardkonto oder `channels.discord.accounts.<accountId>.applicationId`, wenn Sie mehrere Discord-Bots betreiben.

  </Step>

  <Step title="OpenClaw konfigurieren und koppeln">

    <Tabs>
      <Tab title="Ihren Agenten fragen">
        Chatten Sie mit Ihrem OpenClaw-Agenten in einem vorhandenen Kanal (z. B. Telegram) und teilen Sie es ihm mit. Wenn Discord Ihr erster Kanal ist, verwenden Sie stattdessen den Tab CLI / Konfiguration.

        > „Ich habe mein Discord-Bot-Token bereits in der Konfiguration gesetzt. Bitte schließen Sie die Discord-Einrichtung mit User ID `<user_id>` und Server ID `<server_id>` ab.“
      </Tab>
      <Tab title="CLI / Konfiguration">
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

        Schreiben Sie für geskriptete oder Remote-Einrichtung denselben JSON5-Block mit `openclaw config patch --file ./discord.patch.json5 --dry-run` und führen Sie ihn danach erneut ohne `--dry-run` aus. Klartextwerte für `token` werden unterstützt. SecretRef-Werte werden ebenfalls für `channels.discord.token` über env/file/exec-Provider unterstützt. Siehe [Geheimnisverwaltung](/de/gateway/secrets).

        Halten Sie bei mehreren Discord-Bots jedes Bot-Token und jede Anwendungs-ID unter dem jeweiligen Konto. Ein `channels.discord.applicationId` auf oberster Ebene wird von Konten geerbt. Setzen Sie es dort also nur, wenn jedes Konto dieselbe Anwendungs-ID verwenden soll.

```json5
{
  channels: {
    discord: {
      enabled: true,
      accounts: {
        personal: {
          token: { source: "env", provider: "default", id: "DISCORD_PERSONAL_TOKEN" },
          applicationId: "111111111111111111",
        },
        work: {
          token: { source: "env", provider: "default", id: "DISCORD_WORK_TOKEN" },
          applicationId: "222222222222222222",
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="Erste DM-Kopplung genehmigen">
    Warten Sie, bis der Gateway läuft, und senden Sie Ihrem Bot dann in Discord eine DM. Er antwortet mit einem Kopplungscode.

    <Tabs>
      <Tab title="Ihren Agenten fragen">
        Senden Sie den Kopplungscode über Ihren vorhandenen Kanal an Ihren Agenten:

        > „Genehmigen Sie diesen Discord-Kopplungscode: `<CODE>`“
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    Kopplungscodes laufen nach 1 Stunde ab.

    Sie sollten nun per DM in Discord mit Ihrem Agenten chatten können.

  </Step>
</Steps>

<Note>
Die Token-Auflösung ist kontobewusst. Konfigurierte Token-Werte haben Vorrang vor dem env-Fallback. `DISCORD_BOT_TOKEN` wird nur für das Standardkonto verwendet.
Wenn zwei aktivierte Discord-Konten dasselbe Bot-Token auflösen, startet OpenClaw nur einen Gateway-Monitor für dieses Token. Ein aus der Konfiguration stammendes Token hat Vorrang vor dem Standard-env-Fallback; andernfalls gewinnt das erste aktivierte Konto, und das doppelte Konto wird als deaktiviert gemeldet.
Für erweiterte ausgehende Aufrufe (Nachrichten-Tool/Kanalaktionen) wird ein explizites `token` pro Aufruf für diesen Aufruf verwendet. Dies gilt für Sende- und Lese-/Probe-artige Aktionen (zum Beispiel read/search/fetch/thread/pins/permissions). Kontorichtlinien und Wiederholungsversuch-Einstellungen stammen weiterhin aus dem ausgewählten Konto im aktiven Runtime-Snapshot.
</Note>

## Empfohlen: Gilden-Arbeitsbereich einrichten

Sobald DMs funktionieren, können Sie Ihren Discord-Server als vollständigen Arbeitsbereich einrichten, in dem jeder Kanal seine eigene Agentensitzung mit eigenem Kontext erhält. Dies wird für private Server empfohlen, auf denen nur Sie und Ihr Bot sind.

<Steps>
  <Step title="Ihren Server zur Gilden-Zulassungsliste hinzufügen">
    Dadurch kann Ihr Agent in jedem Kanal auf Ihrem Server antworten, nicht nur in DMs.

    <Tabs>
      <Tab title="Ihren Agenten fragen">
        > „Fügen Sie meine Discord Server ID `<server_id>` zur Gilden-Zulassungsliste hinzu“
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

  <Step title="Antworten ohne @mention zulassen">
    Standardmäßig antwortet Ihr Agent in Gildenkanälen nur, wenn er @erwähnt wird. Für einen privaten Server möchten Sie wahrscheinlich, dass er auf jede Nachricht antwortet.

    In Gildenkanälen bleiben normale finale Assistentenantworten standardmäßig privat. Sichtbare Discord-Ausgabe muss explizit mit dem Tool `message` gesendet werden, sodass der Agent standardmäßig mitlesen und nur posten kann, wenn er entscheidet, dass eine Kanalantwort nützlich ist.

    Das bedeutet, dass das ausgewählte Modell zuverlässig Tools aufrufen muss. Wenn Discord Tippen anzeigt und die Logs Token-Nutzung zeigen, aber keine Nachricht gepostet wird, prüfen Sie das Sitzungslog auf Assistententext mit `didSendViaMessagingTool: false`. Das bedeutet, dass das Modell eine private finale Antwort erzeugt hat, statt `message(action=send)` aufzurufen. Wechseln Sie zu einem stärkeren Tool-Calling-Modell oder verwenden Sie die folgende Konfiguration, um ältere automatische finale Antworten wiederherzustellen.

    <Tabs>
      <Tab title="Ihren Agenten fragen">
        > „Erlauben Sie meinem Agenten, auf diesem Server zu antworten, ohne @erwähnt werden zu müssen“
      </Tab>
      <Tab title="Konfiguration">
        Setzen Sie `requireMention: false` in Ihrer Gildenkonfiguration:

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

        Um ältere automatische finale Antworten für Gruppen-/Kanalräume wiederherzustellen, setzen Sie `messages.groupChat.visibleReplies: "automatic"`.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Speicher in Gildenkanälen einplanen">
    Standardmäßig wird Langzeitspeicher (MEMORY.md) nur in DM-Sitzungen geladen. Gildenkanäle laden MEMORY.md nicht automatisch.

    <Tabs>
      <Tab title="Ihren Agenten fragen">
        > „Wenn ich Fragen in Discord-Kanälen stelle, verwenden Sie memory_search oder memory_get, wenn Sie Langzeitkontext aus MEMORY.md benötigen.“
      </Tab>
      <Tab title="Manuell">
        Wenn Sie gemeinsamen Kontext in jedem Kanal benötigen, legen Sie die stabilen Anweisungen in `AGENTS.md` oder `USER.md` ab (sie werden für jede Sitzung injiziert). Bewahren Sie Langzeitnotizen in `MEMORY.md` auf und greifen Sie bei Bedarf mit Speicher-Tools darauf zu.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Erstellen Sie nun einige Kanäle auf Ihrem Discord-Server und beginnen Sie zu chatten. Ihr Agent kann den Kanalnamen sehen, und jeder Kanal erhält seine eigene isolierte Sitzung — Sie können also `#coding`, `#home`, `#research` oder etwas anderes einrichten, das zu Ihrem Workflow passt.

## Runtime-Modell

- Der Gateway besitzt die Discord-Verbindung.
- Das Reply-Routing ist deterministisch: Eingehende Discord-Antworten gehen zurück an Discord.
- Discord-Guild-/Kanalmetadaten werden dem Modell-Prompt als nicht vertrauenswürdiger
  Kontext hinzugefügt, nicht als für Benutzer sichtbares Antwortpräfix. Wenn ein Modell diesen Umschlag
  zurückkopiert, entfernt OpenClaw die kopierten Metadaten aus ausgehenden Antworten und aus
  zukünftigem Replay-Kontext.
- Standardmäßig (`session.dmScope=main`) teilen direkte Chats die Hauptsitzung des Agenten (`agent:main:main`).
- Guild-Kanäle sind isolierte Sitzungsschlüssel (`agent:<agentId>:discord:channel:<channelId>`).
- Gruppen-DMs werden standardmäßig ignoriert (`channels.discord.dm.groupEnabled=false`).
- Native Slash-Befehle werden in isolierten Befehlssitzungen ausgeführt (`agent:<agentId>:discord:slash:<userId>`), tragen aber weiterhin `CommandTargetSessionKey` zur gerouteten Konversationssitzung.
- Die reine Textauslieferung von Cron-/Heartbeat-Ankündigungen an Discord verwendet die finale,
  für den Assistant sichtbare Antwort genau einmal. Medien und strukturierte Komponenten-Payloads bleiben
  mehrteilig, wenn der Agent mehrere zustellbare Payloads ausgibt.

## Forumkanäle

Discord-Forum- und Medienkanäle akzeptieren nur Thread-Beiträge. OpenClaw unterstützt zwei Möglichkeiten, sie zu erstellen:

- Senden Sie eine Nachricht an das übergeordnete Forum (`channel:<forumId>`), um automatisch einen Thread zu erstellen. Der Thread-Titel verwendet die erste nicht leere Zeile Ihrer Nachricht.
- Verwenden Sie `openclaw message thread create`, um einen Thread direkt zu erstellen. Übergeben Sie für Forumkanäle nicht `--message-id`.

Beispiel: An das übergeordnete Forum senden, um einen Thread zu erstellen

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Beispiel: Einen Forum-Thread explizit erstellen

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Übergeordnete Foren akzeptieren keine Discord-Komponenten. Wenn Sie Komponenten benötigen, senden Sie an den Thread selbst (`channel:<threadId>`).

## Interaktive Komponenten

OpenClaw unterstützt Discord-Komponenten-v2-Container für Agent-Nachrichten. Verwenden Sie das Nachrichtentool mit einem `components`-Payload. Interaktionsergebnisse werden als normale eingehende Nachrichten zurück an den Agenten geroutet und folgen den bestehenden Discord-Einstellungen für `replyToMode`.

Unterstützte Blöcke:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Aktionszeilen erlauben bis zu 5 Buttons oder ein einzelnes Auswahlmenü
- Auswahltypen: `string`, `user`, `role`, `mentionable`, `channel`

Standardmäßig sind Komponenten nur einmal verwendbar. Setzen Sie `components.reusable=true`, damit Buttons, Auswahlfelder und Formulare bis zum Ablauf mehrfach verwendet werden können.

Um einzuschränken, wer auf einen Button klicken kann, setzen Sie `allowedUsers` für diesen Button (Discord-Benutzer-IDs, Tags oder `*`). Wenn konfiguriert, erhalten nicht passende Benutzer eine ephemere Ablehnung.

Die Slash-Befehle `/model` und `/models` öffnen eine interaktive Modellauswahl mit Provider-, Modell- und kompatiblen Runtime-Dropdowns sowie einem Absenden-Schritt. `/models add` ist veraltet und gibt nun eine Veraltungsmeldung zurück, statt Modelle aus dem Chat zu registrieren. Die Antwort der Auswahl ist ephemer und nur der aufrufende Benutzer kann sie verwenden.

Dateianhänge:

- `file`-Blöcke müssen auf eine Anhangsreferenz zeigen (`attachment://<filename>`)
- Stellen Sie den Anhang über `media`/`path`/`filePath` bereit (einzelne Datei); verwenden Sie `media-gallery` für mehrere Dateien
- Verwenden Sie `filename`, um den Upload-Namen zu überschreiben, wenn er der Anhangsreferenz entsprechen soll

Modale Formulare:

- Fügen Sie `components.modal` mit bis zu 5 Feldern hinzu
- Feldtypen: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw fügt automatisch einen Trigger-Button hinzu

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
    `channels.discord.dmPolicy` steuert den DM-Zugriff. `channels.discord.allowFrom` ist die kanonische DM-Allowlist.

    - `pairing` (Standard)
    - `allowlist`
    - `open` (erfordert, dass `channels.discord.allowFrom` `"*"` enthält)
    - `disabled`

    Wenn die DM-Richtlinie nicht offen ist, werden unbekannte Benutzer blockiert (oder im Modus `pairing` zur Kopplung aufgefordert).

    Priorität bei mehreren Konten:

    - `channels.discord.accounts.default.allowFrom` gilt nur für das Konto `default`.
    - Für ein Konto hat `allowFrom` Vorrang vor dem Legacy-Wert `dm.allowFrom`.
    - Benannte Konten erben `channels.discord.allowFrom`, wenn ihr eigenes `allowFrom` und der Legacy-Wert `dm.allowFrom` nicht gesetzt sind.
    - Benannte Konten erben `channels.discord.accounts.default.allowFrom` nicht.

    Die Legacy-Werte `channels.discord.dm.policy` und `channels.discord.dm.allowFrom` werden aus Kompatibilitätsgründen weiterhin gelesen. `openclaw doctor --fix` migriert sie zu `dmPolicy` und `allowFrom`, wenn dies ohne Änderung des Zugriffs möglich ist.

    DM-Zielformat für die Zustellung:

    - `user:<id>`
    - `<@id>`-Erwähnung

    Reine numerische IDs werden normalerweise als Kanal-IDs aufgelöst, wenn ein Kanalstandard aktiv ist, aber IDs, die in der effektiven DM-`allowFrom` des Kontos aufgeführt sind, werden aus Kompatibilitätsgründen als Benutzer-DM-Ziele behandelt.

  </Tab>

  <Tab title="DM-Zugriffsgruppen">
    Discord-DMs können dynamische `accessGroup:<name>`-Einträge in `channels.discord.allowFrom` verwenden.

    Zugriffsgruppennamen werden kanalübergreifend geteilt. Verwenden Sie `type: "message.senders"` für eine statische Gruppe, deren Mitglieder in der normalen `allowFrom`-Syntax des jeweiligen Kanals angegeben werden, oder `type: "discord.channelAudience"`, wenn die aktuelle `ViewChannel`-Zielgruppe eines Discord-Kanals die Mitgliedschaft dynamisch definieren soll. Das gemeinsame Verhalten von Zugriffsgruppen ist hier dokumentiert: [Zugriffsgruppen](/de/channels/access-groups).

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        "*": ["global-owner-id"],
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
      },
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators"],
    },
  },
}
```

    Ein Discord-Textkanal hat keine separate Mitgliederliste. `type: "discord.channelAudience"` modelliert die Mitgliedschaft so: Der DM-Absender ist Mitglied der konfigurierten Guild und verfügt aktuell über die effektive Berechtigung `ViewChannel` für den konfigurierten Kanal, nachdem Rollen- und Kanalüberschreibungen angewendet wurden.

    Beispiel: Allen, die `#maintainers` sehen können, erlauben, dem Bot eine DM zu senden, während DMs für alle anderen geschlossen bleiben.

```json5
{
  accessGroups: {
    maintainers: {
      type: "discord.channelAudience",
      guildId: "1456350064065904867",
      channelId: "1456744319972282449",
      membership: "canViewChannel",
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:maintainers"],
    },
  },
}
```

    Sie können dynamische und statische Einträge mischen:

```json5
{
  accessGroups: {
    maintainers: {
      type: "discord.channelAudience",
      guildId: "1456350064065904867",
      channelId: "1456744319972282449",
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:maintainers", "discord:123456789012345678"],
    },
  },
}
```

    Lookups schlagen geschlossen fehl. Wenn Discord `Missing Access` zurückgibt, der Mitglieder-Lookup fehlschlägt oder der Kanal zu einer anderen Guild gehört, wird der DM-Absender als nicht autorisiert behandelt.

    Aktivieren Sie im Discord Developer Portal **Server Members Intent** für den Bot, wenn Sie kanalzielgruppenbasierte Zugriffsgruppen verwenden. DMs enthalten keinen Guild-Mitgliederstatus, daher löst OpenClaw das Mitglied zum Autorisierungszeitpunkt über Discord REST auf.

  </Tab>

  <Tab title="Guild-Richtlinie">
    Die Guild-Behandlung wird durch `channels.discord.groupPolicy` gesteuert:

    - `open`
    - `allowlist`
    - `disabled`

    Die sichere Basis, wenn `channels.discord` vorhanden ist, ist `allowlist`.

    Verhalten von `allowlist`:

    - Guild muss `channels.discord.guilds` entsprechen (`id` bevorzugt, Slug akzeptiert)
    - optionale Absender-Allowlists: `users` (stabile IDs empfohlen) und `roles` (nur Rollen-IDs); wenn eine davon konfiguriert ist, sind Absender erlaubt, wenn sie `users` ODER `roles` entsprechen
    - direkte Namens-/Tag-Übereinstimmung ist standardmäßig deaktiviert; aktivieren Sie `channels.discord.dangerouslyAllowNameMatching: true` nur als Break-Glass-Kompatibilitätsmodus
    - Namen/Tags werden für `users` unterstützt, IDs sind jedoch sicherer; `openclaw security audit` warnt, wenn Namens-/Tag-Einträge verwendet werden
    - wenn für eine Guild `channels` konfiguriert ist, werden nicht aufgeführte Kanäle abgelehnt
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

    Wenn Sie nur `DISCORD_BOT_TOKEN` setzen und keinen `channels.discord`-Block erstellen, ist der Runtime-Fallback `groupPolicy="allowlist"` (mit einer Warnung in Logs), selbst wenn `channels.defaults.groupPolicy` `open` ist.

  </Tab>

  <Tab title="Erwähnungen und Gruppen-DMs">
    Guild-Nachrichten erfordern standardmäßig eine Erwähnung.

    Die Erwähnungserkennung umfasst:

    - explizite Bot-Erwähnung
    - konfigurierte Erwähnungsmuster (`agents.list[].groupChat.mentionPatterns`, Fallback `messages.groupChat.mentionPatterns`)
    - implizites Antwort-an-Bot-Verhalten in unterstützten Fällen

    Verwenden Sie beim Schreiben ausgehender Discord-Nachrichten die kanonische Erwähnungssyntax: `<@USER_ID>` für Benutzer, `<#CHANNEL_ID>` für Kanäle und `<@&ROLE_ID>` für Rollen. Verwenden Sie nicht die Legacy-Nickname-Erwähnungsform `<@!USER_ID>`.

    `requireMention` wird pro Guild/Kanal konfiguriert (`channels.discord.guilds...`).
    `ignoreOtherMentions` verwirft optional Nachrichten, die einen anderen Benutzer/eine andere Rolle, aber nicht den Bot erwähnen (ausgenommen @everyone/@here).

    Gruppen-DMs:

    - Standard: ignoriert (`dm.groupEnabled=false`)
    - optionale Allowlist über `dm.groupChannels` (Kanal-IDs oder Slugs)

  </Tab>
</Tabs>

### Rollenbasiertes Agent-Routing

Verwenden Sie `bindings[].match.roles`, um Discord-Guild-Mitglieder nach Rollen-ID an verschiedene Agenten zu routen. Rollenbasierte Bindings akzeptieren nur Rollen-IDs und werden nach Peer- oder Parent-Peer-Bindings und vor reinen Guild-Bindings ausgewertet. Wenn ein Binding auch andere Match-Felder setzt (zum Beispiel `peer` + `guildId` + `roles`), müssen alle konfigurierten Felder übereinstimmen.

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

## Native Befehle und Befehlsautorisierung

- `commands.native` ist standardmäßig `"auto"` und ist für Discord aktiviert.
- Kanalbezogene Überschreibung: `channels.discord.commands.native`.
- `commands.native=false` überspringt beim Start die Registrierung und Bereinigung von Discord-Slash-Befehlen. Zuvor registrierte Befehle können in Discord sichtbar bleiben, bis Sie sie aus der Discord-App entfernen.
- Die Authentifizierung nativer Befehle verwendet dieselben Discord-Erlaubnislisten/Richtlinien wie die normale Nachrichtenverarbeitung.
- Befehle können in der Discord-Benutzeroberfläche weiterhin für nicht autorisierte Benutzer sichtbar sein; die Ausführung erzwingt dennoch die OpenClaw-Authentifizierung und gibt "not authorized" zurück.

Siehe [Slash-Befehle](/de/tools/slash-commands) für Befehlskatalog und Verhalten.

Standardeinstellungen für Slash-Befehle:

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

    Hinweis: `off` deaktiviert implizites Reply-Threading. Explizite `[[reply_to_*]]`-Tags werden weiterhin beachtet.
    `first` hängt die implizite native Antwortreferenz immer an die erste ausgehende Discord-Nachricht des Turns an.
    `batched` hängt die implizite native Antwortreferenz von Discord nur an, wenn der
    eingehende Turn ein entprellter Batch aus mehreren Nachrichten war. Das ist nützlich,
    wenn Sie native Antworten hauptsächlich für mehrdeutige, stoßweise Chats möchten, nicht für jeden
    einzelnen Turn mit nur einer Nachricht.

    Nachrichten-IDs werden in Kontext/Verlauf verfügbar gemacht, damit Agenten gezielt bestimmte Nachrichten adressieren können.

  </Accordion>

  <Accordion title="Live-Stream-Vorschau">
    OpenClaw kann Antwortentwürfe streamen, indem es eine temporäre Nachricht sendet und sie bearbeitet, sobald Text eintrifft. `channels.discord.streaming` akzeptiert `off` | `partial` | `block` | `progress` (Standard). `progress` behält einen bearbeitbaren Statusentwurf bei und aktualisiert ihn mit Tool-Fortschritt bis zur finalen Zustellung; `streamMode` ist ein Legacy-Runtime-Alias. Führen Sie `openclaw doctor --fix` aus, um persistierte Konfiguration auf den kanonischen Schlüssel umzuschreiben.

    Setzen Sie `channels.discord.streaming.mode` auf `off`, um Discord-Vorschaubearbeitungen zu deaktivieren. Wenn Discord-Block-Streaming explizit aktiviert ist, überspringt OpenClaw den Vorschau-Stream, um doppeltes Streaming zu vermeiden.

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto",
          maxLines: 8,
          toolProgress: true,
        },
      },
    },
  },
}
```

    - `partial` bearbeitet eine einzelne Vorschaunachricht, während Tokens eintreffen.
    - `block` gibt entwurfsgrößenbasierte Chunks aus (verwenden Sie `draftChunk`, um Größe und Umbruchpunkte feinzujustieren, begrenzt durch `textChunkLimit`).
    - Medien, Fehler und finale Antworten mit explizitem Reply brechen ausstehende Vorschaubearbeitungen ab.
    - `streaming.preview.toolProgress` (Standard `true`) steuert, ob Tool-/Fortschrittsaktualisierungen die Vorschaunachricht wiederverwenden.
    - `streaming.preview.commandText` / `streaming.progress.commandText` steuert Befehls-/Ausführungsdetails in kompakten Fortschrittszeilen: `raw` (Standard) oder `status` (nur Tool-Label).

    Rohtext von Befehlen/Ausführungen ausblenden, aber kompakte Fortschrittszeilen beibehalten:

    ```json
    {
      "channels": {
        "discord": {
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

    Vorschau-Streaming ist rein textbasiert; Medienantworten fallen auf normale Zustellung zurück. Wenn `block`-Streaming explizit aktiviert ist, überspringt OpenClaw den Vorschau-Stream, um doppeltes Streaming zu vermeiden.

  </Accordion>

  <Accordion title="Verlauf, Kontext und Thread-Verhalten">
    Guild-Verlaufskontext:

    - `channels.discord.historyLimit` Standard `20`
    - Fallback: `messages.groupChat.historyLimit`
    - `0` deaktiviert

    DM-Verlaufssteuerung:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Thread-Verhalten:

    - Discord-Threads werden als Kanalsitzungen geroutet und erben die Konfiguration des übergeordneten Kanals, sofern nicht überschrieben.
    - Thread-Sitzungen erben die sitzungsbezogene `/model`-Auswahl des übergeordneten Kanals als reinen Modell-Fallback; threadlokale `/model`-Auswahlen haben weiterhin Vorrang, und der Transkriptverlauf des übergeordneten Kanals wird nicht kopiert, sofern Transkriptvererbung nicht aktiviert ist.
    - `channels.discord.thread.inheritParent` (Standard `false`) lässt neue Auto-Threads aus dem übergeordneten Transkript vorbefüllt werden. Kontospezifische Überschreibungen liegen unter `channels.discord.accounts.<id>.thread.inheritParent`.
    - Message-Tool-Reaktionen können `user:<id>`-DM-Ziele auflösen.
    - `guilds.<guild>.channels.<channel>.requireMention: false` bleibt während des Fallbacks für die Aktivierung in der Antwortphase erhalten.

    Kanalthemen werden als **nicht vertrauenswürdiger** Kontext injiziert. Erlaubnislisten steuern, wer den Agenten auslösen kann, sie sind keine vollständige Grenze für das Redigieren von Zusatzkontext.

  </Accordion>

  <Accordion title="Thread-gebundene Sitzungen für Subagenten">
    Discord kann einen Thread an ein Sitzungsziel binden, sodass Folgenachrichten in diesem Thread weiterhin an dieselbe Sitzung geroutet werden (einschließlich Subagent-Sitzungen).

    Befehle:

    - `/focus <target>` aktuellen/neuen Thread an ein Subagent-/Sitzungsziel binden
    - `/unfocus` aktuelle Thread-Bindung entfernen
    - `/agents` aktive Läufe und Bindungsstatus anzeigen
    - `/session idle <duration|off>` inaktivitätsbasierte automatische Entfokussierung für fokussierte Bindungen prüfen/aktualisieren
    - `/session max-age <duration|off>` hartes Höchstalter für fokussierte Bindungen prüfen/aktualisieren

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
        spawnSessions: true,
        defaultSpawnContext: "fork",
      },
    },
  },
}
```

    Hinweise:

    - `session.threadBindings.*` legt globale Standardwerte fest.
    - `channels.discord.threadBindings.*` überschreibt das Discord-Verhalten.
    - `spawnSessions` steuert das automatische Erstellen/Binden von Threads für `sessions_spawn({ thread: true })` und ACP-Thread-Spawns. Standard: `true`.
    - `defaultSpawnContext` steuert den nativen Subagent-Kontext für Thread-gebundene Spawns. Standard: `"fork"`.
    - Veraltete Schlüssel `spawnSubagentSessions`/`spawnAcpSessions` werden durch `openclaw doctor --fix` migriert.
    - Wenn Thread-Bindungen für ein Konto deaktiviert sind, sind `/focus` und zugehörige Thread-Bindungsvorgänge nicht verfügbar.

    Siehe [Subagenten](/de/tools/subagents), [ACP-Agenten](/de/tools/acp-agents) und [Konfigurationsreferenz](/de/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Persistente ACP-Kanalbindungen">
    Für stabile, dauerhaft aktive ACP-Arbeitsbereiche konfigurieren Sie typisierte ACP-Bindungen auf oberster Ebene, die auf Discord-Unterhaltungen zielen.

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

    - `/acp spawn codex --bind here` bindet den aktuellen Kanal oder Thread direkt und belässt zukünftige Nachrichten in derselben ACP-Sitzung. Thread-Nachrichten erben die Bindung des übergeordneten Kanals.
    - In einem gebundenen Kanal oder Thread setzen `/new` und `/reset` dieselbe ACP-Sitzung direkt zurück. Temporäre Thread-Bindungen können die Zielauflösung überschreiben, solange sie aktiv sind.
    - `spawnSessions` steuert das Erstellen/Binden von Child-Threads über `--thread auto|here`.

    Siehe [ACP-Agenten](/de/tools/acp-agents) für Details zum Bindungsverhalten.

  </Accordion>

  <Accordion title="Reaktionsbenachrichtigungen">
    Benachrichtigungsmodus für Reaktionen pro Guild:

    - `off`
    - `own` (Standard)
    - `all`
    - `allowlist` (verwendet `guilds.<id>.users`)

    Reaktionsereignisse werden in Systemereignisse umgewandelt und an die geroutete Discord-Sitzung angehängt.

  </Accordion>

  <Accordion title="Ack-Reaktionen">
    `ackReaction` sendet ein Bestätigungs-Emoji, während OpenClaw eine eingehende Nachricht verarbeitet.

    Auflösungsreihenfolge:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - Fallback auf Agent-Identitäts-Emoji (`agents.list[].identity.emoji`, sonst "👀")

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
    Leiten Sie Discord-Gateway-WebSocket-Datenverkehr und REST-Startabfragen (Anwendungs-ID + Erlaubnislistenauflösung) über einen HTTP(S)-Proxy mit `channels.discord.proxy`.

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
    Aktivieren Sie die PluralKit-Auflösung, um geproxte Nachrichten einer Systemmitglied-Identität zuzuordnen:

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // optional; needed for private systems
      },
    },
  },
}
```

    Hinweise:

    - Erlaubnislisten können `pk:<memberId>` verwenden
    - Anzeigenamen von Mitgliedern werden nur nach Name/Slug abgeglichen, wenn `channels.discord.dangerouslyAllowNameMatching: true`
    - Abfragen verwenden die ursprüngliche Nachrichten-ID und sind zeitfensterbeschränkt
    - Wenn die Abfrage fehlschlägt, werden geproxte Nachrichten als Bot-Nachrichten behandelt und verworfen, sofern `allowBots=true` nicht gesetzt ist

  </Accordion>

  <Accordion title="Ausgehende Erwähnungsaliasse">
    Verwenden Sie `mentionAliases`, wenn Agenten deterministische ausgehende Erwähnungen für bekannte Discord-Benutzer benötigen. Schlüssel sind Handles ohne führendes `@`; Werte sind Discord-Benutzer-IDs. Unbekannte Handles, `@everyone`, `@here` und Erwähnungen innerhalb von Markdown-Code-Spans bleiben unverändert.

```json5
{
  channels: {
    discord: {
      mentionAliases: {
        Vladislava: "123456789012345678",
      },
      accounts: {
        ops: {
          mentionAliases: {
            OpsLead: "234567890123456789",
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="Presence-Konfiguration">
    Presence-Aktualisierungen werden angewendet, wenn Sie ein Status- oder Aktivitätsfeld setzen oder Auto-Presence aktivieren.

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

    Aktivitätsbeispiel (benutzerdefinierter Status ist der Standardaktivitätstyp):

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

    - 0: Spielt
    - 1: Streaming (erfordert `activityUrl`)
    - 2: Hört
    - 3: Schaut
    - 4: Benutzerdefiniert (verwendet den Aktivitätstext als Statuszustand; Emoji ist optional)
    - 5: Nimmt teil

    Auto-Presence-Beispiel (Runtime-Integritätssignal):

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

    Automatische Präsenz bildet die Laufzeitverfügbarkeit auf den Discord-Status ab: fehlerfrei => online, beeinträchtigt oder unbekannt => idle, erschöpft oder nicht verfügbar => dnd. Optionale Textüberschreibungen:

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

    Discord aktiviert native Exec-Genehmigungen automatisch, wenn `enabled` nicht gesetzt oder `"auto"` ist und mindestens ein Genehmiger aufgelöst werden kann, entweder aus `execApprovals.approvers` oder aus `commands.ownerAllowFrom`. Discord leitet Exec-Genehmiger nicht aus Kanal-`allowFrom`, dem Legacy-`dm.allowFrom` oder Direktnachrichten-`defaultTo` ab. Setzen Sie `enabled: false`, um Discord explizit als nativen Genehmigungsclient zu deaktivieren.

    Für sensible, nur Ownern vorbehaltene Gruppenbefehle wie `/diagnostics` und `/export-trajectory` sendet OpenClaw Genehmigungsaufforderungen und Endergebnisse privat. Es versucht zuerst eine Discord-DM, wenn der aufrufende Owner eine Discord-Owner-Route hat; wenn diese nicht verfügbar ist, fällt es auf die erste verfügbare Owner-Route aus `commands.ownerAllowFrom` zurück, etwa Telegram.

    Wenn `target` `channel` oder `both` ist, ist die Genehmigungsaufforderung im Kanal sichtbar. Nur aufgelöste Genehmiger können die Buttons verwenden; andere Nutzer erhalten eine ephemere Ablehnung. Genehmigungsaufforderungen enthalten den Befehlstext. Aktivieren Sie die Zustellung im Kanal daher nur in vertrauenswürdigen Kanälen. Wenn die Kanal-ID nicht aus dem Sitzungsschlüssel abgeleitet werden kann, fällt OpenClaw auf die Zustellung per DM zurück.

    Discord rendert außerdem die gemeinsamen Genehmigungsbuttons, die von anderen Chat-Kanälen verwendet werden. Der native Discord-Adapter ergänzt hauptsächlich das DM-Routing für Genehmiger und das Auffächern in Kanäle.
    Wenn diese Buttons vorhanden sind, sind sie die primäre Genehmigungs-UX; OpenClaw
    sollte nur dann einen manuellen `/approve`-Befehl einfügen, wenn das Tool-Ergebnis besagt,
    dass Chat-Genehmigungen nicht verfügbar sind oder die manuelle Genehmigung der einzige Weg ist.
    Wenn die native Discord-Genehmigungslaufzeit nicht aktiv ist, hält OpenClaw die
    lokale deterministische `/approve <id> <decision>`-Aufforderung sichtbar. Wenn die
    Laufzeit aktiv ist, aber keine native Karte an irgendein Ziel zugestellt werden kann,
    sendet OpenClaw eine Fallback-Mitteilung im selben Chat mit dem exakten `/approve`-
    Befehl aus der ausstehenden Genehmigung.

    Gateway-Authentifizierung und Genehmigungsauflösung folgen dem gemeinsamen Gateway-Client-Vertrag (`plugin:`-IDs werden über `plugin.approval.resolve` aufgelöst; andere IDs über `exec.approval.resolve`). Genehmigungen laufen standardmäßig nach 30 Minuten ab.

    Siehe [Exec-Genehmigungen](/de/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Tools und Aktions-Gates

Discord-Nachrichtenaktionen umfassen Messaging, Kanaladministration, Moderation, Präsenz und Metadatenaktionen.

Kernbeispiele:

- Messaging: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- Reaktionen: `react`, `reactions`, `emojiList`
- Moderation: `timeout`, `kick`, `ban`
- Präsenz: `setPresence`

Die Aktion `event-create` akzeptiert einen optionalen Parameter `image` (URL oder lokaler Dateipfad), um das Titelbild des geplanten Events festzulegen.

Aktions-Gates befinden sich unter `channels.discord.actions.*`.

Standardverhalten der Gates:

| Aktionsgruppe                                                                                                                                                           | Standard     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------ |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | aktiviert    |
| roles                                                                                                                                                                    | deaktiviert  |
| moderation                                                                                                                                                               | deaktiviert  |
| presence                                                                                                                                                                 | deaktiviert  |

## Components-v2-UI

OpenClaw verwendet Discord-Komponenten v2 für Exec-Genehmigungen und kontextübergreifende Marker. Discord-Nachrichtenaktionen können außerdem `components` für benutzerdefinierte UI akzeptieren (fortgeschritten; erfordert das Erstellen einer Komponenten-Payload über das Discord-Tool), während Legacy-`embeds` weiterhin verfügbar sind, aber nicht empfohlen werden.

- `channels.discord.ui.components.accentColor` legt die Akzentfarbe fest, die von Discord-Komponentencontainern verwendet wird (Hex).
- Pro Account mit `channels.discord.accounts.<id>.ui.components.accentColor` festlegen.
- `embeds` werden ignoriert, wenn Komponenten v2 vorhanden sind.

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

Discord hat zwei unterschiedliche Sprachoberflächen: Echtzeit-**Sprachkanäle** (fortlaufende Gespräche) und **Sprachnachrichtenanhänge** (das Wellenform-Vorschauformat). Das Gateway unterstützt beides.

### Sprachkanäle

Einrichtungs-Checkliste:

1. Aktivieren Sie Message Content Intent im Discord Developer Portal.
2. Aktivieren Sie Server Members Intent, wenn Rollen-/Nutzer-Allowlisten verwendet werden.
3. Laden Sie den Bot mit den Scopes `bot` und `applications.commands` ein.
4. Gewähren Sie Connect, Speak, Send Messages und Read Message History im Ziel-Sprachkanal.
5. Aktivieren Sie native Befehle (`commands.native` oder `channels.discord.commands.native`).
6. Konfigurieren Sie `channels.discord.voice`.

Verwenden Sie `/vc join|leave|status`, um Sitzungen zu steuern. Der Befehl verwendet den Standard-Agent des Accounts und folgt denselben Allowlist- und Gruppenrichtlinienregeln wie andere Discord-Befehle.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

Um die effektiven Berechtigungen des Bots vor dem Beitreten zu prüfen, führen Sie aus:

```bash
openclaw channels capabilities --channel discord --target channel:<voice-channel-id>
```

Auto-Join-Beispiel:

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
        connectTimeoutMs: 30000,
        reconnectGraceMs: 15000,
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
- `voice.model` überschreibt nur das LLM, das für Discord-Sprachkanalantworten verwendet wird. Lassen Sie es ungesetzt, um das Modell des gerouteten Agent zu übernehmen.
- STT verwendet `tools.media.audio`; `voice.model` beeinflusst die Transkription nicht.
- Discord-`systemPrompt`-Überschreibungen pro Kanal gelten für Sprachtranskript-Turns dieses Sprachkanals.
- Sprachtranskript-Turns leiten den Owner-Status aus Discord-`allowFrom` (oder `dm.allowFrom`) ab; Sprecher ohne Owner-Status können nicht auf Owner-only-Tools zugreifen (zum Beispiel `gateway` und `cron`).
- Discord-Sprache ist für reine Textkonfigurationen Opt-in; setzen Sie `channels.discord.voice.enabled=true` (oder behalten Sie einen vorhandenen `channels.discord.voice`-Block bei), um `/vc`-Befehle, die Sprachlaufzeit und den Gateway-Intent `GuildVoiceStates` zu aktivieren.
- `channels.discord.intents.voiceStates` kann das Abonnement des Voice-State-Intents explizit überschreiben. Lassen Sie es ungesetzt, damit der Intent der effektiven Sprachaktivierung folgt.
- `voice.daveEncryption` und `voice.decryptionFailureTolerance` werden an die Join-Optionen von `@discordjs/voice` durchgereicht.
- Die Standardwerte von `@discordjs/voice` sind `daveEncryption=true` und `decryptionFailureTolerance=24`, wenn sie ungesetzt sind.
- `voice.connectTimeoutMs` steuert das anfängliche Warten auf `@discordjs/voice` Ready für `/vc join` und Auto-Join-Versuche. Standard: `30000`.
- `voice.reconnectGraceMs` steuert, wie lange OpenClaw wartet, bis eine getrennte Sprachsitzung mit dem Wiederverbinden beginnt, bevor sie zerstört wird. Standard: `15000`.
- Die Sprachwiedergabe stoppt nicht allein deshalb, weil ein anderer Nutzer zu sprechen beginnt. Um Feedback-Schleifen zu vermeiden, ignoriert OpenClaw neue Sprachaufnahmen, während TTS wiedergegeben wird; sprechen Sie nach Ende der Wiedergabe für den nächsten Turn.
- `voice.captureSilenceGraceMs` steuert, wie lange OpenClaw wartet, nachdem Discord gemeldet hat, dass ein Sprecher aufgehört hat, bevor dieses Audiosegment für STT finalisiert wird. Standard: `2500`; erhöhen Sie diesen Wert, wenn Discord normale Pausen in abgehackte Teiltranskripte aufteilt.
- Wenn ElevenLabs der ausgewählte TTS-Provider ist, verwendet die Discord-Sprachwiedergabe Streaming-TTS und beginnt aus dem Antwortstream des Providers. Provider ohne Streaming-Unterstützung fallen auf den synthetisierten temporären Dateipfad zurück.
- OpenClaw überwacht außerdem Entschlüsselungsfehler beim Empfangen und stellt sich automatisch wieder her, indem es den Sprachkanal nach wiederholten Fehlern in einem kurzen Zeitfenster verlässt und erneut beitritt.
- Wenn Empfangslogs nach einer Aktualisierung wiederholt `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` anzeigen, sammeln Sie einen Abhängigkeitsbericht und Logs. Die gebündelte `@discordjs/voice`-Linie enthält den Upstream-Padding-Fix aus discord.js-PR #11449, der discord.js-Issue #11419 geschlossen hat.
- Empfangsereignisse vom Typ `The operation was aborted` sind erwartet, wenn OpenClaw ein erfasstes Sprechersegment finalisiert; sie sind ausführliche Diagnosen, keine Warnungen.

Sprachkanal-Pipeline:

- Discord-PCM-Erfassung wird in eine temporäre WAV-Datei konvertiert.
- `tools.media.audio` verarbeitet STT, zum Beispiel `openai/gpt-4o-mini-transcribe`.
- Das Transkript wird durch Discord-Ingress und -Routing gesendet, während das Antwort-LLM mit einer Voice-Output-Richtlinie läuft, die das Agent-Tool `tts` ausblendet und zurückgegebenen Text anfordert, da Discord-Sprache die finale TTS-Wiedergabe besitzt.
- `voice.model` überschreibt, wenn gesetzt, nur das Antwort-LLM für diesen Sprachkanal-Turn.
- `voice.tts` wird über `messages.tts` gemischt; streamingfähige Provider speisen den Player direkt, andernfalls wird die resultierende Audiodatei im beigetretenen Kanal abgespielt.

Anmeldedaten werden pro Komponente aufgelöst: LLM-Routen-Authentifizierung für `voice.model`, STT-Authentifizierung für `tools.media.audio` und TTS-Authentifizierung für `messages.tts`/`voice.tts`.

### Sprachnachrichten

Discord-Sprachnachrichten zeigen eine Wellenformvorschau und erfordern OGG/Opus-Audio. OpenClaw erzeugt die Wellenform automatisch, benötigt aber `ffmpeg` und `ffprobe` auf dem Gateway-Host, um zu prüfen und zu konvertieren.

- Geben Sie einen **lokalen Dateipfad** an (URLs werden abgelehnt).
- Lassen Sie Textinhalt weg (Discord lehnt Text + Sprachnachricht in derselben Payload ab).
- Jedes Audioformat wird akzeptiert; OpenClaw konvertiert bei Bedarf zu OGG/Opus.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Nicht erlaubte Intents verwendet oder Bot sieht keine Guild-Nachrichten">

    - Message Content Intent aktivieren
    - Server Members Intent aktivieren, wenn Sie von Nutzer-/Member-Auflösung abhängen
    - Gateway nach dem Ändern von Intents neu starten

  </Accordion>

  <Accordion title="Guild-Nachrichten unerwartet blockiert">

    - `groupPolicy` prüfen
    - Guild-Allowlist unter `channels.discord.guilds` prüfen
    - wenn eine Guild-`channels`-Map vorhanden ist, sind nur aufgeführte Kanäle erlaubt
    - `requireMention`-Verhalten und Erwähnungsmuster prüfen

    Nützliche Prüfungen:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="requireMention false, aber weiterhin blockiert">
    Häufige Ursachen:

    - `groupPolicy="allowlist"` ohne passende Guild-/Channel-Allowlist
    - `requireMention` an der falschen Stelle konfiguriert (muss unter `channels.discord.guilds` oder dem Channel-Eintrag stehen)
    - Sender durch die Guild-/Channel-`users`-Allowlist blockiert

  </Accordion>

  <Accordion title="Lange Discord-Turns oder doppelte Antworten">

    Typische Logs:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Discord-Gateway-Warteschlangenoptionen:

    - Einzelkonto: `channels.discord.eventQueue.listenerTimeout`
    - Mehrere Konten: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - Dies steuert nur Listener-Arbeit des Discord-Gateway, nicht die Lebensdauer eines Agent-Turns

    Discord wendet kein channel-eigenes Timeout auf eingereihte Agent-Turns an. Message-Listener übergeben sofort, und eingereihte Discord-Läufe behalten die Reihenfolge pro Sitzung bei, bis der Sitzungs-/Tool-/Runtime-Lebenszyklus abgeschlossen ist oder die Arbeit abbricht.

```json5
{
  channels: {
    discord: {
      accounts: {
        default: {
          eventQueue: {
            listenerTimeout: 120000,
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="Timeout-Warnungen bei der Gateway-Metadatenabfrage">
    OpenClaw ruft Discord-`/gateway/bot`-Metadaten vor dem Verbinden ab. Vorübergehende Fehler fallen auf die Standard-Gateway-URL von Discord zurück und werden in Logs rate-limitiert.

    Metadaten-Timeout-Optionen:

    - Einzelkonto: `channels.discord.gatewayInfoTimeoutMs`
    - Mehrere Konten: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - Env-Fallback, wenn die Konfiguration nicht gesetzt ist: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - Standard: `30000` (30 Sekunden), Maximum: `120000`

  </Accordion>

  <Accordion title="Neustarts durch Gateway-READY-Timeout">
    OpenClaw wartet beim Start und nach Runtime-Neuverbindungen auf das Discord-Gateway-`READY`-Event. Setups mit mehreren Konten und gestaffeltem Start können ein längeres READY-Startfenster als den Standard benötigen.

    READY-Timeout-Optionen:

    - Start, Einzelkonto: `channels.discord.gatewayReadyTimeoutMs`
    - Start, mehrere Konten: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - Start-Env-Fallback, wenn die Konfiguration nicht gesetzt ist: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - Start-Standard: `15000` (15 Sekunden), Maximum: `120000`
    - Runtime, Einzelkonto: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - Runtime, mehrere Konten: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - Runtime-Env-Fallback, wenn die Konfiguration nicht gesetzt ist: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - Runtime-Standard: `30000` (30 Sekunden), Maximum: `120000`

  </Accordion>

  <Accordion title="Abweichungen bei der Berechtigungsprüfung">
    Berechtigungsprüfungen mit `channels status --probe` funktionieren nur für numerische Channel-IDs.

    Wenn Sie Slug-Schlüssel verwenden, kann Runtime-Matching weiterhin funktionieren, aber `probe` kann Berechtigungen nicht vollständig verifizieren.

  </Accordion>

  <Accordion title="DM- und Pairing-Probleme">

    - DM deaktiviert: `channels.discord.dm.enabled=false`
    - DM-Richtlinie deaktiviert: `channels.discord.dmPolicy="disabled"` (Legacy: `channels.discord.dm.policy`)
    - wartet im Modus `pairing` auf Pairing-Freigabe

  </Accordion>

  <Accordion title="Bot-zu-Bot-Schleifen">
    Standardmäßig werden von Bots verfasste Nachrichten ignoriert.

    Wenn Sie `channels.discord.allowBots=true` setzen, verwenden Sie strenge Mention- und Allowlist-Regeln, um Schleifenverhalten zu vermeiden.
    Bevorzugen Sie `channels.discord.allowBots="mentions"`, um nur Bot-Nachrichten zu akzeptieren, die den Bot erwähnen.

```json5
{
  channels: {
    discord: {
      accounts: {
        mantis: {
          // Mantis listens to other bots only when they mention her.
          allowBots: "mentions",
        },
        molty: {
          // Molty listens to all bot-authored Discord messages.
          allowBots: true,
          mentionAliases: {
            // Lets Molty write "@Mantis" and send a real Discord mention.
            Mantis: "MANTIS_DISCORD_USER_ID",
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="Voice-STT-Abbrüche mit DecryptionFailed(...)">

    - Halten Sie OpenClaw aktuell (`openclaw update`), damit die Wiederherstellungslogik für Discord-Voice-Empfang vorhanden ist
    - bestätigen Sie `channels.discord.voice.daveEncryption=true` (Standard)
    - beginnen Sie mit `channels.discord.voice.decryptionFailureTolerance=24` (Upstream-Standard) und passen Sie nur bei Bedarf an
    - beobachten Sie die Logs auf:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - wenn Fehler nach dem automatischen erneuten Beitreten weiterhin auftreten, sammeln Sie Logs und vergleichen Sie sie mit der Upstream-DAVE-Empfangshistorie in [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) und [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Konfigurationsreferenz

Primäre Referenz: [Konfigurationsreferenz - Discord](/de/gateway/config-channels#discord).

<Accordion title="Wichtige Discord-Felder">

- Start/Auth: `enabled`, `token`, `accounts.*`, `allowBots`
- Richtlinie: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- Befehl: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- Event-Warteschlange: `eventQueue.listenerTimeout` (Listener-Budget), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- Antwort/Verlauf: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- Zustellung: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- Streaming: `streaming` (Legacy-Alias: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- Medien/Wiederholung: `mediaMaxMb` (begrenzt ausgehende Discord-Uploads, Standard `100MB`), `retry`
- Aktionen: `actions.*`
- Präsenz: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- Features: `threadBindings`, Top-Level-`bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## Sicherheit und Betrieb

- Behandeln Sie Bot-Token als Secrets (`DISCORD_BOT_TOKEN` in überwachten Umgebungen bevorzugt).
- Gewähren Sie Discord-Berechtigungen nach dem Prinzip der geringsten Rechte.
- Wenn Command-Deployment/-Status veraltet ist, starten Sie das Gateway neu und prüfen Sie erneut mit `openclaw channels status --probe`.

## Verwandt

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/de/channels/pairing">
    Koppeln Sie einen Discord-Benutzer mit dem Gateway.
  </Card>
  <Card title="Gruppen" icon="users" href="/de/channels/groups">
    Gruppenchat- und Allowlist-Verhalten.
  </Card>
  <Card title="Channel-Routing" icon="route" href="/de/channels/channel-routing">
    Leiten Sie eingehende Nachrichten an Agenten weiter.
  </Card>
  <Card title="Sicherheit" icon="shield" href="/de/gateway/security">
    Bedrohungsmodell und Härtung.
  </Card>
  <Card title="Multi-Agent-Routing" icon="sitemap" href="/de/concepts/multi-agent">
    Ordnen Sie Guilds und Channels Agenten zu.
  </Card>
  <Card title="Slash Commands" icon="terminal" href="/de/tools/slash-commands">
    Natives Command-Verhalten.
  </Card>
</CardGroup>
