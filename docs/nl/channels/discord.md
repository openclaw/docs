---
read_when:
    - Werken aan Discord-kanaalfuncties
summary: Ondersteuningsstatus, mogelijkheden en configuratie voor Discord-bots
title: Discord
x-i18n:
    generated_at: "2026-05-07T13:13:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 805a093452b7af1c844919cdf776d898c6fd39f63f1bf363967dd471842eebd5
    source_path: channels/discord.md
    workflow: 16
---

Klaar voor DM's en guild-kanalen via de officiële Discord Gateway.

<CardGroup cols={3}>
  <Card title="Koppelen" icon="link" href="/nl/channels/pairing">
    Discord-DM's gebruiken standaard de koppelmodus.
  </Card>
  <Card title="Slash-opdrachten" icon="terminal" href="/nl/tools/slash-commands">
    Native opdrachtgedrag en opdrachtencatalogus.
  </Card>
  <Card title="Probleemoplossing voor kanalen" icon="wrench" href="/nl/channels/troubleshooting">
    Diagnostiek en herstelstroom voor meerdere kanalen.
  </Card>
</CardGroup>

## Snelle installatie

Je moet een nieuwe applicatie met een bot maken, de bot aan je server toevoegen en deze aan OpenClaw koppelen. We raden aan je bot aan je eigen privéserver toe te voegen. Als je er nog geen hebt, [maak er dan eerst een](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (kies **Create My Own > For me and my friends**).

<Steps>
  <Step title="Maak een Discord-applicatie en bot">
    Ga naar de [Discord Developer Portal](https://discord.com/developers/applications) en klik op **New Application**. Geef de applicatie een naam zoals "OpenClaw".

    Klik op **Bot** in de zijbalk. Stel de **Username** in op hoe je je OpenClaw-agent noemt.

  </Step>

  <Step title="Schakel geprivilegieerde intents in">
    Blijf op de pagina **Bot**, scrol omlaag naar **Privileged Gateway Intents** en schakel het volgende in:

    - **Message Content Intent** (vereist)
    - **Server Members Intent** (aanbevolen; vereist voor rol-allowlists en naam-naar-ID-koppeling)
    - **Presence Intent** (optioneel; alleen nodig voor aanwezigheidsupdates)

  </Step>

  <Step title="Kopieer je bot-token">
    Scrol weer omhoog op de pagina **Bot** en klik op **Reset Token**.

    <Note>
    Ondanks de naam genereert dit je eerste token — er wordt niets "gereset".
    </Note>

    Kopieer het token en sla het ergens op. Dit is je **Bot Token** en je hebt het zo meteen nodig.

  </Step>

  <Step title="Genereer een uitnodigings-URL en voeg de bot toe aan je server">
    Klik op **OAuth2** in de zijbalk. Je genereert een uitnodigings-URL met de juiste rechten om de bot aan je server toe te voegen.

    Scrol omlaag naar **OAuth2 URL Generator** en schakel het volgende in:

    - `bot`
    - `applications.commands`

    Daaronder verschijnt een sectie **Bot Permissions**. Schakel ten minste het volgende in:

    **General Permissions**
      - Kanalen bekijken
    **Text Permissions**
      - Berichten verzenden
      - Berichtgeschiedenis lezen
      - Links insluiten
      - Bestanden bijvoegen
      - Reacties toevoegen (optioneel)

    Dit is de basisset voor normale tekstkanalen. Als je van plan bent in Discord-threads te posten, inclusief workflows voor forum- of mediakanalen die een thread maken of voortzetten, schakel dan ook **Send Messages in Threads** in.
    Kopieer de gegenereerde URL onderaan, plak deze in je browser, selecteer je server en klik op **Continue** om verbinding te maken. Je zou je bot nu in de Discord-server moeten zien.

  </Step>

  <Step title="Schakel Ontwikkelaarsmodus in en verzamel je ID's">
    Terug in de Discord-app moet je Ontwikkelaarsmodus inschakelen zodat je interne ID's kunt kopiëren.

    1. Klik op **User Settings** (tandwielpictogram naast je avatar) → **Advanced** → schakel **Developer Mode** in
    2. Klik met de rechtermuisknop op je **serverpictogram** in de zijbalk → **Copy Server ID**
    3. Klik met de rechtermuisknop op je **eigen avatar** → **Copy User ID**

    Sla je **Server ID** en **User ID** op naast je Bot Token — je stuurt ze alle drie in de volgende stap naar OpenClaw.

  </Step>

  <Step title="Sta DM's van serverleden toe">
    Om koppelen te laten werken, moet Discord toestaan dat je bot je een DM stuurt. Klik met de rechtermuisknop op je **serverpictogram** → **Privacy Settings** → schakel **Direct Messages** in.

    Hierdoor kunnen serverleden (inclusief bots) je DM's sturen. Laat dit ingeschakeld als je Discord-DM's met OpenClaw wilt gebruiken. Als je alleen guild-kanalen wilt gebruiken, kun je DM's na het koppelen uitschakelen.

  </Step>

  <Step title="Stel je bot-token veilig in (stuur het niet in chat)">
    Je Discord-bot-token is een geheim (zoals een wachtwoord). Stel het in op de machine waarop OpenClaw draait voordat je je agent een bericht stuurt.

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

    Als OpenClaw al als achtergrondservice draait, herstart je het via de OpenClaw Mac-app of door het `openclaw gateway run`-proces te stoppen en opnieuw te starten.
    Voor installaties als beheerde service voer je `openclaw gateway install` uit vanuit een shell waarin `DISCORD_BOT_TOKEN` aanwezig is, of sla je de variabele op in `~/.openclaw/.env`, zodat de service de env SecretRef na herstart kan oplossen.
    Als je host wordt geblokkeerd of geratelimiteerd door Discord's applicatie-opzoekactie bij het opstarten, stel dan de Discord-applicatie-/client-ID uit de Developer Portal in zodat het opstarten die REST-call kan overslaan. Gebruik `channels.discord.applicationId` voor het standaardaccount, of `channels.discord.accounts.<accountId>.applicationId` wanneer je meerdere Discord-bots gebruikt.

  </Step>

  <Step title="Configureer OpenClaw en koppel">

    <Tabs>
      <Tab title="Vraag het je agent">
        Chat met je OpenClaw-agent op een bestaand kanaal (bijv. Telegram) en vertel het hem. Als Discord je eerste kanaal is, gebruik dan in plaats daarvan de CLI / configuratie-tab.

        > "Ik heb mijn Discord-bot-token al in de configuratie ingesteld. Rond de Discord-installatie af met User ID `<user_id>` en Server ID `<server_id>`."
      </Tab>
      <Tab title="CLI / configuratie">
        Als je bestandsgebaseerde configuratie verkiest, stel dan het volgende in:

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

        Voor scripted of externe installatie schrijf je hetzelfde JSON5-blok met `openclaw config patch --file ./discord.patch.json5 --dry-run` en voer je het daarna opnieuw uit zonder `--dry-run`. Platte-tekstwaarden voor `token` worden ondersteund. SecretRef-waarden worden ook ondersteund voor `channels.discord.token` via env/file/exec-providers. Zie [Geheimenbeheer](/nl/gateway/secrets).

        Houd voor meerdere Discord-bots elk bot-token en elke applicatie-ID onder het eigen account. Een top-level `channels.discord.applicationId` wordt door accounts geërfd, dus stel dit daar alleen in wanneer elk account dezelfde applicatie-ID moet gebruiken.

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
Tokenoplossing is accountbewust. Configuratietokenwaarden winnen van env-fallback. `DISCORD_BOT_TOKEN` wordt alleen gebruikt voor het standaardaccount.
Als twee ingeschakelde Discord-accounts naar hetzelfde bot-token oplossen, start OpenClaw slechts één Gateway-monitor voor dat token. Een uit configuratie afkomstig token wint van de standaard env-fallback; anders wint het eerste ingeschakelde account en wordt het dubbele account als uitgeschakeld gemeld.
Voor geavanceerde uitgaande calls (berichttool/kanaalacties) wordt een expliciete per-call `token` gebruikt voor die call. Dit geldt voor acties in de stijl verzenden en lezen/proberen (bijvoorbeeld read/search/fetch/thread/pins/permissions). Accountbeleid en instellingen voor opnieuw proberen komen nog steeds uit het geselecteerde account in de actieve runtime-snapshot.
</Note>

## Aanbevolen: stel een guild-werkruimte in

Zodra DM's werken, kun je je Discord-server instellen als een volledige werkruimte waarin elk kanaal een eigen agentsessie met eigen context krijgt. Dit wordt aanbevolen voor privéservers waar alleen jij en je bot aanwezig zijn.

<Steps>
  <Step title="Voeg je server toe aan de guild-allowlist">
    Hierdoor kan je agent reageren in elk kanaal op je server, niet alleen in DM's.

    <Tabs>
      <Tab title="Vraag het je agent">
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
    Standaard reageert je agent in guild-kanalen alleen wanneer hij @mentioned wordt. Voor een privéserver wil je waarschijnlijk dat hij op elk bericht reageert.

    In guild-kanalen blijven normale definitieve assistentantwoorden standaard privé. Zichtbare Discord-uitvoer moet expliciet met de `message`-tool worden verzonden, zodat de agent standaard kan meelezen en alleen post wanneer hij besluit dat een kanaalantwoord nuttig is.

    Dit betekent dat het geselecteerde model betrouwbaar tools moet aanroepen. Als Discord typen toont en de logs tokengebruik tonen maar er geen bericht is geplaatst, controleer dan de sessielog op assistenttekst met `didSendViaMessagingTool: false`. Dat betekent dat het model een privé definitief antwoord heeft geproduceerd in plaats van `message(action=send)` aan te roepen. Schakel over naar een sterker tool-aanroepend model, of gebruik de configuratie hieronder om verouderde automatische definitieve antwoorden te herstellen.

    <Tabs>
      <Tab title="Vraag het je agent">
        > "Sta toe dat mijn agent op deze server reageert zonder @mentioned te hoeven worden"
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

        Stel `messages.groupChat.visibleReplies: "automatic"` in om verouderde automatische definitieve antwoorden voor groeps-/kanaalruimten te herstellen.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Plan voor geheugen in guild-kanalen">
    Standaard wordt langetermijngeheugen (MEMORY.md) alleen geladen in DM-sessies. Guild-kanalen laden MEMORY.md niet automatisch.

    <Tabs>
      <Tab title="Vraag het je agent">
        > "Wanneer ik vragen stel in Discord-kanalen, gebruik memory_search of memory_get als je langetermijncontext uit MEMORY.md nodig hebt."
      </Tab>
      <Tab title="Handmatig">
        Als je gedeelde context in elk kanaal nodig hebt, zet dan de stabiele instructies in `AGENTS.md` of `USER.md` (ze worden voor elke sessie geïnjecteerd). Bewaar langetermijnnotities in `MEMORY.md` en open ze op aanvraag met geheugentools.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Maak nu enkele kanalen op je Discord-server en begin met chatten. Je agent kan de kanaalnaam zien, en elk kanaal krijgt zijn eigen geïsoleerde sessie — zodat je `#coding`, `#home`, `#research` of wat dan ook bij je workflow past kunt instellen.

## Runtimemodel

- Gateway beheert de Discord-verbinding.
- Antwoordroutering is deterministisch: inkomende Discord-antwoorden gaan terug naar Discord.
- Discord-guild-/kanaalmetadata wordt aan de modelprompt toegevoegd als niet-vertrouwde
  context, niet als een voor gebruikers zichtbaar antwoordvoorvoegsel. Als een model die envelop
  terugkopieert, verwijdert OpenClaw de gekopieerde metadata uit uitgaande antwoorden en uit
  toekomstige replay-context.
- Standaard (`session.dmScope=main`) delen directe chats de hoofdsessie van de agent (`agent:main:main`).
- Guild-kanalen zijn geisoleerde sessiesleutels (`agent:<agentId>:discord:channel:<channelId>`).
- Groeps-DM's worden standaard genegeerd (`channels.discord.dm.groupEnabled=false`).
- Native slash-commando's worden uitgevoerd in geisoleerde commandosessies (`agent:<agentId>:discord:slash:<userId>`), terwijl ze nog steeds `CommandTargetSessionKey` meenemen naar de gerouteerde gesprekssessie.
- Tekst-only Cron-/Heartbeat-aankondigingen naar Discord gebruiken het uiteindelijke
  voor de assistent zichtbare antwoord eenmaal. Media en gestructureerde component-payloads blijven
  multi-message wanneer de agent meerdere bezorgbare payloads uitzendt.

## Forumkanalen

Discord-forum- en mediakanalen accepteren alleen threadberichten. OpenClaw ondersteunt twee manieren om ze te maken:

- Stuur een bericht naar de forumouder (`channel:<forumId>`) om automatisch een thread te maken. De threadtitel gebruikt de eerste niet-lege regel van je bericht.
- Gebruik `openclaw message thread create` om direct een thread te maken. Geef geen `--message-id` door voor forumkanalen.

Voorbeeld: stuur naar de forumouder om een thread te maken

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Voorbeeld: maak expliciet een forumthread

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Forumouders accepteren geen Discord-componenten. Als je componenten nodig hebt, stuur dan naar de thread zelf (`channel:<threadId>`).

## Interactieve componenten

OpenClaw ondersteunt Discord components v2-containers voor agentberichten. Gebruik de berichttool met een `components`-payload. Interactieresultaten worden teruggerouteerd naar de agent als normale inkomende berichten en volgen de bestaande Discord-`replyToMode`-instellingen.

Ondersteunde blokken:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Actierijen staan maximaal 5 knoppen of een enkel selectiemenu toe
- Selectietypen: `string`, `user`, `role`, `mentionable`, `channel`

Standaard zijn componenten eenmalig te gebruiken. Stel `components.reusable=true` in om knoppen, selecties en formulieren meerdere keren te laten gebruiken totdat ze verlopen.

Om te beperken wie op een knop kan klikken, stel je `allowedUsers` in op die knop (Discord-gebruikers-ID's, tags of `*`). Wanneer dit is geconfigureerd, ontvangen niet-overeenkomende gebruikers een tijdelijke weigering.

De slash-commando's `/model` en `/models` openen een interactieve modelkiezer met provider-, model- en compatibele runtime-dropdowns plus een Submit-stap. `/models add` is verouderd en retourneert nu een verouderingsbericht in plaats van modellen vanuit chat te registreren. Het kiezerantwoord is tijdelijk en alleen de aanroepende gebruiker kan het gebruiken.

Bestandsbijlagen:

- `file`-blokken moeten naar een bijlagereferentie wijzen (`attachment://<filename>`)
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
  <Tab title="DM-beleid">
    `channels.discord.dmPolicy` beheert DM-toegang. `channels.discord.allowFrom` is de canonieke DM-allowlist.

    - `pairing` (standaard)
    - `allowlist`
    - `open` (vereist dat `channels.discord.allowFrom` `"*"` bevat)
    - `disabled`

    Als het DM-beleid niet open is, worden onbekende gebruikers geblokkeerd (of gevraagd om te koppelen in `pairing`-modus).

    Prioriteit bij meerdere accounts:

    - `channels.discord.accounts.default.allowFrom` geldt alleen voor het `default`-account.
    - Voor een account heeft `allowFrom` prioriteit boven verouderd `dm.allowFrom`.
    - Benoemde accounts erven `channels.discord.allowFrom` wanneer hun eigen `allowFrom` en verouderd `dm.allowFrom` niet zijn ingesteld.
    - Benoemde accounts erven `channels.discord.accounts.default.allowFrom` niet.

    Verouderde `channels.discord.dm.policy` en `channels.discord.dm.allowFrom` worden nog steeds gelezen voor compatibiliteit. `openclaw doctor --fix` migreert ze naar `dmPolicy` en `allowFrom` wanneer dat kan zonder de toegang te wijzigen.

    DM-doelindeling voor bezorging:

    - `user:<id>`
    - `<@id>`-vermelding

    Kale numerieke ID's worden normaal gesproken als kanaal-ID's opgelost wanneer een kanaalstandaard actief is, maar ID's die in de effectieve DM-`allowFrom` van het account staan, worden voor compatibiliteit behandeld als gebruikers-DM-doelen.

  </Tab>

  <Tab title="DM-toegangsgroepen">
    Discord-DM's kunnen dynamische `accessGroup:<name>`-items gebruiken in `channels.discord.allowFrom`.

    Namen van toegangsgroepen worden gedeeld tussen berichtkanalen. Gebruik `type: "message.senders"` voor een statische groep waarvan de leden worden uitgedrukt in de normale `allowFrom`-syntaxis van elk kanaal, of `type: "discord.channelAudience"` wanneer het huidige `ViewChannel`-publiek van een Discord-kanaal het lidmaatschap dynamisch moet definieren. Gedeeld gedrag voor toegangsgroepen is hier gedocumenteerd: [Toegangsgroepen](/nl/channels/access-groups).

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

    Een Discord-tekstkanaal heeft geen afzonderlijke ledenlijst. `type: "discord.channelAudience"` modelleert lidmaatschap als volgt: de DM-afzender is lid van de geconfigureerde guild en heeft momenteel effectieve `ViewChannel`-toestemming op het geconfigureerde kanaal nadat rol- en kanaaloverschrijvingen zijn toegepast.

    Voorbeeld: sta iedereen die `#maintainers` kan zien toe om de bot een DM te sturen, terwijl DM's voor alle anderen gesloten blijven.

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

    Je kunt dynamische en statische items mengen:

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

    Lookups falen gesloten. Als Discord `Missing Access` retourneert, de ledenlookup mislukt, of het kanaal bij een andere guild hoort, wordt de DM-afzender als ongeautoriseerd behandeld.

    Schakel in het Discord Developer Portal **Server Members Intent** in voor de bot wanneer je toegangsgroepen op basis van kanaalpubliek gebruikt. DM's bevatten geen guild-lidstatus, dus OpenClaw lost het lid op via Discord REST tijdens autorisatie.

  </Tab>

  <Tab title="Guildbeleid">
    Guildafhandeling wordt beheerd door `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    Veilige basisinstelling wanneer `channels.discord` bestaat, is `allowlist`.

    `allowlist`-gedrag:

    - guild moet overeenkomen met `channels.discord.guilds` (`id` aanbevolen, slug geaccepteerd)
    - optionele allowlists voor afzenders: `users` (stabiele ID's aanbevolen) en `roles` (alleen rol-ID's); als een van beide is geconfigureerd, zijn afzenders toegestaan wanneer ze overeenkomen met `users` OF `roles`
    - directe naam-/tagmatching is standaard uitgeschakeld; schakel `channels.discord.dangerouslyAllowNameMatching: true` alleen in als break-glass-compatibiliteitsmodus
    - namen/tags worden ondersteund voor `users`, maar ID's zijn veiliger; `openclaw security audit` waarschuwt wanneer naam-/tagitems worden gebruikt
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

    Als je alleen `DISCORD_BOT_TOKEN` instelt en geen `channels.discord`-blok maakt, is de runtime-fallback `groupPolicy="allowlist"` (met een waarschuwing in logs), zelfs als `channels.defaults.groupPolicy` `open` is.

  </Tab>

  <Tab title="Vermeldingen en groeps-DM's">
    Guildberichten vereisen standaard een vermelding.

    Vermeldingsdetectie omvat:

    - expliciete botvermelding
    - geconfigureerde vermeldingspatronen (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - impliciet antwoord-op-botgedrag in ondersteunde gevallen

    Gebruik bij het schrijven van uitgaande Discord-berichten canonieke vermeldingssyntaxis: `<@USER_ID>` voor gebruikers, `<#CHANNEL_ID>` voor kanalen en `<@&ROLE_ID>` voor rollen. Gebruik niet het verouderde bijnaamvermeldingsformulier `<@!USER_ID>`.

    `requireMention` wordt per guild/kanaal geconfigureerd (`channels.discord.guilds...`).
    `ignoreOtherMentions` laat optioneel berichten vallen die een andere gebruiker/rol vermelden maar niet de bot (met uitzondering van @everyone/@here).

    Groeps-DM's:

    - standaard: genegeerd (`dm.groupEnabled=false`)
    - optionele allowlist via `dm.groupChannels` (kanaal-ID's of slugs)

  </Tab>
</Tabs>

### Rolgebaseerde agentroutering

Gebruik `bindings[].match.roles` om Discord-guildleden per rol-ID naar verschillende agents te routeren. Rolgebaseerde bindings accepteren alleen rol-ID's en worden geevalueerd na peer- of parent-peer-bindings en voor guild-only-bindings. Als een binding ook andere matchvelden instelt (bijvoorbeeld `peer` + `guildId` + `roles`), moeten alle geconfigureerde velden overeenkomen.

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
- Override per kanaal: `channels.discord.commands.native`.
- `commands.native=false` slaat registratie en opschoning van Discord-slash-commands tijdens het opstarten over. Eerder geregistreerde opdrachten kunnen zichtbaar blijven in Discord totdat je ze uit de Discord-app verwijdert.
- Authenticatie voor native opdrachten gebruikt dezelfde Discord-allowlists/beleidsregels als normale berichtverwerking.
- Opdrachten kunnen nog steeds zichtbaar zijn in de Discord-UI voor gebruikers die niet geautoriseerd zijn; uitvoering handhaaft nog steeds OpenClaw-authenticatie en retourneert "not authorized".

Zie [Slash-commands](/nl/tools/slash-commands) voor de opdrachtcatalogus en het gedrag.

Standaardinstellingen voor slash-commands:

- `ephemeral: true`

## Functiedetails

<AccordionGroup>
  <Accordion title="Reply tags and native replies">
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
    `batched` koppelt de impliciete native antwoordreferentie van Discord alleen wanneer de
    inkomende beurt een gedebouncete batch van meerdere berichten was. Dit is nuttig
    wanneer je native antwoorden vooral wilt voor dubbelzinnige chats met veel korte berichten, niet voor elke
    beurt met één bericht.

    Bericht-ID's worden zichtbaar gemaakt in context/geschiedenis zodat agents specifieke berichten kunnen targeten.

  </Accordion>

  <Accordion title="Live stream preview">
    OpenClaw kan conceptantwoorden streamen door een tijdelijk bericht te verzenden en dit te bewerken terwijl tekst binnenkomt. `channels.discord.streaming` accepteert `off` | `partial` | `block` | `progress` (standaard). `progress` behoudt één bewerkbaar statusconcept en werkt dit bij met toolvoortgang tot de uiteindelijke levering; `streamMode` is een verouderde runtime-alias. Voer `openclaw doctor --fix` uit om persistente configuratie naar de canonieke sleutel te herschrijven.

    Stel `channels.discord.streaming.mode` in op `off` om Discord-previewbewerkingen uit te schakelen. Als Discord-blockstreaming expliciet is ingeschakeld, slaat OpenClaw de previewstream over om dubbel streamen te voorkomen.

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

    - `partial` bewerkt één previewbericht terwijl tokens binnenkomen.
    - `block` verzendt conceptgrote chunks (gebruik `draftChunk` om grootte en breekpunten af te stemmen, begrensd op `textChunkLimit`).
    - Media, fouten en expliciete antwoordfinales annuleren wachtende previewbewerkingen.
    - `streaming.preview.toolProgress` (standaard `true`) bepaalt of tool-/voortgangsupdates het previewbericht hergebruiken.
    - `streaming.preview.commandText` / `streaming.progress.commandText` bepaalt opdracht-/exec-details in compacte voortgangsregels: `raw` (standaard) of `status` (alleen toollabel).

    Verberg ruwe opdracht-/exec-tekst terwijl compacte voortgangsregels behouden blijven:

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

    Previewstreaming is alleen tekst; media-antwoorden vallen terug op normale levering. Wanneer `block`-streaming expliciet is ingeschakeld, slaat OpenClaw de previewstream over om dubbel streamen te voorkomen.

  </Accordion>

  <Accordion title="History, context, and thread behavior">
    Guildgeschiedeniscontext:

    - `channels.discord.historyLimit` standaard `20`
    - fallback: `messages.groupChat.historyLimit`
    - `0` schakelt uit

    Besturing voor DM-geschiedenis:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Threadgedrag:

    - Discord-threads worden gerouteerd als kanaalsessies en erven bovenliggende kanaalconfiguratie tenzij overschreven.
    - Threadsessies erven de sessieniveau-`/model`-selectie van het bovenliggende kanaal als fallback alleen voor het model; threadlokale `/model`-selecties krijgen nog steeds voorrang en transcriptgeschiedenis van de parent wordt niet gekopieerd tenzij transcriptovererving is ingeschakeld.
    - `channels.discord.thread.inheritParent` (standaard `false`) laat nieuwe auto-threads seeden vanuit het parenttranscript. Overrides per account staan onder `channels.discord.accounts.<id>.thread.inheritParent`.
    - Berichttoolreacties kunnen `user:<id>`-DM-targets oplossen.
    - `guilds.<guild>.channels.<channel>.requireMention: false` blijft behouden tijdens fallback voor activatie in de antwoordfase.

    Kanaalonderwerpen worden geïnjecteerd als **niet-vertrouwde** context. Allowlists bepalen wie de agent kan triggeren, niet een volledige redactiegrens voor aanvullende context.

  </Accordion>

  <Accordion title="Thread-bound sessions for subagents">
    Discord kan een thread aan een sessietarget binden zodat vervolgberichten in die thread naar dezelfde sessie blijven routeren (inclusief subagentsessies).

    Opdrachten:

    - `/focus <target>` bind huidige/nieuwe thread aan een subagent-/sessietarget
    - `/unfocus` verwijder de huidige threadbinding
    - `/agents` toon actieve runs en bindingsstatus
    - `/session idle <duration|off>` inspecteer/werk automatische inactiviteitsontfocus bij voor gefocuste bindingen
    - `/session max-age <duration|off>` inspecteer/werk harde maximale leeftijd bij voor gefocuste bindingen

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
    - `spawnSessions` beheert automatisch aanmaken/binden van threads voor `sessions_spawn({ thread: true })` en ACP-threadspawns. Standaard: `true`.
    - `defaultSpawnContext` beheert native subagentcontext voor threadgebonden spawns. Standaard: `"fork"`.
    - Verouderde sleutels `spawnSubagentSessions`/`spawnAcpSessions` worden gemigreerd door `openclaw doctor --fix`.
    - Als threadbindingen voor een account zijn uitgeschakeld, zijn `/focus` en gerelateerde threadbindingsbewerkingen niet beschikbaar.

    Zie [Subagents](/nl/tools/subagents), [ACP Agents](/nl/tools/acp-agents) en [Configuratiereferentie](/nl/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Persistent ACP channel bindings">
    Configureer voor stabiele "altijd-aan" ACP-workspaces topniveau getypeerde ACP-bindingen die op Discord-gesprekken targeten.

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

    - `/acp spawn codex --bind here` bindt het huidige kanaal of de huidige thread op de plek zelf en houdt toekomstige berichten op dezelfde ACP-sessie. Threadberichten erven de bovenliggende kanaalbinding.
    - In een gebonden kanaal of gebonden thread resetten `/new` en `/reset` dezelfde ACP-sessie op de plek zelf. Tijdelijke threadbindingen kunnen targetresolutie overschrijven zolang ze actief zijn.
    - `spawnSessions` beheert aanmaken/binden van childthreads via `--thread auto|here`.

    Zie [ACP Agents](/nl/tools/acp-agents) voor details over bindingsgedrag.

  </Accordion>

  <Accordion title="Reaction notifications">
    Reactiemeldingsmodus per guild:

    - `off`
    - `own` (standaard)
    - `all`
    - `allowlist` (gebruikt `guilds.<id>.users`)

    Reactie-events worden omgezet naar systeemevents en gekoppeld aan de gerouteerde Discord-sessie.

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction` verzendt een bevestigings-emoji terwijl OpenClaw een inkomend bericht verwerkt.

    Resolutievolgorde:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - fallback naar emoji van agentidentiteit (`agents.list[].identity.emoji`, anders "👀")

    Opmerkingen:

    - Discord accepteert unicode-emoji of aangepaste emojinamen.
    - Gebruik `""` om de reactie voor een kanaal of account uit te schakelen.

  </Accordion>

  <Accordion title="Config writes">
    Door kanalen geïnitieerde config-writes zijn standaard ingeschakeld.

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

  <Accordion title="Gateway proxy">
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

  <Accordion title="PluralKit support">
    Schakel PluralKit-resolutie in om geproxiede berichten te mappen naar identiteit van systeemleden:

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
    - lookups gebruiken de originele bericht-ID en zijn beperkt tot een tijdvenster
    - als lookup mislukt, worden geproxiede berichten behandeld als botberichten en verwijderd tenzij `allowBots=true`

  </Accordion>

  <Accordion title="Outbound mention aliases">
    Gebruik `mentionAliases` wanneer agents deterministische uitgaande vermeldingen nodig hebben voor bekende Discord-gebruikers. Sleutels zijn handles zonder de leidende `@`; waarden zijn Discord-gebruikers-ID's. Onbekende handles, `@everyone`, `@here` en vermeldingen binnen Markdown-codespans blijven ongewijzigd.

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

  <Accordion title="Presence configuration">
    Presence-updates worden toegepast wanneer je een status- of activiteitsveld instelt, of wanneer je automatische presence inschakelt.

    Voorbeeld alleen status:

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
    - 4: Aangepast (gebruikt de activiteitstekst als de statusstatus; emoji is optioneel)
    - 5: Deelnemen aan competitie

    Voorbeeld van automatische presence (runtimegezondheidssignaal):

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

    Automatische aanwezigheid koppelt runtimebeschikbaarheid aan Discord-status: gezond => online, verminderd of onbekend => inactief, uitgeput of niet beschikbaar => niet storen. Optionele tekstoverschrijvingen:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (ondersteunt `{reason}`-placeholder)

  </Accordion>

  <Accordion title="Goedkeuringen in Discord">
    Discord ondersteunt goedkeuringsafhandeling met knoppen in DM's en kan optioneel goedkeuringsprompts plaatsen in het oorspronkelijke kanaal.

    Configuratiepad:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (optioneel; valt waar mogelijk terug op `commands.ownerAllowFrom`)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, standaard: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord schakelt native uitvoeringsgoedkeuringen automatisch in wanneer `enabled` niet is ingesteld of `"auto"` is en ten minste één goedkeurder kan worden herleid, via `execApprovals.approvers` of via `commands.ownerAllowFrom`. Discord leidt geen uitvoeringsgoedkeurders af uit kanaal-`allowFrom`, legacy `dm.allowFrom` of direct-message `defaultTo`. Stel `enabled: false` in om Discord expliciet uit te schakelen als native goedkeuringsclient.

    Voor gevoelige groepopdrachten die alleen voor eigenaren zijn, zoals `/diagnostics` en `/export-trajectory`, stuurt OpenClaw goedkeuringsprompts en eindresultaten privé. Het probeert eerst een Discord-DM wanneer de aanroepende eigenaar een Discord-eigenaarroute heeft; als die niet beschikbaar is, valt het terug op de eerste beschikbare eigenaarroute uit `commands.ownerAllowFrom`, zoals Telegram.

    Wanneer `target` `channel` of `both` is, is de goedkeuringsprompt zichtbaar in het kanaal. Alleen herleide goedkeurders kunnen de knoppen gebruiken; andere gebruikers ontvangen een tijdelijke weigering. Goedkeuringsprompts bevatten de opdrachttekst, dus schakel kanaallevering alleen in vertrouwde kanalen in. Als de kanaal-ID niet uit de sessiesleutel kan worden afgeleid, valt OpenClaw terug op levering via DM.

    Discord rendert ook de gedeelde goedkeuringsknoppen die door andere chatkanalen worden gebruikt. De native Discord-adapter voegt vooral DM-routering voor goedkeurders en kanaalfan-out toe.
    Wanneer die knoppen aanwezig zijn, vormen ze de primaire goedkeurings-UX; OpenClaw
    mag alleen een handmatige `/approve`-opdracht opnemen wanneer het toolresultaat zegt
    dat chatgoedkeuringen niet beschikbaar zijn of handmatige goedkeuring het enige pad is.
    Als de native Discord-goedkeuringsruntime niet actief is, houdt OpenClaw de
    lokale deterministische `/approve <id> <decision>`-prompt zichtbaar. Als de
    runtime actief is maar een native kaart niet aan een doel kan worden geleverd,
    stuurt OpenClaw een fallbackmelding in dezelfde chat met de exacte `/approve`-
    opdracht uit de wachtende goedkeuring.

    Gateway-authenticatie en goedkeuringsresolutie volgen het gedeelde Gateway-clientcontract (`plugin:`-ID's worden opgelost via `plugin.approval.resolve`; andere ID's via `exec.approval.resolve`). Goedkeuringen verlopen standaard na 30 minuten.

    Zie [Uitvoeringsgoedkeuringen](/nl/tools/exec-approvals).

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

Standaard poortgedrag:

| Actiegroep                                                                                                                                                              | Standaard     |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | ingeschakeld  |
| roles                                                                                                                                                                   | uitgeschakeld |
| moderation                                                                                                                                                              | uitgeschakeld |
| presence                                                                                                                                                                | uitgeschakeld |

## UI voor componenten v2

OpenClaw gebruikt Discord-componenten v2 voor uitvoeringsgoedkeuringen en cross-contextmarkeringen. Discord-berichtacties kunnen ook `components` accepteren voor aangepaste UI (geavanceerd; vereist het construeren van een componentpayload via de Discord-tool), terwijl legacy `embeds` beschikbaar blijven maar niet worden aanbevolen.

- `channels.discord.ui.components.accentColor` stelt de accentkleur in die door Discord-componentcontainers wordt gebruikt (hex).
- Stel per account in met `channels.discord.accounts.<id>.ui.components.accentColor`.
- `embeds` worden genegeerd wanneer componenten v2 aanwezig zijn.

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

Discord heeft twee afzonderlijke spraakoppervlakken: realtime **spraakkanalen** (doorlopende gesprekken) en **spraakberichtbijlagen** (de golfvormpreview-indeling). De Gateway ondersteunt beide.

### Spraakkanalen

Installatiechecklist:

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

Voer uit om de effectieve machtigingen van de bot te inspecteren voordat je deelneemt:

```bash
openclaw channels capabilities --channel discord --target channel:<voice-channel-id>
```

Voorbeeld voor automatisch deelnemen:

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
- `voice.model` overschrijft alleen de LLM die wordt gebruikt voor antwoorden in Discord-spraakkanalen. Laat dit niet ingesteld om het gerouteerde agentmodel te erven.
- STT gebruikt `tools.media.audio`; `voice.model` heeft geen invloed op transcriptie.
- Per-kanaal Discord-`systemPrompt`-overschrijvingen zijn van toepassing op spraaktranscriptiebeurten voor dat spraakkanaal.
- Spraaktranscriptiebeurten leiden eigenaarstatus af uit Discord-`allowFrom` (of `dm.allowFrom`); sprekers die geen eigenaar zijn, hebben geen toegang tot tools die alleen voor eigenaren zijn (bijvoorbeeld `gateway` en `cron`).
- Discord-spraak is opt-in voor configuraties met alleen tekst; stel `channels.discord.voice.enabled=true` in (of behoud een bestaand `channels.discord.voice`-blok) om `/vc`-opdrachten, de spraakruntime en de `GuildVoiceStates` Gateway-intent in te schakelen.
- `channels.discord.intents.voiceStates` kan het abonnement op voice-state-intent expliciet overschrijven. Laat dit niet ingesteld zodat de intent de effectieve spraakinschakeling volgt.
- `voice.daveEncryption` en `voice.decryptionFailureTolerance` worden doorgegeven aan de join-opties van `@discordjs/voice`.
- Standaarden van `@discordjs/voice` zijn `daveEncryption=true` en `decryptionFailureTolerance=24` als ze niet zijn ingesteld.
- `voice.connectTimeoutMs` bepaalt de initiële wachttijd op `@discordjs/voice` Ready voor `/vc join` en pogingen tot automatisch deelnemen. Standaard: `30000`.
- `voice.reconnectGraceMs` bepaalt hoelang OpenClaw wacht tot een verbroken spraaksessie opnieuw verbinding begint te maken voordat deze wordt vernietigd. Standaard: `15000`.
- Spraakweergave stopt niet alleen omdat een andere gebruiker begint te spreken. Om feedbacklussen te voorkomen, negeert OpenClaw nieuwe spraakopname terwijl TTS wordt afgespeeld; spreek nadat de weergave is voltooid voor de volgende beurt.
- `voice.captureSilenceGraceMs` bepaalt hoelang OpenClaw wacht nadat Discord meldt dat een spreker is gestopt voordat dat audiosegment voor STT wordt afgerond. Standaard: `2500`; verhoog dit als Discord normale pauzes opsplitst in haperige gedeeltelijke transcripties.
- Wanneer ElevenLabs de geselecteerde TTS-provider is, gebruikt Discord-spraakweergave streaming-TTS en start deze vanuit de responsstream van de provider. Providers zonder streamingondersteuning vallen terug op het pad met een gesynthetiseerd tijdelijk bestand.
- OpenClaw bewaakt ook decryptiefouten bij ontvangst en herstelt automatisch door het spraakkanaal te verlaten en opnieuw deel te nemen na herhaalde fouten binnen een kort venster.
- Als ontvangstlogs herhaaldelijk `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` tonen na een update, verzamel dan een afhankelijkheidsrapport en logs. De gebundelde `@discordjs/voice`-lijn bevat de upstream paddingfix uit discord.js PR #11449, die discord.js-issue #11419 sloot.
- Ontvangstgebeurtenissen `The operation was aborted` worden verwacht wanneer OpenClaw een vastgelegd sprekersegment afrondt; het zijn uitgebreide diagnostische meldingen, geen waarschuwingen.

Pijplijn voor spraakkanalen:

- Discord PCM-opname wordt geconverteerd naar een tijdelijk WAV-bestand.
- `tools.media.audio` verwerkt STT, bijvoorbeeld `openai/gpt-4o-mini-transcribe`.
- Het transcript wordt via Discord-ingress en routering verzonden terwijl de respons-LLM draait met een spraakuitvoerbeleid dat de agent-`tts`-tool verbergt en om geretourneerde tekst vraagt, omdat Discord-spraak de uiteindelijke TTS-weergave beheert.
- `voice.model`, indien ingesteld, overschrijft alleen de respons-LLM voor deze spraakkanaalbeurt.
- `voice.tts` wordt over `messages.tts` samengevoegd; providers met streamingmogelijkheden voeden de speler rechtstreeks, anders wordt het resulterende audiobestand afgespeeld in het kanaal waarin is deelgenomen.

Credentials worden per component opgelost: LLM-routeauthenticatie voor `voice.model`, STT-authenticatie voor `tools.media.audio` en TTS-authenticatie voor `messages.tts`/`voice.tts`.

### Spraakberichten

Discord-spraakberichten tonen een golfvormpreview en vereisen OGG/Opus-audio. OpenClaw genereert de golfvorm automatisch, maar heeft `ffmpeg` en `ffprobe` op de Gateway-host nodig om te inspecteren en te converteren.

- Geef een **lokaal bestandspad** op (URL's worden geweigerd).
- Laat tekstinhoud weg (Discord weigert tekst + spraakbericht in dezelfde payload).
- Elk audioformaat wordt geaccepteerd; OpenClaw converteert indien nodig naar OGG/Opus.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Probleemoplossing

<AccordionGroup>
  <Accordion title="Niet-toegestane intents gebruikt of bot ziet geen guild-berichten">

    - schakel Message Content Intent in
    - schakel Server Members Intent in wanneer je afhankelijk bent van gebruikers-/ledenresolutie
    - herstart de gateway na het wijzigen van intents

  </Accordion>

  <Accordion title="Guild-berichten onverwacht geblokkeerd">

    - verifieer `groupPolicy`
    - verifieer de guild-allowlist onder `channels.discord.guilds`
    - als de guild-`channels`-map bestaat, zijn alleen vermelde kanalen toegestaan
    - verifieer `requireMention`-gedrag en vermeldingspatronen

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

    Discord Gateway-wachtrij-instellingen:

    - enkel account: `channels.discord.eventQueue.listenerTimeout`
    - meerdere accounts: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - dit regelt alleen Discord Gateway-listenerwerk, niet de levensduur van een agentbeurt

    Discord past geen kanaaleigen time-out toe op agentbeurten in de wachtrij. Berichtlisteners dragen direct over, en Discord-runs in de wachtrij behouden de volgorde per sessie totdat de sessie-/tool-/runtimelevenscyclus is voltooid of het werk wordt afgebroken.

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

  <Accordion title="Waarschuwingen voor time-outs bij Gateway-metagegevensopzoeking">
    OpenClaw haalt Discord `/gateway/bot`-metagegevens op voordat er verbinding wordt gemaakt. Tijdelijke fouten vallen terug op de standaard-Gateway-URL van Discord en worden in logs aan rate limiting onderworpen.

    Time-outinstellingen voor metagegevens:

    - enkel account: `channels.discord.gatewayInfoTimeoutMs`
    - meerdere accounts: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - env-fallback wanneer configuratie niet is ingesteld: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - standaard: `30000` (30 seconden), max: `120000`

  </Accordion>

  <Accordion title="Gateway READY-time-out-herstarts">
    OpenClaw wacht tijdens het opstarten en na runtime-herverbindingen op het Discord Gateway-`READY`-event. Set-ups met meerdere accounts en gespreid opstarten kunnen een langer READY-venster bij opstarten nodig hebben dan de standaardwaarde.

    READY-time-outinstellingen:

    - opstarten met enkel account: `channels.discord.gatewayReadyTimeoutMs`
    - opstarten met meerdere accounts: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - env-fallback bij opstarten wanneer configuratie niet is ingesteld: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - standaard bij opstarten: `15000` (15 seconden), max: `120000`
    - runtime met enkel account: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - runtime met meerdere accounts: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - env-fallback bij runtime wanneer configuratie niet is ingesteld: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - standaard bij runtime: `30000` (30 seconden), max: `120000`

  </Accordion>

  <Accordion title="Afwijkingen in permissie-audit">
    Permissiecontroles met `channels status --probe` werken alleen voor numerieke kanaal-ID's.

    Als je slug-sleutels gebruikt, kan runtime-matching nog steeds werken, maar kan de probe permissies niet volledig verifiëren.

  </Accordion>

  <Accordion title="Problemen met DM en koppelen">

    - DM uitgeschakeld: `channels.discord.dm.enabled=false`
    - DM-beleid uitgeschakeld: `channels.discord.dmPolicy="disabled"` (legacy: `channels.discord.dm.policy`)
    - wachten op koppelingsgoedkeuring in `pairing`-modus

  </Accordion>

  <Accordion title="Bot-naar-bot-lussen">
    Standaard worden berichten die door bots zijn geschreven genegeerd.

    Als je `channels.discord.allowBots=true` instelt, gebruik dan strikte vermeldings- en allowlistregels om lusgedrag te voorkomen.
    Gebruik bij voorkeur `channels.discord.allowBots="mentions"` om alleen botberichten te accepteren die de bot vermelden.

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

  <Accordion title="Voice STT-uitval met DecryptionFailed(...)">

    - houd OpenClaw actueel (`openclaw update`) zodat de herstellogica voor Discord-spraakontvangst aanwezig is
    - bevestig `channels.discord.voice.daveEncryption=true` (standaard)
    - begin met `channels.discord.voice.decryptionFailureTolerance=24` (upstream-standaard) en pas alleen aan indien nodig
    - let in logs op:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - als fouten na automatische herjoin blijven optreden, verzamel logs en vergelijk met de upstream DAVE-ontvangstgeschiedenis in [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) en [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Configuratiereferentie

Primaire referentie: [Configuratiereferentie - Discord](/nl/gateway/config-channels#discord).

<Accordion title="Discord-velden met hoge informatiewaarde">

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
- functies: `threadBindings`, topniveau `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## Veiligheid en beheer

- Behandel bottokens als geheimen (`DISCORD_BOT_TOKEN` heeft de voorkeur in beheerde omgevingen).
- Ken Discord-permissies toe volgens het principe van minimale rechten.
- Als commandodeployment/-status verouderd is, herstart dan de Gateway en controleer opnieuw met `openclaw channels status --probe`.

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Koppelen" icon="link" href="/nl/channels/pairing">
    Koppel een Discord-gebruiker aan de Gateway.
  </Card>
  <Card title="Groepen" icon="users" href="/nl/channels/groups">
    Groepschat en allowlistgedrag.
  </Card>
  <Card title="Kanaalroutering" icon="route" href="/nl/channels/channel-routing">
    Routeer inkomende berichten naar agents.
  </Card>
  <Card title="Beveiliging" icon="shield" href="/nl/gateway/security">
    Dreigingsmodel en hardening.
  </Card>
  <Card title="Multi-agentroutering" icon="sitemap" href="/nl/concepts/multi-agent">
    Wijs guilds en kanalen toe aan agents.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/nl/tools/slash-commands">
    Gedrag van native opdrachten.
  </Card>
</CardGroup>
