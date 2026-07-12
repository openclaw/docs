---
read_when:
    - Você quer inspecionar, auditar ou cancelar registros de tarefas em segundo plano
    - Você está documentando os comandos do TaskFlow em `openclaw tasks flow`
summary: Referência da CLI para `openclaw tasks` (registro de tarefas em segundo plano e estado do TaskFlow)
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-07-11T23:52:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b03a4aa9fab12b6e5773259a76a1e89fd6e6398c73e5b0533a31e5e3a3894f9c
    source_path: cli/tasks.md
    workflow: 16
---

Inspecione tarefas duráveis em segundo plano e o estado do TaskFlow. Sem um subcomando,
`openclaw tasks` equivale a `openclaw tasks list`.

Consulte [Tarefas em segundo plano](/pt-BR/automation/tasks) para conhecer o ciclo de vida e o modelo
de entrega, e a seção `tasks audit` para obter descrições completas das constatações.

## Uso

```bash
openclaw tasks
openclaw tasks list
openclaw tasks list --runtime acp
openclaw tasks list --status running
openclaw tasks show <lookup>
openclaw tasks notify <lookup> state_changes
openclaw tasks cancel <lookup>
openclaw tasks audit
openclaw tasks maintenance
openclaw tasks maintenance --apply
openclaw tasks flow list
openclaw tasks flow show <lookup>
openclaw tasks flow cancel <lookup>
```

## Opções raiz

| Sinalizador        | Descrição                                                                                          |
| ------------------ | -------------------------------------------------------------------------------------------------- |
| `--json`           | Gera a saída em JSON.                                                                              |
| `--runtime <name>` | Filtra por tipo: `subagent`, `acp`, `cron` ou `cli`.                                               |
| `--status <name>`  | Filtra por status: `queued`, `running`, `succeeded`, `failed`, `timed_out`, `cancelled` ou `lost`. |

## Subcomandos

### `list`

```bash
openclaw tasks list [--runtime <name>] [--status <name>] [--json]
```

Lista as tarefas em segundo plano rastreadas, começando pelas mais recentes.

### `show`

```bash
openclaw tasks show <lookup> [--json]
```

Exibe uma tarefa pelo ID da tarefa, ID da execução ou chave da sessão.

### `notify`

```bash
openclaw tasks notify <lookup> <done_only|state_changes|silent>
```

Altera a política de notificações de uma tarefa em execução.

### `cancel`

```bash
openclaw tasks cancel <lookup>
```

Cancela uma tarefa em segundo plano em execução.

### `audit`

```bash
openclaw tasks audit [--severity <warn|error>] [--code <name>] [--limit <n>] [--json]
```

Apresenta registros de tarefas e do TaskFlow obsoletos, perdidos, com falha de entrega
ou inconsistentes de alguma outra forma. Tarefas perdidas mantidas até `cleanupAfter`
são avisos; tarefas perdidas expiradas ou sem marcação são erros.

`--code` aceita códigos de tarefa (`stale_queued`, `stale_running`, `lost`,
`delivery_failed`, `missing_cleanup`, `inconsistent_timestamps`) e códigos do TaskFlow
(`restore_failed`, `stale_waiting`, `stale_blocked`, `cancel_stuck`,
`missing_linked_tasks`, `blocked_task_missing`). Consulte
[Tarefas em segundo plano](/pt-BR/automation/tasks) para obter detalhes sobre a gravidade e o acionador
de cada código.

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

Visualiza ou aplica a reconciliação de tarefas e do TaskFlow, a marcação para limpeza,
a remoção e a limpeza do registro de sessões de execuções Cron obsoletas.

Para tarefas Cron, a reconciliação usa os logs de execução e o estado dos trabalhos persistidos antes
de marcar uma tarefa ativa antiga como `lost`, para que execuções Cron concluídas não se tornem
falsos erros de auditoria apenas porque o estado de execução do Gateway em memória não está mais disponível.
A auditoria offline da CLI não é definitiva para o conjunto de trabalhos Cron ativos locais ao processo
do Gateway. Tarefas da CLI com um ID de execução/ID de origem são marcadas como `lost` quando
o contexto de execução ativo no Gateway não está mais disponível, mesmo que uma linha antiga de sessão filha
permaneça.

Quando aplicada, a manutenção também remove linhas do registro de sessões
`cron:<jobId>:run:<uuid>` com mais de 7 dias, preservando os trabalhos Cron atualmente em execução
e mantendo inalteradas as linhas de sessões que não sejam Cron.

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

Inspeciona ou cancela o estado durável do TaskFlow no registro de tarefas.
`flow list --status` aceita `queued`, `running`, `waiting`, `blocked`,
`succeeded`, `failed`, `cancelled` ou `lost`.

## Relacionados

- [Referência da CLI](/pt-BR/cli)
- [Tarefas em segundo plano](/pt-BR/automation/tasks)
