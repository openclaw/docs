---
read_when:
    - Está instalando, configurando o auditando el plugin llama-cpp
summary: Inferencia de texto y embeddings GGUF locales mediante node-llama-cpp.
title: Plugin Llama Cpp
x-i18n:
    generated_at: "2026-07-19T02:04:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2756d4b3e00bbe37b4dedec1d54d28bfe6662e8105504317a402293254ce0240
    source_path: plugins/reference/llama-cpp.md
    workflow: 16
---

# Plugin Llama Cpp

Inferencia de texto y embeddings locales de GGUF mediante node-llama-cpp.

## Distribución

- Paquete: `@openclaw/llama-cpp-provider`
- Ruta de instalación: npm; ClawHub

## Superficie

proveedores: `llama-cpp`; contratos: `embeddingProviders`

<!-- openclaw-plugin-reference:manual-start -->

## Modelo de texto predeterminado

Durante la configuración interactiva, OpenClaw ofrece Gemma 4 E4B IT Q4_K_M como una
descarga incluida de aproximadamente 5.0 GB. La oferta requiere al menos 16 GiB de
RAM total. Los modelos existentes en caché se siguen detectando en máquinas más pequeñas.

Para utilizar otro modelo, establezca `params.modelPath` en cualquier GGUF personalizado. Los modelos personalizados
no están sujetos al requisito de RAM de la descarga incluida. En máquinas que no cumplen el
requisito, también se puede ejecutar un modelo más pequeño mediante Ollama o LM Studio, o
elegir un proveedor en la nube.

<!-- openclaw-plugin-reference:manual-end -->

## Documentación relacionada

- [llama-cpp](/es/plugins/llama-cpp)
