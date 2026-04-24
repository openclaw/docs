---
read_when:
    - Quieres usar MiniMax para `web_search`
    - Necesitas una clave del plan Coding de MiniMax
    - Quieres orientación sobre hosts de búsqueda MiniMax CN/global
summary: MiniMax Search mediante la API de búsqueda del plan Coding
title: Búsqueda de MiniMax
x-i18n:
    generated_at: "2026-04-24T05:55:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 20a91bfae72661efd5e0bc3b6247ab05c3487db40ecd9cd5a874858bf3c69df3
    source_path: tools/minimax-search.md
    workflow: 15
---

OpenClaw admite MiniMax como proveedor de `web_search` a través de la API de búsqueda del plan Coding de MiniMax. Devuelve resultados de búsqueda estructurados con títulos, URL, fragmentos y consultas relacionadas.

## Obtener una clave del plan Coding

<Steps>
  <Step title="Crea una clave">
    Crea o copia una clave del plan Coding de MiniMax desde
    [MiniMax Platform](https://platform.minimax.io/user-center/basic-information/interface-key).
  </Step>
  <Step title="Guarda la clave">
    Establece `MINIMAX_CODE_PLAN_KEY` en el entorno del Gateway o configura mediante:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClaw también acepta `MINIMAX_CODING_API_KEY` como alias de entorno. `MINIMAX_API_KEY`
sigue leyéndose como reserva de compatibilidad cuando ya apunta a un token del plan Coding.

## Configuración

```json5
{
  plugins: {
    entries: {
      minimax: {
        config: {
          webSearch: {
            apiKey: "sk-cp-...", // optional if MINIMAX_CODE_PLAN_KEY is set
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

**Alternativa por entorno:** establece `MINIMAX_CODE_PLAN_KEY` en el entorno del Gateway.
Para una instalación de gateway, colócalo en `~/.openclaw/.env`.

## Selección de región

MiniMax Search usa estos endpoints:

- Global: `https://api.minimax.io/v1/coding_plan/search`
- CN: `https://api.minimaxi.com/v1/coding_plan/search`

Si `plugins.entries.minimax.config.webSearch.region` no está configurado, OpenClaw resuelve
la región en este orden:

1. `tools.web.search.minimax.region` / `webSearch.region` propiedad del Plugin
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

Eso significa que la incorporación CN o `MINIMAX_API_HOST=https://api.minimaxi.com/...`
mantienen automáticamente MiniMax Search también en el host CN.

Incluso cuando autenticaste MiniMax mediante la ruta OAuth `minimax-portal`,
la búsqueda web sigue registrándose con el id de proveedor `minimax`; la base URL del proveedor OAuth
solo se usa como pista de región para la selección de host CN/global.

## Parámetros compatibles

MiniMax Search admite:

- `query`
- `count` (OpenClaw recorta la lista de resultados devueltos al recuento solicitado)

Actualmente no se admiten filtros específicos del proveedor.

## Relacionado

- [Resumen de Web Search](/es/tools/web) -- todos los proveedores y detección automática
- [MiniMax](/es/providers/minimax) -- configuración de modelo, imagen, voz y autenticación
