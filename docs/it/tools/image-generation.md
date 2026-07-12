---
read_when:
    - Generazione o modifica di immagini tramite l'agente
    - Configurazione dei provider e dei modelli per la generazione di immagini
    - Comprendere i parametri dello strumento image_generate
sidebarTitle: Image generation
summary: Genera e modifica immagini tramite image_generate su OpenAI, Google, fal, Microsoft Foundry, MiniMax, ComfyUI, DeepInfra, OpenRouter, LiteLLM, xAI, Vydra
title: Generazione di immagini
x-i18n:
    generated_at: "2026-07-12T07:33:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 56d4c9efada07c64fc6aaa92510bf8cad982c098f62d7a71bfdf093cf434c4bc
    source_path: tools/image-generation.md
    workflow: 16
---

Lo strumento `image_generate` crea e modifica immagini tramite i provider configurati.
Nelle sessioni di chat viene eseguito in modo asincrono: OpenClaw registra
un'attività in background, restituisce immediatamente l'ID dell'attività e
riattiva l'agente quando il provider ha terminato. L'agente di completamento
segue la normale modalità di risposta visibile della sessione: invio automatico
della risposta finale, se configurato, oppure `message(action="send")` quando
la sessione richiede lo strumento di messaggistica. Se la sessione del
richiedente è inattiva o la sua riattivazione attiva non riesce, OpenClaw invia
direttamente un fallback idempotente con le immagini generate, affinché il
risultato non vada perso.

<Note>
Lo strumento viene visualizzato solo quando è disponibile almeno un provider
per la generazione di immagini. Se `image_generate` non compare tra gli
strumenti dell'agente, configura `agents.defaults.imageGenerationModel`,
imposta una chiave API del provider oppure accedi tramite OAuth di OpenAI
ChatGPT/Codex.
</Note>

## Avvio rapido

<Steps>
  <Step title="Configura l'autenticazione">
    Imposta una chiave API per almeno un provider (ad esempio `OPENAI_API_KEY`,
    `GEMINI_API_KEY`, `OPENROUTER_API_KEY`) oppure accedi tramite OAuth di OpenAI Codex.
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

    L'OAuth di ChatGPT/Codex utilizza lo stesso riferimento al modello
    `openai/gpt-image-2`. Quando è configurato un profilo OAuth `openai`,
    OpenClaw instrada le richieste di immagini tramite tale profilo OAuth
    anziché provare prima `OPENAI_API_KEY`. Una configurazione esplicita di
    `models.providers.openai` (chiave API, URL di base personalizzato/Azure)
    ripristina l'uso diretto dell'API OpenAI Images.

  </Step>
  <Step title="Chiedi all'agente">
    _"Genera un'immagine di una simpatica mascotte robot."_

    L'agente chiama automaticamente `image_generate`. Non è necessario
    aggiungerlo a un elenco di strumenti consentiti: è abilitato per
    impostazione predefinita quando è disponibile un provider. Lo strumento
    restituisce l'ID di un'attività in background; quando è pronta, l'agente
    di completamento invia l'immagine generata tramite lo strumento `message`.

  </Step>
</Steps>

<Warning>
Per gli endpoint LAN compatibili con OpenAI, come LocalAI, mantieni il valore
personalizzato di `models.providers.openai.baseUrl` e abilita esplicitamente
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`. Gli endpoint di
immagini privati e interni rimangono bloccati per impostazione predefinita.
</Warning>

## Percorsi comuni

| Obiettivo                                             | Riferimento al modello                              | Autenticazione                         |
| ----------------------------------------------------- | --------------------------------------------------- | -------------------------------------- |
| Generazione di immagini OpenAI con fatturazione API   | `openai/gpt-image-2`                                | `OPENAI_API_KEY`                       |
| Generazione di immagini OpenAI con autenticazione tramite abbonamento Codex | `openai/gpt-image-2`                 | OAuth di OpenAI ChatGPT/Codex          |
| PNG/WebP OpenAI con sfondo trasparente                | `openai/gpt-image-1.5`                              | `OPENAI_API_KEY` oppure OAuth di OpenAI Codex |
| Generazione di immagini DeepInfra                     | `deepinfra/black-forest-labs/FLUX-1-schnell`        | `DEEPINFRA_API_KEY`                    |
| Generazione espressiva/orientata allo stile con fal Krea 2 | `fal/krea/v2/medium/text-to-image`              | `FAL_KEY`                              |
| Generazione di immagini OpenRouter                    | `openrouter/google/gemini-3.1-flash-image-preview`  | `OPENROUTER_API_KEY`                   |
| Generazione di immagini LiteLLM                       | `litellm/gpt-image-2`                               | `LITELLM_API_KEY`                      |
| Generazione di immagini Microsoft Foundry MAI         | `microsoft-foundry/<deployment-name>`               | `AZURE_OPENAI_API_KEY` oppure Entra ID |
| Generazione di immagini Google Gemini                 | `google/gemini-3.1-flash-image-preview`             | `GEMINI_API_KEY` oppure `GOOGLE_API_KEY` |

Lo stesso strumento gestisce sia la generazione da testo a immagine sia la
modifica mediante immagini di riferimento. Usa `image` per un solo riferimento
oppure `images` per più riferimenti. Per i modelli Krea 2 su fal, tali
riferimenti vengono inviati come riferimenti di stile anziché come input di
modifica. I suggerimenti di output supportati dal provider, come `quality`,
`outputFormat` e `background`, vengono inoltrati quando disponibili e segnalati
come ignorati quando il provider non ne dichiara il supporto. Il supporto
integrato per lo sfondo trasparente è specifico di OpenAI; gli altri provider
possono comunque mantenere il canale alfa PNG se viene prodotto dal loro
backend.

## Provider supportati

| Provider          | Modello predefinito                     | Supporto alla modifica                    | Autenticazione                                          |
| ----------------- | --------------------------------------- | ----------------------------------------- | ------------------------------------------------------- |
| ComfyUI           | `workflow`                              | Sì (1 immagine, configurato nel workflow) | `COMFY_API_KEY` oppure `COMFY_CLOUD_API_KEY` per il cloud |
| DeepInfra         | `black-forest-labs/FLUX-1-schnell`      | Sì (1 immagine)                           | `DEEPINFRA_API_KEY`                                     |
| fal               | `fal-ai/flux/dev`                       | Sì (limiti specifici del modello)         | `FAL_KEY`                                               |
| Google            | `gemini-3.1-flash-image-preview`        | Sì (fino a 5 immagini)                    | `GEMINI_API_KEY` oppure `GOOGLE_API_KEY`                |
| LiteLLM           | `gpt-image-2`                           | Sì (fino a 5 immagini di input)           | `LITELLM_API_KEY`                                       |
| Microsoft Foundry | `<deployment-name>`                     | Sì (solo modelli MAI-Image-2.5)           | `AZURE_OPENAI_API_KEY` oppure Entra ID (`az login`)     |
| MiniMax           | `image-01`                              | Sì (riferimento del soggetto)             | `MINIMAX_API_KEY` oppure OAuth MiniMax (`minimax-portal`) |
| OpenAI            | `gpt-image-2`                           | Sì (fino a 5 immagini)                    | `OPENAI_API_KEY` oppure OAuth di OpenAI ChatGPT/Codex   |
| OpenRouter        | `google/gemini-3.1-flash-image-preview` | Sì (fino a 5 immagini di input)           | `OPENROUTER_API_KEY`                                    |
| Vydra             | `grok-imagine`                          | No                                        | `VYDRA_API_KEY`                                         |
| xAI               | `grok-imagine-image`                    | Sì (fino a 3 immagini)                    | `XAI_API_KEY`                                           |

Usa `action: "list"` per esaminare i provider e i modelli disponibili durante
l'esecuzione:

```text
/tool image_generate action=list
```

Usa `action: "status"` per esaminare l'attività di generazione di immagini
attiva per la sessione corrente:

```text
/tool image_generate action=status
```

## Funzionalità dei provider

| Funzionalità          | ComfyUI               | DeepInfra  | fal                                            | Google             | Microsoft Foundry | MiniMax                         | OpenAI             | Vydra | xAI                |
| --------------------- | --------------------- | ---------- | ---------------------------------------------- | ------------------ | ----------------- | ------------------------------- | ------------------ | ----- | ------------------ |
| Generazione (numero massimo) | 1               | 4          | 4                                              | 4                  | 1                 | 9                               | 4                  | 1     | 4                  |
| Modifica / riferimento | 1 immagine (workflow) | 1 immagine | Flux: 1; GPT: 10; riferimenti di stile Krea: 10; NB2: 14 | Fino a 5 immagini | 1 immagine        | 1 immagine (rif. del soggetto)  | Fino a 5 immagini  | -     | Fino a 3 immagini  |
| Controllo delle dimensioni | -                  | ✓          | ✓                                              | ✓                  | ✓                 | -                               | Fino a 4K          | -     | -                  |
| Proporzioni           | -                     | -          | ✓                                              | ✓                  | -                 | ✓                               | -                  | -     | ✓                  |
| Risoluzione (1K/2K/4K) | -                    | -          | ✓                                              | ✓                  | -                 | -                               | -                  | -     | 1K, 2K             |

## Parametri dello strumento

<ParamField path="prompt" type="string" required>
  Prompt per la generazione dell'immagine. Obbligatorio per `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  Usa `"status"` per esaminare l'attività della sessione attiva oppure `"list"`
  per esaminare i provider e i modelli disponibili durante l'esecuzione.
</ParamField>
<ParamField path="model" type="string">
  Sostituzione del provider/modello (ad esempio `openai/gpt-image-2`). Usa
  `openai/gpt-image-1.5` per gli sfondi OpenAI trasparenti.
</ParamField>
<ParamField path="image" type="string">
  Percorso o URL di una singola immagine di riferimento per la modalità di modifica.
</ParamField>
<ParamField path="images" type="string[]">
  Più immagini di riferimento per la modalità di modifica o per i modelli con
  riferimenti di stile (fino a 14 tramite lo strumento condiviso; continuano ad
  applicarsi i limiti specifici del provider).
</ParamField>
<ParamField path="size" type="string">
  Suggerimento per le dimensioni: `1024x1024`, `1536x1024`, `1024x1536`,
  `2048x2048`, `3840x2160`.
</ParamField>
<ParamField path="aspectRatio" type="string">
  Proporzioni: `1:1`, `2:1`, `20:9`, `19.5:9`, `2:3`, `3:2`, `2.35:1`, `3:4`,
  `4:3`, `4:5`, `5:4`, `9:16`, `9:19.5`, `9:20`, `16:9`, `21:9`, `1:2`, `4:1`,
  `1:4`, `8:1`, `1:8`. I provider convalidano il sottoinsieme specifico del
  proprio modello.
</ParamField>
<ParamField path="resolution" type='"1K" | "2K" | "4K"'>Suggerimento per la risoluzione.</ParamField>
<ParamField path="quality" type='"low" | "medium" | "high" | "auto"'>
  Suggerimento per la qualità, quando il provider lo supporta.
</ParamField>
<ParamField path="outputFormat" type='"png" | "jpeg" | "webp"'>
  Suggerimento per il formato di output, quando il provider lo supporta.
</ParamField>
<ParamField path="background" type='"transparent" | "opaque" | "auto"'>
  Suggerimento per lo sfondo, quando il provider lo supporta. Usa `transparent`
  con `outputFormat: "png"` oppure `"webp"` per i provider che supportano la
  trasparenza.
</ParamField>
<ParamField path="count" type="number">Numero di immagini da generare (1-4).</ParamField>
<ParamField path="timeoutMs" type="number">
  Timeout facoltativo della richiesta al provider, in millisecondi. Quando
  Codex chiama `image_generate` tramite strumenti dinamici, questo valore per
  singola chiamata continua a sostituire quello predefinito configurato ed è
  limitato a 600000 ms.
</ParamField>
<ParamField path="filename" type="string">Suggerimento per il nome del file di output.</ParamField>
<ParamField path="openai" type="object">
  Suggerimenti esclusivi per OpenAI: `background`, `moderation`,
  `outputCompression` e `user`.
</ParamField>
<ParamField path="fal.creativity" type='"raw" | "low" | "medium" | "high"'>
  Controllo della creatività di fal Krea 2. Il valore predefinito è `medium`.
</ParamField>

<Note>
Non tutti i provider supportano tutti i parametri. Quando un provider di
fallback supporta un'opzione geometrica simile anziché quella esatta richiesta,
OpenClaw rimappa la richiesta alle dimensioni, alle proporzioni o alla
risoluzione supportate più vicine prima dell'invio. I suggerimenti di output
non supportati vengono rimossi per i provider che non ne dichiarano il
supporto e segnalati nel risultato dello strumento. I risultati dello strumento
indicano le impostazioni applicate; `details.normalization` registra qualsiasi
conversione dal valore richiesto a quello applicato.
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

OpenClaw prova i provider nel seguente ordine:

1. Parametro **`model`** della chiamata allo strumento (se l'agente ne specifica uno).
2. **`imageGenerationModel.primary`** dalla configurazione.
3. **`imageGenerationModel.fallbacks`** nell'ordine specificato.
4. **Rilevamento automatico**: solo valori predefiniti dei provider supportati dall'autenticazione:
   - prima il provider predefinito corrente;
   - quindi i restanti provider di generazione immagini registrati, ordinati per ID provider.

Se un provider non riesce (errore di autenticazione, limite di frequenza e così via), viene
provato automaticamente il candidato configurato successivo. Se tutti falliscono, l'errore
include i dettagli di ciascun tentativo.

<AccordionGroup>
  <Accordion title="Per-call model overrides are exact">
    Un override `model` per chiamata prova esclusivamente quel provider/modello e
    non prosegue con il provider primario, i fallback configurati o i provider rilevati automaticamente.
  </Accordion>
  <Accordion title="Auto-detection is auth-aware">
    Il valore predefinito di un provider entra nell'elenco dei candidati solo quando OpenClaw può
    effettivamente autenticarsi presso tale provider. Imposta
    `agents.defaults.mediaGenerationAutoProviderFallback: false` per utilizzare soltanto
    le voci esplicite `model`, `primary` e `fallbacks`.
  </Accordion>
  <Accordion title="Timeouts">
    Imposta `agents.defaults.imageGenerationModel.timeoutMs` per i backend di immagini
    lenti. Un parametro dello strumento `timeoutMs` per chiamata sostituisce il valore predefinito
    configurato, mentre i valori predefiniti configurati sostituiscono quelli del provider
    definiti dal Plugin. I provider di immagini ospitati da Google e OpenRouter utilizzano valori
    predefiniti di 180 secondi; la generazione di immagini di Microsoft Foundry MAI, xAI e Azure
    OpenAI utilizza 600 secondi. Le chiamate agli strumenti dinamici di Codex utilizzano un valore
    predefinito di 120 secondi per il bridge `image_generate` e, quando configurato, rispettano
    lo stesso budget di timeout, entro il limite massimo di 600000 ms del bridge degli strumenti
    dinamici di OpenClaw.
  </Accordion>
  <Accordion title="Inspect at runtime">
    Usa `action: "list"` per esaminare i provider attualmente registrati,
    i relativi modelli predefiniti e i suggerimenti sulle variabili d'ambiente di autenticazione.
  </Accordion>
</AccordionGroup>

### Modifica delle immagini

OpenAI, OpenRouter, Google, DeepInfra, fal, Microsoft Foundry, MiniMax,
ComfyUI e xAI supportano la modifica delle immagini di riferimento. I modelli Krea 2 su fal
utilizzano gli stessi campi `image` / `images` come riferimenti di stile anziché come input
di modifica. Passa il percorso o l'URL di un'immagine di riferimento:

```text
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter e Google supportano fino a 5 immagini di riferimento tramite il
parametro `images`; xAI ne supporta fino a 3. fal supporta 1 immagine di riferimento per
la conversione da immagine a immagine di Flux, fino a 10 per le modifiche con GPT Image 2,
fino a 10 riferimenti di stile per Krea 2 e fino a 14 per le modifiche con Nano Banana 2.
Microsoft Foundry, MiniMax e ComfyUI ne supportano 1.

## Approfondimenti sui provider

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2 (and gpt-image-1.5)">
    La generazione di immagini OpenAI utilizza per impostazione predefinita
    `openai/gpt-image-2`. Se è configurato un profilo OAuth `openai`, OpenClaw
    riutilizza lo stesso profilo OAuth usato dai modelli di chat dell'abbonamento Codex
    e invia la richiesta di immagine tramite il backend Codex Responses. Gli URL di base
    Codex precedenti, come `https://chatgpt.com/backend-api`, vengono normalizzati in
    `https://chatgpt.com/backend-api/codex` per le richieste di immagini. OpenClaw
    **non** ripiega automaticamente su `OPENAI_API_KEY` per tale richiesta:
    per forzare l'instradamento diretto tramite l'API OpenAI Images, configura
    esplicitamente `models.providers.openai` con una chiave API, un URL di base
    personalizzato o un endpoint Azure.

    I modelli `openai/gpt-image-1.5`, `openai/gpt-image-1` e
    `openai/gpt-image-1-mini` possono comunque essere selezionati esplicitamente. Usa
    `gpt-image-1.5` per ottenere output PNG/WebP con sfondo trasparente; l'API
    `gpt-image-2` corrente rifiuta `background: "transparent"`.

    `gpt-image-2` supporta sia la generazione da testo a immagine sia
    la modifica di immagini di riferimento tramite lo stesso strumento `image_generate`.
    OpenClaw inoltra a OpenAI `prompt`, `count`, `size`, `quality`, `outputFormat`
    e le immagini di riferimento. OpenAI **non** riceve direttamente
    `aspectRatio` o `resolution`; quando possibile, OpenClaw li associa a un valore
    `size` supportato, altrimenti lo strumento li segnala come override ignorati.

    Le opzioni specifiche di OpenAI si trovano nell'oggetto `openai`:

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
    gli output trasparenti richiedono un `outputFormat` `png` o `webp` e un
    modello di immagini OpenAI che supporti la trasparenza. OpenClaw instrada le richieste
    con sfondo trasparente del modello predefinito `gpt-image-2` verso `gpt-image-1.5`.
    `openai.outputCompression` si applica agli output JPEG/WebP e viene ignorato
    per gli output PNG.

    Il suggerimento `background` di primo livello è indipendente dal provider e attualmente
    viene associato allo stesso campo di richiesta `background` di OpenAI quando è
    selezionato il provider OpenAI. I provider che non dichiarano il supporto per lo sfondo
    lo restituiscono in `ignoredOverrides` anziché ricevere il parametro non supportato.

    Per instradare la generazione di immagini OpenAI tramite una distribuzione Azure OpenAI
    anziché `api.openai.com`, consulta
    [Endpoint Azure OpenAI](/it/providers/openai#azure-openai-endpoints).

  </Accordion>
  <Accordion title="Microsoft Foundry MAI image models">
    La generazione di immagini Microsoft Foundry utilizza i nomi delle distribuzioni di immagini
    MAI sotto il prefisso provider `microsoft-foundry/`. Non esiste un modello predefinito
    a livello di provider perché l'API MAI richiede il nome della distribuzione nel
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

    Il provider utilizza l'API MAI di Microsoft Foundry, non l'API OpenAI Images:

    - Endpoint di generazione: `/mai/v1/images/generations`
    - Endpoint di modifica: `/mai/v1/images/edits`
    - Autenticazione: `AZURE_OPENAI_API_KEY` / chiave API del provider oppure Entra ID tramite `az login`
    - Output: un'immagine PNG
    - Dimensioni: valore predefinito `1024x1024`; larghezza e altezza devono essere entrambe di almeno 768 px,
      mentre il numero totale di pixel non deve superare 1.048.576
    - Modifiche: un'immagine di riferimento PNG o JPEG, supportata soltanto dalle
      distribuzioni `MAI-Image-2.5-Flash` e `MAI-Image-2.5`

    La generazione basata esclusivamente sul prompt può utilizzare un nome di distribuzione
    personalizzato configurando soltanto l'endpoint Foundry. Le modifiche con nomi di
    distribuzione personalizzati richiedono metadati di onboarding/modello affinché OpenClaw
    possa verificare che la distribuzione sia basata su `MAI-Image-2.5-Flash` o
    `MAI-Image-2.5`.

    I modelli di immagini MAI correnti sono `MAI-Image-2.5-Flash`, `MAI-Image-2.5`,
    `MAI-Image-2e` e `MAI-Image-2`. Consulta il
    [Plugin Microsoft Foundry](/it/plugins/reference/microsoft-foundry) per la configurazione
    e il comportamento dei modelli di chat.

  </Accordion>
  <Accordion title="OpenRouter image models">
    La generazione di immagini OpenRouter utilizza la stessa `OPENROUTER_API_KEY` e
    viene instradata tramite l'API per immagini dei completamenti chat di OpenRouter.
    Seleziona i modelli di immagini OpenRouter con il prefisso `openrouter/`:

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

    OpenClaw inoltra a OpenRouter `prompt`, `count`, le immagini di riferimento e
    i suggerimenti `aspectRatio` / `resolution` compatibili con Gemini.
    Le scorciatoie integrate correnti per i modelli di immagini OpenRouter includono
    `google/gemini-3.1-flash-image-preview`,
    `google/gemini-3-pro-image-preview` e `openai/gpt-5.4-image-2`. Usa
    `action: "list"` per vedere ciò che espone il Plugin configurato.

  </Accordion>
  <Accordion title="fal Krea 2">
    I modelli Krea 2 su fal utilizzano lo schema Krea nativo di fal anziché lo schema
    generico `image_size` utilizzato da Flux. OpenClaw invia:

    - `aspect_ratio` per i suggerimenti sulle proporzioni
    - `creativity`, con valore predefinito `medium`
    - `image_style_references` quando vengono forniti `image` o `images`

    Seleziona Krea 2 Medium per illustrazioni espressive più rapide e Krea 2 Large
    per risultati fotorealistici e materici più lenti e dettagliati:

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

    Attualmente Krea 2 restituisce un'immagine per richiesta. Per Krea è preferibile
    `aspectRatio`; OpenClaw associa `size` alle proporzioni Krea supportate più vicine
    e rifiuta `resolution` per Krea anziché ignorarlo. Usa `fal.creativity`
    quando desideri un livello di creatività nativo di Krea:

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
  <Accordion title="MiniMax dual-auth">
    La generazione di immagini MiniMax è disponibile tramite entrambi i percorsi
    di autenticazione MiniMax inclusi:

    - `minimax/image-01` per configurazioni con chiave API
    - `minimax-portal/image-01` per configurazioni OAuth

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    Il provider xAI incluso utilizza `/v1/images/generations` per le richieste
    basate esclusivamente sul prompt e `/v1/images/edits` quando è presente
    `image` o `images`.

    - Modelli: `xai/grok-imagine-image`, `xai/grok-imagine-image-quality`
    - Numero: fino a 4
    - Riferimenti: un `image` o fino a tre `images`
    - Proporzioni: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`, `2:1`,
      `1:2`, `19.5:9`, `9:19.5`, `20:9`, `9:20`
    - Risoluzioni: `1K`, `2K`
    - Output: restituiti come allegati immagine gestiti da OpenClaw

    OpenClaw non espone intenzionalmente i parametri nativi xAI `quality`, `mask`,
    `user` o le proporzioni `auto` finché tali controlli non saranno presenti nel
    contratto condiviso tra provider `image_generate`.

  </Accordion>
</AccordionGroup>

## Esempi

<Tabs>
  <Tab title="Generate (4K landscape)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```
  </Tab>
  <Tab title="Generate (transparent PNG)">
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
  <Tab title="Generate (OpenAI low quality)">
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
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Due direzioni visive per l'icona di un'app di produttività dal tono rilassante" size=1024x1024 count=2
```
  </Tab>
  <Tab title="Modifica (un riferimento)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Mantieni il soggetto e sostituisci lo sfondo con un'ambientazione luminosa da studio" image=/path/to/reference.png size=1024x1536
```
  </Tab>
  <Tab title="Modifica (più riferimenti)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combina l'identità del personaggio della prima immagine con la palette di colori della seconda" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```
  </Tab>
  <Tab title="Riferimenti di stile Krea">
```text
/tool image_generate action=generate model=fal/krea/v2/medium/text-to-image prompt="Un ritratto editoriale espressivo che utilizza questa palette di colori e questa texture di stampa" images='["/path/to/palette.png","/path/to/texture.jpg"]' aspectRatio=9:16 fal='{"creativity":"high"}'
```
  </Tab>
</Tabs>

Le stesse opzioni `--output-format`, `--background`, `--quality` e
`--openai-moderation` sono disponibili con `openclaw infer image edit`;
`--openai-background` rimane un alias specifico di OpenAI. Attualmente i provider
inclusi diversi da OpenAI non dichiarano un controllo esplicito dello sfondo,
quindi per essi `background: "transparent"` viene segnalato come ignorato.

## Contenuti correlati

- [Panoramica degli strumenti](/it/tools) - tutti gli strumenti disponibili per gli agenti
- [ComfyUI](/it/providers/comfy) - configurazione dei flussi di lavoro locali di ComfyUI e di Comfy Cloud
- [fal](/it/providers/fal) - configurazione del provider di immagini e video fal
- [Google (Gemini)](/it/providers/google) - configurazione del provider di immagini Gemini
- [Plugin Microsoft Foundry](/it/plugins/reference/microsoft-foundry) - configurazione della chat di Microsoft Foundry e delle immagini MAI
- [MiniMax](/it/providers/minimax) - configurazione del provider di immagini MiniMax
- [OpenAI](/it/providers/openai) - configurazione del provider OpenAI Images
- [Vydra](/it/providers/vydra) - configurazione di immagini, video e sintesi vocale di Vydra
- [xAI](/it/providers/xai) - configurazione di immagini, video, ricerca, esecuzione di codice e TTS di Grok
- [Riferimento per la configurazione](/it/gateway/config-agents#agent-defaults) - configurazione di `imageGenerationModel`
- [Modelli](/it/concepts/models) - configurazione dei modelli e failover
