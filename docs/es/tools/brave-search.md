---
read_when:
    - Quieres usar Brave Search para `web_search`
    - Necesitas un `BRAVE_API_KEY` o detalles del plan
summary: Configuración de la API de Brave Search para `web_search`
title: Búsqueda de Brave
x-i18n:
    generated_at: "2026-04-24T05:52:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0a59df7a5d52f665673b82b76ec9dce7ca34bf4e7b678029f6f7f7c5340c173b
    source_path: tools/brave-search.md
    workflow: 15
---

# API de Brave Search

OpenClaw admite la API de Brave Search como proveedor de `web_search`.

## Obtener una clave API

1. Crea una cuenta de la API de Brave Search en [https://brave.com/search/api/](https://brave.com/search/api/)
2. En el panel, elige el plan **Search** y genera una clave API.
3. Guarda la clave en la configuración o establece `BRAVE_API_KEY` en el entorno del Gateway.

## Ejemplo de configuración

```json5
{
  plugins: {
    entries: {
      brave: {
        config: {
          webSearch: {
            apiKey: "BRAVE_API_KEY_HERE",
            mode: "web", // o "llm-context"
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

Los ajustes específicos de búsqueda de Brave ahora viven bajo `plugins.entries.brave.config.webSearch.*`.
El heredado `tools.web.search.apiKey` sigue cargándose a través del shim de compatibilidad, pero ya no es la ruta canónica de configuración.

`webSearch.mode` controla el transporte de Brave:

- `web` (predeterminado): búsqueda web normal de Brave con títulos, URL y fragmentos
- `llm-context`: API Brave LLM Context con fragmentos de texto ya extraídos y fuentes para grounding

## Parámetros de la herramienta

<ParamField path="query" type="string" required>
Consulta de búsqueda.
</ParamField>

<ParamField path="count" type="number" default="5">
Número de resultados que se devolverán (1–10).
</ParamField>

<ParamField path="country" type="string">
Código de país ISO de 2 letras (por ejemplo `US`, `DE`).
</ParamField>

<ParamField path="language" type="string">
Código de idioma ISO 639-1 para los resultados de búsqueda (por ejemplo `en`, `de`, `fr`).
</ParamField>

<ParamField path="search_lang" type="string">
Código de idioma de búsqueda de Brave (por ejemplo `en`, `en-gb`, `zh-hans`).
</ParamField>

<ParamField path="ui_lang" type="string">
Código de idioma ISO para elementos de la interfaz.
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
Filtro temporal — `day` son 24 horas.
</ParamField>

<ParamField path="date_after" type="string">
Solo resultados publicados después de esta fecha (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
Solo resultados publicados antes de esta fecha (`YYYY-MM-DD`).
</ParamField>

**Ejemplos:**

```javascript
// Búsqueda específica por país e idioma
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// Resultados recientes (última semana)
await web_search({
  query: "AI news",
  freshness: "week",
});

// Búsqueda por intervalo de fechas
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});
```

## Notas

- OpenClaw usa el plan **Search** de Brave. Si tienes una suscripción heredada (por ejemplo, el plan Free original con 2.000 consultas/mes), sigue siendo válida, pero no incluye funciones más nuevas como LLM Context o límites de tasa más altos.
- Cada plan de Brave incluye **\$5/mes de crédito gratuito** (renovable). El plan Search cuesta \$5 por cada 1.000 solicitudes, así que el crédito cubre 1.000 consultas/mes. Configura tu límite de uso en el panel de Brave para evitar cargos inesperados. Consulta el [portal de la API de Brave](https://brave.com/search/api/) para ver los planes actuales.
- El plan Search incluye el endpoint LLM Context y derechos de inferencia de IA. Almacenar resultados para entrenar o ajustar modelos requiere un plan con derechos explícitos de almacenamiento. Consulta los [Términos de servicio](https://api-dashboard.search.brave.com/terms-of-service) de Brave.
- El modo `llm-context` devuelve entradas de fuentes con grounding en lugar del formato normal de fragmentos de búsqueda web.
- El modo `llm-context` no admite `ui_lang`, `freshness`, `date_after` ni `date_before`.
- `ui_lang` debe incluir una subetiqueta de región como `en-US`.
- Los resultados se almacenan en caché durante 15 minutos por defecto (configurable mediante `cacheTtlMinutes`).

## Relacionado

- [Resumen de búsqueda web](/es/tools/web) -- todos los proveedores y detección automática
- [Búsqueda de Perplexity](/es/tools/perplexity-search) -- resultados estructurados con filtrado por dominio
- [Búsqueda Exa](/es/tools/exa-search) -- búsqueda neuronal con extracción de contenido
