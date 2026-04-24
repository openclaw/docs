---
read_when:
    - Quieres usar Ollama para `web_search`
    - Quieres un proveedor de `web_search` sin clave
    - Necesitas una guía de configuración de Ollama Web Search
summary: Ollama Web Search mediante tu host de Ollama configurado
title: Búsqueda web de Ollama
x-i18n:
    generated_at: "2026-04-24T05:55:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68d486c43d80319427302fa77fb77e34b7ffd50e8f096f9cb50ccb8dd77bc0da
    source_path: tools/ollama-search.md
    workflow: 15
---

OpenClaw admite **Ollama Web Search** como proveedor incluido de `web_search`.
Usa la API experimental de búsqueda web de Ollama y devuelve resultados estructurados
con títulos, URL y fragmentos.

A diferencia del proveedor de modelos de Ollama, esta configuración no necesita una clave API
por defecto. Sí requiere:

- un host de Ollama accesible desde OpenClaw
- `ollama signin`

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

Si ya usas Ollama para modelos, Ollama Web Search reutiliza el mismo
host configurado.

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
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434",
      },
    },
  },
}
```

Si no se establece una URL base explícita de Ollama, OpenClaw usa `http://127.0.0.1:11434`.

Si tu host de Ollama espera autenticación bearer, OpenClaw reutiliza
`models.providers.ollama.apiKey` (o la autenticación del proveedor respaldada por env que coincida)
también para las solicitudes de búsqueda web.

## Notas

- No se requiere un campo de clave API específico de búsqueda web para este proveedor.
- Si el host de Ollama está protegido por autenticación, OpenClaw reutiliza la clave API normal del
  proveedor Ollama cuando está presente.
- OpenClaw avisa durante la configuración si Ollama no es accesible o no ha iniciado sesión, pero
  no bloquea la selección.
- La autodetección en tiempo de ejecución puede recurrir a Ollama Web Search cuando no hay
  ningún proveedor con credenciales de mayor prioridad configurado.
- El proveedor usa el endpoint experimental `/api/experimental/web_search`
  de Ollama.

## Relacionado

- [Resumen de Web Search](/es/tools/web) -- todos los proveedores y detección automática
- [Ollama](/es/providers/ollama) -- configuración de modelos de Ollama y modos cloud/local
