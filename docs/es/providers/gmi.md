---
read_when:
    - Quieres ejecutar OpenClaw con modelos de GMI Cloud
    - Necesitas el identificador de proveedor, la clave o el endpoint de GMI
summary: Usa la API compatible con OpenAI de GMI Cloud con OpenClaw
title: GMI Cloud
x-i18n:
    generated_at: "2026-06-27T12:37:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 119db777a2285259d646c9b5ab7e3885e3c7c714039277fa06a5a881e46284b9
    source_path: providers/gmi.md
    workflow: 16
---

GMI Cloud es una plataforma de inferencia alojada para modelos frontier y open-weight
detrás de una API compatible con OpenAI. En OpenClaw es un provider externo oficial
Plugin, lo que significa que lo instalas una vez, lo seleccionas con el id de provider `gmi`,
guardas las credenciales mediante la autenticación normal de modelos y usas referencias de modelo como
`gmi/google/gemini-3.1-flash-lite`.

Usa GMI cuando quieras una clave de API para varias familias de modelos alojados, incluidas
las rutas de Google, Anthropic, OpenAI, DeepSeek, Moonshot y Z.AI expuestas por el
catálogo de GMI. Es útil como provider secundario para fallback de modelos, para comparar
rutas alojadas entre proveedores, o cuando GMI tiene un modelo disponible antes que tu
provider principal.

Este provider usa semántica de chat compatible con OpenAI. OpenClaw posee el id del provider,
el perfil de autenticación, los alias, la semilla del catálogo de modelos y la URL base; GMI posee la disponibilidad
en vivo de modelos, la facturación, los límites de frecuencia y cualquier política de enrutamiento del lado del provider.

## Configuración

Instala el Plugin, reinicia el gateway y luego crea una clave de API en GMI Cloud:

```bash
openclaw plugins install @openclaw/gmi-provider
openclaw gateway restart
```

Luego ejecuta:

```bash
openclaw onboard --auth-choice gmi-api-key
```

O configura:

```bash
export GMI_API_KEY="<your-gmi-api-key>" # pragma: allowlist secret
```

## Valores predeterminados

- Provider: `gmi`
- Alias: `gmi-cloud`, `gmicloud`
- URL base: `https://api.gmi-serving.com/v1`
- Variable de entorno: `GMI_API_KEY`
- Modelo predeterminado: `gmi/google/gemini-3.1-flash-lite`

## Cuándo elegir GMI

- Quieres un endpoint alojado compatible con OpenAI en lugar de un servidor de modelos local.
- Quieres probar varias familias de modelos comerciales y open-weight mediante una sola
  cuenta de provider.
- Quieres un provider de fallback con enrutamiento ascendente diferente de OpenRouter,
  DeepInfra, Together o las API directas de los proveedores.
- Necesitas ids de modelo, precios o controles de cuenta específicos de GMI.

Elige el provider directo del proveedor cuando necesites funciones nativas del proveedor
que GMI no expone mediante su ruta compatible con OpenAI. Elige un provider local
como Ollama, LM Studio, vLLM o SGLang cuando la localidad de los datos o el control local
de GPU importe más que la comodidad del alojamiento.

## Modelos

El catálogo del Plugin siembra ids de rutas de GMI Cloud comúnmente disponibles, incluidos:

- `gmi/zai-org/GLM-5.1-FP8`
- `gmi/deepseek-ai/DeepSeek-V3.2`
- `gmi/moonshotai/Kimi-K2.5`
- `gmi/google/gemini-3.1-flash-lite`
- `gmi/anthropic/claude-sonnet-4.6`
- `gmi/openai/gpt-5.4`

El catálogo es una semilla, no una promesa de que todas las cuentas puedan llamar a todos los modelos en
todo momento. Usa el comando de listado de modelos de OpenClaw para ver qué informa el
provider configurado en tu entorno:

```bash
openclaw models list --provider gmi
```

## Solución de problemas

- `401` o `403`: comprueba que `GMI_API_KEY` esté configurada para el proceso que ejecuta
  OpenClaw, o vuelve a ejecutar la incorporación para guardar la clave en el perfil de autenticación del provider.
- Errores de modelo desconocido: confirma que el modelo exista en tu cuenta de GMI y usa la
  referencia completa `gmi/<route-id>` mostrada por `openclaw models list --provider gmi`.
- Errores intermitentes del provider: prueba una ruta de GMI diferente o configura GMI como
  fallback en lugar de como el único provider de modelos principal.

## Relacionado

- [Providers de modelos](/es/concepts/model-providers)
- [Todos los providers](/es/providers/index)
