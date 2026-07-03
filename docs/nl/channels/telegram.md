---
read_when:
    - Werken aan Telegram-functies of webhooks
summary: Ondersteuningsstatus, mogelijkheden en configuratie van de Telegram-bot
title: Telegram
x-i18n:
    generated_at: "2026-07-03T13:37:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 202d6eaaf9348203855659d30616368995bce9269082e60dfed67c8d444abf18
    source_path: channels/telegram.md
    workflow: 16
---

Productieklaar voor bot-DM's en groepen via grammY. Long polling is de standaardmodus; webhookmodus is optioneel.

<CardGroup cols={3}>
  <Card title="Koppelen" icon="link" href="/nl/channels/pairing">
    Het standaard-DM-beleid voor Telegram is koppelen.
  </Card>
  <Card title="Kanaalprobleemoplossing" icon="wrench" href="/nl/channels/troubleshooting">
    Kanaaloverstijgende diagnostiek en herstelplaybooks.
  </Card>
  <Card title="Gateway-configuratie" icon="settings" href="/nl/gateway/configuration">
    Volledige kanaalconfiguratiepatronen en voorbeelden.
  </Card>
</CardGroup>

## Snelle installatie

<Steps>
  <Step title="Maak het bottoken aan in BotFather">
    Open Telegram en chat met **@BotFather** (controleer of de handle precies `@BotFather` is).

    Voer `/newbot` uit, volg de prompts en sla het token op.

  </Step>

  <Step title="Configureer token en DM-beleid">

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "123:abc",
      dmPolicy: "pairing",
      groups: { "*": { requireMention: true } },
    },
  },
}
```

    Env-fallback: `TELEGRAM_BOT_TOKEN=...` (alleen standaardaccount).
    Telegram gebruikt **niet** `openclaw channels login telegram`; configureer het token in config/env en start daarna de gateway.

  </Step>

  <Step title="Start gateway en keur eerste DM goed">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Koppelcodes verlopen na 1 uur.

  </Step>

  <Step title="Voeg de bot toe aan een groep">
    Voeg de bot toe aan je groep en haal daarna beide ID's op die groepstoegang nodig heeft:

    - je Telegram-gebruikers-ID, gebruikt in `allowFrom` / `groupAllowFrom`
    - de Telegram-groepschat-ID, gebruikt als sleutel onder `channels.telegram.groups`

    Haal bij de eerste installatie de groepschat-ID op uit `openclaw logs --follow`, een forwarded-ID-bot of Bot API `getUpdates`. Nadat de groep is toegestaan, kan `/whoami@<bot_username>` de gebruikers- en groeps-ID's bevestigen.

    Negatieve Telegram-supergroep-ID's die beginnen met `-100` zijn groepschat-ID's. Zet ze onder `channels.telegram.groups`, niet onder `groupAllowFrom`.

  </Step>
</Steps>

<Note>
De volgorde voor tokenresolutie is accountbewust. In de praktijk winnen configuratiewaarden van de env-fallback, en `TELEGRAM_BOT_TOKEN` geldt alleen voor het standaardaccount.
Na een geslaagde start cachet OpenClaw de botidentiteit maximaal 24 uur in de state-map, zodat herstarts een extra Telegram-`getMe`-aanroep kunnen vermijden; het wijzigen of verwijderen van het token wist die cache.
</Note>

## Telegram-instellingen

<AccordionGroup>
  <Accordion title="Privacymodus en zichtbaarheid in groepen">
    Telegram-bots gebruiken standaard **Privacy Mode**, waardoor wordt beperkt welke groepsberichten ze ontvangen.

    Als de bot alle groepsberichten moet zien, doe dan een van beide:

    - schakel privacymodus uit via `/setprivacy`, of
    - maak de bot groepsbeheerder.

    Verwijder de bot en voeg hem opnieuw toe in elke groep wanneer je privacymodus omschakelt, zodat Telegram de wijziging toepast.

  </Accordion>

  <Accordion title="Groepsrechten">
    Beheerdersstatus wordt geregeld in de Telegram-groepsinstellingen.

    Beheerdersbots ontvangen alle groepsberichten, wat handig is voor altijd-actief groepsgedrag.

  </Accordion>

  <Accordion title="Handige BotFather-schakelaars">

    - `/setjoingroups` om groepstoevoegingen toe te staan/te weigeren
    - `/setprivacy` voor zichtbaarheidsgedrag in groepen

  </Accordion>
</AccordionGroup>

## Toegangscontrole en activering

### Botidentiteit in groepen

In Telegram-groepen en forumtopics wordt een expliciete vermelding van de geconfigureerde bothandle (bijvoorbeeld `@my_bot`) behandeld als gericht aan de geselecteerde OpenClaw-agent, ook wanneer de agentpersonanaam verschilt van de Telegram-gebruikersnaam. Het stiltebeleid voor groepen blijft gelden voor ongerelateerd groepsverkeer, maar de bothandle zelf wordt niet gezien als "iemand anders."

<Tabs>
  <Tab title="DM-beleid">
    `channels.telegram.dmPolicy` regelt toegang via directe berichten:

    - `pairing` (standaard)
    - `allowlist` (vereist minstens één afzender-ID in `allowFrom`)
    - `open` (vereist dat `allowFrom` `"*"` bevat)
    - `disabled`

    `dmPolicy: "open"` met `allowFrom: ["*"]` laat elk Telegram-account dat de botgebruikersnaam vindt of raadt opdrachten aan de bot geven. Gebruik dit alleen voor bewust openbare bots met strikt beperkte tools; bots met één eigenaar moeten `allowlist` gebruiken met numerieke gebruikers-ID's.

    `channels.telegram.allowFrom` accepteert numerieke Telegram-gebruikers-ID's. `telegram:`- / `tg:`-prefixen worden geaccepteerd en genormaliseerd.
    In configuraties met meerdere accounts wordt een beperkende top-level `channels.telegram.allowFrom` behandeld als een veiligheidsgrens: accountniveau-items `allowFrom: ["*"]` maken dat account niet openbaar, tenzij de effectieve account-allowlist na samenvoegen nog steeds een expliciete wildcard bevat.
    `dmPolicy: "allowlist"` met lege `allowFrom` blokkeert alle DM's en wordt afgewezen door configuratievalidatie.
    De installatie vraagt alleen om numerieke gebruikers-ID's.
    Als je hebt geüpgraded en je configuratie `@username`-allowlist-items bevat, voer dan `openclaw doctor --fix` uit om ze op te lossen (best effort; vereist een Telegram-bottoken).
    Als je eerder vertrouwde op allowlist-bestanden uit de koppelopslag, kan `openclaw doctor --fix` items herstellen naar `channels.telegram.allowFrom` in allowlist-flows (bijvoorbeeld wanneer `dmPolicy: "allowlist"` nog geen expliciete ID's heeft).

    Voor bots met één eigenaar geef je de voorkeur aan `dmPolicy: "allowlist"` met expliciete numerieke `allowFrom`-ID's om het toegangsbeleid duurzaam in de configuratie te houden (in plaats van afhankelijk te zijn van eerdere koppelgoedkeuringen).

    Veelvoorkomende verwarring: goedkeuring van DM-koppeling betekent niet "deze afzender is overal geautoriseerd".
    Koppeling verleent DM-toegang. Als er nog geen opdrachteigenaar bestaat, stelt de eerste goedgekeurde koppeling ook `commands.ownerAllowFrom` in, zodat alleen-eigenaar-opdrachten en exec-goedkeuringen een expliciet operatoraccount hebben.
    Autorisatie van afzenders in groepen komt nog steeds uit expliciete configuratie-allowlists.
    Als je wilt "ik ben één keer geautoriseerd en zowel DM's als groepsopdrachten werken", zet je je numerieke Telegram-gebruikers-ID in `channels.telegram.allowFrom`; zorg er voor alleen-eigenaar-opdrachten voor dat `commands.ownerAllowFrom` `telegram:<your user id>` bevat.

    ### Je Telegram-gebruikers-ID vinden

    Veiliger (geen externe bot):

    1. Stuur je bot een DM.
    2. Voer `openclaw logs --follow` uit.
    3. Lees `from.id`.

    Officiële Bot API-methode:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Externe methode (minder privé): `@userinfobot` of `@getidsbot`.

  </Tab>

  <Tab title="Groepsbeleid en allowlists">
    Twee controles zijn samen van toepassing:

    1. **Welke groepen zijn toegestaan** (`channels.telegram.groups`)
       - geen `groups`-configuratie:
         - met `groupPolicy: "open"`: elke groep kan groeps-ID-controles doorstaan
         - met `groupPolicy: "allowlist"` (standaard): groepen worden geblokkeerd totdat je `groups`-items toevoegt (of `"*"`)
       - `groups` geconfigureerd: werkt als allowlist (expliciete ID's of `"*"`)

    2. **Welke afzenders zijn toegestaan in groepen** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (standaard)
       - `disabled`

    `groupAllowFrom` wordt gebruikt voor filtering van groepsafzenders. Als dit niet is ingesteld, valt Telegram terug op `allowFrom`.
    `groupAllowFrom`-items moeten numerieke Telegram-gebruikers-ID's zijn (`telegram:`- / `tg:`-prefixen worden genormaliseerd).
    Zet geen Telegram-groeps- of supergroepchat-ID's in `groupAllowFrom`. Negatieve chat-ID's horen onder `channels.telegram.groups`.
    Niet-numerieke items worden genegeerd voor afzenderautorisatie.
    Veiligheidsgrens (`2026.2.25+`): afzenderauthenticatie in groepen erft **geen** DM-koppelopslaggoedkeuringen.
    Koppelen blijft alleen voor DM's. Stel voor groepen `groupAllowFrom` of per-groep/per-topic `allowFrom` in.
    Als `groupAllowFrom` niet is ingesteld, valt Telegram terug op configuratie `allowFrom`, niet op de koppelopslag.
    Praktisch patroon voor bots met één eigenaar: stel je gebruikers-ID in `channels.telegram.allowFrom` in, laat `groupAllowFrom` leeg en sta de doelgroepen toe onder `channels.telegram.groups`.
    Runtime-opmerking: als `channels.telegram` volledig ontbreekt, gebruikt runtime standaard fail-closed `groupPolicy="allowlist"`, tenzij `channels.defaults.groupPolicy` expliciet is ingesteld.

    Groepsinstallatie voor alleen eigenaar:

```json5
{
  channels: {
    telegram: {
      enabled: true,
      dmPolicy: "pairing",
      allowFrom: ["<YOUR_TELEGRAM_USER_ID>"],
      groupPolicy: "allowlist",
      groups: {
        "<GROUP_CHAT_ID>": {
          requireMention: true,
        },
      },
    },
  },
}
```

    Test dit vanuit de groep met `@<bot_username> ping`. Gewone groepsberichten triggeren de bot niet zolang `requireMention: true`.

    Voorbeeld: sta elk lid in één specifieke groep toe:

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          groupPolicy: "open",
          requireMention: false,
        },
      },
    },
  },
}
```

    Voorbeeld: sta alleen specifieke gebruikers binnen één specifieke groep toe:

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          requireMention: true,
          allowFrom: ["8734062810", "745123456"],
        },
      },
    },
  },
}
```

    <Warning>
      Veelgemaakte fout: `groupAllowFrom` is geen Telegram-groep-allowlist.

      - Zet negatieve Telegram-groeps- of supergroepchat-ID's zoals `-1001234567890` onder `channels.telegram.groups`.
      - Zet Telegram-gebruikers-ID's zoals `8734062810` onder `groupAllowFrom` wanneer je wilt beperken welke mensen binnen een toegestane groep de bot kunnen triggeren.
      - Gebruik `groupAllowFrom: ["*"]` alleen wanneer je wilt dat elk lid van een toegestane groep met de bot kan praten.

    </Warning>

  </Tab>

  <Tab title="Vermeldingsgedrag">
    Groepsantwoorden vereisen standaard een vermelding.

    Vermelding kan komen van:

    - native `@botusername`-vermelding, of
    - vermeldingspatronen in:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Opdrachten op sessieniveau:

    - `/activation always`
    - `/activation mention`

    Deze werken alleen de sessiestatus bij. Gebruik configuratie voor persistentie.

    Voorbeeld van persistente configuratie:

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { requireMention: false },
      },
    },
  },
}
```

    Groepsgeschiedeniscontext staat altijd aan voor groepen en wordt begrensd door
    `historyLimit`. Stel `channels.telegram.historyLimit: 0` in om het
    Telegram-groepsgeschiedenisvenster uit te schakelen. De uitgefaseerde sleutel
    `includeGroupHistoryContext` wordt verwijderd door `openclaw doctor --fix`.

    De groepschat-ID ophalen:

    - stuur een groepsbericht door naar `@userinfobot` / `@getidsbot`
    - of lees `chat.id` uit `openclaw logs --follow`
    - of inspecteer Bot API `getUpdates`
    - nadat de groep is toegestaan, voer je `/whoami@<bot_username>` uit als native opdrachten zijn ingeschakeld

  </Tab>
</Tabs>

## Runtimegedrag

- Telegram is eigendom van het Gateway-proces.
- Routering is deterministisch: inkomende Telegram-antwoorden gaan terug naar Telegram (het model kiest geen kanalen).
- Inkomende berichten worden genormaliseerd naar de gedeelde kanaalenvelop met antwoordmetadata, mediaplaceholders en persistente antwoordketencontext voor Telegram-antwoorden die de Gateway heeft waargenomen.
- Groepssessies worden geïsoleerd op groeps-ID. Forumonderwerpen voegen `:topic:<threadId>` toe om onderwerpen geïsoleerd te houden.
- DM-berichten kunnen `message_thread_id` bevatten; OpenClaw behoudt dit voor antwoorden. DM-onderwerpsessies splitsen alleen wanneer Telegram `getMe` voor de bot `has_topics_enabled: true` meldt; anders blijven DM's op de platte sessie.
- Long polling gebruikt grammY runner met sequencing per chat/per thread. De totale gelijktijdigheid van de runner-sink gebruikt `agents.defaults.maxConcurrent`.
- Opstarten met meerdere accounts begrenst gelijktijdige Telegram-`getMe`-probes, zodat grote botvloten niet alle accountprobes tegelijk uitwaaieren.
- Long polling wordt binnen elk Gateway-proces beschermd, zodat slechts één actieve poller tegelijk een bottoken kan gebruiken. Als je nog steeds `getUpdates` 409-conflicten ziet, gebruikt waarschijnlijk een andere OpenClaw-Gateway, script of externe poller dezelfde token.
- Herstarts door de long-polling-watchdog worden standaard geactiveerd na 120 seconden zonder voltooide `getUpdates`-liveness. Verhoog `channels.telegram.pollingStallThresholdMs` alleen als je deployment nog steeds valse polling-stall-herstarts ziet tijdens langlopende werkzaamheden. De waarde is in milliseconden en is toegestaan van `30000` tot `600000`; overrides per account worden ondersteund.
- Telegram Bot API heeft geen ondersteuning voor leesbewijzen (`sendReadReceipts` is niet van toepassing).

<Note>
  `channels.telegram.dm.threadReplies` en `channels.telegram.direct.<chatId>.threadReplies` zijn verwijderd. Voer `openclaw doctor --fix` uit na het upgraden als je configuratie die sleutels nog heeft. DM-onderwerproutering volgt nu de botcapaciteit van Telegram `getMe.has_topics_enabled`, die wordt beheerd door de threaded modus van BotFather: bots met onderwerpen ingeschakeld gebruiken thread-gescopete DM-sessies wanneer Telegram `message_thread_id` verzendt; andere DM's blijven op de platte sessie.
</Note>

## Functiereferentie

<AccordionGroup>
  <Accordion title="Live stream preview (message edits)">
    OpenClaw kan deelantwoorden in realtime streamen:

    - directe chats: previewbericht + `editMessageText`
    - groepen/onderwerpen: previewbericht + `editMessageText`

    Vereiste:

    - `channels.telegram.streaming` is `off | partial | block | progress` (standaard: `partial`)
    - korte previews van initiële antwoorden worden gedebounced en daarna na een begrensde vertraging gematerialiseerd als de run nog actief is
    - `progress` houdt één bewerkbaar statusconcept bij voor toolvoortgang, toont het stabiele statuslabel wanneer antwoordactiviteit binnenkomt vóór toolvoortgang, wist dit bij voltooiing en verzendt het definitieve antwoord als normaal bericht
    - `streaming.preview.toolProgress` bepaalt of tool-/voortgangsupdates hetzelfde bewerkte previewbericht hergebruiken (standaard: `true` wanneer previewstreaming actief is)
    - `streaming.preview.commandText` bepaalt commando-/exec-details binnen die toolvoortgangsregels: `raw` (standaard, behoudt uitgebracht gedrag) of `status` (alleen toollabel)
    - `streaming.progress.commentary` (standaard: `false`) schakelt assistentcommentaar/preambuletekst in het tijdelijke voortgangsconcept in
    - legacy `channels.telegram.streamMode`, booleaanse `streaming`-waarden en gepensioneerde native conceptpreviewsleutels worden gedetecteerd; voer `openclaw doctor --fix` uit om ze naar de huidige streamingconfiguratie te migreren

    Toolvoortgangs-previewupdates zijn de korte statusregels die worden getoond terwijl tools draaien, bijvoorbeeld commandouitvoering, bestandslezingen, planningsupdates, patchsamenvattingen of Codex-preambule-/commentaartekst in Codex app-servermodus. Telegram houdt deze standaard ingeschakeld om overeen te komen met uitgebracht OpenClaw-gedrag vanaf `v2026.4.22` en later.

    Om de bewerkte preview voor antwoordtekst te behouden maar toolvoortgangsregels te verbergen, stel je in:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": {
              "toolProgress": false
            }
          }
        }
      }
    }
    ```

    Om toolvoortgang zichtbaar te houden maar commando-/exec-tekst te verbergen, stel je in:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": {
              "commandText": "status"
            }
          }
        }
      }
    }
    ```

    Gebruik de modus `progress` wanneer je zichtbare toolvoortgang wilt zonder het definitieve antwoord in datzelfde bericht te bewerken. Plaats het commandotekstbeleid onder `streaming.progress`:

    ```json
    {
      "channels": {
        "telegram": {
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

    Gebruik `streaming.mode: "off"` alleen wanneer je levering met alleen het definitieve antwoord wilt: Telegram-previewbewerkingen worden uitgeschakeld en generiek tool-/voortgangsgeklets wordt onderdrukt in plaats van als zelfstandige statusberichten te worden verzonden. Goedkeuringsprompts, mediapayloads en fouten blijven via normale definitieve levering routeren. Gebruik `streaming.preview.toolProgress: false` wanneer je alleen antwoordpreviewbewerkingen wilt behouden terwijl je de statusregels voor toolvoortgang verbergt.

    <Note>
      Geselecteerde quote-antwoorden in Telegram vormen de uitzondering. Wanneer `replyToMode` `"first"`, `"all"` of `"batched"` is en het inkomende bericht geselecteerde quotetekst bevat, verzendt OpenClaw het definitieve antwoord via Telegrams native quote-antwoordpad in plaats van de antwoordpreview te bewerken, waardoor `streaming.preview.toolProgress` de korte statusregels voor die beurt niet kan tonen. Antwoorden op het huidige bericht zonder geselecteerde quotetekst behouden previewstreaming nog steeds. Stel `replyToMode: "off"` in wanneer zichtbaarheid van toolvoortgang belangrijker is dan native quote-antwoorden, of stel `streaming.preview.toolProgress: false` in om de afweging te erkennen.
    </Note>

    Voor antwoorden met alleen tekst:

    - korte DM-/groeps-/onderwerppreviews: OpenClaw behoudt hetzelfde previewbericht en voert de definitieve bewerking op zijn plek uit
    - lange definitieve tekst die in meerdere Telegram-berichten wordt gesplitst, hergebruikt de bestaande preview waar mogelijk als het eerste definitieve fragment en verzendt daarna alleen de resterende fragmenten
    - definitieve antwoorden in progress-modus wissen het statusconcept en gebruiken normale definitieve levering in plaats van het concept tot antwoord te bewerken
    - als de definitieve bewerking mislukt voordat de voltooide tekst is bevestigd, gebruikt OpenClaw normale definitieve levering en ruimt het de verouderde preview op

    Voor complexe antwoorden (bijvoorbeeld mediapayloads) valt OpenClaw terug op normale definitieve levering en ruimt daarna het previewbericht op.

    Previewstreaming staat los van blockstreaming. Wanneer blockstreaming expliciet is ingeschakeld voor Telegram, slaat OpenClaw de previewstream over om dubbel streamen te voorkomen.

    Gedrag van reasoningstream:

    - `/reasoning stream` gebruikt het reasoning-previewpad van een ondersteund kanaal; op Telegram streamt het reasoning tijdens het genereren naar de live preview
    - de reasoningpreview wordt verwijderd na definitieve levering; gebruik `/reasoning on` wanneer reasoning zichtbaar moet blijven
    - het definitieve antwoord wordt zonder reasoningtekst verzonden

  </Accordion>

  <Accordion title="Rich message formatting">
    Uitgaande tekst gebruikt standaard Telegram HTML-berichten, zodat antwoorden leesbaar blijven in huidige Telegram-clients. Deze compatibiliteitsmodus ondersteunt normale vetgedrukte tekst, cursief, links, code, spoilers en quotes, maar geen rich-only blokken van Bot API 10.1 zoals native tabellen, details, rijke media en formules.

    Stel `channels.telegram.richMessages: true` in om Bot API 10.1 rijke berichten in te schakelen:

```json5
{
  channels: {
    telegram: {
      richMessages: true,
    },
  },
}
```

    Wanneer ingeschakeld:

    - De agent krijgt te horen dat rijke Telegram-berichten beschikbaar zijn voor deze bot/dit account.
    - Markdown-tekst wordt gerenderd via OpenClaw's Markdown IR en verzonden als rijke Telegram-HTML.
    - Expliciete rijke HTML-payloads behouden ondersteunde Bot API 10.1-tags zoals koppen, tabellen, details, rijke media en formules.
    - Mediabijschriften gebruiken nog steeds Telegram HTML-bijschriften, omdat rijke berichten bijschriften niet vervangen.

    Dit houdt modeltekst weg van Telegram Rich Markdown-sigils, zodat valuta zoals `$400-600K` niet als wiskunde wordt geparsed. Lange rijke tekst wordt automatisch gesplitst over de rijke-tekst- en rijke-bloklimieten van Telegram. Tabellen boven de kolomlimiet van Telegram worden als codeblokken verzonden.

    Standaard: uit voor clientcompatibiliteit. Rijke berichten vereisen compatibele Telegram-clients; sommige huidige Desktop-, Web-, Android- en third-party clients geven geaccepteerde rijke berichten weer als niet-ondersteund. Laat deze optie uitgeschakeld tenzij elke client die met de bot wordt gebruikt ze kan renderen. `/status` toont of de huidige Telegram-sessie rijke berichten aan of uit heeft.

    Linkpreviews zijn standaard ingeschakeld. `channels.telegram.linkPreview: false` slaat automatische entiteitsdetectie voor rijke tekst over.

  </Accordion>

  <Accordion title="Native commands and custom commands">
    Registratie van het Telegram-commandmenu wordt bij het opstarten afgehandeld met `setMyCommands`.

    Standaarden voor native commando's:

    - `commands.native: "auto"` schakelt native commando's in voor Telegram

    Voeg aangepaste commandmenu-items toe:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Git backup" },
        { command: "generate", description: "Create an image" },
      ],
    },
  },
}
```

    Regels:

    - namen worden genormaliseerd (leidende `/` verwijderen, kleine letters)
    - geldig patroon: `a-z`, `0-9`, `_`, lengte `1..32`
    - aangepaste commando's kunnen native commando's niet overschrijven
    - conflicten/duplicaten worden overgeslagen en gelogd

    Opmerkingen:

    - aangepaste commando's zijn alleen menu-items; ze implementeren niet automatisch gedrag
    - plugin-/skillcommando's kunnen nog steeds werken wanneer ze worden getypt, zelfs als ze niet in het Telegram-menu worden getoond

    Als native commando's zijn uitgeschakeld, worden ingebouwde commando's verwijderd. Aangepaste/plugincommando's kunnen nog steeds registreren als ze zijn geconfigureerd.

    Veelvoorkomende configuratiefouten:

    - `setMyCommands failed` met `BOT_COMMANDS_TOO_MUCH` betekent dat het Telegram-menu na inkorten nog steeds is overgelopen; verminder plugin-/skill-/aangepaste commando's of schakel `channels.telegram.commands.native` uit.
    - `deleteWebhook`, `deleteMyCommands` of `setMyCommands` dat faalt met `404: Not Found` terwijl directe Bot API-curlcommando's werken, kan betekenen dat `channels.telegram.apiRoot` is ingesteld op het volledige `/bot<TOKEN>`-endpoint. `apiRoot` mag alleen de Bot API-root zijn, en `openclaw doctor --fix` verwijdert een per ongeluk afsluitende `/bot<TOKEN>`.
    - `getMe returned 401` betekent dat Telegram de geconfigureerde bottoken heeft geweigerd. Werk `botToken`, `tokenFile` of `TELEGRAM_BOT_TOKEN` bij met de huidige BotFather-token; OpenClaw stopt vóór polling, dus dit wordt niet gemeld als een webhook-opruimfout.
    - `setMyCommands failed` met netwerk-/fetchfouten betekent meestal dat uitgaande DNS/HTTPS naar `api.telegram.org` is geblokkeerd.

    ### Commando's voor apparaatkoppeling (`device-pair`-plugin)

    Wanneer de `device-pair`-plugin is geïnstalleerd:

    1. `/pair` genereert setupcode
    2. plak code in iOS-app
    3. `/pair pending` toont openstaande aanvragen (inclusief rol/scopes)
    4. keur de aanvraag goed:
       - `/pair approve <requestId>` voor expliciete goedkeuring
       - `/pair approve` wanneer er slechts één openstaande aanvraag is
       - `/pair approve latest` voor de meest recente

    De setupcode bevat een kortlevende bootstrap-token. De ingebouwde setupcode-bootstrap retourneert een duurzame nodetoken met `scopes: []` plus een begrensde operator-handofftoken voor vertrouwde mobiele onboarding. Die operatortoken kan native configuratie tijdens setup lezen, maar verleent geen scopes voor koppelingsmutaties of `operator.admin`.

    Als een apparaat opnieuw probeert met gewijzigde authdetails (bijvoorbeeld rol/scopes/publieke sleutel), wordt de vorige openstaande aanvraag vervangen en gebruikt de nieuwe aanvraag een andere `requestId`. Voer `/pair pending` opnieuw uit vóór goedkeuring.

    Meer details: [Koppelen](/nl/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="Inline-knoppen">
    Configureer het bereik van het inline-toetsenbord:

```json5
{
  channels: {
    telegram: {
      capabilities: {
        inlineButtons: "allowlist",
      },
    },
  },
}
```

    Overschrijving per account:

```json5
{
  channels: {
    telegram: {
      accounts: {
        main: {
          capabilities: {
            inlineButtons: "allowlist",
          },
        },
      },
    },
  },
}
```

    Bereiken:

    - `off`
    - `dm`
    - `group`
    - `all`
    - `allowlist` (standaard)

    Verouderde `capabilities: ["inlineButtons"]` wordt toegewezen aan `inlineButtons: "all"`.

    Voorbeeld van berichtactie:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Choose an option:",
  buttons: [
    [
      { text: "Yes", callback_data: "yes" },
      { text: "No", callback_data: "no" },
    ],
    [{ text: "Cancel", callback_data: "cancel" }],
  ],
}
```

    Voorbeeld van Mini App-knop:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Open app:",
  presentation: {
    blocks: [
      {
        type: "buttons",
        buttons: [{ label: "Launch", web_app: { url: "https://example.com/app" } }],
      },
    ],
  },
}
```

    Telegram-`web_app`-knoppen werken alleen in privéchats tussen een gebruiker en de
    bot.

    Callback-klikken die niet worden opgeëist door een geregistreerde interactieve
    handler van een plugin, worden als tekst doorgegeven aan de agent:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Telegram-berichtacties voor agents en automatisering">
    Telegram-toolacties omvatten:

    - `sendMessage` (`to`, `content`, optioneel `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content` of `caption`, optioneel `presentation` inline-knoppen; bewerkingen met alleen knoppen werken reply markup bij)
    - `createForumTopic` (`chatId`, `name`, optioneel `iconColor`, `iconCustomEmojiId`)

    Kanaalberichtacties bieden ergonomische aliassen (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Toegangscontroles:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (standaard: uitgeschakeld)

    Opmerking: `edit` en `topic-create` zijn momenteel standaard ingeschakeld en hebben geen afzonderlijke `channels.telegram.actions.*`-schakelaars.
    Runtime-verzendingen gebruiken de actieve momentopname van config/geheimen (opstarten/herladen), dus actiepaden voeren geen ad-hoc SecretRef-herresolutie per verzending uit.

    Semantiek voor het verwijderen van reacties: [/tools/reactions](/nl/tools/reactions)

  </Accordion>

  <Accordion title="Tags voor antwoordthreads">
    Telegram ondersteunt expliciete tags voor antwoordthreads in gegenereerde uitvoer:

    - `[[reply_to_current]]` antwoordt op het activerende bericht
    - `[[reply_to:<id>]]` antwoordt op een specifieke Telegram-bericht-ID

    `channels.telegram.replyToMode` bepaalt de afhandeling:

    - `off` (standaard)
    - `first`
    - `all`

    Wanneer antwoordthreads zijn ingeschakeld en de oorspronkelijke Telegram-tekst of het oorspronkelijke bijschrift beschikbaar is, neemt OpenClaw automatisch een native Telegram-citaatfragment op. Telegram beperkt native citaattekst tot 1024 UTF-16-code-eenheden, dus langere berichten worden vanaf het begin geciteerd en vallen terug op een gewoon antwoord als Telegram het citaat weigert.

    Opmerking: `off` schakelt impliciete antwoordthreads uit. Expliciete `[[reply_to_*]]`-tags worden nog steeds gerespecteerd.

  </Accordion>

  <Accordion title="Forumonderwerpen en threadgedrag">
    Forum-supergroepen:

    - onderwerpsessiesleutels voegen `:topic:<threadId>` toe
    - antwoorden en typindicaties zijn gericht op de onderwerpthread
    - configpad voor onderwerpen:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Speciaal geval voor algemeen onderwerp (`threadId=1`):

    - berichtverzendingen laten `message_thread_id` weg (Telegram weigert `sendMessage(...thread_id=1)`)
    - typacties bevatten nog steeds `message_thread_id`

    Overerving van onderwerpen: onderwerpvermeldingen erven groepsinstellingen tenzij ze worden overschreven (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` geldt alleen voor onderwerpen en erft niet van groepsstandaarden.
    `topics."*"` stelt standaarden in voor elk onderwerp in die groep; exacte onderwerp-ID's winnen nog steeds van `"*"`.

    **Agentroutering per onderwerp**: Elk onderwerp kan naar een andere agent routeren door `agentId` in de onderwerpconfig in te stellen. Dit geeft elk onderwerp zijn eigen geïsoleerde werkruimte, geheugen en sessie. Voorbeeld:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // General topic → main agent
                "3": { agentId: "zu" },        // Dev topic → zu agent
                "5": { agentId: "coder" }      // Code review → coder agent
              }
            }
          }
        }
      }
    }
    ```

    Elk onderwerp heeft daarna zijn eigen sessiesleutel: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Persistente ACP-onderwerpbinding**: Forumonderwerpen kunnen ACP-harness-sessies vastzetten via getypeerde ACP-bindingen op topniveau (`bindings[]` met `type: "acp"` en `match.channel: "telegram"`, `peer.kind: "group"` en een onderwerpgekwalificeerde id zoals `-1001234567890:topic:42`). Momenteel beperkt tot forumonderwerpen in groepen/supergroepen. Zie [ACP Agents](/nl/tools/acp-agents).

    **Threadgebonden ACP-spawn vanuit chat**: `/acp spawn <agent> --thread here|auto` bindt het huidige onderwerp aan een nieuwe ACP-sessie; vervolgberichten routeren daar rechtstreeks naartoe. OpenClaw zet de spawnbevestiging vast in het onderwerp. Vereist dat `channels.telegram.threadBindings.spawnSessions` ingeschakeld blijft (standaard: `true`).

    Templatecontext stelt `MessageThreadId` en `IsForum` beschikbaar. DM-chats met `message_thread_id` behouden antwoordmetadata; ze gebruiken alleen thread-bewuste sessiesleutels wanneer Telegram `getMe` voor de bot `has_topics_enabled: true` meldt.
    De voormalige overschrijvingen `dm.threadReplies` en `direct.*.threadReplies` zijn bewust afgeschaft; gebruik de threaded modus van BotFather als enige bron van waarheid en voer `openclaw doctor --fix` uit om verouderde configsleutels te verwijderen.

  </Accordion>

  <Accordion title="Audio, video en stickers">
    ### Audioberichten

    Telegram maakt onderscheid tussen spraaknotities en audiobestanden.

    - standaard: gedrag voor audiobestanden
    - tag `[[audio_as_voice]]` in het antwoord van de agent om verzending als spraaknotitie af te dwingen
    - binnenkomende transcripties van spraaknotities worden in de agentcontext ingekaderd als machinaal gegenereerde,
      niet-vertrouwde tekst; vermeldingsdetectie gebruikt nog steeds de onbewerkte
      transcriptie, zodat spraakberichten achter een vermeldingspoort blijven werken.

    Voorbeeld van berichtactie:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/voice.ogg",
  asVoice: true,
}
```

    ### Videoberichten

    Telegram maakt onderscheid tussen videobestanden en videonotities.

    Voorbeeld van berichtactie:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    Videonotities ondersteunen geen bijschriften; opgegeven berichttekst wordt afzonderlijk verzonden.

    ### Stickers

    Verwerking van inkomende stickers:

    - statische WEBP: gedownload en verwerkt (placeholder `<media:sticker>`)
    - geanimeerde TGS: overgeslagen
    - video-WEBM: overgeslagen

    Stickervelden in context:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    Stickerbeschrijvingen worden gecachet in de OpenClaw SQLite-pluginstatus om herhaalde vision-aanroepen te verminderen.

    Stickeracties inschakelen:

```json5
{
  channels: {
    telegram: {
      actions: {
        sticker: true,
      },
    },
  },
}
```

    Stickeractie verzenden:

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    Gecachete stickers zoeken:

```json5
{
  action: "sticker-search",
  channel: "telegram",
  query: "cat waving",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="Reactiemeldingen">
    Telegram-reacties komen binnen als `message_reaction`-updates (los van berichtpayloads).

    Wanneer ingeschakeld, zet OpenClaw systeemgebeurtenissen in de wachtrij zoals:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Configuratie:

    - `channels.telegram.reactionNotifications`: `off | own | all` (standaard: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (standaard: `minimal`)

    Opmerkingen:

    - `own` betekent alleen gebruikersreacties op door de bot verzonden berichten (best effort via cache voor verzonden berichten).
    - Reactiegebeurtenissen respecteren nog steeds de Telegram-toegangscontroles (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); niet-geautoriseerde afzenders worden geweigerd.
    - Telegram geeft geen thread-ID's mee in reactie-updates.
      - niet-forumgroepen worden gerouteerd naar de groepschatsessie
      - forumgroepen worden gerouteerd naar de algemene-onderwerpsessie van de groep (`:topic:1`), niet naar het exacte oorspronkelijke onderwerp

    `allowed_updates` voor polling/Webhook bevat automatisch `message_reaction`.

  </Accordion>

  <Accordion title="Ack-reacties">
    `ackReaction` verzendt een bevestigingsemoji terwijl OpenClaw een inkomend bericht verwerkt. `ackReactionScope` bepaalt *wanneer* die emoji daadwerkelijk wordt verzonden.

    **Volgorde voor emoji-resolutie (`ackReaction`):**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - fallback naar emoji van agentidentiteit (`agents.list[].identity.emoji`, anders "👀")

    Opmerkingen:

    - Telegram verwacht unicode-emoji (bijvoorbeeld "👀").
    - Gebruik `""` om de reactie voor een kanaal of account uit te schakelen.

    **Bereik (`messages.ackReactionScope`):**

    De Telegram-provider leest het bereik uit `messages.ackReactionScope` (standaard `"group-mentions"`). Er is momenteel geen override op Telegram-account- of Telegram-kanaalniveau.

    Waarden: `"all"` (DM's + groepen), `"direct"` (alleen DM's), `"group-all"` (elk groepsbericht, geen DM's), `"group-mentions"` (groepen wanneer de bot wordt genoemd; **geen DM's** — dit is de standaard), `"off"` / `"none"` (uitgeschakeld).

    <Note>
    Het standaardbereik (`"group-mentions"`) triggert geen ack-reacties in directe berichten. Om een ack-reactie op inkomende Telegram-DM's te krijgen, stel je `messages.ackReactionScope` in op `"direct"` of `"all"`. De waarde wordt gelezen bij het opstarten van de Telegram-provider, dus een herstart van de Gateway is nodig om de wijziging van kracht te laten worden.
    </Note>

  </Accordion>

  <Accordion title="Configuratieschrijven vanuit Telegram-gebeurtenissen en -commando's">
    Schrijven naar kanaalconfiguratie is standaard ingeschakeld (`configWrites !== false`).

    Door Telegram getriggerde schrijfacties omvatten:

    - groepsmigratiegebeurtenissen (`migrate_to_chat_id`) om `channels.telegram.groups` bij te werken
    - `/config set` en `/config unset` (vereist dat commando's zijn ingeschakeld)

    Uitschakelen:

```json5
{
  channels: {
    telegram: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="Long polling versus webhook">
    Standaard wordt long polling gebruikt. Stel voor Webhook-modus `channels.telegram.webhookUrl` en `channels.telegram.webhookSecret` in; optioneel `webhookPath`, `webhookHost`, `webhookPort` (standaarden `/telegram-webhook`, `127.0.0.1`, `8787`).

    In long-pollingmodus bewaart OpenClaw zijn herstart-watermark pas nadat een update succesvol is gedispatcht. Als een handler faalt, blijft die update opnieuw probeerbaar in hetzelfde proces en wordt deze niet als voltooid weggeschreven voor deduplicatie bij herstart.

    De lokale listener bindt aan `127.0.0.1:8787`. Plaats voor openbare ingress een reverse proxy vóór de lokale poort, of stel bewust `webhookHost: "0.0.0.0"` in.

    Webhook-modus valideert request-guards, het geheime Telegram-token en de JSON-body voordat `200` aan Telegram wordt teruggegeven.
    OpenClaw verwerkt de update daarna asynchroon via dezelfde botlanes per chat/per onderwerp als bij long polling, zodat trage agentbeurten de afleverings-ACK van Telegram niet ophouden.

  </Accordion>

  <Accordion title="Limieten, retries en CLI-doelen">
    - `channels.telegram.textChunkLimit` is standaard 4000.
    - `channels.telegram.chunkMode="newline"` geeft de voorkeur aan alineagrenzen (lege regels) voordat er op lengte wordt gesplitst.
    - `channels.telegram.mediaMaxMb` (standaard 100) begrenst de grootte van inkomende en uitgaande Telegram-media.
    - `channels.telegram.mediaGroupFlushMs` (standaard 500) bepaalt hoe lang Telegram-albums/mediagroepen worden gebufferd voordat OpenClaw ze als één inkomend bericht dispatcht. Verhoog dit als albumonderdelen laat aankomen; verlaag dit om de latentie van albumantwoorden te verminderen.
    - `channels.telegram.timeoutSeconds` overschrijft de time-out van de Telegram API-client (als deze niet is ingesteld, geldt de standaard van grammY). Botclients begrenzen geconfigureerde waarden onder de 60-secondenbeveiliging voor uitgaande tekst-/typverzoeken, zodat grammY de zichtbare antwoordlevering niet afbreekt voordat de transportbeveiliging en fallback van OpenClaw kunnen worden uitgevoerd. Long polling gebruikt nog steeds een 45-secondenbeveiliging voor `getUpdates`-verzoeken, zodat inactieve polls niet oneindig worden verlaten.
    - `channels.telegram.pollingStallThresholdMs` is standaard `120000`; pas alleen aan tussen `30000` en `600000` voor fout-positieve herstarts door vastgelopen polling.
    - groepscontexthistorie gebruikt `channels.telegram.historyLimit` of `messages.groupChat.historyLimit` (standaard 50); `0` schakelt dit uit.
    - aanvullende context van antwoorden/citaten/doorsturen wordt genormaliseerd tot één geselecteerd gesprekscontextvenster wanneer de Gateway de bovenliggende berichten heeft gezien; de cache met waargenomen berichten bevindt zich in de OpenClaw SQLite-Pluginstatus, en `openclaw doctor --fix` importeert legacy sidecars. Telegram bevat slechts één oppervlakkige `reply_to_message` in updates, dus ketens ouder dan de cache zijn beperkt tot de huidige updatepayload van Telegram.
    - Telegram-allowlists bepalen vooral wie de agent kan activeren, niet een volledige redactiegrens voor aanvullende context.
    - besturing van DM-historie:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry`-configuratie geldt voor Telegram-verzendhelpers (CLI/tools/acties) voor herstelbare uitgaande API-fouten. Levering van inkomende eindantwoorden gebruikt ook een begrensde veilige verzendretry voor Telegram-pre-connectfouten, maar probeert geen dubbelzinnige netwerk-enveloppen na verzending opnieuw die zichtbare berichten zouden kunnen dupliceren.

    CLI- en berichttoolverzenddoelen kunnen een numerieke chat-ID, gebruikersnaam of een forumtopicdoel zijn:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
```

    Telegram-polls gebruiken `openclaw message poll` en ondersteunen forumtopics:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Alleen-Telegram poll-vlaggen:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` voor forumtopics (of gebruik een `:topic:`-doel)

    Telegram-verzenden ondersteunt ook:

    - `--presentation` met `buttons`-blokken voor inline toetsenborden wanneer `channels.telegram.capabilities.inlineButtons` dit toestaat
    - `--pin` of `--delivery '{"pin":true}'` om vastgezette levering aan te vragen wanneer de bot in die chat kan vastzetten
    - `--force-document` om uitgaande afbeeldingen, GIF's en video's als documenten te verzenden in plaats van gecomprimeerde foto-, animated-media- of video-uploads

    Actiebegrenzing:

    - `channels.telegram.actions.sendMessage=false` schakelt uitgaande Telegram-berichten uit, inclusief polls
    - `channels.telegram.actions.poll=false` schakelt het maken van Telegram-polls uit terwijl reguliere verzendingen ingeschakeld blijven

  </Accordion>

  <Accordion title="Exec-goedkeuringen in Telegram">
    Telegram ondersteunt exec-goedkeuringen in DM's van goedkeurders en kan prompts optioneel plaatsen in de oorspronkelijke chat of het oorspronkelijke topic. Goedkeurders moeten numerieke Telegram-gebruikers-ID's zijn.

    Configuratiepad:

    - `channels.telegram.execApprovals.enabled` (wordt automatisch ingeschakeld wanneer ten minste één goedkeurder kan worden opgelost)
    - `channels.telegram.execApprovals.approvers` (valt terug op numerieke eigenaar-ID's uit `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (standaard) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` en `defaultTo` bepalen wie met de bot kan praten en waar normale antwoorden naartoe worden verzonden. Ze maken iemand geen exec-goedkeurder. De eerste goedgekeurde DM-koppeling bootstrapt `commands.ownerAllowFrom` wanneer er nog geen opdrachteigenaar bestaat, zodat de setup met één eigenaar blijft werken zonder ID's te dupliceren onder `execApprovals.approvers`.

    Kanaallevering toont de opdrachttekst in de chat; schakel `channel` of `both` alleen in vertrouwde groepen/topics in. Wanneer de prompt in een forumtopic terechtkomt, behoudt OpenClaw het topic voor de goedkeuringsprompt en de opvolging. Exec-goedkeuringen verlopen standaard na 30 minuten.

    Inline goedkeuringsknoppen vereisen ook dat `channels.telegram.capabilities.inlineButtons` het doeloppervlak toestaat (`dm`, `group` of `all`). Goedkeurings-ID's met het voorvoegsel `plugin:` worden via Plugin-goedkeuringen opgelost; andere worden eerst via exec-goedkeuringen opgelost.

    Zie [Exec-goedkeuringen](/nl/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Besturing van foutantwoorden

Wanneer de agent een leverings- of providerfout tegenkomt, bepaalt het foutbeleid of foutberichten naar de Telegram-chat worden verzonden:

| Sleutel                             | Waarden                    | Standaard       | Beschrijving                                                                                                                                                                                                                         |
| ----------------------------------- | -------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `channels.telegram.errorPolicy`     | `always`, `once`, `silent` | `always`        | `always` — verzend elk foutbericht naar de chat. `once` — verzend elk uniek foutbericht één keer per cooldownvenster (onderdruk herhaalde identieke fouten). `silent` — verzend nooit foutberichten naar de chat.                    |
| `channels.telegram.errorCooldownMs` | getal (ms)                 | `14400000` (4u) | Cooldownvenster voor het `once`-beleid. Nadat een fout is verzonden, wordt hetzelfde foutbericht onderdrukt totdat dit interval is verstreken. Voorkomt foutspam tijdens storingen.                                                   |

Overrides per account, per groep en per topic worden ondersteund (dezelfde overerving als andere Telegram-configuratiesleutels).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "always",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // suppress errors in this group
        },
      },
    },
  },
}
```

## Probleemoplossing

<AccordionGroup>
  <Accordion title="Bot reageert niet op groepsberichten zonder vermelding">

    - Als `requireMention=false`, moet de privacymodus van Telegram volledige zichtbaarheid toestaan.
      - BotFather: `/setprivacy` -> Uitschakelen
      - verwijder de bot daarna uit de groep en voeg deze opnieuw toe
    - `openclaw channels status` waarschuwt wanneer configuratie groepsberichten zonder vermelding verwacht.
    - `openclaw channels status --probe` kan expliciete numerieke groeps-ID's controleren; wildcard `"*"` kan niet op lidmaatschap worden geprobed.
    - snelle sessietest: `/activation always`.

  </Accordion>

  <Accordion title="Bot ziet helemaal geen groepsberichten">

    - wanneer `channels.telegram.groups` bestaat, moet de groep worden vermeld (of moet `"*"` worden opgenomen)
    - verifieer botlidmaatschap in de groep
    - bekijk logs: `openclaw logs --follow` voor redenen voor overslaan

  </Accordion>

  <Accordion title="Opdrachten werken gedeeltelijk of helemaal niet">

    - autoriseer je afzenderidentiteit (koppeling en/of numerieke `allowFrom`)
    - opdrachtautorisatie blijft gelden, zelfs wanneer het groepsbeleid `open` is
    - `setMyCommands failed` met `BOT_COMMANDS_TOO_MUCH` betekent dat het native menu te veel items heeft; verminder Plugin-/skill-/aangepaste opdrachten of schakel native menu's uit
    - `deleteMyCommands` / `setMyCommands`-startupaanroepen en `sendChatAction`-typaanroepen zijn begrensd en proberen één keer opnieuw via de transportfallback van Telegram bij een verzoektime-out. Aanhoudende netwerk-/fetchfouten wijzen meestal op DNS-/HTTPS-bereikbaarheidsproblemen naar `api.telegram.org`

  </Accordion>

  <Accordion title="Startup meldt ongeautoriseerde token">

    - `getMe returned 401` is een Telegram-authenticatiefout voor de geconfigureerde bottoken.
    - Kopieer of regenereer de bottoken opnieuw in BotFather en werk daarna `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` of `TELEGRAM_BOT_TOKEN` bij voor het standaardaccount.
    - `deleteWebhook 401 Unauthorized` tijdens startup is ook een authfout; dit behandelen als "er bestaat geen Webhook" zou dezelfde fout door een ongeldige token alleen uitstellen tot latere API-aanroepen.

  </Accordion>

  <Accordion title="Polling- of netwerkinstabiliteit">

    - Node 22+ + aangepaste fetch/proxy kan onmiddellijk afbreekgedrag veroorzaken als AbortSignal-typen niet overeenkomen.
    - Sommige hosts lossen `api.telegram.org` eerst op naar IPv6; defecte IPv6-egress kan intermitterende Telegram API-fouten veroorzaken.
    - Als logs `TypeError: fetch failed` of `Network request for 'getUpdates' failed!` bevatten, probeert OpenClaw deze nu opnieuw als herstelbare netwerkfouten.
    - Tijdens polling-startup hergebruikt OpenClaw de succesvolle startup-`getMe`-probe voor grammY, zodat de runner geen tweede `getMe` nodig heeft vóór de eerste `getUpdates`.
    - Als `deleteWebhook` mislukt met een tijdelijke netwerkfout tijdens polling-startup, gaat OpenClaw door met long polling in plaats van nog een pre-poll control-plane-aanroep te doen. Een nog actieve Webhook verschijnt als een `getUpdates`-conflict; OpenClaw bouwt dan het Telegram-transport opnieuw op en probeert Webhook-opschoning opnieuw.
    - Als Telegram-sockets volgens een korte vaste cadans worden gerecycled, controleer dan op een lage `channels.telegram.timeoutSeconds`; botclients begrenzen geconfigureerde waarden onder de uitgaande en `getUpdates`-verzoekbeveiligingen, maar oudere releases konden elke poll of elk antwoord afbreken wanneer dit onder die beveiligingen was ingesteld.
    - Als logs `Polling stall detected` bevatten, herstart OpenClaw standaard polling en bouwt het Telegram-transport opnieuw op na 120 seconden zonder voltooide long-poll-liveness.
    - `openclaw channels status --probe` en `openclaw doctor` waarschuwen wanneer een actief pollingaccount `getUpdates` na de startup-gratie niet heeft voltooid, wanneer een actief Webhook-account `setWebhook` na de startup-gratie niet heeft voltooid, of wanneer de laatste succesvolle pollingtransportactiviteit verouderd is.
    - Verhoog `channels.telegram.pollingStallThresholdMs` alleen wanneer langlopende `getUpdates`-aanroepen gezond zijn maar je host nog steeds foutieve polling-stall-herstarts meldt. Aanhoudende stalls wijzen meestal op proxy-, DNS-, IPv6- of TLS-egressproblemen tussen de host en `api.telegram.org`.
    - Telegram respecteert ook procesproxy-env voor Bot API-transport, inclusief `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` en hun varianten in kleine letters. `NO_PROXY` / `no_proxy` kan `api.telegram.org` nog steeds omzeilen.
    - Als de door OpenClaw beheerde proxy via `OPENCLAW_PROXY_URL` is geconfigureerd voor een serviceomgeving en er geen standaard proxy-env aanwezig is, gebruikt Telegram die URL ook voor Bot API-transport.
    - Routeer Telegram API-aanroepen op VPS-hosts met instabiele directe egress/TLS via `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ gebruikt standaard `autoSelectFamily=true` (behalve WSL2). De volgorde van Telegram-DNS-resultaten respecteert `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, daarna `channels.telegram.network.dnsResultOrder`, daarna de processtandaard zoals `NODE_OPTIONS=--dns-result-order=ipv4first`; als geen daarvan van toepassing is, valt Node 22+ terug op `ipv4first`.
    - Als je host WSL2 is of expliciet beter werkt met alleen-IPv4-gedrag, forceer familieselectie:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Antwoorden uit het RFC 2544-benchmarkbereik (`198.18.0.0/15`) zijn standaard al toegestaan
      voor Telegram-mediadownloads. Als een vertrouwde fake-IP- of
      transparante proxy `api.telegram.org` herschrijft naar een ander
      privé-/intern/speciaal adres tijdens mediadownloads, kun je je aanmelden
      voor de Telegram-only bypass:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Dezelfde opt-in is per account beschikbaar op
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Als je proxy Telegram-mediahosts omzet naar `198.18.x.x`, laat de
      gevaarlijke vlag eerst uit. Telegram-media staat het RFC 2544-
      benchmarkbereik standaard al toe.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` verzwakt Telegram-
      media-SSRF-beveiligingen. Gebruik dit alleen voor vertrouwde, door operators beheerde proxy-
      omgevingen zoals Clash-, Mihomo- of Surge-fake-IP-routering wanneer ze
      privé- of speciale antwoorden buiten het RFC 2544-benchmarkbereik
      synthetiseren. Laat dit uit voor normale openbare internettoegang tot Telegram.
    </Warning>

    - Omgevingsoverschrijvingen (tijdelijk):
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - Valideer DNS-antwoorden:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

Meer hulp: [Kanaalprobleemoplossing](/nl/channels/troubleshooting).

## Configuratiereferentie

Primaire referentie: [Configuratiereferentie - Telegram](/nl/gateway/config-channels#telegram).

<Accordion title="High-signal Telegram fields">

- opstarten/authenticatie: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` moet naar een regulier bestand verwijzen; symlinks worden geweigerd)
- toegangsbeheer: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, top-level `bindings[]` (`type: "acp"`)
- topicstandaarden: `groups.<chatId>.topics."*"` is van toepassing op niet-overeenkomende forumtopics; exacte topic-ID's overschrijven dit
- exec-goedkeuringen: `execApprovals`, `accounts.*.execApprovals`
- opdrachten/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- threads/antwoorden: `replyToMode`
- streamen: `streaming` (preview), `streaming.preview.toolProgress`, `blockStreaming`
- opmaak/bezorging: `textChunkLimit`, `chunkMode`, `richMessages`, `linkPreview`, `responsePrefix`
- media/netwerk: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- aangepaste API-root: `apiRoot` (alleen Bot API-root; neem `/bot<TOKEN>` niet op)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- acties/capabilities: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reacties: `reactionNotifications`, `reactionLevel`
- fouten: `errorPolicy`, `errorCooldownMs`
- schrijfacties/geschiedenis: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Voorrang bij meerdere accounts: wanneer twee of meer account-ID's zijn geconfigureerd, stel `channels.telegram.defaultAccount` in (of neem `channels.telegram.accounts.default` op) om standaardroutering expliciet te maken. Anders valt OpenClaw terug op het eerste genormaliseerde account-ID en waarschuwt `openclaw doctor`. Genoemde accounts erven `channels.telegram.allowFrom` / `groupAllowFrom`, maar geen `accounts.default.*`-waarden.
</Note>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/nl/channels/pairing">
    Koppel een Telegram-gebruiker aan de Gateway.
  </Card>
  <Card title="Groups" icon="users" href="/nl/channels/groups">
    Gedrag van allowlists voor groepen en topics.
  </Card>
  <Card title="Channel routing" icon="route" href="/nl/channels/channel-routing">
    Routeer inkomende berichten naar agents.
  </Card>
  <Card title="Security" icon="shield" href="/nl/gateway/security">
    Dreigingsmodel en verharding.
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/nl/concepts/multi-agent">
    Koppel groepen en topics aan agents.
  </Card>
  <Card title="Troubleshooting" icon="wrench" href="/nl/channels/troubleshooting">
    Diagnostiek over kanalen heen.
  </Card>
</CardGroup>
