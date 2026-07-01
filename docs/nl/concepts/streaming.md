---
read_when:
    - Uitleg over hoe streaming of chunking werkt op kanalen
    - Streaming van blokken of kanaalchunkinggedrag wijzigen
    - Dubbele/vroege blokantwoorden of streaming van kanaalvoorvertoningen debuggen
summary: Streaming- en chunkinggedrag (blokantwoorden, kanaalvoorbeeldstreaming, modusmapping)
title: Streaming en chunking
x-i18n:
    generated_at: "2026-07-01T08:15:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2724c21414dd470780f0c7f634380bef3feeb54a08bd0da3e944173340df1c80
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw heeft twee afzonderlijke streaminglagen:

- **Blokstreaming (kanalen):** verstuur voltooide **blokken** terwijl de assistant schrijft. Dit zijn normale kanaalberichten (geen token-delta's).
- **Preview-streaming (Telegram/Discord/Slack):** werk een tijdelijk **previewbericht** bij tijdens het genereren.

Er is vandaag **geen echte token-delta-streaming** naar kanaalberichten. Preview-streaming is berichtgebaseerd (verzenden + bewerkingen/toevoegingen).

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

**Besturing:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (standaard uit).
- Kanaaloverrides: `*.blockStreaming` (en varianten per account) om `"on"`/`"off"` per kanaal af te dwingen.
- `agents.defaults.blockStreamingBreak`: `"text_end"` of `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (voeg gestreamde blokken samen vóór verzending).
- Harde kanaallimiet: `*.textChunkLimit` (bijv. `channels.whatsapp.textChunkLimit`).
- Kanaalchunkmodus: `*.chunkMode` (`length` standaard, `newline` splitst op lege regels (alinea-grenzen) vóór chunking op lengte).
- Zachte Discord-limiet: `channels.discord.maxLinesPerMessage` (standaard 17) splitst hoge antwoorden om UI-afkapping te voorkomen.

**Grenssemantiek:**

- `text_end`: stream blokken zodra de chunker ze uitgeeft; flush bij elke `text_end`.
- `message_end`: wacht tot het assistantbericht klaar is en flush dan de gebufferde uitvoer.

`message_end` gebruikt nog steeds de chunker als de gebufferde tekst `maxChars` overschrijdt, dus dit kan aan het einde meerdere chunks uitgeven.

### Medialevering met blokstreaming

Gestreamde media moeten gestructureerde payloadvelden gebruiken, zoals `mediaUrl` of
`mediaUrls`; gestreamde tekst wordt niet geparseerd als bijlageopdracht. Wanneer blokstreaming
media vroeg verzendt, onthoudt OpenClaw die levering voor de beurt. Als
de definitieve assistant-payload dezelfde media-URL herhaalt, verwijdert de definitieve levering
de dubbele media in plaats van de bijlage opnieuw te verzenden.

Exact dubbele definitieve payloads worden onderdrukt. Als de definitieve payload
afzonderlijke tekst toevoegt rond media die al gestreamd was, verzendt OpenClaw nog steeds de
nieuwe tekst terwijl de media slechts één keer wordt geleverd. Dit voorkomt dubbele spraaknotities
of bestanden op kanalen zoals Telegram.

## Chunking-algoritme (lage/hoge grenzen)

Blokchunking wordt geïmplementeerd door `EmbeddedBlockChunker`:

- **Lage grens:** geef niets uit totdat buffer >= `minChars` (tenzij geforceerd).
- **Hoge grens:** geef de voorkeur aan splitsingen vóór `maxChars`; indien geforceerd, splits op `maxChars`.
- **Breukvoorkeur:** `paragraph` → `newline` → `sentence` → `whitespace` → harde breuk.
- **Code fences:** splits nooit binnen fences; wanneer geforceerd op `maxChars`, sluit + heropen de fence om Markdown geldig te houden.

`maxChars` wordt begrensd door de kanaal-`textChunkLimit`, dus je kunt kanaallimieten niet overschrijden.

## Samenvoegen (gestreamde blokken samenvoegen)

Wanneer blokstreaming is ingeschakeld, kan OpenClaw **opeenvolgende blokchunks samenvoegen**
voordat ze worden verzonden. Dit vermindert "spam met losse regels" terwijl er nog steeds
progressieve uitvoer wordt geleverd.

- Samenvoegen wacht op **inactieve pauzes** (`idleMs`) voordat er wordt geflusht.
- Buffers worden begrensd door `maxChars` en worden geflusht als ze die overschrijden.
- `minChars` voorkomt dat kleine fragmenten worden verzonden totdat er genoeg tekst is verzameld
  (de definitieve flush verzendt altijd resterende tekst).
- De joiner wordt afgeleid van `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → spatie).
- Kanaaloverrides zijn beschikbaar via `*.blockStreamingCoalesce` (inclusief configuraties per account).
- De standaard coalesce-`minChars` wordt verhoogd naar 1500 voor Signal/Slack/Discord tenzij overschreven.

## Menselijk tempo tussen blokken

Wanneer blokstreaming is ingeschakeld, kun je een **willekeurige pauze** toevoegen tussen
blokantwoorden (na het eerste blok). Hierdoor voelen reacties met meerdere bubbels
natuurlijker aan.

- Configuratie: `agents.defaults.humanDelay` (per agent te overschrijven via `agents.list[].humanDelay`).
- Modi: `off` (standaard), `natural` (800-2500 ms), `custom` (`minMs`/`maxMs`).
- Geldt alleen voor **blokantwoorden**, niet voor definitieve antwoorden of toolsamenvattingen.

## "Chunks streamen of alles"

Dit komt overeen met:

- **Chunks streamen:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (uitgeven terwijl je gaat). Niet-Telegram-kanalen hebben ook `*.blockStreaming: true` nodig.
- **Alles aan het einde streamen:** `blockStreamingBreak: "message_end"` (één keer flushen, mogelijk meerdere chunks als het erg lang is).
- **Geen blokstreaming:** `blockStreamingDefault: "off"` (alleen definitief antwoord).

**Kanaalopmerking:** Blokstreaming staat **uit tenzij**
`*.blockStreaming` expliciet is ingesteld op `true`. Kanalen kunnen een live preview streamen
(`channels.<channel>.streaming`) zonder blokantwoorden.

Herinnering configuratielocatie: de standaardwaarden voor `blockStreaming*` staan onder
`agents.defaults`, niet in de rootconfiguratie.

## Preview-streamingmodi

Canonieke sleutel: `channels.<channel>.streaming`

Modi:

- `off`: preview-streaming uitschakelen.
- `partial`: één preview die wordt vervangen door de nieuwste tekst.
- `block`: preview-updates in gechunkte/toegevoegde stappen.
- `progress`: voortgangs-/statuspreview tijdens generatie, definitief antwoord bij voltooiing.

`streaming.mode: "block"` is een preview-streamingmodus voor kanalen die bewerkingen ondersteunen,
zoals Discord en Telegram. Dit schakelt daar geen kanaalbloklevering in.
Gebruik `streaming.block.enabled` of de legacy kanaalsleutel `blockStreaming` wanneer
je normale blokantwoorden wilt. Microsoft Teams is de uitzondering: het heeft geen
bloktransport voor conceptpreviews, dus `streaming.mode: "block"` wordt toegewezen aan Teams-bloklevering
in plaats van native partial/progress-streaming.

### Kanaaltoewijzing

| Kanaal     | `off` | `partial` | `block` | `progress`               |
| ---------- | ----- | --------- | ------- | ------------------------ |
| Telegram   | ✅    | ✅        | ✅      | bewerkbaar voortgangsconcept |
| Discord    | ✅    | ✅        | ✅      | bewerkbaar voortgangsconcept |
| Slack      | ✅    | ✅        | ✅      | ✅                       |
| Mattermost | ✅    | ✅        | ✅      | ✅                       |
| MS Teams   | ✅    | ✅        | ✅      | native voortgangsstream  |

Alleen Slack:

- `channels.slack.streaming.nativeTransport` schakelt native Slack-streaming-API-aanroepen in of uit wanneer `channels.slack.streaming.mode="partial"` (standaard: `true`).
- Native Slack-streaming en Slack-assistant-threadstatus vereisen een antwoordthreaddoel. DM's op het hoogste niveau tonen die thread-achtige preview niet, maar kunnen nog steeds Slack-conceptpreviewposts en bewerkingen gebruiken.

Migratie van legacy sleutels:

- Telegram: legacy `streamMode` en scalaire/booleaanse `streaming`-waarden worden gedetecteerd en gemigreerd door doctor-/configcompatibiliteitspaden naar `streaming.mode`.
- Discord: `streamMode` + booleaanse `streaming` blijven runtime-aliassen voor de `streaming`-enum; voer `openclaw doctor --fix` uit om persistente configuratie te herschrijven.
- Slack: `streamMode` blijft een runtime-alias voor `streaming.mode`; booleaanse `streaming` blijft een runtime-alias voor `streaming.mode` plus `streaming.nativeTransport`; legacy `nativeStreaming` blijft een runtime-alias voor `streaming.nativeTransport`. Voer `openclaw doctor --fix` uit om persistente configuratie te herschrijven.

### Runtimegedrag

Telegram:

- Gebruikt `sendMessage` + `editMessageText` preview-updates in DM's en groepen/topics.
- Korte initiële previews worden nog steeds gedebounced voor pushnotificatie-UX, maar Telegram materialiseert ze nu na een begrensde vertraging zodat actieve runs niet visueel stil blijven.
- Definitieve tekst bewerkt de actieve preview ter plekke; lange definitieve antwoorden hergebruiken dat bericht voor de eerste chunk en verzenden alleen de resterende chunks.
- `block`-modus roteert de preview naar een nieuw bericht bij `streaming.preview.chunk.maxChars` (standaard 800, begrensd op Telegrams bewerkingslimiet van 4096); andere modi laten één preview groeien tot 4096 tekens.
- `progress`-modus houdt toolvoortgang in een bewerkbaar statusconcept, materialiseert het statuslabel wanneer antwoordstreaming actief is maar er nog geen toolregel beschikbaar is, wist dat concept bij voltooiing en verzendt het definitieve antwoord via normale levering.
- Als de definitieve bewerking mislukt voordat de voltooide tekst is bevestigd, gebruikt OpenClaw normale definitieve levering en ruimt de verouderde preview op.
- Preview-streaming wordt overgeslagen wanneer Telegram-blokstreaming expliciet is ingeschakeld (om dubbel streamen te voorkomen).
- `/reasoning stream` kan redenering naar een tijdelijke preview schrijven die na definitieve levering wordt verwijderd.

Discord:

- Gebruikt verzenden + bewerken van previewberichten.
- `block`-modus gebruikt conceptchunking (`draftChunk`).
- Preview-streaming wordt overgeslagen wanneer Discord-blokstreaming expliciet is ingeschakeld.
- Definitieve media-, fout- en expliciete-antwoordpayloads annuleren wachtende previews zonder een nieuw concept te flushen en gebruiken daarna normale levering.

Slack:

- `partial` kan native Slack-streaming gebruiken (`chat.startStream`/`append`/`stop`) wanneer beschikbaar.
- `block` gebruikt conceptpreviews in append-stijl.
- `progress` gebruikt statuspreviewtekst en daarna het definitieve antwoord.
- DM's op het hoogste niveau zonder antwoordthread gebruiken conceptpreviewposts en bewerkingen in plaats van native Slack-streaming.
- Native en conceptpreview-streaming onderdrukken blokantwoorden voor die beurt, zodat een Slack-antwoord slechts via één leveringspad wordt gestreamd.
- Definitieve media-/foutpayloads en voortgangsfinals maken geen tijdelijke conceptberichten aan; alleen tekst-/blokfinals die de preview kunnen bewerken flushen wachtende concepttekst.

Mattermost:

- Streamt denken, toolactiviteit en gedeeltelijke antwoordtekst naar één conceptpreviewpost die ter plekke wordt afgerond wanneer het definitieve antwoord veilig kan worden verzonden.
- Valt terug op het verzenden van een nieuwe definitieve post als de previewpost is verwijderd of anderszins niet beschikbaar is op het moment van afronding.
- Definitieve media-/foutpayloads annuleren wachtende preview-updates vóór normale levering in plaats van een tijdelijke previewpost te flushen.

Matrix:

- Conceptpreviews worden ter plekke afgerond wanneer de definitieve tekst de previewgebeurtenis kan hergebruiken.
- Finals met alleen media, fouten en mismatch in antwoorddoel annuleren wachtende preview-updates vóór normale levering; een al zichtbare verouderde preview wordt geredigeerd.

### Toolvoortgang-previewupdates

Preview-streaming kan ook **toolvoortgangs**updates bevatten - korte statusregels zoals "zoeken op het web", "bestand lezen" of "tool aanroepen" - die in hetzelfde previewbericht verschijnen terwijl tools draaien, vóór het definitieve antwoord. In Codex app-server-modus gebruiken Codex preamble-/commentaryberichten hetzelfde previewpad, zodat korte voortgangsnotities zoals "Ik controleer..." naar het bewerkbare concept kunnen streamen zonder onderdeel te worden van het definitieve antwoord. Zo blijven toolbeurten met meerdere stappen visueel actief in plaats van stil tussen de eerste denkpreview en het definitieve antwoord.

Langlopende tools kunnen getypte voortgang uitgeven voordat ze terugkeren. Bijvoorbeeld,
`web_fetch` activeert een timer van vijf seconden wanneer het start: als de fetch nog
wacht, kan de preview `Fetching page content...` tonen; als de fetch vóór die tijd voltooit
of wordt geannuleerd, wordt er geen voortgangsregel uitgegeven. Het latere definitieve toolresultaat
wordt nog steeds normaal aan het model geleverd.

Ondersteunde oppervlakken:

- **Discord**, **Slack**, **Telegram** en **Matrix** streamen standaard toolvoortgang en Codex-preamble-updates naar de live-previewbewerking wanneer preview-streaming actief is. Microsoft Teams gebruikt zijn native voortgangsstream in persoonlijke chats.
- Telegram wordt sinds `v2026.4.22` geleverd met ingeschakelde preview-updates voor toolvoortgang; als ze ingeschakeld blijven, blijft dat uitgebrachte gedrag behouden.
- **Mattermost** vouwt toolactiviteit al samen in zijn enkele conceptpreviewbericht (zie hierboven).
- Toolvoortgangsbewerkingen volgen de actieve preview-streamingmodus; ze worden overgeslagen wanneer preview-streaming `off` is of wanneer blokstreaming het bericht heeft overgenomen. Op Telegram is `streaming.mode: "off"` alleen-eindantwoord: generiek voortgangsgeklets wordt ook onderdrukt in plaats van als zelfstandige statusberichten te worden geleverd, terwijl goedkeuringsprompts, mediapayloads en fouten normaal blijven routeren.
- Als je preview-streaming wilt behouden maar toolvoortgangsregels wilt verbergen, stel je `streaming.preview.toolProgress` voor dat kanaal in op `false`. Als je toolvoortgangsregels zichtbaar wilt houden terwijl je opdracht-/exec-tekst verbergt, stel je `streaming.preview.commandText` in op `"status"` of `streaming.progress.commandText` op `"status"`; de standaardwaarde is `"raw"` om uitgebracht gedrag te behouden. Dit beleid wordt gedeeld door concept-/voortgangskanalen die OpenClaw's compacte voortgangsrenderer gebruiken, waaronder Discord, Matrix, Microsoft Teams, Mattermost, Slack-conceptpreviews en Telegram. Als je previewbewerkingen volledig wilt uitschakelen, stel je `streaming.mode` in op `off`.
- Geselecteerde quote-antwoorden in Telegram zijn een uitzondering: wanneer `replyToMode` niet `"off"` is en geselecteerde quote-tekst aanwezig is, slaat OpenClaw de antwoordpreviewstream voor die beurt over, zodat previewregels voor toolvoortgang niet kunnen renderen. Antwoorden op het huidige bericht zonder geselecteerde quote-tekst behouden preview-streaming wel. Zie [Telegram-kanaaldocumentatie](/nl/channels/telegram) voor details.

### Commentaarvoortgangslane

Naast toolvoortgang kan de compacte voortgangsrenderer nog één lane in het concept tonen:

- **`streaming.progress.commentary`** — render de **commentary** van het model vóór tools (💬) — korte "Ik controleer… daarna…"-vertelling — verweven met toolregels in het voortgangsconcept.

```json
{
  "channels": {
    "discord": {
      "streaming": { "mode": "progress", "progress": { "commentary": true } }
    }
  }
}
```

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

Gebruik dezelfde vorm onder een andere compacte voortgangskanaalsleutel, bijvoorbeeld `channels.discord`, `channels.matrix`, `channels.msteams`, `channels.mattermost`, of Slack-conceptpreviews. Zet voor de voortgangsconceptmodus hetzelfde beleid onder `streaming.progress`:

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

- [Berichtlevenscyclusrefactor](/nl/concepts/message-lifecycle-refactor) - doelontwerp voor gedeelde preview, bewerking, stream en finalisatie
- [Voortgangsconcepten](/nl/concepts/progress-drafts) - zichtbare onderhanden-werkberichten die tijdens lange beurten worden bijgewerkt
- [Berichten](/nl/concepts/messages) - berichtlevenscyclus en levering
- [Opnieuw proberen](/nl/concepts/retry) - gedrag voor opnieuw proberen bij leveringsfout
- [Kanalen](/nl/channels) - streamingondersteuning per kanaal
