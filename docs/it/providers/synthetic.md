---
read_when:
    - Vuoi usare Synthetic come provider di modelli
    - È necessario configurare una chiave API Synthetic o un URL di base
summary: Usa l'API compatibile con Anthropic di Synthetic in OpenClaw
title: Sintetico
x-i18n:
    generated_at: "2026-07-12T07:29:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f1882a34aa1ca52403b92effdbf3b753fd911575af6d8b8aa5d692245b8e8f1b
    source_path: providers/synthetic.md
    workflow: 16
---

[Synthetic](https://synthetic.new) espone endpoint compatibili con Anthropic.
OpenClaw lo include come provider `synthetic` e utilizza l'API Anthropic
Messages.

| Proprietà    | Valore                                |
| ------------ | ------------------------------------- |
| Provider     | `synthetic`                           |
| Autenticazione | `SYNTHETIC_API_KEY`                 |
| API          | Anthropic Messages                    |
| URL di base  | `https://api.synthetic.new/anthropic` |

## Introduzione

<Steps>
  <Step title="Ottieni una chiave API">
    Ottieni una `SYNTHETIC_API_KEY` dal tuo account Synthetic oppure lascia che la procedura di configurazione
    te ne richieda una.
  </Step>
  <Step title="Esegui la configurazione">
    ```bash
    openclaw onboard --auth-choice synthetic-api-key
    ```
  </Step>
  <Step title="Verifica il modello predefinito">
    La procedura di configurazione imposta come predefinito il modello:
    ```text
    synthetic/hf:MiniMaxAI/MiniMax-M2.5
    ```
  </Step>
</Steps>

<Warning>
Il client Anthropic di OpenClaw aggiunge automaticamente `/v1` all'URL di base, quindi usa
`https://api.synthetic.new/anthropic` (non `/anthropic/v1`). Se Synthetic
modifica il proprio URL di base, sovrascrivi `models.providers.synthetic.baseUrl`.
</Warning>

## Esempio di configurazione

```json5
{
  env: { SYNTHETIC_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
      models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "hf:MiniMaxAI/MiniMax-M2.5",
            name: "MiniMax M2.5",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 192000,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

## Catalogo integrato

Tutti i modelli Synthetic hanno costo `0` (input/output/cache).

| ID modello                                             | Finestra di contesto | Token massimi | Ragionamento | Input             |
| ------------------------------------------------------ | -------------------- | ------------- | ------------ | ----------------- |
| `hf:MiniMaxAI/MiniMax-M2.5`                            | 192,000              | 65,536        | no           | testo             |
| `hf:moonshotai/Kimi-K2-Thinking`                       | 256,000              | 8,192         | sì           | testo             |
| `hf:zai-org/GLM-4.7`                                   | 198,000              | 128,000       | no           | testo             |
| `hf:deepseek-ai/DeepSeek-R1-0528`                      | 128,000              | 8,192         | no           | testo             |
| `hf:deepseek-ai/DeepSeek-V3-0324`                      | 128,000              | 8,192         | no           | testo             |
| `hf:deepseek-ai/DeepSeek-V3.1`                         | 128,000              | 8,192         | no           | testo             |
| `hf:deepseek-ai/DeepSeek-V3.1-Terminus`                | 128,000              | 8,192         | no           | testo             |
| `hf:deepseek-ai/DeepSeek-V3.2`                         | 159,000              | 8,192         | no           | testo             |
| `hf:meta-llama/Llama-3.3-70B-Instruct`                 | 128,000              | 8,192         | no           | testo             |
| `hf:meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | 524,000              | 8,192         | no           | testo             |
| `hf:moonshotai/Kimi-K2-Instruct-0905`                  | 256,000              | 8,192         | no           | testo             |
| `hf:moonshotai/Kimi-K2.5`                              | 256,000              | 8,192         | sì           | testo + immagine  |
| `hf:openai/gpt-oss-120b`                               | 128,000              | 8,192         | no           | testo             |
| `hf:Qwen/Qwen3-235B-A22B-Instruct-2507`                | 256,000              | 8,192         | no           | testo             |
| `hf:Qwen/Qwen3-Coder-480B-A35B-Instruct`               | 256,000              | 8,192         | no           | testo             |
| `hf:Qwen/Qwen3-VL-235B-A22B-Instruct`                  | 250,000              | 8,192         | no           | testo + immagine  |
| `hf:zai-org/GLM-4.5`                                   | 128,000              | 128,000       | no           | testo             |
| `hf:zai-org/GLM-4.6`                                   | 198,000              | 128,000       | no           | testo             |
| `hf:zai-org/GLM-5`                                     | 256,000              | 128,000       | sì           | testo + immagine  |
| `hf:deepseek-ai/DeepSeek-V3`                           | 128,000              | 8,192         | no           | testo             |
| `hf:Qwen/Qwen3-235B-A22B-Thinking-2507`                | 256,000              | 8,192         | sì           | testo             |

<Tip>
I riferimenti ai modelli usano il formato `synthetic/<modelId>`. Usa
`openclaw models list --provider synthetic` per visualizzare tutti i modelli disponibili nel tuo
account.
</Tip>

<AccordionGroup>
  <Accordion title="Elenco dei modelli consentiti">
    Se abiliti un elenco di modelli consentiti (`agents.defaults.models`), aggiungi ogni
    modello Synthetic che prevedi di utilizzare. I modelli non presenti nell'elenco vengono nascosti
    all'agente.
  </Accordion>

  <Accordion title="Sovrascrittura dell'URL di base">
    Se Synthetic modifica il proprio endpoint API, sovrascrivi l'URL di base:

    ```json5
    {
      models: {
        providers: {
          synthetic: {
            baseUrl: "https://new-api.synthetic.new/anthropic",
          },
        },
      },
    }
    ```

    OpenClaw continua ad aggiungere automaticamente `/v1`.

  </Accordion>
</AccordionGroup>

## Contenuti correlati

<CardGroup cols={2}>
  <Card title="Provider di modelli" href="/it/concepts/model-providers" icon="layers">
    Regole dei provider, riferimenti ai modelli e comportamento di failover.
  </Card>
  <Card title="Riferimento per la configurazione" href="/it/gateway/configuration-reference" icon="gear">
    Schema di configurazione completo, incluse le impostazioni dei provider.
  </Card>
  <Card title="Synthetic" href="https://synthetic.new" icon="arrow-up-right-from-square">
    Dashboard e documentazione API di Synthetic.
  </Card>
</CardGroup>
