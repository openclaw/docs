---
read_when:
    - Você quer acionar ou conduzir TaskFlows a partir de um sistema externo
    - Você está configurando o plugin Webhooks empacotado
summary: 'Plugin Webhooks: entrada TaskFlow autenticada para automação externa confiável'
title: Plugin Webhooks
x-i18n:
    generated_at: "2026-04-07T05:30:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: a5da12a887752ec6ee853cfdb912db0ae28512a0ffed06fe3828ef2eee15bc9d
    source_path: plugins/webhooks.md
    workflow: 15
---

# Webhooks (plugin)

O plugin Webhooks adiciona rotas HTTP autenticadas que vinculam automação
externa a TaskFlows do OpenClaw.

Use-o quando quiser que um sistema confiável como Zapier, n8n, um job de CI ou um
serviço interno crie e conduza TaskFlows gerenciados sem precisar escrever primeiro um plugin
personalizado.

## Onde ele é executado

O plugin Webhooks é executado dentro do processo Gateway.

Se o seu Gateway estiver sendo executado em outra máquina, instale e configure o plugin nesse
host do Gateway e então reinicie o Gateway.

## Configurar rotas

Defina a configuração em `plugins.entries.webhooks.config`:

```json5
{
  plugins: {
    entries: {
      webhooks: {
        enabled: true,
        config: {
          routes: {
            zapier: {
              path: "/plugins/webhooks/zapier",
              sessionKey: "agent:main:main",
              secret: {
                source: "env",
                provider: "default",
                id: "OPENCLAW_WEBHOOK_SECRET",
              },
              controllerId: "webhooks/zapier",
              description: "Ponte de TaskFlow do Zapier",
            },
          },
        },
      },
    },
  },
}
```

Campos da rota:

- `enabled`: opcional, o padrão é `true`
- `path`: opcional, o padrão é `/plugins/webhooks/<routeId>`
- `sessionKey`: sessão obrigatória que possui os TaskFlows vinculados
- `secret`: segredo compartilhado obrigatório ou SecretRef
- `controllerId`: ID opcional do controlador para os fluxos gerenciados criados
- `description`: observação opcional para o operador

Entradas `secret` compatíveis:

- String simples
- SecretRef com `source: "env" | "file" | "exec"`

Se uma rota com segredo não conseguir resolver seu segredo na inicialização, o plugin ignora
essa rota e registra um aviso em vez de expor um endpoint quebrado.

## Modelo de segurança

Cada rota é confiável para agir com a autoridade de TaskFlow do seu `sessionKey`
configurado.

Isso significa que a rota pode inspecionar e modificar TaskFlows pertencentes a essa sessão, então
você deve:

- Usar um segredo forte e exclusivo por rota
- Preferir referências de segredo em vez de segredos em texto simples inline
- Vincular rotas à sessão mais restrita que atenda ao fluxo de trabalho
- Expor apenas o caminho de webhook específico de que você precisa

O plugin aplica:

- Autenticação por segredo compartilhado
- Proteções de tamanho do corpo da requisição e timeout
- Limitação de taxa por janela fixa
- Limitação de requisições em andamento
- Acesso a TaskFlow vinculado ao proprietário por meio de `api.runtime.taskFlow.bindSession(...)`

## Formato da requisição

Envie requisições `POST` com:

- `Content-Type: application/json`
- `Authorization: Bearer <secret>` ou `x-openclaw-webhook-secret: <secret>`

Exemplo:

```bash
curl -X POST https://gateway.example.com/plugins/webhooks/zapier \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_SHARED_SECRET' \
  -d '{"action":"create_flow","goal":"Review inbound queue"}'
```

## Ações compatíveis

Atualmente, o plugin aceita estes valores JSON de `action`:

- `create_flow`
- `get_flow`
- `list_flows`
- `find_latest_flow`
- `resolve_flow`
- `get_task_summary`
- `set_waiting`
- `resume_flow`
- `finish_flow`
- `fail_flow`
- `request_cancel`
- `cancel_flow`
- `run_task`

### `create_flow`

Cria um TaskFlow gerenciado para a sessão vinculada da rota.

Exemplo:

```json
{
  "action": "create_flow",
  "goal": "Review inbound queue",
  "status": "queued",
  "notifyPolicy": "done_only"
}
```

### `run_task`

Cria uma tarefa filha gerenciada dentro de um TaskFlow gerenciado existente.

Os runtimes permitidos são:

- `subagent`
- `acp`

Exemplo:

```json
{
  "action": "run_task",
  "flowId": "flow_123",
  "runtime": "acp",
  "childSessionKey": "agent:main:acp:worker",
  "task": "Inspect the next message batch"
}
```

## Formato da resposta

Respostas bem-sucedidas retornam:

```json
{
  "ok": true,
  "routeId": "zapier",
  "result": {}
}
```

Requisições rejeitadas retornam:

```json
{
  "ok": false,
  "routeId": "zapier",
  "code": "not_found",
  "error": "TaskFlow not found.",
  "result": {}
}
```

O plugin intencionalmente remove metadados de proprietário/sessão das respostas de webhook.

## Documentação relacionada

- [Plugin runtime SDK](/pt-BR/plugins/sdk-runtime)
- [Hooks and webhooks overview](/pt-BR/automation/hooks)
- [CLI webhooks](/cli/webhooks)
