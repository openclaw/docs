---
read_when:
    - Você quer inspecionar, auditar ou cancelar registros de tarefas em segundo plano
    - Você está documentando comandos do TaskFlow em `openclaw tasks flow`
summary: Referência de CLI para `openclaw tasks` (registro de tarefas em segundo plano e estado do TaskFlow)
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-04-24T05:46:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55aab29821578bf8c09e1b6cd5bbeb5e3dae4438e453b418fa7e8420412c8152
    source_path: cli/tasks.md
    workflow: 15
---

Inspecione tarefas em segundo plano duráveis e o estado do TaskFlow. Sem subcomando,
`openclaw tasks` é equivalente a `openclaw tasks list`.

Consulte [Background Tasks](/pt-BR/automation/tasks) para ver o ciclo de vida e o modelo de entrega.

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

Lista as tarefas em segundo plano rastreadas, da mais recente para a mais antiga.

### `show`

```bash
openclaw tasks show <lookup> [--json]
```

Mostra uma tarefa por ID da tarefa, ID de execução ou chave de sessão.

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

Expõe registros de tarefas e de TaskFlow desatualizados, perdidos, com falha de entrega ou inconsistentes de outra forma.

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

Visualiza ou aplica reconciliação de tarefas e TaskFlow, marcação de limpeza e remoção.

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

Inspeciona ou cancela o estado durável do TaskFlow no registro de tarefas.

## Relacionado

- [Referência de CLI](/pt-BR/cli)
- [Tarefas em segundo plano](/pt-BR/automation/tasks)
