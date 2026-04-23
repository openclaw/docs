---
read_when:
    - Você quer inspecionar, auditar ou cancelar registros de tarefas em segundo plano
    - Você está documentando comandos do TaskFlow em `openclaw tasks flow`
summary: Referência da CLI para `openclaw tasks` (registro de tarefas em segundo plano e estado do TaskFlow)
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-04-23T14:02:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 549e07c8a576cb4c5bd48874f16b0daa4a34facb53b102e12d358bdad2191628
    source_path: cli/tasks.md
    workflow: 15
---

# `openclaw tasks`

Inspecione tarefas duráveis em segundo plano e o estado do TaskFlow. Sem subcomando,
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

Lista tarefas em segundo plano rastreadas, da mais recente para a mais antiga.

### `show`

```bash
openclaw tasks show <lookup> [--json]
```

Mostra uma tarefa por ID da tarefa, ID da execução ou chave da sessão.

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

Expõe registros de tarefas e de TaskFlow obsoletos, perdidos, com falha de entrega ou de outra forma inconsistentes.

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

Visualiza ou aplica reconciliação, marcação de limpeza e poda de tarefas e do TaskFlow.

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

Inspeciona ou cancela o estado durável do TaskFlow sob o registro de tarefas.
