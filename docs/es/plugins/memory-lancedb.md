---
read_when:
    - Estás configurando el Plugin memory-lancedb
    - Quieres memoria a largo plazo respaldada por LanceDB con recuperación automática o captura automática.
    - Estás usando embeddings locales compatibles con OpenAI, como Ollama
sidebarTitle: Memory LanceDB
summary: Configura el Plugin de memoria externo oficial de LanceDB, incluidas las incrustaciones locales compatibles con Ollama
title: Memory LanceDB
x-i18n:
    generated_at: "2026-07-05T11:30:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cdcf5ef7b7fbb8bf6055363d86782cfa36df193fc724406dba06c1380fd9f434
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb` es un plugin externo oficial que almacena memoria a largo plazo en
LanceDB con búsqueda vectorial. Puede recuperar automáticamente recuerdos relevantes antes
de un turno del modelo y capturar automáticamente hechos importantes después de una respuesta.

Úsalo para una base de datos vectorial local, un endpoint de embeddings compatible con OpenAI o
un almacén de memoria fuera del backend de memoria integrado predeterminado.

## Instalación

```bash
openclaw plugins install @openclaw/memory-lancedb
```

El plugin se publica en npm; no está incluido en la imagen de runtime de OpenClaw.
Instalarlo escribe la entrada del plugin, lo habilita y cambia
`plugins.slots.memory` a `memory-lancedb`. Si otro plugin posee actualmente
el slot de memoria, ese plugin se deshabilita con una advertencia.

<Note>
Los plugins complementarios como `memory-wiki` pueden ejecutarse junto a `memory-lancedb`,
pero solo un plugin posee el slot de memoria activo a la vez.
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

Reinicia el Gateway después de cambiar la configuración del plugin y luego verifica que se haya cargado:

```bash
openclaw gateway restart
openclaw plugins list
```

## Configuración de embeddings

`embedding` es obligatorio y debe incluir al menos un campo. `provider`
tiene como valor predeterminado `openai`; `model` tiene como valor predeterminado `text-embedding-3-small`.

| Campo                  | Tipo          | Notas                                                                    |
| ---------------------- | ------------- | ------------------------------------------------------------------------ |
| `embedding.provider`   | string        | Id. de adaptador, p. ej. `openai`, `github-copilot`, `ollama`. Predeterminado `openai`. |
| `embedding.model`      | string        | Predeterminado `text-embedding-3-small`.                                        |
| `embedding.apiKey`     | string        | Opcional; admite expansión `${ENV_VAR}`.                               |
| `embedding.baseUrl`    | string        | Opcional; admite expansión `${ENV_VAR}`.                               |
| `embedding.dimensions` | integer (>=1) | Obligatorio para modelos que no están en la tabla integrada (ver abajo).               |

Existen dos rutas de solicitud:

- **Ruta del adaptador de proveedor** (predeterminada): define `embedding.provider` y omite
  `embedding.apiKey`/`embedding.baseUrl`. El plugin resuelve el perfil de autenticación
  configurado del proveedor, la variable de entorno o
  `models.providers.<provider>.apiKey` mediante los mismos adaptadores de embeddings de memoria
  que usa `memory-core`. Esta es la ruta para `github-copilot`, `ollama`
  y cualquier otro proveedor incluido con soporte de embeddings.
- **Ruta de cliente directo compatible con OpenAI**: deja `embedding.provider` sin definir
  (o `"openai"`) y define `embedding.apiKey` junto con `embedding.baseUrl`. Usa esto
  para un endpoint de embeddings sin procesar compatible con OpenAI que no tenga un adaptador
  de proveedor incluido.

OpenAI Codex / ChatGPT OAuth no es una credencial de embeddings de OpenAI Platform.
Para embeddings de OpenAI, usa un perfil de autenticación con clave de API de OpenAI, `OPENAI_API_KEY` o
`models.providers.openai.apiKey`. Los usuarios que solo usan OAuth deberían elegir otro
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

Algunos endpoints de embeddings compatibles con OpenAI rechazan el parámetro
`encoding_format`; otros lo ignoran y siempre devuelven `number[]`. `memory-lancedb`
omite `encoding_format` en las solicitudes y acepta respuestas de arreglo de flotantes o
float32 codificadas en base64, por lo que ambas formas de respuesta funcionan sin configuración.

### Dimensiones

OpenClaw solo tiene una dimensión integrada para `text-embedding-3-small` (1536) y
`text-embedding-3-large` (3072). Cualquier otro modelo necesita un
`embedding.dimensions` explícito para que LanceDB pueda crear la columna vectorial, por ejemplo
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

Usa la ruta del adaptador de proveedor Ollama incluido (`embedding.provider: "ollama"`).
Llama al endpoint nativo `/api/embed` de Ollama y sigue las mismas reglas de autenticación/base
URL que el proveedor [Ollama](/es/providers/ollama).

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
obligatorio. Para modelos de embeddings locales pequeños, reduce `recallMaxChars` si el
servidor local devuelve errores de longitud de contexto.

## Límites de recuperación y captura

| Ajuste            | Predeterminado | Rango                        | Se aplica a                                                 |
| ----------------- | -------------- | ---------------------------- | ---------------------------------------------------------- |
| `recallMaxChars`  | `1000`         | 100-10000                    | Texto enviado a la API de embeddings para recuperación.                 |
| `captureMaxChars` | `500`          | 100-10000                    | Longitud de mensaje apta para captura automática.                  |
| `customTriggers`  | `[]`           | 0-50 elementos, cada uno <=100 caracteres | Frases literales que hacen que la captura automática considere un mensaje. |

`recallMaxChars` limita la consulta de recuperación automática `before_prompt_build`, la
herramienta `memory_recall`, la ruta de consulta `memory_forget` y `openclaw ltm
search`. La recuperación automática incrusta el último mensaje del usuario del turno y recurre
al prompt completo solo cuando no hay ningún mensaje de usuario, manteniendo los metadatos del canal
y los bloques grandes de prompt fuera de la solicitud de embeddings.

`captureMaxChars` controla si un mensaje de usuario del evento `agent_end` del turno
es lo bastante corto para ser considerado para captura automática; no afecta a las
consultas de recuperación.

`customTriggers` añade frases literales de captura automática sin regex. Los disparadores
integrados cubren frases comunes de memoria en inglés, checo, chino, japonés y coreano
(`remember`, `prefer`, `记住`, `覚えて`, `기억해` y similares).

La captura automática también rechaza texto que parezca metadatos de sobre/transporte,
cargas de inyección de prompt o contexto `<relevant-memories>` ya inyectado,
y tiene un límite de 3 recuerdos capturados por turno de agente.

## Comandos

`memory-lancedb` registra el espacio de nombres CLI `ltm` siempre que está instalado
(no solo cuando posee el slot de memoria activo):

```bash
openclaw ltm list [--limit <n>] [--order-by-created-at]
openclaw ltm search <query> [--limit <n>]
openclaw ltm stats
```

`ltm query` ejecuta una consulta no vectorial directamente contra la tabla de LanceDB:

```bash
openclaw ltm query --cols id,text,createdAt --limit 20
openclaw ltm query --filter "category = 'preference'" --order-by createdAt:desc
```

| Marca                             | Predeterminado                         | Notas                                                                                                                                     |
| --------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `--cols <columns>`                | `id,text,importance,category,createdAt` | Lista de columnas permitidas separadas por comas.                                                                                                         |
| `--filter <condition>`            | ninguna                                 | Cláusula WHERE estilo SQL. Máx. 200 caracteres; solo se permiten alfanuméricos, `_-`, espacios en blanco y `='"<>!.,()%*`.                              |
| `--limit <n>`                     | `10`                                    | Entero positivo.                                                                                                                         |
| `--order-by <column>:<asc\|desc>` | ninguna                                 | Ordenado en memoria después de ejecutar el filtro; la columna de ordenación se añade automáticamente a la proyección y se elimina de la salida si no se solicitó. |

Los agentes obtienen tres herramientas del plugin de memoria activo:

- `memory_recall`: búsqueda vectorial sobre recuerdos almacenados.
- `memory_store`: guarda un hecho, preferencia, decisión o entidad (rechaza texto
  que parece una carga de inyección de prompt; omite almacenamientos casi duplicados).
- `memory_forget`: elimina por `memoryId` o por `query` (elimina automáticamente una única
  coincidencia por encima de 90% de puntuación; de lo contrario, enumera los ID candidatos para desambiguar).

## Almacenamiento

Los datos de LanceDB tienen como valor predeterminado `~/.openclaw/memory/lancedb`. Sobrescríbelo con `dbPath`:

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
(p. ej. almacenamiento de objetos compatible con S3) y admite expansión `${ENV_VAR}`:

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

## Dependencias de runtime y soporte de plataforma

`memory-lancedb` depende del paquete nativo `@lancedb/lancedb`, propiedad del
paquete del plugin (no de la distribución del núcleo de OpenClaw). El inicio del Gateway no repara
dependencias de plugins; si la dependencia nativa falta o no se puede cargar,
reinstala o actualiza el paquete del plugin y reinicia el Gateway.

`@lancedb/lancedb` no publica una compilación nativa para `darwin-x64` (Intel
Mac). En esa plataforma, el plugin registra que LanceDB no está disponible en el momento de carga;
usa el backend de memoria predeterminado, ejecuta el Gateway en una
plataforma/arquitectura compatible o deshabilita `memory-lancedb`.

## Solución de problemas

### La longitud de entrada supera la longitud de contexto

El modelo de embeddings rechazó la consulta de recuperación:

```text
memory-lancedb: recall failed: Error: 400 the input length exceeds the context length
```

Reduce `recallMaxChars` y luego reinicia el Gateway:

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

Para Ollama, verifica también que el servidor de embeddings sea accesible desde el host del Gateway
usando su endpoint nativo de embeddings:

```bash
curl http://127.0.0.1:11434/api/embed \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### Modelo de embeddings no compatible

Sin `embedding.dimensions`, solo se conocen las dimensiones de embeddings de OpenAI integradas
(`text-embedding-3-small`, `text-embedding-3-large`). Para cualquier otro
modelo, define `embedding.dimensions` con el tamaño de vector que informa ese modelo.

### El plugin se carga pero no aparecen recuerdos

Confirma que `plugins.slots.memory` apunta a `memory-lancedb` y, luego, ejecuta:

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

Si `autoCapture` está deshabilitado, el plugin sigue recuperando recuerdos existentes, pero
no almacena nuevos automáticamente. Usa la herramienta `memory_store` o habilita
`autoCapture`.

## Relacionado

- [Descripción general de la memoria](/es/concepts/memory)
- [Active Memory](/es/concepts/active-memory)
- [Búsqueda de memoria](/es/concepts/memory-search)
- [Wiki de memoria](/es/plugins/memory-wiki)
- [Ollama](/es/providers/ollama)
