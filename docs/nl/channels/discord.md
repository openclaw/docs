---
read_when:
    - Werken aan Discord-kanaalfuncties
summary: Ondersteuningsstatus, mogelijkheden en configuratie van de Discord-bot
title: Discord
x-i18n:
    generated_at: "2026-06-27T17:09:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 90ed02258347113ca5b1dfcc5169a48190e3b4e1273d27a8a5c45f0f930cdbbf
    source_path: channels/discord.md
    workflow: 16
---

Klaar voor DM's en guild-kanalen via de officiële Discord-gateway.

<CardGroup cols={3}>
  <Card title="Koppelen" icon="link" href="/nl/channels/pairing">
    Discord-DM's gebruiken standaard de koppelmodus.
  </Card>
  <Card title="Slash-opdrachten" icon="terminal" href="/nl/tools/slash-commands">
    Native opdrachtgedrag en opdrachtencatalogus.
  </Card>
  <Card title="Problemen met kanalen oplossen" icon="wrench" href="/nl/channels/troubleshooting">
    Kanaaloverstijgende diagnose en reparatiestroom.
  </Card>
</CardGroup>

## Snelle installatie

Je moet een nieuwe applicatie met een bot maken, de bot aan je server toevoegen en deze aan OpenClaw koppelen. We raden aan je bot aan je eigen privéserver toe te voegen. Als je er nog geen hebt, [maak er dan eerst een](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (kies **Create My Own > For me and my friends**).

<Steps>
  <Step title="Maak een Discord-applicatie en bot">
    Ga naar de [Discord Developer Portal](https://discord.com/developers/applications) en klik op **New Application**. Geef deze een naam zoals "OpenClaw".

    Klik op **Bot** in de zijbalk. Stel de **Username** in op hoe je je OpenClaw-agent wilt noemen.

  </Step>

  <Step title="Schakel privileged intents in">
    Blijf op de pagina **Bot**, scrol omlaag naar **Privileged Gateway Intents** en schakel in:

    - **Message Content Intent** (vereist)
    - **Server Members Intent** (aanbevolen; vereist voor rol-allowlists en naam-naar-ID-koppeling)
    - **Presence Intent** (optioneel; alleen nodig voor aanwezigheidsupdates)

  </Step>

  <Step title="Kopieer je bottoken">
    Scrol terug omhoog op de pagina **Bot** en klik op **Reset Token**.

    <Note>
    Ondanks de naam genereert dit je eerste token — er wordt niets "gereset".
    </Note>

    Kopieer het token en bewaar het ergens. Dit is je **Bot Token** en je hebt het zo meteen nodig.

  </Step>

  <Step title="Genereer een uitnodigings-URL en voeg de bot toe aan je server">
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

    Dit is de basisset voor normale tekstkanalen. Als je van plan bent in Discord-threads te posten, inclusief workflows voor forum- of mediakanalen die een thread maken of voortzetten, schakel dan ook **Send Messages in Threads** in.
    Kopieer de gegenereerde URL onderaan, plak deze in je browser, selecteer je server en klik op **Continue** om verbinding te maken. Je zou je bot nu in de Discord-server moeten zien.

  </Step>

  <Step title="Schakel Developer Mode in en verzamel je ID's">
    Terug in de Discord-app moet je Developer Mode inschakelen zodat je interne ID's kunt kopiëren.

    1. Klik op **User Settings** (tandwielpictogram naast je avatar) → **Advanced** → schakel **Developer Mode** in
    2. Klik met de rechtermuisknop op je **serverpictogram** in de zijbalk → **Copy Server ID**
    3. Klik met de rechtermuisknop op je **eigen avatar** → **Copy User ID**

    Bewaar je **Server ID** en **User ID** samen met je Bot Token — je stuurt ze alle drie naar OpenClaw in de volgende stap.

  </Step>

  <Step title="Sta DM's van serverleden toe">
    Om koppelen te laten werken, moet Discord toestaan dat je bot je een DM stuurt. Klik met de rechtermuisknop op je **serverpictogram** → **Privacy Settings** → schakel **Direct Messages** in.

    Hierdoor kunnen serverleden (inclusief bots) je DM's sturen. Houd dit ingeschakeld als je Discord-DM's met OpenClaw wilt gebruiken. Als je alleen guild-kanalen wilt gebruiken, kun je DM's na het koppelen uitschakelen.

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

    Als OpenClaw al als achtergrondservice draait, herstart je het via de OpenClaw Mac-app of door het proces `openclaw gateway run` te stoppen en opnieuw te starten.
    Voor installaties als beheerde service voer je `openclaw gateway install` uit vanuit een shell waarin `DISCORD_BOT_TOKEN` aanwezig is, of sla je de variabele op in `~/.openclaw/.env`, zodat de service de env SecretRef na herstart kan oplossen.
    Als je host wordt geblokkeerd of geratelimiteerd door Discord's applicatiezoekopdracht bij het opstarten, stel dan de Discord-applicatie-/client-ID uit de Developer Portal in zodat het opstarten die REST-call kan overslaan. Gebruik `channels.discord.applicationId` voor het standaardaccount, of `channels.discord.accounts.<accountId>.applicationId` wanneer je meerdere Discord-bots gebruikt.

  </Step>

  <Step title="Configureer OpenClaw en koppel">

    <Tabs>
      <Tab title="Vraag het je agent">
        Chat met je OpenClaw-agent op een bestaand kanaal (bijv. Telegram) en vertel het hem. Als Discord je eerste kanaal is, gebruik dan in plaats daarvan de CLI- / config-tab.

        > "Ik heb mijn Discord-bottoken al ingesteld in de configuratie. Rond de Discord-installatie af met User ID `<user_id>` en Server ID `<server_id>`."
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

        Env-terugval voor het standaardaccount:

```bash
DISCORD_BOT_TOKEN=...
```

        Voor gescripte of externe installatie schrijf je hetzelfde JSON5-blok met `openclaw config patch --file ./discord.patch.json5 --dry-run` en voer je het daarna opnieuw uit zonder `--dry-run`. Platte-tekstwaarden voor `token` worden ondersteund. SecretRef-waarden worden ook ondersteund voor `channels.discord.token` via env-/file-/exec-providers. Zie [Geheimenbeheer](/nl/gateway/secrets).

        Voor meerdere Discord-bots houd je elk bottoken en elke applicatie-ID onder het eigen account. Een top-level `channels.discord.applicationId` wordt door accounts geërfd, dus stel deze daar alleen in wanneer elk account dezelfde applicatie-ID moet gebruiken.

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
    Wacht tot de Gateway draait en stuur je bot dan een DM in Discord. Deze reageert met een koppelcode.

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
Tokenresolutie is accountbewust. Configuratietokenwaarden winnen van env-terugval. `DISCORD_BOT_TOKEN` wordt alleen gebruikt voor het standaardaccount.
Als twee ingeschakelde Discord-accounts naar hetzelfde bottoken verwijzen, start OpenClaw slechts één Gateway-monitor voor dat token. Een token uit de configuratie wint van de standaard-env-terugval; anders wint het eerste ingeschakelde account en wordt het dubbele account als uitgeschakeld gerapporteerd.
Voor geavanceerde uitgaande calls (berichttool-/kanaalacties) wordt een expliciet per-call `token` gebruikt voor die call. Dit geldt voor verzend- en lees-/probe-achtige acties (bijvoorbeeld read/search/fetch/thread/pins/permissions). Accountbeleid en retry-instellingen komen nog steeds uit het geselecteerde account in de actieve runtime-snapshot.
</Note>

## Aanbevolen: stel een guild-werkruimte in

Zodra DM's werken, kun je je Discord-server instellen als een volledige werkruimte waarin elk kanaal zijn eigen agentsessie met eigen context krijgt. Dit wordt aanbevolen voor privéservers waar alleen jij en je bot aanwezig zijn.

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
    Standaard reageert je agent in guild-kanalen alleen wanneer hij wordt @vermeld. Voor een privéserver wil je waarschijnlijk dat hij op elk bericht reageert.

    In guild-kanalen worden normale antwoorden standaard automatisch geplaatst. Voor gedeelde altijd-actieve ruimtes kies je `messages.groupChat.visibleReplies: "message_tool"` zodat de agent kan meelezen en alleen post wanneer hij beslist dat een kanaalantwoord nuttig is. Dit werkt het best met modellen van de nieuwste generatie die betrouwbaar met tools omgaan, zoals GPT 5.5. Omgevingsgebeurtenissen in ruimtes blijven stil tenzij de tool verzendt. Zie [Omgevingsgebeurtenissen in ruimtes](/nl/channels/ambient-room-events) voor de volledige lurk-modusconfiguratie.

    Als Discord typen toont en de logs tokengebruik tonen maar er geen bericht wordt geplaatst, controleer dan of de beurt is geconfigureerd als omgevingsgebeurtenis in een ruimte of is ingesteld op zichtbare antwoorden via message-tool.

    <Tabs>
      <Tab title="Vraag het je agent">
        > "Sta mijn agent toe op deze server te reageren zonder @vermeld te hoeven worden"
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

        Om message-tool-verzendingen te vereisen voor zichtbare groeps-/kanaalantwoorden, stel je `messages.groupChat.visibleReplies: "message_tool"` in.

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
        Als je gedeelde context in elk kanaal nodig hebt, zet de stabiele instructies dan in `AGENTS.md` of `USER.md` (ze worden voor elke sessie geïnjecteerd). Bewaar langetermijnnotities in `MEMORY.md` en raadpleeg ze op aanvraag met geheugentools.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Maak nu enkele kanalen op je Discord-server en begin met chatten. Je agent kan de kanaalnaam zien en elk kanaal krijgt zijn eigen geïsoleerde sessie — zodat je `#coding`, `#home`, `#research` of wat dan ook bij je workflow past kunt instellen.

## Runtimemodel

- Gateway beheert de Discord-verbinding.
- Antwoordroutering is deterministisch: inkomende Discord-antwoorden gaan terug naar Discord.
- Metadata van Discord-guilds/kanalen wordt toegevoegd aan de modelprompt als niet-vertrouwde
  context, niet als een voor gebruikers zichtbaar antwoordvoorvoegsel. Als een model die envelop
  terugkopieert, verwijdert OpenClaw de gekopieerde metadata uit uitgaande antwoorden en uit
  toekomstige replay-context.
- Standaard (`session.dmScope=main`) delen directe chats de hoofdsessie van de agent (`agent:main:main`).
- Guild-kanalen zijn geïsoleerde sessiesleutels (`agent:<agentId>:discord:channel:<channelId>`).
- Groeps-DM's worden standaard genegeerd (`channels.discord.dm.groupEnabled=false`).
- Native slash-commando's draaien in geïsoleerde commandosessies (`agent:<agentId>:discord:slash:<userId>`), terwijl ze nog steeds `CommandTargetSessionKey` meenemen naar de gerouteerde conversatiesessie.
- Tekst-only cron/heartbeat-aankondigingslevering aan Discord gebruikt het uiteindelijke
  voor de assistent zichtbare antwoord één keer. Media en gestructureerde component-payloads blijven
  uit meerdere berichten bestaan wanneer de agent meerdere leverbare payloads uitzendt.

## Forumkanalen

Discord-forum- en mediakanalen accepteren alleen threadberichten. OpenClaw ondersteunt twee manieren om ze te maken:

- Stuur een bericht naar de forumparent (`channel:<forumId>`) om automatisch een thread te maken. De threadtitel gebruikt de eerste niet-lege regel van je bericht.
- Gebruik `openclaw message thread create` om direct een thread te maken. Geef geen `--message-id` door voor forumkanalen.

Voorbeeld: stuur naar forumparent om een thread te maken

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

OpenClaw ondersteunt Discord components v2-containers voor agentberichten. Gebruik de berichttool met een `components`-payload. Interactieresultaten worden teruggerouteerd naar de agent als normale inkomende berichten en volgen de bestaande Discord-instellingen voor `replyToMode`.

Ondersteunde blokken:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Actierijen staan maximaal 5 knoppen of één selectiemenu toe
- Selectietypen: `string`, `user`, `role`, `mentionable`, `channel`

Standaard zijn componenten voor eenmalig gebruik. Stel `components.reusable=true` in om knoppen, selecties en formulieren meerdere keren te laten gebruiken totdat ze verlopen.

Om te beperken wie op een knop kan klikken, stel je `allowedUsers` in op die knop (Discord-gebruikers-ID's, tags of `*`). Wanneer dit is geconfigureerd, ontvangen niet-overeenkomende gebruikers een tijdelijke weigering.

Component-callbacks verlopen standaard na 30 minuten. Stel `channels.discord.agentComponents.ttlMs` in om die callback-registerlevensduur te wijzigen voor het standaard Discord-account, of `channels.discord.accounts.<accountId>.agentComponents.ttlMs` om één account in een multi-accountconfiguratie te overschrijven. De waarde is in milliseconden, moet een positief geheel getal zijn en is gemaximeerd op `86400000` (24 uur). Langere TTL's zijn nuttig voor review- of goedkeuringsworkflows waarbij knoppen bruikbaar moeten blijven, maar ze verlengen ook het venster waarin een oud Discord-bericht nog steeds een actie kan triggeren. Geef de voorkeur aan de kortste TTL die bij de workflow past, en behoud de standaardwaarde wanneer verouderde callbacks verrassend zouden zijn.

De slash-commando's `/model` en `/models` openen een interactieve modelkiezer met dropdowns voor provider, model en compatibele runtime plus een stap Verzenden. `/models add` is verouderd en retourneert nu een verouderingsbericht in plaats van modellen vanuit chat te registreren. Het antwoord van de kiezer is tijdelijk en alleen de aanroepende gebruiker kan het gebruiken. Discord-selectiemenu's zijn beperkt tot 25 opties, dus voeg `provider/*`-vermeldingen toe aan `agents.defaults.models` wanneer je wilt dat de kiezer dynamisch ontdekte modellen alleen toont voor geselecteerde providers zoals `openai` of `vllm`.

Bestandsbijlagen:

- `file`-blokken moeten verwijzen naar een bijlagereferentie (`attachment://<filename>`)
- Lever de bijlage via `media`/`path`/`filePath` (één bestand); gebruik `media-gallery` voor meerdere bestanden
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

    Als DM-beleid niet open is, worden onbekende gebruikers geblokkeerd (of gevraagd om te koppelen in `pairing`-modus).

    Voorrang bij meerdere accounts:

    - `channels.discord.accounts.default.allowFrom` geldt alleen voor het `default`-account.
    - Voor één account heeft `allowFrom` voorrang op legacy `dm.allowFrom`.
    - Benoemde accounts erven `channels.discord.allowFrom` wanneer hun eigen `allowFrom` en legacy `dm.allowFrom` niet zijn ingesteld.
    - Benoemde accounts erven `channels.discord.accounts.default.allowFrom` niet.

    Legacy `channels.discord.dm.policy` en `channels.discord.dm.allowFrom` worden nog steeds gelezen voor compatibiliteit. `openclaw doctor --fix` migreert ze naar `dmPolicy` en `allowFrom` wanneer dat kan zonder toegang te wijzigen.

    DM-doelindeling voor levering:

    - `user:<id>`
    - `<@id>`-vermelding

    Kale numerieke ID's worden normaal gesproken als kanaal-ID's opgelost wanneer een kanaalstandaard actief is, maar ID's die in de effectieve DM-`allowFrom` van het account staan, worden voor compatibiliteit behandeld als gebruikers-DM-doelen.

  </Tab>

  <Tab title="Toegangsgroepen">
    Autorisatie voor Discord-DM's en tekstcommando's kan dynamische `accessGroup:<name>`-vermeldingen gebruiken in `channels.discord.allowFrom`.

    Namen van toegangsgroepen worden gedeeld tussen berichtkanalen. Gebruik `type: "message.senders"` voor een statische groep waarvan de leden worden uitgedrukt in de normale `allowFrom`-syntaxis van elk kanaal, of `type: "discord.channelAudience"` wanneer de huidige `ViewChannel`-doelgroep van een Discord-kanaal het lidmaatschap dynamisch moet bepalen. Gedeeld gedrag van toegangsgroepen is hier gedocumenteerd: [Toegangsgroepen](/nl/channels/access-groups).

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

    Een Discord-tekstkanaal heeft geen afzonderlijke ledenlijst. `type: "discord.channelAudience"` modelleert lidmaatschap als: de DM-afzender is lid van de geconfigureerde guild en heeft momenteel effectieve `ViewChannel`-machtiging op het geconfigureerde kanaal nadat rol- en kanaaloverschrijvingen zijn toegepast.

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

    Lookups falen gesloten. Als Discord `Missing Access` retourneert, de ledenlookup mislukt, of het kanaal bij een andere guild hoort, wordt de DM-afzender behandeld als niet-geautoriseerd.

    Schakel in de Discord Developer Portal **Server Members Intent** in voor de bot wanneer je toegangsgroepen op basis van kanaaldoelgroep gebruikt. DM's bevatten geen guild-lidstatus, dus OpenClaw lost het lid op via Discord REST op het moment van autorisatie.

  </Tab>

  <Tab title="Guild-beleid">
    Guild-afhandeling wordt beheerd door `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    De veilige basisinstelling wanneer `channels.discord` bestaat is `allowlist`.

    `allowlist`-gedrag:

    - guild moet overeenkomen met `channels.discord.guilds` (`id` aanbevolen, slug geaccepteerd)
    - optionele allowlists voor afzenders: `users` (stabiele ID's aanbevolen) en `roles` (alleen rol-ID's); als een van beide is geconfigureerd, zijn afzenders toegestaan wanneer ze overeenkomen met `users` OF `roles`
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
    Guild-berichten zijn standaard door vermeldingen afgeschermd.

    Vermeldingsdetectie omvat:

    - expliciete botvermelding
    - geconfigureerde vermeldingspatronen (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - impliciet antwoord-op-bot-gedrag in ondersteunde gevallen

    Gebruik bij het schrijven van uitgaande Discord-berichten de canonieke vermeldingssyntaxis: `<@USER_ID>` voor gebruikers, `<#CHANNEL_ID>` voor kanalen en `<@&ROLE_ID>` voor rollen. Gebruik niet de legacy `<@!USER_ID>`-nicknamevermeldingsvorm.

    `requireMention` wordt per guild/kanaal geconfigureerd (`channels.discord.guilds...`).
    `ignoreOtherMentions` laat optioneel berichten vallen die een andere gebruiker/rol vermelden maar niet de bot (met uitzondering van @everyone/@here).

    Groeps-DM's:

    - standaard: genegeerd (`dm.groupEnabled=false`)
    - optionele allowlist via `dm.groupChannels` (kanaal-ID's of slugs)

  </Tab>
</Tabs>

### Rolgebaseerde agentroutering

Gebruik `bindings[].match.roles` om Discord-gildeleden op basis van rol-ID naar verschillende agents te routeren. Rolgebaseerde bindings accepteren alleen rol-ID's en worden geëvalueerd na peer- of parent-peer-bindings en vóór bindings voor alleen gildes. Als een binding ook andere matchvelden instelt (bijvoorbeeld `peer` + `guildId` + `roles`), moeten alle geconfigureerde velden overeenkomen.

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
- Authenticatie voor native opdrachten gebruikt dezelfde Discord-allowlists/beleidsregels als normale berichtafhandeling.
- Opdrachten kunnen nog steeds zichtbaar zijn in de Discord-UI voor gebruikers die niet geautoriseerd zijn; uitvoering handhaaft nog steeds OpenClaw-authenticatie en retourneert "niet geautoriseerd".

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
    `batched` koppelt de impliciete native antwoordreferentie van Discord alleen wanneer de
    inkomende gebeurtenis een gedebouncete batch van meerdere berichten was. Dit is nuttig
    wanneer je native antwoorden vooral wilt voor dubbelzinnige, drukke chats, niet voor elke
    beurt met één enkel bericht.

    Bericht-ID's worden in context/geschiedenis beschikbaar gemaakt zodat agents specifieke berichten kunnen targeten.

  </Accordion>

  <Accordion title="Linkvoorvertoningen">
    Discord genereert standaard rijke link-embeds voor URL's. OpenClaw onderdrukt die gegenereerde embeds standaard op uitgaande Discord-berichten, zodat door agents verzonden URL's gewone links blijven tenzij je je aanmeldt:

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    Stel `channels.discord.accounts.<id>.suppressEmbeds` in om één account te overschrijven. Verzendingen via de berichttool van agents kunnen ook `suppressEmbeds: false` doorgeven voor één bericht. Expliciete Discord-`embeds`-payloads worden niet onderdrukt door de standaardinstelling voor linkvoorvertoningen.

  </Accordion>

  <Accordion title="Voorvertoning van livestream">
    OpenClaw kan conceptantwoorden streamen door een tijdelijk bericht te verzenden en het te bewerken terwijl tekst binnenkomt. `channels.discord.streaming` accepteert `off` | `partial` | `block` | `progress` (standaard). `progress` houdt één bewerkbaar statusconcept bij en werkt dit bij met toolvoortgang tot de uiteindelijke levering; het gedeelde startlabel is een doorlopende regel, zodat die net als de rest uit beeld schuift zodra er genoeg werk verschijnt. `streamMode` is een verouderde runtime-alias. Voer `openclaw doctor --fix` uit om persistente configuratie naar de canonieke sleutel te herschrijven.

    Stel `channels.discord.streaming.mode` in op `off` om Discord-voorvertoningsbewerkingen uit te schakelen. Als Discord-blockstreaming expliciet is ingeschakeld, slaat OpenClaw de voorvertoningsstream over om dubbel streamen te voorkomen.

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

    - `partial` bewerkt één voorvertoningsbericht terwijl tokens binnenkomen.
    - `block` zendt conceptgrote chunks uit (gebruik `draftChunk` om grootte en breekpunten af te stemmen, begrensd op `textChunkLimit`).
    - Media, fouten en finales met expliciet antwoord annuleren wachtende voorvertoningsbewerkingen.
    - `streaming.preview.toolProgress` (standaard `true`) bepaalt of tool-/voortgangsupdates het voorvertoningsbericht hergebruiken.
    - Tool-/voortgangsrijen worden weergegeven als compacte emoji + titel + detail wanneer beschikbaar, bijvoorbeeld `🛠️ Bash: run tests` of `🔎 Web Search: for "query"`.
    - `streaming.progress.commentary` (standaard `false`) meldt zich aan voor assistentcommentaar-/preambuletekst in het tijdelijke voortgangsconcept. Commentaar wordt vóór weergave opgeschoond, blijft tijdelijk en wijzigt de levering van het definitieve antwoord niet.
    - `streaming.progress.maxLineChars` beheert het budget voor voortgangsvoorvertoning per regel. Proza wordt op woordgrenzen ingekort; opdracht- en paddetails behouden nuttige achtervoegsels.
    - `streaming.preview.commandText` / `streaming.progress.commandText` beheert opdracht-/execdetails in compacte voortgangsregels: `raw` (standaard) of `status` (alleen toollabel).

    Verberg ruwe opdracht-/exectekst terwijl compacte voortgangsregels behouden blijven:

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

    Voorvertoningsstreaming is alleen tekst; media-antwoorden vallen terug op normale levering. Wanneer `block`-streaming expliciet is ingeschakeld, slaat OpenClaw de voorvertoningsstream over om dubbel streamen te voorkomen.

  </Accordion>

  <Accordion title="Geschiedenis, context en threadgedrag">
    Context voor gildegeschiedenis:

    - `channels.discord.historyLimit` standaard `20`
    - fallback: `messages.groupChat.historyLimit`
    - `0` schakelt uit

    Besturing voor DM-geschiedenis:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Threadgedrag:

    - Discord-threads routeren als kanaalsessies en erven de configuratie van het bovenliggende kanaal tenzij overschreven.
    - Threadsessies erven de sessieniveau-`/model`-selectie van het bovenliggende kanaal als fallback voor alleen het model; threadlokale `/model`-selecties hebben nog steeds voorrang en transcriptgeschiedenis van het bovenliggende kanaal wordt niet gekopieerd tenzij transcriptovererving is ingeschakeld.
    - `channels.discord.thread.inheritParent` (standaard `false`) meldt nieuwe auto-threads aan voor initiële vulling vanuit het bovenliggende transcript. Overschrijvingen per account staan onder `channels.discord.accounts.<id>.thread.inheritParent`.
    - Reacties via de berichttool kunnen `user:<id>`-DM-targets oplossen.
    - `guilds.<guild>.channels.<channel>.requireMention: false` wordt behouden tijdens reply-stage-activatiefallback.

    Kanaalonderwerpen worden als **niet-vertrouwde** context geïnjecteerd. Allowlists bepalen wie de agent kan activeren, niet een volledige redactierand voor aanvullende context.

  </Accordion>

  <Accordion title="Threadgebonden sessies voor subagents">
    Discord kan een thread aan een sessietarget binden, zodat vervolgberichten in die thread naar dezelfde sessie blijven routeren (inclusief subagentsessies).

    Opdrachten:

    - `/focus <target>` bind huidige/nieuwe thread aan een subagent-/sessietarget
    - `/unfocus` verwijder huidige threadbinding
    - `/agents` toon actieve runs en bindingsstatus
    - `/session idle <duration|off>` inspecteer/update automatische ontfocus bij inactiviteit voor gefocuste bindings
    - `/session max-age <duration|off>` inspecteer/update harde maximale leeftijd voor gefocuste bindings

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
    - `spawnSessions` beheert automatisch maken/binden van threads voor `sessions_spawn({ thread: true })` en ACP-threadspawns. Standaard: `true`.
    - `defaultSpawnContext` beheert native subagentcontext voor threadgebonden spawns. Standaard: `"fork"`.
    - Verouderde sleutels `spawnSubagentSessions`/`spawnAcpSessions` worden gemigreerd door `openclaw doctor --fix`.
    - Als threadbindings voor een account zijn uitgeschakeld, zijn `/focus` en gerelateerde threadbindingsbewerkingen niet beschikbaar.

    Zie [Subagents](/nl/tools/subagents), [ACP-agents](/nl/tools/acp-agents) en [Configuratiereferentie](/nl/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Persistente ACP-kanaalbindings">
    Configureer typed ACP-bindings op topniveau die Discord-gesprekken targeten voor stabiele "always-on" ACP-werkruimten.

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
    - In een gebonden kanaal of gebonden thread resetten `/new` en `/reset` dezelfde ACP-sessie op zijn plaats. Tijdelijke threadbindings kunnen targetresolutie overschrijven terwijl ze actief zijn.
    - `spawnSessions` bewaakt het maken/binden van child-threads via `--thread auto|here`.

    Zie [ACP-agents](/nl/tools/acp-agents) voor details over bindingsgedrag.

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
    `ackReaction` verzendt een bevestigingsemoji terwijl OpenClaw een inkomend bericht verwerkt.

    Oplossingsvolgorde:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - fallback naar agentidentiteitsemoji (`agents.list[].identity.emoji`, anders "👀")

    Opmerkingen:

    - Discord accepteert unicode-emoji of namen van aangepaste emoji.
    - Gebruik `""` om de reactie voor een kanaal of account uit te schakelen.

  </Accordion>

  <Accordion title="Configuratieschrijfbewerkingen">
    Door het kanaal geïnitieerde configuratieschrijfbewerkingen zijn standaard ingeschakeld.

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
    Routeer Discord-Gateway-WebSocket-verkeer en REST-lookups bij het opstarten (applicatie-ID + allowlist-resolutie) via een HTTP(S)-proxy met `channels.discord.proxy`.

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
    Schakel PluralKit-resolutie in om proxied berichten te koppelen aan de identiteit van systeemleden:

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // optioneel; nodig voor privésystemen
      },
    },
  },
}
```

    Opmerkingen:

    - allowlists kunnen `pk:<memberId>` gebruiken
    - weergavenamen van leden worden alleen op naam/slug gematcht wanneer `channels.discord.dangerouslyAllowNameMatching: true`
    - lookups gebruiken de oorspronkelijke bericht-ID en zijn beperkt tot een tijdvenster
    - als de lookup mislukt, worden proxied berichten behandeld als botberichten en geweigerd, tenzij `allowBots=true`

  </Accordion>

  <Accordion title="Aliasnamen voor uitgaande vermeldingen">
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
    Presence-updates worden toegepast wanneer je een status- of activiteitsveld instelt, of wanneer je automatische presence inschakelt.

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

    Kaart voor activiteitstypen:

    - 0: Spelen
    - 1: Streamen (vereist `activityUrl`)
    - 2: Luisteren
    - 3: Kijken
    - 4: Aangepast (gebruikt de activiteitstekst als de statusstatus; emoji is optioneel)
    - 5: Deelnemen

    Voorbeeld van automatische presence (runtime-gezondheidssignaal):

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

    Automatische presence koppelt runtime-beschikbaarheid aan Discord-status: gezond => online, verslechterd of onbekend => idle, uitgeput of niet beschikbaar => dnd. Optionele tekstoverschrijvingen:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (ondersteunt de placeholder `{reason}`)

  </Accordion>

  <Accordion title="Goedkeuringen in Discord">
    Discord ondersteunt goedkeuringsafhandeling via knoppen in DM's en kan optioneel goedkeuringsprompts plaatsen in het oorspronkelijke kanaal.

    Configuratiepad:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (optioneel; valt waar mogelijk terug op `commands.ownerAllowFrom`)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, standaard: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord schakelt native exec-goedkeuringen automatisch in wanneer `enabled` niet is ingesteld of `"auto"` is en ten minste één goedkeurder kan worden herleid, vanuit `execApprovals.approvers` of vanuit `commands.ownerAllowFrom`. Discord leidt exec-goedkeurders niet af uit kanaal-`allowFrom`, verouderde `dm.allowFrom` of direct-message `defaultTo`. Stel `enabled: false` in om Discord expliciet uit te schakelen als native goedkeuringsclient.

    Voor gevoelige owner-only groepsopdrachten zoals `/diagnostics` en `/export-trajectory` stuurt OpenClaw goedkeuringsprompts en eindresultaten privé. Het probeert eerst een Discord-DM wanneer de aanroepende owner een Discord-ownerrroute heeft; als die niet beschikbaar is, valt het terug op de eerste beschikbare ownerrroute uit `commands.ownerAllowFrom`, zoals Telegram.

    Wanneer `target` `channel` of `both` is, is de goedkeuringsprompt zichtbaar in het kanaal. Alleen herleide goedkeurders kunnen de knoppen gebruiken; andere gebruikers ontvangen een ephemeral weigering. Goedkeuringsprompts bevatten de opdrachttekst, dus schakel kanaalbezorging alleen in vertrouwde kanalen in. Als de kanaal-ID niet uit de sessiesleutel kan worden afgeleid, valt OpenClaw terug op DM-bezorging.

    Discord rendert ook de gedeelde goedkeuringsknoppen die door andere chatkanalen worden gebruikt. De native Discord-adapter voegt vooral DM-routering voor goedkeurders en kanaalfanout toe.
    Wanneer die knoppen aanwezig zijn, vormen ze de primaire goedkeurings-UX; OpenClaw
    mag alleen een handmatige `/approve`-opdracht opnemen wanneer het toolresultaat zegt
    dat chatgoedkeuringen niet beschikbaar zijn of dat handmatige goedkeuring de enige route is.
    Als de native goedkeuringsruntime van Discord niet actief is, houdt OpenClaw de
    lokale deterministische `/approve <id> <decision>`-prompt zichtbaar. Als de
    runtime actief is maar een native kaart niet aan een doel kan worden bezorgd,
    stuurt OpenClaw een fallbackmelding in dezelfde chat met de exacte `/approve`
    opdracht uit de openstaande goedkeuring.

    Gateway-authenticatie en goedkeuringsresolutie volgen het gedeelde Gateway-clientcontract (`plugin:`-ID's worden opgelost via `plugin.approval.resolve`; andere ID's via `exec.approval.resolve`). Goedkeuringen verlopen standaard na 30 minuten.

    Zie [Exec-goedkeuringen](/nl/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Tools en actiegates

Discord-berichtacties omvatten messaging-, kanaalbeheer-, moderatie-, presence- en metadata-acties.

Kernvoorbeelden:

- messaging: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- reacties: `react`, `reactions`, `emojiList`
- moderatie: `timeout`, `kick`, `ban`
- presence: `setPresence`

De actie `event-create` accepteert een optionele parameter `image` (URL of lokaal bestandspad) om de omslagafbeelding van de geplande gebeurtenis in te stellen.

Actiegates staan onder `channels.discord.actions.*`.

Standaardgate-gedrag:

| Actiegroep                                                                                                                                                              | Standaard     |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | ingeschakeld  |
| roles                                                                                                                                                                   | uitgeschakeld |
| moderation                                                                                                                                                              | uitgeschakeld |
| presence                                                                                                                                                                | uitgeschakeld |

## Components v2-UI

OpenClaw gebruikt Discord components v2 voor exec-goedkeuringen en cross-context-markeringen. Discord-berichtacties kunnen ook `components` accepteren voor aangepaste UI (geavanceerd; vereist het construeren van een componentpayload via de discord-tool), terwijl verouderde `embeds` beschikbaar blijven maar niet worden aanbevolen.

- `channels.discord.ui.components.accentColor` stelt de accentkleur in die door Discord-componentcontainers wordt gebruikt (hex).
- Stel per account in met `channels.discord.accounts.<id>.ui.components.accentColor`.
- `channels.discord.agentComponents.ttlMs` bepaalt hoelang verzonden Discord-componentcallbacks geregistreerd blijven (standaard `1800000`, maximum `86400000`). Stel per account in met `channels.discord.accounts.<id>.agentComponents.ttlMs`.
- `embeds` worden genegeerd wanneer components v2 aanwezig zijn.
- Voorvertoningen van platte URL's worden standaard onderdrukt. Stel `suppressEmbeds: false` in op een berichtactie wanneer één uitgaande link moet uitvouwen.

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

1. Schakel Message Content Intent in het Discord Developer Portal in.
2. Schakel Server Members Intent in wanneer rol-/gebruikersallowlists worden gebruikt.
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

Voer het volgende uit om de effectieve rechten van de bot te inspecteren voordat je deelneemt:

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
- `voice.mode` bepaalt het conversatiepad. De standaardwaarde is `agent-proxy`: een realtime spraakfrontend handelt beurt-timing, onderbreking en weergave af, delegeert inhoudelijk werk via `openclaw_agent_consult` aan de geroute OpenClaw-agent en behandelt het resultaat als een getypte Discord-prompt van die spreker. `stt-tts` behoudt de oudere batch-STT-plus-TTS-flow. Met `bidi` kan het realtime model direct converseren terwijl `openclaw_agent_consult` beschikbaar blijft voor het OpenClaw-brein.
- `voice.agentSession` bepaalt welke OpenClaw-conversatie spraakbeurten ontvangt. Laat dit leeg voor de eigen sessie van het spraakkanaal, of stel `{ mode: "target", target: "channel:<text-channel-id>" }` in om het spraakkanaal te laten fungeren als microfoon-/speakeruitbreiding van een bestaande Discord-tekstkanaalsessie, zoals `#maintainers`.
- `voice.model` overschrijft het OpenClaw-agentbrein voor Discord-spraakantwoorden en realtime consults. Laat dit leeg om het geroute agentmodel te erven. Dit staat los van `voice.realtime.model`.
- Met `voice.followUsers` kan de bot Discord-spraak joinen, verplaatsen en verlaten met geselecteerde gebruikers. Zie [Gebruikers volgen in spraak](#follow-users-in-voice) voor gedragsregels en voorbeelden.
- `agent-proxy` routeert spraak via `discord-voice`, wat normale eigenaar-/toolautorisatie behoudt voor de spreker en doelsessie, maar de agenttool `tts` verbergt omdat Discord-spraak de weergave beheert. Standaard geeft `agent-proxy` het consult volledige eigenaar-equivalente tooltoegang voor eigenaars die spreken (`voice.realtime.toolPolicy: "owner"`) en geeft het sterk de voorkeur aan consultatie van de OpenClaw-agent vóór inhoudelijke antwoorden (`voice.realtime.consultPolicy: "always"`). In die standaardmodus `always` spreekt de realtime-laag niet automatisch opvulling uit vóór het consultantwoord; de laag legt spraak vast en transcribeert die, en spreekt daarna het geroute OpenClaw-antwoord uit. Als meerdere geforceerde consultantwoorden klaar zijn terwijl Discord nog steeds het eerste antwoord afspeelt, worden latere exact-spraakantwoorden in de wachtrij gezet totdat de weergave inactief is, in plaats van spraak midden in een zin te vervangen.
- In de modus `stt-tts` gebruikt STT `tools.media.audio`; `voice.model` heeft geen invloed op transcriptie.
- In realtime-modi configureren `voice.realtime.provider`, `voice.realtime.model` en `voice.realtime.speakerVoice` de realtime audiosessie. Gebruik voor OpenAI Realtime 2 plus het Codex-brein `voice.realtime.model: "gpt-realtime-2"` en `voice.model: "openai/gpt-5.5"`.
- Realtime spraakmodi nemen standaard kleine profielbestanden `IDENTITY.md`, `USER.md` en `SOUL.md` op in de realtime providerinstructies, zodat snelle directe beurten dezelfde identiteit, gebruikerscontext en persona behouden als de geroute OpenClaw-agent. Stel `voice.realtime.bootstrapContextFiles` in op een subset om dit aan te passen, of op `[]` om het uit te schakelen. De ondersteunde realtime bootstrapbestanden zijn beperkt tot die profielbestanden; `AGENTS.md` blijft in de normale agentcontext. De geïnjecteerde profielcontext vervangt `openclaw_agent_consult` niet voor workspace-werk, actuele feiten, geheugenopzoekingen of tool-ondersteunde acties.
- Stel in OpenAI `agent-proxy` realtime-modus `voice.realtime.requireWakeName: true` in om Discord realtime spraak stil te houden totdat een transcript begint of eindigt met een weknaam. Geconfigureerde weknamen moeten uit één of twee woorden bestaan. Als `voice.realtime.wakeNames` niet is ingesteld, gebruikt OpenClaw de geroute agent `name` plus `OpenClaw`, met als fallback de agent-id plus `OpenClaw`. Weknaam-gating schakelt automatische reacties van de realtime provider uit, routeert geaccepteerde beurten via het consultpad van de OpenClaw-agent en geeft een korte gesproken bevestiging wanneer een leidende weknaam uit gedeeltelijke transcriptie wordt herkend voordat het definitieve transcript arriveert.
- De OpenAI realtime provider accepteert huidige Realtime 2-eventnamen en legacy Codex-compatibele aliassen voor uitvoeraudio- en transcriptevents, zodat compatibele provider-snapshots kunnen afwijken zonder assistentaudio te laten vallen.
- `voice.realtime.bargeIn` bepaalt of Discord speaker-start-events actieve realtime weergave onderbreken. Als dit niet is ingesteld, volgt het de input-audio-onderbrekingsinstelling van de realtime provider.
- `voice.realtime.minBargeInAudioEndMs` bepaalt de minimale duur van assistentweergave voordat een OpenAI realtime barge-in audio afkapt. Standaard: `250`. Stel `0` in voor onmiddellijke onderbreking in ruimtes met weinig echo, of verhoog dit voor speakeropstellingen met veel echo.
- Stel voor een OpenAI-stem bij Discord-weergave `voice.tts.provider: "openai"` in en kies een Text-to-speech-stem onder `voice.tts.providers.openai.speakerVoice`. `cedar` is een goede mannelijk klinkende keuze op het huidige OpenAI TTS-model.
- Per-kanaal Discord-overschrijvingen van `systemPrompt` gelden voor spraaktranscriptiebeurten voor dat spraakkanaal.
- Spraaktranscriptiebeurten leiden eigenaarstatus af uit Discord `allowFrom` (of `dm.allowFrom`) voor eigenaar-gated commando's en kanaalacties. Zichtbaarheid van agenttools volgt het geconfigureerde toolbeleid voor de geroute sessie.
- Discord-spraak is opt-in voor tekst-only configuraties; stel `channels.discord.voice.enabled=true` in (of behoud een bestaand `channels.discord.voice`-blok) om `/vc`-commando's, de spraakruntime en de Gateway-intent `GuildVoiceStates` in te schakelen.
- `channels.discord.intents.voiceStates` kan het abonnement op de voice-state-intent expliciet overschrijven. Laat dit leeg zodat de intent de effectieve spraakinschakeling volgt.
- Als `voice.autoJoin` meerdere vermeldingen voor dezelfde guild heeft, joint OpenClaw het laatst geconfigureerde kanaal voor die guild.
- `voice.allowedChannels` is een optionele allowlist voor residentie. Laat dit leeg om `/vc join` naar elk geautoriseerd Discord-spraakkanaal toe te staan. Wanneer dit is ingesteld, zijn `/vc join`, auto-join bij opstarten en bot voice-state-verplaatsingen beperkt tot de vermelde vermeldingen `{ guildId, channelId }`. Stel dit in op een lege array om alle Discord-spraakjoins te weigeren. Als Discord de bot buiten de allowlist verplaatst, verlaat OpenClaw dat kanaal en joint het geconfigureerde auto-join-doel opnieuw wanneer er een beschikbaar is.
- `voice.daveEncryption` en `voice.decryptionFailureTolerance` worden doorgegeven aan de join-opties van `@discordjs/voice`.
- De standaardwaarden van `@discordjs/voice` zijn `daveEncryption=true` en `decryptionFailureTolerance=24` als ze niet zijn ingesteld.
- OpenClaw gebruikt de gebundelde `libopus-wasm`-codec voor Discord-spraakontvangst en realtime raw PCM-weergave. Het levert een vastgepinde libopus WebAssembly-build mee en vereist geen native opus-add-ons.
- `voice.connectTimeoutMs` bepaalt de initiële Ready-wachttijd van `@discordjs/voice` voor `/vc join`- en auto-join-pogingen. Standaard: `30000`.
- `voice.reconnectGraceMs` bepaalt hoelang OpenClaw wacht totdat een verbroken spraaksessie begint met opnieuw verbinden voordat die wordt vernietigd. Standaard: `15000`.
- In de modus `stt-tts` stopt spraakweergave niet alleen omdat een andere gebruiker begint te spreken. Om feedbacklussen te vermijden, negeert OpenClaw nieuwe spraakopname terwijl TTS afspeelt; spreek nadat de weergave is voltooid voor de volgende beurt. Realtime-modi sturen spreker-starts door als barge-in-signalen naar de realtime provider.
- In realtime-modi kan echo van speakers naar een open microfoon lijken op barge-in en de weergave onderbreken. Stel voor Discord-ruimtes met veel echo `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` in om te voorkomen dat OpenAI automatisch onderbreekt op input-audio. Voeg `voice.realtime.bargeIn: true` toe als je nog steeds wilt dat Discord speaker-start-events actieve weergave onderbreken. De OpenAI realtime bridge negeert weergave-afkappingen korter dan `voice.realtime.minBargeInAudioEndMs` als waarschijnlijke echo/ruis en logt ze als overgeslagen in plaats van Discord-weergave te wissen.
- `voice.captureSilenceGraceMs` bepaalt hoelang OpenClaw wacht nadat Discord meldt dat een spreker is gestopt voordat dat audiosegment voor STT wordt afgerond. Standaard: `2000`; verhoog dit als Discord normale pauzes splitst in hakkerige gedeeltelijke transcripties.
- Wanneer ElevenLabs de geselecteerde TTS-provider is, gebruikt Discord-spraakweergave streaming TTS en start het vanuit de provider-responsstream. Providers zonder streamingondersteuning vallen terug op het gesynthetiseerde tijdelijke-bestandspad.
- OpenClaw bewaakt ook decryptiefouten bij ontvangst en herstelt automatisch door het spraakkanaal te verlaten en opnieuw te joinen na herhaalde fouten binnen een kort venster.
- Als ontvangslogs na een update herhaaldelijk `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` tonen, verzamel dan een dependencyrapport en logs. De gebundelde `@discordjs/voice`-lijn bevat de upstream padding-fix uit discord.js PR #11449, die discord.js-issue #11419 heeft gesloten.
- Ontvangstevents `The operation was aborted` worden verwacht wanneer OpenClaw een vastgelegd sprekersegment afrondt; dit zijn uitgebreide diagnostische meldingen, geen waarschuwingen.
- Uitgebreide Discord-spraaklogs bevatten een begrensde STT-transcriptpreview van één regel voor elk geaccepteerd sprekersegment, zodat debugging zowel de gebruikerskant als de agentantwoordkant toont zonder onbeperkte transcripttekst te dumpen.
- In de modus `agent-proxy` slaat geforceerde consultfallback waarschijnlijk onvolledige transcriptfragmenten over, zoals tekst die eindigt op `...` of een afsluitende connector zoals `and`, plus duidelijk niet-actiegerichte afsluitingen zoals “be right back” of “bye”. Logs tonen `forced agent consult skipped reason=...` wanneer dit een verouderd antwoord in de wachtrij voorkomt.

### Gebruikers volgen in spraak

Gebruik `voice.followUsers` wanneer je wilt dat de Discord-spraakbot bij een of meer bekende Discord-gebruikers blijft in plaats van bij het opstarten een vast kanaal te joinen of te wachten op `/vc join`.

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

- `followUsers` accepteert onbewerkte Discord-gebruikers-ID's en waarden `discord:<id>`. OpenClaw normaliseert beide vormen voordat voice-state-events worden gematcht.
- `followUsersEnabled` staat standaard op `true` wanneer `followUsers` is geconfigureerd. Stel dit in op `false` om de opgeslagen lijst te behouden maar automatisch volgen in spraak te stoppen.
- Wanneer een gevolgde gebruiker een toegestaan spraakkanaal joint, joint OpenClaw dat kanaal. Wanneer de gebruiker verplaatst, verplaatst OpenClaw mee. Wanneer de actieve gevolgde gebruiker de verbinding verbreekt, verlaat OpenClaw het kanaal.
- Als meerdere gevolgde gebruikers in dezelfde guild zijn en de actieve gevolgde gebruiker vertrekt, verplaatst OpenClaw naar het kanaal van een andere bijgehouden gevolgde gebruiker voordat de guild wordt verlaten. Als meerdere gevolgde gebruikers tegelijk verplaatsen, wint het laatst waargenomen voice-state-event.
- `allowedChannels` blijft van toepassing. Een gevolgde gebruiker in een niet-toegestaan kanaal wordt genegeerd, en een door volgen beheerde sessie verplaatst naar een andere gevolgde gebruiker of vertrekt.
- OpenClaw verzoent gemiste voice-state-events bij het opstarten en met een begrensd interval. Verzoening bemonstert geconfigureerde guilds en begrenst REST-opzoekingen per run, dus zeer grote `followUsers`-lijsten kunnen meer dan één interval nodig hebben om te convergeren.
- Als Discord of een beheerder de bot verplaatst terwijl die een gebruiker volgt, bouwt OpenClaw de spraaksessie opnieuw op en behoudt het follow-eigenaarschap wanneer de bestemming is toegestaan. Als de bot buiten `allowedChannels` wordt verplaatst, vertrekt OpenClaw en joint het geconfigureerde doel opnieuw wanneer er een bestaat.
- DAVE-ontvangstherstel kan hetzelfde kanaal verlaten en opnieuw joinen na herhaalde decryptiefouten. Door volgen beheerde sessies behouden hun follow-eigenaarschap via dat herstelpad, zodat een latere disconnect van de gevolgde gebruiker het kanaal nog steeds verlaat.

Kies tussen de join-modi:

- Gebruik `followUsers` voor persoonlijke of operatoropstellingen waarbij de bot automatisch in spraak moet zijn wanneer jij dat bent.
- Gebruik `autoJoin` voor bots in vaste ruimtes die aanwezig moeten zijn, zelfs wanneer geen bijgehouden gebruiker in spraak is.
- Gebruik `/vc join` voor eenmalige joins of ruimtes waar automatische spraakaanwezigheid verrassend zou zijn.

Discord-spraakcodec:

- Voice-ontvangstlogs tonen `discord voice: opus decoder: libopus-wasm`.
- Realtime-weergave codeert ruwe 48 kHz stereo-PCM naar Opus met hetzelfde meegeleverde `libopus-wasm`-pakket voordat pakketten aan `@discordjs/voice` worden doorgegeven.
- Bestands- en providerstream-weergave transcodeert met ffmpeg naar ruwe 48 kHz stereo-PCM en gebruikt daarna `libopus-wasm` voor de Opus-pakketstream die naar Discord wordt gestuurd.

STT plus TTS-pijplijn:

- Discord PCM-opname wordt omgezet naar een tijdelijk WAV-bestand.
- `tools.media.audio` handelt STT af, bijvoorbeeld `openai/gpt-4o-mini-transcribe`.
- Het transcript wordt via Discord-ingress en routering verzonden terwijl de respons-LLM draait met een voice-outputbeleid dat de agenttool `tts` verbergt en om teruggegeven tekst vraagt, omdat Discord-spraak eigenaar is van de uiteindelijke TTS-weergave.
- `voice.model`, indien ingesteld, overschrijft alleen de respons-LLM voor deze voice-channel-turn.
- `voice.tts` wordt over `messages.tts` samengevoegd; providers met streamingondersteuning voeden de speler rechtstreeks, anders wordt het resulterende audiobestand afgespeeld in het kanaal waaraan is deelgenomen.

Voorbeeld van een standaard agent-proxy-voice-channel-sessie:

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

Zonder `voice.agentSession`-blok krijgt elk voice-kanaal zijn eigen gerouteerde OpenClaw-sessie. Bijvoorbeeld: `/vc join channel:234567890123456789` praat met de sessie voor dat Discord-voice-kanaal. Het realtime-model is alleen de spraak-frontend; inhoudelijke verzoeken worden doorgegeven aan de geconfigureerde OpenClaw-agent. Als het realtime-model een definitief transcript produceert zonder de consult-tool aan te roepen, forceert OpenClaw de consult als fallback zodat de standaardinstelling nog steeds aanvoelt als praten met de agent.

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

In `agent-proxy`-modus neemt de bot deel aan het geconfigureerde voice-kanaal, maar OpenClaw-agentturns gebruiken de normale gerouteerde sessie en agent van het doelkanaal. De realtime-spraaksessie spreekt het teruggegeven resultaat terug in het voice-kanaal. De supervisoragent kan nog steeds normale berichttools gebruiken volgens zijn toolbeleid, inclusief het verzenden van een afzonderlijk Discord-bericht als dat de juiste actie is.

Terwijl een gedelegeerde OpenClaw-run actief is, worden nieuwe Discord-spraaktranscripten behandeld als live runbesturing voordat een nieuwe agentturn wordt gestart. Zinnen zoals "status", "cancel that", "use the smaller fix" of "when you're done also check tests" worden geclassificeerd als status-, annulerings-, sturings- of vervolginvoer voor de actieve sessie. Status-, annulerings-, geaccepteerde sturings- en vervolgresultaten worden teruggesproken in het voice-kanaal zodat de beller weet of OpenClaw het verzoek heeft afgehandeld.

Handige doelvormen:

- `target: "channel:123456789012345678"` routeert via een Discord-tekstkanaalsessie.
- `target: "123456789012345678"` wordt behandeld als een kanaaldoel.
- `target: "dm:123456789012345678"` of `target: "user:123456789012345678"` routeert via die direct-message-sessie.

Echo-zwaar OpenAI Realtime-voorbeeld:

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

Gebruik dit wanneer het model zijn eigen Discord-weergave via een open microfoon hoort, maar je het toch wilt onderbreken door te spreken. OpenClaw voorkomt dat OpenAI automatisch onderbreekt op ruwe invoeraudio, terwijl `bargeIn: true` ervoor zorgt dat Discord speaker-start-gebeurtenissen en al actieve speakeraudio actieve realtime-responsen kunnen annuleren voordat de volgende opgenomen turn OpenAI bereikt. Zeer vroege barge-in-signalen met `audioEndMs` onder `minBargeInAudioEndMs` worden behandeld als waarschijnlijke echo/ruis en genegeerd, zodat het model niet wordt afgekapt bij het eerste afspeelframe.

Verwachte spraaklogs:

- Bij deelnemen: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- Bij realtime-start: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- Bij speakeraudio: `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...`, en `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- Bij overgeslagen verouderde spraak: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` of `reason=non-actionable-closing ...`
- Bij voltooiing van realtime-respons: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- Bij stop/reset van weergave: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- Bij realtime-consult: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- Bij agentantwoord: `discord voice: agent turn answer ...`
- Bij in wachtrij geplaatste exacte spraak: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`, gevolgd door `discord voice: realtime exact speech dequeued reason=player-idle ...`
- Bij barge-in-detectie: `discord voice: realtime barge-in detected source=speaker-start ...` of `discord voice: realtime barge-in detected source=active-speaker-audio ...`, gevolgd door `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- Bij realtime-onderbreking: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`, gevolgd door ofwel `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` of `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- Bij genegeerde echo/ruis: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- Bij uitgeschakelde barge-in: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- Bij inactieve weergave: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

Lees de realtime-spraaklogs als een tijdlijn om afgekapt geluid te debuggen:

1. `realtime audio playback started` betekent dat Discord is begonnen met het afspelen van assistentaudio. De bridge begint vanaf dit punt assistentoutputchunks, Discord PCM-bytes, provider-realtimebytes en gesynthetiseerde audioduur te tellen.
2. `realtime speaker turn opened` markeert dat een Discord-spreker actief wordt. Als weergave al actief is en `bargeIn` is ingeschakeld, kan dit worden gevolgd door `barge-in detected source=speaker-start`.
3. `realtime input audio started` markeert het eerste daadwerkelijke audioframe dat voor die speakerturn is ontvangen. `outputActive=true` of een niet-nul `outputAudioMs` hier betekent dat de microfoon invoer verzendt terwijl assistentweergave nog actief is.
4. `barge-in detected source=active-speaker-audio` betekent dat OpenClaw live speakeraudio zag terwijl assistentweergave actief was. Dit is nuttig om een echte onderbreking te onderscheiden van een Discord speaker-start-gebeurtenis zonder bruikbare audio.
5. `barge-in requested reason=...` betekent dat OpenClaw de realtime-provider heeft gevraagd de actieve respons te annuleren of af te kappen. Het bevat `outputAudioMs`, `outputActive` en `playbackChunks`, zodat je kunt zien hoeveel assistentaudio daadwerkelijk was afgespeeld vóór de onderbreking.
6. `realtime audio playback stopped reason=...` is het lokale resetpunt voor Discord-weergave. De reden zegt wie de weergave heeft gestopt: `barge-in`, `player-idle`, `provider-clear-audio`, `forced-agent-consult`, `stream-close` of `session-close`.
7. `realtime speaker turn closed` vat de opgenomen invoerturn samen. `chunks=0` of `hasAudio=false` betekent dat de speakerturn werd geopend, maar geen bruikbare audio de realtime-bridge bereikte. `interruptedPlayback=true` betekent dat die invoerturn overlapte met assistentoutput en barge-in-logica activeerde.

Handige velden:

- `outputAudioMs`: assistentaudioduur die vóór de logregel door de realtime-provider is gegenereerd.
- `audioMs`: assistentaudioduur die OpenClaw telde voordat de weergave stopte.
- `elapsedMs`: wall-clock-tijd tussen het openen en sluiten van de weergavestream of speakerturn.
- `discordBytes`: 48 kHz stereo-PCM-bytes verzonden naar of ontvangen van Discord-spraak.
- `realtimeBytes`: PCM-bytes in providerformaat verzonden naar of ontvangen van de realtime-provider.
- `playbackChunks`: assistentaudiochunks doorgestuurd naar Discord voor de actieve respons.
- `sinceLastAudioMs`: interval tussen het laatste opgenomen speakeraudioframe en het sluiten van de speakerturn.

Veelvoorkomende patronen:

- Onmiddellijk afkappen met `source=active-speaker-audio`, kleine `outputAudioMs` en dezelfde gebruiker in de buurt wijst meestal op speakerecho die de microfoon binnenkomt. Verhoog `voice.realtime.minBargeInAudioEndMs`, verlaag het speakervolume, gebruik een koptelefoon of stel `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` in.
- `source=speaker-start` gevolgd door `speaker turn closed ... hasAudio=false` betekent dat Discord een speakerstart meldde, maar dat er geen audio OpenClaw bereikte. Dat kan een tijdelijke Discord-spraakgebeurtenis zijn, gedrag van een noise gate of een client die de microfoon kort activeert.
- `audio playback stopped reason=stream-close` zonder nabije barge-in of `provider-clear-audio` betekent dat de lokale Discord-weergavestream onverwacht is geëindigd. Controleer de voorafgaande provider- en Discord-spelerlogs.
- `capture ignored during playback (barge-in disabled)` betekent dat OpenClaw invoer bewust heeft laten vallen terwijl assistentaudio actief was. Schakel `voice.realtime.bargeIn` in als je wilt dat spraak de weergave onderbreekt.
- `barge-in ignored ... outputActive=false` betekent dat Discord of provider-VAD spraak meldde, maar OpenClaw geen actieve weergave had om te onderbreken. Dit hoort audio niet af te kappen.

Referenties worden per component opgelost: LLM-routeauthenticatie voor `voice.model`, STT-authenticatie voor `tools.media.audio`, TTS-authenticatie voor `messages.tts`/`voice.tts` en realtime-provider-authenticatie voor `voice.realtime.providers` of de normale authenticatieconfiguratie van de provider.

### Spraakberichten

Discord-spraakberichten tonen een waveform-preview en vereisen OGG/Opus-audio. OpenClaw genereert de waveform automatisch, maar heeft `ffmpeg` en `ffprobe` nodig op de Gateway-host om te inspecteren en te converteren.

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
    - schakel Server Members Intent in wanneer je afhankelijk bent van user/member-resolutie
    - herstart gateway nadat je intents hebt gewijzigd

  </Accordion>

  <Accordion title="Guild messages blocked unexpectedly">

    - controleer `groupPolicy`
    - controleer de guild-allowlist onder `channels.discord.guilds`
    - als de guild-`channels`-map bestaat, zijn alleen vermelde kanalen toegestaan
    - controleer het gedrag van `requireMention` en vermeldingspatronen

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
    - `requireMention` geconfigureerd op de verkeerde plek (moet onder `channels.discord.guilds` of de kanaalvermelding staan)
    - afzender geblokkeerd door guild-/kanaal-`users`-allowlist

  </Accordion>

  <Accordion title="Long-running Discord turns or duplicate replies">

    Typische logs:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Discord-gatewaywachtrij-instellingen:

    - enkel account: `channels.discord.eventQueue.listenerTimeout`
    - meerdere accounts: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - dit beheert alleen listenerwerk van de Discord-gateway, niet de levensduur van agentbeurten

    Discord past geen kanaaleigen timeout toe op agentbeurten in de wachtrij. Berichtlisteners dragen direct over, en Discord-runs in de wachtrij behouden de volgorde per sessie totdat de sessie-/tool-/runtimelevenscyclus het werk voltooit of afbreekt.

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
    OpenClaw haalt Discord-`/gateway/bot`-metadata op vóór het verbinden. Tijdelijke fouten vallen terug op Discord's standaard-Gateway-URL en worden in logs beperkt in frequentie.

    Metadata-timeoutinstellingen:

    - enkel account: `channels.discord.gatewayInfoTimeoutMs`
    - meerdere accounts: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - env-terugval wanneer config niet is ingesteld: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - standaard: `30000` (30 seconden), max: `120000`

  </Accordion>

  <Accordion title="Gateway READY timeout restarts">
    OpenClaw wacht tijdens het opstarten en na runtime-herverbindingen op Discord's gateway-`READY`-event. Set-ups met meerdere accounts en gespreide opstart kunnen een langer READY-venster bij opstart nodig hebben dan de standaardwaarde.

    READY-timeoutinstellingen:

    - opstart enkel account: `channels.discord.gatewayReadyTimeoutMs`
    - opstart meerdere accounts: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - env-terugval bij opstart wanneer config niet is ingesteld: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - opstart standaard: `15000` (15 seconden), max: `120000`
    - runtime enkel account: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - runtime meerdere accounts: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - env-terugval bij runtime wanneer config niet is ingesteld: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - runtime standaard: `30000` (30 seconden), max: `120000`

  </Accordion>

  <Accordion title="Permissions audit mismatches">
    Toestemmingscontroles van `channels status --probe` werken alleen voor numerieke kanaal-ID's.

    Als je slug-sleutels gebruikt, kan runtime-matching nog steeds werken, maar kan probe de toestemmingen niet volledig verifiëren.

  </Accordion>

  <Accordion title="DM and pairing issues">

    - DM uitgeschakeld: `channels.discord.dm.enabled=false`
    - DM-beleid uitgeschakeld: `channels.discord.dmPolicy="disabled"` (legacy: `channels.discord.dm.policy`)
    - wacht op koppelingsgoedkeuring in `pairing`-modus

  </Accordion>

  <Accordion title="Bot to bot loops">
    Standaard worden berichten die door bots zijn geschreven genegeerd.

    Als je `channels.discord.allowBots=true` instelt, gebruik dan strikte regels voor vermeldingen en allowlists om lusgedrag te voorkomen.
    Geef de voorkeur aan `channels.discord.allowBots="mentions"` om alleen botberichten te accepteren die de bot vermelden.

    OpenClaw levert ook gedeelde [botloopbescherming](/nl/channels/bot-loop-protection). Wanneer `allowBots` door bots geschreven berichten dispatch laat bereiken, koppelt Discord het inkomende event aan `(account, channel, bot pair)`-feiten en onderdrukt de generieke pair-guard het paar nadat het het geconfigureerde eventbudget overschrijdt. De guard voorkomt onbeheersbare lussen tussen twee bots die eerder door Discord-rate limits moesten worden gestopt; dit heeft geen invloed op implementaties met één bot of eenmalige botantwoorden die onder het budget blijven.

    Standaardinstellingen (actief wanneer `allowBots` is ingesteld):

    - `maxEventsPerWindow: 20` -- botpaar kan 20 berichten uitwisselen binnen het schuivende venster
    - `windowSeconds: 60` -- lengte van het schuivende venster
    - `cooldownSeconds: 60` -- zodra het budget wordt overschreden, wordt elk extra bot-naar-botbericht in beide richtingen één minuut lang gedropt

    Configureer de gedeelde standaard eenmaal onder `channels.defaults.botLoopProtection` en overschrijf daarna Discord wanneer een legitieme workflow meer ruimte nodig heeft. De prioriteit is:

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

  <Accordion title="Voice STT drops with DecryptionFailed(...)">

    - houd OpenClaw actueel (`openclaw update`) zodat de herstellogica voor Discord voice receive aanwezig is
    - bevestig `channels.discord.voice.daveEncryption=true` (standaard)
    - begin met `channels.discord.voice.decryptionFailureTolerance=24` (upstream-standaard) en stem alleen af indien nodig
    - bekijk logs voor:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - als fouten na automatisch opnieuw deelnemen doorgaan, verzamel logs en vergelijk met de upstream DAVE receive-geschiedenis in [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) en [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Configuratiereferentie

Primaire referentie: [Configuratiereferentie - Discord](/nl/gateway/config-channels#discord).

<Accordion title="High-signal Discord fields">

- opstart/auth: `enabled`, `token`, `accounts.*`, `allowBots`
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
- Verleen Discord-toestemmingen volgens het principe van minimale rechten.
- Als opdrachtdeploy/-status verouderd is, herstart gateway en controleer opnieuw met `openclaw channels status --probe`.

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/nl/channels/pairing">
    Koppel een Discord-gebruiker aan de gateway.
  </Card>
  <Card title="Groups" icon="users" href="/nl/channels/groups">
    Groepschat- en allowlistgedrag.
  </Card>
  <Card title="Channel routing" icon="route" href="/nl/channels/channel-routing">
    Routeer inkomende berichten naar agents.
  </Card>
  <Card title="Security" icon="shield" href="/nl/gateway/security">
    Dreigingsmodel en hardening.
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/nl/concepts/multi-agent">
    Wijs guilds en kanalen toe aan agents.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/nl/tools/slash-commands">
    Gedrag van native opdrachten.
  </Card>
</CardGroup>
