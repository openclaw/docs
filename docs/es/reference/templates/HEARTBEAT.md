---
read_when:
    - Inicialización manual de un espacio de trabajo
summary: Plantilla del espacio de trabajo para HEARTBEAT.md
title: Plantilla de HEARTBEAT.md
x-i18n:
    generated_at: "2026-07-11T23:31:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1605f546995e0bdcb11f9bf905173b14aca25cfad664fe2c7644d18c2b4142e2
    source_path: reference/templates/HEARTBEAT.md
    workflow: 16
---

# Plantilla de HEARTBEAT.md

`HEARTBEAT.md` se encuentra en el espacio de trabajo del agente y contiene la lista de comprobación periódica de Heartbeat. Manténgalo vacío, o solo con espacios en blanco, comentarios de Markdown, encabezados ATX, marcadores de lista vacíos (`- `, `* [ ]`) o delimitadores de bloques, para que OpenClaw omita por completo la llamada al modelo de Heartbeat (`reason=empty-heartbeat-file`).

Contenido predeterminado incluido:

```markdown
<!-- Plantilla de Heartbeat; el contenido que solo contiene comentarios evita las llamadas programadas a la API de Heartbeat. -->

# Mantenga este archivo vacío (o solo con comentarios) para omitir las llamadas a la API de Heartbeat.

# Añada tareas a continuación cuando quiera que el agente compruebe algo periódicamente.
```

Añada tareas breves debajo de las líneas de comentarios solo cuando quiera realizar comprobaciones periódicas. Manténgalo reducido: las ejecuciones de Heartbeat leen este archivo en cada ciclo (de forma predeterminada, cada 30 minutos), por lo que unas instrucciones excesivas consumen tokens en cada activación.

Para realizar comprobaciones solo cuando corresponda, en lugar de usar una lista de comprobación simple, utilice un bloque estructurado `tasks:` con los campos `interval` y `prompt` para cada tarea; consulte [HEARTBEAT.md](/es/gateway/heartbeat#heartbeatmd-optional) para conocer el formato y el comportamiento.

## Contenido relacionado

- [Heartbeat](/es/gateway/heartbeat)
- [Configuración de Heartbeat](/es/gateway/config-agents)
