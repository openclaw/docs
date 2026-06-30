---
read_when:
    - Werken aan Telegram-functies of Webhooks
summary: Ondersteuningsstatus, mogelijkheden en configuratie van Telegram-bots
title: Telegram
x-i18n:
    generated_at: "2026-06-30T14:09:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e143096bbcdf949ef11566ffe2a5360eea261cd5bf99f0cf90d31c8e9d4637d6
    source_path: channels/telegram.md
    workflow: 16
---

Productieklaar voor bot-DM's en groepen via grammY. Long polling is de standaardmodus; Webhook-modus is optioneel.

<CardGroup cols={3}>
  <Card title="Koppelen" icon="link" href="/nl/channels/pairing">
    Het standaard-DM-beleid voor Telegram is koppelen.
  </Card>
  <Card title="Probleemoplossing voor kanalen" icon="wrench" href="/nl/channels/troubleshooting">
    Kanaaloverstijgende diagnostiek en herstelplaybooks.
  </Card>
  <Card title="Gateway-configuratie" icon="settings" href="/nl/gateway/configuration">
    Volledige configuratiepatronen en voorbeelden voor kanalen.
  </Card>
</CardGroup>

## Snelle installatie

<Steps>
  <Step title="Maak het bottoken in BotFather">
    Open Telegram en chat met **@BotFather** (controleer dat de handle exact `@BotFather` is).

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
    Telegram gebruikt **niet** `openclaw channels login telegram`; configureer het token in config/env en start daarna Gateway.

  </Step>

  <Step title="Start Gateway en keur de eerste DM goed">

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

    Negatieve Telegram-supergroep-ID's die beginnen met `-100` zijn groepschat-ID's. Plaats ze onder `channels.telegram.groups`, niet onder `groupAllowFrom`.

  </Step>
</Steps>

<Note>
De volgorde voor tokenresolutie is accountbewust. In de praktijk winnen configwaarden van de env-fallback en geldt `TELEGRAM_BOT_TOKEN` alleen voor het standaardaccount.
Na een succesvolle start cachet OpenClaw de botidentiteit maximaal 24 uur in de state-map, zodat herstarts een extra Telegram `getMe`-aanroep kunnen vermijden; het wijzigen of verwijderen van het token wist die cache.
</Note>

## Instellingen aan Telegram-zijde

<AccordionGroup>
  <Accordion title="Privacymodus en groepszichtbaarheid">
    Telegram-bots gebruiken standaard **Privacy Mode**, waardoor wordt beperkt welke groepsberichten ze ontvangen.

    Als de bot alle groepsberichten moet zien, doe dan een van beide:

    - schakel privacymodus uit via `/setprivacy`, of
    - maak de bot groepsbeheerder.

    Verwijder de bot uit elke groep en voeg hem opnieuw toe wanneer je privacymodus omschakelt, zodat Telegram de wijziging toepast.

  </Accordion>

  <Accordion title="Groepsrechten">
    Beheerdersstatus wordt geregeld in de Telegram-groepsinstellingen.

    Beheerderbots ontvangen alle groepsberichten, wat nuttig is voor altijd actief groepsgedrag.

  </Accordion>

  <Accordion title="Handige BotFather-schakelaars">

    - `/setjoingroups` om toevoegen aan groepen toe te staan of te weigeren
    - `/setprivacy` voor groepszichtbaarheidsgedrag

  </Accordion>
</AccordionGroup>

## Toegangscontrole en activering

### Botidentiteit in groepen

In Telegram-groepen en forumtopics wordt een expliciete vermelding van de geconfigureerde bothandle (bijvoorbeeld `@my_bot`) behandeld als adressering van de geselecteerde OpenClaw-agent, zelfs wanneer de agentpersonanaam verschilt van de Telegram-gebruikersnaam. Het stilhoudbeleid voor groepen blijft van toepassing op niet-gerelateerd groepsverkeer, maar de bothandle zelf wordt niet gezien als "iemand anders."

<Tabs>
  <Tab title="DM-beleid">
    `channels.telegram.dmPolicy` beheert toegang via directe berichten:

    - `pairing` (standaard)
    - `allowlist` (vereist ten minste één afzender-ID in `allowFrom`)
    - `open` (vereist dat `allowFrom` `"*"` bevat)
    - `disabled`

    `dmPolicy: "open"` met `allowFrom: ["*"]` laat elk Telegram-account dat de botgebruikersnaam vindt of raadt de bot opdrachten geven. Gebruik dit alleen voor bewust openbare bots met strikt beperkte tools; bots met één eigenaar moeten `allowlist` gebruiken met numerieke gebruikers-ID's.

    `channels.telegram.allowFrom` accepteert numerieke Telegram-gebruikers-ID's. `telegram:`- / `tg:`-prefixen worden geaccepteerd en genormaliseerd.
    In multi-accountconfiguraties wordt een beperkende `channels.telegram.allowFrom` op topniveau behandeld als veiligheidsgrens: accountniveauvermeldingen `allowFrom: ["*"]` maken dat account niet openbaar, tenzij de effectieve accountallowlist na samenvoegen nog steeds een expliciete wildcard bevat.
    `dmPolicy: "allowlist"` met lege `allowFrom` blokkeert alle DM's en wordt afgewezen door configvalidatie.
    Setup vraagt alleen om numerieke gebruikers-ID's.
    Als je hebt geüpgraded en je config `@username`-allowlistvermeldingen bevat, voer dan `openclaw doctor --fix` uit om ze op te lossen (best-effort; vereist een Telegram-bottoken).
    Als je eerder vertrouwde op allowlist-bestanden uit de pairing-store, kan `openclaw doctor --fix` vermeldingen herstellen naar `channels.telegram.allowFrom` in allowlist-flows (bijvoorbeeld wanneer `dmPolicy: "allowlist"` nog geen expliciete ID's heeft).

    Voor bots met één eigenaar heeft `dmPolicy: "allowlist"` met expliciete numerieke `allowFrom`-ID's de voorkeur om toegangsbeleid duurzaam in config vast te leggen (in plaats van afhankelijk te zijn van eerdere koppelgoedkeuringen).

    Veelvoorkomende verwarring: goedkeuring van DM-koppeling betekent niet "deze afzender is overal gemachtigd".
    Koppelen verleent DM-toegang. Als er nog geen opdrachteigenaar bestaat, stelt de eerste goedgekeurde koppeling ook `commands.ownerAllowFrom` in, zodat eigenaar-only opdrachten en exec-goedkeuringen een expliciet operatoraccount hebben.
    Autorisatie van afzenders in groepen komt nog steeds uit expliciete configallowlists.
    Als je wilt "ik ben eenmaal gemachtigd en zowel DM's als groepsopdrachten werken", zet dan je numerieke Telegram-gebruikers-ID in `channels.telegram.allowFrom`; zorg er voor eigenaar-only opdrachten voor dat `commands.ownerAllowFrom` `telegram:<your user id>` bevat.

    ### Je Telegram-gebruikers-ID vinden

    Veiliger (geen bot van derden):

    1. DM je bot.
    2. Voer `openclaw logs --follow` uit.
    3. Lees `from.id`.

    Officiële Bot API-methode:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Methode van derden (minder privé): `@userinfobot` of `@getidsbot`.

  </Tab>

  <Tab title="Groepsbeleid en allowlists">
    Twee controles gelden samen:

    1. **Welke groepen zijn toegestaan** (`channels.telegram.groups`)
       - geen `groups`-config:
         - met `groupPolicy: "open"`: elke groep kan groeps-ID-controles doorstaan
         - met `groupPolicy: "allowlist"` (standaard): groepen worden geblokkeerd totdat je `groups`-vermeldingen (of `"*"`) toevoegt
       - `groups` geconfigureerd: werkt als allowlist (expliciete ID's of `"*"`)

    2. **Welke afzenders zijn toegestaan in groepen** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (standaard)
       - `disabled`

    `groupAllowFrom` wordt gebruikt voor afzenderfiltering in groepen. Als dit niet is ingesteld, valt Telegram terug op `allowFrom`.
    `groupAllowFrom`-vermeldingen moeten numerieke Telegram-gebruikers-ID's zijn (`telegram:`- / `tg:`-prefixen worden genormaliseerd).
    Plaats geen Telegram-groeps- of supergroepschat-ID's in `groupAllowFrom`. Negatieve chat-ID's horen onder `channels.telegram.groups`.
    Niet-numerieke vermeldingen worden genegeerd voor afzenderautorisatie.
    Veiligheidsgrens (`2026.2.25+`): groepsafzenderauth neemt **geen** goedkeuringen uit de DM-pairing-store over.
    Koppelen blijft alleen voor DM's. Stel voor groepen `groupAllowFrom` of per-groep/per-topic `allowFrom` in.
    Als `groupAllowFrom` niet is ingesteld, valt Telegram terug op config `allowFrom`, niet op de pairing-store.
    Praktisch patroon voor bots met één eigenaar: stel je gebruikers-ID in `channels.telegram.allowFrom` in, laat `groupAllowFrom` leeg en sta de doelgroepen toe onder `channels.telegram.groups`.
    Runtime-opmerking: als `channels.telegram` volledig ontbreekt, gebruikt runtime standaard fail-closed `groupPolicy="allowlist"`, tenzij `channels.defaults.groupPolicy` expliciet is ingesteld.

    Groepssetup voor alleen de eigenaar:

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

    Test dit vanuit de groep met `@<bot_username> ping`. Gewone groepsberichten activeren de bot niet zolang `requireMention: true`.

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
      Veelvoorkomende fout: `groupAllowFrom` is geen Telegram-groepsallowlist.

      - Plaats negatieve Telegram-groeps- of supergroepschat-ID's zoals `-1001234567890` onder `channels.telegram.groups`.
      - Plaats Telegram-gebruikers-ID's zoals `8734062810` onder `groupAllowFrom` wanneer je wilt beperken welke mensen binnen een toegestane groep de bot kunnen activeren.
      - Gebruik `groupAllowFrom: ["*"]` alleen wanneer je wilt dat elk lid van een toegestane groep met de bot kan praten.

    </Warning>

  </Tab>

  <Tab title="Vermeldingsgedrag">
    Groepsantwoorden vereisen standaard een vermelding.

    Een vermelding kan komen van:

    - native `@botusername`-vermelding, of
    - vermeldingspatronen in:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Opdrachtschakelaars op sessieniveau:

    - `/activation always`
    - `/activation mention`

    Deze werken alleen sessiestatus bij. Gebruik config voor persistentie.

    Voorbeeld van persistente config:

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

    Groepsgeschiedeniscontext staat standaard op `mention-only`: eerdere groepsberichten worden
    alleen opgenomen wanneer ze aan de bot waren gericht, antwoorden op de bot zijn,
    of eigen berichten van de bot zijn. Stel `includeGroupHistoryContext: "recent"` in om
    recente kamergeschiedenis voor vertrouwde groepen op te nemen. Stel
    `includeGroupHistoryContext: "none"` in om geen eerdere Telegram-groepsgeschiedenis
    met de volgende beurt mee te sturen.

```json5
{
  channels: {
    telegram: {
      includeGroupHistoryContext: "recent",
    },
  },
}
```

    De groepschat-ID ophalen:

    - stuur een groepsbericht door naar `@userinfobot` / `@getidsbot`
    - of lees `chat.id` uit `openclaw logs --follow`
    - of inspecteer Bot API `getUpdates`
    - nadat de groep is toegestaan, voer `/whoami@<bot_username>` uit als native opdrachten zijn ingeschakeld

  </Tab>
</Tabs>

## Runtime-gedrag

- Telegram is eigendom van het Gateway-proces.
- Routering is deterministisch: inkomende Telegram-berichten worden teruggestuurd naar Telegram (het model kiest geen kanalen).
- Inkomende berichten worden genormaliseerd naar de gedeelde kanaalenvelop met antwoordmetadata, mediaplaatshouders en blijvend opgeslagen context van antwoordketens voor Telegram-antwoorden die de Gateway heeft waargenomen.
- Groepssessies worden geïsoleerd op groeps-ID. Forumonderwerpen voegen `:topic:<threadId>` toe om onderwerpen geïsoleerd te houden.
- DM-berichten kunnen `message_thread_id` bevatten; OpenClaw behoudt dit voor antwoorden. DM-onderwerpsessies splitsen alleen wanneer Telegram `getMe` `has_topics_enabled: true` voor de bot meldt; anders blijven DM's in de vlakke sessie.
- Long polling gebruikt de grammY-runner met volgordebepaling per chat/per thread. De algehele sink-concurrency van de runner gebruikt `agents.defaults.maxConcurrent`.
- Opstarten met meerdere accounts begrenst gelijktijdige Telegram-`getMe`-probes, zodat grote botvloten niet alle accountprobes tegelijk uitwaaieren.
- Long polling wordt binnen elk Gateway-proces bewaakt, zodat slechts één actieve poller tegelijk een bottoken kan gebruiken. Als je nog steeds `getUpdates` 409-conflicten ziet, gebruikt waarschijnlijk een andere OpenClaw-Gateway, script of externe poller hetzelfde token.
- Herstarts van de long-polling-watchdog worden standaard geactiveerd na 120 seconden zonder voltooide `getUpdates`-liveness. Verhoog `channels.telegram.pollingStallThresholdMs` alleen als je implementatie nog steeds valse polling-stall-herstarts ziet tijdens langlopende taken. De waarde is in milliseconden en is toegestaan van `30000` tot `600000`; overrides per account worden ondersteund.
- Telegram Bot API heeft geen ondersteuning voor leesbevestigingen (`sendReadReceipts` is niet van toepassing).

<Note>
  `channels.telegram.dm.threadReplies` en `channels.telegram.direct.<chatId>.threadReplies` zijn verwijderd. Voer `openclaw doctor --fix` uit na het upgraden als je configuratie die sleutels nog bevat. DM-onderwerproutering volgt nu de botcapaciteit van Telegram `getMe.has_topics_enabled`, die wordt beheerd door BotFather-threaded mode: bots met ingeschakelde onderwerpen gebruiken thread-gescopete DM-sessies wanneer Telegram `message_thread_id` verzendt; andere DM's blijven in de vlakke sessie.
</Note>

## Functiereferentie

<AccordionGroup>
  <Accordion title="Livestreamvoorbeeld (berichtbewerkingen)">
    OpenClaw kan gedeeltelijke antwoorden in realtime streamen:

    - directe chats: voorbeeldbericht + `editMessageText`
    - groepen/onderwerpen: voorbeeldbericht + `editMessageText`

    Vereiste:

    - `channels.telegram.streaming` is `off | partial | block | progress` (standaard: `partial`)
    - korte initiële antwoordvoorbeelden worden gedebounced en daarna na een begrensde vertraging gematerialiseerd als de run nog actief is
    - `progress` behoudt één bewerkbaar statusconcept voor toolvoortgang, toont het stabiele statuslabel wanneer antwoordactiviteit binnenkomt vóór toolvoortgang, wist het bij voltooiing en verzendt het definitieve antwoord als een normaal bericht
    - `streaming.preview.toolProgress` bepaalt of tool-/voortgangsupdates hetzelfde bewerkte voorbeeldbericht hergebruiken (standaard: `true` wanneer voorbeeldstreaming actief is)
    - `streaming.preview.commandText` bepaalt opdracht-/exec-details binnen die toolvoortgangsregels: `raw` (standaard, behoudt uitgebracht gedrag) of `status` (alleen toollabel)
    - `streaming.progress.commentary` (standaard: `false`) kiest voor assistentcommentaar/-inleidingstekst in het tijdelijke voortgangsconcept
    - legacy `channels.telegram.streamMode`, booleaanse `streaming`-waarden en buiten gebruik gestelde native voorbeeldconceptsleutels worden gedetecteerd; voer `openclaw doctor --fix` uit om ze te migreren naar de huidige streamingconfiguratie

    Voorbeeldupdates voor toolvoortgang zijn de korte statusregels die worden getoond terwijl tools draaien, bijvoorbeeld opdrachtuitvoering, bestandslezingen, planningsupdates, patchsamenvattingen of Codex-inleiding/commentaartekst in Codex app-servermodus. Telegram houdt deze standaard ingeschakeld om overeen te komen met uitgebracht OpenClaw-gedrag vanaf `v2026.4.22` en later.

    Stel het volgende in om het bewerkte voorbeeld voor antwoordtekst te behouden maar toolvoortgangsregels te verbergen:

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

    Stel het volgende in om toolvoortgang zichtbaar te houden maar opdracht-/exec-tekst te verbergen:

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

    Gebruik de modus `progress` wanneer je zichtbare toolvoortgang wilt zonder het definitieve antwoord in datzelfde bericht te bewerken. Plaats het opdrachttekstbeleid onder `streaming.progress`:

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

    Gebruik `streaming.mode: "off"` alleen wanneer je uitsluitend definitieve levering wilt: Telegram-voorbeeldbewerkingen worden uitgeschakeld en generieke tool-/voortgangspraat wordt onderdrukt in plaats van als zelfstandige statusberichten te worden verzonden. Goedkeuringsprompts, mediapayloads en fouten worden nog steeds via normale definitieve levering gerouteerd. Gebruik `streaming.preview.toolProgress: false` wanneer je alleen antwoordvoorbeeldbewerkingen wilt behouden terwijl je de statusregels voor toolvoortgang verbergt.

    <Note>
      Geselecteerde citaatantwoorden van Telegram zijn de uitzondering. Wanneer `replyToMode` `"first"`, `"all"` of `"batched"` is en het inkomende bericht geselecteerde citaattekst bevat, verzendt OpenClaw het definitieve antwoord via het native citaatantwoordpad van Telegram in plaats van het antwoordvoorbeeld te bewerken, zodat `streaming.preview.toolProgress` de korte statusregels voor die beurt niet kan tonen. Antwoorden op het huidige bericht zonder geselecteerde citaattekst behouden nog steeds voorbeeldstreaming. Stel `replyToMode: "off"` in wanneer zichtbaarheid van toolvoortgang belangrijker is dan native citaatantwoorden, of stel `streaming.preview.toolProgress: false` in om de afweging te erkennen.
    </Note>

    Voor antwoorden met alleen tekst:

    - korte DM-/groeps-/onderwerpvoorbeelden: OpenClaw behoudt hetzelfde voorbeeldbericht en voert de definitieve bewerking ter plekke uit
    - lange definitieve teksten die in meerdere Telegram-berichten worden gesplitst, hergebruiken waar mogelijk het bestaande voorbeeld als het eerste definitieve deel en verzenden daarna alleen de resterende delen
    - definitieve antwoorden in progress-modus wissen het statusconcept en gebruiken normale definitieve levering in plaats van het concept naar het antwoord te bewerken
    - als de definitieve bewerking mislukt voordat de voltooide tekst is bevestigd, gebruikt OpenClaw normale definitieve levering en ruimt het het verouderde voorbeeld op

    Voor complexe antwoorden (bijvoorbeeld mediapayloads) valt OpenClaw terug op normale definitieve levering en ruimt daarna het voorbeeldbericht op.

    Voorbeeldstreaming staat los van blokstreaming. Wanneer blokstreaming expliciet is ingeschakeld voor Telegram, slaat OpenClaw de voorbeeldstream over om dubbel streamen te voorkomen.

    Gedrag van redeneringsstream:

    - `/reasoning stream` gebruikt het redeneringsvoorbeeldpad van een ondersteund kanaal; op Telegram streamt het redenering naar het livevoorbeeld tijdens het genereren
    - het redeneringsvoorbeeld wordt verwijderd na definitieve levering; gebruik `/reasoning on` wanneer redenering zichtbaar moet blijven
    - definitief antwoord wordt verzonden zonder redeneringstekst

  </Accordion>

  <Accordion title="Rijke berichtopmaak">
    Uitgaande tekst gebruikt standaard Telegram HTML-berichten, zodat antwoorden leesbaar blijven in huidige Telegram-clients. Deze compatibiliteitsmodus ondersteunt normale vetgedrukte tekst, cursief, links, code, spoilers en citaten, maar niet rich-only-blokken van Bot API 10.1 zoals native tabellen, details, rich media en formules.

    Stel `channels.telegram.richMessages: true` in om je aan te melden voor rijke berichten van Bot API 10.1:

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
    - Markdown-tekst wordt via OpenClaw's Markdown IR gerenderd en verzonden als rijke Telegram HTML.
    - Expliciete rijke HTML-payloads behouden ondersteunde Bot API 10.1-tags zoals koppen, tabellen, details, rich media en formules.
    - Mediabijschriften gebruiken nog steeds Telegram HTML-bijschriften, omdat rijke berichten bijschriften niet vervangen.

    Dit houdt modeltekst weg van Telegram Rich Markdown-sigils, zodat valuta zoals `$400-600K` niet als wiskunde wordt geparseerd. Lange rijke tekst wordt automatisch gesplitst over de limieten voor rijke tekst en rijke blokken van Telegram. Tabellen boven de kolomlimiet van Telegram worden als codeblokken verzonden.

    Standaard: uit voor clientcompatibiliteit. Rijke berichten vereisen compatibele Telegram-clients; sommige huidige Desktop-, Web-, Android- en externe clients tonen geaccepteerde rijke berichten als niet ondersteund. Houd deze optie uitgeschakeld tenzij elke client die met de bot wordt gebruikt ze kan renderen. `/status` toont of rijke berichten voor de huidige Telegram-sessie aan of uit staan.

    Linkvoorbeelden zijn standaard ingeschakeld. `channels.telegram.linkPreview: false` slaat automatische entiteitsdetectie voor rijke tekst over.

  </Accordion>

  <Accordion title="Native opdrachten en aangepaste opdrachten">
    Registratie van het Telegram-opdrachtmenu wordt bij het opstarten afgehandeld met `setMyCommands`.

    Standaarden voor native opdrachten:

    - `commands.native: "auto"` schakelt native opdrachten voor Telegram in

    Voeg aangepaste opdrachtmenu-items toe:

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

    - namen worden genormaliseerd (voorloop-`/` verwijderen, lowercase)
    - geldig patroon: `a-z`, `0-9`, `_`, lengte `1..32`
    - aangepaste opdrachten kunnen native opdrachten niet overschrijven
    - conflicten/duplicaten worden overgeslagen en gelogd

    Opmerkingen:

    - aangepaste opdrachten zijn alleen menu-items; ze implementeren niet automatisch gedrag
    - Plugin-/Skill-opdrachten kunnen nog steeds werken wanneer ze worden getypt, zelfs als ze niet in het Telegram-menu worden getoond

    Als native opdrachten zijn uitgeschakeld, worden ingebouwde opdrachten verwijderd. Aangepaste/Plugin-opdrachten kunnen nog steeds registreren als ze zijn geconfigureerd.

    Veelvoorkomende installatiefouten:

    - `setMyCommands failed` met `BOT_COMMANDS_TOO_MUCH` betekent dat het Telegram-menu nog steeds overliep na inkorten; verminder Plugin-/Skill-/aangepaste opdrachten of schakel `channels.telegram.commands.native` uit.
    - `deleteWebhook`, `deleteMyCommands` of `setMyCommands` die mislukt met `404: Not Found` terwijl directe Bot API-curlopdrachten werken, kan betekenen dat `channels.telegram.apiRoot` was ingesteld op het volledige `/bot<TOKEN>`-endpoint. `apiRoot` moet alleen de Bot API-root zijn, en `openclaw doctor --fix` verwijdert een per ongeluk toegevoegde afsluitende `/bot<TOKEN>`.
    - `getMe returned 401` betekent dat Telegram het geconfigureerde bottoken heeft geweigerd. Werk `botToken`, `tokenFile` of `TELEGRAM_BOT_TOKEN` bij met het huidige BotFather-token; OpenClaw stopt vóór polling, zodat dit niet wordt gerapporteerd als een webhook-opruimingsfout.
    - `setMyCommands failed` met netwerk-/fetchfouten betekent meestal dat uitgaande DNS/HTTPS naar `api.telegram.org` wordt geblokkeerd.

    ### Opdrachten voor apparaatkoppeling (`device-pair`-Plugin)

    Wanneer de `device-pair`-Plugin is geïnstalleerd:

    1. `/pair` genereert installatiecode
    2. plak code in iOS-app
    3. `/pair pending` geeft openstaande verzoeken weer (inclusief rol/scopes)
    4. keur het verzoek goed:
       - `/pair approve <requestId>` voor expliciete goedkeuring
       - `/pair approve` wanneer er slechts één openstaand verzoek is
       - `/pair approve latest` voor meest recente

    De installatiecode bevat een kortlevend bootstraptoken. Ingebouwde bootstrap met installatiecode is alleen node: de eerste verbinding maakt een openstaand node-verzoek aan, en na goedkeuring retourneert de Gateway een duurzaam node-token met `scopes: []`. Het retourneert geen overgedragen operator-token; operatortoegang vereist een afzonderlijk goedgekeurde operatorkoppeling of tokenflow.

    Als een apparaat opnieuw probeert met gewijzigde authenticatiedetails (bijvoorbeeld rol/scopes/openbare sleutel), wordt het vorige openstaande verzoek vervangen en gebruikt het nieuwe verzoek een andere `requestId`. Voer `/pair pending` opnieuw uit vóór goedkeuring.

    Meer details: [Koppelen](/nl/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="Inline knoppen">
    Configureer het bereik van het inline toetsenbord:

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

    Override per account:

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

    Verouderde `capabilities: ["inlineButtons"]` wordt gekoppeld aan `inlineButtons: "all"`.

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

    Callback-klikken worden als tekst doorgegeven aan de agent:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Telegram-berichtacties voor agents en automatisering">
    Telegram-toolacties omvatten:

    - `sendMessage` (`to`, `content`, optioneel `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content` of `caption`, optionele inline knoppen voor `presentation`; bewerkingen met alleen knoppen werken reply markup bij)
    - `createForumTopic` (`chatId`, `name`, optioneel `iconColor`, `iconCustomEmojiId`)

    Kanaalberichtacties bieden ergonomische aliassen (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Gating-besturingen:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (standaard: uitgeschakeld)

    Opmerking: `edit` en `topic-create` zijn momenteel standaard ingeschakeld en hebben geen aparte `channels.telegram.actions.*`-schakelaars.
    Runtime-verzendingen gebruiken de actieve config-/secrets-snapshot (opstarten/herladen), dus actiepaden voeren geen ad-hoc SecretRef-herresolutie per verzending uit.

    Semantiek voor het verwijderen van reacties: [/tools/reactions](/nl/tools/reactions)

  </Accordion>

  <Accordion title="Reply-threadingtags">
    Telegram ondersteunt expliciete reply-threadingtags in gegenereerde uitvoer:

    - `[[reply_to_current]]` antwoordt op het activerende bericht
    - `[[reply_to:<id>]]` antwoordt op een specifieke Telegram-bericht-ID

    `channels.telegram.replyToMode` bepaalt de afhandeling:

    - `off` (standaard)
    - `first`
    - `all`

    Wanneer reply-threading is ingeschakeld en de oorspronkelijke Telegram-tekst of het bijschrift beschikbaar is, neemt OpenClaw automatisch een native Telegram-citaatfragment op. Telegram beperkt native citaattekst tot 1024 UTF-16-code-eenheden, dus langere berichten worden vanaf het begin geciteerd en vallen terug op een gewone reply als Telegram het citaat weigert.

    Opmerking: `off` schakelt impliciete reply-threading uit. Expliciete `[[reply_to_*]]`-tags worden nog steeds gerespecteerd.

  </Accordion>

  <Accordion title="Forumonderwerpen en threadgedrag">
    Forum-supergroepen:

    - sessiesleutels voor onderwerpen voegen `:topic:<threadId>` toe
    - replies en typen richten zich op de onderwerpthread
    - configpad voor onderwerpen:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Speciaal geval voor algemeen onderwerp (`threadId=1`):

    - berichtverzendingen laten `message_thread_id` weg (Telegram weigert `sendMessage(...thread_id=1)`)
    - typacties bevatten nog steeds `message_thread_id`

    Overerving van onderwerpen: onderwerpitems erven groepsinstellingen tenzij ze worden overschreven (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` is alleen voor onderwerpen en erft niet van groepsstandaarden.
    `topics."*"` stelt standaarden in voor elk onderwerp in die groep; exacte onderwerp-ID's krijgen nog steeds voorrang op `"*"`.

    **Agentroutering per onderwerp**: Elk onderwerp kan naar een andere agent routeren door `agentId` in de onderwerpconfig in te stellen. Hierdoor krijgt elk onderwerp een eigen geïsoleerde werkruimte, geheugen en sessie. Voorbeeld:

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

    Elk onderwerp heeft vervolgens een eigen sessiesleutel: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Persistente ACP-onderwerpbinding**: Forumonderwerpen kunnen ACP-harnesssessies vastzetten via typed ACP-bindingen op topniveau (`bindings[]` met `type: "acp"` en `match.channel: "telegram"`, `peer.kind: "group"`, en een onderwerpgekwalificeerde id zoals `-1001234567890:topic:42`). Momenteel beperkt tot forumonderwerpen in groepen/supergroepen. Zie [ACP Agents](/nl/tools/acp-agents).

    **Thread-gebonden ACP-spawn vanuit chat**: `/acp spawn <agent> --thread here|auto` bindt het huidige onderwerp aan een nieuwe ACP-sessie; vervolgberichten worden daar rechtstreeks naartoe gerouteerd. OpenClaw zet de spawnbevestiging vast in het onderwerp. Vereist dat `channels.telegram.threadBindings.spawnSessions` ingeschakeld blijft (standaard: `true`).

    Templatecontext biedt `MessageThreadId` en `IsForum`. DM-chats met `message_thread_id` behouden reply-metadata; ze gebruiken alleen threadbewuste sessiesleutels wanneer Telegram `getMe` voor de bot `has_topics_enabled: true` rapporteert.
    De eerdere overrides `dm.threadReplies` en `direct.*.threadReplies` zijn bewust verwijderd; gebruik de threaded mode van BotFather als de enige bron van waarheid en voer `openclaw doctor --fix` uit om verouderde configkeys te verwijderen.

  </Accordion>

  <Accordion title="Audio, video en stickers">
    ### Audioberichten

    Telegram maakt onderscheid tussen spraaknotities en audiobestanden.

    - standaard: gedrag voor audiobestanden
    - tag `[[audio_as_voice]]` in agentreply om verzending als spraaknotitie af te dwingen
    - binnenkomende transcripties van spraaknotities worden in de agentcontext ingekaderd als machinaal gegenereerde,
      niet-vertrouwde tekst; vermeldingsdetectie gebruikt nog steeds de ruwe
      transcriptie, zodat door vermeldingen gated spraakberichten blijven werken.

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

    Voorbeeld van een berichtactie:

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

    Afhandeling van inkomende stickers:

    - statische WEBP: gedownload en verwerkt (placeholder `<media:sticker>`)
    - geanimeerde TGS: overgeslagen
    - video WEBM: overgeslagen

    Contextvelden voor stickers:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    Stickerbeschrijvingen worden gecachet in de OpenClaw SQLite-Plugin-status om herhaalde vision-aanroepen te verminderen.

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

    Gecachte stickers zoeken:

```json5
{
  action: "sticker-search",
  channel: "telegram",
  query: "cat waving",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="Reaction notifications">
    Telegram-reacties komen binnen als `message_reaction`-updates (los van berichtpayloads).

    Wanneer ingeschakeld, zet OpenClaw systeemgebeurtenissen in de wachtrij, zoals:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Configuratie:

    - `channels.telegram.reactionNotifications`: `off | own | all` (standaard: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (standaard: `minimal`)

    Opmerkingen:

    - `own` betekent alleen gebruikersreacties op door de bot verzonden berichten (best effort via de cache voor verzonden berichten).
    - Reactiegebeurtenissen respecteren nog steeds de toegangscontroles van Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); onbevoegde afzenders worden genegeerd.
    - Telegram levert geen thread-ID's in reactie-updates.
      - niet-forumgroepen routeren naar de groepschatsessie
      - forumgroepen routeren naar de algemene-onderwerpsessie van de groep (`:topic:1`), niet naar het exacte oorspronkelijke onderwerp

    `allowed_updates` voor polling/webhook bevat automatisch `message_reaction`.

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction` verzendt een bevestigingsemoji terwijl OpenClaw een inkomend bericht verwerkt. `ackReactionScope` bepaalt *wanneer* die emoji daadwerkelijk wordt verzonden.

    **Volgorde voor het bepalen van emoji (`ackReaction`):**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - fallback naar emoji van agentidentiteit (`agents.list[].identity.emoji`, anders "👀")

    Opmerkingen:

    - Telegram verwacht unicode-emoji (bijvoorbeeld "👀").
    - Gebruik `""` om de reactie voor een kanaal of account uit te schakelen.

    **Bereik (`messages.ackReactionScope`):**

    De Telegram-provider leest het bereik uit `messages.ackReactionScope` (standaard `"group-mentions"`). Er is momenteel geen override op Telegram-accountniveau of Telegram-kanaalniveau.

    Waarden: `"all"` (DM's + groepen), `"direct"` (alleen DM's), `"group-all"` (elk groepsbericht, geen DM's), `"group-mentions"` (groepen wanneer de bot wordt genoemd; **geen DM's** — dit is de standaard), `"off"` / `"none"` (uitgeschakeld).

    <Note>
    Het standaardbereik (`"group-mentions"`) activeert geen bevestigingsreacties in directe berichten. Stel `messages.ackReactionScope` in op `"direct"` of `"all"` om een bevestigingsreactie te krijgen op inkomende Telegram-DM's. De waarde wordt gelezen bij het opstarten van de Telegram-provider, dus een gateway-herstart is nodig voordat de wijziging van kracht wordt.
    </Note>

  </Accordion>

  <Accordion title="Config writes from Telegram events and commands">
    Schrijfbewerkingen naar kanaalconfiguratie zijn standaard ingeschakeld (`configWrites !== false`).

    Door Telegram geactiveerde schrijfbewerkingen omvatten:

    - groepsmigratiegebeurtenissen (`migrate_to_chat_id`) om `channels.telegram.groups` bij te werken
    - `/config set` en `/config unset` (vereist dat opdrachten zijn ingeschakeld)

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

  <Accordion title="Long polling vs webhook">
    De standaard is long polling. Stel voor webhookmodus `channels.telegram.webhookUrl` en `channels.telegram.webhookSecret` in; optioneel `webhookPath`, `webhookHost`, `webhookPort` (standaardwaarden `/telegram-webhook`, `127.0.0.1`, `8787`).

    In long-pollingmodus bewaart OpenClaw zijn herstart-watermark pas nadat een update succesvol is gedispatcht. Als een handler mislukt, blijft die update opnieuw te proberen in hetzelfde proces en wordt deze niet als voltooid weggeschreven voor herstart-dedupe.

    De lokale listener bindt aan `127.0.0.1:8787`. Plaats voor publieke ingress een reverse proxy voor de lokale poort of stel bewust `webhookHost: "0.0.0.0"` in.

    Webhookmodus valideert request guards, het geheime Telegram-token en de JSON-body voordat `200` aan Telegram wordt geretourneerd.
    OpenClaw verwerkt de update daarna asynchroon via dezelfde botlanes per chat/per onderwerp die long polling gebruikt, zodat trage agentbeurten de bezorgings-ACK van Telegram niet vasthouden.

  </Accordion>

  <Accordion title="Limits, retry, and CLI targets">
    - Standaard is `channels.telegram.textChunkLimit` 4000.
    - `channels.telegram.chunkMode="newline"` geeft de voorkeur aan alineagrenzen (lege regels) voordat op lengte wordt gesplitst.
    - `channels.telegram.mediaMaxMb` (standaard 100) begrenst de inkomende en uitgaande Telegram-mediagrootte.
    - `channels.telegram.mediaGroupFlushMs` (standaard 500) bepaalt hoelang Telegram-albums/mediagroepen worden gebufferd voordat OpenClaw ze als één inkomend bericht verzendt. Verhoog dit als albumdelen laat binnenkomen; verlaag dit om de antwoordlatentie voor albums te verminderen.
    - `channels.telegram.timeoutSeconds` overschrijft de time-out van de Telegram API-client (als dit niet is ingesteld, geldt de standaard van grammY). Botclients klemmen geconfigureerde waarden onder de 60-secondenbewaking voor uitgaande tekst-/typverzoeken, zodat grammY de zichtbare antwoordbezorging niet afbreekt voordat de transportbewaking en fallback van OpenClaw kunnen uitvoeren. Long polling gebruikt nog steeds een 45-secondenbewaking voor `getUpdates`-verzoeken, zodat inactieve polls niet onbeperkt worden verlaten.
    - `channels.telegram.pollingStallThresholdMs` is standaard `120000`; stel dit alleen af tussen `30000` en `600000` voor fout-positieve herstarts door vastgelopen polling.
    - groepscontexthistorie gebruikt `channels.telegram.historyLimit` of `messages.groupChat.historyLimit` (standaard 50); `0` schakelt dit uit.
    - aanvullende context voor antwoorden/citaten/doorsturen wordt genormaliseerd naar één geselecteerd gesprekscontextvenster wanneer de Gateway de bovenliggende berichten heeft gezien; de cache met waargenomen berichten bevindt zich in de OpenClaw SQLite-Pluginstatus, en `openclaw doctor --fix` importeert verouderde sidecars. Telegram neemt slechts één oppervlakkige `reply_to_message` op in updates, dus ketens ouder dan de cache zijn beperkt tot de huidige update-payload van Telegram.
    - Telegram-allowlists bepalen vooral wie de agent mag activeren, niet een volledige grens voor redactie van aanvullende context.
    - Beheer van DM-historie:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - De configuratie `channels.telegram.retry` is van toepassing op Telegram-verzendhelpers (CLI/tools/acties) voor herstelbare uitgaande API-fouten. Inkomende bezorging van eindantwoorden gebruikt ook een begrensde veilige verzendretry voor Telegram-fouten vóór verbinding, maar probeert geen dubbelzinnige netwerk-enveloppen na verzending opnieuw die zichtbare berichten kunnen dupliceren.

    CLI- en berichttoolverzenddoelen kunnen een numerieke chat-ID, gebruikersnaam of forumonderwerpdoel zijn:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
```

    Telegram-polls gebruiken `openclaw message poll` en ondersteunen forumonderwerpen:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Alleen-Telegram-pollvlaggen:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` voor forumonderwerpen (of gebruik een `:topic:`-doel)

    Telegram-verzenden ondersteunt ook:

    - `--presentation` met `buttons`-blokken voor inline toetsenborden wanneer `channels.telegram.capabilities.inlineButtons` dit toestaat
    - `--pin` of `--delivery '{"pin":true}'` om vastgezette bezorging aan te vragen wanneer de bot in die chat kan vastzetten
    - `--force-document` om uitgaande afbeeldingen, GIF's en video's als documenten te verzenden in plaats van als gecomprimeerde foto-, geanimeerde-media- of videouploads

    Actiebeperking:

    - `channels.telegram.actions.sendMessage=false` schakelt uitgaande Telegram-berichten uit, inclusief polls
    - `channels.telegram.actions.poll=false` schakelt het maken van Telegram-polls uit terwijl reguliere verzending ingeschakeld blijft

  </Accordion>

  <Accordion title="Exec approvals in Telegram">
    Telegram ondersteunt exec-goedkeuringen in goedkeurders-DM's en kan optioneel prompts plaatsen in de oorspronkelijke chat of het oorspronkelijke onderwerp. Goedkeurders moeten numerieke Telegram-gebruikers-ID's zijn.

    Configuratiepad:

    - `channels.telegram.execApprovals.enabled` (wordt automatisch ingeschakeld wanneer ten minste één goedkeurder oplosbaar is)
    - `channels.telegram.execApprovals.approvers` (valt terug op numerieke eigenaars-ID's uit `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (standaard) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` en `defaultTo` bepalen wie met de bot kan praten en waar deze normale antwoorden verzendt. Ze maken iemand geen exec-goedkeurder. De eerste goedgekeurde DM-koppeling bootstrapt `commands.ownerAllowFrom` wanneer er nog geen opdrachteigenaar bestaat, zodat de opzet met één eigenaar nog steeds werkt zonder ID's onder `execApprovals.approvers` te dupliceren.

    Kanaalbezorging toont de opdrachttekst in de chat; schakel `channel` of `both` alleen in vertrouwde groepen/onderwerpen in. Wanneer de prompt in een forumonderwerp terechtkomt, behoudt OpenClaw het onderwerp voor de goedkeuringsprompt en de follow-up. Exec-goedkeuringen verlopen standaard na 30 minuten.

    Inline goedkeuringsknoppen vereisen ook dat `channels.telegram.capabilities.inlineButtons` het doeloppervlak (`dm`, `group` of `all`) toestaat. Goedkeurings-ID's met het voorvoegsel `plugin:` worden via Plugin-goedkeuringen opgelost; andere worden eerst via exec-goedkeuringen opgelost.

    Zie [Exec-goedkeuringen](/nl/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Beheer van foutantwoorden

Wanneer de agent een bezorgings- of providerfout tegenkomt, bepaalt het foutbeleid of foutberichten naar de Telegram-chat worden verzonden:

| Sleutel                             | Waarden                    | Standaard       | Beschrijving                                                                                                                                                                                                 |
| ----------------------------------- | -------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `channels.telegram.errorPolicy`     | `always`, `once`, `silent` | `always`        | `always` — verzend elk foutbericht naar de chat. `once` — verzend elk uniek foutbericht één keer per cooldownvenster (onderdruk herhaalde identieke fouten). `silent` — verzend nooit foutberichten naar de chat. |
| `channels.telegram.errorCooldownMs` | getal (ms)                 | `14400000` (4u) | Cooldownvenster voor het beleid `once`. Nadat een fout is verzonden, wordt hetzelfde foutbericht onderdrukt totdat dit interval is verstreken. Voorkomt foutspam tijdens storingen.                            |

Overschrijvingen per account, per groep en per onderwerp worden ondersteund (dezelfde overerving als andere Telegram-configuratiesleutels).

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
  <Accordion title="Bot does not respond to non mention group messages">

    - Als `requireMention=false`, moet de privacymodus van Telegram volledige zichtbaarheid toestaan.
      - BotFather: `/setprivacy` -> Uitschakelen
      - verwijder de bot daarna uit de groep en voeg deze opnieuw toe
    - `openclaw channels status` waarschuwt wanneer de configuratie ongenoemde groepsberichten verwacht.
    - `openclaw channels status --probe` kan expliciete numerieke groeps-ID's controleren; wildcard `"*"` kan niet op lidmaatschap worden gecontroleerd.
    - snelle sessietest: `/activation always`.

  </Accordion>

  <Accordion title="Bot not seeing group messages at all">

    - wanneer `channels.telegram.groups` bestaat, moet de groep worden vermeld (of `"*"` bevatten)
    - verifieer het botlidmaatschap in de groep
    - controleer logs: `openclaw logs --follow` voor redenen om over te slaan

  </Accordion>

  <Accordion title="Commands work partially or not at all">

    - autoriseer je afzenderidentiteit (koppeling en/of numerieke `allowFrom`)
    - opdrachtautorisatie blijft van toepassing, zelfs wanneer het groepsbeleid `open` is
    - `setMyCommands failed` met `BOT_COMMANDS_TOO_MUCH` betekent dat het native menu te veel items heeft; verminder Plugin-/skill-/aangepaste opdrachten of schakel native menu's uit
    - Opstartaanroepen `deleteMyCommands` / `setMyCommands` en typeaanroepen `sendChatAction` zijn begrensd en proberen één keer opnieuw via de transportfallback van Telegram bij een verzoektime-out. Aanhoudende netwerk-/fetchfouten wijzen meestal op DNS-/HTTPS-bereikbaarheidsproblemen naar `api.telegram.org`

  </Accordion>

  <Accordion title="Startup reports unauthorized token">

    - `getMe returned 401` is een Telegram-authenticatiefout voor het geconfigureerde bottoken.
    - Kopieer het bottoken opnieuw of genereer het opnieuw in BotFather en werk daarna `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` of `TELEGRAM_BOT_TOKEN` bij voor het standaardaccount.
    - `deleteWebhook 401 Unauthorized` tijdens het opstarten is ook een authenticatiefout; dit behandelen als "er bestaat geen Webhook" zou dezelfde fout door een ongeldig token alleen uitstellen naar latere API-aanroepen.

  </Accordion>

  <Accordion title="Polling or network instability">

    - Node 22+ + aangepaste fetch/proxy kan onmiddellijk afbreekgedrag veroorzaken als AbortSignal-typen niet overeenkomen.
    - Sommige hosts lossen `api.telegram.org` eerst op naar IPv6; kapotte IPv6-egress kan intermitterende Telegram API-fouten veroorzaken.
    - Als logs `TypeError: fetch failed` of `Network request for 'getUpdates' failed!` bevatten, probeert OpenClaw deze nu opnieuw als herstelbare netwerkfouten.
    - Tijdens het opstarten van polling hergebruikt OpenClaw de succesvolle opstartprobe `getMe` voor grammY, zodat de runner geen tweede `getMe` nodig heeft vóór de eerste `getUpdates`.
    - Als `deleteWebhook` mislukt met een tijdelijke netwerkfout tijdens het opstarten van polling, gaat OpenClaw door naar long polling in plaats van nog een pre-poll control-plane-aanroep te doen. Een nog actieve Webhook verschijnt als een `getUpdates`-conflict; OpenClaw bouwt daarna het Telegram-transport opnieuw op en probeert Webhook-opruiming opnieuw.
    - Als Telegram-sockets volgens een korte vaste cadans recyclen, controleer dan op een lage `channels.telegram.timeoutSeconds`; botclients klemmen geconfigureerde waarden onder de bewakingen voor uitgaande verzoeken en `getUpdates`-verzoeken, maar oudere releases konden elke poll of elk antwoord afbreken wanneer dit onder die bewakingen was ingesteld.
    - Als logs `Polling stall detected` bevatten, start OpenClaw polling opnieuw en bouwt het Telegram-transport opnieuw op na standaard 120 seconden zonder voltooide long-poll-liveness.
    - `openclaw channels status --probe` en `openclaw doctor` waarschuwen wanneer een actief pollingaccount `getUpdates` niet heeft voltooid na de opstartgraceperiode, wanneer een actief Webhook-account `setWebhook` niet heeft voltooid na de opstartgraceperiode, of wanneer de laatste succesvolle pollingtransportactiviteit verouderd is.
    - Verhoog `channels.telegram.pollingStallThresholdMs` alleen wanneer langlopende `getUpdates`-aanroepen gezond zijn, maar je host nog steeds foutieve herstarts door vastgelopen polling meldt. Aanhoudende vastlopers wijzen meestal op proxy-, DNS-, IPv6- of TLS-egressproblemen tussen de host en `api.telegram.org`.
    - Telegram respecteert ook procesproxy-env voor Bot API-transport, inclusief `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` en hun varianten in kleine letters. `NO_PROXY` / `no_proxy` kan `api.telegram.org` nog steeds omzeilen.
    - Als de door OpenClaw beheerde proxy via `OPENCLAW_PROXY_URL` voor een serviceomgeving is geconfigureerd en er geen standaard proxy-env aanwezig is, gebruikt Telegram die URL ook voor Bot API-transport.
    - Routeer Telegram API-aanroepen op VPS-hosts met instabiele directe egress/TLS via `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ gebruikt standaard `autoSelectFamily=true` (behalve WSL2). De volgorde van Telegram DNS-resultaten respecteert eerst `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, daarna `channels.telegram.network.dnsResultOrder`, daarna de processtandaard zoals `NODE_OPTIONS=--dns-result-order=ipv4first`; als geen daarvan van toepassing is, valt Node 22+ terug op `ipv4first`.
    - Als je host WSL2 is of expliciet beter werkt met IPv4-only gedrag, forceer dan familieselectie:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Antwoorden uit het RFC 2544-benchmarkbereik (`198.18.0.0/15`) zijn
      standaard al toegestaan voor Telegram-mediadownloads. Als een vertrouwde
      fake-IP- of transparante proxy `api.telegram.org` tijdens mediadownloads
      herschrijft naar een ander privé/intern/special-use adres, kun je je
      aanmelden voor de alleen-voor-Telegram-bypass:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Dezelfde opt-in is per account beschikbaar op
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Als je proxy Telegram-mediahosts omzet naar `198.18.x.x`, laat de
      gevaarlijke vlag eerst uit. Telegram-media staat het RFC 2544-benchmarkbereik
      standaard al toe.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` verzwakt de
      SSRF-bescherming voor Telegram-media. Gebruik dit alleen voor vertrouwde,
      door operators beheerde proxyomgevingen zoals Clash-, Mihomo- of Surge
      fake-IP-routing wanneer die privé- of special-use antwoorden buiten het
      RFC 2544-benchmarkbereik synthetiseren. Laat dit uit voor normale openbare
      internettoegang tot Telegram.
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

Meer hulp: [Probleemoplossing voor kanalen](/nl/channels/troubleshooting).

## Configuratiereferentie

Primaire referentie: [Configuratiereferentie - Telegram](/nl/gateway/config-channels#telegram).

<Accordion title="Belangrijke Telegram-velden">

- opstarten/authenticatie: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` moet naar een regulier bestand wijzen; symlinks worden geweigerd)
- toegangsbeheer: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, top-level `bindings[]` (`type: "acp"`)
- topicstandaarden: `groups.<chatId>.topics."*"` geldt voor niet-overeenkomende forumtopics; exacte topic-ID's overschrijven dit
- exec-goedkeuringen: `execApprovals`, `accounts.*.execApprovals`
- opdracht/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- threading/antwoorden: `replyToMode`
- streaming: `streaming` (preview), `streaming.preview.toolProgress`, `blockStreaming`
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
Multi-accountprioriteit: wanneer twee of meer account-ID's zijn geconfigureerd, stel je `channels.telegram.defaultAccount` in (of neem je `channels.telegram.accounts.default` op) om standaardrouting expliciet te maken. Anders valt OpenClaw terug op het eerste genormaliseerde account-ID en geeft `openclaw doctor` een waarschuwing. Benoemde accounts erven `channels.telegram.allowFrom` / `groupAllowFrom`, maar niet de waarden van `accounts.default.*`.
</Note>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Koppelen" icon="link" href="/nl/channels/pairing">
    Koppel een Telegram-gebruiker aan de Gateway.
  </Card>
  <Card title="Groepen" icon="users" href="/nl/channels/groups">
    Gedrag van allowlists voor groepen en topics.
  </Card>
  <Card title="Kanaalrouting" icon="route" href="/nl/channels/channel-routing">
    Routeer inkomende berichten naar agents.
  </Card>
  <Card title="Beveiliging" icon="shield" href="/nl/gateway/security">
    Dreigingsmodel en hardening.
  </Card>
  <Card title="Multi-agentrouting" icon="sitemap" href="/nl/concepts/multi-agent">
    Koppel groepen en topics aan agents.
  </Card>
  <Card title="Probleemoplossing" icon="wrench" href="/nl/channels/troubleshooting">
    Cross-channel diagnostiek.
  </Card>
</CardGroup>
