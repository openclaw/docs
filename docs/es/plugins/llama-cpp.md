---
read_when:
    - Quieres embeddings de búsqueda en memoria de un modelo GGUF local
    - Estás configurando memorySearch.provider = "local"
    - Necesitas el Plugin de OpenClaw que gestiona el entorno de ejecución de node-llama-cpp
sidebarTitle: llama.cpp Provider
summary: Instala el proveedor oficial de llama.cpp para embeddings de memoria GGUF locales
title: Proveedor de llama.cpp
x-i18n:
    generated_at: "2026-07-11T23:20:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 369ec199e8493356912337b849a84f829672e8872d17083c9a597f4e5294ebd5
    source_path: plugins/llama-cpp.md
    workflow: 16
---

`llama-cpp` es el plugin de proveedor externo oficial para embeddings GGUF
locales. Registra el identificador de proveedor de embeddings `local` y es responsable de la
dependencia de entorno de ejecución `node-llama-cpp` que utiliza `memorySearch.provider: "local"`.

Instálelo antes de usar embeddings de memoria locales:

```bash
openclaw plugins install @openclaw/llama-cpp-provider
```

El paquete npm principal `openclaw` no incluye `node-llama-cpp`. Mantener la
dependencia nativa en este plugin evita que las actualizaciones normales de OpenClaw mediante npm
eliminen un entorno de ejecución instalado manualmente dentro del directorio del paquete de OpenClaw.

## Configuración

Establezca `memorySearch.provider` en `local`:

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

El valor predeterminado de `local.modelPath` es el URI `hf:` mostrado anteriormente (`embeddinggemma-300m-qat-Q8_0.gguf`).
Asígnelo a otro URI `hf:` o a un archivo `.gguf` local para usar otro
modelo. `local.modelCacheDir` sustituye la ubicación donde se almacenan en caché los modelos descargados
(valor predeterminado: `~/.node-llama-cpp/models`), y `local.contextSize` acepta un
entero o `"auto"`.

Cuando `local.contextSize` es numérico, el proveedor también proporciona ese requisito
a la asignación automática de capas de GPU de node-llama-cpp. Esto permite que node-llama-cpp aloje
conjuntamente el modelo y el contexto de embeddings mientras conserva sus comprobaciones de seguridad
de memoria. Con `"auto"`, node-llama-cpp mantiene su asignación automática habitual.

## Entorno de ejecución nativo

Use Node 24 para que la instalación nativa sea lo más fluida posible. Las copias del código fuente que usan
pnpm podrían necesitar aprobar y recompilar la dependencia nativa:

```bash
pnpm approve-builds
pnpm rebuild node-llama-cpp
```

## Diagnósticos del entorno de ejecución

Ejecute `openclaw memory status --deep` después de que se haya cargado el proveedor para consultar
el backend y la compilación seleccionados, los nombres de los dispositivos, las capas transferidas
a la GPU, el tamaño de contexto solicitado y la última instantánea observada de la VRAM o la memoria unificada. Los valores de VRAM
incluyen una marca de tiempo de observación porque las consultas pasivas de estado no
vuelven a cargar el modelo ni sondean el dispositivo.

Los mismos datos conocidos más recientes pueden aparecer en `openclaw doctor` cuando el
Gateway en ejecución ya ha utilizado el proveedor local. Un comando normal de estado o de diagnóstico
no carga un modelo únicamente para recopilar diagnósticos.

## Solución de problemas

Si falta `node-llama-cpp` o no se puede cargar, OpenClaw informa del error
junto con estas instrucciones:

1. Instale el plugin: `openclaw plugins install @openclaw/llama-cpp-provider`.
2. Use Node 24 para las instalaciones y actualizaciones nativas.
3. Desde una copia del código fuente basada en pnpm: `pnpm approve-builds` y, a continuación, `pnpm rebuild node-llama-cpp`.

Para usar embeddings locales con menos complicaciones y sin el paso de compilación nativa, establezca
`memorySearch.provider` en un proveedor de embeddings remoto como `lmstudio`,
`ollama`, `openai` o `voyage`.
