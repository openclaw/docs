---
read_when:
    - Werken aan Telegram-functies of Webhooks
summary: Ondersteuningsstatus, mogelijkheden en configuratie van Telegram-bots
title: Telegram
x-i18n:
    generated_at: "2026-06-27T17:13:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f05ee57f06fe3b1c42ca19204bf74685ca3f05b1f02b9a6e36a7986e298b7edc
    source_path: channels/telegram.md
    workflow: 16
---

Productiegereed voor bot-DM's en groepen via grammY. Long polling is de standaardmodus; Webhook-modus is optioneel.

<CardGroup cols={3}>
  <Card title="Koppelen" icon="link" href="/nl/channels/pairing">
    Het standaard-DM-beleid voor Telegram is koppelen.
  </Card>
  <Card title="Kanaalprobleemoplossing" icon="wrench" href="/nl/channels/troubleshooting">
    Kanaaloverstijgende diagnostiek en herstel-playbooks.
  </Card>
  <Card title="Gateway-configuratie" icon="settings" href="/nl/gateway/configuration">
    Volledige kanaalconfiguratiepatronen en voorbeelden.
  </Card>
</CardGroup>

## Snelle installatie

<Steps>
  <Step title="Maak het bottoken aan in BotFather">
    Open Telegram en chat met **@BotFather** (controleer dat de handle exact `@BotFather` is).

    Voer `/newbot` uit, volg de prompts en bewaar het token.

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
    Telegram gebruikt **geen** `openclaw channels login telegram`; configureer het token in config/env en start daarna Gateway.

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
    Voeg de bot toe aan je groep en verkrijg daarna beide ID's die groepstoegang nodig heeft:

    - je Telegram-gebruikers-ID, gebruikt in `allowFrom` / `groupAllowFrom`
    - de Telegram-groepschat-ID, gebruikt als sleutel onder `channels.telegram.groups`

    Voor de eerste installatie kun je de groepschat-ID verkrijgen via `openclaw logs --follow`, een forwarded-ID-bot of Bot API `getUpdates`. Nadat de groep is toegestaan, kan `/whoami@<bot_username>` de gebruikers- en groeps-ID's bevestigen.

    Negatieve Telegram-supergroep-ID's die met `-100` beginnen, zijn groepschat-ID's. Plaats ze onder `channels.telegram.groups`, niet onder `groupAllowFrom`.

  </Step>
</Steps>

<Note>
De volgorde voor tokenresolutie is accountbewust. In de praktijk winnen configwaarden van env-fallback, en `TELEGRAM_BOT_TOKEN` geldt alleen voor het standaardaccount.
Na een succesvolle start cachet OpenClaw de botidentiteit maximaal 24 uur in de state-map, zodat herstarts een extra Telegram `getMe`-aanroep kunnen vermijden; het wijzigen of verwijderen van het token wist die cache.
</Note>

## Instellingen aan Telegram-zijde

<AccordionGroup>
  <Accordion title="Privacymodus en groepszichtbaarheid">
    Telegram-bots gebruiken standaard **Privacy Mode**, wat beperkt welke groepsberichten ze ontvangen.

    Als de bot alle groepsberichten moet zien, doe dan een van beide:

    - schakel de privacymodus uit via `/setprivacy`, of
    - maak de bot groepsbeheerder.

    Verwijder de bot en voeg hem opnieuw toe in elke groep wanneer je de privacymodus omschakelt, zodat Telegram de wijziging toepast.

  </Accordion>

  <Accordion title="Groepsmachtigingen">
    Beheerderstatus wordt beheerd in de Telegram-groepsinstellingen.

    Beheerderbots ontvangen alle groepsberichten, wat handig is voor altijd-actief groepsgedrag.

  </Accordion>

  <Accordion title="Handige BotFather-schakelaars">

    - `/setjoingroups` om groepstoevoegingen toe te staan/te weigeren
    - `/setprivacy` voor gedrag rond groepszichtbaarheid

  </Accordion>
</AccordionGroup>

## Toegangscontrole en activering

### Groepsbotidentiteit

In Telegram-groepen en forumtopics wordt een expliciete vermelding van de geconfigureerde bothandle (bijvoorbeeld `@my_bot`) behandeld als gericht aan de geselecteerde OpenClaw-agent, zelfs wanneer de naam van de agentpersona afwijkt van de Telegram-gebruikersnaam. Het stiltebeleid voor groepen blijft gelden voor niet-gerelateerd groepsverkeer, maar de bothandle zelf wordt niet beschouwd als "iemand anders."

<Tabs>
  <Tab title="DM-beleid">
    `channels.telegram.dmPolicy` beheert toegang tot directe berichten:

    - `pairing` (standaard)
    - `allowlist` (vereist ten minste één afzender-ID in `allowFrom`)
    - `open` (vereist dat `allowFrom` `"*"` bevat)
    - `disabled`

    `dmPolicy: "open"` met `allowFrom: ["*"]` laat elk Telegram-account dat de botgebruikersnaam vindt of raadt de bot opdrachten geven. Gebruik dit alleen voor bewust openbare bots met strikt beperkte tools; bots met één eigenaar moeten `allowlist` gebruiken met numerieke gebruikers-ID's.

    `channels.telegram.allowFrom` accepteert numerieke Telegram-gebruikers-ID's. `telegram:`- / `tg:`-prefixen worden geaccepteerd en genormaliseerd.
    In configuraties met meerdere accounts wordt een restrictieve top-level `channels.telegram.allowFrom` behandeld als veiligheidsgrens: accountniveau-items `allowFrom: ["*"]` maken dat account niet openbaar tenzij de effectieve account-allowlist na het samenvoegen nog steeds een expliciete wildcard bevat.
    `dmPolicy: "allowlist"` met lege `allowFrom` blokkeert alle DM's en wordt afgewezen door configuratievalidatie.
    De installatie vraagt alleen om numerieke gebruikers-ID's.
    Als je hebt geüpgraded en je config `@username`-allowlist-items bevat, voer dan `openclaw doctor --fix` uit om ze te resolveren (best-effort; vereist een Telegram-bottoken).
    Als je eerder vertrouwde op allowlist-bestanden uit de pairing-store, kan `openclaw doctor --fix` items herstellen naar `channels.telegram.allowFrom` in allowlist-flows (bijvoorbeeld wanneer `dmPolicy: "allowlist"` nog geen expliciete ID's heeft).

    Voor bots met één eigenaar heeft `dmPolicy: "allowlist"` met expliciete numerieke `allowFrom`-ID's de voorkeur, zodat het toegangsbeleid duurzaam in de config staat (in plaats van afhankelijk te zijn van eerdere goedgekeurde koppelingen).

    Veelvoorkomende verwarring: goedkeuring van DM-koppeling betekent niet "deze afzender is overal geautoriseerd".
    Koppeling verleent DM-toegang. Als er nog geen opdrachteigenaar bestaat, stelt de eerste goedgekeurde koppeling ook `commands.ownerAllowFrom` in, zodat eigenaar-only opdrachten en exec-goedkeuringen een expliciet operatoraccount hebben.
    Autorisatie van groepsafzenders komt nog steeds uit expliciete config-allowlists.
    Als je wilt "ik ben één keer geautoriseerd en zowel DM's als groepsopdrachten werken", plaats dan je numerieke Telegram-gebruikers-ID in `channels.telegram.allowFrom`; zorg er voor eigenaar-only opdrachten voor dat `commands.ownerAllowFrom` `telegram:<your user id>` bevat.

    ### Je Telegram-gebruikers-ID vinden

    Veiliger (geen externe bot):

    1. DM je bot.
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
       - geen `groups`-config:
         - met `groupPolicy: "open"`: elke groep kan groeps-ID-controles doorstaan
         - met `groupPolicy: "allowlist"` (standaard): groepen worden geblokkeerd totdat je `groups`-items (of `"*"`) toevoegt
       - `groups` geconfigureerd: werkt als allowlist (expliciete ID's of `"*"`)

    2. **Welke afzenders in groepen zijn toegestaan** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (standaard)
       - `disabled`

    `groupAllowFrom` wordt gebruikt voor filtering van groepsafzenders. Als dit niet is ingesteld, valt Telegram terug op `allowFrom`.
    `groupAllowFrom`-items moeten numerieke Telegram-gebruikers-ID's zijn (`telegram:`- / `tg:`-prefixen worden genormaliseerd).
    Plaats geen Telegram-groeps- of supergroepchat-ID's in `groupAllowFrom`. Negatieve chat-ID's horen onder `channels.telegram.groups`.
    Niet-numerieke items worden genegeerd voor afzenderautorisatie.
    Veiligheidsgrens (`2026.2.25+`): groepsafzender-auth erft **geen** goedkeuringen uit de DM-pairing-store.
    Koppelen blijft alleen voor DM's. Stel voor groepen `groupAllowFrom` of per-groep/per-topic `allowFrom` in.
    Als `groupAllowFrom` niet is ingesteld, valt Telegram terug op config `allowFrom`, niet op de pairing-store.
    Praktisch patroon voor bots met één eigenaar: stel je gebruikers-ID in bij `channels.telegram.allowFrom`, laat `groupAllowFrom` oningesteld en sta de doelgroepen toe onder `channels.telegram.groups`.
    Runtime-opmerking: als `channels.telegram` volledig ontbreekt, gebruikt runtime standaard fail-closed `groupPolicy="allowlist"`, tenzij `channels.defaults.groupPolicy` expliciet is ingesteld.

    Groepsinstallatie met alleen eigenaar:

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

    Test het vanuit de groep met `@<bot_username> ping`. Gewone groepsberichten activeren de bot niet zolang `requireMention: true` is ingesteld.

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
      Veelvoorkomende fout: `groupAllowFrom` is geen Telegram-groeps-allowlist.

      - Plaats negatieve Telegram-groeps- of supergroepchat-ID's zoals `-1001234567890` onder `channels.telegram.groups`.
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

    Opdrachten voor sessieniveau-schakelaars:

    - `/activation always`
    - `/activation mention`

    Deze werken alleen de sessiestatus bij. Gebruik config voor persistentie.

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
    recente kamergeschiedenis op te nemen voor vertrouwde groepen. Stel
    `includeGroupHistoryContext: "none"` in om geen eerdere Telegram-groepsgeschiedenis
    mee te sturen met de volgende beurt.

```json5
{
  channels: {
    telegram: {
      includeGroupHistoryContext: "recent",
    },
  },
}
```

    De groepschat-ID verkrijgen:

    - stuur een groepsbericht door naar `@userinfobot` / `@getidsbot`
    - of lees `chat.id` uit `openclaw logs --follow`
    - of inspecteer Bot API `getUpdates`
    - nadat de groep is toegestaan, voer `/whoami@<bot_username>` uit als native opdrachten zijn ingeschakeld

  </Tab>
</Tabs>

## Runtime-gedrag

- Telegram is eigendom van het gatewayproces.
- Routing is deterministisch: inkomende Telegram-berichten antwoorden terug naar Telegram (het model kiest geen kanalen).
- Inkomende berichten worden genormaliseerd naar de gedeelde kanaalenvelop met antwoordmetadata, mediaplaceholders en vastgelegde antwoordketencontext voor Telegram-antwoorden die de gateway heeft waargenomen.
- Groepssessies worden geisoleerd op groeps-ID. Forumonderwerpen voegen `:topic:<threadId>` toe om onderwerpen geisoleerd te houden.
- DM-berichten kunnen `message_thread_id` bevatten; OpenClaw behoudt dit voor antwoorden. DM-onderwerpsessies worden alleen gesplitst wanneer Telegram `getMe` `has_topics_enabled: true` rapporteert voor de bot; anders blijven DM's op de platte sessie.
- Long polling gebruikt grammY runner met sequencing per chat/per thread. De totale sink-concurrency van de runner gebruikt `agents.defaults.maxConcurrent`.
- Opstarten met meerdere accounts begrenst gelijktijdige Telegram-`getMe`-probes, zodat grote botvloten niet alle accountprobes tegelijk uitwaaieren.
- Long polling wordt binnen elk gatewayproces bewaakt, zodat slechts een actieve poller tegelijk een bottoken kan gebruiken. Als je nog steeds `getUpdates` 409-conflicten ziet, gebruikt waarschijnlijk een andere OpenClaw-gateway, script of externe poller hetzelfde token.
- Herstarts door de long-polling-watchdog worden standaard geactiveerd na 120 seconden zonder voltooide `getUpdates`-liveness. Verhoog `channels.telegram.pollingStallThresholdMs` alleen als je deployment nog steeds valse polling-stall-herstarts ziet tijdens langlopende taken. De waarde is in milliseconden en is toegestaan van `30000` tot `600000`; overschrijvingen per account worden ondersteund.
- Telegram Bot API heeft geen ondersteuning voor leesbevestigingen (`sendReadReceipts` is niet van toepassing).

<Note>
  `channels.telegram.dm.threadReplies` en `channels.telegram.direct.<chatId>.threadReplies` zijn verwijderd. Voer `openclaw doctor --fix` uit na het upgraden als je configuratie deze sleutels nog bevat. DM-onderwerprouting volgt nu de botcapaciteit uit Telegram `getMe.has_topics_enabled`, die wordt beheerd door BotFather threaded mode: bots met onderwerpen ingeschakeld gebruiken thread-gebonden DM-sessies wanneer Telegram `message_thread_id` verzendt; andere DM's blijven op de platte sessie.
</Note>

## Functiereferentie

<AccordionGroup>
  <Accordion title="Live stream-voorbeeld (berichtbewerkingen)">
    OpenClaw kan gedeeltelijke antwoorden in realtime streamen:

    - directe chats: voorbeeldbericht + `editMessageText`
    - groepen/onderwerpen: voorbeeldbericht + `editMessageText`

    Vereiste:

    - `channels.telegram.streaming` is `off | partial | block | progress` (standaard: `partial`)
    - korte eerste antwoordvoorbeelden worden gedebounced en daarna na een begrensde vertraging gematerialiseerd als de run nog actief is
    - `progress` behoudt een bewerkbaar statusconcept voor toolvoortgang, toont het stabiele statuslabel wanneer antwoordactiviteit binnenkomt voor toolvoortgang, wist dit bij voltooiing en verzendt het definitieve antwoord als normaal bericht
    - `streaming.preview.toolProgress` bepaalt of tool-/voortgangsupdates hetzelfde bewerkte voorbeeldbericht hergebruiken (standaard: `true` wanneer voorbeeldstreaming actief is)
    - `streaming.preview.commandText` bepaalt opdracht-/exec-details binnen die toolvoortgangsregels: `raw` (standaard, behoudt uitgebracht gedrag) of `status` (alleen toollabel)
    - `streaming.progress.commentary` (standaard: `false`) schakelt assistentcommentaar/preambuletekst in het tijdelijke voortgangsconcept in
    - legacy `channels.telegram.streamMode`, booleaanse `streaming`-waarden en uitgefaseerde native conceptvoorbeeldsleutels worden gedetecteerd; voer `openclaw doctor --fix` uit om ze naar de huidige streamingconfiguratie te migreren

    Toolvoortgangsvoorbeeldupdates zijn de korte statusregels die worden getoond terwijl tools draaien, bijvoorbeeld opdrachtuitvoering, bestandslezingen, planningsupdates, patchsamenvattingen of Codex-preambule-/commentaartekst in Codex app-server-modus. Telegram houdt deze standaard ingeschakeld om overeen te komen met uitgebracht OpenClaw-gedrag vanaf `v2026.4.22` en later.

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

    Gebruik `streaming.mode: "off"` alleen wanneer je uitsluitend definitieve levering wilt: Telegram-voorbeeldbewerkingen zijn uitgeschakeld en generieke tool-/voortgangschatter wordt onderdrukt in plaats van als losse statusberichten te worden verzonden. Goedkeuringsprompts, mediapayloads en fouten worden nog steeds via normale definitieve levering gerouteerd. Gebruik `streaming.preview.toolProgress: false` wanneer je alleen antwoordvoorbeeldbewerkingen wilt behouden en de toolvoortgangsstatusregels wilt verbergen.

    <Note>
      Geselecteerde citaatantwoorden in Telegram zijn de uitzondering. Wanneer `replyToMode` `"first"`, `"all"` of `"batched"` is en het inkomende bericht geselecteerde citaattekst bevat, verzendt OpenClaw het definitieve antwoord via Telegrams native citaatantwoordpad in plaats van het antwoordvoorbeeld te bewerken, zodat `streaming.preview.toolProgress` de korte statusregels voor die beurt niet kan tonen. Antwoorden op het huidige bericht zonder geselecteerde citaattekst behouden nog steeds voorbeeldstreaming. Stel `replyToMode: "off"` in wanneer zichtbaarheid van toolvoortgang belangrijker is dan native citaatantwoorden, of stel `streaming.preview.toolProgress: false` in om de afweging te erkennen.
    </Note>

    Voor antwoorden met alleen tekst:

    - korte DM-/groeps-/onderwerpvoorbeelden: OpenClaw behoudt hetzelfde voorbeeldbericht en voert de definitieve bewerking op zijn plaats uit
    - lange definitieve teksten die in meerdere Telegram-berichten worden gesplitst, hergebruiken waar mogelijk het bestaande voorbeeld als het eerste definitieve segment en verzenden daarna alleen de resterende segmenten
    - definitieve antwoorden in progress-modus wissen het statusconcept en gebruiken normale definitieve levering in plaats van het concept tot het antwoord te bewerken
    - als de definitieve bewerking mislukt voordat de voltooide tekst is bevestigd, gebruikt OpenClaw normale definitieve levering en ruimt het verouderde voorbeeld op

    Voor complexe antwoorden (bijvoorbeeld mediapayloads) valt OpenClaw terug op normale definitieve levering en ruimt daarna het voorbeeldbericht op.

    Voorbeeldstreaming staat los van blokstreaming. Wanneer blokstreaming expliciet is ingeschakeld voor Telegram, slaat OpenClaw de voorbeeldstream over om dubbele streaming te vermijden.

    Gedrag van reasoning-stream:

    - `/reasoning stream` gebruikt het reasoning-voorbeeldpad van een ondersteund kanaal; op Telegram streamt dit reasoning tijdens het genereren naar het live voorbeeld
    - het reasoning-voorbeeld wordt na definitieve levering verwijderd; gebruik `/reasoning on` wanneer reasoning zichtbaar moet blijven
    - het definitieve antwoord wordt zonder reasoning-tekst verzonden

  </Accordion>

  <Accordion title="Rijke berichtopmaak">
    Uitgaande tekst gebruikt standaard Telegram HTML-berichten, zodat antwoorden leesbaar blijven in huidige Telegram-clients. Deze compatibiliteitsmodus ondersteunt normale vetgedrukte tekst, cursief, links, code, spoilers en citaten, maar geen rijke-only blokken uit Bot API 10.1 zoals native tabellen, details, rijke media en formules.

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

    - De agent krijgt te horen dat Telegram rijke berichten beschikbaar zijn voor deze bot/dit account.
    - Markdown-tekst wordt gerenderd via OpenClaw's Markdown IR en verzonden als Telegram rijke HTML.
    - Expliciete rijke HTML-payloads behouden ondersteunde Bot API 10.1-tags zoals koppen, tabellen, details, rijke media en formules.
    - Mediabijschriften gebruiken nog steeds Telegram HTML-bijschriften, omdat rijke berichten bijschriften niet vervangen.

    Dit houdt modeltekst weg van Telegram Rich Markdown-sigils, zodat valuta zoals `$400-600K` niet als wiskunde wordt geparsed. Lange rijke tekst wordt automatisch gesplitst over de limieten van Telegram voor rijke tekst en rijke blokken. Tabellen boven Telegrams kolomlimiet worden als codeblokken verzonden.

    Standaard: uit voor clientcompatibiliteit. Rijke berichten vereisen compatibele Telegram-clients; sommige huidige Desktop-, Web-, Android- en externe clients tonen geaccepteerde rijke berichten als niet ondersteund. Houd deze optie uitgeschakeld tenzij elke client die met de bot wordt gebruikt ze kan renderen. `/status` toont of rijke berichten voor de huidige Telegram-sessie aan of uit staan.

    Linkvoorbeelden zijn standaard ingeschakeld. `channels.telegram.linkPreview: false` slaat automatische entiteitsdetectie voor rijke tekst over.

  </Accordion>

  <Accordion title="Native opdrachten en aangepaste opdrachten">
    Registratie van het Telegram-opdrachtenmenu wordt bij het opstarten afgehandeld met `setMyCommands`.

    Standaarden voor native opdrachten:

    - `commands.native: "auto"` schakelt native opdrachten in voor Telegram

    Voeg aangepaste opdrachtenmenu-items toe:

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
    - aangepaste opdrachten kunnen native opdrachten niet overschrijven
    - conflicten/duplicaten worden overgeslagen en gelogd

    Opmerkingen:

    - aangepaste opdrachten zijn alleen menu-items; ze implementeren niet automatisch gedrag
    - Plugin-/Skills-opdrachten kunnen nog steeds werken wanneer ze worden getypt, zelfs als ze niet in het Telegram-menu worden getoond

    Als native opdrachten zijn uitgeschakeld, worden ingebouwde opdrachten verwijderd. Aangepaste/Plugin-opdrachten kunnen nog steeds worden geregistreerd als ze zijn geconfigureerd.

    Veelvoorkomende instellingsfouten:

    - `setMyCommands failed` met `BOT_COMMANDS_TOO_MUCH` betekent dat het Telegram-menu na inkorten nog steeds overliep; verminder Plugin-/Skills-/aangepaste opdrachten of schakel `channels.telegram.commands.native` uit.
    - `deleteWebhook`, `deleteMyCommands` of `setMyCommands` dat faalt met `404: Not Found` terwijl directe Bot API curl-opdrachten werken, kan betekenen dat `channels.telegram.apiRoot` is ingesteld op het volledige `/bot<TOKEN>`-endpoint. `apiRoot` mag alleen de Bot API-root zijn, en `openclaw doctor --fix` verwijdert een per ongeluk toegevoegde afsluitende `/bot<TOKEN>`.
    - `getMe returned 401` betekent dat Telegram het geconfigureerde bottoken heeft geweigerd. Werk `botToken`, `tokenFile` of `TELEGRAM_BOT_TOKEN` bij met het huidige BotFather-token; OpenClaw stopt voor polling, zodat dit niet als een webhook-opruimfout wordt gerapporteerd.
    - `setMyCommands failed` met netwerk-/fetchfouten betekent meestal dat uitgaande DNS/HTTPS naar `api.telegram.org` is geblokkeerd.

    ### Opdrachten voor apparaatkoppeling (`device-pair` Plugin)

    Wanneer de `device-pair` Plugin is geinstalleerd:

    1. `/pair` genereert installatiecode
    2. plak code in iOS-app
    3. `/pair pending` toont openstaande aanvragen (inclusief rol/scopes)
    4. keur de aanvraag goed:
       - `/pair approve <requestId>` voor expliciete goedkeuring
       - `/pair approve` wanneer er slechts een openstaande aanvraag is
       - `/pair approve latest` voor de meest recente

    De installatiecode bevat een kortlevend bootstrap-token. Ingebouwde installatiecode-bootstrap is alleen voor nodes: de eerste verbinding maakt een openstaande node-aanvraag, en na goedkeuring retourneert de Gateway een duurzaam node-token met `scopes: []`. Er wordt geen overgedragen operator-token geretourneerd; operatortoegang vereist een afzonderlijk goedgekeurde operatorkoppeling of tokenflow.

    Als een apparaat opnieuw probeert met gewijzigde authgegevens (bijvoorbeeld rol/scopes/publieke sleutel), wordt de vorige openstaande aanvraag vervangen en gebruikt de nieuwe aanvraag een andere `requestId`. Voer `/pair pending` opnieuw uit voordat je goedkeurt.

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

    Telegram `web_app`-knoppen werken alleen in privéchats tussen een gebruiker en de
    bot.

    Callback-klikken worden als tekst doorgegeven aan de agent:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Telegram-berichtacties voor agents en automatisering">
    Telegram-toolacties omvatten:

    - `sendMessage` (`to`, `content`, optioneel `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content` of `caption`, optionele `presentation` inline knoppen; bewerkingen met alleen knoppen werken de reply-markup bij)
    - `createForumTopic` (`chatId`, `name`, optioneel `iconColor`, `iconCustomEmojiId`)

    Kanaalberichtacties bieden ergonomische aliassen (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Gating-regelaars:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (standaard: uitgeschakeld)

    Opmerking: `edit` en `topic-create` zijn momenteel standaard ingeschakeld en hebben geen afzonderlijke `channels.telegram.actions.*`-schakelaars.
    Runtime-verzendingen gebruiken de actieve configuratie-/geheimensnapshot (opstarten/herladen), dus actiepaden voeren geen ad-hoc SecretRef-heroplossing per verzending uit.

    Semantiek voor verwijderen van reacties: [/tools/reactions](/nl/tools/reactions)

  </Accordion>

  <Accordion title="Tags voor reply-threads">
    Telegram ondersteunt expliciete tags voor reply-threads in gegenereerde uitvoer:

    - `[[reply_to_current]]` antwoordt op het activerende bericht
    - `[[reply_to:<id>]]` antwoordt op een specifieke Telegram-bericht-ID

    `channels.telegram.replyToMode` regelt de afhandeling:

    - `off` (standaard)
    - `first`
    - `all`

    Wanneer reply-threading is ingeschakeld en de oorspronkelijke Telegram-tekst of het bijschrift beschikbaar is, voegt OpenClaw automatisch een native Telegram-citaatexcerpt toe. Telegram beperkt native citaattekst tot 1024 UTF-16-code-eenheden, dus langere berichten worden vanaf het begin geciteerd en vallen terug op een gewone reply als Telegram het citaat weigert.

    Opmerking: `off` schakelt impliciete reply-threading uit. Expliciete `[[reply_to_*]]`-tags worden nog steeds gerespecteerd.

  </Accordion>

  <Accordion title="Forumonderwerpen en thread-gedrag">
    Forum-supergroepen:

    - onderwerpssessiesleutels voegen `:topic:<threadId>` toe
    - replies en typen richten zich op de onderwerpsthread
    - configuratiepad voor onderwerp:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Speciaal geval voor algemeen onderwerp (`threadId=1`):

    - berichtverzendingen laten `message_thread_id` weg (Telegram weigert `sendMessage(...thread_id=1)`)
    - typacties bevatten nog steeds `message_thread_id`

    Onderwerpsovererving: onderwerpvermeldingen erven groepsinstellingen tenzij overschreven (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` is alleen voor onderwerpen en erft niet van groepsstandaarden.
    `topics."*"` stelt standaarden in voor elk onderwerp in die groep; exacte onderwerp-ID's winnen nog steeds van `"*"`.

    **Agent-routering per onderwerp**: Elk onderwerp kan naar een andere agent routeren door `agentId` in de onderwerpconfiguratie in te stellen. Dit geeft elk onderwerp zijn eigen geïsoleerde werkruimte, geheugen en sessie. Voorbeeld:

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

    **Persistente ACP-onderwerpsbinding**: Forumonderwerpen kunnen ACP-harness-sessies vastpinnen via getypeerde ACP-bindingen op topniveau (`bindings[]` met `type: "acp"` en `match.channel: "telegram"`, `peer.kind: "group"`, en een onderwerp-gekwalificeerde ID zoals `-1001234567890:topic:42`). Momenteel beperkt tot forumonderwerpen in groepen/supergroepen. Zie [ACP Agents](/nl/tools/acp-agents).

    **Thread-gebonden ACP-spawn vanuit chat**: `/acp spawn <agent> --thread here|auto` bindt het huidige onderwerp aan een nieuwe ACP-sessie; vervolgberichten worden daar rechtstreeks naartoe gerouteerd. OpenClaw pint de spawnbevestiging vast in het onderwerp. Vereist dat `channels.telegram.threadBindings.spawnSessions` ingeschakeld blijft (standaard: `true`).

    Templatecontext biedt `MessageThreadId` en `IsForum`. DM-chats met `message_thread_id` behouden reply-metadata; ze gebruiken alleen thread-bewuste sessiesleutels wanneer Telegram `getMe` `has_topics_enabled: true` voor de bot rapporteert.
    De eerdere `dm.threadReplies`- en `direct.*.threadReplies`-overrides zijn bewust buiten gebruik gesteld; gebruik de threaded mode van BotFather als enige bron van waarheid en voer `openclaw doctor --fix` uit om verouderde configuratiesleutels te verwijderen.

  </Accordion>

  <Accordion title="Audio, video en stickers">
    ### Audioberichten

    Telegram maakt onderscheid tussen spraaknotities en audiobestanden.

    - standaard: gedrag voor audiobestand
    - tag `[[audio_as_voice]]` in agentreply om verzending als spraaknotitie af te dwingen
    - binnenkomende transcripties van spraaknotities worden in de agentcontext ingekaderd als machinaal gegenereerde,
      niet-vertrouwde tekst; vermeldingsdetectie gebruikt nog steeds de ruwe
      transcriptie, zodat spraakberichten met vermeldingsgating blijven werken.

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

    Verwerking van binnenkomende stickers:

    - statische WEBP: gedownload en verwerkt (placeholder `<media:sticker>`)
    - geanimeerde TGS: overgeslagen
    - video-WEBM: overgeslagen

    Stickerscontextvelden:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    Stickerbeschrijvingen worden gecachet in de SQLite Plugin-status van OpenClaw om herhaalde vision-aanroepen te verminderen.

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

    Wanneer dit is ingeschakeld, zet OpenClaw systeemgebeurtenissen in de wachtrij, zoals:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Configuratie:

    - `channels.telegram.reactionNotifications`: `off | own | all` (standaard: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (standaard: `minimal`)

    Opmerkingen:

    - `own` betekent alleen gebruikersreacties op door de bot verzonden berichten (best-effort via cache van verzonden berichten).
    - Reactiegebeurtenissen respecteren nog steeds de toegangscontroles van Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); niet-geautoriseerde afzenders worden genegeerd.
    - Telegram levert geen thread-ID's in reactie-updates.
      - niet-forumgroepen worden naar de groepschatsessie gerouteerd
      - forumgroepen worden naar de algemene-onderwerpsessie van de groep gerouteerd (`:topic:1`), niet naar het exacte oorspronkelijke onderwerp

    `allowed_updates` voor polling/Webhook bevatten automatisch `message_reaction`.

  </Accordion>

  <Accordion title="Ack-reacties">
    `ackReaction` verzendt een bevestigingsemoji terwijl OpenClaw een binnenkomend bericht verwerkt. `ackReactionScope` bepaalt *wanneer* die emoji daadwerkelijk wordt verzonden.

    **Volgorde voor emoji-resolutie (`ackReaction`):**

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
    De standaardscope (`"group-mentions"`) activeert geen ack-reacties in directe berichten. Stel `messages.ackReactionScope` in op `"direct"` of `"all"` om een ack-reactie te krijgen op binnenkomende Telegram-DM's. De waarde wordt gelezen bij het starten van de Telegram-provider, dus een Gateway-herstart is nodig om de wijziging van kracht te laten worden.
    </Note>

  </Accordion>

  <Accordion title="Configuratieschrijfacties vanuit Telegram-gebeurtenissen en -commando's">
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

  <Accordion title="Long polling versus Webhook">
    Standaard wordt long polling gebruikt. Stel voor Webhook-modus `channels.telegram.webhookUrl` en `channels.telegram.webhookSecret` in; optioneel `webhookPath`, `webhookHost`, `webhookPort` (standaarden `/telegram-webhook`, `127.0.0.1`, `8787`).

    In long-pollingmodus bewaart OpenClaw zijn herstart-watermark pas nadat een update succesvol is gedispatcht. Als een handler faalt, blijft die update opnieuw probeerbaar in hetzelfde proces en wordt deze niet als voltooid weggeschreven voor herstart-deduplicatie.

    De lokale listener bindt aan `127.0.0.1:8787`. Voor publieke ingress plaatst u een reverse proxy voor de lokale poort of stelt u bewust `webhookHost: "0.0.0.0"` in.

    Webhook-modus valideert aanvraagguards, het geheime Telegram-token en de JSON-body voordat `200` aan Telegram wordt geretourneerd.
    OpenClaw verwerkt de update daarna asynchroon via dezelfde botlanes per chat/per onderwerp die door long polling worden gebruikt, zodat trage agentbeurten de afleverings-ACK van Telegram niet blokkeren.

  </Accordion>

  <Accordion title="Limieten, opnieuw proberen en CLI-doelen">
    - `channels.telegram.textChunkLimit` is standaard 4000.
    - `channels.telegram.chunkMode="newline"` geeft de voorkeur aan alineagrenzen (lege regels) vóór splitsen op lengte.
    - `channels.telegram.mediaMaxMb` (standaard 100) begrenst de grootte van inkomende en uitgaande Telegram-media.
    - `channels.telegram.mediaGroupFlushMs` (standaard 500) bepaalt hoelang Telegram-albums/mediagroepen worden gebufferd voordat OpenClaw ze als één inkomend bericht verzendt. Verhoog dit als albumonderdelen laat aankomen; verlaag het om de reactielatentie voor albums te verminderen.
    - `channels.telegram.timeoutSeconds` overschrijft de time-out van de Telegram API-client (als deze niet is ingesteld, geldt de standaard van grammY). Botclients klemmen geconfigureerde waarden onder de 60-secondenbeveiliging voor uitgaande tekst-/typverzoeken, zodat grammY de levering van zichtbare antwoorden niet afbreekt voordat de transportbeveiliging en fallback van OpenClaw kunnen draaien. Long polling gebruikt nog steeds een 45-secondenbeveiliging voor `getUpdates`-verzoeken, zodat inactieve polls niet eindeloos blijven hangen.
    - `channels.telegram.pollingStallThresholdMs` is standaard `120000`; stem alleen af tussen `30000` en `600000` voor fout-positieve herstarts door vastgelopen polling.
    - groepscontexthistorie gebruikt `channels.telegram.historyLimit` of `messages.groupChat.historyLimit` (standaard 50); `0` schakelt uit.
    - aanvullende context voor antwoorden/citaten/doorsturen wordt genormaliseerd naar één geselecteerd conversatiecontextvenster wanneer de gateway de bovenliggende berichten heeft waargenomen; de cache met waargenomen berichten leeft in de SQLite-pluginstatus van OpenClaw, en `openclaw doctor --fix` importeert verouderde sidecars. Telegram neemt slechts één ondiepe `reply_to_message` op in updates, dus ketens ouder dan de cache zijn beperkt tot de huidige updatepayload van Telegram.
    - Telegram-toelatingslijsten bepalen vooral wie de agent kan activeren, niet een volledige redactieboundary voor aanvullende context.
    - Besturing voor DM-historie:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - De configuratie `channels.telegram.retry` geldt voor Telegram-verzendhelpers (CLI/tools/acties) voor herstelbare uitgaande API-fouten. Levering van inkomende eindantwoorden gebruikt ook een begrensde veilige verzendpoging voor Telegram-fouten vóór verbinden, maar probeert geen dubbelzinnige netwerkenveloppen na verzending opnieuw die zichtbare berichten kunnen dupliceren.

    Verzenddoelen voor CLI en berichttools kunnen een numerieke chat-ID, gebruikersnaam of forumtopicdoel zijn:

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

    Alleen-Telegram-pollvlaggen:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` voor forumtopics (of gebruik een `:topic:`-doel)

    Telegram-verzenden ondersteunt ook:

    - `--presentation` met `buttons`-blokken voor inline toetsenborden wanneer `channels.telegram.capabilities.inlineButtons` dit toestaat
    - `--pin` of `--delivery '{"pin":true}'` om vastgezette levering aan te vragen wanneer de bot in die chat kan vastzetten
    - `--force-document` om uitgaande afbeeldingen, GIF's en video's als documenten te verzenden in plaats van als gecomprimeerde foto-, geanimeerde-media- of videouploads

    Actieblokkering:

    - `channels.telegram.actions.sendMessage=false` schakelt uitgaande Telegram-berichten uit, inclusief polls
    - `channels.telegram.actions.poll=false` schakelt het maken van Telegram-polls uit terwijl reguliere verzendingen ingeschakeld blijven

  </Accordion>

  <Accordion title="Exec-goedkeuringen in Telegram">
    Telegram ondersteunt exec-goedkeuringen in goedkeurders-DM's en kan optioneel prompts plaatsen in de oorspronkelijke chat of het oorspronkelijke topic. Goedkeurders moeten numerieke Telegram-gebruikers-ID's zijn.

    Configuratiepad:

    - `channels.telegram.execApprovals.enabled` (wordt automatisch ingeschakeld wanneer minstens één goedkeurder oplosbaar is)
    - `channels.telegram.execApprovals.approvers` (valt terug op numerieke eigenaar-ID's uit `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (standaard) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` en `defaultTo` bepalen wie met de bot kan praten en waar normale antwoorden naartoe worden gestuurd. Ze maken iemand geen exec-goedkeurder. De eerste goedgekeurde DM-koppeling bootstrapt `commands.ownerAllowFrom` wanneer er nog geen opdrachteigenaar bestaat, zodat de setup met één eigenaar nog steeds werkt zonder ID's te dupliceren onder `execApprovals.approvers`.

    Kanaallevering toont de opdrachttekst in de chat; schakel `channel` of `both` alleen in vertrouwde groepen/topics in. Wanneer de prompt in een forumtopic terechtkomt, behoudt OpenClaw het topic voor de goedkeuringsprompt en de opvolging. Exec-goedkeuringen verlopen standaard na 30 minuten.

    Inline goedkeuringsknoppen vereisen ook dat `channels.telegram.capabilities.inlineButtons` het doeloppervlak toestaat (`dm`, `group` of `all`). Goedkeurings-ID's met het voorvoegsel `plugin:` worden via plugin-goedkeuringen opgelost; andere worden eerst via exec-goedkeuringen opgelost.

    Zie [Exec-goedkeuringen](/nl/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Besturing voor foutantwoorden

Wanneer de agent een leverings- of providerfout tegenkomt, kan Telegram antwoorden met de fouttekst of deze onderdrukken. Twee configuratiesleutels bepalen dit gedrag:

| Sleutel                             | Waarden           | Standaard | Beschrijving                                                                                   |
| ----------------------------------- | ----------------- | --------- | ---------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`   | `reply` stuurt een vriendelijke foutmelding naar de chat. `silent` onderdrukt foutantwoorden volledig. |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000`   | Minimale tijd tussen foutantwoorden aan dezelfde chat. Voorkomt foutspam tijdens storingen.    |

Overschrijvingen per account, per groep en per topic worden ondersteund (dezelfde overerving als andere Telegram-configuratiesleutels).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "reply",
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
      - BotFather: `/setprivacy` -> Disable
      - verwijder daarna de bot uit de groep en voeg deze opnieuw toe
    - `openclaw channels status` waarschuwt wanneer de configuratie groepsberichten zonder vermelding verwacht.
    - `openclaw channels status --probe` kan expliciete numerieke groeps-ID's controleren; wildcard `"*"` kan niet op lidmaatschap worden gecontroleerd.
    - snelle sessietest: `/activation always`.

  </Accordion>

  <Accordion title="Bot ziet helemaal geen groepsberichten">

    - wanneer `channels.telegram.groups` bestaat, moet de groep vermeld zijn (of `"*"` bevatten)
    - controleer het botlidmaatschap in de groep
    - bekijk logs: `openclaw logs --follow` voor redenen om over te slaan

  </Accordion>

  <Accordion title="Opdrachten werken gedeeltelijk of helemaal niet">

    - autoriseer je afzenderidentiteit (koppeling en/of numerieke `allowFrom`)
    - opdrachtautorisatie geldt nog steeds, zelfs wanneer het groepsbeleid `open` is
    - `setMyCommands failed` met `BOT_COMMANDS_TOO_MUCH` betekent dat het native menu te veel items heeft; verminder plugin-/skill-/aangepaste opdrachten of schakel native menu's uit
    - `deleteMyCommands`- / `setMyCommands`-startupcalls en `sendChatAction`-typcalls zijn begrensd en worden bij aanvraagtime-out één keer opnieuw geprobeerd via de transportfallback van Telegram. Aanhoudende netwerk-/fetchfouten wijzen meestal op DNS-/HTTPS-bereikbaarheidsproblemen naar `api.telegram.org`

  </Accordion>

  <Accordion title="Startup meldt ongeautoriseerd token">

    - `getMe returned 401` is een Telegram-authenticatiefout voor het geconfigureerde bottoken.
    - Kopieer het bottoken opnieuw of genereer het opnieuw in BotFather, en werk daarna `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` of `TELEGRAM_BOT_TOKEN` bij voor het standaardaccount.
    - `deleteWebhook 401 Unauthorized` tijdens startup is ook een authenticatiefout; dit behandelen als "er bestaat geen webhook" zou dezelfde fout door het slechte token alleen uitstellen tot latere API-calls.

  </Accordion>

  <Accordion title="Instabiliteit van polling of netwerk">

    - Node 22+ + aangepaste fetch/proxy kan onmiddellijk afbreekgedrag veroorzaken als AbortSignal-typen niet overeenkomen.
    - Sommige hosts lossen `api.telegram.org` eerst naar IPv6 op; kapotte IPv6-egress kan intermitterende Telegram API-fouten veroorzaken.
    - Als logs `TypeError: fetch failed` of `Network request for 'getUpdates' failed!` bevatten, probeert OpenClaw deze nu opnieuw als herstelbare netwerkfouten.
    - Tijdens polling-startup hergebruikt OpenClaw de succesvolle startup-`getMe`-probe voor grammY, zodat de runner geen tweede `getMe` nodig heeft vóór de eerste `getUpdates`.
    - Als `deleteWebhook` mislukt met een tijdelijke netwerkfout tijdens polling-startup, gaat OpenClaw door met long polling in plaats van nog een controle-plane-call vóór polling te doen. Een nog actieve webhook verschijnt als een `getUpdates`-conflict; OpenClaw bouwt daarna het Telegram-transport opnieuw op en probeert webhookopschoning opnieuw.
    - Als Telegram-sockets met een korte vaste cadans worden gerecycled, controleer dan op een lage `channels.telegram.timeoutSeconds`; botclients klemmen geconfigureerde waarden onder de uitgaande en `getUpdates`-verzoekbeveiligingen, maar oudere releases konden elke poll of elk antwoord afbreken wanneer dit onder die beveiligingen was ingesteld.
    - Als logs `Polling stall detected` bevatten, herstart OpenClaw polling en bouwt het Telegram-transport standaard opnieuw op na 120 seconden zonder voltooide long-poll-liveness.
    - `openclaw channels status --probe` en `openclaw doctor` waarschuwen wanneer een actief pollingaccount `getUpdates` niet heeft voltooid na de startup-respijtperiode, wanneer een actief webhookaccount `setWebhook` niet heeft voltooid na de startup-respijtperiode, of wanneer de laatste succesvolle pollingtransportactiviteit verouderd is.
    - Verhoog `channels.telegram.pollingStallThresholdMs` alleen wanneer langlopende `getUpdates`-calls gezond zijn maar je host nog steeds foutieve herstarts door vastgelopen polling meldt. Aanhoudende stalls wijzen meestal op proxy-, DNS-, IPv6- of TLS-egressproblemen tussen de host en `api.telegram.org`.
    - Telegram respecteert ook procesproxy-env voor Bot API-transport, inclusief `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` en hun varianten in kleine letters. `NO_PROXY` / `no_proxy` kan `api.telegram.org` nog steeds omzeilen.
    - Als de door OpenClaw beheerde proxy via `OPENCLAW_PROXY_URL` is geconfigureerd voor een serviceomgeving en er geen standaard proxy-env aanwezig is, gebruikt Telegram die URL ook voor Bot API-transport.
    - Leid Telegram API-calls op VPS-hosts met instabiele directe egress/TLS via `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ gebruikt standaard `autoSelectFamily=true` (behalve WSL2). De DNS-resultaatvolgorde van Telegram respecteert `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, daarna `channels.telegram.network.dnsResultOrder`, daarna de processtandaard zoals `NODE_OPTIONS=--dns-result-order=ipv4first`; als geen daarvan geldt, valt Node 22+ terug op `ipv4first`.
    - Als je host WSL2 is of expliciet beter werkt met alleen-IPv4-gedrag, forceer familieselectie:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Antwoorden in het RFC 2544-benchmarkbereik (`198.18.0.0/15`) zijn al standaard toegestaan
      voor Telegram-mediadownloads. Als een vertrouwde fake-IP of
      transparante proxy `api.telegram.org` tijdens mediadownloads herschrijft naar een ander
      prive-/intern/speciaal adres, kun je de alleen-voor-Telegram-omzeiling
      inschakelen:

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
      benchmarkbereik al standaard toe.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` verzwakt de Telegram-
      media-SSRF-bescherming. Gebruik dit alleen voor vertrouwde, door operators beheerde proxy-
      omgevingen zoals Clash-, Mihomo- of Surge-fake-IP-routering wanneer zij
      prive- of speciale antwoorden buiten het RFC 2544-benchmarkbereik
      synthetiseren. Laat dit uit voor normale openbare Telegram-toegang via internet.
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

- opstarten/auth: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` moet naar een regulier bestand verwijzen; symbolische koppelingen worden geweigerd)
- toegangscontrole: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` op topniveau (`type: "acp"`)
- topicstandaarden: `groups.<chatId>.topics."*"` geldt voor niet-overeenkomende forumtopics; exacte topic-ID's overschrijven dit
- exec-goedkeuringen: `execApprovals`, `accounts.*.execApprovals`
- opdracht/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- threads/antwoorden: `replyToMode`
- streaming: `streaming` (preview), `streaming.preview.toolProgress`, `blockStreaming`
- opmaak/levering: `textChunkLimit`, `chunkMode`, `richMessages`, `linkPreview`, `responsePrefix`
- media/netwerk: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- aangepaste API-root: `apiRoot` (alleen Bot API-root; neem `/bot<TOKEN>` niet op)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- acties/mogelijkheden: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reacties: `reactionNotifications`, `reactionLevel`
- fouten: `errorPolicy`, `errorCooldownMs`
- schrijven/geschiedenis: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Voorrang bij meerdere accounts: wanneer twee of meer account-ID's zijn geconfigureerd, stel je `channels.telegram.defaultAccount` in (of neem je `channels.telegram.accounts.default` op) om standaardroutering expliciet te maken. Anders valt OpenClaw terug op het eerste genormaliseerde account-ID en waarschuwt `openclaw doctor`. Benoemde accounts erven `channels.telegram.allowFrom` / `groupAllowFrom`, maar niet de waarden van `accounts.default.*`.
</Note>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/nl/channels/pairing">
    Koppel een Telegram-gebruiker aan de Gateway.
  </Card>
  <Card title="Groups" icon="users" href="/nl/channels/groups">
    Gedrag voor allowlists van groepen en topics.
  </Card>
  <Card title="Channel routing" icon="route" href="/nl/channels/channel-routing">
    Routeer inkomende berichten naar agents.
  </Card>
  <Card title="Security" icon="shield" href="/nl/gateway/security">
    Dreigingsmodel en hardening.
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/nl/concepts/multi-agent">
    Wijs groepen en topics toe aan agents.
  </Card>
  <Card title="Troubleshooting" icon="wrench" href="/nl/channels/troubleshooting">
    Diagnostiek voor meerdere kanalen.
  </Card>
</CardGroup>
