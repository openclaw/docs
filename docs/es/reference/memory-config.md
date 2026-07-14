---
read_when:
    - Se desea configurar proveedores de búsqueda en memoria o modelos de embeddings
    - Desea configurar el backend de QMD
    - Se desea ajustar la búsqueda híbrida, MMR o el decaimiento temporal
    - Se desea habilitar la indexación de memoria multimodal
sidebarTitle: Memory config
summary: Todas las opciones de configuración para la búsqueda en memoria, los proveedores de embeddings, QMD, la búsqueda híbrida y la indexación multimodal
title: Referencia de configuración de memoria
x-i18n:
    generated_at: "2026-07-14T13:58:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 1947d6d654de85059ef777a3a6387f6db5b76c8d688fbb539a063162d323c1f6
    source_path: reference/memory-config.md
    workflow: 16
---

Esta página enumera todas las opciones de configuración de la búsqueda en memoria de OpenClaw. Para obtener descripciones conceptuales generales, consulte:

<CardGroup cols={2}>
  <Card title="Descripción general de la memoria" href="/es/concepts/memory">
    Cómo funciona la memoria.
  </Card>
  <Card title="Motor integrado" href="/es/concepts/memory-builtin">
    Backend SQLite predeterminado.
  </Card>
  <Card title="Motor QMD" href="/es/concepts/memory-qmd">
    Proceso auxiliar con prioridad local.
  </Card>
  <Card title="Búsqueda en memoria" href="/es/concepts/memory-search">
    Canalización de búsqueda y ajuste.
  </Card>
  <Card title="Active Memory" href="/es/concepts/active-memory">
    Subagente de memoria para sesiones interactivas.
  </Card>
</CardGroup>

Todos los ajustes de búsqueda en memoria se encuentran en `agents.defaults.memorySearch` dentro de `openclaw.json` (o en una anulación por agente de `agents.list[].memorySearch`), salvo que se indique lo contrario.

<Note>
Si busca la opción de activación de **Active Memory** y la configuración del subagente, se encuentran en `plugins.entries.active-memory` en lugar de `memorySearch`.

Active Memory utiliza un modelo de dos condiciones:

1. el Plugin debe estar habilitado y dirigirse al identificador del agente actual
2. la solicitud debe corresponder a una sesión de chat persistente e interactiva apta

Consulte [Active Memory](/es/concepts/active-memory) para conocer el modelo de activación, la configuración propiedad del Plugin, la persistencia de transcripciones y el patrón de despliegue seguro.
</Note>

---

## Selección del proveedor

| Clave        | Tipo      | Valor predeterminado          | Descripción                                                                                                                                                                                                                                                                                 |
| ---------- | --------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`  | `boolean` | `true`           | Habilita o deshabilita la búsqueda en memoria                                                                                                                                                                                                                                                             |
| `provider` | `string`  | `"openai"`       | Identificador del adaptador de embeddings, como `bedrock`, `deepinfra`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai`, `openai-compatible` o `voyage`; también puede ser un `models.providers.<id>` configurado cuyo `api` apunte a un adaptador de embeddings de memoria o a una API de modelos compatible con OpenAI |
| `model`    | `string`  | valor predeterminado del proveedor | Nombre del modelo de embeddings                                                                                                                                                                                                                                                                        |
| `fallback` | `string`  | `"none"`         | Identificador del adaptador de reserva cuando falla el principal                                                                                                                                                                                                                                                  |

Cuando `provider` no está establecido, OpenClaw utiliza embeddings de OpenAI. Establezca `provider`
explícitamente para utilizar Bedrock, DeepInfra, Gemini, GitHub Copilot, Mistral, Ollama,
Voyage, un modelo GGUF local o un endpoint `/v1/embeddings` compatible con OpenAI.
Las configuraciones heredadas que aún indican `provider: "auto"` se resuelven como `openai`.

<Warning>
Cambiar el proveedor o modelo de embeddings, los ajustes del proveedor, las fuentes, el ámbito,
la segmentación o el tokenizador puede hacer que el índice vectorial SQLite existente sea incompatible.
OpenClaw pausa la búsqueda vectorial y notifica una advertencia sobre la identidad del índice en lugar de
volver a generar automáticamente todos los embeddings. Reconstruya el índice cuando esté listo con
`openclaw memory status --index --agent <id>` o
`openclaw memory index --force --agent <id>`.
</Warning>

Cuando `provider` no está establecido, existe el valor heredado `provider: "auto"` o
`provider: "none"` selecciona intencionadamente el modo de solo FTS, la recuperación de memoria aún puede
utilizar la clasificación léxica de FTS cuando los embeddings no están disponibles.

Los proveedores no locales explícitos se cierran ante errores. Si establece `memorySearch.provider` en
un proveedor concreto respaldado por un servicio remoto, como Bedrock, DeepInfra, Gemini, GitHub
Copilot, LM Studio, Mistral, Ollama, OpenAI, Voyage o un proveedor personalizado
compatible con OpenAI, y ese proveedor no está disponible durante la ejecución, `memory_search`
devuelve un resultado de indisponibilidad en lugar de utilizar silenciosamente la recuperación de solo FTS. Corrija la
configuración del proveedor o la autenticación, cambie a un proveedor accesible o establezca
`provider: "none"` si desea utilizar deliberadamente la recuperación de solo FTS.

### Identificadores de proveedores personalizados

`memorySearch.provider` puede apuntar a una entrada `models.providers.<id>` personalizada para adaptadores de proveedor específicos de memoria, como `ollama`, o para API de modelos compatibles con OpenAI, como `openai-responses` / `openai-completions`. OpenClaw resuelve el propietario `api` de ese proveedor para el adaptador de embeddings y conserva el identificador del proveedor personalizado para gestionar el endpoint, la autenticación y el prefijo del modelo. Esto permite que las configuraciones con varias GPU o varios hosts dediquen los embeddings de memoria a un endpoint local específico:

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

Los embeddings remotos requieren una clave de API. Bedrock utiliza en su lugar la cadena de credenciales predeterminada del SDK de AWS (roles de instancia, SSO, claves de acceso o una clave de API de Bedrock).

| Proveedor       | Variable de entorno                                             | Clave de configuración                          |
| -------------- | --------------------------------------------------- | ----------------------------------- |
| Bedrock        | Cadena de credenciales de AWS o `AWS_BEARER_TOKEN_BEDROCK` | No se necesita una clave de API                   |
| DeepInfra      | `DEEPINFRA_API_KEY`                                 | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                    | `models.providers.google.apiKey`    |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN`  | Perfil de autenticación mediante inicio de sesión con dispositivo       |
| Mistral        | `MISTRAL_API_KEY`                                   | `models.providers.mistral.apiKey`   |
| Ollama         | `OLLAMA_API_KEY` (marcador de posición)                      | --                                  |
| OpenAI         | `OPENAI_API_KEY`                                    | `models.providers.openai.apiKey`    |
| Voyage         | `VOYAGE_API_KEY`                                    | `models.providers.voyage.apiKey`    |

<Note>
OAuth de Codex solo cubre el chat y las finalizaciones, y no satisface las solicitudes de embeddings.
</Note>

---

## Configuración del endpoint remoto

Utilice `provider: "openai-compatible"` para un servidor `/v1/embeddings` genérico
compatible con OpenAI que no deba heredar las credenciales globales de chat de OpenAI.

<ParamField path="remote.baseUrl" type="string">
  URL base personalizada de la API.
</ParamField>
<ParamField path="remote.apiKey" type="string">
  Anulación de la clave de API.
</ParamField>
<ParamField path="remote.headers" type="object">
  Encabezados HTTP adicionales (combinados con los valores predeterminados del proveedor).
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
    | Clave                    | Tipo     | Valor predeterminado                | Descripción                                |
    | ---------------------- | -------- | ---------------------- | ------------------------------------------- |
    | `model`                | `string` | `gemini-embedding-001` | También admite `gemini-embedding-2-preview` |
    | `outputDimensionality` | `number` | `3072`                 | Para Embedding 2: 768, 1536 o 3072        |

    <Warning>
    Cambiar el modelo o `outputDimensionality` modifica la identidad del índice. OpenClaw
    pausa la búsqueda vectorial hasta que se reconstruya explícitamente el índice de memoria.
    </Warning>

  </Accordion>
  <Accordion title="Tipos de entrada compatibles con OpenAI">
    Los endpoints de embeddings compatibles con OpenAI pueden optar por incluir campos de solicitud `input_type` específicos del proveedor. Esto resulta útil para modelos de embeddings asimétricos que requieren etiquetas diferentes para los embeddings de consultas y documentos.

    | Clave                 | Tipo     | Valor predeterminado | Descripción                                             |
    | ------------------- | -------- | ------- | -------------------------------------------------------- |
    | `inputType`         | `string` | no establecido   | `input_type` compartido para los embeddings de consultas y documentos   |
    | `queryInputType`    | `string` | no establecido   | `input_type` durante las consultas; anula `inputType`          |
    | `documentInputType` | `string` | no establecido   | `input_type` del índice o documento; anula `inputType`      |

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

    Cambiar estos valores afecta a la identidad de la caché de embeddings para la indexación por lotes del proveedor y debe ir seguido de una reindexación de la memoria cuando el modelo de origen trate las etiquetas de forma diferente.

  </Accordion>
  <Accordion title="Bedrock">
    ### Configuración de embeddings de Bedrock

    Bedrock utiliza la cadena de credenciales predeterminada del SDK de AWS junto con un token de portador comprobado por OpenClaw, por lo que no se almacenan claves de API en la configuración. Si OpenClaw se ejecuta en EC2 con un rol de instancia habilitado para Bedrock, solo es necesario establecer el proveedor y el modelo:

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

    | Clave                    | Tipo     | Valor predeterminado                        | Descripción                     |
    | ---------------------- | -------- | ------------------------------- | -------------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | Cualquier identificador de modelo de embeddings de Bedrock  |
    | `outputDimensionality` | `number` | valor predeterminado del modelo                  | Para Titan V2: 256, 512 o 1024 |

    **Modelos compatibles** (con detección de familia y dimensiones predeterminadas):

    | ID del modelo                               | Proveedor  | Dimensiones predeterminadas | Dimensiones configurables       |
    | ------------------------------------------- | ---------- | ---------------------------- | -------------------------------- |
    | `amazon.titan-embed-text-v2:0`             | Amazon     | 1024                         | 256, 512, 1024                   |
    | `amazon.titan-embed-text-v1`               | Amazon     | 1536                         | --                               |
    | `amazon.titan-embed-g1-text-02`            | Amazon     | 1536                         | --                               |
    | `amazon.titan-embed-image-v1`              | Amazon     | 1024                         | --                               |
    | `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon     | 1024                         | 256, 384, 1024, 3072             |
    | `cohere.embed-english-v3`                  | Cohere     | 1024                         | --                               |
    | `cohere.embed-multilingual-v3`             | Cohere     | 1024                         | --                               |
    | `cohere.embed-v4:0`                        | Cohere     | 1536                         | 256, 384, 512, 768, 1024, 1536   |
    | `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs | 512                          | --                               |
    | `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs | 1024                         | --                               |

    Las variantes con sufijo de rendimiento (p. ej., `amazon.titan-embed-text-v1:2:8k`) y los ID de perfiles de inferencia con prefijo de región (p. ej., `us.amazon.titan-embed-text-v2:0`) heredan la configuración del modelo base.

    **Región:** se resuelve en este orden: la sobrescritura `memorySearch.remote.baseUrl`, la configuración `models.providers.amazon-bedrock.baseUrl`, `AWS_REGION`, `AWS_DEFAULT_REGION` y, por último, el valor predeterminado `us-east-1`.

    **Autenticación:** OpenClaw comprueba primero `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` o `AWS_BEARER_TOKEN_BEDROCK` y, después, recurre a la cadena estándar de proveedores de credenciales predeterminados del SDK de AWS:

    1. Variables de entorno (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`), salvo que también se haya definido `AWS_PROFILE`
    2. SSO (solo cuando los campos de SSO están configurados)
    3. Archivos compartidos de credenciales y configuración (`fromIni`, incluye `AWS_PROFILE`)
    4. Proceso de credenciales (`credential_process` en el archivo de configuración de AWS)
    5. Credenciales de token de identidad web
    6. Credenciales de metadatos de instancias ECS o EC2

    **Permisos de IAM:** el rol o usuario de IAM necesita:

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    Para aplicar el principio de mínimo privilegio, limite `InvokeModel` al modelo específico:

    ```text
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="Local (GGUF + llama.cpp)">
    | Clave                 | Tipo               | Valor predeterminado    | Descripción                                                                                                                                                                                                                                                                                                           |
    | --------------------- | ------------------ | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | descarga automática    | Ruta al archivo del modelo GGUF                                                                                                                                                                                                                                                                                       |
    | `local.modelCacheDir` | `string`           | valor predeterminado de node-llama-cpp | Directorio de caché para los modelos descargados                                                                                                                                                                                                                                                    |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | Tamaño de la ventana de contexto para el contexto de incrustación. 4096 cubre los fragmentos habituales (128-512 tokens) y limita a la vez la VRAM no destinada a los pesos. Redúzcalo a 1024-2048 en hosts con recursos limitados. `"auto"` usa el máximo con el que se entrenó el modelo; no se recomienda para modelos de 8B o más (Qwen3-Embedding-8B: hasta 40 960 tokens pueden elevar la VRAM a ~32 GB). |

    Instale primero el proveedor oficial de llama.cpp: `openclaw plugins install @openclaw/llama-cpp-provider`.
    Modelo predeterminado: `embeddinggemma-300m-qat-Q8_0.gguf` (~0.6 GB, se descarga automáticamente). Las copias de trabajo del código fuente siguen requiriendo la aprobación de la compilación nativa: `pnpm approve-builds` y después `pnpm rebuild node-llama-cpp`.

    Use la CLI independiente para verificar la misma ruta del proveedor que utiliza el Gateway:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    Los valores numéricos de `local.contextSize` también orientan la asignación automática de capas de GPU de node-llama-cpp para que los pesos del modelo y el contexto de incrustación solicitado quepan conjuntamente. `openclaw memory status --deep` informa del último backend conocido de llama.cpp, el dispositivo, la descarga de procesamiento, el contexto solicitado y los datos de memoria con marca temporal después de que el entorno de ejecución se haya cargado; el estado pasivo no carga ningún modelo.

    Defina `provider: "local"` explícitamente para las incrustaciones GGUF locales. Se admiten `hf:` y referencias de modelos HTTP(S) para configuraciones locales explícitas (mediante la resolución de modelos de node-llama-cpp), pero no cambian el proveedor predeterminado.

  </Accordion>
</AccordionGroup>

### Tiempo de espera de las incrustaciones en línea

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  Sobrescribe el tiempo de espera de los lotes de incrustaciones en línea durante la indexación de la memoria.

Si no se define, se usa el valor predeterminado del proveedor: 600 segundos para proveedores locales o autoalojados como `local`, `ollama` y `lmstudio`, y 120 segundos para proveedores alojados. Aumente este valor cuando los lotes locales de incrustaciones limitados por la CPU funcionen correctamente, pero sean lentos.
</ParamField>

---

## Comportamiento de la indexación

Todo se encuentra bajo `memorySearch.sync`, salvo que se indique lo contrario:

| Clave                          | Tipo      | Valor predeterminado | Descripción                                                                    |
| ------------------------------ | --------- | -------------------- | ------------------------------------------------------------------------------ |
| `onSessionStart`               | `boolean` | `true`  | Sincroniza el índice de memoria cuando se inicia una sesión                    |
| `onSearch`                     | `boolean` | `true`  | Sincroniza de forma diferida al buscar tras detectar cambios en el contenido   |
| `watch`                        | `boolean` | `true`  | Supervisa los archivos de memoria (chokidar) y programa la reindexación cuando cambian |
| `watchDebounceMs`              | `number`  | `1500`  | Ventana de antirrebote para agrupar eventos rápidos de supervisión de archivos |
| `intervalMinutes`              | `number`  | `0`     | Intervalo de reindexación periódica en minutos (`0` lo desactiva) |
| `sessions.postCompactionForce` | `boolean` | `true`  | Fuerza la reindexación de una sesión tras actualizaciones de la transcripción provocadas por Compaction |

<ParamField path="chunking.tokens" type="number">
  Tamaño de los fragmentos en tokens utilizado al dividir las fuentes de memoria antes de generar las incrustaciones (valor predeterminado: 400).
</ParamField>
<ParamField path="chunking.overlap" type="number">
  Solapamiento de tokens entre fragmentos adyacentes para conservar el contexto cerca de los límites de división (valor predeterminado: 80).
</ParamField>

<Note>
Cambiar `chunking.tokens` o `chunking.overlap` modifica los límites de los fragmentos e invalida la identidad del índice existente (consulte la advertencia en Selección del proveedor).
</Note>

---

## Configuración de la búsqueda híbrida

Todo se encuentra bajo `memorySearch.query`:

| Clave        | Tipo     | Valor predeterminado | Descripción                                                     |
| ------------ | -------- | -------------------- | --------------------------------------------------------------- |
| `maxResults` | `number` | `6`     | Número máximo de resultados de memoria devueltos antes de la inyección |
| `minScore`   | `number` | `0.35`  | Puntuación mínima de relevancia para incluir un resultado       |

Y bajo `memorySearch.query.hybrid`:

| Clave                 | Tipo      | Valor predeterminado | Descripción                                 |
| --------------------- | --------- | -------------------- | ------------------------------------------- |
| `enabled`             | `boolean` | `true`  | Activa la búsqueda híbrida BM25 + vectorial |
| `vectorWeight`        | `number`  | `0.7`   | Peso de las puntuaciones vectoriales (0-1)  |
| `textWeight`          | `number`  | `0.3`   | Peso de las puntuaciones BM25 (0-1)         |
| `candidateMultiplier` | `number`  | `4`     | Multiplicador del tamaño del conjunto de candidatos |

<Tabs>
  <Tab title="MMR (diversidad)">
    | Clave         | Tipo      | Valor predeterminado | Descripción                              |
    | ------------- | --------- | -------------------- | ---------------------------------------- |
    | `mmr.enabled` | `boolean` | `false` | Activa la reclasificación mediante MMR   |
    | `mmr.lambda`  | `number`  | `0.7`   | 0 = diversidad máxima, 1 = relevancia máxima |
  </Tab>
  <Tab title="Decaimiento temporal (actualidad)">
    | Clave                        | Tipo      | Valor predeterminado | Descripción                                  |
    | ---------------------------- | --------- | -------------------- | -------------------------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false` | Activa el refuerzo por actualidad            |
    | `temporalDecay.halfLifeDays` | `number`  | `30`    | La puntuación se reduce a la mitad cada N días |

    Los archivos perennes (`MEMORY.md` y los archivos sin fecha de `memory/`) nunca sufren decaimiento.

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

| Clave        | Tipo       | Descripción                                      |
| ------------ | ---------- | ------------------------------------------------ |
| `extraPaths` | `string[]` | Directorios o archivos adicionales que se indexarán |

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

Las rutas pueden ser absolutas o relativas al espacio de trabajo. Los directorios se examinan recursivamente en busca de archivos `.md`. La gestión de enlaces simbólicos depende del backend activo: el motor integrado omite los enlaces simbólicos, mientras que QMD sigue el comportamiento del analizador QMD subyacente.

Para realizar búsquedas de transcripciones entre agentes en el ámbito de un agente, use `agents.list[].memorySearch.qmd.extraCollections` en lugar de `memory.qmd.paths`. Esas colecciones adicionales siguen la misma estructura de `{ path, name, pattern? }`, pero se combinan por agente y pueden conservar nombres compartidos explícitos cuando la ruta apunta fuera del espacio de trabajo actual. Si la misma ruta resuelta aparece tanto en `memory.qmd.paths` como en `memorySearch.qmd.extraCollections`, QMD conserva la primera entrada y omite la duplicada.

---

## Memoria multimodal (Gemini)

Indexe imágenes y audio junto con Markdown mediante Gemini Embedding 2:

| Clave                     | Tipo       | Predeterminado | Descripción                                      |
| ------------------------- | ---------- | -------------- | ------------------------------------------------ |
| `multimodal.enabled`      | `boolean`  | `false`    | Habilitar la indexación multimodal               |
| `multimodal.modalities`   | `string[]` | --             | `["image"]`, `["audio"]` o `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10485760` | Tamaño máximo de archivo para la indexación (10 MiB) |

<Note>
Solo se aplica a los archivos de `extraPaths`. Las raíces de memoria predeterminadas siguen admitiendo únicamente Markdown. Requiere `gemini-embedding-2-preview`. `fallback` debe ser `"none"`.
</Note>

Formatos compatibles: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (imágenes); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (audio).

---

## Caché de embeddings

| Clave              | Tipo      | Predeterminado | Descripción                                      |
| ------------------ | --------- | -------------- | ------------------------------------------------ |
| `cache.enabled`    | `boolean` | `true`  | Almacenar en caché los embeddings de fragmentos en SQLite |
| `cache.maxEntries` | `number`  | sin definir    | Límite superior aproximado de embeddings en caché |

Evita volver a generar los embeddings de texto sin cambios durante la reindexación o las actualizaciones de transcripciones. Deje `maxEntries` sin definir para disponer de una caché ilimitada; establézcalo cuando el crecimiento del disco sea más importante que la velocidad máxima de reindexación. Cuando se establece, las entradas más antiguas (según la hora de la última actualización) se eliminan primero una vez que la caché supera el límite.

---

## Indexación por lotes

| Clave                         | Tipo      | Predeterminado | Descripción                    |
| ----------------------------- | --------- | -------------- | ------------------------------ |
| `remote.nonBatchConcurrency`  | `number`  | `4`     | Embeddings en línea paralelos  |
| `remote.batch.enabled`        | `boolean` | `false` | Habilitar la API de embeddings por lotes |
| `remote.batch.concurrency`    | `number`  | `2`     | Trabajos por lotes paralelos   |
| `remote.batch.wait`           | `boolean` | `true`  | Esperar a que finalice el lote |
| `remote.batch.pollIntervalMs` | `number`  | `2000`  | Intervalo de sondeo            |
| `remote.batch.timeoutMinutes` | `number`  | `60`    | Tiempo de espera del lote      |

Disponible para `gemini`, `openai` y `voyage`. El procesamiento por lotes de OpenAI suele ser el más rápido y económico para grandes cargas históricas.

`remote.nonBatchConcurrency` controla las llamadas de embeddings en línea utilizadas por proveedores locales o autoalojados y por proveedores alojados cuando las API de procesamiento por lotes del proveedor no están activas. Ollama utiliza de forma predeterminada `1` para la indexación sin lotes a fin de evitar sobrecargar los hosts locales más pequeños; establezca un valor mayor en máquinas más potentes.

Esto es independiente de `sync.embeddingBatchTimeoutSeconds`, que controla el tiempo de espera de las llamadas de embeddings en línea.

---

## Búsqueda en la memoria de sesiones (experimental)

Indexe las transcripciones de sesiones y muéstrelas mediante `memory_search`:

| Clave                         | Tipo       | Predeterminado | Descripción                                      |
| ----------------------------- | ---------- | -------------- | ------------------------------------------------ |
| `experimental.sessionMemory`  | `boolean`  | `false`      | Habilitar la indexación de sesiones              |
| `sources`                     | `string[]` | `["memory"]` | Añadir `"sessions"` para incluir transcripciones |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | Umbral de bytes para la reindexación             |
| `sync.sessions.deltaMessages` | `number`   | `50`         | Umbral de mensajes para la reindexación          |

<Warning>
La indexación de sesiones es opcional y se ejecuta de forma asíncrona. Los resultados pueden estar ligeramente desactualizados. Los registros de sesiones se almacenan en el disco, por lo que el acceso al sistema de archivos debe considerarse el límite de confianza.
</Warning>

Las coincidencias de transcripciones de sesiones también obedecen a
[`tools.sessions.visibility`](/es/gateway/config-tools#toolssessions). La visibilidad predeterminada
`tree` solo expone la sesión actual y las sesiones que esta inició. Para
recuperar desde otra sesión, como un mensaje directo, una sesión no relacionada del
mismo agente despachada por el Gateway, amplíe deliberadamente la visibilidad a `agent` (o a `all` solo
cuando también se requiera la recuperación entre agentes y la política entre agentes lo permita).

Los ejemplos siguientes colocan estos ajustes en `agents.defaults`. También se pueden
aplicar ajustes equivalentes de `memorySearch` en una configuración específica por agente cuando solo un
agente deba indexar y buscar transcripciones de sesiones.

Para la recuperación del Gateway a mensajes directos del mismo agente:

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

Al utilizar QMD, `agents.defaults.memorySearch.experimental.sessionMemory` y
`sources: ["sessions"]` no exportan por sí solos las transcripciones a QMD. Establezca
también `memory.qmd.sessions.enabled: true`.

---

## Aceleración vectorial de SQLite (sqlite-vec)

| Clave                        | Tipo      | Predeterminado | Descripción                                  |
| ---------------------------- | --------- | -------------- | -------------------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`  | Usar sqlite-vec para las consultas vectoriales |
| `store.vector.extensionPath` | `string`  | incluido       | Sobrescribir la ruta de sqlite-vec           |

Cuando sqlite-vec no está disponible, OpenClaw recurre automáticamente a la similitud del coseno dentro del proceso.

---

## Almacenamiento del índice

Los índices de memoria integrados se almacenan en la base de datos SQLite de OpenClaw de cada agente en
`agents/<agentId>/agent/openclaw-agent.sqlite`.

| Clave                 | Tipo     | Predeterminado | Descripción                                  |
| --------------------- | -------- | -------------- | -------------------------------------------- |
| `store.fts.tokenizer` | `string` | `unicode61` | Tokenizador FTS5 (`unicode61` o `trigram`) |

---

## Configuración del backend QMD

Establezca `memory.backend = "qmd"` para habilitarlo. Todos los ajustes de QMD se encuentran en `memory.qmd`:

| Clave                    | Tipo      | Predeterminado | Descripción                                                                           |
| ------------------------ | --------- | -------------- | ------------------------------------------------------------------------------------- |
| `command`                | `string`  | `qmd`    | Ruta del ejecutable QMD; establezca una ruta absoluta cuando el `PATH` del servicio difiera del de su shell |
| `searchMode`             | `string`  | `search` | Comando de búsqueda: `search`, `vsearch`, `query`                            |
| `rerank`                 | `boolean` | --             | Establecer en `false` con `searchMode: "query"` y QMD 2.1+ para omitir la reclasificación de QMD |
| `includeDefaultMemory`   | `boolean` | `true`   | Indexar automáticamente `MEMORY.md` + `memory/**/*.md`                               |
| `paths[]`                | `array`   | --             | Rutas adicionales: `{ name, path, pattern? }`                                        |
| `sessions.enabled`       | `boolean` | `false`  | Exportar las transcripciones de sesiones a QMD                               |
| `sessions.retentionDays` | `number`  | --             | Retención de transcripciones                                                  |
| `sessions.exportDir`     | `string`  | --             | Directorio de exportación                                                     |

`searchMode: "search"` utiliza únicamente búsqueda léxica/BM25. OpenClaw no ejecuta sondeos de disponibilidad de vectores semánticos ni mantenimiento de embeddings de QMD para ese modo, ni siquiera durante `memory status --deep`; `vsearch` y `query` siguen requiriendo que los vectores y embeddings de QMD estén disponibles.

`rerank: false` solo cambia el modo `query` de QMD y requiere QMD 2.1 o posterior. En el modo CLI directo, OpenClaw pasa `--no-rerank`; en el modo MCP respaldado por mcporter, pasa `rerank: false` a la herramienta de consultas unificada de QMD. Déjelo sin definir para utilizar el comportamiento predeterminado de reclasificación de consultas de QMD.

OpenClaw prefiere las formas actuales de colecciones y consultas MCP de QMD, pero mantiene la compatibilidad con versiones anteriores de QMD probando indicadores de patrones de colecciones compatibles y nombres antiguos de herramientas MCP cuando es necesario. Cuando QMD anuncia que admite varios filtros de colecciones, las colecciones de la misma fuente se buscan mediante un único proceso de QMD; las compilaciones anteriores de QMD mantienen la ruta de compatibilidad por colección. «Misma fuente» significa que las colecciones de memoria duradera (los archivos de memoria predeterminados y las rutas personalizadas) se agrupan, mientras que las colecciones de transcripciones de sesiones permanecen en un grupo independiente para que la diversificación de fuentes siga disponiendo de ambas entradas.

<Note>
Las sobrescrituras de modelos de QMD permanecen del lado de QMD, no en la configuración de OpenClaw. Si necesita sobrescribir globalmente los modelos de QMD, establezca variables de entorno como `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` y `QMD_GENERATE_MODEL` en el entorno de ejecución del Gateway.
</Note>

### Integración con mcporter

Todo se configura en `memory.qmd.mcporter`. Enruta las búsquedas de QMD a través de un daemon MCP `mcporter` de larga duración en lugar de iniciar `qmd` para cada consulta, lo que reduce la sobrecarga del arranque en frío para los modelos de mayor tamaño.

| Clave         | Tipo      | Predeterminado | Descripción                                                            |
| ------------- | --------- | -------------- | ---------------------------------------------------------------------- |
| `enabled`     | `boolean` | `false` | Enrutar las llamadas a QMD a través de mcporter en lugar de iniciar `qmd` por solicitud |
| `serverName`  | `string`  | `qmd`   | Nombre del servidor mcporter que ejecuta `qmd mcp` con `lifecycle: keep-alive` |
| `startDaemon` | `boolean` | `true`  | Iniciar automáticamente el daemon de mcporter cuando `enabled` sea verdadero |

Requiere que `mcporter` esté instalado y disponible en PATH, además de un servidor mcporter configurado que ejecute `qmd mcp`. Manténgalo deshabilitado en configuraciones locales más sencillas donde el coste de iniciar un proceso por consulta sea aceptable.

<AccordionGroup>
  <Accordion title="Frecuencia de actualización">
    | Clave                       | Tipo      | Valor predeterminado | Descripción                           |
    | --------------------------- | --------- | -------- | ---------------------------------------- |
    | `update.interval`         | `string`  | `5m`    | Intervalo de actualización                      |
    | `update.debounceMs`       | `number`  | `15000` | Antirrebote de los cambios en archivos                 |
    | `update.onBoot`           | `boolean` | `true`  | Actualizar cuando se abra el administrador QMD de larga duración; establecer en false para omitir la actualización inmediata al arrancar |
    | `update.startup`          | `string`  | `off`   | Inicialización opcional de QMD al iniciar el Gateway: `off`, `idle` o `immediate` |
    | `update.startupDelayMs`   | `number`  | `120000` | Retraso antes de ejecutar la actualización de `startup: "idle"` |
    | `update.waitForBootSync`  | `boolean` | `false` | Bloquear la apertura del administrador hasta que finalice su actualización inicial |
    | `update.embedInterval`    | `string`  | `60m`   | Frecuencia de incrustación independiente                |
    | `update.commandTimeoutMs` | `number`  | `30000` | Tiempo de espera de los comandos de mantenimiento de QMD (listar/añadir colecciones) |
    | `update.updateTimeoutMs`  | `number`  | `120000` | Tiempo de espera de cada ciclo de `qmd update`   |
    | `update.embedTimeoutMs`   | `number`  | `120000` | Tiempo de espera de cada ciclo de `qmd embed`    |
  </Accordion>
  <Accordion title="Límites">
    | Clave                       | Tipo     | Valor predeterminado | Descripción                |
    | --------------------------- | -------- | ------- | ------------------------------ |
    | `limits.maxResults`       | `number` | `4`     | Número máximo de resultados de búsqueda         |
    | `limits.maxSnippetChars`  | `number` | `450`   | Limitar la longitud de los fragmentos       |
    | `limits.maxInjectedChars` | `number` | `2200`  | Limitar el total de caracteres inyectados |
    | `limits.timeoutMs`        | `number` | `4000`  | Tiempo de espera de los comandos QMD durante una búsqueda respaldada por QMD, incluido `memory_search`; la configuración, la sincronización, la reserva integrada y el trabajo complementario conservan el plazo predeterminado de la herramienta |
  </Accordion>
  <Accordion title="Ámbito">
    Controla qué sesiones pueden recibir resultados de búsqueda de QMD. Usa el mismo esquema que [`session.sendPolicy`](/es/gateway/config-agents#session):

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

    El valor predeterminado distribuido permite únicamente los mensajes directos y deniega los grupos y otros tipos de canal. `match.keyPrefix` coincide con la clave de sesión normalizada; `match.rawKeyPrefix` coincide con la clave sin procesar, incluido `agent:<id>:`.

  </Accordion>
  <Accordion title="Citas">
    `memory.citations` se aplica a todos los backends:

    | Valor            | Comportamiento                                            |
    | ------------------ | ------------------------------------------------------ |
    | `auto` (predeterminado) | Incluir el pie `Source: <path#line>` en los fragmentos    |
    | `on`             | Incluir siempre el pie                               |
    | `off`            | Omitir el pie (la ruta se sigue pasando internamente al agente) |

  </Accordion>
</AccordionGroup>

Cuando está habilitada la inicialización de QMD al iniciar el Gateway, OpenClaw inicia QMD únicamente para los agentes aptos. Si `update.onBoot` es true y no se ha configurado ningún mantenimiento por intervalos ni de incrustaciones, el inicio utiliza un administrador de una sola ejecución para la actualización de arranque y después lo cierra. Si se configura un intervalo de actualización o de incrustación, el inicio abre el administrador QMD de larga duración para que pueda controlar el observador y los temporizadores de intervalo; `update.onBoot: false` omite únicamente la actualización inmediata al arrancar.

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

Dreaming se ejecuta como un único barrido programado y utiliza internamente fases ligera, profunda y REM como detalle de implementación.

Para consultar el comportamiento conceptual y los comandos con barra, véase [Dreaming](/es/concepts/dreaming).

### Configuración del usuario

| Clave                                    | Tipo      | Valor predeterminado       | Descripción                                                                                                                      |
| -------------------------------------- | --------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                              | `boolean` | `false`       | Habilitar o deshabilitar Dreaming por completo                                                                                              |
| `frequency`                            | `string`  | `0 3 * * *`   | Frecuencia Cron opcional para el barrido completo de Dreaming                                                                                |
| `model`                                | `string`  | modelo predeterminado | Sustitución opcional del modelo del subagente Dream Diary                                                                                     |
| `phases.deep.maxPromotedSnippetTokens` | `number`  | `160`         | Número máximo estimado de tokens conservados de cada fragmento de recuerdo a corto plazo promovido a `MEMORY.md`; los metadatos de procedencia permanecen visibles |

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
- `dreaming.model` utiliza el control de confianza existente para subagentes de plugins; establezca `plugins.entries.memory-core.subagent.allowModelOverride: true` antes de habilitarlo.
- Dream Diary reintenta una vez con el modelo predeterminado de la sesión cuando el modelo configurado no está disponible. Los errores de confianza o de la lista de permitidos se registran y no se reintentan silenciosamente.
- La política y los umbrales de las fases ligera, profunda y REM son comportamientos internos, no configuraciones orientadas al usuario.

</Note>

## Contenido relacionado

- [Referencia de configuración](/es/gateway/configuration-reference)
- [Descripción general de la memoria](/es/concepts/memory)
- [Búsqueda en memoria](/es/concepts/memory-search)
