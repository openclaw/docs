---
read_when:
    - Progettare o rifattorizzare la comprensione dei media
    - Ottimizzare la pre-elaborazione di audio/video/immagini in ingresso
sidebarTitle: Media understanding
summary: Comprensione di immagini/audio/video in ingresso (opzionale) con fallback del provider e della CLI
title: Comprensione dei media
x-i18n:
    generated_at: "2026-06-28T06:03:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 40ce9b5c65857702015172cbba76ea4396267894888487b40c11b5997a992362
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw può **riassumere i media in ingresso** (immagini/audio/video) prima dell'esecuzione della pipeline di risposta. Rileva automaticamente quando sono disponibili strumenti locali o chiavi dei provider e può essere disabilitato o personalizzato. Se la comprensione è disattivata, i modelli ricevono comunque i file/URL originali come di consueto.

Il comportamento dei media specifico del fornitore viene registrato dai Plugin del fornitore, mentre il core di OpenClaw gestisce la configurazione condivisa `tools.media`, l'ordine di fallback e l'integrazione con la pipeline di risposta.

## Obiettivi

- Opzionale: pre-elaborare i media in ingresso in testo breve per un instradamento più rapido e una migliore analisi dei comandi.
- Conservare sempre la consegna dei media originali al modello.
- Supportare **API dei provider** e **fallback CLI**.
- Consentire più modelli con fallback ordinato (errore/dimensione/timeout).

## Comportamento generale

<Steps>
  <Step title="Raccogli allegati">
    Raccogli gli allegati in ingresso (`MediaPaths`, `MediaUrls`, `MediaTypes`).
  </Step>
  <Step title="Seleziona per capability">
    Per ogni capability abilitata (immagine/audio/video), seleziona gli allegati in base alla policy (predefinito: **primo**).
  </Step>
  <Step title="Scegli modello">
    Scegli la prima voce di modello idonea (dimensione + capability + autenticazione).
  </Step>
  <Step title="Fallback in caso di errore">
    Se un modello non riesce o il media è troppo grande, **passa alla voce successiva**.
  </Step>
  <Step title="Applica blocco di successo">
    In caso di successo:

    - `Body` diventa un blocco `[Image]`, `[Audio]` o `[Video]`.
    - L'audio imposta `{{Transcript}}`; l'analisi dei comandi usa il testo della didascalia quando presente, altrimenti la trascrizione.
    - Le didascalie vengono conservate come `User text:` all'interno del blocco.

  </Step>
</Steps>

Se la comprensione non riesce o è disabilitata, **il flusso di risposta continua** con il corpo e gli allegati originali.

## Panoramica della configurazione

`tools.media` supporta **modelli condivisi** più override per capability:

<AccordionGroup>
  <Accordion title="Chiavi di primo livello">
    - `tools.media.models`: elenco di modelli condiviso (usa `capabilities` per limitare).
    - `tools.media.image` / `tools.media.audio` / `tools.media.video`:
      - valori predefiniti (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
      - override del provider (`baseUrl`, `headers`, `providerOptions`)
      - opzioni audio Deepgram tramite `tools.media.audio.providerOptions.deepgram`
      - controlli di eco della trascrizione audio (`echoTranscript`, predefinito `false`; `echoFormat`)
      - elenco **`models` per capability** opzionale (preferito prima dei modelli condivisi)
      - policy degli `attachments` (`mode`, `maxAttachments`, `prefer`)
      - `scope` (gating opzionale per chiave channel/chatType/session)
    - `tools.media.concurrency`: numero massimo di esecuzioni di capability simultanee (predefinito **2**).

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

### Voci modello

Ogni voce `models[]` può essere **provider** o **CLI**:

<Tabs>
  <Tab title="Voce provider">
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
    - `{{OutputDir}}` (directory scratch creata per questa esecuzione)
    - `{{OutputBase}}` (percorso base del file scratch, senza estensione)

  </Tab>
</Tabs>

### Credenziali del provider (`apiKey`)

La comprensione dei media tramite provider usa la stessa risoluzione dell'autenticazione del provider delle normali chiamate al modello: profili di autenticazione, variabili d'ambiente, poi `models.providers.<providerId>.apiKey`.

Le voci `tools.media.*.models[]` non accettano un campo `apiKey` inline. Il valore `provider` in una voce di modello media, come `openai` o `moonshot`, deve avere credenziali disponibili tramite una delle sorgenti standard di autenticazione del provider.

Esempio minimo:

```json5
{
  models: {
    providers: {
      openai: { apiKey: "<OPENAI_API_KEY>" },
      moonshot: { apiKey: "<MOONSHOT_API_KEY>" },
    },
  },
}
```

Per il riferimento completo sull'autenticazione dei provider, inclusi profili, variabili d'ambiente e URL base personalizzati, consulta [Strumenti e provider personalizzati](/it/gateway/config-tools).

## Valori predefiniti e limiti

Valori predefiniti consigliati:

- `maxChars`: **500** per immagine/video (breve, adatto ai comandi)
- `maxChars`: **non impostato** per audio (trascrizione completa a meno che non imposti un limite)
- `maxBytes`:
  - immagine: **10 MB**
  - audio: **20 MB**
  - video: **50 MB**

<AccordionGroup>
  <Accordion title="Regole">
    - Se il media supera `maxBytes`, quel modello viene saltato e viene **provato il modello successivo**.
    - I file audio più piccoli di **1024 byte** vengono trattati come vuoti/corrotti e saltati prima della trascrizione provider/CLI; il contesto di risposta in ingresso riceve una trascrizione segnaposto deterministica così l'agente sa che la nota era troppo piccola.
    - Se il modello restituisce più di `maxChars`, l'output viene troncato.
    - Il valore predefinito di `prompt` è un semplice "Describe the {media}." più le indicazioni di `maxChars` (solo immagine/video).
    - Se il modello immagine primario attivo supporta già nativamente la visione, OpenClaw salta il blocco di riepilogo `[Image]` e passa invece l'immagine originale al modello.
    - Se un modello primario Gateway/WebChat è solo testo, gli allegati immagine vengono conservati come riferimenti offload `media://inbound/*` così gli strumenti immagine/PDF o il modello immagine configurato possono comunque ispezionarli invece di perdere l'allegato.
    - Le richieste esplicite `openclaw infer image describe --model <provider/model>` sono diverse: eseguono direttamente quel provider/modello con capacità immagine, inclusi riferimenti Ollama come `ollama/qwen2.5vl:7b`.
    - Se `<capability>.enabled: true` ma non sono configurati modelli, OpenClaw prova il **modello di risposta attivo** quando il suo provider supporta la capability.

  </Accordion>
</AccordionGroup>

### Rilevamento automatico della comprensione dei media (predefinito)

Se `tools.media.<capability>.enabled` **non** è impostato su `false` e non hai configurato modelli, OpenClaw rileva automaticamente in quest'ordine e **si ferma alla prima opzione funzionante**:

<Steps>
  <Step title="Modello di risposta attivo">
    Modello di risposta attivo quando il suo provider supporta la capability.
  </Step>
  <Step title="agents.defaults.imageModel">
    Riferimenti primari/fallback `agents.defaults.imageModel` (solo immagine).
    Preferisci riferimenti `provider/model`. I riferimenti senza prefisso vengono qualificati dalle sole voci di modello provider configurate con capacità immagine quando la corrispondenza è univoca.
  </Step>
  <Step title="CLI locali (solo audio)">
    CLI locali (se installate):

    - `sherpa-onnx-offline` (richiede `SHERPA_ONNX_MODEL_DIR` con encoder/decoder/joiner/tokens)
    - `whisper-cli` (`whisper-cpp`; usa `WHISPER_CPP_MODEL` o il modello tiny incluso)
    - `whisper` (CLI Python; scarica i modelli automaticamente)

  </Step>
  <Step title="CLI Gemini">
    `gemini` usando `read_many_files`.
  </Step>
  <Step title="Autenticazione provider">
    - Le voci `models.providers.*` configurate che supportano la capability vengono provate prima dell'ordine di fallback incluso.
    - I provider di configurazione solo immagine con un modello con capacità immagine si registrano automaticamente per la comprensione dei media anche quando non sono un Plugin fornitore incluso.
    - La comprensione delle immagini Ollama è disponibile quando selezionata esplicitamente, per esempio tramite `agents.defaults.imageModel` o `openclaw infer image describe --model ollama/<vision-model>`.

    Ordine di fallback incluso:

    - Audio: OpenAI → Groq → xAI → Deepgram → OpenRouter → Google → SenseAudio → ElevenLabs → Mistral
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
Il rilevamento dei binari è best-effort su macOS/Linux/Windows; assicurati che la CLI sia in `PATH` (espandiamo `~`) oppure imposta un modello CLI esplicito con un percorso completo del comando.
</Note>

### Supporto dell'ambiente proxy (modelli provider)

Quando la comprensione dei media **audio** e **video** basata su provider è abilitata, OpenClaw rispetta le variabili d'ambiente proxy outbound standard per le chiamate HTTP ai provider:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

Se non sono impostate variabili d'ambiente proxy, la comprensione dei media usa egress diretto. Se il valore del proxy non è valido, OpenClaw registra un avviso e torna al recupero diretto.

## Capability (opzionale)

Se imposti `capabilities`, la voce viene eseguita solo per quei tipi di media. Per gli elenchi condivisi, OpenClaw può inferire i valori predefiniti:

- `openai`, `anthropic`, `minimax`: **immagine**
- `minimax-portal`: **immagine**
- `moonshot`: **immagine + video**
- `openrouter`: **immagine + audio**
- `google` (API Gemini): **immagine + audio + video**
- `qwen`: **immagine + video**
- `mistral`: **audio**
- `zai`: **immagine**
- `groq`: **audio**
- `xai`: **audio**
- `deepgram`: **audio**
- Qualsiasi catalogo `models.providers.<id>.models[]` con un modello con capacità immagine: **immagine**

Per le voci CLI, **imposta `capabilities` esplicitamente** per evitare corrispondenze inattese. Se ometti `capabilities`, la voce è idonea per l'elenco in cui compare.

## Matrice di supporto dei provider (integrazioni OpenClaw)

| Capability | Integrazione provider                                                                                                        | Note                                                                                                                                                                                                                                      |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Immagine   | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, provider di configurazione | I Plugin dei fornitori registrano il supporto immagine; `openai/*` può usare chiavi API o instradamento Codex OAuth; `codex/*` usa un turno limitato di Codex app-server; MiniMax e MiniMax OAuth usano entrambi `MiniMax-VL-01`; i provider di configurazione con capacità immagine si registrano automaticamente. |
| Audio      | OpenAI, Groq, xAI, Deepgram, OpenRouter, Google, SenseAudio, ElevenLabs, Mistral                                             | Trascrizione provider (Whisper/Groq/xAI/Deepgram/OpenRouter STT/Gemini/SenseAudio/Scribe/Voxtral).                                                                                                                                        |
| Video      | Google, Qwen, Moonshot                                                                                                       | Comprensione video provider tramite Plugin dei fornitori; la comprensione video Qwen usa gli endpoint Standard DashScope.                                                                                                                  |

<Note>
**Nota MiniMax**

- La comprensione delle immagini di `minimax`, `minimax-cn`, `minimax-portal` e `minimax-portal-cn` proviene dal provider multimediale `MiniMax-VL-01` di proprietà del Plugin.
- Il routing automatico delle immagini continua a usare `MiniMax-VL-01` anche se i metadati legacy della chat MiniMax M2.x dichiarano input immagine.

</Note>

## Indicazioni per la selezione dei modelli

- Preferisci il modello di ultima generazione più potente disponibile per ogni capacità multimediale quando qualità e sicurezza sono importanti.
- Per agenti abilitati agli strumenti che gestiscono input non attendibili, evita modelli multimediali più vecchi o più deboli.
- Mantieni almeno un fallback per capacità per la disponibilità (modello di qualità + modello più veloce/economico).
- I fallback CLI (`whisper-cli`, `whisper`, `gemini`) sono utili quando le API dei provider non sono disponibili.
- Nota su `parakeet-mlx`: con `--output-dir`, OpenClaw legge `<output-dir>/<media-basename>.txt` quando il formato di output è `txt` (o non specificato); i formati non `txt` ricadono su stdout.

## Criteri per gli allegati

Per ogni capacità, `attachments` controlla quali allegati vengono elaborati:

<ParamField path="mode" type='"first" | "all"' default="first">
  Se elaborare il primo allegato selezionato o tutti gli allegati.
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  Limita il numero elaborato.
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  Preferenza di selezione tra gli allegati candidati.
</ParamField>

Quando `mode: "all"`, gli output sono etichettati `[Image 1/2]`, `[Audio 2/2]` e così via.

<AccordionGroup>
  <Accordion title="Comportamento di estrazione dagli allegati file">
    - Il testo estratto dai file viene racchiuso come **contenuto esterno non attendibile** prima di essere aggiunto al prompt multimediale.
    - Il blocco inserito usa marcatori di confine espliciti come `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` e include una riga di metadati `Source: External`.
    - Questo percorso di estrazione dagli allegati omette intenzionalmente il lungo banner `SECURITY NOTICE:` per evitare di appesantire il prompt multimediale; i marcatori di confine e i metadati restano comunque presenti.
    - Se un file non ha testo estraibile, OpenClaw inserisce `[No extractable text]`.
    - Se in questo percorso un PDF ricade su immagini di pagina renderizzate, OpenClaw inoltra quelle immagini di pagina ai modelli di risposta compatibili con la visione e mantiene il placeholder `[PDF content rendered to images]` nel blocco del file.

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
  <Tab title="Singola voce multimodale">
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

Questo mostra gli esiti per capacità e il provider/modello scelto quando applicabile.

## Note

- La comprensione è **best-effort**. Gli errori non bloccano le risposte.
- Gli allegati vengono comunque passati ai modelli anche quando la comprensione è disabilitata.
- Usa `scope` per limitare dove viene eseguita la comprensione (ad esempio solo nei DM).

## Correlati

- [Configurazione](/it/gateway/configuration)
- [Supporto per immagini e media](/it/nodes/images)
