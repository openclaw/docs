---
read_when:
    - Você quer modelos Z.AI / GLM no OpenClaw
    - Você precisa de uma configuração simples de `ZAI_API_KEY`
summary: Use Z.AI (modelos GLM) com o OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-04-26T11:37:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5e2935aae04850539f46908fcbfc12111eac3ebbd963244e6347165afdd14bc5
    source_path: providers/zai.md
    workflow: 15
---

Z.AI é a plataforma de API para modelos **GLM**. Ela fornece APIs REST para GLM e usa chaves de API
para autenticação. Crie sua chave de API no console da Z.AI. O OpenClaw usa o provedor `zai`
com uma chave de API da Z.AI.

- Provedor: `zai`
- Autenticação: `ZAI_API_KEY`
- API: Z.AI Chat Completions (autenticação Bearer)

## Primeiros passos

<Tabs>
  <Tab title="Endpoint detectado automaticamente">
    **Ideal para:** a maioria dos usuários. O OpenClaw detecta o endpoint Z.AI correspondente a partir da chave e aplica automaticamente a URL base correta.

    <Steps>
      <Step title="Executar a configuração inicial">
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
    **Ideal para:** usuários que querem forçar uma superfície específica de Coding Plan ou da API geral.

    <Steps>
      <Step title="Escolher a opção correta de configuração inicial">
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

No momento, o OpenClaw inicializa o provedor `zai` integrado com:

| Ref. do modelo       | Observações   |
| -------------------- | ------------- |
| `zai/glm-5.1`        | Modelo padrão |
| `zai/glm-5`          |               |
| `zai/glm-5-turbo`    |               |
| `zai/glm-5v-turbo`   |               |
| `zai/glm-4.7`        |               |
| `zai/glm-4.7-flash`  |               |
| `zai/glm-4.7-flashx` |               |
| `zai/glm-4.6`        |               |
| `zai/glm-4.6v`       |               |
| `zai/glm-4.5`        |               |
| `zai/glm-4.5-air`    |               |
| `zai/glm-4.5-flash`  |               |
| `zai/glm-4.5v`       |               |

<Tip>
Os modelos GLM estão disponíveis como `zai/<model>` (exemplo: `zai/glm-5`). A ref. de modelo integrada padrão é `zai/glm-5.1`.
</Tip>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Resolução antecipada de modelos GLM-5 desconhecidos">
    IDs `glm-5*` desconhecidos ainda são resolvidos antecipadamente no caminho do provedor integrado por
    sintetizar metadados pertencentes ao provedor a partir do modelo `glm-4.7` quando o ID
    corresponde ao formato atual da família GLM-5.
  </Accordion>

  <Accordion title="Streaming de chamadas de ferramenta">
    `tool_stream` é ativado por padrão para o streaming de chamadas de ferramenta da Z.AI. Para desativá-lo:

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

  <Accordion title="Thinking e thinking preservado">
    O thinking da Z.AI segue os controles `/think` do OpenClaw. Com o thinking desativado,
    o OpenClaw envia `thinking: { type: "disabled" }` para evitar respostas que
    gastem o orçamento de saída em `reasoning_content` antes do texto visível.

    O thinking preservado é opcional porque a Z.AI exige que todo o
    `reasoning_content` histórico seja reproduzido, o que aumenta os tokens do prompt. Ative-o
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

    Quando ativado e com thinking habilitado, o OpenClaw envia
    `thinking: { type: "enabled", clear_thinking: false }` e reproduz
    `reasoning_content` anteriores para a mesma transcrição compatível com OpenAI.

    Usuários avançados ainda podem substituir a carga útil exata do provedor com
    `params.extra_body.thinking`.

  </Accordion>

  <Accordion title="Compreensão de imagem">
    O Plugin Z.AI integrado registra compreensão de imagem.

    | Propriedade | Valor      |
    | ----------- | ---------- |
    | Modelo      | `glm-4.6v` |

    A compreensão de imagem é resolvida automaticamente a partir da autenticação Z.AI configurada — não
    é necessária nenhuma configuração adicional.

  </Accordion>

  <Accordion title="Detalhes de autenticação">
    - A Z.AI usa autenticação Bearer com sua chave de API.
    - A opção de configuração inicial `zai-api-key` detecta automaticamente o endpoint Z.AI correspondente a partir do prefixo da chave.
    - Use as opções regionais explícitas (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) quando quiser forçar uma superfície de API específica.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Família de modelos GLM" href="/pt-BR/providers/glm" icon="microchip">
    Visão geral da família de modelos GLM.
  </Card>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, refs. de modelo e comportamento de failover.
  </Card>
</CardGroup>
