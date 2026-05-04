---
read_when:
    - Uitleg over hoe inkomende berichten antwoorden worden
    - Sessies, wachtrijmodi of streaminggedrag verduidelijken
    - Zichtbaarheid van redeneringen en gevolgen voor gebruik documenteren
summary: Berichtenstroom, sessies, wachtrijvorming en zichtbaarheid van redeneringen
title: Berichten
x-i18n:
    generated_at: "2026-05-04T07:03:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 15242e21fd17a9f2013561003e108d197204d834caf51bbcdc53ffb3f118b14f
    source_path: concepts/messages.md
    workflow: 16
---

OpenClaw verwerkt inkomende berichten via een pipeline van sessieresolutie, wachtrijen, streaming, tooluitvoering en zichtbaarheid van redeneringen. Deze pagina brengt het pad van inkomend bericht naar antwoord in kaart.

## Berichtenstroom (hoog niveau)

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

Belangrijke knoppen staan in de configuratie:

- `messages.*` voor voorvoegsels, wachtrijen en groepsgedrag.
- `agents.defaults.*` voor standaardinstellingen voor blokstreaming en chunking.
- Kanaaloverschrijvingen (`channels.whatsapp.*`, `channels.telegram.*`, enz.) voor limieten en streaming-schakelaars.

Zie [Configuratie](/nl/gateway/configuration) voor het volledige schema.

## Inkomende deduplicatie

Kanalen kunnen hetzelfde bericht opnieuw afleveren na herverbindingen. OpenClaw houdt een kortlevende cache bij, met als sleutel kanaal/account/peer/sessie/bericht-id, zodat dubbele afleveringen geen nieuwe agent-run starten.

## Inkomende debouncing

Snelle opeenvolgende berichten van **dezelfde afzender** kunnen via `messages.inbound` worden gebundeld in één agent-beurt. Debouncing is afgebakend per kanaal + gesprek en gebruikt het meest recente bericht voor antwoord-threading/ID's.

Configuratie (globale standaard + overschrijvingen per kanaal):

```json5
{
  messages: {
    inbound: {
      debounceMs: 2000,
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
        discord: 1500,
      },
    },
  },
}
```

Opmerkingen:

- Debounce geldt voor berichten met **alleen tekst**; media/bijlagen worden onmiddellijk geflusht.
- Besturingscommando's omzeilen debouncing zodat ze zelfstandig blijven — **behalve** wanneer een kanaal expliciet kiest voor DM-samenvoeging van dezelfde afzender (bijv. [BlueBubbles `coalesceSameSenderDms`](/nl/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)), waarbij DM-commando's binnen het debounce-venster wachten zodat een gesplitst verzonden payload kan aansluiten bij dezelfde agent-beurt.

## Sessies en apparaten

Sessies zijn eigendom van de Gateway, niet van clients.

- Directe chats worden samengevouwen naar de hoofdsessiesleutel van de agent.
- Groepen/kanalen krijgen hun eigen sessiesleutels.
- De sessieopslag en transcripties staan op de Gateway-host.

Meerdere apparaten/kanalen kunnen aan dezelfde sessie worden gekoppeld, maar geschiedenis wordt niet volledig terug gesynchroniseerd naar elke client. Aanbeveling: gebruik één primair apparaat voor lange gesprekken om uiteenlopende context te vermijden. De Control UI en TUI tonen altijd de door de Gateway ondersteunde sessietranscriptie, dus die zijn de bron van waarheid.

Details: [Sessiebeheer](/nl/concepts/session).

## Metadata van toolresultaten

Toolresultaat `content` is het model-zichtbare resultaat. Toolresultaat `details` is runtime-metadata voor UI-rendering, diagnostiek, media-aflevering en plugins.

OpenClaw houdt die grens expliciet:

- `toolResult.details` wordt gestript vóór provider-replay en Compaction-invoer.
- Gepersisteerde sessietranscripties bewaren alleen begrensde `details`; te grote metadata wordt vervangen door een compacte samenvatting gemarkeerd met `persistedDetailsTruncated: true`.
- Plugins en tools moeten tekst die het model moet lezen in `content` zetten, niet alleen in `details`.

## Inkomende bodies en geschiedeniscontext

OpenClaw scheidt de **prompt-body** van de **commando-body**:

- `BodyForAgent`: primaire modelgerichte tekst voor het huidige bericht. Kanaalplugins moeten dit gericht houden op de huidige prompt-dragende tekst van de afzender.
- `Body`: legacy prompt-fallback. Dit kan kanaalenveloppen en optionele geschiedeniswrappers bevatten, maar huidige kanalen moeten er niet op vertrouwen als primaire modelinvoer wanneer `BodyForAgent` beschikbaar is.
- `CommandBody`: ruwe gebruikerstekst voor directive-/commandoparsing.
- `RawBody`: legacy alias voor `CommandBody` (behouden voor compatibiliteit).

Wanneer een kanaal geschiedenis aanlevert, gebruikt het een gedeelde wrapper:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Voor **niet-directe chats** (groepen/kanalen/ruimtes) krijgt de **huidige berichttekst** het afzenderlabel als voorvoegsel (dezelfde stijl als voor geschiedenisitems). Hierdoor blijven realtime en in de wachtrij geplaatste/geschiedenisberichten consistent in de agent-prompt.

Geschiedenisbuffers zijn **alleen pending**: ze bevatten groepsberichten die _geen_ run hebben geactiveerd (bijvoorbeeld berichten achter mention-gating) en **sluiten** berichten uit die al in de sessietranscriptie staan.

Directive-stripping geldt alleen voor de sectie **huidig bericht**, zodat geschiedenis intact blijft. Kanalen die geschiedenis wrappen moeten `CommandBody` (of `RawBody`) instellen op de oorspronkelijke berichttekst en `Body` behouden als de gecombineerde prompt. Gestructureerde geschiedenis, antwoord-, doorgestuurde en kanaalmetadata worden tijdens promptassemblage gerenderd als niet-vertrouwde contextblokken met gebruikersrol.
Geschiedenisbuffers zijn configureerbaar via `messages.groupChat.historyLimit` (globale standaard) en overschrijvingen per kanaal zoals `channels.slack.historyLimit` of `channels.telegram.accounts.<id>.historyLimit` (stel `0` in om uit te schakelen).

## Wachtrijen en follow-ups

Als er al een run actief is, kunnen inkomende berichten in de wachtrij worden geplaatst, naar de huidige run worden gestuurd of worden verzameld voor een follow-upbeurt.

- Configureer via `messages.queue` (en `messages.queue.byChannel`).
- De standaardmodus is `steer`, met een follow-up-debounce van 500 ms wanneer sturen terugvalt op aflevering als follow-up in de wachtrij.
- Modi: `steer`, `followup`, `collect`, `steer-backlog`, `interrupt` en de legacy één-tegelijk-`queue`-modus.

Details: [Commandowachtrij](/nl/concepts/queue) en [Sturingswachtrij](/nl/concepts/queue-steering).

## Eigenaarschap van kanaal-runs

Kanaalplugins mogen volgorde behouden, invoer debouncen en transport-backpressure toepassen voordat een bericht de sessiewachtrij binnenkomt. Ze moeten geen aparte timeout opleggen rond de agent-beurt zelf. Zodra een bericht naar een sessie is gerouteerd, wordt langlopende verwerking beheerd door de sessie-, tool- en runtime-levenscyclus, zodat alle kanalen traag verlopende beurten consistent rapporteren en herstellen.

## Streaming, chunking en batching

Blokstreaming verzendt gedeeltelijke antwoorden terwijl het model tekstblokken produceert. Chunking respecteert tekstlimieten van kanalen en voorkomt het splitsen van fenced code.

Belangrijke instellingen:

- `agents.defaults.blockStreamingDefault` (`on|off`, standaard uit)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (batching op basis van idle-tijd)
- `agents.defaults.humanDelay` (mensachtige pauze tussen blokantwoorden)
- Kanaaloverschrijvingen: `*.blockStreaming` en `*.blockStreamingCoalesce` (niet-Telegram-kanalen vereisen expliciet `*.blockStreaming: true`)

Details: [Streaming + chunking](/nl/concepts/streaming).

## Zichtbaarheid van redeneringen en tokens

OpenClaw kan modelredenering tonen of verbergen:

- `/reasoning on|off|stream` regelt de zichtbaarheid.
- Redeneercontent telt nog steeds mee voor tokengebruik wanneer die door het model wordt geproduceerd.
- Telegram ondersteunt redeneerstreaming naar een tijdelijke conceptballon die na definitieve aflevering wordt verwijderd; gebruik `/reasoning on` voor blijvende redeneeruitvoer.

Details: [Denk- en redeneer-directives](/nl/tools/thinking) en [Tokengebruik](/nl/reference/token-use).

## Voorvoegsels, threading en antwoorden

Opmaak van uitgaande berichten is gecentraliseerd in `messages`:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` en `channels.<channel>.accounts.<id>.responsePrefix` (cascade van uitgaande voorvoegsels), plus `channels.whatsapp.messagePrefix` (WhatsApp-voorvoegsel voor inkomende berichten)
- Antwoord-threading via `replyToMode` en standaarden per kanaal

Details: [Configuratie](/nl/gateway/config-agents#messages) en kanaaldocumentatie.

## Stille antwoorden

Het exacte stille token `NO_REPLY` / `no_reply` betekent “lever geen voor de gebruiker zichtbaar antwoord af”.
Wanneer een beurt ook pending toolmedia heeft, zoals gegenereerde TTS-audio, stript OpenClaw de stille tekst maar levert het de mediabijlage nog steeds af.
OpenClaw lost dat gedrag op per gesprekstype:

- Directe gesprekken staan stilte standaard niet toe en herschrijven een kaal stil antwoord naar een korte zichtbare fallback.
- Groepen/kanalen staan stilte standaard toe.
- Interne orkestratie staat stilte standaard toe.

OpenClaw gebruikt stille antwoorden ook voor interne runner-fouten die plaatsvinden vóór enig assistent-antwoord in niet-directe chats, zodat groepen/kanalen geen standaard Gateway-fouttekst zien. Directe chats tonen standaard compacte fouttekst; ruwe runner-details worden alleen getoond wanneer `/verbose` `on` of `full` is.

Standaarden staan onder `agents.defaults.silentReply` en `agents.defaults.silentReplyRewrite`; `surfaces.<id>.silentReply` en `surfaces.<id>.silentReplyRewrite` kunnen ze per surface overschrijven.

Wanneer de bovenliggende sessie één of meer pending gespawnde subagent-runs heeft, worden kale stille antwoorden op alle surfaces gedropt in plaats van herschreven, zodat de parent stil blijft totdat de completion-event van het child het echte antwoord aflevert.

## Gerelateerd

- [Streaming](/nl/concepts/streaming) — realtime berichtaflevering
- [Opnieuw proberen](/nl/concepts/retry) — retry-gedrag voor berichtaflevering
- [Wachtrij](/nl/concepts/queue) — wachtrij voor berichtverwerking
- [Kanalen](/nl/channels) — integraties met berichtenplatforms
