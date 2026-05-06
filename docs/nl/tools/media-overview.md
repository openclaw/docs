---
read_when:
    - Op zoek naar een overzicht van de mediamogelijkheden van OpenClaw
    - Bepalen welke mediaprovider je configureert
    - Begrijpen hoe asynchrone mediageneratie werkt
sidebarTitle: Media overview
summary: Mogelijkheden voor beeld, video, muziek, spraak en mediabegrip in één oogopslag
title: Mediaoverzicht
x-i18n:
    generated_at: "2026-05-06T09:37:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 201d01244fc6a587b730ae3033de5990b2f01f63e6e40339c738c95040e085b3
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw genereert afbeeldingen, video's en muziek, begrijpt inkomende media
(afbeeldingen, audio, video) en spreekt antwoorden hardop uit met tekst-naar-spraak. Alle
mediamogelijkheden zijn toolgestuurd: de agent bepaalt op basis van
het gesprek wanneer ze worden gebruikt, en elke tool verschijnt alleen wanneer minstens één onderliggende
aanbieder is geconfigureerd.

Live spraak gebruikt het contract voor Talk-sessies in plaats van het pad voor een eenmalige mediatool.
Talk heeft drie modi: provider-native `realtime`, lokaal of streamend
`stt-tts`, en `transcription` voor alleen observerende spraakopname. Deze modi
delen aanbiedercatalogi, event-enveloppen en annuleringssemantiek met
telefonie, vergaderingen, browser-realtime en native push-to-talk-clients.

## Mogelijkheden

<CardGroup cols={2}>
  <Card title="Afbeeldingen genereren" href="/nl/tools/image-generation" icon="image">
    Maak en bewerk afbeeldingen vanuit tekstprompts of referentieafbeeldingen via
    `image_generate`. Synchroon — wordt inline met het antwoord voltooid.
  </Card>
  <Card title="Video's genereren" href="/nl/tools/video-generation" icon="video">
    Tekst-naar-video, afbeelding-naar-video en video-naar-video via `video_generate`.
    Asynchroon — draait op de achtergrond en plaatst het resultaat zodra het klaar is.
  </Card>
  <Card title="Muziek genereren" href="/nl/tools/music-generation" icon="music">
    Genereer muziek of audiotracks via `music_generate`. Asynchroon bij gedeelde
    aanbieders; het ComfyUI-workflowpad draait synchroon.
  </Card>
  <Card title="Tekst-naar-spraak" href="/nl/tools/tts" icon="microphone">
    Zet uitgaande antwoorden om naar gesproken audio via de `tts`-tool plus
    `messages.tts`-configuratie. Synchroon.
  </Card>
  <Card title="Mediabegrip" href="/nl/nodes/media-understanding" icon="eye">
    Vat inkomende afbeeldingen, audio en video samen met modelaanbieders
    met vision-mogelijkheden en speciale plugins voor mediabegrip.
  </Card>
  <Card title="Spraak-naar-tekst" href="/nl/nodes/audio" icon="ear-listen">
    Transcribeer inkomende spraakberichten via batch-STT of aanbieders voor
    streamende STT voor spraakoproepen.
  </Card>
</CardGroup>

## Mogelijkhedenmatrix per aanbieder

| Aanbieder   | Afbeelding | Video | Muziek | TTS | STT | Realtime spraak | Mediabegrip |
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
| Lokale CLI  |            |       |        |  ✓  |     |                 |             |
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
Mediabegrip gebruikt elk model met vision- of audiomogelijkheden dat is geregistreerd
in je providerconfiguratie. De matrix hierboven vermeldt aanbieders met speciale
ondersteuning voor mediabegrip; de meeste multimodale LLM-aanbieders (Anthropic, Google,
OpenAI, enz.) kunnen ook inkomende media begrijpen wanneer ze zijn geconfigureerd als het actieve
antwoordmodel.
</Note>

## Asynchroon versus synchroon

| Mogelijkheid       | Modus        | Waarom                                                                                                         |
| ------------------ | ------------ | -------------------------------------------------------------------------------------------------------------- |
| Afbeelding         | Synchroon    | Antwoorden van de aanbieder komen binnen enkele seconden terug; wordt inline met het antwoord voltooid.         |
| Tekst-naar-spraak  | Synchroon    | Antwoorden van de aanbieder komen binnen enkele seconden terug; gekoppeld aan de antwoordaudio.                 |
| Video              | Asynchroon   | Verwerking door de aanbieder duurt 30 s tot enkele minuten; trage wachtrijen kunnen doorlopen tot de geconfigureerde time-out. |
| Muziek (gedeeld)   | Asynchroon   | Dezelfde verwerkingskenmerken bij de aanbieder als video.                                                      |
| Muziek (ComfyUI)   | Synchroon    | Lokale workflow draait inline tegen de geconfigureerde ComfyUI-server.                                          |

Voor asynchrone tools dient OpenClaw de aanvraag in bij de aanbieder, retourneert onmiddellijk
een taak-id en volgt de taak in het taakregister. De agent blijft
reageren op andere berichten terwijl de taak draait. Wanneer de aanbieder klaar is,
wekt OpenClaw de agent met de gegenereerde mediapaden, zodat die de
gebruiker kan informeren en, wanneer vereist door het beleid voor bronlevering, het resultaat via
de berichttool kan doorgeven. Voor groeps-/kanaalroutes met alleen een berichttool behandelt OpenClaw
ontbrekend bewijs van levering via de berichttool als een mislukte voltooiingspoging en stuurt
de gegenereerde mediafallback rechtstreeks naar het oorspronkelijke kanaal.

## Spraak-naar-tekst en spraakoproep

Deepgram, DeepInfra, ElevenLabs, Mistral, OpenAI, SenseAudio en xAI kunnen allemaal
inkomende audio transcriberen via het batchpad `tools.media.audio` wanneer dit is geconfigureerd.
Kanaalplugins die een spraaknotitie vooraf controleren voor mention-gating of commandoparsing
markeren de getranscribeerde bijlage op de inkomende context, zodat de gedeelde
mediabegripstap dat transcript opnieuw gebruikt in plaats van een tweede
STT-aanroep voor dezelfde audio te doen.

Deepgram, ElevenLabs, Mistral, OpenAI en xAI registreren ook aanbieders voor
streamende STT voor spraakoproepen, zodat live telefoonaudio naar de geselecteerde
leverancier kan worden doorgestuurd zonder te wachten op een voltooide opname.

Voor live gebruikersgesprekken geef je de voorkeur aan [Talk-modus](/nl/nodes/talk). Batch-audiobijlagen
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
    Oppervlakken voor afbeeldingen, video, batch-TTS, batch-STT, streamende STT voor spraakoproepen,
    backend-realtime spraak en geheugen-embeddings.
  </Accordion>
  <Accordion title="DeepInfra">
    Oppervlakken voor chat-/modelroutering, afbeeldingen genereren/bewerken, tekst-naar-video,
    batch-TTS, batch-STT, mediabegrip voor afbeeldingen en geheugen-embeddings.
    DeepInfra-native modellen voor herordening/classificatie/objectdetectie worden niet
    geregistreerd totdat OpenClaw speciale providercontracten voor die
    categorieën heeft.
  </Accordion>
  <Accordion title="xAI">
    Afbeeldingen, video, zoeken, code-uitvoering, batch-TTS, batch-STT en streamende STT
    voor spraakoproepen. xAI Realtime spraak is een upstream-mogelijkheid, maar wordt
    niet geregistreerd in OpenClaw totdat het gedeelde contract voor realtime-spraak deze kan
    vertegenwoordigen.
  </Accordion>
</AccordionGroup>

## Gerelateerd

- [Afbeeldingen genereren](/nl/tools/image-generation)
- [Video's genereren](/nl/tools/video-generation)
- [Muziek genereren](/nl/tools/music-generation)
- [Tekst-naar-spraak](/nl/tools/tts)
- [Mediabegrip](/nl/nodes/media-understanding)
- [Audioknooppunten](/nl/nodes/audio)
- [Talk-modus](/nl/nodes/talk)
