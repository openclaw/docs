---
read_when:
    - Você quer executar o OpenClaw com um servidor vLLM local
    - Você quer endpoints /v1 compatíveis com OpenAI com seus próprios modelos
summary: Execute o OpenClaw com vLLM (servidor local compatível com OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-06-27T18:07:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a3a5da5ce359bf62c44cddd0c97d2852d98c996ad6d44552a68d4aeb4d1d2893
    source_path: providers/vllm.md
    workflow: 16
---

vLLM pode servir modelos de código aberto (e alguns personalizados) por meio de uma API HTTP **compatível com OpenAI**. O OpenClaw se conecta ao vLLM usando a API `openai-completions`.

O OpenClaw também pode **descobrir automaticamente** os modelos disponíveis no vLLM quando você opta por isso com `VLLM_API_KEY` (qualquer valor funciona se o seu servidor não exigir autenticação). Use `vllm/*` em `agents.defaults.models` para manter a descoberta dinâmica quando você também configura uma URL base personalizada do vLLM.

O OpenClaw trata `vllm` como um provedor local compatível com OpenAI que oferece suporte à contabilidade de uso transmitida por streaming, então as contagens de tokens de status/contexto podem ser atualizadas a partir de respostas `stream_options.include_usage`.

| Propriedade      | Valor                                    |
| ---------------- | ---------------------------------------- |
| ID do provedor   | `vllm`                                   |
| API              | `openai-completions` (compatível com OpenAI) |
| Autenticação     | variável de ambiente `VLLM_API_KEY`      |
| URL base padrão  | `http://127.0.0.1:8000/v1`               |

## Primeiros passos

<Steps>
  <Step title="Inicie o vLLM com um servidor compatível com OpenAI">
    Sua URL base deve expor endpoints `/v1` (por exemplo, `/v1/models`, `/v1/chat/completions`). O vLLM normalmente é executado em:

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="Defina a variável de ambiente da chave de API">
    Qualquer valor funciona se o seu servidor não exigir autenticação:

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="Selecione um modelo">
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
  <Step title="Verifique se o modelo está disponível">
    ```bash
    openclaw models list --provider vllm
    ```
  </Step>
</Steps>

## Descoberta de modelos (provedor implícito)

Quando `VLLM_API_KEY` está definida (ou existe um perfil de autenticação) e você **não** define `models.providers.vllm`, o OpenClaw consulta:

```
GET http://127.0.0.1:8000/v1/models
```

e converte os IDs retornados em entradas de modelo.

<Note>
Se você definir `models.providers.vllm` explicitamente, o OpenClaw usa seus modelos declarados por padrão. Adicione `"vllm/*": {}` a `agents.defaults.models` quando quiser que o OpenClaw consulte o endpoint `/models` desse provedor configurado e inclua todos os modelos vLLM anunciados.
</Note>

## Configuração explícita (modelos manuais)

Use configuração explícita quando:

- o vLLM é executado em outro host ou porta
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
  <Accordion title="Comportamento em estilo de proxy">
    O vLLM é tratado como um backend `/v1` compatível com OpenAI em estilo de proxy, não como um endpoint OpenAI nativo. Isso significa:

    | Comportamento | Aplicado? |
    |----------|----------|
    | Formatação de requisições nativa da OpenAI | Não |
    | `service_tier` | Não enviado |
    | `store` de Responses | Não enviado |
    | Dicas de cache de prompt | Não enviadas |
    | Formatação de payload compatível com raciocínio da OpenAI | Não aplicada |
    | Cabeçalhos ocultos de atribuição do OpenClaw | Não injetados em URLs base personalizadas |

  </Accordion>

  <Accordion title="Controles de thinking do Qwen">
    Para modelos Qwen servidos pelo vLLM, defina `compat.thinkingFormat: "qwen-chat-template"` na linha de modelo do provedor configurado quando o servidor espera kwargs de template de chat do Qwen. Modelos configurados dessa forma expõem um perfil binário `/think` (`off`, `on`) porque o thinking por template do Qwen é uma flag de requisição liga/desliga, não uma escala de esforço em estilo OpenAI.

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

    Níveis de thinking diferentes de `off` enviam `enable_thinking: true`. Se o seu endpoint espera flags de nível superior no estilo DashScope, use `compat.thinkingFormat: "qwen"` para enviar `enable_thinking` na raiz da requisição.

  </Accordion>

  <Accordion title="Controles de thinking do Nemotron 3">
    vLLM/Nemotron 3 pode usar kwargs de template de chat para controlar se o raciocínio é retornado como raciocínio oculto ou texto de resposta visível. Quando uma sessão do OpenClaw usa `vllm/nemotron-3-*` com thinking desativado, o Plugin vLLM incluído envia:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "force_nonempty_content": true
      }
    }
    ```

    Para personalizar esses valores, defina `chat_template_kwargs` nos params do modelo. Se você também definir `params.extra_body.chat_template_kwargs`, esse valor tem precedência final porque `extra_body` é a última substituição do corpo da requisição.

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

  <Accordion title="Chamadas de ferramentas do Qwen aparecem como texto">
    Primeiro, garanta que o vLLM foi iniciado com o analisador de chamadas de ferramentas e o template de chat corretos para o modelo. Por exemplo, a documentação do vLLM indica `hermes` para modelos Qwen2.5 e `qwen3_xml` para modelos Qwen3-Coder.

    Sintomas:

    - skills ou ferramentas nunca são executadas
    - o assistente imprime JSON/XML bruto, como `{"name":"read","arguments":...}`
    - o vLLM retorna um array `tool_calls` vazio quando o OpenClaw envia `tool_choice: "auto"`

    Algumas combinações de Qwen/vLLM retornam chamadas de ferramentas estruturadas somente quando a requisição usa `tool_choice: "required"`. Para essas entradas de modelo, force o campo de requisição compatível com OpenAI com `params.extra_body`:

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

    Esta é uma solução alternativa de compatibilidade opcional. Ela faz com que toda rodada de modelo com ferramentas exija uma chamada de ferramenta, então use-a somente para uma entrada dedicada de modelo local em que esse comportamento seja aceitável. Não a use como padrão global para todos os modelos vLLM e não use um proxy que converta cegamente texto arbitrário do assistente em chamadas de ferramentas executáveis.

  </Accordion>

  <Accordion title="URL base personalizada">
    Se o seu servidor vLLM é executado em um host ou porta não padrão, defina `baseUrl` na configuração explícita do provedor:

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
  <Accordion title="Primeira resposta lenta ou timeout do servidor remoto">
    Para modelos locais grandes, hosts remotos na LAN ou links tailnet, defina um timeout de requisição no escopo do provedor:

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

    `timeoutSeconds` se aplica somente a requisições HTTP de modelo vLLM, incluindo configuração de conexão, cabeçalhos de resposta, streaming do corpo e o abort total de guarded-fetch. Prefira isso antes de aumentar `agents.defaults.timeoutSeconds`, que controla toda a execução do agente.

  </Accordion>

  <Accordion title="Servidor inacessível">
    Verifique se o servidor vLLM está em execução e acessível:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    Se você vir um erro de conexão, verifique o host, a porta e se o vLLM foi iniciado com o modo de servidor compatível com OpenAI.
    Para endpoints explícitos de loopback, LAN ou Tailscale, o OpenClaw confia na origem exata configurada em `models.providers.vllm.baseUrl` para requisições de modelo protegidas. Origens de metadados/link-local permanecem bloqueadas sem opt-in explícito. Defina `models.providers.vllm.request.allowPrivateNetwork: true` somente quando as requisições vLLM precisarem alcançar outra origem privada, e defina como `false` para optar por sair da confiança na origem exata.

  </Accordion>

  <Accordion title="Erros de autenticação em requisições">
    Se as requisições falharem com erros de autenticação, defina uma `VLLM_API_KEY` real que corresponda à configuração do seu servidor, ou configure o provedor explicitamente em `models.providers.vllm`.

    <Tip>
    Se o seu servidor vLLM não exige autenticação, qualquer valor não vazio para `VLLM_API_KEY` funciona como um sinal de opt-in para o OpenClaw.
    </Tip>

  </Accordion>

  <Accordion title="Nenhum modelo descoberto">
    A descoberta automática exige que `VLLM_API_KEY` esteja definida. Se você definiu `models.providers.vllm`, o OpenClaw usa somente seus modelos declarados, a menos que `agents.defaults.models` inclua `"vllm/*": {}`.
  </Accordion>

  <Accordion title="Ferramentas são renderizadas como texto bruto">
    Se um modelo Qwen imprime sintaxe de ferramenta JSON/XML em vez de executar uma skill, verifique a orientação sobre Qwen em Configuração avançada acima. A correção usual é:

    - iniciar o vLLM com o analisador/template correto para esse modelo
    - confirmar o ID exato do modelo com `openclaw models list --provider vllm`
    - adicionar uma substituição dedicada por modelo `params.extra_body.tool_choice: "required"` somente se `tool_choice: "auto"` ainda retornar chamadas de ferramentas vazias ou somente texto

  </Accordion>
</AccordionGroup>

<Warning>
Mais ajuda: [Solução de problemas](/pt-BR/help/troubleshooting) e [FAQ](/pt-BR/help/faq).
</Warning>

## Relacionados

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
