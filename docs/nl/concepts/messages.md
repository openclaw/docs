---
read_when:
    - Uitleg hoe inkomende berichten antwoorden worden
    - Sessies, wachtrijmodi of streaminggedrag verduidelijken
    - Documenteren van de zichtbaarheid van redenering en gevolgen voor gebruik
summary: Berichtenstroom, sessies, wachtrijvorming en zichtbaarheid van redenering
title: Berichten
x-i18n:
    generated_at: "2026-04-30T16:28:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: fdeee014d92767a725501691fbe0c4ee6b631acc9a2ab5cbbcf321bfee9679b9
    source_path: concepts/messages.md
    workflow: 16
---

OpenClaw verwerkt inkomende berichten via een pipeline van sessie-resolutie, wachtrijplaatsing, streaming, tooluitvoering en zichtbaarheid van redenatie. Deze pagina brengt het pad van inkomend bericht naar antwoord in kaart.

## Berichtenstroom (hoog niveau)

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

Belangrijke instellingen staan in de configuratie:

- `messages.*` voor voorvoegsels, wachtrijplaatsing en groepsgedrag.
- `agents.defaults.*` voor standaardinstellingen voor blokstreaming en chunking.
- Kanaaloverschrijvingen (`channels.whatsapp.*`, `channels.telegram.*`, enz.) voor limieten en streaming-schakelaars.

Zie [Configuratie](/nl/gateway/configuration) voor het volledige schema.

## Inkomende deduplicatie

Kanalen kunnen hetzelfde bericht opnieuw afleveren na opnieuw verbinden. OpenClaw houdt een kortlevende cache bij, gesleuteld op kanaal/account/peer/sessie/bericht-id, zodat dubbele afleveringen geen extra agent-run starten.

## Inkomende debouncing

Snel opeenvolgende berichten van **dezelfde afzender** kunnen via `messages.inbound` worden samengevoegd tot één agent-turn. Debouncing is begrensd per kanaal + gesprek en gebruikt het meest recente bericht voor antwoord-threading/ID's.

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

- Debounce geldt voor berichten met **alleen tekst**; media/bijlagen worden direct geflusht.
- Besturingscommando's omzeilen debouncing zodat ze zelfstandig blijven — **behalve** wanneer een kanaal expliciet kiest voor samenvoeging van DM's van dezelfde afzender (bijv. [BlueBubbles `coalesceSameSenderDms`](/nl/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)), waarbij DM-commando's binnen het debounce-venster wachten zodat een split-send-payload kan aansluiten bij dezelfde agent-turn.

## Sessies en apparaten

Sessies zijn eigendom van de Gateway, niet van clients.

- Directe chats vallen samen in de hoofdsessiesleutel van de agent.
- Groepen/kanalen krijgen hun eigen sessiesleutels.
- De sessieopslag en transcripties staan op de Gateway-host.

Meerdere apparaten/kanalen kunnen naar dezelfde sessie verwijzen, maar geschiedenis wordt niet volledig teruggesynchroniseerd naar elke client. Aanbeveling: gebruik één primair apparaat voor lange gesprekken om uiteenlopende context te voorkomen. De Control UI en TUI tonen altijd de door de Gateway ondersteunde sessietranscriptie, dus zij zijn de bron van waarheid.

Details: [Sessiebeheer](/nl/concepts/session).

## Metadata van toolresultaten

Toolresultaat-`content` is het modelzichtbare resultaat. Toolresultaat-`details` is runtime-metadata voor UI-rendering, diagnostiek, medialevering en plugins.

OpenClaw houdt die grens expliciet:

- `toolResult.details` wordt verwijderd vóór provider-replay en Compaction-invoer.
- Vastgelegde sessietranscripties bewaren alleen begrensde `details`; te grote metadata wordt vervangen door een compacte samenvatting gemarkeerd met `persistedDetailsTruncated: true`.
- Plugins en tools moeten tekst die het model moet lezen in `content` zetten, niet alleen in `details`.

## Inkomende bodies en geschiedeniscontext

OpenClaw scheidt de **prompt-body** van de **commando-body**:

- `BodyForAgent`: primaire modelgerichte tekst voor het huidige bericht. Kanaalplugins moeten dit gericht houden op de huidige promptdragende tekst van de afzender.
- `Body`: legacy prompt-fallback. Dit kan kanaalenveloppen en optionele geschiedenis-wrappers bevatten, maar huidige kanalen moeten er niet op vertrouwen als primaire modelinvoer wanneer `BodyForAgent` beschikbaar is.
- `CommandBody`: ruwe gebruikerstekst voor directive-/commandoparsing.
- `RawBody`: legacy alias voor `CommandBody` (behouden voor compatibiliteit).

Wanneer een kanaal geschiedenis aanlevert, gebruikt het een gedeelde wrapper:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Voor **niet-directe chats** (groepen/kanalen/rooms) wordt de **body van het huidige bericht** voorafgegaan door het afzenderlabel (dezelfde stijl als voor geschiedenisitems). Dit houdt realtime- en wachtrij-/geschiedenisberichten consistent in de agent-prompt.

Geschiedenisbuffers zijn **alleen pending**: ze bevatten groepsberichten die _geen_ run hebben gestart (bijvoorbeeld berichten die door mentions zijn gated) en **sluiten** berichten uit die al in de sessietranscriptie staan.

Directive-stripping geldt alleen voor de sectie **huidig bericht**, zodat geschiedenis intact blijft. Kanalen die geschiedenis wrappen, moeten `CommandBody` (of `RawBody`) instellen op de oorspronkelijke berichttekst en `Body` behouden als de gecombineerde prompt. Gestructureerde geschiedenis-, antwoord-, doorgestuurde en kanaalmetadata worden tijdens promptassemblage gerenderd als onvertrouwde contextblokken met gebruikersrol.
Geschiedenisbuffers zijn configureerbaar via `messages.groupChat.historyLimit` (globale standaard) en overschrijvingen per kanaal zoals `channels.slack.historyLimit` of `channels.telegram.accounts.<id>.historyLimit` (stel `0` in om uit te schakelen).

## Wachtrijplaatsing en follow-ups

Als er al een run actief is, kunnen inkomende berichten in de wachtrij worden geplaatst, naar de huidige run worden gestuurd of worden verzameld voor een follow-up-turn.

- Configureer via `messages.queue` (en `messages.queue.byChannel`).
- De standaardmodus is `steer`, met een follow-up-debounce van 500 ms wanneer sturen terugvalt op levering via een follow-up in de wachtrij.
- Modi: `steer`, `followup`, `collect`, `steer-backlog`, `interrupt` en de legacy één-tegelijk-`queue`-modus.

Details: [Commandowachtrij](/nl/concepts/queue) en [Sturingswachtrij](/nl/concepts/queue-steering).

## Eigendom van kanaalruns

Kanaalplugins kunnen volgorde bewaren, invoer debouncen en transport-backpressure toepassen voordat een bericht de sessiewachtrij binnenkomt. Ze mogen geen aparte timeout afdwingen rond de agent-turn zelf. Zodra een bericht naar een sessie is gerouteerd, wordt langlopende verwerking bestuurd door de sessie-, tool- en runtime-levenscyclus, zodat alle kanalen traag verlopen turns consistent rapporteren en herstellen.

## Streaming, chunking en batching

Blokstreaming verzendt gedeeltelijke antwoorden terwijl het model tekstblokken produceert. Chunking respecteert tekstlimieten van kanalen en voorkomt het splitsen van fenced code.

Belangrijke instellingen:

- `agents.defaults.blockStreamingDefault` (`on|off`, standaard uit)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (idle-gebaseerde batching)
- `agents.defaults.humanDelay` (mensachtige pauze tussen blokantwoorden)
- Kanaaloverschrijvingen: `*.blockStreaming` en `*.blockStreamingCoalesce` (niet-Telegram-kanalen vereisen expliciet `*.blockStreaming: true`)

Details: [Streaming + chunking](/nl/concepts/streaming).

## Zichtbaarheid van redenatie en tokens

OpenClaw kan modelredenatie tonen of verbergen:

- `/reasoning on|off|stream` regelt de zichtbaarheid.
- Redenatie-inhoud telt nog steeds mee voor tokengebruik wanneer die door het model wordt geproduceerd.
- Telegram ondersteunt reasoning-stream naar de conceptballon.

Details: [Denk- en redenatie-directives](/nl/tools/thinking) en [Tokengebruik](/nl/reference/token-use).

## Voorvoegsels, threading en antwoorden

Opmaak van uitgaande berichten is gecentraliseerd in `messages`:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` en `channels.<channel>.accounts.<id>.responsePrefix` (cascade voor uitgaand voorvoegsel), plus `channels.whatsapp.messagePrefix` (inkomend WhatsApp-voorvoegsel)
- Antwoord-threading via `replyToMode` en standaardinstellingen per kanaal

Details: [Configuratie](/nl/gateway/config-agents#messages) en kanaaldocumentatie.

## Stille antwoorden

Het exacte stille token `NO_REPLY` / `no_reply` betekent “lever geen voor de gebruiker zichtbaar antwoord af”.
Wanneer een turn ook pending toolmedia heeft, zoals gegenereerde TTS-audio, verwijdert OpenClaw de stille tekst maar levert het nog steeds de mediabijlage.
OpenClaw bepaalt dat gedrag per gesprekstype:

- Directe gesprekken staan stilte standaard niet toe en herschrijven een kaal stil antwoord naar een korte zichtbare fallback.
- Groepen/kanalen staan stilte standaard toe.
- Interne orkestratie staat stilte standaard toe.

OpenClaw gebruikt ook stille antwoorden voor interne runner-fouten die optreden vóór een assistant-antwoord in niet-directe chats, zodat groepen/kanalen geen standaard Gateway-fouttekst zien. Directe chats tonen standaard compacte fouttekst; ruwe runner-details worden alleen getoond wanneer `/verbose` `on` of `full` is.

Standaarden staan onder `agents.defaults.silentReply` en `agents.defaults.silentReplyRewrite`; `surfaces.<id>.silentReply` en `surfaces.<id>.silentReplyRewrite` kunnen ze per surface overschrijven.

Wanneer de bovenliggende sessie één of meer pending gespawnde subagent-runs heeft, worden kale stille antwoorden op alle surfaces verwijderd in plaats van herschreven, zodat de parent stil blijft totdat het voltooiingsevent van de child het echte antwoord levert.

## Gerelateerd

- [Streaming](/nl/concepts/streaming) — realtime berichtlevering
- [Opnieuw proberen](/nl/concepts/retry) — retry-gedrag voor berichtlevering
- [Wachtrij](/nl/concepts/queue) — wachtrij voor berichtverwerking
- [Kanalen](/nl/channels) — integraties met messagingplatforms
