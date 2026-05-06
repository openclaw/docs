---
read_when:
    - Implementazione della modalità Talk su macOS/iOS/Android
    - Modifica del comportamento di voce/TTS/interruzione
summary: 'Modalità conversazione: conversazioni vocali continue tra STT/TTS locale e voce in tempo reale'
title: Modalità conversazione
x-i18n:
    generated_at: "2026-05-06T08:58:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: a04304a1dd6c3feefa89c0c8c66f8026a7d28b573776fcf14237c3481fbc772a
    source_path: nodes/talk.md
    workflow: 16
---

La modalità Talk ha due forme runtime:

- Talk nativo macOS/iOS/Android usa il riconoscimento vocale locale, la chat del Gateway e la sintesi vocale TTS `talk.speak`. I Node pubblicizzano la capability `talk` e dichiarano i comandi `talk.*` che supportano.
- Talk nel browser usa `talk.client.create` per sessioni `webrtc` e `provider-websocket` di proprietà del client, oppure `talk.session.create` per sessioni `gateway-relay` di proprietà del Gateway. `managed-room` è riservato al passaggio di consegna del Gateway e alle stanze walkie-talkie.
- I client solo trascrizione usano `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`, poi `talk.session.appendAudio`, `talk.session.cancelTurn` e `talk.session.close` quando hanno bisogno di sottotitoli o dettatura senza una risposta vocale dell'assistente.

Talk nativo è un ciclo continuo di conversazione vocale:

1. Ascolta il parlato
2. Invia la trascrizione al modello tramite la sessione attiva
3. Attende la risposta
4. La pronuncia tramite il provider Talk configurato (`talk.speak`)

Talk realtime nel browser inoltra le chiamate agli strumenti del provider tramite `talk.client.toolCall`; i client browser non chiamano direttamente `chat.send` per le consulenze realtime.

Talk solo trascrizione emette lo stesso envelope comune di eventi Talk delle sessioni realtime e STT/TTS, ma usa `mode: "transcription"` e `brain: "none"`. È pensato per sottotitoli, dettatura e acquisizione vocale solo osservazione; le note vocali caricate una tantum continuano a usare il percorso media/audio.

## Comportamento (macOS)

- **Overlay sempre attivo** mentre la modalità Talk è abilitata.
- Transizioni di fase **Ascolto → Elaborazione → Parlato**.
- Dopo una **breve pausa** (finestra di silenzio), la trascrizione corrente viene inviata.
- Le risposte vengono **scritte in WebChat** (come quando si digita).
- **Interruzione al parlato** (attiva per impostazione predefinita): se l'utente inizia a parlare mentre l'assistente sta parlando, interrompiamo la riproduzione e annotiamo il timestamp dell'interruzione per il prompt successivo.

## Direttive vocali nelle risposte

L'assistente può anteporre alla risposta una **singola riga JSON** per controllare la voce:

```json
{ "voice": "<voice-id>", "once": true }
```

Regole:

- Solo la prima riga non vuota.
- Le chiavi sconosciute vengono ignorate.
- `once: true` si applica solo alla risposta corrente.
- Senza `once`, la voce diventa la nuova impostazione predefinita per la modalità Talk.
- La riga JSON viene rimossa prima della riproduzione TTS.

Chiavi supportate:

- `voice` / `voice_id` / `voiceId`
- `model` / `model_id` / `modelId`
- `speed`, `rate` (WPM), `stability`, `similarity`, `style`, `speakerBoost`
- `seed`, `normalize`, `lang`, `output_format`, `latency_tier`
- `once`

## Configurazione (`~/.openclaw/openclaw.json`)

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

Impostazioni predefinite:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: quando non è impostato, Talk mantiene la finestra di pausa predefinita della piattaforma prima di inviare la trascrizione (`700 ms on macOS and Android, 900 ms on iOS`)
- `provider`: seleziona il provider Talk attivo. Usa `elevenlabs`, `mlx` o `system` per i percorsi di riproduzione locali su macOS.
- `providers.<provider>.voiceId`: ripiega su `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` per ElevenLabs (oppure sulla prima voce ElevenLabs quando è disponibile una chiave API).
- `providers.elevenlabs.modelId`: per impostazione predefinita usa `eleven_v3` quando non è impostato.
- `providers.mlx.modelId`: per impostazione predefinita usa `mlx-community/Soprano-80M-bf16` quando non è impostato.
- `providers.elevenlabs.apiKey`: ripiega su `ELEVENLABS_API_KEY` (o sul profilo shell del gateway, se disponibile).
- `realtime.provider`: seleziona il provider vocale realtime browser/server attivo. Usa `openai` per WebRTC, `google` per WebSocket del provider, oppure un provider solo bridge tramite relay del Gateway.
- `realtime.providers.<provider>` archivia la configurazione realtime di proprietà del provider. Il browser riceve solo credenziali di sessione effimere o vincolate, mai una chiave API standard.
- `realtime.brain`: `agent-consult` instrada le chiamate agli strumenti realtime tramite la policy del Gateway; `direct-tools` è un comportamento di compatibilità riservato al proprietario; `none` è per trascrizione o orchestrazione esterna.
- `talk.catalog` espone le modalità, i trasporti, le strategie brain, i formati audio realtime e i flag di capability validi di ciascun provider, così i client Talk proprietari possono evitare combinazioni non supportate.
- I provider di trascrizione in streaming vengono scoperti tramite `talk.catalog.transcription`. L'attuale relay del Gateway usa la configurazione del provider di streaming Voice Call finché non verrà aggiunta la superficie dedicata di configurazione della trascrizione Talk.
- `speechLocale`: id locale BCP 47 opzionale per il riconoscimento vocale Talk sul dispositivo in iOS/macOS. Lascialo non impostato per usare il valore predefinito del dispositivo.
- `outputFormat`: per impostazione predefinita usa `pcm_44100` su macOS/iOS e `pcm_24000` su Android (imposta `mp3_*` per forzare lo streaming MP3)

## UI macOS

- Interruttore nella barra dei menu: **Talk**
- Scheda di configurazione: gruppo **Modalità Talk** (id voce + interruttore interruzione)
- Overlay:
  - **Ascolto**: la nuvola pulsa con il livello del microfono
  - **Elaborazione**: animazione di affondamento
  - **Parlato**: anelli irradianti
  - Clic sulla nuvola: interrompe il parlato
  - Clic su X: esce dalla modalità Talk

## UI Android

- Interruttore nella scheda Voce: **Talk**
- **Mic** manuale e **Talk** sono modalità runtime di acquisizione mutuamente esclusive.
- Mic manuale si interrompe quando l'app lascia il primo piano o l'utente lascia la scheda Voce.
- La modalità Talk continua a funzionare finché non viene disattivata o il Node Android si disconnette, e usa il tipo di servizio in primo piano del microfono di Android mentre è attiva.

## Note

- Richiede le autorizzazioni Voce + Microfono.
- Talk nativo usa la sessione Gateway attiva e ripiega sul polling della cronologia solo quando gli eventi di risposta non sono disponibili.
- Talk realtime nel browser usa `talk.client.toolCall` per `openclaw_agent_consult` invece di esporre `chat.send` alle sessioni browser di proprietà del provider.
- Talk solo trascrizione usa `talk.session.create`, `talk.session.appendAudio`, `talk.session.cancelTurn` e `talk.session.close`; i client si sottoscrivono a `talk.event` per aggiornamenti parziali/finali della trascrizione.
- Il gateway risolve la riproduzione Talk tramite `talk.speak` usando il provider Talk attivo. Android ripiega sulla TTS di sistema locale solo quando quella RPC non è disponibile.
- La riproduzione locale MLX su macOS usa l'helper incluso `openclaw-mlx-tts` quando presente, oppure un eseguibile su `PATH`. Imposta `OPENCLAW_MLX_TTS_BIN` per puntare a un binario helper personalizzato durante lo sviluppo.
- `stability` per `eleven_v3` viene convalidato su `0.0`, `0.5` o `1.0`; gli altri modelli accettano `0..1`.
- `latency_tier` viene convalidato su `0..4` quando impostato.
- Android supporta i formati di output `pcm_16000`, `pcm_22050`, `pcm_24000` e `pcm_44100` per lo streaming AudioTrack a bassa latenza.

## Correlati

- [Attivazione vocale](/it/nodes/voicewake)
- [Audio e note vocali](/it/nodes/audio)
- [Comprensione dei media](/it/nodes/media-understanding)
