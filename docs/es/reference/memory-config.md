---
read_when:
    - Quieres configurar proveedores de búsqueda en memoria o modelos de embeddings
    - Desea configurar el backend QMD
    - Se desea habilitar la búsqueda híbrida, MMR o el decaimiento temporal
    - Se desea habilitar la indexación de memoria multimodal
sidebarTitle: Memory config
summary: Proveedores de búsqueda en memoria, modos de recuperación, QMD e indexación multimodal
title: Referencia de configuración de memoria
x-i18n:
    generated_at: "2026-07-22T10:48:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 91f843b1516093c49e18b3d659ab24ea9cb7be32aaaac722205eca8bc3f2ca5b
    source_path: reference/memory-config.md
    workflow: 16
---

Esta página enumera todos los parámetros de configuración de la búsqueda de memoria de OpenClaw. Para obtener descripciones conceptuales generales, consulte:

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
  <Card title="Búsqueda de memoria" href="/es/concepts/memory-search">
    Pipeline de búsqueda y ajuste.
  </Card>
  <Card title="Active Memory" href="/es/concepts/active-memory">
    Subagente de memoria para sesiones interactivas.
  </Card>
</CardGroup>

Todos los ajustes de memoria compartida se encuentran en el nivel superior `memory` de `openclaw.json`. Los valores predeterminados de búsqueda usan `memory.search`; las anulaciones de búsqueda por agente usan `agents.entries.*.memory.search`.

<Note>
Para el flujo de trabajo recomendado del agente personal, use
`memory.search.rememberAcrossConversations`. Los controles avanzados de destino,
modelo, prompt y latencia de Active Memory se encuentran en `plugins.entries.active-memory`.

Consulte [Active Memory](/es/concepts/active-memory) para conocer ambas vías de activación,
la persistencia de transcripciones y las directrices para un despliegue seguro.
</Note>

---

## Recordar entre conversaciones

| Clave                           | Tipo      | Valor predeterminado                                                    | Descripción                                                                    |
| ----------------------------- | --------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `rememberAcrossConversations` | `boolean` | Activado para instalaciones personales; desactivado cuando se configura el aislamiento de mensajes directos | Usar el contexto pertinente de otras conversaciones privadas reconocidas de este agente. |

Configúrelo por agente cuando solo un agente personal de confianza deba usar
la recuperación de transcripciones entre conversaciones:

```json5
{
  agents: {
    entries: {
      personal: {
        memory: {
          search: {
            rememberAcrossConversations: true,
          },
        },
      },
    },
  },
}
```

El valor sigue la herencia normal de `memory.search` con una
anulación por agente. Cuando no se establece, se activa de forma predeterminada solo si
`session.dmScope` global no está establecido o es `"main"` y ningún enlace tiene una
anulación `session.dmScope`. Cualquier aislamiento de mensajes directos configurado lo desactiva de forma predeterminada. Un valor explícito `true` o
`false` siempre prevalece. Al activarlo, se presupone la indexación de las transcripciones de sesión y
se añade `sessions` a las fuentes de memoria resueltas del agente. Con QMD, también
se activa la exportación de sesiones de ese agente; no se requiere ningún ajuste
`memory.qmd.sessions.enabled` independiente para este modo.

El proveedor de memoria integrado de OpenClaw admite esta ruta protegida tanto con el
backend integrado como con QMD. Los proveedores de memoria alternativos pueden seguir usando sus propios
hooks de recuperación y las herramientas avanzadas de Active Memory, pero este ajuste se omite
a menos que el proveedor actual admita la recuperación protegida de transcripciones privadas.
`openclaw doctor` informa de un proveedor no compatible o de una lista explícita
`toolsAllow` de Active Memory que omite `memory_search`.

El límite de recuperación es más restringido que el de la búsqueda general de sesiones:

- solo son aptas las conversaciones privadas reconocidas del mismo agente
- se excluye la conversación que se está respondiendo
- se excluyen los grupos y canales como fuentes y destinos
- los tipos de conversación desconocidos se rechazan de forma segura
- la recuperación en un entorno aislado no puede usar la autorización especial entre conversaciones

El ajuste no modifica `tools.sessions.visibility`, las claves de sesión,
el almacenamiento de transcripciones, el enrutamiento de entrega ni los permisos de `sessions_list`,
`sessions_history` y `sessions_send`. Active Memory realiza una pasada de
recuperación limitada y de solo lectura; una recuperación no disponible o que agote el tiempo de espera no bloquea la
respuesta.

---

## Selección del proveedor

| Clave        | Tipo      | Valor predeterminado          | Descripción                                                                                                                                                                                                                                                                                 |
| ---------- | --------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`  | `boolean` | `true`           | Activar o desactivar la búsqueda de memoria                                                                                                                                                                                                                                                             |
| `provider` | `string`  | `"openai"`       | ID del adaptador de embeddings, como `bedrock`, `deepinfra`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai`, `openai-compatible` o `voyage`; también puede ser un `models.providers.<id>` configurado cuyo `api` apunte a un adaptador de embeddings de memoria o a una API de modelo compatible con OpenAI |
| `model`    | `string`  | valor predeterminado del proveedor | Nombre del modelo de embeddings                                                                                                                                                                                                                                                                        |
| `fallback` | `string`  | `"none"`         | ID del adaptador de reserva cuando falla el principal                                                                                                                                                                                                                                                  |

Cuando `provider` no está establecido, OpenClaw usa embeddings de OpenAI. Establezca `provider`
explícitamente para usar Bedrock, DeepInfra, Gemini, GitHub Copilot, Mistral, Ollama,
Voyage, un modelo GGUF local o un endpoint `/v1/embeddings` compatible con OpenAI.
Las configuraciones heredadas que aún indican `provider: "auto"` se resuelven como `openai`.

<Warning>
Cambiar el proveedor de embeddings, el modelo, los ajustes del proveedor, las fuentes, el ámbito,
la fragmentación o el tokenizador puede hacer que el índice vectorial de SQLite existente sea incompatible.
OpenClaw pausa la búsqueda vectorial e informa de una advertencia sobre la identidad del índice en lugar de
volver a generar automáticamente todos los embeddings. Reconstrúyalo cuando corresponda con
`openclaw memory status --index --agent <id>` o
`openclaw memory index --force --agent <id>`.
</Warning>

Cuando `provider` no está establecido, existe el valor heredado `provider: "auto"` o
`provider: "none"` selecciona intencionadamente el modo exclusivo de FTS, la recuperación de memoria puede seguir
usando la clasificación léxica de FTS cuando los embeddings no están disponibles.

Los proveedores no locales explícitos se rechazan de forma segura. Si establece `memory.search.provider` en
un proveedor concreto respaldado por un servicio remoto, como Bedrock, DeepInfra, Gemini, GitHub
Copilot, LM Studio, Mistral, Ollama, OpenAI, Voyage o un proveedor personalizado
compatible con OpenAI, y dicho proveedor no está disponible en tiempo de ejecución, `memory_search`
devuelve un resultado de no disponibilidad en lugar de usar silenciosamente una recuperación exclusiva mediante FTS. Corrija la
configuración del proveedor o de la autenticación, cambie a un proveedor accesible o establezca
`provider: "none"` si desea usar deliberadamente una recuperación exclusiva mediante FTS.

### ID de proveedores personalizados

`memory.search.provider` puede apuntar a una entrada `models.providers.<id>` personalizada para adaptadores de proveedores específicos de memoria, como `ollama`, o para API de modelos compatibles con OpenAI, como `openai-responses` / `openai-completions`. OpenClaw resuelve el propietario `api` de ese proveedor para el adaptador de embeddings, al tiempo que conserva el ID del proveedor personalizado para gestionar el endpoint, la autenticación y el prefijo del modelo. Esto permite que las configuraciones con varias GPU o varios hosts dediquen los embeddings de memoria a un endpoint local específico:

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
  memory: {
    search: {
      provider: "ollama-5080",
      model: "qwen3-embedding:0.6b",
    },
  },
}
```

### Resolución de claves de API

Los embeddings remotos requieren una clave de API. Bedrock usa en su lugar la cadena de credenciales predeterminada del SDK de AWS (roles de instancia, SSO, claves de acceso o una clave de API de Bedrock).

| Proveedor       | Variable de entorno                                             | Clave de configuración                          |
| -------------- | --------------------------------------------------- | ----------------------------------- |
| Bedrock        | Cadena de credenciales de AWS o `AWS_BEARER_TOKEN_BEDROCK` | No se necesita ninguna clave de API                   |
| DeepInfra      | `DEEPINFRA_API_KEY`                                 | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                    | `models.providers.google.apiKey`    |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN`  | Perfil de autenticación mediante inicio de sesión en el dispositivo       |
| Mistral        | `MISTRAL_API_KEY`                                   | `models.providers.mistral.apiKey`   |
| Ollama         | `OLLAMA_API_KEY` (marcador de posición)                      | --                                  |
| OpenAI         | `OPENAI_API_KEY`                                    | `models.providers.openai.apiKey`    |
| Voyage         | `VOYAGE_API_KEY`                                    | `models.providers.voyage.apiKey`    |

<Note>
El OAuth de Codex solo abarca el chat y las finalizaciones, y no satisface las solicitudes de embeddings.
</Note>

---

## Configuración del endpoint remoto

Use `provider: "openai-compatible"` para un servidor `/v1/embeddings` genérico
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
  memory: {
    search: {
      provider: "openai-compatible",
      model: "text-embedding-3-small",
      remote: {
        baseUrl: "https://api.example.com/v1/",
        apiKey: "YOUR_KEY",
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
    Los endpoints de embeddings compatibles con OpenAI pueden habilitar campos de solicitud `input_type` específicos del proveedor. Esto resulta útil para modelos de embeddings asimétricos que requieren etiquetas diferentes para los embeddings de consultas y documentos.

    | Clave                 | Tipo     | Valor predeterminado | Descripción                                             |
    | ------------------- | -------- | ------- | -------------------------------------------------------- |
    | `inputType`         | `string` | no establecido   | `input_type` compartido para los embeddings de consultas y documentos   |
    | `queryInputType`    | `string` | no establecido   | `input_type` durante las consultas; anula `inputType`          |
    | `documentInputType` | `string` | no establecido   | `input_type` de índice/documento; anula `inputType`      |

    ```json5
    {
      memory: {
        search: {
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
    }
    ```

    Cambiar estos valores afecta a la identidad de la caché de embeddings para la indexación por lotes del proveedor y debe ir seguido de una reindexación de la memoria cuando el modelo de origen interpreta las etiquetas de forma diferente.

  </Accordion>
  <Accordion title="Bedrock">
    ### Configuración de embeddings de Bedrock

    Bedrock utiliza la cadena de credenciales predeterminada del SDK de AWS junto con un token de portador comprobado por OpenClaw, por lo que no se almacenan claves de API en la configuración. Si OpenClaw se ejecuta en EC2 con un rol de instancia habilitado para Bedrock, basta con establecer el proveedor y el modelo:

    ```json5
    {
      memory: {
        search: {
          provider: "bedrock",
          model: "amazon.titan-embed-text-v2:0",
        },
      },
    }
    ```

    | Clave                  | Tipo     | Valor predeterminado             | Descripción                              |
    | ---------------------- | -------- | -------------------------------- | ---------------------------------------- |
    | `model`     | `string` | `amazon.titan-embed-text-v2:0` | Cualquier ID de modelo de embeddings de Bedrock |
    | `outputDimensionality`     | `number` | valor predeterminado del modelo | Para Titan V2: 256, 512 o 1024 |

    **Modelos compatibles** (con detección de familia y dimensiones predeterminadas):

    | ID del modelo                                | Proveedor  | Dimensiones predeterminadas | Dimensiones configurables |
    | -------------------------------------------- | ---------- | ---------------------------- | ------------------------- |
    | `amazon.titan-embed-text-v2:0`                           | Amazon     | 1024                         | 256, 512, 1024            |
    | `amazon.titan-embed-text-v1`                           | Amazon     | 1536                         | --                        |
    | `amazon.titan-embed-g1-text-02`                           | Amazon     | 1536                         | --                        |
    | `amazon.titan-embed-image-v1`                           | Amazon     | 1024                         | --                        |
    | `amazon.nova-2-multimodal-embeddings-v1:0`                           | Amazon     | 1024                         | 256, 384, 1024, 3072      |
    | `cohere.embed-english-v3`                           | Cohere     | 1024                         | --                        |
    | `cohere.embed-multilingual-v3`                           | Cohere     | 1024                         | --                        |
    | `cohere.embed-v4:0`                           | Cohere     | 1536                         | 256, 384, 512, 768, 1024, 1536 |
    | `twelvelabs.marengo-embed-3-0-v1:0`                           | TwelveLabs | 512                          | --                        |
    | `twelvelabs.marengo-embed-2-7-v1:0`                           | TwelveLabs | 1024                         | --                        |

    Las variantes con sufijo de rendimiento (por ejemplo, `amazon.titan-embed-text-v1:2:8k`) y los ID de perfil de inferencia con prefijo de región (por ejemplo, `us.amazon.titan-embed-text-v2:0`) heredan la configuración del modelo base.

    **Región:** se resuelve en este orden: la anulación `memory.search.remote.baseUrl`, la configuración `models.providers.amazon-bedrock.baseUrl`, `AWS_REGION`, `AWS_DEFAULT_REGION` y, después, el valor predeterminado `us-east-1`.

    **Autenticación:** OpenClaw comprueba primero `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` o `AWS_BEARER_TOKEN_BEDROCK` y, después, recurre a la cadena estándar de proveedores de credenciales predeterminada del SDK de AWS:

    1. Variables de entorno (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`), salvo que también se haya establecido `AWS_PROFILE`
    2. SSO (solo cuando están configurados los campos de SSO)
    3. Archivos compartidos de credenciales y configuración (`fromIni`, incluye `AWS_PROFILE`)
    4. Proceso de credenciales (`credential_process` en el archivo de configuración de AWS)
    5. Credenciales de token de identidad web
    6. Credenciales de metadatos de instancias de ECS o EC2

    **Permisos de IAM:** el rol o usuario de IAM necesita:

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    Para aplicar el principio de privilegio mínimo, limite `InvokeModel` al modelo específico:

    ```text
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="Local (GGUF + llama.cpp)">
    | Clave                 | Tipo               | Valor predeterminado    | Descripción                                                                                                                                                                                                                                                                                                           |
    | --------------------- | ------------------ | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`    | `string` | descarga automática     | Ruta al archivo del modelo GGUF                                                                                                                                                                                                                                                                                       |
    | `local.modelCacheDir`    | `string` | valor predeterminado de node-llama-cpp | Directorio de caché para los modelos descargados                                                                                                                                                                                                                                         |
    | `local.contextSize`    | `number \| "auto"` | `4096`      | Tamaño de la ventana de contexto para el contexto de embeddings. 4096 cubre los fragmentos habituales (128-512 tokens) y limita a la vez la VRAM no destinada a los pesos. Redúzcalo a 1024-2048 en hosts con recursos limitados. `"auto"` utiliza el máximo con el que se entrenó el modelo; no se recomienda para modelos de 8B o más (Qwen3-Embedding-8B: hasta 40 960 tokens pueden elevar la VRAM a ~32 GB). |

    Instale primero el proveedor oficial de llama.cpp: `openclaw plugins install @openclaw/llama-cpp-provider`.
    Modelo predeterminado: `embeddinggemma-300m-qat-Q8_0.gguf` (~0.6 GB, descarga automática). Los checkouts del código fuente aún requieren la aprobación de la compilación nativa: `pnpm approve-builds` y después `pnpm rebuild node-llama-cpp`.

    Utilice la CLI independiente para verificar la misma ruta del proveedor que utiliza el Gateway:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    Los valores numéricos de `local.contextSize` también orientan la colocación automática de capas en la GPU de node-llama-cpp, de modo que los pesos del modelo y el contexto de embeddings solicitado quepan conjuntamente. `openclaw memory status --deep` informa del backend de llama.cpp conocido más recientemente, el dispositivo, la descarga de cómputo, el contexto solicitado y datos de memoria con marca de tiempo después de que se haya cargado el entorno de ejecución; el estado pasivo no carga ningún modelo.

    Establezca `provider: "local"` explícitamente para los embeddings GGUF locales. Se admiten `hf:` y referencias de modelos HTTP(S) en configuraciones locales explícitas (mediante la resolución de modelos de node-llama-cpp), pero no cambian el proveedor predeterminado.

  </Accordion>
</AccordionGroup>

## Comportamiento de la indexación

Los motores de memoria controlan la sincronización, el procesamiento por lotes, la supervisión y las heurísticas de indexación posteriores a la Compaction. OpenClaw mantiene estos comportamientos habilitados con valores predeterminados mantenidos, en lugar de exponer controles de temporización por instalación.

## Configuración de búsqueda híbrida

Todo bajo `memory.search.query`:

| Clave        | Tipo     | Valor predeterminado | Descripción                                            |
| ------------ | -------- | -------------------- | ------------------------------------------------------ |
| `maxResults` | `number` | `6` | Número máximo de resultados de memoria devueltos antes de la inyección |
| `minScore` | `number` | `0.35` | Puntuación mínima de relevancia para incluir un resultado |

La recuperación híbrida permanece habilitada; MMR y la disminución temporal permanecen deshabilitadas por la política integrada del motor.

### Ejemplo completo

```json5
{
  memory: {
    search: {
      query: {
        maxResults: 6,
        minScore: 0.35,
      },
    },
  },
}
```

---

## Rutas adicionales de memoria

| Clave        | Tipo       | Descripción                                      |
| ------------ | ---------- | ------------------------------------------------ |
| `extraPaths` | `string[]` | Directorios o archivos adicionales que se indexarán |

```json5
{
  memory: {
    search: {
      extraPaths: ["../team-docs", "/srv/shared-notes"],
    },
  },
}
```

Las rutas pueden ser absolutas o relativas al espacio de trabajo. Los directorios se examinan recursivamente en busca de archivos `.md`. El manejo de enlaces simbólicos depende del backend activo: el motor integrado omite los enlaces simbólicos, mientras que QMD sigue el comportamiento del analizador QMD subyacente.

Para buscar transcripciones de otros agentes con ámbito de agente, utilice `agents.entries.*.memory.search.qmd.extraCollections` en lugar de `memory.qmd.paths`. Esas colecciones adicionales siguen la misma estructura `{ path, name, pattern? }`, pero se combinan por agente y pueden conservar nombres compartidos explícitos cuando la ruta apunta fuera del espacio de trabajo actual. Si la misma ruta resuelta aparece tanto en `memory.qmd.paths` como en `memory.search.qmd.extraCollections`, QMD conserva la primera entrada y omite el duplicado.

---

## Memoria multimodal (Gemini)

Indexe imágenes y audio junto con Markdown mediante Gemini Embedding 2:

| Clave                     | Tipo               | Valor predeterminado | Descripción                                  |
| ------------------------- | ------------------ | -------------------- | -------------------------------------------- |
| `multimodal.enabled`        | `boolean` | `false`   | Habilitar la indexación multimodal           |
| `multimodal.modalities`        | `string[]` | --                   | `["image"]`, `["audio"]` o `["all"]` |
| `multimodal.maxFileBytes`        | `number` | `10485760`   | Tamaño máximo de archivo para la indexación (10 MiB) |

<Note>
Solo se aplica a los archivos de `extraPaths`. Las raíces de memoria predeterminadas continúan admitiendo únicamente Markdown. Requiere `gemini-embedding-2-preview`. `fallback` debe ser `"none"`.
</Note>

Formatos compatibles: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (imágenes); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (audio).

---

## Caché de embeddings

| Clave             | Tipo      | Valor predeterminado | Descripción                             |
| ----------------- | --------- | -------------------- | --------------------------------------- |
| `cache.enabled` | `boolean` | `true` | Almacenar en caché los embeddings de fragmentos en SQLite |

Evita volver a generar los embeddings de texto sin cambios durante la reindexación o las actualizaciones de transcripciones.

---

## Indexación por lotes

| Clave                     | Tipo               | Valor predeterminado | Descripción                         |
| ------------------------- | ------------------ | -------------------- | ----------------------------------- |
| `remote.nonBatchConcurrency`        | `number` | `4`   | Embeddings en línea paralelos       |
| `remote.batch.enabled`        | `boolean` | `false`   | Habilitar la API de embeddings por lotes |

Disponible para `gemini`, `openai` y `voyage`. El procesamiento por lotes de OpenAI suele ser la opción más rápida y económica para grandes cargas retroactivas.

El proveedor controla la concurrencia, el sondeo y el comportamiento de los tiempos de espera.

---

## Búsqueda en la memoria de sesiones

Indexe las transcripciones de sesiones y muéstrelas mediante `memory_search`:

| Clave                     | Tipo               | Valor predeterminado | Descripción                                      |
| ------------------------- | ------------------ | -------------------- | ------------------------------------------------ |
| `rememberAcrossConversations`        | `boolean` | `false`   | Permitir el recuerdo privado entre conversaciones |
| `sources`        | `string[]` | `["memory"]`   | Añadir `"sessions"` para incluir transcripciones |

<Warning>
La indexación de sesiones es opcional y se ejecuta de forma asíncrona. Los resultados pueden estar ligeramente desactualizados. Los registros de sesión se almacenan en el disco, por lo que el acceso al sistema de archivos debe considerarse el límite de confianza.
</Warning>

La búsqueda ordinaria de transcripciones de sesión invocada por el modelo respeta
[`tools.sessions.visibility`](/es/gateway/config-tools#toolssessions). La visibilidad predeterminada
`tree` expone la sesión actual, las sesiones que esta inició y
las sesiones de grupo del mismo agente observadas mediante el conocimiento contextual del grupo. Otras
sesiones no relacionadas requieren la visibilidad `agent` (o `all` únicamente cuando también
se requiere recuperación entre agentes y la política entre agentes lo permite).

`rememberAcrossConversations` no amplía esa configuración. Proporciona una
autorización independiente, exclusiva del entorno de ejecución y limitada a las transcripciones
privadas del mismo agente durante la ejecución acotada de Active Memory.

Los ejemplos siguientes sitúan esta configuración bajo el nivel superior `memory.search`. También se puede
aplicar una configuración equivalente mediante una anulación `memory.search` por agente cuando solo uno
deba indexar y buscar transcripciones de sesión.

Para la recuperación del Gateway a mensajes directos del mismo agente:

<Tabs>
  <Tab title="Backend integrado">
    ```json5
    {
      memory: {
        search: {
          experimental: { sessionMemory: true },
          sources: ["memory", "sessions"],
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
      memory: {
        backend: "qmd",
        search: {
          experimental: { sessionMemory: true },
          sources: ["memory", "sessions"],
        },
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

Al usar QMD, `sources: ["sessions"]` no exporta por sí solo las transcripciones a QMD. Configure
también `memory.qmd.sessions.enabled: true`. La configuración de nivel superior
`rememberAcrossConversations: true` es la excepción: implica la
exportación de sesiones QMD necesaria para ese agente. Las exportaciones implícitas permanecen privadas:
siempre utilizan la ubicación interna de exportación predeterminada (un
`sessions.exportDir` configurado se aplica solo a las exportaciones explícitas), solo se buscan
durante la recuperación entre conversaciones de ese agente y el acceso ordinario mediante `memory_get`
no puede leerlas. La configuración explícita
`memory.qmd.sessions.enabled: true` conserva su comportamiento actual e incorpora
las transcripciones exportadas al corpus ordinario de memoria.

---

## Aceleración vectorial de SQLite (sqlite-vec)

| Clave                        | Tipo      | Valor predeterminado | Descripción                              |
| ---------------------------- | --------- | -------------------- | ---------------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`  | Usar sqlite-vec para consultas vectoriales |
| `store.vector.extensionPath` | `string`  | incluido | Anular la ruta de sqlite-vec             |

Cuando sqlite-vec no está disponible, OpenClaw recurre automáticamente a la similitud de coseno dentro del proceso.

---

## Almacenamiento del índice

Los índices de memoria integrados se encuentran en la base de datos SQLite de OpenClaw de cada agente en
`agents/<agentId>/agent/openclaw-agent.sqlite`.

| Clave                 | Tipo     | Valor predeterminado | Descripción                                           |
| --------------------- | -------- | -------------------- | ----------------------------------------------------- |
| `store.fts.tokenizer` | `string` | `unicode61` | Tokenizador FTS5 (`unicode61` o `trigram`) |

---

## Configuración del backend QMD

Configure `memory.backend = "qmd"` para habilitarlo. Toda la configuración de QMD se encuentra bajo `memory.qmd`:

| Clave                    | Tipo      | Valor predeterminado | Descripción                                                                                                      |
| ------------------------ | --------- | -------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `command`                | `string`  | `qmd`    | Ruta del ejecutable QMD; establezca una ruta absoluta cuando el `PATH` del servicio difiera del shell |
| `searchMode`             | `string`  | `search` | Comando de búsqueda: `search`, `vsearch`, `query`                                      |
| `rerank`                 | `boolean` | --       | Establezca `false` con `searchMode: "query"` y QMD 2.1+ para omitir la reclasificación de QMD                |
| `includeDefaultMemory`   | `boolean` | `true`   | Indexar automáticamente `MEMORY.md` + `memory/**/*.md`                                                        |
| `paths[]`                | `array`   | --       | Rutas adicionales: `{ name, path, pattern? }`                                                                                 |
| `sessions.enabled`       | `boolean` | `false`  | Exportar las transcripciones de sesión a QMD                                                                         |
| `sessions.retentionDays` | `number`  | --       | Retención de transcripciones                                                                                         |
| `sessions.exportDir`     | `string`  | --       | Directorio de exportación                                                                                            |

`searchMode: "search"` utiliza únicamente búsqueda léxica/BM25. OpenClaw no ejecuta comprobaciones de disponibilidad de vectores semánticos ni tareas de mantenimiento de incrustaciones de QMD para ese modo, incluso durante `memory status --deep`; `vsearch` y `query` siguen requiriendo que los vectores y las incrustaciones de QMD estén disponibles.

`rerank: false` solo cambia el modo `query` de QMD y requiere QMD 2.1 o posterior. En el modo CLI directo, OpenClaw pasa `--no-rerank`; en el modo MCP respaldado por mcporter, pasa `rerank: false` a la herramienta de consulta unificada de QMD. Déjelo sin configurar para usar el comportamiento predeterminado de reclasificación de consultas de QMD.

OpenClaw prefiere las formas actuales de las colecciones y consultas MCP de QMD, pero mantiene la compatibilidad con versiones anteriores de QMD probando indicadores de patrones de colecciones compatibles y nombres anteriores de herramientas MCP cuando es necesario. Cuando QMD anuncia compatibilidad con varios filtros de colecciones, las colecciones del mismo origen se buscan con un único proceso QMD; las compilaciones anteriores de QMD conservan la ruta de compatibilidad por colección. «Mismo origen» significa que las colecciones de memoria persistente (los archivos de memoria predeterminados más las rutas personalizadas) se agrupan, mientras que las colecciones de transcripciones de sesión permanecen en un grupo independiente para que la diversificación de orígenes siga disponiendo de ambas entradas.

<Note>
Las anulaciones de modelos de QMD se mantienen en QMD, no en la configuración de OpenClaw. Si necesita anular globalmente los modelos de QMD, establezca variables de entorno como `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` y `QMD_GENERATE_MODEL` en el entorno de ejecución del Gateway.
</Note>

<AccordionGroup>
  <Accordion title="Límites">
    | Clave                     | Tipo     | Valor predeterminado | Descripción                                                                                                                                                |
    | ------------------------- | -------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `limits.maxResults`       | `number` | `4`     | Número máximo de resultados de búsqueda                                                                                                                    |
    | `limits.maxSnippetChars`  | `number` | `450`   | Limitar la longitud del fragmento                                                                                                                          |
    | `limits.maxInjectedChars` | `number` | `2200`  | Limitar el total de caracteres inyectados                                                                                                                  |
    | `limits.timeoutMs`        | `number` | `4000`  | Tiempo de espera del comando QMD durante búsquedas respaldadas por QMD, incluido `memory_search`; la configuración, sincronización, recuperación integrada y el trabajo complementario conservan el plazo predeterminado de la herramienta |
  </Accordion>
  <Accordion title="Ámbito">
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

    El valor predeterminado incluido solo permite mensajes directos y deniega los grupos y otros tipos de canal. `match.keyPrefix` coincide con la clave de sesión normalizada; `match.rawKeyPrefix` coincide con la clave sin procesar, incluido `agent:<id>:`.

  </Accordion>
  <Accordion title="Citas">
    `memory.citations` se aplica a todos los backends:

    | Valor                      | Comportamiento                                                        |
    | -------------------------- | --------------------------------------------------------------------- |
    | `auto` (predeterminado) | Incluir el pie `Source: <path#line>` en los fragmentos            |
    | `on`         | Incluir siempre el pie                                                 |
    | `off`         | Omitir el pie (la ruta se sigue pasando internamente al agente)        |

  </Accordion>
</AccordionGroup>

QMD se inicializa de forma diferida la primera vez que se utiliza la memoria; su adaptador gestiona las programaciones de actualización e incrustación.

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

Dreaming se configura bajo `plugins.entries.memory-core.config.dreaming`, no bajo `memory.search`.

Dreaming se ejecuta como un único barrido programado y utiliza fases internas ligera, profunda y REM como detalle de implementación.

Para consultar el comportamiento conceptual y los comandos con barra, véase [Dreaming](/es/concepts/dreaming).

### Configuración del usuario

| Clave                                  | Tipo      | Valor predeterminado | Descripción                                                                                                                             |
| -------------------------------------- | --------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                              | `boolean` | `false`       | Habilitar o deshabilitar Dreaming por completo                                                                                          |
| `frequency`                            | `string`  | `0 3 * * *`   | Cadencia cron opcional para el barrido completo de Dreaming                                                                             |
| `model`                                | `string`  | modelo predeterminado | Anulación opcional del modelo del subagente Dream Diary                                                                                 |
| `phases.deep.maxPromotedSnippetTokens` | `number`  | `160`         | Número máximo estimado de tokens conservados de cada fragmento de recuperación a corto plazo promovido a `MEMORY.md`; los metadatos de procedencia permanecen visibles |

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
- Dreaming escribe una salida narrativa legible por humanos en `DREAMS.md` (o en el `dreams.md` existente).
- `dreaming.model` utiliza la barrera de confianza existente para subagentes del Plugin; configure `plugins.entries.memory-core.subagent.allowModelOverride: true` antes de habilitarlo.
- Dream Diary reintenta una vez con el modelo predeterminado de la sesión cuando el modelo configurado no está disponible. Los fallos de confianza o de la lista de permitidos se registran y no se reintentan silenciosamente.
- La política y los umbrales de las fases ligera, profunda y REM constituyen un comportamiento interno, no una configuración orientada al usuario.

</Note>

## Temas relacionados

- [Referencia de configuración](/es/gateway/configuration-reference)
- [Descripción general de la memoria](/es/concepts/memory)
- [Búsqueda en memoria](/es/concepts/memory-search)
