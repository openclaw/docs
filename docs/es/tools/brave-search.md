---
read_when:
    - Quieres usar Brave Search para web_search
    - Necesitas una BRAVE_API_KEY o los detalles del plan
summary: Configuración de la API de Brave Search para web_search
title: Búsqueda de Brave
x-i18n:
    generated_at: "2026-05-02T05:36:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: d5b6624d078ba55e30fbac4dd863a0d016e2e8d160e32bcc406e5070998241ba
    source_path: tools/brave-search.md
    workflow: 16
---

# Brave Search API

OpenClaw admite Brave Search API como proveedor de `web_search`.

## Obtener una clave de API

1. Crea una cuenta de Brave Search API en [https://brave.com/search/api/](https://brave.com/search/api/)
2. En el panel, elige el plan **Search** y genera una clave de API.
3. Guarda la clave en la configuración o define `BRAVE_API_KEY` en el entorno del Gateway.

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

La configuración de búsqueda específica del proveedor Brave ahora se encuentra en `plugins.entries.brave.config.webSearch.*`.
El valor heredado `tools.web.search.apiKey` todavía se carga mediante la capa de compatibilidad, pero ya no es la ruta canónica de configuración.

`webSearch.mode` controla el transporte de Brave:

- `web` (predeterminado): búsqueda web normal de Brave con títulos, URL y fragmentos
- `llm-context`: Brave LLM Context API con fragmentos de texto preextraídos y fuentes para fundamentación

## Parámetros de la herramienta

<ParamField path="query" type="string" required>
Consulta de búsqueda.
</ParamField>

<ParamField path="count" type="number" default="5">
Número de resultados que se devolverán (1–10).
</ParamField>

<ParamField path="country" type="string">
Código de país ISO de 2 letras (por ejemplo, `US`, `DE`).
</ParamField>

<ParamField path="language" type="string">
Código de idioma ISO 639-1 para los resultados de búsqueda (por ejemplo, `en`, `de`, `fr`).
</ParamField>

<ParamField path="search_lang" type="string">
Código de idioma de búsqueda de Brave (por ejemplo, `en`, `en-gb`, `zh-hans`).
</ParamField>

<ParamField path="ui_lang" type="string">
Código de idioma ISO para los elementos de la interfaz de usuario.
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
Filtro de tiempo: `day` son 24 horas.
</ParamField>

<ParamField path="date_after" type="string">
Solo resultados publicados después de esta fecha (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
Solo resultados publicados antes de esta fecha (`YYYY-MM-DD`).
</ParamField>

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

- OpenClaw usa el plan **Search** de Brave. Si tienes una suscripción heredada (por ejemplo, el plan Free original con 2000 consultas/mes), sigue siendo válida, pero no incluye funciones más recientes como LLM Context ni límites de frecuencia más altos.
- Cada plan de Brave incluye **\$5/mes en crédito gratuito** (renovable). El plan Search cuesta \$5 por cada 1000 solicitudes, por lo que el crédito cubre 1000 consultas/mes. Define tu límite de uso en el panel de Brave para evitar cargos inesperados. Consulta el [portal de Brave API](https://brave.com/search/api/) para ver los planes actuales.
- El plan Search incluye el endpoint LLM Context y derechos de inferencia de IA. Almacenar resultados para entrenar o ajustar modelos requiere un plan con derechos de almacenamiento explícitos. Consulta los [Términos de servicio](https://api-dashboard.search.brave.com/terms-of-service) de Brave.
- El modo `llm-context` devuelve entradas de fuentes fundamentadas en lugar de la forma normal de fragmento de búsqueda web.
- El modo `llm-context` admite `freshness` y rangos acotados de `date_after` + `date_before`. No admite `ui_lang`; `date_before` sin `date_after` se rechaza porque Brave requiere que los rangos de vigencia personalizados incluyan fechas de inicio y fin.
- `ui_lang` debe incluir una subetiqueta de región como `en-US`.
- Los resultados se almacenan en caché durante 15 minutos de forma predeterminada (configurable mediante `cacheTtlMinutes`).

## Relacionado

- [Descripción general de Web Search](/es/tools/web) -- todos los proveedores y la detección automática
- [Perplexity Search](/es/tools/perplexity-search) -- resultados estructurados con filtrado por dominio
- [Exa Search](/es/tools/exa-search) -- búsqueda neuronal con extracción de contenido
