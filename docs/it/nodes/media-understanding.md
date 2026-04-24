---
read_when:
    - Progettare o rifattorizzare la comprensione dei media
    - Ottimizzare il preprocessing audio/video/immagini in ingresso
summary: Comprensione di immagini/audio/video in ingresso (opzionale) con fallback provider + CLI
title: Comprensione dei media
x-i18n:
    generated_at: "2026-04-24T08:48:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: a9eb9449fbc1bed170bbef213aa43d71d4146edbc0dd626ef50af9e044a8e299
    source_path: nodes/media-understanding.md
    workflow: 15
---

# Comprensione dei media - In ingresso (2026-01-17)

OpenClaw può **riassumere i media in ingresso** (immagine/audio/video) prima che venga eseguita la pipeline di risposta. Rileva automaticamente quando strumenti locali o chiavi provider sono disponibili, e può essere disabilitato o personalizzato. Se la comprensione è disattivata, i modelli ricevono comunque i file/URL originali come al solito.

Il comportamento dei media specifico del vendor viene registrato dai Plugin vendor, mentre il core di OpenClaw
gestisce la configurazione condivisa `tools.media`, l’ordine di fallback e l’integrazione
nella pipeline di risposta.

## Obiettivi

- Opzionale: predigerire i media in ingresso in testo breve per instradamento più rapido + parsing dei comandi migliore.
- Preservare sempre la consegna del media originale al modello.
- Supportare **API provider** e **fallback CLI**.
- Consentire più modelli con fallback ordinato (errore/dimensione/timeout).

## Comportamento di alto livello

1. Raccogli gli allegati in ingresso (`MediaPaths`, `MediaUrls`, `MediaTypes`).
2. Per ogni capacità abilitata (immagine/audio/video), seleziona gli allegati secondo la policy (predefinito: **primo**).
3. Scegli la prima voce modello idonea (dimensione + capacità + autenticazione).
4. Se un modello fallisce o il media è troppo grande, **usa come fallback la voce successiva**.
5. In caso di successo:
   - `Body` diventa un blocco `[Image]`, `[Audio]` oppure `[Video]`.
   - L’audio imposta `{{Transcript}}`; il parsing dei comandi usa il testo della didascalia quando presente,
     altrimenti la trascrizione.
   - Le didascalie vengono preservate come `User text:` dentro il blocco.

Se la comprensione fallisce o è disabilitata, **il flusso di risposta continua** con il body + gli allegati originali.

## Panoramica della configurazione

`tools.media` supporta **modelli condivisi** più override per singola capacità:

- `tools.media.models`: elenco condiviso dei modelli (usa `capabilities` per il gating).
- `tools.media.image` / `tools.media.audio` / `tools.media.video`:
  - valori predefiniti (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
  - override del provider (`baseUrl`, `headers`, `providerOptions`)
  - opzioni audio Deepgram tramite `tools.media.audio.providerOptions.deepgram`
  - controlli di echo della trascrizione audio (`echoTranscript`, predefinito `false`; `echoFormat`)
  - elenco `models` opzionale **per singola capacità** (preferito prima dei modelli condivisi)
  - policy `attachments` (`mode`, `maxAttachments`, `prefer`)
  - `scope` (gating opzionale per channel/chatType/session key)
- `tools.media.concurrency`: numero massimo di esecuzioni concorrenti per capacità (predefinito **2**).

```json5
{
  tools: {
    media: {
      models: [
        /* elenco condiviso */
      ],
      image: {
        /* override opzionali */
      },
      audio: {
        /* override opzionali */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {
        /* override opzionali */
      },
    },
  },
}
```

### Voci modello

Ogni voce `models[]` può essere **provider** oppure **CLI**:

```json5
{
  type: "provider", // predefinito se omesso
  provider: "openai",
  model: "gpt-5.5",
  prompt: "Describe the image in <= 500 chars.",
  maxChars: 500,
  maxBytes: 10485760,
  timeoutSeconds: 60,
  capabilities: ["image"], // opzionale, usato per voci multi-modali
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

I template CLI possono usare anche:

- `{{MediaDir}}` (directory che contiene il file media)
- `{{OutputDir}}` (directory scratch creata per questa esecuzione)
- `{{OutputBase}}` (percorso base del file scratch, senza estensione)

## Valori predefiniti e limiti

Valori predefiniti consigliati:

- `maxChars`: **500** per immagine/video (breve, adatto ai comandi)
- `maxChars`: **non impostato** per audio (trascrizione completa salvo che tu imposti un limite)
- `maxBytes`:
  - immagine: **10MB**
  - audio: **20MB**
  - video: **50MB**

Regole:

- Se il media supera `maxBytes`, quel modello viene saltato e **si prova il modello successivo**.
- I file audio più piccoli di **1024 byte** vengono trattati come vuoti/corrotti e saltati prima della trascrizione provider/CLI.
- Se il modello restituisce più di `maxChars`, l’output viene troncato.
- `prompt` usa come predefinito un semplice “Describe the {media}.” più l’indicazione `maxChars` (solo immagine/video).
- Se il modello immagine primario attivo supporta già nativamente la visione, OpenClaw
  salta il blocco riassuntivo `[Image]` e passa invece l’immagine originale al
  modello.
- Se un modello primario Gateway/WebChat è solo testo, gli allegati immagine vengono
  preservati come riferimenti offloaded `media://inbound/*` così lo strumento immagine o il modello
  immagine configurato possono comunque ispezionarli invece di perdere l’allegato.
- Le richieste esplicite `openclaw infer image describe --model <provider/model>`
  sono diverse: eseguono direttamente quel provider/modello con capacità immagine,
  inclusi riferimenti Ollama come `ollama/qwen2.5vl:7b`.
- Se `<capability>.enabled: true` ma non sono configurati modelli, OpenClaw prova il
  **modello di risposta attivo** quando il suo provider supporta quella capacità.

### Auto-rilevamento della comprensione dei media (predefinito)

Se `tools.media.<capability>.enabled` **non** è impostato a `false` e non hai
configurato modelli, OpenClaw esegue il rilevamento automatico in quest’ordine e **si ferma alla prima
opzione funzionante**:

1. **Modello di risposta attivo** quando il suo provider supporta quella capacità.
2. Riferimenti primario/fallback di **`agents.defaults.imageModel`** (solo immagini).
3. **CLI locali** (solo audio; se installate)
   - `sherpa-onnx-offline` (richiede `SHERPA_ONNX_MODEL_DIR` con encoder/decoder/joiner/tokens)
   - `whisper-cli` (`whisper-cpp`; usa `WHISPER_CPP_MODEL` oppure il modello tiny incluso)
   - `whisper` (CLI Python; scarica automaticamente i modelli)
4. **Gemini CLI** (`gemini`) usando `read_many_files`
5. **Autenticazione provider**
   - Le voci configurate `models.providers.*` che supportano la capacità vengono
     provate prima dell’ordine di fallback incluso.
   - I provider di configurazione solo immagine con un modello capace di immagini si registrano automaticamente per
     la comprensione dei media anche quando non sono un Plugin vendor incluso.
   - La comprensione immagini Ollama è disponibile quando selezionata esplicitamente, per
     esempio tramite `agents.defaults.imageModel` oppure
     `openclaw infer image describe --model ollama/<vision-model>`.
   - Ordine di fallback incluso:
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

Nota: il rilevamento dei binari è best-effort su macOS/Linux/Windows; assicurati che la CLI sia nel `PATH` (espandiamo `~`), oppure imposta un modello CLI esplicito con il percorso completo del comando.

### Supporto ambiente proxy (modelli provider)

Quando la comprensione dei media **audio** e **video** basata su provider è abilitata, OpenClaw
rispetta le variabili d’ambiente standard di proxy in uscita per le chiamate HTTP ai provider:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Se non è impostata alcuna variabile env di proxy, la comprensione dei media usa uscita diretta.
Se il valore del proxy è malformato, OpenClaw registra un avviso e usa come fallback il fetch
diretto.

## Capacità (opzionali)

Se imposti `capabilities`, la voce viene eseguita solo per quei tipi di media. Per gli elenchi condivisi,
OpenClaw può dedurre valori predefiniti:

- `openai`, `anthropic`, `minimax`: **immagine**
- `minimax-portal`: **immagine**
- `moonshot`: **immagine + video**
- `openrouter`: **immagine**
- `google` (Gemini API): **immagine + audio + video**
- `qwen`: **immagine + video**
- `mistral`: **audio**
- `zai`: **immagine**
- `groq`: **audio**
- `xai`: **audio**
- `deepgram`: **audio**
- Qualsiasi catalogo `models.providers.<id>.models[]` con un modello capace di immagini:
  **immagine**

Per le voci CLI, **imposta `capabilities` esplicitamente** per evitare corrispondenze sorprendenti.
Se ometti `capabilities`, la voce è idonea per l’elenco in cui compare.

## Matrice di supporto provider (integrazioni OpenClaw)

| Capacità   | Integrazione provider                                                                                                         | Note                                                                                                                                                                                                                                       |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Immagine   | OpenAI, OpenAI Codex OAuth, server app Codex, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, provider config | I Plugin vendor registrano il supporto immagine; `openai-codex/*` usa la logica OAuth del provider; `codex/*` usa un turno bounded del server app Codex; MiniMax e MiniMax OAuth usano entrambi `MiniMax-VL-01`; i provider config con capacità immagine si registrano automaticamente. |
| Audio      | OpenAI, Groq, Deepgram, Google, Mistral                                                                                       | Trascrizione provider (Whisper/Deepgram/Gemini/Voxtral).                                                                                                                                                                                   |
| Video      | Google, Qwen, Moonshot                                                                                                        | Comprensione video provider tramite Plugin vendor; la comprensione video Qwen usa gli endpoint DashScope Standard.                                                                                                                         |

Nota MiniMax:

- La comprensione immagini `minimax` e `minimax-portal` proviene dal provider media posseduto dal Plugin
  `MiniMax-VL-01`.
- Il catalogo testo MiniMax incluso resta inizialmente solo testo; voci esplicite
  `models.providers.minimax` materializzano riferimenti chat M2.7 con capacità immagine.

## Guida alla selezione del modello

- Preferisci il modello di ultima generazione più forte disponibile per ciascuna capacità media quando qualità e sicurezza contano.
- Per agenti con strumenti abilitati che gestiscono input non fidati, evita modelli media più vecchi/deboli.
- Mantieni almeno un fallback per ogni capacità per la disponibilità (modello di qualità + modello più veloce/economico).
- I fallback CLI (`whisper-cli`, `whisper`, `gemini`) sono utili quando le API provider non sono disponibili.
- Nota `parakeet-mlx`: con `--output-dir`, OpenClaw legge `<output-dir>/<media-basename>.txt` quando il formato output è `txt` (oppure non specificato); i formati non `txt` usano come fallback stdout.

## Policy degli allegati

`attachments` per singola capacità controlla quali allegati vengono elaborati:

- `mode`: `first` (predefinito) oppure `all`
- `maxAttachments`: limita il numero elaborato (predefinito **1**)
- `prefer`: `first`, `last`, `path`, `url`

Quando `mode: "all"`, gli output sono etichettati `[Image 1/2]`, `[Audio 2/2]`, ecc.

Comportamento di estrazione degli allegati file:

- Il testo estratto dal file viene racchiuso come **contenuto esterno non fidato** prima di
  essere aggiunto al prompt media.
- Il blocco iniettato usa marker di confine espliciti come
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` e include una riga di metadati
  `Source: External`.
- Questo percorso di estrazione degli allegati intenzionalmente omette il lungo
  banner `SECURITY NOTICE:` per evitare di gonfiare il prompt media; i marker di confine
  e i metadati restano comunque.
- Se un file non ha testo estraibile, OpenClaw inietta `[No extractable text]`.
- Se in questo percorso un PDF usa come fallback immagini delle pagine renderizzate, il prompt media mantiene
  il placeholder `[PDF content rendered to images; images not forwarded to model]`
  perché questo passaggio di estrazione degli allegati inoltra blocchi di testo, non le immagini PDF renderizzate.

## Esempi di configurazione

### 1) Elenco modelli condivisi + override

```json5
{
  tools: {
    media: {
      models: [
        { provider: "openai", model: "gpt-5.5", capabilities: ["image"] },
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

### 2) Solo Audio + Video (immagine disattivata)

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

### 3) Comprensione opzionale delle immagini

```json5
{
  tools: {
    media: {
      image: {
        enabled: true,
        maxBytes: 10485760,
        maxChars: 500,
        models: [
          { provider: "openai", model: "gpt-5.5" },
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

### 4) Voce singola multi-modale (capacità esplicite)

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

Quando viene eseguita la comprensione dei media, `/status` include una breve riga di riepilogo:

```
📎 Media: image ok (openai/gpt-5.4) · audio skipped (maxBytes)
```

Questa mostra gli esiti per singola capacità e il provider/modello scelto quando applicabile.

## Note

- La comprensione è **best-effort**. Gli errori non bloccano le risposte.
- Gli allegati vengono comunque passati ai modelli anche quando la comprensione è disabilitata.
- Usa `scope` per limitare dove viene eseguita la comprensione (es. solo nei DM).

## Documentazione correlata

- [Configuration](/it/gateway/configuration)
- [Supporto immagini e media](/it/nodes/images)
