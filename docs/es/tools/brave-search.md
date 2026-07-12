---
read_when:
    - Quieres usar Brave Search para `web_search`
    - Necesitas una BRAVE_API_KEY o los detalles del plan.
summary: Configuración de la API de Brave Search para web_search
title: Búsqueda de Brave
x-i18n:
    generated_at: "2026-07-11T23:33:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 35e4bc2d24769f25cac79c36607e1dfe2c6ca2078715edfaed92add070817e46
    source_path: tools/brave-search.md
    workflow: 16
---

OpenClaw admite la API de Brave Search como proveedor de `web_search`.

## Obtener una clave de API

1. Crea una cuenta de la API de Brave Search en [https://brave.com/search/api/](https://brave.com/search/api/)
2. En el panel, elige el plan **Search** y genera una clave de API.
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
            baseUrl: "https://api.search.brave.com", // sustitución opcional de la URL base o del proxy
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

La configuración de búsqueda específica del proveedor Brave se encuentra en `plugins.entries.brave.config.webSearch.*`; esta es la ruta de configuración canónica. Un `tools.web.search.apiKey` compartido de nivel superior y un `tools.web.search.brave.*` con ámbito definido todavía se cargan mediante una combinación de compatibilidad, pero las configuraciones nuevas deben usar la ruta con ámbito de plugin indicada anteriormente.

`webSearch.mode` controla el transporte de Brave:

- `web` (predeterminado): búsqueda web normal de Brave con títulos, URL y fragmentos
- `llm-context`: API LLM Context de Brave con fragmentos de texto y fuentes extraídos previamente para aportar contexto verificable

`webSearch.baseUrl` puede dirigir las solicitudes de Brave a un proxy
o Gateway de confianza compatible con Brave. OpenClaw añade `/res/v1/web/search` o `/res/v1/llm/context` a
la URL base configurada y mantiene la URL base en la clave de caché. Los
puntos de conexión públicos deben usar `https://`; `http://` solo se acepta para hosts de proxy
de local loopback de confianza o de una red privada.

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

- OpenClaw usa el plan **Search** de Brave. Si tienes una suscripción heredada (por ejemplo, el plan Free original con 2000 consultas al mes), sigue siendo válida, pero no incluye funciones más recientes, como LLM Context o límites de frecuencia más altos.
- Cada plan de Brave incluye **\$5 al mes en crédito gratuito** (renovable). El plan Search cuesta \$5 por cada 1000 solicitudes, por lo que el crédito cubre 1000 consultas al mes. Establece el límite de uso en el panel de Brave para evitar cargos inesperados. Consulta el [portal de la API de Brave](https://brave.com/search/api/) para conocer los planes actuales.
- El plan Search incluye el punto de conexión de LLM Context y derechos de inferencia de IA. El almacenamiento de resultados para entrenar o ajustar modelos requiere un plan con derechos de almacenamiento explícitos. Consulta los [Términos de servicio](https://api-dashboard.search.brave.com/terms-of-service) de Brave.
- El modo `llm-context` devuelve entradas de fuentes con contexto verificable en lugar de la estructura normal de fragmentos de búsqueda web.
- El modo `llm-context` admite `freshness` e intervalos delimitados de `date_after` + `date_before`. No admite `ui_lang`; se rechaza `date_before` sin `date_after` porque Brave exige que los intervalos de actualidad personalizados incluyan tanto la fecha inicial como la final.
- `ui_lang` debe incluir una subetiqueta de región, como `en-US`.
- Los resultados se almacenan en caché durante 15 minutos de forma predeterminada (se puede configurar mediante `cacheTtlMinutes`).
- Los valores personalizados de `webSearch.baseUrl` se incluyen en la identidad de caché de Brave, por lo que
  las respuestas específicas de cada proxy no entran en conflicto.
- Activa el indicador de diagnóstico `brave.http` para registrar las URL y los parámetros de consulta de las solicitudes de Brave, el estado y la duración de las respuestas, y los eventos de acierto, fallo y escritura de la caché de búsqueda durante la resolución de problemas. El indicador nunca registra la clave de API ni los cuerpos de las respuestas, pero las consultas de búsqueda pueden ser confidenciales.

## Contenido relacionado

- [Descripción general de la búsqueda web](/es/tools/web) -- todos los proveedores y la detección automática
- [Búsqueda de Perplexity](/es/tools/perplexity-search) -- resultados estructurados con filtrado por dominio
- [Búsqueda de Exa](/es/tools/exa-search) -- búsqueda neuronal con extracción de contenido
