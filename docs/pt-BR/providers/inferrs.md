---
read_when:
    - Você quer executar o OpenClaw com um servidor inferrs local
    - Você está disponibilizando o Gemma ou outro modelo por meio do inferrs
    - Você precisa dos sinalizadores de compatibilidade exatos do OpenClaw para inferrs
summary: Execute o OpenClaw por meio do inferrs (servidor local compatível com a OpenAI)
title: Infere
x-i18n:
    generated_at: "2026-07-12T00:18:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8b9b6fe337a2ec6536332dd62840052fd802fad0a5f3d885ce137523266ff3c9
    source_path: providers/inferrs.md
    workflow: 16
---

[inferrs](https://github.com/ericcurtin/inferrs) disponibiliza modelos locais por meio de uma API `/v1` compatível com a OpenAI. O OpenClaw se comunica com ele por meio do adaptador genérico `openai-completions`.

| Propriedade     | Valor                                                                          |
| --------------- | ------------------------------------------------------------------------------ |
| ID do provedor  | `inferrs` (personalizado; configure em `models.providers.inferrs`)             |
| Plugin          | nenhum — não é um plugin de provedor incluído no OpenClaw                      |
| Var. de amb. de autenticação | nenhuma obrigatória; qualquer valor funciona se o servidor inferrs não tiver autenticação |
| API             | compatível com a OpenAI (`openai-completions`)                                 |
| URL base sugerida | `http://127.0.0.1:8080/v1` (ou onde quer que o servidor inferrs esteja escutando) |

<Note>
  O `inferrs` é um backend personalizado, auto-hospedado e compatível com a OpenAI, não um plugin de provedor dedicado do OpenClaw: você o configura em `models.providers.inferrs` em vez de escolher uma opção de autenticação durante a integração inicial. Para um plugin incluído com descoberta automática, consulte [SGLang](/pt-BR/providers/sglang) ou [vLLM](/pt-BR/providers/vllm).
</Note>

## Primeiros passos

<Steps>
  <Step title="Inicie o inferrs com um modelo">
    ```bash
    inferrs serve google/gemma-4-E2B-it \
      --host 127.0.0.1 \
      --port 8080 \
      --device metal
    ```
  </Step>
  <Step title="Verifique se o servidor está acessível">
    ```bash
    curl http://127.0.0.1:8080/health
    curl http://127.0.0.1:8080/v1/models
    ```
  </Step>
  <Step title="Adicione uma entrada de provedor do OpenClaw">
    Adicione uma entrada explícita de provedor e aponte seu modelo padrão para ela. Consulte o exemplo de configuração abaixo.
  </Step>
</Steps>

## Exemplo de configuração completa

Gemma 4 em um servidor `inferrs` local:

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

O OpenClaw pode iniciar o próprio `inferrs` somente quando um modelo `inferrs/...` estiver selecionado. Adicione `localService` à mesma entrada de provedor:

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

`command` deve ser um caminho absoluto. Execute `which inferrs` no host do Gateway e use esse caminho. Referência completa dos campos: [Serviços de modelos locais](/pt-BR/gateway/local-model-services).

## Configuração avançada

<AccordionGroup>
  <Accordion title="Por que requiresStringContent é importante">
    Algumas rotas de Chat Completions do `inferrs` aceitam apenas valores de string em `messages[].content`, e não matrizes estruturadas de partes de conteúdo.

    <Warning>
    Se as execuções do OpenClaw falharem com:

    ```text
    messages[1].content: invalid type: sequence, expected a string
    ```

    defina `compat.requiresStringContent: true` na entrada do modelo. O OpenClaw então converte partes de conteúdo compostas somente por texto em strings simples antes de enviar a solicitação.
    </Warning>

  </Accordion>

  <Accordion title="Ressalva sobre o Gemma e o esquema de ferramentas">
    Algumas combinações de `inferrs` + Gemma aceitam pequenas solicitações diretas para `/v1/chat/completions`, mas falham em turnos completos do runtime de agentes do OpenClaw. Primeiro, tente desabilitar a superfície do esquema de ferramentas:

    ```json5
    compat: {
      requiresStringContent: true,
      supportsTools: false
    }
    ```

    Isso reduz a pressão do prompt sobre backends locais mais rigorosos. Se pequenas solicitações diretas ainda funcionarem, mas turnos normais de agentes do OpenClaw continuarem causando falhas no `inferrs`, considere isso uma limitação do modelo ou servidor upstream, e não um problema de transporte do OpenClaw.

  </Accordion>

  <Accordion title="Teste de fumaça manual">
    Teste as duas camadas após a configuração:

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

    Se o primeiro comando funcionar, mas o segundo falhar, consulte a seção Solução de problemas abaixo.

  </Accordion>

  <Accordion title="Comportamento semelhante a proxy">
    Como o `inferrs` usa o adaptador genérico `openai-completions` (e não `openai-responses`), a formatação de solicitações exclusiva da OpenAI nativa nunca é aplicada: nenhum `service_tier`, nenhum `store` da Responses, nenhuma dica de cache de prompt e nenhuma formatação de payload de compatibilidade de raciocínio da OpenAI são enviados.
  </Accordion>
</AccordionGroup>

## Solução de problemas

<AccordionGroup>
  <Accordion title="curl /v1/models falha">
    O `inferrs` não está em execução, não está acessível ou não está vinculado ao host/porta que você configurou. Confirme se o servidor foi iniciado e está escutando nesse endereço.
  </Accordion>

  <Accordion title="messages[].content esperava uma string">
    Defina `compat.requiresStringContent: true` na entrada do modelo (consulte acima).
  </Accordion>

  <Accordion title="Chamadas diretas para /v1/chat/completions funcionam, mas openclaw infer model run falha">
    Defina `compat.supportsTools: false` para desabilitar a superfície do esquema de ferramentas (consulte a ressalva sobre o Gemma acima).
  </Accordion>

  <Accordion title="O inferrs ainda falha em turnos maiores de agentes">
    Se os erros de esquema desaparecerem, mas o `inferrs` ainda falhar em turnos maiores de agentes, considere isso uma limitação upstream do `inferrs` ou do modelo. Reduza a pressão do prompt ou troque de backend/modelo.
  </Accordion>
</AccordionGroup>

<Tip>
Para obter ajuda geral, consulte [Solução de problemas](/pt-BR/help/troubleshooting) e [Perguntas frequentes](/pt-BR/help/faq).
</Tip>

## Relacionados

<CardGroup cols={2}>
  <Card title="Modelos locais" href="/pt-BR/gateway/local-models" icon="server">
    Execução do OpenClaw com servidores de modelos locais.
  </Card>
  <Card title="Serviços de modelos locais" href="/pt-BR/gateway/local-model-services" icon="play">
    Inicialização sob demanda de servidores de modelos locais para provedores configurados.
  </Card>
  <Card title="Solução de problemas do Gateway" href="/pt-BR/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail" icon="wrench">
    Depuração de backends locais compatíveis com a OpenAI que passam nas verificações, mas falham nas execuções de agentes.
  </Card>
  <Card title="Seleção de modelos" href="/pt-BR/concepts/model-providers" icon="layers">
    Visão geral de todos os provedores, referências de modelos e comportamento de failover.
  </Card>
</CardGroup>
