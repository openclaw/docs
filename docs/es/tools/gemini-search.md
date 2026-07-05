---
read_when:
    - Quieres usar Gemini para web_search
    - Necesitas `GEMINI_API_KEY` o `models.providers.google.apiKey`
    - Quieres fundamentación con Google Search
summary: Búsqueda web de Gemini con fundamentación de Google Search
title: Búsqueda de Gemini
x-i18n:
    generated_at: "2026-07-05T11:48:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4c7cb55fb185adfda01ab6b3c6434ab6e3ee31162733c752d4c81328bce9a6cd
    source_path: tools/gemini-search.md
    workflow: 16
---

OpenClaw admite modelos Gemini con
[fundamentación de Google Search](https://ai.google.dev/gemini-api/docs/grounding)
integrada, que devuelve respuestas sintetizadas por IA respaldadas por resultados
en vivo de Google Search con citas.

## Obtener una clave de API

<Steps>
  <Step title="Crear una clave">
    Ve a [Google AI Studio](https://aistudio.google.com/apikey) y crea una
    clave de API.
  </Step>
  <Step title="Guardar la clave">
    Define `GEMINI_API_KEY` en el entorno del Gateway, reutiliza
    `models.providers.google.apiKey` o configura una clave dedicada para búsqueda web mediante:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## Configuración

```json5
{
  plugins: {
    entries: {
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // optional if GEMINI_API_KEY or models.providers.google.apiKey is set
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // optional; falls back to models.providers.google.baseUrl
            model: "gemini-2.5-flash", // default
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "gemini",
      },
    },
  },
}
```

**Precedencia de credenciales:** la búsqueda web de Gemini usa primero
`plugins.entries.google.config.webSearch.apiKey`, luego `GEMINI_API_KEY` y
después `models.providers.google.apiKey`. Para las URL base, la opción dedicada
`plugins.entries.google.config.webSearch.baseUrl` tiene prioridad sobre
`models.providers.google.baseUrl`.

Para una instalación de gateway, coloca las claves de entorno en `~/.openclaw/.env`.

## Cómo funciona

A diferencia de los proveedores de búsqueda tradicionales que devuelven una lista de enlaces y fragmentos,
Gemini usa la fundamentación de Google Search para producir respuestas sintetizadas por IA con
citas en línea. Los resultados incluyen tanto la respuesta sintetizada como las URL
de origen.

- Las URL de citas de la fundamentación de Gemini se resuelven automáticamente desde URL de redirección de Google
  a URL directas mediante una solicitud HEAD a través de la ruta de fetch de OpenClaw protegida contra SSRF
  (seguimiento de redirecciones, validación http/https).
- La resolución de redirecciones usa valores predeterminados estrictos contra SSRF, por lo que se bloquean las redirecciones a
  destinos privados/internos.

## Parámetros admitidos

La búsqueda de Gemini admite `query`, `freshness`, `date_after` y `date_before`.

`count` se acepta por compatibilidad con el `web_search` compartido, pero la fundamentación de Gemini
aun así devuelve una respuesta sintetizada con citas en lugar de una lista de
N resultados.

`freshness` acepta `day`, `week`, `month`, `year` y los atajos compartidos
`pd`, `pw`, `pm` y `py`. `day`/`pd` añade una instrucción de actualidad a la consulta de Gemini
en lugar de un intervalo rígido de 24 horas. `week`, `month`, `year` y los intervalos explícitos
`date_after`/`date_before` establecen el
`timeRangeFilter` de la fundamentación de Google Search de Gemini. `country`, `language` y `domain_filter` no son compatibles.

## Selección de modelo

El modelo predeterminado es `gemini-2.5-flash` (rápido y rentable). Se puede usar cualquier modelo
Gemini que admita fundamentación mediante
`plugins.entries.google.config.webSearch.model`.

## Sobrescrituras de URL base

Define `plugins.entries.google.config.webSearch.baseUrl` cuando la búsqueda web de Gemini
deba enrutarse a través de un proxy del operador o un endpoint personalizado compatible con Gemini. Si
no se define, la búsqueda web de Gemini reutiliza `models.providers.google.baseUrl`. Un valor simple
`https://generativelanguage.googleapis.com` se normaliza a
`https://generativelanguage.googleapis.com/v1beta`; las rutas de proxy personalizadas se conservan
tal como se proporcionan después de recortar las barras finales.

## Relacionado

- [Resumen de búsqueda web](/es/tools/web) -- todos los proveedores y detección automática
- [Brave Search](/es/tools/brave-search) -- resultados estructurados con fragmentos
- [Perplexity Search](/es/tools/perplexity-search) -- resultados estructurados + extracción de contenido
