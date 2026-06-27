---
read_when:
    - Estás instalando, configurando o auditando el plugin anthropic-vertex
summary: Plugin de proveedor Anthropic Vertex de OpenClaw para modelos Claude en Google Vertex AI.
title: Plugin de Anthropic Vertex
x-i18n:
    generated_at: "2026-06-27T12:18:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f772c9a5bf1edd6a270b7ba5e6d695290fe96648c9ac38d0bc90bb1504f50cd7
    source_path: plugins/reference/anthropic-vertex.md
    workflow: 16
---

# Plugin Anthropic Vertex

Plugin de proveedor Anthropic Vertex de OpenClaw para modelos Claude en Google Vertex AI.

## Distribución

- Paquete: `@openclaw/anthropic-vertex-provider`
- Ruta de instalación: npm; ClawHub

## Superficie

providers: anthropic-vertex

<!-- openclaw-plugin-reference:manual-start -->

## Claude Fable 5

Usa `anthropic-vertex/claude-fable-5` donde el modelo esté disponible en tu región de Google Cloud.
Fable 5 siempre usa pensamiento adaptativo y el valor predeterminado es esfuerzo `high`. `/think off` y
`/think minimal` usan esfuerzo `low` porque el modelo no admite desactivar el pensamiento.

<!-- openclaw-plugin-reference:manual-end -->
