---
read_when:
    - Quieres usar Ollama para `web_search`
    - Quieres un proveedor de `web_search` sin clave
    - Quieres usar Ollama Web Search alojado con OLLAMA_API_KEY
    - Necesitas orientación para configurar Ollama Web Search
summary: Búsqueda web de Ollama mediante un host local de Ollama o la API alojada de Ollama
title: Búsqueda web de Ollama
x-i18n:
    generated_at: "2026-07-11T23:35:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: edbbd887841339ab4c0c62ab7682a22fe99434a788957a91989fce6942187e9a
    source_path: tools/ollama-search.md
    workflow: 16
---

OpenClaw admite **Ollama Web Search** como proveedor de `web_search` incluido,
que devuelve títulos, URL y fragmentos de la API de búsqueda web de Ollama.

De forma predeterminada, Ollama local o autoalojado no necesita una clave de API; requiere un
host de Ollama accesible y ejecutar `ollama signin`. La búsqueda alojada directa (sin Ollama local) necesita
`baseUrl: "https://ollama.com"` y una `OLLAMA_API_KEY` real.

## Configuración

<Steps>
  <Step title="Iniciar Ollama">
    Asegúrate de que Ollama esté instalado y en ejecución.
  </Step>
  <Step title="Iniciar sesión">
    ```bash
    ollama signin
    ```
  </Step>
  <Step title="Elegir Ollama Web Search">
    ```bash
    openclaw configure --section web
    ```

    Selecciona **Ollama Web Search** como proveedor.

  </Step>
</Steps>

Si ya usas Ollama para modelos, Ollama Web Search reutiliza el mismo
host configurado.

<Note>
  OpenClaw nunca selecciona automáticamente Ollama Web Search en lugar de un proveedor
  con credenciales de mayor prioridad; debes elegirlo explícitamente mediante
  `tools.web.search.provider: "ollama"`.
</Note>

## Configuración

```json5
{
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

Modificación opcional del host, limitada únicamente a la búsqueda web:

```json5
{
  plugins: {
    entries: {
      ollama: {
        config: {
          webSearch: {
            baseUrl: "http://ollama-host:11434",
          },
        },
      },
    },
  },
}
```

También puedes reutilizar el host ya configurado para el proveedor de modelos de Ollama:

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434",
      },
    },
  },
}
```

`models.providers.ollama.baseUrl` es la clave canónica; el proveedor de búsqueda
web también acepta `baseURL` allí por compatibilidad con ejemplos de configuración
del estilo del SDK de OpenAI. Si no se configura nada, OpenClaw usa de forma predeterminada
`http://127.0.0.1:11434`.

Ollama Web Search alojado directo (sin Ollama local):

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "https://ollama.com",
        apiKey: "OLLAMA_API_KEY",
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

## Autenticación y enrutamiento de solicitudes

- No existe ningún campo de clave de API específico para la búsqueda web; el proveedor reutiliza
  `models.providers.ollama.apiKey` (o la autenticación correspondiente del proveedor respaldada por una variable de entorno)
  cuando el host configurado está protegido mediante autenticación.
- Orden de resolución del host: `plugins.entries.ollama.config.webSearch.baseUrl` →
  `models.providers.ollama.baseUrl` (o `baseURL`) → `http://127.0.0.1:11434`.
- Si el host resuelto es `https://ollama.com`, OpenClaw llama
  directamente a `https://ollama.com/api/web_search` con la clave de API como
  autenticación de portador.
- De lo contrario, OpenClaw llama primero al punto de conexión del proxy local
  `/api/experimental/web_search` (que firma y reenvía la solicitud a Ollama
  Cloud) y, si falla, recurre a `/api/web_search` en el mismo host. Si ambos fallan
  y `OLLAMA_API_KEY` está configurada, vuelve a intentarlo una vez contra
  `https://ollama.com/api/web_search` con esa clave, sin enviarla
  al host local.
- OpenClaw muestra una advertencia durante la configuración si Ollama no es accesible o no se ha
  iniciado sesión, pero no impide seleccionar el proveedor.

## Contenido relacionado

- [Descripción general de la búsqueda web](/es/tools/web) -- todos los proveedores y la detección automática
- [Ollama](/es/providers/ollama) -- configuración de modelos de Ollama y modos locales/en la nube
