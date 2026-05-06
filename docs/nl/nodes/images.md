---
read_when:
    - Mediapijplijn of bijlagen wijzigen
summary: Regels voor afbeelding- en mediaverwerking voor verzenden, Gateway en agentantwoorden
title: Ondersteuning voor afbeeldingen en media
x-i18n:
    generated_at: "2026-05-06T17:58:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 069140a3ad3bade166d4576ead604b4675006a01e546672872379ce83291471c
    source_path: nodes/images.md
    workflow: 16
---

Het WhatsApp-kanaal draait via **Baileys Web**. Dit document beschrijft de huidige regels voor mediaverwerking voor verzenden, Gateway en agentantwoorden.

## Doelen

- Media met optionele bijschriften verzenden via `openclaw message send --media`.
- Auto-antwoorden vanuit de webinbox toestaan om media naast tekst te bevatten.
- Limieten per type verstandig en voorspelbaar houden.

## CLI-oppervlak

- `openclaw message send --media <path-or-url> [--message <caption>]`
  - `--media` is optioneel; het bijschrift kan leeg zijn voor verzendingen met alleen media.
  - `--dry-run` toont de opgeloste payload; `--json` geeft `{ channel, to, messageId, mediaUrl, caption }` uit.

## Gedrag van het WhatsApp Web-kanaal

- Invoer: lokaal bestandspad **of** HTTP(S)-URL.
- Stroom: laden in een Buffer, mediasoort detecteren en de juiste payload bouwen:
  - **Afbeeldingen:** verkleinen en opnieuw comprimeren naar JPEG (maximale zijde 2048px) met als doel `channels.whatsapp.mediaMaxMb` (standaard: 50 MB).
  - **Audio/spraak/video:** ongewijzigd doorgeven tot 16 MB; audio wordt verzonden als spraaknotitie (`ptt: true`).
  - **Documenten:** al het overige, tot 100 MB, met bestandsnaam behouden wanneer beschikbaar.
- Afspelen in WhatsApp GIF-stijl: verzend een MP4 met `gifPlayback: true` (CLI: `--gif-playback`) zodat mobiele clients inline herhalen.
- MIME-detectie geeft de voorkeur aan magic bytes, daarna headers, daarna bestandsextensie.
- Bijschrift komt uit `--message` of `reply.text`; een leeg bijschrift is toegestaan.
- Logging: niet-uitgebreid toont `↩️`/`✅`; uitgebreid bevat grootte en bronpad/URL.

## Pipeline voor auto-antwoorden

- `getReplyFromConfig` retourneert `{ text?, mediaUrl?, mediaUrls? }`.
- Wanneer media aanwezig is, lost de webverzender lokale paden of URL's op met dezelfde pipeline als `openclaw message send`.
- Meerdere media-items worden opeenvolgend verzonden als ze zijn opgegeven.

## Inkomende media naar opdrachten (Pi)

- Wanneer inkomende webberichten media bevatten, downloadt OpenClaw deze naar een tijdelijk bestand en stelt het templatingvariabelen beschikbaar:
  - `{{MediaUrl}}` pseudo-URL voor de inkomende media.
  - `{{MediaPath}}` lokaal tijdelijk pad dat wordt geschreven voordat de opdracht wordt uitgevoerd.
- Wanneer een Docker-sandbox per sessie is ingeschakeld, wordt inkomende media naar de sandbox-werkruimte gekopieerd en worden `MediaPath`/`MediaUrl` herschreven naar een relatief pad zoals `media/inbound/<filename>`.
- Mediabegrip (indien geconfigureerd via `tools.media.*` of gedeelde `tools.media.models`) draait vóór templating en kan `[Image]`, `[Audio]` en `[Video]`-blokken invoegen in `Body`.
  - Audio stelt `{{Transcript}}` in en gebruikt het transcript voor opdrachtparsing zodat slash-opdrachten blijven werken.
  - Video- en afbeeldingsbeschrijvingen behouden eventuele bijschrifttekst voor opdrachtparsing.
  - Als het actieve primaire afbeeldingsmodel al native vision ondersteunt, slaat OpenClaw het `[Image]`-samenvattingsblok over en geeft in plaats daarvan de oorspronkelijke afbeelding door aan het model.
- Standaard wordt alleen de eerste overeenkomende afbeelding/audio/video-bijlage verwerkt; stel `tools.media.<cap>.attachments` in om meerdere bijlagen te verwerken.

## Limieten en fouten

**Limieten voor uitgaand verzenden (verzenden via WhatsApp web)**

- Afbeeldingen: tot `channels.whatsapp.mediaMaxMb` (standaard: 50 MB) na recompressie.
- Audio/spraak/video: limiet van 16 MB; documenten: limiet van 100 MB.
- Te grote of onleesbare media → duidelijke fout in logs en het antwoord wordt overgeslagen.

**Limieten voor mediabegrip (transcriptie/beschrijving)**

- Standaard voor afbeeldingen: 10 MB (`tools.media.image.maxBytes`).
- Standaard voor audio: 20 MB (`tools.media.audio.maxBytes`).
- Standaard voor video: 50 MB (`tools.media.video.maxBytes`).
- Te grote media slaat begrip over, maar antwoorden gaan nog steeds door met de oorspronkelijke body.

## Opmerkingen voor tests

- Dek verzend- en antwoordstromen af voor afbeeldings-, audio- en documentgevallen.
- Valideer recompressie voor afbeeldingen (groottegrens) en de spraaknotitievlag voor audio.
- Zorg ervoor dat antwoorden met meerdere media uitwaaieren als opeenvolgende verzendingen.

## Gerelateerd

- [Camera-opname](/nl/nodes/camera)
- [Mediabegrip](/nl/nodes/media-understanding)
- [Audio en spraaknotities](/nl/nodes/audio)
