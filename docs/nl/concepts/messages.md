---
read_when:
    - Uitleg over hoe inkomende berichten antwoorden worden
    - Sessies, wachtrijmodi of streaminggedrag verduidelijken
    - Documentatie van zichtbaarheid van redenering en gevolgen voor gebruik
summary: Berichtenstroom, sessies, wachtrijen en zichtbaarheid van redenering
title: Berichten
x-i18n:
    generated_at: "2026-04-30T09:35:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: dcfcc995995516b627993755b255a779c681b4976d2d724c0c11e87875e37b1e
    source_path: concepts/messages.md
    workflow: 16
---

OpenClaw verwerkt inkomende berichten via een pijplijn van sessieresolutie, wachtrijplaatsing, streaming, tooluitvoering en zichtbaarheid van redenatie. Deze pagina brengt het pad van inkomend bericht naar antwoord in kaart.

## Berichtstroom (hoog niveau)

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

Belangrijke knoppen staan in de configuratie:

- `messages.*` voor prefixes, wachtrijplaatsing en groepsgedrag.
- `agents.defaults.*` voor standaardinstellingen voor blokstreaming en chunking.
- Kanaaloverrides (`channels.whatsapp.*`, `channels.telegram.*`, enz.) voor limieten en streaming-schakelaars.

Zie [Configuratie](/nl/gateway/configuration) voor het volledige schema.

## Inkomende deduplicatie

Kanalen kunnen hetzelfde bericht na herverbindingen opnieuw afleveren. OpenClaw houdt een
kortlevende cache bij, gesleuteld op kanaal/account/peer/sessie/bericht-id, zodat dubbele
afleveringen geen nieuwe agentrun starten.

## Inkomende debounce

Snel opeenvolgende berichten van **dezelfde afzender** kunnen via `messages.inbound`
worden samengevoegd tot een enkele agentbeurt. Debounce is begrensd per kanaal + gesprek
en gebruikt het meest recente bericht voor antwoordthreading/ID's.

Configuratie (globale standaard + overrides per kanaal):

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

- Debounce geldt voor berichten met **alleen tekst**; media/bijlagen worden onmiddellijk doorgestuurd.
- Besturingscommando's omzeilen debounce zodat ze zelfstandig blijven — **behalve** wanneer een kanaal expliciet kiest voor samenvoeging van DM's van dezelfde afzender (bijv. [BlueBubbles `coalesceSameSenderDms`](/nl/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)), waarbij DM-commando's binnen het debouncevenster wachten zodat een payload uit een gesplitste verzending aan dezelfde agentbeurt kan worden toegevoegd.

## Sessies en apparaten

Sessies zijn eigendom van de Gateway, niet van clients.

- Directe chats worden samengevoegd in de hoofdsessiesleutel van de agent.
- Groepen/kanalen krijgen hun eigen sessiesleutels.
- De sessieopslag en transcripties staan op de Gateway-host.

Meerdere apparaten/kanalen kunnen aan dezelfde sessie worden gekoppeld, maar geschiedenis wordt niet volledig
teruggesynchroniseerd naar elke client. Aanbeveling: gebruik een primair apparaat voor lange
gesprekken om uiteenlopende context te voorkomen. De Control UI en TUI tonen altijd de
door de Gateway ondersteunde sessietranscriptie, dus die zijn de bron van waarheid.

Details: [Sessiebeheer](/nl/concepts/session).

## Metadata van toolresultaten

Toolresultaat `content` is het modelzichtbare resultaat. Toolresultaat `details` is
runtime-metadata voor UI-rendering, diagnostiek, medialevering en plugins.

OpenClaw houdt die grens expliciet:

- `toolResult.details` wordt verwijderd vóór providerreplay en Compaction-invoer.
- Blijvend opgeslagen sessietranscripties bewaren alleen begrensde `details`; te grote metadata
  wordt vervangen door een compacte samenvatting gemarkeerd met `persistedDetailsTruncated: true`.
- Plugins en tools moeten tekst die het model moet lezen in `content` zetten, niet alleen
  in `details`.

## Inkomende bodies en geschiedeniscontext

OpenClaw scheidt de **promptbody** van de **commandobody**:

- `Body`: prompttekst die naar de agent wordt verzonden. Dit kan kanaalenveloppen en
  optionele geschiedeniswrappers bevatten.
- `CommandBody`: ruwe gebruikerstekst voor directive-/commandoparsing.
- `RawBody`: legacy-alias voor `CommandBody` (behouden voor compatibiliteit).

Wanneer een kanaal geschiedenis aanlevert, gebruikt het een gedeelde wrapper:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Voor **niet-directe chats** (groepen/kanalen/ruimtes) wordt de **huidige berichtbody** voorafgegaan door het
afzenderlabel (dezelfde stijl als voor geschiedenisitems). Dit houdt realtime en in wachtrij geplaatste/geschiedenis-
berichten consistent in de agentprompt.

Geschiedenisbuffers zijn **alleen in behandeling**: ze bevatten groepsberichten die _geen_
run hebben gestart (bijvoorbeeld berichten die door mentions werden geblokkeerd) en **sluiten** berichten uit
die al in de sessietranscriptie staan.

Directive-stripping geldt alleen voor het gedeelte **huidig bericht**, zodat geschiedenis
intact blijft. Kanalen die geschiedenis wrappen, moeten `CommandBody` (of
`RawBody`) instellen op de oorspronkelijke berichttekst en `Body` als de gecombineerde prompt behouden.
Geschiedenisbuffers zijn configureerbaar via `messages.groupChat.historyLimit` (globale
standaard) en overrides per kanaal zoals `channels.slack.historyLimit` of
`channels.telegram.accounts.<id>.historyLimit` (stel `0` in om uit te schakelen).

## Wachtrijplaatsing en follow-ups

Als er al een run actief is, kunnen inkomende berichten in de wachtrij worden geplaatst, naar de
huidige run worden gestuurd, of worden verzameld voor een follow-upbeurt.

- Configureer via `messages.queue` (en `messages.queue.byChannel`).
- De standaardmodus is `steer`, met een follow-updebounce van 500 ms wanneer sturen terugvalt
  op aflevering als follow-up in de wachtrij.
- Modi: `steer`, `followup`, `collect`, `steer-backlog`, `interrupt`, en de
  legacy een-voor-een `queue`-modus.

Details: [Commandowachtrij](/nl/concepts/queue) en [Sturingswachtrij](/nl/concepts/queue-steering).

## Eigenaarschap van kanaalruns

Kanaalplugins kunnen volgorde behouden, invoer debouncen en transport-
backpressure toepassen voordat een bericht de sessiewachtrij binnenkomt. Ze mogen geen
afzonderlijke timeout rond de agentbeurt zelf afdwingen. Zodra een bericht naar een
sessie is gerouteerd, wordt langlopende verwerking beheerd door de levenscyclus van sessie, tool en runtime,
zodat alle kanalen trage beurten consistent rapporteren en herstellen.

## Streaming, chunking en batching

Blokstreaming verzendt gedeeltelijke antwoorden terwijl het model tekstblokken produceert.
Chunking respecteert tekstlimieten van kanalen en voorkomt splitsing van fenced code.

Belangrijke instellingen:

- `agents.defaults.blockStreamingDefault` (`on|off`, standaard uit)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (op inactiviteit gebaseerde batching)
- `agents.defaults.humanDelay` (mensachtige pauze tussen blokantwoorden)
- Kanaaloverrides: `*.blockStreaming` en `*.blockStreamingCoalesce` (niet-Telegram-kanalen vereisen expliciet `*.blockStreaming: true`)

Details: [Streaming + chunking](/nl/concepts/streaming).

## Zichtbaarheid van redenatie en tokens

OpenClaw kan modelredenatie tonen of verbergen:

- `/reasoning on|off|stream` regelt zichtbaarheid.
- Redenatiecontent telt nog steeds mee voor tokengebruik wanneer die door het model wordt geproduceerd.
- Telegram ondersteunt een redenatiestream naar de conceptballon.

Details: [Denk- + redenatiedirectives](/nl/tools/thinking) en [Tokengebruik](/nl/reference/token-use).

## Prefixes, threading en antwoorden

Opmaak van uitgaande berichten is gecentraliseerd in `messages`:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` en `channels.<channel>.accounts.<id>.responsePrefix` (cascade voor uitgaande prefixes), plus `channels.whatsapp.messagePrefix` (WhatsApp-prefix voor inkomende berichten)
- Antwoordthreading via `replyToMode` en standaarden per kanaal

Details: [Configuratie](/nl/gateway/config-agents#messages) en kanaaldocumentatie.

## Stille antwoorden

Het exacte stille token `NO_REPLY` / `no_reply` betekent “lever geen voor de gebruiker zichtbaar antwoord af”.
Wanneer een beurt ook in behandeling zijnde toolmedia heeft, zoals gegenereerde TTS-audio, verwijdert OpenClaw
de stille tekst maar levert het nog steeds de mediabijlage af.
OpenClaw bepaalt dat gedrag op basis van gesprekstype:

- Directe gesprekken staan stilte standaard niet toe en herschrijven een kaal stil
  antwoord naar een korte zichtbare fallback.
- Groepen/kanalen staan stilte standaard toe.
- Interne orkestratie staat stilte standaard toe.

OpenClaw gebruikt stille antwoorden ook voor interne runnerfouten die optreden
vóór enig assistentantwoord in niet-directe chats, zodat groepen/kanalen geen
standaard Gateway-fouttekst zien. Directe chats tonen standaard compacte fouttekst;
ruwe runnerdetails worden alleen getoond wanneer `/verbose` `on` of `full` is.

Standaarden staan onder `agents.defaults.silentReply` en
`agents.defaults.silentReplyRewrite`; `surfaces.<id>.silentReply` en
`surfaces.<id>.silentReplyRewrite` kunnen ze per oppervlak overriden.

Wanneer de bovenliggende sessie een of meer in behandeling zijnde gespawnde subagentruns heeft, worden kale
stille antwoorden op alle oppervlakken verwijderd in plaats van herschreven, zodat de
bovenliggende sessie stil blijft totdat de voltooiingsgebeurtenis van de child het echte antwoord aflevert.

## Gerelateerd

- [Streaming](/nl/concepts/streaming) — realtime berichtaflevering
- [Opnieuw proberen](/nl/concepts/retry) — retrygedrag voor berichtaflevering
- [Wachtrij](/nl/concepts/queue) — wachtrij voor berichtverwerking
- [Kanalen](/nl/channels) — integraties met berichtenplatforms
