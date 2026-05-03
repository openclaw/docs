---
read_when:
    - Werken aan functies voor Discord-kanalen
summary: Status, mogelijkheden en configuratie van Discord-botondersteuning
title: Discord
x-i18n:
    generated_at: "2026-05-03T21:27:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3a38cb3c8e25c1f3d6b7ddfc35a0445dc264be74d74b08d0051528b462b743a3
    source_path: channels/discord.md
    workflow: 16
---

Klaar voor DM's en guild-kanalen via de officiële Discord Gateway.

<CardGroup cols={3}>
  <Card title="Koppelen" icon="link" href="/nl/channels/pairing">
    Discord-DM's gebruiken standaard de koppelmodus.
  </Card>
  <Card title="Slash-opdrachten" icon="terminal" href="/nl/tools/slash-commands">
    Native opdrachtgedrag en opdrachtcatalogus.
  </Card>
  <Card title="Kanaalproblemen oplossen" icon="wrench" href="/nl/channels/troubleshooting">
    Cross-channel diagnostiek en herstelstroom.
  </Card>
</CardGroup>

## Snelle installatie

Je moet een nieuwe applicatie met een bot maken, de bot aan je server toevoegen en deze koppelen aan OpenClaw. We raden aan je bot aan je eigen privéserver toe te voegen. Als je er nog geen hebt, [maak er dan eerst een](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (kies **Create My Own > For me and my friends**).

<Steps>
  <Step title="Maak een Discord-applicatie en bot">
    Ga naar de [Discord Developer Portal](https://discord.com/developers/applications) en klik op **New Application**. Geef deze een naam zoals "OpenClaw".

    Klik op **Bot** in de zijbalk. Stel de **Username** in op hoe je je OpenClaw-agent noemt.

  </Step>

  <Step title="Schakel privileged intents in">
    Blijf op de pagina **Bot**, scrol omlaag naar **Privileged Gateway Intents** en schakel in:

    - **Message Content Intent** (vereist)
    - **Server Members Intent** (aanbevolen; vereist voor rol-allowlists en naam-naar-ID-matching)
    - **Presence Intent** (optioneel; alleen nodig voor aanwezigheidsupdates)

  </Step>

  <Step title="Kopieer je bottoken">
    Scrol terug omhoog op de pagina **Bot** en klik op **Reset Token**.

    <Note>
    Ondanks de naam genereert dit je eerste token — er wordt niets "gereset".
    </Note>

    Kopieer het token en bewaar het ergens. Dit is je **Bot Token** en je hebt het zo nodig.

  </Step>

  <Step title="Genereer een uitnodigings-URL en voeg de bot toe aan je server">
    Klik op **OAuth2** in de zijbalk. Je genereert een uitnodigings-URL met de juiste machtigingen om de bot aan je server toe te voegen.

    Scrol omlaag naar **OAuth2 URL Generator** en schakel in:

    - `bot`
    - `applications.commands`

    Er verschijnt hieronder een sectie **Bot Permissions**. Schakel ten minste in:

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (optioneel)

    Dit is de basisset voor normale tekstkanalen. Als je van plan bent in Discord-threads te posten, inclusief workflows voor forum- of mediakanalen die een thread maken of voortzetten, schakel dan ook **Send Messages in Threads** in.
    Kopieer de gegenereerde URL onderaan, plak deze in je browser, selecteer je server en klik op **Continue** om verbinding te maken. Je zou je bot nu in de Discord-server moeten zien.

  </Step>

  <Step title="Schakel Developer Mode in en verzamel je ID's">
    Terug in de Discord-app moet je Developer Mode inschakelen zodat je interne ID's kunt kopiëren.

    1. Klik op **User Settings** (tandwielpictogram naast je avatar) → **Advanced** → schakel **Developer Mode** in
    2. Klik met de rechtermuisknop op je **server icon** in de zijbalk → **Copy Server ID**
    3. Klik met de rechtermuisknop op je **own avatar** → **Copy User ID**

    Bewaar je **Server ID** en **User ID** naast je Bot Token — je stuurt ze alle drie in de volgende stap naar OpenClaw.

  </Step>

  <Step title="Sta DM's van serverleden toe">
    Voor koppelen moet Discord toestaan dat je bot je een DM stuurt. Klik met de rechtermuisknop op je **server icon** → **Privacy Settings** → schakel **Direct Messages** in.

    Hierdoor kunnen serverleden (inclusief bots) je DM's sturen. Laat dit ingeschakeld als je Discord-DM's met OpenClaw wilt gebruiken. Als je alleen guild-kanalen wilt gebruiken, kun je DM's na het koppelen uitschakelen.

  </Step>

  <Step title="Stel je bottoken veilig in (stuur het niet in chat)">
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

    Als OpenClaw al als achtergrondservice draait, start deze dan opnieuw via de OpenClaw Mac-app of door het proces `openclaw gateway run` te stoppen en opnieuw te starten.
    Voor beheerde service-installaties voer je `openclaw gateway install` uit vanuit een shell waarin `DISCORD_BOT_TOKEN` aanwezig is, of sla je de variabele op in `~/.openclaw/.env`, zodat de service de env SecretRef na herstart kan oplossen.
    Als je host wordt geblokkeerd of gerate-limiteerd door Discords startup application lookup, stel dan de Discord-application/client-ID in vanuit de Developer Portal, zodat startup die REST-call kan overslaan. Gebruik `channels.discord.applicationId` voor het standaardaccount, of `channels.discord.accounts.<accountId>.applicationId` wanneer je meerdere Discord-bots draait.

  </Step>

  <Step title="Configureer OpenClaw en koppel">

    <Tabs>
      <Tab title="Vraag het je agent">
        Chat met je OpenClaw-agent op een bestaand kanaal (bijv. Telegram) en vertel het hem. Als Discord je eerste kanaal is, gebruik dan in plaats daarvan het tabblad CLI / config.

        > "Ik heb mijn Discord-bottoken al in de configuratie ingesteld. Rond Discord-installatie af met User ID `<user_id>` en Server ID `<server_id>`."
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

        Voor gescripte of externe installatie schrijf je hetzelfde JSON5-blok met `openclaw config patch --file ./discord.patch.json5 --dry-run` en voer je het daarna opnieuw uit zonder `--dry-run`. Platte tekstwaarden voor `token` worden ondersteund. SecretRef-waarden worden ook ondersteund voor `channels.discord.token` via env/file/exec-providers. Zie [Geheimenbeheer](/nl/gateway/secrets).

        Voor meerdere Discord-bots houd je elk bottoken en elke application ID onder het eigen account. Een top-level `channels.discord.applicationId` wordt door accounts geërfd, dus stel deze daar alleen in wanneer elk account dezelfde application ID moet gebruiken.

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
    Wacht tot de Gateway draait en stuur je bot daarna een DM in Discord. Deze reageert met een koppelcode.

    <Tabs>
      <Tab title="Vraag het je agent">
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
Tokenresolutie is account-bewust. Config-tokenwaarden winnen van env-fallback. `DISCORD_BOT_TOKEN` wordt alleen gebruikt voor het standaardaccount.
Als twee ingeschakelde Discord-accounts naar hetzelfde bottoken resolven, start OpenClaw slechts één Gateway-monitor voor dat token. Een token uit config wint van de standaard env-fallback; anders wint het eerste ingeschakelde account en wordt het dubbele account als uitgeschakeld gemeld.
Voor geavanceerde uitgaande calls (berichttool/kanaalacties) wordt een expliciet per-call `token` gebruikt voor die call. Dit geldt voor send- en read/probe-achtige acties (bijvoorbeeld read/search/fetch/thread/pins/permissions). Accountbeleid/retry-instellingen komen nog steeds uit het geselecteerde account in de actieve runtime-snapshot.
</Note>

## Aanbevolen: Stel een guild-werkruimte in

Zodra DM's werken, kun je je Discord-server instellen als volledige werkruimte waar elk kanaal zijn eigen agentsessie met eigen context krijgt. Dit wordt aanbevolen voor privéservers waar alleen jij en je bot aanwezig zijn.

<Steps>
  <Step title="Voeg je server toe aan de guild-allowlist">
    Hierdoor kan je agent in elk kanaal op je server reageren, niet alleen in DM's.

    <Tabs>
      <Tab title="Vraag het je agent">
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

  <Step title="Sta reacties zonder @mention toe">
    Standaard reageert je agent in guild-kanalen alleen wanneer deze met @ wordt genoemd. Voor een privéserver wil je waarschijnlijk dat deze op elk bericht reageert.

    In guild-kanalen blijven normale definitieve antwoorden van de assistant standaard privé. Zichtbare Discord-uitvoer moet expliciet met de tool `message` worden verzonden, zodat de agent standaard kan meelezen en alleen post wanneer hij besluit dat een kanaalantwoord nuttig is.

    <Tabs>
      <Tab title="Vraag het je agent">
        > "Sta toe dat mijn agent op deze server reageert zonder dat hij met @ genoemd hoeft te worden"
      </Tab>
      <Tab title="Config">
        Stel `requireMention: false` in je guild-config in:

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

        Om legacy automatische definitieve antwoorden voor groeps-/kanaalruimtes te herstellen, stel je `messages.groupChat.visibleReplies: "automatic"` in.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Plan voor geheugen in guild-kanalen">
    Standaard wordt langetermijngeheugen (MEMORY.md) alleen in DM-sessies geladen. Guild-kanalen laden MEMORY.md niet automatisch.

    <Tabs>
      <Tab title="Vraag het je agent">
        > "Wanneer ik vragen stel in Discord-kanalen, gebruik memory_search of memory_get als je langetermijncontext uit MEMORY.md nodig hebt."
      </Tab>
      <Tab title="Handmatig">
        Als je gedeelde context in elk kanaal nodig hebt, plaats dan de stabiele instructies in `AGENTS.md` of `USER.md` (deze worden voor elke sessie geïnjecteerd). Bewaar langetermijnnotities in `MEMORY.md` en open ze op aanvraag met geheugentools.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Maak nu enkele kanalen op je Discord-server en begin met chatten. Je agent kan de kanaalnaam zien, en elk kanaal krijgt zijn eigen geïsoleerde sessie — zodat je `#coding`, `#home`, `#research` of wat ook bij je workflow past kunt instellen.

## Runtimemodel

- Gateway beheert de Discord-verbinding.
- Antwoordroutering is deterministisch: inkomende Discord-antwoorden gaan terug naar Discord.
- Metadata van Discord-guilds/-kanalen wordt aan de modelprompt toegevoegd als niet-vertrouwde
  context, niet als een voor de gebruiker zichtbaar antwoordvoorvoegsel. Als een model die envelop
  terugkopieert, verwijdert OpenClaw de gekopieerde metadata uit uitgaande antwoorden en uit
  toekomstige replaycontext.
- Standaard (`session.dmScope=main`) delen directe chats de hoofdsessie van de agent (`agent:main:main`).
- Guild-kanalen zijn geïsoleerde sessiesleutels (`agent:<agentId>:discord:channel:<channelId>`).
- Groeps-DM's worden standaard genegeerd (`channels.discord.dm.groupEnabled=false`).
- Native slash-opdrachten draaien in geïsoleerde opdrachtsessies (`agent:<agentId>:discord:slash:<userId>`), terwijl ze nog steeds `CommandTargetSessionKey` meenemen naar de gerouteerde conversatiesessie.
- Tekst-only cron/heartbeat-aankondigingen naar Discord gebruiken het uiteindelijke
  voor de assistant zichtbare antwoord één keer. Media en gestructureerde componentpayloads blijven
  uit meerdere berichten bestaan wanneer de agent meerdere leverbare payloads uitzendt.

## Forumkanalen

Discord-forum- en mediakanalen accepteren alleen threadberichten. OpenClaw ondersteunt twee manieren om die te maken:

- Stuur een bericht naar het forumhoofdkanaal (`channel:<forumId>`) om automatisch een thread te maken. De threadtitel gebruikt de eerste niet-lege regel van je bericht.
- Gebruik `openclaw message thread create` om direct een thread te maken. Geef geen `--message-id` door voor forumkanalen.

Voorbeeld: stuur naar het forumhoofdkanaal om een thread te maken

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Voorbeeld: maak expliciet een forumthread

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Forumhoofdkanaal accepteert geen Discord-componenten. Als je componenten nodig hebt, stuur dan naar de thread zelf (`channel:<threadId>`).

## Interactieve componenten

OpenClaw ondersteunt Discord components v2-containers voor agentberichten. Gebruik de berichttool met een `components`-payload. Interactieresultaten worden terug naar de agent gerouteerd als normale inkomende berichten en volgen de bestaande Discord-`replyToMode`-instellingen.

Ondersteunde blokken:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Actierijen staan maximaal 5 knoppen of één selectiemenu toe
- Selectietypen: `string`, `user`, `role`, `mentionable`, `channel`

Standaard zijn componenten voor eenmalig gebruik. Stel `components.reusable=true` in om knoppen, selecties en formulieren meerdere keren te laten gebruiken totdat ze verlopen.

Om te beperken wie op een knop kan klikken, stel je `allowedUsers` in op die knop (Discord-gebruikers-ID's, tags of `*`). Wanneer dit is geconfigureerd, ontvangen niet-overeenkomende gebruikers een tijdelijke weigering.

De `/model`- en `/models`-slash-opdrachten openen een interactieve modelkiezer met dropdowns voor provider, model en compatibele runtime plus een verzendstap. `/models add` is verouderd en retourneert nu een verouderingsbericht in plaats van modellen vanuit chat te registreren. Het antwoord van de kiezer is tijdelijk en alleen de aanroepende gebruiker kan het gebruiken.

Bestandsbijlagen:

- `file`-blokken moeten verwijzen naar een bijlagereferentie (`attachment://<filename>`)
- Lever de bijlage via `media`/`path`/`filePath` (één bestand); gebruik `media-gallery` voor meerdere bestanden
- Gebruik `filename` om de uploadnaam te overschrijven wanneer die overeen moet komen met de bijlagereferentie

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
    `channels.discord.dmPolicy` beheert DM-toegang. `channels.discord.allowFrom` is de canonieke DM-toestaanlijst.

    - `pairing` (standaard)
    - `allowlist`
    - `open` (vereist dat `channels.discord.allowFrom` `"*"` bevat)
    - `disabled`

    Als het DM-beleid niet open is, worden onbekende gebruikers geblokkeerd (of gevraagd te koppelen in de modus `pairing`).

    Prioriteit bij meerdere accounts:

    - `channels.discord.accounts.default.allowFrom` is alleen van toepassing op het `default`-account.
    - Voor één account heeft `allowFrom` voorrang op het legacy `dm.allowFrom`.
    - Benoemde accounts erven `channels.discord.allowFrom` wanneer hun eigen `allowFrom` en legacy `dm.allowFrom` niet zijn ingesteld.
    - Benoemde accounts erven `channels.discord.accounts.default.allowFrom` niet.

    Legacy `channels.discord.dm.policy` en `channels.discord.dm.allowFrom` worden nog steeds gelezen voor compatibiliteit. `openclaw doctor --fix` migreert ze naar `dmPolicy` en `allowFrom` wanneer dat kan zonder de toegang te wijzigen.

    DM-doelformaat voor aflevering:

    - `user:<id>`
    - `<@id>`-vermelding

    Kale numerieke ID's worden normaal als kanaal-ID's opgelost wanneer een kanaalstandaard actief is, maar ID's die in de effectieve DM-`allowFrom` van het account staan, worden voor compatibiliteit behandeld als gebruikers-DM-doelen.

  </Tab>

  <Tab title="DM-toegangsgroepen">
    Discord-DM's kunnen dynamische `accessGroup:<name>`-vermeldingen gebruiken in `channels.discord.allowFrom`.

    Namen van toegangsgroepen worden gedeeld tussen berichtkanalen. Gebruik `type: "message.senders"` voor een statische groep waarvan de leden worden uitgedrukt in de normale `allowFrom`-syntaxis van elk kanaal, of `type: "discord.channelAudience"` wanneer het huidige `ViewChannel`-publiek van een Discord-kanaal het lidmaatschap dynamisch moet definiëren. Gedeeld gedrag van toegangsgroepen is hier gedocumenteerd: [Toegangsgroepen](/nl/channels/access-groups).

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

    Een Discord-tekstkanaal heeft geen aparte ledenlijst. `type: "discord.channelAudience"` modelleert lidmaatschap als volgt: de DM-afzender is lid van de geconfigureerde guild en heeft momenteel effectieve `ViewChannel`-rechten op het geconfigureerde kanaal nadat rol- en kanaaloverschrijvingen zijn toegepast.

    Voorbeeld: sta iedereen die `#maintainers` kan zien toe de bot een DM te sturen, terwijl DM's voor alle anderen gesloten blijven.

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

    Je kunt dynamische en statische vermeldingen mengen:

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

    Lookups falen gesloten. Als Discord `Missing Access` retourneert, de ledenlookup mislukt of het kanaal bij een andere guild hoort, wordt de DM-afzender als onbevoegd behandeld.

    Schakel in de Discord Developer Portal de **Server Members Intent** voor de bot in wanneer je toegangsgroepen op basis van kanaalpubliek gebruikt. DM's bevatten geen guildlidstatus, dus OpenClaw lost het lid op via Discord REST op het moment van autorisatie.

  </Tab>

  <Tab title="Guild-beleid">
    Guild-afhandeling wordt beheerd door `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    De veilige basisinstelling wanneer `channels.discord` bestaat is `allowlist`.

    Gedrag van `allowlist`:

    - guild moet overeenkomen met `channels.discord.guilds` (`id` aanbevolen, slug geaccepteerd)
    - optionele toestaanlijsten voor afzenders: `users` (stabiele ID's aanbevolen) en `roles` (alleen rol-ID's); als een van beide is geconfigureerd, zijn afzenders toegestaan wanneer ze overeenkomen met `users` OF `roles`
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

    Als je alleen `DISCORD_BOT_TOKEN` instelt en geen `channels.discord`-blok maakt, is de runtimefallback `groupPolicy="allowlist"` (met een waarschuwing in de logs), zelfs als `channels.defaults.groupPolicy` `open` is.

  </Tab>

  <Tab title="Vermeldingen en groeps-DM's">
    Guild-berichten zijn standaard door vermeldingen afgeschermd.

    Vermeldingsdetectie omvat:

    - expliciete botvermelding
    - geconfigureerde vermeldingspatronen (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - impliciet antwoord-op-bot-gedrag in ondersteunde gevallen

    Gebruik bij het schrijven van uitgaande Discord-berichten canonieke vermeldingssyntaxis: `<@USER_ID>` voor gebruikers, `<#CHANNEL_ID>` voor kanalen en `<@&ROLE_ID>` voor rollen. Gebruik niet de legacy nickname-vermeldingsvorm `<@!USER_ID>`.

    `requireMention` wordt per guild/kanaal geconfigureerd (`channels.discord.guilds...`).
    `ignoreOtherMentions` laat optioneel berichten vallen die een andere gebruiker/rol vermelden maar niet de bot (met uitzondering van @everyone/@here).

    Groeps-DM's:

    - standaard: genegeerd (`dm.groupEnabled=false`)
    - optionele toestaanlijst via `dm.groupChannels` (kanaal-ID's of slugs)

  </Tab>
</Tabs>

### Rolgebaseerde agentroutering

Gebruik `bindings[].match.roles` om Discord-guildleden op basis van rol-ID naar verschillende agents te routeren. Rolgebaseerde bindings accepteren alleen rol-ID's en worden geëvalueerd na peer- of parent-peer-bindings en vóór guild-only bindings. Als een binding ook andere matchvelden instelt (bijvoorbeeld `peer` + `guildId` + `roles`), moeten alle geconfigureerde velden overeenkomen.

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

## Native opdrachten en opdrachtauthenticatie

- `commands.native` staat standaard op `"auto"` en is ingeschakeld voor Discord.
- Overschrijving per kanaal: `channels.discord.commands.native`.
- `commands.native=false` slaat registratie en opschoning van Discord-slash-opdrachten tijdens het opstarten over. Eerder geregistreerde opdrachten kunnen zichtbaar blijven in Discord totdat je ze uit de Discord-app verwijdert.
- Verificatie voor native opdrachten gebruikt dezelfde Discord-toelatingslijsten en beleidsregels als normale berichtafhandeling.
- Opdrachten kunnen nog steeds zichtbaar zijn in de Discord-UI voor gebruikers die niet geautoriseerd zijn; uitvoering dwingt nog steeds OpenClaw-verificatie af en retourneert "niet geautoriseerd".

Zie [Slash-opdrachten](/nl/tools/slash-commands) voor de opdrachtencatalogus en het gedrag.

Standaardinstellingen voor slash-opdrachten:

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

    Opmerking: `off` schakelt impliciete antwoordthreads uit. Expliciete `[[reply_to_*]]`-tags worden nog steeds gerespecteerd.
    `first` koppelt de impliciete native antwoordreferentie altijd aan het eerste uitgaande Discord-bericht voor de beurt.
    `batched` koppelt Discord's impliciete native antwoordreferentie alleen wanneer de
    inkomende beurt een gedebouncete batch van meerdere berichten was. Dit is nuttig
    wanneer je native antwoorden vooral wilt voor dubbelzinnige chatbursts, niet voor elke
    beurt met één bericht.

    Bericht-ID's worden in context/geschiedenis weergegeven zodat agents specifieke berichten kunnen targeten.

  </Accordion>

  <Accordion title="Live stream-preview">
    OpenClaw kan conceptantwoorden streamen door een tijdelijk bericht te sturen en het te bewerken terwijl tekst binnenkomt. `channels.discord.streaming` accepteert `off` (standaard) | `partial` | `block` | `progress`. `progress` behoudt één bewerkbaar statusconcept en werkt dit bij met toolvoortgang tot de definitieve levering; `streamMode` is een verouderde alias en wordt automatisch gemigreerd.

    De standaard blijft `off`, omdat Discord-previewbewerkingen snel rate limits raken wanneer meerdere bots of gateways een account delen.

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

    - `partial` bewerkt één previewbericht terwijl tokens binnenkomen.
    - `block` geeft conceptgrote chunks uit (gebruik `draftChunk` om grootte en breekpunten af te stemmen, begrensd op `textChunkLimit`).
    - Media, fouten en definitieve antwoorden met expliciete reply annuleren wachtende previewbewerkingen.
    - `streaming.preview.toolProgress` (standaard `true`) bepaalt of tool-/voortgangsupdates het previewbericht hergebruiken.

    Previewstreaming is alleen tekst; media-antwoorden vallen terug op normale levering. Wanneer `block`-streaming expliciet is ingeschakeld, slaat OpenClaw de previewstream over om dubbel streamen te voorkomen.

  </Accordion>

  <Accordion title="Geschiedenis, context en threadgedrag">
    Guildgeschiedeniscontext:

    - `channels.discord.historyLimit` standaard `20`
    - fallback: `messages.groupChat.historyLimit`
    - `0` schakelt uit

    DM-geschiedenisinstellingen:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Threadgedrag:

    - Discord-threads worden als kanaalsessies gerouteerd en erven de configuratie van het bovenliggende kanaal tenzij overschreven.
    - Threadsessies erven de sessieniveau-`/model`-selectie van het bovenliggende kanaal als model-only fallback; thread-lokale `/model`-selecties krijgen nog steeds voorrang en de transcriptgeschiedenis van het bovenliggende kanaal wordt niet gekopieerd tenzij transcriptovererving is ingeschakeld.
    - `channels.discord.thread.inheritParent` (standaard `false`) laat nieuwe automatische threads zaaien vanuit het bovenliggende transcript. Overschrijvingen per account staan onder `channels.discord.accounts.<id>.thread.inheritParent`.
    - Berichttoolreacties kunnen `user:<id>`-DM-doelen oplossen.
    - `guilds.<guild>.channels.<channel>.requireMention: false` blijft behouden tijdens de reply-stage activation fallback.

    Kanaalonderwerpen worden geïnjecteerd als **niet-vertrouwde** context. Toelatingslijsten bepalen wie de agent kan activeren, niet een volledige redactielimiet voor aanvullende context.

  </Accordion>

  <Accordion title="Threadgebonden sessies voor subagents">
    Discord kan een thread binden aan een sessiedoel, zodat vervolgberichten in die thread naar dezelfde sessie blijven routeren (inclusief subagentsessies).

    Opdrachten:

    - `/focus <target>` bind huidige/nieuwe thread aan een subagent-/sessiedoel
    - `/unfocus` verwijder de huidige threadbinding
    - `/agents` toon actieve runs en bindingsstatus
    - `/session idle <duration|off>` inspecteer/update automatische ontfocus na inactiviteit voor gefocuste bindingen
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

    - `session.threadBindings.*` stelt globale standaarden in.
    - `channels.discord.threadBindings.*` overschrijft Discord-gedrag.
    - `spawnSessions` beheert automatisch maken/binden van threads voor `sessions_spawn({ thread: true })` en ACP-threadspawns. Standaard: `true`.
    - `defaultSpawnContext` beheert native subagentcontext voor threadgebonden spawns. Standaard: `"fork"`.
    - Verouderde sleutels `spawnSubagentSessions`/`spawnAcpSessions` worden gemigreerd door `openclaw doctor --fix`.
    - Als threadbindingen voor een account zijn uitgeschakeld, zijn `/focus` en gerelateerde threadbindingsbewerkingen niet beschikbaar.

    Zie [Subagents](/nl/tools/subagents), [ACP-agents](/nl/tools/acp-agents) en [Configuratiereferentie](/nl/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Persistente ACP-kanaalbindingen">
    Configureer typed ACP-bindingen op topniveau die Discord-gesprekken targeten voor stabiele "altijd-aan" ACP-werkruimtes.

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
    - In een gebonden kanaal of thread resetten `/new` en `/reset` dezelfde ACP-sessie op zijn plaats. Tijdelijke threadbindingen kunnen doelresolutie overschrijven terwijl ze actief zijn.
    - `spawnSessions` beheert het maken/binden van childthreads via `--thread auto|here`.

    Zie [ACP-agents](/nl/tools/acp-agents) voor details over bindingsgedrag.

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

    Resolutievolgorde:

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

    Dit beïnvloedt `/config set|unset`-flows (wanneer opdrachtfuncties zijn ingeschakeld).

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
    Routeer Discord Gateway WebSocket-verkeer en REST-lookups bij het opstarten (applicatie-ID + toelatingslijstresolutie) via een HTTP(S)-proxy met `channels.discord.proxy`.

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
    Schakel PluralKit-resolutie in om proxied berichten te koppelen aan systeemlididentiteit:

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

    - toelatingslijsten kunnen `pk:<memberId>` gebruiken
    - weergavenamen van leden worden alleen op naam/slug gematcht wanneer `channels.discord.dangerouslyAllowNameMatching: true`
    - lookups gebruiken de oorspronkelijke bericht-ID en zijn beperkt tot een tijdvenster
    - als lookup mislukt, worden proxied berichten behandeld als botberichten en verwijderd tenzij `allowBots=true`

  </Accordion>

  <Accordion title="Uitgaande vermeldingaliassen">
    Gebruik `mentionAliases` wanneer agents deterministische uitgaande vermeldingen nodig hebben voor bekende Discord-gebruikers. Sleutels zijn handles zonder de voorafgaande `@`; waarden zijn Discord-gebruikers-ID's. Onbekende handles, `@everyone`, `@here` en vermeldingen binnen Markdown-codespans blijven ongewijzigd.

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
    - 1: Streamen (vereist `activityUrl`)
    - 2: Luisteren
    - 3: Kijken
    - 4: Aangepast (gebruikt de activiteitstekst als statusstatus; emoji is optioneel)
    - 5: Meedoen

    Voorbeeld van automatische aanwezigheid (runtimegezondheidssignaal):

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

    Automatische aanwezigheid koppelt runtimebeschikbaarheid aan Discord-status: gezond => online, verminderd of onbekend => idle, uitgeput of niet beschikbaar => dnd. Optionele tekstoverschrijvingen:

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

    Discord schakelt native exec-goedkeuringen automatisch in wanneer `enabled` niet is ingesteld of `"auto"` is en ten minste één goedkeurder kan worden bepaald, hetzij via `execApprovals.approvers`, hetzij via `commands.ownerAllowFrom`. Discord leidt exec-goedkeurders niet af uit kanaal-`allowFrom`, legacy `dm.allowFrom` of direct-message `defaultTo`. Stel `enabled: false` in om Discord expliciet uit te schakelen als native goedkeuringsclient.

    Voor gevoelige groepsopdrachten die alleen voor eigenaren zijn, zoals `/diagnostics` en `/export-trajectory`, verzendt OpenClaw goedkeuringsprompts en eindresultaten privé. Het probeert eerst Discord-DM wanneer de aanroepende eigenaar een Discord-eigenaarsroute heeft; als die niet beschikbaar is, valt het terug op de eerste beschikbare eigenaarsroute uit `commands.ownerAllowFrom`, zoals Telegram.

    Wanneer `target` `channel` of `both` is, is de goedkeuringsprompt zichtbaar in het kanaal. Alleen bepaalde goedkeurders kunnen de knoppen gebruiken; andere gebruikers ontvangen een tijdelijke weigering. Goedkeuringsprompts bevatten de opdrachttekst, dus schakel kanaallevering alleen in vertrouwde kanalen in. Als de kanaal-ID niet uit de sessiesleutel kan worden afgeleid, valt OpenClaw terug op levering via DM.

    Discord rendert ook de gedeelde goedkeuringsknoppen die door andere chatkanalen worden gebruikt. De native Discord-adapter voegt vooral DM-routering voor goedkeurders en kanaalfanout toe.
    Wanneer die knoppen aanwezig zijn, vormen zij de primaire goedkeurings-UX; OpenClaw
    mag alleen een handmatige `/approve`-opdracht opnemen wanneer het toolresultaat aangeeft
    dat chatgoedkeuringen niet beschikbaar zijn of dat handmatige goedkeuring de enige route is.
    Als de native Discord-goedkeuringsruntime niet actief is, houdt OpenClaw de
    lokale deterministische `/approve <id> <decision>`-prompt zichtbaar. Als de
    runtime actief is maar een native kaart niet aan een doel kan worden geleverd,
    verzendt OpenClaw een fallbackmelding in dezelfde chat met de exacte `/approve`-
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

Actiepoorten staan onder `channels.discord.actions.*`.

Standaardpoortgedrag:

| Actiegroep                                                                                                                                                              | Standaard      |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | ingeschakeld   |
| roles                                                                                                                                                                    | uitgeschakeld  |
| moderation                                                                                                                                                               | uitgeschakeld  |
| presence                                                                                                                                                                 | uitgeschakeld  |

## Components v2-UI

OpenClaw gebruikt Discord components v2 voor exec-goedkeuringen en cross-contextmarkeringen. Discord-berichtacties kunnen ook `components` accepteren voor aangepaste UI (geavanceerd; vereist het construeren van een componentpayload via de discord-tool), terwijl legacy `embeds` beschikbaar blijven maar niet worden aanbevolen.

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

Discord heeft twee afzonderlijke spraakoppervlakken: realtime **spraakkanalen** (doorlopende gesprekken) en **spraakberichtbijlagen** (het golfvormvoorbeeldformaat). De Gateway ondersteunt beide.

### Spraakkanalen

Setup-checklist:

1. Schakel Message Content Intent in de Discord Developer Portal in.
2. Schakel Server Members Intent in wanneer rol-/gebruikersallowlists worden gebruikt.
3. Nodig de bot uit met de scopes `bot` en `applications.commands`.
4. Verleen Connect, Speak, Send Messages en Read Message History in het doel-spraakkanaal.
5. Schakel native opdrachten in (`commands.native` of `channels.discord.commands.native`).
6. Configureer `channels.discord.voice`.

Gebruik `/vc join|leave|status` om sessies te beheren. De opdracht gebruikt de standaardagent van het account en volgt dezelfde allowlist- en groepsbeleidsregels als andere Discord-opdrachten.

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
- `voice.model` overschrijft de LLM die alleen voor Discord-spraakkanaalreacties wordt gebruikt. Laat dit niet ingesteld om het gerouteerde agentmodel te erven.
- STT gebruikt `tools.media.audio`; `voice.model` heeft geen invloed op transcriptie.
- Discord-overschrijvingen van `systemPrompt` per kanaal zijn van toepassing op spraaktranscriptbeurten voor dat spraakkanaal.
- Spraaktranscriptbeurten leiden eigenaarsstatus af uit Discord `allowFrom` (of `dm.allowFrom`); sprekers die geen eigenaar zijn, hebben geen toegang tot tools die alleen voor eigenaren zijn (bijvoorbeeld `gateway` en `cron`).
- Discord-spraak is opt-in voor configuraties met alleen tekst; stel `channels.discord.voice.enabled=true` in (of behoud een bestaand `channels.discord.voice`-blok) om `/vc`-opdrachten, de spraakruntime en de `GuildVoiceStates` Gateway-intentie in te schakelen.
- `channels.discord.intents.voiceStates` kan het abonnement op de voice-state-intentie expliciet overschrijven. Laat dit niet ingesteld zodat de intentie de effectieve spraakinschakeling volgt.
- `voice.daveEncryption` en `voice.decryptionFailureTolerance` worden doorgegeven aan de join-opties van `@discordjs/voice`.
- De standaardwaarden van `@discordjs/voice` zijn `daveEncryption=true` en `decryptionFailureTolerance=24` als ze niet zijn ingesteld.
- `voice.connectTimeoutMs` beheert de initiële Ready-wachttijd van `@discordjs/voice` voor `/vc join` en pogingen om automatisch deel te nemen. Standaard: `30000`.
- `voice.reconnectGraceMs` bepaalt hoelang OpenClaw wacht totdat een losgekoppelde spraaksessie begint met opnieuw verbinden voordat deze wordt vernietigd. Standaard: `15000`.
- OpenClaw bewaakt ook decryptiefouten bij ontvangen audio en herstelt automatisch door het spraakkanaal te verlaten en opnieuw toe te treden na herhaalde fouten in een kort tijdsvenster.
- Als ontvangstlogs na een update herhaaldelijk `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` tonen, verzamel dan een afhankelijkheidsrapport en logs. De gebundelde `@discordjs/voice`-lijn bevat de upstream padding-fix uit discord.js PR #11449, waarmee discord.js-issue #11419 is gesloten.

Pipeline voor spraakkanalen:

- Discord PCM-opname wordt geconverteerd naar een tijdelijk WAV-bestand.
- `tools.media.audio` verwerkt STT, bijvoorbeeld `openai/gpt-4o-mini-transcribe`.
- Het transcript wordt via Discord-ingress en routering verzonden terwijl de respons-LLM draait met een voice-outputbeleid dat de agenttool `tts` verbergt en om geretourneerde tekst vraagt, omdat Discord-spraak eigenaar is van de uiteindelijke TTS-weergave.
- `voice.model`, indien ingesteld, overschrijft alleen de respons-LLM voor deze spraakkanaalbeurt.
- `voice.tts` wordt over `messages.tts` samengevoegd; de resulterende audio wordt afgespeeld in het kanaal waaraan is deelgenomen.

Credentials worden per component opgelost: LLM-route-authenticatie voor `voice.model`, STT-authenticatie voor `tools.media.audio` en TTS-authenticatie voor `messages.tts`/`voice.tts`.

### Spraakberichten

Discord-spraakberichten tonen een golfvormvoorbeeld en vereisen OGG/Opus-audio. OpenClaw genereert de golfvorm automatisch, maar heeft `ffmpeg` en `ffprobe` op de Gateway-host nodig om te inspecteren en te converteren.

- Geef een **lokaal bestandspad** op (URL's worden geweigerd).
- Laat tekstinhoud weg (Discord weigert tekst + spraakbericht in dezelfde payload).
- Elk audioformaat wordt geaccepteerd; OpenClaw converteert zo nodig naar OGG/Opus.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Probleemoplossing

<AccordionGroup>
  <Accordion title="Niet-toegestane intents gebruikt of bot ziet geen guildberichten">

    - schakel Message Content Intent in
    - schakel Server Members Intent in wanneer u afhankelijk bent van gebruikers-/ledenresolutie
    - herstart Gateway na het wijzigen van intents

  </Accordion>

  <Accordion title="Guildberichten onverwacht geblokkeerd">

    - controleer `groupPolicy`
    - controleer de guild-allowlist onder `channels.discord.guilds`
    - als er een guild-`channels`-map bestaat, zijn alleen vermelde kanalen toegestaan
    - controleer het gedrag van `requireMention` en vermeldingspatronen

    Nuttige controles:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false maar nog steeds geblokkeerd">
    Veelvoorkomende oorzaken:

    - `groupPolicy="allowlist"` zonder overeenkomende guild-/kanaalallowlist
    - `requireMention` op de verkeerde plaats geconfigureerd (moet onder `channels.discord.guilds` of kanaalitem staan)
    - afzender geblokkeerd door guild-/kanaal-`users`-allowlist

  </Accordion>

  <Accordion title="Langlopende Discord-beurten of dubbele antwoorden">

    Typische logs:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Discord Gateway-wachtrij-instellingen:

    - enkel account: `channels.discord.eventQueue.listenerTimeout`
    - meerdere accounts: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - dit beheert alleen listenerwerk van de Discord Gateway, niet de levensduur van agentbeurten

    Discord past geen kanaaleigen timeout toe op agentbeurten in de wachtrij. Berichtlisteners dragen onmiddellijk over, en Discord-runs in de wachtrij behouden de volgorde per sessie totdat de sessie-/tool-/runtimelevenscyclus is voltooid of het werk afbreekt.

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

  <Accordion title="Waarschuwingen over time-outs bij Gateway-metadatalookup">
    OpenClaw haalt Discord `/gateway/bot`-metadata op voordat verbinding wordt gemaakt. Tijdelijke fouten vallen terug op de standaard-Gateway-URL van Discord en worden in logs rate-limited.

    Metadata-timeoutinstellingen:

    - enkel account: `channels.discord.gatewayInfoTimeoutMs`
    - meerdere accounts: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - env-fallback wanneer configuratie niet is ingesteld: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - standaard: `30000` (30 seconden), max: `120000`

  </Accordion>

  <Accordion title="Herstarts bij Gateway READY-time-out">
    OpenClaw wacht tijdens het opstarten en na runtime-herverbindingen op Discords gateway-`READY`-event. Multi-account-configuraties met gespreid opstarten kunnen een langer opstartvenster voor READY nodig hebben dan de standaardwaarde.

    READY-time-outknoppen:

    - opstarten single-account: `channels.discord.gatewayReadyTimeoutMs`
    - opstarten multi-account: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - opstarten env-fallback wanneer configuratie niet is ingesteld: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - standaardwaarde voor opstarten: `15000` (15 seconden), max.: `120000`
    - runtime single-account: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - runtime multi-account: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - runtime env-fallback wanneer configuratie niet is ingesteld: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - standaardwaarde voor runtime: `30000` (30 seconden), max.: `120000`

  </Accordion>

  <Accordion title="Mismatches in machtigingsaudit">
    `channels status --probe`-machtigingscontroles werken alleen voor numerieke kanaal-ID's.

    Als je slug-sleutels gebruikt, kan runtime-matching nog steeds werken, maar probe kan machtigingen niet volledig verifiëren.

  </Accordion>

  <Accordion title="DM- en koppelingsproblemen">

    - DM uitgeschakeld: `channels.discord.dm.enabled=false`
    - DM-beleid uitgeschakeld: `channels.discord.dmPolicy="disabled"` (legacy: `channels.discord.dm.policy`)
    - wacht op koppelingsgoedkeuring in `pairing`-modus

  </Accordion>

  <Accordion title="Bot-naar-bot-loops">
    Standaard worden berichten die door bots zijn geschreven genegeerd.

    Als je `channels.discord.allowBots=true` instelt, gebruik dan strikte regels voor vermeldingen en allowlists om loop-gedrag te voorkomen.
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

    - houd OpenClaw actueel (`openclaw update`) zodat de herstel-logica voor Discord-spraakontvangst aanwezig is
    - bevestig `channels.discord.voice.daveEncryption=true` (standaard)
    - begin met `channels.discord.voice.decryptionFailureTolerance=24` (upstream-standaard) en stem alleen af indien nodig
    - controleer logs op:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - als fouten na automatisch opnieuw deelnemen blijven optreden, verzamel dan logs en vergelijk die met de upstream DAVE-ontvangstgeschiedenis in [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) en [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Configuratiereferentie

Primaire referentie: [Configuratiereferentie - Discord](/nl/gateway/config-channels#discord).

<Accordion title="Discord-velden met hoge signaalwaarde">

- opstarten/auth: `enabled`, `token`, `accounts.*`, `allowBots`
- beleid: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- opdracht: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- eventwachtrij: `eventQueue.listenerTimeout` (listenerbudget), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- antwoord/geschiedenis: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- aflevering: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming` (legacy alias: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- media/opnieuw proberen: `mediaMaxMb` (beperkt uitgaande Discord-uploads, standaard `100MB`), `retry`
- acties: `actions.*`
- aanwezigheid: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- functies: `threadBindings`, top-level `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## Veiligheid en beheer

- Behandel bottokens als geheimen (`DISCORD_BOT_TOKEN` heeft de voorkeur in beheerde omgevingen).
- Verleen Discord-machtigingen volgens het principe van minimale rechten.
- Als opdrachtimplementatie/-status verouderd is, herstart dan de Gateway en controleer opnieuw met `openclaw channels status --probe`.

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Koppeling" icon="link" href="/nl/channels/pairing">
    Koppel een Discord-gebruiker aan de gateway.
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
    Wijs guilds en kanalen toe aan agents.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/nl/tools/slash-commands">
    Native opdrachtgedrag.
  </Card>
</CardGroup>
