---
read_when:
    - Añadir una lista de comprobación de BOOT.md
summary: Plantilla del espacio de trabajo para BOOT.md
title: Plantilla de BOOT.md
x-i18n:
    generated_at: "2026-07-11T23:33:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1adfb4d71f1f03716a1ddc4774a4cb6ead4b8be65bd9bb34066a9e1929a36b21
    source_path: reference/templates/BOOT.md
    workflow: 16
---

# BOOT.md

Añade aquí instrucciones de inicio breves y explícitas. El hook `boot-md` incluido ejecuta este archivo una vez por cada espacio de trabajo del agente cada vez que se inicia el Gateway, si el archivo existe y contiene caracteres que no sean espacios en blanco. Si varios agentes comparten un espacio de trabajo, solo se activa una ejecución.

El hook se distribuye deshabilitado. Habilítalo primero:

```bash
openclaw hooks enable boot-md
```

Si un elemento de la lista de verificación envía un mensaje, usa la herramienta de mensajes y, a continuación, responde con el token de silencio exacto `NO_REPLY` (sin distinguir entre mayúsculas y minúsculas).

## Contenido relacionado

- [Espacio de trabajo del agente](/es/concepts/agent-workspace)
- [Hooks](/es/automation/hooks#boot-md)
