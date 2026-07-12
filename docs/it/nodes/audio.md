---
read_when:
    - Modifica della trascrizione audio o della gestione dei contenuti multimediali
summary: Come vengono scaricati, trascritti e inseriti nelle risposte l’audio in ingresso e i messaggi vocali
title: Audio e note vocali
x-i18n:
    generated_at: "2026-07-12T07:11:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb382f4219620d906bfa76ebddc690b174a3b24f80f815be92e915b363d17792
    source_path: nodes/audio.md
    workflow: 16
---

## Funzionamento

Quando la comprensione audio è abilitata (o rilevata automaticamente), OpenClaw:

1. Individua il primo allegato audio (percorso locale o URL) e lo scarica, se necessario.
2. Applica `maxBytes` prima dell'invio a ciascuna voce di modello.
3. Esegue in ordine la prima voce di modello idonea (provider o CLI); se una voce non riesce o viene ignorata (dimensione/timeout), prova quella successiva.
4. In caso di esito positivo, sostituisce `Body` con un blocco `[Audio]` e imposta `{{Transcript}}`.

Quando la trascrizione riesce, anche `CommandBody`/`RawBody` vengono impostati sulla trascrizione, affinché i comandi slash continuino a funzionare. Con `--verbose`, i log mostrano quando viene eseguita la trascrizione e quando sostituisce il corpo.

## Rilevamento automatico (predefinito)

Se non hai configurato modelli e `tools.media.audio.enabled` non è `false`, OpenClaw esegue il rilevamento automatico nell'ordine seguente e si arresta alla prima opzione funzionante:

1. **Modello di risposta attivo**, quando il relativo provider supporta la comprensione audio.
2. **Autenticazione del provider configurata** — qualsiasi voce `models.providers.*` con autenticazione disponibile per un provider che supporta la trascrizione audio. Questa verifica avviene prima delle CLI locali, quindi una chiave API configurata ha sempre la precedenza su un binario locale in `PATH`.
   Priorità dei provider quando ne sono configurati più di uno: Groq, OpenAI, xAI, Deepgram, Google, SenseAudio, ElevenLabs, Mistral.
3. **CLI locali** (solo se non è stata risolta alcuna autenticazione del provider). OpenClaw crea un elenco ordinato di opzioni di ripiego:
   - `whisper-cli`, prima delle opzioni CPU predefinite solo quando una precedente invocazione del modello nel processo corrente ha rilevato Metal o CUDA
   - `sherpa-onnx-offline` con il relativo provider CPU predefinito (richiede `SHERPA_ONNX_MODEL_DIR` con `tokens.txt`, `encoder.onnx`, `decoder.onnx` e `joiner.onnx`)
   - `whisper-cli` quando Metal/CUDA è soltanto supportato dalla compilazione o il backend selezionato non è stato altrimenti rilevato
   - `parakeet-mlx` su Apple Silicon (compatibile con MLX; l'uso del dispositivo rimane non rilevato)
   - `whisper` (CLI Python; scarica automaticamente i modelli)

La provenienza dell'installazione o del collegamento costituisce una prova di capacità, non di esecuzione. Da sola non antepone mai un candidato a sherpa su CPU. OpenClaw non carica un modello durante la configurazione o i controlli di stato soltanto per verificare un backend.
whisper.cpp rilevato automaticamente mantiene abilitati i normali log di esecuzione del modello, affinché OpenClaw possa registrare la riga `using … backend` del progetto upstream. Le voci CLI esplicite mantengono i flag di output configurati.

Il rilevamento automatico della CLI Gemini per la comprensione dei contenuti multimediali è stato sostituito da un'opzione di ripiego basata sulla CLI Antigravity (`agy`) in sandbox per immagini e video; per l'audio non viene usata alcuna opzione CLI di ripiego oltre ai binari locali indicati sopra.

Per disabilitare il rilevamento automatico, imposta `tools.media.audio.enabled: false`. Per personalizzarlo, imposta `tools.media.audio.models`.

<Note>
Il rilevamento dei binari è basato sul massimo sforzo possibile su macOS/Linux/Windows. Assicurati che la CLI sia in `PATH` (`~` viene espanso) oppure imposta un modello CLI esplicito con il percorso completo del comando.
</Note>

Esamina la selezione locale senza trascrivere l'audio:

```bash
openclaw capability audio providers
openclaw doctor --lint --only core/doctor/local-audio-acceleration --severity-min info
```

L'inventario dei provider indica separatamente l'opzione locale di ripiego selezionata e la selezione globale del provider, oltre ai campi relativi ai backend compatibili, richiesti e rilevati. Dopo l'esecuzione della trascrizione, `/status` indica nella riga dei contenuti multimediali il backend richiesto o rilevato. Le voci CLI esplicite in `tools.media.audio.models` continuano a ignorare la selezione automatica; usa i rispettivi flag specifici del backend, come `--provider=cuda` di sherpa o `--no-gpu`/`--device` di whisper.cpp.

## Esempi di configurazione

### Provider + opzione CLI di ripiego (OpenAI + CLI Whisper)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        maxBytes: 20971520,
        models: [
          { provider: "openai", model: "gpt-4o-transcribe" },
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

### Solo provider con limitazione dell'ambito

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
        models: [{ provider: "openai", model: "gpt-4o-transcribe" }],
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

### Invio della trascrizione nella chat (facoltativo)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        echoTranscript: true, // il valore predefinito è false
        echoFormat: '📝 "{transcript}"', // facoltativo, supporta {transcript}
        models: [{ provider: "openai", model: "gpt-4o-transcribe" }],
      },
    },
  },
}
```

## Note e limitazioni

- L'autenticazione del provider segue l'ordine standard di autenticazione dei modelli (profili di autenticazione, variabili di ambiente, `models.providers.*.apiKey`).
- Dettagli sulla configurazione di Groq: [Groq](/it/providers/groq).
- Deepgram usa `DEEPGRAM_API_KEY` quando viene utilizzato `provider: "deepgram"`. Dettagli sulla configurazione: [Deepgram](/it/providers/deepgram).
- Dettagli sulla configurazione di Mistral: [Mistral](/it/providers/mistral).
- SenseAudio usa `SENSEAUDIO_API_KEY` quando viene utilizzato `provider: "senseaudio"`. Dettagli sulla configurazione: [SenseAudio](/it/providers/senseaudio).
- I provider audio possono sostituire `baseUrl`, `headers` e `providerOptions` tramite `tools.media.audio`.
- Il limite di dimensione predefinito è 20 MB (`tools.media.audio.maxBytes`). L'audio che supera il limite viene ignorato per quel modello e viene provata la voce successiva.
- I file audio inferiori a 1024 byte vengono ignorati prima della trascrizione tramite provider/CLI.
- Il valore predefinito di `maxChars` per l'audio è **non impostato** (trascrizione completa). Imposta `tools.media.audio.maxChars` o un valore `maxChars` per singola voce per troncare l'output.
- Il valore predefinito del rilevamento automatico di OpenAI è `gpt-4o-transcribe`; imposta `model: "gpt-4o-mini-transcribe"` per un'opzione più economica e veloce.
- Usa `tools.media.audio.attachments` per elaborare più note vocali (`mode: "all"` insieme a `maxAttachments`, valore predefinito 1).
- La trascrizione è disponibile per i modelli tramite `{{Transcript}}`.
- `tools.media.audio.echoTranscript` è disabilitato per impostazione predefinita; abilitalo per inviare una conferma della trascrizione alla chat di origine prima dell'elaborazione da parte dell'agente.
- `tools.media.audio.echoFormat` personalizza il testo della conferma (segnaposto: `{transcript}`; valore predefinito `📝 "{transcript}"`).
- Lo stdout della CLI è limitato a 5 MB; mantieni conciso l'output della CLI.
- Gli `args` della CLI devono usare `{{MediaPath}}` per il percorso del file audio locale. Esegui `openclaw doctor --fix` per migrare i segnaposto `{input}` deprecati dalle configurazioni `audio.transcription.command` meno recenti (chiave ritirata: `audio.transcription`, sostituita da `tools.media.audio.models`).
- `tools.media.concurrency` limita le attività multimediali; non è uno scheduler per GPU.

### STT locale residente

L'STT locale rilevato automaticamente continua a usare un processo per richiesta. OpenClaw attualmente non gestisce un server whisper.cpp residente perché il pacchetto standard Homebrew `whisper-cpp` disabilita tale server, mentre l'esempio upstream non dispone di una coda di ammissione limitata configurata. Prima di poter essere abilitato in sicurezza, un ciclo di vita residente gestito da un Plugin richiede un worker distribuito e mantenuto, dotato di controlli di integrità e avvio, permanenza del modello in memoria, accodamento limitato, annullamento/timeout, funzionamento senza autenticazione esclusivamente tramite local loopback e nessuna opzione cloud di ripiego.

### Supporto delle variabili di ambiente per proxy

La trascrizione audio basata su provider rispetta le variabili di ambiente standard per i proxy in uscita, conformemente alla semantica di `EnvHttpProxyAgent` di undici:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `ALL_PROXY` / `all_proxy`

Le variabili in minuscolo hanno la precedenza su quelle in maiuscolo; le voci `NO_PROXY`/`no_proxy` (nomi host, `*.suffix` o `host:port`) ignorano il proxy. Se non è impostata alcuna variabile di ambiente per il proxy, viene usata un'uscita diretta. Se la configurazione del proxy non riesce (URL non valido), OpenClaw registra un avviso e torna al recupero diretto.

## Rilevamento delle menzioni nei gruppi

Nei canali che supportano la verifica preliminare dell'audio, OpenClaw trascrive l'audio **prima** di verificare le menzioni quando per una chat di gruppo è impostato `requireMention: true`. Ciò consente a una nota vocale senza didascalia di superare il controllo delle menzioni quando la trascrizione contiene un modello di menzione configurato. La documentazione specifica dei canali descrive i trasporti che richiedono invece una menzione digitata.

**Funzionamento:**

1. Se un messaggio vocale non contiene un corpo testuale e il gruppo richiede menzioni, OpenClaw esegue una trascrizione preliminare del primo allegato audio.
2. La trascrizione viene controllata alla ricerca di modelli di menzione (ad esempio `@BotName`, attivatori emoji).
3. Se viene trovata una menzione, il messaggio prosegue attraverso la pipeline di risposta completa.

**Comportamento di ripiego:** se la trascrizione preliminare non riesce (timeout, errore API e così via), il messaggio torna al rilevamento delle menzioni basato sul solo testo, affinché i messaggi misti (testo + audio) non vengano mai scartati.

**Disattivazione per gruppo/argomento Telegram:**

- Imposta `channels.telegram.groups.<chatId>.disableAudioPreflight: true` per ignorare i controlli preliminari delle menzioni nella trascrizione per quel gruppo.
- Imposta `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` per sostituire l'impostazione per singolo argomento (`true` per ignorare, `false` per forzare l'abilitazione).
- Il valore predefinito è `false` (verifica preliminare abilitata quando corrispondono le condizioni che richiedono una menzione).

**Esempio:** un utente invia una nota vocale dicendo "Ehi @Claude, che tempo fa?" in un gruppo Telegram con `requireMention: true`. La nota vocale viene trascritta, la menzione viene rilevata e l'agente risponde.

## Aspetti da considerare

- Le regole di ambito usano la prima corrispondenza; `chatType` viene normalizzato in `direct`, `group` o `channel`.
- Assicurati che la CLI termini con codice 0 e stampi testo normale; l'output JSON deve essere rielaborato tramite `jq -r .text`.
- Le modalità note di output su file sono autorevoli: un file di trascrizione dedotto vuoto o mancante non produce alcuna trascrizione, anziché ricorrere all'output di avanzamento della CLI.
- Per `parakeet-mlx`, usa `--output-format txt` (o `all`) con `--output-dir` e il modello di output predefinito `{filename}`. Sono supportate anche le variabili di ambiente upstream `PARAKEET_OUTPUT_FORMAT` e `PARAKEET_OUTPUT_TEMPLATE`. OpenClaw legge `<output-dir>/<media-basename>.txt`; il formato predefinito `srt`, gli altri formati e i modelli di output personalizzati continuano a usare stdout.
- Mantieni timeout ragionevoli (`timeoutSeconds`, valore predefinito 60 s) per evitare di bloccare la coda delle risposte.
- La trascrizione preliminare elabora soltanto il **primo** allegato audio per il rilevamento delle menzioni. Gli allegati audio aggiuntivi vengono elaborati durante la fase principale di comprensione dei contenuti multimediali.

## Voci correlate

- [Comprensione dei contenuti multimediali](/it/nodes/media-understanding)
- [Modalità conversazione](/it/nodes/talk)
- [Attivazione vocale](/it/nodes/voicewake)
