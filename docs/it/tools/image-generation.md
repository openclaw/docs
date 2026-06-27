---
read_when:
    - Generare o modificare immagini tramite l'agente
    - Configurazione dei provider e dei modelli di generazione di immagini
    - Comprendere i parametri dello strumento image_generate
sidebarTitle: Image generation
summary: Genera e modifica immagini tramite image_generate su OpenAI, Google, fal, Microsoft Foundry, MiniMax, ComfyUI, DeepInfra, OpenRouter, LiteLLM, xAI, Vydra
title: Generazione di immagini
x-i18n:
    generated_at: "2026-06-27T18:21:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: df8187d3798925cf33ba243ee92c5c402eb4ba754b0c24521e965b60a0add947
    source_path: tools/image-generation.md
    workflow: 16
---

Lo strumento `image_generate` consente all'agente di creare e modificare immagini usando i provider
configurati. Nelle sessioni di chat, la generazione di immagini viene eseguita in modo asincrono:
OpenClaw registra un'attività in background, restituisce immediatamente l'id dell'attività e riattiva
l'agente quando il provider termina. L'agente di completamento segue la normale modalità
di risposta visibile della sessione: consegna automatica della risposta finale quando
configurata, oppure `message(action="send")` quando la sessione richiede lo strumento
di messaggio. Se la sessione richiedente è inattiva o la sua riattivazione attiva non riesce, e alcune
immagini generate mancano ancora dalla risposta di completamento, OpenClaw invia un
fallback diretto idempotente con solo le immagini mancanti.

<Note>
Lo strumento appare solo quando è disponibile almeno un provider di generazione immagini.
Se non vedi `image_generate` negli strumenti del tuo agente,
configura `agents.defaults.imageGenerationModel`, imposta una chiave API del provider
oppure accedi con OpenAI ChatGPT/Codex OAuth.
</Note>

## Avvio rapido

<Steps>
  <Step title="Configure auth">
    Imposta una chiave API per almeno un provider (per esempio `OPENAI_API_KEY`,
    `GEMINI_API_KEY`, `OPENROUTER_API_KEY`) oppure accedi con OpenAI Codex OAuth.
  </Step>
  <Step title="Pick a default model (optional)">
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

    ChatGPT/Codex OAuth usa lo stesso riferimento modello `openai/gpt-image-2`. Quando è
    configurato un profilo OAuth `openai`, OpenClaw instrada le richieste di immagini
    tramite quel profilo OAuth invece di provare prima
    `OPENAI_API_KEY`. La configurazione esplicita `models.providers.openai` (chiave API,
    URL di base custom/Azure) riattiva il percorso diretto dell'API OpenAI Images.

  </Step>
  <Step title="Ask the agent">
    _"Genera un'immagine di una simpatica mascotte robot."_

    L'agente chiama automaticamente `image_generate`. Non serve alcuna allow-list
    degli strumenti: è abilitato per impostazione predefinita quando è disponibile un provider. Lo strumento
    restituisce un id di attività in background, poi l'agente di completamento invia l'allegato
    generato tramite lo strumento `message` quando è pronto.

  </Step>
</Steps>

<Warning>
Per endpoint LAN compatibili con OpenAI come LocalAI, mantieni il
`models.providers.openai.baseUrl` personalizzato e abilitali esplicitamente con
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`. Gli endpoint di immagini privati e
interni restano bloccati per impostazione predefinita.
</Warning>

## Percorsi comuni

| Obiettivo                                            | Riferimento modello                                | Autenticazione                         |
| ---------------------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| Generazione immagini OpenAI con fatturazione API     | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                       |
| Generazione immagini OpenAI con autenticazione da abbonamento Codex | `openai/gpt-image-2`                               | OpenAI ChatGPT/Codex OAuth             |
| PNG/WebP OpenAI con sfondo trasparente               | `openai/gpt-image-1.5`                             | `OPENAI_API_KEY` o OpenAI Codex OAuth  |
| Generazione immagini DeepInfra                       | `deepinfra/black-forest-labs/FLUX-1-schnell`       | `DEEPINFRA_API_KEY`                    |
| Generazione fal Krea 2 espressiva/guidata dallo stile | `fal/krea/v2/medium/text-to-image`                 | `FAL_KEY`                              |
| Generazione immagini OpenRouter                      | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                   |
| Generazione immagini LiteLLM                         | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                      |
| Generazione immagini Microsoft Foundry MAI           | `microsoft-foundry/<deployment-name>`              | `AZURE_OPENAI_API_KEY` o Entra ID      |
| Generazione immagini Google Gemini                   | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` o `GOOGLE_API_KEY`    |

Lo stesso strumento `image_generate` gestisce la conversione testo-immagine e la modifica
di immagini di riferimento. Usa `image` per un solo riferimento o `images` per più riferimenti.
Per i modelli Krea 2 su fal, quei riferimenti vengono inviati come riferimenti di stile
invece che come input di modifica.
I suggerimenti di output supportati dal provider come `quality`, `outputFormat` e
`background` vengono inoltrati quando disponibili e indicati come ignorati quando un
provider non li supporta. Il supporto integrato per lo sfondo trasparente è
specifico di OpenAI; altri provider possono comunque preservare l'alpha PNG se il loro
backend lo emette.

## Provider supportati

| Provider          | Modello predefinito                      | Supporto alla modifica             | Autenticazione                                       |
| ----------------- | --------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| ComfyUI           | `workflow`                              | Sì (1 immagine, configurata dal flusso di lavoro) | `COMFY_API_KEY` o `COMFY_CLOUD_API_KEY` per il cloud |
| DeepInfra         | `black-forest-labs/FLUX-1-schnell`      | Sì (1 immagine)                    | `DEEPINFRA_API_KEY`                                   |
| fal               | `fal-ai/flux/dev`                       | Sì (limiti specifici del modello)  | `FAL_KEY`                                             |
| Google            | `gemini-3.1-flash-image-preview`        | Sì                                 | `GEMINI_API_KEY` o `GOOGLE_API_KEY`                  |
| LiteLLM           | `gpt-image-2`                           | Sì (fino a 5 immagini di input)    | `LITELLM_API_KEY`                                     |
| Microsoft Foundry | `<deployment-name>`                     | Sì (solo modelli MAI-Image-2.5)    | `AZURE_OPENAI_API_KEY` o Entra ID (`az login`)       |
| MiniMax           | `image-01`                              | Sì (riferimento soggetto)          | `MINIMAX_API_KEY` o MiniMax OAuth (`minimax-portal`) |
| OpenAI            | `gpt-image-2`                           | Sì (fino a 4 immagini)             | `OPENAI_API_KEY` o OpenAI ChatGPT/Codex OAuth        |
| OpenRouter        | `google/gemini-3.1-flash-image-preview` | Sì (fino a 5 immagini di input)    | `OPENROUTER_API_KEY`                                  |
| Vydra             | `grok-imagine`                          | No                                 | `VYDRA_API_KEY`                                       |
| xAI               | `grok-imagine-image`                    | Sì (fino a 5 immagini)             | `XAI_API_KEY`                                         |

Usa `action: "list"` per ispezionare provider e modelli disponibili in fase di esecuzione:

```text
/tool image_generate action=list
```

Usa `action: "status"` per ispezionare l'attività di generazione immagini attiva per la
sessione corrente:

```text
/tool image_generate action=status
```

## Capacità dei provider

| Capacità              | ComfyUI            | DeepInfra | fal                                            | Google         | Microsoft Foundry | MiniMax               | OpenAI         | Vydra | xAI            |
| --------------------- | ------------------ | --------- | ---------------------------------------------- | -------------- | ----------------- | --------------------- | -------------- | ----- | -------------- |
| Generazione (conteggio massimo) | Definita dal flusso di lavoro | 4         | 4                                              | 4              | 1                 | 9                     | 4              | 1     | 4              |
| Modifica / riferimento | 1 immagine (flusso di lavoro) | 1 immagine | Flux: 1; GPT: 10; riferimenti di stile Krea: 10; NB2: 14 | Fino a 5 immagini | 1 immagine | 1 immagine (riferimento soggetto) | Fino a 5 immagini | -     | Fino a 5 immagini |
| Controllo dimensioni  | -                  | ✓         | ✓                                              | ✓              | ✓                 | -                     | Fino a 4K      | -     | -              |
| Rapporto d'aspetto    | -                  | -         | ✓                                              | ✓              | -                 | ✓                     | -              | -     | ✓              |
| Risoluzione (1K/2K/4K) | -                 | -         | ✓                                              | ✓              | -                 | -                     | -              | -     | 1K, 2K         |

## Parametri dello strumento

<ParamField path="prompt" type="string" required>
  Prompt di generazione immagini. Richiesto per `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  Usa `"status"` per ispezionare l'attività della sessione attiva oppure `"list"` per ispezionare
  provider e modelli disponibili in fase di esecuzione.
</ParamField>
<ParamField path="model" type="string">
  Override provider/modello (per es. `openai/gpt-image-2`). Usa
  `openai/gpt-image-1.5` per sfondi OpenAI trasparenti.
</ParamField>
<ParamField path="image" type="string">
  Percorso o URL di una singola immagine di riferimento per la modalità di modifica.
</ParamField>
<ParamField path="images" type="string[]">
  Più immagini di riferimento per la modalità di modifica o modelli con riferimenti di stile (fino a 10
  tramite lo strumento condiviso; i limiti specifici del provider si applicano comunque).
</ParamField>
<ParamField path="size" type="string">
  Suggerimento dimensione: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`.
</ParamField>
<ParamField path="aspectRatio" type="string">
  Rapporto d'aspetto: `1:1`, `2:3`, `3:2`, `2.35:1`, `3:4`, `4:3`, `4:5`,
  `5:4`, `9:16`, `16:9`, `21:9`, `4:1`, `1:4`, `8:1`, `1:8`. I provider
  validano il sottoinsieme specifico del loro modello.
</ParamField>
<ParamField path="resolution" type='"1K" | "2K" | "4K"'>Suggerimento risoluzione.</ParamField>
<ParamField path="quality" type='"low" | "medium" | "high" | "auto"'>
  Suggerimento qualità quando il provider lo supporta.
</ParamField>
<ParamField path="outputFormat" type='"png" | "jpeg" | "webp"'>
  Suggerimento formato di output quando il provider lo supporta.
</ParamField>
<ParamField path="background" type='"transparent" | "opaque" | "auto"'>
  Suggerimento sfondo quando il provider lo supporta. Usa `transparent` con
  `outputFormat: "png"` o `"webp"` per provider capaci di trasparenza.
</ParamField>
<ParamField path="count" type="number">Numero di immagini da generare (1-4).</ParamField>
<ParamField path="timeoutMs" type="number">
  Timeout opzionale della richiesta al provider in millisecondi. Quando Codex chiama
  `image_generate` tramite strumenti dinamici, questo valore per chiamata sovrascrive comunque
  il valore predefinito configurato ed è limitato a 600000 ms.
</ParamField>
<ParamField path="filename" type="string">Suggerimento nome file di output.</ParamField>
<ParamField path="openai" type="object">
  Suggerimenti solo OpenAI: `background`, `moderation`, `outputCompression` e `user`.
</ParamField>
<ParamField path="fal.creativity" type='"raw" | "low" | "medium" | "high"'>
  Controllo creatività fal Krea 2. Il valore predefinito è `medium`.
</ParamField>

<Note>
Non tutti i provider supportano tutti i parametri. Quando un provider di fallback supporta una
opzione geometrica vicina invece di quella esatta richiesta, OpenClaw la rimappa
alla dimensione, al rapporto d'aspetto o alla risoluzione supportati più vicini prima dell'invio.
I suggerimenti di output non supportati vengono scartati per i provider che non dichiarano
supporto e riportati nel risultato dello strumento. I risultati dello strumento riportano le impostazioni
applicate; `details.normalization` registra ogni traduzione da richiesto ad applicato.
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

1. **Parametro `model`** dalla chiamata dello strumento (se l'agente ne specifica uno).
2. **`imageGenerationModel.primary`** dalla configurazione.
3. **`imageGenerationModel.fallbacks`** in ordine.
4. **Rilevamento automatico** - solo predefiniti dei provider basati su autenticazione:
   - prima il provider predefinito corrente;
   - poi gli altri provider di generazione immagini registrati, in ordine di ID provider.

Se un provider non riesce (errore di autenticazione, limite di frequenza, ecc.), viene provato automaticamente il candidato configurato successivo. Se tutti falliscono, l'errore include i dettagli di ogni tentativo.

<AccordionGroup>
  <Accordion title="Gli override del modello per chiamata sono esatti">
    Un override `model` per chiamata prova solo quel provider/modello e non
    continua con il provider primario/fallback configurato o con i provider rilevati automaticamente.
  </Accordion>
  <Accordion title="Il rilevamento automatico è consapevole dell'autenticazione">
    Un predefinito del provider entra nell'elenco dei candidati solo quando OpenClaw può
    autenticare effettivamente quel provider. Imposta
    `agents.defaults.mediaGenerationAutoProviderFallback: false` per usare solo
    voci esplicite `model`, `primary` e `fallbacks`.
  </Accordion>
  <Accordion title="Timeout">
    Imposta `agents.defaults.imageGenerationModel.timeoutMs` per backend di immagini
    lenti. Un parametro dello strumento `timeoutMs` per chiamata sovrascrive il valore
    predefinito configurato, e i valori predefiniti configurati sovrascrivono i valori
    predefiniti del provider definiti dal plugin. I provider di immagini ospitati da Google
    e OpenRouter usano valori predefiniti di 180 secondi; la generazione immagini di
    Microsoft Foundry MAI, xAI e Azure OpenAI usa 600 secondi. Le chiamate dynamic-tool
    di Codex usano un valore predefinito del bridge `image_generate` di 120 secondi
    e rispettano lo stesso budget di timeout quando configurato, entro il limite massimo
    del bridge dynamic-tool di OpenClaw di 600000 ms.
  </Accordion>
  <Accordion title="Ispezione a runtime">
    Usa `action: "list"` per ispezionare i provider attualmente registrati,
    i loro modelli predefiniti e i suggerimenti sulle variabili d'ambiente per l'autenticazione.
  </Accordion>
</AccordionGroup>

### Modifica delle immagini

OpenAI, OpenRouter, Google, DeepInfra, fal, Microsoft Foundry, MiniMax,
ComfyUI e xAI supportano la modifica delle immagini di riferimento. I modelli Krea 2 su fal usano gli
stessi campi `image` / `images` come riferimenti di stile invece che come input di modifica. Passa
un percorso o URL di immagine di riferimento:

```text
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter, Google e xAI supportano fino a 5 immagini di riferimento tramite il
parametro `images`. fal supporta 1 immagine di riferimento per Flux image-to-image, fino
a 10 per le modifiche GPT Image 2, fino a 10 riferimenti di stile per Krea 2 e fino a
14 per le modifiche Nano Banana 2. Microsoft Foundry, MiniMax e ComfyUI ne supportano 1.

## Approfondimenti sui provider

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2 (e gpt-image-1.5)">
    La generazione immagini di OpenAI usa come predefinito `openai/gpt-image-2`. Se è
    configurato un profilo OAuth `openai`, OpenClaw riusa lo stesso
    profilo OAuth usato dai modelli di chat in abbonamento di Codex e invia la
    richiesta immagine tramite il backend Codex Responses. Gli URL di base legacy di Codex
    come `https://chatgpt.com/backend-api` vengono canonicalizzati in
    `https://chatgpt.com/backend-api/codex` per le richieste immagine. OpenClaw
    **non** ripiega silenziosamente su `OPENAI_API_KEY` per quella richiesta:
    per forzare l'instradamento diretto verso OpenAI Images API, configura
    `models.providers.openai` esplicitamente con una chiave API, un URL di base personalizzato
    o un endpoint Azure.

    I modelli `openai/gpt-image-1.5`, `openai/gpt-image-1` e
    `openai/gpt-image-1-mini` possono ancora essere selezionati esplicitamente. Usa
    `gpt-image-1.5` per output PNG/WebP con sfondo trasparente; l'attuale
    API `gpt-image-2` rifiuta `background: "transparent"`.

    `gpt-image-2` supporta sia la generazione text-to-image sia la
    modifica con immagini di riferimento tramite lo stesso strumento `image_generate`.
    OpenClaw inoltra `prompt`, `count`, `size`, `quality`, `outputFormat`
    e le immagini di riferimento a OpenAI. OpenAI **non** riceve
    direttamente `aspectRatio` o `resolution`; quando possibile OpenClaw mappa
    questi valori in un `size` supportato, altrimenti lo strumento li segnala come
    override ignorati.

    Le opzioni specifiche di OpenAI risiedono nell'oggetto `openai`:

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
    modello di immagini OpenAI con supporto alla trasparenza. OpenClaw indirizza le richieste
    predefinite `gpt-image-2` con sfondo trasparente a `gpt-image-1.5`.
    `openai.outputCompression` si applica agli output JPEG/WebP ed è ignorato
    per gli output PNG.

    Il suggerimento di primo livello `background` è neutrale rispetto al provider e attualmente viene mappato
    allo stesso campo di richiesta OpenAI `background` quando è selezionato il provider OpenAI.
    I provider che non dichiarano il supporto allo sfondo lo restituiscono
    in `ignoredOverrides` invece di ricevere il parametro non supportato.

    Per instradare la generazione immagini OpenAI tramite una distribuzione Azure OpenAI
    invece di `api.openai.com`, consulta
    [endpoint Azure OpenAI](/it/providers/openai#azure-openai-endpoints).

  </Accordion>
  <Accordion title="Modelli di immagini Microsoft Foundry MAI">
    La generazione immagini di Microsoft Foundry usa nomi di distribuzione immagini MAI distribuiti
    con il prefisso provider `microsoft-foundry/`. Non esiste un modello predefinito
    a livello di provider perché l'API MAI si aspetta il nome della distribuzione nel
    campo `model`:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "microsoft-foundry/<deployment-name>",
            timeoutMs: 600_000,
          },
        },
      },
    }
    ```

    Il provider usa l'API MAI di Microsoft Foundry, non l'API OpenAI Images:

    - Endpoint di generazione: `/mai/v1/images/generations`
    - Endpoint di modifica: `/mai/v1/images/edits`
    - Autenticazione: `AZURE_OPENAI_API_KEY` / chiave API del provider, o Entra ID tramite `az login`
    - Output: un'immagine PNG
    - Dimensione: predefinita `1024x1024`; larghezza e altezza devono essere ciascuna di almeno 768 px,
      e il totale dei pixel deve essere al massimo 1.048.576
    - Modifiche: una immagine di riferimento PNG o JPEG, supportata solo dalle distribuzioni
      `MAI-Image-2.5-Flash` e `MAI-Image-2.5`

    La generazione solo da prompt può usare un nome di distribuzione personalizzato con solo
    l'endpoint Foundry configurato. Le modifiche con nomi di distribuzione personalizzati richiedono
    metadati di onboarding/modello così OpenClaw può verificare che la distribuzione sia
    basata su `MAI-Image-2.5-Flash` o `MAI-Image-2.5`.

    I modelli di immagini MAI correnti sono `MAI-Image-2.5-Flash`, `MAI-Image-2.5`,
    `MAI-Image-2e` e `MAI-Image-2`. Consulta
    [Plugin Microsoft Foundry](/it/plugins/reference/microsoft-foundry) per la configurazione
    e il comportamento dei modelli di chat.

  </Accordion>
  <Accordion title="Modelli di immagini OpenRouter">
    La generazione immagini di OpenRouter usa la stessa `OPENROUTER_API_KEY` e
    viene instradata tramite l'API di immagini per chat completions di OpenRouter. Seleziona
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

    OpenClaw inoltra `prompt`, `count`, immagini di riferimento e
    suggerimenti `aspectRatio` / `resolution` compatibili con Gemini a OpenRouter.
    Le scorciatoie integrate correnti per i modelli di immagini OpenRouter includono
    `google/gemini-3.1-flash-image-preview`,
    `google/gemini-3-pro-image-preview` e `openai/gpt-5.4-image-2`. Usa
    `action: "list"` per vedere cosa espone il plugin configurato.

  </Accordion>
  <Accordion title="fal Krea 2">
    I modelli Krea 2 su fal usano lo schema Krea nativo di fal invece dello schema generico
    `image_size` usato da Flux. OpenClaw invia:

    - `aspect_ratio` per i suggerimenti sul rapporto d'aspetto
    - `creativity`, con valore predefinito `medium`
    - `image_style_references` quando vengono forniti `image` o `images`

    Seleziona Krea 2 Medium per illustrazioni espressive più rapide e Krea 2 Large
    per aspetti fotorealistici e materici più lenti e dettagliati:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "fal/krea/v2/medium/text-to-image",
          },
        },
      },
    }
    ```

    Krea 2 attualmente restituisce un'immagine per richiesta. Preferisci `aspectRatio` per
    Krea; OpenClaw mappa `size` al rapporto d'aspetto Krea supportato più vicino e
    rifiuta `resolution` per Krea invece di scartarlo. Usa `fal.creativity`
    quando vuoi un livello di creatività Krea nativo:

    ```json
    {
      "model": "fal/krea/v2/medium/text-to-image",
      "prompt": "A cyber zine portrait with risograph texture",
      "aspectRatio": "9:16",
      "fal": {
        "creativity": "high"
      }
    }
    ```

  </Accordion>
  <Accordion title="Doppia autenticazione MiniMax">
    La generazione immagini MiniMax è disponibile tramite entrambi i percorsi di autenticazione
    MiniMax inclusi:

    - `minimax/image-01` per configurazioni con chiave API
    - `minimax-portal/image-01` per configurazioni OAuth

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    Il provider xAI incluso usa `/v1/images/generations` per richieste solo da prompt
    e `/v1/images/edits` quando è presente `image` o `images`.

    - Modelli: `xai/grok-imagine-image`, `xai/grok-imagine-image-quality`
    - Conteggio: fino a 4
    - Riferimenti: una `image` o fino a cinque `images`
    - Rapporti d'aspetto: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Risoluzioni: `1K`, `2K`
    - Output: restituiti come allegati immagine gestiti da OpenClaw

    OpenClaw non espone intenzionalmente `quality`, `mask`,
    `user` o rapporti d'aspetto aggiuntivi solo nativi di xAI finché questi controlli
    non esistono nel contratto condiviso `image_generate` tra provider.

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
  <Tab title="Genera (bassa qualità OpenAI)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Low-cost draft poster for a quiet productivity app" quality=low openai='{"moderation":"low"}'
```

CLI equivalente:

```bash
openclaw infer image generate \
  --model openai/gpt-image-2 \
  --quality low \
  --openai-moderation low \
  --prompt "Low-cost draft poster for a quiet productivity app" \
  --json
```

  </Tab>
  <Tab title="Genera (due quadrate)">
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
  <Tab title="Riferimenti di stile Krea">
```text
/tool image_generate action=generate model=fal/krea/v2/medium/text-to-image prompt="An expressive editorial portrait using this color palette and print texture" images='["/path/to/palette.png","/path/to/texture.jpg"]' aspectRatio=9:16 fal='{"creativity":"high"}'
```
  </Tab>
</Tabs>

Gli stessi flag `--output-format`, `--background`, `--quality` e
`--openai-moderation` sono disponibili in `openclaw infer image edit`;
`--openai-background` rimane un alias specifico di OpenAI. I provider inclusi
diversi da OpenAI al momento non dichiarano un controllo esplicito dello sfondo, quindi
`background: "transparent"` viene segnalato come ignorato per loro.

## Correlati

- [Panoramica degli strumenti](/it/tools) - tutti gli strumenti dell'agente disponibili
- [ComfyUI](/it/providers/comfy) - configurazione del workflow locale di ComfyUI e Comfy Cloud
- [fal](/it/providers/fal) - configurazione del provider di immagini e video fal
- [Google (Gemini)](/it/providers/google) - configurazione del provider di immagini Gemini
- [Plugin Microsoft Foundry](/it/plugins/reference/microsoft-foundry) - configurazione della chat Microsoft Foundry e delle immagini MAI
- [MiniMax](/it/providers/minimax) - configurazione del provider di immagini MiniMax
- [OpenAI](/it/providers/openai) - configurazione del provider OpenAI Images
- [Vydra](/it/providers/vydra) - configurazione di immagini, video e sintesi vocale Vydra
- [xAI](/it/providers/xai) - configurazione di immagini, video, ricerca, esecuzione di codice e TTS Grok
- [Riferimento di configurazione](/it/gateway/config-agents#agent-defaults) - configurazione di `imageGenerationModel`
- [Modelli](/it/concepts/models) - configurazione dei modelli e failover
