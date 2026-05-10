---
read_when:
    - Implementazione della modalità Conversazione su macOS/iOS/Android
    - Modifica del comportamento di voce/TTS/interruzione
summary: 'Modalità conversazione: conversazioni vocali continue tramite STT/TTS locale e voce in tempo reale'
title: Modalità conversazione
x-i18n:
    generated_at: "2026-05-10T19:40:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 28e5feae8af8ff89472dfb73c44c590b2f7fab3c0ca335b67603c7fd9d50dfe7
    source_path: nodes/talk.md
    workflow: 16
---

La modalità Talk ha due forme di runtime:

- Talk nativo su macOS/iOS/Android usa il riconoscimento vocale locale, la chat Gateway e il TTS `talk.speak`. I nodi pubblicizzano la capacità `talk` e dichiarano i comandi `talk.*` che supportano.
- Browser Talk usa `talk.client.create` per sessioni `webrtc` e `provider-websocket` di proprietà del client, oppure `talk.session.create` per sessioni `gateway-relay` di proprietà del Gateway. `managed-room` è riservato all'handoff del Gateway e alle stanze walkie-talkie.
- I client solo trascrizione usano `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`, poi `talk.session.appendAudio`, `talk.session.cancelTurn` e `talk.session.close` quando hanno bisogno di sottotitoli o dettatura senza una risposta vocale dell'assistente.

Talk nativo è un ciclo continuo di conversazione vocale:

1. Ascoltare il parlato
2. Inviare la trascrizione al modello tramite la sessione attiva
3. Attendere la risposta
4. Riprodurla tramite il provider Talk configurato (`talk.speak`)

Browser realtime Talk inoltra le chiamate agli strumenti del provider tramite `talk.client.toolCall`; i client browser non chiamano direttamente `chat.send` per le consultazioni realtime.

Talk solo trascrizione emette lo stesso envelope di eventi Talk comune delle sessioni realtime e STT/TTS, ma usa `mode: "transcription"` e `brain: "none"`. È destinato a sottotitoli, dettatura e acquisizione del parlato solo in osservazione; le note vocali caricate una tantum usano comunque il percorso media/audio.

## Comportamento (macOS)

- **Overlay sempre attivo** mentre la modalità Talk è abilitata.
- Transizioni di fase **Ascolto → Elaborazione → Parlato**.
- Dopo una **breve pausa** (finestra di silenzio), la trascrizione corrente viene inviata.
- Le risposte sono **scritte in WebChat** (come quando si digita).
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
- Senza `once`, la voce diventa il nuovo valore predefinito per la modalità Talk.
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

Valori predefiniti:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: quando non impostato, Talk mantiene la finestra di pausa predefinita della piattaforma prima di inviare la trascrizione (`700 ms on macOS and Android, 900 ms on iOS`)
- `provider`: seleziona il provider Talk attivo. Usa `elevenlabs`, `mlx` o `system` per i percorsi di riproduzione locali su macOS.
- `providers.<provider>.voiceId`: ricade su `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` per ElevenLabs (o sulla prima voce ElevenLabs quando è disponibile la chiave API).
- `providers.elevenlabs.modelId`: valore predefinito `eleven_v3` quando non impostato.
- `providers.mlx.modelId`: valore predefinito `mlx-community/Soprano-80M-bf16` quando non impostato.
- `providers.elevenlabs.apiKey`: ricade su `ELEVENLABS_API_KEY` (o sul profilo shell del Gateway, se disponibile).
- `consultThinkingLevel`: override opzionale del livello di ragionamento per l'esecuzione completa dell'agente OpenClaw dietro le chiamate realtime `openclaw_agent_consult`.
- `consultFastMode`: override opzionale della modalità rapida per le chiamate realtime `openclaw_agent_consult`.
- `realtime.provider`: seleziona il provider vocale realtime attivo lato browser/server. Usa `openai` per WebRTC, `google` per provider WebSocket, oppure un provider solo bridge tramite relay Gateway.
- `realtime.providers.<provider>` memorizza la configurazione realtime di proprietà del provider. Il browser riceve solo credenziali di sessione effimere o vincolate, mai una chiave API standard.
- `realtime.providers.openai.voice`: id voce OpenAI Realtime integrato. Le voci correnti di `gpt-realtime-2` sono `alloy`, `ash`, `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin` e `cedar`; `marin` e `cedar` sono consigliate per la migliore qualità.
- `realtime.brain`: `agent-consult` instrada le chiamate agli strumenti realtime tramite la policy del Gateway; `direct-tools` è un comportamento di compatibilità riservato al proprietario; `none` è per trascrizione o orchestrazione esterna.
- `realtime.instructions`: aggiunge istruzioni di sistema rivolte al provider al prompt realtime integrato di OpenClaw. Usalo per stile e tono della voce; OpenClaw mantiene le indicazioni predefinite di `openclaw_agent_consult`.
- `talk.catalog` espone modalità valide, trasporti, strategie brain, formati audio realtime e flag di capacità di ciascun provider, così i client Talk first-party possono evitare combinazioni non supportate.
- I provider di trascrizione in streaming vengono rilevati tramite `talk.catalog.transcription`. L'attuale relay Gateway usa la configurazione del provider di streaming Voice Call finché non verrà aggiunta la superficie di configurazione dedicata alla trascrizione Talk.
- `speechLocale`: id locale BCP 47 opzionale per il riconoscimento vocale Talk sul dispositivo su iOS/macOS. Lascia non impostato per usare il valore predefinito del dispositivo.
- `outputFormat`: valore predefinito `pcm_44100` su macOS/iOS e `pcm_24000` su Android (imposta `mp3_*` per forzare lo streaming MP3)

## UI macOS

- Interruttore nella barra dei menu: **Talk**
- Scheda di configurazione: gruppo **Modalità Talk** (id voce + interruttore di interruzione)
- Overlay:
  - **Ascolto**: la nuvola pulsa con il livello del microfono
  - **Elaborazione**: animazione di affondamento
  - **Parlato**: anelli irradiati
  - Clic sulla nuvola: interrompe il parlato
  - Clic su X: esce dalla modalità Talk

## UI Android

- Interruttore nella scheda Voce: **Talk**
- **Mic** manuale e **Talk** sono modalità di acquisizione runtime mutuamente esclusive.
- Mic manuale si interrompe quando l'app esce dal primo piano o l'utente lascia la scheda Voce.
- La modalità Talk continua a funzionare finché non viene disattivata o il nodo Android si disconnette, e usa il tipo di servizio in primo piano per microfono di Android mentre è attiva.

## Note

- Richiede i permessi Voce + Microfono.
- Talk nativo usa la sessione Gateway attiva e ricade sul polling della cronologia solo quando gli eventi di risposta non sono disponibili.
- Browser realtime Talk usa `talk.client.toolCall` per `openclaw_agent_consult` invece di esporre `chat.send` alle sessioni browser di proprietà del provider.
- Talk solo trascrizione usa `talk.session.create`, `talk.session.appendAudio`, `talk.session.cancelTurn` e `talk.session.close`; i client si iscrivono a `talk.event` per aggiornamenti parziali/finali della trascrizione.
- Il gateway risolve la riproduzione Talk tramite `talk.speak` usando il provider Talk attivo. Android ricade sul TTS di sistema locale solo quando quell'RPC non è disponibile.
- La riproduzione MLX locale su macOS usa l'helper `openclaw-mlx-tts` in bundle quando presente, oppure un eseguibile su `PATH`. Imposta `OPENCLAW_MLX_TTS_BIN` in modo che punti a un binario helper personalizzato durante lo sviluppo.
- `stability` per `eleven_v3` viene validato su `0.0`, `0.5` o `1.0`; gli altri modelli accettano `0..1`.
- `latency_tier` viene validato su `0..4` quando impostato.
- Android supporta i formati di output `pcm_16000`, `pcm_22050`, `pcm_24000` e `pcm_44100` per lo streaming AudioTrack a bassa latenza.

## Correlati

- [Voice wake](/it/nodes/voicewake)
- [Audio e note vocali](/it/nodes/audio)
- [Comprensione dei media](/it/nodes/media-understanding)
