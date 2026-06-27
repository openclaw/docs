---
read_when:
    - Escribir documentación que incluye tokens, claves de API o fragmentos de credenciales
    - Actualizando ejemplos que pueden ser escaneados por herramientas de detección de secretos
summary: Convenciones de marcadores de posición seguros para el escáner de secretos en documentación y ejemplos
title: Convenciones de marcadores de posición de secretos
x-i18n:
    generated_at: "2026-06-27T12:54:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 87e0db9ad47bf0c9d434da9bdcd6587e0b01d4eddf5ad245cf3dc87a1d166875
    source_path: reference/secret-placeholder-conventions.md
    workflow: 16
---

# Convenciones para marcadores de posición de secretos

Usa marcadores de posición que sean legibles para humanos, pero que no se parezcan a secretos reales.

## Estilo recomendado

- Prefiere valores descriptivos como `example-openai-key-not-real` o `example-discord-bot-token`.
- Para fragmentos de shell, prefiere `${OPENAI_API_KEY}` en lugar de cadenas en línea que parezcan tokens.
- Mantén los ejemplos claramente falsos y acotados a su propósito (proveedor, canal, tipo de autenticación).

## Evita estos patrones en la documentación

- Texto literal de encabezado o pie de clave privada PEM.
- Prefijos que se parezcan a credenciales activas, por ejemplo `sk-...`, `xoxb-...`, `AKIA...`.
- Tokens bearer de aspecto realista copiados de registros de runtime.

## Ejemplo

```bash
# Good
export OPENAI_API_KEY="example-openai-key-not-real"

# Better (when the doc is about env wiring)
export OPENAI_API_KEY="${OPENAI_API_KEY}"
```
