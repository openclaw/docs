---
read_when:
    - Quiere comprender el backend de memoria predeterminado
    - Quieres configurar proveedores de embeddings o la búsqueda híbrida
summary: El backend de memoria predeterminado basado en SQLite con búsqueda por palabras clave, vectorial e híbrida
title: Motor de memoria integrado
x-i18n:
    generated_at: "2026-07-22T10:31:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c3efb6f1449d9b55717b3c117444ba7d4519d0111b842b48790ad85551511433
    source_path: concepts/memory-builtin.md
    workflow: 16
---

El motor integrado es el backend de memoria predeterminado. Almacena el índice de memoria
en una base de datos SQLite por agente y no necesita dependencias adicionales para
empezar.

## Qué proporciona

- **Búsqueda por palabras clave** mediante indexación de texto completo FTS5 (puntuación BM25).
- **Búsqueda vectorial** mediante embeddings de cualquier proveedor compatible.
- **Búsqueda híbrida** que combina ambas para obtener los mejores resultados.
- **Compatibilidad con CJK** mediante tokenización por trigramas para chino, japonés y coreano.
- **Aceleración con sqlite-vec** para consultas vectoriales dentro de la base de datos (opcional).

## Primeros pasos

De forma predeterminada, el motor integrado utiliza embeddings de OpenAI. Si `OPENAI_API_KEY` o
`models.providers.openai.apiKey` ya está configurado, la búsqueda vectorial funciona
sin ninguna configuración adicional de memoria.

Para establecer un proveedor explícitamente:

```json5
{
  memory: {
    search: {
      provider: "openai",
    },
  },
}
```

Sin un proveedor de embeddings, solo está disponible la búsqueda por palabras clave.

Para forzar el uso de embeddings GGUF locales, instale el plugin oficial del proveedor llama.cpp
y, después, haga que `local.modelPath` apunte a un archivo GGUF:

```bash
openclaw plugins install @openclaw/llama-cpp-provider
```

```json5
{
  memory: {
    search: {
      provider: "local",
      fallback: "none",
      local: {
        modelPath: "~/.node-llama-cpp/models/embeddinggemma-300m-qat-Q8_0.gguf",
      },
    },
  },
}
```

## Proveedores de embeddings compatibles

| Proveedor         | ID                  | Notas                                      |
| ----------------- | ------------------- | ------------------------------------------ |
| Bedrock           | `bedrock`           | Utiliza la cadena de credenciales de AWS   |
| DeepInfra         | `deepinfra`         | Predeterminado: `BAAI/bge-m3`              |
| Gemini            | `gemini`            | Admite contenido multimodal (imagen + audio) |
| GitHub Copilot    | `github-copilot`    | Utiliza su suscripción a Copilot           |
| LM Studio         | `lmstudio`          | Local/alojado por el usuario               |
| Local             | `local`             | `@openclaw/llama-cpp-provider`      |
| Mistral           | `mistral`           |                                            |
| Ollama            | `ollama`            | Local/alojado por el usuario               |
| OpenAI            | `openai`            | Predeterminado: `text-embedding-3-small`   |
| Compatible con OpenAI | `openai-compatible` | Endpoint genérico `/v1/embeddings`   |
| Voyage            | `voyage`            |                                            |

Establezca `memory.search.provider` para dejar de usar OpenAI.

## Cómo funciona la indexación

OpenClaw divide `MEMORY.md` y `memory/*.md` en fragmentos (400 tokens con
un solapamiento de 80 tokens de forma predeterminada) y los almacena en una base de datos SQLite por agente.

- **Ubicación del índice:** la base de datos del agente propietario en
  `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- **Mantenimiento del almacenamiento:** los archivos auxiliares WAL de SQLite se mantienen acotados mediante puntos de control periódicos y
  al apagar.
- **Supervisión de archivos:** los cambios en los archivos de memoria activan una reindexación con antirrebote
  (1,5 s de forma predeterminada).
- **Reindexación automática:** el índice se reconstruye automáticamente cuando cambia el proveedor de
  embeddings, el modelo, la configuración de fragmentación, las fuentes configuradas o el ámbito.
- **Reindexación bajo demanda:** `openclaw memory index --force`

<Info>
También se pueden indexar archivos Markdown externos al espacio de trabajo con
`memory.search.extraPaths`. Consulte la
[referencia de configuración](/es/reference/memory-config#additional-memory-paths).
</Info>

## Cuándo utilizarlo

El motor integrado es la opción adecuada para la mayoría de los usuarios:

- Funciona directamente sin dependencias adicionales.
- Gestiona bien las búsquedas por palabras clave y vectoriales.
- Es compatible con todos los proveedores de embeddings.
- La búsqueda híbrida combina lo mejor de ambos enfoques de recuperación.

Considere cambiar a [QMD](/es/concepts/memory-qmd) si necesita reclasificación, expansión de
consultas o desea indexar directorios externos al espacio de trabajo.

Considere [Honcho](/es/concepts/memory-honcho) si desea memoria entre sesiones
con modelado automático del usuario.

## Solución de problemas

**¿La búsqueda en memoria está desactivada?** Compruebe `openclaw memory status`. Si no se
detecta ningún proveedor, establezca uno explícitamente o añada una clave de API.

**¿No se detecta el proveedor local?** Confirme que la ruta local existe y ejecute:

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

Tanto los comandos independientes de la CLI como el Gateway utilizan el mismo ID de proveedor `local`.
Establezca `memory.search.provider: "local"` cuando desee utilizar embeddings locales.

**¿Resultados obsoletos?** Ejecute `openclaw memory index --force` para reconstruir el índice. El supervisor
puede omitir cambios en casos extremos poco frecuentes.

**¿sqlite-vec no se carga?** OpenClaw recurre automáticamente a la similitud de coseno
dentro del proceso. `openclaw memory status --deep` informa por separado sobre el almacén
vectorial local y el proveedor de embeddings, por lo que `Vector store:
unavailable` apunta a la carga de sqlite-vec, mientras que `Embeddings: unavailable`
apunta a la disponibilidad del proveedor, la autenticación o el modelo. Consulte los registros para identificar el error
de carga específico.

## Configuración

Para configurar proveedores de embeddings, ajustar la búsqueda híbrida (ponderaciones, MMR, decaimiento
temporal), la indexación por lotes, la memoria multimodal, sqlite-vec, las rutas adicionales y todas
las demás opciones de configuración, consulte la
[referencia de configuración de memoria](/es/reference/memory-config).

## Contenido relacionado

- [Descripción general de la memoria](/es/concepts/memory)
- [Búsqueda en memoria](/es/concepts/memory-search)
- [Active Memory](/es/concepts/active-memory)
