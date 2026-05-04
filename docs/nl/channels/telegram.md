---
read_when:
    - Werken aan Telegram-functies of webhooks
summary: Ondersteuningsstatus, mogelijkheden en configuratie voor Telegram-bots
title: Telegram
x-i18n:
    generated_at: "2026-05-04T09:36:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5711d53cf908a14024bc5a94f7d590bb4bcb6963a1d78049d7782871f4eae932
    source_path: channels/telegram.md
    workflow: 16
---

Klaar voor productie voor bot-DM's en groepen via grammY. Lange polling is de standaardmodus; Webhook-modus is optioneel.

<CardGroup cols={3}>
  <Card title="Koppeling" icon="link" href="/nl/channels/pairing">
    Het standaard DM-beleid voor Telegram is koppeling.
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
    Open Telegram en chat met **@BotFather** (controleer of de handle exact `@BotFather` is).

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

    Env-terugval: `TELEGRAM_BOT_TOKEN=...` (alleen standaardaccount).
    Telegram gebruikt **niet** `openclaw channels login telegram`; configureer het token in config/env en start daarna de Gateway.

  </Step>

  <Step title="Start de Gateway en keur de eerste DM goed">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Koppelingscodes verlopen na 1 uur.

  </Step>

  <Step title="Voeg de bot toe aan een groep">
    Voeg de bot toe aan je groep en stel daarna `channels.telegram.groups` en `groupPolicy` in volgens je toegangsmodel.
  </Step>
</Steps>

<Note>
De volgorde voor tokenresolutie is accountbewust. In de praktijk hebben configwaarden voorrang op env-terugval, en `TELEGRAM_BOT_TOKEN` geldt alleen voor het standaardaccount.
</Note>

## Instellingen aan Telegram-zijde

<AccordionGroup>
  <Accordion title="Privacymodus en groepszichtbaarheid">
    Telegram-bots gebruiken standaard **Privacy Mode**, wat beperkt welke groepsberichten ze ontvangen.

    Als de bot alle groepsberichten moet zien, doe dan een van beide:

    - schakel privacymodus uit via `/setprivacy`, of
    - maak de bot groepsbeheerder.

    Verwijder de bot bij het omschakelen van privacymodus uit elke groep en voeg hem opnieuw toe, zodat Telegram de wijziging toepast.

  </Accordion>

  <Accordion title="Groepsmachtigingen">
    Beheerdersstatus wordt beheerd in de Telegram-groepsinstellingen.

    Beheerdersbots ontvangen alle groepsberichten, wat nuttig is voor altijd-actief groepsgedrag.

  </Accordion>

  <Accordion title="Handige BotFather-schakelaars">

    - `/setjoingroups` om toevoegen aan groepen toe te staan of te weigeren
    - `/setprivacy` voor gedrag rond groepszichtbaarheid

  </Accordion>
</AccordionGroup>

## Toegangscontrole en activering

<Tabs>
  <Tab title="DM-beleid">
    `channels.telegram.dmPolicy` beheert toegang via directe berichten:

    - `pairing` (standaard)
    - `allowlist` (vereist ten minste één afzender-ID in `allowFrom`)
    - `open` (vereist dat `allowFrom` `"*"` bevat)
    - `disabled`

    `dmPolicy: "open"` met `allowFrom: ["*"]` laat elk Telegram-account dat de botgebruikersnaam vindt of raadt opdrachten aan de bot geven. Gebruik dit alleen voor bewust openbare bots met strikt beperkte tools; bots met één eigenaar moeten `allowlist` gebruiken met numerieke gebruikers-ID's.

    `channels.telegram.allowFrom` accepteert numerieke Telegram-gebruikers-ID's. Voorvoegsels `telegram:` / `tg:` worden geaccepteerd en genormaliseerd.
    In configuraties met meerdere accounts wordt een beperkende `channels.telegram.allowFrom` op topniveau behandeld als een veiligheidsgrens: accountniveau-items `allowFrom: ["*"]` maken dat account niet openbaar, tenzij de effectieve account-toelatingslijst na samenvoegen nog steeds een expliciete wildcard bevat.
    `dmPolicy: "allowlist"` met lege `allowFrom` blokkeert alle DM's en wordt afgewezen door configuratievalidatie.
    De installatie vraagt alleen om numerieke gebruikers-ID's.
    Als je hebt geüpgraded en je configuratie `@username`-items in de toelatingslijst bevat, voer dan `openclaw doctor --fix` uit om ze op te lossen (beste poging; vereist een Telegram-bottoken).
    Als je eerder vertrouwde op pairing-store-toelatingslijstbestanden, kan `openclaw doctor --fix` items herstellen naar `channels.telegram.allowFrom` in toelatingslijststromen (bijvoorbeeld wanneer `dmPolicy: "allowlist"` nog geen expliciete ID's heeft).

    Voor bots met één eigenaar gebruik je bij voorkeur `dmPolicy: "allowlist"` met expliciete numerieke `allowFrom`-ID's, zodat het toegangsbeleid duurzaam in de configuratie staat (in plaats van afhankelijk te zijn van eerdere koppelingsgoedkeuringen).

    Veelvoorkomende verwarring: DM-koppelingsgoedkeuring betekent niet "deze afzender is overal geautoriseerd".
    Koppeling verleent DM-toegang. Als er nog geen opdrachteigenaar bestaat, stelt de eerste goedgekeurde koppeling ook `commands.ownerAllowFrom` in, zodat eigenaargebonden opdrachten en exec-goedkeuringen een expliciet operatoraccount hebben.
    Autorisatie van groepsafzenders komt nog steeds uit expliciete configuratie-toelatingslijsten.
    Als je wilt "ik ben één keer geautoriseerd en zowel DM's als groepsopdrachten werken", zet dan je numerieke Telegram-gebruikers-ID in `channels.telegram.allowFrom`; zorg er voor eigenaargebonden opdrachten voor dat `commands.ownerAllowFrom` `telegram:<your user id>` bevat.

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

  <Tab title="Groepsbeleid en toelatingslijsten">
    Twee controles gelden samen:

    1. **Welke groepen zijn toegestaan** (`channels.telegram.groups`)
       - geen `groups`-configuratie:
         - met `groupPolicy: "open"`: elke groep kan groeps-ID-controles doorstaan
         - met `groupPolicy: "allowlist"` (standaard): groepen worden geblokkeerd totdat je `groups`-items toevoegt (of `"*"`)
       - `groups` geconfigureerd: werkt als toelatingslijst (expliciete ID's of `"*"`)

    2. **Welke afzenders zijn toegestaan in groepen** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (standaard)
       - `disabled`

    `groupAllowFrom` wordt gebruikt voor filtering van groepsafzenders. Als dit niet is ingesteld, valt Telegram terug op `allowFrom`.
    `groupAllowFrom`-items moeten numerieke Telegram-gebruikers-ID's zijn (`telegram:` / `tg:`-voorvoegsels worden genormaliseerd).
    Zet geen Telegram-groeps- of supergroepchat-ID's in `groupAllowFrom`. Negatieve chat-ID's horen onder `channels.telegram.groups`.
    Niet-numerieke items worden genegeerd voor afzenderautorisatie.
    Veiligheidsgrens (`2026.2.25+`): groepsafzenderauthenticatie erft **geen** DM-pairing-store-goedkeuringen.
    Koppeling blijft alleen voor DM. Stel voor groepen `groupAllowFrom` of `allowFrom` per groep/per onderwerp in.
    Als `groupAllowFrom` niet is ingesteld, valt Telegram terug op config `allowFrom`, niet op de pairing store.
    Praktisch patroon voor bots met één eigenaar: stel je gebruikers-ID in `channels.telegram.allowFrom` in, laat `groupAllowFrom` leeg en sta de doelgroepen toe onder `channels.telegram.groups`.
    Runtime-opmerking: als `channels.telegram` volledig ontbreekt, gebruikt de runtime standaard fail-closed `groupPolicy="allowlist"`, tenzij `channels.defaults.groupPolicy` expliciet is ingesteld.

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
      Veelvoorkomende fout: `groupAllowFrom` is geen Telegram-groepstoelatingslijst.

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

    Opdrachtschakelaars op sessieniveau:

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

    De groepschat-ID ophalen:

    - stuur een groepsbericht door naar `@userinfobot` / `@getidsbot`
    - of lees `chat.id` uit `openclaw logs --follow`
    - of inspecteer Bot API `getUpdates`

  </Tab>
</Tabs>

## Runtimegedrag

- Telegram is eigendom van het Gateway-proces.
- Routering is deterministisch: inkomende Telegram-berichten beantwoorden terug naar Telegram (het model kiest geen kanalen).
- Inkomende berichten worden genormaliseerd naar de gedeelde kanaalenvelop met antwoordmetadata en mediaplaceholders.
- Groepssessies worden geïsoleerd op groeps-ID. Forumonderwerpen voegen `:topic:<threadId>` toe om onderwerpen geïsoleerd te houden.
- DM-berichten kunnen `message_thread_id` bevatten; OpenClaw behoudt de thread-ID voor antwoorden maar houdt DM's standaard op de platte sessie. Configureer `channels.telegram.dm.threadReplies: "inbound"`, `channels.telegram.direct.<chatId>.threadReplies: "inbound"`, `requireTopic: true` of een overeenkomende onderwerpconfiguratie wanneer je bewust DM-onderwerpsessie-isolatie wilt.
- Lange polling gebruikt grammY runner met volgordebepaling per chat/per thread. De algemene runner-sink-concurrency gebruikt `agents.defaults.maxConcurrent`.
- Lange polling wordt binnen elk Gateway-proces beschermd, zodat slechts één actieve poller tegelijk een bottoken kan gebruiken. Als je nog steeds `getUpdates` 409-conflicten ziet, gebruikt waarschijnlijk een andere OpenClaw Gateway, een script of een externe poller hetzelfde token.
- Watchdog-herstarts voor lange polling worden standaard geactiveerd na 120 seconden zonder voltooide `getUpdates`-liveness. Verhoog `channels.telegram.pollingStallThresholdMs` alleen als je deployment nog steeds onterechte polling-stall-herstarts ziet tijdens langlopende werkzaamheden. De waarde is in milliseconden en is toegestaan van `30000` tot `600000`; overrides per account worden ondersteund.
- Telegram Bot API heeft geen ondersteuning voor leesbevestigingen (`sendReadReceipts` is niet van toepassing).

## Functiereferentie

<AccordionGroup>
  <Accordion title="Livestreamvoorbeeld (berichtbewerkingen)">
    OpenClaw kan gedeeltelijke antwoorden in realtime streamen:

    - directe chats: voorbeeldbericht + `editMessageText`
    - groepen/onderwerpen: voorbeeldbericht + `editMessageText`

    Vereiste:

    - `channels.telegram.streaming` is `off | partial | block | progress` (standaard: `partial`)
    - `progress` houdt één bewerkbare statusconceptversie bij en werkt die bij met toolvoortgang tot de uiteindelijke aflevering
    - `streaming.preview.toolProgress` bepaalt of tool-/voortgangsupdates hetzelfde bewerkte voorbeeldbericht hergebruiken (standaard: `true` wanneer voorbeeldstreaming actief is)
    - `streaming.preview.commandText` bepaalt opdracht-/exec-details binnen die toolvoortgangsregels: `raw` (standaard, behoudt uitgebracht gedrag) of `status` (alleen toollabel)
    - verouderde `channels.telegram.streamMode`- en booleaanse `streaming`-waarden worden gedetecteerd; voer `openclaw doctor --fix` uit om ze te migreren naar `channels.telegram.streaming.mode`

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

    Plaats voor de voortgangsconceptmodus hetzelfde beleid voor opdrachttekst onder `streaming.progress`:

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

    Gebruik `streaming.mode: "off"` alleen wanneer je uitsluitend eindbezorging wilt: Telegram-previewbewerkingen zijn uitgeschakeld en generieke tool-/voortgangsberichten worden onderdrukt in plaats van als zelfstandige statusberichten te worden verzonden. Goedkeuringsprompts, mediapayloads en fouten blijven via de normale eindbezorging lopen. Gebruik `streaming.preview.toolProgress: false` wanneer je alleen antwoordpreviewbewerkingen wilt behouden terwijl je de statusregels voor toolvoortgang verbergt.

    <Note>
      Geselecteerde citaatantwoorden in Telegram vormen de uitzondering. Wanneer `replyToMode` `"first"`, `"all"` of `"batched"` is en het inkomende bericht geselecteerde citaattekst bevat, verzendt OpenClaw het definitieve antwoord via Telegram's native citaatantwoordpad in plaats van de antwoordpreview te bewerken, waardoor `streaming.preview.toolProgress` de korte statusregels voor die beurt niet kan tonen. Antwoorden op het huidige bericht zonder geselecteerde citaattekst behouden nog steeds previewstreaming. Stel `replyToMode: "off"` in wanneer zichtbaarheid van toolvoortgang belangrijker is dan native citaatantwoorden, of stel `streaming.preview.toolProgress: false` in om de afweging te accepteren.
    </Note>

    Voor antwoorden met alleen tekst:

    - korte DM-/groep-/topicpreviews: OpenClaw behoudt hetzelfde previewbericht en voert een definitieve bewerking ter plaatse uit, tenzij er een zichtbaar niet-previewbericht is verzonden nadat de preview verscheen
    - previews gevolgd door zichtbare niet-previewuitvoer: OpenClaw verzendt het voltooide antwoord als een nieuw definitief bericht en ruimt de oudere preview op, zodat het definitieve antwoord na de tussenuitvoer verschijnt
    - previews ouder dan ongeveer een minuut: OpenClaw verzendt het voltooide antwoord als een nieuw definitief bericht en ruimt daarna de preview op, zodat de zichtbare tijdstempel van Telegram de voltooiingstijd weerspiegelt in plaats van de aanmaaktijd van de preview

    Voor complexe antwoorden (bijvoorbeeld mediapayloads) valt OpenClaw terug op normale eindbezorging en ruimt daarna het previewbericht op.

    Previewstreaming staat los van blokstreaming. Wanneer blokstreaming expliciet is ingeschakeld voor Telegram, slaat OpenClaw de previewstream over om dubbel streamen te voorkomen.

    Redeneerstream alleen voor Telegram:

    - `/reasoning stream` verzendt redenering naar de livepreview tijdens het genereren
    - de redeneerpreview wordt verwijderd na de eindbezorging; gebruik `/reasoning on` wanneer redenering zichtbaar moet blijven
    - het definitieve antwoord wordt zonder redeneertekst verzonden

  </Accordion>

  <Accordion title="Opmaak en HTML-terugval">
    Uitgaande tekst gebruikt Telegram `parse_mode: "HTML"`.

    - Markdown-achtige tekst wordt gerenderd naar Telegram-veilige HTML.
    - Ruwe model-HTML wordt geëscapet om Telegram-parsefouten te verminderen.
    - Als Telegram geparsede HTML weigert, probeert OpenClaw het opnieuw als platte tekst.

    Linkpreviews zijn standaard ingeschakeld en kunnen worden uitgeschakeld met `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Native opdrachten en aangepaste opdrachten">
    Registratie van het Telegram-opdrachtmenu wordt bij het opstarten afgehandeld met `setMyCommands`.

    Standaardwaarden voor native opdrachten:

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

    - namen worden genormaliseerd (voorloop-`/` verwijderen, kleine letters)
    - geldig patroon: `a-z`, `0-9`, `_`, lengte `1..32`
    - aangepaste opdrachten kunnen native opdrachten niet overschrijven
    - conflicten/duplicaten worden overgeslagen en gelogd

    Opmerkingen:

    - aangepaste opdrachten zijn alleen menu-items; ze implementeren geen gedrag automatisch
    - Plugin-/skillopdrachten kunnen nog steeds werken wanneer ze worden getypt, zelfs als ze niet in het Telegram-menu worden weergegeven

    Als native opdrachten zijn uitgeschakeld, worden ingebouwde opdrachten verwijderd. Aangepaste/Plugin-opdrachten kunnen nog steeds worden geregistreerd als ze zijn geconfigureerd.

    Veelvoorkomende installatiefouten:

    - `setMyCommands failed` met `BOT_COMMANDS_TOO_MUCH` betekent dat het Telegram-menu na inkorten nog steeds te vol was; verminder Plugin-/skill-/aangepaste opdrachten of schakel `channels.telegram.commands.native` uit.
    - `deleteWebhook`, `deleteMyCommands` of `setMyCommands` die faalt met `404: Not Found` terwijl directe Bot API-curlopdrachten werken, kan betekenen dat `channels.telegram.apiRoot` was ingesteld op het volledige `/bot<TOKEN>`-eindpunt. `apiRoot` mag alleen de Bot API-root zijn, en `openclaw doctor --fix` verwijdert een per ongeluk toegevoegde afsluitende `/bot<TOKEN>`.
    - `getMe returned 401` betekent dat Telegram het geconfigureerde bottoken heeft geweigerd. Werk `botToken`, `tokenFile` of `TELEGRAM_BOT_TOKEN` bij met het huidige BotFather-token; OpenClaw stopt vóór het pollen, dus dit wordt niet gerapporteerd als een Webhook-opruimfout.
    - `setMyCommands failed` met netwerk-/fetchfouten betekent meestal dat uitgaande DNS/HTTPS naar `api.telegram.org` is geblokkeerd.

    ### Apparaatkoppelingsopdrachten (`device-pair` Plugin)

    Wanneer de `device-pair` Plugin is geïnstalleerd:

    1. `/pair` genereert installatiecode
    2. plak code in de iOS-app
    3. `/pair pending` toont openstaande verzoeken (inclusief rol/scopes)
    4. keur het verzoek goed:
       - `/pair approve <requestId>` voor expliciete goedkeuring
       - `/pair approve` wanneer er slechts één openstaand verzoek is
       - `/pair approve latest` voor het meest recente

    De installatiecode bevat een kortlevend bootstrap-token. Ingebouwde bootstrap-overdracht houdt het primaire nodetoken op `scopes: []`; elk overgedragen operatortoken blijft begrensd tot `operator.approvals`, `operator.read`, `operator.talk.secrets` en `operator.write`. Bootstrap-scopecontroles hebben een rolprefix, dus die operator-allowlist voldoet alleen aan operatorverzoeken; niet-operatorrollen hebben nog steeds scopes nodig onder hun eigen rolprefix.

    Als een apparaat het opnieuw probeert met gewijzigde authgegevens (bijvoorbeeld rol/scopes/publieke sleutel), wordt het vorige openstaande verzoek vervangen en gebruikt het nieuwe verzoek een andere `requestId`. Voer `/pair pending` opnieuw uit voordat je goedkeurt.

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

    Poortwachtercontroles:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (standaard: uitgeschakeld)

    Opmerking: `edit` en `topic-create` zijn momenteel standaard ingeschakeld en hebben geen afzonderlijke `channels.telegram.actions.*`-schakelaars.
    Runtimeverzending gebruikt de actieve config-/secretssnapshot (opstarten/herladen), dus actiepaden voeren geen ad-hoc SecretRef-herresolutie per verzending uit.

    Semantiek voor reactieverwijdering: [/tools/reactions](/nl/tools/reactions)

  </Accordion>

  <Accordion title="Antwoordthreading-tags">
    Telegram ondersteunt expliciete antwoordthreading-tags in gegenereerde uitvoer:

    - `[[reply_to_current]]` antwoordt op het activerende bericht
    - `[[reply_to:<id>]]` antwoordt op een specifiek Telegram-bericht-ID

    `channels.telegram.replyToMode` regelt de afhandeling:

    - `off` (standaard)
    - `first`
    - `all`

    Wanneer antwoordthreading is ingeschakeld en de oorspronkelijke Telegram-tekst of het bijschrift beschikbaar is, voegt OpenClaw automatisch een native Telegram-citaatexcerpt toe. Telegram beperkt native citaattekst tot 1024 UTF-16-code-eenheden, dus langere berichten worden vanaf het begin geciteerd en vallen terug op een gewoon antwoord als Telegram het citaat weigert.

    Opmerking: `off` schakelt impliciete antwoordthreading uit. Expliciete `[[reply_to_*]]`-tags worden nog steeds gerespecteerd.

  </Accordion>

  <Accordion title="Forumtopics en threadgedrag">
    Forumsupergroepen:

    - topicsessiesleutels voegen `:topic:<threadId>` toe
    - antwoorden en typen richten zich op de topicthread
    - topicconfiguratiepad:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Speciaal geval voor algemeen topic (`threadId=1`):

    - berichtverzendingen laten `message_thread_id` weg (Telegram weigert `sendMessage(...thread_id=1)`)
    - typeacties bevatten nog steeds `message_thread_id`

    Topicovererving: topicitems erven groepsinstellingen tenzij overschreven (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
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

    Elk topic heeft daarna zijn eigen sessiesleutel: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Persistente ACP-topicbinding**: Forumtopics kunnen ACP-harnesssessies vastzetten via typed ACP-bindingen op topniveau (`bindings[]` met `type: "acp"` en `match.channel: "telegram"`, `peer.kind: "group"`, en een topicgekwalificeerde id zoals `-1001234567890:topic:42`). Momenteel beperkt tot forumtopics in groepen/supergroepen. Zie [ACP Agents](/nl/tools/acp-agents).

    **Threadgebonden ACP-spawn vanuit chat**: `/acp spawn <agent> --thread here|auto` bindt het huidige topic aan een nieuwe ACP-sessie; vervolgberichten worden daar direct heen gerouteerd. OpenClaw zet de spawnbevestiging vast in het topic. Vereist dat `channels.telegram.threadBindings.spawnSessions` ingeschakeld blijft (standaard: `true`).

    Templatecontext stelt `MessageThreadId` en `IsForum` beschikbaar. DM-chats met `message_thread_id` behouden standaard DM-routering en antwoordmetadata op vlakke sessies; ze gebruiken alleen thread-bewuste sessiesleutels wanneer ze zijn geconfigureerd met `threadReplies: "inbound"`, `threadReplies: "always"`, `requireTopic: true`, of een overeenkomende onderwerpconfiguratie. Gebruik `channels.telegram.dm.threadReplies` op het hoogste niveau voor de accountstandaard, of `direct.<chatId>.threadReplies` voor één DM.

  </Accordion>

  <Accordion title="Audio, video, and stickers">
    ### Audioberichten

    Telegram maakt onderscheid tussen spraaknotities en audiobestanden.

    - standaard: gedrag voor audiobestanden
    - tag `[[audio_as_voice]]` in agentantwoord om verzenden als spraaknotitie af te dwingen
    - inkomende transcripties van spraaknotities worden in de agentcontext ingekaderd als machinaal gegenereerde,
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

    Afhandeling van inkomende stickers:

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

    Stickers worden één keer beschreven (waar mogelijk) en gecachet om herhaalde vision-aanroepen te verminderen.

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
    Telegram-reacties komen binnen als `message_reaction`-updates (los van berichtpayloads).

    Wanneer ingeschakeld, zet OpenClaw systeemgebeurtenissen in de wachtrij zoals:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Configuratie:

    - `channels.telegram.reactionNotifications`: `off | own | all` (standaard: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (standaard: `minimal`)

    Opmerkingen:

    - `own` betekent alleen gebruikersreacties op door de bot verzonden berichten (best-effort via cache van verzonden berichten).
    - Reactiegebeurtenissen respecteren nog steeds Telegram-toegangscontroles (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); onbevoegde afzenders worden genegeerd.
    - Telegram levert geen thread-ID's in reactie-updates.
      - niet-forumgroepen routeren naar de groepschatsessie
      - forumgroepen routeren naar de algemene-onderwerpsessie van de groep (`:topic:1`), niet naar het exacte oorspronkelijke onderwerp

    `allowed_updates` voor polling/webhook bevat automatisch `message_reaction`.

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction` verzendt een bevestigingsemoji terwijl OpenClaw een inkomend bericht verwerkt.

    Resolutievolgorde:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - fallback naar agentidentiteitsemoji (`agents.list[].identity.emoji`, anders "👀")

    Opmerkingen:

    - Telegram verwacht unicode-emoji (bijvoorbeeld "👀").
    - Gebruik `""` om de reactie voor een kanaal of account uit te schakelen.

  </Accordion>

  <Accordion title="Config writes from Telegram events and commands">
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

  <Accordion title="Long polling vs webhook">
    Standaard is long polling. Stel voor webhookmodus `channels.telegram.webhookUrl` en `channels.telegram.webhookSecret` in; optioneel `webhookPath`, `webhookHost`, `webhookPort` (standaarden `/telegram-webhook`, `127.0.0.1`, `8787`).

    De lokale listener bindt aan `127.0.0.1:8787`. Zet voor publieke ingress een reverse proxy vóór de lokale poort of stel bewust `webhookHost: "0.0.0.0"` in.

    Webhookmodus valideert request-guards, het geheime token van Telegram en de JSON-body voordat `200` aan Telegram wordt geretourneerd.
    OpenClaw verwerkt de update vervolgens asynchroon via dezelfde botlanes per chat/per onderwerp die door long polling worden gebruikt, zodat trage agentbeurten de afleverings-ACK van Telegram niet vasthouden.

  </Accordion>

  <Accordion title="Limits, retry, and CLI targets">
    - `channels.telegram.textChunkLimit` is standaard 4000.
    - `channels.telegram.chunkMode="newline"` geeft de voorkeur aan alineagrenzen (lege regels) vóór splitsen op lengte.
    - `channels.telegram.mediaMaxMb` (standaard 100) begrenst de grootte van inkomende en uitgaande Telegram-media.
    - `channels.telegram.mediaGroupFlushMs` (standaard 500) bepaalt hoelang Telegram-albums/mediagroepen worden gebufferd voordat OpenClaw ze als één inkomend bericht verzendt. Verhoog dit als albumdelen laat aankomen; verlaag dit om de antwoordlatentie voor albums te verminderen.
    - `channels.telegram.timeoutSeconds` overschrijft de time-out van de Telegram API-client (als dit niet is ingesteld, geldt de grammY-standaard). Botclients klemmen geconfigureerde waarden onder de 60-secondenrequestguard voor uitgaande tekst/typen, zodat grammY zichtbare antwoordlevering niet afbreekt voordat de transportguard en fallback van OpenClaw kunnen draaien. Long polling gebruikt nog steeds een 45-secondenrequestguard voor `getUpdates`, zodat idle polls niet onbeperkt worden achtergelaten.
    - `channels.telegram.pollingStallThresholdMs` is standaard `120000`; stem alleen af tussen `30000` en `600000` voor fout-positieve herstarts bij polling-stalls.
    - groepscontexthistorie gebruikt `channels.telegram.historyLimit` of `messages.groupChat.historyLimit` (standaard 50); `0` schakelt dit uit.
    - aanvullende context voor antwoord/citaat/doorsturen wordt momenteel doorgegeven zoals ontvangen.
    - Telegram-allowlists begrenzen vooral wie de agent kan activeren, niet een volledige redactieboundary voor aanvullende context.
    - Besturing voor DM-historie:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry`-configuratie is van toepassing op Telegram-verzendhelpers (CLI/tools/acties) voor herstelbare uitgaande API-fouten. Inkomende levering van eindantwoorden gebruikt ook een begrensde safe-send-retry voor Telegram-preconnectfouten, maar probeert geen ambigue netwerk-enveloppen na verzending opnieuw die zichtbare berichten zouden kunnen dupliceren.

    Verzenddoelen voor CLI en berichttool kunnen een numerieke chat-ID, gebruikersnaam of een forumonderwerpdoel zijn:

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

    Pollvlaggen alleen voor Telegram:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` voor forumonderwerpen (of gebruik een `:topic:`-doel)

    Telegram-verzenden ondersteunt ook:

    - `--presentation` met `buttons`-blokken voor inline toetsenborden wanneer `channels.telegram.capabilities.inlineButtons` dit toestaat
    - `--pin` of `--delivery '{"pin":true}'` om gepinde levering aan te vragen wanneer de bot in die chat kan pinnen
    - `--force-document` om uitgaande afbeeldingen en GIF's als documenten te verzenden in plaats van als gecomprimeerde foto- of animated-media-uploads

    Actiegating:

    - `channels.telegram.actions.sendMessage=false` schakelt uitgaande Telegram-berichten uit, inclusief polls
    - `channels.telegram.actions.poll=false` schakelt het maken van Telegram-polls uit terwijl gewone verzendacties ingeschakeld blijven

  </Accordion>

  <Accordion title="Exec approvals in Telegram">
    Telegram ondersteunt exec-goedkeuringen in approver-DM's en kan optioneel prompts plaatsen in de oorspronkelijke chat of het oorspronkelijke onderwerp. Approvers moeten numerieke Telegram-gebruikers-ID's zijn.

    Configuratiepad:

    - `channels.telegram.execApprovals.enabled` (wordt automatisch ingeschakeld wanneer ten minste één approver oplosbaar is)
    - `channels.telegram.execApprovals.approvers` (valt terug op numerieke eigenaar-ID's uit `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (standaard) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` en `defaultTo` bepalen wie met de bot kan praten en waar deze normale antwoorden naartoe stuurt. Ze maken iemand geen exec-approver. De eerste goedgekeurde DM-koppeling bootstrapt `commands.ownerAllowFrom` wanneer er nog geen opdrachteigenaar bestaat, zodat de één-eigenaarsetup nog steeds werkt zonder ID's te dupliceren onder `execApprovals.approvers`.

    Kanaallevering toont de opdrachttekst in de chat; schakel `channel` of `both` alleen in vertrouwde groepen/onderwerpen in. Wanneer de prompt in een forumonderwerp landt, behoudt OpenClaw het onderwerp voor de goedkeuringsprompt en de opvolging. Exec-goedkeuringen verlopen standaard na 30 minuten.

    Inline goedkeuringsknoppen vereisen ook dat `channels.telegram.capabilities.inlineButtons` het doeloppervlak toestaat (`dm`, `group` of `all`). Goedkeurings-ID's met het voorvoegsel `plugin:` worden via Plugin-goedkeuringen opgelost; andere worden eerst via exec-goedkeuringen opgelost.

    Zie [Exec-goedkeuringen](/nl/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Besturing voor foutantwoorden

Wanneer de agent een leverings- of providerfout tegenkomt, kan Telegram antwoorden met de fouttekst of deze onderdrukken. Twee configuratiesleutels sturen dit gedrag:

| Sleutel                             | Waarden           | Standaard | Beschrijving                                                                                          |
| ----------------------------------- | ----------------- | --------- | ----------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`   | `reply` stuurt een vriendelijke foutmelding naar de chat. `silent` onderdrukt foutantwoorden volledig. |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000`   | Minimale tijd tussen foutantwoorden aan dezelfde chat. Voorkomt foutspam tijdens storingen.            |

Overschrijvingen per account, per groep en per onderwerp worden ondersteund (dezelfde overerving als andere Telegram-configuratiesleutels).

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

## Problemen oplossen

<AccordionGroup>
  <Accordion title="Bot does not respond to non mention group messages">

    - Als `requireMention=false`, moet de privacymodus van Telegram volledige zichtbaarheid toestaan.
      - BotFather: `/setprivacy` -> Uitschakelen
      - verwijder de bot daarna uit de groep en voeg deze opnieuw toe
    - `openclaw channels status` waarschuwt wanneer de configuratie niet-vermelde groepsberichten verwacht.
    - `openclaw channels status --probe` kan expliciete numerieke groeps-ID's controleren; wildcard `"*"` kan niet op lidmaatschap worden gecontroleerd.
    - snelle sessietest: `/activation always`.

  </Accordion>

  <Accordion title="Bot ziet helemaal geen groepsberichten">

    - wanneer `channels.telegram.groups` bestaat, moet de groep worden vermeld (of `"*"` bevatten)
    - controleer het botlidmaatschap in de groep
    - bekijk logs: `openclaw logs --follow` voor redenen om over te slaan

  </Accordion>

  <Accordion title="Commando's werken gedeeltelijk of helemaal niet">

    - autoriseer je afzenderidentiteit (koppeling en/of numerieke `allowFrom`)
    - commando-autorisatie blijft gelden, zelfs wanneer groepsbeleid `open` is
    - `setMyCommands failed` met `BOT_COMMANDS_TOO_MUCH` betekent dat het native menu te veel vermeldingen heeft; verminder Plugin-/Skills-/aangepaste commando's of schakel native menu's uit
    - opstartaanroepen van `deleteMyCommands` / `setMyCommands` en typeaanroepen van `sendChatAction` zijn begrensd en proberen eenmaal opnieuw via Telegram's transportfallback bij een time-out van het verzoek. Aanhoudende netwerk-/fetchfouten wijzen meestal op DNS-/HTTPS-bereikbaarheidsproblemen naar `api.telegram.org`

  </Accordion>

  <Accordion title="Opstarten meldt ongeautoriseerd token">

    - `getMe returned 401` is een Telegram-authenticatiefout voor het geconfigureerde bottoken.
    - Kopieer het bottoken opnieuw of genereer het opnieuw in BotFather, en werk daarna `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` of `TELEGRAM_BOT_TOKEN` bij voor het standaardaccount.
    - `deleteWebhook 401 Unauthorized` tijdens het opstarten is ook een authenticatiefout; dit behandelen als "er bestaat geen webhook" zou dezelfde fout door een ongeldig token alleen uitstellen tot latere API-aanroepen.

  </Accordion>

  <Accordion title="Polling- of netwerkinstabiliteit">

    - Node 22+ + aangepaste fetch/proxy kan onmiddellijk afbreekgedrag activeren als AbortSignal-typen niet overeenkomen.
    - Sommige hosts lossen `api.telegram.org` eerst op naar IPv6; defecte IPv6-egress kan intermitterende Telegram API-fouten veroorzaken.
    - Als logs `TypeError: fetch failed` of `Network request for 'getUpdates' failed!` bevatten, probeert OpenClaw deze nu opnieuw als herstelbare netwerkfouten.
    - Tijdens het opstarten van polling hergebruikt OpenClaw de succesvolle opstartprobe `getMe` voor grammY, zodat de runner geen tweede `getMe` nodig heeft vóór de eerste `getUpdates`.
    - Als `deleteWebhook` mislukt met een tijdelijke netwerkfout tijdens het opstarten van polling, gaat OpenClaw door met long polling in plaats van nog een pre-poll control-plane-aanroep te doen. Een nog actieve Webhook verschijnt als een `getUpdates`-conflict; OpenClaw bouwt daarna het Telegram-transport opnieuw op en probeert Webhook-opruiming opnieuw.
    - Als Telegram-sockets volgens een korte vaste cadans worden gerecycled, controleer dan op een lage `channels.telegram.timeoutSeconds`; botclients klemmen geconfigureerde waarden onder de uitgaande en `getUpdates`-request guards af, maar oudere releases konden elke poll of reactie afbreken wanneer dit onder die guards was ingesteld.
    - Als logs `Polling stall detected` bevatten, herstart OpenClaw polling en bouwt het Telegram-transport opnieuw op na standaard 120 seconden zonder voltooide long-poll-liveness.
    - `openclaw channels status --probe` en `openclaw doctor` waarschuwen wanneer een actief pollingaccount na de opstartgratie geen `getUpdates` heeft voltooid, wanneer een actief Webhook-account na de opstartgratie geen `setWebhook` heeft voltooid, of wanneer de laatste succesvolle pollingtransportactiviteit verouderd is.
    - Verhoog `channels.telegram.pollingStallThresholdMs` alleen wanneer langdurige `getUpdates`-aanroepen gezond zijn maar je host nog steeds valse polling-stall-herstarts meldt. Aanhoudende stalls wijzen meestal op proxy-, DNS-, IPv6- of TLS-egressproblemen tussen de host en `api.telegram.org`.
    - Telegram respecteert ook procesproxy-env voor Bot API-transport, inclusief `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` en hun varianten in kleine letters. `NO_PROXY` / `no_proxy` kan `api.telegram.org` nog steeds omzeilen.
    - Als de door OpenClaw beheerde proxy via `OPENCLAW_PROXY_URL` is geconfigureerd voor een serviceomgeving en er geen standaard proxy-env aanwezig is, gebruikt Telegram die URL ook voor Bot API-transport.
    - Routeer op VPS-hosts met instabiele directe egress/TLS Telegram API-aanroepen via `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ gebruikt standaard `autoSelectFamily=true` (behalve WSL2). De volgorde van Telegram DNS-resultaten respecteert eerst `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, daarna `channels.telegram.network.dnsResultOrder`, daarna de processtandaard zoals `NODE_OPTIONS=--dns-result-order=ipv4first`; als geen daarvan van toepassing is, valt Node 22+ terug op `ipv4first`.
    - Als je host WSL2 is of expliciet beter werkt met alleen-IPv4-gedrag, forceer dan familieselectie:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Antwoorden uit het RFC 2544-benchmarkbereik (`198.18.0.0/15`) zijn standaard al toegestaan
      voor Telegram-mediadownloads. Als een vertrouwde fake-IP- of
      transparante proxy `api.telegram.org` tijdens mediadownloads herschrijft naar een ander
      privé/intern/special-use-adres, kun je je aanmelden
      voor de alleen-Telegram-bypass:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Dezelfde opt-in is per account beschikbaar op
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Als je proxy Telegram-mediahosts omzet naar `198.18.x.x`, laat dan eerst de
      gevaarlijke vlag uit. Telegram-media staat het RFC 2544-
      benchmarkbereik standaard al toe.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` verzwakt de SSRF-bescherming
      voor Telegram-media. Gebruik dit alleen voor vertrouwde, door operators beheerde proxy-
      omgevingen zoals Clash, Mihomo of Surge fake-IP-routing wanneer zij
      privé- of special-use-antwoorden synthetiseren buiten het RFC 2544-benchmark-
      bereik. Laat dit uit voor normale openbare internettoegang tot Telegram.
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

<Accordion title="Belangrijke Telegram-velden">

- opstarten/auth: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` moet naar een normaal bestand wijzen; symlinks worden geweigerd)
- toegangscontrole: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, top-level `bindings[]` (`type: "acp"`)
- uitvoeringsgoedkeuringen: `execApprovals`, `accounts.*.execApprovals`
- commando/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- threads/reacties: `replyToMode`, `dm.threadReplies`, `direct.*.threadReplies`
- streaming: `streaming` (preview), `streaming.preview.toolProgress`, `blockStreaming`
- opmaak/bezorging: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- media/netwerk: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- aangepaste API-root: `apiRoot` (alleen Bot API-root; neem `/bot<TOKEN>` niet op)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- acties/capaciteiten: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reacties: `reactionNotifications`, `reactionLevel`
- fouten: `errorPolicy`, `errorCooldownMs`
- schrijfbewerkingen/geschiedenis: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Voorrang bij meerdere accounts: wanneer twee of meer account-ID's zijn geconfigureerd, stel `channels.telegram.defaultAccount` in (of neem `channels.telegram.accounts.default` op) om standaardroutering expliciet te maken. Anders valt OpenClaw terug op de eerste genormaliseerde account-ID en waarschuwt `openclaw doctor`. Benoemde accounts erven `channels.telegram.allowFrom` / `groupAllowFrom`, maar niet de waarden van `accounts.default.*`.
</Note>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Koppeling" icon="link" href="/nl/channels/pairing">
    Koppel een Telegram-gebruiker aan de Gateway.
  </Card>
  <Card title="Groepen" icon="users" href="/nl/channels/groups">
    Gedrag van allowlists voor groepen en onderwerpen.
  </Card>
  <Card title="Kanaalroutering" icon="route" href="/nl/channels/channel-routing">
    Routeer inkomende berichten naar agents.
  </Card>
  <Card title="Beveiliging" icon="shield" href="/nl/gateway/security">
    Dreigingsmodel en verharding.
  </Card>
  <Card title="Routering met meerdere agents" icon="sitemap" href="/nl/concepts/multi-agent">
    Wijs groepen en onderwerpen toe aan agents.
  </Card>
  <Card title="Probleemoplossing" icon="wrench" href="/nl/channels/troubleshooting">
    Diagnostiek voor meerdere kanalen.
  </Card>
</CardGroup>
