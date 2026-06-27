---
read_when:
    - Talk-modus implementeren op macOS/iOS/Android
    - Spraak-/TTS-/onderbrekingsgedrag wijzigen
summary: 'Praatmodus: doorlopende spraakgesprekken via lokale STT/TTS en realtime spraak'
title: Praatmodus
x-i18n:
    generated_at: "2026-06-27T17:45:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 47ae6c1abc763688ab5bbea1c23c9f4f27fe2f4b13cfade61917f5a1a912f057
    source_path: nodes/talk.md
    workflow: 16
---

Talk-modus heeft twee runtime-vormen:

- Native macOS/iOS/Android Talk gebruikt lokale spraakherkenning, Gateway-chat en `talk.speak` TTS. Nodes adverteren de `talk`-capaciteit en declareren de `talk.*`-opdrachten die ze ondersteunen.
- Browser-Talk gebruikt `talk.client.create` voor door de client beheerde `webrtc`- en `provider-websocket`-sessies, of `talk.session.create` voor door de Gateway beheerde `gateway-relay`-sessies. `managed-room` is gereserveerd voor Gateway-overdracht en walkietalkiekamers.
- Android Talk kan kiezen voor door de Gateway beheerde realtime relay-sessies met `talk.realtime.mode: "realtime"` en `talk.realtime.transport: "gateway-relay"`. Anders blijft het lokale spraakherkenning, Gateway-chat en `talk.speak` gebruiken.
- Clients die alleen transcriberen gebruiken `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`, daarna `talk.session.appendAudio`, `talk.session.cancelTurn` en `talk.session.close` wanneer ze ondertitels of dicteren nodig hebben zonder gesproken assistentantwoord.

Native Talk is een doorlopende spraakgesprekslus:

1. Luister naar spraak
2. Stuur het transcript via de actieve sessie naar het model
3. Wacht op het antwoord
4. Spreek het uit via de geconfigureerde Talk-provider (`talk.speak`)

Browser-realtime Talk stuurt provider-toolaanroepen door via `talk.client.toolCall`; browserclients roepen `chat.send` niet rechtstreeks aan voor realtime consulten.
Terwijl een realtime consult actief is, kunnen Talk-clients `talk.client.steer` of
`talk.session.steer` gebruiken om gesproken invoer te classificeren als `status`, `steer`, `cancel` of
`followup`. Geaccepteerde sturing wordt in de actieve ingebedde run in de wachtrij gezet; geweigerde
sturing retourneert een gestructureerde reden zoals `no_active_run`, `not_streaming`,
of `compacting`.

Talk met alleen transcriptie emit dezelfde algemene Talk-eventenvelope als realtime- en STT/TTS-sessies, maar gebruikt `mode: "transcription"` en `brain: "none"`. Het is bedoeld voor ondertitels, dicteren en alleen observerende spraakopname; eenmalig geüploade spraaknotities blijven het media-/audiopad gebruiken.

## Gedrag (macOS)

- **Altijd-zichtbare overlay** terwijl Talk-modus is ingeschakeld.
- **Luisteren → Denken → Spreken** faseovergangen.
- Bij een **korte pauze** (stiltevenster) wordt het huidige transcript verzonden.
- Antwoorden worden **naar WebChat geschreven** (hetzelfde als typen).
- **Onderbreken bij spraak** (standaard aan): als de gebruiker begint te praten terwijl de assistent spreekt, stoppen we het afspelen en noteren we de onderbrekingstijdstempel voor de volgende prompt.

## Spraakdirectieven in antwoorden

De assistent kan zijn antwoord vooraf laten gaan door een **enkele JSON-regel** om spraak te sturen:

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
- `silenceTimeoutMs`: wanneer niet ingesteld, behoudt Talk het platformstandaard pauzevenster voordat het transcript wordt verzonden (`700 ms on macOS and Android, 900 ms on iOS`)
- `provider`: selecteert de actieve Talk-provider. Gebruik `elevenlabs`, `mlx` of `system` voor de macOS-lokale afspeelpaden.
- `providers.<provider>.voiceId`: valt terug op `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` voor ElevenLabs (of de eerste ElevenLabs-stem wanneer de API-sleutel beschikbaar is).
- `providers.elevenlabs.modelId`: standaard `eleven_v3` wanneer niet ingesteld.
- `providers.mlx.modelId`: standaard `mlx-community/Soprano-80M-bf16` wanneer niet ingesteld.
- `providers.elevenlabs.apiKey`: valt terug op `ELEVENLABS_API_KEY` (of het Gateway-shellprofiel indien beschikbaar).
- `consultThinkingLevel`: optionele override voor denkniveau voor de volledige OpenClaw-agentrun achter realtime `openclaw_agent_consult`-aanroepen.
- `consultFastMode`: optionele fast-mode-override voor realtime `openclaw_agent_consult`-aanroepen.
- `realtime.provider`: selecteert de actieve browser-/server-realtime-spraakprovider. Gebruik `openai` voor WebRTC, `google` voor provider-WebSocket, of een alleen-bridge-provider via Gateway-relay.
- `realtime.providers.<provider>` slaat realtime-configuratie op die eigendom is van de provider. De browser ontvangt alleen tijdelijke of beperkte sessiereferenties, nooit een standaard API-sleutel.
- `realtime.providers.openai.voice`: ingebouwde OpenAI Realtime-stem-id. Huidige `gpt-realtime-2`-stemmen zijn `alloy`, `ash`, `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin` en `cedar`; `marin` en `cedar` worden aanbevolen voor de beste kwaliteit.
- `realtime.transport`: `webrtc` en `provider-websocket` zijn browser-realtime-transports. Android gebruikt realtime relay alleen wanneer dit `gateway-relay` is; anders gebruikt Android Talk zijn native STT/TTS-lus.
- `realtime.brain`: `agent-consult` routeert realtime-toolaanroepen via Gateway-beleid; `direct-tools` is verouderd compatibiliteitsgedrag voor directe tools; `none` is voor transcriptie of externe orkestratie.
- `realtime.consultRouting`: `provider-direct` behoudt het directe antwoord van de provider wanneer deze `openclaw_agent_consult` overslaat; `force-agent-consult` laat Gateway-relay afgeronde gebruikerstranscripten in plaats daarvan via OpenClaw routeren.
- `realtime.instructions`: voegt providergerichte systeeminstructies toe aan de ingebouwde realtime-prompt van OpenClaw. Gebruik dit voor stemstijl en toon; OpenClaw behoudt de standaardbegeleiding voor `openclaw_agent_consult`.
- `talk.catalog` stelt de geldige modi, transports, brain-strategieën, realtime-audioformaten en capaciteitsvlaggen van elke provider beschikbaar, zodat first-party Talk-clients niet-ondersteunde combinaties kunnen vermijden.
- Streaming-transcriptieproviders worden ontdekt via `talk.catalog.transcription`. De huidige Gateway-relay gebruikt de streaming-providerconfiguratie van Voice Call totdat het specifieke Talk-transcriptieconfiguratieoppervlak is toegevoegd.
- `speechLocale`: optionele BCP 47-locale-id voor on-device Talk-spraakherkenning op iOS/macOS. Laat dit niet ingesteld om de apparaatstandaard te gebruiken.
- `outputFormat`: standaard `pcm_44100` op macOS/iOS en `pcm_24000` op Android (stel `mp3_*` in om MP3-streaming af te dwingen)

## macOS-UI

- Menubalkschakelaar: **Talk**
- Configuratietabblad: groep **Talk Mode** (stem-id + onderbrekingsschakelaar)
- Overlay:
  - **Luisteren**: wolk pulseert met microfoonniveau
  - **Denken**: zinkende animatie
  - **Spreken**: uitstralende ringen
  - Klik op wolk: stoppen met spreken
  - Klik op X: Talk-modus afsluiten

## Android-UI

- Schakelaar op spraaktabblad: **Talk**
- Handmatige **Mic** en **Talk** zijn runtime-opnamemodi die elkaar uitsluiten.
- Handmatige Mic stopt wanneer de app de voorgrond verlaat of de gebruiker het spraaktabblad verlaat.
- Talk Mode blijft draaien totdat deze wordt uitgeschakeld of de Android-node de verbinding verbreekt, en gebruikt Androids foreground-service-type voor de microfoon terwijl het actief is.

## Notities

- Vereist spraak- en microfoonmachtigingen.
- Native Talk gebruikt de actieve Gateway-sessie en valt alleen terug op geschiedenispolling wanneer antwoordevents niet beschikbaar zijn.
- Browser-realtime Talk gebruikt `talk.client.toolCall` voor `openclaw_agent_consult` in plaats van `chat.send` bloot te stellen aan provider-beheerde browsersessies.
- Talk met alleen transcriptie gebruikt `talk.session.create`, `talk.session.appendAudio`, `talk.session.cancelTurn` en `talk.session.close`; clients abonneren zich op `talk.event` voor gedeeltelijke/definitieve transcriptupdates.
- De Gateway lost Talk-afspelen op via `talk.speak` met de actieve Talk-provider. Android valt alleen terug op lokale systeem-TTS wanneer die RPC niet beschikbaar is.
- macOS-lokale MLX-weergave gebruikt de gebundelde `openclaw-mlx-tts`-helper wanneer aanwezig, of een uitvoerbaar bestand op `PATH`. Stel `OPENCLAW_MLX_TTS_BIN` in om tijdens ontwikkeling naar een aangepaste helper-binary te wijzen.
- `stability` voor `eleven_v3` wordt gevalideerd op `0.0`, `0.5` of `1.0`; andere modellen accepteren `0..1`.
- `latency_tier` wordt gevalideerd op `0..4` wanneer ingesteld.
- Android ondersteunt `pcm_16000`, `pcm_22050`, `pcm_24000` en `pcm_44100`-uitvoerformaten voor AudioTrack-streaming met lage latentie.

## Gerelateerd

- [Voice wake](/nl/nodes/voicewake)
- [Audio- en spraaknotities](/nl/nodes/audio)
- [Mediabegrip](/nl/nodes/media-understanding)
