---
read_when:
    - Quieres usar Ollama para web_search
    - Quieres un proveedor de web_search sin clave
    - Quieres usar Ollama Web Search alojado con OLLAMA_API_KEY
    - Necesitas orientación para configurar Ollama Web Search
summary: Búsqueda web de Ollama mediante un host local de Ollama o la API alojada de Ollama
title: Búsqueda web de Ollama
x-i18n:
    generated_at: "2026-06-27T13:07:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4a30a6a2ed78d0d5f680ca2894e5e015cf99fbae2bcad4601727bbc9f560c124
    source_path: tools/ollama-search.md
    workflow: 16
---

OpenClaw admite **Ollama Web Search** como proveedor `web_search` incluido. Usa la API de búsqueda web de Ollama y devuelve resultados estructurados con títulos, URL y fragmentos.

Para Ollama local o autoalojado, esta configuración no necesita una clave de API de forma predeterminada. Sí requiere:

- un host de Ollama accesible desde OpenClaw
- `ollama signin`

Para búsqueda alojada directa, establece la URL base del proveedor Ollama en `https://ollama.com` y proporciona una `OLLAMA_API_KEY` real.

## Configuración

<Steps>
  <Step title="Iniciar Ollama">
    Asegúrate de que Ollama esté instalado y en ejecución.
  </Step>
  <Step title="Iniciar sesión">
    Ejecuta:

    ```bash
    ollama signin
    ```

  </Step>
  <Step title="Elegir Ollama Web Search">
    Ejecuta:

    ```bash
    openclaw configure --section web
    ```

    Luego selecciona **Ollama Web Search** como proveedor.

  </Step>
</Steps>

Si ya usas Ollama para modelos, Ollama Web Search reutiliza el mismo host configurado.

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

Anulación opcional del host de Ollama:

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

Si ya configuras Ollama como proveedor de modelos, el proveedor de búsqueda web puede reutilizar ese host en su lugar:

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

El proveedor de modelos Ollama usa `baseUrl` como clave canónica. El proveedor de búsqueda web también respeta `baseURL` en `models.providers.ollama` para compatibilidad con ejemplos de configuración de estilo SDK de OpenAI.

Si no se establece ninguna URL base explícita de Ollama, OpenClaw usa `http://127.0.0.1:11434`.

Si tu host de Ollama espera autenticación bearer, OpenClaw reutiliza `models.providers.ollama.apiKey` (o la autenticación de proveedor respaldada por la variable de entorno correspondiente) para las solicitudes a ese host configurado.

Ollama Web Search alojado directo:

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

## Notas

- No se requiere ningún campo de clave de API específico de búsqueda web para este proveedor.
- Si el host de Ollama está protegido con autenticación, OpenClaw reutiliza la clave de API normal del proveedor Ollama cuando está presente.
- Si `baseUrl` es `https://ollama.com`, OpenClaw llama directamente a `https://ollama.com/api/web_search` y envía la clave de API de Ollama configurada como autenticación bearer.
- Si el host configurado no expone búsqueda web y `OLLAMA_API_KEY` está definido, OpenClaw puede recurrir a `https://ollama.com/api/web_search` sin enviar esa clave de entorno al host local.
- OpenClaw advierte durante la configuración si Ollama no es accesible o no tiene sesión iniciada, pero no bloquea la selección.
- OpenClaw no selecciona automáticamente Ollama Web Search cuando no hay configurado ningún proveedor con credenciales de mayor prioridad; elígelo explícitamente con `tools.web.search.provider: "ollama"`.
- Los hosts locales del daemon Ollama usan el endpoint de proxy local `/api/experimental/web_search`, que firma y reenvía a Ollama Cloud.
- Los hosts `https://ollama.com` usan directamente el endpoint público alojado `/api/web_search` con autenticación de clave de API bearer.

## Relacionado

- [Descripción general de Web Search](/es/tools/web) -- todos los proveedores y detección automática
- [Ollama](/es/providers/ollama) -- configuración de modelos Ollama y modos en la nube/local
