---
read_when:
    - Werken aan functies voor het Discord-kanaal
summary: Ondersteuningsstatus, mogelijkheden en configuratie voor Discord-bots
title: Discord
x-i18n:
    generated_at: "2026-05-11T20:20:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 70107cf53c44f80e42f99f670aacf6eed8b77d839c05bccc853cd91a7273e5aa
    source_path: channels/discord.md
    workflow: 16
---

Klaar voor DM's en guild-kanalen via de officiële Discord Gateway.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/nl/channels/pairing">
    Discord-DM's staan standaard in koppelingsmodus.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/nl/tools/slash-commands">
    Native commandogedrag en commandocatalogus.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/nl/channels/troubleshooting">
    Cross-channel diagnostiek en herstelstroom.
  </Card>
</CardGroup>

## Snelle installatie

Je moet een nieuwe applicatie met een bot maken, de bot aan je server toevoegen en deze aan OpenClaw koppelen. We raden aan je bot aan je eigen privéserver toe te voegen. Als je er nog geen hebt, [maak er dan eerst een](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (kies **Create My Own > For me and my friends**).

<Steps>
  <Step title="Create a Discord application and bot">
    Ga naar de [Discord Developer Portal](https://discord.com/developers/applications) en klik op **New Application**. Geef deze een naam zoals "OpenClaw".

    Klik op **Bot** in de zijbalk. Stel **Username** in op hoe je je OpenClaw-agent noemt.

  </Step>

  <Step title="Enable privileged intents">
    Nog steeds op de pagina **Bot**, scrol omlaag naar **Privileged Gateway Intents** en schakel in:

    - **Message Content Intent** (vereist)
    - **Server Members Intent** (aanbevolen; vereist voor rol-allowlists en naam-naar-ID-koppeling)
    - **Presence Intent** (optioneel; alleen nodig voor aanwezigheidsupdates)

  </Step>

  <Step title="Copy your bot token">
    Scrol weer omhoog op de pagina **Bot** en klik op **Reset Token**.

    <Note>
    Ondanks de naam genereert dit je eerste token — er wordt niets "gereset".
    </Note>

    Kopieer het token en sla het ergens op. Dit is je **Bot Token** en je hebt het zo meteen nodig.

  </Step>

  <Step title="Generate an invite URL and add the bot to your server">
    Klik op **OAuth2** in de zijbalk. Je genereert een uitnodigings-URL met de juiste machtigingen om de bot aan je server toe te voegen.

    Scrol omlaag naar **OAuth2 URL Generator** en schakel in:

    - `bot`
    - `applications.commands`

    Er verschijnt hieronder een sectie **Bot Permissions**. Schakel ten minste in:

    **General Permissions**
      - Kanalen bekijken
    **Text Permissions**
      - Berichten verzenden
      - Berichtgeschiedenis lezen
      - Links insluiten
      - Bestanden bijvoegen
      - Reacties toevoegen (optioneel)

    Dit is de basisset voor normale tekstkanalen. Als je van plan bent in Discord-threads te posten, inclusief workflows voor forum- of mediakanalen die een thread maken of voortzetten, schakel dan ook **Send Messages in Threads** in.
    Kopieer de gegenereerde URL onderaan, plak deze in je browser, selecteer je server en klik op **Continue** om te verbinden. Je zou je bot nu in de Discord-server moeten zien.

  </Step>

  <Step title="Enable Developer Mode and collect your IDs">
    Terug in de Discord-app moet je Developer Mode inschakelen zodat je interne ID's kunt kopiëren.

    1. Klik op **User Settings** (tandwielpictogram naast je avatar) → **Advanced** → schakel **Developer Mode** in
    2. Rechtsklik op je **serverpictogram** in de zijbalk → **Copy Server ID**
    3. Rechtsklik op je **eigen avatar** → **Copy User ID**

    Sla je **Server ID** en **User ID** op naast je Bot Token — je stuurt ze alle drie in de volgende stap naar OpenClaw.

  </Step>

  <Step title="Allow DMs from server members">
    Voor koppelen moet Discord toestaan dat je bot je een DM stuurt. Rechtsklik op je **serverpictogram** → **Privacy Settings** → schakel **Direct Messages** in.

    Hiermee kunnen serverleden (inclusief bots) je DM's sturen. Laat dit ingeschakeld als je Discord-DM's met OpenClaw wilt gebruiken. Als je alleen guild-kanalen wilt gebruiken, kun je DM's na het koppelen uitschakelen.

  </Step>

  <Step title="Set your bot token securely (do not send it in chat)">
    Je Discord-bottoken is een geheim (zoals een wachtwoord). Stel het in op de machine waarop OpenClaw draait voordat je je agent een bericht stuurt.

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

    Als OpenClaw al als achtergrondservice draait, herstart het dan via de OpenClaw Mac-app of door het proces `openclaw gateway run` te stoppen en opnieuw te starten.
    Voor beheerde service-installaties voer je `openclaw gateway install` uit vanuit een shell waarin `DISCORD_BOT_TOKEN` aanwezig is, of sla je de variabele op in `~/.openclaw/.env`, zodat de service de env SecretRef na herstart kan oplossen.
    Als je host wordt geblokkeerd of rate-limited door Discord's applicatie-opzoeking bij het opstarten, stel dan de Discord-applicatie-/client-ID in vanuit de Developer Portal zodat het opstarten die REST-call kan overslaan. Gebruik `channels.discord.applicationId` voor het standaardaccount, of `channels.discord.accounts.<accountId>.applicationId` wanneer je meerdere Discord-bots gebruikt.

  </Step>

  <Step title="Configure OpenClaw and pair">

    <Tabs>
      <Tab title="Ask your agent">
        Chat met je OpenClaw-agent op een bestaand kanaal (bijv. Telegram) en vertel het hem. Als Discord je eerste kanaal is, gebruik dan in plaats daarvan het tabblad CLI / configuratie.

        > "Ik heb mijn Discord-bottoken al ingesteld in config. Rond de Discord-installatie af met User ID `<user_id>` en Server ID `<server_id>`."
      </Tab>
      <Tab title="CLI / config">
        Als je bestandsgebaseerde configuratie verkiest, stel dan in:

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

        Env-fallback voor het standaardaccount:

```bash
DISCORD_BOT_TOKEN=...
```

        Voor gescripte of externe installatie schrijf je hetzelfde JSON5-blok met `openclaw config patch --file ./discord.patch.json5 --dry-run` en voer je het daarna opnieuw uit zonder `--dry-run`. Platte-tekst `token`-waarden worden ondersteund. SecretRef-waarden worden ook ondersteund voor `channels.discord.token` via env/file/exec-providers. Zie [Geheimenbeheer](/nl/gateway/secrets).

        Voor meerdere Discord-bots bewaar je elk bottoken en elke applicatie-ID onder het bijbehorende account. Een top-level `channels.discord.applicationId` wordt overgenomen door accounts, dus stel die daar alleen in wanneer elk account dezelfde applicatie-ID moet gebruiken.

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

  <Step title="Approve first DM pairing">
    Wacht tot de Gateway draait en stuur je bot daarna een DM in Discord. Deze reageert met een koppelingscode.

    <Tabs>
      <Tab title="Ask your agent">
        Stuur de koppelingscode naar je agent op je bestaande kanaal:

        > "Keur deze Discord-koppelingscode goed: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    Koppelingscodes verlopen na 1 uur.

    Je zou nu met je agent in Discord via DM moeten kunnen chatten.

  </Step>
</Steps>

<Note>
Tokenresolutie is account-aware. Config-tokenwaarden hebben voorrang op env-fallback. `DISCORD_BOT_TOKEN` wordt alleen gebruikt voor het standaardaccount.
Als twee ingeschakelde Discord-accounts naar hetzelfde bottoken oplossen, start OpenClaw slechts één Gateway-monitor voor dat token. Een uit config afkomstig token heeft voorrang op de standaard env-fallback; anders wint het eerste ingeschakelde account en wordt het dubbele account als uitgeschakeld gerapporteerd.
Voor geavanceerde uitgaande calls (berichttool/kanaalacties) wordt een expliciet per-call `token` voor die call gebruikt. Dit geldt voor verzend- en lees-/probe-achtige acties (bijvoorbeeld read/search/fetch/thread/pins/permissions). Accountbeleid en retry-instellingen komen nog steeds uit het geselecteerde account in de actieve runtimesnapshot.
</Note>

## Aanbevolen: stel een guild-werkruimte in

Zodra DM's werken, kun je je Discord-server instellen als een volledige werkruimte waarin elk kanaal zijn eigen agentsessie met eigen context krijgt. Dit wordt aanbevolen voor privéservers waar alleen jij en je bot aanwezig zijn.

<Steps>
  <Step title="Add your server to the guild allowlist">
    Hierdoor kan je agent reageren in elk kanaal op je server, niet alleen in DM's.

    <Tabs>
      <Tab title="Ask your agent">
        > "Voeg mijn Discord Server ID `<server_id>` toe aan de guild-allowlist"
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

  <Step title="Allow responses without @mention">
    Standaard reageert je agent in guild-kanalen alleen wanneer hij met @ wordt genoemd. Voor een privéserver wil je waarschijnlijk dat hij op elk bericht reageert.

    In guild-kanalen blijven normale definitieve antwoorden van de assistent standaard privé. Zichtbare Discord-output moet expliciet met de tool `message` worden verzonden, zodat de agent standaard kan meekijken en alleen post wanneer hij besluit dat een kanaalantwoord nuttig is.

    Dit betekent dat het geselecteerde model betrouwbaar tools moet aanroepen. Als Discord typen toont en de logs tokengebruik laten zien maar er geen bericht wordt geplaatst, controleer dan de sessielog op assistenttekst met `didSendViaMessagingTool: false`. Dat betekent dat het model een privé definitief antwoord produceerde in plaats van `message(action=send)` aan te roepen. Schakel over naar een sterker tool-calling model, of gebruik de configuratie hieronder om legacy automatische definitieve antwoorden te herstellen.

    <Tabs>
      <Tab title="Ask your agent">
        > "Sta mijn agent toe op deze server te reageren zonder @mentioned te hoeven worden"
      </Tab>
      <Tab title="Config">
        Stel `requireMention: false` in je guild-configuratie in:

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

        Stel `messages.groupChat.visibleReplies: "automatic"` in om legacy automatische definitieve antwoorden voor groeps-/kanaalruimtes te herstellen.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Plan for memory in guild channels">
    Standaard wordt langetermijngeheugen (MEMORY.md) alleen geladen in DM-sessies. Guild-kanalen laden MEMORY.md niet automatisch.

    <Tabs>
      <Tab title="Ask your agent">
        > "Wanneer ik vragen stel in Discord-kanalen, gebruik memory_search of memory_get als je langetermijncontext uit MEMORY.md nodig hebt."
      </Tab>
      <Tab title="Manual">
        Als je gedeelde context in elk kanaal nodig hebt, zet de stabiele instructies dan in `AGENTS.md` of `USER.md` (ze worden voor elke sessie geïnjecteerd). Bewaar langetermijnnotities in `MEMORY.md` en raadpleeg ze op aanvraag met geheugentools.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Maak nu enkele kanalen op je Discord-server en begin met chatten. Je agent kan de kanaalnaam zien, en elk kanaal krijgt zijn eigen geïsoleerde sessie — dus je kunt `#coding`, `#home`, `#research` instellen, of wat ook bij je workflow past.

## Runtimemodel

- Gateway beheert de Discord-verbinding.
- Antwoordroutering is deterministisch: inkomende Discord-antwoorden gaan terug naar Discord.
- Discord-guild-/kanaalmetadata wordt toegevoegd aan de modelprompt als niet-vertrouwde
  context, niet als een voor gebruikers zichtbaar antwoordvoorvoegsel. Als een model die envelop
  terug kopieert, verwijdert OpenClaw de gekopieerde metadata uit uitgaande antwoorden en uit
  toekomstige replaycontext.
- Standaard (`session.dmScope=main`) delen directe chats de hoofdsessie van de agent (`agent:main:main`).
- Guild-kanalen zijn geisoleerde sessiesleutels (`agent:<agentId>:discord:channel:<channelId>`).
- Groeps-DM's worden standaard genegeerd (`channels.discord.dm.groupEnabled=false`).
- Native slash-commando's draaien in geisoleerde commandosessies (`agent:<agentId>:discord:slash:<userId>`), terwijl ze nog steeds `CommandTargetSessionKey` meenemen naar de gerouteerde gesprekssessie.
- Alleen-tekst cron-/Heartbeat-aankondigingslevering aan Discord gebruikt eenmaal het uiteindelijke
  voor de assistent zichtbare antwoord. Media en gestructureerde componentpayloads blijven
  meerdere berichten wanneer de agent meerdere leverbare payloads uitzendt.

## Forumkanalen

Discord-forum- en mediakanalen accepteren alleen threadberichten. OpenClaw ondersteunt twee manieren om ze aan te maken:

- Stuur een bericht naar de forumbovenliggende (`channel:<forumId>`) om automatisch een thread aan te maken. De threadtitel gebruikt de eerste niet-lege regel van je bericht.
- Gebruik `openclaw message thread create` om direct een thread aan te maken. Geef geen `--message-id` door voor forumkanalen.

Voorbeeld: stuur naar forumbovenliggende om een thread aan te maken

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Voorbeeld: maak expliciet een forumthread aan

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Forumbovenliggende accepteren geen Discord-componenten. Als je componenten nodig hebt, stuur dan naar de thread zelf (`channel:<threadId>`).

## Interactieve componenten

OpenClaw ondersteunt Discord components v2-containers voor agentberichten. Gebruik de berichttool met een `components`-payload. Interactieresultaten worden als normale inkomende berichten terug naar de agent gerouteerd en volgen de bestaande Discord-instellingen voor `replyToMode`.

Ondersteunde blokken:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Actierijen staan maximaal 5 knoppen of een enkel selectiemenu toe
- Selectietypen: `string`, `user`, `role`, `mentionable`, `channel`

Standaard zijn componenten eenmalig te gebruiken. Stel `components.reusable=true` in om knoppen, selecties en formulieren meerdere keren te kunnen gebruiken totdat ze verlopen.

Stel `allowedUsers` op die knop in om te beperken wie op een knop kan klikken (Discord-gebruikers-ID's, tags of `*`). Wanneer dit is geconfigureerd, ontvangen niet-overeenkomende gebruikers een ephemeral weigering.

De slash-commando's `/model` en `/models` openen een interactieve modelkiezer met dropdowns voor provider, model en compatibele runtime plus een verzendstap. `/models add` is verouderd en retourneert nu een verouderingsbericht in plaats van modellen vanuit chat te registreren. Het antwoord van de kiezer is ephemeral en alleen de aanroepende gebruiker kan het gebruiken. Discord-selectiemenu's zijn beperkt tot 25 opties, dus voeg `provider/*`-vermeldingen toe aan `agents.defaults.models` wanneer je wilt dat de kiezer dynamisch ontdekte modellen alleen toont voor geselecteerde providers zoals `openai-codex` of `vllm`.

Bestandsbijlagen:

- `file`-blokken moeten verwijzen naar een bijlagereferentie (`attachment://<filename>`)
- Lever de bijlage via `media`/`path`/`filePath` (enkel bestand); gebruik `media-gallery` voor meerdere bestanden
- Gebruik `filename` om de uploadnaam te overschrijven wanneer die moet overeenkomen met de bijlagereferentie

Modale formulieren:

- Voeg `components.modal` toe met maximaal 5 velden
- Veldtypen: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw voegt automatisch een triggerknop toe

Voorbeeld:

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

## Toegangscontrole en routering

<Tabs>
  <Tab title="DM policy">
    `channels.discord.dmPolicy` beheert DM-toegang. `channels.discord.allowFrom` is de canonieke DM-allowlist.

    - `pairing` (standaard)
    - `allowlist`
    - `open` (vereist dat `channels.discord.allowFrom` `"*"` bevat)
    - `disabled`

    Als DM-beleid niet open is, worden onbekende gebruikers geblokkeerd (of gevraagd om te koppelen in `pairing`-modus).

    Prioriteit bij meerdere accounts:

    - `channels.discord.accounts.default.allowFrom` geldt alleen voor het `default`-account.
    - Voor een account heeft `allowFrom` voorrang op legacy `dm.allowFrom`.
    - Benoemde accounts erven `channels.discord.allowFrom` wanneer hun eigen `allowFrom` en legacy `dm.allowFrom` niet zijn ingesteld.
    - Benoemde accounts erven `channels.discord.accounts.default.allowFrom` niet.

    Legacy `channels.discord.dm.policy` en `channels.discord.dm.allowFrom` worden nog steeds gelezen voor compatibiliteit. `openclaw doctor --fix` migreert ze naar `dmPolicy` en `allowFrom` wanneer dat kan zonder de toegang te wijzigen.

    DM-doelnotatie voor levering:

    - `user:<id>`
    - `<@id>`-vermelding

    Kale numerieke ID's worden normaal gesproken opgelost als kanaal-ID's wanneer een kanaalstandaard actief is, maar ID's die zijn opgenomen in de effectieve DM `allowFrom` van het account worden voor compatibiliteit behandeld als gebruikers-DM-doelen.

  </Tab>

  <Tab title="Access groups">
    Discord-DM's en tekstcommandoautorisatie kunnen dynamische `accessGroup:<name>`-vermeldingen gebruiken in `channels.discord.allowFrom`.

    Namen van toegangsgroepen worden gedeeld tussen berichtkanalen. Gebruik `type: "message.senders"` voor een statische groep waarvan de leden worden uitgedrukt in de normale `allowFrom`-syntaxis van elk kanaal, of `type: "discord.channelAudience"` wanneer het huidige `ViewChannel`-publiek van een Discord-kanaal het lidmaatschap dynamisch moet bepalen. Gedeeld gedrag van toegangsgroepen is hier gedocumenteerd: [Toegangsgroepen](/nl/channels/access-groups).

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

    Een Discord-tekstkanaal heeft geen aparte ledenlijst. `type: "discord.channelAudience"` modelleert lidmaatschap als: de DM-afzender is lid van de geconfigureerde guild en heeft momenteel effectieve `ViewChannel`-machtiging voor het geconfigureerde kanaal nadat rollen en kanaaloverschrijvingen zijn toegepast.

    Voorbeeld: sta iedereen die `#maintainers` kan zien toe om de bot te DM'en, terwijl DM's voor alle anderen gesloten blijven.

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

    Je kunt dynamische en statische vermeldingen combineren:

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

    Lookups falen gesloten. Als Discord `Missing Access` retourneert, de ledenlookup mislukt, of het kanaal bij een andere guild hoort, wordt de DM-afzender als niet-geautoriseerd behandeld.

    Schakel de Discord Developer Portal **Server Members Intent** voor de bot in wanneer je toegangsgroepen op basis van kanaalpubliek gebruikt. DM's bevatten geen guildlidstatus, dus OpenClaw lost het lid op via Discord REST op het moment van autorisatie.

  </Tab>

  <Tab title="Guild policy">
    Guild-afhandeling wordt beheerd door `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    Veilige baseline wanneer `channels.discord` bestaat is `allowlist`.

    Gedrag van `allowlist`:

    - guild moet overeenkomen met `channels.discord.guilds` (`id` aanbevolen, slug geaccepteerd)
    - optionele afzender-allowlists: `users` (stabiele ID's aanbevolen) en `roles` (alleen rol-ID's); als een van beide is geconfigureerd, zijn afzenders toegestaan wanneer ze overeenkomen met `users` OF `roles`
    - directe naam-/tagmatching is standaard uitgeschakeld; schakel `channels.discord.dangerouslyAllowNameMatching: true` alleen in als break-glass-compatibiliteitsmodus
    - namen/tags worden ondersteund voor `users`, maar ID's zijn veiliger; `openclaw security audit` waarschuwt wanneer naam-/tagvermeldingen worden gebruikt
    - als een guild `channels` heeft geconfigureerd, worden niet-vermelde kanalen geweigerd
    - als een guild geen `channels`-blok heeft, zijn alle kanalen in die allowlisted guild toegestaan

    Voorbeeld:

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

    Als je alleen `DISCORD_BOT_TOKEN` instelt en geen `channels.discord`-blok aanmaakt, is de runtimefallback `groupPolicy="allowlist"` (met een waarschuwing in logs), zelfs als `channels.defaults.groupPolicy` `open` is.

  </Tab>

  <Tab title="Mentions and group DMs">
    Guild-berichten zijn standaard door vermeldingen afgeschermd.

    Vermeldingsdetectie omvat:

    - expliciete botvermelding
    - geconfigureerde vermeldingspatronen (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - impliciet antwoord-op-bot-gedrag in ondersteunde gevallen

    Gebruik canonieke vermeldingssyntaxis bij het schrijven van uitgaande Discord-berichten: `<@USER_ID>` voor gebruikers, `<#CHANNEL_ID>` voor kanalen en `<@&ROLE_ID>` voor rollen. Gebruik niet de legacy bijnaamvermeldingsvorm `<@!USER_ID>`.

    `requireMention` wordt per guild/kanaal geconfigureerd (`channels.discord.guilds...`).
    `ignoreOtherMentions` laat optioneel berichten vallen die een andere gebruiker/rol noemen maar niet de bot (met uitzondering van @everyone/@here).

    Groeps-DM's:

    - standaard: genegeerd (`dm.groupEnabled=false`)
    - optionele allowlist via `dm.groupChannels` (kanaal-ID's of slugs)

  </Tab>
</Tabs>

### Rolgebaseerde agentroutering

Gebruik `bindings[].match.roles` om Discord-guildleden op basis van rol-ID naar verschillende agents te routeren. Rolgebaseerde bindings accepteren alleen rol-ID's en worden geevalueerd na peer- of parent-peer-bindings en voor guild-only-bindings. Als een binding ook andere matchvelden instelt (bijvoorbeeld `peer` + `guildId` + `roles`), moeten alle geconfigureerde velden overeenkomen.

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

## Native commando's en commando-auth

- `commands.native` is standaard `"auto"` en is ingeschakeld voor Discord.
- Override per kanaal: `channels.discord.commands.native`.
- `commands.native=false` slaat Discord-slashcommandregistratie en opschoning tijdens het opstarten over. Eerder geregistreerde commando's kunnen zichtbaar blijven in Discord totdat je ze uit de Discord-app verwijdert.
- Native commando-auth gebruikt dezelfde Discord-allowlists/beleidsregels als normale berichtverwerking.
- Commando's kunnen nog steeds zichtbaar zijn in de Discord-UI voor gebruikers die niet zijn geautoriseerd; uitvoering dwingt nog steeds OpenClaw-auth af en retourneert "not authorized".

Zie [Slashcommands](/nl/tools/slash-commands) voor de commandocatalogus en het gedrag.

Standaardinstellingen voor slashcommands:

- `ephemeral: true`

## Functiedetails

<AccordionGroup>
  <Accordion title="Antwoordtags en native antwoorden">
    Discord ondersteunt antwoordtags in agentuitvoer:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Beheerd door `channels.discord.replyToMode`:

    - `off` (standaard)
    - `first`
    - `all`
    - `batched`

    Opmerking: `off` schakelt impliciete antwoordthreading uit. Expliciete `[[reply_to_*]]`-tags worden nog steeds gerespecteerd.
    `first` koppelt de impliciete native antwoordverwijzing altijd aan het eerste uitgaande Discord-bericht voor de beurt.
    `batched` koppelt de impliciete native antwoordverwijzing van Discord alleen wanneer de
    inkomende beurt een gedebouncete batch van meerdere berichten was. Dit is nuttig
    wanneer je native antwoorden vooral wilt voor ambigue, korte berichtsalvo's, niet voor elke
    beurt met één bericht.

    Bericht-ID's worden beschikbaar gemaakt in context/geschiedenis zodat agents specifieke berichten kunnen targeten.

  </Accordion>

  <Accordion title="Live streamvoorbeeld">
    OpenClaw kan conceptantwoorden streamen door een tijdelijk bericht te verzenden en dit te bewerken zodra tekst binnenkomt. `channels.discord.streaming` accepteert `off` | `partial` | `block` | `progress` (standaard). `progress` houdt één bewerkbaar statusconcept bij en werkt dit bij met toolvoortgang tot de uiteindelijke aflevering; het gedeelde startlabel is een doorlopende regel, zodat die net als de rest wegscrollt zodra er genoeg werk verschijnt. `streamMode` is een verouderde runtime-alias. Voer `openclaw doctor --fix` uit om opgeslagen configuratie te herschrijven naar de canonieke sleutel.

    Stel `channels.discord.streaming.mode` in op `off` om Discord-voorbeeldbewerkingen uit te schakelen. Als Discord-blokstreaming expliciet is ingeschakeld, slaat OpenClaw de voorbeeldstream over om dubbel streamen te voorkomen.

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

    - `partial` bewerkt één voorbeeldbericht terwijl tokens binnenkomen.
    - `block` verzendt conceptgrote stukken (gebruik `draftChunk` om grootte en breekpunten af te stemmen, begrensd tot `textChunkLimit`).
    - Media, fouten en finales met expliciete antwoorden annuleren openstaande voorbeeldbewerkingen.
    - `streaming.preview.toolProgress` (standaard `true`) bepaalt of tool-/voortgangsupdates het voorbeeldbericht hergebruiken.
    - Tool-/voortgangsrijen worden weergegeven als compacte emoji + titel + detail wanneer beschikbaar, bijvoorbeeld `🛠️ Bash: run tests` of `🔎 Web Search: for "query"`.
    - `streaming.preview.commandText` / `streaming.progress.commandText` beheert commando-/exec-details in compacte voortgangsregels: `raw` (standaard) of `status` (alleen toollabel).

    Verberg ruwe commando-/exec-tekst terwijl compacte voortgangsregels behouden blijven:

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

    Voorbeeldstreaming is alleen tekst; media-antwoorden vallen terug op normale aflevering. Wanneer `block`-streaming expliciet is ingeschakeld, slaat OpenClaw de voorbeeldstream over om dubbel streamen te voorkomen.

  </Accordion>

  <Accordion title="Geschiedenis, context en threadgedrag">
    Guild-geschiedeniscontext:

    - `channels.discord.historyLimit` standaard `20`
    - fallback: `messages.groupChat.historyLimit`
    - `0` schakelt uit

    DM-geschiedenisinstellingen:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Threadgedrag:

    - Discord-threads routeren als kanaalsessies en erven de configuratie van het bovenliggende kanaal, tenzij overschreven.
    - Threadsessies erven de sessieniveau-`/model`-selectie van het bovenliggende kanaal als alleen-model-fallback; threadlokale `/model`-selecties hebben nog steeds voorrang en de transcriptgeschiedenis van de parent wordt niet gekopieerd tenzij transcriptovererving is ingeschakeld.
    - `channels.discord.thread.inheritParent` (standaard `false`) laat nieuwe auto-threads zaaien vanuit het parenttranscript. Overrides per account staan onder `channels.discord.accounts.<id>.thread.inheritParent`.
    - Reacties van berichttools kunnen `user:<id>`-DM-targets oplossen.
    - `guilds.<guild>.channels.<channel>.requireMention: false` wordt behouden tijdens de fallback voor activering in de antwoordfase.

    Kanaalonderwerpen worden geïnjecteerd als **niet-vertrouwde** context. Allowlists bepalen wie de agent kan activeren, niet een volledige redactiegrens voor aanvullende context.

  </Accordion>

  <Accordion title="Threadgebonden sessies voor subagents">
    Discord kan een thread aan een sessietarget koppelen zodat vervolgberichten in die thread naar dezelfde sessie blijven routeren (inclusief subagentsessies).

    Commando's:

    - `/focus <target>` bind huidige/nieuwe thread aan een subagent-/sessietarget
    - `/unfocus` verwijder huidige threadbinding
    - `/agents` toon actieve runs en bindingsstatus
    - `/session idle <duration|off>` inspecteer/update inactiviteits-auto-unfocus voor gefocuste bindingen
    - `/session max-age <duration|off>` inspecteer/update harde maximale leeftijd voor gefocuste bindingen

    Configuratie:

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

    Opmerkingen:

    - `session.threadBindings.*` stelt globale standaardwaarden in.
    - `channels.discord.threadBindings.*` overschrijft Discord-gedrag.
    - `spawnSessions` beheert automatisch threads maken/binden voor `sessions_spawn({ thread: true })` en ACP-threadspawns. Standaard: `true`.
    - `defaultSpawnContext` beheert native subagentcontext voor threadgebonden spawns. Standaard: `"fork"`.
    - Verouderde sleutels `spawnSubagentSessions`/`spawnAcpSessions` worden gemigreerd door `openclaw doctor --fix`.
    - Als threadbindingen zijn uitgeschakeld voor een account, zijn `/focus` en gerelateerde threadbindingsbewerkingen niet beschikbaar.

    Zie [Subagents](/nl/tools/subagents), [ACP Agents](/nl/tools/acp-agents) en [Configuratiereferentie](/nl/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Persistente ACP-kanaalbindingen">
    Configureer voor stabiele, altijd actieve ACP-werkruimten top-level getypeerde ACP-bindingen die Discord-gesprekken targeten.

    Configuratiepad:

    - `bindings[]` met `type: "acp"` en `match.channel: "discord"`

    Voorbeeld:

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

    Opmerkingen:

    - `/acp spawn codex --bind here` bindt het huidige kanaal of de huidige thread op zijn plaats en houdt toekomstige berichten op dezelfde ACP-sessie. Threadberichten erven de binding van het bovenliggende kanaal.
    - In een gebonden kanaal of gebonden thread resetten `/new` en `/reset` dezelfde ACP-sessie op zijn plaats. Tijdelijke threadbindingen kunnen targetresolutie overschrijven zolang ze actief zijn.
    - `spawnSessions` begrenst het maken/binden van childthreads via `--thread auto|here`.

    Zie [ACP Agents](/nl/tools/acp-agents) voor details over bindingsgedrag.

  </Accordion>

  <Accordion title="Reactiemeldingen">
    Reactiemeldingsmodus per guild:

    - `off`
    - `own` (standaard)
    - `all`
    - `allowlist` (gebruikt `guilds.<id>.users`)

    Reactiegebeurtenissen worden omgezet in systeemgebeurtenissen en gekoppeld aan de gerouteerde Discord-sessie.

  </Accordion>

  <Accordion title="Ack-reacties">
    `ackReaction` verzendt een bevestigingsemoji terwijl OpenClaw een inkomend bericht verwerkt.

    Resolutievolgorde:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - fallback naar emoji voor agentidentiteit (`agents.list[].identity.emoji`, anders "👀")

    Opmerkingen:

    - Discord accepteert Unicode-emoji of namen van aangepaste emoji.
    - Gebruik `""` om de reactie voor een kanaal of account uit te schakelen.

  </Accordion>

  <Accordion title="Configuratieschrijfacties">
    Door kanaal geïnitieerde configuratieschrijfacties zijn standaard ingeschakeld.

    Dit beïnvloedt `/config set|unset`-flows (wanneer commandofuncties zijn ingeschakeld).

    Uitschakelen:

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

  <Accordion title="Gateway-proxy">
    Routeer Discord Gateway-WebSocketverkeer en REST-lookups bij het opstarten (application ID + allowlistresolutie) via een HTTP(S)-proxy met `channels.discord.proxy`.

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    Override per account:

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

  <Accordion title="PluralKit-ondersteuning">
    Schakel PluralKit-resolutie in om proxied berichten te koppelen aan de identiteit van een systeemlid:

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

    Opmerkingen:

    - allowlists kunnen `pk:<memberId>` gebruiken
    - weergavenamen van leden worden alleen op naam/slug gematcht wanneer `channels.discord.dangerouslyAllowNameMatching: true`
    - lookups gebruiken de oorspronkelijke bericht-ID en zijn beperkt door een tijdvenster
    - als lookup mislukt, worden proxied berichten behandeld als botberichten en genegeerd tenzij `allowBots=true`

  </Accordion>

  <Accordion title="Uitgaande vermeldingsaliassen">
    Gebruik `mentionAliases` wanneer agents deterministische uitgaande vermeldingen nodig hebben voor bekende Discord-gebruikers. Sleutels zijn handles zonder de voorafgaande `@`; waarden zijn Discord-gebruikers-ID's. Onbekende handles, `@everyone`, `@here` en vermeldingen in Markdown-codespans blijven ongewijzigd.

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

  <Accordion title="Aanwezigheidsconfiguratie">
    Aanwezigheidsupdates worden toegepast wanneer je een status- of activiteitsveld instelt, of wanneer je automatische aanwezigheid inschakelt.

    Voorbeeld met alleen status:

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    Activiteitsvoorbeeld (aangepaste status is het standaardactiviteitstype):

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

    Streamingvoorbeeld:

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

    Activiteitstypetoewijzing:

    - 0: Spelen
    - 1: Streamen (vereist `activityUrl`)
    - 2: Luisteren
    - 3: Kijken
    - 4: Aangepast (gebruikt de activiteitstekst als statusstatus; emoji is optioneel)
    - 5: Deelnemen

    Voorbeeld van automatische aanwezigheid (runtime-gezondheidssignaal):

```json5
{
  channels: {
    discord: {
      autoPresence: {
        enabled: true,
        intervalMs: 30000,
        minUpdateIntervalMs: 15000,
        exhaustedText: "token uitgeput",
      },
    },
  },
}
```

    Automatische aanwezigheid koppelt runtime-beschikbaarheid aan Discord-status: gezond => online, verslechterd of onbekend => inactief, uitgeput of niet beschikbaar => dnd. Optionele tekstoverschrijvingen:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (ondersteunt `{reason}`-placeholder)

  </Accordion>

  <Accordion title="Goedkeuringen in Discord">
    Discord ondersteunt knopgebaseerde afhandeling van goedkeuringen in DM's en kan optioneel goedkeuringsprompts plaatsen in het oorspronkelijke kanaal.

    Configuratiepad:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (optioneel; valt waar mogelijk terug op `commands.ownerAllowFrom`)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, standaard: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord schakelt native exec-goedkeuringen automatisch in wanneer `enabled` niet is ingesteld of `"auto"` is en ten minste één goedkeurder kan worden opgelost, hetzij vanuit `execApprovals.approvers`, hetzij vanuit `commands.ownerAllowFrom`. Discord leidt exec-goedkeurders niet af uit kanaal-`allowFrom`, legacy `dm.allowFrom` of direct-message `defaultTo`. Stel `enabled: false` in om Discord expliciet uit te schakelen als native goedkeuringsclient.

    Voor gevoelige owner-only groepsopdrachten zoals `/diagnostics` en `/export-trajectory` stuurt OpenClaw goedkeuringsprompts en eindresultaten privé. Het probeert eerst Discord-DM wanneer de aanroepende eigenaar een Discord-eigenaarroute heeft; als die niet beschikbaar is, valt het terug op de eerste beschikbare eigenaarroute uit `commands.ownerAllowFrom`, zoals Telegram.

    Wanneer `target` `channel` of `both` is, is de goedkeuringsprompt zichtbaar in het kanaal. Alleen opgeloste goedkeurders kunnen de knoppen gebruiken; andere gebruikers ontvangen een ephemeral weigering. Goedkeuringsprompts bevatten de opdrachttekst, dus schakel kanaalbezorging alleen in vertrouwde kanalen in. Als de kanaal-ID niet uit de sessiesleutel kan worden afgeleid, valt OpenClaw terug op DM-bezorging.

    Discord rendert ook de gedeelde goedkeuringsknoppen die door andere chatkanalen worden gebruikt. De native Discord-adapter voegt vooral DM-routering voor goedkeurders en kanaalfanout toe.
    Wanneer die knoppen aanwezig zijn, vormen zij de primaire goedkeurings-UX; OpenClaw
    moet alleen een handmatige `/approve`-opdracht opnemen wanneer het toolresultaat zegt
    dat chatgoedkeuringen niet beschikbaar zijn of handmatige goedkeuring de enige route is.
    Als de native goedkeuringsruntime van Discord niet actief is, houdt OpenClaw de
    lokale deterministische `/approve <id> <decision>`-prompt zichtbaar. Als de
    runtime actief is maar een native kaart niet aan een doel kan worden bezorgd,
    stuurt OpenClaw een fallbackmelding in dezelfde chat met de exacte `/approve`-
    opdracht uit de wachtende goedkeuring.

    Gateway-authenticatie en goedkeuringsresolutie volgen het gedeelde Gateway-clientcontract (`plugin:`-ID's worden opgelost via `plugin.approval.resolve`; andere ID's via `exec.approval.resolve`). Goedkeuringen verlopen standaard na 30 minuten.

    Zie [Exec-goedkeuringen](/nl/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Tools en actiepoorten

Discord-berichtacties omvatten berichten, kanaalbeheer, moderatie, aanwezigheid en metadata-acties.

Kernvoorbeelden:

- berichten: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- reacties: `react`, `reactions`, `emojiList`
- moderatie: `timeout`, `kick`, `ban`
- aanwezigheid: `setPresence`

De actie `event-create` accepteert een optionele parameter `image` (URL of lokaal bestandspad) om de omslagafbeelding van de geplande gebeurtenis in te stellen.

Actiepoorten bevinden zich onder `channels.discord.actions.*`.

Standaardgedrag van poorten:

| Actiegroep                                                                                                                                                              | Standaard    |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| reacties, berichten, threads, pins, polls, zoeken, memberInfo, roleInfo, channelInfo, kanalen, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | ingeschakeld |
| roles                                                                                                                                                                   | uitgeschakeld |
| moderatie                                                                                                                                                              | uitgeschakeld |
| aanwezigheid                                                                                                                                                            | uitgeschakeld |

## Components v2-UI

OpenClaw gebruikt Discord components v2 voor exec-goedkeuringen en cross-context-markeringen. Discord-berichtacties kunnen ook `components` accepteren voor aangepaste UI (geavanceerd; vereist het construeren van een componentpayload via de discord-tool), terwijl legacy `embeds` beschikbaar blijven maar niet worden aanbevolen.

- `channels.discord.ui.components.accentColor` stelt de accentkleur in die wordt gebruikt door Discord-componentcontainers (hex).
- Stel per account in met `channels.discord.accounts.<id>.ui.components.accentColor`.
- `embeds` worden genegeerd wanneer components v2 aanwezig zijn.

Voorbeeld:

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

## Spraak

Discord heeft twee afzonderlijke spraakoppervlakken: realtime **spraakkanalen** (doorlopende gesprekken) en **spraakberichtbijlagen** (de golfvormpreview-indeling). De gateway ondersteunt beide.

### Spraakkanalen

Installatiechecklist:

1. Schakel Message Content Intent in de Discord Developer Portal in.
2. Schakel Server Members Intent in wanneer allowlists voor rollen/gebruikers worden gebruikt.
3. Nodig de bot uit met de scopes `bot` en `applications.commands`.
4. Verleen Connect, Speak, Send Messages en Read Message History in het doelspraakkanaal.
5. Schakel native opdrachten in (`commands.native` of `channels.discord.commands.native`).
6. Configureer `channels.discord.voice`.

Gebruik `/vc join|leave|status` om sessies te beheren. De opdracht gebruikt de standaardagent van het account en volgt dezelfde allowlist- en groepsbeleidsregels als andere Discord-opdrachten.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

Voer het volgende uit om de effectieve machtigingen van de bot te inspecteren voordat je toetreedt:

```bash
openclaw channels capabilities --channel discord --target channel:<voice-channel-id>
```

Voorbeeld van automatisch toetreden:

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

Opmerkingen:

- `voice.tts` overschrijft `messages.tts` alleen voor `stt-tts`-stemweergave. Realtime-modi gebruiken `voice.realtime.voice`.
- `voice.mode` bepaalt het gesprekspad. De standaardwaarde is `agent-proxy`: een realtime voice-front-end verwerkt beurt-timing, onderbreking en weergave, delegeert inhoudelijk werk aan de gerouteerde OpenClaw-agent via `openclaw_agent_consult`, en behandelt het resultaat als een getypte Discord-prompt van die spreker. `stt-tts` behoudt de oudere batch-STT plus TTS-stroom. Met `bidi` kan het realtime-model rechtstreeks converseren terwijl `openclaw_agent_consult` beschikbaar blijft voor het OpenClaw-brein.
- `voice.agentSession` bepaalt welk OpenClaw-gesprek stembeurten ontvangt. Laat dit ongezet voor de eigen sessie van het spraakkanaal, of stel `{ mode: "target", target: "channel:<text-channel-id>" }` in om het spraakkanaal te laten fungeren als microfoon-/luidsprekeruitbreiding van een bestaande Discord-tekstkanaalsessie zoals `#maintainers`.
- `voice.model` overschrijft het OpenClaw-agentbrein voor Discord-stemreacties en realtime-consults. Laat dit ongezet om het gerouteerde agentmodel te erven. Het staat los van `voice.realtime.model`.
- `agent-proxy` routeert spraak via `discord-voice`, waardoor de normale eigenaar-/toolautorisatie voor de spreker en doelsessie behouden blijft, maar de agenttool `tts` wordt verborgen omdat Discord voice eigenaar is van de weergave. Standaard geeft `agent-proxy` de consult volledige eigenaar-equivalente tooltoegang voor eigenaars-sprekers (`voice.realtime.toolPolicy: "owner"`) en geeft het sterk de voorkeur aan het raadplegen van de OpenClaw-agent vóór inhoudelijke antwoorden (`voice.realtime.consultPolicy: "always"`). In die standaardmodus `always` spreekt de realtime-laag niet automatisch opvulling uit vóór het consultantwoord; deze legt spraak vast en transcribeert die, en spreekt daarna het gerouteerde OpenClaw-antwoord uit. Als meerdere afgedwongen consultantwoorden klaar zijn terwijl Discord nog steeds het eerste antwoord afspeelt, worden latere antwoorden met exacte spraak in een wachtrij gezet totdat de weergave inactief is, in plaats van spraak midden in een zin te vervangen.
- In de modus `stt-tts` gebruikt STT `tools.media.audio`; `voice.model` heeft geen invloed op transcriptie.
- In realtime-modi configureren `voice.realtime.provider`, `voice.realtime.model` en `voice.realtime.voice` de realtime-audiosessie. Gebruik voor OpenAI Realtime 2 plus het Codex-brein `voice.realtime.model: "gpt-realtime-2"` en `voice.model: "openai-codex/gpt-5.5"`.
- De realtime-provider van OpenAI accepteert huidige Realtime 2-gebeurtenisnamen en legacy Codex-compatibele aliassen voor uitvoeraudio- en transcriptgebeurtenissen, zodat compatibele providersnapshots kunnen verschuiven zonder assistentaudio te laten wegvallen.
- `voice.realtime.bargeIn` bepaalt of spreker-startgebeurtenissen van Discord actieve realtime-weergave onderbreken. Als dit ongezet is, volgt het de instelling voor input-audio-onderbreking van de realtime-provider.
- `voice.realtime.minBargeInAudioEndMs` bepaalt de minimale duur van assistentweergave voordat een OpenAI realtime-barge-in audio afkapt. Standaard: `250`. Stel `0` in voor onmiddellijke onderbreking in ruimtes met weinig echo, of verhoog dit voor luidsprekeropstellingen met veel echo.
- Stel voor een OpenAI-stem bij Discord-weergave `voice.tts.provider: "openai"` in en kies een Text-to-speech-stem onder `voice.tts.openai.voice` of `voice.tts.providers.openai.voice`. `cedar` is een goede mannelijk klinkende keuze op het huidige OpenAI TTS-model.
- Per-kanaal Discord-overschrijvingen voor `systemPrompt` zijn van toepassing op stemtranscriptbeurten voor dat spraakkanaal.
- Stemtranscriptbeurten leiden de eigenaarsstatus af van Discord `allowFrom` (of `dm.allowFrom`); niet-eigenaarsprekers hebben geen toegang tot tools die alleen voor eigenaars zijn (bijvoorbeeld `gateway` en `cron`).
- Discord voice is opt-in voor tekst-only configuraties; stel `channels.discord.voice.enabled=true` in (of behoud een bestaand `channels.discord.voice`-blok) om `/vc`-opdrachten, de voice-runtime en de `GuildVoiceStates` Gateway-intent in te schakelen.
- `channels.discord.intents.voiceStates` kan het abonnement op de voice-state-intent expliciet overschrijven. Laat dit ongezet zodat de intent de effectieve voice-inschakeling volgt.
- Als `voice.autoJoin` meerdere items voor dezelfde guild heeft, sluit OpenClaw aan bij het laatst geconfigureerde kanaal voor die guild.
- `voice.allowedChannels` is een optionele allowlist voor verblijf. Laat dit ongezet om `/vc join` toe te staan in elk geautoriseerd Discord-spraakkanaal. Wanneer dit is ingesteld, zijn `/vc join`, automatisch aansluiten bij opstarten en verplaatsingen van de bot-voice-state beperkt tot de vermelde `{ guildId, channelId }`-items. Stel dit in op een lege array om alle Discord voice-joins te weigeren. Als Discord de bot buiten de allowlist verplaatst, verlaat OpenClaw dat kanaal en sluit het opnieuw aan bij het geconfigureerde auto-join-doel wanneer er een beschikbaar is.
- `voice.daveEncryption` en `voice.decryptionFailureTolerance` worden doorgegeven aan de join-opties van `@discordjs/voice`.
- De standaardwaarden van `@discordjs/voice` zijn `daveEncryption=true` en `decryptionFailureTolerance=24` als ze ongezet zijn.
- OpenClaw gebruikt standaard de pure-JS `opusscript`-decoder voor het ontvangen van Discord voice. Het optionele native pakket `@discordjs/opus` wordt genegeerd door het pnpm-installatiebeleid van de repo, zodat normale installaties, Docker-lanes en niet-gerelateerde tests geen native addon compileren. Toegewijde hosts voor voice-performance kunnen opt-in gebruiken met `OPENCLAW_DISCORD_OPUS_DECODER=native` nadat de native addon is geïnstalleerd.
- `voice.connectTimeoutMs` bepaalt de initiële `@discordjs/voice` Ready-wachttijd voor `/vc join` en auto-join-pogingen. Standaard: `30000`.
- `voice.reconnectGraceMs` bepaalt hoelang OpenClaw wacht totdat een verbroken voicesessie opnieuw begint te verbinden voordat deze wordt vernietigd. Standaard: `15000`.
- In de modus `stt-tts` stopt stemweergave niet alleen omdat een andere gebruiker begint te spreken. Om feedbackloops te voorkomen, negeert OpenClaw nieuwe stemopname terwijl TTS wordt afgespeeld; spreek nadat de weergave is voltooid voor de volgende beurt. Realtime-modi sturen spreker-startsignalen door als barge-in-signalen naar de realtime-provider.
- In realtime-modi kan echo van luidsprekers in een open microfoon lijken op barge-in en weergave onderbreken. Stel voor Discord-ruimtes met veel echo `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` in om te voorkomen dat OpenAI automatisch onderbreekt bij input-audio. Voeg `voice.realtime.bargeIn: true` toe als je nog steeds wilt dat spreker-startgebeurtenissen van Discord actieve weergave onderbreken. De OpenAI realtime-bridge negeert afkappingen van weergave die korter zijn dan `voice.realtime.minBargeInAudioEndMs` als waarschijnlijke echo/ruis en logt ze als overgeslagen in plaats van Discord-weergave te wissen.
- `voice.captureSilenceGraceMs` bepaalt hoelang OpenClaw wacht nadat Discord meldt dat een spreker is gestopt voordat dat audiosegment voor STT wordt afgerond. Standaard: `2500`; verhoog dit als Discord normale pauzes opsplitst in haperige gedeeltelijke transcripties.
- Wanneer ElevenLabs de geselecteerde TTS-provider is, gebruikt Discord-stemweergave streaming-TTS en start deze vanuit de providerresponsstream. Providers zonder streamingondersteuning vallen terug op het pad met een gesynthetiseerd tijdelijk bestand.
- OpenClaw bewaakt ook decryptiefouten bij ontvangst en herstelt automatisch door het spraakkanaal te verlaten en opnieuw te joinen na herhaalde fouten binnen een kort tijdsvenster.
- Als ontvangstlogs na een update herhaaldelijk `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` tonen, verzamel dan een dependencyrapport en logs. De gebundelde `@discordjs/voice`-lijn bevat de upstream padding-fix uit discord.js PR #11449, waarmee discord.js issue #11419 werd gesloten.
- Ontvangstgebeurtenissen `The operation was aborted` worden verwacht wanneer OpenClaw een vastgelegd sprekersegment afrondt; het zijn uitgebreide diagnostische meldingen, geen waarschuwingen.
- Uitgebreide Discord voice-logs bevatten een begrensde eenregelige STT-transcriptpreview voor elk geaccepteerd sprekersegment, zodat debugging zowel de gebruikerskant als de agentantwoordkant toont zonder onbeperkte transcripttekst te dumpen.
- In de modus `agent-proxy` slaat afgedwongen consultfallback waarschijnlijk onvolledige transcriptfragmenten over, zoals tekst die eindigt op `...` of een afsluitende connector zoals `and`, plus duidelijk niet-actiegerichte afsluitingen zoals “be right back” of “bye”. Logs tonen `forced agent consult skipped reason=...` wanneer dit een verouderd antwoord in de wachtrij voorkomt.

Native opus-installatie voor source-checkouts:

```bash
pnpm install
mise exec node@22 -- pnpm discord:opus:install
```

Gebruik Node 22 voor de Gateway wanneer je de upstream macOS arm64 vooraf gebouwde native addon wilt. Als je een andere Node-runtime gebruikt, kan de opt-in-installer een lokale `node-gyp` source-build-toolchain nodig hebben.

Start na installatie van de native addon de Gateway met:

```bash
OPENCLAW_DISCORD_OPUS_DECODER=native pnpm gateway:watch
```

Uitgebreide voice-logs zouden `discord voice: opus decoder: @discordjs/opus` moeten tonen. Zonder de env-opt-in, of als de native addon ontbreekt of niet op de host kan laden, logt OpenClaw `discord voice: opus decoder: opusscript` en blijft het voice ontvangen via de pure-JS fallback.

STT plus TTS-pijplijn:

- Discord PCM-opname wordt geconverteerd naar een tijdelijk WAV-bestand.
- `tools.media.audio` verwerkt STT, bijvoorbeeld `openai/gpt-4o-mini-transcribe`.
- Het transcript wordt via Discord-ingress en routering verzonden terwijl de response-LLM draait met een voice-outputbeleid dat de agenttool `tts` verbergt en om teruggegeven tekst vraagt, omdat Discord voice eigenaar is van de uiteindelijke TTS-weergave.
- `voice.model`, wanneer ingesteld, overschrijft alleen de response-LLM voor deze spraakkanaalbeurt.
- `voice.tts` wordt over `messages.tts` samengevoegd; providers met streamingmogelijkheden voeden de speler rechtstreeks, anders wordt het resulterende audiobestand afgespeeld in het gejoinde kanaal.

Standaardvoorbeeld van een agent-proxy-spraakkanaalsessie:

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

Zonder `voice.agentSession`-blok krijgt elk spraakkanaal zijn eigen gerouteerde OpenClaw-sessie. Bijvoorbeeld, `/vc join channel:234567890123456789` praat met de sessie voor dat Discord-spraakkanaal. Het realtime-model is alleen de voice-front-end; inhoudelijke verzoeken worden doorgegeven aan de geconfigureerde OpenClaw-agent. Als het realtime-model een definitief transcript produceert zonder de consulttool aan te roepen, dwingt OpenClaw het consult af als fallback, zodat de standaard nog steeds werkt alsof je met de agent praat.

Legacy STT plus TTS-voorbeeld:

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

Realtime bidi-voorbeeld:

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

Voice als uitbreiding van een bestaande Discord-kanaalsessie:

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

In de modus `agent-proxy` joint de bot het geconfigureerde spraakkanaal, maar OpenClaw-agentbeurten gebruiken de normale gerouteerde sessie en agent van het doelkanaal. De realtime-voicesessie spreekt het teruggegeven resultaat terug in het spraakkanaal. De supervisor-agent kan nog steeds normale berichttools gebruiken volgens zijn toolbeleid, inclusief het verzenden van een apart Discord-bericht als dat de juiste actie is.

Nuttige doelvormen:

- `target: "channel:123456789012345678"` routeert via een Discord-tekstkanaalsessie.
- `target: "123456789012345678"` wordt behandeld als kanaaldoel.
- `target: "dm:123456789012345678"` of `target: "user:123456789012345678"` routeert via die direct-message-sessie.

OpenAI Realtime-voorbeeld met veel echo:

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

Gebruik dit wanneer het model zijn eigen Discord-weergave via een open microfoon hoort, maar je het nog steeds wilt onderbreken door te spreken. OpenClaw voorkomt dat OpenAI automatisch onderbreekt op ruwe invoeraudio, terwijl `bargeIn: true` ervoor zorgt dat Discord-gebeurtenissen voor het starten van een spreker en al actieve sprekeraudio actieve realtime-antwoorden kunnen annuleren voordat de volgende vastgelegde beurt OpenAI bereikt. Zeer vroege barge-in-signalen met `audioEndMs` onder `minBargeInAudioEndMs` worden behandeld als vermoedelijke echo/ruis en genegeerd, zodat het model niet stopt bij het eerste afspeelframe.

Verwachte spraaklogs:

- Bij deelnemen: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- Bij realtime-start: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- Bij sprekeraudio: `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...`, en `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- Bij overgeslagen verouderde spraak: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` of `reason=non-actionable-closing ...`
- Bij voltooiing van realtime-antwoord: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- Bij stoppen/resetten van weergave: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- Bij realtime-consult: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- Bij agentantwoord: `discord voice: agent turn answer ...`
- Bij exacte spraak in de wachtrij: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`, gevolgd door `discord voice: realtime exact speech dequeued reason=player-idle ...`
- Bij barge-in-detectie: `discord voice: realtime barge-in detected source=speaker-start ...` of `discord voice: realtime barge-in detected source=active-speaker-audio ...`, gevolgd door `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- Bij realtime-onderbreking: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`, gevolgd door `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` of `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- Bij genegeerde echo/ruis: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- Bij uitgeschakelde barge-in: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- Bij inactieve weergave: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

Lees de realtime-spraaklogs als tijdlijn om afgekapt geluid te debuggen:

1. `realtime audio playback started` betekent dat Discord is begonnen met het afspelen van assistentaudio. De brug begint vanaf dit punt assistent-uitvoerchunks, Discord PCM-bytes, realtime-bytes van de provider en gesynthetiseerde audioduur te tellen.
2. `realtime speaker turn opened` markeert dat een Discord-spreker actief wordt. Als weergave al actief is en `bargeIn` is ingeschakeld, kan dit worden gevolgd door `barge-in detected source=speaker-start`.
3. `realtime input audio started` markeert het eerste daadwerkelijke audioframe dat voor die sprekerbeurt is ontvangen. `outputActive=true` of een niet-nul `outputAudioMs` betekent hier dat de microfoon invoer verzendt terwijl assistentweergave nog actief is.
4. `barge-in detected source=active-speaker-audio` betekent dat OpenClaw live sprekeraudio zag terwijl assistentweergave actief was. Dit is nuttig om een echte onderbreking te onderscheiden van een Discord-gebeurtenis voor het starten van een spreker zonder bruikbare audio.
5. `barge-in requested reason=...` betekent dat OpenClaw de realtime-provider heeft gevraagd het actieve antwoord te annuleren of af te kappen. Het bevat `outputAudioMs`, `outputActive` en `playbackChunks`, zodat je kunt zien hoeveel assistentaudio daadwerkelijk was afgespeeld vóór de onderbreking.
6. `realtime audio playback stopped reason=...` is het lokale resetpunt voor Discord-weergave. De reden geeft aan wie de weergave heeft gestopt: `barge-in`, `player-idle`, `provider-clear-audio`, `forced-agent-consult`, `stream-close` of `session-close`.
7. `realtime speaker turn closed` vat de vastgelegde invoerbeurt samen. `chunks=0` of `hasAudio=false` betekent dat de sprekerbeurt werd geopend, maar dat geen bruikbare audio de realtime-brug bereikte. `interruptedPlayback=true` betekent dat die invoerbeurt overlapte met assistentuitvoer en barge-in-logica activeerde.

Nuttige velden:

- `outputAudioMs`: duur van assistentaudio die vóór de logregel door de realtime-provider is gegenereerd.
- `audioMs`: duur van assistentaudio die OpenClaw telde voordat de weergave stopte.
- `elapsedMs`: wandkloktijd tussen het openen en sluiten van de weergavestream of sprekerbeurt.
- `discordBytes`: 48 kHz stereo PCM-bytes verzonden naar of ontvangen van Discord-spraak.
- `realtimeBytes`: PCM-bytes in providerformaat verzonden naar of ontvangen van de realtime-provider.
- `playbackChunks`: assistentaudiochunks doorgestuurd naar Discord voor het actieve antwoord.
- `sinceLastAudioMs`: onderbreking tussen het laatst vastgelegde sprekeraudioframe en het sluiten van de sprekerbeurt.

Veelvoorkomende patronen:

- Direct afkappen met `source=active-speaker-audio`, kleine `outputAudioMs` en dezelfde gebruiker in de buurt wijst meestal op luidsprekerecho die de microfoon binnenkomt. Verhoog `voice.realtime.minBargeInAudioEndMs`, verlaag het luidsprekervolume, gebruik een koptelefoon of stel `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` in.
- `source=speaker-start` gevolgd door `speaker turn closed ... hasAudio=false` betekent dat Discord een sprekerstart meldde, maar dat geen audio OpenClaw bereikte. Dat kan een tijdelijke Discord-spraakgebeurtenis zijn, gedrag van een noise gate of een client die kort de microfoon activeert.
- `audio playback stopped reason=stream-close` zonder nabije barge-in of `provider-clear-audio` betekent dat de lokale Discord-weergavestream onverwacht is beëindigd. Controleer de voorafgaande provider- en Discord-spelerlogs.
- `capture ignored during playback (barge-in disabled)` betekent dat OpenClaw invoer bewust heeft laten vallen terwijl assistentaudio actief was. Schakel `voice.realtime.bargeIn` in als je wilt dat spraak de weergave onderbreekt.
- `barge-in ignored ... outputActive=false` betekent dat Discord of provider-VAD spraak meldde, maar dat OpenClaw geen actieve weergave had om te onderbreken. Dit zou audio niet moeten afkappen.

Referenties worden per component opgelost: LLM-route-authenticatie voor `voice.model`, STT-authenticatie voor `tools.media.audio`, TTS-authenticatie voor `messages.tts`/`voice.tts` en realtime-provider-authenticatie voor `voice.realtime.providers` of de normale authenticatieconfiguratie van de provider.

### Spraakberichten

Discord-spraakberichten tonen een golfvormvoorbeeld en vereisen OGG/Opus-audio. OpenClaw genereert de golfvorm automatisch, maar heeft `ffmpeg` en `ffprobe` op de Gateway-host nodig om te inspecteren en te converteren.

- Geef een **lokaal bestandspad** op (URL's worden geweigerd).
- Laat tekstinhoud weg (Discord weigert tekst + spraakbericht in dezelfde payload).
- Elk audioformaat wordt geaccepteerd; OpenClaw converteert waar nodig naar OGG/Opus.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Probleemoplossing

<AccordionGroup>
  <Accordion title="Used disallowed intents or bot sees no guild messages">

    - schakel Message Content Intent in
    - schakel Server Members Intent in wanneer je afhankelijk bent van gebruikers-/ledenresolutie
    - herstart Gateway na het wijzigen van intents

  </Accordion>

  <Accordion title="Guild messages blocked unexpectedly">

    - controleer `groupPolicy`
    - controleer de guild-allowlist onder `channels.discord.guilds`
    - als de guild-`channels`-map bestaat, zijn alleen vermelde kanalen toegestaan
    - controleer `requireMention`-gedrag en vermeldingspatronen

    Nuttige controles:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false but still blocked">
    Veelvoorkomende oorzaken:

    - `groupPolicy="allowlist"` zonder overeenkomende guild-/kanaal-allowlist
    - `requireMention` geconfigureerd op de verkeerde plaats (moet onder `channels.discord.guilds` of kanaalitem staan)
    - afzender geblokkeerd door guild-/kanaal-`users`-allowlist

  </Accordion>

  <Accordion title="Long-running Discord turns or duplicate replies">

    Typische logs:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Discord Gateway-wachtrijknoppen:

    - enkel account: `channels.discord.eventQueue.listenerTimeout`
    - meerdere accounts: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - dit beheert alleen Discord Gateway-listenerwerk, niet de levensduur van agentbeurten

    Discord past geen kanaaleigen timeout toe op agentbeurten in de wachtrij. Berichtlisteners dragen direct over, en Discord-runs in de wachtrij behouden volgorde per sessie totdat de sessie-/tool-/runtime-levenscyclus het werk voltooit of afbreekt.

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
    OpenClaw haalt Discord-`/gateway/bot`-metadata op voordat verbinding wordt gemaakt. Tijdelijke fouten vallen terug op de standaard Gateway-URL van Discord en worden in logs in snelheid beperkt.

    Metadata-timeoutknoppen:

    - enkel account: `channels.discord.gatewayInfoTimeoutMs`
    - meerdere accounts: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - env-fallback wanneer config niet is ingesteld: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - standaard: `30000` (30 seconden), max: `120000`

  </Accordion>

  <Accordion title="Gateway READY timeout restarts">
    OpenClaw wacht tijdens opstarten en na runtime-herverbindingen op het Discord Gateway-`READY`-event. Configuraties met meerdere accounts en gespreide opstart kunnen een langer READY-venster bij opstarten nodig hebben dan de standaardwaarde.

    READY-timeoutknoppen:

    - opstarten enkel account: `channels.discord.gatewayReadyTimeoutMs`
    - opstarten meerdere accounts: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - opstart-env-fallback wanneer config niet is ingesteld: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - opstartstandaard: `15000` (15 seconden), max: `120000`
    - runtime enkel account: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - runtime meerdere accounts: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - runtime-env-fallback wanneer config niet is ingesteld: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - runtimestandaard: `30000` (30 seconden), max: `120000`

  </Accordion>

  <Accordion title="Permissions audit mismatches">
    `channels status --probe`-machtigingscontroles werken alleen voor numerieke kanaal-ID's.

    Als je slug-sleutels gebruikt, kan runtime-matching nog steeds werken, maar de probe kan machtigingen niet volledig verifiëren.

  </Accordion>

  <Accordion title="DM and pairing issues">

    - DM uitgeschakeld: `channels.discord.dm.enabled=false`
    - DM-beleid uitgeschakeld: `channels.discord.dmPolicy="disabled"` (legacy: `channels.discord.dm.policy`)
    - wacht op koppelingsgoedkeuring in `pairing`-modus

  </Accordion>

  <Accordion title="Bot to bot loops">
    Standaard worden door bots geschreven berichten genegeerd.

    Als je `channels.discord.allowBots=true` instelt, gebruik dan strikte vermelding- en allowlist-regels om lusgedrag te voorkomen.
    Geef de voorkeur aan `channels.discord.allowBots="mentions"` om alleen botberichten te accepteren die de bot vermelden.

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

    - houd OpenClaw actueel (`openclaw update`) zodat de herstel-logica voor het ontvangen van Discord-spraak aanwezig is
    - bevestig `channels.discord.voice.daveEncryption=true` (standaard)
    - begin met `channels.discord.voice.decryptionFailureTolerance=24` (upstream-standaard) en pas alleen aan als dat nodig is
    - controleer logs op:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - als fouten na automatisch opnieuw deelnemen blijven optreden, verzamel dan logs en vergelijk die met de upstream DAVE-ontvangstgeschiedenis in [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) en [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Configuratiereferentie

Primaire referentie: [Configuratiereferentie - Discord](/nl/gateway/config-channels#discord).

<Accordion title="High-signal Discord fields">

- opstarten/authenticatie: `enabled`, `token`, `accounts.*`, `allowBots`
- beleid: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- opdracht: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- gebeurteniswachtrij: `eventQueue.listenerTimeout` (listener-budget), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- antwoord/geschiedenis: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- levering: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming` (verouderde alias: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- media/opnieuw proberen: `mediaMaxMb` (beperkt uitgaande Discord-uploads, standaard `100MB`), `retry`
- acties: `actions.*`
- aanwezigheid: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- functies: `threadBindings`, top-level `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## Veiligheid en beheer

- Behandel bottokens als geheimen (`DISCORD_BOT_TOKEN` heeft de voorkeur in beheerde omgevingen).
- Verleen Discord-machtigingen met minimale rechten.
- Als opdrachtimplementatie/-status verouderd is, herstart dan de Gateway en controleer opnieuw met `openclaw channels status --probe`.

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/nl/channels/pairing">
    Koppel een Discord-gebruiker aan de Gateway.
  </Card>
  <Card title="Groups" icon="users" href="/nl/channels/groups">
    Groepschat- en allowlist-gedrag.
  </Card>
  <Card title="Channel routing" icon="route" href="/nl/channels/channel-routing">
    Routeer inkomende berichten naar agents.
  </Card>
  <Card title="Security" icon="shield" href="/nl/gateway/security">
    Dreigingsmodel en hardening.
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/nl/concepts/multi-agent">
    Koppel guilds en kanalen aan agents.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/nl/tools/slash-commands">
    Native opdrachtgedrag.
  </Card>
</CardGroup>
