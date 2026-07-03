---
read_when:
    - Talk-modus implementeren op macOS/iOS/Android
    - Gedrag voor spraak/TTS/onderbreken wijzigen
summary: 'Spreekmodus: continue spraakgesprekken via lokale STT/TTS en realtime spraak'
title: Praatmodus
x-i18n:
    generated_at: "2026-07-03T01:01:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 22e1539de48fea2b1d4f04c2a6935b011c55a9a6d700b6caadc4daf5b038b60d
    source_path: nodes/talk.md
    workflow: 16
---

Talk-modus heeft twee runtime-vormen:

- Native macOS/iOS/Android Talk gebruikt lokale spraakherkenning, Gateway-chat en `talk.speak` TTS. Nodes adverteren de `talk`-capability en declareren de `talk.*`-commando's die ze ondersteunen.
- iOS Talk gebruikt clientbeheerde WebRTC voor OpenAI-realtimeconfiguraties die `webrtc` selecteren of de transport weglaten. Expliciete `gateway-relay`-, `provider-websocket`- en niet-OpenAI-realtimeconfiguraties blijven op de Gateway-beheerde relay; niet-realtimeconfiguraties gebruiken de native spraaklus.
- Browser Talk gebruikt `talk.client.create` voor clientbeheerde `webrtc`- en `provider-websocket`-sessies, of `talk.session.create` voor Gateway-beheerde `gateway-relay`-sessies. `managed-room` is gereserveerd voor Gateway-overdracht en walkietalkieruimtes.
- Android Talk kan kiezen voor Gateway-beheerde realtime-relaysessies met `talk.realtime.mode: "realtime"` en `talk.realtime.transport: "gateway-relay"`. Anders blijft het op native spraakherkenning, Gateway-chat en `talk.speak`.
- Clients die alleen transcriptie gebruiken, gebruiken `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`, daarna `talk.session.appendAudio`, `talk.session.cancelTurn` en `talk.session.close` wanneer ze ondertitels of dicteren nodig hebben zonder gesproken assistentantwoord.

Native Talk is een doorlopende spraakgesprekslus:

1. Luisteren naar spraak
2. Transcript naar het model sturen via de actieve sessie
3. Wachten op het antwoord
4. Het uitspreken via de geconfigureerde Talk-provider (`talk.speak`)

Clientbeheerde realtime Talk stuurt providertoolaanroepen door via `talk.client.toolCall`; die clients roepen `chat.send` niet rechtstreeks aan voor realtime-consults.
Terwijl een realtime-consult actief is, kunnen Talk-clients `talk.client.steer` of
`talk.session.steer` gebruiken om gesproken invoer te classificeren als `status`, `steer`, `cancel` of
`followup`. Geaccepteerde sturing wordt in de actieve ingesloten run in de wachtrij geplaatst; afgewezen
sturing retourneert een gestructureerde reden zoals `no_active_run`, `not_streaming`,
of `compacting`.

Transcriptie-only Talk emit dezelfde algemene Talk-eventenvelop als realtime- en STT/TTS-sessies, maar gebruikt `mode: "transcription"` en `brain: "none"`. Het is bedoeld voor ondertitels, dicteren en observe-only spraakopname; eenmalig geüploade spraaknotities gebruiken nog steeds het media-/audiopad.

## Gedrag (macOS)

- **Altijd zichtbare overlay** terwijl Talk-modus is ingeschakeld.
- Faseovergangen **Luisteren → Denken → Spreken**.
- Bij een **korte pauze** (stiltevenster) wordt het huidige transcript verzonden.
- Antwoorden worden **naar WebChat geschreven** (hetzelfde als typen).
- **Onderbreken bij spraak** (standaard aan): als de gebruiker begint te praten terwijl de assistent spreekt, stoppen we het afspelen en noteren we de onderbrekingstijdstempel voor de volgende prompt.

## Spraakrichtlijnen in antwoorden

De assistent kan zijn antwoord vooraf laten gaan door een **enkele JSON-regel** om spraak te beheren:

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
- `silenceTimeoutMs`: wanneer niet ingesteld, behoudt Talk het standaard pauzevenster van het platform voordat het transcript wordt verzonden (`700 ms on macOS and Android, 900 ms on iOS`)
- `provider`: selecteert de actieve Talk-provider. Gebruik `elevenlabs`, `mlx` of `system` voor de macOS-lokale afspeelpaden.
- `providers.<provider>.voiceId`: valt terug op `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` voor ElevenLabs (of de eerste ElevenLabs-stem wanneer de API-sleutel beschikbaar is).
- `providers.elevenlabs.modelId`: standaard `eleven_v3` wanneer niet ingesteld.
- `providers.mlx.modelId`: standaard `mlx-community/Soprano-80M-bf16` wanneer niet ingesteld.
- `providers.elevenlabs.apiKey`: valt terug op `ELEVENLABS_API_KEY` (of gateway-shellprofiel indien beschikbaar).
- `consultThinkingLevel`: optionele override voor het denkniveau voor de volledige OpenClaw-agentrun achter realtime `openclaw_agent_consult`-aanroepen.
- `consultFastMode`: optionele fast-mode-override voor realtime `openclaw_agent_consult`-aanroepen.
- `realtime.provider`: selecteert de actieve realtime-spraakprovider. Gebruik `openai` voor WebRTC, `google` voor provider-WebSocket, of een bridge-only provider via Gateway-relay.
- `realtime.providers.<provider>` slaat providerbeheerde realtimeconfiguratie op. De browser ontvangt alleen kortstondige of beperkte sessiereferenties, nooit een standaard API-sleutel.
- `realtime.providers.openai.voice`: ingebouwde OpenAI Realtime-stem-id. Huidige `gpt-realtime-2`-stemmen zijn `alloy`, `ash`, `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin` en `cedar`; `marin` en `cedar` worden aanbevolen voor de beste kwaliteit.
- `realtime.transport`: `webrtc` gebruikt clientbeheerde OpenAI WebRTC op iOS en in de browser. `provider-websocket` is browserbeheerd, maar blijft op iOS op de Gateway-relay. `gateway-relay` houdt provideraudio op de Gateway; Android gebruikt realtime alleen voor deze transport en behoudt anders zijn native STT/TTS-lus.
- `realtime.brain`: `agent-consult` routeert realtime-toolaandroepen via Gateway-beleid; `direct-tools` is legacy compatibiliteitsgedrag voor directe tools; `none` is voor transcriptie of externe orchestratie.
- `realtime.consultRouting`: `provider-direct` behoudt het directe antwoord van de provider wanneer deze `openclaw_agent_consult` overslaat; `force-agent-consult` laat Gateway-relay afgeronde gebruikerstranscripten via OpenClaw routeren.
- `realtime.instructions`: voegt providergerichte systeeminstructies toe aan de ingebouwde realtime-prompt van OpenClaw. Gebruik dit voor stemstijl en toon; OpenClaw behoudt de standaard `openclaw_agent_consult`-richtlijnen.
- `talk.catalog` stelt de geldige modi, transports, brain-strategieën, realtime-audioformaten en capability-vlaggen van elke provider beschikbaar, zodat first-party Talk-clients niet-ondersteunde combinaties kunnen vermijden.
- Streaming-transcriptieproviders worden ontdekt via `talk.catalog.transcription`. De huidige Gateway-relay gebruikt de streamingproviderconfiguratie van Voice Call totdat het specifieke configuratieoppervlak voor Talk-transcriptie is toegevoegd.
- `speechLocale`: optionele BCP 47 locale-id voor on-device Talk-spraakherkenning op iOS/macOS. Laat niet ingesteld om de apparaatstandaard te gebruiken.
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
- Handmatige Mic en realtime Talk geven de voorkeur aan een verbonden Bluetooth Classic- of BLE-headsetmicrofoon. Als deze wordt losgekoppeld, vraagt de app om een andere headsetinvoer of laat Android de standaardmicrofoon gebruiken; stoppen met opnemen herstelt de standaardmicrofoonvoorkeur.
- Handmatige Mic stopt wanneer de app naar de achtergrond gaat of de gebruiker het spraaktabblad verlaat.
- Talk Mode blijft draaien totdat deze wordt uitgeschakeld of de Android-node de verbinding verbreekt, en gebruikt Androids microfoon-foreground-servicetype zolang deze actief is.

## Opmerkingen

- Vereist machtigingen voor spraak en microfoon.
- Native Talk gebruikt de actieve Gateway-sessie en valt alleen terug op history-polling wanneer response-events niet beschikbaar zijn.
- Clientbeheerde realtime Talk gebruikt `talk.client.toolCall` voor `openclaw_agent_consult` in plaats van `chat.send` bloot te stellen aan providerbeheerde sessies.
- Transcriptie-only Talk gebruikt `talk.session.create`, `talk.session.appendAudio`, `talk.session.cancelTurn` en `talk.session.close`; clients abonneren zich op `talk.event` voor gedeeltelijke/definitieve transcriptupdates.
- De gateway resolveert Talk-afspelen via `talk.speak` met de actieve Talk-provider. Android valt alleen terug op lokale systeem-TTS wanneer die RPC niet beschikbaar is.
- macOS lokale MLX-afspeling gebruikt de gebundelde `openclaw-mlx-tts`-helper wanneer aanwezig, of een uitvoerbaar bestand op `PATH`. Stel `OPENCLAW_MLX_TTS_BIN` in om tijdens ontwikkeling naar een aangepaste helper-binary te wijzen.
- `stability` voor `eleven_v3` wordt gevalideerd op `0.0`, `0.5` of `1.0`; andere modellen accepteren `0..1`.
- `latency_tier` wordt gevalideerd op `0..4` wanneer ingesteld.
- Android ondersteunt `pcm_16000`-, `pcm_22050`-, `pcm_24000`- en `pcm_44100`-uitvoerformaten voor low-latency AudioTrack-streaming.

## Gerelateerd

- [Voice wake](/nl/nodes/voicewake)
- [Audio en spraaknotities](/nl/nodes/audio)
- [Media begrijpen](/nl/nodes/media-understanding)
