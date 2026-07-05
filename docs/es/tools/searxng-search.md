---
read_when:
    - Quieres un proveedor de búsqueda web autoalojado
    - Quieres usar SearXNG para web_search
    - Necesitas una opción de búsqueda centrada en la privacidad o aislada de la red
summary: Búsqueda web SearXNG -- proveedor de metabúsqueda autoalojado y sin clave
title: Búsqueda de SearXNG
x-i18n:
    generated_at: "2026-07-05T11:45:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cae8de9f8e2c8dd9cec615adb48da5c1fd7654bffe96c7afc1acea3effbcf1fc
    source_path: tools/searxng-search.md
    workflow: 16
---

OpenClaw admite [SearXNG](https://docs.searxng.org/) como proveedor `web_search` **autoalojado y
sin claves**. SearXNG es un motor de metabúsqueda de código abierto
que agrega resultados de Google, Bing, DuckDuckGo y otras fuentes.

Ventajas:

- **Gratuito e ilimitado** -- no se requiere clave de API ni suscripción comercial
- **Privacidad / aislamiento de red** -- las consultas nunca salen de tu red
- **Funciona en cualquier lugar** -- sin restricciones regionales en las API de búsqueda comerciales

## Configuración

<Steps>
  <Step title="Install the plugin">
    ```bash
    openclaw plugins install @openclaw/searxng-plugin
    ```
  </Step>
  <Step title="Run a SearXNG instance">
    ```bash
    docker run -d -p 8888:8080 searxng/searxng
    ```

    O usa cualquier despliegue existente de SearXNG al que tengas acceso. Consulta la
    [documentación de SearXNG](https://docs.searxng.org/) para la configuración de producción.

  </Step>
  <Step title="Configure">
    ```bash
    openclaw configure --section web
    # Select "searxng" as the provider
    ```

    O define la variable de entorno y deja que la detección automática la encuentre:

    ```bash
    export SEARXNG_BASE_URL="http://localhost:8888"
    ```

  </Step>
</Steps>

## Configuración

```json5
{
  tools: {
    web: {
      search: {
        provider: "searxng",
      },
    },
  },
}
```

Ajustes de nivel de Plugin para la instancia de SearXNG:

```json5
{
  plugins: {
    entries: {
      searxng: {
        config: {
          webSearch: {
            baseUrl: "http://localhost:8888",
            categories: "general,news", // optional
            language: "en", // optional
          },
        },
      },
    },
  },
}
```

`baseUrl` también acepta un objeto SecretRef (por ejemplo `{ source: "env", id: "SEARXNG_BASE_URL" }`).

## Variable de entorno

Define `SEARXNG_BASE_URL` como alternativa a la configuración:

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

Orden de resolución: cadena `baseUrl` configurada, luego una SecretRef de entorno en línea en
`baseUrl`, luego `SEARXNG_BASE_URL`. Cuando no se establece ninguna de las rutas de configuración y
`SEARXNG_BASE_URL` está presente sin un proveedor explícito elegido, la detección automática
elige SearXNG.

## Referencia de configuración del Plugin

| Campo        | Descripción                                                        |
| ------------ | ------------------------------------------------------------------ |
| `baseUrl`    | URL base de tu instancia de SearXNG (obligatorio)                  |
| `categories` | Categorías separadas por comas, como `general`, `news` o `science` |
| `language`   | Código de idioma para resultados, como `en`, `de` o `fr`           |

La llamada a la herramienta `web_search` también acepta `count` (1-10 resultados), `categories`
y `language` como sobrescrituras por llamada.

## Notas

- **API JSON** -- usa el endpoint nativo `format=json` de SearXNG, no extracción de HTML
- **URL de resultados de imágenes** -- los resultados de categorías de imagen incluyen `img_src` cuando SearXNG
  devuelve una URL directa de imagen
- **Sin clave de API** -- funciona con cualquier instancia de SearXNG de inmediato
- **Validación de URL base** -- `baseUrl` debe ser una URL `http://` o `https://`
  válida
- **Protección de red** -- las URL base `http://` deben apuntar a un host privado de confianza o de
  loopback (los hosts públicos deben usar `https://`); las URL base `https://` que
  se resuelven a una dirección privada/interna reciben la misma concesión autoalojada,
  mientras que las URL base `https://` que se resuelven públicamente mantienen protección SSRF estricta
- **Orden de detección automática** -- SearXNG requiere un `baseUrl` configurado (orden
  200 entre proveedores que ya tienen su credencial requerida). Los proveedores sin claves,
  como DuckDuckGo u Ollama Web Search, nunca ganan la detección automática
  implícitamente; solo se activan con una elección explícita de `provider`
- **Autoalojado** -- tú controlas la instancia, las consultas y los motores de búsqueda ascendentes
- **Categorías** usa `general` de forma predeterminada cuando no se configura
- **Reserva de categoría** -- si una solicitud de categoría distinta de `general` se realiza correctamente pero
  devuelve cero resultados, OpenClaw reintenta la misma consulta una vez con `general`
  antes de devolver un conjunto de resultados vacío
- **Almacenamiento en caché de resultados** -- las consultas idénticas (misma consulta, conteo, categorías,
  idioma y URL base) se almacenan en caché dentro del proceso durante un TTL breve
- **Requisito de versión** -- el Plugin declara `minHostVersion: >=2026.6.9`

<Tip>
  Para que la API JSON de SearXNG funcione, asegúrate de que tu instancia de SearXNG tenga el formato `json`
  habilitado en su `settings.yml`, bajo `search.formats`.
</Tip>

## Relacionado

- [Resumen de Web Search](/es/tools/web) -- todos los proveedores y la detección automática
- [Búsqueda de DuckDuckGo](/es/tools/duckduckgo-search) -- otro proveedor sin claves
- [Brave Search](/es/tools/brave-search) -- resultados estructurados con nivel gratuito
