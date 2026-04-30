---
read_when:
    - Desea inspeccionar los compromisos de seguimiento inferidos
    - Quieres descartar los seguimientos pendientes
    - Estás auditando lo que Heartbeat puede entregar
summary: Referencia de CLI para `openclaw commitments` (inspeccionar y descartar acciones de seguimiento inferidas)
title: '`openclaw commitments`'
x-i18n:
    generated_at: "2026-04-30T05:32:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 37d5e5dca25cf649a5069360aa4e41fcc33d042dea99f643b98c07189c58f21c
    source_path: cli/commitments.md
    workflow: 16
---

Enumera y gestiona compromisos de seguimiento inferidos.

Los compromisos son memorias de seguimiento opcionales y de corta duración creadas a partir del
contexto de la conversación. Consulta [Compromisos inferidos](/es/concepts/commitments) para ver la
guía conceptual.

Sin subcomando, `openclaw commitments` enumera los compromisos pendientes.

## Uso

```bash
openclaw commitments [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments list [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments dismiss <id...> [--json]
```

## Opciones

- `--all`: muestra todos los estados en lugar de solo los compromisos pendientes.
- `--agent <id>`: filtra por un id de agente.
- `--status <status>`: filtra por estado. Valores: `pending`, `sent`,
  `dismissed`, `snoozed` o `expired`.
- `--json`: genera JSON legible por máquina.

## Ejemplos

Enumera los compromisos pendientes:

```bash
openclaw commitments
```

Enumera todos los compromisos almacenados:

```bash
openclaw commitments --all
```

Filtra por un agente:

```bash
openclaw commitments --agent main
```

Busca compromisos pospuestos:

```bash
openclaw commitments --status snoozed
```

Descarta uno o más compromisos:

```bash
openclaw commitments dismiss cm_abc123 cm_def456
```

Exporta como JSON:

```bash
openclaw commitments --all --json
```

## Salida

La salida de texto incluye:

- id del compromiso
- estado
- tipo
- hora de vencimiento más temprana
- alcance
- texto sugerido para el seguimiento

La salida JSON también incluye la ruta del almacén de compromisos y los registros almacenados completos.

## Relacionado

- [Compromisos inferidos](/es/concepts/commitments)
- [Resumen de la memoria](/es/concepts/memory)
- [Heartbeat](/es/gateway/heartbeat)
- [Tareas programadas](/es/automation/cron-jobs)
