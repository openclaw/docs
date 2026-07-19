---
read_when:
    - Está configurando el plugin memory-lancedb
    - Quieres memoria a largo plazo respaldada por LanceDB con recuperación automática o captura automática
    - Está utilizando embeddings locales compatibles con OpenAI, como Ollama
sidebarTitle: Memory LanceDB
summary: Configura el plugin externo oficial de memoria LanceDB, incluidas las incrustaciones locales compatibles con Ollama
title: Memoria LanceDB
x-i18n:
    generated_at: "2026-07-19T02:04:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 771b28b9775175f53d3e6543e66618a56dd40ef95598c00c7abf9b62fb261e47
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

El plugin se publica en npm; no está incluido en la imagen del entorno de ejecución de OpenClaw.
Al instalarlo, se escribe la entrada del plugin, se habilita y se cambia
`plugins.slots.memory` a `memory-lancedb`. Si otro plugin ocupa actualmente
la ranura de memoria, dicho plugin se deshabilita con una advertencia.

<Note>
Los plugins complementarios como `memory-wiki` pueden ejecutarse junto con `memory-lancedb`,
pero solo un plugin ocupa la ranura de memoria activa a la vez.
</Note>

<Note>
`memory_recall` de LanceDB no recibe la autorización protegida de transcripciones privadas
que utiliza `memorySearch.rememberAcrossConversations`. Use `autoRecall`
de LanceDB o su herramienta `memory_recall` mediante
[Active Memory avanzada](/es/concepts/active-memory#lancedb-memory).
`openclaw doctor` indica cuándo Recordar entre conversaciones no está disponible
con el proveedor de memoria actual.
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

`embedding` es obligatorio y debe incluir al menos un campo. `provider`
tiene como valor predeterminado `openai`; `model` tiene como valor predeterminado `text-embedding-3-small`.

| Campo                  | Tipo          | Notas                                                                    |
| ---------------------- | ------------- | ------------------------------------------------------------------------ |
| `embedding.provider`   | cadena        | Id. del adaptador, p. ej., `openai`, `github-copilot`, `ollama`. Valor predeterminado: `openai`. |
| `embedding.model`      | cadena        | Valor predeterminado: `text-embedding-3-small`.                                        |
| `embedding.apiKey`     | cadena        | Opcional; admite la expansión de `${ENV_VAR}`.                               |
| `embedding.baseUrl`    | cadena        | Opcional; admite la expansión de `${ENV_VAR}`.                               |
| `embedding.dimensions` | entero (>=1) | Obligatorio para los modelos que no están en la tabla integrada (véase más adelante).               |

Existen dos rutas de solicitud:

- **Ruta del adaptador del proveedor** (predeterminada): establezca `embedding.provider` y omita
  `embedding.apiKey`/`embedding.baseUrl`. El plugin resuelve el perfil de
  autenticación configurado del proveedor, la variable de entorno o
  `models.providers.<provider>.apiKey` mediante los mismos adaptadores de embeddings
  de memoria que utiliza `memory-core`. Esta es la ruta para `github-copilot`, `ollama`
  y cualquier otro proveedor incluido que admita embeddings.
- **Ruta directa del cliente compatible con OpenAI**: deje `embedding.provider` sin establecer
  (o `"openai"`) y establezca `embedding.apiKey` más `embedding.baseUrl`. Use esta ruta
  para un endpoint de embeddings compatible con OpenAI sin un adaptador
  de proveedor incluido.

OAuth de OpenAI Codex/ChatGPT no es una credencial de embeddings de OpenAI Platform.
Para los embeddings de OpenAI, use un perfil de autenticación con clave de API de OpenAI, `OPENAI_API_KEY` o
`models.providers.openai.apiKey`. Quienes solo utilicen OAuth deben elegir otro
proveedor que admita embeddings, como `github-copilot` o `ollama`.

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
omite `encoding_format` en las solicitudes y acepta tanto respuestas de matrices de números de coma flotante
como respuestas float32 codificadas en base64, por lo que ambos formatos de respuesta funcionan sin configuración.

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

Use la ruta del adaptador del proveedor Ollama incluido (`embedding.provider: "ollama"`).
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
obligatorio. Para modelos de embeddings locales pequeños, reduzca `recallMaxChars` si el
servidor local devuelve errores de longitud de contexto.

## Límites de recuperación y captura

| Ajuste           | Valor predeterminado | Intervalo                        | Se aplica a                                                 |
| ----------------- | ------- | ---------------------------- | ---------------------------------------------------------- |
| `recallMaxChars`  | `1000`  | 100-10000                    | Texto enviado a la API de embeddings para la recuperación.                 |
| `captureMaxChars` | `500`   | 100-10000                    | Longitud del mensaje apta para la captura automática.                  |
| `customTriggers`  | `[]`    | 0-50 elementos, cada uno de <=100 caracteres | Frases literales que hacen que la captura automática considere un mensaje. |

`recallMaxChars` limita la consulta de recuperación automática `before_prompt_build`, la
herramienta `memory_recall`, la ruta de consulta `memory_forget` y `openclaw ltm
search`. La recuperación automática genera el embedding del último mensaje del usuario del turno y recurre
al prompt completo solo cuando no hay ningún mensaje del usuario, lo que mantiene los metadatos
del canal y los bloques grandes del prompt fuera de la solicitud de embeddings.

`captureMaxChars` determina si un mensaje del usuario del evento `agent_end`
del turno es lo bastante corto como para considerarse para la captura automática; no afecta
a las consultas de recuperación.

`customTriggers` añade frases literales de captura automática sin expresiones regulares. Los activadores
integrados abarcan frases de memoria habituales en inglés, checo, chino, japonés y coreano
(`remember`, `prefer`, `记住`, `覚えて`, `기억해` y similares).

La captura automática también rechaza texto que parezca contener metadatos de sobre o transporte,
cargas de inyección de prompts o contexto `<relevant-memories>` ya inyectado,
y limita la captura a 3 recuerdos por turno del agente.

Cada recuerdo pertenece a un único agente. La recuperación, la detección de duplicados, la captura,
el listado, las consultas sin procesar y la eliminación aplican ese propietario antes de devolver o
modificar filas. Un agente con `memorySearch.enabled: false` (en `agents.list[]`
o mediante `agents.defaults`) tampoco obtiene ninguna de las herramientas `memory_recall`, `memory_store`
o `memory_forget`, ni participa en la recuperación o captura automática,
aunque las marcas `autoRecall`/`autoCapture` del plugin estén activadas.

## Comandos

`memory-lancedb` registra el espacio de nombres de la CLI `ltm` siempre que esté instalado
(no solo cuando ocupa la ranura de memoria activa):

```bash
openclaw ltm list [--agent <id>] [--limit <n>] [--order-by-created-at]
openclaw ltm search <query> [--agent <id>] [--limit <n>]
openclaw ltm stats [--agent <id>]
```

`ltm query` ejecuta una consulta no vectorial directamente en la tabla de LanceDB:

```bash
openclaw ltm query --agent research --cols id,text,createdAt --limit 20
openclaw ltm query --filter "category = 'preference'" --order-by createdAt:desc
```

| Marca                              | Valor predeterminado                                 | Notas                                                                                                                                     |
| --------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `--agent <id>`                    | agente predeterminado configurado                | Selecciona el espacio de nombres privado del agente. Disponible en `list`, `search`, `query` y `stats`.                                                 |
| `--cols <columns>`                | `id,text,importance,category,createdAt` | Lista de columnas permitidas separadas por comas.                                                                                                         |
| `--filter <condition>`            | ninguno                                    | Una comparación sobre una columna de salida, como `category = 'preference'` o `importance >= 0.8`. Los valores de cadena deben estar entre comillas.             |
| `--limit <n>`                     | `10`                                    | Entero positivo.                                                                                                                         |
| `--order-by <column>:<asc\|desc>` | ninguno                                    | Se ordena en memoria después de ejecutar el filtro; la columna de ordenación se añade automáticamente a la proyección y se elimina de la salida si no se solicitó. |

Los agentes obtienen tres herramientas del plugin de memoria activo:

- `memory_recall`: búsqueda vectorial en los recuerdos almacenados.
- `memory_store`: guarda un hecho, una preferencia, una decisión o una entidad (rechaza texto
  que parezca una carga de inyección de prompts; omite almacenamientos casi duplicados).
- `memory_forget`: elimina por `memoryId` o por `query` (elimina automáticamente una única
  coincidencia con una puntuación superior al 90%; de lo contrario, enumera los identificadores candidatos para resolver la ambigüedad).

## Almacenamiento

Los datos de LanceDB se guardan de forma predeterminada en `~/.openclaw/memory/lancedb`. Sustituya este valor con `dbPath`:

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

El plugin mantiene una tabla de LanceDB y almacena un propietario de agente normalizado en cada
fila. Este es un límite de almacenamiento, no un filtro posterior a la búsqueda: la propiedad del agente se
aplica antes de la clasificación vectorial y se incluye en los predicados de listado, consulta, recuento y eliminación.
`ltm query --filter` acepta una comparación validada sobre las
columnas públicas de salida. El almacén crea esa comparación por separado del
predicado obligatorio del propietario, por lo que un filtro no puede ampliar la consulta a otro
agente.

Las bases de datos creadas antes de la propiedad por agente no tienen una procedencia fiable de las filas.
Al actualizar, `openclaw doctor --fix` asigna una sola vez esas filas heredadas al
agente predeterminado configurado. El acceso durante la ejecución falla de forma cerrada hasta que esa migración
se haya completado; los demás agentes nunca heredan las antiguas filas compartidas.

`storageOptions` acepta pares clave/valor de cadenas para backends de almacenamiento de LanceDB
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

## Dependencias de tiempo de ejecución y compatibilidad con plataformas

`memory-lancedb` depende del paquete nativo `@lancedb/lancedb`, que pertenece al
paquete del plugin (no a la distribución principal de OpenClaw). El inicio del Gateway no repara
las dependencias del plugin; si falta la dependencia nativa o no se puede cargar,
reinstale o actualice el paquete del plugin y reinicie el Gateway.

`@lancedb/lancedb` no publica una compilación nativa para `darwin-x64` (Mac
Intel). En esa plataforma, el plugin registra durante la carga que LanceDB no está disponible;
use el backend de memoria predeterminado, ejecute el Gateway en una
plataforma/arquitectura compatible o deshabilite `memory-lancedb`.

## Solución de problemas

### La longitud de la entrada supera la longitud del contexto

El modelo de embeddings rechazó la consulta de recuperación:

```text
memory-lancedb: fallo de recuperación: Error: 400 la longitud de la entrada supera la longitud del contexto
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

Para Ollama, compruebe también que el servidor de embeddings sea accesible desde el
host del Gateway mediante su endpoint nativo de embeddings:

```bash
curl http://127.0.0.1:11434/api/embed \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### Modelo de embeddings no compatible

Sin `embedding.dimensions`, solo se conocen las dimensiones de embeddings
integradas de OpenAI (`text-embedding-3-small`, `text-embedding-3-large`). Para cualquier otro
modelo, establezca `embedding.dimensions` en el tamaño del vector que indique dicho modelo.

### El plugin se carga, pero no aparece ningún recuerdo

Confirme que `plugins.slots.memory` apunte a `memory-lancedb` y, a continuación, ejecute:

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

Si `autoCapture` está deshabilitado, el plugin sigue recuperando los recuerdos existentes, pero
no almacena los nuevos automáticamente. Use la herramienta `memory_store` o habilite
`autoCapture`.

## Contenido relacionado

- [Descripción general de la memoria](/es/concepts/memory)
- [Active Memory](/es/concepts/active-memory)
- [Búsqueda en la memoria](/es/concepts/memory-search)
- [Wiki de memoria](/es/plugins/memory-wiki)
- [Ollama](/es/providers/ollama)
