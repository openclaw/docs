---
read_when:
    - Você quer executar o OpenClaw com um servidor vLLM local
    - Você quer endpoints /v1 compatíveis com a OpenAI usando seus próprios modelos
summary: Execute o OpenClaw com o vLLM (servidor local compatível com a OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-07-12T00:20:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 98d1044c0a82efb6c9937e961d765d0cfcea8664cbaa043168921b457756512c
    source_path: providers/vllm.md
    workflow: 16
---

vLLM disponibiliza modelos de código aberto (e alguns personalizados) por meio de uma API HTTP **compatível com a OpenAI**. O OpenClaw se conecta usando a API `openai-completions` e pode **descobrir automaticamente** modelos quando você habilita essa opção com `VLLM_API_KEY`.

| Propriedade            | Valor                                      |
| ---------------------- | ------------------------------------------ |
| ID do provedor         | `vllm`                                     |
| API                    | `openai-completions` (compatível com a OpenAI) |
| Autenticação           | variável de ambiente `VLLM_API_KEY`        |
| URL base padrão        | `http://127.0.0.1:8000/v1`                 |
| Uso durante streaming  | Compatível (`stream_options.include_usage`) |

## Primeiros passos

<Steps>
  <Step title="Start vLLM with an OpenAI-compatible server">
    Sua URL base deve expor endpoints `/v1` (`/v1/models`, `/v1/chat/completions`). O vLLM geralmente é executado em:

    ```text
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="Set the API key environment variable">
    Qualquer valor não vazio funciona se o servidor não exigir autenticação:

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="Select a model">
    Substitua por um dos IDs de modelo do seu vLLM:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "vllm/your-model-id" },
        },
      },
    }
    ```

  </Step>
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider vllm
    ```
  </Step>
</Steps>

<Tip>
Para uma configuração não interativa (CI, scripts), informe diretamente a URL base, a chave e o modelo:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice vllm \
  --custom-base-url "http://127.0.0.1:8000/v1" \
  --custom-api-key "vllm-local" \
  --custom-model-id "your-model-id"
```

</Tip>

## Descoberta de modelos (provedor implícito)

Quando `VLLM_API_KEY` está definida (ou existe um perfil de autenticação) e `models.providers.vllm` **não** está definido, o OpenClaw consulta `GET http://127.0.0.1:8000/v1/models` e converte os IDs retornados em entradas de modelo.

<Note>
Se você definir `models.providers.vllm` explicitamente, o OpenClaw usará somente os modelos declarados. Adicione `"vllm/*": {}` a `agents.defaults.models` para que o OpenClaw também consulte o endpoint `/models` desse provedor configurado e inclua todos os modelos vLLM anunciados.
</Note>

## Configuração explícita

Configure explicitamente quando o vLLM for executado em outro host ou porta, quando você quiser fixar `contextWindow`/`maxTokens`, quando o servidor exigir uma chave de API real ou quando você se conectar a um endpoint confiável de local loopback, LAN ou Tailscale:

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        timeoutSeconds: 300, // Optional: extend request timeout for slow local models
        models: [
          {
            id: "your-model-id",
            name: "Local vLLM Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

Para manter o provedor dinâmico sem listar todos os modelos, adicione um curinga ao catálogo de modelos visíveis:

```json5
{
  agents: {
    defaults: {
      models: {
        "vllm/*": {},
      },
    },
  },
}
```

## Configuração avançada

<AccordionGroup>
  <Accordion title="Proxy-style behavior">
    O vLLM é tratado como um backend `/v1` compatível com a OpenAI no estilo proxy, não como um endpoint nativo da OpenAI:

    | Comportamento                                  | Aplicado?                                  |
    | ---------------------------------------------- | ------------------------------------------ |
    | Formatação nativa de solicitações da OpenAI    | Não                                        |
    | `service_tier`                                 | Não enviado                                |
    | `store` das respostas                          | Não enviado                                |
    | Dicas de cache de prompt                       | Não enviadas                               |
    | Formatação de payload compatível com raciocínio da OpenAI | Não aplicada                    |
    | Cabeçalhos ocultos de atribuição do OpenClaw   | Não injetados em URLs base personalizadas  |

  </Accordion>

  <Accordion title="Qwen thinking controls">
    Para modelos Qwen, defina `compat.thinkingFormat: "qwen-chat-template"` na entrada do modelo quando o servidor esperar argumentos nomeados do modelo de chat do Qwen. Esses modelos expõem um perfil `/think` binário (`off`, `on`), pois o raciocínio do modelo de chat do Qwen é uma opção de ativação/desativação, não uma escala de esforço no estilo da OpenAI.

    ```json5
    {
      models: {
        providers: {
          vllm: {
            models: [
              {
                id: "Qwen/Qwen3-8B",
                name: "Qwen3 8B",
                reasoning: true,
                compat: { thinkingFormat: "qwen-chat-template" },
              },
            ],
          },
        },
      },
    }
    ```

    O OpenClaw mapeia `/think off` para:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "preserve_thinking": true
      }
    }
    ```

    Níveis de raciocínio diferentes de `off` enviam `enable_thinking: true`. Se o endpoint esperar sinalizadores de nível superior no estilo DashScope, use `compat.thinkingFormat: "qwen"` para enviar `enable_thinking` na raiz da solicitação.

  </Accordion>

  <Accordion title="Nemotron 3 thinking controls">
    Para modelos `vllm/nemotron-3-*` com o raciocínio desativado, o plugin incluído envia:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "force_nonempty_content": true
      }
    }
    ```

    Para personalizar esses valores, defina `chat_template_kwargs` nos parâmetros do modelo. Se você também definir `params.extra_body.chat_template_kwargs`, esse valor terá precedência porque `extra_body` é a última substituição aplicada ao corpo da solicitação.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "vllm/nemotron-3-super": {
              params: {
                chat_template_kwargs: {
                  enable_thinking: false,
                  force_nonempty_content: true,
                },
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Qwen tool calls appear as text">
    Primeiro, confirme que o vLLM foi iniciado com o analisador de chamadas de ferramentas e o modelo de chat corretos para o modelo. A documentação do vLLM indica `hermes` para modelos Qwen2.5 e `qwen3_xml` para modelos Qwen3-Coder.

    Sintomas: Skills/ferramentas nunca são executadas, o assistente exibe JSON/XML bruto, como `{"name":"read","arguments":...}`, ou o vLLM retorna um array `tool_calls` vazio quando o OpenClaw envia `tool_choice: "auto"`.

    Algumas combinações de Qwen/vLLM retornam chamadas de ferramentas estruturadas somente quando a solicitação usa `tool_choice: "required"`. Force essa opção por modelo com `params.extra_body`:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "vllm/Qwen-Qwen2.5-Coder-32B-Instruct": {
              params: {
                extra_body: {
                  tool_choice: "required",
                },
              },
            },
          },
        },
      },
    }
    ```

    Substitua o ID do modelo pelo ID exato obtido com `openclaw models list --provider vllm` ou aplique a mesma substituição pela CLI:

    ```bash
    openclaw config set agents.defaults.models '{"vllm/Qwen-Qwen2.5-Coder-32B-Instruct":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
    ```

    Esta é uma solução alternativa opcional: ela força cada interação com ferramentas a realizar uma chamada de ferramenta, portanto, use-a somente em uma entrada de modelo dedicada em que isso seja aceitável. Não a defina como padrão global para todos os modelos vLLM e não a combine com um proxy que converta texto arbitrário do assistente em chamadas de ferramentas executáveis.

  </Accordion>

  <Accordion title="Custom base URL">
    Se o servidor vLLM for executado em um host ou porta diferente do padrão, defina `baseUrl` na configuração explícita do provedor:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:9000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            timeoutSeconds: 300,
            models: [
              {
                id: "my-custom-model",
                name: "Remote vLLM Model",
                reasoning: false,
                input: ["text"],
                contextWindow: 64000,
                maxTokens: 4096,
              },
            ],
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## Solução de problemas

<AccordionGroup>
  <Accordion title="Slow first response or remote server timeout">
    Para modelos locais grandes, hosts remotos na LAN ou conexões de tailnet, defina um tempo limite de solicitação no escopo do provedor:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:8000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            timeoutSeconds: 300,
            models: [{ id: "your-model-id", name: "Local vLLM Model" }],
          },
        },
      },
    }
    ```

    `timeoutSeconds` se aplica somente às solicitações HTTP de modelos vLLM: estabelecimento da conexão, cabeçalhos da resposta, streaming do corpo e cancelamento total da busca protegida. Ele também aumenta o limite do monitor de inatividade/streaming do LLM acima do padrão implícito de aproximadamente 120 segundos para esse provedor. Prefira essa opção a aumentar `agents.defaults.timeoutSeconds`, que controla toda a execução do agente.

  </Accordion>

  <Accordion title="Server not reachable">
    Verifique se o servidor vLLM está em execução e acessível:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    Se ocorrer um erro de conexão, verifique o host, a porta e se o vLLM foi iniciado no modo de servidor compatível com a OpenAI. O OpenClaw confia na origem exata configurada em `models.providers.vllm.baseUrl` para solicitações protegidas de modelos em endpoints de local loopback, LAN e Tailscale. Origens de metadados/link-local continuam bloqueadas sem habilitação explícita. Defina `models.providers.vllm.request.allowPrivateNetwork: true` somente quando as solicitações do vLLM precisarem alcançar outra origem privada, ou `false` para desabilitar a confiança na origem exata.

  </Accordion>

  <Accordion title="Auth errors on requests">
    Se as solicitações falharem com erros de autenticação, defina uma `VLLM_API_KEY` real que corresponda à configuração do servidor ou configure o provedor explicitamente em `models.providers.vllm`.

    <Tip>
    Se o servidor vLLM não exigir autenticação, qualquer valor não vazio de `VLLM_API_KEY` funcionará como sinal de habilitação para o OpenClaw.
    </Tip>

  </Accordion>

  <Accordion title="No models discovered">
    A descoberta automática exige que `VLLM_API_KEY` esteja definida. Se você definiu `models.providers.vllm`, o OpenClaw usará somente os modelos declarados, a menos que `agents.defaults.models` inclua `"vllm/*": {}`.
  </Accordion>

  <Accordion title="Tools render as raw text">
    Se um modelo Qwen exibir a sintaxe JSON/XML de ferramentas em vez de executar uma Skill:

    - Inicie o vLLM com o analisador/modelo correto para esse modelo.
    - Confirme o ID exato do modelo com `openclaw models list --provider vllm`.
    - Adicione uma substituição dedicada por modelo `params.extra_body.tool_choice: "required"` somente se `tool_choice: "auto"` ainda retornar chamadas de ferramentas vazias ou apenas como texto.

  </Accordion>
</AccordionGroup>

<Warning>
Mais ajuda: [Solução de problemas](/pt-BR/help/troubleshooting) e [Perguntas frequentes](/pt-BR/help/faq).
</Warning>

## Relacionados

<CardGroup cols={2}>
  <Card title="Model selection" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, referências de modelos e comportamento de failover.
  </Card>
  <Card title="OpenAI" href="/pt-BR/providers/openai" icon="bolt">
    Provedor nativo da OpenAI e comportamento de rotas compatíveis com a OpenAI.
  </Card>
  <Card title="OAuth and auth" href="/pt-BR/gateway/authentication" icon="key">
    Detalhes de autenticação e regras de reutilização de credenciais.
  </Card>
  <Card title="Troubleshooting" href="/pt-BR/help/troubleshooting" icon="wrench">
    Problemas comuns e como resolvê-los.
  </Card>
</CardGroup>
