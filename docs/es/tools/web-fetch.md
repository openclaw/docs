---
read_when:
    - Quieres obtener una URL y extraer contenido legible
    - Debes configurar web_fetch o su alternativa de respaldo de Firecrawl
    - Quieres comprender los límites y el almacenamiento en caché de web_fetch
sidebarTitle: Web Fetch
summary: herramienta web_fetch -- obtención HTTP con extracción de contenido legible
title: Obtención web
x-i18n:
    generated_at: "2026-05-06T18:01:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 337174898861db217bf0db052d8e8749989c295e89c73d9d5a6911f6335ba03d
    source_path: tools/web-fetch.md
    workflow: 16
---

La herramienta `web_fetch` realiza un HTTP GET simple y extrae contenido legible
(HTML a markdown o texto). **No** ejecuta JavaScript.

Para sitios con mucho JS o páginas protegidas por inicio de sesión, usa el
[Navegador web](/es/tools/browser) en su lugar.

## Inicio rápido

`web_fetch` está **habilitada de forma predeterminada**; no hace falta configuración. El agente puede
llamarla de inmediato:

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## Parámetros de la herramienta

<ParamField path="url" type="string" required>
URL que se va a obtener. Solo `http(s)`.
</ParamField>

<ParamField path="extractMode" type="'markdown' | 'text'" default="markdown">
Formato de salida después de la extracción del contenido principal.
</ParamField>

<ParamField path="maxChars" type="number">
Trunca la salida a esta cantidad de caracteres.
</ParamField>

## Cómo funciona

<Steps>
  <Step title="Obtener">
    Envía un HTTP GET con un User-Agent similar al de Chrome y un encabezado
    `Accept-Language`. Bloquea nombres de host privados/internos y vuelve a comprobar las redirecciones.
  </Step>
  <Step title="Extraer">
    Ejecuta Readability (extracción de contenido principal) en la respuesta HTML.
  </Step>
  <Step title="Reserva (opcional)">
    Si Readability falla y Firecrawl está configurado, vuelve a intentarlo mediante la
    API de Firecrawl con modo de elusión de bots.
  </Step>
  <Step title="Caché">
    Los resultados se almacenan en caché durante 15 minutos (configurable) para reducir
    las obtenciones repetidas de la misma URL.
  </Step>
</Steps>

## Configuración

```json5
{
  tools: {
    web: {
      fetch: {
        enabled: true, // default: true
        provider: "firecrawl", // optional; omit for auto-detect
        maxChars: 50000, // max output chars
        maxCharsCap: 50000, // hard cap for maxChars param
        maxResponseBytes: 2000000, // max download size before truncation
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        useTrustedEnvProxy: false, // let a trusted HTTP(S) env proxy resolve DNS
        readability: true, // use Readability extraction
        userAgent: "Mozilla/5.0 ...", // override User-Agent
        ssrfPolicy: {
          allowRfc2544BenchmarkRange: true, // opt-in for trusted fake-IP proxies using 198.18.0.0/15
          allowIpv6UniqueLocalRange: true, // opt-in for trusted fake-IP proxies using fc00::/7
        },
      },
    },
  },
}
```

## Reserva con Firecrawl

Si la extracción de Readability falla, `web_fetch` puede recurrir a
[Firecrawl](/es/tools/firecrawl) para elusión de bots y una mejor extracción:

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // optional; omit for auto-detect from available credentials
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            apiKey: "fc-...", // optional if FIRECRAWL_API_KEY is set
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 86400000, // cache duration (1 day)
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

`plugins.entries.firecrawl.config.webFetch.apiKey` admite objetos SecretRef.
La configuración heredada `tools.web.fetch.firecrawl.*` se migra automáticamente mediante `openclaw doctor --fix`.

<Note>
  Si Firecrawl está habilitado y su SecretRef no se resuelve sin una alternativa de entorno
  `FIRECRAWL_API_KEY`, el inicio de Gateway falla rápidamente.
</Note>

<Note>
  Las sobrescrituras de `baseUrl` de Firecrawl están restringidas: el tráfico alojado usa
  `https://api.firecrawl.dev`; las sobrescrituras autoalojadas deben apuntar a endpoints privados o
  internos, y `http://` se acepta solo para esos destinos privados.
</Note>

Comportamiento actual en tiempo de ejecución:

- `tools.web.fetch.provider` selecciona explícitamente el proveedor de reserva de obtención.
- Si se omite `provider`, OpenClaw detecta automáticamente el primer proveedor de web-fetch
  listo a partir de las credenciales disponibles. `web_fetch` no aislado puede usar
  plugins instalados que declaren `contracts.webFetchProviders` y registren un
  proveedor coincidente en tiempo de ejecución. Hoy, el proveedor incluido es Firecrawl.
- Las llamadas de `web_fetch` aisladas permanecen limitadas a los proveedores incluidos.
- Si Readability está deshabilitado, `web_fetch` pasa directamente a la reserva del
  proveedor seleccionado. Si no hay ningún proveedor disponible, falla de forma cerrada.

## Proxy de entorno confiable

Si tu despliegue requiere que `web_fetch` pase por un proxy HTTP(S) saliente
confiable, configura `tools.web.fetch.useTrustedEnvProxy: true`.

En este modo, OpenClaw sigue aplicando comprobaciones SSRF basadas en el nombre de host antes de enviar
la solicitud, pero permite que el proxy resuelva DNS en lugar de hacer fijación de DNS
local. Habilita esto solo cuando el proxy esté controlado por el operador y haga cumplir
la política saliente después de la resolución de DNS.

<Note>
  Si no hay ninguna variable de entorno de proxy HTTP(S) configurada, o el host de destino está excluido por
  `NO_PROXY`, `web_fetch` vuelve a la ruta estricta normal con fijación de DNS
  local.
</Note>

## Límites y seguridad

- `maxChars` se limita a `tools.web.fetch.maxCharsCap`
- El cuerpo de la respuesta se limita a `maxResponseBytes` antes del análisis; las respuestas
  sobredimensionadas se truncan con una advertencia
- Los nombres de host privados/internos se bloquean
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` y
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` son permisos explícitos restringidos
  para pilas de proxy de IP falsa confiables; déjalos sin configurar salvo que tu proxy sea propietario
  de esos rangos sintéticos y haga cumplir su propia política de destino
- Las redirecciones se comprueban y se limitan mediante `maxRedirects`
- `useTrustedEnvProxy` es un permiso explícito y solo debe habilitarse para
  proxies controlados por el operador que sigan haciendo cumplir la política saliente después de la
  resolución de DNS
- `web_fetch` funciona en modalidad de mejor esfuerzo; algunos sitios necesitan el [Navegador web](/es/tools/browser)

## Perfiles de herramientas

Si usas perfiles de herramientas o listas de permitidos, añade `web_fetch` o `group:web`:

```json5
{
  tools: {
    allow: ["web_fetch"],
    // or: allow: ["group:web"]  (includes web_fetch, web_search, and x_search)
  },
}
```

## Relacionado

- [Búsqueda web](/es/tools/web) -- busca en la web con varios proveedores
- [Navegador web](/es/tools/browser) -- automatización completa del navegador para sitios con mucho JS
- [Firecrawl](/es/tools/firecrawl) -- herramientas de búsqueda y extracción de Firecrawl
