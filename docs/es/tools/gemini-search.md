---
read_when:
    - Quieres usar Gemini para web_search
    - Necesitas GEMINI_API_KEY o models.providers.google.apiKey
    - Quieres fundamentación con Google Search
summary: Búsqueda web de Gemini con fundamentación en Google Search
title: Búsqueda de Gemini
x-i18n:
    generated_at: "2026-05-02T05:37:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 015d77fef123b1fd99d43eb6472bb8c672585328e17735d1fa0ead387cd2066a
    source_path: tools/gemini-search.md
    workflow: 16
---

OpenClaw admite modelos Gemini con
[fundamentación integrada de Google Search](https://ai.google.dev/gemini-api/docs/grounding),
que devuelve respuestas sintetizadas por IA respaldadas por resultados activos de Google Search con
citas.

## Obtener una clave de API

<Steps>
  <Step title="Crear una clave">
    Ve a [Google AI Studio](https://aistudio.google.com/apikey) y crea una
    clave de API.
  </Step>
  <Step title="Almacenar la clave">
    Establece `GEMINI_API_KEY` en el entorno del Gateway, reutiliza
    `models.providers.google.apiKey`, o configura una clave dedicada para búsqueda web mediante:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## Configuración

```json5
{
  plugins: {
    entries: {
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // optional if GEMINI_API_KEY or models.providers.google.apiKey is set
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // optional; falls back to models.providers.google.baseUrl
            model: "gemini-2.5-flash", // default
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "gemini",
      },
    },
  },
}
```

**Precedencia de credenciales:** La búsqueda web de Gemini usa
`plugins.entries.google.config.webSearch.apiKey` primero, luego `GEMINI_API_KEY`,
y después `models.providers.google.apiKey`. Para las URL base, la opción dedicada
`plugins.entries.google.config.webSearch.baseUrl` tiene prioridad sobre
`models.providers.google.baseUrl`.

Para una instalación de Gateway, coloca las claves de entorno en `~/.openclaw/.env`.

## Cómo funciona

A diferencia de los proveedores de búsqueda tradicionales que devuelven una lista de enlaces y fragmentos,
Gemini usa la fundamentación de Google Search para producir respuestas sintetizadas por IA con
citas en línea. Los resultados incluyen tanto la respuesta sintetizada como las URL de origen.

- Las URL de citas de la fundamentación de Gemini se resuelven automáticamente desde URL de redirección de Google
  a URL directas.
- La resolución de redirecciones usa la ruta de protección SSRF (HEAD + comprobaciones de redirección +
  validación http/https) antes de devolver la URL de cita final.
- La resolución de redirecciones usa valores predeterminados estrictos de SSRF, por lo que se bloquean las redirecciones a
  destinos privados/internos.

## Parámetros admitidos

La búsqueda de Gemini admite `query`, `freshness`, `date_after` y `date_before`.

`count` se acepta para compatibilidad compartida con `web_search`, pero la fundamentación de Gemini
sigue devolviendo una respuesta sintetizada con citas en lugar de una lista de N resultados.

`freshness` acepta `day`, `week`, `month`, `year` y los atajos compartidos
`pd`, `pw`, `pm` y `py`. OpenClaw convierte estos valores, o un rango explícito
`date_after`/`date_before`, en el `timeRangeFilter` de la fundamentación de Google Search de Gemini.
`country`, `language` y `domain_filter` no son compatibles.

## Selección de modelo

El modelo predeterminado es `gemini-2.5-flash` (rápido y rentable). Cualquier modelo Gemini
que admita fundamentación puede usarse mediante
`plugins.entries.google.config.webSearch.model`.

## Sobrescrituras de URL base

Establece `plugins.entries.google.config.webSearch.baseUrl` cuando la búsqueda web de Gemini
deba enrutarse a través de un proxy de operador o un endpoint personalizado compatible con Gemini. Si
no se establece, la búsqueda web de Gemini reutiliza `models.providers.google.baseUrl`. Un valor simple
`https://generativelanguage.googleapis.com` se normaliza a
`https://generativelanguage.googleapis.com/v1beta`; las rutas de proxy personalizadas se mantienen
tal como se proporcionan después de recortar las barras finales.

## Relacionado

- [Resumen de búsqueda web](/es/tools/web) -- todos los proveedores y detección automática
- [Brave Search](/es/tools/brave-search) -- resultados estructurados con fragmentos
- [Perplexity Search](/es/tools/perplexity-search) -- resultados estructurados + extracción de contenido
