---
read_when:
    - Talk-modus implementeren op macOS/iOS/Android
    - Gedrag voor stem/TTS/onderbrekingen wijzigen
summary: 'Spraakmodus: continue spraakgesprekken via lokale STT/TTS en realtime spraak'
title: Gespreksmodus
x-i18n:
    generated_at: "2026-07-02T22:39:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 696e9693cd6b4a18500221230db17c94ffd01fe6f9c7fcf271b74072bb035a82
    source_path: nodes/talk.md
    workflow: 16
---

De praatmodus heeft twee runtimevormen:

- Native praatmodus op macOS/iOS/Android gebruikt lokale spraakherkenning, Gateway-chat en `talk.speak` TTS. Nodes adverteren de `talk`-capability en declareren de `talk.*`-opdrachten die ze ondersteunen.
- De praatmodus op iOS gebruikt WebRTC in beheer van de client voor OpenAI-realtimeconfiguraties die `webrtc` selecteren of de transportlaag weglaten. Expliciete `gateway-relay`-, `provider-websocket`- en niet-OpenAI-realtimeconfiguraties blijven op de relay in beheer van de Gateway; niet-realtimeconfiguraties gebruiken de native spraaklus.
- De praatmodus in de browser gebruikt `talk.client.create` voor `webrtc`- en `provider-websocket`-sessies in beheer van de client, of `talk.session.create` voor `gateway-relay`-sessies in beheer van de Gateway. `managed-room` is gereserveerd voor Gateway-handoff en walkietalkie-ruimtes.
- De praatmodus op Android kan kiezen voor realtime relay-sessies in beheer van de Gateway met `talk.realtime.mode: "realtime"` en `talk.realtime.transport: "gateway-relay"`. Anders blijft deze op native spraakherkenning, Gateway-chat en `talk.speak`.
- Clients die alleen transcriptie gebruiken, gebruiken `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`, en daarna `talk.session.appendAudio`, `talk.session.cancelTurn` en `talk.session.close` wanneer ze ondertiteling of dictatie nodig hebben zonder gesproken assistentantwoord.

Native praatmodus is een doorlopende spraakconversatielus:

1. Luister naar spraak
2. Stuur het transcript via de actieve sessie naar het model
3. Wacht op het antwoord
4. Spreek het uit via de geconfigureerde spraakprovider (`talk.speak`)

Realtime praatmodus in beheer van de client stuurt provider-toolcalls door via `talk.client.toolCall`; die clients roepen `chat.send` niet rechtstreeks aan voor realtimeconsulten.
Terwijl een realtimeconsult actief is, kunnen praatmodusclients `talk.client.steer` of
`talk.session.steer` gebruiken om gesproken invoer te classificeren als `status`, `steer`, `cancel` of
`followup`. Geaccepteerde sturing wordt in de actieve ingesloten run in de wachtrij gezet; geweigerde
sturing retourneert een gestructureerde reden zoals `no_active_run`, `not_streaming`,
of `compacting`.

Praatmodus met alleen transcriptie verstuurt dezelfde algemene praatmodus-eventenvelop als realtime- en STT/TTS-sessies, maar gebruikt `mode: "transcription"` en `brain: "none"`. Dit is bedoeld voor ondertiteling, dictatie en alleen observerende spraakopname; eenmalig geüploade spraaknotities blijven het media/audio-pad gebruiken.

## Gedrag (macOS)

- **Altijd-zichtbare overlay** zolang de praatmodus is ingeschakeld.
- Faseovergangen **Luisteren → Denken → Spreken**.
- Bij een **korte pauze** (stiltevenster) wordt het huidige transcript verzonden.
- Antwoorden worden **naar WebChat geschreven** (hetzelfde als typen).
- **Onderbreken bij spraak** (standaard aan): als de gebruiker begint te praten terwijl de assistent spreekt, stoppen we het afspelen en noteren we het onderbrekingstijdstip voor de volgende prompt.

## Spraakinstructies in antwoorden

De assistent kan zijn antwoord vooraf laten gaan door een **enkele JSON-regel** om spraak te sturen:

```json
{ "voice": "<voice-id>", "once": true }
```

Regels:

- Alleen de eerste niet-lege regel.
- Onbekende sleutels worden genegeerd.
- `once: true` geldt alleen voor het huidige antwoord.
- Zonder `once` wordt de stem de nieuwe standaard voor de praatmodus.
- De JSON-regel wordt vóór TTS-weergave verwijderd.

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
- `silenceTimeoutMs`: wanneer niet ingesteld, behoudt de praatmodus het platformstandaard-pauzevenster voordat het transcript wordt verzonden (`700 ms on macOS and Android, 900 ms on iOS`)
- `provider`: selecteert de actieve spraakprovider. Gebruik `elevenlabs`, `mlx` of `system` voor de macOS-lokale afspeelpaden.
- `providers.<provider>.voiceId`: valt terug op `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` voor ElevenLabs (of de eerste ElevenLabs-stem wanneer een API-sleutel beschikbaar is).
- `providers.elevenlabs.modelId`: gebruikt standaard `eleven_v3` wanneer niet ingesteld.
- `providers.mlx.modelId`: gebruikt standaard `mlx-community/Soprano-80M-bf16` wanneer niet ingesteld.
- `providers.elevenlabs.apiKey`: valt terug op `ELEVENLABS_API_KEY` (of het Gateway-shellprofiel indien beschikbaar).
- `consultThinkingLevel`: optionele override voor denkniveau voor de volledige OpenClaw-agentrun achter realtime `openclaw_agent_consult`-aanroepen.
- `consultFastMode`: optionele fast-mode-override voor realtime `openclaw_agent_consult`-aanroepen.
- `realtime.provider`: selecteert de actieve realtime spraakprovider. Gebruik `openai` voor WebRTC, `google` voor provider-WebSocket, of een bridge-only-provider via Gateway-relay.
- `realtime.providers.<provider>` slaat realtimeconfiguratie in beheer van de provider op. De browser ontvangt alleen tijdelijke of beperkte sessiereferenties, nooit een standaard API-sleutel.
- `realtime.providers.openai.voice`: ingebouwde OpenAI Realtime-stem-id. Huidige `gpt-realtime-2`-stemmen zijn `alloy`, `ash`, `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin` en `cedar`; `marin` en `cedar` worden aanbevolen voor de beste kwaliteit.
- `realtime.transport`: `webrtc` gebruikt OpenAI WebRTC in beheer van de client op iOS en in de browser. `provider-websocket` is in beheer van de browser, maar blijft op iOS op de Gateway-relay. `gateway-relay` houdt provideraudio op de Gateway; Android gebruikt realtime alleen voor deze transportlaag en behoudt anders de native STT/TTS-lus.
- `realtime.brain`: `agent-consult` routeert realtime-toolcalls via Gateway-beleid; `direct-tools` is verouderd compatibiliteitsgedrag voor directe tools; `none` is bedoeld voor transcriptie of externe orkestratie.
- `realtime.consultRouting`: `provider-direct` behoudt het directe antwoord van de provider wanneer deze `openclaw_agent_consult` overslaat; `force-agent-consult` laat Gateway-relay afgeronde gebruikerstranscripten in plaats daarvan via OpenClaw routeren.
- `realtime.instructions`: voegt providergerichte systeeminstructies toe aan de ingebouwde realtimeprompt van OpenClaw. Gebruik dit voor spraakstijl en toon; OpenClaw behoudt de standaardrichtlijnen voor `openclaw_agent_consult`.
- `talk.catalog` stelt de geldige modi, transportlagen, brain-strategieën, realtime-audioformaten en capabilityvlaggen van elke provider beschikbaar, zodat first-party praatmodusclients niet-ondersteunde combinaties kunnen vermijden.
- Streaming-transcriptieproviders worden ontdekt via `talk.catalog.transcription`. De huidige Gateway-relay gebruikt de streamingproviderconfiguratie van Voice Call totdat het specifieke configuratieoppervlak voor praatmodus-transcriptie is toegevoegd.
- `speechLocale`: optionele BCP 47-locale-id voor spraakherkenning op het apparaat in praatmodus op iOS/macOS. Laat dit leeg om de apparaatstandaard te gebruiken.
- `outputFormat`: gebruikt standaard `pcm_44100` op macOS/iOS en `pcm_24000` op Android (stel `mp3_*` in om MP3-streaming te forceren)

## macOS-UI

- Menubalkschakelaar: **Praten**
- Configuratietabblad: groep **Praatmodus** (stem-id + onderbrekingsschakelaar)
- Overlay:
  - **Luisteren**: wolk pulseert met microfoonniveau
  - **Denken**: zinkende animatie
  - **Spreken**: uitstralende ringen
  - Klik op wolk: stop met spreken
  - Klik op X: sluit de praatmodus af

## Android-UI

- Schakelaar op spraaktabblad: **Praten**
- Handmatige **Microfoon** en **Praten** zijn elkaar uitsluitende runtime-opnamemodi.
- Handmatige microfoon stopt wanneer de app de voorgrond verlaat of de gebruiker het spraaktabblad verlaat.
- Praatmodus blijft actief totdat deze wordt uitgeschakeld of de Android-node de verbinding verliest, en gebruikt het Android-microfoon-foreground-service-type zolang deze actief is.

## Opmerkingen

- Vereist machtigingen voor spraak en microfoon.
- Native praatmodus gebruikt de actieve Gateway-sessie en valt alleen terug op geschiedenis-polling wanneer response-events niet beschikbaar zijn.
- Realtime praatmodus in beheer van de client gebruikt `talk.client.toolCall` voor `openclaw_agent_consult` in plaats van `chat.send` bloot te stellen aan sessies in beheer van de provider.
- Praatmodus met alleen transcriptie gebruikt `talk.session.create`, `talk.session.appendAudio`, `talk.session.cancelTurn` en `talk.session.close`; clients abonneren zich op `talk.event` voor gedeeltelijke/definitieve transcriptupdates.
- De gateway lost praatmodus-weergave op via `talk.speak` met de actieve spraakprovider. Android valt alleen terug op lokale systeem-TTS wanneer die RPC niet beschikbaar is.
- macOS-lokale MLX-weergave gebruikt de gebundelde `openclaw-mlx-tts`-helper wanneer aanwezig, of een uitvoerbaar bestand op `PATH`. Stel `OPENCLAW_MLX_TTS_BIN` in om tijdens ontwikkeling naar een aangepaste helper-binary te verwijzen.
- `stability` voor `eleven_v3` wordt gevalideerd op `0.0`, `0.5` of `1.0`; andere modellen accepteren `0..1`.
- `latency_tier` wordt gevalideerd op `0..4` wanneer ingesteld.
- Android ondersteunt `pcm_16000`-, `pcm_22050`-, `pcm_24000`- en `pcm_44100`-uitvoerformaten voor AudioTrack-streaming met lage latency.

## Gerelateerd

- [Spraakactivering](/nl/nodes/voicewake)
- [Audio en spraaknotities](/nl/nodes/audio)
- [Mediabegrip](/nl/nodes/media-understanding)
