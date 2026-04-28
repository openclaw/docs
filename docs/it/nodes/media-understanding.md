---
read_when:
    - Progettazione o refactoring della comprensione dei media
    - Ottimizzazione del pre-processing di audio/video/immagini in ingresso
sidebarTitle: Media understanding
summary: Comprensione di immagini/audio/video in ingresso (facoltativa) con fallback di provider + CLI
title: Comprensione dei media
x-i18n:
    generated_at: "2026-04-26T11:33:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 25ee170a7af523fd2ce4f5f7764638f510b135f94a7796325daf1c3e04147f90
    source_path: nodes/media-understanding.md
    workflow: 15
---

OpenClaw può **riassumere i media in ingresso** (immagine/audio/video) prima che venga eseguita la pipeline di risposta. Rileva automaticamente quando sono disponibili strumenti locali o chiavi del provider e può essere disabilitato o personalizzato. Se la comprensione è disattivata, i modelli ricevono comunque i file/URL originali come sempre.

Il comportamento dei media specifico del vendor è registrato dai Plugin del vendor, mentre il core di OpenClaw gestisce la configurazione condivisa `tools.media`, l'ordine di fallback e l'integrazione con la pipeline di risposta.

## Obiettivi

- Facoltativo: pre-digerire i media in ingresso in testo breve per un routing più rapido e un parsing migliore dei comandi.
- Preservare sempre la consegna al modello dei media originali.
- Supportare **API provider** e **fallback CLI**.
- Consentire più modelli con fallback ordinato (errore/dimensione/timeout).

## Comportamento di alto livello

<Steps>
  <Step title="Raccogli gli allegati">
    Raccogli gli allegati in ingresso (`MediaPaths`, `MediaUrls`, `MediaTypes`).
  </Step>
  <Step title="Seleziona per capacità">
    Per ogni capacità abilitata (immagine/audio/video), seleziona gli allegati secondo la policy (predefinito: **first**).
  </Step>
  <Step title="Scegli il modello">
    Scegli la prima voce di modello idonea (dimensione + capacità + autenticazione).
  </Step>
  <Step title="Fallback in caso di errore">
    Se un modello fallisce o il media è troppo grande, usa il **fallback alla voce successiva**.
  </Step>
  <Step title="Applica il blocco di successo">
    In caso di successo:

    - `Body` diventa un blocco `[Image]`, `[Audio]` o `[Video]`.
    - L'audio imposta `{{Transcript}}`; il parsing dei comandi usa il testo della didascalia quando presente, altrimenti il transcript.
    - Le didascalie vengono preservate come `User text:` all'interno del blocco.

  </Step>
</Steps>

Se la comprensione fallisce o è disabilitata, **il flusso di risposta continua** con il body + gli allegati originali.

## Panoramica della configurazione

`tools.media` supporta **modelli condivisi** più override per capacità:

<AccordionGroup>
  <Accordion title="Chiavi di primo livello">
    - `tools.media.models`: elenco di modelli condiviso (usa `capabilities` per il gating).
    - `tools.media.image` / `tools.media.audio` / `tools.media.video`:
      - valori predefiniti (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
      - override del provider (`baseUrl`, `headers`, `providerOptions`)
      - opzioni audio Deepgram tramite `tools.media.audio.providerOptions.deepgram`
      - controlli echo del transcript audio (`echoTranscript`, predefinito `false`; `echoFormat`)
      - elenco `models` facoltativo **per capacità** (preferito prima dei modelli condivisi)
      - policy `attachments` (`mode`, `maxAttachments`, `prefer`)
      - `scope` (gating facoltativo per canale/chatType/chiave sessione)
    - `tools.media.concurrency`: numero massimo di esecuzioni concorrenti per capacità (predefinito **2**).
  </Accordion>
</AccordionGroup>

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

Ogni voce `models[]` può essere di tipo **provider** o **CLI**:

<Tabs>
  <Tab title="Voce provider">
    ```json5
    {
      type: "provider", // predefinito se omesso
      provider: "openai",
      model: "gpt-5.5",
      prompt: "Describe the image in <= 500 chars.",
      maxChars: 500,
      maxBytes: 10485760,
      timeoutSeconds: 60,
      capabilities: ["image"], // facoltativo, usato per voci multi-modali
      profile: "vision-profile",
      preferredProfile: "vision-fallback",
    }
    ```
  </Tab>
  <Tab title="Voce CLI">
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
    - `{{OutputDir}}` (directory temporanea creata per questa esecuzione)
    - `{{OutputBase}}` (percorso base del file temporaneo, senza estensione)

  </Tab>
</Tabs>

## Valori predefiniti e limiti

Valori predefiniti consigliati:

- `maxChars`: **500** per immagine/video (breve, adatto ai comandi)
- `maxChars`: **non impostato** per l'audio (transcript completo a meno che tu non imposti un limite)
- `maxBytes`:
  - immagine: **10MB**
  - audio: **20MB**
  - video: **50MB**

<AccordionGroup>
  <Accordion title="Regole">
    - Se il media supera `maxBytes`, quel modello viene saltato e viene provato il **modello successivo**.
    - I file audio più piccoli di **1024 byte** vengono trattati come vuoti/corrotti e saltati prima della trascrizione provider/CLI; il contesto della risposta in ingresso riceve un placeholder di transcript deterministico così l'agente sa che la nota era troppo piccola.
    - Se il modello restituisce più di `maxChars`, l'output viene troncato.
    - `prompt` usa per impostazione predefinita un semplice "Describe the {media}." più l'indicazione `maxChars` (solo immagine/video).
    - Se il modello immagine primario attivo supporta già nativamente la visione, OpenClaw salta il blocco di riepilogo `[Image]` e passa invece l'immagine originale al modello.
    - Se un modello primario Gateway/WebChat è solo testo, gli allegati immagine vengono preservati come riferimenti offloaded `media://inbound/*` così gli strumenti immagine/PDF o il modello immagine configurato possono comunque ispezionarli invece di perdere l'allegato.
    - Le richieste esplicite `openclaw infer image describe --model <provider/model>` sono diverse: eseguono direttamente quel provider/modello compatibile con immagini, inclusi riferimenti Ollama come `ollama/qwen2.5vl:7b`.
    - Se `<capability>.enabled: true` ma non sono configurati modelli, OpenClaw prova il **modello di risposta attivo** quando il suo provider supporta la capacità.
  </Accordion>
</AccordionGroup>

### Rilevamento automatico della comprensione dei media (predefinito)

Se `tools.media.<capability>.enabled` **non** è impostato su `false` e non hai configurato modelli, OpenClaw rileva automaticamente in quest'ordine e **si ferma alla prima opzione funzionante**:

<Steps>
  <Step title="Modello di risposta attivo">
    Modello di risposta attivo quando il suo provider supporta la capacità.
  </Step>
  <Step title="agents.defaults.imageModel">
    Riferimenti primary/fallback di `agents.defaults.imageModel` (solo immagine).
  </Step>
  <Step title="CLI locali (solo audio)">
    CLI locali (se installate):

    - `sherpa-onnx-offline` (richiede `SHERPA_ONNX_MODEL_DIR` con encoder/decoder/joiner/tokens)
    - `whisper-cli` (`whisper-cpp`; usa `WHISPER_CPP_MODEL` o il modello tiny incluso)
    - `whisper` (CLI Python; scarica automaticamente i modelli)

  </Step>
  <Step title="Gemini CLI">
    `gemini` usando `read_many_files`.
  </Step>
  <Step title="Autenticazione provider">
    - Le voci `models.providers.*` configurate che supportano la capacità vengono provate prima dell'ordine di fallback incluso.
    - I provider di configurazione solo immagine con un modello compatibile con immagini si autoregistrano per la comprensione dei media anche quando non sono un Plugin vendor incluso.
    - La comprensione delle immagini Ollama è disponibile quando selezionata esplicitamente, per esempio tramite `agents.defaults.imageModel` o `openclaw infer image describe --model ollama/<vision-model>`.

    Ordine di fallback incluso:

    - Audio: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral
    - Immagine: OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
    - Video: Google → Qwen → Moonshot

  </Step>
</Steps>

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

<Note>
Il rilevamento dei binari è best-effort su macOS/Linux/Windows; assicurati che la CLI sia nel `PATH` (espandiamo `~`), oppure imposta un modello CLI esplicito con un percorso completo del comando.
</Note>

### Supporto per variabili d'ambiente proxy (modelli provider)

Quando la comprensione dei media **audio** e **video** basata su provider è abilitata, OpenClaw rispetta le variabili d'ambiente proxy standard in uscita per le chiamate HTTP al provider:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Se non sono impostate variabili d'ambiente proxy, la comprensione dei media usa l'uscita diretta. Se il valore del proxy è malformato, OpenClaw registra un avviso e torna al recupero diretto.

## Capacità (facoltative)

Se imposti `capabilities`, la voce viene eseguita solo per quei tipi di media. Per gli elenchi condivisi, OpenClaw può dedurre i valori predefiniti:

- `openai`, `anthropic`, `minimax`: **immagine**
- `minimax-portal`: **immagine**
- `moonshot`: **immagine + video**
- `openrouter`: **immagine**
- `google` (API Gemini): **immagine + audio + video**
- `qwen`: **immagine + video**
- `mistral`: **audio**
- `zai`: **immagine**
- `groq`: **audio**
- `xai`: **audio**
- `deepgram`: **audio**
- Qualsiasi catalogo `models.providers.<id>.models[]` con un modello compatibile con immagini: **immagine**

Per le voci CLI, **imposta `capabilities` esplicitamente** per evitare corrispondenze sorprendenti. Se ometti `capabilities`, la voce è idonea per l'elenco in cui compare.

## Matrice di supporto provider (integrazioni OpenClaw)

| Capacità   | Integrazione provider                                                                                                        | Note                                                                                                                                                                                                                                   |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Immagine   | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, provider di configurazione | I Plugin vendor registrano il supporto immagini; `openai-codex/*` usa il plumbing del provider OAuth; `codex/*` usa un turno limitato del Codex app-server; MiniMax e MiniMax OAuth usano entrambi `MiniMax-VL-01`; i provider di configurazione compatibili con immagini si autoregistrano. |
| Audio      | OpenAI, Groq, xAI, Deepgram, Google, SenseAudio, ElevenLabs, Mistral                                                         | Trascrizione provider (Whisper/Groq/xAI/Deepgram/Gemini/SenseAudio/Scribe/Voxtral).                                                                                                                                                   |
| Video      | Google, Qwen, Moonshot                                                                                                       | Comprensione video provider tramite Plugin vendor; la comprensione video Qwen usa gli endpoint Standard DashScope.                                                                                                                   |

<Note>
**Nota MiniMax**

- La comprensione delle immagini `minimax` e `minimax-portal` proviene dal provider media di proprietà del plugin `MiniMax-VL-01`.
- Il catalogo testuale MiniMax incluso resta inizialmente solo testo; le voci esplicite `models.providers.minimax` materializzano riferimenti chat M2.7 compatibili con immagini.
</Note>

## Guida alla selezione del modello

- Preferisci il modello di ultima generazione più forte disponibile per ogni capacità media quando qualità e sicurezza contano.
- Per agenti con strumenti che gestiscono input non attendibili, evita modelli media più vecchi/deboli.
- Mantieni almeno un fallback per capacità per la disponibilità (modello di qualità + modello più rapido/economico).
- I fallback CLI (`whisper-cli`, `whisper`, `gemini`) sono utili quando le API provider non sono disponibili.
- Nota `parakeet-mlx`: con `--output-dir`, OpenClaw legge `<output-dir>/<media-basename>.txt` quando il formato di output è `txt` (o non specificato); i formati non `txt` usano stdout come fallback.

## Policy degli allegati

`attachments` per capacità controlla quali allegati vengono elaborati:

<ParamField path="mode" type='"first" | "all"' default="first">
  Indica se elaborare il primo allegato selezionato o tutti.
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  Limita il numero elaborato.
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  Preferenza di selezione tra gli allegati candidati.
</ParamField>

Quando `mode: "all"`, gli output sono etichettati `[Image 1/2]`, `[Audio 2/2]`, ecc.

<AccordionGroup>
  <Accordion title="Comportamento di estrazione degli allegati file">
    - Il testo estratto dal file viene racchiuso come **contenuto esterno non attendibile** prima di essere aggiunto al prompt dei media.
    - Il blocco iniettato usa marcatori di confine espliciti come `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` e include una riga di metadati `Source: External`.
    - Questo percorso di estrazione degli allegati omette intenzionalmente il lungo banner `SECURITY NOTICE:` per evitare di gonfiare il prompt dei media; i marcatori di confine e i metadati restano comunque presenti.
    - Se un file non ha testo estraibile, OpenClaw inietta `[No extractable text]`.
    - Se in questo percorso un PDF usa come fallback immagini renderizzate delle pagine, il prompt dei media mantiene il placeholder `[PDF content rendered to images; images not forwarded to model]` perché questo passaggio di estrazione degli allegati inoltra blocchi di testo, non le immagini PDF renderizzate.
  </Accordion>
</AccordionGroup>

## Esempi di configurazione

<Tabs>
  <Tab title="Modelli condivisi + override">
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
  </Tab>
  <Tab title="Solo audio + video">
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
  </Tab>
  <Tab title="Solo immagine">
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
  </Tab>
  <Tab title="Voce singola multi-modale">
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
  </Tab>
</Tabs>

## Output di stato

Quando viene eseguita la comprensione dei media, `/status` include una breve riga di riepilogo:

```
📎 Media: image ok (openai/gpt-5.4) · audio skipped (maxBytes)
```

Questo mostra gli esiti per capacità e il provider/modello scelto quando applicabile.

## Note

- La comprensione è **best-effort**. Gli errori non bloccano le risposte.
- Gli allegati vengono comunque passati ai modelli anche quando la comprensione è disabilitata.
- Usa `scope` per limitare dove viene eseguita la comprensione (ad esempio solo nei DM).

## Correlati

- [Configurazione](/it/gateway/configuration)
- [Supporto immagini e media](/it/nodes/images)
