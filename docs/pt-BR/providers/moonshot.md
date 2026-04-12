---
read_when:
    - Você quer configurar o Moonshot K2 (Moonshot Open Platform) em comparação com o Kimi Coding
    - Você precisa entender endpoints, chaves e refs de modelo separados
    - Você quer uma configuração de copiar e colar para qualquer um dos provedores
summary: Configure Moonshot K2 vs Kimi Coding (provedores e chaves separados)
title: Moonshot AI
x-i18n:
    generated_at: "2026-04-12T23:31:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3f261f83a9b37e4fffb0cd0803e0c64f27eae8bae91b91d8a781a030663076f8
    source_path: providers/moonshot.md
    workflow: 15
---

# Moonshot AI (Kimi)

A Moonshot fornece a API Kimi com endpoints compatíveis com OpenAI. Configure o
provedor e defina o modelo padrão como `moonshot/kimi-k2.5`, ou use
Kimi Coding com `kimi/kimi-code`.

<Warning>
Moonshot e Kimi Coding são **provedores separados**. As chaves não são intercambiáveis, os endpoints são diferentes, e as refs de modelo também são diferentes (`moonshot/...` vs `kimi/...`).
</Warning>

## Catálogo de modelos integrado

[//]: # "moonshot-kimi-k2-ids:start"

| Ref. do modelo                    | Nome                   | Raciocínio | Entrada      | Contexto | Saída máx. |
| --------------------------------- | ---------------------- | ---------- | ------------ | -------- | ---------- |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | Não        | text, image  | 262,144  | 262,144    |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | Sim        | text         | 262,144  | 262,144    |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | Sim        | text         | 262,144  | 262,144    |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | Não        | text         | 256,000  | 16,384     |

[//]: # "moonshot-kimi-k2-ids:end"

## Primeiros passos

Escolha seu provedor e siga as etapas de configuração.

<Tabs>
  <Tab title="API Moonshot">
    **Ideal para:** modelos Kimi K2 por meio da Moonshot Open Platform.

    <Steps>
      <Step title="Escolha a região do endpoint">
        | Opção de autenticação   | Endpoint                       | Região        |
        | ----------------------- | ------------------------------ | ------------- |
        | `moonshot-api-key`      | `https://api.moonshot.ai/v1`   | Internacional |
        | `moonshot-api-key-cn`   | `https://api.moonshot.cn/v1`   | China         |
      </Step>
      <Step title="Execute o onboarding">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        Ou, para o endpoint da China:

        ```bash
        openclaw onboard --auth-choice moonshot-api-key-cn
        ```
      </Step>
      <Step title="Defina um modelo padrão">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "moonshot/kimi-k2.5" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verifique se os modelos estão disponíveis">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
    </Steps>

    ### Exemplo de configuração

    ```json5
    {
      env: { MOONSHOT_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "moonshot/kimi-k2.5" },
          models: {
            // moonshot-kimi-k2-aliases:start
            "moonshot/kimi-k2.5": { alias: "Kimi K2.5" },
            "moonshot/kimi-k2-thinking": { alias: "Kimi K2 Thinking" },
            "moonshot/kimi-k2-thinking-turbo": { alias: "Kimi K2 Thinking Turbo" },
            "moonshot/kimi-k2-turbo": { alias: "Kimi K2 Turbo" },
            // moonshot-kimi-k2-aliases:end
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          moonshot: {
            baseUrl: "https://api.moonshot.ai/v1",
            apiKey: "${MOONSHOT_API_KEY}",
            api: "openai-completions",
            models: [
              // moonshot-kimi-k2-models:start
              {
                id: "kimi-k2.5",
                name: "Kimi K2.5",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-thinking",
                name: "Kimi K2 Thinking",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-thinking-turbo",
                name: "Kimi K2 Thinking Turbo",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-turbo",
                name: "Kimi K2 Turbo",
                reasoning: false,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 256000,
                maxTokens: 16384,
              },
              // moonshot-kimi-k2-models:end
            ],
          },
        },
      },
    }
    ```

  </Tab>

  <Tab title="Kimi Coding">
    **Ideal para:** tarefas focadas em código por meio do endpoint Kimi Coding.

    <Note>
    O Kimi Coding usa uma chave de API diferente e um prefixo de provedor diferente (`kimi/...`) em relação ao Moonshot (`moonshot/...`). A ref de modelo legada `kimi/k2p5` continua sendo aceita como id de compatibilidade.
    </Note>

    <Steps>
      <Step title="Execute o onboarding">
        ```bash
        openclaw onboard --auth-choice kimi-code-api-key
        ```
      </Step>
      <Step title="Defina um modelo padrão">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "kimi/kimi-code" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verifique se o modelo está disponível">
        ```bash
        openclaw models list --provider kimi
        ```
      </Step>
    </Steps>

    ### Exemplo de configuração

    ```json5
    {
      env: { KIMI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "kimi/kimi-code" },
          models: {
            "kimi/kimi-code": { alias: "Kimi" },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

## Pesquisa na web do Kimi

O OpenClaw também inclui **Kimi** como um provedor `web_search`, apoiado pela
pesquisa na web da Moonshot.

<Steps>
  <Step title="Execute a configuração interativa de pesquisa na web">
    ```bash
    openclaw configure --section web
    ```

    Escolha **Kimi** na seção de pesquisa na web para armazenar
    `plugins.entries.moonshot.config.webSearch.*`.

  </Step>
  <Step title="Configure a região da pesquisa na web e o modelo">
    A configuração interativa solicita:

    | Ajuste               | Opções                                                               |
    | -------------------- | -------------------------------------------------------------------- |
    | Região da API        | `https://api.moonshot.ai/v1` (internacional) ou `https://api.moonshot.cn/v1` (China) |
    | Modelo de pesquisa na web | O padrão é `kimi-k2.5`                                         |

  </Step>
</Steps>

A configuração fica em `plugins.entries.moonshot.config.webSearch`:

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // ou use KIMI_API_KEY / MOONSHOT_API_KEY
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.5",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "kimi",
      },
    },
  },
}
```

## Avançado

<AccordionGroup>
  <Accordion title="Modo nativo de raciocínio">
    O Moonshot Kimi oferece suporte a raciocínio nativo binário:

    - `thinking: { type: "enabled" }`
    - `thinking: { type: "disabled" }`

    Configure isso por modelo via `agents.defaults.models.<provider/model>.params`:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "moonshot/kimi-k2.5": {
              params: {
                thinking: { type: "disabled" },
              },
            },
          },
        },
      },
    }
    ```

    O OpenClaw também mapeia níveis de `/think` em tempo de execução para o Moonshot:

    | Nível de `/think`     | Comportamento do Moonshot |
    | --------------------- | ------------------------- |
    | `/think off`          | `thinking.type=disabled`  |
    | Qualquer nível diferente de off | `thinking.type=enabled` |

    <Warning>
    Quando o raciocínio do Moonshot está ativado, `tool_choice` precisa ser `auto` ou `none`. O OpenClaw normaliza valores incompatíveis de `tool_choice` para `auto` por compatibilidade.
    </Warning>

  </Accordion>

  <Accordion title="Compatibilidade de uso com streaming">
    Os endpoints nativos do Moonshot (`https://api.moonshot.ai/v1` e
    `https://api.moonshot.cn/v1`) anunciam compatibilidade de uso com streaming no
    transporte compartilhado `openai-completions`. O OpenClaw baseia isso nas
    capacidades do endpoint, então ids de provedor personalizados compatíveis que apontam para os mesmos hosts nativos
    do Moonshot herdam o mesmo comportamento de uso com streaming.
  </Accordion>

  <Accordion title="Referência de endpoint e ref de modelo">
    | Provedor      | Prefixo da ref de modelo | Endpoint                      | Variável env de autenticação |
    | ------------- | ------------------------ | ----------------------------- | ---------------------------- |
    | Moonshot      | `moonshot/`              | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`           |
    | Moonshot CN   | `moonshot/`              | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`           |
    | Kimi Coding   | `kimi/`                  | Endpoint Kimi Coding          | `KIMI_API_KEY`               |
    | Pesquisa na web | N/A                    | Igual à região da API Moonshot | `KIMI_API_KEY` ou `MOONSHOT_API_KEY` |

    - A pesquisa na web do Kimi usa `KIMI_API_KEY` ou `MOONSHOT_API_KEY`, e usa por padrão `https://api.moonshot.ai/v1` com o modelo `kimi-k2.5`.
    - Substitua preços e metadados de contexto em `models.providers` se necessário.
    - Se a Moonshot publicar limites de contexto diferentes para um modelo, ajuste `contextWindow` adequadamente.

  </Accordion>
</AccordionGroup>

## Relacionados

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Pesquisa na web" href="/tools/web-search" icon="magnifying-glass">
    Configuração de provedores de pesquisa na web, incluindo Kimi.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Esquema completo de configuração para provedores, modelos e plugins.
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    Gerenciamento de chaves de API da Moonshot e documentação.
  </Card>
</CardGroup>
