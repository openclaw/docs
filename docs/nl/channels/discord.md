---
read_when:
    - Werken aan Discord-kanaalfuncties
summary: Ondersteuningsstatus, mogelijkheden en configuratie voor de Discord-bot
title: Discord
x-i18n:
    generated_at: "2026-04-29T22:24:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2d374742a097682f33529f93709978f21b63a94cd4da803ff78ff8dfcb1f9b81
    source_path: channels/discord.md
    workflow: 16
---

Klaar voor DM's en guild-kanalen via de officiële Discord Gateway.

<CardGroup cols={3}>
  <Card title="Koppelen" icon="link" href="/nl/channels/pairing">
    Discord-DM's staan standaard in koppelmodus.
  </Card>
  <Card title="Slash-commando's" icon="terminal" href="/nl/tools/slash-commands">
    Native commandogedrag en commandocatalogus.
  </Card>
  <Card title="Kanaalproblemen oplossen" icon="wrench" href="/nl/channels/troubleshooting">
    Diagnose en herstelstroom voor meerdere kanalen.
  </Card>
</CardGroup>

## Snelle configuratie

Je moet een nieuwe applicatie met een bot maken, de bot aan je server toevoegen en deze aan OpenClaw koppelen. We raden aan je bot aan je eigen privéserver toe te voegen. Als je er nog geen hebt, [maak er dan eerst een](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (kies **Mijn eigen maken > Voor mij en mijn vrienden**).

<Steps>
  <Step title="Maak een Discord-applicatie en bot">
    Ga naar de [Discord Developer Portal](https://discord.com/developers/applications) en klik op **Nieuwe applicatie**. Geef deze een naam zoals "OpenClaw".

    Klik op **Bot** in de zijbalk. Stel de **Gebruikersnaam** in op hoe je je OpenClaw-agent noemt.

  </Step>

  <Step title="Schakel privileged intents in">
    Blijf op de pagina **Bot**, scrol omlaag naar **Privileged Gateway Intents** en schakel het volgende in:

    - **Message Content Intent** (vereist)
    - **Server Members Intent** (aanbevolen; vereist voor rol-allowlists en naam-naar-ID-matching)
    - **Presence Intent** (optioneel; alleen nodig voor aanwezigheidsupdates)

  </Step>

  <Step title="Kopieer je bottoken">
    Scrol terug omhoog op de pagina **Bot** en klik op **Token resetten**.

    <Note>
    Ondanks de naam genereert dit je eerste token — er wordt niets "gereset".
    </Note>

    Kopieer het token en sla het ergens op. Dit is je **bottoken** en je hebt het zo nodig.

  </Step>

  <Step title="Genereer een uitnodigings-URL en voeg de bot toe aan je server">
    Klik op **OAuth2** in de zijbalk. Je genereert een uitnodigings-URL met de juiste machtigingen om de bot aan je server toe te voegen.

    Scrol omlaag naar **OAuth2 URL Generator** en schakel in:

    - `bot`
    - `applications.commands`

    Daaronder verschijnt een sectie **Botmachtigingen**. Schakel minimaal in:

    **Algemene machtigingen**
      - Kanalen bekijken
    **Tekstmachtigingen**
      - Berichten verzenden
      - Berichtgeschiedenis lezen
      - Links insluiten
      - Bestanden bijvoegen
      - Reacties toevoegen (optioneel)

    Dit is de basisset voor normale tekstkanalen. Als je van plan bent berichten te plaatsen in Discord-threads, inclusief forum- of mediakanaalworkflows die een thread maken of voortzetten, schakel dan ook **Berichten verzenden in threads** in.
    Kopieer de gegenereerde URL onderaan, plak deze in je browser, selecteer je server en klik op **Doorgaan** om te verbinden. Je zou je bot nu in de Discord-server moeten zien.

  </Step>

  <Step title="Schakel ontwikkelaarsmodus in en verzamel je ID's">
    Terug in de Discord-app moet je Ontwikkelaarsmodus inschakelen zodat je interne ID's kunt kopiëren.

    1. Klik op **Gebruikersinstellingen** (tandwielpictogram naast je avatar) → **Geavanceerd** → schakel **Ontwikkelaarsmodus** in
    2. Klik met de rechtermuisknop op je **serverpictogram** in de zijbalk → **Server-ID kopiëren**
    3. Klik met de rechtermuisknop op je **eigen avatar** → **Gebruikers-ID kopiëren**

    Sla je **server-ID** en **gebruikers-ID** op naast je bottoken — je stuurt ze alle drie naar OpenClaw in de volgende stap.

  </Step>

  <Step title="Sta DM's van serverleden toe">
    Om koppelen te laten werken, moet Discord toestaan dat je bot je een DM stuurt. Klik met de rechtermuisknop op je **serverpictogram** → **Privacy-instellingen** → schakel **Directe berichten** in.

    Hierdoor kunnen serverleden (inclusief bots) je DM's sturen. Laat dit ingeschakeld als je Discord-DM's met OpenClaw wilt gebruiken. Als je alleen guild-kanalen wilt gebruiken, kun je DM's na het koppelen uitschakelen.

  </Step>

  <Step title="Stel je bottoken veilig in (verstuur het niet in chat)">
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
    Voor beheerde service-installaties voer je `openclaw gateway install` uit vanuit een shell waarin `DISCORD_BOT_TOKEN` aanwezig is, of sla je de variabele op in `~/.openclaw/.env`, zodat de service de env SecretRef na herstart kan oplossen.

  </Step>

  <Step title="Configureer OpenClaw en koppel">

    <Tabs>
      <Tab title="Vraag het je agent">
        Chat met je OpenClaw-agent op een bestaand kanaal (bijv. Telegram) en vertel het hem. Als Discord je eerste kanaal is, gebruik dan in plaats daarvan het tabblad CLI / configuratie.

        > "Ik heb mijn Discord-bottoken al in de configuratie ingesteld. Rond de Discord-configuratie af met gebruikers-ID `<user_id>` en server-ID `<server_id>`."
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

        Voor gescripte of externe configuratie schrijf je hetzelfde JSON5-blok met `openclaw config patch --file ./discord.patch.json5 --dry-run` en voer je het daarna opnieuw uit zonder `--dry-run`. Platte-tekstwaarden voor `token` worden ondersteund. SecretRef-waarden worden ook ondersteund voor `channels.discord.token` via env/file/exec-providers. Zie [Geheimenbeheer](/nl/gateway/secrets).

      </Tab>
    </Tabs>

  </Step>

  <Step title="Keur eerste DM-koppeling goed">
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
Tokenoplossing is accountbewust. Configuratietokenwaarden hebben voorrang op env-fallback. `DISCORD_BOT_TOKEN` wordt alleen gebruikt voor het standaardaccount.
Als twee ingeschakelde Discord-accounts naar hetzelfde bottoken oplossen, start OpenClaw slechts één Gateway-monitor voor dat token. Een token uit configuratie heeft voorrang op de standaard env-fallback; anders wint het eerste ingeschakelde account en wordt het dubbele account als uitgeschakeld gerapporteerd.
Voor geavanceerde uitgaande aanroepen (berichttool/kanaalacties) wordt een expliciete per-aanroep-`token` gebruikt voor die aanroep. Dit geldt voor verzend- en lees/probe-achtige acties (bijvoorbeeld read/search/fetch/thread/pins/permissions). Accountbeleid en retry-instellingen blijven afkomstig van het geselecteerde account in de actieve runtime-snapshot.
</Note>

## Aanbevolen: stel een guild-werkruimte in

Zodra DM's werken, kun je je Discord-server instellen als volledige werkruimte waarin elk kanaal zijn eigen agentsessie met eigen context krijgt. Dit wordt aanbevolen voor privéservers waar alleen jij en je bot aanwezig zijn.

<Steps>
  <Step title="Voeg je server toe aan de guild-allowlist">
    Hierdoor kan je agent in elk kanaal op je server reageren, niet alleen in DM's.

    <Tabs>
      <Tab title="Vraag het je agent">
        > "Voeg mijn Discord-server-ID `<server_id>` toe aan de guild-allowlist"
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

    In guild-kanalen blijven normale definitieve assistentantwoorden standaard privé. Zichtbare Discord-uitvoer moet expliciet met de tool `message` worden verzonden, zodat de agent standaard kan meelezen en alleen post wanneer hij besluit dat een kanaalantwoord nuttig is.

    <Tabs>
      <Tab title="Vraag het je agent">
        > "Sta mijn agent toe op deze server te reageren zonder dat hij met @ genoemd hoeft te worden"
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

        Stel `messages.groupChat.visibleReplies: "automatic"` in om oudere automatische definitieve antwoorden voor groeps-/kanaalruimtes te herstellen.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Plan voor geheugen in guild-kanalen">
    Standaard wordt langetermijngeheugen (MEMORY.md) alleen in DM-sessies geladen. Guild-kanalen laden MEMORY.md niet automatisch.

    <Tabs>
      <Tab title="Vraag het je agent">
        > "Wanneer ik vragen stel in Discord-kanalen, gebruik dan memory_search of memory_get als je langetermijncontext uit MEMORY.md nodig hebt."
      </Tab>
      <Tab title="Handmatig">
        Als je gedeelde context in elk kanaal nodig hebt, zet de stabiele instructies dan in `AGENTS.md` of `USER.md` (ze worden voor elke sessie geïnjecteerd). Bewaar langetermijnnotities in `MEMORY.md` en raadpleeg ze op aanvraag met geheugentools.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Maak nu een paar kanalen op je Discord-server en begin met chatten. Je agent kan de kanaalnaam zien, en elk kanaal krijgt zijn eigen geïsoleerde sessie — zodat je `#coding`, `#home`, `#research` of iets anders kunt instellen dat bij je workflow past.

## Runtimemodel

- Gateway beheert de Discord-verbinding.
- Antwoordroutering is deterministisch: inkomende Discord-antwoorden gaan terug naar Discord.
- Discord-guild-/kanaalmetadata worden toegevoegd aan de modelprompt als niet-vertrouwde
  context, niet als een voor de gebruiker zichtbaar antwoordvoorvoegsel. Als een model die envelop
  terugkopieert, verwijdert OpenClaw de gekopieerde metadata uit uitgaande antwoorden en uit
  toekomstige replaycontext.
- Standaard (`session.dmScope=main`) delen directe chats de hoofdsessie van de agent (`agent:main:main`).
- Guild-kanalen zijn geïsoleerde sessiesleutels (`agent:<agentId>:discord:channel:<channelId>`).
- Groeps-DM's worden standaard genegeerd (`channels.discord.dm.groupEnabled=false`).
- Native slash-commando's draaien in geïsoleerde commandosessies (`agent:<agentId>:discord:slash:<userId>`), terwijl ze nog steeds `CommandTargetSessionKey` meenemen naar de gerouteerde gesprekssessie.
- Tekst-only cron/Heartbeat-aankondigingslevering naar Discord gebruikt het definitieve
  voor de assistent zichtbare antwoord één keer. Media- en gestructureerde componentpayloads blijven
  uit meerdere berichten bestaan wanneer de agent meerdere leverbare payloads uitstuurt.

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

OpenClaw ondersteunt Discord-componenten v2-containers voor agentberichten. Gebruik de berichttool met een `components`-payload. Interactieresultaten worden teruggeleid naar de agent als normale inkomende berichten en volgen de bestaande Discord-instellingen voor `replyToMode`.

Ondersteunde blokken:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Actierijen staan maximaal 5 knoppen of één selectiemenu toe
- Selectietypen: `string`, `user`, `role`, `mentionable`, `channel`

Standaard zijn componenten eenmalig te gebruiken. Stel `components.reusable=true` in om knoppen, selecties en formulieren meerdere keren te laten gebruiken totdat ze verlopen.

Om te beperken wie op een knop kan klikken, stel je `allowedUsers` in op die knop (Discord-gebruikers-ID's, tags of `*`). Wanneer dit is geconfigureerd, ontvangen niet-overeenkomende gebruikers een tijdelijke weigering.

De slash-commando's `/model` en `/models` openen een interactieve modelkiezer met dropdowns voor provider, model en compatibele runtime plus een stap Verzenden. `/models add` is verouderd en retourneert nu een verouderingsbericht in plaats van modellen vanuit chat te registreren. Het antwoord van de kiezer is tijdelijk en alleen de aanroepende gebruiker kan het gebruiken.

Bestandsbijlagen:

- `file`-blokken moeten verwijzen naar een bijlagereferentie (`attachment://<filename>`)
- Geef de bijlage op via `media`/`path`/`filePath` (één bestand); gebruik `media-gallery` voor meerdere bestanden
- Gebruik `filename` om de uploadnaam te overschrijven wanneer deze moet overeenkomen met de bijlagereferentie

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
    `channels.discord.dmPolicy` beheert DM-toegang. `channels.discord.allowFrom` is de canonieke DM-toestemmingslijst.

    - `pairing` (standaard)
    - `allowlist`
    - `open` (vereist dat `channels.discord.allowFrom` `"*"` bevat)
    - `disabled`

    Als het DM-beleid niet open is, worden onbekende gebruikers geblokkeerd (of om koppeling gevraagd in de modus `pairing`).

    Prioriteit bij meerdere accounts:

    - `channels.discord.accounts.default.allowFrom` geldt alleen voor het account `default`.
    - Voor één account heeft `allowFrom` prioriteit boven de verouderde `dm.allowFrom`.
    - Benoemde accounts erven `channels.discord.allowFrom` wanneer hun eigen `allowFrom` en verouderde `dm.allowFrom` niet zijn ingesteld.
    - Benoemde accounts erven `channels.discord.accounts.default.allowFrom` niet.

    Verouderde `channels.discord.dm.policy` en `channels.discord.dm.allowFrom` worden nog steeds gelezen voor compatibiliteit. `openclaw doctor --fix` migreert ze naar `dmPolicy` en `allowFrom` wanneer dat kan zonder de toegang te wijzigen.

    DM-doelindeling voor aflevering:

    - `user:<id>`
    - `<@id>`-vermelding

    Kale numerieke ID's worden normaal gesproken als kanaal-ID's opgelost wanneer een kanaalstandaard actief is, maar ID's die in de effectieve DM-`allowFrom` van het account staan, worden voor compatibiliteit behandeld als DM-doelen van gebruikers.

  </Tab>

  <Tab title="Guild policy">
    Guild-afhandeling wordt beheerd door `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    De veilige basisinstelling wanneer `channels.discord` bestaat, is `allowlist`.

    Gedrag van `allowlist`:

    - guild moet overeenkomen met `channels.discord.guilds` (`id` heeft de voorkeur, slug wordt geaccepteerd)
    - optionele toestemmingslijsten voor afzenders: `users` (stabiele ID's aanbevolen) en `roles` (alleen rol-ID's); als een van beide is geconfigureerd, zijn afzenders toegestaan wanneer ze overeenkomen met `users` OF `roles`
    - directe naam-/tag-matching is standaard uitgeschakeld; schakel `channels.discord.dangerouslyAllowNameMatching: true` alleen in als noodcompatibiliteitsmodus
    - namen/tags worden ondersteund voor `users`, maar ID's zijn veiliger; `openclaw security audit` waarschuwt wanneer naam-/tag-items worden gebruikt
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

    Als je alleen `DISCORD_BOT_TOKEN` instelt en geen `channels.discord`-blok maakt, is de runtime-terugval `groupPolicy="allowlist"` (met een waarschuwing in logs), zelfs als `channels.defaults.groupPolicy` `open` is.

  </Tab>

  <Tab title="Mentions and group DMs">
    Guild-berichten zijn standaard door vermeldingen afgeschermd.

    Vermeldingsdetectie omvat:

    - expliciete botvermelding
    - geconfigureerde vermeldingspatronen (`agents.list[].groupChat.mentionPatterns`, terugval `messages.groupChat.mentionPatterns`)
    - impliciet antwoord-op-bot-gedrag in ondersteunde gevallen

    `requireMention` wordt per guild/kanaal geconfigureerd (`channels.discord.guilds...`).
    `ignoreOtherMentions` laat optioneel berichten vallen die een andere gebruiker/rol vermelden maar niet de bot (met uitzondering van @everyone/@here).

    Groeps-DM's:

    - standaard: genegeerd (`dm.groupEnabled=false`)
    - optionele toestemmingslijst via `dm.groupChannels` (kanaal-ID's of slugs)

  </Tab>
</Tabs>

### Rolgebaseerde agentroutering

Gebruik `bindings[].match.roles` om Discord-guildleden per rol-ID naar verschillende agents te routeren. Rolgebaseerde bindingen accepteren alleen rol-ID's en worden geëvalueerd na peer- of parent-peer-bindingen en vóór guild-only-bindingen. Als een binding ook andere matchvelden instelt (bijvoorbeeld `peer` + `guildId` + `roles`), moeten alle geconfigureerde velden overeenkomen.

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
- Override per kanaal: `channels.discord.commands.native`.
- `commands.native=false` wist expliciet eerder geregistreerde native Discord-commando's.
- Native commando-authenticatie gebruikt dezelfde Discord-toestemmingslijsten/-beleidsregels als normale berichtafhandeling.
- Commando's kunnen nog steeds zichtbaar zijn in de Discord-UI voor gebruikers die niet gemachtigd zijn; uitvoering handhaaft nog steeds OpenClaw-authenticatie en retourneert "not authorized".

Zie [Slash-commando's](/nl/tools/slash-commands) voor de commandocatalogus en het gedrag.

Standaardinstellingen voor slash-commando's:

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

    Opmerking: `off` schakelt impliciete antwoordthreading uit. Expliciete `[[reply_to_*]]`-tags worden nog steeds gehonoreerd.
    `first` koppelt de impliciete native antwoordreferentie altijd aan het eerste uitgaande Discord-bericht voor de beurt.
    `batched` koppelt de impliciete native antwoordreferentie van Discord alleen wanneer de
    inkomende beurt een gedebouncete batch van meerdere berichten was. Dit is nuttig
    wanneer je native antwoorden vooral wilt voor ambigue, snel opeenvolgende chats, niet voor elke
    beurt met één bericht.

    Bericht-ID's worden in context/geschiedenis beschikbaar gemaakt, zodat agents specifieke berichten kunnen targeten.

  </Accordion>

  <Accordion title="Live stream preview">
    OpenClaw kan conceptantwoorden streamen door een tijdelijk bericht te verzenden en het te bewerken wanneer tekst binnenkomt. `channels.discord.streaming` accepteert `off` (standaard) | `partial` | `block` | `progress`. `progress` wordt op Discord naar `partial` gemapt; `streamMode` is een verouderde alias en wordt automatisch gemigreerd.

    Standaard blijft `off`, omdat Discord-previewbewerkingen snel rate limits raken wanneer meerdere bots of gateways een account delen.

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
    - `block` zendt stukken ter grootte van concepten uit (gebruik `draftChunk` om grootte en breekpunten af te stemmen, begrensd tot `textChunkLimit`).
    - Media, fouten en expliciete antwoordfinals annuleren wachtende previewbewerkingen.
    - `streaming.preview.toolProgress` (standaard `true`) bepaalt of tool-/voortgangsupdates het previewbericht hergebruiken.

    Previewstreaming is alleen tekst; media-antwoorden vallen terug op normale aflevering. Wanneer `block`-streaming expliciet is ingeschakeld, slaat OpenClaw de previewstream over om dubbel streamen te voorkomen.

  </Accordion>

  <Accordion title="History, context, and thread behavior">
    Geschiedeniscontext voor guilds:

    - `channels.discord.historyLimit` standaard `20`
    - terugval: `messages.groupChat.historyLimit`
    - `0` schakelt uit

    DM-geschiedenisinstellingen:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Threadgedrag:

    - Discord-threads worden gerouteerd als kanaalsessies en erven de configuratie van het bovenliggende kanaal tenzij overschreven.
    - Threadsessies erven de sessieniveau-`/model`-selectie van het bovenliggende kanaal als model-only terugval; thread-lokale `/model`-selecties hebben nog steeds prioriteit en de transcriptgeschiedenis van de parent wordt niet gekopieerd tenzij transcriptovererving is ingeschakeld.
    - `channels.discord.thread.inheritParent` (standaard `false`) laat nieuwe auto-threads initialiseren vanuit het bovenliggende transcript. Overrides per account staan onder `channels.discord.accounts.<id>.thread.inheritParent`.
    - Reacties van de berichttool kunnen `user:<id>`-DM-doelen oplossen.
    - `guilds.<guild>.channels.<channel>.requireMention: false` blijft behouden tijdens terugval voor activatie in de antwoordfase.

    Kanaalonderwerpen worden als **niet-vertrouwde** context geïnjecteerd. Toestemmingslijsten beperken wie de agent kan activeren, niet een volledige redactiegrens voor aanvullende context.

  </Accordion>

  <Accordion title="Thread-bound sessions for subagents">
    Discord kan een thread aan een sessiedoel binden zodat vervolgberichten in die thread naar dezelfde sessie blijven routeren (inclusief subagentsessies).

    Commando's:

    - `/focus <target>` bind huidige/nieuwe thread aan een subagent-/sessiedoel
    - `/unfocus` verwijder de huidige threadbinding
    - `/agents` toon actieve runs en bindingsstatus
    - `/session idle <duration|off>` inspecteer/update automatische inactiviteits-unfocus voor gefocuste bindingen
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
    - `spawnSubagentSessions` moet true zijn om threads automatisch te maken/te koppelen voor `sessions_spawn({ thread: true })`.
    - `spawnAcpSessions` moet true zijn om threads automatisch te maken/te koppelen voor ACP (`/acp spawn ... --thread ...` of `sessions_spawn({ runtime: "acp", thread: true })`).
    - Als threadkoppelingen zijn uitgeschakeld voor een account, zijn `/focus` en gerelateerde threadkoppelingsbewerkingen niet beschikbaar.

    Zie [Sub-agents](/nl/tools/subagents), [ACP-agenten](/nl/tools/acp-agents) en [Configuratiereferentie](/nl/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Persistente ACP-kanaalkoppelingen">
    Configureer voor stabiele "always-on" ACP-werkruimten typed ACP-koppelingen op het hoogste niveau die gericht zijn op Discord-gesprekken.

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

    - `/acp spawn codex --bind here` koppelt het huidige kanaal of de huidige thread ter plekke en houdt toekomstige berichten in dezelfde ACP-sessie. Threadberichten erven de koppeling van het bovenliggende kanaal.
    - In een gekoppeld kanaal of een gekoppelde thread resetten `/new` en `/reset` dezelfde ACP-sessie ter plekke. Tijdelijke threadkoppelingen kunnen de doelresolutie overschrijven zolang ze actief zijn.
    - `spawnAcpSessions` is alleen vereist wanneer OpenClaw een child-thread moet maken/koppelen via `--thread auto|here`.

    Zie [ACP-agenten](/nl/tools/acp-agents) voor details over koppelingsgedrag.

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
    `ackReaction` stuurt een bevestigingsemoji terwijl OpenClaw een binnenkomend bericht verwerkt.

    Resolutievolgorde:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - fallback naar emoji voor agentidentiteit (`agents.list[].identity.emoji`, anders "👀")

    Opmerkingen:

    - Discord accepteert unicode-emoji of aangepaste emojinamen.
    - Gebruik `""` om de reactie uit te schakelen voor een kanaal of account.

  </Accordion>

  <Accordion title="Configuratieschrijven">
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
    Routeer Discord-gateway-WebSocket-verkeer en REST-opzoekacties bij het opstarten (applicatie-ID + allowlist-resolutie) via een HTTP(S)-proxy met `channels.discord.proxy`.

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
        token: "pk_live_...", // optional; needed for private systems
      },
    },
  },
}
```

    Opmerkingen:

    - allowlists kunnen `pk:<memberId>` gebruiken
    - weergavenamen van leden worden alleen op naam/slug gematcht wanneer `channels.discord.dangerouslyAllowNameMatching: true`
    - opzoekacties gebruiken de oorspronkelijke bericht-ID en zijn beperkt tot een tijdvenster
    - als opzoeken mislukt, worden proxied berichten behandeld als botberichten en weggegooid tenzij `allowBots=true`

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

    Activiteitstypekaart:

    - 0: Spelen
    - 1: Streaming (vereist `activityUrl`)
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

    Automatische aanwezigheid koppelt runtime-beschikbaarheid aan Discord-status: gezond => online, verminderd of onbekend => idle, uitgeput of niet beschikbaar => dnd. Optionele tekstoverschrijvingen:

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

    Discord schakelt native exec-goedkeuringen automatisch in wanneer `enabled` niet is ingesteld of `"auto"` is en ten minste één goedkeurder kan worden opgelost, vanuit `execApprovals.approvers` of vanuit `commands.ownerAllowFrom`. Discord leidt exec-goedkeurders niet af uit kanaal-`allowFrom`, verouderde `dm.allowFrom` of direct-message-`defaultTo`. Stel `enabled: false` in om Discord expliciet uit te schakelen als native goedkeuringsclient.

    Voor gevoelige groepscommando's die alleen voor eigenaars zijn, zoals `/diagnostics` en `/export-trajectory`, stuurt OpenClaw goedkeuringsprompts en eindresultaten privé. Het probeert eerst Discord-DM wanneer de aanroepende eigenaar een Discord-eigenaarsroute heeft; als die niet beschikbaar is, valt het terug op de eerste beschikbare eigenaarsroute uit `commands.ownerAllowFrom`, zoals Telegram.

    Wanneer `target` `channel` of `both` is, is de goedkeuringsprompt zichtbaar in het kanaal. Alleen opgeloste goedkeurders kunnen de knoppen gebruiken; andere gebruikers ontvangen een vluchtige weigering. Goedkeuringsprompts bevatten de commandotekst, dus schakel kanaallevering alleen in vertrouwde kanalen in. Als de kanaal-ID niet uit de sessiesleutel kan worden afgeleid, valt OpenClaw terug op levering via DM.

    Discord rendert ook de gedeelde goedkeuringsknoppen die door andere chatkanalen worden gebruikt. De native Discord-adapter voegt vooral DM-routering voor goedkeurders en kanaalfanout toe.
    Wanneer die knoppen aanwezig zijn, vormen ze de primaire goedkeurings-UX; OpenClaw
    mag alleen een handmatig `/approve`-commando opnemen wanneer het toolresultaat zegt
    dat chatgoedkeuringen niet beschikbaar zijn of dat handmatige goedkeuring de enige route is.
    Als de native goedkeuringsruntime van Discord niet actief is, houdt OpenClaw de
    lokale deterministische `/approve <id> <decision>`-prompt zichtbaar. Als de
    runtime actief is maar er geen native kaart aan een doel kan worden geleverd,
    stuurt OpenClaw een fallbackmelding in dezelfde chat met het exacte `/approve`-
    commando van de openstaande goedkeuring.

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

De actie `event-create` accepteert een optionele parameter `image` (URL of lokaal bestandspad) om de omslagafbeelding van het geplande evenement in te stellen.

Actiegates staan onder `channels.discord.actions.*`.

Standaard gategedrag:

| Actiegroep                                                                                                                                                              | Standaard    |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | ingeschakeld |
| roles                                                                                                                                                                   | uitgeschakeld |
| moderation                                                                                                                                                              | uitgeschakeld |
| presence                                                                                                                                                                | uitgeschakeld |

## Components v2-UI

OpenClaw gebruikt Discord components v2 voor exec-goedkeuringen en contextoverschrijdende markeringen. Discord-berichtacties kunnen ook `components` accepteren voor aangepaste UI (geavanceerd; vereist het construeren van een componentpayload via de discord-tool), terwijl verouderde `embeds` beschikbaar blijven maar niet worden aanbevolen.

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

Discord heeft twee afzonderlijke spraakoppervlakken: realtime **spraakkanalen** (doorlopende gesprekken) en **spraakberichtbijlagen** (het waveform-previewformaat). De gateway ondersteunt beide.

### Spraakkanalen

Installatiechecklist:

1. Schakel Message Content Intent in de Discord Developer Portal in.
2. Schakel Server Members Intent in wanneer rol-/gebruikers-allowlists worden gebruikt.
3. Nodig de bot uit met de scopes `bot` en `applications.commands`.
4. Verleen Connect, Speak, Send Messages en Read Message History in het doelspraak­kanaal.
5. Schakel native opdrachten in (`commands.native` of `channels.discord.commands.native`).
6. Configureer `channels.discord.voice`.

Gebruik `/vc join|leave|status` om sessies te beheren. De opdracht gebruikt de standaardagent van het account en volgt dezelfde allowlist- en groepsbeleidsregels als andere Discord-opdrachten.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
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
- `voice.model` overschrijft alleen de LLM die wordt gebruikt voor antwoorden in Discord-spraakkanalen. Laat dit oningesteld om het gerouteerde agentmodel over te nemen.
- STT gebruikt `tools.media.audio`; `voice.model` heeft geen invloed op transcriptie.
- Transcriptbeurten uit spraak leiden de eigenaarstatus af van Discord `allowFrom` (of `dm.allowFrom`); sprekers die geen eigenaar zijn, hebben geen toegang tot tools die alleen voor eigenaren zijn (bijvoorbeeld `gateway` en `cron`).
- Spraak is standaard ingeschakeld; stel `channels.discord.voice.enabled=false` in om de spraakruntime en de `GuildVoiceStates` Gateway-intent uit te schakelen.
- `channels.discord.intents.voiceStates` kan het abonnement op de voice-state-intent expliciet overschrijven. Laat dit oningesteld zodat de intent `voice.enabled` volgt.
- `voice.daveEncryption` en `voice.decryptionFailureTolerance` worden doorgegeven aan de join-opties van `@discordjs/voice`.
- De standaardwaarden van `@discordjs/voice` zijn `daveEncryption=true` en `decryptionFailureTolerance=24` wanneer ze niet zijn ingesteld.
- OpenClaw bewaakt ook ontvangst-decryptiefouten en herstelt automatisch door het spraakkanaal te verlaten en opnieuw deel te nemen na herhaalde fouten binnen een kort tijdvenster.
- Als ontvangstlogs na het bijwerken herhaaldelijk `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` tonen, verzamel dan een dependency-rapport en logs. De gebundelde `@discordjs/voice`-lijn bevat de upstream padding-fix uit discord.js PR #11449, waarmee discord.js issue #11419 is gesloten.

Pipeline voor spraakkanalen:

- Discord PCM-opname wordt geconverteerd naar een tijdelijk WAV-bestand.
- `tools.media.audio` verwerkt STT, bijvoorbeeld `openai/gpt-4o-mini-transcribe`.
- Het transcript wordt via normale Discord-ingress en routering verzonden.
- `voice.model`, wanneer ingesteld, overschrijft alleen de antwoord-LLM voor deze spraakkanaalbeurt.
- `voice.tts` wordt samengevoegd bovenop `messages.tts`; de resulterende audio wordt afgespeeld in het kanaal waaraan is deelgenomen.

Referenties worden per component opgelost: LLM-routeringsauth voor `voice.model`, STT-auth voor `tools.media.audio` en TTS-auth voor `messages.tts`/`voice.tts`.

### Spraakberichten

Discord-spraakberichten tonen een waveform-preview en vereisen OGG/Opus-audio. OpenClaw genereert de waveform automatisch, maar heeft `ffmpeg` en `ffprobe` nodig op de Gateway-host om te inspecteren en te converteren.

- Geef een **lokaal bestandspad** op (URL's worden geweigerd).
- Laat tekstinhoud weg (Discord weigert tekst + spraakbericht in dezelfde payload).
- Elk audioformaat wordt geaccepteerd; OpenClaw converteert waar nodig naar OGG/Opus.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Probleemoplossing

<AccordionGroup>
  <Accordion title="Niet-toegestane intents gebruikt of bot ziet geen guildberichten">

    - schakel Message Content Intent in
    - schakel Server Members Intent in wanneer je afhankelijk bent van gebruikers-/ledenresolutie
    - herstart de gateway na het wijzigen van intents

  </Accordion>

  <Accordion title="Guildberichten onverwacht geblokkeerd">

    - controleer `groupPolicy`
    - controleer de guild-allowlist onder `channels.discord.guilds`
    - als de guild-`channels`-map bestaat, zijn alleen vermelde kanalen toegestaan
    - controleer het gedrag van `requireMention` en mention-patronen

    Nuttige controles:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention is false maar nog steeds geblokkeerd">
    Veelvoorkomende oorzaken:

    - `groupPolicy="allowlist"` zonder overeenkomende guild-/kanaal-allowlist
    - `requireMention` op de verkeerde plaats geconfigureerd (moet onder `channels.discord.guilds` of de kanaalvermelding staan)
    - afzender geblokkeerd door guild-/kanaal-`users`-allowlist

  </Accordion>

  <Accordion title="Langlopende Discord-beurten of dubbele antwoorden">

    Typische logs:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Discord Gateway-wachtrij-instellingen:

    - enkel account: `channels.discord.eventQueue.listenerTimeout`
    - meerdere accounts: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - dit beheert alleen Discord Gateway-listenerwerk, niet de levensduur van agentbeurten

    Discord past geen kanaaleigen timeout toe op in de wachtrij geplaatste agentbeurten. Berichtlisteners dragen onmiddellijk over, en in de wachtrij geplaatste Discord-runs behouden volgorde per sessie totdat de sessie-/tool-/runtimelevenscyclus het werk voltooit of afbreekt.

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

  <Accordion title="Timeoutwaarschuwingen bij Gateway-metadatalookup">
    OpenClaw haalt Discord `/gateway/bot`-metadata op voordat verbinding wordt gemaakt. Tijdelijke fouten vallen terug op Discords standaard-Gateway-URL en worden in logs rate-limited.

    Metadata-timeoutinstellingen:

    - enkel account: `channels.discord.gatewayInfoTimeoutMs`
    - meerdere accounts: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - env-fallback wanneer configuratie niet is ingesteld: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - standaard: `30000` (30 seconden), max: `120000`

  </Accordion>

  <Accordion title="Mismatchen in permissie-audit">
    Permissiecontroles van `channels status --probe` werken alleen voor numerieke kanaal-ID's.

    Als je slug-sleutels gebruikt, kan runtime-matching nog steeds werken, maar probe kan permissies niet volledig verifiëren.

  </Accordion>

  <Accordion title="DM- en koppelingsproblemen">

    - DM uitgeschakeld: `channels.discord.dm.enabled=false`
    - DM-beleid uitgeschakeld: `channels.discord.dmPolicy="disabled"` (legacy: `channels.discord.dm.policy`)
    - wacht op koppelingsgoedkeuring in `pairing`-modus

  </Accordion>

  <Accordion title="Bot-naar-bot-lussen">
    Standaard worden berichten die door bots zijn geschreven genegeerd.

    Als je `channels.discord.allowBots=true` instelt, gebruik dan strikte mention- en allowlistregels om lusgedrag te voorkomen.
    Geef de voorkeur aan `channels.discord.allowBots="mentions"` om alleen botberichten te accepteren die de bot vermelden.

  </Accordion>

  <Accordion title="Voice STT valt weg met DecryptionFailed(...)">

    - houd OpenClaw actueel (`openclaw update`) zodat de herstel­logica voor Discord-spraakontvangst aanwezig is
    - bevestig `channels.discord.voice.daveEncryption=true` (standaard)
    - begin met `channels.discord.voice.decryptionFailureTolerance=24` (upstream standaard) en stem alleen af indien nodig
    - bekijk logs op:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - als fouten na automatisch opnieuw deelnemen blijven optreden, verzamel logs en vergelijk ze met de upstream DAVE-ontvangstgeschiedenis in [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) en [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Configuratiereferentie

Primaire referentie: [Configuratiereferentie - Discord](/nl/gateway/config-channels#discord).

<Accordion title="Discord-velden met hoge signaalwaarde">

- opstarten/auth: `enabled`, `token`, `accounts.*`, `allowBots`
- beleid: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- opdracht: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- gebeurteniswachtrij: `eventQueue.listenerTimeout` (listenerbudget), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Gateway-metadata: `gatewayInfoTimeoutMs`
- antwoord/geschiedenis: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- levering: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming` (legacy alias: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- media/opnieuw proberen: `mediaMaxMb` (beperkt uitgaande Discord-uploads, standaard `100MB`), `retry`
- acties: `actions.*`
- aanwezigheid: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- functies: `threadBindings`, top-level `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## Veiligheid en beheer

- Behandel bottokens als geheimen (`DISCORD_BOT_TOKEN` heeft de voorkeur in beheerde omgevingen).
- Verleen Discord-permissies volgens het principe van minimale rechten.
- Als de opdrachtdeploy/status verouderd is, herstart dan de gateway en controleer opnieuw met `openclaw channels status --probe`.

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Koppelen" icon="link" href="/nl/channels/pairing">
    Koppel een Discord-gebruiker aan de gateway.
  </Card>
  <Card title="Groepen" icon="users" href="/nl/channels/groups">
    Groepschat- en allowlistgedrag.
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
  <Card title="Slash-opdrachten" icon="terminal" href="/nl/tools/slash-commands">
    Native opdrachtgedrag.
  </Card>
</CardGroup>
