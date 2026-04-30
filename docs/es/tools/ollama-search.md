---
read_when:
    - Quieres usar Ollama para web_search
    - Quieres un proveedor de web_search sin clave
    - Quieres usar la búsqueda web alojada de Ollama con OLLAMA_API_KEY
    - Necesitas orientación para configurar la búsqueda web de Ollama
summary: Búsqueda web de Ollama mediante un host local de Ollama o la API alojada de Ollama
title: Búsqueda web de Ollama
x-i18n:
    generated_at: "2026-04-30T06:05:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: e626ee38b80fc66aa33589f030f9b420cf27848faed2183912ade17cb222771b
    source_path: tools/ollama-search.md
    workflow: 16
---

OpenClaw admite **Búsqueda web de Ollama** como proveedor `web_search` incluido. Usa la API de búsqueda web de Ollama y devuelve resultados estructurados con títulos, URL y fragmentos.

Para Ollama local o autoalojado, esta configuración no necesita una clave de API de forma predeterminada. Sí requiere:

- un host de Ollama accesible desde OpenClaw
- `ollama signin`

Para la búsqueda alojada directa, establece la URL base del proveedor de Ollama en `https://ollama.com` y proporciona una `OLLAMA_API_KEY` real.

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
  <Step title="Elegir Búsqueda web de Ollama">
    Ejecuta:

    ```bash
    openclaw configure --section web
    ```

    Luego selecciona **Búsqueda web de Ollama** como proveedor.

  </Step>
</Steps>

Si ya usas Ollama para modelos, Búsqueda web de Ollama reutiliza el mismo host configurado.

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

Sobrescritura opcional del host de Ollama:

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

Si ya configuras Ollama como proveedor de modelos, el proveedor de búsqueda web puede reutilizar ese host:

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

El proveedor de modelos de Ollama usa `baseUrl` como clave canónica. El proveedor de búsqueda web también respeta `baseURL` en `models.providers.ollama` por compatibilidad con ejemplos de configuración al estilo del SDK de OpenAI.

Si no se establece una URL base explícita de Ollama, OpenClaw usa `http://127.0.0.1:11434`.

Si tu host de Ollama espera autenticación bearer, OpenClaw reutiliza `models.providers.ollama.apiKey` (o la autenticación de proveedor correspondiente respaldada por entorno) para las solicitudes a ese host configurado.

Búsqueda web de Ollama alojada directa:

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

- No se requiere ningún campo de clave de API específico para búsqueda web para este proveedor.
- Si el host de Ollama está protegido con autenticación, OpenClaw reutiliza la clave de API normal del proveedor de Ollama cuando está presente.
- Si `baseUrl` es `https://ollama.com`, OpenClaw llama directamente a `https://ollama.com/api/web_search` y envía la clave de API de Ollama configurada como autenticación bearer.
- Si el host configurado no expone la búsqueda web y `OLLAMA_API_KEY` está establecida, OpenClaw puede recurrir a `https://ollama.com/api/web_search` sin enviar esa clave de entorno al host local.
- OpenClaw advierte durante la configuración si Ollama no es accesible o si no se ha iniciado sesión, pero no bloquea la selección.
- La detección automática en tiempo de ejecución puede recurrir a Búsqueda web de Ollama cuando no hay configurado ningún proveedor con credenciales de mayor prioridad.
- Los hosts del daemon local de Ollama usan el endpoint de proxy local `/api/experimental/web_search`, que firma y reenvía a Ollama Cloud.
- Los hosts `https://ollama.com` usan directamente el endpoint público alojado `/api/web_search` con autenticación bearer mediante clave de API.

## Relacionado

- [Resumen de búsqueda web](/es/tools/web) -- todos los proveedores y la detección automática
- [Ollama](/es/providers/ollama) -- configuración de modelos de Ollama y modos en la nube/local
