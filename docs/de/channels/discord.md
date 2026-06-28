---
read_when:
    - Arbeiten an Discord-Kanalfunktionen
summary: Supportstatus, Funktionen und Konfiguration des Discord-Bots
title: Discord
x-i18n:
    generated_at: "2026-06-28T20:40:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 91bda14cfdd7bf5045413d97c56936ea7150b396e0e7ecd4ac300e1a811377cb
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
    Öffnen Sie das [Discord Developer Portal](https://discord.com/developers/applications) und klicken Sie auf **New Application**. Geben Sie ihr einen Namen wie „OpenClaw“.

    Klicken Sie in der Seitenleiste auf **Bot**. Setzen Sie den **Username** auf den Namen, den Sie für Ihren OpenClaw-Agenten verwenden.

  </Step>

  <Step title="Privilegierte Intents aktivieren">
    Bleiben Sie auf der Seite **Bot**, scrollen Sie nach unten zu **Privileged Gateway Intents** und aktivieren Sie:

    - **Message Content Intent** (erforderlich)
    - **Server Members Intent** (empfohlen; erforderlich für Rollen-Allowlists und Zuordnung von Namen zu IDs)
    - **Presence Intent** (optional; nur für Präsenzaktualisierungen erforderlich)

  </Step>

  <Step title="Bot-Token kopieren">
    Scrollen Sie auf der Seite **Bot** wieder nach oben und klicken Sie auf **Reset Token**.

    <Note>
    Trotz des Namens wird dadurch Ihr erstes Token erzeugt — es wird nichts „zurückgesetzt“.
    </Note>

    Kopieren Sie das Token und speichern Sie es an einem sicheren Ort. Dies ist Ihr **Bot Token**, und Sie benötigen es gleich.

  </Step>

  <Step title="Einladungs-URL generieren und Bot zu Ihrem Server hinzufügen">
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

    Dies ist die Basisausstattung für normale Textkanäle. Wenn Sie in Discord-Threads posten möchten, einschließlich Workflows für Forum- oder Medienkanäle, die einen Thread erstellen oder fortsetzen, aktivieren Sie außerdem **Send Messages in Threads**.
    Kopieren Sie die generierte URL unten, fügen Sie sie in Ihren Browser ein, wählen Sie Ihren Server aus und klicken Sie auf **Continue**, um die Verbindung herzustellen. Sie sollten Ihren Bot nun auf dem Discord-Server sehen.

  </Step>

  <Step title="Developer Mode aktivieren und IDs sammeln">
    Zurück in der Discord-App müssen Sie den Developer Mode aktivieren, damit Sie interne IDs kopieren können.

    1. Klicken Sie auf **User Settings** (Zahnradsymbol neben Ihrem Avatar) → scrollen Sie in der Seitenleiste zu **Developer** → aktivieren Sie **Developer Mode**

        *(Hinweis: In der mobilen Discord-App befindet sich der Developer Mode unter **App Settings** → **Advanced**)*

    2. Rechtsklicken Sie in der Seitenleiste auf Ihr **Server-Symbol** → **Copy Server ID**
    3. Rechtsklicken Sie auf Ihren **eigenen Avatar** → **Copy User ID**

    Speichern Sie Ihre **Server ID** und **User ID** zusammen mit Ihrem Bot Token — Sie senden alle drei im nächsten Schritt an OpenClaw.

  </Step>

  <Step title="DMs von Servermitgliedern erlauben">
    Damit die Kopplung funktioniert, muss Discord Ihrem Bot erlauben, Ihnen eine DM zu senden. Rechtsklicken Sie auf Ihr **Server-Symbol** → **Privacy Settings** → aktivieren Sie **Direct Messages**.

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

    Wenn OpenClaw bereits als Hintergrunddienst läuft, starten Sie es über die OpenClaw-Mac-App neu oder indem Sie den Prozess `openclaw gateway run` stoppen und neu starten.
    Bei Installationen als verwalteter Dienst führen Sie `openclaw gateway install` in einer Shell aus, in der `DISCORD_BOT_TOKEN` vorhanden ist, oder speichern Sie die Variable in `~/.openclaw/.env`, damit der Dienst die env-SecretRef nach einem Neustart auflösen kann.
    Wenn Ihr Host durch Discords Start-Anwendungsabfrage blockiert oder rate-limitiert wird, setzen Sie die Discord-Anwendungs-/Client-ID aus dem Developer Portal, damit der Start diesen REST-Aufruf überspringen kann. Verwenden Sie `channels.discord.applicationId` für das Standardkonto oder `channels.discord.accounts.<accountId>.applicationId`, wenn Sie mehrere Discord-Bots betreiben.

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

        Für skriptgesteuerte oder Remote-Einrichtung schreiben Sie denselben JSON5-Block mit `openclaw config patch --file ./discord.patch.json5 --dry-run` und führen ihn danach erneut ohne `--dry-run` aus. Klartextwerte für `token` werden unterstützt. SecretRef-Werte werden ebenfalls für `channels.discord.token` über env/file/exec-Provider hinweg unterstützt. Siehe [Geheimnisverwaltung](/de/gateway/secrets).

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

  <Step title="Erste DM-Kopplung genehmigen">
    Warten Sie, bis der Gateway läuft, und senden Sie Ihrem Bot dann eine DM in Discord. Er antwortet mit einem Kopplungscode.

    <Tabs>
      <Tab title="Ihren Agenten fragen">
        Senden Sie den Kopplungscode über Ihren bestehenden Kanal an Ihren Agenten:

        > „Diesen Discord-Kopplungscode genehmigen: `<CODE>`“
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
Die Token-Auflösung ist kontobewusst. Token-Werte aus der Konfiguration haben Vorrang vor Env-Fallbacks. `DISCORD_BOT_TOKEN` wird nur für das Standardkonto verwendet.
Wenn zwei aktivierte Discord-Konten auf dasselbe Bot-Token auflösen, startet OpenClaw nur einen Gateway-Monitor für dieses Token. Ein aus der Konfiguration stammendes Token hat Vorrang vor dem Standard-Env-Fallback; andernfalls gewinnt das erste aktivierte Konto, und das doppelte Konto wird als deaktiviert gemeldet.
Für erweiterte ausgehende Aufrufe (Nachrichten-Tool/Kanalaktionen) wird ein explizites `token` pro Aufruf für diesen Aufruf verwendet. Dies gilt für Sende- sowie Lese-/Probe-artige Aktionen (z. B. read/search/fetch/thread/pins/permissions). Kontorichtlinien und Retry-Einstellungen stammen weiterhin aus dem ausgewählten Konto im aktiven Runtime-Snapshot.
</Note>

## Empfohlen: Guild-Arbeitsbereich einrichten

Sobald DMs funktionieren, können Sie Ihren Discord-Server als vollständigen Arbeitsbereich einrichten, in dem jeder Kanal seine eigene Agentensitzung mit eigenem Kontext erhält. Dies wird für private Server empfohlen, auf denen es nur Sie und Ihren Bot gibt.

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
    Standardmäßig antwortet Ihr Agent in Guild-Kanälen nur, wenn er @erwähnt wird. Für einen privaten Server möchten Sie wahrscheinlich, dass er auf jede Nachricht antwortet.

    In Guild-Kanälen werden normale Antworten standardmäßig automatisch gepostet. Für gemeinsam genutzte, immer aktive Räume aktivieren Sie `messages.groupChat.visibleReplies: "message_tool"`, damit der Agent mitlesen und nur posten kann, wenn er entscheidet, dass eine Kanalantwort nützlich ist. Dies funktioniert am besten mit neuesten, tool-zuverlässigen Modellen wie GPT 5.5. Ambient-Raumereignisse bleiben still, sofern das Tool nichts sendet. Siehe [Ambient-Raumereignisse](/de/channels/ambient-room-events) für die vollständige Konfiguration des Mitlesemodus.

    Wenn Discord Tippen anzeigt und die Logs Token-Nutzung zeigen, aber keine Nachricht gepostet wird, prüfen Sie, ob der Turn als Ambient-Raumereignis konfiguriert wurde oder sichtbare Antworten per Nachrichten-Tool aktiviert wurden.

    <Tabs>
      <Tab title="Ihren Agenten fragen">
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

        Um Nachrichtentool-Sendungen für sichtbare Gruppen-/Kanalantworten zu erzwingen, setzen Sie `messages.groupChat.visibleReplies: "message_tool"`.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Speicher für Guild-Kanäle planen">
    Standardmäßig wird Langzeitgedächtnis (MEMORY.md) nur in DM-Sitzungen geladen. Guild-Kanäle laden MEMORY.md nicht automatisch.

    <Tabs>
      <Tab title="Ihren Agenten fragen">
        > „Wenn ich Fragen in Discord-Kanälen stelle, verwenden Sie memory_search oder memory_get, wenn Sie Langzeitkontext aus MEMORY.md benötigen.“
      </Tab>
      <Tab title="Manuell">
        Wenn Sie in jedem Kanal gemeinsamen Kontext benötigen, legen Sie die stabilen Anweisungen in `AGENTS.md` oder `USER.md` ab (sie werden für jede Sitzung injiziert). Bewahren Sie Langzeitnotizen in `MEMORY.md` auf und greifen Sie bei Bedarf mit Speicher-Tools darauf zu.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Erstellen Sie jetzt einige Kanäle auf Ihrem Discord-Server und beginnen Sie zu chatten. Ihr Agent kann den Kanalnamen sehen, und jeder Kanal erhält seine eigene isolierte Sitzung — sodass Sie `#coding`, `#home`, `#research` oder etwas einrichten können, das zu Ihrem Workflow passt.

## Runtime-Modell

- Gateway besitzt die Discord-Verbindung.
- Das Antwort-Routing ist deterministisch: Eingehende Discord-Antworten gehen zurück an Discord.
- Discord-Guild-/Kanal-Metadaten werden dem Modell-Prompt als nicht vertrauenswürdiger
  Kontext hinzugefügt, nicht als für Benutzer sichtbares Antwortpräfix. Wenn ein Modell diese Hülle
  zurückkopiert, entfernt OpenClaw die kopierten Metadaten aus ausgehenden Antworten und aus
  künftigem Wiedergabekontext.
- Standardmäßig (`session.dmScope=main`) teilen direkte Chats die Hauptsitzung des Agenten (`agent:main:main`).
- Guild-Kanäle sind isolierte Sitzungsschlüssel (`agent:<agentId>:discord:channel:<channelId>`).
- Gruppen-DMs werden standardmäßig ignoriert (`channels.discord.dm.groupEnabled=false`).
- Native Slash-Befehle laufen in isolierten Befehlssitzungen (`agent:<agentId>:discord:slash:<userId>`), führen aber weiterhin `CommandTargetSessionKey` zur gerouteten Unterhaltungssitzung mit.
- Die Zustellung von textbasierten Cron-/Heartbeat-Ankündigungen an Discord verwendet die endgültige,
  für den Assistenten sichtbare Antwort genau einmal. Medien und strukturierte Komponenten-Payloads bleiben
  Mehrfachnachrichten, wenn der Agent mehrere zustellbare Payloads ausgibt.

## Forum-Kanäle

Discord-Forum- und Medienkanäle akzeptieren nur Thread-Beiträge. OpenClaw unterstützt zwei Möglichkeiten, sie zu erstellen:

- Senden Sie eine Nachricht an das Forum übergeordnete Element (`channel:<forumId>`), um automatisch einen Thread zu erstellen. Der Thread-Titel verwendet die erste nicht leere Zeile Ihrer Nachricht.
- Verwenden Sie `openclaw message thread create`, um einen Thread direkt zu erstellen. Übergeben Sie für Forum-Kanäle nicht `--message-id`.

Beispiel: An das Forum übergeordnete Element senden, um einen Thread zu erstellen

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Beispiel: Einen Forum-Thread explizit erstellen

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Forum-Eltern akzeptieren keine Discord-Komponenten. Wenn Sie Komponenten benötigen, senden Sie an den Thread selbst (`channel:<threadId>`).

## Interaktive Komponenten

OpenClaw unterstützt Discord-Komponenten-v2-Container für Agentennachrichten. Verwenden Sie das Nachrichten-Tool mit einem `components`-Payload. Interaktionsergebnisse werden als normale eingehende Nachrichten zurück an den Agenten geroutet und folgen den bestehenden Discord-`replyToMode`-Einstellungen.

Unterstützte Blöcke:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Aktionszeilen erlauben bis zu 5 Schaltflächen oder ein einzelnes Auswahlmenü
- Auswahltypen: `string`, `user`, `role`, `mentionable`, `channel`

Standardmäßig sind Komponenten einmalig verwendbar. Setzen Sie `components.reusable=true`, damit Schaltflächen, Auswahlelemente und Formulare mehrfach verwendet werden können, bis sie ablaufen.

Um einzuschränken, wer auf eine Schaltfläche klicken kann, setzen Sie `allowedUsers` für diese Schaltfläche (Discord-Benutzer-IDs, Tags oder `*`). Wenn dies konfiguriert ist, erhalten nicht übereinstimmende Benutzer eine flüchtige Ablehnung.

Komponenten-Callbacks laufen standardmäßig nach 30 Minuten ab. Setzen Sie `channels.discord.agentComponents.ttlMs`, um diese Lebensdauer der Callback-Registry für das Standard-Discord-Konto zu ändern, oder `channels.discord.accounts.<accountId>.agentComponents.ttlMs`, um ein Konto in einer Multi-Konto-Konfiguration zu überschreiben. Der Wert ist in Millisekunden, muss eine positive Ganzzahl sein und ist auf `86400000` (24 Stunden) begrenzt. Längere TTLs sind nützlich für Review- oder Genehmigungs-Workflows, bei denen Schaltflächen nutzbar bleiben müssen, erweitern aber auch das Zeitfenster, in dem eine alte Discord-Nachricht noch eine Aktion auslösen kann. Bevorzugen Sie die kürzeste TTL, die zum Workflow passt, und behalten Sie den Standard bei, wenn veraltete Callbacks überraschend wären.

Die Slash-Befehle `/model` und `/models` öffnen eine interaktive Modellauswahl mit Dropdowns für Provider, Modell und kompatible Runtime sowie einem Absenden-Schritt. `/models add` ist veraltet und gibt jetzt eine Veraltungsmeldung zurück, anstatt Modelle aus dem Chat zu registrieren. Die Picker-Antwort ist flüchtig und nur der aufrufende Benutzer kann sie verwenden. Discord-Auswahlmenüs sind auf 25 Optionen begrenzt. Fügen Sie daher `provider/*`-Einträge zu `agents.defaults.models` hinzu, wenn der Picker dynamisch erkannte Modelle nur für ausgewählte Provider wie `openai` oder `vllm` anzeigen soll.

Dateianhänge:

- `file`-Blöcke müssen auf eine Anhangsreferenz zeigen (`attachment://<filename>`)
- Stellen Sie den Anhang über `media`/`path`/`filePath` bereit (einzelne Datei); verwenden Sie `media-gallery` für mehrere Dateien
- Verwenden Sie `filename`, um den Upload-Namen zu überschreiben, wenn er der Anhangsreferenz entsprechen soll

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
  <Tab title="DM policy">
    `channels.discord.dmPolicy` steuert den DM-Zugriff. `channels.discord.allowFrom` ist die kanonische DM-Allowlist.

    - `pairing` (Standard)
    - `allowlist`
    - `open` (erfordert, dass `channels.discord.allowFrom` `"*"` enthält)
    - `disabled`

    Wenn die DM-Richtlinie nicht offen ist, werden unbekannte Benutzer blockiert (oder im Modus `pairing` zur Kopplung aufgefordert).

    Priorität bei mehreren Konten:

    - `channels.discord.accounts.default.allowFrom` gilt nur für das Konto `default`.
    - Für ein Konto hat `allowFrom` Vorrang vor dem Legacy-`dm.allowFrom`.
    - Benannte Konten erben `channels.discord.allowFrom`, wenn ihr eigenes `allowFrom` und das Legacy-`dm.allowFrom` nicht gesetzt sind.
    - Benannte Konten erben `channels.discord.accounts.default.allowFrom` nicht.

    Legacy-`channels.discord.dm.policy` und `channels.discord.dm.allowFrom` werden aus Kompatibilitätsgründen weiterhin gelesen. `openclaw doctor --fix` migriert sie zu `dmPolicy` und `allowFrom`, wenn dies ohne Änderung des Zugriffs möglich ist.

    DM-Zielformat für die Zustellung:

    - `user:<id>`
    - `<@id>`-Erwähnung

    Bloße numerische IDs werden normalerweise als Kanal-IDs aufgelöst, wenn ein Kanalstandard aktiv ist, aber IDs, die in der effektiven DM-`allowFrom` des Kontos aufgeführt sind, werden aus Kompatibilitätsgründen als Benutzer-DM-Ziele behandelt.

  </Tab>

  <Tab title="Access groups">
    Discord-DMs und Textbefehlsautorisierung können dynamische `accessGroup:<name>`-Einträge in `channels.discord.allowFrom` verwenden.

    Zugriffsgruppennamen werden über Nachrichtenkanäle hinweg geteilt. Verwenden Sie `type: "message.senders"` für eine statische Gruppe, deren Mitglieder in der normalen `allowFrom`-Syntax jedes Kanals ausgedrückt werden, oder `type: "discord.channelAudience"`, wenn die aktuelle `ViewChannel`-Zielgruppe eines Discord-Kanals die Mitgliedschaft dynamisch definieren soll. Das gemeinsame Verhalten von Zugriffsgruppen ist hier dokumentiert: [Zugriffsgruppen](/de/channels/access-groups).

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

    Ein Discord-Textkanal hat keine separate Mitgliederliste. `type: "discord.channelAudience"` modelliert Mitgliedschaft so: Der DM-Absender ist Mitglied der konfigurierten Guild und hat aktuell die effektive `ViewChannel`-Berechtigung für den konfigurierten Kanal, nachdem Rollen- und Kanalüberschreibungen angewendet wurden.

    Beispiel: Allen Personen, die `#maintainers` sehen können, erlauben, dem Bot eine DM zu senden, während DMs für alle anderen geschlossen bleiben.

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

    Lookups schlagen geschlossen fehl. Wenn Discord `Missing Access` zurückgibt, die Mitgliederabfrage fehlschlägt oder der Kanal zu einer anderen Guild gehört, wird der DM-Absender als nicht autorisiert behandelt.

    Aktivieren Sie im Discord Developer Portal den **Server Members Intent** für den Bot, wenn Sie kanalzielgruppenbasierte Zugriffsgruppen verwenden. DMs enthalten keinen Guild-Mitgliedsstatus, daher löst OpenClaw das Mitglied zum Autorisierungszeitpunkt über Discord REST auf.

  </Tab>

  <Tab title="Guild policy">
    Die Guild-Behandlung wird durch `channels.discord.groupPolicy` gesteuert:

    - `open`
    - `allowlist`
    - `disabled`

    Die sichere Basis, wenn `channels.discord` vorhanden ist, ist `allowlist`.

    Verhalten von `allowlist`:

    - Guild muss mit `channels.discord.guilds` übereinstimmen (`id` bevorzugt, Slug akzeptiert)
    - optionale Absender-Allowlists: `users` (stabile IDs empfohlen) und `roles` (nur Rollen-IDs); wenn eines von beiden konfiguriert ist, sind Absender erlaubt, wenn sie mit `users` ODER `roles` übereinstimmen
    - direkte Namens-/Tag-Übereinstimmung ist standardmäßig deaktiviert; aktivieren Sie `channels.discord.dangerouslyAllowNameMatching: true` nur als Break-Glass-Kompatibilitätsmodus
    - Namen/Tags werden für `users` unterstützt, aber IDs sind sicherer; `openclaw security audit` warnt, wenn Namens-/Tag-Einträge verwendet werden
    - wenn für eine Guild `channels` konfiguriert ist, werden nicht aufgeführte Kanäle abgelehnt
    - wenn eine Guild keinen `channels`-Block hat, sind alle Kanäle in dieser auf der Allowlist stehenden Guild erlaubt

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
    Guild-Nachrichten sind standardmäßig erwähnungsgeschützt.

    Erwähnungserkennung umfasst:

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

### Rollenbasiertes Agenten-Routing

Verwenden Sie `bindings[].match.roles`, um Discord-Guild-Mitglieder nach Rollen-ID an verschiedene Agenten weiterzuleiten. Rollenbasierte Bindings akzeptieren nur Rollen-IDs und werden nach Peer- oder Parent-Peer-Bindings und vor Guild-only-Bindings ausgewertet. Wenn ein Binding auch andere Match-Felder setzt (zum Beispiel `peer` + `guildId` + `roles`), müssen alle konfigurierten Felder übereinstimmen.

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
- `commands.native=false` überspringt die Registrierung und Bereinigung von Discord-Slash-Commands beim Start. Zuvor registrierte Befehle können in Discord sichtbar bleiben, bis Sie sie aus der Discord-App entfernen.
- Die Authentifizierung nativer Befehle verwendet dieselben Discord-Allowlists/-Richtlinien wie die normale Nachrichtenverarbeitung.
- Befehle können in der Discord-Benutzeroberfläche weiterhin für Benutzer sichtbar sein, die nicht autorisiert sind; die Ausführung erzwingt dennoch die OpenClaw-Authentifizierung und gibt „nicht autorisiert“ zurück.

Siehe [Slash-Commands](/de/tools/slash-commands) für Befehlskatalog und Verhalten.

Standard-Slash-Command-Einstellungen:

- `ephemeral: true`

## Feature-Details

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

    Hinweis: `off` deaktiviert implizites Antwort-Threading. Explizite `[[reply_to_*]]`-Tags werden weiterhin berücksichtigt.
    `first` hängt die implizite native Antwortreferenz immer an die erste ausgehende Discord-Nachricht für den Turn an.
    `batched` hängt Discords implizite native Antwortreferenz nur an, wenn das
    eingehende Ereignis ein entprellter Batch aus mehreren Nachrichten war. Das ist nützlich,
    wenn Sie native Antworten hauptsächlich für mehrdeutige, stoßweise Chats möchten, nicht für jeden
    Turn mit einer einzelnen Nachricht.

    Nachrichten-IDs werden in Kontext/Verlauf verfügbar gemacht, damit Agenten bestimmte Nachrichten gezielt ansprechen können.

  </Accordion>

  <Accordion title="Link-Vorschauen">
    Discord erzeugt standardmäßig Rich-Link-Embeds für URLs. OpenClaw unterdrückt diese generierten Embeds bei ausgehenden Discord-Nachrichten standardmäßig, sodass von Agenten gesendete URLs als einfache Links bleiben, sofern Sie sich nicht dafür entscheiden:

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    Setzen Sie `channels.discord.accounts.<id>.suppressEmbeds`, um ein Konto zu überschreiben. Agenten-Sends über Message-Tools können für eine einzelne Nachricht ebenfalls `suppressEmbeds: false` übergeben. Explizite Discord-`embeds`-Payloads werden durch die standardmäßige Link-Vorschau-Einstellung nicht unterdrückt.

  </Accordion>

  <Accordion title="Live-Stream-Vorschau">
    OpenClaw kann Antwortentwürfe streamen, indem es eine temporäre Nachricht sendet und sie bearbeitet, während Text eintrifft. `channels.discord.streaming` akzeptiert `off` | `partial` | `block` | `progress` (Standard). `progress` hält einen bearbeitbaren Statusentwurf vor und aktualisiert ihn mit Tool-Fortschritt bis zur endgültigen Zustellung; das gemeinsame Startlabel ist eine rollierende Zeile, sodass es wie der Rest wegscrollt, sobald genug Arbeit erscheint. `streamMode` ist ein Legacy-Runtime-Alias. Führen Sie `openclaw doctor --fix` aus, um persistierte Konfiguration auf den kanonischen Schlüssel umzuschreiben.

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
    - `block` gibt Entwurfsblöcke aus (verwenden Sie `draftChunk`, um Größe und Umbruchpunkte abzustimmen, begrenzt durch `textChunkLimit`).
    - Medien, Fehler und endgültige explizite Antworten brechen ausstehende Vorschaubearbeitungen ab.
    - `streaming.preview.toolProgress` (Standard `true`) steuert, ob Tool-/Fortschrittsaktualisierungen die Vorschaunachricht wiederverwenden.
    - Tool-/Fortschrittszeilen werden, sofern verfügbar, als kompakte Emoji + Titel + Detail gerendert, zum Beispiel `🛠️ Bash: run tests` oder `🔎 Web Search: for "query"`.
    - `streaming.progress.commentary` (Standard `false`) aktiviert Assistentenkommentar-/Präambeltext im temporären Fortschrittsentwurf. Kommentare werden vor der Anzeige bereinigt, bleiben transient und ändern die endgültige Antwortzustellung nicht.
    - `streaming.progress.maxLineChars` steuert das Budget pro Zeile für die Fortschrittsvorschau. Fließtext wird an Wortgrenzen gekürzt; Befehls- und Pfaddetails behalten nützliche Suffixe.
    - `streaming.preview.commandText` / `streaming.progress.commandText` steuert Befehls-/Exec-Details in kompakten Fortschrittszeilen: `raw` (Standard) oder `status` (nur Tool-Label).

    Blenden Sie rohen Befehls-/Exec-Text aus, während kompakte Fortschrittszeilen erhalten bleiben:

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

    Vorschau-Streaming ist nur Text; Medienantworten fallen auf normale Zustellung zurück. Wenn `block`-Streaming explizit aktiviert ist, überspringt OpenClaw den Vorschau-Stream, um doppeltes Streaming zu vermeiden.

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

    - Discord-Threads werden als Kanalsitzungen weitergeleitet und erben die Konfiguration des übergeordneten Kanals, sofern sie nicht überschrieben wird.
    - Thread-Sitzungen erben die `/model`-Auswahl auf Sitzungsebene des übergeordneten Kanals als reinen Modell-Fallback; thread-lokale `/model`-Auswahlen haben weiterhin Vorrang, und der Verlauf des übergeordneten Transkripts wird nicht kopiert, sofern Transkriptvererbung nicht aktiviert ist.
    - `channels.discord.thread.inheritParent` (Standard `false`) aktiviert für neue Auto-Threads das Seed aus dem übergeordneten Transkript. Kontoüberschreibungen befinden sich unter `channels.discord.accounts.<id>.thread.inheritParent`.
    - Message-Tool-Reaktionen können `user:<id>`-DM-Ziele auflösen.
    - `guilds.<guild>.channels.<channel>.requireMention: false` bleibt während des Fallbacks der Reply-Stage-Aktivierung erhalten.

    Kanalthemen werden als **nicht vertrauenswürdiger** Kontext injiziert. Allowlists steuern, wer den Agenten auslösen kann, sind aber keine vollständige Redaktionsgrenze für zusätzlichen Kontext.

  </Accordion>

  <Accordion title="Thread-gebundene Sitzungen für Subagenten">
    Discord kann einen Thread an ein Sitzungsziel binden, sodass Folgenachrichten in diesem Thread weiterhin an dieselbe Sitzung weitergeleitet werden (einschließlich Subagenten-Sitzungen).

    Befehle:

    - `/focus <target>` aktuellen/neuen Thread an ein Subagenten-/Sitzungsziel binden
    - `/unfocus` aktuelle Thread-Bindung entfernen
    - `/agents` aktive Läufe und Bindungsstatus anzeigen
    - `/session idle <duration|off>` automatische Inaktivitäts-Entfokussierung für fokussierte Bindings prüfen/aktualisieren
    - `/session max-age <duration|off>` harte maximale Lebensdauer für fokussierte Bindings prüfen/aktualisieren

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
    - `defaultSpawnContext` steuert nativen Subagenten-Kontext für Thread-gebundene Spawns. Standard: `"fork"`.
    - Veraltete Schlüssel `spawnSubagentSessions`/`spawnAcpSessions` werden durch `openclaw doctor --fix` migriert.
    - Wenn Thread-Bindings für ein Konto deaktiviert sind, sind `/focus` und zugehörige Thread-Binding-Operationen nicht verfügbar.

    Siehe [Subagenten](/de/tools/subagents), [ACP-Agenten](/de/tools/acp-agents) und [Konfigurationsreferenz](/de/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Persistente ACP-Kanal-Bindings">
    Konfigurieren Sie für stabile „always-on“-ACP-Arbeitsbereiche typisierte ACP-Bindings auf oberster Ebene, die auf Discord-Unterhaltungen zielen.

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

    - `/acp spawn codex --bind here` bindet den aktuellen Kanal oder Thread an Ort und Stelle und hält zukünftige Nachrichten auf derselben ACP-Sitzung. Thread-Nachrichten erben das Binding des übergeordneten Kanals.
    - In einem gebundenen Kanal oder Thread setzen `/new` und `/reset` dieselbe ACP-Sitzung an Ort und Stelle zurück. Temporäre Thread-Bindings können die Zielauflösung überschreiben, solange sie aktiv sind.
    - `spawnSessions` steuert die Erstellung/Bindung von Child-Threads über `--thread auto|here`.

    Siehe [ACP-Agenten](/de/tools/acp-agents) für Details zum Binding-Verhalten.

  </Accordion>

  <Accordion title="Reaktionsbenachrichtigungen">
    Reaktionsbenachrichtigungsmodus pro Guild:

    - `off`
    - `own` (Standard)
    - `all`
    - `allowlist` (verwendet `guilds.<id>.users`)

    Reaktionsereignisse werden in Systemereignisse umgewandelt und an die weitergeleitete Discord-Sitzung angehängt.

  </Accordion>

  <Accordion title="Ack-Reaktionen">
    `ackReaction` sendet ein Bestätigungs-Emoji, während OpenClaw eine eingehende Nachricht verarbeitet.

    Auflösungsreihenfolge:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - Agentenidentitäts-Emoji-Fallback (`agents.list[].identity.emoji`, sonst "👀")

    Hinweise:

    - Discord akzeptiert Unicode-Emoji oder benutzerdefinierte Emoji-Namen.
    - Verwenden Sie `""`, um die Reaktion für einen Kanal oder ein Konto zu deaktivieren.

  </Accordion>

  <Accordion title="Konfigurationsschreibvorgänge">
    Kanalinitiierte Konfigurationsschreibvorgänge sind standardmäßig aktiviert.

    Dies betrifft `/config set|unset`-Flows (wenn Befehlsfeatures aktiviert sind).

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
    Leiten Sie Discord-Gateway-WebSocket-Traffic und REST-Lookups beim Start (Anwendungs-ID + Allowlist-Auflösung) über einen HTTP(S)-Proxy mit `channels.discord.proxy`.

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
    Aktivieren Sie die PluralKit-Auflösung, um proxied Nachrichten der Systemmitgliedsidentität zuzuordnen:

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

    - Zulassungslisten können `pk:<memberId>` verwenden
    - Anzeigenamen von Mitgliedern werden nur nach Name/Slug abgeglichen, wenn `channels.discord.dangerouslyAllowNameMatching: true`
    - Lookups verwenden die ursprüngliche Nachrichten-ID und sind zeitfensterbeschränkt
    - wenn der Lookup fehlschlägt, werden weitergeleitete Nachrichten als Bot-Nachrichten behandelt und verworfen, sofern nicht `allowBots=true`

  </Accordion>

  <Accordion title="Ausgehende Erwähnungs-Aliasse">
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
    Präsenzaktualisierungen werden angewendet, wenn Sie ein Status- oder Aktivitätsfeld festlegen oder automatische Präsenz aktivieren.

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

    Aktivitätstyp-Zuordnung:

    - 0: Spielen
    - 1: Streaming (erfordert `activityUrl`)
    - 2: Zuhören
    - 3: Zuschauen
    - 4: Benutzerdefiniert (verwendet den Aktivitätstext als Statuszustand; Emoji ist optional)
    - 5: An Wettkampf teilnehmen

    Beispiel für automatische Präsenz (Runtime-Integritätssignal):

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

    Automatische Präsenz ordnet die Runtime-Verfügbarkeit dem Discord-Status zu: gesund => online, beeinträchtigt oder unbekannt => idle, erschöpft oder nicht verfügbar => dnd. Optionale Textüberschreibungen:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (unterstützt den Platzhalter `{reason}`)

  </Accordion>

  <Accordion title="Genehmigungen in Discord">
    Discord unterstützt schaltflächenbasierte Genehmigungsabwicklung in DMs und kann optional Genehmigungsaufforderungen im ursprünglichen Kanal posten.

    Konfigurationspfad:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (optional; fällt nach Möglichkeit auf `commands.ownerAllowFrom` zurück)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, Standard: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord aktiviert native Exec-Genehmigungen automatisch, wenn `enabled` nicht gesetzt oder `"auto"` ist und mindestens ein Genehmigender aufgelöst werden kann, entweder aus `execApprovals.approvers` oder aus `commands.ownerAllowFrom`. Discord leitet Exec-Genehmigende nicht aus Kanal-`allowFrom`, veraltetem `dm.allowFrom` oder Direktnachrichten-`defaultTo` ab. Setzen Sie `enabled: false`, um Discord explizit als nativen Genehmigungsclient zu deaktivieren.

    Für sensible, nur Ownern vorbehaltene Gruppenbefehle wie `/diagnostics` und `/export-trajectory` sendet OpenClaw Genehmigungsaufforderungen und Endergebnisse privat. Es versucht zuerst Discord-DM, wenn der aufrufende Owner eine Discord-Owner-Route hat; wenn diese nicht verfügbar ist, fällt es auf die erste verfügbare Owner-Route aus `commands.ownerAllowFrom` zurück, etwa Telegram.

    Wenn `target` `channel` oder `both` ist, ist die Genehmigungsaufforderung im Kanal sichtbar. Nur aufgelöste Genehmigende können die Schaltflächen verwenden; andere Benutzer erhalten eine flüchtige Ablehnung. Genehmigungsaufforderungen enthalten den Befehlstext, aktivieren Sie die Kanalzustellung daher nur in vertrauenswürdigen Kanälen. Wenn die Kanal-ID nicht aus dem Sitzungsschlüssel abgeleitet werden kann, fällt OpenClaw auf DM-Zustellung zurück.

    Discord rendert außerdem die gemeinsam genutzten Genehmigungsschaltflächen, die von anderen Chat-Kanälen verwendet werden. Der native Discord-Adapter fügt hauptsächlich DM-Routing für Genehmigende und Kanal-Fanout hinzu.
    Wenn diese Schaltflächen vorhanden sind, sind sie die primäre Genehmigungs-UX; OpenClaw
    sollte nur dann einen manuellen `/approve`-Befehl einfügen, wenn das Tool-Ergebnis angibt,
    dass Chat-Genehmigungen nicht verfügbar sind oder manuelle Genehmigung der einzige Weg ist.
    Wenn die native Discord-Genehmigungs-Runtime nicht aktiv ist, hält OpenClaw die
    lokale deterministische Aufforderung `/approve <id> <decision>` sichtbar. Wenn die
    Runtime aktiv ist, aber keine native Karte an ein Ziel zugestellt werden kann,
    sendet OpenClaw einen Fallback-Hinweis im selben Chat mit dem exakten `/approve`-
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

| Aktionsgruppe                                                                                                                                                           | Standard    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | aktiviert   |
| roles                                                                                                                                                                    | deaktiviert |
| moderation                                                                                                                                                               | deaktiviert |
| presence                                                                                                                                                                 | deaktiviert |

## Components-v2-UI

OpenClaw verwendet Discord-Komponenten v2 für Exec-Genehmigungen und kontextübergreifende Marker. Discord-Nachrichtenaktionen können auch `components` für benutzerdefinierte UI akzeptieren (fortgeschritten; erfordert das Erstellen einer Komponenten-Payload über das Discord-Tool), während ältere `embeds` weiterhin verfügbar sind, aber nicht empfohlen werden.

- `channels.discord.ui.components.accentColor` legt die Akzentfarbe fest, die von Discord-Komponentencontainern verwendet wird (Hex).
- Legen Sie dies pro Konto mit `channels.discord.accounts.<id>.ui.components.accentColor` fest.
- `channels.discord.agentComponents.ttlMs` steuert, wie lange gesendete Discord-Komponenten-Callbacks registriert bleiben (Standard `1800000`, Maximum `86400000`). Legen Sie dies pro Konto mit `channels.discord.accounts.<id>.agentComponents.ttlMs` fest.
- `embeds` werden ignoriert, wenn Komponenten v2 vorhanden sind.
- Einfache URL-Vorschauen werden standardmäßig unterdrückt. Setzen Sie `suppressEmbeds: false` für eine Nachrichtenaktion, wenn ein einzelner ausgehender Link erweitert werden soll.

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

Discord hat zwei unterschiedliche Sprachoberflächen: Echtzeit-**Sprachkanäle** (fortlaufende Unterhaltungen) und **Sprachnachrichtenanhänge** (das Wellenform-Vorschauformat). Der Gateway unterstützt beides.

### Sprachkanäle

Einrichtungs-Checkliste:

1. Aktivieren Sie Message Content Intent im Discord Developer Portal.
2. Aktivieren Sie Server Members Intent, wenn Rollen-/Benutzer-Allowlists verwendet werden.
3. Laden Sie den Bot mit den Scopes `bot` und `applications.commands` ein.
4. Erteilen Sie im Ziel-Sprachkanal Connect, Speak, Send Messages und Read Message History.
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

- `voice.tts` überschreibt `messages.tts` nur für die `stt-tts`-Sprachwiedergabe. Echtzeitmodi verwenden `voice.realtime.speakerVoice`.
- `voice.mode` steuert den Gesprächspfad. Der Standard ist `agent-proxy`: Ein Echtzeit-Sprach-Frontend verarbeitet Turn-Timing, Unterbrechung und Wiedergabe, delegiert inhaltliche Arbeit über `openclaw_agent_consult` an den gerouteten OpenClaw-Agenten und behandelt das Ergebnis wie einen getippten Discord-Prompt von dieser sprechenden Person. `stt-tts` behält den älteren Batch-STT-plus-TTS-Ablauf bei. `bidi` lässt das Echtzeitmodell direkt konversieren und stellt zugleich `openclaw_agent_consult` für die OpenClaw-Logik bereit.
- `voice.agentSession` steuert, welche OpenClaw-Konversation Sprach-Turns erhält. Lassen Sie es nicht gesetzt, um die eigene Sitzung des Sprachkanals zu verwenden, oder setzen Sie `{ mode: "target", target: "channel:<text-channel-id>" }`, damit der Sprachkanal als Mikrofon-/Lautsprecher-Erweiterung einer bestehenden Discord-Textkanalsitzung wie `#maintainers` fungiert.
- `voice.model` überschreibt die OpenClaw-Agentenlogik für Discord-Sprachantworten und Echtzeit-Consults. Lassen Sie es nicht gesetzt, um das geroutete Agentenmodell zu erben. Es ist von `voice.realtime.model` getrennt.
- `voice.followUsers` ermöglicht dem Bot, Discord-Sprachkanälen mit ausgewählten Benutzern beizutreten, zwischen ihnen zu wechseln und sie zu verlassen. Siehe [Benutzern in Sprache folgen](#follow-users-in-voice) für Verhaltensregeln und Beispiele.
- `agent-proxy` leitet Sprache über `discord-voice`, wodurch die normale Owner-/Tool-Autorisierung für die sprechende Person und die Zielsitzung erhalten bleibt, das Agenten-Tool `tts` aber verborgen wird, weil Discord-Sprache die Wiedergabe besitzt. Standardmäßig gibt `agent-proxy` dem Consult für Owner-Sprecher vollständigen owner-äquivalenten Tool-Zugriff (`voice.realtime.toolPolicy: "owner"`) und bevorzugt nachdrücklich, vor inhaltlichen Antworten den OpenClaw-Agenten zu konsultieren (`voice.realtime.consultPolicy: "always"`). In diesem Standardmodus `always` spricht die Echtzeitebene vor der Consult-Antwort keinen Fülltext automatisch aus; sie erfasst und transkribiert Sprache und spricht dann die geroutete OpenClaw-Antwort. Wenn mehrere erzwungene Consult-Antworten fertig werden, während Discord noch die erste Antwort abspielt, werden spätere Antworten mit exakter Sprache in die Warteschlange gestellt, bis die Wiedergabe inaktiv ist, statt Sprache mitten im Satz zu ersetzen.
- Im Modus `stt-tts` verwendet STT `tools.media.audio`; `voice.model` beeinflusst die Transkription nicht.
- In Echtzeitmodi konfigurieren `voice.realtime.provider`, `voice.realtime.model` und `voice.realtime.speakerVoice` die Echtzeit-Audiositzung. Verwenden Sie für OpenAI Realtime 2 plus die Codex-Logik `voice.realtime.model: "gpt-realtime-2"` und `voice.model: "openai/gpt-5.5"`.
- Echtzeit-Sprachmodi schließen standardmäßig kleine Profildateien `IDENTITY.md`, `USER.md` und `SOUL.md` in die Echtzeit-Provider-Anweisungen ein, damit schnelle direkte Turns dieselbe Identität, Benutzerverankerung und Persona wie der geroutete OpenClaw-Agent behalten. Setzen Sie `voice.realtime.bootstrapContextFiles` auf eine Teilmenge, um dies anzupassen, oder auf `[]`, um es zu deaktivieren. Die unterstützten Echtzeit-Bootstrap-Dateien sind auf diese Profildateien beschränkt; `AGENTS.md` bleibt im normalen Agentenkontext. Der injizierte Profilkontext ersetzt `openclaw_agent_consult` nicht für Workspace-Arbeit, aktuelle Fakten, Speicherabfragen oder toolgestützte Aktionen.
- Setzen Sie im OpenAI-`agent-proxy`-Echtzeitmodus `voice.realtime.requireWakeName: true`, damit Discord-Echtzeitsprache stumm bleibt, bis ein Transkript mit einem Aktivierungsnamen beginnt oder endet. Konfigurierte Aktivierungsnamen müssen aus einem oder zwei Wörtern bestehen. Wenn `voice.realtime.wakeNames` nicht gesetzt ist, verwendet OpenClaw den gerouteten Agenten-`name` plus `OpenClaw` und fällt andernfalls auf die Agenten-ID plus `OpenClaw` zurück. Aktivierungsnamen-Gating deaktiviert automatische Antworten des Echtzeit-Providers, leitet akzeptierte Turns über den OpenClaw-Agent-Consult-Pfad und gibt eine kurze gesprochene Bestätigung, wenn ein vorangestellter Aktivierungsname aus einer Teiltranskription erkannt wird, bevor das finale Transkript eintrifft.
- Der OpenAI-Echtzeit-Provider akzeptiert aktuelle Realtime-2-Ereignisnamen und alte Codex-kompatible Aliasse für Ausgabeaudio- und Transkriptereignisse, sodass kompatible Provider-Snapshots abweichen können, ohne Assistentenaudio zu verlieren.
- `voice.realtime.bargeIn` steuert, ob Discord-Sprecherstart-Ereignisse aktive Echtzeitwiedergabe unterbrechen. Wenn nicht gesetzt, folgt es der Input-Audio-Unterbrechungseinstellung des Echtzeit-Providers.
- `voice.realtime.minBargeInAudioEndMs` steuert die minimale Dauer der Assistentenwiedergabe, bevor ein OpenAI-Echtzeit-Barge-in Audio abschneidet. Standard: `250`. Setzen Sie `0` für sofortige Unterbrechung in Räumen mit wenig Echo, oder erhöhen Sie den Wert für Lautsprecher-Setups mit viel Echo.
- Setzen Sie für eine OpenAI-Stimme bei Discord-Wiedergabe `voice.tts.provider: "openai"` und wählen Sie unter `voice.tts.providers.openai.speakerVoice` eine Text-to-Speech-Stimme. `cedar` ist beim aktuellen OpenAI-TTS-Modell eine gute maskulin klingende Wahl.
- Pro-Kanal-Discord-Überschreibungen für `systemPrompt` gelten für Sprachtranskript-Turns dieses Sprachkanals.
- Sprachtranskript-Turns leiten den Owner-Status für owner-gesteuerte Befehle und Kanalaktionen aus Discord `allowFrom` (oder `dm.allowFrom`) ab. Die Sichtbarkeit von Agenten-Tools folgt der konfigurierten Tool-Richtlinie für die geroutete Sitzung.
- Discord-Sprache ist für reine Textkonfigurationen Opt-in; setzen Sie `channels.discord.voice.enabled=true` (oder behalten Sie einen bestehenden `channels.discord.voice`-Block), um `/vc`-Befehle, die Sprachruntime und den Gateway-Intent `GuildVoiceStates` zu aktivieren.
- `channels.discord.intents.voiceStates` kann das Abonnement für den Voice-State-Intent explizit überschreiben. Lassen Sie es nicht gesetzt, damit der Intent der effektiven Sprachaktivierung folgt.
- Wenn `voice.autoJoin` mehrere Einträge für dieselbe Guild enthält, tritt OpenClaw dem zuletzt konfigurierten Kanal für diese Guild bei.
- `voice.allowedChannels` ist eine optionale Residenz-Allowlist. Lassen Sie es nicht gesetzt, um `/vc join` in jeden autorisierten Discord-Sprachkanal zu erlauben. Wenn gesetzt, sind `/vc join`, automatischer Beitritt beim Start und Voice-State-Verschiebungen des Bots auf die aufgeführten Einträge `{ guildId, channelId }` beschränkt. Setzen Sie es auf ein leeres Array, um alle Discord-Sprachbeitritte zu verweigern. Wenn Discord den Bot außerhalb der Allowlist verschiebt, verlässt OpenClaw diesen Kanal und tritt wieder dem konfigurierten Auto-Join-Ziel bei, sofern eines verfügbar ist.
- `voice.daveEncryption` und `voice.decryptionFailureTolerance` werden an die Join-Optionen von `@discordjs/voice` durchgereicht.
- Die Standardwerte von `@discordjs/voice` sind `daveEncryption=true` und `decryptionFailureTolerance=24`, wenn sie nicht gesetzt sind.
- OpenClaw verwendet den gebündelten Codec `libopus-wasm` für Discord-Sprachempfang und rohe PCM-Echtzeitwiedergabe. Es liefert einen fest gepinnten libopus-WebAssembly-Build mit und benötigt keine nativen Opus-Add-ons.
- `voice.connectTimeoutMs` steuert die anfängliche `@discordjs/voice`-Ready-Wartezeit für `/vc join` und Auto-Join-Versuche. Standard: `30000`.
- `voice.reconnectGraceMs` steuert, wie lange OpenClaw wartet, bis eine getrennte Sprachsitzung mit der Wiederverbindung beginnt, bevor sie zerstört wird. Standard: `15000`.
- Im Modus `stt-tts` stoppt die Sprachwiedergabe nicht nur deshalb, weil ein anderer Benutzer zu sprechen beginnt. Um Feedback-Schleifen zu vermeiden, ignoriert OpenClaw neue Spracherfassung, während TTS abgespielt wird; sprechen Sie nach Ende der Wiedergabe für den nächsten Turn. Echtzeitmodi leiten Sprecherstarts als Barge-in-Signale an den Echtzeit-Provider weiter.
- In Echtzeitmodi kann Echo von Lautsprechern in ein offenes Mikrofon wie Barge-in wirken und die Wiedergabe unterbrechen. Setzen Sie für Discord-Räume mit viel Echo `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`, damit OpenAI bei Input-Audio nicht automatisch unterbricht. Fügen Sie `voice.realtime.bargeIn: true` hinzu, wenn Discord-Sprecherstart-Ereignisse aktive Wiedergabe weiterhin unterbrechen sollen. Die OpenAI-Echtzeit-Bridge ignoriert Wiedergabeabschneidungen, die kürzer als `voice.realtime.minBargeInAudioEndMs` sind, als wahrscheinliches Echo/Rauschen und protokolliert sie als übersprungen, statt die Discord-Wiedergabe zu leeren.
- `voice.captureSilenceGraceMs` steuert, wie lange OpenClaw wartet, nachdem Discord gemeldet hat, dass ein Sprecher aufgehört hat, bevor dieses Audiosegment für STT finalisiert wird. Standard: `2000`; erhöhen Sie diesen Wert, wenn Discord normale Pausen in abgehackte Teiltranskripte aufteilt.
- Wenn ElevenLabs der ausgewählte TTS-Provider ist, verwendet Discord-Sprachwiedergabe Streaming-TTS und startet aus dem Antwortstream des Providers. Provider ohne Streaming-Unterstützung fallen auf den synthetisierten Temp-Datei-Pfad zurück.
- OpenClaw überwacht außerdem Entschlüsselungsfehler beim Empfang und stellt die Verbindung automatisch wieder her, indem es den Sprachkanal nach wiederholten Fehlern in einem kurzen Zeitfenster verlässt und wieder betritt.
- Wenn Empfangslogs nach einem Update wiederholt `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` zeigen, sammeln Sie einen Abhängigkeitsbericht und Logs. Die gebündelte `@discordjs/voice`-Linie enthält den Upstream-Padding-Fix aus discord.js-PR #11449, der discord.js-Issue #11419 geschlossen hat.
- Empfangsereignisse `The operation was aborted` werden erwartet, wenn OpenClaw ein erfasstes Sprechersegment finalisiert; sie sind ausführliche Diagnosedaten, keine Warnungen.
- Ausführliche Discord-Sprachlogs enthalten für jedes akzeptierte Sprechersegment eine begrenzte einzeilige STT-Transkriptvorschau, sodass das Debugging sowohl die Benutzerseite als auch die Agentenantwortseite zeigt, ohne unbegrenzten Transkripttext auszugeben.
- Im Modus `agent-proxy` überspringt der erzwungene Consult-Fallback wahrscheinlich unvollständige Transkriptfragmente wie Text, der mit `...` endet, oder einen nachgestellten Konnektor wie `and`, sowie offensichtlich nicht umsetzbare Abschlüsse wie „bin gleich zurück“ oder „tschüss“. Logs zeigen `forced agent consult skipped reason=...`, wenn dadurch eine veraltete Antwort in der Warteschlange verhindert wird.

### Benutzern in Sprache folgen

Verwenden Sie `voice.followUsers`, wenn der Discord-Sprach-Bot bei einem oder mehreren bekannten Discord-Benutzern bleiben soll, statt beim Start einem festen Kanal beizutreten oder auf `/vc join` zu warten.

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

- `followUsers` akzeptiert rohe Discord-Benutzer-IDs und Werte der Form `discord:<id>`. OpenClaw normalisiert beide Formen, bevor Voice-State-Ereignisse abgeglichen werden.
- `followUsersEnabled` ist standardmäßig `true`, wenn `followUsers` konfiguriert ist. Setzen Sie es auf `false`, um die gespeicherte Liste beizubehalten, aber das automatische Folgen in Sprachkanälen zu stoppen.
- Wenn ein verfolgter Benutzer einem erlaubten Sprachkanal beitritt, tritt OpenClaw diesem Kanal bei. Wenn der Benutzer wechselt, wechselt OpenClaw mit. Wenn der aktiv verfolgte Benutzer die Verbindung trennt, verlässt OpenClaw den Kanal.
- Wenn mehrere verfolgte Benutzer in derselben Guild sind und der aktiv verfolgte Benutzer geht, wechselt OpenClaw zum Kanal eines anderen verfolgten Benutzers, bevor es die Guild verlässt. Wenn mehrere verfolgte Benutzer gleichzeitig wechseln, gewinnt das zuletzt beobachtete Voice-State-Ereignis.
- `allowedChannels` gilt weiterhin. Ein verfolgter Benutzer in einem nicht erlaubten Kanal wird ignoriert, und eine Follow-eigene Sitzung wechselt zu einem anderen verfolgten Benutzer oder verlässt den Kanal.
- OpenClaw gleicht verpasste Voice-State-Ereignisse beim Start und in einem begrenzten Intervall ab. Der Abgleich beprobt konfigurierte Guilds und begrenzt REST-Lookups pro Lauf, sodass sehr große `followUsers`-Listen mehr als ein Intervall benötigen können, um zu konvergieren.
- Wenn Discord oder ein Admin den Bot verschiebt, während er einem Benutzer folgt, baut OpenClaw die Sprachsitzung neu auf und behält die Follow-Ownership bei, wenn das Ziel erlaubt ist. Wenn der Bot außerhalb von `allowedChannels` verschoben wird, verlässt OpenClaw den Kanal und tritt dem konfigurierten Ziel wieder bei, sofern eines existiert.
- DAVE-Empfangswiederherstellung kann denselben Kanal nach wiederholten Entschlüsselungsfehlern verlassen und wieder betreten. Follow-eigene Sitzungen behalten ihre Follow-Ownership über diesen Wiederherstellungspfad hinweg, sodass eine spätere Trennung des verfolgten Benutzers den Kanal weiterhin verlässt.

Wählen Sie zwischen den Beitrittsmodi:

- Verwenden Sie `followUsers` für persönliche oder Operator-Setups, bei denen der Bot automatisch im Sprachkanal sein soll, wenn Sie es sind.
- Verwenden Sie `autoJoin` für Bots in festen Räumen, die auch dann anwesend sein sollen, wenn kein verfolgter Benutzer im Sprachkanal ist.
- Verwenden Sie `/vc join` für einmalige Beitritte oder Räume, in denen automatische Sprachanwesenheit überraschend wäre.

Discord-Sprachcodec:

- Sprach-Empfangslogs zeigen `discord voice: opus decoder: libopus-wasm`.
- Realtime-Wiedergabe codiert rohes 48-kHz-Stereo-PCM mit demselben gebündelten Paket `libopus-wasm` zu Opus, bevor Pakete an `@discordjs/voice` übergeben werden.
- Datei- und Provider-Stream-Wiedergabe transcodiert mit ffmpeg zu rohem 48-kHz-Stereo-PCM und verwendet dann `libopus-wasm` für den an Discord gesendeten Opus-Paketstrom.

STT-plus-TTS-Pipeline:

- Discord-PCM-Erfassung wird in eine temporäre WAV-Datei konvertiert.
- `tools.media.audio` übernimmt STT, zum Beispiel `openai/gpt-4o-mini-transcribe`.
- Das Transkript wird über Discord-Eingang und Routing gesendet, während das Antwort-LLM mit einer Sprachausgabe-Richtlinie läuft, die das Agent-Tool `tts` verbirgt und zurückgegebenen Text anfordert, weil Discord Voice die finale TTS-Wiedergabe besitzt.
- `voice.model` überschreibt, wenn gesetzt, nur das Antwort-LLM für diesen Sprachkanal-Turn.
- `voice.tts` wird über `messages.tts` zusammengeführt; streamingfähige Provider speisen den Player direkt, andernfalls wird die resultierende Audiodatei im beigetretenen Kanal abgespielt.

Standardbeispiel für eine Agent-Proxy-Sprachkanal-Sitzung:

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

Ohne Block `voice.agentSession` erhält jeder Sprachkanal seine eigene geroutete OpenClaw-Sitzung. Zum Beispiel spricht `/vc join channel:234567890123456789` mit der Sitzung für diesen Discord-Sprachkanal. Das Realtime-Modell ist nur die Sprach-Frontend-Komponente; inhaltliche Anfragen werden an den konfigurierten OpenClaw-Agenten übergeben. Wenn das Realtime-Modell ein finales Transkript erzeugt, ohne das Consult-Tool aufzurufen, erzwingt OpenClaw den Consult als Fallback, sodass die Standardeinstellung sich weiterhin wie ein Gespräch mit dem Agenten verhält.

Legacy-Beispiel für STT plus TTS:

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

Realtime-Bidi-Beispiel:

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

Sprache als Erweiterung einer bestehenden Discord-Kanalsitzung:

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

Im Modus `agent-proxy` tritt der Bot dem konfigurierten Sprachkanal bei, aber OpenClaw-Agent-Turns verwenden die normale geroutete Sitzung und den Agenten des Zielkanals. Die Realtime-Sprachsitzung spricht das zurückgegebene Ergebnis wieder in den Sprachkanal. Der Supervisor-Agent kann entsprechend seiner Tool-Richtlinie weiterhin normale Nachrichtentools verwenden, einschließlich des Sendens einer separaten Discord-Nachricht, wenn dies die richtige Aktion ist.

Während ein delegierter OpenClaw-Lauf aktiv ist, werden neue Discord-Sprachtranskripte als Live-Laufsteuerung behandelt, bevor ein weiterer Agent-Turn gestartet wird. Ausdrücke wie „Status“, „das abbrechen“, „verwenden Sie die kleinere Korrektur“ oder „wenn Sie fertig sind, prüfen Sie auch die Tests“ werden als Status-, Abbruch-, Steuerungs- oder Folgeeingabe für die aktive Sitzung klassifiziert. Status-, Abbruch-, akzeptierte Steuerungs- und Folgeergebnisse werden in den Sprachkanal zurückgesprochen, damit der Anrufer weiß, ob OpenClaw die Anfrage verarbeitet hat.

Nützliche Zielformen:

- `target: "channel:123456789012345678"` routet über eine Discord-Textkanalsitzung.
- `target: "123456789012345678"` wird als Kanalziel behandelt.
- `target: "dm:123456789012345678"` oder `target: "user:123456789012345678"` routet über diese Direktnachrichtensitzung.

Echo-lastiges OpenAI-Realtime-Beispiel:

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

Verwenden Sie dies, wenn das Modell seine eigene Discord-Wiedergabe über ein offenes Mikrofon hört, Sie es aber weiterhin durch Sprechen unterbrechen möchten. OpenClaw verhindert, dass OpenAI bei rohem Eingabeaudio automatisch unterbricht, während `bargeIn: true` zulässt, dass Discord-Sprecherstart-Ereignisse und bereits aktive Sprecher-Audiodaten aktive Realtime-Antworten abbrechen, bevor der nächste erfasste Turn OpenAI erreicht. Sehr frühe Barge-in-Signale mit `audioEndMs` unter `minBargeInAudioEndMs` werden als wahrscheinliches Echo/Rauschen behandelt und ignoriert, damit das Modell nicht beim ersten Wiedergabe-Frame abgeschnitten wird.

Erwartete Sprachlogs:

- Beim Beitreten: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- Beim Realtime-Start: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- Bei Sprecher-Audio: `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...` und `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- Bei übersprungener veralteter Sprache: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` oder `reason=non-actionable-closing ...`
- Bei Abschluss der Realtime-Antwort: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- Bei Wiedergabestopp/-zurücksetzung: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- Bei Realtime-Consult: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- Bei Agent-Antwort: `discord voice: agent turn answer ...`
- Bei eingereihter exakter Sprache: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`, gefolgt von `discord voice: realtime exact speech dequeued reason=player-idle ...`
- Bei Barge-in-Erkennung: `discord voice: realtime barge-in detected source=speaker-start ...` oder `discord voice: realtime barge-in detected source=active-speaker-audio ...`, gefolgt von `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- Bei Realtime-Unterbrechung: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`, gefolgt entweder von `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` oder `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- Bei ignoriertem Echo/Rauschen: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- Bei deaktiviertem Barge-in: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- Bei inaktiver Wiedergabe: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

Zum Debuggen abgeschnittener Audiodaten lesen Sie die Realtime-Sprachlogs als Zeitachse:

1. `realtime audio playback started` bedeutet, dass Discord mit der Wiedergabe von Assistenten-Audio begonnen hat. Die Bridge beginnt ab diesem Punkt, Ausgabefragmente des Assistenten, Discord-PCM-Bytes, Provider-Realtime-Bytes und die synthetisierte Audiodauer zu zählen.
2. `realtime speaker turn opened` markiert, dass ein Discord-Sprecher aktiv wird. Wenn die Wiedergabe bereits aktiv ist und `bargeIn` aktiviert ist, kann darauf `barge-in detected source=speaker-start` folgen.
3. `realtime input audio started` markiert den ersten tatsächlich empfangenen Audio-Frame für diesen Sprecher-Turn. `outputActive=true` oder ein von null verschiedener Wert für `outputAudioMs` bedeutet hier, dass das Mikrofon Eingaben sendet, während die Assistenten-Wiedergabe noch aktiv ist.
4. `barge-in detected source=active-speaker-audio` bedeutet, dass OpenClaw Live-Sprecher-Audio gesehen hat, während die Assistenten-Wiedergabe aktiv war. Dies ist nützlich, um eine echte Unterbrechung von einem Discord-Sprecherstart-Ereignis ohne nützliche Audiodaten zu unterscheiden.
5. `barge-in requested reason=...` bedeutet, dass OpenClaw den Realtime-Provider aufgefordert hat, die aktive Antwort abzubrechen oder zu kürzen. Es enthält `outputAudioMs`, `outputActive` und `playbackChunks`, sodass Sie sehen können, wie viel Assistenten-Audio vor der Unterbrechung tatsächlich abgespielt wurde.
6. `realtime audio playback stopped reason=...` ist der lokale Zurücksetzungspunkt der Discord-Wiedergabe. Der Grund sagt, wer die Wiedergabe gestoppt hat: `barge-in`, `player-idle`, `provider-clear-audio`, `forced-agent-consult`, `stream-close` oder `session-close`.
7. `realtime speaker turn closed` fasst den erfassten Eingabe-Turn zusammen. `chunks=0` oder `hasAudio=false` bedeutet, dass der Sprecher-Turn geöffnet wurde, aber keine nutzbaren Audiodaten die Realtime-Bridge erreicht haben. `interruptedPlayback=true` bedeutet, dass dieser Eingabe-Turn die Assistenten-Ausgabe überlappt und Barge-in-Logik ausgelöst hat.

Nützliche Felder:

- `outputAudioMs`: vom Realtime-Provider vor der Logzeile generierte Assistenten-Audiodauer.
- `audioMs`: Assistenten-Audiodauer, die OpenClaw vor dem Wiedergabestopp gezählt hat.
- `elapsedMs`: Wanduhrzeit zwischen Öffnen und Schließen des Wiedergabestreams oder Sprecher-Turns.
- `discordBytes`: an Discord Voice gesendete oder von Discord Voice empfangene 48-kHz-Stereo-PCM-Bytes.
- `realtimeBytes`: PCM-Bytes im Provider-Format, die an den Realtime-Provider gesendet oder von ihm empfangen wurden.
- `playbackChunks`: Assistenten-Audiofragmente, die für die aktive Antwort an Discord weitergeleitet wurden.
- `sinceLastAudioMs`: Abstand zwischen dem letzten erfassten Sprecher-Audio-Frame und dem Schließen des Sprecher-Turns.

Häufige Muster:

- Sofortiges Abschneiden mit `source=active-speaker-audio`, kleinem `outputAudioMs` und demselben Benutzer in der Nähe deutet in der Regel darauf hin, dass Lautsprecher-Echo ins Mikrofon gelangt. Erhöhen Sie `voice.realtime.minBargeInAudioEndMs`, verringern Sie die Lautsprecherlautstärke, verwenden Sie Kopfhörer oder setzen Sie `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`.
- `source=speaker-start` gefolgt von `speaker turn closed ... hasAudio=false` bedeutet, dass Discord einen Sprecherstart gemeldet hat, aber keine Audiodaten OpenClaw erreicht haben. Das kann ein vorübergehendes Discord-Voice-Ereignis, Noise-Gate-Verhalten oder ein Client sein, der das Mikrofon kurz aktiviert.
- `audio playback stopped reason=stream-close` ohne nahegelegenes Barge-in oder `provider-clear-audio` bedeutet, dass der lokale Discord-Wiedergabestream unerwartet beendet wurde. Prüfen Sie die vorhergehenden Provider- und Discord-Player-Logs.
- `capture ignored during playback (barge-in disabled)` bedeutet, dass OpenClaw Eingaben absichtlich verworfen hat, während Assistenten-Audio aktiv war. Aktivieren Sie `voice.realtime.bargeIn`, wenn Sprache die Wiedergabe unterbrechen soll.
- `barge-in ignored ... outputActive=false` bedeutet, dass Discord oder Provider-VAD Sprache gemeldet hat, OpenClaw aber keine aktive Wiedergabe zum Unterbrechen hatte. Dies sollte Audio nicht abschneiden.

Anmeldedaten werden pro Komponente aufgelöst: LLM-Routen-Authentifizierung für `voice.model`, STT-Authentifizierung für `tools.media.audio`, TTS-Authentifizierung für `messages.tts`/`voice.tts` und Realtime-Provider-Authentifizierung für `voice.realtime.providers` oder die normale Auth-Konfiguration des Providers.

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
  <Accordion title="Unzulässige Intents verwendet oder Bot sieht keine Guild-Nachrichten">

    - Message Content Intent aktivieren
    - Server Members Intent aktivieren, wenn Sie von Benutzer-/Mitgliederauflösung abhängen
    - Gateway nach Änderungen an Intents neu starten

  </Accordion>

  <Accordion title="Guild-Nachrichten unerwartet blockiert">

    - `groupPolicy` prüfen
    - Guild-Allowlist unter `channels.discord.guilds` prüfen
    - wenn eine Guild-`channels`-Map vorhanden ist, sind nur aufgelistete Kanäle erlaubt
    - `requireMention`-Verhalten und Erwähnungsmuster prüfen

    Nützliche Prüfungen:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention ist false, aber wird weiterhin blockiert">
    Häufige Ursachen:

    - `groupPolicy="allowlist"` ohne passende Guild-/Kanal-Allowlist
    - `requireMention` an der falschen Stelle konfiguriert (muss unter `channels.discord.guilds` oder im Kanaleintrag stehen)
    - Absender durch Guild-/Kanal-`users`-Allowlist blockiert

  </Accordion>

  <Accordion title="Lange laufende Discord-Turns oder doppelte Antworten">

    Typische Logs:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Knobs für die Discord-Gateway-Warteschlange:

    - Einzelkonto: `channels.discord.eventQueue.listenerTimeout`
    - Mehrkonto: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - dies steuert nur Listener-Arbeit des Discord-Gateway, nicht die Lebensdauer eines Agent-Turns

    Discord wendet keinen kanal-eigenen Timeout auf eingereihte Agent-Turns an. Nachrichten-Listener übergeben sofort, und eingereihte Discord-Läufe behalten die Reihenfolge pro Sitzung bei, bis der Sitzungs-/Tool-/Runtime-Lebenszyklus die Arbeit abschließt oder abbricht.

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
    OpenClaw ruft Discord-`/gateway/bot`-Metadaten vor dem Verbinden ab. Vorübergehende Fehler fallen auf die Standard-Gateway-URL von Discord zurück und werden in Logs gedrosselt.

    Knobs für Metadaten-Timeouts:

    - Einzelkonto: `channels.discord.gatewayInfoTimeoutMs`
    - Mehrkonto: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - Env-Fallback, wenn die Konfiguration nicht gesetzt ist: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - Standard: `30000` (30 Sekunden), Max.: `120000`

  </Accordion>

  <Accordion title="Gateway-READY-Timeout-Neustarts">
    OpenClaw wartet während des Starts und nach Runtime-Wiederverbindungen auf das Discord-Gateway-`READY`-Ereignis. Mehrkonto-Setups mit gestaffeltem Start können ein längeres READY-Startfenster benötigen als den Standard.

    Knobs für READY-Timeouts:

    - Start Einzelkonto: `channels.discord.gatewayReadyTimeoutMs`
    - Start Mehrkonto: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - Start-Env-Fallback, wenn die Konfiguration nicht gesetzt ist: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - Start-Standard: `15000` (15 Sekunden), Max.: `120000`
    - Runtime Einzelkonto: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - Runtime Mehrkonto: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - Runtime-Env-Fallback, wenn die Konfiguration nicht gesetzt ist: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - Runtime-Standard: `30000` (30 Sekunden), Max.: `120000`

  </Accordion>

  <Accordion title="Abweichungen bei Berechtigungsprüfungen">
    `channels status --probe`-Berechtigungsprüfungen funktionieren nur für numerische Kanal-IDs.

    Wenn Sie Slug-Schlüssel verwenden, kann Runtime-Abgleich weiterhin funktionieren, aber Probe kann Berechtigungen nicht vollständig verifizieren.

  </Accordion>

  <Accordion title="DM- und Pairing-Probleme">

    - DM deaktiviert: `channels.discord.dm.enabled=false`
    - DM-Policy deaktiviert: `channels.discord.dmPolicy="disabled"` (Legacy: `channels.discord.dm.policy`)
    - wartet auf Pairing-Freigabe im `pairing`-Modus

  </Accordion>

  <Accordion title="Bot-zu-Bot-Schleifen">
    Standardmäßig werden von Bots verfasste Nachrichten ignoriert.

    Wenn Sie `channels.discord.allowBots=true` setzen, verwenden Sie strenge Erwähnungs- und Allowlist-Regeln, um Schleifenverhalten zu vermeiden.
    Bevorzugen Sie `channels.discord.allowBots="mentions"`, um nur Bot-Nachrichten zu akzeptieren, die den Bot erwähnen.

    OpenClaw liefert außerdem gemeinsamen [Bot-Schleifenschutz](/de/channels/bot-loop-protection). Immer wenn `allowBots` von Bots verfasste Nachrichten bis zur Dispatch-Ebene durchlässt, ordnet Discord das eingehende Ereignis Fakten zu `(account, channel, bot pair)` zu, und der generische Paar-Guard unterdrückt das Paar, nachdem es das konfigurierte Ereignisbudget überschritten hat. Der Guard verhindert ausufernde Zwei-Bot-Schleifen, die zuvor durch Discord-Ratelimits gestoppt werden mussten; er wirkt sich nicht auf Einzel-Bot-Deployments oder einmalige Bot-Antworten aus, die unter dem Budget bleiben.

    Standardeinstellungen (aktiv, wenn `allowBots` gesetzt ist):

    - `maxEventsPerWindow: 20` -- Bot-Paar kann innerhalb des gleitenden Fensters 20 Nachrichten austauschen
    - `windowSeconds: 60` -- Länge des gleitenden Fensters
    - `cooldownSeconds: 60` -- sobald das Budget auslöst, wird jede zusätzliche Bot-zu-Bot-Nachricht in beide Richtungen eine Minute lang verworfen

    Konfigurieren Sie den gemeinsamen Standard einmal unter `channels.defaults.botLoopProtection`, und überschreiben Sie dann Discord, wenn ein legitimer Workflow mehr Spielraum benötigt. Die Priorität ist:

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

    - halten Sie OpenClaw aktuell (`openclaw update`), damit die Wiederherstellungslogik für Discord-Sprachanrufempfang vorhanden ist
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

<Accordion title="Wichtige Discord-Felder">

- Start/Auth: `enabled`, `token`, `accounts.*`, `allowBots`
- Policy: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
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
- Features: `threadBindings`, Top-Level-`bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents.enabled`, `agentComponents.ttlMs`, `heartbeat`, `responsePrefix`

</Accordion>

## Sicherheit und Betrieb

- Behandeln Sie Bot-Tokens als Geheimnisse (`DISCORD_BOT_TOKEN` in überwachten Umgebungen bevorzugt).
- Gewähren Sie Discord-Berechtigungen nach dem Prinzip der geringsten Rechte.
- Wenn Command-Deployment/-Status veraltet ist, starten Sie Gateway neu und prüfen Sie erneut mit `openclaw channels status --probe`.

## Verwandt

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/de/channels/pairing">
    Koppeln Sie einen Discord-Benutzer mit dem Gateway.
  </Card>
  <Card title="Gruppen" icon="users" href="/de/channels/groups">
    Gruppenchat- und Allowlist-Verhalten.
  </Card>
  <Card title="Kanal-Routing" icon="route" href="/de/channels/channel-routing">
    Leiten Sie eingehende Nachrichten an Agents weiter.
  </Card>
  <Card title="Sicherheit" icon="shield" href="/de/gateway/security">
    Bedrohungsmodell und Härtung.
  </Card>
  <Card title="Multi-Agent-Routing" icon="sitemap" href="/de/concepts/multi-agent">
    Ordnen Sie Guilds und Kanäle Agents zu.
  </Card>
  <Card title="Slash-Befehle" icon="terminal" href="/de/tools/slash-commands">
    Natives Befehlsverhalten.
  </Card>
</CardGroup>
