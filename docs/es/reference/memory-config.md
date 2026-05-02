---
read_when:
    - Quiere configurar proveedores de búsqueda de memoria o modelos de incrustación
    - Quieres configurar la parte del servidor de QMD
    - Quieres ajustar la búsqueda híbrida, MMR o el decaimiento temporal
    - Quieres habilitar la indexación de memoria multimodal
sidebarTitle: Memory config
summary: Todos los parámetros de configuración para la búsqueda de memoria, los proveedores de incrustaciones, QMD, la búsqueda híbrida y la indexación multimodal
title: Referencia de configuración de memoria
x-i18n:
    generated_at: "2026-05-02T05:35:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 11c4723b536338a777ec45673ca3c1a8c26834d6875dd4eb96617a570a55c5f5
    source_path: reference/memory-config.md
    workflow: 16
---

Esta página enumera todos los ajustes de configuración para la búsqueda de memoria de OpenClaw. Para obtener descripciones conceptuales, consulta:

<CardGroup cols={2}>
  <Card title="Descripción general de la memoria" href="/es/concepts/memory">
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

Todas las opciones de búsqueda de memoria están bajo `agents.defaults.memorySearch` en `openclaw.json`, salvo que se indique lo contrario.

<Note>
Si buscas el interruptor de la funcionalidad **active memory** y la configuración del subagente, eso se encuentra bajo `plugins.entries.active-memory` en lugar de `memorySearch`.

Active memory usa un modelo de dos puertas:

1. el plugin debe estar habilitado y apuntar al id del agente actual
2. la solicitud debe ser una sesión de chat interactiva persistente elegible

Consulta [Active Memory](/es/concepts/active-memory) para conocer el modelo de activación, la configuración propiedad del plugin, la persistencia de transcripciones y el patrón de despliegue seguro.
</Note>

---

## Selección del proveedor

| Clave      | Tipo      | Predeterminado          | Descripción                                                                                                                                                                                                                        |
| ---------- | --------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | detectado automáticamente | ID del adaptador de embeddings como `bedrock`, `deepinfra`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai` o `voyage`; también puede ser un `models.providers.<id>` configurado cuyo `api` apunte a uno de esos adaptadores |
| `model`    | `string`  | predeterminado del proveedor | Nombre del modelo de embeddings                                                                                                                                                                                                  |
| `fallback` | `string`  | `"none"`                | ID del adaptador de reserva cuando el principal falla                                                                                                                                                                             |
| `enabled`  | `boolean` | `true`                  | Habilita o deshabilita la búsqueda de memoria                                                                                                                                                                                     |

### Orden de detección automática

Cuando `provider` no está configurado, OpenClaw selecciona el primero disponible:

<Steps>
  <Step title="local">
    Se selecciona si `memorySearch.local.modelPath` está configurado y el archivo existe.
  </Step>
  <Step title="github-copilot">
    Se selecciona si se puede resolver un token de GitHub Copilot (variable de entorno o perfil de autenticación).
  </Step>
  <Step title="openai">
    Se selecciona si se puede resolver una clave de OpenAI.
  </Step>
  <Step title="gemini">
    Se selecciona si se puede resolver una clave de Gemini.
  </Step>
  <Step title="voyage">
    Se selecciona si se puede resolver una clave de Voyage.
  </Step>
  <Step title="mistral">
    Se selecciona si se puede resolver una clave de Mistral.
  </Step>
  <Step title="deepinfra">
    Se selecciona si se puede resolver una clave de DeepInfra.
  </Step>
  <Step title="bedrock">
    Se selecciona si la cadena de credenciales del AWS SDK se resuelve (rol de instancia, claves de acceso, perfil, SSO, identidad web o configuración compartida).
  </Step>
</Steps>

`ollama` es compatible, pero no se detecta automáticamente (configúralo explícitamente).

### ID de proveedor personalizados

`memorySearch.provider` puede apuntar a una entrada personalizada `models.providers.<id>`. OpenClaw resuelve el propietario de `api` de ese proveedor para el adaptador de embeddings mientras conserva el id de proveedor personalizado para el manejo de endpoint, autenticación y prefijo de modelo. Esto permite que las configuraciones multi-GPU o multi-host dediquen los embeddings de memoria a un endpoint local específico:

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

### Resolución de claves API

Los embeddings remotos requieren una clave API. Bedrock usa en su lugar la cadena de credenciales predeterminada del AWS SDK (roles de instancia, SSO, claves de acceso).

| Proveedor      | Variable de entorno                              | Clave de configuración                |
| -------------- | ------------------------------------------------ | ------------------------------------- |
| Bedrock        | Cadena de credenciales de AWS                    | No se necesita clave API              |
| DeepInfra      | `DEEPINFRA_API_KEY`                              | `models.providers.deepinfra.apiKey`   |
| Gemini         | `GEMINI_API_KEY`                                 | `models.providers.google.apiKey`      |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | Perfil de autenticación mediante inicio de sesión de dispositivo |
| Mistral        | `MISTRAL_API_KEY`                                | `models.providers.mistral.apiKey`     |
| Ollama         | `OLLAMA_API_KEY` (marcador de posición)          | --                                    |
| OpenAI         | `OPENAI_API_KEY`                                 | `models.providers.openai.apiKey`      |
| Voyage         | `VOYAGE_API_KEY`                                 | `models.providers.voyage.apiKey`      |

<Note>
Codex OAuth cubre solo chat/completions y no satisface solicitudes de embeddings.
</Note>

---

## Configuración de endpoint remoto

Para endpoints personalizados compatibles con OpenAI o para sobrescribir los valores predeterminados del proveedor:

<ParamField path="remote.baseUrl" type="string">
  URL base de API personalizada.
</ParamField>
<ParamField path="remote.apiKey" type="string">
  Sobrescribir la clave API.
</ParamField>
<ParamField path="remote.headers" type="object">
  Encabezados HTTP adicionales (fusionados con los valores predeterminados del proveedor).
</ParamField>

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
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
    | Clave                  | Tipo     | Predeterminado        | Descripción                                    |
    | ---------------------- | -------- | --------------------- | ---------------------------------------------- |
    | `model`                | `string` | `gemini-embedding-001` | También admite `gemini-embedding-2-preview`   |
    | `outputDimensionality` | `number` | `3072`                | Para Embedding 2: 768, 1536 o 3072             |

    <Warning>
    Cambiar el modelo o `outputDimensionality` activa una reindexación completa automática.
    </Warning>

  </Accordion>
  <Accordion title="Tipos de entrada compatibles con OpenAI">
    Los endpoints de embeddings compatibles con OpenAI pueden optar por campos de solicitud `input_type` específicos del proveedor. Esto es útil para modelos de embeddings asimétricos que requieren etiquetas diferentes para embeddings de consulta y de documento.

    | Clave               | Tipo     | Predeterminado | Descripción                                             |
    | ------------------- | -------- | -------------- | ------------------------------------------------------- |
    | `inputType`         | `string` | sin configurar | `input_type` compartido para embeddings de consulta y documento |
    | `queryInputType`    | `string` | sin configurar | `input_type` en tiempo de consulta; sobrescribe `inputType` |
    | `documentInputType` | `string` | sin configurar | `input_type` de índice/documento; sobrescribe `inputType` |

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "openai",
            remote: {
              baseUrl: "https://embeddings.example/v1",
              apiKey: "env:EMBEDDINGS_API_KEY",
            },
            model: "asymmetric-embedder",
            queryInputType: "query",
            documentInputType: "passage",
          },
        },
      },
    }
    ```

    Cambiar estos valores afecta la identidad de caché de embeddings para la indexación por lotes del proveedor y debe ir seguido de una reindexación de memoria cuando el modelo upstream trate las etiquetas de forma diferente.

  </Accordion>
  <Accordion title="Bedrock">
    Bedrock usa la cadena de credenciales predeterminada del AWS SDK; no se necesitan claves API. Si OpenClaw se ejecuta en EC2 con un rol de instancia habilitado para Bedrock, solo configura el proveedor y el modelo:

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

    | Clave                  | Tipo     | Predeterminado                | Descripción                     |
    | ---------------------- | -------- | ----------------------------- | ------------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | Cualquier ID de modelo de embeddings de Bedrock |
    | `outputDimensionality` | `number` | predeterminado del modelo     | Para Titan V2: 256, 512 o 1024 |

    **Modelos compatibles** (con detección de familia y dimensiones predeterminadas):

    | ID de modelo                               | Proveedor  | Dims predeterminadas | Dims configurables   |
    | ------------------------------------------ | ---------- | -------------------- | -------------------- |
    | `amazon.titan-embed-text-v2:0`             | Amazon     | 1024                 | 256, 512, 1024       |
    | `amazon.titan-embed-text-v1`               | Amazon     | 1536                 | --                   |
    | `amazon.titan-embed-g1-text-02`            | Amazon     | 1536                 | --                   |
    | `amazon.titan-embed-image-v1`              | Amazon     | 1024                 | --                   |
    | `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon     | 1024                 | 256, 384, 1024, 3072 |
    | `cohere.embed-english-v3`                  | Cohere     | 1024                 | --                   |
    | `cohere.embed-multilingual-v3`             | Cohere     | 1024                 | --                   |
    | `cohere.embed-v4:0`                        | Cohere     | 1536                 | 256-1536             |
    | `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs | 512                  | --                   |
    | `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs | 1024                 | --                   |

    Las variantes con sufijo de rendimiento (por ejemplo, `amazon.titan-embed-text-v1:2:8k`) heredan la configuración del modelo base.

    **Autenticación:** la autenticación de Bedrock usa el orden estándar de resolución de credenciales del AWS SDK:

    1. Variables de entorno (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
    2. Caché de tokens SSO
    3. Credenciales de token de identidad web
    4. Credenciales compartidas y archivos de configuración
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

    Para privilegios mínimos, limita el alcance de `InvokeModel` al modelo específico:

    ```
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="Local (GGUF + node-llama-cpp)">
    | Clave                 | Tipo               | Predeterminado                      | Descripción                                                                                                                                                                                                                                                                                                                              |
    | --------------------- | ------------------ | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | descargado automáticamente          | Ruta al archivo de modelo GGUF                                                                                                                                                                                                                                                                                                           |
    | `local.modelCacheDir` | `string`           | predeterminado de node-llama-cpp    | Directorio de caché para los modelos descargados                                                                                                                                                                                                                                                                                         |
    | `local.contextSize`   | `number \| "auto"` | `4096`                              | Tamaño de la ventana de contexto para el contexto de embeddings. 4096 cubre fragmentos típicos (128–512 tokens) y a la vez limita la VRAM que no corresponde a pesos. Redúzcalo a 1024–2048 en hosts con recursos limitados. `"auto"` usa el máximo entrenado del modelo; no se recomienda para modelos 8B+ (Qwen3-Embedding-8B: 40 960 tokens → ~32 GB de VRAM frente a ~8.8 GB con 4096). |

    Modelo predeterminado: `embeddinggemma-300m-qat-Q8_0.gguf` (~0.6 GB, descargado automáticamente). Los checkouts de origen aún requieren aprobación de compilación nativa: `pnpm approve-builds` y luego `pnpm rebuild node-llama-cpp`.

    Use la CLI independiente para verificar la misma ruta de proveedor que usa el Gateway:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    Si `provider` es `auto`, `local` se selecciona solo cuando `local.modelPath` apunta a un archivo local existente. Las referencias de modelo `hf:` y HTTP(S) todavía pueden usarse explícitamente con `provider: "local"`, pero no hacen que `auto` seleccione local antes de que el modelo esté disponible en disco.

  </Accordion>
</AccordionGroup>

### Tiempo de espera de embeddings en línea

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  Anula el tiempo de espera para lotes de embeddings en línea durante la indexación de memoria.

Si no se define, se usa el valor predeterminado del proveedor: 600 segundos para proveedores locales/autohospedados como `local`, `ollama` y `lmstudio`, y 120 segundos para proveedores hospedados. Auméntelo cuando los lotes de embeddings locales limitados por CPU estén funcionando correctamente, pero sean lentos.
</ParamField>

---

## Configuración de búsqueda híbrida

Todo bajo `memorySearch.query.hybrid`:

| Clave                 | Tipo      | Predeterminado | Descripción                                      |
| --------------------- | --------- | -------------- | ------------------------------------------------ |
| `enabled`             | `boolean` | `true`         | Habilita la búsqueda híbrida BM25 + vectorial    |
| `vectorWeight`        | `number`  | `0.7`          | Peso para las puntuaciones vectoriales (0-1)     |
| `textWeight`          | `number`  | `0.3`          | Peso para las puntuaciones BM25 (0-1)            |
| `candidateMultiplier` | `number`  | `4`            | Multiplicador del tamaño del conjunto candidato  |

<Tabs>
  <Tab title="MMR (diversidad)">
    | Clave         | Tipo      | Predeterminado | Descripción                            |
    | ------------- | --------- | -------------- | -------------------------------------- |
    | `mmr.enabled` | `boolean` | `false`        | Habilita la reordenación MMR           |
    | `mmr.lambda`  | `number`  | `0.7`          | 0 = diversidad máxima, 1 = relevancia máxima |
  </Tab>
  <Tab title="Decaimiento temporal (recencia)">
    | Clave                        | Tipo      | Predeterminado | Descripción                                  |
    | ---------------------------- | --------- | -------------- | -------------------------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false`        | Habilita el impulso por recencia             |
    | `temporalDecay.halfLifeDays` | `number`  | `30`           | La puntuación se reduce a la mitad cada N días |

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
| `extraPaths` | `string[]` | Directorios o archivos adicionales para indexar  |

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

Las rutas pueden ser absolutas o relativas al workspace. Los directorios se analizan recursivamente en busca de archivos `.md`. El manejo de symlinks depende del backend activo: el motor integrado ignora los symlinks, mientras que QMD sigue el comportamiento del analizador QMD subyacente.

Para la búsqueda de transcripciones entre agentes con alcance de agente, use `agents.list[].memorySearch.qmd.extraCollections` en lugar de `memory.qmd.paths`. Esas colecciones adicionales siguen la misma forma `{ path, name, pattern? }`, pero se fusionan por agente y pueden conservar nombres compartidos explícitos cuando la ruta apunta fuera del workspace actual. Si la misma ruta resuelta aparece tanto en `memory.qmd.paths` como en `memorySearch.qmd.extraCollections`, QMD conserva la primera entrada y omite el duplicado.

---

## Memoria multimodal (Gemini)

Indexe imágenes y audio junto con Markdown usando Gemini Embedding 2:

| Clave                     | Tipo       | Predeterminado | Descripción                            |
| ------------------------- | ---------- | -------------- | -------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`        | Habilita la indexación multimodal      |
| `multimodal.modalities`   | `string[]` | --             | `["image"]`, `["audio"]` o `["all"]`   |
| `multimodal.maxFileBytes` | `number`   | `10000000`     | Tamaño máximo de archivo para indexar  |

<Note>
Solo se aplica a archivos en `extraPaths`. Las raíces de memoria predeterminadas siguen siendo solo Markdown. Requiere `gemini-embedding-2-preview`. `fallback` debe ser `"none"`.
</Note>

Formatos compatibles: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (imágenes); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (audio).

---

## Caché de embeddings

| Clave              | Tipo      | Predeterminado | Descripción                                      |
| ------------------ | --------- | -------------- | ------------------------------------------------ |
| `cache.enabled`    | `boolean` | `false`        | Almacena en caché embeddings de fragmentos en SQLite |
| `cache.maxEntries` | `number`  | `50000`        | Máximo de embeddings en caché                    |

Evita volver a generar embeddings de texto sin cambios durante la reindexación o las actualizaciones de transcripciones.

---

## Indexación por lotes

| Clave                         | Tipo      | Predeterminado | Descripción                              |
| ----------------------------- | --------- | -------------- | ---------------------------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`            | Embeddings en línea paralelos            |
| `remote.batch.enabled`        | `boolean` | `false`        | Habilitar API de embeddings por lotes    |
| `remote.batch.concurrency`    | `number`  | `2`            | Trabajos por lotes paralelos             |
| `remote.batch.wait`           | `boolean` | `true`         | Esperar a que finalice el lote           |
| `remote.batch.pollIntervalMs` | `number`  | --             | Intervalo de sondeo                      |
| `remote.batch.timeoutMinutes` | `number`  | --             | Tiempo de espera del lote                |

Disponible para `openai`, `gemini` y `voyage`. Los lotes de OpenAI suelen ser los más rápidos y económicos para grandes cargas históricas.

`remote.nonBatchConcurrency` controla las llamadas de embeddings en línea que usan los proveedores locales/autohospedados y los proveedores alojados cuando las API por lotes del proveedor no están activas. Ollama usa `1` de forma predeterminada para la indexación sin lotes para evitar sobrecargar hosts locales más pequeños; define un valor más alto en máquinas más grandes.

Esto es independiente de `sync.embeddingBatchTimeoutSeconds`, que controla el tiempo de espera para las llamadas de embeddings en línea.

---

## Búsqueda en memoria de sesiones (experimental)

Indexa transcripciones de sesiones y muéstralas mediante `memory_search`:

| Clave                         | Tipo       | Predeterminado | Descripción                                      |
| ----------------------------- | ---------- | -------------- | ------------------------------------------------ |
| `experimental.sessionMemory`  | `boolean`  | `false`        | Habilitar indexación de sesiones                 |
| `sources`                     | `string[]` | `["memory"]`   | Agrega `"sessions"` para incluir transcripciones |
| `sync.sessions.deltaBytes`    | `number`   | `100000`       | Umbral de bytes para reindexar                   |
| `sync.sessions.deltaMessages` | `number`   | `50`           | Umbral de mensajes para reindexar                |

<Warning>
La indexación de sesiones es opcional y se ejecuta de forma asíncrona. Los resultados pueden estar ligeramente desactualizados. Los registros de sesión viven en disco, así que trata el acceso al sistema de archivos como el límite de confianza.
</Warning>

---

## Aceleración vectorial de SQLite (sqlite-vec)

| Clave                        | Tipo      | Predeterminado | Descripción                             |
| ---------------------------- | --------- | -------------- | --------------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`         | Usar sqlite-vec para consultas vectoriales |
| `store.vector.extensionPath` | `string`  | incluido       | Sobrescribir la ruta de sqlite-vec      |

Cuando sqlite-vec no está disponible, OpenClaw recurre automáticamente a la similitud coseno en el proceso.

---

## Almacenamiento del índice

| Clave                 | Tipo     | Predeterminado                       | Descripción                                         |
| --------------------- | -------- | ------------------------------------ | --------------------------------------------------- |
| `store.path`          | `string` | `~/.openclaw/memory/{agentId}.sqlite` | Ubicación del índice (admite el token `{agentId}`)  |
| `store.fts.tokenizer` | `string` | `unicode61`                          | Tokenizador FTS5 (`unicode61` o `trigram`)          |

---

## Configuración del backend QMD

Define `memory.backend = "qmd"` para habilitarlo. Todos los ajustes de QMD viven en `memory.qmd`:

| Clave                    | Tipo      | Predeterminado | Descripción                                                                                  |
| ------------------------ | --------- | -------------- | -------------------------------------------------------------------------------------------- |
| `command`                | `string`  | `qmd`          | Ruta del ejecutable QMD; define una ruta absoluta cuando el `PATH` del servicio difiera de tu shell |
| `searchMode`             | `string`  | `search`       | Comando de búsqueda: `search`, `vsearch`, `query`                                            |
| `includeDefaultMemory`   | `boolean` | `true`         | Indexar automáticamente `MEMORY.md` + `memory/**/*.md`                                       |
| `paths[]`                | `array`   | --             | Rutas adicionales: `{ name, path, pattern? }`                                                 |
| `sessions.enabled`       | `boolean` | `false`        | Indexar transcripciones de sesiones                                                          |
| `sessions.retentionDays` | `number`  | --             | Retención de transcripciones                                                                  |
| `sessions.exportDir`     | `string`  | --             | Directorio de exportación                                                                     |

`searchMode: "search"` es solo léxico/BM25. OpenClaw no ejecuta sondas de preparación de vectores semánticos ni mantenimiento de embeddings QMD para ese modo, incluso durante `memory status --deep`; `vsearch` y `query` siguen requiriendo preparación de vectores y embeddings QMD.

OpenClaw prefiere la colección QMD actual y las formas de consulta MCP actuales, pero mantiene funcionando versiones anteriores de QMD probando indicadores de patrón de colección compatibles y nombres de herramientas MCP antiguos cuando es necesario. Cuando QMD anuncia compatibilidad con varios filtros de colección, las colecciones de la misma fuente se buscan con un único proceso QMD; las compilaciones anteriores de QMD conservan la ruta de compatibilidad por colección. Misma fuente significa que las colecciones de memoria duradera se agrupan, mientras que las colecciones de transcripciones de sesión permanecen como un grupo separado para que la diversificación de fuentes siga teniendo ambas entradas.

<Note>
Las anulaciones de modelo de QMD permanecen del lado de QMD, no en la configuración de OpenClaw. Si necesitas anular globalmente los modelos de QMD, define variables de entorno como `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` y `QMD_GENERATE_MODEL` en el entorno de ejecución del Gateway.
</Note>

<AccordionGroup>
  <Accordion title="Update schedule">
    | Clave                     | Tipo      | Predeterminado | Descripción                           |
    | ------------------------- | --------- | --------------- | ------------------------------------- |
    | `update.interval`         | `string`  | `5m`            | Intervalo de actualización            |
    | `update.debounceMs`       | `number`  | `15000`         | Aplica debounce a los cambios de archivos |
    | `update.onBoot`           | `boolean` | `true`          | Actualiza cuando se abre el administrador QMD de larga duración; también controla la actualización de inicio opcional |
    | `update.startup`          | `string`  | `off`           | Actualización opcional al iniciar el gateway: `off`, `idle` o `immediate` |
    | `update.startupDelayMs`   | `number`  | `120000`        | Retraso antes de que se ejecute la actualización `startup: "idle"` |
    | `update.waitForBootSync`  | `boolean` | `false`         | Bloquea la apertura del administrador hasta que finalice su actualización inicial |
    | `update.embedInterval`    | `string`  | --              | Cadencia de embeddings separada       |
    | `update.commandTimeoutMs` | `number`  | --              | Tiempo de espera para comandos QMD    |
    | `update.updateTimeoutMs`  | `number`  | --              | Tiempo de espera para operaciones de actualización QMD |
    | `update.embedTimeoutMs`   | `number`  | --              | Tiempo de espera para operaciones de embeddings QMD |
  </Accordion>
  <Accordion title="Limits">
    | Clave                     | Tipo     | Predeterminado | Descripción                |
    | ------------------------- | -------- | --------------- | -------------------------- |
    | `limits.maxResults`       | `number` | `6`             | Resultados máximos de búsqueda |
    | `limits.maxSnippetChars`  | `number` | --              | Limita la longitud del fragmento |
    | `limits.maxInjectedChars` | `number` | --              | Limita el total de caracteres inyectados |
    | `limits.timeoutMs`        | `number` | `4000`          | Tiempo de espera de búsqueda |
  </Accordion>
  <Accordion title="Scope">
    Controla qué sesiones pueden recibir resultados de búsqueda QMD. Mismo esquema que [`session.sendPolicy`](/es/gateway/config-agents#session):

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

    El valor predeterminado incluido permite sesiones directas y de canal, mientras sigue denegando los grupos.

    El valor predeterminado es solo DM. `match.keyPrefix` coincide con la clave de sesión normalizada; `match.rawKeyPrefix` coincide con la clave sin procesar, incluido `agent:<id>:`.

  </Accordion>
  <Accordion title="Citations">
    `memory.citations` se aplica a todos los backends:

    | Valor            | Comportamiento                                      |
    | ---------------- | --------------------------------------------------- |
    | `auto` (predeterminado) | Incluye el pie `Source: <path#line>` en los fragmentos |
    | `on`             | Siempre incluye el pie                              |
    | `off`            | Omite el pie (la ruta aún se pasa internamente al agente) |

  </Accordion>
</AccordionGroup>

Las actualizaciones de arranque de QMD usan una ruta de subproceso de una sola ejecución durante el inicio del gateway. El administrador QMD de larga duración sigue siendo dueño del observador de archivos normal y de los temporizadores de intervalo cuando se abre la búsqueda de memoria para uso interactivo.

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

Dreaming se configura en `plugins.entries.memory-core.config.dreaming`, no en `agents.defaults.memorySearch`.

Dreaming se ejecuta como un único barrido programado y usa fases internas light/deep/REM como detalle de implementación.

Para el comportamiento conceptual y los comandos slash, consulta [Dreaming](/es/concepts/dreaming).

### Configuración de usuario

| Clave       | Tipo      | Predeterminado     | Descripción                                       |
| ----------- | --------- | ------------------ | ------------------------------------------------- |
| `enabled`   | `boolean` | `false`            | Habilita o deshabilita dreaming por completo      |
| `frequency` | `string`  | `0 3 * * *`        | Cadencia cron opcional para el barrido completo de dreaming |
| `model`     | `string`  | modelo predeterminado | Anulación opcional del modelo del subagente Dream Diary |

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
- `dreaming.model` usa la puerta de confianza existente del subagente del plugin; define `plugins.entries.memory-core.subagent.allowModelOverride: true` antes de habilitarlo.
- Dream Diary reintenta una vez con el modelo predeterminado de la sesión cuando el modelo configurado no está disponible. Los fallos de confianza o de la lista de permitidos se registran y no se reintentan silenciosamente.
- La política y los umbrales de las fases light/deep/REM son comportamiento interno, no configuración orientada al usuario.

</Note>

## Relacionado

- [Referencia de configuración](/es/gateway/configuration-reference)
- [Resumen de memoria](/es/concepts/memory)
- [Búsqueda de memoria](/es/concepts/memory-search)
