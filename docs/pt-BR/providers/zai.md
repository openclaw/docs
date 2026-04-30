---
read_when:
    - Você quer modelos Z.AI / GLM no OpenClaw
    - Você precisa de uma configuração simples de ZAI_API_KEY
summary: Use Z.AI (modelos GLM) com OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-04-30T10:06:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0192797b9e023065a384b0428830e73877a5088d2c40c2190d5322273294607d
    source_path: providers/zai.md
    workflow: 16
---

A Z.AI é a plataforma de API para modelos **GLM**. Ela fornece APIs REST para GLM e usa chaves de API
para autenticação. Crie sua chave de API no console da Z.AI. O OpenClaw usa o provedor `zai`
com uma chave de API da Z.AI.

- Provedor: `zai`
- Autenticação: `ZAI_API_KEY`
- API: Chat Completions da Z.AI (autenticação Bearer)

## Primeiros passos

<Tabs>
  <Tab title="Detectar endpoint automaticamente">
    **Melhor para:** a maioria dos usuários. O OpenClaw detecta o endpoint Z.AI correspondente a partir da chave e aplica automaticamente a URL base correta.

    <Steps>
      <Step title="Executar o onboarding">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="Definir um modelo padrão">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="Verificar se o modelo está disponível">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Endpoint regional explícito">
    **Melhor para:** usuários que querem forçar um Coding Plan específico ou uma superfície de API geral.

    <Steps>
      <Step title="Escolher a opção correta de onboarding">
        ```bash
        # Coding Plan Global (recommended for Coding Plan users)
        openclaw onboard --auth-choice zai-coding-global

        # Coding Plan CN (China region)
        openclaw onboard --auth-choice zai-coding-cn

        # General API
        openclaw onboard --auth-choice zai-global

        # General API CN (China region)
        openclaw onboard --auth-choice zai-cn
        ```
      </Step>
      <Step title="Definir um modelo padrão">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="Verificar se o modelo está disponível">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Catálogo integrado

Atualmente, o OpenClaw inicializa o provedor `zai` integrado com:

| Referência do modelo | Observações    |
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
Os modelos GLM estão disponíveis como `zai/<model>` (exemplo: `zai/glm-5`). A referência de modelo integrada padrão é `zai/glm-5.1`.
</Tip>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Resolução futura de modelos GLM-5 desconhecidos">
    IDs `glm-5*` desconhecidos ainda são resolvidos futuramente no caminho do provedor integrado ao
    sintetizar metadados pertencentes ao provedor a partir do modelo `glm-4.7` quando o ID
    corresponde ao formato atual da família GLM-5.
  </Accordion>

  <Accordion title="Streaming de chamadas de ferramentas">
    `tool_stream` é ativado por padrão para streaming de chamadas de ferramentas da Z.AI. Para desativá-lo:

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

  <Accordion title="Raciocínio e raciocínio preservado">
    O raciocínio da Z.AI segue os controles `/think` do OpenClaw. Com o raciocínio desativado,
    o OpenClaw envia `thinking: { type: "disabled" }` para evitar respostas que
    gastem o orçamento de saída em `reasoning_content` antes do texto visível.

    O raciocínio preservado é opt-in porque a Z.AI exige que todo o histórico de
    `reasoning_content` seja reproduzido, o que aumenta os tokens de prompt. Ative-o
    por modelo:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/glm-5.1": {
              params: { preserveThinking: true },
            },
          },
        },
      },
    }
    ```

    Quando ativado e o raciocínio está ligado, o OpenClaw envia
    `thinking: { type: "enabled", clear_thinking: false }` e reproduz o
    `reasoning_content` anterior para a mesma transcrição compatível com OpenAI.

    Usuários avançados ainda podem sobrescrever o payload exato do provedor com
    `params.extra_body.thinking`.

  </Accordion>

  <Accordion title="Compreensão de imagens">
    O Plugin Z.AI integrado registra compreensão de imagens.

    | Propriedade | Valor      |
    | ----------- | ---------- |
    | Modelo      | `glm-4.6v` |

    A compreensão de imagens é resolvida automaticamente a partir da autenticação Z.AI configurada — nenhuma
    configuração adicional é necessária.

  </Accordion>

  <Accordion title="Detalhes de autenticação">
    - A Z.AI usa autenticação Bearer com sua chave de API.
    - A opção de onboarding `zai-api-key` detecta automaticamente o endpoint Z.AI correspondente a partir do prefixo da chave.
    - Use as opções regionais explícitas (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) quando quiser forçar uma superfície de API específica.

  </Accordion>
</AccordionGroup>

## Relacionados

<CardGroup cols={2}>
  <Card title="Família de modelos GLM" href="/pt-BR/providers/glm" icon="microchip">
    Visão geral da família de modelos GLM.
  </Card>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, referências de modelo e comportamento de failover.
  </Card>
</CardGroup>
