---
read_when:
    - Estás configurando el Plugin memory-lancedb incluido
    - Quieres memoria a largo plazo respaldada por LanceDB con recuperación automática o captura automática
    - Está usando embeddings locales compatibles con OpenAI, como Ollama
sidebarTitle: Memory LanceDB
summary: Configura el Plugin de memoria LanceDB incluido, incluidas las incrustaciones locales compatibles con Ollama
title: Memoria LanceDB
x-i18n:
    generated_at: "2026-04-30T05:52:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: bda53528857a492f1627f655e49be6775e0114115781371ff67debb155b7e731
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
con `plugins.slots.memory = "memory-lancedb"`. Los plugins complementarios, como
`memory-wiki`, pueden ejecutarse junto a él, pero solo un Plugin posee el slot de memoria activa.
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

## Embeddings respaldados por proveedores

`memory-lancedb` puede usar los mismos adaptadores de proveedores de embeddings de memoria que
`memory-core`. Establece `embedding.provider` y omite `embedding.apiKey` para usar el
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
Por ejemplo, GitHub Copilot se puede usar cuando el perfil o plan de Copilot admite
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
`OPENAI_API_KEY` o `models.providers.openai.apiKey`. Los usuarios que solo tienen OAuth pueden usar
otro proveedor compatible con embeddings, como GitHub Copilot u Ollama.

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

Establece `dimensions` para modelos de embeddings no estándar. OpenClaw conoce las
dimensiones de `text-embedding-3-small` y `text-embedding-3-large`; los modelos
personalizados necesitan el valor en la configuración para que LanceDB pueda crear la columna vectorial.

Para modelos de embeddings locales pequeños, reduce `recallMaxChars` si ves errores de
longitud de contexto del servidor local.

## Proveedores compatibles con OpenAI

Algunos proveedores de embeddings compatibles con OpenAI rechazan el parámetro `encoding_format`,
mientras que otros lo ignoran y siempre devuelven vectores `number[]`.
Por eso, `memory-lancedb` omite `encoding_format` en las solicitudes de embeddings y
acepta respuestas como arreglos de flotantes o respuestas float32 codificadas en base64.

Si tienes un endpoint bruto de embeddings compatible con OpenAI que no tiene un
adaptador de proveedor incluido, omite `embedding.provider` (o déjalo como `openai`) y
establece `embedding.apiKey` más `embedding.baseUrl`. Esto conserva la ruta directa
del cliente compatible con OpenAI.

Establece `embedding.dimensions` para proveedores cuyas dimensiones de modelo no estén integradas.
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

| Configuración     | Predeterminado | Rango     | Se aplica a                                   |
| ----------------- | -------------- | --------- | --------------------------------------------- |
| `recallMaxChars`  | `1000`         | 100-10000 | texto enviado a la API de embeddings para recuperación |
| `captureMaxChars` | `500`          | 100-10000 | longitud del mensaje del asistente elegible para captura |

`recallMaxChars` controla la recuperación automática, la herramienta `memory_recall`, la
ruta de consulta de `memory_forget` y `openclaw ltm search`. La recuperación automática prefiere el
último mensaje del usuario del turno y recurre al prompt completo solo cuando no hay
mensaje de usuario disponible. Esto mantiene los metadatos del canal y los bloques grandes de prompt
fuera de la solicitud de embeddings.

`captureMaxChars` controla si una respuesta es lo bastante corta para considerarse
para captura automática. No limita los embeddings de consulta de recuperación.

## Comandos

Cuando `memory-lancedb` es el Plugin de memoria activa, registra el espacio de nombres `ltm` de la CLI:

```bash
openclaw ltm list
openclaw ltm search "project preferences"
openclaw ltm stats
```

El Plugin también amplía `openclaw memory` con un subcomando `query` no vectorial
que se ejecuta directamente contra la tabla de LanceDB:

```bash
openclaw memory query --cols id,text,createdAt --limit 20
openclaw memory query --filter "category = 'preference'" --order-by createdAt:desc
```

- `--cols <columns>`: lista permitida de columnas separadas por comas (valores predeterminados: `id`, `text`, `importance`, `category`, `createdAt`).
- `--filter <condition>`: cláusula WHERE de estilo SQL; limitada a 200 caracteres y restringida a caracteres alfanuméricos, operadores de comparación, comillas, paréntesis y un conjunto pequeño de puntuación segura.
- `--limit <n>`: entero positivo; predeterminado `10`.
- `--order-by <column>:<asc|desc>`: ordenación en memoria aplicada después del filtro; la columna de ordenación se incluye automáticamente en la proyección.

Los agentes también obtienen herramientas de memoria de LanceDB del Plugin de memoria activa:

- `memory_recall` para recuperación respaldada por LanceDB
- `memory_store` para guardar datos importantes, preferencias, decisiones y entidades
- `memory_forget` para eliminar memorias coincidentes

## Almacenamiento

De forma predeterminada, los datos de LanceDB residen en `~/.openclaw/memory/lancedb`. Sobrescribe la
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
admite la expansión `${ENV_VAR}`:

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

`memory-lancedb` depende del paquete nativo `@lancedb/lancedb`. Las instalaciones empaquetadas de
OpenClaw intentan primero usar la dependencia de tiempo de ejecución incluida y pueden reparar la
dependencia de tiempo de ejecución del Plugin bajo el estado de OpenClaw cuando la importación incluida no
está disponible.

Si una instalación más antigua registra un error de `dist/package.json` faltante o de
`@lancedb/lancedb` faltante durante la carga del Plugin, actualiza OpenClaw y reinicia el
Gateway.

Si el Plugin registra que LanceDB no está disponible en `darwin-x64`, usa el backend de memoria predeterminado
en esa máquina, mueve el Gateway a una plataforma compatible o
deshabilita `memory-lancedb`.

## Solución de problemas

### La longitud de entrada supera la longitud de contexto

Esto normalmente significa que el modelo de embeddings rechazó la consulta de recuperación:

```text
memory-lancedb: recall failed: Error: 400 the input length exceeds the context length
```

Establece un valor menor de `recallMaxChars` y luego reinicia el Gateway:

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

Sin `dimensions`, solo se conocen las dimensiones de embeddings de OpenAI integradas.
Para modelos de embeddings locales o personalizados, establece `embedding.dimensions` al tamaño vectorial
informado por ese modelo.

### El Plugin se carga, pero no aparecen memorias

Comprueba que `plugins.slots.memory` apunte a `memory-lancedb` y luego ejecuta:

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

Si `autoCapture` está deshabilitado, el Plugin recuperará memorias existentes, pero
no almacenará automáticamente nuevas. Usa la herramienta `memory_store` o habilita
`autoCapture` si quieres captura automática.

## Relacionado

- [Descripción general de memoria](/es/concepts/memory)
- [Active Memory](/es/concepts/active-memory)
- [Búsqueda de memoria](/es/concepts/memory-search)
- [Wiki de memoria](/es/plugins/memory-wiki)
- [Ollama](/es/providers/ollama)
