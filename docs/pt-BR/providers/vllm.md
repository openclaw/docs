---
read_when:
    - Você quer executar o OpenClaw com um servidor vLLM local
    - Você quer endpoints `/v1` compatíveis com OpenAI com seus próprios modelos
summary: Execute o OpenClaw com vLLM (servidor local compatível com OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-04-26T11:36:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: fbf424cb532f2b3e188c39545b187e5db6274ff2fadc01c9e4cb0901dbe9824c
    source_path: providers/vllm.md
    workflow: 15
---

vLLM pode servir modelos open-source (e alguns modelos personalizados) por meio de uma API HTTP **compatível com OpenAI**. O OpenClaw se conecta ao vLLM usando a API `openai-completions`.

O OpenClaw também pode **descobrir automaticamente** os modelos disponíveis no vLLM quando você opta por isso com `VLLM_API_KEY` (qualquer valor funciona se o seu servidor não exigir autenticação) e não define uma entrada explícita `models.providers.vllm`.

O OpenClaw trata `vllm` como um provedor local compatível com OpenAI que oferece suporte a
contabilização de uso em streaming, de modo que as contagens de tokens de status/contexto possam ser atualizadas a partir de
respostas de `stream_options.include_usage`.

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

## Descoberta de modelos (provedor implícito)

Quando `VLLM_API_KEY` está definida (ou existe um perfil de autenticação) e você **não** define `models.providers.vllm`, o OpenClaw consulta:

```
GET http://127.0.0.1:8000/v1/models
```

e converte os IDs retornados em entradas de modelo.

<Note>
Se você definir `models.providers.vllm` explicitamente, a descoberta automática será ignorada e você deverá definir os modelos manualmente.
</Note>

## Configuração explícita (modelos manuais)

Use configuração explícita quando:

- o vLLM for executado em um host ou porta diferente
- você quiser fixar os valores de `contextWindow` ou `maxTokens`
- seu servidor exigir uma chave de API real (ou você quiser controlar os headers)
- você se conectar a um endpoint vLLM confiável via loopback, LAN ou Tailscale

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        request: { allowPrivateNetwork: true },
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

## Configuração avançada

<AccordionGroup>
  <Accordion title="Comportamento no estilo proxy">
    O vLLM é tratado como um backend `/v1` compatível com OpenAI no estilo proxy, não como um endpoint
    OpenAI nativo. Isso significa:

    | Comportamento | Aplicado? |
    |----------|----------|
    | Formatação nativa de requisição OpenAI | Não |
    | `service_tier` | Não enviado |
    | `store` nas respostas | Não enviado |
    | Dicas de cache de prompt | Não enviadas |
    | Formatação de payload de compatibilidade de reasoning do OpenAI | Não aplicada |
    | Headers ocultos de atribuição do OpenClaw | Não injetados em URLs base personalizadas |

  </Accordion>

  <Accordion title="Controles de thinking do Nemotron 3">
    vLLM/Nemotron 3 pode usar kwargs de chat-template para controlar se o reasoning é
    retornado como reasoning oculto ou texto de resposta visível. Quando uma sessão do OpenClaw
    usa `vllm/nemotron-3-*` com thinking desativado, o OpenClaw envia:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "force_nonempty_content": true
      }
    }
    ```

    Para personalizar esses valores, defina `chat_template_kwargs` em params do modelo.
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

  <Accordion title="URL base personalizada">
    Se o seu servidor vLLM for executado em um host ou porta diferente do padrão, defina `baseUrl` na configuração explícita do provedor:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:9000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            request: { allowPrivateNetwork: true },
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
  <Accordion title="Não foi possível alcançar o servidor">
    Verifique se o servidor vLLM está em execução e acessível:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    Se você vir um erro de conexão, verifique o host, a porta e se o vLLM foi iniciado no modo de servidor compatível com OpenAI.
    Para endpoints explícitos via loopback, LAN ou Tailscale, também defina
    `models.providers.vllm.request.allowPrivateNetwork: true`; requisições de provedor
    bloqueiam URLs de rede privada por padrão, a menos que o provedor seja
    explicitamente confiável.

  </Accordion>

  <Accordion title="Erros de autenticação nas requisições">
    Se as requisições falharem com erros de autenticação, defina uma `VLLM_API_KEY` real que corresponda à configuração do seu servidor ou configure o provedor explicitamente em `models.providers.vllm`.

    <Tip>
    Se o seu servidor vLLM não exigir autenticação, qualquer valor não vazio para `VLLM_API_KEY` funciona como um sinal de opt-in para o OpenClaw.
    </Tip>

  </Accordion>

  <Accordion title="Nenhum modelo descoberto">
    A descoberta automática exige que `VLLM_API_KEY` esteja definida **e** que não exista uma entrada de configuração explícita `models.providers.vllm`. Se você definiu o provedor manualmente, o OpenClaw ignora a descoberta e usa apenas os modelos declarados por você.
  </Accordion>
</AccordionGroup>

<Warning>
Mais ajuda: [Solução de problemas](/pt-BR/help/troubleshooting) e [FAQ](/pt-BR/help/faq).
</Warning>

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
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
