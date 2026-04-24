---
read_when:
    - Implementazione della modalità talk su macOS/iOS/Android
    - Modifica del comportamento di voce/TTS/interruzione
summary: 'Modalità talk: conversazioni vocali continue con ElevenLabs TTS'
title: Modalità talk
x-i18n:
    generated_at: "2026-04-24T08:48:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 49286cd39a104d4514eb1df75627a2f64182313b11792bb246f471178a702198
    source_path: nodes/talk.md
    workflow: 15
---

La modalità talk è un ciclo continuo di conversazione vocale:

1. Ascolta il parlato
2. Invia la trascrizione al modello (sessione principale, `chat.send`)
3. Attende la risposta
4. La riproduce tramite il provider Talk configurato (`talk.speak`)

## Comportamento (macOS)

- **Overlay always-on** mentre la modalità talk è abilitata.
- Transizioni di fase **Ascolto → Elaborazione → Voce**.
- In caso di **breve pausa** (finestra di silenzio), la trascrizione corrente viene inviata.
- Le risposte vengono **scritte su WebChat** (come se fossero digitate).
- **Interruzione al parlato** (attiva per impostazione predefinita): se l'utente inizia a parlare mentre l'assistente sta parlando, interrompiamo la riproduzione e annotiamo il timestamp dell'interruzione per il prompt successivo.

## Direttive vocali nelle risposte

L'assistente può anteporre alla sua risposta una **singola riga JSON** per controllare la voce:

```json
{ "voice": "<voice-id>", "once": true }
```

Regole:

- Solo la prima riga non vuota.
- Le chiavi sconosciute vengono ignorate.
- `once: true` si applica solo alla risposta corrente.
- Senza `once`, la voce diventa il nuovo valore predefinito per la modalità talk.
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
    voiceId: "elevenlabs_voice_id",
    modelId: "eleven_v3",
    outputFormat: "mp3_44100_128",
    apiKey: "elevenlabs_api_key",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

Valori predefiniti:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: se non impostato, Talk mantiene la finestra di pausa predefinita della piattaforma prima di inviare la trascrizione (`700 ms su macOS e Android, 900 ms su iOS`)
- `voiceId`: usa come fallback `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` (oppure la prima voce ElevenLabs quando la chiave API è disponibile)
- `modelId`: il valore predefinito è `eleven_v3` se non impostato
- `apiKey`: usa come fallback `ELEVENLABS_API_KEY` (oppure il profilo shell del Gateway se disponibile)
- `outputFormat`: il valore predefinito è `pcm_44100` su macOS/iOS e `pcm_24000` su Android (imposta `mp3_*` per forzare lo streaming MP3)

## UI macOS

- Toggle nella barra dei menu: **Talk**
- Scheda Config: gruppo **Talk Mode** (ID voce + toggle di interruzione)
- Overlay:
  - **Ascolto**: la nuvola pulsa con il livello del microfono
  - **Elaborazione**: animazione di affondamento
  - **Voce**: anelli radianti
  - Clic sulla nuvola: interrompe la voce
  - Clic sulla X: esce dalla modalità talk

## Note

- Richiede i permessi Speech + Microphone.
- Usa `chat.send` con chiave di sessione `main`.
- Il Gateway risolve la riproduzione Talk tramite `talk.speak` usando il provider Talk attivo. Android usa come fallback il TTS locale di sistema solo quando quell'RPC non è disponibile.
- `stability` per `eleven_v3` viene validato su `0.0`, `0.5` o `1.0`; gli altri modelli accettano `0..1`.
- `latency_tier` viene validato su `0..4` quando impostato.
- Android supporta i formati di output `pcm_16000`, `pcm_22050`, `pcm_24000` e `pcm_44100` per lo streaming AudioTrack a bassa latenza.

## Correlati

- [Voice wake](/it/nodes/voicewake)
- [Audio e note vocali](/it/nodes/audio)
- [Comprensione dei media](/it/nodes/media-understanding)
