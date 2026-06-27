---
read_when:
    - Você quer executar o OpenClaw com antirez/ds4
    - Você quer um backend local DeepSeek V4 Flash com chamadas de ferramenta
    - Você precisa da configuração do OpenClaw para ds4-server
summary: Execute o OpenClaw por meio do ds4, um servidor local compatível com OpenAI do DeepSeek V4 Flash
title: ds4
x-i18n:
    generated_at: "2026-06-27T18:03:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a9922421d39f5d2d29dfa62de9fc3de7131dfa96445d0646cd02ad766a125544
    source_path: providers/ds4.md
    workflow: 16
---

[ds4](https://github.com/antirez/ds4) serve o DeepSeek V4 Flash a partir de um backend
Metal local com uma API `/v1` compatível com OpenAI. O OpenClaw se conecta ao ds4
por meio da família genérica de provedores `openai-completions`.

ds4 não é um Plugin de provedor OpenClaw incluído. Configure-o em
`models.providers.ds4` e selecione `ds4/deepseek-v4-flash`.

- ID do provedor: `ds4`
- Plugin: nenhum
- API: Chat Completions compatível com OpenAI (`openai-completions`)
- URL base sugerida: `http://127.0.0.1:18000/v1`
- ID do modelo: `deepseek-v4-flash`
- Chamadas de ferramentas: compatíveis por meio de `tools` e `tool_calls` no estilo OpenAI
- Raciocínio: `thinking` e `reasoning_effort` no estilo DeepSeek

## Requisitos

- macOS com suporte a Metal.
- Um checkout ds4 funcional com `ds4-server` e o arquivo GGUF do DeepSeek V4 Flash.
- Memória suficiente para o contexto que você escolher. Valores maiores de `--ctx` alocam mais
  memória KV quando o servidor inicia.

<Warning>
Turnos de agente OpenClaw incluem esquemas de ferramentas e contexto do workspace. Um contexto pequeno
como `--ctx 4096` pode passar em testes diretos com curl, mas falhar em execuções completas de agente com
`500 prompt exceeds context`. Use pelo menos `--ctx 32768` para testes rápidos de agente e ferramenta.
Use `--ctx 393216` somente quando tiver memória suficiente e quiser o comportamento Think Max do ds4.
</Warning>

## Início rápido

<Steps>
  <Step title="Iniciar ds4-server">
    Substitua `<DS4_DIR>` pelo caminho do seu checkout ds4.

    ```bash
    <DS4_DIR>/ds4-server \
      --model <DS4_DIR>/ds4flash.gguf \
      --host 127.0.0.1 \
      --port 18000 \
      --ctx 32768 \
      --tokens 128
    ```

  </Step>
  <Step title="Verificar o endpoint compatível com OpenAI">
    ```bash
    curl http://127.0.0.1:18000/v1/models
    ```

    A resposta deve incluir `deepseek-v4-flash`.

  </Step>
  <Step title="Adicionar a configuração do provedor OpenClaw">
    Adicione a configuração de [Configuração completa](#full-config) e execute uma verificação pontual
    do modelo:

    ```bash
    openclaw infer model run \
      --local \
      --model ds4/deepseek-v4-flash \
      --thinking off \
      --prompt "Reply with exactly: openclaw-ds4-ok" \
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

Mantenha `contextWindow` alinhado ao valor `ds4-server --ctx`. Mantenha `maxTokens`
alinhado a `--tokens`, a menos que você queira intencionalmente que o OpenClaw solicite menos
saída que o padrão do servidor.

## Inicialização sob demanda

O OpenClaw pode iniciar o ds4 somente quando um modelo `ds4/...` é selecionado. Adicione
`localService` à mesma entrada de provedor:

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

`command` deve ser um caminho absoluto para o executável. Busca pelo shell e expansão de `~` não são
usadas. Consulte [Serviços de modelo locais](/pt-BR/gateway/local-model-services) para ver todos os campos de
`localService`.

## Think Max

O ds4 aplica Think Max somente quando as duas condições são verdadeiras:

- `ds4-server` inicia com `--ctx 393216` ou superior.
- A solicitação usa `reasoning_effort: "max"` ou o campo de esforço equivalente do ds4.

Se você executar esse contexto grande, atualize tanto as flags do servidor quanto os metadados do modelo
OpenClaw:

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

Comece com uma verificação HTTP direta:

```bash
curl http://127.0.0.1:18000/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"deepseek-v4-flash","messages":[{"role":"user","content":"Reply with exactly: ds4-ok"}],"max_tokens":16,"stream":false,"thinking":{"type":"disabled"}}'
```

Depois, teste o roteamento de modelo do OpenClaw:

```bash
openclaw infer model run \
  --local \
  --model ds4/deepseek-v4-flash \
  --thinking off \
  --prompt "Reply with exactly: openclaw-ds4-ok" \
  --json
```

Para um teste rápido completo de agente e chamada de ferramenta, use um contexto de pelo menos 32768:

```bash
openclaw agent \
  --local \
  --session-id ds4-tool-smoke \
  --model ds4/deepseek-v4-flash \
  --thinking off \
  --message "Use the shell command pwd once, then reply exactly: tool-ok <output>" \
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
  <Accordion title="curl /v1/models não consegue conectar">
    ds4 não está em execução ou não está vinculado ao host e à porta em `baseUrl`. Inicie
    `ds4-server` e tente novamente:

    ```bash
    curl http://127.0.0.1:18000/v1/models
    ```

  </Accordion>

  <Accordion title="500 prompt exceeds context">
    O `--ctx` configurado é pequeno demais para o turno do OpenClaw. Aumente
    `ds4-server --ctx` e atualize `models.providers.ds4.models[].contextWindow`
    para corresponder. Turnos completos de agente com ferramentas precisam de substancialmente mais contexto do que uma
    solicitação curl direta com uma única mensagem.
  </Accordion>

  <Accordion title="Think Max não é ativado">
    ds4 usa Think Max somente quando `--ctx` é pelo menos `393216` e a solicitação
    pede `reasoning_effort: "max"`. Contextos menores retornam para raciocínio alto.
  </Accordion>

  <Accordion title="A primeira solicitação é lenta">
    ds4 tem uma fase fria de residência em Metal e aquecimento do modelo. Use
    `localService.readyTimeoutMs: 300000` quando o OpenClaw iniciar o servidor sob
    demanda.
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Serviços de modelo locais" href="/pt-BR/gateway/local-model-services" icon="play">
    Inicie servidores de modelo locais sob demanda antes de solicitações de modelo.
  </Card>
  <Card title="Modelos locais" href="/pt-BR/gateway/local-models" icon="server">
    Escolha e opere backends de modelo locais.
  </Card>
  <Card title="Provedores de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Configure refs de provedor, autenticação e failover.
  </Card>
  <Card title="DeepSeek" href="/pt-BR/providers/deepseek" icon="brain">
    Comportamento nativo do provedor DeepSeek e controles de thinking.
  </Card>
</CardGroup>
