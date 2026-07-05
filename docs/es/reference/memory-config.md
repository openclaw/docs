---
read_when:
    - Quieres configurar proveedores de búsqueda de memoria o modelos de embeddings
    - Quieres configurar el backend de QMD
    - Quieres ajustar la búsqueda híbrida, MMR o la atenuación temporal
    - Quieres habilitar la indexación de memoria multimodal
sidebarTitle: Memory config
summary: Todos los controles de configuración para búsqueda en memoria, proveedores de embeddings, QMD, búsqueda híbrida e indexación multimodal
title: Referencia de configuración de memoria
x-i18n:
    generated_at: "2026-07-05T11:40:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a31a8f3a77b994ca394612f39c2134527a4c7b25baec9ab280c6e3ee7ac0b0f1
    source_path: reference/memory-config.md
    workflow: 16
---

Esta página enumera cada ajuste de configuración para la búsqueda de memoria de OpenClaw. Para descripciones conceptuales, consulta:

<CardGroup cols={2}>
  <Card title="Descripción general de memoria" href="/es/concepts/memory">
    Cómo funciona la memoria.
  </Card>
  <Card title="Motor integrado" href="/es/concepts/memory-builtin">
    Backend SQLite predeterminado.
  </Card>
  <Card title="Motor QMD" href="/es/concepts/memory-qmd">
    Sidecar local-first.
  </Card>
  <Card title="Búsqueda de memoria" href="/es/concepts/memory-search">
    Canalización de búsqueda y ajuste.
  </Card>
  <Card title="Active Memory" href="/es/concepts/active-memory">
    Subagente de memoria para sesiones interactivas.
  </Card>
</CardGroup>

Todos los ajustes de búsqueda de memoria viven bajo `agents.defaults.memorySearch` en `openclaw.json` (o una anulación por agente en `agents.list[].memorySearch`), salvo que se indique lo contrario.

<Note>
Si buscas el interruptor de la función **Active Memory** y la configuración del subagente, eso vive bajo `plugins.entries.active-memory` en lugar de `memorySearch`.

Active Memory usa un modelo de dos compuertas:

1. el Plugin debe estar habilitado y apuntar al id del agente actual
2. la solicitud debe ser una sesión de chat persistente interactiva elegible

Consulta [Active Memory](/es/concepts/active-memory) para ver el modelo de activación, la configuración propiedad del Plugin, la persistencia de transcripciones y el patrón de despliegue seguro.
</Note>

---

## Selección de proveedor

| Clave      | Tipo      | Predeterminado        | Descripción                                                                                                                                                                                                                                                                                 |
| ---------- | --------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`  | `boolean` | `true`                | Habilita o deshabilita la búsqueda de memoria                                                                                                                                                                                                                                               |
| `provider` | `string`  | `"openai"`            | ID del adaptador de embeddings como `bedrock`, `deepinfra`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai`, `openai-compatible` o `voyage`; también puede ser un `models.providers.<id>` configurado cuyo `api` apunte a un adaptador de embeddings de memoria o a una API de modelo compatible con OpenAI |
| `model`    | `string`  | predeterminado del proveedor | Nombre del modelo de embeddings                                                                                                                                                                                                                                                            |
| `fallback` | `string`  | `"none"`              | ID del adaptador alternativo cuando falla el principal                                                                                                                                                                                                                                      |

Cuando `provider` no está definido, OpenClaw usa embeddings de OpenAI. Define `provider`
explícitamente para usar Bedrock, DeepInfra, Gemini, GitHub Copilot, Mistral, Ollama,
Voyage, un modelo GGUF local o un endpoint `/v1/embeddings` compatible con OpenAI.
Las configuraciones heredadas que aún dicen `provider: "auto"` se resuelven como `openai`.

<Warning>
Cambiar el proveedor de embeddings, el modelo, los ajustes del proveedor, las fuentes, el alcance,
la fragmentación o el tokenizer puede hacer incompatible el índice vectorial SQLite existente.
OpenClaw pausa la búsqueda vectorial e informa una advertencia de identidad del índice en lugar de
volver a generar automáticamente todos los embeddings. Reconstrúyelo cuando estés listo con
`openclaw memory status --index --agent <id>` o
`openclaw memory index --force --agent <id>`.
</Warning>

Cuando `provider` no está definido, existe el `provider: "auto"` heredado o
`provider: "none"` selecciona intencionalmente el modo solo FTS, la recuperación de memoria aún puede
usar ranking léxico FTS cuando los embeddings no están disponibles.

Los proveedores explícitos no locales fallan de forma cerrada. Si defines `memorySearch.provider` como
un proveedor concreto respaldado remotamente, como Bedrock, DeepInfra, Gemini, GitHub
Copilot, LM Studio, Mistral, Ollama, OpenAI, Voyage o un proveedor personalizado compatible
con OpenAI, y ese proveedor no está disponible en tiempo de ejecución, `memory_search`
devuelve un resultado no disponible en lugar de usar silenciosamente la recuperación solo FTS. Corrige la
configuración del proveedor/autenticación, cambia a un proveedor alcanzable o define
`provider: "none"` si quieres una recuperación solo FTS deliberada.

### IDs de proveedores personalizados

`memorySearch.provider` puede apuntar a una entrada personalizada `models.providers.<id>` para adaptadores de proveedor específicos de memoria como `ollama`, o para API de modelos compatibles con OpenAI como `openai-responses` / `openai-completions`. OpenClaw resuelve el propietario `api` de ese proveedor para el adaptador de embeddings mientras preserva el id de proveedor personalizado para el manejo de endpoint, autenticación y prefijos de modelo. Esto permite que configuraciones multi-GPU o multihost dediquen los embeddings de memoria a un endpoint local específico:

```json5
{
  models: {
    providers: {
      "ollama-5080": {
        api: "ollama",
        baseUrl: "http://gpu-box.local:11435",
        apiKey: "ollama-local",
        models: [{ id: "qwen3-embedding:0.6b", name: "Qwen3 Embedding 0.6B" }],
      },
    },
  },
  agents: {
    defaults: {
      memorySearch: {
        provider: "ollama-5080",
        model: "qwen3-embedding:0.6b",
      },
    },
  },
}
```

### Resolución de claves de API

Los embeddings remotos requieren una clave de API. Bedrock usa en su lugar la cadena de credenciales predeterminada del AWS SDK (roles de instancia, SSO, claves de acceso o una clave de API de Bedrock).

| Proveedor      | Variable de entorno                                | Clave de configuración              |
| -------------- | --------------------------------------------------- | ----------------------------------- |
| Bedrock        | cadena de credenciales de AWS, o `AWS_BEARER_TOKEN_BEDROCK` | No se necesita clave de API         |
| DeepInfra      | `DEEPINFRA_API_KEY`                                 | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                    | `models.providers.google.apiKey`    |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN`  | Perfil de autenticación mediante inicio de sesión de dispositivo |
| Mistral        | `MISTRAL_API_KEY`                                   | `models.providers.mistral.apiKey`   |
| Ollama         | `OLLAMA_API_KEY` (marcador de posición)             | --                                  |
| OpenAI         | `OPENAI_API_KEY`                                    | `models.providers.openai.apiKey`    |
| Voyage         | `VOYAGE_API_KEY`                                    | `models.providers.voyage.apiKey`    |

<Note>
Codex OAuth cubre solo chat/completions y no satisface solicitudes de embeddings.
</Note>

---

## Configuración de endpoint remoto

Usa `provider: "openai-compatible"` para un servidor genérico
`/v1/embeddings` compatible con OpenAI que no debe heredar las credenciales globales de chat de OpenAI.

<ParamField path="remote.baseUrl" type="string">
  URL base de API personalizada.
</ParamField>
<ParamField path="remote.apiKey" type="string">
  Anula la clave de API.
</ParamField>
<ParamField path="remote.headers" type="object">
  Encabezados HTTP adicionales (fusionados con los valores predeterminados del proveedor).
</ParamField>

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai-compatible",
        model: "text-embedding-3-small",
        remote: {
          baseUrl: "https://api.example.com/v1/",
          apiKey: "YOUR_KEY",
        },
      },
    },
  },
}
```

---

## Configuración específica del proveedor

<AccordionGroup>
  <Accordion title="Gemini">
    | Clave                  | Tipo     | Predeterminado        | Descripción                                      |
    | ---------------------- | -------- | ---------------------- | ------------------------------------------------ |
    | `model`                | `string` | `gemini-embedding-001` | También admite `gemini-embedding-2-preview`     |
    | `outputDimensionality` | `number` | `3072`                 | Para Embedding 2: 768, 1536 o 3072              |

    <Warning>
    Cambiar el modelo o `outputDimensionality` cambia la identidad del índice. OpenClaw
    pausa la búsqueda vectorial hasta que reconstruyas explícitamente el índice de memoria.
    </Warning>

  </Accordion>
  <Accordion title="Tipos de entrada compatibles con OpenAI">
    Los endpoints de embeddings compatibles con OpenAI pueden optar por usar campos de solicitud `input_type` específicos del proveedor. Esto es útil para modelos de embeddings asimétricos que requieren etiquetas diferentes para embeddings de consulta y de documento.

    | Clave               | Tipo     | Predeterminado | Descripción                                                    |
    | ------------------- | -------- | -------------- | -------------------------------------------------------------- |
    | `inputType`         | `string` | sin definir    | `input_type` compartido para embeddings de consulta y documento |
    | `queryInputType`    | `string` | sin definir    | `input_type` en tiempo de consulta; anula `inputType`          |
    | `documentInputType` | `string` | sin definir    | `input_type` de índice/documento; anula `inputType`            |

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "openai-compatible",
            remote: {
              baseUrl: "https://embeddings.example/v1",
              apiKey: "${EMBEDDINGS_API_KEY}",
            },
            model: "asymmetric-embedder",
            queryInputType: "query",
            documentInputType: "passage",
          },
        },
      },
    }
    ```

    Cambiar estos valores afecta la identidad de la caché de embeddings para la indexación por lotes del proveedor y debe ir seguido de una reindexación de memoria cuando el modelo upstream trata las etiquetas de forma diferente.

  </Accordion>
  <Accordion title="Bedrock">
    ### Configuración de embeddings de Bedrock

    Bedrock usa la cadena de credenciales predeterminada del AWS SDK más un token de portador comprobado por OpenClaw, así que no se almacenan claves de API en la configuración. Si OpenClaw se ejecuta en EC2 con un rol de instancia habilitado para Bedrock, solo define el proveedor y el modelo:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "bedrock",
            model: "amazon.titan-embed-text-v2:0",
          },
        },
      },
    }
    ```

    | Clave                  | Tipo     | Predeterminado                 | Descripción                           |
    | ---------------------- | -------- | ------------------------------ | ------------------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | Cualquier ID de modelo de embeddings de Bedrock |
    | `outputDimensionality` | `number` | predeterminado del modelo      | Para Titan V2: 256, 512 o 1024       |

    **Modelos admitidos** (con detección de familia y valores dimensionales predeterminados):

    | ID del modelo                            | Proveedor  | Dimensiones predeterminadas | Dimensiones configurables |
    | ------------------------------------------- | ---------- | ------------- | -------------------------- |
    | `amazon.titan-embed-text-v2:0`             | Amazon     | 1024         | 256, 512, 1024             |
    | `amazon.titan-embed-text-v1`               | Amazon     | 1536         | --                          |
    | `amazon.titan-embed-g1-text-02`            | Amazon     | 1536         | --                          |
    | `amazon.titan-embed-image-v1`              | Amazon     | 1024         | --                          |
    | `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon     | 1024         | 256, 384, 1024, 3072       |
    | `cohere.embed-english-v3`                  | Cohere     | 1024         | --                          |
    | `cohere.embed-multilingual-v3`             | Cohere     | 1024         | --                          |
    | `cohere.embed-v4:0`                        | Cohere     | 1536         | 256, 384, 512, 768, 1024, 1536 |
    | `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs | 512          | --                          |
    | `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs | 1024         | --                          |

    Las variantes con sufijo de rendimiento (por ejemplo, `amazon.titan-embed-text-v1:2:8k`) y los ID de perfiles de inferencia con prefijo regional (por ejemplo, `us.amazon.titan-embed-text-v2:0`) heredan la configuración del modelo base.

    **Región:** se resuelve en este orden: la anulación `memorySearch.remote.baseUrl`, la configuración `models.providers.amazon-bedrock.baseUrl`, `AWS_REGION`, `AWS_DEFAULT_REGION` y luego el valor predeterminado `us-east-1`.

    **Autenticación:** OpenClaw comprueba primero `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` o `AWS_BEARER_TOKEN_BEDROCK`; después recurre a la cadena predeterminada estándar de proveedores de credenciales del AWS SDK:

    1. Variables de entorno (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`), salvo que `AWS_PROFILE` también esté definido
    2. SSO (solo cuando los campos de SSO están configurados)
    3. Credenciales compartidas y archivos de configuración (`fromIni`, incluye `AWS_PROFILE`)
    4. Proceso de credenciales (`credential_process` en el archivo de configuración de AWS)
    5. Credenciales de token de identidad web
    6. Credenciales de metadatos de instancia ECS o EC2

    **Permisos de IAM:** el rol o usuario de IAM necesita:

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    Para privilegios mínimos, limita el alcance de `InvokeModel` al modelo específico:

    ```text
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="Local (GGUF + llama.cpp)">
    | Clave                 | Tipo               | Valor predeterminado  | Descripción                                                                                                                                                                                                                                                                                                          |
    | --------------------- | ------------------ | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | descarga automática        | Ruta al archivo de modelo GGUF                                                                                                                                                                                                                                                                                              |
    | `local.modelCacheDir` | `string`           | predeterminado de node-llama-cpp | Directorio de caché para modelos descargados                                                                                                                                                                                                                                                                                      |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | Tamaño de la ventana de contexto para el contexto de embedding. 4096 cubre fragmentos típicos (128-512 tokens) y a la vez limita la VRAM que no corresponde a pesos. Redúcelo a 1024-2048 en hosts con recursos limitados. `"auto"` usa el máximo entrenado del modelo; no se recomienda para modelos de 8B+ (Qwen3-Embedding-8B: hasta 40 960 tokens pueden llevar la VRAM a ~32 GB). |

    Instala primero el proveedor oficial de llama.cpp: `openclaw plugins install @openclaw/llama-cpp-provider`.
    Modelo predeterminado: `embeddinggemma-300m-qat-Q8_0.gguf` (~0.6 GB, descarga automática). Los checkouts de código fuente aún requieren aprobación de compilación nativa: `pnpm approve-builds` y luego `pnpm rebuild node-llama-cpp`.

    Usa la CLI independiente para verificar la misma ruta de proveedor que usa el Gateway:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    Define `provider: "local"` explícitamente para embeddings GGUF locales. Las referencias de modelo `hf:` y HTTP(S) se admiten para configuraciones locales explícitas (mediante la resolución de modelos de node-llama-cpp), pero no cambian el proveedor predeterminado.

  </Accordion>
</AccordionGroup>

### Tiempo de espera de embeddings en línea

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  Anula el tiempo de espera para lotes de embeddings en línea durante la indexación de memoria.

Si no se define, usa el valor predeterminado del proveedor: 600 segundos para proveedores locales/autohospedados como `local`, `ollama` y `lmstudio`, y 120 segundos para proveedores hospedados. Aumenta este valor cuando los lotes de embeddings locales limitados por CPU están funcionando correctamente pero son lentos.
</ParamField>

---

## Comportamiento de indexación

Todo bajo `memorySearch.sync`, salvo que se indique lo contrario:

| Clave                          | Tipo      | Predeterminado | Descripción                                                           |
| ------------------------------ | --------- | ------- | --------------------------------------------------------------------- |
| `onSessionStart`               | `boolean` | `true`  | Sincroniza el índice de memoria cuando se inicia una sesión                           |
| `onSearch`                     | `boolean` | `true`  | Sincroniza de forma diferida al buscar después de detectar cambios de contenido                 |
| `watch`                        | `boolean` | `true`  | Observa archivos de memoria (chokidar) y programa la reindexación ante cambios         |
| `watchDebounceMs`              | `number`  | `1500`  | Ventana de debounce para agrupar eventos rápidos de observación de archivos                |
| `intervalMinutes`              | `number`  | `0`     | Intervalo de reindexación periódica en minutos (`0` desactiva)                   |
| `sessions.postCompactionForce` | `boolean` | `true`  | Fuerza la reindexación de una sesión después de actualizaciones de transcripción activadas por Compaction |

<ParamField path="chunking.tokens" type="number">
  Tamaño de fragmento en tokens usado al dividir fuentes de memoria antes del embedding (predeterminado: 400).
</ParamField>
<ParamField path="chunking.overlap" type="number">
  Solapamiento de tokens entre fragmentos adyacentes para conservar el contexto cerca de los límites de división (predeterminado: 80).
</ParamField>

<Note>
Cambiar `chunking.tokens` o `chunking.overlap` modifica los límites de los fragmentos e invalida la identidad del índice existente (consulta la advertencia bajo Selección de proveedor).
</Note>

---

## Configuración de búsqueda híbrida

Todo bajo `memorySearch.query`:

| Clave        | Tipo     | Predeterminado | Descripción                               |
| ------------ | -------- | ------- | ----------------------------------------- |
| `maxResults` | `number` | `6`     | Máximos aciertos de memoria devueltos antes de la inyección |
| `minScore`   | `number` | `0.35`  | Puntuación mínima de relevancia para incluir un acierto  |

Y bajo `memorySearch.query.hybrid`:

| Clave                 | Tipo      | Predeterminado | Descripción                        |
| --------------------- | --------- | ------- | ---------------------------------- |
| `enabled`             | `boolean` | `true`  | Habilita la búsqueda híbrida BM25 + vectorial |
| `vectorWeight`        | `number`  | `0.7`   | Peso para puntuaciones vectoriales (0-1)     |
| `textWeight`          | `number`  | `0.3`   | Peso para puntuaciones BM25 (0-1)       |
| `candidateMultiplier` | `number`  | `4`     | Multiplicador del tamaño del conjunto de candidatos     |

<Tabs>
  <Tab title="MMR (diversidad)">
    | Clave         | Tipo      | Predeterminado | Descripción                          |
    | ------------- | --------- | ------- | ------------------------------------- |
    | `mmr.enabled` | `boolean` | `false` | Habilita el reordenamiento MMR                |
    | `mmr.lambda`  | `number`  | `0.7`   | 0 = diversidad máxima, 1 = relevancia máxima |
  </Tab>
  <Tab title="Decaimiento temporal (recencia)">
    | Clave                        | Tipo      | Predeterminado | Descripción               |
    | ---------------------------- | --------- | ------- | -------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false` | Habilita el refuerzo por recencia      |
    | `temporalDecay.halfLifeDays` | `number`  | `30`    | La puntuación se reduce a la mitad cada N días |

    Los archivos perennes (`MEMORY.md`, archivos sin fecha en `memory/`) nunca decaen.

  </Tab>
</Tabs>

### Ejemplo completo

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        query: {
          maxResults: 6,
          minScore: 0.35,
          hybrid: {
            vectorWeight: 0.7,
            textWeight: 0.3,
            mmr: { enabled: true, lambda: 0.7 },
            temporalDecay: { enabled: true, halfLifeDays: 30 },
          },
        },
      },
    },
  },
}
```

---

## Rutas de memoria adicionales

| Clave        | Tipo       | Descripción                              |
| ------------ | ---------- | ---------------------------------------- |
| `extraPaths` | `string[]` | Directorios o archivos adicionales para indexar |

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        extraPaths: ["../team-docs", "/srv/shared-notes"],
      },
    },
  },
}
```

Las rutas pueden ser absolutas o relativas al workspace. Los directorios se escanean recursivamente en busca de archivos `.md`. El manejo de enlaces simbólicos depende del backend activo: el motor incorporado omite los enlaces simbólicos, mientras que QMD sigue el comportamiento del escáner QMD subyacente.

Para búsquedas de transcripciones entre agentes con alcance de agente, usa `agents.list[].memorySearch.qmd.extraCollections` en lugar de `memory.qmd.paths`. Esas colecciones adicionales siguen la misma forma `{ path, name, pattern? }`, pero se fusionan por agente y pueden conservar nombres compartidos explícitos cuando la ruta apunta fuera del workspace actual. Si la misma ruta resuelta aparece tanto en `memory.qmd.paths` como en `memorySearch.qmd.extraCollections`, QMD conserva la primera entrada y omite el duplicado.

---

## Memoria multimodal (Gemini)

Indexa imágenes y audio junto con Markdown usando Gemini Embedding 2:

| Clave                     | Tipo       | Predeterminado | Descripción                            |
| ------------------------- | ---------- | ---------- | -------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | Habilita la indexación multimodal             |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`, `["audio"]`, or `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10485760` | Tamaño máximo de archivo para la indexación (10 MiB)    |

<Note>
Solo se aplica a archivos en `extraPaths`. Las raíces de memoria predeterminadas siguen siendo solo Markdown. Requiere `gemini-embedding-2-preview`. `fallback` debe ser `"none"`.
</Note>

Formatos admitidos: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (imágenes); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (audio).

---

## Caché de embeddings

| Clave              | Tipo      | Predeterminado | Descripción                                            |
| ------------------ | --------- | -------------- | ------------------------------------------------------ |
| `cache.enabled`    | `boolean` | `true`         | Almacena en caché las incrustaciones de fragmentos en SQLite |
| `cache.maxEntries` | `number`  | sin definir    | Límite superior de mejor esfuerzo para incrustaciones en caché |

Evita volver a incrustar texto sin cambios durante la reindexación o las actualizaciones de transcripciones. Deja `maxEntries` sin definir para una caché sin límite; configúralo cuando el crecimiento del disco importe más que la velocidad máxima de reindexación. Cuando se configura, las entradas más antiguas (según la hora de última actualización) se depuran primero una vez que la caché supera el límite.

---

## Indexación por lotes

| Clave                         | Tipo      | Predeterminado | Descripción                     |
| ----------------------------- | --------- | -------------- | ------------------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`            | Incrustaciones en línea paralelas |
| `remote.batch.enabled`        | `boolean` | `false`        | Habilita la API de incrustaciones por lotes |
| `remote.batch.concurrency`    | `number`  | `2`            | Trabajos por lotes paralelos    |
| `remote.batch.wait`           | `boolean` | `true`         | Espera a que finalice el lote   |
| `remote.batch.pollIntervalMs` | `number`  | `2000`         | Intervalo de sondeo             |
| `remote.batch.timeoutMinutes` | `number`  | `60`           | Tiempo de espera del lote       |

Disponible para `gemini`, `openai` y `voyage`. El procesamiento por lotes de OpenAI suele ser el más rápido y económico para grandes rellenos retrospectivos.

`remote.nonBatchConcurrency` controla las llamadas de incrustación en línea usadas por proveedores locales/autohospedados y proveedores alojados cuando las API por lotes del proveedor no están activas. Ollama usa `1` de forma predeterminada para la indexación sin lotes para evitar sobrecargar hosts locales más pequeños; establece un valor más alto en máquinas más grandes.

Esto es independiente de `sync.embeddingBatchTimeoutSeconds`, que controla el tiempo de espera para las llamadas de incrustación en línea.

---

## Búsqueda en memoria de sesión (experimental)

Indexa las transcripciones de sesión y exponlas mediante `memory_search`:

| Clave                         | Tipo       | Predeterminado | Descripción                                      |
| ----------------------------- | ---------- | -------------- | ------------------------------------------------ |
| `experimental.sessionMemory`  | `boolean`  | `false`        | Habilita la indexación de sesiones               |
| `sources`                     | `string[]` | `["memory"]`   | Agrega `"sessions"` para incluir transcripciones |
| `sync.sessions.deltaBytes`    | `number`   | `100000`       | Umbral de bytes para reindexar                   |
| `sync.sessions.deltaMessages` | `number`   | `50`           | Umbral de mensajes para reindexar                |

<Warning>
La indexación de sesiones es opcional y se ejecuta de forma asíncrona. Los resultados pueden estar ligeramente desactualizados. Los registros de sesión viven en el disco, así que trata el acceso al sistema de archivos como el límite de confianza.
</Warning>

Los resultados de transcripciones de sesión también obedecen
[`tools.sessions.visibility`](/es/gateway/config-tools#toolssessions). La visibilidad predeterminada
`tree` solo expone la sesión actual y las sesiones que generó. Para
recordar una sesión no relacionada del mismo agente despachada por Gateway desde una sesión
diferente, como un DM, amplía intencionadamente la visibilidad a `agent` (o `all` solo
cuando también se requiera recuperación entre agentes y la política de agente a agente lo permita).

Los ejemplos siguientes colocan esta configuración bajo `agents.defaults`. También puedes
aplicar una configuración `memorySearch` equivalente en una anulación por agente cuando solo un
agente deba indexar y buscar transcripciones de sesión.

Para recuperación de Gateway a DM del mismo agente:

<Tabs>
  <Tab title="Backend integrado">
    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            experimental: { sessionMemory: true },
            sources: ["memory", "sessions"],
          },
        },
      },
      tools: {
        sessions: { visibility: "agent" },
      },
    }
    ```
  </Tab>
  <Tab title="Backend QMD">
    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            experimental: { sessionMemory: true },
            sources: ["memory", "sessions"],
          },
        },
      },
      memory: {
        backend: "qmd",
        qmd: {
          sessions: { enabled: true },
        },
      },
      tools: {
        sessions: { visibility: "agent" },
      },
    }
    ```
  </Tab>
</Tabs>

Al usar QMD, `agents.defaults.memorySearch.experimental.sessionMemory` y
`sources: ["sessions"]` no exportan por sí solos las transcripciones a QMD. También configura
`memory.qmd.sessions.enabled: true`.

---

## Aceleración vectorial de SQLite (sqlite-vec)

| Clave                        | Tipo      | Predeterminado | Descripción                                  |
| ---------------------------- | --------- | -------------- | -------------------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`         | Usa sqlite-vec para consultas vectoriales    |
| `store.vector.extensionPath` | `string`  | incluido       | Anula la ruta de sqlite-vec                  |

  Cuando sqlite-vec no está disponible, OpenClaw recurre automáticamente a la similitud coseno en proceso.

  ---

  ## Almacenamiento de índices

  Los índices de memoria integrados residen en la base de datos SQLite de OpenClaw de cada agente en
  `agents/<agentId>/agent/openclaw-agent.sqlite`.

  | Clave                 | Tipo     | Predeterminado | Descripción                                |
  | --------------------- | -------- | -------------- | ------------------------------------------ |
  | `store.fts.tokenizer` | `string` | `unicode61`    | Tokenizador FTS5 (`unicode61` o `trigram`) |

  ---

  ## Configuración del backend QMD

  Define `memory.backend = "qmd"` para habilitarlo. Todos los ajustes de QMD residen en `memory.qmd`:

  | Clave                    | Tipo      | Predeterminado | Descripción                                                                                      |
  | ------------------------ | --------- | -------------- | ------------------------------------------------------------------------------------------------ |
  | `command`                | `string`  | `qmd`          | Ruta del ejecutable QMD; define una ruta absoluta cuando el `PATH` del servicio difiera de tu shell |
  | `searchMode`             | `string`  | `search`       | Comando de búsqueda: `search`, `vsearch`, `query`                                                |
  | `rerank`                 | `boolean` | --             | Define `false` con `searchMode: "query"` y QMD 2.1+ para omitir el reranking de QMD              |
  | `includeDefaultMemory`   | `boolean` | `true`         | Indexa automáticamente `MEMORY.md` + `memory/**/*.md`                                            |
  | `paths[]`                | `array`   | --             | Rutas adicionales: `{ name, path, pattern? }`                                                     |
  | `sessions.enabled`       | `boolean` | `false`        | Exporta transcripciones de sesiones a QMD                                                        |
  | `sessions.retentionDays` | `number`  | --             | Retención de transcripciones                                                                     |
  | `sessions.exportDir`     | `string`  | --             | Directorio de exportación                                                                        |

  `searchMode: "search"` es solo léxico/BM25. OpenClaw no ejecuta pruebas de preparación de vectores semánticos ni mantenimiento de embeddings de QMD para ese modo, incluso durante `memory status --deep`; `vsearch` y `query` siguen requiriendo preparación de vectores y embeddings de QMD.

  `rerank: false` solo cambia el modo `query` de QMD y requiere QMD 2.1 o una versión posterior. En modo CLI directo, OpenClaw pasa `--no-rerank`; en modo MCP respaldado por mcporter, pasa `rerank: false` a la herramienta de consulta unificada de QMD. Déjalo sin definir para usar el comportamiento predeterminado de reranking de consultas de QMD.

  OpenClaw prefiere las formas actuales de colección y consulta MCP de QMD, pero mantiene funcionando versiones anteriores de QMD probando flags de patrones de colección compatibles y nombres de herramientas MCP antiguos cuando sea necesario. Cuando QMD anuncia compatibilidad con varios filtros de colección, las colecciones de la misma fuente se buscan con un solo proceso QMD; las compilaciones anteriores de QMD conservan la ruta de compatibilidad por colección. Misma fuente significa que las colecciones de memoria duradera (archivos de memoria predeterminados más rutas personalizadas) se agrupan juntas, mientras que las colecciones de transcripciones de sesión permanecen como un grupo separado para que la diversificación de fuentes siga teniendo ambas entradas.

  <Note>
  Las anulaciones de modelos de QMD permanecen del lado de QMD, no en la configuración de OpenClaw. Si necesitas anular los modelos de QMD globalmente, define variables de entorno como `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` y `QMD_GENERATE_MODEL` en el entorno de ejecución del Gateway.
  </Note>

  ### Integración con mcporter

  Todo bajo `memory.qmd.mcporter`. Enruta las búsquedas de QMD mediante un daemon MCP `mcporter` de larga duración en lugar de generar `qmd` por consulta, lo que reduce la sobrecarga de arranque en frío para modelos más grandes.

  | Clave         | Tipo      | Predeterminado | Descripción                                                                 |
  | ------------- | --------- | -------------- | --------------------------------------------------------------------------- |
  | `enabled`     | `boolean` | `false`        | Enruta llamadas de QMD mediante mcporter en lugar de generar `qmd` por solicitud |
  | `serverName`  | `string`  | `qmd`          | Nombre del servidor mcporter que ejecuta `qmd mcp` con `lifecycle: keep-alive` |
  | `startDaemon` | `boolean` | `true`         | Inicia automáticamente el daemon mcporter cuando `enabled` es true          |

  Requiere que `mcporter` esté instalado y en PATH, además de un servidor mcporter configurado que ejecute `qmd mcp`. Mantenlo deshabilitado para configuraciones locales más simples donde el costo de generar un proceso por consulta sea aceptable.

  <AccordionGroup>
  <Accordion title="Update schedule">
    | Clave                     | Tipo      | Predeterminado | Descripción                           |
    | --------------------------- | --------- | -------- | ---------------------------------------- |
    | `update.interval`         | `string`  | `5m`    | Intervalo de actualización            |
    | `update.debounceMs`       | `number`  | `15000` | Aplica debounce a cambios de archivos |
    | `update.onBoot`           | `boolean` | `true`  | Actualiza cuando se abre el administrador QMD de larga duración; define false para omitir la actualización inmediata al arranque |
    | `update.startup`          | `string`  | `off`   | Inicialización opcional de QMD al iniciar el Gateway: `off`, `idle` o `immediate` |
    | `update.startupDelayMs`   | `number`  | `120000` | Retraso antes de que se ejecute la actualización `startup: "idle"` |
    | `update.waitForBootSync`  | `boolean` | `false` | Bloquea la apertura del administrador hasta que se complete su actualización inicial |
    | `update.embedInterval`    | `string`  | `60m`   | Cadencia de embed separada            |
    | `update.commandTimeoutMs` | `number`  | `30000` | Tiempo de espera para comandos de mantenimiento de QMD (collection list/add) |
    | `update.updateTimeoutMs`  | `number`  | `120000` | Tiempo de espera para cada ciclo de `qmd update` |
    | `update.embedTimeoutMs`   | `number`  | `120000` | Tiempo de espera para cada ciclo de `qmd embed` |
  </Accordion>
  <Accordion title="Limits">
    | Clave                    | Tipo     | Predeterminado | Descripción                    |
    | --------------------------- | -------- | ------- | ------------------------------ |
    | `limits.maxResults`       | `number` | `4`     | Resultados de búsqueda máximos |
    | `limits.maxSnippetChars`  | `number` | `450`   | Limita la longitud del fragmento |
    | `limits.maxInjectedChars` | `number` | `2200`  | Limita el total de caracteres inyectados |
    | `limits.timeoutMs`        | `number` | `4000`  | Tiempo de espera de búsqueda   |
  </Accordion>
  <Accordion title="Scope">
    Controla qué sesiones pueden recibir resultados de búsqueda de QMD. El mismo esquema que [`session.sendPolicy`](/es/gateway/config-agents#session):

    ```json5
    {
      memory: {
        qmd: {
          scope: {
            default: "deny",
            rules: [{ action: "allow", match: { chatType: "direct" } }],
          },
        },
      },
    }
    ```

    El valor predeterminado incluido es solo DM/directo, y deniega grupos y otros tipos de canal. `match.keyPrefix` coincide con la clave de sesión normalizada; `match.rawKeyPrefix` coincide con la clave sin procesar, incluido `agent:<id>:`.

  </Accordion>
  <Accordion title="Citations">
    `memory.citations` se aplica a todos los backends:

    | Valor            | Comportamiento                                            |
    | ------------------ | ------------------------------------------------------ |
    | `auto` (predeterminado) | Incluir el pie de página `Source: <path#line>` en los fragmentos    |
    | `on`             | Incluir siempre el pie de página                               |
    | `off`            | Omitir el pie de página (la ruta todavía se pasa internamente al agente) |

  </Accordion>
</AccordionGroup>

Cuando la inicialización de QMD al iniciar el Gateway está habilitada, OpenClaw inicia QMD solo para los agentes aptos. Si `update.onBoot` es true y no se ha configurado ningún mantenimiento de intervalo/incrustación, el inicio usa un administrador de una sola ejecución para la actualización de arranque y lo cierra. Si se configura un intervalo de actualización o incrustación, el inicio abre el administrador de QMD de larga duración para que pueda encargarse del observador y los temporizadores de intervalo; `update.onBoot: false` omite solo la actualización inmediata de arranque.

### Ejemplo completo de QMD

```json5
{
  memory: {
    backend: "qmd",
    citations: "auto",
    qmd: {
      includeDefaultMemory: true,
      update: { interval: "5m", debounceMs: 15000 },
      limits: { maxResults: 4, timeoutMs: 4000 },
      scope: {
        default: "deny",
        rules: [{ action: "allow", match: { chatType: "direct" } }],
      },
      paths: [{ name: "docs", path: "~/notes", pattern: "**/*.md" }],
    },
  },
}
```

---

## Dreaming

Dreaming se configura en `plugins.entries.memory-core.config.dreaming`, no en `agents.defaults.memorySearch`.

Dreaming se ejecuta como un único barrido programado y usa fases internas ligeras/profundas/REM como detalle de implementación.

Para ver el comportamiento conceptual y los comandos de barra diagonal, consulta [Dreaming](/es/concepts/dreaming).

### Configuración de usuario

| Clave                                    | Tipo      | Predeterminado       | Descripción                                                                                                                      |
| -------------------------------------- | --------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                              | `boolean` | `false`       | Habilita o deshabilita Dreaming por completo                                                                                              |
| `frequency`                            | `string`  | `0 3 * * *`   | Cadencia Cron opcional para el barrido completo de Dreaming                                                                                |
| `model`                                | `string`  | modelo predeterminado | Anulación opcional del modelo del subagente de Dream Diary                                                                                     |
| `phases.deep.maxPromotedSnippetTokens` | `number`  | `160`         | Tokens estimados máximos conservados de cada fragmento de recuperación a corto plazo promovido a `MEMORY.md`; los metadatos de procedencia permanecen visibles |

### Ejemplo

```json5
{
  plugins: {
    entries: {
      "memory-core": {
        subagent: {
          allowModelOverride: true,
          allowedModels: ["anthropic/claude-sonnet-4-6"],
        },
        config: {
          dreaming: {
            enabled: true,
            frequency: "0 3 * * *",
            model: "anthropic/claude-sonnet-4-6",
          },
        },
      },
    },
  },
}
```

<Note>
- Dreaming escribe el estado de la máquina en `memory/.dreams/`.
- Dreaming escribe la salida narrativa legible por humanos en `DREAMS.md` (o en el `dreams.md` existente).
- `dreaming.model` usa la puerta de confianza de subagente existente del Plugin; configura `plugins.entries.memory-core.subagent.allowModelOverride: true` antes de habilitarlo.
- Dream Diary reintenta una vez con el modelo predeterminado de la sesión cuando el modelo configurado no está disponible. Los fallos de confianza o de lista de permitidos se registran y no se reintentan silenciosamente.
- La política y los umbrales de las fases ligeras/profundas/REM son comportamiento interno, no configuración orientada al usuario.

</Note>

## Relacionado

- [Referencia de configuración](/es/gateway/configuration-reference)
- [Resumen de memoria](/es/concepts/memory)
- [Búsqueda de memoria](/es/concepts/memory-search)
