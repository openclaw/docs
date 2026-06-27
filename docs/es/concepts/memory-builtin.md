---
read_when:
    - Quieres entender el backend de memoria predeterminado
    - Quieres configurar proveedores de embeddings o búsqueda híbrida
summary: El backend de memoria predeterminado basado en SQLite con búsqueda por palabras clave, vectorial e híbrida
title: Motor de memoria integrado
x-i18n:
    generated_at: "2026-06-27T11:12:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a867bd295778f81109b258a63a35a1683d652d4564e44335053af4d86f90584e
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
- **Aceleración con sqlite-vec** para consultas vectoriales dentro de la base de datos (opcional).

## Primeros pasos

De forma predeterminada, el motor integrado usa embeddings de OpenAI. Si ya tienes
`OPENAI_API_KEY` o `models.providers.openai.apiKey` configurado, la búsqueda vectorial
funciona sin configuración de memoria adicional.

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

Para forzar embeddings GGUF locales, instala el Plugin oficial de proveedor llama.cpp,
y luego apunta `local.modelPath` a un archivo GGUF:

```bash
openclaw plugins install @openclaw/llama-cpp-provider
```

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

| Proveedor         | ID                  | Notas                                      |
| ----------------- | ------------------- | ------------------------------------------ |
| Bedrock           | `bedrock`           | Usa la cadena de credenciales de AWS       |
| DeepInfra         | `deepinfra`         | Predeterminado: `BAAI/bge-m3`              |
| Gemini            | `gemini`            | Admite multimodal (imagen + audio)         |
| GitHub Copilot    | `github-copilot`    | Usa la suscripción de Copilot              |
| Local             | `local`             | `@openclaw/llama-cpp-provider`             |
| Mistral           | `mistral`           |                                            |
| Ollama            | `ollama`            | Local/autohospedado                        |
| OpenAI            | `openai`            | Predeterminado: `text-embedding-3-small`   |
| Compatible con OpenAI | `openai-compatible` | Endpoint genérico `/v1/embeddings`       |
| Voyage            | `voyage`            |                                            |

Define `memorySearch.provider` para cambiar desde OpenAI.

## Cómo funciona la indexación

OpenClaw indexa `MEMORY.md` y `memory/*.md` en fragmentos (~400 tokens con
80 tokens de solapamiento) y los almacena en una base de datos SQLite por agente.

- **Ubicación del índice:** la base de datos del agente propietario en
  `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- **Mantenimiento de almacenamiento:** los sidecars WAL de SQLite se acotan con checkpoints periódicos y
  al apagar.
- **Vigilancia de archivos:** los cambios en archivos de memoria activan una reindexación con debounce (1,5 s).
- **Reindexación automática:** cuando cambia el proveedor de embeddings, el modelo o la configuración de fragmentación,
  todo el índice se reconstruye automáticamente.
- **Reindexación bajo demanda:** `openclaw memory index --force`

<Info>
También puedes indexar archivos Markdown fuera del espacio de trabajo con
`memorySearch.extraPaths`. Consulta la
[referencia de configuración](/es/reference/memory-config#additional-memory-paths).
</Info>

## Cuándo usarlo

El motor integrado es la opción adecuada para la mayoría de los usuarios:

- Funciona desde el primer momento sin dependencias adicionales.
- Maneja bien la búsqueda por palabras clave y vectorial.
- Admite todos los proveedores de embeddings.
- La búsqueda híbrida combina lo mejor de ambos enfoques de recuperación.

Considera cambiar a [QMD](/es/concepts/memory-qmd) si necesitas reranking, expansión de consultas
o quieres indexar directorios fuera del espacio de trabajo.

Considera [Honcho](/es/concepts/memory-honcho) si quieres memoria entre sesiones con
modelado automático del usuario.

## Solución de problemas

**¿La búsqueda de memoria está deshabilitada?** Revisa `openclaw memory status`. Si no se
detecta ningún proveedor, define uno explícitamente o añade una clave de API.

**¿No se detecta el proveedor local?** Confirma que la ruta local existe y ejecuta:

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

Tanto los comandos CLI independientes como el Gateway usan el mismo id de proveedor `local`.
Define `memorySearch.provider: "local"` cuando quieras embeddings locales.

**¿Resultados obsoletos?** Ejecuta `openclaw memory index --force` para reconstruir. El vigilante
puede perder cambios en casos límite poco frecuentes.

**¿sqlite-vec no se carga?** OpenClaw recurre automáticamente a la similitud coseno en proceso.
`openclaw memory status --deep` informa del almacén vectorial local
por separado del proveedor de embeddings, por lo que `Vector store: unavailable` apunta
a la carga de sqlite-vec, mientras que `Embeddings: unavailable` apunta al proveedor/autenticación
o a la preparación del modelo. Revisa los registros para ver el error de carga específico.

## Configuración

Para configurar el proveedor de embeddings, ajustar la búsqueda híbrida (pesos, MMR, decaimiento
temporal), indexación por lotes, memoria multimodal, sqlite-vec, rutas adicionales y todos
los demás controles de configuración, consulta la
[referencia de configuración de memoria](/es/reference/memory-config).

## Relacionado

- [Descripción general de la memoria](/es/concepts/memory)
- [Búsqueda de memoria](/es/concepts/memory-search)
- [Active Memory](/es/concepts/active-memory)
