---
read_when:
    - Quieres entender el backend de memoria predeterminado
    - Quieres configurar proveedores de embeddings o búsqueda híbrida
summary: El backend de memoria predeterminado basado en SQLite con búsqueda por palabras clave, vectorial e híbrida
title: Motor de memoria integrado
x-i18n:
    generated_at: "2026-07-05T11:14:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8cbe2bae73b1d393ac158edb67fc442e76d1e5ff93e5201dbb7e7216801aa85
    source_path: concepts/memory-builtin.md
    workflow: 16
---

El motor integrado es el backend de memoria predeterminado. Almacena tu índice de memoria
en una base de datos SQLite por agente y no necesita dependencias adicionales para
empezar.

## Qué proporciona

- **Búsqueda por palabras clave** mediante indexación de texto completo FTS5 (puntuación BM25).
- **Búsqueda vectorial** mediante embeddings de cualquier proveedor compatible.
- **Búsqueda híbrida** que combina ambas para obtener los mejores resultados.
- **Compatibilidad con CJK** mediante tokenización por trigramas para chino, japonés y coreano.
- **Aceleración sqlite-vec** para consultas vectoriales dentro de la base de datos (opcional).

## Primeros pasos

De forma predeterminada, el motor integrado usa embeddings de OpenAI. Si `OPENAI_API_KEY` o
`models.providers.openai.apiKey` ya está configurado, la búsqueda vectorial funciona
sin configuración de memoria adicional.

Para configurar un proveedor explícitamente:

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

Para forzar embeddings GGUF locales, instala el plugin proveedor oficial de llama.cpp
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
| GitHub Copilot    | `github-copilot`    | Usa tu suscripción a Copilot               |
| LM Studio         | `lmstudio`          | Local/autohospedado                        |
| Local             | `local`             | `@openclaw/llama-cpp-provider`             |
| Mistral           | `mistral`           |                                            |
| Ollama            | `ollama`            | Local/autohospedado                        |
| OpenAI            | `openai`            | Predeterminado: `text-embedding-3-small`   |
| Compatible con OpenAI | `openai-compatible` | Endpoint genérico `/v1/embeddings`     |
| Voyage            | `voyage`            |                                            |

Configura `memorySearch.provider` para dejar de usar OpenAI.

## Cómo funciona la indexación

OpenClaw indexa `MEMORY.md` y `memory/*.md` en fragmentos (400 tokens con
solapamiento de 80 tokens de forma predeterminada) y los almacena en una base de datos SQLite por agente.

- **Ubicación del índice:** la base de datos del agente propietario en
  `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- **Mantenimiento del almacenamiento:** los sidecars WAL de SQLite se acotan con checkpoints periódicos y
  al apagar.
- **Observación de archivos:** los cambios en los archivos de memoria activan una reindexación con antirrebote
  (1,5 s de forma predeterminada).
- **Reindexación automática:** el índice se reconstruye automáticamente cuando cambian el proveedor de embeddings,
  el modelo, la configuración de fragmentación, las fuentes configuradas o el ámbito.
- **Reindexación bajo demanda:** `openclaw memory index --force`

<Info>
También puedes indexar archivos Markdown fuera del espacio de trabajo con
`memorySearch.extraPaths`. Consulta la
[referencia de configuración](/es/reference/memory-config#additional-memory-paths).
</Info>

## Cuándo usarlo

El motor integrado es la opción adecuada para la mayoría de los usuarios:

- Funciona de inmediato, sin dependencias adicionales.
- Gestiona bien la búsqueda por palabras clave y vectorial.
- Admite todos los proveedores de embeddings.
- La búsqueda híbrida combina lo mejor de ambos enfoques de recuperación.

Considera cambiar a [QMD](/es/concepts/memory-qmd) si necesitas reranking, expansión de consultas
o quieres indexar directorios fuera del espacio de trabajo.

Considera [Honcho](/es/concepts/memory-honcho) si quieres memoria entre sesiones
con modelado automático de usuario.

## Solución de problemas

**¿Búsqueda de memoria deshabilitada?** Comprueba `openclaw memory status`. Si no se
detecta ningún proveedor, configura uno explícitamente o añade una clave de API.

**¿Proveedor local no detectado?** Confirma que la ruta local existe y ejecuta:

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

Tanto los comandos CLI independientes como el Gateway usan el mismo id de proveedor `local`.
Configura `memorySearch.provider: "local"` cuando quieras embeddings locales.

**¿Resultados obsoletos?** Ejecuta `openclaw memory index --force` para reconstruir. El observador
puede omitir cambios en casos extremos poco frecuentes.

**¿sqlite-vec no se carga?** OpenClaw recurre automáticamente a la similitud coseno
en proceso. `openclaw memory status --deep` informa del almacén vectorial local
por separado del proveedor de embeddings, por lo que `Vector store:
unavailable` apunta a la carga de sqlite-vec, mientras que `Embeddings: unavailable`
apunta a la preparación del proveedor/autenticación o del modelo. Revisa los registros para ver el error de carga
específico.

## Configuración

Para configurar proveedores de embeddings, ajustar la búsqueda híbrida (pesos, MMR, decaimiento
temporal), indexación por lotes, memoria multimodal, sqlite-vec, rutas adicionales y todas
las demás opciones de configuración, consulta la
[referencia de configuración de memoria](/es/reference/memory-config).

## Relacionado

- [Descripción general de la memoria](/es/concepts/memory)
- [Búsqueda de memoria](/es/concepts/memory-search)
- [Active Memory](/es/concepts/active-memory)
