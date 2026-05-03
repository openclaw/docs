---
read_when:
    - Werken aan Telegram-functies of Webhooks
summary: Status, mogelijkheden en configuratie voor ondersteuning van Telegram-bots
title: Telegram
x-i18n:
    generated_at: "2026-05-03T21:27:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 528ace9dae29eda22f98cc1436ec16146eb9d83edc73aa6db1ab8283f4f873c0
    source_path: channels/telegram.md
    workflow: 16
---

Productieklaar voor bot-DM's en groepen via grammY. Long polling is de standaardmodus; Webhook-modus is optioneel.

<CardGroup cols={3}>
  <Card title="Koppelen" icon="link" href="/nl/channels/pairing">
    Het standaard-DM-beleid voor Telegram is koppelen.
  </Card>
  <Card title="Problemen met kanalen oplossen" icon="wrench" href="/nl/channels/troubleshooting">
    Cross-channel diagnostiek en herstelplaybooks.
  </Card>
  <Card title="Gateway-configuratie" icon="settings" href="/nl/gateway/configuration">
    Volledige kanaalconfiguratiepatronen en voorbeelden.
  </Card>
</CardGroup>

## Snelle installatie

<Steps>
  <Step title="Maak het bot-token aan in BotFather">
    Open Telegram en chat met **@BotFather** (bevestig dat de handle exact `@BotFather` is).

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
    Telegram gebruikt **niet** `openclaw channels login telegram`; configureer token in config/env en start daarna de Gateway.

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
    Voeg de bot toe aan je groep en stel daarna `channels.telegram.groups` en `groupPolicy` zo in dat ze overeenkomen met je toegangsmodel.
  </Step>
</Steps>

<Note>
De volgorde voor tokenresolutie is accountbewust. In de praktijk winnen configuratiewaarden van env-fallback, en `TELEGRAM_BOT_TOKEN` is alleen van toepassing op het standaardaccount.
</Note>

## Instellingen aan Telegram-zijde

<AccordionGroup>
  <Accordion title="Privacymodus en groepszichtbaarheid">
    Telegram-bots gebruiken standaard **Privacy Mode**, wat beperkt welke groepsberichten ze ontvangen.

    Als de bot alle groepsberichten moet zien, doe dan een van beide:

    - schakel privacymodus uit via `/setprivacy`, of
    - maak de bot groepsbeheerder.

    Wanneer je de privacymodus omschakelt, verwijder je de bot uit elke groep en voeg je hem opnieuw toe, zodat Telegram de wijziging toepast.

  </Accordion>

  <Accordion title="Groepsmachtigingen">
    Beheerdersstatus wordt beheerd in de groepsinstellingen van Telegram.

    Beheerdersbots ontvangen alle groepsberichten, wat nuttig is voor altijd actieve groepswerking.

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
    - `allowlist` (vereist ten minste één afzender-ID in `allowFrom`)
    - `open` (vereist dat `allowFrom` `"*"` bevat)
    - `disabled`

    `dmPolicy: "open"` met `allowFrom: ["*"]` laat elk Telegram-account dat de botgebruikersnaam vindt of raadt de bot opdrachten geven. Gebruik dit alleen voor bewust openbare bots met strikt beperkte tools; bots met één eigenaar moeten `allowlist` gebruiken met numerieke gebruikers-ID's.

    `channels.telegram.allowFrom` accepteert numerieke Telegram-gebruikers-ID's. Prefixen `telegram:` / `tg:` worden geaccepteerd en genormaliseerd.
    In configuraties met meerdere accounts wordt een beperkende `channels.telegram.allowFrom` op topniveau behandeld als veiligheidsgrens: accountniveau-items `allowFrom: ["*"]` maken dat account niet openbaar, tenzij de effectieve account-allowlist na samenvoeging nog steeds een expliciete wildcard bevat.
    `dmPolicy: "allowlist"` met lege `allowFrom` blokkeert alle DM's en wordt geweigerd door configuratievalidatie.
    Setup vraagt alleen om numerieke gebruikers-ID's.
    Als je hebt geüpgraded en je config `@username`-allowlist-items bevat, voer dan `openclaw doctor --fix` uit om ze op te lossen (best-effort; vereist een Telegram-bottoken).
    Als je eerder vertrouwde op allowlist-bestanden uit de koppelingsopslag, kan `openclaw doctor --fix` items herstellen naar `channels.telegram.allowFrom` in allowlist-flows (bijvoorbeeld wanneer `dmPolicy: "allowlist"` nog geen expliciete ID's heeft).

    Voor bots met één eigenaar verdient `dmPolicy: "allowlist"` met expliciete numerieke `allowFrom`-ID's de voorkeur, zodat het toegangsbeleid duurzaam in config staat (in plaats van afhankelijk te zijn van eerdere koppelingsgoedkeuringen).

    Veelvoorkomende verwarring: goedkeuring van DM-koppeling betekent niet "deze afzender is overal geautoriseerd".
    Koppelen verleent DM-toegang. Als er nog geen opdrachteigenaar bestaat, stelt de eerste goedgekeurde koppeling ook `commands.ownerAllowFrom` in, zodat eigenaar-only opdrachten en exec-goedkeuringen een expliciet operatoraccount hebben.
    Autorisatie van groepsafzenders komt nog steeds uit expliciete configuratie-allowlists.
    Als je wilt "ik ben één keer geautoriseerd en zowel DM's als groepsopdrachten werken", zet dan je numerieke Telegram-gebruikers-ID in `channels.telegram.allowFrom`; zorg er voor eigenaar-only opdrachten voor dat `commands.ownerAllowFrom` `telegram:<your user id>` bevat.

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
       - geen `groups`-config:
         - met `groupPolicy: "open"`: elke groep kan groeps-ID-controles doorstaan
         - met `groupPolicy: "allowlist"` (standaard): groepen worden geblokkeerd totdat je `groups`-items (of `"*"`) toevoegt
       - `groups` geconfigureerd: werkt als allowlist (expliciete ID's of `"*"`)

    2. **Welke afzenders zijn toegestaan in groepen** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (standaard)
       - `disabled`

    `groupAllowFrom` wordt gebruikt voor filtering van groepsafzenders. Als dit niet is ingesteld, valt Telegram terug op `allowFrom`.
    `groupAllowFrom`-items moeten numerieke Telegram-gebruikers-ID's zijn (prefixen `telegram:` / `tg:` worden genormaliseerd).
    Zet geen Telegram-groeps- of supergroepchat-ID's in `groupAllowFrom`. Negatieve chat-ID's horen onder `channels.telegram.groups`.
    Niet-numerieke items worden genegeerd voor afzenderautorisatie.
    Veiligheidsgrens (`2026.2.25+`): groepsafzenderauth neemt **geen** DM-koppelingsopslaggoedkeuringen over.
    Koppelen blijft alleen voor DM. Stel voor groepen `groupAllowFrom` of per-groep/per-onderwerp `allowFrom` in.
    Als `groupAllowFrom` niet is ingesteld, valt Telegram terug op config `allowFrom`, niet op de koppelingsopslag.
    Praktisch patroon voor bots met één eigenaar: zet je gebruikers-ID in `channels.telegram.allowFrom`, laat `groupAllowFrom` leeg en sta de doelgroepen toe onder `channels.telegram.groups`.
    Runtime-opmerking: als `channels.telegram` volledig ontbreekt, gebruikt runtime standaard fail-closed `groupPolicy="allowlist"`, tenzij `channels.defaults.groupPolicy` expliciet is ingesteld.

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
      Veelvoorkomende fout: `groupAllowFrom` is geen Telegram-groepsallowlist.

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

    De groepschat-ID ophalen:

    - stuur een groepsbericht door naar `@userinfobot` / `@getidsbot`
    - of lees `chat.id` uit `openclaw logs --follow`
    - of inspecteer Bot API `getUpdates`

  </Tab>
</Tabs>

## Runtimegedrag

- Telegram is eigendom van het Gateway-proces.
- Routering is deterministisch: inkomende Telegram-berichten worden terug beantwoord via Telegram (het model kiest geen kanalen).
- Inkomende berichten worden genormaliseerd naar de gedeelde kanaalenvelop met antwoordmetadata en mediaplaceholders.
- Groepssessies worden geïsoleerd op groeps-ID. Forumonderwerpen voegen `:topic:<threadId>` toe om onderwerpen geïsoleerd te houden.
- DM-berichten kunnen `message_thread_id` bevatten; OpenClaw behoudt de thread-ID voor antwoorden, maar houdt DM's standaard op de platte sessie. Configureer `channels.telegram.dm.threadReplies: "inbound"`, `channels.telegram.direct.<chatId>.threadReplies: "inbound"`, `requireTopic: true`, of een overeenkomende onderwerpconfiguratie wanneer je bewust DM-onderwerpsessie-isolatie wilt.
- Long polling gebruikt grammY runner met per-chat/per-thread-volgorde. De algemene runner-sinkconcurrency gebruikt `agents.defaults.maxConcurrent`.
- Long polling wordt binnen elk Gateway-proces beschermd, zodat slechts één actieve poller tegelijk een bottoken kan gebruiken. Als je nog steeds `getUpdates` 409-conflicten ziet, gebruikt waarschijnlijk een andere OpenClaw Gateway, script of externe poller hetzelfde token.
- Herstarts van de long-polling-watchdog worden standaard geactiveerd na 120 seconden zonder voltooide `getUpdates`-liveness. Verhoog `channels.telegram.pollingStallThresholdMs` alleen als je deployment nog steeds valse polling-stall-herstarts ziet tijdens langlopende werkzaamheden. De waarde is in milliseconden en is toegestaan van `30000` tot `600000`; overschrijvingen per account worden ondersteund.
- Telegram Bot API heeft geen ondersteuning voor leesbevestigingen (`sendReadReceipts` is niet van toepassing).

## Functiereferentie

<AccordionGroup>
  <Accordion title="Live stream-preview (berichtbewerkingen)">
    OpenClaw kan gedeeltelijke antwoorden in realtime streamen:

    - directe chats: previewbericht + `editMessageText`
    - groepen/onderwerpen: previewbericht + `editMessageText`

    Vereiste:

    - `channels.telegram.streaming` is `off | partial | block | progress` (standaard: `partial`)
    - `progress` houdt één bewerkbaar statusconcept bij en werkt dit bij met toolvoortgang tot de uiteindelijke aflevering
    - `streaming.preview.toolProgress` bepaalt of tool-/voortgangsupdates hetzelfde bewerkte previewbericht hergebruiken (standaard: `true` wanneer previewstreaming actief is)
    - verouderde waarden `channels.telegram.streamMode` en boolean `streaming` worden gedetecteerd; voer `openclaw doctor --fix` uit om ze te migreren naar `channels.telegram.streaming.mode`

    Toolvoortgangs-previewupdates zijn de korte statusregels die worden getoond terwijl tools draaien, bijvoorbeeld opdrachtuitvoering, bestanden lezen, planningsupdates of patchsamenvattingen. Telegram houdt deze standaard ingeschakeld om overeen te komen met uitgebracht OpenClaw-gedrag vanaf `v2026.4.22` en later. Stel het volgende in om de bewerkte preview voor antwoordtekst te behouden, maar toolvoortgangsregels te verbergen:

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

    Gebruik `streaming.mode: "off"` alleen wanneer je alleen uiteindelijke levering wilt: bewerkingen van Telegram-voorbeelden zijn uitgeschakeld en generieke tool-/voortgangsberichten worden onderdrukt in plaats van als zelfstandige statusberichten te worden verzonden. Goedkeuringsprompts, media-payloads en fouten lopen nog steeds via normale uiteindelijke levering. Gebruik `streaming.preview.toolProgress: false` wanneer je alleen antwoordvoorbeeld-bewerkingen wilt behouden terwijl je de statusregels voor toolvoortgang verbergt.

    <Note>
      Telegram-antwoorden op geselecteerde citaten zijn de uitzondering. Wanneer `replyToMode` `"first"`, `"all"` of `"batched"` is en het inkomende bericht geselecteerde citaattekst bevat, verzendt OpenClaw het uiteindelijke antwoord via Telegrams native citaatantwoordpad in plaats van het antwoordvoorbeeld te bewerken, waardoor `streaming.preview.toolProgress` de korte statusregels voor die beurt niet kan tonen. Antwoorden op het huidige bericht zonder geselecteerde citaattekst behouden nog steeds previewstreaming. Stel `replyToMode: "off"` in wanneer zichtbaarheid van toolvoortgang belangrijker is dan native citaatantwoorden, of stel `streaming.preview.toolProgress: false` in om de afweging te erkennen.
    </Note>

    Voor antwoorden met alleen tekst:

    - korte DM-/groeps-/onderwerpvoorbeelden: OpenClaw behoudt hetzelfde voorbeeldbericht en voert een uiteindelijke bewerking ter plekke uit, tenzij er een zichtbaar niet-voorbeeldbericht is verzonden nadat het voorbeeld verscheen
    - voorbeelden gevolgd door zichtbare niet-voorbeelduitvoer: OpenClaw verzendt het voltooide antwoord als een nieuw definitief bericht en ruimt het oudere voorbeeld op, zodat het uiteindelijke antwoord na tussentijdse uitvoer verschijnt
    - voorbeelden ouder dan ongeveer één minuut: OpenClaw verzendt het voltooide antwoord als een nieuw definitief bericht en ruimt daarna het voorbeeld op, zodat Telegrams zichtbare tijdstempel de voltooiingstijd weergeeft in plaats van de aanmaaktijd van het voorbeeld

    Voor complexe antwoorden (bijvoorbeeld media-payloads) valt OpenClaw terug op normale uiteindelijke levering en ruimt daarna het voorbeeldbericht op.

    Previewstreaming staat los van blokstreaming. Wanneer blokstreaming expliciet is ingeschakeld voor Telegram, slaat OpenClaw de previewstream over om dubbele streaming te voorkomen.

    Alleen-Telegram redeneerstroom:

    - `/reasoning stream` verzendt redenatie naar het livevoorbeeld tijdens het genereren
    - het uiteindelijke antwoord wordt zonder redenatietekst verzonden

  </Accordion>

  <Accordion title="Opmaak en HTML-terugval">
    Uitgaande tekst gebruikt Telegram `parse_mode: "HTML"`.

    - Markdown-achtige tekst wordt gerenderd naar Telegram-veilige HTML.
    - Ruwe model-HTML wordt geëscapet om Telegram-parsefouten te verminderen.
    - Als Telegram geparseerde HTML weigert, probeert OpenClaw het opnieuw als platte tekst.

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

    - namen worden genormaliseerd (voorloop-`/` verwijderen, kleine letters)
    - geldig patroon: `a-z`, `0-9`, `_`, lengte `1..32`
    - aangepaste opdrachten kunnen native opdrachten niet overschrijven
    - conflicten/dubbele vermeldingen worden overgeslagen en gelogd

    Opmerkingen:

    - aangepaste opdrachten zijn alleen menu-items; ze implementeren niet automatisch gedrag
    - plugin-/skillopdrachten kunnen nog steeds werken wanneer ze worden getypt, zelfs als ze niet in het Telegram-menu worden getoond

    Als native opdrachten zijn uitgeschakeld, worden ingebouwde opdrachten verwijderd. Aangepaste/pluginopdrachten kunnen nog steeds worden geregistreerd als ze zijn geconfigureerd.

    Veelvoorkomende configuratiefouten:

    - `setMyCommands failed` met `BOT_COMMANDS_TOO_MUCH` betekent dat het Telegram-menu na inkorten nog steeds te groot was; verminder plugin-/skill-/aangepaste opdrachten of schakel `channels.telegram.commands.native` uit.
    - `deleteWebhook`, `deleteMyCommands` of `setMyCommands` die faalt met `404: Not Found` terwijl directe Bot API-curlopdrachten werken, kan betekenen dat `channels.telegram.apiRoot` was ingesteld op het volledige `/bot<TOKEN>`-eindpunt. `apiRoot` mag alleen de Bot API-root zijn, en `openclaw doctor --fix` verwijdert een per ongeluk toegevoegde afsluitende `/bot<TOKEN>`.
    - `getMe returned 401` betekent dat Telegram het geconfigureerde bottoken heeft geweigerd. Werk `botToken`, `tokenFile` of `TELEGRAM_BOT_TOKEN` bij met het huidige BotFather-token; OpenClaw stopt vóór het pollen, dus dit wordt niet gemeld als een Webhook-opruimfout.
    - `setMyCommands failed` met netwerk-/fetchfouten betekent meestal dat uitgaande DNS/HTTPS naar `api.telegram.org` is geblokkeerd.

    ### Apparaatkoppelingsopdrachten (`device-pair`-plugin)

    Wanneer de `device-pair`-plugin is geïnstalleerd:

    1. `/pair` genereert configuratiecode
    2. plak code in iOS-app
    3. `/pair pending` vermeldt openstaande aanvragen (inclusief rol/scopes)
    4. keur de aanvraag goed:
       - `/pair approve <requestId>` voor expliciete goedkeuring
       - `/pair approve` wanneer er slechts één openstaande aanvraag is
       - `/pair approve latest` voor de meest recente

    De configuratiecode bevat een kortlevend bootstrap-token. Ingebouwde bootstrap-overdracht houdt het primaire node-token op `scopes: []`; elk overgedragen operatortoken blijft begrensd tot `operator.approvals`, `operator.read`, `operator.talk.secrets` en `operator.write`. Bootstrap-scopecontroles zijn rol-geprefixt, dus die operator-allowlist voldoet alleen aan operatoraanvragen; niet-operatorrollen hebben nog steeds scopes nodig onder hun eigen rolprefix.

    Als een apparaat het opnieuw probeert met gewijzigde authgegevens (bijvoorbeeld rol/scopes/openbare sleutel), wordt de vorige openstaande aanvraag vervangen en gebruikt de nieuwe aanvraag een andere `requestId`. Voer `/pair pending` opnieuw uit voordat je goedkeurt.

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

    Callback-klikken worden als tekst aan de agent doorgegeven:
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

    Gatecontroles:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (standaard: uitgeschakeld)

    Opmerking: `edit` en `topic-create` zijn momenteel standaard ingeschakeld en hebben geen afzonderlijke `channels.telegram.actions.*`-schakelaars.
    Runtime-verzendingen gebruiken de actieve configuratie-/secretssnapshot (opstarten/herladen), dus actiepaden voeren geen ad-hoc SecretRef-herresolutie per verzending uit.

    Semantiek voor verwijderen van reacties: [/tools/reactions](/nl/tools/reactions)

  </Accordion>

  <Accordion title="Tags voor antwoordthreads">
    Telegram ondersteunt expliciete antwoordthreadtags in gegenereerde uitvoer:

    - `[[reply_to_current]]` antwoordt op het activerende bericht
    - `[[reply_to:<id>]]` antwoordt op een specifieke Telegram-bericht-ID

    `channels.telegram.replyToMode` bepaalt de afhandeling:

    - `off` (standaard)
    - `first`
    - `all`

    Wanneer antwoordthreading is ingeschakeld en de oorspronkelijke Telegram-tekst of het bijschrift beschikbaar is, neemt OpenClaw automatisch een native Telegram-citaatexcerpt op. Telegram beperkt native citaattekst tot 1024 UTF-16-code-eenheden, dus langere berichten worden vanaf het begin geciteerd en vallen terug op een gewoon antwoord als Telegram het citaat weigert.

    Opmerking: `off` schakelt impliciete antwoordthreading uit. Expliciete `[[reply_to_*]]`-tags worden nog steeds gehonoreerd.

  </Accordion>

  <Accordion title="Forumonderwerpen en threadgedrag">
    Forum-supergroepen:

    - onderwerpsessiesleutels voegen `:topic:<threadId>` toe
    - antwoorden en typen richten zich op de onderwerpthread
    - configuratiepad voor onderwerp:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Speciaal geval voor algemeen onderwerp (`threadId=1`):

    - berichtverzendingen laten `message_thread_id` weg (Telegram weigert `sendMessage(...thread_id=1)`)
    - typacties bevatten nog steeds `message_thread_id`

    Onderwerpovererving: onderwerpvermeldingen erven groepsinstellingen tenzij overschreven (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` is alleen voor onderwerpen en erft niet van groepsstandaarden.

    **Agentroutering per onderwerp**: Elk onderwerp kan naar een andere agent routeren door `agentId` in de onderwerpconfiguratie in te stellen. Dit geeft elk onderwerp zijn eigen geïsoleerde werkruimte, geheugen en sessie. Voorbeeld:

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

    **Persistente ACP-onderwerpbinding**: Forumonderwerpen kunnen ACP-harnesssessies vastzetten via typed ACP-bindingen op topniveau (`bindings[]` met `type: "acp"` en `match.channel: "telegram"`, `peer.kind: "group"` en een onderwerpgekwalificeerde id zoals `-1001234567890:topic:42`). Momenteel beperkt tot forumonderwerpen in groepen/supergroepen. Zie [ACP Agents](/nl/tools/acp-agents).

    **Threadgebonden ACP-spawn vanuit chat**: `/acp spawn <agent> --thread here|auto` bindt het huidige onderwerp aan een nieuwe ACP-sessie; vervolgberichten worden daar direct naartoe gerouteerd. OpenClaw zet de spawnbevestiging vast in het onderwerp. Vereist dat `channels.telegram.threadBindings.spawnSessions` ingeschakeld blijft (standaard: `true`).

    Templatecontext exposeert `MessageThreadId` en `IsForum`. DM-chats met `message_thread_id` behouden standaard DM-routering en antwoordmetadata op platte sessies; ze gebruiken alleen threadbewuste sessiesleutels wanneer geconfigureerd met `threadReplies: "inbound"`, `threadReplies: "always"`, `requireTopic: true` of een overeenkomende onderwerpconfiguratie. Gebruik `channels.telegram.dm.threadReplies` op topniveau voor de accountstandaard, of `direct.<chatId>.threadReplies` voor één DM.

  </Accordion>

  <Accordion title="Audio, video en stickers">
    ### Audioberichten

    Telegram maakt onderscheid tussen spraaknotities en audiobestanden.

    - standaard: audiobestandsgedrag
    - tag `[[audio_as_voice]]` in agentantwoord om verzending als spraaknotitie af te dwingen
    - inkomende transcripties van spraaknotities worden ingekaderd als machinaal gegenereerde,
      niet-vertrouwde tekst in de agentcontext; vermeldingsdetectie gebruikt nog steeds de ruwe
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

    Telegram onderscheidt videobestanden van videonotities.

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

    Videonotities ondersteunen geen bijschriften; opgegeven berichttekst wordt apart verzonden.

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

    Cachebestand voor stickers:

    - `~/.openclaw/telegram/sticker-cache.json`

    Stickers worden eenmaal beschreven (waar mogelijk) en gecachet om herhaalde vision-aanroepen te verminderen.

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
    Telegram-reacties komen binnen als `message_reaction`-updates (gescheiden van berichtpayloads).

    Wanneer dit is ingeschakeld, plaatst OpenClaw systeemgebeurtenissen in de wachtrij zoals:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Configuratie:

    - `channels.telegram.reactionNotifications`: `off | own | all` (standaard: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (standaard: `minimal`)

    Opmerkingen:

    - `own` betekent alleen gebruikersreacties op berichten die door de bot zijn verzonden (best effort via cache voor verzonden berichten).
    - Reactiegebeurtenissen respecteren nog steeds de toegangscontroles van Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); onbevoegde afzenders worden genegeerd.
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
    - fallback naar emoji van agentidentiteit (`agents.list[].identity.emoji`, anders "👀")

    Opmerkingen:

    - Telegram verwacht unicode-emoji (bijvoorbeeld "👀").
    - Gebruik `""` om de reactie voor een kanaal of account uit te schakelen.

  </Accordion>

  <Accordion title="Config-schrijfacties vanuit Telegram-gebeurtenissen en -commando's">
    Schrijfacties naar kanaalconfiguratie zijn standaard ingeschakeld (`configWrites !== false`).

    Door Telegram geactiveerde schrijfacties omvatten:

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
    Standaard wordt long polling gebruikt. Stel voor webhook-modus `channels.telegram.webhookUrl` en `channels.telegram.webhookSecret` in; optioneel `webhookPath`, `webhookHost`, `webhookPort` (standaardwaarden `/telegram-webhook`, `127.0.0.1`, `8787`).

    De lokale listener bindt aan `127.0.0.1:8787`. Plaats voor publieke ingress een reverse proxy vóór de lokale poort of stel bewust `webhookHost: "0.0.0.0"` in.

    Webhook-modus valideert request-guards, het geheime Telegram-token en de JSON-body voordat `200` aan Telegram wordt teruggegeven.
    OpenClaw verwerkt de update daarna asynchroon via dezelfde botlanes per chat/per onderwerp die door long polling worden gebruikt, zodat trage agentbeurten de bezorgings-ACK van Telegram niet ophouden.

  </Accordion>

  <Accordion title="Limieten, opnieuw proberen en CLI-doelen">
    - `channels.telegram.textChunkLimit` is standaard 4000.
    - `channels.telegram.chunkMode="newline"` geeft de voorkeur aan alineagrenzen (lege regels) vóór splitsing op lengte.
    - `channels.telegram.mediaMaxMb` (standaard 100) begrenst de grootte van inkomende en uitgaande Telegram-media.
    - `channels.telegram.mediaGroupFlushMs` (standaard 500) bepaalt hoe lang Telegram-albums/mediagroepen worden gebufferd voordat OpenClaw ze als één inkomend bericht verzendt. Verhoog dit als albumdelen laat binnenkomen; verlaag dit om de antwoordlatentie voor albums te verminderen.
    - `channels.telegram.timeoutSeconds` overschrijft de timeout van de Telegram API-client (als niet ingesteld, geldt de grammY-standaard). Botclients klemmen geconfigureerde waarden onder de 60-seconden request-guard voor uitgaande tekst/typen, zodat grammY de levering van zichtbare antwoorden niet afbreekt voordat OpenClaw's transportguard en fallback kunnen draaien. Long polling gebruikt nog steeds een 45-seconden `getUpdates` request-guard, zodat idle polls niet onbeperkt worden achtergelaten.
    - `channels.telegram.pollingStallThresholdMs` is standaard `120000`; stem alleen af tussen `30000` en `600000` voor fout-positieve herstarts door polling-stalls.
    - groepscontextgeschiedenis gebruikt `channels.telegram.historyLimit` of `messages.groupChat.historyLimit` (standaard 50); `0` schakelt dit uit.
    - aanvullende context voor antwoord/citaat/doorsturen wordt momenteel doorgegeven zoals ontvangen.
    - Telegram-allowlists bepalen vooral wie de agent kan activeren, niet een volledige redactierand voor aanvullende context.
    - Besturing van DM-geschiedenis:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry`-configuratie geldt voor Telegram-verzendhelpers (CLI/tools/acties) bij herstelbare uitgaande API-fouten. Levering van definitieve antwoorden voor inkomende berichten gebruikt ook een begrensde safe-send retry voor Telegram pre-connect-fouten, maar probeert ambigue post-send netwerk-enveloppen die zichtbare berichten kunnen dupliceren niet opnieuw.

    CLI-verzenddoel kan een numerieke chat-ID of gebruikersnaam zijn:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
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

    Telegram-verzending ondersteunt ook:

    - `--presentation` met `buttons`-blokken voor inline keyboards wanneer `channels.telegram.capabilities.inlineButtons` dit toestaat
    - `--pin` of `--delivery '{"pin":true}'` om vastgepinde levering aan te vragen wanneer de bot in die chat kan vastpinnen
    - `--force-document` om uitgaande afbeeldingen en GIF's als documenten te verzenden in plaats van gecomprimeerde foto- of geanimeerde-media-uploads

    Actie-gating:

    - `channels.telegram.actions.sendMessage=false` schakelt uitgaande Telegram-berichten uit, inclusief polls
    - `channels.telegram.actions.poll=false` schakelt het maken van Telegram-polls uit terwijl gewone verzending ingeschakeld blijft

  </Accordion>

  <Accordion title="Exec-goedkeuringen in Telegram">
    Telegram ondersteunt exec-goedkeuringen in DM's van goedkeurders en kan optioneel prompts plaatsen in de oorspronkelijke chat of het oorspronkelijke onderwerp. Goedkeurders moeten numerieke Telegram-gebruikers-ID's zijn.

    Configuratiepad:

    - `channels.telegram.execApprovals.enabled` (wordt automatisch ingeschakeld wanneer ten minste één goedkeurder kan worden opgelost)
    - `channels.telegram.execApprovals.approvers` (valt terug op numerieke eigenaar-ID's uit `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (standaard) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` en `defaultTo` bepalen wie met de bot kan praten en waar deze normale antwoorden verzendt. Ze maken iemand geen exec-goedkeurder. De eerste goedgekeurde DM-koppeling bootstrapt `commands.ownerAllowFrom` wanneer er nog geen commando-eigenaar bestaat, zodat de installatie met één eigenaar nog steeds werkt zonder ID's te dupliceren onder `execApprovals.approvers`.

    Kanaallevering toont de commandotekst in de chat; schakel `channel` of `both` alleen in voor vertrouwde groepen/onderwerpen. Wanneer de prompt in een forumonderwerp terechtkomt, behoudt OpenClaw het onderwerp voor de goedkeuringsprompt en de opvolging. Exec-goedkeuringen verlopen standaard na 30 minuten.

    Inline goedkeuringsknoppen vereisen ook dat `channels.telegram.capabilities.inlineButtons` het doeloppervlak toestaat (`dm`, `group` of `all`). Goedkeurings-ID's met prefix `plugin:` worden via plugin-goedkeuringen opgelost; andere worden eerst via exec-goedkeuringen opgelost.

    Zie [Exec-goedkeuringen](/nl/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Besturing van foutantwoorden

Wanneer de agent een bezorgings- of providerfout tegenkomt, kan Telegram antwoorden met de fouttekst of deze onderdrukken. Twee configuratiesleutels bepalen dit gedrag:

| Sleutel                             | Waarden           | Standaard | Beschrijving                                                                                              |
| ----------------------------------- | ----------------- | --------- | ---------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`   | `reply` verzendt een vriendelijke foutmelding naar de chat. `silent` onderdrukt foutantwoorden volledig. |
| `channels.telegram.errorCooldownMs` | getal (ms)        | `60000`   | Minimale tijd tussen foutantwoorden naar dezelfde chat. Voorkomt foutspam tijdens storingen.              |

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
  <Accordion title="Bot reageert niet op groepsberichten zonder vermelding">

    - Als `requireMention=false`, moet de privacymodus van Telegram volledige zichtbaarheid toestaan.
      - BotFather: `/setprivacy` -> Uitschakelen
      - verwijder daarna de bot uit de groep en voeg deze opnieuw toe
    - `openclaw channels status` waarschuwt wanneer de configuratie groepsberichten zonder vermelding verwacht.
    - `openclaw channels status --probe` kan expliciete numerieke groeps-ID's controleren; wildcard `"*"` kan niet op lidmaatschap worden geprobed.
    - snelle sessietest: `/activation always`.

  </Accordion>

  <Accordion title="Bot ziet helemaal geen groepsberichten">

    - wanneer `channels.telegram.groups` bestaat, moet de groep vermeld zijn (of `"*"` bevatten)
    - verifieer botlidmaatschap in de groep
    - bekijk logs: `openclaw logs --follow` voor redenen voor overslaan

  </Accordion>

  <Accordion title="Commando's werken gedeeltelijk of helemaal niet">

    - autoriseer je afzenderidentiteit (koppeling en/of numerieke `allowFrom`)
    - commandoautorisatie geldt nog steeds, zelfs wanneer groepsbeleid `open` is
    - `setMyCommands failed` met `BOT_COMMANDS_TOO_MUCH` betekent dat het native menu te veel items heeft; verminder plugin-/skill-/aangepaste commando's of schakel native menu's uit
    - `deleteMyCommands` / `setMyCommands`-aanroepen bij opstarten en `sendChatAction`-typingaanroepen zijn begrensd en proberen één keer opnieuw via Telegram's transportfallback bij request-timeout. Aanhoudende netwerk-/fetchfouten duiden meestal op DNS-/HTTPS-bereikbaarheidsproblemen met `api.telegram.org`

  </Accordion>

  <Accordion title="Opstarten meldt ongeautoriseerd token">

    - `getMe returned 401` is een Telegram-authenticatiefout voor het geconfigureerde bottoken.
    - Kopieer het bottoken opnieuw of genereer het opnieuw in BotFather, en werk daarna `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` of `TELEGRAM_BOT_TOKEN` bij voor het standaardaccount.
    - `deleteWebhook 401 Unauthorized` tijdens het opstarten is ook een authenticatiefout; dit behandelen als "er bestaat geen webhook" zou dezelfde fout door een ongeldig token alleen uitstellen tot latere API-aanroepen.

  </Accordion>

  <Accordion title="Polling of netwerkinstabiliteit">

    - Node 22+ + aangepaste fetch/proxy kan onmiddellijk afbreekgedrag veroorzaken als AbortSignal-typen niet overeenkomen.
    - Sommige hosts resolven `api.telegram.org` eerst naar IPv6; defecte IPv6-egress kan intermitterende Telegram API-fouten veroorzaken.
    - Als logs `TypeError: fetch failed` of `Network request for 'getUpdates' failed!` bevatten, probeert OpenClaw deze nu opnieuw als herstelbare netwerkfouten.
    - Tijdens het starten van polling hergebruikt OpenClaw de geslaagde opstartprobe `getMe` voor grammY, zodat de runner geen tweede `getMe` nodig heeft vóór de eerste `getUpdates`.
    - Als `deleteWebhook` mislukt met een tijdelijke netwerkfout tijdens het starten van polling, gaat OpenClaw door naar long polling in plaats van nog een control-plane-aanroep vóór polling te doen. Een nog actieve webhook verschijnt als een `getUpdates`-conflict; OpenClaw bouwt daarna het Telegram-transport opnieuw op en probeert webhookopschoning opnieuw.
    - Als Telegram-sockets volgens een korte vaste cadans worden gerecycled, controleer dan op een lage `channels.telegram.timeoutSeconds`; botclients klemmen geconfigureerde waarden onder de guards voor uitgaande en `getUpdates`-requests, maar oudere releases konden elke poll of elk antwoord afbreken wanneer dit lager was ingesteld dan die guards.
    - Als logs `Polling stall detected` bevatten, herstart OpenClaw standaard polling en bouwt het Telegram-transport opnieuw op na 120 seconden zonder voltooide long-poll-liveness.
    - `openclaw channels status --probe` en `openclaw doctor` waarschuwen wanneer een actief pollingaccount `getUpdates` na de opstartgratie niet heeft voltooid, wanneer een actief webhookaccount `setWebhook` na de opstartgratie niet heeft voltooid, of wanneer de laatste geslaagde pollingtransportactiviteit verouderd is.
    - Verhoog `channels.telegram.pollingStallThresholdMs` alleen wanneer langlopende `getUpdates`-aanroepen gezond zijn maar je host nog steeds fout-positieve polling-stall-herstarts meldt. Aanhoudende stalls wijzen meestal op proxy-, DNS-, IPv6- of TLS-egressproblemen tussen de host en `api.telegram.org`.
    - Telegram respecteert ook procesproxy-env voor Bot API-transport, inclusief `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` en hun varianten in kleine letters. `NO_PROXY` / `no_proxy` kan `api.telegram.org` nog steeds omzeilen.
    - Als de door OpenClaw beheerde proxy via `OPENCLAW_PROXY_URL` is geconfigureerd voor een serviceomgeving en er geen standaard proxy-env aanwezig is, gebruikt Telegram die URL ook voor Bot API-transport.
    - Routeer Telegram API-aanroepen op VPS-hosts met instabiele directe egress/TLS via `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ gebruikt standaard `autoSelectFamily=true` (behalve WSL2). De volgorde van Telegram DNS-resultaten respecteert eerst `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, daarna `channels.telegram.network.dnsResultOrder`, daarna de processtandaard zoals `NODE_OPTIONS=--dns-result-order=ipv4first`; als geen van deze van toepassing is, valt Node 22+ terug op `ipv4first`.
    - Als je host WSL2 is of expliciet beter werkt met IPv4-only gedrag, forceer dan familieselectie:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Antwoorden uit het RFC 2544-benchmarkbereik (`198.18.0.0/15`) zijn standaard al toegestaan
      voor Telegram-mediadownloads. Als een vertrouwde fake-IP- of
      transparante proxy `api.telegram.org` tijdens mediadownloads herschrijft naar een ander
      privé/intern/speciaal adres, kun je je aanmelden
      voor de Telegram-only bypass:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Dezelfde opt-in is per account beschikbaar op
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Als je proxy Telegram-mediahosts resolvet naar `198.18.x.x`, laat de
      gevaarlijke vlag eerst uit. Telegram-media staat het RFC 2544-
      benchmarkbereik standaard al toe.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` verzwakt Telegram
      media-SSRF-bescherming. Gebruik dit alleen voor vertrouwde, door operators beheerde proxy-
      omgevingen zoals Clash, Mihomo of Surge fake-IP-routing wanneer zij
      privé- of speciale antwoorden buiten het RFC 2544-benchmark-
      bereik synthetiseren. Laat dit uit voor normale publieke Telegram-toegang.
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

<Accordion title="Telegram-velden met veel signaal">

- opstarten/authenticatie: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` moet naar een regulier bestand wijzen; symlinks worden geweigerd)
- toegangscontrole: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, top-level `bindings[]` (`type: "acp"`)
- uitvoeringsgoedkeuringen: `execApprovals`, `accounts.*.execApprovals`
- opdracht/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- threads/antwoorden: `replyToMode`, `dm.threadReplies`, `direct.*.threadReplies`
- streaming: `streaming` (preview), `streaming.preview.toolProgress`, `blockStreaming`
- opmaak/bezorging: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- media/netwerk: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- aangepaste API-root: `apiRoot` (alleen Bot API-root; neem `/bot<TOKEN>` niet op)
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- acties/capaciteiten: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reacties: `reactionNotifications`, `reactionLevel`
- fouten: `errorPolicy`, `errorCooldownMs`
- schrijven/geschiedenis: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Multi-accountprecedentie: wanneer twee of meer account-ID's zijn geconfigureerd, stel `channels.telegram.defaultAccount` in (of neem `channels.telegram.accounts.default` op) om standaardroutering expliciet te maken. Anders valt OpenClaw terug op de eerste genormaliseerde account-ID en waarschuwt `openclaw doctor`. Benoemde accounts erven `channels.telegram.allowFrom` / `groupAllowFrom`, maar niet de waarden van `accounts.default.*`.
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
  <Card title="Multi-agent-routering" icon="sitemap" href="/nl/concepts/multi-agent">
    Koppel groepen en topics aan agents.
  </Card>
  <Card title="Probleemoplossing" icon="wrench" href="/nl/channels/troubleshooting">
    Kanaaloverschrijdende diagnostiek.
  </Card>
</CardGroup>
