---
read_when:
    - Estás instalando, configurando o auditando el plugin anthropic-vertex
summary: Plugin de proveedor Anthropic Vertex de OpenClaw para modelos Claude en Google Vertex AI.
title: Plugin Anthropic Vertex
x-i18n:
    generated_at: "2026-07-11T23:23:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fe5500ca56df49c0ef6ccbf39ced71e3fd0b18776ad23716de8575bc6ba64cb8
    source_path: plugins/reference/anthropic-vertex.md
    workflow: 16
---

# Plugin Anthropic Vertex

Plugin de proveedor Anthropic Vertex de OpenClaw para modelos Claude en Google Vertex AI.

## Distribución

- Paquete: `@openclaw/anthropic-vertex-provider`
- Vía de instalación: npm; ClawHub

## Superficie

proveedores: anthropic-vertex

<!-- openclaw-plugin-reference:manual-start -->

## Claude Fable 5

Use `anthropic-vertex/claude-fable-5` donde el modelo esté disponible en su región de Google Cloud.
Fable 5 siempre utiliza razonamiento adaptativo y, de forma predeterminada, un esfuerzo `high`. `/think off` y
`/think minimal` utilizan un esfuerzo `low` porque el modelo no permite desactivar el razonamiento.

## Claude Sonnet 5

Use `anthropic-vertex/claude-sonnet-5` con el punto de conexión `global`, `us` o `eu`
de Vertex. Sonnet 5 utiliza de forma predeterminada el razonamiento adaptativo con un esfuerzo `high` y admite
`/think off` o los niveles nativos `/think xhigh|max`. OpenClaw publica automáticamente
su ventana de contexto de 1 000 000 de tokens y su límite de salida de 128 000 tokens.

Los precios del catálogo siguen la tarifa global introductoria de Vertex de `$2/$10` por
millón de tokens de entrada/salida hasta el 31 de agosto de 2026 y, a partir del
1 de septiembre, serán de `$3/$15`. Los puntos de conexión multirregionales `us` y `eu` aplican el
recargo documentado del 10 % de Vertex.

<!-- openclaw-plugin-reference:manual-end -->
