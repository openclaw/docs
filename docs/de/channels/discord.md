---
read_when:
    - Arbeiten an Funktionen für Discord-Kanäle
summary: Supportstatus, Funktionen und Konfiguration des Discord-Bots
title: Discord
x-i18n:
    generated_at: "2026-05-04T07:02:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1e00f9d9b134296ac1ca52bb4058fc62ea7a95c4d46d9478648b2ecdd448652a
    source_path: channels/discord.md
    workflow: 16
---

Bereit für Direktnachrichten (DMs) und Guild-Kanäle über den offiziellen Discord-Gateway.

<CardGroup cols={3}>
  <Card title="Kopplung" icon="link" href="/de/channels/pairing">
    Discord-DMs verwenden standardmäßig den Kopplungsmodus.
  </Card>
  <Card title="Slash-Befehle" icon="terminal" href="/de/tools/slash-commands">
    Natives Befehlsverhalten und Befehlskatalog.
  </Card>
  <Card title="Kanal-Fehlerbehebung" icon="wrench" href="/de/channels/troubleshooting">
    Kanalübergreifende Diagnose und Reparaturablauf.
  </Card>
</CardGroup>

## Schnelle Einrichtung

Sie müssen eine neue Anwendung mit einem Bot erstellen, den Bot zu Ihrem Server hinzufügen und ihn mit OpenClaw koppeln. Wir empfehlen, Ihren Bot zu Ihrem eigenen privaten Server hinzuzufügen. Falls Sie noch keinen haben, [erstellen Sie zuerst einen](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (wählen Sie **Create My Own > For me and my friends**).

<Steps>
  <Step title="Discord-Anwendung und Bot erstellen">
    Gehen Sie zum [Discord Developer Portal](https://discord.com/developers/applications) und klicken Sie auf **New Application**. Geben Sie ihr einen Namen wie „OpenClaw“.

    Klicken Sie in der Seitenleiste auf **Bot**. Setzen Sie den **Username** auf den Namen, den Sie Ihrem OpenClaw-Agenten geben.

  </Step>

  <Step title="Privilegierte Intents aktivieren">
    Scrollen Sie weiterhin auf der Seite **Bot** nach unten zu **Privileged Gateway Intents** und aktivieren Sie:

    - **Message Content Intent** (erforderlich)
    - **Server Members Intent** (empfohlen; erforderlich für Rollen-Allowlists und die Zuordnung von Namen zu IDs)
    - **Presence Intent** (optional; nur für Präsenzaktualisierungen erforderlich)

  </Step>

  <Step title="Bot-Token kopieren">
    Scrollen Sie auf der Seite **Bot** wieder nach oben und klicken Sie auf **Reset Token**.

    <Note>
    Trotz des Namens wird dadurch Ihr erstes Token erzeugt — es wird nichts „zurückgesetzt“.
    </Note>

    Kopieren Sie das Token und speichern Sie es an einem sicheren Ort. Dies ist Ihr **Bot Token**, das Sie gleich benötigen.

  </Step>

  <Step title="Einladungs-URL erzeugen und Bot zum Server hinzufügen">
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

    Dies ist der Basissatz für normale Textkanäle. Wenn Sie vorhaben, in Discord-Threads zu posten, einschließlich Forum- oder Medienkanal-Workflows, die einen Thread erstellen oder fortsetzen, aktivieren Sie außerdem **Send Messages in Threads**.
    Kopieren Sie unten die erzeugte URL, fügen Sie sie in Ihren Browser ein, wählen Sie Ihren Server aus und klicken Sie auf **Continue**, um die Verbindung herzustellen. Sie sollten Ihren Bot nun im Discord-Server sehen.

  </Step>

  <Step title="Developer Mode aktivieren und IDs sammeln">
    Zurück in der Discord-App müssen Sie den Developer Mode aktivieren, damit Sie interne IDs kopieren können.

    1. Klicken Sie auf **User Settings** (Zahnradsymbol neben Ihrem Avatar) → **Advanced** → aktivieren Sie **Developer Mode**
    2. Klicken Sie in der Seitenleiste mit der rechten Maustaste auf Ihr **Server-Symbol** → **Copy Server ID**
    3. Klicken Sie mit der rechten Maustaste auf Ihren **eigenen Avatar** → **Copy User ID**

    Speichern Sie Ihre **Server ID** und **User ID** zusammen mit Ihrem Bot Token — Sie senden alle drei im nächsten Schritt an OpenClaw.

  </Step>

  <Step title="DMs von Servermitgliedern zulassen">
    Damit die Kopplung funktioniert, muss Discord Ihrem Bot erlauben, Ihnen eine DM zu senden. Klicken Sie mit der rechten Maustaste auf Ihr **Server-Symbol** → **Privacy Settings** → aktivieren Sie **Direct Messages**.

    Dadurch können Servermitglieder (einschließlich Bots) Ihnen DMs senden. Lassen Sie dies aktiviert, wenn Sie Discord-DMs mit OpenClaw verwenden möchten. Wenn Sie nur Guild-Kanäle verwenden möchten, können Sie DMs nach der Kopplung deaktivieren.

  </Step>

  <Step title="Bot-Token sicher setzen (nicht im Chat senden)">
    Ihr Discord-Bot-Token ist ein Geheimnis (wie ein Passwort). Setzen Sie es auf dem Rechner, auf dem OpenClaw läuft, bevor Sie Ihrem Agenten schreiben.

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

    Wenn OpenClaw bereits als Hintergrunddienst läuft, starten Sie es über die OpenClaw-Mac-App neu oder beenden und starten Sie den Prozess `openclaw gateway run` erneut.
    Führen Sie bei verwalteten Dienstinstallationen `openclaw gateway install` aus einer Shell aus, in der `DISCORD_BOT_TOKEN` vorhanden ist, oder speichern Sie die Variable in `~/.openclaw/.env`, damit der Dienst die Env-SecretRef nach dem Neustart auflösen kann.
    Wenn Ihr Host durch Discords Anwendungsabfrage beim Start blockiert oder rate-limitiert wird, setzen Sie die Discord-Anwendungs-/Client-ID aus dem Developer Portal, damit der Start diesen REST-Aufruf überspringen kann. Verwenden Sie `channels.discord.applicationId` für das Standardkonto oder `channels.discord.accounts.<accountId>.applicationId`, wenn Sie mehrere Discord-Bots betreiben.

  </Step>

  <Step title="OpenClaw konfigurieren und koppeln">

    <Tabs>
      <Tab title="Agenten fragen">
        Chatten Sie mit Ihrem OpenClaw-Agenten in einem bestehenden Kanal (z. B. Telegram) und teilen Sie es ihm mit. Wenn Discord Ihr erster Kanal ist, verwenden Sie stattdessen den Tab CLI / Konfiguration.

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

        Schreiben Sie für skriptgesteuerte oder Remote-Einrichtung denselben JSON5-Block mit `openclaw config patch --file ./discord.patch.json5 --dry-run` und führen Sie ihn anschließend erneut ohne `--dry-run` aus. Klartextwerte für `token` werden unterstützt. SecretRef-Werte werden ebenfalls für `channels.discord.token` über Env-/Datei-/Exec-Provider hinweg unterstützt. Siehe [Geheimnisverwaltung](/de/gateway/secrets).

        Bei mehreren Discord-Bots speichern Sie jedes Bot-Token und jede Anwendungs-ID unter dem jeweiligen Konto. Ein `channels.discord.applicationId` auf oberster Ebene wird von Konten geerbt; setzen Sie es dort also nur, wenn jedes Konto dieselbe Anwendungs-ID verwenden soll.

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
      <Tab title="Agenten fragen">
        Senden Sie den Kopplungscode in Ihrem bestehenden Kanal an Ihren Agenten:

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
Die Token-Auflösung ist kontobewusst. Konfigurierte Token-Werte haben Vorrang vor Env-Fallbacks. `DISCORD_BOT_TOKEN` wird nur für das Standardkonto verwendet.
Wenn zwei aktivierte Discord-Konten auf dasselbe Bot-Token auflösen, startet OpenClaw nur einen Gateway-Monitor für dieses Token. Ein aus der Konfiguration stammendes Token hat Vorrang vor dem Standard-Env-Fallback; andernfalls gewinnt das erste aktivierte Konto, und das doppelte Konto wird als deaktiviert gemeldet.
Bei erweiterten ausgehenden Aufrufen (Nachrichten-Tool/Kanalaktionen) wird ein explizites `token` pro Aufruf für diesen Aufruf verwendet. Dies gilt für Aktionen im Stil von Senden und Lesen/Prüfen (zum Beispiel Lesen/Suchen/Abrufen/Thread/Pins/Berechtigungen). Kontorichtlinien und Wiederholungseinstellungen stammen weiterhin aus dem ausgewählten Konto im aktiven Laufzeit-Snapshot.
</Note>

## Empfohlen: Guild-Arbeitsbereich einrichten

Sobald DMs funktionieren, können Sie Ihren Discord-Server als vollständigen Arbeitsbereich einrichten, in dem jeder Kanal eine eigene Agentensitzung mit eigenem Kontext erhält. Dies wird für private Server empfohlen, auf denen nur Sie und Ihr Bot aktiv sind.

<Steps>
  <Step title="Server zur Guild-Allowlist hinzufügen">
    Dadurch kann Ihr Agent in jedem Kanal auf Ihrem Server antworten, nicht nur in DMs.

    <Tabs>
      <Tab title="Agenten fragen">
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

  <Step title="Antworten ohne @Erwähnung zulassen">
    Standardmäßig antwortet Ihr Agent in Guild-Kanälen nur, wenn er @erwähnt wird. Für einen privaten Server möchten Sie wahrscheinlich, dass er auf jede Nachricht reagiert.

    In Guild-Kanälen bleiben normale finale Assistant-Antworten standardmäßig privat. Sichtbare Discord-Ausgaben müssen explizit mit dem Tool `message` gesendet werden, sodass der Agent standardmäßig mitlesen und nur posten kann, wenn er entscheidet, dass eine Kanalantwort sinnvoll ist.

    Das bedeutet, dass das ausgewählte Modell zuverlässig Tools aufrufen muss. Wenn Discord Tippen anzeigt und die Logs Token-Nutzung zeigen, aber keine Nachricht gepostet wird, prüfen Sie das Sitzungslog auf Assistant-Text mit `didSendViaMessagingTool: false`. Das bedeutet, dass das Modell eine private finale Antwort erzeugt hat, statt `message(action=send)` aufzurufen. Wechseln Sie zu einem stärkeren Tool-Calling-Modell oder verwenden Sie die folgende Konfiguration, um ältere automatische finale Antworten wiederherzustellen.

    <Tabs>
      <Tab title="Agenten fragen">
        > „Erlauben Sie meinem Agenten, auf diesem Server zu antworten, ohne @erwähnt werden zu müssen“
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

        Um ältere automatische finale Antworten für Gruppen-/Kanalräume wiederherzustellen, setzen Sie `messages.groupChat.visibleReplies: "automatic"`.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Speicher in Guild-Kanälen planen">
    Standardmäßig wird Langzeitspeicher (MEMORY.md) nur in DM-Sitzungen geladen. Guild-Kanäle laden MEMORY.md nicht automatisch.

    <Tabs>
      <Tab title="Agenten fragen">
        > „Wenn ich in Discord-Kanälen Fragen stelle, verwenden Sie memory_search oder memory_get, wenn Sie Langzeitkontext aus MEMORY.md benötigen.“
      </Tab>
      <Tab title="Manuell">
        Wenn Sie geteilten Kontext in jedem Kanal benötigen, legen Sie die stabilen Anweisungen in `AGENTS.md` oder `USER.md` ab (sie werden in jede Sitzung injiziert). Bewahren Sie Langzeitnotizen in `MEMORY.md` auf und greifen Sie bei Bedarf mit Speicher-Tools darauf zu.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Erstellen Sie nun einige Kanäle auf Ihrem Discord-Server und beginnen Sie zu chatten. Ihr Agent kann den Kanalnamen sehen, und jeder Kanal erhält seine eigene isolierte Sitzung — Sie können also `#coding`, `#home`, `#research` oder alles einrichten, was zu Ihrem Workflow passt.

## Laufzeitmodell

- Der Gateway verwaltet die Discord-Verbindung.
- Antwort-Routing ist deterministisch: Eingehende Discord-Antworten werden zurück an Discord geleitet.
- Discord-Guild-/Kanal-Metadaten werden dem Modell-Prompt als nicht vertrauenswürdiger
  Kontext hinzugefügt, nicht als für Benutzer sichtbares Antwortpräfix. Wenn ein Modell diesen Umschlag
  zurückkopiert, entfernt OpenClaw die kopierten Metadaten aus ausgehenden Antworten und aus dem
  künftigen Replay-Kontext.
- Standardmäßig (`session.dmScope=main`) teilen direkte Chats die Hauptsitzung des Agenten (`agent:main:main`).
- Guild-Kanäle sind isolierte Sitzungsschlüssel (`agent:<agentId>:discord:channel:<channelId>`).
- Gruppen-DMs werden standardmäßig ignoriert (`channels.discord.dm.groupEnabled=false`).
- Native Slash-Befehle laufen in isolierten Befehlssitzungen (`agent:<agentId>:discord:slash:<userId>`), während sie weiterhin `CommandTargetSessionKey` zur gerouteten Unterhaltungssitzung mitführen.
- Die reine Text-Auslieferung von Cron-/Heartbeat-Ankündigungen an Discord verwendet die finale,
  für den Assistenten sichtbare Antwort einmal. Medien und strukturierte Komponenten-Payloads bleiben
  mehrteilig, wenn der Agent mehrere auslieferbare Payloads ausgibt.

## Forum-Kanäle

Discord-Forum- und Medienkanäle akzeptieren nur Thread-Beiträge. OpenClaw unterstützt zwei Möglichkeiten, sie zu erstellen:

- Senden Sie eine Nachricht an den Forum-Parent (`channel:<forumId>`), um automatisch einen Thread zu erstellen. Der Thread-Titel verwendet die erste nicht leere Zeile Ihrer Nachricht.
- Verwenden Sie `openclaw message thread create`, um direkt einen Thread zu erstellen. Übergeben Sie für Forum-Kanäle nicht `--message-id`.

Beispiel: An Forum-Parent senden, um einen Thread zu erstellen

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

OpenClaw unterstützt Discord-Komponenten-v2-Container für Agenten-Nachrichten. Verwenden Sie das Nachrichten-Tool mit einer `components`-Payload. Interaktionsergebnisse werden als normale eingehende Nachrichten zurück an den Agenten geleitet und folgen den bestehenden Discord-`replyToMode`-Einstellungen.

Unterstützte Blöcke:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Aktionszeilen erlauben bis zu 5 Schaltflächen oder ein einzelnes Auswahlmenü
- Auswahltypen: `string`, `user`, `role`, `mentionable`, `channel`

Standardmäßig sind Komponenten nur einmal verwendbar. Setzen Sie `components.reusable=true`, damit Schaltflächen, Auswahlen und Formulare bis zu ihrem Ablauf mehrfach verwendet werden können.

Um einzuschränken, wer auf eine Schaltfläche klicken kann, setzen Sie `allowedUsers` für diese Schaltfläche (Discord-Benutzer-IDs, Tags oder `*`). Wenn dies konfiguriert ist, erhalten nicht passende Benutzer eine flüchtige Ablehnung.

Die Slash-Befehle `/model` und `/models` öffnen eine interaktive Modellauswahl mit Dropdowns für Provider, Modell und kompatible Laufzeit sowie einem Absenden-Schritt. `/models add` ist veraltet und gibt jetzt eine Veraltungsmeldung zurück, statt Modelle aus dem Chat zu registrieren. Die Auswahlantwort ist flüchtig, und nur der aufrufende Benutzer kann sie verwenden.

Dateianhänge:

- `file`-Blöcke müssen auf eine Anhangsreferenz verweisen (`attachment://<filename>`)
- Stellen Sie den Anhang über `media`/`path`/`filePath` bereit (einzelne Datei); verwenden Sie `media-gallery` für mehrere Dateien
- Verwenden Sie `filename`, um den Upload-Namen zu überschreiben, wenn er mit der Anhangsreferenz übereinstimmen soll

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
    `channels.discord.dmPolicy` steuert den DM-Zugriff. `channels.discord.allowFrom` ist die kanonische DM-Allowlist.

    - `pairing` (Standard)
    - `allowlist`
    - `open` (erfordert, dass `channels.discord.allowFrom` `"*"` enthält)
    - `disabled`

    Wenn die DM-Richtlinie nicht offen ist, werden unbekannte Benutzer blockiert (oder im Modus `pairing` zum Pairing aufgefordert).

    Vorrang bei mehreren Konten:

    - `channels.discord.accounts.default.allowFrom` gilt nur für das Konto `default`.
    - Bei einem Konto hat `allowFrom` Vorrang vor dem alten `dm.allowFrom`.
    - Benannte Konten erben `channels.discord.allowFrom`, wenn ihr eigenes `allowFrom` und das alte `dm.allowFrom` nicht gesetzt sind.
    - Benannte Konten erben nicht `channels.discord.accounts.default.allowFrom`.

    Die alten Optionen `channels.discord.dm.policy` und `channels.discord.dm.allowFrom` werden aus Kompatibilitätsgründen weiterhin gelesen. `openclaw doctor --fix` migriert sie zu `dmPolicy` und `allowFrom`, wenn dies ohne Änderung des Zugriffs möglich ist.

    DM-Zielformat für die Auslieferung:

    - `user:<id>`
    - `<@id>`-Erwähnung

    Bloße numerische IDs werden normalerweise als Kanal-IDs aufgelöst, wenn ein Kanalstandard aktiv ist, aber IDs, die in der effektiven DM-`allowFrom` des Kontos aufgeführt sind, werden aus Kompatibilitätsgründen als Benutzer-DM-Ziele behandelt.

  </Tab>

  <Tab title="DM-Zugriffsgruppen">
    Discord-DMs können dynamische `accessGroup:<name>`-Einträge in `channels.discord.allowFrom` verwenden.

    Zugriffsgruppennamen werden über Nachrichtenkanäle hinweg geteilt. Verwenden Sie `type: "message.senders"` für eine statische Gruppe, deren Mitglieder in der normalen `allowFrom`-Syntax des jeweiligen Kanals ausgedrückt werden, oder `type: "discord.channelAudience"`, wenn die aktuelle `ViewChannel`-Zielgruppe eines Discord-Kanals die Mitgliedschaft dynamisch definieren soll. Das gemeinsame Verhalten von Zugriffsgruppen ist hier dokumentiert: [Zugriffsgruppen](/de/channels/access-groups).

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

    Ein Discord-Textkanal hat keine separate Mitgliederliste. `type: "discord.channelAudience"` modelliert Mitgliedschaft so: Der DM-Absender ist Mitglied der konfigurierten Guild und hat derzeit effektive `ViewChannel`-Berechtigung für den konfigurierten Kanal, nachdem Rollen- und Kanalüberschreibungen angewendet wurden.

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

    Nachschlagen schlägt geschlossen fehl. Wenn Discord `Missing Access` zurückgibt, die Mitgliedersuche fehlschlägt oder der Kanal zu einer anderen Guild gehört, wird der DM-Absender als nicht autorisiert behandelt.

    Aktivieren Sie im Discord Developer Portal **Server Members Intent** für den Bot, wenn Sie kanalzielgruppenbasierte Zugriffsgruppen verwenden. DMs enthalten keinen Guild-Mitgliedsstatus, daher löst OpenClaw das Mitglied zur Autorisierungszeit über Discord REST auf.

  </Tab>

  <Tab title="Guild-Richtlinie">
    Die Guild-Behandlung wird durch `channels.discord.groupPolicy` gesteuert:

    - `open`
    - `allowlist`
    - `disabled`

    Die sichere Basislinie, wenn `channels.discord` vorhanden ist, ist `allowlist`.

    `allowlist`-Verhalten:

    - Guild muss mit `channels.discord.guilds` übereinstimmen (`id` bevorzugt, Slug akzeptiert)
    - optionale Absender-Allowlists: `users` (stabile IDs empfohlen) und `roles` (nur Rollen-IDs); wenn eine davon konfiguriert ist, sind Absender erlaubt, wenn sie mit `users` ODER `roles` übereinstimmen
    - direkte Namens-/Tag-Übereinstimmung ist standardmäßig deaktiviert; aktivieren Sie `channels.discord.dangerouslyAllowNameMatching: true` nur als Break-Glass-Kompatibilitätsmodus
    - Namen/Tags werden für `users` unterstützt, aber IDs sind sicherer; `openclaw security audit` warnt, wenn Namens-/Tag-Einträge verwendet werden
    - wenn für eine Guild `channels` konfiguriert ist, werden nicht aufgeführte Kanäle abgelehnt
    - wenn eine Guild keinen `channels`-Block hat, sind alle Kanäle in dieser in der Allowlist enthaltenen Guild erlaubt

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

    Wenn Sie nur `DISCORD_BOT_TOKEN` setzen und keinen `channels.discord`-Block erstellen, ist der Laufzeit-Fallback `groupPolicy="allowlist"` (mit einer Warnung in den Logs), selbst wenn `channels.defaults.groupPolicy` `open` ist.

  </Tab>

  <Tab title="Erwähnungen und Gruppen-DMs">
    Guild-Nachrichten erfordern standardmäßig eine Erwähnung.

    Die Erkennung von Erwähnungen umfasst:

    - explizite Bot-Erwähnung
    - konfigurierte Erwähnungsmuster (`agents.list[].groupChat.mentionPatterns`, Fallback `messages.groupChat.mentionPatterns`)
    - implizites Antwort-an-Bot-Verhalten in unterstützten Fällen

    Verwenden Sie beim Schreiben ausgehender Discord-Nachrichten die kanonische Erwähnungssyntax: `<@USER_ID>` für Benutzer, `<#CHANNEL_ID>` für Kanäle und `<@&ROLE_ID>` für Rollen. Verwenden Sie nicht die alte Nickname-Erwähnungsform `<@!USER_ID>`.

    `requireMention` wird pro Guild/Kanal konfiguriert (`channels.discord.guilds...`).
    `ignoreOtherMentions` verwirft optional Nachrichten, die einen anderen Benutzer/eine andere Rolle erwähnen, aber nicht den Bot (ausgenommen @everyone/@here).

    Gruppen-DMs:

    - Standard: ignoriert (`dm.groupEnabled=false`)
    - optionale Allowlist über `dm.groupChannels` (Kanal-IDs oder Slugs)

  </Tab>
</Tabs>

### Rollenbasiertes Agenten-Routing

Verwenden Sie `bindings[].match.roles`, um Discord-Guild-Mitglieder anhand der Rollen-ID an verschiedene Agenten zu leiten. Rollenbasierte Bindings akzeptieren nur Rollen-IDs und werden nach Peer- oder Parent-Peer-Bindings und vor reinen Guild-Bindings ausgewertet. Wenn ein Binding auch andere Abgleichsfelder setzt (zum Beispiel `peer` + `guildId` + `roles`), müssen alle konfigurierten Felder übereinstimmen.

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
- Überschreibung pro Kanal: `channels.discord.commands.native`.
- `commands.native=false` überspringt beim Start die Registrierung und Bereinigung von Discord-Slash-Commands. Zuvor registrierte Commands können in Discord sichtbar bleiben, bis Sie sie aus der Discord-App entfernen.
- Native Command-Authentifizierung verwendet dieselben Discord-Allowlists/-Richtlinien wie die normale Nachrichtenverarbeitung.
- Commands können in der Discord UI weiterhin für Benutzer sichtbar sein, die nicht autorisiert sind; die Ausführung erzwingt dennoch die OpenClaw-Authentifizierung und gibt „not authorized“ zurück.

Siehe [Slash-Commands](/de/tools/slash-commands) für Command-Katalog und Verhalten.

Standardmäßige Slash-Command-Einstellungen:

- `ephemeral: true`

## Funktionsdetails

<AccordionGroup>
  <Accordion title="Antwort-Tags und native Antworten">
    Discord unterstützt Antwort-Tags in Agentenausgaben:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Gesteuert durch `channels.discord.replyToMode`:

    - `off` (Standard)
    - `first`
    - `all`
    - `batched`

    Hinweis: `off` deaktiviert implizites Reply-Threading. Explizite `[[reply_to_*]]`-Tags werden weiterhin berücksichtigt.
    `first` hängt die implizite native Reply-Referenz immer an die erste ausgehende Discord-Nachricht für den Durchlauf an.
    `batched` hängt die implizite native Reply-Referenz von Discord nur an, wenn der
    eingehende Durchlauf ein entprellter Batch aus mehreren Nachrichten war. Das ist nützlich,
    wenn Sie native Replies vor allem für mehrdeutige, stoßweise Chats wünschen, nicht für jeden
    Durchlauf mit einer einzelnen Nachricht.

    Nachrichten-IDs werden im Kontext/Verlauf bereitgestellt, damit Agenten gezielt bestimmte Nachrichten adressieren können.

  </Accordion>

  <Accordion title="Live-Stream-Vorschau">
    OpenClaw kann Antwortentwürfe streamen, indem es eine temporäre Nachricht sendet und sie bearbeitet, sobald Text eintrifft. `channels.discord.streaming` akzeptiert `off` (Standard) | `partial` | `block` | `progress`. `progress` behält einen bearbeitbaren Statusentwurf bei und aktualisiert ihn mit Tool-Fortschritt bis zur finalen Zustellung; `streamMode` ist ein Legacy-Alias und wird automatisch migriert.

    Die Standardeinstellung bleibt `off`, weil Discord-Vorschaubearbeitungen schnell an Rate Limits stoßen, wenn mehrere Bots oder Gateways ein Konto gemeinsam nutzen.

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
    - `block` gibt Entwurfs-Chunks in Entwurfsgröße aus (verwenden Sie `draftChunk`, um Größe und Umbruchpunkte anzupassen, begrenzt auf `textChunkLimit`).
    - Medien, Fehler und finale Antworten mit explizitem Reply brechen ausstehende Vorschaubearbeitungen ab.
    - `streaming.preview.toolProgress` (Standard `true`) steuert, ob Tool-/Fortschrittsaktualisierungen die Vorschaunachricht wiederverwenden.
    - `streaming.preview.commandText` / `streaming.progress.commandText` steuert Command-/Exec-Details in kompakten Fortschrittszeilen: `raw` (Standard) oder `status` (nur Tool-Bezeichnung).

    Rohtext von Command/Exec ausblenden, aber kompakte Fortschrittszeilen beibehalten:

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

    Vorschau-Streaming ist nur textbasiert; Medienantworten fallen auf normale Zustellung zurück. Wenn `block`-Streaming explizit aktiviert ist, überspringt OpenClaw den Vorschaustream, um doppeltes Streaming zu vermeiden.

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

    - Discord-Threads werden als Kanalsitzungen geroutet und erben die Konfiguration des übergeordneten Kanals, sofern sie nicht überschrieben wird.
    - Thread-Sitzungen erben die sitzungsbezogene `/model`-Auswahl des übergeordneten Kanals als reine Modell-Fallback-Option; thread-lokale `/model`-Auswahlen haben weiterhin Vorrang, und der Transkriptverlauf des übergeordneten Kanals wird nur kopiert, wenn Transkriptvererbung aktiviert ist.
    - `channels.discord.thread.inheritParent` (Standard `false`) aktiviert für neue Auto-Threads das Initialisieren aus dem übergeordneten Transkript. Überschreibungen pro Konto befinden sich unter `channels.discord.accounts.<id>.thread.inheritParent`.
    - Message-Tool-Reaktionen können `user:<id>`-DM-Ziele auflösen.
    - `guilds.<guild>.channels.<channel>.requireMention: false` bleibt beim Reply-Stage-Aktivierungs-Fallback erhalten.

    Kanalthemen werden als **nicht vertrauenswürdiger** Kontext eingefügt. Allowlists steuern, wer den Agenten auslösen kann, nicht eine vollständige Redaktionsgrenze für ergänzenden Kontext.

  </Accordion>

  <Accordion title="Thread-gebundene Sitzungen für Subagenten">
    Discord kann einen Thread an ein Sitzungsziel binden, sodass Follow-up-Nachrichten in diesem Thread weiterhin zur selben Sitzung geroutet werden (einschließlich Subagent-Sitzungen).

    Commands:

    - `/focus <target>` bindet aktuellen/neuen Thread an ein Subagent-/Sitzungsziel
    - `/unfocus` entfernt die aktuelle Thread-Bindung
    - `/agents` zeigt aktive Läufe und Bindungsstatus an
    - `/session idle <duration|off>` prüft/aktualisiert Auto-Unfocus bei Inaktivität für fokussierte Bindungen
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

    - `session.threadBindings.*` legt globale Standardwerte fest.
    - `channels.discord.threadBindings.*` überschreibt Discord-Verhalten.
    - `spawnSessions` steuert das automatische Erstellen/Binden von Threads für `sessions_spawn({ thread: true })` und ACP-Thread-Spawns. Standard: `true`.
    - `defaultSpawnContext` steuert den nativen Subagent-Kontext für Thread-gebundene Spawns. Standard: `"fork"`.
    - Veraltete Schlüssel `spawnSubagentSessions`/`spawnAcpSessions` werden durch `openclaw doctor --fix` migriert.
    - Wenn Thread-Bindungen für ein Konto deaktiviert sind, sind `/focus` und verwandte Thread-Bindungsoperationen nicht verfügbar.

    Siehe [Subagenten](/de/tools/subagents), [ACP-Agenten](/de/tools/acp-agents) und [Konfigurationsreferenz](/de/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Persistente ACP-Kanalbindungen">
    Für stabile „always-on“-ACP-Arbeitsbereiche konfigurieren Sie typisierte ACP-Bindungen auf oberster Ebene, die auf Discord-Unterhaltungen abzielen.

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

    - `/acp spawn codex --bind here` bindet den aktuellen Kanal oder Thread an Ort und Stelle und hält zukünftige Nachrichten in derselben ACP-Sitzung. Thread-Nachrichten erben die Bindung des übergeordneten Kanals.
    - In einem gebundenen Kanal oder Thread setzen `/new` und `/reset` dieselbe ACP-Sitzung an Ort und Stelle zurück. Temporäre Thread-Bindungen können die Zielauflösung überschreiben, solange sie aktiv sind.
    - `spawnSessions` steuert die Erstellung/Bindung untergeordneter Threads über `--thread auto|here`.

    Siehe [ACP-Agenten](/de/tools/acp-agents) für Details zum Bindungsverhalten.

  </Accordion>

  <Accordion title="Reaktionsbenachrichtigungen">
    Reaktionsbenachrichtigungsmodus pro Guild:

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
    - Fallback auf Agentenidentitäts-Emoji (`agents.list[].identity.emoji`, sonst "👀")

    Hinweise:

    - Discord akzeptiert Unicode-Emoji oder benutzerdefinierte Emoji-Namen.
    - Verwenden Sie `""`, um die Reaktion für einen Kanal oder ein Konto zu deaktivieren.

  </Accordion>

  <Accordion title="Konfigurationsschreibvorgänge">
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

  <Accordion title="Gateway-Proxy">
    Routen Sie Discord-Gateway-WebSocket-Datenverkehr und REST-Lookups beim Start (Application-ID + Allowlist-Auflösung) über einen HTTP(S)-Proxy mit `channels.discord.proxy`.

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
    Aktivieren Sie die PluralKit-Auflösung, um proxied Messages der Identität eines Systemmitglieds zuzuordnen:

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
    - Anzeigenamen von Mitgliedern werden nur nach Name/Slug abgeglichen, wenn `channels.discord.dangerouslyAllowNameMatching: true`
    - Lookups verwenden die ursprüngliche Nachrichten-ID und sind zeitfensterbeschränkt
    - Wenn der Lookup fehlschlägt, werden proxied Messages als Bot-Nachrichten behandelt und verworfen, sofern `allowBots=true` nicht gesetzt ist

  </Accordion>

  <Accordion title="Ausgehende Mention-Aliasse">
    Verwenden Sie `mentionAliases`, wenn Agenten deterministische ausgehende Mentions für bekannte Discord-Benutzer benötigen. Schlüssel sind Handles ohne führendes `@`; Werte sind Discord-Benutzer-IDs. Unbekannte Handles, `@everyone`, `@here` und Mentions innerhalb von Markdown-Code-Spans bleiben unverändert.

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
    Presence-Aktualisierungen werden angewendet, wenn Sie ein Status- oder Aktivitätsfeld festlegen oder Auto-Presence aktivieren.

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

    Aktivitätstyp-Zuordnung:

    - 0: Spielen
    - 1: Streaming (erfordert `activityUrl`)
    - 2: Hören
    - 3: Ansehen
    - 4: Benutzerdefiniert (verwendet den Aktivitätstext als Statuszustand; Emoji ist optional)
    - 5: Konkurrieren

    Auto-Presence-Beispiel (Runtime-Zustandssignal):

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

    Auto-Präsenz ordnet die Runtime-Verfügbarkeit dem Discord-Status zu: healthy => online, degraded oder unknown => idle, exhausted oder unavailable => dnd. Optionale Textüberschreibungen:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (unterstützt den Platzhalter `{reason}`)

  </Accordion>

  <Accordion title="Freigaben in Discord">
    Discord unterstützt buttonbasierte Freigabeabläufe in DMs und kann Freigabeaufforderungen optional im ursprünglichen Kanal posten.

    Konfigurationspfad:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (optional; fällt nach Möglichkeit auf `commands.ownerAllowFrom` zurück)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, Standard: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord aktiviert native Exec-Freigaben automatisch, wenn `enabled` nicht gesetzt oder `"auto"` ist und mindestens ein Freigebender aufgelöst werden kann, entweder aus `execApprovals.approvers` oder aus `commands.ownerAllowFrom`. Discord leitet keine Exec-Freigebenden aus Kanal-`allowFrom`, dem Legacy-`dm.allowFrom` oder Direct-Message-`defaultTo` ab. Setzen Sie `enabled: false`, um Discord explizit als nativen Freigabe-Client zu deaktivieren.

    Für sensible, nur Ownern vorbehaltene Gruppenbefehle wie `/diagnostics` und `/export-trajectory` sendet OpenClaw Freigabeaufforderungen und Endergebnisse privat. Zuerst versucht es Discord-DM, wenn der aufrufende Owner eine Discord-Owner-Route hat; falls diese nicht verfügbar ist, fällt es auf die erste verfügbare Owner-Route aus `commands.ownerAllowFrom` zurück, zum Beispiel Telegram.

    Wenn `target` `channel` oder `both` ist, ist die Freigabeaufforderung im Kanal sichtbar. Nur aufgelöste Freigebende können die Buttons verwenden; andere Benutzer erhalten eine ephemere Ablehnung. Freigabeaufforderungen enthalten den Befehlstext, aktivieren Sie die Kanalzustellung daher nur in vertrauenswürdigen Kanälen. Wenn die Kanal-ID nicht aus dem Sitzungsschlüssel abgeleitet werden kann, fällt OpenClaw auf DM-Zustellung zurück.

    Discord rendert außerdem die gemeinsam genutzten Freigabe-Buttons, die von anderen Chat-Kanälen verwendet werden. Der native Discord-Adapter ergänzt hauptsächlich Freigebenden-DM-Routing und Kanal-Fanout.
    Wenn diese Buttons vorhanden sind, sind sie die primäre Freigabe-UX; OpenClaw
    sollte nur dann einen manuellen `/approve`-Befehl einschließen, wenn das Tool-Ergebnis meldet,
    dass Chat-Freigaben nicht verfügbar sind oder die manuelle Freigabe der einzige Weg ist.
    Wenn die native Discord-Freigabe-Runtime nicht aktiv ist, lässt OpenClaw die
    lokale deterministische Aufforderung `/approve <id> <decision>` sichtbar. Wenn die
    Runtime aktiv ist, aber keine native Karte an irgendein Ziel zugestellt werden kann,
    sendet OpenClaw einen Fallback-Hinweis im selben Chat mit dem exakten `/approve`-
    Befehl aus der ausstehenden Freigabe.

    Gateway-Authentifizierung und Freigabeauflösung folgen dem gemeinsamen Gateway-Client-Vertrag (`plugin:`-IDs werden über `plugin.approval.resolve` aufgelöst; andere IDs über `exec.approval.resolve`). Freigaben laufen standardmäßig nach 30 Minuten ab.

    Siehe [Exec-Freigaben](/de/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Tools und Aktions-Gates

Discord-Nachrichtenaktionen umfassen Messaging-, Kanaladministrations-, Moderations-, Präsenz- und Metadatenaktionen.

Kernbeispiele:

- Messaging: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- Reaktionen: `react`, `reactions`, `emojiList`
- Moderation: `timeout`, `kick`, `ban`
- Präsenz: `setPresence`

Die Aktion `event-create` akzeptiert einen optionalen Parameter `image` (URL oder lokaler Dateipfad), um das Titelbild des geplanten Ereignisses festzulegen.

Aktions-Gates befinden sich unter `channels.discord.actions.*`.

Standardmäßiges Gate-Verhalten:

| Aktionsgruppe                                                                                                                                                           | Standard    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | aktiviert   |
| roles                                                                                                                                                                    | deaktiviert |
| moderation                                                                                                                                                               | deaktiviert |
| presence                                                                                                                                                                 | deaktiviert |

## Components-v2-UI

OpenClaw verwendet Discord Components v2 für Exec-Freigaben und Cross-Context-Markierungen. Discord-Nachrichtenaktionen können auch `components` für benutzerdefinierte UI akzeptieren (fortgeschritten; erfordert das Erstellen eines Component-Payloads über das Discord-Tool), während Legacy-`embeds` weiterhin verfügbar sind, aber nicht empfohlen werden.

- `channels.discord.ui.components.accentColor` legt die Akzentfarbe fest, die von Discord-Component-Containern verwendet wird (hex).
- Pro Konto mit `channels.discord.accounts.<id>.ui.components.accentColor` festlegen.
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

## Voice

Discord hat zwei verschiedene Voice-Oberflächen: Echtzeit-**Voice-Kanäle** (fortlaufende Gespräche) und **Voice-Message-Anhänge** (das Waveform-Vorschauformat). Das Gateway unterstützt beides.

### Voice-Kanäle

Einrichtungs-Checkliste:

1. Aktivieren Sie Message Content Intent im Discord Developer Portal.
2. Aktivieren Sie Server Members Intent, wenn Rollen-/Benutzer-Allowlists verwendet werden.
3. Laden Sie den Bot mit den Scopes `bot` und `applications.commands` ein.
4. Gewähren Sie Connect, Speak, Send Messages und Read Message History im Ziel-Voice-Kanal.
5. Aktivieren Sie native Befehle (`commands.native` oder `channels.discord.commands.native`).
6. Konfigurieren Sie `channels.discord.voice`.

Verwenden Sie `/vc join|leave|status`, um Sitzungen zu steuern. Der Befehl verwendet den Standard-Agent des Kontos und folgt denselben Allowlist- und Gruppenrichtlinienregeln wie andere Discord-Befehle.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
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

- `voice.tts` überschreibt `messages.tts` nur für Voice-Wiedergabe.
- `voice.model` überschreibt nur das LLM, das für Discord-Voice-Kanalantworten verwendet wird. Lassen Sie es nicht gesetzt, um das Modell des gerouteten Agent zu übernehmen.
- STT verwendet `tools.media.audio`; `voice.model` wirkt sich nicht auf die Transkription aus.
- Pro-Kanal-Discord-`systemPrompt`-Überschreibungen gelten für Voice-Transkript-Turns dieses Voice-Kanals.
- Voice-Transkript-Turns leiten den Owner-Status aus Discord-`allowFrom` (oder `dm.allowFrom`) ab; Nicht-Owner-Sprecher können nicht auf Owner-only-Tools zugreifen (zum Beispiel `gateway` und `cron`).
- Discord Voice ist für reine Textkonfigurationen Opt-in; setzen Sie `channels.discord.voice.enabled=true` (oder behalten Sie einen vorhandenen `channels.discord.voice`-Block bei), um `/vc`-Befehle, die Voice-Runtime und den Gateway-Intent `GuildVoiceStates` zu aktivieren.
- `channels.discord.intents.voiceStates` kann das Voice-State-Intent-Abonnement explizit überschreiben. Lassen Sie es nicht gesetzt, damit der Intent der effektiven Voice-Aktivierung folgt.
- `voice.daveEncryption` und `voice.decryptionFailureTolerance` werden an die Join-Optionen von `@discordjs/voice` weitergereicht.
- Die Standardwerte von `@discordjs/voice` sind `daveEncryption=true` und `decryptionFailureTolerance=24`, wenn nicht gesetzt.
- `voice.connectTimeoutMs` steuert die anfängliche `@discordjs/voice`-Ready-Wartezeit für `/vc join` und Auto-Join-Versuche. Standard: `30000`.
- `voice.reconnectGraceMs` steuert, wie lange OpenClaw auf den Beginn der Wiederverbindung einer getrennten Voice-Sitzung wartet, bevor sie zerstört wird. Standard: `15000`.
- OpenClaw überwacht außerdem Empfangs-Entschlüsselungsfehler und stellt sich automatisch wieder her, indem es den Voice-Kanal nach wiederholten Fehlern in einem kurzen Zeitfenster verlässt und erneut beitritt.
- Wenn Empfangslogs nach der Aktualisierung wiederholt `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` anzeigen, sammeln Sie einen Dependency-Bericht und Logs. Die gebündelte `@discordjs/voice`-Linie enthält den Upstream-Padding-Fix aus discord.js-PR #11449, der discord.js-Issue #11419 geschlossen hat.

Voice-Kanal-Pipeline:

- Discord-PCM-Erfassung wird in eine temporäre WAV-Datei konvertiert.
- `tools.media.audio` verarbeitet STT, zum Beispiel `openai/gpt-4o-mini-transcribe`.
- Das Transkript wird durch Discord-Ingress und Routing gesendet, während das Antwort-LLM mit einer Voice-Output-Richtlinie läuft, die das Agent-`tts`-Tool verbirgt und zurückgegebenen Text anfordert, weil Discord Voice die finale TTS-Wiedergabe besitzt.
- `voice.model` überschreibt, wenn gesetzt, nur das Antwort-LLM für diesen Voice-Kanal-Turn.
- `voice.tts` wird über `messages.tts` gemergt; das resultierende Audio wird im beigetretenen Kanal abgespielt.

Anmeldedaten werden pro Komponente aufgelöst: LLM-Routen-Authentifizierung für `voice.model`, STT-Authentifizierung für `tools.media.audio` und TTS-Authentifizierung für `messages.tts`/`voice.tts`.

### Voice-Nachrichten

Discord-Voice-Nachrichten zeigen eine Waveform-Vorschau und erfordern OGG/Opus-Audio. OpenClaw generiert die Waveform automatisch, benötigt aber `ffmpeg` und `ffprobe` auf dem Gateway-Host, um zu prüfen und zu konvertieren.

- Geben Sie einen **lokalen Dateipfad** an (URLs werden abgelehnt).
- Lassen Sie Textinhalt weg (Discord lehnt Text + Voice-Nachricht im selben Payload ab).
- Jedes Audioformat wird akzeptiert; OpenClaw konvertiert bei Bedarf zu OGG/Opus.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Nicht erlaubte Intents verwendet oder Bot sieht keine Guild-Nachrichten">

    - Message Content Intent aktivieren
    - Server Members Intent aktivieren, wenn Sie von Benutzer-/Member-Auflösung abhängen
    - Gateway nach dem Ändern von Intents neu starten

  </Accordion>

  <Accordion title="Guild-Nachrichten unerwartet blockiert">

    - `groupPolicy` prüfen
    - Guild-Allowlist unter `channels.discord.guilds` prüfen
    - wenn eine Guild-`channels`-Map existiert, sind nur aufgelistete Kanäle erlaubt
    - `requireMention`-Verhalten und Erwähnungsmuster prüfen

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
    - `requireMention` an der falschen Stelle konfiguriert (muss unter `channels.discord.guilds` oder dem Kanaleintrag liegen)
    - Absender durch Guild-/Kanal-`users`-Allowlist blockiert

  </Accordion>

  <Accordion title="Lang laufende Discord-Turns oder doppelte Antworten">

    Typische Logs:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Discord-Gateway-Queue-Regler:

    - Einzelkonto: `channels.discord.eventQueue.listenerTimeout`
    - Mehrere Konten: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - dies steuert nur Discord-Gateway-Listener-Arbeit, nicht die Agent-Turn-Laufzeit

    Discord wendet kein kanal-eigenes Timeout auf eingereihte Agent-Turns an. Nachrichten-Listener übergeben sofort, und eingereihte Discord-Läufe bewahren die Reihenfolge pro Sitzung, bis der Sitzungs-/Tool-/Runtime-Lebenszyklus abgeschlossen ist oder die Arbeit abbricht.

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

  <Accordion title="Gateway-Metadaten-Lookup-Timeout-Warnungen">
    OpenClaw ruft Discord-`/gateway/bot`-Metadaten vor dem Verbindungsaufbau ab. Vorübergehende Fehler fallen auf Discords Standard-Gateway-URL zurück und werden in den Logs ratenbegrenzt.

    Metadaten-Timeout-Schalter:

    - Einzelkonto: `channels.discord.gatewayInfoTimeoutMs`
    - Mehrfachkonto: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - Env-Fallback, wenn die Konfiguration nicht gesetzt ist: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - Standard: `30000` (30 Sekunden), max.: `120000`

  </Accordion>

  <Accordion title="Gateway-READY-Timeout-Neustarts">
    OpenClaw wartet während des Starts und nach Runtime-Reconnects auf Discords Gateway-`READY`-Ereignis. Mehrfachkonto-Setups mit gestaffeltem Start können ein längeres READY-Startfenster benötigen als der Standard.

    READY-Timeout-Schalter:

    - Start Einzelkonto: `channels.discord.gatewayReadyTimeoutMs`
    - Start Mehrfachkonto: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - Start-Env-Fallback, wenn die Konfiguration nicht gesetzt ist: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - Startstandard: `15000` (15 Sekunden), max.: `120000`
    - Runtime Einzelkonto: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - Runtime Mehrfachkonto: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - Runtime-Env-Fallback, wenn die Konfiguration nicht gesetzt ist: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - Runtime-Standard: `30000` (30 Sekunden), max.: `120000`

  </Accordion>

  <Accordion title="Abweichungen bei der Berechtigungsprüfung">
    Berechtigungsprüfungen mit `channels status --probe` funktionieren nur für numerische Kanal-IDs.

    Wenn Sie Slug-Schlüssel verwenden, kann der Runtime-Abgleich weiterhin funktionieren, aber Probe kann Berechtigungen nicht vollständig verifizieren.

  </Accordion>

  <Accordion title="DM- und Kopplungsprobleme">

    - DM deaktiviert: `channels.discord.dm.enabled=false`
    - DM-Richtlinie deaktiviert: `channels.discord.dmPolicy="disabled"` (Legacy: `channels.discord.dm.policy`)
    - wartet im Modus `pairing` auf Kopplungsgenehmigung

  </Accordion>

  <Accordion title="Bot-zu-Bot-Schleifen">
    Standardmäßig werden von Bots verfasste Nachrichten ignoriert.

    Wenn Sie `channels.discord.allowBots=true` setzen, verwenden Sie strenge Erwähnungs- und Allowlist-Regeln, um Schleifenverhalten zu vermeiden.
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

  <Accordion title="Voice-STT-Ausfälle mit DecryptionFailed(...)">

    - halten Sie OpenClaw aktuell (`openclaw update`), damit die Wiederherstellungslogik für Discord-Voice-Empfang vorhanden ist
    - bestätigen Sie `channels.discord.voice.daveEncryption=true` (Standard)
    - beginnen Sie mit `channels.discord.voice.decryptionFailureTolerance=24` (Upstream-Standard) und passen Sie den Wert nur bei Bedarf an
    - achten Sie in den Logs auf:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - wenn die Fehler nach dem automatischen erneuten Beitritt weiter auftreten, sammeln Sie Logs und vergleichen Sie sie mit der Upstream-DAVE-Empfangshistorie in [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) und [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Konfigurationsreferenz

Primäre Referenz: [Konfigurationsreferenz - Discord](/de/gateway/config-channels#discord).

<Accordion title="Aussagekräftige Discord-Felder">

- Start/Auth: `enabled`, `token`, `accounts.*`, `allowBots`
- Richtlinie: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- Befehl: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- Ereigniswarteschlange: `eventQueue.listenerTimeout` (Listener-Budget), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- Antwort/Verlauf: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- Zustellung: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- Streaming: `streaming` (Legacy-Alias: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- Medien/Wiederholung: `mediaMaxMb` (begrenzt ausgehende Discord-Uploads, Standard `100MB`), `retry`
- Aktionen: `actions.*`
- Präsenz: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- Funktionen: `threadBindings`, oberste Ebene `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## Sicherheit und Betrieb

- Behandeln Sie Bot-Token als Geheimnisse (`DISCORD_BOT_TOKEN` wird in überwachten Umgebungen bevorzugt).
- Erteilen Sie Discord-Berechtigungen nach dem Least-Privilege-Prinzip.
- Wenn Befehlsbereitstellung oder -status veraltet sind, starten Sie das Gateway neu und prüfen Sie erneut mit `openclaw channels status --probe`.

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Kopplung" icon="link" href="/de/channels/pairing">
    Koppeln Sie einen Discord-Benutzer mit dem Gateway.
  </Card>
  <Card title="Gruppen" icon="users" href="/de/channels/groups">
    Gruppenchat- und Allowlist-Verhalten.
  </Card>
  <Card title="Kanal-Routing" icon="route" href="/de/channels/channel-routing">
    Leiten Sie eingehende Nachrichten an Agenten weiter.
  </Card>
  <Card title="Sicherheit" icon="shield" href="/de/gateway/security">
    Bedrohungsmodell und Härtung.
  </Card>
  <Card title="Multi-Agent-Routing" icon="sitemap" href="/de/concepts/multi-agent">
    Ordnen Sie Guilds und Kanäle Agenten zu.
  </Card>
  <Card title="Slash-Befehle" icon="terminal" href="/de/tools/slash-commands">
    Natives Befehlsverhalten.
  </Card>
</CardGroup>
