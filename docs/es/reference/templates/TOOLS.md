---
read_when:
    - Inicializar un espacio de trabajo manualmente
summary: Plantilla de espacio de trabajo para TOOLS.md
title: Plantilla de TOOLS.md
x-i18n:
    generated_at: "2026-04-24T05:49:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 810b088129bfd963ffe603a7e0a07d099fd2551bf13ebcb702905e1b8135d017
    source_path: reference/templates/TOOLS.md
    workflow: 15
---

# TOOLS.md - Notas locales

Las Skills definen _cómo_ funcionan las herramientas. Este archivo es para _tus_ detalles concretos: lo que es único de tu configuración.

## Qué va aquí

Cosas como:

- Nombres y ubicaciones de cámaras
- Hosts y alias SSH
- Voces preferidas para TTS
- Nombres de altavoces/salas
- Apodos de dispositivos
- Cualquier cosa específica del entorno

## Ejemplos

```markdown
### Cameras

- living-room → Área principal, gran angular de 180°
- front-door → Entrada, activada por movimiento

### SSH

- home-server → 192.168.1.100, usuario: admin

### TTS

- Voz preferida: "Nova" (cálida, ligeramente británica)
- Altavoz predeterminado: Kitchen HomePod
```

## ¿Por qué separado?

Las Skills son compartidas. Tu configuración es tuya. Mantenerlas separadas significa que puedes actualizar las Skills sin perder tus notas, y compartir Skills sin exponer tu infraestructura.

---

Añade lo que te ayude a hacer tu trabajo. Esta es tu chuleta.

## Relacionado

- [Espacio de trabajo del agente](/es/concepts/agent-workspace)
