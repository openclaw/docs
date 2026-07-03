---
read_when:
    - Arbeiten an Funktionen des Discord-Kanals
summary: Status, Funktionen und Konfiguration der Discord-Bot-Unterstützung
title: Discord
x-i18n:
    generated_at: "2026-07-03T02:44:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b7e8724b02baa1a2dba1ac932e20533c9293b6021f30b1a79107349c34f195e5
    source_path: channels/discord.md
    workflow: 16
---

Bereit für DMs und Guild-Kanäle über das offizielle Discord-Gateway.

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

Sie müssen eine neue Anwendung mit einem Bot erstellen, den Bot zu Ihrem Server hinzufügen und ihn mit OpenClaw koppeln. Wir empfehlen, Ihren Bot zu Ihrem eigenen privaten Server hinzuzufügen. Wenn Sie noch keinen haben, [erstellen Sie zuerst einen](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (wählen Sie **Create My Own > For me and my friends**).

<Steps>
  <Step title="Discord-Anwendung und Bot erstellen">
    Gehen Sie zum [Discord Developer Portal](https://discord.com/developers/applications) und klicken Sie auf **New Application**. Benennen Sie sie zum Beispiel „OpenClaw“.

    Klicken Sie in der Seitenleiste auf **Bot**. Setzen Sie den **Username** auf den Namen, den Sie für Ihren OpenClaw-Agenten verwenden.

  </Step>

  <Step title="Privilegierte Intents aktivieren">
    Bleiben Sie auf der Seite **Bot**, scrollen Sie nach unten zu **Privileged Gateway Intents** und aktivieren Sie:

    - **Message Content Intent** (erforderlich)
    - **Server Members Intent** (empfohlen; erforderlich für Rollen-Allowlists und Namens-zu-ID-Abgleich)
    - **Presence Intent** (optional; nur für Presence-Updates erforderlich)

  </Step>

  <Step title="Bot-Token kopieren">
    Scrollen Sie auf der Seite **Bot** wieder nach oben und klicken Sie auf **Reset Token**.

    <Note>
    Trotz des Namens erzeugt dies Ihr erstes Token - es wird nichts „zurückgesetzt“.
    </Note>

    Kopieren Sie das Token und speichern Sie es an einem Ort. Dies ist Ihr **Bot Token**, und Sie benötigen es gleich.

  </Step>

  <Step title="Einladungs-URL generieren und den Bot zu Ihrem Server hinzufügen">
    Klicken Sie in der Seitenleiste auf **OAuth2**. Sie generieren eine Einladungs-URL mit den richtigen Berechtigungen, um den Bot zu Ihrem Server hinzuzufügen.

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

    Dies ist die Basisausstattung für normale Textkanäle. Wenn Sie vorhaben, in Discord-Threads zu posten, einschließlich Workflows für Forum- oder Medienkanäle, die einen Thread erstellen oder fortsetzen, aktivieren Sie außerdem **Send Messages in Threads**.
    Kopieren Sie die generierte URL unten, fügen Sie sie in Ihren Browser ein, wählen Sie Ihren Server aus und klicken Sie auf **Continue**, um die Verbindung herzustellen. Sie sollten Ihren Bot jetzt auf dem Discord-Server sehen.

  </Step>

  <Step title="Entwicklermodus aktivieren und Ihre IDs erfassen">
    Zurück in der Discord-App müssen Sie den Entwicklermodus aktivieren, damit Sie interne IDs kopieren können.

    1. Klicken Sie auf **User Settings** (Zahnradsymbol neben Ihrem Avatar) → scrollen Sie in der Seitenleiste zu **Developer** → aktivieren Sie **Developer Mode**

        *(Hinweis: In der mobilen Discord-App befindet sich der Entwicklermodus unter **App Settings** → **Advanced**)*

    2. Klicken Sie mit der rechten Maustaste auf Ihr **Serversymbol** in der Seitenleiste → **Copy Server ID**
    3. Klicken Sie mit der rechten Maustaste auf Ihren **eigenen Avatar** → **Copy User ID**

    Speichern Sie Ihre **Server ID** und **User ID** zusammen mit Ihrem Bot Token - Sie senden alle drei im nächsten Schritt an OpenClaw.

  </Step>

  <Step title="DMs von Servermitgliedern erlauben">
    Damit die Kopplung funktioniert, muss Discord Ihrem Bot erlauben, Ihnen eine DM zu senden. Klicken Sie mit der rechten Maustaste auf Ihr **Serversymbol** → **Privacy Settings** → aktivieren Sie **Direct Messages**.

    Dadurch können Servermitglieder (einschließlich Bots) Ihnen DMs senden. Lassen Sie dies aktiviert, wenn Sie Discord-DMs mit OpenClaw verwenden möchten. Wenn Sie nur Guild-Kanäle verwenden möchten, können Sie DMs nach der Kopplung deaktivieren.

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

    Wenn OpenClaw bereits als Hintergrunddienst läuft, starten Sie es über die OpenClaw-Mac-App neu oder beenden und starten Sie den Prozess `openclaw gateway run` erneut.
    Für verwaltete Dienstinstallationen führen Sie `openclaw gateway install` aus einer Shell aus, in der `DISCORD_BOT_TOKEN` vorhanden ist, oder speichern Sie die Variable in `~/.openclaw/.env`, damit der Dienst den env-SecretRef nach dem Neustart auflösen kann.
    Wenn Ihr Host durch Discords Startup-Anwendungsabfrage blockiert oder rate-limitiert wird, setzen Sie die Discord-Anwendungs-/Client-ID aus dem Developer Portal, damit der Start diesen REST-Aufruf überspringen kann. Verwenden Sie `channels.discord.applicationId` für das Standardkonto oder `channels.discord.accounts.<accountId>.applicationId`, wenn Sie mehrere Discord-Bots ausführen.

  </Step>

  <Step title="OpenClaw konfigurieren und koppeln">

    <Tabs>
      <Tab title="Ihren Agenten fragen">
        Chatten Sie mit Ihrem OpenClaw-Agenten in einem vorhandenen Kanal (z. B. Telegram) und teilen Sie es ihm mit. Wenn Discord Ihr erster Kanal ist, verwenden Sie stattdessen den Tab CLI / config.

        > „Ich habe mein Discord-Bot-Token bereits in der Konfiguration gesetzt. Bitte schließen Sie die Discord-Einrichtung mit User ID `<user_id>` und Server ID `<server_id>` ab.“
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

        Für skriptbasierte oder Remote-Einrichtung schreiben Sie denselben JSON5-Block mit `openclaw config patch --file ./discord.patch.json5 --dry-run` und führen Sie ihn dann erneut ohne `--dry-run` aus. Klartext-`token`-Werte werden unterstützt. SecretRef-Werte werden ebenfalls für `channels.discord.token` über env/file/exec-Provider hinweg unterstützt. Siehe [Geheimnisverwaltung](/de/gateway/secrets).

        Für mehrere Discord-Bots halten Sie jedes Bot-Token und jede Anwendungs-ID unter dem jeweiligen Konto. Ein `channels.discord.applicationId` auf oberster Ebene wird von Konten geerbt. Setzen Sie es dort daher nur, wenn jedes Konto dieselbe Anwendungs-ID verwenden soll.

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
    Warten Sie, bis das Gateway läuft, und senden Sie Ihrem Bot dann eine DM in Discord. Er antwortet mit einem Kopplungscode.

    <Tabs>
      <Tab title="Ihren Agenten fragen">
        Senden Sie den Kopplungscode in Ihrem vorhandenen Kanal an Ihren Agenten:

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

    Sie sollten jetzt per DM in Discord mit Ihrem Agenten chatten können.

  </Step>
</Steps>

<Note>
Die Token-Auflösung ist kontobewusst. Konfigurations-Token-Werte haben Vorrang vor dem env-Fallback. `DISCORD_BOT_TOKEN` wird nur für das Standardkonto verwendet.
Wenn zwei aktivierte Discord-Konten auf dasselbe Bot-Token auflösen, startet OpenClaw nur einen Gateway-Monitor für dieses Token. Ein aus der Konfiguration stammendes Token hat Vorrang vor dem standardmäßigen env-Fallback; andernfalls gewinnt das erste aktivierte Konto, und das doppelte Konto wird als deaktiviert gemeldet.
Für erweiterte ausgehende Aufrufe (Nachrichten-Tool/Kanalaktionen) wird ein explizites `token` pro Aufruf für diesen Aufruf verwendet. Dies gilt für Sende- und Lese-/Probe-artige Aktionen (zum Beispiel read/search/fetch/thread/pins/permissions). Kontorichtlinie und Wiederholungseinstellungen stammen weiterhin aus dem ausgewählten Konto im aktiven Runtime-Snapshot.
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
      <Tab title="Config">

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
    Standardmäßig antwortet Ihr Agent in Guild-Kanälen nur, wenn er @erwähnt wird. Für einen privaten Server möchten Sie wahrscheinlich, dass er auf jede Nachricht antwortet.

    In Guild-Kanälen werden normale Antworten standardmäßig automatisch gepostet. Aktivieren Sie für gemeinsam genutzte Always-on-Räume `messages.groupChat.visibleReplies: "message_tool"`, damit der Agent mitlesen und nur posten kann, wenn er entscheidet, dass eine Kanalantwort nützlich ist. Dies funktioniert am besten mit Modellen der neuesten Generation mit zuverlässiger Tool-Nutzung, z. B. GPT 5.5. Ambient-Raumereignisse bleiben still, sofern das Tool nicht sendet. Die vollständige Lurk-Modus-Konfiguration finden Sie unter [Ambient-Raumereignisse](/de/channels/ambient-room-events).

    Wenn Discord Tippen anzeigt und die Logs Token-Nutzung zeigen, aber keine Nachricht gepostet wird, prüfen Sie, ob der Turn als Ambient-Raumereignis konfiguriert war oder sichtbare Antworten über das Nachrichten-Tool aktiviert wurden.

    <Tabs>
      <Tab title="Ihren Agenten fragen">
        > „Erlauben Sie meinem Agenten, auf diesem Server zu antworten, ohne @erwähnt werden zu müssen“
      </Tab>
      <Tab title="Config">
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

        Um Nachrichten-Tool-Sends für sichtbare Gruppen-/Kanalantworten zu verlangen, setzen Sie `messages.groupChat.visibleReplies: "message_tool"`.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Speicher in Guild-Kanälen einplanen">
    Standardmäßig wird der Langzeitspeicher (MEMORY.md) nur in DM-Sitzungen geladen. Guild-Kanäle laden MEMORY.md nicht automatisch.

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

Erstellen Sie nun einige Kanäle auf Ihrem Discord-Server und beginnen Sie zu chatten. Ihr Agent kann den Kanalnamen sehen, und jeder Kanal erhält seine eigene isolierte Sitzung - Sie können also `#coding`, `#home`, `#research` oder alles einrichten, was zu Ihrem Workflow passt.

## Runtime-Modell

- Gateway besitzt die Discord-Verbindung.
- Das Reply-Routing ist deterministisch: eingehende Discord-Antworten gehen zurück an Discord.
- Discord-Guild-/Kanal-Metadaten werden dem Modell-Prompt als nicht vertrauenswürdiger
  Kontext hinzugefügt, nicht als für Benutzer sichtbares Antwortpräfix. Wenn ein Modell diese Hülle
  zurückkopiert, entfernt OpenClaw die kopierten Metadaten aus ausgehenden Antworten und aus
  künftigem Wiedergabekontext.
- Standardmäßig (`session.dmScope=main`) teilen Direktchats die Hauptsitzung des Agents (`agent:main:main`).
- Guild-Kanäle sind isolierte Sitzungsschlüssel (`agent:<agentId>:discord:channel:<channelId>`).
- Gruppen-DMs werden standardmäßig ignoriert (`channels.discord.dm.groupEnabled=false`).
- Native Slash-Befehle laufen in isolierten Befehlssitzungen (`agent:<agentId>:discord:slash:<userId>`), führen aber weiterhin `CommandTargetSessionKey` für die geroutete Konversationssitzung mit.
- Rein textbasierte Cron-/Heartbeat-Ankündigungen an Discord verwenden die endgültige
  für den Assistenten sichtbare Antwort genau einmal. Medien- und strukturierte Komponenten-Payloads bleiben
  Mehrfachnachrichten, wenn der Agent mehrere zustellbare Payloads ausgibt.

## Forumskanäle

Discord-Forum- und Medienkanäle akzeptieren nur Thread-Beiträge. OpenClaw unterstützt zwei Möglichkeiten, sie zu erstellen:

- Senden Sie eine Nachricht an das Forum übergeordnete Element (`channel:<forumId>`), um automatisch einen Thread zu erstellen. Der Thread-Titel verwendet die erste nicht leere Zeile Ihrer Nachricht.
- Verwenden Sie `openclaw message thread create`, um einen Thread direkt zu erstellen. Übergeben Sie für Forumskanäle kein `--message-id`.

Beispiel: an das Forum übergeordnete Element senden, um einen Thread zu erstellen

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Beispiel: einen Forum-Thread explizit erstellen

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Forum übergeordnete Elemente akzeptieren keine Discord-Komponenten. Wenn Sie Komponenten benötigen, senden Sie an den Thread selbst (`channel:<threadId>`).

## Interaktive Komponenten

OpenClaw unterstützt Discord-Komponenten-v2-Container für Agent-Nachrichten. Verwenden Sie das Nachrichten-Tool mit einem `components`-Payload. Interaktionsergebnisse werden als normale eingehende Nachrichten an den Agent zurückgeroutet und folgen den bestehenden Discord-`replyToMode`-Einstellungen.

Unterstützte Blöcke:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Aktionszeilen erlauben bis zu 5 Buttons oder ein einzelnes Auswahlmenü
- Auswahltypen: `string`, `user`, `role`, `mentionable`, `channel`

Standardmäßig sind Komponenten nur einmal verwendbar. Setzen Sie `components.reusable=true`, damit Buttons, Auswahlen und Formulare mehrfach verwendet werden können, bis sie ablaufen.

Um einzuschränken, wer auf einen Button klicken kann, setzen Sie `allowedUsers` für diesen Button (Discord-Benutzer-IDs, Tags oder `*`). Wenn konfiguriert, erhalten nicht übereinstimmende Benutzer eine ephemere Ablehnung.

Komponenten-Callbacks laufen standardmäßig nach 30 Minuten ab. Setzen Sie `channels.discord.agentComponents.ttlMs`, um diese Callback-Registry-Lebensdauer für das standardmäßige Discord-Konto zu ändern, oder `channels.discord.accounts.<accountId>.agentComponents.ttlMs`, um ein Konto in einer Multi-Konto-Einrichtung zu überschreiben. Der Wert ist in Millisekunden, muss eine positive Ganzzahl sein und ist auf `86400000` (24 Stunden) begrenzt. Längere TTLs sind nützlich für Review- oder Genehmigungs-Workflows, bei denen Buttons nutzbar bleiben müssen, erweitern aber auch das Zeitfenster, in dem eine alte Discord-Nachricht noch eine Aktion auslösen kann. Bevorzugen Sie die kürzeste TTL, die zum Workflow passt, und behalten Sie die Voreinstellung bei, wenn veraltete Callbacks überraschend wären.

Die Slash-Befehle `/model` und `/models` öffnen eine interaktive Modellauswahl mit Dropdowns für Provider, Modell und kompatible Runtime sowie einem Absenden-Schritt. `/models add` ist veraltet und gibt jetzt eine Veraltungsmeldung zurück, statt Modelle aus dem Chat zu registrieren. Die Auswahlantwort ist ephemer, und nur der aufrufende Benutzer kann sie verwenden. Discord-Auswahlmenüs sind auf 25 Optionen begrenzt. Fügen Sie daher `provider/*`-Einträge zu `agents.defaults.models` hinzu, wenn die Auswahl dynamisch erkannte Modelle nur für ausgewählte Provider wie `openai` oder `vllm` anzeigen soll.

Dateianhänge:

- `file`-Blöcke müssen auf eine Anhangsreferenz zeigen (`attachment://<filename>`)
- Stellen Sie den Anhang über `media`/`path`/`filePath` bereit (einzelne Datei); verwenden Sie `media-gallery` für mehrere Dateien
- Verwenden Sie `filename`, um den Upload-Namen zu überschreiben, wenn er zur Anhangsreferenz passen soll

Modale Formulare:

- Fügen Sie `components.modal` mit bis zu 5 Feldern hinzu
- Feldtypen: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw fügt automatisch einen Auslösebutton hinzu

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
    - Bei einem Konto hat `allowFrom` Vorrang vor dem Legacy-`dm.allowFrom`.
    - Benannte Konten erben `channels.discord.allowFrom`, wenn ihr eigenes `allowFrom` und das Legacy-`dm.allowFrom` nicht gesetzt sind.
    - Benannte Konten erben `channels.discord.accounts.default.allowFrom` nicht.

    Legacy-`channels.discord.dm.policy` und `channels.discord.dm.allowFrom` werden aus Kompatibilitätsgründen weiterhin gelesen. `openclaw doctor --fix` migriert sie zu `dmPolicy` und `allowFrom`, wenn dies ohne Änderung des Zugriffs möglich ist.

    DM-Zielformat für die Zustellung:

    - `user:<id>`
    - `<@id>`-Erwähnung

    Reine numerische IDs werden normalerweise als Kanal-IDs aufgelöst, wenn ein Kanalstandard aktiv ist, aber IDs, die in der effektiven DM-`allowFrom` des Kontos aufgeführt sind, werden aus Kompatibilitätsgründen als Benutzer-DM-Ziele behandelt.

  </Tab>

  <Tab title="Access groups">
    Discord-DMs und die Autorisierung von Textbefehlen können dynamische `accessGroup:<name>`-Einträge in `channels.discord.allowFrom` verwenden.

    Zugriffgruppennamen werden kanalübergreifend für Nachrichtenkanäle geteilt. Verwenden Sie `type: "message.senders"` für eine statische Gruppe, deren Mitglieder in der normalen `allowFrom`-Syntax jedes Kanals ausgedrückt werden, oder `type: "discord.channelAudience"`, wenn die aktuelle `ViewChannel`-Zielgruppe eines Discord-Kanals die Mitgliedschaft dynamisch definieren soll. Gemeinsames Zugriffgruppenverhalten ist hier dokumentiert: [Zugriffgruppen](/de/channels/access-groups).

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

    Ein Discord-Textkanal hat keine separate Mitgliederliste. `type: "discord.channelAudience"` modelliert die Mitgliedschaft wie folgt: Der DM-Absender ist Mitglied der konfigurierten Guild und hat derzeit die effektive `ViewChannel`-Berechtigung für den konfigurierten Kanal, nachdem Rollen- und Kanalüberschreibungen angewendet wurden.

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

    Nachschlagen schlägt geschlossen fehl. Wenn Discord `Missing Access` zurückgibt, die Mitgliedersuche fehlschlägt oder der Kanal zu einer anderen Guild gehört, wird der DM-Absender als nicht autorisiert behandelt.

    Aktivieren Sie im Discord Developer Portal den **Server Members Intent** für den Bot, wenn Sie kanalzielgruppenbasierte Zugriffgruppen verwenden. DMs enthalten keinen Guild-Mitgliedsstatus, daher löst OpenClaw das Mitglied zum Autorisierungszeitpunkt über Discord REST auf.

  </Tab>

  <Tab title="Guild policy">
    Guild-Behandlung wird durch `channels.discord.groupPolicy` gesteuert:

    - `open`
    - `allowlist`
    - `disabled`

    Die sichere Basislinie, wenn `channels.discord` vorhanden ist, ist `allowlist`.

    Verhalten von `allowlist`:

    - Guild muss `channels.discord.guilds` entsprechen (`id` bevorzugt, Slug akzeptiert)
    - optionale Absender-Allowlists: `users` (stabile IDs empfohlen) und `roles` (nur Rollen-IDs); wenn eines von beiden konfiguriert ist, sind Absender erlaubt, wenn sie `users` ODER `roles` entsprechen
    - direkter Namens-/Tag-Abgleich ist standardmäßig deaktiviert; aktivieren Sie `channels.discord.dangerouslyAllowNameMatching: true` nur als Notfall-Kompatibilitätsmodus
    - Namen/Tags werden für `users` unterstützt, aber IDs sind sicherer; `openclaw security audit` warnt, wenn Namens-/Tag-Einträge verwendet werden
    - wenn eine Guild `channels` konfiguriert hat, werden nicht aufgeführte Kanäle abgelehnt
    - wenn eine Guild keinen `channels`-Block hat, sind alle Kanäle in dieser allowgelisteten Guild erlaubt

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

    Wenn Sie nur `DISCORD_BOT_TOKEN` setzen und keinen `channels.discord`-Block erstellen, ist der Runtime-Fallback `groupPolicy="allowlist"` (mit einer Warnung in den Logs), auch wenn `channels.defaults.groupPolicy` `open` ist.

  </Tab>

  <Tab title="Mentions and group DMs">
    Guild-Nachrichten sind standardmäßig durch Erwähnungen geschützt.

    Erwähnungserkennung umfasst:

    - explizite Bot-Erwähnung
    - konfigurierte Erwähnungsmuster (`agents.list[].groupChat.mentionPatterns`, Fallback `messages.groupChat.mentionPatterns`)
    - implizites Antwort-an-Bot-Verhalten in unterstützten Fällen

    Verwenden Sie beim Schreiben ausgehender Discord-Nachrichten die kanonische Erwähnungssyntax: `<@USER_ID>` für Benutzer, `<#CHANNEL_ID>` für Kanäle und `<@&ROLE_ID>` für Rollen. Verwenden Sie nicht die Legacy-Nickname-Erwähnungsform `<@!USER_ID>`.

    `requireMention` wird pro Guild/Kanal konfiguriert (`channels.discord.guilds...`).
    `ignoreOtherMentions` verwirft optional Nachrichten, die einen anderen Benutzer/eine andere Rolle erwähnen, aber nicht den Bot (ausgenommen @everyone/@here).

    Gruppen-DMs:

    - Standard: ignoriert (`dm.groupEnabled=false`)
    - optionale Allowlist über `dm.groupChannels` (Kanal-IDs oder Slugs)

  </Tab>
</Tabs>

### Rollenbasiertes Agent-Routing

Verwenden Sie `bindings[].match.roles`, um Discord-Guild-Mitglieder anhand der Rollen-ID an unterschiedliche Agenten weiterzuleiten. Rollenbasierte Bindings akzeptieren ausschließlich Rollen-IDs und werden nach Peer- oder Parent-Peer-Bindings und vor Guild-only-Bindings ausgewertet. Wenn ein Binding auch andere Match-Felder setzt (zum Beispiel `peer` + `guildId` + `roles`), müssen alle konfigurierten Felder übereinstimmen.

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
- Überschreibung pro Kanal: `channels.discord.commands.native`.
- `commands.native=false` überspringt die Registrierung und Bereinigung von Discord-Slash-Befehlen beim Start. Zuvor registrierte Befehle können in Discord sichtbar bleiben, bis Sie sie aus der Discord-App entfernen.
- Die Authentifizierung nativer Befehle verwendet dieselben Discord-Allowlists/Richtlinien wie die normale Nachrichtenverarbeitung.
- Befehle können in der Discord-Oberfläche weiterhin für Benutzer sichtbar sein, die nicht autorisiert sind; die Ausführung erzwingt dennoch die OpenClaw-Authentifizierung und gibt „not authorized“ zurück.

Siehe [Slash-Befehle](/de/tools/slash-commands) für Befehlskatalog und Verhalten.

Standardeinstellungen für Slash-Befehle:

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

    Hinweis: `off` deaktiviert implizites Reply-Threading. Explizite `[[reply_to_*]]`-Tags werden weiterhin beachtet.
    `first` hängt die implizite native Antwortreferenz immer an die erste ausgehende Discord-Nachricht des Turns an.
    `batched` hängt die implizite native Discord-Antwortreferenz nur an, wenn das
    eingehende Ereignis ein debounced Batch mehrerer Nachrichten war. Das ist nützlich,
    wenn Sie native Antworten hauptsächlich für mehrdeutige, stoßweise Chats wünschen, nicht für jeden
    Turn mit nur einer Nachricht.

    Nachrichten-IDs werden im Kontext/Verlauf verfügbar gemacht, damit Agenten gezielt bestimmte Nachrichten adressieren können.

  </Accordion>

  <Accordion title="Link-Vorschauen">
    Discord erzeugt standardmäßig Rich-Link-Embeds für URLs. OpenClaw unterdrückt diese generierten Embeds bei ausgehenden Discord-Nachrichten standardmäßig, sodass von Agenten gesendete URLs als einfache Links bleiben, sofern Sie dies nicht aktivieren:

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    Setzen Sie `channels.discord.accounts.<id>.suppressEmbeds`, um ein Konto zu überschreiben. Sendevorgänge mit dem Agent-Nachrichten-Tool können für eine einzelne Nachricht auch `suppressEmbeds: false` übergeben. Explizite Discord-`embeds`-Payloads werden durch die Standard-Link-Vorschau-Einstellung nicht unterdrückt.

  </Accordion>

  <Accordion title="Live-Stream-Vorschau">
    OpenClaw kann Antwortentwürfe streamen, indem es eine temporäre Nachricht sendet und sie bearbeitet, während Text eintrifft. `channels.discord.streaming` akzeptiert `off` | `partial` | `block` | `progress` (Standard). `progress` behält einen bearbeitbaren Statusentwurf bei und aktualisiert ihn bis zur finalen Zustellung mit Tool-Fortschritt; das gemeinsame Startlabel ist eine fortlaufende Zeile, sodass es wie der Rest aus dem sichtbaren Bereich scrollt, sobald genug Arbeit erscheint. `streamMode` ist ein Legacy-Runtime-Alias. Führen Sie `openclaw doctor --fix` aus, um persistierte Konfiguration auf den kanonischen Schlüssel umzuschreiben.

    Setzen Sie `channels.discord.streaming.mode` auf `off`, um Discord-Vorschau-Bearbeitungen zu deaktivieren. Wenn Discord-Block-Streaming ausdrücklich aktiviert ist, überspringt OpenClaw den Vorschau-Stream, um doppeltes Streaming zu vermeiden.

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto",
          maxLines: 8,
          maxLineChars: 120,
          toolProgress: true,
          commentary: false,
        },
      },
    },
  },
}
```

    - `partial` bearbeitet eine einzelne Vorschau-Nachricht, während Tokens eintreffen.
    - `block` gibt entwurfsgrößenbasierte Chunks aus (verwenden Sie `draftChunk`, um Größe und Umbruchpunkte anzupassen, begrenzt durch `textChunkLimit`).
    - Medien, Fehler und finale Antworten mit expliziter Antwortreferenz brechen ausstehende Vorschau-Bearbeitungen ab.
    - `streaming.preview.toolProgress` (Standard `true`) steuert, ob Tool-/Fortschrittsupdates die Vorschau-Nachricht wiederverwenden.
    - Tool-/Fortschrittszeilen werden, sofern verfügbar, als kompaktes Emoji + Titel + Detail dargestellt, zum Beispiel `🛠️ Bash: run tests` oder `🔎 Web Search: for "query"`.
    - `streaming.progress.commentary` (Standard `false`) aktiviert Assistant-Kommentar-/Präambeltext im temporären Fortschrittsentwurf. Kommentare werden vor der Anzeige bereinigt, bleiben vorübergehend und ändern die finale Antwortzustellung nicht.
    - `streaming.progress.maxLineChars` steuert das Vorschau-Budget pro Fortschrittszeile. Fließtext wird an Wortgrenzen gekürzt; Befehls- und Pfaddetails behalten nützliche Suffixe.
    - `streaming.preview.commandText` / `streaming.progress.commandText` steuert Befehls-/Exec-Details in kompakten Fortschrittszeilen: `raw` (Standard) oder `status` (nur Tool-Label).

    Rohtext von Befehlen/Exec ausblenden, während kompakte Fortschrittszeilen erhalten bleiben:

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

    Vorschau-Streaming ist rein textbasiert; Medienantworten fallen auf die normale Zustellung zurück. Wenn `block`-Streaming ausdrücklich aktiviert ist, überspringt OpenClaw den Vorschau-Stream, um doppeltes Streaming zu vermeiden.

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
    - Thread-Sitzungen erben die Sitzungsebenen-`/model`-Auswahl des übergeordneten Kanals als reinen Modell-Fallback; Thread-lokale `/model`-Auswahlen haben weiterhin Vorrang, und der Transkriptverlauf des übergeordneten Kanals wird nicht kopiert, sofern Transkriptvererbung nicht aktiviert ist.
    - `channels.discord.thread.inheritParent` (Standard `false`) aktiviert für neue Auto-Threads das Seeding aus dem übergeordneten Transkript. Überschreibungen pro Konto befinden sich unter `channels.discord.accounts.<id>.thread.inheritParent`.
    - Nachrichten-Tool-Reaktionen können `user:<id>`-DM-Ziele auflösen.
    - `guilds.<guild>.channels.<channel>.requireMention: false` bleibt während des Aktivierungs-Fallbacks in der Antwortphase erhalten.

    Kanalthemen werden als **nicht vertrauenswürdiger** Kontext injiziert. Allowlists steuern, wer den Agenten auslösen kann, sind aber keine vollständige Redaktionsgrenze für Zusatzkontext.

  </Accordion>

  <Accordion title="Thread-gebundene Sitzungen für Subagenten">
    Discord kann einen Thread an ein Sitzungsziel binden, sodass Folgenachrichten in diesem Thread weiterhin an dieselbe Sitzung geroutet werden (einschließlich Subagenten-Sitzungen).

    Befehle:

    - `/focus <target>` bindet den aktuellen/neuen Thread an ein Subagenten-/Sitzungsziel
    - `/unfocus` entfernt die aktuelle Thread-Bindung
    - `/agents` zeigt aktive Läufe und Bindungsstatus an
    - `/session idle <duration|off>` prüft/aktualisiert das Inaktivitäts-Auto-Unfocus für fokussierte Bindings
    - `/session max-age <duration|off>` prüft/aktualisiert das harte Höchstalter für fokussierte Bindings

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
    - `defaultSpawnContext` steuert den nativen Subagenten-Kontext für Thread-gebundene Spawns. Standard: `"fork"`.
    - Veraltete Schlüssel `spawnSubagentSessions`/`spawnAcpSessions` werden durch `openclaw doctor --fix` migriert.
    - Wenn Thread-Bindings für ein Konto deaktiviert sind, sind `/focus` und verwandte Thread-Binding-Operationen nicht verfügbar.

    Siehe [Subagenten](/de/tools/subagents), [ACP-Agenten](/de/tools/acp-agents) und [Konfigurationsreferenz](/de/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Persistente ACP-Kanal-Bindings">
    Für stabile „always-on“-ACP-Arbeitsbereiche konfigurieren Sie Top-Level-typisierte ACP-Bindings, die auf Discord-Unterhaltungen zielen.

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
    - In einem gebundenen Kanal oder Thread setzen `/new` und `/reset` dieselbe ACP-Sitzung an Ort und Stelle zurück. Temporäre Thread-Bindings können die Zielauflösung überschreiben, solange sie aktiv sind.
    - `spawnSessions` steuert das Erstellen/Binden von Child-Threads über `--thread auto|here`.

    Siehe [ACP-Agenten](/de/tools/acp-agents) für Details zum Binding-Verhalten.

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
    - Fallback auf Identitäts-Emoji des Agenten (`agents.list[].identity.emoji`, sonst "👀")

    Hinweise:

    - Discord akzeptiert Unicode-Emoji oder benutzerdefinierte Emoji-Namen.
    - Verwenden Sie `""`, um die Reaktion für einen Kanal oder ein Konto zu deaktivieren.

  </Accordion>

  <Accordion title="Konfigurationsschreibvorgänge">
    Kanalinitiierte Konfigurationsschreibvorgänge sind standardmäßig aktiviert.

    Dies betrifft `/config set|unset`-Flows (wenn Befehlsfunktionen aktiviert sind).

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
    Leiten Sie Discord-Gateway-WebSocket-Verkehr und Startup-REST-Lookups (Anwendungs-ID + Allowlist-Auflösung) mit `channels.discord.proxy` über einen HTTP(S)-Proxy.
    Discord-Gateway-WebSocket-Proxying ist explizit; WebSocket-Verbindungen erben keine umgebenden Proxy-Umgebungsvariablen vom Gateway-Prozess. Startup-REST-Lookups verwenden diesen Proxy, wenn `channels.discord.proxy` konfiguriert ist.

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
    Aktivieren Sie die PluralKit-Auflösung, um weitergeleitete Nachrichten der Identität von Systemmitgliedern zuzuordnen:

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
    - Anzeigenamen von Mitgliedern werden nur dann nach Name/Slug abgeglichen, wenn `channels.discord.dangerouslyAllowNameMatching: true` gesetzt ist
    - Suchvorgänge verwenden die ursprüngliche Nachrichten-ID und sind zeitfensterbeschränkt
    - Wenn die Suche fehlschlägt, werden weitergeleitete Nachrichten als Bot-Nachrichten behandelt und verworfen, sofern nicht `allowBots=true` gesetzt ist

  </Accordion>

  <Accordion title="Ausgehende Erwähnungsaliase">
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

    Zuordnung der Aktivitätstypen:

    - 0: Spielen
    - 1: Streaming (erfordert `activityUrl`)
    - 2: Zuhören
    - 3: Zuschauen
    - 4: Benutzerdefiniert (verwendet den Aktivitätstext als Statuszustand; Emoji ist optional)
    - 5: Antreten

    Beispiel für automatische Präsenz (Laufzeit-Gesundheitssignal):

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

    Automatische Präsenz ordnet die Laufzeitverfügbarkeit dem Discord-Status zu: fehlerfrei => online, beeinträchtigt oder unbekannt => idle, erschöpft oder nicht verfügbar => dnd. Optionale Textüberschreibungen:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (unterstützt den Platzhalter `{reason}`)

  </Accordion>

  <Accordion title="Genehmigungen in Discord">
    Discord unterstützt schaltflächenbasierte Genehmigungsverarbeitung in DMs und kann optional Genehmigungsaufforderungen im ursprünglichen Kanal posten.

    Konfigurationspfad:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (optional; fällt nach Möglichkeit auf `commands.ownerAllowFrom` zurück)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, Standard: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord aktiviert native Ausführungsgenehmigungen automatisch, wenn `enabled` nicht gesetzt oder `"auto"` ist und mindestens ein Genehmiger aufgelöst werden kann, entweder aus `execApprovals.approvers` oder aus `commands.ownerAllowFrom`. Discord leitet Ausführungsgenehmiger nicht aus Kanal-`allowFrom`, veraltetem `dm.allowFrom` oder Direct-Message-`defaultTo` ab. Setzen Sie `enabled: false`, um Discord ausdrücklich als nativen Genehmigungsclient zu deaktivieren.

    Für sensible, nur Eigentümern vorbehaltene Gruppenbefehle wie `/diagnostics` und `/export-trajectory` sendet OpenClaw Genehmigungsaufforderungen und Endergebnisse privat. Es versucht zuerst Discord-DM, wenn der aufrufende Eigentümer eine Discord-Eigentümerroute hat; wenn diese nicht verfügbar ist, fällt es auf die erste verfügbare Eigentümerroute aus `commands.ownerAllowFrom` zurück, etwa Telegram.

    Wenn `target` `channel` oder `both` ist, ist die Genehmigungsaufforderung im Kanal sichtbar. Nur aufgelöste Genehmiger können die Schaltflächen verwenden; andere Benutzer erhalten eine flüchtige Ablehnung. Genehmigungsaufforderungen enthalten den Befehlstext, aktivieren Sie Kanalzustellung daher nur in vertrauenswürdigen Kanälen. Wenn die Kanal-ID nicht aus dem Sitzungsschlüssel abgeleitet werden kann, fällt OpenClaw auf DM-Zustellung zurück.

    Discord rendert außerdem die gemeinsamen Genehmigungsschaltflächen, die von anderen Chatkanälen verwendet werden. Der native Discord-Adapter fügt hauptsächlich Genehmiger-DM-Routing und Kanal-Fanout hinzu.
    Wenn diese Schaltflächen vorhanden sind, sind sie die primäre Genehmigungs-UX; OpenClaw
    sollte nur dann einen manuellen `/approve`-Befehl aufnehmen, wenn das Tool-Ergebnis besagt,
    dass Chatgenehmigungen nicht verfügbar sind oder manuelle Genehmigung der einzige Weg ist.
    Wenn die native Discord-Genehmigungslaufzeit nicht aktiv ist, lässt OpenClaw die
    lokale deterministische Aufforderung `/approve <id> <decision>` sichtbar. Wenn die
    Laufzeit aktiv ist, eine native Karte jedoch an kein Ziel zugestellt werden kann,
    sendet OpenClaw im selben Chat einen Fallback-Hinweis mit dem exakten `/approve`-
    Befehl aus der ausstehenden Genehmigung.

    Gateway-Authentifizierung und Genehmigungsauflösung folgen dem gemeinsamen Gateway-Client-Vertrag (`plugin:`-IDs werden über `plugin.approval.resolve` aufgelöst; andere IDs über `exec.approval.resolve`). Genehmigungen laufen standardmäßig nach 30 Minuten ab.

    Siehe [Ausführungsgenehmigungen](/de/tools/exec-approvals).

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

Standardverhalten der Gates:

| Aktionsgruppe                                                                                                                                                            | Standard     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------ |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | aktiviert    |
| roles                                                                                                                                                                    | deaktiviert  |
| moderation                                                                                                                                                               | deaktiviert  |
| presence                                                                                                                                                                 | deaktiviert  |

## Komponenten-v2-UI

OpenClaw verwendet Discord-Komponenten v2 für Ausführungsgenehmigungen und kontextübergreifende Marker. Discord-Nachrichtenaktionen können auch `components` für benutzerdefinierte UI akzeptieren (fortgeschritten; erfordert das Erstellen einer Komponenten-Payload über das Discord-Tool), während veraltete `embeds` weiterhin verfügbar sind, aber nicht empfohlen werden.

- `channels.discord.ui.components.accentColor` legt die Akzentfarbe fest, die von Discord-Komponentencontainern verwendet wird (Hex).
- Pro Konto mit `channels.discord.accounts.<id>.ui.components.accentColor` setzen.
- `channels.discord.agentComponents.ttlMs` steuert, wie lange gesendete Discord-Komponenten-Callbacks registriert bleiben (Standard `1800000`, Maximum `86400000`). Pro Konto mit `channels.discord.accounts.<id>.agentComponents.ttlMs` setzen.
- `embeds` werden ignoriert, wenn Komponenten v2 vorhanden sind.
- Vorschauen für reine URLs werden standardmäßig unterdrückt. Setzen Sie `suppressEmbeds: false` bei einer Nachrichtenaktion, wenn ein einzelner ausgehender Link erweitert werden soll.

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

Discord hat zwei unterschiedliche Voice-Oberflächen: Echtzeit-**Voice-Kanäle** (fortlaufende Gespräche) und **Voice-Nachrichtenanhänge** (das Waveform-Vorschauformat). Das Gateway unterstützt beide.

### Voice-Kanäle

Einrichtungscheckliste:

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

Um die effektiven Berechtigungen des Bots vor dem Beitritt zu prüfen, führen Sie Folgendes aus:

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
        model: "openai/gpt-5.5",
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
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

Hinweise:

- `voice.tts` überschreibt `messages.tts` nur für die `stt-tts`-Sprachwiedergabe. Realtime-Modi verwenden `voice.realtime.speakerVoice`.
- `voice.mode` steuert den Konversationspfad. Standard ist `agent-proxy`: Ein Realtime-Sprach-Frontend übernimmt Turn-Timing, Unterbrechung und Wiedergabe, delegiert inhaltliche Arbeit über `openclaw_agent_consult` an den gerouteten OpenClaw-Agenten und behandelt das Ergebnis wie einen getippten Discord-Prompt dieses Sprechers. `stt-tts` behält den älteren Batch-STT-plus-TTS-Ablauf bei. `bidi` lässt das Realtime-Modell direkt sprechen und stellt dabei `openclaw_agent_consult` für das OpenClaw-Gehirn bereit.
- `voice.agentSession` steuert, welche OpenClaw-Konversation Sprach-Turns erhält. Lassen Sie es ungesetzt für die eigene Sitzung des Sprachkanals, oder setzen Sie `{ mode: "target", target: "channel:<text-channel-id>" }`, damit der Sprachkanal als Mikrofon-/Lautsprecher-Erweiterung einer bestehenden Discord-Textkanal-Sitzung wie `#maintainers` agiert.
- `voice.model` überschreibt das OpenClaw-Agentengehirn für Discord-Sprachantworten und Realtime-Consults. Lassen Sie es ungesetzt, um das geroutete Agentenmodell zu übernehmen. Es ist von `voice.realtime.model` getrennt.
- `voice.followUsers` lässt den Bot Discord-Sprachkanälen mit ausgewählten Benutzern beitreten, zwischen ihnen wechseln und sie verlassen. Siehe [Benutzern in Sprache folgen](#follow-users-in-voice) für Verhaltensregeln und Beispiele.
- `agent-proxy` leitet Sprache über `discord-voice`, wodurch die normale Besitzer-/Tool-Autorisierung für den Sprecher und die Zielsitzung erhalten bleibt, das Agenten-Tool `tts` aber ausgeblendet wird, weil Discord-Sprache die Wiedergabe besitzt. Standardmäßig gibt `agent-proxy` dem Consult für Besitzer-Sprecher vollständigen, besitzeräquivalenten Tool-Zugriff (`voice.realtime.toolPolicy: "owner"`) und bevorzugt nachdrücklich, vor inhaltlichen Antworten den OpenClaw-Agenten zu konsultieren (`voice.realtime.consultPolicy: "always"`). In diesem standardmäßigen `always`-Modus spricht die Realtime-Schicht vor der Consult-Antwort nicht automatisch Fülltext; sie erfasst und transkribiert Sprache und spricht dann die geroutete OpenClaw-Antwort. Wenn mehrere erzwungene Consult-Antworten fertig werden, während Discord noch die erste Antwort abspielt, werden spätere Exaktsprache-Antworten eingereiht, bis die Wiedergabe untätig ist, statt Sprache mitten im Satz zu ersetzen.
- Im `stt-tts`-Modus verwendet STT `tools.media.audio`; `voice.model` beeinflusst die Transkription nicht.
- In Realtime-Modi konfigurieren `voice.realtime.provider`, `voice.realtime.model` und `voice.realtime.speakerVoice` die Realtime-Audiositzung. Verwenden Sie für OpenAI Realtime 2 plus Codex-Gehirn `voice.realtime.model: "gpt-realtime-2"` und `voice.model: "openai/gpt-5.5"`.
- Realtime-Sprachmodi nehmen standardmäßig kleine Profildateien `IDENTITY.md`, `USER.md` und `SOUL.md` in die Anweisungen des Realtime-Providers auf, damit schnelle direkte Turns dieselbe Identität, Benutzerverankerung und Persona wie der geroutete OpenClaw-Agent behalten. Setzen Sie `voice.realtime.bootstrapContextFiles` auf eine Teilmenge, um dies anzupassen, oder auf `[]`, um es zu deaktivieren. Die unterstützten Realtime-Bootstrap-Dateien sind auf diese Profildateien beschränkt; `AGENTS.md` bleibt im normalen Agentenkontext. Der eingefügte Profilkontext ersetzt `openclaw_agent_consult` nicht für Workspace-Arbeit, aktuelle Fakten, Speichersuche oder Tool-gestützte Aktionen.
- Setzen Sie im OpenAI-`agent-proxy`-Realtime-Modus `voice.realtime.requireWakeName: true`, damit Discord-Realtime-Sprache stumm bleibt, bis ein Transkript mit einem Wake-Namen beginnt oder endet. Konfigurierte Wake-Namen müssen ein oder zwei Wörter sein. Wenn `voice.realtime.wakeNames` ungesetzt ist, verwendet OpenClaw den gerouteten Agenten-`name` plus `OpenClaw` und fällt auf die Agenten-ID plus `OpenClaw` zurück. Wake-Name-Gating deaktiviert die automatische Antwort des Realtime-Providers, leitet akzeptierte Turns über den OpenClaw-Agenten-Consult-Pfad und gibt eine kurze gesprochene Bestätigung, wenn ein führender Wake-Name aus der Teiltranskription erkannt wird, bevor das endgültige Transkript eintrifft.
- Der OpenAI-Realtime-Provider akzeptiert aktuelle Realtime-2-Ereignisnamen und ältere Codex-kompatible Aliasse für Ausgabeaudio- und Transkriptereignisse, sodass kompatible Provider-Snapshots abweichen können, ohne Assistant-Audio zu verwerfen.
- `voice.realtime.bargeIn` steuert, ob Discord-Sprecherstart-Ereignisse aktive Realtime-Wiedergabe unterbrechen. Wenn ungesetzt, folgt es der Eingabeaudio-Unterbrechungseinstellung des Realtime-Providers.
- `voice.realtime.minBargeInAudioEndMs` steuert die minimale Assistant-Wiedergabedauer, bevor ein OpenAI-Realtime-Barge-in Audio abschneidet. Standard: `250`. Setzen Sie `0` für sofortige Unterbrechung in Räumen mit wenig Echo, oder erhöhen Sie den Wert für Lautsprecher-Setups mit starkem Echo.
- Für eine OpenAI-Stimme bei Discord-Wiedergabe setzen Sie `voice.tts.provider: "openai"` und wählen unter `voice.tts.providers.openai.speakerVoice` eine Text-to-Speech-Stimme. `cedar` ist auf dem aktuellen OpenAI-TTS-Modell eine gute männlich klingende Wahl.
- Discord-`systemPrompt`-Überschreibungen pro Kanal gelten für Sprachtranskript-Turns dieses Sprachkanals.
- Sprachtranskript-Turns leiten den Besitzerstatus aus Discord-`allowFrom` (oder `dm.allowFrom`) für besitzergeschützte Befehle und Kanalaktionen ab. Die Sichtbarkeit von Agenten-Tools folgt der konfigurierten Tool-Policy für die geroutete Sitzung.
- Discord-Sprache ist für reine Textkonfigurationen Opt-in; setzen Sie `channels.discord.voice.enabled=true` (oder behalten Sie einen bestehenden `channels.discord.voice`-Block), um `/vc`-Befehle, die Sprachlaufzeit und den `GuildVoiceStates`-Gateway-Intent zu aktivieren.
- `channels.discord.intents.voiceStates` kann das Abonnement für Voice-State-Intents ausdrücklich überschreiben. Lassen Sie es ungesetzt, damit der Intent der effektiven Sprachaktivierung folgt.
- Wenn `voice.autoJoin` mehrere Einträge für dieselbe Guild hat, tritt OpenClaw dem zuletzt konfigurierten Kanal für diese Guild bei.
- `voice.allowedChannels` ist eine optionale Aufenthalts-Allowlist. Lassen Sie sie ungesetzt, um `/vc join` in jeden autorisierten Discord-Sprachkanal zu erlauben. Wenn sie gesetzt ist, sind `/vc join`, Auto-Join beim Start und Bot-Voice-State-Verschiebungen auf die aufgeführten `{ guildId, channelId }`-Einträge beschränkt. Setzen Sie sie auf ein leeres Array, um alle Discord-Sprachbeitritte zu verweigern. Wenn Discord den Bot außerhalb der Allowlist verschiebt, verlässt OpenClaw diesen Kanal und tritt wieder dem konfigurierten Auto-Join-Ziel bei, wenn eines verfügbar ist.
- `voice.daveEncryption` und `voice.decryptionFailureTolerance` werden an die Join-Optionen von `@discordjs/voice` durchgereicht.
- Die Standardwerte von `@discordjs/voice` sind `daveEncryption=true` und `decryptionFailureTolerance=24`, wenn ungesetzt.
- OpenClaw verwendet den gebündelten Codec `libopus-wasm` für Discord-Spracherfassung und Realtime-Raw-PCM-Wiedergabe. Es liefert einen gepinnten libopus-WebAssembly-Build mit und benötigt keine nativen opus-Add-ons.
- `voice.connectTimeoutMs` steuert das anfängliche `@discordjs/voice`-Warten auf Ready für `/vc join` und Auto-Join-Versuche. Standard: `30000`.
- `voice.reconnectGraceMs` steuert, wie lange OpenClaw wartet, bis eine getrennte Sprachsitzung mit der Wiederverbindung beginnt, bevor sie zerstört wird. Standard: `15000`.
- Im `stt-tts`-Modus stoppt die Sprachwiedergabe nicht nur deshalb, weil ein anderer Benutzer zu sprechen beginnt. Um Feedback-Schleifen zu vermeiden, ignoriert OpenClaw neue Spracherfassung, während TTS abgespielt wird; sprechen Sie nach Ende der Wiedergabe für den nächsten Turn. Realtime-Modi leiten Sprecherstarts als Barge-in-Signale an den Realtime-Provider weiter.
- In Realtime-Modi kann Echo von Lautsprechern in ein offenes Mikrofon wie Barge-in wirken und die Wiedergabe unterbrechen. Setzen Sie für Discord-Räume mit starkem Echo `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`, damit OpenAI bei Eingabeaudio nicht automatisch unterbricht. Fügen Sie `voice.realtime.bargeIn: true` hinzu, wenn Discord-Sprecherstart-Ereignisse aktive Wiedergabe weiterhin unterbrechen sollen. Die OpenAI-Realtime-Bridge ignoriert Wiedergabeabschneidungen, die kürzer als `voice.realtime.minBargeInAudioEndMs` sind, als wahrscheinliches Echo/Rauschen und protokolliert sie als übersprungen, statt die Discord-Wiedergabe zu leeren.
- `voice.captureSilenceGraceMs` steuert, wie lange OpenClaw wartet, nachdem Discord gemeldet hat, dass ein Sprecher aufgehört hat, bevor dieses Audiosegment für STT finalisiert wird. Standard: `2000`; erhöhen Sie diesen Wert, wenn Discord normale Pausen in abgehackte Teiltranskripte aufteilt.
- Wenn ElevenLabs der ausgewählte TTS-Provider ist, verwendet Discord-Sprachwiedergabe Streaming-TTS und startet aus dem Antwortstream des Providers. Provider ohne Streaming-Unterstützung fallen auf den synthetisierten temporären Dateipfad zurück.
- OpenClaw überwacht außerdem Empfangsentschlüsselungsfehler und stellt automatisch wieder her, indem es den Sprachkanal nach wiederholten Fehlern in einem kurzen Zeitfenster verlässt und erneut beitritt.
- Wenn Empfangslogs nach einer Aktualisierung wiederholt `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` zeigen, erfassen Sie einen Abhängigkeitsbericht und Logs. Die gebündelte `@discordjs/voice`-Linie enthält den Upstream-Padding-Fix aus discord.js-PR #11449, der discord.js-Issue #11419 geschlossen hat.
- Empfangsereignisse `The operation was aborted` werden erwartet, wenn OpenClaw ein erfasstes Sprechersegment finalisiert; sie sind ausführliche Diagnosen, keine Warnungen.
- Ausführliche Discord-Sprachlogs enthalten eine begrenzte einzeilige STT-Transkriptvorschau für jedes akzeptierte Sprechersegment, sodass das Debugging sowohl die Benutzerseite als auch die Agentenantwortseite zeigt, ohne unbegrenzten Transkripttext auszugeben.
- Im `agent-proxy`-Modus überspringt der erzwungene Consult-Fallback wahrscheinlich unvollständige Transkriptfragmente, etwa Text, der auf `...` endet, oder einen nachgestellten Verbinder wie `and`, sowie offensichtlich nicht handlungsrelevante Abschlüsse wie „bin gleich zurück“ oder „tschüss“. Logs zeigen `forced agent consult skipped reason=...`, wenn dadurch eine veraltete eingereihte Antwort verhindert wird.

### Benutzern in Sprache folgen

Verwenden Sie `voice.followUsers`, wenn der Discord-Sprachbot bei einem oder mehreren bekannten Discord-Benutzern bleiben soll, statt beim Start einem festen Kanal beizutreten oder auf `/vc join` zu warten.

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        followUsersEnabled: true,
        followUsers: ["discord:123456789012345678"],
        allowedChannels: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
      },
    },
  },
}
```

Verhalten:

- `followUsers` akzeptiert rohe Discord-Benutzer-IDs und `discord:<id>`-Werte. OpenClaw normalisiert beide Formen, bevor Voice-State-Ereignisse abgeglichen werden.
- `followUsersEnabled` ist standardmäßig `true`, wenn `followUsers` konfiguriert ist. Setzen Sie es auf `false`, um die gespeicherte Liste zu behalten, aber das automatische Folgen in Sprachkanälen zu stoppen.
- Wenn ein verfolgter Benutzer einem erlaubten Sprachkanal beitritt, tritt OpenClaw diesem Kanal bei. Wenn der Benutzer wechselt, wechselt OpenClaw mit. Wenn der aktive verfolgte Benutzer die Verbindung trennt, verlässt OpenClaw den Kanal.
- Wenn mehrere verfolgte Benutzer in derselben Guild sind und der aktive verfolgte Benutzer geht, wechselt OpenClaw zum Kanal eines anderen erfassten verfolgten Benutzers, bevor es die Guild verlässt. Wenn mehrere verfolgte Benutzer gleichzeitig wechseln, gewinnt das zuletzt beobachtete Voice-State-Ereignis.
- `allowedChannels` gilt weiterhin. Ein verfolgter Benutzer in einem nicht erlaubten Kanal wird ignoriert, und eine Follow-eigene Sitzung wechselt zu einem anderen verfolgten Benutzer oder verlässt den Kanal.
- OpenClaw gleicht verpasste Voice-State-Ereignisse beim Start und in einem begrenzten Intervall ab. Der Abgleich beprobt konfigurierte Guilds und begrenzt REST-Lookups pro Lauf, sodass sehr große `followUsers`-Listen mehr als ein Intervall benötigen können, um zu konvergieren.
- Wenn Discord oder ein Admin den Bot verschiebt, während er einem Benutzer folgt, baut OpenClaw die Sprachsitzung neu auf und behält die Follow-Zugehörigkeit bei, wenn das Ziel erlaubt ist. Wenn der Bot außerhalb von `allowedChannels` verschoben wird, verlässt OpenClaw den Kanal und tritt dem konfigurierten Ziel wieder bei, wenn eines existiert.
- DAVE-Empfangswiederherstellung kann denselben Kanal nach wiederholten Entschlüsselungsfehlern verlassen und erneut betreten. Follow-eigene Sitzungen behalten ihre Follow-Zugehörigkeit über diesen Wiederherstellungspfad hinweg, sodass ein späteres Trennen des verfolgten Benutzers den Kanal weiterhin verlässt.

Wählen Sie zwischen den Beitrittsmodi:

- Verwenden Sie `followUsers` für persönliche oder Betreiber-Setups, bei denen der Bot automatisch im Sprachkanal sein soll, wenn Sie es sind.
- Verwenden Sie `autoJoin` für Bots in festen Räumen, die auch dann anwesend sein sollen, wenn kein erfasster Benutzer im Sprachkanal ist.
- Verwenden Sie `/vc join` für einmalige Beitritte oder Räume, in denen automatische Sprachanwesenheit überraschend wäre.

Discord-Sprachcodec:

- Sprach-Empfangsprotokolle zeigen `discord voice: opus decoder: libopus-wasm`.
- Die Echtzeitwiedergabe codiert rohes 48-kHz-Stereo-PCM mit demselben gebündelten Paket `libopus-wasm` zu Opus, bevor Pakete an `@discordjs/voice` übergeben werden.
- Datei- und Provider-Stream-Wiedergabe transcodiert mit ffmpeg zu rohem 48-kHz-Stereo-PCM und verwendet anschließend `libopus-wasm` für den an Discord gesendeten Opus-Paketstream.

STT-plus-TTS-Pipeline:

- Discord-PCM-Erfassung wird in eine temporäre WAV-Datei konvertiert.
- `tools.media.audio` übernimmt STT, zum Beispiel `openai/gpt-4o-mini-transcribe`.
- Das Transkript wird über Discord-Ingress und Routing gesendet, während das Antwort-LLM mit einer Sprachausgabe-Policy ausgeführt wird, die das Agent-Tool `tts` ausblendet und zurückgegebenen Text anfordert, weil Discord Voice die endgültige TTS-Wiedergabe besitzt.
- `voice.model` überschreibt, wenn festgelegt, nur das Antwort-LLM für diesen Sprachkanal-Turn.
- `voice.tts` wird über `messages.tts` zusammengeführt; streamingfähige Provider speisen den Player direkt, andernfalls wird die resultierende Audiodatei im beigetretenen Kanal abgespielt.

Beispiel für eine Standard-Agent-Proxy-Sprachkanalsitzung:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.5",
        followUsersEnabled: true,
        followUsers: ["123456789012345678"],
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

Ohne `voice.agentSession`-Block erhält jeder Sprachkanal seine eigene geroutete OpenClaw-Sitzung. Zum Beispiel spricht `/vc join channel:234567890123456789` mit der Sitzung für diesen Discord-Sprachkanal. Das Echtzeitmodell ist nur das Voice-Frontend; inhaltliche Anfragen werden an den konfigurierten OpenClaw-Agent übergeben. Wenn das Echtzeitmodell ein endgültiges Transkript erzeugt, ohne das Consult-Tool aufzurufen, erzwingt OpenClaw Consult als Fallback, sodass sich der Standard weiterhin wie ein Gespräch mit dem Agent verhält.

Legacy-STT-plus-TTS-Beispiel:

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
          providers: {
            openai: {
              model: "gpt-4o-mini-tts",
              speakerVoice: "cedar",
            },
          },
        },
      },
    },
  },
}
```

Echtzeit-Bidi-Beispiel:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
          toolPolicy: "safe-read-only",
          consultPolicy: "always",
        },
      },
    },
  },
}
```

Voice als Erweiterung einer vorhandenen Discord-Kanalsitzung:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "agent-proxy",
        model: "openai/gpt-5.5",
        agentSession: {
          mode: "target",
          target: "channel:123456789012345678",
        },
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

Im Modus `agent-proxy` tritt der Bot dem konfigurierten Sprachkanal bei, aber OpenClaw-Agent-Turns verwenden die normale geroutete Sitzung und den Agent des Zielkanals. Die Echtzeit-Voice-Sitzung spricht das zurückgegebene Ergebnis wieder in den Sprachkanal. Der Supervisor-Agent kann gemäß seiner Tool-Policy weiterhin normale Nachrichtentools verwenden, einschließlich des Sendens einer separaten Discord-Nachricht, wenn dies die richtige Aktion ist.

Während ein delegierter OpenClaw-Lauf aktiv ist, werden neue Discord-Voice-Transkripte als Live-Laufsteuerung behandelt, bevor ein weiterer Agent-Turn gestartet wird. Formulierungen wie „status“, „cancel that“, „use the smaller fix“ oder „when you're done also check tests“ werden als Status-, Abbruch-, Steuerungs- oder Follow-up-Eingabe für die aktive Sitzung klassifiziert. Status, Abbruch, akzeptierte Steuerung und Follow-up-Ergebnisse werden in den Sprachkanal zurückgesprochen, damit der Anrufer weiß, ob OpenClaw die Anfrage verarbeitet hat.

Nützliche Zielformen:

- `target: "channel:123456789012345678"` routet über eine Discord-Textkanalsitzung.
- `target: "123456789012345678"` wird als Kanalziel behandelt.
- `target: "dm:123456789012345678"` oder `target: "user:123456789012345678"` routet über diese Direktnachrichtensitzung.

Echo-lastiges OpenAI Realtime-Beispiel:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
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

Verwenden Sie dies, wenn das Modell seine eigene Discord-Wiedergabe über ein offenes Mikrofon hört, Sie es aber dennoch durch Sprechen unterbrechen möchten. OpenClaw verhindert, dass OpenAI bei rohem Eingabeaudio automatisch unterbricht, während `bargeIn: true` zulässt, dass Discord-Sprecherstart-Ereignisse und bereits aktives Sprecher-Audio aktive Echtzeitantworten abbrechen, bevor der nächste erfasste Turn OpenAI erreicht. Sehr frühe Barge-in-Signale mit `audioEndMs` unter `minBargeInAudioEndMs` werden als wahrscheinliches Echo/Rauschen behandelt und ignoriert, damit das Modell nicht beim ersten Wiedergabeframe abbricht.

Erwartete Voice-Protokolle:

- Beim Beitritt: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- Beim Echtzeitstart: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- Bei Sprecher-Audio: `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...` und `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- Bei übersprungener veralteter Sprache: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` oder `reason=non-actionable-closing ...`
- Beim Abschluss der Echtzeitantwort: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- Beim Wiedergabestopp/-Reset: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- Bei Echtzeit-Consult: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- Bei Agent-Antwort: `discord voice: agent turn answer ...`
- Bei eingereihter exakter Sprache: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`, gefolgt von `discord voice: realtime exact speech dequeued reason=player-idle ...`
- Bei Barge-in-Erkennung: `discord voice: realtime barge-in detected source=speaker-start ...` oder `discord voice: realtime barge-in detected source=active-speaker-audio ...`, gefolgt von `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- Bei Echtzeitunterbrechung: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`, gefolgt von entweder `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` oder `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- Bei ignoriertem Echo/Rauschen: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- Bei deaktiviertem Barge-in: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- Bei Leerlaufwiedergabe: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

Um abgeschnittenes Audio zu debuggen, lesen Sie die Echtzeit-Voice-Protokolle als Zeitleiste:

1. `realtime audio playback started` bedeutet, dass Discord mit der Wiedergabe von Assistenten-Audio begonnen hat. Die Bridge beginnt ab diesem Punkt, Assistenten-Ausgabe-Chunks, Discord-PCM-Bytes, Provider-Echtzeit-Bytes und synthetisierte Audiodauer zu zählen.
2. `realtime speaker turn opened` markiert, dass ein Discord-Sprecher aktiv wird. Wenn die Wiedergabe bereits aktiv ist und `bargeIn` aktiviert ist, kann darauf `barge-in detected source=speaker-start` folgen.
3. `realtime input audio started` markiert den ersten tatsächlichen Audioframe, der für diesen Sprecher-Turn empfangen wurde. `outputActive=true` oder ein `outputAudioMs` ungleich null bedeutet hier, dass das Mikrofon Eingabe sendet, während die Assistenten-Wiedergabe noch aktiv ist.
4. `barge-in detected source=active-speaker-audio` bedeutet, dass OpenClaw Live-Sprecher-Audio gesehen hat, während Assistenten-Wiedergabe aktiv war. Dies ist nützlich, um eine echte Unterbrechung von einem Discord-Sprecherstart-Ereignis ohne nützliches Audio zu unterscheiden.
5. `barge-in requested reason=...` bedeutet, dass OpenClaw den Echtzeit-Provider gebeten hat, die aktive Antwort abzubrechen oder zu kürzen. Es enthält `outputAudioMs`, `outputActive` und `playbackChunks`, damit Sie sehen können, wie viel Assistenten-Audio vor der Unterbrechung tatsächlich abgespielt wurde.
6. `realtime audio playback stopped reason=...` ist der lokale Discord-Wiedergabe-Resetpunkt. Der Grund sagt, wer die Wiedergabe gestoppt hat: `barge-in`, `player-idle`, `provider-clear-audio`, `forced-agent-consult`, `stream-close` oder `session-close`.
7. `realtime speaker turn closed` fasst den erfassten Eingabe-Turn zusammen. `chunks=0` oder `hasAudio=false` bedeutet, dass der Sprecher-Turn geöffnet wurde, aber kein nutzbares Audio die Echtzeit-Bridge erreicht hat. `interruptedPlayback=true` bedeutet, dass sich dieser Eingabe-Turn mit Assistentenausgabe überschnitten und Barge-in-Logik ausgelöst hat.

Nützliche Felder:

- `outputAudioMs`: Assistenten-Audiodauer, die der Echtzeit-Provider vor der Protokollzeile erzeugt hat.
- `audioMs`: Assistenten-Audiodauer, die OpenClaw gezählt hat, bevor die Wiedergabe gestoppt wurde.
- `elapsedMs`: Wanduhrzeit zwischen Öffnen und Schließen des Wiedergabestreams oder Sprecher-Turns.
- `discordBytes`: 48-kHz-Stereo-PCM-Bytes, die an Discord Voice gesendet oder von dort empfangen wurden.
- `realtimeBytes`: PCM-Bytes im Provider-Format, die an den Echtzeit-Provider gesendet oder von dort empfangen wurden.
- `playbackChunks`: Assistenten-Audio-Chunks, die für die aktive Antwort an Discord weitergeleitet wurden.
- `sinceLastAudioMs`: Abstand zwischen dem letzten erfassten Sprecher-Audioframe und dem Schließen des Sprecher-Turns.

Häufige Muster:

- Sofortiger Abbruch mit `source=active-speaker-audio`, kleinem `outputAudioMs` und demselben Benutzer in der Nähe deutet meist darauf hin, dass Lautsprecher-Echo ins Mikrofon gelangt. Erhöhen Sie `voice.realtime.minBargeInAudioEndMs`, verringern Sie die Lautsprecherlautstärke, verwenden Sie Kopfhörer oder setzen Sie `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`.
- `source=speaker-start` gefolgt von `speaker turn closed ... hasAudio=false` bedeutet, dass Discord einen Sprecherstart gemeldet hat, aber kein Audio OpenClaw erreicht hat. Das kann ein vorübergehendes Discord-Voice-Ereignis, Noise-Gate-Verhalten oder ein Client sein, der das Mikrofon kurz aktiviert.
- `audio playback stopped reason=stream-close` ohne nahes Barge-in oder `provider-clear-audio` bedeutet, dass der lokale Discord-Wiedergabestream unerwartet beendet wurde. Prüfen Sie die vorhergehenden Provider- und Discord-Player-Protokolle.
- `capture ignored during playback (barge-in disabled)` bedeutet, dass OpenClaw Eingabe absichtlich verworfen hat, während Assistenten-Audio aktiv war. Aktivieren Sie `voice.realtime.bargeIn`, wenn Sprache die Wiedergabe unterbrechen soll.
- `barge-in ignored ... outputActive=false` bedeutet, dass Discord- oder Provider-VAD Sprache gemeldet hat, OpenClaw aber keine aktive Wiedergabe zum Unterbrechen hatte. Dies sollte Audio nicht abschneiden.

Anmeldedaten werden pro Komponente aufgelöst: LLM-Routen-Authentifizierung für `voice.model`, STT-Authentifizierung für `tools.media.audio`, TTS-Authentifizierung für `messages.tts`/`voice.tts` und Echtzeit-Provider-Authentifizierung für `voice.realtime.providers` oder die normale Auth-Konfiguration des Providers.

### Sprachnachrichten

Discord-Sprachnachrichten zeigen eine Wellenformvorschau und erfordern OGG/Opus-Audio. OpenClaw erzeugt die Wellenform automatisch, benötigt aber `ffmpeg` und `ffprobe` auf dem Gateway-Host, um zu prüfen und zu konvertieren.

- Geben Sie einen **lokalen Dateipfad** an (URLs werden abgelehnt).
- Lassen Sie Textinhalte weg (Discord lehnt Text + Sprachnachricht in derselben Nutzlast ab).
- Jedes Audioformat wird akzeptiert; OpenClaw konvertiert bei Bedarf zu OGG/Opus.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Nicht zulässige Intents verwendet oder Bot sieht keine Guild-Nachrichten">

    - Message Content Intent aktivieren
    - Server Members Intent aktivieren, wenn Sie von Benutzer-/Mitgliederauflösung abhängen
    - Gateway nach Änderungen an Intents neu starten

  </Accordion>

  <Accordion title="Guild-Nachrichten unerwartet blockiert">

    - `groupPolicy` prüfen
    - Guild-Allowlist unter `channels.discord.guilds` prüfen
    - wenn eine Guild-`channels`-Map vorhanden ist, sind nur aufgelistete Kanäle erlaubt
    - `requireMention`-Verhalten und Mention-Muster prüfen

    Nützliche Prüfungen:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Mention nicht erforderlich, aber trotzdem blockiert">
    Häufige Ursachen:

    - `groupPolicy="allowlist"` ohne passende Guild-/Kanal-Allowlist
    - `requireMention` am falschen Ort konfiguriert (muss unter `channels.discord.guilds` oder dem Kanaleintrag stehen)
    - Absender durch Guild-/Kanal-`users`-Allowlist blockiert

  </Accordion>

  <Accordion title="Lang laufende Discord-Turns oder doppelte Antworten">

    Typische Logs:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Discord-Gateway-Warteschlangenoptionen:

    - Einzelkonto: `channels.discord.eventQueue.listenerTimeout`
    - Mehrere Konten: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - dies steuert nur Listener-Arbeit des Discord-Gateways, nicht die Lebensdauer eines Agent-Turns

    Discord wendet kein kanaleigenes Timeout auf eingereihte Agent-Turns an. Message-Listener übergeben sofort, und eingereihte Discord-Läufe behalten die Reihenfolge pro Sitzung bei, bis der Sitzungs-/Tool-/Runtime-Lebenszyklus die Arbeit abschließt oder abbricht.

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
    OpenClaw ruft Discord-`/gateway/bot`-Metadaten vor dem Verbinden ab. Vorübergehende Fehler fallen auf Discords Standard-Gateway-URL zurück und werden in Logs ratenbegrenzt.

    Metadaten-Timeout-Optionen:

    - Einzelkonto: `channels.discord.gatewayInfoTimeoutMs`
    - Mehrere Konten: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - Env-Fallback, wenn die Konfiguration nicht gesetzt ist: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - Standard: `30000` (30 Sekunden), Maximum: `120000`

  </Accordion>

  <Accordion title="Gateway-READY-Timeout-Neustarts">
    OpenClaw wartet während des Starts und nach Runtime-Reconnects auf Discords Gateway-`READY`-Ereignis. Setups mit mehreren Konten und gestaffeltem Start können ein längeres READY-Startfenster als den Standard benötigen.

    READY-Timeout-Optionen:

    - Start Einzelkonto: `channels.discord.gatewayReadyTimeoutMs`
    - Start mehrere Konten: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - Start-Env-Fallback, wenn die Konfiguration nicht gesetzt ist: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - Startstandard: `15000` (15 Sekunden), Maximum: `120000`
    - Runtime Einzelkonto: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - Runtime mehrere Konten: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - Runtime-Env-Fallback, wenn die Konfiguration nicht gesetzt ist: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - Runtime-Standard: `30000` (30 Sekunden), Maximum: `120000`

  </Accordion>

  <Accordion title="Abweichungen bei Berechtigungsprüfung">
    Berechtigungsprüfungen von `channels status --probe` funktionieren nur für numerische Kanal-IDs.

    Wenn Sie Slug-Schlüssel verwenden, kann Runtime-Abgleich weiterhin funktionieren, aber die Prüfung kann Berechtigungen nicht vollständig verifizieren.

  </Accordion>

  <Accordion title="DM- und Pairing-Probleme">

    - DM deaktiviert: `channels.discord.dm.enabled=false`
    - DM-Richtlinie deaktiviert: `channels.discord.dmPolicy="disabled"` (Legacy: `channels.discord.dm.policy`)
    - Pairing-Genehmigung im `pairing`-Modus ausstehend

  </Accordion>

  <Accordion title="Bot-zu-Bot-Schleifen">
    Standardmäßig werden von Bots verfasste Nachrichten ignoriert.

    Wenn Sie `channels.discord.allowBots=true` setzen, verwenden Sie strikte Mention- und Allowlist-Regeln, um Schleifenverhalten zu vermeiden.
    Bevorzugen Sie `channels.discord.allowBots="mentions"`, um nur Bot-Nachrichten zu akzeptieren, die den Bot erwähnen.

    OpenClaw liefert außerdem gemeinsamen [Bot-Schleifenschutz](/de/channels/bot-loop-protection) mit. Immer wenn `allowBots` von Bots verfasste Nachrichten bis zum Dispatch gelangen lässt, ordnet Discord das eingehende Ereignis `(account, channel, bot pair)`-Fakten zu, und der generische Paar-Wächter unterdrückt das Paar, nachdem es das konfigurierte Ereignisbudget überschreitet. Der Wächter verhindert ausufernde Zwei-Bot-Schleifen, die zuvor durch Discord-Ratenlimits gestoppt werden mussten; er betrifft keine Ein-Bot-Deployments oder einmaligen Bot-Antworten, die unter dem Budget bleiben.

    Standardeinstellungen (aktiv, wenn `allowBots` gesetzt ist):

    - `maxEventsPerWindow: 20` -- Bot-Paar kann innerhalb des gleitenden Fensters 20 Nachrichten austauschen
    - `windowSeconds: 60` -- Länge des gleitenden Fensters
    - `cooldownSeconds: 60` -- sobald das Budget ausgelöst wird, wird jede zusätzliche Bot-zu-Bot-Nachricht in beide Richtungen für eine Minute verworfen

    Konfigurieren Sie den gemeinsamen Standard einmal unter `channels.defaults.botLoopProtection` und überschreiben Sie dann Discord, wenn ein legitimer Workflow mehr Spielraum benötigt. Die Priorität ist:

    - `channels.discord.accounts.<account>.botLoopProtection`
    - `channels.discord.botLoopProtection`
    - `channels.defaults.botLoopProtection`
    - eingebaute Standards

    Discord verwendet die generischen Schlüssel `maxEventsPerWindow`, `windowSeconds` und `cooldownSeconds`.

```json5
{
  channels: {
    defaults: {
      botLoopProtection: {
        maxEventsPerWindow: 20,
        windowSeconds: 60,
        cooldownSeconds: 60,
      },
    },
    discord: {
      // Optional Discord-wide override. Account blocks override individual
      // fields and inherit omitted fields from here.
      botLoopProtection: {
        maxEventsPerWindow: 4,
      },
      accounts: {
        mantis: {
          // Mantis listens to other bots only when they mention her.
          allowBots: "mentions",
        },
        molty: {
          // Molty listens to all bot-authored Discord messages.
          allowBots: true,
          mentionAliases: {
            // Lets Molty write a Mantis Discord mention with the configured user id.
            Mantis: "MANTIS_DISCORD_USER_ID",
          },
          botLoopProtection: {
            // Allow up to five messages per minute before suppressing the pair.
            maxEventsPerWindow: 5,
            windowSeconds: 60,
            cooldownSeconds: 90,
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
    - beginnen Sie mit `channels.discord.voice.decryptionFailureTolerance=24` (Upstream-Standard) und passen Sie nur bei Bedarf an
    - beobachten Sie Logs auf:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - wenn Fehler nach automatischem Rejoin weiterhin auftreten, sammeln Sie Logs und vergleichen Sie sie mit der Upstream-DAVE-Empfangshistorie in [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) und [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

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
- Funktionen: `threadBindings`, oberste Ebene `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents.enabled`, `agentComponents.ttlMs`, `heartbeat`, `responsePrefix`

</Accordion>

## Sicherheit und Betrieb

- Behandeln Sie Bot-Token als Geheimnisse (`DISCORD_BOT_TOKEN` in überwachten Umgebungen bevorzugt).
- Gewähren Sie Discord-Berechtigungen nach dem Prinzip der geringsten Rechte.
- Wenn Befehls-Deployment/-Status veraltet ist, starten Sie das Gateway neu und prüfen Sie erneut mit `openclaw channels status --probe`.

## Verwandt

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/de/channels/pairing">
    Koppeln Sie einen Discord-Benutzer mit dem Gateway.
  </Card>
  <Card title="Gruppen" icon="users" href="/de/channels/groups">
    Gruppenchat- und Allowlist-Verhalten.
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
