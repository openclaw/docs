---
read_when:
    - Generazione o modifica di immagini tramite l'agente
    - Configurazione dei provider e dei modelli per la generazione di immagini
    - Comprendere i parametri dello strumento image_generate
sidebarTitle: Image generation
summary: Genera e modifica immagini tramite image_generate su OpenAI, Google, fal, MiniMax, ComfyUI, DeepInfra, OpenRouter, LiteLLM, xAI, Vydra
title: Generazione di immagini
x-i18n:
    generated_at: "2026-04-30T09:16:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2237ad82279d8daf28d70a550727a5900d7a820a0c9ba09de8b7bae5b6575401
    source_path: tools/image-generation.md
    workflow: 16
---

Lo strumento `image_generate` consente all'agente di creare e modificare immagini usando i provider configurati. Le immagini generate vengono consegnate automaticamente come allegati multimediali nella risposta dell'agente.

<Note>
Lo strumento compare solo quando è disponibile almeno un provider di generazione immagini. Se non vedi `image_generate` negli strumenti del tuo agente, configura `agents.defaults.imageGenerationModel`, imposta una chiave API del provider oppure accedi con OpenAI Codex OAuth.
</Note>

## Avvio rapido

<Steps>
  <Step title="Configura l'autenticazione">
    Imposta una chiave API per almeno un provider (ad esempio `OPENAI_API_KEY`, `GEMINI_API_KEY`, `OPENROUTER_API_KEY`) oppure accedi con OpenAI Codex OAuth.
  </Step>
  <Step title="Scegli un modello predefinito (facoltativo)">
    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "openai/gpt-image-2",
            timeoutMs: 180_000,
          },
        },
      },
    }
    ```

    Codex OAuth usa lo stesso riferimento di modello `openai/gpt-image-2`. Quando è configurato un profilo OAuth `openai-codex`, OpenClaw instrada le richieste di immagini tramite quel profilo OAuth invece di provare prima `OPENAI_API_KEY`. La configurazione esplicita di `models.providers.openai` (chiave API, URL di base personalizzato/Azure) riattiva il percorso diretto dell'API OpenAI Images.

  </Step>
  <Step title="Chiedi all'agente">
    _"Genera un'immagine di una mascotte robot amichevole."_

    L'agente chiama automaticamente `image_generate`. Non è necessario consentire esplicitamente lo strumento: è abilitato per impostazione predefinita quando è disponibile un provider.

  </Step>
</Steps>

<Warning>
Per endpoint LAN compatibili con OpenAI come LocalAI, mantieni il valore personalizzato di `models.providers.openai.baseUrl` e abilitalo esplicitamente con `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`. Gli endpoint immagini privati e interni restano bloccati per impostazione predefinita.
</Warning>

## Percorsi comuni

| Obiettivo                                            | Riferimento modello                                | Autenticazione                        |
| ---------------------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| Generazione immagini OpenAI con fatturazione API     | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                       |
| Generazione immagini OpenAI con autenticazione da abbonamento Codex | `openai/gpt-image-2`                               | OpenAI Codex OAuth                     |
| PNG/WebP OpenAI con sfondo trasparente               | `openai/gpt-image-1.5`                             | `OPENAI_API_KEY` o OpenAI Codex OAuth |
| Generazione immagini DeepInfra                       | `deepinfra/black-forest-labs/FLUX-1-schnell`       | `DEEPINFRA_API_KEY`                    |
| Generazione immagini OpenRouter                      | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                   |
| Generazione immagini LiteLLM                         | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                      |
| Generazione immagini Google Gemini                   | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` o `GOOGLE_API_KEY`   |

Lo stesso strumento `image_generate` gestisce la generazione da testo a immagine e la modifica con immagini di riferimento. Usa `image` per un solo riferimento o `images` per più riferimenti. I suggerimenti di output supportati dal provider, come `quality`, `outputFormat` e `background`, vengono inoltrati quando disponibili e segnalati come ignorati quando un provider non li supporta. Il supporto incluso per sfondi trasparenti è specifico di OpenAI; altri provider possono comunque preservare l'alfa PNG se il loro backend lo emette.

## Provider supportati

| Provider   | Modello predefinito                    | Supporto alla modifica              | Autenticazione                                       |
| ---------- | --------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| ComfyUI    | `workflow`                              | Sì (1 immagine, configurata dal workflow) | `COMFY_API_KEY` o `COMFY_CLOUD_API_KEY` per il cloud |
| DeepInfra  | `black-forest-labs/FLUX-1-schnell`      | Sì (1 immagine)                    | `DEEPINFRA_API_KEY`                                   |
| fal        | `fal-ai/flux/dev`                       | Sì                                 | `FAL_KEY`                                             |
| Google     | `gemini-3.1-flash-image-preview`        | Sì                                 | `GEMINI_API_KEY` o `GOOGLE_API_KEY`                  |
| LiteLLM    | `gpt-image-2`                           | Sì (fino a 5 immagini di input)    | `LITELLM_API_KEY`                                     |
| MiniMax    | `image-01`                              | Sì (riferimento al soggetto)       | `MINIMAX_API_KEY` o MiniMax OAuth (`minimax-portal`) |
| OpenAI     | `gpt-image-2`                           | Sì (fino a 4 immagini)             | `OPENAI_API_KEY` o OpenAI Codex OAuth                |
| OpenRouter | `google/gemini-3.1-flash-image-preview` | Sì (fino a 5 immagini di input)    | `OPENROUTER_API_KEY`                                  |
| Vydra      | `grok-imagine`                          | No                                 | `VYDRA_API_KEY`                                       |
| xAI        | `grok-imagine-image`                    | Sì (fino a 5 immagini)             | `XAI_API_KEY`                                         |

Usa `action: "list"` per ispezionare i provider e i modelli disponibili a runtime:

```text
/tool image_generate action=list
```

## Capacità dei provider

| Capacità              | ComfyUI            | DeepInfra | fal               | Google         | MiniMax               | OpenAI         | Vydra | xAI            |
| --------------------- | ------------------ | --------- | ----------------- | -------------- | --------------------- | -------------- | ----- | -------------- |
| Generazione (conteggio massimo) | Definita dal workflow | 4         | 4                 | 4              | 9                     | 4              | 1     | 4              |
| Modifica / riferimento | 1 immagine (workflow) | 1 immagine | 1 immagine       | Fino a 5 immagini | 1 immagine (rif. soggetto) | Fino a 5 immagini | —     | Fino a 5 immagini |
| Controllo dimensioni  | —                  | ✓         | ✓                 | ✓              | —                     | Fino a 4K      | —     | —              |
| Rapporto d'aspetto    | —                  | —         | ✓ (solo generazione) | ✓            | ✓                     | —              | —     | ✓              |
| Risoluzione (1K/2K/4K) | —                 | —         | ✓                 | ✓              | —                     | —              | —     | 1K, 2K         |

## Parametri dello strumento

<ParamField path="prompt" type="string" required>
  Prompt di generazione immagini. Obbligatorio per `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "list"' default="generate">
  Usa `"list"` per ispezionare i provider e i modelli disponibili a runtime.
</ParamField>
<ParamField path="model" type="string">
  Override provider/modello (ad es. `openai/gpt-image-2`). Usa `openai/gpt-image-1.5` per sfondi OpenAI trasparenti.
</ParamField>
<ParamField path="image" type="string">
  Percorso o URL di una singola immagine di riferimento per la modalità di modifica.
</ParamField>
<ParamField path="images" type="string[]">
  Più immagini di riferimento per la modalità di modifica (fino a 5 sui provider che le supportano).
</ParamField>
<ParamField path="size" type="string">
  Suggerimento per le dimensioni: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`.
</ParamField>
<ParamField path="aspectRatio" type="string">
  Rapporto d'aspetto: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`.
</ParamField>
<ParamField path="resolution" type='"1K" | "2K" | "4K"'>Suggerimento per la risoluzione.</ParamField>
<ParamField path="quality" type='"low" | "medium" | "high" | "auto"'>
  Suggerimento di qualità quando il provider lo supporta.
</ParamField>
<ParamField path="outputFormat" type='"png" | "jpeg" | "webp"'>
  Suggerimento per il formato di output quando il provider lo supporta.
</ParamField>
<ParamField path="background" type='"transparent" | "opaque" | "auto"'>
  Suggerimento per lo sfondo quando il provider lo supporta. Usa `transparent` con `outputFormat: "png"` o `"webp"` per provider in grado di gestire la trasparenza.
</ParamField>
<ParamField path="count" type="number">Numero di immagini da generare (1–4).</ParamField>
<ParamField path="timeoutMs" type="number">Timeout facoltativo della richiesta al provider, in millisecondi.</ParamField>
<ParamField path="filename" type="string">Suggerimento per il nome del file di output.</ParamField>
<ParamField path="openai" type="object">
  Suggerimenti solo per OpenAI: `background`, `moderation`, `outputCompression` e `user`.
</ParamField>

<Note>
Non tutti i provider supportano tutti i parametri. Quando un provider di fallback supporta un'opzione di geometria vicina invece di quella esatta richiesta, OpenClaw rimappa alla dimensione, al rapporto d'aspetto o alla risoluzione supportati più vicini prima dell'invio. I suggerimenti di output non supportati vengono eliminati per i provider che non dichiarano il supporto e segnalati nel risultato dello strumento. I risultati dello strumento riportano le impostazioni applicate; `details.normalization` registra eventuali traduzioni da richieste ad applicate.
</Note>

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

### Ordine di selezione dei provider

OpenClaw prova i provider in questo ordine:

1. **Parametro `model`** dalla chiamata allo strumento (se l'agente ne specifica uno).
2. **`imageGenerationModel.primary`** dalla configurazione.
3. **`imageGenerationModel.fallbacks`** in ordine.
4. **Rilevamento automatico**: solo impostazioni predefinite dei provider supportate da autenticazione:
   - provider predefinito corrente per primo;
   - provider di generazione immagini registrati rimanenti in ordine di ID provider.

Se un provider non riesce (errore di autenticazione, limite di frequenza, ecc.), il candidato configurato successivo viene provato automaticamente. Se tutti falliscono, l'errore include i dettagli di ogni tentativo.

<AccordionGroup>
  <Accordion title="Gli override del modello per singola chiamata sono esatti">
    Un override `model` per singola chiamata prova solo quel provider/modello e non prosegue verso il primario/fallback configurato o verso i provider rilevati automaticamente.
  </Accordion>
  <Accordion title="Il rilevamento automatico considera l'autenticazione">
    Un valore predefinito del provider entra nell'elenco dei candidati solo quando OpenClaw può effettivamente autenticare quel provider. Imposta `agents.defaults.mediaGenerationAutoProviderFallback: false` per usare solo voci esplicite `model`, `primary` e `fallbacks`.
  </Accordion>
  <Accordion title="Timeout">
    Imposta `agents.defaults.imageGenerationModel.timeoutMs` per backend immagini lenti. Un parametro dello strumento `timeoutMs` per singola chiamata sostituisce il valore predefinito configurato.
  </Accordion>
  <Accordion title="Ispezione a runtime">
    Usa `action: "list"` per ispezionare i provider attualmente registrati, i loro modelli predefiniti e i suggerimenti sulle variabili d'ambiente per l'autenticazione.
  </Accordion>
</AccordionGroup>

### Modifica delle immagini

OpenAI, OpenRouter, Google, DeepInfra, fal, MiniMax, ComfyUI e xAI supportano la modifica di immagini di riferimento. Passa un percorso o un URL di immagine di riferimento:

```text
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter, Google e xAI supportano fino a 5 immagini di riferimento tramite il parametro `images`. fal, MiniMax e ComfyUI ne supportano 1.

## Approfondimenti sui provider

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2 (e gpt-image-1.5)">
    La generazione di immagini OpenAI usa per impostazione predefinita `openai/gpt-image-2`. Se è configurato un profilo OAuth
    `openai-codex`, OpenClaw riutilizza lo stesso profilo OAuth usato dai modelli di chat in abbonamento Codex e invia la richiesta di immagine tramite il backend Codex Responses. Gli URL di base Codex legacy come `https://chatgpt.com/backend-api` vengono canonicalizzati in
    `https://chatgpt.com/backend-api/codex` per le richieste di immagini. OpenClaw
    **non** ricorre silenziosamente a `OPENAI_API_KEY` per quella richiesta:
    per forzare l'instradamento diretto tramite OpenAI Images API, configura
    `models.providers.openai` esplicitamente con una chiave API, un URL di base personalizzato
    o un endpoint Azure.

    I modelli `openai/gpt-image-1.5`, `openai/gpt-image-1` e
    `openai/gpt-image-1-mini` possono ancora essere selezionati esplicitamente. Usa
    `gpt-image-1.5` per output PNG/WebP con sfondo trasparente; l'API attuale
    `gpt-image-2` rifiuta `background: "transparent"`.

    `gpt-image-2` supporta sia la generazione da testo a immagine sia
    la modifica di immagini di riferimento tramite lo stesso strumento `image_generate`.
    OpenClaw inoltra `prompt`, `count`, `size`, `quality`, `outputFormat`
    e le immagini di riferimento a OpenAI. OpenAI **non** riceve
    direttamente `aspectRatio` o `resolution`; quando possibile OpenClaw mappa
    questi valori in un `size` supportato, altrimenti lo strumento li segnala come
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

    `openai.background` accetta `transparent`, `opaque` o `auto`;
    gli output trasparenti richiedono `outputFormat` `png` o `webp` e un
    modello di immagini OpenAI compatibile con la trasparenza. OpenClaw instrada le richieste predefinite
    `gpt-image-2` con sfondo trasparente verso `gpt-image-1.5`.
    `openai.outputCompression` si applica agli output JPEG/WebP.

    Il suggerimento `background` di livello superiore è neutrale rispetto al provider e attualmente mappa
    allo stesso campo di richiesta OpenAI `background` quando è selezionato il provider OpenAI.
    I provider che non dichiarano il supporto dello sfondo lo restituiscono
    in `ignoredOverrides` invece di ricevere il parametro non supportato.

    Per instradare la generazione di immagini OpenAI tramite una distribuzione Azure OpenAI
    invece di `api.openai.com`, consulta
    [Endpoint Azure OpenAI](/it/providers/openai#azure-openai-endpoints).

  </Accordion>
  <Accordion title="Modelli di immagini OpenRouter">
    La generazione di immagini OpenRouter usa la stessa `OPENROUTER_API_KEY` e
    passa tramite l'API di immagini delle completazioni chat di OpenRouter. Seleziona
    i modelli di immagini OpenRouter con il prefisso `openrouter/`:

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

    OpenClaw inoltra `prompt`, `count`, le immagini di riferimento e
    i suggerimenti `aspectRatio` / `resolution` compatibili con Gemini a OpenRouter.
    Le scorciatoie attuali dei modelli di immagini OpenRouter integrati includono
    `google/gemini-3.1-flash-image-preview`,
    `google/gemini-3-pro-image-preview` e `openai/gpt-5.4-image-2`. Usa
    `action: "list"` per vedere cosa espone il Plugin configurato.

  </Accordion>
  <Accordion title="Autenticazione doppia MiniMax">
    La generazione di immagini MiniMax è disponibile tramite entrambi i percorsi di autenticazione MiniMax
    integrati:

    - `minimax/image-01` per configurazioni con chiave API
    - `minimax-portal/image-01` per configurazioni OAuth

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    Il provider xAI integrato usa `/v1/images/generations` per richieste solo con prompt
    e `/v1/images/edits` quando è presente `image` o `images`.

    - Modelli: `xai/grok-imagine-image`, `xai/grok-imagine-image-pro`
    - Conteggio: fino a 4
    - Riferimenti: una `image` o fino a cinque `images`
    - Rapporti d'aspetto: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Risoluzioni: `1K`, `2K`
    - Output: restituiti come allegati immagine gestiti da OpenClaw

    OpenClaw non espone intenzionalmente `quality`, `mask`, `user` nativi di xAI
    né altri rapporti d'aspetto solo nativi finché questi controlli non esistono
    nel contratto `image_generate` condiviso tra provider.

  </Accordion>
</AccordionGroup>

## Esempi

<Tabs>
  <Tab title="Genera (paesaggio 4K)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```
  </Tab>
  <Tab title="Genera (PNG trasparente)">
```text
/tool image_generate action=generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

CLI equivalente:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

  </Tab>
  <Tab title="Genera (due quadrati)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Two visual directions for a calm productivity app icon" size=1024x1024 count=2
```
  </Tab>
  <Tab title="Modifica (un riferimento)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Keep the subject, replace the background with a bright studio setup" image=/path/to/reference.png size=1024x1536
```
  </Tab>
  <Tab title="Modifica (più riferimenti)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```
  </Tab>
</Tabs>

Gli stessi flag `--output-format` e `--background` sono disponibili su
`openclaw infer image edit`; `--openai-background` rimane un alias
specifico di OpenAI. I provider integrati diversi da OpenAI non dichiarano
oggi un controllo esplicito dello sfondo, quindi `background: "transparent"` viene segnalato
come ignorato per loro.

## Correlati

- [Panoramica degli strumenti](/it/tools) — tutti gli strumenti disponibili per gli agenti
- [ComfyUI](/it/providers/comfy) — configurazione dei workflow ComfyUI locale e Comfy Cloud
- [fal](/it/providers/fal) — configurazione del provider fal per immagini e video
- [Google (Gemini)](/it/providers/google) — configurazione del provider di immagini Gemini
- [MiniMax](/it/providers/minimax) — configurazione del provider di immagini MiniMax
- [OpenAI](/it/providers/openai) — configurazione del provider OpenAI Images
- [Vydra](/it/providers/vydra) — configurazione di immagini, video e parlato Vydra
- [xAI](/it/providers/xai) — configurazione di immagini Grok, video, ricerca, esecuzione di codice e TTS
- [Riferimento di configurazione](/it/gateway/config-agents#agent-defaults) — configurazione `imageGenerationModel`
- [Modelli](/it/concepts/models) — configurazione dei modelli e failover
