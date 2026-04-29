---
read_when:
    - Uitleg over hoe inkomende berichten worden omgezet in antwoorden
    - Sessies, wachtrijmodi of streaminggedrag verduidelijken
    - Zichtbaarheid van redeneringen en gevolgen voor het gebruik documenteren
summary: Berichtenstroom, sessies, wachtrijvorming en zichtbaarheid van redenering
title: Berichten
x-i18n:
    generated_at: "2026-04-29T22:39:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 32e11bec46190e37fa6ce13ff876fe7c04299ae16a3690e5bbfac1d308071660
    source_path: concepts/messages.md
    workflow: 16
---

OpenClaw verwerkt inkomende berichten via een pipeline van sessieresolutie, wachtrijvorming, streaming, tooluitvoering en zichtbaarheid van redenering. Deze pagina brengt het pad van inkomend bericht naar antwoord in kaart.

## Berichtenstroom (hoog niveau)

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

Belangrijke knoppen staan in de configuratie:

- `messages.*` voor prefixes, wachtrijvorming en groepsgedrag.
- `agents.defaults.*` voor standaardinstellingen voor blokstreaming en opdelen in chunks.
- Kanaaloverrides (`channels.whatsapp.*`, `channels.telegram.*`, enzovoort) voor limieten en streaming-schakelaars.

Zie [Configuratie](/nl/gateway/configuration) voor het volledige schema.

## Dedupe van inkomende berichten

Kanalen kunnen hetzelfde bericht opnieuw afleveren na reconnects. OpenClaw houdt een
kortlevende cache bij, gesleuteld op kanaal/account/peer/sessie/bericht-id, zodat dubbele
afleveringen geen nieuwe agent-run triggeren.

## Debouncing van inkomende berichten

Snel opeenvolgende berichten van de **zelfde afzender** kunnen worden gebundeld in een enkele
agent-beurt via `messages.inbound`. Debouncing is gescoped per kanaal + gesprek
en gebruikt het meest recente bericht voor antwoord-threading/ID's.

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

- Debounce geldt voor **alleen-tekst**-berichten; media/bijlagen worden onmiddellijk geflusht.
- Besturingscommando's omzeilen debouncing zodat ze zelfstandig blijven — **behalve** wanneer een kanaal expliciet kiest voor samenvoegen van DM's van dezelfde afzender (bijv. [BlueBubbles `coalesceSameSenderDms`](/nl/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)), waarbij DM-commando's binnen het debounce-venster wachten zodat een split-send-payload aan dezelfde agent-beurt kan worden toegevoegd.

## Sessies en apparaten

Sessies zijn eigendom van de Gateway, niet van clients.

- Directe chats worden samengevouwen tot de hoofdsessiesleutel van de agent.
- Groepen/kanalen krijgen hun eigen sessiesleutels.
- De sessiestore en transcripties staan op de Gateway-host.

Meerdere apparaten/kanalen kunnen aan dezelfde sessie worden gekoppeld, maar de geschiedenis wordt niet volledig
teruggesynchroniseerd naar elke client. Aanbeveling: gebruik een primair apparaat voor lange
gesprekken om uiteenlopende context te voorkomen. De Control UI en TUI tonen altijd de
door de Gateway ondersteunde sessietranscriptie, dus zij zijn de bron van waarheid.

Details: [Sessiebeheer](/nl/concepts/session).

## Metadata van toolresultaten

Toolresultaat `content` is het model-zichtbare resultaat. Toolresultaat `details` is
runtime-metadata voor UI-rendering, diagnostiek, medialevering en Plugins.

OpenClaw houdt die grens expliciet:

- `toolResult.details` wordt verwijderd voor provider-replay en Compaction-invoer.
- Bewaarde sessietranscripties houden alleen begrensde `details`; te grote metadata
  wordt vervangen door een compacte samenvatting gemarkeerd met `persistedDetailsTruncated: true`.
- Plugins en tools moeten tekst die het model moet lezen in `content` zetten, niet alleen
  in `details`.

## Inkomende bodies en geschiedeniscontext

OpenClaw scheidt de **promptbody** van de **commandobody**:

- `Body`: prompttekst die naar de agent wordt gestuurd. Dit kan kanaal-enveloppen en
  optionele geschiedeniswrappers bevatten.
- `CommandBody`: ruwe gebruikerstekst voor directive-/commandoparsing.
- `RawBody`: legacy-alias voor `CommandBody` (behouden voor compatibiliteit).

Wanneer een kanaal geschiedenis aanlevert, gebruikt het een gedeelde wrapper:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Voor **niet-directe chats** (groepen/kanalen/rooms) krijgt de **huidige berichtbody** het
afzenderlabel als prefix (dezelfde stijl die wordt gebruikt voor geschiedenisitems). Dit houdt real-time en in de wachtrij geplaatste/geschiedenis-
berichten consistent in de agentprompt.

Geschiedenisbuffers zijn **alleen pending**: ze bevatten groepsberichten die _geen_
run hebben getriggerd (bijvoorbeeld mention-gated berichten) en **sluiten** berichten uit
die al in de sessietranscriptie staan.

Directive-stripping geldt alleen voor de sectie **huidig bericht**, zodat geschiedenis
intact blijft. Kanalen die geschiedenis wrappen, moeten `CommandBody` (of
`RawBody`) instellen op de oorspronkelijke berichttekst en `Body` als de gecombineerde prompt behouden.
Geschiedenisbuffers zijn configureerbaar via `messages.groupChat.historyLimit` (globale
standaard) en overrides per kanaal zoals `channels.slack.historyLimit` of
`channels.telegram.accounts.<id>.historyLimit` (stel `0` in om uit te schakelen).

## Wachtrijvorming en follow-ups

Als er al een run actief is, kunnen inkomende berichten in de wachtrij worden geplaatst, in de
huidige run worden gestuurd, of worden verzameld voor een follow-upbeurt.

- Configureer via `messages.queue` (en `messages.queue.byChannel`).
- De standaardmodus is `steer`, met een follow-updebounce van 500 ms wanneer sturen
  terugvalt op levering als follow-up in de wachtrij.
- Modi: `steer`, `followup`, `collect`, `steer-backlog`, `interrupt`, en de
  legacy-alias `queue`.

Details: [Commandowachtrij](/nl/concepts/queue).

## Eigenaarschap van kanaalruns

Kanaal-Plugins kunnen ordening behouden, input debouncen en transport-
backpressure toepassen voordat een bericht de sessiewachtrij ingaat. Ze mogen geen
afzonderlijke timeout rond de agent-beurt zelf opleggen. Zodra een bericht naar een
sessie is gerouteerd, wordt langlopende verwerking beheerd door de lifecycle van sessie, tool en runtime,
zodat alle kanalen trage beurten consistent rapporteren en herstellen.

## Streaming, opdelen in chunks en batching

Blokstreaming stuurt gedeeltelijke antwoorden terwijl het model tekstblokken produceert.
Opdelen in chunks respecteert tekstlimieten van kanalen en voorkomt het splitsen van fenced code.

Belangrijke instellingen:

- `agents.defaults.blockStreamingDefault` (`on|off`, standaard uit)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (idle-gebaseerde batching)
- `agents.defaults.humanDelay` (mensachtige pauze tussen blokantwoorden)
- Kanaaloverrides: `*.blockStreaming` en `*.blockStreamingCoalesce` (niet-Telegram-kanalen vereisen expliciet `*.blockStreaming: true`)

Details: [Streaming + opdelen in chunks](/nl/concepts/streaming).

## Zichtbaarheid van redenering en tokens

OpenClaw kan modelredenering tonen of verbergen:

- `/reasoning on|off|stream` regelt de zichtbaarheid.
- Redeneringsinhoud telt nog steeds mee voor tokengebruik wanneer die door het model wordt geproduceerd.
- Telegram ondersteunt reasoning-stream naar de conceptballon.

Details: [Denk- + redeneringsdirectives](/nl/tools/thinking) en [Tokengebruik](/nl/reference/token-use).

## Prefixes, threading en antwoorden

Opmaak van uitgaande berichten is gecentraliseerd in `messages`:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix`, en `channels.<channel>.accounts.<id>.responsePrefix` (cascade voor uitgaande prefixes), plus `channels.whatsapp.messagePrefix` (inkomende prefix voor WhatsApp)
- Antwoord-threading via `replyToMode` en kanaalspecifieke standaarden

Details: [Configuratie](/nl/gateway/config-agents#messages) en kanaaldocumentatie.

## Stille antwoorden

Het exacte stille token `NO_REPLY` / `no_reply` betekent "lever geen zichtbaar antwoord aan de gebruiker".
Wanneer een beurt ook pending toolmedia heeft, zoals gegenereerde TTS-audio, verwijdert OpenClaw
de stille tekst maar levert het nog steeds de mediabijlage.
OpenClaw lost dat gedrag op per gesprekstype:

- Directe gesprekken staan stilte standaard niet toe en herschrijven een kaal stil
  antwoord naar een kort zichtbaar fallbackantwoord.
- Groepen/kanalen staan stilte standaard toe.
- Interne orkestratie staat stilte standaard toe.

OpenClaw gebruikt stille antwoorden ook voor interne runner-fouten die optreden
voor een assistentantwoord in niet-directe chats, zodat groepen/kanalen geen
Gateway-foutboilerplate zien. Directe chats tonen standaard compacte fouttekst;
ruwe runnerdetails worden alleen getoond wanneer `/verbose` `on` of `full` is.

Standaarden staan onder `agents.defaults.silentReply` en
`agents.defaults.silentReplyRewrite`; `surfaces.<id>.silentReply` en
`surfaces.<id>.silentReplyRewrite` kunnen ze per surface overriden.

Wanneer de bovenliggende sessie een of meer pending gespawnde subagent-runs heeft, worden kale
stille antwoorden op alle surfaces gedropt in plaats van herschreven, zodat de
bovenliggende sessie stil blijft totdat de voltooiingsgebeurtenis van het kind het echte antwoord levert.

## Gerelateerd

- [Streaming](/nl/concepts/streaming) — real-time berichtlevering
- [Opnieuw proberen](/nl/concepts/retry) — retry-gedrag voor berichtlevering
- [Wachtrij](/nl/concepts/queue) — wachtrij voor berichtverwerking
- [Kanalen](/nl/channels) — integraties met messagingplatforms
