---
read_when:
    - Você quer modelos Z.AI / GLM no OpenClaw
    - Você precisa de uma configuração simples de ZAI_API_KEY
summary: Use a Z.AI (modelos GLM) com o OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-07-12T15:42:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: ab29149da39cbf82fe041ea5932a860c461320e14bf26f83f69060d7ae0ae00a
    source_path: providers/zai.md
    workflow: 16
---

  Z.AI é a plataforma de API para modelos **GLM**. Ela fornece APIs REST para GLM e
  usa chaves de API para autenticação. Crie sua chave de API no console da Z.AI.
  O OpenClaw usa o provedor `zai` com uma chave de API da Z.AI.

  | Propriedade | Valor                                        |
  | ----------- | -------------------------------------------- |
  | Provedor    | `zai`                                        |
  | Pacote      | `@openclaw/zai-provider`                     |
  | Autenticação | `ZAI_API_KEY` (alias legado: `Z_AI_API_KEY`) |
  | API         | Z.AI Chat Completions (autenticação Bearer)  |

  ## Modelos GLM

  GLM é uma família de modelos, não um provedor separado. No OpenClaw, os modelos GLM usam
  referências como `zai/glm-5.2`: provedor `zai`, ID do modelo `glm-5.2`.

  ## Primeiros passos

  Primeiro, instale o Plugin do provedor:

  ```bash
  openclaw plugins install @openclaw/zai-provider
  ```

  <Tabs>
  <Tab title="Detecção automática do endpoint">
    **Ideal para:** a maioria dos usuários. O OpenClaw testa os endpoints compatíveis da Z.AI usando sua chave de API e aplica automaticamente a URL base correta.

    <Steps>
      <Step title="Executar a configuração inicial">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="Verificar se o modelo está listado">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Endpoint regional explícito">
    **Ideal para:** usuários que desejam forçar um Coding Plan específico ou uma superfície de API geral.

    <Steps>
      <Step title="Escolha a opção de integração inicial adequada">
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
      <Step title="Verifique se o modelo está listado">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

### Endpoints

| Opção de integração | URL base                                      | Modelo padrão |
| ------------------- | --------------------------------------------- | ------------- |
| `zai-global`        | `https://api.z.ai/api/paas/v4`                | `glm-5.1`     |
| `zai-cn`            | `https://open.bigmodel.cn/api/paas/v4`        | `glm-5.1`     |
| `zai-coding-global` | `https://api.z.ai/api/coding/paas/v4`         | `glm-5.2`     |
| `zai-coding-cn`     | `https://open.bigmodel.cn/api/coding/paas/v4` | `glm-5.2`     |

`zai-api-key` detecta automaticamente uma dessas quatro opções testando sua chave na API
de conclusões de chat de cada endpoint, verificando os endpoints gerais (`zai-global`,
depois `zai-cn`) antes dos endpoints do Coding Plan (`zai-coding-global`, depois
`zai-coding-cn`) e parando no primeiro endpoint que aceitar uma solicitação.
Use uma opção `--auth-choice` explícita para forçar um endpoint do Coding Plan se sua chave
funcionar em ambos.

## Exemplo de configuração

<Tip>
`zai-api-key` permite que o OpenClaw detecte o endpoint correspondente da Z.AI pela chave e
aplique automaticamente a URL base correta. Use as opções regionais explícitas quando
quiser impor um Coding Plan específico ou uma superfície de API geral.
</Tip>

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  models: {
    providers: {
      zai: {
        // O GLM-5.2 usa o endpoint do Coding Plan.
        baseUrl: "https://api.z.ai/api/coding/paas/v4",
      },
    },
  },
  agents: { defaults: { model: { primary: "zai/glm-5.2" } } },
}
```

## Catálogo integrado

O plugin do provedor `zai` inclui seu catálogo no manifesto do plugin, portanto a listagem
somente leitura pode exibir entradas conhecidas do GLM sem carregar o runtime do provedor:

```bash
openclaw models list --all --provider zai
```

O catálogo baseado no manifesto inclui atualmente:

| Referência do modelo | Observações                              |
| -------------------- | ---------------------------------------- |
| `zai/glm-5.2`        | Padrão do Coding Plan; contexto de 1M    |
| `zai/glm-5.1`        | Padrão da API geral                      |
| `zai/glm-5`          |                                          |
| `zai/glm-5-turbo`    |                                          |
| `zai/glm-5v-turbo`   |                                          |
| `zai/glm-4.7`        |                                          |
| `zai/glm-4.7-flash`  |                                          |
| `zai/glm-4.7-flashx` |                                          |
| `zai/glm-4.6`        |                                          |
| `zai/glm-4.6v`       |                                          |
| `zai/glm-4.5`        |                                          |
| `zai/glm-4.5-air`    |                                          |
| `zai/glm-4.5-flash`  |                                          |
| `zai/glm-4.5v`       |                                          |

<Tip>
Os modelos GLM estão disponíveis como `zai/<model>` (exemplo: `zai/glm-5`).
</Tip>

<Note>
A configuração do Coding Plan usa `zai/glm-5.2` por padrão; a configuração da API geral mantém
`zai/glm-5.1`. Nos endpoints do Coding Plan, a detecção automática usa como alternativas
`glm-5.1` e depois `glm-4.7` quando a chave/o plano não disponibiliza o GLM-5.2. As versões
e a disponibilidade do GLM podem mudar; execute `openclaw models list --all --provider zai`
para ver o catálogo conhecido pela sua versão instalada.
</Note>

## Níveis de raciocínio

<Tabs>
  <Tab title="GLM-5.2">
    Faixa completa: `off`, `low`, `high`, `max` (padrão: `off`). O OpenClaw mapeia
    `low` e `high` para o esforço de raciocínio `high` da Z.AI e `max` para o esforço
    `max` da Z.AI, por meio de `reasoning_effort` no payload da solicitação.
  </Tab>
  <Tab title="Outros modelos GLM">
    Apenas alternância binária: `off` e `low` (exibido como `on` nos seletores), com
    `off` como padrão. Definir o raciocínio como `off` envia `thinking: { type: "disabled" }`;
    qualquer outro nível não altera o payload da solicitação (aplica-se o comportamento
    padrão de raciocínio da própria Z.AI).
  </Tab>
</Tabs>

Definir o raciocínio como `off` evita respostas que consomem o orçamento de saída com
`reasoning_content` antes do texto visível.

## Configuração avançada

<AccordionGroup>
  <Accordion title="Resolução futura de modelos GLM-5 desconhecidos">
    IDs `glm-5*` desconhecidos ainda são resolvidos antecipadamente no caminho do provedor
    por meio da sintetização de metadados pertencentes ao provedor com base no modelo
    `glm-4.7`, quando o ID corresponde ao formato atual da família GLM-5.
  </Accordion>

  <Accordion title="Streaming de chamadas de ferramentas">
    `tool_stream` está ativado por padrão para o streaming de chamadas de ferramentas da Z.AI. Para desativá-lo:

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

  <Accordion title="Raciocínio preservado">
    O raciocínio preservado é opcional porque a Z.AI exige que todo o histórico de
    `reasoning_content` seja reproduzido, o que aumenta os tokens do prompt. Ative-o
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

    Quando ativado e o raciocínio está habilitado, o OpenClaw envia
    `thinking: { type: "enabled", clear_thinking: false }` e reproduz o
    `reasoning_content` anterior para a mesma transcrição compatível com a OpenAI. A chave
    de parâmetro snake_case `preserve_thinking` funciona como um alias.

    Usuários avançados ainda podem substituir o payload exato do provedor com
    `params.extra_body.thinking`.

  </Accordion>

  <Accordion title="Compreensão de imagens">
    O Plugin da Z.AI registra a compreensão de imagens.

    | Propriedade | Valor      |
    | ----------- | ---------- |
    | Modelo      | `glm-4.6v` |

    A compreensão de imagens é resolvida automaticamente com base na autenticação da Z.AI configurada — nenhuma
    configuração adicional é necessária.

  </Accordion>

  <Accordion title="Detalhes de autenticação">
    - A Z.AI usa autenticação Bearer com sua chave de API.
    - A opção de integração `zai-api-key` detecta automaticamente o endpoint correspondente da Z.AI, testando com sua chave os endpoints compatíveis.
    - Use as opções regionais explícitas (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) quando quiser forçar uma superfície de API específica.
    - A variável de ambiente legada `Z_AI_API_KEY` ainda é aceita; o OpenClaw a copia para `ZAI_API_KEY` na inicialização se `ZAI_API_KEY` não estiver definida.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelos" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, referências de modelos e comportamento de failover.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Esquema completo de configuração do OpenClaw, incluindo configurações de provedores e modelos.
  </Card>
</CardGroup>
