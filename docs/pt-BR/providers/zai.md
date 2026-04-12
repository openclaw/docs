---
read_when:
    - Você quer usar modelos Z.AI / GLM no OpenClaw
    - Você precisa de uma configuração simples de `ZAI_API_KEY`
summary: Use o Z.AI (modelos GLM) com o OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-04-12T23:33:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 972b467dab141c8c5126ac776b7cb6b21815c27da511b3f34e12bd9e9ac953b7
    source_path: providers/zai.md
    workflow: 15
---

# Z.AI

A Z.AI é a plataforma de API para modelos **GLM**. Ela fornece APIs REST para GLM e usa chaves de API
para autenticação. Crie sua chave de API no console da Z.AI. O OpenClaw usa o provedor `zai`
com uma chave de API da Z.AI.

- Provedor: `zai`
- Autenticação: `ZAI_API_KEY`
- API: Z.AI Chat Completions (autenticação Bearer)

## Primeiros passos

<Tabs>
  <Tab title="Detecção automática de endpoint">
    **Ideal para:** a maioria dos usuários. O OpenClaw detecta o endpoint Z.AI correspondente a partir da chave e aplica automaticamente a URL base correta.

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
    **Ideal para:** usuários que querem forçar uma superfície específica do Coding Plan ou da API geral.

    <Steps>
      <Step title="Escolha a opção correta de onboarding">
        ```bash
        # Coding Plan Global (recomendado para usuários do Coding Plan)
        openclaw onboard --auth-choice zai-coding-global

        # Coding Plan CN (região da China)
        openclaw onboard --auth-choice zai-coding-cn

        # API geral
        openclaw onboard --auth-choice zai-global

        # API geral CN (região da China)
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

## Catálogo GLM agrupado

Atualmente, o OpenClaw inicializa o provedor agrupado `zai` com:

| Ref. do modelo       | Observações    |
| -------------------- | -------------- |
| `zai/glm-5.1`        | Modelo padrão  |
| `zai/glm-5`          |                |
| `zai/glm-5-turbo`    |                |
| `zai/glm-5v-turbo`   |                |
| `zai/glm-4.7`        |                |
| `zai/glm-4.7-flash`  |                |
| `zai/glm-4.7-flashx` |                |
| `zai/glm-4.6`        |                |
| `zai/glm-4.6v`       |                |
| `zai/glm-4.5`        |                |
| `zai/glm-4.5-air`    |                |
| `zai/glm-4.5-flash`  |                |
| `zai/glm-4.5v`       |                |

<Tip>
Os modelos GLM estão disponíveis como `zai/<model>` (exemplo: `zai/glm-5`). A ref de modelo agrupada padrão é `zai/glm-5.1`.
</Tip>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Resolução futura de modelos GLM-5 desconhecidos">
    IDs desconhecidos `glm-5*` ainda são resolvidos futuramente no caminho do provedor agrupado
    por meio da sintetização de metadados pertencentes ao provedor a partir do modelo `glm-4.7` quando o id
    corresponde ao formato atual da família GLM-5.
  </Accordion>

  <Accordion title="Streaming de chamadas de ferramenta">
    `tool_stream` é ativado por padrão para streaming de chamadas de ferramenta da Z.AI. Para desativá-lo:

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
    O plugin agrupado da Z.AI registra entendimento de imagem.

    | Propriedade | Valor       |
    | ----------- | ----------- |
    | Modelo      | `glm-4.6v`  |

    O entendimento de imagem é resolvido automaticamente a partir da autenticação configurada da Z.AI — nenhuma
    configuração adicional é necessária.

  </Accordion>

  <Accordion title="Detalhes de autenticação">
    - A Z.AI usa autenticação Bearer com sua chave de API.
    - A opção de onboarding `zai-api-key` detecta automaticamente o endpoint Z.AI correspondente a partir do prefixo da chave.
    - Use as opções regionais explícitas (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) quando quiser forçar uma superfície específica de API.
  </Accordion>
</AccordionGroup>

## Relacionados

<CardGroup cols={2}>
  <Card title="Família de modelos GLM" href="/pt-BR/providers/glm" icon="microchip">
    Visão geral da família de modelos GLM.
  </Card>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, refs de modelo e comportamento de failover.
  </Card>
</CardGroup>
