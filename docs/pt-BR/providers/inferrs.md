---
read_when:
    - Você quer executar o OpenClaw contra um servidor local inferrs
    - Você está servindo Gemma ou outro modelo por meio do inferrs
    - Você precisa das flags exatas de compatibilidade do OpenClaw para inferrs
summary: Execute o OpenClaw por meio do inferrs (servidor local compatível com OpenAI)
title: inferrs
x-i18n:
    generated_at: "2026-04-08T02:17:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: d84f660d49a682d0c0878707eebe1bc1e83dd115850687076ea3938b9f9c86c6
    source_path: providers/inferrs.md
    workflow: 15
---

# inferrs

[inferrs](https://github.com/ericcurtin/inferrs) pode servir modelos locais por trás de uma
API `/v1` compatível com OpenAI. O OpenClaw funciona com `inferrs` por meio do caminho genérico
`openai-completions`.

Atualmente, o `inferrs` é melhor tratado como um backend personalizado self-hosted compatível com OpenAI,
não como um plugin de provider dedicado do OpenClaw.

## Início rápido

1. Inicie o `inferrs` com um modelo.

Exemplo:

```bash
inferrs serve gg-hf-gg/gemma-4-E2B-it \
  --host 127.0.0.1 \
  --port 8080 \
  --device metal
```

2. Verifique se o servidor está acessível.

```bash
curl http://127.0.0.1:8080/health
curl http://127.0.0.1:8080/v1/models
```

3. Adicione uma entrada explícita de provider no OpenClaw e aponte seu modelo padrão para ela.

## Exemplo completo de configuração

Este exemplo usa Gemma 4 em um servidor local `inferrs`.

```json5
{
  agents: {
    defaults: {
      model: { primary: "inferrs/gg-hf-gg/gemma-4-E2B-it" },
      models: {
        "inferrs/gg-hf-gg/gemma-4-E2B-it": {
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
            id: "gg-hf-gg/gemma-4-E2B-it",
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

## Por que `requiresStringContent` importa

Algumas rotas Chat Completions do `inferrs` aceitam apenas
`messages[].content` em string, não arrays estruturados de partes de conteúdo.

Se as execuções do OpenClaw falharem com um erro como:

```text
messages[1].content: invalid type: sequence, expected a string
```

defina:

```json5
compat: {
  requiresStringContent: true
}
```

O OpenClaw vai achatar partes de conteúdo puramente em texto em strings simples antes de enviar
a solicitação.

## Observação sobre Gemma e schema de ferramentas

Algumas combinações atuais de `inferrs` + Gemma aceitam pequenas solicitações diretas para
`/v1/chat/completions`, mas ainda falham em turnos completos do runtime de agente do OpenClaw.

Se isso acontecer, tente primeiro isto:

```json5
compat: {
  requiresStringContent: true,
  supportsTools: false
}
```

Isso desativa a superfície de schema de ferramentas do OpenClaw para o modelo e pode reduzir a
pressão do prompt em backends locais mais rigorosos.

Se solicitações diretas pequenas ainda funcionarem, mas turnos normais de agente do OpenClaw continuarem
falhando dentro do `inferrs`, o problema restante normalmente é comportamento upstream do modelo/servidor,
e não da camada de transporte do OpenClaw.

## Smoke test manual

Depois de configurar, teste ambas as camadas:

```bash
curl http://127.0.0.1:8080/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"gg-hf-gg/gemma-4-E2B-it","messages":[{"role":"user","content":"What is 2 + 2?"}],"stream":false}'

openclaw infer model run \
  --model inferrs/gg-hf-gg/gemma-4-E2B-it \
  --prompt "What is 2 + 2? Reply with one short sentence." \
  --json
```

Se o primeiro comando funcionar, mas o segundo falhar, use as observações de solução de problemas
abaixo.

## Solução de problemas

- `curl /v1/models` falha: o `inferrs` não está em execução, não está acessível ou não
  está vinculado ao host/porta esperados.
- `messages[].content ... expected a string`: defina
  `compat.requiresStringContent: true`.
- Chamadas diretas pequenas para `/v1/chat/completions` passam, mas `openclaw infer model run`
  falha: tente `compat.supportsTools: false`.
- O OpenClaw não recebe mais erros de schema, mas o `inferrs` ainda falha em turnos maiores
  de agente: trate isso como uma limitação upstream do `inferrs` ou do modelo e reduza a
  pressão do prompt ou troque de backend/modelo local.

## Comportamento no estilo proxy

O `inferrs` é tratado como um backend `/v1` compatível com OpenAI no estilo proxy, não como um
endpoint OpenAI nativo.

- a modelagem de solicitações exclusiva do OpenAI nativo não se aplica aqui
- sem `service_tier`, sem `store` de Responses, sem dicas de prompt-cache e sem
  modelagem de payload de compatibilidade de reasoning do OpenAI
- cabeçalhos ocultos de atribuição do OpenClaw (`originator`, `version`, `User-Agent`)
  não são injetados em base URLs personalizadas do `inferrs`

## Veja também

- [Modelos locais](/pt-BR/gateway/local-models)
- [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail)
- [Providers de modelo](/pt-BR/concepts/model-providers)
