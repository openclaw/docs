---
read_when:
    - Quieres configurar proveedores de búsqueda en memoria o modelos de embeddings
    - Quieres configurar el backend QMD
    - Quieres ajustar búsqueda híbrida, MMR o decaimiento temporal
    - |-
      Quieres habilitar la indexación de memoria multimodal【อ่านข้อความเต็มOC_I18N_900000__
      After translating this placeholder, also ensure the final translated text contains no English sentence outside code/URLs/product names.
summary: Todos los ajustes de configuración para búsqueda en memoria, proveedores de embeddings, QMD, búsqueda híbrida e indexación multimodal
title: Referencia de configuración de memoria
x-i18n:
    generated_at: "2026-04-24T05:48:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: b9152d6cdf3959319c2ba000fae06c72b27b9b8c90ee08ce57b80d1c0670f850
    source_path: reference/memory-config.md
    workflow: 15
---

Esta página enumera todos los ajustes de configuración para la búsqueda en memoria de OpenClaw. Para
resúmenes conceptuales, consulta:

- [Resumen de memoria](/es/concepts/memory) -- cómo funciona la memoria
- [Motor integrado](/es/concepts/memory-builtin) -- backend SQLite predeterminado
- [Motor QMD](/es/concepts/memory-qmd) -- sidecar local-first
- [Búsqueda en memoria](/es/concepts/memory-search) -- canalización de búsqueda y ajustes
- [Active Memory](/es/concepts/active-memory) -- habilitar el subagente de memoria para sesiones interactivas

Todos los ajustes de búsqueda en memoria viven bajo `agents.defaults.memorySearch` en
`openclaw.json`, salvo que se indique lo contrario.

Si buscas la opción de la función **active memory** y la configuración del subagente,
eso vive bajo `plugins.entries.active-memory` en lugar de `memorySearch`.

Active memory usa un modelo de dos puertas:

1. el Plugin debe estar habilitado y apuntar al id del agente actual
2. la solicitud debe ser una sesión de chat interactiva persistente válida

Consulta [Active Memory](/es/concepts/active-memory) para el modelo de activación,
la configuración propiedad del Plugin, la persistencia de transcripciones y el patrón de despliegue seguro.

---

## Selección de proveedor

| Clave | Tipo | Predeterminado | Descripción |
| ---------- | --------- | ---------------- | ------------------------------------------------------------------------------------------------------------- |
| `provider` | `string` | detectado automáticamente | Id del adaptador de embeddings: `bedrock`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai`, `voyage` |
| `model` | `string` | predeterminado del proveedor | Nombre del modelo de embeddings |
| `fallback` | `string` | `"none"` | Id del adaptador de fallback cuando falla el primario |
| `enabled` | `boolean` | `true` | Habilitar o deshabilitar la búsqueda en memoria |

### Orden de detección automática

Cuando `provider` no está configurado, OpenClaw selecciona el primero disponible:

1. `local` -- si `memorySearch.local.modelPath` está configurado y el archivo existe.
2. `github-copilot` -- si se puede resolver un token de GitHub Copilot (variable de entorno o perfil de autenticación).
3. `openai` -- si se puede resolver una clave de OpenAI.
4. `gemini` -- si se puede resolver una clave de Gemini.
5. `voyage` -- si se puede resolver una clave de Voyage.
6. `mistral` -- si se puede resolver una clave de Mistral.
7. `bedrock` -- si la cadena de credenciales por defecto del SDK de AWS se resuelve (rol de instancia, claves de acceso, perfil, SSO, identidad web o configuración compartida).

`ollama` es compatible pero no se detecta automáticamente (configúralo explícitamente).

### Resolución de claves API

Los embeddings remotos requieren una clave API. Bedrock usa en su lugar la
cadena de credenciales predeterminada del SDK de AWS (roles de instancia, SSO, claves de acceso).

| Proveedor | Variable de entorno | Clave de configuración |
| -------------- | -------------------------------------------------- | --------------------------------- |
| Bedrock | cadena de credenciales de AWS | No necesita clave API |
| Gemini | `GEMINI_API_KEY` | `models.providers.google.apiKey` |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | Perfil de autenticación mediante inicio de sesión del dispositivo |
| Mistral | `MISTRAL_API_KEY` | `models.providers.mistral.apiKey` |
| Ollama | `OLLAMA_API_KEY` (marcador de posición) | -- |
| OpenAI | `OPENAI_API_KEY` | `models.providers.openai.apiKey` |
| Voyage | `VOYAGE_API_KEY` | `models.providers.voyage.apiKey` |

OAuth de Codex solo cubre chat/completions y no satisface solicitudes
de embeddings.

---

## Configuración de endpoint remoto

Para endpoints personalizados compatibles con OpenAI o para anular valores predeterminados del proveedor:

| Clave | Tipo | Descripción |
| ---------------- | -------- | -------------------------------------------------- |
| `remote.baseUrl` | `string` | URL base de API personalizada |
| `remote.apiKey` | `string` | Anulación de clave API |
| `remote.headers` | `object` | Encabezados HTTP adicionales (fusionados con los predeterminados del proveedor) |

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

## Configuración específica de Gemini

| Clave | Tipo | Predeterminado | Descripción |
| ---------------------- | -------- | ---------------------- | ------------------------------------------ |
| `model` | `string` | `gemini-embedding-001` | También admite `gemini-embedding-2-preview` |
| `outputDimensionality` | `number` | `3072` | Para Embedding 2: 768, 1536 o 3072 |

<Warning>
Cambiar el modelo o `outputDimensionality` activa una reindexación completa automática.
</Warning>

---

## Configuración de embeddings de Bedrock

Bedrock usa la cadena de credenciales predeterminada del SDK de AWS -- no necesita claves API.
Si OpenClaw se ejecuta en EC2 con un rol de instancia habilitado para Bedrock, simplemente configura el
proveedor y el modelo:

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

| Clave | Tipo | Predeterminado | Descripción |
| ---------------------- | -------- | ------------------------------ | ------------------------------- |
| `model` | `string` | `amazon.titan-embed-text-v2:0` | Cualquier id de modelo de embeddings de Bedrock |
| `outputDimensionality` | `number` | predeterminado del modelo | Para Titan V2: 256, 512 o 1024 |

### Modelos compatibles

Se admiten los siguientes modelos (con detección de familia y valores predeterminados
de dimensiones):

| Id del modelo | Proveedor | Dims predeterminadas | Dims configurables |
| ------------------------------------------ | ---------- | ------------ | -------------------- |
| `amazon.titan-embed-text-v2:0` | Amazon | 1024 | 256, 512, 1024 |
| `amazon.titan-embed-text-v1` | Amazon | 1536 | -- |
| `amazon.titan-embed-g1-text-02` | Amazon | 1536 | -- |
| `amazon.titan-embed-image-v1` | Amazon | 1024 | -- |
| `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon | 1024 | 256, 384, 1024, 3072 |
| `cohere.embed-english-v3` | Cohere | 1024 | -- |
| `cohere.embed-multilingual-v3` | Cohere | 1024 | -- |
| `cohere.embed-v4:0` | Cohere | 1536 | 256-1536 |
| `twelvelabs.marengo-embed-3-0-v1:0` | TwelveLabs | 512 | -- |
| `twelvelabs.marengo-embed-2-7-v1:0` | TwelveLabs | 1024 | -- |

Las variantes con sufijo de rendimiento (por ejemplo, `amazon.titan-embed-text-v1:2:8k`) heredan
la configuración del modelo base.

### Autenticación

La autenticación de Bedrock usa el orden estándar de resolución de credenciales del SDK de AWS:

1. Variables de entorno (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
2. Caché de tokens SSO
3. Credenciales de token de identidad web
4. Archivos compartidos de credenciales y configuración
5. Credenciales de metadatos ECS o EC2

La región se resuelve a partir de `AWS_REGION`, `AWS_DEFAULT_REGION`, el
`baseUrl` del proveedor `amazon-bedrock`, o se usa por defecto `us-east-1`.

### Permisos IAM

El rol o usuario IAM necesita:

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

---

## Configuración de embeddings locales

| Clave | Tipo | Predeterminado | Descripción |
| --------------------- | ------------------ | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `local.modelPath` | `string` | descargado automáticamente | Ruta al archivo del modelo GGUF |
| `local.modelCacheDir` | `string` | predeterminado de node-llama-cpp | Directorio de caché para modelos descargados |
| `local.contextSize` | `number \| "auto"` | `4096` | Tamaño de ventana de contexto para el contexto de embeddings. 4096 cubre fragmentos típicos (128–512 tokens) y limita la VRAM no correspondiente a pesos. Reduce a 1024–2048 en hosts limitados. `"auto"` usa el máximo entrenado del modelo — no se recomienda para modelos de 8B+ (Qwen3-Embedding-8B: 40 960 tokens → ~32 GB de VRAM frente a ~8.8 GB con 4096). |

Modelo predeterminado: `embeddinggemma-300m-qat-Q8_0.gguf` (~0.6 GB, descargado automáticamente).
Requiere compilación nativa: `pnpm approve-builds` y luego `pnpm rebuild node-llama-cpp`.

Usa la CLI independiente para verificar la misma ruta de proveedor que usa Gateway:

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

Si `provider` es `auto`, `local` se selecciona solo cuando `local.modelPath` apunta
a un archivo local existente. Las referencias de modelo `hf:` y HTTP(S) pueden seguir usándose
explícitamente con `provider: "local"`, pero no hacen que `auto` seleccione local
antes de que el modelo esté disponible en disco.

---

## Configuración de búsqueda híbrida

Todo bajo `memorySearch.query.hybrid`:

| Clave | Tipo | Predeterminado | Descripción |
| --------------------- | --------- | ------- | ---------------------------------- |
| `enabled` | `boolean` | `true` | Habilita búsqueda híbrida BM25 + vectorial |
| `vectorWeight` | `number` | `0.7` | Peso de las puntuaciones vectoriales (0-1) |
| `textWeight` | `number` | `0.3` | Peso de las puntuaciones BM25 (0-1) |
| `candidateMultiplier` | `number` | `4` | Multiplicador del tamaño del conjunto de candidatos |

### MMR (diversidad)

| Clave | Tipo | Predeterminado | Descripción |
| ------------- | --------- | ------- | ------------------------------------ |
| `mmr.enabled` | `boolean` | `false` | Habilita reordenación MMR |
| `mmr.lambda` | `number` | `0.7` | 0 = diversidad máxima, 1 = relevancia máxima |

### Decaimiento temporal (recencia)

| Clave | Tipo | Predeterminado | Descripción |
| ---------------------------- | --------- | ------- | ------------------------- |
| `temporalDecay.enabled` | `boolean` | `false` | Habilita el refuerzo por recencia |
| `temporalDecay.halfLifeDays` | `number` | `30` | La puntuación se reduce a la mitad cada N días |

Los archivos perennes (`MEMORY.md`, archivos sin fecha en `memory/`) nunca se degradan.

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

| Clave | Tipo | Descripción |
| ------------ | ---------- | ---------------------------------------- |
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

Las rutas pueden ser absolutas o relativas al espacio de trabajo. Los directorios se analizan
recursivamente en busca de archivos `.md`. El manejo de symlinks depende del backend activo:
el motor integrado ignora los symlinks, mientras que QMD sigue el comportamiento del
escáner subyacente de QMD.

Para búsqueda de transcripciones entre agentes con alcance por agente, usa
`agents.list[].memorySearch.qmd.extraCollections` en lugar de `memory.qmd.paths`.
Esas colecciones adicionales siguen la misma forma `{ path, name, pattern? }`, pero
se fusionan por agente y pueden conservar nombres compartidos explícitos cuando la ruta
apunta fuera del espacio de trabajo actual.
Si la misma ruta resuelta aparece tanto en `memory.qmd.paths` como en
`memorySearch.qmd.extraCollections`, QMD conserva la primera entrada y omite el
duplicado.

---

## Memoria multimodal (Gemini)

Indexa imágenes y audio junto con Markdown usando Gemini Embedding 2:

| Clave | Tipo | Predeterminado | Descripción |
| ------------------------- | ---------- | ---------- | -------------------------------------- |
| `multimodal.enabled` | `boolean` | `false` | Habilita la indexación multimodal |
| `multimodal.modalities` | `string[]` | -- | `["image"]`, `["audio"]` o `["all"]` |
| `multimodal.maxFileBytes` | `number` | `10000000` | Tamaño máximo de archivo para indexación |

Solo se aplica a los archivos en `extraPaths`. Las raíces de memoria predeterminadas siguen siendo solo Markdown.
Requiere `gemini-embedding-2-preview`. `fallback` debe ser `"none"`.

Formatos compatibles: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif`
(imágenes); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (audio).

---

## Caché de embeddings

| Clave | Tipo | Predeterminado | Descripción |
| ------------------ | --------- | ------- | -------------------------------- |
| `cache.enabled` | `boolean` | `false` | Almacena embeddings de fragmentos en caché en SQLite |
| `cache.maxEntries` | `number` | `50000` | Máximo de embeddings en caché |

Evita volver a generar embeddings de texto sin cambios durante la reindexación o las actualizaciones de transcripciones.

---

## Indexación por lotes

| Clave | Tipo | Predeterminado | Descripción |
| ----------------------------- | --------- | ------- | -------------------------- |
| `remote.batch.enabled` | `boolean` | `false` | Habilita la API de embeddings por lotes |
| `remote.batch.concurrency` | `number` | `2` | Trabajos por lotes en paralelo |
| `remote.batch.wait` | `boolean` | `true` | Espera a que termine el lote |
| `remote.batch.pollIntervalMs` | `number` | -- | Intervalo de sondeo |
| `remote.batch.timeoutMinutes` | `number` | -- | Tiempo de espera del lote |

Disponible para `openai`, `gemini` y `voyage`. El procesamiento por lotes de OpenAI suele ser
el más rápido y barato para grandes rellenos retrospectivos.

---

## Búsqueda de memoria de sesión (experimental)

Indexa transcripciones de sesiones y las muestra mediante `memory_search`:

| Clave | Tipo | Predeterminado | Descripción |
| ----------------------------- | ---------- | ------------ | --------------------------------------- |
| `experimental.sessionMemory` | `boolean` | `false` | Habilita la indexación de sesiones |
| `sources` | `string[]` | `["memory"]` | Agrega `"sessions"` para incluir transcripciones |
| `sync.sessions.deltaBytes` | `number` | `100000` | Umbral de bytes para reindexación |
| `sync.sessions.deltaMessages` | `number` | `50` | Umbral de mensajes para reindexación |

La indexación de sesiones es opt-in y se ejecuta de forma asíncrona. Los resultados pueden estar ligeramente
desactualizados. Los registros de sesión viven en disco, así que trata el acceso al sistema de archivos como el límite
de confianza.

---

## Aceleración vectorial de SQLite (`sqlite-vec`)

| Clave | Tipo | Predeterminado | Descripción |
| ---------------------------- | --------- | ------- | --------------------------------- |
| `store.vector.enabled` | `boolean` | `true` | Usa `sqlite-vec` para consultas vectoriales |
| `store.vector.extensionPath` | `string` | incluido | Anula la ruta de `sqlite-vec` |

Cuando `sqlite-vec` no está disponible, OpenClaw recurre automáticamente a similitud
coseno dentro del proceso.

---

## Almacenamiento del índice

| Clave | Tipo | Predeterminado | Descripción |
| --------------------- | -------- | ------------------------------------- | ------------------------------------------- |
| `store.path` | `string` | `~/.openclaw/memory/{agentId}.sqlite` | Ubicación del índice (admite el token `{agentId}`) |
| `store.fts.tokenizer` | `string` | `unicode61` | Tokenizador FTS5 (`unicode61` o `trigram`) |

---

## Configuración del backend QMD

Establece `memory.backend = "qmd"` para habilitarlo. Todos los ajustes de QMD viven bajo
`memory.qmd`:

| Clave | Tipo | Predeterminado | Descripción |
| ------------------------ | --------- | -------- | -------------------------------------------- |
| `command` | `string` | `qmd` | Ruta del ejecutable QMD |
| `searchMode` | `string` | `search` | Comando de búsqueda: `search`, `vsearch`, `query` |
| `includeDefaultMemory` | `boolean` | `true` | Indexa automáticamente `MEMORY.md` + `memory/**/*.md` |
| `paths[]` | `array` | -- | Rutas adicionales: `{ name, path, pattern? }` |
| `sessions.enabled` | `boolean` | `false` | Indexa transcripciones de sesión |
| `sessions.retentionDays` | `number` | -- | Retención de transcripciones |
| `sessions.exportDir` | `string` | -- | Directorio de exportación |

OpenClaw prefiere las formas actuales de colección QMD y consulta MCP, pero mantiene
las versiones anteriores de QMD operativas recurriendo a flags heredados de colección `--mask`
y nombres más antiguos de herramientas MCP cuando es necesario.

Las anulaciones de modelo QMD permanecen en el lado de QMD, no en la configuración de OpenClaw. Si necesitas
anular globalmente los modelos de QMD, establece variables de entorno como
`QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` y `QMD_GENERATE_MODEL` en el entorno
de tiempo de ejecución del gateway.

### Programación de actualizaciones

| Clave | Tipo | Predeterminado | Descripción |
| ------------------------- | --------- | ------- | ------------------------------------- |
| `update.interval` | `string` | `5m` | Intervalo de actualización |
| `update.debounceMs` | `number` | `15000` | Debounce de cambios en archivos |
| `update.onBoot` | `boolean` | `true` | Actualizar al inicio |
| `update.waitForBootSync` | `boolean` | `false` | Bloquear el inicio hasta que termine la actualización |
| `update.embedInterval` | `string` | -- | Cadencia separada de embeddings |
| `update.commandTimeoutMs` | `number` | -- | Tiempo de espera para comandos QMD |
| `update.updateTimeoutMs` | `number` | -- | Tiempo de espera para operaciones de actualización QMD |
| `update.embedTimeoutMs` | `number` | -- | Tiempo de espera para operaciones de embeddings QMD |

### Límites

| Clave | Tipo | Predeterminado | Descripción |
| ------------------------- | -------- | ------- | -------------------------- |
| `limits.maxResults` | `number` | `6` | Máximo de resultados de búsqueda |
| `limits.maxSnippetChars` | `number` | -- | Limita la longitud del fragmento |
| `limits.maxInjectedChars` | `number` | -- | Limita el total de caracteres inyectados |
| `limits.timeoutMs` | `number` | `4000` | Tiempo de espera de búsqueda |

### Alcance

Controla qué sesiones pueden recibir resultados de búsqueda de QMD. Mismo esquema que
[`session.sendPolicy`](/es/gateway/config-agents#session):

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

El valor predeterminado incluido permite sesiones directas y de canal, al tiempo que sigue denegando
grupos.

El valor predeterminado es solo DM. `match.keyPrefix` coincide con la clave de sesión normalizada;
`match.rawKeyPrefix` coincide con la clave sin procesar incluyendo `agent:<id>:`.

### Citas

`memory.citations` se aplica a todos los backends:

| Valor | Comportamiento |
| ---------------- | --------------------------------------------------- |
| `auto` (predeterminado) | Incluye pie `Source: <path#line>` en los fragmentos |
| `on` | Incluye siempre el pie |
| `off` | Omite el pie (la ruta sigue pasándose internamente al agente) |

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

Dreaming se configura bajo `plugins.entries.memory-core.config.dreaming`,
no bajo `agents.defaults.memorySearch`.

Dreaming se ejecuta como una barrida programada y usa internamente fases light/deep/REM como
detalle de implementación.

Para el comportamiento conceptual y los comandos slash, consulta [Dreaming](/es/concepts/dreaming).

### Ajustes del usuario

| Clave | Tipo | Predeterminado | Descripción |
| ----------- | --------- | ----------- | ------------------------------------------------- |
| `enabled` | `boolean` | `false` | Habilita o deshabilita completamente Dreaming |
| `frequency` | `string` | `0 3 * * *` | Cadencia Cron opcional para la barrida completa de Dreaming |

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

Notas:

- Dreaming escribe el estado de la máquina en `memory/.dreams/`.
- Dreaming escribe la salida narrativa legible por humanos en `DREAMS.md` (o en `dreams.md` existente).
- La política de fases light/deep/REM y los umbrales son comportamiento interno, no configuración visible para el usuario.

## Relacionado

- [Resumen de memoria](/es/concepts/memory)
- [Búsqueda en memoria](/es/concepts/memory-search)
- [Referencia de configuración](/es/gateway/configuration-reference)
