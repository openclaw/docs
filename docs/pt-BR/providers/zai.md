---
read_when:
    - Você quer modelos Z.AI / GLM no OpenClaw
    - Você precisa de uma configuração simples de ZAI_API_KEY
summary: Use Z.AI (modelos GLM) com OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-05-02T05:55:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 423fc2bc27c62352d9d9acd13c70aa2bc3804112dab25aa46505e844cb166c93
    source_path: providers/zai.md
    workflow: 16
---

Z.AI é a plataforma de API para modelos **GLM**. Ela fornece APIs REST para GLM e usa chaves de API
para autenticação. Crie sua chave de API no console da Z.AI. OpenClaw usa o provedor `zai`
com uma chave de API da Z.AI.

- Provedor: `zai`
- Autenticação: `ZAI_API_KEY`
- API: Z.AI Chat Completions (autenticação Bearer)

## Primeiros passos

<Tabs>
  <Tab title="Detectar endpoint automaticamente">
    **Ideal para:** a maioria dos usuários. OpenClaw detecta o endpoint Z.AI correspondente a partir da chave e aplica a URL base correta automaticamente.

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
      <Step title="Verifique se o modelo está listado">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Endpoint regional explícito">
    **Ideal para:** usuários que desejam forçar um Coding Plan específico ou uma superfície geral de API.

    <Steps>
      <Step title="Escolha a opção de onboarding correta">
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
      <Step title="Defina um modelo padrão">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="Verifique se o modelo está listado">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Catálogo integrado

OpenClaw inclui o catálogo do provedor `zai` empacotado no manifesto do Plugin, para que a listagem
somente leitura possa mostrar linhas GLM conhecidas sem carregar o runtime do provedor:

```bash
openclaw models list --all --provider zai
```

O catálogo baseado no manifesto atualmente inclui:

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
Os modelos GLM estão disponíveis como `zai/<model>` (exemplo: `zai/glm-5`). A referência do modelo empacotado padrão é `zai/glm-5.1`.
</Tip>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Resolução futura de modelos GLM-5 desconhecidos">
    IDs `glm-5*` desconhecidos ainda são resolvidos futuramente no caminho do provedor empacotado ao
    sintetizar metadados pertencentes ao provedor a partir do modelo `glm-4.7` quando o ID
    corresponde ao formato atual da família GLM-5.
  </Accordion>

  <Accordion title="Streaming de chamadas de ferramenta">
    `tool_stream` é habilitado por padrão para streaming de chamadas de ferramenta da Z.AI. Para desabilitá-lo:

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
    O thinking da Z.AI segue os controles `/think` do OpenClaw. Com thinking desativado,
    OpenClaw envia `thinking: { type: "disabled" }` para evitar respostas que
    gastem o orçamento de saída em `reasoning_content` antes do texto visível.

    O thinking preservado é opcional porque a Z.AI exige que todo o histórico de
    `reasoning_content` seja repetido, o que aumenta os tokens do prompt. Habilite-o
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

    Quando habilitado e o thinking está ativo, OpenClaw envia
    `thinking: { type: "enabled", clear_thinking: false }` e repete o
    `reasoning_content` anterior para a mesma transcrição compatível com OpenAI.

    Usuários avançados ainda podem substituir o payload exato do provedor com
    `params.extra_body.thinking`.

  </Accordion>

  <Accordion title="Compreensão de imagens">
    O Plugin Z.AI empacotado registra compreensão de imagens.

    | Propriedade   | Valor       |
    | ------------- | ----------- |
    | Modelo        | `glm-4.6v`  |

    A compreensão de imagens é resolvida automaticamente a partir da autenticação Z.AI configurada, sem
    necessidade de configuração adicional.

  </Accordion>

  <Accordion title="Detalhes de autenticação">
    - Z.AI usa autenticação Bearer com sua chave de API.
    - A opção de onboarding `zai-api-key` detecta automaticamente o endpoint Z.AI correspondente a partir do prefixo da chave.
    - Use as opções regionais explícitas (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) quando quiser forçar uma superfície de API específica.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Família de modelos GLM" href="/pt-BR/providers/glm" icon="microchip">
    Visão geral da família de modelos GLM.
  </Card>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Como escolher provedores, referências de modelo e comportamento de failover.
  </Card>
</CardGroup>
