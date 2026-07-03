---
read_when:
    - Talk-modus implementeren op macOS/iOS/Android
    - Gedrag voor stem/TTS/onderbreking wijzigen
summary: 'Praatmodus: doorlopende spraakgesprekken via lokale STT/TTS en realtime spraak'
title: Spreekmodus
x-i18n:
    generated_at: "2026-07-03T09:45:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f9c8cdb6ffef7575348e94b36cd73a0613c336d8e811d6ce46d7518ee7c34b14
    source_path: nodes/talk.md
    workflow: 16
---

Talk-modus heeft twee runtime-vormen:

- Native macOS/iOS/Android Talk gebruikt lokale spraakherkenning, Gateway-chat en `talk.speak` TTS. Nodes adverteren de `talk`-capability en declareren de `talk.*`-commando's die ze ondersteunen.
- iOS Talk gebruikt client-beheerde WebRTC voor OpenAI-realtimeconfiguraties die `webrtc` selecteren of het transport weglaten. Expliciete `gateway-relay`-, `provider-websocket`- en niet-OpenAI-realtimeconfiguraties blijven op de door Gateway beheerde relay; niet-realtimeconfiguraties gebruiken de native spraaklus.
- Browser Talk gebruikt `talk.client.create` voor client-beheerde `webrtc`- en `provider-websocket`-sessies, of `talk.session.create` voor door Gateway beheerde `gateway-relay`-sessies. `managed-room` is gereserveerd voor Gateway-overdracht en walkietalkie-ruimtes.
- Android Talk kan kiezen voor door Gateway beheerde realtime-relaysessies met `talk.realtime.mode: "realtime"` en `talk.realtime.transport: "gateway-relay"`. Anders blijft het op native spraakherkenning, Gateway-chat en `talk.speak`.
- Clients voor alleen transcriptie gebruiken `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`, en daarna `talk.session.appendAudio`, `talk.session.cancelTurn` en `talk.session.close` wanneer ze ondertitels of dicteren nodig hebben zonder gesproken assistentantwoord.

Native Talk is een doorlopende spraakgesprekslus:

1. Luisteren naar spraak
2. Transcript naar het model sturen via de actieve sessie
3. Wachten op het antwoord
4. Het uitspreken via de geconfigureerde Talk-provider (`talk.speak`)

Client-beheerde realtime Talk stuurt provider-toolcalls door via `talk.client.toolCall`; die clients roepen `chat.send` niet rechtstreeks aan voor realtime-consults.
Terwijl een realtime-consult actief is, kunnen Talk-clients `talk.client.steer` of
`talk.session.steer` gebruiken om gesproken invoer te classificeren als `status`, `steer`, `cancel` of
`followup`. Geaccepteerde sturing wordt in de actieve ingebedde run in de wachtrij gezet; afgewezen
sturing geeft een gestructureerde reden terug, zoals `no_active_run`, `not_streaming`
of `compacting`.

Talk voor alleen transcriptie emit dezelfde algemene Talk-eventenvelop als realtime- en STT/TTS-sessies, maar gebruikt `mode: "transcription"` en `brain: "none"`. Het is bedoeld voor ondertitels, dicteren en alleen observerende spraakopname; eenmalig geüploade spraaknotities gebruiken nog steeds het media-/audiopad.

## Gedrag (macOS)

- **Altijd actieve overlay** terwijl Talk-modus is ingeschakeld.
- **Luisteren → Denken → Spreken** faseovergangen.
- Bij een **korte pauze** (stiltevenster) wordt het huidige transcript verzonden.
- Antwoorden worden **naar WebChat geschreven** (hetzelfde als typen).
- **Onderbreken bij spraak** (standaard aan): als de gebruiker begint te praten terwijl de assistent spreekt, stoppen we het afspelen en noteren we de onderbrekingstijdstempel voor de volgende prompt.

## Spraakrichtlijnen in antwoorden

De assistent kan het antwoord vooraf laten gaan door een **enkele JSON-regel** om de stem te sturen:

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
- `silenceTimeoutMs`: wanneer niet ingesteld, behoudt Talk het platformstandaard-pauzevenster voordat het transcript wordt verzonden (`700 ms on macOS and Android, 900 ms on iOS`)
- `provider`: selecteert de actieve Talk-provider. Gebruik `elevenlabs`, `mlx` of `system` voor de macOS-lokale afspeelpaden.
- `providers.<provider>.voiceId`: valt terug op `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` voor ElevenLabs (of de eerste ElevenLabs-stem wanneer een API-sleutel beschikbaar is).
- `providers.elevenlabs.modelId`: standaard `eleven_v3` wanneer niet ingesteld.
- `providers.mlx.modelId`: standaard `mlx-community/Soprano-80M-bf16` wanneer niet ingesteld.
- `providers.elevenlabs.apiKey`: valt terug op `ELEVENLABS_API_KEY` (of Gateway-shellprofiel indien beschikbaar).
- `consultThinkingLevel`: optionele override voor het denkniveau voor de volledige OpenClaw-agentrun achter realtime `openclaw_agent_consult`-calls.
- `consultFastMode`: optionele fast-mode-override voor realtime `openclaw_agent_consult`-calls.
- `realtime.provider`: selecteert de actieve realtime-spraakprovider. Gebruik `openai` voor WebRTC, `google` voor provider-WebSocket, of een provider die alleen via een bridge werkt via Gateway-relay.
- `realtime.providers.<provider>` slaat provider-beheerde realtimeconfiguratie op. De browser ontvangt alleen tijdelijke of beperkte sessiereferenties, nooit een standaard API-sleutel.
- `realtime.providers.openai.voice`: ingebouwde OpenAI Realtime-stem-id. Huidige `gpt-realtime-2`-stemmen zijn `alloy`, `ash`, `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin` en `cedar`; `marin` en `cedar` worden aanbevolen voor de beste kwaliteit.
- `realtime.transport`: `webrtc` gebruikt client-beheerde OpenAI WebRTC op iOS en in de browser. `provider-websocket` is browser-beheerd maar blijft op iOS op de Gateway-relay. `gateway-relay` houdt provider-audio op de Gateway; Android gebruikt realtime alleen voor dit transport en behoudt anders de native STT/TTS-lus.
- `realtime.brain`: `agent-consult` routeert realtime-toolcalls via Gateway-beleid; `direct-tools` is verouderd compatibiliteitsgedrag voor directe tools; `none` is voor transcriptie of externe orkestratie.
- `realtime.consultRouting`: `provider-direct` behoudt het directe antwoord van de provider wanneer deze `openclaw_agent_consult` overslaat; `force-agent-consult` laat Gateway-relay afgeronde gebruikerstranscripten in plaats daarvan via OpenClaw routeren.
- `realtime.instructions`: voegt provider-gerichte systeeminstructies toe aan de ingebouwde realtimeprompt van OpenClaw. Gebruik dit voor stemstijl en toon; OpenClaw behoudt de standaardrichtlijnen voor `openclaw_agent_consult`.
- `talk.catalog` exposeert canonieke provider-id's en registeraliassen naast de geldige modi, transporten, brain-strategieën, realtime-audioformaten, capability-vlaggen en het door de runtime geselecteerde gereedheidsresultaat van elke provider. First-party Talk-clients moeten die catalogus gebruiken in plaats van provideraliassen lokaal te onderhouden; een oudere Gateway die groepsgereedheid weglaat, is niet geverifieerd in plaats van definitief niet geconfigureerd.
- Streaming-transcriptieproviders worden ontdekt via `talk.catalog.transcription`. De huidige Gateway-relay gebruikt de configuratie van de streamingprovider voor spraakoproepen totdat het specifieke configuratieoppervlak voor Talk-transcriptie is toegevoegd.
- `speechLocale`: optionele BCP 47-locale-id voor on-device Talk-spraakherkenning op iOS/macOS. Laat dit leeg om de apparaatstandaard te gebruiken.
- `outputFormat`: standaard `pcm_44100` op macOS/iOS en `pcm_24000` op Android (stel `mp3_*` in om MP3-streaming af te dwingen)

## macOS-UI

- Menubalkschakelaar: **Talk**
- Configuratietabblad: groep **Talk-modus** (stem-id + onderbrekingsschakelaar)
- Overlay:
  - **Luisteren**: wolk pulseert met microfoonniveau
  - **Denken**: zinkende animatie
  - **Spreken**: uitstralende ringen
  - Klik op wolk: stoppen met spreken
  - Klik op X: Talk-modus afsluiten

## Android-UI

- Schakelaar op spraaktabblad: **Talk**
- Handmatige **Mic** en **Talk** zijn elkaar uitsluitende runtime-opnamemodi.
- Handmatige Mic en realtime Talk geven de voorkeur aan een verbonden Bluetooth Classic- of BLE-headsetmicrofoon. Als die wordt losgekoppeld, vraagt de app om een andere headsetinvoer of laat Android de standaardmicrofoon gebruiken; stoppen met opnemen herstelt de standaardmicrofoonvoorkeur.
- Handmatige Mic stopt wanneer de app de voorgrond verlaat of de gebruiker het spraaktabblad verlaat.
- Talk-modus blijft actief totdat deze wordt uitgeschakeld of de Android-Node de verbinding verbreekt, en gebruikt het microfoon-foreground-servicetype van Android terwijl deze actief is.

## Opmerkingen

- Vereist machtigingen voor spraak en microfoon.
- Native Talk gebruikt de actieve Gateway-sessie en valt alleen terug op history-polling wanneer response-events niet beschikbaar zijn.
- Client-beheerde realtime Talk gebruikt `talk.client.toolCall` voor `openclaw_agent_consult` in plaats van `chat.send` beschikbaar te maken voor provider-beheerde sessies.
- Talk voor alleen transcriptie gebruikt `talk.session.create`, `talk.session.appendAudio`, `talk.session.cancelTurn` en `talk.session.close`; clients abonneren zich op `talk.event` voor gedeeltelijke/definitieve transcriptupdates.
- De gateway lost Talk-afspelen op via `talk.speak` met de actieve Talk-provider. Android valt alleen terug op lokale systeem-TTS wanneer die RPC niet beschikbaar is.
- macOS-lokale MLX-weergave gebruikt de gebundelde `openclaw-mlx-tts`-helper wanneer aanwezig, of een uitvoerbaar bestand op `PATH`. Stel `OPENCLAW_MLX_TTS_BIN` in om tijdens ontwikkeling naar een aangepaste helper-binary te verwijzen.
- `stability` voor `eleven_v3` wordt gevalideerd naar `0.0`, `0.5` of `1.0`; andere modellen accepteren `0..1`.
- `latency_tier` wordt gevalideerd naar `0..4` wanneer ingesteld.
- Android ondersteunt `pcm_16000`-, `pcm_22050`-, `pcm_24000`- en `pcm_44100`-uitvoerformaten voor low-latency AudioTrack-streaming.

## Gerelateerd

- [Spraakactivering](/nl/nodes/voicewake)
- [Audio en spraaknotities](/nl/nodes/audio)
- [Mediabegrip](/nl/nodes/media-understanding)
