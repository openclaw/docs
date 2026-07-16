---
read_when:
    - Uitleg over hoe inkomende berichten antwoorden worden
    - Sessies, wachtrijmodi of streaminggedrag verduidelijken
    - Documentatie van de zichtbaarheid van redeneringen en de gevolgen voor het gebruik
summary: Berichtenstroom, sessies, wachtrijen en zichtbaarheid van redeneringen
title: Berichten
x-i18n:
    generated_at: "2026-07-16T15:30:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e2982ebb1b82b90368263826ef8f42babab9c8a559cc1409a381893a011a0ad7
    source_path: concepts/messages.md
    workflow: 16
---

Binnenkomende berichten doorlopen routering, deduplicatie/debounce, een agentuitvoering en uitgaande bezorging:

```text
Binnenkomend bericht
  -> routering/bindingen -> sessiesleutel
  -> deduplicatie + debounce
  -> wachtrij (als er al een uitvoering actief is)
  -> agentuitvoering (streaming + tools)
  -> uitgaande antwoorden (kanaallimieten + segmentering)
```

Belangrijkste configuratieonderdelen:

- `messages.*` voor voorvoegsels, wachtrijen, debounce van binnenkomende berichten en groepsgedrag.
- `agents.defaults.*` voor blokstreaming, segmentering en standaardinstellingen voor stille antwoorden.
- Kanaaloverschrijvingen (`channels.telegram.*`, `channels.whatsapp.*`, enz.) voor limieten en streamingschakelaars per kanaal.

Zie [Configuratie](/nl/gateway/configuration) voor het volledige schema.

## Deduplicatie van binnenkomende berichten

Kanalen kunnen hetzelfde bericht na een nieuwe verbinding opnieuw bezorgen. OpenClaw houdt een cache in het geheugen bij, met als sleutel het agentbereik, de kanaalroute (kanaal + peer + account + thread) en de bericht-ID, zodat een opnieuw bezorgd bericht geen tweede agentuitvoering activeert. De cachevermelding verloopt na 20 minuten of zodra 5000 vermeldingen worden bijgehouden, afhankelijk van wat het eerst gebeurt.

## Debounce van binnenkomende berichten

Snel opeenvolgende tekstberichten van dezelfde afzender kunnen via `messages.inbound` worden gebundeld tot één agentbeurt. Debounce wordt toegepast per kanaal + gesprek en gebruikt het meest recente bericht voor antwoordthreads/-ID's.

```json5
{
  messages: {
    inbound: {
      debounceMs: 2000,
      byChannel: {
        discord: 1500,
        slack: 1500,
        whatsapp: 5000,
      },
    },
  },
}
```

- Debounce geldt alleen voor tekstberichten; media/bijlagen worden onmiddellijk verwerkt.
- Besturingsopdrachten (stop/abort/status enz.) omzeilen debounce, zodat ze onmiddellijk worden uitgevoerd.
- Standaard uitgeschakeld: `messages.inbound.debounceMs` heeft geen ingebouwde standaardwaarde, dus debounce wordt pas geactiveerd nadat je deze instelt (globaal of per kanaal).
- De opt-in `coalesceSameSenderDms` van iMessage is de enige uitzondering: deze houdt alle DM-tekst van dezelfde afzender (inclusief opdrachten) lang genoeg vast om Apple's gesplitste verzending van opdracht+URL als één beurt te laten binnenkomen. Groepschats worden ongeacht deze instelling altijd onmiddellijk uitgevoerd.

## Sessies en apparaten

Sessies zijn eigendom van de Gateway, niet van clients.

- Directe chats worden samengevoegd onder de hoofdsessiesleutel van de agent.
- Groepen/kanalen krijgen hun eigen sessiesleutels.
- De sessieopslag en transcripties bevinden zich op de Gateway-host.

Meerdere apparaten/kanalen kunnen aan dezelfde sessie worden gekoppeld, maar de geschiedenis wordt niet volledig naar elke client teruggesynchroniseerd. Gebruik één primair apparaat voor lange gesprekken om uiteenlopende context te voorkomen. De Control UI en TUI tonen altijd de door de Gateway ondersteunde sessietranscriptie en vormen daarom de bron van waarheid.

Details: [Sessiebeheer](/nl/concepts/session).

## Promptinhoud en geschiedeniscontext

Kanaalplugins vullen verschillende tekstvelden in de binnenkomende context, van meest naar minst aanbevolen:

| Veld              | Doel                                                                                                        |
| ----------------- | ----------------------------------------------------------------------------------------------------------- |
| `BodyForAgent`    | Modelgerichte tekst voor de huidige beurt. Valt terug op `CommandBody` / `RawBody` / `Body` wanneer niet ingesteld.        |
| `BodyForCommands` | Opgeschoonde tekst voor het parseren van richtlijnen/opdrachten. Valt terug op `CommandBody` / `RawBody` / `Body` wanneer niet ingesteld. |
| `CommandBody`     | Verouderde tussentijdse inhoud; geef de voorkeur aan `BodyForCommands`.                                    |
| `RawBody`         | Afgeschafte alias voor `CommandBody`.                                                                      |
| `Body`            | Verouderde promptinhoud; kan kanaalenveloppen en geschiedeniswrappers bevatten.                            |

Wanneer een kanaal geschiedenis aanlevert, wordt deze omsloten met:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Bij niet-directe chats (groepen/kanalen/ruimten) wordt de inhoud van het huidige bericht voorafgegaan door het afzenderlabel, in dezelfde stijl als geschiedenisvermeldingen. Het verwijderen van richtlijnen geldt alleen voor de sectie met het huidige bericht, zodat de geschiedenis intact blijft. Kanalen die geschiedenis omsluiten, moeten `BodyForCommands` (of de verouderde `CommandBody` / `RawBody`) instellen op de oorspronkelijke berichttekst en `Body` als de gecombineerde prompt behouden.

Geschiedenisbuffers bevatten alleen wachtende berichten: ze bevatten groepsberichten die geen uitvoering activeerden (bijvoorbeeld berichten waarvoor een vermelding vereist is) en sluiten berichten uit die al in de sessietranscriptie staan. Gestructureerde geschiedenis, antwoorden, doorgestuurde berichten en kanaalmetadata worden tijdens de samenstelling van de prompt weergegeven als niet-vertrouwde contextblokken met de gebruikersrol.

Configureer de omvang van de geschiedenis met `messages.groupChat.historyLimit` (globale standaardwaarde) of kanaalspecifieke overschrijvingen zoals `channels.slack.historyLimit` en `channels.telegram.accounts.<id>.historyLimit` (stel `0` in om dit uit te schakelen).

## Metadata van toolresultaten

`content` van een toolresultaat is het resultaat dat zichtbaar is voor het model; `details` is runtimemetadata voor UI-weergave, diagnostiek, mediabezorging en plugins.

- `toolResult.details` wordt verwijderd vóór herhaling door de provider en vóór invoer voor Compaction.
- Opgeslagen sessietranscripties behouden alleen begrensde `details`; te grote metadata worden vervangen door een compacte samenvatting met de markering `persistedDetailsTruncated: true`.
- Plugins en tools moeten tekst die het model moet lezen in `content` plaatsen, niet alleen in `details`.

## Wachtrijen en vervolgberichten

Wanneer er al een uitvoering actief is, sturen binnenkomende berichten deze standaard bij. `messages.queue` bepaalt de modus:

| Modus             | Gedrag                                              |
| ----------------- | --------------------------------------------------- |
| `steer` (standaard) | Voeg de nieuwe prompt toe aan de actieve uitvoering. |
| `followup`        | Voer het bericht uit nadat de actieve uitvoering is voltooid. |
| `collect`         | Bundel compatibele berichten in één latere beurt.   |
| `interrupt`       | Breek de actieve uitvoering af en start vervolgens de nieuwste prompt. |

Standaardwaarden: `messages.queue.debounceMs` is 500ms (geldt zowel voor bijsturen als vervolgberichten en verzamelbundeling), `messages.queue.cap` is 20 berichten in de wachtrij en `messages.queue.drop` is `summarize` (`old` en `new` zijn ook beschikbaar). Configureer kanaalspecifieke overschrijvingen via `messages.queue.byChannel` en `messages.queue.debounceMsByChannel`.

Details: [Opdrachtwachtrij](/nl/concepts/queue) en [Bijsturingswachtrij](/nl/concepts/queue-steering).

## Eigenaarschap van kanaaluitvoeringen

Kanaalplugins kunnen de volgorde behouden, debounce op invoer toepassen en transportbackpressure toepassen voordat een bericht de sessiewachtrij binnenkomt. Ze mogen geen afzonderlijke time-out rond de agentbeurt zelf afdwingen. Zodra een bericht naar een sessie is gerouteerd, beheert de levenscyclus van de sessie, tools en runtime langdurige werkzaamheden, zodat alle kanalen trage beurten consistent rapporteren en daarvan herstellen.

## Streaming, segmentering en bundeling

Blokstreaming verzendt gedeeltelijke antwoorden terwijl het model tekstblokken produceert; segmentering respecteert de tekstlimieten van het kanaal en voorkomt het splitsen van omheinde code.

- `agents.defaults.blockStreamingDefault` (`on|off`, standaard `off`)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (bundeling op basis van inactiviteit)
- `agents.defaults.humanDelay` (mensachtige pauze tussen blokantwoorden)
- Kanaaloverschrijvingen: `*.streaming.block.enabled` en `*.streaming.block.coalesce` op gebundelde kanalen; verouderde platte sleutels worden gemigreerd door `openclaw doctor --fix`. Blokstreaming is op elk kanaal, inclusief Telegram, uitgeschakeld tenzij dit expliciet wordt ingeschakeld. QQ Bot is de uitzondering: deze heeft geen `streaming.block`-sleutels en streamt blokantwoorden tenzij `channels.qqbot.streaming.mode` `"off"` is.

Details: [Streaming + segmentering](/nl/concepts/streaming).

## Zichtbaarheid van redeneringen en tokens

- `/reasoning on|off|stream` bepaalt de zichtbaarheid.
- De inhoud van redeneringen telt nog steeds mee voor het tokengebruik wanneer het model deze produceert.
- Telegram ondersteunt het streamen van redeneringen naar een tijdelijke conceptballon die na de definitieve bezorging wordt verwijderd; gebruik `/reasoning on` voor blijvende uitvoer van redeneringen.

Details: [Denk- en redeneerrichtlijnen](/nl/tools/thinking) en [Tokengebruik](/nl/reference/token-use).

## Voorvoegsels, threads en antwoorden

- Cascade van uitgaande voorvoegsels: `messages.responsePrefix`, `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`. WhatsApp heeft ook `channels.whatsapp.messagePrefix` voor een binnenkomend voorvoegsel.
- Antwoordthreads via `replyToMode` en kanaalspecifieke standaardwaarden.

Details: [Configuratie](/nl/gateway/config-agents#messages) en kanaaldocumentatie.

## Stille antwoorden

Het stille token `NO_REPLY` (niet-hoofdlettergevoelig, dus `no_reply` komt ook overeen) betekent "bezorg geen voor de gebruiker zichtbaar antwoord". Wanneer een beurt ook wachtende toolmedia bevat, zoals gegenereerde TTS-audio, verwijdert OpenClaw de stille tekst maar bezorgt het de mediabijlage wel.

Het stiltebeleid wordt bepaald door het gesprekstype:

- Directe gesprekken ontvangen nooit `NO_REPLY`-promptinstructies. Als een directe uitvoering per ongeluk alleen een stil token retourneert, onderdrukt OpenClaw dit in plaats van het te herschrijven of te bezorgen.
- Groepen/kanalen staan stilte standaard toe. In de modus `message_tool` voor zichtbare antwoorden betekent stilte dat het model `message(action=send)` niet aanroept.
- Interne orkestratie staat stilte standaard toe.

Standaardwaarden staan onder `agents.defaults.silentReply`; `surfaces.<id>.silentReply` kan het groeps-/interne beleid per oppervlak overschrijven.

OpenClaw gebruikt stille antwoorden ook voor algemene fouten van de interne uitvoerder in niet-directe chats, zodat groepen/kanalen geen standaardtekst voor Gateway-fouten zien. Geclassificeerde fouten met gebruikersgerichte herstelinstructies, zoals meldingen over ontbrekende authenticatie, frequentielimieten of overbelasting, kunnen nog steeds worden bezorgd. Directe chats tonen standaard een compacte foutmelding; onbewerkte details van de uitvoerder worden alleen getoond wanneer `/verbose full` is ingeschakeld.

Antwoorden die uitsluitend uit het stille token bestaan, worden op alle oppervlakken verwijderd, zodat bovenliggende sessies stil blijven in plaats van de sentineltekst te herschrijven tot terugvaltekst.

## Gerelateerd

- [Herstructurering van de berichtlevenscyclus](/nl/concepts/message-lifecycle-refactor) - beoogd duurzaam ontwerp voor verzenden en ontvangen
- [Streaming](/nl/concepts/streaming) - realtime bezorging van berichten
- [Opnieuw proberen](/nl/concepts/retry) - gedrag bij nieuwe bezorgpogingen van berichten
- [Wachtrij](/nl/concepts/queue) - wachtrij voor berichtverwerking
- [Kanalen](/nl/channels) - integraties met berichtenplatforms
