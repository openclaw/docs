---
read_when:
    - Você quer usar o Hugging Face Inference com o OpenClaw
    - Você precisa da variável de ambiente do token HF ou da opção de autenticação da CLI
summary: Configuração do Hugging Face Inference (autenticação + seleção de modelo)
title: Hugging Face (inferência)
x-i18n:
    generated_at: "2026-04-24T06:07:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 93b3049e8d42787acba12ec3ddf70603159251dae1d870047f8ffc9242f202a5
    source_path: providers/huggingface.md
    workflow: 15
---

Os [Hugging Face Inference Providers](https://huggingface.co/docs/inference-providers) oferecem chat completions compatíveis com OpenAI por meio de uma única API de roteamento. Você obtém acesso a muitos modelos (DeepSeek, Llama e mais) com um único token. O OpenClaw usa o **endpoint compatível com OpenAI** (apenas chat completions); para texto-para-imagem, embeddings ou fala, use diretamente os [clientes de inferência da HF](https://huggingface.co/docs/api-inference/quicktour).

- Provedor: `huggingface`
- Auth: `HUGGINGFACE_HUB_TOKEN` ou `HF_TOKEN` (token de granularidade fina com **Make calls to Inference Providers**)
- API: compatível com OpenAI (`https://router.huggingface.co/v1`)
- Cobrança: um único token HF; os [preços](https://huggingface.co/docs/inference-providers/pricing) seguem as tarifas do provedor com uma camada gratuita.

## Primeiros passos

<Steps>
  <Step title="Criar um token de granularidade fina">
    Vá para [Hugging Face Settings Tokens](https://huggingface.co/settings/tokens/new?ownUserPermissions=inference.serverless.write&tokenType=fineGrained) e crie um novo token de granularidade fina.

    <Warning>
    O token deve ter a permissão **Make calls to Inference Providers** habilitada, ou as requisições da API serão rejeitadas.
    </Warning>

  </Step>
  <Step title="Executar o onboarding">
    Escolha **Hugging Face** no dropdown de provedor e então informe sua chave de API quando solicitado:

    ```bash
    openclaw onboard --auth-choice huggingface-api-key
    ```

  </Step>
  <Step title="Selecionar um modelo padrão">
    No dropdown **Default Hugging Face model**, escolha o modelo que você quer. A lista é carregada da API de Inference quando você tem um token válido; caso contrário, uma lista integrada é mostrada. Sua escolha é salva como o modelo padrão.

    Você também pode definir ou alterar o modelo padrão depois na configuração:

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
  <Step title="Verificar se o modelo está disponível">
    ```bash
    openclaw models list --provider huggingface
    ```
  </Step>
</Steps>

### Configuração não interativa

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice huggingface-api-key \
  --huggingface-api-key "$HF_TOKEN"
```

Isso definirá `huggingface/deepseek-ai/DeepSeek-R1` como o modelo padrão.

## IDs de modelo

Refs de modelo usam o formato `huggingface/<org>/<model>` (IDs no estilo Hub). A lista abaixo vem de **GET** `https://router.huggingface.co/v1/models`; seu catálogo pode incluir mais.

| Modelo                 | Ref (prefixe com `huggingface/`)      |
| ---------------------- | ------------------------------------- |
| DeepSeek R1            | `deepseek-ai/DeepSeek-R1`             |
| DeepSeek V3.2          | `deepseek-ai/DeepSeek-V3.2`           |
| Qwen3 8B               | `Qwen/Qwen3-8B`                       |
| Qwen2.5 7B Instruct    | `Qwen/Qwen2.5-7B-Instruct`            |
| Qwen3 32B              | `Qwen/Qwen3-32B`                      |
| Llama 3.3 70B Instruct | `meta-llama/Llama-3.3-70B-Instruct`   |
| Llama 3.1 8B Instruct  | `meta-llama/Llama-3.1-8B-Instruct`    |
| GPT-OSS 120B           | `openai/gpt-oss-120b`                 |
| GLM 4.7                | `zai-org/GLM-4.7`                     |
| Kimi K2.5              | `moonshotai/Kimi-K2.5`                |

<Tip>
Você pode anexar `:fastest` ou `:cheapest` a qualquer ID de modelo. Defina sua ordem padrão em [Inference Provider settings](https://hf.co/settings/inference-providers); consulte [Inference Providers](https://huggingface.co/docs/inference-providers) e **GET** `https://router.huggingface.co/v1/models` para a lista completa.
</Tip>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Descoberta de modelos e dropdown do onboarding">
    O OpenClaw descobre modelos chamando diretamente o **endpoint de Inference**:

    ```bash
    GET https://router.huggingface.co/v1/models
    ```

    (Opcional: envie `Authorization: Bearer $HUGGINGFACE_HUB_TOKEN` ou `$HF_TOKEN` para a lista completa; alguns endpoints retornam um subconjunto sem autenticação.) A resposta é no estilo OpenAI: `{ "object": "list", "data": [ { "id": "Qwen/Qwen3-8B", "owned_by": "Qwen", ... }, ... ] }`.

    Quando você configura uma chave de API do Hugging Face (via onboarding, `HUGGINGFACE_HUB_TOKEN` ou `HF_TOKEN`), o OpenClaw usa esse GET para descobrir os modelos de chat completion disponíveis. Durante a **configuração interativa**, depois que você informa seu token, aparece um dropdown **Default Hugging Face model** preenchido com essa lista (ou com o catálogo integrado se a requisição falhar). Em runtime (por exemplo, na inicialização do Gateway), quando uma chave está presente, o OpenClaw chama novamente **GET** `https://router.huggingface.co/v1/models` para atualizar o catálogo. A lista é mesclada com um catálogo integrado (para metadados como janela de contexto e custo). Se a requisição falhar ou nenhuma chave estiver definida, apenas o catálogo integrado é usado.

  </Accordion>

  <Accordion title="Nomes de modelo, aliases e sufixos de política">
    - **Nome da API:** o nome de exibição do modelo é **hidratado a partir de GET /v1/models** quando a API retorna `name`, `title` ou `display_name`; caso contrário, ele é derivado do ID do modelo (por exemplo, `deepseek-ai/DeepSeek-R1` se torna "DeepSeek R1").
    - **Substituir nome de exibição:** você pode definir um rótulo personalizado por modelo na configuração para que ele apareça da forma que quiser na CLI e na UI:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1 (rápido)" },
            "huggingface/deepseek-ai/DeepSeek-R1:cheapest": { alias: "DeepSeek R1 (barato)" },
          },
        },
      },
    }
    ```

    - **Sufixos de política:** a documentação e os helpers integrados do OpenClaw para Hugging Face atualmente tratam estes dois sufixos como variantes integradas de política:
      - **`:fastest`** — maior throughput.
      - **`:cheapest`** — menor custo por token de saída.

      Você pode adicioná-los como entradas separadas em `models.providers.huggingface.models` ou definir `model.primary` com o sufixo. Você também pode definir sua ordem padrão de provedor em [Inference Provider settings](https://hf.co/settings/inference-providers) (sem sufixo = usar essa ordem).

    - **Mesclagem de configuração:** entradas existentes em `models.providers.huggingface.models` (por exemplo, em `models.json`) são mantidas quando a configuração é mesclada. Portanto, quaisquer `name`, `alias` ou opções de modelo personalizadas que você definir ali são preservadas.

  </Accordion>

  <Accordion title="Ambiente e configuração de daemon">
    Se o Gateway estiver em execução como daemon (launchd/systemd), certifique-se de que `HUGGINGFACE_HUB_TOKEN` ou `HF_TOKEN` esteja disponível para esse processo (por exemplo, em `~/.openclaw/.env` ou via `env.shellEnv`).

    <Note>
    O OpenClaw aceita tanto `HUGGINGFACE_HUB_TOKEN` quanto `HF_TOKEN` como aliases de variável de ambiente. Qualquer um dos dois funciona; se ambos estiverem definidos, `HUGGINGFACE_HUB_TOKEN` tem precedência.
    </Note>

  </Accordion>

  <Accordion title="Config: DeepSeek R1 com fallback para Qwen">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "huggingface/deepseek-ai/DeepSeek-R1",
            fallbacks: ["huggingface/Qwen/Qwen3-8B"],
          },
          models: {
            "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1" },
            "huggingface/Qwen/Qwen3-8B": { alias: "Qwen3 8B" },
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Config: Qwen com variantes cheapest e fastest">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "huggingface/Qwen/Qwen3-8B" },
          models: {
            "huggingface/Qwen/Qwen3-8B": { alias: "Qwen3 8B" },
            "huggingface/Qwen/Qwen3-8B:cheapest": { alias: "Qwen3 8B (mais barato)" },
            "huggingface/Qwen/Qwen3-8B:fastest": { alias: "Qwen3 8B (mais rápido)" },
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Config: DeepSeek + Llama + GPT-OSS com aliases">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "huggingface/deepseek-ai/DeepSeek-V3.2",
            fallbacks: [
              "huggingface/meta-llama/Llama-3.3-70B-Instruct",
              "huggingface/openai/gpt-oss-120b",
            ],
          },
          models: {
            "huggingface/deepseek-ai/DeepSeek-V3.2": { alias: "DeepSeek V3.2" },
            "huggingface/meta-llama/Llama-3.3-70B-Instruct": { alias: "Llama 3.3 70B" },
            "huggingface/openai/gpt-oss-120b": { alias: "GPT-OSS 120B" },
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Config: Vários Qwen e DeepSeek com sufixos de política">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "huggingface/Qwen/Qwen2.5-7B-Instruct:cheapest" },
          models: {
            "huggingface/Qwen/Qwen2.5-7B-Instruct": { alias: "Qwen2.5 7B" },
            "huggingface/Qwen/Qwen2.5-7B-Instruct:cheapest": { alias: "Qwen2.5 7B (barato)" },
            "huggingface/deepseek-ai/DeepSeek-R1:fastest": { alias: "DeepSeek R1 (rápido)" },
            "huggingface/meta-llama/Llama-3.1-8B-Instruct": { alias: "Llama 3.1 8B" },
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Visão geral de todos os provedores, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/models" icon="brain">
    Como escolher e configurar modelos.
  </Card>
  <Card title="Documentação de Inference Providers" href="https://huggingface.co/docs/inference-providers" icon="book">
    Documentação oficial do Hugging Face Inference Providers.
  </Card>
  <Card title="Configuração" href="/pt-BR/gateway/configuration" icon="gear">
    Referência completa de configuração.
  </Card>
</CardGroup>
