---
read_when:
    - Está actualizando una configuración que utilizaba compromisos inferidos
    - Desea inspeccionar o descartar los registros de seguimiento almacenados previamente
sidebarTitle: Commitments
summary: Guía sobre el estado y la limpieza de compromisos de seguimiento inferidos y retirados
title: Compromisos inferidos
x-i18n:
    generated_at: "2026-07-22T10:30:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: cfaa8c44be4ffb8db48279dba5347d4f598a193bfc4e244aeaed7a93e00ffb79
    source_path: concepts/commitments.md
    workflow: 16
---

El experimento de compromisos inferidos se ha retirado. OpenClaw ya no extrae nuevos
seguimientos de conversaciones ni los entrega mediante Heartbeat, y el anterior
bloque de configuración `commitments` se elimina mediante `openclaw doctor --fix`.

Los recordatorios exactos y el trabajo programado siguen utilizando las
[tareas programadas](/es/automation/cron-jobs). Los hechos conversacionales duraderos deben almacenarse en la
[memoria](/es/concepts/memory).

## Registros existentes

Los compromisos almacenados anteriormente permanecen en la base de datos de estado SQLite compartida para que una
actualización no destruya el historial visible para el operador. Utilice la CLI de mantenimiento
heredada para inspeccionar o descartar esas filas:

```bash
openclaw commitments --all
openclaw commitments dismiss cm_abc123
```

Consulte [`openclaw commitments`](/es/cli/commitments) para obtener la referencia del comando
de mantenimiento.

## Relacionado

- [Tareas programadas](/es/automation/cron-jobs)
- [Descripción general de la memoria](/es/concepts/memory)
- [Heartbeat](/es/gateway/heartbeat)
