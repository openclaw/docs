---
read_when:
    - Estás configurando el Plugin memory-lancedb incluido
    - Quieres memoria a largo plazo respaldada por LanceDB con recuperación automática o captura automática
    - Estás usando embeddings locales compatibles con OpenAI, como Ollama
sidebarTitle: Memory LanceDB
summary: Configura el plugin de memoria LanceDB incluido, incluidos los embeddings locales compatibles con Ollama
title: Memoria LanceDB
x-i18n:
    generated_at: "2026-05-02T05:32:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 671daa20e4f070f9beb0187ff76db9368297b3bc78873ebf3f09ac7ccffa00a2
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb` es un Plugin de memoria incluido que almacena la memoria a largo plazo en
LanceDB y usa embeddings para la recuperación. Puede recuperar automáticamente
memorias relevantes antes de un turno del modelo y capturar datos importantes después de una respuesta.

Úsalo cuando quieras una base de datos vectorial local para memoria, necesites un
endpoint de embeddings compatible con OpenAI o quieras mantener una base de datos de memoria fuera
del almacén de memoria integrado predeterminado.

<Note>
`memory-lancedb` es un Plugin de Active Memory. Habilítalo seleccionando el slot de memoria
con `plugins.slots.memory = "memory-lancedb"`. Plugins complementarios como
`memory-wiki` pueden ejecutarse junto a él, pero solo un Plugin posee el slot de Active Memory.
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

Reinicia el Gateway después de cambiar la configuración del Plugin:

```bash
openclaw gateway restart
```

Luego verifica que el Plugin esté cargado:

```bash
openclaw plugins list
```

## Embeddings respaldados por proveedor

`memory-lancedb` puede usar los mismos adaptadores de proveedor de embeddings de memoria que
`memory-core`. Define `embedding.provider` y omite `embedding.apiKey` para usar el
perfil de autenticación configurado del proveedor, la variable de entorno o
`models.providers.<provider>.apiKey`.

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
        },
      },
    },
  },
}
```

Esta ruta funciona con perfiles de autenticación de proveedor que exponen credenciales de embeddings.
Por ejemplo, GitHub Copilot se puede usar cuando el perfil/plan de Copilot admite
embeddings:

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
            provider: "github-copilot",
            model: "text-embedding-3-small",
          },
        },
      },
    },
  },
}
```

OpenAI Codex / ChatGPT OAuth (`openai-codex`) no es una credencial de embeddings de OpenAI Platform.
Para embeddings de OpenAI, usa un perfil de autenticación con clave de API de OpenAI,
`OPENAI_API_KEY` o `models.providers.openai.apiKey`. Los usuarios que solo usan OAuth pueden usar
otro proveedor con capacidad de embeddings, como GitHub Copilot u Ollama.

## Embeddings de Ollama

Para embeddings de Ollama, prefiere el proveedor de embeddings de Ollama incluido. Usa el
endpoint nativo `/api/embed` de Ollama y sigue las mismas reglas de autenticación/URL base que
el proveedor de Ollama documentado en [Ollama](/es/providers/ollama).

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

Define `dimensions` para modelos de embeddings no estándar. OpenClaw conoce las
dimensiones de `text-embedding-3-small` y `text-embedding-3-large`; los modelos
personalizados necesitan el valor en la configuración para que LanceDB pueda crear la columna vectorial.

Para modelos locales pequeños de embeddings, reduce `recallMaxChars` si ves errores de
longitud de contexto del servidor local.

## Proveedores compatibles con OpenAI

Algunos proveedores de embeddings compatibles con OpenAI rechazan el parámetro `encoding_format`,
mientras que otros lo ignoran y siempre devuelven vectores `number[]`.
Por eso, `memory-lancedb` omite `encoding_format` en las solicitudes de embeddings y
acepta respuestas de arreglos de flotantes o respuestas float32 codificadas en base64.

Si tienes un endpoint de embeddings sin procesar compatible con OpenAI que no tiene un
adaptador de proveedor incluido, omite `embedding.provider` (o déjalo como `openai`) y
define `embedding.apiKey` junto con `embedding.baseUrl`. Esto conserva la ruta directa
del cliente compatible con OpenAI.

Define `embedding.dimensions` para proveedores cuyas dimensiones de modelo no estén integradas.
Por ejemplo, ZhiPu `embedding-3` usa `2048` dimensiones:

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

## Límites de recuperación y captura

`memory-lancedb` tiene dos límites de texto separados:

| Ajuste            | Predeterminado | Rango     | Se aplica a                                  |
| ----------------- | -------------- | --------- | --------------------------------------------- |
| `recallMaxChars`  | `1000`         | 100-10000 | texto enviado a la API de embeddings para recuperación |
| `captureMaxChars` | `500`          | 100-10000 | longitud de mensaje del asistente apta para captura |

`recallMaxChars` controla la recuperación automática, la herramienta `memory_recall`, la
ruta de consulta de `memory_forget` y `openclaw ltm search`. La recuperación automática prefiere el
último mensaje de usuario del turno y recurre al prompt completo solo cuando no hay
mensaje de usuario disponible. Esto mantiene los metadatos del canal y los bloques grandes de prompt
fuera de la solicitud de embeddings.

`captureMaxChars` controla si una respuesta es lo suficientemente corta para ser considerada
para captura automática. No limita los embeddings de consultas de recuperación.

## Comandos

Cuando `memory-lancedb` es el Plugin de Active Memory, registra el espacio de nombres `ltm` de la CLI:

```bash
openclaw ltm list
openclaw ltm search "project preferences"
openclaw ltm stats
```

El Plugin también extiende `openclaw memory` con un subcomando `query` no vectorial
que se ejecuta directamente contra la tabla de LanceDB:

```bash
openclaw memory query --cols id,text,createdAt --limit 20
openclaw memory query --filter "category = 'preference'" --order-by createdAt:desc
```

- `--cols <columns>`: lista permitida de columnas separadas por comas (por defecto `id`, `text`, `importance`, `category`, `createdAt`).
- `--filter <condition>`: cláusula WHERE de estilo SQL; limitada a 200 caracteres y restringida a alfanuméricos, operadores de comparación, comillas, paréntesis y un conjunto pequeño de puntuación segura.
- `--limit <n>`: entero positivo; valor predeterminado `10`.
- `--order-by <column>:<asc|desc>`: ordenación en memoria aplicada después del filtro; la columna de ordenación se incluye automáticamente en la proyección.

Los agentes también reciben herramientas de memoria de LanceDB del Plugin de Active Memory:

- `memory_recall` para recuperación respaldada por LanceDB
- `memory_store` para guardar datos importantes, preferencias, decisiones y entidades
- `memory_forget` para eliminar memorias coincidentes

## Almacenamiento

De forma predeterminada, los datos de LanceDB viven en `~/.openclaw/memory/lancedb`. Sobrescribe la
ruta con `dbPath`:

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

`storageOptions` acepta pares clave/valor de cadena para backends de almacenamiento de LanceDB y
admite expansión de `${ENV_VAR}`:

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

## Dependencias en tiempo de ejecución

`memory-lancedb` depende del paquete nativo `@lancedb/lancedb`. OpenClaw empaquetado
trata ese paquete como parte del paquete del Plugin. El inicio del Gateway
no repara dependencias de Plugins; si falta la dependencia, reinstala o
actualiza el paquete del Plugin y reinicia el Gateway.

Si una instalación antigua registra un error por falta de `dist/package.json` o de
`@lancedb/lancedb` durante la carga del Plugin, actualiza OpenClaw y reinicia el
Gateway.

Si el Plugin registra que LanceDB no está disponible en `darwin-x64`, usa el backend
de memoria predeterminado en esa máquina, mueve el Gateway a una plataforma compatible o
deshabilita `memory-lancedb`.

## Solución de problemas

### La longitud de entrada supera la longitud del contexto

Esto normalmente significa que el modelo de embeddings rechazó la consulta de recuperación:

```text
memory-lancedb: recall failed: Error: 400 the input length exceeds the context length
```

Define un `recallMaxChars` más bajo y luego reinicia el Gateway:

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

Para Ollama, verifica también que el servidor de embeddings sea accesible desde el host del Gateway:

```bash
curl http://127.0.0.1:11434/v1/embeddings \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### Modelo de embeddings no compatible

Sin `dimensions`, solo se conocen las dimensiones de embeddings integradas de OpenAI.
Para modelos de embeddings locales o personalizados, define `embedding.dimensions` con el tamaño
vectorial informado por ese modelo.

### El Plugin se carga pero no aparecen memorias

Comprueba que `plugins.slots.memory` apunte a `memory-lancedb` y luego ejecuta:

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

Si `autoCapture` está deshabilitado, el Plugin recuperará memorias existentes, pero
no almacenará automáticamente otras nuevas. Usa la herramienta `memory_store` o habilita
`autoCapture` si quieres captura automática.

## Relacionado

- [Resumen de memoria](/es/concepts/memory)
- [Active Memory](/es/concepts/active-memory)
- [Búsqueda de memoria](/es/concepts/memory-search)
- [Memory Wiki](/es/plugins/memory-wiki)
- [Ollama](/es/providers/ollama)
