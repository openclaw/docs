---
read_when:
    - Stai progettando o rifattorizzando la comprensione dei media
    - Stai regolando il pre-processing in ingresso di audio/video/immagini
summary: Comprensione in ingresso di immagini/audio/video (facoltativa) con fallback provider + CLI
title: Comprensione dei media
x-i18n:
    generated_at: "2026-04-05T13:57:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe36bd42250d48d12f4ff549e8644afa7be8e42ee51f8aff4f21f81b7ff060f4
    source_path: nodes/media-understanding.md
    workflow: 15
---

# Comprensione dei media - In ingresso (2026-01-17)

OpenClaw può **riassumere i media in ingresso** (immagini/audio/video) prima dell'esecuzione della pipeline di risposta. Rileva automaticamente quando sono disponibili strumenti locali o chiavi provider e può essere disabilitato o personalizzato. Se la comprensione è disattivata, i modelli ricevono comunque i file/URL originali come sempre.

Il comportamento dei media specifico del vendor viene registrato dai plugin del vendor, mentre il core di OpenClaw gestisce la configurazione condivisa `tools.media`, l'ordine di fallback e l'integrazione con la pipeline di risposta.

## Obiettivi

- Facoltativo: pre-digerire i media in ingresso in testo breve per un instradamento più rapido e un parsing dei comandi migliore.
- Preservare sempre la consegna dei media originali al modello.
- Supportare **API provider** e **fallback CLI**.
- Consentire più modelli con fallback ordinato (errore/dimensione/timeout).

## Comportamento di alto livello

1. Raccogli gli allegati in ingresso (`MediaPaths`, `MediaUrls`, `MediaTypes`).
2. Per ogni capacità abilitata (immagine/audio/video), seleziona gli allegati secondo la policy (predefinita: **primo**).
3. Scegli la prima voce di modello idonea (dimensione + capacità + auth).
4. Se un modello fallisce o il media è troppo grande, passa **alla voce successiva**.
5. In caso di successo:
   - `Body` diventa un blocco `[Image]`, `[Audio]` o `[Video]`.
   - L'audio imposta `{{Transcript}}`; il parsing dei comandi usa il testo della didascalia quando presente, altrimenti la trascrizione.
   - Le didascalie vengono preservate come `User text:` all'interno del blocco.

Se la comprensione fallisce o è disabilitata, **il flusso di risposta continua** con body + allegati originali.

## Panoramica della configurazione

`tools.media` supporta **modelli condivisi** più override per capacità:

- `tools.media.models`: elenco di modelli condivisi (usa `capabilities` per limitarli).
- `tools.media.image` / `tools.media.audio` / `tools.media.video`:
  - valori predefiniti (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
  - override del provider (`baseUrl`, `headers`, `providerOptions`)
  - opzioni audio Deepgram tramite `tools.media.audio.providerOptions.deepgram`
  - controlli di echo della trascrizione audio (`echoTranscript`, predefinito `false`; `echoFormat`)
  - elenco facoltativo di `models` **per capacità** (preferito prima dei modelli condivisi)
  - policy `attachments` (`mode`, `maxAttachments`, `prefer`)
  - `scope` (filtro facoltativo per canale/chatType/session key)
- `tools.media.concurrency`: numero massimo di esecuzioni concorrenti per capacità (predefinito **2**).

```json5
{
  tools: {
    media: {
      models: [
        /* elenco condiviso */
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

### Voci di modello

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

I template CLI possono usare anche:

- `{{MediaDir}}` (directory che contiene il file media)
- `{{OutputDir}}` (directory scratch creata per questa esecuzione)
- `{{OutputBase}}` (percorso base del file scratch, senza estensione)

## Valori predefiniti e limiti

Valori predefiniti consigliati:

- `maxChars`: **500** per immagini/video (breve, compatibile con i comandi)
- `maxChars`: **non impostato** per l'audio (trascrizione completa salvo impostazione di un limite)
- `maxBytes`:
  - immagine: **10MB**
  - audio: **20MB**
  - video: **50MB**

Regole:

- Se il media supera `maxBytes`, quel modello viene saltato e viene provato **il modello successivo**.
- I file audio più piccoli di **1024 byte** vengono trattati come vuoti/corrotti e saltati prima della trascrizione provider/CLI.
- Se il modello restituisce più di `maxChars`, l'output viene troncato.
- `prompt` usa per default un semplice “Describe the {media}.” più l'indicazione `maxChars` (solo immagine/video).
- Se il modello immagine primario attivo supporta già nativamente la vision, OpenClaw salta il blocco di riepilogo `[Image]` e passa invece l'immagine originale al modello.
- Se `<capability>.enabled: true` ma non sono configurati modelli, OpenClaw prova il **modello di risposta attivo** quando il suo provider supporta quella capacità.

### Rilevamento automatico della comprensione dei media (predefinito)

Se `tools.media.<capability>.enabled` **non** è impostato a `false` e non hai configurato modelli, OpenClaw rileva automaticamente in quest'ordine e **si ferma alla prima opzione funzionante**:

1. **Modello di risposta attivo** quando il suo provider supporta la capacità.
2. Riferimenti primari/fallback di **`agents.defaults.imageModel`** (solo immagine).
3. **CLI locali** (solo audio; se installate)
   - `sherpa-onnx-offline` (richiede `SHERPA_ONNX_MODEL_DIR` con encoder/decoder/joiner/tokens)
   - `whisper-cli` (`whisper-cpp`; usa `WHISPER_CPP_MODEL` o il modello tiny bundled)
   - `whisper` (CLI Python; scarica automaticamente i modelli)
4. **Gemini CLI** (`gemini`) usando `read_many_files`
5. **Auth provider**
   - Le voci configurate `models.providers.*` che supportano la capacità vengono provate prima dell'ordine di fallback bundled.
   - I provider di configurazione solo immagine con un modello compatibile con immagini vengono registrati automaticamente per la comprensione dei media anche quando non sono un plugin vendor bundled.
   - Ordine di fallback bundled:
     - Audio: OpenAI → Groq → Deepgram → Google → Mistral
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

Nota: il rilevamento dei binari è best-effort su macOS/Linux/Windows; assicurati che la CLI sia nel `PATH` (espandiamo `~`), oppure imposta un modello CLI esplicito con un percorso comando completo.

### Supporto dell'ambiente proxy (modelli provider)

Quando la comprensione dei media **audio** e **video** basata su provider è abilitata, OpenClaw rispetta le variabili d'ambiente proxy standard in uscita per le chiamate HTTP verso i provider:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Se non sono impostate variabili d'ambiente proxy, la comprensione dei media usa l'egress diretto.
Se il valore del proxy è malformato, OpenClaw registra un avviso e torna al fetch diretto.

## Capacità (facoltative)

Se imposti `capabilities`, la voce viene eseguita solo per quei tipi di media. Per gli elenchi condivisi, OpenClaw può dedurre i valori predefiniti:

- `openai`, `anthropic`, `minimax`: **image**
- `minimax-portal`: **image**
- `moonshot`: **image + video**
- `openrouter`: **image**
- `google` (API Gemini): **image + audio + video**
- `qwen`: **image + video**
- `mistral`: **audio**
- `zai`: **image**
- `groq`: **audio**
- `deepgram`: **audio**
- Qualsiasi catalogo `models.providers.<id>.models[]` con un modello compatibile con immagini: **image**

Per le voci CLI, **imposta `capabilities` esplicitamente** per evitare corrispondenze sorprendenti.
Se ometti `capabilities`, la voce è idonea per l'elenco in cui compare.

## Matrice di supporto dei provider (integrazioni OpenClaw)

| Capacità | Integrazione provider                                                                  | Note                                                                                                                                       |
| ---------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Immagine      | OpenAI, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, provider di configurazione | I plugin vendor registrano il supporto immagini; MiniMax e MiniMax OAuth usano entrambi `MiniMax-VL-01`; i provider di configurazione compatibili con immagini si registrano automaticamente. |
| Audio      | OpenAI, Groq, Deepgram, Google, Mistral                                                | Trascrizione provider (Whisper/Deepgram/Gemini/Voxtral).                                                                                |
| Video      | Google, Qwen, Moonshot                                                                 | Comprensione video provider tramite plugin vendor; la comprensione video Qwen usa gli endpoint Standard DashScope.                         |

Nota su MiniMax:

- La comprensione immagini `minimax` e `minimax-portal` proviene dal provider media `MiniMax-VL-01` gestito dal plugin.
- Il catalogo testuale MiniMax bundled inizia comunque solo testo; le voci esplicite `models.providers.minimax` materializzano riferimenti chat M2.7 compatibili con immagini.

## Indicazioni per la selezione del modello

- Preferisci il modello più forte disponibile dell'ultima generazione per ogni capacità media quando qualità e sicurezza contano.
- Per agenti con strumenti abilitati che gestiscono input non attendibili, evita modelli media più vecchi/più deboli.
- Mantieni almeno un fallback per capacità per la disponibilità (modello di qualità + modello più rapido/più economico).
- I fallback CLI (`whisper-cli`, `whisper`, `gemini`) sono utili quando le API provider non sono disponibili.
- Nota `parakeet-mlx`: con `--output-dir`, OpenClaw legge `<output-dir>/<media-basename>.txt` quando il formato di output è `txt` (o non specificato); i formati non `txt` usano stdout come fallback.

## Policy degli allegati

`attachments` per capacità controlla quali allegati vengono elaborati:

- `mode`: `first` (predefinito) o `all`
- `maxAttachments`: limite al numero elaborato (predefinito **1**)
- `prefer`: `first`, `last`, `path`, `url`

Quando `mode: "all"`, gli output vengono etichettati `[Image 1/2]`, `[Audio 2/2]`, ecc.

Comportamento di estrazione degli allegati file:

- Il testo dei file estratti viene racchiuso come **contenuto esterno non attendibile** prima di essere aggiunto al prompt media.
- Il blocco iniettato usa marcatori di confine espliciti come
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` e include una riga di metadati
  `Source: External`.
- Questo percorso di estrazione degli allegati omette intenzionalmente il banner lungo
  `SECURITY NOTICE:` per evitare di gonfiare il prompt media; i marcatori di confine
  e i metadati restano comunque presenti.
- Se un file non ha testo estraibile, OpenClaw inietta `[No extractable text]`.
- Se in questo percorso un PDF usa come fallback immagini renderizzate delle pagine, il prompt media mantiene
  il placeholder `[PDF content rendered to images; images not forwarded to model]`
  perché questo passaggio di estrazione allegati inoltra blocchi di testo, non le immagini PDF renderizzate.

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

Quando la comprensione dei media viene eseguita, `/status` include una breve riga di riepilogo:

```
📎 Media: image ok (openai/gpt-5.4-mini) · audio skipped (maxBytes)
```

Questo mostra gli esiti per capacità e il provider/modello scelto quando applicabile.

## Note

- La comprensione è **best-effort**. Gli errori non bloccano le risposte.
- Gli allegati vengono comunque passati ai modelli anche quando la comprensione è disabilitata.
- Usa `scope` per limitare dove viene eseguita la comprensione (per esempio solo DM).

## Documentazione correlata

- [Configurazione](/gateway/configuration)
- [Supporto immagini e media](/nodes/images)
