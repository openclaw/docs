---
read_when:
    - Vuoi una singola chiave API per molti LLM
    - Vuoi eseguire modelli tramite OpenRouter in OpenClaw
    - Vuoi usare OpenRouter per la generazione di immagini
summary: Usare l'API unificata di OpenRouter per accedere a molti modelli in OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-04-24T08:57:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7516910f67a8adfb107d07cadd73c34ddd110422ecb90278025d4d6344937aac
    source_path: providers/openrouter.md
    workflow: 15
---

OpenRouter fornisce un'**API unificata** che instrada le richieste verso molti modelli dietro un singolo
endpoint e una singola chiave API. È compatibile con OpenAI, quindi la maggior parte degli SDK OpenAI funziona semplicemente cambiando il base URL.

## Per iniziare

<Steps>
  <Step title="Ottieni la tua chiave API">
    Crea una chiave API su [openrouter.ai/keys](https://openrouter.ai/keys).
  </Step>
  <Step title="Esegui l'onboarding">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="(Facoltativo) Passa a un modello specifico">
    L'onboarding usa come predefinito `openrouter/auto`. In seguito puoi scegliere un modello concreto:

    ```bash
    openclaw models set openrouter/<provider>/<model>
    ```

  </Step>
</Steps>

## Esempio di configurazione

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/auto" },
    },
  },
}
```

## Riferimenti ai modelli

<Note>
I riferimenti ai modelli seguono il pattern `openrouter/<provider>/<model>`. Per l'elenco completo di
provider e modelli disponibili, vedi [/concepts/model-providers](/it/concepts/model-providers).
</Note>

Esempi di fallback inclusi:

| Riferimento modello                    | Note                          |
| -------------------------------------- | ----------------------------- |
| `openrouter/auto`                      | Instradamento automatico OpenRouter |
| `openrouter/moonshotai/kimi-k2.6`      | Kimi K2.6 via MoonshotAI      |
| `openrouter/openrouter/healer-alpha`   | Rotta OpenRouter Healer Alpha |
| `openrouter/openrouter/hunter-alpha`   | Rotta OpenRouter Hunter Alpha |

## Generazione di immagini

OpenRouter può anche supportare lo strumento `image_generate`. Usa un modello immagine OpenRouter sotto `agents.defaults.imageGenerationModel`:

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openrouter/google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

OpenClaw invia le richieste di immagini all'API image di chat completions di OpenRouter con `modalities: ["image", "text"]`. I modelli immagine Gemini ricevono i suggerimenti supportati di `aspectRatio` e `resolution` tramite `image_config` di OpenRouter.

## Autenticazione e header

OpenRouter usa internamente un Bearer token con la tua chiave API.

Sulle richieste reali OpenRouter (`https://openrouter.ai/api/v1`), OpenClaw aggiunge anche
gli header di attribuzione dell'app documentati da OpenRouter:

| Header                    | Value                 |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
Se reindirizzi il provider OpenRouter verso un altro proxy o base URL, OpenClaw
**non** inietta quegli header specifici di OpenRouter né i marker di cache Anthropic.
</Warning>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Marker di cache Anthropic">
    Su rotte OpenRouter verificate, i riferimenti ai modelli Anthropic mantengono i
    marker `cache_control` specifici di Anthropic/OpenRouter che OpenClaw usa per
    migliorare il riutilizzo della prompt-cache sui blocchi di prompt system/developer.
  </Accordion>

  <Accordion title="Iniezione di thinking / reasoning">
    Sulle rotte supportate non `auto`, OpenClaw mappa il livello di thinking selezionato nei
    payload di reasoning del proxy OpenRouter. Suggerimenti di modello non supportati e
    `openrouter/auto` saltano quell'iniezione di reasoning.
  </Accordion>

  <Accordion title="Model shaping solo OpenAI">
    OpenRouter continua a passare attraverso il percorso compatibile con OpenAI in stile proxy, quindi
    il request shaping nativo solo-OpenAI come `serviceTier`, `store` di Responses,
    payload di compatibilità OpenAI per il reasoning e suggerimenti di prompt-cache non vengono inoltrati.
  </Accordion>

  <Accordion title="Rotte basate su Gemini">
    I riferimenti OpenRouter supportati da Gemini restano sul percorso proxy-Gemini: OpenClaw mantiene
    lì la sanitizzazione della thought-signature di Gemini, ma non abilita la validazione nativa di replay di Gemini né le riscritture di bootstrap.
  </Accordion>

  <Accordion title="Metadati di instradamento del provider">
    Se passi l'instradamento del provider OpenRouter sotto i parametri del modello, OpenClaw lo inoltra
    come metadati di instradamento OpenRouter prima che entrino in funzione i wrapper di streaming condivisi.
  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, riferimenti ai modelli e comportamento di failover.
  </Card>
  <Card title="Riferimento della configurazione" href="/it/gateway/configuration-reference" icon="gear">
    Riferimento completo della configurazione per agenti, modelli e provider.
  </Card>
</CardGroup>
