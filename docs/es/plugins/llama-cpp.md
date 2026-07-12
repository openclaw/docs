---
read_when:
    - Quieres generar embeddings de búsqueda de memoria con un modelo GGUF local
    - Está configurando memorySearch.provider = "local"
    - Necesita el plugin de OpenClaw al que pertenece el entorno de ejecución node-llama-cpp
sidebarTitle: llama.cpp Provider
summary: Instala el proveedor oficial de llama.cpp para embeddings de memoria GGUF locales
title: Proveedor de llama.cpp
x-i18n:
    generated_at: "2026-07-12T14:42:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 369ec199e8493356912337b849a84f829672e8872d17083c9a597f4e5294ebd5
    source_path: plugins/llama-cpp.md
    workflow: 16
---

`llama-cpp` es el Plugin de proveedor externo oficial para embeddings GGUF
locales. Registra el id de proveedor de embeddings `local` y posee la
dependencia de entorno de ejecución `node-llama-cpp` utilizada por `memorySearch.provider: "local"`.

Instálelo antes de utilizar embeddings de memoria locales:

```bash
openclaw plugins install @openclaw/llama-cpp-provider
```

El paquete npm principal `openclaw` no incluye `node-llama-cpp`. Mantener la
dependencia nativa en este Plugin evita que las actualizaciones normales de npm de OpenClaw
eliminen un entorno de ejecución instalado manualmente dentro del directorio del paquete OpenClaw.

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
Asígnelo a otro URI `hf:` o a un archivo `.gguf` local para utilizar otro
modelo. `local.modelCacheDir` reemplaza la ubicación donde se almacenan en caché los modelos descargados
(valor predeterminado: `~/.node-llama-cpp/models`), y `local.contextSize` acepta un
entero o `"auto"`.

Cuando `local.contextSize` es numérico, el proveedor también proporciona ese requisito
a la asignación automática de capas de GPU de node-llama-cpp. Esto permite que node-llama-cpp ajuste
conjuntamente el modelo y el contexto de embeddings, a la vez que mantiene sus comprobaciones de
seguridad de memoria. Con `"auto"`, node-llama-cpp conserva su asignación automática habitual.

## Entorno de ejecución nativo

Utilice Node 24 para que la instalación nativa sea lo más fluida posible. Las copias de trabajo del código fuente que utilizan
pnpm pueden necesitar aprobar y recompilar la dependencia nativa:

```bash
pnpm approve-builds
pnpm rebuild node-llama-cpp
```

## Diagnósticos del entorno de ejecución

Ejecute `openclaw memory status --deep` después de que se haya cargado el proveedor para inspeccionar
el backend y la compilación seleccionados, los nombres de los dispositivos, las capas descargadas en la GPU, el tamaño de
contexto solicitado y la última instantánea observada de VRAM o memoria unificada. Los valores de VRAM
incluyen una marca de tiempo de observación porque las lecturas pasivas de estado no
recargan el modelo ni consultan el dispositivo.

Los mismos datos conocidos más recientes pueden aparecer en `openclaw doctor` cuando el
Gateway en ejecución ya ha utilizado el proveedor local. Un comando normal de estado o de diagnóstico
no carga un modelo únicamente para recopilar diagnósticos.

## Solución de problemas

Si falta `node-llama-cpp` o no se puede cargar, OpenClaw informa del fallo
junto con estas indicaciones:

1. Instale el Plugin: `openclaw plugins install @openclaw/llama-cpp-provider`.
2. Utilice Node 24 para instalaciones y actualizaciones nativas.
3. Desde una copia de trabajo del código fuente con pnpm: `pnpm approve-builds` y, a continuación, `pnpm rebuild node-llama-cpp`.

Para utilizar embeddings locales con menos complicaciones y sin el paso de compilación nativa, establezca
`memorySearch.provider` en un proveedor remoto de embeddings, como `lmstudio`,
`ollama`, `openai` o `voyage`.
