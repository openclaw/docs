---
read_when:
    - Quiere usar Brave Search para web_search
    - Necesitas una BRAVE_API_KEY o los detalles del plan.
summary: Configuración de la API de Brave Search para web_search
title: Búsqueda de Brave
x-i18n:
    generated_at: "2026-07-20T00:55:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 52168db93abb564eda5868584261e0530ce3cff57c3463a2fc1eded351df30f2
    source_path: tools/brave-search.md
    workflow: 16
---

OpenClaw admite la API de Brave Search como proveedor de `web_search`.

## Obtener una clave de API

1. Cree una cuenta de la API de Brave Search en [https://brave.com/search/api/](https://brave.com/search/api/)
2. En el panel, elija el plan **Search** y genere una clave de API.
3. Guarde la clave en la configuración o establezca `BRAVE_API_KEY` en el entorno del Gateway.

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
            baseUrl: "https://api.search.brave.com", // sobrescritura opcional del proxy o de la URL base
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

La configuración de búsqueda específica del proveedor Brave se encuentra en `plugins.entries.brave.config.webSearch.*`; esta es la ruta de configuración canónica.

`webSearch.mode` controla el transporte de Brave:

- `web` (predeterminado): búsqueda web normal de Brave con títulos, URL y fragmentos
- `llm-context`: API LLM Context de Brave con fragmentos de texto extraídos previamente y fuentes para fundamentación

`webSearch.baseUrl` puede dirigir las solicitudes de Brave a un proxy compatible con Brave de confianza
o a un gateway. OpenClaw añade `/res/v1/web/search` o `/res/v1/llm/context` a
la URL base configurada y conserva la URL base en la clave de caché. Los
endpoints públicos deben usar `https://`; `http://` solo se acepta para hosts proxy de confianza
en la interfaz de bucle invertido o en una red privada.

## Parámetros de la herramienta

<ParamField path="query" type="string" required>
Consulta de búsqueda.
</ParamField>

<ParamField path="count" type="number" default="5">
Número de resultados que se devolverán (1–10).
</ParamField>

<ParamField path="country" type="string">
Código de país ISO de 2 letras (p. ej., `US`, `DE`).
</ParamField>

<ParamField path="language" type="string">
Código de idioma ISO 639-1 para los resultados de búsqueda (p. ej., `en`, `de`, `fr`).
</ParamField>

<ParamField path="search_lang" type="string">
Código de idioma de búsqueda de Brave (p. ej., `en`, `en-gb`, `zh-hans`).
</ParamField>

<ParamField path="ui_lang" type="string">
Código de idioma ISO para los elementos de la interfaz de usuario.
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
Filtro temporal: `day` equivale a 24 horas.
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
  query: "energía renovable",
  country: "DE",
  language: "de",
});

// Resultados recientes (última semana)
await web_search({
  query: "noticias de IA",
  freshness: "week",
});

// Búsqueda por intervalo de fechas
await web_search({
  query: "avances en IA",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});
```

## Notas

- OpenClaw utiliza el plan **Search** de Brave. Si tiene una suscripción heredada (p. ej., el plan Free original con 2.000 consultas/mes), esta sigue siendo válida, pero no incluye funciones más recientes como LLM Context ni límites de solicitudes más altos.
- Cada plan de Brave incluye **\$5/mes de crédito gratuito** (renovable). El plan Search cuesta \$5 por cada 1.000 solicitudes, por lo que el crédito cubre 1.000 consultas/mes. Establezca su límite de uso en el panel de Brave para evitar cargos inesperados. Consulte el [portal de la API de Brave](https://brave.com/search/api/) para conocer los planes actuales.
- El plan Search incluye el endpoint LLM Context y derechos de inferencia de IA. Para almacenar resultados con el fin de entrenar o ajustar modelos, se requiere un plan con derechos explícitos de almacenamiento. Consulte los [Términos de servicio](https://api-dashboard.search.brave.com/terms-of-service) de Brave.
- El modo `llm-context` devuelve entradas de fuentes fundamentadas en lugar de la estructura normal de fragmentos de búsqueda web.
- El modo `llm-context` admite `freshness` e intervalos delimitados de `date_after` + `date_before`. No admite `ui_lang`; `date_before` sin `date_after` se rechaza porque Brave exige que los intervalos de actualización personalizados incluyan tanto la fecha inicial como la final.
- `ui_lang` debe incluir una subetiqueta de región como `en-US`.
- Los resultados se almacenan en caché durante 15 minutos de forma predeterminada (configurable mediante `cacheTtlMinutes`).
- Los valores personalizados de `webSearch.baseUrl` se incluyen en la identidad de caché de Brave, por lo que
  las respuestas específicas del proxy no entran en conflicto.
- Active la marca de diagnóstico `brave.http` para registrar las URL y los parámetros de consulta de las solicitudes de Brave, el estado y la duración de las respuestas, así como los eventos de acierto, fallo y escritura de la caché de búsqueda durante la resolución de problemas. La marca nunca registra la clave de API ni los cuerpos de las respuestas, pero las consultas de búsqueda pueden contener información confidencial.

## Contenido relacionado

- [Descripción general de la búsqueda web](/es/tools/web) -- todos los proveedores y detección automática
- [Búsqueda de Perplexity](/es/tools/perplexity-search) -- resultados estructurados con filtrado por dominio
- [Búsqueda de Exa](/es/tools/exa-search) -- búsqueda neuronal con extracción de contenido
