---
read_when:
    - Werken aan Telegram-functies of Webhooks
summary: Status, mogelijkheden en configuratie van Telegram-botondersteuning
title: Telegram
x-i18n:
    generated_at: "2026-07-01T20:26:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 541ce276cf045b19461167513d86e2dd9a5bb8ff95bcb9e55f10440e2e66a165
    source_path: channels/telegram.md
    workflow: 16
---

Productieklaar voor bot-DM's en groepen via grammY. Long polling is de standaardmodus; webhookmodus is optioneel.

<CardGroup cols={3}>
  <Card title="Koppelen" icon="link" href="/nl/channels/pairing">
    Het standaard-DM-beleid voor Telegram is koppelen.
  </Card>
  <Card title="Kanaalproblemen oplossen" icon="wrench" href="/nl/channels/troubleshooting">
    Diagnostiek en reparatieplaybooks voor meerdere kanalen.
  </Card>
  <Card title="Gateway-configuratie" icon="settings" href="/nl/gateway/configuration">
    Volledige kanaalconfiguratiepatronen en voorbeelden.
  </Card>
</CardGroup>

## Snelle configuratie

<Steps>
  <Step title="Maak het bottoken aan in BotFather">
    Open Telegram en chat met **@BotFather** (controleer of de handle exact `@BotFather` is).

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
    Telegram gebruikt **niet** `openclaw channels login telegram`; configureer het token in config/env en start daarna gateway.

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

    Haal bij eerste configuratie de groepschat-ID op uit `openclaw logs --follow`, een bot voor doorgestuurde ID's of Bot API `getUpdates`. Nadat de groep is toegestaan, kan `/whoami@<bot_username>` de gebruikers- en groeps-ID's bevestigen.

    Negatieve Telegram-supergroep-ID's die met `-100` beginnen, zijn groepschat-ID's. Zet ze onder `channels.telegram.groups`, niet onder `groupAllowFrom`.

  </Step>
</Steps>

<Note>
De volgorde voor tokenresolutie is accountbewust. In de praktijk winnen configuratiewaarden van env-fallback, en `TELEGRAM_BOT_TOKEN` geldt alleen voor het standaardaccount.
Na een succesvolle start cachet OpenClaw de botidentiteit maximaal 24 uur in de statusmap, zodat herstarts een extra Telegram-`getMe`-aanroep kunnen vermijden; wijzigen of verwijderen van het token wist die cache.
</Note>

## Instellingen aan Telegram-zijde

<AccordionGroup>
  <Accordion title="Privacymodus en groepszichtbaarheid">
    Telegram-bots gebruiken standaard **Privacy Mode**, waardoor wordt beperkt welke groepsberichten ze ontvangen.

    Als de bot alle groepsberichten moet zien, doe dan een van beide:

    - schakel privacymodus uit via `/setprivacy`, of
    - maak de bot groepsbeheerder.

    Verwijder de bot bij het wijzigen van privacymodus uit elke groep en voeg hem opnieuw toe, zodat Telegram de wijziging toepast.

  </Accordion>

  <Accordion title="Groepsmachtigingen">
    Beheerdersstatus wordt beheerd in de Telegram-groepsinstellingen.

    Beheerderbots ontvangen alle groepsberichten, wat nuttig is voor altijd actief groepsgedrag.

  </Accordion>

  <Accordion title="Handige BotFather-schakelaars">

    - `/setjoingroups` om toevoegen aan groepen toe te staan/te weigeren
    - `/setprivacy` voor gedrag rond groepszichtbaarheid

  </Accordion>
</AccordionGroup>

## Toegangscontrole en activering

### Groepsbotidentiteit

In Telegram-groepen en forumonderwerpen wordt een expliciete vermelding van de geconfigureerde bothandle (bijvoorbeeld `@my_bot`) behandeld als adressering van de geselecteerde OpenClaw-agent, zelfs wanneer de agentpersonanaam afwijkt van de Telegram-gebruikersnaam. Het stiltebeleid voor groepen blijft gelden voor niet-gerelateerd groepsverkeer, maar de bothandle zelf wordt niet beschouwd als "iemand anders."

<Tabs>
  <Tab title="DM-beleid">
    `channels.telegram.dmPolicy` beheert toegang via directe berichten:

    - `pairing` (standaard)
    - `allowlist` (vereist minimaal één afzender-ID in `allowFrom`)
    - `open` (vereist dat `allowFrom` `"*"` bevat)
    - `disabled`

    `dmPolicy: "open"` met `allowFrom: ["*"]` laat elk Telegram-account dat de botgebruikersnaam vindt of raadt de bot opdrachten geven. Gebruik dit alleen voor bewust openbare bots met strikt beperkte tools; bots met één eigenaar moeten `allowlist` met numerieke gebruikers-ID's gebruiken.

    `channels.telegram.allowFrom` accepteert numerieke Telegram-gebruikers-ID's. Voorvoegsels `telegram:` / `tg:` worden geaccepteerd en genormaliseerd.
    In configuraties met meerdere accounts wordt een beperkende `channels.telegram.allowFrom` op topniveau behandeld als veiligheidsgrens: accountniveau-items `allowFrom: ["*"]` maken dat account niet openbaar tenzij de effectieve account-allowlist na samenvoegen nog steeds een expliciete wildcard bevat.
    `dmPolicy: "allowlist"` met lege `allowFrom` blokkeert alle DM's en wordt geweigerd door configuratievalidatie.
    Configuratie vraagt alleen om numerieke gebruikers-ID's.
    Als je hebt geüpgraded en je configuratie `@username`-allowlist-items bevat, voer dan `openclaw doctor --fix` uit om ze op te lossen (best effort; vereist een Telegram-bottoken).
    Als je eerder vertrouwde op allowlist-bestanden uit de koppelingsopslag, kan `openclaw doctor --fix` items herstellen naar `channels.telegram.allowFrom` in allowlist-flows (bijvoorbeeld wanneer `dmPolicy: "allowlist"` nog geen expliciete ID's heeft).

    Voor bots met één eigenaar verdient `dmPolicy: "allowlist"` met expliciete numerieke `allowFrom`-ID's de voorkeur, zodat het toegangsbeleid duurzaam in de configuratie staat (in plaats van afhankelijk te zijn van eerdere koppelingsgoedkeuringen).

    Veelvoorkomende verwarring: DM-koppelingsgoedkeuring betekent niet "deze afzender is overal geautoriseerd".
    Koppelen geeft DM-toegang. Als er nog geen opdrachteigenaar bestaat, stelt de eerste goedgekeurde koppeling ook `commands.ownerAllowFrom` in zodat opdrachten voor alleen eigenaars en exec-goedkeuringen een expliciet operatoraccount hebben.
    Autorisatie van groepsafzenders komt nog steeds uit expliciete configuratie-allowlists.
    Als je wilt "ik ben eenmaal geautoriseerd en zowel DM's als groepsopdrachten werken", zet dan je numerieke Telegram-gebruikers-ID in `channels.telegram.allowFrom`; zorg er voor opdrachten voor alleen eigenaars voor dat `commands.ownerAllowFrom` `telegram:<your user id>` bevat.

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
       - geen `groups`-configuratie:
         - met `groupPolicy: "open"`: elke groep kan groeps-ID-controles doorstaan
         - met `groupPolicy: "allowlist"` (standaard): groepen worden geblokkeerd totdat je `groups`-items (of `"*"`) toevoegt
       - `groups` geconfigureerd: werkt als allowlist (expliciete ID's of `"*"`)

    2. **Welke afzenders zijn toegestaan in groepen** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (standaard)
       - `disabled`

    `groupAllowFrom` wordt gebruikt voor het filteren van groepsafzenders. Als dit niet is ingesteld, valt Telegram terug op `allowFrom`.
    `groupAllowFrom`-items moeten numerieke Telegram-gebruikers-ID's zijn (voorvoegsels `telegram:` / `tg:` worden genormaliseerd).
    Zet geen Telegram-groeps- of supergroepchat-ID's in `groupAllowFrom`. Negatieve chat-ID's horen onder `channels.telegram.groups`.
    Niet-numerieke items worden genegeerd voor afzenderautorisatie.
    Veiligheidsgrens (`2026.2.25+`): groepsafzenderauth erft **geen** DM-goedkeuringen uit de koppelingsopslag.
    Koppelen blijft alleen voor DM's. Stel voor groepen `groupAllowFrom` of per-groep/per-onderwerp `allowFrom` in.
    Als `groupAllowFrom` niet is ingesteld, valt Telegram terug op config `allowFrom`, niet op de koppelingsopslag.
    Praktisch patroon voor bots met één eigenaar: stel je gebruikers-ID in `channels.telegram.allowFrom` in, laat `groupAllowFrom` unset, en sta de doelgroepen toe onder `channels.telegram.groups`.
    Runtime-opmerking: als `channels.telegram` volledig ontbreekt, gebruikt de runtime standaard fail-closed `groupPolicy="allowlist"`, tenzij `channels.defaults.groupPolicy` expliciet is ingesteld.

    Groepsconfiguratie voor alleen eigenaar:

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

    Test het vanuit de groep met `@<bot_username> ping`. Gewone groepsberichten triggeren de bot niet zolang `requireMention: true`.

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
      Veelgemaakte fout: `groupAllowFrom` is geen Telegram-groepsallowlist.

      - Zet negatieve Telegram-groeps- of supergroepchat-ID's zoals `-1001234567890` onder `channels.telegram.groups`.
      - Zet Telegram-gebruikers-ID's zoals `8734062810` onder `groupAllowFrom` wanneer je wilt beperken welke personen binnen een toegestane groep de bot kunnen triggeren.
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

    Sessiegebonden opdrachtschakelaars:

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

    Groepsgeschiedeniscontext staat standaard op `mention-only`: eerdere groepsberichten worden
    alleen opgenomen wanneer ze aan de bot waren gericht, antwoorden op de bot zijn,
    of berichten van de bot zelf zijn. Stel `includeGroupHistoryContext: "recent"` in om
    recente ruimtegeschiedenis voor vertrouwde groepen op te nemen. Stel
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
    - voer nadat de groep is toegestaan `/whoami@<bot_username>` uit als native opdrachten zijn ingeschakeld

  </Tab>
</Tabs>

## Runtimegedrag

- Telegram is eigendom van het gateway-proces.
- Routing is deterministisch: inkomende Telegram-antwoorden gaan terug naar Telegram (het model kiest geen kanalen).
- Inkomende berichten worden genormaliseerd naar de gedeelde channel-envelope met antwoordmetadata, mediaplaatshouders en bewaarde reply-chain-context voor Telegram-antwoorden die de Gateway heeft waargenomen.
- Groepssessies worden geisoleerd op groeps-ID. Forumonderwerpen voegen `:topic:<threadId>` toe om onderwerpen geisoleerd te houden.
- DM-berichten kunnen `message_thread_id` bevatten; OpenClaw behoudt dit voor antwoorden. DM-onderwerpsessies worden alleen gesplitst wanneer Telegram `getMe` `has_topics_enabled: true` voor de bot rapporteert; anders blijven DM's op de platte sessie.
- Long polling gebruikt de grammY-runner met sequencing per chat/per thread. De totale sink-concurrency van de runner gebruikt `agents.defaults.maxConcurrent`.
- Multi-account opstarten begrenst gelijktijdige Telegram `getMe`-probes, zodat grote bot-fleets niet alle accountprobes tegelijk uitwaaieren.
- Long polling wordt binnen elk gateway-proces bewaakt, zodat slechts een actieve poller tegelijk een bottoken kan gebruiken. Als je nog steeds `getUpdates` 409-conflicten ziet, gebruikt waarschijnlijk een andere OpenClaw-gateway, script of externe poller hetzelfde token.
- Watchdog-herstarts voor long polling worden standaard geactiveerd na 120 seconden zonder voltooide `getUpdates`-liveness. Verhoog `channels.telegram.pollingStallThresholdMs` alleen als je deployment nog steeds valse polling-stall-herstarts ziet tijdens langlopende werkzaamheden. De waarde is in milliseconden en is toegestaan van `30000` tot `600000`; overrides per account worden ondersteund.
- De Telegram Bot API heeft geen ondersteuning voor leesbevestigingen (`sendReadReceipts` is niet van toepassing).

<Note>
  `channels.telegram.dm.threadReplies` en `channels.telegram.direct.<chatId>.threadReplies` zijn verwijderd. Voer `openclaw doctor --fix` uit na het upgraden als je config die sleutels nog bevat. DM-onderwerprouting volgt nu de botcapaciteit uit Telegram `getMe.has_topics_enabled`, die wordt beheerd door de threaded mode van BotFather: bots met topics ingeschakeld gebruiken thread-scoped DM-sessies wanneer Telegram `message_thread_id` verzendt; andere DM's blijven op de platte sessie.
</Note>

## Functiereferentie

<AccordionGroup>
  <Accordion title="Live streamvoorbeeld (berichtbewerkingen)">
    OpenClaw kan deelantwoorden in realtime streamen:

    - directe chats: voorbeeldbericht + `editMessageText`
    - groepen/onderwerpen: voorbeeldbericht + `editMessageText`

    Vereiste:

    - `channels.telegram.streaming` is `off | partial | block | progress` (standaard: `partial`)
    - korte eerste antwoordvoorbeelden worden gedebounced en daarna na een begrensde vertraging gematerialiseerd als de run nog actief is
    - `progress` houdt een bewerkbare statusconceptversie bij voor toolvoortgang, toont het stabiele statuslabel wanneer antwoordactiviteit arriveert voordat er toolvoortgang is, wist dit bij voltooiing en verzendt het eindantwoord als normaal bericht
    - `streaming.preview.toolProgress` bepaalt of tool-/voortgangsupdates hetzelfde bewerkte voorbeeldbericht hergebruiken (standaard: `true` wanneer voorbeeldstreaming actief is)
    - `streaming.preview.commandText` bepaalt command-/exec-details binnen die toolvoortgangsregels: `raw` (standaard, behoudt uitgebracht gedrag) of `status` (alleen toollabel)
    - `streaming.progress.commentary` (standaard: `false`) schakelt assistentcommentaar/preambuletekst in de tijdelijke voortgangsconceptversie in
    - verouderde `channels.telegram.streamMode`, booleaanse `streaming`-waarden en uitgefaseerde native draft preview-sleutels worden gedetecteerd; voer `openclaw doctor --fix` uit om ze naar de huidige streamingconfiguratie te migreren

    Voorbeeldupdates voor toolvoortgang zijn de korte statusregels die worden getoond terwijl tools draaien, bijvoorbeeld opdrachtuitvoering, bestandslezingen, planningsupdates, patchsamenvattingen of Codex-preambule-/commentaartekst in Codex app-servermodus. Telegram houdt deze standaard ingeschakeld om overeen te komen met uitgebracht OpenClaw-gedrag vanaf `v2026.4.22` en later.

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

    Stel het volgende in om toolvoortgang zichtbaar te houden maar command-/exec-tekst te verbergen:

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

    Gebruik de modus `progress` wanneer je zichtbare toolvoortgang wilt zonder het eindantwoord in datzelfde bericht te bewerken. Zet het command-text-beleid onder `streaming.progress`:

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

    Gebruik `streaming.mode: "off"` alleen wanneer je uitsluitend eindlevering wilt: Telegram-voorbeeldbewerkingen zijn uitgeschakeld en generiek tool-/voortgangsgebabbel wordt onderdrukt in plaats van als losse statusberichten verzonden. Goedkeuringsprompts, mediapayloads en fouten blijven via normale eindlevering lopen. Gebruik `streaming.preview.toolProgress: false` wanneer je alleen antwoordvoorbeeldbewerkingen wilt behouden terwijl je de statusregels voor toolvoortgang verbergt.

    <Note>
      Geselecteerde quote-antwoorden in Telegram zijn de uitzondering. Wanneer `replyToMode` `"first"`, `"all"` of `"batched"` is en het inkomende bericht geselecteerde quotetekst bevat, verzendt OpenClaw het eindantwoord via Telegrams native quote-reply-pad in plaats van het antwoordvoorbeeld te bewerken, waardoor `streaming.preview.toolProgress` de korte statusregels voor die beurt niet kan tonen. Antwoorden op het huidige bericht zonder geselecteerde quotetekst behouden nog steeds voorbeeldstreaming. Stel `replyToMode: "off"` in wanneer zichtbaarheid van toolvoortgang belangrijker is dan native quote-antwoorden, of stel `streaming.preview.toolProgress: false` in om de afweging te erkennen.
    </Note>

    Voor antwoorden met alleen tekst:

    - korte DM-/groeps-/onderwerpvoorbeelden: OpenClaw behoudt hetzelfde voorbeeldbericht en voert de eindbewerking ter plekke uit
    - lange eindteksten die in meerdere Telegram-berichten worden opgesplitst, hergebruiken waar mogelijk het bestaande voorbeeld als het eerste eindblok en verzenden daarna alleen de resterende blokken
    - eindantwoorden in progress-modus wissen de statusconceptversie en gebruiken normale eindlevering in plaats van de conceptversie tot het antwoord te bewerken
    - als de eindbewerking mislukt voordat de voltooide tekst is bevestigd, gebruikt OpenClaw normale eindlevering en ruimt het verouderde voorbeeld op

    Voor complexe antwoorden (bijvoorbeeld mediapayloads) valt OpenClaw terug op normale eindlevering en ruimt daarna het voorbeeldbericht op.

    Voorbeeldstreaming staat los van block streaming. Wanneer block streaming expliciet is ingeschakeld voor Telegram, slaat OpenClaw de voorbeeldstream over om dubbele streaming te voorkomen.

    Gedrag van reasoning-stream:

    - `/reasoning stream` gebruikt het reasoning-preview-pad van een ondersteund kanaal; op Telegram streamt dit reasoning naar de live preview tijdens het genereren
    - de reasoning-preview wordt verwijderd na eindlevering; gebruik `/reasoning on` wanneer reasoning zichtbaar moet blijven
    - het eindantwoord wordt zonder reasoning-tekst verzonden

  </Accordion>

  <Accordion title="Rich message-opmaak">
    Uitgaande tekst gebruikt standaard Telegram HTML-berichten, zodat antwoorden leesbaar blijven in huidige Telegram-clients. Deze compatibiliteitsmodus ondersteunt normale vetgedrukte tekst, cursief, links, code, spoilers en quotes, maar geen rich-only-blokken van Bot API 10.1 zoals native tabellen, details, rich media en formules.

    Stel `channels.telegram.richMessages: true` in om Bot API 10.1 rich messages in te schakelen:

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

    - De agent krijgt te horen dat Telegram rich messages beschikbaar zijn voor deze bot/dit account.
    - Markdown-tekst wordt gerenderd via OpenClaw's Markdown IR en verzonden als Telegram rich HTML.
    - Expliciete rich HTML-payloads behouden ondersteunde Bot API 10.1-tags zoals koppen, tabellen, details, rich media en formules.
    - Mediabijschriften gebruiken nog steeds Telegram HTML-bijschriften, omdat rich messages bijschriften niet vervangen.

    Dit houdt modeltekst weg van Telegram Rich Markdown-sigils, zodat valuta zoals `$400-600K` niet als wiskunde wordt geparsed. Lange rich text wordt automatisch opgesplitst over Telegrams limieten voor rich text en rich blocks. Tabellen boven Telegrams kolomlimiet worden als codeblokken verzonden.

    Standaard: uit voor clientcompatibiliteit. Rich messages vereisen compatibele Telegram-clients; sommige huidige Desktop-, Web-, Android- en externe clients tonen geaccepteerde rich messages als niet-ondersteund. Houd deze optie uitgeschakeld tenzij elke client die met de bot wordt gebruikt ze kan renderen. `/status` toont of de huidige Telegram-sessie rich messages aan of uit heeft.

    Linkvoorbeelden zijn standaard ingeschakeld. `channels.telegram.linkPreview: false` slaat automatische entiteitsdetectie voor rich text over.

  </Accordion>

  <Accordion title="Native commands en aangepaste commands">
    Registratie van het Telegram-commandmenu wordt bij het opstarten afgehandeld met `setMyCommands`.

    Standaarden voor native commands:

    - `commands.native: "auto"` schakelt native commands in voor Telegram

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

    - namen worden genormaliseerd (voorloop-`/` verwijderen, kleine letters)
    - geldig patroon: `a-z`, `0-9`, `_`, lengte `1..32`
    - aangepaste commands kunnen native commands niet overschrijven
    - conflicten/duplicaten worden overgeslagen en gelogd

    Opmerkingen:

    - aangepaste commands zijn alleen menu-items; ze implementeren niet automatisch gedrag
    - Plugin-/skill-commands kunnen nog steeds werken wanneer ze worden getypt, zelfs als ze niet in het Telegram-menu worden getoond

    Als native commands zijn uitgeschakeld, worden ingebouwde commands verwijderd. Aangepaste/Plugin-commands kunnen nog steeds worden geregistreerd als ze zijn geconfigureerd.

    Veelvoorkomende setupfouten:

    - `setMyCommands failed` met `BOT_COMMANDS_TOO_MUCH` betekent dat het Telegram-menu na inkorten nog steeds is overgelopen; verminder Plugin-/skill-/aangepaste commands of schakel `channels.telegram.commands.native` uit.
    - `deleteWebhook`, `deleteMyCommands` of `setMyCommands` dat faalt met `404: Not Found` terwijl directe Bot API curl-commands werken, kan betekenen dat `channels.telegram.apiRoot` is ingesteld op het volledige `/bot<TOKEN>`-endpoint. `apiRoot` mag alleen de Bot API-root zijn, en `openclaw doctor --fix` verwijdert een per ongeluk toegevoegde afsluitende `/bot<TOKEN>`.
    - `getMe returned 401` betekent dat Telegram het geconfigureerde bottoken heeft geweigerd. Werk `botToken`, `tokenFile` of `TELEGRAM_BOT_TOKEN` bij met het huidige BotFather-token; OpenClaw stopt voordat polling start, dus dit wordt niet gemeld als een webhook-opruimfout.
    - `setMyCommands failed` met netwerk-/fetchfouten betekent meestal dat uitgaande DNS/HTTPS naar `api.telegram.org` is geblokkeerd.

    ### Commands voor apparaatkoppeling (`device-pair`-Plugin)

    Wanneer de `device-pair`-Plugin is geinstalleerd:

    1. `/pair` genereert setupcode
    2. plak code in iOS-app
    3. `/pair pending` toont openstaande aanvragen (inclusief rol/scopes)
    4. keur de aanvraag goed:
       - `/pair approve <requestId>` voor expliciete goedkeuring
       - `/pair approve` wanneer er slechts een openstaande aanvraag is
       - `/pair approve latest` voor meest recente

    De setupcode bevat een kortlevend bootstraptoken. Ingebouwde setupcode-bootstrap is alleen voor nodes: de eerste verbinding maakt een openstaande node-aanvraag aan, en na goedkeuring retourneert de Gateway een duurzaam nodetoken met `scopes: []`. Het retourneert geen overgedragen operatortoken; operatortoegang vereist een afzonderlijk goedgekeurde operatorkoppeling of tokenflow.

    Als een apparaat opnieuw probeert met gewijzigde authdetails (bijvoorbeeld rol/scopes/publieke sleutel), wordt de vorige openstaande aanvraag vervangen en gebruikt de nieuwe aanvraag een andere `requestId`. Voer `/pair pending` opnieuw uit voordat je goedkeurt.

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

    Callback-klikken die niet worden geclaimd door een geregistreerde interactieve
    handler van een Plugin worden als tekst doorgegeven aan de agent:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Telegram-berichtacties voor agents en automatisering">
    Telegram-toolacties omvatten:

    - `sendMessage` (`to`, `content`, optioneel `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content` of `caption`, optionele `presentation` inline knoppen; bewerkingen met alleen knoppen werken de antwoordmarkering bij)
    - `createForumTopic` (`chatId`, `name`, optioneel `iconColor`, `iconCustomEmojiId`)

    Kanaalberichtacties bieden ergonomische aliassen (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Gating-besturing:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (standaard: uitgeschakeld)

    Opmerking: `edit` en `topic-create` zijn momenteel standaard ingeschakeld en hebben geen afzonderlijke `channels.telegram.actions.*`-toggles.
    Runtime-verzendingen gebruiken de actieve configuratie-/secrets-snapshot (opstarten/herladen), dus actiepaden voeren geen ad-hoc her-resolutie van SecretRef per verzending uit.

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

    Wanneer antwoordthreads zijn ingeschakeld en de oorspronkelijke Telegram-tekst of het bijschrift beschikbaar is, neemt OpenClaw automatisch een native Telegram-citaatexcerpt op. Telegram beperkt native citaattekst tot 1024 UTF-16-code-eenheden, dus langere berichten worden vanaf het begin geciteerd en vallen terug op een normaal antwoord als Telegram het citaat weigert.

    Opmerking: `off` schakelt impliciete antwoordthreads uit. Expliciete `[[reply_to_*]]`-tags worden nog steeds gerespecteerd.

  </Accordion>

  <Accordion title="Forumonderwerpen en threadgedrag">
    Forum-supergroepen:

    - onderwerpsessiesleutels voegen `:topic:<threadId>` toe
    - antwoorden en typen richten zich op de onderwerpthread
    - configuratiepad voor onderwerpen:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Speciaal geval voor algemeen onderwerp (`threadId=1`):

    - berichtverzendingen laten `message_thread_id` weg (Telegram weigert `sendMessage(...thread_id=1)`)
    - typacties bevatten nog steeds `message_thread_id`

    Onderwerpovererving: onderwerpvermeldingen erven groepsinstellingen tenzij ze worden overschreven (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` is alleen voor onderwerpen en erft niet van groepsstandaarden.
    `topics."*"` stelt standaardwaarden in voor elk onderwerp in die groep; exacte onderwerp-ID's hebben nog steeds voorrang op `"*"`.

    **Agentroutering per onderwerp**: Elk onderwerp kan naar een andere agent routeren door `agentId` in de onderwerpconfiguratie in te stellen. Dit geeft elk onderwerp een eigen geïsoleerde werkruimte, geheugen en sessie. Voorbeeld:

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

    Elk onderwerp heeft dan zijn eigen sessiesleutel: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Persistente ACP-onderwerpbinding**: Forumonderwerpen kunnen ACP-harnesssessies vastzetten via getypeerde ACP-bindingen op topniveau (`bindings[]` met `type: "acp"` en `match.channel: "telegram"`, `peer.kind: "group"`, en een onderwerpgekwalificeerde ID zoals `-1001234567890:topic:42`). Momenteel beperkt tot forumonderwerpen in groepen/supergroepen. Zie [ACP Agents](/nl/tools/acp-agents).

    **Thread-gebonden ACP-spawn vanuit chat**: `/acp spawn <agent> --thread here|auto` bindt het huidige onderwerp aan een nieuwe ACP-sessie; vervolgberichten worden daar rechtstreeks naartoe gerouteerd. OpenClaw zet de spawnbevestiging vast in het onderwerp. Vereist dat `channels.telegram.threadBindings.spawnSessions` ingeschakeld blijft (standaard: `true`).

    Templatecontext exposeert `MessageThreadId` en `IsForum`. DM-chats met `message_thread_id` behouden antwoordmetadata; ze gebruiken alleen threadbewuste sessiesleutels wanneer Telegram `getMe` `has_topics_enabled: true` voor de bot rapporteert.
    De eerdere overrides `dm.threadReplies` en `direct.*.threadReplies` zijn bewust uitgefaseerd; gebruik de threaded modus van BotFather als de enige bron van waarheid en voer `openclaw doctor --fix` uit om verouderde configuratiesleutels te verwijderen.

  </Accordion>

  <Accordion title="Audio, video en stickers">
    ### Audioberichten

    Telegram maakt onderscheid tussen spraaknotities en audiobestanden.

    - standaard: gedrag voor audiobestand
    - tag `[[audio_as_voice]]` in agentantwoord om verzending als spraaknotitie af te dwingen
    - transcripties van inkomende spraaknotities worden in de agentcontext omlijst als machinegegenereerde,
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

    Contextvelden voor stickers:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    Stickerbeschrijvingen worden gecachet in de SQLite-pluginstatus van OpenClaw om herhaalde vision-aanroepen te verminderen.

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

  <Accordion title="Reaction notifications">
    Telegram-reacties komen binnen als `message_reaction`-updates (gescheiden van berichtpayloads).

    Wanneer dit is ingeschakeld, zet OpenClaw systeemgebeurtenissen in de wachtrij, zoals:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Configuratie:

    - `channels.telegram.reactionNotifications`: `off | own | all` (standaard: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (standaard: `minimal`)

    Opmerkingen:

    - `own` betekent alleen gebruikersreacties op door de bot verzonden berichten (best-effort via cache voor verzonden berichten).
    - Reactiegebeurtenissen respecteren nog steeds de toegangscontroles van Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); niet-geautoriseerde afzenders worden geweigerd.
    - Telegram levert geen thread-ID's in reactie-updates.
      - niet-forumgroepen worden gerouteerd naar de groepschatsessie
      - forumgroepen worden gerouteerd naar de algemene onderwerpsessie van de groep (`:topic:1`), niet naar het exacte oorspronkelijke onderwerp

    `allowed_updates` voor polling/Webhook bevatten automatisch `message_reaction`.

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction` verzendt een bevestigings-emoji terwijl OpenClaw een inkomend bericht verwerkt. `ackReactionScope` bepaalt *wanneer* die emoji daadwerkelijk wordt verzonden.

    **Oplosvolgorde voor emoji (`ackReaction`):**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - fallback naar emoji van agentidentiteit (`agents.list[].identity.emoji`, anders "👀")

    Opmerkingen:

    - Telegram verwacht unicode-emoji (bijvoorbeeld "👀").
    - Gebruik `""` om de reactie voor een kanaal of account uit te schakelen.

    **Scope (`messages.ackReactionScope`):**

    De Telegram-provider leest de scope uit `messages.ackReactionScope` (standaard `"group-mentions"`). Er is vandaag geen override op Telegram-account- of Telegram-kanaalniveau.

    Waarden: `"all"` (DM's + groepen), `"direct"` (alleen DM's), `"group-all"` (elk groepsbericht, geen DM's), `"group-mentions"` (groepen wanneer de bot wordt genoemd; **geen DM's** — dit is de standaard), `"off"` / `"none"` (uitgeschakeld).

    <Note>
    De standaardscope (`"group-mentions"`) activeert geen ack-reacties in directe berichten. Stel `messages.ackReactionScope` in op `"direct"` of `"all"` om een ack-reactie te krijgen op inkomende Telegram-DM's. De waarde wordt gelezen bij het opstarten van de Telegram-provider, dus een herstart van de Gateway is nodig om de wijziging van kracht te laten worden.
    </Note>

  </Accordion>

  <Accordion title="Config writes from Telegram events and commands">
    Schrijfacties naar kanaalconfiguratie zijn standaard ingeschakeld (`configWrites !== false`).

    Door Telegram getriggerde schrijfacties omvatten:

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
    Standaard wordt long polling gebruikt. Stel voor Webhook-modus `channels.telegram.webhookUrl` en `channels.telegram.webhookSecret` in; optioneel `webhookPath`, `webhookHost`, `webhookPort` (standaard `/telegram-webhook`, `127.0.0.1`, `8787`).

    In long-polling-modus bewaart OpenClaw zijn herstartwatermerk pas nadat een update succesvol is gedispatcht. Als een handler faalt, blijft die update opnieuw probeerbaar in hetzelfde proces en wordt deze niet als voltooid weggeschreven voor deduplicatie bij herstart.

    De lokale listener bindt aan `127.0.0.1:8787`. Plaats voor publieke ingress een reverse proxy voor de lokale poort of stel bewust `webhookHost: "0.0.0.0"` in.

    Webhook-modus valideert request-guards, het geheime Telegram-token en de JSON-body voordat `200` naar Telegram wordt teruggegeven.
    OpenClaw verwerkt de update daarna asynchroon via dezelfde botlanes per chat/per onderwerp die long polling gebruikt, zodat trage agentbeurten de bezorgings-ACK van Telegram niet ophouden.

  </Accordion>

  <Accordion title="Limieten, opnieuw proberen en CLI-doelen">
    - Standaard is `channels.telegram.textChunkLimit` 4000.
    - `channels.telegram.chunkMode="newline"` geeft de voorkeur aan alineagrenzen (lege regels) voordat op lengte wordt gesplitst.
    - `channels.telegram.mediaMaxMb` (standaard 100) begrenst de grootte van inkomende en uitgaande Telegram-media.
    - `channels.telegram.mediaGroupFlushMs` (standaard 500) bepaalt hoelang Telegram-albums/mediagroepen worden gebufferd voordat OpenClaw ze als één inkomend bericht afhandelt. Verhoog dit als albumonderdelen laat aankomen; verlaag dit om de antwoordlatentie voor albums te verminderen.
    - `channels.telegram.timeoutSeconds` overschrijft de time-out van de Telegram API-client (als deze niet is ingesteld, geldt de standaard van grammY). Botclients klemmen geconfigureerde waarden onder de 60-secondenbeveiliging voor uitgaande tekst-/typverzoeken, zodat grammY de zichtbare antwoordbezorging niet afbreekt voordat de transportbeveiliging en fallback van OpenClaw kunnen worden uitgevoerd. Long polling gebruikt nog steeds een 45-secondenbeveiliging voor `getUpdates`-verzoeken, zodat inactieve polls niet onbeperkt worden verlaten.
    - `channels.telegram.pollingStallThresholdMs` is standaard `120000`; pas alleen aan tussen `30000` en `600000` bij fout-positieve herstarts door vastgelopen polling.
    - groepscontextgeschiedenis gebruikt `channels.telegram.historyLimit` of `messages.groupChat.historyLimit` (standaard 50); `0` schakelt dit uit.
    - aanvullende context voor antwoorden/citaten/doorsturen wordt genormaliseerd naar één geselecteerd gesprekscontextvenster wanneer de Gateway de bovenliggende berichten heeft waargenomen; de cache met waargenomen berichten staat in de OpenClaw SQLite Plugin-status, en `openclaw doctor --fix` importeert legacy-sidecars. Telegram neemt in updates slechts één oppervlakkige `reply_to_message` op, dus ketens ouder dan de cache zijn beperkt tot de huidige updatepayload van Telegram.
    - Telegram-toelatingslijsten bepalen vooral wie de agent kan activeren, niet een volledige redactierand voor aanvullende context.
    - Besturing voor DM-geschiedenis:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry`-configuratie geldt voor Telegram-verzendhelpers (CLI/tools/acties) bij herstelbare uitgaande API-fouten. De bezorging van inkomende eindantwoorden gebruikt ook een begrensde safe-send retry voor Telegram-preconnectfouten, maar probeert geen dubbelzinnige netwerk-enveloppen na verzending opnieuw die zichtbare berichten zouden kunnen dupliceren.

    CLI- en berichttool-verzenddoelen kunnen een numerieke chat-ID, gebruikersnaam of forumtopicdoel zijn:

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

    Alleen-Telegram pollvlaggen:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` voor forumtopics (of gebruik een `:topic:`-doel)

    Telegram-verzenden ondersteunt ook:

    - `--presentation` met `buttons`-blokken voor inline toetsenborden wanneer `channels.telegram.capabilities.inlineButtons` dit toestaat
    - `--pin` of `--delivery '{"pin":true}'` om vastgezette bezorging aan te vragen wanneer de bot in die chat kan vastzetten
    - `--force-document` om uitgaande afbeeldingen, GIF's en video's als documenten te verzenden in plaats van als gecomprimeerde foto-, animated-media- of videouploads

    Actiebegrenzing:

    - `channels.telegram.actions.sendMessage=false` schakelt uitgaande Telegram-berichten uit, inclusief polls
    - `channels.telegram.actions.poll=false` schakelt het maken van Telegram-polls uit terwijl reguliere verzendingen ingeschakeld blijven

  </Accordion>

  <Accordion title="Exec-goedkeuringen in Telegram">
    Telegram ondersteunt exec-goedkeuringen in goedkeurders-DM's en kan optioneel prompts plaatsen in de oorspronkelijke chat of het oorspronkelijke topic. Goedkeurders moeten numerieke Telegram-gebruikers-ID's zijn.

    Configuratiepad:

    - `channels.telegram.execApprovals.enabled` (wordt automatisch ingeschakeld wanneer ten minste één goedkeurder kan worden opgelost)
    - `channels.telegram.execApprovals.approvers` (valt terug op numerieke eigenaar-ID's uit `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (standaard) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` en `defaultTo` bepalen wie met de bot kan praten en waar deze normale antwoorden naartoe stuurt. Ze maken iemand geen exec-goedkeurder. De eerste goedgekeurde DM-koppeling bootstrapt `commands.ownerAllowFrom` wanneer er nog geen opdrachteigenaar bestaat, zodat de setup met één eigenaar nog steeds werkt zonder ID's te dupliceren onder `execApprovals.approvers`.

    Kanaalbezorging toont de opdrachttekst in de chat; schakel `channel` of `both` alleen in vertrouwde groepen/topics in. Wanneer de prompt in een forumtopic terechtkomt, behoudt OpenClaw het topic voor de goedkeuringsprompt en de follow-up. Exec-goedkeuringen verlopen standaard na 30 minuten.

    Inline goedkeuringsknoppen vereisen ook dat `channels.telegram.capabilities.inlineButtons` het doeloppervlak toestaat (`dm`, `group` of `all`). Goedkeurings-ID's met het voorvoegsel `plugin:` worden opgelost via Plugin-goedkeuringen; andere worden eerst via exec-goedkeuringen opgelost.

    Zie [Exec-goedkeuringen](/nl/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Besturing voor foutantwoorden

Wanneer de agent een bezorgings- of providerfout tegenkomt, bepaalt het foutbeleid of foutberichten naar de Telegram-chat worden verzonden:

| Sleutel                             | Waarden                    | Standaard       | Beschrijving                                                                                                                                                                                                 |
| ----------------------------------- | -------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `channels.telegram.errorPolicy`     | `always`, `once`, `silent` | `always`        | `always` — stuur elk foutbericht naar de chat. `once` — stuur elk uniek foutbericht één keer per cooldownvenster (onderdruk herhaalde identieke fouten). `silent` — stuur nooit foutberichten naar de chat. |
| `channels.telegram.errorCooldownMs` | getal (ms)                 | `14400000` (4 u) | Cooldownvenster voor het `once`-beleid. Nadat een fout is verzonden, wordt hetzelfde foutbericht onderdrukt totdat dit interval is verstreken. Voorkomt foutspam tijdens storingen.                         |

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

## Problemen oplossen

<AccordionGroup>
  <Accordion title="Bot reageert niet op groepsberichten zonder vermelding">

    - Als `requireMention=false`, moet de privacymodus van Telegram volledige zichtbaarheid toestaan.
      - BotFather: `/setprivacy` -> Disable
      - verwijder daarna de bot uit de groep en voeg deze opnieuw toe
    - `openclaw channels status` waarschuwt wanneer de configuratie groepsberichten zonder vermelding verwacht.
    - `openclaw channels status --probe` kan expliciete numerieke groeps-ID's controleren; wildcard `"*"` kan niet op lidmaatschap worden geprobed.
    - snelle sessietest: `/activation always`.

  </Accordion>

  <Accordion title="Bot ziet helemaal geen groepsberichten">

    - wanneer `channels.telegram.groups` bestaat, moet de groep worden vermeld (of `"*"` bevatten)
    - verifieer botlidmaatschap in de groep
    - bekijk logs: `openclaw logs --follow` voor redenen waarom berichten worden overgeslagen

  </Accordion>

  <Accordion title="Opdrachten werken gedeeltelijk of helemaal niet">

    - autoriseer je afzenderidentiteit (koppeling en/of numerieke `allowFrom`)
    - opdrachtautorisatie blijft gelden, zelfs wanneer groepsbeleid `open` is
    - `setMyCommands failed` met `BOT_COMMANDS_TOO_MUCH` betekent dat het native menu te veel items heeft; verminder Plugin-/skill-/aangepaste opdrachten of schakel native menu's uit
    - `deleteMyCommands` / `setMyCommands`-opstartaanroepen en `sendChatAction`-typaangroepen zijn begrensd en proberen één keer opnieuw via Telegram's transportfallback bij verzoektime-out. Aanhoudende netwerk-/fetchfouten duiden meestal op DNS-/HTTPS-bereikbaarheidsproblemen naar `api.telegram.org`

  </Accordion>

  <Accordion title="Opstart meldt ongeautoriseerd token">

    - `getMe returned 401` is een Telegram-authenticatiefout voor het geconfigureerde bottoken.
    - Kopieer het bottoken opnieuw of genereer het opnieuw in BotFather, en werk daarna `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` of `TELEGRAM_BOT_TOKEN` bij voor het standaardaccount.
    - `deleteWebhook 401 Unauthorized` tijdens opstarten is ook een authenticatiefout; dit behandelen als "er bestaat geen Webhook" zou dezelfde fout door een ongeldig token alleen uitstellen tot latere API-aanroepen.

  </Accordion>

  <Accordion title="Polling- of netwerkinstabiliteit">

    - Node 22+ + aangepaste fetch/proxy kan onmiddellijk afbreekgedrag activeren als AbortSignal-typen niet overeenkomen.
    - Sommige hosts lossen `api.telegram.org` eerst op naar IPv6; kapotte IPv6-egress kan intermitterende Telegram API-fouten veroorzaken.
    - Als logs `TypeError: fetch failed` of `Network request for 'getUpdates' failed!` bevatten, probeert OpenClaw deze nu opnieuw als herstelbare netwerkfouten.
    - Tijdens het opstarten van polling hergebruikt OpenClaw de succesvolle opstartprobe `getMe` voor grammY, zodat de runner geen tweede `getMe` nodig heeft vóór de eerste `getUpdates`.
    - Als `deleteWebhook` mislukt met een tijdelijke netwerkfout tijdens het opstarten van polling, gaat OpenClaw door naar long polling in plaats van nog een pre-poll control-plane-aanroep te doen. Een nog actieve Webhook verschijnt als een `getUpdates`-conflict; OpenClaw bouwt daarna het Telegram-transport opnieuw op en probeert Webhook-opschoning opnieuw.
    - Als Telegram-sockets volgens een korte vaste cadans recyclen, controleer dan op een lage `channels.telegram.timeoutSeconds`; botclients klemmen geconfigureerde waarden onder de beveiligingen voor uitgaande verzoeken en `getUpdates`-verzoeken, maar oudere releases konden elke poll of elk antwoord afbreken wanneer dit onder die beveiligingen was ingesteld.
    - Als logs `Polling stall detected` bevatten, herstart OpenClaw polling en bouwt het Telegram-transport standaard opnieuw op na 120 seconden zonder voltooide long-poll-liveness.
    - `openclaw channels status --probe` en `openclaw doctor` waarschuwen wanneer een actief pollingaccount `getUpdates` niet heeft voltooid na de opstartgratie, wanneer een actief Webhook-account `setWebhook` niet heeft voltooid na de opstartgratie, of wanneer de laatste succesvolle pollingtransportactiviteit verouderd is.
    - Verhoog `channels.telegram.pollingStallThresholdMs` alleen wanneer langlopende `getUpdates`-aanroepen gezond zijn maar je host nog steeds foutieve herstarts wegens vastgelopen polling meldt. Aanhoudende stalls wijzen meestal op proxy-, DNS-, IPv6- of TLS-egressproblemen tussen de host en `api.telegram.org`.
    - Telegram respecteert ook procesproxy-env voor Bot API-transport, inclusief `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` en hun varianten in kleine letters. `NO_PROXY` / `no_proxy` kan `api.telegram.org` nog steeds omzeilen.
    - Als de door OpenClaw beheerde proxy via `OPENCLAW_PROXY_URL` is geconfigureerd voor een serviceomgeving en er geen standaard proxy-env aanwezig is, gebruikt Telegram die URL ook voor Bot API-transport.
    - Leid Telegram API-aanroepen op VPS-hosts met onstabiele directe egress/TLS via `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ gebruikt standaard `autoSelectFamily=true` (behalve WSL2). De volgorde van Telegram-DNS-resultaten respecteert `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, daarna `channels.telegram.network.dnsResultOrder`, daarna de processtandaard zoals `NODE_OPTIONS=--dns-result-order=ipv4first`; als geen daarvan van toepassing is, valt Node 22+ terug op `ipv4first`.
    - Als je host WSL2 is of expliciet beter werkt met alleen-IPv4-gedrag, forceer dan familieselectie:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Antwoorden uit het RFC 2544-benchmarkbereik (`198.18.0.0/15`) zijn
      standaard al toegestaan voor Telegram-mediadownloads. Als een vertrouwde fake-IP- of
      transparante proxy `api.telegram.org` tijdens mediadownloads herschrijft naar een ander
      privé/intern/speciaal adres, kun je je aanmelden voor de alleen-Telegram-bypass:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Dezelfde opt-in is per account beschikbaar op
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Als je proxy Telegram-mediahosts naar `198.18.x.x` resolved, laat dan eerst de
      gevaarlijke vlag uit. Telegram-media staat het RFC 2544-
      benchmarkbereik standaard al toe.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` verzwakt de SSRF-bescherming
      voor Telegram-media. Gebruik dit alleen voor vertrouwde, door operators beheerde proxy-
      omgevingen zoals Clash-, Mihomo- of Surge-fake-IP-routing wanneer die
      privé- of speciale antwoorden buiten het RFC 2544-benchmark-
      bereik synthetiseren. Laat dit uit voor normale publieke internettoegang tot Telegram.
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

<Accordion title="Telegram-velden met hoge signaalwaarde">

- opstarten/auth: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` moet naar een regulier bestand verwijzen; symlinks worden geweigerd)
- toegangscontrole: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` op topniveau (`type: "acp"`)
- topicstandaarden: `groups.<chatId>.topics."*"` is van toepassing op niet-gematchte forumtopics; exacte topic-ID's overschrijven dit
- exec-goedkeuringen: `execApprovals`, `accounts.*.execApprovals`
- commando/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- threads/antwoorden: `replyToMode`
- streaming: `streaming` (preview), `streaming.preview.toolProgress`, `blockStreaming`
- opmaak/bezorging: `textChunkLimit`, `chunkMode`, `richMessages`, `linkPreview`, `responsePrefix`
- media/netwerk: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- aangepaste API-root: `apiRoot` (alleen Bot API-root; neem `/bot<TOKEN>` niet op)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- acties/capaciteiten: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reacties: `reactionNotifications`, `reactionLevel`
- fouten: `errorPolicy`, `errorCooldownMs`
- schrijfacties/geschiedenis: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Voorrang bij meerdere accounts: wanneer twee of meer account-ID's zijn geconfigureerd, stel `channels.telegram.defaultAccount` in (of neem `channels.telegram.accounts.default` op) om standaardroutering expliciet te maken. Anders valt OpenClaw terug op de eerste genormaliseerde account-ID en waarschuwt `openclaw doctor`. Benoemde accounts erven `channels.telegram.allowFrom` / `groupAllowFrom`, maar geen waarden van `accounts.default.*`.
</Note>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Koppelen" icon="link" href="/nl/channels/pairing">
    Koppel een Telegram-gebruiker aan de Gateway.
  </Card>
  <Card title="Groepen" icon="users" href="/nl/channels/groups">
    Gedrag van allowlists voor groepen en topics.
  </Card>
  <Card title="Kanaalroutering" icon="route" href="/nl/channels/channel-routing">
    Routeer inkomende berichten naar agents.
  </Card>
  <Card title="Beveiliging" icon="shield" href="/nl/gateway/security">
    Dreigingsmodel en hardening.
  </Card>
  <Card title="Routering met meerdere agents" icon="sitemap" href="/nl/concepts/multi-agent">
    Koppel groepen en topics aan agents.
  </Card>
  <Card title="Probleemoplossing" icon="wrench" href="/nl/channels/troubleshooting">
    Kanaaloverschrijdende diagnostiek.
  </Card>
</CardGroup>
