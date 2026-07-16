---
read_when:
    - Quiere inspeccionar los compromisos de seguimiento inferidos
    - Se quieren descartar los registros pendientes
    - Está auditando lo que puede entregar Heartbeat
summary: Referencia de la CLI para `openclaw commitments` (inspeccionar y descartar seguimientos inferidos)
title: '`openclaw commitments`'
x-i18n:
    generated_at: "2026-07-16T11:31:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: db8a7d8f5756ccb18ed0990fcedf50d1072bb67e775c29eefdbd1a7dd795b7b0
    source_path: cli/commitments.md
    workflow: 16
---

Enumera y gestiona los compromisos de seguimiento inferidos.

Los compromisos son opcionales (`commitments.enabled`), recuerdos de seguimiento de corta duración
creados a partir del contexto de la conversación y entregados mediante Heartbeat. Consulta
[Compromisos inferidos](/es/concepts/commitments) para obtener la guía conceptual y la configuración.

Sin ningún subcomando, `openclaw commitments` enumera los compromisos pendientes.

## Uso

```bash
openclaw commitments [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments list [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments dismiss <id...> [--json]
```

## Opciones

- `--all`: muestra todos los estados en lugar de solo los compromisos pendientes.
- `--agent <id>`: filtra por un id. de agente.
- `--status <status>`: filtra por estado. Valores: `pending`, `sent`,
  `dismissed`, `snoozed` o `expired`. Los valores desconocidos provocan la finalización con un error.
- `--json`: genera una salida JSON legible por máquinas.

`dismiss` marca los identificadores de compromiso especificados como `dismissed` para que Heartbeat no
los entregue.

## Ejemplos

Enumerar los compromisos pendientes:

```bash
openclaw commitments
```

Enumerar todos los compromisos almacenados:

```bash
openclaw commitments --all
```

Filtrar por un agente:

```bash
openclaw commitments --agent main
```

Buscar compromisos pospuestos:

```bash
openclaw commitments --status snoozed
```

Descartar uno o varios compromisos:

```bash
openclaw commitments dismiss cm_abc123 cm_def456
```

Exportar como JSON:

```bash
openclaw commitments --all --json
```

## Salida

La salida de texto muestra el número de compromisos, la ruta de la base de datos SQLite compartida, los filtros activos
y una fila por compromiso:

- identificador del compromiso
- estado
- tipo (`event_check_in`, `deadline_check`, `care_check_in` o `open_loop`)
- hora de vencimiento más temprana
- ámbito (agente/canal/destino)
- texto de seguimiento sugerido

La salida JSON incluye el número, los filtros activos de estado y agente, la
ruta de la base de datos SQLite compartida y los registros almacenados completos.

## Contenido relacionado

- [Compromisos inferidos](/es/concepts/commitments)
- [Descripción general de la memoria](/es/concepts/memory)
- [Heartbeat](/es/gateway/heartbeat)
- [Tareas programadas](/es/automation/cron-jobs)
