---
read_when:
    - Generazione o modifica di immagini tramite l'agente
    - Configurazione di provider e modelli di generazione immagini
    - Comprendere i parametri dello strumento `image_generate`
sidebarTitle: Image generation
summary: Genera e modifica immagini tramite `image_generate` su OpenAI, Google, fal, MiniMax, ComfyUI, OpenRouter, LiteLLM, xAI, Vydra
title: Generazione di immagini
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-26T11:39:37Z"
  model: gpt-5.4
  provider: openai
  source_hash: c57d32667eed3d6449628f6f663359ece089233ed0fde5258e2b2e4713192758
  source_path: tools/image-generation.md
  workflow: 15
---

Lo strumento `image_generate` consente all'agente di creare e modificare immagini usando i
provider configurati. Le immagini generate vengono consegnate automaticamente come
allegati media nella risposta dell'agente.

<Note>
Lo strumento compare solo quando è disponibile almeno un provider di
generazione immagini. Se non vedi `image_generate` tra gli strumenti del tuo agente,
configura `agents.defaults.imageGenerationModel`, imposta una chiave API del provider
oppure accedi con OpenAI Codex OAuth.
</Note>

## Avvio rapido

<Steps>
  <Step title="Configura l'autenticazione">
    Imposta una chiave API per almeno un provider (ad esempio `OPENAI_API_KEY`,
    `GEMINI_API_KEY`, `OPENROUTER_API_KEY`) oppure accedi con OpenAI Codex OAuth.
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

    Codex OAuth usa lo stesso riferimento di modello `openai/gpt-image-2`. Quando è
    configurato un profilo OAuth `openai-codex`, OpenClaw instrada le richieste di immagini
    tramite quel profilo OAuth invece di provare prima
    `OPENAI_API_KEY`. Una configurazione esplicita di `models.providers.openai` (chiave API,
    `baseUrl` personalizzato/Azure) forza di nuovo il percorso diretto della
    OpenAI Images API.

  </Step>
  <Step title="Chiedi all'agente">
    _"Genera un'immagine di una simpatica mascotte robot."_

    L'agente chiama automaticamente `image_generate`. Nessuna allow-list
    degli strumenti necessaria — è abilitato per impostazione predefinita quando è disponibile un provider.

  </Step>
</Steps>

<Warning>
Per endpoint LAN compatibili con OpenAI come LocalAI, mantieni il valore personalizzato
`models.providers.openai.baseUrl` ed esegui l'opt-in esplicito con
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`. Gli endpoint immagine privati e
interni restano bloccati per impostazione predefinita.
</Warning>

## Percorsi comuni

| Obiettivo                                            | Riferimento modello                                | Auth                                   |
| ---------------------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| Generazione immagini OpenAI con fatturazione API     | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                       |
| Generazione immagini OpenAI con auth in abbonamento Codex | `openai/gpt-image-2`                           | OpenAI Codex OAuth                     |
| PNG/WebP OpenAI con sfondo trasparente               | `openai/gpt-image-1.5`                             | `OPENAI_API_KEY` o OpenAI Codex OAuth |
| Generazione immagini OpenRouter                      | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                   |
| Generazione immagini LiteLLM                         | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                      |
| Generazione immagini Google Gemini                   | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` o `GOOGLE_API_KEY`   |

Lo stesso strumento `image_generate` gestisce sia text-to-image sia il
montaggio di immagini di riferimento. Usa `image` per un solo riferimento o `images` per
più riferimenti. Gli hint di output supportati dal provider come
`quality`, `outputFormat` e `background` vengono inoltrati quando disponibili e
riportati come ignorati quando un provider non li supporta. Il supporto incluso nel bundle per
lo sfondo trasparente è specifico di OpenAI; altri provider possono comunque preservare
l'alpha PNG se il loro backend lo emette.

## Provider supportati

| Provider   | Modello predefinito                     | Supporto edit                       | Auth                                                  |
| ---------- | --------------------------------------- | ----------------------------------- | ----------------------------------------------------- |
| ComfyUI    | `workflow`                              | Sì (1 immagine, configurata dal workflow) | `COMFY_API_KEY` o `COMFY_CLOUD_API_KEY` per il cloud    |
| fal        | `fal-ai/flux/dev`                       | Sì                                  | `FAL_KEY`                                             |
| Google     | `gemini-3.1-flash-image-preview`        | Sì                                  | `GEMINI_API_KEY` o `GOOGLE_API_KEY`                  |
| LiteLLM    | `gpt-image-2`                           | Sì (fino a 5 immagini di input)     | `LITELLM_API_KEY`                                     |
| MiniMax    | `image-01`                              | Sì (riferimento del soggetto)       | `MINIMAX_API_KEY` o MiniMax OAuth (`minimax-portal`) |
| OpenAI     | `gpt-image-2`                           | Sì (fino a 4 immagini)              | `OPENAI_API_KEY` o OpenAI Codex OAuth                |
| OpenRouter | `google/gemini-3.1-flash-image-preview` | Sì (fino a 5 immagini di input)     | `OPENROUTER_API_KEY`                                  |
| Vydra      | `grok-imagine`                          | No                                  | `VYDRA_API_KEY`                                       |
| xAI        | `grok-imagine-image`                    | Sì (fino a 5 immagini)              | `XAI_API_KEY`                                         |

Usa `action: "list"` per ispezionare provider e modelli disponibili a runtime:

```text
/tool image_generate action=list
```

## Capacità dei provider

| Capacità              | ComfyUI             | fal               | Google         | MiniMax               | OpenAI         | Vydra | xAI            |
| --------------------- | ------------------- | ----------------- | -------------- | --------------------- | -------------- | ----- | -------------- |
| Generazione (conteggio max) | Definita dal workflow | 4                 | 4              | 9                     | 4              | 1     | 4              |
| Edit / riferimento    | 1 immagine (workflow) | 1 immagine      | Fino a 5 immagini | 1 immagine (rif. soggetto) | Fino a 5 immagini | —     | Fino a 5 immagini |
| Controllo dimensione  | —                   | ✓                 | ✓              | —                     | Fino a 4K      | —     | —              |
| Aspect ratio          | —                   | ✓ (solo generate) | ✓              | ✓                     | —              | —     | ✓              |
| Risoluzione (1K/2K/4K) | —                  | ✓                 | ✓              | —                     | —              | —     | 1K, 2K         |

## Parametri dello strumento

<ParamField path="prompt" type="string" required>
  Prompt di generazione dell'immagine. Obbligatorio per `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "list"' default="generate">
  Usa `"list"` per ispezionare provider e modelli disponibili a runtime.
</ParamField>
<ParamField path="model" type="string">
  Override provider/modello (ad esempio `openai/gpt-image-2`). Usa
  `openai/gpt-image-1.5` per sfondi OpenAI trasparenti.
</ParamField>
<ParamField path="image" type="string">
  Percorso o URL di una singola immagine di riferimento per la modalità edit.
</ParamField>
<ParamField path="images" type="string[]">
  Più immagini di riferimento per la modalità edit (fino a 5 sui provider che lo supportano).
</ParamField>
<ParamField path="size" type="string">
  Hint di dimensione: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`.
</ParamField>
<ParamField path="aspectRatio" type="string">
  Aspect ratio: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`.
</ParamField>
<ParamField path="resolution" type='"1K" | "2K" | "4K"'>Hint di risoluzione.</ParamField>
<ParamField path="quality" type='"low" | "medium" | "high" | "auto"'>
  Hint di qualità quando il provider lo supporta.
</ParamField>
<ParamField path="outputFormat" type='"png" | "jpeg" | "webp"'>
  Hint del formato di output quando il provider lo supporta.
</ParamField>
<ParamField path="background" type='"transparent" | "opaque" | "auto"'>
  Hint di sfondo quando il provider lo supporta. Usa `transparent` con
  `outputFormat: "png"` o `"webp"` per i provider che supportano la trasparenza.
</ParamField>
<ParamField path="count" type="number">Numero di immagini da generare (1–4).</ParamField>
<ParamField path="timeoutMs" type="number">Timeout facoltativo della richiesta al provider in millisecondi.</ParamField>
<ParamField path="filename" type="string">Hint per il nome del file di output.</ParamField>
<ParamField path="openai" type="object">
  Hint solo OpenAI: `background`, `moderation`, `outputCompression` e `user`.
</ParamField>

<Note>
Non tutti i provider supportano tutti i parametri. Quando un provider di fallback supporta un'opzione geometrica vicina invece di quella esattamente richiesta, OpenClaw rimappa
alla dimensione, aspect ratio o risoluzione supportati più vicini prima dell'invio.
Gli hint di output non supportati vengono scartati per i provider che non dichiarano
supporto e riportati nel risultato dello strumento. I risultati dello strumento riportano le impostazioni
applicate; `details.normalization` cattura qualsiasi
traduzione da richiesto ad applicato.
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

### Ordine di selezione del provider

OpenClaw prova i provider in questo ordine:

1. **Parametro `model`** della chiamata allo strumento (se l'agente ne specifica uno).
2. **`imageGenerationModel.primary`** dalla configurazione.
3. **`imageGenerationModel.fallbacks`** nell'ordine indicato.
4. **Rilevamento automatico** — solo valori predefiniti dei provider supportati da auth:
   - prima il provider predefinito corrente;
   - poi gli altri provider di generazione immagini registrati in ordine di id provider.

Se un provider fallisce (errore auth, rate limit, ecc.), viene provato automaticamente
il successivo candidato configurato. Se falliscono tutti, l'errore include i dettagli
di ogni tentativo.

<AccordionGroup>
  <Accordion title="Gli override di modello per chiamata sono esatti">
    Un override `model` per chiamata prova solo quel provider/modello e
    non continua con primary/fallback configurati o provider rilevati automaticamente.
  </Accordion>
  <Accordion title="Il rilevamento automatico è consapevole dell'auth">
    Un valore predefinito del provider entra nell'elenco dei candidati solo quando OpenClaw può
    effettivamente autenticare quel provider. Imposta
    `agents.defaults.mediaGenerationAutoProviderFallback: false` per usare solo
    le voci esplicite `model`, `primary` e `fallbacks`.
  </Accordion>
  <Accordion title="Timeout">
    Imposta `agents.defaults.imageGenerationModel.timeoutMs` per backend
    di immagini lenti. Un parametro dello strumento `timeoutMs` per chiamata sovrascrive il valore
    predefinito configurato.
  </Accordion>
  <Accordion title="Ispeziona a runtime">
    Usa `action: "list"` per ispezionare i provider attualmente registrati,
    i loro modelli predefiniti e gli hint delle variabili env per l'auth.
  </Accordion>
</AccordionGroup>

### Modifica delle immagini

OpenAI, OpenRouter, Google, fal, MiniMax, ComfyUI e xAI supportano la modifica
di immagini di riferimento. Passa un percorso o URL di immagine di riferimento:

```text
"Genera una versione ad acquerello di questa foto" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter, Google e xAI supportano fino a 5 immagini di riferimento tramite il
parametro `images`. fal, MiniMax e ComfyUI ne supportano 1.

## Approfondimenti sui provider

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2 (e gpt-image-1.5)">
    La generazione di immagini OpenAI usa per impostazione predefinita `openai/gpt-image-2`. Se è
    configurato un profilo OAuth `openai-codex`, OpenClaw riusa lo stesso
    profilo OAuth usato dai modelli chat in abbonamento Codex e invia la
    richiesta di immagine tramite il backend Codex Responses. I base URL Codex legacy
    come `https://chatgpt.com/backend-api` vengono canonicalizzati in
    `https://chatgpt.com/backend-api/codex` per le richieste di immagini. OpenClaw
    **non** ricade silenziosamente su `OPENAI_API_KEY` per quella richiesta —
    per forzare il routing diretto alla OpenAI Images API, configura
    `models.providers.openai` esplicitamente con una chiave API, un `baseUrl` personalizzato
    o un endpoint Azure.

    I modelli `openai/gpt-image-1.5`, `openai/gpt-image-1` e
`openai/gpt-image-1-mini` possono ancora essere selezionati esplicitamente. Usa
`gpt-image-1.5` per output PNG/WebP con sfondo trasparente; l'attuale
API `gpt-image-2` rifiuta `background: "transparent"`.

`gpt-image-2` supporta sia la generazione text-to-image sia la
modifica di immagini di riferimento tramite lo stesso strumento `image_generate`.
OpenClaw inoltra `prompt`, `count`, `size`, `quality`, `outputFormat`
e le immagini di riferimento a OpenAI. OpenAI **non** riceve
direttamente `aspectRatio` o `resolution`; quando possibile OpenClaw li mappa
su un `size` supportato, altrimenti lo strumento li riporta come
override ignorati.

Le opzioni specifiche di OpenAI vivono sotto l'oggetto `openai`:

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
modello immagine OpenAI compatibile con la trasparenza. OpenClaw instrada le richieste
predefinite di sfondo trasparente per `gpt-image-2` verso `gpt-image-1.5`.
`openai.outputCompression` si applica agli output JPEG/WebP.

L'hint di primo livello `background` è neutrale rispetto al provider e attualmente viene mappato
allo stesso campo di richiesta OpenAI `background` quando è selezionato il provider OpenAI.
I provider che non dichiarano supporto per lo sfondo
lo restituiscono in `ignoredOverrides` invece di ricevere il parametro non supportato.

Per instradare la generazione di immagini OpenAI tramite un deployment Azure OpenAI
invece di `api.openai.com`, vedi
[Endpoint Azure OpenAI](/it/providers/openai#azure-openai-endpoints).

  </Accordion>
  <Accordion title="Modelli immagine OpenRouter">
    La generazione di immagini OpenRouter usa lo stesso `OPENROUTER_API_KEY` e
    instrada tramite l'API immagine delle chat completions di OpenRouter. Seleziona
    i modelli immagine OpenRouter con il prefisso `openrouter/`:

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
    hint `aspectRatio` / `resolution` compatibili con Gemini a OpenRouter.
    Gli shortcut integrati attuali dei modelli immagine OpenRouter includono
    `google/gemini-3.1-flash-image-preview`,
    `google/gemini-3-pro-image-preview` e `openai/gpt-5.4-image-2`. Usa
    `action: "list"` per vedere cosa espone il tuo Plugin configurato.

  </Accordion>
  <Accordion title="Doppia autenticazione MiniMax">
    La generazione di immagini MiniMax è disponibile tramite entrambi i percorsi di
    autenticazione MiniMax inclusi nel bundle:

    - `minimax/image-01` per configurazioni con chiave API
    - `minimax-portal/image-01` per configurazioni OAuth

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    Il provider xAI incluso nel bundle usa `/v1/images/generations` per richieste
    solo prompt e `/v1/images/edits` quando è presente `image` o `images`.

    - Modelli: `xai/grok-imagine-image`, `xai/grok-imagine-image-pro`
    - Conteggio: fino a 4
    - Riferimenti: un `image` o fino a cinque `images`
    - Aspect ratio: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Risoluzioni: `1K`, `2K`
    - Output: restituiti come allegati immagine gestiti da OpenClaw

    OpenClaw intenzionalmente non espone `quality`, `mask`,
    `user` o ulteriori aspect ratio esclusivi del provider nativo xAI finché questi controlli non esistono
    nel contratto condiviso cross-provider di `image_generate`.

  </Accordion>
</AccordionGroup>

## Esempi

<Tabs>
  <Tab title="Genera (4K orizzontale)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Un poster editoriale pulito per la generazione di immagini OpenClaw" size=3840x2160 count=1
```
  </Tab>
  <Tab title="Genera (PNG trasparente)">
```text
/tool image_generate action=generate model=openai/gpt-image-1.5 prompt="Un semplice adesivo a cerchio rosso su sfondo trasparente" outputFormat=png background=transparent
```

CLI equivalente:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "Un semplice adesivo a cerchio rosso su sfondo trasparente" \
  --json
```

  </Tab>
  <Tab title="Genera (due quadrati)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Due direzioni visive per l'icona di un'app di produttività calma" size=1024x1024 count=2
```
  </Tab>
  <Tab title="Modifica (un riferimento)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Mantieni il soggetto, sostituisci lo sfondo con un set da studio luminoso" image=/path/to/reference.png size=1024x1536
```
  </Tab>
  <Tab title="Modifica (più riferimenti)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combina l'identità del personaggio della prima immagine con la palette colori della seconda" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```
  </Tab>
</Tabs>

Gli stessi flag `--output-format` e `--background` sono disponibili su
`openclaw infer image edit`; `--openai-background` resta un
alias specifico di OpenAI. I provider inclusi nel bundle diversi da OpenAI non dichiarano
oggi un controllo esplicito dello sfondo, quindi `background: "transparent"` viene riportato
come ignorato per loro.

## Correlati

- [Panoramica degli strumenti](/it/tools) — tutti gli strumenti dell'agente disponibili
- [ComfyUI](/it/providers/comfy) — configurazione del workflow ComfyUI locale e Comfy Cloud
- [fal](/it/providers/fal) — configurazione del provider immagini e video fal
- [Google (Gemini)](/it/providers/google) — configurazione del provider immagini Gemini
- [MiniMax](/it/providers/minimax) — configurazione del provider immagini MiniMax
- [OpenAI](/it/providers/openai) — configurazione del provider OpenAI Images
- [Vydra](/it/providers/vydra) — configurazione di immagini, video e speech Vydra
- [xAI](/it/providers/xai) — configurazione di immagini, video, ricerca, esecuzione di codice e TTS Grok
- [Riferimento della configurazione](/it/gateway/config-agents#agent-defaults) — configurazione `imageGenerationModel`
- [Modelli](/it/concepts/models) — configurazione dei modelli e failover
