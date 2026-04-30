---
read_when:
    - Quieres entender cómo funciona memory_search
    - Desea elegir un proveedor de embeddings
    - Quieres ajustar la calidad de la búsqueda
summary: Cómo la búsqueda en memoria encuentra notas relevantes mediante incrustaciones vectoriales y recuperación híbrida
title: Búsqueda de memoria
x-i18n:
    generated_at: "2026-04-30T16:27:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7f40bbe32453a28070ffc67f19a4c06e2fe59a24237a2aef353f4b9b8260bcf2
    source_path: concepts/memory-search.md
    workflow: 16
---

`memory_search` encuentra notas relevantes en tus archivos de memoria, incluso cuando la
redacción difiere del texto original. Funciona indexando la memoria en pequeños
fragmentos y buscándolos mediante embeddings, palabras clave o ambos.

## Inicio rápido

Si tienes una suscripción de GitHub Copilot, o una clave de API de OpenAI,
Gemini, Voyage o Mistral configurada, la búsqueda de memoria funciona
automáticamente. Para establecer un proveedor explícitamente:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai", // or "gemini", "local", "ollama", etc.
      },
    },
  },
}
```

Para configuraciones con varios endpoints, `provider` también puede ser una
entrada personalizada de `models.providers.<id>`, como `ollama-5080`, cuando ese
proveedor establece `api: "ollama"` u otro propietario de adaptador de embeddings.

Para embeddings locales sin clave de API, establece `provider: "local"`. Las
instalaciones empaquetadas conservan el runtime nativo de `node-llama-cpp` en el
árbol gestionado de dependencias de runtime de Plugin de OpenClaw; ejecuta
`openclaw doctor --fix` si ese árbol necesita reparación.

Algunos endpoints de embeddings compatibles con OpenAI requieren etiquetas
asimétricas como `input_type: "query"` para búsquedas y
`input_type: "document"` o `"passage"` para fragmentos indexados. Configúralas
con `memorySearch.queryInputType` y `memorySearch.documentInputType`; consulta la
[referencia de configuración de memoria](/es/reference/memory-config#provider-specific-config).

## Proveedores compatibles

| Proveedor      | ID               | Requiere clave de API | Notas                                                   |
| -------------- | ---------------- | --------------------- | ------------------------------------------------------- |
| Bedrock        | `bedrock`        | No                    | Se detecta automáticamente cuando la cadena de credenciales de AWS se resuelve |
| Gemini         | `gemini`         | Sí                    | Admite indexación de imágenes/audio                     |
| GitHub Copilot | `github-copilot` | No                    | Se detecta automáticamente, usa la suscripción de Copilot |
| Local          | `local`          | No                    | Modelo GGUF, descarga de ~0,6 GB                        |
| Mistral        | `mistral`        | Sí                    | Se detecta automáticamente                              |
| Ollama         | `ollama`         | No                    | Local, debe establecerse explícitamente                 |
| OpenAI         | `openai`         | Sí                    | Se detecta automáticamente, rápido                      |
| Voyage         | `voyage`         | Sí                    | Se detecta automáticamente                              |

## Cómo funciona la búsqueda

OpenClaw ejecuta dos rutas de recuperación en paralelo y combina los resultados:

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

- **Búsqueda vectorial** encuentra notas con significado similar ("gateway host"
  coincide con "la máquina que ejecuta OpenClaw").
- **Búsqueda por palabras clave BM25** encuentra coincidencias exactas (ID,
  cadenas de error, claves de configuración).

Si solo una ruta está disponible (sin embeddings o sin FTS), la otra se ejecuta
por sí sola.

Cuando los embeddings no están disponibles, OpenClaw sigue usando clasificación
léxica sobre los resultados de FTS en lugar de recurrir únicamente al orden bruto
de coincidencias exactas. Ese modo degradado potencia los fragmentos con mayor
cobertura de términos de consulta y rutas de archivo relevantes, lo que mantiene
útil la recuperación incluso sin `sqlite-vec` o un proveedor de embeddings.

## Mejorar la calidad de búsqueda

Dos funciones opcionales ayudan cuando tienes un historial de notas grande:

### Decaimiento temporal

Las notas antiguas pierden peso de clasificación gradualmente para que la
información reciente aparezca primero. Con la semivida predeterminada de 30 días,
una nota del mes pasado puntúa al 50 % de su peso original. Los archivos
permanentes como `MEMORY.md` nunca decaen.

<Tip>
Activa el decaimiento temporal si tu agente tiene meses de notas diarias y la
información obsoleta sigue superando al contexto reciente.
</Tip>

### MMR (diversidad)

Reduce resultados redundantes. Si cinco notas mencionan todas la misma
configuración del router, MMR garantiza que los resultados principales cubran
temas diferentes en lugar de repetirse.

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
Markdown. Las consultas de búsqueda siguen siendo texto, pero coinciden con
contenido visual y de audio. Consulta la
[referencia de configuración de memoria](/es/reference/memory-config) para la
configuración.

## Búsqueda en memoria de sesión

Opcionalmente puedes indexar transcripciones de sesión para que `memory_search`
pueda recordar conversaciones anteriores. Esto se habilita de forma explícita
mediante `memorySearch.experimental.sessionMemory`. Consulta la
[referencia de configuración](/es/reference/memory-config) para obtener detalles.

## Solución de problemas

**¿Sin resultados?** Ejecuta `openclaw memory status` para comprobar el índice.
Si está vacío, ejecuta `openclaw memory index --force`.

**¿Solo coincidencias de palabras clave?** Es posible que tu proveedor de
embeddings no esté configurado. Comprueba `openclaw memory status --deep`.

**¿Los embeddings locales agotan el tiempo de espera?** `ollama`, `lmstudio` y
`local` usan de forma predeterminada un tiempo de espera por lotes en línea más
largo. Si el host simplemente es lento, establece
`agents.defaults.memorySearch.sync.embeddingBatchTimeoutSeconds` y vuelve a
ejecutar `openclaw memory index --force`.

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
