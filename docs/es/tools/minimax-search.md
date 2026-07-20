---
read_when:
    - Quieres usar MiniMax para web_search
    - Necesitas una clave del plan de tokens de MiniMax o un token de OAuth
    - Se necesita orientación sobre el host de búsqueda de MiniMax para China/global
summary: Búsqueda de MiniMax mediante la API de búsqueda del Token Plan
title: Búsqueda de MiniMax
x-i18n:
    generated_at: "2026-07-20T00:54:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: cb851614bbe43f011e07fe3e80d5390f1ba515f3e00ba749c91999617ad2d1e2
    source_path: tools/minimax-search.md
    workflow: 16
---

OpenClaw admite MiniMax como proveedor de `web_search` mediante la API de búsqueda de
Token Plan de MiniMax. Devuelve resultados de búsqueda estructurados con títulos, URL,
fragmentos y consultas relacionadas.

## Obtener una credencial de Token Plan

<Steps>
  <Step title="Crear una clave">
    Cree o copie una clave de Token Plan de MiniMax desde
    [la plataforma de MiniMax](https://platform.minimax.io/user-center/basic-information/interface-key).
    Las configuraciones de OAuth pueden reutilizar `MINIMAX_OAUTH_TOKEN` en su lugar.
  </Step>
  <Step title="Almacenar la clave">
    Establezca `MINIMAX_CODE_PLAN_KEY` en el entorno del Gateway o configúrela mediante:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClaw también acepta `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN` y
`MINIMAX_API_KEY` como alias de variables de entorno, que se comprueban en ese orden después de
`MINIMAX_CODE_PLAN_KEY`. `MINIMAX_API_KEY` debe apuntar a una credencial de
Token Plan con la búsqueda habilitada; es posible que las claves de API de modelos MiniMax convencionales no sean aceptadas por
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

**Alternativa mediante variables de entorno:** establezca `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`,
`MINIMAX_OAUTH_TOKEN` o `MINIMAX_API_KEY` en el entorno del Gateway.
Para una instalación del Gateway, inclúyala en `~/.openclaw/.env`.

## Selección de región

La búsqueda de MiniMax utiliza estos endpoints:

- Global: `https://api.minimax.io/v1/coding_plan/search`
- China: `https://api.minimaxi.com/v1/coding_plan/search`

Si `plugins.entries.minimax.config.webSearch.region` no está establecido, OpenClaw determina
la región en este orden:

1. `webSearch.region` propiedad del Plugin
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

Esto significa que la incorporación para China o `MINIMAX_API_HOST=https://api.minimaxi.com/...`
también mantiene automáticamente la búsqueda de MiniMax en el host de China.

Incluso cuando MiniMax se autentica mediante la ruta OAuth `minimax-portal`,
la búsqueda web se registra con el identificador de proveedor `minimax`; la URL base del proveedor OAuth
se utiliza como indicación de región para seleccionar el host de China o global, y `MINIMAX_OAUTH_TOKEN`
puede proporcionar la credencial de portador para la búsqueda de MiniMax.

## Parámetros admitidos

| Parámetro | Tipo    | Restricciones     | Descripción                                                                 |
| --------- | ------- | --------------- | --------------------------------------------------------------------------- |
| `query`   | cadena  | obligatorio        | Cadena de consulta de búsqueda.                                                        |
| `count`   | entero | 1-10, valor predeterminado: 5 | Número de resultados que se devolverán. OpenClaw recorta la lista devuelta a este tamaño. |

Actualmente no se admiten filtros específicos del proveedor.

## Contenido relacionado

- [Descripción general de la búsqueda web](/es/tools/web) -- todos los proveedores y detección automática
- [MiniMax](/es/providers/minimax) -- configuración de modelos, imágenes, voz y autenticación
