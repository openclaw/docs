---
read_when:
    - Quieres usar MiniMax para web_search
    - Necesita una clave de MiniMax Token Plan o un token OAuth
    - Quieres orientación sobre el servidor de búsqueda de MiniMax CN/global
summary: Búsqueda de MiniMax mediante la API de búsqueda de Token Plan
title: Búsqueda de MiniMax
x-i18n:
    generated_at: "2026-05-02T05:37:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5bb84f38c1407c203b76eea2d7a3ab5fefbdab0844dc20899742581945d7d77e
    source_path: tools/minimax-search.md
    workflow: 16
---

OpenClaw admite MiniMax como proveedor de `web_search` mediante la API de búsqueda Token Plan de MiniMax. Devuelve resultados de búsqueda estructurados con títulos, URL, fragmentos y consultas relacionadas.

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
credencial de Token Plan con búsqueda habilitada; es posible que las claves ordinarias de la API de modelos de MiniMax no sean aceptadas por el endpoint de búsqueda de Token Plan.

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

1. `tools.web.search.minimax.region` / `webSearch.region` propio del Plugin
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

Esto significa que el onboarding de CN o `MINIMAX_API_HOST=https://api.minimaxi.com/...`
también mantiene automáticamente MiniMax Search en el host de CN.

Aunque hayas autenticado MiniMax mediante la ruta OAuth `minimax-portal`,
la búsqueda web se registra igualmente con el id de proveedor `minimax`; la URL base
del proveedor OAuth se usa como indicio de región para seleccionar el host CN/global, y `MINIMAX_OAUTH_TOKEN`
puede satisfacer la credencial bearer de MiniMax Search.

## Parámetros admitidos

MiniMax Search admite:

- `query`
- `count` (OpenClaw recorta la lista de resultados devuelta al recuento solicitado)

Actualmente no se admiten filtros específicos del proveedor.

## Relacionado

- [Descripción general de Web Search](/es/tools/web) -- todos los proveedores y detección automática
- [MiniMax](/es/providers/minimax) -- configuración de modelos, imágenes, voz y autenticación
