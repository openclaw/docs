---
read_when:
    - Arbeiten an Funktionen für Discord-Kanäle
summary: Einrichtung des Discord-Bots, Konfigurationsschlüssel, Komponenten, Sprache und Fehlerbehebung
title: Discord
x-i18n:
    generated_at: "2026-07-12T14:59:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 1ae3682462003a04e57acbdc98a3713e5ef83f89384b7f3b79633c344855b715
    source_path: channels/discord.md
    workflow: 16
---

OpenClaw verbindet sich über das offizielle Discord-Gateway als Bot mit Discord. DMs und Gildenkanäle werden unterstützt.

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

Erstellen Sie eine Discord-Anwendung mit einem Bot, fügen Sie den Bot Ihrem Server hinzu und koppeln Sie ihn mit OpenClaw. Verwenden Sie nach Möglichkeit einen privaten Server; [erstellen Sie bei Bedarf zuerst einen](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (**Create My Own > For me and my friends**).

<Steps>
  <Step title="Discord-Anwendung und Bot erstellen">
    Klicken Sie im [Discord Developer Portal](https://discord.com/developers/applications) auf **New Application** und geben Sie der Anwendung einen Namen (zum Beispiel „OpenClaw“).

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
    Trotz des Namens wird dadurch Ihr erstes Token erzeugt – es wird nichts „zurückgesetzt“.
    </Note>

  </Step>

  <Step title="Einladungs-URL erzeugen und Bot Ihrem Server hinzufügen">
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

    Dies ist die Grundkonfiguration für normale Textkanäle. Wenn der Bot in Threads posten soll – einschließlich Arbeitsabläufen für Foren- oder Medienkanäle, die einen Thread erstellen oder fortsetzen –, aktivieren Sie außerdem **Send Messages in Threads**.

    Kopieren Sie die erzeugte URL, öffnen Sie sie in einem Browser, wählen Sie Ihren Server aus und klicken Sie auf **Continue**. Der Bot sollte nun auf Ihrem Server erscheinen.

  </Step>

  <Step title="Entwicklermodus aktivieren und IDs erfassen">
    Aktivieren Sie in der Discord-App den Entwicklermodus, damit Sie IDs kopieren können:

    1. **User Settings** (Zahnradsymbol) → **Developer** → **Developer Mode** aktivieren
       *(auf Mobilgeräten: **App Settings** → **Advanced**)*
    2. Klicken Sie mit der rechten Maustaste auf Ihr **Serversymbol** → **Copy Server ID**
    3. Klicken Sie mit der rechten Maustaste auf Ihren **eigenen Avatar** → **Copy User ID**

    Bewahren Sie die Server-ID und die Benutzer-ID zusammen mit Ihrem Bot-Token auf; im nächsten Schritt benötigen Sie alle drei Werte.

  </Step>

  <Step title="DMs von Servermitgliedern zulassen">
    Damit die Kopplung funktioniert, muss Discord dem Bot erlauben, Ihnen eine DM zu senden. Klicken Sie mit der rechten Maustaste auf Ihr **Serversymbol** → **Privacy Settings** → aktivieren Sie **Direct Messages**.

    Lassen Sie dies aktiviert, wenn Sie Discord-DMs mit OpenClaw verwenden. Wenn Sie ausschließlich Gildenkanäle verwenden, können Sie es nach der Kopplung deaktivieren.

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
    Führen Sie bei Installationen als verwalteter Dienst `openclaw gateway install` in einer Shell aus, in der `DISCORD_BOT_TOKEN` gesetzt ist, oder speichern Sie die Variable in `~/.openclaw/.env`, damit der Dienst die SecretRef der Umgebungsvariable nach dem Neustart auflösen kann.
    Wenn Ihr Host durch Discords Anwendungsabfrage beim Start blockiert oder ratenbegrenzt wird, legen Sie die Anwendungs-/Client-ID aus dem Developer Portal fest, damit dieser REST-Aufruf beim Start übersprungen werden kann: `channels.discord.applicationId` für das Standardkonto oder `channels.discord.accounts.<accountId>.applicationId` je Bot.

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

        Rückgriff auf eine Umgebungsvariable für das Standardkonto:

```bash
DISCORD_BOT_TOKEN=...
```

        Schreiben Sie für eine skriptgesteuerte oder entfernte Einrichtung denselben JSON5-Block mit `openclaw config patch --file ./discord.patch.json5 --dry-run` und führen Sie den Befehl anschließend ohne `--dry-run` erneut aus. Klartextzeichenfolgen für `token` funktionieren ebenfalls, und SecretRef-Werte werden für `channels.discord.token` über env-/file-/exec-Provider hinweg unterstützt. Siehe [Geheimnisverwaltung](/de/gateway/secrets).

        Bewahren Sie bei mehreren Discord-Bots jedes Bot-Token und jede Anwendungs-ID unter dem jeweiligen Konto auf. Ein `channels.discord.applicationId` auf oberster Ebene wird von den Konten geerbt; legen Sie es dort daher nur fest, wenn alle Konten dieselbe Anwendungs-ID verwenden.

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
Die Token-Auflösung berücksichtigt das Konto. In der Konfiguration festgelegte Token-Werte haben Vorrang vor dem Rückgriff auf die Umgebungsvariable, und `DISCORD_BOT_TOKEN` wird nur für das Standardkonto verwendet.
Wenn zwei aktivierte Discord-Konten dasselbe Bot-Token auflösen, startet OpenClaw für dieses Token nur einen Gateway-Monitor: Ein aus der Konfiguration stammendes Token hat Vorrang vor dem Rückgriff auf die Umgebungsvariable; andernfalls hat das erste aktivierte Konto Vorrang, und das doppelte Konto wird mit dem Grund `duplicate bot token` als deaktiviert gemeldet.
Bei erweiterten ausgehenden Aufrufen (Nachrichtenwerkzeug/Kanalaktionen) wird ein explizites `token` pro Aufruf für diesen Aufruf verwendet. Dies gilt für Sendeaktionen sowie Aktionen zum Lesen und Prüfen (Lesen/Suchen/Abrufen/Thread/Pins/Berechtigungen). Kontorichtlinien und Wiederholungseinstellungen stammen weiterhin aus dem ausgewählten Konto im aktiven Runtime-Snapshot.
</Note>

## Empfohlen: Gildenarbeitsbereich einrichten

Sobald DMs funktionieren, können Sie Ihren Server in einen vollständigen Arbeitsbereich umwandeln, in dem jeder Kanal eine eigene Agentensitzung mit eigenem Kontext erhält. Dies wird für private Server empfohlen, auf denen sich nur Sie und Ihr Bot befinden.

<Steps>
  <Step title="Server zur Gilden-Zulassungsliste hinzufügen">
    Dadurch kann Ihr Agent in jedem Kanal Ihres Servers antworten, nicht nur in DMs.

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

    In Gildenkanälen werden normale Antworten standardmäßig automatisch gepostet. Aktivieren Sie für gemeinsam genutzte, dauerhaft aktive Räume `messages.groupChat.visibleReplies: "message_tool"`, damit der Agent passiv mitlesen und nur dann posten kann, wenn er eine Antwort im Kanal für sinnvoll hält. Dies funktioniert am besten mit Modellen der neuesten Generation, die Werkzeuge zuverlässig verwenden, beispielsweise GPT-5.6 Sol. Umgebungsereignisse im Raum bleiben still, sofern das Werkzeug nichts sendet. Die vollständige Konfiguration für den passiven Modus finden Sie unter [Umgebungsereignisse in Räumen](/de/channels/ambient-room-events).

    Wenn Discord die Tippanzeige anzeigt und die Protokolle eine Token-Nutzung ausweisen, aber keine Nachricht gepostet wird, prüfen Sie, ob der Durchlauf als Umgebungsereignis im Raum konfiguriert wurde oder sichtbare Antworten über das Nachrichtenwerkzeug aktiviert sind.

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

        Um das Senden sichtbarer Gruppen-/Kanalantworten über das Nachrichtenwerkzeug vorzuschreiben, legen Sie `messages.groupChat.visibleReplies: "message_tool"` fest.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Speicher für Gildenkanäle planen">
    Der Langzeitspeicher (MEMORY.md) wird nur in DM-Sitzungen automatisch geladen; in Gildenkanälen wird er nicht geladen.

    <Tabs>
      <Tab title="Ihren Agenten fragen">
        > „Wenn ich Fragen in Discord-Kanälen stelle, verwenden Sie memory_search oder memory_get, falls Sie Langzeitkontext aus MEMORY.md benötigen.“
      </Tab>
      <Tab title="Manuell">
        Legen Sie stabile Anweisungen für einen gemeinsamen Kontext in jedem Kanal in `AGENTS.md` oder `USER.md` ab (sie werden in jede Sitzung eingefügt). Bewahren Sie langfristige Notizen in `MEMORY.md` auf und greifen Sie bei Bedarf mit Speicherwerkzeugen darauf zu.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Erstellen Sie nun Kanäle und beginnen Sie mit dem Chatten. Der Agent sieht den Kanalnamen, und jeder Kanal ist eine isolierte Sitzung – richten Sie `#coding`, `#home`, `#research` oder andere zu Ihrem Arbeitsablauf passende Kanäle ein.

## Runtime-Modell

- Das Gateway verwaltet die Discord-Verbindung.
- Das Antwort-Routing ist deterministisch: Auf eingehende Discord-Nachrichten wird über Discord geantwortet.
- Metadaten zu Discord-Gilden und -Kanälen werden dem Modell-Prompt als nicht vertrauenswürdiger Kontext hinzugefügt, nicht als für Benutzer sichtbares Antwortpräfix. Wenn ein Modell diesen Umschlag zurückkopiert, entfernt OpenClaw die kopierten Metadaten aus ausgehenden Antworten und aus dem Kontext zukünftiger Wiedergaben.
- Standardmäßig (`session.dmScope=main`) verwenden direkte Chats gemeinsam die Hauptsitzung des Agenten (`agent:main:main`).
- Gildenkanäle verwenden isolierte Sitzungsschlüssel (`agent:<agentId>:discord:channel:<channelId>`).
- Gruppen-DMs werden standardmäßig ignoriert (`channels.discord.dm.groupEnabled=false`).
- Native Slash-Befehle werden in isolierten Befehlssitzungen ausgeführt (`agent:<agentId>:discord:slash:<userId>`), wobei `CommandTargetSessionKey` weiterhin an die weitergeleitete Konversationssitzung übergeben wird.
- Bei der Zustellung reiner Textankündigungen von Cron/Heartbeat an Discord wird nur die endgültige, für den Assistenten sichtbare Antwort einmal gesendet. Medien und strukturierte Komponenten-Payloads bleiben aus mehreren Nachrichten bestehend, wenn der Agent mehrere zustellbare Payloads ausgibt.

## Forenkanäle

Discord-Foren- und Medienkanäle akzeptieren ausschließlich Thread-Beiträge. OpenClaw unterstützt zwei Möglichkeiten, diese zu erstellen:

- Senden Sie eine Nachricht an das übergeordnete Forum (`channel:<forumId>`), um automatisch einen Thread zu erstellen. Der Thread-Titel entspricht der ersten nicht leeren Zeile der Nachricht (gekürzt auf Discords Begrenzung von 100 Zeichen für Thread-Namen).
- Verwenden Sie `openclaw message thread create`, um direkt einen Thread zu erstellen. Übergeben Sie für Forumskanäle nicht `--message-id`.

An das übergeordnete Forum senden, um einen Thread zu erstellen:

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Thementitel\nInhalt des Beitrags"
```

Explizit einen Forumsthread erstellen:

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Thementitel" --message "Inhalt des Beitrags"
```

Übergeordnete Foren unterstützen keine Discord-Komponenten. Wenn Sie Komponenten benötigen, senden Sie die Nachricht an den Thread selbst (`channel:<threadId>`).

## Interaktive Komponenten

OpenClaw unterstützt Container mit Discord-Komponenten v2 für Agentennachrichten. Verwenden Sie das Nachrichtenwerkzeug mit einer `components`-Payload. Interaktionsergebnisse werden als normale eingehende Nachrichten an den Agenten zurückgeleitet und folgen den bestehenden Discord-Einstellungen für `replyToMode`.

Unterstützte Blöcke:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Aktionszeilen erlauben bis zu 5 Schaltflächen oder ein einzelnes Auswahlmenü
- Auswahltypen: `string`, `user`, `role`, `mentionable`, `channel`

Standardmäßig können Komponenten nur einmal verwendet werden. Legen Sie `components.reusable=true` fest, damit Schaltflächen, Auswahlmenüs und Formulare bis zu ihrem Ablauf mehrfach verwendet werden können.

Um einzuschränken, wer auf eine Schaltfläche klicken kann, legen Sie für diese Schaltfläche `allowedUsers` fest (Discord-Benutzer-IDs, Tags oder `*`). Nicht übereinstimmende Benutzer erhalten eine nur für sie sichtbare Ablehnung.

Komponenten-Callbacks laufen standardmäßig nach 30 Minuten ab. Legen Sie `channels.discord.agentComponents.ttlMs` fest, um die Lebensdauer der Callback-Registrierung für das Standardkonto zu ändern, oder verwenden Sie kontospezifisch `channels.discord.accounts.<accountId>.agentComponents.ttlMs`. Der Wert wird in Millisekunden angegeben, muss eine positive Ganzzahl sein und ist auf `86400000` (24 Stunden) begrenzt. Längere TTLs eignen sich für Prüfungs-/Genehmigungsabläufe, bei denen Schaltflächen länger verwendbar bleiben müssen, verlängern jedoch auch den Zeitraum, in dem eine alte Discord-Nachricht noch eine Aktion auslösen kann. Verwenden Sie vorzugsweise die kürzeste passende TTL und behalten Sie den Standardwert bei, wenn veraltete Callbacks unerwartet wären.

Die Slash-Befehle `/model` und `/models` öffnen eine interaktive Modellauswahl mit Dropdown-Menüs für Provider, Modell und kompatible Laufzeit sowie einem Submit-Schritt. `/models add` ist veraltet und gibt eine Veraltungsmeldung zurück, statt Modelle aus dem Chat zu registrieren. Die Antwort der Auswahl ist nur für den aufrufenden Benutzer sichtbar und kann ausschließlich von ihm verwendet werden. Discord-Auswahlmenüs sind auf 25 Optionen begrenzt. Fügen Sie daher `provider/*`-Einträge zu `agents.defaults.models` hinzu, wenn die Auswahl dynamisch erkannte Modelle nur für ausgewählte Provider wie `openai` oder `vllm` anzeigen soll.

Dateianhänge:

- `file`-Blöcke müssen auf eine Anhangsreferenz (`attachment://<filename>`) verweisen
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
        { type: "text", label: "Antragsteller" },
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
    - `open` (erfordert, dass `channels.discord.allowFrom` `"*"` enthält)
    - `disabled`

    Wenn die DM-Richtlinie nicht offen ist, werden unbekannte Benutzer blockiert (oder im Modus `pairing` zur Kopplung aufgefordert).

    Priorität bei mehreren Konten:

    - `channels.discord.accounts.default.allowFrom` gilt nur für das Konto `default`.
    - Bei einem Konto hat `allowFrom` Vorrang vor dem veralteten `dm.allowFrom`.
    - Benannte Konten übernehmen `channels.discord.allowFrom`, wenn weder ihr eigenes `allowFrom` noch das veraltete `dm.allowFrom` festgelegt ist.
    - Benannte Konten übernehmen `channels.discord.accounts.default.allowFrom` nicht.

    Die veralteten Einstellungen `channels.discord.dm.policy` und `channels.discord.dm.allowFrom` werden aus Kompatibilitätsgründen weiterhin gelesen. `openclaw doctor --fix` migriert sie zu `dmPolicy` und `allowFrom`, wenn dies ohne Änderung des Zugriffs möglich ist.

    DM-Zielformat für die Zustellung:

    - `user:<id>`
    - Erwähnung `<@id>`

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

    Ein Discord-Textkanal besitzt keine separate Mitgliederliste. `type: "discord.channelAudience"` modelliert die Mitgliedschaft wie folgt: Der DM-Absender ist Mitglied des konfigurierten Servers und verfügt nach Anwendung der Rollen- und Kanalüberschreibungen derzeit über die effektive Berechtigung `ViewChannel` für den konfigurierten Kanal.

    Beispiel: Allen Personen, die `#maintainers` sehen können, DMs an den Bot erlauben, während DMs für alle anderen geschlossen bleiben.

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

    Aktivieren Sie im Discord Developer Portal **Server Members Intent**, wenn Sie Zugriffsgruppen auf Basis der Kanalzielgruppe verwenden. DMs enthalten keinen Servermitgliedsstatus, daher löst OpenClaw das Mitglied zum Zeitpunkt der Autorisierung über Discord REST auf.

  </Tab>

  <Tab title="Serverrichtlinie">
    Die Behandlung von Servern wird durch `channels.discord.groupPolicy` gesteuert:

    - `open`
    - `allowlist`
    - `disabled`

    Wenn `channels.discord` vorhanden ist, lautet die sichere Ausgangskonfiguration `allowlist`.

    Verhalten von `allowlist`:

    - Der Server muss mit `channels.discord.guilds` übereinstimmen (`id` bevorzugt, Slug akzeptiert)
    - Optionale Absender-Zulassungslisten: `users` (stabile IDs empfohlen) und `roles` (nur Rollen-IDs); wenn eine davon konfiguriert ist, werden Absender zugelassen, wenn sie mit `users` ODER `roles` übereinstimmen
    - Der direkte Abgleich von Namen/Tags ist standardmäßig deaktiviert; aktivieren Sie `channels.discord.dangerouslyAllowNameMatching: true` nur als Notfall-Kompatibilitätsmodus
    - Namen/Tags werden für `users` unterstützt, IDs sind jedoch sicherer; `openclaw security audit` warnt, wenn Namens-/Tag-Einträge verwendet werden
    - Wenn für einen Server `channels` konfiguriert sind, werden nicht aufgeführte Kanäle abgelehnt
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

    Der veraltete kanalbezogene Schlüssel `allow` wird von `openclaw doctor --fix` zu `enabled` migriert.

    Wenn Sie nur `DISCORD_BOT_TOKEN` festlegen und keinen `channels.discord`-Block erstellen, lautet der Laufzeit-Fallback `groupPolicy="allowlist"` (mit einer Warnung in den Protokollen), selbst wenn `channels.defaults.groupPolicy` auf `open` gesetzt ist.

  </Tab>

  <Tab title="Erwähnungen und Gruppen-DMs">
    Nachrichten auf Servern erfordern standardmäßig eine Erwähnung.

    Die Erkennung von Erwähnungen umfasst:

    - explizite Erwähnung des Bots
    - konfigurierte Erwähnungsmuster (`agents.list[].groupChat.mentionPatterns`, ersatzweise `messages.groupChat.mentionPatterns`)
    - implizites Antwort-an-den-Bot-Verhalten in unterstützten Fällen

    Verwenden Sie beim Verfassen ausgehender Discord-Nachrichten die kanonische Erwähnungssyntax: `<@USER_ID>` für Benutzer, `<#CHANNEL_ID>` für Kanäle und `<@&ROLE_ID>` für Rollen. Verwenden Sie nicht die veraltete Spitznamen-Erwähnungsform `<@!USER_ID>`.

    `requireMention` wird pro Server/Kanal konfiguriert (`channels.discord.guilds...`).
    `ignoreOtherMentions` verwirft optional Nachrichten, die einen anderen Benutzer/eine andere Rolle, aber nicht den Bot erwähnen (ausgenommen @everyone/@here).

    Gruppen-DMs:

    - Standard: ignoriert (`dm.groupEnabled=false`)
    - Optionale Zulassungsliste über `dm.groupChannels` (Kanal-IDs oder Slugs)

  </Tab>
</Tabs>

### Rollenbasiertes Agenten-Routing

Verwenden Sie `bindings[].match.roles`, um Discord-Servermitglieder anhand ihrer Rollen-ID an unterschiedliche Agenten weiterzuleiten. Rollenbasierte Bindungen akzeptieren ausschließlich Rollen-IDs und werden nach Peer- oder Parent-Peer-Bindungen sowie vor reinen Serverbindungen ausgewertet. Wenn eine Bindung außerdem weitere Abgleichsfelder festlegt (beispielsweise `peer` + `guildId` + `roles`), müssen alle konfigurierten Felder übereinstimmen.

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
  - Kanalbezogene Überschreibung: `channels.discord.commands.native`.
  - `commands.native=false` überspringt beim Start die Registrierung und Bereinigung von Discord-Slash-Befehlen. Zuvor registrierte Befehle können in Discord sichtbar bleiben, bis Sie sie aus der Discord-App entfernen.
  - Die Authentifizierung nativer Befehle verwendet dieselben Discord-Zulassungslisten und -Richtlinien wie die normale Nachrichtenverarbeitung.
  - Befehle können in der Discord-Benutzeroberfläche weiterhin für nicht autorisierte Benutzer sichtbar sein; bei der Ausführung wird die OpenClaw-Authentifizierung durchgesetzt und mit „nicht autorisiert“ geantwortet.
  - Standardeinstellung für Slash-Befehle: `ephemeral: true` (`channels.discord.slashCommand.ephemeral`).

  Informationen zum Befehlskatalog und Verhalten finden Sie unter [Slash-Befehle](/de/tools/slash-commands).

  ## Funktionsdetails

  <AccordionGroup>
  <Accordion title="Antwort-Tags und native Antworten">
    Discord unterstützt Antwort-Tags in der Agentenausgabe:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Gesteuert durch `channels.discord.replyToMode`:

    - `off` (Standard): keine implizite Verschachtelung von Antworten; explizite `[[reply_to_*]]`-Tags werden weiterhin berücksichtigt
    - `first`: fügt den impliziten nativen Antwortverweis der ersten ausgehenden Discord-Nachricht des Durchlaufs hinzu
    - `all`: fügt ihn jeder ausgehenden Nachricht hinzu
    - `batched`: fügt ihn nur hinzu, wenn das eingehende Ereignis ein entprellter Stapel aus mehreren Nachrichten war – nützlich, wenn Sie native Antworten hauptsächlich für mehrdeutige, schnell aufeinanderfolgende Chats verwenden möchten und nicht für jeden Durchlauf mit nur einer Nachricht

    Nachrichten-IDs werden im Kontext und Verlauf bereitgestellt, damit Agenten gezielt auf bestimmte Nachrichten verweisen können.

  </Accordion>

  <Accordion title="Linkvorschauen">
    Discord erzeugt für URLs standardmäßig umfangreiche Linkeinbettungen. OpenClaw unterdrückt diese erzeugten Einbettungen bei ausgehenden Discord-Nachrichten standardmäßig, sodass von Agenten gesendete URLs einfache Links bleiben, sofern Sie dies nicht ausdrücklich aktivieren:

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    Legen Sie `channels.discord.accounts.<id>.suppressEmbeds` fest, um die Einstellung für ein einzelnes Konto zu überschreiben. Beim Senden über das Nachrichten-Tool des Agenten kann für eine einzelne Nachricht ebenfalls `suppressEmbeds: false` übergeben werden. Explizite Discord-`embeds`-Payloads werden durch die Standardeinstellung für Linkvorschauen nicht unterdrückt.

  </Accordion>

  <Accordion title="Live stream preview">
    OpenClaw kann Antwortentwürfe streamen, indem es eine temporäre Nachricht sendet und diese bearbeitet, während Text eintrifft. `channels.discord.streaming.mode` akzeptiert `off` | `partial` | `block` | `progress` (Standardwert, wenn kein Schlüssel `streaming` bzw. kein veralteter Schlüssel `streamMode` festgelegt ist). `streamMode` ist ein veralteter Alias; führen Sie `openclaw doctor --fix` aus, um die persistierte Konfiguration in die kanonische verschachtelte Struktur `streaming` umzuschreiben.

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

    - `off` deaktiviert Bearbeitungen der Discord-Vorschau.
    - `partial` bearbeitet eine einzelne Vorschaunachricht, während Tokens eintreffen.
    - `block` gibt Blöcke in Entwurfsgröße aus; Größe und Umbruchpunkte können Sie mit `streaming.preview.chunk` (`minChars`, `maxChars`, `breakPreference`) anpassen, begrenzt auf `textChunkLimit`. Wenn Block-Streaming explizit aktiviert ist, überspringt OpenClaw den Vorschau-Stream, um doppeltes Streaming zu vermeiden.
    - `progress` behält einen bearbeitbaren Statusentwurf bei und aktualisiert ihn bis zur endgültigen Zustellung mit dem Werkzeugfortschritt; die gemeinsame Startbeschriftung ist eine fortlaufende Zeile und wird daher wie der Rest aus dem sichtbaren Bereich gescrollt, sobald genügend Arbeit angezeigt wird.
    - Medien, Fehler und endgültige explizite Antworten brechen ausstehende Vorschaubearbeitungen ab.
    - `streaming.preview.toolProgress` (Standardwert `true`) legt fest, ob Werkzeug-/Fortschrittsaktualisierungen die Vorschaunachricht wiederverwenden.
    - Werkzeug-/Fortschrittszeilen werden, sofern verfügbar, kompakt als Emoji + Titel + Detail dargestellt, beispielsweise `🛠️ Bash: run tests` oder `🔎 Web Search: for "query"`.
    - `streaming.progress.commentary` (Standardwert `false`) aktiviert Kommentar-/Präambeltext des Assistenten im temporären Fortschrittsentwurf. Kommentare werden vor der Anzeige bereinigt, bleiben vorübergehend und ändern die Zustellung der endgültigen Antwort nicht.
    - `streaming.progress.maxLineChars` steuert das Zeichenbudget pro Zeile für die Fortschrittsvorschau. Fließtext wird an Wortgrenzen gekürzt; bei Befehls- und Pfaddetails bleiben nützliche Suffixe erhalten.
    - `streaming.preview.commandText` / `streaming.progress.commandText` steuert Befehls-/Ausführungsdetails in kompakten Fortschrittszeilen: `raw` (Standardwert) oder `status` (nur Werkzeugbeschriftung).

    Blenden Sie den Rohtext von Befehlen/Ausführungen aus, während kompakte Fortschrittszeilen erhalten bleiben:

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

    Die Streaming-Vorschau unterstützt nur Text; Medienantworten greifen auf die normale Zustellung zurück.

  </Accordion>

  <Accordion title="Verlauf, Kontext und Thread-Verhalten">
    Kontext des Serververlaufs:

    - `channels.discord.historyLimit`, Standardwert `20`
    - Rückgriff: `messages.groupChat.historyLimit`
    - `0` deaktiviert die Funktion

    Steuerung des Direktnachrichtenverlaufs:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Thread-Verhalten:

    - Discord-Threads werden als Kanalsitzungen weitergeleitet und übernehmen die Konfiguration des übergeordneten Kanals, sofern sie nicht überschrieben wird.
    - Thread-Sitzungen übernehmen die sitzungsbezogene `/model`-Auswahl des übergeordneten Kanals ausschließlich als Modell-Rückgriff; Thread-lokale `/model`-Auswahlen haben Vorrang, und der Transkriptverlauf des übergeordneten Kanals wird nur kopiert, wenn die Transkriptvererbung aktiviert ist.
    - Mit `channels.discord.thread.inheritParent` (Standardwert `false`) übernehmen neue automatische Threads anfänglich Inhalte aus dem übergeordneten Transkript. Kontospezifische Überschreibung: `channels.discord.accounts.<id>.thread.inheritParent`.
    - Reaktionen des Nachrichten-Tools können Direktnachrichtenziele im Format `user:<id>` auflösen.
    - `guilds.<guild>.channels.<channel>.requireMention: false` bleibt beim Aktivierungs-Rückgriff während der Antwortphase erhalten.

    Kanalthemen werden als **nicht vertrauenswürdiger** Kontext eingefügt. Zulassungslisten beschränken, wer den Agenten auslösen kann, stellen jedoch keine vollständige Schwärzungsgrenze für ergänzenden Kontext dar.

  </Accordion>

  <Accordion title="Thread-gebundene Sitzungen für Subagenten">
    Discord kann einen Thread an ein Sitzungsziel binden, sodass Folgenachrichten in diesem Thread weiterhin an dieselbe Sitzung weitergeleitet werden (einschließlich Subagenten-Sitzungen).

    Befehle:

    - `/focus <target>` bindet den aktuellen/neuen Thread an ein Subagenten-/Sitzungsziel
    - `/unfocus` entfernt die Bindung des aktuellen Threads
    - `/agents` zeigt aktive Ausführungen und den Bindungsstatus an
    - `/session idle <duration|off>` prüft/aktualisiert die automatische Aufhebung der Fokussierung nach Inaktivität für fokussierte Bindungen
    - `/session max-age <duration|off>` prüft/aktualisiert das feste Höchstalter für fokussierte Bindungen

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
    - `spawnSessions` steuert das automatische Erstellen/Binden von Threads für `sessions_spawn({ thread: true })` und ACP-Thread-Spawns. Standard: `true`.
    - `defaultSpawnContext` steuert den nativen Subagent-Kontext für Thread-gebundene Spawns. Standard: `"fork"`.
    - Veraltete Schlüssel `spawnSubagentSessions`/`spawnAcpSessions` werden durch `openclaw doctor --fix` migriert.
    - Wenn Thread-Bindungen für ein Konto deaktiviert sind, sind `/focus` und zugehörige Vorgänge für Thread-Bindungen nicht verfügbar.

    Siehe [Subagenten](/de/tools/subagents), [ACP-Agenten](/de/tools/acp-agents) und [Konfigurationsreferenz](/de/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Persistente ACP-Kanalbindungen">
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

    - `/acp spawn codex --bind here` bindet den aktuellen Kanal oder Thread direkt und sorgt dafür, dass zukünftige Nachrichten dieselbe ACP-Sitzung verwenden. Thread-Nachrichten übernehmen die Bindung des übergeordneten Kanals.
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

    Reaktionsereignisse werden in Systemereignisse umgewandelt und der weitergeleiteten Discord-Sitzung angefügt.

  </Accordion>

  <Accordion title="Bestätigungsreaktionen">
    `ackReaction` sendet ein Bestätigungs-Emoji, während OpenClaw eine eingehende Nachricht verarbeitet.

    Auflösungsreihenfolge:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - Rückgriff auf das Emoji der Agentenidentität (`agents.list[].identity.emoji`, andernfalls „👀“)

    Hinweise:

    - Discord akzeptiert Unicode-Emojis oder Namen benutzerdefinierter Emojis.
    - Verwenden Sie `""`, um die Reaktion für einen Kanal oder ein Konto zu deaktivieren.

    **Geltungsbereich (`messages.ackReactionScope`):**

    Werte: `"all"` (Direktnachrichten + Gruppen, einschließlich Hintergrundereignissen in Räumen), `"direct"` (nur Direktnachrichten), `"group-all"` (jede Gruppennachricht außer Hintergrundereignissen in Räumen, keine Direktnachrichten), `"group-mentions"` (Gruppen, wenn der Bot erwähnt wird; **keine Direktnachrichten**, Standard), `"off"` / `"none"` (deaktiviert).

    <Note>
    Der standardmäßige Geltungsbereich (`"group-mentions"`) löst keine Bestätigungsreaktionen in Direktnachrichten oder bei Hintergrundereignissen in Räumen aus. Um bei eingehenden Discord-Direktnachrichten und stillen Raumereignissen eine Bestätigungsreaktion zu erhalten, setzen Sie `messages.ackReactionScope` auf `"all"`.
    </Note>

  </Accordion>

  <Accordion title="Konfigurationsänderungen">
    Vom Kanal initiierte Konfigurationsänderungen sind standardmäßig aktiviert. Dies betrifft Abläufe mit `/config set|unset` (wenn Befehlsfunktionen aktiviert sind).

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
    Leiten Sie den WebSocket-Datenverkehr des Discord-Gateways und die REST-Abfragen beim Start (Anwendungs-ID + Auflösung der Positivliste) über einen HTTP(S)-Proxy mit `channels.discord.proxy`.
    Die Proxy-Nutzung für WebSockets des Discord-Gateways muss explizit konfiguriert werden; WebSocket-Verbindungen übernehmen keine Proxy-Umgebungsvariablen aus dem Gateway-Prozess. REST-Abfragen beim Start verwenden diesen Proxy, wenn `channels.discord.proxy` konfiguriert ist.

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
    - Anzeigenamen von Mitgliedern werden nur dann anhand von Name/Slug abgeglichen, wenn `channels.discord.dangerouslyAllowNameMatching: true` festgelegt ist
    - Abfragen rufen die PluralKit-API mit der ursprünglichen Nachrichten-ID auf
    - wenn die Abfrage fehlschlägt, werden weitergeleitete Nachrichten als Bot-Nachrichten behandelt und verworfen, sofern `allowBots` sie nicht zulässt

  </Accordion>

  <Accordion title="Aliasse für ausgehende Erwähnungen">
    Verwenden Sie `mentionAliases`, wenn Agenten deterministische ausgehende Erwähnungen für bekannte Discord-Benutzer benötigen. Schlüssel sind Handles ohne das vorangestellte `@`; Werte sind Discord-Benutzer-IDs. Unbekannte Handles, `@everyone`, `@here` und Erwähnungen innerhalb von Markdown-Code-Spannen bleiben unverändert.

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

    - 0: Spielen
    - 1: Streaming (erfordert `activityUrl`; `activityUrl` erfordert wiederum `activityType: 1`)
    - 2: Zuhören
    - 3: Zuschauen
    - 4: Benutzerdefiniert (verwendet den Aktivitätstext als Statuszustand; Emoji ist optional)
    - 5: Im Wettbewerb

    Automatische Präsenz (Laufzeit-Zustandssignal):

```json5
{
  channels: {
    discord: {
      autoPresence: {
        enabled: true,
        intervalMs: 30000,
        minUpdateIntervalMs: 15000,
        exhaustedText: "Token erschöpft",
      },
    },
  },
}
```

    Die automatische Präsenz ordnet die Laufzeitverfügbarkeit dem Discord-Status zu: fehlerfrei => online, beeinträchtigt oder unbekannt => abwesend, erschöpft oder nicht verfügbar => nicht stören. Standardwerte: `intervalMs` 30000, `minUpdateIntervalMs` 15000 (muss kleiner oder gleich `intervalMs` sein). Optionale Textüberschreibungen:

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

    Discord aktiviert native Ausführungsgenehmigungen automatisch, wenn `enabled` nicht festgelegt oder auf `"auto"` gesetzt ist und mindestens eine genehmigungsberechtigte Person ermittelt werden kann, entweder aus `execApprovals.approvers` oder aus `commands.ownerAllowFrom`. Discord leitet genehmigungsberechtigte Personen für Ausführungen nicht aus dem kanalbezogenen `allowFrom`, dem veralteten `dm.allowFrom` oder dem Direktnachrichtenwert `defaultTo` ab. Legen Sie `enabled: false` fest, um Discord ausdrücklich als nativen Genehmigungsclient zu deaktivieren.

    Bei vertraulichen, ausschließlich Eigentümern vorbehaltenen Gruppenbefehlen wie `/diagnostics` und `/export-trajectory` sendet OpenClaw Genehmigungsaufforderungen und abschließende Ergebnisse privat. Zunächst wird eine Discord-Direktnachricht versucht, wenn für den aufrufenden Eigentümer eine Discord-Eigentümerroute vorhanden ist; andernfalls wird auf die erste verfügbare Eigentümerroute aus `commands.ownerAllowFrom` zurückgegriffen, beispielsweise Telegram.

    Wenn `target` auf `channel` oder `both` gesetzt ist, ist die Genehmigungsaufforderung im Kanal sichtbar. Nur ermittelte genehmigungsberechtigte Personen können die Schaltflächen verwenden; andere Benutzer erhalten eine nur für sie sichtbare Ablehnung. Genehmigungsaufforderungen enthalten den Befehlstext. Aktivieren Sie daher die Zustellung im Kanal nur in vertrauenswürdigen Kanälen. Wenn die Kanal-ID nicht aus dem Sitzungsschlüssel abgeleitet werden kann, greift OpenClaw auf die Zustellung per Direktnachricht zurück.

    Discord stellt die gemeinsamen Genehmigungsschaltflächen dar, die auch von anderen Chatkanälen verwendet werden; der native Discord-Adapter ergänzt hauptsächlich das Routing von Direktnachrichten an genehmigungsberechtigte Personen und die Verteilung auf Kanäle. Wenn diese Schaltflächen vorhanden sind, bilden sie die primäre Benutzeroberfläche für Genehmigungen; OpenClaw sollte einen manuellen `/approve`-Befehl nur dann einfügen, wenn das Werkzeugergebnis angibt, dass Chatgenehmigungen nicht verfügbar sind oder die manuelle Genehmigung der einzige Weg ist. Wenn die native Discord-Genehmigungslaufzeit nicht aktiv ist, hält OpenClaw die lokale deterministische Aufforderung `/approve <id> <decision>` sichtbar. Wenn die Laufzeit aktiv ist, aber keine native Karte an ein Ziel zugestellt werden kann, sendet OpenClaw im selben Chat einen Ausweichhinweis mit dem exakten `/approve`-Befehl aus der ausstehenden Genehmigung.

    Gateway-Authentifizierung und Genehmigungsauflösung folgen dem gemeinsamen Gateway-Clientvertrag (`plugin:`-IDs werden über `plugin.approval.resolve` aufgelöst; andere IDs über `exec.approval.resolve`). Genehmigungen laufen standardmäßig nach 30 Minuten ab.

    Siehe [Ausführungsgenehmigungen](/de/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Werkzeuge und Aktionssperren

Discord-Nachrichtenaktionen umfassen Nachrichtenübermittlung, Kanalverwaltung, Moderation, Präsenz und Metadaten.

Grundlegende Beispiele:

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

- `channels.discord.ui.components.accentColor` legt die Akzentfarbe fest, die von Discord-Komponentencontainern verwendet wird (Hexadezimalwert). Pro Konto: `channels.discord.accounts.<id>.ui.components.accentColor`.
- `channels.discord.agentComponents.ttlMs` steuert, wie lange Rückrufe gesendeter Discord-Komponenten registriert bleiben (Standardwert `1800000`, Maximum `86400000`). Pro Konto: `channels.discord.accounts.<id>.agentComponents.ttlMs`.
- `embeds` werden ignoriert, wenn Components v2 vorhanden sind.
- Vorschauen einfacher URLs werden standardmäßig unterdrückt. Legen Sie bei einer Nachrichtenaktion `suppressEmbeds: false` fest, wenn ein einzelner ausgehender Link erweitert werden soll.

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

Discord verfügt über zwei unterschiedliche Sprachfunktionen: **Sprachkanäle** in Echtzeit (fortlaufende Unterhaltungen) und **Sprachnachrichtenanhänge** (das Format mit Wellenformvorschau). Das Gateway unterstützt beide.

### Sprachkanäle

Einrichtungscheckliste:

1. Aktivieren Sie Message Content Intent im Discord Developer Portal.
2. Aktivieren Sie Server Members Intent, wenn rollen- oder benutzerbasierte Zulassungslisten verwendet werden.
3. Laden Sie den Bot mit den Berechtigungsbereichen `bot` und `applications.commands` ein.
4. Gewähren Sie Connect, Speak, Send Messages und Read Message History im Ziel-Sprachkanal.
5. Aktivieren Sie native Befehle (`commands.native` oder `channels.discord.commands.native`).
6. Konfigurieren Sie `channels.discord.voice`.

Verwenden Sie `/vc join|leave|status`, um Sitzungen zu steuern. Der Befehl verwendet den Standardagenten des Kontos und folgt denselben Regeln für Zulassungslisten und Gruppenrichtlinien wie andere Discord-Befehle.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

So überprüfen Sie vor dem Beitritt die effektiven Berechtigungen des Bots:

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

- Discord-Sprachfunktionen sind bei reinen Textkonfigurationen optional; setzen Sie `channels.discord.voice.enabled=true` (oder behalten Sie einen vorhandenen `channels.discord.voice`-Block bei), um `/vc`-Befehle, die Sprachlaufzeit und den Gateway-Intent `GuildVoiceStates` zu aktivieren. `channels.discord.intents.voiceStates` kann das Intent-Abonnement ausdrücklich überschreiben; lassen Sie die Option nicht gesetzt, damit sie der effektiven Aktivierung der Sprachfunktionen folgt.
- `voice.mode` steuert den Gesprächspfad. Der Standardwert ist `agent-proxy`: Ein Echtzeit-Sprach-Frontend verarbeitet den Zeitpunkt von Gesprächswechseln, Unterbrechungen und die Wiedergabe, delegiert inhaltliche Aufgaben über `openclaw_agent_consult` an den weitergeleiteten OpenClaw-Agenten und behandelt das Ergebnis wie eine von diesem Sprecher eingegebene Discord-Eingabeaufforderung. `stt-tts` behält den älteren Batch-Ablauf aus STT und TTS bei. `bidi` lässt das Echtzeitmodell direkt kommunizieren und stellt dabei `openclaw_agent_consult` für das OpenClaw-Gehirn bereit.
- `voice.agentSession` steuert, welche OpenClaw-Unterhaltung Sprachbeiträge empfängt. Lassen Sie die Option für die eigene Sitzung des Sprachkanals nicht gesetzt, oder setzen Sie `{ mode: "target", target: "channel:<text-channel-id>" }`, damit der Sprachkanal als Mikrofon-/Lautsprechererweiterung einer vorhandenen Discord-Textkanalsitzung wie `#maintainers` fungiert.
- `voice.model` überschreibt das OpenClaw-Agentengehirn für Discord-Sprachantworten und Echtzeitkonsultationen. Lassen Sie die Option nicht gesetzt, um das Modell des weitergeleiteten Agenten zu übernehmen. Sie ist von `voice.realtime.model` getrennt.
- `voice.followUsers` ermöglicht dem Bot, ausgewählten Benutzern in Discord-Sprachkanäle zu folgen, zwischen ihnen zu wechseln und sie zu verlassen. Siehe [Benutzern in Sprachkanälen folgen](#follow-users-in-voice).
- `agent-proxy` leitet Sprache über `discord-voice` weiter. Dabei bleibt die normale Besitzer-/Tool-Autorisierung für den Sprecher und die Zielsitzung erhalten, das Agenten-Tool `tts` wird jedoch ausgeblendet, da Discord Voice die Wiedergabe übernimmt. Standardmäßig gewährt `agent-proxy` der Konsultation für Besitzer-Sprecher einen vollständigen, dem Besitzer entsprechenden Tool-Zugriff (`voice.realtime.toolPolicy: "owner"`) und bevorzugt nachdrücklich eine Konsultation des OpenClaw-Agenten vor inhaltlichen Antworten (`voice.realtime.consultPolicy: "always"`). In diesem standardmäßigen `always`-Modus spricht die Echtzeitebene vor der Antwort der Konsultation keine Füllsätze automatisch aus; sie erfasst und transkribiert die Sprache und gibt anschließend die weitergeleitete OpenClaw-Antwort wieder. Wenn mehrere erzwungene Konsultationsantworten abgeschlossen werden, während Discord noch die erste Antwort wiedergibt, werden spätere Antworten mit exaktem Wortlaut in die Warteschlange gestellt, bis die Wiedergabe inaktiv ist, statt die Sprache mitten im Satz zu ersetzen.
- Im Modus `stt-tts` verwendet STT `tools.media.audio`; `voice.model` wirkt sich nicht auf die Transkription aus.
- In Echtzeitmodi konfigurieren `voice.realtime.provider`, `voice.realtime.model` und `voice.realtime.speakerVoice` die Echtzeit-Audiositzung. Verwenden Sie für OpenAI Realtime 2.1 zusammen mit dem Codex-Gehirn `voice.realtime.model: "gpt-realtime-2.1"` und `voice.model: "openai/gpt-5.6-sol"`.
- Echtzeit-Sprachmodi nehmen standardmäßig kleine Profildateien namens `IDENTITY.md`, `USER.md` und `SOUL.md` in die Anweisungen für den Echtzeit-Provider auf, damit schnelle direkte Gesprächsbeiträge dieselbe Identität, Benutzerverankerung und Persona wie der weitergeleitete OpenClaw-Agent beibehalten. Setzen Sie `voice.realtime.bootstrapContextFiles` auf eine Teilmenge, um dies anzupassen, oder auf `[]`, um es zu deaktivieren. Es werden nur diese Profildateien unterstützt; `AGENTS.md` verbleibt im normalen Agentenkontext. Der eingefügte Profilkontext ersetzt `openclaw_agent_consult` nicht für Arbeiten im Arbeitsbereich, aktuelle Fakten, Speicherabfragen oder Tool-gestützte Aktionen.
- Setzen Sie im OpenAI-Echtzeitmodus `agent-proxy` die Option `voice.realtime.requireWakeName: true`, damit die Discord-Echtzeitsprachfunktion stumm bleibt, bis ein Transkript mit einem Aktivierungsnamen beginnt oder endet. Konfigurierte Aktivierungsnamen müssen aus einem oder zwei Wörtern bestehen. Wenn `voice.realtime.wakeNames` nicht gesetzt ist, verwendet OpenClaw den `name` des weitergeleiteten Agenten zusammen mit `OpenClaw` und greift ersatzweise auf die Agenten-ID zusammen mit `OpenClaw` zurück. Die Aktivierungsnamen-Erkennung deaktiviert die automatische Antwort des Echtzeit-Providers, leitet akzeptierte Gesprächsbeiträge über den Konsultationspfad des OpenClaw-Agenten weiter und gibt eine kurze gesprochene Bestätigung aus, wenn anhand einer Teiltranskription ein vorangestellter Aktivierungsname erkannt wird, bevor das endgültige Transkript vorliegt.
- Der OpenAI-Echtzeit-Provider akzeptiert aktuelle Ereignisnamen von Realtime 2 sowie ältere Codex-kompatible Aliasse für Ausgabeaudio- und Transkriptereignisse, sodass kompatible Provider-Snapshots abweichen können, ohne Assistentenaudio zu verwerfen.
- `voice.realtime.bargeIn` steuert, ob Discord-Ereignisse beim Sprechbeginn die aktive Echtzeitwiedergabe unterbrechen. Wenn die Option nicht gesetzt ist, folgt sie der Einstellung des Echtzeit-Providers für Unterbrechungen durch Eingangsaudio.
- `voice.realtime.minBargeInAudioEndMs` steuert die minimale Wiedergabedauer des Assistenten, bevor ein OpenAI-Echtzeit-Barge-in das Audio abschneidet. Standardwert: `250`. Setzen Sie den Wert für eine sofortige Unterbrechung in Räumen mit geringem Echo auf `0`, oder erhöhen Sie ihn für Lautsprecherkonfigurationen mit starkem Echo.
- `voice.tts` überschreibt `messages.tts` ausschließlich für die Sprachwiedergabe mit `stt-tts`; Echtzeitmodi verwenden stattdessen `voice.realtime.speakerVoice`. Setzen Sie für eine OpenAI-Stimme bei der Discord-Wiedergabe `voice.tts.provider: "openai"` und wählen Sie unter `voice.tts.providers.openai.speakerVoice` eine Text-to-Speech-Stimme aus. `cedar` ist beim aktuellen OpenAI-TTS-Modell eine gute männlich klingende Wahl.
- Discord-Überschreibungen von `systemPrompt` pro Kanal gelten für Sprachtranskriptbeiträge dieses Sprachkanals.
- Sprachtranskriptbeiträge leiten den Besitzerstatus für besitzergeschützte Befehle und Kanalaktionen aus Discord-`allowFrom` (oder `dm.allowFrom`) ab. Die Sichtbarkeit von Agenten-Tools folgt der konfigurierten Tool-Richtlinie für die weitergeleitete Sitzung.
- Wenn `voice.autoJoin` mehrere Einträge für dieselbe Guild enthält, tritt OpenClaw dem zuletzt für diese Guild konfigurierten Kanal bei.
- `voice.allowedChannels` ist eine optionale Positivliste für zulässige Aufenthaltskanäle. Lassen Sie sie nicht gesetzt, damit `/vc join` jedem autorisierten Discord-Sprachkanal beitreten kann. Wenn sie gesetzt ist, sind `/vc join`, der automatische Beitritt beim Start und durch den Sprachstatus des Bots ausgelöste Wechsel auf die aufgeführten `{ guildId, channelId }`-Einträge beschränkt. Setzen Sie sie auf ein leeres Array, um alle Beitritte zu Discord-Sprachkanälen zu verweigern. Wenn Discord den Bot aus der Positivliste heraus verschiebt, verlässt OpenClaw diesen Kanal und tritt erneut dem konfigurierten Ziel für den automatischen Beitritt bei, sofern eines verfügbar ist.
- `voice.daveEncryption` und `voice.decryptionFailureTolerance` werden an die Beitrittsoptionen von `@discordjs/voice` weitergegeben; die vorgelagerten Standardwerte sind `daveEncryption=true` und `decryptionFailureTolerance=24`.
- OpenClaw verwendet den gebündelten Codec `libopus-wasm` für den Empfang von Discord-Sprachdaten und die Echtzeitwiedergabe von rohem PCM. Er enthält einen festgelegten libopus-WebAssembly-Build und benötigt keine nativen Opus-Add-ons.
- `voice.connectTimeoutMs` steuert die anfängliche Wartezeit auf den Status `@discordjs/voice` Ready bei `/vc join` und automatischen Beitrittsversuchen. Standardwert: `30000`.
- `voice.reconnectGraceMs` steuert, wie lange OpenClaw darauf wartet, dass eine getrennte Sprachsitzung mit der erneuten Verbindung beginnt, bevor sie beendet wird. Standardwert: `15000`.
- Im Modus `stt-tts` wird die Sprachwiedergabe nicht allein deshalb beendet, weil ein anderer Benutzer zu sprechen beginnt. Um Rückkopplungsschleifen zu vermeiden, ignoriert OpenClaw neue Sprachaufnahmen, während TTS wiedergegeben wird; sprechen Sie nach Abschluss der Wiedergabe für den nächsten Gesprächsbeitrag. Echtzeitmodi leiten den Sprechbeginn als Barge-in-Signal an den Echtzeit-Provider weiter.
- In Echtzeitmodi kann das Echo von Lautsprechern in ein offenes Mikrofon wie ein Barge-in wirken und die Wiedergabe unterbrechen. Setzen Sie für Discord-Räume mit starkem Echo `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`, damit OpenAI die Wiedergabe bei Eingangsaudio nicht automatisch unterbricht. Fügen Sie `voice.realtime.bargeIn: true` hinzu, wenn Discord-Ereignisse beim Sprechbeginn die aktive Wiedergabe weiterhin unterbrechen sollen. Die OpenAI-Echtzeitbrücke ignoriert Wiedergabeabschneidungen, die kürzer als `voice.realtime.minBargeInAudioEndMs` sind, als wahrscheinliches Echo oder Rauschen und protokolliert sie als übersprungen, statt die Discord-Wiedergabe zu löschen.
- `voice.captureSilenceGraceMs` steuert, wie lange OpenClaw wartet, nachdem Discord gemeldet hat, dass ein Sprecher aufgehört hat, bevor dieses Audiosegment für STT abgeschlossen wird. Standardwert: `2000`; erhöhen Sie ihn, wenn Discord normale Pausen in abgehackte Teiltranskripte aufteilt.
- Wenn ElevenLabs als TTS-Provider ausgewählt ist, verwendet die Discord-Sprachwiedergabe Streaming-TTS und startet aus dem Antwortstream des Providers. Provider ohne Streaming-Unterstützung greifen auf den Pfad mit einer synthetisierten temporären Datei zurück.
- OpenClaw überwacht Entschlüsselungsfehler beim Empfang und stellt die Funktion nach wiederholten Fehlern innerhalb eines kurzen Zeitfensters automatisch wieder her, indem es den Sprachkanal verlässt und erneut beitritt.
- Wenn die Empfangsprotokolle nach einer Aktualisierung wiederholt `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` anzeigen, erfassen Sie einen Abhängigkeitsbericht und die Protokolle. Die gebündelte Version von `@discordjs/voice` enthält die vorgelagerte Korrektur für Padding aus discord.js PR #11449, durch die discord.js Issue #11419 geschlossen wurde.
- Empfangsereignisse mit `The operation was aborted` sind zu erwarten, wenn OpenClaw ein erfasstes Sprechersegment abschließt; es handelt sich um ausführliche Diagnosemeldungen, nicht um Warnungen.
- Ausführliche Discord-Sprachprotokolle enthalten für jedes akzeptierte Sprechersegment eine begrenzte einzeilige Vorschau des STT-Transkripts, sodass beim Debugging sowohl die Benutzerseite als auch die Antwortseite des Agenten sichtbar sind, ohne unbegrenzt viel Transkripttext auszugeben.
- Im Modus `agent-proxy` überspringt der erzwungene Konsultations-Fallback wahrscheinlich unvollständige Transkriptfragmente, beispielsweise Text, der auf `...` oder einen abschließenden Konnektor wie „und“ endet, sowie offensichtlich nicht handlungsrelevante Abschlüsse wie „bin gleich wieder da“ oder „tschüss“. Die Protokolle zeigen `forced agent consult skipped reason=...`, wenn dadurch eine veraltete Antwort in der Warteschlange verhindert wird.

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
- `followUsersEnabled` verwendet standardmäßig `true`, wenn `followUsers` konfiguriert ist. Setzen Sie die Option auf `false`, um die gespeicherte Liste beizubehalten, aber das automatische Folgen in Sprachkanälen zu beenden.
- Wenn ein Benutzer, dem gefolgt wird, einem zulässigen Sprachkanal beitritt, tritt OpenClaw diesem Kanal bei. Wenn der Benutzer wechselt, wechselt OpenClaw mit ihm. Wenn der aktive Benutzer, dem gefolgt wird, die Verbindung trennt, verlässt OpenClaw den Kanal.
- Wenn sich mehrere Benutzer, denen gefolgt wird, in derselben Guild befinden und der aktive Benutzer den Kanal verlässt, wechselt OpenClaw zum Kanal eines anderen verfolgten Benutzers, bevor es die Guild verlässt. Wenn mehrere Benutzer, denen gefolgt wird, gleichzeitig wechseln, hat das zuletzt beobachtete Sprachstatusereignis Vorrang.
- `allowedChannels` gilt weiterhin. Ein Benutzer, dem gefolgt wird und der sich in einem nicht zulässigen Kanal befindet, wird ignoriert, und eine durch die Folgefunktion verwaltete Sitzung wechselt zu einem anderen Benutzer, dem gefolgt wird, oder wird beendet.
- OpenClaw gleicht verpasste Sprachstatusereignisse beim Start und in einem begrenzten Intervall ab. Der Abgleich prüft stichprobenartig konfigurierte Guilds und begrenzt REST-Abfragen pro Durchlauf, sodass sehr große `followUsers`-Listen möglicherweise mehr als ein Intervall benötigen, um sich vollständig anzugleichen.
- Wenn Discord oder ein Administrator den Bot verschiebt, während er einem Benutzer folgt, erstellt OpenClaw die Sprachsitzung neu und behält die Zuständigkeit der Folgefunktion bei, sofern das Ziel zulässig ist. Wenn der Bot aus `allowedChannels` heraus verschoben wird, verlässt OpenClaw den Kanal und tritt dem konfigurierten Ziel erneut bei, sofern eines vorhanden ist.
- Die DAVE-Empfangswiederherstellung kann denselben Kanal nach wiederholten Entschlüsselungsfehlern verlassen und ihm erneut beitreten. Durch die Folgefunktion verwaltete Sitzungen behalten ihre Folgefunktionszuständigkeit über diesen Wiederherstellungspfad hinweg bei, sodass eine spätere Verbindungstrennung des Benutzers, dem gefolgt wird, weiterhin dazu führt, dass der Kanal verlassen wird.

Wählen Sie zwischen den Beitrittsmodi:

- Verwenden Sie `followUsers` für persönliche oder betriebliche Konfigurationen, bei denen der Bot automatisch im Sprachkanal anwesend sein soll, wenn Sie es sind.
- Verwenden Sie `autoJoin` für Bots in festen Räumen, die auch dann anwesend sein sollen, wenn sich kein verfolgter Benutzer in einem Sprachkanal befindet.
- Verwenden Sie `/vc join` für einmalige Beitritte oder Räume, in denen eine automatische Sprachanwesenheit unerwartet wäre.

Discord-Sprachcodec:

- Sprach-Empfangsprotokolle zeigen `discord voice: opus decoder: libopus-wasm`.
- Die Echtzeitwiedergabe codiert rohes 48-kHz-Stereo-PCM mit demselben gebündelten Paket `libopus-wasm` in Opus, bevor die Pakete an `@discordjs/voice` übergeben werden.
- Die Wiedergabe aus Dateien und Provider-Streams transcodiert mit ffmpeg in rohes 48-kHz-Stereo-PCM und verwendet anschließend `libopus-wasm` für den an Discord gesendeten Opus-Paketstream.

STT-plus-TTS-Pipeline:

- Die Discord-PCM-Aufnahme wird in eine temporäre WAV-Datei konvertiert.
- `tools.media.audio` übernimmt STT, beispielsweise `openai/gpt-4o-mini-transcribe`.
- Das Transkript wird über den Discord-Eingang und das Routing weitergeleitet, während das Antwort-LLM mit einer Sprachausgabe-Richtlinie ausgeführt wird, die das Agenten-Tool `tts` ausblendet und die Rückgabe von Text verlangt, da Discord Voice die abschließende TTS-Wiedergabe übernimmt.
- Wenn `voice.model` festgelegt ist, überschreibt es nur das Antwort-LLM für diesen Sprachkanal-Durchlauf.
- `voice.tts` wird über `messages.tts` gelegt; Streaming-fähige Provider speisen den Player direkt, andernfalls wird die resultierende Audiodatei im beigetretenen Kanal abgespielt.

Beispiel für eine standardmäßige Agent-Proxy-Sprachkanalsitzung:

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

Ohne einen `voice.agentSession`-Block erhält jeder Sprachkanal eine eigene geroutete OpenClaw-Sitzung. Beispielsweise kommuniziert `/vc join channel:234567890123456789` mit der Sitzung dieses Discord-Sprachkanals. Das Echtzeitmodell dient nur als Sprach-Frontend; inhaltliche Anfragen werden an den konfigurierten OpenClaw-Agenten übergeben. Wenn das Echtzeitmodell ein abschließendes Transkript erzeugt, ohne das Konsultations-Tool aufzurufen, erzwingt OpenClaw die Konsultation als Rückfalloption, sodass sich die Standardeinstellung weiterhin wie ein Gespräch mit dem Agenten verhält.

Beispiel für herkömmliches STT plus TTS:

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

Sprache als Erweiterung einer vorhandenen Discord-Kanalsitzung:

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

Im Modus `agent-proxy` tritt der Bot dem konfigurierten Sprachkanal bei, die OpenClaw-Agentendurchläufe verwenden jedoch die normale geroutete Sitzung und den Agenten des Zielkanals. Die Echtzeit-Sprachsitzung gibt das zurückgegebene Ergebnis im Sprachkanal wieder. Der Supervisor-Agent kann gemäß seiner Tool-Richtlinie weiterhin normale Nachrichten-Tools verwenden, einschließlich des Sendens einer separaten Discord-Nachricht, wenn dies die richtige Aktion ist.

Während ein delegierter OpenClaw-Durchlauf aktiv ist, werden neue Discord-Sprachtranskripte als Live-Steuerung des Durchlaufs behandelt, bevor ein weiterer Agentendurchlauf gestartet wird. Ausdrücke wie „Status“, „brich das ab“, „verwende die kleinere Korrektur“ oder „wenn Sie fertig sind, prüfen Sie auch die Tests“ werden als Status-, Abbruch-, Steuerungs- oder Folgeeingabe für die aktive Sitzung klassifiziert. Status-, Abbruch-, akzeptierte Steuerungs- und Folgeergebnisse werden im Sprachkanal wiedergegeben, damit der Anrufer weiß, ob OpenClaw die Anfrage verarbeitet hat.

Nützliche Zielformate:

- `target: "channel:123456789012345678"` leitet über eine Discord-Textkanalsitzung weiter.
- `target: "123456789012345678"` wird als Kanalziel behandelt.
- `target: "dm:123456789012345678"` oder `target: "user:123456789012345678"` leitet über die entsprechende Direktnachrichtensitzung weiter.

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

Verwenden Sie dies, wenn das Modell seine eigene Discord-Wiedergabe über ein offenes Mikrofon hört, Sie es aber weiterhin durch Sprechen unterbrechen möchten. OpenClaw verhindert, dass OpenAI bei rohem Eingangsaudio automatisch unterbricht, während `bargeIn: true` dafür sorgt, dass Discord-Ereignisse beim Beginn eines Sprechers und Audio bereits aktiver Sprecher laufende Echtzeitantworten abbrechen, bevor der nächste erfasste Durchlauf OpenAI erreicht. Sehr frühe Unterbrechungssignale mit `audioEndMs` unter `minBargeInAudioEndMs` werden als wahrscheinliches Echo oder Rauschen behandelt und ignoriert, damit das Modell nicht beim ersten Wiedergabe-Frame abbricht.

Erwartete Sprachprotokolle:

- Beim Beitritt: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- Beim Echtzeitstart: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- Bei Sprecher-Audio: `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...` und `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- Bei übersprungener veralteter Spracheingabe: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` oder `reason=non-actionable-closing ...`
- Beim Abschluss einer Echtzeitantwort: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- Beim Stoppen oder Zurücksetzen der Wiedergabe: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- Bei einer Echtzeitkonsultation: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- Bei einer Agentenantwort: `discord voice: agent turn answer ...`
- Bei in die Warteschlange eingereihter exakter Sprachausgabe: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`, gefolgt von `discord voice: realtime exact speech dequeued reason=player-idle ...`
- Bei Erkennung einer Unterbrechung: `discord voice: realtime barge-in detected source=speaker-start ...` oder `discord voice: realtime barge-in detected source=active-speaker-audio ...`, gefolgt von `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- Bei einer Echtzeitunterbrechung: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`, gefolgt von entweder `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` oder `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- Bei ignoriertem Echo oder Rauschen: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- Bei deaktivierter Unterbrechung: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- Bei inaktiver Wiedergabe: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

Um abgeschnittenes Audio zu untersuchen, lesen Sie die Echtzeit-Sprachprotokolle als Zeitleiste:

1. `realtime audio playback started` bedeutet, dass Discord mit der Wiedergabe des Assistenten-Audios begonnen hat. Ab diesem Zeitpunkt zählt die Bridge die Ausgabeblöcke des Assistenten, die Discord-PCM-Bytes, die Echtzeit-Bytes des Providers und die Dauer des synthetisierten Audios.
2. `realtime speaker turn opened` kennzeichnet, dass ein Discord-Sprecher aktiv wird. Wenn die Wiedergabe bereits aktiv und `bargeIn` aktiviert ist, kann darauf `barge-in detected source=speaker-start` folgen.
3. `realtime input audio started` kennzeichnet den ersten tatsächlich empfangenen Audio-Frame dieses Sprecherdurchlaufs. `outputActive=true` oder ein von null abweichender Wert für `outputAudioMs` bedeutet hier, dass das Mikrofon Eingaben sendet, während die Wiedergabe des Assistenten noch aktiv ist.
4. `barge-in detected source=active-speaker-audio` bedeutet, dass OpenClaw Live-Audio eines Sprechers erkannt hat, während die Wiedergabe des Assistenten aktiv war. Dies hilft dabei, eine echte Unterbrechung von einem Discord-Ereignis beim Beginn eines Sprechers ohne verwertbares Audio zu unterscheiden.
5. `barge-in requested reason=...` bedeutet, dass OpenClaw den Echtzeit-Provider aufgefordert hat, die aktive Antwort abzubrechen oder zu kürzen. Die Meldung enthält `outputAudioMs`, `outputActive` und `playbackChunks`, sodass Sie erkennen können, wie viel Assistenten-Audio vor der Unterbrechung tatsächlich abgespielt wurde.
6. `realtime audio playback stopped reason=...` ist der lokale Zurücksetzungspunkt der Discord-Wiedergabe. Der Grund gibt an, wodurch die Wiedergabe gestoppt wurde: `barge-in`, `player-idle`, `provider-clear-audio`, `forced-agent-consult`, `stream-close` oder `session-close`.
7. `realtime speaker turn closed` fasst den erfassten Eingabedurchlauf zusammen. `chunks=0` oder `hasAudio=false` bedeutet, dass der Sprecherdurchlauf geöffnet wurde, aber kein verwertbares Audio die Echtzeit-Bridge erreicht hat. `interruptedPlayback=true` bedeutet, dass sich dieser Eingabedurchlauf mit der Assistentenausgabe überschnitten und die Unterbrechungslogik ausgelöst hat.

Nützliche Felder:

- `outputAudioMs`: vom Echtzeit-Provider vor der Protokollzeile erzeugte Dauer des Assistenten-Audios.
- `audioMs`: Dauer des Assistenten-Audios, die OpenClaw vor dem Stoppen der Wiedergabe gezählt hat.
- `elapsedMs`: verstrichene Echtzeit zwischen dem Öffnen und Schließen des Wiedergabestreams oder Sprecherdurchlaufs.
- `discordBytes`: an Discord Voice gesendete oder von dort empfangene 48-kHz-Stereo-PCM-Bytes.
- `realtimeBytes`: an den Echtzeit-Provider gesendete oder von dort empfangene PCM-Bytes im Provider-Format.
- `playbackChunks`: an Discord weitergeleitete Assistenten-Audioblöcke für die aktive Antwort.
- `sinceLastAudioMs`: Zeitspanne zwischen dem letzten erfassten Sprecher-Audio-Frame und dem Schließen des Sprecherdurchlaufs.

Häufige Muster:

- Ein sofortiger Abbruch mit `source=active-speaker-audio`, einem kleinen Wert für `outputAudioMs` und demselben Benutzer in der Nähe deutet normalerweise darauf hin, dass Lautsprecherecho in das Mikrofon gelangt. Erhöhen Sie `voice.realtime.minBargeInAudioEndMs`, verringern Sie die Lautsprecherlautstärke, verwenden Sie Kopfhörer oder legen Sie `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` fest.
- `source=speaker-start` gefolgt von `speaker turn closed ... hasAudio=false` bedeutet, dass Discord den Beginn eines Sprechers gemeldet hat, aber kein Audio OpenClaw erreicht hat. Ursache kann ein vorübergehendes Discord-Voice-Ereignis, das Verhalten eines Noise Gates oder die kurzzeitige Mikrofonaktivierung eines Clients sein.
- `audio playback stopped reason=stream-close` ohne eine zeitlich nahe Unterbrechung oder `provider-clear-audio` bedeutet, dass der lokale Discord-Wiedergabestream unerwartet beendet wurde. Prüfen Sie die vorhergehenden Provider- und Discord-Player-Protokolle.
- `capture ignored during playback (barge-in disabled)` bedeutet, dass OpenClaw Eingaben absichtlich verworfen hat, während das Assistenten-Audio aktiv war. Aktivieren Sie `voice.realtime.bargeIn`, wenn Sprache die Wiedergabe unterbrechen soll.
- `barge-in ignored ... outputActive=false` bedeutet, dass Discord oder die VAD des Providers Sprache gemeldet hat, OpenClaw jedoch keine aktive Wiedergabe zum Unterbrechen hatte. Dadurch sollte Audio nicht abgeschnitten werden.

Anmeldedaten werden komponentenweise aufgelöst: Authentifizierung der LLM-Route für `voice.model`, STT-Authentifizierung für `tools.media.audio`, TTS-Authentifizierung für `messages.tts`/`voice.tts` und Authentifizierung des Echtzeit-Providers über `voice.realtime.providers` oder die normale Authentifizierungskonfiguration des Providers.

### Sprachnachrichten

Discord-Sprachnachrichten zeigen eine Wellenformvorschau an und erfordern OGG-/Opus-Audio. OpenClaw erzeugt die Wellenform automatisch, benötigt jedoch `ffmpeg` und `ffprobe` auf dem Gateway-Host, um das Audio zu untersuchen und zu konvertieren.

- Geben Sie einen **lokalen Dateipfad** an (URLs werden abgelehnt).
- Lassen Sie Textinhalte weg (Discord lehnt Text und Sprachnachricht in derselben Nutzlast ab).
- Jedes Audioformat wird akzeptiert; OpenClaw konvertiert es bei Bedarf in OGG/Opus.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Nicht zulässige Intents verwendet oder der Bot sieht keine Guild-Nachrichten">

    - Message Content Intent aktivieren
    - Server Members Intent aktivieren, wenn Sie auf die Auflösung von Benutzern/Mitgliedern angewiesen sind
    - Gateway nach dem Ändern der Intents neu starten

  </Accordion>

  <Accordion title="Guild-Nachrichten werden unerwartet blockiert">

    - `groupPolicy` überprüfen
    - Guild-Zulassungsliste unter `channels.discord.guilds` überprüfen
    - wenn eine Guild-Zuordnung `channels` vorhanden ist, sind nur die aufgeführten Kanäle zulässig
    - Verhalten von `requireMention` und Erwähnungsmuster überprüfen

    Nützliche Prüfungen:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Erwähnung ist nicht erforderlich, dennoch erfolgt eine Blockierung">
    Häufige Ursachen:

    - `groupPolicy="allowlist"` ohne passende Guild-/Kanal-Zulassungsliste
    - `requireMention` ist an der falschen Stelle konfiguriert (muss unter `channels.discord.guilds` oder einem Kanaleintrag stehen)
    - Absender wird durch die Guild-/Kanal-Zulassungsliste `users` blockiert

  </Accordion>

  <Accordion title="Lang laufende Discord-Durchläufe oder doppelte Antworten">

    Typische Protokolleinträge:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Einstelloptionen für die Discord-Gateway-Warteschlange:

    - Einzelkonto: `channels.discord.eventQueue.listenerTimeout`
    - Mehrere Konten: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - dies steuert nur die Arbeit des Discord-Gateway-Listeners, nicht die Lebensdauer eines Agent-Durchlaufs

    Discord wendet kein kanaleigenes Zeitlimit auf Agent-Durchläufe in der Warteschlange an. Nachrichten-Listener übergeben die Verarbeitung sofort, und in die Warteschlange eingereihte Discord-Ausführungen behalten die Reihenfolge pro Sitzung bei, bis der Sitzungs-/Tool-/Runtime-Lebenszyklus abgeschlossen ist oder die Arbeit abbricht.

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

  <Accordion title="Zeitüberschreitungswarnungen beim Abrufen von Gateway-Metadaten">
    OpenClaw ruft vor dem Verbindungsaufbau die Discord-Metadaten von `/gateway/bot` ab. Bei vorübergehenden Fehlern wird auf die standardmäßige Gateway-URL von Discord zurückgegriffen, und die Protokollierung wird ratenbegrenzt.

    Einstelloptionen für das Metadaten-Zeitlimit:

    - Einzelkonto: `channels.discord.gatewayInfoTimeoutMs`
    - Mehrere Konten: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - Fallback über die Umgebungsvariable, wenn die Konfiguration nicht festgelegt ist: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - Standardwert: `30000` (30 Sekunden), Maximum: `120000`

  </Accordion>

  <Accordion title="Neustarts bei Zeitüberschreitung des Gateway-READY-Ereignisses">
    OpenClaw wartet während des Starts und nach erneuten Verbindungen der Runtime auf das Gateway-Ereignis `READY` von Discord. Konfigurationen mit mehreren Konten und gestaffeltem Start benötigen möglicherweise ein längeres READY-Zeitfenster beim Start als den Standardwert.

    Einstelloptionen für das READY-Zeitlimit:

    - Start mit Einzelkonto: `channels.discord.gatewayReadyTimeoutMs`
    - Start mit mehreren Konten: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - Fallback über die Umgebungsvariable beim Start, wenn die Konfiguration nicht festgelegt ist: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - Standardwert beim Start: `15000` (15 Sekunden), Maximum: `120000`
    - Runtime mit Einzelkonto: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - Runtime mit mehreren Konten: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - Fallback über die Umgebungsvariable für die Runtime, wenn die Konfiguration nicht festgelegt ist: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - Standardwert für die Runtime: `30000` (30 Sekunden), Maximum: `120000`

  </Accordion>

  <Accordion title="Abweichungen bei der Berechtigungsprüfung">
    Die Berechtigungsprüfungen von `channels status --probe` funktionieren nur für numerische Kanal-IDs.

    Wenn Sie Slug-Schlüssel verwenden, kann der Laufzeitabgleich weiterhin funktionieren, aber die Prüfung kann die Berechtigungen nicht vollständig verifizieren.

  </Accordion>

  <Accordion title="Probleme mit Direktnachrichten und Kopplung">

    - Direktnachrichten deaktiviert: `channels.discord.dm.enabled=false`
    - Direktnachrichtenrichtlinie deaktiviert: `channels.discord.dmPolicy="disabled"` (veraltet: `channels.discord.dm.policy`)
    - im Modus `pairing` wird auf die Genehmigung der Kopplung gewartet

  </Accordion>

  <Accordion title="Bot-zu-Bot-Schleifen">
    Standardmäßig werden von Bots verfasste Nachrichten ignoriert.

    Wenn Sie `channels.discord.allowBots=true` festlegen, verwenden Sie strikte Erwähnungs- und Positivlistenregeln, um Schleifen zu vermeiden.
    Bevorzugen Sie `channels.discord.allowBots="mentions"`, um nur Bot-Nachrichten zu akzeptieren, die den Bot erwähnen.

    OpenClaw enthält außerdem einen gemeinsamen [Schutz vor Bot-Schleifen](/de/channels/bot-loop-protection). Sobald `allowBots` von Bots verfasste Nachrichten bis zur Weiterleitung durchlässt, ordnet Discord das eingehende Ereignis den Fakten `(account, channel, bot pair)` zu, und die generische Paar-Schutzvorrichtung unterdrückt das Paar, nachdem es das konfigurierte Ereignisbudget überschritten hat. Die Schutzvorrichtung verhindert außer Kontrolle geratene Schleifen zwischen zwei Bots, die zuvor durch Discord-Ratenbegrenzungen gestoppt werden mussten; sie wirkt sich weder auf Bereitstellungen mit einem einzelnen Bot noch auf einmalige Bot-Antworten aus, die unter dem Budget bleiben.

    Standardeinstellungen (aktiv, wenn `allowBots` festgelegt ist):

    - `maxEventsPerWindow: 20` -- das Bot-Paar kann innerhalb des gleitenden Zeitfensters 20 Nachrichten austauschen
    - `windowSeconds: 60` -- Länge des gleitenden Zeitfensters
    - `cooldownSeconds: 60` -- sobald das Budget überschritten wird, wird jede weitere Bot-zu-Bot-Nachricht in beide Richtungen eine Minute lang verworfen

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
      // Felder und übernehmen hieraus nicht angegebene Felder.
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

  <Accordion title="Sprach-STT-Ausfälle mit DecryptionFailed(...)">

    - halten Sie OpenClaw aktuell (`openclaw update`), damit die Wiederherstellungslogik für den Discord-Sprachempfang vorhanden ist
    - bestätigen Sie `channels.discord.voice.daveEncryption=true` (Standard)
    - beginnen Sie mit `channels.discord.voice.decryptionFailureTolerance=24` (Upstream-Standard) und passen Sie den Wert nur bei Bedarf an
    - achten Sie in den Protokollen auf:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - wenn die Fehler nach dem automatischen erneuten Beitritt weiterhin auftreten, erfassen Sie die Protokolle und vergleichen Sie sie mit dem Upstream-Verlauf des DAVE-Empfangs in [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) und [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Konfigurationsreferenz

Primäre Referenz: [Konfigurationsreferenz – Discord](/de/gateway/config-channels#discord).

<Accordion title="Besonders relevante Discord-Felder">

- Start/Authentifizierung: `enabled`, `token`, `applicationId`, `accounts.*`, `allowBots`
- Richtlinie: `groupPolicy`, `dmPolicy`, `allowFrom`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- Befehl: `commands.native`, `commands.useAccessGroups` (global), `configWrites`, `slashCommand.ephemeral`
- Ereigniswarteschlange: `eventQueue.listenerTimeout` (Listener-Budget, Standard `120000`), `eventQueue.maxQueueSize` (Standard `10000`), `eventQueue.maxConcurrency` (Standard `50`)
- Gateway: `proxy`, `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- Antwort/Verlauf: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- Zustellung: `textChunkLimit` (Standard `2000`), `maxLinesPerMessage` (Standard `17`)
- Streaming: `streaming.mode`, `streaming.chunkMode`, `streaming.preview.*`, `streaming.progress.*`, `streaming.block.*` (veraltete flache Schlüssel `streamMode`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`, `chunkMode` werden durch `openclaw doctor --fix` nach `streaming.*` migriert)
- Medien/Wiederholungsversuche: `mediaMaxMb` (begrenzt ausgehende Discord-Uploads, Standard `100`), `retry`
- Aktionen: `actions.*`
- Präsenz: `activity`, `status`, `activityType`, `activityUrl`, `autoPresence.*`
- Benutzeroberfläche: `ui.components.accentColor`
- Funktionen: `threadBindings`, `bindings[]` auf oberster Ebene (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents.enabled`, `agentComponents.ttlMs`, `heartbeat`, `responsePrefix`

</Accordion>

## Sicherheit und Betrieb

- Behandeln Sie Bot-Tokens als Geheimnisse (`DISCORD_BOT_TOKEN` wird in überwachten Umgebungen bevorzugt).
- Gewähren Sie Discord-Berechtigungen nach dem Prinzip der geringsten Rechte.
- Wenn die Befehlsbereitstellung oder der Befehlsstatus veraltet ist, starten Sie den Gateway neu und prüfen Sie erneut mit `openclaw channels status --probe`.

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Kopplung" icon="link" href="/de/channels/pairing">
    Koppeln Sie einen Discord-Benutzer mit dem Gateway.
  </Card>
  <Card title="Gruppen" icon="users" href="/de/channels/groups">
    Gruppenchat- und Positivlistenverhalten.
  </Card>
  <Card title="Kanal-Routing" icon="route" href="/de/channels/channel-routing">
    Leiten Sie eingehende Nachrichten an Agenten weiter.
  </Card>
  <Card title="Sicherheit" icon="shield" href="/de/gateway/security">
    Bedrohungsmodell und Härtung.
  </Card>
  <Card title="Multi-Agent-Routing" icon="sitemap" href="/de/concepts/multi-agent">
    Ordnen Sie Server und Kanäle Agenten zu.
  </Card>
  <Card title="Slash-Befehle" icon="terminal" href="/de/tools/slash-commands">
    Verhalten nativer Befehle.
  </Card>
</CardGroup>
