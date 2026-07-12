---
read_when:
    - Vuoi usare Hugging Face Inference con OpenClaw
    - È necessaria la variabile d'ambiente del token HF oppure l'opzione di autenticazione della CLI
summary: Configurazione di Hugging Face Inference (autenticazione + selezione del modello)
title: Hugging Face (inferenza)
x-i18n:
    generated_at: "2026-07-12T07:27:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4e0d98c844c053484559254a0bdf4258c3d39954ac5804cdb0d081a651b89df
    source_path: providers/huggingface.md
    workflow: 16
---

[Hugging Face Inference Providers](https://huggingface.co/docs/inference-providers) espone un router per completamenti chat compatibile con OpenAI davanti a numerosi modelli ospitati (DeepSeek, Llama e altri), accessibili con un unico token. OpenClaw comunica **esclusivamente con l'endpoint dei completamenti chat**; per la conversione da testo a immagine, gli embedding o la sintesi vocale, usa direttamente i [client di inferenza HF](https://huggingface.co/docs/api-inference/quicktour).

| Proprietà              | Valore                                                                                                                                    |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| ID del provider        | `huggingface`                                                                                                                             |
| Plugin                 | incluso (abilitato per impostazione predefinita, nessun passaggio di installazione)                                                       |
| Variabile di ambiente per l'autenticazione | `HUGGINGFACE_HUB_TOKEN` o `HF_TOKEN` (token granulare)                                                                  |
| API                    | Compatibile con OpenAI (`https://router.huggingface.co/v1`)                                                                               |
| Fatturazione           | Un unico token HF; i [prezzi](https://huggingface.co/docs/inference-providers/pricing) seguono le tariffe del provider con un piano gratuito |

## Per iniziare

<Steps>
  <Step title="Crea un token granulare">
    Vai a [Hugging Face Settings Tokens](https://huggingface.co/settings/tokens/new?ownUserPermissions=inference.serverless.write&tokenType=fineGrained) e crea un nuovo token granulare.

    <Warning>
    Il token deve avere abilitata l'autorizzazione **Make calls to Inference Providers**, altrimenti le richieste API verranno rifiutate.
    </Warning>

  </Step>
  <Step title="Esegui la configurazione iniziale">
    Scegli **Hugging Face** nell'elenco a discesa dei provider, quindi inserisci la chiave API quando richiesto:

    ```bash
    openclaw onboard --auth-choice huggingface-api-key
    ```

  </Step>
  <Step title="Seleziona un modello predefinito">
    Nell'elenco a discesa **Default Hugging Face model**, scegli un modello. L'elenco viene caricato dall'Inference API quando il token è valido; in caso contrario, OpenClaw mostra il catalogo integrato riportato di seguito. La scelta viene salvata come `agents.defaults.model.primary`:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "huggingface/deepseek-ai/DeepSeek-R1" },
        },
      },
    }
    ```

  </Step>
  <Step title="Verifica che il modello sia disponibile">
    ```bash
    openclaw models list --provider huggingface
    ```
  </Step>
</Steps>

### Configurazione non interattiva

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice huggingface-api-key \
  --huggingface-api-key "$HF_TOKEN"
```

Imposta `huggingface/deepseek-ai/DeepSeek-R1` come modello predefinito.

## ID dei modelli

I riferimenti ai modelli usano il formato `huggingface/<org>/<model>` (ID in stile Hub). Catalogo integrato di OpenClaw:

| Modello                      | Riferimento (con prefisso `huggingface/`)  |
| ---------------------------- | ------------------------------------------ |
| DeepSeek R1                  | `deepseek-ai/DeepSeek-R1`                  |
| DeepSeek V3.1                | `deepseek-ai/DeepSeek-V3.1`                |
| GPT-OSS 120B                 | `openai/gpt-oss-120b`                      |
| Llama 3.3 70B Instruct Turbo | `meta-llama/Llama-3.3-70B-Instruct-Turbo`  |

<Tip>
Quando il token è valido, durante la configurazione iniziale e all'avvio del Gateway OpenClaw rileva anche qualsiasi altro modello tramite **GET** `https://router.huggingface.co/v1/models`, perciò il catalogo può includere molti più modelli dei quattro elencati sopra. Puoi aggiungere `:fastest` o `:cheapest` a qualsiasi ID modello; il router di HF instrada la richiesta verso il provider di inferenza corrispondente. Imposta l'ordine predefinito dei provider nelle [impostazioni dei provider di inferenza](https://hf.co/settings/inference-providers).
</Tip>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Rilevamento dei modelli ed elenco a discesa della configurazione iniziale">
    OpenClaw rileva i modelli tramite:

    ```bash
    GET https://router.huggingface.co/v1/models
    Authorization: Bearer $HUGGINGFACE_HUB_TOKEN   # oppure $HF_TOKEN
    ```

    La risposta segue il formato di OpenAI: `{ "object": "list", "data": [ { "id": "Qwen/Qwen3-8B", "owned_by": "Qwen", ... }, ... ] }`.

    Con una chiave configurata (tramite la configurazione iniziale, `HUGGINGFACE_HUB_TOKEN` o `HF_TOKEN`), l'elenco a discesa **Default Hugging Face model** durante la configurazione interattiva viene popolato da questo endpoint. All'avvio, il Gateway ripete la stessa chiamata per aggiornare il catalogo. I modelli rilevati vengono uniti al catalogo integrato riportato sopra, usato per metadati quali la finestra di contesto e il costo quando un ID corrisponde. Se la richiesta non riesce, non restituisce dati o non è impostata alcuna chiave, OpenClaw utilizza esclusivamente il catalogo integrato.

    Disabilita il rilevamento senza rimuovere il provider:

    ```bash
    openclaw config set plugins.entries.huggingface.config.discovery.enabled false
    ```

  </Accordion>

  <Accordion title="Nomi e alias dei modelli e suffissi dei criteri">
    - **Nome dall'API:** i modelli rilevati usano il valore `name`, `title` o `display_name` dell'API quando presente; altrimenti OpenClaw ricava un nome dall'ID modello (ad esempio, `deepseek-ai/DeepSeek-R1` diventa "DeepSeek R1").
    - **Sostituzione del nome visualizzato:** imposta un'etichetta personalizzata per ciascun modello nella configurazione:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1 (fast)" },
            "huggingface/deepseek-ai/DeepSeek-R1:cheapest": { alias: "DeepSeek R1 (cheap)" },
          },
        },
      },
    }
    ```

    - **Suffissi dei criteri:** `:fastest` e `:cheapest` sono convenzioni del router HF e non vengono riscritti da OpenClaw: il suffisso viene inviato invariato come parte dell'ID modello e il router HF sceglie il provider di inferenza corrispondente. Aggiungi ogni variante come voce distinta in `models.providers.huggingface.models` (o in `model.primary`) se desideri un alias diverso per ciascun suffisso.
    - **Unione della configurazione:** le voci esistenti in `models.providers.huggingface.models` (ad esempio in `models.json`) vengono mantenute durante l'unione della configurazione, quindi qualsiasi valore personalizzato di `name`, `alias` o qualsiasi opzione del modello impostata in quella posizione persiste tra i riavvii.

  </Accordion>

  <Accordion title="Configurazione dell'ambiente e del daemon">
    Se il Gateway viene eseguito come daemon (launchd/systemd), assicurati che `HUGGINGFACE_HUB_TOKEN` o `HF_TOKEN` sia disponibile per tale processo, ad esempio in `~/.openclaw/.env` o tramite `env.shellEnv`.

    <Note>
    OpenClaw accetta sia `HUGGINGFACE_HUB_TOKEN` sia `HF_TOKEN`. Se sono impostati entrambi, `HUGGINGFACE_HUB_TOKEN` ha la precedenza.
    </Note>

  </Accordion>

  <Accordion title="Configurazione: DeepSeek R1 con modello alternativo">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "huggingface/deepseek-ai/DeepSeek-R1",
            fallbacks: ["huggingface/openai/gpt-oss-120b"],
          },
          models: {
            "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1" },
            "huggingface/openai/gpt-oss-120b": { alias: "GPT-OSS 120B" },
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Configurazione: DeepSeek con le varianti più economica e più veloce">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "huggingface/deepseek-ai/DeepSeek-R1" },
          models: {
            "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1" },
            "huggingface/deepseek-ai/DeepSeek-R1:cheapest": { alias: "DeepSeek R1 (cheapest)" },
            "huggingface/deepseek-ai/DeepSeek-R1:fastest": { alias: "DeepSeek R1 (fastest)" },
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Configurazione: DeepSeek + Llama + GPT-OSS con alias">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "huggingface/deepseek-ai/DeepSeek-V3.1",
            fallbacks: [
              "huggingface/meta-llama/Llama-3.3-70B-Instruct-Turbo",
              "huggingface/openai/gpt-oss-120b",
            ],
          },
          models: {
            "huggingface/deepseek-ai/DeepSeek-V3.1": { alias: "DeepSeek V3.1" },
            "huggingface/meta-llama/Llama-3.3-70B-Instruct-Turbo": { alias: "Llama 3.3 70B Turbo" },
            "huggingface/openai/gpt-oss-120b": { alias: "GPT-OSS 120B" },
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## Contenuti correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Panoramica di tutti i provider, dei riferimenti ai modelli e del comportamento di failover.
  </Card>
  <Card title="Selezione del modello" href="/it/concepts/models" icon="brain">
    Come scegliere e configurare i modelli.
  </Card>
  <Card title="Documentazione di Inference Providers" href="https://huggingface.co/docs/inference-providers" icon="book">
    Documentazione ufficiale di Hugging Face Inference Providers.
  </Card>
  <Card title="Configurazione" href="/it/gateway/configuration" icon="gear">
    Riferimento completo della configurazione.
  </Card>
</CardGroup>
