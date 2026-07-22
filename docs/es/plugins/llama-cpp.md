---
read_when:
    - Se desea realizar inferencia de texto local sin una clave de API ni un servidor de modelos
    - Quiere obtener embeddings de búsqueda de memoria a partir de un modelo GGUF local
    - Está configurando memory.search.provider = "local"
    - Necesita el plugin de OpenClaw que gestiona el entorno de ejecución node-llama-cpp
sidebarTitle: llama.cpp Provider
summary: Ejecuta inferencia de texto GGUF local y embeddings de memoria en OpenClaw con llama.cpp
title: Proveedor de llama.cpp
x-i18n:
    generated_at: "2026-07-22T10:39:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 88e6d66943adcbc602421b8cc00359b3ed87357194c3ffaa845c1db7fbcd9c38
    source_path: plugins/llama-cpp.md
    workflow: 16
---

`llama-cpp` es el plugin oficial de proveedor externo para la inferencia local en proceso de texto y embeddings con GGUF. Registra el proveedor de texto `llama-cpp`, el proveedor de embeddings `local` y es responsable del entorno de ejecución nativo `node-llama-cpp`.

Instálelo antes de usar la inferencia local o los embeddings de memoria locales:

```bash
openclaw plugins install @openclaw/llama-cpp-provider
```

El paquete npm principal `openclaw` no incluye `node-llama-cpp`. Mantener la dependencia nativa en este plugin evita que las actualizaciones normales de OpenClaw mediante npm eliminen un entorno de ejecución instalado manualmente dentro del directorio del paquete de OpenClaw.

## Inferencia local de texto

Elija **Modelo local (llama.cpp)** durante la incorporación interactiva. OpenClaw solicita confirmación antes de descargar el modelo predeterminado:

`hf:bartowski/Qwen_Qwen3-4B-Instruct-2507-GGUF/Qwen_Qwen3-4B-Instruct-2507-Q4_K_M.gguf`

El archivo Qwen3 4B Instruct 2507 Q4_K_M ocupa aproximadamente 2,5 GB. Reserve unos 3 GB de RAM para los pesos del modelo, además del contexto y la sobrecarga del entorno de ejecución de OpenClaw. El tamaño del contexto predeterminado se ajusta automáticamente con un límite de 8.192 tokens para que siga siendo práctico en equipos con 8 GB. Configure un contexto mayor solo cuando el equipo tenga suficiente memoria.

La comprobación de detección durante la incorporación es de solo lectura. Ofrece llama.cpp automáticamente solo cuando el archivo GGUF predeterminado o configurado ya está en la caché de modelos; nunca realiza descargas durante la detección. Ollama y LM Studio siguen siendo opciones independientes de servicios locales y conservan sus propios flujos de detección. Elegir manualmente llama.cpp es la vía que solicita descargar el modelo predeterminado.

El proveedor utiliza la plantilla de chat integrada en el modelo GGUF y las llamadas a funciones nativas de node-llama-cpp. El texto se transmite token por token. Las llamadas a herramientas se devuelven a OpenClaw para su ejecución, en lugar de ejecutarse dentro de node-llama-cpp.

### Usar otro modelo GGUF

Añada un modelo a `models.providers.llama-cpp`. Introduzca una ruta local o el URI completo del archivo `hf:` en `params.modelPath`:

```json5
{
  models: {
    mode: "merge",
    providers: {
      "llama-cpp": {
        baseUrl: "local://llama-cpp",
        api: "openai-completions",
        params: {
          modelCacheDir: "~/.node-llama-cpp/models",
        },
        models: [
          {
            id: "my-local-model",
            name: "My local GGUF",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 8192,
            maxTokens: 2048,
            params: {
              modelPath: "~/Models/my-model.Q4_K_M.gguf",
              contextSize: 8192,
            },
            compat: { supportsTools: true },
          },
        ],
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "llama-cpp/my-local-model" },
    },
  },
}
```

La inferencia nunca descarga implícitamente un modelo que falte. Para un URI `hf:` personalizado, descargue primero el archivo GGUF en `modelCacheDir`. La detección utiliza el resolutor de caché de solo lectura propio de node-llama-cpp, incluidos los nombres del repositorio, la rama y los archivos divididos.

## Configuración de embeddings de memoria

Establezca `memory.search.provider` en `local`:

```json5
{
  memory: {
    search: {
      provider: "local",
      local: {
        modelPath: "hf:ggml-org/embeddinggemma-300m-qat-q8_0-GGUF/embeddinggemma-300m-qat-Q8_0.gguf",
      },
    },
  },
}
```

El valor predeterminado de `local.modelPath` es el URI `hf:` mostrado anteriormente (`embeddinggemma-300m-qat-Q8_0.gguf`). Apúntelo a otro URI `hf:` o a un archivo local `.gguf` para usar otro modelo. `local.modelCacheDir` reemplaza la ubicación donde se almacenan en caché los modelos descargados (valor predeterminado: `~/.node-llama-cpp/models`), y `local.contextSize` acepta un entero o `"auto"`.

Cuando `local.contextSize` es numérico, el proveedor también comunica ese requisito a la asignación automática de capas de GPU de node-llama-cpp. Esto permite que node-llama-cpp ajuste conjuntamente el modelo y el contexto de embeddings sin dejar de aplicar sus comprobaciones de seguridad de memoria. Con `"auto"`, node-llama-cpp mantiene su asignación automática habitual.

## Entorno de ejecución nativo

Use Node 24 para que la instalación nativa sea lo más sencilla posible. Los repositorios de código fuente que utilizan pnpm pueden requerir aprobar y recompilar la dependencia nativa:

```bash
pnpm approve-builds
pnpm rebuild node-llama-cpp
```

## Diagnósticos del entorno de ejecución de memoria

Ejecute `openclaw memory status --deep` después de que se haya cargado el proveedor para consultar el backend y la compilación seleccionados, los nombres de los dispositivos, las capas transferidas a la GPU, el tamaño de contexto solicitado y la última instantánea observada de VRAM o memoria unificada. Los valores de VRAM incluyen una marca de tiempo de observación porque las lecturas pasivas de estado no vuelven a cargar el modelo ni consultan el dispositivo.

Los mismos datos conocidos más recientes pueden aparecer en `openclaw doctor` cuando el Gateway en ejecución ya ha utilizado el proveedor local. Un comando normal de estado o doctor no carga un modelo únicamente para recopilar diagnósticos.

## Solución de problemas

Si falta `node-llama-cpp` o no se puede cargar, OpenClaw informa del fallo con:

1. Instale el plugin: `openclaw plugins install @openclaw/llama-cpp-provider`.
2. Use Node 24 para las instalaciones o actualizaciones nativas.
3. Desde un repositorio de código fuente con pnpm: `pnpm approve-builds` y, después, `pnpm rebuild node-llama-cpp`.

Para la inferencia local sin una dependencia nativa en proceso, utilice en su lugar el proveedor de Ollama o LM Studio. Para usar embeddings locales con menos complicaciones, establezca `memory.search.provider` en un proveedor remoto de embeddings, como `lmstudio`, `ollama`, `openai` o `voyage`.
