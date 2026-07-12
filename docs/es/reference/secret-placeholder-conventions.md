---
read_when:
    - Redacción de documentación que incluye tokens, claves de API o fragmentos de credenciales
    - Actualización de ejemplos que pueden ser analizados por herramientas de detección de secretos
summary: Convenciones de marcadores de posición seguros para el escáner de secretos en documentación y ejemplos
title: Convenciones de marcadores de posición para secretos
x-i18n:
    generated_at: "2026-07-11T23:32:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0864f0fcc6fb1e4a3147b4b2ce0aac475437a19d694f3d059374782428c7f248
    source_path: reference/secret-placeholder-conventions.md
    workflow: 16
---

# Convenciones para marcadores de posición de secretos

Usa marcadores de posición que sean legibles para las personas, pero que no se parezcan a secretos reales.

## Estilo recomendado

- Prefiere valores descriptivos como `example-openai-key-not-real` o `example-discord-bot-token`.
- Para fragmentos de shell, prefiere `${OPENAI_API_KEY}` en lugar de cadenas insertadas directamente que parezcan tokens.
- Asegúrate de que los ejemplos sean evidentemente falsos y estén delimitados según su propósito (proveedor, canal, tipo de autenticación).

## Evita estos patrones en la documentación

- Texto literal del encabezado o pie de una clave privada PEM.
- Prefijos que se parezcan a credenciales activas, por ejemplo, `sk-...`, `xoxb-...`, `AKIA...`.
- Tokens de portador de aspecto realista copiados de los registros de ejecución.

## Ejemplo

```bash
# Bueno
export OPENAI_API_KEY="example-openai-key-not-real"

# Mejor (cuando el documento trata sobre la configuración de variables de entorno)
export OPENAI_API_KEY="${OPENAI_API_KEY}"
```
