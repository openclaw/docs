---
read_when:
    - Op zoek naar een overzicht van de mediamogelijkheden van OpenClaw
    - Bepalen welke mediaprovider u wilt configureren
    - Begrijpen hoe asynchrone mediageneratie werkt
sidebarTitle: Media overview
summary: Mogelijkheden voor beeld, video, muziek, spraak en mediabegrip in één oogopslag
title: Mediaoverzicht
x-i18n:
    generated_at: "2026-06-27T18:27:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c04beb60abbd06d1503302be144e633b526ae55435f061fbb94f6fef85ca9d66
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw genereert afbeeldingen, video's en muziek, begrijpt inkomende media
(afbeeldingen, audio, video) en spreekt antwoorden hardop uit met tekst-naar-spraak. Alle
mediamogelijkheden zijn toolgestuurd: de agent beslist op basis van het gesprek
wanneer ze worden gebruikt, en elke tool verschijnt alleen wanneer ten minste één
ondersteunende provider is geconfigureerd.

Live spraak gebruikt het Talk-sessiecontract in plaats van het eenmalige
mediatoolpad. Talk heeft drie modi: provider-native `realtime`, lokale of
streaming `stt-tts`, en `transcription` voor spraakopname die alleen observeert. Deze modi
delen providercatalogi, event-enveloppen en annuleringssemantiek met
telefonie, vergaderingen, browser-realtime en native push-to-talk-clients.

## Mogelijkheden

<CardGroup cols={2}>
  <Card title="Afbeeldingen genereren" href="/nl/tools/image-generation" icon="image">
    Maak en bewerk afbeeldingen op basis van tekstprompts of referentieafbeeldingen via
    `image_generate`. Asynchroon in chatsessies — draait op de achtergrond en
    plaatst het resultaat zodra het klaar is.
  </Card>
  <Card title="Video genereren" href="/nl/tools/video-generation" icon="video">
    Tekst-naar-video, afbeelding-naar-video en video-naar-video via `video_generate`.
    Asynchroon — draait op de achtergrond en plaatst het resultaat zodra het klaar is.
  </Card>
  <Card title="Muziek genereren" href="/nl/tools/music-generation" icon="music">
    Genereer muziek of audiotracks via `music_generate`. Asynchroon in
    chatsessies op de gedeelde taaklevenscyclus voor mediageneratie.
  </Card>
  <Card title="Tekst-naar-spraak" href="/nl/tools/tts" icon="microphone">
    Zet uitgaande antwoorden om naar gesproken audio via de tool `tts` plus
    de configuratie `messages.tts`. Synchroon.
  </Card>
  <Card title="Mediabegrip" href="/nl/nodes/media-understanding" icon="eye">
    Vat inkomende afbeeldingen, audio en video samen met modelproviders die
    vision ondersteunen en speciale plugins voor mediabegrip.
  </Card>
  <Card title="Spraak-naar-tekst" href="/nl/nodes/audio" icon="ear-listen">
    Transcribeer inkomende spraakberichten via batch-STT of streaming-STT-providers
    voor Spraakoproepen.
  </Card>
</CardGroup>

## Matrix met providermogelijkheden

| Provider          | Afbeelding | Video | Muziek | TTS | STT | Realtime spraak | Mediabegrip |
| ----------------- | :--------: | :---: | :----: | :-: | :-: | :-------------: | :---------: |
| Alibaba           |            |   ✓   |        |     |     |                 |             |
| BytePlus          |            |   ✓   |        |     |     |                 |             |
| ComfyUI           |     ✓      |   ✓   |   ✓    |     |     |                 |             |
| DeepInfra         |     ✓      |   ✓   |        |  ✓  |  ✓  |                 |      ✓      |
| Deepgram          |            |       |        |     |  ✓  |        ✓        |             |
| ElevenLabs        |            |       |        |  ✓  |  ✓  |                 |             |
| fal               |     ✓      |   ✓   |   ✓    |     |     |                 |             |
| Google            |     ✓      |   ✓   |   ✓    |  ✓  |     |        ✓        |      ✓      |
| Gradium           |            |       |        |  ✓  |     |                 |             |
| Local CLI         |            |       |        |  ✓  |     |                 |             |
| Microsoft         |            |       |        |  ✓  |     |                 |             |
| Microsoft Foundry |     ✓      |       |        |     |     |                 |             |
| MiniMax           |     ✓      |   ✓   |   ✓    |  ✓  |     |                 |             |
| Mistral           |            |       |        |     |  ✓  |                 |             |
| OpenAI            |     ✓      |   ✓   |        |  ✓  |  ✓  |        ✓        |      ✓      |
| OpenRouter        |     ✓      |   ✓   |   ✓    |  ✓  |  ✓  |                 |      ✓      |
| Qwen              |            |   ✓   |        |     |     |                 |             |
| Runway            |            |   ✓   |        |     |     |                 |             |
| SenseAudio        |            |       |        |     |  ✓  |                 |             |
| Together          |            |   ✓   |        |     |     |                 |             |
| Vydra             |     ✓      |   ✓   |        |  ✓  |     |                 |             |
| xAI               |     ✓      |   ✓   |        |  ✓  |  ✓  |                 |      ✓      |
| Xiaomi MiMo       |     ✓      |       |        |  ✓  |     |                 |      ✓      |

<Note>
Mediabegrip gebruikt elk vision-geschikt of audio-geschikt model dat in
je providerconfiguratie is geregistreerd. De matrix hierboven vermeldt providers met
speciale ondersteuning voor mediabegrip; de meeste multimodale LLM-providers
(Anthropic, Google, OpenAI, enz.) kunnen ook inkomende media begrijpen wanneer ze zijn
geconfigureerd als het actieve antwoordmodel.
</Note>

## Asynchroon versus synchroon

| Mogelijkheid    | Modus        | Waarom                                                                                               |
| --------------- | ------------ | ---------------------------------------------------------------------------------------------------- |
| Afbeelding      | Asynchroon   | Providerverwerking kan langer duren dan een chatbeurt; gegenereerde bijlagen gebruiken het gedeelde voltooiingspad. |
| Tekst-naar-spraak | Synchroon  | Providerantwoorden komen binnen enkele seconden terug; gekoppeld aan de antwoordaudio.               |
| Video           | Asynchroon   | Providerverwerking duurt 30 s tot enkele minuten; trage wachtrijen kunnen doorlopen tot de geconfigureerde time-out. |
| Muziek          | Asynchroon   | Dezelfde providerverwerkingskenmerken als video.                                                     |

Voor asynchrone tools dient OpenClaw de aanvraag in bij de provider, retourneert
direct een taak-id en volgt de job in het taakregister. De agent blijft
op andere berichten reageren terwijl de job draait. Wanneer de provider klaar is,
wekt OpenClaw de agent met de gegenereerde mediapaden, zodat die de gebruiker
kan informeren via de normale zichtbare-antwoordmodus van de sessie: automatische
levering van het definitieve antwoord wanneer geconfigureerd, of `message(action="send")`
wanneer de sessie de berichttool vereist. Als de sessie van de aanvrager inactief is
of de actieve wake mislukt, en er nog gegenereerde media ontbreken in het
voltooiingsantwoord, stuurt OpenClaw een idempotente directe fallback met alleen
de ontbrekende media. Media die al door het voltooiingsantwoord zijn geleverd,
worden niet opnieuw geplaatst.

## Spraak-naar-tekst en Spraakoproep

Deepgram, DeepInfra, ElevenLabs, Mistral, OpenAI, OpenRouter, SenseAudio en xAI kunnen allemaal
inkomende audio transcriberen via het batchpad `tools.media.audio` wanneer ze zijn geconfigureerd.
Kanaalplugins die vooraf een spraaknotitie controleren voor vermeldingsgating of
commando-parsering markeren de getranscribeerde bijlage op de inkomende context, zodat de gedeelde
mediabegripspass die transcriptie hergebruikt in plaats van een tweede
STT-aanroep te doen voor dezelfde audio.

Deepgram, ElevenLabs, Mistral, OpenAI en xAI registreren ook streaming-STT-providers
voor Spraakoproepen, zodat live telefoonaudio naar de geselecteerde leverancier kan worden doorgestuurd
zonder te wachten op een voltooide opname.

Gebruik voor live gebruikersgesprekken bij voorkeur [Talk-modus](/nl/nodes/talk). Batch-audiobijlagen
blijven op het mediapad; browser-realtime, native push-to-talk,
telefonie en vergaderaudio moeten Talk-events en de sessiegebonden
catalogi gebruiken die door de Gateway worden geretourneerd.

## Providertoewijzingen (hoe leveranciers over oppervlakken zijn verdeeld)

<AccordionGroup>
  <Accordion title="Google">
    Oppervlakken voor afbeeldingen, video, muziek, batch-TTS, backend-realtime spraak en
    mediabegrip.
  </Accordion>
  <Accordion title="OpenAI">
    Oppervlakken voor afbeeldingen, video, batch-TTS, batch-STT, streaming-STT voor Spraakoproepen,
    backend-realtime spraak en geheugen-embeddings.
  </Accordion>
  <Accordion title="DeepInfra">
    Chat-/modelroutering, afbeeldingen genereren/bewerken, tekst-naar-video, batch-TTS,
    batch-STT, mediabegrip voor afbeeldingen en geheugen-embeddings.
    DeepInfra-native modellen voor reranking/classificatie/objectdetectie worden pas
    geregistreerd wanneer OpenClaw speciale providercontracten voor die
    categorieën heeft.
  </Accordion>
  <Accordion title="xAI">
    Afbeeldingen, video, zoeken, code-uitvoering, batch-TTS, batch-STT en streaming-STT
    voor Spraakoproepen. xAI Realtime spraak is een upstreammogelijkheid, maar wordt
    niet in OpenClaw geregistreerd totdat het gedeelde contract voor realtime spraak dit
    kan vertegenwoordigen.
  </Accordion>
</AccordionGroup>

## Gerelateerd

- [Afbeeldingen genereren](/nl/tools/image-generation)
- [Video genereren](/nl/tools/video-generation)
- [Muziek genereren](/nl/tools/music-generation)
- [Tekst-naar-spraak](/nl/tools/tts)
- [Mediabegrip](/nl/nodes/media-understanding)
- [Audioknooppunten](/nl/nodes/audio)
- [Talk-modus](/nl/nodes/talk)
