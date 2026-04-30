---
read_when:
    - Werken aan Discord-kanaalfuncties
summary: Ondersteuningsstatus, mogelijkheden en configuratie van de Discord-bot
title: Discord
x-i18n:
    generated_at: "2026-04-30T09:34:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: e9f31af2801e7faf6456d4452a5f43b0e42a067b86b7e562c308fa450a847356
    source_path: channels/discord.md
    workflow: 16
---

Klaar voor DM's en guild-kanalen via de officiële Discord-gateway.

<CardGroup cols={3}>
  <Card title="Koppelen" icon="link" href="/nl/channels/pairing">
    Discord-DM's staan standaard in koppelingsmodus.
  </Card>
  <Card title="Slash-commando's" icon="terminal" href="/nl/tools/slash-commands">
    Native commandogedrag en commandocatalogus.
  </Card>
  <Card title="Kanaalproblemen oplossen" icon="wrench" href="/nl/channels/troubleshooting">
    Kanaaloverstijgende diagnostiek en herstelstroom.
  </Card>
</CardGroup>

## Snelle installatie

Je moet een nieuwe toepassing met een bot maken, de bot aan je server toevoegen en deze koppelen aan OpenClaw. We raden aan om je bot toe te voegen aan je eigen privéserver. Als je er nog geen hebt, [maak er dan eerst een](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (kies **Create My Own > For me and my friends**).

<Steps>
  <Step title="Maak een Discord-toepassing en bot">
    Ga naar het [Discord Developer Portal](https://discord.com/developers/applications) en klik op **New Application**. Geef de toepassing een naam zoals "OpenClaw".

    Klik op **Bot** in de zijbalk. Stel **Username** in op de naam die je voor je OpenClaw-agent gebruikt.

  </Step>

  <Step title="Schakel privileged intents in">
    Blijf op de pagina **Bot**, scrol omlaag naar **Privileged Gateway Intents** en schakel het volgende in:

    - **Message Content Intent** (vereist)
    - **Server Members Intent** (aanbevolen; vereist voor rol-allowlists en naam-naar-ID-koppeling)
    - **Presence Intent** (optioneel; alleen nodig voor aanwezigheidsupdates)

  </Step>

  <Step title="Kopieer je bottoken">
    Scrol terug omhoog op de pagina **Bot** en klik op **Reset Token**.

    <Note>
    Ondanks de naam genereert dit je eerste token — er wordt niets "gereset".
    </Note>

    Kopieer de token en bewaar deze ergens. Dit is je **Bot Token** en je hebt deze zo meteen nodig.

  </Step>

  <Step title="Genereer een uitnodigings-URL en voeg de bot toe aan je server">
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
    Kopieer de gegenereerde URL onderaan, plak deze in je browser, selecteer je server en klik op **Continue** om verbinding te maken. Je zou je bot nu in de Discord-server moeten zien.

  </Step>

  <Step title="Schakel Developer Mode in en verzamel je ID's">
    Terug in de Discord-app moet je Developer Mode inschakelen, zodat je interne ID's kunt kopiëren.

    1. Klik op **User Settings** (tandwielpictogram naast je avatar) → **Advanced** → schakel **Developer Mode** in
    2. Klik met de rechtermuisknop op je **serverpictogram** in de zijbalk → **Copy Server ID**
    3. Klik met de rechtermuisknop op je **eigen avatar** → **Copy User ID**

    Bewaar je **Server ID** en **User ID** naast je Bot Token — je stuurt alle drie in de volgende stap naar OpenClaw.

  </Step>

  <Step title="Sta DM's van serverleden toe">
    Om koppelen te laten werken, moet Discord je bot toestaan jou een DM te sturen. Klik met de rechtermuisknop op je **serverpictogram** → **Privacy Settings** → schakel **Direct Messages** in.

    Hierdoor kunnen serverleden (inclusief bots) je DM's sturen. Laat dit ingeschakeld als je Discord-DM's met OpenClaw wilt gebruiken. Als je alleen guild-kanalen wilt gebruiken, kun je DM's na het koppelen uitschakelen.

  </Step>

  <Step title="Stel je bottoken veilig in (stuur deze niet in de chat)">
    Je Discord-bottoken is een geheim (zoals een wachtwoord). Stel deze in op de machine waarop OpenClaw draait voordat je je agent een bericht stuurt.

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
    Voor installaties als beheerde service voer je `openclaw gateway install` uit vanuit een shell waarin `DISCORD_BOT_TOKEN` aanwezig is, of sla je de variabele op in `~/.openclaw/.env`, zodat de service de env SecretRef na herstart kan oplossen.
    Als je host wordt geblokkeerd of rate-limited door Discord's opstart-application-lookup, stel dan de Discord-application/client-ID in vanuit het Developer Portal, zodat het opstarten die REST-call kan overslaan. Gebruik `channels.discord.applicationId` voor het standaardaccount, of `channels.discord.accounts.<accountId>.applicationId` wanneer je meerdere Discord-bots uitvoert.

  </Step>

  <Step title="Configureer OpenClaw en koppel">

    <Tabs>
      <Tab title="Vraag het je agent">
        Chat met je OpenClaw-agent via een bestaand kanaal (bijv. Telegram) en vertel het. Als Discord je eerste kanaal is, gebruik dan in plaats daarvan het tabblad CLI / config.

        > "Ik heb mijn Discord-bottoken al in de configuratie ingesteld. Rond de Discord-installatie af met User ID `<user_id>` en Server ID `<server_id>`."
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

        Voor gescripte of externe installatie schrijf je hetzelfde JSON5-blok met `openclaw config patch --file ./discord.patch.json5 --dry-run` en voer je het daarna opnieuw uit zonder `--dry-run`. Plaintext `token`-waarden worden ondersteund. SecretRef-waarden worden ook ondersteund voor `channels.discord.token` via env/file/exec-providers. Zie [Geheimenbeheer](/nl/gateway/secrets).

        Voor meerdere Discord-bots houd je elke bottoken en application-ID onder het bijbehorende account. Een top-level `channels.discord.applicationId` wordt door accounts geërfd, dus stel deze daar alleen in wanneer elk account dezelfde application-ID moet gebruiken.

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
    Wacht tot de gateway draait en stuur daarna je bot een DM in Discord. Deze reageert met een koppelingscode.

    <Tabs>
      <Tab title="Vraag het je agent">
        Stuur de koppelingscode naar je agent via je bestaande kanaal:

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
Tokenresolutie is accountbewust. Config-tokenwaarden hebben voorrang op env-fallback. `DISCORD_BOT_TOKEN` wordt alleen gebruikt voor het standaardaccount.
Als twee ingeschakelde Discord-accounts naar dezelfde bottoken oplossen, start OpenClaw slechts één Gateway-monitor voor die token. Een token uit config heeft voorrang op de standaard env-fallback; anders wint het eerste ingeschakelde account en wordt het dubbele account als uitgeschakeld gerapporteerd.
Voor geavanceerde uitgaande calls (message-tool/kanaalacties) wordt een expliciete per-call `token` gebruikt voor die call. Dit geldt voor verzend- en lees-/probe-achtige acties (bijvoorbeeld read/search/fetch/thread/pins/permissions). Accountbeleid en retry-instellingen blijven afkomstig van het geselecteerde account in de actieve runtime-snapshot.
</Note>

## Aanbevolen: stel een guild-werkruimte in

Zodra DM's werken, kun je je Discord-server instellen als volledige werkruimte waarin elk kanaal een eigen agentsessie met eigen context krijgt. Dit wordt aanbevolen voor privéservers waar alleen jij en je bot zitten.

<Steps>
  <Step title="Voeg je server toe aan de guild-allowlist">
    Hierdoor kan je agent reageren in elk kanaal op je server, niet alleen in DM's.

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

    In guild-kanalen blijven normale definitieve assistentreplies standaard privé. Zichtbare Discord-uitvoer moet expliciet met de `message`-tool worden verzonden, zodat de agent standaard kan meelezen en alleen post wanneer deze besluit dat een kanaalantwoord nuttig is.

    <Tabs>
      <Tab title="Vraag het je agent">
        > "Sta mijn agent toe om op deze server te reageren zonder @mention nodig te hebben"
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

        Om verouderde automatische definitieve replies voor groeps-/kanaalruimtes te herstellen, stel je `messages.groupChat.visibleReplies: "automatic"` in.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Plan geheugen voor guild-kanalen">
    Standaard wordt langetermijngeheugen (MEMORY.md) alleen geladen in DM-sessies. Guild-kanalen laden MEMORY.md niet automatisch.

    <Tabs>
      <Tab title="Vraag het je agent">
        > "Wanneer ik vragen stel in Discord-kanalen, gebruik dan memory_search of memory_get als je langetermijncontext uit MEMORY.md nodig hebt."
      </Tab>
      <Tab title="Handmatig">
        Als je gedeelde context in elk kanaal nodig hebt, plaats dan de stabiele instructies in `AGENTS.md` of `USER.md` (deze worden voor elke sessie geïnjecteerd). Bewaar langetermijnnotities in `MEMORY.md` en open ze op aanvraag met geheugentools.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Maak nu een paar kanalen op je Discord-server en begin met chatten. Je agent kan de kanaalnaam zien, en elk kanaal krijgt zijn eigen geïsoleerde sessie — zodat je `#coding`, `#home`, `#research` of iets anders kunt instellen dat bij je workflow past.

## Runtimemodel

- Gateway beheert de Discord-verbinding.
- Antwoordroutering is deterministisch: inkomende antwoorden van Discord gaan terug naar Discord.
- Discord-gilde-/kanaalmetadata wordt aan de modelprompt toegevoegd als onvertrouwde
  context, niet als een voor de gebruiker zichtbaar antwoordprefix. Als een model die envelop
  terugkopieert, verwijdert OpenClaw de gekopieerde metadata uit uitgaande antwoorden en uit
  toekomstige replay-context.
- Standaard (`session.dmScope=main`) delen directe chats de hoofdsessie van de agent (`agent:main:main`).
- Gildekanalen zijn geisoleerde sessiesleutels (`agent:<agentId>:discord:channel:<channelId>`).
- Groeps-DM's worden standaard genegeerd (`channels.discord.dm.groupEnabled=false`).
- Native slash-opdrachten draaien in geisoleerde opdrachtsessies (`agent:<agentId>:discord:slash:<userId>`), terwijl ze nog steeds `CommandTargetSessionKey` meenemen naar de gerouteerde gesprekssessie.
- Tekst-only cron/Heartbeat-aankondigingslevering aan Discord gebruikt het uiteindelijke
  voor de assistant zichtbare antwoord eenmalig. Media en gestructureerde componentpayloads blijven
  uit meerdere berichten bestaan wanneer de agent meerdere leverbare payloads uitzendt.

## Forumkanalen

Discord-forum- en mediakanalen accepteren alleen threadberichten. OpenClaw ondersteunt twee manieren om ze te maken:

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

OpenClaw ondersteunt Discord-components v2-containers voor agentberichten. Gebruik de berichtentool met een `components`-payload. Interactieresultaten worden terug naar de agent gerouteerd als normale inkomende berichten en volgen de bestaande Discord-`replyToMode`-instellingen.

Ondersteunde blokken:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Actierijen staan maximaal 5 knoppen of een enkel selectiemenu toe
- Selectietypen: `string`, `user`, `role`, `mentionable`, `channel`

Standaard zijn componenten eenmalig te gebruiken. Stel `components.reusable=true` in om knoppen, selecties en formulieren meerdere keren te kunnen gebruiken totdat ze verlopen.

Om te beperken wie op een knop kan klikken, stel je `allowedUsers` in op die knop (Discord-gebruikers-ID's, tags of `*`). Wanneer dit is geconfigureerd, ontvangen niet-overeenkomende gebruikers een efemere weigering.

De slash-opdrachten `/model` en `/models` openen een interactieve modelkiezer met dropdowns voor provider, model en compatibele runtime, plus een stap Verzenden. `/models add` is verouderd en retourneert nu een verouderingsbericht in plaats van modellen vanuit chat te registreren. Het antwoord van de kiezer is efemeer en alleen de aanroepende gebruiker kan het gebruiken.

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
  <Tab title="DM policy">
    `channels.discord.dmPolicy` beheert DM-toegang. `channels.discord.allowFrom` is de canonieke DM-allowlist.

    - `pairing` (standaard)
    - `allowlist`
    - `open` (vereist dat `channels.discord.allowFrom` `"*"` bevat)
    - `disabled`

    Als het DM-beleid niet open is, worden onbekende gebruikers geblokkeerd (of gevraagd om te koppelen in `pairing`-modus).

    Prioriteit bij meerdere accounts:

    - `channels.discord.accounts.default.allowFrom` is alleen van toepassing op het `default`-account.
    - Voor een account heeft `allowFrom` voorrang op het verouderde `dm.allowFrom`.
    - Benoemde accounts erven `channels.discord.allowFrom` wanneer hun eigen `allowFrom` en verouderde `dm.allowFrom` niet zijn ingesteld.
    - Benoemde accounts erven `channels.discord.accounts.default.allowFrom` niet.

    Verouderde `channels.discord.dm.policy` en `channels.discord.dm.allowFrom` worden nog steeds gelezen voor compatibiliteit. `openclaw doctor --fix` migreert ze naar `dmPolicy` en `allowFrom` wanneer dat kan zonder de toegang te wijzigen.

    DM-doelformaat voor levering:

    - `user:<id>`
    - `<@id>`-vermelding

    Kale numerieke ID's worden normaal als kanaal-ID's opgelost wanneer een kanaalstandaard actief is, maar ID's die in de effectieve DM-`allowFrom` van het account staan, worden voor compatibiliteit behandeld als gebruiker-DM-doelen.

  </Tab>

  <Tab title="Guild policy">
    Gildeafhandeling wordt beheerd door `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    De veilige baseline wanneer `channels.discord` bestaat is `allowlist`.

    `allowlist`-gedrag:

    - gilde moet overeenkomen met `channels.discord.guilds` (`id` heeft de voorkeur, slug wordt geaccepteerd)
    - optionele allowlists voor afzenders: `users` (stabiele ID's aanbevolen) en `roles` (alleen rol-ID's); als een van beide is geconfigureerd, zijn afzenders toegestaan wanneer ze overeenkomen met `users` OF `roles`
    - directe naam-/tagmatching is standaard uitgeschakeld; schakel `channels.discord.dangerouslyAllowNameMatching: true` alleen in als noodcompatibiliteitsmodus
    - namen/tags worden ondersteund voor `users`, maar ID's zijn veiliger; `openclaw security audit` waarschuwt wanneer naam-/tagitems worden gebruikt
    - als een gilde `channels` heeft geconfigureerd, worden niet-vermelde kanalen geweigerd
    - als een gilde geen `channels`-blok heeft, zijn alle kanalen in dat allowlisted gilde toegestaan

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

  <Tab title="Mentions and group DMs">
    Gildeberichten zijn standaard afgeschermd met vermeldingen.

    Vermeldingsdetectie omvat:

    - expliciete botvermelding
    - geconfigureerde vermeldingspatronen (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - impliciet reply-to-bot-gedrag in ondersteunde gevallen

    `requireMention` wordt per gilde/kanaal geconfigureerd (`channels.discord.guilds...`).
    `ignoreOtherMentions` laat optioneel berichten vallen die een andere gebruiker/rol vermelden maar niet de bot (met uitzondering van @everyone/@here).

    Groeps-DM's:

    - standaard: genegeerd (`dm.groupEnabled=false`)
    - optionele allowlist via `dm.groupChannels` (kanaal-ID's of slugs)

  </Tab>
</Tabs>

### Rolgebaseerde agentroutering

Gebruik `bindings[].match.roles` om Discord-gildeleden op basis van rol-ID naar verschillende agents te routeren. Rolgebaseerde bindings accepteren alleen rol-ID's en worden geevalueerd na peer- of parent-peer-bindings en voor guild-only-bindings. Als een binding ook andere matchvelden instelt (bijvoorbeeld `peer` + `guildId` + `roles`), moeten alle geconfigureerde velden overeenkomen.

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
- `commands.native=false` wist expliciet eerder geregistreerde native Discord-opdrachten.
- Native opdrachtauthenticatie gebruikt dezelfde Discord-allowlists/-beleidsregels als normale berichtafhandeling.
- Opdrachten kunnen nog steeds zichtbaar zijn in de Discord-UI voor gebruikers die niet geautoriseerd zijn; uitvoering handhaaft nog steeds OpenClaw-authenticatie en retourneert "not authorized".

Zie [Slash-opdrachten](/nl/tools/slash-commands) voor de opdrachtencatalogus en het gedrag.

Standaardinstellingen voor slash-opdrachten:

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

    Let op: `off` schakelt impliciete reply-threading uit. Expliciete `[[reply_to_*]]`-tags worden nog steeds gerespecteerd.
    `first` koppelt altijd de impliciete native antwoordreferentie aan het eerste uitgaande Discord-bericht voor de beurt.
    `batched` koppelt de impliciete native antwoordreferentie van Discord alleen wanneer de
    inkomende beurt een gedebouncete batch van meerdere berichten was. Dit is nuttig
    wanneer je native antwoorden vooral wilt voor dubbelzinnige chats in bursts, niet voor elke
    beurt met een enkel bericht.

    Bericht-ID's worden in context/geschiedenis beschikbaar gemaakt zodat agents specifieke berichten kunnen targeten.

  </Accordion>

  <Accordion title="Live stream preview">
    OpenClaw kan conceptantwoorden streamen door een tijdelijk bericht te sturen en het te bewerken terwijl tekst binnenkomt. `channels.discord.streaming` accepteert `off` (standaard) | `partial` | `block` | `progress`. `progress` wordt op Discord naar `partial` gemapt; `streamMode` is een verouderd alias en wordt automatisch gemigreerd.

    De standaard blijft `off` omdat Discord-previewbewerkingen snel rate limits raken wanneer meerdere bots of gateways een account delen.

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

    - `partial` bewerkt een enkel previewbericht terwijl tokens binnenkomen.
    - `block` zendt conceptgrote chunks uit (gebruik `draftChunk` om grootte en afbreekpunten af te stemmen, begrensd tot `textChunkLimit`).
    - Media, fouten en expliciete-antwoordfinals annuleren openstaande previewbewerkingen.
    - `streaming.preview.toolProgress` (standaard `true`) beheert of tool-/voortgangsupdates het previewbericht hergebruiken.

    Previewstreaming is alleen tekst; media-antwoorden vallen terug op normale levering. Wanneer `block`-streaming expliciet is ingeschakeld, slaat OpenClaw de previewstream over om dubbel streamen te voorkomen.

  </Accordion>

  <Accordion title="History, context, and thread behavior">
    Gildegeschiedeniscontext:

    - `channels.discord.historyLimit` standaard `20`
    - fallback: `messages.groupChat.historyLimit`
    - `0` schakelt uit

    DM-geschiedenisinstellingen:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Threadgedrag:

    - Discord-threads routeren als kanaalsessies en nemen de configuratie van het bovenliggende kanaal over, tenzij die wordt overschreven.
    - Threadsessies nemen de sessieniveau-`/model`-selectie van het bovenliggende kanaal over als alleen-model-fallback; threadlokale `/model`-selecties hebben nog steeds voorrang en de transcriptgeschiedenis van het bovenliggende kanaal wordt niet gekopieerd, tenzij transcriptovererving is ingeschakeld.
    - `channels.discord.thread.inheritParent` (standaard `false`) laat nieuwe automatische threads starten met inhoud uit het bovenliggende transcript. Overrides per account staan onder `channels.discord.accounts.<id>.thread.inheritParent`.
    - Reacties van message-tools kunnen `user:<id>`-DM-doelen oplossen.
    - `guilds.<guild>.channels.<channel>.requireMention: false` blijft behouden tijdens de activatie-fallback in de antwoordfase.

    Kanaalonderwerpen worden geïnjecteerd als **niet-vertrouwde** context. Allowlists bepalen wie de agent kan activeren, maar vormen geen volledige redactiegrens voor aanvullende context.

  </Accordion>

  <Accordion title="Threadgebonden sessies voor subagenten">
    Discord kan een thread aan een sessiedoel koppelen, zodat vervolgberichten in die thread naar dezelfde sessie blijven routeren (inclusief subagentsessies).

    Commando's:

    - `/focus <target>` koppel huidige/nieuwe thread aan een subagent-/sessiedoel
    - `/unfocus` verwijder de huidige threadkoppeling
    - `/agents` toon actieve runs en koppelingsstatus
    - `/session idle <duration|off>` inspecteer/update automatisch ontfocussen bij inactiviteit voor gefocuste koppelingen
    - `/session max-age <duration|off>` inspecteer/update harde maximale leeftijd voor gefocuste koppelingen

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

    - `session.threadBindings.*` stelt globale standaarden in.
    - `channels.discord.threadBindings.*` overschrijft Discord-gedrag.
    - `spawnSubagentSessions` moet true zijn om automatisch threads aan te maken/te koppelen voor `sessions_spawn({ thread: true })`.
    - `spawnAcpSessions` moet true zijn om automatisch threads aan te maken/te koppelen voor ACP (`/acp spawn ... --thread ...` of `sessions_spawn({ runtime: "acp", thread: true })`).
    - Als threadkoppelingen voor een account zijn uitgeschakeld, zijn `/focus` en gerelateerde threadkoppelingsbewerkingen niet beschikbaar.

    Zie [Subagenten](/nl/tools/subagents), [ACP-agenten](/nl/tools/acp-agents) en [Configuratiereferentie](/nl/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Permanente ACP-kanaalkoppelingen">
    Configureer voor stabiele, altijd actieve ACP-werkruimten getypeerde ACP-koppelingen op topniveau die op Discord-gesprekken zijn gericht.

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

    - `/acp spawn codex --bind here` koppelt het huidige kanaal of de huidige thread ter plekke en houdt toekomstige berichten op dezelfde ACP-sessie. Threadberichten nemen de koppeling van het bovenliggende kanaal over.
    - In een gekoppeld kanaal of gekoppelde thread resetten `/new` en `/reset` dezelfde ACP-sessie ter plekke. Tijdelijke threadkoppelingen kunnen doelresolutie overschrijven terwijl ze actief zijn.
    - `spawnAcpSessions` is alleen vereist wanneer OpenClaw een onderliggende thread moet aanmaken/koppelen via `--thread auto|here`.

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
    `ackReaction` stuurt een bevestigingsemoji terwijl OpenClaw een inkomend bericht verwerkt.

    Resolutievolgorde:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - fallback naar emoji voor agentidentiteit (`agents.list[].identity.emoji`, anders "👀")

    Opmerkingen:

    - Discord accepteert unicode-emoji of aangepaste emojinamen.
    - Gebruik `""` om de reactie voor een kanaal of account uit te schakelen.

  </Accordion>

  <Accordion title="Configuratieschrijfacties">
    Door kanalen geïnitieerde configuratieschrijfacties zijn standaard ingeschakeld.

    Dit heeft invloed op `/config set|unset`-flows (wanneer commandofuncties zijn ingeschakeld).

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
    Routeer Discord Gateway-WebSocket-verkeer en REST-lookups bij het opstarten (applicatie-ID + allowlist-resolutie) via een HTTP(S)-proxy met `channels.discord.proxy`.

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
    Schakel PluralKit-resolutie in om geproxiede berichten te mappen naar de identiteit van systeemleden:

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
    - lookups gebruiken de oorspronkelijke bericht-ID en zijn tijdvensterbeperkt
    - als lookup mislukt, worden geproxiede berichten behandeld als botberichten en genegeerd, tenzij `allowBots=true`

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

    Activiteitstypekaart:

    - 0: Spelen
    - 1: Streaming (vereist `activityUrl`)
    - 2: Luisteren
    - 3: Kijken
    - 4: Aangepast (gebruikt de activiteitstekst als statustoestand; emoji is optioneel)
    - 5: Wedstrijden

    Voorbeeld van automatische presence (signaal voor runtimegezondheid):

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

    Automatische presence mapt runtimebeschikbaarheid naar Discord-status: gezond => online, verminderd of onbekend => inactief, uitgeput of niet beschikbaar => dnd. Optionele tekstoverrides:

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

    Discord schakelt native exec-goedkeuringen automatisch in wanneer `enabled` niet is ingesteld of `"auto"` is en er ten minste één goedkeurder kan worden opgelost, ofwel uit `execApprovals.approvers` of uit `commands.ownerAllowFrom`. Discord leidt exec-goedkeurders niet af uit kanaal-`allowFrom`, verouderde `dm.allowFrom` of direct-message-`defaultTo`. Stel `enabled: false` in om Discord expliciet uit te schakelen als native goedkeuringsclient.

    Voor gevoelige owner-only groepscommando's zoals `/diagnostics` en `/export-trajectory` stuurt OpenClaw goedkeuringsprompts en eindresultaten privé. Het probeert eerst Discord-DM wanneer de aanroepende eigenaar een Discord-ownerrout heeft; als die niet beschikbaar is, valt het terug op de eerste beschikbare ownerrout uit `commands.ownerAllowFrom`, zoals Telegram.

    Wanneer `target` `channel` of `both` is, is de goedkeuringsprompt zichtbaar in het kanaal. Alleen opgeloste goedkeurders kunnen de knoppen gebruiken; andere gebruikers ontvangen een vluchtige weigering. Goedkeuringsprompts bevatten de commandotekst, dus schakel kanaalbezorging alleen in vertrouwde kanalen in. Als de kanaal-ID niet uit de sessiesleutel kan worden afgeleid, valt OpenClaw terug op DM-bezorging.

    Discord rendert ook de gedeelde goedkeuringsknoppen die door andere chatkanalen worden gebruikt. De native Discord-adapter voegt vooral DM-routering voor goedkeurders en kanaalfanout toe.
    Wanneer die knoppen aanwezig zijn, vormen ze de primaire goedkeurings-UX; OpenClaw
    moet alleen een handmatig `/approve`-commando opnemen wanneer het toolresultaat aangeeft
    dat chatgoedkeuringen niet beschikbaar zijn of dat handmatige goedkeuring de enige route is.
    Als de native Discord-goedkeuringsruntime niet actief is, houdt OpenClaw de
    lokale deterministische `/approve <id> <decision>`-prompt zichtbaar. Als de
    runtime actief is maar er geen native kaart aan een doel kan worden bezorgd,
    stuurt OpenClaw een fallbackmelding in dezelfde chat met het exacte `/approve`-
    commando uit de wachtende goedkeuring.

    Gateway-authenticatie en goedkeuringsresolutie volgen het gedeelde Gateway-clientcontract (`plugin:`-ID's worden opgelost via `plugin.approval.resolve`; andere ID's via `exec.approval.resolve`). Goedkeuringen verlopen standaard na 30 minuten.

    Zie [Exec-goedkeuringen](/nl/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Tools en actiepoorten

Discord-berichtacties omvatten berichten, kanaalbeheer, moderatie, presence en metadata-acties.

Kernvoorbeelden:

- berichten: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- reacties: `react`, `reactions`, `emojiList`
- moderatie: `timeout`, `kick`, `ban`
- presence: `setPresence`

De actie `event-create` accepteert een optionele parameter `image` (URL of lokaal bestandspad) om de omslagafbeelding van de geplande gebeurtenis in te stellen.

Actiepoorten staan onder `channels.discord.actions.*`.

Standaardgedrag van poorten:

| Actiegroep                                                                                                                                                               | Standaard    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------ |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | ingeschakeld |
| roles                                                                                                                                                                    | uitgeschakeld |
| moderation                                                                                                                                                               | uitgeschakeld |
| presence                                                                                                                                                                 | uitgeschakeld |

## Componenten v2-UI

OpenClaw gebruikt Discord-componenten v2 voor exec-goedkeuringen en contextoverschrijdende markeringen. Discord-berichtacties kunnen ook `components` accepteren voor aangepaste UI (geavanceerd; vereist het samenstellen van een componentpayload via de discord-tool), terwijl verouderde `embeds` beschikbaar blijven maar niet worden aanbevolen.

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

Discord heeft twee afzonderlijke spraakoppervlakken: realtime **spraakkanalen** (doorlopende gesprekken) en **spraakberichtbijlagen** (het waveform-previewformaat). De Gateway ondersteunt beide.

### Spraakkanalen

Setup-checklist:

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
- `voice.model` overschrijft alleen de LLM die wordt gebruikt voor Discord-spraakkanaalantwoorden. Laat dit leeg om het gerouteerde agentmodel te erven.
- STT gebruikt `tools.media.audio`; `voice.model` heeft geen invloed op transcriptie.
- Spraaktranscriptiebeurten leiden eigenaarstatus af van Discord `allowFrom` (of `dm.allowFrom`); niet-eigenaarsprekers hebben geen toegang tot eigenaar-only tools (bijvoorbeeld `gateway` en `cron`).
- Spraak is standaard ingeschakeld; stel `channels.discord.voice.enabled=false` in om de spraakruntime en de `GuildVoiceStates` Gateway-intent uit te schakelen.
- `channels.discord.intents.voiceStates` kan het abonnement op de voice-state-intent expliciet overschrijven. Laat dit leeg zodat de intent `voice.enabled` volgt.
- `voice.daveEncryption` en `voice.decryptionFailureTolerance` worden doorgegeven aan de join-opties van `@discordjs/voice`.
- De standaardwaarden van `@discordjs/voice` zijn `daveEncryption=true` en `decryptionFailureTolerance=24` als ze niet zijn ingesteld.
- OpenClaw bewaakt ook decryptiefouten bij ontvangst en herstelt automatisch door het spraakkanaal te verlaten en opnieuw deel te nemen na herhaalde fouten binnen een kort venster.
- Als ontvangstlogs na het bijwerken herhaaldelijk `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` tonen, verzamel dan een dependencyrapport en logs. De meegeleverde `@discordjs/voice`-lijn bevat de upstream-paddingfix uit discord.js PR #11449, die discord.js-issue #11419 heeft gesloten.

Spraakkanaalpijplijn:

- Discord PCM-opname wordt geconverteerd naar een tijdelijk WAV-bestand.
- `tools.media.audio` handelt STT af, bijvoorbeeld `openai/gpt-4o-mini-transcribe`.
- Het transcript wordt via normale Discord-ingress en routering verzonden.
- `voice.model`, wanneer ingesteld, overschrijft alleen de antwoord-LLM voor deze spraakkanaalbeurt.
- `voice.tts` wordt samengevoegd bovenop `messages.tts`; de resulterende audio wordt afgespeeld in het kanaal waarin is deelgenomen.

Referenties worden per component opgelost: LLM-route-auth voor `voice.model`, STT-auth voor `tools.media.audio` en TTS-auth voor `messages.tts`/`voice.tts`.

### Spraakberichten

Discord-spraakberichten tonen een waveform-preview en vereisen OGG/Opus-audio. OpenClaw genereert de waveform automatisch, maar heeft `ffmpeg` en `ffprobe` nodig op de Gateway-host om te inspecteren en te converteren.

- Geef een **lokaal bestandspad** op (URL's worden geweigerd).
- Laat tekstinhoud weg (Discord weigert tekst + spraakbericht in dezelfde payload).
- Elk audioformaat wordt geaccepteerd; OpenClaw converteert naar OGG/Opus wanneer nodig.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Problemen oplossen

<AccordionGroup>
  <Accordion title="Used disallowed intents or bot sees no guild messages">

    - schakel Message Content Intent in
    - schakel Server Members Intent in wanneer je afhankelijk bent van gebruikers-/ledenresolutie
    - herstart de Gateway na het wijzigen van intents

  </Accordion>

  <Accordion title="Guild messages blocked unexpectedly">

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

  <Accordion title="Require mention false but still blocked">
    Veelvoorkomende oorzaken:

    - `groupPolicy="allowlist"` zonder overeenkomende guild-/kanaalallowlist
    - `requireMention` op de verkeerde plaats geconfigureerd (moet onder `channels.discord.guilds` of kanaalvermelding staan)
    - afzender geblokkeerd door guild-/kanaal-`users`-allowlist

  </Accordion>

  <Accordion title="Long-running Discord turns or duplicate replies">

    Typische logs:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Knoppen voor de Discord Gateway-wachtrij:

    - enkel account: `channels.discord.eventQueue.listenerTimeout`
    - meerdere accounts: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - dit beheert alleen Discord Gateway-listenerwerk, niet de levensduur van agentbeurten

    Discord past geen kanaaleigen timeout toe op agentbeurten in de wachtrij. Berichtlisteners geven direct door, en Discord-runs in de wachtrij behouden de volgorde per sessie totdat de sessie-/tool-/runtimelevenscyclus is voltooid of het werk wordt afgebroken.

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
    OpenClaw haalt Discord `/gateway/bot`-metadata op voordat verbinding wordt gemaakt. Tijdelijke fouten vallen terug op Discord's standaard-Gateway-URL en worden in logs rate-limited.

    Metadata-timeoutknoppen:

    - enkel account: `channels.discord.gatewayInfoTimeoutMs`
    - meerdere accounts: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - env-fallback wanneer configuratie niet is ingesteld: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - standaard: `30000` (30 seconden), max: `120000`

  </Accordion>

  <Accordion title="Permissions audit mismatches">
    `channels status --probe`-permissiecontroles werken alleen voor numerieke kanaal-ID's.

    Als je slug-sleutels gebruikt, kan runtime-matching nog steeds werken, maar de probe kan permissies niet volledig verifiëren.

  </Accordion>

  <Accordion title="DM and pairing issues">

    - DM uitgeschakeld: `channels.discord.dm.enabled=false`
    - DM-beleid uitgeschakeld: `channels.discord.dmPolicy="disabled"` (legacy: `channels.discord.dm.policy`)
    - wacht op koppelingsgoedkeuring in `pairing`-modus

  </Accordion>

  <Accordion title="Bot to bot loops">
    Standaard worden berichten die door bots zijn opgesteld genegeerd.

    Als je `channels.discord.allowBots=true` instelt, gebruik dan strikte vermeldings- en allowlistregels om lusgedrag te voorkomen.
    Geef de voorkeur aan `channels.discord.allowBots="mentions"` om alleen botberichten te accepteren die de bot vermelden.

  </Accordion>

  <Accordion title="Voice STT drops with DecryptionFailed(...)">

    - houd OpenClaw actueel (`openclaw update`) zodat de herstellogica voor Discord-spraakontvangst aanwezig is
    - bevestig `channels.discord.voice.daveEncryption=true` (standaard)
    - begin met `channels.discord.voice.decryptionFailureTolerance=24` (upstreamstandaard) en stem alleen af indien nodig
    - bekijk logs voor:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - als fouten na automatische herdeelname blijven optreden, verzamel logs en vergelijk met de upstream DAVE-ontvangstgeschiedenis in [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) en [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Configuratiereferentie

Primaire referentie: [Configuratiereferentie - Discord](/nl/gateway/config-channels#discord).

<Accordion title="High-signal Discord fields">

- opstart/auth: `enabled`, `token`, `accounts.*`, `allowBots`
- beleid: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- opdracht: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- eventwachtrij: `eventQueue.listenerTimeout` (listenerbudget), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Gateway-metadata: `gatewayInfoTimeoutMs`
- antwoord/geschiedenis: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- levering: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming` (legacy-alias: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- media/opnieuw proberen: `mediaMaxMb` (begrenst uitgaande Discord-uploads, standaard `100MB`), `retry`
- acties: `actions.*`
- aanwezigheid: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- functies: `threadBindings`, top-level `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## Veiligheid en beheer

- Behandel bottokens als geheimen (`DISCORD_BOT_TOKEN` heeft de voorkeur in bewaakte omgevingen).
- Verleen Discord-permissies met minimale rechten.
- Als opdrachtdeploy/-status verouderd is, herstart de Gateway en controleer opnieuw met `openclaw channels status --probe`.

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Koppelen" icon="link" href="/nl/channels/pairing">
    Koppel een Discord-gebruiker aan de Gateway.
  </Card>
  <Card title="Groepen" icon="users" href="/nl/channels/groups">
    Gedrag voor groepschats en toelatingslijsten.
  </Card>
  <Card title="Kanaalroutering" icon="route" href="/nl/channels/channel-routing">
    Routeer inkomende berichten naar agenten.
  </Card>
  <Card title="Beveiliging" icon="shield" href="/nl/gateway/security">
    Dreigingsmodel en beveiligingsmaatregelen.
  </Card>
  <Card title="Multi-agent-routering" icon="sitemap" href="/nl/concepts/multi-agent">
    Koppel guilds en kanalen aan agenten.
  </Card>
  <Card title="Slash-opdrachten" icon="terminal" href="/nl/tools/slash-commands">
    Gedrag van native opdrachten.
  </Card>
</CardGroup>
