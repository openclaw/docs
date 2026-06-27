---
read_when:
    - Quieres obtener una URL y extraer contenido legible
    - Debes configurar web_fetch o su mecanismo alternativo Firecrawl
    - Quieres entender los límites y el almacenamiento en caché de web_fetch
sidebarTitle: Web Fetch
summary: herramienta web_fetch -- obtención HTTP con extracción de contenido legible
title: Obtención web
x-i18n:
    generated_at: "2026-06-27T13:14:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b5a4127b97ded80eec1a5944bc8606069e630c61f89c4d5ce9cb729390b4eb4d
    source_path: tools/web-fetch.md
    workflow: 16
---

La herramienta `web_fetch` realiza un HTTP GET simple y extrae contenido legible
(HTML a markdown o texto). **No** ejecuta JavaScript.

Para sitios con mucho JS o páginas protegidas por inicio de sesión, usa el
[Navegador web](/es/tools/browser) en su lugar.

## Inicio rápido

`web_fetch` está **habilitada de forma predeterminada** -- no requiere configuración. El agente puede
llamarla de inmediato:

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## Parámetros de la herramienta

<ParamField path="url" type="string" required>
URL que se obtendrá. Solo `http(s)`.
</ParamField>

<ParamField path="extractMode" type="'markdown' | 'text'" default="markdown">
Formato de salida después de la extracción del contenido principal.
</ParamField>

<ParamField path="maxChars" type="number">
Trunca la salida a esta cantidad de caracteres.
</ParamField>

## Cómo funciona

<Steps>
  <Step title="Fetch">
    Envía un HTTP GET con un User-Agent similar a Chrome y el encabezado
    `Accept-Language`. Bloquea nombres de host privados/internos y vuelve a comprobar las redirecciones.
  </Step>
  <Step title="Extract">
    Ejecuta Readability (extracción del contenido principal) en la respuesta HTML.
  </Step>
  <Step title="Fallback (optional)">
    Si Readability falla y Firecrawl está seleccionado, reintenta mediante la
    API de Firecrawl con modo de elusión de bots.
  </Step>
  <Step title="Cache">
    Los resultados se almacenan en caché durante 15 minutos (configurable) para reducir obtenciones
    repetidas de la misma URL.
  </Step>
</Steps>

## Actualizaciones de progreso

`web_fetch` emite una línea de progreso pública solo cuando la obtención sigue pendiente
después de cinco segundos:

```text
Fetching page content...
```

Los aciertos rápidos de caché y las respuestas de red rápidas terminan antes de que se active el temporizador, por lo que
no muestran una línea de progreso. Si la llamada se cancela, el temporizador se borra.
Cuando la obtención finalmente se completa, el agente recibe el resultado normal de la herramienta;
la línea de progreso es solo estado de la interfaz del canal y nunca contiene el contenido de la página
obtenida.

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

## Respaldo de Firecrawl

Si la extracción de Readability falla, `web_fetch` puede recurrir a
[Firecrawl](/es/tools/firecrawl) para eludir bots y mejorar la extracción:

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
            // apiKey: "fc-...", // optional; omit for keyless starter access
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

`plugins.entries.firecrawl.config.webFetch.apiKey` es opcional y admite objetos SecretRef.
La configuración heredada `tools.web.fetch.firecrawl.*` se migra automáticamente mediante `openclaw doctor --fix`.

<Note>
  Si configuras un SecretRef de clave de API de Firecrawl y no se puede resolver sin un respaldo de la variable de entorno
  `FIRECRAWL_API_KEY`, el inicio del Gateway falla rápidamente.
</Note>

<Note>
  Las anulaciones de `baseUrl` de Firecrawl están restringidas: el tráfico alojado usa
  `https://api.firecrawl.dev`; las anulaciones autoalojadas deben apuntar a endpoints privados o
  internos, y `http://` se acepta solo para esos destinos privados.
</Note>

Comportamiento actual en tiempo de ejecución:

- `tools.web.fetch.provider` selecciona explícitamente el proveedor de respaldo de obtención.
- Si se omite `provider`, OpenClaw detecta automáticamente el primer proveedor de web-fetch
  listo a partir de las credenciales configuradas. `web_fetch` sin sandbox puede usar
  plugins instalados que declaran `contracts.webFetchProviders` y registran un
  proveedor coincidente en tiempo de ejecución. El Plugin oficial de Firecrawl proporciona este
  respaldo.
- Las llamadas a `web_fetch` en sandbox permiten proveedores integrados más proveedores instalados
  cuyo origen oficial en npm o ClawHub esté verificado. Hoy eso permite el
  Plugin oficial de Firecrawl; los plugins externos de obtención de terceros quedan excluidos.
- Si Readability está deshabilitado, `web_fetch` pasa directamente al respaldo del
  proveedor seleccionado. Si no hay ningún proveedor disponible, falla de forma cerrada.

## Proxy de entorno confiable

Si tu despliegue requiere que `web_fetch` pase por un proxy saliente
HTTP(S) confiable, define `tools.web.fetch.useTrustedEnvProxy: true`.

En este modo, OpenClaw sigue aplicando comprobaciones SSRF basadas en nombres de host antes de enviar
la solicitud, pero permite que el proxy resuelva DNS en lugar de hacer fijación de DNS local.
Habilítalo solo cuando el proxy esté controlado por el operador y aplique
políticas salientes después de la resolución DNS.

<Note>
  Si no hay ninguna variable de entorno de proxy HTTP(S) configurada, o el host de destino está excluido por
  `NO_PROXY`, `web_fetch` vuelve a la ruta estricta normal con fijación de DNS
  local.
</Note>

## Límites y seguridad

- `maxChars` se limita a `tools.web.fetch.maxCharsCap`
- El cuerpo de la respuesta se limita a `maxResponseBytes` antes del análisis; las respuestas
  demasiado grandes se truncan con una advertencia
- Los nombres de host privados/internos están bloqueados
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` y
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` son opciones de activación restringidas
  para pilas de proxy de IP falsa confiables; déjalas sin definir a menos que tu proxy controle
  esos rangos sintéticos y aplique su propia política de destino
- Las redirecciones se comprueban y se limitan mediante `maxRedirects`
- `useTrustedEnvProxy` es una activación explícita y solo debe habilitarse para
  proxies controlados por el operador que sigan aplicando políticas salientes después de la resolución
  DNS
- `web_fetch` es de mejor esfuerzo -- algunos sitios necesitan el [Navegador web](/es/tools/browser)

## Perfiles de herramientas

Si usas perfiles de herramientas o listas de permitidos, agrega `web_fetch` o `group:web`:

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
- [Firecrawl](/es/tools/firecrawl) -- herramientas de búsqueda y scraping de Firecrawl
