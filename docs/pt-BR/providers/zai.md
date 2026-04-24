---
read_when:
    - Você quer modelos Z.AI / GLM no OpenClaw
    - Você precisa de uma configuração simples de `ZAI_API_KEY`
summary: Use Z.AI (modelos GLM) com o OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-04-24T06:10:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2095be914fa9861c8aad2cb1e2ebe78f6e29183bf041a191205626820d3b71df
    source_path: providers/zai.md
    workflow: 15
---

Z.AI é a plataforma de API para modelos **GLM**. Ela fornece APIs REST para GLM e usa chaves de API
para autenticação. Crie sua chave de API no console da Z.AI. O OpenClaw usa o provider `zai`
com uma chave de API da Z.AI.

- Provider: `zai`
- Autenticação: `ZAI_API_KEY`
- API: Z.AI Chat Completions (autenticação Bearer)

## Primeiros passos

<Tabs>
  <Tab title="Detecção automática de endpoint">
    **Melhor para:** a maioria dos usuários. O OpenClaw detecta o endpoint Z.AI correspondente a partir da chave e aplica automaticamente a URL base correta.

    <Steps>
      <Step title="Execute o onboarding">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="Defina um modelo padrão">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="Verifique se o modelo está disponível">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Endpoint regional explícito">
    **Melhor para:** usuários que querem forçar uma superfície específica do Coding Plan ou da API geral.

    <Steps>
      <Step title="Escolha a opção correta de onboarding">
        ```bash
        # Coding Plan Global (recomendado para usuários do Coding Plan)
        openclaw onboard --auth-choice zai-coding-global

        # Coding Plan CN (região China)
        openclaw onboard --auth-choice zai-coding-cn

        # API geral
        openclaw onboard --auth-choice zai-global

        # API geral CN (região China)
        openclaw onboard --auth-choice zai-cn
        ```
      </Step>
      <Step title="Defina um modelo padrão">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="Verifique se o modelo está disponível">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Catálogo integrado

Atualmente, o OpenClaw inicializa o provider empacotado `zai` com:

| Ref do modelo         | Observações    |
| --------------------- | -------------- |
| `zai/glm-5.1`         | Modelo padrão  |
| `zai/glm-5`           |                |
| `zai/glm-5-turbo`     |                |
| `zai/glm-5v-turbo`    |                |
| `zai/glm-4.7`         |                |
| `zai/glm-4.7-flash`   |                |
| `zai/glm-4.7-flashx`  |                |
| `zai/glm-4.6`         |                |
| `zai/glm-4.6v`        |                |
| `zai/glm-4.5`         |                |
| `zai/glm-4.5-air`     |                |
| `zai/glm-4.5-flash`   |                |
| `zai/glm-4.5v`        |                |

<Tip>
Modelos GLM estão disponíveis como `zai/<model>` (exemplo: `zai/glm-5`). A ref de modelo padrão empacotada é `zai/glm-5.1`.
</Tip>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Forward-resolving de modelos GLM-5 desconhecidos">
    IDs desconhecidos `glm-5*` ainda fazem forward-resolving no caminho do provider empacotado ao
    sintetizar metadados controlados pelo provider a partir do template `glm-4.7` quando o id
    corresponde ao formato atual da família GLM-5.
  </Accordion>

  <Accordion title="Streaming de chamada de ferramenta">
    `tool_stream` é ativado por padrão para streaming de chamada de ferramenta da Z.AI. Para desativar:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/<model>": {
              params: { tool_stream: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Entendimento de imagem">
    O plugin empacotado Z.AI registra entendimento de imagem.

    | Propriedade    | Valor       |
    | -------------- | ----------- |
    | Modelo         | `glm-4.6v`  |

    O entendimento de imagem é resolvido automaticamente a partir da autenticação Z.AI configurada — nenhuma
    configuração adicional é necessária.

  </Accordion>

  <Accordion title="Detalhes de autenticação">
    - A Z.AI usa autenticação Bearer com sua chave de API.
    - A opção de onboarding `zai-api-key` detecta automaticamente o endpoint Z.AI correspondente a partir do prefixo da chave.
    - Use as opções regionais explícitas (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) quando quiser forçar uma superfície específica de API.
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Família de modelos GLM" href="/pt-BR/providers/glm" icon="microchip">
    Visão geral da família de modelos GLM.
  </Card>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de providers, refs de modelo e comportamento de failover.
  </Card>
</CardGroup>
