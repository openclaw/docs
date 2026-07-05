---
read_when:
    - Quieres usar Ollama para web_search
    - Quieres un proveedor web_search sin clave
    - Quieres usar Ollama Web Search alojado con OLLAMA_API_KEY
    - Necesitas orientación para configurar Ollama Web Search
summary: Búsqueda web de Ollama mediante un host local de Ollama o la API alojada de Ollama
title: Búsqueda web de Ollama
x-i18n:
    generated_at: "2026-07-05T11:48:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: edbbd887841339ab4c0c62ab7682a22fe99434a788957a91989fce6942187e9a
    source_path: tools/ollama-search.md
    workflow: 16
---

OpenClaw admite **Búsqueda web de Ollama** como proveedor `web_search` incluido,
que devuelve títulos, URL y fragmentos de la API de búsqueda web de Ollama.

Ollama local/autohospedado no necesita clave de API de forma predeterminada; requiere un
host de Ollama accesible además de `ollama signin`. La búsqueda alojada directa (sin Ollama local) necesita
`baseUrl: "https://ollama.com"` y una `OLLAMA_API_KEY` real.

## Configuración

<Steps>
  <Step title="Inicia Ollama">
    Asegúrate de que Ollama esté instalado y en ejecución.
  </Step>
  <Step title="Inicia sesión">
    ```bash
    ollama signin
    ```
  </Step>
  <Step title="Elige Búsqueda web de Ollama">
    ```bash
    openclaw configure --section web
    ```

    Selecciona **Búsqueda web de Ollama** como proveedor.

  </Step>
</Steps>

Si ya usas Ollama para modelos, Búsqueda web de Ollama reutiliza el mismo
host configurado.

<Note>
  OpenClaw nunca selecciona automáticamente Búsqueda web de Ollama sobre un proveedor
  con credenciales de mayor prioridad; debes elegirlo explícitamente con
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

Anulación opcional del host, limitada solo a la búsqueda web:

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

O reutiliza el host ya configurado para el proveedor de modelos Ollama:

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

`models.providers.ollama.baseUrl` es la clave canónica; el proveedor de búsqueda web
también acepta `baseURL` allí por compatibilidad con ejemplos de configuración de estilo
OpenAI SDK. Si no se configura nada, OpenClaw usa de forma predeterminada
`http://127.0.0.1:11434`.

Búsqueda web de Ollama alojada directa (sin Ollama local):

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
  `models.providers.ollama.apiKey` (o la autenticación del proveedor correspondiente respaldada por el entorno)
  cuando el host configurado está protegido con autenticación.
- Orden de resolución del host: `plugins.entries.ollama.config.webSearch.baseUrl` →
  `models.providers.ollama.baseUrl` (o `baseURL`) → `http://127.0.0.1:11434`.
- Si el host resuelto es `https://ollama.com`, OpenClaw llama a
  `https://ollama.com/api/web_search` directamente con la clave de API como autenticación
  bearer.
- De lo contrario, OpenClaw llama primero al endpoint de proxy local
  `/api/experimental/web_search` (que firma y reenvía a Ollama
  Cloud), y luego recurre a `/api/web_search` en el mismo host. Si ambos fallan
  y `OLLAMA_API_KEY` está configurada, reintenta una vez contra
  `https://ollama.com/api/web_search` con esa clave, sin enviarla al
  host local.
- OpenClaw advierte durante la configuración si Ollama no está accesible o no tiene una sesión iniciada, pero
  no bloquea la selección del proveedor.

## Relacionado

- [Información general de Búsqueda web](/es/tools/web) -- todos los proveedores y la detección automática
- [Ollama](/es/providers/ollama) -- configuración de modelos Ollama y modos en la nube/locales
