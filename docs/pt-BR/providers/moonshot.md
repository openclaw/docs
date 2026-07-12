---
read_when:
    - Você quer configurar o Moonshot K2 (Moonshot Open Platform) ou o Kimi Coding
    - Você precisa entender endpoints, chaves e referências de modelos separados
    - Você quer uma configuração pronta para copiar e colar para qualquer um dos provedores
summary: Configurar Moonshot K2 vs. Kimi Coding (provedores + chaves separados)
title: Moonshot AI
x-i18n:
    generated_at: "2026-07-12T15:33:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c917a595337fc2138601245f4c7055815859dfa3b2ddf90a56c980a7a4e09744
    source_path: providers/moonshot.md
    workflow: 16
---

A Moonshot fornece a API Kimi com endpoints compatíveis com OpenAI. Defina o
modelo padrão como `moonshot/kimi-k2.6` para a Moonshot Open Platform ou
`kimi/kimi-for-coding` para o Kimi Coding.

<Warning>
Moonshot e Kimi Coding são **provedores separados**, cada um distribuído como um Plugin externo distinto. As chaves não são intercambiáveis, os endpoints são diferentes e as referências de modelo são diferentes (`moonshot/...` vs `kimi/...`).
</Warning>

## Catálogo de modelos integrado

[//]: # "moonshot-kimi-k2-ids:start"

| Referência do modelo               | Nome                   | Raciocínio       | Entrada       | Contexto | Saída máxima |
| ---------------------------------- | ---------------------- | ---------------- | ------------- | -------- | ------------ |
| `moonshot/kimi-k2.6`               | Kimi K2.6              | Não              | texto, imagem | 262,144  | 262,144      |
| `moonshot/kimi-k2.7-code`          | Kimi K2.7 Code         | Sempre ativado   | texto, imagem | 262,144  | 262,144      |
| `moonshot/kimi-k2.5`               | Kimi K2.5              | Não              | texto, imagem | 262,144  | 262,144      |
| `moonshot/kimi-k2-thinking`        | Kimi K2 Thinking       | Sim              | texto         | 262,144  | 262,144      |
| `moonshot/kimi-k2-thinking-turbo`  | Kimi K2 Thinking Turbo | Sim              | texto         | 262,144  | 262,144      |
| `moonshot/kimi-k2-turbo`           | Kimi K2 Turbo          | Não              | texto         | 256,000  | 16,384       |

[//]: # "moonshot-kimi-k2-ids:end"

As estimativas de custo do catálogo usam as tarifas de pagamento conforme o uso
publicadas pela Moonshot: Kimi K2.7 Code custa $0.19/MTok para acerto de cache,
$0.95/MTok de entrada e $4.00/MTok de saída; Kimi K2.6 custa $0.16/MTok para
acerto de cache, $0.95/MTok de entrada e $4.00/MTok de saída; Kimi K2.5 custa
$0.10/MTok para acerto de cache, $0.60/MTok de entrada e $3.00/MTok de saída.
As outras entradas do catálogo mantêm valores provisórios de custo zero, a
menos que você os substitua na configuração.

O Kimi K2.7 Code sempre usa raciocínio nativo. O OpenClaw expõe somente o estado
de raciocínio `on` para esse modelo e omite os campos de saída `thinking` e
`reasoning_effort`, conforme exigido pela Moonshot. Ele também omite
substituições de amostragem (`temperature`, `top_p`, `n`, `presence_penalty`,
`frequency_penalty`), que o K2.7 fixa nos padrões do provedor. O Kimi K2.6
continua sendo o padrão da configuração inicial.

## Primeiros passos

Moonshot e Kimi Coding são Plugins externos — instale um deles antes de
executar a configuração inicial.

<Tabs>
  <Tab title="API Moonshot">
    **Mais indicado para:** modelos Kimi K2 por meio da Moonshot Open Platform.

    <Steps>
      <Step title="Instale o Plugin">
        ```bash
        openclaw plugins install @openclaw/moonshot-provider
        openclaw gateway restart
        ```
      </Step>
      <Step title="Escolha a região do endpoint">
        | Opção de autenticação | Endpoint                       | Região        |
        | --------------------- | ------------------------------ | ------------- |
        | `moonshot-api-key`    | `https://api.moonshot.ai/v1`   | Internacional |
        | `moonshot-api-key-cn` | `https://api.moonshot.cn/v1`   | China         |
      </Step>
      <Step title="Execute a configuração inicial">
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
      <Step title="Execute um teste rápido em ambiente real">
        Use um diretório de estado isolado quando quiser verificar o acesso ao
        modelo e o acompanhamento de custos sem afetar suas sessões normais:

        ```bash
        OPENCLAW_CONFIG_PATH=/tmp/openclaw-kimi/openclaw.json \
        OPENCLAW_STATE_DIR=/tmp/openclaw-kimi \
        openclaw agent --local \
          --session-id live-kimi-cost \
          --message 'Responda exatamente: KIMI_LIVE_OK' \
          --thinking off \
          --json
        ```

        A resposta JSON deve informar `provider: "moonshot"` e
        `model: "kimi-k2.6"`. A entrada da transcrição do assistente armazena o
        uso normalizado de tokens e o custo estimado em `usage.cost` quando a
        Moonshot retorna metadados de uso.
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
            "moonshot/kimi-k2.7-code": { alias: "Kimi K2.7 Code" },
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
                id: "kimi-k2.7-code",
                name: "Kimi K2.7 Code",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.19, cacheWrite: 0 },
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
    **Mais indicado para:** tarefas voltadas a código por meio do endpoint do Kimi Coding.

    <Note>
    O Kimi Coding usa uma chave de API e um prefixo de provedor (`kimi/...`) diferentes dos usados pela Moonshot (`moonshot/...`). A referência estável do modelo é `kimi/kimi-for-coding`; as referências legadas `kimi/kimi-code` e `kimi/k2p5` continuam sendo aceitas e são normalizadas para esse ID de modelo.
    </Note>

    <Steps>
      <Step title="Instale o Plugin">
        ```bash
        openclaw plugins install @openclaw/kimi-provider
        openclaw gateway restart
        ```
      </Step>
      <Step title="Execute a configuração inicial">
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

## Pesquisa na web do Kimi

O Plugin da Moonshot também registra o **Kimi** como provedor de `web_search`,
com suporte da pesquisa na web da Moonshot.

<Steps>
  <Step title="Execute a configuração interativa da pesquisa na web">
    ```bash
    openclaw configure --section web
    ```

    Escolha **Kimi** na seção de pesquisa na web para armazenar
    `plugins.entries.moonshot.config.webSearch.*`.

  </Step>
  <Step title="Configure a região e o modelo da pesquisa na web">
    A configuração interativa solicita:

    | Configuração          | Opções                                                               |
    | --------------------- | -------------------------------------------------------------------- |
    | Região da API         | `https://api.moonshot.ai/v1` (internacional) ou `https://api.moonshot.cn/v1` (China) |
    | Modelo de pesquisa na web | O padrão é `kimi-k2.6`                                            |

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
  <Accordion title="Modo de raciocínio nativo">
    O Kimi K2.7 Code sempre usa raciocínio nativo. A Moonshot exige que os
    clientes omitam o campo `thinking` para esse modelo, portanto o OpenClaw
    expõe somente `on` e ignora configurações `off` obsoletas. O K2.7 também
    fixa `temperature`, `top_p`, `n`, `presence_penalty` e
    `frequency_penalty`; o OpenClaw omite as substituições configuradas para
    esses campos.

    Outros modelos Kimi da Moonshot oferecem suporte a raciocínio nativo binário:

    - `thinking: { type: "enabled" }`
    - `thinking: { type: "disabled" }`

    Configure-o para cada modelo por meio de `agents.defaults.models.<provider/model>.params`:

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

    O OpenClaw mapeia os níveis de `/think` em tempo de execução para esses modelos:

    | Nível de `/think`     | Comportamento da Moonshot |
    | --------------------- | ------------------------- |
    | `/think off`          | `thinking.type=disabled`  |
    | Qualquer nível diferente de off | `thinking.type=enabled` |

    <Warning>
    Quando o raciocínio da Moonshot está ativado, `tool_choice` deve ser `auto` ou `none`. Uma escolha de ferramenta fixada (`type: "tool"` ou `type: "function"`) força o raciocínio de volta para `disabled`, para que a ferramenta solicitada ainda seja executada; em vez disso, `tool_choice: "required"` é normalizado para `auto`. Isso se aplica a todos os modelos da Moonshot, exceto o Kimi K2.7 Code, cujo modo de raciocínio não pode ser desativado — seu `tool_choice` é normalizado para `auto` quando incompatível.
    </Warning>

    O Kimi K2.6 também aceita um campo opcional `thinking.keep` que controla
    a retenção de `reasoning_content` entre vários turnos. Defina-o como `"all"` para manter todo o
    raciocínio entre os turnos; omita-o (ou deixe-o como `null`) para usar a estratégia
    padrão do servidor. O OpenClaw encaminha `thinking.keep` apenas para
    `moonshot/kimi-k2.6` e o remove de outros modelos. O Kimi K2.7 Code
    preserva todo o histórico de raciocínio por padrão, enquanto o OpenClaw omite todo o
    campo `thinking`.

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

  <Accordion title="Sanitização de ids de chamadas de ferramentas">
    O Moonshot Kimi fornece ids nativos de tool_call no formato `functions.<name>:<index>`. O OpenClaw preserva a primeira ocorrência de cada id nativo do Kimi e reescreve duplicatas posteriores como ids `call_*` determinísticos no estilo da OpenAI. Os resultados correspondentes das ferramentas são remapeados com o mesmo id para que a reprodução permaneça única sem remover o primeiro id nativo do Kimi. Esse comportamento está integrado ao provedor Moonshot incluído e não é uma configuração ajustável pelo usuário.
  </Accordion>

  <Accordion title="Compatibilidade do uso em streaming">
    Os endpoints nativos do Moonshot (`https://api.moonshot.ai/v1` e
    `https://api.moonshot.cn/v1`) declaram compatibilidade com o uso em streaming.
    O OpenClaw determina isso pelo host do endpoint, não pelo id do provedor; portanto, um id
    de provedor personalizado que aponte para o mesmo host nativo do Moonshot herda o mesmo
    comportamento de uso em streaming.

    Com os preços do K2.6 no catálogo, o uso transmitido que inclui tokens de entrada, saída
    e leitura de cache também é convertido em um custo local estimado em USD para
    `/status`, `/usage full`, `/usage cost` e a contabilização de sessões
    baseada em transcrições.

  </Accordion>

  <Accordion title="Referência de endpoints e refs de modelos">
    | Provedor   | Prefixo da ref do modelo | Endpoint                      | Variável de ambiente de autenticação |
    | ---------- | ------------------------ | ----------------------------- | ------------------------------------ |
    | Moonshot   | `moonshot/`              | `https://api.moonshot.ai/v1` | `MOONSHOT_API_KEY`                   |
    | Moonshot CN| `moonshot/`              | `https://api.moonshot.cn/v1` | `MOONSHOT_API_KEY`                   |
    | Kimi Coding| `kimi/`                  | Endpoint do Kimi Coding       | `KIMI_API_KEY`                       |
    | Pesquisa na web | N/D                 | O mesmo da região da API do Moonshot | `KIMI_API_KEY` ou `MOONSHOT_API_KEY` |

    - A pesquisa na web do Kimi usa `KIMI_API_KEY` ou `MOONSHOT_API_KEY` e, por padrão, usa `https://api.moonshot.ai/v1` com o modelo `kimi-k2.6`.
    - Se necessário, substitua os preços e os metadados de contexto em `models.providers`.
    - Se o Moonshot publicar limites de contexto diferentes para um modelo, ajuste `contextWindow` de acordo.

  </Accordion>
</AccordionGroup>

## Relacionados

<CardGroup cols={2}>
  <Card title="Seleção de modelos" href="/pt-BR/concepts/model-providers" icon="layers">
    Como escolher provedores, refs de modelos e o comportamento de failover.
  </Card>
  <Card title="Pesquisa na web" href="/pt-BR/tools/web" icon="magnifying-glass">
    Configuração de provedores de pesquisa na web, incluindo o Kimi.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Esquema completo de configuração para provedores, modelos e plugins.
  </Card>
  <Card title="Plataforma aberta do Moonshot" href="https://platform.moonshot.ai" icon="globe">
    Gerenciamento e documentação de chaves de API do Moonshot.
  </Card>
</CardGroup>
