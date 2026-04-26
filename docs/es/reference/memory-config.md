---
read_when:
    - Quieres configurar proveedores de búsqueda de memoria o modelos de embeddings
    - Quieres configurar el backend QMD
    - Quieres ajustar la búsqueda híbrida, MMR o el decaimiento temporal
    - Quieres habilitar la indexación multimodal de Memory
sidebarTitle: Memory config
summary: Todos los controles de configuración para búsqueda de memoria, proveedores de embeddings, QMD, búsqueda híbrida e indexación multimodal
title: Referencia de configuración de Memory
x-i18n:
    generated_at: "2026-04-26T11:37:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 15fd747abc6d0d43cfc869faa0b5e6c1618681ef3b02068207321d60d449a901
    source_path: reference/memory-config.md
    workflow: 15
---

Esta página enumera todos los controles de configuración para la búsqueda de Memory de OpenClaw. Para visiones conceptuales, consulta:

<CardGroup cols={2}>
  <Card title="Descripción general de Memory" href="/es/concepts/memory">
    Cómo funciona Memory.
  </Card>
  <Card title="Motor integrado" href="/es/concepts/memory-builtin">
    Backend SQLite predeterminado.
  </Card>
  <Card title="Motor QMD" href="/es/concepts/memory-qmd">
    Sidecar local-first.
  </Card>
  <Card title="Búsqueda de Memory" href="/es/concepts/memory-search">
    Canal de búsqueda y ajuste.
  </Card>
  <Card title="Active Memory" href="/es/concepts/active-memory">
    Subagente de Memory para sesiones interactivas.
  </Card>
</CardGroup>

Toda la configuración de búsqueda de Memory vive bajo `agents.defaults.memorySearch` en `openclaw.json`, salvo que se indique lo contrario.

<Note>
Si buscas el interruptor de función de **Active Memory** y la configuración del subagente, eso vive bajo `plugins.entries.active-memory` en lugar de `memorySearch`.

Active Memory usa un modelo de dos compuertas:

1. el plugin debe estar habilitado y apuntar al ID del agente actual
2. la solicitud debe ser una sesión de chat persistente interactiva elegible

Consulta [Active Memory](/es/concepts/active-memory) para ver el modelo de activación, la configuración propiedad del plugin, la persistencia de transcripciones y el patrón de despliegue seguro.
</Note>

---

## Selección de proveedor

| Clave     | Tipo      | Predeterminado   | Descripción                                                                                                      |
| --------- | --------- | ---------------- | ---------------------------------------------------------------------------------------------------------------- |
| `provider` | `string` | detectado automáticamente | ID del adaptador de embeddings: `bedrock`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai`, `voyage` |
| `model`   | `string`  | predeterminado del proveedor | Nombre del modelo de embeddings                                                                            |
| `fallback` | `string` | `"none"`         | ID del adaptador de fallback cuando falla el principal                                                           |
| `enabled` | `boolean` | `true`           | Habilita o deshabilita la búsqueda de Memory                                                                     |

### Orden de detección automática

Cuando `provider` no está definido, OpenClaw selecciona el primero disponible:

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
  <Step title="bedrock">
    Se selecciona si se resuelve la cadena de credenciales del SDK de AWS (rol de instancia, claves de acceso, perfil, SSO, identidad web o configuración compartida).
  </Step>
</Steps>

`ollama` es compatible, pero no se detecta automáticamente (debes definirlo explícitamente).

### Resolución de claves API

Los embeddings remotos requieren una clave API. Bedrock usa en su lugar la cadena de credenciales predeterminada del SDK de AWS (roles de instancia, SSO, claves de acceso).

| Proveedor      | Variable de entorno                                | Clave de configuración              |
| -------------- | -------------------------------------------------- | ----------------------------------- |
| Bedrock        | Cadena de credenciales de AWS                      | No necesita clave API               |
| Gemini         | `GEMINI_API_KEY`                                   | `models.providers.google.apiKey`    |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | Perfil de autenticación mediante inicio de sesión del dispositivo |
| Mistral        | `MISTRAL_API_KEY`                                  | `models.providers.mistral.apiKey`   |
| Ollama         | `OLLAMA_API_KEY` (marcador de posición)            | --                                  |
| OpenAI         | `OPENAI_API_KEY`                                   | `models.providers.openai.apiKey`    |
| Voyage         | `VOYAGE_API_KEY`                                   | `models.providers.voyage.apiKey`    |

<Note>
Codex OAuth cubre solo chat/completions y no satisface las solicitudes de embeddings.
</Note>

---

## Configuración de endpoint remoto

Para endpoints personalizados compatibles con OpenAI o para sobrescribir los valores predeterminados del proveedor:

<ParamField path="remote.baseUrl" type="string">
  URL base personalizada de la API.
</ParamField>
<ParamField path="remote.apiKey" type="string">
  Sobrescribe la clave API.
</ParamField>
<ParamField path="remote.headers" type="object">
  Encabezados HTTP extra (fusionados con los predeterminados del proveedor).
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
    | Clave                  | Tipo     | Predeterminado          | Descripción                                |
    | ---------------------- | -------- | ----------------------- | ------------------------------------------ |
    | `model`                | `string` | `gemini-embedding-001`  | También admite `gemini-embedding-2-preview` |
    | `outputDimensionality` | `number` | `3072`                  | Para Embedding 2: 768, 1536 o 3072         |

    <Warning>
    Cambiar `model` o `outputDimensionality` activa una reindexación completa automática.
    </Warning>

  </Accordion>
  <Accordion title="Bedrock">
    Bedrock usa la cadena de credenciales predeterminada del SDK de AWS; no necesita claves API. Si OpenClaw se ejecuta en EC2 con un rol de instancia con Bedrock habilitado, solo define el proveedor y el modelo:

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

    | Clave                  | Tipo     | Predeterminado                 | Descripción                     |
    | ---------------------- | -------- | ------------------------------ | ------------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | Cualquier ID de modelo de embeddings de Bedrock |
    | `outputDimensionality` | `number` | valor predeterminado del modelo | Para Titan V2: 256, 512 o 1024 |

    **Modelos compatibles** (con detección de familia y dimensiones predeterminadas):

    | ID del modelo                               | Proveedor  | Dimensiones predeterminadas | Dimensiones configurables |
    | ------------------------------------------- | ---------- | --------------------------- | ------------------------- |
    | `amazon.titan-embed-text-v2:0`              | Amazon     | 1024                        | 256, 512, 1024            |
    | `amazon.titan-embed-text-v1`                | Amazon     | 1536                        | --                        |
    | `amazon.titan-embed-g1-text-02`             | Amazon     | 1536                        | --                        |
    | `amazon.titan-embed-image-v1`               | Amazon     | 1024                        | --                        |
    | `amazon.nova-2-multimodal-embeddings-v1:0`  | Amazon     | 1024                        | 256, 384, 1024, 3072      |
    | `cohere.embed-english-v3`                   | Cohere     | 1024                        | --                        |
    | `cohere.embed-multilingual-v3`              | Cohere     | 1024                        | --                        |
    | `cohere.embed-v4:0`                         | Cohere     | 1536                        | 256-1536                  |
    | `twelvelabs.marengo-embed-3-0-v1:0`         | TwelveLabs | 512                         | --                        |
    | `twelvelabs.marengo-embed-2-7-v1:0`         | TwelveLabs | 1024                        | --                        |

    Las variantes con sufijo de throughput (por ejemplo `amazon.titan-embed-text-v1:2:8k`) heredan la configuración del modelo base.

    **Autenticación:** la autenticación de Bedrock usa el orden estándar de resolución de credenciales del SDK de AWS:

    1. Variables de entorno (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
    2. Caché de tokens SSO
    3. Credenciales de token de identidad web
    4. Archivos compartidos de credenciales y configuración
    5. Credenciales de metadatos ECS o EC2

    La región se resuelve a partir de `AWS_REGION`, `AWS_DEFAULT_REGION`, `baseUrl` del proveedor `amazon-bedrock`, o usa por defecto `us-east-1`.

    **Permisos IAM:** el rol o usuario IAM necesita:

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    Para mínimo privilegio, limita `InvokeModel` al modelo específico:

    ```
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="Local (GGUF + node-llama-cpp)">
    | Clave                 | Tipo               | Predeterminado          | Descripción                                                                                                                                                                                                                                                                                                           |
    | --------------------- | ------------------ | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | descargado automáticamente | Ruta al archivo de modelo GGUF                                                                                                                                                                                                                                                                                       |
    | `local.modelCacheDir` | `string`           | valor predeterminado de node-llama-cpp | Directorio de caché para modelos descargados                                                                                                                                                                                                                                                           |
    | `local.contextSize`   | `number \| "auto"` | `4096`                  | Tamaño de ventana de contexto para el contexto de embeddings. 4096 cubre fragmentos típicos (128–512 tokens) mientras limita la VRAM no correspondiente a pesos. Redúcelo a 1024–2048 en hosts limitados. `"auto"` usa el máximo entrenado del modelo; no se recomienda para modelos de 8B+ (Qwen3-Embedding-8B: 40 960 tokens → ~32 GB de VRAM frente a ~8.8 GB con 4096). |

    Modelo predeterminado: `embeddinggemma-300m-qat-Q8_0.gguf` (~0.6 GB, descargado automáticamente). Requiere compilación nativa: `pnpm approve-builds` y luego `pnpm rebuild node-llama-cpp`.

    Usa la CLI independiente para verificar la misma ruta de proveedor que usa el Gateway:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    Si `provider` es `auto`, `local` se selecciona solo cuando `local.modelPath` apunta a un archivo local existente. Las referencias de modelo `hf:` y HTTP(S) todavía se pueden usar explícitamente con `provider: "local"`, pero no hacen que `auto` seleccione local antes de que el modelo esté disponible en disco.

  </Accordion>
</AccordionGroup>

### Tiempo de espera de embeddings en línea

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  Sobrescribe el tiempo de espera para lotes de embeddings en línea durante la indexación de Memory.

Si no se define, se usa el valor predeterminado del proveedor: 600 segundos para proveedores locales/alojados por uno mismo como `local`, `ollama` y `lmstudio`, y 120 segundos para proveedores alojados. Auméntalo cuando los lotes de embeddings locales limitados por CPU sean correctos pero lentos.
</ParamField>

---

## Configuración de búsqueda híbrida

Todo bajo `memorySearch.query.hybrid`:

| Clave                 | Tipo      | Predeterminado | Descripción                        |
| --------------------- | --------- | -------------- | ---------------------------------- |
| `enabled`             | `boolean` | `true`         | Habilita la búsqueda híbrida BM25 + vectorial |
| `vectorWeight`        | `number`  | `0.7`          | Peso para las puntuaciones vectoriales (0-1) |
| `textWeight`          | `number`  | `0.3`          | Peso para las puntuaciones BM25 (0-1) |
| `candidateMultiplier` | `number`  | `4`            | Multiplicador del tamaño del grupo de candidatos |

<Tabs>
  <Tab title="MMR (diversidad)">
    | Clave         | Tipo      | Predeterminado | Descripción                           |
    | ------------- | --------- | -------------- | ------------------------------------- |
    | `mmr.enabled` | `boolean` | `false`        | Habilita la reclasificación MMR       |
    | `mmr.lambda`  | `number`  | `0.7`          | 0 = máxima diversidad, 1 = máxima relevancia |
  </Tab>
  <Tab title="Decaimiento temporal (recencia)">
    | Clave                        | Tipo      | Predeterminado | Descripción                    |
    | ---------------------------- | --------- | -------------- | ------------------------------ |
    | `temporalDecay.enabled`      | `boolean` | `false`        | Habilita el refuerzo por recencia |
    | `temporalDecay.halfLifeDays` | `number`  | `30`           | La puntuación se reduce a la mitad cada N días |

    Los archivos perennes (`MEMORY.md`, archivos sin fecha en `memory/`) nunca sufren decaimiento.

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

## Rutas adicionales de Memory

| Clave        | Tipo       | Descripción                                 |
| ------------ | ---------- | ------------------------------------------- |
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

Las rutas pueden ser absolutas o relativas al espacio de trabajo. Los directorios se escanean de forma recursiva en busca de archivos `.md`. El manejo de enlaces simbólicos depende del backend activo: el motor integrado ignora los enlaces simbólicos, mientras que QMD sigue el comportamiento del escáner subyacente de QMD.

Para búsqueda de transcripciones entre agentes con alcance de agente, usa `agents.list[].memorySearch.qmd.extraCollections` en lugar de `memory.qmd.paths`. Esas colecciones adicionales siguen la misma forma `{ path, name, pattern? }`, pero se fusionan por agente y pueden conservar nombres compartidos explícitos cuando la ruta apunta fuera del espacio de trabajo actual. Si la misma ruta resuelta aparece tanto en `memory.qmd.paths` como en `memorySearch.qmd.extraCollections`, QMD conserva la primera entrada y omite el duplicado.

---

## Memory multimodal (Gemini)

Indexa imágenes y audio junto con Markdown usando Gemini Embedding 2:

| Clave                     | Tipo       | Predeterminado | Descripción                           |
| ------------------------- | ---------- | -------------- | ------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`        | Habilita la indexación multimodal     |
| `multimodal.modalities`   | `string[]` | --             | `["image"]`, `["audio"]` o `["all"]`  |
| `multimodal.maxFileBytes` | `number`   | `10000000`     | Tamaño máximo del archivo para indexación |

<Note>
Solo se aplica a archivos en `extraPaths`. Las raíces predeterminadas de Memory siguen siendo solo Markdown. Requiere `gemini-embedding-2-preview`. `fallback` debe ser `"none"`.
</Note>

Formatos compatibles: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (imágenes); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (audio).

---

## Caché de embeddings

| Clave              | Tipo      | Predeterminado | Descripción                           |
| ------------------ | --------- | -------------- | ------------------------------------- |
| `cache.enabled`    | `boolean` | `false`        | Almacena en caché embeddings de fragmentos en SQLite |
| `cache.maxEntries` | `number`  | `50000`        | Máximo de embeddings en caché         |

Evita volver a generar embeddings de texto sin cambios durante la reindexación o las actualizaciones de transcripciones.

---

## Indexación por lotes

| Clave                         | Tipo      | Predeterminado | Descripción                   |
| ----------------------------- | --------- | -------------- | ----------------------------- |
| `remote.batch.enabled`        | `boolean` | `false`        | Habilita la API de embeddings por lotes |
| `remote.batch.concurrency`    | `number`  | `2`            | Trabajos por lotes en paralelo |
| `remote.batch.wait`           | `boolean` | `true`         | Espera a que el lote se complete |
| `remote.batch.pollIntervalMs` | `number`  | --             | Intervalo de sondeo           |
| `remote.batch.timeoutMinutes` | `number`  | --             | Tiempo de espera del lote     |

Disponible para `openai`, `gemini` y `voyage`. El procesamiento por lotes de OpenAI suele ser el más rápido y económico para rellenos grandes.

Esto es independiente de `sync.embeddingBatchTimeoutSeconds`, que controla las llamadas de embeddings en línea usadas por proveedores locales/alojados por uno mismo y por proveedores alojados cuando las API de lotes del proveedor no están activas.

---

## Búsqueda de Memory de sesión (experimental)

Indexa transcripciones de sesión y muéstralas mediante `memory_search`:

| Clave                       | Tipo       | Predeterminado | Descripción                                  |
| --------------------------- | ---------- | -------------- | -------------------------------------------- |
| `experimental.sessionMemory` | `boolean` | `false`        | Habilita la indexación de sesiones           |
| `sources`                   | `string[]` | `["memory"]`   | Añade `"sessions"` para incluir transcripciones |
| `sync.sessions.deltaBytes`  | `number`   | `100000`       | Umbral de bytes para reindexación            |
| `sync.sessions.deltaMessages` | `number` | `50`           | Umbral de mensajes para reindexación         |

<Warning>
La indexación de sesiones es opcional y se ejecuta de forma asíncrona. Los resultados pueden estar ligeramente desactualizados. Los registros de sesión viven en disco, así que trata el acceso al sistema de archivos como el límite de confianza.
</Warning>

---

## Aceleración vectorial de SQLite (`sqlite-vec`)

| Clave                      | Tipo      | Predeterminado | Descripción                           |
| -------------------------- | --------- | -------------- | ------------------------------------- |
| `store.vector.enabled`     | `boolean` | `true`         | Usa `sqlite-vec` para consultas vectoriales |
| `store.vector.extensionPath` | `string` | incluido     | Sobrescribe la ruta de `sqlite-vec`   |

Cuando `sqlite-vec` no está disponible, OpenClaw recurre automáticamente a similitud de coseno en proceso.

---

## Almacenamiento del índice

| Clave               | Tipo     | Predeterminado                         | Descripción                                  |
| ------------------- | -------- | ------------------------------------- | -------------------------------------------- |
| `store.path`        | `string` | `~/.openclaw/memory/{agentId}.sqlite` | Ubicación del índice (admite el token `{agentId}`) |
| `store.fts.tokenizer` | `string` | `unicode61`                         | Tokenizador FTS5 (`unicode61` o `trigram`)   |

---

## Configuración del backend QMD

Establece `memory.backend = "qmd"` para habilitarlo. Toda la configuración de QMD vive bajo `memory.qmd`:

| Clave                    | Tipo      | Predeterminado | Descripción                                   |
| ------------------------ | --------- | -------------- | --------------------------------------------- |
| `command`                | `string`  | `qmd`          | Ruta al ejecutable de QMD                     |
| `searchMode`             | `string`  | `search`       | Comando de búsqueda: `search`, `vsearch`, `query` |
| `includeDefaultMemory`   | `boolean` | `true`         | Autoindexa `MEMORY.md` + `memory/**/*.md`     |
| `paths[]`                | `array`   | --             | Rutas adicionales: `{ name, path, pattern? }` |
| `sessions.enabled`       | `boolean` | `false`        | Indexa transcripciones de sesión              |
| `sessions.retentionDays` | `number`  | --             | Retención de transcripciones                  |
| `sessions.exportDir`     | `string`  | --             | Directorio de exportación                     |

OpenClaw prefiere las formas actuales de colección y consulta MCP de QMD, pero mantiene funcionando versiones antiguas de QMD recurriendo a flags heredados de colección `--mask` y nombres antiguos de herramientas MCP cuando es necesario.

<Note>
Las sobrescrituras de modelos de QMD permanecen del lado de QMD, no en la configuración de OpenClaw. Si necesitas sobrescribir globalmente los modelos de QMD, establece variables de entorno como `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` y `QMD_GENERATE_MODEL` en el entorno de runtime del gateway.
</Note>

<AccordionGroup>
  <Accordion title="Programa de actualización">
    | Clave                     | Tipo      | Predeterminado | Descripción                                |
    | ------------------------- | --------- | -------------- | ------------------------------------------ |
    | `update.interval`         | `string`  | `5m`           | Intervalo de actualización                 |
    | `update.debounceMs`       | `number`  | `15000`        | Debounce de cambios de archivos            |
    | `update.onBoot`           | `boolean` | `true`         | Actualiza al iniciar                       |
    | `update.waitForBootSync`  | `boolean` | `false`        | Bloquea el inicio hasta que se complete la actualización |
    | `update.embedInterval`    | `string`  | --             | Cadencia separada de embeddings            |
    | `update.commandTimeoutMs` | `number`  | --             | Tiempo de espera para comandos QMD         |
    | `update.updateTimeoutMs`  | `number`  | --             | Tiempo de espera para operaciones de actualización QMD |
    | `update.embedTimeoutMs`   | `number`  | --             | Tiempo de espera para operaciones de embeddings QMD |
  </Accordion>
  <Accordion title="Límites">
    | Clave                     | Tipo     | Predeterminado | Descripción                    |
    | ------------------------- | -------- | -------------- | ------------------------------ |
    | `limits.maxResults`       | `number` | `6`            | Máximo de resultados de búsqueda |
    | `limits.maxSnippetChars`  | `number` | --             | Limita la longitud del fragmento |
    | `limits.maxInjectedChars` | `number` | --             | Limita el total de caracteres inyectados |
    | `limits.timeoutMs`        | `number` | `4000`         | Tiempo de espera de búsqueda   |
  </Accordion>
  <Accordion title="Alcance">
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

    El valor predeterminado distribuido permite sesiones directas y de canal, mientras sigue denegando grupos.

    El valor predeterminado es solo DM. `match.keyPrefix` coincide con la clave de sesión normalizada; `match.rawKeyPrefix` coincide con la clave sin procesar, incluida `agent:<id>:`.

  </Accordion>
  <Accordion title="Citas">
    `memory.citations` se aplica a todos los backends:

    | Valor            | Comportamiento                                     |
    | ---------------- | -------------------------------------------------- |
    | `auto` (predeterminado) | Incluye pie `Source: <path#line>` en fragmentos |
    | `on`             | Siempre incluye el pie                             |
    | `off`            | Omite el pie (la ruta sigue pasándose internamente al agente) |

  </Accordion>
</AccordionGroup>

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

Dreaming se ejecuta como una sola pasada programada y usa fases internas Light/Deep/REM como detalle de implementación.

Para el comportamiento conceptual y los comandos con barra, consulta [Dreaming](/es/concepts/dreaming).

### Configuración del usuario

| Clave       | Tipo      | Predeterminado | Descripción                                     |
| ----------- | --------- | -------------- | ----------------------------------------------- |
| `enabled`   | `boolean` | `false`        | Habilita o deshabilita Dreaming por completo    |
| `frequency` | `string`  | `0 3 * * *`    | Cadencia Cron opcional para la pasada completa de Dreaming |

### Ejemplo

```json5
{
  plugins: {
    entries: {
      "memory-core": {
        config: {
          dreaming: {
            enabled: true,
            frequency: "0 3 * * *",
          },
        },
      },
    },
  },
}
```

<Note>
- Dreaming escribe estado de máquina en `memory/.dreams/`.
- Dreaming escribe salida narrativa legible por humanos en `DREAMS.md` (o el `dreams.md` existente).
- La política y los umbrales de las fases Light/Deep/REM son comportamiento interno, no configuración orientada al usuario.
</Note>

## Relacionado

- [Configuration reference](/es/gateway/configuration-reference)
- [Memory overview](/es/concepts/memory)
- [Memory search](/es/concepts/memory-search)
