---
read_when:
    - Uitleg over hoe streaming of opdelen in segmenten werkt in kanalen
    - Gedrag voor blokstreaming of kanaalfragmentering wijzigen
    - Fouten opsporen in dubbele/vroege blokantwoorden of streaming van kanaalvoorvertoningen
summary: Streaming + segmentatiegedrag (blokreacties, streaming van kanaalvoorbeelden, modustoewijzing)
title: Streamen en opdelen in blokken
x-i18n:
    generated_at: "2026-05-06T09:10:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7ccf763c5904b9b01d127d6e9a914e73100137eba9d791654581a2ec7d4949ed
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw heeft twee afzonderlijke streaminglagen:

- **Blokstreaming (kanalen):** zend voltooide **blokken** uit terwijl de assistant schrijft. Dit zijn normale kanaalberichten (geen token-delta's).
- **Previewstreaming (Telegram/Discord/Slack):** werk tijdens het genereren een tijdelijk **previewbericht** bij.

Er is vandaag **geen echte token-delta-streaming** naar kanaalberichten. Previewstreaming is berichtgebaseerd (verzenden + bewerkingen/toevoegingen).

## Blokstreaming (kanaalberichten)

Blokstreaming verzendt assistant-uitvoer in grove chunks zodra die beschikbaar komt.

```
Model output
  └─ text_delta/events
       ├─ (blockStreamingBreak=text_end)
       │    └─ chunker emits blocks as buffer grows
       └─ (blockStreamingBreak=message_end)
            └─ chunker flushes at message_end
                   └─ channel send (block replies)
```

Legenda:

- `text_delta/events`: modelstreamgebeurtenissen (kunnen schaars zijn voor niet-streamende modellen).
- `chunker`: `EmbeddedBlockChunker` die min-/maxgrenzen + breukvoorkeur toepast.
- `channel send`: daadwerkelijke uitgaande berichten (blokantwoorden).

**Besturingselementen:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (standaard uit).
- Kanaaloverschrijvingen: `*.blockStreaming` (en varianten per account) om `"on"`/`"off"` per kanaal af te dwingen.
- `agents.defaults.blockStreamingBreak`: `"text_end"` of `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (gestreamde blokken samenvoegen vóór verzending).
- Harde kanaallimiet: `*.textChunkLimit` (bijv. `channels.whatsapp.textChunkLimit`).
- Kanaalchunkmodus: `*.chunkMode` (`length` standaard, `newline` splitst op lege regels (alineagrenzen) vóór chunking op lengte).
- Discord-zachte limiet: `channels.discord.maxLinesPerMessage` (standaard 17) splitst hoge antwoorden om UI-afkapping te vermijden.

**Grenssemantiek:**

- `text_end`: stream blokken zodra de chunker ze uitgeeft; flush bij elke `text_end`.
- `message_end`: wacht tot het assistant-bericht klaar is en flush daarna gebufferde uitvoer.

`message_end` gebruikt nog steeds de chunker als de gebufferde tekst `maxChars` overschrijdt, dus dit kan aan het einde meerdere chunks uitgeven.

### Medialevering met blokstreaming

`MEDIA:`-directieven zijn normale leveringsmetadata. Wanneer blokstreaming een
mediablok vroeg verzendt, onthoudt OpenClaw die levering voor de beurt. Als de uiteindelijke
assistant-payload dezelfde media-URL herhaalt, verwijdert de uiteindelijke levering de
dubbele media in plaats van de bijlage opnieuw te verzenden.

Exact dubbele uiteindelijke payloads worden onderdrukt. Als de uiteindelijke payload
onderscheidende tekst toevoegt rond media die al was gestreamd, verzendt OpenClaw nog steeds de
nieuwe tekst terwijl de media slechts eenmaal wordt geleverd. Dit voorkomt dubbele spraaknotities
of bestanden op kanalen zoals Telegram wanneer een agent tijdens streaming `MEDIA:` uitgeeft
en de provider dit ook in het voltooide antwoord opneemt.

## Chunking-algoritme (lage/hoge grenzen)

Blokchunking wordt geïmplementeerd door `EmbeddedBlockChunker`:

- **Lage grens:** geef niets uit totdat buffer >= `minChars` (tenzij afgedwongen).
- **Hoge grens:** geef de voorkeur aan splitsingen vóór `maxChars`; als het wordt afgedwongen, splits op `maxChars`.
- **Breukvoorkeur:** `paragraph` → `newline` → `sentence` → `whitespace` → harde breuk.
- **Code fences:** splits nooit binnen fences; sluit en heropen de fence bij afdwingen op `maxChars` om Markdown geldig te houden.

`maxChars` wordt begrensd op de kanaal-`textChunkLimit`, dus je kunt limieten per kanaal niet overschrijden.

## Samenvoegen (gestreamde blokken samenvoegen)

Wanneer blokstreaming is ingeschakeld, kan OpenClaw **opeenvolgende blokchunks samenvoegen**
voordat ze worden verzonden. Dit vermindert "single-line spam" terwijl er nog steeds
progressieve uitvoer wordt geleverd.

- Samenvoegen wacht op **inactieve intervallen** (`idleMs`) voordat er wordt geflusht.
- Buffers worden begrensd door `maxChars` en worden geflusht als ze die overschrijden.
- `minChars` voorkomt dat kleine fragmenten worden verzonden totdat er genoeg tekst is verzameld
  (de uiteindelijke flush verzendt altijd resterende tekst).
- De joiner wordt afgeleid van `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → spatie).
- Kanaaloverschrijvingen zijn beschikbaar via `*.blockStreamingCoalesce` (inclusief configuraties per account).
- Standaard samenvoeg-`minChars` wordt verhoogd naar 1500 voor Signal/Slack/Discord tenzij overschreven.

## Menselijk tempo tussen blokken

Wanneer blokstreaming is ingeschakeld, kun je een **willekeurige pauze** toevoegen tussen
blokantwoorden (na het eerste blok). Hierdoor voelen antwoorden met meerdere bubbels
natuurlijker aan.

- Configuratie: `agents.defaults.humanDelay` (overschrijven per agent via `agents.list[].humanDelay`).
- Modi: `off` (standaard), `natural` (800-2500ms), `custom` (`minMs`/`maxMs`).
- Geldt alleen voor **blokantwoorden**, niet voor uiteindelijke antwoorden of toolsamenvattingen.

## "Chunks streamen of alles"

Dit komt overeen met:

- **Chunks streamen:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (uitgeven terwijl je gaat). Niet-Telegram-kanalen hebben ook `*.blockStreaming: true` nodig.
- **Alles aan het einde streamen:** `blockStreamingBreak: "message_end"` (eenmaal flushen, mogelijk meerdere chunks als het erg lang is).
- **Geen blokstreaming:** `blockStreamingDefault: "off"` (alleen uiteindelijke antwoord).

**Kanaalopmerking:** Blokstreaming is **uit tenzij**
`*.blockStreaming` expliciet op `true` is gezet. Kanalen kunnen een live preview streamen
(`channels.<channel>.streaming`) zonder blokantwoorden.

Configuratielocatie ter herinnering: de `blockStreaming*`-standaarden staan onder
`agents.defaults`, niet in de rootconfiguratie.

## Previewstreamingmodi

Canonieke sleutel: `channels.<channel>.streaming`

Modi:

- `off`: previewstreaming uitschakelen.
- `partial`: één preview die wordt vervangen door de nieuwste tekst.
- `block`: preview wordt bijgewerkt in gechunkte/toegevoegde stappen.
- `progress`: voortgangs-/statuspreview tijdens generatie, definitief antwoord bij voltooiing.

`streaming.mode: "block"` is een previewstreamingmodus voor kanalen die bewerken ondersteunen,
zoals Discord en Telegram. Het schakelt daar geen kanaalbloklevering in.
Gebruik `streaming.block.enabled` of de verouderde kanaalsleutel `blockStreaming` wanneer
je normale blokantwoorden wilt. Microsoft Teams is de uitzondering: het heeft geen
draft-preview-bloktransport, dus `streaming.mode: "block"` wordt gekoppeld aan Teams-bloklevering
in plaats van native partial-/progress-streaming.

### Kanaaltoewijzing

| Kanaal     | `off` | `partial` | `block` | `progress`              |
| ---------- | ----- | --------- | ------- | ----------------------- |
| Telegram   | ✅    | ✅        | ✅      | bewerkbare voortgangsconcept |
| Discord    | ✅    | ✅        | ✅      | bewerkbare voortgangsconcept |
| Slack      | ✅    | ✅        | ✅      | ✅                      |
| Mattermost | ✅    | ✅        | ✅      | ✅                      |
| MS Teams   | ✅    | ✅        | ✅      | native voortgangsstream |

Alleen Slack:

- `channels.slack.streaming.nativeTransport` schakelt Slack-native streaming-API-aanroepen in of uit wanneer `channels.slack.streaming.mode="partial"` (standaard: `true`).
- Slack-native streaming en Slack-assistant-threadstatus vereisen een antwoordthreaddoel. DMs op topniveau tonen die threadachtige preview niet, maar kunnen nog steeds Slack-conceptpreviewposts en bewerkingen gebruiken.

Migratie van verouderde sleutels:

- Telegram: verouderde `streamMode`- en scalaire/booleaanse `streaming`-waarden worden gedetecteerd en door doctor-/configcompatibiliteitspaden gemigreerd naar `streaming.mode`.
- Discord: `streamMode` + booleaanse `streaming` migreert automatisch naar de `streaming`-enum.
- Slack: `streamMode` migreert automatisch naar `streaming.mode`; booleaanse `streaming` migreert automatisch naar `streaming.mode` plus `streaming.nativeTransport`; verouderde `nativeStreaming` migreert automatisch naar `streaming.nativeTransport`.

### Runtimegedrag

Telegram:

- Gebruikt `sendMessage` + `editMessageText`-previewupdates in DMs en groepen/topics.
- Definitieve tekst bewerkt de actieve preview op zijn plaats; lange definitieve antwoorden hergebruiken dat bericht voor de eerste chunk en verzenden alleen de resterende chunks.
- `progress`-modus houdt toolvoortgang bij in een bewerkbaar statusconcept, wist dat concept bij voltooiing en verzendt het definitieve antwoord via normale levering.
- Als de definitieve bewerking mislukt voordat de voltooide tekst is bevestigd, gebruikt OpenClaw normale definitieve levering en ruimt de verouderde preview op.
- Previewstreaming wordt overgeslagen wanneer Telegram-blokstreaming expliciet is ingeschakeld (om dubbel streamen te voorkomen).
- `/reasoning stream` kan redenering naar een tijdelijke preview schrijven die na definitieve levering wordt verwijderd.

Discord:

- Gebruikt previewberichten verzenden + bewerken.
- `block`-modus gebruikt conceptchunking (`draftChunk`).
- Previewstreaming wordt overgeslagen wanneer Discord-blokstreaming expliciet is ingeschakeld.
- Definitieve media-, fout- en expliciete-antwoordpayloads annuleren wachtende previews zonder een nieuw concept te flushen en gebruiken daarna normale levering.

Slack:

- `partial` kan Slack-native streaming (`chat.startStream`/`append`/`stop`) gebruiken wanneer beschikbaar.
- `block` gebruikt conceptpreviews met toevoegstijl.
- `progress` gebruikt statuspreviewtekst en daarna het definitieve antwoord.
- DMs op topniveau zonder antwoordthread gebruiken conceptpreviewposts en bewerkingen in plaats van Slack-native streaming.
- Native en conceptpreviewstreaming onderdrukken blokantwoorden voor die beurt, zodat een Slack-antwoord slechts via één leveringspad wordt gestreamd.
- Definitieve media-/foutpayloads en voortgangsdefinitieven maken geen tijdelijke conceptberichten aan; alleen tekst-/blokdefinitieven die de preview kunnen bewerken flushen wachtende concepttekst.

Mattermost:

- Streamt denken, toolactiviteit en gedeeltelijke antwoordtekst naar één conceptpreviewpost die op zijn plaats definitief wordt gemaakt wanneer het definitieve antwoord veilig kan worden verzonden.
- Valt terug op het verzenden van een nieuwe definitieve post als de previewpost is verwijderd of anderszins niet beschikbaar is op het moment van afronden.
- Definitieve media-/foutpayloads annuleren wachtende previewupdates vóór normale levering in plaats van een tijdelijke previewpost te flushen.

Matrix:

- Conceptpreviews worden op hun plaats definitief gemaakt wanneer de definitieve tekst de previewgebeurtenis kan hergebruiken.
- Definitieven met alleen media, fouten en niet-overeenkomende antwoorddoelen annuleren wachtende previewupdates vóór normale levering; een al zichtbare verouderde preview wordt geredacteerd.

### Toolvoortgangs-previewupdates

Previewstreaming kan ook **toolvoortgangs**updates bevatten - korte statusregels zoals "zoeken op het web", "bestand lezen" of "tool aanroepen" - die in hetzelfde previewbericht verschijnen terwijl tools draaien, vóór het definitieve antwoord. Dit houdt toolbeurten met meerdere stappen visueel levendig in plaats van stil tussen de eerste denkpreview en het definitieve antwoord.

Ondersteunde oppervlakken:

- **Discord**, **Slack**, **Telegram** en **Matrix** streamen toolvoortgang standaard naar de live voorvertoningsbewerking wanneer voorvertoningsstreaming actief is. Microsoft Teams gebruikt zijn native voortgangsstream in persoonlijke chats.
- Telegram wordt sinds `v2026.4.22` geleverd met toolvoortgangsupdates in de voorvertoning ingeschakeld; ze ingeschakeld houden behoudt dat uitgebrachte gedrag.
- **Mattermost** neemt toolactiviteit al op in zijn ene conceptvoorvertoningsbericht (zie hierboven).
- Toolvoortgangsbewerkingen volgen de actieve modus voor voorvertoningsstreaming; ze worden overgeslagen wanneer voorvertoningsstreaming `off` is of wanneer blokstreaming het bericht heeft overgenomen. Op Telegram is `streaming.mode: "off"` alleen definitief: algemene voortgangsmeldingen worden ook onderdrukt in plaats van als zelfstandige statusberichten te worden geleverd, terwijl goedkeuringsprompts, media-payloads en fouten nog steeds normaal worden gerouteerd.
- Als je voorvertoningsstreaming wilt behouden maar toolvoortgangsregels wilt verbergen, stel je `streaming.preview.toolProgress` voor dat kanaal in op `false`. Als je toolvoortgangsregels zichtbaar wilt houden terwijl je opdracht-/exec-tekst verbergt, stel je `streaming.preview.commandText` in op `"status"` of `streaming.progress.commandText` op `"status"`; de standaardwaarde is `"raw"` om uitgebracht gedrag te behouden. Dit beleid wordt gedeeld door concept-/voortgangskanalen die OpenClaw's compacte voortgangsrenderer gebruiken, waaronder Discord, Matrix, Microsoft Teams, Mattermost, Slack-conceptvoorvertoningen en Telegram. Als je voorvertoningsbewerkingen volledig wilt uitschakelen, stel je `streaming.mode` in op `off`.
- Telegram-antwoorden met geselecteerde citaten vormen een uitzondering: wanneer `replyToMode` niet `"off"` is en geselecteerde citaattekst aanwezig is, slaat OpenClaw de antwoordvoorvertoningsstream voor die beurt over, zodat toolvoortgangsregels in de voorvertoning niet kunnen worden weergegeven. Antwoorden op het huidige bericht zonder geselecteerde citaattekst blijven voorvertoningsstreaming gebruiken. Zie de [Telegram-kanaaldocumentatie](/nl/channels/telegram) voor details.

Houd voortgangsregels zichtbaar maar verberg ruwe opdracht-/exec-tekst:

```json
{
  "channels": {
    "telegram": {
      "streaming": {
        "mode": "partial",
        "preview": {
          "toolProgress": true,
          "commandText": "status"
        }
      }
    }
  }
}
```

Gebruik dezelfde vorm onder een andere compacte voortgangskanaalsleutel, bijvoorbeeld `channels.discord`, `channels.matrix`, `channels.msteams`, `channels.mattermost` of Slack-conceptvoorvertoningen. Voor voortgangsconceptmodus plaats je hetzelfde beleid onder `streaming.progress`:

```json
{
  "channels": {
    "telegram": {
      "streaming": {
        "mode": "progress",
        "progress": {
          "toolProgress": true,
          "commandText": "status"
        }
      }
    }
  }
}
```

## Gerelateerd

- [Refactor van berichtlevenscyclus](/nl/concepts/message-lifecycle-refactor) - doelontwerp voor gedeelde voorvertoning, bewerking, stream en afronding
- [Voortgangsconcepten](/nl/concepts/progress-drafts) - zichtbare werk-in-uitvoering-berichten die tijdens lange beurten worden bijgewerkt
- [Berichten](/nl/concepts/messages) - berichtlevenscyclus en levering
- [Opnieuw proberen](/nl/concepts/retry) - gedrag voor opnieuw proberen bij leveringsfouten
- [Kanalen](/nl/channels) - streamingondersteuning per kanaal
