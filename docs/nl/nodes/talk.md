---
read_when:
    - Talk-modus implementeren op macOS/iOS/Android
    - Stem-/TTS-/onderbrekingsgedrag wijzigen
summary: 'Spraakmodus: doorlopende spraakgesprekken via lokale STT/TTS en realtime-spraak'
title: Praatmodus
x-i18n:
    generated_at: "2026-05-06T09:21:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: a04304a1dd6c3feefa89c0c8c66f8026a7d28b573776fcf14237c3481fbc772a
    source_path: nodes/talk.md
    workflow: 16
---

Talk-modus heeft twee runtime-vormen:

- Native macOS/iOS/Android Talk gebruikt lokale spraakherkenning, Gateway-chat en `talk.speak` TTS. Nodes adverteren de `talk`-capability en declareren de `talk.*`-commando's die ze ondersteunen.
- Browser-Talk gebruikt `talk.client.create` voor client-eigen `webrtc`- en `provider-websocket`-sessies, of `talk.session.create` voor Gateway-eigen `gateway-relay`-sessies. `managed-room` is gereserveerd voor Gateway-overdracht en walkie-talkie-ruimtes.
- Clients voor alleen transcriptie gebruiken `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`, daarna `talk.session.appendAudio`, `talk.session.cancelTurn` en `talk.session.close` wanneer ze ondertitels of dicteren nodig hebben zonder gesproken assistentantwoord.

Native Talk is een doorlopende spraakgesprekslus:

1. Luisteren naar spraak
2. Transcript naar het model sturen via de actieve sessie
3. Wachten op het antwoord
4. Het uitspreken via de geconfigureerde Talk-provider (`talk.speak`)

Realtime Talk in de browser stuurt provider-toolaanroepen door via `talk.client.toolCall`; browserclients roepen `chat.send` niet rechtstreeks aan voor realtime-consults.

Talk voor alleen transcriptie emit dezelfde gemeenschappelijke Talk-eventenvelop als realtime- en STT/TTS-sessies, maar gebruikt `mode: "transcription"` en `brain: "none"`. Het is bedoeld voor ondertitels, dicteren en alleen-observerende spraakopname; eenmalig geüploade spraaknotities gebruiken nog steeds het media/audio-pad.

## Gedrag (macOS)

- **Altijd-actieve overlay** terwijl Talk-modus is ingeschakeld.
- **Luisteren → Denken → Spreken** faseovergangen.
- Bij een **korte pauze** (stiltevenster) wordt het huidige transcript verzonden.
- Antwoorden worden **naar WebChat geschreven** (hetzelfde als typen).
- **Onderbreken bij spraak** (standaard aan): als de gebruiker begint te praten terwijl de assistent spreekt, stoppen we het afspelen en noteren we de onderbrekingstijdstempel voor de volgende prompt.

## Spraakdirectieven in antwoorden

De assistent mag zijn antwoord vooraf laten gaan door een **enkele JSON-regel** om de stem te regelen:

```json
{ "voice": "<voice-id>", "once": true }
```

Regels:

- Alleen de eerste niet-lege regel.
- Onbekende sleutels worden genegeerd.
- `once: true` geldt alleen voor het huidige antwoord.
- Zonder `once` wordt de stem de nieuwe standaard voor Talk-modus.
- De JSON-regel wordt verwijderd vóór TTS-afspelen.

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
    realtime: {
      provider: "openai",
      providers: {
        openai: {
          apiKey: "openai_api_key",
          model: "gpt-realtime",
          voice: "alloy",
        },
      },
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

Standaarden:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: wanneer niet ingesteld, behoudt Talk het standaard pauzevenster van het platform voordat het transcript wordt verzonden (`700 ms on macOS and Android, 900 ms on iOS`)
- `provider`: selecteert de actieve Talk-provider. Gebruik `elevenlabs`, `mlx` of `system` voor de macOS-lokale afspeelpaden.
- `providers.<provider>.voiceId`: valt terug op `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` voor ElevenLabs (of de eerste ElevenLabs-stem wanneer een API-sleutel beschikbaar is).
- `providers.elevenlabs.modelId`: standaard `eleven_v3` wanneer niet ingesteld.
- `providers.mlx.modelId`: standaard `mlx-community/Soprano-80M-bf16` wanneer niet ingesteld.
- `providers.elevenlabs.apiKey`: valt terug op `ELEVENLABS_API_KEY` (of het Gateway-shellprofiel als dat beschikbaar is).
- `realtime.provider`: selecteert de actieve realtime spraakprovider voor browser/server. Gebruik `openai` voor WebRTC, `google` voor provider-WebSocket, of een bridge-only provider via Gateway-relay.
- `realtime.providers.<provider>` slaat provider-eigen realtime-configuratie op. De browser ontvangt alleen tijdelijke of beperkte sessiereferenties, nooit een standaard API-sleutel.
- `realtime.brain`: `agent-consult` routeert realtime-toolaanroepen via Gateway-beleid; `direct-tools` is compatibiliteitsgedrag alleen voor de eigenaar; `none` is voor transcriptie of externe orkestratie.
- `talk.catalog` toont de geldige modi, transports, brain-strategieën, realtime-audioformaten en capability-vlaggen van elke provider, zodat first-party Talk-clients niet-ondersteunde combinaties kunnen vermijden.
- Streaming-transcriptieproviders worden ontdekt via `talk.catalog.transcription`. De huidige Gateway-relay gebruikt de configuratie van de Voice Call-streamingprovider totdat het dedicated configuratieoppervlak voor Talk-transcriptie wordt toegevoegd.
- `speechLocale`: optionele BCP 47-locale-id voor on-device Talk-spraakherkenning op iOS/macOS. Laat niet ingesteld om de apparaatstandaard te gebruiken.
- `outputFormat`: standaard `pcm_44100` op macOS/iOS en `pcm_24000` op Android (stel `mp3_*` in om MP3-streaming af te dwingen)

## macOS-UI

- Menubalkschakelaar: **Talk**
- Configuratietabblad: groep **Talk-modus** (spraak-id + onderbrekingsschakelaar)
- Overlay:
  - **Luisteren**: wolk pulseert met microfoonniveau
  - **Denken**: zinkende animatie
  - **Spreken**: uitstralende ringen
  - Klik op wolk: stoppen met spreken
  - Klik op X: Talk-modus afsluiten

## Android-UI

- Schakelaar op tabblad Spraak: **Talk**
- Handmatige **Microfoon** en **Talk** zijn runtime-opnamemodi die elkaar uitsluiten.
- Handmatige microfoon stopt wanneer de app de voorgrond verlaat of de gebruiker het tabblad Spraak verlaat.
- Talk-modus blijft draaien totdat deze wordt uitgeschakeld of de Android-Node de verbinding verbreekt, en gebruikt het foreground-service-type voor de microfoon van Android terwijl deze actief is.

## Notities

- Vereist machtigingen voor Spraak + Microfoon.
- Native Talk gebruikt de actieve Gateway-sessie en valt alleen terug op geschiedenis-polling wanneer antwoord-events niet beschikbaar zijn.
- Browser-realtime Talk gebruikt `talk.client.toolCall` voor `openclaw_agent_consult` in plaats van `chat.send` bloot te stellen aan provider-eigen browsersessies.
- Talk voor alleen transcriptie gebruikt `talk.session.create`, `talk.session.appendAudio`, `talk.session.cancelTurn` en `talk.session.close`; clients abonneren zich op `talk.event` voor gedeeltelijke/definitieve transcriptupdates.
- De Gateway lost Talk-afspelen op via `talk.speak` met de actieve Talk-provider. Android valt alleen terug op lokale systeem-TTS wanneer die RPC niet beschikbaar is.
- macOS-lokaal MLX-afspelen gebruikt de gebundelde `openclaw-mlx-tts`-helper wanneer aanwezig, of een uitvoerbaar bestand op `PATH`. Stel `OPENCLAW_MLX_TTS_BIN` in om tijdens ontwikkeling naar een aangepaste helper-binary te verwijzen.
- `stability` voor `eleven_v3` wordt gevalideerd op `0.0`, `0.5` of `1.0`; andere modellen accepteren `0..1`.
- `latency_tier` wordt gevalideerd op `0..4` wanneer ingesteld.
- Android ondersteunt de uitvoerformaten `pcm_16000`, `pcm_22050`, `pcm_24000` en `pcm_44100` voor low-latency AudioTrack-streaming.

## Gerelateerd

- [Voice wake](/nl/nodes/voicewake)
- [Audio en spraaknotities](/nl/nodes/audio)
- [Media-begrip](/nl/nodes/media-understanding)
