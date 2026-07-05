---
read_when:
    - Quieres embeddings de búsqueda de memoria desde un modelo GGUF local
    - Está configurando memorySearch.provider = "local"
    - Necesitas el Plugin de OpenClaw que posee el entorno de ejecución de node-llama-cpp
sidebarTitle: llama.cpp Provider
summary: Instala el proveedor oficial de llama.cpp para embeddings de memoria GGUF locales
title: Proveedor llama.cpp
x-i18n:
    generated_at: "2026-07-05T11:30:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bc8243a07b647f2f9a4b2da855997d39fb37704dfe584fc4f14076ab276b07a8
    source_path: plugins/llama-cpp.md
    workflow: 16
---

`llama-cpp` es el Plugin proveedor externo oficial para embeddings GGUF locales. Registra el id de proveedor de embeddings `local` y es propietario de la dependencia de entorno de ejecución `node-llama-cpp` que usa `memorySearch.provider: "local"`.

Instálalo antes de usar embeddings de memoria locales:

```bash
openclaw plugins install @openclaw/llama-cpp-provider
```

El paquete npm principal `openclaw` no incluye `node-llama-cpp`. Mantener la dependencia nativa en este Plugin evita que las actualizaciones npm normales de OpenClaw eliminen un entorno de ejecución instalado manualmente dentro del directorio del paquete de OpenClaw.

## Configuración

Define `memorySearch.provider` como `local`:

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

`local.modelPath` usa de forma predeterminada el URI `hf:` mostrado arriba (`embeddinggemma-300m-qat-Q8_0.gguf`). Apúntalo a un URI `hf:` diferente o a un archivo `.gguf` local para usar otro modelo. `local.modelCacheDir` sobrescribe dónde se almacenan en caché los modelos descargados (valor predeterminado: `~/.node-llama-cpp/models`), y `local.contextSize` acepta un entero o `"auto"`.

## Entorno de ejecución nativo

Usa Node 24 para la ruta de instalación nativa más fluida. Las copias de trabajo de código fuente que usan pnpm pueden necesitar aprobar y reconstruir la dependencia nativa:

```bash
pnpm approve-builds
pnpm rebuild node-llama-cpp
```

## Solución de problemas

Si `node-llama-cpp` falta o no se puede cargar, OpenClaw informa el fallo con:

1. Instala el Plugin: `openclaw plugins install @openclaw/llama-cpp-provider`.
2. Usa Node 24 para instalaciones/actualizaciones nativas.
3. Desde una copia de trabajo de código fuente con pnpm: `pnpm approve-builds`, luego `pnpm rebuild node-llama-cpp`.

Para embeddings locales con menos fricción y sin el paso de compilación nativa, define `memorySearch.provider` como un proveedor remoto de embeddings, como `lmstudio`, `ollama`, `openai` o `voyage`.
