---
read_when:
    - Quieres usar Ollama para `web_search`
    - Quieres un proveedor de `web_search` sin clave
    - Necesitas una guía de configuración de Búsqueda web de Ollama
summary: Búsqueda web de Ollama mediante tu host de Ollama configurado
title: Búsqueda web de Ollama
x-i18n:
    generated_at: "2026-04-26T11:39:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: dadee473d4e0674d9261b93adb1ddf77221e949d385fb522ccb630ed0e73d340
    source_path: tools/ollama-search.md
    workflow: 15
---

OpenClaw es compatible con **Búsqueda web de Ollama** como proveedor `web_search` integrado. Usa la API de búsqueda web de Ollama y devuelve resultados estructurados con títulos, URL y fragmentos.

A diferencia del proveedor de modelos de Ollama, esta configuración no necesita una clave de API de forma predeterminada. Sí requiere:

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

Anulación opcional del host de Ollama:

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

Si no se configura una URL base explícita de Ollama, OpenClaw usa `http://127.0.0.1:11434`.

Si tu host de Ollama espera autenticación bearer, OpenClaw reutiliza
`models.providers.ollama.apiKey` (o la autenticación del proveedor respaldada por variables de entorno correspondiente)
también para las solicitudes de búsqueda web.

## Notas

- Este proveedor no requiere un campo de clave de API específico para búsqueda web.
- Si el host de Ollama está protegido por autenticación, OpenClaw reutiliza la clave de API normal del proveedor Ollama cuando está presente.
- OpenClaw muestra una advertencia durante la configuración si Ollama es inaccesible o no ha iniciado sesión, pero no bloquea la selección.
- La detección automática en tiempo de ejecución puede recurrir a Búsqueda web de Ollama cuando no hay configurado ningún proveedor autenticado de mayor prioridad.
- El proveedor usa el endpoint `/api/web_search` de Ollama.

## Relacionado

- [Resumen de Búsqueda web](/es/tools/web) -- todos los proveedores y la detección automática
- [Ollama](/es/providers/ollama) -- configuración de modelos de Ollama y modos cloud/local
