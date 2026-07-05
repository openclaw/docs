---
read_when:
    - Agregar una lista de verificación BOOT.md
summary: Plantilla de espacio de trabajo para BOOT.md
title: Plantilla BOOT.md
x-i18n:
    generated_at: "2026-07-05T11:42:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1adfb4d71f1f03716a1ddc4774a4cb6ead4b8be65bd9bb34066a9e1929a36b21
    source_path: reference/templates/BOOT.md
    workflow: 16
---

# BOOT.md

Agrega aquí instrucciones de inicio breves y explícitas. El hook incluido `boot-md` ejecuta este archivo una vez por espacio de trabajo del agente cada vez que se inicia el gateway, si el archivo existe y contiene contenido que no sea espacios en blanco. Varios agentes que comparten un espacio de trabajo solo activan una ejecución.

El hook se distribuye deshabilitado. Habilítalo primero:

```bash
openclaw hooks enable boot-md
```

Si un elemento de la lista de verificación envía un mensaje, usa la herramienta de mensajes y luego responde con el token silencioso exacto `NO_REPLY` (sin distinguir mayúsculas y minúsculas).

## Relacionado

- [Espacio de trabajo del agente](/es/concepts/agent-workspace)
- [Hooks](/es/automation/hooks#boot-md)
