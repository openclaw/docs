---
read_when:
    - Implementazione della modalità Conversazione su macOS/iOS/Android
    - Modificare il comportamento di voce/TTS/interruzione
summary: 'Modalità conversazione: conversazioni vocali continue tramite STT/TTS locale e voce in tempo reale'
title: Modalità conversazione
x-i18n:
    generated_at: "2026-07-12T07:10:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4180dcbf7a62cd03e2d18f2c568ed2182c9cf2f80159154a7d261bcb9b3ebee0
    source_path: nodes/talk.md
    workflow: 16
---

La modalità Talk comprende cinque configurazioni di runtime:

- **Talk nativo su macOS/iOS/Android**: riconoscimento vocale locale, chat del Gateway e TTS tramite `talk.speak`. I Node pubblicizzano la funzionalità `talk` e dichiarano quali comandi `talk.*` supportano.
- **Talk su iOS (in tempo reale)**: WebRTC gestito dal client per le configurazioni in tempo reale di OpenAI che selezionano il trasporto `webrtc` o lo omettono. Le configurazioni in tempo reale con `gateway-relay`, `provider-websocket` espliciti e quelle non OpenAI restano sul relay gestito dal Gateway; le configurazioni non in tempo reale usano il ciclo vocale nativo.
- **Talk nel browser**: `talk.client.create` per sessioni `webrtc`/`provider-websocket` gestite dal client oppure `talk.session.create` per sessioni `gateway-relay` gestite dal Gateway. `managed-room` è riservato al passaggio di controllo al Gateway e alle stanze walkie-talkie.
- **Talk su Android (in tempo reale)**: attivalo con `talk.realtime.mode: "realtime"` e `talk.realtime.transport: "gateway-relay"`. In caso contrario, Android continua a usare il riconoscimento vocale nativo, la chat del Gateway e `talk.speak`.
- **Client di sola trascrizione**: `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`, quindi `talk.session.appendAudio`, `talk.session.cancelTurn` e `talk.session.close` per sottotitoli/dettatura senza una risposta vocale dell'assistente. Le note vocali caricate ed elaborate una sola volta continuano a usare il percorso audio della [comprensione dei contenuti multimediali](/it/nodes/media-understanding).

Talk nativo è un ciclo continuo: ascolta il parlato, invia la trascrizione al modello tramite la sessione attiva, attende la risposta, quindi la riproduce tramite il provider Talk configurato (`talk.speak`).

Talk in tempo reale gestito dal client inoltra le chiamate agli strumenti del provider tramite `talk.client.toolCall` invece di chiamare direttamente `chat.send`. Mentre è attiva una consultazione in tempo reale, i client possono chiamare `talk.client.steer` o `talk.session.steer` per classificare l'input vocale come `status`, `steer`, `cancel` o `followup`. Le indicazioni accettate vengono accodate nell'esecuzione incorporata attiva; quelle rifiutate restituiscono un motivo come `no_active_run`, `not_streaming` o `compacting`.

Talk di sola trascrizione emette lo stesso involucro di eventi Talk delle sessioni in tempo reale e STT/TTS, ma usa `mode: "transcription"` e `brain: "none"`. Tutte le sessioni Talk trasmettono gli eventi sul canale `talk.event`; i client vi si iscrivono per ricevere aggiornamenti parziali/finali della trascrizione (`transcript.delta`/`transcript.done`) e altri dati di telemetria della sessione.

## Comportamento (macOS)

- Sovrapposizione sempre visibile mentre la modalità Talk è abilitata.
- Transizioni di fase **Ascolto &rarr; Elaborazione &rarr; Riproduzione vocale**.
- Dopo una breve pausa (intervallo di silenzio), viene inviata la trascrizione corrente.
- Le risposte vengono scritte in WebChat (come quando si digita).
- **Interruzione al rilevamento del parlato** (attiva per impostazione predefinita): se l'utente parla mentre l'assistente sta riproducendo la risposta vocale, la riproduzione si interrompe e il timestamp dell'interruzione viene annotato per il prompt successivo.

## Direttive vocali nelle risposte

L'assistente può anteporre a una risposta una singola riga JSON per controllare la voce:

```json
{ "voice": "<voice-id>", "once": true }
```

Regole:

- Solo la prima riga non vuota; la riga JSON viene rimossa prima della riproduzione TTS.
- Le chiavi sconosciute vengono ignorate.
- `once: true` si applica solo alla risposta corrente; senza questa opzione, la voce diventa la nuova impostazione predefinita della modalità Talk.

Chiavi supportate: `voice` / `voice_id` / `voiceId`, `model` / `model_id` / `modelId`, `speed`, `rate` (WPM), `stability`, `similarity`, `style`, `speakerBoost`, `seed`, `normalize`, `lang`, `output_format`, `latency_tier`, `once`.

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
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
      instructions: "Parla con calore e mantieni brevi le risposte.",
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

| Chiave                                   | Valore predefinito                         | Note                                                                                                                                                                                                                                                                                                                                 |
| ---------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `provider`                               | -                                          | Provider TTS Talk attivo. Usa `elevenlabs`, `mlx` o `system` per i percorsi di riproduzione locali di macOS.                                                                                                                                                                                                                         |
| `providers.<id>.voiceId`                 | -                                          | ElevenLabs usa come ripiego `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` oppure la prima voce disponibile con una chiave API.                                                                                                                                                                                                              |
| `providers.elevenlabs.modelId`           | `eleven_v3`                                |                                                                                                                                                                                                                                                                                                                                      |
| `providers.mlx.modelId`                  | `mlx-community/Soprano-80M-bf16`           |                                                                                                                                                                                                                                                                                                                                      |
| `providers.elevenlabs.apiKey`            | -                                          | Usa come ripiego `ELEVENLABS_API_KEY` (o il profilo shell del Gateway, se disponibile).                                                                                                                                                                                                                                              |
| `speechLocale`                           | impostazione predefinita del dispositivo   | Identificatore delle impostazioni locali BCP 47 per il riconoscimento vocale Talk sul dispositivo in iOS/macOS.                                                                                                                                                                                                                      |
| `silenceTimeoutMs`                       | `700` ms macOS/Android, `900` ms iOS       | Intervallo di pausa prima che Talk invii la trascrizione.                                                                                                                                                                                                                                                                            |
| `interruptOnSpeech`                      | `true`                                     |                                                                                                                                                                                                                                                                                                                                      |
| `outputFormat`                           | `pcm_44100` macOS/iOS, `pcm_24000` Android | Imposta `mp3_*` per forzare lo streaming MP3.                                                                                                                                                                                                                                                                                         |
| `consultThinkingLevel`                   | non impostato                              | Sostituzione del livello di elaborazione per l'esecuzione dell'agente sottostante alle chiamate `openclaw_agent_consult` in tempo reale.                                                                                                                                                                                             |
| `consultFastMode`                        | non impostato                              | Sostituzione della modalità rapida per le chiamate `openclaw_agent_consult` in tempo reale.                                                                                                                                                                                                                                          |
| `realtime.provider`                      | -                                          | `openai` per WebRTC, `google` per il WebSocket del provider oppure un provider disponibile solo tramite bridge attraverso il relay del Gateway.                                                                                                                                                                                      |
| `realtime.providers.<id>`                | -                                          | Configurazione in tempo reale gestita dal provider. I browser ricevono solo credenziali di sessione temporanee/con limitazioni, mai una normale chiave API.                                                                                                                                                                          |
| `realtime.providers.openai.speakerVoice` | `alloy`                                    | Identificatore della voce OpenAI Realtime integrata (la chiave precedente `voice` continua a funzionare, ma è deprecata). Voci attuali di `gpt-realtime-2.1`: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `marin`, `sage`, `shimmer`, `verse`; `marin` e `cedar` sono consigliate per ottenere la qualità migliore. |
| `realtime.transport`                     | -                                          | `webrtc`: WebRTC OpenAI gestito dal client su iOS e nel browser. `provider-websocket`: gestito dal browser; su iOS resta sul relay del Gateway. `gateway-relay`: mantiene l'audio del provider sul Gateway; Android usa la modalità in tempo reale solo con questo trasporto.                                                            |
| `realtime.brain`                         | -                                          | `agent-consult` instrada le chiamate agli strumenti in tempo reale attraverso i criteri del Gateway; `direct-tools` è la compatibilità precedente con gli strumenti diretti; `none` è destinato alla trascrizione/orchestrazione esterna.                                                                                              |
| `realtime.consultRouting`                | -                                          | `provider-direct` conserva la risposta diretta del provider quando omette `openclaw_agent_consult`; `force-agent-consult` instrada invece le trascrizioni definitive dell'utente attraverso OpenClaw.                                                                                                                                |
| `realtime.instructions`                  | -                                          | Aggiunge istruzioni di sistema rivolte al provider al prompt in tempo reale integrato di OpenClaw (stile/tono della voce); le indicazioni predefinite di `openclaw_agent_consult` restano invariate.                                                                                                                                   |

`talk.catalog` espone gli ID canonici dei provider e gli alias del registro, le modalità/i trasporti/le strategie del brain/i formati audio in tempo reale/i flag delle funzionalità validi per ciascun provider e il risultato di disponibilità selezionato in fase di esecuzione. I client Talk proprietari devono consultare questo catalogo anziché gestire localmente gli alias dei provider; considera un Gateway meno recente che omette la disponibilità del gruppo come non verificato, anziché definitivamente non configurato. I provider di trascrizione in streaming vengono rilevati tramite `talk.catalog.transcription`; l'attuale relay del Gateway utilizza la configurazione del provider di streaming Voice Call finché non sarà disponibile una superficie di configurazione dedicata alla trascrizione di Talk.

## Interfaccia utente macOS

- Interruttore nella barra dei menu: **Talk**
- Scheda di configurazione: gruppo **Modalità Talk** (ID voce + interruttore per l'interruzione)
- Sovrimpressione: la sfera visualizza la forma d'onda universale di Talk (condivisa con iOS, watchOS e Android). Durante l'ascolto segue il livello del microfono in tempo reale, durante la riproduzione segue l'inviluppo effettivo della riproduzione TTS, mentre durante l'elaborazione pulsa delicatamente. Fai clic sulla sfera per mettere in pausa/riprendere, fai doppio clic per interrompere la riproduzione vocale e fai clic sulla X per uscire dalla modalità Talk.

## Interfaccia utente Android

- Interruttore della scheda Voce: **Talk**
- **Microfono** manuale e **Talk** sono modalità di acquisizione che si escludono a vicenda.
- Il microfono manuale e Talk in tempo reale preferiscono il microfono di una cuffia Bluetooth Classic o BLE connessa; se si disconnette, l'app richiede un altro ingresso da cuffia oppure torna al microfono predefinito, ripristinando la preferenza predefinita al termine dell'acquisizione.
- Il microfono manuale si arresta quando l'app non è più in primo piano o l'utente lascia la scheda Voce.
- La modalità Talk continua a funzionare finché non viene disattivata o il Node non si disconnette, utilizzando il tipo di servizio in primo piano per il microfono di Android mentre è attiva.
- Android supporta i formati di uscita `pcm_16000`, `pcm_22050`, `pcm_24000` e `pcm_44100` per lo streaming `AudioTrack` a bassa latenza.

## Note

- Richiede le autorizzazioni per il riconoscimento vocale e il microfono.
- Talk nativo utilizza la sessione attiva del Gateway e ricorre al polling della cronologia solo quando gli eventi di risposta non sono disponibili.
- Il Gateway gestisce la riproduzione di Talk tramite `talk.speak`, utilizzando il provider Talk attivo. Android ricorre al TTS locale di sistema solo quando tale RPC non è disponibile.
- La riproduzione MLX locale su macOS utilizza l'helper `openclaw-mlx-tts` incluso, se presente, oppure un eseguibile disponibile in `PATH`. Imposta `OPENCLAW_MLX_TTS_BIN` in modo che punti a un binario helper personalizzato durante lo sviluppo.
- Intervalli dei valori delle direttive vocali (ElevenLabs): `stability`, `similarity` e `style` accettano `0..1`; `speed` accetta `0.5..2`; `latency_tier` accetta `0..4`.

## Contenuti correlati

- [Attivazione vocale](/it/nodes/voicewake)
- [Audio e note vocali](/it/nodes/audio)
- [Comprensione dei contenuti multimediali](/it/nodes/media-understanding)
