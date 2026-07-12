---
read_when:
    - Quieres un proveedor de búsqueda web autoalojado
    - Quieres usar SearXNG para web_search
    - Necesitas una opción de búsqueda centrada en la privacidad o aislada físicamente de la red.
summary: 'Búsqueda web con SearXNG: proveedor de metabúsqueda autoalojado y sin claves'
title: Búsqueda de SearXNG
x-i18n:
    generated_at: "2026-07-11T23:39:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cae8de9f8e2c8dd9cec615adb48da5c1fd7654bffe96c7afc1acea3effbcf1fc
    source_path: tools/searxng-search.md
    workflow: 16
---

OpenClaw admite [SearXNG](https://docs.searxng.org/) como proveedor de `web_search` **autoalojado y
sin clave**. SearXNG es un metabuscador de código abierto
que agrega resultados de Google, Bing, DuckDuckGo y otras fuentes.

Ventajas:

- **Gratuito e ilimitado** -- no requiere clave de API ni suscripción comercial
- **Privacidad / aislamiento de red** -- las consultas nunca salen de su red
- **Funciona en cualquier lugar** -- sin restricciones regionales de las API de búsqueda comerciales

## Configuración

<Steps>
  <Step title="Instalar el Plugin">
    ```bash
    openclaw plugins install @openclaw/searxng-plugin
    ```
  </Step>
  <Step title="Ejecutar una instancia de SearXNG">
    ```bash
    docker run -d -p 8888:8080 searxng/searxng
    ```

    También puede usar cualquier despliegue existente de SearXNG al que tenga acceso. Consulte la
    [documentación de SearXNG](https://docs.searxng.org/) para configurarlo en producción.

  </Step>
  <Step title="Configurar">
    ```bash
    openclaw configure --section web
    # Seleccione "searxng" como proveedor
    ```

    También puede definir la variable de entorno y dejar que la detección automática la encuentre:

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

Configuración de la instancia de SearXNG en el nivel del Plugin:

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

`baseUrl` también acepta un objeto SecretRef (por ejemplo, `{ source: "env", id: "SEARXNG_BASE_URL" }`).

## Variable de entorno

Defina `SEARXNG_BASE_URL` como alternativa a la configuración:

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

Orden de resolución: la cadena `baseUrl` configurada, después una SecretRef de entorno insertada en
`baseUrl` y, por último, `SEARXNG_BASE_URL`. Cuando no se ha definido ninguna de las rutas de configuración,
`SEARXNG_BASE_URL` está presente y no se ha elegido un proveedor explícito, la detección automática
selecciona SearXNG.

## Referencia de configuración del Plugin

| Campo        | Descripción                                                               |
| ------------ | ------------------------------------------------------------------------- |
| `baseUrl`    | URL base de su instancia de SearXNG (obligatoria)                         |
| `categories` | Categorías separadas por comas, como `general`, `news` o `science`        |
| `language`   | Código de idioma de los resultados, como `en`, `de` o `fr`                |

La llamada a la herramienta `web_search` también acepta `count` (entre 1 y 10 resultados), `categories`
y `language` como valores de sustitución para cada llamada.

## Notas

- **API JSON** -- usa el endpoint nativo `format=json` de SearXNG, no la extracción de HTML
- **URL de resultados de imágenes** -- los resultados de la categoría de imágenes incluyen `img_src` cuando SearXNG
  devuelve una URL directa de la imagen
- **Sin clave de API** -- funciona de inmediato con cualquier instancia de SearXNG
- **Validación de la URL base** -- `baseUrl` debe ser una URL `http://` o `https://`
  válida
- **Protección de red** -- las URL base `http://` deben apuntar a un host privado de confianza o de
  local loopback (los hosts públicos deben usar `https://`); las URL base `https://` que
  se resuelven a una dirección privada o interna reciben la misma autorización para servicios autoalojados,
  mientras que las URL base `https://` que se resuelven públicamente mantienen una protección estricta contra SSRF
- **Orden de detección automática** -- SearXNG requiere una `baseUrl` configurada (orden
  200 entre los proveedores que ya tienen las credenciales requeridas). Los proveedores sin clave,
  como DuckDuckGo u Ollama Web Search, nunca prevalecen de forma implícita en la detección automática;
  solo se activan mediante una elección explícita de `provider`
- **Autoalojado** -- usted controla la instancia, las consultas y los motores de búsqueda de origen
- **Categorías** usa `general` de forma predeterminada cuando no se configura
- **Alternativa de categoría** -- si una solicitud de una categoría distinta de `general` se completa correctamente, pero
  no devuelve resultados, OpenClaw vuelve a intentar la misma consulta una vez con `general`
  antes de devolver un conjunto de resultados vacío
- **Almacenamiento en caché de resultados** -- las consultas idénticas (misma consulta, cantidad, categorías,
  idioma y URL base) se almacenan en caché dentro del proceso durante un TTL breve
- **Requisito de versión** -- el Plugin declara `minHostVersion: >=2026.6.9`

<Tip>
  Para que la API JSON de SearXNG funcione, asegúrese de que su instancia de SearXNG tenga habilitado el formato `json`
  en su archivo `settings.yml`, dentro de `search.formats`.
</Tip>

## Contenido relacionado

- [Descripción general de la búsqueda web](/es/tools/web) -- todos los proveedores y la detección automática
- [Búsqueda con DuckDuckGo](/es/tools/duckduckgo-search) -- otro proveedor sin clave
- [Búsqueda con Brave](/es/tools/brave-search) -- resultados estructurados con nivel gratuito
