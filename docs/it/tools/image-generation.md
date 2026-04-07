---
read_when:
    - Generazione di immagini tramite l'agente
    - Configurazione dei provider e dei modelli per la generazione di immagini
    - Comprendere i parametri dello strumento `image_generate`
summary: Genera e modifica immagini usando i provider configurati (OpenAI, Google Gemini, fal, MiniMax, ComfyUI, Vydra)
title: Generazione di immagini
x-i18n:
    generated_at: "2026-04-07T08:18:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f7303c199d46e63e88f5f9567478a1025631afb03cb35f44344c12370365e57
    source_path: tools/image-generation.md
    workflow: 15
---

# Generazione di immagini

Lo strumento `image_generate` consente all'agente di creare e modificare immagini usando i provider configurati. Le immagini generate vengono recapitate automaticamente come allegati multimediali nella risposta dell'agente.

<Note>
Lo strumento appare solo quando è disponibile almeno un provider di generazione di immagini. Se non vedi `image_generate` tra gli strumenti dell'agente, configura `agents.defaults.imageGenerationModel` oppure imposta una chiave API del provider.
</Note>

## Guida rapida

1. Imposta una chiave API per almeno un provider (ad esempio `OPENAI_API_KEY` o `GEMINI_API_KEY`).
2. Facoltativamente imposta il tuo modello preferito:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-1",
      },
    },
  },
}
```

3. Chiedi all'agente: _"Genera un'immagine di una simpatica mascotte aragosta."_

L'agente chiama automaticamente `image_generate`. Non è necessario alcun allow-listing dello strumento: è abilitato per impostazione predefinita quando è disponibile un provider.

## Provider supportati

| Provider | Modello predefinito              | Supporto modifica                  | Chiave API                                             |
| -------- | -------------------------------- | ---------------------------------- | ------------------------------------------------------ |
| OpenAI   | `gpt-image-1`                    | Sì (fino a 5 immagini)             | `OPENAI_API_KEY`                                       |
| Google   | `gemini-3.1-flash-image-preview` | Sì                                 | `GEMINI_API_KEY` o `GOOGLE_API_KEY`                    |
| fal      | `fal-ai/flux/dev`                | Sì                                 | `FAL_KEY`                                              |
| MiniMax  | `image-01`                       | Sì (riferimento del soggetto)      | `MINIMAX_API_KEY` o OAuth MiniMax (`minimax-portal`)   |
| ComfyUI  | `workflow`                       | Sì (1 immagine, configurata nel workflow) | `COMFY_API_KEY` o `COMFY_CLOUD_API_KEY` per il cloud |
| Vydra    | `grok-imagine`                   | No                                 | `VYDRA_API_KEY`                                        |

Usa `action: "list"` per ispezionare i provider e i modelli disponibili a runtime:

```
/tool image_generate action=list
```

## Parametri dello strumento

| Parametro    | Tipo     | Descrizione                                                                            |
| ------------ | -------- | -------------------------------------------------------------------------------------- |
| `prompt`     | string   | Prompt per la generazione dell'immagine (obbligatorio per `action: "generate"`)        |
| `action`     | string   | `"generate"` (predefinito) oppure `"list"` per ispezionare i provider                  |
| `model`      | string   | Override provider/modello, ad esempio `openai/gpt-image-1`                             |
| `image`      | string   | Singolo percorso immagine o URL di riferimento per la modalità modifica                |
| `images`     | string[] | Più immagini di riferimento per la modalità modifica (fino a 5)                        |
| `size`       | string   | Suggerimento di dimensione: `1024x1024`, `1536x1024`, `1024x1536`, `1024x1792`, `1792x1024` |
| `aspectRatio` | string  | Rapporto d'aspetto: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` |
| `resolution` | string   | Suggerimento di risoluzione: `1K`, `2K` o `4K`                                         |
| `count`      | number   | Numero di immagini da generare (1–4)                                                   |
| `filename`   | string   | Suggerimento per il nome del file di output                                            |

Non tutti i provider supportano tutti i parametri. Quando un provider di fallback supporta un'opzione geometrica vicina invece di quella esatta richiesta, OpenClaw rimappa alla dimensione, al rapporto d'aspetto o alla risoluzione supportati più vicini prima dell'invio. Gli override realmente non supportati vengono comunque riportati nel risultato dello strumento.

I risultati dello strumento riportano le impostazioni applicate. Quando OpenClaw rimappa la geometria durante il fallback del provider, i valori restituiti `size`, `aspectRatio` e `resolution` riflettono ciò che è stato effettivamente inviato, e `details.normalization` cattura la traduzione da richiesto ad applicato.

## Configurazione

### Selezione del modello

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-1",
        fallbacks: ["google/gemini-3.1-flash-image-preview", "fal/fal-ai/flux/dev"],
      },
    },
  },
}
```

### Ordine di selezione del provider

Quando genera un'immagine, OpenClaw prova i provider in questo ordine:

1. parametro **`model`** dalla chiamata dello strumento (se l'agente ne specifica uno)
2. **`imageGenerationModel.primary`** dalla configurazione
3. **`imageGenerationModel.fallbacks`** in ordine
4. **Rilevamento automatico** — usa solo i valori predefiniti del provider supportati dall'autenticazione:
   - prima il provider predefinito corrente
   - poi i restanti provider di generazione di immagini registrati in ordine di provider-id

Se un provider fallisce (errore di autenticazione, rate limit, ecc.), il candidato successivo viene provato automaticamente. Se falliscono tutti, l'errore include i dettagli di ogni tentativo.

Note:

- Il rilevamento automatico è consapevole dell'autenticazione. Un valore predefinito del provider entra nell'elenco dei candidati solo quando OpenClaw può effettivamente autenticare quel provider.
- Il rilevamento automatico è abilitato per impostazione predefinita. Imposta
  `agents.defaults.mediaGenerationAutoProviderFallback: false` se vuoi che la
  generazione di immagini usi solo le voci esplicite `model`, `primary` e `fallbacks`.
- Usa `action: "list"` per ispezionare i provider attualmente registrati, i loro
  modelli predefiniti e i suggerimenti sulle env var di autenticazione.

### Modifica delle immagini

OpenAI, Google, fal, MiniMax e ComfyUI supportano la modifica di immagini di riferimento. Passa un percorso immagine o un URL di riferimento:

```
"Genera una versione ad acquerello di questa foto" + image: "/path/to/photo.jpg"
```

OpenAI e Google supportano fino a 5 immagini di riferimento tramite il parametro `images`. fal, MiniMax e ComfyUI ne supportano 1.

La generazione di immagini MiniMax è disponibile tramite entrambi i percorsi di autenticazione bundled di MiniMax:

- `minimax/image-01` per configurazioni con chiave API
- `minimax-portal/image-01` per configurazioni OAuth

## Capacità dei provider

| Capacità              | OpenAI               | Google               | fal                 | MiniMax                    | ComfyUI                            | Vydra   |
| --------------------- | -------------------- | -------------------- | ------------------- | -------------------------- | ---------------------------------- | ------- |
| Generazione           | Sì (fino a 4)        | Sì (fino a 4)        | Sì (fino a 4)       | Sì (fino a 9)              | Sì (output definiti dal workflow)  | Sì (1)  |
| Modifica/riferimento  | Sì (fino a 5 immagini) | Sì (fino a 5 immagini) | Sì (1 immagine)   | Sì (1 immagine, rif. soggetto) | Sì (1 immagine, configurata nel workflow) | No |
| Controllo dimensione  | Sì                   | Sì                   | Sì                  | No                         | No                                 | No      |
| Rapporto d'aspetto    | No                   | Sì                   | Sì (solo generazione) | Sì                       | No                                 | No      |
| Risoluzione (1K/2K/4K) | No                  | Sì                   | Sì                  | No                         | No                                 | No      |

## Correlati

- [Panoramica degli strumenti](/it/tools) — tutti gli strumenti disponibili dell'agente
- [fal](/it/providers/fal) — configurazione del provider immagini e video fal
- [ComfyUI](/it/providers/comfy) — configurazione dei workflow locali di ComfyUI e Comfy Cloud
- [Google (Gemini)](/it/providers/google) — configurazione del provider immagini Gemini
- [MiniMax](/it/providers/minimax) — configurazione del provider immagini MiniMax
- [OpenAI](/it/providers/openai) — configurazione del provider OpenAI Images
- [Vydra](/it/providers/vydra) — configurazione di immagini, video e speech di Vydra
- [Riferimento alla configurazione](/it/gateway/configuration-reference#agent-defaults) — configurazione `imageGenerationModel`
- [Modelli](/it/concepts/models) — configurazione dei modelli e failover
