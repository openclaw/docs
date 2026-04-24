---
read_when:
    - Você quer uma única chave de API para muitos LLMs
    - Você precisa de orientação de configuração do Baidu Qianfan
summary: Use a API unificada do Qianfan para acessar muitos modelos no OpenClaw
title: Qianfan
x-i18n:
    generated_at: "2026-04-24T06:08:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 727236394f6581f5bdb2f557092c31ff7904e4a80b06f8adc07a1c51dcfb2ff1
    source_path: providers/qianfan.md
    workflow: 15
---

Qianfan é a plataforma MaaS do Baidu, oferecendo uma **API unificada** que roteia solicitações para muitos modelos atrás de um único
endpoint e uma única chave de API. Ela é compatível com OpenAI, então a maioria dos SDKs OpenAI funciona apenas trocando a base URL.

| Propriedade | Valor                             |
| ----------- | --------------------------------- |
| Provider    | `qianfan`                         |
| Autenticação| `QIANFAN_API_KEY`                 |
| API         | Compatível com OpenAI             |
| Base URL    | `https://qianfan.baidubce.com/v2` |

## Primeiros passos

<Steps>
  <Step title="Criar uma conta Baidu Cloud">
    Cadastre-se ou faça login no [Console do Qianfan](https://console.bce.baidu.com/qianfan/ais/console/apiKey) e certifique-se de que você tenha o acesso à API do Qianfan habilitado.
  </Step>
  <Step title="Gerar uma chave de API">
    Crie um novo aplicativo ou selecione um existente e depois gere uma chave de API. O formato da chave é `bce-v3/ALTAK-...`.
  </Step>
  <Step title="Executar o onboarding">
    ```bash
    openclaw onboard --auth-choice qianfan-api-key
    ```
  </Step>
  <Step title="Verificar se o modelo está disponível">
    ```bash
    openclaw models list --provider qianfan
    ```
  </Step>
</Steps>

## Catálogo integrado

| Ref de modelo                        | Entrada     | Contexto | Saída máxima | Raciocínio | Observações   |
| ------------------------------------ | ----------- | -------- | ------------ | ---------- | ------------- |
| `qianfan/deepseek-v3.2`              | text        | 98,304   | 32,768       | Sim        | Modelo padrão |
| `qianfan/ernie-5.0-thinking-preview` | text, image | 119,000  | 64,000       | Sim        | Multimodal    |

<Tip>
A ref de modelo incluída por padrão é `qianfan/deepseek-v3.2`. Você só precisa substituir `models.providers.qianfan` quando precisar de uma base URL personalizada ou de metadados personalizados do modelo.
</Tip>

## Exemplo de configuração

```json5
{
  env: { QIANFAN_API_KEY: "bce-v3/ALTAK-..." },
  agents: {
    defaults: {
      model: { primary: "qianfan/deepseek-v3.2" },
      models: {
        "qianfan/deepseek-v3.2": { alias: "QIANFAN" },
      },
    },
  },
  models: {
    providers: {
      qianfan: {
        baseUrl: "https://qianfan.baidubce.com/v2",
        api: "openai-completions",
        models: [
          {
            id: "deepseek-v3.2",
            name: "DEEPSEEK V3.2",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 98304,
            maxTokens: 32768,
          },
          {
            id: "ernie-5.0-thinking-preview",
            name: "ERNIE-5.0-Thinking-Preview",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 119000,
            maxTokens: 64000,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Transporte e compatibilidade">
    O Qianfan funciona pelo caminho de transporte compatível com OpenAI, não pela modelagem nativa de requisições da OpenAI. Isso significa que recursos padrão dos SDKs OpenAI funcionam, mas parâmetros específicos do provider podem não ser encaminhados.
  </Accordion>

  <Accordion title="Catálogo e substituições">
    O catálogo incluído atualmente contém `deepseek-v3.2` e `ernie-5.0-thinking-preview`. Adicione ou substitua `models.providers.qianfan` apenas quando precisar de uma base URL personalizada ou de metadados personalizados do modelo.

    <Note>
    As refs de modelo usam o prefixo `qianfan/` (por exemplo `qianfan/deepseek-v3.2`).
    </Note>

  </Accordion>

  <Accordion title="Solução de problemas">
    - Certifique-se de que sua chave de API começa com `bce-v3/ALTAK-` e que o acesso à API do Qianfan está habilitado no console do Baidu Cloud.
    - Se os modelos não estiverem listados, confirme que sua conta tem o serviço Qianfan ativado.
    - A base URL padrão é `https://qianfan.baidubce.com/v2`. Só a altere se você usar um endpoint ou proxy personalizado.
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de providers, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Referência completa de configuração do OpenClaw.
  </Card>
  <Card title="Configuração de agente" href="/pt-BR/concepts/agent" icon="robot">
    Configurando padrões de agente e atribuições de modelo.
  </Card>
  <Card title="Documentação da API do Qianfan" href="https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb" icon="arrow-up-right-from-square">
    Documentação oficial da API do Qianfan.
  </Card>
</CardGroup>
