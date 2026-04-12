---
read_when:
    - Você quer executar o OpenClaw em um servidor local inferrs
    - Você está servindo Gemma ou outro modelo por meio do inferrs
    - Você precisa dos flags exatos de compatibilidade do OpenClaw para o inferrs
summary: Execute o OpenClaw por meio do inferrs (servidor local compatível com OpenAI)
title: inferrs
x-i18n:
    generated_at: "2026-04-12T23:31:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 847dcc131fe51dfe163dcd60075dbfaa664662ea2a5c3986ccb08ddd37e8c31f
    source_path: providers/inferrs.md
    workflow: 15
---

# inferrs

[inferrs](https://github.com/ericcurtin/inferrs) pode servir modelos locais por trás de uma
API `/v1` compatível com OpenAI. O OpenClaw funciona com `inferrs` por meio do caminho genérico
`openai-completions`.

Atualmente, `inferrs` é melhor tratado como um backend OpenAI-compatible
personalizado e self-hosted, não como um Plugin de provedor dedicado do OpenClaw.

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
  <Step title="Adicione uma entrada de provedor no OpenClaw">
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

## Avançado

<AccordionGroup>
  <Accordion title="Por que requiresStringContent é importante">
    Algumas rotas de Chat Completions do `inferrs` aceitam apenas
    `messages[].content` em formato de string, e não arrays estruturados de partes de conteúdo.

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

    O OpenClaw vai achatar partes de conteúdo puramente textuais em strings simples antes de enviar
    a solicitação.

  </Accordion>

  <Accordion title="Ressalva sobre Gemma e schema de ferramenta">
    Algumas combinações atuais de `inferrs` + Gemma aceitam pequenas
    solicitações diretas para `/v1/chat/completions`, mas ainda falham em turnos completos
    do runtime de agente do OpenClaw.

    Se isso acontecer, tente primeiro isto:

    ```json5
    compat: {
      requiresStringContent: true,
      supportsTools: false
    }
    ```

    Isso desabilita a superfície de schema de ferramentas do OpenClaw para o modelo e pode reduzir a pressão do prompt
    em backends locais mais rígidos.

    Se pequenas solicitações diretas ainda funcionarem, mas turnos normais do agente do OpenClaw continuarem
    falhando dentro do `inferrs`, o problema restante geralmente é um comportamento
    upstream do modelo/servidor, e não da camada de transporte do OpenClaw.

  </Accordion>

  <Accordion title="Teste manual de smoke">
    Depois de configurar, teste ambas as camadas:

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

  <Accordion title="Comportamento no estilo proxy">
    `inferrs` é tratado como um backend `/v1` OpenAI-compatible no estilo proxy, não como um
    endpoint nativo da OpenAI.

    - A formatação de solicitação exclusiva da OpenAI nativa não se aplica aqui
    - Sem `service_tier`, sem `store` de Responses, sem dicas de cache de prompt e sem
      formatação de payload de compatibilidade de reasoning da OpenAI
    - Headers ocultos de atribuição do OpenClaw (`originator`, `version`, `User-Agent`)
      não são injetados em URLs base personalizadas do `inferrs`

  </Accordion>
</AccordionGroup>

## Solução de problemas

<AccordionGroup>
  <Accordion title="curl /v1/models falha">
    O `inferrs` não está em execução, não está acessível ou não está vinculado ao
    host/porta esperados. Verifique se o servidor foi iniciado e está escutando no endereço que você
    configurou.
  </Accordion>

  <Accordion title="messages[].content esperava uma string">
    Defina `compat.requiresStringContent: true` na entrada do modelo. Consulte a
    seção `requiresStringContent` acima para mais detalhes.
  </Accordion>

  <Accordion title="Chamadas diretas para /v1/chat/completions passam, mas openclaw infer model run falha">
    Tente definir `compat.supportsTools: false` para desabilitar a superfície de schema de ferramentas.
    Consulte a ressalva acima sobre schema de ferramenta do Gemma.
  </Accordion>

  <Accordion title="O inferrs ainda falha em turnos maiores do agente">
    Se o OpenClaw não receber mais erros de schema, mas o `inferrs` ainda falhar em turnos maiores
    do agente, trate isso como uma limitação upstream do `inferrs` ou do modelo. Reduza
    a pressão do prompt ou mude para outro backend local ou modelo.
  </Accordion>
</AccordionGroup>

<Tip>
Para ajuda geral, consulte [Solução de problemas](/pt-BR/help/troubleshooting) e [FAQ](/pt-BR/help/faq).
</Tip>

## Veja também

<CardGroup cols={2}>
  <Card title="Modelos locais" href="/pt-BR/gateway/local-models" icon="server">
    Executando o OpenClaw com servidores locais de modelo.
  </Card>
  <Card title="Solução de problemas do Gateway" href="/pt-BR/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail" icon="wrench">
    Depuração de backends OpenAI-compatible locais que passam nas sondagens diretas, mas falham em execuções do agente.
  </Card>
  <Card title="Provedores de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Visão geral de todos os provedores, refs de modelo e comportamento de failover.
  </Card>
</CardGroup>
