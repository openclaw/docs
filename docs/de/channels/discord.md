---
read_when:
    - Arbeiten an Funktionen des Discord-Kanals
summary: Einrichtung des Discord-Bots, Konfigurationsschlüssel, Komponenten, Sprachfunktionen und Fehlerbehebung
title: Discord
x-i18n:
    generated_at: "2026-07-12T21:33:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6cb693cd1c772570cd09ca3ac3ad6278ac93e9641b25ed06e1496f98b75e8b1b
    source_path: channels/discord.md
    workflow: 16
---

OpenClaw verbindet sich über das offizielle Discord-Gateway als Bot mit Discord. DMs und Serverkanäle werden unterstützt.

<CardGroup cols={3}>
  <Card title="Kopplung" icon="link" href="/de/channels/pairing">
    Discord-DMs verwenden standardmäßig den Kopplungsmodus.
  </Card>
  <Card title="Slash-Befehle" icon="terminal" href="/de/tools/slash-commands">
    Natives Befehlsverhalten und Befehlskatalog.
  </Card>
  <Card title="Fehlerbehebung für Kanäle" icon="wrench" href="/de/channels/troubleshooting">
    Kanalübergreifende Diagnose und Fehlerbehebung.
  </Card>
</CardGroup>

## Schnelle Einrichtung

Erstellen Sie eine Discord-Anwendung mit einem Bot, fügen Sie den Bot Ihrem Server hinzu und koppeln Sie ihn mit OpenClaw. Verwenden Sie nach Möglichkeit einen privaten Server; [erstellen Sie bei Bedarf zuerst einen](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (**Create My Own > For me and my friends**).

<Steps>
  <Step title="Discord-Anwendung und Bot erstellen">
    Klicken Sie im [Discord Developer Portal](https://discord.com/developers/applications) auf **New Application** und geben Sie der Anwendung einen Namen (zum Beispiel „OpenClaw“).

    Öffnen Sie in der Seitenleiste **Bot** und setzen Sie **Username** auf den Namen Ihres Agenten.

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

  <Step title="Einladungs-URL generieren und den Bot Ihrem Server hinzufügen">
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

    1. **User Settings** (Zahnradsymbol) → **Developer** → **Developer Mode** aktivieren
       *(auf Mobilgeräten: **App Settings** → **Advanced**)*
    2. Klicken Sie mit der rechten Maustaste auf Ihr **Serversymbol** → **Copy Server ID**
    3. Klicken Sie mit der rechten Maustaste auf Ihren **eigenen Avatar** → **Copy User ID**

    Bewahren Sie die Server-ID und Benutzer-ID zusammen mit Ihrem Bot-Token auf; im nächsten Schritt benötigen Sie alle drei.

  </Step>

  <Step title="DMs von Servermitgliedern zulassen">
    Damit die Kopplung funktioniert, muss Discord dem Bot erlauben, Ihnen eine DM zu senden. Klicken Sie mit der rechten Maustaste auf Ihr **Serversymbol** → **Privacy Settings** → **Direct Messages** aktivieren.

    Lassen Sie dies aktiviert, wenn Sie Discord-DMs mit OpenClaw verwenden. Wenn Sie ausschließlich Serverkanäle verwenden, können Sie es nach der Kopplung deaktivieren.

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

    Wenn OpenClaw bereits als Hintergrunddienst ausgeführt wird, starten Sie ihn über die OpenClaw-Mac-App neu oder beenden und starten Sie den Prozess `openclaw gateway run` erneut.
    Führen Sie bei verwalteten Dienstinstallationen `openclaw gateway install` in einer Shell aus, in der `DISCORD_BOT_TOKEN` gesetzt ist, oder speichern Sie die Variable in `~/.openclaw/.env`, damit der Dienst die Umgebungs-SecretRef nach dem Neustart auflösen kann.
    Wenn Ihr Host durch Discords Anwendungsabfrage beim Start blockiert oder ratenbegrenzt wird, legen Sie die Anwendungs-/Client-ID aus dem Developer Portal fest, damit diese REST-Anfrage beim Start übersprungen werden kann: `channels.discord.applicationId` für das Standardkonto oder `channels.discord.accounts.<accountId>.applicationId` pro Bot.

  </Step>

  <Step title="OpenClaw konfigurieren und koppeln">

    <Tabs>
      <Tab title="Ihren Agenten fragen">
        Chatten Sie über einen bestehenden Kanal (zum Beispiel Telegram) mit Ihrem OpenClaw-Agenten und teilen Sie ihm Folgendes mit. Wenn Discord Ihr erster Kanal ist, verwenden Sie stattdessen die Registerkarte „CLI / Konfiguration“.

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

        Schreiben Sie für eine skriptgestützte oder entfernte Einrichtung denselben JSON5-Block mit `openclaw config patch --file ./discord.patch.json5 --dry-run` und führen Sie den Befehl danach erneut ohne `--dry-run` aus. `token`-Zeichenfolgen im Klartext funktionieren ebenfalls, und SecretRef-Werte werden für `channels.discord.token` über env-/file-/exec-Provider hinweg unterstützt. Weitere Informationen finden Sie unter [Geheimnisverwaltung](/de/gateway/secrets).

        Bewahren Sie bei mehreren Discord-Bots jedes Bot-Token und jede Anwendungs-ID unter dem jeweiligen Konto auf. Ein übergeordnetes `channels.discord.applicationId` wird von Konten geerbt; legen Sie es dort daher nur fest, wenn jedes Konto dieselbe Anwendungs-ID verwendet.

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
        Senden Sie den Kopplungscode über Ihren bestehenden Kanal an Ihren Agenten:

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
Wenn zwei aktivierte Discord-Konten dasselbe Bot-Token auflösen, startet OpenClaw nur einen Gateway-Monitor für dieses Token: Ein aus der Konfiguration stammendes Token hat Vorrang vor dem Umgebungs-Fallback; andernfalls gewinnt das erste aktivierte Konto, und das doppelte Konto wird mit dem Grund `duplicate bot token` als deaktiviert gemeldet.
Für erweiterte ausgehende Aufrufe (Nachrichten-Tool/Kanalaktionen) wird ein explizites `token` pro Aufruf für diesen Aufruf verwendet. Dies gilt für Sendeaktionen und Aktionen im Stil von Lesen/Prüfen (Lesen/Suchen/Abrufen/Thread/Pins/Berechtigungen). Kontorichtlinien und Wiederholungseinstellungen stammen weiterhin aus dem ausgewählten Konto im aktiven Laufzeit-Snapshot.
</Note>

## Empfohlen: Server-Arbeitsbereich einrichten

Sobald DMs funktionieren, können Sie Ihren Server in einen vollständigen Arbeitsbereich verwandeln, in dem jeder Kanal eine eigene Agentensitzung mit eigenem Kontext erhält. Dies wird für private Server empfohlen, auf denen sich nur Sie und Ihr Bot befinden.

<Steps>
  <Step title="Ihren Server zur Server-Zulassungsliste hinzufügen">
    Dadurch kann Ihr Agent in jedem Kanal Ihres Servers antworten, nicht nur in DMs.

    <Tabs>
      <Tab title="Ihren Agenten fragen">
        > „Fügen Sie meine Discord-Server-ID `<server_id>` zur Server-Zulassungsliste hinzu.“
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
    Standardmäßig antwortet der Agent in Serverkanälen nur, wenn er mit @ erwähnt wird. Auf einem privaten Server möchten Sie wahrscheinlich, dass er auf jede Nachricht antwortet.

    In Serverkanälen werden normale Antworten standardmäßig automatisch gepostet. Aktivieren Sie für gemeinsam genutzte, ständig aktive Räume `messages.groupChat.visibleReplies: "message_tool"`, damit der Agent passiv mitlesen und nur posten kann, wenn er eine Kanalantwort für sinnvoll hält. Dies funktioniert am besten mit Modellen der neuesten Generation, die Tools zuverlässig verwenden, beispielsweise GPT-5.6 Sol. Umgebungsereignisse des Raums bleiben still, sofern das Tool nichts sendet. Die vollständige Konfiguration für den passiven Modus finden Sie unter [Umgebungsereignisse in Räumen](/de/channels/ambient-room-events).

    Wenn Discord eine Tippanzeige anzeigt und die Protokolle Token-Nutzung ausweisen, aber keine Nachricht gepostet wird, prüfen Sie, ob der Durchlauf als Umgebungsereignis des Raums konfiguriert war oder sichtbare Antworten über das Nachrichten-Tool aktiviert wurden.

    <Tabs>
      <Tab title="Ihren Agenten fragen">
        > „Erlauben Sie meinem Agenten, auf diesem Server zu antworten, ohne mit @ erwähnt werden zu müssen.“
      </Tab>
      <Tab title="Konfiguration">
        Legen Sie in Ihrer Serverkonfiguration `requireMention: false` fest:

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

        Um das Senden über das Nachrichten-Tool für sichtbare Gruppen-/Kanalantworten vorzuschreiben, legen Sie `messages.groupChat.visibleReplies: "message_tool"` fest.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Speicherverwendung in Serverkanälen planen">
    Der Langzeitspeicher (MEMORY.md) wird nur in DM-Sitzungen automatisch geladen; Serverkanäle laden ihn nicht.

    <Tabs>
      <Tab title="Ihren Agenten fragen">
        > „Wenn ich in Discord-Kanälen Fragen stelle, verwenden Sie memory_search oder memory_get, falls Sie Langzeitkontext aus MEMORY.md benötigen.“
      </Tab>
      <Tab title="Manuell">
        Legen Sie für einen gemeinsamen Kontext in jedem Kanal dauerhafte Anweisungen in `AGENTS.md` oder `USER.md` ab (sie werden in jede Sitzung eingefügt). Bewahren Sie langfristige Notizen in `MEMORY.md` auf und greifen Sie bei Bedarf mit Speicher-Tools darauf zu.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Erstellen Sie nun Kanäle und beginnen Sie zu chatten. Der Agent sieht den Kanalnamen, und jeder Kanal ist eine isolierte Sitzung – richten Sie `#coding`, `#home`, `#research` oder beliebige andere Kanäle passend zu Ihrem Arbeitsablauf ein.

## Laufzeitmodell

- Das Gateway verwaltet die Discord-Verbindung.
- Die Antwortroute ist deterministisch: Eingehende Discord-Nachrichten werden an Discord zurückbeantwortet.
- Metadaten zu Discord-Servern und -Kanälen werden dem Modell-Prompt als nicht vertrauenswürdiger Kontext hinzugefügt, nicht als für Benutzer sichtbares Antwortpräfix. Wenn ein Modell diesen Umschlag zurückkopiert, entfernt OpenClaw die kopierten Metadaten aus ausgehenden Antworten und aus dem Kontext zukünftiger Wiederholungen.
- Standardmäßig (`session.dmScope=main`) verwenden direkte Chats gemeinsam die Hauptsitzung des Agenten (`agent:main:main`).
- Serverkanäle verwenden isolierte Sitzungsschlüssel (`agent:<agentId>:discord:channel:<channelId>`).
- Gruppen-DMs werden standardmäßig ignoriert (`channels.discord.dm.groupEnabled=false`).
- Native Slash-Befehle werden in isolierten Befehlssitzungen ausgeführt (`agent:<agentId>:discord:slash:<userId>`), wobei `CommandTargetSessionKey` weiterhin zur weitergeleiteten Konversationssitzung übertragen wird.
- Die reine Textankündigungszustellung von Cron/Heartbeat an Discord wird auf die endgültige, für den Assistenten sichtbare Antwort reduziert und einmal gesendet. Medien und strukturierte Komponenten-Nutzlasten bleiben aus mehreren Nachrichten bestehend, wenn der Agent mehrere zustellbare Nutzlasten ausgibt.

## Forumkanäle

Discord-Forum- und Medienkanäle akzeptieren nur Thread-Beiträge. OpenClaw unterstützt zwei Möglichkeiten, sie zu erstellen:

- Senden Sie eine Nachricht an das Forum-übergeordnete Element (`channel:<forumId>`), um automatisch einen Thread zu erstellen. Der Thread-Titel entspricht der ersten nicht leeren Zeile der Nachricht (gekürzt auf Discords Begrenzung von 100 Zeichen für Thread-Namen).
- Verwenden Sie `openclaw message thread create`, um direkt einen Thread zu erstellen. Übergeben Sie für Forum-Kanäle nicht `--message-id`.

Senden Sie eine Nachricht an das Forum-übergeordnete Element, um einen Thread zu erstellen:

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Thementitel\nText des Beitrags"
```

Erstellen Sie explizit einen Forum-Thread:

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Thementitel" --message "Text des Beitrags"
```

Forum-übergeordnete Elemente akzeptieren keine Discord-Komponenten. Wenn Sie Komponenten benötigen, senden Sie die Nachricht direkt an den Thread (`channel:<threadId>`).

## Interaktive Komponenten

OpenClaw unterstützt Container mit Discord-Komponenten v2 für Agentennachrichten. Verwenden Sie das Nachrichten-Tool mit einer `components`-Nutzlast. Interaktionsergebnisse werden als normale eingehende Nachrichten an den Agenten zurückgeleitet und folgen den vorhandenen Discord-Einstellungen für `replyToMode`.

Unterstützte Blöcke:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Aktionszeilen erlauben bis zu 5 Schaltflächen oder ein einzelnes Auswahlmenü
- Auswahltypen: `string`, `user`, `role`, `mentionable`, `channel`

Standardmäßig können Komponenten nur einmal verwendet werden. Legen Sie `components.reusable=true` fest, damit Schaltflächen, Auswahlmenüs und Formulare bis zu ihrem Ablauf mehrfach verwendet werden können.

Um einzuschränken, wer auf eine Schaltfläche klicken kann, legen Sie für diese Schaltfläche `allowedUsers` fest (Discord-Benutzer-IDs, Tags oder `*`). Nicht übereinstimmende Benutzer erhalten eine kurzlebige Ablehnung.

Komponenten-Callbacks laufen standardmäßig nach 30 Minuten ab. Legen Sie `channels.discord.agentComponents.ttlMs` fest, um die Lebensdauer der Callback-Registrierung für das Standardkonto zu ändern, oder verwenden Sie `channels.discord.accounts.<accountId>.agentComponents.ttlMs` für einzelne Konten. Der Wert wird in Millisekunden angegeben, muss eine positive Ganzzahl sein und ist auf `86400000` (24 Stunden) begrenzt. Längere TTLs eignen sich für Prüfungs-/Genehmigungsabläufe, bei denen Schaltflächen länger verwendbar bleiben müssen, verlängern jedoch den Zeitraum, in dem eine alte Discord-Nachricht weiterhin eine Aktion auslösen kann. Verwenden Sie möglichst die kürzeste passende TTL und behalten Sie den Standardwert bei, wenn veraltete Callbacks unerwartet wären.

Die Slash-Befehle `/model` und `/models` öffnen eine interaktive Modellauswahl mit Dropdown-Menüs für Provider, Modell und kompatible Laufzeit sowie einem Submit-Schritt. `/models add` ist veraltet und gibt eine Veraltungsmeldung zurück, anstatt Modelle aus dem Chat zu registrieren. Die Antwort der Auswahl ist kurzlebig und kann nur vom aufrufenden Benutzer verwendet werden. Discord-Auswahlmenüs sind auf 25 Optionen begrenzt. Fügen Sie daher `provider/*`-Einträge zu `agents.defaults.models` hinzu, wenn die Auswahl dynamisch erkannte Modelle nur für ausgewählte Provider wie `openai` oder `vllm` anzeigen soll.

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
  message: "Optionaler Ausweichtext",
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
  <Tab title="Direktnachrichtenrichtlinie">
    `channels.discord.dmPolicy` steuert den Zugriff auf Direktnachrichten. `channels.discord.allowFrom` ist die kanonische Zulassungsliste für Direktnachrichten.

    - `pairing` (Standard)
    - `allowlist` (erfordert mindestens einen `allowFrom`-Absender)
    - `open` (erfordert, dass `channels.discord.allowFrom` `"*"` enthält)
    - `disabled`

    Wenn die Direktnachrichtenrichtlinie nicht offen ist, werden unbekannte Benutzer blockiert (oder im Modus `pairing` zur Kopplung aufgefordert).

    Rangfolge bei mehreren Konten:

    - `channels.discord.accounts.default.allowFrom` gilt nur für das Konto `default`.
    - Bei einem Konto hat `allowFrom` Vorrang vor dem veralteten `dm.allowFrom`.
    - Benannte Konten übernehmen `channels.discord.allowFrom`, wenn weder ihr eigenes `allowFrom` noch das veraltete `dm.allowFrom` festgelegt ist.
    - Benannte Konten übernehmen nicht `channels.discord.accounts.default.allowFrom`.

    Die veralteten Einstellungen `channels.discord.dm.policy` und `channels.discord.dm.allowFrom` werden aus Kompatibilitätsgründen weiterhin gelesen. `openclaw doctor --fix` migriert sie zu `dmPolicy` und `allowFrom`, wenn dies ohne Änderung des Zugriffs möglich ist.

    Zielformat für die Zustellung von Direktnachrichten:

    - `user:<id>`
    - `<@id>`-Erwähnung

    Reine numerische IDs werden normalerweise als Kanal-IDs aufgelöst, wenn ein Kanalstandard aktiv ist. IDs, die jedoch im effektiven Direktnachrichten-`allowFrom` des Kontos aufgeführt sind, werden aus Kompatibilitätsgründen als Ziele für Benutzer-Direktnachrichten behandelt.

  </Tab>

  <Tab title="Zugriffsgruppen">
    Discord-Direktnachrichten und die Autorisierung von Textbefehlen können dynamische `accessGroup:<name>`-Einträge in `channels.discord.allowFrom` verwenden.

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

    Ein Discord-Textkanal besitzt keine separate Mitgliederliste. `type: "discord.channelAudience"` modelliert die Mitgliedschaft folgendermaßen: Der Absender der Direktnachricht ist Mitglied des konfigurierten Servers und verfügt nach Anwendung der Rollen- und Kanalüberschreibungen aktuell über die effektive Berechtigung `ViewChannel` für den konfigurierten Kanal.

    Beispiel: Erlauben Sie allen Personen, die `#maintainers` sehen können, dem Bot eine Direktnachricht zu senden, während Direktnachrichten für alle anderen gesperrt bleiben.

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

    Suchvorgänge schlagen sicher geschlossen fehl. Wenn Discord `Missing Access` zurückgibt, die Mitgliedersuche fehlschlägt oder der Kanal zu einem anderen Server gehört, wird der Absender der Direktnachricht als nicht autorisiert behandelt.

    Aktivieren Sie im Discord Developer Portal **Server Members Intent**, wenn Sie kanalzielgruppenbasierte Zugriffsgruppen verwenden. Direktnachrichten enthalten keinen Servermitgliedsstatus, daher löst OpenClaw das Mitglied zum Zeitpunkt der Autorisierung über Discord REST auf.

  </Tab>

  <Tab title="Serverrichtlinie">
    Die Serverbehandlung wird durch `channels.discord.groupPolicy` gesteuert:

    - `open`
    - `allowlist`
    - `disabled`

    Wenn `channels.discord` vorhanden ist, lautet die sichere Ausgangskonfiguration `allowlist`.

    Verhalten von `allowlist`:

    - Der Server muss mit `channels.discord.guilds` übereinstimmen (`id` bevorzugt, Slug akzeptiert)
    - optionale Absender-Zulassungslisten: `users` (stabile IDs empfohlen) und `roles` (nur Rollen-IDs); wenn eine davon konfiguriert ist, werden Absender zugelassen, wenn sie mit `users` ODER `roles` übereinstimmen
    - der direkte Abgleich von Namen/Tags ist standardmäßig deaktiviert; aktivieren Sie `channels.discord.dangerouslyAllowNameMatching: true` nur als Notfall-Kompatibilitätsmodus
    - Namen/Tags werden für `users` unterstützt, IDs sind jedoch sicherer; `openclaw security audit` warnt, wenn Namens-/Tag-Einträge verwendet werden
    - wenn für einen Server `channels` konfiguriert ist, werden nicht aufgeführte Kanäle abgelehnt
    - wenn ein Server keinen `channels`-Block besitzt, sind alle Kanäle dieses zugelassenen Servers erlaubt

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

    Der veraltete kanalbezogene Schlüssel `allow` wird durch `openclaw doctor --fix` zu `enabled` migriert.

    Wenn Sie nur `DISCORD_BOT_TOKEN` festlegen und keinen `channels.discord`-Block erstellen, lautet der Laufzeit-Ausweichwert `groupPolicy="allowlist"` (mit einer Warnung in den Protokollen), selbst wenn `channels.defaults.groupPolicy` auf `open` gesetzt ist.

  </Tab>

  <Tab title="Erwähnungen und Gruppen-Direktnachrichten">
    Servernachrichten erfordern standardmäßig eine Erwähnung.

    Die Erkennung von Erwähnungen umfasst:

    - explizite Bot-Erwähnung
    - konfigurierte Erwähnungsmuster (`agents.list[].groupChat.mentionPatterns`, Ausweichwert `messages.groupChat.mentionPatterns`)
    - implizites Antwort-an-den-Bot-Verhalten in unterstützten Fällen

    Verwenden Sie beim Verfassen ausgehender Discord-Nachrichten die kanonische Erwähnungssyntax: `<@USER_ID>` für Benutzer, `<#CHANNEL_ID>` für Kanäle und `<@&ROLE_ID>` für Rollen. Verwenden Sie nicht die veraltete Spitznamen-Erwähnungsform `<@!USER_ID>`.

    `requireMention` wird pro Server/Kanal konfiguriert (`channels.discord.guilds...`).
    `ignoreOtherMentions` verwirft optional Nachrichten, die einen anderen Benutzer/eine andere Rolle erwähnen, aber nicht den Bot (ausgenommen @everyone/@here).

    Gruppen-Direktnachrichten:

    - Standard: ignoriert (`dm.groupEnabled=false`)
    - optionale Zulassungsliste über `dm.groupChannels` (Kanal-IDs oder Slugs)

  </Tab>
</Tabs>

### Rollenbasiertes Agenten-Routing

Verwenden Sie `bindings[].match.roles`, um Discord-Servermitglieder anhand ihrer Rollen-ID an unterschiedliche Agenten weiterzuleiten. Rollenbasierte Bindungen akzeptieren ausschließlich Rollen-IDs und werden nach Peer- oder Parent-Peer-Bindungen sowie vor reinen Serverbindungen ausgewertet. Wenn eine Bindung außerdem andere Abgleichsfelder festlegt (beispielsweise `peer` + `guildId` + `roles`), müssen alle konfigurierten Felder übereinstimmen.

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
  - `commands.native=false` überspringt beim Start die Registrierung und Bereinigung von Discord-Slash-Befehlen. Zuvor registrierte Befehle bleiben möglicherweise in Discord sichtbar, bis Sie sie aus der Discord-App entfernen.
  - Die Authentifizierung nativer Befehle verwendet dieselben Discord-Zulassungslisten und -Richtlinien wie die normale Nachrichtenverarbeitung.
  - Befehle können in der Discord-Benutzeroberfläche weiterhin für nicht autorisierte Benutzer sichtbar sein; bei der Ausführung wird die OpenClaw-Authentifizierung durchgesetzt und mit „nicht autorisiert“ geantwortet.
  - Standardeinstellungen für Slash-Befehle: `ephemeral: true` (`channels.discord.slashCommand.ephemeral`).

  Den Befehlskatalog und das Verhalten finden Sie unter [Slash-Befehle](/de/tools/slash-commands).

  ## Funktionsdetails

  <AccordionGroup>
  <Accordion title="Antwort-Tags und native Antworten">
    Discord unterstützt Antwort-Tags in der Agentenausgabe:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Gesteuert durch `channels.discord.replyToMode`:

    - `off` (Standard): keine implizite Verknüpfung von Antworten; explizite `[[reply_to_*]]`-Tags werden weiterhin berücksichtigt
    - `first`: fügt die implizite native Antwortreferenz an die erste ausgehende Discord-Nachricht des Durchlaufs an
    - `all`: fügt sie an jede ausgehende Nachricht an
    - `batched`: fügt sie nur an, wenn das eingehende Ereignis ein entprellter Stapel mehrerer Nachrichten war – nützlich, wenn Sie native Antworten hauptsächlich für mehrdeutige, stoßweise Chats verwenden möchten und nicht für jeden Durchlauf mit nur einer Nachricht

    Nachrichten-IDs werden im Kontext und Verlauf bereitgestellt, sodass Agenten bestimmte Nachrichten gezielt adressieren können.

  </Accordion>

  <Accordion title="Linkvorschauen">
    Discord erzeugt standardmäßig Rich-Link-Einbettungen für URLs. OpenClaw unterdrückt diese erzeugten Einbettungen standardmäßig bei ausgehenden Discord-Nachrichten, sodass von Agenten gesendete URLs einfache Links bleiben, sofern Sie dies nicht ausdrücklich aktivieren:

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    Legen Sie `channels.discord.accounts.<id>.suppressEmbeds` fest, um die Einstellung für ein Konto zu überschreiben. Über das Nachrichten-Tool des Agenten gesendete Nachrichten können außerdem `suppressEmbeds: false` für eine einzelne Nachricht übergeben. Explizite Discord-`embeds`-Payloads werden durch die standardmäßige Einstellung für Linkvorschauen nicht unterdrückt.

  </Accordion>

  <Accordion title="Live-Stream-Vorschau">
    OpenClaw kann Antwortentwürfe streamen, indem es eine temporäre Nachricht sendet und diese beim Eintreffen von Text bearbeitet. `channels.discord.streaming.mode` akzeptiert `off` | `partial` | `block` | `progress` (Standardwert, wenn weder der Schlüssel `streaming` noch der veraltete Schlüssel `streamMode` festgelegt ist). `streamMode` ist ein veralteter Alias; führen Sie `openclaw doctor --fix` aus, um die gespeicherte Konfiguration in die kanonische verschachtelte `streaming`-Struktur umzuschreiben.

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
    - `partial` bearbeitet eine einzelne Vorschaunachricht, während Token eintreffen.
    - `block` gibt entwurfsgroße Abschnitte aus; Größe und Umbruchpunkte können Sie mit `streaming.preview.chunk` (`minChars`, `maxChars`, `breakPreference`) anpassen, begrenzt auf `textChunkLimit`. Wenn Block-Streaming ausdrücklich aktiviert ist, überspringt OpenClaw den Vorschau-Stream, um doppeltes Streaming zu vermeiden.
    - `progress` behält einen bearbeitbaren Statusentwurf bei und aktualisiert ihn bis zur endgültigen Zustellung mit dem Fortschritt der Tools. Unverarbeiteter Tool-Fortschritt verwendet die gemeinsame Startbeschriftung als fortlaufende Zeile; ein erläuterter Status zeigt nur die Erläuterung an, sofern nicht ausdrücklich eine Beschriftung konfiguriert ist.
    - Medien, Fehler und endgültige explizite Antworten brechen ausstehende Vorschaubearbeitungen ab.
    - `streaming.preview.toolProgress` (Standardwert `true`) steuert, ob Tool-/Fortschrittsaktualisierungen die Vorschaunachricht wiederverwenden.
    - Tool-/Fortschrittszeilen werden, sofern verfügbar, kompakt als Emoji + Titel + Detail dargestellt, zum Beispiel `🛠️ Bash: run tests` oder `🔎 Web Search: for "query"`.
    - `streaming.progress.commentary` (Standardwert `false`) aktiviert Kommentar-/Präambeltext des Assistenten im temporären Fortschrittsentwurf. Kommentare werden vor der Anzeige bereinigt, bleiben vorübergehend und ändern die Zustellung der endgültigen Antwort nicht.
    - `streaming.progress.maxLineChars` steuert das Budget pro Zeile für die Fortschrittsvorschau. Fließtext wird an Wortgrenzen gekürzt; bei Befehls- und Pfadangaben bleiben nützliche Suffixe erhalten.
    - `streaming.preview.commandText` / `streaming.progress.commandText` steuert Befehls-/Ausführungsdetails in kompakten Fortschrittszeilen: `raw` (Standardwert) oder `status` (nur die Tool-Beschriftung).

    Unformatierten Befehls-/Ausführungstext ausblenden und gleichzeitig kompakte Fortschrittszeilen beibehalten:

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
    - Fallback: `messages.groupChat.historyLimit`
    - `0` deaktiviert die Funktion

    Steuerung des Direktnachrichtenverlaufs:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Thread-Verhalten:

    - Discord-Threads werden als Kanalsitzungen weitergeleitet und übernehmen die Konfiguration des übergeordneten Kanals, sofern sie nicht überschrieben wird.
    - Thread-Sitzungen übernehmen die Auswahl von `/model` auf Sitzungsebene des übergeordneten Kanals ausschließlich als Modell-Fallback; Thread-lokale `/model`-Auswahlen haben Vorrang, und der Transkriptverlauf des übergeordneten Kanals wird nur kopiert, wenn die Transkriptvererbung aktiviert ist.
    - Mit `channels.discord.thread.inheritParent` (Standardwert `false`) werden neue automatische Threads mit dem Transkript des übergeordneten Kanals initialisiert. Kontospezifische Überschreibung: `channels.discord.accounts.<id>.thread.inheritParent`.
    - Reaktionen des Nachrichten-Tools können Direktnachrichtenziele im Format `user:<id>` auflösen.
    - `guilds.<guild>.channels.<channel>.requireMention: false` bleibt beim Aktivierungs-Fallback in der Antwortphase erhalten.

    Kanalthemen werden als **nicht vertrauenswürdiger** Kontext eingefügt. Positivlisten beschränken, wer den Agenten auslösen kann, bilden jedoch keine vollständige Schwärzungsgrenze für ergänzenden Kontext.

  </Accordion>

  <Accordion title="Threadgebundene Sitzungen für Subagenten">
    Discord kann einen Thread an ein Sitzungsziel binden, sodass nachfolgende Nachrichten in diesem Thread weiterhin an dieselbe Sitzung weitergeleitet werden (einschließlich Subagentensitzungen).

    Befehle:

    - `/focus <target>` bindet den aktuellen/neuen Thread an das Ziel eines Subagenten/einer Sitzung
    - `/unfocus` entfernt die Bindung des aktuellen Threads
    - `/agents` zeigt aktive Ausführungen und den Bindungsstatus an
    - `/session idle <duration|off>` prüft/aktualisiert die automatische Aufhebung fokussierter Bindungen bei Inaktivität
    - `/session max-age <duration|off>` prüft/aktualisiert das feste Höchstalter fokussierter Bindungen

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
    - `spawnSessions` steuert das automatische Erstellen und Binden von Threads für `sessions_spawn({ thread: true })` und ACP-Thread-Spawns. Standard: `true`.
    - `defaultSpawnContext` steuert den nativen Subagent-Kontext für Thread-gebundene Spawns. Standard: `"fork"`.
    - Veraltete Schlüssel `spawnSubagentSessions`/`spawnAcpSessions` werden durch `openclaw doctor --fix` migriert.
    - Wenn Thread-Bindungen für ein Konto deaktiviert sind, sind `/focus` und zugehörige Thread-Bindungsvorgänge nicht verfügbar.

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

    Weitere Informationen zum Bindungsverhalten finden Sie unter [ACP-Agenten](/de/tools/acp-agents).

  </Accordion>

  <Accordion title="Reaktionsbenachrichtigungen">
    Modus für Reaktionsbenachrichtigungen pro Server (`guilds.<id>.reactionNotifications`):

    - `off`
    - `own` (Standard)
    - `all`
    - `allowlist` (verwendet `guilds.<id>.users`)

    Reaktionsereignisse werden in Systemereignisse umgewandelt und der weitergeleiteten Discord-Sitzung zugeordnet.

  </Accordion>

  <Accordion title="Bestätigungsreaktionen">
    `ackReaction` sendet ein Bestätigungs-Emoji, während OpenClaw eine eingehende Nachricht verarbeitet.

    Auflösungsreihenfolge:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - Ersatzweise das Emoji der Agentenidentität (`agents.list[].identity.emoji`, andernfalls „👀“)

    Hinweise:

    - Discord akzeptiert Unicode-Emojis oder Namen benutzerdefinierter Emojis.
    - Verwenden Sie `""`, um die Reaktion für einen Kanal oder ein Konto zu deaktivieren.

    **Geltungsbereich (`messages.ackReactionScope`):**

    Werte: `"all"` (Direktnachrichten + Gruppen, einschließlich umgebender Raumereignisse), `"direct"` (nur Direktnachrichten), `"group-all"` (jede Gruppennachricht außer umgebenden Raumereignissen, keine Direktnachrichten), `"group-mentions"` (Gruppen, wenn der Bot erwähnt wird; **keine Direktnachrichten**, Standard), `"off"` / `"none"` (deaktiviert).

    <Note>
    Im standardmäßigen Geltungsbereich (`"group-mentions"`) werden bei Direktnachrichten oder umgebenden Raumereignissen keine Bestätigungsreaktionen ausgelöst. Um bei eingehenden Discord-Direktnachrichten und stillen Raumereignissen eine Bestätigungsreaktion zu erhalten, setzen Sie `messages.ackReactionScope` auf `"all"`.
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
    Leiten Sie den Discord-Gateway-WebSocket-Datenverkehr und REST-Abfragen beim Start (Anwendungs-ID + Auflösung der Zulassungsliste) mit `channels.discord.proxy` über einen HTTP(S)-Proxy.
    Das Proxying von Discord-Gateway-WebSockets muss explizit konfiguriert werden; WebSocket-Verbindungen übernehmen keine umgebenden Proxy-Umgebungsvariablen aus dem Gateway-Prozess. REST-Abfragen beim Start verwenden diesen Proxy, wenn `channels.discord.proxy` konfiguriert ist.

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
    - Suchvorgänge fragen die PluralKit-API mit der ursprünglichen Nachrichten-ID ab
    - wenn die Suche fehlschlägt, werden weitergeleitete Nachrichten als Bot-Nachrichten behandelt und verworfen, sofern `allowBots` sie nicht zulässt

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
      activity: "Focus time",
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
      activity: "Live coding",
      activityType: 1,
      activityUrl: "https://twitch.tv/openclaw",
    },
  },
}
```

    Zuordnung der Aktivitätstypen:

    - 0: Spielt
    - 1: Streamt (erfordert `activityUrl`; `activityUrl` erfordert wiederum `activityType: 1`)
    - 2: Hört zu
    - 3: Sieht zu
    - 4: Benutzerdefiniert (verwendet den Aktivitätstext als Statuszustand; Emoji ist optional)
    - 5: Nimmt an einem Wettbewerb teil

    Automatische Präsenz (Laufzeit-Integritätssignal):

```json5
{
  channels: {
    discord: {
      autoPresence: {
        enabled: true,
        intervalMs: 30000,
        minUpdateIntervalMs: 15000,
        exhaustedText: "Token ausgeschöpft",
      },
    },
  },
}
```

    Die automatische Präsenz ordnet die Laufzeitverfügbarkeit dem Discord-Status zu: fehlerfrei => online, beeinträchtigt oder unbekannt => idle, ausgeschöpft oder nicht verfügbar => dnd. Standardwerte: `intervalMs` 30000, `minUpdateIntervalMs` 15000 (muss kleiner oder gleich `intervalMs` sein). Optionale Textüberschreibungen:

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

    Discord aktiviert native Ausführungsgenehmigungen automatisch, wenn `enabled` nicht festgelegt oder auf `"auto"` gesetzt ist und mindestens ein Genehmigender aufgelöst werden kann, entweder aus `execApprovals.approvers` oder aus `commands.ownerAllowFrom`. Discord leitet Genehmigende für Ausführungen nicht aus dem Kanalwert `allowFrom`, dem veralteten `dm.allowFrom` oder dem Direktnachrichtenwert `defaultTo` ab. Legen Sie `enabled: false` fest, um Discord ausdrücklich als nativen Genehmigungsclient zu deaktivieren.

    Bei sensiblen, ausschließlich für Eigentümer vorgesehenen Gruppenbefehlen wie `/diagnostics` und `/export-trajectory` sendet OpenClaw Genehmigungsaufforderungen und Endergebnisse privat. Zunächst wird eine Discord-Direktnachricht versucht, wenn für den aufrufenden Eigentümer eine Discord-Eigentümerroute vorhanden ist; andernfalls greift OpenClaw auf die erste verfügbare Eigentümerroute aus `commands.ownerAllowFrom` zurück, beispielsweise Telegram.

    Wenn `target` auf `channel` oder `both` gesetzt ist, ist die Genehmigungsaufforderung im Kanal sichtbar. Nur aufgelöste Genehmigende können die Schaltflächen verwenden; andere Benutzer erhalten eine nur für sie sichtbare Ablehnung. Genehmigungsaufforderungen enthalten den Befehlstext. Aktivieren Sie daher die Kanalzustellung nur in vertrauenswürdigen Kanälen. Wenn die Kanal-ID nicht aus dem Sitzungsschlüssel abgeleitet werden kann, greift OpenClaw auf die Zustellung per Direktnachricht zurück.

    Discord rendert die gemeinsam genutzten Genehmigungsschaltflächen, die auch von anderen Chatkanälen verwendet werden; der native Discord-Adapter ergänzt hauptsächlich das Routing von Direktnachrichten an Genehmigende und die Verteilung auf Kanäle. Wenn diese Schaltflächen vorhanden sind, bilden sie die primäre Benutzeroberfläche für Genehmigungen; OpenClaw sollte einen manuellen `/approve`-Befehl nur einfügen, wenn das Werkzeugergebnis angibt, dass Chatgenehmigungen nicht verfügbar sind oder die manuelle Genehmigung der einzige Weg ist. Wenn die native Discord-Genehmigungslaufzeit nicht aktiv ist, lässt OpenClaw die lokale deterministische Aufforderung `/approve <id> <decision>` sichtbar. Wenn die Laufzeit aktiv ist, aber keine native Karte an ein Ziel zugestellt werden kann, sendet OpenClaw im selben Chat einen Ausweichhinweis mit dem exakten `/approve`-Befehl aus der ausstehenden Genehmigung.

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

OpenClaw verwendet Discord Components v2 für Ausführungsgenehmigungen und kontextübergreifende Markierungen. Discord-Nachrichtenaktionen können außerdem `components` für benutzerdefinierte Oberflächen akzeptieren (fortgeschritten; erfordert die Erstellung einer Komponenten-Nutzlast über das Discord-Werkzeug), während veraltete `embeds` weiterhin verfügbar sind, jedoch nicht empfohlen werden.

- `channels.discord.ui.components.accentColor` legt die Akzentfarbe fest, die von Discord-Komponentencontainern verwendet wird (Hexadezimalwert). Pro Konto: `channels.discord.accounts.<id>.ui.components.accentColor`.
- `channels.discord.agentComponents.ttlMs` steuert, wie lange Callbacks gesendeter Discord-Komponenten registriert bleiben (Standardwert `1800000`, Maximum `86400000`). Pro Konto: `channels.discord.accounts.<id>.agentComponents.ttlMs`.
- `embeds` werden ignoriert, wenn Components v2 vorhanden sind.
- Einfache URL-Vorschauen werden standardmäßig unterdrückt. Legen Sie bei einer Nachrichtenaktion `suppressEmbeds: false` fest, wenn ein einzelner ausgehender Link erweitert werden soll.

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

Discord verfügt über zwei unterschiedliche Sprachoberflächen: Echtzeit-**Sprachkanäle** (kontinuierliche Gespräche) und **Sprachnachrichtenanhänge** (das Format mit Wellenformvorschau). Das Gateway unterstützt beide.

### Sprachkanäle

Einrichtungscheckliste:

1. Aktivieren Sie Message Content Intent im Discord Developer Portal.
2. Aktivieren Sie Server Members Intent, wenn rollen- oder benutzerbasierte Zulassungslisten verwendet werden.
3. Laden Sie den Bot mit den Geltungsbereichen `bot` und `applications.commands` ein.
4. Gewähren Sie Connect, Speak, Send Messages und Read Message History im Zielsprachkanal.
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

- Discord-Sprachfunktion ist bei reinen Textkonfigurationen optional; setzen Sie `channels.discord.voice.enabled=true` (oder behalten Sie einen vorhandenen `channels.discord.voice`-Block bei), um `/vc`-Befehle, die Sprachlaufzeit und den Gateway-Intent `GuildVoiceStates` zu aktivieren. `channels.discord.intents.voiceStates` kann das Intent-Abonnement ausdrücklich überschreiben; lassen Sie die Option nicht gesetzt, damit sie der effektiven Aktivierung der Sprachfunktion folgt.
- `voice.mode` steuert den Gesprächspfad. Der Standardwert ist `agent-proxy`: Ein Echtzeit-Sprach-Frontend übernimmt die zeitliche Steuerung der Gesprächsbeiträge, Unterbrechungen und Wiedergabe, delegiert inhaltliche Aufgaben über `openclaw_agent_consult` an den weitergeleiteten OpenClaw-Agenten und behandelt das Ergebnis wie eine von dieser sprechenden Person eingegebene Discord-Eingabeaufforderung. `stt-tts` behält den älteren Batch-Ablauf mit STT und anschließendem TTS bei. Mit `bidi` kann das Echtzeitmodell direkt kommunizieren, während `openclaw_agent_consult` für das OpenClaw-Gehirn bereitgestellt wird.
- `voice.agentSession` steuert, welche OpenClaw-Unterhaltung Sprachbeiträge empfängt. Lassen Sie die Option für die eigene Sitzung des Sprachkanals nicht gesetzt, oder setzen Sie `{ mode: "target", target: "channel:<text-channel-id>" }`, damit der Sprachkanal als Mikrofon-/Lautsprechererweiterung einer vorhandenen Discord-Textkanalsitzung wie `#maintainers` fungiert.
- `voice.model` überschreibt das OpenClaw-Agentengehirn für Discord-Sprachantworten und Echtzeit-Konsultationen. Lassen Sie die Option nicht gesetzt, um das Modell des weitergeleiteten Agenten zu übernehmen. Sie ist von `voice.realtime.model` getrennt.
- Mit `voice.followUsers` kann der Bot ausgewählten Benutzern in Discord-Sprachkanäle folgen, zwischen ihnen wechseln und sie verlassen. Siehe [Benutzern in Sprachkanälen folgen](#follow-users-in-voice).
- `agent-proxy` leitet Sprache über `discord-voice`, wodurch die normale Besitzer-/Tool-Autorisierung für die sprechende Person und die Zielsitzung erhalten bleibt, das Agenten-Tool `tts` jedoch ausgeblendet wird, da Discord-Sprachfunktion die Wiedergabe übernimmt. Standardmäßig gewährt `agent-proxy` der Konsultation für als Besitzer erkannte Sprecher vollständigen, besitzergleichen Tool-Zugriff (`voice.realtime.toolPolicy: "owner"`) und zieht die Konsultation des OpenClaw-Agenten vor inhaltlichen Antworten deutlich vor (`voice.realtime.consultPolicy: "always"`). In diesem standardmäßigen `always`-Modus spricht die Echtzeitebene vor der Konsultationsantwort nicht automatisch Fülltext; sie erfasst und transkribiert Sprache und gibt anschließend die weitergeleitete OpenClaw-Antwort wieder. Wenn mehrere erzwungene Konsultationsantworten abgeschlossen werden, während Discord noch die erste Antwort wiedergibt, werden spätere Antworten mit exakter Sprachwiedergabe in eine Warteschlange gestellt, bis die Wiedergabe inaktiv ist, statt die Sprache mitten im Satz zu ersetzen.
- Im Modus `stt-tts` verwendet STT `tools.media.audio`; `voice.model` wirkt sich nicht auf die Transkription aus.
- In Echtzeitmodi konfigurieren `voice.realtime.provider`, `voice.realtime.model` und `voice.realtime.speakerVoice` die Echtzeit-Audiositzung. Verwenden Sie für OpenAI Realtime 2.1 mit dem Codex-Gehirn `voice.realtime.model: "gpt-realtime-2.1"` und `voice.model: "openai/gpt-5.6-sol"`.
- Echtzeit-Sprachmodi beziehen standardmäßig die kleinen Profildateien `IDENTITY.md`, `USER.md` und `SOUL.md` in die Anweisungen für den Echtzeit-Provider ein, damit schnelle direkte Gesprächsbeiträge dieselbe Identität, Benutzerverankerung und Persona wie der weitergeleitete OpenClaw-Agent beibehalten. Setzen Sie `voice.realtime.bootstrapContextFiles` auf eine Teilmenge, um dies anzupassen, oder auf `[]`, um es zu deaktivieren. Es werden nur diese Profildateien unterstützt; `AGENTS.md` verbleibt im normalen Agentenkontext. Der eingefügte Profilkontext ersetzt `openclaw_agent_consult` nicht für Arbeitsbereichsaufgaben, aktuelle Fakten, Speicherabfragen oder toolgestützte Aktionen.
- Setzen Sie im OpenAI-Echtzeitmodus `agent-proxy` `voice.realtime.requireWakeName: true`, damit die Discord-Echtzeit-Sprachfunktion stumm bleibt, bis ein Transkript mit einem Aktivierungsnamen beginnt oder endet. Konfigurierte Aktivierungsnamen müssen aus einem oder zwei Wörtern bestehen. Wenn `voice.realtime.wakeNames` nicht gesetzt ist, verwendet OpenClaw den `name` des weitergeleiteten Agenten zusammen mit `OpenClaw` und greift andernfalls auf die Agenten-ID zusammen mit `OpenClaw` zurück. Die Aktivierungsnamen-Steuerung deaktiviert die automatische Antwort des Echtzeit-Providers, leitet akzeptierte Gesprächsbeiträge über den Konsultationspfad des OpenClaw-Agenten und gibt eine kurze gesprochene Bestätigung aus, wenn anhand einer Teiltranskription ein vorangestellter Aktivierungsname erkannt wird, bevor das endgültige Transkript eintrifft.
- Der OpenAI-Echtzeit-Provider akzeptiert aktuelle Realtime-2-Ereignisnamen und ältere Codex-kompatible Aliasse für Audioausgabe- und Transkriptereignisse, sodass kompatible Provider-Snapshots abweichen können, ohne dass Assistentenaudio verworfen wird.
- `voice.realtime.bargeIn` steuert, ob Discord-Ereignisse zum Sprechbeginn die aktive Echtzeitwiedergabe unterbrechen. Wenn die Option nicht gesetzt ist, folgt sie der Einstellung des Echtzeit-Providers zur Unterbrechung durch Eingangsaudio.
- `voice.realtime.minBargeInAudioEndMs` steuert die Mindestdauer der Assistentenwiedergabe, bevor eine Echtzeitunterbrechung bei OpenAI das Audio abschneidet. Standard: `250`. Setzen Sie den Wert in Räumen mit geringem Echo für eine sofortige Unterbrechung auf `0`, oder erhöhen Sie ihn für Lautsprecherkonfigurationen mit starkem Echo.
- `voice.tts` überschreibt `messages.tts` nur für die Sprachwiedergabe mit `stt-tts`; Echtzeitmodi verwenden stattdessen `voice.realtime.speakerVoice`. Setzen Sie für eine OpenAI-Stimme bei der Discord-Wiedergabe `voice.tts.provider: "openai"` und wählen Sie unter `voice.tts.providers.openai.speakerVoice` eine Text-to-Speech-Stimme aus. `cedar` ist beim aktuellen OpenAI-TTS-Modell eine gute männlich klingende Wahl.
- Kanalbezogene Discord-Überschreibungen von `systemPrompt` gelten für Sprachtranskript-Beiträge dieses Sprachkanals.
- Sprachtranskript-Beiträge leiten den Besitzerstatus aus Discord-`allowFrom` (oder `dm.allowFrom`) für besitzergeschützte Befehle und Kanalaktionen ab. Die Sichtbarkeit von Agenten-Tools folgt der konfigurierten Tool-Richtlinie für die weitergeleitete Sitzung.
- Wenn `voice.autoJoin` mehrere Einträge für denselben Server enthält, tritt OpenClaw dem zuletzt für diesen Server konfigurierten Kanal bei.
- `voice.allowedChannels` ist eine optionale Zulassungsliste für den Aufenthalt. Lassen Sie die Option nicht gesetzt, um `/vc join` für jeden autorisierten Discord-Sprachkanal zuzulassen. Wenn sie gesetzt ist, sind `/vc join`, der automatische Beitritt beim Start und durch den Sprachstatus des Bots ausgelöste Wechsel auf die aufgeführten `{ guildId, channelId }`-Einträge beschränkt. Setzen Sie sie auf ein leeres Array, um alle Beitritte zu Discord-Sprachkanälen zu verweigern. Wenn Discord den Bot aus der Zulassungsliste heraus verschiebt, verlässt OpenClaw diesen Kanal und tritt erneut dem konfigurierten Ziel für den automatischen Beitritt bei, sofern eines verfügbar ist.
- `voice.daveEncryption` und `voice.decryptionFailureTolerance` werden an die Beitrittsoptionen von `@discordjs/voice` durchgereicht; die Upstream-Standardwerte sind `daveEncryption=true` und `decryptionFailureTolerance=24`.
- OpenClaw verwendet den gebündelten Codec `libopus-wasm` für den Empfang von Discord-Sprachdaten und die Echtzeitwiedergabe von rohem PCM. Er enthält einen fest angehefteten libopus-WebAssembly-Build und benötigt keine nativen Opus-Add-ons.
- `voice.connectTimeoutMs` steuert die anfängliche Wartezeit auf den Status Ready von `@discordjs/voice` bei `/vc join` und Versuchen zum automatischen Beitritt. Standard: `30000`.
- `voice.reconnectGraceMs` steuert, wie lange OpenClaw darauf wartet, dass eine getrennte Sprachsitzung mit der Wiederherstellung der Verbindung beginnt, bevor sie verworfen wird. Standard: `15000`.
- Im Modus `stt-tts` wird die Sprachwiedergabe nicht beendet, nur weil ein anderer Benutzer zu sprechen beginnt. Um Rückkopplungsschleifen zu vermeiden, ignoriert OpenClaw neue Spracherfassung, während TTS wiedergegeben wird; sprechen Sie für den nächsten Gesprächsbeitrag erst nach Ende der Wiedergabe. Echtzeitmodi leiten Sprechbeginn-Ereignisse als Unterbrechungssignale an den Echtzeit-Provider weiter.
- In Echtzeitmodi kann Echo von Lautsprechern in ein offenes Mikrofon wie eine Unterbrechung wirken und die Wiedergabe stoppen. Setzen Sie für Discord-Räume mit starkem Echo `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`, damit OpenAI bei Eingangsaudio nicht automatisch unterbricht. Fügen Sie `voice.realtime.bargeIn: true` hinzu, wenn Discord-Ereignisse zum Sprechbeginn die aktive Wiedergabe weiterhin unterbrechen sollen. Die OpenAI-Echtzeitbrücke ignoriert Wiedergabeabbrüche, die kürzer als `voice.realtime.minBargeInAudioEndMs` sind, als wahrscheinliches Echo oder Rauschen und protokolliert sie als übersprungen, statt die Discord-Wiedergabe zu löschen.
- `voice.captureSilenceGraceMs` steuert, wie lange OpenClaw wartet, nachdem Discord das Ende eines Sprecherbeitrags gemeldet hat, bevor dieses Audiosegment für STT abgeschlossen wird. Standard: `2000`; erhöhen Sie den Wert, wenn Discord normale Pausen in abgehackte Teiltranskripte aufteilt.
- Wenn ElevenLabs als TTS-Provider ausgewählt ist, verwendet die Discord-Sprachwiedergabe Streaming-TTS und beginnt mit der Wiedergabe aus dem Antwortstream des Providers. Provider ohne Streaming-Unterstützung greifen auf den Pfad über eine synthetisierte temporäre Datei zurück.
- OpenClaw überwacht Entschlüsselungsfehler beim Empfang und stellt die Funktion automatisch wieder her, indem es den Sprachkanal nach wiederholten Fehlern innerhalb eines kurzen Zeitfensters verlässt und ihm erneut beitritt.
- Wenn Empfangsprotokolle nach einer Aktualisierung wiederholt `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` anzeigen, erfassen Sie einen Abhängigkeitsbericht und Protokolle. Die gebündelte Version von `@discordjs/voice` enthält die Upstream-Korrektur für Padding aus dem discord.js-PR #11449, durch den das discord.js-Issue #11419 geschlossen wurde.
- Empfangsereignisse mit `The operation was aborted` sind zu erwarten, wenn OpenClaw ein erfasstes Sprechersegment abschließt; es handelt sich um ausführliche Diagnosemeldungen, nicht um Warnungen.
- Ausführliche Discord-Sprachprotokolle enthalten für jedes akzeptierte Sprechersegment eine begrenzte einzeilige Vorschau des STT-Transkripts, sodass beim Debugging sowohl die Benutzerseite als auch die Antwortseite des Agenten sichtbar sind, ohne unbegrenzt viel Transkripttext auszugeben.
- Im Modus `agent-proxy` überspringt der erzwungene Konsultations-Fallback wahrscheinlich unvollständige Transkriptfragmente, etwa Text, der mit `...` oder einem nachgestellten Bindewort wie „und“ endet, sowie offensichtlich nicht handlungsrelevante Abschlüsse wie „bin gleich zurück“ oder „tschüss“. Die Protokolle zeigen `forced agent consult skipped reason=...`, wenn dadurch eine veraltete Antwort in der Warteschlange verhindert wird.

### Benutzern in Sprachkanälen folgen

Verwenden Sie `voice.followUsers`, wenn der Discord-Sprachbot einem oder mehreren bekannten Discord-Benutzern folgen soll, anstatt beim Start einem festgelegten Kanal beizutreten oder auf `/vc join` zu warten.

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
- `followUsersEnabled` ist standardmäßig `true`, wenn `followUsers` konfiguriert ist. Setzen Sie den Wert auf `false`, um die gespeicherte Liste beizubehalten, aber das automatische Folgen in Sprachkanäle zu deaktivieren.
- Wenn ein Benutzer, dem gefolgt wird, einem zulässigen Sprachkanal beitritt, tritt OpenClaw diesem Kanal bei. Wenn der Benutzer den Kanal wechselt, wechselt OpenClaw mit. Wenn der aktive Benutzer, dem gefolgt wird, die Verbindung trennt, verlässt OpenClaw den Kanal.
- Wenn sich mehrere Benutzer, denen gefolgt wird, auf demselben Server befinden und der aktive Benutzer den Kanal verlässt, wechselt OpenClaw zum Kanal eines anderen erfassten Benutzers, dem gefolgt wird, bevor es den Server verlässt. Wenn mehrere Benutzer, denen gefolgt wird, gleichzeitig den Kanal wechseln, ist das zuletzt beobachtete Sprachstatusereignis maßgeblich.
- `allowedChannels` gilt weiterhin. Ein Benutzer, dem gefolgt wird und der sich in einem nicht zulässigen Kanal befindet, wird ignoriert, und eine durch die Folgefunktion verwaltete Sitzung wechselt zu einem anderen Benutzer, dem gefolgt wird, oder wird beendet.
- OpenClaw gleicht beim Start und in begrenzten Intervallen verpasste Sprachstatusereignisse ab. Beim Abgleich werden konfigurierte Server stichprobenartig geprüft und die REST-Abfragen pro Durchlauf begrenzt. Daher kann es bei sehr großen `followUsers`-Listen mehr als ein Intervall dauern, bis ein konsistenter Zustand erreicht ist.
- Wenn Discord oder ein Administrator den Bot verschiebt, während er einem Benutzer folgt, erstellt OpenClaw die Sprachsitzung neu und behält die Verwaltung durch die Folgefunktion bei, sofern das Ziel zulässig ist. Wenn der Bot aus `allowedChannels` heraus verschoben wird, verlässt OpenClaw den Kanal und tritt dem konfigurierten Ziel erneut bei, sofern eines vorhanden ist.
- Bei der Wiederherstellung des DAVE-Empfangs kann derselbe Kanal nach wiederholten Entschlüsselungsfehlern verlassen und erneut betreten werden. Durch die Folgefunktion verwaltete Sitzungen behalten während dieses Wiederherstellungspfads ihre Verwaltung durch die Folgefunktion bei, sodass der Kanal weiterhin verlassen wird, wenn ein Benutzer, dem gefolgt wird, später die Verbindung trennt.

Wählen Sie zwischen den Beitrittsmodi:

- Verwenden Sie `followUsers` für persönliche oder von Operatoren verwaltete Einrichtungen, bei denen der Bot automatisch im Sprachkanal sein soll, wenn Sie dort sind.
- Verwenden Sie `autoJoin` für Bots in festen Räumen, die auch dann anwesend sein sollen, wenn sich kein erfasster Benutzer im Sprachkanal befindet.
- Verwenden Sie `/vc join` für einmalige Beitritte oder Räume, in denen eine automatische Anwesenheit im Sprachkanal unerwartet wäre.

Discord-Sprachcodec:

- Die Protokolle des Sprachempfangs zeigen `discord voice: opus decoder: libopus-wasm`.
- Bei der Echtzeitwiedergabe wird unkomprimiertes Stereo-PCM mit 48 kHz mithilfe desselben gebündelten Pakets `libopus-wasm` in Opus codiert, bevor die Pakete an `@discordjs/voice` übergeben werden.
- Bei der Wiedergabe von Dateien und Provider-Streams erfolgt mit ffmpeg eine Transcodierung in unkomprimiertes Stereo-PCM mit 48 kHz. Anschließend wird mit `libopus-wasm` der an Discord gesendete Opus-Paketstrom erzeugt.

STT- und TTS-Pipeline:

- Die Discord-PCM-Aufnahme wird in eine temporäre WAV-Datei konvertiert.
- `tools.media.audio` übernimmt STT, beispielsweise `openai/gpt-4o-mini-transcribe`.
- Das Transkript wird über den Discord-Eingang und das Routing weitergeleitet, während das Antwort-LLM mit einer Richtlinie für die Sprachausgabe ausgeführt wird, die das Agent-Tool `tts` ausblendet und die Rückgabe von Text anfordert, da Discord Voice die abschließende TTS-Wiedergabe übernimmt.
- Wenn `voice.model` festgelegt ist, überschreibt es nur das Antwort-LLM für diesen Durchlauf im Sprachkanal.
- `voice.tts` wird über `messages.tts` zusammengeführt; Streaming-fähige Provider speisen den Player direkt, andernfalls wird die resultierende Audiodatei im verbundenen Kanal abgespielt.

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

Ohne einen `voice.agentSession`-Block erhält jeder Sprachkanal seine eigene geroutete OpenClaw-Sitzung. Beispielsweise kommuniziert `/vc join channel:234567890123456789` mit der Sitzung für diesen Discord-Sprachkanal. Das Echtzeitmodell dient nur als Sprach-Frontend; inhaltliche Anfragen werden an den konfigurierten OpenClaw-Agenten übergeben. Wenn das Echtzeitmodell ein endgültiges Transkript erzeugt, ohne das Konsultations-Tool aufzurufen, erzwingt OpenClaw die Konsultation als Fallback, sodass sich die Standardeinstellung weiterhin wie ein Gespräch mit dem Agenten verhält.

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

Im Modus `agent-proxy` tritt der Bot dem konfigurierten Sprachkanal bei, die OpenClaw-Agentendurchläufe verwenden jedoch die normale geroutete Sitzung und den Agenten des Zielkanals. Die Echtzeit-Sprachsitzung gibt das zurückgegebene Ergebnis im Sprachkanal wieder. Der Supervisor-Agent kann gemäß seiner Tool-Richtlinie weiterhin normale Nachrichten-Tools verwenden, einschließlich des Sendens einer separaten Discord-Nachricht, wenn dies die richtige Aktion ist.

Während ein delegierter OpenClaw-Durchlauf aktiv ist, werden neue Discord-Sprachtranskripte als Live-Steuerung des Durchlaufs behandelt, bevor ein weiterer Agentendurchlauf gestartet wird. Formulierungen wie „Status“, „das abbrechen“, „die kleinere Korrektur verwenden“ oder „wenn Sie fertig sind, auch die Tests prüfen“ werden als Status-, Abbruch-, Steuerungs- oder Folgeeingabe für die aktive Sitzung klassifiziert. Status, Abbruch, akzeptierte Steuerung und Ergebnisse von Folgeeingaben werden im Sprachkanal wiedergegeben, damit die anrufende Person weiß, ob OpenClaw die Anfrage verarbeitet hat.

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

Verwenden Sie dies, wenn das Modell seine eigene Discord-Wiedergabe über ein offenes Mikrofon hört, Sie es aber weiterhin durch Sprechen unterbrechen möchten. OpenClaw verhindert, dass OpenAI bei rohen Audioeingaben automatisch unterbricht, während Discord-Ereignisse beim Beginn einer Sprecheraktivität und bereits aktive Sprecheraudiodaten dank `bargeIn: true` aktive Echtzeitantworten abbrechen können, bevor der nächste erfasste Durchlauf OpenAI erreicht. Sehr frühe Unterbrechungssignale mit `audioEndMs` unterhalb von `minBargeInAudioEndMs` werden als wahrscheinliches Echo oder Rauschen behandelt und ignoriert, damit das Modell nicht bereits beim ersten Wiedergabe-Frame abbricht.

Erwartete Sprachprotokolle:

- Beim Beitritt: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- Beim Start der Echtzeitverarbeitung: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- Bei Sprecheraudio: `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...` und `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- Bei übersprungener veralteter Spracheingabe: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` oder `reason=non-actionable-closing ...`
- Beim Abschluss einer Echtzeitantwort: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- Beim Stoppen oder Zurücksetzen der Wiedergabe: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- Bei einer Echtzeitkonsultation: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- Bei einer Agentenantwort: `discord voice: agent turn answer ...`
- Bei in die Warteschlange eingereihter exakter Sprachausgabe: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`, gefolgt von `discord voice: realtime exact speech dequeued reason=player-idle ...`
- Bei Erkennung einer Sprachunterbrechung: `discord voice: realtime barge-in detected source=speaker-start ...` oder `discord voice: realtime barge-in detected source=active-speaker-audio ...`, gefolgt von `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- Bei einer Echtzeitunterbrechung: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`, gefolgt von entweder `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` oder `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- Bei ignoriertem Echo oder Rauschen: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- Bei deaktivierter Sprachunterbrechung: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- Bei inaktiver Wiedergabe: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

Um abgeschnittene Audiodaten zu diagnostizieren, lesen Sie die Echtzeit-Sprachprotokolle als Zeitleiste:

1. `realtime audio playback started` bedeutet, dass Discord mit der Wiedergabe der Assistentenaudiodaten begonnen hat. Ab diesem Zeitpunkt zählt die Bridge die Ausgabeblöcke des Assistenten, die Discord-PCM-Bytes, die Echtzeit-Bytes des Providers und die Dauer der synthetisierten Audiodaten.
2. `realtime speaker turn opened` kennzeichnet, dass ein Discord-Sprecher aktiv wird. Wenn die Wiedergabe bereits aktiv und `bargeIn` aktiviert ist, kann darauf `barge-in detected source=speaker-start` folgen.
3. `realtime input audio started` kennzeichnet den ersten tatsächlich für diesen Sprecherdurchlauf empfangenen Audio-Frame. `outputActive=true` oder ein `outputAudioMs`-Wert ungleich null bedeutet hier, dass das Mikrofon Eingaben sendet, während die Assistentenwiedergabe noch aktiv ist.
4. `barge-in detected source=active-speaker-audio` bedeutet, dass OpenClaw bei aktiver Assistentenwiedergabe Live-Sprecheraudio erkannt hat. Dies hilft dabei, eine echte Unterbrechung von einem Discord-Ereignis beim Beginn einer Sprecheraktivität ohne verwertbare Audiodaten zu unterscheiden.
5. `barge-in requested reason=...` bedeutet, dass OpenClaw den Echtzeit-Provider aufgefordert hat, die aktive Antwort abzubrechen oder zu kürzen. Der Eintrag enthält `outputAudioMs`, `outputActive` und `playbackChunks`, damit Sie erkennen können, wie viele Assistentenaudiodaten vor der Unterbrechung tatsächlich wiedergegeben wurden.
6. `realtime audio playback stopped reason=...` ist der lokale Rücksetzpunkt der Discord-Wiedergabe. Der Grund gibt an, wodurch die Wiedergabe gestoppt wurde: `barge-in`, `player-idle`, `provider-clear-audio`, `forced-agent-consult`, `stream-close` oder `session-close`.
7. `realtime speaker turn closed` fasst den erfassten Eingabedurchlauf zusammen. `chunks=0` oder `hasAudio=false` bedeutet, dass der Sprecherdurchlauf geöffnet wurde, aber keine verwertbaren Audiodaten die Echtzeit-Bridge erreichten. `interruptedPlayback=true` bedeutet, dass sich dieser Eingabedurchlauf mit der Assistentenausgabe überschnitt und die Sprachunterbrechungslogik auslöste.

Nützliche Felder:

- `outputAudioMs`: Dauer der Assistentenaudiodaten, die der Echtzeit-Provider vor der Protokollzeile erzeugt hat.
- `audioMs`: Dauer der Assistentenaudiodaten, die OpenClaw vor dem Stoppen der Wiedergabe gezählt hat.
- `elapsedMs`: verstrichene Echtzeit zwischen dem Öffnen und Schließen des Wiedergabestreams oder Sprecherdurchlaufs.
- `discordBytes`: 48-kHz-Stereo-PCM-Bytes, die an Discord Voice gesendet oder von dort empfangen wurden.
- `realtimeBytes`: PCM-Bytes im Providerformat, die an den Echtzeit-Provider gesendet oder von ihm empfangen wurden.
- `playbackChunks`: Assistentenaudioblöcke, die für die aktive Antwort an Discord weitergeleitet wurden.
- `sinceLastAudioMs`: Zeitspanne zwischen dem letzten erfassten Sprecheraudio-Frame und dem Schließen des Sprecherdurchlaufs.

Häufige Muster:

- Ein sofortiger Abbruch mit `source=active-speaker-audio`, einem kleinen `outputAudioMs`-Wert und derselben Person in der Nähe deutet in der Regel darauf hin, dass Lautsprecherecho in das Mikrofon gelangt. Erhöhen Sie `voice.realtime.minBargeInAudioEndMs`, verringern Sie die Lautsprecherlautstärke, verwenden Sie Kopfhörer oder setzen Sie `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`.
- `source=speaker-start`, gefolgt von `speaker turn closed ... hasAudio=false`, bedeutet, dass Discord den Beginn einer Sprecheraktivität gemeldet hat, aber keine Audiodaten OpenClaw erreichten. Dies kann ein vorübergehendes Discord-Voice-Ereignis, das Verhalten eines Noise-Gates oder eine kurzzeitige Mikrofonaktivierung durch einen Client sein.
- `audio playback stopped reason=stream-close` ohne eine zeitlich nahe Sprachunterbrechung oder `provider-clear-audio` bedeutet, dass der lokale Discord-Wiedergabestream unerwartet beendet wurde. Prüfen Sie die vorausgehenden Provider- und Discord-Player-Protokolle.
- `capture ignored during playback (barge-in disabled)` bedeutet, dass OpenClaw Eingaben bei aktiver Assistentenaudiowiedergabe absichtlich verworfen hat. Aktivieren Sie `voice.realtime.bargeIn`, wenn Sprache die Wiedergabe unterbrechen soll.
- `barge-in ignored ... outputActive=false` bedeutet, dass Discord oder die Provider-VAD Sprache gemeldet hat, OpenClaw jedoch keine aktive Wiedergabe unterbrechen konnte. Dies sollte Audiodaten nicht abschneiden.

Anmeldedaten werden für jede Komponente separat aufgelöst: LLM-Routing-Authentifizierung für `voice.model`, STT-Authentifizierung für `tools.media.audio`, TTS-Authentifizierung für `messages.tts`/`voice.tts` und Authentifizierung des Echtzeit-Providers für `voice.realtime.providers` oder die normale Authentifizierungskonfiguration des Providers.

### Sprachnachrichten

Discord-Sprachnachrichten zeigen eine Wellenformvorschau an und erfordern OGG/Opus-Audio. OpenClaw erzeugt die Wellenform automatisch, benötigt jedoch `ffmpeg` und `ffprobe` auf dem Gateway-Host, um die Audiodaten zu prüfen und zu konvertieren.

- Geben Sie einen **lokalen Dateipfad** an (URLs werden abgelehnt).
- Lassen Sie den Textinhalt weg (Discord lehnt Text und Sprachnachricht in derselben Nutzlast ab).
- Jedes Audioformat wird akzeptiert; OpenClaw konvertiert es bei Bedarf in OGG/Opus.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Nicht zulässige Intents verwendet oder der Bot sieht keine Servernachrichten">

    - Message Content Intent aktivieren
    - Server Members Intent aktivieren, wenn Sie auf die Auflösung von Benutzern/Mitgliedern angewiesen sind
    - Gateway nach dem Ändern der Intents neu starten

  </Accordion>

  <Accordion title="Guild-Nachrichten werden unerwartet blockiert">

    - `groupPolicy` überprüfen
    - Guild-Zulassungsliste unter `channels.discord.guilds` überprüfen
    - wenn eine Guild über eine `channels`-Zuordnung verfügt, sind nur die aufgeführten Kanäle zulässig
    - Verhalten von `requireMention` und Erwähnungsmuster überprüfen

    Nützliche Prüfungen:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Erwähnung ist nicht erforderlich, aber Nachrichten werden dennoch blockiert">
    Häufige Ursachen:

    - `groupPolicy="allowlist"` ohne passende Guild-/Kanal-Zulassungsliste
    - `requireMention` an der falschen Stelle konfiguriert (muss unter `channels.discord.guilds` oder in einem Kanaleintrag stehen)
    - Absender durch die Guild-/Kanal-Zulassungsliste `users` blockiert

  </Accordion>

  <Accordion title="Lang laufende Discord-Durchläufe oder doppelte Antworten">

    Typische Protokolleinträge:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Einstellungen für die Discord-Gateway-Warteschlange:

    - einzelnes Konto: `channels.discord.eventQueue.listenerTimeout`
    - mehrere Konten: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - dies steuert nur die Listener-Arbeit des Discord-Gateways, nicht die Lebensdauer eines Agent-Durchlaufs

    Discord wendet auf Agent-Durchläufe in der Warteschlange kein kanaleigenes Zeitlimit an. Nachrichten-Listener übergeben die Verarbeitung sofort, und Discord-Durchläufe in der Warteschlange behalten die Reihenfolge pro Sitzung bei, bis der Lebenszyklus der Sitzung, des Tools oder der Laufzeit abgeschlossen ist oder die Arbeit abbricht.

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

  <Accordion title="Warnungen wegen Zeitüberschreitung beim Abrufen von Gateway-Metadaten">
    OpenClaw ruft vor dem Verbindungsaufbau die Discord-Metadaten von `/gateway/bot` ab. Bei vorübergehenden Fehlern wird auf die Standard-Gateway-URL von Discord zurückgegriffen und die Protokollausgabe wird ratenbegrenzt.

    Einstellungen für die Metadaten-Zeitüberschreitung:

    - einzelnes Konto: `channels.discord.gatewayInfoTimeoutMs`
    - mehrere Konten: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - Umgebungs-Fallback, wenn die Konfiguration nicht gesetzt ist: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - Standard: `30000` (30 Sekunden), Maximum: `120000`

  </Accordion>

  <Accordion title="Neustarts wegen Zeitüberschreitung bei Gateway READY">
    OpenClaw wartet beim Start und nach erneuten Laufzeitverbindungen auf das Gateway-Ereignis `READY` von Discord. Konfigurationen mit mehreren Konten und gestaffeltem Start benötigen möglicherweise ein längeres READY-Zeitfenster beim Start als den Standardwert.

    Einstellungen für die READY-Zeitüberschreitung:

    - Start mit einzelnem Konto: `channels.discord.gatewayReadyTimeoutMs`
    - Start mit mehreren Konten: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - Umgebungs-Fallback beim Start, wenn die Konfiguration nicht gesetzt ist: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - Standard beim Start: `15000` (15 Sekunden), Maximum: `120000`
    - Laufzeit mit einzelnem Konto: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - Laufzeit mit mehreren Konten: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - Umgebungs-Fallback zur Laufzeit, wenn die Konfiguration nicht gesetzt ist: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - Standard zur Laufzeit: `30000` (30 Sekunden), Maximum: `120000`

  </Accordion>

  <Accordion title="Abweichungen bei der Berechtigungsprüfung">
    Die Berechtigungsprüfungen von `channels status --probe` funktionieren nur mit numerischen Kanal-IDs.

    Wenn Sie Slug-Schlüssel verwenden, kann der Laufzeitabgleich weiterhin funktionieren, aber die Prüfung kann die Berechtigungen nicht vollständig verifizieren.

  </Accordion>

  <Accordion title="Probleme mit Direktnachrichten und Kopplung">

    - Direktnachrichten deaktiviert: `channels.discord.dm.enabled=false`
    - Richtlinie für Direktnachrichten deaktiviert: `channels.discord.dmPolicy="disabled"` (veraltet: `channels.discord.dm.policy`)
    - im Modus `pairing` wird auf die Kopplungsgenehmigung gewartet

  </Accordion>

  <Accordion title="Bot-zu-Bot-Schleifen">
    Standardmäßig werden von Bots verfasste Nachrichten ignoriert.

    Wenn Sie `channels.discord.allowBots=true` festlegen, verwenden Sie strenge Regeln für Erwähnungen und Zulassungslisten, um Schleifen zu vermeiden.
    Verwenden Sie vorzugsweise `channels.discord.allowBots="mentions"`, um nur Bot-Nachrichten zu akzeptieren, die den Bot erwähnen.

    OpenClaw enthält außerdem einen gemeinsamen [Schutz vor Bot-Schleifen](/de/channels/bot-loop-protection). Wenn `allowBots` dafür sorgt, dass von Bots verfasste Nachrichten die Weiterleitung erreichen, ordnet Discord das eingehende Ereignis den Fakten `(account, channel, bot pair)` zu, und der generische Paarschutz unterdrückt das Paar, nachdem es das konfigurierte Ereignisbudget überschritten hat. Der Schutz verhindert unkontrollierte Schleifen zwischen zwei Bots, die zuvor durch Discord-Ratenbegrenzungen gestoppt werden mussten; er wirkt sich nicht auf Bereitstellungen mit einem einzelnen Bot oder einmalige Bot-Antworten aus, die unter dem Budget bleiben.

    Standardeinstellungen (aktiv, wenn `allowBots` gesetzt ist):

    - `maxEventsPerWindow: 20` -- das Bot-Paar kann innerhalb des gleitenden Fensters 20 Nachrichten austauschen
    - `windowSeconds: 60` -- Länge des gleitenden Fensters
    - `cooldownSeconds: 60` -- sobald das Budget überschritten wird, wird jede weitere Bot-zu-Bot-Nachricht in beide Richtungen eine Minute lang verworfen

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

  <Accordion title="Voice-STT-Ausfälle mit DecryptionFailed(...)">

    - OpenClaw aktuell halten (`openclaw update`), damit die Wiederherstellungslogik für den Discord-Sprachempfang verfügbar ist
    - bestätigen, dass `channels.discord.voice.daveEncryption=true` gesetzt ist (Standard)
    - mit `channels.discord.voice.decryptionFailureTolerance=24` beginnen (Upstream-Standard) und nur bei Bedarf anpassen
    - Protokolle auf Folgendes prüfen:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - wenn die Fehler nach dem automatischen erneuten Beitritt weiterhin auftreten, Protokolle sammeln und mit dem Upstream-Verlauf des DAVE-Empfangs in [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) und [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) vergleichen

  </Accordion>
</AccordionGroup>

## Konfigurationsreferenz

Primäre Referenz: [Konfigurationsreferenz – Discord](/de/gateway/config-channels#discord).

<Accordion title="Wichtige Discord-Felder">

- Start/Authentifizierung: `enabled`, `token`, `applicationId`, `accounts.*`, `allowBots`
- Richtlinie: `groupPolicy`, `dmPolicy`, `allowFrom`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- Befehle: `commands.native`, `commands.useAccessGroups` (global), `configWrites`, `slashCommand.ephemeral`
- Ereigniswarteschlange: `eventQueue.listenerTimeout` (Listener-Budget, Standard `120000`), `eventQueue.maxQueueSize` (Standard `10000`), `eventQueue.maxConcurrency` (Standard `50`)
- Gateway: `proxy`, `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- Antworten/Verlauf: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- Zustellung: `textChunkLimit` (Standard `2000`), `maxLinesPerMessage` (Standard `17`)
- Streaming: `streaming.mode`, `streaming.chunkMode`, `streaming.preview.*`, `streaming.progress.*`, `streaming.block.*` (veraltete flache Schlüssel `streamMode`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`, `chunkMode` werden von `openclaw doctor --fix` nach `streaming.*` migriert)
- Medien/Wiederholungen: `mediaMaxMb` (begrenzt ausgehende Discord-Uploads, Standard `100`), `retry`
- Aktionen: `actions.*`
- Präsenz: `activity`, `status`, `activityType`, `activityUrl`, `autoPresence.*`
- Benutzeroberfläche: `ui.components.accentColor`
- Funktionen: `threadBindings`, `bindings[]` auf oberster Ebene (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents.enabled`, `agentComponents.ttlMs`, `heartbeat`, `responsePrefix`

</Accordion>

## Sicherheit und Betrieb

- Behandeln Sie Bot-Token als Geheimnisse (`DISCORD_BOT_TOKEN` wird in überwachten Umgebungen bevorzugt).
- Gewähren Sie Discord-Berechtigungen nach dem Prinzip der geringsten Rechte.
- Wenn die Befehlsbereitstellung oder der Status veraltet ist, starten Sie das Gateway neu und prüfen Sie erneut mit `openclaw channels status --probe`.

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Kopplung" icon="link" href="/de/channels/pairing">
    Koppeln Sie einen Discord-Benutzer mit dem Gateway.
  </Card>
  <Card title="Gruppen" icon="users" href="/de/channels/groups">
    Verhalten von Gruppenchats und Zulassungslisten.
  </Card>
  <Card title="Kanalrouting" icon="route" href="/de/channels/channel-routing">
    Leiten Sie eingehende Nachrichten an Agenten weiter.
  </Card>
  <Card title="Sicherheit" icon="shield" href="/de/gateway/security">
    Bedrohungsmodell und Absicherung.
  </Card>
  <Card title="Multi-Agent-Routing" icon="sitemap" href="/de/concepts/multi-agent">
    Ordnen Sie Guilds und Kanäle Agenten zu.
  </Card>
  <Card title="Slash-Befehle" icon="terminal" href="/de/tools/slash-commands">
    Verhalten nativer Befehle.
  </Card>
</CardGroup>
