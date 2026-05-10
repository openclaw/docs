---
read_when:
    - Werken aan functies voor het Discord-kanaal
summary: Status, mogelijkheden en configuratie van Discord-botondersteuning
title: Discord
x-i18n:
    generated_at: "2026-05-10T19:20:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 121b0b46bfb0d438f6ebfba4c93410c2ecfe8f99aa257e362b8767bf0aac27ce
    source_path: channels/discord.md
    workflow: 16
---

Gereed voor DM's en guild-kanalen via de officiële Discord Gateway.

<CardGroup cols={3}>
  <Card title="Koppelen" icon="link" href="/nl/channels/pairing">
    Discord-DM's gebruiken standaard de koppelingsmodus.
  </Card>
  <Card title="Slash-commando's" icon="terminal" href="/nl/tools/slash-commands">
    Native commandogedrag en commandocatalogus.
  </Card>
  <Card title="Kanaalprobleemoplossing" icon="wrench" href="/nl/channels/troubleshooting">
    Cross-channel diagnose- en herstelstroom.
  </Card>
</CardGroup>

## Snelle installatie

Je moet een nieuwe applicatie met een bot maken, de bot aan je server toevoegen en deze aan OpenClaw koppelen. We raden aan je bot toe te voegen aan je eigen privéserver. Als je er nog geen hebt, [maak er dan eerst een](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (kies **Create My Own > For me and my friends**).

<Steps>
  <Step title="Maak een Discord-applicatie en bot">
    Ga naar de [Discord Developer Portal](https://discord.com/developers/applications) en klik op **New Application**. Geef deze een naam zoals "OpenClaw".

    Klik op **Bot** in de zijbalk. Stel de **Username** in op de naam die je aan je OpenClaw-agent geeft.

  </Step>

  <Step title="Schakel bevoorrechte intents in">
    Blijf op de pagina **Bot**, scrol omlaag naar **Privileged Gateway Intents** en schakel in:

    - **Message Content Intent** (vereist)
    - **Server Members Intent** (aanbevolen; vereist voor rol-allowlists en naam-naar-ID-koppeling)
    - **Presence Intent** (optioneel; alleen nodig voor aanwezigheidsupdates)

  </Step>

  <Step title="Kopieer je bottoken">
    Scrol terug omhoog op de pagina **Bot** en klik op **Reset Token**.

    <Note>
    Ondanks de naam genereert dit je eerste token — er wordt niets "gereset."
    </Note>

    Kopieer het token en bewaar het ergens. Dit is je **Bot Token** en je hebt het zo nodig.

  </Step>

  <Step title="Genereer een uitnodigings-URL en voeg de bot toe aan je server">
    Klik op **OAuth2** in de zijbalk. Je genereert een uitnodigings-URL met de juiste rechten om de bot aan je server toe te voegen.

    Scrol omlaag naar **OAuth2 URL Generator** en schakel in:

    - `bot`
    - `applications.commands`

    Daaronder verschijnt een sectie **Bot Permissions**. Schakel ten minste in:

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

  <Step title="Schakel Developer Mode in en verzamel je ID's">
    Terug in de Discord-app moet je Developer Mode inschakelen zodat je interne ID's kunt kopiëren.

    1. Klik op **User Settings** (tandwielpictogram naast je avatar) → **Advanced** → schakel **Developer Mode** in
    2. Klik met rechts op je **serverpictogram** in de zijbalk → **Copy Server ID**
    3. Klik met rechts op je **eigen avatar** → **Copy User ID**

    Bewaar je **Server ID** en **User ID** samen met je Bot Token — je stuurt ze alle drie in de volgende stap naar OpenClaw.

  </Step>

  <Step title="Sta DM's van serverleden toe">
    Om koppelen te laten werken, moet Discord je bot toestaan je een DM te sturen. Klik met rechts op je **serverpictogram** → **Privacy Settings** → schakel **Direct Messages** in.

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

    Als OpenClaw al als achtergrondservice draait, herstart deze dan via de OpenClaw Mac-app of door het proces `openclaw gateway run` te stoppen en opnieuw te starten.
    Voor beheerde service-installaties voer je `openclaw gateway install` uit vanuit een shell waarin `DISCORD_BOT_TOKEN` aanwezig is, of sla je de variabele op in `~/.openclaw/.env`, zodat de service de env SecretRef na een herstart kan oplossen.
    Als je host wordt geblokkeerd of beperkt door Discord's startup-lookup van de applicatie, stel dan de Discord-applicatie-/client-ID in vanuit de Developer Portal zodat startup die REST-call kan overslaan. Gebruik `channels.discord.applicationId` voor het standaardaccount, of `channels.discord.accounts.<accountId>.applicationId` wanneer je meerdere Discord-bots draait.

  </Step>

  <Step title="Configureer OpenClaw en koppel">

    <Tabs>
      <Tab title="Vraag het je agent">
        Chat met je OpenClaw-agent op een bestaand kanaal (bijv. Telegram) en vertel het hem. Als Discord je eerste kanaal is, gebruik dan in plaats daarvan de CLI-/configuratietab.

        > "Ik heb mijn Discord-bottoken al ingesteld in de configuratie. Rond de Discord-installatie af met User ID `<user_id>` en Server ID `<server_id>`."
      </Tab>
      <Tab title="CLI / configuratie">
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

        Voor gescripte of externe installatie schrijf je hetzelfde JSON5-blok met `openclaw config patch --file ./discord.patch.json5 --dry-run` en voer je het daarna opnieuw uit zonder `--dry-run`. Plaintext `token`-waarden worden ondersteund. SecretRef-waarden worden ook ondersteund voor `channels.discord.token` over env-/file-/exec-providers. Zie [Geheimenbeheer](/nl/gateway/secrets).

        Voor meerdere Discord-bots houd je elk bottoken en elke applicatie-ID onder het eigen account. Een top-level `channels.discord.applicationId` wordt door accounts overgenomen, dus stel deze daar alleen in wanneer elk account dezelfde applicatie-ID moet gebruiken.

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
    Wacht tot de gateway draait en stuur je bot daarna een DM in Discord. Deze reageert met een koppelingscode.

    <Tabs>
      <Tab title="Vraag het je agent">
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
Tokenresolutie is accountbewust. Configuratietokenwaarden winnen van env-fallback. `DISCORD_BOT_TOKEN` wordt alleen gebruikt voor het standaardaccount.
Als twee ingeschakelde Discord-accounts naar hetzelfde bottoken resolven, start OpenClaw slechts één Gateway-monitor voor dat token. Een token uit de configuratie wint van de standaard env-fallback; anders wint het eerste ingeschakelde account en wordt het dubbele account als uitgeschakeld gerapporteerd.
Voor geavanceerde uitgaande calls (berichttool/kanaalacties) wordt een expliciete per-call `token` gebruikt voor die call. Dit geldt voor verzend- en lees-/probe-achtige acties (bijvoorbeeld read/search/fetch/thread/pins/permissions). Accountbeleid en retry-instellingen komen nog steeds uit het geselecteerde account in de actieve runtime-snapshot.
</Note>

## Aanbevolen: stel een guild-werkruimte in

Zodra DM's werken, kun je je Discord-server instellen als een volledige werkruimte waarin elk kanaal een eigen agentsessie met eigen context krijgt. Dit wordt aanbevolen voor privéservers waar alleen jij en je bot aanwezig zijn.

<Steps>
  <Step title="Voeg je server toe aan de guild-allowlist">
    Hierdoor kan je agent in elk kanaal op je server reageren, niet alleen in DM's.

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
    Standaard reageert je agent alleen in guild-kanalen wanneer hij met @ wordt genoemd. Voor een privéserver wil je waarschijnlijk dat hij op elk bericht reageert.

    In guild-kanalen blijven normale definitieve assistentreplies standaard privé. Zichtbare Discord-uitvoer moet expliciet met de `message`-tool worden verzonden, zodat de agent standaard kan meelezen en alleen post wanneer hij besluit dat een kanaalreply nuttig is.

    Dit betekent dat het geselecteerde model betrouwbaar tools moet aanroepen. Als Discord typen toont en de logs tokengebruik tonen maar er geen bericht wordt geplaatst, controleer dan de sessielog op assistenttekst met `didSendViaMessagingTool: false`. Dat betekent dat het model een privé definitief antwoord heeft geproduceerd in plaats van `message(action=send)` aan te roepen. Schakel over naar een sterker model voor tool-calling, of gebruik de onderstaande configuratie om legacy automatische definitieve replies te herstellen.

    <Tabs>
      <Tab title="Vraag het je agent">
        > "Sta mijn agent toe op deze server te reageren zonder dat hij met @ hoeft te worden genoemd"
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

        Stel `messages.groupChat.visibleReplies: "automatic"` in om legacy automatische definitieve replies voor groeps-/kanaalruimtes te herstellen.

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

Maak nu enkele kanalen op je Discord-server en begin te chatten. Je agent kan de kanaalnaam zien, en elk kanaal krijgt zijn eigen geïsoleerde sessie — zodat je `#coding`, `#home`, `#research` of wat dan ook bij je workflow past kunt instellen.

## Runtime-model

- Gateway is eigenaar van de Discord-verbinding.
- Antwoordroutering is deterministisch: inkomende antwoorden van Discord gaan terug naar Discord.
- Discord-gilde-/kanaalmetadata wordt toegevoegd aan de modelprompt als onvertrouwde
  context, niet als een voor de gebruiker zichtbaar antwoordvoorvoegsel. Als een model die envelop
  terug kopieert, verwijdert OpenClaw de gekopieerde metadata uit uitgaande antwoorden en uit
  toekomstige replay-context.
- Standaard (`session.dmScope=main`) delen directe chats de hoofd­sessie van de agent (`agent:main:main`).
- Gildekanalen zijn geisoleerde sessiesleutels (`agent:<agentId>:discord:channel:<channelId>`).
- Groeps-DM's worden standaard genegeerd (`channels.discord.dm.groupEnabled=false`).
- Native slash-commando's draaien in geisoleerde commandosessies (`agent:<agentId>:discord:slash:<userId>`), terwijl ze nog steeds `CommandTargetSessionKey` naar de gerouteerde gesprekssessie meenemen.
- Tekst-only cron-/heartbeat-aankondigingslevering aan Discord gebruikt het uiteindelijke
  voor de assistent zichtbare antwoord eenmalig. Media en gestructureerde componentpayloads blijven
  meerdere berichten wanneer de agent meerdere leverbare payloads uitzendt.

## Forumkanalen

Discord-forum- en mediakanalen accepteren alleen threadposts. OpenClaw ondersteunt twee manieren om ze te maken:

- Stuur een bericht naar de forumparent (`channel:<forumId>`) om automatisch een thread te maken. De threadtitel gebruikt de eerste niet-lege regel van je bericht.
- Gebruik `openclaw message thread create` om direct een thread te maken. Geef geen `--message-id` door voor forumkanalen.

Voorbeeld: naar forumparent sturen om een thread te maken

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Voorbeeld: expliciet een forumthread maken

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Forumparents accepteren geen Discord-componenten. Als je componenten nodig hebt, stuur dan naar de thread zelf (`channel:<threadId>`).

## Interactieve componenten

OpenClaw ondersteunt Discord components v2-containers voor agentberichten. Gebruik de berichttool met een `components`-payload. Interactieresultaten worden terug naar de agent gerouteerd als normale inkomende berichten en volgen de bestaande Discord `replyToMode`-instellingen.

Ondersteunde blokken:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Actierijen staan maximaal 5 knoppen of een enkel selectiemenu toe
- Selectietypen: `string`, `user`, `role`, `mentionable`, `channel`

Standaard zijn componenten eenmalig bruikbaar. Stel `components.reusable=true` in om knoppen, selecties en formulieren meerdere keren te laten gebruiken totdat ze verlopen.

Om te beperken wie op een knop kan klikken, stel je `allowedUsers` in op die knop (Discord-gebruikers-ID's, tags of `*`). Wanneer dit is geconfigureerd, ontvangen niet-overeenkomende gebruikers een tijdelijke weigering.

De slash-commando's `/model` en `/models` openen een interactieve modelkiezer met provider-, model- en compatibele runtime-dropdowns plus een stap Indienen. `/models add` is verouderd en retourneert nu een verouderingsbericht in plaats van modellen vanuit chat te registreren. Het kiezerantwoord is tijdelijk en alleen de aanroepende gebruiker kan het gebruiken. Discord-selectiemenu's zijn beperkt tot 25 opties, dus voeg `provider/*`-items toe aan `agents.defaults.models` wanneer je wilt dat de kiezer dynamisch ontdekte modellen alleen toont voor geselecteerde providers zoals `openai-codex` of `vllm`.

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

    Als DM-beleid niet open is, worden onbekende gebruikers geblokkeerd (of gevraagd te koppelen in `pairing`-modus).

    Prioriteit bij meerdere accounts:

    - `channels.discord.accounts.default.allowFrom` is alleen van toepassing op het `default`-account.
    - Voor een account heeft `allowFrom` voorrang op de legacy `dm.allowFrom`.
    - Benoemde accounts erven `channels.discord.allowFrom` wanneer hun eigen `allowFrom` en legacy `dm.allowFrom` niet zijn ingesteld.
    - Benoemde accounts erven `channels.discord.accounts.default.allowFrom` niet.

    Legacy `channels.discord.dm.policy` en `channels.discord.dm.allowFrom` worden voor compatibiliteit nog steeds gelezen. `openclaw doctor --fix` migreert ze naar `dmPolicy` en `allowFrom` wanneer dat kan zonder de toegang te wijzigen.

    DM-doelformaat voor levering:

    - `user:<id>`
    - `<@id>`-vermelding

    Kale numerieke ID's worden normaal gesproken als kanaal-ID's opgelost wanneer een kanaalstandaard actief is, maar ID's die in de effectieve DM-`allowFrom` van het account staan, worden voor compatibiliteit behandeld als gebruikers-DM-doelen.

  </Tab>

  <Tab title="Access groups">
    Discord-DM's en tekstcommando-autorisatie kunnen dynamische `accessGroup:<name>`-items gebruiken in `channels.discord.allowFrom`.

    Namen van toegangsgroepen worden gedeeld tussen berichtkanalen. Gebruik `type: "message.senders"` voor een statische groep waarvan leden worden uitgedrukt in de normale `allowFrom`-syntaxis van elk kanaal, of `type: "discord.channelAudience"` wanneer de huidige `ViewChannel`-doelgroep van een Discord-kanaal het lidmaatschap dynamisch moet bepalen. Gedeeld gedrag van toegangsgroepen is hier gedocumenteerd: [Toegangsgroepen](/nl/channels/access-groups).

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

    Een Discord-tekstkanaal heeft geen aparte ledenlijst. `type: "discord.channelAudience"` modelleert lidmaatschap als: de DM-afzender is lid van de geconfigureerde guild en heeft momenteel effectieve `ViewChannel`-toestemming op het geconfigureerde kanaal nadat rol- en kanaaloverschrijvingen zijn toegepast.

    Voorbeeld: iedereen die `#maintainers` kan zien toestaan om de bot te DM'en, terwijl DM's voor alle anderen gesloten blijven.

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

    Lookups falen gesloten. Als Discord `Missing Access` retourneert, de ledenlookup faalt, of het kanaal bij een andere guild hoort, wordt de DM-afzender als ongeautoriseerd behandeld.

    Schakel de Discord Developer Portal **Server Members Intent** in voor de bot wanneer je kanaaldoelgroep-toegangsgroepen gebruikt. DM's bevatten geen guild-lidstatus, dus OpenClaw lost het lid op via Discord REST tijdens autorisatie.

  </Tab>

  <Tab title="Guild policy">
    Gildeafhandeling wordt beheerd door `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    Veilige basislijn wanneer `channels.discord` bestaat, is `allowlist`.

    `allowlist`-gedrag:

    - guild moet overeenkomen met `channels.discord.guilds` (`id` aanbevolen, slug geaccepteerd)
    - optionele allowlists voor afzenders: `users` (stabiele ID's aanbevolen) en `roles` (alleen rol-ID's); als een van beide is geconfigureerd, zijn afzenders toegestaan wanneer ze overeenkomen met `users` OF `roles`
    - directe naam-/tagmatching is standaard uitgeschakeld; schakel `channels.discord.dangerouslyAllowNameMatching: true` alleen in als noodcompatibiliteitsmodus
    - namen/tags worden ondersteund voor `users`, maar ID's zijn veiliger; `openclaw security audit` waarschuwt wanneer naam-/tagitems worden gebruikt
    - als een guild `channels` heeft geconfigureerd, worden niet-vermelde kanalen geweigerd
    - als een guild geen `channels`-blok heeft, zijn alle kanalen in die op de allowlist geplaatste guild toegestaan

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

  <Tab title="Mentions and group DMs">
    Guildberichten zijn standaard vermelding-afgeschermd.

    Vermeldingsdetectie omvat:

    - expliciete botvermelding
    - geconfigureerde vermeldingspatronen (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - impliciet antwoord-op-bot-gedrag in ondersteunde gevallen

    Gebruik bij het schrijven van uitgaande Discord-berichten canonieke vermeldingssyntaxis: `<@USER_ID>` voor gebruikers, `<#CHANNEL_ID>` voor kanalen en `<@&ROLE_ID>` voor rollen. Gebruik niet de legacy `<@!USER_ID>`-bijnaamvermeldingsvorm.

    `requireMention` wordt per guild/kanaal geconfigureerd (`channels.discord.guilds...`).
    `ignoreOtherMentions` laat optioneel berichten vallen die een andere gebruiker/rol vermelden maar niet de bot (met uitzondering van @everyone/@here).

    Groeps-DM's:

    - standaard: genegeerd (`dm.groupEnabled=false`)
    - optionele allowlist via `dm.groupChannels` (kanaal-ID's of slugs)

  </Tab>
</Tabs>

### Rolgebaseerde agentroutering

Gebruik `bindings[].match.roles` om Discord-guildleden naar verschillende agents te routeren op basis van rol-ID. Rolgebaseerde bindings accepteren alleen rol-ID's en worden geëvalueerd na peer- of parent-peer-bindings en voor guild-only-bindings. Als een binding ook andere matchvelden instelt (bijvoorbeeld `peer` + `guildId` + `roles`), moeten alle geconfigureerde velden overeenkomen.

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
- `commands.native=false` slaat registratie en opschoning van Discord-slashopdrachten tijdens het opstarten over. Eerder geregistreerde opdrachten kunnen zichtbaar blijven in Discord totdat je ze uit de Discord-app verwijdert.
- Native opdrachtauthenticatie gebruikt dezelfde Discord-toestaanlijsten/beleidsregels als normale berichtverwerking.
- Opdrachten kunnen nog steeds zichtbaar zijn in de Discord-UI voor gebruikers die niet geautoriseerd zijn; uitvoering dwingt nog steeds OpenClaw-authenticatie af en retourneert "not authorized".

Zie [Slashopdrachten](/nl/tools/slash-commands) voor de opdrachtencatalogus en het gedrag.

Standaardinstellingen voor slashopdrachten:

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
    `batched` koppelt Discord's impliciete native antwoordverwijzing alleen wanneer de
    inkomende beurt een gedebouncete batch van meerdere berichten was. Dit is nuttig
    wanneer je native antwoorden vooral wilt voor dubbelzinnige drukke chats, niet voor elke
    beurt met één bericht.

    Bericht-ID's worden in context/geschiedenis beschikbaar gemaakt zodat agents specifieke berichten kunnen targeten.

  </Accordion>

  <Accordion title="Live stream-voorbeeld">
    OpenClaw kan conceptantwoorden streamen door een tijdelijk bericht te sturen en dit te bewerken naarmate tekst binnenkomt. `channels.discord.streaming` accepteert `off` | `partial` | `block` | `progress` (standaard). `progress` behoudt één bewerkbaar statusconcept en werkt dit bij met toolvoortgang tot de definitieve levering; het gedeelde startlabel is een doorlopende regel, zodat het net als de rest uit beeld schuift zodra er genoeg werk verschijnt. `streamMode` is een verouderde runtime-alias. Voer `openclaw doctor --fix` uit om persistente configuratie naar de canonieke sleutel te herschrijven.

    Stel `channels.discord.streaming.mode` in op `off` om Discord-voorbeeldbewerkingen uit te schakelen. Als Discord-blockstreaming expliciet is ingeschakeld, slaat OpenClaw de voorbeeldstream over om dubbel streamen te voorkomen.

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

    - `partial` bewerkt één voorbeeldbericht naarmate tokens binnenkomen.
    - `block` verzendt chunks op conceptgrootte (gebruik `draftChunk` om grootte en breekpunten af te stemmen, begrensd tot `textChunkLimit`).
    - Media, fouten en expliciete antwoordfinals annuleren openstaande voorbeeldbewerkingen.
    - `streaming.preview.toolProgress` (standaard `true`) bepaalt of tool-/voortgangsupdates het voorbeeldbericht hergebruiken.
    - Tool-/voortgangsrijen worden weergegeven als compacte emoji + titel + detail wanneer beschikbaar, bijvoorbeeld `🛠️ Bash: run tests` of `🔎 Web Search: for "query"`.
    - `streaming.preview.commandText` / `streaming.progress.commandText` beheert opdracht-/exec-detail in compacte voortgangsregels: `raw` (standaard) of `status` (alleen toollabel).

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

    Voorbeeldstreaming is alleen tekst; media-antwoorden vallen terug op normale levering. Wanneer `block`-streaming expliciet is ingeschakeld, slaat OpenClaw de voorbeeldstream over om dubbel streamen te voorkomen.

  </Accordion>

  <Accordion title="Geschiedenis, context en threadgedrag">
    Gildegeschiedeniscontext:

    - `channels.discord.historyLimit` standaard `20`
    - fallback: `messages.groupChat.historyLimit`
    - `0` schakelt uit

    DM-geschiedenisinstellingen:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Threadgedrag:

    - Discord-threads worden gerouteerd als kanaalsessies en erven de configuratie van het bovenliggende kanaal tenzij overschreven.
    - Threadsessies erven de sessieniveau-`/model`-selectie van het bovenliggende kanaal als model-only fallback; threadlokale `/model`-selecties hebben nog steeds voorrang en transcriptgeschiedenis van het bovenliggende kanaal wordt niet gekopieerd tenzij transcriptovererving is ingeschakeld.
    - `channels.discord.thread.inheritParent` (standaard `false`) laat nieuwe autothreads initialiseren vanuit het bovenliggende transcript. Overrides per account staan onder `channels.discord.accounts.<id>.thread.inheritParent`.
    - Reacties van berichttools kunnen `user:<id>`-DM-targets oplossen.
    - `guilds.<guild>.channels.<channel>.requireMention: false` blijft behouden tijdens de fallback voor activering in de antwoordfase.

    Kanaalonderwerpen worden als **niet-vertrouwde** context geïnjecteerd. Toestaanlijsten bepalen wie de agent kan triggeren, geen volledige redactiegrens voor aanvullende context.

  </Accordion>

  <Accordion title="Threadgebonden sessies voor subagents">
    Discord kan een thread binden aan een sessietarget zodat vervolgberichten in die thread naar dezelfde sessie blijven routeren (inclusief subagentsessies).

    Opdrachten:

    - `/focus <target>` bind huidige/nieuwe thread aan een subagent-/sessietarget
    - `/unfocus` verwijder huidige threadbinding
    - `/agents` toon actieve runs en bindingsstatus
    - `/session idle <duration|off>` inspecteer/update automatisch ontfocussen bij inactiviteit voor gefocuste bindingen
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
    - `spawnSessions` beheert automatisch aanmaken/binden van threads voor `sessions_spawn({ thread: true })` en ACP-threadspawns. Standaard: `true`.
    - `defaultSpawnContext` beheert native subagentcontext voor threadgebonden spawns. Standaard: `"fork"`.
    - Verouderde sleutels `spawnSubagentSessions`/`spawnAcpSessions` worden gemigreerd door `openclaw doctor --fix`.
    - Als threadbindingen voor een account zijn uitgeschakeld, zijn `/focus` en gerelateerde threadbindingsbewerkingen niet beschikbaar.

    Zie [Subagents](/nl/tools/subagents), [ACP Agents](/nl/tools/acp-agents) en [Configuratiereferentie](/nl/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Persistente ACP-kanaalbindingen">
    Configureer voor stabiele "always-on" ACP-werkruimten typed ACP-bindingen op topniveau die Discord-gesprekken targeten.

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

    - `/acp spawn codex --bind here` bindt het huidige kanaal of de huidige thread op dezelfde plek en houdt toekomstige berichten op dezelfde ACP-sessie. Threadberichten erven de binding van het bovenliggende kanaal.
    - In een gebonden kanaal of thread resetten `/new` en `/reset` dezelfde ACP-sessie op dezelfde plek. Tijdelijke threadbindingen kunnen targetresolutie overschrijven terwijl ze actief zijn.
    - `spawnSessions` beheert het aanmaken/binden van childthreads via `--thread auto|here`.

    Zie [ACP Agents](/nl/tools/acp-agents) voor details over bindingsgedrag.

  </Accordion>

  <Accordion title="Reactiemeldingen">
    Reactiemeldingsmodus per gilde:

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

    - Discord accepteert unicode-emoji of namen van aangepaste emoji.
    - Gebruik `""` om de reactie voor een kanaal of account uit te schakelen.

  </Accordion>

  <Accordion title="Config writes">
    Door kanaal geïnitieerde configuratieschrijfacties zijn standaard ingeschakeld.

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
    Routeer Discord Gateway-WebSocketverkeer en REST-lookups bij het opstarten (applicatie-ID + oplossen van toestaanlijsten) via een HTTP(S)-proxy met `channels.discord.proxy`.

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
    Schakel PluralKit-resolutie in om proxied berichten te koppelen aan de identiteit van het systeemlid:

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
    - lookups gebruiken de oorspronkelijke bericht-ID en zijn tijdvenstergebonden
    - als lookup mislukt, worden proxied berichten behandeld als botberichten en verwijderd tenzij `allowBots=true`

  </Accordion>

  <Accordion title="Aliases voor uitgaande vermeldingen">
    Gebruik `mentionAliases` wanneer agents deterministische uitgaande vermeldingen nodig hebben voor bekende Discord-gebruikers. Sleutels zijn handles zonder de voorafgaande `@`; waarden zijn Discord-gebruikers-ID's. Onbekende handles, `@everyone`, `@here` en vermeldingen binnen Markdown-code spans blijven ongewijzigd.

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
    - 4: Aangepast (gebruikt de activiteitstekst als de statustoestand; emoji is optioneel)
    - 5: Meedoen

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
    - `autoPresence.exhaustedText` (ondersteunt de placeholder `{reason}`)

  </Accordion>

  <Accordion title="Goedkeuringen in Discord">
    Discord ondersteunt afhandeling van goedkeuringen via knoppen in privéberichten en kan optioneel goedkeuringsprompts plaatsen in het oorspronkelijke kanaal.

    Configuratiepad:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (optioneel; valt waar mogelijk terug op `commands.ownerAllowFrom`)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, standaard: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord schakelt native exec-goedkeuringen automatisch in wanneer `enabled` niet is ingesteld of `"auto"` is en ten minste één goedkeurder kan worden bepaald, hetzij uit `execApprovals.approvers`, hetzij uit `commands.ownerAllowFrom`. Discord leidt exec-goedkeurders niet af uit kanaal-`allowFrom`, verouderde `dm.allowFrom` of direct-message `defaultTo`. Stel `enabled: false` in om Discord expliciet uit te schakelen als native goedkeuringsclient.

    Voor gevoelige groepscommando's die alleen voor eigenaren zijn, zoals `/diagnostics` en `/export-trajectory`, stuurt OpenClaw goedkeuringsprompts en eindresultaten privé. Het probeert eerst Discord-DM wanneer de aanroepende eigenaar een Discord-eigenaarroute heeft; als die niet beschikbaar is, valt het terug op de eerste beschikbare eigenaarroute uit `commands.ownerAllowFrom`, zoals Telegram.

    Wanneer `target` `channel` of `both` is, is de goedkeuringsprompt zichtbaar in het kanaal. Alleen bepaalde goedkeurders kunnen de knoppen gebruiken; andere gebruikers ontvangen een tijdelijke weigering. Goedkeuringsprompts bevatten de commandotekst, dus schakel kanaalbezorging alleen in vertrouwde kanalen in. Als de kanaal-ID niet uit de sessiesleutel kan worden afgeleid, valt OpenClaw terug op bezorging via DM.

    Discord toont ook de gedeelde goedkeuringsknoppen die door andere chatkanalen worden gebruikt. De native Discord-adapter voegt vooral DM-routering voor goedkeurders en kanaalfanout toe.
    Wanneer die knoppen aanwezig zijn, vormen ze de primaire goedkeurings-UX; OpenClaw
    mag alleen een handmatig `/approve`-commando opnemen wanneer het toolresultaat aangeeft
    dat chatgoedkeuringen niet beschikbaar zijn of dat handmatige goedkeuring het enige pad is.
    Als de native Discord-goedkeuringsruntime niet actief is, houdt OpenClaw de
    lokale deterministische `/approve <id> <decision>`-prompt zichtbaar. Als de
    runtime actief is maar een native kaart niet aan een doel kan worden bezorgd,
    stuurt OpenClaw een fallbackmelding in dezelfde chat met het exacte `/approve`-
    commando van de wachtende goedkeuring.

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

De actie `event-create` accepteert een optionele parameter `image` (URL of lokaal bestandspad) om de omslagafbeelding van het geplande evenement in te stellen.

Actiepoorten staan onder `channels.discord.actions.*`.

Standaardgedrag van poorten:

| Actiegroep                                                                                                                                                               | Standaard    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------ |
| reacties, berichten, threads, pins, polls, zoeken, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | ingeschakeld |
| roles                                                                                                                                                                    | uitgeschakeld |
| moderatie                                                                                                                                                               | uitgeschakeld |
| aanwezigheid                                                                                                                                                            | uitgeschakeld |

## Components v2 UI

OpenClaw gebruikt Discord components v2 voor exec-goedkeuringen en markers over contexten heen. Discord-berichtacties kunnen ook `components` accepteren voor aangepaste UI (geavanceerd; vereist het construeren van een componentpayload via de discord-tool), terwijl verouderde `embeds` beschikbaar blijven maar niet worden aanbevolen.

- `channels.discord.ui.components.accentColor` stelt de accentkleur in die door Discord-componentcontainers wordt gebruikt (hex).
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

Discord heeft twee afzonderlijke spraakoppervlakken: realtime **spraakkanalen** (doorlopende gesprekken) en **spraakberichtbijlagen** (de waveform-previewindeling). De gateway ondersteunt beide.

### Spraakkanalen

Installatiechecklist:

1. Schakel Message Content Intent in het Discord Developer Portal in.
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

Om de effectieve machtigingen van de bot te controleren voordat deze deelneemt, voer je uit:

```bash
openclaw channels capabilities --channel discord --target channel:<voice-channel-id>
```

Voorbeeld van automatisch deelnemen:

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

Opmerkingen:

- `voice.tts` overschrijft `messages.tts` alleen voor `stt-tts`-spraakweergave. Realtime-modi gebruiken `voice.realtime.voice`.
- `voice.mode` bepaalt het gesprekspad. De standaardwaarde is `agent-proxy`: een realtime spraak-frontend behandelt beurt-timing, onderbreking en weergave, delegeert inhoudelijk werk aan de gerouteerde OpenClaw-agent via `openclaw_agent_consult`, en behandelt het resultaat als een getypte Discord-prompt van die spreker. `stt-tts` behoudt de oudere batch-STT-plus-TTS-flow. `bidi` laat het realtime model rechtstreeks converseren terwijl `openclaw_agent_consult` beschikbaar blijft voor het OpenClaw-brein.
- `voice.agentSession` bepaalt welk OpenClaw-gesprek spraakbeurten ontvangt. Laat dit leeg voor de eigen sessie van het spraakkanaal, of stel `{ mode: "target", target: "channel:<text-channel-id>" }` in om het spraakkanaal te laten fungeren als microfoon-/speaker-uitbreiding van een bestaande Discord-tekstkanaalsessie zoals `#maintainers`.
- `voice.model` overschrijft het OpenClaw-agentbrein voor Discord-spraakantwoorden en realtime consults. Laat dit leeg om het gerouteerde agentmodel te erven. Dit staat los van `voice.realtime.model`.
- `agent-proxy` routeert spraak via `discord-voice`, wat de normale owner-/toolautorisatie voor de spreker en doelsessie behoudt, maar de agenttool `tts` verbergt omdat Discord-spraak de weergave beheert. Standaard geeft `agent-proxy` de consult volledige owner-equivalente tooltoegang voor owner-sprekers (`voice.realtime.toolPolicy: "owner"`) en geeft het sterk de voorkeur aan het raadplegen van de OpenClaw-agent vóór inhoudelijke antwoorden (`voice.realtime.consultPolicy: "always"`). In die standaardmodus `always` spreekt de realtime-laag niet automatisch opvulling uit vóór het consultantwoord; hij legt spraak vast en transcribeert die, en spreekt daarna het gerouteerde OpenClaw-antwoord uit. Als meerdere geforceerde consultantwoorden klaar zijn terwijl Discord nog het eerste antwoord afspeelt, worden latere exacte-spraakantwoorden in de wachtrij gezet tot de weergave inactief is, in plaats van spraak halverwege een zin te vervangen.
- In de modus `stt-tts` gebruikt STT `tools.media.audio`; `voice.model` heeft geen invloed op transcriptie.
- In realtime-modi configureren `voice.realtime.provider`, `voice.realtime.model` en `voice.realtime.voice` de realtime audiosessie. Gebruik voor OpenAI Realtime 2 plus het Codex-brein `voice.realtime.model: "gpt-realtime-2"` en `voice.model: "openai-codex/gpt-5.5"`.
- De OpenAI realtime provider accepteert huidige Realtime 2-eventnamen en verouderde Codex-compatibele aliassen voor uitvoeraudio- en transcriptgebeurtenissen, zodat compatibele provider-snapshots kunnen verschuiven zonder assistentaudio te verliezen.
- `voice.realtime.bargeIn` bepaalt of speaker-start-events van Discord actieve realtime weergave onderbreken. Als dit niet is ingesteld, volgt het de input-audio-onderbrekingsinstelling van de realtime provider.
- `voice.realtime.minBargeInAudioEndMs` bepaalt de minimale duur van assistentweergave voordat een OpenAI realtime barge-in audio afkapt. Standaard: `250`. Stel `0` in voor onmiddellijke onderbreking in ruimtes met weinig echo, of verhoog dit voor speakeropstellingen met veel echo.
- Stel voor een OpenAI-stem bij Discord-weergave `voice.tts.provider: "openai"` in en kies een Text-to-speech-stem onder `voice.tts.openai.voice` of `voice.tts.providers.openai.voice`. `cedar` is een goede mannelijk klinkende keuze op het huidige OpenAI TTS-model.
- Per-kanaals Discord-overschrijvingen van `systemPrompt` gelden voor spraaktranscriptiebeurten voor dat spraakkanaal.
- Spraaktranscriptiebeurten leiden de owner-status af uit Discord `allowFrom` (of `dm.allowFrom`); niet-owner-sprekers hebben geen toegang tot tools die alleen voor owners zijn (bijvoorbeeld `gateway` en `cron`).
- Discord-spraak is opt-in voor tekst-only configuraties; stel `channels.discord.voice.enabled=true` in (of behoud een bestaand `channels.discord.voice`-blok) om `/vc`-commando’s, de spraakruntime en de `GuildVoiceStates` Gateway-intent in te schakelen.
- `channels.discord.intents.voiceStates` kan het abonnement op de voice-state-intent expliciet overschrijven. Laat dit leeg zodat de intent de effectieve spraakinschakeling volgt.
- Als `voice.autoJoin` meerdere vermeldingen voor dezelfde guild heeft, joined OpenClaw het laatst geconfigureerde kanaal voor die guild.
- `voice.daveEncryption` en `voice.decryptionFailureTolerance` worden doorgegeven aan de join-opties van `@discordjs/voice`.
- De standaardwaarden van `@discordjs/voice` zijn `daveEncryption=true` en `decryptionFailureTolerance=24` als ze niet zijn ingesteld.
- OpenClaw gebruikt standaard de pure-JS-decoder `opusscript` voor Discord-spraakontvangst. Het optionele native pakket `@discordjs/opus` wordt genegeerd door het pnpm-installatiebeleid van de repo, zodat normale installaties, Docker-lanes en niet-gerelateerde tests geen native addon compileren. Dedicated hosts voor spraakprestaties kunnen zich aanmelden met `OPENCLAW_DISCORD_OPUS_DECODER=native` na installatie van de native addon.
- `voice.connectTimeoutMs` bepaalt de initiële `@discordjs/voice` Ready-wachttijd voor `/vc join` en auto-join-pogingen. Standaard: `30000`.
- `voice.reconnectGraceMs` bepaalt hoelang OpenClaw wacht tot een verbroken spraaksessie begint met opnieuw verbinden voordat die wordt vernietigd. Standaard: `15000`.
- In de modus `stt-tts` stopt spraakweergave niet alleen omdat een andere gebruiker begint te spreken. Om feedbacklussen te voorkomen negeert OpenClaw nieuwe spraakopname terwijl TTS wordt afgespeeld; spreek nadat de weergave is voltooid voor de volgende beurt. Realtime-modi sturen speaker-starts door als barge-in-signalen naar de realtime provider.
- In realtime-modi kan echo van speakers in een open microfoon eruitzien als barge-in en de weergave onderbreken. Stel voor Discord-ruimtes met veel echo `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` in om te voorkomen dat OpenAI automatisch onderbreekt bij input-audio. Voeg `voice.realtime.bargeIn: true` toe als je nog steeds wilt dat Discord-speaker-start-events actieve weergave onderbreken. De OpenAI realtime bridge negeert afkappingen van weergave die korter zijn dan `voice.realtime.minBargeInAudioEndMs` als waarschijnlijke echo/ruis en logt ze als overgeslagen in plaats van Discord-weergave te wissen.
- `voice.captureSilenceGraceMs` bepaalt hoelang OpenClaw wacht nadat Discord meldt dat een spreker is gestopt voordat dat audiosegment voor STT wordt afgerond. Standaard: `2500`; verhoog dit als Discord normale pauzes opsplitst in haperige gedeeltelijke transcripties.
- Wanneer ElevenLabs de geselecteerde TTS provider is, gebruikt Discord-spraakweergave streaming-TTS en start die vanuit de responsstream van de provider. Providers zonder streamingondersteuning vallen terug op het gesynthetiseerde tijdelijke-bestandspad.
- OpenClaw bewaakt ook decryptiefouten bij ontvangst en herstelt automatisch door het spraakkanaal te verlaten en opnieuw te joinen na herhaalde fouten binnen een korte periode.
- Als ontvangstlogs na een update herhaaldelijk `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` tonen, verzamel dan een dependencyrapport en logs. De gebundelde `@discordjs/voice`-lijn bevat de upstream padding-fix uit discord.js PR #11449, waarmee discord.js issue #11419 werd gesloten.
- `The operation was aborted`-ontvangstevents worden verwacht wanneer OpenClaw een vastgelegd sprekersegment afrondt; het zijn uitgebreide diagnostische meldingen, geen waarschuwingen.
- Uitgebreide Discord-spraaklogs bevatten een begrensde STT-transcriptpreview van één regel voor elk geaccepteerd sprekersegment, zodat debugging zowel de gebruikerskant als de agentantwoordkant toont zonder onbeperkte transcripttekst te dumpen.
- In de modus `agent-proxy` slaat de geforceerde consult-fallback waarschijnlijk onvolledige transcriptfragmenten over, zoals tekst die eindigt op `...` of een afsluitende verbinding zoals `and`, plus duidelijke niet-actiegerichte afsluitingen zoals “ben zo terug” of “doei”. Logs tonen `forced agent consult skipped reason=...` wanneer dit een oud antwoord in de wachtrij voorkomt.

Native opus-installatie voor source-checkouts:

```bash
pnpm install
mise exec node@22 -- pnpm discord:opus:install
```

Gebruik Node 22 voor de Gateway wanneer je de upstream macOS arm64 vooraf gebouwde native addon wilt. Als je een andere Node-runtime gebruikt, heeft het opt-in installatieprogramma mogelijk een lokale `node-gyp` source-build-toolchain nodig.

Start na installatie van de native addon de Gateway met:

```bash
OPENCLAW_DISCORD_OPUS_DECODER=native pnpm gateway:watch
```

Uitgebreide spraaklogs moeten `discord voice: opus decoder: @discordjs/opus` tonen. Zonder de env opt-in, of als de native addon ontbreekt of niet kan laden op de host, logt OpenClaw `discord voice: opus decoder: opusscript` en blijft het spraak ontvangen via de pure-JS-fallback.

STT-plus-TTS-pijplijn:

- Discord PCM-opname wordt geconverteerd naar een tijdelijk WAV-bestand.
- `tools.media.audio` verwerkt STT, bijvoorbeeld `openai/gpt-4o-mini-transcribe`.
- Het transcript wordt via Discord-ingress en routering verzonden terwijl de respons-LLM draait met een spraakuitvoerbeleid dat de agenttool `tts` verbergt en om teruggegeven tekst vraagt, omdat Discord-spraak de uiteindelijke TTS-weergave beheert.
- `voice.model` overschrijft, wanneer ingesteld, alleen de respons-LLM voor deze spraakkanaalbeurt.
- `voice.tts` wordt samengevoegd over `messages.tts`; providers met streamingmogelijkheden voeden de speler rechtstreeks, anders wordt het resulterende audiobestand afgespeeld in het gejoinde kanaal.

Voorbeeld van standaard agent-proxy-spraakkanaalsessie:

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

Zonder `voice.agentSession`-blok krijgt elk spraakkanaal zijn eigen gerouteerde OpenClaw-sessie. Bijvoorbeeld: `/vc join channel:234567890123456789` praat met de sessie voor dat Discord-spraakkanaal. Het realtime model is alleen de spraak-frontend; inhoudelijke verzoeken worden doorgegeven aan de geconfigureerde OpenClaw-agent. Als het realtime model een definitief transcript produceert zonder de consulttool aan te roepen, forceert OpenClaw de consult als fallback zodat de standaard nog steeds werkt alsof je met de agent praat.

Voorbeeld van verouderde STT plus TTS:

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

Spraak als uitbreiding van een bestaande Discord-kanaalsessie:

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

In de modus `agent-proxy` joint de bot het geconfigureerde spraakkanaal, maar OpenClaw-agentbeurten gebruiken de normale gerouteerde sessie en agent van het doelkanaal. De realtime spraaksessie spreekt het teruggegeven resultaat terug in het spraakkanaal. De supervisoragent kan nog steeds normale berichttools gebruiken volgens zijn toolbeleid, inclusief het verzenden van een apart Discord-bericht als dat de juiste actie is.

Nuttige doelvormen:

- `target: "channel:123456789012345678"` routeert via een Discord-tekstkanaalsessie.
- `target: "123456789012345678"` wordt behandeld als een kanaaldoel.
- `target: "dm:123456789012345678"` of `target: "user:123456789012345678"` routeert via die direct-message-sessie.

OpenAI Realtime-voorbeeld voor veel echo:

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

Gebruik dit wanneer het model zijn eigen Discord-weergave via een open microfoon hoort, maar je het nog steeds wilt onderbreken door te spreken. OpenClaw voorkomt dat OpenAI automatisch onderbreekt op ruwe invoeraudio, terwijl `bargeIn: true` ervoor zorgt dat Discord-gebeurtenissen voor het starten van een spreker en al actieve spreker-audio actieve realtime-antwoorden kunnen annuleren voordat de volgende vastgelegde beurt OpenAI bereikt. Zeer vroege barge-in-signalen met `audioEndMs` onder `minBargeInAudioEndMs` worden behandeld als waarschijnlijke echo/ruis en genegeerd, zodat het model niet bij het eerste weergaveframe wordt afgekapt.

Verwachte spraaklogs:

- Bij deelnemen: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- Bij realtime-start: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- Bij spreker-audio: `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...`, en `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- Bij overgeslagen verouderde spraak: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` of `reason=non-actionable-closing ...`
- Bij voltooiing van realtime-antwoord: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- Bij stoppen/resetten van weergave: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- Bij realtime-consult: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- Bij agent-antwoord: `discord voice: agent turn answer ...`
- Bij exacte spraak in wachtrij: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`, gevolgd door `discord voice: realtime exact speech dequeued reason=player-idle ...`
- Bij barge-in-detectie: `discord voice: realtime barge-in detected source=speaker-start ...` of `discord voice: realtime barge-in detected source=active-speaker-audio ...`, gevolgd door `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- Bij realtime-onderbreking: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`, gevolgd door ofwel `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` of `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- Bij genegeerde echo/ruis: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- Bij uitgeschakelde barge-in: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- Bij inactieve weergave: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

Lees de realtime-spraaklogs als tijdlijn om afgekapt geluid te debuggen:

1. `realtime audio playback started` betekent dat Discord is begonnen met het afspelen van assistent-audio. De brug begint vanaf dit punt assistent-uitvoerchunks, Discord PCM-bytes, provider-realtime-bytes en gesynthetiseerde audioduur te tellen.
2. `realtime speaker turn opened` markeert dat een Discord-spreker actief wordt. Als weergave al actief is en `bargeIn` is ingeschakeld, kan dit worden gevolgd door `barge-in detected source=speaker-start`.
3. `realtime input audio started` markeert het eerste daadwerkelijke audioframe dat voor die sprekerbeurt is ontvangen. `outputActive=true` of een niet-nul `outputAudioMs` hier betekent dat de microfoon invoer verzendt terwijl assistent-weergave nog actief is.
4. `barge-in detected source=active-speaker-audio` betekent dat OpenClaw live spreker-audio zag terwijl assistent-weergave actief was. Dit is nuttig om een echte onderbreking te onderscheiden van een Discord-gebeurtenis voor het starten van een spreker zonder bruikbare audio.
5. `barge-in requested reason=...` betekent dat OpenClaw de realtime-provider heeft gevraagd het actieve antwoord te annuleren of af te kappen. Het bevat `outputAudioMs`, `outputActive` en `playbackChunks`, zodat je kunt zien hoeveel assistent-audio daadwerkelijk was afgespeeld voor de onderbreking.
6. `realtime audio playback stopped reason=...` is het lokale resetpunt van Discord-weergave. De reden zegt wie de weergave stopte: `barge-in`, `player-idle`, `provider-clear-audio`, `forced-agent-consult`, `stream-close` of `session-close`.
7. `realtime speaker turn closed` vat de vastgelegde invoerbeurt samen. `chunks=0` of `hasAudio=false` betekent dat de sprekerbeurt werd geopend, maar dat geen bruikbare audio de realtime-brug bereikte. `interruptedPlayback=true` betekent dat die invoerbeurt overlappend was met assistent-uitvoer en barge-in-logica activeerde.

Nuttige velden:

- `outputAudioMs`: assistent-audioduur die door de realtime-provider is gegenereerd vóór de logregel.
- `audioMs`: assistent-audioduur die OpenClaw telde voordat de weergave stopte.
- `elapsedMs`: wandkloktijd tussen het openen en sluiten van de weergavestream of sprekerbeurt.
- `discordBytes`: 48 kHz stereo PCM-bytes verzonden naar of ontvangen van Discord voice.
- `realtimeBytes`: PCM-bytes in providerindeling verzonden naar of ontvangen van de realtime-provider.
- `playbackChunks`: assistent-audiochunks doorgestuurd naar Discord voor het actieve antwoord.
- `sinceLastAudioMs`: gat tussen het laatste vastgelegde spreker-audioframe en het sluiten van de sprekerbeurt.

Veelvoorkomende patronen:

- Onmiddellijk afkappen met `source=active-speaker-audio`, kleine `outputAudioMs` en dezelfde gebruiker in de buurt wijst meestal op luidsprekerecho die de microfoon binnenkomt. Verhoog `voice.realtime.minBargeInAudioEndMs`, verlaag het luidsprekervolume, gebruik een koptelefoon of stel `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` in.
- `source=speaker-start` gevolgd door `speaker turn closed ... hasAudio=false` betekent dat Discord een spreker-start meldde, maar dat geen audio OpenClaw bereikte. Dat kan een tijdelijke Discord voice-gebeurtenis zijn, noisegate-gedrag of een client die de microfoon kort activeert.
- `audio playback stopped reason=stream-close` zonder nabije barge-in of `provider-clear-audio` betekent dat de lokale Discord-weergavestream onverwacht eindigde. Controleer de voorafgaande provider- en Discord-spelerlogs.
- `capture ignored during playback (barge-in disabled)` betekent dat OpenClaw invoer opzettelijk liet vallen terwijl assistent-audio actief was. Schakel `voice.realtime.bargeIn` in als je wilt dat spraak de weergave onderbreekt.
- `barge-in ignored ... outputActive=false` betekent dat Discord of provider-VAD spraak meldde, maar dat OpenClaw geen actieve weergave had om te onderbreken. Dit zou audio niet moeten afkappen.

Referenties worden per component opgelost: LLM-route-authenticatie voor `voice.model`, STT-authenticatie voor `tools.media.audio`, TTS-authenticatie voor `messages.tts`/`voice.tts`, en realtime-provider-authenticatie voor `voice.realtime.providers` of de normale authenticatieconfiguratie van de provider.

### Spraakberichten

Discord-spraakberichten tonen een golfvormvoorbeeld en vereisen OGG/Opus-audio. OpenClaw genereert de golfvorm automatisch, maar heeft `ffmpeg` en `ffprobe` op de Gateway-host nodig om te inspecteren en te converteren.

- Geef een **lokaal bestandspad** op (URL's worden geweigerd).
- Laat tekstinhoud weg (Discord weigert tekst + spraakbericht in dezelfde payload).
- Elk audioformaat wordt geaccepteerd; OpenClaw converteert indien nodig naar OGG/Opus.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Probleemoplossing

<AccordionGroup>
  <Accordion title="Used disallowed intents or bot sees no guild messages">

    - schakel Message Content Intent in
    - schakel Server Members Intent in wanneer je afhankelijk bent van gebruiker-/lid-resolutie
    - herstart Gateway na het wijzigen van intents

  </Accordion>

  <Accordion title="Guild messages blocked unexpectedly">

    - controleer `groupPolicy`
    - controleer de guild-allowlist onder `channels.discord.guilds`
    - als de `channels`-map van de guild bestaat, zijn alleen vermelde kanalen toegestaan
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
    - `requireMention` op de verkeerde plek geconfigureerd (moet onder `channels.discord.guilds` of kanaalinvoer staan)
    - afzender geblokkeerd door guild-/kanaal-`users`-allowlist

  </Accordion>

  <Accordion title="Long-running Discord turns or duplicate replies">

    Typische logs:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Discord Gateway-wachtrijknoppen:

    - één account: `channels.discord.eventQueue.listenerTimeout`
    - meerdere accounts: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - dit beheert alleen Discord Gateway-listenerwerk, niet de levensduur van agentbeurten

    Discord past geen kanaal-eigen timeout toe op agentbeurten in de wachtrij. Berichtlisteners dragen onmiddellijk over, en Discord-runs in de wachtrij behouden ordening per sessie totdat de sessie-/tool-/runtimelevenscyclus het werk voltooit of afbreekt.

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
    OpenClaw haalt Discord-`/gateway/bot`-metadata op voordat verbinding wordt gemaakt. Tijdelijke fouten vallen terug op Discord's standaard-Gateway-URL en worden in logs met rate limiting beperkt.

    Metadata-timeoutknoppen:

    - één account: `channels.discord.gatewayInfoTimeoutMs`
    - meerdere accounts: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - env-fallback wanneer config niet is ingesteld: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - standaard: `30000` (30 seconden), max: `120000`

  </Accordion>

  <Accordion title="Gateway READY timeout restarts">
    OpenClaw wacht tijdens het opstarten en na runtime-herverbindingen op Discord's Gateway-`READY`-gebeurtenis. Setups met meerdere accounts en opstartspreiding kunnen een langer READY-opstartvenster nodig hebben dan de standaard.

    READY-timeoutknoppen:

    - opstarten met één account: `channels.discord.gatewayReadyTimeoutMs`
    - opstarten met meerdere accounts: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - opstart-env-fallback wanneer config niet is ingesteld: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - opstartstandaard: `15000` (15 seconden), max: `120000`
    - runtime met één account: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - runtime met meerdere accounts: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - runtime-env-fallback wanneer config niet is ingesteld: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - runtimestandaard: `30000` (30 seconden), max: `120000`

  </Accordion>

  <Accordion title="Permissions audit mismatches">
    `channels status --probe`-machtigingscontroles werken alleen voor numerieke kanaal-ID's.

    Als je slug-sleutels gebruikt, kan runtime-matching nog steeds werken, maar kan de probe machtigingen niet volledig verifiëren.

  </Accordion>

  <Accordion title="DM and pairing issues">

    - DM uitgeschakeld: `channels.discord.dm.enabled=false`
    - DM-beleid uitgeschakeld: `channels.discord.dmPolicy="disabled"` (legacy: `channels.discord.dm.policy`)
    - wacht op koppelingsgoedkeuring in `pairing`-modus

  </Accordion>

  <Accordion title="Bot to bot loops">
    Standaard worden door bots geschreven berichten genegeerd.

    Als u `channels.discord.allowBots=true` instelt, gebruik dan strikte vermeldings- en allowlistregels om lusgedrag te voorkomen.
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

  <Accordion title="Spraak-STT valt weg met DecryptionFailed(...)">

    - houd OpenClaw up-to-date (`openclaw update`) zodat de herstellogica voor Discord-spraakontvangst aanwezig is
    - bevestig `channels.discord.voice.daveEncryption=true` (standaard)
    - begin met `channels.discord.voice.decryptionFailureTolerance=24` (upstream-standaardwaarde) en pas deze alleen aan als dat nodig is
    - let in logs op:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - als fouten na automatisch opnieuw deelnemen blijven optreden, verzamel logs en vergelijk ze met de upstream DAVE-ontvangstgeschiedenis in [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) en [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Configuratiereferentie

Primaire referentie: [Configuratiereferentie - Discord](/nl/gateway/config-channels#discord).

<Accordion title="Discord-velden met hoge signaalwaarde">

- opstarten/authenticatie: `enabled`, `token`, `accounts.*`, `allowBots`
- beleid: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- commando: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- gebeurteniswachtrij: `eventQueue.listenerTimeout` (listenerbudget), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- antwoord/geschiedenis: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- bezorging: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming` (verouderde alias: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- media/opnieuw proberen: `mediaMaxMb` (begrenst uitgaande Discord-uploads, standaard `100MB`), `retry`
- acties: `actions.*`
- aanwezigheid: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- functies: `threadBindings`, `bindings[]` op topniveau (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## Veiligheid en operationeel beheer

- Behandel bottokens als geheimen (`DISCORD_BOT_TOKEN` heeft de voorkeur in beheerde omgevingen).
- Verleen Discord-machtigingen met minimale privileges.
- Als commandodeploy/status verouderd is, herstart de Gateway en controleer opnieuw met `openclaw channels status --probe`.

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Koppelen" icon="link" href="/nl/channels/pairing">
    Koppel een Discord-gebruiker aan de Gateway.
  </Card>
  <Card title="Groepen" icon="users" href="/nl/channels/groups">
    Groepschat- en allowlistgedrag.
  </Card>
  <Card title="Kanaalroutering" icon="route" href="/nl/channels/channel-routing">
    Routeer binnenkomende berichten naar agenten.
  </Card>
  <Card title="Beveiliging" icon="shield" href="/nl/gateway/security">
    Dreigingsmodel en hardening.
  </Card>
  <Card title="Routering met meerdere agenten" icon="sitemap" href="/nl/concepts/multi-agent">
    Wijs guilds en kanalen toe aan agenten.
  </Card>
  <Card title="Slash-commando's" icon="terminal" href="/nl/tools/slash-commands">
    Gedrag van native commando's.
  </Card>
</CardGroup>
