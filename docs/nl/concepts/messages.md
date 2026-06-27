---
read_when:
    - Uitleg over hoe inkomende berichten antwoorden worden
    - Sessies, wachtrijmodi of streaminggedrag verduidelijken
    - Redeneerzichtbaarheid en gebruiksimplicaties documenteren
summary: Berichtenstroom, sessies, wachtrijen en zichtbaarheid van redenering
title: Berichten
x-i18n:
    generated_at: "2026-06-27T17:27:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d5585ae95fc65cb64240e4bf5d0bbe2eb54f55461b9fa4ee331d4d703d62e76f
    source_path: concepts/messages.md
    workflow: 16
---

OpenClaw verwerkt inkomende berichten via een pipeline van sessieresolutie, wachtrijvorming, streaming, tooluitvoering en zichtbaarheid van redeneringen. Deze pagina brengt het pad van inkomend bericht naar antwoord in kaart.

## Berichtenstroom (globaal)

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

Belangrijke knoppen staan in de configuratie:

- `messages.*` voor prefixes, wachtrijvorming en groepsgedrag.
- `agents.defaults.*` voor standaardinstellingen voor blokstreaming en chunking.
- Kanaaloverrides (`channels.whatsapp.*`, `channels.telegram.*`, enz.) voor limieten en streaming-schakelaars.

Zie [Configuratie](/nl/gateway/configuration) voor het volledige schema.

## Dedupe van inkomende berichten

Kanalen kunnen hetzelfde bericht opnieuw afleveren na opnieuw verbinden. OpenClaw houdt een kortlevende cache bij op basis van kanaal/account/peer/sessie/bericht-id, zodat dubbele afleveringen geen nieuwe agentrun starten.

## Debouncing van inkomende berichten

Snelle opeenvolgende berichten van **dezelfde afzender** kunnen via `messages.inbound` worden gebundeld in één agentbeurt. Debouncing is afgebakend per kanaal + gesprek en gebruikt het meest recente bericht voor antwoordthreading/ID's.

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

- Debounce is van toepassing op berichten met **alleen tekst**; media/bijlagen flushen onmiddellijk.
- Besturingscommando's omzeilen debouncing, zodat ze op zichzelf blijven staan. Kanalen die expliciet kiezen voor samenvoegen van DM's van dezelfde afzender, kunnen DM-commando's binnen het debounce-venster houden, zodat een gesplitst verzonden payload kan worden samengevoegd in dezelfde agentbeurt.

## Sessies en apparaten

Sessies zijn eigendom van de Gateway, niet van clients.

- Directe chats worden samengevouwen naar de hoofdsessiesleutel van de agent.
- Groepen/kanalen krijgen hun eigen sessiesleutels.
- De sessiestore en transcripts staan op de Gateway-host.

Meerdere apparaten/kanalen kunnen naar dezelfde sessie verwijzen, maar geschiedenis wordt niet volledig teruggesynchroniseerd naar elke client. Aanbeveling: gebruik één primair apparaat voor lange gesprekken om uiteenlopende context te voorkomen. De Control UI en TUI tonen altijd het sessietranscript dat door de Gateway wordt ondersteund, dus zij zijn de bron van waarheid.

Details: [Sessiebeheer](/nl/concepts/session).

## Metadata van toolresultaten

Toolresultaat `content` is het resultaat dat zichtbaar is voor het model. Toolresultaat `details` is runtimemetadata voor UI-rendering, diagnostiek, medialevering en plugins.

OpenClaw houdt die grens expliciet:

- `toolResult.details` wordt verwijderd vóór providerreplay en Compaction-invoer.
- Persistente sessietranscripts bewaren alleen begrensde `details`; te grote metadata wordt vervangen door een compacte samenvatting gemarkeerd met `persistedDetailsTruncated: true`.
- Plugins en tools moeten tekst die het model moet lezen in `content` plaatsen, niet alleen in `details`.

## Inkomende bodies en geschiedeniscontext

OpenClaw scheidt de **promptbody** van de **commandobody**:

- `BodyForAgent`: primaire modelgerichte tekst voor het huidige bericht. Kanaalplugins moeten dit gericht houden op de huidige promptdragende tekst van de afzender.
- `Body`: legacy promptfallback. Dit kan kanaalenveloppen en optionele geschiedeniswrappers bevatten, maar huidige kanalen moeten er niet op vertrouwen als primaire modelinvoer wanneer `BodyForAgent` beschikbaar is.
- `CommandBody`: ruwe gebruikerstekst voor directive-/commandoparsing.
- `RawBody`: legacy alias voor `CommandBody` (behouden voor compatibiliteit).

Wanneer een kanaal geschiedenis aanlevert, gebruikt het een gedeelde wrapper:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Voor **niet-directe chats** (groepen/kanalen/ruimtes) krijgt de **huidige berichtbody** een prefix met het afzenderlabel (dezelfde stijl als voor geschiedenisitems). Dit houdt realtime en wachtrij-/geschiedenisberichten consistent in de agentprompt.

Geschiedenisbuffers zijn **alleen pending**: ze bevatten groepsberichten die _geen_ run hebben gestart (bijvoorbeeld berichten die door mention-gating zijn tegengehouden) en **sluiten** berichten uit die al in het sessietranscript staan.

Directive-stripping geldt alleen voor de sectie **huidig bericht**, zodat geschiedenis intact blijft. Kanalen die geschiedenis wrappen, moeten `CommandBody` (of `RawBody`) instellen op de oorspronkelijke berichttekst en `Body` behouden als de gecombineerde prompt. Gestructureerde geschiedenis, antwoorden, doorgestuurde berichten en kanaalmetadata worden tijdens promptassemblage gerenderd als niet-vertrouwde contextblokken met gebruikersrol.
Geschiedenisbuffers zijn configureerbaar via `messages.groupChat.historyLimit` (globale standaard) en overrides per kanaal zoals `channels.slack.historyLimit` of `channels.telegram.accounts.<id>.historyLimit` (stel `0` in om uit te schakelen).

## Wachtrijvorming en follow-ups

Als er al een run actief is, worden inkomende berichten standaard naar de huidige run gestuurd. `messages.queue` bepaalt of berichten tijdens een actieve run worden gestuurd, in de wachtrij worden gezet voor later, worden verzameld in één latere beurt, of de actieve run onderbreken.

- Configureer via `messages.queue` (en `messages.queue.byChannel`).
- De standaardmodus is `steer`, met een debounce van 500 ms voor Codex-stuurbatches en follow-up-/verzamelwachtrijen.
- Modi: `steer`, `followup`, `collect` en `interrupt`.

Details: [Commandowachtrij](/nl/concepts/queue) en [Stuurwachtrij](/nl/concepts/queue-steering).

## Eigendom van kanaalruns

Kanaalplugins kunnen volgorde behouden, invoer debouncen en transport-backpressure toepassen voordat een bericht de sessiewachtrij binnenkomt. Ze mogen geen aparte timeout rond de agentbeurt zelf opleggen. Zodra een bericht naar een sessie is gerouteerd, wordt langlopende verwerking beheerd door de sessie-, tool- en runtimelifecycle, zodat alle kanalen trage beurten consistent rapporteren en ervan herstellen.

## Streaming, chunking en batching

Blokstreaming verzendt gedeeltelijke antwoorden terwijl het model tekstblokken produceert. Chunking respecteert tekstlimieten van kanalen en voorkomt het splitsen van fenced code.

Belangrijke instellingen:

- `agents.defaults.blockStreamingDefault` (`on|off`, standaard uit)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (batching op basis van idle-tijd)
- `agents.defaults.humanDelay` (mensachtige pauze tussen blokantwoorden)
- Kanaaloverrides: `*.blockStreaming` en `*.blockStreamingCoalesce` (niet-Telegram-kanalen vereisen expliciet `*.blockStreaming: true`)

Details: [Streaming + chunking](/nl/concepts/streaming).

## Zichtbaarheid van redeneringen en tokens

OpenClaw kan modelredenering tonen of verbergen:

- `/reasoning on|off|stream` regelt de zichtbaarheid.
- Redeneerinhoud telt nog steeds mee voor tokengebruik wanneer het model die produceert.
- Telegram ondersteunt redeneringsstreaming naar een tijdelijke conceptballon die na definitieve aflevering wordt verwijderd; gebruik `/reasoning on` voor persistente redeneeruitvoer.

Details: [Denk- en redeneerinstructies](/nl/tools/thinking) en [Tokengebruik](/nl/reference/token-use).

## Prefixes, threading en antwoorden

Opmaak van uitgaande berichten is gecentraliseerd in `messages`:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` en `channels.<channel>.accounts.<id>.responsePrefix` (cascade voor uitgaande prefix), plus `channels.whatsapp.messagePrefix` (inkomende WhatsApp-prefix)
- Antwoordthreading via `replyToMode` en standaarden per kanaal

Details: [Configuratie](/nl/gateway/config-agents#messages) en kanaaldocumentatie.

## Stille antwoorden

De exacte stille token `NO_REPLY` / `no_reply` betekent "lever geen gebruikerszichtbaar antwoord af".
Wanneer een beurt ook pending toolmedia heeft, zoals gegenereerde TTS-audio, verwijdert OpenClaw de stille tekst maar levert het de mediabijlage nog steeds af.
OpenClaw bepaalt dat gedrag op basis van gesprekstype:

- Directe gesprekken krijgen nooit `NO_REPLY`-promptbegeleiding. Als een directe run per ongeluk een kale stille token retourneert, onderdrukt OpenClaw die in plaats van deze te herschrijven of af te leveren.
- Groepen/kanalen staan stilte standaard alleen toe voor automatische groepsantwoorden. In de zichtbare-antwoordmodus van `message_tool` betekent stilte dat het model `message(action=send)` niet aanroept.
- Interne orkestratie staat stilte standaard toe.

OpenClaw gebruikt stille antwoorden ook voor generieke interne runnerfouten in niet-directe chats, zodat groepen/kanalen geen standaardfouttekst van de Gateway zien.
Geclassificeerde fouten met gebruikersgerichte hersteltekst, zoals ontbrekende auth, rate-limit- of overbelastingsmeldingen, kunnen nog steeds worden afgeleverd. Directe chats tonen standaard compacte fouttekst; ruwe runnerdetails worden alleen getoond wanneer `/verbose full` is ingeschakeld.

Standaarden staan onder `agents.defaults.silentReply`; `surfaces.<id>.silentReply` kan groeps-/intern beleid per surface overriden.

Kale stille antwoorden worden op alle surfaces verwijderd, zodat bovenliggende sessies stil blijven in plaats van sentineltekst te herschrijven naar fallback-gebabbel.

## Gerelateerd

- [Refactor van berichtlifecycle](/nl/concepts/message-lifecycle-refactor) - doelontwerp voor duurzame verzending en ontvangst
- [Streaming](/nl/concepts/streaming) — realtime berichtaflevering
- [Opnieuw proberen](/nl/concepts/retry) — retrygedrag voor berichtaflevering
- [Wachtrij](/nl/concepts/queue) — wachtrij voor berichtverwerking
- [Kanalen](/nl/channels) — integraties met messagingplatforms
