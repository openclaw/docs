---
read_when:
    - Inicializar manualmente un espacio de trabajo
summary: Plantilla de espacio de trabajo para HEARTBEAT.md
title: Plantilla de HEARTBEAT.md
x-i18n:
    generated_at: "2026-07-05T11:45:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1605f546995e0bdcb11f9bf905173b14aca25cfad664fe2c7644d18c2b4142e2
    source_path: reference/templates/HEARTBEAT.md
    workflow: 16
---

# Plantilla de HEARTBEAT.md

`HEARTBEAT.md` vive en el espacio de trabajo del agente y contiene la lista de comprobación periódica de Heartbeat. Mantenlo vacío, o solo con espacios en blanco, comentarios de Markdown, encabezados ATX, esqueletos de lista vacíos (`- `, `* [ ]`) o marcadores de bloque, para hacer que OpenClaw omita por completo la llamada al modelo de Heartbeat (`reason=empty-heartbeat-file`).

Contenido predeterminado enviado:

```markdown
<!-- Heartbeat template; comments-only content prevents scheduled heartbeat API calls. -->

# Keep this file empty (or with only comments) to skip heartbeat API calls.

# Add tasks below when you want the agent to check something periodically.
```

Añade tareas breves debajo de las líneas de comentario solo cuando quieras comprobaciones periódicas. Mantenlo pequeño: las ejecuciones de Heartbeat leen este archivo en cada pulso (de forma predeterminada, cada 30 minutos), por lo que las instrucciones infladas consumen tokens en cada activación.

Para comprobaciones solo al vencimiento en lugar de una lista de comprobación simple, usa un bloque `tasks:` estructurado con campos `interval` y `prompt` por tarea; consulta [HEARTBEAT.md](/es/gateway/heartbeat#heartbeatmd-optional) para ver el formato y el comportamiento.

## Relacionado

- [Heartbeat](/es/gateway/heartbeat)
- [Configuración de Heartbeat](/es/gateway/config-agents)
