---
read_when:
    - Progettazione o refactoring della comprensione dei media
    - Ottimizzazione della pre-elaborazione di audio/video/immagini in ingresso
sidebarTitle: Media understanding
summary: Comprensione in ingresso di immagini/audio/video (opzionale) con fallback del provider + CLI
title: Comprensione dei media
x-i18n:
    generated_at: "2026-04-30T09:00:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 907cb0c84f7f0ab916ec07f65dcdffcf4f3c280a5c84ae1bc6fdf758d57545dd
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw può **riassumere i media in ingresso** (immagini/audio/video) prima dell'esecuzione della pipeline di risposta. Rileva automaticamente quando sono disponibili strumenti locali o chiavi del provider, e può essere disabilitato o personalizzato. Se la comprensione è disattivata, i modelli ricevono comunque i file/URL originali come di consueto.

Il comportamento dei media specifico del vendor è registrato dai plugin dei vendor, mentre il core di OpenClaw gestisce la configurazione condivisa `tools.media`, l'ordine di fallback e l'integrazione con la pipeline di risposta.

## Obiettivi

- Opzionale: pre-elaborare i media in ingresso in testo breve per un routing più rapido e una migliore analisi dei comandi.
- Preservare la consegna dei media originali al modello (sempre).
- Supportare **API dei provider** e **fallback CLI**.
- Consentire più modelli con fallback ordinato (errore/dimensione/timeout).

## Comportamento generale

<Steps>
  <Step title="Collect attachments">
    Raccoglie gli allegati in ingresso (`MediaPaths`, `MediaUrls`, `MediaTypes`).
  </Step>
  <Step title="Select per-capability">
    Per ogni capacità abilitata (immagine/audio/video), seleziona gli allegati in base alla policy (predefinito: **primo**).
  </Step>
  <Step title="Choose model">
    Sceglie la prima voce di modello idonea (dimensione + capacità + autenticazione).
  </Step>
  <Step title="Fallback on failure">
    Se un modello fallisce o il media è troppo grande, **ripiega sulla voce successiva**.
  </Step>
  <Step title="Apply success block">
    In caso di successo:

    - `Body` diventa un blocco `[Image]`, `[Audio]` o `[Video]`.
    - L'audio imposta `{{Transcript}}`; l'analisi dei comandi usa il testo della didascalia quando presente, altrimenti la trascrizione.
    - Le didascalie sono preservate come `User text:` all'interno del blocco.

  </Step>
</Steps>

Se la comprensione fallisce o è disabilitata, **il flusso di risposta continua** con il corpo originale + gli allegati.

## Panoramica della configurazione

`tools.media` supporta **modelli condivisi** più override per capacità:

<AccordionGroup>
  <Accordion title="Top-level keys">
    - `tools.media.models`: elenco di modelli condiviso (usa `capabilities` per limitare).
    - `tools.media.image` / `tools.media.audio` / `tools.media.video`:
      - valori predefiniti (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
      - override dei provider (`baseUrl`, `headers`, `providerOptions`)
      - opzioni audio Deepgram tramite `tools.media.audio.providerOptions.deepgram`
      - controlli dell'eco della trascrizione audio (`echoTranscript`, predefinito `false`; `echoFormat`)
      - elenco **per capacità `models`** opzionale (preferito prima dei modelli condivisi)
      - policy `attachments` (`mode`, `maxAttachments`, `prefer`)
      - `scope` (limitazione opzionale per chiave canale/chatType/sessione)
    - `tools.media.concurrency`: numero massimo di esecuzioni di capacità concorrenti (predefinito **2**).

  </Accordion>
</AccordionGroup>

```json5
{
  tools: {
    media: {
      models: [
        /* shared list */
      ],
      image: {
        /* optional overrides */
      },
      audio: {
        /* optional overrides */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {
        /* optional overrides */
      },
    },
  },
}
```

### Voci dei modelli

Ogni voce `models[]` può essere **provider** o **CLI**:

<Tabs>
  <Tab title="Provider entry">
    ```json5
    {
      type: "provider", // default if omitted
      provider: "openai",
      model: "gpt-5.5",
      prompt: "Describe the image in <= 500 chars.",
      maxChars: 500,
      maxBytes: 10485760,
      timeoutSeconds: 60,
      capabilities: ["image"], // optional, used for multi-modal entries
      profile: "vision-profile",
      preferredProfile: "vision-fallback",
    }
    ```
  </Tab>
  <Tab title="CLI entry">
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

    - `{{MediaDir}}` (directory contenente il file multimediale)
    - `{{OutputDir}}` (directory temporanea creata per questa esecuzione)
    - `{{OutputBase}}` (percorso base del file temporaneo, senza estensione)

  </Tab>
</Tabs>

## Valori predefiniti e limiti

Valori predefiniti consigliati:

- `maxChars`: **500** per immagine/video (breve, adatto ai comandi)
- `maxChars`: **non impostato** per l'audio (trascrizione completa, a meno che tu non imposti un limite)
- `maxBytes`:
  - immagine: **10 MB**
  - audio: **20 MB**
  - video: **50 MB**

<AccordionGroup>
  <Accordion title="Rules">
    - Se il media supera `maxBytes`, quel modello viene ignorato e viene provato il **modello successivo**.
    - I file audio più piccoli di **1024 byte** sono trattati come vuoti/corrotti e ignorati prima della trascrizione tramite provider/CLI; il contesto della risposta in ingresso riceve una trascrizione segnaposto deterministica, così l'agente sa che la nota era troppo piccola.
    - Se il modello restituisce più di `maxChars`, l'output viene troncato.
    - `prompt` usa come valore predefinito un semplice "Describe the {media}." più l'indicazione `maxChars` (solo immagine/video).
    - Se il modello immagine primario attivo supporta già nativamente la visione, OpenClaw salta il blocco di riepilogo `[Image]` e passa invece l'immagine originale al modello.
    - Se un modello primario Gateway/WebChat è solo testo, gli allegati immagine vengono preservati come riferimenti offloaded `media://inbound/*`, così gli strumenti per immagini/PDF o il modello immagine configurato possono comunque ispezionarli invece di perdere l'allegato.
    - Le richieste esplicite `openclaw infer image describe --model <provider/model>` sono diverse: eseguono direttamente quel provider/modello con supporto immagini, inclusi riferimenti Ollama come `ollama/qwen2.5vl:7b`.
    - Se `<capability>.enabled: true` ma non sono configurati modelli, OpenClaw prova il **modello di risposta attivo** quando il suo provider supporta la capacità.

  </Accordion>
</AccordionGroup>

### Rilevamento automatico della comprensione dei media (predefinito)

Se `tools.media.<capability>.enabled` **non** è impostato su `false` e non hai configurato modelli, OpenClaw rileva automaticamente in questo ordine e **si ferma alla prima opzione funzionante**:

<Steps>
  <Step title="Active reply model">
    Modello di risposta attivo quando il suo provider supporta la capacità.
  </Step>
  <Step title="agents.defaults.imageModel">
    Riferimenti primari/fallback `agents.defaults.imageModel` (solo immagine).
    Preferisci riferimenti `provider/model`. I riferimenti semplici vengono qualificati dalle voci di modelli provider configurate con supporto immagini solo quando la corrispondenza è univoca.
  </Step>
  <Step title="Local CLIs (audio only)">
    CLI locali (se installate):

    - `sherpa-onnx-offline` (richiede `SHERPA_ONNX_MODEL_DIR` con encoder/decoder/joiner/tokens)
    - `whisper-cli` (`whisper-cpp`; usa `WHISPER_CPP_MODEL` o il modello tiny incluso)
    - `whisper` (CLI Python; scarica automaticamente i modelli)

  </Step>
  <Step title="Gemini CLI">
    `gemini` usando `read_many_files`.
  </Step>
  <Step title="Provider auth">
    - Le voci configurate `models.providers.*` che supportano la capacità vengono provate prima dell'ordine di fallback incluso.
    - I provider di configurazione solo immagine con un modello con supporto immagini si registrano automaticamente per la comprensione dei media anche quando non sono un plugin vendor incluso.
    - La comprensione immagini di Ollama è disponibile quando selezionata esplicitamente, per esempio tramite `agents.defaults.imageModel` o `openclaw infer image describe --model ollama/<vision-model>`.

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
Il rilevamento dei binari è best-effort su macOS/Linux/Windows; assicurati che la CLI sia in `PATH` (espandiamo `~`), oppure imposta un modello CLI esplicito con un percorso completo del comando.
</Note>

### Supporto dell'ambiente proxy (modelli provider)

Quando la comprensione dei media basata su provider per **audio** e **video** è abilitata, OpenClaw rispetta le variabili d'ambiente proxy in uscita standard per le chiamate HTTP ai provider:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

Se non sono impostate variabili d'ambiente proxy, la comprensione dei media usa l'egress diretto. Se il valore del proxy è malformato, OpenClaw registra un avviso e ripiega sul recupero diretto.

## Capacità (opzionale)

Se imposti `capabilities`, la voce viene eseguita solo per quei tipi di media. Per gli elenchi condivisi, OpenClaw può dedurre i valori predefiniti:

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
- Qualsiasi catalogo `models.providers.<id>.models[]` con un modello con supporto immagini: **immagine**

Per le voci CLI, **imposta `capabilities` esplicitamente** per evitare corrispondenze inattese. Se ometti `capabilities`, la voce è idonea per l'elenco in cui compare.

## Matrice di supporto dei provider (integrazioni OpenClaw)

| Capacità  | Integrazione provider                                                                                                        | Note                                                                                                                                                                                                                                                |
| --------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Immagine  | OpenAI, OpenAI Codex OAuth, server app Codex, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, provider config  | I plugin vendor registrano il supporto immagini; `openai-codex/*` usa il plumbing del provider OAuth; `codex/*` usa un turno limitato del server app Codex; MiniMax e MiniMax OAuth usano entrambi `MiniMax-VL-01`; i provider config con supporto immagini si registrano automaticamente. |
| Audio     | OpenAI, Groq, xAI, Deepgram, Google, SenseAudio, ElevenLabs, Mistral                                                         | Trascrizione provider (Whisper/Groq/xAI/Deepgram/Gemini/SenseAudio/Scribe/Voxtral).                                                                                                                                                                 |
| Video     | Google, Qwen, Moonshot                                                                                                       | Comprensione video del provider tramite plugin vendor; la comprensione video Qwen usa gli endpoint Standard DashScope.                                                                                                                               |

<Note>
**Nota MiniMax**

- La comprensione immagini `minimax` e `minimax-portal` proviene dal provider media `MiniMax-VL-01` gestito dal plugin.
- Il catalogo testuale MiniMax incluso parte comunque come solo testo; le voci esplicite `models.providers.minimax` materializzano riferimenti chat M2.7 con supporto immagini.

</Note>

## Indicazioni per la selezione dei modelli

- Preferisci il modello di ultima generazione più potente disponibile per ogni capacità media quando qualità e sicurezza sono importanti.
- Per agenti con strumenti abilitati che gestiscono input non attendibili, evita modelli media più vecchi/deboli.
- Mantieni almeno un fallback per capacità per la disponibilità (modello di qualità + modello più rapido/economico).
- I fallback CLI (`whisper-cli`, `whisper`, `gemini`) sono utili quando le API dei provider non sono disponibili.
- Nota su `parakeet-mlx`: con `--output-dir`, OpenClaw legge `<output-dir>/<media-basename>.txt` quando il formato di output è `txt` (o non specificato); i formati non `txt` ripiegano su stdout.

## Policy degli allegati

Per capacità, `attachments` controlla quali allegati vengono elaborati:

<ParamField path="mode" type='"first" | "all"' default="first">
  Se elaborare il primo allegato selezionato o tutti gli allegati.
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  Limita il numero di elementi elaborati.
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  Preferenza di selezione tra gli allegati candidati.
</ParamField>

Quando `mode: "all"`, gli output sono etichettati come `[Image 1/2]`, `[Audio 2/2]`, ecc.

<AccordionGroup>
  <Accordion title="Comportamento di estrazione degli allegati file">
    - Il testo estratto dai file viene racchiuso come **contenuto esterno non attendibile** prima di essere aggiunto al prompt multimediale.
    - Il blocco iniettato usa marcatori di confine espliciti come `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` e include una riga di metadati `Source: External`.
    - Questo percorso di estrazione degli allegati omette intenzionalmente il lungo banner `SECURITY NOTICE:` per evitare di appesantire il prompt multimediale; i marcatori di confine e i metadati rimangono comunque.
    - Se un file non ha testo estraibile, OpenClaw inietta `[No extractable text]`.
    - Se in questo percorso un PDF ripiega su immagini delle pagine renderizzate, il prompt multimediale mantiene il segnaposto `[PDF content rendered to images; images not forwarded to model]` perché questo passaggio di estrazione degli allegati inoltra blocchi di testo, non le immagini PDF renderizzate.

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
  <Tab title="Solo immagini">
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
  <Tab title="Voce singola multimodale">
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

Quando la comprensione multimediale viene eseguita, `/status` include una breve riga di riepilogo:

```
📎 Media: image ok (openai/gpt-5.4) · audio skipped (maxBytes)
```

Questo mostra i risultati per ciascuna funzionalità e il provider/modello scelto quando applicabile.

## Note

- La comprensione è **best-effort**. Gli errori non bloccano le risposte.
- Gli allegati vengono comunque passati ai modelli anche quando la comprensione è disabilitata.
- Usa `scope` per limitare dove viene eseguita la comprensione (ad esempio solo nei DM).

## Correlati

- [Configurazione](/it/gateway/configuration)
- [Supporto immagini e media](/it/nodes/images)
