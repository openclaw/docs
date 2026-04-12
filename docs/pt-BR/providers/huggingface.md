---
read_when:
    - Você quer usar o Hugging Face Inference com o OpenClaw
    - Você precisa da variável de ambiente do token HF ou da opção de autenticação da CLI
summary: Configuração do Hugging Face Inference (autenticação + seleção de modelo)
title: Hugging Face (Inference)
x-i18n:
    generated_at: "2026-04-12T23:31:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7787fce1acfe81adb5380ab1c7441d661d03c574da07149c037d3b6ba3c8e52a
    source_path: providers/huggingface.md
    workflow: 15
---

# Hugging Face (Inference)

[Hugging Face Inference Providers](https://huggingface.co/docs/inference-providers) oferecem conclusões de chat compatíveis com OpenAI por meio de uma única API de roteamento. Você obtém acesso a muitos modelos (DeepSeek, Llama e outros) com um único token. O OpenClaw usa o **endpoint compatível com OpenAI** (apenas conclusões de chat); para texto para imagem, embeddings ou speech, use diretamente os [clientes de inference do HF](https://huggingface.co/docs/api-inference/quicktour).

- Provider: `huggingface`
- Autenticação: `HUGGINGFACE_HUB_TOKEN` ou `HF_TOKEN` (token fine-grained com **Make calls to Inference Providers**)
- API: compatível com OpenAI (`https://router.huggingface.co/v1`)
- Cobrança: um único token HF; o [preço](https://huggingface.co/docs/inference-providers/pricing) segue as tarifas do provider com uma camada gratuita.

## Primeiros passos

<Steps>
  <Step title="Crie um token fine-grained">
    Acesse [Hugging Face Settings Tokens](https://huggingface.co/settings/tokens/new?ownUserPermissions=inference.serverless.write&tokenType=fineGrained) e crie um novo token fine-grained.

    <Warning>
    O token deve ter a permissão **Make calls to Inference Providers** habilitada, ou as solicitações à API serão rejeitadas.
    </Warning>

  </Step>
  <Step title="Execute o onboarding">
    Escolha **Hugging Face** no menu suspenso do provider e depois insira sua chave de API quando solicitado:

    ```bash
    openclaw onboard --auth-choice huggingface-api-key
    ```

  </Step>
  <Step title="Selecione um modelo padrão">
    No menu suspenso **Default Hugging Face model**, escolha o modelo que deseja. A lista é carregada da API Inference quando você tem um token válido; caso contrário, é exibida uma lista builtin. Sua escolha é salva como modelo padrão.

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
  <Step title="Verifique se o modelo está disponível">
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

Isso definirá `huggingface/deepseek-ai/DeepSeek-R1` como modelo padrão.

## IDs de modelo

As refs de modelo usam o formato `huggingface/<org>/<model>` (IDs no estilo Hub). A lista abaixo vem de **GET** `https://router.huggingface.co/v1/models`; seu catálogo pode incluir mais.

| Modelo                 | Ref (prefixe com `huggingface/`)    |
| ---------------------- | ----------------------------------- |
| DeepSeek R1            | `deepseek-ai/DeepSeek-R1`           |
| DeepSeek V3.2          | `deepseek-ai/DeepSeek-V3.2`         |
| Qwen3 8B               | `Qwen/Qwen3-8B`                     |
| Qwen2.5 7B Instruct    | `Qwen/Qwen2.5-7B-Instruct`          |
| Qwen3 32B              | `Qwen/Qwen3-32B`                    |
| Llama 3.3 70B Instruct | `meta-llama/Llama-3.3-70B-Instruct` |
| Llama 3.1 8B Instruct  | `meta-llama/Llama-3.1-8B-Instruct`  |
| GPT-OSS 120B           | `openai/gpt-oss-120b`               |
| GLM 4.7                | `zai-org/GLM-4.7`                   |
| Kimi K2.5              | `moonshotai/Kimi-K2.5`              |

<Tip>
Você pode acrescentar `:fastest` ou `:cheapest` a qualquer ID de modelo. Defina sua ordem padrão em [Inference Provider settings](https://hf.co/settings/inference-providers); consulte [Inference Providers](https://huggingface.co/docs/inference-providers) e **GET** `https://router.huggingface.co/v1/models` para ver a lista completa.
</Tip>

## Detalhes avançados

<AccordionGroup>
  <Accordion title="Descoberta de modelos e menu suspenso de onboarding">
    O OpenClaw descobre modelos chamando o **endpoint Inference diretamente**:

    ```bash
    GET https://router.huggingface.co/v1/models
    ```

    (Opcional: envie `Authorization: Bearer $HUGGINGFACE_HUB_TOKEN` ou `$HF_TOKEN` para obter a lista completa; alguns endpoints retornam um subconjunto sem autenticação.) A resposta segue o estilo OpenAI: `{ "object": "list", "data": [ { "id": "Qwen/Qwen3-8B", "owned_by": "Qwen", ... }, ... ] }`.

    Quando você configura uma chave de API do Hugging Face (via onboarding, `HUGGINGFACE_HUB_TOKEN` ou `HF_TOKEN`), o OpenClaw usa esse GET para descobrir os modelos de conclusão de chat disponíveis. Durante a **configuração interativa**, depois que você insere seu token, vê um menu suspenso **Default Hugging Face model** preenchido com essa lista (ou com o catálogo builtin se a solicitação falhar). Em runtime (por exemplo, na inicialização do Gateway), quando uma chave está presente, o OpenClaw chama novamente **GET** `https://router.huggingface.co/v1/models` para atualizar o catálogo. A lista é mesclada com um catálogo builtin (para metadados como janela de contexto e custo). Se a solicitação falhar ou nenhuma chave estiver definida, apenas o catálogo builtin será usado.

  </Accordion>

  <Accordion title="Nomes de modelo, aliases e sufixos de política">
    - **Nome vindo da API:** O nome de exibição do modelo é **hidratado a partir de GET /v1/models** quando a API retorna `name`, `title` ou `display_name`; caso contrário, ele é derivado do ID do modelo (por exemplo, `deepseek-ai/DeepSeek-R1` se torna "DeepSeek R1").
    - **Sobrescrever nome de exibição:** Você pode definir um rótulo personalizado por modelo na configuração para que ele apareça da forma que quiser na CLI e na UI:

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

    - **Sufixos de política:** Atualmente, a documentação e os helpers builtin do Hugging Face no OpenClaw tratam estes dois sufixos como variantes de política builtin:
      - **`:fastest`** — maior throughput.
      - **`:cheapest`** — menor custo por token de saída.

      Você pode adicioná-los como entradas separadas em `models.providers.huggingface.models` ou definir `model.primary` com o sufixo. Também pode definir sua ordem padrão de provider em [Inference Provider settings](https://hf.co/settings/inference-providers) (sem sufixo = usar essa ordem).

    - **Mesclagem de configuração:** Entradas existentes em `models.providers.huggingface.models` (por exemplo, em `models.json`) são mantidas quando a configuração é mesclada. Assim, qualquer `name`, `alias` ou opção de modelo personalizada que você definir ali é preservada.

  </Accordion>

  <Accordion title="Ambiente e configuração do daemon">
    Se o Gateway rodar como daemon (launchd/systemd), garanta que `HUGGINGFACE_HUB_TOKEN` ou `HF_TOKEN` esteja disponível para esse processo (por exemplo, em `~/.openclaw/.env` ou via `env.shellEnv`).

    <Note>
    O OpenClaw aceita tanto `HUGGINGFACE_HUB_TOKEN` quanto `HF_TOKEN` como aliases de variável de ambiente. Qualquer um funciona; se ambos estiverem definidos, `HUGGINGFACE_HUB_TOKEN` terá precedência.
    </Note>

  </Accordion>

  <Accordion title="Configuração: DeepSeek R1 com fallback para Qwen">
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

  <Accordion title="Configuração: Qwen com variantes cheapest e fastest">
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

  <Accordion title="Configuração: DeepSeek + Llama + GPT-OSS com aliases">
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

  <Accordion title="Configuração: vários Qwen e DeepSeek com sufixos de política">
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
  <Card title="Providers de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Visão geral de todos os providers, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/models" icon="brain">
    Como escolher e configurar modelos.
  </Card>
  <Card title="Docs do Inference Providers" href="https://huggingface.co/docs/inference-providers" icon="book">
    Documentação oficial do Hugging Face Inference Providers.
  </Card>
  <Card title="Configuração" href="/pt-BR/gateway/configuration" icon="gear">
    Referência completa de configuração.
  </Card>
</CardGroup>
