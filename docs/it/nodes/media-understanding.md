---
read_when:
    - Progettazione o refactoring di Media Understanding
    - Regolazione del pre-processing in ingresso di audio/video/immagini
summary: Comprensione in ingresso di immagini/audio/video (facoltativa) con fallback provider + CLI
title: Media Understanding
x-i18n:
    generated_at: "2026-04-23T08:30:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5bb2d0eab59d857c2849f329435f8fad3eeff427f7984d011bd5b7d9fd7bf51c
    source_path: nodes/media-understanding.md
    workflow: 15
---

# Media Understanding - Inbound (2026-01-17)

OpenClaw può **riassumere i media in ingresso** (immagine/audio/video) prima che venga eseguita la pipeline di risposta. Rileva automaticamente quando sono disponibili strumenti locali o chiavi provider e può essere disabilitato o personalizzato. Se la comprensione è disattivata, i modelli ricevono comunque i file/URL originali come sempre.

Il comportamento media specifico del vendor viene registrato dai plugin vendor, mentre il
core di OpenClaw gestisce la configurazione condivisa `tools.media`, l’ordine di fallback e l’integrazione nella pipeline di risposta.

## Obiettivi

- Facoltativo: pre-digerire i media in ingresso in testo breve per instradamento più rapido + migliore parsing dei comandi.
- Preservare sempre la consegna del media originale al modello.
- Supportare **API provider** e **fallback CLI**.
- Consentire più modelli con fallback ordinato (errore/dimensione/timeout).

## Comportamento di alto livello

1. Raccogli gli allegati in ingresso (`MediaPaths`, `MediaUrls`, `MediaTypes`).
2. Per ogni capability abilitata (immagine/audio/video), seleziona gli allegati secondo la policy (predefinito: **primo**).
3. Scegli la prima voce modello idonea (dimensione + capability + autenticazione).
4. Se un modello fallisce o il media è troppo grande, usa come **fallback la voce successiva**.
5. In caso di successo:
   - `Body` diventa un blocco `[Image]`, `[Audio]` o `[Video]`.
   - L’audio imposta `{{Transcript}}`; il parsing dei comandi usa il testo della didascalia quando presente,
     altrimenti la trascrizione.
   - Le didascalie vengono mantenute come `User text:` all’interno del blocco.

Se la comprensione fallisce o è disabilitata, **il flusso di risposta continua** con il body + gli allegati originali.

## Panoramica della configurazione

`tools.media` supporta **modelli condivisi** più override per capability:

- `tools.media.models`: elenco di modelli condivisi (usa `capabilities` per limitarli).
- `tools.media.image` / `tools.media.audio` / `tools.media.video`:
  - valori predefiniti (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
  - override provider (`baseUrl`, `headers`, `providerOptions`)
  - opzioni audio Deepgram tramite `tools.media.audio.providerOptions.deepgram`
  - controlli di echo della trascrizione audio (`echoTranscript`, predefinito `false`; `echoFormat`)
  - elenco `models` **facoltativo per capability** (preferito prima dei modelli condivisi)
  - policy `attachments` (`mode`, `maxAttachments`, `prefer`)
  - `scope` (controllo facoltativo per canale/chatType/chiave sessione)
- `tools.media.concurrency`: numero massimo di esecuzioni concorrenti per capability (predefinito **2**).

```json5
{
  tools: {
    media: {
      models: [
        /* lista condivisa */
      ],
      image: {
        /* override facoltativi */
      },
      audio: {
        /* override facoltativi */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {
        /* override facoltativi */
      },
    },
  },
}
```

### Voci modello

Ogni voce `models[]` può essere **provider** o **CLI**:

```json5
{
  type: "provider", // predefinito se omesso
  provider: "openai",
  model: "gpt-5.4-mini",
  prompt: "Describe the image in <= 500 chars.",
  maxChars: 500,
  maxBytes: 10485760,
  timeoutSeconds: 60,
  capabilities: ["image"], // facoltativo, usato per voci multi-modali
  profile: "vision-profile",
  preferredProfile: "vision-fallback",
}
```

```json5
{
  type: "cli",
  command: "gemini",
  args: [
    "-m",
    "gemini-3-flash",
    "--allowed-tools",
    "read_file",
    "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
  ],
  maxChars: 500,
  maxBytes: 52428800,
  timeoutSeconds: 120,
  capabilities: ["video", "image"],
}
```

I template CLI possono anche usare:

- `{{MediaDir}}` (directory che contiene il file media)
- `{{OutputDir}}` (directory scratch creata per questa esecuzione)
- `{{OutputBase}}` (percorso base del file scratch, senza estensione)

## Valori predefiniti e limiti

Valori consigliati:

- `maxChars`: **500** per immagine/video (breve, adatto ai comandi)
- `maxChars`: **non impostato** per audio (trascrizione completa a meno che tu non imposti un limite)
- `maxBytes`:
  - immagine: **10MB**
  - audio: **20MB**
  - video: **50MB**

Regole:

- Se il media supera `maxBytes`, quel modello viene saltato e viene provato il **modello successivo**.
- I file audio più piccoli di **1024 byte** vengono trattati come vuoti/corrotti e saltati prima della trascrizione provider/CLI.
- Se il modello restituisce più di `maxChars`, l’output viene troncato.
- `prompt` usa per impostazione predefinita un semplice “Describe the {media}.” più l’indicazione `maxChars` (solo immagine/video).
- Se il modello immagine principale attivo supporta già nativamente la visione, OpenClaw
  salta il blocco di riepilogo `[Image]` e passa invece l’immagine originale al
  modello.
- Le richieste esplicite `openclaw infer image describe --model <provider/model>`
  sono diverse: eseguono direttamente quel provider/modello con capability immagine, inclusi
  i ref Ollama come `ollama/qwen2.5vl:7b`.
- Se `<capability>.enabled: true` ma non sono configurati modelli, OpenClaw prova il
  **modello di risposta attivo** quando il suo provider supporta la capability.

### Rilevamento automatico di Media Understanding (predefinito)

Se `tools.media.<capability>.enabled` **non** è impostato su `false` e non hai
configurato modelli, OpenClaw rileva automaticamente in questo ordine e **si ferma alla prima
opzione funzionante**:

1. **Modello di risposta attivo** quando il suo provider supporta la capability.
2. Ref primary/fallback di **`agents.defaults.imageModel`** (solo immagine).
3. **CLI locali** (solo audio; se installate)
   - `sherpa-onnx-offline` (richiede `SHERPA_ONNX_MODEL_DIR` con encoder/decoder/joiner/tokens)
   - `whisper-cli` (`whisper-cpp`; usa `WHISPER_CPP_MODEL` o il modello tiny incluso)
   - `whisper` (CLI Python; scarica automaticamente i modelli)
4. **Gemini CLI** (`gemini`) usando `read_many_files`
5. **Autenticazione provider**
   - Le voci configurate `models.providers.*` che supportano la capability vengono
     provate prima dell’ordine di fallback bundled.
   - I provider di configurazione solo immagine con un modello con capability immagine si registrano automaticamente per
     Media Understanding anche quando non sono un plugin vendor bundled.
   - La comprensione delle immagini con Ollama è disponibile quando selezionata esplicitamente, per
     esempio tramite `agents.defaults.imageModel` o
     `openclaw infer image describe --model ollama/<vision-model>`.
   - Ordine di fallback bundled:
     - Audio: OpenAI → Groq → xAI → Deepgram → Google → Mistral
     - Immagine: OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
     - Video: Google → Qwen → Moonshot

Per disabilitare il rilevamento automatico, imposta:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: false,
      },
    },
  },
}
```

Nota: il rilevamento dei binari è best-effort su macOS/Linux/Windows; assicurati che la CLI sia in `PATH` (espandiamo `~`), oppure imposta un modello CLI esplicito con un percorso completo del comando.

### Supporto ambiente proxy (modelli provider)

Quando Media Understanding **audio** e **video** basata su provider è abilitata, OpenClaw
rispetta le variabili d’ambiente proxy standard in uscita per le chiamate HTTP del provider:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Se non è impostata alcuna variabile d’ambiente proxy, Media Understanding usa egress diretto.
Se il valore del proxy è malformato, OpenClaw registra un avviso e torna al recupero diretto.

## Capability (facoltative)

Se imposti `capabilities`, la voce viene eseguita solo per quei tipi di media. Per gli
elenchi condivisi, OpenClaw può dedurre i valori predefiniti:

- `openai`, `anthropic`, `minimax`: **image**
- `minimax-portal`: **image**
- `moonshot`: **image + video**
- `openrouter`: **image**
- `google` (Gemini API): **image + audio + video**
- `qwen`: **image + video**
- `mistral`: **audio**
- `zai`: **image**
- `groq`: **audio**
- `xai`: **audio**
- `deepgram`: **audio**
- Qualsiasi catalogo `models.providers.<id>.models[]` con un modello con capability immagine:
  **image**

Per le voci CLI, **imposta `capabilities` esplicitamente** per evitare corrispondenze sorprendenti.
Se ometti `capabilities`, la voce è idonea per l’elenco in cui compare.

## Matrice di supporto provider (integrazioni OpenClaw)

| Capability | Integrazione provider                                                                  | Note                                                                                                                                     |
| ---------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Immagine   | OpenAI, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, provider config | I plugin vendor registrano il supporto immagine; MiniMax e MiniMax OAuth usano entrambi `MiniMax-VL-01`; i provider config con capability immagine si registrano automaticamente. |
| Audio      | OpenAI, Groq, Deepgram, Google, Mistral                                                | Trascrizione provider (Whisper/Deepgram/Gemini/Voxtral).                                                                                 |
| Video      | Google, Qwen, Moonshot                                                                 | Comprensione video provider tramite plugin vendor; la comprensione video Qwen usa gli endpoint Standard DashScope.                      |

Nota MiniMax:

- La comprensione immagini `minimax` e `minimax-portal` proviene dal provider media
  `MiniMax-VL-01` gestito dal plugin.
- Il catalogo testo MiniMax bundled continua a iniziare come solo testo; le voci esplicite
  `models.providers.minimax` materializzano ref chat M2.7 con capability immagine.

## Indicazioni per la selezione del modello

- Preferisci il modello più forte e di ultima generazione disponibile per ogni capability media quando qualità e sicurezza sono importanti.
- Per agenti con strumenti che gestiscono input non attendibili, evita modelli media più vecchi/più deboli.
- Mantieni almeno un fallback per capability per disponibilità (modello di qualità + modello più rapido/economico).
- I fallback CLI (`whisper-cli`, `whisper`, `gemini`) sono utili quando le API provider non sono disponibili.
- Nota `parakeet-mlx`: con `--output-dir`, OpenClaw legge `<output-dir>/<media-basename>.txt` quando il formato di output è `txt` (o non specificato); i formati non `txt` usano stdout come fallback.

## Policy degli allegati

`attachments` per capability controlla quali allegati vengono elaborati:

- `mode`: `first` (predefinito) oppure `all`
- `maxAttachments`: limita il numero elaborato (predefinito **1**)
- `prefer`: `first`, `last`, `path`, `url`

Quando `mode: "all"`, gli output sono etichettati `[Image 1/2]`, `[Audio 2/2]`, ecc.

Comportamento di estrazione degli allegati file:

- Il testo del file estratto viene racchiuso come **contenuto esterno non attendibile** prima di essere
  aggiunto al prompt media.
- Il blocco iniettato usa marcatori di confine espliciti come
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` e include una riga di metadati
  `Source: External`.
- Questo percorso di estrazione degli allegati omette intenzionalmente il lungo
  banner `SECURITY NOTICE:` per evitare di gonfiare il prompt media; i marcatori
  di confine e i metadati restano comunque presenti.
- Se un file non ha testo estraibile, OpenClaw inietta `[No extractable text]`.
- Se in questo percorso un PDF usa come fallback immagini di pagine renderizzate, il prompt media mantiene
  il segnaposto `[PDF content rendered to images; images not forwarded to model]`
  perché questo passaggio di estrazione degli allegati inoltra blocchi di testo, non le immagini PDF renderizzate.

## Esempi di configurazione

### 1) Elenco di modelli condivisi + override

```json5
{
  tools: {
    media: {
      models: [
        { provider: "openai", model: "gpt-5.4-mini", capabilities: ["image"] },
        {
          provider: "google",
          model: "gemini-3-flash-preview",
          capabilities: ["image", "audio", "video"],
        },
        {
          type: "cli",
          command: "gemini",
          args: [
            "-m",
            "gemini-3-flash",
            "--allowed-tools",
            "read_file",
            "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
          ],
          capabilities: ["image", "video"],
        },
      ],
      audio: {
        attachments: { mode: "all", maxAttachments: 2 },
      },
      video: {
        maxChars: 500,
      },
    },
  },
}
```

### 2) Solo audio + video (immagine disattivata)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          {
            type: "cli",
            command: "whisper",
            args: ["--model", "base", "{{MediaPath}}"],
          },
        ],
      },
      video: {
        enabled: true,
        maxChars: 500,
        models: [
          { provider: "google", model: "gemini-3-flash-preview" },
          {
            type: "cli",
            command: "gemini",
            args: [
              "-m",
              "gemini-3-flash",
              "--allowed-tools",
              "read_file",
              "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
            ],
          },
        ],
      },
    },
  },
}
```

### 3) Comprensione facoltativa delle immagini

```json5
{
  tools: {
    media: {
      image: {
        enabled: true,
        maxBytes: 10485760,
        maxChars: 500,
        models: [
          { provider: "openai", model: "gpt-5.4-mini" },
          { provider: "anthropic", model: "claude-opus-4-6" },
          {
            type: "cli",
            command: "gemini",
            args: [
              "-m",
              "gemini-3-flash",
              "--allowed-tools",
              "read_file",
              "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
            ],
          },
        ],
      },
    },
  },
}
```

### 4) Singola voce multi-modale (capabilities esplicite)

```json5
{
  tools: {
    media: {
      image: {
        models: [
          {
            provider: "google",
            model: "gemini-3.1-pro-preview",
            capabilities: ["image", "video", "audio"],
          },
        ],
      },
      audio: {
        models: [
          {
            provider: "google",
            model: "gemini-3.1-pro-preview",
            capabilities: ["image", "video", "audio"],
          },
        ],
      },
      video: {
        models: [
          {
            provider: "google",
            model: "gemini-3.1-pro-preview",
            capabilities: ["image", "video", "audio"],
          },
        ],
      },
    },
  },
}
```

## Output di stato

Quando Media Understanding viene eseguito, `/status` include una breve riga di riepilogo:

```
📎 Media: image ok (openai/gpt-5.4-mini) · audio skipped (maxBytes)
```

Questo mostra gli esiti per capability e il provider/modello scelto quando applicabile.

## Note

- La comprensione è **best-effort**. Gli errori non bloccano le risposte.
- Gli allegati vengono comunque passati ai modelli anche quando la comprensione è disabilitata.
- Usa `scope` per limitare dove viene eseguita la comprensione (ad es. solo nei DM).

## Documentazione correlata

- [Configuration](/it/gateway/configuration)
- [Image & Media Support](/it/nodes/images)
