---
read_when:
    - Generazione di immagini tramite l’agente
    - Configurazione dei provider e dei modelli di generazione di immagini
    - Comprendere i parametri dello strumento `image_generate`
summary: Genera e modifica immagini usando i provider configurati (OpenAI, OpenAI Codex OAuth, Google Gemini, OpenRouter, LiteLLM, fal, MiniMax, ComfyUI, Vydra, xAI)
title: Generazione di immagini
x-i18n:
    generated_at: "2026-04-25T18:23:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 40ec0e9a004e769b3db8b98b1a687097cb4bc6aa78dc903e4f6a17c3731156c0
    source_path: tools/image-generation.md
    workflow: 15
---

Lo strumento `image_generate` permette all’agente di creare e modificare immagini usando i provider configurati. Le immagini generate vengono recapitate automaticamente come allegati multimediali nella risposta dell’agente.

<Note>
Lo strumento appare solo quando è disponibile almeno un provider di generazione di immagini. Se non vedi `image_generate` tra gli strumenti del tuo agente, configura `agents.defaults.imageGenerationModel`, imposta una chiave API del provider oppure accedi con OpenAI Codex OAuth.
</Note>

## Avvio rapido

1. Imposta una chiave API per almeno un provider (ad esempio `OPENAI_API_KEY`, `GEMINI_API_KEY` o `OPENROUTER_API_KEY`) oppure accedi con OpenAI Codex OAuth.
2. Facoltativamente imposta il modello preferito:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        // Timeout predefinito facoltativo della richiesta provider per image_generate.
        timeoutMs: 180_000,
      },
    },
  },
}
```

Codex OAuth usa lo stesso riferimento modello `openai/gpt-image-2`. Quando è configurato un
profilo OAuth `openai-codex`, OpenClaw instrada le richieste di immagini
attraverso quello stesso profilo OAuth invece di provare prima `OPENAI_API_KEY`.
Una configurazione immagine `models.providers.openai` personalizzata esplicita, come una chiave API o
un URL di base custom/Azure, riporta invece al percorso diretto OpenAI Images API.
Per endpoint LAN compatibili con OpenAI come LocalAI, mantieni il valore personalizzato
`models.providers.openai.baseUrl` ed effettua esplicitamente l’opt-in con
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; gli endpoint immagine privati/interni restano bloccati per impostazione predefinita.

3. Chiedi all’agente: _"Genera un’immagine di una mascotte robot amichevole."_

L’agente chiama `image_generate` automaticamente. Nessuna allowlist degli strumenti necessaria: è abilitato per impostazione predefinita quando un provider è disponibile.

## Route comuni

| Obiettivo                                            | Riferimento modello                               | Auth                                 |
| ---------------------------------------------------- | ------------------------------------------------- | ------------------------------------ |
| Generazione immagini OpenAI con fatturazione API     | `openai/gpt-image-2`                              | `OPENAI_API_KEY`                     |
| Generazione immagini OpenAI con auth da abbonamento Codex | `openai/gpt-image-2`                          | OpenAI Codex OAuth                   |
| Generazione immagini OpenRouter                      | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`               |
| Generazione immagini LiteLLM                         | `litellm/gpt-image-2`                             | `LITELLM_API_KEY`                    |
| Generazione immagini Google Gemini                   | `google/gemini-3.1-flash-image-preview`           | `GEMINI_API_KEY` o `GOOGLE_API_KEY`  |

Lo stesso strumento `image_generate` gestisce sia la generazione da testo sia la
modifica di immagini di riferimento. Usa `image` per un riferimento o `images` per più riferimenti.
Gli hint di output supportati dal provider come `quality`, `outputFormat` e
`background` specifico OpenAI vengono inoltrati quando disponibili e riportati come
ignorati quando un provider non li supporta.

## Provider supportati

| Provider   | Modello predefinito                      | Supporto modifica                  | Auth                                                  |
| ---------- | ---------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| OpenAI     | `gpt-image-2`                            | Sì (fino a 4 immagini)             | `OPENAI_API_KEY` o OpenAI Codex OAuth                 |
| OpenRouter | `google/gemini-3.1-flash-image-preview`  | Sì (fino a 5 immagini di input)    | `OPENROUTER_API_KEY`                                  |
| LiteLLM    | `gpt-image-2`                            | Sì (fino a 5 immagini di input)    | `LITELLM_API_KEY`                                     |
| Google     | `gemini-3.1-flash-image-preview`         | Sì                                 | `GEMINI_API_KEY` o `GOOGLE_API_KEY`                   |
| fal        | `fal-ai/flux/dev`                        | Sì                                 | `FAL_KEY`                                             |
| MiniMax    | `image-01`                               | Sì (riferimento al soggetto)       | `MINIMAX_API_KEY` o MiniMax OAuth (`minimax-portal`)  |
| ComfyUI    | `workflow`                               | Sì (1 immagine, configurata nel workflow) | `COMFY_API_KEY` o `COMFY_CLOUD_API_KEY` per il cloud |
| Vydra      | `grok-imagine`                           | No                                 | `VYDRA_API_KEY`                                       |
| xAI        | `grok-imagine-image`                     | Sì (fino a 5 immagini)             | `XAI_API_KEY`                                         |

Usa `action: "list"` per ispezionare i provider e i modelli disponibili a runtime:

```
/tool image_generate action=list
```

## Parametri dello strumento

<ParamField path="prompt" type="string" required>
Prompt di generazione dell’immagine. Obbligatorio per `action: "generate"`.
</ParamField>

<ParamField path="action" type="'generate' | 'list'" default="generate">
Usa `"list"` per ispezionare i provider e i modelli disponibili a runtime.
</ParamField>

<ParamField path="model" type="string">
Override provider/modello, ad esempio `openai/gpt-image-2`.
</ParamField>

<ParamField path="image" type="string">
Percorso o URL di una singola immagine di riferimento per la modalità di modifica.
</ParamField>

<ParamField path="images" type="string[]">
Più immagini di riferimento per la modalità di modifica (fino a 5).
</ParamField>

<ParamField path="size" type="string">
Hint di dimensione: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`.
</ParamField>

<ParamField path="aspectRatio" type="string">
Rapporto d’aspetto: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`.
</ParamField>

<ParamField path="resolution" type="'1K' | '2K' | '4K'">
Hint di risoluzione.
</ParamField>

<ParamField path="quality" type="'low' | 'medium' | 'high' | 'auto'">
Hint di qualità quando il provider lo supporta.
</ParamField>

<ParamField path="outputFormat" type="'png' | 'jpeg' | 'webp'">
Hint di formato di output quando il provider lo supporta.
</ParamField>

<ParamField path="count" type="number">
Numero di immagini da generare (1–4).
</ParamField>

<ParamField path="timeoutMs" type="number">
Timeout facoltativo della richiesta provider in millisecondi.
</ParamField>

<ParamField path="filename" type="string">
Hint per il nome file di output.
</ParamField>

<ParamField path="openai" type="object">
Hint solo OpenAI: `background`, `moderation`, `outputCompression` e `user`.
</ParamField>

Non tutti i provider supportano tutti i parametri. Quando un provider di fallback supporta un’opzione geometrica vicina invece di quella richiesta esatta, OpenClaw rimappa alla dimensione, al rapporto d’aspetto o alla risoluzione supportata più vicina prima dell’invio. Gli hint di output non supportati come `quality` o `outputFormat` vengono rimossi per i provider che non dichiarano supporto e sono riportati nel risultato dello strumento.

I risultati dello strumento riportano le impostazioni applicate. Quando OpenClaw rimappa la geometria durante il fallback del provider, i valori restituiti `size`, `aspectRatio` e `resolution` riflettono ciò che è stato realmente inviato, e `details.normalization` acquisisce la traduzione da richiesto ad applicato.

## Configurazione

### Selezione del modello

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        timeoutMs: 180_000,
        fallbacks: [
          "openrouter/google/gemini-3.1-flash-image-preview",
          "google/gemini-3.1-flash-image-preview",
          "fal/fal-ai/flux/dev",
        ],
      },
    },
  },
}
```

### Ordine di selezione del provider

Quando genera un’immagine, OpenClaw prova i provider in questo ordine:

1. **Parametro `model`** dalla chiamata dello strumento (se l’agente ne specifica uno)
2. **`imageGenerationModel.primary`** dalla configurazione
3. **`imageGenerationModel.fallbacks`** nell’ordine indicato
4. **Rilevamento automatico** — usa solo i valori predefiniti dei provider supportati da auth:
   - prima il provider predefinito corrente
   - poi i rimanenti provider di generazione di immagini registrati in ordine di id provider

Se un provider fallisce (errore auth, rate limit, ecc.), viene provato automaticamente il candidato configurato successivo. Se falliscono tutti, l’errore include i dettagli di ogni tentativo.

Note:

- Un override `model` per singola chiamata è esatto: OpenClaw prova solo quel provider/modello
  e non continua con primary/fallback configurati o provider rilevati automaticamente.
- Il rilevamento automatico è consapevole dell’auth. Un provider predefinito entra nell’elenco dei candidati
  solo quando OpenClaw può effettivamente autenticare quel provider.
- Il rilevamento automatico è abilitato per impostazione predefinita. Imposta
  `agents.defaults.mediaGenerationAutoProviderFallback: false` se vuoi che la generazione
  di immagini usi solo le voci esplicite `model`, `primary` e `fallbacks`.
- Imposta `agents.defaults.imageGenerationModel.timeoutMs` per backend immagini lenti.
  Un parametro dello strumento `timeoutMs` per singola chiamata sostituisce il valore predefinito configurato.
- Usa `action: "list"` per ispezionare i provider attualmente registrati, i loro
  modelli predefiniti e gli hint delle env-var auth.

### Modifica delle immagini

OpenAI, OpenRouter, Google, fal, MiniMax, ComfyUI e xAI supportano la modifica di immagini di riferimento. Passa un percorso o URL di immagine di riferimento:

```
"Genera una versione ad acquerello di questa foto" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter, Google e xAI supportano fino a 5 immagini di riferimento tramite il parametro `images`. fal, MiniMax e ComfyUI ne supportano 1.

### Modelli immagine OpenRouter

La generazione di immagini OpenRouter usa la stessa `OPENROUTER_API_KEY` e instrada attraverso l’API immagini chat completions di OpenRouter. Seleziona i modelli immagine OpenRouter con il prefisso `openrouter/`:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openrouter/google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

OpenClaw inoltra `prompt`, `count`, immagini di riferimento e hint `aspectRatio` / `resolution` compatibili con Gemini a OpenRouter. Gli shortcut attualmente integrati per i modelli immagine OpenRouter includono `google/gemini-3.1-flash-image-preview`, `google/gemini-3-pro-image-preview` e `openai/gpt-5.4-image-2`; usa `action: "list"` per vedere cosa espone il Plugin configurato.

### OpenAI `gpt-image-2`

La generazione di immagini OpenAI usa per impostazione predefinita `openai/gpt-image-2`. Se è configurato un
profilo OAuth `openai-codex`, OpenClaw riutilizza lo stesso profilo OAuth
usato dai modelli chat in abbonamento Codex e invia la richiesta immagine
attraverso il backend Codex Responses. URL di base legacy Codex come
`https://chatgpt.com/backend-api` vengono canonicalizzati in
`https://chatgpt.com/backend-api/codex` per le richieste immagine. Non viene
eseguito un fallback silenzioso a `OPENAI_API_KEY` per quella richiesta. Per forzare il routing diretto alle
OpenAI Images API, configura esplicitamente `models.providers.openai` con una chiave API,
un URL di base personalizzato o un endpoint Azure. Il modello meno recente
`openai/gpt-image-1` può ancora essere selezionato esplicitamente, ma le nuove richieste OpenAI di
generazione e modifica immagini dovrebbero usare `gpt-image-2`.

`gpt-image-2` supporta sia la generazione da testo sia la
modifica di immagini di riferimento attraverso lo stesso strumento `image_generate`. OpenClaw inoltra `prompt`,
`count`, `size`, `quality`, `outputFormat` e immagini di riferimento a OpenAI.
OpenAI non riceve direttamente `aspectRatio` o `resolution`; quando possibile
OpenClaw li mappa in un `size` supportato, altrimenti lo strumento li riporta come
override ignorati.

Le opzioni specifiche OpenAI si trovano sotto l’oggetto `openai`:

```json
{
  "quality": "low",
  "outputFormat": "jpeg",
  "openai": {
    "background": "opaque",
    "moderation": "low",
    "outputCompression": 60,
    "user": "end-user-42"
  }
}
```

`openai.background` accetta `transparent`, `opaque` o `auto`; gli output
trasparenti richiedono `outputFormat` `png` o `webp`. `openai.outputCompression`
si applica agli output JPEG/WebP.

Genera un’immagine orizzontale 4K:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Un poster editoriale pulito per la generazione di immagini OpenClaw" size=3840x2160 count=1
```

Genera due immagini quadrate:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Due direzioni visive per l’icona di un’app di produttività calma" size=1024x1024 count=2
```

Modifica una singola immagine di riferimento locale:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Mantieni il soggetto, sostituisci lo sfondo con un set da studio luminoso" image=/path/to/reference.png size=1024x1536
```

Modifica con più riferimenti:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combina l’identità del personaggio della prima immagine con la palette colori della seconda" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```

Per instradare la generazione di immagini OpenAI attraverso un deployment Azure OpenAI invece di `api.openai.com`, vedi [Azure OpenAI endpoints](/it/providers/openai#azure-openai-endpoints)
nella documentazione del provider OpenAI.

La generazione di immagini MiniMax è disponibile tramite entrambi i percorsi auth MiniMax inclusi:

- `minimax/image-01` per configurazioni con chiave API
- `minimax-portal/image-01` per configurazioni OAuth

## Capability del provider

| Capability            | OpenAI               | Google               | fal                 | MiniMax                    | ComfyUI                            | Vydra   | xAI                  |
| --------------------- | -------------------- | -------------------- | ------------------- | -------------------------- | ---------------------------------- | ------- | -------------------- |
| Generazione           | Sì (fino a 4)        | Sì (fino a 4)        | Sì (fino a 4)       | Sì (fino a 9)              | Sì (output definiti dal workflow)  | Sì (1)  | Sì (fino a 4)        |
| Modifica/riferimento  | Sì (fino a 5 immagini) | Sì (fino a 5 immagini) | Sì (1 immagine)   | Sì (1 immagine, riferimento soggetto) | Sì (1 immagine, configurata nel workflow) | No | Sì (fino a 5 immagini) |
| Controllo dimensione  | Sì (fino a 4K)       | Sì                   | Sì                  | No                         | No                                 | No      | No                   |
| Rapporto d’aspetto    | No                   | Sì                   | Sì (solo generazione) | Sì                      | No                                 | No      | Sì                   |
| Risoluzione (1K/2K/4K) | No                  | Sì                   | Sì                  | No                         | No                                 | No      | Sì (1K/2K)           |

### xAI `grok-imagine-image`

Il provider xAI incluso usa `/v1/images/generations` per le richieste solo prompt
e `/v1/images/edits` quando è presente `image` o `images`.

- Modelli: `xai/grok-imagine-image`, `xai/grok-imagine-image-pro`
- Count: fino a 4
- Riferimenti: un `image` o fino a cinque `images`
- Rapporti d’aspetto: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
- Risoluzioni: `1K`, `2K`
- Output: restituiti come allegati immagine gestiti da OpenClaw

OpenClaw intenzionalmente non espone `quality`, `mask`, `user` nativi xAI o
rapporti d’aspetto extra solo nativi finché questi controlli non esisteranno nel contratto
condiviso cross-provider di `image_generate`.

## Correlati

- [Tools Overview](/it/tools) — tutti gli strumenti dell’agente disponibili
- [fal](/it/providers/fal) — configurazione del provider immagini e video fal
- [ComfyUI](/it/providers/comfy) — configurazione del workflow ComfyUI locale e Comfy Cloud
- [Google (Gemini)](/it/providers/google) — configurazione del provider immagini Gemini
- [MiniMax](/it/providers/minimax) — configurazione del provider immagini MiniMax
- [OpenAI](/it/providers/openai) — configurazione del provider OpenAI Images
- [Vydra](/it/providers/vydra) — configurazione Vydra per immagini, video e voce
- [xAI](/it/providers/xai) — configurazione Grok per immagini, video, ricerca, esecuzione di codice e TTS
- [Configuration Reference](/it/gateway/config-agents#agent-defaults) — configurazione `imageGenerationModel`
- [Models](/it/concepts/models) — configurazione del modello e failover
