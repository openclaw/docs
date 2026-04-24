---
read_when:
    - Quieres usar Brave Search para `web_search`
    - Necesitas una `BRAVE_API_KEY` o detalles del plan
summary: Configuración de la API de Brave Search para `web_search`
title: Búsqueda de Brave (ruta heredada)
x-i18n:
    generated_at: "2026-04-24T05:18:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: e2769da4db2ff5b94217c09b13ef5ee4106ba108a828db2a99892a4a15d7b517
    source_path: brave-search.md
    workflow: 15
---

# API de Brave Search

OpenClaw es compatible con la API de Brave Search como proveedor de `web_search`.

## Obtener una clave de API

1. Crea una cuenta de Brave Search API en [https://brave.com/search/api/](https://brave.com/search/api/)
2. En el panel, elige el plan **Search** y genera una clave de API.
3. Guarda la clave en la configuración o establece `BRAVE_API_KEY` en el entorno de Gateway.

## Ejemplo de configuración

```json5
{
  plugins: {
    entries: {
      brave: {
        config: {
          webSearch: {
            apiKey: "BRAVE_API_KEY_HERE",
            mode: "web", // or "llm-context"
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "brave",
        maxResults: 5,
        timeoutSeconds: 30,
      },
    },
  },
}
```

Los ajustes de búsqueda de Brave específicos del proveedor ahora se encuentran en `plugins.entries.brave.config.webSearch.*`.
La ruta heredada `tools.web.search.apiKey` todavía se carga mediante la capa de compatibilidad, pero ya no es la ruta de configuración canónica.

`webSearch.mode` controla el transporte de Brave:

- `web` (predeterminado): búsqueda web normal de Brave con títulos, URL y fragmentos
- `llm-context`: API LLM Context de Brave con fragmentos de texto y fuentes preextraídos para fundamentación

## Parámetros de la herramienta

| Parameter     | Description                                                         |
| ------------- | ------------------------------------------------------------------- |
| `query`       | Consulta de búsqueda (obligatoria)                                  |
| `count`       | Número de resultados que se devolverán (1-10, predeterminado: 5)    |
| `country`     | Código de país ISO de 2 letras (p. ej., "US", "DE")                 |
| `language`    | Código de idioma ISO 639-1 para los resultados de búsqueda (p. ej., "en", "de", "fr") |
| `search_lang` | Código de idioma de búsqueda de Brave (p. ej., `en`, `en-gb`, `zh-hans`) |
| `ui_lang`     | Código de idioma ISO para los elementos de la interfaz              |
| `freshness`   | Filtro de tiempo: `day` (24 h), `week`, `month` o `year`            |
| `date_after`  | Solo resultados publicados después de esta fecha (AAAA-MM-DD)       |
| `date_before` | Solo resultados publicados antes de esta fecha (AAAA-MM-DD)         |

**Ejemplos:**

```javascript
// Country and language-specific search
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// Recent results (past week)
await web_search({
  query: "AI news",
  freshness: "week",
});

// Date range search
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});
```

## Notas

- OpenClaw usa el plan **Search** de Brave. Si tienes una suscripción heredada (por ejemplo, el plan Free original con 2.000 consultas/mes), sigue siendo válida, pero no incluye funciones más recientes como LLM Context ni límites de tasa más altos.
- Cada plan de Brave incluye **\$5/mes en crédito gratuito** (renovable). El plan Search cuesta \$5 por cada 1.000 solicitudes, por lo que el crédito cubre 1.000 consultas/mes. Establece tu límite de uso en el panel de Brave para evitar cargos inesperados. Consulta el [portal de la API de Brave](https://brave.com/search/api/) para ver los planes actuales.
- El plan Search incluye el endpoint de LLM Context y derechos de inferencia de IA. Almacenar resultados para entrenar o ajustar modelos requiere un plan con derechos de almacenamiento explícitos. Consulta los [Términos del servicio](https://api-dashboard.search.brave.com/terms-of-service) de Brave.
- El modo `llm-context` devuelve entradas de fuentes fundamentadas en lugar de la forma normal de fragmentos de búsqueda web.
- El modo `llm-context` no es compatible con `ui_lang`, `freshness`, `date_after` ni `date_before`.
- `ui_lang` debe incluir una subetiqueta de región como `en-US`.
- Los resultados se almacenan en caché durante 15 minutos de forma predeterminada (configurable mediante `cacheTtlMinutes`).

Consulta [Herramientas web](/es/tools/web) para ver la configuración completa de `web_search`.

## Relacionado

- [Búsqueda de Brave](/es/tools/brave-search)
