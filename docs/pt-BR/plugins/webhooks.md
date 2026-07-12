---
read_when:
    - Você quer acionar ou conduzir TaskFlows a partir de um sistema externo
    - Você está configurando o plugin de Webhooks incluído
summary: 'Plugin de Webhooks: entrada autenticada do TaskFlow para automação externa confiável'
title: Plugin de Webhooks
x-i18n:
    generated_at: "2026-07-12T15:31:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 081ccbb4ca60234b20f4db7379395bdc51e7203caad4c0a88f292989ca18b28e
    source_path: plugins/webhooks.md
    workflow: 16
---

O plugin Webhooks adiciona rotas HTTP autenticadas para que um sistema externo
confiável (Zapier, n8n, um trabalho de CI, um serviço interno) possa criar e controlar
TaskFlows gerenciados do OpenClaw via HTTP, sem escrever um plugin personalizado.

O plugin é executado dentro do processo do Gateway. Para um Gateway remoto, instale-o e
configure-o nesse host e, em seguida, reinicie o Gateway. Ele é fornecido sem rotas
configuradas, portanto, não faz nada até que você adicione pelo menos uma rota.

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
              description: "Ponte do TaskFlow para o Zapier",
            },
          },
        },
      },
    },
  },
}
```

Campos da rota:

| Campo          | Obrigatório | Padrão                        | Observações                                            |
| -------------- | ----------- | ----------------------------- | ------------------------------------------------------ |
| `enabled`      | não         | `true`                        |                                                        |
| `path`         | não         | `/plugins/webhooks/<routeId>` | Deve ser exclusivo entre as rotas.                     |
| `sessionKey`   | sim         | -                             | Sessão proprietária dos TaskFlows vinculados.          |
| `secret`       | sim         | -                             | String simples ou uma SecretRef (abaixo).               |
| `controllerId` | não         | `webhooks/<routeId>`          | Usado como controlador padrão de `create_flow`.        |
| `description`  | não         | -                             | Apenas uma observação para o operador.                  |

`secret` aceita uma string simples ou uma SecretRef: `{ source: "env" | "file" | "exec", provider: "default", id: "..." }`.

Cada rota configurada é registrada na inicialização, independentemente de seu segredo
poder ser resolvido no momento. Um segredo que não pode ser resolvido não desabilita nem
ignora a rota — as solicitações feitas a ela falham na autenticação (`401`) até que o segredo
possa ser resolvido. Os valores de SecretRef são resolvidos novamente a cada solicitação,
portanto, a rotação do segredo subjacente (variável de ambiente, arquivo ou saída de
execução) entra em vigor sem reiniciar o Gateway.

## Modelo de segurança

Cada rota atua com a autoridade de TaskFlow da `sessionKey` configurada: ela
pode inspecionar e alterar qualquer TaskFlow pertencente a essa sessão. O acesso ao TaskFlow
sempre passa por `api.runtime.tasks.managedFlows.bindSession(...)`, portanto, uma
rota nunca pode atuar fora de sua sessão vinculada. Para limitar o raio de impacto:

- Use um segredo forte e exclusivo para cada rota.
- Prefira uma SecretRef em vez de um segredo em texto simples embutido.
- Vincule as rotas à sessão mais restrita que atenda ao fluxo de trabalho.
- Exponha somente o caminho de webhook específico de que você precisa.

Ordem de processamento das solicitações para cada caminho: verificações do método HTTP
(somente `POST`) e de `Content-Type: application/json`, seguidas pela limitação de taxa em
janela fixa (120 solicitações por janela de 60 segundos para cada chave de caminho+IP do
cliente, com até 4.096 chaves rastreadas), depois pela limitação de solicitações em andamento
(8 solicitações simultâneas por chave, com até 4.096 chaves rastreadas), seguida pela
autenticação por segredo compartilhado e, por fim, pela leitura do corpo JSON limitada a
256 KB / 15 segundos. As solicitações que falham em uma verificação anterior nunca chegam
às posteriores.

## Formato da solicitação

Envie solicitações `POST` com `Content-Type: application/json` e
`Authorization: Bearer <secret>` ou `x-openclaw-webhook-secret: <secret>`:

```bash
curl -X POST https://gateway.example.com/plugins/webhooks/zapier \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_SHARED_SECRET' \
  -d '{"action":"create_flow","goal":"Revisar a fila de entrada"}'
```

## Ações compatíveis

| Ação               | Finalidade                                                                  |
| ------------------ | --------------------------------------------------------------------------- |
| `create_flow`      | Criar um TaskFlow gerenciado para a sessão da rota.                         |
| `get_flow`         | Obter um TaskFlow pelo ID.                                                   |
| `list_flows`       | Listar os TaskFlows da sessão da rota.                                       |
| `find_latest_flow` | Obter o TaskFlow atualizado mais recentemente.                              |
| `resolve_flow`     | Resolver um TaskFlow por token opaco.                                        |
| `get_task_summary` | Obter o resumo da tarefa de um TaskFlow.                                     |
| `set_waiting`      | Marcar um TaskFlow como aguardando, com dados opcionais de estado/espera.    |
| `resume_flow`      | Retomar um TaskFlow aguardando/bloqueado.                                    |
| `finish_flow`      | Marcar um TaskFlow como concluído.                                           |
| `fail_flow`        | Marcar um TaskFlow como falho.                                               |
| `request_cancel`   | Solicitar o cancelamento cooperativo.                                        |
| `cancel_flow`      | Cancelar um TaskFlow (pode retornar `202` se os filhos ainda estiverem ativos). |
| `run_task`         | Criar uma tarefa filha gerenciada dentro de um TaskFlow existente.          |

As ações de alteração (`set_waiting`, `resume_flow`, `finish_flow`, `fail_flow`,
`request_cancel`) exigem `flowId` e `expectedRevision` para concorrência
otimista; uma revisão desatualizada retorna `409 revision_conflict`.

### `create_flow`

```json
{
  "action": "create_flow",
  "goal": "Revisar a fila de entrada",
  "status": "queued",
  "notifyPolicy": "done_only"
}
```

### `run_task`

Valores permitidos de `runtime`: `subagent`, `acp`. `startedAt`, `lastEventAt` e
`progressSummary` são válidos somente quando `status` é `"running"`; enviá-los
com qualquer outro status retorna `400 invalid_request`.

```json
{
  "action": "run_task",
  "flowId": "flow_123",
  "runtime": "acp",
  "childSessionKey": "agent:main:acp:worker",
  "task": "Inspecionar o próximo lote de mensagens"
}
```

## Formato da resposta

```json
{
  "ok": true,
  "routeId": "zapier",
  "result": {}
}
```

```json
{
  "ok": false,
  "routeId": "zapier",
  "code": "not_found",
  "error": "TaskFlow não encontrado.",
  "result": {}
}
```

As visualizações de fluxos e tarefas nunca incluem metadados do proprietário ou da sessão,
portanto, as respostas não podem vazar a `sessionKey` vinculada à rota. Os valores de `code`
incluem `not_found`, `not_managed`, `revision_conflict`, `persist_failed`,
`cancel_requested`, `cancel_pending`, `terminal`, `invalid_request`,
`request_rejected` e códigos de contingência específicos de cada ação
(`mutation_rejected`, `create_rejected`, `task_not_created`, `cancel_rejected`) quando
uma alteração é rejeitada por um motivo não abrangido pelos códigos nomeados acima.

## Relacionado

- [Hooks](/pt-BR/automation/hooks) — hooks internos orientados a eventos em comparação com esta ponte de TaskFlow baseada em HTTP
- [Webhooks do Gateway (configuração `hooks.*`)](/pt-BR/automation/cron-jobs#webhooks) — recurso separado de endpoint HTTP genérico do Gateway; não é o mesmo que as rotas deste plugin
- [SDK de runtime de plugins](/pt-BR/plugins/sdk-runtime)
- [Webhooks da CLI](/pt-BR/cli/webhooks)
