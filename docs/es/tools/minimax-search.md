---
read_when:
    - Quieres usar MiniMax para web_search
    - Necesitas una clave de MiniMax Token Plan o un token OAuth
    - Quieres orientación sobre el host de búsqueda CN/global de MiniMax
summary: MiniMax Search mediante la API de búsqueda Token Plan
title: Búsqueda de MiniMax
x-i18n:
    generated_at: "2026-07-05T11:48:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e96d1a5fe20847c5fd4476fa6aab8366910b81833c1e42e125d231c4ab003e15
    source_path: tools/minimax-search.md
    workflow: 16
---

OpenClaw admite MiniMax como proveedor de `web_search` mediante la API de búsqueda MiniMax
Token Plan. Devuelve resultados de búsqueda estructurados con títulos, URL,
fragmentos y consultas relacionadas.

## Obtener una credencial de Token Plan

<Steps>
  <Step title="Crear una clave">
    Crea o copia una clave de MiniMax Token Plan desde
    [MiniMax Platform](https://platform.minimax.io/user-center/basic-information/interface-key).
    Las configuraciones de OAuth pueden reutilizar `MINIMAX_OAUTH_TOKEN` en su lugar.
  </Step>
  <Step title="Almacenar la clave">
    Define `MINIMAX_CODE_PLAN_KEY` en el entorno del Gateway, o configúralo mediante:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClaw también acepta `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN` y
`MINIMAX_API_KEY` como alias de entorno, comprobados en ese orden después de
`MINIMAX_CODE_PLAN_KEY`. `MINIMAX_API_KEY` debe apuntar a una credencial de
Token Plan con búsqueda habilitada; las claves de API de modelos ordinarias de MiniMax pueden no ser aceptadas por
el endpoint de búsqueda de Token Plan.

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

Eso significa que la incorporación de CN o `MINIMAX_API_HOST=https://api.minimaxi.com/...`
también mantiene automáticamente MiniMax Search en el host de CN.

Incluso cuando autenticó MiniMax mediante la ruta OAuth `minimax-portal`,
la búsqueda web sigue registrándose con el id de proveedor `minimax`; la URL base del proveedor OAuth
se usa como indicio de región para la selección de host CN/global, y `MINIMAX_OAUTH_TOKEN`
puede satisfacer la credencial bearer de MiniMax Search.

## Parámetros admitidos

| Parámetro | Tipo    | Restricciones   | Descripción                                                                 |
| --------- | ------- | --------------- | --------------------------------------------------------------------------- |
| `query`   | string  | obligatorio     | Cadena de consulta de búsqueda.                                             |
| `count`   | integer | 1-10, predeterminado 5 | Número de resultados que se devolverán. OpenClaw recorta la lista devuelta a este tamaño. |

Actualmente no se admiten filtros específicos del proveedor.

## Relacionado

- [Descripción general de Web Search](/es/tools/web) -- todos los proveedores y detección automática
- [MiniMax](/es/providers/minimax) -- configuración de modelo, imagen, voz y autenticación
