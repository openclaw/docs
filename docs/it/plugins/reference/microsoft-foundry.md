---
read_when:
    - Stai installando, configurando o verificando il plugin microsoft-foundry
summary: Aggiunge il supporto del provider di modelli Microsoft Foundry a OpenClaw.
title: Plugin Microsoft Foundry
x-i18n:
    generated_at: "2026-06-27T17:57:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c120a68393626e5ff9f24cd80bce4612a3772faf3722b93f2ff4677f743d0252
    source_path: plugins/reference/microsoft-foundry.md
    workflow: 16
---

# Plugin Microsoft Foundry

Aggiunge a OpenClaw il supporto per il provider di modelli Microsoft Foundry.

## Distribuzione

- Pacchetto: `@openclaw/microsoft-foundry`
- Percorso di installazione: incluso in OpenClaw

## Superficie

provider: microsoft-foundry; contratti: imageGenerationProviders

<!-- openclaw-plugin-reference:manual-start -->

- Provider di generazione di immagini: `microsoft-foundry`

## Requisiti

- Una risorsa Microsoft Foundry o Azure AI Foundry con distribuzioni.
- Autenticazione con chiave API tramite `AZURE_OPENAI_API_KEY` o una chiave API provider configurata.
- Per l'autenticazione Entra ID, installa la Azure CLI ed esegui `az login` prima
  dell'onboarding. OpenClaw aggiorna i token di runtime Microsoft Foundry tramite
  `az account get-access-token`.

## Modelli chat

Le distribuzioni chat Microsoft Foundry usano il riferimento del modello del provider
`microsoft-foundry/<deployment-name>`. L'onboarding rileva le risorse Foundry
e le distribuzioni con la Azure CLI, quindi scrive il nome della distribuzione selezionata
nella configurazione del modello.

OpenClaw usa l'endpoint Foundry `/openai/v1` per le API chat compatibili con OpenAI
supportate:

- Le famiglie di modelli GPT, `o*`, `computer-use-preview` e DeepSeek-V4 usano per impostazione predefinita
  `openai-responses`.
- MAI-DS-R1 e altre distribuzioni chat-completion usano `openai-completions`
  a meno che non sia configurata esplicitamente un'API supportata.
- MAI-DS-R1 viene registrato come capace di ragionamento tramite contenuto di ragionamento, non
  tramite `reasoning_effort`. I suoi metadati sui token di contesto e output sono
  163.840 token.

Le distribuzioni Anthropic Claude in Microsoft Foundry usano la forma dell'API Anthropic Messages,
non la forma compatibile con OpenAI `/openai/v1`. Configurale come provider
`anthropic-messages` personalizzato finché il Plugin Microsoft Foundry non aggiungerà un
runtime Anthropic nativo. Quando il nome della distribuzione Foundry è diverso dall'ID
modello Claude, imposta `params.canonicalModelId` sulla voce del modello in modo che OpenClaw
possa applicare contratti di comunicazione specifici del modello, mappare correttamente `/think off` e
preservare in sicurezza il ragionamento firmato.

## Generazione di immagini MAI

Il plugin registra `microsoft-foundry` per `image_generate` con gli attuali
modelli di immagini Microsoft AI:

- `MAI-Image-2.5-Flash`
- `MAI-Image-2.5`
- `MAI-Image-2e`
- `MAI-Image-2`

Usa il nome di una distribuzione di immagini MAI distribuita come riferimento del modello. Il provider
non dichiara un modello di immagini predefinito perché l'API MAI richiede il nome della tua distribuzione
nel campo `model` della richiesta:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "microsoft-foundry/<deployment-name>",
        timeoutMs: 600000,
      },
    },
  },
}
```

Le chiamate di generazione solo da prompt usano l'endpoint generazioni MAI di Microsoft Foundry:
`/mai/v1/images/generations`. Le modifiche con immagine di riferimento usano
`/mai/v1/images/edits` e sono limitate alle distribuzioni `MAI-Image-2.5-Flash` e
`MAI-Image-2.5`.

La generazione solo da prompt può usare un nome di distribuzione personalizzato con il solo endpoint
Foundry configurato. Per le modifiche alle immagini con un nome di distribuzione personalizzato, seleziona la
distribuzione tramite onboarding o includi i metadati del modello in modo che OpenClaw possa verificare
che la distribuzione sia supportata da `MAI-Image-2.5-Flash` o `MAI-Image-2.5`.

Vincoli delle immagini MAI:

- Output: un'immagine PNG per richiesta.
- Dimensioni: predefinite `1024x1024`; sia la larghezza sia l'altezza devono essere almeno 768 px.
- Pixel totali: larghezza × altezza deve essere al massimo 1.048.576.
- Modifiche: un'immagine di input PNG o JPEG.
- Suggerimenti condivisi non supportati come `aspectRatio`, `resolution`, `quality`,
  `background` e `outputFormat` non PNG non vengono inviati a Microsoft Foundry.

## Risoluzione dei problemi

- `az: command not found`: installa la Azure CLI o usa l'autenticazione con chiave API.
- `Microsoft Foundry endpoint missing for MAI image generation`: seleziona una
  distribuzione Foundry tramite onboarding o aggiungi `models.providers.microsoft-foundry.baseUrl`.
- `supports MAI image deployments only`: il modello di immagini selezionato punta a una
  distribuzione non MAI. Usa un modello di immagini MAI distribuito per `image_generate`.

<!-- openclaw-plugin-reference:manual-end -->
