---
read_when:
    - Modifica della trascrizione audio o della gestione dei media
summary: Come l'audio in ingresso e le note vocali vengono scaricati, trascritti e iniettati nelle risposte
title: Audio e note vocali
x-i18n:
    generated_at: "2026-04-05T13:57:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: dd464df24268b1104c9bbdb6f424ba90747342b4c0f4d2e39d95055708cbd0ae
    source_path: nodes/audio.md
    workflow: 15
---

# Audio / Note vocali (2026-01-17)

## Cosa funziona

- **Comprensione dei media (audio)**: se la comprensione audio è abilitata (o rilevata automaticamente), OpenClaw:
  1. Individua il primo allegato audio (percorso locale o URL) e lo scarica se necessario.
  2. Applica `maxBytes` prima di inviarlo a ciascuna voce di modello.
  3. Esegue la prima voce di modello idonea in ordine (provider o CLI).
  4. Se fallisce o viene saltata (dimensione/timeout), prova la voce successiva.
  5. In caso di successo, sostituisce `Body` con un blocco `[Audio]` e imposta `{{Transcript}}`.
- **Parsing dei comandi**: quando la trascrizione riesce, `CommandBody`/`RawBody` vengono impostati sul transcript così i comandi slash continuano a funzionare.
- **Logging dettagliato**: in `--verbose`, registriamo quando la trascrizione viene eseguita e quando sostituisce il body.

## Rilevamento automatico (predefinito)

Se **non configuri modelli** e `tools.media.audio.enabled` **non** è impostato su `false`,
OpenClaw esegue il rilevamento automatico in questo ordine e si ferma alla prima opzione funzionante:

1. **Modello di risposta attivo** quando il suo provider supporta la comprensione audio.
2. **CLI locali** (se installate)
   - `sherpa-onnx-offline` (richiede `SHERPA_ONNX_MODEL_DIR` con encoder/decoder/joiner/tokens)
   - `whisper-cli` (da `whisper-cpp`; usa `WHISPER_CPP_MODEL` o il modello tiny incluso)
   - `whisper` (CLI Python; scarica automaticamente i modelli)
3. **Gemini CLI** (`gemini`) tramite `read_many_files`
4. **Autenticazione provider**
   - Le voci configurate in `models.providers.*` che supportano l'audio vengono provate per prime
   - Ordine di fallback incluso: OpenAI → Groq → Deepgram → Google → Mistral

Per disabilitare il rilevamento automatico, imposta `tools.media.audio.enabled: false`.
Per personalizzarlo, imposta `tools.media.audio.models`.
Nota: il rilevamento dei binari è best-effort su macOS/Linux/Windows; assicurati che la CLI sia nel `PATH` (espandiamo `~`), oppure imposta un modello CLI esplicito con un percorso completo del comando.

## Esempi di configurazione

### Provider + fallback CLI (OpenAI + Whisper CLI)

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

### Solo provider con gating degli scope

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

### Ripeti il transcript nella chat (opt-in)

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

- L'autenticazione del provider segue l'ordine standard di autenticazione del modello (profili auth, variabili d'ambiente, `models.providers.*.apiKey`).
- Dettagli di configurazione di Groq: [Groq](/providers/groq).
- Deepgram usa `DEEPGRAM_API_KEY` quando viene usato `provider: "deepgram"`.
- Dettagli di configurazione di Deepgram: [Deepgram (trascrizione audio)](/providers/deepgram).
- Dettagli di configurazione di Mistral: [Mistral](/providers/mistral).
- I provider audio possono sovrascrivere `baseUrl`, `headers` e `providerOptions` tramite `tools.media.audio`.
- Il limite dimensionale predefinito è 20MB (`tools.media.audio.maxBytes`). L'audio sovradimensionato viene saltato per quel modello e viene provata la voce successiva.
- I file audio minuscoli/vuoti sotto 1024 byte vengono saltati prima della trascrizione provider/CLI.
- Il valore predefinito di `maxChars` per l'audio è **non impostato** (transcript completo). Imposta `tools.media.audio.maxChars` o `maxChars` per voce per tagliare l'output.
- Il valore predefinito automatico di OpenAI è `gpt-4o-mini-transcribe`; imposta `model: "gpt-4o-transcribe"` per una precisione maggiore.
- Usa `tools.media.audio.attachments` per elaborare più note vocali (`mode: "all"` + `maxAttachments`).
- Il transcript è disponibile per i template come `{{Transcript}}`.
- `tools.media.audio.echoTranscript` è disattivato per impostazione predefinita; abilitalo per inviare la conferma della trascrizione alla chat di origine prima dell'elaborazione dell'agente.
- `tools.media.audio.echoFormat` personalizza il testo ripetuto (segnaposto: `{transcript}`).
- Lo stdout della CLI è limitato (5MB); mantieni conciso l'output della CLI.

### Supporto per l'ambiente proxy

La trascrizione audio basata su provider rispetta le variabili d'ambiente standard per il proxy in uscita:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Se non è impostata alcuna variabile d'ambiente proxy, viene usata un'uscita diretta. Se la configurazione del proxy è malformata, OpenClaw registra un avviso e torna al fetch diretto.

## Rilevamento delle mention nei gruppi

Quando `requireMention: true` è impostato per una chat di gruppo, OpenClaw ora trascrive l'audio **prima** di controllare le mention. Questo consente di elaborare le note vocali anche quando contengono mention.

**Come funziona:**

1. Se un messaggio vocale non ha corpo testuale e il gruppo richiede mention, OpenClaw esegue una trascrizione "preflight".
2. Il transcript viene controllato per i pattern di mention (ad esempio `@BotName`, trigger emoji).
3. Se viene trovata una mention, il messaggio prosegue attraverso l'intera pipeline di risposta.
4. Il transcript viene usato per il rilevamento delle mention così le note vocali possono superare il gate delle mention.

**Comportamento di fallback:**

- Se la trascrizione fallisce durante il preflight (timeout, errore API, ecc.), il messaggio viene elaborato in base al rilevamento delle mention solo testuale.
- Questo assicura che i messaggi misti (testo + audio) non vengano mai scartati erroneamente.

**Opt-out per gruppo/topic Telegram:**

- Imposta `channels.telegram.groups.<chatId>.disableAudioPreflight: true` per saltare i controlli delle mention sul transcript preflight per quel gruppo.
- Imposta `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` per sovrascrivere per topic (`true` per saltare, `false` per forzare l'abilitazione).
- Il valore predefinito è `false` (preflight abilitato quando corrispondono le condizioni con gating delle mention).

**Esempio:** un utente invia una nota vocale dicendo "Hey @Claude, what's the weather?" in un gruppo Telegram con `requireMention: true`. La nota vocale viene trascritta, la mention viene rilevata e l'agente risponde.

## Insidie

- Le regole di scope usano first-match wins. `chatType` viene normalizzato in `direct`, `group` o `room`.
- Assicurati che la tua CLI termini con codice 0 e stampi testo semplice; il JSON deve essere adattato tramite `jq -r .text`.
- Per `parakeet-mlx`, se passi `--output-dir`, OpenClaw legge `<output-dir>/<media-basename>.txt` quando `--output-format` è `txt` (o omesso); i formati di output diversi da `txt` tornano al parsing dello stdout.
- Mantieni ragionevoli i timeout (`timeoutSeconds`, predefinito 60s) per evitare di bloccare la coda di risposta.
- La trascrizione preflight elabora solo il **primo** allegato audio per il rilevamento delle mention. L'audio aggiuntivo viene elaborato durante la fase principale di comprensione dei media.
