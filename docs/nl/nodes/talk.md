---
read_when:
    - Talk-modus implementeren op macOS/iOS/Android
    - Spraak-/TTS-/onderbrekingsgedrag wijzigen
summary: 'Praatmodus: doorlopende spraakgesprekken met geconfigureerde TTS-providers'
title: Praatmodus
x-i18n:
    generated_at: "2026-04-29T22:57:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: afdddaa81c0a09076eaeeafd25295b0c02681f03b273ec4afe4ea2afa692dc2a
    source_path: nodes/talk.md
    workflow: 16
---

De Talk-modus is een continue spraakgesprekslus:

1. Luister naar spraak
2. Stuur transcript naar het model (hoofdsessie, chat.send)
3. Wacht op het antwoord
4. Spreek het uit via de geconfigureerde Talk-provider (`talk.speak`)

## Gedrag (macOS)

- **Altijd-zichtbare overlay** terwijl de Talk-modus is ingeschakeld.
- **Luisteren → Denken → Spreken**-faseovergangen.
- Bij een **korte pauze** (stiltevenster) wordt het huidige transcript verzonden.
- Antwoorden worden **naar WebChat geschreven** (hetzelfde als typen).
- **Onderbreken bij spraak** (standaard aan): als de gebruiker begint te praten terwijl de assistent spreekt, stoppen we het afspelen en noteren we het tijdstip van de onderbreking voor de volgende prompt.

## Spraakinstructies in antwoorden

De assistent kan het antwoord vooraf laten gaan door een **enkele JSON-regel** om spraak te regelen:

```json
{ "voice": "<voice-id>", "once": true }
```

Regels:

- Alleen de eerste niet-lege regel.
- Onbekende sleutels worden genegeerd.
- `once: true` geldt alleen voor het huidige antwoord.
- Zonder `once` wordt de stem de nieuwe standaard voor de Talk-modus.
- De JSON-regel wordt verwijderd vóór TTS-weergave.

Ondersteunde sleutels:

- `voice` / `voice_id` / `voiceId`
- `model` / `model_id` / `modelId`
- `speed`, `rate` (WPM), `stability`, `similarity`, `style`, `speakerBoost`
- `seed`, `normalize`, `lang`, `output_format`, `latency_tier`
- `once`

## Configuratie (`~/.openclaw/openclaw.json`)

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
      mlx: {
        modelId: "mlx-community/Soprano-80M-bf16",
      },
      system: {},
    },
    speechLocale: "ru-RU",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

Standaarden:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: wanneer niet ingesteld, behoudt Talk het standaard pauzevenster van het platform voordat het transcript wordt verzonden (`700 ms op macOS en Android, 900 ms op iOS`)
- `provider`: selecteert de actieve Talk-provider. Gebruik `elevenlabs`, `mlx` of `system` voor de macOS-lokale afspeelpaden.
- `providers.<provider>.voiceId`: valt terug op `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` voor ElevenLabs (of de eerste ElevenLabs-stem wanneer een API-sleutel beschikbaar is).
- `providers.elevenlabs.modelId`: standaard `eleven_v3` wanneer niet ingesteld.
- `providers.mlx.modelId`: standaard `mlx-community/Soprano-80M-bf16` wanneer niet ingesteld.
- `providers.elevenlabs.apiKey`: valt terug op `ELEVENLABS_API_KEY` (of het Gateway-shellprofiel indien beschikbaar).
- `speechLocale`: optionele BCP 47-locale-id voor spraakherkenning op het apparaat voor Talk op iOS/macOS. Laat niet ingesteld om de apparaatstandaard te gebruiken.
- `outputFormat`: standaard `pcm_44100` op macOS/iOS en `pcm_24000` op Android (stel `mp3_*` in om MP3-streaming af te dwingen)

## macOS-UI

- Menubalkschakelaar: **Talk**
- Configuratietabblad: groep **Talk-modus** (stem-id + onderbrekingsschakelaar)
- Overlay:
  - **Luisteren**: wolk pulseert met microfoonniveau
  - **Denken**: zakkende animatie
  - **Spreken**: uitstralende ringen
  - Klik op wolk: stoppen met spreken
  - Klik op X: Talk-modus afsluiten

## Android-UI

- Schakelaar op spraaktabblad: **Talk**
- Handmatige **Mic** en **Talk** zijn wederzijds exclusieve runtime-opnamemodi.
- Handmatige Mic stopt wanneer de app de voorgrond verlaat of de gebruiker het spraaktabblad verlaat.
- Talk-modus blijft actief totdat deze wordt uitgeschakeld of de Android-node de verbinding verbreekt, en gebruikt Androids microfoon-foreground-service-type terwijl deze actief is.

## Opmerkingen

- Vereist machtigingen voor Spraak + Microfoon.
- Gebruikt `chat.send` met sessiesleutel `main`.
- De Gateway lost Talk-afspelen op via `talk.speak` met de actieve Talk-provider. Android valt alleen terug op lokale systeem-TTS wanneer die RPC niet beschikbaar is.
- macOS-lokale MLX-weergave gebruikt de gebundelde `openclaw-mlx-tts`-helper wanneer aanwezig, of een uitvoerbaar bestand op `PATH`. Stel `OPENCLAW_MLX_TTS_BIN` in om tijdens ontwikkeling naar een aangepast helperbinair bestand te wijzen.
- `stability` voor `eleven_v3` wordt gevalideerd als `0.0`, `0.5` of `1.0`; andere modellen accepteren `0..1`.
- `latency_tier` wordt gevalideerd als `0..4` wanneer ingesteld.
- Android ondersteunt `pcm_16000`, `pcm_22050`, `pcm_24000` en `pcm_44100`-uitvoerformaten voor AudioTrack-streaming met lage latentie.

## Gerelateerd

- [Spraakactivering](/nl/nodes/voicewake)
- [Audio en spraaknotities](/nl/nodes/audio)
- [Mediabegrip](/nl/nodes/media-understanding)
