---
read_when:
    - Quieres usar MiniMax para web_search
    - Necesitas una clave de MiniMax Token Plan o un token OAuth
    - Quieres orientación sobre el host de búsqueda CN/global de MiniMax
summary: MiniMax Search mediante la API de búsqueda de Token Plan
title: Búsqueda de MiniMax
x-i18n:
    generated_at: "2026-05-11T20:57:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: d0a2dfe4261ab4bc5d234cedf9dff41fbbfbbad8914c6c9c43bc76e8694d99d4
    source_path: tools/minimax-search.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw admite MiniMax como proveedor de `web_search` mediante la API de búsqueda de MiniMax
Token Plan. Devuelve resultados de búsqueda estructurados con títulos, URL,
fragmentos y consultas relacionadas.

## Obtener una credencial de Token Plan

<Steps>
  <Step title="Crear una clave">
    Crea o copia una clave de MiniMax Token Plan desde
    [MiniMax Platform](https://platform.minimax.io/user-center/basic-information/interface-key).
    Las configuraciones de OAuth pueden reutilizar `MINIMAX_OAUTH_TOKEN` en su lugar.
  </Step>
  <Step title="Guardar la clave">
    Define `MINIMAX_CODE_PLAN_KEY` en el entorno del Gateway, o configúralo mediante:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClaw también acepta `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN` y
`MINIMAX_API_KEY` como alias de entorno. `MINIMAX_API_KEY` debe apuntar a una
credencial de Token Plan con búsqueda habilitada; las claves ordinarias de la API de modelos de MiniMax podrían no
ser aceptadas por el endpoint de búsqueda de Token Plan.

## Configuración

```json5
{
  plugins: {
    entries: {
      minimax: {
        config: {
          webSearch: {
            apiKey: "sk-cp-...", // optional if a MiniMax Token Plan env var is set
            region: "global", // or "cn"
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "minimax",
      },
    },
  },
}
```

**Alternativa de entorno:** define `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`,
`MINIMAX_OAUTH_TOKEN` o `MINIMAX_API_KEY` en el entorno del Gateway.
Para una instalación de gateway, colócalo en `~/.openclaw/.env`.

## Selección de región

MiniMax Search usa estos endpoints:

- Global: `https://api.minimax.io/v1/coding_plan/search`
- CN: `https://api.minimaxi.com/v1/coding_plan/search`

Si `plugins.entries.minimax.config.webSearch.region` no está definido, OpenClaw resuelve
la región en este orden:

1. `tools.web.search.minimax.region` / `webSearch.region` propiedad del plugin
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

Eso significa que el onboarding de CN o `MINIMAX_API_HOST=https://api.minimaxi.com/...`
también mantiene automáticamente MiniMax Search en el host de CN.

Incluso cuando hayas autenticado MiniMax mediante la ruta de OAuth `minimax-portal`,
la búsqueda web se sigue registrando con el id de proveedor `minimax`; la URL base del proveedor de OAuth
se usa como indicio de región para la selección de host CN/global, y `MINIMAX_OAUTH_TOKEN`
puede satisfacer la credencial bearer de MiniMax Search.

## Parámetros compatibles

| Parámetro | Tipo    | Restricciones | Descripción                                                                 |
| --------- | ------- | ----------- | --------------------------------------------------------------------------- |
| `query`   | string  | required    | Cadena de consulta de búsqueda.                                             |
| `count`   | integer | 1-10        | Número de resultados que devolver. OpenClaw recorta la lista devuelta a este tamaño. |

Los filtros específicos del proveedor no son compatibles actualmente.

## Relacionado

- [Información general de Web Search](/es/tools/web) -- todos los proveedores y la detección automática
- [MiniMax](/es/providers/minimax) -- configuración de modelo, imagen, voz y autenticación
