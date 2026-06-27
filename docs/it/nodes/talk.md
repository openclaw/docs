---
read_when:
    - Implementazione della modalità Talk su macOS/iOS/Android
    - Modifica del comportamento di voce/TTS/interruzione
summary: 'Modalità Talk: conversazioni vocali continue tramite STT/TTS locale e voce in tempo reale'
title: Modalità conversazione
x-i18n:
    generated_at: "2026-06-27T17:43:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 47ae6c1abc763688ab5bbea1c23c9f4f27fe2f4b13cfade61917f5a1a912f057
    source_path: nodes/talk.md
    workflow: 16
---

La modalità Talk ha due forme di runtime:

- Talk nativo su macOS/iOS/Android usa il riconoscimento vocale locale, la chat del Gateway e il TTS `talk.speak`. I nodi pubblicizzano la capability `talk` e dichiarano i comandi `talk.*` che supportano.
- Talk nel browser usa `talk.client.create` per sessioni `webrtc` e `provider-websocket` possedute dal client, oppure `talk.session.create` per sessioni `gateway-relay` possedute dal Gateway. `managed-room` è riservato al passaggio di consegne del Gateway e alle stanze walkie-talkie.
- Talk su Android può attivare sessioni relay realtime possedute dal Gateway con `talk.realtime.mode: "realtime"` e `talk.realtime.transport: "gateway-relay"`. In caso contrario resta su riconoscimento vocale nativo, chat del Gateway e `talk.speak`.
- I client solo trascrizione usano `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`, poi `talk.session.appendAudio`, `talk.session.cancelTurn` e `talk.session.close` quando hanno bisogno di sottotitoli o dettatura senza una risposta vocale dell'assistente.

Talk nativo è un ciclo continuo di conversazione vocale:

1. Ascolta il parlato
2. Invia la trascrizione al modello tramite la sessione attiva
3. Attende la risposta
4. La pronuncia tramite il provider Talk configurato (`talk.speak`)

Talk realtime nel browser inoltra le chiamate agli strumenti del provider tramite `talk.client.toolCall`; i client browser non chiamano direttamente `chat.send` per le consultazioni realtime.
Mentre una consultazione realtime è attiva, i client Talk possono usare `talk.client.steer` o
`talk.session.steer` per classificare l'input parlato come `status`, `steer`, `cancel` o
`followup`. Lo steering accettato viene accodato nell'esecuzione incorporata attiva; lo
steering rifiutato restituisce un motivo strutturato come `no_active_run`, `not_streaming`
o `compacting`.

Talk solo trascrizione emette la stessa envelope comune di eventi Talk delle sessioni realtime e STT/TTS, ma usa `mode: "transcription"` e `brain: "none"`. È pensato per sottotitoli, dettatura e acquisizione vocale in sola osservazione; le note vocali caricate una tantum continuano a usare il percorso media/audio.

## Comportamento (macOS)

- **Overlay sempre attivo** mentre la modalità Talk è abilitata.
- Transizioni di fase **In ascolto → In elaborazione → In riproduzione**.
- Dopo una **pausa breve** (finestra di silenzio), la trascrizione corrente viene inviata.
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
- `provider`: seleziona il provider Talk attivo. Usa `elevenlabs`, `mlx` o `system` per i percorsi di riproduzione locali di macOS.
- `providers.<provider>.voiceId`: ripiega su `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` per ElevenLabs (o sulla prima voce ElevenLabs quando è disponibile la chiave API).
- `providers.elevenlabs.modelId`: il valore predefinito è `eleven_v3` quando non impostato.
- `providers.mlx.modelId`: il valore predefinito è `mlx-community/Soprano-80M-bf16` quando non impostato.
- `providers.elevenlabs.apiKey`: ripiega su `ELEVENLABS_API_KEY` (o sul profilo shell del gateway, se disponibile).
- `consultThinkingLevel`: override opzionale del livello di ragionamento per l'intera esecuzione dell'agente OpenClaw dietro le chiamate realtime `openclaw_agent_consult`.
- `consultFastMode`: override opzionale della modalità rapida per le chiamate realtime `openclaw_agent_consult`.
- `realtime.provider`: seleziona il provider vocale realtime attivo del browser/server. Usa `openai` per WebRTC, `google` per WebSocket del provider, oppure un provider solo bridge tramite relay del Gateway.
- `realtime.providers.<provider>` archivia la configurazione realtime posseduta dal provider. Il browser riceve solo credenziali di sessione effimere o vincolate, mai una chiave API standard.
- `realtime.providers.openai.voice`: id voce OpenAI Realtime integrato. Le voci attuali di `gpt-realtime-2` sono `alloy`, `ash`, `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin` e `cedar`; `marin` e `cedar` sono consigliate per la qualità migliore.
- `realtime.transport`: `webrtc` e `provider-websocket` sono trasporti realtime del browser. Android usa il relay realtime solo quando questo è `gateway-relay`; altrimenti Talk su Android usa il suo ciclo STT/TTS nativo.
- `realtime.brain`: `agent-consult` instrada le chiamate agli strumenti realtime tramite la policy del Gateway; `direct-tools` è il comportamento di compatibilità legacy per strumenti diretti; `none` è per trascrizione o orchestrazione esterna.
- `realtime.consultRouting`: `provider-direct` preserva la risposta diretta del provider quando salta `openclaw_agent_consult`; `force-agent-consult` fa invece sì che il relay del Gateway instradi le trascrizioni utente finalizzate tramite OpenClaw.
- `realtime.instructions`: aggiunge istruzioni di sistema rivolte al provider al prompt realtime integrato di OpenClaw. Usalo per stile e tono della voce; OpenClaw mantiene la guida predefinita di `openclaw_agent_consult`.
- `talk.catalog` espone le modalità, i trasporti, le strategie brain, i formati audio realtime e i flag di capability validi di ciascun provider, così i client Talk proprietari possono evitare combinazioni non supportate.
- I provider di trascrizione in streaming vengono scoperti tramite `talk.catalog.transcription`. L'attuale relay del Gateway usa la configurazione del provider di streaming Voice Call finché non viene aggiunta la superficie di configurazione dedicata alla trascrizione Talk.
- `speechLocale`: id locale BCP 47 opzionale per il riconoscimento vocale Talk sul dispositivo su iOS/macOS. Lascialo non impostato per usare il valore predefinito del dispositivo.
- `outputFormat`: il valore predefinito è `pcm_44100` su macOS/iOS e `pcm_24000` su Android (imposta `mp3_*` per forzare lo streaming MP3)

## UI macOS

- Interruttore nella barra dei menu: **Talk**
- Scheda di configurazione: gruppo **Modalità Talk** (id voce + interruttore di interruzione)
- Overlay:
  - **In ascolto**: la nuvola pulsa con il livello del microfono
  - **In elaborazione**: animazione di affondamento
  - **In riproduzione**: anelli radianti
  - Clic sulla nuvola: interrompe la riproduzione
  - Clic su X: esce dalla modalità Talk

## UI Android

- Interruttore nella scheda Voce: **Talk**
- **Mic** manuale e **Talk** sono modalità di acquisizione runtime mutuamente esclusive.
- Mic manuale si interrompe quando l'app lascia il primo piano o l'utente lascia la scheda Voce.
- La modalità Talk continua a funzionare finché non viene disattivata o finché il nodo Android non si disconnette, e usa il tipo di servizio in primo piano per microfono di Android mentre è attiva.

## Note

- Richiede i permessi Voce + Microfono.
- Talk nativo usa la sessione Gateway attiva e ripiega sul polling della cronologia solo quando gli eventi di risposta non sono disponibili.
- Talk realtime nel browser usa `talk.client.toolCall` per `openclaw_agent_consult` invece di esporre `chat.send` alle sessioni browser possedute dal provider.
- Talk solo trascrizione usa `talk.session.create`, `talk.session.appendAudio`, `talk.session.cancelTurn` e `talk.session.close`; i client si iscrivono a `talk.event` per gli aggiornamenti parziali/finali della trascrizione.
- Il gateway risolve la riproduzione Talk tramite `talk.speak` usando il provider Talk attivo. Android ripiega sul TTS di sistema locale solo quando quell'RPC non è disponibile.
- La riproduzione MLX locale su macOS usa l'helper incluso `openclaw-mlx-tts` quando presente, oppure un eseguibile in `PATH`. Imposta `OPENCLAW_MLX_TTS_BIN` per puntare a un binario helper personalizzato durante lo sviluppo.
- `stability` per `eleven_v3` viene validato su `0.0`, `0.5` o `1.0`; altri modelli accettano `0..1`.
- `latency_tier` viene validato su `0..4` quando impostato.
- Android supporta i formati di output `pcm_16000`, `pcm_22050`, `pcm_24000` e `pcm_44100` per lo streaming AudioTrack a bassa latenza.

## Correlati

- [Risveglio vocale](/it/nodes/voicewake)
- [Audio e note vocali](/it/nodes/audio)
- [Comprensione dei media](/it/nodes/media-understanding)
