---
read_when:
    - Werken aan Telegram-functies of webhooks
summary: Status, mogelijkheden en configuratie van Telegram-botondersteuning
title: Telegram
x-i18n:
    generated_at: "2026-07-16T15:24:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 51c155afeb147b92a55f181be269ce13c4fd6b609a94d680cd7e091cd4a7c236
    source_path: channels/telegram.md
    workflow: 16
---

Productierijp voor bot-DM's en groepen via grammY. Long polling is het standaardtransport; de webhookmodus is optioneel.

<CardGroup cols={3}>
  <Card title="Koppelen" icon="link" href="/nl/channels/pairing">
    Het standaard-DM-beleid voor Telegram is koppelen.
  </Card>
  <Card title="Kanaalproblemen oplossen" icon="wrench" href="/nl/channels/troubleshooting">
    Diagnose- en herstelprocedures voor meerdere kanalen.
  </Card>
  <Card title="Gateway-configuratie" icon="settings" href="/nl/gateway/configuration">
    Volledige configuratiepatronen en voorbeelden voor kanalen.
  </Card>
</CardGroup>

## Snelle installatie

<Steps>
  <Step title="Maak het bottoken aan in BotFather">
    Beide methoden leveren een token op dat je in OpenClaw plakt — kies er één:

    - **Chatmethode**: open Telegram, chat met **@BotFather** (controleer of de gebruikersnaam exact `@BotFather` is), voer `/newbot` uit, volg de aanwijzingen en bewaar het token.
    - **Webmethode**: open [de webapp van BotFather](https://t.me/BotFather?startapp) — deze werkt in elke Telegram-client, waaronder [web.telegram.org](https://web.telegram.org) — maak de bot aan in de gebruikersinterface en kopieer het token.

  </Step>

  <Step title="Configureer het token en DM-beleid">

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

    Terugval via omgevingsvariabele: `TELEGRAM_BOT_TOKEN` (alleen voor het standaardaccount; benoemde accounts moeten `botToken` of `tokenFile` gebruiken).
    Telegram gebruikt `openclaw channels login telegram` **niet**; stel het token in via de configuratie of omgeving en start vervolgens de Gateway.

  </Step>

  <Step title="Start de Gateway en keur de eerste DM goed">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Koppelcodes verlopen na 1 uur.

  </Step>

  <Step title="Voeg de bot toe aan een groep">
    Voeg de bot toe aan je groep en haal vervolgens de twee ID's op die nodig zijn voor groepstoegang:

    - je Telegram-gebruikers-ID, voor `allowFrom` / `groupAllowFrom`
    - de chat-ID van de Telegram-groep, als sleutel onder `channels.telegram.groups`

    Haal de groepschat-ID op via `openclaw logs --follow`, een bot voor doorgestuurde ID's of `getUpdates` van de Bot API. Nadat de groep is toegestaan, bevestigt `/whoami@<bot_username>` de gebruikers- en groeps-ID's.

    Negatieve supergroep-ID's die beginnen met `-100` zijn groepschat-ID's. Ze horen onder `channels.telegram.groups`, niet onder `groupAllowFrom`.

  </Step>
</Steps>

<Note>
Tokenresolutie houdt rekening met het account: `tokenFile` heeft voorrang op `botToken`, dat weer voorrang heeft op de omgeving, en de configuratie heeft altijd voorrang op `TELEGRAM_BOT_TOKEN` (dat alleen voor het standaardaccount wordt opgelost). Na een geslaagde start bewaart OpenClaw de botidentiteit maximaal 24 uur in de cache, zodat bij herstarts een extra aanroep van `getMe` wordt overgeslagen; als het token wordt gewijzigd of verwijderd, wordt die cache gewist.
</Note>

## Instellingen aan de Telegram-zijde

<AccordionGroup>
  <Accordion title="Privacymodus en zichtbaarheid in groepen">
    Telegram-bots gebruiken standaard **Privacy Mode**, waardoor ze slechts een deel van de groepsberichten ontvangen.

    Om alle groepsberichten te zien, kun je:

    - de privacymodus uitschakelen via `/setprivacy`, of
    - de bot groepsbeheerder maken.

    Nadat je de privacymodus hebt omgeschakeld, moet je de bot uit elke groep verwijderen en opnieuw toevoegen, zodat Telegram de wijziging toepast.

  </Accordion>

  <Accordion title="Groepsmachtigingen">
    De beheerdersstatus wordt geregeld in de groepsinstellingen van Telegram. Bots die beheerder zijn, ontvangen alle groepsberichten, wat nuttig is voor permanent actief groepsgedrag.
  </Accordion>

  <Accordion title="Handige BotFather-schakelaars">

    - `/setjoingroups` — toevoegen aan groepen toestaan/weigeren
    - `/setprivacy` — zichtbaarheidsinstellingen voor groepen

    Dezelfde instellingen zijn beschikbaar in [de webapp van BotFather](https://t.me/BotFather?startapp) als je liever een gebruikersinterface gebruikt dan chatopdrachten.

  </Accordion>
</AccordionGroup>

## Dashboard-Mini App

Voer `/dashboard` uit in een DM met de bot om het OpenClaw-dashboard binnen Telegram te openen.

Vereisten:

- `gateway.tailscale.mode: "serve"` of `"funnel"` voor de gepubliceerde HTTPS-URL van de Mini App.
- Je numerieke Telegram-gebruikers-ID moet voorkomen in de effectieve `allowFrom` van het geselecteerde account of in `commands.ownerAllowFrom`.
- Gebruik een DM. In groepen antwoordt `/dashboard` met `open this in a DM with the bot` en wordt geen knop verzonden.
- Docker-installaties: voor de modi Serve/Funnel moet de Gateway naast `tailscaled` aan loopback worden gebonden; bridge-netwerken met gepubliceerde poorten kunnen hier niet aan voldoen. Voer de Gateway-container uit met `network_mode: host` en koppel de `tailscaled`-socket van de host (`/var/run/tailscale`) plus de `tailscale`-CLI in de container.

De Mini App is een v1-route die alleen via Tailscale werkt en ondersteunt geen iframe in Telegram Web.

## Toegangsbeheer en activering

### Botidentiteit in groepen

In groepen en forumonderwerpen richt een expliciete vermelding van de geconfigureerde botgebruikersnaam (bijvoorbeeld `@my_bot`) zich tot de geselecteerde OpenClaw-agent, zelfs wanneer de personanaam van de agent afwijkt van de Telegram-gebruikersnaam. Het beleid voor stilte in groepen blijft van toepassing op niet-gerelateerd verkeer, maar de botgebruikersnaam zelf is nooit „iemand anders”.

<Tabs>
  <Tab title="DM-beleid">
    `channels.telegram.dmPolicy` beheert de toegang tot directe berichten:

    - `pairing` (standaard)
    - `allowlist` (vereist ten minste één afzender-ID in `allowFrom`)
    - `open` (vereist dat `allowFrom` `"*"` bevat)
    - `disabled`

    Met `dmPolicy: "open"` en `allowFrom: ["*"]` kan elk Telegram-account dat de gebruikersnaam van de bot vindt of raadt, opdrachten aan de bot geven. Gebruik dit alleen voor bewust openbare bots met strikt beperkte hulpmiddelen; bots met één eigenaar moeten `allowlist` met numerieke gebruikers-ID's gebruiken.

    `channels.telegram.allowFrom` accepteert numerieke Telegram-gebruikers-ID's. De voorvoegsels `telegram:` / `tg:` worden geaccepteerd en genormaliseerd.
    In configuraties met meerdere accounts vormt een beperkende `channels.telegram.allowFrom` op het hoogste niveau een veiligheidsgrens: een `allowFrom: ["*"]` op accountniveau maakt dat account niet openbaar, tenzij de samengevoegde effectieve toelatingslijst nog steeds een expliciet jokerteken bevat.
    `dmPolicy: "allowlist"` met een lege `allowFrom` blokkeert alle DM's en wordt door de configuratievalidatie geweigerd.
    Tijdens de installatie wordt alleen om numerieke gebruikers-ID's gevraagd. Als je configuratie vermeldingen in de toelatingslijst van `@username` uit een oudere installatie bevat, voer je `openclaw doctor --fix` uit om deze om te zetten in numerieke ID's (voor zover mogelijk; vereist een Telegram-bottoken).
    Als je eerder afhankelijk was van toelatingslijstbestanden uit de koppelopslag, kan `openclaw doctor --fix` vermeldingen herstellen naar `channels.telegram.allowFrom` voor processen met toelatingslijsten (bijvoorbeeld wanneer `dmPolicy: "allowlist"` nog geen expliciete ID's bevat).

    Geef voor bots met één eigenaar de voorkeur aan `dmPolicy: "allowlist"` met expliciete numerieke `allowFrom`-ID's, in plaats van te vertrouwen op eerdere koppelgoedkeuringen.

    Veelvoorkomende verwarring: goedkeuring van DM-koppeling betekent niet „deze afzender is overal geautoriseerd”. Koppelen verleent alleen toegang tot DM's. Als er nog geen eigenaar voor opdrachten bestaat, stelt de eerste goedgekeurde koppeling ook `commands.ownerAllowFrom` in, waardoor opdrachten die alleen voor de eigenaar zijn en uitvoeringsgoedkeuringen aan een expliciet operatoraccount worden gekoppeld. Autorisatie van afzenders in groepen komt nog steeds uit expliciete toelatingslijsten in de configuratie.
    Om met één identiteit te zijn geautoriseerd voor zowel DM's als groepsopdrachten: plaats je numerieke Telegram-gebruikers-ID in `channels.telegram.allowFrom` en zorg er voor opdrachten die alleen voor de eigenaar zijn voor dat `commands.ownerAllowFrom` `telegram:<your user id>` bevat.

    ### Je Telegram-gebruikers-ID vinden

    Veiliger (geen bot van derden): stuur je bot een DM, voer `openclaw logs --follow` uit en lees `from.id`.

    Officiële Bot API-methode:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Derde partij (minder privé): `@userinfobot` of `@getidsbot`.

  </Tab>

  <Tab title="Groepsbeleid en toelatingslijsten">
    Twee instellingen zijn gezamenlijk van toepassing:

    1. **Welke groepen zijn toegestaan** (`channels.telegram.groups`)
       - geen `groups`-configuratie, `groupPolicy: "open"`: elke groep doorstaat de controles van groeps-ID's
       - geen `groups`-configuratie, `groupPolicy: "allowlist"` (standaard): alle groepen worden geblokkeerd totdat je `groups`-vermeldingen (of `"*"`) toevoegt
       - `groups` geconfigureerd: fungeert als toelatingslijst (expliciete ID's of `"*"`)

    2. **Welke afzenders zijn toegestaan in groepen** (`channels.telegram.groupPolicy`)
       - `open` / `allowlist` (standaard) / `disabled`

    `groupAllowFrom` filtert afzenders in groepen; als dit niet is ingesteld, valt Telegram terug op `allowFrom` (niet op de koppelopslag — autorisatie van groepsafzenders neemt nooit goedkeuringen uit de DM-koppelopslag over, een veiligheidsgrens sinds `2026.2.25`).
    Vermeldingen in `groupAllowFrom` moeten numerieke Telegram-gebruikers-ID's zijn (de voorvoegsels `telegram:` / `tg:` worden genormaliseerd); niet-numerieke vermeldingen worden genegeerd. Plaats hier geen chat-ID's van groepen of supergroepen — negatieve chat-ID's horen onder `channels.telegram.groups`.
    Praktisch patroon voor bots met één eigenaar: stel je gebruikers-ID in bij `channels.telegram.allowFrom`, laat `groupAllowFrom` oningesteld en sta de doelgroepen toe onder `channels.telegram.groups`.
    Als `channels.telegram` volledig ontbreekt in de configuratie, gebruikt de runtime standaard het fail-closed-beleid `groupPolicy="allowlist"`, tenzij `channels.defaults.groupPolicy` expliciet is ingesteld.

    Groepsconfiguratie voor alleen de eigenaar:

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

    Test vanuit de groep met `@<bot_username> ping`. Gewone groepsberichten activeren de bot niet zolang `requireMention: true`.

    Elk lid in één specifieke groep toestaan:

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

    Alleen specifieke gebruikers binnen één specifieke groep toestaan:

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
      Veelgemaakte fout: `groupAllowFrom` is geen toelatingslijst voor groepen.

      - Negatieve chat-ID's van Telegram-groepen/-supergroepen (`-1001234567890`) horen onder `channels.telegram.groups`.
      - Telegram-gebruikers-ID's (`8734062810`) horen onder `groupAllowFrom` om te beperken welke personen binnen een toegestane groep de bot kunnen activeren.
      - Gebruik `groupAllowFrom: ["*"]` alleen om elk lid van een toegestane groep met de bot te laten praten.

    </Warning>

  </Tab>

  <Tab title="Vermeldingsgedrag">
    Antwoorden in groepen vereisen standaard een vermelding. Een vermelding kan afkomstig zijn van:

    - een systeemeigen `@botusername`-vermelding, of
    - een vermeldingspatroon in `agents.list[].groupChat.mentionPatterns` of `messages.groupChat.mentionPatterns`

    Schakelaars op sessieniveau (alleen status, niet permanent opgeslagen): `/activation always`, `/activation mention`. Gebruik de configuratie om dit permanent op te slaan:

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

    Context uit de groepsgeschiedenis is altijd ingeschakeld en wordt begrensd door `historyLimit`. Stel `channels.telegram.historyLimit: 0` in om het venster voor groepsgeschiedenis uit te schakelen. `openclaw doctor --fix` verwijdert de uitgefaseerde sleutel `includeGroupHistoryContext`.

    De groepschat-ID ophalen: stuur een groepsbericht door naar `@userinfobot` / `@getidsbot`, lees `chat.id` uit `openclaw logs --follow`, inspecteer `getUpdates` van de Bot API of voer `/whoami@<bot_username>` uit zodra de groep is toegestaan.

  </Tab>
</Tabs>

## Runtimegedrag

- Telegram wordt uitgevoerd binnen het Gateway-proces.
- Routering is deterministisch: inkomende Telegram-antwoorden gaan terug naar Telegram (het model kiest geen kanalen).
- Inkomende berichten worden genormaliseerd naar de gedeelde kanaalenvelop met antwoordmetadata, mediaplaatshouders en opgeslagen antwoordketencontext voor antwoorden die de Gateway heeft waargenomen.
- Groepssessies worden geïsoleerd op groeps-ID. Bij forumonderwerpen wordt `:topic:<threadId>` toegevoegd.
- Privéberichten kunnen `message_thread_id` bevatten; OpenClaw behoudt dit voor antwoorden. Onderwerpsessies voor privéberichten worden alleen opgesplitst wanneer Telegram `getMe` `has_topics_enabled: true` rapporteert voor de bot; anders blijven privéberichten in de vlakke sessie.
- Long polling gebruikt de grammY-runner met sequentiële verwerking per chat/thread. De gelijktijdigheid van de runner-sink gebruikt `agents.defaults.maxConcurrent`.
- Bij het starten met meerdere accounts wordt het aantal gelijktijdige `getMe`-controles begrensd, zodat grote botvloten niet alle accountcontroles tegelijk uitvoeren.
- Elk Gateway-proces beveiligt long polling, zodat slechts één actieve poller tegelijk een bottoken kan gebruiken. Aanhoudende `getUpdates` 409-conflicten wijzen op een andere OpenClaw-Gateway, een script of een externe poller die hetzelfde token gebruikt.
- De polling-watchdog start standaard opnieuw na 120 seconden zonder voltooide `getUpdates`-activiteit. Verhoog `channels.telegram.pollingStallThresholdMs` (30000-600000, overschrijvingen per account worden ondersteund) alleen als je implementatie tijdens langdurige taken onterechte herstarts wegens vastgelopen polling ondervindt.
- De Telegram Bot API ondersteunt geen leesbevestigingen (`sendReadReceipts` is niet van toepassing).

<Note>
  `channels.telegram.dm.threadReplies` en `channels.telegram.direct.<chatId>.threadReplies` zijn verwijderd. Voer na het upgraden `openclaw doctor --fix` uit als je configuratie deze sleutels nog bevat. De routering van onderwerpen in privéberichten volgt nu Telegram `getMe.has_topics_enabled` (aangestuurd door de threaded mode van BotFather): bots waarvoor onderwerpen zijn ingeschakeld, gebruiken threadgebonden sessies voor privéberichten wanneer Telegram `message_thread_id` verzendt; andere privéberichten blijven in de vlakke sessie.
</Note>

## Functieoverzicht

<AccordionGroup>
  <Accordion title="Livestreamvoorbeeld (berichtbewerkingen)">
    OpenClaw streamt gedeeltelijke antwoorden in realtime in directe chats, groepen en onderwerpen: het verzendt een voorbeeldbericht, voert vervolgens herhaaldelijk `editMessageText` uit en rondt het bericht ter plekke af.

    - `channels.telegram.streaming` is `off | partial | block | progress` (standaard: `partial`)
    - korte eerste antwoordvoorbeelden worden gedebounced en vervolgens na een begrensde vertraging daadwerkelijk weergegeven als de uitvoering nog actief is
    - `progress` houdt één bewerkbaar statusconcept bij voor de voortgang van hulpmiddelen, toont het stabiele statuslabel wanneer antwoordactiviteit vóór hulpmiddelvoortgang binnenkomt, wist het bij voltooiing en verzendt het definitieve antwoord als een normaal bericht
    - `streaming.preview.toolProgress` bepaalt of updates over hulpmiddelen/voortgang hetzelfde bewerkte voorbeeldbericht hergebruiken (standaard: `true` wanneer voorbeeldstreaming actief is)
    - `streaming.preview.commandText` bepaalt de details van opdrachten/uitvoering binnen die regels: `raw` (standaard) of `status` (alleen het hulpmiddellabel)
    - `streaming.progress.commentary` (standaard: `false`) schakelt commentaar-/inleidingstekst van de assistent in het tijdelijke voortgangsconcept in
    - verouderde `channels.telegram.streamMode`-waarden, booleaanse `streaming`-waarden en ingetrokken systeemeigen sleutels voor conceptvoorbeelden worden gedetecteerd; voer `openclaw doctor --fix` uit om ze te migreren

    Regels voor hulpmiddelvoortgang zijn de korte statusupdates die worden weergegeven terwijl hulpmiddelen worden uitgevoerd (opdrachtuitvoering, bestandslezingen, planningsupdates, patchsamenvattingen en Codex-inleidingen/-commentaar in app-servermodus). Telegram houdt deze standaard ingeschakeld (dit komt overeen met het uitgebrachte gedrag vanaf `v2026.4.22`+).

    Behoud bewerkingen van antwoordvoorbeelden, maar verberg regels voor hulpmiddelvoortgang:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": { "toolProgress": false }
          }
        }
      }
    }
    ```

    Houd hulpmiddelvoortgang zichtbaar, maar verberg tekst van opdrachten/uitvoering:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": { "commandText": "status" }
          }
        }
      }
    }
    ```

    De modus `progress` toont hulpmiddelvoortgang zonder het definitieve antwoord in dat bericht te bewerken. Plaats het beleid voor opdrachttekst onder `streaming.progress`:

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

    `streaming.mode: "off"` schakelt voorbeeldbewerkingen uit en onderdrukt algemene meldingen over hulpmiddelen/voortgang in plaats van ze als afzonderlijke statusberichten te verzenden; goedkeuringsverzoeken, media en fouten worden nog steeds via de normale definitieve aflevering gerouteerd. `streaming.preview.toolProgress: false` behoudt alleen bewerkingen van antwoordvoorbeelden.

    <Note>
      Antwoorden op geselecteerde citaten vormen de uitzondering. Wanneer `replyToMode` `first`, `all` of `batched` is en het inkomende bericht geselecteerde citaattekst bevat, verzendt OpenClaw het definitieve antwoord via het systeemeigen pad van Telegram voor antwoorden met citaten in plaats van het antwoordvoorbeeld te bewerken, zodat `streaming.preview.toolProgress` tijdens die beurt geen statusregels kan weergeven. Antwoorden op het huidige bericht zonder geselecteerde citaattekst worden nog steeds gestreamd. Stel `replyToMode: "off"` in wanneer de zichtbaarheid van hulpmiddelvoortgang belangrijker is dan systeemeigen antwoorden met citaten, of `streaming.preview.toolProgress: false` om die afweging te accepteren.
    </Note>

    Voor antwoorden met alleen tekst: korte voorbeelden krijgen de definitieve bewerking ter plekke; lange definitieve antwoorden die over meerdere berichten worden verdeeld, hergebruiken het voorbeeld als eerste fragment en verzenden vervolgens alleen de rest; definitieve antwoorden in voortgangsmodus wissen het statusconcept en gebruiken de normale definitieve aflevering; als de definitieve bewerking mislukt voordat de voltooiing is bevestigd, valt OpenClaw terug op de normale definitieve aflevering en ruimt het verouderde voorbeeld op. Voor complexe antwoorden (mediapayloads) valt OpenClaw altijd terug op de normale definitieve aflevering en ruimt het voorbeeld op.

    Voorbeeldstreaming en blokstreaming sluiten elkaar uit — wanneer blokstreaming expliciet is ingeschakeld, slaat OpenClaw de voorbeeldstream over om dubbele streaming te voorkomen.

    Redenering: `/reasoning stream` streamt de redenering tijdens het genereren naar het livevoorbeeld en verwijdert vervolgens het redeneringsvoorbeeld na de definitieve aflevering (gebruik `/reasoning on` om het zichtbaar te houden). Het definitieve antwoord wordt zonder redeneringstekst verzonden.

  </Accordion>

  <Accordion title="Uitgebreide berichtopmaak">
    Uitgaande tekst gebruikt standaard reguliere Telegram HTML-berichten, leesbaar in huidige clients: vet, cursief, links, code, spoilers, citaten — geen uitgebreide blokken die alleen door Bot API 10.2 worden ondersteund (systeemeigen tabellen, details, rich media, formules).

    Schakel uitgebreide Bot API 10.2-berichten in:

```json5
{
  channels: {
    telegram: {
      richMessages: true,
    },
  },
}
```

    Indien ingeschakeld: de agent krijgt te horen dat uitgebreide berichten beschikbaar zijn voor deze bot/dit account (met het ondersteunde auteurscontract voor Markdown + HTML-islands); Markdown-tekst wordt via de Markdown IR van OpenClaw weergegeven als getypeerde uitgebreide blokken van Bot API 10.2 (koppen, tabellen, details, controlelijsten, rich media, formules, kaarten, collages); mediabijschriften blijven Telegram HTML-bijschriften gebruiken (uitgebreide berichten vervangen bijschriften niet en bijschriften zijn beperkt tot 1024 tekens).

    Hierdoor blijft modeltekst uit de buurt van Telegram-markeringen voor uitgebreide Markdown, zodat valuta zoals `$400-600K` niet als wiskunde wordt geïnterpreteerd. Lange uitgebreide tekst wordt automatisch opgesplitst volgens de limieten van Telegram. Tabellen die de limiet van 20 kolommen overschrijden, vallen terug op een codeblok.

    Standaard: uitgeschakeld, voor clientcompatibiliteit — sommige huidige Desktop-, Web-, Android- en externe clients geven geaccepteerde uitgebreide berichten weer als niet-ondersteund. Houd dit uitgeschakeld tenzij elke client die met de bot wordt gebruikt ze kan weergeven. `/status` toont of uitgebreide berichten voor de huidige sessie zijn in- of uitgeschakeld.

    Linkvoorbeelden zijn standaard ingeschakeld. `channels.telegram.linkPreview: false` schakelt automatische entiteitsdetectie voor uitgebreide tekst uit.

  </Accordion>

  <Accordion title="Systeemeigen opdrachten en aangepaste opdrachten">
    Het opdrachtenmenu van Telegram wordt bij het opstarten geregistreerd met `setMyCommands`. `commands.native: "auto"` schakelt systeemeigen opdrachten voor Telegram in.

    Voeg aangepaste vermeldingen aan het opdrachtenmenu toe:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Git-back-up" },
        { command: "generate", description: "Een afbeelding maken" },
      ],
    },
  },
}
```

    Regels: namen worden genormaliseerd (voorafgaande `/` verwijderen, omzetten naar kleine letters); geldig patroon `a-z`, `0-9`, `_`, lengte 1-32; aangepaste opdrachten kunnen systeemeigen opdrachten niet overschrijven; conflicten/dubbele vermeldingen worden overgeslagen en gelogd.

    Aangepaste opdrachten zijn alleen menuvermeldingen — ze implementeren niet automatisch gedrag. Plugin-/Skills-opdrachten kunnen nog steeds werken wanneer ze worden getypt, zelfs als ze niet in het Telegram-menu worden weergegeven. Als systeemeigen opdrachten zijn uitgeschakeld, worden ingebouwde opdrachten verwijderd; aangepaste/Plugin-opdrachten kunnen nog steeds worden geregistreerd als ze zijn geconfigureerd.

    Veelvoorkomende instellingsfouten:

    - `setMyCommands failed` met `BOT_COMMANDS_TOO_MUCH` na een nieuwe poging met ingekorte inhoud betekent dat het menu nog steeds te groot is; verminder het aantal Plugin-/Skills-/aangepaste opdrachten of schakel `channels.telegram.commands.native` uit.
    - Als `deleteWebhook`, `deleteMyCommands` of `setMyCommands` mislukt met `404: Not Found`, terwijl directe Bot API-curl-opdrachten wel werken, betekent dit meestal dat `channels.telegram.apiRoot` was ingesteld op het volledige `/bot<TOKEN>`-eindpunt. `apiRoot` mag alleen de hoofd-URL van de Bot API zijn; `openclaw doctor --fix` verwijdert een per ongeluk toegevoegde afsluitende `/bot<TOKEN>`.
    - `getMe returned 401` betekent dat Telegram het geconfigureerde bottoken heeft geweigerd. Werk `botToken`, `tokenFile` of `TELEGRAM_BOT_TOKEN` (standaardaccount) bij met het huidige BotFather-token; OpenClaw stopt vóór het pollen, zodat dit niet als een fout bij het opschonen van de Webhook wordt gemeld.
    - `setMyCommands failed` met netwerk-/ophaalfouten betekent meestal dat uitgaande DNS/HTTPS naar `api.telegram.org` wordt geblokkeerd.

    ### Opdrachten voor apparaatkoppeling (`device-pair`-Plugin)

    Indien geïnstalleerd:

    1. `/pair` genereert een installatiecode
    2. plak de code in de iOS-app
    3. `/pair pending` toont openstaande verzoeken (inclusief rol/bereiken)
    4. goedkeuren: `/pair approve <requestId>`, `/pair approve` (enige openstaande verzoek) of `/pair approve latest`

    Als een apparaat het opnieuw probeert met gewijzigde verificatiegegevens (rol, bereiken, openbare sleutel), wordt het vorige openstaande verzoek vervangen door een nieuwe `requestId`; voer `/pair pending` opnieuw uit voordat je het goedkeurt.

    Meer informatie: [Koppelen](/nl/channels/pairing#pair-via-telegram).

  </Accordion>

  <Accordion title="Inlineknoppen">
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

    Bereiken: `off`, `dm`, `group`, `all`, `allowlist` (standaard). Verouderde `capabilities: ["inlineButtons"]` wordt toegewezen aan `"all"`.

    Voorbeeld van een berichtactie:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Kies een optie:",
  buttons: [
    [
      { text: "Ja", callback_data: "yes" },
      { text: "Nee", callback_data: "no" },
    ],
    [{ text: "Annuleren", callback_data: "cancel" }],
  ],
}
```

    Voorbeeld van een Mini App-knop:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "App openen:",
  presentation: {
    blocks: [
      {
        type: "buttons",
        buttons: [{ label: "Starten", web_app: { url: "https://example.com/app" } }],
      },
    ],
  },
}
```

    `web_app`-knoppen werken alleen in privéchats tussen een gebruiker en de bot.

    Callbackklikken die niet worden geclaimd door een geregistreerde interactieve Plugin-handler, worden als tekst doorgegeven aan de agent: `callback_data: <value>`.

  </Accordion>

  <Accordion title="Telegram-berichtacties voor agents en automatisering">
    Acties:

    - `sendMessage` (`to`, `content`, optioneel `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content` of `caption`, optionele `presentation` inlineknoppen; bewerkingen met alleen knoppen werken de antwoordmarkering bij)
    - `createForumTopic` (`chatId`, `name`, optioneel `iconColor`, `iconCustomEmojiId`)

    Gebruiksvriendelijke aliassen: `send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`.

    Toegangsregeling: `channels.telegram.actions.sendMessage`, `deleteMessage`, `reactions`, `sticker` (standaard: uitgeschakeld). `edit`, `createForumTopic` en `editForumTopic` zijn standaard ingeschakeld zonder afzonderlijke schakelaar.
    Verzendingen tijdens runtime gebruiken de actieve momentopname van configuratie/geheimen van het opstarten/herladen, zodat actiepaden `SecretRef`-waarden niet voor elke verzending opnieuw vaststellen.

    Semantiek voor het verwijderen van reacties: [/tools/reactions](/nl/tools/reactions).

  </Accordion>

  <Accordion title="Tags voor antwoordthreads">
    Expliciete tags voor antwoordthreads in gegenereerde uitvoer:

    - `[[reply_to_current]]` — antwoordt op het activerende bericht
    - `[[reply_to:<id>]]` — antwoordt op een specifieke bericht-ID

    `channels.telegram.replyToMode`: `off` (standaard), `first`, `all`.

    Wanneer antwoordthreads zijn ingeschakeld en de oorspronkelijke tekst/het oorspronkelijke bijschrift beschikbaar is, voegt OpenClaw automatisch een native citaatfragment toe. Telegram beperkt native citaattekst tot 1024 UTF-16-code-eenheden; langere berichten worden vanaf het begin geciteerd en vallen terug op een gewoon antwoord als Telegram het citaat weigert.

    `off` schakelt alleen impliciete antwoordthreads uit; expliciete `[[reply_to_*]]`-tags worden nog steeds gerespecteerd.

  </Accordion>

  <Accordion title="Forumonderwerpen en threadgedrag">
    Forumsupergroepen: aan onderwerpssessiesleutels wordt `:topic:<threadId>` toegevoegd; antwoorden en typindicaties zijn gericht op de onderwerpthread; het configuratiepad voor onderwerpen is `channels.telegram.groups.<chatId>.topics.<threadId>`.

    Het algemene onderwerp (`threadId=1`) is een speciaal geval: bij het verzenden van berichten wordt `message_thread_id` weggelaten (Telegram weigert `sendMessage(...thread_id=1)` met "thread niet gevonden"), maar typacties bevatten nog steeds `message_thread_id` (empirisch vereist om de typindicator te laten verschijnen).

    Onderwerpvermeldingen nemen groepsinstellingen over tenzij ze worden overschreven (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`). `agentId` geldt alleen voor onderwerpen en wordt niet overgenomen van de groepsstandaardwaarden. `topics."*"` stelt standaardwaarden in voor elk onderwerp in die groep; exacte onderwerp-ID's hebben nog steeds voorrang op `"*"`.

    **Agentroutering per onderwerp**: elk onderwerp kan via `agentId` in de onderwerpconfiguratie naar een andere agent worden gerouteerd, waardoor het een eigen werkruimte, geheugen en sessie krijgt:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // Algemeen onderwerp -> hoofdagent
                "3": { agentId: "zu" },        // Ontwikkelonderwerp -> zu-agent
                "5": { agentId: "coder" }      // Codebeoordeling -> coder-agent
              }
            }
          }
        }
      }
    }
    ```

    Elk onderwerp heeft vervolgens een eigen sessiesleutel, bijvoorbeeld `agent:zu:telegram:group:-1001234567890:topic:3`.

    **Persistente ACP-onderwerpkoppeling**: forumonderwerpen kunnen ACP-harnesssessies vastzetten via getypeerde koppelingen op het hoogste niveau (`bindings[]` met `type: "acp"`, `match.channel: "telegram"`, `peer.kind: "group"` en een onderwerpspecifieke ID zoals `-1001234567890:topic:42`). Momenteel beperkt tot forumonderwerpen in groepen/supergroepen. Zie [ACP-agents](/nl/tools/acp-agents).

    **Threadgebonden ACP-start vanuit chat**: `/acp spawn <agent> --thread here|auto` koppelt het huidige onderwerp aan een nieuwe ACP-sessie; vervolgberichten worden daar rechtstreeks naartoe gerouteerd en OpenClaw zet de startbevestiging vast in het onderwerp. Vereist `channels.telegram.threadBindings.spawnSessions` (standaard: `true`).

    De sjablooncontext stelt `MessageThreadId` en `IsForum` beschikbaar. DM-chats met `message_thread_id` behouden antwoordmetadata, maar gebruiken alleen threadbewuste sessiesleutels wanneer Telegram `getMe` als `has_topics_enabled: true` rapporteert.
    De buiten gebruik gestelde overschrijvingen `dm.threadReplies` en `direct.*.threadReplies` zijn verwijderd; de threadmodus van BotFather is de enige bron van waarheid. Voer `openclaw doctor --fix` uit om verouderde configuratiesleutels te verwijderen.

  </Accordion>

  <Accordion title="Audio, video en stickers">
    ### Audioberichten

    Telegram maakt onderscheid tussen spraaknotities en audiobestanden. Standaard: gedrag voor audiobestanden; gebruik de tag `[[audio_as_voice]]` in het antwoord van de agent om verzending als spraaknotitie af te dwingen. Transcripties van inkomende spraaknotities worden in de agentcontext aangemerkt als machinaal gegenereerde, niet-vertrouwde tekst, maar de detectie van vermeldingen gebruikt nog steeds de onbewerkte transcriptie, zodat door vermeldingen beperkte spraakberichten blijven werken.

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

    Telegram maakt onderscheid tussen videobestanden en videonotities. Videonotities ondersteunen geen bijschriften; opgegeven berichttekst wordt afzonderlijk verzonden.

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    ### Locaties en locaties met informatie

    Gebruik de bestaande actie `send` met één zelfstandig `location`-object. Coördinaten verzenden een native speld; door zowel `name` als `address` toe te voegen, wordt een native locatiekaart verzonden. Locatieverzendingen kunnen niet worden gecombineerd met berichttekst of media.

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  location: {
    latitude: 48.858844,
    longitude: 2.294351,
    accuracy: 12,
    name: "Eiffeltoren",
    address: "Champ de Mars, Parijs",
  },
}
```

    ### Stickers

    Inkomend: statische WEBP wordt gedownload en verwerkt (plaatsaanduiding `<media:sticker>`); geanimeerde TGS en video-WEBM worden overgeslagen.

    Stickercontextvelden: `Sticker.emoji`, `Sticker.setName`, `Sticker.fileId`, `Sticker.fileUniqueId`, `Sticker.cachedDescription`. Beschrijvingen worden in de SQLite-Pluginstatus van OpenClaw gecachet om herhaalde vision-aanroepen te beperken.

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

    Verzenden:

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    In gecachete stickers zoeken:

```json5
{
  action: "sticker-search",
  channel: "telegram",
  query: "zwaaiende kat",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="Reactiemeldingen">
    Telegram-reacties komen binnen als `message_reaction`-updates, los van berichtpayloads. Wanneer dit is ingeschakeld, plaatst OpenClaw systeemgebeurtenissen zoals `Telegram reaction added: 👍 by Alice (@alice) on msg 42` in de wachtrij.

    - `channels.telegram.reactionNotifications`: `off | own | all` (standaard: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (standaard: `minimal`)

    `own` betekent alleen gebruikersreacties op door de bot verzonden berichten (naar beste vermogen via een cache van verzonden berichten). Reactiegebeurtenissen respecteren nog steeds de Telegram-toegangscontroles (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); niet-geautoriseerde afzenders worden genegeerd.

    Telegram geeft geen thread-ID's door in reactie-updates: groepen zonder forum worden naar de groepschatsessie gerouteerd; forumgroepen worden naar de sessie van het algemene onderwerp (`:topic:1`) gerouteerd, niet naar het exacte oorspronkelijke onderwerp.

    `allowed_updates` voor polling/webhook neemt `message_reaction` automatisch op.

  </Accordion>

  <Accordion title="Bevestigingsreacties">
    `ackReaction` verzendt een bevestigingsemoji terwijl OpenClaw een inkomend bericht verwerkt. `messages.ackReactionScope` bepaalt *wanneer* deze wordt verzonden.

    **Volgorde voor emoji-resolutie:**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - terugval op de identiteitsemoji van de agent (`agents.list[].identity.emoji`, anders "👀")

    Telegram verwacht een Unicode-emoji (bijvoorbeeld "👀"); gebruik `""` om de reactie voor een kanaal of account uit te schakelen.

    **Bereik (`messages.ackReactionScope`, standaard `"group-mentions"`; momenteel geen overschrijving per Telegram-account of Telegram-kanaal):**

    `all` (DM's + groepen, inclusief omgevingsgebeurtenissen in ruimtes), `direct` (alleen DM's), `group-all` (elk groepsbericht behalve omgevingsgebeurtenissen in ruimtes, geen DM's), `group-mentions` (groepen wanneer de bot wordt vermeld; **geen DM's** — standaard), `off` / `none` (uitgeschakeld).

    <Note>
    Het standaardbereik (`group-mentions`) activeert geen bevestigingsreacties in DM's of bij omgevingsgebeurtenissen in ruimtes. Gebruik `direct` of `all` voor DM's; alleen `all` bevestigt omgevingsgebeurtenissen in ruimtes. Deze waarde wordt gelezen wanneer de Telegram-provider wordt gestart, dus de Gateway moet opnieuw worden gestart voordat de wijziging van kracht wordt.
    </Note>

  </Accordion>

  <Accordion title="Configuratieschrijfbewerkingen vanuit Telegram-gebeurtenissen en -opdrachten">
    Schrijfbewerkingen naar de kanaalconfiguratie zijn standaard ingeschakeld (`configWrites !== false`). Door Telegram geactiveerde schrijfbewerkingen omvatten groepsmigratiegebeurtenissen (`migrate_to_chat_id`, werkt `channels.telegram.groups` bij) en `/config set` / `/config unset` (vereist dat opdrachten zijn ingeschakeld).

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

  <Accordion title="Long polling versus Webhook">
    De standaard is long polling. Stel voor de Webhookmodus `channels.telegram.webhookUrl` en `channels.telegram.webhookSecret` in; optioneel `webhookPath` (standaard `/telegram-webhook`), `webhookHost` (standaard `127.0.0.1`), `webhookPort` (standaard `8787`), `webhookCertPath` (zelfondertekend certificaat in PEM-indeling voor configuraties met een rechtstreeks IP-adres of zonder domein).

    In de long-pollingmodus slaat OpenClaw het herstartwatermerk pas permanent op nadat een update met succes is doorgegeven; bij een mislukte handler blijft die update binnen hetzelfde proces opnieuw uitvoerbaar in plaats van als voltooid te worden gemarkeerd.

    De lokale listener bindt standaard aan `127.0.0.1:8787`. Plaats voor openbare inkomende toegang een reverse proxy vóór de lokale poort, of stel `webhookHost: "0.0.0.0"` bewust in.

    De Webhookmodus valideert aanvraagbeveiligingen, het geheime Telegram-token en de JSON-body, en legt de update vervolgens vast in de duurzame wachtrij voor inkomend verkeer voordat een lege `200` wordt teruggestuurd. Een geslaagde duurzame overname bevat `x-openclaw-delivery-accepted: durable`; antwoorden voor gezondheid, routering, authenticatie, validatie en opslagfouten laten deze header weg. Reverse proxy's en hostcontrollers kunnen de header vereisen om overname door OpenClaw te onderscheiden van een generieke lege `200`, zonder acceptatie af te leiden uit de antwoordtijd.

    OpenClaw verwerkt de update vervolgens asynchroon via dezelfde botbanen per chat/per onderwerp als bij long polling, zodat trage agentbeurten de afleverings-ACK van Telegram niet ophouden.

  </Accordion>

  <Accordion title="Limieten, opnieuw proberen en CLI-doelen">
    - `channels.telegram.textChunkLimit` standaard 4000; `streaming.chunkMode="newline"` geeft de voorkeur aan alineagrenzen (lege regels) voordat op lengte wordt gesplitst.
    - `channels.telegram.mediaMaxMb` (standaard 100) beperkt de grootte van inkomende en uitgaande media.
    - `channels.telegram.mediaGroupFlushMs` (standaard 500, bereik 10-60000) bepaalt hoelang albums/mediagroepen worden gebufferd voordat OpenClaw ze als één inkomend bericht doorstuurt. Verhoog dit als albumonderdelen te laat aankomen; verlaag het om de reactietijd voor albums te verkorten.
    - `channels.telegram.timeoutSeconds` overschrijft de time-out van de API-client (de standaardwaarde van grammY geldt indien niet ingesteld). Botclients begrenzen geconfigureerde waarden onder de beveiligingslimiet van 60 seconden voor uitgaande tekst-/typverzoeken, zodat grammY de levering van zichtbare antwoorden niet afbreekt voordat de transportbeveiliging en fallback van OpenClaw kunnen worden uitgevoerd. Long polling gebruikt nog steeds een `getUpdates`-beveiligingslimiet van 45 seconden, zodat inactieve polls niet onbeperkt actief blijven.
    - `channels.telegram.pollingStallThresholdMs` is standaard 120000; stel dit alleen tussen 30000 en 600000 af voor herstarts door onterecht gedetecteerde polling-stagnatie.
    - de groepscontextgeschiedenis gebruikt `channels.telegram.historyLimit` of `messages.groupChat.historyLimit` (standaard 50); `0` schakelt deze uit.
    - aanvullende context voor antwoorden/citaten/doorgestuurde berichten wordt genormaliseerd tot één geselecteerd contextvenster voor het gesprek wanneer de Gateway de bovenliggende berichten heeft waargenomen; de cache met waargenomen berichten bevindt zich in de SQLite-pluginstatus van OpenClaw en `openclaw doctor --fix` importeert verouderde sidecars. Telegram neemt per update slechts één oppervlakkige `reply_to_message` op, waardoor ketens die ouder zijn dan de cache tot die payload beperkt blijven.
    - Telegram-toelatingslijsten bepalen voornamelijk wie de agent kan activeren en vormen geen volledige grens voor het redigeren van aanvullende context.
    - DM-geschiedenis: `channels.telegram.dmHistoryLimit`, `channels.telegram.dms["<user_id>"].historyLimit`.
    - `channels.telegram.retry` is van toepassing op verzendhelpers van Telegram (CLI/tools/acties) voor herstelbare uitgaande API-fouten. De levering van definitieve inkomende antwoorden gebruikt een begrensde veilige verzendpoging voor fouten vóór het verbinden, maar probeert dubbelzinnige netwerkreacties na verzending niet opnieuw omdat zichtbare berichten daardoor kunnen worden gedupliceerd.

    Verzenddoelen voor de CLI en berichttool accepteren een numerieke chat-ID, gebruikersnaam of forumonderwerpdoel:

```bash
openclaw message send --channel telegram --target 123456789 --message "hoi"
openclaw message send --channel telegram --target @name --message "hoi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hoi onderwerp"
```

    Peilingen gebruiken `openclaw message poll` en ondersteunen forumonderwerpen:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Uitbrengen?" --poll-option "Ja" --poll-option "Nee"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Kies een tijdstip" --poll-option "10.00 uur" --poll-option "14.00 uur" \
  --poll-duration-seconds 300 --poll-public
```

    Peilingsvlaggen die alleen voor Telegram gelden: `--poll-duration-seconds` (5-600), `--poll-anonymous`, `--poll-public`, `--thread-id` (of een `:topic:`-doel). `--poll-option` wordt 2-12 keer herhaald (de optielimiet van Telegram).

    Verzenden via Telegram ondersteunt ook `--presentation` met `buttons`-blokken voor inline toetsenborden (wanneer `channels.telegram.capabilities.inlineButtons` dit toestaat), `--pin` of `--delivery '{"pin":true}'` om vastgezette levering aan te vragen wanneer de bot berichten in die chat kan vastzetten, en `--force-document` om uitgaande afbeeldingen, GIF's en video's als documenten te verzenden in plaats van als gecomprimeerde/geanimeerde/video-uploads.

    Actiebeperking: `channels.telegram.actions.sendMessage=false` schakelt alle uitgaande berichten uit, inclusief peilingen; `channels.telegram.actions.poll=false` schakelt het maken van peilingen uit, terwijl gewone verzendingen ingeschakeld blijven.

  </Accordion>

  <Accordion title="Uitvoeringsgoedkeuringen in Telegram">
    Telegram ondersteunt uitvoeringsgoedkeuringen in DM's van goedkeurders en kan prompts optioneel in de oorspronkelijke chat of het oorspronkelijke onderwerp plaatsen. Goedkeurders moeten numerieke Telegram-gebruikers-ID's zijn.

    - `channels.telegram.execApprovals.enabled` (`"auto"` wordt ingeschakeld wanneer ten minste één goedkeurder kan worden herleid)
    - `channels.telegram.execApprovals.approvers` (valt terug op numerieke eigenaar-ID's uit `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (standaard) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` en `defaultTo` bepalen wie met de bot kan praten en waar deze normale antwoorden naartoe stuurt — ze maken iemand niet tot uitvoeringsgoedkeurder. De eerste goedgekeurde DM-koppeling initialiseert `commands.ownerAllowFrom` wanneer er nog geen opdrachteigenaar bestaat, zodat configuraties met één eigenaar werken zonder ID's onder `execApprovals.approvers` te dupliceren.

    Bij levering aan het kanaal wordt de opdrachttekst in de chat weergegeven; schakel `channel` of `both` alleen in vertrouwde groepen/onderwerpen in. Wanneer de prompt in een forumonderwerp terechtkomt, behoudt OpenClaw het onderwerp voor de goedkeuringsprompt en opvolging. Uitvoeringsgoedkeuringen verlopen standaard na 30 minuten.

    Inline goedkeuringsknoppen vereisen ook dat `channels.telegram.capabilities.inlineButtons` het doeloppervlak toestaat (`dm`, `group` of `all`). Goedkeurings-ID's met het voorvoegsel `plugin:` worden via Plugin-goedkeuringen verwerkt; andere worden eerst via uitvoeringsgoedkeuringen verwerkt.

    Zie [Uitvoeringsgoedkeuringen](/nl/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Instellingen voor foutantwoorden

Wanneer de agent een leverings- of providerfout tegenkomt, bepaalt het foutbeleid of foutmeldingen de Telegram-chat bereiken:

| Sleutel                              | Waarden                    | Standaard       | Beschrijving                                                                                                                                                                                            |
| ----------------------------------- | -------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `always`, `once`, `silent` | `always`        | `always` stuurt elke foutmelding naar de chat. `once` stuurt elke unieke foutmelding eenmaal per afkoelperiode (onderdrukt herhaalde identieke fouten). `silent` stuurt nooit foutmeldingen naar de chat. |
| `channels.telegram.errorCooldownMs` | getal (ms)                 | `14400000` (4h) | Afkoelperiode voor het `once`-beleid. Nadat een fout is verzonden, wordt hetzelfde bericht onderdrukt totdat dit interval is verstreken. Voorkomt een overvloed aan foutmeldingen tijdens storingen. |

Overschrijvingen per account, per groep en per onderwerp worden ondersteund (dezelfde overerving als voor andere Telegram-configuratiesleutels).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "always",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // fouten in deze groep onderdrukken
        },
      },
    },
  },
}
```

## Problemen oplossen

<AccordionGroup>
  <Accordion title="Bot reageert niet op groepsberichten zonder vermelding">

    - Als `requireMention=false`, moet de privacymodus van Telegram volledige zichtbaarheid toestaan: BotFather `/setprivacy` -> Disable, verwijder de bot vervolgens uit de groep en voeg deze opnieuw toe.
    - `openclaw channels status` waarschuwt wanneer de configuratie groepsberichten zonder vermelding verwacht.
    - `openclaw channels status --probe` controleert expliciete numerieke groeps-ID's; het jokerteken `"*"` kan niet op lidmaatschap worden gecontroleerd.
    - Snelle sessietest: `/activation always`.

  </Accordion>

  <Accordion title="Bot ziet helemaal geen groepsberichten">

    - Wanneer `channels.telegram.groups` bestaat, moet de groep worden vermeld (of `"*"` bevatten).
    - Controleer of de bot lid is van de groep.
    - Bekijk `openclaw logs --follow` voor redenen waarom berichten worden overgeslagen.

  </Accordion>

  <Accordion title="Opdrachten werken gedeeltelijk of helemaal niet">

    - Autoriseer je afzenderidentiteit (koppeling en/of numerieke `allowFrom`); opdrachtautorisatie blijft van toepassing, zelfs wanneer het groepsbeleid `open` is.
    - `setMyCommands failed` met `BOT_COMMANDS_TOO_MUCH` betekent dat het native menu te veel items bevat; verminder het aantal Plugin-/Skills-/aangepaste opdrachten of schakel native menu's uit.
    - `deleteMyCommands` / `setMyCommands`-aanroepen bij het opstarten en `sendChatAction`-typaanroepen zijn begrensd en worden bij een time-out van het verzoek eenmaal opnieuw geprobeerd via de transportfallback van Telegram. Aanhoudende netwerk-/fetchfouten betekenen meestal dat DNS/HTTPS naar `api.telegram.org` niet bereikbaar is.

  </Accordion>

  <Accordion title="Bij het opstarten wordt een niet-geautoriseerd token gemeld">

    - `getMe returned 401` is een Telegram-authenticatiefout voor het geconfigureerde bottoken. Kopieer het token opnieuw of genereer het opnieuw in BotFather en werk vervolgens `channels.telegram.botToken`, `tokenFile`, `accounts.<id>.botToken` of `TELEGRAM_BOT_TOKEN` (standaardaccount) bij.
    - `deleteWebhook 401 Unauthorized` tijdens het opstarten is ook een authenticatiefout; dit behandelen als "er bestaat geen webhook" zou dezelfde fout door het onjuiste token alleen uitstellen tot een latere API-aanroep.

  </Accordion>

  <Accordion title="Instabiele polling of netwerkverbinding">

    - Node 22+ met een aangepaste fetch/proxy kan onmiddellijk afbreekgedrag veroorzaken als de `AbortSignal`-typen niet overeenkomen.
    - Sommige hosts herleiden `api.telegram.org` eerst naar IPv6; defect uitgaand IPv6-verkeer veroorzaakt periodieke API-fouten.
    - Logboeken met `TypeError: fetch failed` of `Network request for 'getUpdates' failed!` worden opnieuw geprobeerd als herstelbare netwerkfouten.
    - Tijdens het opstarten van polling hergebruikt OpenClaw de geslaagde `getMe`-controle bij het opstarten voor grammY, zodat de runner geen tweede `getMe` nodig heeft vóór de eerste `getUpdates`.
    - Als `deleteWebhook` tijdens het opstarten van polling mislukt door een tijdelijke netwerkfout, gaat OpenClaw verder met long polling in plaats van nog een control-plane-aanroep vóór polling uit te voeren. Een nog actieve Webhook wordt vervolgens zichtbaar als een `getUpdates`-conflict; OpenClaw bouwt het transport opnieuw op en probeert de Webhook opnieuw op te schonen.
    - Als Telegram-sockets volgens een korte vaste cyclus worden vernieuwd, controleer dan op een lage `channels.telegram.timeoutSeconds` — botclients begrenzen geconfigureerde waarden onder de beveiligingslimieten voor uitgaande verzoeken en `getUpdates`-verzoeken, maar oudere releases konden elke poll of elk antwoord afbreken wanneer dit onder die limieten was ingesteld.
    - `Polling stall detected` in logboeken betekent dat OpenClaw polling opnieuw start en het transport opnieuw opbouwt nadat standaard gedurende 120 seconden geen voltooide long-poll-liveness is waargenomen.
    - `openclaw channels status --probe` en `openclaw doctor` waarschuwen wanneer een actief pollingaccount na de respijtperiode bij het opstarten geen `getUpdates` heeft voltooid, een actief Webhook-account na de respijtperiode bij het opstarten geen `setWebhook` heeft voltooid, of de laatste geslaagde transportactiviteit voor polling verouderd is.
    - Verhoog `channels.telegram.pollingStallThresholdMs` alleen wanneer langlopende `getUpdates`-aanroepen correct werken, maar je host nog steeds herstarts meldt wegens onterecht gedetecteerde polling-stagnatie. Aanhoudende stagnatie wijst meestal op problemen met proxy, DNS, IPv6 of uitgaand TLS-verkeer naar `api.telegram.org`.
    - Telegram respecteert proxyomgevingsvariabelen van het proces voor Bot API-transport: `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` en varianten in kleine letters. `NO_PROXY` / `no_proxy` kunnen `api.telegram.org` nog steeds omzeilen.
    - Als `OPENCLAW_PROXY_URL` voor een serviceomgeving is ingesteld en er geen standaardproxyomgevingsvariabele aanwezig is, gebruikt Telegram die URL ook voor Bot API-transport.
    - Leid Telegram API-aanroepen op VPS-hosts met instabiel direct uitgaand verkeer/TLS via een proxy:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ gebruikt standaard `autoSelectFamily=true` (behalve op WSL2). De volgorde van Telegram-DNS-resultaten volgt `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, daarna `channels.telegram.network.dnsResultOrder` en vervolgens de processtandaard (bijvoorbeeld `NODE_OPTIONS=--dns-result-order=ipv4first`); als geen daarvan van toepassing is, wordt op Node 22+ teruggevallen op `ipv4first`.
    - Dwing op WSL2, of wanneer alleen-IPv4-gedrag beter werkt, de familieselectie af:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Antwoorden uit het RFC 2544-benchmarkbereik (`198.18.0.0/15`) zijn standaard al toegestaan voor het downloaden van Telegram-media. Als een vertrouwde fake-IP- of transparante proxy `api.telegram.org` tijdens het downloaden van media herschrijft naar een ander privé-, intern of voor speciaal gebruik bestemd adres, schakel dan de uitsluitend voor Telegram bedoelde omzeiling in:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Dezelfde opt-in is per account beschikbaar via `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Als je proxy Telegram-mediahosts omzet naar `198.18.x.x`, laat de gevaarlijke vlag dan eerst uitgeschakeld — dat bereik is standaard al toegestaan.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` verzwakt de SSRF-beveiliging voor Telegram-media. Gebruik dit alleen voor vertrouwde, door de beheerder gecontroleerde proxyomgevingen (fake-IP-routering van Clash, Mihomo en Surge) die privéantwoorden of antwoorden voor speciaal gebruik buiten het RFC 2544-benchmarkbereik genereren. Laat dit uitgeschakeld voor normale Telegram-toegang via het openbare internet.
    </Warning>

    - Tijdelijke omgevingsoverschrijvingen: `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`, `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`, `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`.
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

<Accordion title="Belangrijkste Telegram-velden">

- opstarten/authenticatie: `enabled`, `botToken`, `tokenFile` (moet een normaal bestand zijn; symbolische koppelingen worden geweigerd), `accounts.*`
- toegangsbeheer: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` op het hoogste niveau (`type: "acp"`)
- onderwerpstandaarden: `groups.<chatId>.topics."*"` is van toepassing op niet-overeenkomende forumonderwerpen; exacte onderwerp-ID's overschrijven dit
- uitvoeringsgoedkeuringen: `execApprovals`, `accounts.*.execApprovals`
- opdracht/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- threads/antwoorden: `replyToMode`, `threadBindings`
- streaming: `streaming` (modi `off | partial | block | progress`), `streaming.preview.toolProgress`
- opmaak/bezorging: `textChunkLimit`, `streaming.chunkMode`, `richMessages`, `markdown.tables` (`off | bullets | code | block`), `linkPreview`, `responsePrefix`
- media/netwerk: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- aangepaste API-root: `apiRoot` (alleen de Bot API-root; neem `/bot<TOKEN>` niet op), `trustedLocalFileRoots` (absolute `file_path`-roots van een zelfgehoste Bot API)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`, `webhookPort`, `webhookCertPath`
- acties/mogelijkheden: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker|createForumTopic|editForumTopic`
- reacties: `reactionNotifications`, `reactionLevel`
- fouten: `errorPolicy`, `errorCooldownMs`, `silentErrorReplies`
- schrijfbewerkingen/geschiedenis: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Prioriteit bij meerdere accounts: wanneer twee of meer account-ID's zijn geconfigureerd, stel je `channels.telegram.defaultAccount` in (of neem je `channels.telegram.accounts.default` op) om de standaardroutering expliciet te maken. Anders valt OpenClaw terug op het eerste genormaliseerde account-ID en geeft `openclaw doctor` een waarschuwing. Benoemde accounts nemen `channels.telegram.allowFrom` / `groupAllowFrom` over, maar niet de waarden van `accounts.default.*`.
</Note>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Koppelen" icon="link" href="/nl/channels/pairing">
    Koppel een Telegram-gebruiker aan de Gateway.
  </Card>
  <Card title="Groepen" icon="users" href="/nl/channels/groups">
    Gedrag van de toelatingslijst voor groepen en onderwerpen.
  </Card>
  <Card title="Kanaalroutering" icon="route" href="/nl/channels/channel-routing">
    Routeer inkomende berichten naar agents.
  </Card>
  <Card title="Beveiliging" icon="shield" href="/nl/gateway/security">
    Dreigingsmodel en beveiligingsversterking.
  </Card>
  <Card title="Routering met meerdere agents" icon="sitemap" href="/nl/concepts/multi-agent">
    Wijs groepen en onderwerpen toe aan agents.
  </Card>
  <Card title="Probleemoplossing" icon="wrench" href="/nl/channels/troubleshooting">
    Diagnostiek over meerdere kanalen.
  </Card>
</CardGroup>
