---
read_when:
    - Inicializar un espacio de trabajo manualmente
summary: Plantilla de espacio de trabajo para TOOLS.md
title: Plantilla de TOOLS.md
x-i18n:
    generated_at: "2026-07-05T11:45:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 20eab78b3b117566a1d33a70873e70ff2d5099543aa44e2719dc8d0797099afe
    source_path: reference/templates/TOOLS.md
    workflow: 16
---

# TOOLS.md - Notas locales

Skills definen _cómo_ funcionan las herramientas. Este archivo es para _tus_ detalles específicos: lo que es exclusivo de tu configuración: nombres y ubicaciones de cámaras, hosts y alias SSH, voces TTS preferidas, nombres de altavoces/salas, apodos de dispositivos, cualquier cosa específica del entorno.

## Ejemplos

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## ¿Por qué separarlos?

Skills son compartidas. Tu configuración es tuya. Mantenerlas separadas significa que puedes actualizar las Skills sin perder tus notas y compartir Skills sin filtrar tu infraestructura.

---

Agrega lo que te ayude a hacer tu trabajo. Esta es tu hoja de referencia.

## Relacionado

- [Espacio de trabajo del agente](/es/concepts/agent-workspace)
