---
read_when:
    - Modificare la trascrizione audio o la gestione dei contenuti multimediali
summary: Come le note audio/vocali in ingresso vengono scaricate, trascritte e inserite nelle risposte
title: Audio e note vocali
x-i18n:
    generated_at: "2026-05-06T08:57:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 520620da5a643bb8e17318d7304ae4be3bd2586b0866614ad741685de5b8ef05
    source_path: nodes/audio.md
    workflow: 16
---

# Audio / messaggi vocali (2026-01-17)

## Cosa funziona

- **Comprensione dei media (audio)**: se la comprensione audio è abilitata (o rilevata automaticamente), OpenClaw:
  1. Individua il primo allegato audio (percorso locale o URL) e lo scarica se necessario.
  2. Applica `maxBytes` prima dell'invio a ciascuna voce del modello.
  3. Esegue la prima voce del modello idonea in ordine (provider o CLI).
  4. Se fallisce o viene saltata (dimensione/timeout), prova la voce successiva.
  5. In caso di successo, sostituisce `Body` con un blocco `[Audio]` e imposta `{{Transcript}}`.
- **Analisi dei comandi**: quando la trascrizione riesce, `CommandBody`/`RawBody` vengono impostati sulla trascrizione, quindi i comandi slash continuano a funzionare.
- **Log dettagliati**: in `--verbose`, registriamo quando viene eseguita la trascrizione e quando sostituisce il corpo.

## Rilevamento automatico (predefinito)

Se **non configuri i modelli** e `tools.media.audio.enabled` **non** è impostato su `false`,
OpenClaw esegue il rilevamento automatico in questo ordine e si ferma alla prima opzione funzionante:

1. **Modello di risposta attivo** quando il suo provider supporta la comprensione audio.
2. **CLI locali** (se installate)
   - `sherpa-onnx-offline` (richiede `SHERPA_ONNX_MODEL_DIR` con encoder/decoder/joiner/tokens)
   - `whisper-cli` (da `whisper-cpp`; usa `WHISPER_CPP_MODEL` o il modello tiny incluso)
   - `whisper` (CLI Python; scarica automaticamente i modelli)
3. **CLI Gemini** (`gemini`) usando `read_many_files`
4. **Autenticazione del provider**
   - Le voci `models.providers.*` configurate che supportano l'audio vengono provate per prime
   - Ordine di fallback incluso: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral

Per disabilitare il rilevamento automatico, imposta `tools.media.audio.enabled: false`.
Per personalizzare, imposta `tools.media.audio.models`.
Nota: il rilevamento dei binari è best-effort su macOS/Linux/Windows; assicurati che la CLI sia in `PATH` (espandiamo `~`) oppure imposta un modello CLI esplicito con un percorso di comando completo.

## Esempi di configurazione

### Fallback provider + CLI (OpenAI + CLI Whisper)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        maxBytes: 20971520,
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          {
            type: "cli",
            command: "whisper",
            args: ["--model", "base", "{{MediaPath}}"],
            timeoutSeconds: 45,
          },
        ],
      },
    },
  },
}
```

### Solo provider con controllo dell'ambito

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        scope: {
          default: "allow",
          rules: [{ action: "deny", match: { chatType: "group" } }],
        },
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

### Solo provider (Deepgram)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "deepgram", model: "nova-3" }],
      },
    },
  },
}
```

### Solo provider (Mistral Voxtral)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

### Solo provider (SenseAudio)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "senseaudio", model: "senseaudio-asr-pro-1.5-260319" }],
      },
    },
  },
}
```

### Inviare la trascrizione nella chat (opt-in)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        echoTranscript: true, // default is false
        echoFormat: '📝 "{transcript}"', // optional, supports {transcript}
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

## Note e limiti

- L'autenticazione del provider segue l'ordine standard di autenticazione dei modelli (profili di autenticazione, variabili env, `models.providers.*.apiKey`).
- Dettagli di configurazione di Groq: [Groq](/it/providers/groq).
- Deepgram rileva `DEEPGRAM_API_KEY` quando viene usato `provider: "deepgram"`.
- Dettagli di configurazione di Deepgram: [Deepgram (trascrizione audio)](/it/providers/deepgram).
- Dettagli di configurazione di Mistral: [Mistral](/it/providers/mistral).
- SenseAudio rileva `SENSEAUDIO_API_KEY` quando viene usato `provider: "senseaudio"`.
- Dettagli di configurazione di SenseAudio: [SenseAudio](/it/providers/senseaudio).
- I provider audio possono sovrascrivere `baseUrl`, `headers` e `providerOptions` tramite `tools.media.audio`.
- Il limite di dimensione predefinito è 20 MB (`tools.media.audio.maxBytes`). L'audio troppo grande viene saltato per quel modello e viene provata la voce successiva.
- I file audio tiny/vuoti sotto i 1024 byte vengono saltati prima della trascrizione tramite provider/CLI.
- Il valore predefinito di `maxChars` per l'audio è **non impostato** (trascrizione completa). Imposta `tools.media.audio.maxChars` o `maxChars` per singola voce per troncare l'output.
- Il valore predefinito automatico di OpenAI è `gpt-4o-mini-transcribe`; imposta `model: "gpt-4o-transcribe"` per una precisione maggiore.
- Usa `tools.media.audio.attachments` per elaborare più messaggi vocali (`mode: "all"` + `maxAttachments`).
- La trascrizione è disponibile per i template come `{{Transcript}}`.
- `tools.media.audio.echoTranscript` è disattivato per impostazione predefinita; abilitalo per inviare la conferma della trascrizione alla chat di origine prima dell'elaborazione dell'agente.
- `tools.media.audio.echoFormat` personalizza il testo dell'eco (segnaposto: `{transcript}`).
- Lo stdout della CLI ha un limite (5 MB); mantieni conciso l'output della CLI.
- Gli `args` della CLI dovrebbero usare `{{MediaPath}}` per il percorso del file audio locale. Esegui `openclaw doctor --fix` per migrare i segnaposto deprecati `{input}` dalle configurazioni `audio.transcription.command` precedenti.

### Supporto dell'ambiente proxy

La trascrizione audio basata su provider rispetta le variabili env proxy standard in uscita:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

Se non sono impostate variabili env proxy, viene usata l'uscita diretta. Se la configurazione proxy non è valida, OpenClaw registra un avviso e torna al fetch diretto.

## Rilevamento delle menzioni nei gruppi

Quando `requireMention: true` è impostato per una chat di gruppo, OpenClaw ora trascrive l'audio **prima** di controllare le menzioni. Questo consente di elaborare i messaggi vocali anche quando contengono menzioni.

**Come funziona:**

1. Se un messaggio vocale non ha un corpo testuale e il gruppo richiede menzioni, OpenClaw esegue una trascrizione "preflight".
2. La trascrizione viene controllata per i pattern di menzione (ad es. `@BotName`, trigger emoji).
3. Se viene trovata una menzione, il messaggio procede attraverso la pipeline completa di risposta.
4. La trascrizione viene usata per il rilevamento delle menzioni, così i messaggi vocali possono superare il gate delle menzioni.

**Comportamento di fallback:**

- Se la trascrizione fallisce durante il preflight (timeout, errore API, ecc.), il messaggio viene elaborato in base al rilevamento delle menzioni solo testuale.
- Questo assicura che i messaggi misti (testo + audio) non vengano mai scartati erroneamente.

**Opt-out per gruppo/topic Telegram:**

- Imposta `channels.telegram.groups.<chatId>.disableAudioPreflight: true` per saltare i controlli preflight della trascrizione per le menzioni in quel gruppo.
- Imposta `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` per sovrascrivere per topic (`true` per saltare, `false` per forzare l'abilitazione).
- Il valore predefinito è `false` (preflight abilitato quando corrispondono le condizioni con gate di menzione).

**Esempio:** un utente invia un messaggio vocale dicendo "Hey @Claude, what's the weather?" in un gruppo Telegram con `requireMention: true`. Il messaggio vocale viene trascritto, la menzione viene rilevata e l'agente risponde.

## Aspetti da considerare

- Le regole di ambito usano la prima corrispondenza valida. `chatType` viene normalizzato in `direct`, `group` o `room`.
- Assicurati che la tua CLI termini con 0 e stampi testo semplice; il JSON deve essere adattato tramite `jq -r .text`.
- Per `parakeet-mlx`, se passi `--output-dir`, OpenClaw legge `<output-dir>/<media-basename>.txt` quando `--output-format` è `txt` (o omesso); i formati di output non `txt` tornano all'analisi dello stdout.
- Mantieni i timeout ragionevoli (`timeoutSeconds`, predefinito 60 s) per evitare di bloccare la coda di risposta.
- La trascrizione preflight elabora solo il **primo** allegato audio per il rilevamento delle menzioni. L'audio aggiuntivo viene elaborato durante la fase principale di comprensione dei media.

## Correlati

- [Comprensione dei media](/it/nodes/media-understanding)
- [Modalità conversazione](/it/nodes/talk)
- [Attivazione vocale](/it/nodes/voicewake)
