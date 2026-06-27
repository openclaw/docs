---
read_when:
    - Quieres configurar proveedores de búsqueda de memoria o modelos de embeddings
    - Quieres configurar el backend de QMD
    - Quieres ajustar la búsqueda híbrida, MMR o el decaimiento temporal
    - Quiere habilitar la indexación de memoria multimodal
sidebarTitle: Memory config
summary: Todas las opciones de configuración para búsqueda en memoria, proveedores de embeddings, QMD, búsqueda híbrida e indexación multimodal
title: Referencia de configuración de memoria
x-i18n:
    generated_at: "2026-06-27T12:52:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d8f5880fef3fbdf81e546b0309a0e53459bae47e16efd787f87e34050d8c7b1e
    source_path: reference/memory-config.md
    workflow: 16
---

Esta página enumera todos los controles de configuración para la búsqueda de memoria de OpenClaw. Para descripciones conceptuales, consulta:

<CardGroup cols={2}>
  <Card title="Descripción general de la memoria" href="/es/concepts/memory">
    Cómo funciona la memoria.
  </Card>
  <Card title="Motor integrado" href="/es/concepts/memory-builtin">
    Backend SQLite predeterminado.
  </Card>
  <Card title="Motor QMD" href="/es/concepts/memory-qmd">
    Componente auxiliar con prioridad local.
  </Card>
  <Card title="Búsqueda de memoria" href="/es/concepts/memory-search">
    Canalización de búsqueda y ajuste.
  </Card>
  <Card title="Active Memory" href="/es/concepts/active-memory">
    Subagente de memoria para sesiones interactivas.
  </Card>
</CardGroup>

Todas las opciones de búsqueda de memoria se encuentran en `agents.defaults.memorySearch` en `openclaw.json`, salvo que se indique lo contrario.

<Note>
Si buscas el conmutador de la función **Active Memory** y la configuración del subagente, eso se encuentra en `plugins.entries.active-memory` en lugar de `memorySearch`.

Active Memory usa un modelo de dos compuertas:

1. el Plugin debe estar habilitado y apuntar al id del agente actual
2. la solicitud debe ser una sesión de chat persistente interactiva apta

Consulta [Active Memory](/es/concepts/active-memory) para ver el modelo de activación, la configuración propiedad del Plugin, la persistencia de transcripciones y el patrón de despliegue seguro.
</Note>

---

## Selección de proveedor

| Clave      | Tipo      | Predeterminado        | Descripción                                                                                                                                                                                                                                                                                    |
| ---------- | --------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | `"openai"`            | ID de adaptador de embeddings como `bedrock`, `deepinfra`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai`, `openai-compatible` o `voyage`; también puede ser un `models.providers.<id>` configurado cuyo `api` apunte a un adaptador de embeddings de memoria o a una API de modelo compatible con OpenAI |
| `model`    | `string`  | predeterminado del proveedor | Nombre del modelo de embeddings                                                                                                                                                                                                                                                                |
| `fallback` | `string`  | `"none"`              | ID del adaptador de reserva cuando el principal falla                                                                                                                                                                                                                                          |
| `enabled`  | `boolean` | `true`                | Habilita o deshabilita la búsqueda de memoria                                                                                                                                                                                                                                                  |

Cuando `provider` no está definido, OpenClaw usa embeddings de OpenAI. Define `provider`
explícitamente para usar Gemini, Voyage, Mistral, DeepInfra, Bedrock, GitHub Copilot,
Ollama, un modelo GGUF local o un endpoint `/v1/embeddings` compatible con OpenAI.
Las configuraciones heredadas que aún dicen `provider: "auto"` se resuelven como `openai`.

<Warning>
Cambiar el proveedor de embeddings, el modelo, la configuración del proveedor, las fuentes, el alcance,
la fragmentación o el tokenizer puede hacer que el índice vectorial SQLite existente sea incompatible.
OpenClaw pausa la búsqueda vectorial e informa una advertencia de identidad de índice en lugar de
volver a generar automáticamente todos los embeddings. Reconstrúyelo cuando estés listo con
`openclaw memory status --index --agent <id>` o
`openclaw memory index --force --agent <id>`.
</Warning>

Cuando `provider` no está definido, existe el `provider: "auto"` heredado o
`provider: "none"` selecciona intencionalmente el modo solo FTS, la recuperación de memoria aún puede
usar la clasificación FTS léxica cuando los embeddings no están disponibles.

Los proveedores explícitos no locales fallan de forma cerrada. Si defines `memorySearch.provider` como
un proveedor concreto con respaldo remoto, como OpenAI, Gemini, Voyage, Mistral,
Bedrock, GitHub Copilot, DeepInfra, Ollama, LM Studio o un proveedor personalizado
compatible con OpenAI, y ese proveedor no está disponible en tiempo de ejecución, `memory_search`
devuelve un resultado no disponible en lugar de usar silenciosamente la recuperación solo FTS. Corrige la
configuración del proveedor o de autenticación, cambia a un proveedor accesible o define
`provider: "none"` si quieres una recuperación solo FTS deliberada.

### IDs de proveedor personalizados

`memorySearch.provider` puede apuntar a una entrada personalizada `models.providers.<id>` para adaptadores de proveedor específicos de memoria como `ollama`, o para APIs de modelo compatibles con OpenAI como `openai-responses` / `openai-completions`. OpenClaw resuelve el propietario `api` de ese proveedor para el adaptador de embeddings mientras conserva el id de proveedor personalizado para el manejo de endpoint, autenticación y prefijos de modelo. Esto permite que las configuraciones multi-GPU o multi-host dediquen los embeddings de memoria a un endpoint local específico:

```json5
{
  models: {
    providers: {
      "ollama-5080": {
        api: "ollama",
        baseUrl: "http://gpu-box.local:11435",
        apiKey: "ollama-local",
        models: [{ id: "qwen3-embedding:0.6b" }],
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

Los embeddings remotos requieren una clave de API. Bedrock usa en su lugar la cadena de credenciales predeterminada del SDK de AWS (roles de instancia, SSO, claves de acceso).

| Proveedor      | Variable de entorno                              | Clave de configuración             |
| -------------- | ------------------------------------------------ | ---------------------------------- |
| Bedrock        | cadena de credenciales de AWS                    | No se necesita clave de API        |
| DeepInfra      | `DEEPINFRA_API_KEY`                              | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                 | `models.providers.google.apiKey`   |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | Perfil de autenticación mediante inicio de sesión de dispositivo |
| Mistral        | `MISTRAL_API_KEY`                                | `models.providers.mistral.apiKey`  |
| Ollama         | `OLLAMA_API_KEY` (marcador de posición)          | --                                 |
| OpenAI         | `OPENAI_API_KEY`                                 | `models.providers.openai.apiKey`   |
| Voyage         | `VOYAGE_API_KEY`                                 | `models.providers.voyage.apiKey`   |

<Note>
OAuth de Codex cubre solo chat/completions y no satisface solicitudes de embeddings.
</Note>

---

## Configuración de endpoint remoto

Usa `provider: "openai-compatible"` para un servidor genérico
`/v1/embeddings` compatible con OpenAI que no deba heredar las credenciales globales de chat de OpenAI.

<ParamField path="remote.baseUrl" type="string">
  URL base personalizada de la API.
</ParamField>
<ParamField path="remote.apiKey" type="string">
  Sobrescribe la clave de API.
</ParamField>
<ParamField path="remote.headers" type="object">
  Cabeceras HTTP adicionales (combinadas con los valores predeterminados del proveedor).
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

## Configuración específica por proveedor

<AccordionGroup>
  <Accordion title="Gemini">
    | Clave                  | Tipo     | Predeterminado         | Descripción                                 |
    | ---------------------- | -------- | ---------------------- | ------------------------------------------- |
    | `model`                | `string` | `gemini-embedding-001` | También admite `gemini-embedding-2-preview` |
    | `outputDimensionality` | `number` | `3072`                 | Para Embedding 2: 768, 1536 o 3072          |

    <Warning>
    Cambiar el modelo o `outputDimensionality` cambia la identidad del índice. OpenClaw
    pausa la búsqueda vectorial hasta que reconstruyas explícitamente el índice de memoria.
    </Warning>

  </Accordion>
  <Accordion title="Tipos de entrada compatibles con OpenAI">
    Los endpoints de embeddings compatibles con OpenAI pueden optar por campos de solicitud `input_type` específicos del proveedor. Esto es útil para modelos de embeddings asimétricos que requieren etiquetas diferentes para embeddings de consulta y de documento.

    | Clave               | Tipo     | Predeterminado | Descripción                                                    |
    | ------------------- | -------- | -------------- | -------------------------------------------------------------- |
    | `inputType`         | `string` | sin definir    | `input_type` compartido para embeddings de consulta y documento |
    | `queryInputType`    | `string` | sin definir    | `input_type` en tiempo de consulta; sobrescribe `inputType`    |
    | `documentInputType` | `string` | sin definir    | `input_type` de índice/documento; sobrescribe `inputType`      |

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

    Cambiar estos valores afecta la identidad de la caché de embeddings para la indexación por lotes del proveedor y debe ir seguido de una reindexación de memoria cuando el modelo ascendente trate las etiquetas de forma diferente.

  </Accordion>
  <Accordion title="Bedrock">
    ### Configuración de embeddings de Bedrock

    Bedrock usa la cadena de credenciales predeterminada del SDK de AWS; no se necesitan claves de API. Si OpenClaw se ejecuta en EC2 con un rol de instancia habilitado para Bedrock, basta con definir el proveedor y el modelo:

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

    | Clave                  | Tipo     | Predeterminado               | Descripción                         |
    | ---------------------- | -------- | ----------------------------- | ----------------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | Cualquier ID de modelo de embeddings de Bedrock |
    | `outputDimensionality` | `number` | predeterminado del modelo     | Para Titan V2: 256, 512 o 1024      |

    **Modelos admitidos** (con detección de familia y valores predeterminados de dimensión):

    | ID de modelo                               | Proveedor  | Dimensiones predeterminadas | Dimensiones configurables |
    | ------------------------------------------ | ---------- | ------------ | -------------------- |
    | `amazon.titan-embed-text-v2:0`             | Amazon     | 1024         | 256, 512, 1024       |
    | `amazon.titan-embed-text-v1`               | Amazon     | 1536         | --                   |
    | `amazon.titan-embed-g1-text-02`            | Amazon     | 1536         | --                   |
    | `amazon.titan-embed-image-v1`              | Amazon     | 1024         | --                   |
    | `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon     | 1024         | 256, 384, 1024, 3072 |
    | `cohere.embed-english-v3`                  | Cohere     | 1024         | --                   |
    | `cohere.embed-multilingual-v3`             | Cohere     | 1024         | --                   |
    | `cohere.embed-v4:0`                        | Cohere     | 1536         | 256-1536             |
    | `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs | 512          | --                   |
    | `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs | 1024         | --                   |

    Las variantes con sufijo de rendimiento (por ejemplo, `amazon.titan-embed-text-v1:2:8k`) heredan la configuración del modelo base.

    **Autenticación:** la autenticación de Bedrock usa el orden estándar de resolución de credenciales del SDK de AWS:

    1. Variables de entorno (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
    2. Caché de tokens SSO
    3. Credenciales de token de identidad web
    4. Archivos compartidos de credenciales y configuración
    5. Credenciales de metadatos de ECS o EC2

    La región se resuelve desde `AWS_REGION`, `AWS_DEFAULT_REGION`, el `baseUrl` del proveedor `amazon-bedrock`, o usa `us-east-1` de forma predeterminada.

    **Permisos de IAM:** el rol o usuario de IAM necesita:

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    Para privilegios mínimos, delimita `InvokeModel` al modelo específico:

    ```
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="Local (GGUF + llama.cpp)">
    | Clave                 | Tipo               | Predeterminado        | Descripción                                                                                                                                                                                                                                                                                                          |
    | --------------------- | ------------------ | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | descargado automáticamente | Ruta al archivo de modelo GGUF                                                                                                                                                                                                                                                                                       |
    | `local.modelCacheDir` | `string`           | predeterminado de node-llama-cpp | Directorio de caché para los modelos descargados                                                                                                                                                                                                                                                                     |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | Tamaño de la ventana de contexto para el contexto de embeddings. 4096 cubre fragmentos típicos (128–512 tokens) y limita la VRAM no destinada a pesos. Redúcelo a 1024–2048 en hosts limitados. `"auto"` usa el máximo entrenado del modelo: no se recomienda para modelos de 8B+ (Qwen3-Embedding-8B: 40 960 tokens → ~32 GB de VRAM frente a ~8.8 GB con 4096). |

    Instala primero el proveedor oficial de llama.cpp: `openclaw plugins install @openclaw/llama-cpp-provider`.
    Modelo predeterminado: `embeddinggemma-300m-qat-Q8_0.gguf` (~0.6 GB, descargado automáticamente). Los checkouts de código fuente aún requieren aprobación de compilación nativa: `pnpm approve-builds` y luego `pnpm rebuild node-llama-cpp`.

    Usa la CLI independiente para verificar la misma ruta de proveedor que usa el Gateway:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    Define `provider: "local"` explícitamente para embeddings GGUF locales. Las referencias de modelo `hf:` y HTTP(S) son compatibles con configuraciones locales explícitas, pero no cambian el proveedor predeterminado.

  </Accordion>
</AccordionGroup>

### Tiempo de espera de embeddings en línea

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  Sobrescribe el tiempo de espera para lotes de embeddings en línea durante la indexación de memoria.

Sin definir, usa el valor predeterminado del proveedor: 600 segundos para proveedores locales/autoalojados como `local`, `ollama` y `lmstudio`, y 120 segundos para proveedores alojados. Aumenta esto cuando los lotes de embeddings locales limitados por CPU están sanos pero son lentos.
</ParamField>

---

## Configuración de búsqueda híbrida

Todo bajo `memorySearch.query.hybrid`:

| Clave                 | Tipo      | Predeterminado | Descripción                                      |
| --------------------- | --------- | ------- | ---------------------------------- |
| `enabled`             | `boolean` | `true`  | Habilitar búsqueda híbrida BM25 + vectorial |
| `vectorWeight`        | `number`  | `0.7`   | Peso para puntuaciones vectoriales (0-1)     |
| `textWeight`          | `number`  | `0.3`   | Peso para puntuaciones BM25 (0-1)       |
| `candidateMultiplier` | `number`  | `4`     | Multiplicador del tamaño del conjunto de candidatos     |

<Tabs>
  <Tab title="MMR (diversidad)">
    | Clave         | Tipo      | Predeterminado | Descripción                          |
    | ------------- | --------- | ------- | ------------------------------------ |
    | `mmr.enabled` | `boolean` | `false` | Habilitar reordenación MMR                |
    | `mmr.lambda`  | `number`  | `0.7`   | 0 = diversidad máxima, 1 = relevancia máxima |
  </Tab>
  <Tab title="Decaimiento temporal (recencia)">
    | Clave                        | Tipo      | Predeterminado | Descripción               |
    | ---------------------------- | --------- | ------- | ------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false` | Habilitar refuerzo por recencia      |
    | `temporalDecay.halfLifeDays` | `number`  | `30`    | La puntuación se reduce a la mitad cada N días |

    Los archivos persistentes (`MEMORY.md`, archivos sin fecha en `memory/`) nunca decaen.

  </Tab>
</Tabs>

### Ejemplo completo

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        query: {
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

| Clave        | Tipo       | Descripción                                  |
| ------------ | ---------- | -------------------------------------------- |
| `extraPaths` | `string[]` | Directorios o archivos adicionales que indexar |

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

Las rutas pueden ser absolutas o relativas al espacio de trabajo. Los directorios se escanean recursivamente en busca de archivos `.md`. El manejo de enlaces simbólicos depende del backend activo: el motor integrado ignora los enlaces simbólicos, mientras que QMD sigue el comportamiento del escáner QMD subyacente.

Para la búsqueda de transcripciones entre agentes con alcance de agente, usa `agents.list[].memorySearch.qmd.extraCollections` en lugar de `memory.qmd.paths`. Esas colecciones adicionales siguen la misma forma `{ path, name, pattern? }`, pero se combinan por agente y pueden conservar nombres compartidos explícitos cuando la ruta apunta fuera del espacio de trabajo actual. Si la misma ruta resuelta aparece tanto en `memory.qmd.paths` como en `memorySearch.qmd.extraCollections`, QMD conserva la primera entrada y omite el duplicado.

---

## Memoria multimodal (Gemini)

Indexa imágenes y audio junto con Markdown usando Gemini Embedding 2:

| Clave                     | Tipo       | Predeterminado | Descripción                              |
| ------------------------- | ---------- | -------------- | ---------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`        | Habilita la indexación multimodal        |
| `multimodal.modalities`   | `string[]` | --             | `["image"]`, `["audio"]` o `["all"]`     |
| `multimodal.maxFileBytes` | `number`   | `10000000`     | Tamaño máximo de archivo para indexación |

<Note>
Solo se aplica a archivos en `extraPaths`. Las raíces de memoria predeterminadas siguen siendo solo Markdown. Requiere `gemini-embedding-2-preview`. `fallback` debe ser `"none"`.
</Note>

Formatos compatibles: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (imágenes); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (audio).

---

## Caché de embeddings

| Clave              | Tipo      | Predeterminado | Descripción                         |
| ------------------ | --------- | -------------- | ----------------------------------- |
| `cache.enabled`    | `boolean` | `true`         | Almacena embeddings de fragmentos en caché en SQLite |
| `cache.maxEntries` | `number`  | `50000`        | Máximo de embeddings almacenados en caché |

Evita volver a generar embeddings para texto sin cambios durante la reindexación o las actualizaciones de transcripciones.

---

## Indexación por lotes

| Clave                         | Tipo      | Predeterminado | Descripción                         |
| ----------------------------- | --------- | -------------- | ----------------------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`            | Embeddings inline en paralelo       |
| `remote.batch.enabled`        | `boolean` | `false`        | Habilita la API de embeddings por lotes |
| `remote.batch.concurrency`    | `number`  | `2`            | Trabajos por lotes en paralelo      |
| `remote.batch.wait`           | `boolean` | `true`         | Espera a que se complete el lote    |
| `remote.batch.pollIntervalMs` | `number`  | --             | Intervalo de sondeo                 |
| `remote.batch.timeoutMinutes` | `number`  | --             | Tiempo de espera del lote           |

Disponible para `openai`, `gemini` y `voyage`. El lote de OpenAI suele ser el más rápido y económico para grandes rellenos iniciales.

`remote.nonBatchConcurrency` controla las llamadas de embeddings inline usadas por proveedores locales/autohospedados y proveedores alojados cuando las API por lotes del proveedor no están activas. Ollama usa `1` de forma predeterminada para la indexación sin lotes para evitar sobrecargar hosts locales más pequeños; configura un valor más alto en máquinas más grandes.

Esto es independiente de `sync.embeddingBatchTimeoutSeconds`, que controla el tiempo de espera para las llamadas de embeddings inline.

---

## Búsqueda en memoria de sesiones (experimental)

Indexa transcripciones de sesiones y exponlas mediante `memory_search`:

| Clave                         | Tipo       | Predeterminado | Descripción                                |
| ----------------------------- | ---------- | -------------- | ------------------------------------------ |
| `experimental.sessionMemory`  | `boolean`  | `false`        | Habilita la indexación de sesiones         |
| `sources`                     | `string[]` | `["memory"]`   | Añade `"sessions"` para incluir transcripciones |
| `sync.sessions.deltaBytes`    | `number`   | `100000`       | Umbral de bytes para reindexación          |
| `sync.sessions.deltaMessages` | `number`   | `50`           | Umbral de mensajes para reindexación       |

<Warning>
La indexación de sesiones es opcional y se ejecuta de forma asíncrona. Los resultados pueden estar ligeramente desactualizados. Los registros de sesión residen en disco, así que trata el acceso al sistema de archivos como el límite de confianza.
</Warning>

---

## Aceleración vectorial de SQLite (sqlite-vec)

| Clave                        | Tipo      | Predeterminado | Descripción                               |
| ---------------------------- | --------- | -------------- | ----------------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`         | Usa sqlite-vec para consultas vectoriales |
| `store.vector.extensionPath` | `string`  | incluido       | Sobrescribe la ruta de sqlite-vec         |

Cuando sqlite-vec no está disponible, OpenClaw recurre automáticamente a la similitud coseno en proceso.

---

## Almacenamiento de índices

Los índices de memoria integrados viven en la base de datos SQLite de OpenClaw de cada agente en
`agents/<agentId>/agent/openclaw-agent.sqlite`.

| Clave                 | Tipo     | Predeterminado | Descripción                                  |
| --------------------- | -------- | -------------- | -------------------------------------------- |
| `store.fts.tokenizer` | `string` | `unicode61`    | Tokenizador FTS5 (`unicode61` o `trigram`)   |

---

## Configuración del backend QMD

Define `memory.backend = "qmd"` para habilitarlo. Todas las opciones de QMD viven bajo `memory.qmd`:

| Clave                    | Tipo      | Predeterminado | Descripción                                                                                  |
| ------------------------ | --------- | -------------- | -------------------------------------------------------------------------------------------- |
| `command`                | `string`  | `qmd`          | Ruta del ejecutable QMD; define una ruta absoluta cuando el `PATH` del servicio difiera de tu shell |
| `searchMode`             | `string`  | `search`       | Comando de búsqueda: `search`, `vsearch`, `query`                                            |
| `rerank`                 | `boolean` | --             | Define como `false` con `searchMode: "query"` y QMD 2.1+ para omitir el reordenamiento de QMD |
| `includeDefaultMemory`   | `boolean` | `true`         | Indexa automáticamente `MEMORY.md` + `memory/**/*.md`                                        |
| `paths[]`                | `array`   | --             | Rutas adicionales: `{ name, path, pattern? }`                                                |
| `sessions.enabled`       | `boolean` | `false`        | Indexa transcripciones de sesiones                                                          |
| `sessions.retentionDays` | `number`  | --             | Retención de transcripciones                                                                 |
| `sessions.exportDir`     | `string`  | --             | Directorio de exportación                                                                    |

`searchMode: "search"` es solo léxico/BM25. OpenClaw no ejecuta comprobaciones de preparación de vectores semánticos ni mantenimiento de embeddings de QMD para ese modo, incluso durante `memory status --deep`; `vsearch` y `query` siguen requiriendo preparación vectorial y embeddings de QMD.

`rerank: false` solo cambia el modo `query` de QMD y requiere QMD 2.1 o una versión más reciente. En modo CLI directo, OpenClaw pasa `--no-rerank`; en modo MCP respaldado por mcporter, pasa `rerank: false` a la herramienta de consulta unificada de QMD. Déjalo sin definir para usar el comportamiento predeterminado de reordenamiento de consultas de QMD.

OpenClaw prefiere las formas actuales de colección QMD y consulta MCP, pero mantiene funcionando las versiones anteriores de QMD probando indicadores de patrón de colección compatibles y nombres antiguos de herramientas MCP cuando es necesario. Cuando QMD anuncia compatibilidad con varios filtros de colección, las colecciones de la misma fuente se buscan con un único proceso QMD; las compilaciones anteriores de QMD mantienen la ruta de compatibilidad por colección. Misma fuente significa que las colecciones de memoria duradera se agrupan juntas, mientras que las colecciones de transcripciones de sesión permanecen en un grupo separado para que la diversificación de fuentes siga teniendo ambas entradas.

<Note>
Las sobrescrituras de modelos de QMD permanecen del lado de QMD, no en la configuración de OpenClaw. Si necesitas sobrescribir globalmente los modelos de QMD, define variables de entorno como `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` y `QMD_GENERATE_MODEL` en el entorno de ejecución del Gateway.
</Note>

<AccordionGroup>
  <Accordion title="Programación de actualizaciones">
    | Clave                     | Tipo      | Predeterminado | Descripción                           |
    | ------------------------- | --------- | -------------- | ------------------------------------- |
    | `update.interval`         | `string`  | `5m`           | Intervalo de actualización            |
    | `update.debounceMs`       | `number`  | `15000`        | Aplica debounce a cambios de archivos |
    | `update.onBoot`           | `boolean` | `true`         | Actualiza cuando se abre el administrador QMD de larga duración; define false para omitir la actualización inmediata al arrancar |
    | `update.startup`          | `string`  | `off`          | Inicialización QMD opcional al iniciar el Gateway: `off`, `idle` o `immediate` |
    | `update.startupDelayMs`   | `number`  | `120000`       | Retraso antes de que se ejecute la actualización de `startup: "idle"` |
    | `update.waitForBootSync`  | `boolean` | `false`        | Bloquea la apertura del administrador hasta que se complete su actualización inicial |
    | `update.embedInterval`    | `string`  | --             | Cadencia de embedding separada        |
    | `update.commandTimeoutMs` | `number`  | --             | Tiempo de espera para comandos QMD    |
    | `update.updateTimeoutMs`  | `number`  | --             | Tiempo de espera para operaciones de actualización QMD |
    | `update.embedTimeoutMs`   | `number`  | --             | Tiempo de espera para operaciones de embedding QMD |
  </Accordion>
  <Accordion title="Límites">
    | Clave                     | Tipo     | Predeterminado | Descripción                         |
    | ------------------------- | -------- | -------------- | ----------------------------------- |
    | `limits.maxResults`       | `number` | `6`            | Resultados de búsqueda máximos      |
    | `limits.maxSnippetChars`  | `number` | --             | Limita la longitud del fragmento    |
    | `limits.maxInjectedChars` | `number` | --             | Limita el total de caracteres inyectados |
    | `limits.timeoutMs`        | `number` | `4000`         | Tiempo de espera de búsqueda        |
  </Accordion>
  <Accordion title="Ámbito">
    Controla qué sesiones pueden recibir resultados de búsqueda de QMD. Mismo esquema que [`session.sendPolicy`](/es/gateway/config-agents#session):

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

    El valor predeterminado incluido permite sesiones directas y de canal, pero sigue denegando grupos.

    El valor predeterminado es solo DM. `match.keyPrefix` coincide con la clave de sesión normalizada; `match.rawKeyPrefix` coincide con la clave sin procesar, incluido `agent:<id>:`.

  </Accordion>
  <Accordion title="Citas">
    `memory.citations` se aplica a todos los backends:

    | Valor            | Comportamiento                                      |
    | ---------------- | --------------------------------------------------- |
    | `auto` (predeterminado) | Incluye el pie de página `Source: <path#line>` en fragmentos |
    | `on`             | Incluye siempre el pie de página                    |
    | `off`            | Omite el pie de página (la ruta aún se pasa internamente al agente) |

  </Accordion>
</AccordionGroup>

Cuando la inicialización QMD al iniciar el Gateway está habilitada, OpenClaw inicia QMD solo para los agentes elegibles. Si `update.onBoot` es true y no se configura mantenimiento de intervalos/embeddings, el inicio usa un administrador de una sola ejecución para la actualización de arranque y lo cierra. Si se configura un intervalo de actualización o embedding, el inicio abre el administrador QMD de larga duración para que pueda ser dueño del observador y los temporizadores de intervalo; `update.onBoot: false` omite solo la actualización inmediata al arrancar.

### Ejemplo completo de QMD

```json5
{
  memory: {
    backend: "qmd",
    citations: "auto",
    qmd: {
      includeDefaultMemory: true,
      update: { interval: "5m", debounceMs: 15000 },
      limits: { maxResults: 6, timeoutMs: 4000 },
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

Dreaming se configura bajo `plugins.entries.memory-core.config.dreaming`, no bajo `agents.defaults.memorySearch`.

Dreaming se ejecuta como un barrido programado y usa fases internas ligeras/profundas/REM como detalle de implementación.

Para el comportamiento conceptual y los comandos con barra, consulta [Dreaming](/es/concepts/dreaming).

### Configuración de usuario

| Clave                                  | Tipo      | Predeterminado     | Descripción                                                                                                                        |
| -------------------------------------- | --------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                              | `boolean` | `false`            | Habilita o deshabilita dreaming por completo                                                                                        |
| `frequency`                            | `string`  | `0 3 * * *`        | Cadencia cron opcional para el barrido completo de dreaming                                                                        |
| `model`                                | `string`  | modelo predeterminado | Sobrescritura opcional del modelo del subagente Dream Diary                                                                        |
| `phases.deep.maxPromotedSnippetTokens` | `number`  | `160`              | Máximo de tokens estimados conservados de cada fragmento de recuperación a corto plazo promovido a `MEMORY.md`; los metadatos de procedencia siguen visibles |

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
- Dreaming escribe el estado de máquina en `memory/.dreams/`.
- Dreaming escribe la salida narrativa legible por humanos en `DREAMS.md` (o el `dreams.md` existente).
- `dreaming.model` usa la puerta de confianza de subagente del Plugin existente; define `plugins.entries.memory-core.subagent.allowModelOverride: true` antes de habilitarlo.
- Dream Diary reintenta una vez con el modelo predeterminado de la sesión cuando el modelo configurado no está disponible. Los fallos de confianza o de lista de permitidos se registran y no se reintentan silenciosamente.
- La política y los umbrales de las fases ligera/profunda/REM son comportamiento interno, no configuración orientada al usuario.

</Note>

## Relacionado

- [Referencia de configuración](/es/gateway/configuration-reference)
- [Resumen de memoria](/es/concepts/memory)
- [Búsqueda de memoria](/es/concepts/memory-search)
