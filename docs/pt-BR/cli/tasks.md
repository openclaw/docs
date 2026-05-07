---
read_when:
    - Você quer inspecionar, auditar ou cancelar registros de tarefas em segundo plano
    - Você está documentando comandos do Task Flow em `openclaw tasks flow`
summary: Referência da CLI para `openclaw tasks` (registro de tarefas em segundo plano e estado do Task Flow)
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-05-07T13:15:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: ca3f05d7c2a3fa7790ad6059ce15721ebffb548ac4a2c627188ac17986442dc6
    source_path: cli/tasks.md
    workflow: 16
---

Inspeciona tarefas em segundo plano persistentes e o estado do Task Flow. Sem subcomando,
`openclaw tasks` é equivalente a `openclaw tasks list`.

Consulte [Tarefas em segundo plano](/pt-BR/automation/tasks) para o ciclo de vida e o modelo de entrega.

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

- `--json`: gera JSON.
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

Mostra uma tarefa por ID da tarefa, ID da execução ou chave da sessão.

### `notify`

```bash
openclaw tasks notify <lookup> <done_only|state_changes|silent>
```

Altera a política de notificação para uma tarefa em execução.

### `cancel`

```bash
openclaw tasks cancel <lookup>
```

Cancela uma tarefa em segundo plano em execução.

### `audit`

```bash
openclaw tasks audit [--severity <warn|error>] [--code <name>] [--limit <n>] [--json]
```

Exibe registros de tarefas e do Task Flow obsoletos, perdidos, com falha de entrega ou inconsistentes de outra forma. Tarefas perdidas retidas até `cleanupAfter` são avisos; tarefas perdidas expiradas ou sem carimbo são erros.

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

Visualiza ou aplica a reconciliação de tarefas e do Task Flow, o carimbo de limpeza e a remoção.
Para tarefas cron, a reconciliação usa logs de execução/estado do job persistidos antes de marcar uma
tarefa ativa antiga como `lost`, para que execuções cron concluídas não se tornem erros falsos de auditoria
só porque o estado em memória do runtime do Gateway desapareceu. A auditoria offline da CLI
não é autoritativa para o conjunto de jobs cron ativos locais ao processo do Gateway. Tarefas da CLI
com um ID de execução/ID de origem são marcadas como `lost` quando seu contexto de execução ativo do Gateway
desaparece, mesmo que uma linha antiga de sessão filha permaneça.

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

Inspeciona ou cancela o estado persistente do Task Flow no registro de tarefas.

## Relacionados

- [Referência da CLI](/pt-BR/cli)
- [Tarefas em segundo plano](/pt-BR/automation/tasks)
