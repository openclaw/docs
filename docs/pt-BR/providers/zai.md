---
read_when:
    - Você quer modelos Z.AI / GLM no OpenClaw
    - Você precisa de uma configuração simples de ZAI_API_KEY
summary: Use Z.AI (modelos GLM) com o OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-06-27T18:08:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a40675d3db518c090828bcc46c3bca348d1bed1027ba6b80228aa27773efd10f
    source_path: providers/zai.md
    workflow: 16
---

Z.AI é a plataforma de API para modelos **GLM**. Ela fornece APIs REST para GLM e
usa chaves de API para autenticação. Crie sua chave de API no console da Z.AI.
O OpenClaw usa o provedor `zai` com uma chave de API da Z.AI.

| Propriedade | Valor                                        |
| -------- | -------------------------------------------- |
| Provedor | `zai`                                        |
| Pacote  | `@openclaw/zai-provider`                     |
| Autenticação     | `ZAI_API_KEY` (alias legado: `Z_AI_API_KEY`) |
| API      | Z.AI Chat Completions (autenticação Bearer)          |

## Modelos GLM

GLM é uma família de modelos, não um provedor separado. No OpenClaw, modelos GLM usam
refs como `zai/glm-5.2`: provedor `zai`, id do modelo `glm-5.2`.

## Primeiros passos

Instale primeiro o plugin do provedor:

```bash
openclaw plugins install @openclaw/zai-provider
```

<Tabs>
  <Tab title="Auto-detect endpoint">
    **Melhor para:** a maioria dos usuários. O OpenClaw testa endpoints Z.AI compatíveis com sua chave de API e aplica automaticamente a URL base correta.

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="Verify the model is listed">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Explicit regional endpoint">
    **Melhor para:** usuários que querem forçar um Coding Plan específico ou uma superfície de API geral.

    <Steps>
      <Step title="Pick the right onboarding choice">
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
      <Step title="Verify the model is listed">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Exemplo de configuração

<Tip>
`zai-api-key` permite que o OpenClaw detecte o endpoint Z.AI correspondente a partir da chave e
aplique automaticamente a URL base correta. Use as opções regionais explícitas quando
quiser forçar um Coding Plan específico ou uma superfície de API geral.
</Tip>

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  models: {
    providers: {
      zai: {
        // GLM-5.2 uses the Coding Plan endpoint.
        baseUrl: "https://api.z.ai/api/coding/paas/v4",
      },
    },
  },
  agents: { defaults: { model: { primary: "zai/glm-5.2" } } },
}
```

## Catálogo integrado

O plugin do provedor `zai` inclui seu catálogo no manifesto do plugin, então a listagem
somente leitura pode mostrar linhas GLM conhecidas sem carregar o runtime do provedor:

```bash
openclaw models list --all --provider zai
```

Atualmente, o catálogo baseado no manifesto inclui:

| Ref do modelo            | Observações                           |
| -------------------- | ------------------------------- |
| `zai/glm-5.2`        | Padrão do Coding Plan; contexto de 1M |
| `zai/glm-5.1`        | Padrão da API geral             |
| `zai/glm-5`          |                                 |
| `zai/glm-5-turbo`    |                                 |
| `zai/glm-5v-turbo`   |                                 |
| `zai/glm-4.7`        |                                 |
| `zai/glm-4.7-flash`  |                                 |
| `zai/glm-4.7-flashx` |                                 |
| `zai/glm-4.6`        |                                 |
| `zai/glm-4.6v`       |                                 |
| `zai/glm-4.5`        |                                 |
| `zai/glm-4.5-air`    |                                 |
| `zai/glm-4.5-flash`  |                                 |
| `zai/glm-4.5v`       |                                 |

<Tip>
Modelos GLM estão disponíveis como `zai/<model>` (exemplo: `zai/glm-5`).
</Tip>

<Tip>
GLM-5.2 oferece suporte aos níveis de raciocínio `off`, `low`, `high` e `max`. O OpenClaw mapeia
`low` e `high` para alto esforço de raciocínio da Z.AI, e `max` para esforço máximo.
</Tip>

<Note>
A configuração do Coding Plan usa `zai/glm-5.2` por padrão; a configuração da API geral mantém
`zai/glm-5.1`. A detecção automática de endpoint recorre a `glm-5.1` ou `glm-4.7`
quando o plano selecionado não expõe GLM-5.2. Versões e disponibilidade do GLM
podem mudar; execute `openclaw models list --all --provider zai` para ver o catálogo
conhecido pela sua versão instalada.
</Note>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Forward-resolving unknown GLM-5 models">
    IDs `glm-5*` desconhecidos ainda são resolvidos prospectivamente no caminho do provedor ao
    sintetizar metadados de propriedade do provedor a partir do modelo `glm-4.7` quando o id
    corresponde ao formato atual da família GLM-5.
  </Accordion>

  <Accordion title="Tool-call streaming">
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

  <Accordion title="Thinking and preserved thinking">
    O raciocínio da Z.AI segue os controles `/think` do OpenClaw. Com o raciocínio desativado,
    o OpenClaw envia `thinking: { type: "disabled" }` para evitar respostas que
    gastem o orçamento de saída em `reasoning_content` antes do texto visível.

    O raciocínio preservado é opcional porque a Z.AI exige que todo o histórico de
    `reasoning_content` seja reproduzido, o que aumenta os tokens do prompt. Habilite-o
    por modelo:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/glm-5.2": {
              params: { preserveThinking: true },
            },
          },
        },
      },
    }
    ```

    Quando habilitado e o raciocínio está ativo, o OpenClaw envia
    `thinking: { type: "enabled", clear_thinking: false }` e reproduz o
    `reasoning_content` anterior para a mesma transcrição compatível com OpenAI.

    Usuários avançados ainda podem substituir o payload exato do provedor com
    `params.extra_body.thinking`.

  </Accordion>

  <Accordion title="Image understanding">
    O plugin da Z.AI registra compreensão de imagem.

    | Propriedade      | Valor       |
    | ------------- | ----------- |
    | Modelo         | `glm-4.6v`  |

    A compreensão de imagem é resolvida automaticamente a partir da autenticação Z.AI configurada — nenhuma
    configuração adicional é necessária.

  </Accordion>

  <Accordion title="Auth details">
    - A Z.AI usa autenticação Bearer com sua chave de API.
    - A opção de onboarding `zai-api-key` detecta automaticamente o endpoint Z.AI correspondente testando endpoints compatíveis com sua chave.
    - Use as opções regionais explícitas (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) quando quiser forçar uma superfície de API específica.
    - A variável de ambiente legada `Z_AI_API_KEY` ainda é aceita; o OpenClaw a copia para `ZAI_API_KEY` na inicialização se `ZAI_API_KEY` não estiver definida.

  </Accordion>
</AccordionGroup>

## Relacionados

<CardGroup cols={2}>
  <Card title="Model selection" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Configuration reference" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Esquema completo de configuração do OpenClaw, incluindo configurações de provedor e modelo.
  </Card>
</CardGroup>
