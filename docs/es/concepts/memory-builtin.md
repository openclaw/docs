---
read_when:
    - Quieres entender el backend de memoria predeterminado
    - Quieres configurar proveedores de embeddings o búsqueda híbrida
summary: El backend de memoria predeterminado basado en SQLite con búsqueda por palabras clave, vectorial e híbrida
title: Motor de memoria integrado
x-i18n:
    generated_at: "2026-04-24T05:25:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: f82c1f4dc37b4fc6c075a7fcd2ec78bfcbfbebbcba7e48d366a1da3afcaff508
    source_path: concepts/memory-builtin.md
    workflow: 15
---

El motor integrado es el backend de memoria predeterminado. Almacena tu índice de memoria en
una base de datos SQLite por agente y no necesita dependencias adicionales para empezar.

## Qué ofrece

- **Búsqueda por palabras clave** mediante indexación de texto completo FTS5 (puntuación BM25).
- **Búsqueda vectorial** mediante embeddings de cualquier proveedor compatible.
- **Búsqueda híbrida** que combina ambas para obtener mejores resultados.
- **Compatibilidad con CJK** mediante tokenización trigram para chino, japonés y coreano.
- **Aceleración con sqlite-vec** para consultas vectoriales dentro de la base de datos (opcional).

## Primeros pasos

Si tienes una clave de API para OpenAI, Gemini, Voyage o Mistral, el motor integrado
la detecta automáticamente y habilita la búsqueda vectorial. No se necesita configuración.

Para establecer un proveedor explícitamente:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
      },
    },
  },
}
```

Sin un proveedor de embeddings, solo está disponible la búsqueda por palabras clave.

Para forzar el proveedor local integrado de embeddings, apunta `local.modelPath` a un
archivo GGUF:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "local",
        fallback: "none",
        local: {
          modelPath: "~/.node-llama-cpp/models/embeddinggemma-300m-qat-Q8_0.gguf",
        },
      },
    },
  },
}
```

## Proveedores de embeddings compatibles

| Proveedor | ID        | Detectado automáticamente | Notas                                  |
| --------- | --------- | ------------------------- | -------------------------------------- |
| OpenAI    | `openai`  | Sí                        | Predeterminado: `text-embedding-3-small` |
| Gemini    | `gemini`  | Sí                        | Admite multimodal (imagen + audio)     |
| Voyage    | `voyage`  | Sí                        |                                        |
| Mistral   | `mistral` | Sí                        |                                        |
| Ollama    | `ollama`  | No                        | Local, establécelo explícitamente      |
| Local     | `local`   | Sí (primero)              | Modelo GGUF, descarga de ~0,6 GB       |

La detección automática elige el primer proveedor cuya clave de API pueda resolverse, en el
orden mostrado. Establece `memorySearch.provider` para sobrescribirlo.

## Cómo funciona la indexación

OpenClaw indexa `MEMORY.md` y `memory/*.md` en fragmentos (~400 tokens con
superposición de 80 tokens) y los almacena en una base de datos SQLite por agente.

- **Ubicación del índice:** `~/.openclaw/memory/<agentId>.sqlite`
- **Vigilancia de archivos:** los cambios en archivos de memoria activan una reindexación con debounce (1,5 s).
- **Reindexación automática:** cuando cambian el proveedor de embeddings, el modelo o la configuración
  de fragmentación, todo el índice se reconstruye automáticamente.
- **Reindexar a demanda:** `openclaw memory index --force`

<Info>
También puedes indexar archivos Markdown fuera del espacio de trabajo con
`memorySearch.extraPaths`. Consulta la
[referencia de configuración](/es/reference/memory-config#additional-memory-paths).
</Info>

## Cuándo usarlo

El motor integrado es la opción adecuada para la mayoría de los usuarios:

- Funciona de inmediato sin dependencias adicionales.
- Gestiona bien la búsqueda por palabras clave y vectorial.
- Admite todos los proveedores de embeddings.
- La búsqueda híbrida combina lo mejor de ambos enfoques de recuperación.

Considera cambiar a [QMD](/es/concepts/memory-qmd) si necesitas reranking, expansión
de consultas o quieres indexar directorios fuera del espacio de trabajo.

Considera [Honcho](/es/concepts/memory-honcho) si quieres memoria entre sesiones con
modelado automático de usuarios.

## Solución de problemas

**¿Búsqueda en memoria deshabilitada?** Comprueba `openclaw memory status`. Si no se
detecta ningún proveedor, establece uno explícitamente o agrega una clave de API.

**¿No se detecta el proveedor local?** Confirma que la ruta local exista y ejecuta:

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

Tanto los comandos CLI independientes como el Gateway usan el mismo id de proveedor `local`.
Si el proveedor está establecido en `auto`, los embeddings locales se consideran primero solo
cuando `memorySearch.local.modelPath` apunta a un archivo local existente.

**¿Resultados obsoletos?** Ejecuta `openclaw memory index --force` para reconstruir. El watcher
puede perder cambios en casos extremos poco frecuentes.

**¿sqlite-vec no se carga?** OpenClaw recurre automáticamente a similitud coseno en proceso.
Consulta los registros para ver el error específico de carga.

## Configuración

Para la configuración de proveedores de embeddings, ajuste de búsqueda híbrida (pesos, MMR, decaimiento
temporal), indexación por lotes, memoria multimodal, sqlite-vec, rutas adicionales y todas
las demás opciones de configuración, consulta la
[referencia de configuración de memoria](/es/reference/memory-config).

## Relacionado

- [Resumen de memoria](/es/concepts/memory)
- [Búsqueda en memoria](/es/concepts/memory-search)
- [Active Memory](/es/concepts/active-memory)
