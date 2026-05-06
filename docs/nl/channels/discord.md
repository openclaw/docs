---
read_when:
    - Werken aan Discord-kanaalfuncties
summary: Ondersteuningsstatus, mogelijkheden en configuratie van de Discord-bot
title: Discord
x-i18n:
    generated_at: "2026-05-06T17:52:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 11cc911dbc569db7a31ce4a16de167bc8ea771d1dd7842cb151f666f3cb9285b
    source_path: channels/discord.md
    workflow: 16
---

Klaar voor DM's en guild-kanalen via de officiële Discord Gateway.

<CardGroup cols={3}>
  <Card title="Koppelen" icon="link" href="/nl/channels/pairing">
    Discord-DM's gebruiken standaard de koppelmodus.
  </Card>
  <Card title="Slash-commando's" icon="terminal" href="/nl/tools/slash-commands">
    Native commandogedrag en commandocatalogus.
  </Card>
  <Card title="Problemen met kanalen oplossen" icon="wrench" href="/nl/channels/troubleshooting">
    Kanaaloverschrijdende diagnose en herstelstroom.
  </Card>
</CardGroup>

## Snelle installatie

Je moet een nieuwe applicatie met een bot maken, de bot aan je server toevoegen en deze aan OpenClaw koppelen. We raden aan je bot aan je eigen privéserver toe te voegen. Als je er nog geen hebt, [maak er dan eerst een](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (kies **Create My Own > For me and my friends**).

<Steps>
  <Step title="Maak een Discord-applicatie en bot">
    Ga naar de [Discord Developer Portal](https://discord.com/developers/applications) en klik op **New Application**. Geef deze een naam zoals "OpenClaw".

    Klik op **Bot** in de zijbalk. Stel de **Username** in op hoe je je OpenClaw-agent noemt.

  </Step>

  <Step title="Schakel privileged intents in">
    Blijf op de pagina **Bot**, scrol omlaag naar **Privileged Gateway Intents** en schakel in:

    - **Message Content Intent** (vereist)
    - **Server Members Intent** (aanbevolen; vereist voor rol-allowlists en koppeling van naam naar ID)
    - **Presence Intent** (optioneel; alleen nodig voor aanwezigheidsupdates)

  </Step>

  <Step title="Kopieer je bot-token">
    Scrol terug omhoog op de pagina **Bot** en klik op **Reset Token**.

    <Note>
    Ondanks de naam genereert dit je eerste token — er wordt niets "gereset".
    </Note>

    Kopieer de token en bewaar deze ergens. Dit is je **Bot Token** en je hebt deze zo meteen nodig.

  </Step>

  <Step title="Genereer een uitnodigings-URL en voeg de bot aan je server toe">
    Klik op **OAuth2** in de zijbalk. Je genereert een uitnodigings-URL met de juiste machtigingen om de bot aan je server toe te voegen.

    Scrol omlaag naar **OAuth2 URL Generator** en schakel in:

    - `bot`
    - `applications.commands`

    Er verschijnt hieronder een sectie **Bot Permissions**. Schakel minimaal in:

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (optioneel)

    Dit is de basisset voor normale tekstkanalen. Als je van plan bent in Discord-threads te posten, inclusief forum- of mediakanaalworkflows die een thread maken of voortzetten, schakel dan ook **Send Messages in Threads** in.
    Kopieer de gegenereerde URL onderaan, plak deze in je browser, selecteer je server en klik op **Continue** om verbinding te maken. Je zou je bot nu in de Discord-server moeten zien.

  </Step>

  <Step title="Schakel Developer Mode in en verzamel je ID's">
    Terug in de Discord-app moet je Developer Mode inschakelen zodat je interne ID's kunt kopiëren.

    1. Klik op **User Settings** (tandwielpictogram naast je avatar) → **Advanced** → schakel **Developer Mode** in
    2. Klik met de rechtermuisknop op je **serverpictogram** in de zijbalk → **Copy Server ID**
    3. Klik met de rechtermuisknop op je **eigen avatar** → **Copy User ID**

    Bewaar je **Server ID** en **User ID** naast je Bot Token — je stuurt ze alle drie in de volgende stap naar OpenClaw.

  </Step>

  <Step title="Sta DM's van serverleden toe">
    Om koppelen te laten werken, moet Discord toestaan dat je bot je een DM stuurt. Klik met de rechtermuisknop op je **serverpictogram** → **Privacy Settings** → schakel **Direct Messages** in.

    Hierdoor kunnen serverleden (inclusief bots) je DM's sturen. Laat dit ingeschakeld als je Discord-DM's met OpenClaw wilt gebruiken. Als je alleen guild-kanalen wilt gebruiken, kun je DM's na het koppelen uitschakelen.

  </Step>

  <Step title="Stel je bot-token veilig in (stuur deze niet in chat)">
    Je Discord-bot-token is een geheim (zoals een wachtwoord). Stel deze in op de machine waarop OpenClaw draait voordat je je agent een bericht stuurt.

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

    Als OpenClaw al als achtergrondservice draait, herstart deze dan via de OpenClaw Mac-app of door het `openclaw gateway run`-proces te stoppen en opnieuw te starten.
    Voor beheerde service-installaties voer je `openclaw gateway install` uit vanuit een shell waarin `DISCORD_BOT_TOKEN` aanwezig is, of sla je de variabele op in `~/.openclaw/.env`, zodat de service de env SecretRef na herstart kan oplossen.
    Als je host wordt geblokkeerd of rate-limited door Discord's applicatie-opzoekactie bij het opstarten, stel dan de Discord-application/client-ID in vanuit de Developer Portal zodat de opstart die REST-call kan overslaan. Gebruik `channels.discord.applicationId` voor het standaardaccount, of `channels.discord.accounts.<accountId>.applicationId` wanneer je meerdere Discord-bots uitvoert.

  </Step>

  <Step title="Configureer OpenClaw en koppel">

    <Tabs>
      <Tab title="Vraag je agent">
        Chat met je OpenClaw-agent op een bestaand kanaal (bijv. Telegram) en vertel het hem. Als Discord je eerste kanaal is, gebruik dan in plaats daarvan het tabblad CLI / configuratie.

        > "Ik heb mijn Discord-bot-token al in config ingesteld. Rond Discord-installatie af met User ID `<user_id>` en Server ID `<server_id>`."
      </Tab>
      <Tab title="CLI / configuratie">
        Als je de voorkeur geeft aan bestandsgebaseerde configuratie, stel dan in:

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

        Voor gescripte of externe installatie schrijf je hetzelfde JSON5-blok met `openclaw config patch --file ./discord.patch.json5 --dry-run` en voer je het daarna opnieuw uit zonder `--dry-run`. Plaintext `token`-waarden worden ondersteund. SecretRef-waarden worden ook ondersteund voor `channels.discord.token` via env/file/exec-providers. Zie [Geheimenbeheer](/nl/gateway/secrets).

        Voor meerdere Discord-bots bewaar je elke bot-token en application ID onder het eigen account. Een top-level `channels.discord.applicationId` wordt door accounts overgenomen, dus stel deze daar alleen in wanneer elk account dezelfde application ID moet gebruiken.

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

  <Step title="Keur de eerste DM-koppeling goed">
    Wacht tot de gateway draait en stuur je bot daarna een DM in Discord. Deze reageert met een koppelcode.

    <Tabs>
      <Tab title="Vraag je agent">
        Stuur de koppelcode naar je agent op je bestaande kanaal:

        > "Keur deze Discord-koppelcode goed: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    Koppelcodes verlopen na 1 uur.

    Je zou nu via DM met je agent in Discord moeten kunnen chatten.

  </Step>
</Steps>

<Note>
Tokenresolutie is accountbewust. Config-tokenwaarden winnen van env-fallback. `DISCORD_BOT_TOKEN` wordt alleen gebruikt voor het standaardaccount.
Als twee ingeschakelde Discord-accounts naar dezelfde bot-token verwijzen, start OpenClaw slechts één gatewaymonitor voor die token. Een token uit config wint van de standaard env-fallback; anders wint het eerste ingeschakelde account en wordt het dubbele account als uitgeschakeld gerapporteerd.
Voor geavanceerde uitgaande calls (berichttool/kanaalacties) wordt een expliciete per-call `token` gebruikt voor die call. Dit geldt voor verzend- en lees/probe-achtige acties (bijvoorbeeld read/search/fetch/thread/pins/permissions). Accountbeleid en retry-instellingen komen nog steeds uit het geselecteerde account in de actieve runtime-snapshot.
</Note>

## Aanbevolen: stel een guild-werkruimte in

Zodra DM's werken, kun je je Discord-server instellen als een volledige werkruimte waarin elk kanaal een eigen agentsessie met eigen context krijgt. Dit wordt aanbevolen voor privéservers waar alleen jij en je bot aanwezig zijn.

<Steps>
  <Step title="Voeg je server toe aan de guild-allowlist">
    Hierdoor kan je agent reageren in elk kanaal op je server, niet alleen in DM's.

    <Tabs>
      <Tab title="Vraag je agent">
        > "Voeg mijn Discord Server ID `<server_id>` toe aan de guild-allowlist"
      </Tab>
      <Tab title="Configuratie">

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

  <Step title="Sta reacties zonder @mention toe">
    Standaard reageert je agent alleen in guild-kanalen wanneer hij @mentioned wordt. Voor een privéserver wil je waarschijnlijk dat hij op elk bericht reageert.

    In guild-kanalen blijven normale definitieve assistentantwoorden standaard privé. Zichtbare Discord-uitvoer moet expliciet worden verzonden met de `message`-tool, zodat de agent standaard kan meelezen en alleen post wanneer hij besluit dat een kanaalantwoord nuttig is.

    Dit betekent dat het geselecteerde model betrouwbaar tools moet aanroepen. Als Discord typen toont en de logs tokengebruik tonen maar er geen bericht wordt geplaatst, controleer dan de sessielog op assistenttekst met `didSendViaMessagingTool: false`. Dat betekent dat het model een privé definitief antwoord produceerde in plaats van `message(action=send)` aan te roepen. Schakel over naar een sterker tool-calling-model, of gebruik de onderstaande configuratie om legacy automatische definitieve antwoorden te herstellen.

    <Tabs>
      <Tab title="Vraag je agent">
        > "Sta mijn agent toe op deze server te reageren zonder @mentioned te hoeven worden"
      </Tab>
      <Tab title="Configuratie">
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

  <Step title="Plan geheugen voor guild-kanalen">
    Standaard wordt langetermijngeheugen (MEMORY.md) alleen geladen in DM-sessies. Guild-kanalen laden MEMORY.md niet automatisch.

    <Tabs>
      <Tab title="Vraag je agent">
        > "Wanneer ik vragen stel in Discord-kanalen, gebruik memory_search of memory_get als je langetermijncontext uit MEMORY.md nodig hebt."
      </Tab>
      <Tab title="Handmatig">
        Als je gedeelde context in elk kanaal nodig hebt, zet de stabiele instructies dan in `AGENTS.md` of `USER.md` (ze worden voor elke sessie geïnjecteerd). Bewaar langetermijnnotities in `MEMORY.md` en open ze op aanvraag met geheugentools.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Maak nu enkele kanalen op je Discord-server en begin met chatten. Je agent kan de kanaalnaam zien en elk kanaal krijgt zijn eigen geïsoleerde sessie — zodat je `#coding`, `#home`, `#research` of iets anders dat bij je workflow past kunt instellen.

## Runtime-model

- Gateway beheert de Discord-verbinding.
- Antwoordroutering is deterministisch: inkomende antwoorden van Discord gaan terug naar Discord.
- Metadata van Discord-guilds/kanalen wordt aan de modelprompt toegevoegd als niet-vertrouwde
  context, niet als een voor gebruikers zichtbaar antwoordvoorvoegsel. Als een model die envelop
  terug kopieert, verwijdert OpenClaw de gekopieerde metadata uit uitgaande antwoorden en uit
  toekomstige replay-context.
- Standaard (`session.dmScope=main`) delen directe chats de hoofdssessie van de agent (`agent:main:main`).
- Guildkanalen zijn geisoleerde sessiesleutels (`agent:<agentId>:discord:channel:<channelId>`).
- Groeps-DM's worden standaard genegeerd (`channels.discord.dm.groupEnabled=false`).
- Native slash-commando's worden uitgevoerd in geisoleerde commandosessies (`agent:<agentId>:discord:slash:<userId>`), terwijl ze nog steeds `CommandTargetSessionKey` meenemen naar de gerouteerde gesprekssessie.
- Tekstuele cron-/heartbeat-aankondigingen naar Discord gebruiken het uiteindelijke
  voor de assistent zichtbare antwoord eenmalig. Media en gestructureerde componentpayloads blijven
  uit meerdere berichten bestaan wanneer de agent meerdere leverbare payloads emitteert.

## Forumkanalen

Discord-forum- en mediakanalen accepteren alleen threadposts. OpenClaw ondersteunt twee manieren om die te maken:

- Stuur een bericht naar de forumparent (`channel:<forumId>`) om automatisch een thread te maken. De threadtitel gebruikt de eerste niet-lege regel van je bericht.
- Gebruik `openclaw message thread create` om rechtstreeks een thread te maken. Geef geen `--message-id` door voor forumkanalen.

Voorbeeld: stuur naar de forumparent om een thread te maken

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Voorbeeld: maak expliciet een forumthread

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Forumparents accepteren geen Discord-componenten. Als je componenten nodig hebt, stuur dan naar de thread zelf (`channel:<threadId>`).

## Interactieve componenten

OpenClaw ondersteunt Discord components v2-containers voor agentberichten. Gebruik de berichttool met een `components`-payload. Interactieresultaten worden terug naar de agent gerouteerd als normale inkomende berichten en volgen de bestaande Discord-instellingen voor `replyToMode`.

Ondersteunde blokken:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Actierijen staan maximaal 5 knoppen of een enkel selectiemenu toe
- Selectietypen: `string`, `user`, `role`, `mentionable`, `channel`

Standaard zijn componenten eenmalig te gebruiken. Stel `components.reusable=true` in om knoppen, selecties en formulieren meerdere keren te laten gebruiken totdat ze verlopen.

Stel `allowedUsers` op die knop in om te beperken wie op een knop kan klikken (Discord-gebruikers-ID's, tags of `*`). Wanneer dit is geconfigureerd, ontvangen niet-overeenkomende gebruikers een ephemeral weigering.

De slash-commando's `/model` en `/models` openen een interactieve modelkiezer met dropdowns voor provider, model en compatibele runtime plus een stap Indienen. `/models add` is verouderd en retourneert nu een verouderingsbericht in plaats van modellen vanuit chat te registreren. Het antwoord van de kiezer is ephemeral en alleen de aanroepende gebruiker kan het gebruiken.

Bestandsbijlagen:

- `file`-blokken moeten verwijzen naar een bijlagereferentie (`attachment://<filename>`)
- Geef de bijlage op via `media`/`path`/`filePath` (een enkel bestand); gebruik `media-gallery` voor meerdere bestanden
- Gebruik `filename` om de uploadnaam te overschrijven wanneer die met de bijlagereferentie moet overeenkomen

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
  <Tab title="DM-beleid">
    `channels.discord.dmPolicy` beheert DM-toegang. `channels.discord.allowFrom` is de canonieke DM-allowlist.

    - `pairing` (standaard)
    - `allowlist`
    - `open` (vereist dat `channels.discord.allowFrom` `"*"` bevat)
    - `disabled`

    Als het DM-beleid niet open is, worden onbekende gebruikers geblokkeerd (of gevraagd om te koppelen in de modus `pairing`).

    Prioriteit bij meerdere accounts:

    - `channels.discord.accounts.default.allowFrom` geldt alleen voor het account `default`.
    - Voor een account heeft `allowFrom` voorrang op legacy `dm.allowFrom`.
    - Benoemde accounts erven `channels.discord.allowFrom` wanneer hun eigen `allowFrom` en legacy `dm.allowFrom` niet zijn ingesteld.
    - Benoemde accounts erven `channels.discord.accounts.default.allowFrom` niet.

    Legacy `channels.discord.dm.policy` en `channels.discord.dm.allowFrom` worden voor compatibiliteit nog steeds gelezen. `openclaw doctor --fix` migreert ze naar `dmPolicy` en `allowFrom` wanneer dat kan zonder de toegang te wijzigen.

    DM-doelformaat voor levering:

    - `user:<id>`
    - `<@id>`-vermelding

    Kale numerieke ID's worden normaal als kanaal-ID's opgelost wanneer een kanaalstandaard actief is, maar ID's die in de effectieve DM-`allowFrom` van het account staan, worden voor compatibiliteit behandeld als gebruikers-DM-doelen.

  </Tab>

  <Tab title="DM-toegangsgroepen">
    Discord-DM's kunnen dynamische `accessGroup:<name>`-vermeldingen gebruiken in `channels.discord.allowFrom`.

    Namen van toegangsgroepen worden gedeeld tussen berichtkanalen. Gebruik `type: "message.senders"` voor een statische groep waarvan leden worden uitgedrukt in de normale `allowFrom`-syntaxis van elk kanaal, of `type: "discord.channelAudience"` wanneer het huidige `ViewChannel`-publiek van een Discord-kanaal het lidmaatschap dynamisch moet bepalen. Gedeeld gedrag van toegangsgroepen is hier gedocumenteerd: [Toegangsgroepen](/nl/channels/access-groups).

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

    Een Discord-tekstkanaal heeft geen aparte ledenlijst. `type: "discord.channelAudience"` modelleert lidmaatschap als volgt: de DM-afzender is lid van de geconfigureerde guild en heeft momenteel effectieve `ViewChannel`-toestemming voor het geconfigureerde kanaal nadat rol- en kanaaloverschrijvingen zijn toegepast.

    Voorbeeld: laat iedereen die `#maintainers` kan zien de bot DM'en, terwijl DM's voor alle anderen gesloten blijven.

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

    Zoekopdrachten falen gesloten. Als Discord `Missing Access` retourneert, het opzoeken van het lid mislukt, of het kanaal bij een andere guild hoort, wordt de DM-afzender als onbevoegd behandeld.

    Schakel de **Server Members Intent** van het Discord Developer Portal in voor de bot wanneer je kanaalpubliek-toegangsgroepen gebruikt. DM's bevatten geen status van guildleden, dus OpenClaw lost het lid op via Discord REST op het moment van autorisatie.

  </Tab>

  <Tab title="Guildbeleid">
    Guildafhandeling wordt beheerd door `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    De veilige basisinstelling wanneer `channels.discord` bestaat, is `allowlist`.

    Gedrag van `allowlist`:

    - guild moet overeenkomen met `channels.discord.guilds` (`id` aanbevolen, slug geaccepteerd)
    - optionele afzender-allowlists: `users` (stabiele ID's aanbevolen) en `roles` (alleen rol-ID's); als een van beide is geconfigureerd, zijn afzenders toegestaan wanneer ze overeenkomen met `users` OF `roles`
    - directe naam-/tagmatching is standaard uitgeschakeld; schakel `channels.discord.dangerouslyAllowNameMatching: true` alleen in als break-glass-compatibiliteitsmodus
    - namen/tags worden ondersteund voor `users`, maar ID's zijn veiliger; `openclaw security audit` waarschuwt wanneer naam-/tagvermeldingen worden gebruikt
    - als een guild `channels` heeft geconfigureerd, worden niet-vermelde kanalen geweigerd
    - als een guild geen `channels`-blok heeft, zijn alle kanalen in die toegestane guild toegestaan

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

    Als je alleen `DISCORD_BOT_TOKEN` instelt en geen `channels.discord`-blok maakt, is de runtime-fallback `groupPolicy="allowlist"` (met een waarschuwing in logs), zelfs als `channels.defaults.groupPolicy` `open` is.

  </Tab>

  <Tab title="Vermeldingen en groeps-DM's">
    Guildberichten zijn standaard afgeschermd met vermeldingen.

    Vermeldingsdetectie omvat:

    - expliciete botvermelding
    - geconfigureerde vermeldingspatronen (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - impliciet antwoord-op-bot-gedrag in ondersteunde gevallen

    Gebruik bij het schrijven van uitgaande Discord-berichten de canonieke vermeldingssyntaxis: `<@USER_ID>` voor gebruikers, `<#CHANNEL_ID>` voor kanalen en `<@&ROLE_ID>` voor rollen. Gebruik niet de legacy bijnaamvermeldingsvorm `<@!USER_ID>`.

    `requireMention` wordt per guild/kanaal geconfigureerd (`channels.discord.guilds...`).
    `ignoreOtherMentions` laat optioneel berichten vallen die een andere gebruiker/rol vermelden maar niet de bot (exclusief @everyone/@here).

    Groeps-DM's:

    - standaard: genegeerd (`dm.groupEnabled=false`)
    - optionele allowlist via `dm.groupChannels` (kanaal-ID's of slugs)

  </Tab>
</Tabs>

### Rolgebaseerde agentroutering

Gebruik `bindings[].match.roles` om Discord-guildleden op basis van rol-ID naar verschillende agents te routeren. Rolgebaseerde bindings accepteren alleen rol-ID's en worden geevalueerd na peer- of parent-peer-bindings en voor guild-only bindings. Als een binding ook andere matchvelden instelt (bijvoorbeeld `peer` + `guildId` + `roles`), moeten alle geconfigureerde velden overeenkomen.

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

- `commands.native` staat standaard op `"auto"` en is ingeschakeld voor Discord.
- Overschrijving per kanaal: `channels.discord.commands.native`.
- `commands.native=false` slaat registratie en opschoning van Discord slash-commando's tijdens het opstarten over. Eerder geregistreerde commando's kunnen zichtbaar blijven in Discord totdat je ze uit de Discord-app verwijdert.
- Native commando-authenticatie gebruikt dezelfde Discord-toestaanlijsten en beleidsregels als normale berichtverwerking.
- Commando's kunnen nog steeds zichtbaar zijn in de Discord UI voor gebruikers die niet geautoriseerd zijn; uitvoering dwingt nog steeds OpenClaw-authenticatie af en retourneert "niet geautoriseerd".

Zie [Slash-commando's](/nl/tools/slash-commands) voor de commandocatalogus en het gedrag.

Standaardinstellingen voor slash-commando's:

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

    Let op: `off` schakelt impliciete antwoordthreading uit. Expliciete `[[reply_to_*]]`-tags worden nog steeds gerespecteerd.
    `first` koppelt de impliciete native antwoordverwijzing altijd aan het eerste uitgaande Discord-bericht voor de beurt.
    `batched` koppelt Discords impliciete native antwoordverwijzing alleen wanneer de
    inkomende beurt een gedebouncete batch van meerdere berichten was. Dit is handig
    wanneer je native antwoorden vooral wilt voor dubbelzinnige, snelle chats, niet voor elke
    beurt met één bericht.

    Bericht-ID's worden in context/geschiedenis beschikbaar gemaakt zodat agents specifieke berichten kunnen targeten.

  </Accordion>

  <Accordion title="Live streamvoorbeeld">
    OpenClaw kan conceptantwoorden streamen door een tijdelijk bericht te sturen en dit te bewerken terwijl tekst binnenkomt. `channels.discord.streaming` accepteert `off` (standaard) | `partial` | `block` | `progress`. `progress` behoudt één bewerkbaar statusconcept en werkt dit bij met toolvoortgang tot de uiteindelijke aflevering; `streamMode` is een verouderde runtime-alias. Voer `openclaw doctor --fix` uit om opgeslagen configuratie naar de canonieke sleutel te herschrijven.

    De standaard blijft `off` omdat Discord-voorbeeldbewerkingen snel snelheidslimieten raken wanneer meerdere bots of gateways een account delen.

```json5
{
  channels: {
    discord: {
      streaming: "block",
      draftChunk: {
        minChars: 200,
        maxChars: 800,
        breakPreference: "paragraph",
      },
    },
  },
}
```

    - `partial` bewerkt één voorbeeldbericht terwijl tokens binnenkomen.
    - `block` zendt conceptgrote chunks uit (gebruik `draftChunk` om grootte en breekpunten af te stemmen, begrensd tot `textChunkLimit`).
    - Media-, fout- en expliciete antwoordfinales annuleren wachtende voorbeeldbewerkingen.
    - `streaming.preview.toolProgress` (standaard `true`) bepaalt of tool-/voortgangsupdates het voorbeeldbericht hergebruiken.
    - `streaming.preview.commandText` / `streaming.progress.commandText` bepaalt commando-/exec-details in compacte voortgangsregels: `raw` (standaard) of `status` (alleen toollabel).

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

    Besturing voor DM-geschiedenis:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Threadgedrag:

    - Discord-threads worden gerouteerd als kanaalsessies en erven de configuratie van het bovenliggende kanaal, tenzij overschreven.
    - Threadsessies erven de sessieniveau-`/model`-selectie van het bovenliggende kanaal als uitsluitend model-fallback; threadlokale `/model`-selecties hebben nog steeds voorrang en de transcriptgeschiedenis van het bovenliggende kanaal wordt niet gekopieerd tenzij transcriptovererving is ingeschakeld.
    - `channels.discord.thread.inheritParent` (standaard `false`) laat nieuwe auto-threads seeded worden vanuit het bovenliggende transcript. Overschrijvingen per account staan onder `channels.discord.accounts.<id>.thread.inheritParent`.
    - Berichttoolreacties kunnen DM-doelen `user:<id>` oplossen.
    - `guilds.<guild>.channels.<channel>.requireMention: false` blijft behouden tijdens de fallback voor activering in de antwoordfase.

    Kanaalonderwerpen worden geïnjecteerd als **niet-vertrouwde** context. Toestaanlijsten bepalen wie de agent kan activeren, niet een volledige redactiegrens voor aanvullende context.

  </Accordion>

  <Accordion title="Thread-gebonden sessies voor subagents">
    Discord kan een thread aan een sessiedoel binden, zodat vervolgberichten in die thread naar dezelfde sessie blijven routeren (inclusief subagentsessies).

    Commando's:

    - `/focus <target>` bind huidige/nieuwe thread aan een subagent-/sessiedoel
    - `/unfocus` verwijder huidige threadbinding
    - `/agents` toon actieve runs en bindingsstatus
    - `/session idle <duration|off>` inspecteer/update auto-unfocus bij inactiviteit voor gefocuste bindingen
    - `/session max-age <duration|off>` inspecteer/update harde maximumleeftijd voor gefocuste bindingen

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

    - `session.threadBindings.*` stelt globale standaarden in.
    - `channels.discord.threadBindings.*` overschrijft Discord-gedrag.
    - `spawnSessions` beheert automatisch maken/binden van threads voor `sessions_spawn({ thread: true })` en ACP-threadspawns. Standaard: `true`.
    - `defaultSpawnContext` beheert native subagentcontext voor thread-gebonden spawns. Standaard: `"fork"`.
    - Verouderde sleutels `spawnSubagentSessions`/`spawnAcpSessions` worden gemigreerd door `openclaw doctor --fix`.
    - Als threadbindingen voor een account zijn uitgeschakeld, zijn `/focus` en gerelateerde threadbindingsbewerkingen niet beschikbaar.

    Zie [Subagents](/nl/tools/subagents), [ACP Agents](/nl/tools/acp-agents) en [Configuratiereferentie](/nl/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Persistente ACP-kanaalbindingen">
    Configureer voor stabiele "altijd-aan" ACP-werkruimten top-level getypeerde ACP-bindingen die Discord-gesprekken targeten.

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
    - In een gebonden kanaal of thread resetten `/new` en `/reset` dezelfde ACP-sessie op zijn plaats. Tijdelijke threadbindingen kunnen doeloplossing overschrijven zolang ze actief zijn.
    - `spawnSessions` gate het maken/binden van onderliggende threads via `--thread auto|here`.

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
    `ackReaction` stuurt een bevestigingsemoji terwijl OpenClaw een inkomend bericht verwerkt.

    Oplossingsvolgorde:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - fallback naar agentidentiteitsemoji (`agents.list[].identity.emoji`, anders "👀")

    Opmerkingen:

    - Discord accepteert unicode-emoji of aangepaste emojinamen.
    - Gebruik `""` om de reactie voor een kanaal of account uit te schakelen.

  </Accordion>

  <Accordion title="Configuratieschrijfacties">
    Door kanalen geïnitieerde configuratieschrijfacties zijn standaard ingeschakeld.

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
    Routeer Discord Gateway WebSocket-verkeer en REST-lookups bij opstarten (applicatie-ID + oplossing van toestaanlijst) via een HTTP(S)-proxy met `channels.discord.proxy`.

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    Overschrijving per account:

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
    Schakel PluralKit-oplossing in om geproxiede berichten aan systeemlididentiteit te koppelen:

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

    - toestaanlijsten kunnen `pk:<memberId>` gebruiken
    - weergavenamen van leden worden alleen op naam/slug gematcht wanneer `channels.discord.dangerouslyAllowNameMatching: true`
    - lookups gebruiken oorspronkelijke bericht-ID en zijn beperkt tot een tijdvenster
    - als lookup mislukt, worden geproxiede berichten behandeld als botberichten en verwijderd tenzij `allowBots=true`

  </Accordion>

  <Accordion title="Uitgaande vermeldingsaliassen">
    Gebruik `mentionAliases` wanneer agents deterministische uitgaande vermeldingen voor bekende Discord-gebruikers nodig hebben. Sleutels zijn handles zonder de voorafgaande `@`; waarden zijn Discord-gebruikers-ID's. Onbekende handles, `@everyone`, `@here` en vermeldingen binnen Markdown-codespans blijven ongewijzigd.

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

    Activiteitstypemap:

    - 0: Spelen
    - 1: Streaming (vereist `activityUrl`)
    - 2: Luisteren
    - 3: Kijken
    - 4: Aangepast (gebruikt de activiteitstekst als statustoestand; emoji is optioneel)
    - 5: Deelnemen aan competitie

    Voorbeeld van automatische aanwezigheid (runtime-gezondheidssignaal):

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

    Automatische aanwezigheid koppelt runtimebeschikbaarheid aan Discord-status: gezond => online, verminderd of onbekend => inactief, uitgeput of niet beschikbaar => dnd. Optionele tekstoverschrijvingen:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (ondersteunt `{reason}`-placeholder)

  </Accordion>

  <Accordion title="Goedkeuringen in Discord">
    Discord ondersteunt knopgebaseerde goedkeuringsafhandeling in DM's en kan optioneel goedkeuringsprompts plaatsen in het oorspronkelijke kanaal.

    Configuratiepad:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (optioneel; valt waar mogelijk terug op `commands.ownerAllowFrom`)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, standaard: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord schakelt native exec-goedkeuringen automatisch in wanneer `enabled` niet is ingesteld of `"auto"` is en er minstens één goedkeurder kan worden bepaald, uit `execApprovals.approvers` of uit `commands.ownerAllowFrom`. Discord leidt exec-goedkeurders niet af uit kanaal-`allowFrom`, verouderde `dm.allowFrom` of direct-message `defaultTo`. Stel `enabled: false` in om Discord expliciet uit te schakelen als native goedkeuringsclient.

    Voor gevoelige, alleen-voor-eigenaren-groepscommando's zoals `/diagnostics` en `/export-trajectory` stuurt OpenClaw goedkeuringsprompts en eindresultaten privé. Het probeert eerst Discord-DM wanneer de aanroepende eigenaar een Discord-eigenaarroute heeft; als die niet beschikbaar is, valt het terug op de eerste beschikbare eigenaarroute uit `commands.ownerAllowFrom`, zoals Telegram.

    Wanneer `target` `channel` of `both` is, is de goedkeuringsprompt zichtbaar in het kanaal. Alleen bepaalde goedkeurders kunnen de knoppen gebruiken; andere gebruikers ontvangen een vluchtige weigering. Goedkeuringsprompts bevatten de commandotekst, dus schakel kanaalbezorging alleen in vertrouwde kanalen in. Als de kanaal-ID niet uit de sessiesleutel kan worden afgeleid, valt OpenClaw terug op DM-bezorging.

    Discord rendert ook de gedeelde goedkeuringsknoppen die door andere chatkanalen worden gebruikt. De native Discord-adapter voegt vooral DM-routering naar goedkeurders en kanaal-fanout toe.
    Wanneer die knoppen aanwezig zijn, vormen ze de primaire goedkeurings-UX; OpenClaw
    zou alleen een handmatig `/approve`-commando moeten opnemen wanneer het toolresultaat zegt
    dat chatgoedkeuringen niet beschikbaar zijn of handmatige goedkeuring de enige route is.
    Als de native Discord-goedkeuringsruntime niet actief is, houdt OpenClaw de
    lokale deterministische `/approve <id> <decision>`-prompt zichtbaar. Als de
    runtime actief is maar een native kaart niet aan een doel kan worden bezorgd,
    stuurt OpenClaw een fallbackmelding in dezelfde chat met het exacte `/approve`-
    commando uit de wachtende goedkeuring.

    Gateway-authenticatie en goedkeuringsresolutie volgen het gedeelde Gateway-clientcontract (`plugin:`-ID's worden via `plugin.approval.resolve` opgelost; andere ID's via `exec.approval.resolve`). Goedkeuringen verlopen standaard na 30 minuten.

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

De actie `event-create` accepteert een optionele parameter `image` (URL of lokaal bestandspad) om de omslagafbeelding van het geplande evenement in te stellen.

Actiepoorten staan onder `channels.discord.actions.*`.

Standaardpoortgedrag:

| Actiegroep                                                                                                                                                              | Standaard       |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| reacties, berichten, threads, pins, polls, zoeken, lidInfo, rolInfo, kanaalInfo, kanalen, spraakStatus, evenementen, stickers, emojiUploads, stickerUploads, machtigingen | ingeschakeld    |
| rollen                                                                                                                                                                  | uitgeschakeld   |
| moderatie                                                                                                                                                               | uitgeschakeld   |
| aanwezigheid                                                                                                                                                            | uitgeschakeld   |

## Components v2-UI

OpenClaw gebruikt Discord components v2 voor exec-goedkeuringen en cross-contextmarkeringen. Discord-berichtacties kunnen ook `components` accepteren voor aangepaste UI (geavanceerd; vereist het construeren van een componentpayload via de discord-tool), terwijl verouderde `embeds` beschikbaar blijven maar niet worden aanbevolen.

- `channels.discord.ui.components.accentColor` stelt de accentkleur in die door Discord-componentcontainers wordt gebruikt (hex).
- Stel dit per account in met `channels.discord.accounts.<id>.ui.components.accentColor`.
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

Discord heeft twee afzonderlijke spraakoppervlakken: realtime **spraakkanalen** (doorlopende gesprekken) en **spraakberichtbijlagen** (de waveform-previewindeling). De gateway ondersteunt beide.

### Spraakkanalen

Installatiechecklist:

1. Schakel Message Content Intent in de Discord Developer Portal in.
2. Schakel Server Members Intent in wanneer allowlists voor rollen/gebruikers worden gebruikt.
3. Nodig de bot uit met de scopes `bot` en `applications.commands`.
4. Verleen Connect, Speak, Send Messages en Read Message History in het doelspraakkanaal.
5. Schakel native commando's in (`commands.native` of `channels.discord.commands.native`).
6. Configureer `channels.discord.voice`.

Gebruik `/vc join|leave|status` om sessies te beheren. Het commando gebruikt de standaardagent van het account en volgt dezelfde allowlist- en groepsbeleidsregels als andere Discord-commando's.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

Voorbeeld van automatisch deelnemen:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.4-mini",
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
        tts: {
          provider: "openai",
          openai: { voice: "onyx" },
        },
      },
    },
  },
}
```

Opmerkingen:

- `voice.tts` overschrijft `messages.tts` alleen voor spraakweergave.
- `voice.model` overschrijft de LLM die alleen voor Discord-spraakkanaalantwoorden wordt gebruikt. Laat dit uitgeschakeld om het gerouteerde agentmodel te erven.
- STT gebruikt `tools.media.audio`; `voice.model` heeft geen invloed op transcriptie.
- Per-kanaal Discord-`systemPrompt`-overschrijvingen gelden voor spraaktranscriptiebeurten voor dat spraakkanaal.
- Spraaktranscriptiebeurten leiden eigenaarstatus af uit Discord-`allowFrom` (of `dm.allowFrom`); sprekers die geen eigenaar zijn hebben geen toegang tot tools die alleen voor eigenaren zijn (bijvoorbeeld `gateway` en `cron`).
- Discord-spraak is opt-in voor tekst-only configuraties; stel `channels.discord.voice.enabled=true` in (of behoud een bestaand `channels.discord.voice`-blok) om `/vc`-commando's, de spraakruntime en de `GuildVoiceStates` gateway-intentie in te schakelen.
- `channels.discord.intents.voiceStates` kan het abonnement op voice-state-intentie expliciet overschrijven. Laat dit uitgeschakeld zodat de intentie de effectieve spraakinschakeling volgt.
- `voice.daveEncryption` en `voice.decryptionFailureTolerance` worden doorgegeven aan de join-opties van `@discordjs/voice`.
- De standaarden van `@discordjs/voice` zijn `daveEncryption=true` en `decryptionFailureTolerance=24` als ze niet zijn ingesteld.
- `voice.connectTimeoutMs` beheert de initiële Ready-wachttijd van `@discordjs/voice` voor `/vc join` en pogingen tot automatisch deelnemen. Standaard: `30000`.
- `voice.reconnectGraceMs` beheert hoe lang OpenClaw wacht tot een losgekoppelde spraaksessie begint met opnieuw verbinden voordat die wordt vernietigd. Standaard: `15000`.
- OpenClaw bewaakt ook decryptiefouten bij ontvangst en herstelt automatisch door het spraakkanaal te verlaten en opnieuw te betreden na herhaalde fouten binnen een kort tijdvenster.
- Als ontvangstlogs na bijwerken herhaaldelijk `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` tonen, verzamel dan een afhankelijkheidsrapport en logs. De gebundelde `@discordjs/voice`-lijn bevat de upstream padding-fix uit discord.js PR #11449, waarmee discord.js issue #11419 werd gesloten.

Spraakkanaalpipeline:

- Discord PCM-opname wordt geconverteerd naar een tijdelijk WAV-bestand.
- `tools.media.audio` verwerkt STT, bijvoorbeeld `openai/gpt-4o-mini-transcribe`.
- Het transcript wordt via Discord-ingress en routering verzonden terwijl de antwoord-LLM draait met een beleid voor spraakuitvoer dat de agent-`tts`-tool verbergt en om geretourneerde tekst vraagt, omdat Discord-spraak de uiteindelijke TTS-weergave beheert.
- `voice.model`, wanneer ingesteld, overschrijft alleen de antwoord-LLM voor deze spraakkanaalbeurt.
- `voice.tts` wordt samengevoegd bovenop `messages.tts`; de resulterende audio wordt afgespeeld in het kanaal waaraan is deelgenomen.

Referenties worden per component opgelost: LLM-route-authenticatie voor `voice.model`, STT-authenticatie voor `tools.media.audio` en TTS-authenticatie voor `messages.tts`/`voice.tts`.

### Spraakberichten

Discord-spraakberichten tonen een waveform-preview en vereisen OGG/Opus-audio. OpenClaw genereert de waveform automatisch, maar heeft `ffmpeg` en `ffprobe` op de Gateway-host nodig om te inspecteren en te converteren.

- Geef een **lokaal bestandspad** op (URL's worden geweigerd).
- Laat tekstinhoud weg (Discord weigert tekst + spraakbericht in dezelfde payload).
- Elk audioformaat wordt geaccepteerd; OpenClaw converteert indien nodig naar OGG/Opus.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Probleemoplossing

<AccordionGroup>
  <Accordion title="Niet-toegestane intenties gebruikt of bot ziet geen guild-berichten">

    - schakel Message Content Intent in
    - schakel Server Members Intent in wanneer je afhankelijk bent van gebruiker-/lidresolutie
    - herstart Gateway na het wijzigen van intenties

  </Accordion>

  <Accordion title="Guild-berichten onverwacht geblokkeerd">

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

  <Accordion title="Require mention false maar nog steeds geblokkeerd">
    Veelvoorkomende oorzaken:

    - `groupPolicy="allowlist"` zonder overeenkomende guild-/kanaal-allowlist
    - `requireMention` op de verkeerde plaats geconfigureerd (moet onder `channels.discord.guilds` of kanaalvermelding staan)
    - afzender geblokkeerd door guild-/kanaal-`users`-allowlist

  </Accordion>

  <Accordion title="Langlopende Discord-beurten of dubbele antwoorden">

    Typische logs:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Discord Gateway-wachtrijknoppen:

    - enkel account: `channels.discord.eventQueue.listenerTimeout`
    - meerdere accounts: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - dit beheert alleen listenerwerk van de Discord Gateway, niet de levensduur van agentbeurten

    Discord past geen kanaaleigen timeout toe op in de wachtrij geplaatste agentbeurten. Berichtlisteners dragen onmiddellijk over, en in de wachtrij geplaatste Discord-runs behouden de volgorde per sessie totdat de sessie-/tool-/runtimelevenscyclus wordt voltooid of het werk afbreekt.

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

  <Accordion title="Time-outwaarschuwingen voor Gateway-metagegevensopzoeking">
    OpenClaw haalt Discord-`/gateway/bot`-metagegevens op voordat er verbinding wordt gemaakt. Tijdelijke fouten vallen terug op de standaard-Gateway-URL van Discord en worden in logs snelheidsbeperkt.

    Knoppen voor time-outs van metagegevens:

    - enkel account: `channels.discord.gatewayInfoTimeoutMs`
    - meerdere accounts: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - env-terugval wanneer config niet is ingesteld: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - standaard: `30000` (30 seconden), max: `120000`

  </Accordion>

  <Accordion title="Gateway READY-time-outs herstarten">
    OpenClaw wacht tijdens het opstarten en na runtime-herverbindingen op Discords Gateway-`READY`-event. Set-ups met meerdere accounts en gespreid opstarten kunnen een langer READY-venster bij het opstarten nodig hebben dan de standaardinstelling.

    Knoppen voor READY-time-outs:

    - opstarten enkel account: `channels.discord.gatewayReadyTimeoutMs`
    - opstarten meerdere accounts: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - env-terugval bij opstarten wanneer config niet is ingesteld: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - standaard bij opstarten: `15000` (15 seconden), max: `120000`
    - runtime enkel account: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - runtime meerdere accounts: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - env-terugval bij runtime wanneer config niet is ingesteld: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - standaard bij runtime: `30000` (30 seconden), max: `120000`

  </Accordion>

  <Accordion title="Mismatches bij rechtenaudit">
    `channels status --probe`-rechtencontroles werken alleen voor numerieke kanaal-ID's.

    Als je slug-sleutels gebruikt, kan runtime-matching nog steeds werken, maar probe kan rechten niet volledig verifiëren.

  </Accordion>

  <Accordion title="DM- en koppelingsproblemen">

    - DM uitgeschakeld: `channels.discord.dm.enabled=false`
    - DM-beleid uitgeschakeld: `channels.discord.dmPolicy="disabled"` (legacy: `channels.discord.dm.policy`)
    - wacht op koppelingsgoedkeuring in `pairing`-modus

  </Accordion>

  <Accordion title="Bot-naar-bot-lussen">
    Berichten die door bots zijn opgesteld, worden standaard genegeerd.

    Als je `channels.discord.allowBots=true` instelt, gebruik dan strikte vermeldings- en allowlist-regels om lusgedrag te voorkomen.
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

  <Accordion title="Voice-STT valt weg met DecryptionFailed(...)">

    - houd OpenClaw actueel (`openclaw update`), zodat de herstellogica voor Discord-spraakontvangst aanwezig is
    - bevestig `channels.discord.voice.daveEncryption=true` (standaard)
    - begin met `channels.discord.voice.decryptionFailureTolerance=24` (upstream-standaard) en stem alleen af indien nodig
    - let in logs op:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - als fouten na automatische heraansluiting doorgaan, verzamel logs en vergelijk ze met de upstream DAVE-ontvangstgeschiedenis in [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) en [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Configuratiereferentie

Primaire referentie: [Configuratiereferentie - Discord](/nl/gateway/config-channels#discord).

<Accordion title="Discord-velden met hoge signaalwaarde">

- opstarten/auth: `enabled`, `token`, `accounts.*`, `allowBots`
- beleid: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- commando: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- eventwachtrij: `eventQueue.listenerTimeout` (luisterbudget), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- antwoord/geschiedenis: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- levering: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming` (legacy-alias: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- media/opnieuw proberen: `mediaMaxMb` (beperkt uitgaande Discord-uploads, standaard `100MB`), `retry`
- acties: `actions.*`
- aanwezigheid: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- functies: `threadBindings`, top-level `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## Veiligheid en beheer

- Behandel bottokens als geheimen (`DISCORD_BOT_TOKEN` heeft de voorkeur in beheerde omgevingen).
- Verleen Discord-rechten met minimale privileges.
- Als commandodeploy/status verouderd is, herstart dan de Gateway en controleer opnieuw met `openclaw channels status --probe`.

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Koppelen" icon="link" href="/nl/channels/pairing">
    Koppel een Discord-gebruiker aan de Gateway.
  </Card>
  <Card title="Groepen" icon="users" href="/nl/channels/groups">
    Groepschat- en allowlist-gedrag.
  </Card>
  <Card title="Kanaalroutering" icon="route" href="/nl/channels/channel-routing">
    Routeer inkomende berichten naar agents.
  </Card>
  <Card title="Beveiliging" icon="shield" href="/nl/gateway/security">
    Dreigingsmodel en hardening.
  </Card>
  <Card title="Multi-agent-routering" icon="sitemap" href="/nl/concepts/multi-agent">
    Koppel guilds en kanalen aan agents.
  </Card>
  <Card title="Slash-commando's" icon="terminal" href="/nl/tools/slash-commands">
    Native commandogedrag.
  </Card>
</CardGroup>
