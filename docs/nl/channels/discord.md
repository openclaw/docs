---
read_when:
    - Werken aan functies voor het Discord-kanaal
summary: Instellen van een Discord-bot, configuratiesleutels, componenten, spraak en probleemoplossing
title: Discord
x-i18n:
    generated_at: "2026-07-12T08:36:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ae3682462003a04e57acbdc98a3713e5ef83f89384b7f3b79633c344855b715
    source_path: channels/discord.md
    workflow: 16
---

OpenClaw maakt via de officiële Discord Gateway als bot verbinding met Discord. DM's en guildkanalen worden ondersteund.

<CardGroup cols={3}>
  <Card title="Koppelen" icon="link" href="/nl/channels/pairing">
    Discord-DM's gebruiken standaard de koppelingsmodus.
  </Card>
  <Card title="Slash-opdrachten" icon="terminal" href="/nl/tools/slash-commands">
    Gedrag van systeemeigen opdrachten en opdrachtencatalogus.
  </Card>
  <Card title="Problemen met kanalen oplossen" icon="wrench" href="/nl/channels/troubleshooting">
    Diagnose- en herstelproces voor meerdere kanalen.
  </Card>
</CardGroup>

## Snelle installatie

Maak een Discord-toepassing met een bot, voeg de bot toe aan je server en koppel deze aan OpenClaw. Gebruik indien mogelijk een privéserver; [maak er eerst een](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (**Create My Own > For me and my friends**) als dat nodig is.

<Steps>
  <Step title="Een Discord-toepassing en bot maken">
    Klik in het [Discord Developer Portal](https://discord.com/developers/applications) op **New Application** en geef de toepassing een naam (bijvoorbeeld 'OpenClaw').

    Open **Bot** in de zijbalk en stel **Username** in op de naam van je agent.

  </Step>

  <Step title="Bevoorrechte intents inschakelen">
    Schakel, nog steeds op de pagina **Bot**, onder **Privileged Gateway Intents** het volgende in:

    - **Message Content Intent** (vereist)
    - **Server Members Intent** (aanbevolen; vereist voor rollenlijsten met toegestane rollen, omzetting van namen naar ID's en toegangsgroepen voor het kanaalpubliek)
    - **Presence Intent** (optioneel; alleen voor aanwezigheidsupdates)

  </Step>

  <Step title="Je bottoken kopiëren">
    Klik op de pagina **Bot** op **Reset Token** en kopieer het token.

    <Note>
    Ondanks de naam wordt hiermee je eerste token gegenereerd; er wordt niets 'opnieuw ingesteld'.
    </Note>

  </Step>

  <Step title="Een uitnodigings-URL genereren en de bot aan je server toevoegen">
    Open **OAuth2** in de zijbalk. Schakel in de **OAuth2 URL Generator** de volgende bereiken in:

    - `bot`
    - `applications.commands`

    Schakel in het gedeelte **Bot Permissions** dat verschijnt ten minste het volgende in:

    **General Permissions**
      - View Channels

    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (optioneel)

    Dit is de basis voor normale tekstkanalen. Als de bot berichten in threads plaatst — waaronder werkstromen voor forum- of mediakanalen die een thread maken of voortzetten — schakel dan ook **Send Messages in Threads** in.

    Kopieer de gegenereerde URL, open deze in een browser, selecteer je server en klik op **Continue**. De bot zou nu op je server moeten verschijnen.

  </Step>

  <Step title="Developer Mode inschakelen en je ID's verzamelen">
    Schakel Developer Mode in de Discord-app in, zodat je ID's kunt kopiëren:

    1. **User Settings** (tandwielpictogram) → **Developer** → schakel **Developer Mode** in
       *(op mobiel: **App Settings** → **Advanced**)*
    2. Klik met de rechtermuisknop op je **serverpictogram** → **Copy Server ID**
    3. Klik met de rechtermuisknop op je **eigen avatar** → **Copy User ID**

    Bewaar de server-ID en gebruikers-ID samen met je bottoken; je hebt ze alle drie nodig voor de volgende stap.

  </Step>

  <Step title="DM's van serverleden toestaan">
    Discord moet toestaan dat de bot je een DM stuurt om de koppeling te laten werken. Klik met de rechtermuisknop op je **serverpictogram** → **Privacy Settings** → schakel **Direct Messages** in.

    Laat dit ingeschakeld als je Discord-DM's met OpenClaw gebruikt. Als je alleen guildkanalen gebruikt, kun je dit na het koppelen uitschakelen.

  </Step>

  <Step title="Je bottoken veilig instellen (verstuur het niet in de chat)">
    Het bottoken is geheim. Stel het in op de machine waarop OpenClaw wordt uitgevoerd voordat je je agent een bericht stuurt:

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

    Als OpenClaw al als achtergrondservice wordt uitgevoerd, start je deze opnieuw via de OpenClaw Mac-app of door het proces `openclaw gateway run` te stoppen en opnieuw te starten.
    Voer voor beheerde service-installaties `openclaw gateway install` uit vanuit een shell waarin `DISCORD_BOT_TOKEN` is ingesteld, of sla de variabele op in `~/.openclaw/.env`, zodat de service de omgevings-SecretRef na het opnieuw starten kan omzetten.
    Als je host wordt geblokkeerd of beperkt door Discord bij het opzoeken van de toepassing tijdens het opstarten, stel je de toepassings-/client-ID uit het Developer Portal in, zodat die REST-aanroep bij het opstarten kan worden overgeslagen: `channels.discord.applicationId` voor het standaardaccount of `channels.discord.accounts.<accountId>.applicationId` per bot.

  </Step>

  <Step title="OpenClaw configureren en koppelen">

    <Tabs>
      <Tab title="Je agent vragen">
        Chat met je OpenClaw-agent via een bestaand kanaal (bijvoorbeeld Telegram) en geef de instructie door. Als Discord je eerste kanaal is, gebruik je in plaats daarvan het tabblad CLI/configuratie.

        > 'Ik heb mijn Discord-bottoken al in de configuratie ingesteld. Rond de Discord-installatie af met gebruikers-ID `<user_id>` en server-ID `<server_id>`.'
      </Tab>
      <Tab title="CLI/configuratie">
        Configuratie op basis van een bestand:

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

        Terugval op een omgevingsvariabele voor het standaardaccount:

```bash
DISCORD_BOT_TOKEN=...
```

        Schrijf voor een gescripte of externe installatie hetzelfde JSON5-blok met `openclaw config patch --file ./discord.patch.json5 --dry-run` en voer de opdracht daarna opnieuw uit zonder `--dry-run`. Tokens als platte tekst werken ook en SecretRef-waarden worden voor `channels.discord.token` ondersteund via omgevings-, bestands- en uitvoeringsproviders. Zie [Geheimenbeheer](/nl/gateway/secrets).

        Bewaar voor meerdere Discord-bots het bottoken en de toepassings-ID van elke bot onder het bijbehorende account. Een `channels.discord.applicationId` op het hoogste niveau wordt overgenomen door accounts; stel deze daar dus alleen in als elk account dezelfde toepassings-ID gebruikt.

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

  <Step title="De eerste DM-koppeling goedkeuren">
    Stuur je bot een DM in Discord zodra de Gateway actief is. De bot antwoordt met een koppelingscode.

    <Tabs>
      <Tab title="Je agent vragen">
        Stuur de koppelingscode via je bestaande kanaal naar je agent:

        > 'Keur deze Discord-koppelingscode goed: `<CODE>`'
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    Koppelingscodes verlopen na 1 uur. Na goedkeuring kun je via een Discord-DM met je agent chatten.

  </Step>
</Steps>

<Note>
Tokenomzetting houdt rekening met accounts. Tokenwaarden uit de configuratie hebben voorrang op de terugvalwaarde uit de omgeving en `DISCORD_BOT_TOKEN` wordt alleen voor het standaardaccount gebruikt.
Als twee ingeschakelde Discord-accounts hetzelfde bottoken opleveren, start OpenClaw slechts één Gateway-monitor voor dat token: een token uit de configuratie heeft voorrang op de terugvalwaarde uit de omgeving; anders heeft het eerste ingeschakelde account voorrang en wordt het dubbele account als uitgeschakeld gerapporteerd met de reden `duplicate bot token`.
Voor geavanceerde uitgaande aanroepen (berichtentool/kanaalacties) wordt een expliciet `token` per aanroep voor die aanroep gebruikt. Dit geldt voor verzendacties en lees-/controleachtige acties (lezen/zoeken/ophalen/thread/vastgemaakte berichten/machtigingen). Het beleid en de instellingen voor nieuwe pogingen van het account zijn nog steeds afkomstig uit het geselecteerde account in de actieve runtime-momentopname.
</Note>

## Aanbevolen: een guildwerkruimte instellen

Zodra DM's werken, kun je van je server een volledige werkruimte maken waarin elk kanaal een eigen agentsessie met een eigen context krijgt. Dit wordt aanbevolen voor privéservers waarop alleen jij en je bot aanwezig zijn.

<Steps>
  <Step title="Je server aan de guildlijst met toegestane servers toevoegen">
    Hierdoor kan je agent in elk kanaal op je server antwoorden, niet alleen in DM's.

    <Tabs>
      <Tab title="Je agent vragen">
        > 'Voeg mijn Discord-server-ID `<server_id>` toe aan de guildlijst met toegestane servers'
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

  <Step title="Antwoorden zonder @vermelding toestaan">
    Standaard antwoordt de agent alleen in guildkanalen wanneer deze met een @ wordt vermeld. Op een privéserver wil je waarschijnlijk dat de agent op elk bericht antwoordt.

    In guildkanalen worden normale antwoorden standaard automatisch geplaatst. Schakel voor gedeelde ruimtes die altijd actief zijn `messages.groupChat.visibleReplies: "message_tool"` in, zodat de agent kan meelezen en alleen een bericht plaatst wanneer die besluit dat een antwoord in het kanaal nuttig is. Dit werkt het beste met modellen van de nieuwste generatie die betrouwbaar met tools omgaan, zoals GPT-5.6 Sol. Gebeurtenissen in omgevingsruimtes blijven stil, tenzij de tool iets verzendt. Zie [Gebeurtenissen in omgevingsruimtes](/nl/channels/ambient-room-events) voor de volledige configuratie van de meeleesmodus.

    Als Discord aangeeft dat er wordt getypt en de logboeken tokengebruik tonen, maar er geen bericht wordt geplaatst, controleer dan of de beurt als een gebeurtenis in een omgevingsruimte was geconfigureerd of dat zichtbare antwoorden via de berichtentool waren ingeschakeld.

    <Tabs>
      <Tab title="Je agent vragen">
        > 'Sta toe dat mijn agent op deze server antwoordt zonder dat die met een @ hoeft te worden vermeld'
      </Tab>
      <Tab title="Configuratie">
        Stel `requireMention: false` in je guildconfiguratie in:

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

        Stel `messages.groupChat.visibleReplies: "message_tool"` in om verzending via de berichtentool te vereisen voor zichtbare antwoorden in groepen en kanalen.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Geheugen in guildkanalen plannen">
    Langetermijngeheugen (MEMORY.md) wordt alleen automatisch in DM-sessies geladen; guildkanalen laden het niet.

    <Tabs>
      <Tab title="Je agent vragen">
        > 'Gebruik memory_search of memory_get wanneer ik vragen stel in Discord-kanalen en je langetermijncontext uit MEMORY.md nodig hebt.'
      </Tab>
      <Tab title="Handmatig">
        Plaats stabiele instructies in `AGENTS.md` of `USER.md` voor gedeelde context in elk kanaal (deze worden in elke sessie geïnjecteerd). Bewaar langetermijnnotities in `MEMORY.md` en open ze wanneer nodig met geheugentools.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Maak nu kanalen en begin met chatten. De agent ziet de kanaalnaam en elk kanaal is een geïsoleerde sessie — stel `#programmeren`, `#thuis`, `#onderzoek` of andere kanalen in die bij je werkstroom passen.

## Runtimemodel

- De Gateway beheert de Discord-verbinding.
- De routering van antwoorden is deterministisch: inkomende Discord-berichten worden in Discord beantwoord.
- Metagegevens van Discord-guilds en -kanalen worden als niet-vertrouwde context aan de modelprompt toegevoegd, niet als een voor de gebruiker zichtbaar antwoordvoorvoegsel. Als een model die omhulling terugkopieert, verwijdert OpenClaw de gekopieerde metagegevens uit uitgaande antwoorden en uit toekomstige herhalingscontext.
- Directe chats delen standaard (`session.dmScope=main`) de hoofdsessie van de agent (`agent:main:main`).
- Guildkanalen hebben geïsoleerde sessiesleutels (`agent:<agentId>:discord:channel:<channelId>`).
- Groeps-DM's worden standaard genegeerd (`channels.discord.dm.groupEnabled=false`).
- Systeemeigen slash-opdrachten worden uitgevoerd in geïsoleerde opdrachtsessies (`agent:<agentId>:discord:slash:<userId>`), waarbij `CommandTargetSessionKey` nog steeds wordt doorgegeven aan de gerouteerde gesprekssessie.
- De levering van aankondigingen met alleen tekst vanuit Cron/Heartbeat aan Discord wordt samengevoegd tot het uiteindelijke, voor de assistent zichtbare antwoord en eenmaal verzonden. Media en gestructureerde componentladingen blijven uit meerdere berichten bestaan wanneer de agent meerdere leverbare ladingen produceert.

## Forumkanalen

Discord-forum- en mediakanalen accepteren alleen threadberichten. OpenClaw ondersteunt twee manieren om deze te maken:

- Stuur een bericht naar het bovenliggende forumkanaal (`channel:<forumId>`) om automatisch een thread aan te maken. De threadtitel is de eerste niet-lege regel van het bericht (afgekapt tot Discords limiet van 100 tekens voor threadnamen).
- Gebruik `openclaw message thread create` om rechtstreeks een thread aan te maken. Geef `--message-id` niet door voor forumkanalen.

Stuur naar het bovenliggende forumkanaal om een thread aan te maken:

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Maak expliciet een forumthread aan:

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Bovenliggende forumkanalen accepteren geen Discord-componenten. Als u componenten nodig hebt, stuur dan naar de thread zelf (`channel:<threadId>`).

## Interactieve componenten

OpenClaw ondersteunt Discord-componentcontainers van versie 2 voor agentberichten. Gebruik de berichttool met een `components`-payload. Interactieresultaten worden als normale inkomende berichten teruggestuurd naar de agent en volgen de bestaande Discord-instellingen voor `replyToMode`.

Ondersteunde blokken:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Actierijen staan maximaal 5 knoppen of één selectiemenu toe
- Selectietypen: `string`, `user`, `role`, `mentionable`, `channel`

Componenten zijn standaard voor eenmalig gebruik. Stel `components.reusable=true` in om toe te staan dat knoppen, selecties en formulieren meerdere keren worden gebruikt totdat ze verlopen.

Om te beperken wie op een knop kan klikken, stelt u `allowedUsers` in voor die knop (Discord-gebruikers-ID's, tags of `*`). Niet-overeenkomende gebruikers ontvangen een tijdelijke afwijzing.

Componentcallbacks verlopen standaard na 30 minuten. Stel `channels.discord.agentComponents.ttlMs` in om de levensduur van het callbackregister voor het standaardaccount te wijzigen, of `channels.discord.accounts.<accountId>.agentComponents.ttlMs` per account. De waarde is in milliseconden, moet een positief geheel getal zijn en is begrensd op `86400000` (24 uur). Langere TTL's zijn geschikt voor beoordelings- en goedkeuringswerkstromen waarbij knoppen bruikbaar moeten blijven, maar verlengen het tijdvenster waarin een oud Discord-bericht nog een actie kan activeren. Kies bij voorkeur de kortst passende TTL en behoud de standaardwaarde wanneer verouderde callbacks onverwacht zouden zijn.

De slash-opdrachten `/model` en `/models` openen een interactieve modelkiezer met vervolgkeuzelijsten voor provider, model en compatibele runtime, plus een indieningsstap. `/models add` is verouderd en retourneert een verouderingsmelding in plaats van modellen vanuit de chat te registreren. Het antwoord van de kiezer is tijdelijk en kan alleen worden gebruikt door de gebruiker die de opdracht heeft aangeroepen. Discord-selectiemenu's zijn beperkt tot 25 opties. Voeg daarom `provider/*`-vermeldingen toe aan `agents.defaults.models` wanneer u wilt dat de kiezer dynamisch ontdekte modellen alleen toont voor geselecteerde providers zoals `openai` of `vllm`.

Bestandsbijlagen:

- `file`-blokken moeten verwijzen naar een bijlagereferentie (`attachment://<filename>`)
- Lever de bijlage aan via `media`/`path`/`filePath` (één bestand); gebruik `media-gallery` voor meerdere bestanden
- Gebruik `filename` om de uploadnaam te overschrijven wanneer deze met de bijlagereferentie moet overeenkomen

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

## Toegangsbeheer en routering

<Tabs>
  <Tab title="DM-beleid">
    `channels.discord.dmPolicy` beheert DM-toegang. `channels.discord.allowFrom` is de canonieke DM-toestaanlijst.

    - `pairing` (standaard)
    - `allowlist` (vereist ten minste één `allowFrom`-afzender)
    - `open` (vereist dat `channels.discord.allowFrom` `"*"` bevat)
    - `disabled`

    Als het DM-beleid niet open is, worden onbekende gebruikers geblokkeerd (of gevraagd om te koppelen in de modus `pairing`).

    Prioriteitsvolgorde bij meerdere accounts:

    - `channels.discord.accounts.default.allowFrom` is alleen van toepassing op het account `default`.
    - Voor één account heeft `allowFrom` voorrang op het verouderde `dm.allowFrom`.
    - Benoemde accounts nemen `channels.discord.allowFrom` over wanneer hun eigen `allowFrom` en verouderde `dm.allowFrom` niet zijn ingesteld.
    - Benoemde accounts nemen `channels.discord.accounts.default.allowFrom` niet over.

    De verouderde instellingen `channels.discord.dm.policy` en `channels.discord.dm.allowFrom` worden voor compatibiliteit nog steeds gelezen. `openclaw doctor --fix` migreert ze naar `dmPolicy` en `allowFrom` wanneer dat kan zonder de toegang te wijzigen.

    DM-doelindeling voor bezorging:

    - `user:<id>`
    - `<@id>`-vermelding

    Kale numerieke ID's worden normaal gesproken als kanaal-ID's geïnterpreteerd wanneer een standaardkanaal actief is, maar ID's die voorkomen in de effectieve DM-`allowFrom` van het account worden voor compatibiliteit behandeld als DM-doelen van gebruikers.

  </Tab>

  <Tab title="Toegangsgroepen">
    Discord-DM's en autorisatie voor tekstopdrachten kunnen dynamische `accessGroup:<name>`-vermeldingen in `channels.discord.allowFrom` gebruiken.

    Namen van toegangsgroepen worden gedeeld tussen berichtkanalen. Gebruik `type: "message.senders"` voor een statische groep waarvan de leden worden uitgedrukt in de normale `allowFrom`-syntaxis van elk kanaal, of `type: "discord.channelAudience"` wanneer het huidige `ViewChannel`-publiek van een Discord-kanaal het lidmaatschap dynamisch moet bepalen. Gedeeld gedrag van toegangsgroepen: [Toegangsgroepen](/nl/channels/access-groups).

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

    Een Discord-tekstkanaal heeft geen afzonderlijke ledenlijst. `type: "discord.channelAudience"` modelleert het lidmaatschap als volgt: de DM-afzender is lid van de geconfigureerde server en heeft momenteel de effectieve machtiging `ViewChannel` voor het geconfigureerde kanaal nadat rol- en kanaaloverschrijvingen zijn toegepast.

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

    U kunt dynamische en statische vermeldingen combineren:

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

    Zoekacties weigeren standaard toegang bij fouten. Als Discord `Missing Access` retourneert, het opzoeken van het lid mislukt of het kanaal bij een andere server hoort, wordt de DM-afzender als niet-geautoriseerd behandeld.

    Schakel in de Discord Developer Portal **Server Members Intent** in wanneer u toegangsgroepen op basis van het kanaalpubliek gebruikt. DM's bevatten geen status van serverleden, dus OpenClaw zoekt het lid tijdens de autorisatie op via Discord REST.

  </Tab>

  <Tab title="Serverbeleid">
    De verwerking van servers wordt beheerd door `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    De veilige uitgangswaarde wanneer `channels.discord` bestaat, is `allowlist`.

    Gedrag van `allowlist`:

    - de server moet overeenkomen met `channels.discord.guilds` (`id` heeft de voorkeur, slug wordt geaccepteerd)
    - optionele toestaanlijsten voor afzenders: `users` (stabiele ID's aanbevolen) en `roles` (alleen rol-ID's); als een van beide is geconfigureerd, zijn afzenders toegestaan wanneer ze overeenkomen met `users` OF `roles`
    - directe overeenkomst op naam/tag is standaard uitgeschakeld; schakel `channels.discord.dangerouslyAllowNameMatching: true` alleen in als noodcompatibiliteitsmodus
    - namen/tags worden ondersteund voor `users`, maar ID's zijn veiliger; `openclaw security audit` waarschuwt wanneer naam-/tagvermeldingen worden gebruikt
    - als voor een server `channels` is geconfigureerd, worden niet-vermelde kanalen geweigerd
    - als een server geen `channels`-blok heeft, zijn alle kanalen in die server op de toestaanlijst toegestaan

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
            general: { enabled: true },
            help: { enabled: true, requireMention: true },
          },
        },
      },
    },
  },
}
```

    De verouderde sleutel `allow` per kanaal wordt door `openclaw doctor --fix` gemigreerd naar `enabled`.

    Als u alleen `DISCORD_BOT_TOKEN` instelt en geen `channels.discord`-blok aanmaakt, is de runtime-terugval `groupPolicy="allowlist"` (met een waarschuwing in de logboeken), zelfs als `channels.defaults.groupPolicy` `open` is.

  </Tab>

  <Tab title="Vermeldingen en groeps-DM's">
    Voor serverberichten is standaard een vermelding vereist.

    Detectie van vermeldingen omvat:

    - expliciete vermelding van de bot
    - geconfigureerde vermeldingspatronen (`agents.list[].groupChat.mentionPatterns`, met terugval naar `messages.groupChat.mentionPatterns`)
    - impliciet antwoord-aan-botgedrag in ondersteunde gevallen

    Gebruik bij het schrijven van uitgaande Discord-berichten de canonieke vermeldingssyntaxis: `<@USER_ID>` voor gebruikers, `<#CHANNEL_ID>` voor kanalen en `<@&ROLE_ID>` voor rollen. Gebruik niet de verouderde bijnaamvermeldingsvorm `<@!USER_ID>`.

    `requireMention` wordt per server/kanaal geconfigureerd (`channels.discord.guilds...`).
    `ignoreOtherMentions` negeert optioneel berichten die een andere gebruiker/rol vermelden maar niet de bot (met uitzondering van @everyone/@here).

    Groeps-DM's:

    - standaard: genegeerd (`dm.groupEnabled=false`)
    - optionele toestaanlijst via `dm.groupChannels` (kanaal-ID's of slugs)

  </Tab>
</Tabs>

### Agentroutering op basis van rollen

Gebruik `bindings[].match.roles` om Discord-serverleden op basis van rol-ID naar verschillende agents te routeren. Rolgebaseerde bindingen accepteren alleen rol-ID's en worden geëvalueerd na bindingen voor peers of bovenliggende peers en vóór bindingen die alleen voor servers gelden. Als een binding ook andere overeenkomstvelden instelt (bijvoorbeeld `peer` + `guildId` + `roles`), moeten alle geconfigureerde velden overeenkomen.

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

## Systeemeigen opdrachten en opdracht­autorisatie

- `commands.native` is standaard ingesteld op `"auto"` en is ingeschakeld voor Discord.
- Overschrijving per kanaal: `channels.discord.commands.native`.
- Met `commands.native=false` worden registratie en opschoning van Discord-slashcommando's tijdens het opstarten overgeslagen. Eerder geregistreerde commando's kunnen zichtbaar blijven in Discord totdat u ze uit de Discord-app verwijdert.
- Autorisatie voor systeemeigen commando's gebruikt dezelfde Discord-toelatingslijsten en hetzelfde beleid als normale berichtverwerking.
- Commando's kunnen in de Discord-interface nog steeds zichtbaar zijn voor onbevoegde gebruikers; bij uitvoering wordt OpenClaw-autorisatie afgedwongen en wordt "niet geautoriseerd" geantwoord.
- Standaardinstellingen voor slashcommando's: `ephemeral: true` (`channels.discord.slashCommand.ephemeral`).

Zie [Slashcommando's](/nl/tools/slash-commands) voor de commandocatalogus en het gedrag.

## Functiedetails

<AccordionGroup>
  <Accordion title="Antwoordtags en systeemeigen antwoorden">
    Discord ondersteunt antwoordtags in agentuitvoer:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Wordt beheerd door `channels.discord.replyToMode`:

    - `off` (standaard): geen impliciete antwoordthread; expliciete `[[reply_to_*]]`-tags worden nog steeds verwerkt
    - `first`: koppelt de impliciete systeemeigen antwoordverwijzing aan het eerste uitgaande Discord-bericht van de beurt
    - `all`: koppelt deze aan elk uitgaand bericht
    - `batched`: koppelt deze alleen wanneer de inkomende gebeurtenis een door debounce samengevoegde batch van meerdere berichten was — nuttig wanneer u systeemeigen antwoorden vooral wilt gebruiken voor onduidelijke gesprekken met plotselinge berichtenreeksen, niet voor elke beurt met één bericht

    Bericht-ID's worden in context en geschiedenis beschikbaar gesteld, zodat agents specifieke berichten kunnen adresseren.

  </Accordion>

  <Accordion title="Linkvoorbeelden">
    Discord genereert standaard uitgebreide linkinsluitingen voor URL's. OpenClaw onderdrukt deze gegenereerde insluitingen standaard in uitgaande Discord-berichten, zodat door agents verzonden URL's gewone links blijven, tenzij u dit expliciet inschakelt:

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    Stel `channels.discord.accounts.<id>.suppressEmbeds` in om dit voor één account te overschrijven. Verzendingen via het berichtgereedschap van de agent kunnen ook `suppressEmbeds: false` doorgeven voor één bericht. Expliciete Discord-`embeds`-payloads worden niet onderdrukt door de standaardinstelling voor linkvoorbeelden.

  </Accordion>

  <Accordion title="Live streamvoorbeeld">
    OpenClaw kan conceptantwoorden streamen door een tijdelijk bericht te verzenden en dit te bewerken naarmate tekst binnenkomt. `channels.discord.streaming.mode` accepteert `off` | `partial` | `block` | `progress` (standaard wanneer geen sleutel `streaming` of verouderde sleutel `streamMode` is ingesteld). `streamMode` is een verouderde alias; voer `openclaw doctor --fix` uit om opgeslagen configuratie naar de canonieke geneste `streaming`-structuur te herschrijven.

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

    - `off` schakelt bewerkingen van Discord-voorbeelden uit.
    - `partial` bewerkt één voorbeeldbericht naarmate tokens binnenkomen.
    - `block` verzendt blokken ter grootte van een concept; stel grootte en afbreekpunten af met `streaming.preview.chunk` (`minChars`, `maxChars`, `breakPreference`), begrensd door `textChunkLimit`. Wanneer blokstreaming expliciet is ingeschakeld, slaat OpenClaw de voorbeeldstream over om dubbele streaming te voorkomen.
    - `progress` behoudt één bewerkbaar statusconcept en werkt dit bij met gereedschapsvoortgang tot de definitieve aflevering; het gedeelde beginlabel is een doorlopende regel, zodat het net als de rest uit beeld schuift zodra voldoende werk wordt weergegeven.
    - Definitieve antwoorden met media, fouten of expliciete antwoorden annuleren wachtende voorbeeldbewerkingen.
    - `streaming.preview.toolProgress` (standaard `true`) bepaalt of updates van gereedschappen en voortgang het voorbeeldbericht hergebruiken.
    - Regels voor gereedschappen en voortgang worden, indien beschikbaar, compact weergegeven als emoji + titel + details, bijvoorbeeld `🛠️ Bash: run tests` of `🔎 Web Search: for "query"`.
    - Met `streaming.progress.commentary` (standaard `false`) wordt commentaar of inleidende tekst van de assistent opgenomen in het tijdelijke voortgangsconcept. Commentaar wordt vóór weergave opgeschoond, blijft tijdelijk en wijzigt de aflevering van het definitieve antwoord niet.
    - `streaming.progress.maxLineChars` bepaalt het tekenbudget per regel voor het voortgangsvoorbeeld. Proza wordt op woordgrenzen ingekort; details van commando's en paden behouden nuttige achtervoegsels.
    - `streaming.preview.commandText` / `streaming.progress.commandText` bepaalt de details van commando's en uitvoeringen in compacte voortgangsregels: `raw` (standaard) of `status` (alleen het gereedschapslabel).

    Verberg onbewerkte tekst van commando's en uitvoeringen, maar behoud compacte voortgangsregels:

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

    Voorbeeldstreaming ondersteunt alleen tekst; antwoorden met media vallen terug op normale aflevering.

  </Accordion>

  <Accordion title="Geschiedenis, context en threadgedrag">
    Geschiedeniscontext van de server:

    - `channels.discord.historyLimit` standaard `20`
    - terugvaloptie: `messages.groupChat.historyLimit`
    - `0` schakelt dit uit

    Beheer van privéberichtgeschiedenis:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Threadgedrag:

    - Discord-threads worden als kanaalsessies gerouteerd en nemen de configuratie van het bovenliggende kanaal over, tenzij deze wordt overschreven.
    - Threadsessies nemen de `/model`-selectie op sessieniveau van het bovenliggende kanaal over als terugvaloptie voor alleen het model; lokale `/model`-selecties van de thread hebben voorrang en de transcriptgeschiedenis van het bovenliggende kanaal wordt niet gekopieerd, tenzij overerving van transcripten is ingeschakeld.
    - Met `channels.discord.thread.inheritParent` (standaard `false`) worden nieuwe automatische threads gevuld vanuit het bovenliggende transcript. Overschrijving per account: `channels.discord.accounts.<id>.thread.inheritParent`.
    - Reacties via het berichtgereedschap kunnen privéberichtdoelen met `user:<id>` omzetten.
    - `guilds.<guild>.channels.<channel>.requireMention: false` blijft behouden tijdens de terugvalactivering in de antwoordfase.

    Kanaalonderwerpen worden als **niet-vertrouwde** context geïnjecteerd. Toelatingslijsten beperken wie de agent kan activeren, maar vormen geen volledige grens voor redactie van aanvullende context.

  </Accordion>

  <Accordion title="Aan threads gebonden sessies voor subagents">
    Discord kan een thread aan een sessiedoel binden, zodat vervolgberichten in die thread naar dezelfde sessie blijven worden gerouteerd, inclusief subagentsessies.

    Commando's:

    - `/focus <target>` bindt de huidige of nieuwe thread aan een subagent- of sessiedoel
    - `/unfocus` verwijdert de binding van de huidige thread
    - `/agents` toont actieve uitvoeringen en de bindingsstatus
    - `/session idle <duration|off>` bekijkt of wijzigt de automatische opheffing van focus na inactiviteit voor bindingssessies met focus
    - `/session max-age <duration|off>` bekijkt of wijzigt de harde maximale leeftijd voor bindingssessies met focus

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

    - `session.threadBindings.*` stelt globale standaardwaarden in; `channels.discord.threadBindings.*` overschrijft het Discord-gedrag.
    - `spawnSessions` beheert het automatisch maken en binden van threads voor `sessions_spawn({ thread: true })` en ACP-threadstarts. Standaard: `true`.
    - `defaultSpawnContext` beheert de systeemeigen subagentcontext voor aan threads gebonden starts. Standaard: `"fork"`.
    - Verouderde sleutels `spawnSubagentSessions`/`spawnAcpSessions` worden gemigreerd door `openclaw doctor --fix`.
    - Als threadbindingen voor een account zijn uitgeschakeld, zijn `/focus` en gerelateerde threadbindingsbewerkingen niet beschikbaar.

    Zie [Subagents](/nl/tools/subagents), [ACP-agents](/nl/tools/acp-agents) en [Configuratiereferentie](/nl/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Permanente ACP-kanaalbindingen">
    Configureer voor stabiele, "altijd actieve" ACP-werkruimten getypeerde ACP-bindingen op het hoogste niveau die naar Discord-gesprekken verwijzen.

    Configuratiepad: `bindings[]` met `type: "acp"` en `match.channel: "discord"`.

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

    - `/acp spawn codex --bind here` bindt het huidige kanaal of de huidige thread ter plaatse en houdt toekomstige berichten in dezelfde ACP-sessie. Threadberichten nemen de binding van het bovenliggende kanaal over.
    - In een gebonden kanaal of een gebonden thread stellen `/new` en `/reset` dezelfde ACP-sessie ter plaatse opnieuw in. Tijdelijke threadbindingen kunnen de doelbepaling overschrijven zolang ze actief zijn.
    - `spawnSessions` bepaalt het maken en binden van onderliggende threads via `--thread auto|here`.

    Zie [ACP-agents](/nl/tools/acp-agents) voor details over het bindingsgedrag.

  </Accordion>

  <Accordion title="Reactiemeldingen">
    Modus voor reactiemeldingen per server (`guilds.<id>.reactionNotifications`):

    - `off`
    - `own` (standaard)
    - `all`
    - `allowlist` (gebruikt `guilds.<id>.users`)

    Reactiegebeurtenissen worden omgezet in systeemgebeurtenissen en gekoppeld aan de gerouteerde Discord-sessie.

  </Accordion>

  <Accordion title="Bevestigingsreacties">
    `ackReaction` verzendt een bevestigingsemoji terwijl OpenClaw een inkomend bericht verwerkt.

    Volgorde van bepaling:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - terugvaloptie naar de identiteitsemoji van de agent (`agents.list[].identity.emoji`, anders "👀")

    Opmerkingen:

    - Discord accepteert Unicode-emoji's of namen van aangepaste emoji's.
    - Gebruik `""` om de reactie voor een kanaal of account uit te schakelen.

    **Bereik (`messages.ackReactionScope`):**

    Waarden: `"all"` (privéberichten + groepen, inclusief omgevingsgebeurtenissen in ruimten), `"direct"` (alleen privéberichten), `"group-all"` (elk groepsbericht behalve omgevingsgebeurtenissen in ruimten, geen privéberichten), `"group-mentions"` (groepen wanneer de bot wordt vermeld; **geen privéberichten**, standaard), `"off"` / `"none"` (uitgeschakeld).

    <Note>
    Het standaardbereik (`"group-mentions"`) activeert geen bevestigingsreacties in privéberichten of bij omgevingsgebeurtenissen in ruimten. Stel `messages.ackReactionScope` in op `"all"` om een bevestigingsreactie te krijgen voor inkomende privéberichten in Discord en gebeurtenissen in stille ruimten.
    </Note>

  </Accordion>

  <Accordion title="Configuratie schrijven">
    Door kanalen geïnitieerde configuratiewijzigingen zijn standaard ingeschakeld. Dit beïnvloedt `/config set|unset`-stromen wanneer commandofuncties zijn ingeschakeld.

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
    Routeer Discord Gateway-WebSocket-verkeer en REST-opzoekingen tijdens het opstarten (applicatie-ID + bepaling van toelatingslijsten) via een HTTP(S)-proxy met `channels.discord.proxy`.
    Proxygebruik voor Discord Gateway-WebSockets is expliciet; WebSocket-verbindingen nemen geen algemene proxy-omgevingsvariabelen over van het Gateway-proces. REST-opzoekingen tijdens het opstarten gebruiken deze proxy wanneer `channels.discord.proxy` is geconfigureerd.

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
    Schakel PluralKit-resolutie in om via een proxy verzonden berichten aan de identiteit van een systeemlid te koppelen:

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
    - weergavenamen van leden worden alleen op naam/slug vergeleken wanneer `channels.discord.dangerouslyAllowNameMatching: true`
    - opzoekacties bevragen de PluralKit-API met de oorspronkelijke bericht-ID
    - als het opzoeken mislukt, worden proxyberichten behandeld als botberichten en verwijderd, tenzij `allowBots` ze doorlaat

  </Accordion>

  <Accordion title="Aliassen voor uitgaande vermeldingen">
    Gebruik `mentionAliases` wanneer agents deterministische uitgaande vermeldingen voor bekende Discord-gebruikers nodig hebben. Sleutels zijn gebruikersnamen zonder de voorafgaande `@`; waarden zijn Discord-gebruikers-ID's. Onbekende gebruikersnamen, `@everyone`, `@here` en vermeldingen binnen Markdown-codefragmenten blijven ongewijzigd.

```json5
{
  channels: {
    discord: {
      mentionAliases: {
        SupportLead: "123456789012345678",
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
    Aanwezigheidsupdates worden toegepast wanneer u een status- of activiteitsveld instelt, of wanneer u automatische aanwezigheid inschakelt.

    Alleen status:

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    Activiteit (aangepaste status is het standaardactiviteitstype wanneer `activity` is ingesteld):

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

    Streamen:

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

    - 0: Playing
    - 1: Streaming (vereist `activityUrl`; `activityUrl` vereist op zijn beurt `activityType: 1`)
    - 2: Listening
    - 3: Watching
    - 4: Custom (gebruikt de activiteitstekst als statustekst; emoji is optioneel)
    - 5: Competing

    Automatische aanwezigheid (gezondheidssignaal van de runtime):

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

    Automatische aanwezigheid koppelt de beschikbaarheid van de runtime aan de Discord-status: gezond => online, verminderd of onbekend => idle, uitgeput of niet beschikbaar => dnd. Standaardwaarden: `intervalMs` 30000, `minUpdateIntervalMs` 15000 (moet kleiner dan of gelijk aan `intervalMs` zijn). Optionele tekstoverschrijvingen:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (ondersteunt de tijdelijke aanduiding `{reason}`)

  </Accordion>

  <Accordion title="Goedkeuringen in Discord">
    Discord ondersteunt goedkeuringsafhandeling via knoppen in privéberichten en kan goedkeuringsverzoeken optioneel in het oorspronkelijke kanaal plaatsen.

    Configuratiepad:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (optioneel; valt indien mogelijk terug op `commands.ownerAllowFrom`)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, standaard: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord schakelt systeemeigen uitvoeringsgoedkeuringen automatisch in wanneer `enabled` niet is ingesteld of `"auto"` is en ten minste één goedkeurder kan worden bepaald, via `execApprovals.approvers` of `commands.ownerAllowFrom`. Discord leidt uitvoeringsgoedkeurders niet af uit `allowFrom` van een kanaal, de verouderde `dm.allowFrom` of `defaultTo` voor privéberichten. Stel `enabled: false` in om Discord expliciet uit te schakelen als systeemeigen goedkeuringsclient.

    Voor gevoelige groepsopdrachten die uitsluitend voor de eigenaar bestemd zijn, zoals `/diagnostics` en `/export-trajectory`, verstuurt OpenClaw goedkeuringsverzoeken en eindresultaten privé. Eerst wordt een privébericht via Discord geprobeerd wanneer de aanroepende eigenaar een Discord-route voor de eigenaar heeft; anders wordt teruggevallen op de eerste beschikbare eigenaarsroute uit `commands.ownerAllowFrom`, zoals Telegram.

    Wanneer `target` is ingesteld op `channel` of `both`, is het goedkeuringsverzoek zichtbaar in het kanaal. Alleen bepaalde goedkeurders kunnen de knoppen gebruiken; andere gebruikers ontvangen een tijdelijke afwijzing die alleen voor hen zichtbaar is. Goedkeuringsverzoeken bevatten de opdrachttekst, dus schakel levering aan kanalen alleen in voor vertrouwde kanalen. Als de kanaal-ID niet uit de sessiesleutel kan worden afgeleid, valt OpenClaw terug op levering via een privébericht.

    Discord geeft de gedeelde goedkeuringsknoppen weer die ook door andere chatkanalen worden gebruikt; de systeemeigen Discord-adapter voegt voornamelijk routering van privéberichten naar goedkeurders en distributie naar kanalen toe. Wanneer deze knoppen aanwezig zijn, vormen ze de primaire gebruikerservaring voor goedkeuring; OpenClaw mag alleen een handmatige `/approve`-opdracht opnemen wanneer het gereedschapsresultaat aangeeft dat chatgoedkeuringen niet beschikbaar zijn of handmatige goedkeuring de enige mogelijkheid is. Als de systeemeigen goedkeuringsruntime van Discord niet actief is, houdt OpenClaw het lokale deterministische verzoek `/approve <id> <decision>` zichtbaar. Als de runtime actief is maar een systeemeigen kaart niet naar een doel kan worden verzonden, verstuurt OpenClaw in dezelfde chat een terugvalmelding met de exacte `/approve`-opdracht van de openstaande goedkeuring.

    Gateway-authenticatie en het afhandelen van goedkeuringen volgen het gedeelde Gateway-clientcontract (`plugin:`-ID's worden afgehandeld via `plugin.approval.resolve`; andere ID's via `exec.approval.resolve`). Goedkeuringen verlopen standaard na 30 minuten.

    Zie [Uitvoeringsgoedkeuringen](/nl/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Gereedschappen en actiedrempels

Discord-berichtacties omvatten berichten, kanaalbeheer, moderatie, aanwezigheid en metagegevens.

Kernvoorbeelden:

- berichten: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- reacties: `react`, `reactions`, `emojiList`
- moderatie: `timeout`, `kick`, `ban`
- aanwezigheid: `setPresence`

De actie `event-create` accepteert een optionele parameter `image` (URL of lokaal bestandspad) om de omslagafbeelding van de geplande gebeurtenis in te stellen.

Actiedrempels bevinden zich onder `channels.discord.actions.*`.

Standaardgedrag van drempels:

| Actiegroep                                                                                                                                                             | Standaard      |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | ingeschakeld   |
| roles                                                                                                                                                                  | uitgeschakeld  |
| moderation                                                                                                                                                             | uitgeschakeld  |
| presence                                                                                                                                                               | uitgeschakeld  |

## Gebruikersinterface met componenten v2

OpenClaw gebruikt Discord-componenten v2 voor uitvoeringsgoedkeuringen en markeringen tussen contexten. Discord-berichtacties kunnen ook `components` accepteren voor een aangepaste gebruikersinterface (geavanceerd; vereist het samenstellen van een componentpayload via het Discord-gereedschap), terwijl verouderde `embeds` beschikbaar blijven maar niet worden aanbevolen.

- `channels.discord.ui.components.accentColor` stelt de accentkleur in die door Discord-componentcontainers wordt gebruikt (hexadecimaal). Per account: `channels.discord.accounts.<id>.ui.components.accentColor`.
- `channels.discord.agentComponents.ttlMs` bepaalt hoelang callbacks van verzonden Discord-componenten geregistreerd blijven (standaard `1800000`, maximaal `86400000`). Per account: `channels.discord.accounts.<id>.agentComponents.ttlMs`.
- `embeds` worden genegeerd wanneer componenten v2 aanwezig zijn.
- Voorvertoningen van gewone URL's worden standaard onderdrukt. Stel `suppressEmbeds: false` in voor een berichtactie wanneer één uitgaande koppeling moet worden uitgevouwen.

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

Discord heeft twee afzonderlijke spraakmogelijkheden: realtime **spraakkanalen** (doorlopende gesprekken) en **spraakberichtbijlagen** (de indeling met golfvormvoorvertoning). De Gateway ondersteunt beide.

### Spraakkanalen

Controlelijst voor de configuratie:

1. Schakel Message Content Intent in het Discord Developer Portal in.
2. Schakel Server Members Intent in wanneer toelatingslijsten voor rollen/gebruikers worden gebruikt.
3. Nodig de bot uit met de bereiken `bot` en `applications.commands`.
4. Verleen Connect, Speak, Send Messages en Read Message History in het doelspraakkanaal.
5. Schakel systeemeigen opdrachten in (`commands.native` of `channels.discord.commands.native`).
6. Configureer `channels.discord.voice`.

Gebruik `/vc join|leave|status` om sessies te beheren. De opdracht gebruikt de standaardagent van het account en volgt dezelfde regels voor toelatingslijsten en groepsbeleid als andere Discord-opdrachten.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

Om de effectieve machtigingen van de bot te controleren voordat deze deelneemt:

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
        model: "openai/gpt-5.6-sol",
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
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

Opmerkingen:

- Discord-spraak is opt-in voor configuraties met alleen tekst; stel `channels.discord.voice.enabled=true` in (of behoud een bestaand `channels.discord.voice`-blok) om `/vc`-opdrachten, de spraakruntime en de Gateway-intentie `GuildVoiceStates` in te schakelen. Met `channels.discord.intents.voiceStates` kan het abonnement op de intentie expliciet worden overschreven; laat dit oningesteld om de effectieve inschakeling van spraak te volgen.
- `voice.mode` bepaalt het gesprekspad. De standaard is `agent-proxy`: een realtime spraakfrontend verwerkt de timing van beurten, onderbrekingen en het afspelen, delegeert inhoudelijk werk via `openclaw_agent_consult` aan de gerouteerde OpenClaw-agent en behandelt het resultaat als een door die spreker getypte Discord-prompt. `stt-tts` behoudt de oudere batchflow met STT en TTS. Met `bidi` kan het realtime model rechtstreeks converseren, terwijl `openclaw_agent_consult` beschikbaar blijft voor het OpenClaw-brein.
- `voice.agentSession` bepaalt welk OpenClaw-gesprek spraakbeurten ontvangt. Laat dit oningesteld voor de eigen sessie van het spraakkanaal, of stel `{ mode: "target", target: "channel:<text-channel-id>" }` in om het spraakkanaal te laten fungeren als microfoon-/luidsprekeruitbreiding van een bestaande Discord-tekstkanaalsessie, zoals `#maintainers`.
- `voice.model` overschrijft het OpenClaw-agentbrein voor Discord-spraakantwoorden en realtime raadplegingen. Laat dit oningesteld om het model van de gerouteerde agent over te nemen. Dit staat los van `voice.realtime.model`.
- Met `voice.followUsers` kan de bot samen met geselecteerde gebruikers deelnemen aan Discord-spraak, van kanaal wisselen en vertrekken. Zie [Gebruikers volgen in spraak](#follow-users-in-voice).
- `agent-proxy` routeert spraak via `discord-voice`, waardoor de normale autorisatie van de eigenaar en tools voor de spreker en doelsessie behouden blijft, maar de agenttool `tts` wordt verborgen omdat Discord-spraak het afspelen beheert. Standaard geeft `agent-proxy` de raadpleging voor eigenaarsprekers volledige tooltoegang die gelijkwaardig is aan die van de eigenaar (`voice.realtime.toolPolicy: "owner"`) en wordt sterk de voorkeur gegeven aan het raadplegen van de OpenClaw-agent vóór inhoudelijke antwoorden (`voice.realtime.consultPolicy: "always"`). In die standaardmodus `always` spreekt de realtimelaag niet automatisch opvultekst uit vóór het antwoord van de raadpleging; de laag legt spraak vast en transcribeert deze, en spreekt vervolgens het gerouteerde OpenClaw-antwoord uit. Als meerdere afgedwongen raadpleegantwoorden gereedkomen terwijl Discord het eerste antwoord nog afspeelt, worden latere antwoorden met exact uit te spreken tekst in de wachtrij geplaatst totdat het afspelen inactief is, in plaats van spraak midden in een zin te vervangen.
- In de modus `stt-tts` gebruikt STT `tools.media.audio`; `voice.model` heeft geen invloed op transcriptie.
- In realtimemodi configureren `voice.realtime.provider`, `voice.realtime.model` en `voice.realtime.speakerVoice` de realtime audiosessie. Gebruik voor OpenAI Realtime 2.1 met het Codex-brein `voice.realtime.model: "gpt-realtime-2.1"` en `voice.model: "openai/gpt-5.6-sol"`.
- Realtime spraakmodi nemen standaard kleine profielbestanden `IDENTITY.md`, `USER.md` en `SOUL.md` op in de instructies voor de realtime provider, zodat snelle rechtstreekse beurten dezelfde identiteit, gebruikerscontext en persona behouden als de gerouteerde OpenClaw-agent. Stel `voice.realtime.bootstrapContextFiles` in op een subset om dit aan te passen, of op `[]` om het uit te schakelen. Alleen deze profielbestanden worden ondersteund; `AGENTS.md` blijft in de normale agentcontext. De geïnjecteerde profielcontext vervangt `openclaw_agent_consult` niet voor werk in de werkruimte, actuele feiten, het opzoeken van geheugen of door tools ondersteunde acties.
- Stel in de OpenAI-realtimemodus `agent-proxy` `voice.realtime.requireWakeName: true` in om Discord-realtimespraak stil te houden totdat een transcript begint of eindigt met een weknaam. Geconfigureerde weknamen moeten uit één of twee woorden bestaan. Als `voice.realtime.wakeNames` niet is ingesteld, gebruikt OpenClaw de `name` van de gerouteerde agent plus `OpenClaw`, met als terugval de agent-id plus `OpenClaw`. Filteren op weknaam schakelt automatische antwoorden van de realtime provider uit, routeert geaccepteerde beurten via het raadpleegpad van de OpenClaw-agent en geeft een korte gesproken bevestiging wanneer een voorafgaande weknaam in een gedeeltelijke transcriptie wordt herkend voordat het definitieve transcript binnenkomt.
- De OpenAI-realtimeprovider accepteert huidige Realtime 2-gebeurtenisnamen en oudere Codex-compatibele aliassen voor gebeurtenissen voor uitvoeraudio en transcripties, zodat compatibele providersnapshots kunnen afwijken zonder assistentaudio te verliezen.
- `voice.realtime.bargeIn` bepaalt of gebeurtenissen waarbij een Discord-spreker begint te spreken het actieve realtime afspelen onderbreken. Als dit niet is ingesteld, volgt het de instelling van de realtime provider voor onderbreking door invoeraudio.
- `voice.realtime.minBargeInAudioEndMs` bepaalt de minimale afspeelduur van de assistent voordat een realtime onderbreking van OpenAI de audio afkapt. Standaard: `250`. Stel `0` in voor onmiddellijke onderbreking in ruimten met weinig echo, of verhoog de waarde voor luidsprekeropstellingen met veel echo.
- `voice.tts` overschrijft `messages.tts` uitsluitend voor spraakweergave met `stt-tts`; realtimemodi gebruiken in plaats daarvan `voice.realtime.speakerVoice`. Stel voor een OpenAI-stem bij afspelen op Discord `voice.tts.provider: "openai"` in en kies een tekst-naar-spraakstem onder `voice.tts.providers.openai.speakerVoice`. `cedar` is een goede keuze met een mannelijke klank in het huidige OpenAI TTS-model.
- Discord-overschrijvingen van `systemPrompt` per kanaal zijn van toepassing op transcriptbeurten voor dat spraakkanaal.
- Spraaktranscriptbeurten leiden voor opdrachten en kanaalacties die aan de eigenaar zijn voorbehouden de eigenaarstatus af uit Discord `allowFrom` (of `dm.allowFrom`). De zichtbaarheid van agenttools volgt het geconfigureerde toolbeleid voor de gerouteerde sessie.
- Als `voice.autoJoin` meerdere vermeldingen voor dezelfde server bevat, neemt OpenClaw deel aan het laatst geconfigureerde kanaal voor die server.
- `voice.allowedChannels` is een optionele toelatingslijst voor verblijf. Laat dit oningesteld om `/vc join` deelname te laten toestaan aan elk geautoriseerd Discord-spraakkanaal. Wanneer dit is ingesteld, worden `/vc join`, automatisch deelnemen bij het opstarten en verplaatsingen van de spraakstatus van de bot beperkt tot de vermelde `{ guildId, channelId }`-vermeldingen. Stel dit in op een lege array om alle deelnames aan Discord-spraak te weigeren. Als Discord de bot buiten de toelatingslijst verplaatst, verlaat OpenClaw dat kanaal en neemt het opnieuw deel aan het geconfigureerde doel voor automatisch deelnemen wanneer dat beschikbaar is.
- `voice.daveEncryption` en `voice.decryptionFailureTolerance` worden doorgegeven aan de opties voor deelname van `@discordjs/voice`; de bovenliggende standaardwaarden zijn `daveEncryption=true` en `decryptionFailureTolerance=24`.
- OpenClaw gebruikt de meegeleverde codec `libopus-wasm` voor het ontvangen van Discord-spraak en het realtime afspelen van onbewerkte PCM. Deze bevat een vastgezette libopus-WebAssembly-build en vereist geen systeemeigen opus-add-ons.
- `voice.connectTimeoutMs` bepaalt de initiële wachttijd op `Ready` van `@discordjs/voice` voor `/vc join` en pogingen om automatisch deel te nemen. Standaard: `30000`.
- `voice.reconnectGraceMs` bepaalt hoelang OpenClaw wacht tot een verbroken spraaksessie opnieuw verbinding begint te maken voordat deze wordt vernietigd. Standaard: `15000`.
- In de modus `stt-tts` stopt het afspelen van spraak niet alleen omdat een andere gebruiker begint te spreken. Om feedbacklussen te voorkomen negeert OpenClaw nieuwe spraakopname terwijl TTS wordt afgespeeld; spreek na afloop van het afspelen voor de volgende beurt. Realtimemodi sturen het begin van spraak door als onderbrekingssignaal naar de realtime provider.
- In realtimemodi kan echo van luidsprekers naar een open microfoon op een onderbreking lijken en het afspelen onderbreken. Stel voor Discord-ruimten met veel echo `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` in om te voorkomen dat OpenAI automatisch onderbreekt bij invoeraudio. Voeg `voice.realtime.bargeIn: true` toe als gebeurtenissen waarbij een Discord-spreker begint te spreken het actieve afspelen nog steeds moeten onderbreken. De realtimebrug van OpenAI negeert afkappingen van het afspelen die korter zijn dan `voice.realtime.minBargeInAudioEndMs` als waarschijnlijke echo of ruis en registreert deze als overgeslagen, in plaats van het afspelen in Discord te wissen.
- `voice.captureSilenceGraceMs` bepaalt hoelang OpenClaw wacht nadat Discord meldt dat een spreker is gestopt, voordat dat audiosegment voor STT wordt afgerond. Standaard: `2000`; verhoog dit als Discord normale pauzes opsplitst in schokkerige gedeeltelijke transcripties.
- Wanneer ElevenLabs de geselecteerde TTS-provider is, gebruikt het afspelen van Discord-spraak streaming-TTS en begint het vanuit de antwoordstream van de provider. Providers zonder ondersteuning voor streaming vallen terug op het pad met een gesynthetiseerd tijdelijk bestand.
- OpenClaw bewaakt ontsleutelingsfouten bij ontvangst en herstelt automatisch door het spraakkanaal te verlaten en opnieuw deel te nemen na herhaalde fouten binnen een kort tijdsvenster.
- Als ontvangstlogboeken na een update herhaaldelijk `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` tonen, verzamel dan een afhankelijkheidsrapport en logboeken. De meegeleverde versie van `@discordjs/voice` bevat de bovenliggende oplossing voor opvulling uit discord.js-PR #11449, waarmee discord.js-issue #11419 werd gesloten.
- Ontvangstgebeurtenissen met `The operation was aborted` zijn te verwachten wanneer OpenClaw een vastgelegd sprekersegment afrondt; het zijn uitgebreide diagnostische meldingen, geen waarschuwingen.
- Uitgebreide logboeken voor Discord-spraak bevatten voor elk geaccepteerd sprekersegment een begrensd transcriptievoorbeeld van één regel voor STT, zodat bij foutopsporing zowel de kant van de gebruiker als die van het agentantwoord zichtbaar is zonder onbeperkte transcriptietekst te dumpen.
- In de modus `agent-proxy` slaat de afgedwongen terugval naar raadpleging waarschijnlijk onvolledige transcriptfragmenten over, zoals tekst die eindigt op `...` of op een afsluitend verbindingswoord zoals "en", evenals duidelijke afsluitingen zonder uitvoerbare actie zoals "ben zo terug" of "doei". De logboeken tonen `forced agent consult skipped reason=...` wanneer dit een verouderd antwoord in de wachtrij voorkomt.

### Gebruikers volgen in spraak

Gebruik `voice.followUsers` wanneer je wilt dat de Discord-spraakbot bij een of meer bekende Discord-gebruikers blijft, in plaats van bij het opstarten deel te nemen aan een vast kanaal of op `/vc join` te wachten.

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

- `followUsers` accepteert onbewerkte Discord-gebruikers-id's en waarden van de vorm `discord:<id>`. OpenClaw normaliseert beide vormen voordat spraakstatusgebeurtenissen worden vergeleken.
- `followUsersEnabled` is standaard `true` wanneer `followUsers` is geconfigureerd. Stel dit in op `false` om de opgeslagen lijst te behouden maar automatisch volgen in spraak te stoppen.
- Wanneer een gevolgde gebruiker deelneemt aan een toegestaan spraakkanaal, neemt OpenClaw deel aan dat kanaal. Wanneer de gebruiker van kanaal wisselt, gaat OpenClaw mee. Wanneer de actieve gevolgde gebruiker de verbinding verbreekt, vertrekt OpenClaw.
- Als meerdere gevolgde gebruikers zich op dezelfde server bevinden en de actieve gevolgde gebruiker vertrekt, gaat OpenClaw naar het kanaal van een andere bijgehouden gevolgde gebruiker voordat het de server verlaat. Als meerdere gevolgde gebruikers tegelijk van kanaal wisselen, is de laatst waargenomen spraakstatusgebeurtenis bepalend.
- `allowedChannels` blijft van toepassing. Een gevolgde gebruiker in een niet-toegestaan kanaal wordt genegeerd en een door volgen beheerde sessie gaat naar een andere gevolgde gebruiker of vertrekt.
- OpenClaw stemt gemiste spraakstatusgebeurtenissen bij het opstarten en met een begrensd interval af. Bij de afstemming worden geconfigureerde servers steekproefsgewijs gecontroleerd en wordt het aantal REST-opzoekacties per uitvoering begrensd, waardoor het bij zeer grote `followUsers`-lijsten meer dan één interval kan duren voordat alles is afgestemd.
- Als Discord of een beheerder de bot verplaatst terwijl deze een gebruiker volgt, bouwt OpenClaw de spraaksessie opnieuw op en blijft het eigenaarschap van het volgen behouden wanneer de bestemming is toegestaan. Als de bot buiten `allowedChannels` wordt verplaatst, vertrekt OpenClaw en neemt het opnieuw deel aan het geconfigureerde doel wanneer dat bestaat.
- DAVE-herstel bij ontvangst kan hetzelfde kanaal na herhaalde ontsleutelingsfouten verlaten en er opnieuw aan deelnemen. Door volgen beheerde sessies behouden tijdens dat herstelpad het eigenaarschap van het volgen, zodat het kanaal alsnog wordt verlaten wanneer een gevolgde gebruiker later de verbinding verbreekt.

Kies uit de deelnamemodi:

- Gebruik `followUsers` voor persoonlijke opstellingen of beheerdersopstellingen waarbij de bot automatisch in een spraakkanaal moet zijn wanneer jij dat bent.
- Gebruik `autoJoin` voor bots in vaste ruimten die aanwezig moeten zijn, zelfs wanneer geen bijgehouden gebruiker in een spraakkanaal aanwezig is.
- Gebruik `/vc join` voor eenmalige deelnames of ruimten waarin automatische aanwezigheid in een spraakkanaal onverwacht zou zijn.

Codec voor Discord-spraak:

- Logboeken voor spraakontvangst tonen `discord voice: opus decoder: libopus-wasm`.
- Bij realtime afspelen wordt onbewerkte 48kHz-stereo-PCM met hetzelfde meegeleverde pakket `libopus-wasm` naar Opus gecodeerd voordat pakketten aan `@discordjs/voice` worden doorgegeven.
- Bij het afspelen van bestanden en providerstreams wordt met ffmpeg getranscodeerd naar onbewerkte 48kHz-stereo-PCM, waarna `libopus-wasm` wordt gebruikt voor de Opus-pakketstream die naar Discord wordt verzonden.

STT- plus TTS-pijplijn:

- Discord PCM-opname wordt geconverteerd naar een tijdelijk WAV-bestand.
- `tools.media.audio` verwerkt STT, bijvoorbeeld `openai/gpt-4o-mini-transcribe`.
- Het transcript wordt via Discord-invoer en -routering verzonden, terwijl het respons-LLM wordt uitgevoerd met een beleid voor spraakuitvoer dat de agenttool `tts` verbergt en om geretourneerde tekst vraagt, omdat Discord-spraak verantwoordelijk is voor de uiteindelijke TTS-weergave.
- Als `voice.model` is ingesteld, overschrijft dit alleen het respons-LLM voor deze beurt in het spraakkanaal.
- `voice.tts` wordt over `messages.tts` heen samengevoegd; providers die streaming ondersteunen leveren rechtstreeks aan de speler, anders wordt het resulterende audiobestand afgespeeld in het kanaal waaraan is deelgenomen.

Voorbeeld van een standaardsessie voor een agentproxy-spraakkanaal:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.6-sol",
        followUsersEnabled: true,
        followUsers: ["123456789012345678"],
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

Zonder een `voice.agentSession`-blok krijgt elk spraakkanaal een eigen gerouteerde OpenClaw-sessie. Zo communiceert `/vc join channel:234567890123456789` bijvoorbeeld met de sessie voor dat Discord-spraakkanaal. Het realtimemodel is alleen de spraakfrontend; inhoudelijke verzoeken worden doorgegeven aan de geconfigureerde OpenClaw-agent. Als het realtimemodel een definitief transcript produceert zonder de consultatietool aan te roepen, dwingt OpenClaw de consultatie als terugvaloptie af, zodat de standaard zich nog steeds gedraagt alsof er met de agent wordt gesproken.

Voorbeeld van oudere STT plus TTS:

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

Voorbeeld van realtime bidirectionele communicatie:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai/gpt-5.6-sol",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
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
        model: "openai/gpt-5.6-sol",
        agentSession: {
          mode: "target",
          target: "channel:123456789012345678",
        },
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

In de modus `agent-proxy` neemt de bot deel aan het geconfigureerde spraakkanaal, maar OpenClaw-agentbeurten gebruiken de normale gerouteerde sessie en agent van het doelkanaal. De realtime-spraaksessie spreekt het geretourneerde resultaat weer uit in het spraakkanaal. De supervisoragent kan volgens zijn toolbeleid nog steeds normale berichttools gebruiken, waaronder het verzenden van een afzonderlijk Discord-bericht als dat de juiste actie is.

Terwijl een gedelegeerde OpenClaw-uitvoering actief is, worden nieuwe Discord-spraaktranscripten behandeld als live besturing van de uitvoering voordat een nieuwe agentbeurt wordt gestart. Zinnen als ‘status’, ‘annuleer dat’, ‘gebruik de kleinere oplossing’ of ‘controleer ook de tests wanneer je klaar bent’ worden geclassificeerd als status-, annulerings-, bijsturings- of vervolginvoer voor de actieve sessie. De resultaten van status, annulering, geaccepteerde bijsturing en vervolgacties worden teruggesproken in het spraakkanaal, zodat de beller weet of OpenClaw het verzoek heeft verwerkt.

Bruikbare doelvormen:

- `target: "channel:123456789012345678"` routeert via een Discord-tekstkanaalsessie.
- `target: "123456789012345678"` wordt behandeld als een kanaaldoel.
- `target: "dm:123456789012345678"` of `target: "user:123456789012345678"` routeert via die direct-berichtsessie.

Voorbeeld voor OpenAI Realtime met veel echo:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai/gpt-5.6-sol",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
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

Gebruik dit wanneer het model zijn eigen Discord-weergave via een open microfoon hoort, maar u het nog steeds wilt kunnen onderbreken door te spreken. OpenClaw voorkomt dat OpenAI automatisch onderbreekt bij onbewerkte invoeraudio, terwijl `bargeIn: true` ervoor zorgt dat gebeurtenissen waarbij een Discord-spreker begint en audio van een reeds actieve spreker actieve realtime-antwoorden kunnen annuleren voordat de volgende opgenomen beurt OpenAI bereikt. Zeer vroege onderbrekingssignalen met een `audioEndMs` onder `minBargeInAudioEndMs` worden beschouwd als waarschijnlijke echo of ruis en genegeerd, zodat het model niet bij het eerste weergaveframe wordt afgekapt.

Verwachte spraaklogboeken:

- Bij deelname: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- Bij het starten van realtime: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- Bij sprekeraudio: `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...` en `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- Bij overgeslagen verouderde spraak: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` of `reason=non-actionable-closing ...`
- Bij voltooiing van een realtime-antwoord: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- Bij stoppen of opnieuw instellen van de weergave: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- Bij realtime-consultatie: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- Bij het antwoord van de agent: `discord voice: agent turn answer ...`
- Bij exact uitgesproken tekst in de wachtrij: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`, gevolgd door `discord voice: realtime exact speech dequeued reason=player-idle ...`
- Bij detectie van een onderbreking: `discord voice: realtime barge-in detected source=speaker-start ...` of `discord voice: realtime barge-in detected source=active-speaker-audio ...`, gevolgd door `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- Bij realtime-onderbreking: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`, gevolgd door `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` of `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- Bij genegeerde echo of ruis: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- Bij uitgeschakelde onderbreking: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- Bij inactieve weergave: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

Lees de realtime-spraaklogboeken als een tijdlijn om afgekapt geluid te onderzoeken:

1. `realtime audio playback started` betekent dat Discord is begonnen met het afspelen van assistentaudio. Vanaf dit punt begint de bridge assistentuitvoerfragmenten, Discord PCM-bytes, realtimebytes van de provider en de duur van gesynthetiseerde audio te tellen.
2. `realtime speaker turn opened` markeert dat een Discord-spreker actief wordt. Als de weergave al actief is en `bargeIn` is ingeschakeld, kan dit worden gevolgd door `barge-in detected source=speaker-start`.
3. `realtime input audio started` markeert het eerste daadwerkelijke audioframe dat voor die spreekbeurt is ontvangen. `outputActive=true` of een niet-nulwaarde voor `outputAudioMs` betekent hier dat de microfoon invoer verzendt terwijl de assistentweergave nog actief is.
4. `barge-in detected source=active-speaker-audio` betekent dat OpenClaw live sprekeraudio heeft gedetecteerd terwijl de assistentweergave actief was. Dit is nuttig om een echte onderbreking te onderscheiden van een Discord-gebeurtenis waarbij een spreker begint zonder bruikbare audio.
5. `barge-in requested reason=...` betekent dat OpenClaw de realtimeprovider heeft gevraagd het actieve antwoord te annuleren of af te kappen. Dit bevat `outputAudioMs`, `outputActive` en `playbackChunks`, zodat u kunt zien hoeveel assistentaudio daadwerkelijk was afgespeeld voordat de onderbreking plaatsvond.
6. `realtime audio playback stopped reason=...` is het lokale resetpunt voor Discord-weergave. De reden geeft aan wie de weergave heeft gestopt: `barge-in`, `player-idle`, `provider-clear-audio`, `forced-agent-consult`, `stream-close` of `session-close`.
7. `realtime speaker turn closed` vat de opgenomen invoerbeurt samen. `chunks=0` of `hasAudio=false` betekent dat de spreekbeurt is geopend, maar dat geen bruikbare audio de realtime-bridge heeft bereikt. `interruptedPlayback=true` betekent dat die invoerbeurt overlapte met assistentuitvoer en de onderbrekingslogica activeerde.

Bruikbare velden:

- `outputAudioMs`: duur van de assistentaudio die vóór de logregel door de realtimeprovider is gegenereerd.
- `audioMs`: duur van de assistentaudio die OpenClaw heeft geteld voordat de weergave stopte.
- `elapsedMs`: verstreken kloktijd tussen het openen en sluiten van de weergavestream of spreekbeurt.
- `discordBytes`: 48kHz-stereo-PCM-bytes die naar Discord-spraak zijn verzonden of ervan zijn ontvangen.
- `realtimeBytes`: PCM-bytes in providerindeling die naar de realtimeprovider zijn verzonden of ervan zijn ontvangen.
- `playbackChunks`: fragmenten van assistentaudio die voor het actieve antwoord naar Discord zijn doorgestuurd.
- `sinceLastAudioMs`: tijd tussen het laatst opgenomen audioframe van de spreker en het sluiten van de spreekbeurt.

Veelvoorkomende patronen:

- Onmiddellijk afkappen met `source=active-speaker-audio`, een kleine `outputAudioMs` en dezelfde gebruiker in de buurt wijst meestal op luidsprekerecho die de microfoon binnenkomt. Verhoog `voice.realtime.minBargeInAudioEndMs`, verlaag het luidsprekervolume, gebruik een hoofdtelefoon of stel `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` in.
- `source=speaker-start` gevolgd door `speaker turn closed ... hasAudio=false` betekent dat Discord het begin van een spreker heeft gemeld, maar dat geen audio OpenClaw heeft bereikt. Dit kan een tijdelijke Discord-spraakgebeurtenis, gedrag van de ruispoort of een client zijn die de microfoon kort activeert.
- `audio playback stopped reason=stream-close` zonder een onderbreking of `provider-clear-audio` in de buurt betekent dat de lokale Discord-weergavestream onverwacht is beëindigd. Controleer de voorafgaande logboeken van de provider en Discord-speler.
- `capture ignored during playback (barge-in disabled)` betekent dat OpenClaw invoer opzettelijk heeft genegeerd terwijl assistentaudio actief was. Schakel `voice.realtime.bargeIn` in als u wilt dat spraak de weergave onderbreekt.
- `barge-in ignored ... outputActive=false` betekent dat Discord of de VAD van de provider spraak heeft gemeld, maar dat OpenClaw geen actieve weergave had om te onderbreken. Dit hoort geen audio af te kappen.

Referenties worden per component opgezocht: authenticatie van de LLM-route voor `voice.model`, STT-authenticatie voor `tools.media.audio`, TTS-authenticatie voor `messages.tts`/`voice.tts` en authenticatie van de realtimeprovider voor `voice.realtime.providers` of de normale authenticatieconfiguratie van de provider.

### Spraakberichten

Discord-spraakberichten tonen een golfvormvoorbeeld en vereisen OGG/Opus-audio. OpenClaw genereert de golfvorm automatisch, maar heeft `ffmpeg` en `ffprobe` op de Gateway-host nodig om de audio te inspecteren en converteren.

- Geef een **lokaal bestandspad** op (URL's worden geweigerd).
- Laat tekstinhoud weg (Discord weigert tekst en een spraakbericht in dezelfde payload).
- Elke audio-indeling wordt geaccepteerd; OpenClaw converteert deze zo nodig naar OGG/Opus.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Problemen oplossen

<AccordionGroup>
  <Accordion title="Niet-toegestane intents gebruikt of de bot ziet geen serverberichten">

    - schakel Message Content Intent in
    - schakel Server Members Intent in wanneer je afhankelijk bent van het omzetten van gebruikers/leden
    - start de Gateway opnieuw nadat je intents hebt gewijzigd

  </Accordion>

  <Accordion title="Guild-berichten worden onverwacht geblokkeerd">

    - controleer `groupPolicy`
    - controleer de guild-toelatingslijst onder `channels.discord.guilds`
    - als er een `channels`-toewijzing voor een guild bestaat, zijn alleen de vermelde kanalen toegestaan
    - controleer het gedrag van `requireMention` en de vermeldingspatronen

    Nuttige controles:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Vermelding niet vereist, maar toch geblokkeerd">
    Veelvoorkomende oorzaken:

    - `groupPolicy="allowlist"` zonder overeenkomende toelatingslijst voor de guild of het kanaal
    - `requireMention` is op de verkeerde plaats geconfigureerd (moet onder `channels.discord.guilds` of een kanaalvermelding staan)
    - afzender wordt geblokkeerd door de `users`-toelatingslijst van de guild of het kanaal

  </Accordion>

  <Accordion title="Langdurige Discord-beurten of dubbele antwoorden">

    Typische logmeldingen:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Instellingen voor de Discord Gateway-wachtrij:

    - één account: `channels.discord.eventQueue.listenerTimeout`
    - meerdere accounts: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - dit regelt alleen het werk van de Discord Gateway-listener, niet de levensduur van een agentbeurt

    Discord past geen kanaaleigen time-out toe op agentbeurten in de wachtrij. Berichtlisteners dragen het werk onmiddellijk over en Discord-uitvoeringen in de wachtrij behouden de volgorde per sessie totdat de levenscyclus van de sessie, tool of runtime is voltooid of het werk afbreekt.

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

  <Accordion title="Waarschuwingen over time-outs bij het opzoeken van Gateway-metadata">
    OpenClaw haalt Discord-metadata van `/gateway/bot` op voordat verbinding wordt gemaakt. Bij tijdelijke fouten wordt teruggevallen op de standaard-Gateway-URL van Discord en worden logmeldingen in frequentie beperkt.

    Instellingen voor de metadata-time-out:

    - één account: `channels.discord.gatewayInfoTimeoutMs`
    - meerdere accounts: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - terugval op omgevingsvariabele wanneer de configuratie niet is ingesteld: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - standaard: `30000` (30 seconden), maximum: `120000`

  </Accordion>

  <Accordion title="Herstarts door time-out van Gateway READY">
    OpenClaw wacht tijdens het opstarten en na runtime-herverbindingen op de Gateway-gebeurtenis `READY` van Discord. Configuraties met meerdere accounts en gespreid opstarten kunnen een langere READY-periode bij het opstarten nodig hebben dan de standaardwaarde.

    Instellingen voor de READY-time-out:

    - opstarten met één account: `channels.discord.gatewayReadyTimeoutMs`
    - opstarten met meerdere accounts: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - terugval op omgevingsvariabele bij het opstarten wanneer de configuratie niet is ingesteld: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - standaard bij opstarten: `15000` (15 seconden), maximum: `120000`
    - runtime met één account: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - runtime met meerdere accounts: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - terugval op omgevingsvariabele tijdens runtime wanneer de configuratie niet is ingesteld: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - standaard tijdens runtime: `30000` (30 seconden), maximum: `120000`

  </Accordion>

  <Accordion title="Afwijkingen bij de permissiecontrole">
    Permissiecontroles van `channels status --probe` werken alleen voor numerieke kanaal-ID's.

    Als je slug-sleutels gebruikt, kan de runtimekoppeling nog steeds werken, maar kan de controle de permissies niet volledig verifiëren.

  </Accordion>

  <Accordion title="Problemen met privéberichten en koppeling">

    - privéberichten uitgeschakeld: `channels.discord.dm.enabled=false`
    - privéberichtenbeleid uitgeschakeld: `channels.discord.dmPolicy="disabled"` (verouderd: `channels.discord.dm.policy`)
    - wacht op goedkeuring van de koppeling in de modus `pairing`

  </Accordion>

  <Accordion title="Lussen tussen bots">
    Berichten die door bots zijn geschreven, worden standaard genegeerd.

    Als je `channels.discord.allowBots=true` instelt, gebruik dan strikte regels voor vermeldingen en toelatingslijsten om lusgedrag te voorkomen.
    Geef de voorkeur aan `channels.discord.allowBots="mentions"` om alleen botberichten te accepteren die de bot vermelden.

    OpenClaw wordt ook geleverd met gedeelde [bescherming tegen botlussen](/nl/channels/bot-loop-protection). Wanneer `allowBots` toestaat dat door bots geschreven berichten de routering bereiken, zet Discord de binnenkomende gebeurtenis om in feiten over het `(account, kanaal, botpaar)` en onderdrukt de algemene paarbeveiliging het paar nadat het geconfigureerde gebeurtenissenbudget is overschreden. De beveiliging voorkomt onbeheersbare lussen tussen twee bots die voorheen door de frequentielimieten van Discord moesten worden gestopt; dit heeft geen invloed op implementaties met één bot of eenmalige botantwoorden die binnen het budget blijven.

    Standaardinstellingen (actief wanneer `allowBots` is ingesteld):

    - `maxEventsPerWindow: 20` -- het botpaar kan binnen het verschuivende venster 20 berichten uitwisselen
    - `windowSeconds: 60` -- lengte van het verschuivende venster
    - `cooldownSeconds: 60` -- zodra het budget wordt overschreden, wordt elk volgend bericht tussen de bots in beide richtingen gedurende één minuut genegeerd

    Configureer de gedeelde standaardwaarde eenmaal onder `channels.defaults.botLoopProtection` en overschrijf deze vervolgens voor Discord wanneer een legitieme workflow meer ruimte nodig heeft. De prioriteitsvolgorde is:

    - `channels.discord.accounts.<account>.botLoopProtection`
    - `channels.discord.botLoopProtection`
    - `channels.defaults.botLoopProtection`
    - ingebouwde standaardwaarden

    Discord gebruikt de algemene sleutels `maxEventsPerWindow`, `windowSeconds` en `cooldownSeconds`.

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
      // Optionele Discord-brede overschrijving. Accountblokken overschrijven afzonderlijke
      // velden en nemen weggelaten velden hiervandaan over.
      botLoopProtection: {
        maxEventsPerWindow: 4,
      },
      accounts: {
        alpha: {
          // Alpha luistert alleen naar andere bots wanneer die Alpha vermelden.
          allowBots: "mentions",
        },
        bravo: {
          // Bravo luistert naar alle door bots geschreven Discord-berichten.
          allowBots: true,
          mentionAliases: {
            // Hiermee kan Bravo een Discord-vermelding van Alpha schrijven met het geconfigureerde gebruikers-ID.
            Alpha: "ALPHA_DISCORD_USER_ID",
          },
          botLoopProtection: {
            // Sta maximaal vijf berichten per minuut toe voordat het paar wordt onderdrukt.
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

  <Accordion title="Spraak-naar-tekst valt weg met DecryptionFailed(...)">

    - houd OpenClaw actueel (`openclaw update`), zodat de herstellogica voor Discord-spraakontvangst aanwezig is
    - bevestig dat `channels.discord.voice.daveEncryption=true` is ingesteld (standaard)
    - begin met `channels.discord.voice.decryptionFailureTolerance=24` (standaardwaarde van upstream) en pas dit alleen aan als dat nodig is
    - controleer de logs op:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - als de fouten na automatisch opnieuw deelnemen blijven optreden, verzamel dan logs en vergelijk deze met de upstreamgeschiedenis van DAVE-ontvangst in [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) en [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Configuratiereferentie

Primaire referentie: [Configuratiereferentie - Discord](/nl/gateway/config-channels#discord).

<Accordion title="Belangrijkste Discord-velden">

- opstarten/authenticatie: `enabled`, `token`, `applicationId`, `accounts.*`, `allowBots`
- beleid: `groupPolicy`, `dmPolicy`, `allowFrom`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- opdrachten: `commands.native`, `commands.useAccessGroups` (globaal), `configWrites`, `slashCommand.ephemeral`
- gebeurtenissenwachtrij: `eventQueue.listenerTimeout` (listenerbudget, standaard `120000`), `eventQueue.maxQueueSize` (standaard `10000`), `eventQueue.maxConcurrency` (standaard `50`)
- Gateway: `proxy`, `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- antwoorden/geschiedenis: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- aflevering: `textChunkLimit` (standaard `2000`), `maxLinesPerMessage` (standaard `17`)
- streaming: `streaming.mode`, `streaming.chunkMode`, `streaming.preview.*`, `streaming.progress.*`, `streaming.block.*` (verouderde platte sleutels `streamMode`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce` en `chunkMode` worden door `openclaw doctor --fix` naar `streaming.*` gemigreerd)
- media/opnieuw proberen: `mediaMaxMb` (beperkt uitgaande Discord-uploads, standaard `100`), `retry`
- acties: `actions.*`
- aanwezigheid: `activity`, `status`, `activityType`, `activityUrl`, `autoPresence.*`
- gebruikersinterface: `ui.components.accentColor`
- functies: `threadBindings`, `bindings[]` op het hoogste niveau (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents.enabled`, `agentComponents.ttlMs`, `heartbeat`, `responsePrefix`

</Accordion>

## Veiligheid en beheer

- Behandel bottokens als geheimen (`DISCORD_BOT_TOKEN` heeft de voorkeur in beheerde omgevingen).
- Verleen Discord-permissies volgens het principe van minimale bevoegdheden.
- Als de implementatie of status van opdrachten verouderd is, start je de Gateway opnieuw en controleer je deze opnieuw met `openclaw channels status --probe`.

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Koppeling" icon="link" href="/nl/channels/pairing">
    Koppel een Discord-gebruiker aan de Gateway.
  </Card>
  <Card title="Groepen" icon="users" href="/nl/channels/groups">
    Gedrag van groepschats en toelatingslijsten.
  </Card>
  <Card title="Kanaalroutering" icon="route" href="/nl/channels/channel-routing">
    Routeer binnenkomende berichten naar agents.
  </Card>
  <Card title="Beveiliging" icon="shield" href="/nl/gateway/security">
    Dreigingsmodel en versterking.
  </Card>
  <Card title="Routering met meerdere agents" icon="sitemap" href="/nl/concepts/multi-agent">
    Wijs guilds en kanalen toe aan agents.
  </Card>
  <Card title="Slash-opdrachten" icon="terminal" href="/nl/tools/slash-commands">
    Gedrag van systeemeigen opdrachten.
  </Card>
</CardGroup>
