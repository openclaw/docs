---
read_when:
    - Você quer inspecionar compromissos de acompanhamento inferidos
    - Você quer dispensar verificações pendentes
    - Você está auditando o que o Heartbeat pode entregar
summary: Referência da CLI para `openclaw commitments` (inspecionar e descartar ações de acompanhamento inferidas)
title: '`openclaw commitments`'
x-i18n:
    generated_at: "2026-04-30T09:40:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 37d5e5dca25cf649a5069360aa4e41fcc33d042dea99f643b98c07189c58f21c
    source_path: cli/commitments.md
    workflow: 16
---

Liste e gerencie compromissos de acompanhamento inferidos.

Compromissos são memórias de acompanhamento opcionais e de curta duração criadas a partir do
contexto da conversa. Consulte [Compromissos inferidos](/pt-BR/concepts/commitments) para o
guia conceitual.

Sem subcomando, `openclaw commitments` lista os compromissos pendentes.

## Uso

```bash
openclaw commitments [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments list [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments dismiss <id...> [--json]
```

## Opções

- `--all`: mostra todos os status em vez de apenas os compromissos pendentes.
- `--agent <id>`: filtra para um id de agente.
- `--status <status>`: filtra por status. Valores: `pending`, `sent`,
  `dismissed`, `snoozed` ou `expired`.
- `--json`: gera JSON legível por máquina.

## Exemplos

Listar compromissos pendentes:

```bash
openclaw commitments
```

Listar todos os compromissos armazenados:

```bash
openclaw commitments --all
```

Filtrar para um agente:

```bash
openclaw commitments --agent main
```

Encontrar compromissos adiados:

```bash
openclaw commitments --status snoozed
```

Dispensar um ou mais compromissos:

```bash
openclaw commitments dismiss cm_abc123 cm_def456
```

Exportar como JSON:

```bash
openclaw commitments --all --json
```

## Saída

A saída em texto inclui:

- id do compromisso
- status
- tipo
- horário de vencimento mais cedo
- escopo
- texto de check-in sugerido

A saída JSON também inclui o caminho do armazenamento de compromissos e os registros armazenados completos.

## Relacionado

- [Compromissos inferidos](/pt-BR/concepts/commitments)
- [Visão geral da memória](/pt-BR/concepts/memory)
- [Heartbeat](/pt-BR/gateway/heartbeat)
- [Tarefas agendadas](/pt-BR/automation/cron-jobs)
