---
read_when:
    - Werken aan Telegram-functies of Webhooks
summary: Ondersteuningsstatus, mogelijkheden en configuratie van de Telegram-bot
title: Telegram
x-i18n:
    generated_at: "2026-05-02T11:10:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4b5a733970f21e6b5a145b9ebb13134fb8e18b81fa0c723607019837c60f5497
    source_path: channels/telegram.md
    workflow: 16
---

Gereed voor productie voor bot-DM's en groepen via grammY. Long polling is de standaardmodus; webhookmodus is optioneel.

<CardGroup cols={3}>
  <Card title="Koppelen" icon="link" href="/nl/channels/pairing">
    Het standaard-DM-beleid voor Telegram is koppelen.
  </Card>
  <Card title="Kanaalproblemen oplossen" icon="wrench" href="/nl/channels/troubleshooting">
    Kanaaloverstijgende diagnostiek en reparatieplaybooks.
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

    Env-fallback: `TELEGRAM_BOT_TOKEN=...` (alleen standaardaccount).
    Telegram gebruikt **niet** `openclaw channels login telegram`; configureer token in config/env en start daarna Gateway.

  </Step>

  <Step title="Start Gateway en keur eerste DM goed">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Koppelcodes verlopen na 1 uur.

  </Step>

  <Step title="Voeg de bot toe aan een groep">
    Voeg de bot toe aan je groep en stel daarna `channels.telegram.groups` en `groupPolicy` in zodat ze overeenkomen met je toegangsmodel.
  </Step>
</Steps>

<Note>
De volgorde voor tokenresolutie is accountbewust. In de praktijk winnen configwaarden van env-fallback, en `TELEGRAM_BOT_TOKEN` geldt alleen voor het standaardaccount.
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

    Beheerderbots ontvangen alle groepsberichten, wat handig is voor altijd-actief groepsgedrag.

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

    `dmPolicy: "open"` met `allowFrom: ["*"]` laat elk Telegram-account dat de botgebruikersnaam vindt of raadt opdrachten aan de bot geven. Gebruik dit alleen voor bewust openbare bots met strikt beperkte tools; bots met één eigenaar moeten `allowlist` gebruiken met numerieke gebruikers-ID's.

    `channels.telegram.allowFrom` accepteert numerieke Telegram-gebruikers-ID's. Prefixen `telegram:` / `tg:` worden geaccepteerd en genormaliseerd.
    In multi-accountconfiguraties wordt een restrictieve top-level `channels.telegram.allowFrom` behandeld als veiligheidsgrens: accountniveau-items `allowFrom: ["*"]` maken dat account niet openbaar, tenzij de effectieve account-allowlist na samenvoegen nog steeds een expliciete wildcard bevat.
    `dmPolicy: "allowlist"` met lege `allowFrom` blokkeert alle DM's en wordt afgewezen door configvalidatie.
    Setup vraagt alleen om numerieke gebruikers-ID's.
    Als je hebt geüpgraded en je config `@username`-allowlist-items bevat, voer dan `openclaw doctor --fix` uit om ze op te lossen (best-effort; vereist een Telegram-bottoken).
    Als je eerder vertrouwde op allowlistbestanden uit de pairing-store, kan `openclaw doctor --fix` items herstellen naar `channels.telegram.allowFrom` in allowlist-flows (bijvoorbeeld wanneer `dmPolicy: "allowlist"` nog geen expliciete ID's heeft).

    Voor bots met één eigenaar heeft `dmPolicy: "allowlist"` met expliciete numerieke `allowFrom`-ID's de voorkeur, zodat het toegangsbeleid duurzaam in config staat (in plaats van afhankelijk te zijn van eerdere koppelgoedkeuringen).

    Veelvoorkomende verwarring: DM-koppelgoedkeuring betekent niet "deze afzender is overal geautoriseerd".
    Koppelen verleent DM-toegang. Als er nog geen opdrachteigenaar bestaat, stelt de eerste goedgekeurde koppeling ook `commands.ownerAllowFrom` in, zodat alleen-eigenaar-opdrachten en exec-goedkeuringen een expliciet operatoraccount hebben.
    Autorisatie van groepsafzenders komt nog steeds uit expliciete config-allowlists.
    Als je wilt dat "ik één keer geautoriseerd ben en zowel DM's als groepsopdrachten werken", zet dan je numerieke Telegram-gebruikers-ID in `channels.telegram.allowFrom`; zorg er voor alleen-eigenaar-opdrachten voor dat `commands.ownerAllowFrom` `telegram:<your user id>` bevat.

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
    Twee instellingen zijn samen van toepassing:

    1. **Welke groepen zijn toegestaan** (`channels.telegram.groups`)
       - geen `groups`-config:
         - met `groupPolicy: "open"`: elke groep kan groeps-ID-controles doorstaan
         - met `groupPolicy: "allowlist"` (standaard): groepen worden geblokkeerd totdat je `groups`-items toevoegt (of `"*"`)
       - `groups` geconfigureerd: werkt als allowlist (expliciete ID's of `"*"`)

    2. **Welke afzenders zijn toegestaan in groepen** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (standaard)
       - `disabled`

    `groupAllowFrom` wordt gebruikt voor filtering van groepsafzenders. Als dit niet is ingesteld, valt Telegram terug op `allowFrom`.
    `groupAllowFrom`-items moeten numerieke Telegram-gebruikers-ID's zijn (prefixen `telegram:` / `tg:` worden genormaliseerd).
    Zet geen Telegram-groeps- of supergroup-chat-ID's in `groupAllowFrom`. Negatieve chat-ID's horen onder `channels.telegram.groups`.
    Niet-numerieke items worden genegeerd voor afzenderautorisatie.
    Veiligheidsgrens (`2026.2.25+`): groepsafzenderauth neemt **geen** DM-goedkeuringen uit de pairing-store over.
    Koppelen blijft alleen voor DM. Stel voor groepen `groupAllowFrom` of per-groep/per-topic `allowFrom` in.
    Als `groupAllowFrom` niet is ingesteld, valt Telegram terug op config `allowFrom`, niet op de pairing-store.
    Praktisch patroon voor bots met één eigenaar: stel je gebruikers-ID in `channels.telegram.allowFrom` in, laat `groupAllowFrom` leeg en sta de doelgroepen toe onder `channels.telegram.groups`.
    Runtime-opmerking: als `channels.telegram` volledig ontbreekt, valt runtime standaard fail-closed terug op `groupPolicy="allowlist"`, tenzij `channels.defaults.groupPolicy` expliciet is ingesteld.

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

      - Zet negatieve Telegram-groeps- of supergroup-chat-ID's zoals `-1001234567890` onder `channels.telegram.groups`.
      - Zet Telegram-gebruikers-ID's zoals `8734062810` onder `groupAllowFrom` wanneer je wilt beperken welke mensen binnen een toegestane groep de bot kunnen activeren.
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

    Op sessieniveau ingestelde opdrachtschakelaars:

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

## Runtimegedrag

- Telegram is eigendom van het Gateway-proces.
- Routering is deterministisch: inkomende Telegram-berichten antwoorden terug naar Telegram (het model kiest geen kanalen).
- Inkomende berichten worden genormaliseerd naar de gedeelde kanaalenvelop met antwoordmetadata en mediaplaceholders.
- Groepssessies worden geïsoleerd op groeps-ID. Forumtopics voegen `:topic:<threadId>` toe om topics geïsoleerd te houden.
- DM-berichten kunnen `message_thread_id` bevatten; OpenClaw behoudt de thread-ID voor antwoorden, maar houdt DM's standaard op de platte sessie. Configureer `channels.telegram.dm.threadReplies: "inbound"`, `channels.telegram.direct.<chatId>.threadReplies: "inbound"`, `requireTopic: true`, of een overeenkomende topicconfig wanneer je bewust DM-topic-sessie-isolatie wilt.
- Long polling gebruikt grammY runner met sequencing per chat/per thread. De algehele runner-sink-concurrency gebruikt `agents.defaults.maxConcurrent`.
- Long polling wordt binnen elk Gateway-proces bewaakt, zodat slechts één actieve poller tegelijk een bottoken kan gebruiken. Als je nog steeds `getUpdates` 409-conflicten ziet, gebruikt waarschijnlijk een andere OpenClaw Gateway, script of externe poller hetzelfde token.
- Watchdog-herstarts voor long polling worden standaard geactiveerd na 120 seconden zonder voltooide `getUpdates`-liveness. Verhoog `channels.telegram.pollingStallThresholdMs` alleen als je deployment nog steeds onterechte polling-stall-herstarts ziet tijdens langlopende werkzaamheden. De waarde is in milliseconden en is toegestaan van `30000` tot `600000`; overrides per account worden ondersteund.
- Telegram Bot API ondersteunt geen leesbevestigingen (`sendReadReceipts` is niet van toepassing).

## Functiereferentie

<AccordionGroup>
  <Accordion title="Live stream-preview (berichtbewerkingen)">
    OpenClaw kan gedeeltelijke antwoorden in realtime streamen:

    - directe chats: previewbericht + `editMessageText`
    - groepen/topics: previewbericht + `editMessageText`

    Vereiste:

    - `channels.telegram.streaming` is `off | partial | block | progress` (standaard: `partial`)
    - `progress` wordt op Telegram gemapt naar `partial` (compatibiliteit met kanaaloverstijgende naamgeving)
    - `streaming.preview.toolProgress` bepaalt of tool-/voortgangsupdates hetzelfde bewerkte previewbericht hergebruiken (standaard: `true` wanneer previewstreaming actief is)
    - legacy `channels.telegram.streamMode` en booleaanse `streaming`-waarden worden gedetecteerd; voer `openclaw doctor --fix` uit om ze te migreren naar `channels.telegram.streaming.mode`

    Tool-progress-previewupdates zijn de korte regels "Bezig..." die worden getoond terwijl tools draaien, bijvoorbeeld opdrachtexecutie, bestanden lezen, planningsupdates of patchsamenvattingen. Telegram houdt deze standaard ingeschakeld om overeen te komen met uitgebracht OpenClaw-gedrag vanaf `v2026.4.22` en later. Om de bewerkte preview voor antwoordtekst te behouden maar tool-progress-regels te verbergen, stel in:

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

    Gebruik `streaming.mode: "off"` alleen wanneer je uitsluitend levering van het eindantwoord wilt: Telegram-previewbewerkingen zijn uitgeschakeld en algemene tool-/voortgangspraat wordt onderdrukt in plaats van als losse "Working..."-berichten te worden verzonden. Goedkeuringsprompts, mediapayloads en fouten lopen nog steeds via normale levering van het eindantwoord. Gebruik `streaming.preview.toolProgress: false` wanneer je alleen antwoordpreviewbewerkingen wilt behouden terwijl je de statusregels voor toolvoortgang verbergt.

    Voor antwoorden met alleen tekst:

    - korte DM-/groep-/topicpreviews: OpenClaw behoudt hetzelfde previewbericht en voert een laatste bewerking op dezelfde plek uit
    - previews ouder dan ongeveer een minuut: OpenClaw verzendt het voltooide antwoord als een nieuw eindbericht en ruimt daarna de preview op, zodat de zichtbare tijdstempel van Telegram de voltooiingstijd weergeeft in plaats van de aanmaaktijd van de preview

    Voor complexe antwoorden (bijvoorbeeld mediapayloads) valt OpenClaw terug op normale levering van het eindantwoord en ruimt daarna het previewbericht op.

    Previewstreaming staat los van blokstreaming. Wanneer blokstreaming expliciet is ingeschakeld voor Telegram, slaat OpenClaw de previewstream over om dubbel streamen te voorkomen.

    Reasoning-stream alleen voor Telegram:

    - `/reasoning stream` stuurt tijdens het genereren reasoning naar de livepreview
    - het eindantwoord wordt zonder reasoning-tekst verzonden

  </Accordion>

  <Accordion title="Opmaak en HTML-terugval">
    Uitgaande tekst gebruikt Telegram `parse_mode: "HTML"`.

    - Markdown-achtige tekst wordt gerenderd naar Telegram-veilige HTML.
    - Ruwe model-HTML wordt geëscapet om Telegram-parsefouten te verminderen.
    - Als Telegram geparste HTML weigert, probeert OpenClaw het opnieuw als platte tekst.

    Linkpreviews zijn standaard ingeschakeld en kunnen worden uitgeschakeld met `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Native opdrachten en aangepaste opdrachten">
    Registratie van het Telegram-opdrachtenmenu wordt bij het opstarten afgehandeld met `setMyCommands`.

    Standaardwaarden voor native opdrachten:

    - `commands.native: "auto"` schakelt native opdrachten in voor Telegram

    Voeg aangepaste vermeldingen voor het opdrachtenmenu toe:

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

    - aangepaste opdrachten zijn alleen menuvermeldingen; ze implementeren geen gedrag automatisch
    - plugin-/skill-opdrachten kunnen nog steeds werken wanneer ze worden getypt, ook als ze niet in het Telegram-menu worden weergegeven

    Als native opdrachten zijn uitgeschakeld, worden ingebouwde opdrachten verwijderd. Aangepaste/plugin-opdrachten kunnen nog steeds worden geregistreerd als ze zijn geconfigureerd.

    Veelvoorkomende configuratiefouten:

    - `setMyCommands failed` met `BOT_COMMANDS_TOO_MUCH` betekent dat het Telegram-menu na inkorten nog steeds overliep; verminder plugin-/skill-/aangepaste opdrachten of schakel `channels.telegram.commands.native` uit.
    - `deleteWebhook`, `deleteMyCommands` of `setMyCommands` faalt met `404: Not Found` terwijl directe Bot API-curlopdrachten werken, kan betekenen dat `channels.telegram.apiRoot` was ingesteld op het volledige `/bot<TOKEN>`-endpoint. `apiRoot` mag alleen de Bot API-root zijn, en `openclaw doctor --fix` verwijdert een per ongeluk toegevoegde afsluitende `/bot<TOKEN>`.
    - `getMe returned 401` betekent dat Telegram de geconfigureerde bottoken heeft geweigerd. Werk `botToken`, `tokenFile` of `TELEGRAM_BOT_TOKEN` bij met de huidige BotFather-token; OpenClaw stopt vóór polling, dus dit wordt niet gemeld als een fout bij het opschonen van de Webhook.
    - `setMyCommands failed` met netwerk-/fetchfouten betekent meestal dat uitgaande DNS/HTTPS naar `api.telegram.org` wordt geblokkeerd.

    ### Opdrachten voor apparaatkoppeling (`device-pair` plugin)

    Wanneer de `device-pair` plugin is geïnstalleerd:

    1. `/pair` genereert configuratiecode
    2. plak code in iOS-app
    3. `/pair pending` toont openstaande verzoeken (inclusief rol/scopes)
    4. keur het verzoek goed:
       - `/pair approve <requestId>` voor expliciete goedkeuring
       - `/pair approve` wanneer er maar één openstaand verzoek is
       - `/pair approve latest` voor het meest recente

    De configuratiecode bevat een kortlevende bootstrap-token. Ingebouwde bootstrap-overdracht houdt de primaire Node-token op `scopes: []`; elke overgedragen operator-token blijft begrensd tot `operator.approvals`, `operator.read`, `operator.talk.secrets` en `operator.write`. Bootstrap-scopecontroles hebben een rolprefix, dus die operator-allowlist voldoet alleen aan operatorverzoeken; niet-operatorrollen hebben nog steeds scopes nodig onder hun eigen rolprefix.

    Als een apparaat opnieuw probeert te koppelen met gewijzigde authdetails (bijvoorbeeld rol/scopes/publieke sleutel), wordt het eerdere openstaande verzoek vervangen en gebruikt het nieuwe verzoek een andere `requestId`. Voer `/pair pending` opnieuw uit voordat je goedkeurt.

    Meer details: [Koppelen](/nl/channels/pairing#pair-via-telegram-recommended-for-ios).

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

    Gatecontroles:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (standaard: uitgeschakeld)

    Opmerking: `edit` en `topic-create` zijn momenteel standaard ingeschakeld en hebben geen afzonderlijke `channels.telegram.actions.*`-schakelaars.
    Runtime-verzendingen gebruiken de actieve config-/secrets-snapshot (opstarten/herladen), dus actiepaden voeren geen ad-hoc SecretRef-herresolutie per verzending uit.

    Semantiek voor het verwijderen van reacties: [/tools/reactions](/nl/tools/reactions)

  </Accordion>

  <Accordion title="Tags voor antwoordthreads">
    Telegram ondersteunt expliciete tags voor antwoordthreads in gegenereerde uitvoer:

    - `[[reply_to_current]]` antwoordt op het activerende bericht
    - `[[reply_to:<id>]]` antwoordt op een specifiek Telegram-bericht-ID

    `channels.telegram.replyToMode` regelt de afhandeling:

    - `off` (standaard)
    - `first`
    - `all`

    Wanneer antwoordthreads zijn ingeschakeld en de oorspronkelijke Telegram-tekst of caption beschikbaar is, voegt OpenClaw automatisch een native Telegram-citaatfragment toe. Telegram beperkt native citaattekst tot 1024 UTF-16-code-eenheden, dus langere berichten worden vanaf het begin geciteerd en vallen terug op een gewoon antwoord als Telegram het citaat weigert.

    Opmerking: `off` schakelt impliciete antwoordthreads uit. Expliciete `[[reply_to_*]]`-tags worden nog steeds gehonoreerd.

  </Accordion>

  <Accordion title="Forumtopics en threadgedrag">
    Forum-supergroepen:

    - topic-sessiesleutels voegen `:topic:<threadId>` toe
    - antwoorden en typen richten zich op de topicthread
    - pad voor topicconfiguratie:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Speciale behandeling van algemeen topic (`threadId=1`):

    - berichtverzendingen laten `message_thread_id` weg (Telegram weigert `sendMessage(...thread_id=1)`)
    - typacties bevatten nog steeds `message_thread_id`

    Topicovererving: topicvermeldingen erven groepsinstellingen tenzij overschreven (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` is alleen voor topics en erft niet van groepsstandaarden.

    **Agentroutering per topic**: Elk topic kan naar een andere agent routeren door `agentId` in de topicconfiguratie in te stellen. Dit geeft elk topic een eigen geïsoleerde werkruimte, geheugen en sessie. Voorbeeld:

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

    **Persistente ACP-topicbinding**: Forumtopics kunnen ACP-harness-sessies vastpinnen via getypeerde ACP-bindingen op topniveau (`bindings[]` met `type: "acp"` en `match.channel: "telegram"`, `peer.kind: "group"`, en een topic-gekwalificeerde id zoals `-1001234567890:topic:42`). Momenteel beperkt tot forumtopics in groepen/supergroepen. Zie [ACP Agents](/nl/tools/acp-agents).

    **Threadgebonden ACP-spawn vanuit chat**: `/acp spawn <agent> --thread here|auto` bindt het huidige topic aan een nieuwe ACP-sessie; vervolgen worden daar direct naartoe gerouteerd. OpenClaw pint de spawnbevestiging binnen het topic vast. Vereist dat `channels.telegram.threadBindings.spawnSessions` ingeschakeld blijft (standaard: `true`).

    Sjablooncontext geeft `MessageThreadId` en `IsForum` beschikbaar. DM-chats met `message_thread_id` behouden standaard DM-routering en antwoordmetadata op platte sessies; ze gebruiken alleen threadbewuste sessiesleutels wanneer geconfigureerd met `threadReplies: "inbound"`, `threadReplies: "always"`, `requireTopic: true` of een overeenkomende topicconfiguratie. Gebruik `channels.telegram.dm.threadReplies` op topniveau voor de accountstandaard, of `direct.<chatId>.threadReplies` voor één DM.

  </Accordion>

  <Accordion title="Audio, video en stickers">
    ### Audioberichten

    Telegram maakt onderscheid tussen spraaknotities en audiobestanden.

    - standaard: gedrag voor audiobestanden
    - tag `[[audio_as_voice]]` in agentantwoord om verzending als spraaknotitie af te dwingen
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

    Videonotities ondersteunen geen captions; opgegeven berichttekst wordt afzonderlijk verzonden.

    ### Stickers

    Afhandeling van inkomende stickers:

    - statische WEBP: gedownload en verwerkt (placeholder `<media:sticker>`)
    - geanimeerde TGS: overgeslagen
    - video-WEBM: overgeslagen

    Stickercontextvelden:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    Stickercachebestand:

    - `~/.openclaw/telegram/sticker-cache.json`

    Stickers worden één keer beschreven (wanneer mogelijk) en gecachet om herhaalde vision-calls te verminderen.

    Schakel stickeracties in:

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

    Als dit is ingeschakeld, zet OpenClaw systeemgebeurtenissen in de wachtrij, zoals:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Configuratie:

    - `channels.telegram.reactionNotifications`: `off | own | all` (standaard: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (standaard: `minimal`)

    Opmerkingen:

    - `own` betekent alleen gebruikersreacties op door de bot verzonden berichten (best-effort via de cache voor verzonden berichten).
    - Reactiegebeurtenissen blijven de toegangscontroles van Telegram respecteren (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); niet-geautoriseerde afzenders worden genegeerd.
    - Telegram levert geen thread-ID's in reactie-updates.
      - niet-forumgroepen worden naar de groepschatsessie gerouteerd
      - forumgroepen worden naar de algemene-onderwerpsessie van de groep gerouteerd (`:topic:1`), niet naar het exacte oorspronkelijke onderwerp

    `allowed_updates` voor polling/webhook bevat automatisch `message_reaction`.

  </Accordion>

  <Accordion title="Ack-reacties">
    `ackReaction` verzendt een bevestigingsemoji terwijl OpenClaw een inkomend bericht verwerkt.

    Volgorde van oplossing:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - fallback naar emoji uit agentidentiteit (`agents.list[].identity.emoji`, anders "👀")

    Opmerkingen:

    - Telegram verwacht unicode-emoji (bijvoorbeeld "👀").
    - Gebruik `""` om de reactie voor een kanaal of account uit te schakelen.

  </Accordion>

  <Accordion title="Configuratieschrijfacties vanuit Telegram-gebeurtenissen en opdrachten">
    Schrijven naar kanaalconfiguratie is standaard ingeschakeld (`configWrites !== false`).

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

    De lokale listener bindt aan `127.0.0.1:8787`. Plaats voor publieke ingress een reverse proxy vóór de lokale poort of stel bewust `webhookHost: "0.0.0.0"` in.

    Webhookmodus valideert request guards, het geheime token van Telegram en de JSON-body voordat `200` aan Telegram wordt geretourneerd.
    OpenClaw verwerkt de update daarna asynchroon via dezelfde botlanes per chat/per onderwerp die door long polling worden gebruikt, zodat langzame agentbeurten de bezorgings-ACK van Telegram niet ophouden.

  </Accordion>

  <Accordion title="Limieten, opnieuw proberen en CLI-doelen">
    - `channels.telegram.textChunkLimit` is standaard 4000.
    - `channels.telegram.chunkMode="newline"` geeft de voorkeur aan alineagrenzen (lege regels) voordat op lengte wordt gesplitst.
    - `channels.telegram.mediaMaxMb` (standaard 100) begrenst de grootte van inkomende en uitgaande Telegram-media.
    - `channels.telegram.timeoutSeconds` overschrijft de timeout van de Telegram API-client (als dit niet is ingesteld, geldt de standaard van grammY). Botclients klemmen geconfigureerde waarden onder de 60-seconden request guard voor uitgaande tekst/typen, zodat grammY zichtbare antwoordbezorging niet afbreekt voordat de transport guard en fallback van OpenClaw kunnen draaien. Long polling gebruikt nog steeds een 45-seconden `getUpdates` request guard, zodat inactieve polls niet onbeperkt worden verlaten.
    - `channels.telegram.pollingStallThresholdMs` is standaard `120000`; stem alleen af tussen `30000` en `600000` voor fout-positieve herstarts door vastgelopen polling.
    - geschiedenis van groepscontext gebruikt `channels.telegram.historyLimit` of `messages.groupChat.historyLimit` (standaard 50); `0` schakelt dit uit.
    - aanvullende context voor antwoorden/citaten/doorsturen wordt momenteel doorgegeven zoals ontvangen.
    - Telegram-allowlists begrenzen vooral wie de agent kan activeren, niet een volledige redactielimiet voor aanvullende context.
    - Beheer van DM-geschiedenis:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry`-configuratie geldt voor Telegram-verzendhelpers (CLI/tools/actions) voor herstelbare uitgaande API-fouten. Bezorging van inkomende eindantwoorden gebruikt ook een begrensde retry met veilig verzenden voor Telegram-fouten vóór verbinding, maar probeert dubbelzinnige netwerk-enveloppen na verzending niet opnieuw als die zichtbare berichten zouden kunnen dupliceren.

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

    Alleen-Telegram pollvlaggen:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` voor forumonderwerpen (of gebruik een `:topic:`-doel)

    Telegram-verzenden ondersteunt ook:

    - `--presentation` met `buttons`-blokken voor inline toetsenborden wanneer `channels.telegram.capabilities.inlineButtons` dit toestaat
    - `--pin` of `--delivery '{"pin":true}'` om vastgezette bezorging aan te vragen wanneer de bot in die chat kan vastzetten
    - `--force-document` om uitgaande afbeeldingen en GIF's als documenten te verzenden in plaats van als gecomprimeerde foto- of geanimeerde-media-uploads

    Actieafscherming:

    - `channels.telegram.actions.sendMessage=false` schakelt uitgaande Telegram-berichten uit, inclusief polls
    - `channels.telegram.actions.poll=false` schakelt het maken van Telegram-polls uit terwijl reguliere verzending ingeschakeld blijft

  </Accordion>

  <Accordion title="Exec-goedkeuringen in Telegram">
    Telegram ondersteunt exec-goedkeuringen in goedkeurders-DM's en kan optioneel prompts plaatsen in de oorspronkelijke chat of het oorspronkelijke onderwerp. Goedkeurders moeten numerieke Telegram-gebruikers-ID's zijn.

    Configuratiepad:

    - `channels.telegram.execApprovals.enabled` (wordt automatisch ingeschakeld wanneer ten minste één goedkeurder oplosbaar is)
    - `channels.telegram.execApprovals.approvers` (valt terug op numerieke eigenaar-ID's uit `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (standaard) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` en `defaultTo` bepalen wie met de bot kan praten en waar deze normale antwoorden naartoe stuurt. Ze maken iemand geen exec-goedkeurder. De eerste goedgekeurde DM-koppeling bootstrappt `commands.ownerAllowFrom` wanneer er nog geen opdrachteigenaar bestaat, zodat de setup met één eigenaar nog steeds werkt zonder ID's onder `execApprovals.approvers` te dupliceren.

    Kanaalbezorging toont de opdrachttekst in de chat; schakel `channel` of `both` alleen in vertrouwde groepen/onderwerpen in. Wanneer de prompt in een forumonderwerp landt, behoudt OpenClaw het onderwerp voor de goedkeuringsprompt en de opvolging. Exec-goedkeuringen verlopen standaard na 30 minuten.

    Inline goedkeuringsknoppen vereisen ook dat `channels.telegram.capabilities.inlineButtons` het doeloppervlak toestaat (`dm`, `group` of `all`). Goedkeurings-ID's met het voorvoegsel `plugin:` worden via Plugin-goedkeuringen opgelost; andere worden eerst via exec-goedkeuringen opgelost.

    Zie [Exec-goedkeuringen](/nl/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Foutantwoordbeheer

Wanneer de agent een bezorgings- of providerfout tegenkomt, kan Telegram antwoorden met de fouttekst of deze onderdrukken. Twee configuratiesleutels beheren dit gedrag:

| Sleutel                              | Waarden           | Standaard | Beschrijving                                                                                              |
| ------------------------------------ | ----------------- | --------- | --------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`      | `reply`, `silent` | `reply`   | `reply` stuurt een vriendelijke foutmelding naar de chat. `silent` onderdrukt foutantwoorden volledig.    |
| `channels.telegram.errorCooldownMs`  | getal (ms)        | `60000`   | Minimale tijd tussen foutantwoorden aan dezelfde chat. Voorkomt foutspam tijdens storingen.               |

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
  <Accordion title="Bot reageert niet op groepsberichten zonder vermelding">

    - Als `requireMention=false`, moet de privacymodus van Telegram volledige zichtbaarheid toestaan.
      - BotFather: `/setprivacy` -> Disable
      - verwijder de bot daarna uit de groep en voeg deze opnieuw toe
    - `openclaw channels status` waarschuwt wanneer de configuratie groepsberichten zonder vermelding verwacht.
    - `openclaw channels status --probe` kan expliciete numerieke groeps-ID's controleren; wildcard `"*"` kan niet op lidmaatschap worden geprobed.
    - snelle sessietest: `/activation always`.

  </Accordion>

  <Accordion title="Bot ziet helemaal geen groepsberichten">

    - wanneer `channels.telegram.groups` bestaat, moet de groep vermeld zijn (of `"*"` bevatten)
    - controleer botlidmaatschap in de groep
    - bekijk logs: `openclaw logs --follow` voor redenen voor overslaan

  </Accordion>

  <Accordion title="Opdrachten werken gedeeltelijk of helemaal niet">

    - autoriseer je afzenderidentiteit (koppeling en/of numerieke `allowFrom`)
    - opdrachtautorisatie blijft gelden, zelfs wanneer groepsbeleid `open` is
    - `setMyCommands failed` met `BOT_COMMANDS_TOO_MUCH` betekent dat het native menu te veel items heeft; verminder Plugin-/skill-/aangepaste opdrachten of schakel native menu's uit
    - `deleteMyCommands` / `setMyCommands`-opstartaanroepen en `sendChatAction`-typingaanroepen zijn begrensd en proberen één keer opnieuw via de transportfallback van Telegram bij request-timeout. Aanhoudende netwerk-/fetchfouten duiden meestal op DNS-/HTTPS-bereikbaarheidsproblemen naar `api.telegram.org`

  </Accordion>

  <Accordion title="Opstart meldt niet-geautoriseerd token">

    - `getMe returned 401` is een Telegram-authenticatiefout voor het geconfigureerde bottoken.
    - Kopieer het bottoken opnieuw of genereer het opnieuw in BotFather, werk daarna `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` of `TELEGRAM_BOT_TOKEN` bij voor het standaardaccount.
    - `deleteWebhook 401 Unauthorized` tijdens opstarten is ook een auth-fout; dit behandelen als "er bestaat geen webhook" zou dezelfde fout door een ongeldig token alleen uitstellen tot latere API-aanroepen.
    - Als `deleteWebhook` tijdens polling-opstarten faalt met een tijdelijke netwerkfout, controleert OpenClaw `getWebhookInfo`; wanneer Telegram een lege webhook-URL meldt, gaat polling door omdat de cleanup al is voldaan.

  </Accordion>

  <Accordion title="Polling- of netwerkinstabiliteit">

    - Node 22+ + aangepaste fetch/proxy kan direct afbreekgedrag veroorzaken als AbortSignal-typen niet overeenkomen.
    - Sommige hosts lossen `api.telegram.org` eerst op naar IPv6; kapotte IPv6-egress kan intermitterende Telegram API-fouten veroorzaken.
    - Als logs `TypeError: fetch failed` of `Network request for 'getUpdates' failed!` bevatten, probeert OpenClaw deze nu opnieuw als herstelbare netwerkfouten.
    - Als Telegram-sockets met een korte vaste cadans worden hergebruikt, controleer dan op een lage `channels.telegram.timeoutSeconds`; botclients klemmen geconfigureerde waarden onder de uitgaande en `getUpdates`-aanvraagbewaking, maar oudere releases konden elke poll of elk antwoord afbreken wanneer dit onder die bewaking was ingesteld.
    - Als logs `Polling stall detected` bevatten, herstart OpenClaw standaard polling en bouwt het Telegram-transport opnieuw op na 120 seconden zonder voltooide long-poll-liveness.
    - `openclaw channels status --probe` en `openclaw doctor` waarschuwen wanneer een actief pollingaccount `getUpdates` niet heeft voltooid na de opstartgratie, wanneer een actief webhookaccount `setWebhook` niet heeft voltooid na de opstartgratie, of wanneer de laatste succesvolle polling-transportactiviteit verouderd is.
    - Verhoog `channels.telegram.pollingStallThresholdMs` alleen wanneer langlopende `getUpdates`-aanroepen gezond zijn maar je host nog steeds foutieve pollingstall-herstarts meldt. Aanhoudende stalls wijzen meestal op proxy-, DNS-, IPv6- of TLS-egressproblemen tussen de host en `api.telegram.org`.
    - Telegram respecteert ook process proxy env voor Bot API-transport, inclusief `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` en hun varianten in kleine letters. `NO_PROXY` / `no_proxy` kan `api.telegram.org` nog steeds omzeilen.
    - Als de door OpenClaw beheerde proxy via `OPENCLAW_PROXY_URL` is geconfigureerd voor een serviceomgeving en er geen standaard proxy env aanwezig is, gebruikt Telegram die URL ook voor Bot API-transport.
    - Routeer Telegram API-aanroepen op VPS-hosts met onstabiele directe egress/TLS via `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ gebruikt standaard `autoSelectFamily=true` (behalve WSL2). De Telegram DNS-resultaatvolgorde respecteert eerst `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, daarna `channels.telegram.network.dnsResultOrder`, daarna de processtandaard zoals `NODE_OPTIONS=--dns-result-order=ipv4first`; als niets van toepassing is, valt Node 22+ terug op `ipv4first`.
    - Als je host WSL2 is of expliciet beter werkt met alleen-IPv4-gedrag, forceer dan familieselectie:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544-antwoorden uit het benchmarkbereik (`198.18.0.0/15`) zijn standaard al toegestaan
      voor Telegram-mediadownloads. Als een vertrouwde fake-IP- of
      transparante proxy `api.telegram.org` tijdens mediadownloads herschrijft naar een ander
      privé/intern/speciaal gebruik-adres, kun je je aanmelden
      voor de alleen-Telegram-omzeiling:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Dezelfde opt-in is per account beschikbaar op
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Als je proxy Telegram-mediahosts oplost naar `198.18.x.x`, laat de
      gevaarlijke vlag eerst uit. Telegram-media staat het RFC 2544-
      benchmarkbereik standaard al toe.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` verzwakt Telegram-
      media-SSRF-bescherming. Gebruik dit alleen voor vertrouwde, door operators beheerde proxy-
      omgevingen zoals Clash, Mihomo of Surge fake-IP-routing wanneer ze
      privé- of speciaal gebruik-antwoorden buiten het RFC 2544-benchmark-
      bereik synthetiseren. Laat dit uit voor normale openbare internettoegang tot Telegram.
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

<Accordion title="High-signal Telegram fields">

- opstarten/auth: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` moet naar een normaal bestand wijzen; symlinks worden geweigerd)
- toegangscontrole: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` op het hoogste niveau (`type: "acp"`)
- uitvoeringsgoedkeuringen: `execApprovals`, `accounts.*.execApprovals`
- opdracht/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- threads/antwoorden: `replyToMode`, `dm.threadReplies`, `direct.*.threadReplies`
- streaming: `streaming` (preview), `streaming.preview.toolProgress`, `blockStreaming`
- opmaak/levering: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- media/netwerk: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- aangepaste API-root: `apiRoot` (alleen Bot API-root; neem `/bot<TOKEN>` niet op)
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- acties/capaciteiten: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reacties: `reactionNotifications`, `reactionLevel`
- fouten: `errorPolicy`, `errorCooldownMs`
- schrijven/geschiedenis: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Prioriteit bij meerdere accounts: wanneer twee of meer account-ID's zijn geconfigureerd, stel je `channels.telegram.defaultAccount` in (of neem je `channels.telegram.accounts.default` op) om standaardroutering expliciet te maken. Anders valt OpenClaw terug op het eerste genormaliseerde account-ID en waarschuwt `openclaw doctor`. Benoemde accounts erven `channels.telegram.allowFrom` / `groupAllowFrom`, maar geen `accounts.default.*`-waarden.
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
    Dreigingsmodel en hardening.
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/nl/concepts/multi-agent">
    Koppel groepen en topics aan agents.
  </Card>
  <Card title="Troubleshooting" icon="wrench" href="/nl/channels/troubleshooting">
    Cross-channel diagnostiek.
  </Card>
</CardGroup>
