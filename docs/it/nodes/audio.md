---
read_when:
    - Modificare la trascrizione audio o la gestione dei media
summary: Come le note audio/vocali in ingresso vengono scaricate, trascritte e inserite nelle risposte
title: Audio e note vocali
x-i18n:
    generated_at: "2026-05-06T17:58:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: baa96453ce279d05933281eafe930e3573c5cbe694cec8704b1d064f4b0de242
    source_path: nodes/audio.md
    workflow: 16
---

## Cosa funziona

- **Comprensione dei media (audio)**: Se la comprensione dell'audio è abilitata (o rilevata automaticamente), OpenClaw:
  1. Individua il primo allegato audio (percorso locale o URL) e lo scarica se necessario.
  2. Applica `maxBytes` prima dell'invio a ciascuna voce del modello.
  3. Esegue in ordine la prima voce di modello idonea (provider o CLI).
  4. Se fallisce o viene saltata (dimensione/timeout), prova la voce successiva.
  5. In caso di successo, sostituisce `Body` con un blocco `[Audio]` e imposta `{{Transcript}}`.
- **Analisi dei comandi**: Quando la trascrizione riesce, `CommandBody`/`RawBody` vengono impostati sulla trascrizione, quindi i comandi slash continuano a funzionare.
- **Log dettagliati**: In `--verbose`, registriamo quando la trascrizione viene eseguita e quando sostituisce il corpo.

## Rilevamento automatico (predefinito)

Se **non configuri modelli** e `tools.media.audio.enabled` **non** è impostato su `false`,
OpenClaw esegue il rilevamento automatico in quest'ordine e si ferma alla prima opzione funzionante:

1. **Modello di risposta attivo** quando il suo provider supporta la comprensione dell'audio.
2. **CLI locali** (se installate)
   - `sherpa-onnx-offline` (richiede `SHERPA_ONNX_MODEL_DIR` con encoder/decoder/joiner/tokens)
   - `whisper-cli` (da `whisper-cpp`; usa `WHISPER_CPP_MODEL` o il modello tiny incluso)
   - `whisper` (CLI Python; scarica automaticamente i modelli)
3. **Gemini CLI** (`gemini`) usando `read_many_files`
4. **Autenticazione del provider**
   - Le voci `models.providers.*` configurate che supportano l'audio vengono provate per prime
   - Ordine di ripiego incluso: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral

Per disabilitare il rilevamento automatico, imposta `tools.media.audio.enabled: false`.
Per personalizzare, imposta `tools.media.audio.models`.
Nota: il rilevamento dei binari è di tipo best effort su macOS/Linux/Windows; assicurati che la CLI sia in `PATH` (espandiamo `~`), oppure imposta un modello CLI esplicito con un percorso di comando completo.

## Esempi di configurazione

### Provider + ripiego CLI (OpenAI + Whisper CLI)

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

### Solo provider con controllo per ambito

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

### Ripeti la trascrizione nella chat (opt-in)

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

- L'autenticazione del provider segue l'ordine standard di autenticazione dei modelli (profili di autenticazione, variabili di ambiente, `models.providers.*.apiKey`).
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
- Il valore automatico predefinito di OpenAI è `gpt-4o-mini-transcribe`; imposta `model: "gpt-4o-transcribe"` per una maggiore accuratezza.
- Usa `tools.media.audio.attachments` per elaborare più note vocali (`mode: "all"` + `maxAttachments`).
- La trascrizione è disponibile per i template come `{{Transcript}}`.
- `tools.media.audio.echoTranscript` è disattivato per impostazione predefinita; abilitalo per inviare una conferma della trascrizione alla chat di origine prima dell'elaborazione dell'agente.
- `tools.media.audio.echoFormat` personalizza il testo dell'eco (segnaposto: `{transcript}`).
- Lo stdout della CLI è limitato (5 MB); mantieni conciso l'output della CLI.
- Gli `args` della CLI dovrebbero usare `{{MediaPath}}` per il percorso del file audio locale. Esegui `openclaw doctor --fix` per migrare i segnaposto `{input}` deprecati dalle configurazioni `audio.transcription.command` meno recenti.

### Supporto dell'ambiente proxy

La trascrizione audio basata su provider rispetta le variabili di ambiente proxy in uscita standard:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

Se non sono impostate variabili di ambiente proxy, viene usata l'uscita diretta. Se la configurazione proxy non è valida, OpenClaw registra un avviso e ricade sul recupero diretto.

## Rilevamento delle menzioni nei gruppi

Quando `requireMention: true` è impostato per una chat di gruppo, OpenClaw ora trascrive l'audio **prima** di controllare le menzioni. Questo consente di elaborare le note vocali anche quando contengono menzioni.

**Come funziona:**

1. Se un messaggio vocale non ha un corpo testuale e il gruppo richiede menzioni, OpenClaw esegue una trascrizione "preflight".
2. La trascrizione viene controllata per cercare pattern di menzione (ad esempio, `@BotName`, trigger emoji).
3. Se viene trovata una menzione, il messaggio procede attraverso la pipeline completa di risposta.
4. La trascrizione viene usata per il rilevamento delle menzioni, così le note vocali possono superare il controllo delle menzioni.

**Comportamento di ripiego:**

- Se la trascrizione fallisce durante il preflight (timeout, errore API, ecc.), il messaggio viene elaborato in base al rilevamento delle menzioni solo testuale.
- Questo garantisce che i messaggi misti (testo + audio) non vengano mai scartati in modo errato.

**Opt-out per gruppo/topic Telegram:**

- Imposta `channels.telegram.groups.<chatId>.disableAudioPreflight: true` per saltare i controlli delle menzioni nella trascrizione preflight per quel gruppo.
- Imposta `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` per sovrascrivere per topic (`true` per saltare, `false` per forzare l'abilitazione).
- Il valore predefinito è `false` (preflight abilitato quando le condizioni con controllo di menzione corrispondono).

**Esempio:** Un utente invia una nota vocale dicendo "Hey @Claude, che tempo fa?" in un gruppo Telegram con `requireMention: true`. La nota vocale viene trascritta, la menzione viene rilevata e l'agente risponde.

## Aspetti da considerare

- Le regole di ambito usano la prima corrispondenza valida. `chatType` viene normalizzato in `direct`, `group` o `room`.
- Assicurati che la tua CLI termini con codice 0 e stampi testo semplice; JSON deve essere adattato tramite `jq -r .text`.
- Per `parakeet-mlx`, se passi `--output-dir`, OpenClaw legge `<output-dir>/<media-basename>.txt` quando `--output-format` è `txt` (o omesso); i formati di output non `txt` ricadono sull'analisi dello stdout.
- Mantieni i timeout ragionevoli (`timeoutSeconds`, predefinito 60 s) per evitare di bloccare la coda delle risposte.
- La trascrizione preflight elabora solo il **primo** allegato audio per il rilevamento delle menzioni. L'audio aggiuntivo viene elaborato durante la fase principale di comprensione dei media.

## Correlati

- [Comprensione dei media](/it/nodes/media-understanding)
- [Modalità conversazione](/it/nodes/talk)
- [Attivazione vocale](/it/nodes/voicewake)
