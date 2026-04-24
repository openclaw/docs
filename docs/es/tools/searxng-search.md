---
read_when:
    - Quieres un proveedor de búsqueda web autoalojado
    - Quieres usar SearXNG para `web_search`
    - Necesitas una opción de búsqueda centrada en la privacidad o aislada de la red externa
summary: 'SearXNG web search: proveedor meta-buscador autoalojado y sin clave'
title: Búsqueda SearXNG
x-i18n:
    generated_at: "2026-04-24T05:55:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: a07198ef7a6f363b9e5e78e57e6e31f193f8f10882945208191c8baea5fe67d6
    source_path: tools/searxng-search.md
    workflow: 15
---

OpenClaw admite [SearXNG](https://docs.searxng.org/) como proveedor de `web_search` **autoalojado y sin clave**. SearXNG es un motor de metabúsqueda de código abierto
que agrega resultados de Google, Bing, DuckDuckGo y otras fuentes.

Ventajas:

- **Gratis e ilimitado** -- no requiere clave API ni suscripción comercial
- **Privacidad / aislamiento** -- las consultas nunca salen de tu red
- **Funciona en cualquier lugar** -- sin restricciones regionales de APIs de búsqueda comerciales

## Configuración

<Steps>
  <Step title="Ejecutar una instancia de SearXNG">
    ```bash
    docker run -d -p 8888:8080 searxng/searxng
    ```

    O usa cualquier implementación existente de SearXNG a la que tengas acceso. Consulta la
    [documentación de SearXNG](https://docs.searxng.org/) para la configuración en producción.

  </Step>
  <Step title="Configurar">
    ```bash
    openclaw configure --section web
    # Selecciona "searxng" como proveedor
    ```

    O establece la variable de entorno y deja que la autodetección la encuentre:

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

Configuración a nivel de plugin para la instancia de SearXNG:

```json5
{
  plugins: {
    entries: {
      searxng: {
        config: {
          webSearch: {
            baseUrl: "http://localhost:8888",
            categories: "general,news", // opcional
            language: "en", // opcional
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

## Variable de entorno

Establece `SEARXNG_BASE_URL` como alternativa a la configuración:

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

Cuando `SEARXNG_BASE_URL` está configurada y no hay un proveedor explícito configurado, la autodetección
elige SearXNG automáticamente (con la prioridad más baja -- cualquier proveedor respaldado por API con una
clave configurada gana primero).

## Referencia de configuración del plugin

| Field        | Description                                                        |
| ------------ | ------------------------------------------------------------------ |
| `baseUrl`    | Base URL of your SearXNG instance (required)                       |
| `categories` | Comma-separated categories such as `general`, `news`, or `science` |
| `language`   | Language code for results such as `en`, `de`, or `fr`              |

## Notas

- **API JSON** -- usa el endpoint nativo `format=json` de SearXNG, no scraping HTML
- **Sin clave API** -- funciona con cualquier instancia de SearXNG desde el primer momento
- **Validación de URL base** -- `baseUrl` debe ser una URL válida `http://` o `https://`;
  los hosts públicos deben usar `https://`
- **Orden de autodetección** -- SearXNG se comprueba al final (orden 200) en la
  autodetección. Los proveedores respaldados por API con claves configuradas se ejecutan primero, luego
  DuckDuckGo (orden 100), luego Ollama Web Search (orden 110)
- **Autoalojado** -- tú controlas la instancia, las consultas y los motores de búsqueda upstream
- **Categories** usa por defecto `general` cuando no está configurado

<Tip>
  Para que la API JSON de SearXNG funcione, asegúrate de que tu instancia de SearXNG tenga habilitado el formato `json`
  en su `settings.yml` dentro de `search.formats`.
</Tip>

## Relacionado

- [Resumen de Web Search](/es/tools/web) -- todos los proveedores y autodetección
- [Búsqueda DuckDuckGo](/es/tools/duckduckgo-search) -- otro fallback sin clave
- [Brave Search](/es/tools/brave-search) -- resultados estructurados con nivel gratuito
