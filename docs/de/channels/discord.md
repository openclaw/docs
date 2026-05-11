---
read_when:
    - An Discord-Kanalfunktionen arbeiten
summary: Supportstatus, Funktionen und Konfiguration für den Discord-Bot
title: Discord
x-i18n:
    generated_at: "2026-05-11T20:20:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 70107cf53c44f80e42f99f670aacf6eed8b77d839c05bccc853cd91a7273e5aa
    source_path: channels/discord.md
    workflow: 16
---

Bereit für DMs und Guild-Kanäle über den offiziellen Discord-Gateway.

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

## Schnelleinrichtung

Sie müssen eine neue Anwendung mit einem Bot erstellen, den Bot zu Ihrem Server hinzufügen und ihn mit OpenClaw koppeln. Wir empfehlen, Ihren Bot zu Ihrem eigenen privaten Server hinzuzufügen. Wenn Sie noch keinen haben, [erstellen Sie zuerst einen](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (wählen Sie **Create My Own > For me and my friends**).

<Steps>
  <Step title="Discord-Anwendung und Bot erstellen">
    Gehen Sie zum [Discord Developer Portal](https://discord.com/developers/applications) und klicken Sie auf **New Application**. Geben Sie ihr einen Namen wie „OpenClaw“.

    Klicken Sie in der Seitenleiste auf **Bot**. Setzen Sie den **Username** auf den Namen, den Sie Ihrem OpenClaw-Agenten geben.

  </Step>

  <Step title="Privilegierte Intents aktivieren">
    Bleiben Sie auf der Seite **Bot**, scrollen Sie nach unten zu **Privileged Gateway Intents** und aktivieren Sie:

    - **Message Content Intent** (erforderlich)
    - **Server Members Intent** (empfohlen; erforderlich für Rollen-Allowlists und die Zuordnung von Namen zu IDs)
    - **Presence Intent** (optional; nur für Präsenzaktualisierungen erforderlich)

  </Step>

  <Step title="Bot-Token kopieren">
    Scrollen Sie auf der Seite **Bot** wieder nach oben und klicken Sie auf **Reset Token**.

    <Note>
    Trotz des Namens wird dadurch Ihr erstes Token erstellt — es wird nichts „zurückgesetzt“.
    </Note>

    Kopieren Sie das Token und speichern Sie es irgendwo. Dies ist Ihr **Bot Token** und Sie benötigen es gleich.

  </Step>

  <Step title="Einladungs-URL erstellen und Bot zu Ihrem Server hinzufügen">
    Klicken Sie in der Seitenleiste auf **OAuth2**. Sie erstellen eine Einladungs-URL mit den richtigen Berechtigungen, um den Bot zu Ihrem Server hinzuzufügen.

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

    Dies ist der Basissatz für normale Textkanäle. Wenn Sie in Discord-Threads posten möchten, einschließlich Workflows für Forum- oder Medienkanäle, die einen Thread erstellen oder fortsetzen, aktivieren Sie außerdem **Send Messages in Threads**.
    Kopieren Sie die generierte URL unten, fügen Sie sie in Ihren Browser ein, wählen Sie Ihren Server aus und klicken Sie auf **Continue**, um die Verbindung herzustellen. Sie sollten Ihren Bot nun im Discord-Server sehen.

  </Step>

  <Step title="Entwicklermodus aktivieren und IDs sammeln">
    Zurück in der Discord-App müssen Sie den Entwicklermodus aktivieren, damit Sie interne IDs kopieren können.

    1. Klicken Sie auf **User Settings** (Zahnradsymbol neben Ihrem Avatar) → **Advanced** → aktivieren Sie **Developer Mode**
    2. Klicken Sie mit der rechten Maustaste in der Seitenleiste auf Ihr **Serversymbol** → **Copy Server ID**
    3. Klicken Sie mit der rechten Maustaste auf Ihren **eigenen Avatar** → **Copy User ID**

    Speichern Sie Ihre **Server ID** und **User ID** zusammen mit Ihrem Bot Token — Sie senden alle drei im nächsten Schritt an OpenClaw.

  </Step>

  <Step title="DMs von Servermitgliedern erlauben">
    Damit die Kopplung funktioniert, muss Discord Ihrem Bot erlauben, Ihnen eine DM zu senden. Klicken Sie mit der rechten Maustaste auf Ihr **Serversymbol** → **Privacy Settings** → aktivieren Sie **Direct Messages**.

    Dadurch können Servermitglieder (einschließlich Bots) Ihnen DMs senden. Lassen Sie dies aktiviert, wenn Sie Discord-DMs mit OpenClaw verwenden möchten. Wenn Sie nur Guild-Kanäle verwenden möchten, können Sie DMs nach der Kopplung deaktivieren.

  </Step>

  <Step title="Bot-Token sicher festlegen (nicht im Chat senden)">
    Ihr Discord-Bot-Token ist ein Geheimnis (wie ein Passwort). Legen Sie es auf dem Rechner fest, auf dem OpenClaw läuft, bevor Sie Ihrem Agenten eine Nachricht senden.

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

    Wenn OpenClaw bereits als Hintergrunddienst läuft, starten Sie es über die OpenClaw-Mac-App neu oder indem Sie den Prozess `openclaw gateway run` stoppen und erneut starten.
    Führen Sie bei verwalteten Dienstinstallationen `openclaw gateway install` aus einer Shell aus, in der `DISCORD_BOT_TOKEN` vorhanden ist, oder speichern Sie die Variable in `~/.openclaw/.env`, damit der Dienst den env-SecretRef nach dem Neustart auflösen kann.
    Wenn Ihr Host durch Discords Anwendungsabfrage beim Start blockiert oder rate-limited wird, legen Sie die Discord-Anwendungs-/Client-ID aus dem Developer Portal fest, damit der Start diesen REST-Aufruf überspringen kann. Verwenden Sie `channels.discord.applicationId` für das Standardkonto oder `channels.discord.accounts.<accountId>.applicationId`, wenn Sie mehrere Discord-Bots ausführen.

  </Step>

  <Step title="OpenClaw konfigurieren und koppeln">

    <Tabs>
      <Tab title="Ihren Agenten fragen">
        Chatten Sie mit Ihrem OpenClaw-Agenten in einem vorhandenen Kanal (z. B. Telegram) und sagen Sie es ihm. Wenn Discord Ihr erster Kanal ist, verwenden Sie stattdessen den Tab CLI / Konfiguration.

        > „Ich habe mein Discord-Bot-Token bereits in der Konfiguration festgelegt. Bitte schließen Sie die Discord-Einrichtung mit User ID `<user_id>` und Server ID `<server_id>` ab.“
      </Tab>
      <Tab title="CLI / Konfiguration">
        Wenn Sie dateibasierte Konfiguration bevorzugen, legen Sie Folgendes fest:

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

        Für geskriptete oder Remote-Einrichtung schreiben Sie denselben JSON5-Block mit `openclaw config patch --file ./discord.patch.json5 --dry-run` und führen Sie ihn dann ohne `--dry-run` erneut aus. Klartextwerte für `token` werden unterstützt. SecretRef-Werte werden ebenfalls für `channels.discord.token` über env/file/exec-Provider hinweg unterstützt. Siehe [Geheimnisverwaltung](/de/gateway/secrets).

        Bewahren Sie bei mehreren Discord-Bots jedes Bot-Token und jede Anwendungs-ID unter dem jeweiligen Konto auf. Ein `channels.discord.applicationId` auf oberster Ebene wird von Konten geerbt; legen Sie es dort also nur fest, wenn jedes Konto dieselbe Anwendungs-ID verwenden soll.

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
        Senden Sie den Kopplungscode an Ihren Agenten in Ihrem vorhandenen Kanal:

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

    Sie sollten nun über DM in Discord mit Ihrem Agenten chatten können.

  </Step>
</Steps>

<Note>
Die Token-Auflösung ist kontobewusst. Konfigurationswerte für Token haben Vorrang vor dem env-Fallback. `DISCORD_BOT_TOKEN` wird nur für das Standardkonto verwendet.
Wenn zwei aktivierte Discord-Konten auf dasselbe Bot-Token auflösen, startet OpenClaw nur einen Gateway-Monitor für dieses Token. Ein Token aus der Konfiguration hat Vorrang vor dem Standard-env-Fallback; andernfalls gewinnt das erste aktivierte Konto und das doppelte Konto wird als deaktiviert gemeldet.
Für erweiterte ausgehende Aufrufe (Nachrichtentool/Kanalaktionen) wird ein explizites `token` pro Aufruf für diesen Aufruf verwendet. Dies gilt für Sende- und Lese-/Probe-Aktionen (zum Beispiel read/search/fetch/thread/pins/permissions). Kontorichtlinien- und Wiederholungseinstellungen stammen weiterhin aus dem ausgewählten Konto im aktiven Runtime-Snapshot.
</Note>

## Empfohlen: Guild-Workspace einrichten

Sobald DMs funktionieren, können Sie Ihren Discord-Server als vollständigen Workspace einrichten, in dem jeder Kanal seine eigene Agentensitzung mit eigenem Kontext erhält. Dies wird für private Server empfohlen, auf denen nur Sie und Ihr Bot sind.

<Steps>
  <Step title="Server zur Guild-Allowlist hinzufügen">
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
    Standardmäßig antwortet Ihr Agent in Guild-Kanälen nur, wenn er mit @ erwähnt wird. Für einen privaten Server möchten Sie wahrscheinlich, dass er auf jede Nachricht antwortet.

    In Guild-Kanälen bleiben normale abschließende Assistentenantworten standardmäßig privat. Sichtbare Discord-Ausgabe muss explizit mit dem `message`-Tool gesendet werden, sodass der Agent standardmäßig mitlesen und nur posten kann, wenn er entscheidet, dass eine Kanalantwort sinnvoll ist.

    Das bedeutet, dass das ausgewählte Modell zuverlässig Tools aufrufen muss. Wenn Discord „tippt“ anzeigt und die Logs Token-Nutzung zeigen, aber keine Nachricht gepostet wird, prüfen Sie das Sitzungslog auf Assistententext mit `didSendViaMessagingTool: false`. Das bedeutet, dass das Modell eine private finale Antwort erzeugt hat, statt `message(action=send)` aufzurufen. Wechseln Sie zu einem stärkeren Tool-Calling-Modell oder verwenden Sie die unten stehende Konfiguration, um ältere automatische finale Antworten wiederherzustellen.

    <Tabs>
      <Tab title="Ihren Agenten fragen">
        > „Erlauben Sie meinem Agenten, auf diesem Server zu antworten, ohne mit @ erwähnt werden zu müssen“
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

  <Step title="Speicher für Guild-Kanäle planen">
    Standardmäßig wird Langzeitspeicher (MEMORY.md) nur in DM-Sitzungen geladen. Guild-Kanäle laden MEMORY.md nicht automatisch.

    <Tabs>
      <Tab title="Ihren Agenten fragen">
        > „Wenn ich Fragen in Discord-Kanälen stelle, verwenden Sie memory_search oder memory_get, falls Sie Langzeitkontext aus MEMORY.md benötigen.“
      </Tab>
      <Tab title="Manuell">
        Wenn Sie in jedem Kanal gemeinsamen Kontext benötigen, legen Sie die stabilen Anweisungen in `AGENTS.md` oder `USER.md` ab (sie werden für jede Sitzung injiziert). Bewahren Sie Langzeitnotizen in `MEMORY.md` auf und greifen Sie bei Bedarf mit Speicher-Tools darauf zu.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Erstellen Sie nun einige Kanäle auf Ihrem Discord-Server und beginnen Sie zu chatten. Ihr Agent kann den Kanalnamen sehen, und jeder Kanal erhält seine eigene isolierte Sitzung — Sie können also `#coding`, `#home`, `#research` oder etwas anderes einrichten, das zu Ihrem Workflow passt.

## Runtime-Modell

- Gateway besitzt die Discord-Verbindung.
- Das Reply-Routing ist deterministisch: Eingehende Discord-Antworten gehen zurück an Discord.
- Discord-Guild-/Channel-Metadaten werden dem Modell-Prompt als nicht vertrauenswürdiger
  Kontext hinzugefügt, nicht als für Benutzer sichtbares Antwortpräfix. Wenn ein Modell diesen Umschlag
  zurückkopiert, entfernt OpenClaw die kopierten Metadaten aus ausgehenden Antworten und aus
  künftigem Replay-Kontext.
- Standardmäßig (`session.dmScope=main`) teilen direkte Chats die Hauptsitzung des Agents (`agent:main:main`).
- Guild-Channels sind isolierte Sitzungsschlüssel (`agent:<agentId>:discord:channel:<channelId>`).
- Gruppen-DMs werden standardmäßig ignoriert (`channels.discord.dm.groupEnabled=false`).
- Native Slash-Commands laufen in isolierten Command-Sitzungen (`agent:<agentId>:discord:slash:<userId>`), führen aber weiterhin `CommandTargetSessionKey` zur gerouteten Konversationssitzung mit.
- Text-only-Cron-/Heartbeat-Ankündigungen an Discord verwenden die finale
  für den Assistenten sichtbare Antwort einmal. Medien- und strukturierte Komponenten-Payloads bleiben
  mehrteilig, wenn der Agent mehrere zustellbare Payloads ausgibt.

## Forum-Channels

Discord-Forum- und Media-Channels akzeptieren nur Thread-Beiträge. OpenClaw unterstützt zwei Möglichkeiten, sie zu erstellen:

- Senden Sie eine Nachricht an das Forum-Parent (`channel:<forumId>`), um automatisch einen Thread zu erstellen. Der Thread-Titel verwendet die erste nicht leere Zeile Ihrer Nachricht.
- Verwenden Sie `openclaw message thread create`, um einen Thread direkt zu erstellen. Übergeben Sie für Forum-Channels nicht `--message-id`.

Beispiel: an das Forum-Parent senden, um einen Thread zu erstellen

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Beispiel: einen Forum-Thread explizit erstellen

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Forum-Parents akzeptieren keine Discord-Komponenten. Wenn Sie Komponenten benötigen, senden Sie sie an den Thread selbst (`channel:<threadId>`).

## Interaktive Komponenten

OpenClaw unterstützt Discord-Komponenten-v2-Container für Agent-Nachrichten. Verwenden Sie das Nachrichten-Tool mit einem `components`-Payload. Interaktionsergebnisse werden als normale eingehende Nachrichten an den Agent zurückgeroutet und folgen den bestehenden Discord-`replyToMode`-Einstellungen.

Unterstützte Blöcke:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Action Rows erlauben bis zu 5 Buttons oder ein einzelnes Auswahlmenü
- Auswahltypen: `string`, `user`, `role`, `mentionable`, `channel`

Standardmäßig können Komponenten nur einmal verwendet werden. Setzen Sie `components.reusable=true`, damit Buttons, Auswahlelemente und Formulare bis zu ihrem Ablauf mehrfach verwendet werden können.

Um einzuschränken, wer einen Button anklicken darf, setzen Sie `allowedUsers` für diesen Button (Discord-Benutzer-IDs, Tags oder `*`). Wenn konfiguriert, erhalten nicht übereinstimmende Benutzer eine ephemere Ablehnung.

Die Slash-Commands `/model` und `/models` öffnen eine interaktive Modellauswahl mit Dropdowns für Provider, Modell und kompatible Runtime sowie einem Absenden-Schritt. `/models add` ist veraltet und gibt jetzt eine Veraltungsmeldung zurück, statt Modelle aus dem Chat zu registrieren. Die Picker-Antwort ist ephemer und kann nur vom aufrufenden Benutzer verwendet werden. Discord-Auswahlmenüs sind auf 25 Optionen begrenzt. Fügen Sie daher `provider/*`-Einträge zu `agents.defaults.models` hinzu, wenn der Picker dynamisch erkannte Modelle nur für ausgewählte Provider wie `openai-codex` oder `vllm` anzeigen soll.

Dateianhänge:

- `file`-Blöcke müssen auf eine Anhangsreferenz verweisen (`attachment://<filename>`)
- Stellen Sie den Anhang über `media`/`path`/`filePath` bereit (einzelne Datei); verwenden Sie `media-gallery` für mehrere Dateien
- Verwenden Sie `filename`, um den Upload-Namen zu überschreiben, wenn er der Anhangsreferenz entsprechen soll

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
  <Tab title="DM policy">
    `channels.discord.dmPolicy` steuert den DM-Zugriff. `channels.discord.allowFrom` ist die kanonische DM-Allowlist.

    - `pairing` (Standard)
    - `allowlist`
    - `open` (erfordert, dass `channels.discord.allowFrom` `"*"` enthält)
    - `disabled`

    Wenn die DM-Richtlinie nicht offen ist, werden unbekannte Benutzer blockiert (oder im Modus `pairing` zur Kopplung aufgefordert).

    Vorrang bei mehreren Konten:

    - `channels.discord.accounts.default.allowFrom` gilt nur für das Konto `default`.
    - Bei einem Konto hat `allowFrom` Vorrang vor dem veralteten `dm.allowFrom`.
    - Benannte Konten erben `channels.discord.allowFrom`, wenn ihr eigenes `allowFrom` und das veraltete `dm.allowFrom` nicht gesetzt sind.
    - Benannte Konten erben `channels.discord.accounts.default.allowFrom` nicht.

    Das veraltete `channels.discord.dm.policy` und `channels.discord.dm.allowFrom` werden aus Kompatibilitätsgründen weiterhin gelesen. `openclaw doctor --fix` migriert sie nach `dmPolicy` und `allowFrom`, wenn dies ohne Änderung des Zugriffs möglich ist.

    DM-Zielformat für Zustellung:

    - `user:<id>`
    - `<@id>`-Mention

    Reine numerische IDs werden normalerweise als Channel-IDs aufgelöst, wenn ein Channel-Standard aktiv ist. IDs, die im effektiven DM-`allowFrom` des Kontos aufgeführt sind, werden aus Kompatibilitätsgründen jedoch als Benutzer-DM-Ziele behandelt.

  </Tab>

  <Tab title="Access groups">
    Discord-DMs und die Autorisierung von Text-Commands können dynamische `accessGroup:<name>`-Einträge in `channels.discord.allowFrom` verwenden.

    Zugriffgruppennamen werden über Nachrichten-Channels hinweg geteilt. Verwenden Sie `type: "message.senders"` für eine statische Gruppe, deren Mitglieder in der normalen `allowFrom`-Syntax jedes Channels ausgedrückt werden, oder `type: "discord.channelAudience"`, wenn die aktuelle `ViewChannel`-Zielgruppe eines Discord-Channels die Mitgliedschaft dynamisch definieren soll. Das gemeinsame Verhalten von Zugriffsgruppen ist hier dokumentiert: [Zugriffsgruppen](/de/channels/access-groups).

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

    Ein Discord-Text-Channel hat keine separate Mitgliederliste. `type: "discord.channelAudience"` modelliert Mitgliedschaft so: Der DM-Absender ist Mitglied der konfigurierten Guild und hat derzeit effektive `ViewChannel`-Berechtigung für den konfigurierten Channel, nachdem Rollen- und Channel-Überschreibungen angewendet wurden.

    Beispiel: allen, die `#maintainers` sehen können, erlauben, dem Bot per DM zu schreiben, während DMs für alle anderen geschlossen bleiben.

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

    Lookups schlagen geschlossen fehl. Wenn Discord `Missing Access` zurückgibt, der Mitglieder-Lookup fehlschlägt oder der Channel zu einer anderen Guild gehört, wird der DM-Absender als nicht autorisiert behandelt.

    Aktivieren Sie im Discord Developer Portal **Server Members Intent** für den Bot, wenn Sie channel-audience-Zugriffsgruppen verwenden. DMs enthalten keinen Guild-Mitgliedsstatus, daher löst OpenClaw das Mitglied zum Autorisierungszeitpunkt über Discord REST auf.

  </Tab>

  <Tab title="Guild policy">
    Die Guild-Behandlung wird durch `channels.discord.groupPolicy` gesteuert:

    - `open`
    - `allowlist`
    - `disabled`

    Die sichere Baseline, wenn `channels.discord` existiert, ist `allowlist`.

    `allowlist`-Verhalten:

    - Guild muss mit `channels.discord.guilds` übereinstimmen (`id` bevorzugt, Slug akzeptiert)
    - optionale Absender-Allowlists: `users` (stabile IDs empfohlen) und `roles` (nur Rollen-IDs); wenn eines von beiden konfiguriert ist, sind Absender erlaubt, wenn sie mit `users` ODER `roles` übereinstimmen
    - direkter Namens-/Tag-Abgleich ist standardmäßig deaktiviert; aktivieren Sie `channels.discord.dangerouslyAllowNameMatching: true` nur als Break-glass-Kompatibilitätsmodus
    - Namen/Tags werden für `users` unterstützt, IDs sind jedoch sicherer; `openclaw security audit` warnt, wenn Namens-/Tag-Einträge verwendet werden
    - wenn für eine Guild `channels` konfiguriert ist, werden nicht aufgeführte Channels abgelehnt
    - wenn eine Guild keinen `channels`-Block hat, sind alle Channels in dieser allowgelisteten Guild erlaubt

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

  <Tab title="Mentions and group DMs">
    Guild-Nachrichten sind standardmäßig mention-gesteuert.

    Mention-Erkennung umfasst:

    - explizite Bot-Mention
    - konfigurierte Mention-Muster (`agents.list[].groupChat.mentionPatterns`, Fallback `messages.groupChat.mentionPatterns`)
    - implizites Reply-to-bot-Verhalten in unterstützten Fällen

    Verwenden Sie beim Schreiben ausgehender Discord-Nachrichten die kanonische Mention-Syntax: `<@USER_ID>` für Benutzer, `<#CHANNEL_ID>` für Channels und `<@&ROLE_ID>` für Rollen. Verwenden Sie nicht die veraltete `<@!USER_ID>`-Nickname-Mention-Form.

    `requireMention` wird pro Guild/Channel konfiguriert (`channels.discord.guilds...`).
    `ignoreOtherMentions` verwirft optional Nachrichten, die einen anderen Benutzer/eine andere Rolle erwähnen, aber nicht den Bot (ausgenommen @everyone/@here).

    Gruppen-DMs:

    - Standard: ignoriert (`dm.groupEnabled=false`)
    - optionale Allowlist über `dm.groupChannels` (Channel-IDs oder Slugs)

  </Tab>
</Tabs>

### Rollenbasiertes Agent-Routing

Verwenden Sie `bindings[].match.roles`, um Discord-Guild-Mitglieder anhand der Rollen-ID zu verschiedenen Agents zu routen. Rollenbasierte Bindings akzeptieren nur Rollen-IDs und werden nach Peer- oder Parent-Peer-Bindings und vor reinen Guild-Bindings ausgewertet. Wenn ein Binding auch andere Match-Felder setzt (zum Beispiel `peer` + `guildId` + `roles`), müssen alle konfigurierten Felder übereinstimmen.

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

## Native Commands und Command-Auth

- `commands.native` ist standardmäßig `"auto"` und für Discord aktiviert.
- Kanalspezifische Überschreibung: `channels.discord.commands.native`.
- `commands.native=false` überspringt beim Start die Registrierung und Bereinigung von Discord-Slash-Commands. Zuvor registrierte Commands können in Discord sichtbar bleiben, bis Sie sie aus der Discord-App entfernen.
- Die Authentifizierung nativer Commands verwendet dieselben Discord-Allowlists/-Richtlinien wie die normale Nachrichtenverarbeitung.
- Commands können in der Discord-Oberfläche weiterhin für Benutzer sichtbar sein, die nicht autorisiert sind; die Ausführung erzwingt dennoch die OpenClaw-Authentifizierung und gibt "not authorized" zurück.

Siehe [Slash-Commands](/de/tools/slash-commands) für Command-Katalog und Verhalten.

Standardeinstellungen für Slash-Commands:

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

    Hinweis: `off` deaktiviert implizites Antwort-Threading. Explizite `[[reply_to_*]]`-Tags werden weiterhin berücksichtigt.
    `first` hängt die implizite native Antwortreferenz immer an die erste ausgehende Discord-Nachricht des Turns an.
    `batched` hängt die implizite native Antwortreferenz von Discord nur an, wenn der
    eingehende Turn ein entprellter Batch aus mehreren Nachrichten war. Das ist nützlich,
    wenn Sie native Antworten vor allem für mehrdeutige, stoßweise Chats möchten, nicht für jeden
    Turn mit einer einzelnen Nachricht.

    Nachrichten-IDs werden im Kontext/Verlauf bereitgestellt, damit Agents gezielt bestimmte Nachrichten adressieren können.

  </Accordion>

  <Accordion title="Live-Stream-Vorschau">
    OpenClaw kann Antwortentwürfe streamen, indem es eine temporäre Nachricht sendet und sie bearbeitet, sobald Text eintrifft. `channels.discord.streaming` akzeptiert `off` | `partial` | `block` | `progress` (Standard). `progress` hält einen bearbeitbaren Statusentwurf und aktualisiert ihn bis zur finalen Zustellung mit Tool-Fortschritt; die gemeinsame Startbezeichnung ist eine laufende Zeile, sodass sie wie der Rest wegscrollt, sobald genug Arbeit erscheint. `streamMode` ist ein älterer Runtime-Alias. Führen Sie `openclaw doctor --fix` aus, um persistierte Konfiguration auf den kanonischen Schlüssel umzuschreiben.

    Setzen Sie `channels.discord.streaming.mode` auf `off`, um Discord-Vorschauänderungen zu deaktivieren. Wenn Discord-Block-Streaming explizit aktiviert ist, überspringt OpenClaw den Vorschau-Stream, um doppeltes Streaming zu vermeiden.

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
    - `block` gibt entwurfsgroße Blöcke aus (verwenden Sie `draftChunk`, um Größe und Umbruchpunkte abzustimmen, begrenzt durch `textChunkLimit`).
    - Medien, Fehler und finale explizite Antworten brechen ausstehende Vorschauänderungen ab.
    - `streaming.preview.toolProgress` (Standard `true`) steuert, ob Tool-/Fortschrittsaktualisierungen die Vorschaunachricht wiederverwenden.
    - Tool-/Fortschrittszeilen werden, wenn verfügbar, kompakt als Emoji + Titel + Detail dargestellt, zum Beispiel `🛠️ Bash: run tests` oder `🔎 Web Search: for "query"`.
    - `streaming.preview.commandText` / `streaming.progress.commandText` steuert Command-/Ausführungsdetails in kompakten Fortschrittszeilen: `raw` (Standard) oder `status` (nur Tool-Bezeichnung).

    Blenden Sie rohen Command-/Ausführungstext aus, während kompakte Fortschrittszeilen erhalten bleiben:

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

    Vorschau-Streaming ist nur textbasiert; Medienantworten fallen auf normale Zustellung zurück. Wenn `block`-Streaming explizit aktiviert ist, überspringt OpenClaw den Vorschau-Stream, um doppeltes Streaming zu vermeiden.

  </Accordion>

  <Accordion title="Verlauf, Kontext und Thread-Verhalten">
    Guild-Verlaufskontext:

    - `channels.discord.historyLimit` Standard `20`
    - Fallback: `messages.groupChat.historyLimit`
    - `0` deaktiviert

    DM-Verlaufssteuerungen:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Thread-Verhalten:

    - Discord-Threads werden als Kanalsitzungen geroutet und erben die Konfiguration des übergeordneten Kanals, sofern sie nicht überschrieben wird.
    - Thread-Sitzungen erben die sitzungsspezifische `/model`-Auswahl des übergeordneten Kanals als reinen Modell-Fallback; threadlokale `/model`-Auswahlen haben weiterhin Vorrang, und der Verlauf des übergeordneten Transkripts wird nur kopiert, wenn Transkriptvererbung aktiviert ist.
    - `channels.discord.thread.inheritParent` (Standard `false`) lässt neue Auto-Threads mit dem übergeordneten Transkript initialisieren. Kontospezifische Überschreibungen befinden sich unter `channels.discord.accounts.<id>.thread.inheritParent`.
    - Message-Tool-Reaktionen können `user:<id>`-DM-Ziele auflösen.
    - `guilds.<guild>.channels.<channel>.requireMention: false` bleibt während des Fallbacks für die Aktivierung in der Antwortphase erhalten.

    Kanalthemen werden als **nicht vertrauenswürdiger** Kontext injiziert. Allowlists steuern, wer den Agent auslösen kann, sind aber keine vollständige Redaktionsgrenze für ergänzenden Kontext.

  </Accordion>

  <Accordion title="Thread-gebundene Sitzungen für Subagents">
    Discord kann einen Thread an ein Sitzungsziel binden, sodass Folgenachrichten in diesem Thread weiter an dieselbe Sitzung geroutet werden (einschließlich Subagent-Sitzungen).

    Commands:

    - `/focus <target>` bindet den aktuellen/neuen Thread an ein Subagent-/Sitzungsziel
    - `/unfocus` entfernt die aktuelle Thread-Bindung
    - `/agents` zeigt aktive Läufe und Bindungsstatus
    - `/session idle <duration|off>` prüft/aktualisiert automatische Inaktivitäts-Entfokussierung für fokussierte Bindungen
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
    - `defaultSpawnContext` steuert den nativen Subagent-Kontext für threadgebundene Spawns. Standard: `"fork"`.
    - Veraltete Schlüssel `spawnSubagentSessions`/`spawnAcpSessions` werden durch `openclaw doctor --fix` migriert.
    - Wenn Thread-Bindungen für ein Konto deaktiviert sind, sind `/focus` und zugehörige Thread-Bindungsvorgänge nicht verfügbar.

    Siehe [Subagents](/de/tools/subagents), [ACP-Agents](/de/tools/acp-agents) und [Konfigurationsreferenz](/de/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Persistente ACP-Kanalbindungen">
    Für stabile, ständig aktive ACP-Arbeitsbereiche konfigurieren Sie typisierte ACP-Bindungen auf oberster Ebene, die auf Discord-Unterhaltungen zielen.

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

    - `/acp spawn codex --bind here` bindet den aktuellen Kanal oder Thread direkt und hält zukünftige Nachrichten auf derselben ACP-Sitzung. Thread-Nachrichten erben die Bindung des übergeordneten Kanals.
    - In einem gebundenen Kanal oder Thread setzen `/new` und `/reset` dieselbe ACP-Sitzung direkt zurück. Temporäre Thread-Bindungen können die Zielauflösung überschreiben, solange sie aktiv sind.
    - `spawnSessions` steuert die Erstellung/Bindung von Child-Threads über `--thread auto|here`.

    Siehe [ACP-Agents](/de/tools/acp-agents) für Details zum Bindungsverhalten.

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
    - Fallback auf Agent-Identitäts-Emoji (`agents.list[].identity.emoji`, andernfalls "👀")

    Hinweise:

    - Discord akzeptiert Unicode-Emoji oder benutzerdefinierte Emoji-Namen.
    - Verwenden Sie `""`, um die Reaktion für einen Kanal oder ein Konto zu deaktivieren.

  </Accordion>

  <Accordion title="Konfigurationsschreibvorgänge">
    Vom Kanal initiierte Konfigurationsschreibvorgänge sind standardmäßig aktiviert.

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
    Leiten Sie Discord-Gateway-WebSocket-Verkehr und REST-Startabfragen (Anwendungs-ID + Allowlist-Auflösung) über einen HTTP(S)-Proxy mit `channels.discord.proxy`.

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
    Aktivieren Sie PluralKit-Auflösung, um proxied Nachrichten der Systemmitgliedsidentität zuzuordnen:

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
    - Abfragen verwenden die ursprüngliche Nachrichten-ID und sind zeitfensterbegrenzt
    - Wenn die Abfrage fehlschlägt, werden proxied Nachrichten als Bot-Nachrichten behandelt und verworfen, sofern `allowBots=true` nicht gesetzt ist

  </Accordion>

  <Accordion title="Ausgehende Mention-Aliasse">
    Verwenden Sie `mentionAliases`, wenn Agents deterministische ausgehende Mentions für bekannte Discord-Benutzer benötigen. Schlüssel sind Handles ohne führendes `@`; Werte sind Discord-Benutzer-IDs. Unbekannte Handles, `@everyone`, `@here` und Mentions innerhalb von Markdown-Code-Spans bleiben unverändert.

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

  <Accordion title="Präsenzkonfiguration">
    Präsenzaktualisierungen werden angewendet, wenn Sie ein Status- oder Aktivitätsfeld setzen oder automatische Präsenz aktivieren.

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

    Aktivitätstyp-Zuordnung:

    - 0: Spielt
    - 1: Streamt (erfordert `activityUrl`)
    - 2: Hört
    - 3: Schaut zu
    - 4: Benutzerdefiniert (verwendet den Aktivitätstext als Statuszustand; Emoji ist optional)
    - 5: Nimmt teil

    Beispiel für automatische Präsenz (Laufzeit-Zustandssignal):

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

    Automatische Präsenz ordnet die Laufzeitverfügbarkeit dem Discord-Status zu: fehlerfrei => online, eingeschränkt oder unbekannt => abwesend, erschöpft oder nicht verfügbar => bitte nicht stören. Optionale Textüberschreibungen:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (unterstützt den Platzhalter `{reason}`)

  </Accordion>

  <Accordion title="Approvals in Discord">
    Discord unterstützt die buttonbasierte Behandlung von Genehmigungen in DMs und kann Genehmigungsaufforderungen optional im ursprünglichen Kanal posten.

    Konfigurationspfad:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (optional; fällt, wenn möglich, auf `commands.ownerAllowFrom` zurück)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, Standard: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord aktiviert native Exec-Genehmigungen automatisch, wenn `enabled` nicht gesetzt ist oder `"auto"` lautet und mindestens ein Genehmiger aufgelöst werden kann, entweder aus `execApprovals.approvers` oder aus `commands.ownerAllowFrom`. Discord leitet Exec-Genehmiger nicht aus Kanal-`allowFrom`, dem veralteten `dm.allowFrom` oder Direct-Message-`defaultTo` ab. Setzen Sie `enabled: false`, um Discord explizit als nativen Genehmigungs-Client zu deaktivieren.

    Für sensible, nur Ownern vorbehaltene Gruppenbefehle wie `/diagnostics` und `/export-trajectory` sendet OpenClaw Genehmigungsaufforderungen und Endergebnisse privat. Zuerst versucht es Discord-DM, wenn der aufrufende Owner eine Discord-Owner-Route hat; ist diese nicht verfügbar, fällt es auf die erste verfügbare Owner-Route aus `commands.ownerAllowFrom` zurück, z. B. Telegram.

    Wenn `target` `channel` oder `both` ist, ist die Genehmigungsaufforderung im Kanal sichtbar. Nur aufgelöste Genehmiger können die Buttons verwenden; andere Benutzer erhalten eine ephemere Ablehnung. Genehmigungsaufforderungen enthalten den Befehlstext. Aktivieren Sie die Zustellung im Kanal daher nur in vertrauenswürdigen Kanälen. Wenn die Kanal-ID nicht aus dem Sitzungsschlüssel abgeleitet werden kann, fällt OpenClaw auf die Zustellung per DM zurück.

    Discord rendert außerdem die gemeinsamen Genehmigungsbuttons, die von anderen Chat-Kanälen verwendet werden. Der native Discord-Adapter ergänzt hauptsächlich Genehmiger-DM-Routing und Kanal-Fanout.
    Wenn diese Buttons vorhanden sind, sind sie die primäre Genehmigungs-UX; OpenClaw
    sollte nur dann einen manuellen `/approve`-Befehl einschließen, wenn das Tool-Ergebnis besagt,
    dass Chat-Genehmigungen nicht verfügbar sind oder die manuelle Genehmigung der einzige Weg ist.
    Wenn die native Discord-Genehmigungslaufzeit nicht aktiv ist, hält OpenClaw die
    lokal deterministische `/approve <id> <decision>`-Aufforderung sichtbar. Wenn die
    Laufzeit aktiv ist, aber keine native Karte an ein Ziel zugestellt werden kann,
    sendet OpenClaw eine Ausweichbenachrichtigung im selben Chat mit dem exakten `/approve`-
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

| Aktionsgruppe                                                                                                                                                            | Standard   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| Reaktionen, Nachrichten, Threads, Pins, Umfragen, Suche, MitgliedInfo, RollenInfo, KanalInfo, Kanäle, Sprachstatus, Events, Sticker, Emoji-Uploads, Sticker-Uploads, Berechtigungen | aktiviert  |
| Rollen                                                                                                                                                                   | deaktiviert |
| Moderation                                                                                                                                                               | deaktiviert |
| Präsenz                                                                                                                                                                  | deaktiviert |

## Components-v2-UI

OpenClaw verwendet Discord Components v2 für Exec-Genehmigungen und kontextübergreifende Marker. Discord-Nachrichtenaktionen können außerdem `components` für benutzerdefinierte UI akzeptieren (fortgeschritten; erfordert das Erstellen einer Component-Payload über das Discord-Tool), während veraltete `embeds` weiterhin verfügbar sind, aber nicht empfohlen werden.

- `channels.discord.ui.components.accentColor` legt die Akzentfarbe fest, die von Discord-Component-Containern verwendet wird (Hex).
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

## Sprache

Discord hat zwei unterschiedliche Sprachoberflächen: Echtzeit-**Sprachkanäle** (kontinuierliche Unterhaltungen) und **Sprachnachrichten-Anhänge** (das Waveform-Vorschauformat). Der Gateway unterstützt beide.

### Sprachkanäle

Einrichtungs-Checkliste:

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

Um die effektiven Berechtigungen des Bots vor dem Beitritt zu prüfen, führen Sie aus:

```bash
openclaw channels capabilities --channel discord --target channel:<voice-channel-id>
```

Beispiel für automatischen Beitritt:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai-codex/gpt-5.5",
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        allowedChannels: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        connectTimeoutMs: 30000,
        reconnectGraceMs: 15000,
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          voice: "cedar",
        },
      },
    },
  },
}
```

Hinweise:

- `voice.tts` überschreibt `messages.tts` nur für die Sprachwiedergabe mit `stt-tts`. Echtzeitmodi verwenden `voice.realtime.voice`.
- `voice.mode` steuert den Gesprächspfad. Standard ist `agent-proxy`: Ein Echtzeit-Voice-Frontend übernimmt Turn-Timing, Unterbrechung und Wiedergabe, delegiert inhaltliche Arbeit über `openclaw_agent_consult` an den gerouteten OpenClaw-Agent und behandelt das Ergebnis wie einen getippten Discord-Prompt von dieser sprechenden Person. `stt-tts` behält den älteren Batch-STT-plus-TTS-Ablauf bei. `bidi` lässt das Echtzeitmodell direkt sprechen und stellt zugleich `openclaw_agent_consult` für das OpenClaw-Brain bereit.
- `voice.agentSession` steuert, welche OpenClaw-Konversation Voice-Turns erhält. Lassen Sie es ungesetzt für die eigene Sitzung des Voice-Kanals, oder setzen Sie `{ mode: "target", target: "channel:<text-channel-id>" }`, damit der Voice-Kanal als Mikrofon-/Lautsprecher-Erweiterung einer bestehenden Discord-Textkanal-Sitzung wie `#maintainers` fungiert.
- `voice.model` überschreibt das OpenClaw-Agent-Brain für Discord-Voice-Antworten und Echtzeit-Consults. Lassen Sie es ungesetzt, um das Modell des gerouteten Agents zu erben. Es ist von `voice.realtime.model` getrennt.
- `agent-proxy` routet Sprache über `discord-voice`; dadurch bleibt die normale Owner-/Tool-Autorisierung für die sprechende Person und die Zielsitzung erhalten, aber das Agent-Tool `tts` wird ausgeblendet, weil Discord Voice die Wiedergabe besitzt. Standardmäßig gibt `agent-proxy` dem Consult für Owner-Sprechende vollständigen Owner-äquivalenten Tool-Zugriff (`voice.realtime.toolPolicy: "owner"`) und bevorzugt deutlich, vor inhaltlichen Antworten den OpenClaw-Agent zu konsultieren (`voice.realtime.consultPolicy: "always"`). In diesem Standardmodus `always` spricht die Echtzeitschicht vor der Consult-Antwort nicht automatisch Fülltext; sie erfasst und transkribiert Sprache und spricht dann die geroutete OpenClaw-Antwort. Wenn mehrere erzwungene Consult-Antworten fertig werden, während Discord noch die erste Antwort abspielt, werden spätere Antworten mit exakter Sprachausgabe in die Warteschlange gestellt, bis die Wiedergabe im Leerlauf ist, statt Sprache mitten im Satz zu ersetzen.
- Im Modus `stt-tts` verwendet STT `tools.media.audio`; `voice.model` beeinflusst die Transkription nicht.
- In Echtzeitmodi konfigurieren `voice.realtime.provider`, `voice.realtime.model` und `voice.realtime.voice` die Echtzeit-Audiositzung. Für OpenAI Realtime 2 plus Codex-Brain verwenden Sie `voice.realtime.model: "gpt-realtime-2"` und `voice.model: "openai-codex/gpt-5.5"`.
- Der OpenAI-Echtzeit-Provider akzeptiert aktuelle Realtime-2-Ereignisnamen und ältere Codex-kompatible Aliasse für Output-Audio- und Transcript-Ereignisse, sodass kompatible Provider-Snapshots abweichen können, ohne Assistant-Audio zu verlieren.
- `voice.realtime.bargeIn` steuert, ob Discord-Speaker-Start-Ereignisse aktive Echtzeitwiedergabe unterbrechen. Wenn es ungesetzt ist, folgt es der Input-Audio-Unterbrechungseinstellung des Echtzeit-Providers.
- `voice.realtime.minBargeInAudioEndMs` steuert die minimale Assistant-Wiedergabedauer, bevor ein OpenAI-Echtzeit-Barge-in Audio abschneidet. Standard: `250`. Setzen Sie `0` für sofortige Unterbrechung in Räumen mit wenig Echo, oder erhöhen Sie den Wert für Lautsprecher-Setups mit starkem Echo.
- Für eine OpenAI-Stimme bei Discord-Wiedergabe setzen Sie `voice.tts.provider: "openai"` und wählen Sie eine Text-to-Speech-Stimme unter `voice.tts.openai.voice` oder `voice.tts.providers.openai.voice`. `cedar` ist beim aktuellen OpenAI-TTS-Modell eine gute maskulin klingende Wahl.
- Discord-`systemPrompt`-Überschreibungen pro Kanal gelten für Voice-Transcript-Turns dieses Voice-Kanals.
- Voice-Transcript-Turns leiten den Owner-Status aus Discord `allowFrom` (oder `dm.allowFrom`) ab; Nicht-Owner-Sprechende können nicht auf Owner-only-Tools zugreifen (zum Beispiel `gateway` und `cron`).
- Discord Voice ist für reine Textkonfigurationen opt-in; setzen Sie `channels.discord.voice.enabled=true` (oder behalten Sie einen bestehenden `channels.discord.voice`-Block bei), um `/vc`-Befehle, die Voice-Runtime und den Gateway-Intent `GuildVoiceStates` zu aktivieren.
- `channels.discord.intents.voiceStates` kann das Abonnement des Voice-State-Intents explizit überschreiben. Lassen Sie es ungesetzt, damit der Intent der effektiven Voice-Aktivierung folgt.
- Wenn `voice.autoJoin` mehrere Einträge für dieselbe Guild enthält, tritt OpenClaw dem zuletzt konfigurierten Kanal für diese Guild bei.
- `voice.allowedChannels` ist eine optionale Residency-Allowlist. Lassen Sie es ungesetzt, um `/vc join` in jeden autorisierten Discord-Voice-Kanal zu erlauben. Wenn gesetzt, sind `/vc join`, Auto-Join beim Start und Bot-Voice-State-Verschiebungen auf die aufgeführten Einträge `{ guildId, channelId }` beschränkt. Setzen Sie es auf ein leeres Array, um alle Discord-Voice-Beitritte zu verweigern. Wenn Discord den Bot außerhalb der Allowlist verschiebt, verlässt OpenClaw diesen Kanal und tritt wieder dem konfigurierten Auto-Join-Ziel bei, sobald eines verfügbar ist.
- `voice.daveEncryption` und `voice.decryptionFailureTolerance` werden an die Join-Optionen von `@discordjs/voice` durchgereicht.
- Die Standardwerte von `@discordjs/voice` sind `daveEncryption=true` und `decryptionFailureTolerance=24`, wenn sie ungesetzt sind.
- OpenClaw verwendet standardmäßig den reinen JS-Decoder `opusscript` für Discord-Voice-Empfang. Das optionale native Paket `@discordjs/opus` wird von der pnpm-Installationsrichtlinie des Repos ignoriert, sodass normale Installationen, Docker-Lanes und nicht verwandte Tests kein natives Addon kompilieren. Dedizierte Hosts für Voice-Performance können nach der Installation des nativen Addons mit `OPENCLAW_DISCORD_OPUS_DECODER=native` opt-in aktivieren.
- `voice.connectTimeoutMs` steuert das anfängliche Warten auf `@discordjs/voice` Ready für `/vc join` und Auto-Join-Versuche. Standard: `30000`.
- `voice.reconnectGraceMs` steuert, wie lange OpenClaw wartet, bis eine getrennte Voice-Sitzung mit der erneuten Verbindung beginnt, bevor sie zerstört wird. Standard: `15000`.
- Im Modus `stt-tts` stoppt die Voice-Wiedergabe nicht nur deshalb, weil eine andere Person zu sprechen beginnt. Um Feedback-Schleifen zu vermeiden, ignoriert OpenClaw neue Voice-Erfassung, während TTS abgespielt wird; sprechen Sie nach Ende der Wiedergabe für den nächsten Turn. Echtzeitmodi leiten Speaker-Starts als Barge-in-Signale an den Echtzeit-Provider weiter.
- In Echtzeitmodi kann Echo von Lautsprechern in ein offenes Mikrofon wie Barge-in wirken und die Wiedergabe unterbrechen. Für Discord-Räume mit starkem Echo setzen Sie `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`, damit OpenAI bei Input-Audio nicht automatisch unterbricht. Fügen Sie `voice.realtime.bargeIn: true` hinzu, wenn Discord-Speaker-Start-Ereignisse aktive Wiedergabe weiterhin unterbrechen sollen. Die OpenAI-Echtzeit-Bridge ignoriert Wiedergabeabschneidungen, die kürzer als `voice.realtime.minBargeInAudioEndMs` sind, als wahrscheinliches Echo/Rauschen und protokolliert sie als übersprungen, statt die Discord-Wiedergabe zu löschen.
- `voice.captureSilenceGraceMs` steuert, wie lange OpenClaw wartet, nachdem Discord gemeldet hat, dass eine sprechende Person aufgehört hat, bevor dieses Audiosegment für STT finalisiert wird. Standard: `2500`; erhöhen Sie diesen Wert, wenn Discord normale Pausen in abgehackte Teil-Transcripts aufteilt.
- Wenn ElevenLabs der ausgewählte TTS-Provider ist, verwendet Discord-Voice-Wiedergabe Streaming-TTS und startet aus dem Antwortstream des Providers. Provider ohne Streaming-Unterstützung fallen auf den Pfad mit synthetisierter temporärer Datei zurück.
- OpenClaw überwacht außerdem Receive-Decrypt-Fehler und stellt sich automatisch wieder her, indem es nach wiederholten Fehlern in einem kurzen Zeitfenster den Voice-Kanal verlässt und erneut beitritt.
- Wenn Receive-Logs nach einem Update wiederholt `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` zeigen, sammeln Sie einen Dependency-Bericht und Logs. Die gebündelte `@discordjs/voice`-Linie enthält den Upstream-Padding-Fix aus discord.js PR #11449, der discord.js Issue #11419 geschlossen hat.
- Receive-Ereignisse `The operation was aborted` sind zu erwarten, wenn OpenClaw ein erfasstes Sprechersegment finalisiert; sie sind ausführliche Diagnosen, keine Warnungen.
- Ausführliche Discord-Voice-Logs enthalten eine begrenzte einzeilige STT-Transcript-Vorschau für jedes akzeptierte Sprechersegment, sodass Debugging sowohl die Benutzerseite als auch die Agent-Antwortseite zeigt, ohne unbegrenzt Transcript-Text auszugeben.
- Im Modus `agent-proxy` überspringt der erzwungene Consult-Fallback wahrscheinlich unvollständige Transcript-Fragmente, etwa Text, der auf `...` endet, oder einen nachgestellten Konnektor wie `and`, sowie offensichtlich nicht umsetzbare Abschlüsse wie „bin gleich zurück“ oder „tschüss“. Logs zeigen `forced agent consult skipped reason=...`, wenn dies eine veraltete Antwort in der Warteschlange verhindert.

Native Opus-Einrichtung für Source-Checkouts:

```bash
pnpm install
mise exec node@22 -- pnpm discord:opus:install
```

Verwenden Sie Node 22 für den Gateway, wenn Sie das native Upstream-macOS-arm64-Addon als Prebuild nutzen möchten. Wenn Sie eine andere Node-Runtime verwenden, benötigt der Opt-in-Installer möglicherweise eine lokale `node-gyp`-Toolchain für den Source-Build.

Nach der Installation des nativen Addons starten Sie den Gateway mit:

```bash
OPENCLAW_DISCORD_OPUS_DECODER=native pnpm gateway:watch
```

Ausführliche Voice-Logs sollten `discord voice: opus decoder: @discordjs/opus` anzeigen. Ohne das Env-Opt-in, oder wenn das native Addon fehlt oder auf dem Host nicht geladen werden kann, protokolliert OpenClaw `discord voice: opus decoder: opusscript` und empfängt Voice weiterhin über den reinen JS-Fallback.

STT-plus-TTS-Pipeline:

- Discord-PCM-Erfassung wird in eine temporäre WAV-Datei konvertiert.
- `tools.media.audio` übernimmt STT, zum Beispiel `openai/gpt-4o-mini-transcribe`.
- Das Transcript wird über Discord-Ingress und Routing gesendet, während das Antwort-LLM mit einer Voice-Output-Richtlinie läuft, die das Agent-Tool `tts` ausblendet und zurückgegebenen Text anfordert, weil Discord Voice die finale TTS-Wiedergabe besitzt.
- `voice.model` überschreibt, wenn gesetzt, nur das Antwort-LLM für diesen Voice-Kanal-Turn.
- `voice.tts` wird über `messages.tts` gemergt; streamingfähige Provider speisen den Player direkt, andernfalls wird die resultierende Audiodatei im beigetretenen Kanal abgespielt.

Beispiel für eine standardmäßige agent-proxy-Voice-Kanal-Sitzung:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai-codex/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          voice: "cedar",
        },
      },
    },
  },
}
```

Ohne `voice.agentSession`-Block erhält jeder Voice-Kanal seine eigene geroutete OpenClaw-Sitzung. Zum Beispiel spricht `/vc join channel:234567890123456789` mit der Sitzung für diesen Discord-Voice-Kanal. Das Echtzeitmodell ist nur das Voice-Frontend; inhaltliche Anfragen werden an den konfigurierten OpenClaw-Agent übergeben. Wenn das Echtzeitmodell ein finales Transcript erzeugt, ohne das Consult-Tool aufzurufen, erzwingt OpenClaw den Consult als Fallback, damit der Standard weiterhin so funktioniert, als würden Sie mit dem Agent sprechen.

Beispiel für Legacy-STT-plus-TTS:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "stt-tts",
        model: "openai/gpt-5.4-mini",
        tts: {
          provider: "openai",
          openai: {
            model: "gpt-4o-mini-tts",
            voice: "cedar",
          },
        },
      },
    },
  },
}
```

Realtime-bidi-Beispiel:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai-codex/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          voice: "cedar",
          toolPolicy: "safe-read-only",
          consultPolicy: "always",
        },
      },
    },
  },
}
```

Voice als Erweiterung einer bestehenden Discord-Kanalsitzung:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "agent-proxy",
        model: "openai-codex/gpt-5.5",
        agentSession: {
          mode: "target",
          target: "channel:123456789012345678",
        },
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          voice: "cedar",
        },
      },
    },
  },
}
```

Im Modus `agent-proxy` tritt der Bot dem konfigurierten Voice-Kanal bei, aber OpenClaw-Agent-Turns verwenden die normale geroutete Sitzung und den Agent des Zielkanals. Die Echtzeit-Voice-Sitzung spricht das zurückgegebene Ergebnis zurück in den Voice-Kanal. Der Supervisor-Agent kann entsprechend seiner Tool-Richtlinie weiterhin normale Message-Tools verwenden, einschließlich des Sendens einer separaten Discord-Nachricht, wenn das die richtige Aktion ist.

Nützliche Zielformen:

- `target: "channel:123456789012345678"` routet über eine Discord-Textkanal-Sitzung.
- `target: "123456789012345678"` wird als Kanalziel behandelt.
- `target: "dm:123456789012345678"` oder `target: "user:123456789012345678"` routet über diese Direct-Message-Sitzung.

OpenAI-Realtime-Beispiel für starkes Echo:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai-codex/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          voice: "cedar",
          bargeIn: true,
          minBargeInAudioEndMs: 500,
          consultPolicy: "always",
          providers: {
            openai: {
              interruptResponseOnInputAudio: false,
            },
          },
        },
      },
    },
  },
}
```

Verwenden Sie dies, wenn das Modell seine eigene Discord-Wiedergabe über ein offenes Mikrofon hört, Sie es aber weiterhin durch Sprechen unterbrechen möchten. OpenClaw verhindert, dass OpenAI bei rohem Eingabeaudio automatisch unterbricht, während `bargeIn: true` Discord-Sprecherstart-Ereignisse und bereits aktive Sprecher-Audiosignale aktive Realtime-Antworten abbrechen lässt, bevor der nächste erfasste Turn OpenAI erreicht. Sehr frühe Barge-in-Signale mit `audioEndMs` unterhalb von `minBargeInAudioEndMs` werden als wahrscheinliches Echo/Rauschen behandelt und ignoriert, damit das Modell nicht bereits beim ersten Wiedergabe-Frame abbricht.

Erwartete Voice-Logs:

- Beim Beitreten: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- Beim Realtime-Start: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- Bei Sprecher-Audio: `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...` und `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- Bei übersprungener veralteter Sprache: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` oder `reason=non-actionable-closing ...`
- Beim Abschluss der Realtime-Antwort: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- Bei Wiedergabestopp/-zurücksetzung: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- Bei Realtime-Consult: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- Bei Agent-Antwort: `discord voice: agent turn answer ...`
- Bei eingereihter exakter Sprache: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`, gefolgt von `discord voice: realtime exact speech dequeued reason=player-idle ...`
- Bei Barge-in-Erkennung: `discord voice: realtime barge-in detected source=speaker-start ...` oder `discord voice: realtime barge-in detected source=active-speaker-audio ...`, gefolgt von `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- Bei Realtime-Unterbrechung: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`, gefolgt entweder von `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` oder `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- Bei ignoriertem Echo/Rauschen: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- Bei deaktiviertem Barge-in: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- Bei inaktiver Wiedergabe: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

Um abgeschnittenes Audio zu debuggen, lesen Sie die Realtime-Voice-Logs als Zeitachse:

1. `realtime audio playback started` bedeutet, dass Discord mit der Wiedergabe von Assistant-Audio begonnen hat. Die Bridge zählt ab diesem Punkt Assistant-Ausgabe-Chunks, Discord-PCM-Bytes, Provider-Realtime-Bytes und die synthetisierte Audiodauer.
2. `realtime speaker turn opened` markiert, dass ein Discord-Sprecher aktiv wird. Wenn die Wiedergabe bereits aktiv ist und `bargeIn` aktiviert ist, kann darauf `barge-in detected source=speaker-start` folgen.
3. `realtime input audio started` markiert den ersten tatsächlich empfangenen Audio-Frame für diesen Sprecher-Turn. `outputActive=true` oder ein von null verschiedener `outputAudioMs` hier bedeutet, dass das Mikrofon Eingaben sendet, während die Assistant-Wiedergabe noch aktiv ist.
4. `barge-in detected source=active-speaker-audio` bedeutet, dass OpenClaw Live-Sprecher-Audio gesehen hat, während die Assistant-Wiedergabe aktiv war. Dies ist nützlich, um eine echte Unterbrechung von einem Discord-Sprecherstart-Ereignis ohne verwertbares Audio zu unterscheiden.
5. `barge-in requested reason=...` bedeutet, dass OpenClaw den Realtime-Provider aufgefordert hat, die aktive Antwort abzubrechen oder zu kürzen. Es enthält `outputAudioMs`, `outputActive` und `playbackChunks`, damit Sie sehen können, wie viel Assistant-Audio vor der Unterbrechung tatsächlich abgespielt wurde.
6. `realtime audio playback stopped reason=...` ist der lokale Zurücksetzungspunkt der Discord-Wiedergabe. Der Grund gibt an, wer die Wiedergabe gestoppt hat: `barge-in`, `player-idle`, `provider-clear-audio`, `forced-agent-consult`, `stream-close` oder `session-close`.
7. `realtime speaker turn closed` fasst den erfassten Eingabe-Turn zusammen. `chunks=0` oder `hasAudio=false` bedeutet, dass der Sprecher-Turn geöffnet wurde, aber kein nutzbares Audio die Realtime-Bridge erreicht hat. `interruptedPlayback=true` bedeutet, dass sich dieser Eingabe-Turn mit der Assistant-Ausgabe überschnitten und Barge-in-Logik ausgelöst hat.

Nützliche Felder:

- `outputAudioMs`: vom Realtime-Provider vor der Log-Zeile erzeugte Assistant-Audiodauer.
- `audioMs`: Assistant-Audiodauer, die OpenClaw gezählt hat, bevor die Wiedergabe gestoppt wurde.
- `elapsedMs`: Echtzeit zwischen Öffnen und Schließen des Wiedergabe-Streams oder Sprecher-Turns.
- `discordBytes`: 48-kHz-Stereo-PCM-Bytes, die an Discord Voice gesendet oder von dort empfangen wurden.
- `realtimeBytes`: PCM-Bytes im Provider-Format, die an den Realtime-Provider gesendet oder von dort empfangen wurden.
- `playbackChunks`: Assistant-Audio-Chunks, die für die aktive Antwort an Discord weitergeleitet wurden.
- `sinceLastAudioMs`: Abstand zwischen dem letzten erfassten Sprecher-Audio-Frame und dem Schließen des Sprecher-Turns.

Häufige Muster:

- Sofortiges Abschneiden mit `source=active-speaker-audio`, kleinem `outputAudioMs` und demselben Nutzer in der Nähe weist meist darauf hin, dass Lautsprecherecho in das Mikrofon gelangt. Erhöhen Sie `voice.realtime.minBargeInAudioEndMs`, senken Sie die Lautsprecherlautstärke, verwenden Sie Kopfhörer oder setzen Sie `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`.
- `source=speaker-start` gefolgt von `speaker turn closed ... hasAudio=false` bedeutet, dass Discord einen Sprecherstart gemeldet hat, aber kein Audio OpenClaw erreicht hat. Das kann ein vorübergehendes Discord-Voice-Ereignis, Noise-Gate-Verhalten oder ein Client sein, der das Mikrofon kurz aktiviert.
- `audio playback stopped reason=stream-close` ohne nahegelegenes Barge-in oder `provider-clear-audio` bedeutet, dass der lokale Discord-Wiedergabe-Stream unerwartet beendet wurde. Prüfen Sie die vorherigen Provider- und Discord-Player-Logs.
- `capture ignored during playback (barge-in disabled)` bedeutet, dass OpenClaw Eingaben absichtlich verworfen hat, während Assistant-Audio aktiv war. Aktivieren Sie `voice.realtime.bargeIn`, wenn Sprache die Wiedergabe unterbrechen soll.
- `barge-in ignored ... outputActive=false` bedeutet, dass Discord oder Provider-VAD Sprache gemeldet hat, OpenClaw aber keine aktive Wiedergabe zum Unterbrechen hatte. Dies sollte Audio nicht abschneiden.

Anmeldedaten werden pro Komponente aufgelöst: LLM-Routen-Authentifizierung für `voice.model`, STT-Authentifizierung für `tools.media.audio`, TTS-Authentifizierung für `messages.tts`/`voice.tts` und Realtime-Provider-Authentifizierung für `voice.realtime.providers` oder die normale Authentifizierungskonfiguration des Providers.

### Sprachnachrichten

Discord-Sprachnachrichten zeigen eine Wellenformvorschau und erfordern OGG/Opus-Audio. OpenClaw generiert die Wellenform automatisch, benötigt aber `ffmpeg` und `ffprobe` auf dem Gateway-Host, um zu prüfen und zu konvertieren.

- Geben Sie einen **lokalen Dateipfad** an (URLs werden abgelehnt).
- Lassen Sie Textinhalt weg (Discord lehnt Text + Sprachnachricht in derselben Nutzlast ab).
- Jedes Audioformat wird akzeptiert; OpenClaw konvertiert bei Bedarf zu OGG/Opus.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Nicht erlaubte Intents verwendet oder Bot sieht keine Guild-Nachrichten">

    - Message Content Intent aktivieren
    - Server Members Intent aktivieren, wenn Sie auf Nutzer-/Mitgliederauflösung angewiesen sind
    - Gateway nach Änderung der Intents neu starten

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

  <Accordion title="Require Mention ist false, wird aber weiterhin blockiert">
    Häufige Ursachen:

    - `groupPolicy="allowlist"` ohne passende Guild-/Kanal-Allowlist
    - `requireMention` an der falschen Stelle konfiguriert (muss unter `channels.discord.guilds` oder dem Kanaleintrag stehen)
    - Absender durch Guild-/Kanal-`users`-Allowlist blockiert

  </Accordion>

  <Accordion title="Lang laufende Discord-Turns oder doppelte Antworten">

    Typische Logs:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Discord-Gateway-Queue-Regler:

    - Einzelkonto: `channels.discord.eventQueue.listenerTimeout`
    - Mehrere Konten: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - dies steuert nur Listener-Arbeit des Discord-Gateways, nicht die Lebensdauer von Agent-Turns

    Discord wendet kein kanaleigenes Timeout auf eingereihte Agent-Turns an. Message-Listener übergeben sofort, und eingereihte Discord-Läufe behalten die Reihenfolge pro Sitzung bei, bis der Sitzungs-/Tool-/Runtime-Lebenszyklus abgeschlossen ist oder die Arbeit abbricht.

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

  <Accordion title="Timeout-Warnungen bei Gateway-Metadatenabfrage">
    OpenClaw ruft vor dem Verbinden Discord-`/gateway/bot`-Metadaten ab. Vorübergehende Fehler fallen auf die Standard-Gateway-URL von Discord zurück und werden in Logs rate-limitiert.

    Metadaten-Timeout-Regler:

    - Einzelkonto: `channels.discord.gatewayInfoTimeoutMs`
    - Mehrere Konten: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - Env-Fallback, wenn die Konfiguration nicht gesetzt ist: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - Standard: `30000` (30 Sekunden), Maximum: `120000`

  </Accordion>

  <Accordion title="Gateway-READY-Timeout-Neustarts">
    OpenClaw wartet während des Starts und nach Runtime-Neuverbindungen auf Discords Gateway-`READY`-Ereignis. Setups mit mehreren Konten und gestaffeltem Start können ein längeres READY-Startfenster benötigen als den Standard.

    READY-Timeout-Regler:

    - Start, Einzelkonto: `channels.discord.gatewayReadyTimeoutMs`
    - Start, mehrere Konten: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - Start-Env-Fallback, wenn die Konfiguration nicht gesetzt ist: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - Startstandard: `15000` (15 Sekunden), Maximum: `120000`
    - Runtime, Einzelkonto: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - Runtime, mehrere Konten: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - Runtime-Env-Fallback, wenn die Konfiguration nicht gesetzt ist: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - Runtime-Standard: `30000` (30 Sekunden), Maximum: `120000`

  </Accordion>

  <Accordion title="Abweichungen bei Berechtigungsprüfung">
    Berechtigungsprüfungen von `channels status --probe` funktionieren nur für numerische Kanal-IDs.

    Wenn Sie Slug-Schlüssel verwenden, kann Runtime-Matching weiterhin funktionieren, aber Probe kann Berechtigungen nicht vollständig verifizieren.

  </Accordion>

  <Accordion title="DM- und Pairing-Probleme">

    - DM deaktiviert: `channels.discord.dm.enabled=false`
    - DM-Richtlinie deaktiviert: `channels.discord.dmPolicy="disabled"` (veraltet: `channels.discord.dm.policy`)
    - ausstehende Pairing-Genehmigung im `pairing`-Modus

  </Accordion>

  <Accordion title="Bot-zu-Bot-Schleifen">
    Standardmäßig werden von Bots verfasste Nachrichten ignoriert.

    Wenn Sie `channels.discord.allowBots=true` setzen, verwenden Sie strikte Erwähnungs- und Allowlist-Regeln, um Schleifenverhalten zu vermeiden.
    Verwenden Sie vorzugsweise `channels.discord.allowBots="mentions"`, um nur Bot-Nachrichten zu akzeptieren, die den Bot erwähnen.

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

  <Accordion title="Voice-STT-Aussetzer mit DecryptionFailed(...)">

    - halten Sie OpenClaw aktuell (`openclaw update`), damit die Wiederherstellungslogik für Discord-Sprach-Empfang vorhanden ist
    - bestätigen Sie `channels.discord.voice.daveEncryption=true` (Standard)
    - beginnen Sie mit `channels.discord.voice.decryptionFailureTolerance=24` (Upstream-Standard) und passen Sie den Wert nur bei Bedarf an
    - beobachten Sie die Logs auf:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - wenn Fehler nach dem automatischen erneuten Beitritt weiterhin auftreten, sammeln Sie Logs und vergleichen Sie sie mit der Upstream-DAVE-Empfangshistorie in [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) und [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Konfigurationsreferenz

Primäre Referenz: [Konfigurationsreferenz - Discord](/de/gateway/config-channels#discord).

<Accordion title="Wichtige Discord-Felder">

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
- Funktionen: `threadBindings`, `bindings[]` auf oberster Ebene (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## Sicherheit und Betrieb

- Behandeln Sie Bot-Tokens als Geheimnisse (`DISCORD_BOT_TOKEN` bevorzugt in überwachten Umgebungen).
- Gewähren Sie Discord-Berechtigungen nach dem Prinzip der geringsten Rechte.
- Wenn Befehls-Deployment/-Status veraltet ist, starten Sie den Gateway neu und prüfen Sie erneut mit `openclaw channels status --probe`.

## Verwandt

<CardGroup cols={2}>
  <Card title="Kopplung" icon="link" href="/de/channels/pairing">
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
  <Card title="Slash-Befehle" icon="terminal" href="/de/tools/slash-commands">
    Natives Befehlsverhalten.
  </Card>
</CardGroup>
