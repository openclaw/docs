---
read_when:
    - Werken aan functies voor het Discord-kanaal
summary: Ondersteuningsstatus, mogelijkheden en configuratie van de Discord-bot
title: Discord
x-i18n:
    generated_at: "2026-05-01T11:14:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 43fdd86a45a815cfef7ab71746c9ca5966f76df3c9da4f18204bf5d0f59f6352
    source_path: channels/discord.md
    workflow: 16
---

Gereed voor DM's en guild-kanalen via de officiële Discord Gateway.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/nl/channels/pairing">
    Discord-DM's staan standaard in koppelingsmodus.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/nl/tools/slash-commands">
    Native commandogedrag en commandocatalogus.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/nl/channels/troubleshooting">
    Diagnose en herstelproces voor meerdere kanalen.
  </Card>
</CardGroup>

## Snelle configuratie

Je moet een nieuwe toepassing met een bot maken, de bot aan je server toevoegen en deze koppelen aan OpenClaw. We raden aan je bot toe te voegen aan je eigen privéserver. Als je er nog geen hebt, [maak er eerst een aan](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (kies **Create My Own > For me and my friends**).

<Steps>
  <Step title="Create a Discord application and bot">
    Ga naar de [Discord Developer Portal](https://discord.com/developers/applications) en klik op **New Application**. Geef deze een naam zoals "OpenClaw".

    Klik op **Bot** in de zijbalk. Stel de **Username** in op hoe je je OpenClaw-agent noemt.

  </Step>

  <Step title="Enable privileged intents">
    Blijf op de pagina **Bot**, scrol omlaag naar **Privileged Gateway Intents** en schakel in:

    - **Message Content Intent** (vereist)
    - **Server Members Intent** (aanbevolen; vereist voor rol-allowlists en koppeling van naam naar ID)
    - **Presence Intent** (optioneel; alleen nodig voor aanwezigheidsupdates)

  </Step>

  <Step title="Copy your bot token">
    Scrol weer omhoog op de pagina **Bot** en klik op **Reset Token**.

    <Note>
    Ondanks de naam genereert dit je eerste token — er wordt niets "gereset".
    </Note>

    Kopieer het token en bewaar het ergens. Dit is je **Bot Token** en je hebt het zo nodig.

  </Step>

  <Step title="Generate an invite URL and add the bot to your server">
    Klik op **OAuth2** in de zijbalk. Je genereert een uitnodigings-URL met de juiste machtigingen om de bot aan je server toe te voegen.

    Scrol omlaag naar **OAuth2 URL Generator** en schakel in:

    - `bot`
    - `applications.commands`

    Daaronder verschijnt een sectie **Bot Permissions**. Schakel minimaal in:

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (optioneel)

    Dit is de basisset voor normale tekstkanalen. Als je van plan bent in Discord-threads te posten, inclusief workflows voor forum- of mediakanalen die een thread maken of voortzetten, schakel dan ook **Send Messages in Threads** in.
    Kopieer de gegenereerde URL onderaan, plak deze in je browser, selecteer je server en klik op **Continue** om te verbinden. Je zou je bot nu in de Discord-server moeten zien.

  </Step>

  <Step title="Enable Developer Mode and collect your IDs">
    Terug in de Discord-app moet je Developer Mode inschakelen zodat je interne ID's kunt kopiëren.

    1. Klik op **User Settings** (tandwielpictogram naast je avatar) → **Advanced** → schakel **Developer Mode** in
    2. Klik met de rechtermuisknop op je **server icon** in de zijbalk → **Copy Server ID**
    3. Klik met de rechtermuisknop op je **own avatar** → **Copy User ID**

    Bewaar je **Server ID** en **User ID** naast je Bot Token — je stuurt ze alle drie in de volgende stap naar OpenClaw.

  </Step>

  <Step title="Allow DMs from server members">
    Om koppelen te laten werken, moet Discord toestaan dat je bot je een DM stuurt. Klik met de rechtermuisknop op je **server icon** → **Privacy Settings** → schakel **Direct Messages** in.

    Hierdoor kunnen serverleden (inclusief bots) je DM's sturen. Laat dit ingeschakeld als je Discord-DM's met OpenClaw wilt gebruiken. Als je alleen guild-kanalen wilt gebruiken, kun je DM's na het koppelen uitschakelen.

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

    Als OpenClaw al als achtergrondservice draait, herstart deze dan via de OpenClaw Mac-app of door het proces `openclaw gateway run` te stoppen en opnieuw te starten.
    Voor beheerde service-installaties voer je `openclaw gateway install` uit vanuit een shell waarin `DISCORD_BOT_TOKEN` aanwezig is, of sla je de variabele op in `~/.openclaw/.env`, zodat de service de env SecretRef na een herstart kan oplossen.
    Als je host wordt geblokkeerd of beperkt door Discords opzoekactie voor de opstarttoepassing, stel dan de Discord-application/client-ID uit de Developer Portal in zodat de opstart die REST-call kan overslaan. Gebruik `channels.discord.applicationId` voor het standaardaccount, of `channels.discord.accounts.<accountId>.applicationId` wanneer je meerdere Discord-bots uitvoert.

  </Step>

  <Step title="Configure OpenClaw and pair">

    <Tabs>
      <Tab title="Ask your agent">
        Chat met je OpenClaw-agent op een bestaand kanaal (bijv. Telegram) en vertel het hem. Als Discord je eerste kanaal is, gebruik dan in plaats daarvan het tabblad CLI / config.

        > "Ik heb mijn Discord-bottoken al in de configuratie ingesteld. Rond de Discord-configuratie af met User ID `<user_id>` en Server ID `<server_id>`."
      </Tab>
      <Tab title="CLI / config">
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

        Voor gescripte of externe configuratie schrijf je hetzelfde JSON5-blok met `openclaw config patch --file ./discord.patch.json5 --dry-run` en voer je het daarna opnieuw uit zonder `--dry-run`. Plattetekstwaarden voor `token` worden ondersteund. SecretRef-waarden worden ook ondersteund voor `channels.discord.token` via env/file/exec-providers. Zie [Secrets Management](/nl/gateway/secrets).

        Voor meerdere Discord-bots houd je elk bottoken en elke application ID onder het bijbehorende account. Een bovenliggende `channels.discord.applicationId` wordt door accounts overgenomen, dus stel deze daar alleen in wanneer elk account dezelfde application ID moet gebruiken.

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

    Je zou nu via DM met je agent in Discord moeten kunnen chatten.

  </Step>
</Steps>

<Note>
Tokenresolutie is accountbewust. Configuratietokenwaarden winnen van env-fallback. `DISCORD_BOT_TOKEN` wordt alleen gebruikt voor het standaardaccount.
Als twee ingeschakelde Discord-accounts naar hetzelfde bottoken oplossen, start OpenClaw slechts één Gateway-monitor voor dat token. Een token uit de configuratie wint van de standaard env-fallback; anders wint het eerste ingeschakelde account en wordt het dubbele account als uitgeschakeld gerapporteerd.
Voor geavanceerde uitgaande calls (berichttool/kanaalacties) wordt voor die call een expliciete `token` per call gebruikt. Dit geldt voor verzend- en lees/probe-achtige acties (bijvoorbeeld read/search/fetch/thread/pins/permissions). Accountbeleid en retry-instellingen komen nog steeds uit het geselecteerde account in de actieve runtime-snapshot.
</Note>

## Aanbevolen: stel een guild-werkruimte in

Zodra DM's werken, kun je je Discord-server instellen als volledige werkruimte waarin elk kanaal zijn eigen agentsessie met eigen context krijgt. Dit wordt aanbevolen voor privéservers waar alleen jij en je bot aanwezig zijn.

<Steps>
  <Step title="Add your server to the guild allowlist">
    Hierdoor kan je agent in elk kanaal op je server reageren, niet alleen in DM's.

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

    In guild-kanalen blijven normale definitieve assistentantwoorden standaard privé. Zichtbare Discord-uitvoer moet expliciet met de `message`-tool worden verzonden, zodat de agent standaard kan meelezen en alleen post wanneer hij besluit dat een kanaalantwoord nuttig is.

    <Tabs>
      <Tab title="Ask your agent">
        > "Sta mijn agent toe op deze server te reageren zonder dat hij met @ hoeft te worden genoemd"
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
    Standaard wordt langetermijngeheugen (MEMORY.md) alleen in DM-sessies geladen. Guild-kanalen laden MEMORY.md niet automatisch.

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

Maak nu enkele kanalen op je Discord-server en begin met chatten. Je agent kan de kanaalnaam zien, en elk kanaal krijgt zijn eigen geïsoleerde sessie — zodat je `#coding`, `#home`, `#research` of wat dan ook bij je workflow past kunt instellen.

## Runtimemodel

- Gateway beheert de Discord-verbinding.
- Reply-routing is deterministisch: binnenkomende Discord-antwoorden gaan terug naar Discord.
- Metadata van Discord-servers en -kanalen wordt aan de modelprompt toegevoegd als onvertrouwde
  context, niet als een voor gebruikers zichtbaar antwoordprefix. Als een model die envelop
  terugkopieert, verwijdert OpenClaw de gekopieerde metadata uit uitgaande antwoorden en uit
  toekomstige replay-context.
- Standaard (`session.dmScope=main`) delen directe chats de hoofdsessie van de agent (`agent:main:main`).
- Serverkanalen zijn geisoleerde sessiesleutels (`agent:<agentId>:discord:channel:<channelId>`).
- Groeps-DM's worden standaard genegeerd (`channels.discord.dm.groupEnabled=false`).
- Native slash commands worden uitgevoerd in geisoleerde commandosessies (`agent:<agentId>:discord:slash:<userId>`), terwijl ze nog steeds `CommandTargetSessionKey` meenemen naar de gerouteerde gesprekssessie.
- Tekst-only cron/heartbeat-aankondigingslevering aan Discord gebruikt het uiteindelijke
  voor de assistant zichtbare antwoord eenmalig. Media en gestructureerde componentpayloads blijven
  uit meerdere berichten bestaan wanneer de agent meerdere leverbare payloads uitzendt.

## Forumkanalen

Discord-forum- en mediakanalen accepteren alleen threadposts. OpenClaw ondersteunt twee manieren om ze te maken:

- Stuur een bericht naar de forumbovenliggende (`channel:<forumId>`) om automatisch een thread te maken. De threadtitel gebruikt de eerste niet-lege regel van je bericht.
- Gebruik `openclaw message thread create` om direct een thread te maken. Geef geen `--message-id` door voor forumkanalen.

Voorbeeld: stuur naar de forumbovenliggende om een thread te maken

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Voorbeeld: maak expliciet een forumthread

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Forumbovenliggende kanalen accepteren geen Discord-componenten. Als je componenten nodig hebt, stuur dan naar de thread zelf (`channel:<threadId>`).

## Interactieve componenten

OpenClaw ondersteunt Discord-components v2-containers voor agentberichten. Gebruik de berichttool met een `components`-payload. Interactieresultaten worden terug naar de agent gerouteerd als normale binnenkomende berichten en volgen de bestaande Discord-instellingen voor `replyToMode`.

Ondersteunde blokken:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Actierijen staan maximaal 5 knoppen of een enkel selectiemenu toe
- Selectietypen: `string`, `user`, `role`, `mentionable`, `channel`

Standaard zijn componenten eenmalig te gebruiken. Stel `components.reusable=true` in om knoppen, selecties en formulieren meerdere keren te kunnen gebruiken totdat ze verlopen.

Om te beperken wie op een knop kan klikken, stel je `allowedUsers` in op die knop (Discord-gebruikers-ID's, tags of `*`). Wanneer dit is geconfigureerd, ontvangen niet-overeenkomende gebruikers een ephemeral weigering.

De `/model`- en `/models`-slash commands openen een interactieve modelkiezer met provider-, model- en compatibele runtime-dropdowns plus een indienstap. `/models add` is verouderd en retourneert nu een verouderingsbericht in plaats van modellen vanuit chat te registreren. Het antwoord van de kiezer is ephemeral en alleen de aanroepende gebruiker kan het gebruiken.

Bestandsbijlagen:

- `file`-blokken moeten verwijzen naar een bijlagereferentie (`attachment://<filename>`)
- Lever de bijlage via `media`/`path`/`filePath` (een enkel bestand); gebruik `media-gallery` voor meerdere bestanden
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

## Toegangsbeheer en routing

<Tabs>
  <Tab title="DM-beleid">
    `channels.discord.dmPolicy` beheert DM-toegang. `channels.discord.allowFrom` is de canonieke DM-toestaanlijst.

    - `pairing` (standaard)
    - `allowlist`
    - `open` (vereist dat `channels.discord.allowFrom` `"*"` bevat)
    - `disabled`

    Als het DM-beleid niet open is, worden onbekende gebruikers geblokkeerd (of gevraagd om te koppelen in de modus `pairing`).

    Prioriteit bij meerdere accounts:

    - `channels.discord.accounts.default.allowFrom` geldt alleen voor het `default`-account.
    - Voor een account heeft `allowFrom` voorrang op legacy `dm.allowFrom`.
    - Benoemde accounts erven `channels.discord.allowFrom` wanneer hun eigen `allowFrom` en legacy `dm.allowFrom` niet zijn ingesteld.
    - Benoemde accounts erven `channels.discord.accounts.default.allowFrom` niet.

    Legacy `channels.discord.dm.policy` en `channels.discord.dm.allowFrom` worden nog steeds gelezen voor compatibiliteit. `openclaw doctor --fix` migreert ze naar `dmPolicy` en `allowFrom` wanneer dat kan zonder de toegang te wijzigen.

    DM-doelformaat voor levering:

    - `user:<id>`
    - `<@id>`-vermelding

    Kale numerieke ID's worden normaal gesproken als kanaal-ID's opgelost wanneer een kanaalstandaard actief is, maar ID's die in de effectieve DM-`allowFrom` van het account staan, worden voor compatibiliteit behandeld als gebruikers-DM-doelen.

  </Tab>

  <Tab title="Serverbeleid">
    Serverafhandeling wordt beheerd door `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    De beveiligde basislijn wanneer `channels.discord` bestaat, is `allowlist`.

    Gedrag van `allowlist`:

    - server moet overeenkomen met `channels.discord.guilds` (`id` heeft de voorkeur, slug wordt geaccepteerd)
    - optionele afzender-toestaanlijsten: `users` (stabiele ID's aanbevolen) en `roles` (alleen rol-ID's); als een van beide is geconfigureerd, zijn afzenders toegestaan wanneer ze overeenkomen met `users` OF `roles`
    - directe naam-/tagmatching is standaard uitgeschakeld; schakel `channels.discord.dangerouslyAllowNameMatching: true` alleen in als break-glass-compatibiliteitsmodus
    - namen/tags worden ondersteund voor `users`, maar ID's zijn veiliger; `openclaw security audit` waarschuwt wanneer naam-/tagvermeldingen worden gebruikt
    - als een server `channels` heeft geconfigureerd, worden niet-vermelde kanalen geweigerd
    - als een server geen `channels`-blok heeft, zijn alle kanalen in die toegestane server toegestaan

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

    Als je alleen `DISCORD_BOT_TOKEN` instelt en geen `channels.discord`-blok maakt, is de runtimefallback `groupPolicy="allowlist"` (met een waarschuwing in logs), zelfs als `channels.defaults.groupPolicy` `open` is.

  </Tab>

  <Tab title="Vermeldingen en groeps-DM's">
    Serverberichten vereisen standaard een vermelding.

    Vermeldingsdetectie omvat:

    - expliciete botvermelding
    - geconfigureerde vermeldingspatronen (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - impliciet antwoord-op-bot-gedrag in ondersteunde gevallen

    `requireMention` wordt per server/kanaal geconfigureerd (`channels.discord.guilds...`).
    `ignoreOtherMentions` laat optioneel berichten vallen die een andere gebruiker/rol vermelden maar niet de bot (met uitzondering van @everyone/@here).

    Groeps-DM's:

    - standaard: genegeerd (`dm.groupEnabled=false`)
    - optionele toestaanlijst via `dm.groupChannels` (kanaal-ID's of slugs)

  </Tab>
</Tabs>

### Rolgebaseerde agentrouting

Gebruik `bindings[].match.roles` om Discord-serverleden op basis van rol-ID naar verschillende agents te routeren. Rolgebaseerde bindings accepteren alleen rol-ID's en worden gevalueerd na peer- of parent-peer-bindings en voor server-only bindings. Als een binding ook andere matchvelden instelt (bijvoorbeeld `peer` + `guildId` + `roles`), moeten alle geconfigureerde velden overeenkomen.

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

## Native commands en commando-auth

- `commands.native` staat standaard op `"auto"` en is ingeschakeld voor Discord.
- Overschrijving per kanaal: `channels.discord.commands.native`.
- `commands.native=false` wist expliciet eerder geregistreerde Discord native commands.
- Auth voor native commands gebruikt dezelfde Discord-toestaanlijsten/beleidsregels als normale berichtafhandeling.
- Commando's kunnen nog steeds zichtbaar zijn in de Discord-UI voor gebruikers die niet geautoriseerd zijn; uitvoering dwingt nog steeds OpenClaw-auth af en retourneert "not authorized".

Zie [Slash commands](/nl/tools/slash-commands) voor de commandocatalogus en het gedrag.

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

    Opmerking: `off` schakelt impliciete antwoord-threading uit. Expliciete `[[reply_to_*]]`-tags worden nog steeds gehonoreerd.
    `first` koppelt altijd de impliciete native antwoordreferentie aan het eerste uitgaande Discord-bericht voor de beurt.
    `batched` koppelt de impliciete native antwoordreferentie van Discord alleen wanneer de
    binnenkomende beurt een gedebouncete batch van meerdere berichten was. Dit is nuttig
    wanneer je native antwoorden vooral wilt voor ambigue, bursty chats, niet voor elke
    beurt met een enkel bericht.

    Bericht-ID's worden in context/geschiedenis beschikbaar gemaakt zodat agents specifieke berichten kunnen targeten.

  </Accordion>

  <Accordion title="Live-streamvoorbeeld">
    OpenClaw kan conceptantwoorden streamen door een tijdelijk bericht te sturen en dit te bewerken terwijl tekst binnenkomt. `channels.discord.streaming` accepteert `off` (standaard) | `partial` | `block` | `progress`. `progress` wordt op Discord gemapt naar `partial`; `streamMode` is een legacy alias en wordt automatisch gemigreerd.

    De standaard blijft `off` omdat Discord-voorbeeldbewerkingen snel rate limits raken wanneer meerdere bots of gateways een account delen.

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

    - `partial` bewerkt een enkel voorbeeldbericht terwijl tokens binnenkomen.
    - `block` zendt chunks ter conceptgrootte uit (gebruik `draftChunk` om grootte en breekpunten af te stemmen, begrensd tot `textChunkLimit`).
    - Media, fouten en expliciete-antwoordfinals annuleren wachtende voorbeeldbewerkingen.
    - `streaming.preview.toolProgress` (standaard `true`) bepaalt of tool-/voortgangsupdates het voorbeeldbericht hergebruiken.

    Voorbeeldstreaming is alleen tekst; media-antwoorden vallen terug op normale levering. Wanneer `block`-streaming expliciet is ingeschakeld, slaat OpenClaw de voorbeeldstream over om dubbel streamen te voorkomen.

  </Accordion>

  <Accordion title="Geschiedenis, context en threadgedrag">
    Geschiedeniscontext voor servers:

    - `channels.discord.historyLimit` standaard `20`
    - fallback: `messages.groupChat.historyLimit`
    - `0` schakelt uit

    DM-geschiedenisbeheer:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Threadgedrag:

    - Discord-threads routeren als kanaalsessies en erven de configuratie van het bovenliggende kanaal, tenzij overschreven.
    - Threadsessies erven de sessieniveau-`/model`-selectie van het bovenliggende kanaal als terugval uitsluitend voor het model; threadlokale `/model`-selecties hebben nog steeds voorrang en de transcriptgeschiedenis van de bovenliggende sessie wordt niet gekopieerd tenzij transcriptovererving is ingeschakeld.
    - `channels.discord.thread.inheritParent` (standaard `false`) laat nieuwe auto-threads initialiseren vanuit het bovenliggende transcript. Overrides per account staan onder `channels.discord.accounts.<id>.thread.inheritParent`.
    - Reacties van berichttools kunnen `user:<id>`-DM-doelen omzetten.
    - `guilds.<guild>.channels.<channel>.requireMention: false` blijft behouden tijdens terugval voor activatie in de antwoordfase.

    Kanaalonderwerpen worden geïnjecteerd als **niet-vertrouwde** context. Allowlists bepalen wie de agent kan activeren, niet een volledige redactiegrens voor aanvullende context.

  </Accordion>

  <Accordion title="Threadgebonden sessies voor subagents">
    Discord kan een thread aan een sessiedoel binden, zodat vervolgberichten in die thread naar dezelfde sessie blijven routeren (inclusief subagentsessies).

    Commando's:

    - `/focus <target>` bind huidige/nieuwe thread aan een subagent-/sessiedoel
    - `/unfocus` verwijder huidige threadbinding
    - `/agents` toon actieve runs en bindingsstatus
    - `/session idle <duration|off>` inspecteer/update auto-unfocus bij inactiviteit voor gefocuste bindingen
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
        spawnSubagentSessions: false, // opt-in
      },
    },
  },
}
```

    Opmerkingen:

    - `session.threadBindings.*` stelt globale standaardwaarden in.
    - `channels.discord.threadBindings.*` overschrijft Discord-gedrag.
    - `spawnSubagentSessions` moet true zijn om threads automatisch te maken/binden voor `sessions_spawn({ thread: true })`.
    - `spawnAcpSessions` moet true zijn om threads automatisch te maken/binden voor ACP (`/acp spawn ... --thread ...` of `sessions_spawn({ runtime: "acp", thread: true })`).
    - Als threadbindingen voor een account zijn uitgeschakeld, zijn `/focus` en gerelateerde threadbindingsbewerkingen niet beschikbaar.

    Zie [Subagents](/nl/tools/subagents), [ACP Agents](/nl/tools/acp-agents) en [Configuratiereferentie](/nl/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Permanente ACP-kanaalbindingen">
    Voor stabiele, "altijd-aan" ACP-werkruimten configureer je getypte ACP-bindingen op topniveau die gericht zijn op Discord-gesprekken.

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
    - In een gebonden kanaal of thread resetten `/new` en `/reset` dezelfde ACP-sessie ter plekke. Tijdelijke threadbindingen kunnen doelresolutie overschrijven zolang ze actief zijn.
    - `spawnAcpSessions` is alleen vereist wanneer OpenClaw een childthread moet maken/binden via `--thread auto|here`.

    Zie [ACP Agents](/nl/tools/acp-agents) voor details over bindingsgedrag.

  </Accordion>

  <Accordion title="Reactiemeldingen">
    Modus voor reactiemeldingen per guild:

    - `off`
    - `own` (standaard)
    - `all`
    - `allowlist` (gebruikt `guilds.<id>.users`)

    Reactiegebeurtenissen worden omgezet in systeemgebeurtenissen en gekoppeld aan de gerouteerde Discord-sessie.

  </Accordion>

  <Accordion title="Ack-reacties">
    `ackReaction` verzendt een bevestigingsemoji terwijl OpenClaw een binnenkomend bericht verwerkt.

    Resolutievolgorde:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - terugval naar emoji van agentidentiteit (`agents.list[].identity.emoji`, anders "👀")

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
    Routeer Discord-Gateway-WebSocket-verkeer en REST-lookups bij opstarten (applicatie-ID + allowlist-resolutie) via een HTTP(S)-proxy met `channels.discord.proxy`.

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
    Schakel PluralKit-resolutie in om geproxiede berichten te koppelen aan de identiteit van systeemleden:

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
    - als lookup mislukt, worden geproxiede berichten behandeld als botberichten en verwijderd, tenzij `allowBots=true`

  </Accordion>

  <Accordion title="Aanwezigheidsconfiguratie">
    Aanwezigheidsupdates worden toegepast wanneer je een status- of activiteitsveld instelt, of wanneer je automatische aanwezigheid inschakelt.

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

    Activiteitstypekaart:

    - 0: Spelen
    - 1: Streamen (vereist `activityUrl`)
    - 2: Luisteren
    - 3: Kijken
    - 4: Aangepast (gebruikt de activiteitstekst als statustoestand; emoji is optioneel)
    - 5: Meedoen

    Voorbeeld automatische aanwezigheid (runtimegezondheidssignaal):

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

    Automatische aanwezigheid koppelt runtimebeschikbaarheid aan Discord-status: healthy => online, degraded of unknown => idle, exhausted of unavailable => dnd. Optionele tekstoverrides:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (ondersteunt `{reason}`-placeholder)

  </Accordion>

  <Accordion title="Goedkeuringen in Discord">
    Discord ondersteunt goedkeuringsafhandeling met knoppen in DM's en kan optioneel goedkeuringsprompts in het oorspronkelijke kanaal plaatsen.

    Configuratiepad:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (optioneel; valt waar mogelijk terug op `commands.ownerAllowFrom`)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, standaard: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord schakelt native exec-goedkeuringen automatisch in wanneer `enabled` niet is ingesteld of `"auto"` is en minstens één goedkeurder kan worden opgelost, hetzij uit `execApprovals.approvers` of uit `commands.ownerAllowFrom`. Discord leidt exec-goedkeurders niet af uit kanaal-`allowFrom`, legacy `dm.allowFrom` of direct-message `defaultTo`. Stel `enabled: false` in om Discord expliciet uit te schakelen als native goedkeuringsclient.

    Voor gevoelige, alleen-voor-eigenaar groepscommando's zoals `/diagnostics` en `/export-trajectory` verzendt OpenClaw goedkeuringsprompts en eindresultaten privé. Het probeert eerst Discord-DM wanneer de aanroepende eigenaar een Discord-eigenaarroute heeft; als die niet beschikbaar is, valt het terug op de eerste beschikbare eigenaarroute uit `commands.ownerAllowFrom`, zoals Telegram.

    Wanneer `target` `channel` of `both` is, is de goedkeuringsprompt zichtbaar in het kanaal. Alleen opgeloste goedkeurders kunnen de knoppen gebruiken; andere gebruikers ontvangen een tijdelijke weigering. Goedkeuringsprompts bevatten de commandotekst, dus schakel kanaallevering alleen in vertrouwde kanalen in. Als de kanaal-ID niet uit de sessiesleutel kan worden afgeleid, valt OpenClaw terug op levering via DM.

    Discord rendert ook de gedeelde goedkeuringsknoppen die door andere chatkanalen worden gebruikt. De native Discord-adapter voegt vooral DM-routering naar goedkeurders en kanaalfanout toe.
    Wanneer die knoppen aanwezig zijn, vormen ze de primaire goedkeurings-UX; OpenClaw
    mag alleen een handmatig `/approve`-commando opnemen wanneer het toolresultaat aangeeft
    dat chatgoedkeuringen niet beschikbaar zijn of handmatige goedkeuring de enige route is.
    Als de native goedkeuringsruntime van Discord niet actief is, houdt OpenClaw de
    lokale deterministische `/approve <id> <decision>`-prompt zichtbaar. Als de
    runtime actief is maar een native kaart niet bij een doel kan worden afgeleverd,
    verzendt OpenClaw een fallbackmelding in dezelfde chat met het exacte `/approve`-
    commando uit de wachtende goedkeuring.

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

| Actiegroep                                                                                                                                                              | Standaard      |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | ingeschakeld   |
| roles                                                                                                                                                                    | uitgeschakeld  |
| moderation                                                                                                                                                               | uitgeschakeld  |
| presence                                                                                                                                                                 | uitgeschakeld  |

## Gebruikersinterface met componenten v2

OpenClaw gebruikt Discord-componenten v2 voor exec-goedkeuringen en markeringen tussen contexten. Discord-berichtacties kunnen ook `components` accepteren voor aangepaste gebruikersinterface (geavanceerd; vereist het construeren van een component-payload via de discord-tool), terwijl verouderde `embeds` beschikbaar blijven maar niet worden aanbevolen.

- `channels.discord.ui.components.accentColor` stelt de accentkleur in die wordt gebruikt door Discord-componentcontainers (hex).
- Stel dit per account in met `channels.discord.accounts.<id>.ui.components.accentColor`.
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

Discord heeft twee afzonderlijke spraakoppervlakken: realtime **spraakkanalen** (doorlopende gesprekken) en **spraakberichtbijlagen** (de waveform-previewindeling). De Gateway ondersteunt beide.

### Spraakkanalen

Installatiechecklist:

1. Schakel Message Content Intent in de Discord Developer Portal in.
2. Schakel Server Members Intent in wanneer rol-/gebruikers-allowlists worden gebruikt.
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
- `voice.model` overschrijft alleen de LLM die wordt gebruikt voor Discord-spraakkanaalreacties. Laat dit niet ingesteld om het model van de gerouteerde agent te erven.
- STT gebruikt `tools.media.audio`; `voice.model` heeft geen invloed op transcriptie.
- Discord-overschrijvingen per kanaal voor `systemPrompt` gelden voor spraaktranscriptiebeurten voor dat spraakkanaal.
- Spraaktranscriptiebeurten leiden de eigenaarstatus af van Discord `allowFrom` (of `dm.allowFrom`); sprekers die geen eigenaar zijn, hebben geen toegang tot tools die alleen voor eigenaren zijn (bijvoorbeeld `gateway` en `cron`).
- Spraak is standaard ingeschakeld; stel `channels.discord.voice.enabled=false` in om de spraakruntime en de `GuildVoiceStates` Gateway-intent uit te schakelen.
- `channels.discord.intents.voiceStates` kan het abonnement op voice-state-intents expliciet overschrijven. Laat dit niet ingesteld zodat de intent `voice.enabled` volgt.
- `voice.daveEncryption` en `voice.decryptionFailureTolerance` worden doorgegeven aan de join-opties van `@discordjs/voice`.
- De standaardwaarden van `@discordjs/voice` zijn `daveEncryption=true` en `decryptionFailureTolerance=24` als ze niet zijn ingesteld.
- `voice.connectTimeoutMs` bepaalt de initiële wachttijd op `@discordjs/voice` Ready voor `/vc join` en pogingen tot automatisch deelnemen. Standaard: `30000`.
- `voice.reconnectGraceMs` bepaalt hoelang OpenClaw wacht tot een verbroken spraaksessie begint met opnieuw verbinden voordat deze wordt vernietigd. Standaard: `15000`.
- OpenClaw bewaakt ook decryptiefouten bij ontvangst en herstelt automatisch door na herhaalde fouten binnen een kort tijdvenster het spraakkanaal te verlaten en opnieuw te betreden.
- Als ontvangstlogs na het bijwerken herhaaldelijk `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` tonen, verzamel dan een afhankelijkheidsrapport en logs. De meegeleverde `@discordjs/voice`-lijn bevat de upstream padding-fix uit discord.js PR #11449, waarmee discord.js issue #11419 is gesloten.

Spraakkanaalpipeline:

- Discord PCM-opname wordt omgezet naar een tijdelijk WAV-bestand.
- `tools.media.audio` handelt STT af, bijvoorbeeld `openai/gpt-4o-mini-transcribe`.
- Het transcript wordt via Discord-ingress en routering verzonden terwijl de respons-LLM draait met een spraakuitvoerbeleid dat de agenttool `tts` verbergt en vraagt om geretourneerde tekst, omdat Discord-spraak eigenaar is van de uiteindelijke TTS-weergave.
- `voice.model`, indien ingesteld, overschrijft alleen de respons-LLM voor deze spraakkanaalbeurt.
- `voice.tts` wordt samengevoegd over `messages.tts`; de resulterende audio wordt afgespeeld in het kanaal waarin is deelgenomen.

Referenties worden per component opgelost: LLM-routeauthenticatie voor `voice.model`, STT-authenticatie voor `tools.media.audio` en TTS-authenticatie voor `messages.tts`/`voice.tts`.

### Spraakberichten

Discord-spraakberichten tonen een waveform-preview en vereisen OGG/Opus-audio. OpenClaw genereert de waveform automatisch, maar heeft `ffmpeg` en `ffprobe` nodig op de Gateway-host om te inspecteren en te converteren.

- Geef een **lokaal bestandspad** op (URL's worden geweigerd).
- Laat tekstinhoud weg (Discord weigert tekst + spraakbericht in dezelfde payload).
- Elke audio-indeling wordt geaccepteerd; OpenClaw converteert indien nodig naar OGG/Opus.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Probleemoplossing

<AccordionGroup>
  <Accordion title="Niet-toegestane intents gebruikt of bot ziet geen guild-berichten">

    - schakel Message Content Intent in
    - schakel Server Members Intent in wanneer je afhankelijk bent van gebruikers-/ledenresolutie
    - herstart de Gateway na het wijzigen van intents

  </Accordion>

  <Accordion title="Guild-berichten onverwacht geblokkeerd">

    - verifieer `groupPolicy`
    - verifieer de guild-allowlist onder `channels.discord.guilds`
    - als er een guild-`channels`-map bestaat, zijn alleen vermelde kanalen toegestaan
    - verifieer `requireMention`-gedrag en vermeldingspatronen

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
    - `requireMention` geconfigureerd op de verkeerde plaats (moet onder `channels.discord.guilds` of kanaalvermelding staan)
    - afzender geblokkeerd door guild-/kanaal-`users`-allowlist

  </Accordion>

  <Accordion title="Langlopende Discord-beurten of dubbele antwoorden">

    Typische logs:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Discord Gateway-wachtrijknoppen:

    - één account: `channels.discord.eventQueue.listenerTimeout`
    - meerdere accounts: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - dit beheert alleen werk van Discord Gateway-listeners, niet de levensduur van agentbeurten

    Discord past geen kanaaleigen timeout toe op agentbeurten in de wachtrij. Berichtlisteners dragen onmiddellijk over, en Discord-runs in de wachtrij behouden de volgorde per sessie totdat de sessie-/tool-/runtimelevenscyclus is voltooid of het werk wordt afgebroken.

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

  <Accordion title="Timeoutwaarschuwingen bij Gateway-metagegevenslookup">
    OpenClaw haalt Discord `/gateway/bot`-metagegevens op voordat verbinding wordt gemaakt. Tijdelijke fouten vallen terug op de standaard-Gateway-URL van Discord en worden in logs beperkt gerapporteerd.

    Knoppen voor metagegevens-timeout:

    - één account: `channels.discord.gatewayInfoTimeoutMs`
    - meerdere accounts: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - env-fallback wanneer config niet is ingesteld: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - standaard: `30000` (30 seconden), max: `120000`

  </Accordion>

  <Accordion title="Afwijkingen in permissie-audit">
    Permissiecontroles van `channels status --probe` werken alleen voor numerieke kanaal-ID's.

    Als je slug-sleutels gebruikt, kan runtime-matching nog steeds werken, maar de probe kan permissies niet volledig verifiëren.

  </Accordion>

  <Accordion title="DM- en koppelingsproblemen">

    - DM uitgeschakeld: `channels.discord.dm.enabled=false`
    - DM-beleid uitgeschakeld: `channels.discord.dmPolicy="disabled"` (verouderd: `channels.discord.dm.policy`)
    - wacht op koppelingsgoedkeuring in `pairing`-modus

  </Accordion>

  <Accordion title="Bot-naar-bot-lussen">
    Standaard worden berichten die door bots zijn geschreven genegeerd.

    Als je `channels.discord.allowBots=true` instelt, gebruik dan strikte vermeldings- en allowlist-regels om lusgedrag te voorkomen.
    Geef de voorkeur aan `channels.discord.allowBots="mentions"` om alleen botberichten te accepteren die de bot vermelden.

  </Accordion>

  <Accordion title="Spraak-STT valt weg met DecryptionFailed(...)">

    - houd OpenClaw actueel (`openclaw update`) zodat de herstellogica voor Discord-spraakontvangst aanwezig is
    - bevestig `channels.discord.voice.daveEncryption=true` (standaard)
    - begin met `channels.discord.voice.decryptionFailureTolerance=24` (upstream standaard) en stem alleen bij indien nodig
    - bekijk logs voor:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - als fouten na automatisch opnieuw deelnemen blijven optreden, verzamel logs en vergelijk met de upstream DAVE-ontvangstgeschiedenis in [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) en [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Configuratiereferentie

Primaire referentie: [Configuratiereferentie - Discord](/nl/gateway/config-channels#discord).

<Accordion title="Discord-velden met hoog signaal">

- opstarten/authenticatie: `enabled`, `token`, `accounts.*`, `allowBots`
- beleid: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- opdracht: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- gebeurteniswachtrij: `eventQueue.listenerTimeout` (listenerbudget), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Gateway-metagegevens: `gatewayInfoTimeoutMs`
- antwoord/geschiedenis: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- levering: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming` (verouderde alias: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- media/opnieuw proberen: `mediaMaxMb` (beperkt uitgaande Discord-uploads, standaard `100MB`), `retry`
- acties: `actions.*`
- presence: `activity`, `status`, `activityType`, `activityUrl`
- gebruikersinterface: `ui.components.accentColor`
- functies: `threadBindings`, top-level `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## Veiligheid en beheer

- Behandel bottokens als geheimen (`DISCORD_BOT_TOKEN` heeft de voorkeur in beheerde omgevingen).
- Verleen Discord-permissies volgens het principe van minimale rechten.
- Als opdrachtdeploy/-status verouderd is, herstart de Gateway en controleer opnieuw met `openclaw channels status --probe`.

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Koppelen" icon="link" href="/nl/channels/pairing">
    Koppel een Discord-gebruiker aan de Gateway.
  </Card>
  <Card title="Groepen" icon="users" href="/nl/channels/groups">
    Gedrag van groepschat en toelatingslijst.
  </Card>
  <Card title="Kanaalroutering" icon="route" href="/nl/channels/channel-routing">
    Routeer inkomende berichten naar agenten.
  </Card>
  <Card title="Beveiliging" icon="shield" href="/nl/gateway/security">
    Dreigingsmodel en hardening.
  </Card>
  <Card title="Multi-agentroutering" icon="sitemap" href="/nl/concepts/multi-agent">
    Wijs guilds en kanalen toe aan agenten.
  </Card>
  <Card title="Slash-commando's" icon="terminal" href="/nl/tools/slash-commands">
    Native commandogedrag.
  </Card>
</CardGroup>
