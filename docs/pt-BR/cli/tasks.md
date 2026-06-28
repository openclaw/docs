---
read_when:
    - Você quer inspecionar, auditar ou cancelar registros de tarefas em segundo plano
    - Você está documentando os comandos do TaskFlow em `openclaw tasks flow`
summary: Referência da CLI para `openclaw tasks` (registro de tarefas em segundo plano e estado do Task Flow)
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-05-10T19:29:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7bbb97690124a8e59ec5e6a517f33166ad449ee6268894ab132ad9cb69dcaa81
    source_path: cli/tasks.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Inspecione tarefas duráveis em segundo plano e o estado do Task Flow. Sem subcomando,
`openclaw tasks` é equivalente a `openclaw tasks list`.

Consulte [Tarefas em segundo plano](/pt-BR/automation/tasks) para ver o ciclo de vida e o modelo de entrega.

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

Expõe registros de tarefas e de Task Flow obsoletos, perdidos, com falha de entrega ou inconsistentes de outra forma. Tarefas perdidas retidas até `cleanupAfter` são avisos; tarefas perdidas expiradas ou sem carimbo são erros.

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

Pré-visualiza ou aplica reconciliação de tarefas e de Task Flow, carimbo de limpeza, remoção,
e limpeza de registro de sessões obsoletas de execuções Cron.
Para tarefas Cron, a reconciliação usa logs de execução/estado de jobs persistidos antes de marcar uma
tarefa ativa antiga como `lost`, para que execuções Cron concluídas não se tornem falsos erros de auditoria
apenas porque o estado de runtime em memória do Gateway desapareceu. A auditoria offline da CLI
não é autoritativa para o conjunto de jobs ativos de Cron local ao processo do Gateway. Tarefas da CLI
com um ID de execução/ID de origem são marcadas como `lost` quando seu contexto de execução ativo do Gateway
desaparece, mesmo que uma linha antiga de sessão filha permaneça.
Quando aplicada, a manutenção também remove linhas do registro de sessões `cron:<jobId>:run:<uuid>`
com mais de 7 dias, preservando jobs Cron em execução no momento e deixando
linhas de sessão não Cron intocadas.

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

Inspeciona ou cancela o estado durável de Task Flow sob o ledger de tarefas.

## Relacionados

- [Referência da CLI](/pt-BR/cli)
- [Tarefas em segundo plano](/pt-BR/automation/tasks)
