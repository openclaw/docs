---
read_when:
    - Werken aan Telegram-functies of Webhooks
summary: Ondersteuningsstatus, mogelijkheden en configuratie voor Telegram-bots
title: Telegram
x-i18n:
    generated_at: "2026-05-12T12:48:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 185ac6051d3da2037b2727a6afca98bef946bc62c3f2b22cc9afe9831669297b
    source_path: channels/telegram.md
    workflow: 16
---

Productieklaar voor bot-DM's en groepen via grammY. Long polling is de standaardmodus; Webhook-modus is optioneel.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/nl/channels/pairing">
    Het standaard DM-beleid voor Telegram is koppelen.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/nl/channels/troubleshooting">
    Cross-channel diagnostiek en herstelplaybooks.
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/nl/gateway/configuration">
    Volledige kanaalconfiguratiepatronen en voorbeelden.
  </Card>
</CardGroup>

## Snelle installatie

<Steps>
  <Step title="Create the bot token in BotFather">
    Open Telegram en chat met **@BotFather** (controleer of de handle exact `@BotFather` is).

    Voer `/newbot` uit, volg de prompts en sla het token op.

  </Step>

  <Step title="Configure token and DM policy">

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
    Telegram gebruikt **geen** `openclaw channels login telegram`; configureer het token in config/env en start daarna de Gateway.

  </Step>

  <Step title="Start gateway and approve first DM">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Koppelcodes verlopen na 1 uur.

  </Step>

  <Step title="Add the bot to a group">
    Voeg de bot toe aan je groep en haal daarna beide ID's op die groepstoegang nodig heeft:

    - je Telegram-gebruikers-ID, gebruikt in `allowFrom` / `groupAllowFrom`
    - de Telegram-groepschat-ID, gebruikt als sleutel onder `channels.telegram.groups`

    Haal bij de eerste installatie de groepschat-ID op uit `openclaw logs --follow`, een bot voor doorgestuurde ID's of Bot API `getUpdates`. Nadat de groep is toegestaan, kan `/whoami@<bot_username>` de gebruikers- en groeps-ID's bevestigen.

    Negatieve Telegram-supergroep-ID's die beginnen met `-100` zijn groepschat-ID's. Plaats ze onder `channels.telegram.groups`, niet onder `groupAllowFrom`.

  </Step>
</Steps>

<Note>
De volgorde voor tokenresolutie is accountbewust. In de praktijk winnen configwaarden van de env-fallback, en `TELEGRAM_BOT_TOKEN` geldt alleen voor het standaardaccount.
</Note>

## Telegram-instellingen

<AccordionGroup>
  <Accordion title="Privacy mode and group visibility">
    Telegram-bots gebruiken standaard **Privacy Mode**, waardoor wordt beperkt welke groepsberichten ze ontvangen.

    Als de bot alle groepsberichten moet zien, doe dan een van beide:

    - schakel de privacymodus uit via `/setprivacy`, of
    - maak de bot groepsbeheerder.

    Wanneer je de privacymodus omschakelt, verwijder je de bot uit elke groep en voeg je hem opnieuw toe zodat Telegram de wijziging toepast.

  </Accordion>

  <Accordion title="Group permissions">
    Beheerdersstatus wordt beheerd in de Telegram-groepsinstellingen.

    Beheerderbots ontvangen alle groepsberichten, wat nuttig is voor altijd actieve groepsfunctionaliteit.

  </Accordion>

  <Accordion title="Helpful BotFather toggles">

    - `/setjoingroups` om toevoegen aan groepen toe te staan/te weigeren
    - `/setprivacy` voor gedrag rond zichtbaarheid in groepen

  </Accordion>
</AccordionGroup>

## Toegangscontrole en activering

<Tabs>
  <Tab title="DM policy">
    `channels.telegram.dmPolicy` beheert toegang via directe berichten:

    - `pairing` (standaard)
    - `allowlist` (vereist ten minste één afzender-ID in `allowFrom`)
    - `open` (vereist dat `allowFrom` `"*"` bevat)
    - `disabled`

    `dmPolicy: "open"` met `allowFrom: ["*"]` laat elk Telegram-account dat de botgebruikersnaam vindt of raadt de bot opdrachten geven. Gebruik dit alleen voor bewust openbare bots met strikt beperkte tools; bots met één eigenaar moeten `allowlist` gebruiken met numerieke gebruikers-ID's.

    `channels.telegram.allowFrom` accepteert numerieke Telegram-gebruikers-ID's. Voorvoegsels `telegram:` / `tg:` worden geaccepteerd en genormaliseerd.
    In multi-accountconfiguraties wordt een beperkende `channels.telegram.allowFrom` op topniveau behandeld als een veiligheidsgrens: accountniveau-items `allowFrom: ["*"]` maken dat account niet openbaar tenzij de effectieve account-allowlist na samenvoeging nog steeds een expliciete wildcard bevat.
    `dmPolicy: "allowlist"` met lege `allowFrom` blokkeert alle DM's en wordt afgewezen door configvalidatie.
    De installatie vraagt alleen om numerieke gebruikers-ID's.
    Als je hebt geüpgraded en je config `@username`-allowlistitems bevat, voer dan `openclaw doctor --fix` uit om ze op te lossen (best-effort; vereist een Telegram-bottoken).
    Als je eerder vertrouwde op allowlistbestanden uit de koppelingsopslag, kan `openclaw doctor --fix` items herstellen naar `channels.telegram.allowFrom` in allowlistflows (bijvoorbeeld wanneer `dmPolicy: "allowlist"` nog geen expliciete ID's heeft).

    Voor bots met één eigenaar geef je de voorkeur aan `dmPolicy: "allowlist"` met expliciete numerieke `allowFrom`-ID's, zodat het toegangsbeleid duurzaam in de config staat (in plaats van afhankelijk te zijn van eerdere koppelingsgoedkeuringen).

    Veelvoorkomende verwarring: goedkeuring van DM-koppeling betekent niet "deze afzender is overal geautoriseerd".
    Koppeling verleent DM-toegang. Als er nog geen opdrachteigenaar bestaat, stelt de eerste goedgekeurde koppeling ook `commands.ownerAllowFrom` in, zodat alleen-eigenaar-opdrachten en exec-goedkeuringen een expliciet operatoraccount hebben.
    Autorisatie van afzenders in groepen komt nog steeds uit expliciete config-allowlists.
    Als je wilt "ik ben één keer geautoriseerd en zowel DM's als groepsopdrachten werken", plaats dan je numerieke Telegram-gebruikers-ID in `channels.telegram.allowFrom`; zorg er voor alleen-eigenaar-opdrachten voor dat `commands.ownerAllowFrom` `telegram:<your user id>` bevat.

    ### Je Telegram-gebruikers-ID vinden

    Veiliger (geen bot van derden):

    1. Stuur je bot een DM.
    2. Voer `openclaw logs --follow` uit.
    3. Lees `from.id`.

    Officiële Bot API-methode:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Methode van derden (minder privé): `@userinfobot` of `@getidsbot`.

  </Tab>

  <Tab title="Group policy and allowlists">
    Twee controles gelden samen:

    1. **Welke groepen zijn toegestaan** (`channels.telegram.groups`)
       - geen `groups`-config:
         - met `groupPolicy: "open"`: elke groep kan groeps-ID-controles doorstaan
         - met `groupPolicy: "allowlist"` (standaard): groepen worden geblokkeerd totdat je `groups`-items (of `"*"`) toevoegt
       - `groups` geconfigureerd: werkt als allowlist (expliciete ID's of `"*"`)

    2. **Welke afzenders in groepen zijn toegestaan** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (standaard)
       - `disabled`

    `groupAllowFrom` wordt gebruikt voor het filteren van groepsafzenders. Als dit niet is ingesteld, valt Telegram terug op `allowFrom`.
    `groupAllowFrom`-items moeten numerieke Telegram-gebruikers-ID's zijn (voorvoegsels `telegram:` / `tg:` worden genormaliseerd).
    Plaats geen Telegram-groeps- of supergroepchat-ID's in `groupAllowFrom`. Negatieve chat-ID's horen onder `channels.telegram.groups`.
    Niet-numerieke items worden genegeerd voor afzenderautorisatie.
    Veiligheidsgrens (`2026.2.25+`): afzenderauthenticatie in groepen erft **geen** goedkeuringen uit de DM-koppelingsopslag.
    Koppeling blijft alleen voor DM's. Stel voor groepen `groupAllowFrom` of `allowFrom` per groep/per onderwerp in.
    Als `groupAllowFrom` niet is ingesteld, valt Telegram terug op config `allowFrom`, niet op de koppelingsopslag.
    Praktisch patroon voor bots met één eigenaar: stel je gebruikers-ID in `channels.telegram.allowFrom` in, laat `groupAllowFrom` leeg en sta de doelgroepen toe onder `channels.telegram.groups`.
    Runtime-opmerking: als `channels.telegram` volledig ontbreekt, gebruikt runtime standaard fail-closed `groupPolicy="allowlist"` tenzij `channels.defaults.groupPolicy` expliciet is ingesteld.

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

    Test het vanuit de groep met `@<bot_username> ping`. Gewone groepsberichten activeren de bot niet zolang `requireMention: true`.

    Voorbeeld: elk lid in één specifieke groep toestaan:

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

    Voorbeeld: alleen specifieke gebruikers binnen één specifieke groep toestaan:

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

      - Plaats negatieve Telegram-groeps- of supergroepchat-ID's zoals `-1001234567890` onder `channels.telegram.groups`.
      - Plaats Telegram-gebruikers-ID's zoals `8734062810` onder `groupAllowFrom` wanneer je wilt beperken welke mensen binnen een toegestane groep de bot kunnen activeren.
      - Gebruik `groupAllowFrom: ["*"]` alleen wanneer je wilt dat elk lid van een toegestane groep met de bot kan praten.

    </Warning>

  </Tab>

  <Tab title="Mention behavior">
    Groepsantwoorden vereisen standaard een vermelding.

    Vermelding kan komen van:

    - native `@botusername`-vermelding, of
    - vermeldingspatronen in:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Opdrachtschakelaars op sessieniveau:

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

    De groepschat-ID ophalen:

    - stuur een groepsbericht door naar `@userinfobot` / `@getidsbot`
    - of lees `chat.id` uit `openclaw logs --follow`
    - of inspecteer Bot API `getUpdates`
    - nadat de groep is toegestaan, voer je `/whoami@<bot_username>` uit als native opdrachten zijn ingeschakeld

  </Tab>
</Tabs>

## Runtime-gedrag

- Telegram is eigendom van het Gateway-proces.
- Routing is deterministisch: inkomende Telegram-berichten antwoorden terug naar Telegram (het model kiest geen kanalen).
- Inkomende berichten worden genormaliseerd naar de gedeelde kanaalenvelop met antwoordmetadata, mediaplaceholders en persistente antwoordketencontext voor Telegram-antwoorden die de Gateway heeft waargenomen.
- Groepssessies zijn geïsoleerd per groeps-ID. Forumonderwerpen voegen `:topic:<threadId>` toe om onderwerpen geïsoleerd te houden.
- DM-berichten kunnen `message_thread_id` bevatten; OpenClaw behoudt de thread-ID voor antwoorden maar houdt DM's standaard op de vlakke sessie. Configureer `channels.telegram.dm.threadReplies: "inbound"`, `channels.telegram.direct.<chatId>.threadReplies: "inbound"`, `requireTopic: true` of een overeenkomende onderwerpconfig wanneer je bewust DM-onderwerpsessie-isolatie wilt.
- Long polling gebruikt grammY runner met sequencing per chat/per thread. De algehele runner-sinkconcurrency gebruikt `agents.defaults.maxConcurrent`.
- Long polling wordt binnen elk Gateway-proces bewaakt, zodat slechts één actieve poller tegelijk een bottoken kan gebruiken. Als je nog steeds `getUpdates` 409-conflicten ziet, gebruikt waarschijnlijk een andere OpenClaw Gateway, script of externe poller hetzelfde token.
- Herstarts van de long-polling-watchdog worden standaard geactiveerd na 120 seconden zonder voltooide `getUpdates`-liveness. Verhoog `channels.telegram.pollingStallThresholdMs` alleen als je deployment nog steeds valse polling-stall-herstarts ziet tijdens langlopend werk. De waarde is in milliseconden en is toegestaan van `30000` tot `600000`; overrides per account worden ondersteund.
- Telegram Bot API ondersteunt geen leesbevestigingen (`sendReadReceipts` is niet van toepassing).

## Functiereferentie

<AccordionGroup>
  <Accordion title="Live stream preview (message edits)">
    OpenClaw kan gedeeltelijke antwoorden in realtime streamen:

    - directe chats: voorbeeldbericht + `editMessageText`
    - groepen/onderwerpen: voorbeeldbericht + `editMessageText`

    Vereiste:

    - `channels.telegram.streaming` is `off | partial | block | progress` (standaard: `partial`)
    - `progress` behoudt één bewerkbaar statusconcept voor toolvoortgang, wist dit bij voltooiing en verzendt het uiteindelijke antwoord als een normaal bericht
    - `streaming.preview.toolProgress` bepaalt of tool-/voortgangsupdates hetzelfde bewerkte voorbeeldbericht opnieuw gebruiken (standaard: `true` wanneer voorbeeldstreaming actief is)
    - `streaming.preview.commandText` bepaalt opdracht-/exec-details binnen die toolvoortgangsregels: `raw` (standaard, behoudt uitgebracht gedrag) of `status` (alleen toollabel)
    - verouderde waarden `channels.telegram.streamMode` en booleaanse `streaming`-waarden worden gedetecteerd; voer `openclaw doctor --fix` uit om ze te migreren naar `channels.telegram.streaming.mode`

    Voorbeeldupdates voor toolvoortgang zijn de korte statusregels die worden getoond terwijl tools worden uitgevoerd, bijvoorbeeld opdrachtuitvoering, bestandslezingen, planningsupdates of patchsamenvattingen. Telegram houdt deze standaard ingeschakeld om overeen te komen met uitgebracht OpenClaw-gedrag vanaf `v2026.4.22` en later. Stel het volgende in om het bewerkte voorbeeld voor antwoordtekst te behouden maar toolvoortgangsregels te verbergen:

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

    Gebruik de modus `progress` wanneer u zichtbare toolvoortgang wilt zonder het uiteindelijke antwoord in datzelfde bericht te bewerken. Plaats het beleid voor opdrachttekst onder `streaming.progress`:

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

    Gebruik `streaming.mode: "off"` alleen wanneer u uitsluitend uiteindelijke levering wilt: Telegram-voorbeeldbewerkingen zijn uitgeschakeld en generieke tool-/voortgangspraat wordt onderdrukt in plaats van als zelfstandige statusberichten te worden verzonden. Goedkeuringsprompts, media-payloads en fouten lopen nog steeds via normale uiteindelijke levering. Gebruik `streaming.preview.toolProgress: false` wanneer u alleen antwoordvoorbeeldbewerkingen wilt behouden terwijl u de statusregels voor toolvoortgang verbergt.

    <Note>
      Antwoorden met geselecteerde citaten in Telegram vormen de uitzondering. Wanneer `replyToMode` `"first"`, `"all"` of `"batched"` is en het inkomende bericht geselecteerde citaattekst bevat, verzendt OpenClaw het uiteindelijke antwoord via het native citaat-antwoordpad van Telegram in plaats van het antwoordvoorbeeld te bewerken, zodat `streaming.preview.toolProgress` de korte statusregels voor die beurt niet kan tonen. Antwoorden op het huidige bericht zonder geselecteerde citaattekst behouden nog steeds voorbeeldstreaming. Stel `replyToMode: "off"` in wanneer zichtbaarheid van toolvoortgang belangrijker is dan native citaatantwoorden, of stel `streaming.preview.toolProgress: false` in om de afweging te erkennen.
    </Note>

    Voor antwoorden met alleen tekst:

    - korte voorbeelden in DM/groep/topic: OpenClaw behoudt hetzelfde voorbeeldbericht en voert de uiteindelijke bewerking ter plaatse uit
    - lange tekstfinales die in meerdere Telegram-berichten worden opgesplitst, gebruiken het bestaande voorbeeld waar mogelijk opnieuw als het eerste uiteindelijke deel en verzenden daarna alleen de resterende delen
    - finales in voortgangsmodus wissen het statusconcept en gebruiken normale uiteindelijke levering in plaats van het concept in het antwoord te bewerken
    - als de uiteindelijke bewerking mislukt voordat de voltooide tekst is bevestigd, gebruikt OpenClaw normale uiteindelijke levering en ruimt het verouderde voorbeeld op

    Voor complexe antwoorden (bijvoorbeeld media-payloads) valt OpenClaw terug op normale uiteindelijke levering en ruimt daarna het voorbeeldbericht op.

    Voorbeeldstreaming staat los van blokstreaming. Wanneer blokstreaming expliciet is ingeschakeld voor Telegram, slaat OpenClaw de voorbeeldstream over om dubbel streamen te voorkomen.

    Redeneringsstream alleen voor Telegram:

    - `/reasoning stream` verzendt redenering naar het livevoorbeeld tijdens het genereren
    - het redeneringsvoorbeeld wordt verwijderd na uiteindelijke levering; gebruik `/reasoning on` wanneer redenering zichtbaar moet blijven
    - het uiteindelijke antwoord wordt zonder redeneringstekst verzonden

  </Accordion>

  <Accordion title="Opmaak en HTML-fallback">
    Uitgaande tekst gebruikt Telegram `parse_mode: "HTML"`.

    - Markdown-achtige tekst wordt gerenderd naar Telegram-veilige HTML.
    - Ondersteunde Telegram-HTML-tags blijven behouden; niet-ondersteunde HTML wordt geëscapet.
    - Als Telegram geparste HTML weigert, probeert OpenClaw het opnieuw als platte tekst.

    Linkvoorbeelden zijn standaard ingeschakeld en kunnen worden uitgeschakeld met `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Native opdrachten en aangepaste opdrachten">
    Registratie van het Telegram-opdrachtmenu wordt bij het opstarten afgehandeld met `setMyCommands`.

    Standaarden voor native opdrachten:

    - `commands.native: "auto"` schakelt native opdrachten in voor Telegram

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

    - namen worden genormaliseerd (voorloop-`/` verwijderen, naar kleine letters)
    - geldig patroon: `a-z`, `0-9`, `_`, lengte `1..32`
    - aangepaste opdrachten kunnen native opdrachten niet overschrijven
    - conflicten/duplicaten worden overgeslagen en gelogd

    Opmerkingen:

    - aangepaste opdrachten zijn alleen menu-items; ze implementeren niet automatisch gedrag
    - plugin-/skill-opdrachten kunnen nog steeds werken wanneer ze worden getypt, zelfs als ze niet in het Telegram-menu worden weergegeven

    Als native opdrachten zijn uitgeschakeld, worden ingebouwde opdrachten verwijderd. Aangepaste/plugin-opdrachten kunnen nog steeds registreren als ze zijn geconfigureerd.

    Veelvoorkomende installatiefouten:

    - `setMyCommands failed` met `BOT_COMMANDS_TOO_MUCH` betekent dat het Telegram-menu na inkorten nog steeds te vol was; verminder plugin-/skill-/aangepaste opdrachten of schakel `channels.telegram.commands.native` uit.
    - `deleteWebhook`, `deleteMyCommands` of `setMyCommands` die mislukt met `404: Not Found` terwijl directe Bot API-curlopdrachten werken, kan betekenen dat `channels.telegram.apiRoot` was ingesteld op het volledige `/bot<TOKEN>`-eindpunt. `apiRoot` mag alleen de Bot API-root zijn, en `openclaw doctor --fix` verwijdert een per ongeluk toegevoegde afsluitende `/bot<TOKEN>`.
    - `getMe returned 401` betekent dat Telegram de geconfigureerde bottoken heeft geweigerd. Werk `botToken`, `tokenFile` of `TELEGRAM_BOT_TOKEN` bij met de huidige BotFather-token; OpenClaw stopt vóór polling, zodat dit niet als een webhook-opruimfout wordt gerapporteerd.
    - `setMyCommands failed` met netwerk-/fetchfouten betekent meestal dat uitgaande DNS/HTTPS naar `api.telegram.org` is geblokkeerd.

    ### Opdrachten voor apparaatkoppeling (`device-pair`-plugin)

    Wanneer de `device-pair`-plugin is geïnstalleerd:

    1. `/pair` genereert installatiecode
    2. plak code in iOS-app
    3. `/pair pending` geeft openstaande aanvragen weer (inclusief rol/scopes)
    4. keur de aanvraag goed:
       - `/pair approve <requestId>` voor expliciete goedkeuring
       - `/pair approve` wanneer er slechts één openstaande aanvraag is
       - `/pair approve latest` voor de meest recente

    De installatiecode bevat een kortlevende bootstrap-token. Ingebouwde bootstrap-overdracht houdt de primaire node-token op `scopes: []`; elke overgedragen operatortoken blijft beperkt tot `operator.approvals`, `operator.read`, `operator.talk.secrets` en `operator.write`. Bootstrap-scopecontroles zijn voorzien van een rolprefix, dus die operator-allowlist voldoet alleen aan operatoraanvragen; niet-operatorrollen hebben nog steeds scopes nodig onder hun eigen rolprefix.

    Als een apparaat opnieuw probeert met gewijzigde auth-details (bijvoorbeeld rol/scopes/publieke sleutel), wordt de vorige openstaande aanvraag vervangen en gebruikt de nieuwe aanvraag een andere `requestId`. Voer `/pair pending` opnieuw uit vóór goedkeuring.

    Meer details: [Koppelen](/nl/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="Inline knoppen">
    Configureer bereik voor inline toetsenbord:

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

    Callback-kliks worden als tekst aan de agent doorgegeven:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Telegram-berichtacties voor agents en automatisering">
    Telegram-toolacties omvatten:

    - `sendMessage` (`to`, `content`, optioneel `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, optioneel `iconColor`, `iconCustomEmojiId`)

    Kanaalberichtacties bieden ergonomische aliassen (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Poortwachtercontroles:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (standaard: uitgeschakeld)

    Opmerking: `edit` en `topic-create` zijn momenteel standaard ingeschakeld en hebben geen afzonderlijke `channels.telegram.actions.*`-schakelaars.
    Runtime-verzendingen gebruiken de actieve config-/secretssnapshot (opstarten/herladen), dus actiepaden voeren geen ad-hoc SecretRef-herresolutie per verzending uit.

    Semantiek voor het verwijderen van reacties: [/tools/reactions](/nl/tools/reactions)

  </Accordion>

  <Accordion title="Tags voor antwoordthreads">
    Telegram ondersteunt expliciete tags voor antwoordthreads in gegenereerde uitvoer:

    - `[[reply_to_current]]` antwoordt op het activerende bericht
    - `[[reply_to:<id>]]` antwoordt op een specifiek Telegram-bericht-ID

    `channels.telegram.replyToMode` bepaalt de afhandeling:

    - `off` (standaard)
    - `first`
    - `all`

    Wanneer antwoordthreading is ingeschakeld en de oorspronkelijke Telegram-tekst of bijschrift beschikbaar is, voegt OpenClaw automatisch een native Telegram-citaatuittreksel toe. Telegram beperkt native citaattekst tot 1024 UTF-16-code-eenheden, dus langere berichten worden vanaf het begin geciteerd en vallen terug op een gewoon antwoord als Telegram het citaat weigert.

    Opmerking: `off` schakelt impliciete antwoordthreading uit. Expliciete `[[reply_to_*]]`-tags worden nog steeds gerespecteerd.

  </Accordion>

  <Accordion title="Forumtopics en threadgedrag">
    Forum-supergroepen:

    - topic-sessiesleutels voegen `:topic:<threadId>` toe
    - antwoorden en typen richten zich op de topicthread
    - configuratiepad voor topic:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Speciaal geval voor algemeen topic (`threadId=1`):

    - berichtverzendingen laten `message_thread_id` weg (Telegram weigert `sendMessage(...thread_id=1)`)
    - typeacties bevatten nog steeds `message_thread_id`

    Topic-overerving: topic-items erven groepsinstellingen tenzij overschreven (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` is alleen voor topics en erft niet van groepsstandaarden.

    **Agentroutering per topic**: Elk topic kan naar een andere agent routeren door `agentId` in de topicconfiguratie in te stellen. Dit geeft elk topic zijn eigen geïsoleerde werkruimte, geheugen en sessie. Voorbeeld:

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

    Elk onderwerp heeft dan een eigen sessiesleutel: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Persistente ACP-onderwerpbinding**: Forumonderwerpen kunnen ACP-harness-sessies vastzetten via getypte ACP-bindingen op topniveau (`bindings[]` met `type: "acp"` en `match.channel: "telegram"`, `peer.kind: "group"`, en een onderwerp-gekwalificeerde id zoals `-1001234567890:topic:42`). Momenteel beperkt tot forumonderwerpen in groepen/supergroepen. Zie [ACP Agents](/nl/tools/acp-agents).

    **Thread-gebonden ACP-spawn vanuit chat**: `/acp spawn <agent> --thread here|auto` bindt het huidige onderwerp aan een nieuwe ACP-sessie; vervolgberichten worden daar rechtstreeks naartoe gerouteerd. OpenClaw zet de spawnbevestiging vast in het onderwerp. Vereist dat `channels.telegram.threadBindings.spawnSessions` ingeschakeld blijft (standaard: `true`).

    De templatecontext stelt `MessageThreadId` en `IsForum` beschikbaar. DM-chats met `message_thread_id` behouden standaard DM-routering en antwoordmetadata op platte sessies; ze gebruiken alleen thread-bewuste sessiesleutels wanneer ze zijn geconfigureerd met `threadReplies: "inbound"`, `threadReplies: "always"`, `requireTopic: true`, of een overeenkomende onderwerpconfiguratie. Gebruik `channels.telegram.dm.threadReplies` op topniveau voor de accountstandaard, of `direct.<chatId>.threadReplies` voor één DM.

  </Accordion>

  <Accordion title="Audio, video en stickers">
    ### Audioberichten

    Telegram maakt onderscheid tussen spraaknotities en audiobestanden.

    - standaard: gedrag voor audiobestanden
    - tag `[[audio_as_voice]]` in het antwoord van de agent om verzending als spraaknotitie af te dwingen
    - inkomende transcripties van spraaknotities worden in de agentcontext omlijst als machinaal gegenereerde,
      niet-vertrouwde tekst; vermeldingsdetectie gebruikt nog steeds de ruwe
      transcriptie, zodat vermeldingsgebonden spraakberichten blijven werken.

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

    Afhandeling van inkomende stickers:

    - statische WEBP: gedownload en verwerkt (placeholder `<media:sticker>`)
    - geanimeerde TGS: overgeslagen
    - video-WEBM: overgeslagen

    Stickers-contextvelden:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    Stickercachebestand:

    - `~/.openclaw/telegram/sticker-cache.json`

    Stickers worden één keer beschreven (waar mogelijk) en in de cache opgeslagen om herhaalde vision-aanroepen te verminderen.

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

    Wanneer dit is ingeschakeld, plaatst OpenClaw systeemgebeurtenissen in de wachtrij zoals:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Configuratie:

    - `channels.telegram.reactionNotifications`: `off | own | all` (standaard: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (standaard: `minimal`)

    Opmerkingen:

    - `own` betekent alleen gebruikersreacties op door de bot verzonden berichten (best-effort via de cache voor verzonden berichten).
    - Reactiegebeurtenissen respecteren nog steeds Telegram-toegangscontroles (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); onbevoegde afzenders worden genegeerd.
    - Telegram levert geen thread-ID's in reactie-updates.
      - niet-forumgroepen routeren naar de groepschatsessie
      - forumgroepen routeren naar de algemene-onderwerpsessie van de groep (`:topic:1`), niet naar het exacte oorspronkelijke onderwerp

    `allowed_updates` voor polling/webhook bevat automatisch `message_reaction`.

  </Accordion>

  <Accordion title="Ack-reacties">
    `ackReaction` verzendt een bevestigings-emoji terwijl OpenClaw een inkomend bericht verwerkt.

    Resolutievolgorde:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - fallback naar de emoji van de agentidentiteit (`agents.list[].identity.emoji`, anders "👀")

    Opmerkingen:

    - Telegram verwacht unicode-emoji (bijvoorbeeld "👀").
    - Gebruik `""` om de reactie voor een kanaal of account uit te schakelen.

  </Accordion>

  <Accordion title="Configuratieschrijfacties vanuit Telegram-gebeurtenissen en -opdrachten">
    Schrijfacties voor kanaalconfiguratie zijn standaard ingeschakeld (`configWrites !== false`).

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

  <Accordion title="Long polling versus webhook">
    De standaard is long polling. Stel voor de webhookmodus `channels.telegram.webhookUrl` en `channels.telegram.webhookSecret` in; optioneel `webhookPath`, `webhookHost`, `webhookPort` (standaardwaarden `/telegram-webhook`, `127.0.0.1`, `8787`).

    In de long-pollingmodus bewaart OpenClaw de herstartwatermark pas nadat een update succesvol is verzonden. Als een handler faalt, blijft die update opnieuw probeerbaar in hetzelfde proces en wordt die niet als voltooid weggeschreven voor herstartdeduplicatie.

    De lokale listener bindt aan `127.0.0.1:8787`. Plaats voor publieke ingress een reverse proxy vóór de lokale poort, of stel bewust `webhookHost: "0.0.0.0"` in.

    De webhookmodus valideert request-guards, het Telegram-geheime token en de JSON-body voordat `200` aan Telegram wordt geretourneerd.
    OpenClaw verwerkt de update daarna asynchroon via dezelfde per-chat/per-onderwerp botlanes die door long polling worden gebruikt, zodat trage agentbeurten de afleverings-ACK van Telegram niet vasthouden.

  </Accordion>

  <Accordion title="Limieten, opnieuw proberen en CLI-doelen">
    - `channels.telegram.textChunkLimit` is standaard 4000.
    - `channels.telegram.chunkMode="newline"` geeft de voorkeur aan alineagrenzen (lege regels) vóór splitsing op lengte.
    - `channels.telegram.mediaMaxMb` (standaard 100) begrenst de grootte van inkomende en uitgaande Telegram-media.
    - `channels.telegram.mediaGroupFlushMs` (standaard 500) bepaalt hoelang Telegram-albums/mediagroepen worden gebufferd voordat OpenClaw ze als één inkomend bericht verzendt. Verhoog dit als albumdelen laat aankomen; verlaag dit om albumantwoordlatentie te verminderen.
    - `channels.telegram.timeoutSeconds` overschrijft de timeout van de Telegram API-client (als dit niet is ingesteld, geldt de grammY-standaard). Botclients klemmen geconfigureerde waarden onder de 60-secondenrequest-guard voor uitgaande tekst/typen, zodat grammY de zichtbare antwoordaflevering niet afbreekt voordat de transport-guard en fallback van OpenClaw kunnen draaien. Long polling gebruikt nog steeds een 45-secondenrequest-guard voor `getUpdates`, zodat inactieve polls niet onbeperkt worden verlaten.
    - `channels.telegram.pollingStallThresholdMs` is standaard `120000`; stel alleen af tussen `30000` en `600000` voor fout-positieve herstarts door polling-stalls.
    - groepscontexthistorie gebruikt `channels.telegram.historyLimit` of `messages.groupChat.historyLimit` (standaard 50); `0` schakelt dit uit.
    - aanvullende context voor antwoord/citaat/doorsturen wordt genormaliseerd naar één geselecteerd conversatiecontextvenster wanneer de gateway de bovenliggende berichten heeft waargenomen; de cache voor waargenomen berichten wordt naast de sessieopslag bewaard. Telegram bevat slechts één oppervlakkige `reply_to_message` in updates, dus ketens die ouder zijn dan de cache zijn beperkt tot de huidige updatepayload van Telegram.
    - Telegram-allowlists begrenzen primair wie de agent kan triggeren, niet een volledige redactieboundary voor aanvullende context.
    - DM-historiebesturing:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - De configuratie `channels.telegram.retry` is van toepassing op Telegram-verzendhelpers (CLI/tools/acties) voor herstelbare uitgaande API-fouten. Aflevering van inkomende eindantwoorden gebruikt ook een begrensde safe-send-retry voor Telegram-pre-connect-fouten, maar probeert ambigue post-send-netwerkenveloppen die zichtbare berichten kunnen dupliceren niet opnieuw.

    CLI- en berichttool-verzenddoelen kunnen een numerieke chat-ID, gebruikersnaam of forumonderwerpdoel zijn:

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

    Alleen-Telegram poll-flags:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` voor forumonderwerpen (of gebruik een `:topic:`-doel)

    Telegram-verzenden ondersteunt ook:

    - `--presentation` met `buttons`-blokken voor inline keyboards wanneer `channels.telegram.capabilities.inlineButtons` dit toestaat
    - `--pin` of `--delivery '{"pin":true}'` om vastgezette aflevering aan te vragen wanneer de bot in die chat kan vastzetten
    - `--force-document` om uitgaande afbeeldingen, GIF's en video's als documenten te verzenden in plaats van als gecomprimeerde foto-, geanimeerde-media- of video-uploads

    Actiebegrenzing:

    - `channels.telegram.actions.sendMessage=false` schakelt uitgaande Telegram-berichten uit, inclusief polls
    - `channels.telegram.actions.poll=false` schakelt het maken van Telegram-polls uit, terwijl reguliere verzendingen ingeschakeld blijven

  </Accordion>

  <Accordion title="Exec-goedkeuringen in Telegram">
    Telegram ondersteunt exec-goedkeuringen in goedkeurder-DM's en kan optioneel prompts plaatsen in de oorspronkelijke chat of het oorspronkelijke onderwerp. Goedkeurders moeten numerieke Telegram-gebruikers-ID's zijn.

    Configuratiepad:

    - `channels.telegram.execApprovals.enabled` (wordt automatisch ingeschakeld wanneer ten minste één goedkeurder oplosbaar is)
    - `channels.telegram.execApprovals.approvers` (valt terug op numerieke eigenaar-ID's uit `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (standaard) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` en `defaultTo` bepalen wie met de bot kan praten en waar deze normale antwoorden naartoe stuurt. Ze maken iemand geen exec-goedkeurder. De eerste goedgekeurde DM-koppeling bootstrapt `commands.ownerAllowFrom` wanneer er nog geen opdrachteigenaar bestaat, zodat de installatie met één eigenaar nog steeds werkt zonder ID's te dupliceren onder `execApprovals.approvers`.

    Kanaalaflevering toont de opdrachttekst in de chat; schakel `channel` of `both` alleen in vertrouwde groepen/onderwerpen in. Wanneer de prompt in een forumonderwerp terechtkomt, behoudt OpenClaw het onderwerp voor de goedkeuringsprompt en het vervolg. Exec-goedkeuringen verlopen standaard na 30 minuten.

    Inline-goedkeuringsknoppen vereisen ook dat `channels.telegram.capabilities.inlineButtons` het doeloppervlak toestaat (`dm`, `group` of `all`). Goedkeurings-ID's met prefix `plugin:` worden opgelost via Plugin-goedkeuringen; andere worden eerst via exec-goedkeuringen opgelost.

    Zie [Exec approvals](/nl/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Instellingen voor foutantwoorden

Wanneer de agent een bezorgings- of providerfout tegenkomt, kan Telegram antwoorden met de fouttekst of deze onderdrukken. Twee configuratiesleutels bepalen dit gedrag:

| Sleutel                             | Waarden           | Standaard | Beschrijving                                                                                          |
| ----------------------------------- | ----------------- | --------- | ----------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`   | `reply` stuurt een vriendelijke foutmelding naar de chat. `silent` onderdrukt foutantwoorden volledig. |
| `channels.telegram.errorCooldownMs` | getal (ms)        | `60000`   | Minimale tijd tussen foutantwoorden naar dezelfde chat. Voorkomt foutspam tijdens storingen.           |

Overrides per account, per groep en per onderwerp worden ondersteund (dezelfde overerving als andere Telegram-configuratiesleutels).

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
  <Accordion title="Bot does not respond to non mention group messages">

    - Als `requireMention=false`, moet de privacymodus van Telegram volledige zichtbaarheid toestaan.
      - BotFather: `/setprivacy` -> Disable
      - verwijder de bot daarna uit de groep en voeg deze opnieuw toe
    - `openclaw channels status` waarschuwt wanneer de configuratie niet-genoemde groepsberichten verwacht.
    - `openclaw channels status --probe` kan expliciete numerieke groeps-ID's controleren; wildcard `"*"` kan niet op lidmaatschap worden gecontroleerd.
    - snelle sessietest: `/activation always`.

  </Accordion>

  <Accordion title="Bot not seeing group messages at all">

    - wanneer `channels.telegram.groups` bestaat, moet de groep worden vermeld (of `"*"` bevatten)
    - controleer het botlidmaatschap in de groep
    - bekijk logs: `openclaw logs --follow` voor redenen waarom iets wordt overgeslagen

  </Accordion>

  <Accordion title="Commands work partially or not at all">

    - autoriseer je afzenderidentiteit (koppeling en/of numerieke `allowFrom`)
    - commandoautorisatie blijft van toepassing, zelfs wanneer het groepsbeleid `open` is
    - `setMyCommands failed` met `BOT_COMMANDS_TOO_MUCH` betekent dat het native menu te veel items heeft; verminder plugin-/skill-/aangepaste commando's of schakel native menu's uit
    - `deleteMyCommands` / `setMyCommands`-aanroepen bij opstarten en `sendChatAction`-typaanroepen zijn begrensd en proberen één keer opnieuw via Telegram's transportfallback bij een request-time-out. Aanhoudende netwerk-/fetchfouten wijzen meestal op DNS-/HTTPS-bereikbaarheidsproblemen naar `api.telegram.org`

  </Accordion>

  <Accordion title="Startup reports unauthorized token">

    - `getMe returned 401` is een Telegram-authenticatiefout voor het geconfigureerde bottoken.
    - Kopieer het bottoken opnieuw of genereer het opnieuw in BotFather, en werk daarna `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` of `TELEGRAM_BOT_TOKEN` bij voor het standaardaccount.
    - `deleteWebhook 401 Unauthorized` tijdens het opstarten is ook een authenticatiefout; dit behandelen als "er bestaat geen Webhook" zou dezelfde fout door een ongeldig token alleen uitstellen tot latere API-aanroepen.

  </Accordion>

  <Accordion title="Polling or network instability">

    - Node 22+ + aangepaste fetch/proxy kan direct afbreekgedrag veroorzaken als AbortSignal-typen niet overeenkomen.
    - Sommige hosts lossen `api.telegram.org` eerst op naar IPv6; kapotte IPv6-egress kan intermitterende Telegram API-fouten veroorzaken.
    - Als logs `TypeError: fetch failed` of `Network request for 'getUpdates' failed!` bevatten, probeert OpenClaw deze nu opnieuw als herstelbare netwerkfouten.
    - Tijdens het starten van polling hergebruikt OpenClaw de succesvolle opstartprobe `getMe` voor grammY, zodat de runner geen tweede `getMe` nodig heeft vóór de eerste `getUpdates`.
    - Als `deleteWebhook` faalt met een tijdelijke netwerkfout tijdens het starten van polling, gaat OpenClaw door met long polling in plaats van nog een pre-poll control-plane-aanroep te doen. Een nog actieve Webhook verschijnt als een `getUpdates`-conflict; OpenClaw bouwt daarna het Telegram-transport opnieuw op en probeert de Webhook-opruiming opnieuw.
    - Als Telegram-sockets op een korte vaste cadans worden gerecycled, controleer dan op een lage `channels.telegram.timeoutSeconds`; botclients klemmen geconfigureerde waarden onder de uitgaande en `getUpdates`-requestguards, maar oudere releases konden elke poll of elk antwoord afbreken wanneer dit onder die guards was ingesteld.
    - Als logs `Polling stall detected` bevatten, herstart OpenClaw polling en bouwt het Telegram-transport opnieuw op na standaard 120 seconden zonder voltooide long-poll-liveness.
    - `openclaw channels status --probe` en `openclaw doctor` waarschuwen wanneer een actief pollingaccount na de opstartgratie geen `getUpdates` heeft voltooid, wanneer een actief Webhook-account na de opstartgratie geen `setWebhook` heeft voltooid, of wanneer de laatste succesvolle polling-transportactiviteit verouderd is.
    - Verhoog `channels.telegram.pollingStallThresholdMs` alleen wanneer langlopende `getUpdates`-aanroepen gezond zijn, maar je host nog steeds onterechte polling-stall-herstarts meldt. Aanhoudende stalls wijzen meestal op proxy-, DNS-, IPv6- of TLS-egressproblemen tussen de host en `api.telegram.org`.
    - Telegram respecteert ook procesproxy-env voor Bot API-transport, inclusief `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` en hun varianten in kleine letters. `NO_PROXY` / `no_proxy` kan `api.telegram.org` nog steeds omzeilen.
    - Als de door OpenClaw beheerde proxy via `OPENCLAW_PROXY_URL` is geconfigureerd voor een serviceomgeving en er geen standaard proxy-env aanwezig is, gebruikt Telegram die URL ook voor Bot API-transport.
    - Routeer Telegram API-aanroepen op VPS-hosts met instabiele directe egress/TLS via `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ gebruikt standaard `autoSelectFamily=true` (behalve WSL2). De volgorde van Telegram DNS-resultaten respecteert `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, daarna `channels.telegram.network.dnsResultOrder`, daarna de processtandaard zoals `NODE_OPTIONS=--dns-result-order=ipv4first`; als geen daarvan van toepassing is, valt Node 22+ terug op `ipv4first`.
    - Als je host WSL2 is of expliciet beter werkt met IPv4-only-gedrag, forceer dan familieselectie:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544-antwoorden uit het benchmarkbereik (`198.18.0.0/15`) zijn standaard al toegestaan
      voor Telegram-mediadownloads. Als een vertrouwde fake-IP- of
      transparante proxy `api.telegram.org` herschrijft naar een ander
      privé/intern/special-use-adres tijdens mediadownloads, kun je je aanmelden
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
      media-SSRF-bescherming. Gebruik dit alleen voor vertrouwde, door operators beheerde proxy-
      omgevingen zoals Clash, Mihomo of Surge fake-IP-routering wanneer ze
      privé- of special-use-antwoorden buiten het RFC 2544-benchmarkbereik
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

- opstarten/auth: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` moet naar een regulier bestand wijzen; symlinks worden geweigerd)
- toegangscontrole: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, top-level `bindings[]` (`type: "acp"`)
- exec-goedkeuringen: `execApprovals`, `accounts.*.execApprovals`
- commando/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- threading/antwoorden: `replyToMode`, `dm.threadReplies`, `direct.*.threadReplies`
- streaming: `streaming` (preview), `streaming.preview.toolProgress`, `blockStreaming`
- opmaak/bezorging: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- media/netwerk: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- aangepaste API-root: `apiRoot` (alleen Bot API-root; neem `/bot<TOKEN>` niet op)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- acties/capabilities: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reacties: `reactionNotifications`, `reactionLevel`
- fouten: `errorPolicy`, `errorCooldownMs`
- schrijfbewerkingen/geschiedenis: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Voorrang bij meerdere accounts: wanneer twee of meer account-ID's zijn geconfigureerd, stel dan `channels.telegram.defaultAccount` in (of neem `channels.telegram.accounts.default` op) om standaardroutering expliciet te maken. Anders valt OpenClaw terug op het eerste genormaliseerde account-ID en waarschuwt `openclaw doctor`. Benoemde accounts erven `channels.telegram.allowFrom` / `groupAllowFrom`, maar niet de waarden van `accounts.default.*`.
</Note>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/nl/channels/pairing">
    Koppel een Telegram-gebruiker aan de Gateway.
  </Card>
  <Card title="Groups" icon="users" href="/nl/channels/groups">
    Gedrag van allowlists voor groepen en onderwerpen.
  </Card>
  <Card title="Channel routing" icon="route" href="/nl/channels/channel-routing">
    Routeer inkomende berichten naar agents.
  </Card>
  <Card title="Security" icon="shield" href="/nl/gateway/security">
    Dreigingsmodel en hardening.
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/nl/concepts/multi-agent">
    Wijs groepen en onderwerpen toe aan agents.
  </Card>
  <Card title="Troubleshooting" icon="wrench" href="/nl/channels/troubleshooting">
    Kanaaloverstijgende diagnostiek.
  </Card>
</CardGroup>
