---
read_when:
    - Uitleg over hoe streaming of chunking op kanalen werkt
    - Gedrag voor blokgewijze streaming of kanaalsegmentering wijzigen
    - Debuggen van dubbele/vroege blokantwoorden of kanaalpreview-streaming
summary: Streaming- en chunkinggedrag (blokantwoorden, kanaalpreviewstreaming, modustoewijzing)
title: Streamen en opdelen in fragmenten
x-i18n:
    generated_at: "2026-05-04T07:04:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: ff7b6cd8127255352fe16fb746469e9828e7d5aea183d3799ab10cc768515bd1
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw heeft twee afzonderlijke streaminglagen:

- **Blockstreaming (kanalen):** voltooide **blokken** uitsturen terwijl de assistant schrijft. Dit zijn normale kanaalberichten (geen token-delta's).
- **Previewstreaming (Telegram/Discord/Slack):** een tijdelijk **previewbericht** bijwerken tijdens het genereren.

Er is tegenwoordig **geen echte token-delta-streaming** naar kanaalberichten. Previewstreaming is berichtgebaseerd (verzenden + bewerkingen/toevoegingen).

## Blockstreaming (kanaalberichten)

Blockstreaming verstuurt assistant-uitvoer in grove stukken zodra die beschikbaar komt.

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
- `chunker`: `EmbeddedBlockChunker` die min/max-grenzen + voorkeur voor onderbreking toepast.
- `channel send`: daadwerkelijke uitgaande berichten (blokantwoorden).

**Besturing:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (standaard uit).
- Kanaaloverschrijvingen: `*.blockStreaming` (en varianten per account) om `"on"`/`"off"` per kanaal af te dwingen.
- `agents.defaults.blockStreamingBreak`: `"text_end"` of `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (gestreamde blokken samenvoegen voor verzending).
- Harde kanaallimiet: `*.textChunkLimit` (bijv. `channels.whatsapp.textChunkLimit`).
- Kanaalchunkmodus: `*.chunkMode` (`length` standaard, `newline` splitst op lege regels (alineagrenzen) vóór chunking op lengte).
- Zachte Discord-limiet: `channels.discord.maxLinesPerMessage` (standaard 17) splitst hoge antwoorden om UI-afkapping te voorkomen.

**Grenssemantiek:**

- `text_end`: blokken streamen zodra de chunker ze uitstoot; flush bij elke `text_end`.
- `message_end`: wachten tot het assistant-bericht klaar is en dan gebufferde uitvoer flushen.

`message_end` gebruikt nog steeds de chunker als de gebufferde tekst langer is dan `maxChars`, zodat er aan het einde meerdere chunks kunnen worden uitgestoten.

### Medialevering met blockstreaming

`MEDIA:`-directieven zijn normale leveringsmetadata. Wanneer blockstreaming vroeg een
mediablok verzendt, onthoudt OpenClaw die levering voor de beurt. Als de finale
assistant-payload dezelfde media-URL herhaalt, verwijdert de finale levering de
dubbele media in plaats van de bijlage opnieuw te verzenden.

Exact dubbele finale payloads worden onderdrukt. Als de finale payload
aparte tekst toevoegt rond media die al is gestreamd, verzendt OpenClaw nog steeds de
nieuwe tekst terwijl de media slechts eenmaal wordt geleverd. Dit voorkomt dubbele spraaknotities
of bestanden op kanalen zoals Telegram wanneer een agent `MEDIA:` uitzendt tijdens
streaming en de provider dit ook opneemt in het voltooide antwoord.

## Chunkingalgoritme (lage/hoge grenzen)

Blockchunking wordt geïmplementeerd door `EmbeddedBlockChunker`:

- **Lage grens:** niet uitstoten totdat buffer >= `minChars` (tenzij geforceerd).
- **Hoge grens:** voorkeur voor splitsingen vóór `maxChars`; indien geforceerd, splitsen op `maxChars`.
- **Voorkeur voor onderbreking:** `paragraph` → `newline` → `sentence` → `whitespace` → harde onderbreking.
- **Code fences:** nooit splitsen binnen fences; wanneer geforceerd op `maxChars`, de fence sluiten + heropenen om Markdown geldig te houden.

`maxChars` wordt begrensd op de kanaal-`textChunkLimit`, dus je kunt de limieten per kanaal niet overschrijden.

## Samenvoegen (gestreamde blokken samenvoegen)

Wanneer blockstreaming is ingeschakeld, kan OpenClaw **opeenvolgende blokchunks samenvoegen**
voordat ze worden verzonden. Dit vermindert “single-line spam” terwijl er nog steeds
progressieve uitvoer wordt geleverd.

- Samenvoegen wacht op **inactieve tussenpozen** (`idleMs`) voordat wordt geflusht.
- Buffers worden begrensd door `maxChars` en worden geflusht als ze die overschrijden.
- `minChars` voorkomt dat kleine fragmenten worden verzonden totdat genoeg tekst is verzameld
  (de finale flush verzendt altijd resterende tekst).
- De joiner wordt afgeleid van `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → spatie).
- Kanaaloverschrijvingen zijn beschikbaar via `*.blockStreamingCoalesce` (inclusief configuraties per account).
- Standaard coalesce-`minChars` wordt verhoogd naar 1500 voor Signal/Slack/Discord tenzij overschreven.

## Menselijk tempo tussen blokken

Wanneer blockstreaming is ingeschakeld, kun je een **willekeurige pauze** tussen
blokantwoorden toevoegen (na het eerste blok). Hierdoor voelen antwoorden met meerdere tekstballonnen
natuurlijker aan.

- Configuratie: `agents.defaults.humanDelay` (per agent overschrijven via `agents.list[].humanDelay`).
- Modi: `off` (standaard), `natural` (800–2500 ms), `custom` (`minMs`/`maxMs`).
- Geldt alleen voor **blokantwoorden**, niet voor finale antwoorden of toolsamenvattingen.

## "Chunks streamen of alles"

Dit komt overeen met:

- **Chunks streamen:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (uitstoten terwijl je bezig bent). Niet-Telegram-kanalen hebben ook `*.blockStreaming: true` nodig.
- **Alles aan het einde streamen:** `blockStreamingBreak: "message_end"` (één keer flushen, mogelijk meerdere chunks als het erg lang is).
- **Geen blockstreaming:** `blockStreamingDefault: "off"` (alleen finale antwoord).

**Kanaalnotitie:** Blockstreaming staat **uit tenzij**
`*.blockStreaming` expliciet op `true` is gezet. Kanalen kunnen een live preview streamen
(`channels.<channel>.streaming`) zonder blokantwoorden.

Configuratielocatie ter herinnering: de `blockStreaming*`-standaardwaarden staan onder
`agents.defaults`, niet in de rootconfiguratie.

## Previewstreamingmodi

Canonieke sleutel: `channels.<channel>.streaming`

Modi:

- `off`: previewstreaming uitschakelen.
- `partial`: één preview die wordt vervangen door de nieuwste tekst.
- `block`: preview wordt bijgewerkt in gechunkte/toegevoegde stappen.
- `progress`: voortgangs-/statuspreview tijdens generatie, finaal antwoord bij voltooiing.

`streaming.mode: "block"` is een previewstreamingmodus voor kanalen die bewerken ondersteunen,
zoals Discord en Telegram. Deze schakelt daar geen kanaalbloklevering in.
Gebruik `streaming.block.enabled` of de legacy kanaalsleutel `blockStreaming` wanneer
je normale blokantwoorden wilt. Microsoft Teams is de uitzondering: het heeft geen
bloktransport voor conceptpreviews, dus `streaming.mode: "block"` komt overeen met Teams-bloklevering
in plaats van native partial/progress-streaming.

### Kanaaltoewijzing

| Kanaal     | `off` | `partial` | `block` | `progress`                    |
| ---------- | ----- | --------- | ------- | ----------------------------- |
| Telegram   | ✅    | ✅        | ✅      | bewerkbaar voortgangsconcept  |
| Discord    | ✅    | ✅        | ✅      | bewerkbaar voortgangsconcept  |
| Slack      | ✅    | ✅        | ✅      | ✅                            |
| Mattermost | ✅    | ✅        | ✅      | ✅                            |
| MS Teams   | ✅    | ✅        | ✅      | native voortgangsstream       |

Alleen Slack:

- `channels.slack.streaming.nativeTransport` schakelt Slack-native streaming-API-aanroepen in of uit wanneer `channels.slack.streaming.mode="partial"` (standaard: `true`).
- Slack-native streaming en Slack assistant-threadstatus vereisen een antwoordthreaddoel. DMs op topniveau tonen die threadachtige preview niet, maar kunnen nog steeds Slack-conceptpreviewberichten en bewerkingen gebruiken.

Migratie van legacy sleutel:

- Telegram: legacy `streamMode` en scalaire/booleaanse `streaming`-waarden worden gedetecteerd en gemigreerd via doctor-/configcompatibiliteitspaden naar `streaming.mode`.
- Discord: `streamMode` + booleaanse `streaming` migreren automatisch naar de `streaming`-enum.
- Slack: `streamMode` migreert automatisch naar `streaming.mode`; booleaanse `streaming` migreert automatisch naar `streaming.mode` plus `streaming.nativeTransport`; legacy `nativeStreaming` migreert automatisch naar `streaming.nativeTransport`.

### Runtimegedrag

Telegram:

- Gebruikt `sendMessage` + `editMessageText` voor preview-updates in DMs en groepen/topics.
- Verzendt een nieuw finaal bericht in plaats van ter plekke te bewerken wanneer een preview ongeveer één minuut zichtbaar is geweest, en ruimt daarna de preview op zodat de timestamp van Telegram de voltooiing van het antwoord weergeeft.
- Previewstreaming wordt overgeslagen wanneer Telegram-blockstreaming expliciet is ingeschakeld (om dubbele streaming te voorkomen).
- `/reasoning stream` kan redenering naar een tijdelijke preview schrijven die na finale levering wordt verwijderd.

Discord:

- Gebruikt verzenden + bewerken van previewberichten.
- `block`-modus gebruikt conceptchunking (`draftChunk`).
- Previewstreaming wordt overgeslagen wanneer Discord-blockstreaming expliciet is ingeschakeld.
- Finale media-, fout- en expliciete antwoordpayloads annuleren wachtende previews zonder een nieuw concept te flushen en gebruiken daarna normale levering.

Slack:

- `partial` kan Slack-native streaming (`chat.startStream`/`append`/`stop`) gebruiken wanneer beschikbaar.
- `block` gebruikt conceptpreviews in append-stijl.
- `progress` gebruikt statuspreviewtekst en daarna het finale antwoord.
- DMs op topniveau zonder antwoordthread gebruiken conceptpreviewberichten en bewerkingen in plaats van Slack-native streaming.
- Native en conceptpreviewstreaming onderdrukken blokantwoorden voor die beurt, zodat een Slack-antwoord via slechts één leveringspad wordt gestreamd.
- Finale media-/foutpayloads en voortgangsfinales maken geen tijdelijke conceptberichten aan; alleen tekst-/blokfinales die de preview kunnen bewerken flushen wachtende concepttekst.

Mattermost:

- Streamt denken, toolactiviteit en gedeeltelijke antwoordtekst naar één conceptpreviewbericht dat ter plekke wordt gefinaliseerd wanneer het finale antwoord veilig kan worden verzonden.
- Valt terug op het verzenden van een nieuw finaal bericht als het previewbericht is verwijderd of anderszins niet beschikbaar is op het moment van finaliseren.
- Finale media-/foutpayloads annuleren wachtende preview-updates vóór normale levering in plaats van een tijdelijk previewbericht te flushen.

Matrix:

- Conceptpreviews worden ter plekke gefinaliseerd wanneer de finale tekst de previewgebeurtenis kan hergebruiken.
- Finales met alleen media, fouten en niet-overeenkomende antwoorddoelen annuleren wachtende preview-updates vóór normale levering; een al zichtbare verouderde preview wordt geredacteerd.

### Toolvoortgangs-preview-updates

Previewstreaming kan ook **toolvoortgangs**-updates bevatten — korte statusregels zoals "zoeken op het web", "bestand lezen" of "tool aanroepen" — die in hetzelfde previewbericht verschijnen terwijl tools draaien, vóór het finale antwoord. Zo blijven toolbeurten met meerdere stappen visueel actief in plaats van stil tussen de eerste denkpreview en het finale antwoord.

Ondersteunde oppervlakken:

- **Discord**, **Slack**, **Telegram** en **Matrix** streamen standaard toolvoortgang naar de live previewbewerking wanneer previewstreaming actief is. Microsoft Teams gebruikt zijn native voortgangsstream in persoonlijke chats.
- Telegram is sinds `v2026.4.22` uitgebracht met toolvoortgangs-preview-updates ingeschakeld; ze ingeschakeld houden bewaart dat uitgebrachte gedrag.
- **Mattermost** vouwt toolactiviteit al in zijn enkele conceptpreviewbericht (zie hierboven).
- Toolvoortgangsbewerkingen volgen de actieve previewstreamingmodus; ze worden overgeslagen wanneer previewstreaming `off` is of wanneer blockstreaming het bericht heeft overgenomen. Op Telegram is `streaming.mode: "off"` alleen-finaal: generieke voortgangspraat wordt ook onderdrukt in plaats van als zelfstandige statusberichten te worden geleverd, terwijl goedkeuringsprompts, mediapayloads en fouten normaal blijven routeren.
- Om previewstreaming te behouden maar toolvoortgangsregels te verbergen, zet je `streaming.preview.toolProgress` voor dat kanaal op `false`. Om toolvoortgangsregels zichtbaar te houden terwijl command/exec-tekst wordt verborgen, zet je `streaming.preview.commandText` op `"status"` of `streaming.progress.commandText` op `"status"`; de standaard is `"raw"` om uitgebracht gedrag te behouden. Dit beleid wordt gedeeld door concept-/voortgangskanalen die de compacte voortgangsrenderer van OpenClaw gebruiken, waaronder Discord, Matrix, Microsoft Teams, Mattermost, Slack-conceptpreviews en Telegram. Zet `streaming.mode` op `off` om previewbewerkingen volledig uit te schakelen.
- Geselecteerde quote-antwoorden in Telegram zijn een uitzondering: wanneer `replyToMode` niet `"off"` is en geselecteerde quotetekst aanwezig is, slaat OpenClaw de antwoord-previewstream voor die beurt over zodat toolvoortgangs-previewregels niet kunnen renderen. Huidige-berichtantwoorden zonder geselecteerde quotetekst behouden previewstreaming. Zie [Telegram-kanaaldocumentatie](/nl/channels/telegram) voor details.

Houd voortgangsregels zichtbaar, maar verberg ruwe command/exec-tekst:

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

Gebruik dezelfde vorm onder een andere compacte voortgangskanaalsleutel, bijvoorbeeld `channels.discord`, `channels.matrix`, `channels.msteams`, `channels.mattermost`, of Slack-conceptvoorbeelden. Zet voor de voortgangsconceptmodus hetzelfde beleid onder `streaming.progress`:

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

- [Voortgangsconcepten](/nl/concepts/progress-drafts) — zichtbare werk-in-uitvoering-berichten die tijdens lange beurten worden bijgewerkt
- [Berichten](/nl/concepts/messages) — levenscyclus en bezorging van berichten
- [Opnieuw proberen](/nl/concepts/retry) — gedrag voor opnieuw proberen bij mislukte bezorging
- [Kanalen](/nl/channels) — streamingondersteuning per kanaal
