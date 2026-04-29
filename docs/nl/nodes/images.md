---
read_when:
    - Mediapijplijn of bijlagen wijzigen
summary: Regels voor de verwerking van afbeeldingen en media voor verzenden, Gateway en agentantwoorden
title: Ondersteuning voor afbeeldingen en media
x-i18n:
    generated_at: "2026-04-29T22:56:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1eb07bc638a755be5597e78c07041a52cfc0297b00d70c5adbfe5f3ad8c1a372
    source_path: nodes/images.md
    workflow: 16
---

# Ondersteuning voor afbeeldingen en media (2025-12-05)

Het WhatsApp-kanaal draait via **Baileys Web**. Dit document legt de huidige regels voor mediaverwerking vast voor verzenden, Gateway en agent-antwoorden.

## Doelen

- Media verzenden met optionele bijschriften via `openclaw message send --media`.
- Automatische antwoorden vanuit de web-inbox toestaan om media naast tekst te bevatten.
- Limieten per type verstandig en voorspelbaar houden.

## CLI-interface

- `openclaw message send --media <path-or-url> [--message <caption>]`
  - `--media` is optioneel; het bijschrift mag leeg zijn voor verzendingen met alleen media.
  - `--dry-run` toont de opgeloste payload; `--json` geeft `{ channel, to, messageId, mediaUrl, caption }` uit.

## Gedrag van het WhatsApp Web-kanaal

- Invoer: lokaal bestandspad **of** HTTP(S)-URL.
- Stroom: laad in een Buffer, detecteer het mediatype en bouw de juiste payload:
  - **Afbeeldingen:** verklein en comprimeer opnieuw naar JPEG (maximale zijde 2048px) gericht op `channels.whatsapp.mediaMaxMb` (standaard: 50 MB).
  - **Audio/Spraak/Video:** onveranderd doorgeven tot 16 MB; audio wordt verzonden als spraakbericht (`ptt: true`).
  - **Documenten:** al het andere, tot 100 MB, met bestandsnaam behouden wanneer beschikbaar.
- WhatsApp GIF-achtige weergave: stuur een MP4 met `gifPlayback: true` (CLI: `--gif-playback`) zodat mobiele clients inline herhalen.
- MIME-detectie geeft de voorkeur aan magic bytes, daarna headers en daarna de bestandsextensie.
- Bijschrift komt uit `--message` of `reply.text`; een leeg bijschrift is toegestaan.
- Logboekregistratie: niet-uitgebreid toont `↩️`/`✅`; uitgebreid bevat grootte en bronpad/URL.

## Pijplijn voor automatische antwoorden

- `getReplyFromConfig` retourneert `{ text?, mediaUrl?, mediaUrls? }`.
- Wanneer media aanwezig is, lost de webverzender lokale paden of URL's op met dezelfde pijplijn als `openclaw message send`.
- Meerdere media-items worden opeenvolgend verzonden als ze zijn opgegeven.

## Inkomende media naar opdrachten (Pi)

- Wanneer inkomende webberichten media bevatten, downloadt OpenClaw deze naar een tijdelijk bestand en stelt templatingvariabelen beschikbaar:
  - `{{MediaUrl}}` pseudo-URL voor de inkomende media.
  - `{{MediaPath}}` lokaal tijdelijk pad dat wordt geschreven voordat de opdracht wordt uitgevoerd.
- Wanneer een Docker-sandbox per sessie is ingeschakeld, wordt inkomende media gekopieerd naar de sandbox-werkruimte en worden `MediaPath`/`MediaUrl` herschreven naar een relatief pad zoals `media/inbound/<filename>`.
- Mediabegrip (indien geconfigureerd via `tools.media.*` of gedeelde `tools.media.models`) wordt vóór templating uitgevoerd en kan blokken `[Image]`, `[Audio]` en `[Video]` invoegen in `Body`.
  - Audio stelt `{{Transcript}}` in en gebruikt het transcript voor opdrachtparsing zodat slash-opdrachten blijven werken.
  - Video- en afbeeldingsbeschrijvingen behouden eventuele bijschrifttekst voor opdrachtparsing.
  - Als het actieve primaire afbeeldingsmodel al native vision ondersteunt, slaat OpenClaw het samenvattingsblok `[Image]` over en geeft in plaats daarvan de oorspronkelijke afbeelding door aan het model.
- Standaard wordt alleen de eerste overeenkomende afbeelding/audio/video-bijlage verwerkt; stel `tools.media.<cap>.attachments` in om meerdere bijlagen te verwerken.

## Limieten en fouten

**Limieten voor uitgaand verzenden (WhatsApp-webverzending)**

- Afbeeldingen: tot `channels.whatsapp.mediaMaxMb` (standaard: 50 MB) na hercompressie.
- Audio/spraak/video: limiet van 16 MB; documenten: limiet van 100 MB.
- Te grote of onleesbare media → duidelijke fout in logboeken en het antwoord wordt overgeslagen.

**Limieten voor mediabegrip (transcriptie/beschrijving)**

- Afbeelding standaard: 10 MB (`tools.media.image.maxBytes`).
- Audio standaard: 20 MB (`tools.media.audio.maxBytes`).
- Video standaard: 50 MB (`tools.media.video.maxBytes`).
- Te grote media slaan begrip over, maar antwoorden gaan nog steeds door met de oorspronkelijke body.

## Opmerkingen voor tests

- Dek verzend- en antwoordstromen af voor gevallen met afbeelding/audio/document.
- Valideer hercompressie voor afbeeldingen (groottelimiet) en de spraakberichtvlag voor audio.
- Zorg dat antwoorden met meerdere media worden uitgespreid als opeenvolgende verzendingen.

## Gerelateerd

- [Camera-opname](/nl/nodes/camera)
- [Mediabegrip](/nl/nodes/media-understanding)
- [Audio en spraakberichten](/nl/nodes/audio)
