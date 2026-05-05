---
read_when:
    - Op zoek naar een overzicht van de mediamogelijkheden van OpenClaw
    - Bepalen welke mediaprovider u moet configureren
    - Begrijpen hoe asynchrone mediageneratie werkt
sidebarTitle: Media overview
summary: Mogelijkheden voor beeld, video, muziek, spraak en mediabegrip in één oogopslag
title: Mediaoverzicht
x-i18n:
    generated_at: "2026-05-05T01:50:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bd6b93fd79897001d24f3ba5a5c8cb9bd17281116fad17262a6389214db7059
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw genereert afbeeldingen, video’s en muziek, begrijpt inkomende media
(afbeeldingen, audio, video) en spreekt antwoorden hardop uit met tekst-naar-spraak. Alle
mediamogelijkheden zijn toolgestuurd: de agent beslist wanneer hij ze gebruikt op basis
van het gesprek, en elke tool verschijnt alleen wanneer ten minste één onderliggende
provider is geconfigureerd.

## Mogelijkheden

<CardGroup cols={2}>
  <Card title="Afbeeldingen genereren" href="/nl/tools/image-generation" icon="image">
    Maak en bewerk afbeeldingen vanuit tekstprompts of referentieafbeeldingen via
    `image_generate`. Synchroon — wordt inline met het antwoord voltooid.
  </Card>
  <Card title="Video genereren" href="/nl/tools/video-generation" icon="video">
    Tekst-naar-video, afbeelding-naar-video en video-naar-video via `video_generate`.
    Asynchroon — draait op de achtergrond en plaatst het resultaat wanneer het klaar is.
  </Card>
  <Card title="Muziek genereren" href="/nl/tools/music-generation" icon="music">
    Genereer muziek of audiotracks via `music_generate`. Asynchroon bij gedeelde
    providers; het ComfyUI-workflowpad draait synchroon.
  </Card>
  <Card title="Tekst-naar-spraak" href="/nl/tools/tts" icon="microphone">
    Zet uitgaande antwoorden om naar gesproken audio via de `tts`-tool plus
    `messages.tts`-configuratie. Synchroon.
  </Card>
  <Card title="Mediabegrip" href="/nl/nodes/media-understanding" icon="eye">
    Vat inkomende afbeeldingen, audio en video samen met modelproviders met
    vision-mogelijkheden en speciale mediabegrip-plugins.
  </Card>
  <Card title="Spraak-naar-tekst" href="/nl/nodes/audio" icon="ear-listen">
    Transcribeer inkomende spraakberichten via batch-STT- of Voice Call-providers
    voor streaming-STT.
  </Card>
</CardGroup>

## Provider-capaciteitenmatrix

| Provider    | Afbeelding | Video | Muziek | TTS | STT | Realtime-spraak | Mediabegrip |
| ----------- | :--------: | :---: | :----: | :-: | :-: | :-------------: | :---------: |
| Alibaba     |            |   ✓   |        |     |     |                 |             |
| BytePlus    |            |   ✓   |        |     |     |                 |             |
| ComfyUI     |     ✓      |   ✓   |   ✓    |     |     |                 |             |
| DeepInfra   |     ✓      |   ✓   |        |  ✓  |  ✓  |                 |      ✓      |
| Deepgram    |            |       |        |     |  ✓  |        ✓        |             |
| ElevenLabs  |            |       |        |  ✓  |  ✓  |                 |             |
| fal         |     ✓      |   ✓   |        |     |     |                 |             |
| Google      |     ✓      |   ✓   |   ✓    |  ✓  |     |        ✓        |      ✓      |
| Gradium     |            |       |        |  ✓  |     |                 |             |
| Local CLI   |            |       |        |  ✓  |     |                 |             |
| Microsoft   |            |       |        |  ✓  |     |                 |             |
| MiniMax     |     ✓      |   ✓   |   ✓    |  ✓  |     |                 |             |
| Mistral     |            |       |        |     |  ✓  |                 |             |
| OpenAI      |     ✓      |   ✓   |        |  ✓  |  ✓  |        ✓        |      ✓      |
| OpenRouter  |     ✓      |   ✓   |        |  ✓  |     |                 |      ✓      |
| Qwen        |            |   ✓   |        |     |     |                 |             |
| Runway      |            |   ✓   |        |     |     |                 |             |
| SenseAudio  |            |       |        |     |  ✓  |                 |             |
| Together    |            |   ✓   |        |     |     |                 |             |
| Vydra       |     ✓      |   ✓   |        |  ✓  |     |                 |             |
| xAI         |     ✓      |   ✓   |        |  ✓  |  ✓  |                 |      ✓      |
| Xiaomi MiMo |     ✓      |       |        |  ✓  |     |                 |      ✓      |

<Note>
Mediabegrip gebruikt elk vision- of audio-capabel model dat in je
providerconfiguratie is geregistreerd. De matrix hierboven vermeldt providers met
speciale ondersteuning voor mediabegrip; de meeste multimodale LLM-providers
(Anthropic, Google, OpenAI, enz.) kunnen inkomende media ook begrijpen wanneer ze
zijn geconfigureerd als het actieve antwoordmodel.
</Note>

## Asynchroon versus synchroon

| Mogelijkheid     | Modus        | Waarom                                                            |
| ---------------- | ------------ | ----------------------------------------------------------------- |
| Afbeelding       | Synchroon    | Providerantwoorden komen binnen enkele seconden terug; wordt inline met het antwoord voltooid. |
| Tekst-naar-spraak | Synchroon    | Providerantwoorden komen binnen enkele seconden terug; wordt aan de antwoordaudio gekoppeld. |
| Video            | Asynchroon   | Providerverwerking duurt 30 s tot enkele minuten.                 |
| Muziek (gedeeld) | Asynchroon   | Dezelfde providerverwerkingskenmerken als video.                  |
| Muziek (ComfyUI) | Synchroon    | Lokale workflow draait inline tegen de geconfigureerde ComfyUI-server. |

Voor asynchrone tools dient OpenClaw de aanvraag in bij de provider, retourneert
direct een taak-id en volgt de taak in het takenregister. De agent blijft
antwoorden op andere berichten terwijl de taak draait. Wanneer de provider klaar is,
wekt OpenClaw de agent met de gegenereerde mediapaden, zodat hij de gebruiker kan
informeren en, wanneer vereist door het beleid voor bronlevering, het resultaat via
de berichtentool kan doorgeven.

## Spraak-naar-tekst en Voice Call

Deepgram, DeepInfra, ElevenLabs, Mistral, OpenAI, SenseAudio en xAI kunnen allemaal
inkomende audio transcriberen via het batchpad `tools.media.audio` wanneer ze zijn
geconfigureerd. Kanaalplugins die vooraf een spraaknotitie controleren voor
mention-gating of opdrachtparsing markeren de getranscribeerde bijlage in de
inkomende context, zodat de gedeelde mediabegripstap dat transcript hergebruikt in
plaats van een tweede STT-aanroep voor dezelfde audio te doen.

Deepgram, ElevenLabs, Mistral, OpenAI en xAI registreren ook Voice Call-providers
voor streaming-STT, zodat live telefoonaudio naar de geselecteerde leverancier kan
worden doorgestuurd zonder te wachten op een voltooide opname.

## Providertoewijzingen (hoe leveranciers over oppervlakken zijn verdeeld)

<AccordionGroup>
  <Accordion title="Google">
    Oppervlakken voor afbeelding, video, muziek, batch-TTS, backend-realtime-spraak en
    mediabegrip.
  </Accordion>
  <Accordion title="OpenAI">
    Oppervlakken voor afbeelding, video, batch-TTS, batch-STT, Voice Call-streaming-STT,
    backend-realtime-spraak en geheugen-embeddings.
  </Accordion>
  <Accordion title="DeepInfra">
    Oppervlakken voor chat/modelroutering, afbeeldingen genereren/bewerken,
    tekst-naar-video, batch-TTS, batch-STT, afbeeldingsmediabegrip en
    geheugen-embeddings. DeepInfra-eigen modellen voor reranking/classificatie/
    objectdetectie worden pas geregistreerd wanneer OpenClaw speciale
    providercontracten voor die categorieën heeft.
  </Accordion>
  <Accordion title="xAI">
    Afbeelding, video, zoeken, code-uitvoering, batch-TTS, batch-STT en Voice
    Call-streaming-STT. xAI Realtime-spraak is een upstreammogelijkheid, maar wordt
    pas in OpenClaw geregistreerd wanneer het gedeelde contract voor
    realtime-spraak dit kan representeren.
  </Accordion>
</AccordionGroup>

## Gerelateerd

- [Afbeeldingen genereren](/nl/tools/image-generation)
- [Video genereren](/nl/tools/video-generation)
- [Muziek genereren](/nl/tools/music-generation)
- [Tekst-naar-spraak](/nl/tools/tts)
- [Mediabegrip](/nl/nodes/media-understanding)
- [Audionodes](/nl/nodes/audio)
