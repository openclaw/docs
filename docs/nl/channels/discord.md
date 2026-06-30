---
read_when:
    - Werken aan functies voor Discord-kanalen
summary: Ondersteuningsstatus, mogelijkheden en configuratie van de Discord-bot
title: Discord
x-i18n:
    generated_at: "2026-06-30T14:09:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 74244c721bfd752bf4ce73a6739503c902a14d07edef5ca6300c87f717669a7e
    source_path: channels/discord.md
    workflow: 16
---

Klaar voor DM's en guildkanalen via de officiële Discord Gateway.

<CardGroup cols={3}>
  <Card title="Koppeling" icon="link" href="/nl/channels/pairing">
    Discord-DM's staan standaard in koppelmodus.
  </Card>
  <Card title="Slash-opdrachten" icon="terminal" href="/nl/tools/slash-commands">
    Native opdrachtgedrag en opdrachtcatalogus.
  </Card>
  <Card title="Kanaalprobleemoplossing" icon="wrench" href="/nl/channels/troubleshooting">
    Cross-channel diagnostiek en herstelstroom.
  </Card>
</CardGroup>

## Snelle configuratie

Je moet een nieuwe applicatie met een bot maken, de bot aan je server toevoegen en deze aan OpenClaw koppelen. We raden aan je bot aan je eigen privéserver toe te voegen. Als je er nog geen hebt, [maak er dan eerst een](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (kies **Create My Own > For me and my friends**).

<Steps>
  <Step title="Maak een Discord-applicatie en bot">
    Ga naar de [Discord Developer Portal](https://discord.com/developers/applications) en klik op **New Application**. Geef deze een naam zoals "OpenClaw".

    Klik op **Bot** in de zijbalk. Stel de **Username** in op hoe je je OpenClaw-agent noemt.

  </Step>

  <Step title="Schakel privileged intents in">
    Scrol, nog steeds op de pagina **Bot**, omlaag naar **Privileged Gateway Intents** en schakel in:

    - **Message Content Intent** (vereist)
    - **Server Members Intent** (aanbevolen; vereist voor rol-allowlists en naam-naar-ID-matching)
    - **Presence Intent** (optioneel; alleen nodig voor aanwezigheidsupdates)

  </Step>

  <Step title="Kopieer je bottoken">
    Scrol terug omhoog op de pagina **Bot** en klik op **Reset Token**.

    <Note>
    Ondanks de naam genereert dit je eerste token — er wordt niets "gereset".
    </Note>

    Kopieer het token en sla het ergens op. Dit is je **Bot Token** en je hebt het zo meteen nodig.

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

    Dit is de basisset voor normale tekstkanalen. Als je van plan bent te posten in Discord-threads, waaronder forum- of mediakanaalworkflows die een thread maken of voortzetten, schakel dan ook **Send Messages in Threads** in.
    Kopieer de gegenereerde URL onderaan, plak deze in je browser, selecteer je server en klik op **Continue** om verbinding te maken. Je zou je bot nu in de Discord-server moeten zien.

  </Step>

  <Step title="Schakel Developer Mode in en verzamel je ID's">
    Terug in de Discord-app moet je Developer Mode inschakelen zodat je interne ID's kunt kopiëren.

    1. Klik op **User Settings** (tandwielpictogram naast je avatar) → scrol naar **Developer** in de zijbalk → schakel **Developer Mode** in

        *(Opmerking: in de mobiele Discord-app staat Developer Mode onder **App Settings** → **Advanced**)*

    2. Klik met de rechtermuisknop op je **serverpictogram** in de zijbalk → **Copy Server ID**
    3. Klik met de rechtermuisknop op je **eigen avatar** → **Copy User ID**

    Sla je **Server ID** en **User ID** op naast je Bot Token — je stuurt ze alle drie in de volgende stap naar OpenClaw.

  </Step>

  <Step title="Sta DM's van serverleden toe">
    Om koppelen te laten werken, moet Discord toestaan dat je bot je een DM stuurt. Klik met de rechtermuisknop op je **serverpictogram** → **Privacy Settings** → schakel **Direct Messages** in.

    Hierdoor kunnen serverleden (inclusief bots) je DM's sturen. Houd dit ingeschakeld als je Discord-DM's met OpenClaw wilt gebruiken. Als je alleen guildkanalen wilt gebruiken, kun je DM's na het koppelen uitschakelen.

  </Step>

  <Step title="Stel je bottoken veilig in (stuur het niet in de chat)">
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
    Als je host wordt geblokkeerd of rate-limited door Discord's applicatiezoekopdracht bij opstarten, stel dan de Discord-applicatie-/client-ID uit de Developer Portal in zodat opstarten die REST-call kan overslaan. Gebruik `channels.discord.applicationId` voor het standaardaccount, of `channels.discord.accounts.<accountId>.applicationId` wanneer je meerdere Discord-bots gebruikt.

  </Step>

  <Step title="Configureer OpenClaw en koppel">

    <Tabs>
      <Tab title="Vraag je agent">
        Chat met je OpenClaw-agent op een bestaand kanaal (bijv. Telegram) en vertel het hem. Als Discord je eerste kanaal is, gebruik dan in plaats daarvan het tabblad CLI / config.

        > "Ik heb mijn Discord-bottoken al ingesteld in de config. Rond de Discord-configuratie af met User ID `<user_id>` en Server ID `<server_id>`."
      </Tab>
      <Tab title="CLI / config">
        Als je de voorkeur geeft aan bestandsgebaseerde config, stel dan in:

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

        Voor gescripte of externe configuratie schrijf je hetzelfde JSON5-blok met `openclaw config patch --file ./discord.patch.json5 --dry-run` en voer je het daarna opnieuw uit zonder `--dry-run`. Platte-tekstwaarden voor `token` worden ondersteund. SecretRef-waarden worden ook ondersteund voor `channels.discord.token` over env-/file-/exec-providers. Zie [Geheimenbeheer](/nl/gateway/secrets).

        Houd voor meerdere Discord-bots elk bottoken en elke applicatie-ID onder het bijbehorende account. Een `channels.discord.applicationId` op topniveau wordt geërfd door accounts, dus stel deze daar alleen in wanneer elk account dezelfde applicatie-ID moet gebruiken.

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
    Wacht tot de Gateway draait en stuur daarna je bot een DM in Discord. Hij reageert met een koppelcode.

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

    Je zou nu met je agent in Discord moeten kunnen chatten via DM.

  </Step>
</Steps>

<Note>
Tokenresolutie is accountbewust. Config-tokenwaarden winnen van env-fallback. `DISCORD_BOT_TOKEN` wordt alleen gebruikt voor het standaardaccount.
Als twee ingeschakelde Discord-accounts naar hetzelfde bottoken oplossen, start OpenClaw slechts één Gateway-monitor voor dat token. Een token uit de config wint van de standaard env-fallback; anders wint het eerste ingeschakelde account en wordt het dubbele account als uitgeschakeld gerapporteerd.
Voor geavanceerde uitgaande calls (berichttool-/kanaalacties) wordt een expliciet `token` per call gebruikt voor die call. Dit geldt voor verzend- en lees-/probe-achtige acties (bijvoorbeeld lezen/zoeken/ophalen/thread/pins/machtigingen). Accountbeleid en retry-instellingen komen nog steeds uit het geselecteerde account in de actieve runtime-snapshot.
</Note>

## Aanbevolen: stel een guildworkspace in

Zodra DM's werken, kun je je Discord-server instellen als volledige workspace waarin elk kanaal zijn eigen agentsessie met eigen context krijgt. Dit wordt aanbevolen voor privéservers waar alleen jij en je bot aanwezig zijn.

<Steps>
  <Step title="Voeg je server toe aan de guild-allowlist">
    Hierdoor kan je agent in elk kanaal op je server reageren, niet alleen in DM's.

    <Tabs>
      <Tab title="Vraag je agent">
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
    Standaard reageert je agent alleen in guildkanalen wanneer hij wordt @mentioned. Voor een privéserver wil je waarschijnlijk dat hij op elk bericht reageert.

    In guildkanalen worden normale antwoorden standaard automatisch geplaatst. Voor gedeelde always-on-ruimtes kies je `messages.groupChat.visibleReplies: "message_tool"` zodat de agent kan meelezen en alleen post wanneer hij besluit dat een kanaalantwoord nuttig is. Dit werkt het best met modellen van de nieuwste generatie met betrouwbare tools, zoals GPT 5.5. Omgevingsgebeurtenissen in kamers blijven stil tenzij de tool verzendt. Zie [Omgevingsgebeurtenissen in kamers](/nl/channels/ambient-room-events) voor de volledige lurk-mode-config.

    Als Discord typen toont en de logs tokengebruik tonen maar er geen bericht wordt geplaatst, controleer dan of de beurt was geconfigureerd als omgevingsgebeurtenis in een kamer of was ingesteld op zichtbare antwoorden via de berichttool.

    <Tabs>
      <Tab title="Vraag je agent">
        > "Sta mijn agent toe op deze server te reageren zonder @mentioned te hoeven worden"
      </Tab>
      <Tab title="Config">
        Stel `requireMention: false` in je guildconfig in:

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

        Om berichttoolverzending te vereisen voor zichtbare groeps-/kanaalantwoorden, stel je `messages.groupChat.visibleReplies: "message_tool"` in.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Plan geheugen in guildkanalen">
    Standaard wordt langetermijngeheugen (MEMORY.md) alleen geladen in DM-sessies. Guildkanalen laden MEMORY.md niet automatisch.

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

Maak nu enkele kanalen op je Discord-server en begin te chatten. Je agent kan de kanaalnaam zien en elk kanaal krijgt zijn eigen geïsoleerde sessie — zodat je `#coding`, `#home`, `#research` of wat dan ook bij je workflow past kunt instellen.

## Runtimemodel

- Gateway beheert de Discord-verbinding.
- Antwoordroutering is deterministisch: inkomende Discord-antwoorden gaan terug naar Discord.
- Metadata van Discord-guilds/-kanalen wordt als onvertrouwde context aan de modelprompt toegevoegd, niet als een voor gebruikers zichtbare antwoordprefix. Als een model die envelop terugkopieert, verwijdert OpenClaw de gekopieerde metadata uit uitgaande antwoorden en uit toekomstige replay-context.
- Standaard (`session.dmScope=main`) delen directe chats de hoofdagentsessie (`agent:main:main`).
- Guild-kanalen zijn geisoleerde sessiesleutels (`agent:<agentId>:discord:channel:<channelId>`).
- Groeps-DM's worden standaard genegeerd (`channels.discord.dm.groupEnabled=false`).
- Native slash-commando's draaien in geisoleerde commandosessies (`agent:<agentId>:discord:slash:<userId>`), terwijl ze nog steeds `CommandTargetSessionKey` meenemen naar de gerouteerde gesprekssessie.
- Alleen-tekst cron-/heartbeat-aankondigingen naar Discord gebruiken het uiteindelijke voor de assistent zichtbare antwoord eenmalig. Media en payloads met gestructureerde componenten blijven uit meerdere berichten bestaan wanneer de agent meerdere afleverbare payloads uitzendt.

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

OpenClaw ondersteunt Discord components v2-containers voor agentberichten. Gebruik de berichttool met een `components`-payload. Interactieresultaten worden als normale inkomende berichten terug naar de agent gerouteerd en volgen de bestaande Discord-instellingen voor `replyToMode`.

Ondersteunde blokken:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Actierijen staan maximaal 5 knoppen of een enkel selectiemenu toe
- Selectietypen: `string`, `user`, `role`, `mentionable`, `channel`

Standaard zijn componenten eenmalig te gebruiken. Stel `components.reusable=true` in om knoppen, selecties en formulieren meerdere keren te laten gebruiken totdat ze verlopen.

Om te beperken wie op een knop kan klikken, stel je `allowedUsers` in op die knop (Discord-gebruikers-ID's, tags of `*`). Wanneer dit is geconfigureerd, ontvangen niet-overeenkomende gebruikers een tijdelijke weigering.

Componentcallbacks verlopen standaard na 30 minuten. Stel `channels.discord.agentComponents.ttlMs` in om die levensduur van het callbackregister voor het standaard-Discord-account te wijzigen, of `channels.discord.accounts.<accountId>.agentComponents.ttlMs` om een account in een multi-accountconfiguratie te overschrijven. De waarde is in milliseconden, moet een positief geheel getal zijn en is begrensd op `86400000` (24 uur). Langere TTL's zijn handig voor review- of goedkeuringsworkflows waarbij knoppen bruikbaar moeten blijven, maar ze verlengen ook het venster waarin een oud Discord-bericht nog steeds een actie kan activeren. Gebruik bij voorkeur de kortste TTL die bij de workflow past, en behoud de standaardwaarde wanneer verlopen callbacks verrassend zouden zijn.

De slash-commando's `/model` en `/models` openen een interactieve modelkiezer met dropdowns voor provider, model en compatibele runtime plus een stap Verzenden. `/models add` is verouderd en retourneert nu een verouderingsbericht in plaats van modellen vanuit chat te registreren. Het antwoord van de kiezer is tijdelijk en alleen de aanroepende gebruiker kan het gebruiken. Discord-selectiemenu's zijn beperkt tot 25 opties, dus voeg `provider/*`-vermeldingen toe aan `agents.defaults.models` wanneer je wilt dat de kiezer dynamisch ontdekte modellen alleen toont voor geselecteerde providers zoals `openai` of `vllm`.

Bestandsbijlagen:

- `file`-blokken moeten naar een bijlagereferentie wijzen (`attachment://<filename>`)
- Geef de bijlage op via `media`/`path`/`filePath` (enkel bestand); gebruik `media-gallery` voor meerdere bestanden
- Gebruik `filename` om de uploadnaam te overschrijven wanneer die moet overeenkomen met de bijlagereferentie

Modale formulieren:

- Voeg `components.modal` toe met maximaal 5 velden
- Veldtypen: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw voegt automatisch een activeringsknop toe

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

    Als DM-beleid niet open is, worden onbekende gebruikers geblokkeerd (of om koppeling gevraagd in de modus `pairing`).

    Prioriteit bij meerdere accounts:

    - `channels.discord.accounts.default.allowFrom` geldt alleen voor het account `default`.
    - Voor een account heeft `allowFrom` prioriteit boven de verouderde `dm.allowFrom`.
    - Benoemde accounts erven `channels.discord.allowFrom` wanneer hun eigen `allowFrom` en verouderde `dm.allowFrom` niet zijn ingesteld.
    - Benoemde accounts erven `channels.discord.accounts.default.allowFrom` niet.

    Verouderde `channels.discord.dm.policy` en `channels.discord.dm.allowFrom` worden nog steeds gelezen voor compatibiliteit. `openclaw doctor --fix` migreert ze naar `dmPolicy` en `allowFrom` wanneer dat kan zonder toegang te wijzigen.

    DM-doelindeling voor aflevering:

    - `user:<id>`
    - `<@id>`-vermelding

    Kale numerieke ID's worden normaal als kanaal-ID's opgelost wanneer een kanaalstandaard actief is, maar ID's die in de effectieve DM-`allowFrom` van het account staan, worden voor compatibiliteit behandeld als gebruikers-DM-doelen.

  </Tab>

  <Tab title="Access groups">
    Discord-DM's en autorisatie voor tekstcommando's kunnen dynamische `accessGroup:<name>`-vermeldingen gebruiken in `channels.discord.allowFrom`.

    Namen van toegangsgroepen worden gedeeld tussen berichtkanalen. Gebruik `type: "message.senders"` voor een statische groep waarvan de leden worden uitgedrukt in de normale `allowFrom`-syntaxis van elk kanaal, of `type: "discord.channelAudience"` wanneer het huidige `ViewChannel`-publiek van een Discord-kanaal het lidmaatschap dynamisch moet definieren. Gedeeld gedrag van toegangsgroepen is hier gedocumenteerd: [Toegangsgroepen](/nl/channels/access-groups).

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

    Een Discord-tekstkanaal heeft geen aparte ledenlijst. `type: "discord.channelAudience"` modelleert lidmaatschap als volgt: de DM-afzender is lid van de geconfigureerde guild en heeft momenteel effectieve `ViewChannel`-machtiging op het geconfigureerde kanaal nadat rol- en kanaaloverschrijvingen zijn toegepast.

    Voorbeeld: sta iedereen toe die `#maintainers` kan zien om de bot een DM te sturen, terwijl DM's gesloten blijven voor alle anderen.

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

    Schakel de Discord Developer Portal **Server Members Intent** in voor de bot wanneer je kanaalpubliek-toegangsgroepen gebruikt. DM's bevatten geen guild-lidstatus, dus OpenClaw lost het lid via Discord REST op tijdens autorisatie.

  </Tab>

  <Tab title="Guild policy">
    Guildafhandeling wordt beheerd door `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    De veilige basislijn wanneer `channels.discord` bestaat, is `allowlist`.

    `allowlist`-gedrag:

    - guild moet overeenkomen met `channels.discord.guilds` (`id` heeft de voorkeur, slug wordt geaccepteerd)
    - optionele afzender-allowlists: `users` (stabiele ID's aanbevolen) en `roles` (alleen rol-ID's); als een van beide is geconfigureerd, zijn afzenders toegestaan wanneer ze overeenkomen met `users` OF `roles`
    - directe naam-/tagmatching is standaard uitgeschakeld; schakel `channels.discord.dangerouslyAllowNameMatching: true` alleen in als break-glass-compatibiliteitsmodus
    - namen/tags worden ondersteund voor `users`, maar ID's zijn veiliger; `openclaw security audit` waarschuwt wanneer naam-/tagvermeldingen worden gebruikt
    - als een guild `channels` geconfigureerd heeft, worden niet-vermelde kanalen geweigerd
    - als een guild geen `channels`-blok heeft, zijn alle kanalen in die geallowliste guild toegestaan

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
    Guildberichten zijn standaard vermelding-gegate.

    Vermeldingsdetectie omvat:

    - expliciete botvermelding
    - geconfigureerde vermeldingspatronen (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - impliciet antwoord-op-bot-gedrag in ondersteunde gevallen

    Gebruik bij het schrijven van uitgaande Discord-berichten de canonieke vermeldingssyntaxis: `<@USER_ID>` voor gebruikers, `<#CHANNEL_ID>` voor kanalen en `<@&ROLE_ID>` voor rollen. Gebruik niet de verouderde bijnaamvermeldingsvorm `<@!USER_ID>`.

    `requireMention` wordt per guild/kanaal geconfigureerd (`channels.discord.guilds...`).
    `ignoreOtherMentions` laat optioneel berichten vallen die een andere gebruiker/rol vermelden maar niet de bot (met uitzondering van @everyone/@here).

    Groeps-DM's:

    - standaard: genegeerd (`dm.groupEnabled=false`)
    - optionele allowlist via `dm.groupChannels` (kanaal-ID's of slugs)

  </Tab>
</Tabs>

### Op rollen gebaseerde agentroutering

Gebruik `bindings[].match.roles` om Discord-gildeleden op basis van rol-ID naar verschillende agents te routeren. Rolgebaseerde bindings accepteren alleen rol-ID's en worden geëvalueerd na peer- of parent-peer-bindings en vóór guild-only-bindings. Als een binding ook andere matchvelden instelt (bijvoorbeeld `peer` + `guildId` + `roles`), moeten alle geconfigureerde velden overeenkomen.

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

## Native commando's en commando-authenticatie

- `commands.native` staat standaard op `"auto"` en is ingeschakeld voor Discord.
- Overschrijving per kanaal: `channels.discord.commands.native`.
- `commands.native=false` slaat registratie en opschoning van Discord-slashcommando's tijdens het opstarten over. Eerder geregistreerde commando's kunnen zichtbaar blijven in Discord totdat je ze uit de Discord-app verwijdert.
- Native commando-authenticatie gebruikt dezelfde Discord-allowlists/-beleidsregels als normale berichtverwerking.
- Commando's kunnen nog steeds zichtbaar zijn in de Discord-UI voor gebruikers die niet geautoriseerd zijn; uitvoering handhaaft nog steeds OpenClaw-authenticatie en retourneert "niet geautoriseerd".

Zie [Slashcommando's](/nl/tools/slash-commands) voor commandocatalogus en gedrag.

Standaardinstellingen voor slashcommando's:

- `ephemeral: true`

## Functiedetails

<AccordionGroup>
  <Accordion title="Reply tags and native replies">
    Discord ondersteunt reply-tags in agentuitvoer:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Aangestuurd door `channels.discord.replyToMode`:

    - `off` (standaard)
    - `first`
    - `all`
    - `batched`

    Let op: `off` schakelt impliciete reply-threading uit. Expliciete `[[reply_to_*]]`-tags worden nog steeds gerespecteerd.
    `first` koppelt de impliciete native reply-verwijzing altijd aan het eerste uitgaande Discord-bericht voor de beurt.
    `batched` koppelt de impliciete native reply-verwijzing van Discord alleen wanneer de
    inkomende gebeurtenis een gedebouncete batch van meerdere berichten was. Dit is handig
    wanneer je native replies vooral wilt gebruiken voor dubbelzinnige, piekerige chats, niet voor elke
    beurt met één bericht.

    Bericht-ID's worden zichtbaar gemaakt in context/geschiedenis, zodat agents specifieke berichten kunnen targeten.

  </Accordion>

  <Accordion title="Link previews">
    Discord genereert standaard rijke link-embeds voor URL's. OpenClaw onderdrukt die gegenereerde embeds standaard op uitgaande Discord-berichten, zodat door agents verzonden URL's gewone links blijven, tenzij je je hiervoor aanmeldt:

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    Stel `channels.discord.accounts.<id>.suppressEmbeds` in om één account te overschrijven. Verzendingen via de berichttool van agents kunnen ook `suppressEmbeds: false` doorgeven voor één bericht. Expliciete Discord-`embeds`-payloads worden niet onderdrukt door de standaardinstelling voor linkvoorbeelden.

  </Accordion>

  <Accordion title="Live stream preview">
    OpenClaw kan conceptantwoorden streamen door een tijdelijk bericht te verzenden en dit te bewerken terwijl tekst binnenkomt. `channels.discord.streaming` accepteert `off` | `partial` | `block` | `progress` (standaard). `progress` houdt één bewerkbaar statusconcept bij en werkt dit bij met toolvoortgang tot de uiteindelijke levering; het gedeelde startlabel is een rollende regel, zodat het net als de rest uit beeld schuift zodra er genoeg werk verschijnt. `streamMode` is een legacy-runtimealias. Voer `openclaw doctor --fix` uit om blijvende configuratie naar de canonieke sleutel te herschrijven.

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
          maxLineChars: 120,
          toolProgress: true,
          commentary: false,
        },
      },
    },
  },
}
```

    - `partial` bewerkt één voorbeeldbericht terwijl tokens binnenkomen.
    - `block` verzendt brokken ter grootte van een concept (gebruik `draftChunk` om grootte en breekpunten af te stemmen, begrensd tot `textChunkLimit`).
    - Media, fouten en expliciete-reply-eindberichten annuleren wachtende voorbeeldbewerkingen.
    - `streaming.preview.toolProgress` (standaard `true`) bepaalt of tool-/voortgangsupdates het voorbeeldbericht hergebruiken.
    - Tool-/voortgangsrijen worden weergegeven als compacte emoji + titel + detail wanneer beschikbaar, bijvoorbeeld `🛠️ Bash: run tests` of `🔎 Web Search: for "query"`.
    - `streaming.progress.commentary` (standaard `false`) meldt zich aan voor commentaar-/preambuletekst van de assistent in het tijdelijke voortgangsconcept. Commentaar wordt vóór weergave opgeschoond, blijft tijdelijk en verandert de levering van het uiteindelijke antwoord niet.
    - `streaming.progress.maxLineChars` bepaalt het budget per regel voor voortgangsvoorbeelden. Proza wordt ingekort op woordgrenzen; commando- en paddetails behouden nuttige achtervoegsels.
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

    Voorbeeldstreaming is alleen tekst; media-antwoorden vallen terug op normale levering. Wanneer `block`-streaming expliciet is ingeschakeld, slaat OpenClaw de voorbeeldstream over om dubbel streamen te voorkomen.

  </Accordion>

  <Accordion title="History, context, and thread behavior">
    Gildegeschiedeniscontext:

    - `channels.discord.historyLimit` standaard `20`
    - fallback: `messages.groupChat.historyLimit`
    - `0` schakelt uit

    Bedieningselementen voor DM-geschiedenis:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Threadgedrag:

    - Discord-threads worden gerouteerd als kanaalsessies en nemen de configuratie van het bovenliggende kanaal over, tenzij overschreven.
    - Threadsessies nemen de sessieniveau-`/model`-selectie van het bovenliggende kanaal over als alleen-model-fallback; threadlokale `/model`-selecties hebben nog steeds voorrang en transcriptgeschiedenis van het bovenliggende kanaal wordt niet gekopieerd, tenzij transcriptovererving is ingeschakeld.
    - `channels.discord.thread.inheritParent` (standaard `false`) meldt nieuwe auto-threads aan voor seeding vanuit het bovenliggende transcript. Overschrijvingen per account staan onder `channels.discord.accounts.<id>.thread.inheritParent`.
    - Reacties van de berichttool kunnen `user:<id>`-DM-targets oplossen.
    - `guilds.<guild>.channels.<channel>.requireMention: false` blijft behouden tijdens de activatiefallback in de reply-fase.

    Kanaalonderwerpen worden geïnjecteerd als **niet-vertrouwde** context. Allowlists bepalen wie de agent kan activeren, maar vormen geen volledige redactiegrens voor aanvullende context.

  </Accordion>

  <Accordion title="Thread-bound sessions for subagents">
    Discord kan een thread binden aan een sessietarget, zodat vervolgberichten in die thread naar dezelfde sessie blijven routeren (inclusief subagentsessies).

    Commando's:

    - `/focus <target>` bind huidige/nieuwe thread aan een subagent-/sessietarget
    - `/unfocus` verwijder huidige threadbinding
    - `/agents` toon actieve runs en bindingsstatus
    - `/session idle <duration|off>` inspecteer/werk automatische inactivity-unfocus bij voor gefocuste bindings
    - `/session max-age <duration|off>` inspecteer/werk harde maximale leeftijd bij voor gefocuste bindings

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
    - `spawnSessions` bepaalt automatisch aanmaken/binden van threads voor `sessions_spawn({ thread: true })` en ACP-threadspawns. Standaard: `true`.
    - `defaultSpawnContext` bepaalt native subagentcontext voor threadgebonden spawns. Standaard: `"fork"`.
    - Verouderde sleutels `spawnSubagentSessions`/`spawnAcpSessions` worden gemigreerd door `openclaw doctor --fix`.
    - Als threadbindings voor een account zijn uitgeschakeld, zijn `/focus` en gerelateerde threadbindingsbewerkingen niet beschikbaar.

    Zie [Subagenten](/nl/tools/subagents), [ACP-agenten](/nl/tools/acp-agents) en [Configuratiereferentie](/nl/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Persistent ACP channel bindings">
    Configureer voor stabiele "altijd-aan" ACP-werkruimten top-level getypeerde ACP-bindings die op Discord-gesprekken zijn gericht.

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

    - `/acp spawn codex --bind here` bindt het huidige kanaal of de huidige thread ter plekke en houdt toekomstige berichten op dezelfde ACP-sessie. Threadberichten erven de binding van het bovenliggende kanaal.
    - In een gebonden kanaal of thread resetten `/new` en `/reset` dezelfde ACP-sessie ter plekke. Tijdelijke threadbindings kunnen targetoplossing overschrijven terwijl ze actief zijn.
    - `spawnSessions` bewaakt het aanmaken/binden van child threads via `--thread auto|here`.

    Zie [ACP-agenten](/nl/tools/acp-agents) voor details over bindingsgedrag.

  </Accordion>

  <Accordion title="Reaction notifications">
    Modus voor reactiemeldingen per gilde:

    - `off`
    - `own` (standaard)
    - `all`
    - `allowlist` (gebruikt `guilds.<id>.users`)

    Reactiegebeurtenissen worden omgezet in systeemgebeurtenissen en gekoppeld aan de gerouteerde Discord-sessie.

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction` verzendt een bevestigingsemoji terwijl OpenClaw een inkomend bericht verwerkt.

    Oplossingsvolgorde:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - fallback op emoji van agentidentiteit (`agents.list[].identity.emoji`, anders "👀")

    Opmerkingen:

    - Discord accepteert unicode-emoji of namen van aangepaste emoji.
    - Gebruik `""` om de reactie voor een kanaal of account uit te schakelen.

  </Accordion>

  <Accordion title="Config writes">
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

  <Accordion title="Gateway proxy">
    Routeer Discord Gateway-WebSocketverkeer en REST-lookups bij het opstarten (applicatie-ID + allowlist-oplossing) via een HTTP(S)-proxy met `channels.discord.proxy`.

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

  <Accordion title="PluralKit support">
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

    - allowlists kunnen `pk:<memberId>` gebruiken
    - weergavenamen van leden worden alleen op naam/slug gematcht wanneer `channels.discord.dangerouslyAllowNameMatching: true`
    - lookups gebruiken de oorspronkelijke bericht-ID en zijn beperkt tot een tijdvenster
    - als lookup mislukt, worden proxied berichten behandeld als botberichten en verwijderd, tenzij `allowBots=true`

  </Accordion>

  <Accordion title="Uitgaande vermeldingsaliassen">
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

  <Accordion title="Presence-configuratie">
    Presence-updates worden toegepast wanneer je een status- of activiteitenveld instelt, of wanneer je automatische presence inschakelt.

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

    Voorbeeld van activiteit (aangepaste status is het standaardactiviteitstype):

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

    Voorbeeld van streaming:

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

    Overzicht van activiteitstypen:

    - 0: Spelen
    - 1: Streaming (vereist `activityUrl`)
    - 2: Luisteren
    - 3: Kijken
    - 4: Aangepast (gebruikt de activiteitstekst als statusstatus; emoji is optioneel)
    - 5: Meedoen

    Voorbeeld van automatische presence (runtime-gezondheidssignaal):

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

    Automatische presence koppelt runtime-beschikbaarheid aan Discord-status: gezond => online, verminderd of onbekend => idle, uitgeput of niet beschikbaar => dnd. Optionele tekstoverschrijvingen:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (ondersteunt `{reason}`-placeholder)

  </Accordion>

  <Accordion title="Goedkeuringen in Discord">
    Discord ondersteunt afhandeling van goedkeuringen via knoppen in DM's en kan optioneel goedkeuringsprompts plaatsen in het oorspronkelijke kanaal.

    Configuratiepad:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (optioneel; valt waar mogelijk terug op `commands.ownerAllowFrom`)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, standaard: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord schakelt native exec-goedkeuringen automatisch in wanneer `enabled` niet is ingesteld of `"auto"` is en ten minste één goedkeurder kan worden opgelost, vanuit `execApprovals.approvers` of vanuit `commands.ownerAllowFrom`. Discord leidt exec-goedkeurders niet af uit kanaal-`allowFrom`, legacy `dm.allowFrom` of direct-message `defaultTo`. Stel `enabled: false` in om Discord expliciet uit te schakelen als native goedkeuringsclient.

    Voor gevoelige groepscommando's die alleen voor eigenaren zijn bedoeld, zoals `/diagnostics` en `/export-trajectory`, stuurt OpenClaw goedkeuringsprompts en eindresultaten privé. Het probeert eerst Discord-DM wanneer de aanroepende eigenaar een Discord-eigenaarsroute heeft; als die niet beschikbaar is, valt het terug op de eerste beschikbare eigenaarsroute uit `commands.ownerAllowFrom`, zoals Telegram.

    Wanneer `target` `channel` of `both` is, is de goedkeuringsprompt zichtbaar in het kanaal. Alleen opgeloste goedkeurders kunnen de knoppen gebruiken; andere gebruikers ontvangen een tijdelijke weigering. Goedkeuringsprompts bevatten de commandotekst, dus schakel kanaallevering alleen in vertrouwde kanalen in. Als de kanaal-ID niet uit de sessiesleutel kan worden afgeleid, valt OpenClaw terug op DM-levering.

    Discord rendert ook de gedeelde goedkeuringsknoppen die door andere chatkanalen worden gebruikt. De native Discord-adapter voegt vooral DM-routering voor goedkeurders en kanaalfanout toe.
    Wanneer die knoppen aanwezig zijn, vormen ze de primaire goedkeurings-UX; OpenClaw
    mag alleen een handmatig `/approve`-commando opnemen wanneer het toolresultaat zegt
    dat chatgoedkeuringen niet beschikbaar zijn of dat handmatige goedkeuring de enige route is.
    Als de native Discord-goedkeuringsruntime niet actief is, houdt OpenClaw de
    lokale deterministische `/approve <id> <decision>`-prompt zichtbaar. Als de
    runtime actief is maar een native kaart niet aan een doel kan worden geleverd,
    stuurt OpenClaw een fallbackmelding in dezelfde chat met het exacte `/approve`-
    commando van de wachtende goedkeuring.

    Gateway-authenticatie en goedkeuringsresolutie volgen het gedeelde Gateway-clientcontract (`plugin:`-ID's worden opgelost via `plugin.approval.resolve`; andere ID's via `exec.approval.resolve`). Goedkeuringen verlopen standaard na 30 minuten.

    Zie [Exec-goedkeuringen](/nl/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Tools en actiegates

Discord-berichtacties omvatten berichten sturen, kanaalbeheer, moderatie, presence en metadata-acties.

Kernvoorbeelden:

- berichten: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- reacties: `react`, `reactions`, `emojiList`
- moderatie: `timeout`, `kick`, `ban`
- presence: `setPresence`

De actie `event-create` accepteert een optionele parameter `image` (URL of lokaal bestandspad) om de omslagafbeelding van de geplande gebeurtenis in te stellen.

Actiegates staan onder `channels.discord.actions.*`.

Standaardgate-gedrag:

| Actiegroep                                                                                                                                                               | Standaard      |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | ingeschakeld   |
| roles                                                                                                                                                                    | uitgeschakeld  |
| moderation                                                                                                                                                               | uitgeschakeld  |
| presence                                                                                                                                                                 | uitgeschakeld  |

## Components v2-UI

OpenClaw gebruikt Discord components v2 voor exec-goedkeuringen en cross-contextmarkeringen. Discord-berichtacties kunnen ook `components` accepteren voor aangepaste UI (geavanceerd; vereist het construeren van een componentpayload via de discord-tool), terwijl legacy `embeds` beschikbaar blijven maar niet worden aanbevolen.

- `channels.discord.ui.components.accentColor` stelt de accentkleur in die door Discord-componentcontainers wordt gebruikt (hex).
- Stel per account in met `channels.discord.accounts.<id>.ui.components.accentColor`.
- `channels.discord.agentComponents.ttlMs` bepaalt hoe lang verzonden Discord-componentcallbacks geregistreerd blijven (standaard `1800000`, maximum `86400000`). Stel per account in met `channels.discord.accounts.<id>.agentComponents.ttlMs`.
- `embeds` worden genegeerd wanneer components v2 aanwezig zijn.
- Voorvertoningen van platte URL's worden standaard onderdrukt. Stel `suppressEmbeds: false` in op een berichtactie wanneer één uitgaande link moet uitklappen.

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

Discord heeft twee afzonderlijke spraakoppervlakken: realtime **spraakkanalen** (doorlopende gesprekken) en **spraakberichtbijlagen** (de waveform-previewindeling). De Gateway ondersteunt beide.

### Spraakkanalen

Setup-checklist:

1. Schakel Message Content Intent in het Discord Developer Portal in.
2. Schakel Server Members Intent in wanneer rol-/gebruikersallowlists worden gebruikt.
3. Nodig de bot uit met de scopes `bot` en `applications.commands`.
4. Verleen Connect, Speak, Send Messages en Read Message History in het doel-spraakkanaal.
5. Schakel native commando's in (`commands.native` of `channels.discord.commands.native`).
6. Configureer `channels.discord.voice`.

Gebruik `/vc join|leave|status` om sessies te beheren. Het commando gebruikt de standaardagent van het account en volgt dezelfde allowlist- en groepsbeleidsregels als andere Discord-commando's.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

Voer het volgende uit om de effectieve machtigingen van de bot te inspecteren voordat je deelneemt:

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
        model: "openai/gpt-5.5",
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
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

Opmerkingen:

- `voice.tts` overschrijft `messages.tts` alleen voor `stt-tts`-spraakweergave. Realtime-modi gebruiken `voice.realtime.speakerVoice`.
- `voice.mode` bepaalt het gesprekspad. De standaardwaarde is `agent-proxy`: een realtime spraakfrontend verwerkt beurt-timing, onderbreking en weergave, delegeert inhoudelijk werk aan de gerouteerde OpenClaw-agent via `openclaw_agent_consult` en behandelt het resultaat als een getypte Discord-prompt van die spreker. `stt-tts` behoudt de oudere batch-STT plus TTS-stroom. Met `bidi` kan het realtime model rechtstreeks converseren terwijl `openclaw_agent_consult` beschikbaar blijft voor het OpenClaw-brein.
- `voice.agentSession` bepaalt welk OpenClaw-gesprek spraakbeurten ontvangt. Laat dit leeg voor de eigen sessie van het spraakkanaal, of stel `{ mode: "target", target: "channel:<text-channel-id>" }` in om het spraakkanaal te laten werken als microfoon-/luidsprekeruitbreiding van een bestaande Discord-tekstkanaalsessie zoals `#maintainers`.
- `voice.model` overschrijft het OpenClaw-agentbrein voor Discord-spraakantwoorden en realtime consults. Laat dit leeg om het gerouteerde agentmodel over te nemen. Dit staat los van `voice.realtime.model`.
- Met `voice.followUsers` kan de bot met geselecteerde gebruikers deelnemen aan Discord-spraak, meeverplaatsen en vertrekken. Zie [Gebruikers volgen in spraak](#follow-users-in-voice) voor gedragsregels en voorbeelden.
- `agent-proxy` routeert spraak via `discord-voice`, dat normale owner-/toolautorisatie voor de spreker en doelsessie behoudt, maar de agenttool `tts` verbergt omdat Discord-spraak de weergave beheert. Standaard geeft `agent-proxy` het consult volledige owner-equivalente tooltoegang voor ownersprekers (`voice.realtime.toolPolicy: "owner"`) en geeft het sterk de voorkeur aan raadpleging van de OpenClaw-agent vóór inhoudelijke antwoorden (`voice.realtime.consultPolicy: "always"`). In die standaardmodus `always` spreekt de realtime laag niet automatisch opvulling uit vóór het consultantwoord; hij legt spraak vast en transcribeert die, en spreekt daarna het gerouteerde OpenClaw-antwoord uit. Als meerdere afgedwongen consultantwoorden klaar zijn terwijl Discord het eerste antwoord nog afspeelt, worden latere antwoorden met exacte spraak in de wachtrij gezet totdat de weergave inactief is, in plaats van spraak midden in een zin te vervangen.
- In de modus `stt-tts` gebruikt STT `tools.media.audio`; `voice.model` heeft geen invloed op transcriptie.
- In realtime-modi configureren `voice.realtime.provider`, `voice.realtime.model` en `voice.realtime.speakerVoice` de realtime audiosessie. Gebruik voor OpenAI Realtime 2 plus het Codex-brein `voice.realtime.model: "gpt-realtime-2"` en `voice.model: "openai/gpt-5.5"`.
- Realtime spraakmodi nemen standaard kleine profielbestanden `IDENTITY.md`, `USER.md` en `SOUL.md` op in de instructies voor de realtime provider, zodat snelle directe beurten dezelfde identiteit, gebruikersgronding en persona behouden als de gerouteerde OpenClaw-agent. Stel `voice.realtime.bootstrapContextFiles` in op een subset om dit aan te passen, of op `[]` om het uit te schakelen. De ondersteunde realtime bootstrapbestanden zijn beperkt tot die profielbestanden; `AGENTS.md` blijft in de normale agentcontext. De geïnjecteerde profielcontext vervangt `openclaw_agent_consult` niet voor werk in de workspace, actuele feiten, geheugenopzoekingen of toolondersteunde acties.
- Stel in OpenAI `agent-proxy`-realtime-modus `voice.realtime.requireWakeName: true` in om Discord-realtime-spraak stil te houden totdat een transcript begint of eindigt met een weknaam. Geconfigureerde weknamen moeten één of twee woorden zijn. Als `voice.realtime.wakeNames` niet is ingesteld, gebruikt OpenClaw de gerouteerde agent `name` plus `OpenClaw`, met een fallback naar de agent-id plus `OpenClaw`. Weknaamfiltering schakelt automatische reacties van de realtime provider uit, routeert geaccepteerde beurten via het consultpad van de OpenClaw-agent en geeft een korte gesproken bevestiging wanneer een leidende weknaam wordt herkend uit gedeeltelijke transcriptie voordat het definitieve transcript arriveert.
- De OpenAI-realtimeprovider accepteert huidige Realtime 2-eventnamen en verouderde Codex-compatibele aliassen voor uitvoeraudio- en transcriptevents, zodat compatibele providersnapshots kunnen afwijken zonder assistentaudio te laten vallen.
- `voice.realtime.bargeIn` bepaalt of Discord-events voor het starten van een spreker actieve realtime-weergave onderbreken. Als dit niet is ingesteld, volgt het de instelling voor input-audio-onderbreking van de realtime provider.
- `voice.realtime.minBargeInAudioEndMs` bepaalt de minimale duur van assistentweergave voordat een OpenAI-realtime barge-in audio afkapt. Standaard: `250`. Stel `0` in voor onmiddellijke onderbreking in ruimten met weinig echo, of verhoog dit voor luidsprekeropstellingen met veel echo.
- Stel voor een OpenAI-stem bij Discord-weergave `voice.tts.provider: "openai"` in en kies een tekst-naar-spraakstem onder `voice.tts.providers.openai.speakerVoice`. `cedar` is een goede mannelijk klinkende keuze op het huidige OpenAI TTS-model.
- Discord-overschrijvingen van `systemPrompt` per kanaal gelden voor spraaktranscriptbeurten voor dat spraakkanaal.
- Spraaktranscriptbeurten leiden de ownerstatus af uit Discord `allowFrom` (of `dm.allowFrom`) voor owner-afgeschermde opdrachten en kanaalacties. Zichtbaarheid van agenttools volgt het geconfigureerde toolbeleid voor de gerouteerde sessie.
- Discord-spraak is opt-in voor tekst-only configuraties; stel `channels.discord.voice.enabled=true` in (of behoud een bestaand `channels.discord.voice`-blok) om `/vc`-opdrachten, de spraakruntime en de Gateway-intentie `GuildVoiceStates` in te schakelen.
- `channels.discord.intents.voiceStates` kan het abonnement op de voice-state-intentie expliciet overschrijven. Laat dit leeg zodat de intentie de effectieve spraakinschakeling volgt.
- Als `voice.autoJoin` meerdere vermeldingen voor dezelfde guild heeft, neemt OpenClaw deel aan het laatst geconfigureerde kanaal voor die guild.
- `voice.allowedChannels` is een optionele toestemmingslijst voor verblijf. Laat dit leeg om `/vc join` toe te staan naar elk geautoriseerd Discord-spraakkanaal. Wanneer dit is ingesteld, zijn `/vc join`, automatisch deelnemen bij opstarten en voice-state-verplaatsingen van de bot beperkt tot de vermelde `{ guildId, channelId }`-items. Stel dit in op een lege array om alle Discord-spraakdeelnames te weigeren. Als Discord de bot buiten de toestemmingslijst verplaatst, verlaat OpenClaw dat kanaal en neemt het opnieuw deel aan het geconfigureerde auto-join-doel wanneer er een beschikbaar is.
- `voice.daveEncryption` en `voice.decryptionFailureTolerance` worden doorgegeven aan join-opties van `@discordjs/voice`.
- De standaardwaarden van `@discordjs/voice` zijn `daveEncryption=true` en `decryptionFailureTolerance=24` als ze niet zijn ingesteld.
- OpenClaw gebruikt de gebundelde `libopus-wasm`-codec voor het ontvangen van Discord-spraak en realtime raw PCM-weergave. Het levert een vastgepinde libopus WebAssembly-build en vereist geen native opus-add-ons.
- `voice.connectTimeoutMs` bepaalt de eerste `@discordjs/voice`-wachttijd op Ready voor `/vc join` en auto-join-pogingen. Standaard: `30000`.
- `voice.reconnectGraceMs` bepaalt hoelang OpenClaw wacht tot een verbroken spraaksessie begint met opnieuw verbinden voordat die wordt vernietigd. Standaard: `15000`.
- In de modus `stt-tts` stopt spraakweergave niet alleen omdat een andere gebruiker begint te spreken. Om feedbacklussen te voorkomen, negeert OpenClaw nieuwe spraakopname terwijl TTS wordt afgespeeld; spreek na afloop van de weergave voor de volgende beurt. Realtime-modi sturen het starten van sprekers door als barge-in-signalen naar de realtime provider.
- In realtime-modi kan echo van luidsprekers in een open microfoon eruitzien als barge-in en de weergave onderbreken. Stel voor Discord-ruimten met veel echo `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` in om te voorkomen dat OpenAI automatisch onderbreekt op inputaudio. Voeg `voice.realtime.bargeIn: true` toe als je nog steeds wilt dat Discord-events voor het starten van sprekers actieve weergave onderbreken. De OpenAI-realtimebridge negeert weergave-afkappingen korter dan `voice.realtime.minBargeInAudioEndMs` als waarschijnlijke echo/ruis en logt ze als overgeslagen in plaats van Discord-weergave te wissen.
- `voice.captureSilenceGraceMs` bepaalt hoelang OpenClaw wacht nadat Discord meldt dat een spreker is gestopt voordat dat audiosegment voor STT wordt afgerond. Standaard: `2000`; verhoog dit als Discord normale pauzes opsplitst in haperige gedeeltelijke transcripties.
- Wanneer ElevenLabs de geselecteerde TTS-provider is, gebruikt Discord-spraakweergave streaming-TTS en begint die vanuit de responsstream van de provider. Providers zonder streamingondersteuning vallen terug op het pad met gesynthetiseerde tijdelijke bestanden.
- OpenClaw bewaakt ook ontvangst-decryptiefouten en herstelt automatisch door het spraakkanaal te verlaten en opnieuw deel te nemen na herhaalde fouten binnen een kort tijdvenster.
- Als ontvangstlogs na een update herhaaldelijk `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` tonen, verzamel dan een afhankelijkheidsrapport en logs. De gebundelde `@discordjs/voice`-lijn bevat de upstream padding-fix uit discord.js PR #11449, waarmee discord.js issue #11419 is gesloten.
- Ontvangstevents `The operation was aborted` worden verwacht wanneer OpenClaw een vastgelegd sprekersegment afrondt; het zijn uitgebreide diagnoses, geen waarschuwingen.
- Uitgebreide Discord-spraaklogs bevatten een begrensde eenregelige STT-transcriptvoorvertoning voor elk geaccepteerd sprekersegment, zodat debugging zowel de gebruikerskant als de antwoordkant van de agent toont zonder onbeperkte transcripttekst te dumpen.
- In de modus `agent-proxy` slaat de fallback voor afgedwongen consults waarschijnlijk onvolledige transcriptfragmenten over, zoals tekst die eindigt op `...` of een afsluitende verbindingsuitdrukking zoals `and`, plus duidelijk niet-actiegerichte afsluitingen zoals “ben zo terug” of “dag”. Logs tonen `forced agent consult skipped reason=...` wanneer dit een verouderd antwoord in de wachtrij voorkomt.

### Gebruikers volgen in spraak

Gebruik `voice.followUsers` wanneer je wilt dat de Discord-spraakbot bij een of meer bekende Discord-gebruikers blijft, in plaats van bij het opstarten deel te nemen aan een vast kanaal of te wachten op `/vc join`.

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

Gedrag:

- `followUsers` accepteert ruwe Discord-gebruikers-ID's en `discord:<id>`-waarden. OpenClaw normaliseert beide vormen voordat voice-state-events worden gematcht.
- `followUsersEnabled` is standaard `true` wanneer `followUsers` is geconfigureerd. Stel dit in op `false` om de opgeslagen lijst te behouden, maar automatisch spraakvolgen te stoppen.
- Wanneer een gevolgde gebruiker deelneemt aan een toegestaan spraakkanaal, neemt OpenClaw deel aan dat kanaal. Wanneer de gebruiker verplaatst, verplaatst OpenClaw mee. Wanneer de actieve gevolgde gebruiker de verbinding verbreekt, vertrekt OpenClaw.
- Als meerdere gevolgde gebruikers zich in dezelfde guild bevinden en de actieve gevolgde gebruiker vertrekt, verplaatst OpenClaw naar het kanaal van een andere gevolgde gebruiker voordat het de guild verlaat. Als meerdere gevolgde gebruikers tegelijk verplaatsen, wint het laatst waargenomen voice-state-event.
- `allowedChannels` blijft van toepassing. Een gevolgde gebruiker in een niet-toegestaan kanaal wordt genegeerd, en een sessie die eigendom is van follow verplaatst naar een andere gevolgde gebruiker of vertrekt.
- OpenClaw verzoent gemiste voice-state-events bij het opstarten en met een begrensd interval. Verzoening neemt samples van geconfigureerde guilds en beperkt REST-opzoekingen per run, dus zeer grote `followUsers`-lijsten kunnen meer dan één interval nodig hebben om te convergeren.
- Als Discord of een beheerder de bot verplaatst terwijl die een gebruiker volgt, bouwt OpenClaw de spraaksessie opnieuw op en behoudt follow-eigendom wanneer de bestemming is toegestaan. Als de bot buiten `allowedChannels` wordt verplaatst, vertrekt OpenClaw en neemt het opnieuw deel aan het geconfigureerde doel wanneer er een bestaat.
- DAVE-ontvangstherstel kan hetzelfde kanaal verlaten en opnieuw deelnemen na herhaalde decryptiefouten. Sessies die eigendom zijn van follow behouden hun follow-eigendom via dat herstelpad, zodat een latere verbreking van een gevolgde gebruiker nog steeds het kanaal verlaat.

Kies tussen de deelnamemodi:

- Gebruik `followUsers` voor persoonlijke of operatoropstellingen waarbij de bot automatisch in spraak moet zijn wanneer jij dat bent.
- Gebruik `autoJoin` voor bots in vaste ruimten die aanwezig moeten zijn, zelfs wanneer er geen gevolgde gebruiker in spraak is.
- Gebruik `/vc join` voor eenmalige deelnames of ruimten waar automatische spraakaanwezigheid onverwacht zou zijn.

Discord-spraakcodec:

- Spraakontvangstlogs tonen `discord voice: opus decoder: libopus-wasm`.
- Realtime afspelen codeert ruwe 48 kHz stereo-PCM naar Opus met hetzelfde gebundelde `libopus-wasm`-pakket voordat pakketten aan `@discordjs/voice` worden doorgegeven.
- Afspelen van bestanden en providerstreams transcodeert met ffmpeg naar ruwe 48 kHz stereo-PCM en gebruikt daarna `libopus-wasm` voor de Opus-pakketstream die naar Discord wordt verzonden.

STT plus TTS-pijplijn:

- Discord PCM-opname wordt geconverteerd naar een tijdelijk WAV-bestand.
- `tools.media.audio` handelt STT af, bijvoorbeeld `openai/gpt-4o-mini-transcribe`.
- Het transcript wordt via Discord-ingress en routering verzonden, terwijl de antwoord-LLM draait met een spraakuitvoerbeleid dat de agenttool `tts` verbergt en om geretourneerde tekst vraagt, omdat Discord voice eigenaar is van de uiteindelijke TTS-weergave.
- `voice.model`, wanneer ingesteld, overschrijft alleen de antwoord-LLM voor deze spraakkanaalbeurt.
- `voice.tts` wordt over `messages.tts` samengevoegd; providers die streaming ondersteunen voeden de speler direct, anders wordt het resulterende audiobestand afgespeeld in het kanaal waaraan is deelgenomen.

Voorbeeld van een standaard agent-proxy-spraakkanaalsessie:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.5",
        followUsersEnabled: true,
        followUsers: ["123456789012345678"],
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

Zonder `voice.agentSession`-blok krijgt elk spraakkanaal zijn eigen gerouteerde OpenClaw-sessie. Bijvoorbeeld: `/vc join channel:234567890123456789` praat met de sessie voor dat Discord-spraakkanaal. Het realtime model is alleen de spraak-frontend; inhoudelijke verzoeken worden doorgegeven aan de geconfigureerde OpenClaw-agent. Als het realtime model een definitief transcript produceert zonder de consult-tool aan te roepen, forceert OpenClaw de consult als fallback zodat de standaard nog steeds aanvoelt als praten met de agent.

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

Realtime bidi-voorbeeld:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
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
        model: "openai/gpt-5.5",
        agentSession: {
          mode: "target",
          target: "channel:123456789012345678",
        },
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

In `agent-proxy`-modus neemt de bot deel aan het geconfigureerde spraakkanaal, maar OpenClaw-agentbeurten gebruiken de normale gerouteerde sessie en agent van het doelkanaal. De realtime spraaksessie spreekt het geretourneerde resultaat terug in het spraakkanaal. De supervisoragent kan nog steeds normale berichttools gebruiken volgens het toolbeleid, inclusief het verzenden van een afzonderlijk Discord-bericht als dat de juiste actie is.

Terwijl een gedelegeerde OpenClaw-run actief is, worden nieuwe Discord-spraaktranscripten behandeld als live run-besturing voordat een andere agentbeurt wordt gestart. Zinnen zoals "status", "annuleer dat", "gebruik de kleinere oplossing" of "controleer ook de tests wanneer je klaar bent" worden geclassificeerd als status-, annulerings-, sturings- of vervolginput voor de actieve sessie. Status-, annulerings-, geaccepteerde sturings- en vervolguitkomsten worden teruggesproken in het spraakkanaal zodat de beller weet of OpenClaw het verzoek heeft afgehandeld.

Nuttige doelvormen:

- `target: "channel:123456789012345678"` routeert via een Discord-tekstkanaalsessie.
- `target: "123456789012345678"` wordt behandeld als een kanaaldoel.
- `target: "dm:123456789012345678"` of `target: "user:123456789012345678"` routeert via die direct-message-sessie.

OpenAI Realtime-voorbeeld met veel echo:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
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

Gebruik dit wanneer het model zijn eigen Discord-weergave via een open microfoon hoort, maar je het nog steeds wilt kunnen onderbreken door te spreken. OpenClaw voorkomt dat OpenAI automatisch onderbreekt op basis van ruwe invoeraudio, terwijl `bargeIn: true` ervoor zorgt dat Discord-gebeurtenissen voor het starten van een spreker en al actieve sprekeraudio actieve realtime antwoorden kunnen annuleren voordat de volgende vastgelegde beurt OpenAI bereikt. Zeer vroege barge-in-signalen met `audioEndMs` onder `minBargeInAudioEndMs` worden behandeld als waarschijnlijke echo/ruis en genegeerd, zodat het model niet bij het eerste weergaveframe wordt afgekapt.

Verwachte spraaklogs:

- Bij deelname: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- Bij realtime start: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- Bij sprekeraudio: `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...`, en `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- Bij overgeslagen verouderde spraak: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` of `reason=non-actionable-closing ...`
- Bij voltooiing van realtime antwoord: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- Bij stop/reset van afspelen: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- Bij realtime consult: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- Bij agentantwoord: `discord voice: agent turn answer ...`
- Bij in de wachtrij geplaatste exacte spraak: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`, gevolgd door `discord voice: realtime exact speech dequeued reason=player-idle ...`
- Bij barge-in-detectie: `discord voice: realtime barge-in detected source=speaker-start ...` of `discord voice: realtime barge-in detected source=active-speaker-audio ...`, gevolgd door `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- Bij realtime onderbreking: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`, gevolgd door ofwel `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` of `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- Bij genegeerde echo/ruis: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- Bij uitgeschakelde barge-in: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- Bij inactieve weergave: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

Lees de realtime spraaklogs als tijdlijn om afgekapt geluid te debuggen:

1. `realtime audio playback started` betekent dat Discord is begonnen met het afspelen van assistentaudio. De bridge begint vanaf dit punt uitvoerchunks van de assistent, Discord PCM-bytes, realtime providerbytes en gesynthetiseerde audioduur te tellen.
2. `realtime speaker turn opened` markeert dat een Discord-spreker actief wordt. Als afspelen al actief is en `bargeIn` is ingeschakeld, kan dit worden gevolgd door `barge-in detected source=speaker-start`.
3. `realtime input audio started` markeert het eerste daadwerkelijke audioframe dat voor die sprekerbeurt is ontvangen. `outputActive=true` of een niet-nul `outputAudioMs` hier betekent dat de microfoon invoer verzendt terwijl assistentweergave nog actief is.
4. `barge-in detected source=active-speaker-audio` betekent dat OpenClaw live sprekeraudio zag terwijl assistentweergave actief was. Dit is nuttig om een echte onderbreking te onderscheiden van een Discord-gebeurtenis voor het starten van een spreker zonder bruikbare audio.
5. `barge-in requested reason=...` betekent dat OpenClaw de realtime provider heeft gevraagd het actieve antwoord te annuleren of af te kappen. Het bevat `outputAudioMs`, `outputActive` en `playbackChunks`, zodat je kunt zien hoeveel assistentaudio daadwerkelijk was afgespeeld vóór de onderbreking.
6. `realtime audio playback stopped reason=...` is het lokale Discord-resetpunt voor afspelen. De reden zegt wie het afspelen stopte: `barge-in`, `player-idle`, `provider-clear-audio`, `forced-agent-consult`, `stream-close` of `session-close`.
7. `realtime speaker turn closed` vat de vastgelegde invoerbeurt samen. `chunks=0` of `hasAudio=false` betekent dat de sprekerbeurt werd geopend, maar dat er geen bruikbare audio de realtime bridge bereikte. `interruptedPlayback=true` betekent dat die invoerbeurt overlapte met assistentuitvoer en barge-in-logica activeerde.

Nuttige velden:

- `outputAudioMs`: assistentaudioduur die door de realtime provider is gegenereerd vóór de logregel.
- `audioMs`: assistentaudioduur die OpenClaw telde voordat het afspelen stopte.
- `elapsedMs`: kloktijd tussen het openen en sluiten van de afspeelstream of sprekerbeurt.
- `discordBytes`: 48 kHz stereo-PCM-bytes verzonden naar of ontvangen van Discord voice.
- `realtimeBytes`: PCM-bytes in providerformaat verzonden naar of ontvangen van de realtime provider.
- `playbackChunks`: assistentaudiochunks doorgestuurd naar Discord voor het actieve antwoord.
- `sinceLastAudioMs`: interval tussen het laatste vastgelegde sprekeraudioframe en het sluiten van de sprekerbeurt.

Veelvoorkomende patronen:

- Direct afkappen met `source=active-speaker-audio`, kleine `outputAudioMs` en dezelfde gebruiker in de buurt wijst meestal op speakerecho die de microfoon binnenkomt. Verhoog `voice.realtime.minBargeInAudioEndMs`, verlaag het speakervolume, gebruik een koptelefoon of stel `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` in.
- `source=speaker-start` gevolgd door `speaker turn closed ... hasAudio=false` betekent dat Discord een sprekerstart meldde, maar dat er geen audio OpenClaw bereikte. Dat kan een tijdelijke Discord-spraakgebeurtenis zijn, gedrag van een noisegate of een client die de microfoon kort activeert.
- `audio playback stopped reason=stream-close` zonder nabije barge-in of `provider-clear-audio` betekent dat de lokale Discord-afspeelstream onverwacht is beëindigd. Controleer de voorafgaande provider- en Discord-spelerlogs.
- `capture ignored during playback (barge-in disabled)` betekent dat OpenClaw bewust invoer heeft laten vallen terwijl assistentaudio actief was. Schakel `voice.realtime.bargeIn` in als je wilt dat spraak het afspelen onderbreekt.
- `barge-in ignored ... outputActive=false` betekent dat Discord of provider-VAD spraak meldde, maar dat OpenClaw geen actieve weergave had om te onderbreken. Dit zou audio niet moeten afkappen.

Referenties worden per component opgelost: LLM-routeauthenticatie voor `voice.model`, STT-authenticatie voor `tools.media.audio`, TTS-authenticatie voor `messages.tts`/`voice.tts`, en realtime providerauthenticatie voor `voice.realtime.providers` of de normale authenticatieconfiguratie van de provider.

### Spraakberichten

Discord-spraakberichten tonen een golfvormpreview en vereisen OGG/Opus-audio. OpenClaw genereert de golfvorm automatisch, maar heeft `ffmpeg` en `ffprobe` nodig op de Gateway-host om te inspecteren en te converteren.

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
    - herstart Gateway na het wijzigen van intents

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

  <Accordion title="Require mention is false maar wordt nog steeds geblokkeerd">
    Veelvoorkomende oorzaken:

    - `groupPolicy="allowlist"` zonder overeenkomende guild-/kanaal-allowlist
    - `requireMention` op de verkeerde plek geconfigureerd (moet onder `channels.discord.guilds` of de kanaalvermelding staan)
    - afzender geblokkeerd door guild-/kanaal-`users`-allowlist

  </Accordion>

  <Accordion title="Langlopende Discord-turns of dubbele antwoorden">

    Typische logs:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Knoppen voor de Discord Gateway-wachtrij:

    - enkel account: `channels.discord.eventQueue.listenerTimeout`
    - meerdere accounts: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - dit regelt alleen listenerwerk van de Discord Gateway, niet de levensduur van agent-turns

    Discord past geen kanaal-eigen timeout toe op agent-turns in de wachtrij. Berichtenlisteners dragen direct over, en Discord-runs in de wachtrij behouden de volgorde per sessie totdat de sessie-/tool-/runtimelevenscyclus het werk voltooit of afbreekt.

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

  <Accordion title="Timeoutwaarschuwingen bij Gateway-metadataopzoeking">
    OpenClaw haalt Discord-`/gateway/bot`-metadata op voordat er verbinding wordt gemaakt. Tijdelijke fouten vallen terug op de standaard-Gateway-URL van Discord en worden in logs beperkt in frequentie.

    Knoppen voor metadata-timeout:

    - enkel account: `channels.discord.gatewayInfoTimeoutMs`
    - meerdere accounts: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - env-fallback wanneer config niet is ingesteld: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - standaard: `30000` (30 seconden), max: `120000`

  </Accordion>

  <Accordion title="Gateway READY-timeouts herstarten">
    OpenClaw wacht tijdens het opstarten en na runtime-herverbindingen op het Discord Gateway-`READY`-event. Setups met meerdere accounts en gespreid opstarten kunnen een langer opstart-READY-venster nodig hebben dan de standaardwaarde.

    Knoppen voor READY-timeout:

    - opstarten, enkel account: `channels.discord.gatewayReadyTimeoutMs`
    - opstarten, meerdere accounts: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - opstart-env-fallback wanneer config niet is ingesteld: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - opstartstandaard: `15000` (15 seconden), max: `120000`
    - runtime, enkel account: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - runtime, meerdere accounts: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - runtime-env-fallback wanneer config niet is ingesteld: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - runtimestandaard: `30000` (30 seconden), max: `120000`

  </Accordion>

  <Accordion title="Mismatches in permissie-audit">
    Permissiecontroles van `channels status --probe` werken alleen voor numerieke kanaal-ID's.

    Als je slug-sleutels gebruikt, kan runtime-matching nog steeds werken, maar de probe kan permissies niet volledig verifiëren.

  </Accordion>

  <Accordion title="Problemen met DM en koppelen">

    - DM uitgeschakeld: `channels.discord.dm.enabled=false`
    - DM-beleid uitgeschakeld: `channels.discord.dmPolicy="disabled"` (legacy: `channels.discord.dm.policy`)
    - wacht op koppelingsgoedkeuring in `pairing`-modus

  </Accordion>

  <Accordion title="Bot-naar-bot-loops">
    Standaard worden door bots geschreven berichten genegeerd.

    Als je `channels.discord.allowBots=true` instelt, gebruik dan strikte regels voor vermeldingen en allowlists om loopgedrag te voorkomen.
    Geef de voorkeur aan `channels.discord.allowBots="mentions"` om alleen botberichten te accepteren die de bot vermelden.

    OpenClaw levert ook gedeelde [bot-loopbescherming](/nl/channels/bot-loop-protection). Wanneer `allowBots` door bots geschreven berichten de dispatch laat bereiken, mapt Discord het inkomende event naar `(account, channel, bot pair)`-feiten en onderdrukt de generieke pair-guard het paar nadat het het geconfigureerde eventbudget overschrijdt. De guard voorkomt onbeheersbare loops tussen twee bots die eerder door Discord-rate limits moesten worden gestopt; dit heeft geen invloed op implementaties met één bot of eenmalige botantwoorden die onder het budget blijven.

    Standaardinstellingen (actief wanneer `allowBots` is ingesteld):

    - `maxEventsPerWindow: 20` -- botpaar kan 20 berichten uitwisselen binnen het schuivende venster
    - `windowSeconds: 60` -- lengte van het schuivende venster
    - `cooldownSeconds: 60` -- zodra het budget wordt overschreden, wordt elk extra bot-naar-bot-bericht in beide richtingen één minuut lang gedropt

    Configureer de gedeelde standaardwaarde eenmaal onder `channels.defaults.botLoopProtection` en overschrijf daarna Discord wanneer een legitieme workflow meer speelruimte nodig heeft. De prioriteit is:

    - `channels.discord.accounts.<account>.botLoopProtection`
    - `channels.discord.botLoopProtection`
    - `channels.defaults.botLoopProtection`
    - ingebouwde standaardwaarden

    Discord gebruikt de generieke sleutels `maxEventsPerWindow`, `windowSeconds` en `cooldownSeconds`.

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
      // Optional Discord-wide override. Account blocks override individual
      // fields and inherit omitted fields from here.
      botLoopProtection: {
        maxEventsPerWindow: 4,
      },
      accounts: {
        mantis: {
          // Mantis listens to other bots only when they mention her.
          allowBots: "mentions",
        },
        molty: {
          // Molty listens to all bot-authored Discord messages.
          allowBots: true,
          mentionAliases: {
            // Lets Molty write a Mantis Discord mention with the configured user id.
            Mantis: "MANTIS_DISCORD_USER_ID",
          },
          botLoopProtection: {
            // Allow up to five messages per minute before suppressing the pair.
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

  <Accordion title="Voice STT valt weg met DecryptionFailed(...)">

    - houd OpenClaw actueel (`openclaw update`) zodat de herstel-logica voor Discord-spraakontvangst aanwezig is
    - bevestig `channels.discord.voice.daveEncryption=true` (standaard)
    - begin met `channels.discord.voice.decryptionFailureTolerance=24` (upstream-standaard) en stem alleen af als dat nodig is
    - bekijk logs voor:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - als fouten na automatische herdeelname doorgaan, verzamel logs en vergelijk met de upstream DAVE-ontvangstgeschiedenis in [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) en [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

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
- streaming: `streaming` (legacy-alias: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- media/opnieuw proberen: `mediaMaxMb` (beperkt uitgaande Discord-uploads, standaard `100MB`), `retry`
- acties: `actions.*`
- aanwezigheid: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- functies: `threadBindings`, top-level `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents.enabled`, `agentComponents.ttlMs`, `heartbeat`, `responsePrefix`

</Accordion>

## Veiligheid en beheer

- Behandel bottokens als geheimen (`DISCORD_BOT_TOKEN` heeft de voorkeur in beheerde omgevingen).
- Verleen Discord-permissies volgens het principe van minimale rechten.
- Als commandodeploy/-status verouderd is, herstart dan Gateway en controleer opnieuw met `openclaw channels status --probe`.

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
    Map guilds en kanalen naar agents.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/nl/tools/slash-commands">
    Native commandogedrag.
  </Card>
</CardGroup>
