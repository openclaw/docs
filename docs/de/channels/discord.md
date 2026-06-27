---
read_when:
    - Arbeiten an Discord-Kanalfunktionen
summary: Supportstatus, Funktionen und Konfiguration des Discord-Bots
title: Discord
x-i18n:
    generated_at: "2026-06-27T17:09:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 90ed02258347113ca5b1dfcc5169a48190e3b4e1273d27a8a5c45f0f930cdbbf
    source_path: channels/discord.md
    workflow: 16
---

Bereit für DMs und Gildenkanäle über den offiziellen Discord-Gateway.

<CardGroup cols={3}>
  <Card title="Kopplung" icon="link" href="/de/channels/pairing">
    Discord-DMs verwenden standardmäßig den Kopplungsmodus.
  </Card>
  <Card title="Slash-Befehle" icon="terminal" href="/de/tools/slash-commands">
    Native Befehlslogik und Befehlskatalog.
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
    Scrollen Sie weiterhin auf der Seite **Bot** nach unten zu **Privileged Gateway Intents** und aktivieren Sie:

    - **Message Content Intent** (erforderlich)
    - **Server Members Intent** (empfohlen; erforderlich für Rollen-Allowlists und die Zuordnung von Namen zu IDs)
    - **Presence Intent** (optional; nur für Präsenzaktualisierungen erforderlich)

  </Step>

  <Step title="Bot-Token kopieren">
    Scrollen Sie auf der Seite **Bot** wieder nach oben und klicken Sie auf **Reset Token**.

    <Note>
    Trotz des Namens erzeugt dies Ihr erstes Token — es wird nichts „zurückgesetzt“.
    </Note>

    Kopieren Sie das Token und speichern Sie es an einem sicheren Ort. Dies ist Ihr **Bot Token**, und Sie benötigen es gleich.

  </Step>

  <Step title="Einladungs-URL erzeugen und Bot zu Ihrem Server hinzufügen">
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

    Dies ist der Basissatz für normale Textkanäle. Wenn Sie in Discord-Threads posten möchten, einschließlich Workflows in Forum- oder Medienkanälen, die einen Thread erstellen oder fortsetzen, aktivieren Sie außerdem **Send Messages in Threads**.
    Kopieren Sie die erzeugte URL unten, fügen Sie sie in Ihren Browser ein, wählen Sie Ihren Server aus und klicken Sie auf **Continue**, um die Verbindung herzustellen. Sie sollten Ihren Bot jetzt auf dem Discord-Server sehen.

  </Step>

  <Step title="Entwicklermodus aktivieren und Ihre IDs erfassen">
    Zurück in der Discord-App müssen Sie den Entwicklermodus aktivieren, damit Sie interne IDs kopieren können.

    1. Klicken Sie auf **User Settings** (Zahnradsymbol neben Ihrem Avatar) → **Advanced** → aktivieren Sie **Developer Mode**
    2. Klicken Sie mit der rechten Maustaste auf Ihr **Serversymbol** in der Seitenleiste → **Copy Server ID**
    3. Klicken Sie mit der rechten Maustaste auf Ihren **eigenen Avatar** → **Copy User ID**

    Speichern Sie Ihre **Server ID** und **User ID** zusammen mit Ihrem Bot Token — Sie senden alle drei im nächsten Schritt an OpenClaw.

  </Step>

  <Step title="DMs von Servermitgliedern erlauben">
    Damit die Kopplung funktioniert, muss Discord Ihrem Bot erlauben, Ihnen eine DM zu senden. Klicken Sie mit der rechten Maustaste auf Ihr **Serversymbol** → **Privacy Settings** → aktivieren Sie **Direct Messages**.

    Dadurch können Servermitglieder (einschließlich Bots) Ihnen DMs senden. Lassen Sie dies aktiviert, wenn Sie Discord-DMs mit OpenClaw verwenden möchten. Wenn Sie nur Gildenkanäle verwenden möchten, können Sie DMs nach der Kopplung deaktivieren.

  </Step>

  <Step title="Bot-Token sicher setzen (nicht im Chat senden)">
    Ihr Discord-Bot-Token ist ein Geheimnis (wie ein Passwort). Setzen Sie es auf dem Rechner, auf dem OpenClaw ausgeführt wird, bevor Sie Ihrem Agenten schreiben.

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

    Wenn OpenClaw bereits als Hintergrunddienst läuft, starten Sie es über die OpenClaw-Mac-App neu oder stoppen und starten Sie den Prozess `openclaw gateway run`.
    Bei Installationen als verwalteter Dienst führen Sie `openclaw gateway install` aus einer Shell aus, in der `DISCORD_BOT_TOKEN` vorhanden ist, oder speichern Sie die Variable in `~/.openclaw/.env`, damit der Dienst den env SecretRef nach dem Neustart auflösen kann.
    Wenn Ihr Host durch Discords Start-Anwendungsabfrage blockiert oder rate-limitiert wird, setzen Sie die Discord-Anwendungs-/Client-ID aus dem Developer Portal, damit der Start diesen REST-Aufruf überspringen kann. Verwenden Sie `channels.discord.applicationId` für das Standardkonto oder `channels.discord.accounts.<accountId>.applicationId`, wenn Sie mehrere Discord-Bots ausführen.

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

        Für skriptgesteuerte oder Remote-Einrichtung schreiben Sie denselben JSON5-Block mit `openclaw config patch --file ./discord.patch.json5 --dry-run` und führen ihn dann erneut ohne `--dry-run` aus. Klartextwerte für `token` werden unterstützt. SecretRef-Werte werden ebenfalls für `channels.discord.token` über Env-/Datei-/Exec-Provider unterstützt. Siehe [Geheimnisverwaltung](/de/gateway/secrets).

        Bewahren Sie bei mehreren Discord-Bots jedes Bot-Token und jede Anwendungs-ID unter dem jeweiligen Konto auf. Ein `channels.discord.applicationId` auf oberster Ebene wird von Konten geerbt; setzen Sie es dort also nur, wenn jedes Konto dieselbe Anwendungs-ID verwenden soll.

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
    Warten Sie, bis der Gateway läuft, und senden Sie Ihrem Bot dann eine DM in Discord. Er antwortet mit einem Kopplungscode.

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
Die Token-Auflösung ist kontobewusst. Token-Werte aus der Konfiguration haben Vorrang vor dem Env-Fallback. `DISCORD_BOT_TOKEN` wird nur für das Standardkonto verwendet.
Wenn zwei aktivierte Discord-Konten zum selben Bot-Token auflösen, startet OpenClaw nur einen Gateway-Monitor für dieses Token. Ein aus der Konfiguration stammendes Token hat Vorrang vor dem Standard-Env-Fallback; andernfalls gewinnt das erste aktivierte Konto, und das doppelte Konto wird als deaktiviert gemeldet.
Für erweiterte ausgehende Aufrufe (Nachrichten-Tool/Kanalaktionen) wird ein explizites pro Aufruf angegebenes `token` für diesen Aufruf verwendet. Dies gilt für Sende- und Lese-/Probe-artige Aktionen (z. B. read/search/fetch/thread/pins/permissions). Kontorichtlinien und Wiederholungseinstellungen stammen weiterhin aus dem ausgewählten Konto im aktiven Runtime-Snapshot.
</Note>

## Empfohlen: Gilden-Arbeitsbereich einrichten

Sobald DMs funktionieren, können Sie Ihren Discord-Server als vollständigen Arbeitsbereich einrichten, in dem jeder Kanal eine eigene Agentensitzung mit eigenem Kontext erhält. Dies wird für private Server empfohlen, auf denen nur Sie und Ihr Bot sind.

<Steps>
  <Step title="Ihren Server zur Gilden-Allowlist hinzufügen">
    Dadurch kann Ihr Agent in jedem Kanal auf Ihrem Server antworten, nicht nur in DMs.

    <Tabs>
      <Tab title="Ihren Agenten fragen">
        > „Fügen Sie meine Discord Server ID `<server_id>` zur Gilden-Allowlist hinzu“
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
    Standardmäßig antwortet Ihr Agent in Gildenkanälen nur, wenn er per @ erwähnt wird. Für einen privaten Server möchten Sie wahrscheinlich, dass er auf jede Nachricht antwortet.

    In Gildenkanälen werden normale Antworten standardmäßig automatisch gepostet. Aktivieren Sie für gemeinsam genutzte, dauerhaft aktive Räume `messages.groupChat.visibleReplies: "message_tool"`, damit der Agent mitlesen und nur posten kann, wenn er entscheidet, dass eine Kanalantwort nützlich ist. Dies funktioniert am besten mit Modellen der neuesten Generation und zuverlässiger Tool-Nutzung, etwa GPT 5.5. Umgebungsereignisse im Raum bleiben still, sofern das Tool nichts sendet. Die vollständige Konfiguration für den Mitlesemodus finden Sie unter [Umgebungsereignisse in Räumen](/de/channels/ambient-room-events).

    Wenn Discord Tippen anzeigt und die Logs Token-Nutzung zeigen, aber keine Nachricht gepostet wird, prüfen Sie, ob der Turn als Umgebungsereignis im Raum konfiguriert war oder sichtbare Antworten über das Nachrichten-Tool aktiviert wurden.

    <Tabs>
      <Tab title="Ihren Agenten fragen">
        > „Erlauben Sie meinem Agenten, auf diesem Server zu antworten, ohne per @ erwähnt werden zu müssen“
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

        Um sichtbare Gruppen-/Kanalantworten über Nachrichten-Tool-Sends zu erzwingen, setzen Sie `messages.groupChat.visibleReplies: "message_tool"`.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Speicher für Gildenkanäle planen">
    Standardmäßig wird der Langzeitspeicher (MEMORY.md) nur in DM-Sitzungen geladen. Gildenkanäle laden MEMORY.md nicht automatisch.

    <Tabs>
      <Tab title="Ihren Agenten fragen">
        > „Wenn ich Fragen in Discord-Kanälen stelle, verwenden Sie memory_search oder memory_get, wenn Sie Langzeitkontext aus MEMORY.md benötigen.“
      </Tab>
      <Tab title="Manuell">
        Wenn Sie gemeinsamen Kontext in jedem Kanal benötigen, legen Sie die stabilen Anweisungen in `AGENTS.md` oder `USER.md` ab (sie werden in jede Sitzung injiziert). Bewahren Sie Langzeitnotizen in `MEMORY.md` auf und greifen Sie bei Bedarf mit Memory-Tools darauf zu.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Erstellen Sie nun einige Kanäle auf Ihrem Discord-Server und beginnen Sie zu chatten. Ihr Agent kann den Kanalnamen sehen, und jeder Kanal erhält seine eigene isolierte Sitzung — so können Sie `#coding`, `#home`, `#research` oder etwas einrichten, das zu Ihrem Workflow passt.

## Runtime-Modell

- Gateway besitzt die Discord-Verbindung.
- Das Reply-Routing ist deterministisch: Eingehende Discord-Antworten gehen zurück an Discord.
- Discord-Guild-/Kanal-Metadaten werden dem Modell-Prompt als nicht vertrauenswürdiger
  Kontext hinzugefügt, nicht als für Benutzer sichtbares Antwortpräfix. Wenn ein Modell diesen Umschlag
  zurückkopiert, entfernt OpenClaw die kopierten Metadaten aus ausgehenden Antworten und aus
  künftigem Replay-Kontext.
- Standardmäßig (`session.dmScope=main`) teilen Direktchats die Hauptsession des Agenten (`agent:main:main`).
- Guild-Kanäle sind isolierte Session-Schlüssel (`agent:<agentId>:discord:channel:<channelId>`).
- Gruppen-DMs werden standardmäßig ignoriert (`channels.discord.dm.groupEnabled=false`).
- Native Slash-Commands laufen in isolierten Befehls-Sessions (`agent:<agentId>:discord:slash:<userId>`), tragen dabei aber weiterhin `CommandTargetSessionKey` zur gerouteten Unterhaltungssession.
- Reine Text-Cron-/Heartbeat-Ankündigungen an Discord verwenden die endgültige,
  für den Assistenten sichtbare Antwort einmal. Medien- und strukturierte Komponenten-Payloads bleiben
  mehrteilig, wenn der Agent mehrere zustellbare Payloads ausgibt.

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

OpenClaw unterstützt Discord-Komponenten-v2-Container für Agenten-Nachrichten. Verwenden Sie das Message-Tool mit einem `components`-Payload. Interaktionsergebnisse werden als normale eingehende Nachrichten zurück an den Agenten geroutet und folgen den bestehenden Discord-`replyToMode`-Einstellungen.

Unterstützte Blöcke:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Aktionszeilen erlauben bis zu 5 Buttons oder ein einzelnes Auswahlmenü
- Auswahltypen: `string`, `user`, `role`, `mentionable`, `channel`

Standardmäßig sind Komponenten einmalig verwendbar. Setzen Sie `components.reusable=true`, damit Buttons, Auswahlen und Formulare bis zum Ablauf mehrfach verwendet werden können.

Um einzuschränken, wer einen Button anklicken kann, setzen Sie `allowedUsers` auf diesem Button (Discord-Benutzer-IDs, Tags oder `*`). Wenn konfiguriert, erhalten nicht übereinstimmende Benutzer eine ephemere Ablehnung.

Komponenten-Callbacks laufen standardmäßig nach 30 Minuten ab. Setzen Sie `channels.discord.agentComponents.ttlMs`, um diese Lebensdauer der Callback-Registry für das Standard-Discord-Konto zu ändern, oder `channels.discord.accounts.<accountId>.agentComponents.ttlMs`, um ein Konto in einem Multi-Account-Setup zu überschreiben. Der Wert ist in Millisekunden, muss eine positive Ganzzahl sein und ist auf `86400000` (24 Stunden) begrenzt. Längere TTLs sind nützlich für Review- oder Genehmigungs-Workflows, bei denen Buttons verwendbar bleiben müssen, verlängern aber auch das Zeitfenster, in dem eine alte Discord-Nachricht noch eine Aktion auslösen kann. Bevorzugen Sie die kürzeste TTL, die zum Workflow passt, und behalten Sie den Standard bei, wenn veraltete Callbacks überraschend wären.

Die Slash-Commands `/model` und `/models` öffnen eine interaktive Modellauswahl mit Provider-, Modell- und kompatiblen Runtime-Dropdowns plus einem Absenden-Schritt. `/models add` ist veraltet und gibt jetzt eine Deprecation-Meldung zurück, statt Modelle aus dem Chat zu registrieren. Die Picker-Antwort ist ephemer, und nur der aufrufende Benutzer kann sie verwenden. Discord-Auswahlmenüs sind auf 25 Optionen begrenzt. Fügen Sie daher `provider/*`-Einträge zu `agents.defaults.models` hinzu, wenn der Picker dynamisch entdeckte Modelle nur für ausgewählte Provider wie `openai` oder `vllm` anzeigen soll.

Dateianhänge:

- `file`-Blöcke müssen auf eine Anhangsreferenz zeigen (`attachment://<filename>`)
- Stellen Sie den Anhang über `media`/`path`/`filePath` bereit (einzelne Datei); verwenden Sie `media-gallery` für mehrere Dateien
- Verwenden Sie `filename`, um den Upload-Namen zu überschreiben, wenn er zur Anhangsreferenz passen soll

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
  <Tab title="DM policy">
    `channels.discord.dmPolicy` steuert den DM-Zugriff. `channels.discord.allowFrom` ist die kanonische DM-Allowlist.

    - `pairing` (Standard)
    - `allowlist`
    - `open` (erfordert, dass `channels.discord.allowFrom` `"*"` enthält)
    - `disabled`

    Wenn die DM-Policy nicht offen ist, werden unbekannte Benutzer blockiert (oder im Modus `pairing` zum Pairing aufgefordert).

    Multi-Account-Priorität:

    - `channels.discord.accounts.default.allowFrom` gilt nur für das Konto `default`.
    - Für ein Konto hat `allowFrom` Vorrang vor dem Legacy-`dm.allowFrom`.
    - Benannte Konten erben `channels.discord.allowFrom`, wenn ihr eigenes `allowFrom` und das Legacy-`dm.allowFrom` nicht gesetzt sind.
    - Benannte Konten erben `channels.discord.accounts.default.allowFrom` nicht.

    Legacy-`channels.discord.dm.policy` und `channels.discord.dm.allowFrom` werden aus Kompatibilitätsgründen weiterhin gelesen. `openclaw doctor --fix` migriert sie zu `dmPolicy` und `allowFrom`, wenn dies ohne Änderung des Zugriffs möglich ist.

    DM-Zielformat für Zustellung:

    - `user:<id>`
    - `<@id>`-Erwähnung

    Reine numerische IDs werden normalerweise als Kanal-IDs aufgelöst, wenn ein Kanalstandard aktiv ist, aber IDs, die in der effektiven DM-`allowFrom` des Kontos aufgeführt sind, werden aus Kompatibilitätsgründen als Benutzer-DM-Ziele behandelt.

  </Tab>

  <Tab title="Access groups">
    Discord-DMs und Textbefehls-Autorisierung können dynamische `accessGroup:<name>`-Einträge in `channels.discord.allowFrom` verwenden.

    Zugriffgruppen-Namen werden kanalübergreifend für Nachrichten geteilt. Verwenden Sie `type: "message.senders"` für eine statische Gruppe, deren Mitglieder in der normalen `allowFrom`-Syntax des jeweiligen Kanals ausgedrückt werden, oder `type: "discord.channelAudience"`, wenn die aktuelle `ViewChannel`-Zielgruppe eines Discord-Kanals die Mitgliedschaft dynamisch definieren soll. Gemeinsames Zugriffgruppen-Verhalten ist hier dokumentiert: [Zugriffsgruppen](/de/channels/access-groups).

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

    Ein Discord-Textkanal hat keine separate Mitgliederliste. `type: "discord.channelAudience"` modelliert Mitgliedschaft so: Der DM-Absender ist Mitglied der konfigurierten Guild und hat aktuell effektive `ViewChannel`-Berechtigung auf dem konfigurierten Kanal, nachdem Rollen- und Kanal-Überschreibungen angewendet wurden.

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

    Aktivieren Sie im Discord Developer Portal den **Server Members Intent** für den Bot, wenn Sie channel-audience-Zugriffsgruppen verwenden. DMs enthalten keinen Guild-Mitgliedsstatus, daher löst OpenClaw das Mitglied zum Autorisierungszeitpunkt über Discord REST auf.

  </Tab>

  <Tab title="Guild policy">
    Guild-Behandlung wird durch `channels.discord.groupPolicy` gesteuert:

    - `open`
    - `allowlist`
    - `disabled`

    Die sichere Baseline, wenn `channels.discord` existiert, ist `allowlist`.

    `allowlist`-Verhalten:

    - Guild muss mit `channels.discord.guilds` übereinstimmen (`id` bevorzugt, Slug akzeptiert)
    - optionale Absender-Allowlists: `users` (stabile IDs empfohlen) und `roles` (nur Rollen-IDs); wenn eine der beiden konfiguriert ist, sind Absender erlaubt, wenn sie mit `users` ODER `roles` übereinstimmen
    - direkte Namens-/Tag-Übereinstimmung ist standardmäßig deaktiviert; aktivieren Sie `channels.discord.dangerouslyAllowNameMatching: true` nur als Break-Glass-Kompatibilitätsmodus
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

    Wenn Sie nur `DISCORD_BOT_TOKEN` setzen und keinen `channels.discord`-Block erstellen, ist der Runtime-Fallback `groupPolicy="allowlist"` (mit einer Warnung in Logs), auch wenn `channels.defaults.groupPolicy` `open` ist.

  </Tab>

  <Tab title="Mentions and group DMs">
    Guild-Nachrichten sind standardmäßig erwähnungsgesteuert.

    Erwähnungserkennung umfasst:

    - explizite Bot-Erwähnung
    - konfigurierte Erwähnungsmuster (`agents.list[].groupChat.mentionPatterns`, Fallback `messages.groupChat.mentionPatterns`)
    - implizites Antwort-an-Bot-Verhalten in unterstützten Fällen

    Wenn Sie ausgehende Discord-Nachrichten schreiben, verwenden Sie die kanonische Erwähnungssyntax: `<@USER_ID>` für Benutzer, `<#CHANNEL_ID>` für Kanäle und `<@&ROLE_ID>` für Rollen. Verwenden Sie nicht die Legacy-Nickname-Erwähnungsform `<@!USER_ID>`.

    `requireMention` wird pro Guild/Kanal konfiguriert (`channels.discord.guilds...`).
    `ignoreOtherMentions` verwirft optional Nachrichten, die einen anderen Benutzer/eine andere Rolle erwähnen, aber nicht den Bot (ausgenommen @everyone/@here).

    Gruppen-DMs:

    - Standard: ignoriert (`dm.groupEnabled=false`)
    - optionale Allowlist über `dm.groupChannels` (Kanal-IDs oder Slugs)

  </Tab>
</Tabs>

### Rollenbasiertes Agenten-Routing

Verwenden Sie `bindings[].match.roles`, um Discord-Guild-Mitglieder anhand der Rollen-ID an verschiedene Agenten weiterzuleiten. Rollenbasierte Bindings akzeptieren nur Rollen-IDs und werden nach Peer- oder Parent-Peer-Bindings und vor Guild-only-Bindings ausgewertet. Wenn ein Binding außerdem andere Match-Felder setzt (zum Beispiel `peer` + `guildId` + `roles`), müssen alle konfigurierten Felder übereinstimmen.

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
- `commands.native=false` überspringt beim Start die Registrierung und Bereinigung von Discord-Slash-Befehlen. Zuvor registrierte Befehle können in Discord sichtbar bleiben, bis Sie sie aus der Discord-App entfernen.
- Native Befehlsauthentifizierung verwendet dieselben Discord-Allowlists/-Richtlinien wie die normale Nachrichtenverarbeitung.
- Befehle können in der Discord-Oberfläche weiterhin für Benutzer sichtbar sein, die nicht autorisiert sind; die Ausführung erzwingt dennoch die OpenClaw-Authentifizierung und gibt „nicht autorisiert“ zurück.

Siehe [Slash-Befehle](/de/tools/slash-commands) für Befehlskatalog und Verhalten.

Standardeinstellungen für Slash-Befehle:

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
    `first` hängt die implizite native Antwortreferenz immer an die erste ausgehende Discord-Nachricht des Turns an.
    `batched` hängt Discords implizite native Antwortreferenz nur an, wenn das
    eingehende Ereignis ein entprellter Stapel aus mehreren Nachrichten war. Das ist nützlich,
    wenn Sie native Antworten vor allem für mehrdeutige, stoßweise Chats verwenden möchten, nicht für jeden
    einzelnen Nachrichten-Turn.

    Nachrichten-IDs werden in Kontext/Verlauf bereitgestellt, damit Agenten gezielt bestimmte Nachrichten adressieren können.

  </Accordion>

  <Accordion title="Link-Vorschauen">
    Discord erzeugt standardmäßig Rich-Link-Embeds für URLs. OpenClaw unterdrückt diese erzeugten Embeds standardmäßig bei ausgehenden Discord-Nachrichten, sodass von Agenten gesendete URLs als einfache Links bleiben, sofern Sie sich nicht explizit dafür entscheiden:

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    Setzen Sie `channels.discord.accounts.<id>.suppressEmbeds`, um ein Konto zu überschreiben. Sendungen über das Nachrichten-Tool des Agenten können für eine einzelne Nachricht ebenfalls `suppressEmbeds: false` übergeben. Explizite Discord-`embeds`-Payloads werden durch die Standardeinstellung für Link-Vorschauen nicht unterdrückt.

  </Accordion>

  <Accordion title="Live-Stream-Vorschau">
    OpenClaw kann Antwortentwürfe streamen, indem es eine temporäre Nachricht sendet und sie bearbeitet, während Text eintrifft. `channels.discord.streaming` akzeptiert `off` | `partial` | `block` | `progress` (Standard). `progress` hält einen bearbeitbaren Statusentwurf vor und aktualisiert ihn mit Tool-Fortschritt bis zur finalen Zustellung; das gemeinsame Startlabel ist eine fortlaufende Zeile, sodass es wie der Rest nach oben verschwindet, sobald genug Arbeit erscheint. `streamMode` ist ein veralteter Runtime-Alias. Führen Sie `openclaw doctor --fix` aus, um persistierte Konfiguration auf den kanonischen Schlüssel umzuschreiben.

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
          maxLineChars: 120,
          toolProgress: true,
          commentary: false,
        },
      },
    },
  },
}
```

    - `partial` bearbeitet eine einzelne Vorschaunachricht, während Tokens eintreffen.
    - `block` gibt Entwurfs-Chunks aus (verwenden Sie `draftChunk`, um Größe und Umbruchpunkte abzustimmen, begrenzt auf `textChunkLimit`).
    - Medien, Fehler und finale Antworten mit expliziter Antwortreferenz brechen ausstehende Vorschauänderungen ab.
    - `streaming.preview.toolProgress` (Standard `true`) steuert, ob Tool-/Fortschrittsupdates die Vorschaunachricht wiederverwenden.
    - Tool-/Fortschrittszeilen werden, sofern verfügbar, als kompaktes Emoji + Titel + Detail gerendert, zum Beispiel `🛠️ Bash: run tests` oder `🔎 Web Search: for "query"`.
    - `streaming.progress.commentary` (Standard `false`) aktiviert Assistant-Kommentar-/Präambeltext im temporären Fortschrittsentwurf. Kommentare werden vor der Anzeige bereinigt, bleiben flüchtig und ändern die Zustellung der finalen Antwort nicht.
    - `streaming.progress.maxLineChars` steuert das Budget der Fortschrittsvorschau pro Zeile. Fließtext wird an Wortgrenzen gekürzt; Befehls- und Pfaddetails behalten nützliche Suffixe.
    - `streaming.preview.commandText` / `streaming.progress.commandText` steuert Befehls-/Ausführungsdetails in kompakten Fortschrittszeilen: `raw` (Standard) oder `status` (nur Tool-Label).

    Rohtext von Befehlen/Ausführungen ausblenden und kompakte Fortschrittszeilen beibehalten:

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

    DM-Verlaufssteuerung:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Thread-Verhalten:

    - Discord-Threads werden als Kanalsitzungen geroutet und erben die Konfiguration des übergeordneten Kanals, sofern sie nicht überschrieben wird.
    - Thread-Sitzungen erben die `/model`-Auswahl auf Sitzungsebene des übergeordneten Kanals als reinen Modell-Fallback; thread-lokale `/model`-Auswahlen haben weiterhin Vorrang, und der übergeordnete Transkriptverlauf wird nur kopiert, wenn Transkriptvererbung aktiviert ist.
    - `channels.discord.thread.inheritParent` (Standard `false`) aktiviert für neue Auto-Threads das Seeding aus dem übergeordneten Transkript. Kontobezogene Überschreibungen liegen unter `channels.discord.accounts.<id>.thread.inheritParent`.
    - Reaktionen des Nachrichten-Tools können `user:<id>`-DM-Ziele auflösen.
    - `guilds.<guild>.channels.<channel>.requireMention: false` bleibt während des Aktivierungs-Fallbacks in der Antwortphase erhalten.

    Kanalthemen werden als **nicht vertrauenswürdiger** Kontext injiziert. Allowlists steuern, wer den Agenten auslösen kann, bilden aber keine vollständige Redaktionsgrenze für ergänzenden Kontext.

  </Accordion>

  <Accordion title="Thread-gebundene Sitzungen für Subagenten">
    Discord kann einen Thread an ein Sitzungsziel binden, sodass Folgenachrichten in diesem Thread weiterhin zur selben Sitzung geroutet werden (einschließlich Subagentensitzungen).

    Befehle:

    - `/focus <target>` aktuellen/neuen Thread an ein Subagenten-/Sitzungsziel binden
    - `/unfocus` aktuelle Thread-Bindung entfernen
    - `/agents` aktive Runs und Bindungsstatus anzeigen
    - `/session idle <duration|off>` Inaktivitäts-Auto-Unfocus für fokussierte Bindings prüfen/aktualisieren
    - `/session max-age <duration|off>` harte maximale Dauer für fokussierte Bindings prüfen/aktualisieren

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

    - `session.threadBindings.*` setzt globale Standardwerte.
    - `channels.discord.threadBindings.*` überschreibt Discord-Verhalten.
    - `spawnSessions` steuert das automatische Erstellen/Binden von Threads für `sessions_spawn({ thread: true })` und ACP-Thread-Spawns. Standard: `true`.
    - `defaultSpawnContext` steuert nativen Subagentenkontext für Thread-gebundene Spawns. Standard: `"fork"`.
    - Veraltete Schlüssel `spawnSubagentSessions`/`spawnAcpSessions` werden durch `openclaw doctor --fix` migriert.
    - Wenn Thread-Bindings für ein Konto deaktiviert sind, sind `/focus` und zugehörige Thread-Binding-Operationen nicht verfügbar.

    Siehe [Subagenten](/de/tools/subagents), [ACP-Agenten](/de/tools/acp-agents) und [Konfigurationsreferenz](/de/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Persistente ACP-Kanal-Bindings">
    Für stabile „always-on“-ACP-Arbeitsbereiche konfigurieren Sie typisierte ACP-Bindings auf oberster Ebene, die auf Discord-Konversationen zielen.

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

    - `/acp spawn codex --bind here` bindet den aktuellen Kanal oder Thread direkt und hält zukünftige Nachrichten auf derselben ACP-Sitzung. Thread-Nachrichten erben das Binding des übergeordneten Kanals.
    - In einem gebundenen Kanal oder Thread setzen `/new` und `/reset` dieselbe ACP-Sitzung direkt zurück. Temporäre Thread-Bindings können die Zielauflösung überschreiben, solange sie aktiv sind.
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
    - Fallback auf Emoji der Agentenidentität (`agents.list[].identity.emoji`, sonst „👀“)

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
    Leiten Sie Discord-Gateway-WebSocket-Traffic und REST-Startabfragen (Anwendungs-ID + Allowlist-Auflösung) über einen HTTP(S)-Proxy mit `channels.discord.proxy`.

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    Kontobezogene Überschreibung:

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
    Aktivieren Sie PluralKit-Auflösung, um proxied Nachrichten einer Systemmitgliedsidentität zuzuordnen:

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

    - Allowlisten können `pk:<memberId>` verwenden
    - Anzeigenamen von Mitgliedern werden nur nach Name/Slug abgeglichen, wenn `channels.discord.dangerouslyAllowNameMatching: true`
    - Abfragen verwenden die ursprüngliche Nachrichten-ID und sind zeitfensterbeschränkt
    - wenn die Abfrage fehlschlägt, werden proxied Nachrichten als Bot-Nachrichten behandelt und verworfen, sofern `allowBots=true` nicht gesetzt ist

  </Accordion>

  <Accordion title="Ausgehende Erwähnungsaliase">
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

  <Accordion title="Präsenzkonfiguration">
    Präsenzaktualisierungen werden angewendet, wenn Sie ein Status- oder Aktivitätsfeld festlegen oder Auto-Präsenz aktivieren.

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

    - 0: Spielt
    - 1: Streaming (erfordert `activityUrl`)
    - 2: Hört zu
    - 3: Sieht zu
    - 4: Benutzerdefiniert (verwendet den Aktivitätstext als Statuszustand; Emoji ist optional)
    - 5: Nimmt teil

    Auto-Präsenz-Beispiel (Laufzeit-Integritätssignal):

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

    Auto-Präsenz ordnet Laufzeitverfügbarkeit dem Discord-Status zu: healthy => online, degraded oder unknown => idle, exhausted oder unavailable => dnd. Optionale Textüberschreibungen:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (unterstützt den Platzhalter `{reason}`)

  </Accordion>

  <Accordion title="Genehmigungen in Discord">
    Discord unterstützt schaltflächenbasierte Genehmigungsverarbeitung in DMs und kann Genehmigungsaufforderungen optional im ursprünglichen Kanal posten.

    Konfigurationspfad:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (optional; fällt nach Möglichkeit auf `commands.ownerAllowFrom` zurück)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, Standard: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord aktiviert native exec-Genehmigungen automatisch, wenn `enabled` nicht gesetzt oder `"auto"` ist und mindestens ein Genehmigender aufgelöst werden kann, entweder aus `execApprovals.approvers` oder aus `commands.ownerAllowFrom`. Discord leitet exec-Genehmigende nicht aus Kanal-`allowFrom`, veraltetem `dm.allowFrom` oder Direct-Message-`defaultTo` ab. Setzen Sie `enabled: false`, um Discord ausdrücklich als nativen Genehmigungsclient zu deaktivieren.

    Für sensible, nur Ownern vorbehaltene Gruppenbefehle wie `/diagnostics` und `/export-trajectory` sendet OpenClaw Genehmigungsaufforderungen und Endergebnisse privat. Es versucht zuerst Discord-DM, wenn der aufrufende Owner eine Discord-Owner-Route hat; wenn diese nicht verfügbar ist, fällt es auf die erste verfügbare Owner-Route aus `commands.ownerAllowFrom`, etwa Telegram, zurück.

    Wenn `target` `channel` oder `both` ist, ist die Genehmigungsaufforderung im Kanal sichtbar. Nur aufgelöste Genehmigende können die Schaltflächen verwenden; andere Benutzer erhalten eine flüchtige Ablehnung. Genehmigungsaufforderungen enthalten den Befehlstext, aktivieren Sie die Kanalzustellung daher nur in vertrauenswürdigen Kanälen. Wenn die Kanal-ID nicht aus dem Sitzungsschlüssel abgeleitet werden kann, fällt OpenClaw auf DM-Zustellung zurück.

    Discord rendert außerdem die gemeinsam genutzten Genehmigungsschaltflächen, die von anderen Chat-Kanälen verwendet werden. Der native Discord-Adapter ergänzt hauptsächlich das DM-Routing für Genehmigende und Kanal-Fanout.
    Wenn diese Schaltflächen vorhanden sind, sind sie die primäre Genehmigungs-UX; OpenClaw
    sollte nur dann einen manuellen `/approve`-Befehl einfügen, wenn das Tool-Ergebnis besagt,
    dass Chat-Genehmigungen nicht verfügbar sind oder manuelle Genehmigung der einzige Weg ist.
    Wenn die native Discord-Genehmigungslaufzeit nicht aktiv ist, hält OpenClaw die
    lokale deterministische Aufforderung `/approve <id> <decision>` sichtbar. Wenn die
    Laufzeit aktiv ist, aber keine native Karte an ein Ziel zugestellt werden kann,
    sendet OpenClaw eine Fallback-Benachrichtigung im selben Chat mit dem exakten `/approve`-
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

Standard-Gate-Verhalten:

| Aktionsgruppe                                                                                                                                                            | Standard |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | aktiviert |
| roles                                                                                                                                                                    | deaktiviert |
| moderation                                                                                                                                                               | deaktiviert |
| presence                                                                                                                                                                 | deaktiviert |

## Components-v2-UI

OpenClaw verwendet Discord Components v2 für exec-Genehmigungen und kontextübergreifende Marker. Discord-Nachrichtenaktionen können auch `components` für benutzerdefinierte UI akzeptieren (fortgeschritten; erfordert das Erstellen einer Komponenten-Payload über das discord-Tool), während ältere `embeds` weiterhin verfügbar sind, aber nicht empfohlen werden.

- `channels.discord.ui.components.accentColor` legt die von Discord-Komponentencontainern verwendete Akzentfarbe fest (Hex).
- Legen Sie sie pro Konto mit `channels.discord.accounts.<id>.ui.components.accentColor` fest.
- `channels.discord.agentComponents.ttlMs` steuert, wie lange gesendete Discord-Komponenten-Callbacks registriert bleiben (Standard `1800000`, Maximum `86400000`). Legen Sie dies pro Konto mit `channels.discord.accounts.<id>.agentComponents.ttlMs` fest.
- `embeds` werden ignoriert, wenn Components v2 vorhanden sind.
- Einfache URL-Vorschauen werden standardmäßig unterdrückt. Setzen Sie `suppressEmbeds: false` für eine Nachrichtenaktion, wenn ein einzelner ausgehender Link aufgeklappt werden soll.

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

Discord hat zwei unterschiedliche Voice-Oberflächen: Echtzeit-**Voice-Kanäle** (kontinuierliche Gespräche) und **Voice-Nachrichtenanhänge** (das Wellenform-Vorschauformat). Das Gateway unterstützt beides.

### Voice-Kanäle

Einrichtungs-Checkliste:

1. Aktivieren Sie Message Content Intent im Discord Developer Portal.
2. Aktivieren Sie Server Members Intent, wenn Rollen-/Benutzer-Allowlisten verwendet werden.
3. Laden Sie den Bot mit den Scopes `bot` und `applications.commands` ein.
4. Gewähren Sie Connect, Speak, Send Messages und Read Message History im Ziel-Voice-Kanal.
5. Aktivieren Sie native Befehle (`commands.native` oder `channels.discord.commands.native`).
6. Konfigurieren Sie `channels.discord.voice`.

Verwenden Sie `/vc join|leave|status`, um Sitzungen zu steuern. Der Befehl verwendet den Standardagenten des Kontos und folgt denselben Allowlist- und Gruppenrichtlinienregeln wie andere Discord-Befehle.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

Um die effektiven Berechtigungen des Bots vor dem Beitreten zu prüfen, führen Sie Folgendes aus:

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
- `voice.mode` steuert den Konversationspfad. Der Standard ist `agent-proxy`: Ein Realtime-Sprach-Frontend übernimmt Turn-Timing, Unterbrechung und Wiedergabe, delegiert substanzielle Arbeit über `openclaw_agent_consult` an den gerouteten OpenClaw-Agenten und behandelt das Ergebnis wie einen getippten Discord-Prompt dieses Sprechers. `stt-tts` behält den älteren Batch-STT-plus-TTS-Flow bei. `bidi` lässt das Realtime-Modell direkt konversieren und stellt gleichzeitig `openclaw_agent_consult` für das OpenClaw-Gehirn bereit.
- `voice.agentSession` steuert, welche OpenClaw-Konversation Sprach-Turns empfängt. Lassen Sie es nicht gesetzt, um die eigene Sitzung des Sprachkanals zu verwenden, oder setzen Sie `{ mode: "target", target: "channel:<text-channel-id>" }`, damit der Sprachkanal als Mikrofon-/Lautsprecher-Erweiterung einer bestehenden Discord-Textkanalsitzung wie `#maintainers` agiert.
- `voice.model` überschreibt das OpenClaw-Agentengehirn für Discord-Sprachantworten und Realtime-Consults. Lassen Sie es nicht gesetzt, um das geroutete Agentenmodell zu übernehmen. Es ist von `voice.realtime.model` getrennt.
- `voice.followUsers` erlaubt dem Bot, Discord-Sprachkanälen mit ausgewählten Benutzern beizutreten, zwischen ihnen zu wechseln und sie zu verlassen. Siehe [Benutzern in Sprachkanälen folgen](#follow-users-in-voice) für Verhaltensregeln und Beispiele.
- `agent-proxy` routet Sprache durch `discord-voice`, wodurch die normale Owner-/Tool-Autorisierung für den Sprecher und die Zielsitzung erhalten bleibt, aber das Agenten-Tool `tts` ausgeblendet wird, weil Discord Voice die Wiedergabe besitzt. Standardmäßig gibt `agent-proxy` dem Consult vollständigen owner-äquivalenten Tool-Zugriff für Owner-Sprecher (`voice.realtime.toolPolicy: "owner"`) und bevorzugt deutlich, den OpenClaw-Agenten vor substanziellen Antworten zu konsultieren (`voice.realtime.consultPolicy: "always"`). In diesem standardmäßigen `always`-Modus spricht die Realtime-Schicht vor der Consult-Antwort keine Füllinhalte automatisch; sie erfasst und transkribiert Sprache und spricht dann die geroutete OpenClaw-Antwort. Wenn mehrere erzwungene Consult-Antworten fertig werden, während Discord noch die erste Antwort wiedergibt, werden spätere Antworten mit exaktem Sprachtext in die Warteschlange gestellt, bis die Wiedergabe inaktiv ist, statt die Sprache mitten im Satz zu ersetzen.
- Im `stt-tts`-Modus verwendet STT `tools.media.audio`; `voice.model` beeinflusst die Transkription nicht.
- In Realtime-Modi konfigurieren `voice.realtime.provider`, `voice.realtime.model` und `voice.realtime.speakerVoice` die Realtime-Audiositzung. Für OpenAI Realtime 2 plus das Codex-Gehirn verwenden Sie `voice.realtime.model: "gpt-realtime-2"` und `voice.model: "openai/gpt-5.5"`.
- Realtime-Sprachmodi enthalten standardmäßig kleine Profildateien `IDENTITY.md`, `USER.md` und `SOUL.md` in den Realtime-Provider-Anweisungen, damit schnelle direkte Turns dieselbe Identität, Benutzerverankerung und Persona wie der geroutete OpenClaw-Agent behalten. Setzen Sie `voice.realtime.bootstrapContextFiles` auf eine Teilmenge, um dies anzupassen, oder auf `[]`, um es zu deaktivieren. Die unterstützten Realtime-Bootstrap-Dateien sind auf diese Profildateien beschränkt; `AGENTS.md` bleibt im normalen Agentenkontext. Der eingefügte Profilkontext ersetzt `openclaw_agent_consult` nicht für Workspace-Arbeit, aktuelle Fakten, Memory-Lookups oder tool-gestützte Aktionen.
- Setzen Sie im OpenAI-`agent-proxy`-Realtime-Modus `voice.realtime.requireWakeName: true`, damit Discord-Realtime-Sprache stumm bleibt, bis ein Transkript mit einem Wake Name beginnt oder endet. Konfigurierte Wake Names müssen ein oder zwei Wörter sein. Wenn `voice.realtime.wakeNames` nicht gesetzt ist, verwendet OpenClaw den gerouteten Agenten-`name` plus `OpenClaw` und fällt auf die Agenten-ID plus `OpenClaw` zurück. Wake-Name-Gating deaktiviert die automatische Antwort des Realtime-Providers, routet akzeptierte Turns über den OpenClaw-Agent-Consult-Pfad und gibt eine kurze gesprochene Bestätigung, wenn ein führender Wake Name aus einer Teiltranskription erkannt wird, bevor das endgültige Transkript eintrifft.
- Der OpenAI-Realtime-Provider akzeptiert aktuelle Realtime-2-Ereignisnamen und ältere Codex-kompatible Aliasse für Ausgabeaudio- und Transkriptereignisse, sodass kompatible Provider-Snapshots abweichen können, ohne Assistant-Audio zu verlieren.
- `voice.realtime.bargeIn` steuert, ob Discord-Sprecherstart-Ereignisse aktive Realtime-Wiedergabe unterbrechen. Wenn nicht gesetzt, folgt es der Eingabeaudio-Unterbrechungseinstellung des Realtime-Providers.
- `voice.realtime.minBargeInAudioEndMs` steuert die Mindestdauer der Assistant-Wiedergabe, bevor ein OpenAI-Realtime-Barge-In Audio abschneidet. Standard: `250`. Setzen Sie `0` für sofortige Unterbrechung in Räumen mit geringem Echo, oder erhöhen Sie den Wert für lautsprecherbasierte Setups mit viel Echo.
- Für eine OpenAI-Stimme bei Discord-Wiedergabe setzen Sie `voice.tts.provider: "openai"` und wählen unter `voice.tts.providers.openai.speakerVoice` eine Text-to-Speech-Stimme. `cedar` ist auf dem aktuellen OpenAI-TTS-Modell eine gute maskulin klingende Wahl.
- Pro Kanal gesetzte Discord-`systemPrompt`-Überschreibungen gelten für Sprachtranskript-Turns dieses Sprachkanals.
- Sprachtranskript-Turns leiten den Owner-Status für owner-geschützte Befehle und Kanalaktionen aus Discord-`allowFrom` (oder `dm.allowFrom`) ab. Die Sichtbarkeit von Agenten-Tools folgt der konfigurierten Tool-Richtlinie für die geroutete Sitzung.
- Discord Voice ist für reine Textkonfigurationen optional; setzen Sie `channels.discord.voice.enabled=true` (oder behalten Sie einen bestehenden `channels.discord.voice`-Block), um `/vc`-Befehle, die Voice-Laufzeit und den `GuildVoiceStates`-Gateway-Intent zu aktivieren.
- `channels.discord.intents.voiceStates` kann die Voice-State-Intent-Subscription explizit überschreiben. Lassen Sie es nicht gesetzt, damit der Intent der effektiven Voice-Aktivierung folgt.
- Wenn `voice.autoJoin` mehrere Einträge für dieselbe Guild enthält, tritt OpenClaw dem zuletzt konfigurierten Kanal für diese Guild bei.
- `voice.allowedChannels` ist eine optionale Residency-Allowlist. Lassen Sie sie nicht gesetzt, um `/vc join` in jeden autorisierten Discord-Sprachkanal zu erlauben. Wenn gesetzt, sind `/vc join`, Auto-Join beim Start und Voice-State-Moves des Bots auf die aufgeführten `{ guildId, channelId }`-Einträge beschränkt. Setzen Sie sie auf ein leeres Array, um alle Discord-Voice-Beitritte zu verweigern. Wenn Discord den Bot aus der Allowlist heraus verschiebt, verlässt OpenClaw diesen Kanal und tritt dem konfigurierten Auto-Join-Ziel erneut bei, wenn eines verfügbar ist.
- `voice.daveEncryption` und `voice.decryptionFailureTolerance` werden an die Join-Optionen von `@discordjs/voice` weitergereicht.
- Die Standardwerte von `@discordjs/voice` sind `daveEncryption=true` und `decryptionFailureTolerance=24`, wenn nicht gesetzt.
- OpenClaw verwendet den gebündelten `libopus-wasm`-Codec für Discord-Voice-Empfang und Realtime-Raw-PCM-Wiedergabe. Es liefert einen gepinnten libopus-WebAssembly-Build mit und benötigt keine nativen Opus-Addons.
- `voice.connectTimeoutMs` steuert das anfängliche Warten auf `@discordjs/voice` Ready für `/vc join` und Auto-Join-Versuche. Standard: `30000`.
- `voice.reconnectGraceMs` steuert, wie lange OpenClaw darauf wartet, dass eine getrennte Voice-Sitzung mit dem Wiederverbinden beginnt, bevor sie zerstört wird. Standard: `15000`.
- Im `stt-tts`-Modus stoppt die Sprachwiedergabe nicht nur deshalb, weil ein anderer Benutzer zu sprechen beginnt. Um Feedback-Schleifen zu vermeiden, ignoriert OpenClaw neue Spracherfassung, während TTS abgespielt wird; sprechen Sie nach Ende der Wiedergabe für den nächsten Turn. Realtime-Modi leiten Sprecherstarts als Barge-In-Signale an den Realtime-Provider weiter.
- In Realtime-Modi kann Echo von Lautsprechern in ein offenes Mikrofon wie ein Barge-In aussehen und die Wiedergabe unterbrechen. Setzen Sie für Discord-Räume mit viel Echo `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`, damit OpenAI bei Eingabeaudio nicht automatisch unterbricht. Fügen Sie `voice.realtime.bargeIn: true` hinzu, wenn Discord-Sprecherstart-Ereignisse weiterhin aktive Wiedergabe unterbrechen sollen. Die OpenAI-Realtime-Bridge ignoriert Wiedergabeabschneidungen, die kürzer als `voice.realtime.minBargeInAudioEndMs` sind, als wahrscheinliches Echo/Rauschen und protokolliert sie als übersprungen, statt die Discord-Wiedergabe zu leeren.
- `voice.captureSilenceGraceMs` steuert, wie lange OpenClaw wartet, nachdem Discord gemeldet hat, dass ein Sprecher aufgehört hat, bevor dieses Audiosegment für STT finalisiert wird. Standard: `2000`; erhöhen Sie diesen Wert, wenn Discord normale Pausen in abgehackte Teiltranskripte aufteilt.
- Wenn ElevenLabs der ausgewählte TTS-Provider ist, verwendet die Discord-Voice-Wiedergabe Streaming-TTS und startet aus dem Antwortstream des Providers. Provider ohne Streaming-Unterstützung fallen auf den synthetisierten temporären Dateipfad zurück.
- OpenClaw überwacht auch Empfangs-Decrypt-Fehler und stellt sich automatisch wieder her, indem es den Sprachkanal nach wiederholten Fehlern in einem kurzen Zeitfenster verlässt und erneut beitritt.
- Wenn Empfangslogs nach dem Aktualisieren wiederholt `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` zeigen, sammeln Sie einen Abhängigkeitsbericht und Logs. Die gebündelte `@discordjs/voice`-Linie enthält den Upstream-Padding-Fix aus discord.js-PR #11449, der discord.js-Issue #11419 geschlossen hat.
- Empfangsereignisse vom Typ `The operation was aborted` werden erwartet, wenn OpenClaw ein erfasstes Sprechersegment finalisiert; sie sind ausführliche Diagnosen, keine Warnungen.
- Ausführliche Discord-Voice-Logs enthalten eine begrenzte einzeilige STT-Transkriptvorschau für jedes akzeptierte Sprechersegment, sodass das Debugging sowohl die Benutzerseite als auch die Agentenantwortseite zeigt, ohne unbegrenzt Transkripttext auszugeben.
- Im `agent-proxy`-Modus überspringt der erzwungene Consult-Fallback wahrscheinlich unvollständige Transkriptfragmente wie Text, der auf `...` endet, oder einen abschließenden Konnektor wie `and`, sowie offensichtlich nicht handlungsrelevante Abschlüsse wie „bin gleich zurück“ oder „tschüss“. Logs zeigen `forced agent consult skipped reason=...`, wenn dies eine veraltete Antwort in der Warteschlange verhindert.

### Benutzern in Sprachkanälen folgen

Verwenden Sie `voice.followUsers`, wenn der Discord-Voice-Bot bei einem oder mehreren bekannten Discord-Benutzern bleiben soll, statt beim Start einem festen Kanal beizutreten oder auf `/vc join` zu warten.

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
- `followUsersEnabled` ist standardmäßig `true`, wenn `followUsers` konfiguriert ist. Setzen Sie es auf `false`, um die gespeicherte Liste beizubehalten, aber automatisches Voice-Following zu stoppen.
- Wenn ein verfolgter Benutzer einem erlaubten Sprachkanal beitritt, tritt OpenClaw diesem Kanal bei. Wenn der Benutzer wechselt, wechselt OpenClaw mit. Wenn der aktive verfolgte Benutzer die Verbindung trennt, verlässt OpenClaw den Kanal.
- Wenn mehrere verfolgte Benutzer in derselben Guild sind und der aktive verfolgte Benutzer geht, wechselt OpenClaw zum Kanal eines anderen nachverfolgten verfolgten Benutzers, bevor es die Guild verlässt. Wenn mehrere verfolgte Benutzer gleichzeitig wechseln, gewinnt das zuletzt beobachtete Voice-State-Ereignis.
- `allowedChannels` gilt weiterhin. Ein verfolgter Benutzer in einem nicht erlaubten Kanal wird ignoriert, und eine follow-eigene Sitzung wechselt zu einem anderen verfolgten Benutzer oder verlässt den Kanal.
- OpenClaw gleicht verpasste Voice-State-Ereignisse beim Start und in einem begrenzten Intervall ab. Der Abgleich sampelt konfigurierte Guilds und begrenzt REST-Lookups pro Lauf, sodass sehr große `followUsers`-Listen mehr als ein Intervall benötigen können, um zu konvergieren.
- Wenn Discord oder ein Administrator den Bot verschiebt, während er einem Benutzer folgt, baut OpenClaw die Voice-Sitzung neu auf und erhält die Follow-Ownership, wenn das Ziel erlaubt ist. Wenn der Bot aus `allowedChannels` heraus verschoben wird, verlässt OpenClaw den Kanal und tritt dem konfigurierten Ziel erneut bei, wenn eines existiert.
- DAVE-Empfangswiederherstellung kann denselben Kanal nach wiederholten Decrypt-Fehlern verlassen und erneut beitreten. Follow-eigene Sitzungen behalten ihre Follow-Ownership über diesen Wiederherstellungspfad hinweg, sodass eine spätere Trennung des verfolgten Benutzers den Kanal weiterhin verlässt.

Wählen Sie zwischen den Beitrittsmodi:

- Verwenden Sie `followUsers` für persönliche oder Operator-Setups, bei denen der Bot automatisch in Voice sein soll, wenn Sie es sind.
- Verwenden Sie `autoJoin` für Bots in festen Räumen, die anwesend sein sollen, auch wenn kein nachverfolgter Benutzer in Voice ist.
- Verwenden Sie `/vc join` für einmalige Beitritte oder Räume, in denen automatische Voice-Präsenz überraschend wäre.

Discord-Voice-Codec:

- Sprach-Empfangslogs zeigen `discord voice: opus decoder: libopus-wasm`.
- Echtzeitwiedergabe codiert rohes 48-kHz-Stereo-PCM mit demselben gebündelten `libopus-wasm`-Paket zu Opus, bevor Pakete an `@discordjs/voice` übergeben werden.
- Datei- und Provider-Stream-Wiedergabe transcodiert mit ffmpeg zu rohem 48-kHz-Stereo-PCM und verwendet dann `libopus-wasm` für den an Discord gesendeten Opus-Paketstream.

STT- plus TTS-Pipeline:

- Discord-PCM-Erfassung wird in eine temporäre WAV-Datei konvertiert.
- `tools.media.audio` verarbeitet STT, zum Beispiel `openai/gpt-4o-mini-transcribe`.
- Das Transkript wird über Discord-Ingress und Routing gesendet, während das Antwort-LLM mit einer Sprachausgabe-Richtlinie läuft, die das Agent-Tool `tts` ausblendet und zurückgegebenen Text anfordert, da Discord Voice die finale TTS-Wiedergabe besitzt.
- `voice.model` überschreibt, wenn gesetzt, nur das Antwort-LLM für diesen Sprachkanal-Turn.
- `voice.tts` wird über `messages.tts` gemergt; streamingfähige Provider speisen den Player direkt, andernfalls wird die resultierende Audiodatei im beigetretenen Kanal abgespielt.

Beispiel für eine standardmäßige Agent-Proxy-Sprachkanalsitzung:

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

Ohne `voice.agentSession`-Block erhält jeder Sprachkanal seine eigene geroutete OpenClaw-Sitzung. Beispielsweise spricht `/vc join channel:234567890123456789` mit der Sitzung für diesen Discord-Sprachkanal. Das Echtzeitmodell ist nur die Sprachschnittstelle; inhaltliche Anfragen werden an den konfigurierten OpenClaw-Agent übergeben. Wenn das Echtzeitmodell ein finales Transkript erzeugt, ohne das Consult-Tool aufzurufen, erzwingt OpenClaw den Consult als Fallback, damit sich der Standard weiterhin wie ein Gespräch mit dem Agent verhält.

Beispiel für Legacy-STT plus TTS:

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

Beispiel für bidirektionale Echtzeitkommunikation:

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

Voice als Erweiterung einer bestehenden Discord-Kanalsitzung:

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

Im Modus `agent-proxy` tritt der Bot dem konfigurierten Sprachkanal bei, aber OpenClaw-Agent-Turns verwenden die normale geroutete Sitzung und den Agent des Zielkanals. Die Echtzeit-Sprachsitzung spricht das zurückgegebene Ergebnis zurück in den Sprachkanal. Der Supervisor-Agent kann gemäß seiner Tool-Richtlinie weiterhin normale Nachrichten-Tools verwenden, einschließlich des Sendens einer separaten Discord-Nachricht, wenn dies die richtige Aktion ist.

Während ein delegierter OpenClaw-Lauf aktiv ist, werden neue Discord-Sprachtranskripte als Live-Laufsteuerung behandelt, bevor ein weiterer Agent-Turn gestartet wird. Phrasen wie "status", "cancel that", "use the smaller fix" oder "when you're done also check tests" werden als Status-, Abbruch-, Steuerungs- oder Folgeeingaben für die aktive Sitzung klassifiziert. Status-, Abbruch-, akzeptierte Steuerungs- und Folgeergebnisse werden in den Sprachkanal zurückgesprochen, damit die anrufende Person weiß, ob OpenClaw die Anfrage verarbeitet hat.

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

Verwenden Sie dies, wenn das Modell seine eigene Discord-Wiedergabe über ein offenes Mikrofon hört, Sie es aber trotzdem durch Sprechen unterbrechen möchten. OpenClaw verhindert, dass OpenAI bei rohem Eingabeaudio automatisch unterbricht, während `bargeIn: true` Discord-Sprecherstart-Ereignisse und bereits aktive Sprecher-Audioeingaben aktive Echtzeitantworten abbrechen lässt, bevor der nächste erfasste Turn OpenAI erreicht. Sehr frühe Barge-in-Signale mit `audioEndMs` unter `minBargeInAudioEndMs` werden als wahrscheinliches Echo/Rauschen behandelt und ignoriert, damit das Modell nicht beim ersten Wiedergabe-Frame abbricht.

Erwartete Sprachlogs:

- Beim Beitritt: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- Beim Echtzeitstart: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- Bei Sprecher-Audio: `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...` und `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- Bei übersprungener veralteter Sprache: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` oder `reason=non-actionable-closing ...`
- Bei Abschluss der Echtzeitantwort: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- Bei Wiedergabestopp/-zurücksetzung: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- Beim Echtzeit-Consult: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- Bei Agent-Antwort: `discord voice: agent turn answer ...`
- Bei eingereihter exakter Sprache: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`, gefolgt von `discord voice: realtime exact speech dequeued reason=player-idle ...`
- Bei Barge-in-Erkennung: `discord voice: realtime barge-in detected source=speaker-start ...` oder `discord voice: realtime barge-in detected source=active-speaker-audio ...`, gefolgt von `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- Bei Echtzeitunterbrechung: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`, gefolgt entweder von `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` oder `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- Bei ignoriertem Echo/Rauschen: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- Bei deaktiviertem Barge-in: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- Bei Leerlaufwiedergabe: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

Lesen Sie zum Debuggen abgeschnittener Audioausgabe die Echtzeit-Sprachlogs als Zeitachse:

1. `realtime audio playback started` bedeutet, dass Discord begonnen hat, Assistant-Audio abzuspielen. Die Bridge beginnt ab diesem Zeitpunkt, Assistant-Ausgabechunks, Discord-PCM-Bytes, Provider-Echtzeitbytes und synthetisierte Audiodauer zu zählen.
2. `realtime speaker turn opened` markiert, dass ein Discord-Sprecher aktiv wird. Wenn die Wiedergabe bereits aktiv ist und `bargeIn` aktiviert ist, kann darauf `barge-in detected source=speaker-start` folgen.
3. `realtime input audio started` markiert den ersten tatsächlich empfangenen Audio-Frame für diesen Sprecher-Turn. `outputActive=true` oder ein von null verschiedener `outputAudioMs` bedeutet hier, dass das Mikrofon Eingaben sendet, während die Assistant-Wiedergabe noch aktiv ist.
4. `barge-in detected source=active-speaker-audio` bedeutet, dass OpenClaw Live-Sprecher-Audio erkannt hat, während die Assistant-Wiedergabe aktiv war. Dies ist nützlich, um eine echte Unterbrechung von einem Discord-Sprecherstart-Ereignis ohne brauchbares Audio zu unterscheiden.
5. `barge-in requested reason=...` bedeutet, dass OpenClaw den Echtzeit-Provider aufgefordert hat, die aktive Antwort abzubrechen oder zu kürzen. Es enthält `outputAudioMs`, `outputActive` und `playbackChunks`, damit Sie sehen können, wie viel Assistant-Audio vor der Unterbrechung tatsächlich abgespielt wurde.
6. `realtime audio playback stopped reason=...` ist der lokale Discord-Wiedergabe-Resetpunkt. Der Grund sagt, wer die Wiedergabe gestoppt hat: `barge-in`, `player-idle`, `provider-clear-audio`, `forced-agent-consult`, `stream-close` oder `session-close`.
7. `realtime speaker turn closed` fasst den erfassten Eingabe-Turn zusammen. `chunks=0` oder `hasAudio=false` bedeutet, dass der Sprecher-Turn geöffnet wurde, aber kein verwendbares Audio die Echtzeit-Bridge erreicht hat. `interruptedPlayback=true` bedeutet, dass dieser Eingabe-Turn Assistant-Ausgabe überlappte und Barge-in-Logik ausgelöst hat.

Nützliche Felder:

- `outputAudioMs`: vom Echtzeit-Provider vor der Logzeile generierte Assistant-Audiodauer.
- `audioMs`: Assistant-Audiodauer, die OpenClaw vor dem Stoppen der Wiedergabe gezählt hat.
- `elapsedMs`: Wanduhrzeit zwischen Öffnen und Schließen des Wiedergabestreams oder Sprecher-Turns.
- `discordBytes`: 48-kHz-Stereo-PCM-Bytes, die an Discord Voice gesendet oder von Discord Voice empfangen wurden.
- `realtimeBytes`: PCM-Bytes im Provider-Format, die an den Echtzeit-Provider gesendet oder vom Echtzeit-Provider empfangen wurden.
- `playbackChunks`: Assistant-Audiochunks, die für die aktive Antwort an Discord weitergeleitet wurden.
- `sinceLastAudioMs`: Abstand zwischen dem letzten erfassten Sprecher-Audio-Frame und dem Schließen des Sprecher-Turns.

Häufige Muster:

- Sofortiger Abbruch mit `source=active-speaker-audio`, kleinem `outputAudioMs` und derselben Person in der Nähe deutet normalerweise darauf hin, dass Lautsprecherecho ins Mikrofon gelangt. Erhöhen Sie `voice.realtime.minBargeInAudioEndMs`, verringern Sie die Lautsprecherlautstärke, verwenden Sie Kopfhörer oder setzen Sie `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`.
- `source=speaker-start` gefolgt von `speaker turn closed ... hasAudio=false` bedeutet, dass Discord einen Sprecherstart gemeldet hat, aber kein Audio OpenClaw erreicht hat. Das kann ein vorübergehendes Discord-Voice-Ereignis, Noise-Gate-Verhalten oder ein Client sein, der das Mikrofon kurz aktiviert.
- `audio playback stopped reason=stream-close` ohne nahegelegenes Barge-in oder `provider-clear-audio` bedeutet, dass der lokale Discord-Wiedergabestream unerwartet geendet hat. Prüfen Sie die vorherigen Provider- und Discord-Player-Logs.
- `capture ignored during playback (barge-in disabled)` bedeutet, dass OpenClaw Eingaben absichtlich verworfen hat, während Assistant-Audio aktiv war. Aktivieren Sie `voice.realtime.bargeIn`, wenn Sprache die Wiedergabe unterbrechen soll.
- `barge-in ignored ... outputActive=false` bedeutet, dass Discord oder Provider-VAD Sprache gemeldet hat, OpenClaw aber keine aktive Wiedergabe hatte, die unterbrochen werden konnte. Dies sollte Audio nicht abschneiden.

Anmeldedaten werden pro Komponente aufgelöst: LLM-Routen-Authentifizierung für `voice.model`, STT-Authentifizierung für `tools.media.audio`, TTS-Authentifizierung für `messages.tts`/`voice.tts` und Echtzeit-Provider-Authentifizierung für `voice.realtime.providers` oder die normale Authentifizierungskonfiguration des Providers.

### Sprachnachrichten

Discord-Sprachnachrichten zeigen eine Wellenformvorschau und erfordern OGG/Opus-Audio. OpenClaw generiert die Wellenform automatisch, benötigt aber `ffmpeg` und `ffprobe` auf dem Gateway-Host, um zu prüfen und zu konvertieren.

- Geben Sie einen **lokalen Dateipfad** an (URLs werden abgelehnt).
- Lassen Sie Textinhalte weg (Discord lehnt Text + Sprachnachricht in derselben Payload ab).
- Jedes Audioformat wird akzeptiert; OpenClaw konvertiert bei Bedarf zu OGG/Opus.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Nicht erlaubte Intents verwendet oder Bot sieht keine Guild-Nachrichten">

    - Message Content Intent aktivieren
    - Server Members Intent aktivieren, wenn Sie von der Auflösung von Benutzern/Mitgliedern abhängen
    - Gateway nach dem Ändern von Intents neu starten

  </Accordion>

  <Accordion title="Guild-Nachrichten unerwartet blockiert">

    - `groupPolicy` prüfen
    - Guild-Allowlist unter `channels.discord.guilds` prüfen
    - wenn eine Guild-`channels`-Map vorhanden ist, sind nur aufgeführte Channels erlaubt
    - `requireMention`-Verhalten und Erwähnungsmuster prüfen

    Nützliche Prüfungen:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention ist false, aber weiterhin blockiert">
    Häufige Ursachen:

    - `groupPolicy="allowlist"` ohne passende Guild-/Channel-Allowlist
    - `requireMention` an der falschen Stelle konfiguriert (muss unter `channels.discord.guilds` oder dem Channel-Eintrag stehen)
    - Absender durch Guild-/Channel-`users`-Allowlist blockiert

  </Accordion>

  <Accordion title="Lang laufende Discord-Turns oder doppelte Antworten">

    Typische Logs:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Stellschrauben für die Discord-Gateway-Warteschlange:

    - Einzelkonto: `channels.discord.eventQueue.listenerTimeout`
    - Mehrere Konten: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - dies steuert nur die Listener-Arbeit des Discord-Gateways, nicht die Laufzeit eines Agent-Turns

    Discord wendet kein Channel-eigenes Timeout auf in die Warteschlange gestellte Agent-Turns an. Message-Listener übergeben sofort, und in die Warteschlange gestellte Discord-Läufe bewahren die Reihenfolge pro Sitzung, bis der Sitzungs-/Tool-/Runtime-Lebenszyklus die Arbeit abschließt oder abbricht.

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
    OpenClaw ruft Discord-`/gateway/bot`-Metadaten vor dem Verbindungsaufbau ab. Vorübergehende Fehler fallen auf Discords Standard-Gateway-URL zurück und werden in Logs ratenbegrenzt.

    Stellschrauben für Metadaten-Timeouts:

    - Einzelkonto: `channels.discord.gatewayInfoTimeoutMs`
    - Mehrere Konten: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - Env-Fallback, wenn die Konfiguration nicht gesetzt ist: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - Standard: `30000` (30 Sekunden), Maximum: `120000`

  </Accordion>

  <Accordion title="Gateway-READY-Timeout-Neustarts">
    OpenClaw wartet beim Start und nach Runtime-Wiederverbindungen auf Discords Gateway-`READY`-Ereignis. Setups mit mehreren Konten und gestaffeltem Start können ein längeres READY-Startfenster als den Standard benötigen.

    Stellschrauben für READY-Timeouts:

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
    Berechtigungsprüfungen mit `channels status --probe` funktionieren nur für numerische Channel-IDs.

    Wenn Sie Slug-Schlüssel verwenden, kann das Runtime-Matching weiterhin funktionieren, aber die Probe kann Berechtigungen nicht vollständig prüfen.

  </Accordion>

  <Accordion title="DM- und Pairing-Probleme">

    - DM deaktiviert: `channels.discord.dm.enabled=false`
    - DM-Richtlinie deaktiviert: `channels.discord.dmPolicy="disabled"` (Legacy: `channels.discord.dm.policy`)
    - wartet im `pairing`-Modus auf Pairing-Genehmigung

  </Accordion>

  <Accordion title="Bot-zu-Bot-Schleifen">
    Standardmäßig werden von Bots verfasste Nachrichten ignoriert.

    Wenn Sie `channels.discord.allowBots=true` setzen, verwenden Sie strikte Erwähnungs- und Allowlist-Regeln, um Schleifenverhalten zu vermeiden.
    Bevorzugen Sie `channels.discord.allowBots="mentions"`, um nur Bot-Nachrichten zu akzeptieren, die den Bot erwähnen.

    OpenClaw liefert außerdem gemeinsamen [Schutz vor Bot-Schleifen](/de/channels/bot-loop-protection) aus. Immer wenn `allowBots` von Bots verfasste Nachrichten bis zum Dispatch gelangen lässt, ordnet Discord das eingehende Ereignis `(account, channel, bot pair)`-Fakten zu, und der generische Pair-Guard unterdrückt das Paar, nachdem es das konfigurierte Ereignisbudget überschritten hat. Der Guard verhindert ausufernde Zwei-Bot-Schleifen, die zuvor durch Discord-Ratenlimits gestoppt werden mussten; er betrifft keine Einzel-Bot-Deployments oder einmaligen Bot-Antworten, die unter dem Budget bleiben.

    Standardeinstellungen (aktiv, wenn `allowBots` gesetzt ist):

    - `maxEventsPerWindow: 20` -- Bot-Paar kann innerhalb des gleitenden Fensters 20 Nachrichten austauschen
    - `windowSeconds: 60` -- Länge des gleitenden Fensters
    - `cooldownSeconds: 60` -- sobald das Budget ausgelöst wird, wird jede weitere Bot-zu-Bot-Nachricht in beide Richtungen für eine Minute verworfen

    Konfigurieren Sie den gemeinsamen Standard einmal unter `channels.defaults.botLoopProtection` und überschreiben Sie dann Discord, wenn ein legitimer Workflow mehr Spielraum benötigt. Die Priorität ist:

    - `channels.discord.accounts.<account>.botLoopProtection`
    - `channels.discord.botLoopProtection`
    - `channels.defaults.botLoopProtection`
    - integrierte Standards

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

  <Accordion title="Voice-STT-Abbrüche mit DecryptionFailed(...)">

    - halten Sie OpenClaw aktuell (`openclaw update`), damit die Wiederherstellungslogik für Discord-Voice-Empfang vorhanden ist
    - bestätigen Sie `channels.discord.voice.daveEncryption=true` (Standard)
    - beginnen Sie mit `channels.discord.voice.decryptionFailureTolerance=24` (Upstream-Standard) und passen Sie nur bei Bedarf an
    - beobachten Sie Logs auf:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - wenn Fehler nach dem automatischen Wiederbeitritt weiter auftreten, sammeln Sie Logs und vergleichen Sie sie mit der Upstream-DAVE-Empfangshistorie in [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) und [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

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
- Funktionen: `threadBindings`, Top-Level-`bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents.enabled`, `agentComponents.ttlMs`, `heartbeat`, `responsePrefix`

</Accordion>

## Sicherheit und Betrieb

- Behandeln Sie Bot-Token als Geheimnisse (`DISCORD_BOT_TOKEN` in überwachten Umgebungen bevorzugt).
- Gewähren Sie Discord-Berechtigungen nach dem Prinzip der geringsten Rechte.
- Wenn Befehls-Deployment/-Status veraltet ist, starten Sie das Gateway neu und prüfen Sie erneut mit `openclaw channels status --probe`.

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/de/channels/pairing">
    Koppeln Sie einen Discord-Benutzer mit dem Gateway.
  </Card>
  <Card title="Gruppen" icon="users" href="/de/channels/groups">
    Gruppenchat- und Allowlist-Verhalten.
  </Card>
  <Card title="Channel-Routing" icon="route" href="/de/channels/channel-routing">
    Eingehende Nachrichten an Agenten weiterleiten.
  </Card>
  <Card title="Sicherheit" icon="shield" href="/de/gateway/security">
    Bedrohungsmodell und Härtung.
  </Card>
  <Card title="Multi-Agent-Routing" icon="sitemap" href="/de/concepts/multi-agent">
    Guilds und Channels Agenten zuordnen.
  </Card>
  <Card title="Slash-Befehle" icon="terminal" href="/de/tools/slash-commands">
    Verhalten nativer Befehle.
  </Card>
</CardGroup>
