---
read_when:
    - Arbeiten an Discord-Kanalfunktionen
summary: Status, Funktionen und Konfiguration der Discord-Bot-Unterstützung
title: Discord
x-i18n:
    generated_at: "2026-05-07T01:50:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0422fe8a25a7c40d49c4a8c6ec5683c729c09b79d5d03daefc0fcf032f6d75c2
    source_path: channels/discord.md
    workflow: 16
---

Bereit für DMs und Guild-Kanäle über den offiziellen Discord-Gateway.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/de/channels/pairing">
    Discord-DMs verwenden standardmäßig den Pairing-Modus.
  </Card>
  <Card title="Slash-Befehle" icon="terminal" href="/de/tools/slash-commands">
    Natives Befehlsverhalten und Befehlskatalog.
  </Card>
  <Card title="Kanal-Fehlerbehebung" icon="wrench" href="/de/channels/troubleshooting">
    Kanalübergreifende Diagnose und Reparaturablauf.
  </Card>
</CardGroup>

## Schnelle Einrichtung

Sie müssen eine neue Anwendung mit einem Bot erstellen, den Bot zu Ihrem Server hinzufügen und ihn mit OpenClaw pairen. Wir empfehlen, Ihren Bot zu Ihrem eigenen privaten Server hinzuzufügen. Wenn Sie noch keinen haben, [erstellen Sie zuerst einen](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (wählen Sie **Create My Own > For me and my friends**).

<Steps>
  <Step title="Discord-Anwendung und Bot erstellen">
    Gehen Sie zum [Discord Developer Portal](https://discord.com/developers/applications) und klicken Sie auf **New Application**. Geben Sie ihr einen Namen wie „OpenClaw“.

    Klicken Sie in der Seitenleiste auf **Bot**. Setzen Sie den **Username** auf den Namen, den Sie für Ihren OpenClaw-Agenten verwenden.

  </Step>

  <Step title="Privilegierte Intents aktivieren">
    Scrollen Sie weiterhin auf der Seite **Bot** nach unten zu **Privileged Gateway Intents** und aktivieren Sie:

    - **Message Content Intent** (erforderlich)
    - **Server Members Intent** (empfohlen; erforderlich für Rollen-Allowlists und die Zuordnung von Namen zu IDs)
    - **Presence Intent** (optional; nur für Präsenz-Updates erforderlich)

  </Step>

  <Step title="Bot-Token kopieren">
    Scrollen Sie auf der Seite **Bot** wieder nach oben und klicken Sie auf **Reset Token**.

    <Note>
    Trotz des Namens wird dadurch Ihr erstes Token generiert – es wird nichts „zurückgesetzt“.
    </Note>

    Kopieren Sie das Token und speichern Sie es an einem sicheren Ort. Dies ist Ihr **Bot Token**, und Sie benötigen es gleich.

  </Step>

  <Step title="Einladungs-URL generieren und den Bot zu Ihrem Server hinzufügen">
    Klicken Sie in der Seitenleiste auf **OAuth2**. Sie generieren eine Einladungs-URL mit den passenden Berechtigungen, um den Bot zu Ihrem Server hinzuzufügen.

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

    Dies ist die Basiskonfiguration für normale Textkanäle. Wenn Sie in Discord-Threads posten möchten, einschließlich Forum- oder Medienkanal-Workflows, die einen Thread erstellen oder fortsetzen, aktivieren Sie außerdem **Send Messages in Threads**.
    Kopieren Sie die generierte URL unten, fügen Sie sie in Ihren Browser ein, wählen Sie Ihren Server aus und klicken Sie auf **Continue**, um die Verbindung herzustellen. Sie sollten Ihren Bot jetzt auf dem Discord-Server sehen.

  </Step>

  <Step title="Entwicklermodus aktivieren und Ihre IDs erfassen">
    Zurück in der Discord-App müssen Sie den Entwicklermodus aktivieren, damit Sie interne IDs kopieren können.

    1. Klicken Sie auf **User Settings** (Zahnradsymbol neben Ihrem Avatar) → **Advanced** → aktivieren Sie **Developer Mode**
    2. Klicken Sie mit der rechten Maustaste auf Ihr **Serversymbol** in der Seitenleiste → **Copy Server ID**
    3. Klicken Sie mit der rechten Maustaste auf Ihren **eigenen Avatar** → **Copy User ID**

    Speichern Sie Ihre **Server ID** und **User ID** zusammen mit Ihrem Bot Token – im nächsten Schritt senden Sie alle drei an OpenClaw.

  </Step>

  <Step title="DMs von Servermitgliedern erlauben">
    Damit Pairing funktioniert, muss Discord Ihrem Bot erlauben, Ihnen eine DM zu senden. Klicken Sie mit der rechten Maustaste auf Ihr **Serversymbol** → **Privacy Settings** → aktivieren Sie **Direct Messages**.

    Dadurch können Servermitglieder (einschließlich Bots) Ihnen DMs senden. Lassen Sie dies aktiviert, wenn Sie Discord-DMs mit OpenClaw verwenden möchten. Wenn Sie nur Guild-Kanäle verwenden möchten, können Sie DMs nach dem Pairing deaktivieren.

  </Step>

  <Step title="Bot-Token sicher setzen (nicht im Chat senden)">
    Ihr Discord-Bot-Token ist ein Geheimnis (wie ein Passwort). Setzen Sie es auf dem Computer, auf dem OpenClaw ausgeführt wird, bevor Sie Ihrem Agenten eine Nachricht senden.

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
    Führen Sie bei Installationen als verwalteter Dienst `openclaw gateway install` aus einer Shell aus, in der `DISCORD_BOT_TOKEN` vorhanden ist, oder speichern Sie die Variable in `~/.openclaw/.env`, damit der Dienst die Env-SecretRef nach dem Neustart auflösen kann.
    Wenn Ihr Host durch Discords Anwendungsabfrage beim Start blockiert oder per Rate Limit eingeschränkt wird, setzen Sie die Discord-Anwendungs-/Client-ID aus dem Developer Portal, damit der Start diesen REST-Aufruf überspringen kann. Verwenden Sie `channels.discord.applicationId` für das Standardkonto oder `channels.discord.accounts.<accountId>.applicationId`, wenn Sie mehrere Discord-Bots ausführen.

  </Step>

  <Step title="OpenClaw konfigurieren und pairen">

    <Tabs>
      <Tab title="Ihren Agenten fragen">
        Chatten Sie mit Ihrem OpenClaw-Agenten in einem vorhandenen Kanal (z. B. Telegram) und teilen Sie es ihm mit. Wenn Discord Ihr erster Kanal ist, verwenden Sie stattdessen den Tab CLI / Konfiguration.

        > „Ich habe mein Discord-Bot-Token bereits in der Konfiguration gesetzt. Bitte schließen Sie die Discord-Einrichtung mit der User ID `<user_id>` und der Server ID `<server_id>` ab.“
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

        Für skriptbasierte oder Remote-Einrichtung schreiben Sie denselben JSON5-Block mit `openclaw config patch --file ./discord.patch.json5 --dry-run` und führen Sie ihn dann erneut ohne `--dry-run` aus. Klartextwerte für `token` werden unterstützt. SecretRef-Werte werden für `channels.discord.token` ebenfalls über Env-/Datei-/Exec-Provider hinweg unterstützt. Siehe [Geheimnisverwaltung](/de/gateway/secrets).

        Für mehrere Discord-Bots halten Sie jedes Bot-Token und jede Anwendungs-ID unter dem jeweiligen Konto. Ein `channels.discord.applicationId` auf oberster Ebene wird von Konten geerbt; setzen Sie ihn dort also nur, wenn jedes Konto dieselbe Anwendungs-ID verwenden soll.

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

  <Step title="Erstes DM-Pairing genehmigen">
    Warten Sie, bis der Gateway läuft, und senden Sie Ihrem Bot dann in Discord eine DM. Er antwortet mit einem Pairing-Code.

    <Tabs>
      <Tab title="Ihren Agenten fragen">
        Senden Sie den Pairing-Code an Ihren Agenten in Ihrem bestehenden Kanal:

        > „Genehmigen Sie diesen Discord-Pairing-Code: `<CODE>`“
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    Pairing-Codes laufen nach 1 Stunde ab.

    Sie sollten jetzt per DM in Discord mit Ihrem Agenten chatten können.

  </Step>
</Steps>

<Note>
Die Token-Auflösung ist kontobewusst. Token-Werte aus der Konfiguration haben Vorrang vor Env-Fallbacks. `DISCORD_BOT_TOKEN` wird nur für das Standardkonto verwendet.
Wenn zwei aktivierte Discord-Konten dasselbe Bot-Token auflösen, startet OpenClaw nur einen Gateway-Monitor für dieses Token. Ein Token aus der Konfiguration hat Vorrang vor dem Standard-Env-Fallback; andernfalls gewinnt das erste aktivierte Konto, und das doppelte Konto wird als deaktiviert gemeldet.
Für erweiterte ausgehende Aufrufe (Nachrichtentool/Kanalaktionen) wird ein explizites `token` pro Aufruf für diesen Aufruf verwendet. Dies gilt für Sende- und Lese-/Probe-Aktionen (zum Beispiel read/search/fetch/thread/pins/permissions). Kontorichtlinien und Retry-Einstellungen stammen weiterhin aus dem ausgewählten Konto im aktiven Runtime-Snapshot.
</Note>

## Empfohlen: Guild-Arbeitsbereich einrichten

Sobald DMs funktionieren, können Sie Ihren Discord-Server als vollständigen Arbeitsbereich einrichten, in dem jeder Kanal seine eigene Agentensitzung mit eigenem Kontext erhält. Dies wird für private Server empfohlen, auf denen nur Sie und Ihr Bot sind.

<Steps>
  <Step title="Ihren Server zur Guild-Allowlist hinzufügen">
    Dadurch kann Ihr Agent in jedem Kanal auf Ihrem Server antworten, nicht nur in DMs.

    <Tabs>
      <Tab title="Ihren Agenten fragen">
        > „Fügen Sie meine Discord Server ID `<server_id>` zur Guild-Allowlist hinzu“
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
    Standardmäßig antwortet Ihr Agent in Guild-Kanälen nur, wenn er per @mention erwähnt wird. Für einen privaten Server möchten Sie wahrscheinlich, dass er auf jede Nachricht antwortet.

    In Guild-Kanälen bleiben normale finale Assistentenantworten standardmäßig privat. Sichtbare Discord-Ausgabe muss explizit mit dem `message`-Tool gesendet werden, sodass der Agent standardmäßig mitlesen und nur posten kann, wenn er entscheidet, dass eine Kanalantwort nützlich ist.

    Das bedeutet, dass das ausgewählte Modell zuverlässig Tools aufrufen muss. Wenn Discord Tippen anzeigt und die Logs Token-Nutzung zeigen, aber keine Nachricht gepostet wird, prüfen Sie das Sitzungslog auf Assistententext mit `didSendViaMessagingTool: false`. Das bedeutet, dass das Modell eine private finale Antwort erzeugt hat, statt `message(action=send)` aufzurufen. Wechseln Sie zu einem stärkeren Tool-Calling-Modell oder verwenden Sie die folgende Konfiguration, um alte automatische finale Antworten wiederherzustellen.

    <Tabs>
      <Tab title="Ihren Agenten fragen">
        > „Erlauben Sie meinem Agenten, auf diesem Server zu antworten, ohne per @mention erwähnt werden zu müssen“
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

        Um alte automatische finale Antworten für Gruppen-/Kanalräume wiederherzustellen, setzen Sie `messages.groupChat.visibleReplies: "automatic"`.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Speicher in Guild-Kanälen planen">
    Standardmäßig wird Langzeitspeicher (`MEMORY.md`) nur in DM-Sitzungen geladen. Guild-Kanäle laden `MEMORY.md` nicht automatisch.

    <Tabs>
      <Tab title="Ihren Agenten fragen">
        > „Wenn ich in Discord-Kanälen Fragen stelle, verwenden Sie memory_search oder memory_get, wenn Sie Langzeitkontext aus MEMORY.md benötigen.“
      </Tab>
      <Tab title="Manuell">
        Wenn Sie gemeinsamen Kontext in jedem Kanal benötigen, legen Sie die stabilen Anweisungen in `AGENTS.md` oder `USER.md` ab (sie werden für jede Sitzung injiziert). Bewahren Sie Langzeitnotizen in `MEMORY.md` auf und greifen Sie bei Bedarf mit Speicher-Tools darauf zu.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Erstellen Sie jetzt einige Kanäle auf Ihrem Discord-Server und beginnen Sie zu chatten. Ihr Agent kann den Kanalnamen sehen, und jeder Kanal erhält seine eigene isolierte Sitzung – Sie können also `#coding`, `#home`, `#research` oder alles einrichten, was zu Ihrem Workflow passt.

## Runtime-Modell

- Gateway besitzt die Discord-Verbindung.
- Das Reply-Routing ist deterministisch: Eingehende Discord-Antworten werden zurück an Discord gesendet.
- Discord-Guild-/Channel-Metadaten werden dem Modell-Prompt als nicht vertrauenswürdiger
  Kontext hinzugefügt, nicht als für Benutzer sichtbares Antwortpräfix. Wenn ein Modell diese Hülle
  zurückkopiert, entfernt OpenClaw die kopierten Metadaten aus ausgehenden Antworten und aus
  künftigem Replay-Kontext.
- Standardmäßig (`session.dmScope=main`) teilen direkte Chats die Hauptsitzung des Agenten (`agent:main:main`).
- Guild-Channels sind isolierte Sitzungsschlüssel (`agent:<agentId>:discord:channel:<channelId>`).
- Gruppen-DMs werden standardmäßig ignoriert (`channels.discord.dm.groupEnabled=false`).
- Native Slash-Befehle werden in isolierten Befehlssitzungen ausgeführt (`agent:<agentId>:discord:slash:<userId>`), führen aber weiterhin `CommandTargetSessionKey` zur gerouteten Konversationssitzung mit.
- Die reine Text-Ankündigungszustellung von Cron/Heartbeat an Discord verwendet die finale,
  für den Assistenten sichtbare Antwort einmal. Medien- und strukturierte Komponenten-Payloads bleiben
  mehrteilig, wenn der Agent mehrere zustellbare Payloads ausgibt.

## Forum-Channels

Discord-Forum- und Medien-Channels akzeptieren nur Thread-Beiträge. OpenClaw unterstützt zwei Arten, sie zu erstellen:

- Senden Sie eine Nachricht an den Forum-Parent (`channel:<forumId>`), um automatisch einen Thread zu erstellen. Der Thread-Titel verwendet die erste nicht leere Zeile Ihrer Nachricht.
- Verwenden Sie `openclaw message thread create`, um einen Thread direkt zu erstellen. Übergeben Sie für Forum-Channels nicht `--message-id`.

Beispiel: An den Forum-Parent senden, um einen Thread zu erstellen

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

OpenClaw unterstützt Discord-Komponenten-v2-Container für Agentennachrichten. Verwenden Sie das Nachrichtentool mit einem `components`-Payload. Interaktionsergebnisse werden als normale eingehende Nachrichten zurück an den Agenten geroutet und folgen den bestehenden Discord-`replyToMode`-Einstellungen.

Unterstützte Blöcke:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Action-Zeilen erlauben bis zu 5 Buttons oder ein einzelnes Auswahlmenü
- Auswahltypen: `string`, `user`, `role`, `mentionable`, `channel`

Standardmäßig sind Komponenten einmalig verwendbar. Setzen Sie `components.reusable=true`, um zu erlauben, dass Buttons, Auswahlelemente und Formulare bis zu ihrem Ablauf mehrfach verwendet werden.

Um einzuschränken, wer auf einen Button klicken kann, setzen Sie `allowedUsers` für diesen Button (Discord-Benutzer-IDs, Tags oder `*`). Wenn dies konfiguriert ist, erhalten nicht übereinstimmende Benutzer eine flüchtige Ablehnung.

Die Slash-Befehle `/model` und `/models` öffnen eine interaktive Modellauswahl mit Provider-, Modell- und kompatiblen Runtime-Dropdowns sowie einem Absenden-Schritt. `/models add` ist veraltet und gibt jetzt eine Veraltungsmeldung zurück, statt Modelle aus dem Chat zu registrieren. Die Picker-Antwort ist flüchtig und kann nur vom aufrufenden Benutzer verwendet werden.

Dateianhänge:

- `file`-Blöcke müssen auf eine Anhangsreferenz verweisen (`attachment://<filename>`)
- Stellen Sie den Anhang über `media`/`path`/`filePath` bereit (einzelne Datei); verwenden Sie `media-gallery` für mehrere Dateien
- Verwenden Sie `filename`, um den Upload-Namen zu überschreiben, wenn er mit der Anhangsreferenz übereinstimmen soll

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
    - Für ein Konto hat `allowFrom` Vorrang vor dem alten `dm.allowFrom`.
    - Benannte Konten erben `channels.discord.allowFrom`, wenn ihr eigenes `allowFrom` und das alte `dm.allowFrom` nicht gesetzt sind.
    - Benannte Konten erben `channels.discord.accounts.default.allowFrom` nicht.

    Das alte `channels.discord.dm.policy` und `channels.discord.dm.allowFrom` werden aus Kompatibilitätsgründen weiterhin gelesen. `openclaw doctor --fix` migriert sie zu `dmPolicy` und `allowFrom`, wenn dies ohne Änderung des Zugriffs möglich ist.

    DM-Zielformat für die Zustellung:

    - `user:<id>`
    - `<@id>`-Erwähnung

    Reine numerische IDs werden normalerweise als Channel-IDs aufgelöst, wenn ein Channel-Standard aktiv ist, aber IDs, die in der effektiven DM-`allowFrom` des Kontos aufgeführt sind, werden aus Kompatibilitätsgründen als Benutzer-DM-Ziele behandelt.

  </Tab>

  <Tab title="DM-Zugriffsgruppen">
    Discord-DMs können dynamische `accessGroup:<name>`-Einträge in `channels.discord.allowFrom` verwenden.

    Zugriffsgruppennamen werden über Nachrichtenkanäle hinweg geteilt. Verwenden Sie `type: "message.senders"` für eine statische Gruppe, deren Mitglieder in der normalen `allowFrom`-Syntax des jeweiligen Kanals ausgedrückt werden, oder `type: "discord.channelAudience"`, wenn die aktuelle `ViewChannel`-Zielgruppe eines Discord-Channels die Mitgliedschaft dynamisch definieren soll. Das gemeinsame Verhalten von Zugriffsgruppen ist hier dokumentiert: [Zugriffsgruppen](/de/channels/access-groups).

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

    Ein Discord-Text-Channel hat keine separate Mitgliederliste. `type: "discord.channelAudience"` modelliert Mitgliedschaft so: Der DM-Absender ist Mitglied der konfigurierten Guild und hat derzeit nach Anwendung von Rollen- und Channel-Überschreibungen die effektive `ViewChannel`-Berechtigung für den konfigurierten Channel.

    Beispiel: Erlauben Sie allen, die `#maintainers` sehen können, dem Bot eine DM zu senden, während DMs für alle anderen geschlossen bleiben.

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

    Abfragen schlagen geschlossen fehl. Wenn Discord `Missing Access` zurückgibt, die Mitgliedsabfrage fehlschlägt oder der Channel zu einer anderen Guild gehört, wird der DM-Absender als nicht autorisiert behandelt.

    Aktivieren Sie im Discord Developer Portal den **Server Members Intent** für den Bot, wenn Sie Channel-Zielgruppen-Zugriffsgruppen verwenden. DMs enthalten keinen Guild-Mitgliedsstatus, daher löst OpenClaw das Mitglied zum Autorisierungszeitpunkt über Discord REST auf.

  </Tab>

  <Tab title="Guild-Richtlinie">
    Die Guild-Behandlung wird durch `channels.discord.groupPolicy` gesteuert:

    - `open`
    - `allowlist`
    - `disabled`

    Die sichere Basis, wenn `channels.discord` vorhanden ist, ist `allowlist`.

    `allowlist`-Verhalten:

    - Guild muss mit `channels.discord.guilds` übereinstimmen (`id` bevorzugt, Slug akzeptiert)
    - optionale Absender-Allowlists: `users` (stabile IDs empfohlen) und `roles` (nur Rollen-IDs); wenn eines von beiden konfiguriert ist, sind Absender erlaubt, wenn sie mit `users` ODER `roles` übereinstimmen
    - direkte Namens-/Tag-Übereinstimmung ist standardmäßig deaktiviert; aktivieren Sie `channels.discord.dangerouslyAllowNameMatching: true` nur als Break-Glass-Kompatibilitätsmodus
    - Namen/Tags werden für `users` unterstützt, aber IDs sind sicherer; `openclaw security audit` warnt, wenn Namens-/Tag-Einträge verwendet werden
    - wenn für eine Guild `channels` konfiguriert ist, werden nicht aufgeführte Channels abgelehnt
    - wenn eine Guild keinen `channels`-Block hat, sind alle Channels in dieser allowlisteten Guild erlaubt

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

    Wenn Sie nur `DISCORD_BOT_TOKEN` setzen und keinen `channels.discord`-Block erstellen, ist der Runtime-Fallback `groupPolicy="allowlist"` (mit einer Warnung in den Logs), selbst wenn `channels.defaults.groupPolicy` `open` ist.

  </Tab>

  <Tab title="Erwähnungen und Gruppen-DMs">
    Guild-Nachrichten sind standardmäßig erwähnungsgesteuert.

    Die Erwähnungserkennung umfasst:

    - explizite Bot-Erwähnung
    - konfigurierte Erwähnungsmuster (`agents.list[].groupChat.mentionPatterns`, Fallback `messages.groupChat.mentionPatterns`)
    - implizites Antwort-an-Bot-Verhalten in unterstützten Fällen

    Verwenden Sie beim Schreiben ausgehender Discord-Nachrichten die kanonische Erwähnungssyntax: `<@USER_ID>` für Benutzer, `<#CHANNEL_ID>` für Channels und `<@&ROLE_ID>` für Rollen. Verwenden Sie nicht die alte Nickname-Erwähnungsform `<@!USER_ID>`.

    `requireMention` wird pro Guild/Channel konfiguriert (`channels.discord.guilds...`).
    `ignoreOtherMentions` verwirft optional Nachrichten, die einen anderen Benutzer/eine andere Rolle erwähnen, aber nicht den Bot (außer @everyone/@here).

    Gruppen-DMs:

    - Standard: ignoriert (`dm.groupEnabled=false`)
    - optionale Allowlist über `dm.groupChannels` (Channel-IDs oder Slugs)

  </Tab>
</Tabs>

### Rollenbasiertes Agenten-Routing

Verwenden Sie `bindings[].match.roles`, um Discord-Guild-Mitglieder anhand der Rollen-ID an verschiedene Agenten zu routen. Rollenbasierte Bindings akzeptieren nur Rollen-IDs und werden nach Peer- oder Parent-Peer-Bindings und vor Guild-only-Bindings ausgewertet. Wenn ein Binding auch andere Match-Felder setzt (zum Beispiel `peer` + `guildId` + `roles`), müssen alle konfigurierten Felder übereinstimmen.

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

- `commands.native` ist standardmäßig `"auto"` und für Discord aktiviert.
- Kanalbezogene Überschreibung: `channels.discord.commands.native`.
- `commands.native=false` überspringt beim Start die Registrierung und Bereinigung von Discord-Slash-Commands. Zuvor registrierte Commands bleiben möglicherweise in Discord sichtbar, bis Sie sie aus der Discord-App entfernen.
- Native Command-Authentifizierung verwendet dieselben Discord-Allowlists/-Policies wie die normale Nachrichtenverarbeitung.
- Commands können in der Discord-Oberfläche weiterhin für Benutzer sichtbar sein, die nicht autorisiert sind; die Ausführung erzwingt dennoch die OpenClaw-Authentifizierung und gibt "not authorized" zurück.

Siehe [Slash-Commands](/de/tools/slash-commands) für Command-Katalog und Verhalten.

Standardmäßige Slash-Command-Einstellungen:

- `ephemeral: true`

## Funktionsdetails

<AccordionGroup>
  <Accordion title="Reply tags and native replies">
    Discord unterstützt Antwort-Tags in der Agent-Ausgabe:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Gesteuert durch `channels.discord.replyToMode`:

    - `off` (Standard)
    - `first`
    - `all`
    - `batched`

    Hinweis: `off` deaktiviert implizites Antwort-Threading. Explizite `[[reply_to_*]]`-Tags werden weiterhin beachtet.
    `first` hängt die implizite native Antwortreferenz immer an die erste ausgehende Discord-Nachricht für den Turn an.
    `batched` hängt die implizite native Antwortreferenz von Discord nur an, wenn der
    eingehende Turn ein entprellter Batch aus mehreren Nachrichten war. Das ist nützlich,
    wenn Sie native Antworten hauptsächlich für mehrdeutige, stoßartige Chats wünschen,
    nicht für jeden einzelnen Nachrichten-Turn.

    Nachrichten-IDs werden in Kontext/Verlauf bereitgestellt, damit Agents gezielt bestimmte Nachrichten adressieren können.

  </Accordion>

  <Accordion title="Live stream preview">
    OpenClaw kann Antwortentwürfe streamen, indem es eine temporäre Nachricht sendet und sie bearbeitet, sobald Text eintrifft. `channels.discord.streaming` akzeptiert `off` | `partial` | `block` | `progress` (Standard). `progress` hält einen bearbeitbaren Statusentwurf vor und aktualisiert ihn bis zur endgültigen Zustellung mit Tool-Fortschritt; `streamMode` ist ein Legacy-Runtime-Alias. Führen Sie `openclaw doctor --fix` aus, um persistierte Konfiguration auf den kanonischen Schlüssel umzuschreiben.

    Setzen Sie `channels.discord.streaming.mode` auf `off`, um Discord-Vorschaubearbeitungen zu deaktivieren. Wenn Discord-Block-Streaming explizit aktiviert ist, überspringt OpenClaw den Vorschaustream, um doppeltes Streaming zu vermeiden.

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

    - `partial` bearbeitet eine einzelne Vorschaunachricht, sobald Tokens eintreffen.
    - `block` gibt Entwurfs-Chunks aus (verwenden Sie `draftChunk`, um Größe und Umbruchpunkte abzustimmen, begrenzt durch `textChunkLimit`).
    - Medien-, Fehler- und explizite Antwort-Finals brechen ausstehende Vorschaubearbeitungen ab.
    - `streaming.preview.toolProgress` (Standard `true`) steuert, ob Tool-/Fortschrittsupdates die Vorschaunachricht wiederverwenden.
    - `streaming.preview.commandText` / `streaming.progress.commandText` steuert Command-/Exec-Details in kompakten Fortschrittszeilen: `raw` (Standard) oder `status` (nur Tool-Label).

    Rohtext für Command/Exec ausblenden, während kompakte Fortschrittszeilen beibehalten werden:

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

    Vorschaustreaming ist rein textbasiert; Medienantworten fallen auf die normale Zustellung zurück. Wenn `block`-Streaming explizit aktiviert ist, überspringt OpenClaw den Vorschaustream, um doppeltes Streaming zu vermeiden.

  </Accordion>

  <Accordion title="History, context, and thread behavior">
    Guild-Verlaufskontext:

    - `channels.discord.historyLimit` Standard `20`
    - Fallback: `messages.groupChat.historyLimit`
    - `0` deaktiviert

    DM-Verlaufssteuerung:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Thread-Verhalten:

    - Discord-Threads werden als Kanal-Sessions geroutet und erben die Konfiguration des übergeordneten Kanals, sofern sie nicht überschrieben wird.
    - Thread-Sessions erben die Session-bezogene `/model`-Auswahl des übergeordneten Kanals als reinen Modell-Fallback; Thread-lokale `/model`-Auswahlen haben weiterhin Vorrang, und der übergeordnete Transkriptverlauf wird nur kopiert, wenn Transkriptvererbung aktiviert ist.
    - `channels.discord.thread.inheritParent` (Standard `false`) aktiviert für neue Auto-Threads das Seeding aus dem übergeordneten Transkript. Kontospezifische Überschreibungen befinden sich unter `channels.discord.accounts.<id>.thread.inheritParent`.
    - Nachrichten-Tool-Reaktionen können `user:<id>`-DM-Ziele auflösen.
    - `guilds.<guild>.channels.<channel>.requireMention: false` wird während des Aktivierungs-Fallbacks in der Antwortphase beibehalten.

    Kanalthemen werden als **nicht vertrauenswürdiger** Kontext injiziert. Allowlists steuern, wer den Agent auslösen darf, sind aber keine vollständige Redaktionsgrenze für zusätzlichen Kontext.

  </Accordion>

  <Accordion title="Thread-bound sessions for subagents">
    Discord kann einen Thread an ein Session-Ziel binden, sodass Folgenachrichten in diesem Thread weiterhin an dieselbe Session geroutet werden (einschließlich Subagent-Sessions).

    Commands:

    - `/focus <target>` bindet den aktuellen/neuen Thread an ein Subagent-/Session-Ziel
    - `/unfocus` entfernt die aktuelle Thread-Bindung
    - `/agents` zeigt aktive Läufe und Bindungsstatus an
    - `/session idle <duration|off>` prüft/aktualisiert die Inaktivitäts-Auto-Unfocus-Einstellung für fokussierte Bindungen
    - `/session max-age <duration|off>` prüft/aktualisiert das harte Maximalalter für fokussierte Bindungen

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

    - `session.threadBindings.*` legt globale Standards fest.
    - `channels.discord.threadBindings.*` überschreibt das Discord-Verhalten.
    - `spawnSessions` steuert das automatische Erstellen/Binden von Threads für `sessions_spawn({ thread: true })` und ACP-Thread-Spawns. Standard: `true`.
    - `defaultSpawnContext` steuert den nativen Subagent-Kontext für threadgebundene Spawns. Standard: `"fork"`.
    - Veraltete Schlüssel `spawnSubagentSessions`/`spawnAcpSessions` werden durch `openclaw doctor --fix` migriert.
    - Wenn Thread-Bindungen für ein Konto deaktiviert sind, sind `/focus` und zugehörige Thread-Bindungsoperationen nicht verfügbar.

    Siehe [Subagents](/de/tools/subagents), [ACP Agents](/de/tools/acp-agents) und [Konfigurationsreferenz](/de/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Persistent ACP channel bindings">
    Für stabile, "always-on" ACP-Arbeitsbereiche konfigurieren Sie typisierte ACP-Bindungen auf oberster Ebene, die auf Discord-Konversationen zielen.

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

    - `/acp spawn codex --bind here` bindet den aktuellen Kanal oder Thread direkt und hält zukünftige Nachrichten auf derselben ACP-Session. Thread-Nachrichten erben die Bindung des übergeordneten Kanals.
    - In einem gebundenen Kanal oder Thread setzen `/new` und `/reset` dieselbe ACP-Session direkt zurück. Temporäre Thread-Bindungen können die Zielauflösung überschreiben, solange sie aktiv sind.
    - `spawnSessions` steuert das Erstellen/Binden von Child-Threads über `--thread auto|here`.

    Siehe [ACP Agents](/de/tools/acp-agents) für Details zum Bindungsverhalten.

  </Accordion>

  <Accordion title="Reaction notifications">
    Reaktionsbenachrichtigungsmodus pro Guild:

    - `off`
    - `own` (Standard)
    - `all`
    - `allowlist` (verwendet `guilds.<id>.users`)

    Reaktionsereignisse werden in Systemereignisse umgewandelt und an die geroutete Discord-Session angehängt.

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction` sendet ein Bestätigungs-Emoji, während OpenClaw eine eingehende Nachricht verarbeitet.

    Auflösungsreihenfolge:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - Agent-Identitäts-Emoji-Fallback (`agents.list[].identity.emoji`, andernfalls "👀")

    Hinweise:

    - Discord akzeptiert Unicode-Emoji oder benutzerdefinierte Emoji-Namen.
    - Verwenden Sie `""`, um die Reaktion für einen Kanal oder ein Konto zu deaktivieren.

  </Accordion>

  <Accordion title="Config writes">
    Kanalinitiierte Konfigurationsschreibvorgänge sind standardmäßig aktiviert.

    Dies betrifft `/config set|unset`-Abläufe (wenn Command-Funktionen aktiviert sind).

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

  <Accordion title="Gateway proxy">
    Leiten Sie Discord-Gateway-WebSocket-Datenverkehr und REST-Startabfragen (Application-ID + Allowlist-Auflösung) über einen HTTP(S)-Proxy mit `channels.discord.proxy`.

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

  <Accordion title="PluralKit support">
    Aktivieren Sie die PluralKit-Auflösung, um proxied Nachrichten der Identität eines Systemmitglieds zuzuordnen:

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

    - Allowlists können `pk:<memberId>` verwenden
    - Anzeigenamen von Mitgliedern werden nur dann nach Name/Slug abgeglichen, wenn `channels.discord.dangerouslyAllowNameMatching: true`
    - Lookups verwenden die ursprüngliche Nachrichten-ID und sind zeitfensterbeschränkt
    - Wenn der Lookup fehlschlägt, werden proxied Nachrichten als Bot-Nachrichten behandelt und verworfen, sofern nicht `allowBots=true`

  </Accordion>

  <Accordion title="Outbound mention aliases">
    Verwenden Sie `mentionAliases`, wenn Agents deterministische ausgehende Erwähnungen für bekannte Discord-Benutzer benötigen. Schlüssel sind Handles ohne führendes `@`; Werte sind Discord-Benutzer-IDs. Unbekannte Handles, `@everyone`, `@here` und Erwähnungen innerhalb von Markdown-Code-Spans bleiben unverändert.

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

  <Accordion title="Presence configuration">
    Presence-Updates werden angewendet, wenn Sie ein Status- oder Aktivitätsfeld festlegen oder Auto-Presence aktivieren.

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

    - 0: Spielen
    - 1: Streaming (erfordert `activityUrl`)
    - 2: Hören
    - 3: Zuschauen
    - 4: Benutzerdefiniert (verwendet den Aktivitätstext als Statuszustand; Emoji ist optional)
    - 5: Teilnehmen

    Auto-Presence-Beispiel (Runtime-Health-Signal):

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

    Automatische Präsenz ordnet die Runtime-Verfügbarkeit dem Discord-Status zu: healthy => online, degraded or unknown => idle, exhausted or unavailable => dnd. Optionale Textüberschreibungen:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (unterstützt den Platzhalter `{reason}`)

  </Accordion>

  <Accordion title="Freigaben in Discord">
    Discord unterstützt buttonbasierte Freigabeabwicklung in DMs und kann Freigabeaufforderungen optional im ursprünglichen Kanal posten.

    Konfigurationspfad:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (optional; fällt nach Möglichkeit auf `commands.ownerAllowFrom` zurück)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, Standard: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord aktiviert native Exec-Freigaben automatisch, wenn `enabled` nicht gesetzt oder `"auto"` ist und mindestens ein Freigebender aufgelöst werden kann, entweder aus `execApprovals.approvers` oder aus `commands.ownerAllowFrom`. Discord leitet Exec-Freigebende nicht aus Kanal-`allowFrom`, Legacy-`dm.allowFrom` oder Direct-Message-`defaultTo` ab. Setzen Sie `enabled: false`, um Discord explizit als nativen Freigabeclient zu deaktivieren.

    Für sensible, nur Eigentümern vorbehaltene Gruppenbefehle wie `/diagnostics` und `/export-trajectory` sendet OpenClaw Freigabeaufforderungen und Endergebnisse privat. Es versucht zuerst eine Discord-DM, wenn der aufrufende Eigentümer eine Discord-Eigentümerroute hat; falls diese nicht verfügbar ist, fällt es auf die erste verfügbare Eigentümerroute aus `commands.ownerAllowFrom` zurück, zum Beispiel Telegram.

    Wenn `target` `channel` oder `both` ist, ist die Freigabeaufforderung im Kanal sichtbar. Nur aufgelöste Freigebende können die Buttons verwenden; andere Benutzer erhalten eine flüchtige Ablehnung. Freigabeaufforderungen enthalten den Befehlstext. Aktivieren Sie daher die Kanalzustellung nur in vertrauenswürdigen Kanälen. Wenn die Kanal-ID nicht aus dem Sitzungsschlüssel abgeleitet werden kann, fällt OpenClaw auf DM-Zustellung zurück.

    Discord rendert auch die gemeinsam genutzten Freigabe-Buttons, die von anderen Chatkanälen verwendet werden. Der native Discord-Adapter ergänzt hauptsächlich DM-Routing für Freigebende und Kanal-Fanout.
    Wenn diese Buttons vorhanden sind, sind sie die primäre Freigabe-UX; OpenClaw
    sollte nur dann einen manuellen `/approve`-Befehl einschließen, wenn das Tool-Ergebnis besagt,
    dass Chat-Freigaben nicht verfügbar sind oder die manuelle Freigabe der einzige Weg ist.
    Wenn die native Discord-Freigabe-Runtime nicht aktiv ist, hält OpenClaw die
    lokale deterministische Eingabeaufforderung `/approve <id> <decision>` sichtbar. Wenn die
    Runtime aktiv ist, aber keine native Karte an ein Ziel zugestellt werden kann,
    sendet OpenClaw einen Fallback-Hinweis im selben Chat mit dem exakten `/approve`-
    Befehl aus der ausstehenden Freigabe.

    Gateway-Authentifizierung und Freigabeauflösung folgen dem gemeinsamen Gateway-Clientvertrag (`plugin:`-IDs werden über `plugin.approval.resolve` aufgelöst; andere IDs über `exec.approval.resolve`). Freigaben laufen standardmäßig nach 30 Minuten ab.

    Siehe [Exec-Freigaben](/de/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Tools und Aktions-Gates

Discord-Nachrichtenaktionen umfassen Messaging, Kanaladministration, Moderation, Präsenz und Metadatenaktionen.

Kernbeispiele:

- Messaging: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- Reaktionen: `react`, `reactions`, `emojiList`
- Moderation: `timeout`, `kick`, `ban`
- Präsenz: `setPresence`

Die Aktion `event-create` akzeptiert einen optionalen Parameter `image` (URL oder lokaler Dateipfad), um das Titelbild des geplanten Ereignisses festzulegen.

Aktions-Gates befinden sich unter `channels.discord.actions.*`.

Standardverhalten der Gates:

| Aktionsgruppe                                                                                                                                                            | Standard   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| Reaktionen, Nachrichten, Threads, Pins, Umfragen, Suche, Mitgliedsinformationen, Rolleninformationen, Kanalinformationen, Kanäle, Sprachstatus, Ereignisse, Sticker, Emoji-Uploads, Sticker-Uploads, Berechtigungen | aktiviert  |
| Rollen                                                                                                                                                                   | deaktiviert |
| Moderation                                                                                                                                                               | deaktiviert |
| Präsenz                                                                                                                                                                  | deaktiviert |

## Komponenten-v2-UI

OpenClaw verwendet Discord-Komponenten v2 für Exec-Freigaben und kontextübergreifende Marker. Discord-Nachrichtenaktionen können außerdem `components` für benutzerdefinierte UI akzeptieren (fortgeschritten; erfordert das Erstellen eines Komponenten-Payloads über das Discord-Tool), während Legacy-`embeds` weiterhin verfügbar sind, aber nicht empfohlen werden.

- `channels.discord.ui.components.accentColor` legt die Akzentfarbe fest, die von Discord-Komponentencontainern verwendet wird (Hex).
- Pro Konto mit `channels.discord.accounts.<id>.ui.components.accentColor` festlegen.
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

Discord hat zwei unterschiedliche Sprachoberflächen: Echtzeit-**Sprachkanäle** (kontinuierliche Gespräche) und **Sprachnachrichtenanhänge** (das Wellenform-Vorschauformat). Der Gateway unterstützt beides.

### Sprachkanäle

Einrichtungscheckliste:

1. Aktivieren Sie Message Content Intent im Discord Developer Portal.
2. Aktivieren Sie Server Members Intent, wenn Rollen-/Benutzer-Allowlists verwendet werden.
3. Laden Sie den Bot mit den Scopes `bot` und `applications.commands` ein.
4. Gewähren Sie Connect, Speak, Send Messages und Read Message History im Ziel-Sprachkanal.
5. Aktivieren Sie native Befehle (`commands.native` oder `channels.discord.commands.native`).
6. Konfigurieren Sie `channels.discord.voice`.

Verwenden Sie `/vc join|leave|status`, um Sitzungen zu steuern. Der Befehl verwendet den Standard-Agent des Kontos und folgt denselben Allowlist- und Gruppenrichtlinienregeln wie andere Discord-Befehle.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

Beispiel für automatisches Beitreten:

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

- `voice.tts` überschreibt `messages.tts` nur für Sprachwiedergabe.
- `voice.model` überschreibt nur das für Discord-Sprachkanalantworten verwendete LLM. Lassen Sie es ungesetzt, um das Modell des gerouteten Agent zu übernehmen.
- STT verwendet `tools.media.audio`; `voice.model` wirkt sich nicht auf die Transkription aus.
- Discord-`systemPrompt`-Überschreibungen pro Kanal gelten für Sprachtranskript-Turns dieses Sprachkanals.
- Sprachtranskript-Turns leiten den Eigentümerstatus aus Discord-`allowFrom` (oder `dm.allowFrom`) ab; Sprecher ohne Eigentümerstatus können nicht auf nur Eigentümern vorbehaltene Tools zugreifen (zum Beispiel `gateway` und `cron`).
- Discord-Sprache ist für reine Textkonfigurationen Opt-in; setzen Sie `channels.discord.voice.enabled=true` (oder behalten Sie einen vorhandenen `channels.discord.voice`-Block bei), um `/vc`-Befehle, die Sprach-Runtime und den `GuildVoiceStates`-Gateway-Intent zu aktivieren.
- `channels.discord.intents.voiceStates` kann das Abonnement des Voice-State-Intents explizit überschreiben. Lassen Sie es ungesetzt, damit der Intent der effektiven Sprachaktivierung folgt.
- `voice.daveEncryption` und `voice.decryptionFailureTolerance` werden an die Join-Optionen von `@discordjs/voice` durchgereicht.
- Die Standardwerte von `@discordjs/voice` sind `daveEncryption=true` und `decryptionFailureTolerance=24`, wenn sie nicht gesetzt sind.
- `voice.connectTimeoutMs` steuert das anfängliche Warten auf Ready von `@discordjs/voice` für `/vc join` und Auto-Join-Versuche. Standard: `30000`.
- `voice.reconnectGraceMs` steuert, wie lange OpenClaw darauf wartet, dass eine getrennte Sprachsitzung mit der erneuten Verbindung beginnt, bevor sie zerstört wird. Standard: `15000`.
- OpenClaw überwacht außerdem Entschlüsselungsfehler beim Empfang und stellt nach wiederholten Fehlern in einem kurzen Zeitfenster automatisch wieder her, indem es den Sprachkanal verlässt und erneut beitritt.
- Wenn Empfangslogs nach der Aktualisierung wiederholt `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` anzeigen, sammeln Sie einen Abhängigkeitsbericht und Logs. Die gebündelte `@discordjs/voice`-Linie enthält den Upstream-Padding-Fix aus discord.js PR #11449, der discord.js-Issue #11419 geschlossen hat.

Pipeline für Sprachkanäle:

- Discord-PCM-Erfassung wird in eine temporäre WAV-Datei konvertiert.
- `tools.media.audio` übernimmt STT, zum Beispiel `openai/gpt-4o-mini-transcribe`.
- Das Transkript wird durch Discord-Ingress und Routing gesendet, während das Antwort-LLM mit einer Sprachausgaberichtlinie läuft, die das Agent-Tool `tts` ausblendet und zurückgegebenen Text anfordert, weil Discord-Sprache die finale TTS-Wiedergabe besitzt.
- `voice.model` überschreibt, wenn gesetzt, nur das Antwort-LLM für diesen Sprachkanal-Turn.
- `voice.tts` wird über `messages.tts` zusammengeführt; das resultierende Audio wird im beigetretenen Kanal abgespielt.

Anmeldedaten werden pro Komponente aufgelöst: LLM-Routenauthentifizierung für `voice.model`, STT-Authentifizierung für `tools.media.audio` und TTS-Authentifizierung für `messages.tts`/`voice.tts`.

### Sprachnachrichten

Discord-Sprachnachrichten zeigen eine Wellenformvorschau und erfordern OGG/Opus-Audio. OpenClaw erzeugt die Wellenform automatisch, benötigt aber `ffmpeg` und `ffprobe` auf dem Gateway-Host, um zu prüfen und zu konvertieren.

- Geben Sie einen **lokalen Dateipfad** an (URLs werden abgelehnt).
- Lassen Sie Textinhalt weg (Discord lehnt Text + Sprachnachricht im selben Payload ab).
- Jedes Audioformat wird akzeptiert; OpenClaw konvertiert bei Bedarf zu OGG/Opus.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Nicht erlaubte Intents verwendet oder Bot sieht keine Guild-Nachrichten">

    - Message Content Intent aktivieren
    - Server Members Intent aktivieren, wenn Sie von Benutzer-/Mitgliedsauflösung abhängen
    - Gateway nach dem Ändern von Intents neu starten

  </Accordion>

  <Accordion title="Guild-Nachrichten unerwartet blockiert">

    - `groupPolicy` prüfen
    - Guild-Allowlist unter `channels.discord.guilds` prüfen
    - wenn eine Guild-`channels`-Map existiert, sind nur aufgeführte Kanäle erlaubt
    - Verhalten von `requireMention` und Erwähnungsmuster prüfen

    Nützliche Prüfungen:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false, aber dennoch blockiert">
    Häufige Ursachen:

    - `groupPolicy="allowlist"` ohne passende Guild-/Kanal-Allowlist
    - `requireMention` an der falschen Stelle konfiguriert (muss unter `channels.discord.guilds` oder dem Kanaleintrag stehen)
    - Absender durch Guild-/Kanal-`users`-Allowlist blockiert

  </Accordion>

  <Accordion title="Lang laufende Discord-Turns oder doppelte Antworten">

    Typische Logs:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Discord-Gateway-Warteschlangenoptionen:

    - einzelnes Konto: `channels.discord.eventQueue.listenerTimeout`
    - mehrere Konten: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - dies steuert nur Listener-Arbeit des Discord-Gateway, nicht die Lebensdauer des Agent-Turns

    Discord wendet kein kanaleigenes Timeout auf eingereihte Agent-Turns an. Nachrichten-Listener übergeben sofort, und eingereihte Discord-Läufe bewahren die Reihenfolge pro Sitzung, bis der Sitzungs-/Tool-/Runtime-Lebenszyklus abgeschlossen ist oder die Arbeit abbricht.

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

  <Accordion title="Timeout-Warnungen bei der Gateway-Metadatensuche">
    OpenClaw ruft vor dem Verbinden Discord-`/gateway/bot`-Metadaten ab. Bei vorübergehenden Fehlern wird auf die Standard-Gateway-URL von Discord zurückgegriffen; die Meldungen in den Logs werden rate-limitiert.

    Regler für Metadata-Timeouts:

    - Einzelkonto: `channels.discord.gatewayInfoTimeoutMs`
    - Mehrfachkonto: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - Env-Fallback, wenn keine Konfiguration gesetzt ist: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - Standardwert: `30000` (30 Sekunden), max.: `120000`

  </Accordion>

  <Accordion title="Neustarts bei Gateway-READY-Timeouts">
    OpenClaw wartet beim Start und nach erneuten Verbindungen zur Laufzeit auf das Gateway-`READY`-Event von Discord. Mehrfachkonto-Setups mit gestaffeltem Start können ein längeres READY-Fenster beim Start benötigen als den Standardwert.

    Regler für READY-Timeouts:

    - Start, Einzelkonto: `channels.discord.gatewayReadyTimeoutMs`
    - Start, Mehrfachkonto: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - Env-Fallback beim Start, wenn keine Konfiguration gesetzt ist: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - Standardwert beim Start: `15000` (15 Sekunden), max.: `120000`
    - Laufzeit, Einzelkonto: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - Laufzeit, Mehrfachkonto: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - Env-Fallback zur Laufzeit, wenn keine Konfiguration gesetzt ist: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - Standardwert zur Laufzeit: `30000` (30 Sekunden), max.: `120000`

  </Accordion>

  <Accordion title="Abweichungen bei Berechtigungsaudits">
    Berechtigungsprüfungen mit `channels status --probe` funktionieren nur für numerische Kanal-IDs.

    Wenn Sie Slug-Schlüssel verwenden, kann die Laufzeitzuordnung weiterhin funktionieren, aber die Probe kann Berechtigungen nicht vollständig überprüfen.

  </Accordion>

  <Accordion title="DM- und Kopplungsprobleme">

    - DM deaktiviert: `channels.discord.dm.enabled=false`
    - DM-Richtlinie deaktiviert: `channels.discord.dmPolicy="disabled"` (Legacy: `channels.discord.dm.policy`)
    - ausstehende Kopplungsgenehmigung im `pairing`-Modus

  </Accordion>

  <Accordion title="Bot-zu-Bot-Schleifen">
    Standardmäßig werden von Bots verfasste Nachrichten ignoriert.

    Wenn Sie `channels.discord.allowBots=true` setzen, verwenden Sie strikte Erwähnungs- und Allowlist-Regeln, um Schleifenverhalten zu vermeiden.
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

    - halten Sie OpenClaw aktuell (`openclaw update`), damit die Wiederherstellungslogik für den Discord-Voice-Empfang vorhanden ist
    - bestätigen Sie `channels.discord.voice.daveEncryption=true` (Standardwert)
    - beginnen Sie mit `channels.discord.voice.decryptionFailureTolerance=24` (Upstream-Standardwert) und passen Sie den Wert nur bei Bedarf an
    - beobachten Sie die Logs auf:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - wenn die Fehler nach dem automatischen erneuten Beitritt weiter auftreten, sammeln Sie Logs und vergleichen Sie diese mit der Upstream-DAVE-Empfangshistorie in [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) und [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Konfigurationsreferenz

Primäre Referenz: [Konfigurationsreferenz - Discord](/de/gateway/config-channels#discord).

<Accordion title="Signalstarke Discord-Felder">

- Start/Auth: `enabled`, `token`, `accounts.*`, `allowBots`
- Richtlinie: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- Befehl: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- Event-Warteschlange: `eventQueue.listenerTimeout` (Listener-Budget), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- Antwort/Verlauf: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- Zustellung: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- Streaming: `streaming` (Legacy-Alias: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- Medien/Wiederholung: `mediaMaxMb` (begrenzt ausgehende Discord-Uploads, Standardwert `100MB`), `retry`
- Aktionen: `actions.*`
- Präsenz: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- Funktionen: `threadBindings`, oberste Ebene `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## Sicherheit und Betrieb

- Behandeln Sie Bot-Token als Secrets (`DISCORD_BOT_TOKEN` in überwachten Umgebungen bevorzugt).
- Gewähren Sie Discord-Berechtigungen nach dem Least-Privilege-Prinzip.
- Wenn Befehlsbereitstellung oder -zustand veraltet ist, starten Sie den Gateway neu und prüfen Sie erneut mit `openclaw channels status --probe`.

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Kopplung" icon="link" href="/de/channels/pairing">
    Koppeln Sie einen Discord-Benutzer mit dem Gateway.
  </Card>
  <Card title="Gruppen" icon="users" href="/de/channels/groups">
    Verhalten von Gruppenchat und Allowlist.
  </Card>
  <Card title="Kanalrouting" icon="route" href="/de/channels/channel-routing">
    Eingehende Nachrichten an Agenten weiterleiten.
  </Card>
  <Card title="Sicherheit" icon="shield" href="/de/gateway/security">
    Bedrohungsmodell und Härtung.
  </Card>
  <Card title="Multi-Agent-Routing" icon="sitemap" href="/de/concepts/multi-agent">
    Guilds und Kanäle Agenten zuordnen.
  </Card>
  <Card title="Slash-Befehle" icon="terminal" href="/de/tools/slash-commands">
    Natives Befehlsverhalten.
  </Card>
</CardGroup>
