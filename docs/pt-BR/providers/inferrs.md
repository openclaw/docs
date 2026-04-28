---
read_when:
    - Você quer executar o OpenClaw com um servidor local inferrs
    - Você está servindo Gemma ou outro modelo por meio do inferrs
    - Você precisa das flags exatas de compatibilidade do OpenClaw para o inferrs
summary: Execute o OpenClaw por meio do inferrs (servidor local compatível com OpenAI)
title: Inferrs
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-24T06:07:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 53547c48febe584cf818507b0bf879db0471c575fa8a3ebfec64c658a7090675
    source_path: providers/inferrs.md
    workflow: 15
---

[inferrs](https://github.com/ericcurtin/inferrs) pode servir modelos locais por trás de uma
API `/v1` compatível com OpenAI. O OpenClaw funciona com `inferrs` por meio do caminho genérico
`openai-completions`.

Atualmente, o `inferrs` é melhor tratado como um backend OpenAI-compatible
self-hosted personalizado, não como um plugin de provider dedicado do OpenClaw.

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
  <Step title="Adicione uma entrada de provider no OpenClaw">
    Adicione uma entrada de provider explícita e aponte seu modelo padrão para ela. Veja o exemplo completo de configuração abaixo.
  </Step>
</Steps>

## Exemplo completo de configuração

Este exemplo usa Gemma 4 em um servidor local `inferrs`.

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

## Configuração avançada

<AccordionGroup>
  <Accordion title="Por que requiresStringContent importa">
    Algumas rotas Chat Completions do `inferrs` aceitam apenas
    `messages[].content` como string, e não arrays estruturados de partes de conteúdo.

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

    O OpenClaw achatará partes de conteúdo puramente textual em strings simples antes de enviar
    a requisição.

  </Accordion>

  <Accordion title="Ressalva de Gemma e schema de ferramentas">
    Algumas combinações atuais de `inferrs` + Gemma aceitam pequenas requisições
    diretas de `/v1/chat/completions`, mas ainda falham em turnos completos de runtime
    do agente OpenClaw.

    Se isso acontecer, tente primeiro isto:

    ```json5
    compat: {
      requiresStringContent: true,
      supportsTools: false
    }
    ```

    Isso desativa a superfície de schema de ferramentas do OpenClaw para o modelo e pode reduzir a
    pressão do prompt em backends locais mais restritivos.

    Se pequenas requisições diretas ainda funcionarem, mas turnos normais do agente OpenClaw continuarem
    a falhar dentro do `inferrs`, o problema restante geralmente é comportamento do
    modelo/servidor upstream, e não da camada de transporte do OpenClaw.

  </Accordion>

  <Accordion title="Teste manual rápido">
    Depois de configurar, teste as duas camadas:

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

    Se o primeiro comando funcionar, mas o segundo falhar, verifique a seção de solução de problemas abaixo.

  </Accordion>

  <Accordion title="Comportamento estilo proxy">
    O `inferrs` é tratado como um backend `/v1` compatível com OpenAI em estilo proxy, não como um
    endpoint OpenAI nativo.

    - Modelagem de requisição exclusiva do OpenAI nativo não se aplica aqui
    - Sem `service_tier`, sem `store` de Responses, sem dicas de cache de prompt e sem
      modelagem de payload de compatibilidade de raciocínio do OpenAI
    - Cabeçalhos ocultos de atribuição do OpenClaw (`originator`, `version`, `User-Agent`)
      não são injetados em URLs base personalizadas do `inferrs`

  </Accordion>
</AccordionGroup>

## Solução de problemas

<AccordionGroup>
  <Accordion title="curl /v1/models falha">
    O `inferrs` não está em execução, não está acessível ou não está vinculado ao
    host/porta esperados. Verifique se o servidor foi iniciado e está ouvindo no endereço que
    você configurou.
  </Accordion>

  <Accordion title="messages[].content esperava uma string">
    Defina `compat.requiresStringContent: true` na entrada do modelo. Consulte a
    seção `requiresStringContent` acima para detalhes.
  </Accordion>

  <Accordion title="Chamadas diretas para /v1/chat/completions passam, mas openclaw infer model run falha">
    Tente definir `compat.supportsTools: false` para desativar a superfície de schema de ferramentas.
    Consulte a ressalva acima sobre Gemma e schema de ferramentas.
  </Accordion>

  <Accordion title="inferrs ainda falha em turnos maiores do agente">
    Se o OpenClaw não receber mais erros de schema, mas o `inferrs` ainda falhar em turnos maiores
    do agente, trate isso como uma limitação do `inferrs` ou do modelo upstream. Reduza
    a pressão do prompt ou troque para outro backend local ou modelo.
  </Accordion>
</AccordionGroup>

<Tip>
Para ajuda geral, consulte [Solução de problemas](/pt-BR/help/troubleshooting) e [FAQ](/pt-BR/help/faq).
</Tip>

## Relacionado

<CardGroup cols={2}>
  <Card title="Modelos locais" href="/pt-BR/gateway/local-models" icon="server">
    Executar o OpenClaw com servidores locais de modelo.
  </Card>
  <Card title="Solução de problemas do Gateway" href="/pt-BR/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail" icon="wrench">
    Depurar backends locais compatíveis com OpenAI que passam em probes, mas falham em execuções do agente.
  </Card>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Visão geral de todos os providers, refs de modelo e comportamento de failover.
  </Card>
</CardGroup>
