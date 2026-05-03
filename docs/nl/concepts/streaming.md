---
read_when:
    - Uitleg over hoe streaming of chunking op kanalen werkt
    - Gedrag voor het streamen van blokken of het opdelen van kanalen wijzigen
    - Debuggen van dubbele/vroegtijdige blokantwoorden of kanaalpreviewstreaming
summary: Streaming- en chunkinggedrag (blokantwoorden, streaming van kanaalvoorbeelden, modusmapping)
title: Streamen en opdelen in stukken
x-i18n:
    generated_at: "2026-05-03T11:08:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 85f6cb33031a6c818bb709e0ed14d8dd0f8c30a3dd90468a40396b3a515b5e65
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw heeft twee afzonderlijke streaminglagen:

- **Blokstreaming (kanalen):** verzendt voltooide **blokken** terwijl de assistant schrijft. Dit zijn normale kanaalberichten (geen token-delta's).
- **Previewstreaming (Telegram/Discord/Slack):** werkt een tijdelijk **previewbericht** bij tijdens het genereren.

Er is vandaag **geen echte token-delta-streaming** naar kanaalberichten. Previewstreaming is berichtgebaseerd (verzenden + bewerkingen/toevoegingen).

## Blokstreaming (kanaalberichten)

Blokstreaming verzendt assistant-uitvoer in grove stukken zodra die beschikbaar komt.

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
- `chunker`: `EmbeddedBlockChunker` die min/max-grenzen + breukvoorkeur toepast.
- `channel send`: daadwerkelijke uitgaande berichten (blokantwoorden).

**Bediening:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (standaard uit).
- Kanaaloverschrijvingen: `*.blockStreaming` (en varianten per account) om `"on"`/`"off"` per kanaal af te dwingen.
- `agents.defaults.blockStreamingBreak`: `"text_end"` of `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (gestreamde blokken samenvoegen vóór verzending).
- Harde kanaallimiet: `*.textChunkLimit` (bijv. `channels.whatsapp.textChunkLimit`).
- Kanaalchunkmodus: `*.chunkMode` (`length` standaard, `newline` splitst op lege regels (alineagrenzen) vóór chunking op lengte).
- Zachte Discord-limiet: `channels.discord.maxLinesPerMessage` (standaard 17) splitst hoge antwoorden om UI-afkapping te voorkomen.

**Grenssemantiek:**

- `text_end`: stream blokken zodra de chunker ze verzendt; flush bij elke `text_end`.
- `message_end`: wacht tot het assistant-bericht klaar is en flush dan de gebufferde uitvoer.

`message_end` gebruikt nog steeds de chunker als de gebufferde tekst `maxChars` overschrijdt, dus dit kan aan het einde meerdere chunks verzenden.

### Medialevering met blokstreaming

`MEDIA:`-directieven zijn normale leveringsmetadata. Wanneer blokstreaming vroeg een
mediablok verzendt, onthoudt OpenClaw die levering voor de beurt. Als de uiteindelijke
assistant-payload dezelfde media-URL herhaalt, verwijdert de uiteindelijke levering de
dubbele media in plaats van de bijlage opnieuw te verzenden.

Exact dubbele uiteindelijke payloads worden onderdrukt. Als de uiteindelijke payload
afzonderlijke tekst toevoegt rond media die al is gestreamd, verzendt OpenClaw nog steeds de
nieuwe tekst terwijl de media slechts één keer wordt geleverd. Dit voorkomt dubbele spraaknotities
of bestanden op kanalen zoals Telegram wanneer een agent `MEDIA:` uitzendt tijdens
streaming en de provider dit ook opneemt in het voltooide antwoord.

## Chunkingalgoritme (lage/hoge grenzen)

Blokchunking wordt geïmplementeerd door `EmbeddedBlockChunker`:

- **Ondergrens:** niet verzenden totdat buffer >= `minChars` (tenzij geforceerd).
- **Bovengrens:** geef de voorkeur aan splitsingen vóór `maxChars`; indien geforceerd, splits op `maxChars`.
- **Breukvoorkeur:** `paragraph` → `newline` → `sentence` → `whitespace` → harde breuk.
- **Code fences:** nooit splitsen binnen fences; wanneer geforceerd op `maxChars`, sluit + heropen de fence om Markdown geldig te houden.

`maxChars` wordt begrensd op de kanaal-`textChunkLimit`, zodat je de limieten per kanaal niet kunt overschrijden.

## Samenvoegen (gestreamde blokken samenvoegen)

Wanneer blokstreaming is ingeschakeld, kan OpenClaw **opeenvolgende blokchunks samenvoegen**
voordat ze worden verzonden. Dit vermindert "spam van losse regels" terwijl er nog steeds
progressieve uitvoer wordt geboden.

- Samenvoegen wacht op **inactieve tussenpozen** (`idleMs`) vóór het flushen.
- Buffers worden begrensd door `maxChars` en flushen als ze die overschrijden.
- `minChars` voorkomt dat kleine fragmenten worden verzonden totdat genoeg tekst is verzameld
  (de laatste flush verzendt altijd de resterende tekst).
- Joiner wordt afgeleid van `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → spatie).
- Kanaaloverschrijvingen zijn beschikbaar via `*.blockStreamingCoalesce` (inclusief configuraties per account).
- Standaard wordt `minChars` voor samenvoegen verhoogd naar 1500 voor Signal/Slack/Discord tenzij overschreven.

## Menselijk tempo tussen blokken

Wanneer blokstreaming is ingeschakeld, kun je een **willekeurige pauze** toevoegen tussen
blokantwoorden (na het eerste blok). Dit laat reacties met meerdere berichtbubbels
natuurlijker aanvoelen.

- Configuratie: `agents.defaults.humanDelay` (per agent overschrijven via `agents.list[].humanDelay`).
- Modi: `off` (standaard), `natural` (800–2500ms), `custom` (`minMs`/`maxMs`).
- Geldt alleen voor **blokantwoorden**, niet voor uiteindelijke antwoorden of toolsamenvattingen.

## "Chunks streamen of alles"

Dit komt overeen met:

- **Chunks streamen:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (verzenden terwijl je gaat). Niet-Telegram-kanalen hebben ook `*.blockStreaming: true` nodig.
- **Alles aan het einde streamen:** `blockStreamingBreak: "message_end"` (eenmaal flushen, mogelijk meerdere chunks als het erg lang is).
- **Geen blokstreaming:** `blockStreamingDefault: "off"` (alleen uiteindelijke antwoord).

**Kanaalopmerking:** Blokstreaming staat **uit tenzij**
`*.blockStreaming` expliciet is ingesteld op `true`. Kanalen kunnen een live preview streamen
(`channels.<channel>.streaming`) zonder blokantwoorden.

Herinnering configuratielocatie: de `blockStreaming*`-standaarden staan onder
`agents.defaults`, niet in de rootconfiguratie.

## Previewstreamingmodi

Canonieke sleutel: `channels.<channel>.streaming`

Modi:

- `off`: previewstreaming uitschakelen.
- `partial`: één preview die wordt vervangen door de nieuwste tekst.
- `block`: preview-updates in gechunkte/toegevoegde stappen.
- `progress`: voortgangs-/statuspreview tijdens generatie, definitief antwoord bij voltooiing.

### Kanaaltoewijzing

| Kanaal     | `off` | `partial` | `block` | `progress`              |
| ---------- | ----- | --------- | ------- | ----------------------- |
| Telegram   | ✅    | ✅        | ✅      | wijst toe aan `partial` |
| Discord    | ✅    | ✅        | ✅      | wijst toe aan `partial` |
| Slack      | ✅    | ✅        | ✅      | ✅                      |
| Mattermost | ✅    | ✅        | ✅      | ✅                      |

Alleen Slack:

- `channels.slack.streaming.nativeTransport` schakelt Slack-native streaming-API-aanroepen in of uit wanneer `channels.slack.streaming.mode="partial"` (standaard: `true`).
- Slack-native streaming en Slack-assistant-threadstatus vereisen een antwoordthreaddoel. DMs op het hoogste niveau tonen die threadachtige preview niet, maar kunnen nog steeds Slack-conceptpreviewposts en bewerkingen gebruiken.

Migratie van verouderde sleutel:

- Telegram: verouderde `streamMode` en scalaire/booleaanse `streaming`-waarden worden gedetecteerd en gemigreerd door doctor-/configcompatibiliteitspaden naar `streaming.mode`.
- Discord: `streamMode` + booleaanse `streaming` migreert automatisch naar de `streaming`-enum.
- Slack: `streamMode` migreert automatisch naar `streaming.mode`; booleaanse `streaming` migreert automatisch naar `streaming.mode` plus `streaming.nativeTransport`; verouderde `nativeStreaming` migreert automatisch naar `streaming.nativeTransport`.

### Runtimegedrag

Telegram:

- Gebruikt `sendMessage` + `editMessageText`-preview-updates in DMs en groepen/topics.
- Verzendt een nieuw definitief bericht in plaats van ter plekke te bewerken wanneer een preview ongeveer één minuut zichtbaar is geweest, en ruimt daarna de preview op zodat de tijdstempel van Telegram de voltooiing van het antwoord weerspiegelt.
- Previewstreaming wordt overgeslagen wanneer Telegram-blokstreaming expliciet is ingeschakeld (om dubbele streaming te voorkomen).
- `/reasoning stream` kan redenering naar de preview schrijven.

Discord:

- Gebruikt verzenden + bewerken van previewberichten.
- `block`-modus gebruikt conceptchunking (`draftChunk`).
- Previewstreaming wordt overgeslagen wanneer Discord-blokstreaming expliciet is ingeschakeld.
- Uiteindelijke media-, fout- en expliciet-antwoord-payloads annuleren wachtende previews zonder een nieuw concept te flushen en gebruiken daarna normale levering.

Slack:

- `partial` kan Slack-native streaming gebruiken (`chat.startStream`/`append`/`stop`) wanneer beschikbaar.
- `block` gebruikt append-achtige conceptpreviews.
- `progress` gebruikt statuspreviewtekst, daarna het definitieve antwoord.
- DMs op het hoogste niveau zonder antwoordthread gebruiken conceptpreviewposts en bewerkingen in plaats van Slack-native streaming.
- Native en conceptpreviewstreaming onderdrukken blokantwoorden voor die beurt, zodat een Slack-antwoord slechts via één leveringspad wordt gestreamd.
- Uiteindelijke media-/foutpayloads en voortgangsfinals maken geen tijdelijke conceptberichten; alleen tekst-/blokfinals die de preview kunnen bewerken flushen wachtende concepttekst.

Mattermost:

- Streamt denken, toolactiviteit en gedeeltelijke antwoordtekst naar één conceptpreviewpost die ter plekke wordt afgerond wanneer het definitieve antwoord veilig kan worden verzonden.
- Valt terug op het verzenden van een nieuwe definitieve post als de previewpost is verwijderd of anderszins niet beschikbaar is tijdens afronding.
- Uiteindelijke media-/foutpayloads annuleren wachtende preview-updates vóór normale levering in plaats van een tijdelijke previewpost te flushen.

Matrix:

- Conceptpreviews worden ter plekke afgerond wanneer de definitieve tekst de previewgebeurtenis kan hergebruiken.
- Finals met alleen media, fouten en niet-overeenkomende antwoorddoelen annuleren wachtende preview-updates vóór normale levering; een al zichtbare verouderde preview wordt geredigeerd.

### Toolvoortgang-preview-updates

Previewstreaming kan ook **toolvoortgangs**updates bevatten — korte statusregels zoals "op internet zoeken", "bestand lezen" of "tool aanroepen" — die in hetzelfde previewbericht verschijnen terwijl tools actief zijn, vóór het definitieve antwoord. Dit houdt toolbeurten met meerdere stappen visueel levend in plaats van stil tussen de eerste denkpreview en het definitieve antwoord.

Ondersteunde oppervlakken:

- **Discord**, **Slack**, **Telegram** en **Matrix** streamen standaard toolvoortgang naar de live previewbewerking wanneer previewstreaming actief is.
- Telegram wordt sinds `v2026.4.22` geleverd met ingeschakelde toolvoortgang-preview-updates; ze ingeschakeld houden behoudt dat uitgebrachte gedrag.
- **Mattermost** neemt toolactiviteit al op in zijn enkele conceptpreviewpost (zie hierboven).
- Toolvoortgangsbewerkingen volgen de actieve previewstreamingmodus; ze worden overgeslagen wanneer previewstreaming `off` is of wanneer blokstreaming het bericht heeft overgenomen. Op Telegram is `streaming.mode: "off"` alleen definitief: generiek voortgangsgebabbel wordt ook onderdrukt in plaats van als zelfstandige "Working..."-berichten te worden geleverd, terwijl goedkeuringsprompts, mediapayloads en fouten normaal blijven routeren.
- Om previewstreaming te behouden maar toolvoortgangsregels te verbergen, stel je `streaming.preview.toolProgress` voor dat kanaal in op `false`. Om previewbewerkingen volledig uit te schakelen, stel je `streaming.mode` in op `off`.

Voorbeeld:

```json
{
  "channels": {
    "telegram": {
      "streaming": {
        "mode": "partial",
        "preview": {
          "toolProgress": false
        }
      }
    }
  }
}
```

## Gerelateerd

- [Berichten](/nl/concepts/messages) — berichtlevenscyclus en levering
- [Opnieuw proberen](/nl/concepts/retry) — opnieuw-proberen-gedrag bij leveringsfout
- [Kanalen](/nl/channels) — streamingondersteuning per kanaal
