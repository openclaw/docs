---
read_when:
    - Werken aan functies voor het Discord-kanaal
summary: Ondersteuningsstatus, mogelijkheden en configuratie van de Discord-bot
title: Discord
x-i18n:
    generated_at: "2026-06-28T20:40:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 91bda14cfdd7bf5045413d97c56936ea7150b396e0e7ecd4ac300e1a811377cb
    source_path: channels/discord.md
    workflow: 16
---

Klaar voor DM's en guild-kanalen via de officiële Discord-gateway.

<CardGroup cols={3}>
  <Card title="Koppelen" icon="link" href="/nl/channels/pairing">
    Discord-DM's gebruiken standaard de koppelmodus.
  </Card>
  <Card title="Slash-opdrachten" icon="terminal" href="/nl/tools/slash-commands">
    Native opdrachtgedrag en opdrachtcatalogus.
  </Card>
  <Card title="Kanaalprobleemoplossing" icon="wrench" href="/nl/channels/troubleshooting">
    Kanaaloverschrijdende diagnostiek en reparatiestroom.
  </Card>
</CardGroup>

## Snelle installatie

Je moet een nieuwe applicatie met een bot maken, de bot aan je server toevoegen en deze aan OpenClaw koppelen. We raden aan om je bot toe te voegen aan je eigen privéserver. Als je er nog geen hebt, [maak er eerst een aan](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (kies **Create My Own > For me and my friends**).

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

  <Step title="Kopieer je bot-token">
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

    Er verschijnt hieronder een sectie **Bot Permissions**. Schakel ten minste in:

    **Algemene machtigingen**
      - Kanalen bekijken
    **Tekstmachtigingen**
      - Berichten verzenden
      - Berichtgeschiedenis lezen
      - Links insluiten
      - Bestanden bijvoegen
      - Reacties toevoegen (optioneel)

    Dit is de basisset voor normale tekstkanalen. Als je van plan bent in Discord-threads te posten, inclusief forum- of mediakanaalworkflows die een thread maken of voortzetten, schakel dan ook **Send Messages in Threads** in.
    Kopieer de gegenereerde URL onderaan, plak deze in je browser, selecteer je server en klik op **Continue** om te verbinden. Je zou je bot nu in de Discord-server moeten zien.

  </Step>

  <Step title="Schakel Developer Mode in en verzamel je ID's">
    Terug in de Discord-app moet je Developer Mode inschakelen zodat je interne ID's kunt kopiëren.

    1. Klik op **User Settings** (tandwielpictogram naast je avatar) → Scrol naar **Developer** in de zijbalk → schakel **Developer Mode** in

        *(Opmerking: in de mobiele Discord-app staat Developer Mode onder **App Settings** → **Advanced**)*

    2. Klik met de rechtermuisknop op je **serverpictogram** in de zijbalk → **Copy Server ID**
    3. Klik met de rechtermuisknop op je **eigen avatar** → **Copy User ID**

    Bewaar je **Server ID** en **User ID** samen met je Bot Token — je stuurt ze alle drie in de volgende stap naar OpenClaw.

  </Step>

  <Step title="Sta DM's van serverleden toe">
    Om koppelen te laten werken, moet Discord toestaan dat je bot je een DM stuurt. Klik met de rechtermuisknop op je **serverpictogram** → **Privacy Settings** → schakel **Direct Messages** in.

    Hiermee kunnen serverleden (inclusief bots) je DM's sturen. Laat dit ingeschakeld als je Discord-DM's met OpenClaw wilt gebruiken. Als je alleen guild-kanalen wilt gebruiken, kun je DM's na het koppelen uitschakelen.

  </Step>

  <Step title="Stel je bot-token veilig in (stuur het niet in de chat)">
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

    Als OpenClaw al als achtergrondservice draait, herstart deze dan via de OpenClaw Mac-app of door het `openclaw gateway run`-proces te stoppen en opnieuw te starten.
    Voor beheerde service-installaties voer je `openclaw gateway install` uit vanuit een shell waarin `DISCORD_BOT_TOKEN` aanwezig is, of sla je de variabele op in `~/.openclaw/.env`, zodat de service de env-SecretRef na een herstart kan oplossen.
    Als je host wordt geblokkeerd of door Discord's opstart-application-lookup wordt beperkt, stel dan de Discord-applicatie-/client-ID in vanuit de Developer Portal, zodat het opstarten die REST-aanroep kan overslaan. Gebruik `channels.discord.applicationId` voor het standaardaccount, of `channels.discord.accounts.<accountId>.applicationId` wanneer je meerdere Discord-bots gebruikt.

  </Step>

  <Step title="Configureer OpenClaw en koppel">

    <Tabs>
      <Tab title="Vraag het je agent">
        Chat met je OpenClaw-agent op een bestaand kanaal (bijv. Telegram) en vertel het hem. Als Discord je eerste kanaal is, gebruik dan in plaats daarvan het tabblad CLI / config.

        > "Ik heb mijn Discord-bot-token al in de config ingesteld. Rond de Discord-installatie af met User ID `<user_id>` en Server ID `<server_id>`."
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

        Voor gescripte of externe installatie schrijf je hetzelfde JSON5-blok met `openclaw config patch --file ./discord.patch.json5 --dry-run` en voer je het daarna opnieuw uit zonder `--dry-run`. Platte-tekst-`token`-waarden worden ondersteund. SecretRef-waarden worden ook ondersteund voor `channels.discord.token` via env-/file-/exec-providers. Zie [Geheimenbeheer](/nl/gateway/secrets).

        Voor meerdere Discord-bots bewaar je elk bot-token en elke applicatie-ID onder het bijbehorende account. Een `channels.discord.applicationId` op topniveau wordt door accounts geërfd, dus stel deze daar alleen in wanneer elk account dezelfde applicatie-ID moet gebruiken.

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
Tokenresolutie houdt rekening met accounts. Config-tokenwaarden winnen van env-fallback. `DISCORD_BOT_TOKEN` wordt alleen gebruikt voor het standaardaccount.
Als twee ingeschakelde Discord-accounts naar hetzelfde bot-token verwijzen, start OpenClaw slechts één gateway-monitor voor dat token. Een token uit config wint van de standaard env-fallback; anders wint het eerste ingeschakelde account en wordt het dubbele account als uitgeschakeld gerapporteerd.
Voor geavanceerde uitgaande aanroepen (berichttool-/kanaalacties) wordt een expliciet `token` per aanroep gebruikt voor die aanroep. Dit geldt voor verzend- en lees-/probe-achtige acties (bijvoorbeeld lezen/zoeken/ophalen/thread/pins/machtigingen). Accountbeleid en retry-instellingen komen nog steeds uit het geselecteerde account in de actieve runtime-snapshot.
</Note>

## Aanbevolen: stel een guild-werkruimte in

Zodra DM's werken, kun je je Discord-server instellen als volledige werkruimte waarin elk kanaal een eigen agentsessie met eigen context krijgt. Dit wordt aanbevolen voor privéservers waar alleen jij en je bot aanwezig zijn.

<Steps>
  <Step title="Voeg je server toe aan de guild-allowlist">
    Hiermee kan je agent in elk kanaal op je server reageren, niet alleen in DM's.

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
    Standaard reageert je agent in guild-kanalen alleen wanneer deze wordt @genoemd. Voor een privéserver wil je waarschijnlijk dat deze op elk bericht reageert.

    In guild-kanalen worden normale antwoorden standaard automatisch geplaatst. Voor gedeelde altijd-aan-ruimtes kies je `messages.groupChat.visibleReplies: "message_tool"` zodat de agent kan meelezen en alleen post wanneer hij besluit dat een kanaalantwoord nuttig is. Dit werkt het best met nieuwste-generatie, toolbetrouwbare modellen zoals GPT 5.5. Ambient-roomgebeurtenissen blijven stil tenzij de tool verzendt. Zie [Ambient-roomgebeurtenissen](/nl/channels/ambient-room-events) voor de volledige lurk-mode-config.

    Als Discord typen toont en de logs tokengebruik tonen maar er geen bericht is geplaatst, controleer dan of de beurt was geconfigureerd als ambient-roomgebeurtenis of was ingesteld op zichtbare antwoorden via message-tool.

    <Tabs>
      <Tab title="Vraag het je agent">
        > "Sta mijn agent toe op deze server te reageren zonder dat hij @genoemd hoeft te worden"
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

        Stel `messages.groupChat.visibleReplies: "message_tool"` in om message-tool-verzendingen te vereisen voor zichtbare groeps-/kanaalantwoorden.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Plan geheugen in guild-kanalen">
    Standaard wordt langetermijngeheugen (MEMORY.md) alleen geladen in DM-sessies. Guild-kanalen laden MEMORY.md niet automatisch.

    <Tabs>
      <Tab title="Vraag het je agent">
        > "Wanneer ik vragen stel in Discord-kanalen, gebruik dan memory_search of memory_get als je langetermijncontext uit MEMORY.md nodig hebt."
      </Tab>
      <Tab title="Handmatig">
        Als je gedeelde context in elk kanaal nodig hebt, zet de stabiele instructies dan in `AGENTS.md` of `USER.md` (ze worden voor elke sessie geïnjecteerd). Bewaar langetermijnnotities in `MEMORY.md` en open ze op verzoek met geheugentools.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Maak nu een paar kanalen op je Discord-server en begin met chatten. Je agent kan de kanaalnaam zien, en elk kanaal krijgt een eigen geïsoleerde sessie — zodat je `#coding`, `#home`, `#research` of wat dan ook bij je workflow past kunt instellen.

## Runtime-model

- Gateway beheert de Discord-verbinding.
- Antwoordroutering is deterministisch: binnenkomende Discord-antwoorden gaan terug naar Discord.
- Metadata van Discord-guilds en -kanalen wordt als niet-vertrouwde
  context aan de modelprompt toegevoegd, niet als een voor de gebruiker zichtbaar antwoordvoorvoegsel. Als een model die envelop
  terugkopieert, verwijdert OpenClaw de gekopieerde metadata uit uitgaande antwoorden en uit
  toekomstige replay-context.
- Standaard (`session.dmScope=main`) delen directe chats de hoofdsessie van de agent (`agent:main:main`).
- Guild-kanalen zijn geisoleerde sessiesleutels (`agent:<agentId>:discord:channel:<channelId>`).
- Groeps-DM's worden standaard genegeerd (`channels.discord.dm.groupEnabled=false`).
- Native slash-commando's draaien in geisoleerde commandosessies (`agent:<agentId>:discord:slash:<userId>`), terwijl ze nog steeds `CommandTargetSessionKey` meenemen naar de gerouteerde gesprekssessie.
- Alleen-tekst aankondigingslevering voor Cron/Heartbeat naar Discord gebruikt het uiteindelijke
  voor de assistant zichtbare antwoord eenmalig. Media en payloads met gestructureerde componenten blijven
  meerdere berichten gebruiken wanneer de agent meerdere leverbare payloads uitstuurt.

## Forumkanalen

Discord-forum- en mediakanalen accepteren alleen threadberichten. OpenClaw ondersteunt twee manieren om deze te maken:

- Stuur een bericht naar de forumouder (`channel:<forumId>`) om automatisch een thread te maken. De threadtitel gebruikt de eerste niet-lege regel van je bericht.
- Gebruik `openclaw message thread create` om direct een thread te maken. Geef geen `--message-id` door voor forumkanalen.

Voorbeeld: naar de forumouder sturen om een thread te maken

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Voorbeeld: expliciet een forumthread maken

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Forumouders accepteren geen Discord-componenten. Als je componenten nodig hebt, stuur dan naar de thread zelf (`channel:<threadId>`).

## Interactieve componenten

OpenClaw ondersteunt Discord components v2-containers voor agentberichten. Gebruik de berichttool met een `components`-payload. Interactieresultaten worden terug naar de agent gerouteerd als normale binnenkomende berichten en volgen de bestaande Discord-`replyToMode`-instellingen.

Ondersteunde blokken:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Actierijen staan maximaal 5 knoppen of een enkel selectiemenu toe
- Selectietypen: `string`, `user`, `role`, `mentionable`, `channel`

Standaard zijn componenten eenmalig te gebruiken. Stel `components.reusable=true` in om knoppen, selecties en formulieren meerdere keren te laten gebruiken totdat ze verlopen.

Om te beperken wie op een knop kan klikken, stel je `allowedUsers` in op die knop (Discord-gebruikers-ID's, tags of `*`). Wanneer dit is geconfigureerd, ontvangen niet-overeenkomende gebruikers een vluchtige weigering.

Component-callbacks verlopen standaard na 30 minuten. Stel `channels.discord.agentComponents.ttlMs` in om die levensduur van het callbackregister voor het standaard Discord-account te wijzigen, of `channels.discord.accounts.<accountId>.agentComponents.ttlMs` om een account in een multi-accountconfiguratie te overschrijven. De waarde is in milliseconden, moet een positief geheel getal zijn en is gemaximeerd op `86400000` (24 uur). Langere TTL's zijn nuttig voor review- of goedkeuringsworkflows waarin knoppen bruikbaar moeten blijven, maar ze verlengen ook het venster waarin een oud Discord-bericht nog steeds een actie kan triggeren. Geef de voorkeur aan de kortste TTL die bij de workflow past, en behoud de standaardwaarde wanneer oude callbacks verrassend zouden zijn.

De slash-commando's `/model` en `/models` openen een interactieve modelkiezer met keuzelijsten voor provider, model en compatibele runtime plus een verzendstap. `/models add` is verouderd en retourneert nu een afschaffingsbericht in plaats van modellen vanuit chat te registreren. Het antwoord van de kiezer is vluchtig en alleen de aanroepende gebruiker kan het gebruiken. Discord-selectiemenu's zijn beperkt tot 25 opties, dus voeg `provider/*`-items toe aan `agents.defaults.models` wanneer je wilt dat de kiezer dynamisch ontdekte modellen alleen toont voor geselecteerde providers zoals `openai` of `vllm`.

Bestandsbijlagen:

- `file`-blokken moeten verwijzen naar een bijlagereferentie (`attachment://<filename>`)
- Lever de bijlage aan via `media`/`path`/`filePath` (een enkel bestand); gebruik `media-gallery` voor meerdere bestanden
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
    `channels.discord.dmPolicy` beheert DM-toegang. `channels.discord.allowFrom` is de canonieke DM-toelatingslijst.

    - `pairing` (standaard)
    - `allowlist`
    - `open` (vereist dat `channels.discord.allowFrom` `"*"` bevat)
    - `disabled`

    Als het DM-beleid niet open is, worden onbekende gebruikers geblokkeerd (of gevraagd om te koppelen in de `pairing`-modus).

    Voorrang bij meerdere accounts:

    - `channels.discord.accounts.default.allowFrom` is alleen van toepassing op het `default`-account.
    - Voor een account heeft `allowFrom` voorrang op legacy `dm.allowFrom`.
    - Benoemde accounts erven `channels.discord.allowFrom` wanneer hun eigen `allowFrom` en legacy `dm.allowFrom` niet zijn ingesteld.
    - Benoemde accounts erven `channels.discord.accounts.default.allowFrom` niet.

    Legacy `channels.discord.dm.policy` en `channels.discord.dm.allowFrom` worden nog steeds gelezen voor compatibiliteit. `openclaw doctor --fix` migreert ze naar `dmPolicy` en `allowFrom` wanneer dat kan zonder de toegang te wijzigen.

    DM-doelformaat voor levering:

    - `user:<id>`
    - `<@id>`-vermelding

    Kale numerieke ID's worden normaal gesproken als kanaal-ID's opgelost wanneer een kanaalstandaard actief is, maar ID's die in de effectieve DM-`allowFrom` van het account staan, worden voor compatibiliteit behandeld als DM-doelen voor gebruikers.

  </Tab>

  <Tab title="Access groups">
    Discord-DM's en autorisatie van tekstcommando's kunnen dynamische `accessGroup:<name>`-items gebruiken in `channels.discord.allowFrom`.

    Namen van toegangsgroepen worden gedeeld tussen berichtkanalen. Gebruik `type: "message.senders"` voor een statische groep waarvan de leden worden uitgedrukt in de normale `allowFrom`-syntaxis van elk kanaal, of `type: "discord.channelAudience"` wanneer het huidige `ViewChannel`-publiek van een Discord-kanaal het lidmaatschap dynamisch moet bepalen. Gedeeld gedrag van toegangsgroepen wordt hier gedocumenteerd: [Toegangsgroepen](/nl/channels/access-groups).

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

    Een Discord-tekstkanaal heeft geen aparte ledenlijst. `type: "discord.channelAudience"` modelleert lidmaatschap als: de DM-afzender is lid van de geconfigureerde guild en heeft momenteel effectieve `ViewChannel`-rechten op het geconfigureerde kanaal nadat rol- en kanaaloverschrijvingen zijn toegepast.

    Voorbeeld: sta iedereen die `#maintainers` kan zien toe de bot te DM'en, terwijl DM's voor alle anderen gesloten blijven.

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

    Lookups falen gesloten. Als Discord `Missing Access` retourneert, de ledenlookup mislukt, of het kanaal bij een andere guild hoort, wordt de DM-afzender als niet-geautoriseerd behandeld.

    Schakel de Discord Developer Portal **Server Members Intent** in voor de bot wanneer je toegangsgroepen op basis van kanaalpubliek gebruikt. DM's bevatten geen guild-lidstatus, dus OpenClaw lost het lid via Discord REST op tijdens autorisatie.

  </Tab>

  <Tab title="Guild policy">
    Guild-afhandeling wordt beheerd door `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    De veilige basisinstelling wanneer `channels.discord` bestaat, is `allowlist`.

    `allowlist`-gedrag:

    - guild moet overeenkomen met `channels.discord.guilds` (`id` heeft de voorkeur, slug wordt geaccepteerd)
    - optionele toelatingslijsten voor afzenders: `users` (stabiele ID's aanbevolen) en `roles` (alleen rol-ID's); als een van beide is geconfigureerd, zijn afzenders toegestaan wanneer ze overeenkomen met `users` OF `roles`
    - directe naam-/tagmatching is standaard uitgeschakeld; schakel `channels.discord.dangerouslyAllowNameMatching: true` alleen in als noodcompatibiliteitsmodus
    - namen/tags worden ondersteund voor `users`, maar ID's zijn veiliger; `openclaw security audit` waarschuwt wanneer naam-/tag-items worden gebruikt
    - als een guild `channels` heeft geconfigureerd, worden niet-vermelde kanalen geweigerd
    - als een guild geen `channels`-blok heeft, zijn alle kanalen in die toegelaten guild toegestaan

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
    Guild-berichten vereisen standaard een vermelding.

    Vermeldingsdetectie omvat:

    - expliciete botvermelding
    - geconfigureerde vermeldingspatronen (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - impliciet antwoord-aan-bot-gedrag in ondersteunde gevallen

    Gebruik bij het schrijven van uitgaande Discord-berichten de canonieke vermeldingssyntaxis: `<@USER_ID>` voor gebruikers, `<#CHANNEL_ID>` voor kanalen en `<@&ROLE_ID>` voor rollen. Gebruik niet de legacy bijnaamvermeldingsvorm `<@!USER_ID>`.

    `requireMention` wordt per guild/kanaal geconfigureerd (`channels.discord.guilds...`).
    `ignoreOtherMentions` laat optioneel berichten vallen die een andere gebruiker/rol noemen maar niet de bot (met uitzondering van @everyone/@here).

    Groeps-DM's:

    - standaard: genegeerd (`dm.groupEnabled=false`)
    - optionele toelatingslijst via `dm.groupChannels` (kanaal-ID's of slugs)

  </Tab>
</Tabs>

### Rolgebaseerde agentroutering

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

## Native opdrachten en opdracht-auth

- `commands.native` is standaard `"auto"` en is ingeschakeld voor Discord.
- Override per kanaal: `channels.discord.commands.native`.
- `commands.native=false` slaat Discord slash-command-registratie en opschoning tijdens het opstarten over. Eerder geregistreerde opdrachten kunnen zichtbaar blijven in Discord totdat je ze uit de Discord-app verwijdert.
- Native opdracht-auth gebruikt dezelfde Discord-allowlists/beleidsregels als normale berichtverwerking.
- Opdrachten kunnen nog steeds zichtbaar zijn in de Discord UI voor gebruikers die niet geautoriseerd zijn; uitvoering handhaaft nog steeds OpenClaw-auth en retourneert "not authorized".

Zie [Slash commands](/nl/tools/slash-commands) voor de opdrachtencatalogus en het gedrag.

Standaardinstellingen voor slash commands:

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
    `first` koppelt de impliciete native antwoordreferentie altijd aan het eerste uitgaande Discord-bericht voor de beurt.
    `batched` koppelt Discords impliciete native antwoordreferentie alleen wanneer de
    inkomende gebeurtenis een gedebouncete batch van meerdere berichten was. Dit is nuttig
    wanneer je native antwoorden vooral wilt gebruiken voor ambigue, bursty chats, niet voor
    elke beurt met één bericht.

    Bericht-ID's worden in context/geschiedenis beschikbaar gemaakt zodat agents specifieke berichten kunnen targeten.

  </Accordion>

  <Accordion title="Linkvoorbeelden">
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

    Stel `channels.discord.accounts.<id>.suppressEmbeds` in om één account te overriden. Verzendingen via de agent message-tool kunnen ook `suppressEmbeds: false` doorgeven voor één bericht. Expliciete Discord `embeds`-payloads worden niet onderdrukt door de standaardinstelling voor linkvoorbeelden.

  </Accordion>

  <Accordion title="Live stream-voorbeeld">
    OpenClaw kan conceptantwoorden streamen door een tijdelijk bericht te sturen en het te bewerken terwijl tekst binnenkomt. `channels.discord.streaming` accepteert `off` | `partial` | `block` | `progress` (standaard). `progress` behoudt één bewerkbaar statusconcept en werkt dit bij met toolvoortgang tot de uiteindelijke levering; het gedeelde startlabel is een doorlopende regel, zodat het net als de rest wegscrollt zodra er genoeg werk verschijnt. `streamMode` is een verouderde runtime-alias. Voer `openclaw doctor --fix` uit om persistente configuratie naar de canonieke sleutel te herschrijven.

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
    - `block` verzendt conceptgrote chunks (gebruik `draftChunk` om grootte en breekpunten af te stemmen, begrensd tot `textChunkLimit`).
    - Media, fouten en expliciete-antwoordfinals annuleren wachtende voorbeeldbewerkingen.
    - `streaming.preview.toolProgress` (standaard `true`) bepaalt of tool-/voortgangsupdates het voorbeeldbericht hergebruiken.
    - Tool-/voortgangsrijen worden weergegeven als compacte emoji + titel + detail wanneer beschikbaar, bijvoorbeeld `🛠️ Bash: run tests` of `🔎 Web Search: for "query"`.
    - `streaming.progress.commentary` (standaard `false`) meldt je aan voor assistant-commentaar/introductietekst in het tijdelijke voortgangsconcept. Commentaar wordt vóór weergave opgeschoond, blijft tijdelijk en verandert de levering van het definitieve antwoord niet.
    - `streaming.progress.maxLineChars` bepaalt het budget per regel voor het voortgangsvoorbeeld. Proza wordt ingekort op woordgrenzen; opdracht- en paddetails behouden nuttige suffixen.
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

    - Discord-threads routeren als kanaalsessies en erven de configuratie van het bovenliggende kanaal tenzij die wordt overridden.
    - Threadsessies erven de sessieniveau-`/model`-selectie van het bovenliggende kanaal als model-only fallback; threadlokale `/model`-selecties krijgen nog steeds voorrang en transcriptgeschiedenis van de parent wordt niet gekopieerd tenzij transcriptovererving is ingeschakeld.
    - `channels.discord.thread.inheritParent` (standaard `false`) laat nieuwe auto-threads seeden vanuit het bovenliggende transcript. Overrides per account staan onder `channels.discord.accounts.<id>.thread.inheritParent`.
    - Message-tool-reacties kunnen `user:<id>` DM-targets oplossen.
    - `guilds.<guild>.channels.<channel>.requireMention: false` blijft behouden tijdens de fallback voor activering in de antwoordfase.

    Kanaalonderwerpen worden geïnjecteerd als **niet-vertrouwde** context. Allowlists bepalen wie de agent kan triggeren, niet een volledige redactiegrens voor aanvullende context.

  </Accordion>

  <Accordion title="Threadgebonden sessies voor subagents">
    Discord kan een thread aan een sessietarget binden zodat vervolgberichten in die thread naar dezelfde sessie blijven routeren (inclusief subagentsessies).

    Opdrachten:

    - `/focus <target>` bind huidige/nieuwe thread aan een subagent-/sessietarget
    - `/unfocus` verwijder huidige threadbinding
    - `/agents` toon actieve runs en bindingsstatus
    - `/session idle <duration|off>` inspecteer/update inactiviteits-auto-unfocus voor gefocuste bindings
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
    - `channels.discord.threadBindings.*` overridet Discord-gedrag.
    - `spawnSessions` beheert automatisch aanmaken/binden van threads voor `sessions_spawn({ thread: true })` en ACP-threadspawns. Standaard: `true`.
    - `defaultSpawnContext` beheert native subagentcontext voor threadgebonden spawns. Standaard: `"fork"`.
    - Verouderde sleutels `spawnSubagentSessions`/`spawnAcpSessions` worden gemigreerd door `openclaw doctor --fix`.
    - Als threadbindings voor een account zijn uitgeschakeld, zijn `/focus` en gerelateerde threadbindingsbewerkingen niet beschikbaar.

    Zie [Sub-agents](/nl/tools/subagents), [ACP Agents](/nl/tools/acp-agents) en [Configuration Reference](/nl/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Persistente ACP-kanaalbindings">
    Configureer voor stabiele "always-on" ACP-werkruimten getypeerde ACP-bindings op topniveau die targeten op Discord-gesprekken.

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
    - In een gebonden kanaal of thread resetten `/new` en `/reset` dezelfde ACP-sessie op zijn plaats. Tijdelijke threadbindings kunnen targetresolutie overriden zolang ze actief zijn.
    - `spawnSessions` bewaakt het aanmaken/binden van child-threads via `--thread auto|here`.

    Zie [ACP Agents](/nl/tools/acp-agents) voor details over bindingsgedrag.

  </Accordion>

  <Accordion title="Reactiemeldingen">
    Reactiemeldingsmodus per gilde:

    - `off`
    - `own` (standaard)
    - `all`
    - `allowlist` (gebruikt `guilds.<id>.users`)

    Reactiegebeurtenissen worden omgezet in systeemgebeurtenissen en gekoppeld aan de geroute Discord-sessie.

  </Accordion>

  <Accordion title="Ack-reacties">
    `ackReaction` verzendt een bevestigingsemoji terwijl OpenClaw een inkomend bericht verwerkt.

    Resolutievolgorde:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - fallback naar agent-identiteitsemoji (`agents.list[].identity.emoji`, anders "👀")

    Opmerkingen:

    - Discord accepteert unicode-emoji of aangepaste emojinamen.
    - Gebruik `""` om de reactie voor een kanaal of account uit te schakelen.

  </Accordion>

  <Accordion title="Configuratieschrijfacties">
    Door het kanaal geïnitieerde configuratieschrijfacties zijn standaard ingeschakeld.

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
    Routeer Discord Gateway WebSocket-verkeer en REST-lookups bij het opstarten (applicatie-ID + allowlist-resolutie) via een HTTP(S)-proxy met `channels.discord.proxy`.

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
    Schakel PluralKit-resolutie in om geproxiede berichten te koppelen aan systeemlididentiteit:

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
    - zoekacties gebruiken de oorspronkelijke bericht-ID en zijn beperkt tot een tijdvenster
    - als zoeken mislukt, worden proxied berichten behandeld als botberichten en verwijderd, tenzij `allowBots=true`

  </Accordion>

  <Accordion title="Outbound mention aliases">
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

  <Accordion title="Presence configuration">
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

    Activiteitstypekaart:

    - 0: Spelen
    - 1: Streamen (vereist `activityUrl`)
    - 2: Luisteren
    - 3: Kijken
    - 4: Aangepast (gebruikt de activiteitstekst als statustoestand; emoji is optioneel)
    - 5: Wedijveren

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

    Automatische aanwezigheid koppelt runtimebeschikbaarheid aan Discord-status: gezond => online, verminderd of onbekend => idle, uitgeput of niet beschikbaar => dnd. Optionele tekstoverschrijvingen:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (ondersteunt `{reason}`-placeholder)

  </Accordion>

  <Accordion title="Approvals in Discord">
    Discord ondersteunt goedkeuringsafhandeling op basis van knoppen in DM's en kan optioneel goedkeuringsprompts plaatsen in het oorspronkelijke kanaal.

    Configuratiepad:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (optioneel; valt waar mogelijk terug op `commands.ownerAllowFrom`)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, standaard: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord schakelt native exec-goedkeuringen automatisch in wanneer `enabled` niet is ingesteld of `"auto"` is en ten minste één goedkeurder kan worden resolved, hetzij uit `execApprovals.approvers`, hetzij uit `commands.ownerAllowFrom`. Discord leidt exec-goedkeurders niet af uit kanaal-`allowFrom`, legacy `dm.allowFrom` of direct-message `defaultTo`. Stel `enabled: false` in om Discord expliciet uit te schakelen als native goedkeuringsclient.

    Voor gevoelige groepscommando's die alleen voor owners zijn, zoals `/diagnostics` en `/export-trajectory`, stuurt OpenClaw goedkeuringsprompts en eindresultaten privé. Het probeert eerst een Discord-DM wanneer de aanroepende owner een Discord-ownerrouting heeft; als die niet beschikbaar is, valt het terug op de eerste beschikbare ownerrouting uit `commands.ownerAllowFrom`, zoals Telegram.

    Wanneer `target` `channel` of `both` is, is de goedkeuringsprompt zichtbaar in het kanaal. Alleen resolved goedkeurders kunnen de knoppen gebruiken; andere gebruikers ontvangen een tijdelijke weigering. Goedkeuringsprompts bevatten de commandotekst, dus schakel kanaallevering alleen in vertrouwde kanalen in. Als de kanaal-ID niet uit de sessiesleutel kan worden afgeleid, valt OpenClaw terug op levering via DM.

    Discord rendert ook de gedeelde goedkeuringsknoppen die door andere chatkanalen worden gebruikt. De native Discord-adapter voegt vooral DM-routing voor goedkeurders en kanaalfanout toe.
    Wanneer die knoppen aanwezig zijn, vormen ze de primaire goedkeurings-UX; OpenClaw
    mag alleen een handmatig `/approve`-commando opnemen wanneer het toolresultaat zegt
    dat chatgoedkeuringen niet beschikbaar zijn of dat handmatige goedkeuring de enige route is.
    Als de native goedkeuringsruntime van Discord niet actief is, houdt OpenClaw de
    lokale deterministische `/approve <id> <decision>`-prompt zichtbaar. Als de
    runtime actief is maar een native kaart niet aan een doel kan worden geleverd,
    stuurt OpenClaw een fallbackmelding in dezelfde chat met het exacte `/approve`-
    commando uit de openstaande goedkeuring.

    Gateway-authenticatie en goedkeuringsresolutie volgen het gedeelde Gateway-clientcontract (`plugin:`-ID's worden opgelost via `plugin.approval.resolve`; andere ID's via `exec.approval.resolve`). Goedkeuringen verlopen standaard na 30 minuten.

    Zie [Exec-goedkeuringen](/nl/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Tools en actiegates

Discord-berichtacties omvatten berichten, kanaalbeheer, moderatie, aanwezigheid en metadata-acties.

Kernvoorbeelden:

- berichten: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- reacties: `react`, `reactions`, `emojiList`
- moderatie: `timeout`, `kick`, `ban`
- aanwezigheid: `setPresence`

De actie `event-create` accepteert een optionele parameter `image` (URL of lokaal bestandspad) om de omslagafbeelding van de geplande gebeurtenis in te stellen.

Actiegates staan onder `channels.discord.actions.*`.

Standaard gate-gedrag:

| Actiegroep                                                                                                                                                               | Standaard     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | ingeschakeld  |
| roles                                                                                                                                                                    | uitgeschakeld |
| moderation                                                                                                                                                               | uitgeschakeld |
| presence                                                                                                                                                                 | uitgeschakeld |

## Components v2-UI

OpenClaw gebruikt Discord components v2 voor exec-goedkeuringen en cross-context-markeringen. Discord-berichtacties kunnen ook `components` accepteren voor aangepaste UI (geavanceerd; vereist het construeren van een componentpayload via de discord-tool), terwijl legacy `embeds` beschikbaar blijven maar niet worden aanbevolen.

- `channels.discord.ui.components.accentColor` stelt de accentkleur in die wordt gebruikt door Discord-componentcontainers (hex).
- Stel dit per account in met `channels.discord.accounts.<id>.ui.components.accentColor`.
- `channels.discord.agentComponents.ttlMs` bepaalt hoe lang verzonden Discord-componentcallbacks geregistreerd blijven (standaard `1800000`, maximum `86400000`). Stel dit per account in met `channels.discord.accounts.<id>.agentComponents.ttlMs`.
- `embeds` worden genegeerd wanneer components v2 aanwezig zijn.
- Voorvertoningen van gewone URL's worden standaard onderdrukt. Stel `suppressEmbeds: false` in op een berichtactie wanneer een enkele uitgaande link moet worden uitgevouwen.

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

Discord heeft twee afzonderlijke spraakoppervlakken: realtime **spraakkanalen** (doorlopende gesprekken) en **spraakberichtbijlagen** (het golfvormvoorbeeldformaat). De gateway ondersteunt beide.

### Spraakkanalen

Setupchecklist:

1. Schakel Message Content Intent in de Discord Developer Portal in.
2. Schakel Server Members Intent in wanneer allowlists voor rollen/gebruikers worden gebruikt.
3. Nodig de bot uit met de scopes `bot` en `applications.commands`.
4. Geef Connect, Speak, Send Messages en Read Message History in het doel-spraakkanaal.
5. Schakel native commando's in (`commands.native` of `channels.discord.commands.native`).
6. Configureer `channels.discord.voice`.

Gebruik `/vc join|leave|status` om sessies te beheren. De opdracht gebruikt de standaardagent van het account en volgt dezelfde allowlist- en groepsbeleidsregels als andere Discord-commando's.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

Om de effectieve rechten van de bot te inspecteren voordat je deelneemt, voer je uit:

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
- `voice.mode` bepaalt het gesprekspad. De standaardwaarde is `agent-proxy`: een realtime spraakfrontend handelt beurt-timing, onderbreking en weergave af, delegeert inhoudelijk werk aan de gerouteerde OpenClaw-agent via `openclaw_agent_consult`, en behandelt het resultaat als een getypte Discord-prompt van die spreker. `stt-tts` behoudt de oudere batch-STT-plus-TTS-flow. `bidi` laat het realtime model rechtstreeks converseren terwijl `openclaw_agent_consult` beschikbaar blijft voor het OpenClaw-brein.
- `voice.agentSession` bepaalt welk OpenClaw-gesprek spraakbeurten ontvangt. Laat dit leeg voor de eigen sessie van het spraakkanaal, of stel `{ mode: "target", target: "channel:<text-channel-id>" }` in om het spraakkanaal te laten fungeren als microfoon-/speaker-uitbreiding van een bestaande Discord-tekstkanaalsessie, zoals `#maintainers`.
- `voice.model` overschrijft het OpenClaw-agentbrein voor Discord-spraakantwoorden en realtime consults. Laat dit leeg om het gerouteerde agentmodel te erven. Dit staat los van `voice.realtime.model`.
- `voice.followUsers` laat de bot Discord-spraak joinen, verplaatsen en verlaten met geselecteerde gebruikers. Zie [Gebruikers volgen in spraak](#follow-users-in-voice) voor gedragsregels en voorbeelden.
- `agent-proxy` routeert spraak via `discord-voice`, wat normale eigenaar-/tool-autorisatie voor de spreker en doelsessie behoudt, maar de agenttool `tts` verbergt omdat Discord-spraak de weergave beheert. Standaard geeft `agent-proxy` het consult volledige tooltoegang equivalent aan de eigenaar voor eigenaars-sprekers (`voice.realtime.toolPolicy: "owner"`) en geeft het sterk de voorkeur aan consultatie van de OpenClaw-agent vóór inhoudelijke antwoorden (`voice.realtime.consultPolicy: "always"`). In die standaardmodus `always` spreekt de realtime laag geen automatische opvulling uit vóór het consultantwoord; hij legt spraak vast en transcribeert die, en spreekt daarna het gerouteerde OpenClaw-antwoord uit. Als meerdere geforceerde consultantwoorden klaar zijn terwijl Discord het eerste antwoord nog afspeelt, worden latere exacte-spraakantwoorden in de wachtrij gezet totdat de weergave inactief is, in plaats van spraak midden in een zin te vervangen.
- In de modus `stt-tts` gebruikt STT `tools.media.audio`; `voice.model` heeft geen invloed op transcriptie.
- In realtime-modi configureren `voice.realtime.provider`, `voice.realtime.model` en `voice.realtime.speakerVoice` de realtime audiosessie. Gebruik voor OpenAI Realtime 2 plus het Codex-brein `voice.realtime.model: "gpt-realtime-2"` en `voice.model: "openai/gpt-5.5"`.
- Realtime spraakmodi nemen standaard kleine profielbestanden `IDENTITY.md`, `USER.md` en `SOUL.md` op in de instructies van de realtime provider, zodat snelle directe beurten dezelfde identiteit, gebruikersgronding en persona behouden als de gerouteerde OpenClaw-agent. Stel `voice.realtime.bootstrapContextFiles` in op een subset om dit aan te passen, of op `[]` om het uit te schakelen. De ondersteunde realtime bootstrapbestanden zijn beperkt tot die profielbestanden; `AGENTS.md` blijft in de normale agentcontext. De geïnjecteerde profielcontext vervangt `openclaw_agent_consult` niet voor werkruimtewerk, actuele feiten, geheugenopzoekingen of acties met toolondersteuning.
- Stel in de OpenAI `agent-proxy` realtime-modus `voice.realtime.requireWakeName: true` in om Discord realtime-spraak stil te houden totdat een transcript begint of eindigt met een weknaam. Geconfigureerde weknamen moeten uit één of twee woorden bestaan. Als `voice.realtime.wakeNames` niet is ingesteld, gebruikt OpenClaw de gerouteerde agent `name` plus `OpenClaw`, met fallback naar de agent-id plus `OpenClaw`. Weknaam-gating schakelt automatische antwoorden van de realtime provider uit, routeert geaccepteerde beurten via het OpenClaw-agentconsultpad en geeft een korte gesproken bevestiging wanneer een leidende weknaam wordt herkend uit gedeeltelijke transcriptie voordat het definitieve transcript arriveert.
- De OpenAI realtime provider accepteert huidige Realtime 2-eventnamen en oudere Codex-compatibele aliassen voor uitvoeraudio- en transcriptevents, zodat compatibele provider-snapshots kunnen afwijken zonder assistentaudio te laten vallen.
- `voice.realtime.bargeIn` bepaalt of Discord-events voor het starten van een spreker actieve realtime weergave onderbreken. Indien niet ingesteld, volgt dit de instelling voor input-audio-onderbreking van de realtime provider.
- `voice.realtime.minBargeInAudioEndMs` bepaalt de minimale duur van assistentweergave voordat een OpenAI realtime barge-in audio afkapt. Standaard: `250`. Stel `0` in voor onmiddellijke onderbreking in ruimtes met weinig echo, of verhoog dit voor speakeropstellingen met veel echo.
- Stel voor een OpenAI-stem op Discord-weergave `voice.tts.provider: "openai"` in en kies een tekst-naar-spraakstem onder `voice.tts.providers.openai.speakerVoice`. `cedar` is een goede mannelijk klinkende keuze op het huidige OpenAI TTS-model.
- Discord-overschrijvingen van `systemPrompt` per kanaal zijn van toepassing op spraaktranscriptbeurten voor dat spraakkanaal.
- Spraaktranscriptbeurten leiden eigenaarsstatus af uit Discord `allowFrom` (of `dm.allowFrom`) voor commando's en kanaalacties met eigenaar-gating. Zichtbaarheid van agenttools volgt het geconfigureerde toolbeleid voor de gerouteerde sessie.
- Discord-spraak is opt-in voor configuraties met alleen tekst; stel `channels.discord.voice.enabled=true` in (of behoud een bestaand `channels.discord.voice`-blok) om `/vc`-commando's, de spraakruntime en de Gateway-intentie `GuildVoiceStates` in te schakelen.
- `channels.discord.intents.voiceStates` kan het abonnement op voice-state-intenties expliciet overschrijven. Laat dit leeg zodat de intentie de effectieve spraakinschakeling volgt.
- Als `voice.autoJoin` meerdere vermeldingen voor dezelfde guild heeft, joint OpenClaw het laatst geconfigureerde kanaal voor die guild.
- `voice.allowedChannels` is een optionele allowlist voor verblijf. Laat dit leeg om `/vc join` toe te staan naar elk geautoriseerd Discord-spraakkanaal. Indien ingesteld, zijn `/vc join`, automatisch joinen bij opstarten en voice-state-verplaatsingen van de bot beperkt tot de vermelde `{ guildId, channelId }`-items. Stel dit in op een lege array om alle Discord-spraakjoins te weigeren. Als Discord de bot buiten de allowlist verplaatst, verlaat OpenClaw dat kanaal en joint opnieuw het geconfigureerde auto-join-doel wanneer er een beschikbaar is.
- `voice.daveEncryption` en `voice.decryptionFailureTolerance` worden doorgegeven aan de join-opties van `@discordjs/voice`.
- De standaardwaarden van `@discordjs/voice` zijn `daveEncryption=true` en `decryptionFailureTolerance=24` indien niet ingesteld.
- OpenClaw gebruikt de gebundelde `libopus-wasm`-codec voor Discord-spraakontvangst en realtime ruwe PCM-weergave. Het levert een vastgezette libopus WebAssembly-build mee en vereist geen native opus-add-ons.
- `voice.connectTimeoutMs` bepaalt de initiële `@discordjs/voice`-Ready-wachttijd voor `/vc join` en auto-join-pogingen. Standaard: `30000`.
- `voice.reconnectGraceMs` bepaalt hoe lang OpenClaw wacht tot een losgekoppelde spraaksessie begint met opnieuw verbinden voordat die wordt vernietigd. Standaard: `15000`.
- In de modus `stt-tts` stopt spraakweergave niet alleen omdat een andere gebruiker begint te spreken. Om feedbacklussen te vermijden, negeert OpenClaw nieuwe spraakopname terwijl TTS wordt afgespeeld; spreek nadat de weergave is voltooid voor de volgende beurt. Realtime-modi sturen het starten van sprekers door als barge-in-signalen naar de realtime provider.
- In realtime-modi kan echo van speakers in een open microfoon eruitzien als barge-in en de weergave onderbreken. Stel voor Discord-ruimtes met veel echo `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` in om te voorkomen dat OpenAI automatisch onderbreekt bij input-audio. Voeg `voice.realtime.bargeIn: true` toe als je nog steeds wilt dat Discord-events voor het starten van een spreker actieve weergave onderbreken. De OpenAI realtime bridge negeert weergaveafkappingen korter dan `voice.realtime.minBargeInAudioEndMs` als waarschijnlijke echo/ruis en logt ze als overgeslagen in plaats van Discord-weergave te wissen.
- `voice.captureSilenceGraceMs` bepaalt hoe lang OpenClaw wacht nadat Discord meldt dat een spreker is gestopt voordat dat audiosegment voor STT wordt afgerond. Standaard: `2000`; verhoog dit als Discord normale pauzes opsplitst in haperige gedeeltelijke transcripties.
- Wanneer ElevenLabs de geselecteerde TTS-provider is, gebruikt Discord-spraakweergave streaming-TTS en start die vanaf de providerresponsstream. Providers zonder streamingondersteuning vallen terug op het pad met een gesynthetiseerd tijdelijk bestand.
- OpenClaw bewaakt ook decryptiefouten bij ontvangst en herstelt automatisch door het spraakkanaal te verlaten en opnieuw te joinen na herhaalde fouten binnen een kort venster.
- Als ontvangstlogs na een update herhaaldelijk `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` tonen, verzamel dan een dependencyrapport en logs. De gebundelde `@discordjs/voice`-lijn bevat de upstream padding-fix uit discord.js PR #11449, die discord.js-issue #11419 sloot.
- Ontvangstevents `The operation was aborted` worden verwacht wanneer OpenClaw een vastgelegd sprekersegment afrondt; het zijn uitgebreide diagnostische meldingen, geen waarschuwingen.
- Uitgebreide Discord-spraaklogs bevatten een begrensde eenregelige STT-transcriptpreview voor elk geaccepteerd sprekersegment, zodat debugging zowel de gebruikerskant als de agentantwoordkant toont zonder onbeperkte transcripttekst te dumpen.
- In de modus `agent-proxy` slaat geforceerde consult-fallback waarschijnlijk onvolledige transcriptfragmenten over, zoals tekst die eindigt op `...` of een afsluitende connector zoals `and`, plus duidelijk niet-actiegerichte afsluitingen zoals “ben zo terug” of “doei”. Logs tonen `forced agent consult skipped reason=...` wanneer dit een verouderd antwoord in de wachtrij voorkomt.

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

- `followUsers` accepteert ruwe Discord-gebruikers-ID's en `discord:<id>`-waarden. OpenClaw normaliseert beide vormen voordat voice-state-events worden gematcht.
- `followUsersEnabled` is standaard `true` wanneer `followUsers` is geconfigureerd. Stel dit in op `false` om de opgeslagen lijst te behouden maar automatisch volgen via spraak te stoppen.
- Wanneer een gevolgde gebruiker een toegestaan spraakkanaal joint, joint OpenClaw dat kanaal. Wanneer de gebruiker verplaatst, verplaatst OpenClaw mee. Wanneer de actieve gevolgde gebruiker de verbinding verbreekt, vertrekt OpenClaw.
- Als meerdere gevolgde gebruikers in dezelfde guild zijn en de actieve gevolgde gebruiker vertrekt, verplaatst OpenClaw naar het kanaal van een andere bijgehouden gevolgde gebruiker voordat de guild wordt verlaten. Als meerdere gevolgde gebruikers tegelijk verplaatsen, wint het laatst waargenomen voice-state-event.
- `allowedChannels` blijft van toepassing. Een gevolgde gebruiker in een niet-toegestaan kanaal wordt genegeerd, en een sessie die eigendom is van volgen verplaatst naar een andere gevolgde gebruiker of vertrekt.
- OpenClaw verzoent gemiste voice-state-events bij het opstarten en met een begrensd interval. Verzoening samplet geconfigureerde guilds en beperkt REST-opzoekingen per run, dus zeer grote `followUsers`-lijsten kunnen meer dan één interval nodig hebben om te convergeren.
- Als Discord of een beheerder de bot verplaatst terwijl die een gebruiker volgt, bouwt OpenClaw de spraaksessie opnieuw op en behoudt het volg-eigenaarschap wanneer de bestemming is toegestaan. Als de bot buiten `allowedChannels` wordt verplaatst, vertrekt OpenClaw en joint opnieuw het geconfigureerde doel wanneer er een bestaat.
- DAVE-ontvangstherstel kan hetzelfde kanaal verlaten en opnieuw joinen na herhaalde decryptiefouten. Sessie-eigenaarschap door volgen blijft behouden via dat herstelpad, zodat een latere verbreking door de gevolgde gebruiker het kanaal nog steeds verlaat.

Kies tussen de join-modi:

- Gebruik `followUsers` voor persoonlijke of operatoropstellingen waarbij de bot automatisch in spraak moet zijn wanneer jij dat bent.
- Gebruik `autoJoin` voor bots in vaste ruimtes die aanwezig moeten zijn, zelfs wanneer er geen bijgehouden gebruiker in spraak is.
- Gebruik `/vc join` voor eenmalige joins of ruimtes waar automatische aanwezigheid in spraak onverwacht zou zijn.

Discord-spraakcodec:

- Logs voor spraakontvangst tonen `discord voice: opus decoder: libopus-wasm`.
- Realtime-weergave codeert ruwe 48 kHz stereo-PCM naar Opus met hetzelfde meegeleverde `libopus-wasm`-pakket voordat pakketten aan `@discordjs/voice` worden doorgegeven.
- Weergave van bestanden en provider-streams transcodeert met ffmpeg naar ruwe 48 kHz stereo-PCM en gebruikt daarna `libopus-wasm` voor de Opus-pakketstream die naar Discord wordt verzonden.

STT- plus TTS-pijplijn:

- Discord PCM-opname wordt omgezet naar een tijdelijk WAV-bestand.
- `tools.media.audio` handelt STT af, bijvoorbeeld `openai/gpt-4o-mini-transcribe`.
- Het transcript wordt via Discord-ingress en routering verzonden terwijl de reactie-LLM draait met een spraakuitvoerbeleid dat de agent-tool `tts` verbergt en om geretourneerde tekst vraagt, omdat Discord-spraak eigenaar is van de uiteindelijke TTS-weergave.
- `voice.model`, wanneer ingesteld, overschrijft alleen de reactie-LLM voor deze spraakkanaalbeurt.
- `voice.tts` wordt over `messages.tts` samengevoegd; providers die streaming ondersteunen voeden de speler direct, anders wordt het resulterende audiobestand afgespeeld in het kanaal waaraan is deelgenomen.

Voorbeeld van standaard agent-proxy-spraakkanaalsessie:

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

Zonder `voice.agentSession`-blok krijgt elk spraakkanaal zijn eigen gerouteerde OpenClaw-sessie. Bijvoorbeeld: `/vc join channel:234567890123456789` praat met de sessie voor dat Discord-spraakkanaal. Het realtime-model is alleen de spraakfront-end; inhoudelijke verzoeken worden doorgegeven aan de geconfigureerde OpenClaw-agent. Als het realtime-model een definitief transcript produceert zonder de consult-tool aan te roepen, forceert OpenClaw de consult als fallback zodat de standaard nog steeds aanvoelt alsof je met de agent praat.

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

Voorbeeld van realtime bidi:

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

In `agent-proxy`-modus neemt de bot deel aan het geconfigureerde spraakkanaal, maar OpenClaw-agentbeurten gebruiken de normale gerouteerde sessie en agent van het doelkanaal. De realtime-spraaksessie spreekt het geretourneerde resultaat terug in het spraakkanaal. De supervisor-agent kan nog steeds normale berichttools gebruiken volgens zijn toolbeleid, inclusief het verzenden van een apart Discord-bericht als dat de juiste actie is.

Terwijl een gedelegeerde OpenClaw-run actief is, worden nieuwe Discord-spraaktranscripten behandeld als live runbesturing voordat een andere agentbeurt wordt gestart. Zinnen zoals "status", "cancel that", "use the smaller fix" of "when you're done also check tests" worden geclassificeerd als status-, annuleer-, sturings- of follow-upinvoer voor de actieve sessie. Status-, annuleer-, geaccepteerde sturings- en follow-upuitkomsten worden terug uitgesproken in het spraakkanaal, zodat de beller weet of OpenClaw het verzoek heeft afgehandeld.

Nuttige doelvormen:

- `target: "channel:123456789012345678"` routeert via een Discord-tekstkanaalsessie.
- `target: "123456789012345678"` wordt behandeld als een kanaaldoel.
- `target: "dm:123456789012345678"` of `target: "user:123456789012345678"` routeert via die direct-message-sessie.

Voorbeeld van echo-gevoelige OpenAI Realtime:

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

Gebruik dit wanneer het model zijn eigen Discord-weergave via een open microfoon hoort, maar je het nog steeds wilt kunnen onderbreken door te spreken. OpenClaw voorkomt dat OpenAI automatisch onderbreekt op ruwe invoeraudio, terwijl `bargeIn: true` ervoor zorgt dat Discord-gebeurtenissen voor startende sprekers en al actieve spreker-audio actieve realtime-reacties kunnen annuleren voordat de volgende vastgelegde beurt OpenAI bereikt. Zeer vroege barge-in-signalen met `audioEndMs` onder `minBargeInAudioEndMs` worden behandeld als waarschijnlijke echo/ruis en genegeerd, zodat het model niet wordt afgekapt bij het eerste weergaveframe.

Verwachte spraaklogs:

- Bij deelnemen: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- Bij realtime-start: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- Bij spreker-audio: `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...`, en `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- Bij overgeslagen verouderde spraak: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` of `reason=non-actionable-closing ...`
- Bij voltooiing van realtime-reactie: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- Bij stoppen/resetten van weergave: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- Bij realtime-consult: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- Bij agentantwoord: `discord voice: agent turn answer ...`
- Bij exact geplaatste spraak in de wachtrij: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`, gevolgd door `discord voice: realtime exact speech dequeued reason=player-idle ...`
- Bij barge-in-detectie: `discord voice: realtime barge-in detected source=speaker-start ...` of `discord voice: realtime barge-in detected source=active-speaker-audio ...`, gevolgd door `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- Bij realtime-onderbreking: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`, gevolgd door ofwel `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` of `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- Bij genegeerde echo/ruis: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- Bij uitgeschakelde barge-in: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- Bij inactieve weergave: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

Lees de realtime-spraaklogs als een tijdlijn om afgekapt geluid te debuggen:

1. `realtime audio playback started` betekent dat Discord is begonnen met het afspelen van assistent-audio. De bridge begint vanaf dit punt assistent-uitvoerchunks, Discord PCM-bytes, provider-realtime-bytes en gesynthetiseerde audioduur te tellen.
2. `realtime speaker turn opened` markeert dat een Discord-spreker actief wordt. Als weergave al actief is en `bargeIn` is ingeschakeld, kan dit worden gevolgd door `barge-in detected source=speaker-start`.
3. `realtime input audio started` markeert het eerste daadwerkelijke audioframe dat voor die sprekerbeurt is ontvangen. `outputActive=true` of een niet-nulwaarde voor `outputAudioMs` hier betekent dat de microfoon invoer verzendt terwijl assistent-weergave nog actief is.
4. `barge-in detected source=active-speaker-audio` betekent dat OpenClaw live spreker-audio zag terwijl assistent-weergave actief was. Dit is nuttig om een echte onderbreking te onderscheiden van een Discord-gebeurtenis voor een startende spreker zonder bruikbare audio.
5. `barge-in requested reason=...` betekent dat OpenClaw de realtime-provider heeft gevraagd de actieve reactie te annuleren of af te kappen. Het bevat `outputAudioMs`, `outputActive` en `playbackChunks`, zodat je kunt zien hoeveel assistent-audio daadwerkelijk was afgespeeld vóór de onderbreking.
6. `realtime audio playback stopped reason=...` is het lokale resetpunt voor Discord-weergave. De reden zegt wie de weergave heeft gestopt: `barge-in`, `player-idle`, `provider-clear-audio`, `forced-agent-consult`, `stream-close` of `session-close`.
7. `realtime speaker turn closed` vat de vastgelegde invoerbeurt samen. `chunks=0` of `hasAudio=false` betekent dat de sprekerbeurt werd geopend, maar dat er geen bruikbare audio de realtime-bridge bereikte. `interruptedPlayback=true` betekent dat die invoerbeurt overlapte met assistent-uitvoer en barge-in-logica activeerde.

Nuttige velden:

- `outputAudioMs`: assistent-audioduur die door de realtime-provider is gegenereerd vóór de logregel.
- `audioMs`: assistent-audioduur die OpenClaw heeft geteld voordat de weergave stopte.
- `elapsedMs`: kloktijd tussen het openen en sluiten van de weergavestream of sprekerbeurt.
- `discordBytes`: 48 kHz stereo-PCM-bytes verzonden naar of ontvangen van Discord-spraak.
- `realtimeBytes`: PCM-bytes in providerformaat verzonden naar of ontvangen van de realtime-provider.
- `playbackChunks`: assistent-audiochunks doorgestuurd naar Discord voor de actieve reactie.
- `sinceLastAudioMs`: gat tussen het laatste vastgelegde spreker-audioframe en het sluiten van de sprekerbeurt.

Veelvoorkomende patronen:

- Direct afkappen met `source=active-speaker-audio`, kleine `outputAudioMs` en dezelfde gebruiker in de buurt wijst meestal op speakerecho die de microfoon binnenkomt. Verhoog `voice.realtime.minBargeInAudioEndMs`, verlaag het speakervolume, gebruik een koptelefoon of stel `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` in.
- `source=speaker-start` gevolgd door `speaker turn closed ... hasAudio=false` betekent dat Discord een sprekerstart meldde, maar dat er geen audio OpenClaw bereikte. Dat kan een tijdelijke Discord-spraakgebeurtenis zijn, gedrag van een noise gate of een client die de microfoon kort activeert.
- `audio playback stopped reason=stream-close` zonder nabije barge-in of `provider-clear-audio` betekent dat de lokale Discord-weergavestream onverwacht is geëindigd. Controleer de voorafgaande provider- en Discord-spelerlogs.
- `capture ignored during playback (barge-in disabled)` betekent dat OpenClaw invoer bewust heeft laten vallen terwijl assistent-audio actief was. Schakel `voice.realtime.bargeIn` in als je wilt dat spraak de weergave onderbreekt.
- `barge-in ignored ... outputActive=false` betekent dat Discord of provider-VAD spraak meldde, maar dat OpenClaw geen actieve weergave had om te onderbreken. Dit zou audio niet moeten afkappen.

Referenties worden per component opgelost: LLM-routeauthenticatie voor `voice.model`, STT-authenticatie voor `tools.media.audio`, TTS-authenticatie voor `messages.tts`/`voice.tts` en realtime-provider-authenticatie voor `voice.realtime.providers` of de normale authenticatieconfiguratie van de provider.

### Spraakberichten

Discord-spraakberichten tonen een golfvormvoorbeeld en vereisen OGG/Opus-audio. OpenClaw genereert de golfvorm automatisch, maar heeft `ffmpeg` en `ffprobe` op de gateway-host nodig om te inspecteren en te converteren.

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
    - herstart Gateway na het wijzigen van intents

  </Accordion>

  <Accordion title="Guild messages blocked unexpectedly">

    - controleer `groupPolicy`
    - controleer de guild-allowlist onder `channels.discord.guilds`
    - als de `channels`-map van de guild bestaat, zijn alleen vermelde kanalen toegestaan
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
    - `requireMention` is op de verkeerde plaats geconfigureerd (moet onder `channels.discord.guilds` of de kanaalvermelding staan)
    - afzender geblokkeerd door de guild-/kanaal-allowlist `users`

  </Accordion>

  <Accordion title="Long-running Discord turns or duplicate replies">

    Typische logs:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Instellingen voor de Discord Gateway-wachtrij:

    - enkel account: `channels.discord.eventQueue.listenerTimeout`
    - meerdere accounts: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - dit regelt alleen listenerwerk van de Discord Gateway, niet de levensduur van een agentbeurt

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
    OpenClaw haalt Discord `/gateway/bot`-metadata op voordat er verbinding wordt gemaakt. Tijdelijke fouten vallen terug op Discord's standaard-Gateway-URL en worden in logs rate-limited.

    Metadata-timeoutinstellingen:

    - enkel account: `channels.discord.gatewayInfoTimeoutMs`
    - meerdere accounts: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - env-fallback wanneer configuratie niet is ingesteld: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - standaard: `30000` (30 seconden), max: `120000`

  </Accordion>

  <Accordion title="Gateway READY timeout restarts">
    OpenClaw wacht tijdens het opstarten en na runtime-herverbindingen op Discord's Gateway-`READY`-event. Setups met meerdere accounts en opstartspreiding kunnen een langer READY-opstartvenster nodig hebben dan de standaardwaarde.

    READY-timeoutinstellingen:

    - opstarten met enkel account: `channels.discord.gatewayReadyTimeoutMs`
    - opstarten met meerdere accounts: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - env-fallback bij opstarten wanneer configuratie niet is ingesteld: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - standaard bij opstarten: `15000` (15 seconden), max: `120000`
    - runtime met enkel account: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - runtime met meerdere accounts: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - env-fallback tijdens runtime wanneer configuratie niet is ingesteld: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - runtime-standaard: `30000` (30 seconden), max: `120000`

  </Accordion>

  <Accordion title="Permissions audit mismatches">
    Machtigingscontroles met `channels status --probe` werken alleen voor numerieke kanaal-ID's.

    Als je slug-sleutels gebruikt, kan runtime-matching nog steeds werken, maar de probe kan machtigingen niet volledig verifiëren.

  </Accordion>

  <Accordion title="DM and pairing issues">

    - DM uitgeschakeld: `channels.discord.dm.enabled=false`
    - DM-beleid uitgeschakeld: `channels.discord.dmPolicy="disabled"` (legacy: `channels.discord.dm.policy`)
    - wacht op pairing-goedkeuring in `pairing`-modus

  </Accordion>

  <Accordion title="Bot to bot loops">
    Standaard worden berichten die door bots zijn geschreven genegeerd.

    Als je `channels.discord.allowBots=true` instelt, gebruik dan strikte vermeldings- en allowlist-regels om lusgedrag te voorkomen.
    Geef de voorkeur aan `channels.discord.allowBots="mentions"` om alleen botberichten te accepteren die de bot vermelden.

    OpenClaw levert ook gedeelde [botlusbescherming](/nl/channels/bot-loop-protection). Wanneer `allowBots` ervoor zorgt dat door bots geschreven berichten de dispatch bereiken, koppelt Discord het inkomende event aan `(account, channel, bot pair)`-feiten en onderdrukt de generieke paarbewaking het paar nadat het het geconfigureerde eventbudget overschrijdt. De bewaking voorkomt op hol geslagen lussen tussen twee bots die eerder door Discord-rate limits moesten worden gestopt; dit heeft geen invloed op implementaties met één bot of eenmalige botantwoorden die onder het budget blijven.

    Standaardinstellingen (actief wanneer `allowBots` is ingesteld):

    - `maxEventsPerWindow: 20` -- botpaar kan binnen het schuivende venster 20 berichten uitwisselen
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

    - houd OpenClaw actueel (`openclaw update`) zodat de herstellogica voor Discord-spraakontvangst aanwezig is
    - bevestig `channels.discord.voice.daveEncryption=true` (standaard)
    - begin met `channels.discord.voice.decryptionFailureTolerance=24` (upstream-standaard) en stem alleen af indien nodig
    - bekijk logs voor:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - als fouten na automatisch opnieuw deelnemen blijven optreden, verzamel logs en vergelijk ze met de upstream DAVE-ontvangstgeschiedenis in [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) en [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Configuratiereferentie

Primaire referentie: [Configuratiereferentie - Discord](/nl/gateway/config-channels#discord).

<Accordion title="High-signal Discord fields">

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
- presence: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- functies: `threadBindings`, top-level `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents.enabled`, `agentComponents.ttlMs`, `heartbeat`, `responsePrefix`

</Accordion>

## Veiligheid en beheer

- Behandel bottokens als geheimen (`DISCORD_BOT_TOKEN` heeft de voorkeur in bewaakte omgevingen).
- Verleen Discord-machtigingen met minimale rechten.
- Als opdrachtdeploy/-status verouderd is, herstart Gateway en controleer opnieuw met `openclaw channels status --probe`.

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/nl/channels/pairing">
    Koppel een Discord-gebruiker aan de Gateway.
  </Card>
  <Card title="Groups" icon="users" href="/nl/channels/groups">
    Gedrag voor groepschat en allowlists.
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
    Native opdrachtgedrag.
  </Card>
</CardGroup>
