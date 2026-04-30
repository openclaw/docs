---
read_when:
    - Você quer executar o OpenClaw com um servidor vLLM local
    - Você quer endpoints /v1 compatíveis com OpenAI para usar seus próprios modelos
summary: Execute o OpenClaw com vLLM (servidor local compatível com OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-04-30T10:06:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: b638341b5138d085ed3fa781300216d5bae58b9d7e3a9edfe6cbdcdbc379c2ce
    source_path: providers/vllm.md
    workflow: 16
---

vLLM pode servir modelos de código aberto (e alguns modelos personalizados) por meio de uma API HTTP **compatível com OpenAI**. OpenClaw se conecta ao vLLM usando a API `openai-completions`.

OpenClaw também pode **descobrir automaticamente** modelos disponíveis do vLLM quando você opta por isso com `VLLM_API_KEY` (qualquer valor funciona se o servidor não exigir autenticação) e não define uma entrada explícita `models.providers.vllm`.

OpenClaw trata `vllm` como um provedor local compatível com OpenAI que oferece suporte
à contabilidade de uso em streaming, para que as contagens de tokens de status/contexto possam ser atualizadas a partir das
respostas de `stream_options.include_usage`.

| Propriedade      | Valor                                    |
| ---------------- | ---------------------------------------- |
| ID do provedor   | `vllm`                                   |
| API              | `openai-completions` (compatível com OpenAI) |
| Autenticação     | variável de ambiente `VLLM_API_KEY`      |
| URL base padrão  | `http://127.0.0.1:8000/v1`               |

## Primeiros passos

<Steps>
  <Step title="Start vLLM with an OpenAI-compatible server">
    Sua URL base deve expor endpoints `/v1` (por exemplo, `/v1/models`, `/v1/chat/completions`). vLLM normalmente é executado em:

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="Set the API key environment variable">
    Qualquer valor funciona se o servidor não exigir autenticação:

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

## Descoberta de modelos (provedor implícito)

Quando `VLLM_API_KEY` está definido (ou existe um perfil de autenticação) e você **não** define `models.providers.vllm`, o OpenClaw consulta:

```
GET http://127.0.0.1:8000/v1/models
```

e converte os IDs retornados em entradas de modelo.

<Note>
Se você definir `models.providers.vllm` explicitamente, a descoberta automática será ignorada e você deverá definir os modelos manualmente.
</Note>

## Configuração explícita (modelos manuais)

Use a configuração explícita quando:

- vLLM é executado em outro host ou porta
- Você quer fixar valores de `contextWindow` ou `maxTokens`
- Seu servidor exige uma chave de API real (ou você quer controlar cabeçalhos)
- Você se conecta a um endpoint vLLM confiável de loopback, LAN ou Tailscale

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        request: { allowPrivateNetwork: true },
        timeoutSeconds: 300, // Optional: extend connect/header/body/request timeout for slow local models
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

## Configuração avançada

<AccordionGroup>
  <Accordion title="Proxy-style behavior">
    vLLM é tratado como um backend `/v1` compatível com OpenAI em estilo proxy, não como um endpoint
    nativo da OpenAI. Isso significa:

    | Comportamento | Aplicado? |
    |----------|----------|
    | Formatação nativa de requisições da OpenAI | Não |
    | `service_tier` | Não enviado |
    | Responses `store` | Não enviado |
    | Dicas de cache de prompt | Não enviadas |
    | Formatação de payload compatível com reasoning da OpenAI | Não aplicada |
    | Cabeçalhos ocultos de atribuição do OpenClaw | Não injetados em URLs base personalizadas |

  </Accordion>

  <Accordion title="Qwen thinking controls">
    Para modelos Qwen servidos pelo vLLM, defina
    `params.qwenThinkingFormat: "chat-template"` na entrada do modelo quando o
    servidor esperar kwargs de chat-template do Qwen. OpenClaw mapeia `/think off` para:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "preserve_thinking": true
      }
    }
    ```

    Níveis de thinking diferentes de `off` enviam `enable_thinking: true`. Se o seu endpoint
    espera flags de nível superior no estilo DashScope, use
    `params.qwenThinkingFormat: "top-level"` para enviar `enable_thinking` na
    raiz da requisição. `params.qwen_thinking_format` em snake-case também é aceito.

  </Accordion>

  <Accordion title="Nemotron 3 thinking controls">
    vLLM/Nemotron 3 pode usar kwargs de chat-template para controlar se o reasoning é
    retornado como reasoning oculto ou texto de resposta visível. Quando uma sessão do OpenClaw
    usa `vllm/nemotron-3-*` com thinking desativado, o Plugin vLLM incluído envia:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "force_nonempty_content": true
      }
    }
    ```

    Para personalizar esses valores, defina `chat_template_kwargs` nos parâmetros do modelo.
    Se você também definir `params.extra_body.chat_template_kwargs`, esse valor terá
    precedência final porque `extra_body` é a última substituição do corpo da requisição.

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
    Primeiro, confirme que o vLLM foi iniciado com o parser de tool-call e o chat
    template corretos para o modelo. Por exemplo, a documentação do vLLM indica `hermes` para modelos
    Qwen2.5 e `qwen3_xml` para modelos Qwen3-Coder.

    Sintomas:

    - skills ou ferramentas nunca são executadas
    - o assistente imprime JSON/XML bruto, como `{"name":"read","arguments":...}`
    - o vLLM retorna um array `tool_calls` vazio quando o OpenClaw envia
      `tool_choice: "auto"`

    Algumas combinações de Qwen/vLLM retornam chamadas de ferramenta estruturadas somente quando a
    requisição usa `tool_choice: "required"`. Para essas entradas de modelo, force o
    campo de requisição compatível com OpenAI com `params.extra_body`:

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

    Substitua `Qwen-Qwen2.5-Coder-32B-Instruct` pelo ID exato retornado por:

    ```bash
    openclaw models list --provider vllm
    ```

    Você pode aplicar a mesma substituição pela CLI:

    ```bash
    openclaw config set agents.defaults.models '{"vllm/Qwen-Qwen2.5-Coder-32B-Instruct":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
    ```

    Esta é uma solução alternativa de compatibilidade opcional. Ela faz com que todo turno do modelo com
    ferramentas exija uma chamada de ferramenta, então use-a somente para uma entrada dedicada de modelo local
    em que esse comportamento seja aceitável. Não a use como padrão global para todos os
    modelos vLLM, e não use um proxy que converta cegamente texto arbitrário
    do assistente em chamadas de ferramenta executáveis.

  </Accordion>

  <Accordion title="Custom base URL">
    Se o servidor vLLM for executado em um host ou porta não padrão, defina `baseUrl` na configuração explícita do provedor:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:9000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            request: { allowPrivateNetwork: true },
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
    Para modelos locais grandes, hosts de LAN remotos ou links de tailnet, defina um
    timeout de requisição no escopo do provedor:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:8000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            request: { allowPrivateNetwork: true },
            timeoutSeconds: 300,
            models: [{ id: "your-model-id", name: "Local vLLM Model" }],
          },
        },
      },
    }
    ```

    `timeoutSeconds` se aplica somente às requisições HTTP de modelo do vLLM, incluindo
    a configuração da conexão, cabeçalhos de resposta, streaming do corpo e a interrupção
    total do guarded-fetch. Prefira isso antes de aumentar
    `agents.defaults.timeoutSeconds`, que controla toda a execução do agente.

  </Accordion>

  <Accordion title="Server not reachable">
    Verifique se o servidor vLLM está em execução e acessível:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    Se você vir um erro de conexão, verifique o host, a porta e se o vLLM foi iniciado com o modo de servidor compatível com OpenAI.
    Para endpoints explícitos de loopback, LAN ou Tailscale, também defina
    `models.providers.vllm.request.allowPrivateNetwork: true`; requisições do provedor
    bloqueiam URLs de rede privada por padrão, a menos que o provedor seja
    explicitamente confiável.

  </Accordion>

  <Accordion title="Auth errors on requests">
    Se as requisições falharem com erros de autenticação, defina uma `VLLM_API_KEY` real que corresponda à configuração do servidor, ou configure o provedor explicitamente em `models.providers.vllm`.

    <Tip>
    Se o servidor vLLM não exigir autenticação, qualquer valor não vazio para `VLLM_API_KEY` funciona como um sinal opcional para o OpenClaw.
    </Tip>

  </Accordion>

  <Accordion title="No models discovered">
    A descoberta automática exige que `VLLM_API_KEY` esteja definida **e** que não haja uma entrada explícita de configuração `models.providers.vllm`. Se você definiu o provedor manualmente, o OpenClaw ignora a descoberta e usa somente os modelos declarados.
  </Accordion>

  <Accordion title="Tools render as raw text">
    Se um modelo Qwen imprimir a sintaxe de ferramenta em JSON/XML em vez de executar uma skill,
    consulte a orientação sobre Qwen na Configuração avançada acima. A correção usual é:

    - iniciar o vLLM com o parser/template correto para esse modelo
    - confirmar o ID exato do modelo com `openclaw models list --provider vllm`
    - adicionar uma substituição dedicada por modelo `params.extra_body.tool_choice: "required"`
      somente se `tool_choice: "auto"` ainda retornar chamadas de ferramenta vazias ou apenas em texto

  </Accordion>
</AccordionGroup>

<Warning>
Mais ajuda: [Solução de problemas](/pt-BR/help/troubleshooting) e [FAQ](/pt-BR/help/faq).
</Warning>

## Relacionados

<CardGroup cols={2}>
  <Card title="Model selection" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, referências de modelo e comportamento de failover.
  </Card>
  <Card title="OpenAI" href="/pt-BR/providers/openai" icon="bolt">
    Provedor nativo da OpenAI e comportamento de rotas compatíveis com OpenAI.
  </Card>
  <Card title="OAuth and auth" href="/pt-BR/gateway/authentication" icon="key">
    Detalhes de autenticação e regras de reutilização de credenciais.
  </Card>
  <Card title="Troubleshooting" href="/pt-BR/help/troubleshooting" icon="wrench">
    Problemas comuns e como resolvê-los.
  </Card>
</CardGroup>
