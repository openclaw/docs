---
read_when:
    - Modificare la trascrizione audio o la gestione dei media
summary: Come le note audio/vocali in ingresso vengono scaricate, trascritte e iniettate nelle risposte
title: Audio e note vocali
x-i18n:
    generated_at: "2026-04-24T08:48:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 464b569c97715e483c4bfc8074d2775965a0635149e0933c8e5b5d9c29d34269
    source_path: nodes/audio.md
    workflow: 15
---

# Audio / Note vocali (2026-01-17)

## Cosa funziona

- **Media understanding (audio)**: se l'analisi audio è abilitata (o rilevata automaticamente), OpenClaw:
  1. Individua il primo allegato audio (percorso locale o URL) e lo scarica se necessario.
  2. Applica `maxBytes` prima di inviarlo a ogni voce modello.
  3. Esegue la prima voce modello idonea in ordine (provider o CLI).
  4. Se fallisce o viene saltata (dimensione/timeout), prova la voce successiva.
  5. In caso di successo, sostituisce `Body` con un blocco `[Audio]` e imposta `{{Transcript}}`.
- **Parsing dei comandi**: quando la trascrizione ha successo, `CommandBody`/`RawBody` vengono impostati sulla trascrizione così i comandi slash continuano a funzionare.
- **Logging verbose**: in `--verbose`, registriamo quando viene eseguita la trascrizione e quando sostituisce il body.

## Rilevamento automatico (predefinito)

Se **non configuri modelli** e `tools.media.audio.enabled` **non** è impostato su `false`,
OpenClaw esegue il rilevamento automatico in questo ordine e si ferma alla prima opzione funzionante:

1. **Modello di risposta attivo** quando il suo provider supporta l'analisi audio.
2. **CLI locali** (se installate)
   - `sherpa-onnx-offline` (richiede `SHERPA_ONNX_MODEL_DIR` con encoder/decoder/joiner/tokens)
   - `whisper-cli` (da `whisper-cpp`; usa `WHISPER_CPP_MODEL` o il modello tiny incluso)
   - `whisper` (CLI Python; scarica automaticamente i modelli)
3. **Gemini CLI** (`gemini`) usando `read_many_files`
4. **Auth del provider**
   - Le voci `models.providers.*` configurate che supportano l'audio vengono provate per prime
   - Ordine di fallback incluso: OpenAI → Groq → Deepgram → Google → Mistral

Per disabilitare il rilevamento automatico, imposta `tools.media.audio.enabled: false`.
Per personalizzarlo, imposta `tools.media.audio.models`.
Nota: il rilevamento dei binari è best-effort su macOS/Linux/Windows; assicurati che la CLI sia nel `PATH` (espandiamo `~`), oppure imposta un modello CLI esplicito con un percorso completo del comando.

## Esempi di configurazione

### Fallback provider + CLI (OpenAI + Whisper CLI)

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

### Solo provider con gating dell'ambito

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

### Echo della trascrizione in chat (opt-in)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        echoTranscript: true, // il valore predefinito è false
        echoFormat: '📝 "{transcript}"', // facoltativo, supporta {transcript}
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

## Note e limiti

- L'auth del provider segue l'ordine standard di autenticazione del modello (profili auth, variabili env, `models.providers.*.apiKey`).
- Dettagli di configurazione Groq: [Groq](/it/providers/groq).
- Deepgram rileva `DEEPGRAM_API_KEY` quando viene usato `provider: "deepgram"`.
- Dettagli di configurazione Deepgram: [Deepgram (trascrizione audio)](/it/providers/deepgram).
- Dettagli di configurazione Mistral: [Mistral](/it/providers/mistral).
- I provider audio possono sovrascrivere `baseUrl`, `headers` e `providerOptions` tramite `tools.media.audio`.
- Il limite dimensionale predefinito è 20MB (`tools.media.audio.maxBytes`). Gli audio troppo grandi vengono saltati per quel modello e viene provata la voce successiva.
- I file audio minuscoli/vuoti sotto i 1024 byte vengono saltati prima della trascrizione provider/CLI.
- `maxChars` predefinito per l'audio è **non impostato** (trascrizione completa). Imposta `tools.media.audio.maxChars` o `maxChars` per voce per accorciare l'output.
- Il valore predefinito automatico di OpenAI è `gpt-4o-mini-transcribe`; imposta `model: "gpt-4o-transcribe"` per una precisione maggiore.
- Usa `tools.media.audio.attachments` per elaborare più note vocali (`mode: "all"` + `maxAttachments`).
- La trascrizione è disponibile per i template come `{{Transcript}}`.
- `tools.media.audio.echoTranscript` è disattivato per impostazione predefinita; abilitalo per inviare la conferma della trascrizione alla chat di origine prima dell'elaborazione dell'agente.
- `tools.media.audio.echoFormat` personalizza il testo di echo (placeholder: `{transcript}`).
- Lo stdout della CLI è limitato (5MB); mantieni conciso l'output della CLI.

### Supporto dell'ambiente proxy

La trascrizione audio basata su provider rispetta le variabili env proxy standard per il traffico in uscita:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Se non è impostata alcuna variabile env proxy, viene usata l'uscita diretta. Se la configurazione del proxy è malformata, OpenClaw registra un avviso e torna al fetch diretto.

## Rilevamento delle menzioni nei gruppi

Quando `requireMention: true` è impostato per una chat di gruppo, OpenClaw ora trascrive l'audio **prima** di controllare le menzioni. Questo permette di elaborare le note vocali anche quando contengono menzioni.

**Come funziona:**

1. Se un messaggio vocale non ha un body di testo e il gruppo richiede menzioni, OpenClaw esegue una trascrizione "preflight".
2. La trascrizione viene controllata rispetto ai pattern di menzione (ad esempio `@BotName`, trigger emoji).
3. Se viene trovata una menzione, il messaggio prosegue nella pipeline completa di risposta.
4. La trascrizione viene usata per il rilevamento delle menzioni così le note vocali possono superare il gate delle menzioni.

**Comportamento di fallback:**

- Se la trascrizione fallisce durante il preflight (timeout, errore API, ecc.), il messaggio viene elaborato in base al rilevamento delle menzioni solo sul testo.
- Questo garantisce che i messaggi misti (testo + audio) non vengano mai scartati erroneamente.

**Opt-out per gruppo/topic Telegram:**

- Imposta `channels.telegram.groups.<chatId>.disableAudioPreflight: true` per saltare i controlli di menzione sulla trascrizione preflight per quel gruppo.
- Imposta `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` per sovrascrivere per topic (`true` per saltare, `false` per forzare l'abilitazione).
- Il valore predefinito è `false` (preflight abilitato quando le condizioni di mention-gated corrispondono).

**Esempio:** un utente invia una nota vocale dicendo "Hey @Claude, che tempo fa?" in un gruppo Telegram con `requireMention: true`. La nota vocale viene trascritta, la menzione viene rilevata e l'agente risponde.

## Aspetti da tenere presenti

- Le regole di ambito usano first-match wins. `chatType` viene normalizzato in `direct`, `group` o `room`.
- Assicurati che la tua CLI termini con codice 0 e stampi testo semplice; il JSON deve essere adattato tramite `jq -r .text`.
- Per `parakeet-mlx`, se passi `--output-dir`, OpenClaw legge `<output-dir>/<media-basename>.txt` quando `--output-format` è `txt` (o omesso); i formati di output non `txt` tornano al parsing di stdout.
- Mantieni ragionevoli i timeout (`timeoutSeconds`, predefinito 60s) per evitare di bloccare la coda di risposta.
- La trascrizione preflight elabora solo il **primo** allegato audio per il rilevamento delle menzioni. Gli audio aggiuntivi vengono elaborati durante la fase principale di media understanding.

## Correlati

- [Media understanding](/it/nodes/media-understanding)
- [Modalità Talk](/it/nodes/talk)
- [Voice wake](/it/nodes/voicewake)
