---
read_when:
    - Você quer disparar ou conduzir TaskFlows a partir de um sistema externo
    - Você está configurando o plugin empacotado de Webhooks
summary: 'Plugin de Webhooks: entrada autenticada do TaskFlow para automação externa confiável'
title: Plugin de Webhooks
x-i18n:
    generated_at: "2026-04-24T06:05:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: a35074f256e0664ee73111bcb93ce1a2311dbd4db2231200a1a385e15ed5e6c4
    source_path: plugins/webhooks.md
    workflow: 15
---

# Webhooks (Plugin)

O Plugin de Webhooks adiciona rotas HTTP autenticadas que vinculam automação
externa ao TaskFlow do OpenClaw.

Use-o quando quiser que um sistema confiável, como Zapier, n8n, um job de CI ou um
serviço interno, crie e conduza TaskFlows gerenciados sem precisar escrever primeiro um plugin
personalizado.

## Onde ele é executado

O Plugin de Webhooks é executado dentro do processo do Gateway.

Se o seu Gateway estiver em outra máquina, instale e configure o plugin nesse
host do Gateway e depois reinicie o Gateway.

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
              description: "Bridge TaskFlow do Zapier",
            },
          },
        },
      },
    },
  },
}
```

Campos de rota:

- `enabled`: opcional, padrão `true`
- `path`: opcional, padrão `/plugins/webhooks/<routeId>`
- `sessionKey`: sessão obrigatória que controla os TaskFlows vinculados
- `secret`: segredo compartilhado ou SecretRef obrigatório
- `controllerId`: id opcional do controlador para fluxos gerenciados criados
- `description`: observação opcional para o operador

Entradas `secret` compatíveis:

- String simples
- SecretRef com `source: "env" | "file" | "exec"`

Se uma rota com segredo não conseguir resolver seu segredo na inicialização, o plugin ignora
essa rota e registra um aviso em vez de expor um endpoint quebrado.

## Modelo de segurança

Cada rota é confiável para agir com a autoridade de TaskFlow da sua
`sessionKey` configurada.

Isso significa que a rota pode inspecionar e modificar TaskFlows controlados por essa sessão, então
você deve:

- Usar um segredo forte e exclusivo por rota
- Preferir referências de segredo em vez de segredos inline em texto simples
- Vincular rotas à sessão mais restrita que ainda atenda ao fluxo
- Expor apenas o caminho de Webhook específico de que você precisa

O plugin aplica:

- Autenticação por segredo compartilhado
- Limites de tamanho do corpo da requisição e de timeout
- Rate limiting em janela fixa
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

Atualmente, o plugin aceita estes valores JSON em `action`:

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

Runtimes permitidos:

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

O plugin remove intencionalmente metadados de proprietário/sessão das respostas de Webhook.

## Documentação relacionada

- [SDK de runtime de Plugin](/pt-BR/plugins/sdk-runtime)
- [Visão geral de hooks e Webhooks](/pt-BR/automation/hooks)
- [CLI de Webhooks](/pt-BR/cli/webhooks)
