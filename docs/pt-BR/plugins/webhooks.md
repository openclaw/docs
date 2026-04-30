---
read_when:
    - Você quer acionar ou conduzir TaskFlows a partir de um sistema externo
    - Você está configurando o Plugin de Webhooks incluído
summary: 'Plugin Webhooks: ingresso autenticado do TaskFlow para automação externa confiável'
title: Plugin de Webhooks
x-i18n:
    generated_at: "2026-04-30T10:03:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 70b195e330264af48a9e9c619bb5a0937bb15b2640edd3dd2b5517a13424e9fe
    source_path: plugins/webhooks.md
    workflow: 16
---

# Webhooks (Plugin)

O Plugin Webhooks adiciona rotas HTTP autenticadas que vinculam automações
externas aos TaskFlows do OpenClaw.

Use-o quando quiser que um sistema confiável, como Zapier, n8n, um job de CI ou um
serviço interno, crie e conduza TaskFlows gerenciados sem precisar escrever primeiro
um Plugin personalizado.

## Onde ele é executado

O Plugin Webhooks é executado dentro do processo do Gateway.

Se o seu Gateway for executado em outra máquina, instale e configure o Plugin nesse
host do Gateway e reinicie o Gateway.

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
              description: "Zapier TaskFlow bridge",
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
- `secret`: segredo compartilhado ou SecretRef obrigatório
- `controllerId`: id opcional do controlador para fluxos gerenciados criados
- `description`: nota opcional para o operador

Entradas de `secret` compatíveis:

- String simples
- SecretRef com `source: "env" | "file" | "exec"`

Se uma rota baseada em segredo não conseguir resolver seu segredo na inicialização,
o Plugin ignora essa rota e registra um aviso em vez de expor um endpoint quebrado.

## Modelo de segurança

Cada rota é confiável para agir com a autoridade de TaskFlow de sua `sessionKey`
configurada.

Isso significa que a rota pode inspecionar e modificar TaskFlows pertencentes a essa
sessão, portanto você deve:

- Usar um segredo forte e exclusivo por rota
- Preferir referências de segredo em vez de segredos em texto simples embutidos
- Vincular rotas à sessão mais restrita que atenda ao fluxo de trabalho
- Expor apenas o caminho de Webhook específico de que você precisa

O Plugin aplica:

- Autenticação por segredo compartilhado
- Proteções de tamanho e tempo limite do corpo da requisição
- Limitação de taxa em janela fixa
- Limitação de requisições em andamento
- Acesso a TaskFlows vinculado ao proprietário por meio de `api.runtime.tasks.managedFlows.bindSession(...)`

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

No momento, o Plugin aceita estes valores JSON de `action`:

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

Cria um TaskFlow gerenciado para a sessão vinculada à rota.

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

O Plugin remove intencionalmente metadados de proprietário/sessão das respostas de Webhook.

## Documentação relacionada

- [SDK de runtime do Plugin](/pt-BR/plugins/sdk-runtime)
- [Visão geral de hooks e webhooks](/pt-BR/automation/hooks)
- [Webhooks da CLI](/pt-BR/cli/webhooks)
