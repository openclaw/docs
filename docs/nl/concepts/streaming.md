---
read_when:
    - Uitleg over hoe streaming of chunking werkt op kanalen
    - Blokstreaming of kanaalchunking-gedrag wijzigen
    - Dubbele/vroege blokantwoorden of streaming van kanaalvoorvertoningen debuggen
summary: Streaming- en chunkinggedrag (blokantwoorden, streaming van kanaalvoorbeelden, modustoewijzing)
title: Streamen en opdelen
x-i18n:
    generated_at: "2026-06-27T17:30:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6667e95a1ed89e6bd8990a1b8784edb73885c59c7a3905eabc14184270efcfe1
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw heeft twee afzonderlijke streaminglagen:

- **Blokstreaming (kanalen):** stuurt voltooide **blokken** terwijl de assistent schrijft. Dit zijn normale kanaalberichten (geen tokendelta's).
- **Previewstreaming (Telegram/Discord/Slack):** werkt een tijdelijk **previewbericht** bij tijdens het genereren.

Er is vandaag **geen echte tokendelta-streaming** naar kanaalberichten. Previewstreaming is berichtgebaseerd (verzenden + bewerkingen/toevoegingen).

## Blokstreaming (kanaalberichten)

Blokstreaming stuurt assistentuitvoer in grove stukken zodra die beschikbaar komt.

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

**Instellingen:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (standaard uit).
- Kanaaloverschrijvingen: `*.blockStreaming` (en varianten per account) om per kanaal `"on"`/`"off"` af te dwingen.
- `agents.defaults.blockStreamingBreak`: `"text_end"` of `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (gestreamde blokken samenvoegen vóór verzending).
- Harde kanaallimiet: `*.textChunkLimit` (bijv. `channels.whatsapp.textChunkLimit`).
- Kanaalchunkmodus: `*.chunkMode` (standaard `length`, `newline` splitst op lege regels (alineagrenzen) vóór chunking op lengte).
- Zachte Discord-limiet: `channels.discord.maxLinesPerMessage` (standaard 17) splitst hoge antwoorden om afkapping in de UI te voorkomen.

**Grenssemantiek:**

- `text_end`: stream blokken zodra de chunker ze uitgeeft; flush bij elke `text_end`.
- `message_end`: wacht tot het assistentbericht klaar is en flush daarna de gebufferde uitvoer.

`message_end` gebruikt nog steeds de chunker als de gebufferde tekst `maxChars` overschrijdt, dus het kan aan het einde meerdere chunks uitsturen.

### Medialevering met blokstreaming

Gestreamde media moeten gestructureerde payloadvelden gebruiken, zoals `mediaUrl` of
`mediaUrls`; gestreamde tekst wordt niet geparseerd als een bijlagecommando. Wanneer blokstreaming
media vroeg verzendt, onthoudt OpenClaw die levering voor de beurt. Als
de uiteindelijke assistentpayload dezelfde media-URL herhaalt, verwijdert de uiteindelijke levering
de dubbele media in plaats van de bijlage opnieuw te verzenden.

Exact dubbele uiteindelijke payloads worden onderdrukt. Als de uiteindelijke payload
afwijkende tekst toevoegt rond media die al is gestreamd, verzendt OpenClaw nog steeds de
nieuwe tekst terwijl de media slechts één keer wordt geleverd. Dit voorkomt dubbele spraaknotities
of bestanden op kanalen zoals Telegram.

## Chunkingalgoritme (lage/hoge grenzen)

Blokchunking wordt geïmplementeerd door `EmbeddedBlockChunker`:

- **Lage grens:** niet uitsturen totdat buffer >= `minChars` (tenzij geforceerd).
- **Hoge grens:** geef de voorkeur aan splitsingen vóór `maxChars`; als het geforceerd is, splits op `maxChars`.
- **Breukvoorkeur:** `paragraph` → `newline` → `sentence` → `whitespace` → harde breuk.
- **Code fences:** splits nooit binnen fences; sluit + heropen de fence wanneer geforceerd op `maxChars` om Markdown geldig te houden.

`maxChars` wordt begrensd op de kanaalwaarde `textChunkLimit`, zodat je kanaallimieten niet kunt overschrijden.

## Samenvoegen (gestreamde blokken samenvoegen)

Wanneer blokstreaming is ingeschakeld, kan OpenClaw **opeenvolgende blokchunks samenvoegen**
voordat ze worden verzonden. Dit vermindert "spam met losse regels" terwijl er nog steeds
progressieve uitvoer wordt geleverd.

- Samenvoegen wacht op **inactieve intervallen** (`idleMs`) vóór het flushen.
- Buffers worden begrensd door `maxChars` en worden geflusht als ze die overschrijden.
- `minChars` voorkomt dat piepkleine fragmenten worden verzonden totdat er genoeg tekst is verzameld
  (de laatste flush verzendt altijd resterende tekst).
- De joiner wordt afgeleid van `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → spatie).
- Kanaaloverschrijvingen zijn beschikbaar via `*.blockStreamingCoalesce` (inclusief configuraties per account).
- De standaardwaarde voor samenvoegen `minChars` wordt verhoogd naar 1500 voor Signal/Slack/Discord tenzij overschreven.

## Menselijke timing tussen blokken

Wanneer blokstreaming is ingeschakeld, kun je een **gerandomiseerde pauze** toevoegen tussen
blokantwoorden (na het eerste blok). Hierdoor voelen reacties met meerdere berichtenballonnen
natuurlijker aan.

- Configuratie: `agents.defaults.humanDelay` (per agent te overschrijven via `agents.list[].humanDelay`).
- Modi: `off` (standaard), `natural` (800-2500ms), `custom` (`minMs`/`maxMs`).
- Geldt alleen voor **blokantwoorden**, niet voor uiteindelijke antwoorden of hulpmiddelsamenvattingen.

## "Chunks streamen of alles"

Dit komt overeen met:

- **Chunks streamen:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (uitsturen terwijl je bezig bent). Niet-Telegram-kanalen hebben ook `*.blockStreaming: true` nodig.
- **Alles aan het einde streamen:** `blockStreamingBreak: "message_end"` (één keer flushen, mogelijk meerdere chunks als het heel lang is).
- **Geen blokstreaming:** `blockStreamingDefault: "off"` (alleen uiteindelijke antwoord).

**Kanaalopmerking:** Blokstreaming staat **uit tenzij**
`*.blockStreaming` expliciet is ingesteld op `true`. Kanalen kunnen een live preview streamen
(`channels.<channel>.streaming`) zonder blokantwoorden.

Herinnering voor configuratielocatie: de standaardwaarden voor `blockStreaming*` staan onder
`agents.defaults`, niet in de rootconfiguratie.

## Previewstreamingmodi

Canonieke sleutel: `channels.<channel>.streaming`

Modi:

- `off`: previewstreaming uitschakelen.
- `partial`: één preview die wordt vervangen door de nieuwste tekst.
- `block`: preview wordt bijgewerkt in gechunkte/toegevoegde stappen.
- `progress`: voortgangs-/statuspreview tijdens generatie, uiteindelijke antwoord bij voltooiing.

`streaming.mode: "block"` is een previewstreamingmodus voor kanalen die bewerkingen ondersteunen,
zoals Discord en Telegram. Dit schakelt daar geen kanaalbloklevering in.
Gebruik `streaming.block.enabled` of de verouderde kanaalsleutel `blockStreaming` wanneer
je normale blokantwoorden wilt. Microsoft Teams is de uitzondering: het heeft geen
bloktransport voor conceptpreviews, dus `streaming.mode: "block"` wordt toegewezen aan Teams-bloklevering
in plaats van native gedeeltelijke/voortgangsstreaming.

### Kanaaltoewijzing

| Kanaal     | `off` | `partial` | `block` | `progress`                 |
| ---------- | ----- | --------- | ------- | -------------------------- |
| Telegram   | ✅    | ✅        | ✅      | bewerkbaar voortgangsconcept |
| Discord    | ✅    | ✅        | ✅      | bewerkbaar voortgangsconcept |
| Slack      | ✅    | ✅        | ✅      | ✅                         |
| Mattermost | ✅    | ✅        | ✅      | ✅                         |
| MS Teams   | ✅    | ✅        | ✅      | native voortgangsstream     |

Alleen Slack:

- `channels.slack.streaming.nativeTransport` schakelt Slack native streaming-API-aanroepen in of uit wanneer `channels.slack.streaming.mode="partial"` (standaard: `true`).
- Slack native streaming en Slack-assistentthreadstatus vereisen een antwoordthreaddoel. DM's op topniveau tonen die threadachtige preview niet, maar kunnen nog steeds Slack-conceptpreviewberichten en bewerkingen gebruiken.

Migratie van verouderde sleutels:

- Telegram: verouderde waarden voor `streamMode` en scalaire/booleaanse `streaming` worden gedetecteerd en gemigreerd door doctor-/configcompatibiliteitspaden naar `streaming.mode`.
- Discord: `streamMode` + booleaanse `streaming` blijven runtime-aliassen voor de `streaming`-enum; voer `openclaw doctor --fix` uit om opgeslagen configuratie te herschrijven.
- Slack: `streamMode` blijft een runtime-alias voor `streaming.mode`; booleaanse `streaming` blijft een runtime-alias voor `streaming.mode` plus `streaming.nativeTransport`; verouderde `nativeStreaming` blijft een runtime-alias voor `streaming.nativeTransport`. Voer `openclaw doctor --fix` uit om opgeslagen configuratie te herschrijven.

### Runtimegedrag

Telegram:

- Gebruikt `sendMessage` + `editMessageText` voor preview-updates in DM's en groepen/onderwerpen.
- Korte initiële previews worden nog steeds gedebounced voor de UX van pushmeldingen, maar Telegram materialiseert ze nu na een begrensde vertraging zodat actieve runs niet visueel stil blijven.
- Uiteindelijke tekst bewerkt de actieve preview ter plekke; lange uiteindelijke antwoorden hergebruiken dat bericht voor de eerste chunk en verzenden alleen de resterende chunks.
- De modus `block` roteert de preview naar een nieuw bericht bij `streaming.preview.chunk.maxChars` (standaard 800, begrensd op Telegram's bewerkingslimiet van 4096); andere modi laten één preview groeien tot 4096 tekens.
- De modus `progress` houdt hulpmiddelvoortgang in een bewerkbaar statusconcept, materialiseert het statuslabel wanneer antwoordstreaming actief is maar er nog geen hulpmiddelregel beschikbaar is, wist dat concept bij voltooiing en verzendt het uiteindelijke antwoord via normale levering.
- Als de uiteindelijke bewerking mislukt voordat de voltooide tekst is bevestigd, gebruikt OpenClaw normale uiteindelijke levering en ruimt het de verouderde preview op.
- Previewstreaming wordt overgeslagen wanneer Telegram-blokstreaming expliciet is ingeschakeld (om dubbel streamen te voorkomen).
- `/reasoning stream` kan redenering naar een tijdelijke preview schrijven die na uiteindelijke levering wordt verwijderd.

Discord:

- Gebruikt verzenden + bewerken van previewberichten.
- De modus `block` gebruikt conceptchunking (`draftChunk`).
- Previewstreaming wordt overgeslagen wanneer Discord-blokstreaming expliciet is ingeschakeld.
- Uiteindelijke media-, fout- en expliciete-antwoordpayloads annuleren wachtende previews zonder een nieuw concept te flushen en gebruiken daarna normale levering.

Slack:

- `partial` kan Slack native streaming (`chat.startStream`/`append`/`stop`) gebruiken wanneer beschikbaar.
- `block` gebruikt conceptpreviews in append-stijl.
- `progress` gebruikt statuspreviewtekst, daarna het uiteindelijke antwoord.
- DM's op topniveau zonder antwoordthread gebruiken conceptpreviewberichten en bewerkingen in plaats van Slack native streaming.
- Native en conceptpreviewstreaming onderdrukken blokantwoorden voor die beurt, zodat een Slack-antwoord via slechts één leveringspad wordt gestreamd.
- Uiteindelijke media-/foutpayloads en voortgangsfinals maken geen tijdelijke conceptberichten aan; alleen tekst-/blokfinals die de preview kunnen bewerken flushen wachtende concepttekst.

Mattermost:

- Streamt denken, hulpmiddelactiviteit en gedeeltelijke antwoordtekst naar één conceptpreviewbericht dat ter plekke wordt afgerond wanneer het uiteindelijke antwoord veilig kan worden verzonden.
- Valt terug op het verzenden van een nieuw definitief bericht als het previewbericht is verwijderd of anderszins niet beschikbaar is op het moment van afronden.
- Uiteindelijke media-/foutpayloads annuleren wachtende preview-updates vóór normale levering in plaats van een tijdelijk previewbericht te flushen.

Matrix:

- Conceptpreviews worden ter plekke afgerond wanneer de uiteindelijke tekst de previewgebeurtenis kan hergebruiken.
- Uiteindelijke antwoorden met alleen media, fouten en antwoorden met een niet-overeenkomend antwoorddoel annuleren wachtende preview-updates vóór normale levering; een al zichtbare verouderde preview wordt geredigeerd.

### Updates voor hulpmiddelvoortgang in previews

Previewstreaming kan ook **hulpmiddelvoortgangsupdates** bevatten: korte statusregels zoals "zoeken op het web", "bestand lezen" of "hulpmiddel aanroepen", die in hetzelfde previewbericht verschijnen terwijl hulpmiddelen draaien, vóór het uiteindelijke antwoord. In de Codex-appservermodus gebruiken Codex-preambule-/commentaarberichten hetzelfde previewpad, zodat korte voortgangsnotities zoals "Ik controleer..." naar het bewerkbare concept kunnen streamen zonder onderdeel te worden van het uiteindelijke antwoord. Dit houdt beurten met meerdere hulpmiddelstappen visueel levend in plaats van stil tussen de eerste denkpreview en het uiteindelijke antwoord.

Langlopende hulpmiddelen kunnen getypeerde voortgang uitsturen voordat ze terugkeren. Bijvoorbeeld,
`web_fetch` start een timer van vijf seconden wanneer het begint: als de fetch nog steeds
in behandeling is, kan de preview `Fetching page content...` tonen; als de fetch
voor die tijd klaar is of wordt geannuleerd, wordt er geen voortgangsregel uitgestuurd. Het latere uiteindelijke hulpmiddelresultaat
wordt nog steeds normaal aan het model geleverd.

Ondersteunde oppervlakken:

- **Discord**, **Slack**, **Telegram** en **Matrix** streamen standaard toolvoortgang en Codex-preambule-updates naar de live voorbeeldbewerking wanneer voorbeeldstreaming actief is. Microsoft Teams gebruikt zijn native voortgangsstream in persoonlijke chats.
- Telegram wordt sinds `v2026.4.22` geleverd met ingeschakelde voorbeeldupdates voor toolvoortgang; ze ingeschakeld houden behoudt dat uitgebrachte gedrag.
- **Mattermost** vouwt toolactiviteit al samen in zijn ene conceptvoorbeeldbericht (zie hierboven).
- Toolvoortgangsbewerkingen volgen de actieve voorbeeldstreamingmodus; ze worden overgeslagen wanneer voorbeeldstreaming `off` is of wanneer blokstreaming het bericht heeft overgenomen. Op Telegram is `streaming.mode: "off"` alleen definitief: generieke voortgangspraat wordt ook onderdrukt in plaats van als zelfstandige statusberichten te worden geleverd, terwijl goedkeuringsprompts, mediapayloads en fouten nog steeds normaal worden gerouteerd.
- Stel `streaming.preview.toolProgress` in op `false` voor dat kanaal om voorbeeldstreaming te behouden maar toolvoortgangsregels te verbergen. Stel `streaming.preview.commandText` in op `"status"` of `streaming.progress.commandText` op `"status"` om toolvoortgangsregels zichtbaar te houden terwijl command-/exec-tekst wordt verborgen; de standaardwaarde is `"raw"` om uitgebracht gedrag te behouden. Dit beleid wordt gedeeld door concept-/voortgangskanalen die OpenClaw's compacte voortgangsrenderer gebruiken, waaronder Discord, Matrix, Microsoft Teams, Mattermost, Slack-conceptvoorbeelden en Telegram. Stel `streaming.mode` in op `off` om voorbeeldbewerkingen volledig uit te schakelen.
- Telegram-antwoorden op geselecteerde citaten zijn een uitzondering: wanneer `replyToMode` niet `"off"` is en geselecteerde citaattekst aanwezig is, slaat OpenClaw de antwoordvoorbeeldstream voor die beurt over, zodat voorbeeldregels voor toolvoortgang niet kunnen renderen. Antwoorden op het huidige bericht zonder geselecteerde citaattekst behouden nog steeds voorbeeldstreaming. Zie [Telegram-kanaaldocumentatie](/nl/channels/telegram) voor details.

Houd voortgangsregels zichtbaar maar verberg onbewerkte command-/exec-tekst:

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

Gebruik dezelfde vorm onder een andere compacte voortgangskanaalsleutel, bijvoorbeeld `channels.discord`, `channels.matrix`, `channels.msteams`, `channels.mattermost` of Slack-conceptvoorbeelden. Plaats voor de voortgangsconceptmodus hetzelfde beleid onder `streaming.progress`:

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

- [Refactor van berichtlevenscyclus](/nl/concepts/message-lifecycle-refactor) - doelontwerp voor gedeelde voorbeelden, bewerkingen, streams en finalisatie
- [Voortgangsconcepten](/nl/concepts/progress-drafts) - zichtbare werk-in-uitvoering-berichten die tijdens lange beurten worden bijgewerkt
- [Berichten](/nl/concepts/messages) - berichtlevenscyclus en levering
- [Opnieuw proberen](/nl/concepts/retry) - gedrag voor opnieuw proberen bij leveringsfouten
- [Kanalen](/nl/channels) - streamingondersteuning per kanaal
