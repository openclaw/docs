---
read_when:
    - Op zoek naar een overzicht van de mediamogelijkheden van OpenClaw
    - Bepalen welke mediaprovider moet worden geconfigureerd
    - Begrijpen hoe asynchrone mediageneratie werkt
sidebarTitle: Media overview
summary: Mogelijkheden voor beeld, video, muziek, spraak en mediabegrip in één oogopslag
title: Mediaoverzicht
x-i18n:
    generated_at: "2026-05-12T08:46:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: a7ca89d058467968ee140cb3318fe8a1fb96d09fe7c59982efce36eb9b714591
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw genereert afbeeldingen, video's en muziek, begrijpt inkomende media
(afbeeldingen, audio, video), en spreekt antwoorden hardop uit met tekst-naar-spraak. Alle
mediamogelijkheden zijn toolgestuurd: de agent beslist op basis van het
gesprek wanneer ze worden gebruikt, en elke tool verschijnt alleen wanneer er
minstens één achterliggende provider is geconfigureerd.

Live spraak gebruikt het Talk-sessiecontract in plaats van het eenmalige
mediatoolpad. Talk heeft drie modi: provider-native `realtime`, lokale of streamende
`stt-tts`, en `transcription` voor alleen-observerende spraakopname. Die modi
delen providercatalogi, event-enveloppen en annuleringssemantiek met
telefonie, vergaderingen, browser-realtime en native push-to-talk-clients.

## Mogelijkheden

<CardGroup cols={2}>
  <Card title="Afbeeldingen genereren" href="/nl/tools/image-generation" icon="image">
    Maak en bewerk afbeeldingen vanuit tekstprompts of referentieafbeeldingen via
    `image_generate`. Synchroon — wordt inline met het antwoord voltooid.
  </Card>
  <Card title="Video genereren" href="/nl/tools/video-generation" icon="video">
    Tekst-naar-video, afbeelding-naar-video en video-naar-video via `video_generate`.
    Asynchroon — draait op de achtergrond en plaatst het resultaat zodra het klaar is.
  </Card>
  <Card title="Muziek genereren" href="/nl/tools/music-generation" icon="music">
    Genereer muziek of audiotracks via `music_generate`. Asynchroon op gedeelde
    providers; het ComfyUI-workflowpad draait synchroon.
  </Card>
  <Card title="Tekst-naar-spraak" href="/nl/tools/tts" icon="microphone">
    Zet uitgaande antwoorden om naar gesproken audio via de `tts`-tool plus
    `messages.tts`-configuratie. Synchroon.
  </Card>
  <Card title="Mediabegrip" href="/nl/nodes/media-understanding" icon="eye">
    Vat inkomende afbeeldingen, audio en video samen met vision-capable
    modelproviders en speciale plugins voor mediabegrip.
  </Card>
  <Card title="Spraak-naar-tekst" href="/nl/nodes/audio" icon="ear-listen">
    Transcribeer inkomende spraakberichten via batch-STT of Voice Call
    streaming-STT-providers.
  </Card>
</CardGroup>

## Matrix met providermogelijkheden

| Provider    | Afbeelding | Video | Muziek | TTS | STT | Realtime spraak | Mediabegrip |
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
| OpenRouter  |     ✓      |   ✓   |        |  ✓  |  ✓  |                 |      ✓      |
| Qwen        |            |   ✓   |        |     |     |                 |             |
| Runway      |            |   ✓   |        |     |     |                 |             |
| SenseAudio  |            |       |        |     |  ✓  |                 |             |
| Together    |            |   ✓   |        |     |     |                 |             |
| Vydra       |     ✓      |   ✓   |        |  ✓  |     |                 |             |
| xAI         |     ✓      |   ✓   |        |  ✓  |  ✓  |                 |      ✓      |
| Xiaomi MiMo |     ✓      |       |        |  ✓  |     |                 |      ✓      |

<Note>
Mediabegrip gebruikt elk vision-capable of audio-capable model dat in je
providerconfiguratie is geregistreerd. De bovenstaande matrix vermeldt providers
met speciale ondersteuning voor mediabegrip; de meeste multimodale LLM-providers
(Anthropic, Google, OpenAI, enz.) kunnen ook inkomende media begrijpen wanneer
ze zijn geconfigureerd als het actieve antwoordmodel.
</Note>

## Asynchroon versus synchroon

| Mogelijkheid    | Modus        | Waarom                                                                                                  |
| --------------- | ------------ | ------------------------------------------------------------------------------------------------------- |
| Afbeelding      | Synchroon    | Providerantwoorden keren binnen seconden terug; wordt inline met het antwoord voltooid.                 |
| Tekst-naar-spraak | Synchroon  | Providerantwoorden keren binnen seconden terug; gekoppeld aan de antwoordaudio.                         |
| Video           | Asynchroon   | Providerverwerking duurt 30 s tot enkele minuten; trage wachtrijen kunnen doorlopen tot de geconfigureerde time-out. |
| Muziek (gedeeld) | Asynchroon  | Dezelfde providerverwerkingskarakteristiek als video.                                                   |
| Muziek (ComfyUI) | Synchroon   | Lokale workflow draait inline tegen de geconfigureerde ComfyUI-server.                                  |

Voor asynchrone tools dient OpenClaw de aanvraag in bij de provider, retourneert
direct een taak-id en volgt de job in het taaklogboek. De agent blijft
reageren op andere berichten terwijl de job draait. Wanneer de provider klaar is,
wekt OpenClaw de agent met de gegenereerde mediapaden zodat die de
gebruiker kan informeren en, wanneer vereist door het beleid voor bronlevering,
het resultaat via de berichttool kan doorgeven. Voor groeps-/kanaalroutes met
alleen berichttools behandelt OpenClaw ontbrekend bewijs van berichttoollevering
als een mislukte voltooiingspoging en verzendt het de gegenereerde mediafallback
rechtstreeks naar het oorspronkelijke kanaal.

## Spraak-naar-tekst en Voice Call

Deepgram, DeepInfra, ElevenLabs, Mistral, OpenAI, OpenRouter, SenseAudio en xAI kunnen allemaal
inkomende audio transcriberen via het batchpad `tools.media.audio` wanneer ze zijn geconfigureerd.
Kanaalplugins die een spraaknotitie vooraf controleren voor mention-gating of
commandoparsing markeren de getranscribeerde bijlage op de inkomende context,
zodat de gedeelde mediabegripspas dat transcript hergebruikt in plaats van een
tweede STT-aanroep te doen voor dezelfde audio.

Deepgram, ElevenLabs, Mistral, OpenAI en xAI registreren ook Voice Call
streaming-STT-providers, zodat live telefoonaudio kan worden doorgestuurd naar
de geselecteerde leverancier zonder te wachten op een voltooide opname.

Geef voor live gebruikersgesprekken de voorkeur aan [Talk-modus](/nl/nodes/talk). Batch-audiobijlagen
blijven op het mediapad; browser-realtime, native push-to-talk,
telefonie en vergaderaudio moeten Talk-events en de sessiegebonden
catalogi gebruiken die door de Gateway worden geretourneerd.

## Providermappings (hoe leveranciers oppervlakken verdelen)

<AccordionGroup>
  <Accordion title="Google">
    Oppervlakken voor afbeelding, video, muziek, batch-TTS, backend-realtime spraak en
    mediabegrip.
  </Accordion>
  <Accordion title="OpenAI">
    Oppervlakken voor afbeelding, video, batch-TTS, batch-STT, Voice Call streaming-STT,
    backend-realtime spraak en geheugenembeddings.
  </Accordion>
  <Accordion title="DeepInfra">
    Chat-/modelroutering, afbeeldingen genereren/bewerken, tekst-naar-video, batch-TTS,
    batch-STT, mediabegrip voor afbeeldingen en geheugenembeddings.
    DeepInfra-native modellen voor rerank/classificatie/objectdetectie worden niet
    geregistreerd totdat OpenClaw speciale providercontracten voor die
    categorieën heeft.
  </Accordion>
  <Accordion title="xAI">
    Afbeelding, video, zoeken, code-uitvoering, batch-TTS, batch-STT en Voice
    Call streaming-STT. xAI Realtime-spraak is een upstreammogelijkheid, maar is
    niet geregistreerd in OpenClaw totdat het gedeelde contract voor realtime-spraak
    dit kan weergeven.
  </Accordion>
</AccordionGroup>

## Gerelateerd

- [Afbeeldingen genereren](/nl/tools/image-generation)
- [Video genereren](/nl/tools/video-generation)
- [Muziek genereren](/nl/tools/music-generation)
- [Tekst-naar-spraak](/nl/tools/tts)
- [Mediabegrip](/nl/nodes/media-understanding)
- [Audionodes](/nl/nodes/audio)
- [Talk-modus](/nl/nodes/talk)
