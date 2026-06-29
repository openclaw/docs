---
read_when:
    - Quieres entender cómo funciona memory_search
    - Quieres elegir un proveedor de embeddings
    - Quieres ajustar la calidad de búsqueda
summary: Cómo la búsqueda en memoria encuentra notas relevantes usando embeddings y recuperación híbrida
title: Búsqueda en memoria
x-i18n:
    generated_at: "2026-06-28T22:33:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 32ffb9d996851566eb92b7812c5425f545ecbb5387a0a445686df35a6c8ae143
    source_path: concepts/memory-search.md
    workflow: 16
---

`memory_search` encuentra notas relevantes en tus archivos de memoria, incluso cuando la
redacción difiere del texto original. Funciona indexando la memoria en pequeños
fragmentos y buscándolos mediante embeddings, palabras clave o ambas cosas.

## Inicio rápido

La búsqueda de memoria usa embeddings de OpenAI de forma predeterminada. Para usar otro backend
de embeddings, establece un proveedor explícitamente:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai", // or "gemini", "local", "ollama", "openai-compatible", etc.
      },
    },
  },
}
```

Para configuraciones con varios endpoints y proveedores específicos de memoria, `provider` también puede
ser una entrada personalizada `models.providers.<id>`, como `ollama-5080`, cuando ese
proveedor establece `api: "ollama"` u otro propietario de adaptador de embeddings de memoria.

Para embeddings locales sin clave de API, instala
`@openclaw/llama-cpp-provider` y establece `provider: "local"`. Los checkouts de código fuente
aún pueden requerir aprobación de compilación nativa: `pnpm approve-builds` y luego
`pnpm rebuild node-llama-cpp`.

Algunos endpoints de embeddings compatibles con OpenAI requieren etiquetas asimétricas como
`input_type: "query"` para búsquedas y `input_type: "document"` o `"passage"`
para fragmentos indexados. Configúralas con `memorySearch.queryInputType` y
`memorySearch.documentInputType`; consulta la [referencia de configuración de memoria](/es/reference/memory-config#provider-specific-config).

## Proveedores compatibles

| Proveedor         | ID                  | Necesita clave de API | Notas                                  |
| ----------------- | ------------------- | --------------------- | -------------------------------------- |
| Bedrock           | `bedrock`           | No                    | Usa la cadena de credenciales de AWS   |
| DeepInfra         | `deepinfra`         | Sí                    | Predeterminado: `BAAI/bge-m3`          |
| Gemini            | `gemini`            | Sí                    | Admite indexación de imágenes/audio    |
| GitHub Copilot    | `github-copilot`    | No                    | Usa la suscripción de Copilot          |
| Local             | `local`             | No                    | Modelo GGUF, descarga de ~0,6 GB       |
| Mistral           | `mistral`           | Sí                    |                                        |
| Ollama            | `ollama`            | No                    | Local/autohospedado                    |
| OpenAI            | `openai`            | Sí                    | Predeterminado                         |
| OpenAI-compatible | `openai-compatible` | Normalmente           | `/v1/embeddings` genérico              |
| Voyage            | `voyage`            | Sí                    |                                        |

## Cómo funciona la búsqueda

OpenClaw ejecuta dos rutas de recuperación en paralelo y fusiona los resultados:

```mermaid
flowchart LR
    Q["Query"] --> E["Embedding"]
    Q --> T["Tokenize"]
    E --> VS["Vector Search"]
    T --> BM["BM25 Search"]
    VS --> M["Weighted Merge"]
    BM --> M
    M --> R["Top Results"]
```

- **Búsqueda vectorial** encuentra notas con significado similar ("gateway host" coincide con
  "the machine running OpenClaw").
- **Búsqueda de palabras clave BM25** encuentra coincidencias exactas (ID, cadenas de error, claves de
  configuración).

Si solo hay una ruta disponible, la otra se ejecuta sola. El modo intencional solo FTS
(`provider: "none"`) y la selección automática/predeterminada del proveedor aún pueden usar
clasificación léxica cuando los embeddings no están disponibles.

Los proveedores explícitos de embeddings no locales son diferentes. Si estableces
`memorySearch.provider` en un proveedor concreto respaldado por remoto y ese proveedor
no está disponible en tiempo de ejecución, `memory_search` informa que la memoria no está disponible en lugar
de usar silenciosamente resultados solo FTS. Esto mantiene visible un proveedor semántico
configurado que está roto. Establece `provider: "none"` para recuperación deliberada solo FTS, o corrige
la configuración del proveedor/autenticación para restaurar la clasificación semántica.

## Mejorar la calidad de búsqueda

Dos funciones opcionales ayudan cuando tienes un historial grande de notas:

### Decaimiento temporal

Las notas antiguas pierden gradualmente peso en la clasificación para que la información reciente aparezca primero.
Con la semivida predeterminada de 30 días, una nota del mes pasado puntúa al 50 % de
su peso original. Los archivos permanentes como `MEMORY.md` nunca decaen.

<Tip>
Activa el decaimiento temporal si tu agente tiene meses de notas diarias y la
información obsoleta sigue superando al contexto reciente.
</Tip>

### MMR (diversidad)

Reduce los resultados redundantes. Si cinco notas mencionan todas la misma configuración de router, MMR
asegura que los resultados principales cubran temas distintos en lugar de repetirse.

<Tip>
Activa MMR si `memory_search` sigue devolviendo fragmentos casi duplicados de
diferentes notas diarias.
</Tip>

### Activar ambos

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        query: {
          hybrid: {
            mmr: { enabled: true },
            temporalDecay: { enabled: true },
          },
        },
      },
    },
  },
}
```

## Memoria multimodal

Con Gemini Embedding 2, puedes indexar imágenes y archivos de audio junto con
Markdown. Las consultas de búsqueda siguen siendo texto, pero coinciden con contenido visual y de audio.
Consulta la [referencia de configuración de memoria](/es/reference/memory-config) para la
configuración.

## Búsqueda de memoria de sesión

Opcionalmente, puedes indexar transcripciones de sesión para que `memory_search` pueda recordar
conversaciones anteriores. Esto es opcional mediante
`memorySearch.experimental.sessionMemory` y `sources: ["sessions"]`; la lista de fuentes predeterminada
solo incluye memoria. La bandera experimental habilita la indexación de transcripciones de sesión,
mientras que `sources` controla si se buscan fragmentos de sesión.

Las coincidencias de sesión obedecen `tools.sessions.visibility`: la configuración predeterminada `tree` solo
expone la sesión actual y las sesiones que generó. Para recordar una sesión no relacionada
del mismo agente despachada por Gateway desde una sesión de DM separada, amplía
intencionalmente la visibilidad a `agent`.

Al usar QMD, también establece `memory.qmd.sessions.enabled: true` para que las transcripciones se
exporten a una colección QMD. Consulta la
[referencia de configuración](/es/reference/memory-config) para obtener detalles.

## Solución de problemas

**¿Sin resultados?** Ejecuta `openclaw memory status` para comprobar el índice. Si está vacío, ejecuta
`openclaw memory index --force`.

**¿Solo coincidencias de palabras clave?** Puede que tu proveedor de embeddings no esté configurado. Comprueba
`openclaw memory status --deep`.

**¿Los embeddings locales agotan el tiempo de espera?** `ollama`, `lmstudio` y `local` usan un tiempo de espera de lote
en línea más largo de forma predeterminada. Si el host simplemente es lento, establece
`agents.defaults.memorySearch.sync.embeddingBatchTimeoutSeconds` y vuelve a ejecutar
`openclaw memory index --force`.

**¿No se encuentra texto CJK?** Reconstruye el índice FTS con
`openclaw memory index --force`.

## Lecturas adicionales

- [Active Memory](/es/concepts/active-memory) -- memoria de subagente para sesiones de chat interactivas
- [Memoria](/es/concepts/memory) -- disposición de archivos, backends, herramientas
- [Referencia de configuración de memoria](/es/reference/memory-config) -- todos los controles de configuración

## Relacionado

- [Resumen de memoria](/es/concepts/memory)
- [Active Memory](/es/concepts/active-memory)
- [Motor de memoria integrado](/es/concepts/memory-builtin)
