---
read_when:
    - Werken aan Telegram-functies of Webhooks
summary: Status, mogelijkheden en configuratie van Telegram-botondersteuning
title: Telegram
x-i18n:
    generated_at: "2026-05-10T19:23:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 87fc2994ced5e3c845b35f8c134ca04de317e83c3c2414de2dea4779a763f17e
    source_path: channels/telegram.md
    workflow: 16
---

Productieklaar voor bot-DM's en groepen via grammY. Long polling is de standaardmodus; webhookmodus is optioneel.

<CardGroup cols={3}>
  <Card title="Koppelen" icon="link" href="/nl/channels/pairing">
    Het standaard DM-beleid voor Telegram is koppelen.
  </Card>
  <Card title="Probleemoplossing voor kanalen" icon="wrench" href="/nl/channels/troubleshooting">
    Cross-channel diagnostics en herstel-playbooks.
  </Card>
  <Card title="Gateway-configuratie" icon="settings" href="/nl/gateway/configuration">
    Volledige kanaalconfiguratiepatronen en voorbeelden.
  </Card>
</CardGroup>

## Snelle configuratie

<Steps>
  <Step title="Maak het bottoken aan in BotFather">
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
    Voeg de bot toe aan je groep en stel daarna `channels.telegram.groups` en `groupPolicy` zo in dat ze overeenkomen met je toegangsmodel.
  </Step>
</Steps>

<Note>
De volgorde voor tokenresolutie is accountbewust. In de praktijk hebben configwaarden voorrang op de env-fallback, en `TELEGRAM_BOT_TOKEN` geldt alleen voor het standaardaccount.
</Note>

## Instellingen aan Telegram-zijde

<AccordionGroup>
  <Accordion title="Privacymodus en groepszichtbaarheid">
    Telegram-bots gebruiken standaard **Privacy Mode**, wat beperkt welke groepsberichten ze ontvangen.

    Als de bot alle groepsberichten moet zien, doe dan een van beide:

    - schakel privacymodus uit via `/setprivacy`, of
    - maak de bot groepsbeheerder.

    Verwijder de bot uit elke groep en voeg hem opnieuw toe wanneer je privacymodus wijzigt, zodat Telegram de wijziging toepast.

  </Accordion>

  <Accordion title="Groepsmachtigingen">
    Beheerdersstatus wordt beheerd in de Telegram-groepsinstellingen.

    Beheerderbots ontvangen alle groepsberichten, wat nuttig is voor altijd actieve groepsfunctionaliteit.

  </Accordion>

  <Accordion title="Nuttige BotFather-schakelaars">

    - `/setjoingroups` om toevoegen aan groepen toe te staan of te weigeren
    - `/setprivacy` voor gedrag rond groepszichtbaarheid

  </Accordion>
</AccordionGroup>

## Toegangsbeheer en activering

<Tabs>
  <Tab title="DM-beleid">
    `channels.telegram.dmPolicy` beheert toegang via directe berichten:

    - `pairing` (standaard)
    - `allowlist` (vereist ten minste één afzender-ID in `allowFrom`)
    - `open` (vereist dat `allowFrom` `"*"` bevat)
    - `disabled`

    `dmPolicy: "open"` met `allowFrom: ["*"]` laat elk Telegram-account dat de botgebruikersnaam vindt of raadt de bot opdrachten geven. Gebruik dit alleen voor bewust openbare bots met strikt beperkte tools; bots met één eigenaar moeten `allowlist` gebruiken met numerieke gebruikers-ID's.

    `channels.telegram.allowFrom` accepteert numerieke Telegram-gebruikers-ID's. Prefixen `telegram:` / `tg:` worden geaccepteerd en genormaliseerd.
    In configuraties met meerdere accounts wordt een beperkende `channels.telegram.allowFrom` op topniveau behandeld als een veiligheidsgrens: accountniveauvermeldingen `allowFrom: ["*"]` maken dat account niet openbaar, tenzij de effectieve account-allowlist na samenvoeging nog steeds een expliciete wildcard bevat.
    `dmPolicy: "allowlist"` met lege `allowFrom` blokkeert alle DM's en wordt geweigerd door configvalidatie.
    Setup vraagt alleen om numerieke gebruikers-ID's.
    Als je hebt geüpgraded en je config `@username`-allowlistvermeldingen bevat, voer dan `openclaw doctor --fix` uit om ze op te lossen (best-effort; vereist een Telegram-bottoken).
    Als je eerder vertrouwde op allowlistbestanden uit de pairing-store, kan `openclaw doctor --fix` vermeldingen herstellen naar `channels.telegram.allowFrom` in allowlist-flows (bijvoorbeeld wanneer `dmPolicy: "allowlist"` nog geen expliciete ID's heeft).

    Voor bots met één eigenaar geef je de voorkeur aan `dmPolicy: "allowlist"` met expliciete numerieke `allowFrom`-ID's om het toegangsbeleid duurzaam in config vast te leggen (in plaats van afhankelijk te zijn van eerdere koppelingsgoedkeuringen).

    Veelvoorkomende verwarring: goedkeuring voor DM-koppeling betekent niet "deze afzender is overal geautoriseerd".
    Koppeling verleent DM-toegang. Als er nog geen opdrachteigenaar bestaat, stelt de eerste goedgekeurde koppeling ook `commands.ownerAllowFrom` in zodat opdrachten alleen voor eigenaren en exec-goedkeuringen een expliciet operatoraccount hebben.
    Autorisatie van groepsafzenders komt nog steeds uit expliciete config-allowlists.
    Als je wilt "ik ben één keer geautoriseerd en zowel DM's als groepsopdrachten werken", zet dan je numerieke Telegram-gebruikers-ID in `channels.telegram.allowFrom`; zorg er voor opdrachten alleen voor eigenaren voor dat `commands.ownerAllowFrom` `telegram:<your user id>` bevat.

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
         - met `groupPolicy: "allowlist"` (standaard): groepen worden geblokkeerd totdat je `groups`-vermeldingen toevoegt (of `"*"`)
       - `groups` geconfigureerd: werkt als allowlist (expliciete ID's of `"*"`)

    2. **Welke afzenders zijn toegestaan in groepen** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (standaard)
       - `disabled`

    `groupAllowFrom` wordt gebruikt voor het filteren van groepsafzenders. Als dit niet is ingesteld, valt Telegram terug op `allowFrom`.
    `groupAllowFrom`-vermeldingen moeten numerieke Telegram-gebruikers-ID's zijn (prefixen `telegram:` / `tg:` worden genormaliseerd).
    Plaats geen Telegram-groep- of supergroepchat-ID's in `groupAllowFrom`. Negatieve chat-ID's horen onder `channels.telegram.groups`.
    Niet-numerieke vermeldingen worden genegeerd voor afzenderautorisatie.
    Veiligheidsgrens (`2026.2.25+`): autorisatie van groepsafzenders erft **geen** goedkeuringen uit de DM-pairing-store.
    Koppeling blijft alleen voor DM's. Stel voor groepen `groupAllowFrom` of `allowFrom` per groep/per topic in.
    Als `groupAllowFrom` niet is ingesteld, valt Telegram terug op config `allowFrom`, niet op de pairing-store.
    Praktisch patroon voor bots met één eigenaar: stel je gebruikers-ID in bij `channels.telegram.allowFrom`, laat `groupAllowFrom` leeg en sta de doelgroepen toe onder `channels.telegram.groups`.
    Runtime-opmerking: als `channels.telegram` volledig ontbreekt, gebruikt runtime standaard fail-closed `groupPolicy="allowlist"`, tenzij `channels.defaults.groupPolicy` expliciet is ingesteld.

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
      Veelvoorkomende fout: `groupAllowFrom` is geen Telegram-groep-allowlist.

      - Plaats negatieve Telegram-groep- of supergroepchat-ID's zoals `-1001234567890` onder `channels.telegram.groups`.
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

  </Tab>
</Tabs>

## Runtime-gedrag

- Telegram is eigendom van het gatewayproces.
- Routering is deterministisch: Telegram-inbound antwoordt terug naar Telegram (het model kiest geen kanalen).
- Inbound berichten worden genormaliseerd naar de gedeelde kanaalenvelop met antwoordmetadata, mediaplaceholders en persistente antwoordketencontext voor Telegram-antwoorden die de gateway heeft waargenomen.
- Groepssessies worden geïsoleerd op groeps-ID. Forumtopics voegen `:topic:<threadId>` toe om topics geïsoleerd te houden.
- DM-berichten kunnen `message_thread_id` bevatten; OpenClaw behoudt de thread-ID voor antwoorden, maar houdt DM's standaard op de vlakke sessie. Configureer `channels.telegram.dm.threadReplies: "inbound"`, `channels.telegram.direct.<chatId>.threadReplies: "inbound"`, `requireTopic: true` of een overeenkomende topicconfig wanneer je bewust DM-topic-sessie-isolatie wilt.
- Long polling gebruikt grammY runner met sequencing per chat/per thread. De algemene runner-sinkconcurrency gebruikt `agents.defaults.maxConcurrent`.
- Long polling wordt binnen elk gatewayproces bewaakt, zodat slechts één actieve poller tegelijk een bottoken kan gebruiken. Als je nog steeds `getUpdates` 409-conflicten ziet, gebruikt waarschijnlijk een andere OpenClaw-gateway, script of externe poller hetzelfde token.
- Long-polling-watchdog-herstarts worden standaard geactiveerd na 120 seconden zonder voltooide `getUpdates`-liveness. Verhoog `channels.telegram.pollingStallThresholdMs` alleen als je deployment nog steeds onterechte polling-stall-herstarts ziet tijdens langlopende werkzaamheden. De waarde is in milliseconden en is toegestaan van `30000` tot `600000`; overrides per account worden ondersteund.
- Telegram Bot API heeft geen ondersteuning voor leesbevestigingen (`sendReadReceipts` is niet van toepassing).

## Functiereferentie

<AccordionGroup>
  <Accordion title="Livestreamvoorbeeld (berichtbewerkingen)">
    OpenClaw kan gedeeltelijke antwoorden in realtime streamen:

    - directe chats: voorbeeldbericht + `editMessageText`
    - groepen/topics: voorbeeldbericht + `editMessageText`

    Vereiste:

    - `channels.telegram.streaming` is `off | partial | block | progress` (standaard: `partial`)
    - `progress` houdt één bewerkbare statusconcepttekst bij voor toolvoortgang, wist die bij voltooiing en verzendt het definitieve antwoord als normaal bericht
    - `streaming.preview.toolProgress` bepaalt of tool-/voortgangsupdates hetzelfde bewerkte voorbeeldbericht hergebruiken (standaard: `true` wanneer preview-streaming actief is)
    - `streaming.preview.commandText` bepaalt opdracht-/exec-details binnen die toolvoortgangsregels: `raw` (standaard, behoudt uitgebracht gedrag) of `status` (alleen toollabel)
    - verouderde waarden `channels.telegram.streamMode` en booleaanse `streaming`-waarden worden gedetecteerd; voer `openclaw doctor --fix` uit om ze te migreren naar `channels.telegram.streaming.mode`

    Toolvoortgangs-previewupdates zijn de korte statusregels die worden getoond terwijl tools draaien, bijvoorbeeld opdrachtuitvoering, bestandslezingen, planningsupdates of patchsamenvattingen. Telegram houdt deze standaard ingeschakeld om overeen te komen met uitgebracht OpenClaw-gedrag vanaf `v2026.4.22` en later. Stel het volgende in om het bewerkte voorbeeld voor antwoordtekst te behouden maar toolvoortgangsregels te verbergen:

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

    Om toolvoortgang zichtbaar te houden maar command/exec-tekst te verbergen, stel je het volgende in:

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

    Gebruik `streaming.mode: "off"` alleen wanneer je uitsluitend definitieve levering wilt: Telegram-previewbewerkingen worden uitgeschakeld en generieke tool-/voortgangsberichten worden onderdrukt in plaats van als losse statusberichten te worden verzonden. Goedkeuringsprompts, media-payloads en fouten lopen nog steeds via normale definitieve levering. Gebruik `streaming.preview.toolProgress: false` wanneer je alleen antwoordpreviewbewerkingen wilt behouden terwijl je de statusregels voor toolvoortgang verbergt.

    <Note>
      Telegram-antwoorden op geselecteerde citaten zijn de uitzondering. Wanneer `replyToMode` `"first"`, `"all"` of `"batched"` is en het inkomende bericht geselecteerde citaattekst bevat, verzendt OpenClaw het definitieve antwoord via Telegram's native citaatantwoordpad in plaats van de antwoordpreview te bewerken, waardoor `streaming.preview.toolProgress` de korte statusregels voor die beurt niet kan tonen. Antwoorden op het huidige bericht zonder geselecteerde citaattekst behouden previewstreaming nog steeds. Stel `replyToMode: "off"` in wanneer zichtbaarheid van toolvoortgang belangrijker is dan native citaatantwoorden, of stel `streaming.preview.toolProgress: false` in om de afweging te erkennen.
    </Note>

    Voor tekst-only antwoorden:

    - korte DM-/groep-/topic-previews: OpenClaw behoudt hetzelfde previewbericht en voert de definitieve bewerking ter plekke uit
    - lange definitieve teksten die in meerdere Telegram-berichten worden opgesplitst, hergebruiken waar mogelijk de bestaande preview als eerste definitieve chunk en verzenden daarna alleen de resterende chunks
    - definitieve antwoorden in voortgangsmodus wissen het statusconcept en gebruiken normale definitieve levering in plaats van het concept in het antwoord te bewerken
    - als de definitieve bewerking mislukt voordat de voltooide tekst is bevestigd, gebruikt OpenClaw normale definitieve levering en ruimt het de verouderde preview op

    Voor complexe antwoorden (bijvoorbeeld media-payloads) valt OpenClaw terug op normale definitieve levering en ruimt daarna het previewbericht op.

    Previewstreaming staat los van blokstreaming. Wanneer blokstreaming expliciet is ingeschakeld voor Telegram, slaat OpenClaw de previewstream over om dubbele streaming te voorkomen.

    Alleen-Telegram redeneerstream:

    - `/reasoning stream` verzendt redenering naar de live preview tijdens het genereren
    - de redeneerpreview wordt verwijderd na definitieve levering; gebruik `/reasoning on` wanneer redenering zichtbaar moet blijven
    - het definitieve antwoord wordt zonder redeneertekst verzonden

  </Accordion>

  <Accordion title="Opmaak en HTML-terugval">
    Uitgaande tekst gebruikt Telegram `parse_mode: "HTML"`.

    - Markdown-achtige tekst wordt gerenderd naar Telegram-veilige HTML.
    - Ruwe model-HTML wordt ge-escaped om Telegram-parsefouten te verminderen.
    - Als Telegram geparsede HTML weigert, probeert OpenClaw het opnieuw als platte tekst.

    Linkpreviews zijn standaard ingeschakeld en kunnen worden uitgeschakeld met `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Native commando's en aangepaste commando's">
    Registratie van het Telegram-commandmenu wordt bij het opstarten afgehandeld met `setMyCommands`.

    Standaardinstellingen voor native commando's:

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

    - aangepaste commando's zijn alleen menu-items; ze implementeren gedrag niet automatisch
    - plugin-/skill-commando's kunnen nog steeds werken wanneer ze worden getypt, zelfs als ze niet in het Telegram-menu worden weergegeven

    Als native commando's zijn uitgeschakeld, worden ingebouwde commando's verwijderd. Aangepaste/plugincommando's kunnen nog steeds worden geregistreerd als ze zijn geconfigureerd.

    Veelvoorkomende installatiefouten:

    - `setMyCommands failed` met `BOT_COMMANDS_TOO_MUCH` betekent dat het Telegram-menu na inkorten nog steeds te vol was; verminder plugin-/skill-/aangepaste commando's of schakel `channels.telegram.commands.native` uit.
    - Als `deleteWebhook`, `deleteMyCommands` of `setMyCommands` faalt met `404: Not Found` terwijl directe Bot API-curlcommando's werken, kan dat betekenen dat `channels.telegram.apiRoot` is ingesteld op het volledige `/bot<TOKEN>`-endpoint. `apiRoot` mag alleen de Bot API-root zijn, en `openclaw doctor --fix` verwijdert een per ongeluk toegevoegde afsluitende `/bot<TOKEN>`.
    - `getMe returned 401` betekent dat Telegram de geconfigureerde bottoken heeft geweigerd. Werk `botToken`, `tokenFile` of `TELEGRAM_BOT_TOKEN` bij met de huidige BotFather-token; OpenClaw stopt vóór het pollen, dus dit wordt niet gerapporteerd als een webhook-opruimfout.
    - `setMyCommands failed` met netwerk-/fetchfouten betekent meestal dat uitgaande DNS/HTTPS naar `api.telegram.org` is geblokkeerd.

    ### Commando's voor apparaatkoppeling (`device-pair` Plugin)

    Wanneer de `device-pair` Plugin is geïnstalleerd:

    1. `/pair` genereert installatiecode
    2. plak code in iOS-app
    3. `/pair pending` toont openstaande aanvragen (inclusief rol/scopes)
    4. keur de aanvraag goed:
       - `/pair approve <requestId>` voor expliciete goedkeuring
       - `/pair approve` wanneer er slechts één openstaande aanvraag is
       - `/pair approve latest` voor de meest recente

    De installatiecode bevat een kortlevende bootstrap-token. Ingebouwde bootstrap-overdracht houdt de primaire node-token op `scopes: []`; elke overgedragen operatortoken blijft beperkt tot `operator.approvals`, `operator.read`, `operator.talk.secrets` en `operator.write`. Bootstrap-scopecontroles hebben een rolprefix, dus die operatorallowlist voldoet alleen aan operatoraanvragen; niet-operatorrollen hebben nog steeds scopes nodig onder hun eigen rolprefix.

    Als een apparaat het opnieuw probeert met gewijzigde authgegevens (bijvoorbeeld rol/scopes/openbare sleutel), wordt de vorige openstaande aanvraag vervangen en gebruikt de nieuwe aanvraag een andere `requestId`. Voer `/pair pending` opnieuw uit vóór goedkeuring.

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

    Verouderde `capabilities: ["inlineButtons"]` wordt gemapt naar `inlineButtons: "all"`.

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

    Callback-klikken worden als tekst doorgegeven aan de agent:
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

    Gatekeepingbesturing:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (standaard: uitgeschakeld)

    Opmerking: `edit` en `topic-create` zijn momenteel standaard ingeschakeld en hebben geen afzonderlijke `channels.telegram.actions.*`-toggles.
    Runtimeverzending gebruikt de actieve config-/secretssnapshot (opstarten/herladen), dus actiepaden voeren geen ad-hoc heroplossing van SecretRef per verzending uit.

    Semantiek voor verwijderen van reacties: [/tools/reactions](/nl/tools/reactions)

  </Accordion>

  <Accordion title="Antwoord-threadingtags">
    Telegram ondersteunt expliciete antwoord-threadingtags in gegenereerde output:

    - `[[reply_to_current]]` antwoordt op het triggerende bericht
    - `[[reply_to:<id>]]` antwoordt op een specifieke Telegram-bericht-ID

    `channels.telegram.replyToMode` regelt de afhandeling:

    - `off` (standaard)
    - `first`
    - `all`

    Wanneer antwoord-threading is ingeschakeld en de oorspronkelijke Telegram-tekst of caption beschikbaar is, neemt OpenClaw automatisch een native Telegram-citaatexcerpt op. Telegram beperkt native citaattekst tot 1024 UTF-16-code-eenheden, dus langere berichten worden vanaf het begin geciteerd en vallen terug op een gewoon antwoord als Telegram het citaat weigert.

    Opmerking: `off` schakelt impliciete antwoord-threading uit. Expliciete `[[reply_to_*]]`-tags worden nog steeds gerespecteerd.

  </Accordion>

  <Accordion title="Forumtopics en threadgedrag">
    Forum-supergroepen:

    - topicsessiesleutels voegen `:topic:<threadId>` toe
    - antwoorden en typen richten zich op de topicthread
    - pad voor topicconfiguratie:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Speciaal geval voor algemeen topic (`threadId=1`):

    - berichtverzendingen laten `message_thread_id` weg (Telegram weigert `sendMessage(...thread_id=1)`)
    - typeacties bevatten nog steeds `message_thread_id`

    Topic-overerving: topicitems erven groepsinstellingen tenzij overschreven (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` is alleen voor topics en erft niet van groepsstandaarden.

    **Routering per topic naar agent**: Elk topic kan naar een andere agent routeren door `agentId` in de topicconfiguratie in te stellen. Dit geeft elk topic zijn eigen geïsoleerde workspace, geheugen en sessie. Voorbeeld:

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

    Elk topic heeft dan zijn eigen sessiesleutel: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Persistente ACP-topicbinding**: Forumtopics kunnen ACP-harnesssessies vastzetten via top-level getypeerde ACP-bindingen (`bindings[]` met `type: "acp"` en `match.channel: "telegram"`, `peer.kind: "group"` en een topicgekwalificeerde id zoals `-1001234567890:topic:42`). Momenteel beperkt tot forumtopics in groepen/supergroepen. Zie [ACP Agents](/nl/tools/acp-agents).

    **Threadgebonden ACP-spawn vanuit chat**: `/acp spawn <agent> --thread here|auto` bindt het huidige topic aan een nieuwe ACP-sessie; vervolgberichten worden daar direct heen gerouteerd. OpenClaw zet de spawnbevestiging vast in het topic. Vereist dat `channels.telegram.threadBindings.spawnSessions` ingeschakeld blijft (standaard: `true`).

    De templatecontext stelt `MessageThreadId` en `IsForum` beschikbaar. DM-chats met `message_thread_id` behouden standaard DM-routering en antwoordmetadata op vlakke sessies; ze gebruiken alleen thread-bewuste sessiesleutels wanneer ze zijn geconfigureerd met `threadReplies: "inbound"`, `threadReplies: "always"`, `requireTopic: true`, of een overeenkomende topicconfiguratie. Gebruik `channels.telegram.dm.threadReplies` op topniveau voor de accountstandaard, of `direct.<chatId>.threadReplies` voor één DM.

  </Accordion>

  <Accordion title="Audio, video en stickers">
    ### Audioberichten

    Telegram maakt onderscheid tussen spraaknotities en audiobestanden.

    - standaard: gedrag voor audiobestanden
    - tag `[[audio_as_voice]]` in agentantwoord om verzenden als spraaknotitie af te dwingen
    - inkomende transcripties van spraaknotities worden als machinaal gegenereerde,
      niet-vertrouwde tekst in de agentcontext geplaatst; vermeldingsdetectie gebruikt nog steeds de ruwe
      transcriptie zodat door vermeldingen gated spraakberichten blijven werken.

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

    Stickers-cachebestand:

    - `~/.openclaw/telegram/sticker-cache.json`

    Stickers worden één keer beschreven (wanneer mogelijk) en gecachet om herhaalde vision-aanroepen te verminderen.

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
    - Reactiegebeurtenissen respecteren nog steeds Telegram-toegangscontroles (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); onbevoegde afzenders worden genegeerd.
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

    - Telegram verwacht unicode-emoji (bijvoorbeeld "👀").
    - Gebruik `""` om de reactie voor een kanaal of account uit te schakelen.

  </Accordion>

  <Accordion title="Configuratieschrijfacties vanuit Telegram-gebeurtenissen en -commando's">
    Schrijfacties naar kanaalconfiguratie zijn standaard ingeschakeld (`configWrites !== false`).

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
    Standaard is long polling. Stel voor Webhook-modus `channels.telegram.webhookUrl` en `channels.telegram.webhookSecret` in; optioneel `webhookPath`, `webhookHost`, `webhookPort` (standaardwaarden `/telegram-webhook`, `127.0.0.1`, `8787`).

    In long-polling-modus bewaart OpenClaw zijn herstart-watermark pas nadat een update succesvol is gedispatcht. Als een handler faalt, blijft die update in hetzelfde proces opnieuw te proberen en wordt deze niet als voltooid weggeschreven voor herstart-deduplicatie.

    De lokale listener bindt aan `127.0.0.1:8787`. Plaats voor publieke ingress een reverse proxy vóór de lokale poort of stel bewust `webhookHost: "0.0.0.0"` in.

    Webhook-modus valideert requestguards, het geheime Telegram-token en de JSON-body voordat `200` aan Telegram wordt geretourneerd.
    OpenClaw verwerkt de update daarna asynchroon via dezelfde botlanes per chat/per topic die long polling gebruikt, zodat trage agentbeurten de afleverings-ACK van Telegram niet ophouden.

  </Accordion>

  <Accordion title="Limieten, opnieuw proberen en CLI-targets">
    - `channels.telegram.textChunkLimit` is standaard 4000.
    - `channels.telegram.chunkMode="newline"` geeft de voorkeur aan alineagrenzen (lege regels) vóór splitsen op lengte.
    - `channels.telegram.mediaMaxMb` (standaard 100) begrenst de grootte van inkomende en uitgaande Telegram-media.
    - `channels.telegram.mediaGroupFlushMs` (standaard 500) bepaalt hoe lang Telegram-albums/mediagroepen worden gebufferd voordat OpenClaw ze als één inkomend bericht dispatcht. Verhoog dit als albumonderdelen laat aankomen; verlaag het om de antwoordlatentie voor albums te verminderen.
    - `channels.telegram.timeoutSeconds` overschrijft de time-out van de Telegram API-client (indien niet ingesteld, geldt de grammY-standaard). Botclients klemmen geconfigureerde waarden onder de 60-seconden requestguard voor uitgaande tekst/typen zodat grammY zichtbare antwoordaflevering niet afbreekt voordat de transportguard en fallback van OpenClaw kunnen worden uitgevoerd. Long polling gebruikt nog steeds een 45-seconden `getUpdates`-requestguard zodat idle polls niet onbeperkt worden verlaten.
    - `channels.telegram.pollingStallThresholdMs` is standaard `120000`; stem alleen tussen `30000` en `600000` af voor fout-positieve herstarts bij polling-stalls.
    - groepscontexthistorie gebruikt `channels.telegram.historyLimit` of `messages.groupChat.historyLimit` (standaard 50); `0` schakelt uit.
    - aanvullende context voor antwoorden/citaten/doorsturen wordt genormaliseerd in één geselecteerd gesprekscontextvenster wanneer de Gateway de bovenliggende berichten heeft waargenomen; de cache met waargenomen berichten wordt naast de sessiestore bewaard. Telegram neemt slechts één ondiepe `reply_to_message` op in updates, dus ketens ouder dan de cache zijn beperkt tot de huidige updatepayload van Telegram.
    - Telegram-allowlists regelen primair wie de agent kan triggeren, niet een volledige grens voor redactie van aanvullende context.
    - DM-historiecontroles:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - De configuratie `channels.telegram.retry` geldt voor Telegram-verzendhelpers (CLI/tools/acties) bij herstelbare uitgaande API-fouten. Aflevering van inkomende eindantwoorden gebruikt ook een begrensde safe-send retry voor Telegram-preconnectfouten, maar probeert geen ambiguë post-send netwerk-enveloppen opnieuw die zichtbare berichten zouden kunnen dupliceren.

    CLI- en berichttool-verzendtargets kunnen een numerieke chat-ID, gebruikersnaam of forumtopic-target zijn:

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

    Alleen-Telegram poll-flags:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` voor forumtopics (of gebruik een `:topic:`-target)

    Telegram-verzenden ondersteunt ook:

    - `--presentation` met `buttons`-blokken voor inline toetsenborden wanneer `channels.telegram.capabilities.inlineButtons` dit toestaat
    - `--pin` of `--delivery '{"pin":true}'` om vastgepinde aflevering aan te vragen wanneer de bot in die chat kan pinnen
    - `--force-document` om uitgaande afbeeldingen en GIF's als documenten te verzenden in plaats van als gecomprimeerde foto of animated-media uploads

    Actiegating:

    - `channels.telegram.actions.sendMessage=false` schakelt uitgaande Telegram-berichten uit, inclusief polls
    - `channels.telegram.actions.poll=false` schakelt het maken van Telegram-polls uit terwijl reguliere verzendingen ingeschakeld blijven

  </Accordion>

  <Accordion title="Exec-goedkeuringen in Telegram">
    Telegram ondersteunt exec-goedkeuringen in goedkeurder-DM's en kan optioneel prompts plaatsen in de oorspronkelijke chat of het oorspronkelijke topic. Goedkeurders moeten numerieke Telegram-gebruikers-ID's zijn.

    Configuratiepad:

    - `channels.telegram.execApprovals.enabled` (wordt automatisch ingeschakeld wanneer ten minste één goedkeurder kan worden opgelost)
    - `channels.telegram.execApprovals.approvers` (valt terug op numerieke eigenaar-ID's uit `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (standaard) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` en `defaultTo` bepalen wie met de bot kan praten en waar deze normale antwoorden verzendt. Ze maken iemand geen exec-goedkeurder. De eerste goedgekeurde DM-koppeling bootstrapt `commands.ownerAllowFrom` wanneer er nog geen commando-eigenaar bestaat, zodat de één-eigenaar-installatie nog steeds werkt zonder ID's te dupliceren onder `execApprovals.approvers`.

    Kanaalaflevering toont de commandotekst in de chat; schakel `channel` of `both` alleen in voor vertrouwde groepen/topics. Wanneer de prompt in een forumtopic terechtkomt, behoudt OpenClaw het topic voor de goedkeuringsprompt en de follow-up. Exec-goedkeuringen verlopen standaard na 30 minuten.

    Inline goedkeuringsknoppen vereisen ook dat `channels.telegram.capabilities.inlineButtons` het targetoppervlak toestaat (`dm`, `group` of `all`). Goedkeurings-ID's met prefix `plugin:` worden opgelost via Plugin-goedkeuringen; andere worden eerst via exec-goedkeuringen opgelost.

    Zie [Exec-goedkeuringen](/nl/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Foutantwoordcontroles

Wanneer de agent een afleverings- of providerfout tegenkomt, kan Telegram antwoorden met de fouttekst of deze onderdrukken. Twee configuratiesleutels bepalen dit gedrag:

| Sleutel                              | Waarden           | Standaard | Beschrijving                                                                                               |
| ------------------------------------ | ----------------- | --------- | ---------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`      | `reply`, `silent` | `reply`   | `reply` verzendt een vriendelijke foutmelding naar de chat. `silent` onderdrukt foutantwoorden volledig.   |
| `channels.telegram.errorCooldownMs`  | getal (ms)        | `60000`   | Minimale tijd tussen foutantwoorden naar dezelfde chat. Voorkomt foutspam tijdens storingen.               |

Overrides per account, per groep en per topic worden ondersteund (dezelfde overerving als andere Telegram-configuratiesleutels).

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
    - `openclaw channels status --probe` kan expliciete numerieke groeps-ID's controleren; jokerteken `"*"` kan niet op lidmaatschap worden gecontroleerd.
    - snelle sessietest: `/activation always`.

  </Accordion>

  <Accordion title="Bot ziet helemaal geen groepsberichten">

    - wanneer `channels.telegram.groups` bestaat, moet de groep worden vermeld (of moet `"*"` zijn opgenomen)
    - controleer of de bot lid is van de groep
    - bekijk logs: `openclaw logs --follow` voor redenen waarom berichten worden overgeslagen

  </Accordion>

  <Accordion title="Opdrachten werken gedeeltelijk of helemaal niet">

    - autoriseer je afzenderidentiteit (koppeling en/of numerieke `allowFrom`)
    - opdracht-autorisatie blijft gelden, zelfs wanneer het groepsbeleid `open` is
    - `setMyCommands failed` met `BOT_COMMANDS_TOO_MUCH` betekent dat het native menu te veel items heeft; verminder Plugin-/Skill-/aangepaste opdrachten of schakel native menu's uit
    - `deleteMyCommands` / `setMyCommands`-opstartaanroepen en `sendChatAction`-typaanduidingsaanroepen zijn begrensd en proberen één keer opnieuw via de transport-fallback van Telegram bij een request-time-out. Aanhoudende netwerk-/fetch-fouten wijzen meestal op problemen met DNS-/HTTPS-bereikbaarheid naar `api.telegram.org`

  </Accordion>

  <Accordion title="Opstarten meldt niet-geautoriseerd token">

    - `getMe returned 401` is een Telegram-authenticatiefout voor het geconfigureerde bottoken.
    - Kopieer het bottoken opnieuw of genereer het opnieuw in BotFather en werk daarna `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` of `TELEGRAM_BOT_TOKEN` bij voor het standaardaccount.
    - `deleteWebhook 401 Unauthorized` tijdens het opstarten is ook een authenticatiefout; dit behandelen als "er bestaat geen webhook" zou dezelfde fout door een ongeldig token alleen uitstellen tot latere API-aanroepen.

  </Accordion>

  <Accordion title="Polling- of netwerkinstabiliteit">

    - Node 22+ + aangepaste fetch/proxy kan direct afbreekgedrag veroorzaken als AbortSignal-typen niet overeenkomen.
    - Sommige hosts lossen `api.telegram.org` eerst op naar IPv6; defecte IPv6-egress kan intermitterende Telegram API-fouten veroorzaken.
    - Als logs `TypeError: fetch failed` of `Network request for 'getUpdates' failed!` bevatten, probeert OpenClaw deze nu opnieuw als herstelbare netwerkfouten.
    - Tijdens het starten van polling hergebruikt OpenClaw de succesvolle `getMe`-probe van het opstarten voor grammY, zodat de runner geen tweede `getMe` nodig heeft vóór de eerste `getUpdates`.
    - Als `deleteWebhook` tijdens het starten van polling mislukt met een tijdelijke netwerkfout, gaat OpenClaw door met long polling in plaats van nog een control-plane-aanroep vóór polling te doen. Een nog actieve Webhook verschijnt als een `getUpdates`-conflict; OpenClaw bouwt daarna het Telegram-transport opnieuw op en probeert webhook-opruiming opnieuw.
    - Als Telegram-sockets op een korte vaste cadans worden gerecycled, controleer dan op een lage `channels.telegram.timeoutSeconds`; botclients begrenzen geconfigureerde waarden onder de outbound- en `getUpdates`-requestguards, maar oudere releases konden elke poll of reply afbreken wanneer dit onder die guards was ingesteld.
    - Als logs `Polling stall detected` bevatten, start OpenClaw polling opnieuw en bouwt het Telegram-transport opnieuw op na standaard 120 seconden zonder voltooide long-poll-liveness.
    - `openclaw channels status --probe` en `openclaw doctor` waarschuwen wanneer een actief polling-account na de opstart-grace geen `getUpdates` heeft voltooid, wanneer een actief Webhook-account na de opstart-grace geen `setWebhook` heeft voltooid, of wanneer de laatste succesvolle polling-transportactiviteit verouderd is.
    - Verhoog `channels.telegram.pollingStallThresholdMs` alleen wanneer langlopende `getUpdates`-aanroepen gezond zijn, maar je host nog steeds onterechte polling-stall-herstarts meldt. Aanhoudende stalls wijzen meestal op proxy-, DNS-, IPv6- of TLS-egressproblemen tussen de host en `api.telegram.org`.
    - Telegram respecteert ook proces-proxy-env voor Bot API-transport, inclusief `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` en hun varianten in kleine letters. `NO_PROXY` / `no_proxy` kan `api.telegram.org` nog steeds omzeilen.
    - Als de door OpenClaw beheerde proxy via `OPENCLAW_PROXY_URL` is geconfigureerd voor een serviceomgeving en er geen standaard proxy-env aanwezig is, gebruikt Telegram die URL ook voor Bot API-transport.
    - Routeer Telegram API-aanroepen op VPS-hosts met instabiele directe egress/TLS via `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ gebruikt standaard `autoSelectFamily=true` (behalve WSL2). De resultaatvolgorde van Telegram-DNS respecteert `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, daarna `channels.telegram.network.dnsResultOrder`, daarna de processtandaard zoals `NODE_OPTIONS=--dns-result-order=ipv4first`; als niets van toepassing is, valt Node 22+ terug op `ipv4first`.
    - Als je host WSL2 is of expliciet beter werkt met alleen-IPv4-gedrag, dwing dan familieselectie af:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Antwoorden uit het RFC 2544-benchmarkbereik (`198.18.0.0/15`) zijn
      standaard al toegestaan voor Telegram-mediadownloads. Als een vertrouwde
      fake-IP- of transparante proxy `api.telegram.org` tijdens mediadownloads
      herschrijft naar een ander prive-/intern/speciaal adres, kun je kiezen
      voor de alleen-voor-Telegram-bypass:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Dezelfde opt-in is per account beschikbaar op
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Als je proxy Telegram-mediahosts omzet naar `198.18.x.x`, laat dan eerst de
      gevaarlijke vlag uit. Telegram-media staat het RFC 2544-benchmarkbereik
      standaard al toe.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` verzwakt de
      SSRF-bescherming voor Telegram-media. Gebruik dit alleen voor vertrouwde,
      door operators beheerde proxyomgevingen zoals fake-IP-routering met Clash,
      Mihomo of Surge wanneer ze prive- of speciale antwoorden buiten het RFC
      2544-benchmarkbereik synthetiseren. Laat dit uit voor normale openbare
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

<Accordion title="Telegram-velden met hoge signaalwaarde">

- opstarten/authenticatie: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` moet naar een regulier bestand wijzen; symlinks worden geweigerd)
- toegangscontrole: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, top-level `bindings[]` (`type: "acp"`)
- exec-goedkeuringen: `execApprovals`, `accounts.*.execApprovals`
- opdracht/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- threads/antwoorden: `replyToMode`, `dm.threadReplies`, `direct.*.threadReplies`
- streaming: `streaming` (preview), `streaming.preview.toolProgress`, `blockStreaming`
- opmaak/levering: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- media/netwerk: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- aangepaste API-root: `apiRoot` (alleen Bot API-root; neem `/bot<TOKEN>` niet op)
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- acties/mogelijkheden: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reacties: `reactionNotifications`, `reactionLevel`
- fouten: `errorPolicy`, `errorCooldownMs`
- schrijfbewerkingen/geschiedenis: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Multi-account-voorrang: wanneer twee of meer account-ID's zijn geconfigureerd, stel dan `channels.telegram.defaultAccount` in (of neem `channels.telegram.accounts.default` op) om standaardroutering expliciet te maken. Anders valt OpenClaw terug op de eerste genormaliseerde account-ID en waarschuwt `openclaw doctor`. Benoemde accounts erven waarden van `channels.telegram.allowFrom` / `groupAllowFrom`, maar niet van `accounts.default.*`.
</Note>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Koppelen" icon="link" href="/nl/channels/pairing">
    Koppel een Telegram-gebruiker aan de Gateway.
  </Card>
  <Card title="Groepen" icon="users" href="/nl/channels/groups">
    Gedrag voor allowlists van groepen en onderwerpen.
  </Card>
  <Card title="Kanaalroutering" icon="route" href="/nl/channels/channel-routing">
    Routeer binnenkomende berichten naar agenten.
  </Card>
  <Card title="Beveiliging" icon="shield" href="/nl/gateway/security">
    Dreigingsmodel en hardening.
  </Card>
  <Card title="Multi-agent-routering" icon="sitemap" href="/nl/concepts/multi-agent">
    Wijs groepen en onderwerpen toe aan agenten.
  </Card>
  <Card title="Probleemoplossing" icon="wrench" href="/nl/channels/troubleshooting">
    Diagnostiek voor meerdere kanalen.
  </Card>
</CardGroup>
