---
read_when:
    - Quieres un proveedor de búsqueda web autoalojado
    - Quieres usar SearXNG para web_search
    - Necesitas una opción de búsqueda centrada en la privacidad o aislada de la red
summary: 'Búsqueda web SearXNG: proveedor de metabúsqueda autoalojado y sin claves'
title: Búsqueda de SearXNG
x-i18n:
    generated_at: "2026-06-27T13:08:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4bd00a20e45f71b7bd855a6588d5c829a0202839fc93ddcec1e255b7858ff183
    source_path: tools/searxng-search.md
    workflow: 16
---

OpenClaw admite [SearXNG](https://docs.searxng.org/) como proveedor `web_search` **autoalojado
y sin clave**. SearXNG es un motor de metabúsqueda de código abierto
que agrega resultados de Google, Bing, DuckDuckGo y otras fuentes.

Ventajas:

- **Gratis e ilimitado** -- no requiere clave de API ni suscripción comercial
- **Privacidad / aislamiento de red** -- las consultas nunca salen de tu red
- **Funciona en cualquier lugar** -- sin restricciones regionales de las API de búsqueda comerciales

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

Configuración a nivel de Plugin para la instancia de SearXNG:

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

El campo `baseUrl` también acepta objetos SecretRef.

Reglas de transporte:

- `https://` funciona para hosts SearXNG públicos o privados
- `http://` solo se acepta para hosts de red privada de confianza o loopback
- los hosts SearXNG públicos deben usar `https://`
- los hosts privados/internos usan la protección de red autoalojada; los hosts
  públicos `https://` permanecen en la protección estricta de búsqueda web y no pueden redirigir a
  direcciones privadas

## Variable de entorno

Define `SEARXNG_BASE_URL` como alternativa a la configuración:

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

Cuando `SEARXNG_BASE_URL` está definida y no hay ningún proveedor explícito configurado, la detección automática
elige SearXNG automáticamente (con la prioridad más baja -- cualquier proveedor respaldado por API con una
clave tiene preferencia).

## Referencia de configuración del Plugin

| Campo        | Descripción                                                        |
| ------------ | ------------------------------------------------------------------ |
| `baseUrl`    | URL base de tu instancia de SearXNG (obligatorio)                  |
| `categories` | Categorías separadas por comas, como `general`, `news` o `science` |
| `language`   | Código de idioma para resultados, como `en`, `de` o `fr`           |

## Notas

- **API JSON** -- usa el endpoint nativo `format=json` de SearXNG, no extracción de HTML
- **URL de resultados de imagen** -- los resultados de categoría de imagen incluyen `img_src` cuando SearXNG
  devuelve una URL de imagen directa
- **Sin clave de API** -- funciona con cualquier instancia de SearXNG sin configuración adicional
- **Validación de URL base** -- `baseUrl` debe ser una URL `http://` o `https://`
  válida; los hosts públicos deben usar `https://`
- **Protección de red** -- los endpoints SearXNG privados/internos optan por
  el acceso a la red privada; los endpoints SearXNG públicos `https://` mantienen una protección SSRF
  estricta
- **Orden de detección automática** -- SearXNG se comprueba después de los proveedores respaldados por API
  con claves configuradas (orden 200). Los proveedores sin clave como DuckDuckGo u
  Ollama Web Search no se seleccionan automáticamente sin una elección explícita de proveedor
- **Autoalojado** -- tú controlas la instancia, las consultas y los motores de búsqueda ascendentes
- **Categorías** usa `general` de forma predeterminada cuando no está configurado
- **Reserva de categoría** -- si una solicitud de categoría distinta de `general` se completa correctamente pero
  devuelve cero resultados, OpenClaw reintenta la misma consulta una vez con `general`
  antes de devolver un conjunto de resultados vacío

<Tip>
  Para que la API JSON de SearXNG funcione, asegúrate de que tu instancia de SearXNG tenga el formato `json`
  habilitado en su `settings.yml`, bajo `search.formats`.
</Tip>

## Relacionado

- [Descripción general de búsqueda web](/es/tools/web) -- todos los proveedores y la detección automática
- [Búsqueda de DuckDuckGo](/es/tools/duckduckgo-search) -- otro proveedor sin clave
- [Brave Search](/es/tools/brave-search) -- resultados estructurados con nivel gratuito
