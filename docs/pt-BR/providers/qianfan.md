---
read_when:
    - Você quer uma única chave de API para muitos LLMs
    - Você precisa de orientação de configuração do Baidu Qianfan
summary: Use a API unificada do Qianfan para acessar muitos modelos no OpenClaw
title: Qianfan
x-i18n:
    generated_at: "2026-04-12T23:32:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1d0eeee9ec24b335c2fb8ac5e985a9edc35cfc5b2641c545cb295dd2de619f50
    source_path: providers/qianfan.md
    workflow: 15
---

# Qianfan

O Qianfan é a plataforma MaaS da Baidu, fornecendo uma **API unificada** que roteia requisições para muitos modelos por trás de um único
endpoint e de uma única chave de API. Ela é compatível com OpenAI, então a maioria dos SDKs de OpenAI funciona apenas trocando a URL base.

| Propriedade | Valor                             |
| ----------- | --------------------------------- |
| Provedor    | `qianfan`                         |
| Autenticação | `QIANFAN_API_KEY`                |
| API         | Compatível com OpenAI             |
| URL base    | `https://qianfan.baidubce.com/v2` |

## Primeiros passos

<Steps>
  <Step title="Crie uma conta Baidu Cloud">
    Cadastre-se ou faça login no [Console do Qianfan](https://console.bce.baidu.com/qianfan/ais/console/apiKey) e verifique se você tem o acesso à API do Qianfan ativado.
  </Step>
  <Step title="Gere uma chave de API">
    Crie um novo aplicativo ou selecione um existente e, em seguida, gere uma chave de API. O formato da chave é `bce-v3/ALTAK-...`.
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

## Modelos disponíveis

| Ref. do modelo                       | Entrada     | Contexto | Saída máx. | Raciocínio | Observações      |
| ------------------------------------ | ----------- | -------- | ---------- | ---------- | ---------------- |
| `qianfan/deepseek-v3.2`              | text        | 98,304   | 32,768     | Sim        | Modelo padrão    |
| `qianfan/ernie-5.0-thinking-preview` | text, image | 119,000  | 64,000     | Sim        | Multimodal       |

<Tip>
A ref de modelo agrupada padrão é `qianfan/deepseek-v3.2`. Você só precisa substituir `models.providers.qianfan` quando precisar de uma URL base personalizada ou de metadados de modelo.
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
    O Qianfan roda pelo caminho de transporte compatível com OpenAI, não pelo ajuste nativo de requisição do OpenAI. Isso significa que recursos padrão do SDK de OpenAI funcionam, mas parâmetros específicos do provedor podem não ser encaminhados.
  </Accordion>

  <Accordion title="Catálogo e substituições">
    Atualmente, o catálogo agrupado inclui `deepseek-v3.2` e `ernie-5.0-thinking-preview`. Adicione ou substitua `models.providers.qianfan` apenas quando precisar de uma URL base personalizada ou de metadados de modelo.

    <Note>
    As refs de modelo usam o prefixo `qianfan/` (por exemplo `qianfan/deepseek-v3.2`).
    </Note>

  </Accordion>

  <Accordion title="Solução de problemas">
    - Verifique se sua chave de API começa com `bce-v3/ALTAK-` e se tem acesso à API do Qianfan ativado no console do Baidu Cloud.
    - Se os modelos não forem listados, confirme se a sua conta tem o serviço Qianfan ativado.
    - A URL base padrão é `https://qianfan.baidubce.com/v2`. Só a altere se você usar um endpoint ou proxy personalizado.
  </Accordion>
</AccordionGroup>

## Relacionados

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration" icon="gear">
    Referência completa de configuração do OpenClaw.
  </Card>
  <Card title="Configuração de agente" href="/pt-BR/concepts/agent" icon="robot">
    Configuração de padrões de agente e atribuições de modelo.
  </Card>
  <Card title="Documentação da API do Qianfan" href="https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb" icon="arrow-up-right-from-square">
    Documentação oficial da API do Qianfan.
  </Card>
</CardGroup>
