---
read_when:
    - Você quer uma única chave de API para muitos LLMs
    - Você precisa de orientação para configurar o Baidu Qianfan
summary: Use a API unificada da Qianfan para acessar vários modelos no OpenClaw
title: Qianfan
x-i18n:
    generated_at: "2026-06-27T18:06:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a8bc31970dc7fbc43819ec6d51f4bd0047b1acc5a03b23b656e617e3abd97475
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

## Instalar Plugin

Instale o Plugin oficial e reinicie o Gateway:

```bash
openclaw plugins install @openclaw/qianfan-provider
openclaw gateway restart
```

## Primeiros passos

<Steps>
  <Step title="Crie uma conta Baidu Cloud">
    Cadastre-se ou entre no [Console do Qianfan](https://console.bce.baidu.com/qianfan/ais/console/apiKey) e garanta que você tenha o acesso à API do Qianfan habilitado.
  </Step>
  <Step title="Gere uma chave de API">
    Crie um novo aplicativo ou selecione um existente e gere uma chave de API. O formato da chave é `bce-v3/ALTAK-...`.
  </Step>
  <Step title="Execute o onboarding">
    ```bash
    openclaw onboard --auth-choice qianfan-api-key
    ```
  </Step>
  <Step title="Verifique se o modelo está disponível">
    ```bash
    openclaw models list --provider qianfan
    ```
  </Step>
</Steps>

## Catálogo integrado

| Ref. do modelo                            | Entrada       | Contexto | Saída máx. | Raciocínio | Observações         |
| ------------------------------------ | ----------- | ------- | ---------- | --------- | ------------- |
| `qianfan/deepseek-v3.2`              | texto        | 98,304  | 32,768     | Sim       | Modelo padrão |
| `qianfan/ernie-5.0-thinking-preview` | texto, imagem | 119,000 | 64,000     | Sim       | Multimodal    |

<Tip>
A ref. de modelo padrão é `qianfan/deepseek-v3.2`. Você só precisa substituir `models.providers.qianfan` quando precisar de uma URL base personalizada ou de metadados de modelo.
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
    O Qianfan é executado pelo caminho de transporte compatível com OpenAI, não pela formatação de solicitações nativa da OpenAI. Isso significa que recursos padrão dos SDKs da OpenAI funcionam, mas parâmetros específicos do provedor podem não ser encaminhados.
  </Accordion>

  <Accordion title="Catálogo e substituições">
    O catálogo estático atualmente inclui `deepseek-v3.2` e `ernie-5.0-thinking-preview`. Adicione ou substitua `models.providers.qianfan` somente quando precisar de uma URL base personalizada ou de metadados de modelo.

    <Note>
    As refs. de modelo usam o prefixo `qianfan/` (por exemplo, `qianfan/deepseek-v3.2`).
    </Note>

  </Accordion>

  <Accordion title="Solução de problemas">
    - Garanta que sua chave de API comece com `bce-v3/ALTAK-` e tenha o acesso à API do Qianfan habilitado no console do Baidu Cloud.
    - Se os modelos não forem listados, confirme que sua conta tem o serviço Qianfan ativado.
    - A URL base padrão é `https://qianfan.baidubce.com/v2`. Altere-a somente se você usar um endpoint personalizado ou proxy.

  </Accordion>
</AccordionGroup>

## Relacionados

<CardGroup cols={2}>
  <Card title="Seleção de modelos" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolher provedores, refs. de modelo e comportamento de failover.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Referência completa de configuração do OpenClaw.
  </Card>
  <Card title="Configuração de agente" href="/pt-BR/concepts/agent" icon="robot">
    Configurar padrões de agente e atribuições de modelo.
  </Card>
  <Card title="Documentação da API do Qianfan" href="https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb" icon="arrow-up-right-from-square">
    Documentação oficial da API do Qianfan.
  </Card>
</CardGroup>
