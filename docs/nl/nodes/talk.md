---
read_when:
    - Talk-modus implementeren op macOS/iOS/Android
    - Spraak-/TTS-/onderbrekingsgedrag wijzigen
summary: 'Gespreksmodus: doorlopende spraakgesprekken via lokale STT/TTS en realtime spraakcommunicatie'
title: Gespreksmodus
x-i18n:
    generated_at: "2026-07-12T08:58:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4180dcbf7a62cd03e2d18f2c568ed2182c9cf2f80159154a7d261bcb9b3ebee0
    source_path: nodes/talk.md
    workflow: 16
---

De spraakmodus omvat vijf runtimevormen:

- **Native macOS-/iOS-/Android-spraakmodus**: lokale spraakherkenning, chat via de Gateway en `talk.speak`-TTS. Nodes maken de `talk`-mogelijkheid bekend en geven aan welke `talk.*`-opdrachten ze ondersteunen.
- **iOS-spraakmodus (realtime)**: WebRTC onder beheer van de client voor realtimeconfiguraties van OpenAI die het `webrtc`-transport selecteren of geen transport opgeven. Expliciete `gateway-relay`-, `provider-websocket`- en niet-OpenAI-realtimeconfiguraties blijven op het door de Gateway beheerde relais; niet-realtimeconfiguraties gebruiken de native spraaklus.
- **Browserspraakmodus**: `talk.client.create` voor door de client beheerde `webrtc`-/`provider-websocket`-sessies, of `talk.session.create` voor door de Gateway beheerde `gateway-relay`-sessies. `managed-room` is gereserveerd voor overdracht door de Gateway en portofoonruimten.
- **Android-spraakmodus (realtime)**: schakel deze in met `talk.realtime.mode: "realtime"` en `talk.realtime.transport: "gateway-relay"`. Anders blijft Android native spraakherkenning, chat via de Gateway en `talk.speak` gebruiken.
- **Clients die alleen transcriberen**: `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`, gevolgd door `talk.session.appendAudio`, `talk.session.cancelTurn` en `talk.session.close` voor ondertiteling/dicteren zonder gesproken antwoord van een assistent. Eenmalig geüploade spraaknotities gebruiken nog steeds het audiopad van [mediabegrip](/nl/nodes/media-understanding).

De native spraakmodus is een continue lus: luisteren naar spraak, het transcript via de actieve sessie naar het model sturen, op het antwoord wachten en dit vervolgens uitspreken via de geconfigureerde spraakprovider (`talk.speak`).

Door de client beheerde realtime-spraakmodus stuurt toolaanroepen van de provider door via `talk.client.toolCall` in plaats van `chat.send` rechtstreeks aan te roepen. Terwijl een realtimeconsult actief is, kunnen clients `talk.client.steer` of `talk.session.steer` aanroepen om gesproken invoer te classificeren als `status`, `steer`, `cancel` of `followup`. Geaccepteerde bijsturing wordt in de wachtrij van de actieve ingebedde uitvoering geplaatst; afgewezen bijsturing retourneert een reden zoals `no_active_run`, `not_streaming` of `compacting`.

Spraakmodus die alleen transcribeert, verzendt dezelfde gebeurtenisenvelop als realtime- en STT-/TTS-sessies, maar gebruikt `mode: "transcription"` en `brain: "none"`. Alle spraaksessies zenden gebeurtenissen uit op het kanaal `talk.event`; clients abonneren zich hierop voor gedeeltelijke/definitieve transcriptupdates (`transcript.delta`/`transcript.done`) en andere sessietelemetrie.

## Gedrag (macOS)

- Overlay die altijd zichtbaar is zolang de spraakmodus is ingeschakeld.
- Faseovergangen **Luisteren &rarr; Denken &rarr; Spreken**.
- Bij een korte pauze (stiltevenster) wordt het huidige transcript verzonden.
- Antwoorden worden naar WebChat geschreven (net als bij typen).
- **Onderbreken bij spraak** (standaard ingeschakeld): als de gebruiker praat terwijl de assistent spreekt, stopt het afspelen en wordt het tijdstip van de onderbreking voor de volgende prompt vastgelegd.

## Spraakinstructies in antwoorden

De assistent kan een antwoord vooraf laten gaan door één JSON-regel om de stem te regelen:

```json
{ "voice": "<voice-id>", "once": true }
```

Regels:

- Alleen de eerste niet-lege regel; de JSON-regel wordt vóór het afspelen via TTS verwijderd.
- Onbekende sleutels worden genegeerd.
- `once: true` geldt alleen voor het huidige antwoord; zonder deze instelling wordt de stem de nieuwe standaard voor de spraakmodus.

Ondersteunde sleutels: `voice` / `voice_id` / `voiceId`, `model` / `model_id` / `modelId`, `speed`, `rate` (WPM), `stability`, `similarity`, `style`, `speakerBoost`, `seed`, `normalize`, `lang`, `output_format`, `latency_tier`, `once`.

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
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
      instructions: "Spreek hartelijk en houd antwoorden kort.",
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

| Sleutel                                  | Standaard                                  | Opmerkingen                                                                                                                                                                                                                                                                 |
| ---------------------------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`                               | -                                          | Actieve TTS-provider voor de spraakmodus. Gebruik `elevenlabs`, `mlx` of `system` voor lokale afspeelpaden op macOS.                                                                                                                                                         |
| `providers.<id>.voiceId`                 | -                                          | ElevenLabs valt terug op `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID`, of op de eerste beschikbare stem met een API-sleutel.                                                                                                                                                       |
| `providers.elevenlabs.modelId`           | `eleven_v3`                                |                                                                                                                                                                                                                                                                             |
| `providers.mlx.modelId`                  | `mlx-community/Soprano-80M-bf16`           |                                                                                                                                                                                                                                                                             |
| `providers.elevenlabs.apiKey`            | -                                          | Valt terug op `ELEVENLABS_API_KEY` (of het shellprofiel van de Gateway indien beschikbaar).                                                                                                                                                                                 |
| `speechLocale`                           | apparaatstandaard                          | BCP 47-locale-id voor spraakherkenning op het apparaat voor de spraakmodus op iOS/macOS.                                                                                                                                                                                     |
| `silenceTimeoutMs`                       | `700` ms macOS/Android, `900` ms iOS       | Pauzevenster voordat de spraakmodus het transcript verzendt.                                                                                                                                                                                                                |
| `interruptOnSpeech`                      | `true`                                     |                                                                                                                                                                                                                                                                             |
| `outputFormat`                           | `pcm_44100` macOS/iOS, `pcm_24000` Android | Stel `mp3_*` in om MP3-streaming af te dwingen.                                                                                                                                                                                                                              |
| `consultThinkingLevel`                   | niet ingesteld                             | Overschrijving van het denkniveau voor de agentuitvoering achter realtime-aanroepen van `openclaw_agent_consult`.                                                                                                                                                           |
| `consultFastMode`                        | niet ingesteld                             | Overschrijving van de snelle modus voor realtime-aanroepen van `openclaw_agent_consult`.                                                                                                                                                                                    |
| `realtime.provider`                      | -                                          | `openai` voor WebRTC, `google` voor de WebSocket van de provider, of een provider die alleen via een bridge werkt via het Gateway-relais.                                                                                                                                    |
| `realtime.providers.<id>`                | -                                          | Realtimeconfiguratie onder beheer van de provider. Browsers ontvangen alleen tijdelijke/beperkte sessiereferenties, nooit een standaard-API-sleutel.                                                                                                                        |
| `realtime.providers.openai.speakerVoice` | `alloy`                                    | Ingebouwde stem-id van OpenAI Realtime (de oudere sleutel `voice` werkt nog, maar is verouderd). Huidige stemmen van `gpt-realtime-2.1`: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `marin`, `sage`, `shimmer`, `verse`; `marin` en `cedar` worden aanbevolen voor de beste kwaliteit. |
| `realtime.transport`                     | -                                          | `webrtc`: door de client beheerde OpenAI WebRTC op iOS en in de browser. `provider-websocket`: door de browser beheerd, blijft op iOS via het Gateway-relais lopen. `gateway-relay`: houdt provideraudio op de Gateway; Android gebruikt realtime alleen met dit transport.     |
| `realtime.brain`                         | -                                          | `agent-consult` leidt realtime-toolaanroepen via het Gateway-beleid; `direct-tools` is verouderde compatibiliteit voor rechtstreekse tools; `none` is bedoeld voor transcriptie/externe orkestratie.                                                                          |
| `realtime.consultRouting`                | -                                          | `provider-direct` behoudt het rechtstreekse antwoord van de provider wanneer deze `openclaw_agent_consult` overslaat; `force-agent-consult` leidt definitieve gebruikerstranscripten in plaats daarvan via OpenClaw.                                                          |
| `realtime.instructions`                  | -                                          | Voegt providergerichte systeeminstructies toe aan de ingebouwde realtimeprompt van OpenClaw (stemstijl/-toon); de standaardrichtlijnen voor `openclaw_agent_consult` blijven behouden.                                                                                        |

`talk.catalog` maakt canonieke provider-id's en registeraliassen beschikbaar, evenals de geldige modi, transporten, brain-strategieën, realtime-audioformaten en capaciteitsvlaggen van elke provider, plus het tijdens runtime geselecteerde gereedheidsresultaat. Eigen Talk-clients moeten die catalogus gebruiken in plaats van lokaal provideraliasen bij te houden; beschouw een oudere Gateway die groepsgereedheid weglaat als niet-geverifieerd en niet als definitief ongeconfigureerd. Providers voor streamingtranscriptie worden ontdekt via `talk.catalog.transcription`; de huidige Gateway-relay gebruikt de configuratie van de streamingprovider voor Voice Call totdat een speciaal configuratieoppervlak voor Talk-transcriptie beschikbaar komt.

## macOS-interface

- Schakelaar in de menubalk: **Talk**
- Configuratietabblad: groep **Talk-modus** (stem-id + onderbrekingsschakelaar)
- Overlay: de bol geeft de universele Talk-golfvorm weer (gedeeld met iOS, watchOS en Android). Tijdens Luisteren volgt deze het actuele microfoonniveau, tijdens Spreken volgt deze de daadwerkelijke TTS-afspeelenvelop en tijdens Denken ademt deze zacht. Klik op de bol om te pauzeren/hervatten, dubbelklik om het spreken te stoppen en klik op X om de Talk-modus af te sluiten.

## Android-interface

- Schakelaar op het tabblad Stem: **Talk**
- Handmatige **Microfoon** en **Talk** zijn elkaar uitsluitende opnamemodi.
- Handmatige Microfoon en realtime Talk geven de voorkeur aan de microfoon van een verbonden Bluetooth Classic- of BLE-headset; als de verbinding wordt verbroken, vraagt de app om een andere headsetinvoer of valt deze terug op de standaardmicrofoon. Zodra de opname stopt, wordt de standaardvoorkeur hersteld.
- Handmatige Microfoon stopt wanneer de app niet meer op de voorgrond staat of de gebruiker het tabblad Stem verlaat.
- Talk-modus blijft actief totdat deze wordt uitgeschakeld of de Node de verbinding verbreekt, waarbij het voorgrondservicetype voor de Android-microfoon wordt gebruikt zolang de modus actief is.
- Android ondersteunt de uitvoerformaten `pcm_16000`, `pcm_22050`, `pcm_24000` en `pcm_44100` voor `AudioTrack`-streaming met lage latentie.

## Opmerkingen

- Vereist machtigingen voor spraak en microfoon.
- Native Talk gebruikt de actieve Gateway-sessie en valt alleen terug op het pollen van de geschiedenis wanneer responsgebeurtenissen niet beschikbaar zijn.
- De Gateway verwerkt Talk-weergave via `talk.speak` met de actieve Talk-provider. Android valt alleen terug op lokale systeem-TTS wanneer die RPC niet beschikbaar is.
- Lokale MLX-weergave op macOS gebruikt de meegeleverde helper `openclaw-mlx-tts` wanneer deze aanwezig is, of een uitvoerbaar bestand op `PATH`. Stel tijdens de ontwikkeling `OPENCLAW_MLX_TTS_BIN` in om naar een aangepast uitvoerbaar helperbestand te verwijzen.
- Waardebereiken voor steminstructies (ElevenLabs): `stability`, `similarity` en `style` accepteren `0..1`; `speed` accepteert `0.5..2`; `latency_tier` accepteert `0..4`.

## Gerelateerd

- [Stemactivering](/nl/nodes/voicewake)
- [Audio en spraaknotities](/nl/nodes/audio)
- [Mediabegrip](/nl/nodes/media-understanding)
