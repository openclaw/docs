---
read_when:
    - Uitleg over hoe inkomende berichten antwoorden worden
    - Sessies, wachtrijmodi of streaminggedrag verduidelijken
    - Documenteren van de zichtbaarheid van redenering en de gevolgen voor gebruik
summary: Berichtenstroom, sessies, wachtrijvorming en zichtbaarheid van redeneringen
title: Berichten
x-i18n:
    generated_at: "2026-05-10T19:32:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 053ff7b2ecca07e99057aed2f9ba199a6c1a07f15e865915045d25d128db984b
    source_path: concepts/messages.md
    workflow: 16
---

OpenClaw verwerkt binnenkomende berichten via een pipeline van sessieresolutie, wachtrijplaatsing, streaming, tooluitvoering en zichtbaarheid van redenering. Deze pagina brengt het pad van binnenkomend bericht naar antwoord in kaart.

## Berichtstroom (hoog niveau)

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

Belangrijke knoppen staan in de configuratie:

- `messages.*` voor voorvoegsels, wachtrijplaatsing en groepsgedrag.
- `agents.defaults.*` voor standaardinstellingen voor blokstreaming en chunking.
- Kanaaloverschrijvingen (`channels.whatsapp.*`, `channels.telegram.*`, enz.) voor limieten en streaming-schakelaars.

Zie [Configuratie](/nl/gateway/configuration) voor het volledige schema.

## Inkomende deduplicatie

Kanalen kunnen hetzelfde bericht opnieuw afleveren na herverbindingen. OpenClaw houdt een kortlevende cache bij, gesleuteld op kanaal/account/peer/sessie/bericht-id, zodat dubbele afleveringen geen extra agent-run starten.

## Inkomende debounce

Snelle opeenvolgende berichten van **dezelfde afzender** kunnen via `messages.inbound` worden gebundeld in één agentbeurt. Debounce is gescoped per kanaal + gesprek en gebruikt het meest recente bericht voor antwoord-threading/ID's.

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
- Besturingsopdrachten omzeilen debounce zodat ze op zichzelf blijven staan. Kanalen die expliciet kiezen voor samenvoeging van DM's van dezelfde afzender kunnen DM-opdrachten binnen het debounce-venster houden, zodat een gesplitst verzonden payload in dezelfde agentbeurt kan worden samengevoegd.

## Sessies en apparaten

Sessies zijn eigendom van de Gateway, niet van clients.

- Directe chats vallen samen in de hoofdsessiesleutel van de agent.
- Groepen/kanalen krijgen hun eigen sessiesleutels.
- De sessieopslag en transcripties staan op de Gateway-host.

Meerdere apparaten/kanalen kunnen naar dezelfde sessie verwijzen, maar geschiedenis wordt niet volledig teruggesynchroniseerd naar elke client. Aanbeveling: gebruik één primair apparaat voor lange gesprekken om uiteenlopende context te voorkomen. De Control UI en TUI tonen altijd de door de Gateway ondersteunde sessietranscriptie, dus zij zijn de bron van waarheid.

Details: [Sessiebeheer](/nl/concepts/session).

## Metadata van toolresultaten

Toolresultaat `content` is het modelzichtbare resultaat. Toolresultaat `details` is runtime-metadata voor UI-rendering, diagnostiek, medialevering en Plugins.

OpenClaw houdt die grens expliciet:

- `toolResult.details` wordt verwijderd vóór provider-replay en Compaction-invoer.
- Persistente sessietranscripties bewaren alleen begrensde `details`; te grote metadata worden vervangen door een compacte samenvatting gemarkeerd met `persistedDetailsTruncated: true`.
- Plugins en tools moeten tekst die het model moet lezen in `content` plaatsen, niet alleen in `details`.

## Inkomende bodies en geschiedeniscontext

OpenClaw scheidt de **promptbody** van de **commandobody**:

- `BodyForAgent`: primaire modelgerichte tekst voor het huidige bericht. Kanaal-Plugins moeten dit gericht houden op de huidige promptdragende tekst van de afzender.
- `Body`: legacy prompt-fallback. Dit kan kanaalenveloppen en optionele geschiedeniswrappers bevatten, maar huidige kanalen moeten er niet op vertrouwen als primaire modelinvoer wanneer `BodyForAgent` beschikbaar is.
- `CommandBody`: ruwe gebruikerstekst voor directive-/opdrachtparsing.
- `RawBody`: legacy alias voor `CommandBody` (behouden voor compatibiliteit).

Wanneer een kanaal geschiedenis aanlevert, gebruikt het een gedeelde wrapper:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Voor **niet-directe chats** (groepen/kanalen/ruimtes) wordt de **huidige berichtbody** voorafgegaan door het afzenderlabel (dezelfde stijl als voor geschiedenisitems). Dit houdt realtime en in de wachtrij geplaatste/geschiedenisberichten consistent in de agentprompt.

Geschiedenisbuffers zijn **alleen pending**: ze bevatten groepsberichten die _geen_ run hebben gestart (bijvoorbeeld door vermeldingen gated berichten) en **sluiten** berichten uit die al in de sessietranscriptie staan.

Directive-stripping geldt alleen voor de sectie **huidig bericht**, zodat geschiedenis intact blijft. Kanalen die geschiedenis wrappen, moeten `CommandBody` (of `RawBody`) instellen op de oorspronkelijke berichttekst en `Body` houden als de gecombineerde prompt. Gestructureerde geschiedenis-, antwoord-, doorgestuurde en kanaalmetadata worden tijdens promptassemblage gerenderd als niet-vertrouwde contextblokken met gebruikersrol.
Geschiedenisbuffers zijn configureerbaar via `messages.groupChat.historyLimit` (globale standaard) en overschrijvingen per kanaal zoals `channels.slack.historyLimit` of `channels.telegram.accounts.<id>.historyLimit` (stel `0` in om uit te schakelen).

## Wachtrijplaatsing en follow-ups

Als er al een run actief is, kunnen binnenkomende berichten in de wachtrij worden geplaatst, naar de huidige run worden gestuurd of worden verzameld voor een follow-upbeurt.

- Configureer via `messages.queue` (en `messages.queue.byChannel`).
- De standaardmodus is `steer`, met een follow-updebounce van 500 ms wanneer sturing terugvalt op aflevering als follow-up in de wachtrij.
- Modi: `steer`, `followup`, `collect`, `steer-backlog`, `interrupt` en de legacy één-tegelijk-`queue`-modus.

Details: [Opdrachtwachtrij](/nl/concepts/queue) en [Sturingswachtrij](/nl/concepts/queue-steering).

## Eigenaarschap van kanaal-runs

Kanaal-Plugins kunnen volgorde behouden, invoer debouncen en transport-backpressure toepassen voordat een bericht de sessiewachtrij binnengaat. Ze mogen geen afzonderlijke timeout opleggen rond de agentbeurt zelf. Zodra een bericht naar een sessie is gerouteerd, wordt langlopende verwerking beheerst door de levenscyclus van de sessie, tool en runtime, zodat alle kanalen trage beurten consistent rapporteren en herstellen.

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

## Zichtbaarheid van redenering en tokens

OpenClaw kan modelredenering tonen of verbergen:

- `/reasoning on|off|stream` regelt zichtbaarheid.
- Redeneringsinhoud telt nog steeds mee voor tokengebruik wanneer deze door het model wordt geproduceerd.
- Telegram ondersteunt een redeneringsstream naar een tijdelijke conceptballon die na definitieve aflevering wordt verwijderd; gebruik `/reasoning on` voor persistente redeneringsuitvoer.

Details: [Denk- en redeneringsdirectives](/nl/tools/thinking) en [Tokengebruik](/nl/reference/token-use).

## Voorvoegsels, threading en antwoorden

Opmaak van uitgaande berichten is gecentraliseerd in `messages`:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` en `channels.<channel>.accounts.<id>.responsePrefix` (cascade voor uitgaand voorvoegsel), plus `channels.whatsapp.messagePrefix` (inkomend WhatsApp-voorvoegsel)
- Antwoord-threading via `replyToMode` en standaarden per kanaal

Details: [Configuratie](/nl/gateway/config-agents#messages) en kanaaldocumentatie.

## Stille antwoorden

Het exacte stille token `NO_REPLY` / `no_reply` betekent "lever geen gebruikerszichtbaar antwoord af".
Wanneer een beurt ook pending toolmedia heeft, zoals gegenereerde TTS-audio, verwijdert OpenClaw de stille tekst maar levert het de mediabijlage nog steeds af.
OpenClaw lost dat gedrag op per gesprekstype:

- Directe gesprekken staan stilte standaard niet toe en herschrijven een kaal stil antwoord naar een korte zichtbare fallback.
- Groepen/kanalen staan stilte standaard toe.
- Interne orkestratie staat stilte standaard toe.

OpenClaw gebruikt ook stille antwoorden voor interne runner-fouten die optreden vóór enig assistentantwoord in niet-directe chats, zodat groepen/kanalen geen standaard Gateway-fouttekst zien. Directe chats tonen standaard compacte fouttekst; ruwe runnerdetails worden alleen getoond wanneer `/verbose` `on` of `full` is.

Standaarden staan onder `agents.defaults.silentReply` en `agents.defaults.silentReplyRewrite`; `surfaces.<id>.silentReply` en `surfaces.<id>.silentReplyRewrite` kunnen ze per surface overschrijven.

Wanneer de bovenliggende sessie één of meer pending gespawnde subagent-runs heeft, worden kale stille antwoorden op alle surfaces verwijderd in plaats van herschreven, zodat de bovenliggende sessie stil blijft totdat de voltooiingsgebeurtenis van het kind het echte antwoord aflevert.

## Gerelateerd

- [Refactor van berichtlevenscyclus](/nl/concepts/message-lifecycle-refactor) - doelontwerp voor duurzaam verzenden en ontvangen
- [Streaming](/nl/concepts/streaming) — realtime berichtaflevering
- [Opnieuw proberen](/nl/concepts/retry) — retrygedrag voor berichtaflevering
- [Wachtrij](/nl/concepts/queue) — wachtrij voor berichtverwerking
- [Kanalen](/nl/channels) — integraties met messagingplatforms
