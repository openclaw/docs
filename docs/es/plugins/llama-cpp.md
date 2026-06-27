---
read_when:
    - Quieres incrustaciones de búsqueda de memoria desde un modelo GGUF local
    - Estás configurando memorySearch.provider = "local"
    - Necesitas el plugin de OpenClaw que posee el runtime de node-llama-cpp
sidebarTitle: llama.cpp Provider
summary: Instala el proveedor oficial de llama.cpp para embeddings de memoria GGUF locales
title: Proveedor llama.cpp
x-i18n:
    generated_at: "2026-06-27T12:13:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3b0988c36c5ed5c61a7e97980df291fb43a0071e57c7460bf5a653f516114963
    source_path: plugins/llama-cpp.md
    workflow: 16
---

`llama-cpp` es el plugin proveedor externo oficial para embeddings GGUF locales.
Es propietario de la dependencia de runtime `node-llama-cpp` usada por
`memorySearch.provider: "local"`.

Instálalo antes de usar embeddings de memoria local:

```bash
openclaw plugins install @openclaw/llama-cpp-provider
```

El paquete npm principal `openclaw` no incluye `node-llama-cpp`. Mantener la
dependencia nativa en este plugin evita que las actualizaciones npm normales de OpenClaw
eliminen un runtime instalado manualmente dentro del directorio del paquete OpenClaw.

## Configuración

Define el proveedor de búsqueda de memoria como `local`:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "local",
        local: {
          modelPath: "hf:ggml-org/embeddinggemma-300m-qat-q8_0-GGUF/embeddinggemma-300m-qat-Q8_0.gguf",
        },
      },
    },
  },
}
```

El modelo predeterminado es `embeddinggemma-300m-qat-Q8_0.gguf`. También puedes apuntar
`local.modelPath` a un archivo `.gguf` local.

## Runtime nativo

Usa Node 24 para la ruta de instalación nativa más fluida. Los checkouts de código fuente que usan pnpm
pueden necesitar aprobar y reconstruir la dependencia nativa:

```bash
pnpm approve-builds
pnpm rebuild node-llama-cpp
```

Para embeddings locales con menos fricción, usa en su lugar un proveedor de servicio local como
Ollama o LM Studio.
