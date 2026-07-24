---
read_when:
    - Arbeiten an Discord-Kanalfunktionen
summary: Einrichtung des Discord-Bots, Konfigurationsschlüssel, Komponenten, Sprache und Fehlerbehebung
title: Discord
x-i18n:
    generated_at: "2026-07-24T04:20:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 52a2926217f3a8dfb9398551ddacb0bc6aae6de0a164b215c55256eda9b6245e
    source_path: channels/discord.md
    workflow: 16
---

OpenClaw verbindet sich über das offizielle Discord-Gateway als Bot mit Discord. DMs und Guild-Kanäle werden unterstützt.

<CardGroup cols={3}>
  <Card title="Kopplung" icon="link" href="/de/channels/pairing">
    Discord-DMs verwenden standardmäßig den Kopplungsmodus.
  </Card>
  <Card title="Slash-Befehle" icon="terminal" href="/de/tools/slash-commands">
    Verhalten nativer Befehle und Befehlskatalog.
  </Card>
  <Card title="Fehlerbehebung für Kanäle" icon="wrench" href="/de/channels/troubleshooting">
    Kanalübergreifende Diagnose und Reparaturablauf.
  </Card>
</CardGroup>

## Schnelleinrichtung

Erstellen Sie eine Discord-Anwendung mit einem Bot, fügen Sie den Bot Ihrem Server hinzu und koppeln Sie ihn mit OpenClaw. Verwenden Sie nach Möglichkeit einen privaten Server; [erstellen Sie zuerst einen](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (**Create My Own > For me and my friends**), falls erforderlich.

<Steps>
  <Step title="Discord-Anwendung und Bot erstellen">
    Klicken Sie im [Discord Developer Portal](https://discord.com/developers/applications) auf **New Application** und geben Sie einen Namen ein (zum Beispiel „OpenClaw“).

    Öffnen Sie in der Seitenleiste **Bot** und legen Sie für **Username** den Namen Ihres Agenten fest.

  </Step>

  <Step title="Privilegierte Intents aktivieren">
    Aktivieren Sie weiterhin auf der Seite **Bot** unter **Privileged Gateway Intents** Folgendes:

    - **Message Content Intent** (erforderlich)
    - **Server Members Intent** (empfohlen; erforderlich für Rollen-Zulassungslisten, die Zuordnung von Namen zu IDs und Zugriffsgruppen für Kanalzielgruppen)
    - **Presence Intent** (optional; nur für Anwesenheitsaktualisierungen)

  </Step>

  <Step title="Bot-Token kopieren">
    Klicken Sie auf der Seite **Bot** auf **Reset Token** und kopieren Sie das Token.

    <Note>
    Trotz der Bezeichnung wird dadurch Ihr erstes Token erzeugt – es wird nichts „zurückgesetzt“.
    </Note>

  </Step>

  <Step title="Einladungs-URL generieren und Bot zum Server hinzufügen">
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

    Dies ist die Grundausstattung für normale Textkanäle. Wenn der Bot in Threads posten soll – einschließlich Abläufen in Foren- oder Medienkanälen, die einen Thread erstellen oder fortsetzen –, aktivieren Sie zusätzlich **Send Messages in Threads**.

    Kopieren Sie die generierte URL, öffnen Sie sie in einem Browser, wählen Sie Ihren Server aus und klicken Sie auf **Continue**. Der Bot sollte nun auf Ihrem Server erscheinen.

  </Step>

  <Step title="Entwicklermodus aktivieren und IDs erfassen">
    Aktivieren Sie in der Discord-App den Entwicklermodus, damit Sie IDs kopieren können:

    1. **User Settings** (Zahnradsymbol) → **Developer** → **Developer Mode** einschalten
       *(auf Mobilgeräten: **App Settings** → **Advanced**)*
    2. Klicken Sie mit der rechten Maustaste auf Ihr **Serversymbol** → **Copy Server ID**
    3. Klicken Sie mit der rechten Maustaste auf Ihren **eigenen Avatar** → **Copy User ID**

    Bewahren Sie die Server-ID und die Benutzer-ID zusammen mit Ihrem Bot-Token auf; im nächsten Schritt benötigen Sie alle drei.

  </Step>

  <Step title="DMs von Servermitgliedern zulassen">
    Damit die Kopplung funktioniert, muss Discord dem Bot erlauben, Ihnen eine DM zu senden. Klicken Sie mit der rechten Maustaste auf Ihr **Serversymbol** → **Privacy Settings** → **Direct Messages** einschalten.

    Lassen Sie dies aktiviert, wenn Sie Discord-DMs mit OpenClaw verwenden. Wenn Sie ausschließlich Guild-Kanäle verwenden, können Sie es nach der Kopplung deaktivieren.

  </Step>

  <Step title="Bot-Token sicher festlegen (nicht im Chat senden)">
    Das Bot-Token ist ein Geheimnis. Legen Sie es auf dem Computer fest, auf dem OpenClaw ausgeführt wird, bevor Sie Ihrem Agenten eine Nachricht senden:

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

    Wenn OpenClaw bereits als Hintergrunddienst ausgeführt wird, starten Sie ihn über die OpenClaw-Mac-App neu oder indem Sie den Prozess `openclaw gateway run` beenden und neu starten.
    Führen Sie bei verwalteten Dienstinstallationen `openclaw gateway install` in einer Shell aus, in der `DISCORD_BOT_TOKEN` gesetzt ist, oder speichern Sie die Variable in `~/.openclaw/.env`, damit der Dienst die Umgebungs-SecretRef nach dem Neustart auflösen kann.
    Wenn Ihr Host durch Discords Anwendungsabfrage beim Start blockiert oder ratenbegrenzt wird, legen Sie die Anwendungs-/Client-ID aus dem Developer Portal fest, damit dieser REST-Aufruf beim Start übersprungen werden kann: `channels.discord.applicationId` für das Standardkonto oder `channels.discord.accounts.<accountId>.applicationId` pro Bot.

  </Step>

  <Step title="OpenClaw konfigurieren und koppeln">

    <Tabs>
      <Tab title="Ihren Agenten fragen">
        Chatten Sie über einen vorhandenen Kanal (zum Beispiel Telegram) mit Ihrem OpenClaw-Agenten und teilen Sie ihm Folgendes mit. Wenn Discord Ihr erster Kanal ist, verwenden Sie stattdessen den Tab „CLI / Konfiguration“.

        > „Ich habe mein Discord-Bot-Token bereits in der Konfiguration festgelegt. Bitte schließen Sie die Discord-Einrichtung mit der Benutzer-ID `<user_id>` und der Server-ID `<server_id>` ab.“
      </Tab>
      <Tab title="CLI / Konfiguration">
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

        Umgebungs-Fallback für das Standardkonto:

```bash
DISCORD_BOT_TOKEN=...
```

        Schreiben Sie für eine skriptgesteuerte oder entfernte Einrichtung denselben JSON5-Block mit `openclaw config patch --file ./discord.patch.json5 --dry-run` und führen Sie ihn anschließend ohne `--dry-run` erneut aus. Klartextzeichenfolgen für `token` funktionieren ebenfalls, und SecretRef-Werte für `channels.discord.token` werden über env-/file-/exec-Provider hinweg unterstützt. Siehe [Geheimnisverwaltung](/de/gateway/secrets).

        Speichern Sie bei mehreren Discord-Bots jedes Bot-Token und jede Anwendungs-ID unter dem jeweiligen Konto. Ein `channels.discord.applicationId` auf oberster Ebene wird von den Konten geerbt; legen Sie es dort daher nur fest, wenn alle Konten dieselbe Anwendungs-ID verwenden.

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
    Sobald das Gateway ausgeführt wird, senden Sie Ihrem Bot in Discord eine DM. Er antwortet mit einem Kopplungscode.

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

    Kopplungscodes laufen nach 1 Stunde ab. Chatten Sie nach der Genehmigung über eine Discord-DM mit Ihrem Agenten.

  </Step>
</Steps>

<Note>
Die Token-Auflösung berücksichtigt das Konto. Token-Werte aus der Konfiguration haben Vorrang vor dem Umgebungs-Fallback, und `DISCORD_BOT_TOKEN` wird nur für das Standardkonto verwendet.
Wenn zwei aktivierte Discord-Konten dasselbe Bot-Token auflösen, startet OpenClaw für dieses Token nur einen Gateway-Monitor: Ein aus der Konfiguration stammendes Token hat Vorrang vor dem Umgebungs-Fallback; andernfalls gewinnt das erste aktivierte Konto, und das doppelte Konto wird mit dem Grund `duplicate bot token` als deaktiviert gemeldet.
Für erweiterte ausgehende Aufrufe (Nachrichtenwerkzeug/Kanalaktionen) wird ein explizites `token` pro Aufruf für diesen Aufruf verwendet. Dies gilt für Sendeaktionen sowie Lese-/Prüfaktionen (Lesen/Suchen/Abrufen/Thread/Pins/Berechtigungen). Kontorichtlinien und Wiederholungseinstellungen stammen weiterhin aus dem ausgewählten Konto im aktiven Laufzeit-Snapshot.
</Note>

## Empfohlen: Guild-Arbeitsbereich einrichten

Sobald DMs funktionieren, können Sie Ihren Server in einen vollständigen Arbeitsbereich umwandeln, in dem jeder Kanal eine eigene Agentensitzung mit eigenem Kontext erhält. Dies wird für private Server empfohlen, auf denen sich nur Sie und Ihr Bot befinden.

<Steps>
  <Step title="Server zur Guild-Zulassungsliste hinzufügen">
    Dadurch kann Ihr Agent in jedem Kanal Ihres Servers antworten, nicht nur in DMs.

    <Tabs>
      <Tab title="Ihren Agenten fragen">
        > „Fügen Sie meine Discord-Server-ID `<server_id>` zur Guild-Zulassungsliste hinzu.“
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
    Standardmäßig antwortet der Agent in Guild-Kanälen nur, wenn er mit @ erwähnt wird. Auf einem privaten Server soll er wahrscheinlich auf jede Nachricht antworten.

    In Guild-Kanälen werden normale Antworten standardmäßig automatisch gepostet. Aktivieren Sie für gemeinsam genutzte, dauerhaft aktive Räume `messages.groupChat.visibleReplies: "message_tool"`, damit der Agent mitlesen und nur dann posten kann, wenn er eine Antwort im Kanal für sinnvoll hält. Dies funktioniert am besten mit Modellen der neuesten Generation, die Werkzeuge zuverlässig verwenden, beispielsweise GPT-5.6 Sol. Ereignisse in Umgebungsräumen bleiben still, sofern das Werkzeug nichts sendet. Die vollständige Konfiguration des Mitlesemodus finden Sie unter [Ereignisse in Umgebungsräumen](/de/channels/ambient-room-events).

    Wenn Discord anzeigt, dass geschrieben wird, und die Protokolle Token-Nutzung zeigen, aber keine Nachricht gepostet wird, prüfen Sie, ob der Durchlauf als Ereignis in einem Umgebungsraum konfiguriert wurde oder sichtbare Antworten über das Nachrichtenwerkzeug aktiviert wurden.

    <Tabs>
      <Tab title="Ihren Agenten fragen">
        > „Erlauben Sie meinem Agenten, auf diesem Server zu antworten, ohne mit @ erwähnt werden zu müssen.“
      </Tab>
      <Tab title="Konfiguration">
        Legen Sie `requireMention: false` in Ihrer Guild-Konfiguration fest:

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

  <Step title="Speicher für Guild-Kanäle planen">
    Der Langzeitspeicher (MEMORY.md) wird nur in DM-Sitzungen automatisch geladen; Guild-Kanäle laden ihn nicht.

    <Tabs>
      <Tab title="Ihren Agenten fragen">
        > „Wenn ich Fragen in Discord-Kanälen stelle, verwenden Sie memory_search oder memory_get, falls Sie langfristigen Kontext aus MEMORY.md benötigen.“
      </Tab>
      <Tab title="Manuell">
        Legen Sie für gemeinsam genutzten Kontext in jedem Kanal dauerhafte Anweisungen in `AGENTS.md` oder `USER.md` ab (sie werden in jede Sitzung eingefügt). Bewahren Sie langfristige Notizen in `MEMORY.md` auf und greifen Sie bei Bedarf mit Speicherwerkzeugen darauf zu.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Erstellen Sie nun Kanäle und beginnen Sie zu chatten. Der Agent sieht den Kanalnamen, und jeder Kanal ist eine isolierte Sitzung – richten Sie `#coding`, `#home`, `#research` oder beliebige andere Kanäle ein, die zu Ihrem Arbeitsablauf passen.

## Laufzeitmodell

- Das Gateway verwaltet die Discord-Verbindung.
- Das Antwort-Routing ist deterministisch: Eingehende Discord-Nachrichten werden wieder an Discord beantwortet.
- Discord-Guild-/Kanalmetadaten werden dem Modell-Prompt als nicht vertrauenswürdiger Kontext hinzugefügt, nicht als für Benutzer sichtbares Antwortpräfix. Wenn ein Modell diesen Umschlag zurückkopiert, entfernt OpenClaw die kopierten Metadaten aus ausgehenden Antworten und aus dem zukünftigen Wiedergabekontext.
- Standardmäßig (`session.dmScope=main`) teilen sich direkte Chats die Hauptsitzung des Agenten (`agent:main:main`).
- Guild-Kanäle verwenden isolierte Sitzungsschlüssel (`agent:<agentId>:discord:channel:<channelId>`).
- Gruppen-DMs werden standardmäßig ignoriert (`channels.discord.dm.groupEnabled=false`).
- Native Slash-Befehle werden in isolierten Befehlssitzungen ausgeführt (`agent:<agentId>:discord:slash:<userId>`), wobei `CommandTargetSessionKey` weiterhin an die geroutete Unterhaltungssitzung übertragen wird.
- Die Zustellung reiner Textankündigungen von Cron/Heartbeat an Discord wird auf die endgültige, für den Assistenten sichtbare Antwort reduziert und einmal gesendet. Medien und strukturierte Komponenten-Nutzlasten bleiben aus mehreren Nachrichten bestehend, wenn der Agent mehrere zustellbare Nutzlasten ausgibt.

## Forenkanäle

Discord-Forum- und Medienkanäle akzeptieren nur Thread-Beiträge. OpenClaw unterstützt zwei Möglichkeiten, sie zu erstellen:

- Senden Sie eine Nachricht an das übergeordnete Forum (`channel:<forumId>`), um automatisch einen Thread zu erstellen. Der Thread-Titel entspricht der ersten nicht leeren Zeile der Nachricht (gekürzt auf Discords Begrenzung von 100 Zeichen für Thread-Namen).
- Verwenden Sie `openclaw message thread create`, um direkt einen Thread zu erstellen. Übergeben Sie für Forumskanäle nicht `--message-id`.

Senden Sie eine Nachricht an das übergeordnete Forum, um einen Thread zu erstellen:

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Thementitel\nInhalt des Beitrags"
```

Erstellen Sie explizit einen Forumsthread:

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Thementitel" --message "Inhalt des Beitrags"
```

Übergeordnete Foren akzeptieren keine Discord-Komponenten. Wenn Sie Komponenten benötigen, senden Sie die Nachricht an den Thread selbst (`channel:<threadId>`).

## Interaktive Komponenten

OpenClaw unterstützt Container mit Discord-Komponenten v2 für Agentennachrichten. Verwenden Sie das Nachrichtenwerkzeug mit einer `components`-Payload. Interaktionsergebnisse werden als normale eingehende Nachrichten an den Agenten zurückgeleitet und folgen den bestehenden Discord-Einstellungen unter `replyToMode`.

Unterstützte Blöcke:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Aktionszeilen erlauben bis zu 5 Schaltflächen oder ein einzelnes Auswahlmenü
- Auswahltypen: `string`, `user`, `role`, `mentionable`, `channel`

Standardmäßig können Komponenten nur einmal verwendet werden. Legen Sie `components.reusable=true` fest, damit Schaltflächen, Auswahlmenüs und Formulare bis zu ihrem Ablauf mehrfach verwendet werden können.

Um einzuschränken, wer auf eine Schaltfläche klicken kann, legen Sie für diese Schaltfläche `allowedUsers` fest (Discord-Benutzer-IDs, Tags oder `*`). Nicht übereinstimmende Benutzer erhalten eine nur für sie sichtbare Ablehnung.

Komponenten-Callbacks laufen standardmäßig nach 30 Minuten ab. Legen Sie `channels.discord.agentComponents.ttlMs` fest, um die Lebensdauer der Callback-Registry für das Standardkonto zu ändern, oder `channels.discord.accounts.<accountId>.agentComponents.ttlMs` für einzelne Konten. Der Wert wird in Millisekunden angegeben, muss eine positive Ganzzahl sein und ist auf `86400000` (24 Stunden) begrenzt. Längere TTLs eignen sich für Prüfungs-/Genehmigungsabläufe, bei denen Schaltflächen verwendbar bleiben müssen, verlängern jedoch das Zeitfenster, in dem eine alte Discord-Nachricht weiterhin eine Aktion auslösen kann. Verwenden Sie vorzugsweise die kürzeste geeignete TTL und behalten Sie den Standardwert bei, wenn veraltete Callbacks unerwartet wären.

Die Slash-Befehle `/model` und `/models` öffnen eine interaktive Modellauswahl mit Dropdown-Menüs für Provider, Modell und kompatible Laufzeit sowie einem abschließenden Übermittlungsschritt. `/models add` ist veraltet und gibt eine Veraltungsmeldung zurück, statt Modelle aus dem Chat zu registrieren. Die Antwort der Auswahl ist nur für den aufrufenden Benutzer sichtbar und verwendbar. Discord-Auswahlmenüs sind auf 25 Optionen begrenzt. Fügen Sie daher Einträge unter `provider/*` zu `agents.defaults.modelPolicy.allow` hinzu, wenn die Auswahl dynamisch erkannte Modelle nur für ausgewählte Provider wie `openai` oder `vllm` anzeigen soll.

Dateianhänge:

- `file`-Blöcke müssen auf eine Anhangsreferenz (`attachment://<filename>`) verweisen
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
  message: "Optionaler Ersatztext",
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
    `channels.discord.dmPolicy` steuert den DM-Zugriff. `channels.discord.allowFrom` ist die kanonische DM-Zulassungsliste.

    - `pairing` (Standard)
    - `allowlist` (erfordert mindestens einen `allowFrom`-Absender)
    - `open` (erfordert, dass `channels.discord.allowFrom` den Wert `"*"` enthält)
    - `disabled`

    Wenn die DM-Richtlinie nicht offen ist, werden unbekannte Benutzer blockiert (oder im Modus `pairing` zur Kopplung aufgefordert).

    Rangfolge bei mehreren Konten:

    - `channels.discord.accounts.default.allowFrom` gilt nur für das Konto `default`.
    - Für ein Konto hat `allowFrom` Vorrang vor dem veralteten `dm.allowFrom`.
    - Benannte Konten erben `channels.discord.allowFrom`, wenn weder ihr eigenes `allowFrom` noch das veraltete `dm.allowFrom` festgelegt ist.
    - Benannte Konten erben `channels.discord.accounts.default.allowFrom` nicht.

    Die veralteten Werte `channels.discord.dm.policy` und `channels.discord.dm.allowFrom` werden aus Kompatibilitätsgründen weiterhin gelesen. `openclaw doctor --fix` migriert sie zu `dmPolicy` und `allowFrom`, wenn dies ohne Änderung des Zugriffs möglich ist.

    DM-Zielformat für die Zustellung:

    - `user:<id>`
    - `<@id>`-Erwähnung

    Reine numerische IDs werden normalerweise als Kanal-IDs aufgelöst, wenn ein Kanalstandard aktiv ist. IDs, die in der effektiven DM-Zulassungsliste `allowFrom` des Kontos enthalten sind, werden aus Kompatibilitätsgründen jedoch als Benutzer-DM-Ziele behandelt.

  </Tab>

  <Tab title="Zugriffsgruppen">
    Discord-DMs und die Autorisierung von Textbefehlen können dynamische `accessGroup:<name>`-Einträge in `channels.discord.allowFrom` verwenden.

    Namen von Zugriffsgruppen gelten kanalübergreifend. Verwenden Sie `type: "message.senders"` für eine statische Gruppe, deren Mitglieder in der normalen `allowFrom`-Syntax des jeweiligen Kanals angegeben werden, oder `type: "discord.channelAudience"`, wenn die aktuelle `ViewChannel`-Zielgruppe eines Discord-Kanals die Mitgliedschaft dynamisch bestimmen soll. Kanalübergreifendes Verhalten von Zugriffsgruppen: [Zugriffsgruppen](/de/channels/access-groups).

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

    Ein Discord-Textkanal hat keine separate Mitgliederliste. `type: "discord.channelAudience"` modelliert die Mitgliedschaft wie folgt: Der DM-Absender ist Mitglied des konfigurierten Servers und verfügt nach Anwendung von Rollen- und Kanalüberschreibungen aktuell über die effektive Berechtigung `ViewChannel` für den konfigurierten Kanal.

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

    Nachschlagevorgänge schlagen sicher geschlossen fehl. Wenn Discord `Missing Access` zurückgibt, die Mitgliedersuche fehlschlägt oder der Kanal zu einem anderen Server gehört, wird der DM-Absender als nicht autorisiert behandelt.

    Aktivieren Sie im Discord Developer Portal **Server Members Intent**, wenn Sie Zugriffsgruppen auf Basis der Kanalzielgruppe verwenden. DMs enthalten keinen Status der Servermitgliedschaft. Daher löst OpenClaw das Mitglied zum Zeitpunkt der Autorisierung über Discord REST auf.

  </Tab>

  <Tab title="Serverrichtlinie">
    Die Verarbeitung von Servern wird durch `channels.discord.groupPolicy` gesteuert:

    - `open`
    - `allowlist`
    - `disabled`

    Wenn `channels.discord` vorhanden ist, lautet die sichere Ausgangsbasis `allowlist`.

    Verhalten von `allowlist`:

    - Der Server muss mit `channels.discord.guilds` übereinstimmen (`id` bevorzugt, Slug akzeptiert)
    - Optionale Absender-Zulassungslisten: `users` (stabile IDs empfohlen) und `roles` (nur Rollen-IDs); wenn mindestens eine davon konfiguriert ist, sind Absender zugelassen, wenn sie mit `users` ODER `roles` übereinstimmen
    - Der direkte Abgleich von Namen/Tags ist standardmäßig deaktiviert; aktivieren Sie `channels.discord.dangerouslyAllowNameMatching: true` nur als Kompatibilitätsmodus für Notfälle
    - Namen/Tags werden für `users` unterstützt, IDs sind jedoch sicherer; `openclaw security audit` warnt, wenn Namens-/Tag-Einträge verwendet werden
    - Wenn für einen Server `channels` konfiguriert ist, werden nicht aufgeführte Kanäle abgelehnt
    - Wenn ein Server keinen `channels`-Block hat, sind alle Kanäle auf diesem zugelassenen Server erlaubt

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

    Wenn Sie nur `DISCORD_BOT_TOKEN` festlegen und keinen `channels.discord`-Block erstellen, lautet der Laufzeit-Fallback `groupPolicy="allowlist"` (mit einer Warnung in den Protokollen), selbst wenn `channels.defaults.groupPolicy` den Wert `open` hat.

  </Tab>

  <Tab title="Erwähnungen und Gruppen-DMs">
    Nachrichten auf Servern erfordern standardmäßig eine Erwähnung.

    Die Erkennung von Erwähnungen umfasst:

    - Explizite Erwähnung des Bots
    - Konfigurierte Erwähnungsmuster (`agents.entries.*.groupChat.mentionPatterns`, Fallback `messages.groupChat.mentionPatterns`)
    - Implizites Antwort-an-den-Bot-Verhalten in unterstützten Fällen

    Verwenden Sie beim Verfassen ausgehender Discord-Nachrichten die kanonische Erwähnungssyntax: `<@USER_ID>` für Benutzer, `<#CHANNEL_ID>` für Kanäle und `<@&ROLE_ID>` für Rollen. Verwenden Sie nicht die veraltete Erwähnungsform `<@!USER_ID>` für Spitznamen.

    `requireMention` wird pro Server/Kanal konfiguriert (`channels.discord.guilds...`).
    `ignoreOtherMentions` verwirft optional Nachrichten, die einen anderen Benutzer oder eine andere Rolle, aber nicht den Bot erwähnen (ausgenommen @everyone/@here).

    Gruppen-DMs:

    - Standard: ignoriert (`dm.groupEnabled=false`)
    - Optionale Zulassungsliste über `dm.groupChannels` (Kanal-IDs oder Slugs)

  </Tab>
</Tabs>

### Rollenbasiertes Agenten-Routing

Verwenden Sie `bindings[].match.roles`, um Mitglieder eines Discord-Servers anhand ihrer Rollen-ID an verschiedene Agenten weiterzuleiten. Rollenbasierte Bindungen akzeptieren nur Rollen-IDs und werden nach Peer- oder Parent-Peer-Bindungen sowie vor reinen Serverbindungen ausgewertet. Wenn eine Bindung zusätzlich weitere Abgleichsfelder festlegt (beispielsweise `peer` + `guildId` + `roles`), müssen alle konfigurierten Felder übereinstimmen.

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

- `commands.native` ist standardmäßig auf `"auto"` gesetzt und für Discord aktiviert.
- Kanalspezifische Überschreibung: `channels.discord.commands.native`.
- `commands.native=false` überspringt beim Start die Registrierung und Bereinigung von Discord-Slash-Befehlen. Zuvor registrierte Befehle können in Discord sichtbar bleiben, bis Sie sie aus der Discord-App entfernen.
- Die Autorisierung nativer Befehle verwendet dieselben Discord-Zulassungslisten und -Richtlinien wie die normale Nachrichtenverarbeitung.
- Befehle können in der Discord-Benutzeroberfläche weiterhin für nicht autorisierte Benutzer sichtbar sein; bei der Ausführung wird die OpenClaw-Autorisierung durchgesetzt und mit „nicht autorisiert“ geantwortet.
- Standardeinstellungen für Slash-Befehle: `ephemeral: true` (`channels.discord.slashCommand.ephemeral`).

Den Befehlskatalog und das Verhalten finden Sie unter [Slash-Befehle](/de/tools/slash-commands).

## Funktionsdetails

<AccordionGroup>
  <Accordion title="Antwort-Tags und native Antworten">
    Discord unterstützt Antwort-Tags in der Agentenausgabe:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Gesteuert durch `channels.discord.replyToMode`:

    - `off` (Standard): keine implizite Antwortverkettung; explizite `[[reply_to_*]]`-Tags werden weiterhin berücksichtigt
    - `first`: fügt dem ersten ausgehenden Discord-Beitrag des Durchlaufs den impliziten nativen Antwortverweis hinzu
    - `all`: fügt ihn jeder ausgehenden Nachricht hinzu
    - `batched`: fügt ihn nur hinzu, wenn das eingehende Ereignis ein entprellter Stapel mehrerer Nachrichten war – nützlich, wenn Sie native Antworten hauptsächlich für mehrdeutige, schubweise Chats und nicht für jeden Durchlauf mit nur einer Nachricht verwenden möchten

    Nachrichten-IDs werden im Kontext und Verlauf bereitgestellt, damit Agenten gezielt auf bestimmte Nachrichten reagieren können.

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

    Legen Sie `channels.discord.accounts.<id>.suppressEmbeds` fest, um ein einzelnes Konto zu überschreiben. Über das Nachrichtenwerkzeug gesendete Agentennachrichten können für eine einzelne Nachricht außerdem `suppressEmbeds: false` übergeben. Explizite Discord-`embeds`-Nutzlasten werden durch die standardmäßige Linkvorschau-Einstellung nicht unterdrückt.

  </Accordion>

  <Accordion title="Live-Stream-Vorschau">
    OpenClaw kann Antwortentwürfe streamen, indem es eine temporäre Nachricht sendet und diese beim Eintreffen des Textes bearbeitet. `channels.discord.streaming.mode` akzeptiert `off` | `partial` | `block` | `progress` (Standard, wenn weder ein `streaming`- noch ein veralteter `streamMode`-Schlüssel festgelegt ist). `streamMode` ist ein veralteter Alias; führen Sie `openclaw doctor --fix` aus, um die persistierte Konfiguration in die kanonische verschachtelte `streaming`-Struktur umzuschreiben.

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          maxLines: 8,
          maxLineChars: 120,
          toolProgress: false,
          commentary: false,
        },
      },
    },
  },
}
```

    - `off` deaktiviert die Bearbeitung der Discord-Vorschau.
    - `partial` bearbeitet beim Eintreffen von Tokens eine einzelne Vorschaunachricht.
    - `block` gibt entwurfsgroße Blöcke aus; Größe und Umbruchpunkte lassen sich mit `streaming.preview.chunk` (`minChars`, `maxChars`, `breakPreference`) anpassen, begrenzt auf `textChunkLimit`. Wenn Block-Streaming ausdrücklich aktiviert ist, überspringt OpenClaw den Vorschau-Stream, um doppeltes Streaming zu vermeiden.
    - `progress` behält bis zur endgültigen Zustellung einen bearbeitbaren Statusentwurf bei. Standardmäßig zeigt er eine Zeile der neuesten Einleitung oder Erläuterung des Agenten an, ohne erzeugte Bezeichnung, Abstand oder Werkzeugzeilen.
    - Medien, Fehler und endgültige Antworten mit explizitem Antwortbezug brechen ausstehende Vorschaubearbeitungen ab.
    - `streaming.preview.toolProgress` ist im Modus `partial`/`block` standardmäßig auf `true` gesetzt. Der Discord-Fortschrittsmodus zeigt standardmäßig keine Werkzeugzeilen an; legen Sie zum Aktivieren `streaming.progress.toolProgress: true` fest.
    - Legen Sie `streaming.progress.toolProgress: true` fest, um kompakte Werkzeug-/Fortschrittszeilen wie `🛠️ Bash: run tests` oder `🔎 Web Search: for "query"` hinzuzufügen. Aus Kompatibilitätsgründen behält eine vorhandene `progress.label`- oder `progress.labels`-Konfiguration den bisherigen Standard für Werkzeugzeilen bei; legen Sie `toolProgress: false` für eine benutzerdefinierte Bezeichnung ohne Zeilen fest.
    - `streaming.progress.commentary` (Standard: `false`) aktiviert rohe Assistentenkommentare im temporären Fortschrittsentwurf. Die standardmäßige Statuszeile für Einleitung/Erläuterung ist von dieser Option unabhängig. Kommentare werden vor der Anzeige bereinigt, bleiben vorübergehend und ändern die Zustellung der endgültigen Antwort nicht.
    - `streaming.progress.maxLineChars` steuert das Budget der Fortschrittsvorschau pro Zeile. Fließtext wird an Wortgrenzen gekürzt; bei Befehls- und Pfadangaben bleiben nützliche Endbestandteile erhalten.
    - `streaming.preview.commandText` / `streaming.progress.commandText` steuert die Befehls-/Ausführungsdetails in kompakten Fortschrittszeilen: `raw` (Standard) oder `status` (nur Werkzeugbezeichnung).

    So blenden Sie rohen Befehls-/Ausführungstext aus und behalten kompakte Fortschrittszeilen bei:

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

    Vorschau-Streaming unterstützt nur Text; Medienantworten werden über die normale Zustellung gesendet.

  </Accordion>

  <Accordion title="Verlauf, Kontext und Thread-Verhalten">
    Kontext des Serververlaufs:

    - `channels.discord.historyLimit` Standard `20`
    - Fallback: `messages.groupChat.historyLimit`
    - `0` deaktiviert

    Steuerung des Direktnachrichtenverlaufs:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Thread-Verhalten:

    - Discord-Threads werden als Kanalsitzungen weitergeleitet und übernehmen die Konfiguration des übergeordneten Kanals, sofern diese nicht überschrieben wird.
    - Thread-Sitzungen übernehmen die sitzungsbezogene `/model`-Auswahl des übergeordneten Kanals ausschließlich als Modell-Fallback; Thread-lokale `/model`-Auswahlen haben Vorrang, und der Transkriptverlauf des übergeordneten Kanals wird nur kopiert, wenn die Transkriptvererbung aktiviert ist.
    - `channels.discord.thread.inheritParent` (Standard: `false`) aktiviert für neue automatische Threads die Initialisierung aus dem übergeordneten Transkript. Kontospezifische Überschreibung: `channels.discord.accounts.<id>.thread.inheritParent`.
    - Reaktionen des Nachrichtenwerkzeugs können `user:<id>`-Direktnachrichtenziele auflösen.
    - `guilds.<guild>.channels.<channel>.requireMention: false` bleibt beim Fallback zur Aktivierung der Antwortphase erhalten.

    Kanalthemen werden als **nicht vertrauenswürdiger** Kontext eingefügt. Zulassungslisten beschränken, wer den Agenten auslösen kann, bilden jedoch keine vollständige Schwärzungsgrenze für zusätzlichen Kontext.

  </Accordion>

  <Accordion title="Thread-gebundene Sitzungen für Unteragenten">
    Discord kann einen Thread an ein Sitzungsziel binden, sodass Folgenachrichten in diesem Thread weiterhin an dieselbe Sitzung weitergeleitet werden, einschließlich Unteragentensitzungen.

    Befehle:

    - `/focus <target>` bindet den aktuellen/neuen Thread an ein Unteragenten-/Sitzungsziel
    - `/unfocus` entfernt die Bindung des aktuellen Threads
    - `/agents` zeigt aktive Ausführungen und den Bindungsstatus an
    - `/session idle <duration|off>` prüft/aktualisiert die automatische Aufhebung des Fokus nach Inaktivität für fokussierte Bindungen
    - `/session max-age <duration|off>` prüft/aktualisiert das feste Höchstalter für fokussierte Bindungen

    Konfiguration:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
      spawnSessions: true,
      defaultSpawnContext: "fork",
    },
  },
}
```

    Hinweise:

    - `session.threadBindings.*` ist die kanonische Richtlinie für Discord und Telegram.
    - `spawnSessions` steuert das automatische Erstellen/Binden von Threads für `sessions_spawn({ thread: true })` und ACP-Thread-Erstellungen. Standard: `true`.
    - `defaultSpawnContext` steuert den nativen Unteragentenkontext für Thread-gebundene Erstellungen. Standard: `"fork"`.
    - Veraltete `spawnSubagentSessions`-/`spawnAcpSessions`-Schlüssel werden durch `openclaw doctor --fix` migriert.
    - Wenn Thread-Bindungen deaktiviert sind, sind `/focus` und zugehörige Vorgänge nicht verfügbar.

    Weitere Informationen finden Sie unter [Unteragenten](/de/tools/subagents), [ACP-Agenten](/de/tools/acp-agents) und [Konfigurationsreferenz](/de/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Unteragentenfortschritt in der Ausgangsnachricht">
    Legen Sie `channels.discord.subagentProgress: true` fest, um die Hintergrundaktivität untergeordneter Ausführungen in der Discord-Nachricht anzuzeigen, die die übergeordnete Ausführung gestartet hat.

```json5
{
  channels: {
    discord: {
      subagentProgress: true,
    },
  },
}
```

    Während untergeordnete Ausführungen aktiv sind, hält OpenClaw die Discord-Tippanzeige bis zu einer Stunde aktiv und ersetzt bei Änderungen der Anzahl gleichzeitiger Ausführungen eine Zählreaktion (`1️⃣` bis `🔟`); `🔟` steht außerdem für 10 oder mehr. Die Zählreaktion wird entfernt, nachdem die letzte untergeordnete Ausführung beendet wurde. Eine fehlgeschlagene, wegen Zeitüberschreitung beendete oder abgebrochene untergeordnete Ausführung hinterlässt eine `🔴`-Reaktion.

    Diese Funktion muss ausdrücklich aktiviert werden und verwendet feste interne Zeit- und Emoji-Standards. Der Bot benötigt für Reaktionsrückmeldungen die Berechtigung **Add Reactions**. Das kontospezifische `channels.discord.accounts.<id>.subagentProgress` überschreibt den Wert der obersten Ebene.

  </Accordion>

  <Accordion title="Persistente ACP-Kanalbindungen">
    Konfigurieren Sie für stabile, „ständig aktive“ ACP-Arbeitsbereiche typisierte ACP-Bindungen auf oberster Ebene, die auf Discord-Unterhaltungen verweisen.

    Konfigurationspfad: `bindings[]` mit `type: "acp"` und `match.channel: "discord"`.

```json5
{
  agents: {
    entries: {
      codex: {
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
    },
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

    - `/acp spawn codex --bind here` bindet den aktuellen Kanal oder Thread direkt und leitet zukünftige Nachrichten weiterhin an dieselbe ACP-Sitzung weiter. Thread-Nachrichten übernehmen die Bindung des übergeordneten Kanals.
    - In einem gebundenen Kanal oder Thread setzen `/new` und `/reset` dieselbe ACP-Sitzung direkt zurück. Temporäre Thread-Bindungen können die Zielauflösung überschreiben, solange sie aktiv sind.
    - `spawnSessions` beschränkt die Erstellung/Bindung untergeordneter Threads über `--thread auto|here`.

    Einzelheiten zum Bindungsverhalten finden Sie unter [ACP-Agenten](/de/tools/acp-agents).

  </Accordion>

  <Accordion title="Reaktionsbenachrichtigungen">
    Serverbezogener Modus für Reaktionsbenachrichtigungen (`guilds.<id>.reactionNotifications`):

    - `off`
    - `own` (Standard)
    - `all`
    - `allowlist` (verwendet `guilds.<id>.users`)

    Reaktionsereignisse werden in Systemereignisse umgewandelt und der weitergeleiteten Discord-Sitzung hinzugefügt.

  </Accordion>

  <Accordion title="Online-Präsenzereignisse">
    Aktivieren Sie für einen Server die Weiterleitung von Agentenaktivierungen, wenn der Status eines menschlichen Mitglieds von offline zu online wechselt:

    ```json5
    {
      channels: {
        discord: {
          intents: { presence: true },
          guilds: {
            "111111111111111111": {
              presenceEvents: {
                channelId: "222222222222222222",
                users: ["333333333333333333"], // optional; Kanalbetrachter weiter einschränken
                reconnectSuppressSeconds: 300, // optional; Ruhefenster für neue Sitzungen (0 deaktiviert)
                burstLimit: 8, // optional; maximale Ereignisse pro Burst-Fenster
                burstWindowSeconds: 60, // optional; gleitendes Fenster zur Burst-Erkennung
              },
            },
          },
        },
      },
    }
    ```

    `presenceEvents` erfordert einen aktivierten Heartbeat für den weitergeleiteten Agenten und den privilegierten **Presence Intent** auf der Bot-Seite der Anwendung im Discord Developer Portal. OpenClaw übernimmt die aktuell online befindlichen Mitglieder aus jedem vollständigen `GUILD_CREATE`-Snapshot, leitet beobachtete Übergänge von offline zu online weiter und behandelt außerdem ein späteres erstes Online-Signal eines bisher unbekannten Mitglieds als neu verfügbar. Dieses Mitglied könnte nach dem Snapshot online gegangen oder beigetreten sein; das Ereignis gibt daher keinen exakten vorherigen Status an. Nur Personen, die `channelId` sehen können, kommen infrage: Kanäle und öffentliche Threads erfordern **View Channel** für den Kanal oder übergeordneten Kanal, während private Threads zusätzlich eine Mitgliedschaft oder **Manage Threads** erfordern. `users` kann diesen Empfängerkreis weiter einschränken. OpenClaw ignoriert Bots und unveränderte Online-Status und speichert eine achtstündige Abklingzeit pro Benutzer über Gateway-Neustarts hinweg. Wenn Discord eine neue Gateway-Sitzung aufbaut und `READY` sendet, unterdrückt OpenClaw aus Anwesenheitsdaten abgeleitete Ereignisse für `reconnectSuppressSeconds` (Standardwert 300, `0` deaktiviert dies), während der Anwesenheitsstatus der Guild neu aufgebaut wird, sodass erneut beobachtete Mitglieder den Agenten nicht einzeln aufwecken können. Zusätzlich begrenzt OpenClaw erfolgreich eingereihte Ereignisse pro Guild auf `burstLimit` Ereignisse (Standardwert 8) je gleitendem `burstWindowSeconds`-Fenster (Standardwert 60) und protokolliert jede Unterdrückungsphase einer Guild einmal. Eine fortgesetzte Sitzung wird nicht als neue Sitzung behandelt. Discord begrenzt Snapshots für Guilds mit mehr als 75.000 Mitgliedern; dort erfordert OpenClaw vor der Begrüßung eine explizite Offline-Aktualisierung. Das Systemereignis enthält unveränderliche Benutzer-, Guild- und Kanal-IDs, ohne veränderliche Anzeigenamen einzubetten. Der Agent entscheidet, ob und wie er begrüßt.

  </Accordion>

  <Accordion title="Bestätigungsreaktionen">
    `ackReaction` sendet ein Bestätigungs-Emoji, während OpenClaw eine eingehende Nachricht verarbeitet.

    Auflösungsreihenfolge:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - Fallback auf das Emoji der Agentenidentität (`agents.entries.*.identity.emoji`, andernfalls "👀")

    Hinweise:

    - Discord akzeptiert Unicode-Emojis oder Namen benutzerdefinierter Emojis.
    - Verwenden Sie `""`, um die Reaktion für einen Kanal oder ein Konto zu deaktivieren.

    **Geltungsbereich (`messages.ackReactionScope`):**

    Werte: `"all"` (Direktnachrichten + Gruppen einschließlich umgebungsbedingter Raumereignisse), `"direct"` (nur Direktnachrichten), `"group-all"` (jede Gruppennachricht außer umgebungsbedingten Raumereignissen, keine Direktnachrichten), `"group-mentions"` (Gruppen, wenn der Bot erwähnt wird; **keine Direktnachrichten**, Standardwert), `"off"` / `"none"` (deaktiviert).

    <Note>
    Der standardmäßige Geltungsbereich (`"group-mentions"`) löst keine Bestätigungsreaktionen in Direktnachrichten oder bei umgebungsbedingten Raumereignissen aus. Um eine Bestätigungsreaktion auf eingehende Discord-Direktnachrichten und stille Raumereignisse zu erhalten, setzen Sie `messages.ackReactionScope` auf `"all"`.
    </Note>

  </Accordion>

  <Accordion title="Konfigurationsänderungen">
    Vom Kanal ausgelöste Konfigurationsänderungen sind standardmäßig aktiviert. Dies betrifft `/config set|unset`-Abläufe (wenn Befehlsfunktionen aktiviert sind).

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
    Das Proxying von Discord-Gateway-WebSockets ist explizit; WebSocket-Verbindungen übernehmen keine umgebungsbezogenen Proxy-Umgebungsvariablen vom Gateway-Prozess. REST-Abfragen beim Start verwenden diesen Proxy, wenn `channels.discord.proxy` konfiguriert ist.

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

    - Zulassungslisten können `pk:<memberId>` verwenden
    - Anzeigenamen von Mitgliedern werden nur dann anhand von Name/Slug abgeglichen, wenn `channels.discord.dangerouslyAllowNameMatching: true`
    - Abfragen verwenden die ursprüngliche Nachrichten-ID für die PluralKit-API
    - wenn die Abfrage fehlschlägt, werden weitergeleitete Nachrichten als Bot-Nachrichten behandelt und verworfen, sofern `allowBots` sie nicht zulässt

  </Accordion>

  <Accordion title="Aliasse für ausgehende Erwähnungen">
    Verwenden Sie `mentionAliases`, wenn Agenten deterministische ausgehende Erwähnungen für bekannte Discord-Benutzer benötigen. Schlüssel sind Handles ohne das vorangestellte `@`; Werte sind Discord-Benutzer-IDs. Unbekannte Handles, `@everyone`, `@here` und Erwähnungen innerhalb von Markdown-Code-Spans bleiben unverändert.

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

  <Accordion title="Anwesenheitskonfiguration">
    Anwesenheitsaktualisierungen werden angewendet, wenn Sie ein Status- oder Aktivitätsfeld festlegen oder die automatische Anwesenheit aktivieren.

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

    - 0: Spielen
    - 1: Streaming (erfordert `activityUrl`; `activityUrl` erfordert wiederum `activityType: 1`)
    - 2: Zuhören
    - 3: Zuschauen
    - 4: Benutzerdefiniert (verwendet den Aktivitätstext als Statuszustand; Emoji ist optional)
    - 5: Im Wettbewerb

    Automatische Anwesenheit (Laufzeit-Zustandssignal):

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

    Die automatische Anwesenheit ordnet die Laufzeitverfügbarkeit einem Discord-Status zu: fehlerfrei => online, beeinträchtigt oder unbekannt => idle, aufgebraucht oder nicht verfügbar => dnd. Standardwerte: `intervalMs` 30000, `minUpdateIntervalMs` 15000 (muss kleiner oder gleich `intervalMs` sein). Optionale Textüberschreibungen:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (unterstützt den Platzhalter `{reason}`)

  </Accordion>

  <Accordion title="Genehmigungen in Discord">
    Discord unterstützt die schaltflächenbasierte Verarbeitung von Genehmigungen in Direktnachrichten und kann Genehmigungsaufforderungen optional im ursprünglichen Kanal veröffentlichen.

    Konfigurationspfad:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (optional; greift nach Möglichkeit auf `commands.ownerAllowFrom` zurück)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, Standardwert: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord aktiviert native Ausführungsgenehmigungen automatisch, wenn `enabled` nicht festgelegt oder `"auto"` ist und mindestens eine genehmigende Person aufgelöst werden kann, entweder aus `execApprovals.approvers` oder aus `commands.ownerAllowFrom`. Discord leitet genehmigende Personen für Ausführungen nicht aus dem Kanal-`allowFrom`, dem veralteten `dm.allowFrom` oder dem Direktnachrichten-`defaultTo` ab. Setzen Sie `enabled: false`, um Discord ausdrücklich als nativen Genehmigungsclient zu deaktivieren.

    Bei sensiblen, ausschließlich Eigentümern vorbehaltenen Gruppenbefehlen wie `/diagnostics` und `/export-trajectory` sendet OpenClaw Genehmigungsaufforderungen und Endergebnisse privat. OpenClaw versucht zuerst eine Discord-Direktnachricht, wenn für den aufrufenden Eigentümer eine Discord-Eigentümerroute vorhanden ist; andernfalls greift es auf die erste verfügbare Eigentümerroute aus `commands.ownerAllowFrom` zurück, beispielsweise Telegram.

    Wenn `target` den Wert `channel` oder `both` hat, ist die Genehmigungsaufforderung im Kanal sichtbar. Nur aufgelöste genehmigende Personen können die Schaltflächen verwenden; andere Benutzer erhalten eine nur für sie sichtbare Ablehnung. Genehmigungsaufforderungen enthalten den Befehlstext; aktivieren Sie die Zustellung im Kanal daher nur in vertrauenswürdigen Kanälen. Wenn die Kanal-ID nicht aus dem Sitzungsschlüssel abgeleitet werden kann, greift OpenClaw auf die Zustellung per Direktnachricht zurück.

    Discord rendert die gemeinsam verwendeten Genehmigungsschaltflächen anderer Chat-Kanäle; der native Discord-Adapter ergänzt hauptsächlich die Direktnachrichtenweiterleitung an genehmigende Personen und die Verteilung an Kanäle. Wenn diese Schaltflächen vorhanden sind, bilden sie die primäre Benutzeroberfläche für Genehmigungen; OpenClaw sollte einen manuellen `/approve`-Befehl nur einfügen, wenn das Werkzeugergebnis angibt, dass Chat-Genehmigungen nicht verfügbar sind oder die manuelle Genehmigung der einzige Weg ist. Wenn die native Discord-Genehmigungslaufzeit nicht aktiv ist, lässt OpenClaw die lokale deterministische `/approve <id> <decision>`-Aufforderung sichtbar. Wenn die Laufzeit aktiv ist, aber keine native Karte an ein Ziel zugestellt werden kann, sendet OpenClaw im selben Chat einen Fallback-Hinweis mit dem exakten `/approve`-Befehl aus der ausstehenden Genehmigung.

    Gateway-Authentifizierung und Genehmigungsauflösung folgen dem gemeinsamen Gateway-Client-Vertrag (`plugin:`-IDs werden über `plugin.approval.resolve` aufgelöst; andere IDs über `exec.approval.resolve`). Genehmigungen laufen standardmäßig nach 30 Minuten ab.

    Siehe [Ausführungsgenehmigungen](/de/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Werkzeuge und Aktionssperren

Discord-Nachrichtenaktionen umfassen Nachrichtenübermittlung, Kanalverwaltung, Moderation, Anwesenheit und Metadaten.

Grundlegende Beispiele:

- Nachrichtenübermittlung: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- Reaktionen: `react`, `reactions`, `emojiList`
- Moderation: `timeout`, `kick`, `ban`
- Anwesenheit: `setPresence`

Die Aktion `event-create` akzeptiert einen optionalen Parameter `image` (URL oder lokaler Dateipfad), um das Titelbild des geplanten Ereignisses festzulegen.

Aktionssperren befinden sich unter `channels.discord.actions.*`.

Standardverhalten der Sperren:

| Aktionsgruppe                                                                                                                                                             | Standardmäßig |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | aktiviert     |
| roles                                                                                                                                                                    | deaktiviert   |
| moderation                                                                                                                                                               | deaktiviert   |
| presence                                                                                                                                                                 | deaktiviert   |

## Components-v2-Benutzeroberfläche

OpenClaw verwendet Discord Components v2 für Ausführungsgenehmigungen und kontextübergreifende Markierungen. Discord-Nachrichtenaktionen können außerdem `components` für eine benutzerdefinierte Benutzeroberfläche akzeptieren (fortgeschritten; erfordert die Erstellung einer Komponenten-Payload über das Discord-Tool), während ältere `embeds` weiterhin verfügbar sind, jedoch nicht empfohlen werden.

- `channels.discord.ui.components.accentColor` legt die von Discord-Komponentencontainern verwendete Akzentfarbe fest (Hexadezimalwert). Pro Konto: `channels.discord.accounts.<id>.ui.components.accentColor`.
- `channels.discord.agentComponents.ttlMs` steuert, wie lange Callbacks gesendeter Discord-Komponenten registriert bleiben (Standardwert `1800000`, Höchstwert `86400000`). Pro Konto: `channels.discord.accounts.<id>.agentComponents.ttlMs`.
- `embeds` werden ignoriert, wenn Components v2 vorhanden sind.
- Vorschauen einfacher URLs werden standardmäßig unterdrückt. Legen Sie `suppressEmbeds: false` für eine Nachrichtenaktion fest, wenn ein einzelner ausgehender Link als Vorschau angezeigt werden soll.

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

Discord verfügt über zwei unterschiedliche Sprachoberflächen: **Sprachkanäle** in Echtzeit (fortlaufende Unterhaltungen) und **Sprachnachrichtenanhänge** (das Format mit Wellenformvorschau). Der Gateway unterstützt beide.

### Sprachkanäle

Checkliste für die Einrichtung:

1. Aktivieren Sie Message Content Intent im Discord Developer Portal.
2. Aktivieren Sie Server Members Intent, wenn Rollen-/Benutzer-Zulassungslisten verwendet werden.
3. Laden Sie den Bot mit den Bereichen `bot` und `applications.commands` ein.
4. Gewähren Sie Connect, Speak, Send Messages und Read Message History im Zielsprachkanal.
5. Aktivieren Sie native Befehle (`commands.native` oder `channels.discord.commands.native`).
6. Konfigurieren Sie `channels.discord.voice`.

Verwenden Sie `/vc join|leave|status`, um Sitzungen zu steuern. Der Befehl verwendet den Standard-Agenten des Kontos und befolgt dieselben Regeln für Zulassungslisten und Gruppenrichtlinien wie andere Discord-Befehle.

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

- Discord-Sprache ist für reine Textkonfigurationen optional; setzen Sie `channels.discord.voice.enabled=true` (oder behalten Sie einen vorhandenen `channels.discord.voice`-Block bei), um `/vc`-Befehle, die Sprachlaufzeit und den `GuildVoiceStates`-Gateway-Intent zu aktivieren. `channels.discord.intents.voiceStates` kann das Intent-Abonnement ausdrücklich überschreiben; lassen Sie die Option nicht gesetzt, damit sie der tatsächlich wirksamen Sprachaktivierung folgt.
- `voice.mode` steuert den Konversationspfad. Standardmäßig ist dies `agent-proxy`: Ein Echtzeit-Sprach-Frontend übernimmt die zeitliche Steuerung der Gesprächsbeiträge, Unterbrechungen und Wiedergabe, delegiert inhaltliche Aufgaben über `openclaw_agent_consult` an den weitergeleiteten OpenClaw-Agenten und behandelt das Ergebnis wie eine von dieser sprechenden Person eingetippte Discord-Eingabeaufforderung. `stt-tts` behält den älteren Batch-Ablauf aus STT und TTS bei. `bidi` ermöglicht dem Echtzeitmodell, direkt zu kommunizieren, und stellt dabei `openclaw_agent_consult` für das OpenClaw-Gehirn bereit.
- `voice.agentSession` steuert, welche OpenClaw-Konversation Sprachbeiträge empfängt. Lassen Sie die Option für die eigene Sitzung des Sprachkanals nicht gesetzt oder setzen Sie `{ mode: "target", target: "channel:<text-channel-id>" }`, damit der Sprachkanal als Mikrofon-/Lautsprechererweiterung einer vorhandenen Discord-Textkanalsitzung wie `#maintainers` dient.
- `voice.model` überschreibt das OpenClaw-Agentengehirn für Discord-Sprachantworten und Echtzeitkonsultationen. Lassen Sie die Option nicht gesetzt, um das weitergeleitete Agentenmodell zu übernehmen. Sie ist von `voice.realtime.model` getrennt.
- `voice.followUsers` ermöglicht dem Bot, gemeinsam mit ausgewählten Benutzern Discord-Sprachkanälen beizutreten, zwischen ihnen zu wechseln und sie zu verlassen. Siehe [Benutzern in Sprachkanälen folgen](#follow-users-in-voice).
- `agent-proxy` leitet Sprache über `discord-voice`, wodurch die normale Eigentümer-/Tool-Autorisierung für die sprechende Person und die Zielsitzung erhalten bleibt, das Agenten-Tool `tts` jedoch ausgeblendet wird, da Discord die Sprachwiedergabe übernimmt. Standardmäßig gewährt `agent-proxy` der Konsultation für sprechende Eigentümer (`voice.realtime.toolPolicy: "owner"`) vollständigen, dem Eigentümer gleichwertigen Tool-Zugriff und zieht eine Konsultation des OpenClaw-Agenten vor inhaltlichen Antworten nachdrücklich vor (`voice.realtime.consultPolicy: "always"`). In diesem standardmäßigen `always`-Modus spricht die Echtzeitebene vor der Konsultationsantwort nicht automatisch Überbrückungstext; sie erfasst und transkribiert Sprache und gibt anschließend die weitergeleitete OpenClaw-Antwort gesprochen aus. Wenn mehrere erzwungene Konsultationsantworten abgeschlossen werden, während Discord noch die erste Antwort wiedergibt, werden spätere wortgetreu auszugebende Antworten in die Warteschlange gestellt, bis die Wiedergabe inaktiv ist, statt die Sprachausgabe mitten im Satz zu ersetzen.
- Im `stt-tts`-Modus verwendet STT `tools.media.audio`; `voice.model` wirkt sich nicht auf die Transkription aus.
- In Echtzeitmodi konfigurieren `voice.realtime.provider`, `voice.realtime.model` und `voice.realtime.speakerVoice` die Echtzeit-Audiositzung. Verwenden Sie für OpenAI Realtime 2.1 zusammen mit dem Codex-Gehirn `voice.realtime.model: "gpt-realtime-2.1"` und `voice.model: "openai/gpt-5.6-sol"`.
- Echtzeit-Sprachmodi nehmen standardmäßig kleine Profildateien vom Typ `IDENTITY.md`, `USER.md` und `SOUL.md` in die Anweisungen für den Echtzeit-Provider auf, damit schnelle direkte Gesprächsbeiträge dieselbe Identität, Benutzerverankerung und Persona wie der weitergeleitete OpenClaw-Agent beibehalten. Setzen Sie `voice.realtime.bootstrapContextFiles` auf eine Teilmenge, um dies anzupassen, oder `[]`, um es zu deaktivieren. Nur diese Profildateien werden unterstützt; `AGENTS.md` verbleibt im normalen Agentenkontext. Der eingefügte Profilkontext ersetzt `openclaw_agent_consult` nicht für Arbeitsbereichsaufgaben, aktuelle Fakten, Speicherabfragen oder durch Tools unterstützte Aktionen.
- Im OpenAI-Echtzeitmodus `agent-proxy` passt sich die Aktivierungsnamensteuerung standardmäßig an den Raum an: Eine Person kann ohne Aktivierungsnamen natürlich sprechen, während bei zwei oder mehr Personen ein Gesprächsbeitrag mit einem solchen Namen beginnen oder enden muss. Andere Bots zählen nicht als Personen. Setzen Sie `voice.realtime.requireWakeName: true`, um immer einen Aktivierungsnamen zu verlangen, oder `false`, um nie einen zu verlangen. Konfigurierte Aktivierungsnamen müssen aus einem oder zwei Wörtern bestehen. Wenn `voice.realtime.wakeNames` nicht gesetzt ist, verwendet OpenClaw `name` des weitergeleiteten Agenten zusammen mit `OpenClaw` und greift ersatzweise auf die Agenten-ID zusammen mit `OpenClaw` zurück. Eine aktive Aktivierungsnamensteuerung deaktiviert die automatische Antwort des Echtzeit-Providers, leitet akzeptierte Gesprächsbeiträge durch den OpenClaw-Agentenkonsultationspfad und gibt eine kurze gesprochene Bestätigung aus, wenn anhand einer Teiltranskription ein vorangestellter Aktivierungsname erkannt wird, bevor das endgültige Transkript eintrifft. Die Richtlinie berücksichtigt Beitritte und Austritte in Echtzeit, ohne die Sprachverbindung neu herzustellen.
- Der OpenAI-Echtzeit-Provider akzeptiert aktuelle Realtime-2-Ereignisnamen und ältere Codex-kompatible Aliasse für Ausgabeaudio- und Transkriptereignisse, sodass kompatible Provider-Snapshots abweichen können, ohne dass Assistentenaudio verloren geht.
- `voice.realtime.bargeIn` steuert, ob Discord-Ereignisse beim Sprechbeginn die aktive Echtzeitwiedergabe unterbrechen. Wenn die Option nicht gesetzt ist, folgt sie der Einstellung des Echtzeit-Providers zur Unterbrechung durch Eingabeaudio.
- `voice.realtime.minBargeInAudioEndMs` steuert die Mindestwiedergabedauer des Assistenten, bevor ein Dazwischensprechen in OpenAI Realtime das Audio abschneidet. Standard: `250`. Setzen Sie `0` für eine sofortige Unterbrechung in Räumen mit geringem Echo oder erhöhen Sie den Wert für Lautsprecherkonfigurationen mit starkem Echo.
- `voice.tts` überschreibt `tts` nur für die Sprachwiedergabe von `stt-tts`; Echtzeitmodi verwenden stattdessen `voice.realtime.speakerVoice`. Setzen Sie für eine OpenAI-Stimme bei der Discord-Wiedergabe `voice.tts.provider: "openai"` und wählen Sie unter `voice.tts.providers.openai.speakerVoice` eine Text-to-Speech-Stimme aus. `cedar` ist beim aktuellen OpenAI-TTS-Modell eine gute männlich klingende Wahl.
- Kanalspezifische Discord-Überschreibungen für `systemPrompt` gelten für Sprachtranskriptbeiträge dieses Sprachkanals.
- Wenn OpenClaw einem Sprachkanal beitritt, empfängt die weitergeleitete Agentensitzung ein stilles Systemereignis mit der aktuellen Teilnehmerliste. Spätere Beitritte und Austritte von Teilnehmern aktualisieren diese Sitzung, ohne eine unaufgeforderte gesprochene Antwort auszulösen; Discord-Anzeigenamen werden als nicht vertrauenswürdige Bezeichnungen behandelt. Autorisierte Sprachbeiträge erhalten ebenfalls eine aktuelle Momentaufnahme der Teilnehmerliste.
- Sprachtranskriptbeiträge und `/vc`-Befehle verwenden Discord-Einträge in `commands.ownerAllowFrom` für den Eigentümerstatus. Wenn kein Eigentümer für Discord-Befehle konfiguriert ist, kann `allowFrom` (oder das veraltete `dm.allowFrom`) des ausgewählten Discord-Kontos weiterhin den Sprachzugriff autorisieren, ohne den Eigentümerstatus zu gewähren. Die Sichtbarkeit von Agenten-Tools folgt der konfigurierten Tool-Richtlinie für die weitergeleitete Sitzung.
- Wenn `voice.autoJoin` mehrere Einträge für dieselbe Guild enthält, tritt OpenClaw dem zuletzt für diese Guild konfigurierten Kanal bei.
- `voice.allowedChannels` ist eine optionale Zulassungsliste für Aufenthaltsorte. Lassen Sie sie nicht gesetzt, um `/vc join` den Beitritt zu jedem autorisierten Discord-Sprachkanal zu ermöglichen. Wenn sie gesetzt ist, sind `/vc join`, der automatische Beitritt beim Start und durch den Sprachstatus des Bots ausgelöste Kanalwechsel auf die aufgeführten `{ guildId, channelId }`-Einträge beschränkt. Setzen Sie sie auf ein leeres Array, um sämtliche Beitritte zu Discord-Sprachkanälen zu verweigern. Wenn Discord den Bot aus der Zulassungsliste heraus verschiebt, verlässt OpenClaw diesen Kanal und tritt erneut dem konfigurierten Ziel für den automatischen Beitritt bei, sofern eines verfügbar ist.
- `voice.daveEncryption` und `voice.decryptionFailureTolerance` werden an die Beitrittsoptionen von `@discordjs/voice` weitergereicht; die Upstream-Standardwerte sind `daveEncryption=true` und `decryptionFailureTolerance=24`.
- OpenClaw verwendet den gebündelten Codec `libopus-wasm` für den Empfang von Discord-Sprache und die Echtzeitwiedergabe von rohem PCM. Er enthält einen fest versionierten libopus-WebAssembly-Build und benötigt keine nativen Opus-Add-ons.
- `voice.connectTimeoutMs` steuert die anfängliche Wartezeit auf den Status `@discordjs/voice` Ready für `/vc join` und automatische Beitrittsversuche. Standard: `30000`.
- `voice.reconnectGraceMs` steuert, wie lange OpenClaw darauf wartet, dass eine getrennte Sprachsitzung mit dem erneuten Verbindungsaufbau beginnt, bevor sie verworfen wird. Standard: `15000`.
- Im `stt-tts`-Modus wird die Sprachwiedergabe nicht allein deshalb angehalten, weil ein anderer Benutzer zu sprechen beginnt. Um Rückkopplungsschleifen zu vermeiden, ignoriert OpenClaw neue Sprachaufnahmen während der TTS-Wiedergabe; sprechen Sie nach dem Ende der Wiedergabe, um den nächsten Gesprächsbeitrag zu beginnen. Echtzeitmodi leiten den Sprechbeginn als Dazwischensprechsignal an den Echtzeit-Provider weiter.
- In Echtzeitmodi kann ein Echo von Lautsprechern in ein offenes Mikrofon wie Dazwischensprechen wirken und die Wiedergabe unterbrechen. Setzen Sie für Discord-Räume mit starkem Echo `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`, damit OpenAI bei Eingabeaudio nicht automatisch unterbricht. Fügen Sie `voice.realtime.bargeIn: true` hinzu, wenn Discord-Ereignisse beim Sprechbeginn die aktive Wiedergabe weiterhin unterbrechen sollen. Die OpenAI-Echtzeit-Bridge ignoriert Wiedergabeabschneidungen, die kürzer als `voice.realtime.minBargeInAudioEndMs` sind, als wahrscheinliches Echo oder Rauschen und protokolliert sie als übersprungen, statt die Discord-Wiedergabe zu löschen.
- `voice.captureSilenceGraceMs` steuert, wie lange OpenClaw wartet, nachdem Discord das Ende eines Sprechbeitrags gemeldet hat, bevor dieses Audiosegment für STT abgeschlossen wird. Standard: `2000`; erhöhen Sie den Wert, wenn Discord normale Pausen in abgehackte Teiltranskripte aufteilt.
- Wenn ElevenLabs als TTS-Provider ausgewählt ist, verwendet die Discord-Sprachwiedergabe Streaming-TTS und beginnt mit der Wiedergabe aus dem Antwortstream des Providers. Bei Providern ohne Streaming-Unterstützung wird ersatzweise der Pfad über eine synthetisierte temporäre Datei verwendet.
- OpenClaw überwacht Entschlüsselungsfehler beim Empfang und stellt die Funktion automatisch wieder her, indem es den Sprachkanal nach wiederholten Fehlern innerhalb eines kurzen Zeitfensters verlässt und erneut beitritt.
- Wenn die Empfangsprotokolle nach einer Aktualisierung wiederholt `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` anzeigen, erfassen Sie einen Abhängigkeitsbericht und die Protokolle. Die gebündelte `@discordjs/voice`-Version enthält die Upstream-Korrektur für Padding aus discord.js-PR #11449, mit der discord.js-Issue #11419 geschlossen wurde.
- Empfangsereignisse vom Typ `The operation was aborted` sind zu erwarten, wenn OpenClaw ein erfasstes Sprechersegment abschließt; es handelt sich um ausführliche Diagnosedaten, nicht um Warnungen.
- Ausführliche Discord-Sprachprotokolle enthalten für jedes akzeptierte Sprechersegment eine begrenzte einzeilige STT-Transkriptvorschau, sodass bei der Fehlerdiagnose sowohl die Benutzerseite als auch die Antwortseite des Agenten sichtbar sind, ohne unbegrenzt langen Transkripttext auszugeben.
- Im `agent-proxy`-Modus überspringt der erzwungene Konsultations-Fallback wahrscheinlich unvollständige Transkriptfragmente, etwa Text, der mit `...` oder einem nachgestellten Bindewort wie „und“ endet, sowie offensichtlich nicht handlungsrelevante Abschlussformulierungen wie „bin gleich zurück“ oder „tschüss“. Die Protokolle zeigen `forced agent consult skipped reason=...`, wenn dadurch eine veraltete Antwort in der Warteschlange verhindert wird.

### Benutzern in Sprachkanälen folgen

Verwenden Sie `voice.followUsers`, wenn der Discord-Sprachbot einem oder mehreren bekannten Discord-Benutzern folgen soll, statt beim Start einem festen Kanal beizutreten oder auf `/vc join` zu warten.

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

- `followUsers` akzeptiert rohe Discord-Benutzer-IDs und `discord:<id>`-Werte. OpenClaw normalisiert beide Formen, bevor Sprachstatusereignisse abgeglichen werden.
- `followUsersEnabled` ist standardmäßig `true`, wenn `followUsers` konfiguriert ist. Setzen Sie den Wert auf `false`, um die gespeicherte Liste beizubehalten, aber das automatische Folgen im Sprachkanal zu beenden.
- `followUsers` steuert nur den Aufenthalt im Sprachkanal. Dies gewährt weder Sprecherzugriff noch Eigentümerberechtigungen; konfigurieren Sie `commands.ownerAllowFrom` sowie Benutzer und Rollen des Servers oder Kanals separat.
- Wenn ein Benutzer, dem gefolgt wird, einem zulässigen Sprachkanal beitritt, tritt OpenClaw diesem Kanal bei. Wenn der Benutzer wechselt, wechselt OpenClaw mit ihm. Wenn der aktive Benutzer, dem gefolgt wird, die Verbindung trennt, verlässt OpenClaw den Kanal.
- Wenn sich mehrere Benutzer, denen gefolgt wird, auf demselben Server befinden und der aktive Benutzer den Kanal verlässt, wechselt OpenClaw zum Kanal eines anderen erfassten Benutzers, dem gefolgt wird, bevor es den Server verlässt. Wenn mehrere Benutzer gleichzeitig wechseln, hat das zuletzt beobachtete Sprachstatusereignis Vorrang.
- `allowedChannels` gilt weiterhin. Ein Benutzer, dem gefolgt wird und der sich in einem nicht zulässigen Kanal befindet, wird ignoriert, und eine durch die Folgefunktion verwaltete Sitzung wechselt zu einem anderen Benutzer, dem gefolgt wird, oder wird beendet.
- OpenClaw gleicht beim Start und in einem begrenzten Intervall verpasste Sprachstatusereignisse ab. Beim Abgleich werden konfigurierte Server stichprobenartig geprüft und die REST-Abfragen pro Durchlauf begrenzt, sodass sehr große `followUsers`-Listen möglicherweise mehr als ein Intervall benötigen, um einen konsistenten Zustand zu erreichen.
- Wenn Discord oder ein Administrator den Bot verschiebt, während dieser einem Benutzer folgt, erstellt OpenClaw die Sprachsitzung neu und behält die Verwaltung durch die Folgefunktion bei, sofern das Ziel zulässig ist. Wenn der Bot außerhalb von `allowedChannels` verschoben wird, verlässt OpenClaw den Kanal und tritt dem konfigurierten Ziel erneut bei, sofern eines vorhanden ist.
- Bei der DAVE-Empfangswiederherstellung kann derselbe Kanal nach wiederholten Entschlüsselungsfehlern verlassen und erneut betreten werden. Durch die Folgefunktion verwaltete Sitzungen behalten ihre Verwaltung während dieses Wiederherstellungspfads bei, sodass der Kanal weiterhin verlassen wird, wenn ein Benutzer, dem gefolgt wird, später die Verbindung trennt.

Wählen Sie zwischen den Beitrittsmodi:

- Verwenden Sie `followUsers` für persönliche oder Betreiberkonfigurationen, bei denen der Bot automatisch im Sprachkanal sein soll, wenn Sie es sind.
- Verwenden Sie `autoJoin` für Bots in festen Räumen, die auch dann anwesend sein sollen, wenn sich kein erfasster Benutzer im Sprachkanal befindet.
- Verwenden Sie `/vc join` für einmalige Beitritte oder Räume, in denen eine automatische Anwesenheit im Sprachkanal unerwartet wäre.

Discord-Sprachcodec:

- Protokolle des Sprachempfangs zeigen `discord voice: opus decoder: libopus-wasm`.
- Bei der Echtzeitwiedergabe wird rohes Stereo-PCM mit 48 kHz mit demselben gebündelten `libopus-wasm`-Paket in Opus codiert, bevor die Pakete an `@discordjs/voice` übergeben werden.
- Bei der Wiedergabe von Dateien und Provider-Streams erfolgt mit ffmpeg eine Transcodierung in rohes Stereo-PCM mit 48 kHz; anschließend verwendet der an Discord gesendete Opus-Paketstream `libopus-wasm`.

STT-plus-TTS-Pipeline:

- Die Discord-PCM-Aufnahme wird in eine temporäre WAV-Datei konvertiert.
- `tools.media.audio` übernimmt STT, beispielsweise `openai/gpt-4o-mini-transcribe`.
- Das Transkript wird über den Discord-Eingang und die Weiterleitung gesendet, während das Antwort-LLM mit einer Sprachausgaberichtlinie ausgeführt wird, die das Agentenwerkzeug `tts` ausblendet und zurückgegebenen Text anfordert, da Discord Voice die abschließende TTS-Wiedergabe übernimmt.
- `voice.model` überschreibt, sofern festgelegt, nur das Antwort-LLM für diesen Durchlauf im Sprachkanal.
- `voice.tts` wird über `tts` zusammengeführt; Streaming-fähige Provider speisen den Player direkt, andernfalls wird die resultierende Audiodatei im beigetretenen Kanal wiedergegeben.

Beispiel einer standardmäßigen Agenten-Proxy-Sprachkanalsitzung:

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

Ohne einen `voice.agentSession`-Block erhält jeder Sprachkanal eine eigene weitergeleitete OpenClaw-Sitzung. Beispielsweise kommuniziert `/vc join channel:234567890123456789` mit der Sitzung dieses Discord-Sprachkanals. Das Echtzeitmodell dient nur als Sprach-Frontend; inhaltliche Anfragen werden an den konfigurierten OpenClaw-Agenten übergeben. Wenn das Echtzeitmodell ein endgültiges Transkript erzeugt, ohne das Konsultationswerkzeug aufzurufen, erzwingt OpenClaw die Konsultation als Fallback, damit das Standardverhalten weiterhin einem Gespräch mit dem Agenten entspricht.

Beispiel für veraltetes STT plus TTS:

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

Sprachkommunikation als Erweiterung einer vorhandenen Discord-Kanalsitzung:

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

Im `agent-proxy`-Modus tritt der Bot dem konfigurierten Sprachkanal bei, die OpenClaw-Agentendurchläufe verwenden jedoch die normale weitergeleitete Sitzung und den Agenten des Zielkanals. Die Echtzeit-Sprachsitzung gibt das zurückgegebene Ergebnis im Sprachkanal wieder. Der überwachende Agent kann entsprechend seiner Werkzeugrichtlinie weiterhin normale Nachrichtenwerkzeuge verwenden und beispielsweise eine separate Discord-Nachricht senden, wenn dies die richtige Aktion ist.

Während ein delegierter OpenClaw-Durchlauf aktiv ist, werden neue Discord-Sprachtranskripte als Live-Steuerung des Durchlaufs behandelt, bevor ein weiterer Agentendurchlauf gestartet wird. Formulierungen wie „Status“, „brechen Sie das ab“, „verwenden Sie die kleinere Korrektur“ oder „prüfen Sie anschließend auch die Tests“ werden für die aktive Sitzung als Status-, Abbruch-, Steuerungs- oder Folgeeingabe klassifiziert. Status-, Abbruch-, akzeptierte Steuerungs- und Folgeergebnisse werden im Sprachkanal wiedergegeben, damit die anrufende Person weiß, ob OpenClaw die Anfrage verarbeitet hat.

Nützliche Zielformen:

- `target: "channel:123456789012345678"` leitet über eine Discord-Textkanalsitzung weiter.
- `target: "123456789012345678"` wird als Kanalziel behandelt.
- `target: "dm:123456789012345678"` oder `target: "user:123456789012345678"` leitet über diese Direktnachrichtensitzung weiter.

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

Verwenden Sie dies, wenn das Modell seine eigene Discord-Wiedergabe über ein offenes Mikrofon hört, Sie es aber dennoch durch Sprechen unterbrechen möchten. OpenClaw verhindert, dass OpenAI aufgrund roher Audioeingaben automatisch unterbricht, während `bargeIn: true` ermöglicht, dass Discord-Ereignisse zum Beginn einer Sprecheraktivität und bereits aktive Sprecheraudiodaten laufende Echtzeitantworten abbrechen, bevor der nächste erfasste Durchlauf OpenAI erreicht. Sehr frühe Unterbrechungssignale mit `audioEndMs` unter `minBargeInAudioEndMs` werden als wahrscheinliches Echo oder Rauschen eingestuft und ignoriert, damit das Modell nicht bereits beim ersten Wiedergabeframe abbricht.

Erwartete Sprachprotokolle:

- Beim Beitritt: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- Beim Echtzeitstart: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- Bei Sprecheraudio: `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...` und `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- Beim Überspringen veralteter Sprachausgabe: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` oder `reason=non-actionable-closing ...`
- Beim Abschluss einer Echtzeitantwort: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- Beim Stoppen oder Zurücksetzen der Wiedergabe: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- Bei der Echtzeitkonsultation: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- Bei der Agentenantwort: `discord voice: agent turn answer ...`
- Beim Einreihen exakter Sprachausgabe: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`, gefolgt von `discord voice: realtime exact speech dequeued reason=player-idle ...`
- Bei der Erkennung einer Unterbrechung: `discord voice: realtime barge-in detected source=speaker-start ...` oder `discord voice: realtime barge-in detected source=active-speaker-audio ...`, gefolgt von `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- Bei einer Echtzeitunterbrechung: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`, gefolgt von `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` oder `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- Bei ignoriertem Echo oder Rauschen: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- Bei deaktivierter Unterbrechung: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- Bei inaktiver Wiedergabe: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

Lesen Sie zur Diagnose abgeschnittener Audiodaten die Echtzeit-Sprachprotokolle als Zeitachse:

1. `realtime audio playback started` bedeutet, dass Discord mit der Wiedergabe von Assistentenaudio begonnen hat. Ab diesem Zeitpunkt zählt die Bridge die Ausgabeblöcke des Assistenten, Discord-PCM-Bytes, Provider-Echtzeitbytes und die Dauer des synthetisierten Audios.
2. `realtime speaker turn opened` kennzeichnet, dass ein Discord-Sprecher aktiv wird. Wenn die Wiedergabe bereits aktiv und `bargeIn` aktiviert ist, kann darauf `barge-in detected source=speaker-start` folgen.
3. `realtime input audio started` kennzeichnet den ersten tatsächlich für diesen Sprecherdurchlauf empfangenen Audioframe. `outputActive=true` oder ein Wert ungleich null für `outputAudioMs` bedeutet hier, dass das Mikrofon Eingaben sendet, während die Assistentenwiedergabe noch aktiv ist.
4. `barge-in detected source=active-speaker-audio` bedeutet, dass OpenClaw während der aktiven Assistentenwiedergabe Live-Sprecheraudio erkannt hat. Dies ist hilfreich, um eine echte Unterbrechung von einem Discord-Ereignis zum Beginn einer Sprecheraktivität ohne verwertbare Audiodaten zu unterscheiden.
5. `barge-in requested reason=...` bedeutet, dass OpenClaw den Echtzeit-Provider aufgefordert hat, die aktive Antwort abzubrechen oder zu kürzen. Der Eintrag enthält `outputAudioMs`, `outputActive` und `playbackChunks`, damit erkennbar ist, wie viel Assistentenaudio vor der Unterbrechung tatsächlich wiedergegeben wurde.
6. `realtime audio playback stopped reason=...` ist der lokale Rücksetzpunkt der Discord-Wiedergabe. Der Grund gibt an, wer die Wiedergabe beendet hat: `barge-in`, `player-idle`, `provider-clear-audio`, `forced-agent-consult`, `stream-close` oder `session-close`.
7. `realtime speaker turn closed` fasst den erfassten Eingabedurchlauf zusammen. `chunks=0` oder `hasAudio=false` bedeutet, dass der Sprecherdurchlauf geöffnet wurde, aber keine verwertbaren Audiodaten die Echtzeit-Bridge erreichten. `interruptedPlayback=true` bedeutet, dass sich dieser Eingabedurchlauf mit der Assistentenausgabe überschnitt und die Unterbrechungslogik auslöste.

Nützliche Felder:

- `outputAudioMs`: Dauer des Assistentenaudios, das der Echtzeit-Provider vor der Protokollzeile erzeugt hat.
- `audioMs`: Dauer des Assistentenaudios, die OpenClaw bis zum Ende der Wiedergabe gezählt hat.
- `elapsedMs`: verstrichene Zeit zwischen dem Öffnen und Schließen des Wiedergabestreams oder Sprecherdurchlaufs.
- `discordBytes`: an Discord Voice gesendete oder von dort empfangene Stereo-PCM-Bytes mit 48 kHz.
- `realtimeBytes`: PCM-Bytes im Providerformat, die an den Echtzeit-Provider gesendet oder von ihm empfangen wurden.
- `playbackChunks`: für die aktive Antwort an Discord weitergeleitete Assistenten-Audioblöcke.
- `sinceLastAudioMs`: Zeitspanne zwischen dem letzten erfassten Sprecheraudioframe und dem Schließen des Sprecherdurchlaufs.

Häufige Muster:

- Ein sofortiger Abbruch mit `source=active-speaker-audio`, einem kleinen `outputAudioMs` und demselben Benutzer in der Nähe deutet normalerweise darauf hin, dass ein Lautsprecherecho in das Mikrofon gelangt. Erhöhen Sie `voice.realtime.minBargeInAudioEndMs`, verringern Sie die Lautstärke des Lautsprechers, verwenden Sie Kopfhörer oder legen Sie `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` fest.
- `source=speaker-start` gefolgt von `speaker turn closed ... hasAudio=false` bedeutet, dass Discord den Beginn einer Sprachausgabe gemeldet hat, aber kein Audio OpenClaw erreicht hat. Ursache kann ein vorübergehendes Discord-Sprachereignis, das Verhalten des Noise-Gates oder ein Client sein, der das Mikrofon kurz aktiviert.
- `audio playback stopped reason=stream-close` ohne ein zeitnahes Dazwischensprechen oder `provider-clear-audio` bedeutet, dass der lokale Discord-Wiedergabestream unerwartet beendet wurde. Prüfen Sie die vorherigen Provider- und Discord-Player-Protokolle.
- `capture ignored during playback (barge-in disabled)` bedeutet, dass OpenClaw Eingaben absichtlich verworfen hat, während Assistentenaudio aktiv war. Aktivieren Sie `voice.realtime.bargeIn`, wenn Sprache die Wiedergabe unterbrechen soll.
- `barge-in ignored ... outputActive=false` bedeutet, dass Discord oder die VAD des Providers Sprache gemeldet hat, OpenClaw jedoch keine aktive Wiedergabe zum Unterbrechen hatte. Dadurch sollte Audio nicht abgebrochen werden.

Anmeldedaten werden komponentenbezogen aufgelöst: LLM-Routen-Authentifizierung für `voice.model`, STT-Authentifizierung für `tools.media.audio`, TTS-Authentifizierung für `tts`/`voice.tts` und Echtzeit-Provider-Authentifizierung für `voice.realtime.providers` oder die normale Authentifizierungskonfiguration des Providers.

### Sprachnachrichten

Discord-Sprachnachrichten zeigen eine Wellenformvorschau an und benötigen OGG/Opus-Audio. OpenClaw erzeugt die Wellenform automatisch, benötigt jedoch `ffmpeg` und `ffprobe` auf dem Gateway-Host, um das Audio zu untersuchen und zu konvertieren.

- Geben Sie einen **lokalen Dateipfad** an (URLs werden abgelehnt).
- Lassen Sie den Textinhalt weg (Discord lehnt Text und Sprachnachricht in derselben Nutzlast ab).
- Jedes Audioformat wird akzeptiert; OpenClaw konvertiert es bei Bedarf in OGG/Opus.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Nicht zulässige Intents verwendet oder Bot sieht keine Servernachrichten">

    - Message Content Intent aktivieren
    - Server Members Intent aktivieren, wenn Sie auf die Auflösung von Benutzern/Mitgliedern angewiesen sind
    - Gateway nach dem Ändern der Intents neu starten

  </Accordion>

  <Accordion title="Servernachrichten werden unerwartet blockiert">

    - `groupPolicy` überprüfen
    - Server-Zulassungsliste unter `channels.discord.guilds` überprüfen
    - wenn eine `channels`-Zuordnung für einen Server vorhanden ist, sind nur aufgeführte Kanäle zulässig
    - Verhalten von `requireMention` und Erwähnungsmuster überprüfen

    Nützliche Prüfungen:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Erforderliche Erwähnung ist deaktiviert, aber weiterhin blockiert">
    Häufige Ursachen:

    - `groupPolicy="allowlist"` ohne passende Server-/Kanal-Zulassungsliste
    - `requireMention` an der falschen Stelle konfiguriert (muss unter `channels.discord.guilds` oder einem Kanaleintrag stehen)
    - Absender durch die `users`-Zulassungsliste des Servers/Kanals blockiert

  </Accordion>

  <Accordion title="Lange laufende Discord-Durchläufe oder doppelte Antworten">

    Typische Protokolle:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Discord wendet auf Agentendurchläufe in der Warteschlange kein kanaleigenes Zeitlimit an. Nachrichten-Listener übergeben die Verarbeitung sofort, und Discord-Durchläufe in der Warteschlange behalten die sitzungsbezogene Reihenfolge bei, bis der Lebenszyklus der Sitzung, des Tools oder der Laufzeit abgeschlossen ist oder die Arbeit abbricht.

  </Accordion>

  <Accordion title="Warnungen wegen Zeitüberschreitung bei der Suche nach Gateway-Metadaten">
    OpenClaw ruft vor dem Verbindungsaufbau Discord-`/gateway/bot`-Metadaten ab. Bei vorübergehenden Fehlern wird auf die Standard-Gateway-URL von Discord zurückgegriffen und die Protokollierung wird ratenbegrenzt.

    Das Zeitlimit für Metadaten beträgt standardmäßig 30 Sekunden. `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS` kann es für ungewöhnliche Hostumgebungen überschreiben.

  </Accordion>

  <Accordion title="Neustarts wegen Zeitüberschreitung bei Gateway READY">
    OpenClaw wartet beim Start und nach erneuten Laufzeitverbindungen auf das Gateway-Ereignis `READY` von Discord. Konfigurationen mit mehreren Konten und gestaffeltem Start können ein längeres READY-Startzeitfenster als den Standard benötigen.

    Beim Start wird 15 Sekunden und bei erneuten Laufzeitverbindungen 30 Sekunden gewartet. `OPENCLAW_DISCORD_READY_TIMEOUT_MS` und `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS` bleiben für ungewöhnliche Hostumgebungen verfügbar.

  </Accordion>

  <Accordion title="Abweichungen bei der Berechtigungsprüfung">
    Berechtigungsprüfungen mit `channels status --probe` funktionieren nur für numerische Kanal-IDs.

    Wenn Sie Slug-Schlüssel verwenden, kann der Laufzeitabgleich weiterhin funktionieren, aber die Prüfung kann die Berechtigungen nicht vollständig verifizieren.

  </Accordion>

  <Accordion title="Probleme mit Direktnachrichten und Kopplung">

    - Direktnachrichten deaktiviert: `channels.discord.dm.enabled=false`
    - Direktnachrichtenrichtlinie deaktiviert: `channels.discord.dmPolicy="disabled"` (veraltet: `channels.discord.dm.policy`)
    - wartet im Modus `pairing` auf die Genehmigung der Kopplung

  </Accordion>

  <Accordion title="Bot-zu-Bot-Schleifen">
    Standardmäßig werden von Bots verfasste Nachrichten ignoriert.

    Wenn Sie `channels.discord.allowBots=true` festlegen, verwenden Sie strenge Regeln für Erwähnungen und Zulassungslisten, um Schleifen zu vermeiden.
    Verwenden Sie vorzugsweise `channels.discord.allowBots="mentions"`, um nur Bot-Nachrichten zu akzeptieren, die den Bot erwähnen.

    OpenClaw enthält außerdem einen gemeinsamen [Schutz vor Bot-Schleifen](/de/channels/bot-loop-protection). Immer wenn `allowBots` zulässt, dass von Bots verfasste Nachrichten die Weiterleitung erreichen, ordnet Discord das eingehende Ereignis `(account, channel, bot pair)`-Fakten zu, und die generische Paarsicherung unterdrückt das Paar, nachdem es das konfigurierte Ereignisbudget überschritten hat. Die Sicherung verhindert unkontrollierte Schleifen zwischen zwei Bots, die zuvor durch Discord-Ratenbegrenzungen gestoppt werden mussten; sie wirkt sich nicht auf Bereitstellungen mit einem einzelnen Bot oder einmalige Bot-Antworten aus, die unter dem Budget bleiben.

    Standardeinstellungen (aktiv, wenn `allowBots` festgelegt ist):

    - `maxEventsPerWindow: 20` -- das Bot-Paar kann innerhalb des gleitenden Fensters 20 Nachrichten austauschen
    - `windowSeconds: 60` -- Länge des gleitenden Fensters
    - `cooldownSeconds: 60` -- sobald das Budget überschritten wird, wird jede weitere Bot-zu-Bot-Nachricht in beiden Richtungen eine Minute lang verworfen

    Konfigurieren Sie den gemeinsamen Standard einmal unter `channels.defaults.botLoopProtection` und überschreiben Sie ihn anschließend für Discord, wenn ein legitimer Workflow mehr Spielraum benötigt. Die Rangfolge lautet:

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
          // Alpha hört nur auf andere Bots, wenn diese ihn erwähnen.
          allowBots: "mentions",
        },
        bravo: {
          // Bravo hört auf alle von Bots verfassten Discord-Nachrichten.
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

  <Accordion title="Voice-STT-Ausfälle mit DecryptionFailed(...)">

    - OpenClaw aktuell halten (`openclaw update`), damit die Wiederherstellungslogik für den Discord-Sprachempfang vorhanden ist
    - `channels.discord.voice.daveEncryption=true` bestätigen (Standard)
    - mit `channels.discord.voice.decryptionFailureTolerance=24` beginnen (Upstream-Standard) und nur bei Bedarf anpassen
    - Protokolle auf Folgendes überwachen:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - wenn die Fehler nach dem automatischen erneuten Beitritt fortbestehen, Protokolle erfassen und mit dem Upstream-DAVE-Empfangsverlauf in [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) und [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) vergleichen

  </Accordion>
</AccordionGroup>

## Konfigurationsreferenz

Primäre Referenz: [Konfigurationsreferenz – Discord](/de/gateway/config-channels#discord).

<Accordion title="Wichtige Discord-Felder">

- Start/Authentifizierung: `enabled`, `token`, `applicationId`, `accounts.*`, `allowBots`
- Richtlinie: `groupPolicy`, `dmPolicy`, `allowFrom`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- Befehl: `commands.native`, `commands.useAccessGroups` (global), `configWrites`, `slashCommand.ephemeral`
- Gateway: `proxy`
- Antwort/Verlauf: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- Zustellung: `textChunkLimit` (Standard `2000`), `maxLinesPerMessage` (Standard `17`)
- Streaming: `streaming.mode`, `streaming.chunkMode`, `streaming.preview.*`, `streaming.progress.*`, `streaming.block.*` (veraltete flache Schlüssel `streamMode`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`, `chunkMode` werden von `openclaw doctor --fix` in `streaming.*` migriert)
- Medien: `mediaMaxMb` (begrenzt ausgehende Discord-Uploads, Standard `100`)
- Aktionen: `actions.*`
- Präsenz: `activity`, `status`, `activityType`, `activityUrl`, `autoPresence.*`
- Benutzeroberfläche: `ui.components.accentColor`
- Funktionen: `threadBindings`, `bindings[]` auf oberster Ebene (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents.enabled`, `agentComponents.ttlMs`, `activities`, `heartbeat`, `responsePrefix`

</Accordion>

### Discord Activities

Legen Sie `channels.discord.activities` fest, damit Agenten eigenständige HTML-Widgets veröffentlichen können, die innerhalb von Discord geöffnet werden. Der Block ist optional; wenn er fehlt, registriert OpenClaw keine Activity-Routen, kein Tool und keinen Interaktions-Handler. Informationen zur Einrichtung des Developer Portal, des Tunnels, der Sicherheit und der Fehlerbehebung finden Sie unter [Discord Activities](/channels/discord-activities).

- `activities.clientSecret`: OAuth2-Clientschlüssel für die Discord-Anwendung; greift ersatzweise auf `DISCORD_CLIENT_SECRET` zurück
- `activities.applicationId`: optionale Activity-Anwendungs-ID; standardmäßig wird die beim Gateway-Start ermittelte Bot-Anwendungs-ID verwendet

## Sicherheit und Betrieb

- Behandeln Sie Bot-Token als Geheimnisse (`DISCORD_BOT_TOKEN` wird in überwachten Umgebungen bevorzugt).
- Gewähren Sie Discord-Berechtigungen nach dem Prinzip der geringsten Rechte.
- Wenn die Befehlsbereitstellung oder der Befehlsstatus veraltet ist, starten Sie das Gateway neu und prüfen Sie erneut mit `openclaw channels status --probe`.

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Discord Activities" icon="window" href="/channels/discord-activities">
    Interaktive HTML-Widgets innerhalb von Discord starten.
  </Card>
  <Card title="Kopplung" icon="link" href="/de/channels/pairing">
    Einen Discord-Benutzer mit dem Gateway koppeln.
  </Card>
  <Card title="Gruppen" icon="users" href="/de/channels/groups">
    Verhalten von Gruppenchats und Zulassungslisten.
  </Card>
  <Card title="Kanal-Routing" icon="route" href="/de/channels/channel-routing">
    Eingehende Nachrichten an Agenten weiterleiten.
  </Card>
  <Card title="Sicherheit" icon="shield" href="/de/gateway/security">
    Bedrohungsmodell und Härtung.
  </Card>
  <Card title="Multi-Agent-Routing" icon="sitemap" href="/de/concepts/multi-agent">
    Server und Kanäle Agenten zuordnen.
  </Card>
  <Card title="Slash-Befehle" icon="terminal" href="/de/tools/slash-commands">
    Natives Befehlsverhalten.
  </Card>
</CardGroup>
