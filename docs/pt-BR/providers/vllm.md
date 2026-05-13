---
read_when:
    - Você quer executar o OpenClaw em um servidor vLLM local
    - Você quer endpoints /v1 compatíveis com OpenAI com seus próprios modelos
summary: Execute o OpenClaw com vLLM (servidor local compatível com OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-05-13T05:33:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3b58fc0694fa9629ae87b6958d1ab39e484d468e6f92346f39f55316dbc09a04
    source_path: providers/vllm.md
    workflow: 16
---

vLLM pode servir modelos de código aberto (e alguns personalizados) por meio de uma API HTTP **compatível com OpenAI**. O OpenClaw se conecta ao vLLM usando a API `openai-completions`.

O OpenClaw também pode **descobrir automaticamente** os modelos disponíveis do vLLM quando você opta por isso com `VLLM_API_KEY` (qualquer valor funciona se o seu servidor não exigir autenticação). Use `vllm/*` em `agents.defaults.models` para manter a descoberta dinâmica quando você também configura uma URL base personalizada do vLLM.

O OpenClaw trata `vllm` como um provedor local compatível com OpenAI que oferece suporte à contabilização de uso em streaming, para que as contagens de tokens de status/contexto possam ser atualizadas a partir de respostas `stream_options.include_usage`.

| Propriedade      | Valor                                    |
| ---------------- | ---------------------------------------- |
| ID do provedor   | `vllm`                                   |
| API              | `openai-completions` (compatível com OpenAI) |
| Autenticação     | variável de ambiente `VLLM_API_KEY`      |
| URL base padrão  | `http://127.0.0.1:8000/v1`               |

## Primeiros passos

<Steps>
  <Step title="Iniciar o vLLM com um servidor compatível com OpenAI">
    Sua URL base deve expor endpoints `/v1` (por exemplo, `/v1/models`, `/v1/chat/completions`). O vLLM geralmente é executado em:

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="Definir a variável de ambiente da chave de API">
    Qualquer valor funciona se o seu servidor não exigir autenticação:

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="Selecionar um modelo">
    Substitua por um dos seus IDs de modelo do vLLM:

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
  <Step title="Verificar se o modelo está disponível">
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
Se você definir `models.providers.vllm` explicitamente, o OpenClaw usará seus modelos declarados por padrão. Adicione `"vllm/*": {}` a `agents.defaults.models` quando quiser que o OpenClaw consulte o endpoint `/models` desse provedor configurado e inclua todos os modelos vLLM anunciados.
</Note>

## Configuração explícita (modelos manuais)

Use configuração explícita quando:

- o vLLM é executado em outro host ou porta
- você quer fixar valores de `contextWindow` ou `maxTokens`
- seu servidor exige uma chave de API real (ou você quer controlar cabeçalhos)
- você se conecta a um endpoint vLLM confiável de loopback, LAN ou Tailscale

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

Para manter esse provedor dinâmico sem listar manualmente todos os modelos, adicione um curinga de provedor ao catálogo de modelos visível:

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
  <Accordion title="Comportamento no estilo proxy">
    O vLLM é tratado como um backend `/v1` compatível com OpenAI no estilo proxy, não como um endpoint OpenAI nativo. Isso significa:

    | Comportamento | Aplicado? |
    |----------|----------|
    | Formatação nativa de requisição OpenAI | Não |
    | `service_tier` | Não enviado |
    | `store` de Responses | Não enviado |
    | Dicas de cache de prompt | Não enviadas |
    | Formatação de payload compatível com raciocínio da OpenAI | Não aplicada |
    | Cabeçalhos ocultos de atribuição do OpenClaw | Não injetados em URLs base personalizadas |

  </Accordion>

  <Accordion title="Controles de thinking do Qwen">
    Para modelos Qwen servidos pelo vLLM, defina
    `params.qwenThinkingFormat: "chat-template"` na entrada do modelo quando o
    servidor espera kwargs de chat-template do Qwen. O OpenClaw mapeia `/think off` para:

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
    `params.qwenThinkingFormat: "top-level"` para enviar `enable_thinking` na raiz
    da requisição. Snake-case `params.qwen_thinking_format` também é aceito.

  </Accordion>

  <Accordion title="Controles de thinking do Nemotron 3">
    vLLM/Nemotron 3 pode usar kwargs de chat-template para controlar se o raciocínio é
    retornado como raciocínio oculto ou texto visível da resposta. Quando uma sessão do OpenClaw
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

  <Accordion title="Chamadas de ferramenta do Qwen aparecem como texto">
    Primeiro, confira se o vLLM foi iniciado com o parser de chamadas de ferramenta e o template de chat
    corretos para o modelo. Por exemplo, a documentação do vLLM indica `hermes` para modelos Qwen2.5
    e `qwen3_xml` para modelos Qwen3-Coder.

    Sintomas:

    - Skills ou ferramentas nunca são executadas
    - o assistente imprime JSON/XML bruto, como `{"name":"read","arguments":...}`
    - o vLLM retorna uma matriz `tool_calls` vazia quando o OpenClaw envia
      `tool_choice: "auto"`

    Algumas combinações Qwen/vLLM retornam chamadas de ferramenta estruturadas somente quando a
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

    Esta é uma solução alternativa de compatibilidade opcional. Ela faz com que todo turno de modelo com
    ferramentas exija uma chamada de ferramenta; portanto, use-a somente para uma entrada de modelo local dedicada
    em que esse comportamento seja aceitável. Não a use como padrão global para todos os
    modelos vLLM e não use um proxy que converta cegamente texto arbitrário do
    assistente em chamadas de ferramenta executáveis.

  </Accordion>

  <Accordion title="URL base personalizada">
    Se o seu servidor vLLM for executado em um host ou porta não padrão, defina `baseUrl` na configuração explícita do provedor:

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
  <Accordion title="Primeira resposta lenta ou timeout do servidor remoto">
    Para modelos locais grandes, hosts LAN remotos ou links tailnet, defina um
    timeout de requisição com escopo no provedor:

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

    `timeoutSeconds` se aplica somente às requisições HTTP de modelo vLLM, incluindo
    configuração da conexão, cabeçalhos de resposta, streaming do corpo e a interrupção total de
    guarded-fetch. Prefira isso antes de aumentar
    `agents.defaults.timeoutSeconds`, que controla toda a execução do agente.

  </Accordion>

  <Accordion title="Servidor inacessível">
    Verifique se o servidor vLLM está em execução e acessível:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    Se você vir um erro de conexão, confira o host, a porta e se o vLLM foi iniciado no modo de servidor compatível com OpenAI.
    Para endpoints explícitos de loopback, LAN ou Tailscale, defina também
    `models.providers.vllm.request.allowPrivateNetwork: true`; requisições do provedor
    bloqueiam URLs de rede privada por padrão, a menos que o provedor seja
    explicitamente confiável.

  </Accordion>

  <Accordion title="Erros de autenticação em requisições">
    Se as requisições falharem com erros de autenticação, defina uma `VLLM_API_KEY` real que corresponda à configuração do seu servidor ou configure o provedor explicitamente em `models.providers.vllm`.

    <Tip>
    Se o seu servidor vLLM não exigir autenticação, qualquer valor não vazio para `VLLM_API_KEY` funciona como um sinal de opt-in para o OpenClaw.
    </Tip>

  </Accordion>

  <Accordion title="Nenhum modelo descoberto">
    A descoberta automática exige que `VLLM_API_KEY` esteja definida. Se você definiu `models.providers.vllm`, o OpenClaw usa somente seus modelos declarados, a menos que `agents.defaults.models` inclua `"vllm/*": {}`.
  </Accordion>

  <Accordion title="Ferramentas renderizadas como texto bruto">
    Se um modelo Qwen imprimir sintaxe de ferramenta JSON/XML em vez de executar uma skill,
    confira as orientações sobre Qwen na Configuração avançada acima. A correção usual é:

    - iniciar o vLLM com o parser/template correto para esse modelo
    - confirmar o ID exato do modelo com `openclaw models list --provider vllm`
    - adicionar uma substituição dedicada por modelo `params.extra_body.tool_choice: "required"`
      somente se `tool_choice: "auto"` ainda retornar chamadas de ferramenta vazias ou apenas em texto

  </Accordion>
</AccordionGroup>

<Warning>
Mais ajuda: [Solução de problemas](/pt-BR/help/troubleshooting) e [FAQ](/pt-BR/help/faq).
</Warning>

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelos" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, referências de modelo e comportamento de failover.
  </Card>
  <Card title="OpenAI" href="/pt-BR/providers/openai" icon="bolt">
    Provedor OpenAI nativo e comportamento de rota compatível com OpenAI.
  </Card>
  <Card title="OAuth e autenticação" href="/pt-BR/gateway/authentication" icon="key">
    Detalhes de autenticação e regras de reutilização de credenciais.
  </Card>
  <Card title="Solução de problemas" href="/pt-BR/help/troubleshooting" icon="wrench">
    Problemas comuns e como resolvê-los.
  </Card>
</CardGroup>
