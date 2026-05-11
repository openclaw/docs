---
read_when:
    - Werken aan Telegram-functies of webhooks
summary: Ondersteuningsstatus, mogelijkheden en configuratie voor Telegram-bots
title: Telegram
x-i18n:
    generated_at: "2026-05-11T20:22:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f14e59b18e3727b13598d2a5f83ba3ca4267c27c1bd295d36ad20c64707791a
    source_path: channels/telegram.md
    workflow: 16
---

Productieklaar voor bot-DM's en groepen via grammY. Long polling is de standaardmodus; webhook-modus is optioneel.

<CardGroup cols={3}>
  <Card title="Koppelen" icon="link" href="/nl/channels/pairing">
    Standaard DM-beleid voor Telegram is koppelen.
  </Card>
  <Card title="Kanaalprobleemoplossing" icon="wrench" href="/nl/channels/troubleshooting">
    Cross-channel diagnostiek en herstel-playbooks.
  </Card>
  <Card title="Gateway-configuratie" icon="settings" href="/nl/gateway/configuration">
    Volledige kanaalconfiguratiepatronen en voorbeelden.
  </Card>
</CardGroup>

## Snelle installatie

<Steps>
  <Step title="Maak het bottoken aan in BotFather">
    Open Telegram en chat met **@BotFather** (bevestig dat de handle exact `@BotFather` is).

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

    Env fallback: `TELEGRAM_BOT_TOKEN=...` (alleen standaardaccount).
    Telegram gebruikt **niet** `openclaw channels login telegram`; configureer het token in config/env en start daarna de Gateway.

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
    Voeg de bot toe aan je groep en haal daarna beide ID's op die groepstoegang nodig heeft:

    - je Telegram-gebruikers-ID, gebruikt in `allowFrom` / `groupAllowFrom`
    - de Telegram-groepschat-ID, gebruikt als sleutel onder `channels.telegram.groups`

    Voor de eerste installatie haal je de groepschat-ID op uit `openclaw logs --follow`, een bot voor doorgestuurde ID's, of Bot API `getUpdates`. Nadat de groep is toegestaan, kan `/whoami@<bot_username>` de gebruikers- en groeps-ID's bevestigen.

    Negatieve Telegram-supergroep-ID's die beginnen met `-100` zijn groepschat-ID's. Zet ze onder `channels.telegram.groups`, niet onder `groupAllowFrom`.

  </Step>
</Steps>

<Note>
De volgorde voor tokenresolutie is accountbewust. In de praktijk gaan configwaarden boven de env fallback, en `TELEGRAM_BOT_TOKEN` geldt alleen voor het standaardaccount.
</Note>

## Telegram-zijde-instellingen

<AccordionGroup>
  <Accordion title="Privacymodus en groepszichtbaarheid">
    Telegram-bots gebruiken standaard **Privacymodus**, die beperkt welke groepsberichten ze ontvangen.

    Als de bot alle groepsberichten moet zien, doe dan een van beide:

    - schakel privacymodus uit via `/setprivacy`, of
    - maak de bot groepsbeheerder.

    Wanneer je privacymodus omschakelt, verwijder je de bot uit elke groep en voeg je hem opnieuw toe, zodat Telegram de wijziging toepast.

  </Accordion>

  <Accordion title="Groepsmachtigingen">
    Beheerdersstatus wordt beheerd in Telegram-groepsinstellingen.

    Beheerderbots ontvangen alle groepsberichten, wat nuttig is voor altijd actieve groepswerking.

  </Accordion>

  <Accordion title="Handige BotFather-schakelaars">

    - `/setjoingroups` om toevoegen aan groepen toe te staan/te weigeren
    - `/setprivacy` voor gedrag rond groepszichtbaarheid

  </Accordion>
</AccordionGroup>

## Toegangscontrole en activering

<Tabs>
  <Tab title="DM-beleid">
    `channels.telegram.dmPolicy` beheert toegang via directe berichten:

    - `pairing` (standaard)
    - `allowlist` (vereist minstens één afzender-ID in `allowFrom`)
    - `open` (vereist dat `allowFrom` `"*"` bevat)
    - `disabled`

    `dmPolicy: "open"` met `allowFrom: ["*"]` laat elk Telegram-account dat de botgebruikersnaam vindt of raadt de bot opdrachten geven. Gebruik dit alleen voor bewust openbare bots met strikt beperkte tools; bots met één eigenaar moeten `allowlist` met numerieke gebruikers-ID's gebruiken.

    `channels.telegram.allowFrom` accepteert numerieke Telegram-gebruikers-ID's. `telegram:`- / `tg:`-prefixen worden geaccepteerd en genormaliseerd.
    In configuraties met meerdere accounts wordt een beperkende `channels.telegram.allowFrom` op topniveau behandeld als veiligheidsgrens: accountniveauvermeldingen `allowFrom: ["*"]` maken dat account niet openbaar, tenzij de effectieve account-allowlist na samenvoeging nog steeds een expliciete wildcard bevat.
    `dmPolicy: "allowlist"` met lege `allowFrom` blokkeert alle DM's en wordt geweigerd door configvalidatie.
    Setup vraagt alleen om numerieke gebruikers-ID's.
    Als je hebt geüpgraded en je config `@username`-allowlistvermeldingen bevat, voer dan `openclaw doctor --fix` uit om ze te herleiden (best-effort; vereist een Telegram-bottoken).
    Als je eerder vertrouwde op allowlistbestanden uit de koppelingsopslag, kan `openclaw doctor --fix` vermeldingen herstellen naar `channels.telegram.allowFrom` in allowlist-flows (bijvoorbeeld wanneer `dmPolicy: "allowlist"` nog geen expliciete ID's heeft).

    Voor bots met één eigenaar geef je de voorkeur aan `dmPolicy: "allowlist"` met expliciete numerieke `allowFrom`-ID's om het toegangsbeleid duurzaam in de config te houden (in plaats van afhankelijk te zijn van eerdere koppelingsgoedkeuringen).

    Veelvoorkomende verwarring: goedkeuring van DM-koppeling betekent niet "deze afzender is overal geautoriseerd".
    Koppeling verleent DM-toegang. Als er nog geen commando-eigenaar bestaat, stelt de eerste goedgekeurde koppeling ook `commands.ownerAllowFrom` in, zodat eigenaar-only commando's en exec-goedkeuringen een expliciet operatoraccount hebben.
    Autorisatie van groepsafzenders komt nog steeds uit expliciete config-allowlists.
    Als je wilt "ik ben één keer geautoriseerd en zowel DM's als groepscommando's werken", zet je numerieke Telegram-gebruikers-ID in `channels.telegram.allowFrom`; zorg er voor eigenaar-only commando's voor dat `commands.ownerAllowFrom` `telegram:<your user id>` bevat.

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

    `groupAllowFrom` wordt gebruikt voor filtering van groepsafzenders. Indien niet ingesteld valt Telegram terug op `allowFrom`.
    `groupAllowFrom`-vermeldingen moeten numerieke Telegram-gebruikers-ID's zijn (`telegram:`- / `tg:`-prefixen worden genormaliseerd).
    Zet geen Telegram-groeps- of supergroepchat-ID's in `groupAllowFrom`. Negatieve chat-ID's horen onder `channels.telegram.groups`.
    Niet-numerieke vermeldingen worden genegeerd voor afzenderautorisatie.
    Veiligheidsgrens (`2026.2.25+`): groepsafzenderauth erft **geen** goedkeuringen uit de DM-koppelingsopslag.
    Koppeling blijft alleen voor DM's. Stel voor groepen `groupAllowFrom` of `allowFrom` per groep/per topic in.
    Als `groupAllowFrom` niet is ingesteld, valt Telegram terug op config `allowFrom`, niet op de koppelingsopslag.
    Praktisch patroon voor bots met één eigenaar: stel je gebruikers-ID in `channels.telegram.allowFrom` in, laat `groupAllowFrom` unset, en sta de doelgroepen toe onder `channels.telegram.groups`.
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

    Test dit vanuit de groep met `@<bot_username> ping`. Gewone groepsberichten activeren de bot niet zolang `requireMention: true`.

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
      Veelvoorkomende fout: `groupAllowFrom` is geen Telegram-groeps-allowlist.

      - Zet negatieve Telegram-groeps- of supergroepchat-ID's zoals `-1001234567890` onder `channels.telegram.groups`.
      - Zet Telegram-gebruikers-ID's zoals `8734062810` onder `groupAllowFrom` wanneer je wilt beperken welke mensen binnen een toegestane groep de bot kunnen activeren.
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

    Commandoschakelaars op sessieniveau:

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
    - nadat de groep is toegestaan, voer `/whoami@<bot_username>` uit als native commando's zijn ingeschakeld

  </Tab>
</Tabs>

## Runtime-gedrag

- Telegram is eigendom van het Gateway-proces.
- Routering is deterministisch: Telegram-inbound antwoordt terug naar Telegram (het model kiest geen kanalen).
- Inbound berichten worden genormaliseerd naar de gedeelde kanaalenvelop met antwoordmetadata, mediaplaceholders en gepersisteerde antwoordketencontext voor Telegram-antwoorden die de Gateway heeft waargenomen.
- Groepssessies worden geïsoleerd op groeps-ID. Forumtopics voegen `:topic:<threadId>` toe om topics geïsoleerd te houden.
- DM-berichten kunnen `message_thread_id` bevatten; OpenClaw behoudt de thread-ID voor antwoorden, maar houdt DM's standaard op de platte sessie. Configureer `channels.telegram.dm.threadReplies: "inbound"`, `channels.telegram.direct.<chatId>.threadReplies: "inbound"`, `requireTopic: true`, of een overeenkomende topicconfig wanneer je bewust DM-topic-sessie-isolatie wilt.
- Long polling gebruikt grammY runner met sequencing per chat/per thread. De algemene sink-concurrency van de runner gebruikt `agents.defaults.maxConcurrent`.
- Long polling wordt binnen elk Gateway-proces bewaakt, zodat slechts één actieve poller tegelijk een bottoken kan gebruiken. Als je nog steeds `getUpdates` 409-conflicten ziet, gebruikt waarschijnlijk een andere OpenClaw Gateway, script of externe poller hetzelfde token.
- Herstarts door de long-polling-watchdog worden standaard geactiveerd na 120 seconden zonder voltooide `getUpdates`-liveness. Verhoog `channels.telegram.pollingStallThresholdMs` alleen als je deployment nog steeds valse polling-stall-herstarts ziet tijdens langlopende werkzaamheden. De waarde is in milliseconden en is toegestaan van `30000` tot `600000`; overrides per account worden ondersteund.
- Telegram Bot API heeft geen ondersteuning voor leesbevestigingen (`sendReadReceipts` is niet van toepassing).

## Functiereferentie

<AccordionGroup>
  <Accordion title="Live stream-preview (berichtbewerkingen)">
    OpenClaw kan gedeeltelijke antwoorden in realtime streamen:

    - directe chats: previewbericht + `editMessageText`
    - groepen/topics: previewbericht + `editMessageText`

    Vereiste:

    - `channels.telegram.streaming` is `off | partial | block | progress` (standaard: `partial`)
    - `progress` bewaart één bewerkbaar statusconcept voor toolvoortgang, wist dit bij voltooiing en stuurt het definitieve antwoord als een normaal bericht
    - `streaming.preview.toolProgress` bepaalt of tool-/voortgangsupdates hetzelfde bewerkte voorbeeldbericht hergebruiken (standaard: `true` wanneer voorbeeldstreaming actief is)
    - `streaming.preview.commandText` bepaalt command/exec-details binnen die toolvoortgangsregels: `raw` (standaard, behoudt uitgebracht gedrag) of `status` (alleen toollabel)
    - verouderde waarden voor `channels.telegram.streamMode` en booleaanse `streaming`-waarden worden gedetecteerd; voer `openclaw doctor --fix` uit om ze te migreren naar `channels.telegram.streaming.mode`

    Voorbeeldupdates voor toolvoortgang zijn de korte statusregels die worden getoond terwijl tools draaien, bijvoorbeeld opdrachtuitvoering, bestandslezingen, planningsupdates of patchsamenvattingen. Telegram houdt deze standaard ingeschakeld om overeen te komen met uitgebracht OpenClaw-gedrag vanaf `v2026.4.22` en later. Stel het volgende in om het bewerkte voorbeeld voor antwoordtekst te behouden maar toolvoortgangsregels te verbergen:

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

    Stel het volgende in om toolvoortgang zichtbaar te houden maar command/exec-tekst te verbergen:

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

    Gebruik de modus `progress` wanneer je zichtbare toolvoortgang wilt zonder het definitieve antwoord in datzelfde bericht te bewerken. Zet het commandotekstbeleid onder `streaming.progress`:

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

    Gebruik `streaming.mode: "off"` alleen wanneer je uitsluitend definitieve levering wilt: Telegram-voorbeeldbewerkingen zijn uitgeschakeld en generieke tool-/voortgangspraat wordt onderdrukt in plaats van als losse statusberichten te worden verzonden. Goedkeuringsprompts, mediapayloads en fouten blijven via normale definitieve levering lopen. Gebruik `streaming.preview.toolProgress: false` wanneer je alleen antwoordvoorbeeldbewerkingen wilt behouden terwijl je de statusregels voor toolvoortgang verbergt.

    <Note>
      Geselecteerde citaatantwoorden in Telegram zijn de uitzondering. Wanneer `replyToMode` `"first"`, `"all"` of `"batched"` is en het inkomende bericht geselecteerde citaattekst bevat, stuurt OpenClaw het definitieve antwoord via Telegram's native citaatantwoordpad in plaats van het antwoordvoorbeeld te bewerken, waardoor `streaming.preview.toolProgress` de korte statusregels voor die beurt niet kan tonen. Antwoorden op het huidige bericht zonder geselecteerde citaattekst behouden voorbeeldstreaming wel. Stel `replyToMode: "off"` in wanneer zichtbaarheid van toolvoortgang belangrijker is dan native citaatantwoorden, of stel `streaming.preview.toolProgress: false` in om de afweging te erkennen.
    </Note>

    Voor antwoorden met alleen tekst:

    - korte voorbeelden in DM/groep/topic: OpenClaw behoudt hetzelfde voorbeeldbericht en voert de definitieve bewerking ter plekke uit
    - lange definitieve teksten die in meerdere Telegram-berichten worden gesplitst, hergebruiken waar mogelijk het bestaande voorbeeld als het eerste definitieve deel en sturen daarna alleen de resterende delen
    - definitieve antwoorden in progress-modus wissen het statusconcept en gebruiken normale definitieve levering in plaats van het concept in het antwoord te bewerken
    - als de definitieve bewerking mislukt voordat de voltooide tekst is bevestigd, gebruikt OpenClaw normale definitieve levering en ruimt het het verouderde voorbeeld op

    Voor complexe antwoorden (bijvoorbeeld mediapayloads) valt OpenClaw terug op normale definitieve levering en ruimt daarna het voorbeeldbericht op.

    Voorbeeldstreaming staat los van blokstreaming. Wanneer blokstreaming expliciet is ingeschakeld voor Telegram, slaat OpenClaw de voorbeeldstream over om dubbele streaming te voorkomen.

    Redeneringsstream alleen voor Telegram:

    - `/reasoning stream` stuurt redenering naar het live voorbeeld tijdens het genereren
    - het redeneringsvoorbeeld wordt verwijderd na definitieve levering; gebruik `/reasoning on` wanneer redenering zichtbaar moet blijven
    - het definitieve antwoord wordt zonder redeneringstekst verzonden

  </Accordion>

  <Accordion title="Opmaak en HTML-terugval">
    Uitgaande tekst gebruikt Telegram `parse_mode: "HTML"`.

    - Markdown-achtige tekst wordt gerenderd naar Telegram-veilige HTML.
    - Ruwe model-HTML wordt escaped om Telegram-parsefouten te verminderen.
    - Als Telegram geparsete HTML weigert, probeert OpenClaw het opnieuw als platte tekst.

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

    - namen worden genormaliseerd (leidende `/` verwijderen, kleine letters)
    - geldig patroon: `a-z`, `0-9`, `_`, lengte `1..32`
    - aangepaste opdrachten kunnen native opdrachten niet overschrijven
    - conflicten/duplicaten worden overgeslagen en gelogd

    Opmerkingen:

    - aangepaste opdrachten zijn alleen menu-items; ze implementeren niet automatisch gedrag
    - Plugin-/Skills-opdrachten kunnen nog steeds werken wanneer ze worden getypt, zelfs als ze niet in het Telegram-menu worden getoond

    Als native opdrachten zijn uitgeschakeld, worden ingebouwde opdrachten verwijderd. Aangepaste/Plugin-opdrachten kunnen nog steeds worden geregistreerd als ze zijn geconfigureerd.

    Veelvoorkomende installatiefouten:

    - `setMyCommands failed` met `BOT_COMMANDS_TOO_MUCH` betekent dat het Telegram-menu na inkorten nog steeds overliep; verminder Plugin-/Skills-/aangepaste opdrachten of schakel `channels.telegram.commands.native` uit.
    - `deleteWebhook`, `deleteMyCommands` of `setMyCommands` die faalt met `404: Not Found` terwijl directe Bot API-curlopdrachten werken, kan betekenen dat `channels.telegram.apiRoot` was ingesteld op het volledige `/bot<TOKEN>`-eindpunt. `apiRoot` mag alleen de Bot API-root zijn, en `openclaw doctor --fix` verwijdert een per ongeluk toegevoegde afsluitende `/bot<TOKEN>`.
    - `getMe returned 401` betekent dat Telegram het geconfigureerde bottoken heeft geweigerd. Werk `botToken`, `tokenFile` of `TELEGRAM_BOT_TOKEN` bij met het huidige BotFather-token; OpenClaw stopt vóór polling, dus dit wordt niet gemeld als een fout bij het opschonen van Webhook.
    - `setMyCommands failed` met netwerk-/fetchfouten betekent meestal dat uitgaande DNS/HTTPS naar `api.telegram.org` is geblokkeerd.

    ### Apparaatkoppelingsopdrachten (`device-pair`-Plugin)

    Wanneer de `device-pair`-Plugin is geïnstalleerd:

    1. `/pair` genereert installatiecode
    2. plak code in iOS-app
    3. `/pair pending` toont openstaande aanvragen (inclusief rol/scopes)
    4. keur de aanvraag goed:
       - `/pair approve <requestId>` voor expliciete goedkeuring
       - `/pair approve` wanneer er slechts één openstaande aanvraag is
       - `/pair approve latest` voor de meest recente

    De installatiecode bevat een kortlevend bootstrap-token. Ingebouwde bootstrap-handoff houdt het primaire Node-token op `scopes: []`; elk overgedragen operator-token blijft beperkt tot `operator.approvals`, `operator.read`, `operator.talk.secrets` en `operator.write`. Bootstrap-scopecontroles zijn rolgeprefixd, dus die operator-allowlist voldoet alleen aan operator-verzoeken; niet-operatorrollen hebben nog steeds scopes nodig onder hun eigen rolprefix.

    Als een apparaat opnieuw probeert met gewijzigde auth-gegevens (bijvoorbeeld rol/scopes/publieke sleutel), wordt het vorige pending verzoek vervangen en gebruikt het nieuwe verzoek een andere `requestId`. Voer `/pair pending` opnieuw uit voordat je goedkeurt.

    Meer details: [Koppelen](/nl/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="Inline buttons">
    Configureer inline-toetsenbordscope:

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

    Scopes:

    - `off`
    - `dm`
    - `group`
    - `all`
    - `allowlist` (standaard)

    Legacy `capabilities: ["inlineButtons"]` wordt toegewezen aan `inlineButtons: "all"`.

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

    Callback-klikken worden als tekst aan de agent doorgegeven:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Telegram message actions for agents and automation">
    Telegram-toolacties omvatten:

    - `sendMessage` (`to`, `content`, optioneel `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, optioneel `iconColor`, `iconCustomEmojiId`)

    Kanaalberichtacties bieden ergonomische aliassen (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Gating-controls:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (standaard: uitgeschakeld)

    Opmerking: `edit` en `topic-create` zijn momenteel standaard ingeschakeld en hebben geen afzonderlijke `channels.telegram.actions.*`-toggles.
    Runtime-verzendingen gebruiken de actieve momentopname van config/secrets (opstarten/herladen), dus actiepaden voeren geen ad-hoc SecretRef-herresolutie per verzending uit.

    Semantiek voor reactieverwijdering: [/tools/reactions](/nl/tools/reactions)

  </Accordion>

  <Accordion title="Reply threading tags">
    Telegram ondersteunt expliciete reply-threadingtags in gegenereerde uitvoer:

    - `[[reply_to_current]]` reageert op het activerende bericht
    - `[[reply_to:<id>]]` reageert op een specifieke Telegram-bericht-ID

    `channels.telegram.replyToMode` bepaalt de afhandeling:

    - `off` (standaard)
    - `first`
    - `all`

    Wanneer reply-threading is ingeschakeld en de oorspronkelijke Telegram-tekst of caption beschikbaar is, voegt OpenClaw automatisch een native Telegram-citaatexcerpt toe. Telegram beperkt native citaattekst tot 1024 UTF-16-code-eenheden, dus langere berichten worden vanaf het begin geciteerd en vallen terug op een gewone reply als Telegram het citaat weigert.

    Opmerking: `off` schakelt impliciete reply-threading uit. Expliciete `[[reply_to_*]]`-tags worden nog steeds gerespecteerd.

  </Accordion>

  <Accordion title="Forum topics and thread behavior">
    Forum-supergroepen:

    - topicsessiesleutels voegen `:topic:<threadId>` toe
    - replies en typing richten zich op de topic-thread
    - topic-configpad:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Special case voor algemeen topic (`threadId=1`):

    - berichtverzendingen laten `message_thread_id` weg (Telegram weigert `sendMessage(...thread_id=1)`)
    - typing-acties bevatten nog steeds `message_thread_id`

    Topic-overerving: topic-vermeldingen erven groepsinstellingen tenzij overschreven (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` is alleen voor topics en erft niet van groepsstandaarden.

    **Agentroutering per topic**: Elk topic kan naar een andere agent routeren door `agentId` in de topic-config in te stellen. Dit geeft elk topic zijn eigen geïsoleerde werkruimte, geheugen en sessie. Voorbeeld:

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

    Elk topic heeft daarna een eigen sessiesleutel: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Persistente ACP-topicbinding**: Forumtopics kunnen ACP-harness-sessies vastzetten via top-level getypeerde ACP-bindingen (`bindings[]` met `type: "acp"` en `match.channel: "telegram"`, `peer.kind: "group"`, en een topic-gekwalificeerde id zoals `-1001234567890:topic:42`). Momenteel beperkt tot forumtopics in groepen/supergroepen. Zie [ACP-agents](/nl/tools/acp-agents).

    **Threadgebonden ACP-spawn vanuit chat**: `/acp spawn <agent> --thread here|auto` bindt het huidige topic aan een nieuwe ACP-sessie; vervolgberichten worden daar rechtstreeks naartoe gerouteerd. OpenClaw zet de spawnbevestiging vast in het topic. Vereist dat `channels.telegram.threadBindings.spawnSessions` ingeschakeld blijft (standaard: `true`).

    De templatecontext stelt `MessageThreadId` en `IsForum` beschikbaar. DM-chats met `message_thread_id` behouden standaard DM-routing en antwoordmetadata op platte sessies; ze gebruiken alleen threadbewuste sessiesleutels wanneer geconfigureerd met `threadReplies: "inbound"`, `threadReplies: "always"`, `requireTopic: true`, of een overeenkomende topicconfiguratie. Gebruik top-level `channels.telegram.dm.threadReplies` voor de accountstandaard, of `direct.<chatId>.threadReplies` voor één DM.

  </Accordion>

  <Accordion title="Audio, video en stickers">
    ### Audioberichten

    Telegram maakt onderscheid tussen spraaknotities en audiobestanden.

    - standaard: gedrag voor audiobestanden
    - tag `[[audio_as_voice]]` in het antwoord van de agent om verzenden als spraaknotitie af te dwingen
    - transcripties van inkomende spraaknotities worden in de agentcontext ingekaderd als machinaal gegenereerde,
      niet-vertrouwde tekst; vermeldingsdetectie gebruikt nog steeds de ruwe
      transcriptie, zodat spraakberichten met vermeldingsgate blijven werken.

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

    Stickercachebestand:

    - `~/.openclaw/telegram/sticker-cache.json`

    Stickers worden één keer beschreven (waar mogelijk) en gecachet om herhaalde vision-calls te verminderen.

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

    - `own` betekent alleen gebruikersreacties op door de bot verzonden berichten (best-effort via cache voor verzonden berichten).
    - Reactiegebeurtenissen respecteren nog steeds Telegram-toegangscontroles (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); niet-geautoriseerde afzenders worden verwijderd.
    - Telegram levert geen thread-ID's in reactie-updates.
      - niet-forumgroepen routeren naar de groepschatsessie
      - forumgroepen routeren naar de algemene-topicsessie van de groep (`:topic:1`), niet naar het exacte oorspronkelijke topic

    `allowed_updates` voor polling/Webhook bevat automatisch `message_reaction`.

  </Accordion>

  <Accordion title="Ack-reacties">
    `ackReaction` verzendt een bevestigingsemoji terwijl OpenClaw een inkomend bericht verwerkt.

    Resolutievolgorde:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - fallback naar emoji van agentidentiteit (`agents.list[].identity.emoji`, anders "👀")

    Opmerkingen:

    - Telegram verwacht Unicode-emoji (bijvoorbeeld "👀").
    - Gebruik `""` om de reactie voor een kanaal of account uit te schakelen.

  </Accordion>

  <Accordion title="Configuratieschrijfacties vanuit Telegram-gebeurtenissen en -opdrachten">
    Schrijfacties naar kanaalconfiguratie zijn standaard ingeschakeld (`configWrites !== false`).

    Door Telegram geactiveerde schrijfacties omvatten:

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

  <Accordion title="Long polling versus Webhook">
    Standaard is long polling. Stel voor Webhook-modus `channels.telegram.webhookUrl` en `channels.telegram.webhookSecret` in; optioneel `webhookPath`, `webhookHost`, `webhookPort` (standaarden `/telegram-webhook`, `127.0.0.1`, `8787`).

    In long-polling-modus bewaart OpenClaw de herstartwatermark pas nadat een update succesvol is gedispatcht. Als een handler faalt, blijft die update opnieuw te proberen in hetzelfde proces en wordt deze niet als voltooid weggeschreven voor herstartdeduplicatie.

    De lokale listener bindt aan `127.0.0.1:8787`. Voor publieke ingress kunt u een reverse proxy vóór de lokale poort plaatsen of bewust `webhookHost: "0.0.0.0"` instellen.

    Webhook-modus valideert requestguards, de geheime Telegram-token en de JSON-body voordat `200` aan Telegram wordt teruggegeven.
    OpenClaw verwerkt de update daarna asynchroon via dezelfde per-chat/per-topic botlanes als bij long polling, zodat trage agentbeurten de delivery-ACK van Telegram niet ophouden.

  </Accordion>

  <Accordion title="Limieten, opnieuw proberen en CLI-targets">
    - `channels.telegram.textChunkLimit` is standaard 4000.
    - `channels.telegram.chunkMode="newline"` geeft de voorkeur aan alineagrenzen (lege regels) voordat op lengte wordt gesplitst.
    - `channels.telegram.mediaMaxMb` (standaard 100) begrenst inkomende en uitgaande Telegram-mediagrootte.
    - `channels.telegram.mediaGroupFlushMs` (standaard 500) bepaalt hoe lang Telegram-albums/mediagroepen worden gebufferd voordat OpenClaw ze als één inkomend bericht dispatcht. Verhoog dit als albumdelen laat binnenkomen; verlaag dit om de antwoordlatentie voor albums te verminderen.
    - `channels.telegram.timeoutSeconds` overschrijft de timeout van de Telegram API-client (indien niet ingesteld, geldt de grammY-standaard). Botclients begrenzen geconfigureerde waarden onder de 60-secondenrequestguard voor uitgaande tekst/typen, zodat grammY de levering van zichtbare antwoorden niet afbreekt voordat de transportguard en fallback van OpenClaw kunnen lopen. Long polling gebruikt nog steeds een 45-secondenrequestguard voor `getUpdates`, zodat idle polls niet onbeperkt worden verlaten.
    - `channels.telegram.pollingStallThresholdMs` is standaard `120000`; stem dit alleen af tussen `30000` en `600000` voor vals-positieve herstarts door vastgelopen polling.
    - groepscontexthistorie gebruikt `channels.telegram.historyLimit` of `messages.groupChat.historyLimit` (standaard 50); `0` schakelt dit uit.
    - aanvullende context voor antwoord/citaat/doorsturen wordt genormaliseerd in één geselecteerd conversatiecontextvenster wanneer de Gateway de bovenliggende berichten heeft waargenomen; de cache voor waargenomen berichten wordt naast de sessiestore bewaard. Telegram bevat slechts één oppervlakkige `reply_to_message` in updates, dus ketens ouder dan de cache zijn beperkt tot de huidige updatepayload van Telegram.
    - Telegram-allowlists bepalen primair wie de agent kan activeren, niet een volledige redactiegrens voor aanvullende context.
    - Besturing van DM-historie:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry`-configuratie geldt voor Telegram-verzendhelpers (CLI/tools/actions) bij herstelbare uitgaande API-fouten. Levering van het uiteindelijke inkomende antwoord gebruikt ook een begrensde safe-send retry voor Telegram-pre-connectfouten, maar probeert ambigue post-send netwerk-enveloppen die zichtbare berichten kunnen dupliceren niet opnieuw.

    CLI- en message-tool-verzendtargets kunnen een numerieke chat-ID, gebruikersnaam of forumtopic-target zijn:

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

    Alleen-Telegram pollflags:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` voor forumtopics (of gebruik een `:topic:`-target)

    Telegram-verzenden ondersteunt ook:

    - `--presentation` met `buttons`-blokken voor inline keyboards wanneer `channels.telegram.capabilities.inlineButtons` dit toestaat
    - `--pin` of `--delivery '{"pin":true}'` om vastgezette levering aan te vragen wanneer de bot in die chat kan vastzetten
    - `--force-document` om uitgaande afbeeldingen, GIF's en video's als documenten te verzenden in plaats van als gecomprimeerde foto-, geanimeerde-media- of video-uploads

    Actiegating:

    - `channels.telegram.actions.sendMessage=false` schakelt uitgaande Telegram-berichten uit, inclusief polls
    - `channels.telegram.actions.poll=false` schakelt het aanmaken van Telegram-polls uit, terwijl reguliere verzenden ingeschakeld blijft

  </Accordion>

  <Accordion title="Exec-goedkeuringen in Telegram">
    Telegram ondersteunt exec-goedkeuringen in goedkeurders-DM's en kan optioneel prompts plaatsen in de oorspronkelijke chat of het oorspronkelijke topic. Goedkeurders moeten numerieke Telegram-gebruikers-ID's zijn.

    Configuratiepad:

    - `channels.telegram.execApprovals.enabled` (wordt automatisch ingeschakeld wanneer ten minste één goedkeurder oplosbaar is)
    - `channels.telegram.execApprovals.approvers` (valt terug op numerieke eigenaar-ID's uit `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (standaard) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` en `defaultTo` bepalen wie met de bot kan praten en waar deze normale antwoorden naartoe stuurt. Ze maken iemand geen exec-goedkeurder. De eerste goedgekeurde DM-koppeling bootstrap't `commands.ownerAllowFrom` wanneer er nog geen opdrachteigenaar bestaat, zodat de een-eigenaarconfiguratie nog steeds werkt zonder ID's te dupliceren onder `execApprovals.approvers`.

    Kanaallevering toont de opdrachttekst in de chat; schakel `channel` of `both` alleen in vertrouwde groepen/topics in. Wanneer de prompt in een forumtopic terechtkomt, behoudt OpenClaw het topic voor de goedkeuringsprompt en het vervolgbericht. Exec-goedkeuringen verlopen standaard na 30 minuten.

    Inline goedkeuringsknoppen vereisen ook dat `channels.telegram.capabilities.inlineButtons` het doeloppervlak toestaat (`dm`, `group` of `all`). Goedkeurings-ID's met het prefix `plugin:` worden via Plugin-goedkeuringen opgelost; andere worden eerst via exec-goedkeuringen opgelost.

    Zie [Exec-goedkeuringen](/nl/tools/exec-approvals).

  </Accordion>
</AccordionGroup>```

## Regelaars voor foutantwoorden

Wanneer de agent een bezorgings- of providerfout tegenkomt, kan Telegram antwoorden met de fouttekst of die onderdrukken. Twee configuratiesleutels regelen dit gedrag:

| Sleutel                             | Waarden           | Standaard | Beschrijving                                                                                                      |
| ----------------------------------- | ----------------- | --------- | ----------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`   | `reply` stuurt een vriendelijke foutmelding naar de chat. `silent` onderdrukt foutantwoorden volledig.            |
| `channels.telegram.errorCooldownMs` | getal (ms)        | `60000`   | Minimale tijd tussen foutantwoorden naar dezelfde chat. Voorkomt foutspam tijdens storingen.                      |

Overschrijvingen per account, per groep en per onderwerp worden ondersteund (dezelfde overerving als andere Telegram-configuratiesleutels).
__OC_I18N_900023__
## Problemen oplossen

<AccordionGroup>
  <Accordion title="Bot reageert niet op groepsberichten zonder vermelding">

    - Als `requireMention=false`, moet de privacymodus van Telegram volledige zichtbaarheid toestaan.
      - BotFather: `/setprivacy` -> Uitschakelen
      - verwijder daarna de bot uit de groep en voeg hem opnieuw toe
    - `openclaw channels status` waarschuwt wanneer de configuratie groepsberichten zonder vermelding verwacht.
    - `openclaw channels status --probe` kan expliciete numerieke groeps-ID's controleren; wildcard `"*"` kan niet op lidmaatschap worden gecontroleerd.
    - snelle sessietest: `/activation always`.

  </Accordion>

  <Accordion title="Bot ziet helemaal geen groepsberichten">

    - wanneer `channels.telegram.groups` bestaat, moet de groep worden vermeld (of `"*"` bevatten)
    - controleer of de bot lid is van de groep
    - bekijk logs: `openclaw logs --follow` voor redenen waarom berichten worden overgeslagen

  </Accordion>

  <Accordion title="Commando's werken gedeeltelijk of helemaal niet">

    - autoriseer je afzenderidentiteit (koppeling en/of numerieke `allowFrom`)
    - commandautorisatie blijft gelden, ook wanneer het groepsbeleid `open` is
    - `setMyCommands failed` met `BOT_COMMANDS_TOO_MUCH` betekent dat het native menu te veel items heeft; verminder Plugin-/Skill-/aangepaste commando's of schakel native menu's uit
    - `deleteMyCommands` / `setMyCommands`-opstartaanroepen en `sendChatAction`-typaanduidingsaanroepen zijn begrensd en proberen eenmaal opnieuw via Telegram's transportfallback bij een request-time-out. Aanhoudende netwerk-/fetchfouten wijzen meestal op DNS-/HTTPS-bereikbaarheidsproblemen naar `api.telegram.org`

  </Accordion>

  <Accordion title="Opstarten meldt niet-geautoriseerd token">

    - `getMe returned 401` is een Telegram-authenticatiefout voor het geconfigureerde bottoken.
    - Kopieer het bottoken opnieuw of genereer het opnieuw in BotFather, en werk daarna `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` of `TELEGRAM_BOT_TOKEN` bij voor het standaardaccount.
    - `deleteWebhook 401 Unauthorized` tijdens het opstarten is ook een authenticatiefout; dit behandelen als "er bestaat geen webhook" zou dezelfde fout met een ongeldig token alleen uitstellen tot latere API-aanroepen.

  </Accordion>

  <Accordion title="Polling- of netwerkinstabiliteit">

    - Node 22+ + aangepaste fetch/proxy kan direct afbreekgedrag veroorzaken als AbortSignal-typen niet overeenkomen.
    - Sommige hosts resolven `api.telegram.org` eerst naar IPv6; defecte IPv6-uitgang kan intermitterende Telegram API-fouten veroorzaken.
    - Als logs `TypeError: fetch failed` of `Network request for 'getUpdates' failed!` bevatten, probeert OpenClaw deze nu opnieuw als herstelbare netwerkfouten.
    - Tijdens het opstarten van polling hergebruikt OpenClaw de succesvolle opstartprobe `getMe` voor grammY, zodat de runner geen tweede `getMe` nodig heeft vóór de eerste `getUpdates`.
    - Als `deleteWebhook` mislukt met een tijdelijke netwerkfout tijdens het opstarten van polling, gaat OpenClaw door naar long polling in plaats van nog een control-plane-aanroep vóór polling te doen. Een nog actieve Webhook verschijnt als een `getUpdates`-conflict; OpenClaw bouwt dan het Telegram-transport opnieuw op en probeert Webhook-opschoning opnieuw.
    - Als Telegram-sockets op een korte vaste cadans worden vernieuwd, controleer dan op een lage `channels.telegram.timeoutSeconds`; botclients klemmen geconfigureerde waarden onder de uitgaande en `getUpdates`-requestguards, maar oudere releases konden elke poll of elk antwoord afbreken wanneer dit onder die guards was ingesteld.
    - Als logs `Polling stall detected` bevatten, herstart OpenClaw standaard polling en bouwt het Telegram-transport opnieuw op na 120 seconden zonder voltooide long-poll-liveness.
    - `openclaw channels status --probe` en `openclaw doctor` waarschuwen wanneer een actief pollingaccount `getUpdates` niet heeft voltooid na de opstartgrace, wanneer een actief Webhook-account `setWebhook` niet heeft voltooid na de opstartgrace, of wanneer de laatste succesvolle polling-transportactiviteit verouderd is.
    - Verhoog `channels.telegram.pollingStallThresholdMs` alleen wanneer langlopende `getUpdates`-aanroepen gezond zijn maar je host nog steeds valse polling-stall-herstarts meldt. Aanhoudende stalls wijzen meestal op proxy-, DNS-, IPv6- of TLS-uitgangsproblemen tussen de host en `api.telegram.org`.
    - Telegram respecteert ook procesproxy-env voor Bot API-transport, inclusief `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` en hun varianten in kleine letters. `NO_PROXY` / `no_proxy` kan `api.telegram.org` nog steeds omzeilen.
    - Als de beheerde OpenClaw-proxy via `OPENCLAW_PROXY_URL` is geconfigureerd voor een serviceomgeving en er geen standaard proxy-env aanwezig is, gebruikt Telegram die URL ook voor Bot API-transport.
    - Op VPS-hosts met instabiele directe uitgang/TLS routeer je Telegram API-aanroepen via `channels.telegram.proxy`:
__OC_I18N_900024__
    - Node 22+ gebruikt standaard `autoSelectFamily=true` (behalve WSL2). De volgorde van Telegram DNS-resultaten respecteert `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, daarna `channels.telegram.network.dnsResultOrder`, daarna de processtandaard zoals `NODE_OPTIONS=--dns-result-order=ipv4first`; als geen daarvan van toepassing is, valt Node 22+ terug op `ipv4first`.
    - Als je host WSL2 is of expliciet beter werkt met IPv4-only gedrag, forceer dan familieselectie:
__OC_I18N_900025__
    - Antwoorden in de RFC 2544-benchmarkrange (`198.18.0.0/15`) zijn standaard al toegestaan
      voor Telegram-mediadownloads. Als een vertrouwde fake-IP- of
      transparante proxy `api.telegram.org` herschrijft naar een ander
      privé/intern/speciaal adres tijdens mediadownloads, kun je je aanmelden
      voor de alleen-Telegram-bypass:
__OC_I18N_900026__
    - Dezelfde opt-in is per account beschikbaar op
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Als je proxy Telegram-mediahosts resolveert naar `198.18.x.x`, laat de
      gevaarlijke vlag dan eerst uit. Telegram-media staat de RFC 2544-
      benchmarkrange standaard al toe.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` verzwakt de SSRF-bescherming voor Telegram-
      media. Gebruik dit alleen voor vertrouwde, door operators beheerde proxy-
      omgevingen zoals Clash-, Mihomo- of Surge-fake-IP-routing wanneer ze
      privé- of speciale antwoorden buiten de RFC 2544-benchmark-
      range synthetiseren. Laat dit uit voor normale openbare Telegram-toegang via internet.
    </Warning>

    - Omgevingsoverschrijvingen (tijdelijk):
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - Valideer DNS-antwoorden:
__OC_I18N_900027__
  </Accordion>
</AccordionGroup>

Meer hulp: [Problemen met kanalen oplossen](/channels/troubleshooting).

## Configuratiereferentie

Primaire referentie: [Configuratiereferentie - Telegram](/gateway/config-channels#telegram).

<Accordion title="Telegram-velden met hoge signaalwaarde">

- opstart/auth: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` moet naar een regulier bestand wijzen; symlinks worden geweigerd)
- toegangscontrole: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, top-level `bindings[]` (`type: "acp"`)
- exec-goedkeuringen: `execApprovals`, `accounts.*.execApprovals`
- commando/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- threads/antwoorden: `replyToMode`, `dm.threadReplies`, `direct.*.threadReplies`
- streaming: `streaming` (preview), `streaming.preview.toolProgress`, `blockStreaming`
- opmaak/bezorging: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- media/netwerk: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- aangepaste API-root: `apiRoot` (alleen Bot API-root; neem `/bot<TOKEN>` niet op)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- acties/capabilities: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reacties: `reactionNotifications`, `reactionLevel`
- fouten: `errorPolicy`, `errorCooldownMs`
- schrijven/geschiedenis: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Voorrang bij meerdere accounts: wanneer twee of meer account-ID's zijn geconfigureerd, stel `channels.telegram.defaultAccount` in (of neem `channels.telegram.accounts.default` op) om standaardrouting expliciet te maken. Anders valt OpenClaw terug op het eerste genormaliseerde account-ID en waarschuwt `openclaw doctor`. Benoemde accounts erven `channels.telegram.allowFrom` / `groupAllowFrom`, maar niet de waarden van `accounts.default.*`.
</Note>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Koppelen" icon="link" href="/nl/channels/pairing">
    Koppel een Telegram-gebruiker aan de gateway.
  </Card>
  <Card title="Groepen" icon="users" href="/nl/channels/groups">
    Gedrag voor allowlists van groepen en onderwerpen.
  </Card>
  <Card title="Kanaalroutering" icon="route" href="/nl/channels/channel-routing">
    Routeer inkomende berichten naar agents.
  </Card>
  <Card title="Beveiliging" icon="shield" href="/nl/gateway/security">
    Dreigingsmodel en hardening.
  </Card>
  <Card title="Multi-agent-routering" icon="sitemap" href="/nl/concepts/multi-agent">
    Wijs groepen en onderwerpen toe aan agents.
  </Card>
  <Card title="Problemen oplossen" icon="wrench" href="/nl/channels/troubleshooting">
    Kanaaloverstijgende diagnostiek.
  </Card>
</CardGroup>
