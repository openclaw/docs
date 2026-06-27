---
read_when:
    - Media-pipeline of bijlagen aanpassen
summary: Regels voor afbeelding- en mediaverwerking voor verzenden, Gateway en agentantwoorden
title: Ondersteuning voor afbeeldingen en media
x-i18n:
    generated_at: "2026-06-27T17:44:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eeee181cae2798b7d0f5dbe0331c6b09612755b4d796d98baaeaf6989955def5
    source_path: nodes/images.md
    workflow: 16
---

Het WhatsApp-kanaal draait via **Baileys Web**. Dit document legt de huidige regels voor mediaverwerking vast voor verzenden, Gateway en agentantwoorden.

## Doelen

- Media met optionele bijschriften verzenden via `openclaw message send --media`.
- Automatische antwoorden vanuit de web-inbox toestaan om naast tekst ook media op te nemen.
- Limieten per type verstandig en voorspelbaar houden.

## CLI-interface

- `openclaw message send --media <path-or-url> [--message <caption>]`
  - `--media` is optioneel; het bijschrift mag leeg zijn voor verzendingen met alleen media.
  - `--dry-run` toont de opgeloste payload; `--json` geeft `{ channel, to, messageId, mediaUrl, caption }` uit.

## Gedrag van het WhatsApp Web-kanaal

- Invoer: lokaal bestandspad **of** HTTP(S)-URL.
- Flow: laad in een buffer, detecteer het mediatype en bouw de juiste payload:
  - **Afbeeldingen:** verkleinen en opnieuw comprimeren naar JPEG (maximale zijde 2048px), gericht op `channels.whatsapp.mediaMaxMb` (standaard: 50 MB).
  - **Audio/spraak/video:** ongewijzigd doorgeven tot 16 MB; audio wordt verzonden als spraakbericht (`ptt: true`).
  - **Documenten:** al het overige, tot 100 MB, met behoud van bestandsnaam waar beschikbaar.
- GIF-achtige weergave in WhatsApp: verstuur een MP4 met `gifPlayback: true` (CLI: `--gif-playback`) zodat mobiele clients inline loopen.
- MIME-detectie geeft de voorkeur aan magische bytes, daarna headers en daarna bestandsextensie.
- Het bijschrift komt uit `--message` of `reply.text`; een leeg bijschrift is toegestaan.
- Logging: niet-uitgebreid toont `↩️`/`✅`; uitgebreid bevat grootte en bronpad/URL.

## Pipeline voor automatische antwoorden

- `getReplyFromConfig` retourneert `{ text?, mediaUrl?, mediaUrls? }`.
- Wanneer media aanwezig is, lost de webverzender lokale paden of URL’s op met dezelfde pipeline als `openclaw message send`.
- Meerdere media-items worden opeenvolgend verzonden als ze zijn opgegeven.

## Inkomende media naar opdrachten

- Wanneer inkomende webberichten media bevatten, downloadt OpenClaw die naar een tijdelijk bestand en stelt het templatingvariabelen beschikbaar:
  - `{{MediaUrl}}` pseudo-URL voor de inkomende media.
  - `{{MediaPath}}` lokaal tijdelijk pad dat wordt geschreven voordat de opdracht wordt uitgevoerd.
- Wanneer een Docker-sandbox per sessie is ingeschakeld, wordt inkomende media naar de sandbox-werkruimte gekopieerd en worden `MediaPath`/`MediaUrl` herschreven naar een relatief pad zoals `media/inbound/<filename>`.
- Mediabegrip (indien geconfigureerd via `tools.media.*` of gedeelde `tools.media.models`) draait vóór templating en kan blokken `[Image]`, `[Audio]` en `[Video]` invoegen in `Body`.
  - Audio stelt `{{Transcript}}` in en gebruikt het transcript voor opdrachtparsing, zodat slash-opdrachten blijven werken.
  - Beschrijvingen van video en afbeeldingen behouden eventuele bijschrifttekst voor opdrachtparsing.
  - Als het actieve primaire afbeeldingsmodel al native vision ondersteunt, slaat OpenClaw het samenvattingsblok `[Image]` over en geeft het in plaats daarvan de oorspronkelijke afbeelding door aan het model.
- Standaard wordt alleen de eerste overeenkomende afbeelding/audio-/videobijlage verwerkt; stel `tools.media.<cap>.attachments` in om meerdere bijlagen te verwerken.

## Limieten en fouten

**Limieten voor uitgaand verzenden (WhatsApp webverzending)**

- Afbeeldingen: tot `channels.whatsapp.mediaMaxMb` (standaard: 50 MB) na hercompressie.
- Audio/spraak/video: limiet van 16 MB; documenten: limiet van 100 MB.
- Te grote of onleesbare media → duidelijke fout in logs en het antwoord wordt overgeslagen.

**Limieten voor mediabegrip (transcriptie/beschrijving)**

- Standaard voor afbeeldingen: 10 MB (`tools.media.image.maxBytes`).
- Standaard voor audio: 20 MB (`tools.media.audio.maxBytes`).
- Standaard voor video: 50 MB (`tools.media.video.maxBytes`).
- Te grote media slaan begrip over, maar antwoorden gaan nog steeds door met de oorspronkelijke body.

## Opmerkingen voor tests

- Dek verzend- en antwoordflows af voor gevallen met afbeeldingen/audio/documenten.
- Valideer hercompressie voor afbeeldingen (groottegrens) en de spraakberichtvlag voor audio.
- Zorg dat antwoorden met meerdere media uitwaaieren als opeenvolgende verzendingen.

## Gerelateerd

- [Camera-opname](/nl/nodes/camera)
- [Mediabegrip](/nl/nodes/media-understanding)
- [Audio en spraakberichten](/nl/nodes/audio)
