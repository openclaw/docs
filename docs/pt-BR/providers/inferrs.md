---
read_when:
    - Você quer executar o OpenClaw com um servidor inferrs local
    - Você está servindo o Gemma ou outro modelo por meio do inferrs
    - Você precisa dos sinalizadores de compatibilidade exatos do OpenClaw para inferrs
summary: Execute o OpenClaw por meio do inferrs (servidor local compatível com OpenAI)
title: Infere
x-i18n:
    generated_at: "2026-05-10T19:48:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8352da589baaa3a193bb3a56d12ee1a50630346dda186898346e805844d22aa1
    source_path: providers/inferrs.md
    workflow: 16
    postprocess_version: locale-links-v1
---

[inferrs](https://github.com/ericcurtin/inferrs) pode servir modelos locais por trás de uma API `/v1` compatível com OpenAI. O OpenClaw funciona com `inferrs` pelo caminho genérico `openai-completions`.

| Propriedade       | Valor                                                              |
| ----------------- | ------------------------------------------------------------------ |
| ID do provedor    | `inferrs` (personalizado; configure em `models.providers.inferrs`) |
| Plugin            | nenhum — `inferrs` não é um plugin de provedor OpenClaw incluído   |
| Var. env de auth  | Opcional. Qualquer valor funciona se o seu servidor inferrs não tiver auth |
| API               | compatível com OpenAI (`openai-completions`)                       |
| URL base sugerida | `http://127.0.0.1:8080/v1` (ou onde quer que seu servidor inferrs esteja) |

<Note>
  No momento, `inferrs` é melhor tratado como um backend personalizado auto-hospedado compatível com OpenAI, não como um plugin de provedor OpenClaw dedicado. Você o configura por `models.providers.inferrs`, em vez de uma flag de escolha de integração. Se você precisar de um plugin realmente incluído com descoberta automática, veja [SGLang](/pt-BR/providers/sglang) ou [vLLM](/pt-BR/providers/vllm).
</Note>

## Primeiros passos

<Steps>
  <Step title="Start inferrs with a model">
    ```bash
    inferrs serve google/gemma-4-E2B-it \
      --host 127.0.0.1 \
      --port 8080 \
      --device metal
    ```
  </Step>
  <Step title="Verify the server is reachable">
    ```bash
    curl http://127.0.0.1:8080/health
    curl http://127.0.0.1:8080/v1/models
    ```
  </Step>
  <Step title="Add an OpenClaw provider entry">
    Adicione uma entrada explícita de provedor e aponte seu modelo padrão para ela. Veja o exemplo completo de configuração abaixo.
  </Step>
</Steps>

## Exemplo completo de configuração

Este exemplo usa Gemma 4 em um servidor `inferrs` local.

```json5
{
  agents: {
    defaults: {
      model: { primary: "inferrs/google/gemma-4-E2B-it" },
      models: {
        "inferrs/google/gemma-4-E2B-it": {
          alias: "Gemma 4 (inferrs)",
        },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      inferrs: {
        baseUrl: "http://127.0.0.1:8080/v1",
        apiKey: "inferrs-local",
        api: "openai-completions",
        models: [
          {
            id: "google/gemma-4-E2B-it",
            name: "Gemma 4 E2B (inferrs)",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 4096,
            compat: {
              requiresStringContent: true,
            },
          },
        ],
      },
    },
  },
}
```

## Inicialização sob demanda

O Inferrs também pode ser iniciado pelo OpenClaw apenas quando um modelo `inferrs/...`
for selecionado. Adicione `localService` à mesma entrada de provedor:

```json5
{
  models: {
    providers: {
      inferrs: {
        baseUrl: "http://127.0.0.1:8080/v1",
        apiKey: "inferrs-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "/opt/homebrew/bin/inferrs",
          args: [
            "serve",
            "google/gemma-4-E2B-it",
            "--host",
            "127.0.0.1",
            "--port",
            "8080",
            "--device",
            "metal",
          ],
          healthUrl: "http://127.0.0.1:8080/v1/models",
          readyTimeoutMs: 180000,
          idleStopMs: 0,
        },
        models: [
          {
            id: "google/gemma-4-E2B-it",
            name: "Gemma 4 E2B (inferrs)",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 4096,
            compat: {
              requiresStringContent: true,
            },
          },
        ],
      },
    },
  },
}
```

`command` deve ser absoluto. Use `which inferrs` no host do Gateway e coloque esse
caminho na configuração. Para a referência completa dos campos, veja
[Serviços de modelos locais](/pt-BR/gateway/local-model-services).

## Configuração avançada

<AccordionGroup>
  <Accordion title="Why requiresStringContent matters">
    Algumas rotas de Chat Completions do `inferrs` aceitam apenas
    `messages[].content` como string, não arrays estruturados de partes de conteúdo.

    <Warning>
    Se execuções do OpenClaw falharem com um erro como:

    ```text
    messages[1].content: invalid type: sequence, expected a string
    ```

    defina `compat.requiresStringContent: true` na entrada do seu modelo.
    </Warning>

    ```json5
    compat: {
      requiresStringContent: true
    }
    ```

    O OpenClaw transformará partes de conteúdo de texto puro em strings simples antes de enviar
    a solicitação.

  </Accordion>

  <Accordion title="Gemma and tool-schema caveat">
    Algumas combinações atuais de `inferrs` + Gemma aceitam pequenas solicitações diretas
    para `/v1/chat/completions`, mas ainda falham em turnos completos de agent-runtime
    do OpenClaw.

    Se isso acontecer, tente isto primeiro:

    ```json5
    compat: {
      requiresStringContent: true,
      supportsTools: false
    }
    ```

    Isso desativa a superfície de esquema de ferramentas do OpenClaw para o modelo e pode reduzir a pressão
    do prompt em backends locais mais restritos.

    Se solicitações diretas mínimas ainda funcionarem, mas turnos normais de agente do OpenClaw continuarem
    travando dentro do `inferrs`, o problema restante normalmente está no comportamento
    upstream do modelo/servidor, e não na camada de transporte do OpenClaw.

  </Accordion>

  <Accordion title="Manual smoke test">
    Depois de configurado, teste as duas camadas:

    ```bash
    curl http://127.0.0.1:8080/v1/chat/completions \
      -H 'content-type: application/json' \
      -d '{"model":"google/gemma-4-E2B-it","messages":[{"role":"user","content":"What is 2 + 2?"}],"stream":false}'
    ```

    ```bash
    openclaw infer model run \
      --model inferrs/google/gemma-4-E2B-it \
      --prompt "What is 2 + 2? Reply with one short sentence." \
      --json
    ```

    Se o primeiro comando funcionar, mas o segundo falhar, consulte a seção de solução de problemas abaixo.

  </Accordion>

  <Accordion title="Proxy-style behavior">
    `inferrs` é tratado como um backend `/v1` compatível com OpenAI em estilo proxy, não como um
    endpoint OpenAI nativo.

    - A modelagem de solicitações exclusiva da OpenAI nativa não se aplica aqui
    - Sem `service_tier`, sem `store` de Responses, sem dicas de cache de prompt e sem
      modelagem de payload de compatibilidade de raciocínio da OpenAI
    - Cabeçalhos ocultos de atribuição do OpenClaw (`originator`, `version`, `User-Agent`)
      não são injetados em URLs base personalizadas do `inferrs`

  </Accordion>
</AccordionGroup>

## Solução de problemas

<AccordionGroup>
  <Accordion title="curl /v1/models fails">
    `inferrs` não está em execução, não está acessível ou não está vinculado ao
    host/porta esperado. Verifique se o servidor foi iniciado e está escutando no endereço que você
    configurou.
  </Accordion>

  <Accordion title="messages[].content expected a string">
    Defina `compat.requiresStringContent: true` na entrada do modelo. Veja a seção
    `requiresStringContent` acima para detalhes.
  </Accordion>

  <Accordion title="Direct /v1/chat/completions calls pass but openclaw infer model run fails">
    Tente definir `compat.supportsTools: false` para desativar a superfície de esquema de ferramentas.
    Veja a observação sobre o esquema de ferramentas do Gemma acima.
  </Accordion>

  <Accordion title="inferrs still crashes on larger agent turns">
    Se o OpenClaw não recebe mais erros de esquema, mas `inferrs` ainda trava em turnos maiores
    de agente, trate isso como uma limitação upstream do `inferrs` ou do modelo. Reduza
    a pressão do prompt ou mude para outro backend ou modelo local.
  </Accordion>
</AccordionGroup>

<Tip>
Para ajuda geral, veja [Solução de problemas](/pt-BR/help/troubleshooting) e [FAQ](/pt-BR/help/faq).
</Tip>

## Relacionados

<CardGroup cols={2}>
  <Card title="Local models" href="/pt-BR/gateway/local-models" icon="server">
    Executando o OpenClaw com servidores de modelos locais.
  </Card>
  <Card title="Local model services" href="/pt-BR/gateway/local-model-services" icon="play">
    Iniciando servidores de modelos locais sob demanda para provedores configurados.
  </Card>
  <Card title="Gateway troubleshooting" href="/pt-BR/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail" icon="wrench">
    Depurando backends locais compatíveis com OpenAI que passam nas sondagens, mas falham em execuções de agente.
  </Card>
  <Card title="Model selection" href="/pt-BR/concepts/model-providers" icon="layers">
    Visão geral de todos os provedores, refs de modelo e comportamento de failover.
  </Card>
</CardGroup>
