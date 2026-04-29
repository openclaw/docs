---
read_when:
    - Uitleg over hoe streamen of opdelen in blokken werkt in kanalen
    - Gedrag voor blokstreaming of kanaalchunking wijzigen
    - Foutopsporing van dubbele/te vroege blokreacties of streaming van kanaalvoorbeelden
summary: Streaming + segmentatiegedrag (blokantwoorden, streaming van kanaalvoorbeelden, modustoewijzing)
title: Streamen en opdelen in blokken
x-i18n:
    generated_at: "2026-04-29T22:41:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: d428355e1a0dbd426c4807add2b15fcfb09776849681bfeb2293173a2d31ee4f
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw heeft twee afzonderlijke streaminglagen:

- **Blockstreaming (kanalen):** verzend voltooide **blokken** terwijl de assistant schrijft. Dit zijn normale kanaalberichten (geen token-delta's).
- **Preview-streaming (Telegram/Discord/Slack):** werk een tijdelijk **previewbericht** bij tijdens het genereren.

Er is vandaag **geen echte token-delta-streaming** naar kanaalberichten. Preview-streaming is berichtgebaseerd (verzenden + bewerkingen/toevoegingen).

## Blockstreaming (kanaalberichten)

Blockstreaming verzendt assistant-uitvoer in grove delen zodra deze beschikbaar komt.

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

- `text_delta/events`: modelstream-events (kunnen schaars zijn voor niet-streamende modellen).
- `chunker`: `EmbeddedBlockChunker` past min/max-grenzen + breukvoorkeur toe.
- `channel send`: daadwerkelijke uitgaande berichten (blokantwoorden).

**Instellingen:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (standaard uit).
- Kanaaloverrides: `*.blockStreaming` (en varianten per account) om `"on"`/`"off"` per kanaal af te dwingen.
- `agents.defaults.blockStreamingBreak`: `"text_end"` of `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (voeg gestreamde blokken samen voor verzending).
- Harde kanaallimiet: `*.textChunkLimit` (bijv. `channels.whatsapp.textChunkLimit`).
- Kanaalchunkmodus: `*.chunkMode` (`length` standaard, `newline` splitst op lege regels (alineagrenzen) vóór chunking op lengte).
- Zachte Discord-limiet: `channels.discord.maxLinesPerMessage` (standaard 17) splitst hoge antwoorden om UI-afkapping te vermijden.

**Grenssemantiek:**

- `text_end`: stream blokken zodra de chunker ze uitgeeft; flush bij elke `text_end`.
- `message_end`: wacht tot het assistant-bericht klaar is en flush daarna de gebufferde uitvoer.

`message_end` gebruikt nog steeds de chunker als de gebufferde tekst `maxChars` overschrijdt, dus het kan aan het einde meerdere chunks uitgeven.

### Media-aflevering met blockstreaming

`MEDIA:`-directieven zijn normale aflevermetadata. Wanneer blockstreaming vroeg een
mediablok verzendt, onthoudt OpenClaw die aflevering voor de beurt. Als de finale
assistant-payload dezelfde media-URL herhaalt, verwijdert de finale aflevering de
dubbele media in plaats van de bijlage opnieuw te verzenden.

Exact dubbele finale payloads worden onderdrukt. Als de finale payload aparte
tekst toevoegt rond media die al gestreamd was, verzendt OpenClaw nog steeds de
nieuwe tekst terwijl de media slechts één keer wordt afgeleverd. Dit voorkomt dubbele spraaknotities
of bestanden op kanalen zoals Telegram wanneer een agent `MEDIA:` uitgeeft tijdens
streaming en de provider dit ook opneemt in het voltooide antwoord.

## Chunkingalgoritme (lage/hoge grenzen)

Blockchunking wordt geïmplementeerd door `EmbeddedBlockChunker`:

- **Lage grens:** geef niets uit totdat buffer >= `minChars` (tenzij geforceerd).
- **Hoge grens:** geef de voorkeur aan splitsingen vóór `maxChars`; indien geforceerd, splitst op `maxChars`.
- **Breukvoorkeur:** `paragraph` → `newline` → `sentence` → `whitespace` → harde breuk.
- **Code fences:** splits nooit binnen fences; wanneer geforceerd op `maxChars`, sluit + heropen de fence om Markdown geldig te houden.

`maxChars` wordt begrensd tot de kanaal-`textChunkLimit`, dus je kunt de limieten per kanaal niet overschrijden.

## Samenvoegen (gestreamde blokken samenvoegen)

Wanneer blockstreaming is ingeschakeld, kan OpenClaw **opeenvolgende blokchunks samenvoegen**
voordat ze worden verzonden. Dit vermindert "spam van losse regels" terwijl er nog steeds
progressieve uitvoer wordt geboden.

- Samenvoegen wacht op **inactieve pauzes** (`idleMs`) voordat er wordt geflusht.
- Buffers worden begrensd door `maxChars` en worden geflusht als ze die overschrijden.
- `minChars` voorkomt dat zeer kleine fragmenten worden verzonden totdat er genoeg tekst is verzameld
  (de finale flush verzendt altijd resterende tekst).
- De samenvoeger wordt afgeleid van `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → spatie).
- Kanaaloverrides zijn beschikbaar via `*.blockStreamingCoalesce` (inclusief configuraties per account).
- De standaardwaarde voor coalesce-`minChars` wordt verhoogd naar 1500 voor Signal/Slack/Discord tenzij overschreven.

## Menselijk aanvoelende timing tussen blokken

Wanneer blockstreaming is ingeschakeld, kun je een **gerandomiseerde pauze** toevoegen tussen
blokantwoorden (na het eerste blok). Hierdoor voelen reacties met meerdere bubbels
natuurlijker aan.

- Configuratie: `agents.defaults.humanDelay` (overschrijf per agent via `agents.list[].humanDelay`).
- Modi: `off` (standaard), `natural` (800–2500 ms), `custom` (`minMs`/`maxMs`).
- Geldt alleen voor **blokantwoorden**, niet voor finale antwoorden of tool-samenvattingen.

## "Chunks streamen of alles"

Dit komt overeen met:

- **Chunks streamen:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (uitgeven terwijl je gaat). Niet-Telegram-kanalen hebben ook `*.blockStreaming: true` nodig.
- **Alles aan het einde streamen:** `blockStreamingBreak: "message_end"` (één keer flushen, mogelijk meerdere chunks als het erg lang is).
- **Geen blockstreaming:** `blockStreamingDefault: "off"` (alleen finaal antwoord).

**Kanaalopmerking:** Blockstreaming staat **uit tenzij**
`*.blockStreaming` expliciet is ingesteld op `true`. Kanalen kunnen een live preview streamen
(`channels.<channel>.streaming`) zonder blokantwoorden.

Configuratielocatie: de `blockStreaming*`-standaardwaarden staan onder
`agents.defaults`, niet in de rootconfiguratie.

## Preview-streamingmodi

Canonieke sleutel: `channels.<channel>.streaming`

Modi:

- `off`: schakel preview-streaming uit.
- `partial`: één preview die wordt vervangen door de nieuwste tekst.
- `block`: preview-updates in gechunkte/toegevoegde stappen.
- `progress`: voortgangs-/statuspreview tijdens generatie, finaal antwoord bij voltooiing.

### Kanaaltoewijzing

| Kanaal     | `off` | `partial` | `block` | `progress`              |
| ---------- | ----- | --------- | ------- | ----------------------- |
| Telegram   | ✅    | ✅        | ✅      | wordt `partial`         |
| Discord    | ✅    | ✅        | ✅      | wordt `partial`         |
| Slack      | ✅    | ✅        | ✅      | ✅                      |
| Mattermost | ✅    | ✅        | ✅      | ✅                      |

Alleen Slack:

- `channels.slack.streaming.nativeTransport` schakelt native Slack-streaming-API-aanroepen in of uit wanneer `channels.slack.streaming.mode="partial"` (standaard: `true`).
- Native Slack-streaming en Slack-assistant-threadstatus vereisen een antwoordthreaddoel; DM's op het hoogste niveau tonen die threadachtige preview niet.

Migratie van verouderde sleutel:

- Telegram: verouderde `streamMode` en scalaire/booleaanse `streaming`-waarden worden gedetecteerd en gemigreerd door doctor-/configcompatibiliteitspaden naar `streaming.mode`.
- Discord: `streamMode` + booleaanse `streaming` migreren automatisch naar de `streaming`-enum.
- Slack: `streamMode` migreert automatisch naar `streaming.mode`; booleaanse `streaming` migreert automatisch naar `streaming.mode` plus `streaming.nativeTransport`; verouderde `nativeStreaming` migreert automatisch naar `streaming.nativeTransport`.

### Runtimegedrag

Telegram:

- Gebruikt `sendMessage` + `editMessageText`-preview-updates in DM's en groepen/topics.
- Verzendt een nieuw finaal bericht in plaats van ter plekke te bewerken wanneer een preview ongeveer één minuut zichtbaar is geweest, en ruimt daarna de preview op zodat Telegrams tijdstempel de voltooiing van het antwoord weerspiegelt.
- Preview-streaming wordt overgeslagen wanneer Telegram-blockstreaming expliciet is ingeschakeld (om dubbel streamen te voorkomen).
- `/reasoning stream` kan redenering naar de preview schrijven.

Discord:

- Gebruikt verzend- + bewerkpreviewberichten.
- `block`-modus gebruikt conceptchunking (`draftChunk`).
- Preview-streaming wordt overgeslagen wanneer Discord-blockstreaming expliciet is ingeschakeld.
- Finale media-, fout- en expliciete-antwoordpayloads annuleren wachtende previews zonder een nieuw concept te flushen, en gebruiken daarna normale aflevering.

Slack:

- `partial` kan native Slack-streaming gebruiken (`chat.startStream`/`append`/`stop`) wanneer beschikbaar.
- `block` gebruikt conceptpreviews in append-stijl.
- `progress` gebruikt statuspreviewtekst, daarna het finale antwoord.
- Native en conceptpreview-streaming onderdrukken blokantwoorden voor die beurt, zodat een Slack-antwoord slechts via één afleverpad wordt gestreamd.
- Finale media-/foutpayloads en voortgangsfinales maken geen wegwerpconceptberichten; alleen tekst-/blokfinales die de preview kunnen bewerken flushen wachtende concepttekst.

Mattermost:

- Streamt denken, toolactiviteit en gedeeltelijke antwoordtekst naar één conceptpreviewpost die ter plekke wordt afgerond wanneer het finale antwoord veilig kan worden verzonden.
- Valt terug op het verzenden van een nieuwe finale post als de previewpost is verwijderd of anderszins niet beschikbaar is op het moment van afronden.
- Finale media-/foutpayloads annuleren wachtende preview-updates vóór normale aflevering in plaats van een tijdelijke previewpost te flushen.

Matrix:

- Conceptpreviews worden ter plekke afgerond wanneer de finale tekst het preview-event kan hergebruiken.
- Media-only, fouten en finales met een niet-overeenkomend antwoorddoel annuleren wachtende preview-updates vóór normale aflevering; een al zichtbare verouderde preview wordt geredigeerd.

### Toolvoortgang-preview-updates

Preview-streaming kan ook **toolvoortgang**-updates bevatten — korte statusregels zoals "zoeken op het web", "bestand lezen" of "tool aanroepen" — die in hetzelfde previewbericht verschijnen terwijl tools draaien, vóór het finale antwoord. Dit houdt toolbeurten met meerdere stappen visueel actief in plaats van stil tussen de eerste denkpreview en het finale antwoord.

Ondersteunde oppervlakken:

- **Discord**, **Slack**, **Telegram** en **Matrix** streamen standaard toolvoortgang naar de live previewbewerking wanneer preview-streaming actief is.
- Telegram wordt geleverd met toolvoortgang-preview-updates ingeschakeld sinds `v2026.4.22`; ze ingeschakeld laten behoudt dat uitgebrachte gedrag.
- **Mattermost** vouwt toolactiviteit al in zijn enkele conceptpreviewpost (zie hierboven).
- Toolvoortgangsbewerkingen volgen de actieve preview-streamingmodus; ze worden overgeslagen wanneer preview-streaming `off` is of wanneer blockstreaming het bericht heeft overgenomen. Op Telegram is `streaming.mode: "off"` alleen-finaal: generieke voortgangspraat wordt ook onderdrukt in plaats van als losse "Bezig..."-berichten te worden afgeleverd, terwijl goedkeuringsprompts, mediapayloads en fouten nog steeds normaal worden gerouteerd.
- Om preview-streaming te behouden maar toolvoortgangsregels te verbergen, stel je `streaming.preview.toolProgress` in op `false` voor dat kanaal. Om previewbewerkingen volledig uit te schakelen, stel je `streaming.mode` in op `off`.

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

- [Berichten](/nl/concepts/messages) — berichtlevenscyclus en aflevering
- [Opnieuw proberen](/nl/concepts/retry) — gedrag bij opnieuw proberen na afleverfout
- [Kanalen](/nl/channels) — streamingondersteuning per kanaal
