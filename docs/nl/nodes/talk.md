---
read_when:
    - Talk-modus implementeren op macOS/iOS/Android
    - Spraak-/TTS-/onderbrekingsgedrag wijzigen
summary: 'Praatmodus: doorlopende spraakgesprekken via lokale STT/TTS en realtime spraak'
title: Spreekmodus
x-i18n:
    generated_at: "2026-05-11T20:36:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 28e5feae8af8ff89472dfb73c44c590b2f7fab3c0ca335b67603c7fd9d50dfe7
    source_path: nodes/talk.md
    workflow: 16
---

De praatmodus heeft twee runtime-vormen:

- Native macOS/iOS/Android Talk gebruikt lokale spraakherkenning, Gateway-chat en `talk.speak` TTS. Nodes adverteren de `talk`-capability en declareren de `talk.*`-opdrachten die ze ondersteunen.
- Browser Talk gebruikt `talk.client.create` voor door de client beheerde `webrtc`- en `provider-websocket`-sessies, of `talk.session.create` voor door de Gateway beheerde `gateway-relay`-sessies. `managed-room` is gereserveerd voor Gateway-overdracht en walkietalkieruimtes.
- Clients voor alleen transcriptie gebruiken `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`, en daarna `talk.session.appendAudio`, `talk.session.cancelTurn` en `talk.session.close` wanneer ze ondertitels of dicteren nodig hebben zonder gesproken assistentantwoord.

Native Talk is een doorlopende spraakgesprekslus:

1. Luister naar spraak
2. Stuur het transcript via de actieve sessie naar het model
3. Wacht op het antwoord
4. Spreek het uit via de geconfigureerde Talk-provider (`talk.speak`)

Realtime Talk in de browser stuurt provider-toolaanroepen door via `talk.client.toolCall`; browserclients roepen `chat.send` niet rechtstreeks aan voor realtime consulten.

Talk voor alleen transcriptie emit dezelfde gemeenschappelijke Talk-eventenvelop als realtime- en STT/TTS-sessies, maar gebruikt `mode: "transcription"` en `brain: "none"`. Het is bedoeld voor ondertitels, dicteren en observe-only spraakopname; eenmalig geüploade spraaknotities blijven het media/audiopad gebruiken.

## Gedrag (macOS)

- **Altijd zichtbare overlay** terwijl de praatmodus is ingeschakeld.
- Faseovergangen **Luisteren → Denken → Spreken**.
- Bij een **korte pauze** (stiltevenster) wordt het huidige transcript verzonden.
- Antwoorden worden **naar WebChat geschreven** (hetzelfde als typen).
- **Onderbreken bij spraak** (standaard aan): als de gebruiker begint te praten terwijl de assistent spreekt, stoppen we het afspelen en noteren we de onderbrekingstijdstempel voor de volgende prompt.

## Spraakdirectieven in antwoorden

De assistent mag zijn antwoord vooraf laten gaan door een **enkele JSON-regel** om de stem te sturen:

```json
{ "voice": "<voice-id>", "once": true }
```

Regels:

- Alleen de eerste niet-lege regel.
- Onbekende keys worden genegeerd.
- `once: true` geldt alleen voor het huidige antwoord.
- Zonder `once` wordt de stem de nieuwe standaard voor de praatmodus.
- De JSON-regel wordt verwijderd vóór TTS-afspelen.

Ondersteunde keys:

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
          model: "gpt-realtime-2",
          voice: "cedar",
        },
      },
      instructions: "Speak warmly and keep answers brief.",
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

Standaarden:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: wanneer niet ingesteld, houdt Talk het standaard pauzevenster van het platform aan voordat het transcript wordt verzonden (`700 ms on macOS and Android, 900 ms on iOS`)
- `provider`: selecteert de actieve Talk-provider. Gebruik `elevenlabs`, `mlx` of `system` voor de lokale macOS-afspeelpaden.
- `providers.<provider>.voiceId`: valt terug op `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` voor ElevenLabs (of de eerste ElevenLabs-stem wanneer de API-key beschikbaar is).
- `providers.elevenlabs.modelId`: standaard `eleven_v3` wanneer niet ingesteld.
- `providers.mlx.modelId`: standaard `mlx-community/Soprano-80M-bf16` wanneer niet ingesteld.
- `providers.elevenlabs.apiKey`: valt terug op `ELEVENLABS_API_KEY` (of het gateway-shellprofiel indien beschikbaar).
- `consultThinkingLevel`: optionele override voor het denkniveau voor de volledige OpenClaw-agentrun achter realtime `openclaw_agent_consult`-aanroepen.
- `consultFastMode`: optionele fast-mode-override voor realtime `openclaw_agent_consult`-aanroepen.
- `realtime.provider`: selecteert de actieve realtime spraakprovider voor browser/server. Gebruik `openai` voor WebRTC, `google` voor provider WebSocket, of een bridge-only provider via Gateway-relay.
- `realtime.providers.<provider>` slaat realtime configuratie op die eigendom is van de provider. De browser ontvangt alleen tijdelijke of beperkte sessiereferenties, nooit een standaard API-key.
- `realtime.providers.openai.voice`: ingebouwde OpenAI Realtime voice-id. Huidige `gpt-realtime-2`-stemmen zijn `alloy`, `ash`, `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin` en `cedar`; `marin` en `cedar` worden aanbevolen voor de beste kwaliteit.
- `realtime.brain`: `agent-consult` routeert realtime toolaanroepen via Gateway-beleid; `direct-tools` is owner-only compatibiliteitsgedrag; `none` is voor transcriptie of externe orkestratie.
- `realtime.instructions`: voegt providergerichte systeeminstructies toe aan de ingebouwde realtime prompt van OpenClaw. Gebruik dit voor stemstijl en toon; OpenClaw behoudt de standaard `openclaw_agent_consult`-richtlijnen.
- `talk.catalog` stelt de geldige modi, transports, brain-strategieën, realtime audioformaten en capability-flags van elke provider beschikbaar, zodat first-party Talk-clients niet-ondersteunde combinaties kunnen vermijden.
- Streaming transcriptieproviders worden ontdekt via `talk.catalog.transcription`. De huidige Gateway-relay gebruikt de configuratie van de streamingprovider voor Voice Call totdat het speciale Talk-transcriptieconfiguratieoppervlak is toegevoegd.
- `speechLocale`: optionele BCP 47 locale-id voor on-device Talk-spraakherkenning op iOS/macOS. Laat dit niet ingesteld om de apparaatstandaard te gebruiken.
- `outputFormat`: standaard `pcm_44100` op macOS/iOS en `pcm_24000` op Android (stel `mp3_*` in om MP3-streaming af te dwingen)

## macOS-UI

- Menubalkschakelaar: **Praten**
- Configuratietabblad: groep **Praatmodus** (voice-id + onderbrekingsschakelaar)
- Overlay:
  - **Luisteren**: wolk pulseert met microfoonniveau
  - **Denken**: dalende animatie
  - **Spreken**: uitstralende ringen
  - Klik op wolk: stop met spreken
  - Klik op X: verlaat de praatmodus

## Android-UI

- Schakelaar op tabblad Spraak: **Praten**
- Handmatige **Mic** en **Talk** zijn runtime-opnamemodi die elkaar uitsluiten.
- Handmatige Mic stopt wanneer de app de voorgrond verlaat of de gebruiker het tabblad Spraak verlaat.
- Praatmodus blijft actief totdat deze wordt uitgeschakeld of de Android-Node wordt losgekoppeld, en gebruikt Androids foreground-service-type voor de microfoon terwijl deze actief is.

## Opmerkingen

- Vereist machtigingen voor Spraak + Microfoon.
- Native Talk gebruikt de actieve Gateway-sessie en valt alleen terug op history-polling wanneer responsevents niet beschikbaar zijn.
- Realtime Talk in de browser gebruikt `talk.client.toolCall` voor `openclaw_agent_consult` in plaats van `chat.send` bloot te stellen aan provider-owned browsersessies.
- Talk voor alleen transcriptie gebruikt `talk.session.create`, `talk.session.appendAudio`, `talk.session.cancelTurn` en `talk.session.close`; clients abonneren zich op `talk.event` voor gedeeltelijke/definitieve transcriptupdates.
- De gateway lost Talk-afspelen op via `talk.speak` met de actieve Talk-provider. Android valt alleen terug op lokale systeem-TTS wanneer die RPC niet beschikbaar is.
- Lokale MLX-weergave op macOS gebruikt de gebundelde `openclaw-mlx-tts`-helper wanneer aanwezig, of een executable op `PATH`. Stel `OPENCLAW_MLX_TTS_BIN` in om tijdens ontwikkeling naar een aangepaste helper-binary te wijzen.
- `stability` voor `eleven_v3` wordt gevalideerd op `0.0`, `0.5` of `1.0`; andere modellen accepteren `0..1`.
- `latency_tier` wordt gevalideerd op `0..4` wanneer ingesteld.
- Android ondersteunt de uitvoerformaten `pcm_16000`, `pcm_22050`, `pcm_24000` en `pcm_44100` voor low-latency AudioTrack-streaming.

## Gerelateerd

- [Spraakactivering](/nl/nodes/voicewake)
- [Audio en spraaknotities](/nl/nodes/audio)
- [Media-inzicht](/nl/nodes/media-understanding)
