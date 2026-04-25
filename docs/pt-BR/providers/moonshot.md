---
read_when:
    - Você quer configurar Moonshot K2 (Moonshot Open Platform) vs Kimi Coding
    - Você precisa entender endpoints, chaves e referências de modelos separados
    - Você quer uma configuração pronta para copiar e colar para qualquer um dos providers
summary: Configurar Moonshot K2 vs Kimi Coding (providers e chaves separados)
title: Moonshot AI
x-i18n:
    generated_at: "2026-04-25T13:54:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: fd6ababe59354a302975b68f4cdb12a623647f8e5cadfb8ae58a74bb2934ce65
    source_path: providers/moonshot.md
    workflow: 15
---

A Moonshot fornece a API Kimi com endpoints compatíveis com OpenAI. Configure o
provider e defina o modelo padrão como `moonshot/kimi-k2.6`, ou use
Kimi Coding com `kimi/kimi-code`.

<Warning>
Moonshot e Kimi Coding são **providers separados**. As chaves não são intercambiáveis, os endpoints são diferentes e as referências de modelos também são diferentes (`moonshot/...` vs `kimi/...`).
</Warning>

## Catálogo de modelos incluído

[//]: # "moonshot-kimi-k2-ids:start"

| Model ref                         | Nome                   | Raciocínio | Entrada     | Contexto | Saída máx. |
| --------------------------------- | ---------------------- | ---------- | ----------- | -------- | ---------- |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | Não        | text, image | 262,144  | 262,144    |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | Não        | text, image | 262,144  | 262,144    |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | Sim        | text        | 262,144  | 262,144    |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | Sim        | text        | 262,144  | 262,144    |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | Não        | text        | 256,000  | 16,384     |

[//]: # "moonshot-kimi-k2-ids:end"

As estimativas de custo incluídas para os modelos K2 atuais hospedados pela Moonshot usam as
tarifas pay-as-you-go publicadas pela Moonshot: Kimi K2.6 custa $0.16/MTok em cache hit,
$0.95/MTok de entrada e $4.00/MTok de saída; Kimi K2.5 custa $0.10/MTok em cache hit,
$0.60/MTok de entrada e $3.00/MTok de saída. Outras entradas legadas do catálogo mantêm
placeholders de custo zero, a menos que você os substitua na configuração.

## Primeiros passos

Escolha seu provider e siga as etapas de configuração.

<Tabs>
  <Tab title="Moonshot API">
    **Ideal para:** modelos Kimi K2 via Moonshot Open Platform.

    <Steps>
      <Step title="Escolha a região do seu endpoint">
        | Escolha de auth       | Endpoint                       | Região        |
        | --------------------- | ------------------------------ | ------------- |
        | `moonshot-api-key`    | `https://api.moonshot.ai/v1`   | Internacional |
        | `moonshot-api-key-cn` | `https://api.moonshot.cn/v1`   | China         |
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
      <Step title="Execute um teste smoke ao vivo">
        Use um diretório de estado isolado quando quiser verificar o acesso ao modelo e o rastreamento de custo
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

        A resposta JSON deve informar `provider: "moonshot"` e
        `model: "kimi-k2.6"`. A entrada de transcrição do assistente armazena o uso de tokens normalizado
        além do custo estimado em `usage.cost` quando a Moonshot retorna
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
    **Ideal para:** tarefas focadas em código via endpoint do Kimi Coding.

    <Note>
    O Kimi Coding usa uma chave de API diferente e um prefixo de provider diferente (`kimi/...`) em relação à Moonshot (`moonshot/...`). A referência de modelo legada `kimi/k2p5` continua sendo aceita como ID de compatibilidade.
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

O OpenClaw também inclui **Kimi** como provider de `web_search`, com suporte da pesquisa na web da Moonshot.

<Steps>
  <Step title="Execute a configuração interativa da pesquisa na web">
    ```bash
    openclaw configure --section web
    ```

    Escolha **Kimi** na seção de pesquisa na web para armazenar
    `plugins.entries.moonshot.config.webSearch.*`.

  </Step>
  <Step title="Configure a região da pesquisa na web e o modelo">
    A configuração interativa solicita:

    | Configuração        | Opções                                                               |
    | ------------------- | -------------------------------------------------------------------- |
    | Região da API       | `https://api.moonshot.ai/v1` (internacional) ou `https://api.moonshot.cn/v1` (China) |
    | Modelo de pesquisa na web | O padrão é `kimi-k2.6`                                         |

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
  <Accordion title="Modo nativo de raciocínio">
    O Moonshot Kimi oferece suporte a raciocínio nativo binário:

    - `thinking: { type: "enabled" }`
    - `thinking: { type: "disabled" }`

    Configure isso por modelo em `agents.defaults.models.<provider/model>.params`:

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

    | nível de `/think`    | comportamento da Moonshot    |
    | -------------------- | ---------------------------- |
    | `/think off`         | `thinking.type=disabled`     |
    | Qualquer nível não-off | `thinking.type=enabled`    |

    <Warning>
    Quando o raciocínio da Moonshot está ativado, `tool_choice` deve ser `auto` ou `none`. O OpenClaw normaliza valores incompatíveis de `tool_choice` para `auto` por compatibilidade.
    </Warning>

    O Kimi K2.6 também aceita um campo opcional `thinking.keep` que controla
    a retenção de `reasoning_content` em múltiplos turnos. Defina-o como `"all"` para manter todo o
    raciocínio entre os turnos; omita-o (ou deixe-o como `null`) para usar a estratégia
    padrão do servidor. O OpenClaw só encaminha `thinking.keep` para
    `moonshot/kimi-k2.6` e o remove dos outros modelos.

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

  <Accordion title="Sanitização de IDs de chamadas de ferramenta">
    O Moonshot Kimi fornece IDs de `tool_call` no formato `functions.<name>:<index>`. O OpenClaw os preserva sem alterações para que as chamadas de ferramenta em múltiplos turnos continuem funcionando.

    Para forçar uma sanitização estrita em um provider personalizado compatível com OpenAI, defina `sanitizeToolCallIds: true`:

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

  <Accordion title="Compatibilidade de uso com streaming">
    Os endpoints nativos da Moonshot (`https://api.moonshot.ai/v1` e
    `https://api.moonshot.cn/v1`) anunciam compatibilidade de uso com streaming no
    transporte compartilhado `openai-completions`. O OpenClaw baseia isso nas capacidades do endpoint,
    então IDs de provider personalizados compatíveis que apontam para os mesmos hosts nativos da
    Moonshot herdam o mesmo comportamento de uso com streaming.

    Com o preço incluído do K2.6, o uso em streaming que inclui tokens de entrada, saída
    e leitura de cache também é convertido em custo estimado local em USD para
    `/status`, `/usage full`, `/usage cost` e para a contabilidade de sessão baseada em
    transcrição.

  </Accordion>

  <Accordion title="Referência de endpoint e model ref">
    | Provider    | Prefixo de model ref | Endpoint                      | Variável de ambiente de auth |
    | ----------- | -------------------- | ----------------------------- | ---------------------------- |
    | Moonshot    | `moonshot/`          | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`           |
    | Moonshot CN | `moonshot/`          | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`           |
    | Kimi Coding | `kimi/`              | Endpoint do Kimi Coding       | `KIMI_API_KEY`               |
    | Pesquisa na web | N/A              | Igual à região da API Moonshot | `KIMI_API_KEY` ou `MOONSHOT_API_KEY` |

    - A pesquisa na web do Kimi usa `KIMI_API_KEY` ou `MOONSHOT_API_KEY` e, por padrão, usa `https://api.moonshot.ai/v1` com o modelo `kimi-k2.6`.
    - Substitua metadados de preço e contexto em `models.providers`, se necessário.
    - Se a Moonshot publicar limites de contexto diferentes para um modelo, ajuste `contextWindow` conforme necessário.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de providers, referências de modelos e comportamento de failover.
  </Card>
  <Card title="Pesquisa na web" href="/pt-BR/tools/web" icon="magnifying-glass">
    Configuração de providers de pesquisa na web, incluindo Kimi.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Esquema completo de configuração para providers, modelos e plugins.
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    Gerenciamento de chaves de API e documentação da Moonshot.
  </Card>
</CardGroup>
