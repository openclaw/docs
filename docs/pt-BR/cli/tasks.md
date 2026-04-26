---
read_when:
    - Você quer inspecionar, auditar ou cancelar registros de tarefas em segundo plano
    - Você está documentando comandos do Task Flow em `openclaw tasks flow`
summary: Referência da CLI para `openclaw tasks` (registro de tarefas em segundo plano e estado do Task Flow)
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-04-26T11:26:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6e61fb0b67a2bdd932b29543199fb219890f256260a66881c8e7ffeb9fadee33
    source_path: cli/tasks.md
    workflow: 15
---

Inspecione tarefas em segundo plano duráveis e o estado do Task Flow. Sem subcomando,
`openclaw tasks` é equivalente a `openclaw tasks list`.

Veja [Tarefas em segundo plano](/pt-BR/automation/tasks) para o ciclo de vida e o modelo de entrega.

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

- `--json`: gera saída em JSON.
- `--runtime <name>`: filtra por tipo: `subagent`, `acp`, `cron` ou `cli`.
- `--status <name>`: filtra por status: `queued`, `running`, `succeeded`, `failed`, `timed_out`, `cancelled` ou `lost`.

## Subcomandos

### `list`

```bash
openclaw tasks list [--runtime <name>] [--status <name>] [--json]
```

Lista as tarefas em segundo plano rastreadas, das mais novas para as mais antigas.

### `show`

```bash
openclaw tasks show <lookup> [--json]
```

Mostra uma tarefa por ID da tarefa, ID da execução ou chave de sessão.

### `notify`

```bash
openclaw tasks notify <lookup> <done_only|state_changes|silent>
```

Altera a política de notificação de uma tarefa em execução.

### `cancel`

```bash
openclaw tasks cancel <lookup>
```

Cancela uma tarefa em segundo plano em execução.

### `audit`

```bash
openclaw tasks audit [--severity <warn|error>] [--code <name>] [--limit <n>] [--json]
```

Mostra registros de tarefa e de estado do Task Flow obsoletos, perdidos, com falha de entrega ou de outra forma inconsistentes. Tarefas perdidas mantidas até `cleanupAfter` são avisos; tarefas perdidas expiradas ou sem marcação são erros.

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

Visualiza ou aplica reconciliação, marcação de limpeza e remoção de tarefas e do Task Flow.
Para tarefas cron, a reconciliação usa logs persistidos de execução/estado do job antes de marcar uma
tarefa ativa antiga como `lost`, para que execuções cron concluídas não virem falsos erros de auditoria
apenas porque o estado de runtime em memória do Gateway não existe mais. A auditoria offline da CLI
não é autoritativa para o conjunto de jobs cron ativos local ao processo do Gateway.

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

Inspeciona ou cancela o estado durável do Task Flow no registro de tarefas.

## Relacionados

- [Referência da CLI](/pt-BR/cli)
- [Tarefas em segundo plano](/pt-BR/automation/tasks)
