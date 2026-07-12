---
read_when:
    - Você quer uma única chave de API para vários LLMs
    - Você precisa de orientações para configurar o Baidu Qianfan
summary: Use a API unificada do Qianfan para acessar vários modelos no OpenClaw
title: Qianfan
x-i18n:
    generated_at: "2026-07-12T15:32:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 31387a53ee4472e2d20ae939ea75cea0d6f6367501becd56a8654fd97fdf0804
    source_path: providers/qianfan.md
    workflow: 16
---

Qianfan é a plataforma MaaS da Baidu: uma API unificada e compatível com a OpenAI que encaminha solicitações para vários modelos por meio de um único endpoint e uma única chave de API. O OpenClaw a disponibiliza como o plugin externo oficial `@openclaw/qianfan-provider`.

| Propriedade   | Valor                                    |
| ------------- | ---------------------------------------- |
| Provedor      | `qianfan`                                |
| Autenticação  | `QIANFAN_API_KEY`                        |
| API           | Compatível com a OpenAI (`openai-completions`) |
| URL base      | `https://qianfan.baidubce.com/v2`        |
| Modelo padrão | `qianfan/deepseek-v3.2`                  |

## Instalar o plugin

Instale o plugin oficial e reinicie o Gateway:

```bash
openclaw plugins install @openclaw/qianfan-provider
openclaw gateway restart
```

## Primeiros passos

<Steps>
  <Step title="Criar uma conta do Baidu Cloud">
    Cadastre-se ou faça login no [Console do Qianfan](https://console.bce.baidu.com/qianfan/ais/console/apiKey) e verifique se o acesso à API do Qianfan está habilitado.
  </Step>
  <Step title="Gerar uma chave de API">
    Crie uma aplicação ou selecione uma existente e gere uma chave de API. As chaves do Baidu Cloud usam o formato `bce-v3/ALTAK-...`.
  </Step>
  <Step title="Executar a configuração inicial">
    ```bash
    openclaw onboard --auth-choice qianfan-api-key
    ```

    Execuções não interativas leem a chave de `--qianfan-api-key <key>` ou
    `QIANFAN_API_KEY`. A configuração inicial grava a configuração do provedor, adiciona o
    alias `QIANFAN` para o modelo padrão e define `qianfan/deepseek-v3.2`
    como o modelo padrão quando nenhum estiver configurado.

  </Step>
  <Step title="Verificar se o modelo está disponível">
    ```bash
    openclaw models list --provider qianfan
    ```
  </Step>
</Steps>

## Catálogo integrado

| Referência do modelo                  | Entrada     | Contexto | Saída máxima | Raciocínio | Observações     |
| ------------------------------------- | ----------- | -------- | ------------ | ---------- | --------------- |
| `qianfan/deepseek-v3.2`               | texto       | 98,304   | 32,768       | Sim        | Modelo padrão   |
| `qianfan/ernie-5.0-thinking-preview`  | texto, imagem | 119,000 | 64,000       | Sim        | Multimodal      |

O catálogo é estático; não há descoberta de modelos em tempo real.

<Tip>
Você só precisa substituir `models.providers.qianfan` quando precisar de uma URL base personalizada ou de metadados personalizados do modelo.
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

<Note>
As referências de modelo usam o prefixo `qianfan/` (por exemplo, `qianfan/deepseek-v3.2`).
</Note>

<AccordionGroup>
  <Accordion title="Transporte e compatibilidade">
    O Qianfan opera pelo caminho de transporte compatível com a OpenAI, e não pela formatação nativa de solicitações da OpenAI. Os recursos padrão do SDK da OpenAI funcionam, mas parâmetros específicos do provedor podem não ser encaminhados.
  </Accordion>

  <Accordion title="Solução de problemas">
    - Verifique se a chave de API começa com `bce-v3/ALTAK-` e se o acesso à API do Qianfan está habilitado no console do Baidu Cloud.
    - Se os modelos não forem listados, confirme se o serviço Qianfan está ativado na sua conta.
    - Altere a URL base somente se você usar um endpoint personalizado ou proxy.

  </Accordion>
</AccordionGroup>

## Conteúdo relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelos" href="/pt-BR/concepts/model-providers" icon="layers">
    Como escolher provedores, referências de modelo e o comportamento de failover.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Referência completa de configuração do OpenClaw.
  </Card>
  <Card title="Configuração do agente" href="/pt-BR/concepts/agent" icon="robot">
    Como configurar os padrões do agente e as atribuições de modelos.
  </Card>
  <Card title="Documentação da API do Qianfan" href="https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb" icon="arrow-up-right-from-square">
    Documentação oficial da API do Qianfan.
  </Card>
</CardGroup>
