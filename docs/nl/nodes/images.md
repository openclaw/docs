---
read_when:
    - Mediapipeline of bijlagen wijzigen
summary: Regels voor beeld- en mediaverwerking voor verzenden, Gateway en agentantwoorden
title: Ondersteuning voor afbeeldingen en media
x-i18n:
    generated_at: "2026-05-06T09:21:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: a38224fdf42f32fe206ad8cf3fcc3b06a078b1978d447adeb671fdb3ff4e4b32
    source_path: nodes/images.md
    workflow: 16
---

# Ondersteuning voor afbeeldingen en media (2025-12-05)

Het WhatsApp-kanaal draait via **Baileys Web**. Dit document beschrijft de huidige regels voor mediaverwerking voor verzenden, Gateway en agentreacties.

## Doelen

- Media met optionele bijschriften verzenden via `openclaw message send --media`.
- Automatische antwoorden vanuit de webinbox toestaan om naast tekst ook media op te nemen.
- Limieten per type verstandig en voorspelbaar houden.

## CLI-oppervlak

- `openclaw message send --media <path-or-url> [--message <caption>]`
  - `--media` is optioneel; het bijschrift mag leeg zijn voor verzendingen met alleen media.
  - `--dry-run` toont de opgeloste payload; `--json` geeft `{ channel, to, messageId, mediaUrl, caption }` uit.

## Gedrag van het WhatsApp Web-kanaal

- Invoer: lokaal bestandspad **of** HTTP(S)-URL.
- Stroom: laden in een Buffer, mediatype detecteren en de juiste payload bouwen:
  - **Afbeeldingen:** verkleinen en opnieuw comprimeren naar JPEG (maximale zijde 2048px), gericht op `channels.whatsapp.mediaMaxMb` (standaard: 50 MB).
  - **Audio/spraak/video:** ongewijzigd doorgeven tot 16 MB; audio wordt verzonden als spraakbericht (`ptt: true`).
  - **Documenten:** al het overige, tot 100 MB, met bestandsnaam behouden wanneer beschikbaar.
- Afspelen in WhatsApp-GIF-stijl: verzend een MP4 met `gifPlayback: true` (CLI: `--gif-playback`) zodat mobiele clients deze inline herhalen.
- MIME-detectie geeft de voorkeur aan magische bytes, daarna headers en daarna bestandsextensie.
- Bijschrift komt uit `--message` of `reply.text`; een leeg bijschrift is toegestaan.
- Logging: niet-uitgebreid toont `↩️`/`✅`; uitgebreid bevat grootte en bronpad/URL.

## Pipeline voor automatische antwoorden

- `getReplyFromConfig` retourneert `{ text?, mediaUrl?, mediaUrls? }`.
- Wanneer media aanwezig is, lost de webverzender lokale paden of URL's op met dezelfde pipeline als `openclaw message send`.
- Meerdere media-items worden opeenvolgend verzonden als ze zijn opgegeven.

## Inkomende media naar opdrachten (Pi)

- Wanneer inkomende webberichten media bevatten, downloadt OpenClaw deze naar een tijdelijk bestand en stelt het templatingvariabelen beschikbaar:
  - `{{MediaUrl}}` pseudo-URL voor de inkomende media.
  - `{{MediaPath}}` lokaal tijdelijk pad dat wordt geschreven voordat de opdracht wordt uitgevoerd.
- Wanneer een Docker-sandbox per sessie is ingeschakeld, wordt inkomende media naar de sandboxwerkruimte gekopieerd en worden `MediaPath`/`MediaUrl` herschreven naar een relatief pad zoals `media/inbound/<filename>`.
- Mediabegrip (indien geconfigureerd via `tools.media.*` of gedeelde `tools.media.models`) wordt uitgevoerd vóór templating en kan `[Image]`-, `[Audio]`- en `[Video]`-blokken invoegen in `Body`.
  - Audio stelt `{{Transcript}}` in en gebruikt het transcript voor opdrachtparsing, zodat slashopdrachten blijven werken.
  - Video- en afbeeldingsbeschrijvingen behouden eventuele bijschrifttekst voor opdrachtparsing.
  - Als het actieve primaire afbeeldingsmodel al native vision ondersteunt, slaat OpenClaw het `[Image]`-samenvattingsblok over en geeft het in plaats daarvan de oorspronkelijke afbeelding door aan het model.
- Standaard wordt alleen de eerste overeenkomende afbeelding/audio/video-bijlage verwerkt; stel `tools.media.<cap>.attachments` in om meerdere bijlagen te verwerken.

## Limieten en fouten

**Limieten voor uitgaande verzendingen (verzenden via WhatsApp web)**

- Afbeeldingen: tot `channels.whatsapp.mediaMaxMb` (standaard: 50 MB) na hercompressie.
- Audio/spraak/video: limiet van 16 MB; documenten: limiet van 100 MB.
- Te grote of onleesbare media → duidelijke fout in logs en het antwoord wordt overgeslagen.

**Limieten voor mediabegrip (transcriptie/beschrijving)**

- Standaard voor afbeeldingen: 10 MB (`tools.media.image.maxBytes`).
- Standaard voor audio: 20 MB (`tools.media.audio.maxBytes`).
- Standaard voor video: 50 MB (`tools.media.video.maxBytes`).
- Te grote media slaat begrip over, maar antwoorden gaan nog steeds door met de oorspronkelijke body.

## Opmerkingen voor tests

- Dek verzend- en antwoordstromen af voor afbeeldingen, audio en documenten.
- Valideer hercompressie voor afbeeldingen (groottebegrenzing) en de spraakberichtvlag voor audio.
- Zorg dat antwoorden met meerdere media uitwaaieren als opeenvolgende verzendingen.

## Gerelateerd

- [Camera-opname](/nl/nodes/camera)
- [Mediabegrip](/nl/nodes/media-understanding)
- [Audio en spraakberichten](/nl/nodes/audio)
