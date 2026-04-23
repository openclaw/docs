---
read_when:
    - Generazione di immagini tramite l’agente
    - Configurazione di provider e modelli per la generazione di immagini
    - Comprendere i parametri dello strumento `image_generate`
summary: Genera e modifica immagini usando i provider configurati (OpenAI, Google Gemini, fal, MiniMax, ComfyUI, Vydra, xAI)
title: Generazione immagini
x-i18n:
    generated_at: "2026-04-23T08:36:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 228049c74dd3437544cda6418da665aed375c0494ef36a6927d15c28d7783bbd
    source_path: tools/image-generation.md
    workflow: 15
---

# Generazione immagini

Lo strumento `image_generate` consente all’agente di creare e modificare immagini usando i provider configurati. Le immagini generate vengono consegnate automaticamente come allegati media nella risposta dell’agente.

<Note>
Lo strumento compare solo quando è disponibile almeno un provider di generazione immagini. Se non vedi `image_generate` tra gli strumenti del tuo agente, configura `agents.defaults.imageGenerationModel` oppure imposta una chiave API provider.
</Note>

## Avvio rapido

1. Imposta una chiave API per almeno un provider (ad esempio `OPENAI_API_KEY` o `GEMINI_API_KEY`).
2. Facoltativamente imposta il tuo modello preferito:

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

3. Chiedi all’agente: _"Genera un’immagine di una simpatica mascotte aragosta."_

L’agente chiama automaticamente `image_generate`. Non serve alcuna allowlist dello strumento: è abilitato per impostazione predefinita quando un provider è disponibile.

## Provider supportati

| Provider | Modello predefinito              | Supporto modifica                   | Chiave API                                             |
| -------- | -------------------------------- | ----------------------------------- | ------------------------------------------------------ |
| OpenAI   | `gpt-image-2`                    | Sì (fino a 5 immagini)              | `OPENAI_API_KEY`                                       |
| Google   | `gemini-3.1-flash-image-preview` | Sì                                  | `GEMINI_API_KEY` o `GOOGLE_API_KEY`                    |
| fal      | `fal-ai/flux/dev`                | Sì                                  | `FAL_KEY`                                              |
| MiniMax  | `image-01`                       | Sì (riferimento del soggetto)       | `MINIMAX_API_KEY` o MiniMax OAuth (`minimax-portal`)   |
| ComfyUI  | `workflow`                       | Sì (1 immagine, configurata dal workflow) | `COMFY_API_KEY` o `COMFY_CLOUD_API_KEY` per il cloud |
| Vydra    | `grok-imagine`                   | No                                  | `VYDRA_API_KEY`                                        |
| xAI      | `grok-imagine-image`             | Sì (fino a 5 immagini)              | `XAI_API_KEY`                                          |

Usa `action: "list"` per ispezionare provider e modelli disponibili a runtime:

```
/tool image_generate action=list
```

## Parametri dello strumento

| Parametro     | Tipo     | Descrizione                                                                         |
| ------------- | -------- | ----------------------------------------------------------------------------------- |
| `prompt`      | string   | Prompt per la generazione dell’immagine (obbligatorio per `action: "generate"`)    |
| `action`      | string   | `"generate"` (predefinito) oppure `"list"` per ispezionare i provider              |
| `model`       | string   | Override provider/modello, ad esempio `openai/gpt-image-2`                         |
| `image`       | string   | Singolo percorso immagine di riferimento o URL per la modalità modifica             |
| `images`      | string[] | Più immagini di riferimento per la modalità modifica (fino a 5)                    |
| `size`        | string   | Hint di dimensione: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160` |
| `aspectRatio` | string   | Rapporto d’aspetto: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` |
| `resolution`  | string   | Hint di risoluzione: `1K`, `2K` o `4K`                                              |
| `count`       | number   | Numero di immagini da generare (1–4)                                                |
| `filename`    | string   | Hint del nome file in uscita                                                        |

Non tutti i provider supportano tutti i parametri. Quando un provider di fallback supporta un’opzione geometrica vicina invece di quella richiesta esatta, OpenClaw rimappa alla dimensione, al rapporto d’aspetto o alla risoluzione supportata più vicina prima dell’invio. Gli override realmente non supportati vengono comunque segnalati nel risultato dello strumento.

I risultati dello strumento riportano le impostazioni applicate. Quando OpenClaw rimappa la geometria durante il fallback del provider, i valori restituiti `size`, `aspectRatio` e `resolution` riflettono quanto è stato effettivamente inviato, e `details.normalization` cattura la traduzione da richiesto ad applicato.

## Configurazione

### Selezione del modello

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: ["google/gemini-3.1-flash-image-preview", "fal/fal-ai/flux/dev"],
      },
    },
  },
}
```

### Ordine di selezione del provider

Quando genera un’immagine, OpenClaw prova i provider in questo ordine:

1. **Parametro `model`** dalla chiamata dello strumento (se l’agente ne specifica uno)
2. **`imageGenerationModel.primary`** dalla configurazione
3. **`imageGenerationModel.fallbacks`** in ordine
4. **Rilevamento automatico** — usa solo i valori predefiniti del provider supportati dall’autenticazione:
   - prima il provider predefinito corrente
   - poi i restanti provider di generazione immagini registrati in ordine di ID provider

Se un provider fallisce (errore di autenticazione, rate limit, ecc.), viene provato automaticamente il candidato successivo. Se falliscono tutti, l’errore include dettagli di ogni tentativo.

Note:

- Il rilevamento automatico è consapevole dell’autenticazione. Un valore predefinito del provider entra nell’elenco dei candidati solo quando OpenClaw può davvero autenticare quel provider.
- Il rilevamento automatico è abilitato per impostazione predefinita. Imposta
  `agents.defaults.mediaGenerationAutoProviderFallback: false` se vuoi che la generazione immagini usi solo le voci esplicite `model`, `primary` e `fallbacks`.
- Usa `action: "list"` per ispezionare i provider attualmente registrati, i loro
  modelli predefiniti e gli hint delle env var di autenticazione.

### Modifica delle immagini

OpenAI, Google, fal, MiniMax, ComfyUI e xAI supportano la modifica di immagini di riferimento. Passa un percorso immagine di riferimento o un URL:

```
"Genera una versione ad acquerello di questa foto" + image: "/path/to/photo.jpg"
```

OpenAI, Google e xAI supportano fino a 5 immagini di riferimento tramite il parametro `images`. fal, MiniMax e ComfyUI ne supportano 1.

### OpenAI `gpt-image-2`

La generazione immagini OpenAI usa per impostazione predefinita `openai/gpt-image-2`. Il vecchio
modello `openai/gpt-image-1` può ancora essere selezionato esplicitamente, ma le nuove richieste OpenAI
di generazione e modifica immagini dovrebbero usare `gpt-image-2`.

`gpt-image-2` supporta sia la generazione da testo a immagine sia la modifica di immagini di riferimento tramite lo stesso strumento `image_generate`. OpenClaw inoltra a OpenAI `prompt`,
`count`, `size` e immagini di riferimento. OpenAI non riceve
direttamente `aspectRatio` o `resolution`; quando possibile OpenClaw li mappa in una
`size` supportata, altrimenti lo strumento li segnala come override ignorati.

Genera un’immagine panoramica 4K:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```

Genera due immagini quadrate:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Two visual directions for a calm productivity app icon" size=1024x1024 count=2
```

Modifica un’immagine di riferimento locale:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Keep the subject, replace the background with a bright studio setup" image=/path/to/reference.png size=1024x1536
```

Modifica con più riferimenti:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```

La generazione immagini MiniMax è disponibile tramite entrambi i percorsi di autenticazione MiniMax bundled:

- `minimax/image-01` per setup con chiave API
- `minimax-portal/image-01` per setup OAuth

## Capability del provider

| Capability            | OpenAI               | Google               | fal                 | MiniMax                    | ComfyUI                            | Vydra   | xAI                  |
| --------------------- | -------------------- | -------------------- | ------------------- | -------------------------- | ---------------------------------- | ------- | -------------------- |
| Generazione           | Sì (fino a 4)        | Sì (fino a 4)        | Sì (fino a 4)       | Sì (fino a 9)              | Sì (output definiti dal workflow)  | Sì (1)  | Sì (fino a 4)        |
| Modifica/riferimento  | Sì (fino a 5 immagini) | Sì (fino a 5 immagini) | Sì (1 immagine)   | Sì (1 immagine, riferimento soggetto) | Sì (1 immagine, configurata dal workflow) | No | Sì (fino a 5 immagini) |
| Controllo dimensione  | Sì (fino a 4K)       | Sì                   | Sì                  | No                         | No                                 | No      | No                   |
| Rapporto d’aspetto    | No                   | Sì                   | Sì (solo generazione) | Sì                       | No                                 | No      | Sì                   |
| Risoluzione (1K/2K/4K) | No                  | Sì                   | Sì                  | No                         | No                                 | No      | Sì (1K/2K)           |

### xAI `grok-imagine-image`

Il provider xAI bundled usa `/v1/images/generations` per richieste solo prompt
e `/v1/images/edits` quando è presente `image` o `images`.

- Modelli: `xai/grok-imagine-image`, `xai/grok-imagine-image-pro`
- Count: fino a 4
- Riferimenti: un `image` o fino a cinque `images`
- Rapporti d’aspetto: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
- Risoluzioni: `1K`, `2K`
- Output: restituiti come allegati immagine gestiti da OpenClaw

OpenClaw intenzionalmente non espone `quality`, `mask`, `user` nativi xAI o
rapporti d’aspetto extra solo nativi finché questi controlli non esistono nel contratto condiviso
cross-provider `image_generate`.

## Correlati

- [Tools Overview](/it/tools) — tutti gli strumenti agent disponibili
- [fal](/it/providers/fal) — configurazione del provider immagini e video fal
- [ComfyUI](/it/providers/comfy) — configurazione del workflow ComfyUI locale e Comfy Cloud
- [Google (Gemini)](/it/providers/google) — configurazione del provider immagini Gemini
- [MiniMax](/it/providers/minimax) — configurazione del provider immagini MiniMax
- [OpenAI](/it/providers/openai) — configurazione del provider OpenAI Images
- [Vydra](/it/providers/vydra) — configurazione Vydra per immagini, video e speech
- [xAI](/it/providers/xai) — configurazione Grok per immagini, video, search, esecuzione di codice e TTS
- [Configuration Reference](/it/gateway/configuration-reference#agent-defaults) — configurazione `imageGenerationModel`
- [Models](/it/concepts/models) — configurazione del modello e failover
