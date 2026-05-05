---
read_when:
    - Op zoek naar een overzicht van de mediamogelijkheden van OpenClaw
    - Bepalen welke mediaprovider je wilt configureren
    - Begrijpen hoe asynchrone mediageneratie werkt
sidebarTitle: Media overview
summary: Mogelijkheden voor beeld, video, muziek, spraak en mediabegrip in één oogopslag
title: Mediaoverzicht
x-i18n:
    generated_at: "2026-05-05T06:19:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: fd02d4418fe294fda5f1437dd3a07c4aeb4de3b46a1b70bfe36914bc27123cc4
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw genereert afbeeldingen, video's en muziek, begrijpt inkomende media
(afbeeldingen, audio, video) en spreekt antwoorden hardop uit met tekst-naar-spraak. Alle
mediamogelijkheden zijn toolgestuurd: de agent beslist op basis van het
gesprek wanneer ze worden gebruikt, en elke tool verschijnt alleen wanneer er ten minste één
ondersteunende provider is geconfigureerd.

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
  <Card title="Media begrijpen" href="/nl/nodes/media-understanding" icon="eye">
    Vat inkomende afbeeldingen, audio en video samen met modelproviders
    met vision-mogelijkheden en speciale plugins voor mediabegrip.
  </Card>
  <Card title="Spraak-naar-tekst" href="/nl/nodes/audio" icon="ear-listen">
    Transcribeer inkomende spraakberichten via batch-STT of Voice Call
    streaming-STT-providers.
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
Mediabegrip gebruikt elk model met vision- of audiomogelijkheden dat in
je providerconfiguratie is geregistreerd. De bovenstaande matrix vermeldt providers met speciale
ondersteuning voor mediabegrip; de meeste multimodale LLM-providers (Anthropic, Google,
OpenAI, enz.) kunnen ook inkomende media begrijpen wanneer ze zijn geconfigureerd als het actieve
antwoordmodel.
</Note>

## Asynchroon versus synchroon

| Mogelijkheid       | Modus        | Waarom                                                                                                     |
| ------------------ | ------------ | ---------------------------------------------------------------------------------------------------------- |
| Afbeelding         | Synchroon    | Providerantwoorden komen binnen enkele seconden terug; wordt inline met het antwoord voltooid.              |
| Tekst-naar-spraak  | Synchroon    | Providerantwoorden komen binnen enkele seconden terug; toegevoegd aan de antwoordaudio.                     |
| Video              | Asynchroon   | Providerverwerking duurt 30 s tot enkele minuten; trage wachtrijen kunnen doorlopen tot de ingestelde time-out. |
| Muziek (gedeeld)   | Asynchroon   | Dezelfde verwerkingskenmerken bij de provider als video.                                                    |
| Muziek (ComfyUI)   | Synchroon    | Lokale workflow draait inline tegen de geconfigureerde ComfyUI-server.                                      |

Voor asynchrone tools dient OpenClaw de aanvraag in bij de provider, geeft onmiddellijk een taak-
id terug en volgt de taak in het taakregister. De agent blijft
op andere berichten reageren terwijl de taak draait. Wanneer de provider klaar is,
wekt OpenClaw de agent met de gegenereerde mediapaden zodat die de
gebruiker kan informeren en, wanneer vereist door het bronleveringsbeleid, het resultaat via
de berichtentool kan doorgeven. Voor groeps-/kanaalroutes die alleen via de berichtentool verlopen, behandelt OpenClaw
ontbrekend bewijs van levering via de berichtentool als een mislukte voltooiingspoging en stuurt
de gegenereerde mediafallback rechtstreeks naar het oorspronkelijke kanaal.

## Spraak-naar-tekst en Voice Call

Deepgram, DeepInfra, ElevenLabs, Mistral, OpenAI, SenseAudio en xAI kunnen allemaal
inkomende audio transcriberen via het batchpad `tools.media.audio` wanneer ze zijn geconfigureerd.
Kanaalplugins die een spraaknotitie vooraf controleren voor vermeldingsgating of opdracht-
parsing markeren de getranscribeerde bijlage op de inkomende context, zodat de gedeelde
mediabegripstap dat transcript hergebruikt in plaats van een tweede
STT-aanroep voor dezelfde audio te doen.

Deepgram, ElevenLabs, Mistral, OpenAI en xAI registreren ook Voice Call
streaming-STT-providers, zodat live telefoonaudio naar de geselecteerde
leverancier kan worden doorgestuurd zonder te wachten op een voltooide opname.

## Providertoewijzingen (hoe leveranciers over oppervlakken zijn verdeeld)

<AccordionGroup>
  <Accordion title="Google">
    Afbeelding, video, muziek, batch-TTS, realtime-spraak in de backend en
    mediabegrip-oppervlakken.
  </Accordion>
  <Accordion title="OpenAI">
    Afbeelding, video, batch-TTS, batch-STT, Voice Call streaming-STT, realtime-spraak in de backend
    en oppervlakken voor geheugen-embeddings.
  </Accordion>
  <Accordion title="DeepInfra">
    Chat-/modelroutering, afbeeldingen genereren/bewerken, tekst-naar-video, batch-TTS,
    batch-STT, mediabegrip voor afbeeldingen en oppervlakken voor geheugen-embeddings.
    DeepInfra-native modellen voor reranking/classificatie/objectdetectie worden niet
    geregistreerd totdat OpenClaw speciale providercontracten heeft voor die
    categorieën.
  </Accordion>
  <Accordion title="xAI">
    Afbeelding, video, zoeken, code-uitvoering, batch-TTS, batch-STT en Voice
    Call streaming-STT. xAI Realtime-spraak is een upstreammogelijkheid, maar wordt
    niet in OpenClaw geregistreerd totdat het gedeelde realtime-spraakcontract die kan
    weergeven.
  </Accordion>
</AccordionGroup>

## Gerelateerd

- [Afbeeldingen genereren](/nl/tools/image-generation)
- [Video genereren](/nl/tools/video-generation)
- [Muziek genereren](/nl/tools/music-generation)
- [Tekst-naar-spraak](/nl/tools/tts)
- [Media begrijpen](/nl/nodes/media-understanding)
- [Audionodes](/nl/nodes/audio)
