---
read_when:
    - Você quer uma única chave de API para muitos LLMs
    - Você precisa de orientações para configurar o Baidu Qianfan
summary: Use a API unificada do Qianfan para acessar vários modelos no OpenClaw
title: Qianfan
x-i18n:
    generated_at: "2026-04-30T10:05:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6adfbad6c18bf2bcf93d9c56c51591c862ebb751ffd8183015fa2fc9566ce0af
    source_path: providers/qianfan.md
    workflow: 16
---

Qianfan é a plataforma MaaS da Baidu, fornecendo uma **API unificada** que encaminha solicitações para muitos modelos por trás de um único
endpoint e chave de API. Ela é compatível com OpenAI, então a maioria dos SDKs da OpenAI funciona ao trocar a URL base.

| Propriedade | Valor                             |
| -------- | --------------------------------- |
| Provedor | `qianfan`                         |
| Autenticação     | `QIANFAN_API_KEY`                 |
| API      | Compatível com OpenAI                 |
| URL base | `https://qianfan.baidubce.com/v2` |

## Primeiros passos

<Steps>
  <Step title="Criar uma conta da Baidu Cloud">
    Cadastre-se ou faça login no [Console do Qianfan](https://console.bce.baidu.com/qianfan/ais/console/apiKey) e verifique se você tem o acesso à API do Qianfan habilitado.
  </Step>
  <Step title="Gerar uma chave de API">
    Crie uma nova aplicação ou selecione uma existente e, em seguida, gere uma chave de API. O formato da chave é `bce-v3/ALTAK-...`.
  </Step>
  <Step title="Executar a integração">
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

| Ref do modelo                            | Entrada       | Contexto | Saída máxima | Raciocínio | Observações         |
| ------------------------------------ | ----------- | ------- | ---------- | --------- | ------------- |
| `qianfan/deepseek-v3.2`              | texto        | 98,304  | 32,768     | Sim       | Modelo padrão |
| `qianfan/ernie-5.0-thinking-preview` | texto, imagem | 119,000 | 64,000     | Sim       | Multimodal    |

<Tip>
A ref de modelo padrão incluída é `qianfan/deepseek-v3.2`. Você só precisa substituir `models.providers.qianfan` quando precisar de uma URL base personalizada ou metadados de modelo.
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
    O Qianfan é executado pelo caminho de transporte compatível com OpenAI, não pela formatação nativa de solicitações da OpenAI. Isso significa que os recursos padrão dos SDKs da OpenAI funcionam, mas parâmetros específicos do provedor podem não ser encaminhados.
  </Accordion>

  <Accordion title="Catálogo e substituições">
    No momento, o catálogo incluído inclui `deepseek-v3.2` e `ernie-5.0-thinking-preview`. Adicione ou substitua `models.providers.qianfan` somente quando precisar de uma URL base personalizada ou metadados de modelo.

    <Note>
    Refs de modelo usam o prefixo `qianfan/` (por exemplo, `qianfan/deepseek-v3.2`).
    </Note>

  </Accordion>

  <Accordion title="Solução de problemas">
    - Verifique se sua chave de API começa com `bce-v3/ALTAK-` e se tem acesso à API do Qianfan habilitado no console da Baidu Cloud.
    - Se os modelos não estiverem listados, confirme que sua conta tem o serviço Qianfan ativado.
    - A URL base padrão é `https://qianfan.baidubce.com/v2`. Altere-a somente se você usar um endpoint ou proxy personalizado.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Referência completa de configuração do OpenClaw.
  </Card>
  <Card title="Configuração do agente" href="/pt-BR/concepts/agent" icon="robot">
    Configuração de padrões de agente e atribuições de modelo.
  </Card>
  <Card title="Documentação da API do Qianfan" href="https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb" icon="arrow-up-right-from-square">
    Documentação oficial da API do Qianfan.
  </Card>
</CardGroup>
