---
read_when:
    - Você quer usar o Hugging Face Inference com o OpenClaw
    - Você precisa da variável de ambiente do token do HF ou da opção de autenticação da CLI
summary: Configuração do Hugging Face Inference (autenticação + seleção de modelo)
title: Hugging Face (inferência)
x-i18n:
    generated_at: "2026-07-12T15:33:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c4e0d98c844c053484559254a0bdf4258c3d39954ac5804cdb0d081a651b89df
    source_path: providers/huggingface.md
    workflow: 16
---

[Hugging Face Inference Providers](https://huggingface.co/docs/inference-providers) disponibiliza um roteador de conclusões de chat compatível com a OpenAI para muitos modelos hospedados (DeepSeek, Llama e outros) usando um único token. O OpenClaw se comunica **apenas com o endpoint de conclusões de chat**; para texto para imagem, embeddings ou fala, use diretamente os [clientes de inferência da HF](https://huggingface.co/docs/api-inference/quicktour).

| Propriedade          | Valor                                                                                                                               |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| ID do provedor       | `huggingface`                                                                                                                       |
| Plugin               | incluído (ativado por padrão, sem etapa de instalação)                                                                              |
| Variável de ambiente de autenticação | `HUGGINGFACE_HUB_TOKEN` ou `HF_TOKEN` (token de granularidade fina)                                                |
| API                  | compatível com a OpenAI (`https://router.huggingface.co/v1`)                                                                        |
| Cobrança             | Um único token da HF; os [preços](https://huggingface.co/docs/inference-providers/pricing) seguem as tarifas do provedor, com uma faixa gratuita |

## Primeiros passos

<Steps>
  <Step title="Criar um token de granularidade fina">
    Acesse [Hugging Face Settings Tokens](https://huggingface.co/settings/tokens/new?ownUserPermissions=inference.serverless.write&tokenType=fineGrained) e crie um novo token de granularidade fina.

    <Warning>
    O token deve ter a permissão **Make calls to Inference Providers** ativada, ou as solicitações à API serão rejeitadas.
    </Warning>

  </Step>
  <Step title="Executar a integração inicial">
    Escolha **Hugging Face** na lista suspensa de provedores e insira sua chave de API quando solicitado:

    ```bash
    openclaw onboard --auth-choice huggingface-api-key
    ```

  </Step>
  <Step title="Selecionar um modelo padrão">
    Na lista suspensa **Default Hugging Face model**, escolha um modelo. A lista é carregada pela API de inferência quando seu token é válido; caso contrário, o OpenClaw mostra o catálogo integrado abaixo. Sua escolha é salva como `agents.defaults.model.primary`:

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

Define `huggingface/deepseek-ai/DeepSeek-R1` como o modelo padrão.

## IDs de modelos

As referências de modelos usam o formato `huggingface/<org>/<model>` (IDs no estilo do Hub). Catálogo integrado do OpenClaw:

| Modelo                       | Referência (com o prefixo `huggingface/`) |
| ---------------------------- | ----------------------------------------- |
| DeepSeek R1                  | `deepseek-ai/DeepSeek-R1`                 |
| DeepSeek V3.1                | `deepseek-ai/DeepSeek-V3.1`               |
| GPT-OSS 120B                 | `openai/gpt-oss-120b`                     |
| Llama 3.3 70B Instruct Turbo | `meta-llama/Llama-3.3-70B-Instruct-Turbo` |

<Tip>
Quando seu token é válido, o OpenClaw também descobre qualquer outro modelo por meio de **GET** `https://router.huggingface.co/v1/models` durante a integração inicial e a inicialização do Gateway, portanto seu catálogo pode incluir muito mais do que os quatro modelos acima. Você pode acrescentar `:fastest` ou `:cheapest` a qualquer ID de modelo; o roteador da HF direciona a solicitação ao provedor de inferência correspondente. Defina a ordem padrão dos provedores em [Inference Provider settings](https://hf.co/settings/inference-providers).
</Tip>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Descoberta de modelos e lista suspensa da integração inicial">
    O OpenClaw descobre modelos com:

    ```bash
    GET https://router.huggingface.co/v1/models
    Authorization: Bearer $HUGGINGFACE_HUB_TOKEN   # or $HF_TOKEN
    ```

    A resposta segue o estilo da OpenAI: `{ "object": "list", "data": [ { "id": "Qwen/Qwen3-8B", "owned_by": "Qwen", ... }, ... ] }`.

    Com uma chave configurada (pela integração inicial, por `HUGGINGFACE_HUB_TOKEN` ou por `HF_TOKEN`), a lista suspensa **Default Hugging Face model** durante a configuração interativa é preenchida por esse endpoint. A inicialização do Gateway repete a mesma chamada para atualizar o catálogo. Os modelos descobertos são mesclados com o catálogo integrado acima (usado para metadados como janela de contexto e custo quando um ID corresponde). Se a solicitação falhar, não retornar dados ou nenhuma chave estiver definida, o OpenClaw recorrerá apenas ao catálogo integrado.

    Desative a descoberta sem remover o provedor:

    ```bash
    openclaw config set plugins.entries.huggingface.config.discovery.enabled false
    ```

  </Accordion>

  <Accordion title="Nomes de modelos, aliases e sufixos de política">
    - **Nome da API:** os modelos descobertos usam o `name`, `title` ou `display_name` da API quando disponível; caso contrário, o OpenClaw deriva um nome do ID do modelo (por exemplo, `deepseek-ai/DeepSeek-R1` se torna "DeepSeek R1").
    - **Substituir o nome de exibição:** defina um rótulo personalizado para cada modelo na configuração:

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

    - **Sufixos de política:** `:fastest` e `:cheapest` são convenções do roteador da HF, não algo que o OpenClaw reescreve: o sufixo é enviado literalmente como parte do ID do modelo, e o roteador da HF escolhe o provedor de inferência correspondente. Adicione cada variante como sua própria entrada em `models.providers.huggingface.models` (ou em `model.primary`) se quiser um alias distinto para cada sufixo.
    - **Mesclagem da configuração:** as entradas existentes em `models.providers.huggingface.models` (por exemplo, em `models.json`) são mantidas durante a mesclagem da configuração, portanto qualquer `name`, `alias` ou opção de modelo personalizada definida ali persiste após reinicializações.

  </Accordion>

  <Accordion title="Configuração do ambiente e do daemon">
    Se o Gateway for executado como um daemon (launchd/systemd), certifique-se de que `HUGGINGFACE_HUB_TOKEN` ou `HF_TOKEN` esteja disponível para esse processo (por exemplo, em `~/.openclaw/.env` ou por meio de `env.shellEnv`).

    <Note>
    O OpenClaw aceita tanto `HUGGINGFACE_HUB_TOKEN` quanto `HF_TOKEN`. Se ambos estiverem definidos, `HUGGINGFACE_HUB_TOKEN` terá precedência.
    </Note>

  </Accordion>

  <Accordion title="Configuração: DeepSeek R1 com fallback">
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

  <Accordion title="Configuração: DeepSeek com variantes mais barata e mais rápida">
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

  <Accordion title="Configuração: DeepSeek + Llama + GPT-OSS com aliases">
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

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelos" href="/pt-BR/concepts/model-providers" icon="layers">
    Visão geral de todos os provedores, referências de modelos e comportamento de failover.
  </Card>
  <Card title="Seleção de modelos" href="/pt-BR/concepts/models" icon="brain">
    Como escolher e configurar modelos.
  </Card>
  <Card title="Documentação dos provedores de inferência" href="https://huggingface.co/docs/inference-providers" icon="book">
    Documentação oficial do Hugging Face Inference Providers.
  </Card>
  <Card title="Configuração" href="/pt-BR/gateway/configuration" icon="gear">
    Referência completa da configuração.
  </Card>
</CardGroup>
