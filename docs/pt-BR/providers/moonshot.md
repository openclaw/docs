---
read_when:
    - Você quer a configuração do Moonshot K2 (Moonshot Open Platform) vs Kimi Coding
    - Você precisa entender endpoints, chaves e referências de modelo separados
    - Você quer uma configuração para copiar e colar para qualquer um dos provedores
summary: Configurar Moonshot K2 versus Kimi Coding (provedores + chaves separados)
title: Moonshot AI
x-i18n:
    generated_at: "2026-05-10T19:48:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0f6396d91ac8c1f698531ce067f79d4a4de7a5c7a166099c0fe4b7e5b78fde9e
    source_path: providers/moonshot.md
    workflow: 16
---

A Moonshot fornece a API Kimi com endpoints compatíveis com OpenAI. Configure o
provedor e defina o modelo padrão como `moonshot/kimi-k2.6`, ou use
Kimi Coding com `kimi/kimi-for-coding`.

<Warning>
Moonshot e Kimi Coding são **provedores separados**. As chaves não são intercambiáveis, os endpoints são diferentes e as refs de modelo diferem (`moonshot/...` vs `kimi/...`).
</Warning>

## Catálogo de modelos integrado

[//]: # "moonshot-kimi-k2-ids:start"

| Ref do modelo                    | Nome                   | Raciocínio | Entrada     | Contexto | Saída máx. |
| --------------------------------- | ---------------------- | ---------- | ----------- | -------- | ---------- |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | Não        | texto, imagem | 262,144 | 262,144    |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | Não        | texto, imagem | 262,144 | 262,144    |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | Sim        | texto       | 262,144  | 262,144    |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | Sim        | texto       | 262,144  | 262,144    |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | Não        | texto       | 256,000  | 16,384     |

[//]: # "moonshot-kimi-k2-ids:end"

As estimativas de custo incluídas para os modelos K2 atuais hospedados pela Moonshot usam as
tarifas publicadas de pagamento conforme o uso da Moonshot: Kimi K2.6 custa $0.16/MTok por acerto de cache,
$0.95/MTok de entrada e $4.00/MTok de saída; Kimi K2.5 custa $0.10/MTok por acerto de cache,
$0.60/MTok de entrada e $3.00/MTok de saída. Outras entradas legadas do catálogo mantêm
placeholders de custo zero, a menos que você as substitua na configuração.

## Primeiros passos

Escolha seu provedor e siga as etapas de configuração.

<Tabs>
  <Tab title="API Moonshot">
    **Melhor para:** modelos Kimi K2 via Moonshot Open Platform.

    <Steps>
      <Step title="Escolha sua região de endpoint">
        | Opção de autenticação | Endpoint                       | Região        |
        | ---------------------- | ------------------------------ | ------------- |
        | `moonshot-api-key`     | `https://api.moonshot.ai/v1`   | Internacional |
        | `moonshot-api-key-cn`  | `https://api.moonshot.cn/v1`   | China         |
      </Step>
      <Step title="Execute o onboarding">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        Ou para o endpoint da China:

        ```bash
        openclaw onboard --auth-choice moonshot-api-key-cn
        ```
      </Step>
      <Step title="Defina um modelo padrão">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "moonshot/kimi-k2.6" },
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
      <Step title="Execute um teste rápido ao vivo">
        Use um diretório de estado isolado quando quiser verificar o acesso ao modelo e o acompanhamento de custos
        sem tocar nas suas sessões normais:

        ```bash
        OPENCLAW_CONFIG_PATH=/tmp/openclaw-kimi/openclaw.json \
        OPENCLAW_STATE_DIR=/tmp/openclaw-kimi \
        openclaw agent --local \
          --session-id live-kimi-cost \
          --message 'Reply exactly: KIMI_LIVE_OK' \
          --thinking off \
          --json
        ```

        A resposta JSON deve relatar `provider: "moonshot"` e
        `model: "kimi-k2.6"`. A entrada de transcrição do assistente armazena o
        uso normalizado de tokens mais o custo estimado em `usage.cost` quando a Moonshot retorna
        metadados de uso.
      </Step>
    </Steps>

    ### Exemplo de configuração

    ```json5
    {
      env: { MOONSHOT_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "moonshot/kimi-k2.6" },
          models: {
            // moonshot-kimi-k2-aliases:start
            "moonshot/kimi-k2.6": { alias: "Kimi K2.6" },
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
                id: "kimi-k2.6",
                name: "Kimi K2.6",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2.5",
                name: "Kimi K2.5",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.6, output: 3, cacheRead: 0.1, cacheWrite: 0 },
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
    **Melhor para:** tarefas com foco em código via endpoint Kimi Coding.

    <Note>
    Kimi Coding usa uma chave de API e um prefixo de provedor diferentes (`kimi/...`) da Moonshot (`moonshot/...`). A ref de modelo estável da API é `kimi/kimi-for-coding`; as refs legadas `kimi/kimi-code` e `kimi/k2p5` continuam aceitas e são normalizadas para esse id de modelo da API.
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
              model: { primary: "kimi/kimi-for-coding" },
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
          model: { primary: "kimi/kimi-for-coding" },
          models: {
            "kimi/kimi-for-coding": { alias: "Kimi" },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

## Busca na web do Kimi

O OpenClaw também inclui **Kimi** como um provedor de `web_search`, apoiado pela busca na web da Moonshot.

<Steps>
  <Step title="Execute a configuração interativa da busca na web">
    ```bash
    openclaw configure --section web
    ```

    Escolha **Kimi** na seção de busca na web para armazenar
    `plugins.entries.moonshot.config.webSearch.*`.

  </Step>
  <Step title="Configure a região e o modelo da busca na web">
    A configuração interativa solicita:

    | Configuração        | Opções                                                               |
    | ------------------- | -------------------------------------------------------------------- |
    | Região da API       | `https://api.moonshot.ai/v1` (internacional) ou `https://api.moonshot.cn/v1` (China) |
    | Modelo de busca na web | O padrão é `kimi-k2.6`                                             |

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
            apiKey: "sk-...", // or use KIMI_API_KEY / MOONSHOT_API_KEY
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.6",
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

## Configuração avançada

<AccordionGroup>
  <Accordion title="Modo de pensamento nativo">
    O Moonshot Kimi oferece suporte a pensamento nativo binário:

    - `thinking: { type: "enabled" }`
    - `thinking: { type: "disabled" }`

    Configure-o por modelo via `agents.defaults.models.<provider/model>.params`:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "moonshot/kimi-k2.6": {
              params: {
                thinking: { type: "disabled" },
              },
            },
          },
        },
      },
    }
    ```

    O OpenClaw também mapeia níveis de `/think` em tempo de execução para a Moonshot:

    | Nível de `/think`   | Comportamento da Moonshot |
    | -------------------- | -------------------------- |
    | `/think off`         | `thinking.type=disabled`   |
    | Qualquer nível que não seja off | `thinking.type=enabled`    |

    <Warning>
    Quando o pensamento da Moonshot está ativado, `tool_choice` deve ser `auto` ou `none`. O OpenClaw normaliza valores incompatíveis de `tool_choice` para `auto` por compatibilidade.
    </Warning>

    O Kimi K2.6 também aceita um campo opcional `thinking.keep` que controla
    a retenção de múltiplos turnos de `reasoning_content`. Defina-o como `"all"` para manter o
    raciocínio completo entre turnos; omita-o (ou deixe-o como `null`) para usar a estratégia
    padrão do servidor. O OpenClaw só encaminha `thinking.keep` para
    `moonshot/kimi-k2.6` e o remove de outros modelos.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "moonshot/kimi-k2.6": {
              params: {
                thinking: { type: "enabled", keep: "all" },
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Sanitização de ids de chamada de ferramenta">
    O Moonshot Kimi serve ids de tool_call no formato `functions.<name>:<index>`. O OpenClaw os preserva sem alterações para que chamadas de ferramenta de múltiplos turnos continuem funcionando.

    Para forçar sanitização estrita em um provedor personalizado compatível com OpenAI, defina `sanitizeToolCallIds: true`:

    ```json5
    {
      models: {
        providers: {
          "my-kimi-proxy": {
            api: "openai-completions",
            sanitizeToolCallIds: true,
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Compatibilidade de uso em streaming">
    Endpoints nativos da Moonshot (`https://api.moonshot.ai/v1` e
    `https://api.moonshot.cn/v1`) anunciam compatibilidade de uso em streaming no
    transporte compartilhado `openai-completions`. O OpenClaw baseia isso nas
    capacidades do endpoint, então ids de provedores personalizados compatíveis que miram os mesmos hosts nativos da
    Moonshot herdam o mesmo comportamento de uso em streaming.

    Com o preço incluído do K2.6, o uso transmitido por streaming que inclui tokens de entrada, saída
    e leitura de cache também é convertido em custo local estimado em USD para
    `/status`, `/usage full`, `/usage cost` e contabilidade de sessão baseada em transcrição.

  </Accordion>

  <Accordion title="Referência de endpoint e referência de modelo">
    | Provedor   | Prefixo da referência do modelo | Endpoint                      | Variável de ambiente de autenticação        |
    | ---------- | ---------------- | ----------------------------- | ------------------- |
    | Moonshot   | `moonshot/`      | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`  |
    | Moonshot CN| `moonshot/`      | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`  |
    | Kimi Coding| `kimi/`          | Endpoint do Kimi Coding          | `KIMI_API_KEY`      |
    | Busca na Web | N/A              | Igual à região da API da Moonshot   | `KIMI_API_KEY` ou `MOONSHOT_API_KEY` |

    - A busca na Web do Kimi usa `KIMI_API_KEY` ou `MOONSHOT_API_KEY`, e usa como padrão `https://api.moonshot.ai/v1` com o modelo `kimi-k2.6`.
    - Substitua os metadados de preço e contexto em `models.providers`, se necessário.
    - Se a Moonshot publicar limites de contexto diferentes para um modelo, ajuste `contextWindow` de acordo.

  </Accordion>
</AccordionGroup>

## Relacionados

<CardGroup cols={2}>
  <Card title="Seleção de modelos" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolhendo provedores, referências de modelo e comportamento de failover.
  </Card>
  <Card title="Busca na Web" href="/pt-BR/tools/web" icon="magnifying-glass">
    Configurando provedores de busca na Web, incluindo Kimi.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Esquema de configuração completo para provedores, modelos e plugins.
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    Gerenciamento e documentação de chaves de API da Moonshot.
  </Card>
</CardGroup>
