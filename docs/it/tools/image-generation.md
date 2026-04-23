---
read_when:
    - Generazione di immagini tramite l'agente
    - Configurazione dei provider e dei modelli per la generazione di immagini
    - Comprendere i parametri dello strumento `image_generate`
summary: Genera e modifica immagini usando i provider configurati (OpenAI, Google Gemini, fal, MiniMax, ComfyUI, Vydra, xAI)
title: Generazione di immagini
x-i18n:
    generated_at: "2026-04-23T13:59:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0fbd8eda2cb0867d1426b9349f6778c231051d600ebe451534efbee0e215c871
    source_path: tools/image-generation.md
    workflow: 15
---

# Generazione di immagini

Lo strumento `image_generate` consente all'agente di creare e modificare immagini usando i provider configurati. Le immagini generate vengono consegnate automaticamente come allegati multimediali nella risposta dell'agente.

<Note>
Lo strumento compare solo quando è disponibile almeno un provider di generazione di immagini. Se non vedi `image_generate` negli strumenti del tuo agente, configura `agents.defaults.imageGenerationModel` oppure imposta una chiave API del provider.
</Note>

## Avvio rapido

1. Imposta una chiave API per almeno un provider, ad esempio `OPENAI_API_KEY` o `GEMINI_API_KEY`.
2. Facoltativamente, imposta il modello preferito:

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

3. Chiedi all'agente: _"Genera un'immagine di una mascotte aragosta amichevole."_

L'agente chiama automaticamente `image_generate`. Non è necessario alcun elenco di autorizzazione degli strumenti: è abilitato per impostazione predefinita quando è disponibile un provider.

## Provider supportati

| Provider | Modello predefinito              | Supporto modifica                   | Chiave API                                             |
| -------- | -------------------------------- | ----------------------------------- | ------------------------------------------------------ |
| OpenAI   | `gpt-image-2`                    | Sì (fino a 5 immagini)              | `OPENAI_API_KEY`                                       |
| Google   | `gemini-3.1-flash-image-preview` | Sì                                  | `GEMINI_API_KEY` o `GOOGLE_API_KEY`                    |
| fal      | `fal-ai/flux/dev`                | Sì                                  | `FAL_KEY`                                              |
| MiniMax  | `image-01`                       | Sì (riferimento del soggetto)       | `MINIMAX_API_KEY` o OAuth MiniMax (`minimax-portal`)   |
| ComfyUI  | `workflow`                       | Sì (1 immagine, configurata tramite workflow) | `COMFY_API_KEY` o `COMFY_CLOUD_API_KEY` per il cloud |
| Vydra    | `grok-imagine`                   | No                                  | `VYDRA_API_KEY`                                        |
| xAI      | `grok-imagine-image`             | Sì (fino a 5 immagini)              | `XAI_API_KEY`                                          |

Usa `action: "list"` per ispezionare i provider e i modelli disponibili in fase di esecuzione:

```
/tool image_generate action=list
```

## Parametri dello strumento

| Parametro     | Tipo     | Descrizione                                                                          |
| ------------- | -------- | ------------------------------------------------------------------------------------ |
| `prompt`      | string   | Prompt per la generazione di immagini (obbligatorio per `action: "generate"`)       |
| `action`      | string   | `"generate"` (predefinito) oppure `"list"` per ispezionare i provider               |
| `model`       | string   | Override provider/modello, ad esempio `openai/gpt-image-2`                           |
| `image`       | string   | Percorso o URL di una singola immagine di riferimento per la modalità modifica       |
| `images`      | string[] | Più immagini di riferimento per la modalità modifica (fino a 5)                      |
| `size`        | string   | Suggerimento dimensione: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160` |
| `aspectRatio` | string   | Rapporto d'aspetto: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` |
| `resolution`  | string   | Suggerimento risoluzione: `1K`, `2K` o `4K`                                          |
| `count`       | number   | Numero di immagini da generare (1–4)                                                 |
| `filename`    | string   | Suggerimento per il nome del file di output                                          |

Non tutti i provider supportano tutti i parametri. Quando un provider di fallback supporta un'opzione di geometria vicina invece di quella richiesta esatta, OpenClaw la rimappa alla dimensione, al rapporto d'aspetto o alla risoluzione supportati più vicini prima dell'invio. Gli override realmente non supportati vengono comunque riportati nel risultato dello strumento.

I risultati dello strumento riportano le impostazioni applicate. Quando OpenClaw rimappa la geometria durante il fallback del provider, i valori restituiti `size`, `aspectRatio` e `resolution` riflettono ciò che è stato effettivamente inviato, e `details.normalization` acquisisce la traduzione da richiesto ad applicato.

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

Quando genera un'immagine, OpenClaw prova i provider in questo ordine:

1. Il parametro **`model`** della chiamata dello strumento (se l'agente ne specifica uno)
2. **`imageGenerationModel.primary`** dalla configurazione
3. **`imageGenerationModel.fallbacks`** in ordine
4. **Rilevamento automatico** — usa solo i provider predefiniti supportati dall'autenticazione:
   - prima il provider predefinito corrente
   - poi i restanti provider di generazione di immagini registrati in ordine di provider-id

Se un provider fallisce, ad esempio per errore di autenticazione o rate limit, il candidato successivo viene provato automaticamente. Se falliscono tutti, l'errore include i dettagli di ogni tentativo.

Note:

- Il rilevamento automatico è consapevole dell'autenticazione. Un provider predefinito entra nell'elenco dei candidati solo quando OpenClaw può effettivamente autenticare quel provider.
- Il rilevamento automatico è abilitato per impostazione predefinita. Imposta `agents.defaults.mediaGenerationAutoProviderFallback: false` se vuoi che la generazione di immagini usi solo le voci esplicite `model`, `primary` e `fallbacks`.
- Usa `action: "list"` per ispezionare i provider attualmente registrati, i loro modelli predefiniti e i suggerimenti delle variabili d'ambiente per l'autenticazione.

### Modifica delle immagini

OpenAI, Google, fal, MiniMax, ComfyUI e xAI supportano la modifica di immagini di riferimento. Passa un percorso o URL di immagine di riferimento:

```
"Genera una versione ad acquerello di questa foto" + image: "/path/to/photo.jpg"
```

OpenAI, Google e xAI supportano fino a 5 immagini di riferimento tramite il parametro `images`. fal, MiniMax e ComfyUI ne supportano 1.

### OpenAI `gpt-image-2`

La generazione di immagini OpenAI usa per impostazione predefinita `openai/gpt-image-2`. Il vecchio
modello `openai/gpt-image-1` può ancora essere selezionato esplicitamente, ma le nuove richieste OpenAI
di generazione e modifica di immagini dovrebbero usare `gpt-image-2`.

`gpt-image-2` supporta sia la generazione text-to-image sia la
modifica di immagini di riferimento tramite lo stesso strumento `image_generate`. OpenClaw inoltra `prompt`,
`count`, `size` e le immagini di riferimento a OpenAI. OpenAI non riceve
direttamente `aspectRatio` o `resolution`; quando possibile OpenClaw li mappa a una
`size` supportata, altrimenti lo strumento li riporta come override ignorati.

Genera un'immagine orizzontale 4K:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Un poster editoriale pulito per la generazione di immagini di OpenClaw" size=3840x2160 count=1
```

Genera due immagini quadrate:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Due direzioni visive per l'icona di un'app di produttività calma" size=1024x1024 count=2
```

Modifica un'immagine di riferimento locale:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Mantieni il soggetto, sostituisci lo sfondo con un set da studio luminoso" image=/path/to/reference.png size=1024x1536
```

Modifica con più riferimenti:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combina l'identità del personaggio della prima immagine con la tavolozza colori della seconda" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```

Per instradare la generazione di immagini OpenAI tramite una distribuzione Azure OpenAI
invece di `api.openai.com`, vedi [Endpoint Azure OpenAI](/it/providers/openai#azure-openai-endpoints)
nella documentazione del provider OpenAI.

La generazione di immagini MiniMax è disponibile tramite entrambi i percorsi di autenticazione MiniMax inclusi:

- `minimax/image-01` per configurazioni con chiave API
- `minimax-portal/image-01` per configurazioni OAuth

## Capacità dei provider

| Capacità              | OpenAI               | Google               | fal                 | MiniMax                    | ComfyUI                            | Vydra   | xAI                  |
| --------------------- | -------------------- | -------------------- | ------------------- | -------------------------- | ---------------------------------- | ------- | -------------------- |
| Generazione           | Sì (fino a 4)        | Sì (fino a 4)        | Sì (fino a 4)       | Sì (fino a 9)              | Sì (output definiti dal workflow)  | Sì (1)  | Sì (fino a 4)        |
| Modifica/riferimento  | Sì (fino a 5 immagini) | Sì (fino a 5 immagini) | Sì (1 immagine)   | Sì (1 immagine, riferimento del soggetto) | Sì (1 immagine, configurata tramite workflow) | No      | Sì (fino a 5 immagini) |
| Controllo dimensione  | Sì (fino a 4K)       | Sì                   | Sì                  | No                         | No                                 | No      | No                   |
| Rapporto d'aspetto    | No                   | Sì                   | Sì (solo generazione) | Sì                       | No                                 | No      | Sì                   |
| Risoluzione (1K/2K/4K) | No                  | Sì                   | Sì                  | No                         | No                                 | No      | Sì (1K/2K)           |

### xAI `grok-imagine-image`

Il provider xAI incluso usa `/v1/images/generations` per richieste solo prompt
e `/v1/images/edits` quando è presente `image` o `images`.

- Modelli: `xai/grok-imagine-image`, `xai/grok-imagine-image-pro`
- Quantità: fino a 4
- Riferimenti: un `image` oppure fino a cinque `images`
- Rapporti d'aspetto: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
- Risoluzioni: `1K`, `2K`
- Output: restituiti come allegati immagine gestiti da OpenClaw

OpenClaw intenzionalmente non espone `quality`, `mask`, `user` nativi di xAI o
rapporti d'aspetto aggiuntivi disponibili solo nativamente finché tali controlli non esistono nel
contratto condiviso cross-provider `image_generate`.

## Correlati

- [Panoramica degli strumenti](/it/tools) — tutti gli strumenti disponibili dell'agente
- [fal](/it/providers/fal) — configurazione del provider fal per immagini e video
- [ComfyUI](/it/providers/comfy) — configurazione del workflow locale ComfyUI e Comfy Cloud
- [Google (Gemini)](/it/providers/google) — configurazione del provider immagini Gemini
- [MiniMax](/it/providers/minimax) — configurazione del provider immagini MiniMax
- [OpenAI](/it/providers/openai) — configurazione del provider OpenAI Images
- [Vydra](/it/providers/vydra) — configurazione Vydra per immagini, video e voce
- [xAI](/it/providers/xai) — configurazione Grok per immagini, video, ricerca, esecuzione di codice e TTS
- [Riferimento della configurazione](/it/gateway/configuration-reference#agent-defaults) — configurazione `imageGenerationModel`
- [Modelli](/it/concepts/models) — configurazione dei modelli e failover
