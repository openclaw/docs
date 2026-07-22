---
read_when:
    - Quiere inspeccionar los compromisos de seguimiento inferidos
    - Quiere descartar los registros pendientes
    - Está auditando lo que puede entregar el Heartbeat
summary: Referencia de la CLI para `openclaw commitments` (inspeccionar y descartar seguimientos inferidos)
title: '`openclaw commitments`'
x-i18n:
    generated_at: "2026-07-22T10:28:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4a7c573daad6a9bc6ce4532514c8cc22b3c510b4fc0cf9d1a79048413f08c1a2
    source_path: cli/commitments.md
    workflow: 16
---

Inspecciona y descarta los registros que dejó el experimento retirado de compromisos inferidos.
OpenClaw ya no crea ni entrega compromisos nuevos, pero conserva el comando de mantenimiento
para que las actualizaciones puedan auditar y limpiar las filas existentes de SQLite.

Sin un subcomando, `openclaw commitments` enumera los compromisos pendientes.

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
  `dismissed`, `snoozed` o `expired`. Los valores desconocidos hacen que el comando finalice con un error.
- `--json`: genera JSON legible por máquinas.

`dismiss` marca los ids de compromiso indicados como `dismissed`.

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

Descartar uno o más compromisos:

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

- id del compromiso
- estado
- tipo (`event_check_in`, `deadline_check`, `care_check_in` o `open_loop`)
- hora de vencimiento más temprana
- ámbito (agente/canal/destino)
- texto sugerido para el seguimiento

La salida JSON incluye el número, los filtros activos de estado y agente, la
ruta de la base de datos SQLite compartida y los registros almacenados completos.

## Relacionado

- [Compromisos inferidos](/es/concepts/commitments)
- [Descripción general de la memoria](/es/concepts/memory)
- [Heartbeat](/es/gateway/heartbeat)
- [Tareas programadas](/es/automation/cron-jobs)
