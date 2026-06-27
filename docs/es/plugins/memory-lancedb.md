---
read_when:
    - Estás configurando el plugin memory-lancedb
    - Quieres memoria a largo plazo respaldada por LanceDB con recuperación automática o captura automática
    - Estás usando embeddings locales compatibles con OpenAI, como Ollama
sidebarTitle: Memory LanceDB
summary: Configura el plugin oficial externo de memoria LanceDB, incluidas las incrustaciones locales compatibles con Ollama
title: Memoria LanceDB
x-i18n:
    generated_at: "2026-06-27T12:14:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4142a755e788418a8b9c64a6ff3a8ce3c520bd6be09b685929478ae0754f7d39
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb` es un plugin oficial externo de memoria que almacena memoria a largo plazo en
LanceDB y usa embeddings para la recuperación. Puede recuperar automáticamente
memorias relevantes antes de un turno del modelo y capturar hechos importantes después de una respuesta.

Úsalo cuando quieras una base de datos vectorial local para memoria, necesites un
endpoint de embeddings compatible con OpenAI o quieras mantener una base de datos de memoria fuera
del almacén de memoria integrado predeterminado.

## Instalación

Instala `memory-lancedb` antes de configurar `plugins.slots.memory = "memory-lancedb"`:

```bash
openclaw plugins install @openclaw/memory-lancedb
```

El plugin se publica en npm y no está incluido en la imagen de runtime de OpenClaw.
El instalador escribe la entrada del plugin y cambia el slot de memoria cuando ningún otro
plugin lo posee.

<Note>
`memory-lancedb` es un plugin de memoria activa. Habilítalo seleccionando el slot de memoria
con `plugins.slots.memory = "memory-lancedb"`. Los plugins complementarios como
`memory-wiki` pueden ejecutarse junto a él, pero solo un plugin posee el slot de memoria activa.
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

Reinicia el Gateway después de cambiar la configuración del plugin:

```bash
openclaw gateway restart
```

Luego verifica que el plugin esté cargado:

```bash
openclaw plugins list
```

## Embeddings respaldados por proveedor

`memory-lancedb` puede usar los mismos adaptadores de proveedor de embeddings de memoria que
`memory-core`. Configura `embedding.provider` y omite `embedding.apiKey` para usar el
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
Por ejemplo, GitHub Copilot puede usarse cuando el perfil/plan de Copilot admite
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

OAuth de OpenAI Codex / ChatGPT no es una credencial de embeddings de OpenAI Platform.
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

Configura `dimensions` para modelos de embeddings no estándar. OpenClaw conoce las
dimensiones de `text-embedding-3-small` y `text-embedding-3-large`; los modelos
personalizados necesitan el valor en la configuración para que LanceDB pueda crear la columna vectorial.

Para modelos de embeddings locales pequeños, reduce `recallMaxChars` si ves errores de
longitud de contexto del servidor local.

## Proveedores compatibles con OpenAI

Algunos proveedores de embeddings compatibles con OpenAI rechazan el parámetro `encoding_format`,
mientras que otros lo ignoran y siempre devuelven vectores `number[]`.
Por eso `memory-lancedb` omite `encoding_format` en las solicitudes de embeddings y
acepta respuestas de arreglos de flotantes o respuestas float32 codificadas en base64.

Si tienes un endpoint de embeddings sin procesar compatible con OpenAI que no tiene un
adaptador de proveedor incluido, omite `embedding.provider` (o déjalo como `openai`) y
configura `embedding.apiKey` junto con `embedding.baseUrl`. Esto conserva la ruta directa
del cliente compatible con OpenAI.

Configura `embedding.dimensions` para proveedores cuyas dimensiones de modelo no estén
integradas. Por ejemplo, ZhiPu `embedding-3` usa `2048` dimensiones:

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

| Configuración     | Predeterminado | Rango     | Se aplica a                                               |
| ----------------- | -------------- | --------- | --------------------------------------------------------- |
| `recallMaxChars`  | `1000`         | 100-10000 | texto enviado a la API de embeddings para recuperación    |
| `captureMaxChars` | `500`          | 100-10000 | longitud de mensaje elegible para captura automática      |
| `customTriggers`  | `[]`           | 0-50      | frases literales que hacen que la captura automática considere un mensaje |

`recallMaxChars` controla la recuperación automática, la herramienta `memory_recall`, la
ruta de consulta de `memory_forget` y `openclaw ltm search`. La recuperación automática prefiere el
último mensaje del usuario del turno y recurre al prompt completo solo cuando no hay
mensaje de usuario disponible. Esto mantiene los metadatos del canal y los bloques grandes de prompt
fuera de la solicitud de embeddings.

`captureMaxChars` controla si una respuesta es lo bastante corta para considerarse
para captura automática. No limita los embeddings de consultas de recuperación.

`customTriggers` te permite agregar frases literales de captura automática sin escribir
expresiones regulares. Los disparadores integrados incluyen frases comunes de memoria en inglés, checo,
chino, japonés y coreano.

## Comandos

Cuando `memory-lancedb` es el plugin de memoria activa, registra el espacio de nombres de CLI
`ltm`:

```bash
openclaw ltm list
openclaw ltm search "project preferences"
openclaw ltm stats
```

El subcomando `query` ejecuta una consulta no vectorial contra la tabla de LanceDB
directamente:

```bash
openclaw ltm query --cols id,text,createdAt --limit 20
openclaw ltm query --filter "category = 'preference'" --order-by createdAt:desc
```

- `--cols <columns>`: lista de columnas permitidas separadas por comas (el valor predeterminado es `id`, `text`, `importance`, `category`, `createdAt`).
- `--filter <condition>`: cláusula WHERE de estilo SQL; limitada a 200 caracteres y restringida a alfanuméricos, operadores de comparación, comillas, paréntesis y un pequeño conjunto de puntuación segura.
- `--limit <n>`: entero positivo; predeterminado `10`.
- `--order-by <column>:<asc|desc>`: ordenación en memoria aplicada después del filtro; la columna de ordenación se incluye automáticamente en la proyección.

Los agentes también reciben herramientas de memoria de LanceDB desde el plugin de memoria activa:

- `memory_recall` para recuperación respaldada por LanceDB
- `memory_store` para guardar hechos importantes, preferencias, decisiones y entidades
- `memory_forget` para eliminar memorias coincidentes

## Almacenamiento

De forma predeterminada, los datos de LanceDB viven bajo `~/.openclaw/memory/lancedb`. Sobrescribe la
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

## Dependencias de runtime

`memory-lancedb` depende del paquete nativo `@lancedb/lancedb`. OpenClaw empaquetado
trata ese paquete como parte del paquete del plugin. El inicio del Gateway
no repara dependencias de plugins; si falta la dependencia, reinstala o
actualiza el paquete del plugin y reinicia el Gateway.

Si una instalación anterior registra un error de `dist/package.json` faltante o de
`@lancedb/lancedb` faltante durante la carga del plugin, actualiza OpenClaw y reinicia el
Gateway.

Si el plugin registra que LanceDB no está disponible en `darwin-x64`, usa el backend de
memoria predeterminado en esa máquina, mueve el Gateway a una plataforma compatible o
deshabilita `memory-lancedb`.

## Solución de problemas

### La longitud de entrada supera la longitud de contexto

Esto suele significar que el modelo de embeddings rechazó la consulta de recuperación:

```text
memory-lancedb: recall failed: Error: 400 the input length exceeds the context length
```

Configura un `recallMaxChars` menor y luego reinicia el Gateway:

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

Sin `dimensions`, solo se conocen las dimensiones integradas de embeddings de OpenAI.
Para modelos de embeddings locales o personalizados, configura `embedding.dimensions` con el tamaño
vectorial informado por ese modelo.

### El plugin carga, pero no aparecen memorias

Comprueba que `plugins.slots.memory` apunte a `memory-lancedb` y luego ejecuta:

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

Si `autoCapture` está deshabilitado, el plugin recuperará memorias existentes, pero
no almacenará automáticamente otras nuevas. Usa la herramienta `memory_store` o habilita
`autoCapture` si quieres captura automática.

## Relacionado

- [Resumen de memoria](/es/concepts/memory)
- [Active Memory](/es/concepts/active-memory)
- [Búsqueda de memoria](/es/concepts/memory-search)
- [Wiki de memoria](/es/plugins/memory-wiki)
- [Ollama](/es/providers/ollama)
