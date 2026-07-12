---
read_when:
    - Quieres usar MiniMax para `web_search`
    - Necesitas una clave de MiniMax Token Plan o un token de OAuth
    - Quieres orientación sobre el host de búsqueda de MiniMax para China/global.
summary: Búsqueda de MiniMax mediante la API de búsqueda del plan Token
title: Búsqueda de MiniMax
x-i18n:
    generated_at: "2026-07-11T23:35:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e96d1a5fe20847c5fd4476fa6aab8366910b81833c1e42e125d231c4ab003e15
    source_path: tools/minimax-search.md
    workflow: 16
---

OpenClaw admite MiniMax como proveedor de `web_search` mediante la API de búsqueda de Token Plan de MiniMax. Devuelve resultados de búsqueda estructurados con títulos, URL, fragmentos y consultas relacionadas.

## Obtener una credencial de Token Plan

<Steps>
  <Step title="Crear una clave">
    Cree o copie una clave de Token Plan de MiniMax desde
    [la plataforma MiniMax](https://platform.minimax.io/user-center/basic-information/interface-key).
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
Token Plan con la búsqueda habilitada; es posible que el endpoint de búsqueda de
Token Plan no acepte claves normales de la API de modelos de MiniMax.

## Configuración

```json5
{
  plugins: {
    entries: {
      minimax: {
        config: {
          webSearch: {
            apiKey: "sk-cp-...", // opcional si se establece una variable de entorno de Token Plan de MiniMax
            region: "global", // o "cn"
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
Para una instalación del Gateway, colóquela en `~/.openclaw/.env`.

## Selección de región

La búsqueda de MiniMax utiliza estos endpoints:

- Global: `https://api.minimax.io/v1/coding_plan/search`
- China: `https://api.minimaxi.com/v1/coding_plan/search`

Si `plugins.entries.minimax.config.webSearch.region` no está establecido, OpenClaw determina
la región en este orden:

1. `tools.web.search.minimax.region` / `webSearch.region` propiedad del plugin
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

Esto significa que la incorporación para China o `MINIMAX_API_HOST=https://api.minimaxi.com/...`
también mantiene automáticamente la búsqueda de MiniMax en el host de China.

Incluso si autenticó MiniMax mediante la ruta OAuth `minimax-portal`,
la búsqueda web sigue registrándose con el identificador de proveedor `minimax`; la URL base del proveedor OAuth
se utiliza como indicio de región para seleccionar el host de China o global, y `MINIMAX_OAUTH_TOKEN`
puede servir como credencial de portador para la búsqueda de MiniMax.

## Parámetros compatibles

| Parámetro | Tipo    | Restricciones          | Descripción                                                                 |
| --------- | ------- | ---------------------- | --------------------------------------------------------------------------- |
| `query`   | cadena  | obligatorio            | Cadena de consulta de búsqueda.                                             |
| `count`   | entero  | 1-10, valor predeterminado: 5 | Número de resultados que se devolverán. OpenClaw recorta la lista devuelta a este tamaño. |

Actualmente no se admiten filtros específicos del proveedor.

## Contenido relacionado

- [Descripción general de la búsqueda web](/es/tools/web) -- todos los proveedores y la detección automática
- [MiniMax](/es/providers/minimax) -- configuración de modelos, imágenes, voz y autenticación
