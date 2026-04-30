---
read_when:
    - Quieres entender el backend de memoria predeterminado
    - Desea configurar proveedores de embeddings o búsqueda híbrida
summary: El backend de memoria predeterminado basado en SQLite con búsqueda por palabras clave, vectorial e híbrida
title: Motor de memoria integrado
x-i18n:
    generated_at: "2026-04-30T05:37:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: aa1597a9a49a6f1124cedf49f6f5a4c336f76dd5998ced246affb9c2e8171f05
    source_path: concepts/memory-builtin.md
    workflow: 16
---

El motor integrado es el backend de memoria predeterminado. Almacena tu índice de memoria en
una base de datos SQLite por agente y no necesita dependencias adicionales para empezar.

## Qué proporciona

- **Búsqueda por palabras clave** mediante indexación de texto completo FTS5 (puntuación BM25).
- **Búsqueda vectorial** mediante embeddings de cualquier proveedor compatible.
- **Búsqueda híbrida** que combina ambas para obtener los mejores resultados.
- **Compatibilidad con CJK** mediante tokenización por trigramas para chino, japonés y coreano.
- **Aceleración sqlite-vec** para consultas vectoriales dentro de la base de datos (opcional).

## Primeros pasos

Si tienes una clave de API para OpenAI, Gemini, Voyage, Mistral o DeepInfra, el motor
integrado la detecta automáticamente y habilita la búsqueda vectorial. No se necesita configuración.

Para definir un proveedor explícitamente:

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

Para forzar el proveedor de embeddings local integrado, instala el paquete de runtime opcional
`node-llama-cpp` junto a OpenClaw y luego apunta `local.modelPath`
a un archivo GGUF:

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

| Proveedor | ID          | Detectado automáticamente | Notas                                      |
| --------- | ----------- | ------------------------- | ------------------------------------------ |
| OpenAI    | `openai`    | Sí                        | Predeterminado: `text-embedding-3-small`   |
| Gemini    | `gemini`    | Sí                        | Admite multimodal (imagen + audio)         |
| Voyage    | `voyage`    | Sí                        |                                            |
| Mistral   | `mistral`   | Sí                        |                                            |
| DeepInfra | `deepinfra` | Sí                        | Predeterminado: `BAAI/bge-m3`              |
| Ollama    | `ollama`    | No                        | Local, definir explícitamente              |
| Local     | `local`     | Sí (primero)              | Runtime opcional `node-llama-cpp`          |

La detección automática elige el primer proveedor cuya clave de API pueda resolverse, en el
orden mostrado. Define `memorySearch.provider` para sobrescribirlo.

## Cómo funciona la indexación

OpenClaw indexa `MEMORY.md` y `memory/*.md` en fragmentos (~400 tokens con
superposición de 80 tokens) y los almacena en una base de datos SQLite por agente.

- **Ubicación del índice:** `~/.openclaw/memory/<agentId>.sqlite`
- **Mantenimiento del almacenamiento:** los archivos auxiliares WAL de SQLite se acotan con checkpoints periódicos y
  al apagar.
- **Vigilancia de archivos:** los cambios en los archivos de memoria activan una reindexación con debounce (1,5 s).
- **Reindexación automática:** cuando cambia el proveedor de embeddings, el modelo o la configuración de fragmentación,
  todo el índice se reconstruye automáticamente.
- **Reindexación bajo demanda:** `openclaw memory index --force`

<Info>
También puedes indexar archivos Markdown fuera del workspace con
`memorySearch.extraPaths`. Consulta la
[referencia de configuración](/es/reference/memory-config#additional-memory-paths).
</Info>

## Cuándo usarlo

El motor integrado es la opción adecuada para la mayoría de usuarios:

- Funciona directamente sin dependencias adicionales.
- Gestiona bien la búsqueda por palabras clave y vectorial.
- Admite todos los proveedores de embeddings.
- La búsqueda híbrida combina lo mejor de ambos enfoques de recuperación.

Considera cambiar a [QMD](/es/concepts/memory-qmd) si necesitas reranking, expansión de consultas
o quieres indexar directorios fuera del workspace.

Considera [Honcho](/es/concepts/memory-honcho) si quieres memoria entre sesiones con
modelado automático de usuarios.

## Solución de problemas

**¿Búsqueda de memoria deshabilitada?** Comprueba `openclaw memory status`. Si no se
detecta ningún proveedor, define uno explícitamente o añade una clave de API.

**¿Proveedor local no detectado?** Confirma que la ruta local existe y ejecuta:

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

Tanto los comandos CLI independientes como el Gateway usan el mismo id de proveedor `local`.
Si el proveedor está definido como `auto`, los embeddings locales se consideran primero solo
cuando `memorySearch.local.modelPath` apunta a un archivo local existente.

**¿Resultados obsoletos?** Ejecuta `openclaw memory index --force` para reconstruir. El vigilante
puede perder cambios en casos excepcionales.

**¿sqlite-vec no se carga?** OpenClaw recurre automáticamente a similitud coseno en proceso.
Consulta los registros para ver el error de carga específico.

## Configuración

Para configurar el proveedor de embeddings, ajustar la búsqueda híbrida (pesos, MMR, decaimiento
temporal), indexación por lotes, memoria multimodal, sqlite-vec, rutas adicionales y todos
los demás controles de configuración, consulta la
[referencia de configuración de memoria](/es/reference/memory-config).

## Relacionado

- [Resumen de memoria](/es/concepts/memory)
- [Búsqueda de memoria](/es/concepts/memory-search)
- [Active Memory](/es/concepts/active-memory)
