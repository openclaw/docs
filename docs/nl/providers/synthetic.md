---
read_when:
    - Je wilt Synthetic als modelprovider gebruiken
    - Je hebt een Synthetic API-sleutel of basis-URL-configuratie nodig
summary: Gebruik de Anthropic-compatibele API van Synthetic in OpenClaw
title: Synthetisch
x-i18n:
    generated_at: "2026-04-29T23:13:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 81a48573782d46f0b018d19ab607729b236c241e57535e4af52eb8c142fee59b
    source_path: providers/synthetic.md
    workflow: 16
---

[Synthetic](https://synthetic.new) biedt Anthropic-compatibele eindpunten.
OpenClaw registreert dit als de `synthetic`-provider en gebruikt de Anthropic
Messages API.

| Eigenschap    | Waarde                                |
| ------------- | ------------------------------------- |
| Provider      | `synthetic`                           |
| Authenticatie | `SYNTHETIC_API_KEY`                   |
| API           | Anthropic Messages                    |
| Basis-URL     | `https://api.synthetic.new/anthropic` |

## Aan de slag

<Steps>
  <Step title="Een API-sleutel ophalen">
    Haal een `SYNTHETIC_API_KEY` op uit je Synthetic-account, of laat de
    onboardingwizard je erom vragen.
  </Step>
  <Step title="Onboarding uitvoeren">
    ```bash
    openclaw onboard --auth-choice synthetic-api-key
    ```
  </Step>
  <Step title="Het standaardmodel verifiëren">
    Na onboarding wordt het standaardmodel ingesteld op:
    ```
    synthetic/hf:MiniMaxAI/MiniMax-M2.5
    ```
  </Step>
</Steps>

<Warning>
De Anthropic-client van OpenClaw voegt automatisch `/v1` toe aan de basis-URL, dus gebruik
`https://api.synthetic.new/anthropic` (niet `/anthropic/v1`). Als Synthetic
de basis-URL wijzigt, overschrijf dan `models.providers.synthetic.baseUrl`.
</Warning>

## Configuratievoorbeeld

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

## Ingebouwde catalogus

Alle Synthetic-modellen gebruiken kosten `0` (invoer/uitvoer/cache).

| Model-ID                                               | Contextvenster | Max. tokens | Redeneren | Invoer          |
| ------------------------------------------------------ | -------------- | ----------- | --------- | --------------- |
| `hf:MiniMaxAI/MiniMax-M2.5`                            | 192,000        | 65,536      | nee       | tekst           |
| `hf:moonshotai/Kimi-K2-Thinking`                       | 256,000        | 8,192       | ja        | tekst           |
| `hf:zai-org/GLM-4.7`                                   | 198,000        | 128,000     | nee       | tekst           |
| `hf:deepseek-ai/DeepSeek-R1-0528`                      | 128,000        | 8,192       | nee       | tekst           |
| `hf:deepseek-ai/DeepSeek-V3-0324`                      | 128,000        | 8,192       | nee       | tekst           |
| `hf:deepseek-ai/DeepSeek-V3.1`                         | 128,000        | 8,192       | nee       | tekst           |
| `hf:deepseek-ai/DeepSeek-V3.1-Terminus`                | 128,000        | 8,192       | nee       | tekst           |
| `hf:deepseek-ai/DeepSeek-V3.2`                         | 159,000        | 8,192       | nee       | tekst           |
| `hf:meta-llama/Llama-3.3-70B-Instruct`                 | 128,000        | 8,192       | nee       | tekst           |
| `hf:meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | 524,000        | 8,192       | nee       | tekst           |
| `hf:moonshotai/Kimi-K2-Instruct-0905`                  | 256,000        | 8,192       | nee       | tekst           |
| `hf:moonshotai/Kimi-K2.5`                              | 256,000        | 8,192       | ja        | tekst + beeld   |
| `hf:openai/gpt-oss-120b`                               | 128,000        | 8,192       | nee       | tekst           |
| `hf:Qwen/Qwen3-235B-A22B-Instruct-2507`                | 256,000        | 8,192       | nee       | tekst           |
| `hf:Qwen/Qwen3-Coder-480B-A35B-Instruct`               | 256,000        | 8,192       | nee       | tekst           |
| `hf:Qwen/Qwen3-VL-235B-A22B-Instruct`                  | 250,000        | 8,192       | nee       | tekst + beeld   |
| `hf:zai-org/GLM-4.5`                                   | 128,000        | 128,000     | nee       | tekst           |
| `hf:zai-org/GLM-4.6`                                   | 198,000        | 128,000     | nee       | tekst           |
| `hf:zai-org/GLM-5`                                     | 256,000        | 128,000     | ja        | tekst + beeld   |
| `hf:deepseek-ai/DeepSeek-V3`                           | 128,000        | 8,192       | nee       | tekst           |
| `hf:Qwen/Qwen3-235B-A22B-Thinking-2507`                | 256,000        | 8,192       | ja        | tekst           |

<Tip>
Modelverwijzingen gebruiken de vorm `synthetic/<modelId>`. Gebruik
`openclaw models list --provider synthetic` om alle modellen te zien die beschikbaar zijn voor je
account.
</Tip>

<AccordionGroup>
  <Accordion title="Toegestane modellenlijst">
    Als je een toegestane modellenlijst (`agents.defaults.models`) inschakelt, voeg dan elk
    Synthetic-model toe dat je wilt gebruiken. Modellen die niet in de toegestane lijst staan, worden verborgen
    voor de agent.
  </Accordion>

  <Accordion title="Basis-URL overschrijven">
    Als Synthetic het API-eindpunt wijzigt, overschrijf dan de basis-URL in je configuratie:

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

    Onthoud dat OpenClaw automatisch `/v1` toevoegt.

  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providerregels, modelverwijzingen en failovergedrag.
  </Card>
  <Card title="Configuratiereferentie" href="/nl/gateway/configuration-reference" icon="gear">
    Volledig configuratieschema inclusief providerinstellingen.
  </Card>
  <Card title="Synthetic" href="https://synthetic.new" icon="arrow-up-right-from-square">
    Synthetic-dashboard en API-documentatie.
  </Card>
</CardGroup>
