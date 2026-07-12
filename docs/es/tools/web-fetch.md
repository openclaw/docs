---
read_when:
    - Quieres obtener una URL y extraer contenido legible
    - Necesitas configurar `web_fetch` o su alternativa de respaldo Firecrawl
    - Quieres comprender los límites y el almacenamiento en caché de web_fetch
sidebarTitle: Web Fetch
summary: 'Herramienta web_fetch: obtención mediante HTTP con extracción de contenido legible'
title: Obtención web
x-i18n:
    generated_at: "2026-07-11T23:40:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8c956b01fce44dc4b8f3ac289b312691c3fe4293ed2e6777fb53f3345dd99e93
    source_path: tools/web-fetch.md
    workflow: 16
---

`web_fetch` realiza una solicitud HTTP GET simple y extrae contenido legible (de HTML a
markdown o texto). **No** ejecuta JavaScript. Para sitios que dependen en gran medida de JS o
páginas protegidas mediante inicio de sesión, usa el [navegador web](/es/tools/browser).

## Inicio rápido

Está habilitado de forma predeterminada y no requiere configuración:

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## Parámetros de la herramienta

<ParamField path="url" type="string" required>
URL que se obtendrá. Solo `http(s)`.
</ParamField>

<ParamField path="extractMode" type="'markdown' | 'text'" default="markdown">
Formato de salida tras extraer el contenido principal.
</ParamField>

<ParamField path="maxChars" type="number">
Trunca la salida a esta cantidad de caracteres. El valor se limita a `tools.web.fetch.maxCharsCap`.
</ParamField>

## Funcionamiento

<Steps>
  <Step title="Obtención">
    Envía una solicitud HTTP GET con un User-Agent similar al de Chrome y el encabezado
    `Accept-Language`. Bloquea los nombres de host privados o internos y vuelve a comprobar las redirecciones.
  </Step>
  <Step title="Extracción">
    Ejecuta Readability (extracción del contenido principal) sobre la respuesta HTML.
  </Step>
  <Step title="Alternativa (opcional)">
    Si Readability falla y hay disponible un proveedor de obtención, vuelve a intentarlo mediante
    dicho proveedor (por ejemplo, el modo de elusión de bots de Firecrawl).
  </Step>
  <Step title="Caché">
    Los resultados se almacenan en caché durante 15 minutos (configurable) para reducir las
    obtenciones repetidas de la misma URL.
  </Step>
</Steps>

## Actualizaciones de progreso

`web_fetch` emite una línea pública de progreso solo cuando la obtención sigue pendiente
después de cinco segundos:

```text
Obteniendo el contenido de la página...
```

Los aciertos rápidos de caché y las respuestas rápidas de red finalizan antes de que se active el temporizador, por lo que
nunca muestran una línea de progreso. Cancelar la llamada borra el temporizador. La
línea de progreso solo representa el estado de la interfaz del canal y nunca contiene el contenido obtenido de la página.

## Configuración

```json5
{
  tools: {
    web: {
      fetch: {
        enabled: true, // valor predeterminado: true
        provider: "firecrawl", // opcional; omitir para la detección automática
        maxChars: 20000, // caracteres de salida predeterminados; limitado por maxCharsCap
        maxCharsCap: 20000, // límite estricto para el parámetro maxChars
        maxResponseBytes: 750000, // tamaño máximo de descarga antes del truncamiento (32000-10000000)
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        useTrustedEnvProxy: false, // permite que un proxy de entorno HTTP(S) de confianza resuelva el DNS
        readability: true, // usa la extracción de Readability
        userAgent: "Mozilla/5.0 ...", // reemplaza el User-Agent
        ssrfPolicy: {
          allowRfc2544BenchmarkRange: true, // inclusión voluntaria para proxies de IP falsas de confianza que usan 198.18.0.0/15
          allowIpv6UniqueLocalRange: true, // inclusión voluntaria para proxies de IP falsas de confianza que usan fc00::/7
        },
      },
    },
  },
}
```

## Alternativa con Firecrawl

Si la extracción de Readability falla, `web_fetch` puede recurrir a
[Firecrawl](/es/tools/firecrawl) para eludir bots y mejorar la extracción:

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // opcional; omitir para la detección automática a partir de las credenciales disponibles
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            // apiKey: "fc-...", // opcional; omitir para el acceso inicial sin clave
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 172800000, // duración de la caché (2 días)
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

`plugins.entries.firecrawl.config.webFetch.apiKey` es opcional y admite objetos SecretRef.
La configuración heredada `tools.web.fetch.firecrawl.*` se migra automáticamente a
`plugins.entries.firecrawl.config.webFetch` mediante `openclaw doctor --fix`.

<Note>
  Si configuras una SecretRef para una clave de API de Firecrawl y no se puede resolver ni existe
  `FIRECRAWL_API_KEY` como alternativa en el entorno, el inicio del Gateway falla de inmediato.
</Note>

<Note>
  Las sustituciones de `baseUrl` de Firecrawl están restringidas: el tráfico alojado usa
  `https://api.firecrawl.dev`; las sustituciones autoalojadas deben apuntar a extremos privados o
  internos, y `http://` solo se acepta para esos destinos privados.
</Note>

Comportamiento actual en tiempo de ejecución:

- `tools.web.fetch.provider` selecciona explícitamente el proveedor alternativo de obtención.
- Si se omite `provider`, OpenClaw detecta automáticamente el primer proveedor de obtención web
  listo a partir de las credenciales configuradas. Las llamadas a `web_fetch` que no están en un entorno aislado pueden usar
  plugins instalados que declaren `contracts.webFetchProviders` y registren un
  proveedor correspondiente en tiempo de ejecución. Actualmente, el plugin oficial de Firecrawl proporciona esta
  alternativa.
- Las llamadas a `web_fetch` en entornos aislados permiten proveedores incluidos, además de proveedores instalados
  cuyo origen oficial de npm o ClawHub esté verificado. Actualmente, esto permite el
  plugin oficial de Firecrawl; los plugins externos de obtención de terceros permanecen excluidos.
- Si Readability está deshabilitado, `web_fetch` pasa directamente al proveedor alternativo
  seleccionado. Si no hay ningún proveedor disponible, falla de forma segura.

## Proxy de entorno de confianza

Si tu implementación requiere que `web_fetch` pase por un proxy HTTP(S)
saliente de confianza, establece `tools.web.fetch.useTrustedEnvProxy: true`.

En este modo, OpenClaw sigue aplicando comprobaciones SSRF basadas en el nombre de host antes de enviar
la solicitud, pero permite que el proxy resuelva el DNS en lugar de fijar el DNS
localmente. Habilita esta opción solo cuando el proxy esté bajo el control del operador y aplique
la política de salida después de la resolución DNS.

<Note>
  Si no hay configurada ninguna variable de entorno para un proxy HTTP(S), o el host de destino está excluido mediante
  `NO_PROXY`, `web_fetch` vuelve a la ruta estricta normal con fijación local del
  DNS.
</Note>

## Límites y seguridad

- `maxChars` se limita a `tools.web.fetch.maxCharsCap` (valor predeterminado: `20000`)
- El cuerpo de la respuesta se limita a `maxResponseBytes` (valor predeterminado: `750000`, limitado a
  32000-10000000) antes del análisis; las respuestas que superan el tamaño se truncan con una advertencia
- Se bloquean los nombres de host privados o internos
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` y
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` son opciones específicas de inclusión voluntaria
  para conjuntos de proxies de IP falsas de confianza; déjalas sin establecer salvo que tu proxy controle
  esos intervalos sintéticos y aplique su propia política de destinos
- Las redirecciones se comprueban y se limitan mediante `maxRedirects` (valor predeterminado: `3`)
- `useTrustedEnvProxy` es una opción explícita de inclusión voluntaria y solo debe habilitarse para
  proxies controlados por el operador que sigan aplicando la política de salida después de la resolución
  DNS
- `web_fetch` funciona con el mejor esfuerzo posible; algunos sitios necesitan el [navegador web](/es/tools/browser)

## Perfiles de herramientas

Si usas perfiles de herramientas o listas de permitidos, añade `web_fetch` o `group:web`:

```json5
{
  tools: {
    allow: ["web_fetch"],
    // o: allow: ["group:web"]  (incluye web_fetch, web_search y x_search)
  },
}
```

## Contenido relacionado

- [Búsqueda web](/es/tools/web) -- busca en la web con varios proveedores
- [Navegador web](/es/tools/browser) -- automatización completa del navegador para sitios que dependen en gran medida de JS
- [Firecrawl](/es/tools/firecrawl) -- herramientas de búsqueda y extracción de Firecrawl
