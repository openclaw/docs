---
read_when:
    - Arbeiten an Funktionen des Discord-Kanals
summary: Einrichtung des Discord-Bots, Konfigurationsschlüssel, Komponenten, Sprache und Fehlerbehebung
title: Discord
x-i18n:
    generated_at: "2026-07-12T01:24:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ae3682462003a04e57acbdc98a3713e5ef83f89384b7f3b79633c344855b715
    source_path: channels/discord.md
    workflow: 16
---

OpenClaw verbindet sich über das offizielle Discord-Gateway als Bot mit Discord. Direktnachrichten und Gildenkanäle werden unterstützt.

<CardGroup cols={3}>
  <Card title="Kopplung" icon="link" href="/de/channels/pairing">
    Discord-Direktnachrichten verwenden standardmäßig den Kopplungsmodus.
  </Card>
  <Card title="Slash-Befehle" icon="terminal" href="/de/tools/slash-commands">
    Natives Befehlsverhalten und Befehlskatalog.
  </Card>
  <Card title="Fehlerbehebung für Kanäle" icon="wrench" href="/de/channels/troubleshooting">
    Kanalübergreifende Diagnose und Fehlerbehebung.
  </Card>
</CardGroup>

## Schnelleinrichtung

Erstellen Sie eine Discord-Anwendung mit einem Bot, fügen Sie den Bot Ihrem Server hinzu und koppeln Sie ihn mit OpenClaw. Verwenden Sie nach Möglichkeit einen privaten Server; [erstellen Sie bei Bedarf zuerst einen](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (**Create My Own > For me and my friends**).

<Steps>
  <Step title="Discord-Anwendung und Bot erstellen">
    Klicken Sie im [Discord Developer Portal](https://discord.com/developers/applications) auf **New Application** und vergeben Sie einen Namen (zum Beispiel „OpenClaw“).

    Öffnen Sie in der Seitenleiste **Bot** und legen Sie unter **Username** den Namen Ihres Agenten fest.

  </Step>

  <Step title="Privilegierte Intents aktivieren">
    Aktivieren Sie weiterhin auf der Seite **Bot** unter **Privileged Gateway Intents** Folgendes:

    - **Message Content Intent** (erforderlich)
    - **Server Members Intent** (empfohlen; erforderlich für Rollen-Zulassungslisten, die Zuordnung von Namen zu IDs und Zugriffsgruppen für die Kanalzielgruppe)
    - **Presence Intent** (optional; nur für Anwesenheitsaktualisierungen)

  </Step>

  <Step title="Bot-Token kopieren">
    Klicken Sie auf der Seite **Bot** auf **Reset Token** und kopieren Sie das Token.

    <Note>
    Trotz der Bezeichnung wird dadurch Ihr erstes Token erzeugt – es wird nichts „zurückgesetzt“.
    </Note>

  </Step>

  <Step title="Einladungs-URL erzeugen und den Bot Ihrem Server hinzufügen">
    Öffnen Sie in der Seitenleiste **OAuth2**. Aktivieren Sie im **OAuth2 URL Generator** die folgenden Bereiche:

    - `bot`
    - `applications.commands`

    Aktivieren Sie im daraufhin angezeigten Abschnitt **Bot Permissions** mindestens Folgendes:

    **General Permissions**
      - View Channels

    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (optional)

    Dies ist die Grundausstattung für normale Textkanäle. Wenn der Bot Beiträge in Threads veröffentlichen soll – einschließlich Abläufen für Foren- oder Medienkanäle, die einen Thread erstellen oder fortsetzen –, aktivieren Sie zusätzlich **Send Messages in Threads**.

    Kopieren Sie die erzeugte URL, öffnen Sie sie in einem Browser, wählen Sie Ihren Server aus und klicken Sie auf **Continue**. Der Bot sollte nun auf Ihrem Server angezeigt werden.

  </Step>

  <Step title="Entwicklermodus aktivieren und IDs erfassen">
    Aktivieren Sie in der Discord-App den Entwicklermodus, damit Sie IDs kopieren können:

    1. **User Settings** (Zahnradsymbol) → **Developer** → **Developer Mode** aktivieren
       *(auf Mobilgeräten: **App Settings** → **Advanced**)*
    2. Klicken Sie mit der rechten Maustaste auf Ihr **Serversymbol** → **Copy Server ID**
    3. Klicken Sie mit der rechten Maustaste auf Ihren **eigenen Avatar** → **Copy User ID**

    Bewahren Sie die Server-ID und Benutzer-ID zusammen mit Ihrem Bot-Token auf; im nächsten Schritt benötigen Sie alle drei.

  </Step>

  <Step title="Direktnachrichten von Servermitgliedern zulassen">
    Damit die Kopplung funktioniert, muss Discord dem Bot erlauben, Ihnen eine Direktnachricht zu senden. Klicken Sie mit der rechten Maustaste auf Ihr **Serversymbol** → **Privacy Settings** → aktivieren Sie **Direct Messages**.

    Lassen Sie diese Einstellung aktiviert, wenn Sie Discord-Direktnachrichten mit OpenClaw verwenden. Wenn Sie ausschließlich Gildenkanäle verwenden, können Sie sie nach der Kopplung deaktivieren.

  </Step>

  <Step title="Bot-Token sicher festlegen (nicht im Chat senden)">
    Das Bot-Token ist ein Geheimnis. Legen Sie es auf dem Rechner fest, auf dem OpenClaw ausgeführt wird, bevor Sie Ihrem Agenten eine Nachricht senden:

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

    Wenn OpenClaw bereits als Hintergrunddienst ausgeführt wird, starten Sie ihn über die OpenClaw-Mac-App neu oder beenden Sie den Prozess `openclaw gateway run` und starten Sie ihn erneut.
    Führen Sie bei verwalteten Dienstinstallationen `openclaw gateway install` in einer Shell aus, in der `DISCORD_BOT_TOKEN` festgelegt ist, oder speichern Sie die Variable in `~/.openclaw/.env`, damit der Dienst die Umgebungsvariablen-SecretRef nach dem Neustart auflösen kann.
    Wenn Ihr Host bei der Anwendungsabfrage während des Starts von Discord blockiert oder in seiner Anfragerate begrenzt wird, legen Sie die Anwendungs-/Client-ID aus dem Developer Portal fest, damit diese REST-Anfrage beim Start übersprungen werden kann: `channels.discord.applicationId` für das Standardkonto oder `channels.discord.accounts.<accountId>.applicationId` für den jeweiligen Bot.

  </Step>

  <Step title="OpenClaw konfigurieren und koppeln">

    <Tabs>
      <Tab title="Ihren Agenten fragen">
        Chatten Sie über einen vorhandenen Kanal (zum Beispiel Telegram) mit Ihrem OpenClaw-Agenten und teilen Sie ihm die Angaben mit. Wenn Discord Ihr erster Kanal ist, verwenden Sie stattdessen den Tab „CLI/Konfiguration“.

        > „Ich habe mein Discord-Bot-Token bereits in der Konfiguration festgelegt. Bitte schließen Sie die Discord-Einrichtung mit der Benutzer-ID `<user_id>` und der Server-ID `<server_id>` ab.“
      </Tab>
      <Tab title="CLI/Konfiguration">
        Dateibasierte Konfiguration:

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

        Rückgriff auf die Umgebungsvariable für das Standardkonto:

```bash
DISCORD_BOT_TOKEN=...
```

        Schreiben Sie für eine skriptgesteuerte oder entfernte Einrichtung denselben JSON5-Block mit `openclaw config patch --file ./discord.patch.json5 --dry-run` und führen Sie den Befehl anschließend erneut ohne `--dry-run` aus. `token`-Zeichenfolgen im Klartext funktionieren ebenfalls, und SecretRef-Werte für `channels.discord.token` werden von Umgebungsvariablen-, Datei- und Exec-Providern unterstützt. Siehe [Geheimnisverwaltung](/de/gateway/secrets).

        Speichern Sie bei mehreren Discord-Bots das jeweilige Bot-Token und die Anwendungs-ID unter dem entsprechenden Konto. Ein übergeordnetes `channels.discord.applicationId` wird von den Konten geerbt. Legen Sie es daher nur dort fest, wenn alle Konten dieselbe Anwendungs-ID verwenden.

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

  <Step title="Erste Direktnachrichten-Kopplung genehmigen">
    Sobald das Gateway ausgeführt wird, senden Sie Ihrem Bot in Discord eine Direktnachricht. Er antwortet mit einem Kopplungscode.

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

    Kopplungscodes laufen nach einer Stunde ab. Nach der Genehmigung können Sie in einer Discord-Direktnachricht mit Ihrem Agenten chatten.

  </Step>
</Steps>

<Note>
Die Token-Auflösung berücksichtigt das jeweilige Konto. Token-Werte aus der Konfiguration haben Vorrang vor dem Rückgriff auf die Umgebungsvariable, und `DISCORD_BOT_TOKEN` wird ausschließlich für das Standardkonto verwendet.
Wenn zwei aktivierte Discord-Konten dasselbe Bot-Token auflösen, startet OpenClaw nur einen Gateway-Monitor für dieses Token: Ein aus der Konfiguration stammendes Token hat Vorrang vor dem Rückgriff auf die Umgebungsvariable; andernfalls wird das erste aktivierte Konto verwendet und das doppelte Konto mit dem Grund `duplicate bot token` als deaktiviert gemeldet.
Bei erweiterten ausgehenden Aufrufen (Nachrichtenwerkzeug/Kanalaktionen) wird ein ausdrücklich für den jeweiligen Aufruf angegebenes `token` verwendet. Dies gilt für Sendeaktionen sowie für Aktionen zum Lesen oder Prüfen (Lesen/Suchen/Abrufen/Threads/angeheftete Nachrichten/Berechtigungen). Kontorichtlinien und Wiederholungseinstellungen stammen weiterhin aus dem ausgewählten Konto im aktiven Laufzeit-Snapshot.
</Note>

## Empfohlen: Gilden-Arbeitsbereich einrichten

Sobald Direktnachrichten funktionieren, können Sie Ihren Server in einen vollständigen Arbeitsbereich umwandeln, in dem jeder Kanal eine eigene Agentensitzung mit eigenem Kontext erhält. Dies wird für private Server empfohlen, auf denen sich nur Sie und Ihr Bot befinden.

<Steps>
  <Step title="Server zur Gilden-Zulassungsliste hinzufügen">
    Dadurch kann Ihr Agent in jedem Kanal auf Ihrem Server antworten, nicht nur in Direktnachrichten.

    <Tabs>
      <Tab title="Ihren Agenten fragen">
        > „Fügen Sie meine Discord-Server-ID `<server_id>` zur Gilden-Zulassungsliste hinzu.“
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
    Standardmäßig antwortet der Agent in Gildenkanälen nur, wenn er mit @ erwähnt wird. Auf einem privaten Server möchten Sie wahrscheinlich, dass er auf jede Nachricht antwortet.

    In Gildenkanälen werden normale Antworten standardmäßig automatisch veröffentlicht. Aktivieren Sie für gemeinsam genutzte, dauerhaft aktive Räume `messages.groupChat.visibleReplies: "message_tool"`, damit der Agent unauffällig mitlesen und nur dann etwas veröffentlichen kann, wenn er eine Antwort im Kanal für sinnvoll hält. Dies funktioniert am besten mit Modellen der neuesten Generation, die Werkzeuge zuverlässig verwenden, beispielsweise GPT-5.6 Sol. Umgebungsereignisse im Raum bleiben still, sofern das Werkzeug nichts sendet. Die vollständige Konfiguration für den Mithörmodus finden Sie unter [Umgebungsereignisse in Räumen](/de/channels/ambient-room-events).

    Wenn Discord anzeigt, dass der Bot schreibt, und die Protokolle eine Token-Nutzung zeigen, aber keine Nachricht veröffentlicht wird, prüfen Sie, ob der Durchlauf als Umgebungsereignis im Raum konfiguriert wurde oder ob sichtbare Antworten über das Nachrichtenwerkzeug aktiviert sind.

    <Tabs>
      <Tab title="Ihren Agenten fragen">
        > „Erlauben Sie meinem Agenten, auf diesem Server zu antworten, ohne dass er mit @ erwähnt werden muss.“
      </Tab>
      <Tab title="Konfiguration">
        Legen Sie in Ihrer Gildenkonfiguration `requireMention: false` fest:

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

        Um für sichtbare Gruppen-/Kanalantworten das Senden über das Nachrichtenwerkzeug vorzuschreiben, legen Sie `messages.groupChat.visibleReplies: "message_tool"` fest.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Gedächtnis in Gildenkanälen einplanen">
    Das Langzeitgedächtnis (MEMORY.md) wird nur in Direktnachrichtensitzungen automatisch geladen; Gildenkanäle laden es nicht.

    <Tabs>
      <Tab title="Ihren Agenten fragen">
        > „Wenn ich in Discord-Kanälen Fragen stelle, verwenden Sie memory_search oder memory_get, falls Sie langfristigen Kontext aus MEMORY.md benötigen.“
      </Tab>
      <Tab title="Manuell">
        Legen Sie stabile Anweisungen für einen in allen Kanälen gemeinsam genutzten Kontext in `AGENTS.md` oder `USER.md` ab; diese werden in jede Sitzung eingefügt. Bewahren Sie langfristige Notizen in `MEMORY.md` auf und greifen Sie bei Bedarf mit Gedächtniswerkzeugen darauf zu.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Erstellen Sie nun Kanäle und beginnen Sie mit dem Chatten. Der Agent sieht den Kanalnamen, und jeder Kanal ist eine isolierte Sitzung – richten Sie beispielsweise `#coding`, `#home`, `#research` oder andere zu Ihrem Arbeitsablauf passende Kanäle ein.

## Laufzeitmodell

- Das Gateway verwaltet die Discord-Verbindung.
- Die Weiterleitung von Antworten ist deterministisch: Eingehende Discord-Nachrichten werden auf Discord beantwortet.
- Metadaten zu Discord-Gilden und -Kanälen werden der Modellanweisung als nicht vertrauenswürdiger Kontext hinzugefügt, nicht als für Benutzer sichtbares Antwortpräfix. Wenn ein Modell diesen Umschlag zurückkopiert, entfernt OpenClaw die kopierten Metadaten aus ausgehenden Antworten und aus künftig wiedergegebenem Kontext.
- Standardmäßig (`session.dmScope=main`) verwenden direkte Chats gemeinsam die Hauptsitzung des Agenten (`agent:main:main`).
- Gildenkanäle verwenden isolierte Sitzungsschlüssel (`agent:<agentId>:discord:channel:<channelId>`).
- Gruppen-Direktnachrichten werden standardmäßig ignoriert (`channels.discord.dm.groupEnabled=false`).
- Native Slash-Befehle werden in isolierten Befehlssitzungen ausgeführt (`agent:<agentId>:discord:slash:<userId>`), führen jedoch weiterhin `CommandTargetSessionKey` für die weitergeleitete Unterhaltungssitzung mit.
- Die Ankündigungszustellung rein textbasierter Cron-/Heartbeat-Nachrichten an Discord wird auf die endgültige, für den Assistenten sichtbare Antwort reduziert und einmal gesendet. Medien und strukturierte Komponenten-Nutzlasten bleiben aus mehreren Nachrichten bestehend, wenn der Agent mehrere zustellbare Nutzlasten ausgibt.

## Forenkanäle

Discord-Foren- und Medienkanäle akzeptieren ausschließlich Thread-Beiträge. OpenClaw unterstützt zwei Möglichkeiten, diese zu erstellen:

- Senden Sie eine Nachricht an das übergeordnete Forum (`channel:<forumId>`), um automatisch einen Thread zu erstellen. Der Thread-Titel entspricht der ersten nicht leeren Zeile der Nachricht (gekürzt auf Discords Begrenzung von 100 Zeichen für Thread-Namen).
- Verwenden Sie `openclaw message thread create`, um direkt einen Thread zu erstellen. Übergeben Sie bei Forumskanälen nicht `--message-id`.

Senden Sie eine Nachricht an das übergeordnete Forum, um einen Thread zu erstellen:

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Erstellen Sie explizit einen Forum-Thread:

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Übergeordnete Foren akzeptieren keine Discord-Komponenten. Wenn Sie Komponenten benötigen, senden Sie die Nachricht an den Thread selbst (`channel:<threadId>`).

## Interaktive Komponenten

OpenClaw unterstützt Container mit Discord-Komponenten v2 für Agentennachrichten. Verwenden Sie das Nachrichten-Tool mit einer `components`-Nutzlast. Interaktionsergebnisse werden als normale eingehende Nachrichten an den Agenten zurückgeleitet und folgen den bestehenden Discord-Einstellungen für `replyToMode`.

Unterstützte Blöcke:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Aktionszeilen erlauben bis zu 5 Schaltflächen oder ein einzelnes Auswahlmenü
- Auswahltypen: `string`, `user`, `role`, `mentionable`, `channel`

Standardmäßig können Komponenten nur einmal verwendet werden. Setzen Sie `components.reusable=true`, damit Schaltflächen, Auswahlmenüs und Formulare bis zu ihrem Ablauf mehrfach verwendet werden können.

Um einzuschränken, wer auf eine Schaltfläche klicken kann, legen Sie für diese Schaltfläche `allowedUsers` fest (Discord-Benutzer-IDs, Tags oder `*`). Nicht übereinstimmende Benutzer erhalten eine nur für sie sichtbare Ablehnung.

Komponenten-Callbacks laufen standardmäßig nach 30 Minuten ab. Legen Sie `channels.discord.agentComponents.ttlMs` fest, um die Lebensdauer der Callback-Registrierung für das Standardkonto zu ändern, oder `channels.discord.accounts.<accountId>.agentComponents.ttlMs` für einzelne Konten. Der Wert wird in Millisekunden angegeben, muss eine positive Ganzzahl sein und ist auf `86400000` (24 Stunden) begrenzt. Längere TTLs eignen sich für Prüfungs- und Genehmigungsabläufe, bei denen Schaltflächen länger verwendbar bleiben müssen, verlängern jedoch den Zeitraum, in dem eine alte Discord-Nachricht noch eine Aktion auslösen kann. Verwenden Sie möglichst die kürzeste geeignete TTL und behalten Sie die Standardeinstellung bei, wenn veraltete Callbacks unerwartet wären.

Die Slash-Befehle `/model` und `/models` öffnen eine interaktive Modellauswahl mit Dropdown-Menüs für Provider, Modell und kompatible Laufzeit sowie einem Submit-Schritt. `/models add` ist veraltet und gibt eine Veraltungsmeldung zurück, anstatt Modelle über den Chat zu registrieren. Die Antwort der Auswahl ist nur für den aufrufenden Benutzer sichtbar und kann ausschließlich von ihm verwendet werden. Discord-Auswahlmenüs sind auf 25 Optionen begrenzt. Fügen Sie daher `provider/*`-Einträge zu `agents.defaults.models` hinzu, wenn die Auswahl dynamisch erkannte Modelle nur für ausgewählte Provider wie `openai` oder `vllm` anzeigen soll.

Dateianhänge:

- `file`-Blöcke müssen auf eine Anhangsreferenz (`attachment://<filename>`) verweisen
- Stellen Sie den Anhang über `media`/`path`/`filePath` bereit (einzelne Datei); verwenden Sie `media-gallery` für mehrere Dateien
- Verwenden Sie `filename`, um den Namen des Uploads zu überschreiben, wenn er mit der Anhangsreferenz übereinstimmen soll

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
    `channels.discord.dmPolicy` steuert den DM-Zugriff. `channels.discord.allowFrom` ist die kanonische DM-Zulassungsliste.

    - `pairing` (Standard)
    - `allowlist` (erfordert mindestens einen `allowFrom`-Absender)
    - `open` (erfordert, dass `channels.discord.allowFrom` `"*"` enthält)
    - `disabled`

    Wenn die DM-Richtlinie nicht offen ist, werden unbekannte Benutzer blockiert (oder im Modus `pairing` zum Koppeln aufgefordert).

    Rangfolge bei mehreren Konten:

    - `channels.discord.accounts.default.allowFrom` gilt nur für das Konto `default`.
    - Bei einem Konto hat `allowFrom` Vorrang vor dem veralteten `dm.allowFrom`.
    - Benannte Konten übernehmen `channels.discord.allowFrom`, wenn weder ihr eigenes `allowFrom` noch das veraltete `dm.allowFrom` festgelegt ist.
    - Benannte Konten übernehmen `channels.discord.accounts.default.allowFrom` nicht.

    Die veralteten Einstellungen `channels.discord.dm.policy` und `channels.discord.dm.allowFrom` werden aus Kompatibilitätsgründen weiterhin gelesen. `openclaw doctor --fix` migriert sie zu `dmPolicy` und `allowFrom`, wenn dies ohne Änderung des Zugriffs möglich ist.

    DM-Zielformat für die Zustellung:

    - `user:<id>`
    - `<@id>`-Erwähnung

    Reine numerische IDs werden normalerweise als Kanal-IDs aufgelöst, wenn ein Kanalstandard aktiv ist. IDs, die im effektiven DM-`allowFrom` des Kontos aufgeführt sind, werden aus Kompatibilitätsgründen jedoch als Benutzer-DM-Ziele behandelt.

  </Tab>

  <Tab title="Zugriffsgruppen">
    Discord-DMs und die Autorisierung von Textbefehlen können dynamische `accessGroup:<name>`-Einträge in `channels.discord.allowFrom` verwenden.

    Namen von Zugriffsgruppen werden kanalübergreifend gemeinsam verwendet. Verwenden Sie `type: "message.senders"` für eine statische Gruppe, deren Mitglieder in der normalen `allowFrom`-Syntax des jeweiligen Kanals angegeben werden, oder `type: "discord.channelAudience"`, wenn die aktuelle `ViewChannel`-Zielgruppe eines Discord-Kanals die Mitgliedschaft dynamisch bestimmen soll. Gemeinsames Verhalten von Zugriffsgruppen: [Zugriffsgruppen](/de/channels/access-groups).

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

    Ein Discord-Textkanal besitzt keine separate Mitgliederliste. `type: "discord.channelAudience"` modelliert die Mitgliedschaft folgendermaßen: Der DM-Absender ist Mitglied des konfigurierten Servers und verfügt nach Anwendung der Rollen- und Kanalüberschreibungen derzeit über die effektive Berechtigung `ViewChannel` für den konfigurierten Kanal.

    Beispiel: Erlauben Sie allen Personen, die `#maintainers` sehen können, dem Bot eine DM zu senden, während DMs für alle anderen gesperrt bleiben.

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

    Sie können dynamische und statische Einträge kombinieren:

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

    Nachschlagevorgänge schlagen sicher geschlossen fehl. Wenn Discord `Missing Access` zurückgibt, die Mitgliedssuche fehlschlägt oder der Kanal zu einem anderen Server gehört, wird der DM-Absender als nicht autorisiert behandelt.

    Aktivieren Sie im Discord Developer Portal **Server Members Intent**, wenn Sie Zugriffsgruppen auf Basis einer Kanalzielgruppe verwenden. DMs enthalten keinen Mitgliedsstatus des Servers. Daher löst OpenClaw das Mitglied zum Zeitpunkt der Autorisierung über Discord REST auf.

  </Tab>

  <Tab title="Serverrichtlinie">
    Die Behandlung von Servern wird durch `channels.discord.groupPolicy` gesteuert:

    - `open`
    - `allowlist`
    - `disabled`

    Wenn `channels.discord` vorhanden ist, lautet die sichere Ausgangseinstellung `allowlist`.

    Verhalten von `allowlist`:

    - Der Server muss mit `channels.discord.guilds` übereinstimmen (`id` bevorzugt, Slug akzeptiert)
    - Optionale Absender-Zulassungslisten: `users` (stabile IDs empfohlen) und `roles` (nur Rollen-IDs); wenn eine davon konfiguriert ist, sind Absender zugelassen, wenn sie mit `users` ODER `roles` übereinstimmen
    - Der direkte Abgleich von Namen/Tags ist standardmäßig deaktiviert; aktivieren Sie `channels.discord.dangerouslyAllowNameMatching: true` nur als Notfall-Kompatibilitätsmodus
    - Namen/Tags werden für `users` unterstützt, IDs sind jedoch sicherer; `openclaw security audit` warnt, wenn Namens-/Tag-Einträge verwendet werden
    - Wenn für einen Server `channels` konfiguriert ist, werden nicht aufgeführte Kanäle abgelehnt
    - Wenn ein Server keinen `channels`-Block besitzt, sind alle Kanäle dieses zugelassenen Servers erlaubt

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
            general: { enabled: true },
            help: { enabled: true, requireMention: true },
          },
        },
      },
    },
  },
}
```

    Der veraltete kanalspezifische Schlüssel `allow` wird durch `openclaw doctor --fix` zu `enabled` migriert.

    Wenn Sie nur `DISCORD_BOT_TOKEN` festlegen und keinen `channels.discord`-Block erstellen, lautet der Laufzeit-Fallback `groupPolicy="allowlist"` (mit einer Warnung in den Protokollen), selbst wenn `channels.defaults.groupPolicy` auf `open` gesetzt ist.

  </Tab>

  <Tab title="Erwähnungen und Gruppen-DMs">
    Nachrichten auf Servern erfordern standardmäßig eine Erwähnung.

    Die Erkennung von Erwähnungen umfasst:

    - explizite Erwähnung des Bots
    - konfigurierte Erwähnungsmuster (`agents.list[].groupChat.mentionPatterns`, Fallback auf `messages.groupChat.mentionPatterns`)
    - implizites Antwort-an-den-Bot-Verhalten in unterstützten Fällen

    Verwenden Sie beim Verfassen ausgehender Discord-Nachrichten die kanonische Erwähnungssyntax: `<@USER_ID>` für Benutzer, `<#CHANNEL_ID>` für Kanäle und `<@&ROLE_ID>` für Rollen. Verwenden Sie nicht die veraltete Spitznamen-Erwähnungsform `<@!USER_ID>`.

    `requireMention` wird pro Server/Kanal konfiguriert (`channels.discord.guilds...`).
    `ignoreOtherMentions` verwirft optional Nachrichten, die einen anderen Benutzer oder eine andere Rolle, aber nicht den Bot erwähnen (ausgenommen @everyone/@here).

    Gruppen-DMs:

    - Standard: ignoriert (`dm.groupEnabled=false`)
    - Optionale Zulassungsliste über `dm.groupChannels` (Kanal-IDs oder Slugs)

  </Tab>
</Tabs>

### Rollenbasiertes Agenten-Routing

Verwenden Sie `bindings[].match.roles`, um Mitglieder eines Discord-Servers anhand ihrer Rollen-ID an unterschiedliche Agenten weiterzuleiten. Rollenbasierte Bindungen akzeptieren ausschließlich Rollen-IDs und werden nach Peer- oder übergeordneten Peer-Bindungen sowie vor reinen Serverbindungen ausgewertet. Wenn eine Bindung weitere Abgleichsfelder festlegt (beispielsweise `peer` + `guildId` + `roles`), müssen alle konfigurierten Felder übereinstimmen.

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

- `commands.native` hat standardmäßig den Wert `"auto"` und ist für Discord aktiviert.
- Kanalspezifische Überschreibung: `channels.discord.commands.native`.
- `commands.native=false` überspringt beim Start die Registrierung und Bereinigung von Discord-Slash-Befehlen. Zuvor registrierte Befehle können in Discord sichtbar bleiben, bis Sie sie aus der Discord-App entfernen.
- Die Authentifizierung nativer Befehle verwendet dieselben Discord-Zulassungslisten und -Richtlinien wie die normale Nachrichtenverarbeitung.
- Befehle können in der Discord-Benutzeroberfläche weiterhin für nicht autorisierte Benutzer sichtbar sein; bei der Ausführung wird die OpenClaw-Authentifizierung durchgesetzt und mit „nicht autorisiert“ geantwortet.
- Standardeinstellungen für Slash-Befehle: `ephemeral: true` (`channels.discord.slashCommand.ephemeral`).

Befehlskatalog und Verhalten finden Sie unter [Slash-Befehle](/de/tools/slash-commands).

## Funktionsdetails

<AccordionGroup>
  <Accordion title="Antwort-Tags und native Antworten">
    Discord unterstützt Antwort-Tags in der Agentenausgabe:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Gesteuert durch `channels.discord.replyToMode`:

    - `off` (Standard): keine implizite Antwortverkettung; explizite `[[reply_to_*]]`-Tags werden weiterhin berücksichtigt
    - `first`: hängt den impliziten nativen Antwortverweis an die erste ausgehende Discord-Nachricht des Durchlaufs an
    - `all`: hängt ihn an jede ausgehende Nachricht an
    - `batched`: hängt ihn nur an, wenn das eingehende Ereignis ein entprellter Stapel mehrerer Nachrichten war – nützlich, wenn Sie native Antworten hauptsächlich für mehrdeutige, stoßweise Chats und nicht für jeden Durchlauf mit einer einzelnen Nachricht verwenden möchten

    Nachrichten-IDs werden im Kontext und Verlauf bereitgestellt, damit Agenten bestimmte Nachrichten gezielt adressieren können.

  </Accordion>

  <Accordion title="Linkvorschauen">
    Discord erzeugt standardmäßig umfangreiche Link-Einbettungen für URLs. OpenClaw unterdrückt diese erzeugten Einbettungen standardmäßig bei ausgehenden Discord-Nachrichten, sodass von Agenten gesendete URLs einfache Links bleiben, sofern Sie dies nicht ausdrücklich aktivieren:

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    Legen Sie `channels.discord.accounts.<id>.suppressEmbeds` fest, um dies für ein Konto zu überschreiben. Über das Nachrichtenwerkzeug gesendete Agentennachrichten können außerdem `suppressEmbeds: false` für eine einzelne Nachricht übergeben. Explizite Discord-`embeds`-Nutzlasten werden durch die standardmäßige Linkvorschau-Einstellung nicht unterdrückt.

  </Accordion>

  <Accordion title="Live-Stream-Vorschau">
    OpenClaw kann Antwortentwürfe streamen, indem es eine temporäre Nachricht sendet und sie beim Eintreffen von Text bearbeitet. `channels.discord.streaming.mode` akzeptiert `off` | `partial` | `block` | `progress` (Standard, wenn weder der Schlüssel `streaming` noch der veraltete Schlüssel `streamMode` festgelegt ist). `streamMode` ist ein veralteter Alias; führen Sie `openclaw doctor --fix` aus, um die gespeicherte Konfiguration in die kanonische verschachtelte `streaming`-Struktur umzuschreiben.

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

    - `off` deaktiviert die Bearbeitung der Discord-Vorschau.
    - `partial` bearbeitet beim Eintreffen von Tokens eine einzelne Vorschaunachricht.
    - `block` gibt entwurfsgroße Abschnitte aus; Größe und Umbruchpunkte lassen sich mit `streaming.preview.chunk` (`minChars`, `maxChars`, `breakPreference`) anpassen und werden auf `textChunkLimit` begrenzt. Wenn Block-Streaming ausdrücklich aktiviert ist, überspringt OpenClaw den Vorschau-Stream, um doppeltes Streaming zu vermeiden.
    - `progress` behält einen bearbeitbaren Statusentwurf bei und aktualisiert ihn bis zur endgültigen Zustellung mit dem Werkzeugfortschritt; die gemeinsame Startbeschriftung ist eine fortlaufende Zeile und scrollt daher wie der übrige Inhalt aus dem sichtbaren Bereich, sobald genügend Arbeitsschritte erscheinen.
    - Medien, Fehler und endgültige Antworten mit explizitem Antwortverweis brechen ausstehende Vorschaubearbeitungen ab.
    - `streaming.preview.toolProgress` (Standard `true`) steuert, ob Werkzeug- und Fortschrittsaktualisierungen die Vorschaunachricht wiederverwenden.
    - Werkzeug- und Fortschrittszeilen werden, sofern verfügbar, kompakt als Emoji + Titel + Detail dargestellt, beispielsweise `🛠️ Bash: run tests` oder `🔎 Web Search: for "query"`.
    - `streaming.progress.commentary` (Standard `false`) aktiviert Kommentare und Einleitungstext des Assistenten im temporären Fortschrittsentwurf. Kommentare werden vor der Anzeige bereinigt, bleiben vorübergehend und verändern die Zustellung der endgültigen Antwort nicht.
    - `streaming.progress.maxLineChars` steuert das Zeichenbudget pro Zeile der Fortschrittsvorschau. Fließtext wird an Wortgrenzen gekürzt; bei Befehls- und Pfadangaben bleiben nützliche Endbestandteile erhalten.
    - `streaming.preview.commandText` / `streaming.progress.commandText` steuert Befehls- und Ausführungsdetails in kompakten Fortschrittszeilen: `raw` (Standard) oder `status` (nur die Werkzeugbeschriftung).

    So blenden Sie den unverarbeiteten Befehls- und Ausführungstext aus, behalten aber kompakte Fortschrittszeilen bei:

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

    Vorschau-Streaming unterstützt nur Text; bei Medienantworten wird auf die normale Zustellung zurückgegriffen.

  </Accordion>

  <Accordion title="Verlauf, Kontext und Thread-Verhalten">
    Verlaufskontext für Server:

    - `channels.discord.historyLimit`, Standard `20`
    - Rückfalloption: `messages.groupChat.historyLimit`
    - `0` deaktiviert die Funktion

    Steuerung des Direktnachrichtenverlaufs:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Thread-Verhalten:

    - Discord-Threads werden als Kanalsitzungen weitergeleitet und übernehmen die Konfiguration des übergeordneten Kanals, sofern sie nicht überschrieben wird.
    - Thread-Sitzungen übernehmen die Auswahl von `/model` auf Sitzungsebene des übergeordneten Kanals als reine Modell-Rückfalloption; Thread-lokale `/model`-Auswahlen haben Vorrang, und der Transkriptverlauf des übergeordneten Kanals wird nur kopiert, wenn die Transkriptvererbung aktiviert ist.
    - `channels.discord.thread.inheritParent` (Standard `false`) aktiviert für neue automatische Threads die Initialisierung aus dem übergeordneten Transkript. Kontospezifische Überschreibung: `channels.discord.accounts.<id>.thread.inheritParent`.
    - Reaktionen des Nachrichtenwerkzeugs können Direktnachrichtenziele vom Typ `user:<id>` auflösen.
    - `guilds.<guild>.channels.<channel>.requireMention: false` bleibt beim Rückfall auf die Aktivierung in der Antwortphase erhalten.

    Kanalthemen werden als **nicht vertrauenswürdiger** Kontext eingefügt. Zulassungslisten begrenzen, wer den Agenten auslösen kann; sie bilden keine vollständige Schwärzungsgrenze für zusätzlichen Kontext.

  </Accordion>

  <Accordion title="Thread-gebundene Sitzungen für Unteragenten">
    Discord kann einen Thread an ein Sitzungsziel binden, sodass Folgenachrichten in diesem Thread weiterhin an dieselbe Sitzung weitergeleitet werden, einschließlich Unteragentensitzungen.

    Befehle:

    - `/focus <target>` bindet den aktuellen oder einen neuen Thread an ein Unteragenten- oder Sitzungsziel
    - `/unfocus` entfernt die Bindung des aktuellen Threads
    - `/agents` zeigt aktive Ausführungen und den Bindungsstatus an
    - `/session idle <duration|off>` prüft oder aktualisiert die automatische Aufhebung fokussierter Bindungen bei Inaktivität
    - `/session max-age <duration|off>` prüft oder aktualisiert das feste Höchstalter fokussierter Bindungen

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

    - `session.threadBindings.*` legt globale Standardwerte fest; `channels.discord.threadBindings.*` überschreibt das Discord-Verhalten.
    - `spawnSessions` steuert die automatische Erstellung und Bindung von Threads für `sessions_spawn({ thread: true })` und ACP-Thread-Erstellungen. Standard: `true`.
    - `defaultSpawnContext` steuert den nativen Unteragentenkontext für Thread-gebundene Erstellungen. Standard: `"fork"`.
    - Veraltete Schlüssel `spawnSubagentSessions`/`spawnAcpSessions` werden durch `openclaw doctor --fix` migriert.
    - Wenn Thread-Bindungen für ein Konto deaktiviert sind, stehen `/focus` und zugehörige Thread-Bindungsvorgänge nicht zur Verfügung.

    Siehe [Unteragenten](/de/tools/subagents), [ACP-Agenten](/de/tools/acp-agents) und [Konfigurationsreferenz](/de/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Dauerhafte ACP-Kanalbindungen">
    Konfigurieren Sie für stabile, dauerhaft aktive ACP-Arbeitsbereiche typisierte ACP-Bindungen auf oberster Ebene, die auf Discord-Unterhaltungen verweisen.

    Konfigurationspfad: `bindings[]` mit `type: "acp"` und `match.channel: "discord"`.

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

    - `/acp spawn codex --bind here` bindet den aktuellen Kanal oder Thread direkt und sorgt dafür, dass zukünftige Nachrichten in derselben ACP-Sitzung bleiben. Thread-Nachrichten übernehmen die Bindung des übergeordneten Kanals.
    - In einem gebundenen Kanal oder Thread setzen `/new` und `/reset` dieselbe ACP-Sitzung direkt zurück. Temporäre Thread-Bindungen können die Zielauflösung überschreiben, solange sie aktiv sind.
    - `spawnSessions` steuert die Erstellung und Bindung untergeordneter Threads über `--thread auto|here`.

    Einzelheiten zum Bindungsverhalten finden Sie unter [ACP-Agenten](/de/tools/acp-agents).

  </Accordion>

  <Accordion title="Reaktionsbenachrichtigungen">
    Modus für Reaktionsbenachrichtigungen pro Server (`guilds.<id>.reactionNotifications`):

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
    - Rückfall auf das Emoji der Agentenidentität (`agents.list[].identity.emoji`, andernfalls „👀“)

    Hinweise:

    - Discord akzeptiert Unicode-Emojis oder Namen benutzerdefinierter Emojis.
    - Verwenden Sie `""`, um die Reaktion für einen Kanal oder ein Konto zu deaktivieren.

    **Geltungsbereich (`messages.ackReactionScope`):**

    Werte: `"all"` (Direktnachrichten + Gruppen, einschließlich passiver Raumereignisse), `"direct"` (nur Direktnachrichten), `"group-all"` (jede Gruppennachricht außer passiven Raumereignissen, keine Direktnachrichten), `"group-mentions"` (Gruppen, wenn der Bot erwähnt wird; **keine Direktnachrichten**, Standard), `"off"` / `"none"` (deaktiviert).

    <Note>
    Der standardmäßige Geltungsbereich (`"group-mentions"`) löst keine Bestätigungsreaktionen in Direktnachrichten oder bei passiven Raumereignissen aus. Um bei eingehenden Discord-Direktnachrichten und stillen Raumereignissen eine Bestätigungsreaktion zu erhalten, setzen Sie `messages.ackReactionScope` auf `"all"`.
    </Note>

  </Accordion>

  <Accordion title="Konfigurationsänderungen">
    Vom Kanal initiierte Konfigurationsänderungen sind standardmäßig aktiviert. Dies betrifft Abläufe mit `/config set|unset`, wenn Befehlsfunktionen aktiviert sind.

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
    Leiten Sie den Discord-Gateway-WebSocket-Datenverkehr und REST-Abfragen beim Start (Anwendungs-ID + Auflösung der Zulassungsliste) mit `channels.discord.proxy` über einen HTTP(S)-Proxy.
    Die Proxy-Nutzung für Discord-Gateway-WebSockets muss ausdrücklich konfiguriert werden; WebSocket-Verbindungen übernehmen keine allgemeinen Proxy-Umgebungsvariablen vom Gateway-Prozess. REST-Abfragen beim Start verwenden diesen Proxy, wenn `channels.discord.proxy` konfiguriert ist.

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
    Aktivieren Sie die PluralKit-Auflösung, um über Proxy gesendete Nachrichten der Identität eines Systemmitglieds zuzuordnen:

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

    - Zulassungslisten können `pk:<memberId>` verwenden
    - Anzeigenamen von Mitgliedern werden nur dann anhand von Name/Slug abgeglichen, wenn `channels.discord.dangerouslyAllowNameMatching: true` festgelegt ist
    - Abfragen fragen die PluralKit-API mit der ursprünglichen Nachrichten-ID ab
    - wenn die Abfrage fehlschlägt, werden weitergeleitete Nachrichten als Bot-Nachrichten behandelt und verworfen, sofern `allowBots` sie nicht zulässt

  </Accordion>

  <Accordion title="Aliasse für ausgehende Erwähnungen">
    Verwenden Sie `mentionAliases`, wenn Agenten deterministische ausgehende Erwähnungen für bekannte Discord-Benutzer benötigen. Schlüssel sind Handles ohne vorangestelltes `@`; Werte sind Discord-Benutzer-IDs. Unbekannte Handles, `@everyone`, `@here` und Erwähnungen innerhalb von Markdown-Code-Spannen bleiben unverändert.

```json5
{
  channels: {
    discord: {
      mentionAliases: {
        SupportLead: "123456789012345678",
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
    Präsenzaktualisierungen werden angewendet, wenn Sie ein Status- oder Aktivitätsfeld festlegen oder die automatische Präsenz aktivieren.

    Nur Status:

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    Aktivität (der benutzerdefinierte Status ist der standardmäßige Aktivitätstyp, wenn `activity` festgelegt ist):

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

    Streaming:

```json5
{
  channels: {
    discord: {
      activity: "Live-Programmierung",
      activityType: 1,
      activityUrl: "https://twitch.tv/openclaw",
    },
  },
}
```

    Zuordnung der Aktivitätstypen:

    - 0: Spielt
    - 1: Streaming (erfordert `activityUrl`; `activityUrl` erfordert wiederum `activityType: 1`)
    - 2: Hört zu
    - 3: Sieht zu
    - 4: Benutzerdefiniert (verwendet den Aktivitätstext als Statuszustand; Emoji ist optional)
    - 5: Tritt an

    Automatische Präsenz (Laufzeit-Integritätssignal):

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

    Die automatische Präsenz ordnet die Laufzeitverfügbarkeit einem Discord-Status zu: fehlerfrei => online, beeinträchtigt oder unbekannt => idle, aufgebraucht oder nicht verfügbar => dnd. Standardwerte: `intervalMs` 30000, `minUpdateIntervalMs` 15000 (muss kleiner oder gleich `intervalMs` sein). Optionale Textüberschreibungen:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (unterstützt den Platzhalter `{reason}`)

  </Accordion>

  <Accordion title="Genehmigungen in Discord">
    Discord unterstützt die schaltflächenbasierte Bearbeitung von Genehmigungen in Direktnachrichten und kann Genehmigungsaufforderungen optional im ursprünglichen Kanal veröffentlichen.

    Konfigurationspfad:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (optional; greift nach Möglichkeit auf `commands.ownerAllowFrom` zurück)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, Standard: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord aktiviert native Ausführungsgenehmigungen automatisch, wenn `enabled` nicht festgelegt oder auf `"auto"` gesetzt ist und mindestens eine genehmigende Person ermittelt werden kann, entweder aus `execApprovals.approvers` oder aus `commands.ownerAllowFrom`. Discord leitet genehmigende Personen für Ausführungen nicht aus dem Kanalwert `allowFrom`, dem veralteten `dm.allowFrom` oder dem Direktnachrichtenwert `defaultTo` ab. Legen Sie `enabled: false` fest, um Discord explizit als nativen Genehmigungsclient zu deaktivieren.

    Bei sensiblen, ausschließlich für Eigentümer bestimmten Gruppenbefehlen wie `/diagnostics` und `/export-trajectory` sendet OpenClaw Genehmigungsaufforderungen und endgültige Ergebnisse privat. Zunächst wird eine Discord-Direktnachricht versucht, wenn für den aufrufenden Eigentümer eine Discord-Eigentümerroute vorhanden ist; andernfalls wird auf die erste verfügbare Eigentümerroute aus `commands.ownerAllowFrom` zurückgegriffen, beispielsweise Telegram.

    Wenn `target` auf `channel` oder `both` gesetzt ist, ist die Genehmigungsaufforderung im Kanal sichtbar. Nur ermittelte genehmigende Personen können die Schaltflächen verwenden; andere Benutzer erhalten eine flüchtige Ablehnung. Genehmigungsaufforderungen enthalten den Befehlstext. Aktivieren Sie die Kanalzustellung daher nur in vertrauenswürdigen Kanälen. Wenn die Kanal-ID nicht aus dem Sitzungsschlüssel abgeleitet werden kann, greift OpenClaw auf die Zustellung per Direktnachricht zurück.

    Discord stellt die gemeinsamen Genehmigungsschaltflächen dar, die auch von anderen Chat-Kanälen verwendet werden; der native Discord-Adapter ergänzt hauptsächlich die Weiterleitung von Direktnachrichten an genehmigende Personen und die Verteilung auf Kanäle. Wenn diese Schaltflächen vorhanden sind, bilden sie die primäre Benutzeroberfläche für Genehmigungen; OpenClaw sollte einen manuellen `/approve`-Befehl nur aufnehmen, wenn das Werkzeugergebnis angibt, dass Chat-Genehmigungen nicht verfügbar sind oder die manuelle Genehmigung der einzige Weg ist. Wenn die native Discord-Genehmigungslaufzeit nicht aktiv ist, lässt OpenClaw die lokale deterministische Aufforderung `/approve <id> <decision>` sichtbar. Wenn die Laufzeit aktiv ist, aber keine native Karte an ein Ziel zugestellt werden kann, sendet OpenClaw im selben Chat einen Ausweichhinweis mit dem genauen `/approve`-Befehl aus der ausstehenden Genehmigung.

    Gateway-Authentifizierung und Genehmigungsauflösung folgen dem gemeinsamen Gateway-Clientvertrag (`plugin:`-IDs werden über `plugin.approval.resolve` aufgelöst; andere IDs über `exec.approval.resolve`). Genehmigungen laufen standardmäßig nach 30 Minuten ab.

    Siehe [Ausführungsgenehmigungen](/de/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Werkzeuge und Aktionssperren

Discord-Nachrichtenaktionen umfassen Nachrichtenübermittlung, Kanalverwaltung, Moderation, Präsenz und Metadaten.

Zentrale Beispiele:

- Nachrichtenübermittlung: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- Reaktionen: `react`, `reactions`, `emojiList`
- Moderation: `timeout`, `kick`, `ban`
- Präsenz: `setPresence`

Die Aktion `event-create` akzeptiert einen optionalen Parameter `image` (URL oder lokaler Dateipfad), um das Titelbild des geplanten Ereignisses festzulegen.

Aktionssperren befinden sich unter `channels.discord.actions.*`.

Standardverhalten der Sperren:

| Aktionsgruppe                                                                                                                                                             | Standardwert |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------ |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | aktiviert    |
| roles                                                                                                                                                                    | deaktiviert  |
| moderation                                                                                                                                                               | deaktiviert  |
| presence                                                                                                                                                                 | deaktiviert  |

## Components-v2-Benutzeroberfläche

OpenClaw verwendet Discord Components v2 für Ausführungsgenehmigungen und kontextübergreifende Markierungen. Discord-Nachrichtenaktionen können außerdem `components` für benutzerdefinierte Benutzeroberflächen akzeptieren (fortgeschritten; erfordert die Erstellung einer Komponenten-Nutzlast über das Discord-Werkzeug), während veraltete `embeds` weiterhin verfügbar sind, aber nicht empfohlen werden.

- `channels.discord.ui.components.accentColor` legt die von Discord-Komponentencontainern verwendete Akzentfarbe fest (Hexadezimalwert). Pro Konto: `channels.discord.accounts.<id>.ui.components.accentColor`.
- `channels.discord.agentComponents.ttlMs` steuert, wie lange Rückrufe gesendeter Discord-Komponenten registriert bleiben (Standardwert `1800000`, Höchstwert `86400000`). Pro Konto: `channels.discord.accounts.<id>.agentComponents.ttlMs`.
- `embeds` werden ignoriert, wenn Components v2 vorhanden sind.
- Vorschauen einfacher URLs werden standardmäßig unterdrückt. Legen Sie bei einer Nachrichtenaktion `suppressEmbeds: false` fest, wenn ein einzelner ausgehender Link aufgeklappt werden soll.

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

Discord verfügt über zwei unterschiedliche Sprachoberflächen: Echtzeit-**Sprachkanäle** (fortlaufende Unterhaltungen) und **Sprachnachrichtenanhänge** (das Format mit Wellenformvorschau). Der Gateway unterstützt beide.

### Sprachkanäle

Einrichtungscheckliste:

1. Aktivieren Sie Message Content Intent im Discord Developer Portal.
2. Aktivieren Sie Server Members Intent, wenn Rollen-/Benutzer-Zulassungslisten verwendet werden.
3. Laden Sie den Bot mit den Bereichen `bot` und `applications.commands` ein.
4. Gewähren Sie im Ziel-Sprachkanal die Berechtigungen Connect, Speak, Send Messages und Read Message History.
5. Aktivieren Sie native Befehle (`commands.native` oder `channels.discord.commands.native`).
6. Konfigurieren Sie `channels.discord.voice`.

Verwenden Sie `/vc join|leave|status`, um Sitzungen zu steuern. Der Befehl verwendet den Standardagenten des Kontos und folgt denselben Regeln für Zulassungslisten und Gruppenrichtlinien wie andere Discord-Befehle.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

So prüfen Sie vor dem Beitritt die effektiven Berechtigungen des Bots:

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
        model: "openai/gpt-5.6-sol",
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
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

Hinweise:

- Discord-Sprache ist bei reinen Textkonfigurationen optional; setzen Sie `channels.discord.voice.enabled=true` (oder behalten Sie einen vorhandenen `channels.discord.voice`-Block bei), um `/vc`-Befehle, die Sprachlaufzeit und den Gateway-Intent `GuildVoiceStates` zu aktivieren. Mit `channels.discord.intents.voiceStates` können Sie das Intent-Abonnement ausdrücklich überschreiben; lassen Sie die Option nicht gesetzt, damit sie der effektiven Sprachaktivierung folgt.
- `voice.mode` steuert den Gesprächspfad. Der Standardwert ist `agent-proxy`: Ein Echtzeit-Sprach-Frontend übernimmt das Timing der Gesprächsbeiträge, Unterbrechungen und die Wiedergabe, delegiert inhaltliche Aufgaben über `openclaw_agent_consult` an den weitergeleiteten OpenClaw-Agenten und behandelt das Ergebnis wie eine von dieser sprechenden Person eingegebene Discord-Eingabeaufforderung. `stt-tts` behält den älteren Batch-Ablauf aus STT und TTS bei. Mit `bidi` kann das Echtzeitmodell direkt kommunizieren, während `openclaw_agent_consult` für das OpenClaw-Gehirn bereitgestellt wird.
- `voice.agentSession` steuert, welche OpenClaw-Unterhaltung die Sprachbeiträge empfängt. Lassen Sie die Option für die eigene Sitzung des Sprachkanals nicht gesetzt, oder setzen Sie `{ mode: "target", target: "channel:<text-channel-id>" }`, damit der Sprachkanal als Mikrofon-/Lautsprechererweiterung einer vorhandenen Discord-Textkanalsitzung wie `#maintainers` fungiert.
- `voice.model` überschreibt das OpenClaw-Agentengehirn für Discord-Sprachantworten und Echtzeitkonsultationen. Lassen Sie die Option nicht gesetzt, um das Modell des weitergeleiteten Agenten zu übernehmen. Sie ist von `voice.realtime.model` getrennt.
- Mit `voice.followUsers` kann der Bot ausgewählten Benutzern in Discord-Sprachkanäle folgen, zwischen ihnen wechseln und sie verlassen. Siehe [Benutzern in Sprachkanälen folgen](#follow-users-in-voice).
- `agent-proxy` leitet Sprache durch `discord-voice`, wodurch die normale Eigentümer-/Tool-Autorisierung für die sprechende Person und die Zielsitzung erhalten bleibt, das Agenten-Tool `tts` jedoch ausgeblendet wird, da Discord-Sprache die Wiedergabe übernimmt. Standardmäßig gewährt `agent-proxy` der Konsultation für als Eigentümer erkannte sprechende Personen vollständigen, eigentümergleichen Tool-Zugriff (`voice.realtime.toolPolicy: "owner"`) und bevorzugt nachdrücklich eine Konsultation des OpenClaw-Agenten vor inhaltlichen Antworten (`voice.realtime.consultPolicy: "always"`). In diesem standardmäßigen `always`-Modus spricht die Echtzeitebene vor der Konsultationsantwort nicht automatisch Fülltext; sie erfasst und transkribiert Sprache und gibt anschließend die weitergeleitete OpenClaw-Antwort wieder. Wenn mehrere erzwungene Konsultationsantworten abgeschlossen werden, während Discord noch die erste Antwort wiedergibt, werden spätere Antworten mit exakt vorgegebener Sprachausgabe in eine Warteschlange gestellt, bis die Wiedergabe inaktiv ist, statt die Sprachausgabe mitten im Satz zu ersetzen.
- Im Modus `stt-tts` verwendet STT `tools.media.audio`; `voice.model` wirkt sich nicht auf die Transkription aus.
- In Echtzeitmodi konfigurieren `voice.realtime.provider`, `voice.realtime.model` und `voice.realtime.speakerVoice` die Echtzeit-Audiositzung. Verwenden Sie für OpenAI Realtime 2.1 zusammen mit dem Codex-Gehirn `voice.realtime.model: "gpt-realtime-2.1"` und `voice.model: "openai/gpt-5.6-sol"`.
- Echtzeit-Sprachmodi beziehen standardmäßig kleine Profildateien namens `IDENTITY.md`, `USER.md` und `SOUL.md` in die Anweisungen für den Echtzeit-Provider ein, damit schnelle direkte Gesprächsbeiträge dieselbe Identität, Benutzerverankerung und Persona wie der weitergeleitete OpenClaw-Agent beibehalten. Setzen Sie `voice.realtime.bootstrapContextFiles` auf eine Teilmenge, um dies anzupassen, oder auf `[]`, um es zu deaktivieren. Nur diese Profildateien werden unterstützt; `AGENTS.md` verbleibt im normalen Agentenkontext. Der eingefügte Profilkontext ersetzt `openclaw_agent_consult` nicht für Arbeiten im Arbeitsbereich, aktuelle Fakten, Speicherabfragen oder toolgestützte Aktionen.
- Setzen Sie im OpenAI-Echtzeitmodus `agent-proxy` `voice.realtime.requireWakeName: true`, damit die Discord-Echtzeitsprachausgabe stumm bleibt, bis ein Transkript mit einem Aktivierungsnamen beginnt oder endet. Konfigurierte Aktivierungsnamen müssen aus einem oder zwei Wörtern bestehen. Wenn `voice.realtime.wakeNames` nicht gesetzt ist, verwendet OpenClaw den `name` des weitergeleiteten Agenten plus `OpenClaw` und ersatzweise die Agenten-ID plus `OpenClaw`. Die Aktivierungsnamensprüfung deaktiviert die automatische Antwort des Echtzeit-Providers, leitet akzeptierte Gesprächsbeiträge über den OpenClaw-Agentenkonsultationspfad und gibt eine kurze gesprochene Bestätigung aus, wenn anhand einer Teiltranskription ein vorangestellter Aktivierungsname erkannt wird, bevor das endgültige Transkript eintrifft.
- Der OpenAI-Echtzeit-Provider akzeptiert aktuelle Realtime-2-Ereignisnamen und ältere Codex-kompatible Aliasse für Audioausgabe- und Transkriptereignisse, sodass kompatible Provider-Snapshots abweichen können, ohne Assistentenaudio zu verwerfen.
- `voice.realtime.bargeIn` steuert, ob Discord-Ereignisse zum Sprechbeginn die aktive Echtzeitwiedergabe unterbrechen. Wenn die Option nicht gesetzt ist, folgt sie der Einstellung des Echtzeit-Providers für Unterbrechungen durch Eingangsaudio.
- `voice.realtime.minBargeInAudioEndMs` steuert die Mindestdauer der Assistentenwiedergabe, bevor eine OpenAI-Echtzeitunterbrechung das Audio abschneidet. Standardwert: `250`. Setzen Sie den Wert in Räumen mit geringem Echo für eine sofortige Unterbrechung auf `0`, oder erhöhen Sie ihn bei Lautsprecherkonfigurationen mit starkem Echo.
- `voice.tts` überschreibt `messages.tts` nur für die Sprachwiedergabe mit `stt-tts`; Echtzeitmodi verwenden stattdessen `voice.realtime.speakerVoice`. Setzen Sie für eine OpenAI-Stimme bei der Discord-Wiedergabe `voice.tts.provider: "openai"` und wählen Sie unter `voice.tts.providers.openai.speakerVoice` eine Text-zu-Sprache-Stimme aus. `cedar` ist beim aktuellen OpenAI-TTS-Modell eine gute männlich klingende Wahl.
- Discord-spezifische `systemPrompt`-Überschreibungen pro Kanal gelten für Sprachtranskriptbeiträge des jeweiligen Sprachkanals.
- Sprachtranskriptbeiträge leiten den Eigentümerstatus für eigentümergeschützte Befehle und Kanalaktionen aus Discord-`allowFrom` (oder `dm.allowFrom`) ab. Die Sichtbarkeit der Agenten-Tools folgt der konfigurierten Tool-Richtlinie für die weitergeleitete Sitzung.
- Wenn `voice.autoJoin` mehrere Einträge für denselben Server enthält, tritt OpenClaw dem zuletzt konfigurierten Kanal dieses Servers bei.
- `voice.allowedChannels` ist eine optionale Positivliste für zulässige Aufenthaltskanäle. Lassen Sie die Option nicht gesetzt, damit `/vc join` jedem autorisierten Discord-Sprachkanal beitreten kann. Wenn sie gesetzt ist, werden `/vc join`, der automatische Beitritt beim Start und durch den Sprachstatus des Bots ausgelöste Wechsel auf die aufgeführten `{ guildId, channelId }`-Einträge beschränkt. Setzen Sie sie auf ein leeres Array, um sämtliche Beitritte zu Discord-Sprachkanälen zu verweigern. Wenn Discord den Bot außerhalb der Positivliste verschiebt, verlässt OpenClaw diesen Kanal und tritt erneut dem konfigurierten Ziel für den automatischen Beitritt bei, sofern eines verfügbar ist.
- `voice.daveEncryption` und `voice.decryptionFailureTolerance` werden an die Beitrittsoptionen von `@discordjs/voice` weitergegeben; die Upstream-Standardwerte sind `daveEncryption=true` und `decryptionFailureTolerance=24`.
- OpenClaw verwendet den mitgelieferten Codec `libopus-wasm` für den Empfang von Discord-Sprache und die Echtzeitwiedergabe von rohem PCM. Er enthält einen fest versionierten libopus-WebAssembly-Build und benötigt keine nativen Opus-Add-ons.
- `voice.connectTimeoutMs` steuert die anfängliche Wartezeit auf den `@discordjs/voice`-Status Ready bei `/vc join` und Versuchen zum automatischen Beitritt. Standardwert: `30000`.
- `voice.reconnectGraceMs` steuert, wie lange OpenClaw darauf wartet, dass eine getrennte Sprachsitzung mit der erneuten Verbindung beginnt, bevor sie beendet wird. Standardwert: `15000`.
- Im Modus `stt-tts` endet die Sprachwiedergabe nicht allein deshalb, weil ein anderer Benutzer zu sprechen beginnt. Um Rückkopplungsschleifen zu vermeiden, ignoriert OpenClaw neue Sprachaufnahmen, während TTS wiedergegeben wird; sprechen Sie nach Abschluss der Wiedergabe für den nächsten Gesprächsbeitrag. Echtzeitmodi leiten Sprechbeginn-Ereignisse als Unterbrechungssignale an den Echtzeit-Provider weiter.
- In Echtzeitmodi kann Echo von Lautsprechern in ein offenes Mikrofon wie eine Unterbrechung wirken und die Wiedergabe stoppen. Setzen Sie für Discord-Räume mit starkem Echo `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`, damit OpenAI bei Eingangsaudio nicht automatisch unterbricht. Fügen Sie `voice.realtime.bargeIn: true` hinzu, wenn Discord-Ereignisse zum Sprechbeginn die aktive Wiedergabe weiterhin unterbrechen sollen. Die OpenAI-Echtzeitbrücke ignoriert Wiedergabeabschneidungen, die kürzer als `voice.realtime.minBargeInAudioEndMs` sind, als wahrscheinliches Echo oder Rauschen und protokolliert sie als übersprungen, statt die Discord-Wiedergabe zu löschen.
- `voice.captureSilenceGraceMs` steuert, wie lange OpenClaw nach der Discord-Meldung, dass eine sprechende Person aufgehört hat, wartet, bevor dieses Audiosegment für STT abgeschlossen wird. Standardwert: `2000`; erhöhen Sie ihn, wenn Discord normale Pausen in abgehackte Teiltranskripte aufteilt.
- Wenn ElevenLabs als TTS-Provider ausgewählt ist, verwendet die Discord-Sprachwiedergabe Streaming-TTS und beginnt direkt mit dem Antwortdatenstrom des Providers. Bei Providern ohne Streaming-Unterstützung wird ersatzweise der Pfad über eine synthetisierte temporäre Datei verwendet.
- OpenClaw überwacht Entschlüsselungsfehler beim Empfang und stellt sich automatisch wieder her, indem es den Sprachkanal nach wiederholten Fehlern innerhalb eines kurzen Zeitfensters verlässt und erneut betritt.
- Wenn Empfangsprotokolle nach einer Aktualisierung wiederholt `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` anzeigen, erfassen Sie einen Abhängigkeitsbericht und die Protokolle. Die mitgelieferte Version von `@discordjs/voice` enthält die Upstream-Korrektur für Padding aus discord.js-PR Nr. 11449, durch die discord.js-Issue Nr. 11419 geschlossen wurde.
- Empfangsereignisse mit `The operation was aborted` werden erwartet, wenn OpenClaw ein erfasstes Sprechersegment abschließt; es handelt sich um ausführliche Diagnosedaten, nicht um Warnungen.
- Ausführliche Discord-Sprachprotokolle enthalten für jedes akzeptierte Sprechersegment eine begrenzte einzeilige STT-Transkriptvorschau, sodass beim Debugging sowohl die Benutzerseite als auch die Antwortseite des Agenten sichtbar sind, ohne unbegrenzt viel Transkripttext auszugeben.
- Im Modus `agent-proxy` überspringt die erzwungene Konsultations-Ausweichlogik wahrscheinlich unvollständige Transkriptfragmente, etwa Text, der mit `...` oder einem abschließenden Bindewort wie „und“ endet, sowie offensichtlich nicht handlungsrelevante Abschiedsformulierungen wie „bin gleich zurück“ oder „tschüss“. Die Protokolle zeigen `forced agent consult skipped reason=...`, wenn dadurch eine veraltete Antwort in der Warteschlange verhindert wird.

### Benutzern in Sprachkanälen folgen

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

- `followUsers` akzeptiert unverarbeitete Discord-Benutzer-IDs und Werte im Format `discord:<id>`. OpenClaw normalisiert beide Formen, bevor Sprachstatusereignisse abgeglichen werden.
- `followUsersEnabled` hat standardmäßig den Wert `true`, wenn `followUsers` konfiguriert ist. Setzen Sie die Option auf `false`, um die gespeicherte Liste beizubehalten, aber das automatische Folgen in Sprachkanälen zu beenden.
- Wenn ein Benutzer, dem gefolgt wird, einem zulässigen Sprachkanal beitritt, tritt OpenClaw diesem Kanal bei. Wenn der Benutzer wechselt, wechselt OpenClaw mit ihm. Wenn der aktive Benutzer, dem gefolgt wird, die Verbindung trennt, verlässt OpenClaw den Kanal.
- Wenn sich mehrere Benutzer, denen gefolgt wird, auf demselben Server befinden und der aktive Benutzer, dem gefolgt wird, den Kanal verlässt, wechselt OpenClaw zum Kanal eines anderen verfolgten Benutzers, bevor es den Server verlässt. Wenn mehrere Benutzer, denen gefolgt wird, gleichzeitig wechseln, ist das zuletzt beobachtete Sprachstatusereignis maßgeblich.
- `allowedChannels` gilt weiterhin. Ein Benutzer, dem gefolgt wird und der sich in einem nicht zulässigen Kanal befindet, wird ignoriert; eine durch die Folgefunktion verwaltete Sitzung wechselt zu einem anderen Benutzer, dem gefolgt wird, oder verlässt den Kanal.
- OpenClaw gleicht verpasste Sprachstatusereignisse beim Start und in begrenzten Intervallen ab. Der Abgleich prüft konfigurierte Server stichprobenartig und begrenzt die Anzahl der REST-Abfragen pro Durchlauf, sodass sehr große `followUsers`-Listen möglicherweise mehr als ein Intervall benötigen, um einen stabilen Zustand zu erreichen.
- Wenn Discord oder eine Administration den Bot verschiebt, während er einem Benutzer folgt, erstellt OpenClaw die Sprachsitzung neu und behält die Zuständigkeit der Folgefunktion bei, sofern das Ziel zulässig ist. Wenn der Bot außerhalb von `allowedChannels` verschoben wird, verlässt OpenClaw den Kanal und tritt erneut dem konfigurierten Ziel bei, sofern eines vorhanden ist.
- Die DAVE-Empfangswiederherstellung kann nach wiederholten Entschlüsselungsfehlern denselben Kanal verlassen und erneut betreten. Durch die Folgefunktion verwaltete Sitzungen behalten während dieses Wiederherstellungspfads ihre Folgezuordnung bei, sodass der Kanal weiterhin verlassen wird, wenn ein Benutzer, dem gefolgt wird, später die Verbindung trennt.

Wählen Sie zwischen den Beitrittsmodi:

- Verwenden Sie `followUsers` für persönliche Konfigurationen oder Administratorkonfigurationen, bei denen der Bot automatisch im Sprachkanal sein soll, wenn Sie dort sind.
- Verwenden Sie `autoJoin` für Bots in festen Räumen, die auch dann anwesend sein sollen, wenn sich kein verfolgter Benutzer in einem Sprachkanal befindet.
- Verwenden Sie `/vc join` für einmalige Beitritte oder Räume, in denen eine automatische Sprachanwesenheit überraschend wäre.

Discord-Sprachcodec:

- Sprachaufnahmeprotokolle zeigen `discord voice: opus decoder: libopus-wasm`.
- Die Echtzeitwiedergabe codiert rohes Stereo-PCM mit 48 kHz mit demselben mitgelieferten Paket `libopus-wasm` in Opus, bevor die Pakete an `@discordjs/voice` übergeben werden.
- Die Datei- und Provider-Datenstromwiedergabe transcodiert mit ffmpeg in rohes Stereo-PCM mit 48 kHz und verwendet anschließend `libopus-wasm` für den an Discord gesendeten Opus-Paketdatenstrom.

STT-plus-TTS-Pipeline:

- Die Discord-PCM-Aufnahme wird in eine temporäre WAV-Datei konvertiert.
- `tools.media.audio` übernimmt STT, beispielsweise `openai/gpt-4o-mini-transcribe`.
- Das Transkript wird über den Discord-Eingang und das Routing weitergeleitet, während das Antwort-LLM mit einer Sprachausgaberichtlinie ausgeführt wird, die das Agenten-Tool `tts` ausblendet und zur Rückgabe von Text auffordert, da Discord Voice die abschließende TTS-Wiedergabe übernimmt.
- Wenn `voice.model` festgelegt ist, überschreibt es nur das Antwort-LLM für diesen Durchlauf im Sprachkanal.
- `voice.tts` wird über `messages.tts` gelegt; Streaming-fähige Provider speisen den Player direkt, andernfalls wird die resultierende Audiodatei im beigetretenen Kanal abgespielt.

Beispiel für eine standardmäßige Agenten-Proxy-Sitzung im Sprachkanal:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.6-sol",
        followUsersEnabled: true,
        followUsers: ["123456789012345678"],
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

Ohne einen `voice.agentSession`-Block erhält jeder Sprachkanal eine eigene geroutete OpenClaw-Sitzung. Beispielsweise kommuniziert `/vc join channel:234567890123456789` mit der Sitzung für diesen Discord-Sprachkanal. Das Echtzeitmodell dient nur als Sprach-Frontend; inhaltliche Anfragen werden an den konfigurierten OpenClaw-Agenten übergeben. Wenn das Echtzeitmodell ein endgültiges Transkript erzeugt, ohne das Konsultations-Tool aufzurufen, erzwingt OpenClaw die Konsultation als Rückfalllösung, damit sich die Standardeinstellung weiterhin wie ein Gespräch mit dem Agenten verhält.

Beispiel für klassisches STT mit anschließendem TTS:

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
        model: "openai/gpt-5.6-sol",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
          toolPolicy: "safe-read-only",
          consultPolicy: "always",
        },
      },
    },
  },
}
```

Sprachkommunikation als Erweiterung einer bestehenden Discord-Kanalsitzung:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "agent-proxy",
        model: "openai/gpt-5.6-sol",
        agentSession: {
          mode: "target",
          target: "channel:123456789012345678",
        },
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

Im Modus `agent-proxy` tritt der Bot dem konfigurierten Sprachkanal bei, die Durchläufe des OpenClaw-Agenten verwenden jedoch die normale geroutete Sitzung und den Agenten des Zielkanals. Die Echtzeit-Sprachsitzung gibt das zurückgegebene Ergebnis im Sprachkanal wieder. Der überwachende Agent kann gemäß seiner Tool-Richtlinie weiterhin normale Nachrichten-Tools verwenden und beispielsweise eine separate Discord-Nachricht senden, wenn dies die richtige Aktion ist.

Während ein delegierter OpenClaw-Durchlauf aktiv ist, werden neue Discord-Sprachtranskripte als Live-Steuerung des Durchlaufs behandelt, bevor ein weiterer Agentendurchlauf gestartet wird. Formulierungen wie „Status“, „das abbrechen“, „die kleinere Korrektur verwenden“ oder „wenn Sie fertig sind, auch die Tests prüfen“ werden als Status-, Abbruch-, Steuerungs- oder Folgeeingabe für die aktive Sitzung klassifiziert. Status-, Abbruch-, akzeptierte Steuerungs- und Folgeergebnisse werden im Sprachkanal wiedergegeben, damit der Anrufer weiß, ob OpenClaw die Anfrage verarbeitet hat.

Nützliche Zielformen:

- `target: "channel:123456789012345678"` routet über eine Discord-Textkanalsitzung.
- `target: "123456789012345678"` wird als Kanalziel behandelt.
- `target: "dm:123456789012345678"` oder `target: "user:123456789012345678"` routet über die zugehörige Direktnachrichtensitzung.

Beispiel für OpenAI Realtime bei starkem Echo:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai/gpt-5.6-sol",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
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

Verwenden Sie dies, wenn das Modell seine eigene Discord-Wiedergabe über ein offenes Mikrofon hört, Sie es aber weiterhin durch Sprechen unterbrechen möchten. OpenClaw verhindert, dass OpenAI bei rohen Audioeingaben automatisch unterbricht, während `bargeIn: true` dafür sorgt, dass Discord-Ereignisse beim Beginn einer Sprecheraktivität und Audiodaten bereits aktiver Sprecher laufende Echtzeitantworten abbrechen können, bevor die nächste erfasste Äußerung OpenAI erreicht. Sehr frühe Unterbrechungssignale mit einem `audioEndMs`-Wert unter `minBargeInAudioEndMs` werden als wahrscheinliches Echo oder Rauschen behandelt und ignoriert, damit das Modell nicht bereits beim ersten Wiedergabe-Frame abbricht.

Erwartete Sprachprotokolle:

- Beim Beitritt: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- Beim Start der Echtzeitverarbeitung: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- Bei Sprecher-Audio: `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...` und `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- Bei übersprungener veralteter Spracheingabe: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` oder `reason=non-actionable-closing ...`
- Beim Abschluss einer Echtzeitantwort: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- Beim Stoppen oder Zurücksetzen der Wiedergabe: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- Bei einer Echtzeitkonsultation: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- Bei einer Agentenantwort: `discord voice: agent turn answer ...`
- Bei eingereihter exakter Sprachausgabe: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`, gefolgt von `discord voice: realtime exact speech dequeued reason=player-idle ...`
- Bei Erkennung einer Sprachunterbrechung: `discord voice: realtime barge-in detected source=speaker-start ...` oder `discord voice: realtime barge-in detected source=active-speaker-audio ...`, gefolgt von `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- Bei einer Echtzeitunterbrechung: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`, gefolgt von entweder `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` oder `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- Bei ignoriertem Echo oder Rauschen: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- Bei deaktivierter Sprachunterbrechung: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- Bei inaktiver Wiedergabe: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

Lesen Sie zur Diagnose abgeschnittener Audiodaten die Echtzeit-Sprachprotokolle als Zeitleiste:

1. `realtime audio playback started` bedeutet, dass Discord mit der Wiedergabe der Agentenausgabe begonnen hat. Ab diesem Zeitpunkt zählt die Bridge die Agentenausgabe-Blöcke, Discord-PCM-Bytes, Echtzeit-Bytes des Providers und die synthetisierte Audiodauer.
2. `realtime speaker turn opened` kennzeichnet, dass ein Discord-Sprecher aktiv wird. Wenn die Wiedergabe bereits aktiv und `bargeIn` aktiviert ist, kann darauf `barge-in detected source=speaker-start` folgen.
3. `realtime input audio started` kennzeichnet den ersten tatsächlich empfangenen Audio-Frame für diese Sprecheräußerung. `outputActive=true` oder ein von null abweichender Wert für `outputAudioMs` bedeutet hier, dass das Mikrofon Eingaben sendet, während die Agentenausgabe noch wiedergegeben wird.
4. `barge-in detected source=active-speaker-audio` bedeutet, dass OpenClaw während der aktiven Agentenwiedergabe Live-Audio eines Sprechers erkannt hat. Dies ist hilfreich, um eine echte Unterbrechung von einem Discord-Ereignis beim Beginn einer Sprecheraktivität ohne verwertbares Audio zu unterscheiden.
5. `barge-in requested reason=...` bedeutet, dass OpenClaw den Echtzeit-Provider aufgefordert hat, die aktive Antwort abzubrechen oder zu kürzen. Die Meldung enthält `outputAudioMs`, `outputActive` und `playbackChunks`, damit Sie erkennen können, wie viel Agentenaudio vor der Unterbrechung tatsächlich abgespielt wurde.
6. `realtime audio playback stopped reason=...` ist der lokale Rücksetzpunkt der Discord-Wiedergabe. Der Grund gibt an, wodurch die Wiedergabe beendet wurde: `barge-in`, `player-idle`, `provider-clear-audio`, `forced-agent-consult`, `stream-close` oder `session-close`.
7. `realtime speaker turn closed` fasst die erfasste Eingabeäußerung zusammen. `chunks=0` oder `hasAudio=false` bedeutet, dass die Sprecheräußerung begonnen hat, aber kein verwertbares Audio die Echtzeit-Bridge erreicht hat. `interruptedPlayback=true` bedeutet, dass sich diese Eingabeäußerung mit der Agentenausgabe überschnitten und die Logik zur Sprachunterbrechung ausgelöst hat.

Nützliche Felder:

- `outputAudioMs`: Dauer der vom Echtzeit-Provider vor der Protokollzeile erzeugten Agentenaudiodaten.
- `audioMs`: Dauer der Agentenaudiodaten, die OpenClaw vor dem Beenden der Wiedergabe gezählt hat.
- `elapsedMs`: verstrichene Echtzeit zwischen dem Öffnen und Schließen des Wiedergabestreams oder der Sprecheräußerung.
- `discordBytes`: 48-kHz-Stereo-PCM-Bytes, die an Discord Voice gesendet oder von dort empfangen wurden.
- `realtimeBytes`: PCM-Bytes im Providerformat, die an den Echtzeit-Provider gesendet oder von dort empfangen wurden.
- `playbackChunks`: Agentenaudio-Blöcke, die für die aktive Antwort an Discord weitergeleitet wurden.
- `sinceLastAudioMs`: Zeitspanne zwischen dem letzten erfassten Audio-Frame des Sprechers und dem Schließen der Sprecheräußerung.

Häufige Muster:

- Ein sofortiger Abbruch mit `source=active-speaker-audio`, einem kleinen `outputAudioMs`-Wert und demselben Benutzer in der Nähe deutet üblicherweise darauf hin, dass Lautsprecherecho in das Mikrofon gelangt. Erhöhen Sie `voice.realtime.minBargeInAudioEndMs`, verringern Sie die Lautstärke, verwenden Sie Kopfhörer oder setzen Sie `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`.
- Wenn auf `source=speaker-start` die Meldung `speaker turn closed ... hasAudio=false` folgt, hat Discord den Beginn einer Sprecheraktivität gemeldet, aber OpenClaw hat keine Audiodaten erhalten. Ursache kann ein vorübergehendes Discord-Voice-Ereignis, das Verhalten eines Noise Gates oder die kurzzeitige Aktivierung des Mikrofons durch einen Client sein.
- `audio playback stopped reason=stream-close` ohne eine zeitlich nahe Sprachunterbrechung oder `provider-clear-audio` bedeutet, dass der lokale Discord-Wiedergabestream unerwartet beendet wurde. Prüfen Sie die vorhergehenden Protokolle des Providers und des Discord-Players.
- `capture ignored during playback (barge-in disabled)` bedeutet, dass OpenClaw Eingaben absichtlich verworfen hat, während Agentenaudio aktiv war. Aktivieren Sie `voice.realtime.bargeIn`, wenn Sprache die Wiedergabe unterbrechen soll.
- `barge-in ignored ... outputActive=false` bedeutet, dass Discord oder die Sprachaktivitätserkennung des Providers Sprache gemeldet hat, OpenClaw jedoch keine aktive Wiedergabe unterbrechen konnte. Dies sollte die Audiowiedergabe nicht abschneiden.

Anmeldedaten werden komponentenweise aufgelöst: die Authentifizierung der LLM-Route für `voice.model`, die STT-Authentifizierung für `tools.media.audio`, die TTS-Authentifizierung für `messages.tts`/`voice.tts` und die Authentifizierung des Echtzeit-Providers für `voice.realtime.providers` oder die normale Authentifizierungskonfiguration des Providers.

### Sprachnachrichten

Discord-Sprachnachrichten zeigen eine Wellenformvorschau an und erfordern OGG-/Opus-Audio. OpenClaw erzeugt die Wellenform automatisch, benötigt jedoch `ffmpeg` und `ffprobe` auf dem Gateway-Host, um die Audiodaten zu untersuchen und zu konvertieren.

- Geben Sie einen **lokalen Dateipfad** an (URLs werden abgelehnt).
- Lassen Sie den Textinhalt weg (Discord lehnt Text und Sprachnachrichten in derselben Nutzlast ab).
- Jedes Audioformat wird akzeptiert; OpenClaw konvertiert es bei Bedarf in OGG/Opus.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Nicht erlaubte Intents verwendet oder der Bot sieht keine Servernachrichten">

    - Message Content Intent aktivieren
    - Server Members Intent aktivieren, wenn Sie auf die Auflösung von Benutzern/Mitgliedern angewiesen sind
    - Gateway nach dem Ändern der Intents neu starten

  </Accordion>

  <Accordion title="Guild-Nachrichten werden unerwartet blockiert">

    - `groupPolicy` überprüfen
    - Guild-Zulassungsliste unter `channels.discord.guilds` überprüfen
    - wenn eine Guild eine `channels`-Zuordnung enthält, sind nur die aufgeführten Kanäle zulässig
    - Verhalten von `requireMention` und Erwähnungsmuster überprüfen

    Nützliche Prüfungen:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Erwähnung ist nicht erforderlich, aber Nachrichten werden weiterhin blockiert">
    Häufige Ursachen:

    - `groupPolicy="allowlist"` ohne passende Guild-/Kanal-Zulassungsliste
    - `requireMention` an der falschen Stelle konfiguriert (muss unter `channels.discord.guilds` oder einem Kanaleintrag stehen)
    - Absender durch die Guild-/Kanal-Zulassungsliste `users` blockiert

  </Accordion>

  <Accordion title="Lange laufende Discord-Durchläufe oder doppelte Antworten">

    Typische Protokolleinträge:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Einstellungen für die Discord-Gateway-Warteschlange:

    - Einzelkonto: `channels.discord.eventQueue.listenerTimeout`
    - mehrere Konten: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - dies steuert nur die Arbeit des Discord-Gateway-Listeners, nicht die Lebensdauer eines Agent-Durchlaufs

    Discord wendet auf Agent-Durchläufe in der Warteschlange kein kanaleigenes Zeitlimit an. Nachrichten-Listener übergeben die Verarbeitung sofort, und Discord-Durchläufe in der Warteschlange behalten die Reihenfolge pro Sitzung bei, bis der Sitzungs-/Werkzeug-/Laufzeitlebenszyklus die Arbeit abschließt oder abbricht.

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

  <Accordion title="Warnungen wegen Zeitüberschreitung bei der Suche nach Gateway-Metadaten">
    OpenClaw ruft vor dem Verbindungsaufbau die Discord-Metadaten von `/gateway/bot` ab. Bei vorübergehenden Fehlern wird auf die Standard-Gateway-URL von Discord zurückgegriffen, und die Protokollierung wird ratenbegrenzt.

    Einstellungen für Metadaten-Zeitüberschreitungen:

    - Einzelkonto: `channels.discord.gatewayInfoTimeoutMs`
    - mehrere Konten: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - Rückgriff auf Umgebungsvariable, wenn keine Konfiguration festgelegt ist: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - Standardwert: `30000` (30 Sekunden), Maximum: `120000`

  </Accordion>

  <Accordion title="Neustarts wegen Zeitüberschreitung bei Gateway READY">
    OpenClaw wartet während des Starts und nach erneuten Laufzeitverbindungen auf das Gateway-Ereignis `READY` von Discord. Konfigurationen mit mehreren Konten und zeitversetztem Start benötigen möglicherweise ein längeres READY-Zeitfenster beim Start als den Standardwert.

    Einstellungen für READY-Zeitüberschreitungen:

    - Start mit Einzelkonto: `channels.discord.gatewayReadyTimeoutMs`
    - Start mit mehreren Konten: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - Rückgriff beim Start auf Umgebungsvariable, wenn keine Konfiguration festgelegt ist: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - Standardwert beim Start: `15000` (15 Sekunden), Maximum: `120000`
    - Laufzeit mit Einzelkonto: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - Laufzeit mit mehreren Konten: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - Rückgriff zur Laufzeit auf Umgebungsvariable, wenn keine Konfiguration festgelegt ist: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - Standardwert zur Laufzeit: `30000` (30 Sekunden), Maximum: `120000`

  </Accordion>

  <Accordion title="Abweichungen bei der Berechtigungsprüfung">
    Die Berechtigungsprüfungen von `channels status --probe` funktionieren nur mit numerischen Kanal-IDs.

    Wenn Sie Slug-Schlüssel verwenden, kann die Laufzeitzuordnung dennoch funktionieren, aber die Prüfung kann die Berechtigungen nicht vollständig verifizieren.

  </Accordion>

  <Accordion title="Probleme mit Direktnachrichten und Kopplung">

    - Direktnachrichten deaktiviert: `channels.discord.dm.enabled=false`
    - Richtlinie für Direktnachrichten deaktiviert: `channels.discord.dmPolicy="disabled"` (veraltet: `channels.discord.dm.policy`)
    - im Modus `pairing` wird auf die Genehmigung der Kopplung gewartet

  </Accordion>

  <Accordion title="Bot-zu-Bot-Schleifen">
    Standardmäßig werden von Bots verfasste Nachrichten ignoriert.

    Wenn Sie `channels.discord.allowBots=true` festlegen, verwenden Sie strenge Regeln für Erwähnungen und Zulassungslisten, um Schleifen zu vermeiden.
    Bevorzugen Sie `channels.discord.allowBots="mentions"`, um nur Bot-Nachrichten zu akzeptieren, die den Bot erwähnen.

    OpenClaw enthält außerdem einen gemeinsamen [Schutz vor Bot-Schleifen](/de/channels/bot-loop-protection). Wenn `allowBots` zulässt, dass von Bots verfasste Nachrichten die Weiterleitung erreichen, ordnet Discord das eingehende Ereignis Fakten des Typs `(Konto, Kanal, Bot-Paar)` zu, und die generische Paarsicherung unterdrückt das Paar, sobald es das konfigurierte Ereignisbudget überschreitet. Die Sicherung verhindert außer Kontrolle geratene Schleifen zwischen zwei Bots, die zuvor durch Discord-Ratenbegrenzungen gestoppt werden mussten. Sie wirkt sich nicht auf Bereitstellungen mit einem einzelnen Bot oder einmalige Bot-Antworten aus, die innerhalb des Budgets bleiben.

    Standardeinstellungen (aktiv, wenn `allowBots` festgelegt ist):

    - `maxEventsPerWindow: 20` -- das Bot-Paar kann innerhalb des gleitenden Zeitfensters 20 Nachrichten austauschen
    - `windowSeconds: 60` -- Länge des gleitenden Zeitfensters
    - `cooldownSeconds: 60` -- sobald das Budget überschritten wird, wird eine Minute lang jede weitere Bot-zu-Bot-Nachricht in beide Richtungen verworfen

    Konfigurieren Sie den gemeinsamen Standard einmal unter `channels.defaults.botLoopProtection` und überschreiben Sie ihn anschließend für Discord, wenn ein legitimer Arbeitsablauf mehr Spielraum benötigt. Die Rangfolge lautet:

    - `channels.discord.accounts.<account>.botLoopProtection`
    - `channels.discord.botLoopProtection`
    - `channels.defaults.botLoopProtection`
    - integrierte Standardwerte

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
      // Optionale Discord-weite Überschreibung. Kontoblöcke überschreiben einzelne
      // Felder und übernehmen ausgelassene Felder von hier.
      botLoopProtection: {
        maxEventsPerWindow: 4,
      },
      accounts: {
        alpha: {
          // Alpha reagiert nur auf andere Bots, wenn diese ihn erwähnen.
          allowBots: "mentions",
        },
        bravo: {
          // Bravo reagiert auf alle von Bots verfassten Discord-Nachrichten.
          allowBots: true,
          mentionAliases: {
            // Ermöglicht Bravo, mit der konfigurierten Benutzer-ID eine Discord-Erwähnung von Alpha zu schreiben.
            Alpha: "ALPHA_DISCORD_USER_ID",
          },
          botLoopProtection: {
            // Bis zu fünf Nachrichten pro Minute zulassen, bevor das Paar unterdrückt wird.
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

  <Accordion title="Voice-STT-Aussetzer mit DecryptionFailed(...)">

    - OpenClaw aktuell halten (`openclaw update`), damit die Wiederherstellungslogik für den Discord-Sprachempfang vorhanden ist
    - bestätigen, dass `channels.discord.voice.daveEncryption=true` festgelegt ist (Standardwert)
    - mit `channels.discord.voice.decryptionFailureTolerance=24` beginnen (Upstream-Standardwert) und nur bei Bedarf anpassen
    - Protokolle auf Folgendes überwachen:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - wenn die Fehler nach dem automatischen erneuten Beitritt weiterhin auftreten, Protokolle erfassen und mit dem Upstream-Verlauf zum DAVE-Empfang in [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) und [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) vergleichen

  </Accordion>
</AccordionGroup>

## Konfigurationsreferenz

Primäre Referenz: [Konfigurationsreferenz – Discord](/de/gateway/config-channels#discord).

<Accordion title="Wichtige Discord-Felder">

- Start/Authentifizierung: `enabled`, `token`, `applicationId`, `accounts.*`, `allowBots`
- Richtlinie: `groupPolicy`, `dmPolicy`, `allowFrom`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- Befehle: `commands.native`, `commands.useAccessGroups` (global), `configWrites`, `slashCommand.ephemeral`
- Ereigniswarteschlange: `eventQueue.listenerTimeout` (Listener-Budget, Standardwert `120000`), `eventQueue.maxQueueSize` (Standardwert `10000`), `eventQueue.maxConcurrency` (Standardwert `50`)
- Gateway: `proxy`, `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- Antworten/Verlauf: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- Zustellung: `textChunkLimit` (Standardwert `2000`), `maxLinesPerMessage` (Standardwert `17`)
- Streaming: `streaming.mode`, `streaming.chunkMode`, `streaming.preview.*`, `streaming.progress.*`, `streaming.block.*` (die veralteten flachen Schlüssel `streamMode`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce` und `chunkMode` werden durch `openclaw doctor --fix` nach `streaming.*` migriert)
- Medien/Wiederholungsversuche: `mediaMaxMb` (begrenzt ausgehende Discord-Uploads, Standardwert `100`), `retry`
- Aktionen: `actions.*`
- Präsenz: `activity`, `status`, `activityType`, `activityUrl`, `autoPresence.*`
- Benutzeroberfläche: `ui.components.accentColor`
- Funktionen: `threadBindings`, `bindings[]` auf oberster Ebene (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents.enabled`, `agentComponents.ttlMs`, `heartbeat`, `responsePrefix`

</Accordion>

## Sicherheit und Betrieb

- Behandeln Sie Bot-Token als Geheimnisse (`DISCORD_BOT_TOKEN` wird in überwachten Umgebungen bevorzugt).
- Erteilen Sie Discord-Berechtigungen nach dem Prinzip der geringsten Rechte.
- Wenn die Befehlsbereitstellung oder der Status veraltet ist, starten Sie das Gateway neu und prüfen Sie erneut mit `openclaw channels status --probe`.

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Kopplung" icon="link" href="/de/channels/pairing">
    Koppeln Sie einen Discord-Benutzer mit dem Gateway.
  </Card>
  <Card title="Gruppen" icon="users" href="/de/channels/groups">
    Verhalten von Gruppenchats und Zulassungslisten.
  </Card>
  <Card title="Kanalweiterleitung" icon="route" href="/de/channels/channel-routing">
    Leiten Sie eingehende Nachrichten an Agenten weiter.
  </Card>
  <Card title="Sicherheit" icon="shield" href="/de/gateway/security">
    Bedrohungsmodell und Absicherung.
  </Card>
  <Card title="Weiterleitung an mehrere Agenten" icon="sitemap" href="/de/concepts/multi-agent">
    Ordnen Sie Guilds und Kanäle Agenten zu.
  </Card>
  <Card title="Slash-Befehle" icon="terminal" href="/de/tools/slash-commands">
    Verhalten nativer Befehle.
  </Card>
</CardGroup>
