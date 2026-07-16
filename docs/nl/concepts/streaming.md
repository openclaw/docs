---
read_when:
    - Uitleg over hoe streaming of opdelen in chunks werkt op kanalen
    - Gedrag voor blokstreaming of kanaalchunking wijzigen
    - Dubbele/vroege blokantwoorden of streaming van kanaalvoorbeelden debuggen
summary: Gedrag voor streaming + opsplitsing (blokantwoorden, streaming van kanaalvoorbeelden, modustoewijzing)
title: Streaming en opdelen in stukken
x-i18n:
    generated_at: "2026-07-16T15:33:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b91d2143e59d9eb0271732adf8bc87482ef0d18fe664bfa46ed375c20fdc3d93
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw heeft twee onafhankelijke streaminglagen en er is momenteel **geen echte
streaming van tokendelta's** naar kanaalberichten:

- **Blokstreaming (kanalen):** verzendt voltooide **blokken** terwijl de assistent
  schrijft. Dit zijn normale kanaalberichten, geen tokendelta's.
- **Voorbeeldstreaming (Telegram/Discord/Slack/Matrix/Mattermost/MS Teams):**
  werkt tijdens het genereren een tijdelijk **voorbeeldbericht** bij (verzenden + bewerken/aanvullen).

## Blokstreaming (kanaalberichten)

Blokstreaming verzendt de uitvoer van de assistent in grove segmenten zodra deze beschikbaar komt.

```text
Modeluitvoer
  └─ text_delta/gebeurtenissen
       ├─ (blockStreamingBreak=text_end)
       │    └─ segmentverdeler verzendt blokken naarmate de buffer groeit
       └─ (blockStreamingBreak=message_end)
            └─ segmentverdeler leegt de buffer bij message_end
                   └─ verzending via kanaal (blokantwoorden)
```

- `text_delta/events`: modelstreamgebeurtenissen (kunnen schaars zijn bij modellen zonder streaming).
- `chunker`: `EmbeddedBlockChunker` waarbij minimum-/maximumgrenzen + voorkeur voor afbreekpunten worden toegepast.
- `channel send`: daadwerkelijk verzonden berichten (blokantwoorden).

**Instellingen** (allemaal onder `agents.defaults`, tenzij anders vermeld):

| Sleutel                                                       | Waarden / vorm                                                           | Standaard   |
| ------------------------------------------------------------ | ----------------------------------------------------------------------- | ---------- |
| `blockStreamingDefault`                                      | `"on"` / `"off"`                                                        | `"off"`    |
| `blockStreamingBreak`                                        | `"text_end"` / `"message_end"`                                          | -          |
| `blockStreamingChunk`                                        | `{ minChars, maxChars, breakPreference? }`                              | -          |
| `blockStreamingCoalesce`                                     | `{ minChars?, maxChars?, idleMs? }` (gestreamde blokken samenvoegen vóór verzending) | -          |
| `*.streaming.block.enabled` (overschrijving per kanaal)               | `true` / `false`, dwingt blokstreaming af per kanaal (en per account)  | -          |
| `*.textChunkLimit` (bijv. `channels.whatsapp.textChunkLimit`) | getal, harde limiet                                                       | 4000       |
| `*.streaming.chunkMode`                                      | `"length"` / `"newline"`                                                | `"length"` |
| `channels.discord.maxLinesPerMessage`                        | getal, zachte regellimiet die lange antwoorden splitst om afkapping in de UI te voorkomen     | 17         |

`streaming.chunkMode: "newline"` splitst op lege regels (alineagrenzen),
niet op elke nieuwe regel, voordat wordt teruggevallen op splitsing op lengte zodra de tekst
de limiet overschrijdt.

Gebundelde kanalen schrijven deze overschrijvingen als
`channels.<id>.streaming.{chunkMode,block.enabled,block.coalesce}`. De platte
schrijfwijzen `*.chunkMode` / `*.blockStreaming` / `*.blockStreamingCoalesce` zijn
verouderd voor elk gebundeld kanaal: `openclaw doctor --fix` migreert ze naar
de geneste vorm en kanaalschema's weigeren ze. Configuraties van externe SDK-plugins
die nog steeds de platte schrijfwijzen gebruiken, blijven werken via een verouderde
terugvaloptie (met een runtimewaarschuwing) tot de volgende releasereeks.

**Grenssemantiek** voor `blockStreamingBreak`:

- `text_end`: stream blokken zodra de segmentverdeler ze verzendt; leeg de buffer bij elke `text_end`.
- `message_end`: wacht totdat het assistentbericht is voltooid en leeg vervolgens de gebufferde
  uitvoer. Gebruikt nog steeds de segmentverdeler als de gebufferde tekst `maxChars` overschrijdt, zodat deze
  aan het einde meerdere segmenten kan verzenden.

### Medialevering met blokstreaming

Streamingmedia moeten gestructureerde payloadvelden gebruiken, zoals `mediaUrl` of
`mediaUrls`; gestreamde tekst wordt niet als bijlageopdracht geïnterpreteerd. Wanneer blokstreaming
media vroeg verzendt, onthoudt OpenClaw die levering voor deze beurt. Als
de uiteindelijke payload van de assistent dezelfde media-URL herhaalt, verwijdert de uiteindelijke levering
de dubbele media in plaats van de bijlage opnieuw te verzenden.

Exact identieke uiteindelijke payloads worden onderdrukt. Als de uiteindelijke payload
afzonderlijke tekst toevoegt rond media die al zijn gestreamd, verzendt OpenClaw
de nieuwe tekst alsnog, terwijl de media slechts eenmaal worden geleverd. Dit voorkomt dubbele
spraakberichten of bestanden op kanalen zoals Telegram.

## Segmenteringsalgoritme (onder-/bovengrenzen)

Bloksegmentering wordt geïmplementeerd door `EmbeddedBlockChunker`:

- **Ondergrens:** verzend niets totdat buffer >= `minChars` (tenzij afgedwongen).
- **Bovengrens:** geef de voorkeur aan splitsingen vóór `maxChars`; indien afgedwongen, splits bij `maxChars`.
- **Voorkeursvolgorde voor afbreekpunten:** `paragraph` -> `newline` -> `sentence` ->
  witruimte -> harde afbreking.
- **Codeblokken:** splits nooit binnen codeblokken; wanneer een splitsing bij `maxChars` wordt afgedwongen, sluit
  en heropen je het codeblok om geldige Markdown te behouden.

`maxChars` wordt begrensd tot de `textChunkLimit` van het kanaal, zodat je
de limieten per kanaal niet kunt overschrijden.

## Samenvoegen (gestreamde blokken combineren)

Wanneer blokstreaming is ingeschakeld, kan OpenClaw **opeenvolgende bloksegmenten
samenvoegen** voordat ze worden verzonden. Dit vermindert de hoeveelheid losse regels, terwijl
de uitvoer toch stapsgewijs beschikbaar komt.

- Het samenvoegen wacht vóór het legen van de buffer op **inactieve intervallen** (`idleMs`).
- Buffers worden begrensd door `maxChars` en geleegd als ze deze waarde overschrijden.
- `minChars` voorkomt dat kleine fragmenten worden verzonden totdat voldoende tekst is verzameld
  (bij de laatste lediging wordt alle resterende tekst altijd verzonden).
- Het scheidingsteken wordt afgeleid van `blockStreamingChunk.breakPreference`: `paragraph` ->
  `\n\n`, `newline` -> `\n`, `sentence` -> spatie.
- Overschrijvingen per kanaal zijn beschikbaar via `*.streaming.block.coalesce` (inclusief
  configuraties per account).
- Discord, Signal en Slack gebruiken standaard `{ minChars: 1500, idleMs: 1000 }` voor samenvoegen,
  tenzij dit wordt overschreven.

## Menselijke pauzes tussen blokken

Wanneer blokstreaming is ingeschakeld, wordt na het eerste blok een **willekeurige pauze**
tussen blokantwoorden toegevoegd, zodat antwoorden met meerdere tekstballonnen natuurlijker aanvoelen.

| `agents.defaults.humanDelay.mode` | Gedrag                  |
| --------------------------------- | ----------------------- |
| `off` (standaard)                   | Geen pauze              |
| `natural`                         | Willekeurige pauze van 800-2500ms |
| `custom`                          | `minMs`/`maxMs`         |

Overschrijf dit per agent via `agents.list[].humanDelay`. Geldt alleen voor **blokantwoorden**,
niet voor uiteindelijke antwoorden of toolsamenvattingen.

## "Segmenten of alles streamen"

- **Segmenten streamen:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"`
  (verzend ze zodra ze beschikbaar zijn). Andere kanalen dan Telegram vereisen ook
  `*.streaming.block.enabled: true`.
- **Alles aan het einde streamen:** `blockStreamingBreak: "message_end"` (leeg de buffer
  eenmaal, mogelijk in meerdere segmenten als de tekst erg lang is).
- **Geen blokstreaming:** `blockStreamingDefault: "off"` (alleen het uiteindelijke antwoord).

Blokstreaming is **uitgeschakeld tenzij** `*.streaming.block.enabled` expliciet
is ingesteld op `true` (uitzondering: QQ Bot heeft geen `streaming.block`-sleutels en streamt
blokantwoorden tenzij `channels.qqbot.streaming.mode` `"off"` is). Kanalen kunnen
een live voorbeeld streamen (`channels.<channel>.streaming.mode`) zonder
blokantwoorden. De standaardwaarden van `blockStreaming*` bevinden zich onder `agents.defaults`, niet in de
hoofdmap van de configuratie.

## Modi voor voorbeeldstreaming

Canonieke sleutel: `channels.<channel>.streaming` (geneste `{ mode, ... }`; verouderde
booleaanse/tekenreeksnotaties op het hoogste niveau worden herschreven door `openclaw doctor --fix`).

| Modus      | Gedrag                                                                |
| ---------- | --------------------------------------------------------------------- |
| `off`      | Voorbeeldstreaming uitschakelen                                      |
| `partial`  | Eén voorbeeld vervangen door de nieuwste tekst                         |
| `block`    | Voorbeeld stapsgewijs in segmenten bijwerken/aanvullen                  |
| `progress` | Voortgangs-/statusvoorbeeld tijdens het genereren, uiteindelijk antwoord na voltooiing |

`streaming.mode: "block"` is een modus voor voorbeeldstreaming voor kanalen
die bewerken ondersteunen, zoals Discord en Telegram; hiermee wordt bloklevering via het kanaal
niet automatisch ingeschakeld. Gebruik `streaming.block.enabled` voor normale blokantwoorden.
Microsoft Teams vormt de
uitzondering: het heeft geen bloktransport voor conceptvoorbeelden, dus `streaming.mode:
"block"` schakelt native streaming volledig uit en het antwoord wordt als normale
bloklevering verzonden in plaats van als native gedeeltelijke/voortgangsstreaming. Mattermost
werkt ook anders: in de modus `block` wisselt het voorbeeld tussen voltooide tekst en
blokken met toolactiviteit, zodat eerdere blokken als afzonderlijke berichten zichtbaar blijven
in plaats van in één bewerkbaar concept te worden overschreven.

### Kanaaltoewijzing

| Kanaal     | `off` | `partial` | `block` | `progress`              |
| ---------- | ----- | --------- | ------- | ----------------------- |
| Telegram   | Ja    | Ja        | Ja      | bewerkbaar voortgangsconcept |
| Discord    | Ja    | Ja        | Ja      | bewerkbaar voortgangsconcept |
| Slack      | Ja    | Ja        | Ja      | Ja                      |
| Mattermost | Ja    | Ja        | Ja      | Ja                      |
| MS Teams   | Ja    | Ja        | Ja      | native voortgangsstream |

De segmentconfiguratie voor voorbeelden (`streaming.preview.chunk.*`, bijvoorbeeld onder
`channels.discord.streaming` of `channels.telegram.streaming`) gebruikt standaard
`minChars: 200`, `maxChars: 800` (begrensd tot de `textChunkLimit` van het kanaal) en
`breakPreference: "paragraph"`.

Alleen voor Slack:

- `channels.slack.streaming.nativeTransport` schakelt aanroepen van de native streaming-API van Slack
  (`chat.startStream`/`chat.appendStream`/`chat.stopStream`) in of uit wanneer
  `channels.slack.streaming.mode="partial"` (standaard: `true`).
- Voor native streaming van Slack en de threadstatus van de Slack-assistent is een doelthread
  voor antwoorden vereist. DM's op het hoogste niveau tonen dat threadachtige voorbeeld niet, maar kunnen
  nog steeds Slack-berichten voor conceptvoorbeelden en bewerkingen gebruiken.

### Migratie van verouderde sleutels

| Kanaal   | Verouderde sleutels                                        | Status                                                                                                                                               |
| -------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram | `streamMode`, scalaire/booleaanse `streaming`                    | Herschreven naar `streaming.mode` door `openclaw doctor --fix`; niet gelezen tijdens runtime                                                                        |
| Discord  | `streamMode`, booleaanse `streaming`                           | Herschreven naar `streaming.mode` door `openclaw doctor --fix`; niet gelezen tijdens runtime                                                                        |
| Slack    | `streamMode`; booleaanse `streaming`; verouderde `nativeStreaming` | Herschreven naar `streaming.mode` (en `streaming.nativeTransport` voor de booleaanse/verouderde vormen) door `openclaw doctor --fix`; niet gelezen tijdens runtime         |
| Matrix   | scalaire/booleaanse `streaming`                                  | Herschreven naar `streaming.mode` (inclusief de modus `"quiet"` van Matrix) door `openclaw doctor --fix`; niet gelezen tijdens runtime                                    |
| Feishu   | booleaanse `streaming`                                         | Herschreven naar `streaming.mode` door `openclaw doctor --fix`; niet gelezen tijdens runtime                                                                        |
| QQ Bot   | booleaanse `streaming`; `streaming.c2cStreamApi`               | Herschreven naar `streaming.mode` (en `streaming.nativeTransport` voor de booleaanse/`c2cStreamApi`-vormen) door `openclaw doctor --fix`; niet gelezen tijdens runtime |

## Runtimegedrag

### Telegram

- Gebruikt `sendMessage` + `editMessageText` voor voorvertoningsupdates in privéberichten en
  groepen/onderwerpen; de definitieve tekst bewerkt de actieve voorvertoning ter plaatse. Tijdelijke
  Telegram-concepten van 30 seconden die aangeven dat er wordt getypt (`sendMessageDraft`), worden niet gebruikt voor
  het streamen van antwoorden.
- Korte eerste voorvertoningen worden nog steeds vertraagd voor een goede gebruikerservaring met pushmeldingen, maar
  verschijnen na een begrensde vertraging, zodat actieve uitvoeringen niet visueel stil blijven.
- Lange definitieve antwoorden hergebruiken het voorvertoningsbericht voor het eerste deel en verzenden alleen de
  resterende delen.
- De modus `block` zet de voorvertoning om in een nieuw bericht bij
  `streaming.preview.chunk.maxChars` (standaard 800, begrensd door Telegrams
  bewerkingslimiet van 4096); andere modi laten één voorvertoning groeien tot 4096 tekens.
- De modus `progress` houdt de voortgang van hulpmiddelen bij in een bewerkbaar statusconcept, maakt
  het statuslabel zichtbaar wanneer het streamen van antwoorden actief is maar er nog geen hulpmiddelregel
  beschikbaar is, wist het concept na voltooiing en verzendt het definitieve antwoord
  via de normale aflevering.
- Als de definitieve bewerking mislukt voordat de voltooide tekst is bevestigd, gebruikt OpenClaw
  de normale aflevering van het definitieve antwoord en ruimt het de verouderde voorvertoning op.
- Het streamen van voorvertoningen wordt overgeslagen wanneer Telegram-blokstreaming expliciet
  is ingeschakeld, om dubbel streamen te voorkomen.
- `/reasoning stream` kan de redenering schrijven naar een tijdelijke voorvertoning die
  na aflevering van het definitieve antwoord wordt verwijderd.
- Antwoorden met een geselecteerd citaat in Telegram vormen een uitzondering: wanneer `replyToMode` niet
  `"off"` is en er geselecteerde citaattekst aanwezig is, slaat OpenClaw de antwoordvoorvertoningsstream
  voor die beurt over (het definitieve antwoord moet via het systeemeigen pad voor citaatantwoorden
  worden verzonden), zodat voorvertoningsregels met hulpmiddelvoortgang niet kunnen worden weergegeven. Antwoorden op het huidige bericht
  zonder geselecteerde citaattekst blijven voorvertoningsstreaming gebruiken. Zie
  [Telegram-kanaaldocumentatie](/nl/channels/telegram) voor details.

### Discord

- Gebruikt verzonden en bewerkte voorvertoningsberichten.
- De modus `block` gebruikt conceptsegmentering (`draftChunk`).
- Het streamen van voorvertoningen wordt overgeslagen wanneer Discord-blokstreaming expliciet
  is ingeschakeld.
- De modus `progress` voegt een klein `-#`-activiteitenoverzicht (aantallen gedachten/hulpmiddelaanroepen
  en verstreken tijd) toe aan het definitieve antwoord en verwijdert het statusconcept
  zodra dat antwoord is afgeleverd, zodat drukke kanalen geen verweesd hulpmiddellogboek
  boven het antwoord behouden. Bij definitieve foutmeldingen blijft het concept bewaard als registratie van de mislukte
  beurt.
- Definitieve media-, fout- en expliciete antwoordpayloads annuleren openstaande voorvertoningen
  zonder een nieuw concept te publiceren en gebruiken vervolgens de normale aflevering.

### Slack

- `partial` kan waar beschikbaar systeemeigen Slack-streaming gebruiken (`chat.startStream`/`append`/`stop`).
- `block` gebruikt conceptvoorvertoningen waaraan tekst wordt toegevoegd.
- `progress` gebruikt een statusvoorvertoningstekst en daarna het definitieve antwoord.
- Privéberichten op het hoogste niveau zonder antwoordthread gebruiken conceptvoorvertoningsberichten en bewerkingen
  in plaats van systeemeigen Slack-streaming.
- Systeemeigen streaming en conceptvoorvertoningsstreaming onderdrukken blokantwoorden voor die beurt, zodat een
  Slack-antwoord slechts via één afleveringspad wordt gestreamd.
- Definitieve media-/foutpayloads en definitieve voortgangsberichten maken geen tijdelijke conceptberichten
  aan; alleen definitieve tekst-/blokberichten die de voorvertoning kunnen bewerken, publiceren openstaande
  concepttekst.

### Mattermost

- In de modus `partial` worden denkwerk en gedeeltelijke antwoordtekst gestreamd naar één
  conceptvoorvertoningsbericht dat ter plaatse wordt afgerond zodra het definitieve antwoord veilig kan worden verzonden.
- In de modus `progress` worden denkwerk en hulpmiddelactiviteit gestreamd naar één statusvoorvertoning
  die ter plaatse wordt afgerond zodra het definitieve antwoord veilig kan worden verzonden.
- In de modus `block` wordt afgewisseld tussen berichten met voltooide tekst en hulpmiddelactiviteit;
  parallelle en opeenvolgende hulpmiddelupdates delen het huidige hulpmiddelactiviteitsbericht.
- Valt terug op het verzenden van een nieuw definitief bericht als het voorvertoningsbericht is verwijderd of
  anderszins niet beschikbaar is wanneer het moet worden afgerond.
- Definitieve media-/foutpayloads annuleren openstaande voorvertoningsupdates vóór de normale
  aflevering in plaats van een tijdelijk voorvertoningsbericht te publiceren.

### Matrix

- Conceptvoorvertoningen worden ter plaatse afgerond wanneer de definitieve tekst de voorvertoningsgebeurtenis
  kan hergebruiken.
- Definitieve berichten met alleen media, fouten en niet-overeenkomende antwoorddoelen annuleren openstaande voorvertoningsupdates
  vóór de normale aflevering; een reeds zichtbare verouderde voorvertoning wordt geredigeerd.

## Updates van hulpmiddelvoortgang in de voorvertoning

Voorvertoningsstreaming kan ook updates voor **hulpmiddelvoortgang** bevatten: korte statusregels
zoals "het web doorzoeken", "bestand lezen" of "hulpmiddel aanroepen" die
in hetzelfde voorvertoningsbericht verschijnen terwijl hulpmiddelen worden uitgevoerd, vóór het definitieve antwoord.
In de Codex-appservermodus gebruiken Codex-inleidings-/commentaarberichten hetzelfde
voorvertoningspad, zodat korte voortgangsmeldingen zoals "Ik controleer..." naar het
bewerkbare concept kunnen worden gestreamd zonder onderdeel te worden van het definitieve antwoord. Hierdoor blijven
beurten met meerdere hulpmiddelstappen visueel actief in plaats van stil tussen de eerste
denkvoorvertoning en het definitieve antwoord.

Langdurig actieve hulpmiddelen kunnen getypeerde voortgang uitsturen voordat ze resultaat opleveren. Zo
stelt `web_fetch` bij het starten een timer van vijf seconden in: als het ophalen nog steeds
bezig is, toont de voorvertoning `Fetching page content...`; als het ophalen vóór die tijd is voltooid of
geannuleerd, wordt er geen voortgangsregel uitgestuurd. Het latere definitieve hulpmiddelresultaat
wordt nog steeds op de normale manier aan het model geleverd.

Ondersteunde oppervlakken:

- **Discord**, **Slack**, **Telegram** en **Matrix** streamen standaard hulpmiddelvoortgang en
  Codex-inleidingsupdates naar de live bewerking van de voorvertoning wanneer voorvertoningsstreaming
  actief is. Microsoft Teams gebruikt zijn systeemeigen voortgangsstream in
  persoonlijke chats.
- Telegram wordt sinds `v2026.4.22` geleverd met ingeschakelde voorvertoningsupdates voor hulpmiddelvoortgang;
  door deze ingeschakeld te houden blijft dat uitgebrachte gedrag behouden.
- **Mattermost** voegt hulpmiddelactiviteit samen in één voorvertoningsbericht in de modi `partial` en
  `progress`, of in één hulpmiddelactiviteitsbericht tussen tekstblokken in de modus `block`
  (zie hierboven).
- Bewerkingen voor hulpmiddelvoortgang volgen de actieve modus voor voorvertoningsstreaming; ze worden
  overgeslagen wanneer voorvertoningsstreaming `off` is of wanneer blokstreaming het
  bericht heeft overgenomen. In Telegram is `streaming.mode: "off"` alleen voor definitieve berichten: algemeen
  voortgangscommentaar wordt eveneens onderdrukt in plaats van als afzonderlijke statusberichten
  te worden afgeleverd, terwijl goedkeuringsprompts, mediapayloads en fouten nog steeds normaal
  worden gerouteerd.
- Om voorvertoningsstreaming te behouden maar regels met hulpmiddelvoortgang te verbergen, stel je
  `streaming.preview.toolProgress` voor dat kanaal in op `false` (standaard
  `true`). Om regels met hulpmiddelvoortgang zichtbaar te houden terwijl je opdracht-/uitvoertekst verbergt,
  stel je `streaming.preview.commandText` in op `"status"` of
  `streaming.progress.commandText` op `"status"`; de standaardwaarde is `"raw"` om
  uitgebracht gedrag te behouden. Dit beleid wordt gedeeld door concept-/voortgangskanalen
  die de compacte voortgangsrenderer van OpenClaw gebruiken, waaronder Discord, Matrix,
  Microsoft Teams, Mattermost, Slack-conceptvoorvertoningen en Telegram. Om
  voorvertoningsbewerkingen volledig uit te schakelen, stel je `streaming.mode` in op `off`.

## Weergave van voortgangsconcepten

Concepten in voortgangsmodus (`streaming.progress.*`) zijn per kanaal begrensd en
configureerbaar:

| Sleutel                           | Standaard     | Gedrag                                                         |
| --------------------------------- | ------------- | -------------------------------------------------------------- |
| `streaming.progress.maxLines`     | `8`           | Maximaal aantal compacte voortgangsregels dat onder het conceptlabel wordt behouden |
| `streaming.progress.maxLineChars` | `120`         | Maximaal aantal tekens per compacte regel vóór afkapping (woordbewust) |
| `streaming.progress.label`        | `"auto"`      | Concepttitel; een aangepaste tekenreeks, of `false` om deze te verbergen |
| `streaming.progress.labels`       | ingebouwde verzameling | Kandidaatlabels die worden gebruikt wanneer `label: "auto"` |

### Voortgangsstrook voor commentaar

Naast hulpmiddelvoortgang kan de compacte voortgangsrenderer nog een strook
in het concept weergeven:

- **`streaming.progress.commentary`** - geef het **commentaar** van het model vóór het hulpmiddel weer
  (een korte toelichting zoals "Ik controleer... en daarna..."), afgewisseld met
  hulpmiddelregels in het voortgangsconcept. In de voortgangsmodus van Discord en Telegram
  levert dezelfde inleiding de statuskop, zelfs wanneer deze optionele strook
  is uitgeschakeld; andere kanalen behouden hun bestaande voortgangsgedrag. Zie
  [Voortgangsconcepten](/nl/concepts/progress-drafts#status-headline).

```json
{
  "channels": {
    "discord": {
      "streaming": { "mode": "progress", "progress": { "commentary": true } }
    }
  }
}
```

Houd voortgangsregels zichtbaar, maar verberg onbewerkte opdracht-/uitvoertekst:

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

Gebruik dezelfde structuur onder een andere sleutel voor een compact voortgangskanaal, bijvoorbeeld
`channels.discord`, `channels.matrix`, `channels.msteams`,
`channels.mattermost` of Slack-conceptvoorvertoningen. Plaats voor de voortgangsconceptmodus
hetzelfde beleid onder `streaming.progress`:

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

- [Herstructurering van de berichtlevenscyclus](/nl/concepts/message-lifecycle-refactor) - beoogd gedeeld ontwerp voor voorvertoning, bewerking, streaming en afronding
- [Voortgangsconcepten](/nl/concepts/progress-drafts) - zichtbare berichten over lopend werk die tijdens lange beurten worden bijgewerkt
- [Berichten](/nl/concepts/messages) - berichtlevenscyclus en aflevering
- [Opnieuw proberen](/nl/concepts/retry) - gedrag bij opnieuw proberen na een afleveringsfout
- [Kanalen](/nl/channels) - ondersteuning voor streaming per kanaal
