---
read_when:
    - Inicializar manualmente un espacio de trabajo
summary: Plantilla de espacio de trabajo para HEARTBEAT.md
title: Plantilla de HEARTBEAT.md
x-i18n:
    generated_at: "2026-06-27T12:55:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 44a1ea787d67110ca53d752706b62f5ce5c4df8637897dee97ce6502f6a05eb6
    source_path: reference/templates/HEARTBEAT.md
    workflow: 16
---

# Plantilla de HEARTBEAT.md

`HEARTBEAT.md` vive en el espacio de trabajo del agente. Mantén el archivo vacío, o solo con comentarios y encabezados de Markdown, cuando quieras que OpenClaw omita las llamadas al modelo de Heartbeat.

La plantilla predeterminada del runtime es:

```markdown
# Keep this file empty (or with only comments) to skip heartbeat API calls.

# Add tasks below when you want the agent to check something periodically.
```

Agrega tareas breves debajo de los comentarios solo cuando quieras que el agente revise algo periódicamente. Mantén pequeñas las instrucciones de Heartbeat porque se leen durante los despertares recurrentes.

## Relacionado

- [Configuración de Heartbeat](/es/gateway/config-agents)
