---
read_when:
    - Quieres un proveedor de búsqueda web autoalojado
    - Quieres usar SearXNG para web_search
    - Necesitas una opción de búsqueda centrada en la privacidad o aislada de la red
summary: Búsqueda web de SearXNG -- proveedor de metabúsqueda autohospedado y sin clave
title: Búsqueda de SearXNG
x-i18n:
    generated_at: "2026-05-02T21:06:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: b9be62f7398379e1672ea7e934a571a529cac07dc5d880ac74e51f8445594034
    source_path: tools/searxng-search.md
    workflow: 16
---

OpenClaw admite [SearXNG](https://docs.searxng.org/) como proveedor de `web_search` **autoalojado y
sin clave**. SearXNG es un motor de metabúsqueda de código abierto
que agrega resultados de Google, Bing, DuckDuckGo y otras fuentes.

Ventajas:

- **Gratis e ilimitado** -- no se requiere clave de API ni suscripción comercial
- **Privacidad / aislamiento de red** -- las consultas nunca salen de tu red
- **Funciona en cualquier lugar** -- sin restricciones regionales en las API comerciales de búsqueda

## Configuración

<Steps>
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

Configuración de nivel de Plugin para la instancia de SearXNG:

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
- `http://` solo se acepta para hosts de red privada de confianza o de loopback
- los hosts SearXNG públicos deben usar `https://`
- los hosts privados/internos usan la protección de red autoalojada; los hosts públicos
  `https://` permanecen en la protección estricta de búsqueda web y no pueden redirigir a
  direcciones privadas

## Variable de entorno

Define `SEARXNG_BASE_URL` como alternativa a la configuración:

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

Cuando `SEARXNG_BASE_URL` está definida y no hay ningún proveedor explícito configurado, la detección automática
elige SearXNG automáticamente (con la prioridad más baja -- cualquier proveedor respaldado por API con una
clave gana primero).

## Referencia de configuración del Plugin

| Campo        | Descripción                                                        |
| ------------ | ------------------------------------------------------------------ |
| `baseUrl`    | URL base de tu instancia de SearXNG (obligatorio)                  |
| `categories` | Categorías separadas por comas como `general`, `news` o `science`  |
| `language`   | Código de idioma para resultados como `en`, `de` o `fr`            |

## Notas

- **API JSON** -- usa el endpoint nativo `format=json` de SearXNG, no extracción de HTML
- **URL de resultados de imagen** -- los resultados de categoría de imagen incluyen `img_src` cuando SearXNG
  devuelve una URL directa de imagen
- **Sin clave de API** -- funciona con cualquier instancia de SearXNG desde el principio
- **Validación de URL base** -- `baseUrl` debe ser una URL `http://` o `https://`
  válida; los hosts públicos deben usar `https://`
- **Protección de red** -- los endpoints SearXNG privados/internos optan por el
  acceso a red privada; los endpoints SearXNG públicos `https://` mantienen una protección
  SSRF estricta
- **Orden de detección automática** -- SearXNG se comprueba al final (orden 200) en la
  detección automática. Los proveedores respaldados por API con claves configuradas se ejecutan primero, luego
  DuckDuckGo (orden 100) y luego Ollama Web Search (orden 110)
- **Autoalojado** -- tú controlas la instancia, las consultas y los motores de búsqueda ascendentes
- **Categorías** usa `general` de forma predeterminada cuando no está configurado
- **Reserva de categoría** -- si una solicitud de categoría que no es `general` se completa correctamente pero
  devuelve cero resultados, OpenClaw reintenta la misma consulta una vez con `general`
  antes de devolver un conjunto de resultados vacío

<Tip>
  Para que la API JSON de SearXNG funcione, asegúrate de que tu instancia de SearXNG tenga el formato `json`
  habilitado en su `settings.yml`, bajo `search.formats`.
</Tip>

## Relacionado

- [Descripción general de búsqueda web](/es/tools/web) -- todos los proveedores y la detección automática
- [Búsqueda de DuckDuckGo](/es/tools/duckduckgo-search) -- otra alternativa sin clave
- [Búsqueda de Brave](/es/tools/brave-search) -- resultados estructurados con nivel gratuito
