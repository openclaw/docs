---
read_when:
    - Mediapijplijn of bijlagen wijzigen
summary: Regels voor de verwerking van afbeeldingen en media bij verzenden, Gateway en agentantwoorden
title: Ondersteuning voor afbeeldingen en media
x-i18n:
    generated_at: "2026-07-12T09:01:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 41d5bbd174b4fb35b616a9e90930485fd76dc8cfbad2e178f0823e6fb40c36f8
    source_path: nodes/images.md
    workflow: 16
---

Het WhatsApp-kanaal draait op Baileys Web. Deze pagina behandelt de regels voor mediaverwerking bij verzenden, via de Gateway en bij antwoorden van de agent.

## Doelen

- Media met een optioneel bijschrift verzenden via `openclaw message send --media`.
- Toestaan dat automatische antwoorden vanuit het webpostvak media naast tekst bevatten.
- Limieten per type redelijk en voorspelbaar houden.

## CLI-oppervlak

`openclaw message send --target <dest> --media <path-or-url> [--message <caption>]`

- `--media <path-or-url>` — media bijvoegen (afbeelding/audio/video/document); accepteert lokale paden of URL's. Optioneel; het bijschrift mag leeg zijn voor verzendingen met alleen media.
- `--gif-playback` — videomedia afspelen als GIF (alleen WhatsApp).
- `--force-document` — media als document verzenden om compressie door het kanaal te voorkomen (Telegram, WhatsApp); geldt voor afbeeldingen, GIF's en video's.
- `--reply-to <id>`, `--thread-id <id>`, `--pin`, `--silent` — opties voor bezorging en gespreksthreads die worden gedeeld met verzendingen met alleen tekst.
- `--dry-run` — de resulterende payload afdrukken en het verzenden overslaan.
- `--json` — het resultaat als JSON afdrukken: `{ action, channel, dryRun, handledBy, messageId?, payload }` (`payload` bevat het kanaalspecifieke verzendresultaat, inclusief eventuele mediaverwijzing).

## Gedrag van het WhatsApp-webkanaal

- Invoer: lokaal bestandspad **of** HTTP(S)-URL.
- Verloop: in een buffer laden, het mediatype detecteren en vervolgens per type de uitgaande payload samenstellen:
  - **Afbeeldingen:** geoptimaliseerd om onder `channels.whatsapp.mediaMaxMb` te blijven (standaard 50 MB). Niet-transparante afbeeldingen worden opnieuw gecomprimeerd als JPEG (de standaardreeks voor afmetingen begint bij 2048 px en loopt af wanneer de bestandsgrootte herhaaldelijk wordt overschreden); afbeeldingen met transparantie blijven PNG. Als de bron al een geschikte JPEG/PNG/WebP is die binnen de limieten voor bestandsgrootte en zijlengte valt, blijven de oorspronkelijke bytes ongewijzigd behouden in plaats van opnieuw te worden gecomprimeerd. Geanimeerde GIF's worden nooit opnieuw gecodeerd; alleen de grootte wordt gecontroleerd.
  - **Audio/spraak:** tenzij het bestand al systeemeigen spraakaudio is (`.ogg`/`.opus` of `audio/ogg`/`audio/opus`), wordt uitgaande audio vóór verzending via `ffmpeg` getranscodeerd naar Opus/OGG (48 kHz mono, 64 kbps, maximaal 20 minuten) en als spraakbericht verzonden (`ptt: true`).
  - **Video:** ongewijzigd doorsturen tot 16 MB.
  - **Documenten:** al het overige, tot 100 MB, waarbij de bestandsnaam indien beschikbaar behouden blijft.
- Afspelen in GIF-stijl op WhatsApp: verzend een MP4 met `gifPlayback: true` (CLI: `--gif-playback`), zodat mobiele clients deze doorlopend in de berichtenstroom afspelen.
- MIME-detectie geeft de voorkeur aan geïdentificeerde magische bytes, daarna aan de bestandsextensie en vervolgens aan antwoordheaders; een algemeen gedetecteerde container (`application/octet-stream`, `zip`) overschrijft nooit een specifiekere extensietoewijzing (bijvoorbeeld XLSX tegenover ZIP).
- Het bijschrift komt uit `--message` of `reply.text`; een leeg bijschrift is toegestaan.
- Logboekregistratie: niet-uitgebreid toont `↩️`/`✅`; uitgebreid bevat de grootte en het bronpad/de bron-URL.

<Note>
De bovenstaande waarden van 16 MB voor audio/video en 100 MB voor documenten zijn de gedeelde standaardlimieten per mediatype wanneer geen expliciete limiet in bytes wordt doorgegeven. WhatsApp-verzendingen stellen een expliciete limiet in vanuit `channels.whatsapp.mediaMaxMb` (standaard 50 MB), die voor dat account uniform op alle typen van toepassing is.
</Note>

## Pijplijn voor automatische antwoorden

- `getReplyFromConfig` retourneert een antwoordpayload (of een reeks payloads) met onder andere `text?`, `mediaUrl?` en `mediaUrls?`.
- Wanneer media aanwezig is, zet de webverzender lokale paden of URL's om via dezelfde pijplijn als `openclaw message send`.
- Als meerdere media-items zijn opgegeven, worden ze achtereenvolgens verzonden.

## Inkomende media naar opdrachten

- Wanneer inkomende webberichten media bevatten, downloadt OpenClaw deze naar een tijdelijk bestand en stelt het sjabloonvariabelen beschikbaar:
  - `{{MediaUrl}}` — pseudo-URL voor de inkomende media.
  - `{{MediaPath}}` — lokaal tijdelijk pad dat wordt geschreven voordat de opdracht wordt uitgevoerd.
- Wanneer een Docker-sandbox per sessie is ingeschakeld, worden inkomende media naar de sandboxwerkruimte gekopieerd en worden `MediaPath`/`MediaUrl` herschreven naar een sandboxrelatief pad zoals `media/inbound/<filename>`.
- Mediabegrip (geconfigureerd via `tools.media.*` of gedeelde `tools.media.models`) wordt vóór het toepassen van sjablonen uitgevoerd en kan blokken `[Image]`, `[Audio]` en `[Video]` in `Body` invoegen.
  - Voor audio wordt `{{Transcript}}` ingesteld en wordt het transcript gebruikt voor het verwerken van opdrachten, zodat slash-opdrachten blijven werken.
  - Beschrijvingen van video's en afbeeldingen behouden eventuele bijschrifttekst voor het verwerken van opdrachten.
  - Als het actieve primaire model al systeemeigen beeldherkenning ondersteunt, slaat OpenClaw het samenvattingsblok `[Image]` over en geeft het in plaats daarvan de oorspronkelijke afbeelding aan het model door.
- Standaard wordt alleen de eerste overeenkomende afbeelding, audio- of videobijlage verwerkt; stel `tools.media.<capability>.attachments` in om meerdere bijlagen te verwerken.

## Limieten en fouten

**Limieten voor uitgaande verzendingen (verzenden via WhatsApp Web)**

- Afbeeldingen: na optimalisatie maximaal `channels.whatsapp.mediaMaxMb` (standaard 50 MB).
- Audio/video: limiet van 16 MB (gedeelde standaard; bij verzending via WhatsApp overschreven door `mediaMaxMb`).
- Documenten: limiet van 100 MB (gedeelde standaard; bij verzending via WhatsApp overschreven door `mediaMaxMb`).
- Te grote of onleesbare media veroorzaken een duidelijke fout in de logboeken en het antwoord wordt overgeslagen.

**Limieten voor mediabegrip (transcriptie/beschrijving)**

- Standaard voor afbeeldingen: 10 MB (`tools.media.image.maxBytes`).
- Standaard voor audio: 20 MB (`tools.media.audio.maxBytes`).
- Standaard voor video: 50 MB (`tools.media.video.maxBytes`).
- Bij te grote media wordt mediabegrip overgeslagen, maar het antwoord wordt nog steeds met de oorspronkelijke berichttekst verzonden.

## Opmerkingen voor tests

- Dek de verzend- en antwoordstromen af voor afbeeldingen, audio en documenten.
- Valideer de groottelimieten na afbeeldingsoptimalisatie en de spraakberichtvlag voor audio.
- Zorg dat antwoorden met meerdere media-items worden opgesplitst in opeenvolgende verzendingen.

## Gerelateerd

- [Camera-opname](/nl/nodes/camera)
- [Mediabegrip](/nl/nodes/media-understanding)
- [Audio en spraakberichten](/nl/nodes/audio)
