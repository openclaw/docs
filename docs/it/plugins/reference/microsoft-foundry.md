---
read_when:
    - Stai installando, configurando o verificando il plugin microsoft-foundry
summary: Aggiunge a OpenClaw il supporto per il provider di modelli Microsoft Foundry.
title: Plugin Microsoft Foundry
x-i18n:
    generated_at: "2026-07-12T07:19:30Z"
    model: gpt-5.6
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
- Modalità di installazione: incluso in OpenClaw

## Superficie

provider: microsoft-foundry; contratti: imageGenerationProviders

<!-- openclaw-plugin-reference:manual-start -->

- Provider di generazione delle immagini: `microsoft-foundry`

## Requisiti

- Una risorsa Microsoft Foundry o Azure AI Foundry con distribuzioni.
- Autenticazione tramite chiave API mediante `AZURE_OPENAI_API_KEY` o una chiave API del provider configurata.
- Per l'autenticazione con Entra ID, installare la CLI di Azure ed eseguire `az login` prima
  dell'onboarding. OpenClaw aggiorna i token di runtime di Microsoft Foundry tramite
  `az account get-access-token`.

## Modelli di chat

Le distribuzioni di chat di Microsoft Foundry utilizzano il riferimento al modello del provider
`microsoft-foundry/<deployment-name>`. L'onboarding rileva le risorse e le
distribuzioni Foundry mediante la CLI di Azure, quindi scrive il nome della distribuzione selezionata
nella configurazione del modello.

OpenClaw utilizza l'endpoint Foundry `/openai/v1` per le API di chat compatibili
con OpenAI supportate:

- Le famiglie di modelli GPT, `o*`, `computer-use-preview` e DeepSeek-V4 usano per impostazione predefinita
  `openai-responses`.
- MAI-DS-R1 e le altre distribuzioni di completamento chat utilizzano `openai-completions`,
  a meno che non sia configurata esplicitamente un'API supportata.
- MAI-DS-R1 viene registrato come dotato di capacità di ragionamento tramite il contenuto di ragionamento, non
  tramite `reasoning_effort`. I metadati relativi ai token di contesto e di output sono pari a
  163.840 token.

Le distribuzioni Anthropic Claude in Microsoft Foundry utilizzano il formato dell'API Anthropic Messages,
non quello compatibile con OpenAI `/openai/v1`. Configurarle come provider
`anthropic-messages` personalizzato finché il Plugin Microsoft Foundry non disporrà di un
runtime Anthropic nativo. Quando il nome della distribuzione Foundry differisce dall'ID del
modello Claude, impostare `params.canonicalModelId` nella voce del modello affinché OpenClaw
possa applicare i contratti di trasmissione specifici del modello, mappare correttamente `/think off` e
preservare in modo sicuro il ragionamento firmato.

## Generazione di immagini MAI

Il Plugin registra `microsoft-foundry` per `image_generate` con gli attuali
modelli di immagini Microsoft AI:

- `MAI-Image-2.5-Flash`
- `MAI-Image-2.5`
- `MAI-Image-2e`
- `MAI-Image-2`

Utilizzare come riferimento al modello il nome di una distribuzione di immagini MAI già distribuita. Il provider non
dichiara un modello di immagini predefinito perché l'API MAI richiede il nome della distribuzione
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

La generazione basata unicamente sul prompt chiama l'endpoint di generazione MAI di Microsoft Foundry:
`/mai/v1/images/generations`. Le modifiche basate su un'immagine di riferimento chiamano
`/mai/v1/images/edits` e sono limitate alle distribuzioni `MAI-Image-2.5-Flash` e
`MAI-Image-2.5`.

La generazione basata unicamente sul prompt può utilizzare un nome di distribuzione personalizzato configurando soltanto
l'endpoint Foundry. Per le modifiche alle immagini con un nome di distribuzione personalizzato, selezionare la
distribuzione tramite l'onboarding o includere i metadati del modello affinché OpenClaw possa verificare
che la distribuzione sia basata su `MAI-Image-2.5-Flash` o `MAI-Image-2.5`.

Vincoli delle immagini MAI:

- Output: un'immagine PNG per richiesta.
- Dimensioni: valore predefinito `1024x1024`; sia la larghezza sia l'altezza devono essere di almeno 768 px.
- Pixel totali: larghezza × altezza non deve superare 1.048.576.
- Modifiche: un'immagine di input PNG o JPEG.
- Le indicazioni condivise non supportate, come `aspectRatio`, `resolution`, `quality`,
  `background` e i valori di `outputFormat` diversi da PNG, non vengono inviate a Microsoft Foundry.

## Risoluzione dei problemi

- `az: command not found`: installare la CLI di Azure o utilizzare l'autenticazione tramite chiave API.
- `Microsoft Foundry endpoint missing for MAI image generation`: selezionare una
  distribuzione Foundry tramite l'onboarding o aggiungere `models.providers.microsoft-foundry.baseUrl`.
- `supports MAI image deployments only`: il modello di immagini selezionato fa riferimento a una
  distribuzione non MAI. Utilizzare un modello di immagini MAI distribuito per `image_generate`.

<!-- openclaw-plugin-reference:manual-end -->
