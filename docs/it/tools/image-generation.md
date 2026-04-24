---
read_when:
    - Generare immagini tramite l'agente
    - Configurare provider e modelli di generazione immagini
    - Capire i parametri dello strumento image_generate
summary: Genera e modifica immagini usando i provider configurati (OpenAI, OpenAI Codex OAuth, Google Gemini, OpenRouter, fal, MiniMax, ComfyUI, Vydra, xAI)
title: Generazione di immagini
x-i18n:
    generated_at: "2026-04-24T09:06:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 51ffc32165c5e25925460f95f3a6e674a004e6640b7a4b9e88d025eb40943b4b
    source_path: tools/image-generation.md
    workflow: 15
---

Lo strumento `image_generate` consente all'agente di creare e modificare immagini usando i provider configurati. Le immagini generate vengono recapitate automaticamente come allegati multimediali nella risposta dell'agente.

<Note>
Lo strumento compare solo quando è disponibile almeno un provider di generazione immagini. Se non vedi `image_generate` tra gli strumenti del tuo agente, configura `agents.defaults.imageGenerationModel`, imposta una chiave API del provider o accedi con OpenAI Codex OAuth.
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
      },
    },
  },
}
```

Codex OAuth usa lo stesso ref di modello `openai/gpt-image-2`. Quando è configurato un
profilo OAuth `openai-codex`, OpenClaw instrada le richieste di immagine
attraverso quello stesso profilo OAuth invece di provare prima `OPENAI_API_KEY`.
Una configurazione esplicita e personalizzata dell'immagine in `models.providers.openai`, come una chiave API o
un URL base personalizzato/Azure, riabilita il percorso diretto OpenAI Images API.
Per endpoint LAN compatibili con OpenAI come LocalAI, mantieni il
`models.providers.openai.baseUrl` personalizzato e fai esplicito opt-in con
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; gli endpoint immagine
privati/interni restano bloccati per impostazione predefinita.

3. Chiedi all'agente: _"Genera un'immagine di una mascotte robot amichevole."_

L'agente chiama automaticamente `image_generate`. Nessuna allowlist dello strumento necessaria — è abilitato per impostazione predefinita quando è disponibile un provider.

## Provider supportati

| Provider   | Modello predefinito                      | Supporto modifica                  | Auth                                                  |
| ---------- | ---------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| OpenAI     | `gpt-image-2`                            | Sì (fino a 4 immagini)             | `OPENAI_API_KEY` o OpenAI Codex OAuth                 |
| OpenRouter | `google/gemini-3.1-flash-image-preview`  | Sì (fino a 5 immagini di input)    | `OPENROUTER_API_KEY`                                  |
| Google     | `gemini-3.1-flash-image-preview`         | Sì                                 | `GEMINI_API_KEY` o `GOOGLE_API_KEY`                   |
| fal        | `fal-ai/flux/dev`                        | Sì                                 | `FAL_KEY`                                             |
| MiniMax    | `image-01`                               | Sì (reference del soggetto)        | `MINIMAX_API_KEY` o OAuth MiniMax (`minimax-portal`)  |
| ComfyUI    | `workflow`                               | Sì (1 immagine, configurata nel workflow) | `COMFY_API_KEY` o `COMFY_CLOUD_API_KEY` per il cloud |
| Vydra      | `grok-imagine`                           | No                                 | `VYDRA_API_KEY`                                       |
| xAI        | `grok-imagine-image`                     | Sì (fino a 5 immagini)             | `XAI_API_KEY`                                         |

Usa `action: "list"` per ispezionare a runtime provider e modelli disponibili:

```
/tool image_generate action=list
```

## Parametri dello strumento

<ParamField path="prompt" type="string" required>
Prompt di generazione immagine. Obbligatorio per `action: "generate"`.
</ParamField>

<ParamField path="action" type="'generate' | 'list'" default="generate">
Usa `"list"` per ispezionare a runtime provider e modelli disponibili.
</ParamField>

<ParamField path="model" type="string">
Override provider/modello, ad es. `openai/gpt-image-2`.
</ParamField>

<ParamField path="image" type="string">
Singolo percorso immagine di riferimento o URL per la modalità modifica.
</ParamField>

<ParamField path="images" type="string[]">
Più immagini di riferimento per la modalità modifica (fino a 5).
</ParamField>

<ParamField path="size" type="string">
Suggerimento di dimensione: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`.
</ParamField>

<ParamField path="aspectRatio" type="string">
Aspect ratio: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`.
</ParamField>

<ParamField path="resolution" type="'1K' | '2K' | '4K'">
Suggerimento di risoluzione.
</ParamField>

<ParamField path="quality" type="'low' | 'medium' | 'high' | 'auto'">
Suggerimento di qualità quando il provider lo supporta.
</ParamField>

<ParamField path="outputFormat" type="'png' | 'jpeg' | 'webp'">
Suggerimento di formato di output quando il provider lo supporta.
</ParamField>

<ParamField path="count" type="number">
Numero di immagini da generare (1–4).
</ParamField>

<ParamField path="timeoutMs" type="number">
Timeout facoltativo della richiesta al provider in millisecondi.
</ParamField>

<ParamField path="filename" type="string">
Suggerimento del nome file di output.
</ParamField>

<ParamField path="openai" type="object">
Suggerimenti solo OpenAI: `background`, `moderation`, `outputCompression` e `user`.
</ParamField>

Non tutti i provider supportano tutti i parametri. Quando un provider di fallback supporta un'opzione geometrica vicina invece di quella richiesta esattamente, OpenClaw rimappa alla dimensione, all'aspect ratio o alla risoluzione supportati più vicini prima dell'invio. I suggerimenti di output non supportati, come `quality` o `outputFormat`, vengono eliminati per i provider che non ne dichiarano il supporto e vengono segnalati nel risultato dello strumento.

I risultati dello strumento riportano le impostazioni applicate. Quando OpenClaw rimappa la geometria durante il fallback del provider, i valori restituiti `size`, `aspectRatio` e `resolution` riflettono ciò che è stato realmente inviato, e `details.normalization` cattura la traduzione da richiesto ad applicato.

## Configurazione

### Selezione del modello

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
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

Quando genera un'immagine, OpenClaw prova i provider in questo ordine:

1. Il parametro **`model`** della chiamata allo strumento (se l'agente ne specifica uno)
2. **`imageGenerationModel.primary`** dalla configurazione
3. **`imageGenerationModel.fallbacks`** in ordine
4. **Rilevamento automatico** — usa solo i valori predefiniti dei provider supportati da auth:
   - prima il provider predefinito corrente
   - poi i restanti provider di generazione immagini registrati in ordine di provider-id

Se un provider fallisce (errore auth, rate limit, ecc.), il candidato successivo viene provato automaticamente. Se falliscono tutti, l'errore include dettagli di ogni tentativo.

Note:

- Il rilevamento automatico è consapevole dell'auth. Un provider predefinito entra nell'elenco dei candidati
  solo quando OpenClaw può davvero autenticare quel provider.
- Il rilevamento automatico è abilitato per impostazione predefinita. Imposta
  `agents.defaults.mediaGenerationAutoProviderFallback: false` se vuoi che la generazione di immagini
  usi solo le voci esplicite `model`, `primary` e `fallbacks`.
- Usa `action: "list"` per ispezionare i provider attualmente registrati, i loro
  modelli predefiniti e i suggerimenti sulle variabili env di autenticazione.

### Modifica delle immagini

OpenAI, OpenRouter, Google, fal, MiniMax, ComfyUI e xAI supportano la modifica di immagini di riferimento. Passa un percorso immagine di riferimento o un URL:

```
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter, Google e xAI supportano fino a 5 immagini di riferimento tramite il parametro `images`. fal, MiniMax e ComfyUI ne supportano 1.

### Modelli immagine OpenRouter

La generazione di immagini OpenRouter usa la stessa `OPENROUTER_API_KEY` e passa attraverso l'API immagini delle chat completions di OpenRouter. Seleziona i modelli immagine OpenRouter con il prefisso `openrouter/`:

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

OpenClaw inoltra a OpenRouter `prompt`, `count`, immagini di riferimento e suggerimenti `aspectRatio` / `resolution` compatibili con Gemini. Le scorciatoie attuali integrate per i modelli immagine OpenRouter includono `google/gemini-3.1-flash-image-preview`, `google/gemini-3-pro-image-preview` e `openai/gpt-5.4-image-2`; usa `action: "list"` per vedere cosa espone il Plugin configurato.

### OpenAI `gpt-image-2`

La generazione di immagini OpenAI usa per impostazione predefinita `openai/gpt-image-2`. Se è configurato un
profilo OAuth `openai-codex`, OpenClaw riutilizza lo stesso profilo OAuth
usato dai modelli chat con abbonamento Codex e invia la richiesta di immagine
tramite il backend Codex Responses; non usa silenziosamente il fallback a
`OPENAI_API_KEY` per quella richiesta. Per forzare l'instradamento diretto alla OpenAI Images API,
configura esplicitamente `models.providers.openai` con una chiave API, un URL base personalizzato
o un endpoint Azure. Il modello più vecchio
`openai/gpt-image-1` può ancora essere selezionato esplicitamente, ma le nuove
richieste di generazione e modifica immagini OpenAI dovrebbero usare `gpt-image-2`.

`gpt-image-2` supporta sia la generazione text-to-image sia la
modifica di immagini di riferimento tramite lo stesso strumento `image_generate`. OpenClaw inoltra a OpenAI
`prompt`, `count`, `size`, `quality`, `outputFormat` e immagini di riferimento.
OpenAI non riceve direttamente `aspectRatio` o `resolution`; quando possibile
OpenClaw li mappa in un `size` supportato, altrimenti lo strumento li segnala come
override ignorati.

Le opzioni specifiche di OpenAI si trovano sotto l'oggetto `openai`:

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

Genera un'immagine orizzontale 4K:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```

Genera due immagini quadrate:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Two visual directions for a calm productivity app icon" size=1024x1024 count=2
```

Modifica un'immagine di riferimento locale:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Keep the subject, replace the background with a bright studio setup" image=/path/to/reference.png size=1024x1536
```

Modifica con più immagini di riferimento:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```

Per instradare la generazione di immagini OpenAI tramite un deployment Azure OpenAI invece
di `api.openai.com`, vedi [Endpoint Azure OpenAI](/it/providers/openai#azure-openai-endpoints)
nella documentazione del provider OpenAI.

La generazione di immagini MiniMax è disponibile tramite entrambi i percorsi auth MiniMax inclusi:

- `minimax/image-01` per configurazioni con chiave API
- `minimax-portal/image-01` per configurazioni OAuth

## Capacità del provider

| Capacità              | OpenAI               | Google               | fal                 | MiniMax                    | ComfyUI                            | Vydra   | xAI                  |
| --------------------- | -------------------- | -------------------- | ------------------- | -------------------------- | ---------------------------------- | ------- | -------------------- |
| Generazione           | Sì (fino a 4)        | Sì (fino a 4)        | Sì (fino a 4)       | Sì (fino a 9)              | Sì (output definiti dal workflow)  | Sì (1)  | Sì (fino a 4)        |
| Modifica/reference    | Sì (fino a 5 immagini) | Sì (fino a 5 immagini) | Sì (1 immagine)   | Sì (1 immagine, subject ref) | Sì (1 immagine, configurata nel workflow) | No      | Sì (fino a 5 immagini) |
| Controllo dimensione  | Sì (fino a 4K)       | Sì                  | Sì                  | No                         | No                                 | No      | No                   |
| Aspect ratio          | No                   | Sì                  | Sì (solo generazione) | Sì                       | No                                 | No      | Sì                  |
| Risoluzione (1K/2K/4K) | No                  | Sì                  | Sì                  | No                         | No                                 | No      | Sì (1K/2K)          |

### xAI `grok-imagine-image`

Il provider xAI incluso usa `/v1/images/generations` per richieste solo prompt
e `/v1/images/edits` quando è presente `image` o `images`.

- Modelli: `xai/grok-imagine-image`, `xai/grok-imagine-image-pro`
- Conteggio: fino a 4
- Reference: un `image` o fino a cinque `images`
- Aspect ratio: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
- Risoluzioni: `1K`, `2K`
- Output: restituiti come allegati immagine gestiti da OpenClaw

OpenClaw intenzionalmente non espone ancora `quality`, `mask`, `user` nativi di xAI, né
gli aspect ratio extra disponibili solo in modalità nativa, finché questi controlli non esistono nel contratto condiviso cross-provider di `image_generate`.

## Correlati

- [Panoramica degli strumenti](/it/tools) — tutti gli strumenti agente disponibili
- [fal](/it/providers/fal) — configurazione del provider immagini e video fal
- [ComfyUI](/it/providers/comfy) — configurazione locale del workflow ComfyUI e Comfy Cloud
- [Google (Gemini)](/it/providers/google) — configurazione del provider immagini Gemini
- [MiniMax](/it/providers/minimax) — configurazione del provider immagini MiniMax
- [OpenAI](/it/providers/openai) — configurazione del provider OpenAI Images
- [Vydra](/it/providers/vydra) — configurazione di immagini, video e voce Vydra
- [xAI](/it/providers/xai) — configurazione di immagini, video, ricerca, esecuzione di codice e TTS Grok
- [Riferimento della configurazione](/it/gateway/config-agents#agent-defaults) — configurazione `imageGenerationModel`
- [Modelli](/it/concepts/models) — configurazione dei modelli e failover
