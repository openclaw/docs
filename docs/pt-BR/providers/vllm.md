---
read_when:
    - Você quer executar o OpenClaw com um servidor vLLM local
    - Você quer endpoints /v1 compatíveis com a OpenAI usando seus próprios modelos
summary: Execute o OpenClaw com o vLLM (servidor local compatível com a OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-07-12T15:34:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 98d1044c0a82efb6c9937e961d765d0cfcea8664cbaa043168921b457756512c
    source_path: providers/vllm.md
    workflow: 16
---

O vLLM disponibiliza modelos de código aberto (e alguns personalizados) por meio de uma API HTTP **compatível com OpenAI**. O OpenClaw se conecta usando a API `openai-completions` e pode **descobrir automaticamente** os modelos quando você habilita esse recurso com `VLLM_API_KEY`.

| Propriedade        | Valor                                      |
| ------------------ | ------------------------------------------ |
| ID do provedor     | `vllm`                                     |
| API                | `openai-completions` (compatível com OpenAI) |
| Autenticação       | Variável de ambiente `VLLM_API_KEY`        |
| URL base padrão    | `http://127.0.0.1:8000/v1`                 |
| Uso em streaming   | Compatível (`stream_options.include_usage`) |

## Primeiros passos

<Steps>
  <Step title="Inicie o vLLM com um servidor compatível com OpenAI">
    Sua URL base deve expor endpoints `/v1` (`/v1/models`, `/v1/chat/completions`). O vLLM normalmente é executado em:

    ```text
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="Defina a variável de ambiente da chave de API">
    Qualquer valor não vazio funciona se o servidor não exigir autenticação:

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="Selecione um modelo">
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
  <Step title="Verifique se o modelo está disponível">
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

Configure explicitamente quando o vLLM for executado em outro host ou porta, quando você quiser fixar `contextWindow`/`maxTokens`, quando o servidor exigir uma chave de API real ou quando você se conectar a um endpoint confiável de loopback, LAN ou Tailscale:

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        timeoutSeconds: 300, // Opcional: estenda o tempo limite das solicitações para modelos locais lentos
        models: [
          {
            id: "your-model-id",
            name: "Modelo vLLM local",
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
  <Accordion title="Comportamento no estilo de proxy">
    O vLLM é tratado como um backend `/v1` no estilo de proxy compatível com OpenAI, e não como um endpoint nativo da OpenAI:

    | Comportamento                                         | Aplicado?                             |
    | ----------------------------------------------------- | ------------------------------------- |
    | Formatação nativa de solicitações da OpenAI           | Não                                   |
    | `service_tier`                                        | Não enviado                           |
    | `store` da API Responses                              | Não enviado                           |
    | Dicas de cache de prompts                             | Não enviadas                          |
    | Formatação do payload de compatibilidade de raciocínio da OpenAI | Não aplicada               |
    | Cabeçalhos ocultos de atribuição do OpenClaw          | Não injetados em URLs base personalizadas |

  </Accordion>

  <Accordion title="Controles de pensamento do Qwen">
    Para modelos Qwen, defina `compat.thinkingFormat: "qwen-chat-template"` na entrada do modelo quando o servidor esperar argumentos nomeados do template de chat do Qwen. Esses modelos expõem um perfil binário `/think` (`off`, `on`), pois o pensamento do template de chat do Qwen é um sinalizador de ativação/desativação, e não uma escala de esforço no estilo da OpenAI.

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

    Níveis de pensamento diferentes de `off` enviam `enable_thinking: true`. Se o seu endpoint esperar sinalizadores de nível superior no estilo do DashScope, use `compat.thinkingFormat: "qwen"` para enviar `enable_thinking` na raiz da solicitação.

  </Accordion>

  <Accordion title="Controles de pensamento do Nemotron 3">
    Para modelos `vllm/nemotron-3-*` com o pensamento desativado, o plugin incluído envia:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "force_nonempty_content": true
      }
    }
    ```

    Para personalizar esses valores, defina `chat_template_kwargs` nos parâmetros do modelo. Se você também definir `params.extra_body.chat_template_kwargs`, esse valor prevalecerá porque `extra_body` é a última substituição do corpo da solicitação.

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
    Primeiro, confirme se o vLLM foi iniciado com o analisador de chamadas de ferramentas e o template de chat corretos para o modelo. A documentação do vLLM indica `hermes` para modelos Qwen2.5 e `qwen3_xml` para modelos Qwen3-Coder.

    Sintomas: habilidades/ferramentas nunca são executadas, o assistente imprime JSON/XML bruto, como `{"name":"read","arguments":...}`, ou o vLLM retorna um array `tool_calls` vazio quando o OpenClaw envia `tool_choice: "auto"`.

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

    Substitua o ID do modelo pelo ID exato retornado por `openclaw models list --provider vllm` ou aplique a mesma substituição pela CLI:

    ```bash
    openclaw config set agents.defaults.models '{"vllm/Qwen-Qwen2.5-Coder-32B-Instruct":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
    ```

    Esta é uma solução alternativa opcional: ela força cada turno com ferramentas a realizar uma chamada de ferramenta; portanto, use-a somente em uma entrada de modelo dedicada na qual isso seja aceitável. Não a defina como padrão global para todos os modelos vLLM nem a combine com um proxy que converta texto arbitrário do assistente em chamadas de ferramentas executáveis.

  </Accordion>

  <Accordion title="URL base personalizada">
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
                name: "Modelo vLLM remoto",
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
  <Accordion title="Primeira resposta lenta ou tempo limite do servidor remoto">
    Para modelos locais grandes, hosts remotos na LAN ou conexões pela tailnet, defina um tempo limite de solicitação no escopo do provedor:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:8000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            timeoutSeconds: 300,
            models: [{ id: "your-model-id", name: "Modelo vLLM local" }],
          },
        },
      },
    }
    ```

    `timeoutSeconds` aplica-se somente às solicitações HTTP dos modelos vLLM: estabelecimento da conexão, cabeçalhos da resposta, streaming do corpo e interrupção total da busca protegida. Ele também eleva o limite do monitor de inatividade/streaming do LLM acima do padrão implícito de ~120s para esse provedor. Prefira essa opção a aumentar `agents.defaults.timeoutSeconds`, que controla toda a execução do agente.

  </Accordion>

  <Accordion title="Servidor inacessível">
    Verifique se o servidor vLLM está em execução e acessível:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    Se ocorrer um erro de conexão, verifique o host, a porta e se o vLLM foi iniciado no modo de servidor compatível com OpenAI. O OpenClaw confia na origem exata configurada em `models.providers.vllm.baseUrl` para solicitações protegidas de modelos em endpoints de loopback, LAN e Tailscale. Origens de metadados/link-local permanecem bloqueadas sem habilitação explícita. Defina `models.providers.vllm.request.allowPrivateNetwork: true` somente quando as solicitações do vLLM precisarem alcançar outra origem privada, ou `false` para desativar a confiança na origem exata.

  </Accordion>

  <Accordion title="Erros de autenticação nas solicitações">
    Se as solicitações falharem com erros de autenticação, defina uma `VLLM_API_KEY` real que corresponda à configuração do servidor ou configure o provedor explicitamente em `models.providers.vllm`.

    <Tip>
    Se o servidor vLLM não exigir autenticação, qualquer valor não vazio para `VLLM_API_KEY` funcionará como um sinal de habilitação para o OpenClaw.
    </Tip>

  </Accordion>

  <Accordion title="Nenhum modelo descoberto">
    A descoberta automática exige que `VLLM_API_KEY` esteja definida. Se você definiu `models.providers.vllm`, o OpenClaw usará somente os modelos declarados, a menos que `agents.defaults.models` inclua `"vllm/*": {}`.
  </Accordion>

  <Accordion title="Ferramentas renderizadas como texto bruto">
    Se um modelo Qwen imprimir a sintaxe JSON/XML de ferramentas em vez de executar uma habilidade:

    - Inicie o vLLM com o analisador/template correto para esse modelo.
    - Confirme o ID exato do modelo com `openclaw models list --provider vllm`.
    - Adicione uma substituição dedicada por modelo `params.extra_body.tool_choice: "required"` somente se `tool_choice: "auto"` ainda retornar chamadas de ferramentas vazias ou apenas como texto.

  </Accordion>
</AccordionGroup>

<Warning>
Mais ajuda: [Solução de problemas](/pt-BR/help/troubleshooting) e [Perguntas frequentes](/pt-BR/help/faq).
</Warning>

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelos" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, referências de modelos e comportamento de failover.
  </Card>
  <Card title="OpenAI" href="/pt-BR/providers/openai" icon="bolt">
    Provedor nativo da OpenAI e comportamento de rotas compatíveis com OpenAI.
  </Card>
  <Card title="OAuth e autenticação" href="/pt-BR/gateway/authentication" icon="key">
    Detalhes de autenticação e regras de reutilização de credenciais.
  </Card>
  <Card title="Solução de problemas" href="/pt-BR/help/troubleshooting" icon="wrench">
    Problemas comuns e como resolvê-los.
  </Card>
</CardGroup>
