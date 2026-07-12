---
read_when:
    - Chcesz używać Synthetic jako dostawcy modeli
    - Potrzebujesz klucza API Synthetic lub konfiguracji bazowego adresu URL
summary: Używaj interfejsu API Synthetic zgodnego z Anthropic w OpenClaw
title: Syntetyczny
x-i18n:
    generated_at: "2026-07-12T15:36:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f1882a34aa1ca52403b92effdbf3b753fd911575af6d8b8aa5d692245b8e8f1b
    source_path: providers/synthetic.md
    workflow: 16
---

[Synthetic](https://synthetic.new) udostępnia punkty końcowe zgodne z Anthropic.
OpenClaw zawiera go jako dostawcę `synthetic` i korzysta z interfejsu API
Anthropic Messages.

| Właściwość  | Wartość                               |
| ------------ | ------------------------------------- |
| Dostawca     | `synthetic`                           |
| Uwierzytelnianie | `SYNTHETIC_API_KEY`               |
| API          | Anthropic Messages                    |
| Bazowy URL   | `https://api.synthetic.new/anthropic` |

## Pierwsze kroki

<Steps>
  <Step title="Uzyskaj klucz API">
    Uzyskaj `SYNTHETIC_API_KEY` ze swojego konta Synthetic lub pozwól, aby proces konfiguracji
    poprosił Cię o jego podanie.
  </Step>
  <Step title="Uruchom konfigurację">
    ```bash
    openclaw onboard --auth-choice synthetic-api-key
    ```
  </Step>
  <Step title="Sprawdź model domyślny">
    Proces konfiguracji ustawia jako model domyślny:
    ```text
    synthetic/hf:MiniMaxAI/MiniMax-M2.5
    ```
  </Step>
</Steps>

<Warning>
Klient Anthropic w OpenClaw automatycznie dołącza `/v1` do bazowego adresu URL, dlatego użyj
`https://api.synthetic.new/anthropic` (a nie `/anthropic/v1`). Jeśli Synthetic
zmieni bazowy adres URL, zastąp wartość `models.providers.synthetic.baseUrl`.
</Warning>

## Przykład konfiguracji

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

## Wbudowany katalog

Wszystkie modele Synthetic mają koszt `0` (wejście/wyjście/pamięć podręczna).

| Identyfikator modelu                                   | Okno kontekstu | Maks. liczba tokenów | Rozumowanie | Dane wejściowe |
| ------------------------------------------------------ | -------------- | -------------------- | ----------- | -------------- |
| `hf:MiniMaxAI/MiniMax-M2.5`                            | 192,000        | 65,536               | nie         | tekst          |
| `hf:moonshotai/Kimi-K2-Thinking`                       | 256,000        | 8,192                | tak         | tekst          |
| `hf:zai-org/GLM-4.7`                                   | 198,000        | 128,000              | nie         | tekst          |
| `hf:deepseek-ai/DeepSeek-R1-0528`                      | 128,000        | 8,192                | nie         | tekst          |
| `hf:deepseek-ai/DeepSeek-V3-0324`                      | 128,000        | 8,192                | nie         | tekst          |
| `hf:deepseek-ai/DeepSeek-V3.1`                         | 128,000        | 8,192                | nie         | tekst          |
| `hf:deepseek-ai/DeepSeek-V3.1-Terminus`                | 128,000        | 8,192                | nie         | tekst          |
| `hf:deepseek-ai/DeepSeek-V3.2`                         | 159,000        | 8,192                | nie         | tekst          |
| `hf:meta-llama/Llama-3.3-70B-Instruct`                 | 128,000        | 8,192                | nie         | tekst          |
| `hf:meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | 524,000        | 8,192                | nie         | tekst          |
| `hf:moonshotai/Kimi-K2-Instruct-0905`                  | 256,000        | 8,192                | nie         | tekst          |
| `hf:moonshotai/Kimi-K2.5`                              | 256,000        | 8,192                | tak         | tekst + obraz  |
| `hf:openai/gpt-oss-120b`                               | 128,000        | 8,192                | nie         | tekst          |
| `hf:Qwen/Qwen3-235B-A22B-Instruct-2507`                | 256,000        | 8,192                | nie         | tekst          |
| `hf:Qwen/Qwen3-Coder-480B-A35B-Instruct`               | 256,000        | 8,192                | nie         | tekst          |
| `hf:Qwen/Qwen3-VL-235B-A22B-Instruct`                  | 250,000        | 8,192                | nie         | tekst + obraz  |
| `hf:zai-org/GLM-4.5`                                   | 128,000        | 128,000              | nie         | tekst          |
| `hf:zai-org/GLM-4.6`                                   | 198,000        | 128,000              | nie         | tekst          |
| `hf:zai-org/GLM-5`                                     | 256,000        | 128,000              | tak         | tekst + obraz  |
| `hf:deepseek-ai/DeepSeek-V3`                           | 128,000        | 8,192                | nie         | tekst          |
| `hf:Qwen/Qwen3-235B-A22B-Thinking-2507`                | 256,000        | 8,192                | tak         | tekst          |

<Tip>
Odwołania do modeli mają postać `synthetic/<modelId>`. Użyj polecenia
`openclaw models list --provider synthetic`, aby wyświetlić wszystkie modele dostępne na Twoim
koncie.
</Tip>

<AccordionGroup>
  <Accordion title="Lista dozwolonych modeli">
    Jeśli włączysz listę dozwolonych modeli (`agents.defaults.models`), dodaj każdy
    model Synthetic, którego planujesz używać. Modele spoza listy dozwolonych są ukryte
    przed agentem.
  </Accordion>

  <Accordion title="Zastępowanie bazowego adresu URL">
    Jeśli Synthetic zmieni swój punkt końcowy API, zastąp bazowy adres URL:

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

    OpenClaw nadal automatycznie dołącza `/v1`.

  </Accordion>
</AccordionGroup>

## Powiązane materiały

<CardGroup cols={2}>
  <Card title="Dostawcy modeli" href="/pl/concepts/model-providers" icon="layers">
    Reguły dostawców, odwołania do modeli i działanie mechanizmu przełączania awaryjnego.
  </Card>
  <Card title="Dokumentacja konfiguracji" href="/pl/gateway/configuration-reference" icon="gear">
    Pełny schemat konfiguracji, w tym ustawienia dostawców.
  </Card>
  <Card title="Synthetic" href="https://synthetic.new" icon="arrow-up-right-from-square">
    Panel Synthetic i dokumentacja API.
  </Card>
</CardGroup>
