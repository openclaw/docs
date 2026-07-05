---
read_when:
    - Desea inspeccionar los compromisos de seguimiento inferidos
    - Quieres descartar los registros pendientes
    - Estás auditando lo que Heartbeat puede entregar
summary: Referencia de CLI para `openclaw commitments` (inspeccionar y descartar seguimientos inferidos)
title: '`openclaw commitments`'
x-i18n:
    generated_at: "2026-07-05T11:09:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4323273a5d73975532f4728dc5e40c5d59e0c6d2e31a538f96bf3451e3fdf4d9
    source_path: cli/commitments.md
    workflow: 16
---

Enumera y gestiona compromisos de seguimiento inferidos.

Los compromisos son opcionales (`commitments.enabled`), recuerdos de seguimiento
de corta duración creados a partir del contexto de la conversación y entregados
por Heartbeat. Consulta [Compromisos inferidos](/es/concepts/commitments) para ver
la guía conceptual y la configuración.

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
  `dismissed`, `snoozed` o `expired`. Los valores desconocidos salen con un error.
- `--json`: emite JSON legible por máquinas.

`dismiss` marca los ids de compromiso indicados como `dismissed` para que
Heartbeat no los entregue.

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

La salida de texto imprime el recuento de compromisos, la ruta del almacén,
cualquier filtro activo y una fila por compromiso:

- id de compromiso
- estado
- tipo (`event_check_in`, `deadline_check`, `care_check_in` u `open_loop`)
- hora de vencimiento más temprana
- alcance (agente/canal/destino)
- texto de contacto sugerido

La salida JSON incluye el recuento, los filtros activos de estado y agente, la
ruta del almacén de compromisos y los registros almacenados completos.

## Relacionado

- [Compromisos inferidos](/es/concepts/commitments)
- [Descripción general de la memoria](/es/concepts/memory)
- [Heartbeat](/es/gateway/heartbeat)
- [Tareas programadas](/es/automation/cron-jobs)
