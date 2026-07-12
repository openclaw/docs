---
read_when:
    - Inicializar manualmente un espacio de trabajo
summary: Plantilla del espacio de trabajo para TOOLS.md
title: Plantilla de TOOLS.md
x-i18n:
    generated_at: "2026-07-11T23:31:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 20eab78b3b117566a1d33a70873e70ff2d5099543aa44e2719dc8d0797099afe
    source_path: reference/templates/TOOLS.md
    workflow: 16
---

# TOOLS.md - Notas locales

Skills define _cómo_ funcionan las herramientas. Este archivo contiene _tus_ datos específicos: aquello que es exclusivo de tu configuración, como los nombres y las ubicaciones de las cámaras, los hosts y alias de SSH, las voces de TTS preferidas, los nombres de altavoces y habitaciones, los apodos de dispositivos y cualquier otro elemento específico del entorno.

## Ejemplos

```markdown
### Cámaras

- living-room → Zona principal, gran angular de 180°
- front-door → Entrada, activada por movimiento

### SSH

- home-server → 192.168.1.100, usuario: admin

### TTS

- Voz preferida: "Nova" (cálida, con un ligero acento británico)
- Altavoz predeterminado: HomePod de la cocina
```

## ¿Por qué mantenerlos separados?

Skills se comparten. Tu configuración es solo tuya. Mantenerlos separados te permite actualizar las Skills sin perder tus notas y compartirlas sin revelar tu infraestructura.

---

Añade todo lo que te ayude a hacer tu trabajo. Esta es tu guía de referencia rápida.

## Contenido relacionado

- [Espacio de trabajo del agente](/es/concepts/agent-workspace)
