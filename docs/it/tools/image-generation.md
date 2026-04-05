---
read_when:
    - Generazione di immagini tramite l'agente
    - Configurazione di provider e modelli per la generazione di immagini
    - Comprensione dei parametri dello strumento `image_generate`
summary: Genera e modifica immagini usando i provider configurati (OpenAI, Google Gemini, fal, MiniMax)
title: Generazione di immagini
x-i18n:
    generated_at: "2026-04-05T14:06:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: d38a8a583997ceff6523ce4f51808c97a2b59fe4e5a34cf79cdcb70d7e83aec2
    source_path: tools/image-generation.md
    workflow: 15
---

# Generazione di immagini

Lo strumento `image_generate` consente all'agente di creare e modificare immagini usando i provider configurati. Le immagini generate vengono recapitate automaticamente come allegati multimediali nella risposta dell'agente.

<Note>
Lo strumento appare solo quando è disponibile almeno un provider per la generazione di immagini. Se non vedi `image_generate` tra gli strumenti del tuo agente, configura `agents.defaults.imageGenerationModel` oppure imposta una chiave API del provider.
</Note>

## Avvio rapido

1. Imposta una chiave API per almeno un provider (per esempio `OPENAI_API_KEY` o `GEMINI_API_KEY`).
2. Facoltativamente imposta il modello preferito:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: "openai/gpt-image-1",
    },
  },
}
```

3. Chiedi all'agente: _"Genera un'immagine di una mascotte aragosta amichevole."_

L'agente chiama automaticamente `image_generate`. Nessuna allow-listing dello strumento necessaria: è abilitato per impostazione predefinita quando è disponibile un provider.

## Provider supportati

| Provider | Modello predefinito              | Supporto modifica      | Chiave API                                             |
| -------- | -------------------------------- | ---------------------- | ------------------------------------------------------ |
| OpenAI   | `gpt-image-1`                    | Sì (fino a 5 immagini) | `OPENAI_API_KEY`                                       |
| Google   | `gemini-3.1-flash-image-preview` | Sì                     | `GEMINI_API_KEY` o `GOOGLE_API_KEY`                    |
| fal      | `fal-ai/flux/dev`                | Sì                     | `FAL_KEY`                                              |
| MiniMax  | `image-01`                       | Sì (riferimento soggetto) | `MINIMAX_API_KEY` o OAuth MiniMax (`minimax-portal`) |

Usa `action: "list"` per ispezionare provider e modelli disponibili a runtime:

```
/tool image_generate action=list
```

## Parametri dello strumento

| Parametro     | Tipo     | Descrizione                                                                          |
| ------------- | -------- | ------------------------------------------------------------------------------------ |
| `prompt`      | string   | Prompt per la generazione dell'immagine (obbligatorio per `action: "generate"`)     |
| `action`      | string   | `"generate"` (predefinito) oppure `"list"` per ispezionare i provider               |
| `model`       | string   | Override provider/modello, per esempio `openai/gpt-image-1`                          |
| `image`       | string   | Singolo percorso immagine di riferimento o URL per la modalità modifica              |
| `images`      | string[] | Più immagini di riferimento per la modalità modifica (fino a 5)                      |
| `size`        | string   | Suggerimento dimensione: `1024x1024`, `1536x1024`, `1024x1536`, `1024x1792`, `1792x1024` |
| `aspectRatio` | string   | Proporzioni: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` |
| `resolution`  | string   | Suggerimento risoluzione: `1K`, `2K` o `4K`                                          |
| `count`       | number   | Numero di immagini da generare (1–4)                                                 |
| `filename`    | string   | Suggerimento per il nome file di output                                              |

Non tutti i provider supportano tutti i parametri. Lo strumento passa quelli supportati da ciascun provider e ignora gli altri.

## Configurazione

### Selezione del modello

```json5
{
  agents: {
    defaults: {
      // Forma stringa: solo modello primario
      imageGenerationModel: "google/gemini-3.1-flash-image-preview",

      // Forma oggetto: primario + fallback ordinati
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

1. **Parametro `model`** dalla chiamata dello strumento (se l'agente ne specifica uno)
2. **`imageGenerationModel.primary`** dalla configurazione
3. **`imageGenerationModel.fallbacks`** in ordine
4. **Rilevamento automatico** — usa solo i valori predefiniti dei provider supportati da auth:
   - prima il provider predefinito corrente
   - poi i restanti provider di generazione immagini registrati in ordine di ID provider

Se un provider fallisce (errore auth, limite di frequenza, ecc.), il candidato successivo viene provato automaticamente. Se tutti falliscono, l'errore include i dettagli di ciascun tentativo.

Note:

- Il rilevamento automatico è consapevole dell'auth. Un valore predefinito del provider entra nell'elenco dei candidati
  solo quando OpenClaw può effettivamente autenticare quel provider.
- Usa `action: "list"` per ispezionare i provider attualmente registrati, i loro
  modelli predefiniti e i suggerimenti sulle variabili d'ambiente di auth.

### Modifica delle immagini

OpenAI, Google, fal e MiniMax supportano la modifica di immagini di riferimento. Passa un percorso immagine di riferimento o un URL:

```
"Genera una versione ad acquerello di questa foto" + image: "/path/to/photo.jpg"
```

OpenAI e Google supportano fino a 5 immagini di riferimento tramite il parametro `images`. fal e MiniMax ne supportano 1.

La generazione di immagini MiniMax è disponibile tramite entrambi i percorsi auth MiniMax bundled:

- `minimax/image-01` per configurazioni con chiave API
- `minimax-portal/image-01` per configurazioni OAuth

## Capacità del provider

| Capacità              | OpenAI               | Google               | fal                 | MiniMax                     |
| --------------------- | -------------------- | -------------------- | ------------------- | --------------------------- |
| Generazione           | Sì (fino a 4)        | Sì (fino a 4)        | Sì (fino a 4)       | Sì (fino a 9)               |
| Modifica/riferimento  | Sì (fino a 5 immagini) | Sì (fino a 5 immagini) | Sì (1 immagine)     | Sì (1 immagine, riferimento soggetto) |
| Controllo dimensione  | Sì                   | Sì                   | Sì                  | No                          |
| Proporzioni           | No                   | Sì                   | Sì (solo generazione) | Sì                        |
| Risoluzione (1K/2K/4K) | No                  | Sì                   | Sì                  | No                          |

## Correlati

- [Panoramica degli strumenti](/tools) — tutti gli strumenti disponibili per l'agente
- [Riferimento configurazione](/it/gateway/configuration-reference#agent-defaults) — configurazione `imageGenerationModel`
- [Modelli](/it/concepts/models) — configurazione del modello e failover
