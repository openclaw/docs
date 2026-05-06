---
read_when:
    - Uitleg over hoe inkomende berichten antwoorden worden
    - Sessies, wachtrijmodi of streaminggedrag verduidelijken
    - Zichtbaarheid van redeneringen en gebruiksimplicaties documenteren
summary: Berichtenstroom, sessies, wachtrijvorming en zichtbaarheid van redenering
title: Berichten
x-i18n:
    generated_at: "2026-05-06T09:08:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: e1cb21bb1ecfb90c91f5117c76378248f846ace16401c226986ab3cca40a3e33
    source_path: concepts/messages.md
    workflow: 16
---

OpenClaw verwerkt inkomende berichten via een pipeline van sessieresolutie, wachtrijvorming, streaming, tooluitvoering en zichtbaarheid van reasoning. Deze pagina brengt het pad van inkomend bericht naar antwoord in kaart.

## Berichtenstroom (op hoog niveau)

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

Belangrijke knoppen staan in de configuratie:

- `messages.*` voor voorvoegsels, wachtrijvorming en groepsgedrag.
- `agents.defaults.*` voor standaardinstellingen voor block streaming en chunking.
- Kanaaloverschrijvingen (`channels.whatsapp.*`, `channels.telegram.*`, enz.) voor limieten en streaming-schakelaars.

Zie [Configuratie](/nl/gateway/configuration) voor het volledige schema.

## Inkomende deduplicatie

Kanalen kunnen hetzelfde bericht opnieuw afleveren na herverbindingen. OpenClaw houdt een
kortlevende cache bij op basis van kanaal/account/peer/sessie/bericht-id, zodat dubbele
leveringen geen nieuwe agent-run starten.

## Inkomende debouncing

Snelle opeenvolgende berichten van de **zelfde afzender** kunnen via `messages.inbound`
worden gebundeld in één agent-beurt. Debouncing is begrensd per kanaal + gesprek
en gebruikt het meest recente bericht voor antwoordthreading/ID's.

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
- Besturingsopdrachten omzeilen debouncing zodat ze zelfstandig blijven — **behalve** wanneer een kanaal expliciet kiest voor samenvoeging van DM's van dezelfde afzender (bijv. [BlueBubbles `coalesceSameSenderDms`](/nl/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)), waarbij DM-opdrachten binnen het debounce-venster wachten zodat een split-send-payload kan worden toegevoegd aan dezelfde agent-beurt.

## Sessies en apparaten

Sessies zijn eigendom van de Gateway, niet van clients.

- Directe chats vallen samen in de hoofdsessiesleutel van de agent.
- Groepen/kanalen krijgen hun eigen sessiesleutels.
- De sessieopslag en transcripties staan op de Gateway-host.

Meerdere apparaten/kanalen kunnen naar dezelfde sessie verwijzen, maar geschiedenis wordt niet volledig
terug gesynchroniseerd naar elke client. Aanbeveling: gebruik één primair apparaat voor lange
gesprekken om uiteenlopende context te vermijden. De Control UI en TUI tonen altijd de
door de Gateway ondersteunde sessietranscriptie, dus zij zijn de bron van waarheid.

Details: [Sessiebeheer](/nl/concepts/session).

## Metadata van toolresultaten

Toolresultaat `content` is het modelzichtbare resultaat. Toolresultaat `details` is
runtime-metadata voor UI-rendering, diagnostiek, medialevering en Plugins.

OpenClaw houdt die grens expliciet:

- `toolResult.details` wordt verwijderd vóór provider-replay en Compaction-invoer.
- Persistente sessietranscripties bewaren alleen begrensde `details`; te grote metadata
  wordt vervangen door een compacte samenvatting gemarkeerd met `persistedDetailsTruncated: true`.
- Plugins en tools moeten tekst die het model moet lezen in `content` plaatsen, niet alleen
  in `details`.

## Inkomende bodies en geschiedeniscontext

OpenClaw scheidt de **prompt-body** van de **command-body**:

- `BodyForAgent`: primaire modelgerichte tekst voor het huidige bericht. Kanaal-Plugins
  moeten dit gericht houden op de huidige promptdragende tekst van de afzender.
- `Body`: legacy prompt-fallback. Dit kan kanaalenveloppen en optionele
  geschiedeniswrappers bevatten, maar huidige kanalen moeten er niet op vertrouwen als de
  primaire modelinvoer wanneer `BodyForAgent` beschikbaar is.
- `CommandBody`: ruwe gebruikerstekst voor directive-/opdrachtparsing.
- `RawBody`: legacy alias voor `CommandBody` (behouden voor compatibiliteit).

Wanneer een kanaal geschiedenis levert, gebruikt het een gedeelde wrapper:

- `[Chatberichten sinds je laatste antwoord - ter context]`
- `[Huidig bericht - reageer hierop]`

Voor **niet-directe chats** (groepen/kanalen/rooms) wordt de **body van het huidige bericht** voorafgegaan door het
afzenderlabel (dezelfde stijl als voor geschiedenisitems). Dit houdt realtime en berichten uit wachtrij/geschiedenis
consistent in de agent-prompt.

Geschiedenisbuffers zijn **alleen-pending**: ze bevatten groepsberichten die _geen_
run hebben gestart (bijvoorbeeld berichten achter een vermeldingspoort) en **sluiten** berichten uit
die al in de sessietranscriptie staan.

Het strippen van directives geldt alleen voor de sectie **huidig bericht**, zodat geschiedenis
intact blijft. Kanalen die geschiedenis wrappen, moeten `CommandBody` (of
`RawBody`) instellen op de oorspronkelijke berichttekst en `Body` behouden als de gecombineerde prompt.
Gestructureerde geschiedenis, antwoorden, doorgestuurde berichten en kanaalmetadata worden gerenderd als
niet-vertrouwde contextblokken met user-rol tijdens promptassemblage.
Geschiedenisbuffers zijn configureerbaar via `messages.groupChat.historyLimit` (globale
standaard) en overschrijvingen per kanaal zoals `channels.slack.historyLimit` of
`channels.telegram.accounts.<id>.historyLimit` (stel `0` in om uit te schakelen).

## Wachtrijvorming en follow-ups

Als er al een run actief is, kunnen inkomende berichten in een wachtrij worden geplaatst, in de
huidige run worden gestuurd, of worden verzameld voor een follow-upbeurt.

- Configureer via `messages.queue` (en `messages.queue.byChannel`).
- De standaardmodus is `steer`, met een follow-up-debounce van 500 ms wanneer sturen
  terugvalt op levering via een queued follow-up.
- Modi: `steer`, `followup`, `collect`, `steer-backlog`, `interrupt`, en de
  legacy één-tegelijk `queue`-modus.

Details: [Opdrachtwachtrij](/nl/concepts/queue) en [Steering-wachtrij](/nl/concepts/queue-steering).

## Eigenaarschap van kanaalruns

Kanaal-Plugins mogen volgorde bewaren, invoer debouncen en transport-backpressure
toepassen voordat een bericht de sessiewachtrij ingaat. Ze mogen geen
afzonderlijke timeout rond de agent-beurt zelf opleggen. Zodra een bericht naar een
sessie is gerouteerd, wordt langlopende verwerking beheerst door de sessie-, tool- en runtime-
lifecycle, zodat alle kanalen trage beurten consistent rapporteren en herstellen.

## Streaming, chunking en batching

Block streaming verzendt gedeeltelijke antwoorden terwijl het model tekstblokken produceert.
Chunking respecteert tekstlimieten van kanalen en vermijdt het splitsen van fenced code.

Belangrijke instellingen:

- `agents.defaults.blockStreamingDefault` (`on|off`, standaard uit)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (idle-gebaseerde batching)
- `agents.defaults.humanDelay` (mensachtige pauze tussen blokantwoorden)
- Kanaaloverschrijvingen: `*.blockStreaming` en `*.blockStreamingCoalesce` (niet-Telegram-kanalen vereisen expliciet `*.blockStreaming: true`)

Details: [Streaming + chunking](/nl/concepts/streaming).

## Zichtbaarheid van reasoning en tokens

OpenClaw kan model-reasoning tonen of verbergen:

- `/reasoning on|off|stream` regelt zichtbaarheid.
- Reasoning-inhoud telt nog steeds mee voor tokengebruik wanneer die door het model wordt geproduceerd.
- Telegram ondersteunt reasoning-stream naar een tijdelijke conceptballon die na definitieve levering wordt verwijderd; gebruik `/reasoning on` voor persistente reasoning-uitvoer.

Details: [Thinking + reasoning-directives](/nl/tools/thinking) en [Tokengebruik](/nl/reference/token-use).

## Voorvoegsels, threading en antwoorden

Opmaak van uitgaande berichten is gecentraliseerd in `messages`:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` en `channels.<channel>.accounts.<id>.responsePrefix` (cascade van uitgaande voorvoegsels), plus `channels.whatsapp.messagePrefix` (inkomend voorvoegsel voor WhatsApp)
- Antwoordthreading via `replyToMode` en standaarden per kanaal

Details: [Configuratie](/nl/gateway/config-agents#messages) en kanaaldocumentatie.

## Stille antwoorden

Het exacte stille token `NO_REPLY` / `no_reply` betekent "lever geen voor de gebruiker zichtbaar antwoord af".
Wanneer een beurt ook pending toolmedia heeft, zoals gegenereerde TTS-audio, stript OpenClaw
de stille tekst maar levert het nog steeds de mediabijlage af.
OpenClaw lost dat gedrag op per gesprekstype:

- Directe gesprekken staan stilte standaard niet toe en herschrijven een kaal stil
  antwoord naar een korte zichtbare fallback.
- Groepen/kanalen staan stilte standaard toe.
- Interne orkestratie staat stilte standaard toe.

OpenClaw gebruikt ook stille antwoorden voor interne runner-fouten die optreden
vóór enig assistant-antwoord in niet-directe chats, zodat groepen/kanalen geen
Gateway-foutboilerplate zien. Directe chats tonen standaard compacte fouttekst;
ruwe runner-details worden alleen getoond wanneer `/verbose` `on` of `full` is.

Standaarden staan onder `agents.defaults.silentReply` en
`agents.defaults.silentReplyRewrite`; `surfaces.<id>.silentReply` en
`surfaces.<id>.silentReplyRewrite` kunnen ze per oppervlak overschrijven.

Wanneer de oudersessie één of meer pending gespawnde subagent-runs heeft, worden kale
stille antwoorden op alle oppervlakken gedropt in plaats van herschreven, zodat de
ouder stil blijft totdat het voltooiingsevenement van het kind het echte antwoord levert.

## Gerelateerd

- [Refactor van berichtenlifecycle](/nl/concepts/message-lifecycle-refactor) - doelontwerp voor duurzaam verzenden en ontvangen
- [Streaming](/nl/concepts/streaming) — realtime berichtlevering
- [Retry](/nl/concepts/retry) — retry-gedrag voor berichtlevering
- [Wachtrij](/nl/concepts/queue) — wachtrij voor berichtverwerking
- [Kanalen](/nl/channels) — integraties met berichtenplatforms
