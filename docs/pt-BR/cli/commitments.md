---
read_when:
    - Você quer inspecionar os compromissos de acompanhamento inferidos
    - Você quer descartar os check-ins pendentes
    - Você está auditando o que o Heartbeat pode entregar
summary: Referência da CLI para `openclaw commitments` (inspecionar e dispensar acompanhamentos inferidos)
title: '`openclaw commitments`'
x-i18n:
    generated_at: "2026-07-16T12:19:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: db8a7d8f5756ccb18ed0990fcedf50d1072bb67e775c29eefdbd1a7dd795b7b0
    source_path: cli/commitments.md
    workflow: 16
---

Liste e gerencie compromissos de acompanhamento inferidos.

Os compromissos são opcionais (`commitments.enabled`), memórias de acompanhamento de curta duração
criadas com base no contexto da conversa e entregues pelo Heartbeat. Consulte
[Compromissos inferidos](/pt-BR/concepts/commitments) para ver o guia conceitual e a configuração.

Sem um subcomando, `openclaw commitments` lista os compromissos pendentes.

## Uso

```bash
openclaw commitments [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments list [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments dismiss <id...> [--json]
```

## Opções

- `--all`: mostra todos os status, em vez de apenas os compromissos pendentes.
- `--agent <id>`: filtra por um ID de agente.
- `--status <status>`: filtra por status. Valores: `pending`, `sent`,
  `dismissed`, `snoozed` ou `expired`. Valores desconhecidos encerram o processo com um erro.
- `--json`: gera uma saída JSON legível por máquina.

`dismiss` marca os IDs de compromisso fornecidos como `dismissed` para que o Heartbeat não
os entregue.

## Exemplos

Liste os compromissos pendentes:

```bash
openclaw commitments
```

Liste todos os compromissos armazenados:

```bash
openclaw commitments --all
```

Filtre por um agente:

```bash
openclaw commitments --agent main
```

Encontre compromissos adiados:

```bash
openclaw commitments --status snoozed
```

Dispense um ou mais compromissos:

```bash
openclaw commitments dismiss cm_abc123 cm_def456
```

Exporte como JSON:

```bash
openclaw commitments --all --json
```

## Saída

A saída de texto exibe a quantidade de compromissos, o caminho do banco de dados SQLite compartilhado, todos os filtros ativos
e uma linha para cada compromisso:

- ID do compromisso
- status
- tipo (`event_check_in`, `deadline_check`, `care_check_in` ou `open_loop`)
- primeiro prazo possível
- escopo (agente/canal/destino)
- texto sugerido para acompanhamento

A saída JSON inclui a quantidade, os filtros ativos de status e agente, o
caminho do banco de dados SQLite compartilhado e os registros completos armazenados.

## Relacionados

- [Compromissos inferidos](/pt-BR/concepts/commitments)
- [Visão geral da memória](/pt-BR/concepts/memory)
- [Heartbeat](/pt-BR/gateway/heartbeat)
- [Tarefas agendadas](/pt-BR/automation/cron-jobs)
