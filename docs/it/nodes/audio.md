---
read_when:
    - Modificare la trascrizione audio o la gestione dei contenuti multimediali
summary: Come vengono scaricati, trascritti e inseriti nelle risposte gli audio/le note vocali in ingresso
title: Audio e note vocali
x-i18n:
    generated_at: "2026-04-30T08:59:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 35074d79104f767ee252064462202a8ec21ac26f6db25c39e67f31f6b40edeb7
    source_path: nodes/audio.md
    workflow: 16
---

# Audio / Note vocali (2026-01-17)

## Cosa funziona

- **Comprensione multimediale (audio)**: se la comprensione dell'audio è abilitata (o rilevata automaticamente), OpenClaw:
  1. Individua il primo allegato audio (percorso locale o URL) e lo scarica se necessario.
  2. Applica `maxBytes` prima dell'invio a ogni voce di modello.
  3. Esegue la prima voce di modello idonea in ordine (provider o CLI).
  4. Se fallisce o viene saltata (dimensione/timeout), prova la voce successiva.
  5. In caso di successo, sostituisce `Body` con un blocco `[Audio]` e imposta `{{Transcript}}`.
- **Parsing dei comandi**: quando la trascrizione riesce, `CommandBody`/`RawBody` vengono impostati sulla trascrizione, quindi i comandi slash continuano a funzionare.
- **Logging dettagliato**: in `--verbose`, registriamo quando viene eseguita la trascrizione e quando sostituisce il corpo.

## Rilevamento automatico (predefinito)

Se **non configuri modelli** e `tools.media.audio.enabled` **non** è impostato su `false`,
OpenClaw rileva automaticamente in questo ordine e si ferma alla prima opzione funzionante:

1. **Modello di risposta attivo** quando il suo provider supporta la comprensione dell'audio.
2. **CLI locali** (se installate)
   - `sherpa-onnx-offline` (richiede `SHERPA_ONNX_MODEL_DIR` con encoder/decoder/joiner/tokens)
   - `whisper-cli` (da `whisper-cpp`; usa `WHISPER_CPP_MODEL` o il modello tiny incluso)
   - `whisper` (CLI Python; scarica automaticamente i modelli)
3. **CLI Gemini** (`gemini`) usando `read_many_files`
4. **Autenticazione dei provider**
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

### Solo provider con controllo dello scope

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

### Inviare la trascrizione alla chat (opt-in)

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

- L'autenticazione dei provider segue l'ordine standard di autenticazione dei modelli (profili di autenticazione, variabili env, `models.providers.*.apiKey`).
- Dettagli di configurazione di Groq: [Groq](/it/providers/groq).
- Deepgram rileva `DEEPGRAM_API_KEY` quando viene usato `provider: "deepgram"`.
- Dettagli di configurazione di Deepgram: [Deepgram (trascrizione audio)](/it/providers/deepgram).
- Dettagli di configurazione di Mistral: [Mistral](/it/providers/mistral).
- SenseAudio rileva `SENSEAUDIO_API_KEY` quando viene usato `provider: "senseaudio"`.
- Dettagli di configurazione di SenseAudio: [SenseAudio](/it/providers/senseaudio).
- I provider audio possono sovrascrivere `baseUrl`, `headers` e `providerOptions` tramite `tools.media.audio`.
- Il limite di dimensione predefinito è 20 MB (`tools.media.audio.maxBytes`). L'audio troppo grande viene saltato per quel modello e viene provata la voce successiva.
- I file audio minuscoli/vuoti sotto 1024 byte vengono saltati prima della trascrizione tramite provider/CLI.
- Il valore predefinito di `maxChars` per l'audio **non è impostato** (trascrizione completa). Imposta `tools.media.audio.maxChars` o `maxChars` per voce per troncare l'output.
- Il valore automatico predefinito di OpenAI è `gpt-4o-mini-transcribe`; imposta `model: "gpt-4o-transcribe"` per una precisione maggiore.
- Usa `tools.media.audio.attachments` per elaborare più note vocali (`mode: "all"` + `maxAttachments`).
- La trascrizione è disponibile per i template come `{{Transcript}}`.
- `tools.media.audio.echoTranscript` è disattivato per impostazione predefinita; abilitalo per inviare una conferma della trascrizione alla chat di origine prima dell'elaborazione dell'agente.
- `tools.media.audio.echoFormat` personalizza il testo dell'echo (segnaposto: `{transcript}`).
- Lo stdout della CLI è limitato (5 MB); mantieni conciso l'output della CLI.
- Gli `args` della CLI devono usare `{{MediaPath}}` per il percorso del file audio locale. Esegui `openclaw doctor --fix` per migrare i segnaposto `{input}` deprecati dalle configurazioni `audio.transcription.command` precedenti.

### Supporto dell'ambiente proxy

La trascrizione audio basata su provider rispetta le variabili env proxy outbound standard:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

Se non sono impostate variabili env proxy, viene usata l'uscita diretta. Se la configurazione proxy non è valida, OpenClaw registra un avviso e torna al fetch diretto.

## Rilevamento delle menzioni nei gruppi

Quando `requireMention: true` è impostato per una chat di gruppo, OpenClaw ora trascrive l'audio **prima** di controllare le menzioni. Questo consente di elaborare le note vocali anche quando contengono menzioni.

**Come funziona:**

1. Se un messaggio vocale non ha un corpo testuale e il gruppo richiede menzioni, OpenClaw esegue una trascrizione di "preflight".
2. La trascrizione viene controllata per individuare pattern di menzione (ad es. `@BotName`, trigger emoji).
3. Se viene trovata una menzione, il messaggio procede attraverso la pipeline completa di risposta.
4. La trascrizione viene usata per il rilevamento delle menzioni, così le note vocali possono superare il gate delle menzioni.

**Comportamento di fallback:**

- Se la trascrizione fallisce durante il preflight (timeout, errore API, ecc.), il messaggio viene elaborato in base al rilevamento delle menzioni solo testuale.
- Questo garantisce che i messaggi misti (testo + audio) non vengano mai scartati erroneamente.

**Opt-out per gruppo/topic Telegram:**

- Imposta `channels.telegram.groups.<chatId>.disableAudioPreflight: true` per saltare i controlli di menzione sulla trascrizione preflight per quel gruppo.
- Imposta `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` per sovrascrivere per topic (`true` per saltare, `false` per forzare l'abilitazione).
- Il valore predefinito è `false` (preflight abilitato quando le condizioni con gate sulle menzioni corrispondono).

**Esempio:** un utente invia una nota vocale che dice "Hey @Claude, what's the weather?" in un gruppo Telegram con `requireMention: true`. La nota vocale viene trascritta, la menzione viene rilevata e l'agente risponde.

## Aspetti a cui prestare attenzione

- Le regole di scope usano la prima corrispondenza vincente. `chatType` viene normalizzato in `direct`, `group` o `room`.
- Assicurati che la CLI termini con 0 e stampi testo semplice; JSON deve essere adattato tramite `jq -r .text`.
- Per `parakeet-mlx`, se passi `--output-dir`, OpenClaw legge `<output-dir>/<media-basename>.txt` quando `--output-format` è `txt` (o omesso); i formati di output non `txt` ripiegano sul parsing di stdout.
- Mantieni timeout ragionevoli (`timeoutSeconds`, predefinito 60s) per evitare di bloccare la coda delle risposte.
- La trascrizione preflight elabora solo il **primo** allegato audio per il rilevamento delle menzioni. L'audio aggiuntivo viene elaborato durante la fase principale di comprensione multimediale.

## Correlati

- [Comprensione multimediale](/it/nodes/media-understanding)
- [Modalità conversazione](/it/nodes/talk)
- [Attivazione vocale](/it/nodes/voicewake)
