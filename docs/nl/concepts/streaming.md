---
read_when:
    - Uitleg over hoe streaming of chunking in kanalen werkt
    - Gedrag voor blokstreaming of kanaalopdeling wijzigen
    - Fouten opsporen in dubbele/vroege blokantwoorden of streaming van kanaalvoorbeeldweergaven
summary: Streaming- en chunkinggedrag (blokantwoorden, kanaalvoorbeeldstreaming, modusmapping)
title: Streamen en segmenteren
x-i18n:
    generated_at: "2026-05-03T21:30:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1335f4f5532060bd8bf839683a2b1fbab38f38887c5583135652b4753e0f6a50
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw heeft twee afzonderlijke streaminglagen:

- **Blokstreaming (kanalen):** stuur voltooide **blokken** uit terwijl de assistent schrijft. Dit zijn normale kanaalberichten (geen tokendelta's).
- **Previewstreaming (Telegram/Discord/Slack):** werk een tijdelijk **previewbericht** bij tijdens het genereren.

Er is vandaag **geen echte tokendelta-streaming** naar kanaalberichten. Previewstreaming is berichtgebaseerd (verzenden + bewerkingen/toevoegingen).

## Blokstreaming (kanaalberichten)

Blokstreaming verzendt assistentuitvoer in grove stukken zodra die beschikbaar komt.

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

**Besturing:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (standaard uit).
- Kanaaloverrides: `*.blockStreaming` (en varianten per account) om `"on"`/`"off"` per kanaal af te dwingen.
- `agents.defaults.blockStreamingBreak`: `"text_end"` of `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (gestreamde blokken samenvoegen vóór verzending).
- Harde kanaallimiet: `*.textChunkLimit` (bijv. `channels.whatsapp.textChunkLimit`).
- Kanaalchunkmodus: `*.chunkMode` (`length` standaard, `newline` splitst op lege regels (alineagrenzen) vóór chunking op lengte).
- Zachte Discord-limiet: `channels.discord.maxLinesPerMessage` (standaard 17) splitst hoge antwoorden om UI-afkapping te voorkomen.

**Grenssemantiek:**

- `text_end`: stream blokken zodra de chunker ze uitgeeft; flush bij elke `text_end`.
- `message_end`: wacht tot het assistentbericht klaar is en flush dan de gebufferde uitvoer.

`message_end` gebruikt nog steeds de chunker als de gebufferde tekst groter is dan `maxChars`, waardoor het aan het einde meerdere chunks kan uitsturen.

### Medialevering met blokstreaming

`MEDIA:`-instructies zijn normale leveringsmetadata. Wanneer blokstreaming vroeg een
mediablok verzendt, onthoudt OpenClaw die levering voor de beurt. Als de definitieve
assistentpayload dezelfde media-URL herhaalt, verwijdert de definitieve levering de
dubbele media in plaats van de bijlage opnieuw te verzenden.

Exact dubbele definitieve payloads worden onderdrukt. Als de definitieve payload
aparte tekst toevoegt rond media die al zijn gestreamd, verzendt OpenClaw nog steeds
de nieuwe tekst terwijl de media slechts eenmaal worden geleverd. Dit voorkomt dubbele spraakmemo's
of bestanden op kanalen zoals Telegram wanneer een agent `MEDIA:` uitstoot tijdens
streaming en de provider dit ook in het voltooide antwoord opneemt.

## Chunking-algoritme (lage/hoge grenzen)

Blokchunking wordt geïmplementeerd door `EmbeddedBlockChunker`:

- **Lage grens:** geef niets uit totdat buffer >= `minChars` (tenzij geforceerd).
- **Hoge grens:** geef de voorkeur aan splitsingen vóór `maxChars`; indien geforceerd, splits op `maxChars`.
- **Breukvoorkeur:** `paragraph` → `newline` → `sentence` → `whitespace` → harde breuk.
- **Code fences:** splits nooit binnen fences; wanneer geforceerd op `maxChars`, sluit + heropen de fence om Markdown geldig te houden.

`maxChars` wordt beperkt tot de kanaal-`textChunkLimit`, dus je kunt de limieten per kanaal niet overschrijden.

## Samenvoegen (gestreamde blokken samenvoegen)

Wanneer blokstreaming is ingeschakeld, kan OpenClaw **opeenvolgende blokchunks samenvoegen**
voordat ze worden verzonden. Dit vermindert "spam van losse regels" terwijl nog steeds
progressieve uitvoer wordt geboden.

- Samenvoegen wacht op **inactieve pauzes** (`idleMs`) voordat er wordt geflusht.
- Buffers worden begrensd door `maxChars` en worden geflusht als ze die overschrijden.
- `minChars` voorkomt dat kleine fragmenten worden verzonden totdat genoeg tekst is verzameld
  (de definitieve flush verzendt altijd resterende tekst).
- De samenvoeger wordt afgeleid van `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → spatie).
- Kanaaloverrides zijn beschikbaar via `*.blockStreamingCoalesce` (inclusief configuraties per account).
- Standaard samenvoeg-`minChars` wordt verhoogd naar 1500 voor Signal/Slack/Discord, tenzij overschreven.

## Menselijk tempo tussen blokken

Wanneer blokstreaming is ingeschakeld, kun je een **willekeurige pauze** toevoegen tussen
blokantwoorden (na het eerste blok). Hierdoor voelen antwoorden met meerdere tekstballonnen
natuurlijker aan.

- Configuratie: `agents.defaults.humanDelay` (per agent overschrijven via `agents.list[].humanDelay`).
- Modi: `off` (standaard), `natural` (800–2500 ms), `custom` (`minMs`/`maxMs`).
- Geldt alleen voor **blokantwoorden**, niet voor definitieve antwoorden of tool-samenvattingen.

## "Stream chunks of alles"

Dit komt overeen met:

- **Stream chunks:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (uitsturen terwijl je gaat). Niet-Telegram-kanalen hebben ook `*.blockStreaming: true` nodig.
- **Stream alles aan het einde:** `blockStreamingBreak: "message_end"` (één keer flushen, mogelijk meerdere chunks als het erg lang is).
- **Geen blokstreaming:** `blockStreamingDefault: "off"` (alleen definitief antwoord).

**Kanaalopmerking:** Blokstreaming staat **uit tenzij**
`*.blockStreaming` expliciet op `true` is gezet. Kanalen kunnen een live preview streamen
(`channels.<channel>.streaming`) zonder blokantwoorden.

Configuratielocatie ter herinnering: de `blockStreaming*`-standaarden staan onder
`agents.defaults`, niet in de hoofdconfiguratie.

## Previewstreamingmodi

Canonieke sleutel: `channels.<channel>.streaming`

Modi:

- `off`: schakel previewstreaming uit.
- `partial`: één preview die wordt vervangen door de nieuwste tekst.
- `block`: preview wordt bijgewerkt in gechunkte/toegevoegde stappen.
- `progress`: voortgangs-/statuspreview tijdens generatie, definitief antwoord bij voltooiing.

`streaming.mode: "block"` is een previewstreamingmodus voor kanalen die bewerkingen ondersteunen,
zoals Discord en Telegram. Het schakelt daar geen kanaalbloklevering in.
Gebruik `streaming.block.enabled` of de verouderde kanaalsleutel `blockStreaming` wanneer
je normale blokantwoorden wilt. Microsoft Teams is de uitzondering: het heeft geen
draft-preview-bloktransport, dus `streaming.mode: "block"` wordt gekoppeld aan Teams-bloklevering
in plaats van native gedeeltelijke/voortgangsstreaming.

### Kanaaltoewijzing

| Kanaal     | `off` | `partial` | `block` | `progress`              |
| ---------- | ----- | --------- | ------- | ----------------------- |
| Telegram   | ✅    | ✅        | ✅      | bewerkbare voortgangsdraft |
| Discord    | ✅    | ✅        | ✅      | bewerkbare voortgangsdraft |
| Slack      | ✅    | ✅        | ✅      | ✅                      |
| Mattermost | ✅    | ✅        | ✅      | ✅                      |
| MS Teams   | ✅    | ✅        | ✅      | native voortgangsstream |

Alleen Slack:

- `channels.slack.streaming.nativeTransport` schakelt native Slack-streaming-API-aanroepen in of uit wanneer `channels.slack.streaming.mode="partial"` (standaard: `true`).
- Native Slack-streaming en Slack-assistentthreadstatus vereisen een antwoordthreaddoel. DM's op het hoogste niveau tonen die threadachtige preview niet, maar kunnen nog steeds Slack-draftpreviewberichten en bewerkingen gebruiken.

Migratie van verouderde sleutels:

- Telegram: verouderde `streamMode`- en scalaire/booleaanse `streaming`-waarden worden gedetecteerd en gemigreerd door doctor-/configcompatibiliteitspaden naar `streaming.mode`.
- Discord: `streamMode` + booleaanse `streaming` migreert automatisch naar de `streaming`-enum.
- Slack: `streamMode` migreert automatisch naar `streaming.mode`; booleaanse `streaming` migreert automatisch naar `streaming.mode` plus `streaming.nativeTransport`; verouderde `nativeStreaming` migreert automatisch naar `streaming.nativeTransport`.

### Runtimegedrag

Telegram:

- Gebruikt `sendMessage` + `editMessageText`-previewupdates in DM's en groepen/onderwerpen.
- Verzendt een nieuw definitief bericht in plaats van ter plekke te bewerken wanneer een preview ongeveer één minuut zichtbaar is geweest, en ruimt daarna de preview op zodat de tijdstempel van Telegram de voltooiing van het antwoord weerspiegelt.
- Previewstreaming wordt overgeslagen wanneer Telegram-blokstreaming expliciet is ingeschakeld (om dubbele streaming te voorkomen).
- `/reasoning stream` kan redenering naar de preview schrijven.

Discord:

- Gebruikt verzenden + bewerken van previewberichten.
- `block`-modus gebruikt draftchunking (`draftChunk`).
- Previewstreaming wordt overgeslagen wanneer Discord-blokstreaming expliciet is ingeschakeld.
- Definitieve media-, fout- en expliciet-antwoordpayloads annuleren wachtende previews zonder een nieuwe draft te flushen, en gebruiken daarna normale levering.

Slack:

- `partial` kan native Slack-streaming (`chat.startStream`/`append`/`stop`) gebruiken wanneer beschikbaar.
- `block` gebruikt append-stijl draftpreviews.
- `progress` gebruikt statuspreviewtekst en daarna het definitieve antwoord.
- DM's op het hoogste niveau zonder antwoordthread gebruiken draftpreviewberichten en bewerkingen in plaats van native Slack-streaming.
- Native en draftpreviewstreaming onderdrukken blokantwoorden voor die beurt, zodat een Slack-antwoord via slechts één leveringspad wordt gestreamd.
- Definitieve media-/foutpayloads en voortgangsfinales maken geen wegwerp-draftberichten aan; alleen tekst-/blokfinales die de preview kunnen bewerken, flushen wachtende drafttekst.

Mattermost:

- Streamt denken, toolactiviteit en gedeeltelijke antwoordtekst naar één draftpreviewbericht dat ter plekke wordt afgerond wanneer het definitieve antwoord veilig kan worden verzonden.
- Valt terug op het verzenden van een nieuw definitief bericht als het previewbericht is verwijderd of anderszins niet beschikbaar is op het moment van afronden.
- Definitieve media-/foutpayloads annuleren wachtende previewupdates vóór normale levering in plaats van een tijdelijk previewbericht te flushen.

Matrix:

- Draftpreviews worden ter plekke afgerond wanneer de definitieve tekst de previewgebeurtenis kan hergebruiken.
- Media-only-, fout- en antwoorddoel-mismatchfinales annuleren wachtende previewupdates vóór normale levering; een al zichtbare verouderde preview wordt geredigeerd.

### Previewupdates voor toolvoortgang

Previewstreaming kan ook **toolvoortgangs**updates bevatten — korte statusregels zoals "zoeken op het web", "bestand lezen" of "tool aanroepen" — die in hetzelfde previewbericht verschijnen terwijl tools actief zijn, vóór het definitieve antwoord. Dit houdt toolbeurten met meerdere stappen visueel actief in plaats van stil tussen de eerste denkpreview en het definitieve antwoord.

Ondersteunde oppervlakken:

- **Discord**, **Slack**, **Telegram** en **Matrix** streamen toolvoortgang standaard naar de live previewbewerking wanneer previewstreaming actief is. Microsoft Teams gebruikt zijn native voortgangsstream in persoonlijke chats.
- Telegram wordt sinds `v2026.4.22` geleverd met ingeschakelde previewupdates voor toolvoortgang; ze ingeschakeld houden behoudt dat uitgebrachte gedrag.
- **Mattermost** neemt toolactiviteit al op in zijn enkele draftpreviewbericht (zie hierboven).
- Toolvoortgangsbewerkingen volgen de actieve previewstreamingmodus; ze worden overgeslagen wanneer previewstreaming `off` is of wanneer blokstreaming het bericht heeft overgenomen. Op Telegram is `streaming.mode: "off"` alleen definitief: algemene voortgangspraat wordt ook onderdrukt in plaats van als zelfstandige statusberichten te worden geleverd, terwijl goedkeuringsprompts, mediapayloads en fouten nog steeds normaal worden gerouteerd.
- Om previewstreaming te behouden maar toolvoortgangsregels te verbergen, stel je `streaming.preview.toolProgress` in op `false` voor dat kanaal. Om previewbewerkingen volledig uit te schakelen, stel je `streaming.mode` in op `off`.
- Telegram-antwoorden met geselecteerde citaten zijn een uitzondering: wanneer `replyToMode` niet `"off"` is en geselecteerde citaattekst aanwezig is, slaat OpenClaw de antwoordpreviewstream voor die beurt over, zodat previewregels voor toolvoortgang niet kunnen renderen. Antwoorden op het huidige bericht zonder geselecteerde citaattekst behouden nog steeds previewstreaming. Zie [Telegram-kanaaldocumentatie](/nl/channels/telegram) voor details.

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

- [Voortgangsdrafts](/nl/concepts/progress-drafts) — zichtbare werk-in-uitvoering-berichten die tijdens lange beurten worden bijgewerkt
- [Berichten](/nl/concepts/messages) — berichtlevenscyclus en levering
- [Opnieuw proberen](/nl/concepts/retry) — gedrag bij opnieuw proberen na leveringsfout
- [Kanalen](/nl/channels) — streamingondersteuning per kanaal
