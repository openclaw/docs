---
read_when:
    - Você quer executar o OpenClaw com o antirez/ds4
    - Você quer um backend local do DeepSeek V4 Flash com chamadas de ferramentas
    - Você precisa da configuração do OpenClaw para o ds4-server
summary: Execute o OpenClaw por meio do ds4, um servidor local compatível com a OpenAI para o DeepSeek V4 Flash
title: ds4
x-i18n:
    generated_at: "2026-07-12T15:31:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: be449813295648694625ef8003b3f4b12903535b74816916ca5af0695174fbf4
    source_path: providers/ds4.md
    workflow: 16
---

[ds4](https://github.com/antirez/ds4) disponibiliza o DeepSeek V4 Flash por meio de um backend
Metal local com uma API `/v1` compatível com a OpenAI. O OpenClaw se conecta ao ds4
por meio da família genérica de provedores `openai-completions`.

O ds4 não é um plugin de provedor incluído no OpenClaw. Configure-o em
`models.providers.ds4` e selecione `ds4/deepseek-v4-flash`.

| Propriedade       | Valor                                                      |
| ----------------- | ---------------------------------------------------------- |
| ID do provedor    | `ds4`                                                      |
| Plugin            | nenhum (somente configuração)                              |
| API               | Chat Completions compatível com a OpenAI (`openai-completions`) |
| URL base          | `http://127.0.0.1:18000/v1` (sugerida)                     |
| ID do modelo      | `deepseek-v4-flash`                                        |
| Chamadas de ferramentas | `tools` / `tool_calls` no estilo da OpenAI            |
| Raciocínio        | `thinking` e `reasoning_effort` no estilo do DeepSeek      |

## Requisitos

- macOS com suporte ao Metal.
- Um checkout funcional do ds4 com `ds4-server` e o arquivo GGUF do DeepSeek V4 Flash.
- Memória suficiente para o contexto escolhido; valores maiores de `--ctx` alocam mais
  memória KV na inicialização do servidor.

<Warning>
As interações do agente do OpenClaw incluem esquemas de ferramentas e o contexto do espaço de trabalho. Um contexto
pequeno, como `--ctx 4096`, pode passar em testes diretos com curl, mas falhar em execuções completas do agente com
`500 prompt exceeds context`. Use pelo menos `--ctx 32768` para testes de fumaça do agente e das ferramentas.
Use `--ctx 393216` somente com memória suficiente e para habilitar o Think Max do ds4.
</Warning>

## Início rápido

<Steps>
  <Step title="Inicie o ds4-server">
    Substitua `<DS4_DIR>` pelo caminho do seu checkout do ds4.

    ```bash
    <DS4_DIR>/ds4-server \
      --model <DS4_DIR>/ds4flash.gguf \
      --host 127.0.0.1 \
      --port 18000 \
      --ctx 32768 \
      --tokens 128
    ```

  </Step>
  <Step title="Verifique o endpoint compatível com a OpenAI">
    ```bash
    curl http://127.0.0.1:18000/v1/models
    ```

    A resposta deve incluir `deepseek-v4-flash`.

  </Step>
  <Step title="Adicione a configuração do provedor ao OpenClaw">
    Adicione a configuração de [Configuração completa](#full-config) e execute uma verificação
    pontual do modelo:

    ```bash
    openclaw infer model run \
      --local \
      --model ds4/deepseek-v4-flash \
      --thinking off \
      --prompt "Responda exatamente com: openclaw-ds4-ok" \
      --json
    ```

  </Step>
</Steps>

## Configuração completa

Use esta configuração quando o ds4 já estiver em execução em `127.0.0.1:18000`.

```json5
{
  agents: {
    defaults: {
      model: { primary: "ds4/deepseek-v4-flash" },
      models: {
        "ds4/deepseek-v4-flash": {
          alias: "DS4 local",
        },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      ds4: {
        baseUrl: "http://127.0.0.1:18000/v1",
        apiKey: "ds4-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        models: [
          {
            id: "deepseek-v4-flash",
            name: "DeepSeek V4 Flash (ds4)",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 32768,
            maxTokens: 128,
            compat: {
              supportsUsageInStreaming: true,
              supportsReasoningEffort: true,
              maxTokensField: "max_tokens",
              supportsStrictMode: false,
              thinkingFormat: "deepseek",
              supportedReasoningEfforts: ["low", "medium", "high", "xhigh"],
            },
          },
        ],
      },
    },
  },
}
```

Mantenha `contextWindow` alinhado com `ds4-server --ctx`. Mantenha `maxTokens` alinhado
com `--tokens`, a menos que você queira intencionalmente que o OpenClaw solicite menos saída
do que o padrão do servidor.

## Inicialização sob demanda

O OpenClaw pode iniciar o ds4 somente quando um modelo `ds4/...` for selecionado. Adicione
`localService` à mesma entrada do provedor:

```json5
{
  models: {
    providers: {
      ds4: {
        baseUrl: "http://127.0.0.1:18000/v1",
        apiKey: "ds4-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "<DS4_DIR>/ds4-server",
          args: [
            "--model",
            "<DS4_DIR>/ds4flash.gguf",
            "--host",
            "127.0.0.1",
            "--port",
            "18000",
            "--ctx",
            "32768",
            "--tokens",
            "128",
          ],
          cwd: "<DS4_DIR>",
          healthUrl: "http://127.0.0.1:18000/v1/models",
          readyTimeoutMs: 300000,
          idleStopMs: 0,
        },
        models: [
          {
            id: "deepseek-v4-flash",
            name: "DeepSeek V4 Flash (ds4)",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 32768,
            maxTokens: 128,
            compat: {
              supportsUsageInStreaming: true,
              supportsReasoningEffort: true,
              maxTokensField: "max_tokens",
              supportsStrictMode: false,
              thinkingFormat: "deepseek",
              supportedReasoningEfforts: ["low", "medium", "high", "xhigh"],
            },
          },
        ],
      },
    },
  },
}
```

`command` deve ser um caminho absoluto para o executável. A busca pelo shell e a expansão de `~`
não são usadas. Consulte [Serviços de modelos locais](/pt-BR/gateway/local-model-services) para conhecer
todos os campos de `localService`.

## Think Max

O ds4 aplica o Think Max somente quando as duas condições são verdadeiras:

- O `ds4-server` é iniciado com `--ctx 393216` ou superior.
- A solicitação usa `reasoning_effort: "max"` (ou o campo de esforço equivalente do ds4).

Se você executar esse contexto amplo, atualize tanto as opções do servidor quanto os metadados
do modelo do OpenClaw:

```json5
{
  contextWindow: 393216,
  maxTokens: 384000,
  compat: {
    supportsUsageInStreaming: true,
    supportsReasoningEffort: true,
    maxTokensField: "max_tokens",
    supportsStrictMode: false,
    thinkingFormat: "deepseek",
    supportedReasoningEfforts: ["low", "medium", "high", "xhigh", "max"],
  },
}
```

## Teste

Verificação HTTP direta, ignorando o OpenClaw:

```bash
curl http://127.0.0.1:18000/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"deepseek-v4-flash","messages":[{"role":"user","content":"Responda exatamente com: ds4-ok"}],"max_tokens":16,"stream":false,"thinking":{"type":"disabled"}}'
```

Roteamento do modelo pelo OpenClaw (igual à verificação do Início rápido):

```bash
openclaw infer model run \
  --local \
  --model ds4/deepseek-v4-flash \
  --thinking off \
  --prompt "Responda exatamente com: openclaw-ds4-ok" \
  --json
```

Teste de fumaça completo do agente e das chamadas de ferramentas, com contexto de pelo menos 32768:

```bash
openclaw agent \
  --local \
  --session-id ds4-tool-smoke \
  --model ds4/deepseek-v4-flash \
  --thinking off \
  --message "Use o comando de shell pwd uma vez e depois responda exatamente com: tool-ok <output>" \
  --json \
  --timeout 240
```

Resultado esperado:

- `executionTrace.winnerProvider` é `ds4`
- `executionTrace.winnerModel` é `deepseek-v4-flash`
- `toolSummary.calls` é pelo menos `1`
- `finalAssistantVisibleText` começa com `tool-ok`

## Solução de problemas

<AccordionGroup>
  <Accordion title="curl /v1/models não consegue se conectar">
    O ds4 não está em execução ou não está vinculado ao host/à porta de `baseUrl`. Inicie
    o `ds4-server` e tente novamente:

    ```bash
    curl http://127.0.0.1:18000/v1/models
    ```

  </Accordion>

  <Accordion title="500 prompt exceeds context">
    O `--ctx` configurado é pequeno demais para a interação do OpenClaw. Aumente
    `ds4-server --ctx` e atualize `models.providers.ds4.models[].contextWindow`
    para corresponder. Interações completas do agente com ferramentas precisam de muito mais contexto do que uma
    solicitação direta de uma única mensagem com curl.
  </Accordion>

  <Accordion title="O Think Max não é ativado">
    O ds4 só usa o Think Max quando `--ctx` é pelo menos `393216` e a solicitação
    pede `reasoning_effort: "max"`. Contextos menores usam como alternativa o raciocínio
    alto.
  </Accordion>

  <Accordion title="A primeira solicitação é lenta">
    O ds4 passa por uma fase inicial de residência no Metal e de aquecimento do modelo. Defina
    `localService.readyTimeoutMs: 300000` quando o OpenClaw iniciar o servidor sob
    demanda.
  </Accordion>
</AccordionGroup>

## Relacionados

<CardGroup cols={2}>
  <Card title="Serviços de modelos locais" href="/pt-BR/gateway/local-model-services" icon="play">
    Inicie servidores de modelos locais sob demanda antes das solicitações ao modelo.
  </Card>
  <Card title="Modelos locais" href="/pt-BR/gateway/local-models" icon="server">
    Escolha e opere backends de modelos locais.
  </Card>
  <Card title="Provedores de modelos" href="/pt-BR/concepts/model-providers" icon="layers">
    Configure referências de provedores, autenticação e failover.
  </Card>
  <Card title="DeepSeek" href="/pt-BR/providers/deepseek" icon="brain">
    Comportamento nativo do provedor DeepSeek e controles de raciocínio.
  </Card>
</CardGroup>
