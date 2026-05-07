---
read_when:
    - BlueBubbles-kanaal instellen
    - Problemen met Webhook-koppeling oplossen
    - iMessage configureren op macOS
sidebarTitle: BlueBubbles
summary: Legacy-ondersteuning voor iMessage via de BlueBubbles macOS-server (REST-verzenden/ontvangen, typen, reacties, koppelen, geavanceerde acties).
title: BlueBubbles
x-i18n:
    generated_at: "2026-05-07T01:50:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: e32b35242c7e751b49dcd8d839bc291c80cb4d88c0b4ce6f65635b7ef2ed97c3
    source_path: channels/bluebubbles.md
    workflow: 16
---

Status: gebundelde legacy-plugin die via HTTP met de BlueBubbles macOS-server praat. Bestaande BlueBubbles-setups blijven werken, maar nieuwe OpenClaw iMessage-implementaties zouden de native [iMessage](/nl/channels/imessage)-plugin moeten verkiezen wanneer de vereisten bij je host passen.

<Warning>
BlueBubbles is verouderd voor nieuwe OpenClaw-setups.

Het upstream BlueBubbles-ecosysteem is nog steeds actief, maar OpenClaw is afhankelijk van de BlueBubbles macOS-server-API. Vanaf 6 mei 2026 is de officiële ontwikkeltak van [`bluebubbles-server`](https://github.com/BlueBubblesApp/bluebubbles-server) voor het laatst gewijzigd op [22 januari 2026](https://github.com/BlueBubblesApp/bluebubbles-server/commit/88a4921bbd5a8111f1e9582b83715cf877171037), en de nieuwste serverrelease ([`v1.9.9`](https://github.com/BlueBubblesApp/bluebubbles-server/releases/tag/v1.9.9)) is gepubliceerd op 16 mei 2025. De client-app en helper-repositories hebben recentere activiteit, dus dit is geen bewering dat het project is verlaten; de deprecatie gaat over het verminderen van OpenClaw's afhankelijkheid van een externe HTTP-server, webhooks en compatibiliteitsoppervlak met private API's wanneer het native `imsg`-pad de integratie op een lokaal stdio-contract houdt.
</Warning>

<Note>
Huidige OpenClaw-releases bundelen BlueBubbles, dus normale verpakte builds hebben geen aparte stap `openclaw plugins install` nodig.
</Note>

## Overzicht

- Draait op macOS via de BlueBubbles-helper-app ([bluebubbles.app](https://bluebubbles.app)).
- Legacy-terugval voor installaties die al afhankelijk zijn van BlueBubbles-kanaal-ID's, webhookstatus, groepsdoelen, cronbezorging of werkruimte-routering.
- Aanbevolen/getest: macOS Sequoia (15). macOS Tahoe (26) werkt; bewerken is momenteel kapot op Tahoe, en updates van groepspictogrammen kunnen succes melden maar niet synchroniseren.
- OpenClaw praat ermee via de REST-API (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- Inkomende berichten komen binnen via webhooks; uitgaande antwoorden, typindicatoren, leesbevestigingen en tapbacks zijn REST-aanroepen.
- Bijlagen en stickers worden opgenomen als inkomende media (en waar mogelijk aan de agent aangeboden).
- Auto-TTS-antwoorden die MP3- of CAF-audio synthetiseren, worden bezorgd als iMessage-spraakmemobubbels in plaats van gewone bestandsbijlagen.
- Koppelen/toestaanlijst werkt op dezelfde manier als andere kanalen (`/channels/pairing` enz.) met `channels.bluebubbles.allowFrom` + koppelcodes.
- Reacties worden als systeemgebeurtenissen aangeboden, net als bij Slack/Telegram, zodat agents ze kunnen "vermelden" voordat ze antwoorden.
- Geavanceerde functies: bewerken, verzenden ongedaan maken, antwoordthreads, berichteffecten, groepsbeheer.

## Snel starten

<Steps>
  <Step title="Install BlueBubbles">
    Installeer de BlueBubbles-server op je Mac (volg de instructies op [bluebubbles.app/install](https://bluebubbles.app/install)).
  </Step>
  <Step title="Enable the web API">
    Schakel in de BlueBubbles-configuratie de web-API in en stel een wachtwoord in.
  </Step>
  <Step title="Configure OpenClaw">
    Voer `openclaw onboard` uit en selecteer BlueBubbles, of configureer handmatig:

    ```json5
    {
      channels: {
        bluebubbles: {
          enabled: true,
          serverUrl: "http://192.168.1.100:1234",
          password: "example-password",
          webhookPath: "/bluebubbles-webhook",
        },
      },
    }
    ```

  </Step>
  <Step title="Point webhooks at the gateway">
    Richt BlueBubbles-webhooks op je gateway (voorbeeld: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
  </Step>
  <Step title="Start the gateway">
    Start de gateway; die registreert de webhook-handler en begint met koppelen.
  </Step>
</Steps>

<Warning>
**Beveiliging**

- Stel altijd een webhookwachtwoord in.
- Webhook-authenticatie is altijd vereist. OpenClaw weigert BlueBubbles-webhookverzoeken tenzij ze een wachtwoord/guid bevatten dat overeenkomt met `channels.bluebubbles.password` (bijvoorbeeld `?password=<password>` of `x-password`), ongeacht de loopback-/proxytopologie.
- Wachtwoordauthenticatie wordt gecontroleerd voordat volledige webhook-bodies worden gelezen/geparset.

</Warning>

## Messages.app actief houden (VM / headless setups)

Sommige macOS-VM- / altijd-aan-setups kunnen eindigen met Messages.app die "idle" wordt (inkomende gebeurtenissen stoppen totdat de app wordt geopend/naar de voorgrond wordt gehaald). Een eenvoudige workaround is om **Messages elke 5 minuten aan te tikken** met een AppleScript + LaunchAgent.

<Steps>
  <Step title="Save the AppleScript">
    Sla dit op als `~/Scripts/poke-messages.scpt`:

    ```applescript
    try
      tell application "Messages"
        if not running then
          launch
        end if

        -- Touch the scripting interface to keep the process responsive.
        set _chatCount to (count of chats)
      end tell
    on error
      -- Ignore transient failures (first-run prompts, locked session, etc).
    end try
    ```

  </Step>
  <Step title="Install a LaunchAgent">
    Sla dit op als `~/Library/LaunchAgents/com.user.poke-messages.plist`:

    ```xml
    <?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
    <plist version="1.0">
      <dict>
        <key>Label</key>
        <string>com.user.poke-messages</string>

        <key>ProgramArguments</key>
        <array>
          <string>/bin/bash</string>
          <string>-lc</string>
          <string>/usr/bin/osascript &quot;$HOME/Scripts/poke-messages.scpt&quot;</string>
        </array>

        <key>RunAtLoad</key>
        <true/>

        <key>StartInterval</key>
        <integer>300</integer>

        <key>StandardOutPath</key>
        <string>/tmp/poke-messages.log</string>
        <key>StandardErrorPath</key>
        <string>/tmp/poke-messages.err</string>
      </dict>
    </plist>
    ```

    Dit draait **elke 300 seconden** en **bij inloggen**. De eerste uitvoering kan macOS-**Automation**-prompts activeren (`osascript` → Messages). Keur ze goed in dezelfde gebruikerssessie die de LaunchAgent uitvoert.

  </Step>
  <Step title="Load it">
    ```bash
    launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
    launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
    ```
  </Step>
</Steps>

## Onboarding

BlueBubbles is beschikbaar in interactieve onboarding:

```
openclaw onboard
```

De wizard vraagt om:

<ParamField path="Server URL" type="string" required>
  BlueBubbles-serveradres (bijv. `http://192.168.1.100:1234`).
</ParamField>
<ParamField path="Password" type="string" required>
  API-wachtwoord uit de BlueBubbles Server-instellingen.
</ParamField>
<ParamField path="Webhook path" type="string" default="/bluebubbles-webhook">
  Webhook-eindpuntpad.
</ParamField>
<ParamField path="DM policy" type="string">
  `pairing`, `allowlist`, `open`, of `disabled`.
</ParamField>
<ParamField path="Allow list" type="string[]">
  Telefoonnummers, e-mails of chatdoelen.
</ParamField>

Je kunt BlueBubbles ook toevoegen via de CLI:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## Toegangscontrole (DM's + groepen)

<Tabs>
  <Tab title="DMs">
    - Standaard: `channels.bluebubbles.dmPolicy = "pairing"`.
    - Onbekende afzenders ontvangen een koppelcode; berichten worden genegeerd totdat ze zijn goedgekeurd (codes verlopen na 1 uur).
    - Goedkeuren via:
      - `openclaw pairing list bluebubbles`
      - `openclaw pairing approve bluebubbles <CODE>`
    - Koppelen is de standaard tokenuitwisseling. Details: [Koppelen](/nl/channels/pairing)

  </Tab>
  <Tab title="Groups">
    - `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (standaard: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom` bepaalt wie in groepen kan activeren wanneer `allowlist` is ingesteld.

  </Tab>
</Tabs>

### Verrijking van contactnamen (macOS, optioneel)

BlueBubbles-groepswebhooks bevatten vaak alleen ruwe deelnemersadressen. Als je wilt dat de `GroupMembers`-context in plaats daarvan lokale contactnamen toont, kun je je aanmelden voor lokale Contacts-verrijking op macOS:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` schakelt de lookup in. Standaard: `false`.
- Lookups worden alleen uitgevoerd nadat groepstoegang, commandoautorisatie en vermeldingsgating het bericht hebben doorgelaten.
- Alleen naamloze telefoondeelnemers worden verrijkt.
- Ruwe telefoonnummers blijven de fallback wanneer er geen lokale match wordt gevonden.

```json5
{
  channels: {
    bluebubbles: {
      enrichGroupParticipantsFromContacts: true,
    },
  },
}
```

### Vermeldingsgating (groepen)

BlueBubbles ondersteunt vermeldingsgating voor groepschats, passend bij iMessage-/WhatsApp-gedrag:

- Gebruikt `agents.list[].groupChat.mentionPatterns` (of `messages.groupChat.mentionPatterns`) om vermeldingen te detecteren.
- Wanneer `requireMention` is ingeschakeld voor een groep, antwoordt de agent alleen wanneer die wordt vermeld.
- Controlecommando's van geautoriseerde afzenders omzeilen vermeldingsgating.

Configuratie per groep:

```json5
{
  channels: {
    bluebubbles: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true }, // default for all groups
        "iMessage;-;chat123": { requireMention: false }, // override for specific group
      },
    },
  },
}
```

### Commandogating

- Controlecommando's (bijv. `/config`, `/model`) vereisen autorisatie.
- Gebruikt `allowFrom` en `groupAllowFrom` om commandoautorisatie te bepalen.
- Geautoriseerde afzenders kunnen controlecommando's uitvoeren, zelfs zonder vermelding in groepen.

### Systeemprompt per groep

Elke vermelding onder `channels.bluebubbles.groups.*` accepteert een optionele `systemPrompt`-string. De waarde wordt geïnjecteerd in de systeemprompt van de agent bij elke beurt die een bericht in die groep behandelt, zodat je per groep persona- of gedragsregels kunt instellen zonder agentprompts te bewerken:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;-;chat123": {
          systemPrompt: "Keep responses under 3 sentences. Mirror the group's casual tone.",
        },
      },
    },
  },
}
```

De sleutel komt overeen met wat BlueBubbles meldt als `chatGuid` / `chatIdentifier` / numerieke `chatId` voor de groep, en een `"*"`-wildcardvermelding biedt een standaard voor elke groep zonder exacte match (hetzelfde patroon dat wordt gebruikt door `requireMention` en toolbeleid per groep). Exacte matches winnen altijd van de wildcard. DM's negeren dit veld; gebruik in plaats daarvan promptaanpassing op agent- of accountniveau.

#### Uitgewerkt voorbeeld: gethreadde antwoorden en tapback-reacties (private API)

Met de BlueBubbles private API ingeschakeld komen inkomende berichten binnen met korte bericht-ID's (bijvoorbeeld `[[reply_to:5]]`) en kan de agent `action=reply` aanroepen om in een specifiek bericht te threaden of `action=react` om een tapback te plaatsen. Een `systemPrompt` per groep is een betrouwbare manier om de agent de juiste tool te laten kiezen:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: "When replying in this group, always call action=reply with the [[reply_to:N]] messageId from context so your response threads under the triggering message. Never send a new unlinked message. For short acknowledgements ('ok', 'got it', 'on it'), use action=react with an appropriate tapback emoji (❤️, 👍, 😂, ‼️, ❓) instead of sending a text reply.",
        },
      },
    },
  },
}
```

Tapback-reacties en gethreadde antwoorden vereisen beide de BlueBubbles private API; zie [Geavanceerde acties](#advanced-actions) en [Bericht-ID's](#message-ids-short-vs-full) voor de onderliggende mechanismen.

## ACP-gespreksbindingen

BlueBubbles-chats kunnen worden omgezet in duurzame ACP-werkruimten zonder de transportlaag te wijzigen.

Snelle operatorflow:

- Voer `/acp spawn codex --bind here` uit in de DM of toegestane groepschat.
- Toekomstige berichten in datzelfde BlueBubbles-gesprek worden naar de gespawnde ACP-sessie gerouteerd.
- `/new` en `/reset` resetten dezelfde gebonden ACP-sessie ter plekke.
- `/acp close` sluit de ACP-sessie en verwijdert de binding.

Geconfigureerde persistente bindingen worden ook ondersteund via top-level `bindings[]`-vermeldingen met `type: "acp"` en `match.channel: "bluebubbles"`.

`match.peer.id` kan elke ondersteunde BlueBubbles-doelvorm gebruiken:

- genormaliseerde DM-handle zoals `+15555550123` of `user@example.com`
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

Voor stabiele groepskoppelingen geef je de voorkeur aan `chat_id:*` of `chat_identifier:*`.

Voorbeeld:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: { agent: "codex", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "bluebubbles",
        accountId: "default",
        peer: { kind: "dm", id: "+15555550123" },
      },
      acp: { label: "codex-imessage" },
    },
  ],
}
```

Zie [ACP-agenten](/nl/tools/acp-agents) voor gedeeld gedrag van ACP-koppelingen.

## Typen + leesbevestigingen

- **Typindicatoren**: Worden automatisch verzonden vóór en tijdens het genereren van antwoorden.
- **Leesbevestigingen**: Beheerd door `channels.bluebubbles.sendReadReceipts` (standaard: `true`).
- **Typindicatoren**: OpenClaw verzendt gebeurtenissen voor starten met typen; BlueBubbles wist typen automatisch bij verzenden of timeout (handmatig stoppen via DELETE is onbetrouwbaar).

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // disable read receipts
    },
  },
}
```

## Geavanceerde acties

BlueBubbles ondersteunt geavanceerde berichtacties wanneer deze zijn ingeschakeld in de configuratie:

```json5
{
  channels: {
    bluebubbles: {
      actions: {
        reactions: true, // tapbacks (default: true)
        edit: true, // edit sent messages (macOS 13+, broken on macOS 26 Tahoe)
        unsend: true, // unsend messages (macOS 13+)
        reply: true, // reply threading by message GUID
        sendWithEffect: true, // message effects (slam, loud, etc.)
        renameGroup: true, // rename group chats
        setGroupIcon: true, // set group chat icon/photo (flaky on macOS 26 Tahoe)
        addParticipant: true, // add participants to groups
        removeParticipant: true, // remove participants from groups
        leaveGroup: true, // leave group chats
        sendAttachment: true, // send attachments/media
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Beschikbare acties">
    - **react**: Voeg tapback-reacties toe of verwijder ze (`messageId`, `emoji`, `remove`). De native tapback-set van iMessage is `love`, `like`, `dislike`, `laugh`, `emphasize` en `question`. Wanneer een agent een emoji buiten die set kiest (bijvoorbeeld `👀`), valt de reactietool terug op `love`, zodat de tapback nog steeds wordt weergegeven in plaats van dat het hele verzoek mislukt. Geconfigureerde ack-reacties worden nog steeds strikt gevalideerd en geven een fout bij onbekende waarden.
    - **edit**: Bewerk een verzonden bericht (`messageId`, `text`).
    - **unsend**: Trek een bericht in (`messageId`).
    - **reply**: Antwoord op een specifiek bericht (`messageId`, `text`, `to`).
    - **sendWithEffect**: Verstuur met iMessage-effect (`text`, `to`, `effectId`).
    - **renameGroup**: Wijzig de naam van een groepschat (`chatGuid`, `displayName`).
    - **setGroupIcon**: Stel het pictogram/de foto van een groepschat in (`chatGuid`, `media`) - instabiel op macOS 26 Tahoe (API kan succes retourneren, maar het pictogram wordt niet gesynchroniseerd).
    - **addParticipant**: Voeg iemand toe aan een groep (`chatGuid`, `address`).
    - **removeParticipant**: Verwijder iemand uit een groep (`chatGuid`, `address`).
    - **leaveGroup**: Verlaat een groepschat (`chatGuid`).
    - **upload-file**: Verstuur media/bestanden (`to`, `buffer`, `filename`, `asVoice`).
      - Spraakmemo's: stel `asVoice: true` in met **MP3**- of **CAF**-audio om als een iMessage-spraakbericht te verzenden. BlueBubbles converteert MP3 → CAF bij het verzenden van spraakmemo's.
    - Verouderde alias: `sendAttachment` werkt nog steeds, maar `upload-file` is de canonieke actienaam.

  </Accordion>
</AccordionGroup>

### Bericht-ID's (kort versus volledig)

OpenClaw kan _korte_ bericht-ID's (bijv. `1`, `2`) tonen om tokens te besparen.

- `MessageSid` / `ReplyToId` kunnen korte ID's zijn.
- `MessageSidFull` / `ReplyToIdFull` bevatten de volledige ID's van de provider.
- Korte ID's bevinden zich in het geheugen; ze kunnen verlopen bij een herstart of cacheverwijdering.
- Acties accepteren korte of volledige `messageId`, maar korte ID's geven een fout als ze niet langer beschikbaar zijn.

Gebruik volledige ID's voor duurzame automatiseringen en opslag:

- Sjablonen: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Context: `MessageSidFull` / `ReplyToIdFull` in inkomende payloads

Zie [Configuratie](/nl/gateway/configuration) voor sjabloonvariabelen.

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## Gesplitst verzonden DM's samenvoegen (opdracht + URL in één compositie)

Wanneer een gebruiker in iMessage een opdracht en een URL samen typt - bijvoorbeeld `Dump https://example.com/article` - splitst Apple de verzending in **twee afzonderlijke Webhook-leveringen**:

1. Een tekstbericht (`"Dump"`).
2. Een URL-voorbeeldballon (`"https://..."`) met OG-voorbeeldafbeeldingen als bijlagen.

De twee Webhooks komen bij de meeste configuraties ~0,8-2,0 s na elkaar binnen bij OpenClaw. Zonder samenvoeging ontvangt de agent alleen de opdracht in beurt 1, antwoordt deze (vaak "stuur me de URL") en ziet hij de URL pas in beurt 2 - waarna de opdrachtcontext al verloren is.

`channels.bluebubbles.coalesceSameSenderDms` laat een DM opeenvolgende Webhooks van dezelfde afzender samenvoegen tot één agentbeurt. Groepschats blijven per bericht sleutel gebruiken, zodat de beurtstructuur met meerdere gebruikers behouden blijft.

<Tabs>
  <Tab title="Wanneer inschakelen">
    Schakel dit in wanneer:

    - Je Skills levert die `command + payload` in één bericht verwachten (dump, paste, save, queue, enz.).
    - Je gebruikers URL's, afbeeldingen of lange inhoud naast opdrachten plakken.
    - Je de extra DM-beurtlatentie kunt accepteren (zie hieronder).

    Laat dit uitgeschakeld wanneer:

    - Je minimale opdrachtlatentie nodig hebt voor DM-triggers van één woord.
    - Al je flows eenmalige opdrachten zonder payload-opvolgingen zijn.

  </Tab>
  <Tab title="Inschakelen">
    ```json5
    {
      channels: {
        bluebubbles: {
          coalesceSameSenderDms: true, // opt in (default: false)
        },
      },
    }
    ```

    Met de vlag aan en zonder expliciete `messages.inbound.byChannel.bluebubbles` wordt het debounce-venster verbreed naar **2500 ms** (de standaard voor niet-samenvoegen is 500 ms). Het bredere venster is vereist - Apple's gesplitste verzendcadans van 0,8-2,0 s past niet binnen de strakkere standaardwaarde.

    Om het venster zelf af te stemmen:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 2500 ms works for most setups; raise to 4000 ms if your Mac is slow
            // or under memory pressure (observed gap can stretch past 2 s then).
            bluebubbles: 2500,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Afwegingen">
    - **Extra latentie voor DM-besturingsopdrachten.** Met de vlag aan wachten DM-berichten met besturingsopdrachten (zoals `Dump`, `Save`, enz.) nu tot maximaal het debounce-venster voordat ze worden verzonden, voor het geval er een payload-Webhook aankomt. Groepschatopdrachten blijven direct verzenden.
    - **Samengevoegde uitvoer is begrensd** - samengevoegde tekst is beperkt tot 4000 tekens met een expliciete markering `…[truncated]`; bijlagen zijn beperkt tot 20; bronvermeldingen zijn beperkt tot 10 (eerste-plus-laatste blijven daarna behouden). Elke bron-`messageId` bereikt nog steeds inkomende deduplicatie, zodat een latere MessagePoller-herhaling van een individuele gebeurtenis als duplicaat wordt herkend.
    - **Opt-in, per kanaal.** Andere kanalen (Telegram, WhatsApp, Slack, …) worden niet beïnvloed.

  </Tab>
</Tabs>

### Scenario's en wat de agent ziet

| Gebruiker stelt op                                                | Apple levert              | Vlag uit (standaard)                    | Vlag aan + venster van 2500 ms                                          |
| ------------------------------------------------------------------ | ------------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (één verzending)                        | 2 Webhooks ~1 s uit elkaar | Twee agentbeurten: alleen "Dump", daarna URL | Eén beurt: samengevoegde tekst `Dump https://example.com`               |
| `Save this 📎image.jpg caption` (bijlage + tekst)                  | 2 Webhooks                | Twee beurten                            | Eén beurt: tekst + afbeelding                                           |
| `/status` (zelfstandige opdracht)                                  | 1 Webhook                 | Directe verzending                      | **Wacht tot maximaal het venster en verzend dan**                       |
| URL alleen geplakt                                                 | 1 Webhook                 | Directe verzending                      | Directe verzending (slechts één item in bucket)                         |
| Tekst + URL verzonden als twee bewust afzonderlijke berichten, minuten uit elkaar | 2 Webhooks buiten venster | Twee beurten                            | Twee beurten (venster verloopt ertussen)                                |
| Snelle stroom (>10 kleine DM's binnen venster)                     | N Webhooks                | N beurten                               | Eén beurt, begrensde uitvoer (eerste + laatste, tekst-/bijlagelimieten toegepast) |

### Probleemoplossing voor samenvoeging van gesplitste verzendingen

Als de vlag aan staat en gesplitste verzendingen nog steeds als twee beurten binnenkomen, controleer dan elke laag:

<AccordionGroup>
  <Accordion title="Configuratie daadwerkelijk geladen">
    ```
    grep coalesceSameSenderDms ~/.openclaw/openclaw.json
    ```

    Daarna `openclaw gateway restart` - de vlag wordt gelezen bij het maken van de debouncer-registry.

  </Accordion>
  <Accordion title="Debounce-venster breed genoeg voor je configuratie">
    Kijk naar het BlueBubbles-serverlog onder `~/Library/Logs/bluebubbles-server/main.log`:

    ```
    grep -E "Dispatching event to webhook" main.log | tail -20
    ```

    Meet de kloof tussen de tekstverzending in `"Dump"`-stijl en de daaropvolgende `"https://..."; Attachments:`-verzending. Verhoog `messages.inbound.byChannel.bluebubbles` zodat die kloof ruim wordt afgedekt.

  </Accordion>
  <Accordion title="Session JSONL-tijdstempels ≠ aankomst van Webhook">
    Tijdstempels van sessiegebeurtenissen (`~/.openclaw/agents/<id>/sessions/*.jsonl`) geven weer wanneer de gateway een bericht aan de agent doorgeeft, **niet** wanneer de Webhook is aangekomen. Een tweede bericht in de wachtrij met tag `[Queued messages while agent was busy]` betekent dat de eerste beurt nog liep toen de tweede Webhook aankwam - de samenvoegbucket was al geleegd. Stem het venster af op het BB-serverlog, niet op het sessielog.
  </Accordion>
  <Accordion title="Geheugendruk vertraagt antwoordverzending">
    Op kleinere machines (8 GB) kunnen agentbeurten lang genoeg duren dat de samenvoegbucket wordt geleegd voordat het antwoord is voltooid, en de URL als tweede beurt in de wachtrij belandt. Controleer `memory_pressure` en `ps -o rss -p $(pgrep openclaw-gateway)`; als de Gateway boven ~500 MB RSS zit en de compressor actief is, sluit dan andere zware processen of stap over op een grotere host.
  </Accordion>
  <Accordion title="Verzendingen met antwoordcitaat volgen een ander pad">
    Als de gebruiker op `Dump` tikte als **antwoord** op een bestaande URL-ballon (iMessage toont een badge "1 Reply" op de Dump-ballon), staat de URL in `replyToBody`, niet in een tweede Webhook. Samenvoeging is niet van toepassing - dat is een Skills-/prompt-aandachtspunt, geen debouncer-aandachtspunt.
  </Accordion>
</AccordionGroup>

## Blokstreaming

Bepaal of antwoorden als één bericht worden verzonden of in blokken worden gestreamd:

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // enable block streaming (off by default)
    },
  },
}
```

## Media + limieten

- Inkomende bijlagen worden gedownload en opgeslagen in de mediacache.
- Medialimiet via `channels.bluebubbles.mediaMaxMb` voor inkomende en uitgaande media (standaard: 8 MB).
- Uitgaande tekst wordt opgesplitst volgens `channels.bluebubbles.textChunkLimit` (standaard: 4000 tekens).

## Configuratiereferentie

Volledige configuratie: [Configuratie](/nl/gateway/configuration)

<AccordionGroup>
  <Accordion title="Connection and webhook">
    - `channels.bluebubbles.enabled`: Schakel het kanaal in/uit.
    - `channels.bluebubbles.serverUrl`: Basis-URL van de BlueBubbles REST-API.
    - `channels.bluebubbles.password`: API-wachtwoord.
    - `channels.bluebubbles.webhookPath`: Pad voor het Webhook-eindpunt (standaard: `/bluebubbles-webhook`).

  </Accordion>
  <Accordion title="Access policy">
    - `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (standaard: `pairing`).
    - `channels.bluebubbles.allowFrom`: Allowlist voor DM's (handles, e-mails, E.164-nummers, `chat_id:*`, `chat_guid:*`).
    - `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (standaard: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom`: Allowlist voor groepsafzenders.
    - `channels.bluebubbles.enrichGroupParticipantsFromContacts`: Op macOS optioneel naamloze groepsdeelnemers verrijken vanuit lokale Contacten nadat gating is geslaagd. Standaard: `false`.
    - `channels.bluebubbles.groups`: Configuratie per groep (`requireMention`, enz.).

  </Accordion>
  <Accordion title="Delivery and chunking">
    - `channels.bluebubbles.sendReadReceipts`: Verstuur leesbevestigingen (standaard: `true`).
    - `channels.bluebubbles.blockStreaming`: Schakel blockstreaming in (standaard: `false`; vereist voor streamingantwoorden).
    - `channels.bluebubbles.textChunkLimit`: Grootte van uitgaande chunks in tekens (standaard: 4000).
    - `channels.bluebubbles.sendTimeoutMs`: Time-out per aanvraag in ms voor uitgaande tekstverzendingen via `/api/v1/message/text` (standaard: 30000). Verhoog dit op macOS 26-installaties waarbij iMessage-verzendingen via de Private API 60+ seconden kunnen vastlopen binnen het iMessage-framework; bijvoorbeeld `45000` of `60000`. Probes, chatopzoekingen, reacties, bewerkingen en gezondheidscontroles behouden momenteel de kortere standaard van 10 s; uitbreiding van de dekking naar reacties en bewerkingen is gepland als vervolg. Overschrijving per account: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
    - `channels.bluebubbles.chunkMode`: `length` (standaard) splitst alleen wanneer `textChunkLimit` wordt overschreden; `newline` splitst op lege regels (alineagrenzen) vóór chunking op lengte.

  </Accordion>
  <Accordion title="Media and history">
    - `channels.bluebubbles.mediaMaxMb`: Limiet voor inkomende/uitgaande media in MB (standaard: 8).
    - `channels.bluebubbles.mediaLocalRoots`: Expliciete allowlist van absolute lokale mappen die zijn toegestaan voor uitgaande lokale mediapaden. Verzendingen via lokale paden worden standaard geweigerd tenzij dit is geconfigureerd. Overschrijving per account: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
    - `channels.bluebubbles.coalesceSameSenderDms`: Voeg opeenvolgende DM-Webhooks van dezelfde afzender samen tot één agentbeurt, zodat Apple's gesplitste verzending van tekst+URL als één bericht aankomt (standaard: `false`). Zie [Gesplitst verzonden DM's samenvoegen](#coalescing-split-send-dms-command--url-in-one-composition) voor scenario's, vensterafstemming en afwegingen. Vergroot het standaard debouncevenster voor inkomende berichten van 500 ms naar 2500 ms wanneer dit is ingeschakeld zonder expliciete `messages.inbound.byChannel.bluebubbles`.
    - `channels.bluebubbles.historyLimit`: Maximumaantal groepsberichten voor context (0 schakelt uit).
    - `channels.bluebubbles.dmHistoryLimit`: Geschiedenisl limiet voor DM's.
    - `channels.bluebubbles.replyContextApiFallback`: Wanneer een inkomend antwoord binnenkomt zonder `replyToBody`/`replyToSender` en de in-memory reply-contextcache mist, haal dan het oorspronkelijke bericht op via de BlueBubbles HTTP-API als best-effort fallback (standaard: `false`). Nuttig voor implementaties met meerdere instanties die één BlueBubbles-account delen, na procesherstarts of na het verwijderen uit een langlevende TTL/LRU-cache. De fetch wordt beschermd tegen SSRF door hetzelfde beleid als elke andere BlueBubbles-clientaanvraag, gooit nooit een fout en vult de cache zodat volgende antwoorden worden geamortiseerd. Overschrijving per account: `channels.bluebubbles.accounts.<accountId>.replyContextApiFallback`. Een instelling op kanaalniveau wordt doorgegeven aan accounts die de vlag weglaten.

  </Accordion>
  <Accordion title="Actions and accounts">
    - `channels.bluebubbles.actions`: Schakel specifieke acties in/uit.
    - `channels.bluebubbles.accounts`: Configuratie voor meerdere accounts.

  </Accordion>
</AccordionGroup>

Gerelateerde globale opties:

- `agents.list[].groupChat.mentionPatterns` (of `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## Adressering / afleveringsdoelen

Geef de voorkeur aan `chat_guid` voor stabiele routering:

- `chat_guid:iMessage;-;+15555550123` (aanbevolen voor groepen)
- `chat_id:123`
- `chat_identifier:...`
- Directe handles: `+15555550123`, `user@example.com`
  - Als een directe handle geen bestaande DM-chat heeft, maakt OpenClaw er een via `POST /api/v1/chat/new`. Hiervoor moet de BlueBubbles Private API zijn ingeschakeld.

### Routering via iMessage versus SMS

Wanneer dezelfde handle zowel een iMessage- als een SMS-chat op de Mac heeft (bijvoorbeeld een telefoonnummer dat voor iMessage is geregistreerd maar ook green-bubble fallbacks heeft ontvangen), geeft OpenClaw de voorkeur aan de iMessage-chat en degradeert het nooit stilzwijgend naar SMS. Gebruik een expliciet `sms:`-doelprefix om de SMS-chat te forceren (bijvoorbeeld `sms:+15555550123`). Handles zonder overeenkomende iMessage-chat worden nog steeds verzonden via de chat die BlueBubbles rapporteert.

## Beveiliging

- Webhook-aanvragen worden geauthenticeerd door `guid`/`password`-queryparameters of headers te vergelijken met `channels.bluebubbles.password`.
- Houd het API-wachtwoord en het Webhook-eindpunt geheim (behandel ze als referenties).
- Er is geen localhost-bypass voor BlueBubbles Webhook-authenticatie. Als je Webhook-verkeer proxyt, houd dan het BlueBubbles-wachtwoord end-to-end op de aanvraag. `gateway.trustedProxies` vervangt hier `channels.bluebubbles.password` niet. Zie [Gateway-beveiliging](/nl/gateway/security#reverse-proxy-configuration).
- Schakel HTTPS + firewallregels in op de BlueBubbles-server als je deze buiten je LAN beschikbaar maakt.

## Probleemoplossing

- Als typ-/leesgebeurtenissen niet meer werken, controleer dan de BlueBubbles Webhook-logs en verifieer dat het Gateway-pad overeenkomt met `channels.bluebubbles.webhookPath`.
- Koppelingscodes verlopen na één uur; gebruik `openclaw pairing list bluebubbles` en `openclaw pairing approve bluebubbles <code>`.
- Reacties vereisen de BlueBubbles private API (`POST /api/v1/message/react`); zorg ervoor dat de serverversie deze beschikbaar stelt.
- Bewerken/verzenden ongedaan maken vereist macOS 13+ en een compatibele BlueBubbles-serverversie. Op macOS 26 (Tahoe) werkt bewerken momenteel niet door wijzigingen in de private API.
- Updates van groepspictogrammen kunnen onbetrouwbaar zijn op macOS 26 (Tahoe): de API kan succes retourneren terwijl het nieuwe pictogram niet synchroniseert.
- OpenClaw verbergt automatisch bekende defecte acties op basis van de macOS-versie van de BlueBubbles-server. Als bewerken nog steeds verschijnt op macOS 26 (Tahoe), schakel het dan handmatig uit met `channels.bluebubbles.actions.edit=false`.
- `coalesceSameSenderDms` ingeschakeld maar gesplitste verzendingen (bijv. `Dump` + URL) komen nog steeds als twee beurten binnen: zie de controlelijst voor [probleemoplossing voor samenvoegen van gesplitste verzendingen](#split-send-coalescing-troubleshooting) - veelvoorkomende oorzaken zijn een te krap debouncevenster, sessielogtijdstempels die worden verward met Webhook-aankomst, of een verzending met antwoordcitaat (die `replyToBody` gebruikt, geen tweede Webhook).
- Voor status-/gezondheidsinformatie: `openclaw status --all` of `openclaw status --deep`.

Zie voor algemene referentie over kanaalworkflows [Kanalen](/nl/channels) en de gids [Plugins](/nl/tools/plugin).

## Gerelateerd

- [Kanaalroutering](/nl/channels/channel-routing) - sessieroutering voor berichten
- [Overzicht van kanalen](/nl/channels) - alle ondersteunde kanalen
- [Groepen](/nl/channels/groups) - gedrag van groepschats en mention-gating
- [Koppeling](/nl/channels/pairing) - DM-authenticatie en koppelingsflow
- [Beveiliging](/nl/gateway/security) - toegangsmodel en verharding
