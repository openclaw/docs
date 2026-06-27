---
read_when:
    - Você quer a configuração do Moonshot K2 (Moonshot Open Platform) vs Kimi Coding
    - Você precisa entender endpoints, chaves e referências de modelo separadas
    - Você quer uma configuração para copiar e colar para qualquer um dos provedores
summary: Configure Moonshot K2 versus Kimi Coding (provedores + chaves separados)
title: Moonshot AI
x-i18n:
    generated_at: "2026-06-27T18:04:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e7365d7e843275750824a937553dcf535245146fb49fe00c622bf14b71d2dd17
    source_path: providers/moonshot.md
    workflow: 16
---

Moonshot fornece a API Kimi com endpoints compatíveis com OpenAI. Configure o
provedor e defina o modelo padrão como `moonshot/kimi-k2.6`, ou use
Kimi Coding com `kimi/kimi-for-coding`.

<Warning>
Moonshot e Kimi Coding são **provedores separados**. As chaves não são intercambiáveis, os endpoints diferem e as refs de modelo diferem (`moonshot/...` vs `kimi/...`).
</Warning>

## Catálogo de modelos integrado

[//]: # "moonshot-kimi-k2-ids:start"

| Ref do modelo                    | Nome                   | Raciocínio | Entrada     | Contexto | Saída máxima |
| -------------------------------- | ---------------------- | ---------- | ----------- | -------- | ------------ |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | Não        | texto, imagem | 262,144 | 262,144      |
| `moonshot/kimi-k2.7-code`         | Kimi K2.7 Code         | Sempre ativo | texto, imagem | 262,144 | 262,144      |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | Não        | texto, imagem | 262,144 | 262,144      |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | Sim        | texto       | 262,144 | 262,144      |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | Sim        | texto       | 262,144 | 262,144      |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | Não        | texto       | 256,000 | 16,384       |

[//]: # "moonshot-kimi-k2-ids:end"

As estimativas de custo do catálogo para os modelos K2 atuais hospedados pela Moonshot usam as
tarifas publicadas de pagamento conforme o uso da Moonshot: Kimi K2.7 Code custa US$ 0,19/MTok para acerto de cache,
US$ 0,95/MTok de entrada e US$ 4,00/MTok de saída; Kimi K2.6 custa US$ 0,16/MTok para acerto de cache,
US$ 0,95/MTok de entrada e US$ 4,00/MTok de saída; Kimi K2.5 custa US$ 0,10/MTok para acerto de cache,
US$ 0,60/MTok de entrada e US$ 3,00/MTok de saída. Outras entradas legadas do catálogo mantêm
marcadores de custo zero, a menos que você os substitua na configuração.

Kimi K2.7 Code sempre usa pensamento nativo. O OpenClaw expõe apenas o estado de pensamento `on`
para este modelo e omite os controles de saída `thinking` e
`reasoning_effort`, conforme exigido pela Moonshot. O OpenClaw também omite
substituições de amostragem que o K2.7 fixa nos padrões do provedor. Kimi K2.6 continua sendo o
padrão de onboarding.

## Primeiros passos

Escolha seu provedor e siga as etapas de configuração.

<Tabs>
  <Tab title="API Moonshot">
    **Melhor para:** modelos Kimi K2 via Moonshot Open Platform.

    <Steps>
      <Step title="Escolha a região do seu endpoint">
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
      <Step title="Execute um teste smoke ao vivo">
        Use um diretório de estado isolado quando quiser verificar o acesso ao modelo e o rastreamento de custos
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
        `model: "kimi-k2.6"`. A entrada da transcrição do assistente armazena o uso de tokens normalizado
        mais o custo estimado em `usage.cost` quando a Moonshot retorna
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
    Instale o plugin oficial e reinicie o Gateway:

    ```bash
    openclaw plugins install @openclaw/kimi-provider
    openclaw gateway restart
    ```
    **Melhor para:** tarefas focadas em código via endpoint Kimi Coding.

    <Note>
    Kimi Coding usa uma chave de API e um prefixo de provedor diferentes (`kimi/...`) dos da Moonshot (`moonshot/...`). A ref de modelo da API estável é `kimi/kimi-for-coding`; refs legadas `kimi/kimi-code` e `kimi/k2p5` continuam aceitas e são normalizadas para esse ID de modelo de API.
    </Note>

    <Steps>
      <Step title="Instale o plugin">
        ```bash
        openclaw plugins install @openclaw/kimi-provider
        ```
      </Step>
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

## Pesquisa na web do Kimi

O plugin Moonshot também registra **Kimi** como um provedor `web_search`, apoiado pela pesquisa na web da Moonshot.

<Steps>
  <Step title="Execute a configuração interativa de pesquisa na web">
    ```bash
    openclaw configure --section web
    ```

    Escolha **Kimi** na seção de pesquisa na web para armazenar
    `plugins.entries.moonshot.config.webSearch.*`.

  </Step>
  <Step title="Configure a região e o modelo da pesquisa na web">
    A configuração interativa solicita:

    | Configuração       | Opções                                                               |
    | ------------------ | -------------------------------------------------------------------- |
    | Região da API      | `https://api.moonshot.ai/v1` (internacional) ou `https://api.moonshot.cn/v1` (China) |
    | Modelo de pesquisa na web | O padrão é `kimi-k2.6`                                      |

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
    Kimi K2.7 Code sempre usa pensamento nativo. A Moonshot exige que os clientes
    omitam o campo `thinking` para este modelo, então o OpenClaw expõe apenas `on` e
    ignora configurações obsoletas `off`. O K2.7 também fixa `temperature`, `top_p`, `n`,
    `presence_penalty` e `frequency_penalty`; o OpenClaw omite substituições configuradas
    para esses campos.

    Outros modelos Moonshot Kimi dão suporte a pensamento nativo binário:

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

    O OpenClaw mapeia níveis de `/think` em tempo de execução para esses modelos:

    | Nível de `/think`  | Comportamento da Moonshot |
    | ------------------ | ------------------------- |
    | `/think off`       | `thinking.type=disabled`  |
    | Qualquer nível diferente de off | `thinking.type=enabled` |

    <Warning>
    Quando o pensamento da Moonshot está habilitado, `tool_choice` deve ser `auto` ou `none`. O OpenClaw normaliza valores incompatíveis para `auto`. Isso inclui Kimi K2.7 Code, cujo modo de pensamento não pode ser desabilitado para preservar uma escolha de ferramenta fixada.
    </Warning>

    O Kimi K2.6 também aceita um campo opcional `thinking.keep` que controla
    a retenção multi-turn de `reasoning_content`. Defina-o como `"all"` para manter o
    reasoning completo entre turnos; omita-o (ou deixe-o como `null`) para usar a estratégia
    padrão do servidor. O OpenClaw só encaminha `thinking.keep` para
    `moonshot/kimi-k2.6` e o remove de outros modelos. O Kimi K2.7 Code
    preserva o histórico completo de reasoning por padrão, enquanto o OpenClaw omite todo o
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

  <Accordion title="Sanitização de id de chamada de ferramenta">
    O Moonshot Kimi serve ids `tool_call` nativos no formato `functions.<name>:<index>`. Para o transporte OpenAI-completions, o OpenClaw preserva a primeira ocorrência de cada id nativo do Kimi e reescreve duplicatas posteriores para ids determinísticos `call_*` no estilo OpenAI. Resultados de ferramenta correspondentes são remapeados com o mesmo id, para que a reprodução permaneça única sem remover o primeiro id nativo do Kimi.

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
    transporte compartilhado `openai-completions`. O OpenClaw determina isso a partir
    das capacidades do endpoint, então ids de provedores personalizados compatíveis que apontam para os mesmos hosts
    nativos da Moonshot herdam o mesmo comportamento de uso em streaming.

    Com os preços do catálogo K2.6, o uso transmitido por streaming que inclui tokens de entrada, saída
    e leitura de cache também é convertido em custo estimado local em USD para
    `/status`, `/usage full`, `/usage cost` e contabilidade de sessão baseada em transcrições.

  </Accordion>

  <Accordion title="Referência de endpoint e ref de modelo">
    | Provedor   | Prefixo de ref de modelo | Endpoint                      | Variável de ambiente de autenticação |
    | ---------- | ------------------------ | ----------------------------- | ------------------------------------ |
    | Moonshot   | `moonshot/`      | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`  |
    | Moonshot CN| `moonshot/`      | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`  |
    | Kimi Coding| `kimi/`          | Endpoint Kimi Coding          | `KIMI_API_KEY`      |
    | Pesquisa na web | N/A              | Igual à região da API Moonshot   | `KIMI_API_KEY` ou `MOONSHOT_API_KEY` |

    - A pesquisa na web do Kimi usa `KIMI_API_KEY` ou `MOONSHOT_API_KEY`, e o padrão é `https://api.moonshot.ai/v1` com o modelo `kimi-k2.6`.
    - Substitua preços e metadados de contexto em `models.providers` se necessário.
    - Se a Moonshot publicar limites de contexto diferentes para um modelo, ajuste `contextWindow` conforme apropriado.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Pesquisa na web" href="/pt-BR/tools/web" icon="magnifying-glass">
    Configuração de provedores de pesquisa na web, incluindo Kimi.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Esquema completo de configuração para provedores, modelos e plugins.
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    Gerenciamento de chaves de API da Moonshot e documentação.
  </Card>
</CardGroup>
