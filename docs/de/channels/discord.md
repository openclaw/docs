---
read_when:
    - Arbeiten an Funktionen für Discord-Kanäle
summary: Supportstatus, Fähigkeiten und Konfiguration des Discord-Bots
title: Discord
x-i18n:
    generated_at: "2026-05-10T19:21:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 121b0b46bfb0d438f6ebfba4c93410c2ecfe8f99aa257e362b8767bf0aac27ce
    source_path: channels/discord.md
    workflow: 16
---

Bereit für DMs und Guild-Kanäle über den offiziellen Discord-Gateway.

<CardGroup cols={3}>
  <Card title="Koppeln" icon="link" href="/de/channels/pairing">
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

Sie müssen eine neue Anwendung mit einem Bot erstellen, den Bot zu Ihrem Server hinzufügen und ihn mit OpenClaw koppeln. Wir empfehlen, Ihren Bot zu Ihrem eigenen privaten Server hinzuzufügen. Wenn Sie noch keinen haben, [erstellen Sie zuerst einen](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (wählen Sie **Eigenen erstellen > Für mich und meine Freunde**).

<Steps>
  <Step title="Discord-Anwendung und Bot erstellen">
    Gehen Sie zum [Discord Developer Portal](https://discord.com/developers/applications) und klicken Sie auf **Neue Anwendung**. Geben Sie ihr einen Namen wie „OpenClaw“.

    Klicken Sie in der Seitenleiste auf **Bot**. Setzen Sie den **Benutzernamen** auf den Namen, den Sie für Ihren OpenClaw-Agenten verwenden.

  </Step>

  <Step title="Privilegierte Intents aktivieren">
    Scrollen Sie weiterhin auf der Seite **Bot** nach unten zu **Privilegierte Gateway-Intents** und aktivieren Sie:

    - **Nachrichteninhalts-Intent** (erforderlich)
    - **Servermitglieder-Intent** (empfohlen; erforderlich für Rollen-Allowlists und die Zuordnung von Namen zu IDs)
    - **Präsenz-Intent** (optional; nur für Präsenzaktualisierungen erforderlich)

  </Step>

  <Step title="Bot-Token kopieren">
    Scrollen Sie auf der Seite **Bot** wieder nach oben und klicken Sie auf **Token zurücksetzen**.

    <Note>
    Trotz des Namens wird dadurch Ihr erstes Token erzeugt — es wird nichts „zurückgesetzt“.
    </Note>

    Kopieren Sie das Token und speichern Sie es an einem sicheren Ort. Dies ist Ihr **Bot-Token**, und Sie benötigen es gleich.

  </Step>

  <Step title="Einladungs-URL generieren und Bot zu Ihrem Server hinzufügen">
    Klicken Sie in der Seitenleiste auf **OAuth2**. Sie generieren eine Einladungs-URL mit den richtigen Berechtigungen, um den Bot zu Ihrem Server hinzuzufügen.

    Scrollen Sie nach unten zu **OAuth2-URL-Generator** und aktivieren Sie:

    - `bot`
    - `applications.commands`

    Darunter erscheint ein Abschnitt **Bot-Berechtigungen**. Aktivieren Sie mindestens:

    **Allgemeine Berechtigungen**
      - Kanäle anzeigen
    **Textberechtigungen**
      - Nachrichten senden
      - Nachrichtenverlauf lesen
      - Links einbetten
      - Dateien anhängen
      - Reaktionen hinzufügen (optional)

    Dies ist der Basissatz für normale Textkanäle. Wenn Sie in Discord-Threads posten möchten, einschließlich Forum- oder Medienkanal-Workflows, die einen Thread erstellen oder fortsetzen, aktivieren Sie außerdem **Nachrichten in Threads senden**.
    Kopieren Sie die generierte URL unten, fügen Sie sie in Ihren Browser ein, wählen Sie Ihren Server aus und klicken Sie auf **Weiter**, um die Verbindung herzustellen. Sie sollten Ihren Bot nun im Discord-Server sehen.

  </Step>

  <Step title="Entwicklermodus aktivieren und Ihre IDs erfassen">
    Zurück in der Discord-App müssen Sie den Entwicklermodus aktivieren, damit Sie interne IDs kopieren können.

    1. Klicken Sie auf **Benutzereinstellungen** (Zahnradsymbol neben Ihrem Avatar) → **Erweitert** → aktivieren Sie **Entwicklermodus**
    2. Klicken Sie mit der rechten Maustaste auf Ihr **Serversymbol** in der Seitenleiste → **Server-ID kopieren**
    3. Klicken Sie mit der rechten Maustaste auf Ihren **eigenen Avatar** → **Benutzer-ID kopieren**

    Speichern Sie Ihre **Server-ID** und **Benutzer-ID** zusammen mit Ihrem Bot-Token — Sie senden alle drei im nächsten Schritt an OpenClaw.

  </Step>

  <Step title="DMs von Servermitgliedern zulassen">
    Damit die Kopplung funktioniert, muss Discord Ihrem Bot erlauben, Ihnen eine DM zu senden. Klicken Sie mit der rechten Maustaste auf Ihr **Serversymbol** → **Privatsphäre-Einstellungen** → aktivieren Sie **Direktnachrichten**.

    Dadurch können Servermitglieder (einschließlich Bots) Ihnen DMs senden. Lassen Sie dies aktiviert, wenn Sie Discord-DMs mit OpenClaw verwenden möchten. Wenn Sie nur Guild-Kanäle verwenden möchten, können Sie DMs nach der Kopplung deaktivieren.

  </Step>

  <Step title="Bot-Token sicher festlegen (nicht im Chat senden)">
    Ihr Discord-Bot-Token ist ein Geheimnis (wie ein Passwort). Legen Sie es auf dem Computer fest, auf dem OpenClaw ausgeführt wird, bevor Sie Ihrem Agenten eine Nachricht senden.

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

    Wenn OpenClaw bereits als Hintergrunddienst ausgeführt wird, starten Sie es über die OpenClaw-Mac-App neu oder indem Sie den Prozess `openclaw gateway run` stoppen und erneut starten.
    Führen Sie bei verwalteten Dienstinstallationen `openclaw gateway install` aus einer Shell aus, in der `DISCORD_BOT_TOKEN` vorhanden ist, oder speichern Sie die Variable in `~/.openclaw/.env`, damit der Dienst die Env-SecretRef nach dem Neustart auflösen kann.
    Wenn Ihr Host durch Discords Start-Anwendungsabfrage blockiert oder rate-limitiert wird, legen Sie die Discord-Anwendungs-/Client-ID aus dem Developer Portal fest, damit der Start diesen REST-Aufruf überspringen kann. Verwenden Sie `channels.discord.applicationId` für das Standardkonto oder `channels.discord.accounts.<accountId>.applicationId`, wenn Sie mehrere Discord-Bots ausführen.

  </Step>

  <Step title="OpenClaw konfigurieren und koppeln">

    <Tabs>
      <Tab title="Ihren Agenten fragen">
        Chatten Sie mit Ihrem OpenClaw-Agenten in einem vorhandenen Kanal (z. B. Telegram) und teilen Sie es ihm mit. Wenn Discord Ihr erster Kanal ist, verwenden Sie stattdessen den Tab CLI / Konfiguration.

        > „Ich habe mein Discord-Bot-Token bereits in der Konfiguration festgelegt. Bitte schließen Sie die Discord-Einrichtung mit Benutzer-ID `<user_id>` und Server-ID `<server_id>` ab.“
      </Tab>
      <Tab title="CLI / Konfiguration">
        Wenn Sie dateibasierte Konfiguration bevorzugen, legen Sie fest:

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

        Schreiben Sie für skriptbasierte oder Remote-Einrichtung denselben JSON5-Block mit `openclaw config patch --file ./discord.patch.json5 --dry-run` und führen Sie ihn anschließend erneut ohne `--dry-run` aus. Klartextwerte für `token` werden unterstützt. SecretRef-Werte werden ebenfalls für `channels.discord.token` über Env-/Datei-/Exec-Provider hinweg unterstützt. Siehe [Secrets-Verwaltung](/de/gateway/secrets).

        Bewahren Sie bei mehreren Discord-Bots jedes Bot-Token und jede Anwendungs-ID unter dem jeweiligen Konto auf. Ein `channels.discord.applicationId` auf oberster Ebene wird von Konten geerbt; setzen Sie ihn dort also nur, wenn jedes Konto dieselbe Anwendungs-ID verwenden soll.

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
    Warten Sie, bis der Gateway läuft, und senden Sie dann Ihrem Bot in Discord eine DM. Er antwortet mit einem Kopplungscode.

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

    Kopplungscodes laufen nach 1 Stunde ab.

    Sie sollten jetzt per DM in Discord mit Ihrem Agenten chatten können.

  </Step>
</Steps>

<Note>
Die Token-Auflösung ist kontobewusst. Konfigurierte Token-Werte haben Vorrang vor dem Env-Fallback. `DISCORD_BOT_TOKEN` wird nur für das Standardkonto verwendet.
Wenn zwei aktivierte Discord-Konten dasselbe Bot-Token auflösen, startet OpenClaw nur einen Gateway-Monitor für dieses Token. Ein aus der Konfiguration stammendes Token hat Vorrang vor dem Standard-Env-Fallback; andernfalls gewinnt das erste aktivierte Konto und das doppelte Konto wird als deaktiviert gemeldet.
Für erweiterte ausgehende Aufrufe (Nachrichten-Tool/Kanalaktionen) wird ein explizites `token` pro Aufruf für diesen Aufruf verwendet. Dies gilt für sendende und read-/probe-artige Aktionen (z. B. Lesen/Suchen/Abrufen/Thread/Pins/Berechtigungen). Kontorichtlinien- und Wiederholungseinstellungen stammen weiterhin aus dem ausgewählten Konto im aktiven Runtime-Snapshot.
</Note>

## Empfohlen: Guild-Arbeitsbereich einrichten

Sobald DMs funktionieren, können Sie Ihren Discord-Server als vollständigen Arbeitsbereich einrichten, in dem jeder Kanal seine eigene Agentensitzung mit eigenem Kontext erhält. Dies wird für private Server empfohlen, auf denen nur Sie und Ihr Bot aktiv sind.

<Steps>
  <Step title="Server zur Guild-Allowlist hinzufügen">
    Dadurch kann Ihr Agent in jedem Kanal auf Ihrem Server antworten, nicht nur in DMs.

    <Tabs>
      <Tab title="Ihren Agenten fragen">
        > „Fügen Sie meine Discord-Server-ID `<server_id>` zur Guild-Allowlist hinzu“
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

  <Step title="Antworten ohne @mention zulassen">
    Standardmäßig antwortet Ihr Agent in Guild-Kanälen nur, wenn er per @mention erwähnt wird. Für einen privaten Server möchten Sie wahrscheinlich, dass er auf jede Nachricht antwortet.

    In Guild-Kanälen bleiben normale finale Assistant-Antworten standardmäßig privat. Sichtbare Discord-Ausgabe muss explizit mit dem `message`-Tool gesendet werden, sodass der Agent standardmäßig mitlesen und nur posten kann, wenn er entscheidet, dass eine Kanalantwort nützlich ist.

    Das bedeutet, dass das ausgewählte Modell zuverlässig Tools aufrufen muss. Wenn Discord „Tippt ...“ anzeigt und die Protokolle Token-Nutzung zeigen, aber keine Nachricht gepostet wird, prüfen Sie das Sitzungsprotokoll auf Assistant-Text mit `didSendViaMessagingTool: false`. Das bedeutet, dass das Modell eine private finale Antwort erzeugt hat, statt `message(action=send)` aufzurufen. Wechseln Sie zu einem stärkeren Modell für Tool-Aufrufe, oder verwenden Sie die folgende Konfiguration, um alte automatische finale Antworten wiederherzustellen.

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

  <Step title="Speicher für Guild-Kanäle planen">
    Standardmäßig wird Langzeitspeicher (MEMORY.md) nur in DM-Sitzungen geladen. Guild-Kanäle laden MEMORY.md nicht automatisch.

    <Tabs>
      <Tab title="Ihren Agenten fragen">
        > „Wenn ich Fragen in Discord-Kanälen stelle, verwenden Sie memory_search oder memory_get, wenn Sie Langzeitkontext aus MEMORY.md benötigen.“
      </Tab>
      <Tab title="Manuell">
        Wenn Sie gemeinsamen Kontext in jedem Kanal benötigen, legen Sie die stabilen Anweisungen in `AGENTS.md` oder `USER.md` ab (sie werden für jede Sitzung injiziert). Bewahren Sie Langzeitnotizen in `MEMORY.md` auf und greifen Sie bei Bedarf mit Speicher-Tools darauf zu.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Erstellen Sie nun einige Kanäle auf Ihrem Discord-Server und beginnen Sie zu chatten. Ihr Agent kann den Kanalnamen sehen, und jeder Kanal erhält seine eigene isolierte Sitzung — Sie können also `#coding`, `#home`, `#research` oder etwas anderes einrichten, das zu Ihrem Workflow passt.

## Runtime-Modell

- Gateway verwaltet die Discord-Verbindung.
- Das Routing von Antworten ist deterministisch: Eingehende Discord-Antworten gehen zurück an Discord.
- Discord-Guild-/Kanal-Metadaten werden dem Modell-Prompt als nicht vertrauenswürdiger
  Kontext hinzugefügt, nicht als für Benutzer sichtbares Antwortpräfix. Wenn ein Modell diesen Umschlag
  zurückkopiert, entfernt OpenClaw die kopierten Metadaten aus ausgehenden Antworten und aus
  künftigem Replay-Kontext.
- Standardmäßig (`session.dmScope=main`) teilen direkte Chats die Haupt-Session des Agenten (`agent:main:main`).
- Guild-Kanäle sind isolierte Session-Schlüssel (`agent:<agentId>:discord:channel:<channelId>`).
- Gruppen-DMs werden standardmäßig ignoriert (`channels.discord.dm.groupEnabled=false`).
- Native Slash-Befehle laufen in isolierten Befehls-Sessions (`agent:<agentId>:discord:slash:<userId>`), während sie weiterhin `CommandTargetSessionKey` zur gerouteten Unterhaltungssession mitführen.
- Reine Textzustellung von Cron-/Heartbeat-Ankündigungen an Discord verwendet die finale,
  für den Assistenten sichtbare Antwort einmal. Medien und strukturierte Komponenten-Payloads bleiben
  mehrnachrichtenfähig, wenn der Agent mehrere zustellbare Payloads ausgibt.

## Forumkanäle

Discord-Forum- und Medienkanäle akzeptieren nur Thread-Beiträge. OpenClaw unterstützt zwei Wege, sie zu erstellen:

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

OpenClaw unterstützt Discord-Komponenten-v2-Container für Agent-Nachrichten. Verwenden Sie das Nachrichtenwerkzeug mit einer `components`-Payload. Interaktionsergebnisse werden als normale eingehende Nachrichten zurück an den Agenten geroutet und folgen den vorhandenen Discord-Einstellungen für `replyToMode`.

Unterstützte Blöcke:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Aktionszeilen erlauben bis zu 5 Buttons oder ein einzelnes Auswahlmenü
- Auswahltpypen: `string`, `user`, `role`, `mentionable`, `channel`

Standardmäßig sind Komponenten einmalig verwendbar. Setzen Sie `components.reusable=true`, damit Buttons, Auswahlen und Formulare bis zu ihrem Ablauf mehrfach verwendet werden können.

Um einzuschränken, wer auf einen Button klicken kann, setzen Sie `allowedUsers` für diesen Button (Discord-Benutzer-IDs, Tags oder `*`). Wenn dies konfiguriert ist, erhalten nicht übereinstimmende Benutzer eine ephemere Ablehnung.

Die Slash-Befehle `/model` und `/models` öffnen eine interaktive Modellauswahl mit Dropdowns für Provider, Modell und kompatible Runtime sowie einem Absenden-Schritt. `/models add` ist veraltet und gibt jetzt eine Veraltungsmeldung zurück, statt Modelle aus dem Chat zu registrieren. Die Picker-Antwort ist ephemer und kann nur vom aufrufenden Benutzer verwendet werden. Discord-Auswahlmenüs sind auf 25 Optionen begrenzt. Fügen Sie daher `provider/*`-Einträge zu `agents.defaults.models` hinzu, wenn der Picker dynamisch erkannte Modelle nur für ausgewählte Provider wie `openai-codex` oder `vllm` anzeigen soll.

Dateianhänge:

- `file`-Blöcke müssen auf eine Anhangsreferenz zeigen (`attachment://<filename>`)
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
  <Tab title="DM policy">
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
    - Benannte Konten erben `channels.discord.accounts.default.allowFrom` nicht.

    Die alten Werte `channels.discord.dm.policy` und `channels.discord.dm.allowFrom` werden aus Kompatibilitätsgründen weiterhin gelesen. `openclaw doctor --fix` migriert sie zu `dmPolicy` und `allowFrom`, wenn dies ohne Änderung des Zugriffs möglich ist.

    DM-Zielformat für die Zustellung:

    - `user:<id>`
    - `<@id>`-Mention

    Bloße numerische IDs werden normalerweise als Kanal-IDs aufgelöst, wenn ein Kanalstandard aktiv ist. IDs, die in der effektiven DM-`allowFrom` des Kontos aufgeführt sind, werden aus Kompatibilitätsgründen jedoch als Benutzer-DM-Ziele behandelt.

  </Tab>

  <Tab title="Access groups">
    Discord-DMs und die Autorisierung von Textbefehlen können dynamische `accessGroup:<name>`-Einträge in `channels.discord.allowFrom` verwenden.

    Zugriffgruppennamen werden über Nachrichtenkanäle hinweg geteilt. Verwenden Sie `type: "message.senders"` für eine statische Gruppe, deren Mitglieder in der normalen `allowFrom`-Syntax des jeweiligen Kanals ausgedrückt werden, oder `type: "discord.channelAudience"`, wenn die aktuelle `ViewChannel`-Zielgruppe eines Discord-Kanals die Mitgliedschaft dynamisch definieren soll. Das gemeinsame Verhalten von Zugriffsgruppen ist hier dokumentiert: [Zugriffsgruppen](/de/channels/access-groups).

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

    Ein Discord-Textkanal hat keine separate Mitgliederliste. `type: "discord.channelAudience"` modelliert Mitgliedschaft so: Der DM-Absender ist Mitglied der konfigurierten Guild und hat derzeit die effektive `ViewChannel`-Berechtigung für den konfigurierten Kanal, nachdem Rollen- und Kanalüberschreibungen angewendet wurden.

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

    Aktivieren Sie im Discord Developer Portal den **Server Members Intent** für den Bot, wenn Sie kanalzielgruppenbasierte Zugriffsgruppen verwenden. DMs enthalten keinen Guild-Mitgliedsstatus, daher löst OpenClaw das Mitglied zum Autorisierungszeitpunkt über Discord REST auf.

  </Tab>

  <Tab title="Guild policy">
    Die Guild-Verarbeitung wird durch `channels.discord.groupPolicy` gesteuert:

    - `open`
    - `allowlist`
    - `disabled`

    Die sichere Basis, wenn `channels.discord` vorhanden ist, ist `allowlist`.

    Verhalten von `allowlist`:

    - Die Guild muss mit `channels.discord.guilds` übereinstimmen (`id` bevorzugt, Slug akzeptiert)
    - Optionale Absender-Allowlists: `users` (stabile IDs empfohlen) und `roles` (nur Rollen-IDs); wenn eine der beiden konfiguriert ist, sind Absender erlaubt, wenn sie mit `users` ODER `roles` übereinstimmen
    - Direkte Namens-/Tag-Übereinstimmung ist standardmäßig deaktiviert; aktivieren Sie `channels.discord.dangerouslyAllowNameMatching: true` nur als Break-Glass-Kompatibilitätsmodus
    - Namen/Tags werden für `users` unterstützt, aber IDs sind sicherer; `openclaw security audit` warnt, wenn Namens-/Tag-Einträge verwendet werden
    - Wenn für eine Guild `channels` konfiguriert ist, werden nicht aufgelistete Kanäle abgelehnt
    - Wenn eine Guild keinen `channels`-Block hat, sind alle Kanäle in dieser allowgelisteten Guild erlaubt

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
    Guild-Nachrichten sind standardmäßig Mention-gesteuert.

    Die Mention-Erkennung umfasst:

    - explizite Bot-Mention
    - konfigurierte Mention-Muster (`agents.list[].groupChat.mentionPatterns`, Fallback `messages.groupChat.mentionPatterns`)
    - implizites Antwort-an-Bot-Verhalten in unterstützten Fällen

    Verwenden Sie beim Schreiben ausgehender Discord-Nachrichten die kanonische Mention-Syntax: `<@USER_ID>` für Benutzer, `<#CHANNEL_ID>` für Kanäle und `<@&ROLE_ID>` für Rollen. Verwenden Sie nicht die alte Nickname-Mention-Form `<@!USER_ID>`.

    `requireMention` wird pro Guild/Kanal konfiguriert (`channels.discord.guilds...`).
    `ignoreOtherMentions` verwirft optional Nachrichten, die einen anderen Benutzer/eine andere Rolle erwähnen, aber nicht den Bot (ausgenommen @everyone/@here).

    Gruppen-DMs:

    - Standard: ignoriert (`dm.groupEnabled=false`)
    - Optionale Allowlist über `dm.groupChannels` (Kanal-IDs oder Slugs)

  </Tab>
</Tabs>

### Rollenbasiertes Agent-Routing

Verwenden Sie `bindings[].match.roles`, um Discord-Guild-Mitglieder anhand der Rollen-ID zu verschiedenen Agenten zu routen. Rollenbasierte Bindings akzeptieren nur Rollen-IDs und werden nach Peer- oder Parent-Peer-Bindings und vor reinen Guild-Bindings ausgewertet. Wenn ein Binding auch andere Match-Felder setzt (zum Beispiel `peer` + `guildId` + `roles`), müssen alle konfigurierten Felder übereinstimmen.

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
- `commands.native=false` überspringt beim Start die Registrierung und Bereinigung von Discord-Slash-Commands. Zuvor registrierte Commands können in Discord sichtbar bleiben, bis Sie sie aus der Discord-App entfernen.
- Die Authentifizierung nativer Commands verwendet dieselben Discord-Allowlists/-Richtlinien wie die normale Nachrichtenverarbeitung.
- Commands können in der Discord-UI weiterhin für Benutzer sichtbar sein, die nicht autorisiert sind; die Ausführung erzwingt weiterhin die OpenClaw-Authentifizierung und gibt „nicht autorisiert“ zurück.

Siehe [Slash-Commands](/de/tools/slash-commands) für Command-Katalog und Verhalten.

Standardmäßige Slash-Command-Einstellungen:

- `ephemeral: true`

## Funktionsdetails

<AccordionGroup>
  <Accordion title="Antwort-Tags und native Antworten">
    Discord unterstützt Antwort-Tags in Agent-Ausgaben:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Gesteuert durch `channels.discord.replyToMode`:

    - `off` (Standard)
    - `first`
    - `all`
    - `batched`

    Hinweis: `off` deaktiviert implizites Antwort-Threading. Explizite `[[reply_to_*]]`-Tags werden weiterhin beachtet.
    `first` hängt die implizite native Antwortreferenz immer an die erste ausgehende Discord-Nachricht für diesen Turn an.
    `batched` hängt Discord's implizite native Antwortreferenz nur an, wenn der
    eingehende Turn ein entprellter Batch aus mehreren Nachrichten war. Das ist nützlich,
    wenn Sie native Antworten hauptsächlich für mehrdeutige, stoßweise Chats möchten, nicht für jeden
    einzelnen Turn mit nur einer Nachricht.

    Nachrichten-IDs werden in Kontext/Verlauf bereitgestellt, damit Agenten gezielt bestimmte Nachrichten adressieren können.

  </Accordion>

  <Accordion title="Live-Stream-Vorschau">
    OpenClaw kann Antwortentwürfe streamen, indem es eine temporäre Nachricht sendet und sie bearbeitet, während Text eintrifft. `channels.discord.streaming` akzeptiert `off` | `partial` | `block` | `progress` (Standard). `progress` behält einen bearbeitbaren Statusentwurf bei und aktualisiert ihn bis zur finalen Zustellung mit Tool-Fortschritt; das gemeinsame Startlabel ist eine laufende Zeile, sodass es wie der Rest aus dem sichtbaren Bereich scrollt, sobald genügend Arbeit erscheint. `streamMode` ist ein Legacy-Runtime-Alias. Führen Sie `openclaw doctor --fix` aus, um persistierte Konfiguration auf den kanonischen Schlüssel umzuschreiben.

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
          toolProgress: true,
        },
      },
    },
  },
}
```

    - `partial` bearbeitet eine einzelne Vorschaunachricht, während Tokens eintreffen.
    - `block` gibt entwurfsähnliche Blöcke aus (verwenden Sie `draftChunk`, um Größe und Umbruchpunkte abzustimmen, begrenzt durch `textChunkLimit`).
    - Medien, Fehler und finale Antworten mit explizitem Reply brechen ausstehende Vorschaubearbeitungen ab.
    - `streaming.preview.toolProgress` (Standard `true`) steuert, ob Tool-/Fortschrittsaktualisierungen die Vorschaunachricht wiederverwenden.
    - Tool-/Fortschrittszeilen werden, wenn verfügbar, kompakt als Emoji + Titel + Detail gerendert, zum Beispiel `🛠️ Bash: run tests` oder `🔎 Web Search: for "query"`.
    - `streaming.preview.commandText` / `streaming.progress.commandText` steuert Command-/Exec-Details in kompakten Fortschrittszeilen: `raw` (Standard) oder `status` (nur Tool-Label).

    Blenden Sie rohen Command-/Exec-Text aus, während kompakte Fortschrittszeilen erhalten bleiben:

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

    DM-Verlaufseinstellungen:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Thread-Verhalten:

    - Discord-Threads werden als Kanalsitzungen geroutet und übernehmen die Konfiguration des übergeordneten Kanals, sofern sie nicht überschrieben wird.
    - Thread-Sitzungen übernehmen die sitzungsbezogene `/model`-Auswahl des übergeordneten Kanals als reinen Modell-Fallback; threadlokale `/model`-Auswahlen haben weiterhin Vorrang, und der Transcript-Verlauf des übergeordneten Kanals wird nur kopiert, wenn Transcript-Vererbung aktiviert ist.
    - `channels.discord.thread.inheritParent` (Standard `false`) aktiviert für neue Auto-Threads das Seed aus dem übergeordneten Transcript. Kontospezifische Überschreibungen befinden sich unter `channels.discord.accounts.<id>.thread.inheritParent`.
    - Message-Tool-Reaktionen können `user:<id>`-DM-Ziele auflösen.
    - `guilds.<guild>.channels.<channel>.requireMention: false` bleibt beim Fallback für die Aktivierung in der Antwortphase erhalten.

    Kanalthemen werden als **nicht vertrauenswürdiger** Kontext injiziert. Allowlists steuern, wer den Agenten auslösen kann, bilden aber keine vollständige Redaktionsgrenze für zusätzlichen Kontext.

  </Accordion>

  <Accordion title="Thread-gebundene Sitzungen für Subagenten">
    Discord kann einen Thread an ein Sitzungsziel binden, sodass Folgenachrichten in diesem Thread weiterhin an dieselbe Sitzung geroutet werden (einschließlich Subagent-Sitzungen).

    Commands:

    - `/focus <target>` bindet aktuellen/neuen Thread an ein Subagent-/Sitzungsziel
    - `/unfocus` entfernt die aktuelle Thread-Bindung
    - `/agents` zeigt aktive Läufe und Bindungsstatus an
    - `/session idle <duration|off>` prüft/aktualisiert automatische Inaktivitäts-Entfokussierung für fokussierte Bindungen
    - `/session max-age <duration|off>` prüft/aktualisiert hartes Höchstalter für fokussierte Bindungen

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
    - `channels.discord.threadBindings.*` überschreibt das Discord-Verhalten.
    - `spawnSessions` steuert automatisches Erstellen/Binden von Threads für `sessions_spawn({ thread: true })` und ACP-Thread-Spawns. Standard: `true`.
    - `defaultSpawnContext` steuert den nativen Subagent-Kontext für Thread-gebundene Spawns. Standard: `"fork"`.
    - Veraltete Schlüssel `spawnSubagentSessions`/`spawnAcpSessions` werden durch `openclaw doctor --fix` migriert.
    - Wenn Thread-Bindungen für ein Konto deaktiviert sind, sind `/focus` und verwandte Thread-Bindungsoperationen nicht verfügbar.

    Siehe [Subagenten](/de/tools/subagents), [ACP-Agenten](/de/tools/acp-agents) und [Konfigurationsreferenz](/de/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Persistente ACP-Kanalbindungen">
    Konfigurieren Sie für stabile „always-on“-ACP-Arbeitsbereiche typisierte ACP-Bindungen auf oberster Ebene, die auf Discord-Konversationen zielen.

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

    - `/acp spawn codex --bind here` bindet den aktuellen Kanal oder Thread an Ort und Stelle und hält zukünftige Nachrichten auf derselben ACP-Sitzung. Thread-Nachrichten übernehmen die Bindung des übergeordneten Kanals.
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
    - Fallback auf Identitäts-Emoji des Agenten (`agents.list[].identity.emoji`, andernfalls "👀")

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
    Routen Sie Discord-Gateway-WebSocket-Traffic und REST-Startabfragen (Anwendungs-ID + Allowlist-Auflösung) über einen HTTP(S)-Proxy mit `channels.discord.proxy`.

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
    Aktivieren Sie PluralKit-Auflösung, um Proxy-Nachrichten der Identität eines Systemmitglieds zuzuordnen:

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
    - Abfragen verwenden die ursprüngliche Nachrichten-ID und sind zeitfensterbeschränkt
    - Wenn die Abfrage fehlschlägt, werden Proxy-Nachrichten als Bot-Nachrichten behandelt und verworfen, sofern `allowBots=true` nicht gesetzt ist

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

  <Accordion title="Presence-Konfiguration">
    Presence-Aktualisierungen werden angewendet, wenn Sie ein Status- oder Aktivitätsfeld setzen oder wenn Sie Auto-Presence aktivieren.

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
    - 2: Zuhören
    - 3: Anschauen
    - 4: Benutzerdefiniert (verwendet den Aktivitätstext als Statuszustand; Emoji ist optional)
    - 5: Wettkämpfen

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

    Automatische Präsenz ordnet die Runtime-Verfügbarkeit dem Discord-Status zu: fehlerfrei => online, beeinträchtigt oder unbekannt => abwesend, erschöpft oder nicht verfügbar => dnd. Optionale Textüberschreibungen:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (unterstützt den Platzhalter `{reason}`)

  </Accordion>

  <Accordion title="Genehmigungen in Discord">
    Discord unterstützt schaltflächenbasierte Genehmigungsabläufe in DMs und kann Genehmigungsaufforderungen optional im Ursprungskanal posten.

    Konfigurationspfad:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (optional; fällt nach Möglichkeit auf `commands.ownerAllowFrom` zurück)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, Standard: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord aktiviert native Exec-Genehmigungen automatisch, wenn `enabled` nicht gesetzt oder `"auto"` ist und mindestens ein Genehmiger aufgelöst werden kann, entweder aus `execApprovals.approvers` oder aus `commands.ownerAllowFrom`. Discord leitet Exec-Genehmiger nicht aus Kanal-`allowFrom`, dem veralteten `dm.allowFrom` oder Direct-Message-`defaultTo` ab. Setzen Sie `enabled: false`, um Discord ausdrücklich als nativen Genehmigungsclient zu deaktivieren.

    Für sensible, nur Ownern vorbehaltene Gruppenbefehle wie `/diagnostics` und `/export-trajectory` sendet OpenClaw Genehmigungsaufforderungen und Endergebnisse privat. Es versucht zuerst Discord-DM, wenn der aufrufende Owner eine Discord-Owner-Route hat; ist diese nicht verfügbar, fällt es auf die erste verfügbare Owner-Route aus `commands.ownerAllowFrom` zurück, etwa Telegram.

    Wenn `target` `channel` oder `both` ist, ist die Genehmigungsaufforderung im Kanal sichtbar. Nur aufgelöste Genehmiger können die Schaltflächen verwenden; andere Benutzer erhalten eine flüchtige Ablehnung. Genehmigungsaufforderungen enthalten den Befehlstext, aktivieren Sie die Kanalzustellung daher nur in vertrauenswürdigen Kanälen. Wenn die Kanal-ID nicht aus dem Sitzungsschlüssel abgeleitet werden kann, fällt OpenClaw auf die Zustellung per DM zurück.

    Discord rendert außerdem die gemeinsam genutzten Genehmigungsschaltflächen, die von anderen Chat-Kanälen verwendet werden. Der native Discord-Adapter ergänzt hauptsächlich Genehmiger-DM-Routing und Kanal-Fanout.
    Wenn diese Schaltflächen vorhanden sind, sind sie die primäre Genehmigungs-UX; OpenClaw
    sollte einen manuellen `/approve`-Befehl nur aufnehmen, wenn das Tool-Ergebnis besagt,
    dass Chat-Genehmigungen nicht verfügbar sind oder die manuelle Genehmigung der einzige Weg ist.
    Wenn die native Discord-Genehmigungs-Runtime nicht aktiv ist, hält OpenClaw die
    lokale deterministische `/approve <id> <decision>`-Aufforderung sichtbar. Wenn die
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

Die Aktion `event-create` akzeptiert einen optionalen Parameter `image` (URL oder lokaler Dateipfad), um das Titelbild des geplanten Ereignisses festzulegen.

Aktions-Gates befinden sich unter `channels.discord.actions.*`.

Standardverhalten der Gates:

| Aktionsgruppe                                                                                                                                                            | Standard    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | aktiviert   |
| roles                                                                                                                                                                    | deaktiviert |
| moderation                                                                                                                                                               | deaktiviert |
| presence                                                                                                                                                                 | deaktiviert |

## Components-v2-UI

OpenClaw verwendet Discord-Komponenten v2 für Exec-Genehmigungen und kontextübergreifende Marker. Discord-Nachrichtenaktionen können außerdem `components` für benutzerdefinierte UI akzeptieren (fortgeschritten; erfordert das Erstellen eines Komponenten-Payloads über das Discord-Tool), während veraltete `embeds` weiterhin verfügbar sind, aber nicht empfohlen werden.

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

Discord hat zwei unterschiedliche Sprachoberflächen: Echtzeit-**Sprachkanäle** (fortlaufende Unterhaltungen) und **Sprachnachrichtenanhänge** (das Wellenform-Vorschauformat). Das Gateway unterstützt beide.

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

Um die effektiven Berechtigungen des Bots vor dem Beitritt zu prüfen, führen Sie aus:

```bash
openclaw channels capabilities --channel discord --target channel:<voice-channel-id>
```

Beispiel für automatisches Beitreten:

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

- `voice.tts` überschreibt `messages.tts` nur für die `stt-tts`-Sprachwiedergabe. Realtime-Modi verwenden `voice.realtime.voice`.
- `voice.mode` steuert den Konversationspfad. Der Standard ist `agent-proxy`: Ein Realtime-Sprach-Frontend übernimmt Turn-Timing, Unterbrechung und Wiedergabe, delegiert inhaltliche Arbeit über `openclaw_agent_consult` an den gerouteten OpenClaw-Agenten und behandelt das Ergebnis wie einen getippten Discord-Prompt dieser sprechenden Person. `stt-tts` behält den älteren Batch-STT-plus-TTS-Ablauf bei. `bidi` lässt das Realtime-Modell direkt dialogisieren und stellt dabei `openclaw_agent_consult` für das OpenClaw-Hirn bereit.
- `voice.agentSession` steuert, welche OpenClaw-Konversation Sprach-Turns empfängt. Lassen Sie es ungesetzt für die eigene Sitzung des Sprachkanals, oder setzen Sie `{ mode: "target", target: "channel:<text-channel-id>" }`, damit der Sprachkanal als Mikrofon-/Lautsprecher-Erweiterung einer bestehenden Discord-Textkanal-Sitzung wie `#maintainers` agiert.
- `voice.model` überschreibt das OpenClaw-Agentenhirn für Discord-Sprachantworten und Realtime-Consults. Lassen Sie es ungesetzt, um das geroutete Agentenmodell zu erben. Es ist getrennt von `voice.realtime.model`.
- `agent-proxy` leitet Sprache über `discord-voice`, wodurch die normale Owner-/Tool-Autorisierung für die sprechende Person und die Zielsitzung erhalten bleibt, aber das Agenten-Tool `tts` ausgeblendet wird, weil Discord-Voice die Wiedergabe besitzt. Standardmäßig gibt `agent-proxy` dem Consult für Owner-Sprecher vollständigen owner-äquivalenten Tool-Zugriff (`voice.realtime.toolPolicy: "owner"`) und bevorzugt nachdrücklich, vor inhaltlichen Antworten den OpenClaw-Agenten zu konsultieren (`voice.realtime.consultPolicy: "always"`). In diesem Standardmodus `always` spricht die Realtime-Schicht vor der Consult-Antwort nicht automatisch Fülltext; sie erfasst und transkribiert Sprache und spricht dann die geroutete OpenClaw-Antwort. Wenn mehrere erzwungene Consult-Antworten fertig werden, während Discord noch die erste Antwort wiedergibt, werden spätere Antworten mit exakter Sprache in die Warteschlange gestellt, bis die Wiedergabe im Leerlauf ist, statt die Sprache mitten im Satz zu ersetzen.
- Im Modus `stt-tts` verwendet STT `tools.media.audio`; `voice.model` wirkt sich nicht auf die Transkription aus.
- In Realtime-Modi konfigurieren `voice.realtime.provider`, `voice.realtime.model` und `voice.realtime.voice` die Realtime-Audiositzung. Für OpenAI Realtime 2 plus das Codex-Hirn verwenden Sie `voice.realtime.model: "gpt-realtime-2"` und `voice.model: "openai-codex/gpt-5.5"`.
- Der OpenAI-Realtime-Provider akzeptiert aktuelle Realtime-2-Ereignisnamen und ältere Codex-kompatible Aliasse für Ausgabeaudio- und Transkriptereignisse, sodass kompatible Provider-Snapshots abweichen können, ohne Assistentenaudio zu verlieren.
- `voice.realtime.bargeIn` steuert, ob Discord-Sprecherstart-Ereignisse aktive Realtime-Wiedergabe unterbrechen. Wenn ungesetzt, folgt es der Eingabeaudio-Unterbrechungseinstellung des Realtime-Providers.
- `voice.realtime.minBargeInAudioEndMs` steuert die minimale Wiedergabedauer des Assistenten, bevor ein OpenAI-Realtime-Barge-in Audio abschneidet. Standard: `250`. Setzen Sie `0` für sofortige Unterbrechung in Räumen mit wenig Echo, oder erhöhen Sie den Wert für Lautsprecher-Setups mit starkem Echo.
- Für eine OpenAI-Stimme bei Discord-Wiedergabe setzen Sie `voice.tts.provider: "openai"` und wählen eine Text-to-speech-Stimme unter `voice.tts.openai.voice` oder `voice.tts.providers.openai.voice`. `cedar` ist beim aktuellen OpenAI-TTS-Modell eine gute maskulin klingende Wahl.
- Kanalbezogene Discord-`systemPrompt`-Überschreibungen gelten für Sprachtranskript-Turns dieses Sprachkanals.
- Sprachtranskript-Turns leiten den Owner-Status aus Discord `allowFrom` (oder `dm.allowFrom`) ab; Nicht-Owner-Sprecher können nicht auf owner-exklusive Tools zugreifen (zum Beispiel `gateway` und `cron`).
- Discord-Voice ist für reine Textkonfigurationen Opt-in; setzen Sie `channels.discord.voice.enabled=true` (oder behalten Sie einen bestehenden `channels.discord.voice`-Block bei), um `/vc`-Befehle, die Voice-Runtime und den Gateway-Intent `GuildVoiceStates` zu aktivieren.
- `channels.discord.intents.voiceStates` kann das Abonnement des Voice-State-Intents ausdrücklich überschreiben. Lassen Sie es ungesetzt, damit der Intent der wirksamen Voice-Aktivierung folgt.
- Wenn `voice.autoJoin` mehrere Einträge für dieselbe Guild hat, tritt OpenClaw dem zuletzt konfigurierten Kanal für diese Guild bei.
- `voice.daveEncryption` und `voice.decryptionFailureTolerance` werden an die Join-Optionen von `@discordjs/voice` durchgereicht.
- Die Standardwerte von `@discordjs/voice` sind `daveEncryption=true` und `decryptionFailureTolerance=24`, wenn sie ungesetzt sind.
- OpenClaw verwendet standardmäßig den reinen JS-Decoder `opusscript` für Discord-Voice-Empfang. Das optionale native Paket `@discordjs/opus` wird von der pnpm-Installationsrichtlinie des Repos ignoriert, damit normale Installationen, Docker-Lanes und unabhängige Tests kein natives Addon kompilieren. Dedizierte Hosts für Voice-Performance können nach der Installation des nativen Addons mit `OPENCLAW_DISCORD_OPUS_DECODER=native` opt-in aktivieren.
- `voice.connectTimeoutMs` steuert das anfängliche `@discordjs/voice`-Warten auf Ready für `/vc join` und Auto-Join-Versuche. Standard: `30000`.
- `voice.reconnectGraceMs` steuert, wie lange OpenClaw wartet, bis eine getrennte Voice-Sitzung mit dem Wiederverbinden beginnt, bevor sie zerstört wird. Standard: `15000`.
- Im Modus `stt-tts` stoppt die Sprachwiedergabe nicht nur deshalb, weil ein anderer Benutzer zu sprechen beginnt. Um Feedback-Schleifen zu vermeiden, ignoriert OpenClaw neue Spracherfassung, während TTS wiedergegeben wird; sprechen Sie nach Abschluss der Wiedergabe für den nächsten Turn. Realtime-Modi leiten Sprecherstarts als Barge-in-Signale an den Realtime-Provider weiter.
- In Realtime-Modi kann Echo von Lautsprechern in ein offenes Mikrofon wie Barge-in aussehen und die Wiedergabe unterbrechen. Für Discord-Räume mit starkem Echo setzen Sie `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`, damit OpenAI bei Eingabeaudio nicht automatisch unterbricht. Fügen Sie `voice.realtime.bargeIn: true` hinzu, wenn Discord-Sprecherstart-Ereignisse aktive Wiedergabe trotzdem unterbrechen sollen. Die OpenAI-Realtime-Bridge ignoriert Wiedergabeabschneidungen, die kürzer als `voice.realtime.minBargeInAudioEndMs` sind, als wahrscheinliches Echo/Rauschen und protokolliert sie als übersprungen, statt die Discord-Wiedergabe zu leeren.
- `voice.captureSilenceGraceMs` steuert, wie lange OpenClaw wartet, nachdem Discord gemeldet hat, dass eine sprechende Person aufgehört hat, bevor dieses Audiosegment für STT finalisiert wird. Standard: `2500`; erhöhen Sie diesen Wert, wenn Discord normale Pausen in abgehackte Teiltranskripte aufteilt.
- Wenn ElevenLabs der ausgewählte TTS-Provider ist, verwendet Discord-Sprachwiedergabe Streaming-TTS und startet aus dem Antwortstream des Providers. Provider ohne Streaming-Unterstützung fallen auf den Pfad mit synthetisierter temporärer Datei zurück.
- OpenClaw überwacht außerdem Entschlüsselungsfehler beim Empfang und stellt sich automatisch wieder her, indem es nach wiederholten Fehlern in einem kurzen Zeitfenster den Sprachkanal verlässt und erneut beitritt.
- Wenn Empfangslogs nach einer Aktualisierung wiederholt `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` zeigen, sammeln Sie einen Abhängigkeitsbericht und Logs. Die gebündelte `@discordjs/voice`-Linie enthält den Upstream-Padding-Fix aus discord.js PR #11449, der discord.js Issue #11419 geschlossen hat.
- Empfangsereignisse `The operation was aborted` sind erwartet, wenn OpenClaw ein erfasstes Sprechersegment finalisiert; sie sind ausführliche Diagnosen, keine Warnungen.
- Ausführliche Discord-Voice-Logs enthalten für jedes akzeptierte Sprechersegment eine begrenzte einzeilige STT-Transkriptvorschau, sodass Debugging sowohl die Benutzerseite als auch die Agentenantwortseite zeigt, ohne unbegrenzt Transkripttext auszugeben.
- Im Modus `agent-proxy` überspringt der erzwungene Consult-Fallback wahrscheinlich unvollständige Transkriptfragmente, etwa Text, der auf `...` endet, oder einen nachgestellten Konnektor wie `and`, außerdem offensichtlich nicht handlungsrelevante Abschlüsse wie „Bin gleich zurück“ oder „Tschüss“. Logs zeigen `forced agent consult skipped reason=...`, wenn dadurch eine veraltete Antwort in der Warteschlange verhindert wird.

Native-opus-Einrichtung für Source-Checkouts:

```bash
pnpm install
mise exec node@22 -- pnpm discord:opus:install
```

Verwenden Sie Node 22 für den Gateway, wenn Sie das native vorgebaute Upstream-Addon für macOS arm64 nutzen möchten. Wenn Sie eine andere Node-Runtime verwenden, benötigt der Opt-in-Installer möglicherweise eine lokale `node-gyp`-Toolchain für Source-Builds.

Starten Sie den Gateway nach der Installation des nativen Addons mit:

```bash
OPENCLAW_DISCORD_OPUS_DECODER=native pnpm gateway:watch
```

Ausführliche Voice-Logs sollten `discord voice: opus decoder: @discordjs/opus` zeigen. Ohne das Env-Opt-in, oder wenn das native Addon fehlt oder auf dem Host nicht geladen werden kann, protokolliert OpenClaw `discord voice: opus decoder: opusscript` und empfängt Voice weiter über den reinen JS-Fallback.

STT-plus-TTS-Pipeline:

- Discord-PCM-Erfassung wird in eine temporäre WAV-Datei konvertiert.
- `tools.media.audio` übernimmt STT, zum Beispiel `openai/gpt-4o-mini-transcribe`.
- Das Transkript wird durch Discord-Ingress und Routing gesendet, während das Antwort-LLM mit einer Voice-Ausgaberichtlinie läuft, die das Agenten-Tool `tts` ausblendet und zurückgegebenen Text anfordert, weil Discord-Voice die endgültige TTS-Wiedergabe besitzt.
- `voice.model` überschreibt, wenn gesetzt, nur das Antwort-LLM für diesen Sprachkanal-Turn.
- `voice.tts` wird über `messages.tts` gemergt; streamingfähige Provider speisen den Player direkt, andernfalls wird die resultierende Audiodatei im beigetretenen Kanal wiedergegeben.

Beispiel für eine Standard-`agent-proxy`-Sprachkanal-Sitzung:

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

Ohne `voice.agentSession`-Block erhält jeder Sprachkanal seine eigene geroutete OpenClaw-Sitzung. Zum Beispiel spricht `/vc join channel:234567890123456789` mit der Sitzung für diesen Discord-Sprachkanal. Das Realtime-Modell ist nur das Voice-Frontend; inhaltliche Anfragen werden an den konfigurierten OpenClaw-Agenten übergeben. Wenn das Realtime-Modell ein finales Transkript erzeugt, ohne das Consult-Tool aufzurufen, erzwingt OpenClaw den Consult als Fallback, sodass der Standard sich weiterhin wie ein Gespräch mit dem Agenten verhält.

Beispiel für älteres STT plus TTS:

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

Im Modus `agent-proxy` tritt der Bot dem konfigurierten Sprachkanal bei, aber OpenClaw-Agenten-Turns verwenden die normale geroutete Sitzung und den Agenten des Zielkanals. Die Realtime-Voice-Sitzung spricht das zurückgegebene Ergebnis wieder in den Sprachkanal. Der Supervisor-Agent kann gemäß seiner Tool-Richtlinie weiterhin normale Nachrichten-Tools verwenden, einschließlich des Sendens einer separaten Discord-Nachricht, wenn das die richtige Aktion ist.

Nützliche Zielformen:

- `target: "channel:123456789012345678"` routet über eine Discord-Textkanal-Sitzung.
- `target: "123456789012345678"` wird als Kanalziel behandelt.
- `target: "dm:123456789012345678"` oder `target: "user:123456789012345678"` routet über diese Direktnachrichten-Sitzung.

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

Verwenden Sie dies, wenn das Modell seine eigene Discord-Wiedergabe über ein offenes Mikrofon hört, Sie es aber trotzdem durch Sprechen unterbrechen möchten. OpenClaw verhindert, dass OpenAI bei rohem Eingabeaudio automatisch unterbricht, während `bargeIn: true` zulässt, dass Discord-Sprecherstart-Ereignisse und bereits aktive Sprecher-Audio aktive Realtime-Antworten abbrechen, bevor die nächste erfasste Runde OpenAI erreicht. Sehr frühe Barge-in-Signale mit `audioEndMs` unter `minBargeInAudioEndMs` werden als wahrscheinliches Echo/Rauschen behandelt und ignoriert, damit das Modell nicht beim ersten Wiedergabe-Frame abgeschnitten wird.

Erwartete Sprach-Logs:

- Beim Beitreten: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- Beim Realtime-Start: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- Bei Sprecher-Audio: `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...` und `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- Bei übersprungener veralteter Sprache: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` oder `reason=non-actionable-closing ...`
- Bei Abschluss der Realtime-Antwort: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- Bei Wiedergabestopp/-zurücksetzung: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- Bei Realtime-Konsultation: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- Bei Agent-Antwort: `discord voice: agent turn answer ...`
- Bei eingereihter exakter Sprache: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`, gefolgt von `discord voice: realtime exact speech dequeued reason=player-idle ...`
- Bei Barge-in-Erkennung: `discord voice: realtime barge-in detected source=speaker-start ...` oder `discord voice: realtime barge-in detected source=active-speaker-audio ...`, gefolgt von `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- Bei Realtime-Unterbrechung: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`, gefolgt von entweder `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` oder `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- Bei ignoriertem Echo/Rauschen: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- Bei deaktiviertem Barge-in: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- Bei inaktiver Wiedergabe: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

Um abgeschnittenes Audio zu debuggen, lesen Sie die Realtime-Sprach-Logs als Zeitachse:

1. `realtime audio playback started` bedeutet, dass Discord mit der Wiedergabe von Assistenten-Audio begonnen hat. Die Bridge beginnt ab diesem Punkt, Assistenten-Ausgabe-Chunks, Discord-PCM-Bytes, Provider-Realtime-Bytes und synthetisierte Audiodauer zu zählen.
2. `realtime speaker turn opened` markiert, dass ein Discord-Sprecher aktiv wird. Wenn die Wiedergabe bereits aktiv ist und `bargeIn` aktiviert ist, kann darauf `barge-in detected source=speaker-start` folgen.
3. `realtime input audio started` markiert den ersten tatsächlich empfangenen Audio-Frame für diese Sprecher-Runde. `outputActive=true` oder ein Wert ungleich null für `outputAudioMs` bedeutet hier, dass das Mikrofon Eingaben sendet, während die Assistenten-Wiedergabe noch aktiv ist.
4. `barge-in detected source=active-speaker-audio` bedeutet, dass OpenClaw Live-Sprecher-Audio gesehen hat, während die Assistenten-Wiedergabe aktiv war. Das ist hilfreich, um eine echte Unterbrechung von einem Discord-Sprecherstart-Ereignis ohne nützliches Audio zu unterscheiden.
5. `barge-in requested reason=...` bedeutet, dass OpenClaw den Realtime-Provider gebeten hat, die aktive Antwort abzubrechen oder zu kürzen. Es enthält `outputAudioMs`, `outputActive` und `playbackChunks`, damit Sie sehen können, wie viel Assistenten-Audio vor der Unterbrechung tatsächlich abgespielt wurde.
6. `realtime audio playback stopped reason=...` ist der lokale Zurücksetzungspunkt der Discord-Wiedergabe. Der Grund gibt an, wer die Wiedergabe gestoppt hat: `barge-in`, `player-idle`, `provider-clear-audio`, `forced-agent-consult`, `stream-close` oder `session-close`.
7. `realtime speaker turn closed` fasst die erfasste Eingaberunde zusammen. `chunks=0` oder `hasAudio=false` bedeutet, dass sich die Sprecher-Runde geöffnet hat, aber kein nutzbares Audio die Realtime-Bridge erreicht hat. `interruptedPlayback=true` bedeutet, dass sich diese Eingaberunde mit der Assistenten-Ausgabe überschnitten und die Barge-in-Logik ausgelöst hat.

Nützliche Felder:

- `outputAudioMs`: vom Realtime-Provider vor der Log-Zeile erzeugte Assistenten-Audiodauer.
- `audioMs`: Assistenten-Audiodauer, die OpenClaw gezählt hat, bevor die Wiedergabe gestoppt wurde.
- `elapsedMs`: Wanduhrzeit zwischen Öffnen und Schließen des Wiedergabestreams oder der Sprecher-Runde.
- `discordBytes`: 48-kHz-Stereo-PCM-Bytes, die an Discord Voice gesendet oder von dort empfangen wurden.
- `realtimeBytes`: PCM-Bytes im Provider-Format, die an den Realtime-Provider gesendet oder von dort empfangen wurden.
- `playbackChunks`: Assistenten-Audio-Chunks, die für die aktive Antwort an Discord weitergeleitet wurden.
- `sinceLastAudioMs`: Abstand zwischen dem letzten erfassten Sprecher-Audio-Frame und dem Schließen der Sprecher-Runde.

Häufige Muster:

- Sofortiges Abschneiden mit `source=active-speaker-audio`, kleinem `outputAudioMs` und demselben Benutzer in der Nähe weist normalerweise darauf hin, dass Lautsprecherecho ins Mikrofon gelangt. Erhöhen Sie `voice.realtime.minBargeInAudioEndMs`, verringern Sie die Lautsprecherlautstärke, verwenden Sie Kopfhörer oder setzen Sie `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`.
- `source=speaker-start` gefolgt von `speaker turn closed ... hasAudio=false` bedeutet, dass Discord einen Sprecherstart gemeldet hat, aber kein Audio OpenClaw erreicht hat. Das kann ein vorübergehendes Discord-Voice-Ereignis, Noise-Gate-Verhalten oder ein Client sein, der das Mikrofon kurz aktiviert.
- `audio playback stopped reason=stream-close` ohne nahegelegenes Barge-in oder `provider-clear-audio` bedeutet, dass der lokale Discord-Wiedergabestream unerwartet beendet wurde. Prüfen Sie die vorherigen Provider- und Discord-Player-Logs.
- `capture ignored during playback (barge-in disabled)` bedeutet, dass OpenClaw Eingaben absichtlich verworfen hat, während Assistenten-Audio aktiv war. Aktivieren Sie `voice.realtime.bargeIn`, wenn Sprache die Wiedergabe unterbrechen soll.
- `barge-in ignored ... outputActive=false` bedeutet, dass Discord oder Provider-VAD Sprache gemeldet hat, OpenClaw aber keine aktive Wiedergabe zum Unterbrechen hatte. Dies sollte Audio nicht abschneiden.

Anmeldedaten werden pro Komponente aufgelöst: LLM-Routen-Authentifizierung für `voice.model`, STT-Authentifizierung für `tools.media.audio`, TTS-Authentifizierung für `messages.tts`/`voice.tts` und Realtime-Provider-Authentifizierung für `voice.realtime.providers` oder die normale Authentifizierungskonfiguration des Providers.

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
  <Accordion title="Used disallowed intents or bot sees no guild messages">

    - Message Content Intent aktivieren
    - Server Members Intent aktivieren, wenn Sie von Benutzer-/Mitgliedsauflösung abhängen
    - Gateway nach dem Ändern von Intents neu starten

  </Accordion>

  <Accordion title="Guild messages blocked unexpectedly">

    - `groupPolicy` prüfen
    - Guild-Allowlist unter `channels.discord.guilds` prüfen
    - Wenn eine Guild-`channels`-Map existiert, sind nur aufgelistete Kanäle erlaubt
    - `requireMention`-Verhalten und Mention-Muster prüfen

    Nützliche Prüfungen:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false but still blocked">
    Häufige Ursachen:

    - `groupPolicy="allowlist"` ohne passende Guild-/Kanal-Allowlist
    - `requireMention` an der falschen Stelle konfiguriert (muss unter `channels.discord.guilds` oder dem Kanaleintrag stehen)
    - Absender durch Guild-/Kanal-`users`-Allowlist blockiert

  </Accordion>

  <Accordion title="Long-running Discord turns or duplicate replies">

    Typische Logs:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Discord-Gateway-Warteschlangen-Optionen:

    - Einzelkonto: `channels.discord.eventQueue.listenerTimeout`
    - Mehrkonto: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - Dies steuert nur die Listener-Arbeit des Discord-Gateway, nicht die Lebensdauer einer Agent-Runde

    Discord wendet kein kanal-eigenes Timeout auf eingereihte Agent-Runden an. Nachrichten-Listener übergeben sofort, und eingereihte Discord-Ausführungen bewahren die Reihenfolge pro Sitzung, bis der Sitzungs-/Tool-/Runtime-Lebenszyklus abgeschlossen ist oder die Arbeit abbricht.

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

  <Accordion title="Gateway metadata lookup timeout warnings">
    OpenClaw ruft Discord-`/gateway/bot`-Metadaten vor dem Verbindungsaufbau ab. Vorübergehende Fehler fallen auf die Standard-Gateway-URL von Discord zurück und werden in Logs ratenbegrenzt.

    Optionen für Metadaten-Timeouts:

    - Einzelkonto: `channels.discord.gatewayInfoTimeoutMs`
    - Mehrkonto: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - Env-Fallback, wenn die Konfiguration nicht gesetzt ist: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - Standard: `30000` (30 Sekunden), Maximum: `120000`

  </Accordion>

  <Accordion title="Gateway READY timeout restarts">
    OpenClaw wartet während des Starts und nach Runtime-Neuverbindungen auf das Discord-Gateway-`READY`-Ereignis. Mehrkonto-Setups mit gestaffeltem Start können ein längeres READY-Startfenster als den Standard benötigen.

    READY-Timeout-Optionen:

    - Start, Einzelkonto: `channels.discord.gatewayReadyTimeoutMs`
    - Start, Mehrkonto: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - Start-Env-Fallback, wenn die Konfiguration nicht gesetzt ist: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - Start-Standard: `15000` (15 Sekunden), Maximum: `120000`
    - Runtime, Einzelkonto: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - Runtime, Mehrkonto: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - Runtime-Env-Fallback, wenn die Konfiguration nicht gesetzt ist: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - Runtime-Standard: `30000` (30 Sekunden), Maximum: `120000`

  </Accordion>

  <Accordion title="Permissions audit mismatches">
    `channels status --probe`-Berechtigungsprüfungen funktionieren nur für numerische Kanal-IDs.

    Wenn Sie Slug-Schlüssel verwenden, kann das Runtime-Matching weiterhin funktionieren, aber Probe kann Berechtigungen nicht vollständig verifizieren.

  </Accordion>

  <Accordion title="DM and pairing issues">

    - DM deaktiviert: `channels.discord.dm.enabled=false`
    - DM-Richtlinie deaktiviert: `channels.discord.dmPolicy="disabled"` (Legacy: `channels.discord.dm.policy`)
    - wartet im Modus `pairing` auf Kopplungsgenehmigung

  </Accordion>

  <Accordion title="Bot to bot loops">
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

  <Accordion title="Voice STT drops with DecryptionFailed(...)">

    - halten Sie OpenClaw aktuell (`openclaw update`), damit die Wiederherstellungslogik für den Discord-Sprach-Empfang vorhanden ist
    - bestätigen Sie `channels.discord.voice.daveEncryption=true` (Standard)
    - beginnen Sie mit `channels.discord.voice.decryptionFailureTolerance=24` (Upstream-Standard) und passen Sie den Wert nur bei Bedarf an
    - überwachen Sie die Logs auf:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - wenn die Fehler nach dem automatischen erneuten Beitreten weiterhin auftreten, sammeln Sie Logs und vergleichen Sie sie mit der Upstream-DAVE-Empfangshistorie in [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) und [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Konfigurationsreferenz

Primäre Referenz: [Konfigurationsreferenz - Discord](/de/gateway/config-channels#discord).

<Accordion title="High-signal Discord fields">

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
- Funktionen: `threadBindings`, Top-Level-`bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## Sicherheit und Betrieb

- Behandeln Sie Bot-Token als Secrets (`DISCORD_BOT_TOKEN` wird in überwachten Umgebungen bevorzugt).
- Gewähren Sie Discord-Berechtigungen nach dem Prinzip der geringsten Rechte.
- Wenn Befehlsbereitstellung/-zustand veraltet ist, starten Sie den Gateway neu und prüfen Sie erneut mit `openclaw channels status --probe`.

## Verwandt

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/de/channels/pairing">
    Koppeln Sie einen Discord-Benutzer mit dem Gateway.
  </Card>
  <Card title="Groups" icon="users" href="/de/channels/groups">
    Verhalten von Gruppenchats und Allowlists.
  </Card>
  <Card title="Channel routing" icon="route" href="/de/channels/channel-routing">
    Leiten Sie eingehende Nachrichten an Agenten weiter.
  </Card>
  <Card title="Security" icon="shield" href="/de/gateway/security">
    Bedrohungsmodell und Härtung.
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/de/concepts/multi-agent">
    Ordnen Sie Guilds und Kanäle Agenten zu.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/de/tools/slash-commands">
    Natives Befehlsverhalten.
  </Card>
</CardGroup>
