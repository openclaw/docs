---
read_when:
    - Op zoek naar een overzicht van de mediamogelijkheden van OpenClaw
    - Bepalen welke mediaprovider u wilt configureren
    - Begrijpen hoe asynchrone mediageneratie werkt
sidebarTitle: Media overview
summary: Mogelijkheden voor afbeeldingen, video, muziek, spraak en mediabegrip in één oogopslag
title: Mediaoverzicht
x-i18n:
    generated_at: "2026-07-12T09:23:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f7d7bf8bd2052cdba088d7a612bb89b0fc3a95b3635c7fcd2138eb731121b85f
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw genereert afbeeldingen, video's en muziek, begrijpt inkomende media
(afbeeldingen, audio, video) en spreekt antwoorden hardop uit met tekst-naar-spraak. Alle
mediamogelijkheden worden via tools aangestuurd: de agent bepaalt op basis
van het gesprek wanneer deze worden gebruikt en elke tool verschijnt alleen wanneer ten minste één
onderliggende provider is geconfigureerd.

Live spraak gebruikt het Talk-sessiecontract in plaats van het pad voor eenmalige mediatools.
Talk heeft drie modi: provider-native `realtime`, lokale of streamende
`stt-tts` en `transcription` voor het uitsluitend observerend vastleggen van spraak. Deze modi
delen providercatalogi, gebeurtenisenveloppen en annuleringssemantiek met
telefonie, vergaderingen, browser-realtime en native push-to-talk-clients.

## Mogelijkheden

<CardGroup cols={2}>
  <Card title="Afbeeldingen genereren" href="/nl/tools/image-generation" icon="image">
    Maak en bewerk afbeeldingen op basis van tekstprompts of referentieafbeeldingen via
    `image_generate`. Asynchroon in chatsessies — wordt op de achtergrond uitgevoerd en
    plaatst het resultaat wanneer het gereed is.
  </Card>
  <Card title="Video's genereren" href="/nl/tools/video-generation" icon="video">
    Tekst-naar-video, afbeelding-naar-video en video-naar-video via `video_generate`.
    Asynchroon — wordt op de achtergrond uitgevoerd en plaatst het resultaat wanneer het gereed is.
  </Card>
  <Card title="Muziek genereren" href="/nl/tools/music-generation" icon="music">
    Genereer muziek of audiotracks via `music_generate`. Asynchroon in
    chatsessies binnen de gedeelde taaklevenscyclus voor mediageneratie.
  </Card>
  <Card title="Tekst-naar-spraak" href="/nl/tools/tts" icon="microphone">
    Zet uitgaande antwoorden om in gesproken audio via de tool `tts` en de
    configuratie `messages.tts`. Synchroon.
  </Card>
  <Card title="Mediabegrip" href="/nl/nodes/media-understanding" icon="eye">
    Vat inkomende afbeeldingen, audio en video samen met modelproviders
    die beeld ondersteunen en speciale plugins voor mediabegrip.
  </Card>
  <Card title="Spraak-naar-tekst" href="/nl/nodes/audio" icon="ear-listen">
    Transcribeer inkomende spraakberichten via batch-STT of providers voor
    streamende STT van Voice Call.
  </Card>
</CardGroup>

## Mogelijkhedenmatrix voor providers

<Note>
Deze tabel behandelt de speciale plugins voor mediageneratie, TTS en STT. Veel
providers van chatmodellen (Anthropic, Google, OpenAI en andere) begrijpen
inkomende media ook via hun antwoordmodel; bekijk de volledige providerlijst in
[Mediabegrip](/nl/nodes/media-understanding#provider-support-matrix).
</Note>

| Provider          | Afbeelding | Video | Muziek | TTS | STT | Realtime spraak | Mediabegrip |
| ----------------- | :--------: | :---: | :----: | :-: | :-: | :-------------: | :---------: |
| Alibaba           |            |   ✓   |        |     |     |                 |             |
| Azure Speech      |            |       |        |  ✓  |     |                 |             |
| BytePlus          |            |   ✓   |        |     |     |                 |             |
| ComfyUI           |     ✓      |   ✓   |   ✓    |     |     |                 |             |
| Deepgram          |            |       |        |     |  ✓  |                 |             |
| DeepInfra         |     ✓      |   ✓   |        |  ✓  |  ✓  |                 |      ✓      |
| ElevenLabs        |            |       |        |  ✓  |  ✓  |                 |             |
| fal               |     ✓      |   ✓   |   ✓    |     |     |                 |             |
| Google            |     ✓      |   ✓   |   ✓    |  ✓  |  ✓  |        ✓        |      ✓      |
| Gradium           |            |       |        |  ✓  |     |                 |             |
| Inworld           |            |       |        |  ✓  |     |                 |             |
| LiteLLM           |     ✓      |       |        |     |     |                 |             |
| Lokale CLI        |            |       |        |  ✓  |     |                 |             |
| Microsoft         |            |       |        |  ✓  |     |                 |             |
| Microsoft Foundry |     ✓      |       |        |     |     |                 |             |
| MiniMax           |     ✓      |   ✓   |   ✓    |  ✓  |     |                 |             |
| Mistral           |            |       |        |     |  ✓  |                 |             |
| OpenAI            |     ✓      |   ✓   |        |  ✓  |  ✓  |        ✓        |      ✓      |
| OpenRouter        |     ✓      |   ✓   |   ✓    |  ✓  |  ✓  |                 |      ✓      |
| PixVerse          |            |   ✓   |        |     |     |                 |             |
| Qwen              |            |   ✓   |        |     |     |                 |      ✓      |
| Runway            |            |   ✓   |        |     |     |                 |             |
| SenseAudio        |            |       |        |     |  ✓  |                 |             |
| Together          |            |   ✓   |        |     |     |                 |             |
| Volcengine        |            |       |        |  ✓  |     |                 |             |
| Vydra             |     ✓      |   ✓   |        |  ✓  |     |                 |             |
| xAI               |     ✓      |   ✓   |        |  ✓  |  ✓  |                 |      ✓      |
| Xiaomi MiMo       |            |       |        |  ✓  |     |                 |             |

<Note>
**Realtime spraak** betekent hier provider-native bidirectionele realtime (Talk-modus
`realtime`, bijvoorbeeld Gemini Live of de OpenAI Realtime API) — momenteel registreren alleen Google
en OpenAI dit. Deepgram, ElevenLabs, Mistral, OpenAI en xAI
registreren afzonderlijk streamende STT voor Voice Call (eenrichtingsaudio-naar-tekst); zie
[Spraak-naar-tekst en Voice Call](#speech-to-text-and-voice-call) hieronder.
Realtime spraak van xAI is een bovenstroomse mogelijkheid, maar wordt niet geregistreerd in
OpenClaw totdat het gedeelde contract voor realtime spraak deze kan vertegenwoordigen.
</Note>

## Asynchroon versus synchroon

| Mogelijkheid     | Modus        | Reden                                                                                                             |
| ---------------- | ------------ | ----------------------------------------------------------------------------------------------------------------- |
| Afbeelding       | Asynchroon   | Providerverwerking kan langer duren dan een chatbeurt; gegenereerde bijlagen gebruiken het gedeelde voltooiingspad. |
| Tekst-naar-spraak | Synchroon   | Providerantwoorden worden binnen enkele seconden geretourneerd en aan de audio van het antwoord toegevoegd.       |
| Video            | Asynchroon   | Providerverwerking duurt 30 s tot enkele minuten; trage wachtrijen kunnen tot de geconfigureerde time-out doorgaan. |
| Muziek           | Asynchroon   | Heeft dezelfde kenmerken voor providerverwerking als video.                                                       |

Voor asynchrone tools dient OpenClaw de aanvraag in bij de provider, retourneert het onmiddellijk
een taak-ID en volgt het de taak in het taakregister. De agent blijft
andere berichten beantwoorden terwijl de taak wordt uitgevoerd. Wanneer de provider klaar is,
wekt OpenClaw de agent met de paden van de gegenereerde media, zodat deze de
gebruiker via de normale zichtbare antwoordmodus van de sessie kan informeren: automatische bezorging
van het definitieve antwoord wanneer dit is geconfigureerd, of `message(action="send")` wanneer de sessie
de berichtentool vereist. Als de sessie van de aanvrager inactief is of het actief wekken
mislukt, en er nog gegenereerde media in het voltooiingsantwoord ontbreken,
stuurt OpenClaw een idempotente directe terugval met alleen de ontbrekende media. Media
die al via het voltooiingsantwoord zijn bezorgd, worden niet opnieuw geplaatst.

## Spraak-naar-tekst en Voice Call

Deepgram, DeepInfra, ElevenLabs, Google, Groq, Mistral, OpenAI, OpenRouter,
SenseAudio en xAI kunnen allemaal inkomende audio transcriberen via het batchpad
`tools.media.audio` wanneer dit is geconfigureerd. Kanaalplugins die vooraf een
spraaknotitie controleren voor vermeldingsfiltering of opdrachtanalyse markeren de getranscribeerde
bijlage in de inkomende context, zodat de gedeelde verwerking voor mediabegrip
dat transcript hergebruikt in plaats van een tweede STT-aanroep voor dezelfde
audio uit te voeren.

Deepgram, ElevenLabs, Mistral, OpenAI en xAI registreren ook providers voor
streamende STT van Voice Call, zodat live telefoonaudio naar de geselecteerde
leverancier kan worden doorgestuurd zonder op een voltooide opname te wachten.

Geef voor live gesprekken met gebruikers de voorkeur aan de [Talk-modus](/nl/nodes/talk). Batchaudio-
bijlagen blijven op het mediapad; browser-realtime, native push-to-talk,
telefonie en vergaderaudio moeten Talk-gebeurtenissen en de sessiegebonden
catalogi gebruiken die door de Gateway worden geretourneerd.

## Providertoewijzingen (hoe leveranciers over oppervlakken zijn verdeeld)

<AccordionGroup>
  <Accordion title="Google">
    Oppervlakken voor afbeeldingen, video, muziek, batch-TTS, batch-STT, realtime spraak
    in de backend en mediabegrip.
  </Accordion>
  <Accordion title="OpenAI">
    Oppervlakken voor afbeeldingen, video, batch-TTS, batch-STT, streamende STT voor Voice Call,
    realtime spraak in de backend en geheugeninsluitingen.
  </Accordion>
  <Accordion title="DeepInfra">
    Oppervlakken voor chat-/modelroutering, het genereren/bewerken van afbeeldingen, tekst-naar-video,
    batch-TTS, batch-STT, mediabegrip van afbeeldingen en geheugeninsluitingen.
    DeepInfra biedt ook herrangschikking, classificatie, objectdetectie en
    andere native modeltypen; OpenClaw heeft nog geen providercontract voor die
    categorieën, dus deze plugin registreert ze niet.
  </Accordion>
  <Accordion title="xAI">
    Afbeeldingen, video, zoeken, code-uitvoering, batch-TTS, batch-STT en streamende
    STT voor Voice Call. Realtime spraak van xAI is een bovenstroomse mogelijkheid, maar wordt
    niet geregistreerd in OpenClaw totdat het gedeelde contract voor realtime spraak deze kan
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
