---
read_when:
    - Quieres usar Gemini para `web_search`
    - Necesitas un `GEMINI_API_KEY`
    - Quieres grounding de Google Search
summary: Búsqueda web de Gemini con grounding de Google Search
title: Búsqueda de Gemini
x-i18n:
    generated_at: "2026-04-24T05:53:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0778ae326e23ea1bb719fdc694b2accc5a6651e08658a695d4d70e20fc5943a4
    source_path: tools/gemini-search.md
    workflow: 15
---

OpenClaw admite modelos Gemini con
[grounding de Google Search](https://ai.google.dev/gemini-api/docs/grounding) integrado,
que devuelve respuestas sintetizadas por IA respaldadas por resultados en vivo de Google Search con
citas.

## Obtener una clave API

<Steps>
  <Step title="Crear una clave">
    Ve a [Google AI Studio](https://aistudio.google.com/apikey) y crea una
    clave API.
  </Step>
  <Step title="Guardar la clave">
    Configura `GEMINI_API_KEY` en el entorno del Gateway, o configura mediante:

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
            apiKey: "AIza...", // opcional si GEMINI_API_KEY está configurado
            model: "gemini-2.5-flash", // predeterminado
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

**Alternativa mediante entorno:** configura `GEMINI_API_KEY` en el entorno del Gateway.
Para una instalación de gateway, colócalo en `~/.openclaw/.env`.

## Cómo funciona

A diferencia de los proveedores de búsqueda tradicionales que devuelven una lista de enlaces y fragmentos,
Gemini usa el grounding de Google Search para producir respuestas sintetizadas por IA con
citas inline. Los resultados incluyen tanto la respuesta sintetizada como las URL de origen.

- Las URL de citas del grounding de Gemini se resuelven automáticamente desde URL de redirección
  de Google a URL directas.
- La resolución de redirecciones usa la ruta de protección SSRF (comprobaciones HEAD + de redirección +
  validación de http/https) antes de devolver la URL final de la cita.
- La resolución de redirecciones usa valores predeterminados estrictos de SSRF, por lo que las redirecciones a
  destinos privados/internos se bloquean.

## Parámetros admitidos

La búsqueda de Gemini admite `query`.

Se acepta `count` por compatibilidad con `web_search` compartido, pero el grounding de Gemini
sigue devolviendo una respuesta sintetizada con citas en lugar de una lista de
N resultados.

No se admiten filtros específicos del proveedor como `country`, `language`, `freshness` y
`domain_filter`.

## Selección de modelo

El modelo predeterminado es `gemini-2.5-flash` (rápido y rentable). Cualquier modelo Gemini
que admita grounding puede usarse mediante
`plugins.entries.google.config.webSearch.model`.

## Relacionado

- [Resumen de búsqueda web](/es/tools/web) -- todos los proveedores y detección automática
- [Búsqueda de Brave](/es/tools/brave-search) -- resultados estructurados con fragmentos
- [Búsqueda de Perplexity](/es/tools/perplexity-search) -- resultados estructurados + extracción de contenido
