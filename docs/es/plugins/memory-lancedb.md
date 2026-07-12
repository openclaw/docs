---
read_when:
    - Estás configurando el plugin memory-lancedb
    - Quieres memoria a largo plazo respaldada por LanceDB con recuperación o captura automáticas
    - Está utilizando embeddings locales compatibles con OpenAI, como Ollama
sidebarTitle: Memory LanceDB
summary: Configura el plugin oficial externo de memoria LanceDB, incluidas las incrustaciones locales compatibles con Ollama
title: Memoria LanceDB
x-i18n:
    generated_at: "2026-07-11T23:18:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cdcf5ef7b7fbb8bf6055363d86782cfa36df193fc724406dba06c1380fd9f434
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb` es un plugin externo oficial que almacena memoria a largo plazo en
LanceDB con búsqueda vectorial. Puede recuperar automáticamente recuerdos relevantes antes de un turno
del modelo y capturar automáticamente hechos importantes después de una respuesta.

Úselo para una base de datos vectorial local, un endpoint de embeddings compatible con OpenAI o
un almacén de memoria fuera del backend de memoria integrado predeterminado.

## Instalación

```bash
openclaw plugins install @openclaw/memory-lancedb
```

El plugin se publica en npm; no está incluido en la imagen de ejecución de OpenClaw.
Al instalarlo, se escribe la entrada del plugin, se habilita y se cambia
`plugins.slots.memory` a `memory-lancedb`. Si actualmente otro plugin ocupa
la ranura de memoria, se deshabilita con una advertencia.

<Note>
Los plugins complementarios, como `memory-wiki`, pueden ejecutarse junto con `memory-lancedb`,
pero solo un plugin ocupa la ranura de memoria activa a la vez.
</Note>

## Inicio rápido

```json5
{
  plugins: {
    slots: {
      memory: "memory-lancedb",
    },
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            provider: "openai",
            model: "text-embedding-3-small",
          },
          autoRecall: true,
          autoCapture: false,
        },
      },
    },
  },
}
```

Reinicie el Gateway después de cambiar la configuración del plugin y, a continuación, compruebe que se haya cargado:

```bash
openclaw gateway restart
openclaw plugins list
```

## Configuración de embeddings

`embedding` es obligatorio y debe incluir al menos un campo. El valor predeterminado de `provider`
es `openai`; el de `model` es `text-embedding-3-small`.

| Campo                  | Tipo          | Notas                                                                    |
| ---------------------- | ------------- | ------------------------------------------------------------------------ |
| `embedding.provider`   | cadena        | Id. del adaptador, p. ej., `openai`, `github-copilot`, `ollama`. Valor predeterminado: `openai`. |
| `embedding.model`      | cadena        | Valor predeterminado: `text-embedding-3-small`.                           |
| `embedding.apiKey`     | cadena        | Opcional; admite la expansión de `${ENV_VAR}`.                            |
| `embedding.baseUrl`    | cadena        | Opcional; admite la expansión de `${ENV_VAR}`.                            |
| `embedding.dimensions` | entero (>=1)  | Obligatorio para los modelos que no estén en la tabla integrada (véase más adelante). |

Existen dos rutas de solicitud:

- **Ruta del adaptador del proveedor** (predeterminada): establezca `embedding.provider` y omita
  `embedding.apiKey`/`embedding.baseUrl`. El plugin resuelve el perfil de autenticación
  configurado del proveedor, la variable de entorno o
  `models.providers.<provider>.apiKey` mediante los mismos adaptadores de embeddings de memoria
  que utiliza `memory-core`. Esta es la ruta para `github-copilot`, `ollama`
  y cualquier otro proveedor incluido que admita embeddings.
- **Ruta directa del cliente compatible con OpenAI**: deje `embedding.provider` sin establecer
  (o como `"openai"`) y establezca `embedding.apiKey` junto con `embedding.baseUrl`. Utilice esta
  opción para un endpoint de embeddings compatible con OpenAI que no tenga un adaptador de proveedor
  incluido.

OAuth de OpenAI Codex / ChatGPT no es una credencial de embeddings de la plataforma OpenAI.
Para los embeddings de OpenAI, utilice un perfil de autenticación con clave de API de OpenAI, `OPENAI_API_KEY` o
`models.providers.openai.apiKey`. Los usuarios que solo dispongan de OAuth deben elegir otro
proveedor compatible con embeddings, como `github-copilot` u `ollama`.

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            provider: "github-copilot",
            model: "text-embedding-3-small",
          },
        },
      },
    },
  },
}
```

Algunos endpoints de embeddings compatibles con OpenAI rechazan el parámetro `encoding_format`;
otros lo ignoran y siempre devuelven `number[]`. `memory-lancedb`
omite `encoding_format` en las solicitudes y acepta respuestas de matrices de números de coma flotante o
float32 codificadas en base64, por lo que ambos formatos de respuesta funcionan sin configuración.

### Dimensiones

OpenClaw solo tiene dimensiones integradas para `text-embedding-3-small` (1536) y
`text-embedding-3-large` (3072). Cualquier otro modelo necesita un valor explícito de
`embedding.dimensions` para que LanceDB pueda crear la columna vectorial; por ejemplo,
ZhiPu `embedding-3` con 2048 dimensiones:

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            apiKey: "${ZHIPU_API_KEY}",
            baseUrl: "https://open.bigmodel.cn/api/paas/v4",
            model: "embedding-3",
            dimensions: 2048,
          },
        },
      },
    },
  },
}
```

## Embeddings de Ollama

Utilice la ruta del adaptador del proveedor Ollama incluido (`embedding.provider: "ollama"`).
Esta llama al endpoint nativo `/api/embed` de Ollama y sigue las mismas reglas de autenticación y URL
base que el proveedor [Ollama](/es/providers/ollama).

```json5
{
  plugins: {
    slots: {
      memory: "memory-lancedb",
    },
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            provider: "ollama",
            baseUrl: "http://127.0.0.1:11434",
            model: "mxbai-embed-large",
            dimensions: 1024,
          },
          recallMaxChars: 400,
          autoRecall: true,
          autoCapture: false,
        },
      },
    },
  },
}
```

`mxbai-embed-large` no está en la tabla de dimensiones integrada, por lo que `dimensions` es
obligatorio. Para modelos locales de embeddings pequeños, reduzca `recallMaxChars` si el
servidor local devuelve errores de longitud de contexto.

## Límites de recuperación y captura

| Ajuste            | Valor predeterminado | Intervalo                     | Se aplica a                                                |
| ----------------- | -------------------- | ----------------------------- | ---------------------------------------------------------- |
| `recallMaxChars`  | `1000`               | 100-10000                     | Texto enviado a la API de embeddings para la recuperación. |
| `captureMaxChars` | `500`                | 100-10000                     | Longitud de mensaje apta para la captura automática.        |
| `customTriggers`  | `[]`                 | 0-50 elementos, cada uno <=100 caracteres | Frases literales que hacen que la captura automática considere un mensaje. |

`recallMaxChars` limita la consulta de recuperación automática de `before_prompt_build`, la
herramienta `memory_recall`, la ruta de consulta de `memory_forget` y `openclaw ltm
search`. La recuperación automática genera el embedding del último mensaje del usuario del turno y
solo recurre al prompt completo cuando no hay ningún mensaje del usuario, lo que excluye
los metadatos del canal y los bloques de prompt grandes de la solicitud de embeddings.

`captureMaxChars` determina si un mensaje del usuario del evento `agent_end`
del turno es lo bastante corto como para considerarlo para la captura automática; no afecta a
las consultas de recuperación.

`customTriggers` añade frases literales de captura automática sin expresiones regulares. Los activadores
integrados abarcan frases habituales de memoria en inglés, checo, chino, japonés y coreano
(`remember`, `prefer`, `记住`, `覚えて`, `기억해` y similares).

La captura automática también rechaza el texto que parece contener metadatos de envoltura o transporte,
cargas de inyección de prompt o contexto `<relevant-memories>` ya inyectado,
y establece un máximo de 3 recuerdos capturados por turno del agente.

## Comandos

`memory-lancedb` registra el espacio de nombres `ltm` de la CLI siempre que está instalado
(no solo cuando ocupa la ranura de memoria activa):

```bash
openclaw ltm list [--limit <n>] [--order-by-created-at]
openclaw ltm search <query> [--limit <n>]
openclaw ltm stats
```

`ltm query` ejecuta una consulta no vectorial directamente en la tabla de LanceDB:

```bash
openclaw ltm query --cols id,text,createdAt --limit 20
openclaw ltm query --filter "category = 'preference'" --order-by createdAt:desc
```

| Indicador                         | Valor predeterminado                     | Notas                                                                                                                                     |
| --------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `--cols <columns>`                | `id,text,importance,category,createdAt`  | Lista de columnas permitidas separadas por comas.                                                                                         |
| `--filter <condition>`            | ninguno                                  | Cláusula WHERE con sintaxis SQL. Máximo de 200 caracteres; solo se permiten caracteres alfanuméricos, `_-`, espacios en blanco y `='"<>!.,()%*`. |
| `--limit <n>`                     | `10`                                     | Entero positivo.                                                                                                                          |
| `--order-by <column>:<asc\|desc>` | ninguno                                  | Se ordena en memoria después de aplicar el filtro; la columna de ordenación se añade automáticamente a la proyección y se elimina de la salida si no se solicitó. |

Los agentes reciben tres herramientas del plugin de memoria activo:

- `memory_recall`: búsqueda vectorial en los recuerdos almacenados.
- `memory_store`: guarda un hecho, una preferencia, una decisión o una entidad (rechaza texto
  que parezca una carga de inyección de prompt; omite los elementos almacenados casi duplicados).
- `memory_forget`: elimina por `memoryId` o por `query` (elimina automáticamente una única
  coincidencia con una puntuación superior al 90 %; de lo contrario, muestra los Id. candidatos para desambiguar).

## Almacenamiento

Los datos de LanceDB se almacenan de forma predeterminada en `~/.openclaw/memory/lancedb`. Sobrescriba esta ubicación con `dbPath`:

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          dbPath: "~/.openclaw/memory/lancedb",
          embedding: {
            apiKey: "${OPENAI_API_KEY}",
            model: "text-embedding-3-small",
          },
        },
      },
    },
  },
}
```

`storageOptions` acepta pares clave/valor de cadena para backends de almacenamiento de LanceDB
(p. ej., almacenamiento de objetos compatible con S3) y admite la expansión de `${ENV_VAR}`:

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          dbPath: "s3://memory-bucket/openclaw",
          storageOptions: {
            access_key: "${AWS_ACCESS_KEY_ID}",
            secret_key: "${AWS_SECRET_ACCESS_KEY}",
            endpoint: "${AWS_ENDPOINT_URL}",
          },
          embedding: {
            apiKey: "${OPENAI_API_KEY}",
            model: "text-embedding-3-small",
          },
        },
      },
    },
  },
}
```

## Dependencias de ejecución y compatibilidad con plataformas

`memory-lancedb` depende del paquete nativo `@lancedb/lancedb`, que pertenece al
paquete del plugin (no a la distribución principal de OpenClaw). El inicio del Gateway no repara
las dependencias del plugin; si falta la dependencia nativa o no se puede cargar,
reinstale o actualice el paquete del plugin y reinicie el Gateway.

`@lancedb/lancedb` no publica una compilación nativa para `darwin-x64` (Mac
Intel). En esa plataforma, el plugin registra durante la carga que LanceDB no está disponible;
utilice el backend de memoria predeterminado, ejecute el Gateway en una
plataforma o arquitectura compatible, o deshabilite `memory-lancedb`.

## Solución de problemas

### La longitud de la entrada supera la longitud del contexto

El modelo de embeddings rechazó la consulta de recuperación:

```text
memory-lancedb: recall failed: Error: 400 the input length exceeds the context length
```

Reduzca `recallMaxChars` y, a continuación, reinicie el Gateway:

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        config: {
          recallMaxChars: 400,
        },
      },
    },
  },
}
```

Para Ollama, compruebe también que se pueda acceder al servidor de embeddings desde el host del Gateway
mediante su endpoint nativo de embeddings:

```bash
curl http://127.0.0.1:11434/api/embed \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### Modelo de embeddings no compatible

Sin `embedding.dimensions`, solo se conocen las dimensiones integradas de los embeddings de OpenAI
(`text-embedding-3-small`, `text-embedding-3-large`). Para cualquier otro
modelo, establezca `embedding.dimensions` en el tamaño vectorial que indique el modelo.

### El plugin se carga, pero no aparece ningún recuerdo

Confirma que `plugins.slots.memory` apunte a `memory-lancedb` y, a continuación, ejecuta:

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

Si `autoCapture` está deshabilitado, el plugin sigue recuperando los recuerdos existentes, pero
no almacena nuevos automáticamente. Usa la herramienta `memory_store` o habilita
`autoCapture`.

## Contenido relacionado

- [Descripción general de la memoria](/es/concepts/memory)
- [Active Memory](/es/concepts/active-memory)
- [Búsqueda en la memoria](/es/concepts/memory-search)
- [Wiki de memoria](/es/plugins/memory-wiki)
- [Ollama](/es/providers/ollama)
