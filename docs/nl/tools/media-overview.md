---
read_when:
    - Op zoek naar een overzicht van de mediamogelijkheden van OpenClaw
    - Bepalen welke mediaprovider moet worden geconfigureerd
    - Begrijpen hoe asynchrone mediageneratie werkt
sidebarTitle: Media overview
summary: Mogelijkheden voor afbeeldingen, video, muziek, spraak en mediabegrip in één oogopslag
title: Mediaoverzicht
x-i18n:
    generated_at: "2026-04-29T23:24:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: b9f40e4fb86832438ae99dd2dc42da93c41937541314d95486c97c210dfef508
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw genereert afbeeldingen, video's en muziek, begrijpt inkomende media
(afbeeldingen, audio, video) en spreekt antwoorden hardop uit met tekst-naar-spraak. Alle
mediamogelijkheden zijn toolgestuurd: de agent beslist op basis van het gesprek
wanneer hij ze gebruikt, en elke tool verschijnt alleen wanneer er ten minste één achterliggende
provider is geconfigureerd.

## Mogelijkheden

<CardGroup cols={2}>
  <Card title="Afbeeldingen genereren" href="/nl/tools/image-generation" icon="image">
    Maak en bewerk afbeeldingen op basis van tekstprompts of referentieafbeeldingen via
    `image_generate`. Synchroon — wordt inline met het antwoord voltooid.
  </Card>
  <Card title="Video genereren" href="/nl/tools/video-generation" icon="video">
    Tekst-naar-video, afbeelding-naar-video en video-naar-video via `video_generate`.
    Asynchroon — draait op de achtergrond en plaatst het resultaat zodra het klaar is.
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
    Vat inkomende afbeeldingen, audio en video samen met modelproviders
    met vision-mogelijkheden en speciale plugins voor mediabegrip.
  </Card>
  <Card title="Spraak-naar-tekst" href="/nl/nodes/audio" icon="ear-listen">
    Transcribeer inkomende spraakberichten via batch-STT of providers voor streaming-STT
    voor spraakoproepen.
  </Card>
</CardGroup>

## Matrix met providermogelijkheden

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
Mediabegrip gebruikt elk vision- of audiogeschikt model dat in je providerconfiguratie
is geregistreerd. De matrix hierboven vermeldt providers met speciale
ondersteuning voor mediabegrip; de meeste multimodale LLM-providers (Anthropic, Google,
OpenAI, enz.) kunnen ook inkomende media begrijpen wanneer ze zijn geconfigureerd als het actieve
antwoordmodel.
</Note>

## Asynchroon versus synchroon

| Mogelijkheid     | Modus        | Waarom                                                            |
| ---------------- | ------------ | ----------------------------------------------------------------- |
| Afbeelding       | Synchroon    | Providerantwoorden komen binnen seconden terug; wordt inline met het antwoord voltooid. |
| Tekst-naar-spraak | Synchroon   | Providerantwoorden komen binnen seconden terug; gekoppeld aan de antwoordaudio. |
| Video            | Asynchroon   | Providerverwerking duurt 30 s tot enkele minuten.                 |
| Muziek (gedeeld) | Asynchroon   | Zelfde providerverwerkingskenmerk als video.                      |
| Muziek (ComfyUI) | Synchroon    | Lokale workflow draait inline tegen de geconfigureerde ComfyUI-server. |

Voor asynchrone tools dient OpenClaw de aanvraag in bij de provider, retourneert direct een taak-id
en volgt de taak in het taakregister. De agent blijft
op andere berichten reageren terwijl de taak draait. Wanneer de provider klaar is,
wekt OpenClaw de agent zodat deze de voltooide media terug kan plaatsen in het
oorspronkelijke kanaal.

## Spraak-naar-tekst en spraakoproep

Deepgram, DeepInfra, ElevenLabs, Mistral, OpenAI, SenseAudio en xAI kunnen allemaal
inkomende audio transcriberen via het batchpad `tools.media.audio` wanneer dit is geconfigureerd.
Kanaalplugins die een spraaknotitie vooraf controleren voor mention-gating of opdrachtparsing
markeren de getranscribeerde bijlage op de inkomende context, zodat de gedeelde
mediabegripstap dat transcript hergebruikt in plaats van een tweede
STT-aanroep te doen voor dezelfde audio.

Deepgram, ElevenLabs, Mistral, OpenAI en xAI registreren ook providers voor
streaming-STT voor spraakoproepen, zodat live telefoonaudio kan worden doorgestuurd naar de geselecteerde
leverancier zonder te wachten op een voltooide opname.

## Providertoewijzingen (hoe leveranciers over oppervlakken zijn verdeeld)

<AccordionGroup>
  <Accordion title="Google">
    Oppervlakken voor afbeeldingen, video, muziek, batch-TTS, realtime-spraak in de backend en
    mediabegrip.
  </Accordion>
  <Accordion title="OpenAI">
    Oppervlakken voor afbeeldingen, video, batch-TTS, batch-STT, streaming-STT voor spraakoproepen, realtime-spraak in de backend
    en geheugen-embeddings.
  </Accordion>
  <Accordion title="DeepInfra">
    Oppervlakken voor chat/modelroutering, afbeeldingen genereren/bewerken, tekst-naar-video, batch-TTS,
    batch-STT, beeldmediabegrip en geheugen-embeddings.
    DeepInfra-native modellen voor reranking/classificatie/objectdetectie worden pas
    geregistreerd zodra OpenClaw speciale providercontracten voor die
    categorieën heeft.
  </Accordion>
  <Accordion title="xAI">
    Afbeeldingen, video, zoeken, code-uitvoering, batch-TTS, batch-STT en streaming-STT voor spraakoproepen.
    xAI Realtime-spraak is een upstream-mogelijkheid, maar wordt
    niet in OpenClaw geregistreerd totdat het gedeelde realtime-spraakcontract deze kan
    weergeven.
  </Accordion>
</AccordionGroup>

## Gerelateerd

- [Afbeeldingen genereren](/nl/tools/image-generation)
- [Video genereren](/nl/tools/video-generation)
- [Muziek genereren](/nl/tools/music-generation)
- [Tekst-naar-spraak](/nl/tools/tts)
- [Mediabegrip](/nl/nodes/media-understanding)
- [Audioknooppunten](/nl/nodes/audio)
