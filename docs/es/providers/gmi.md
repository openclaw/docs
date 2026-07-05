---
read_when:
    - Quieres ejecutar OpenClaw con modelos de GMI Cloud
    - Necesitas el id, la clave o el endpoint del proveedor GMI
summary: Usar la API compatible con OpenAI de GMI Cloud con OpenClaw
title: GMI Cloud
x-i18n:
    generated_at: "2026-07-05T11:37:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a21fd2a997f44e1f78d97a0fba24ca2bbc00dd193323da712d650ed4ba105355
    source_path: providers/gmi.md
    workflow: 16
---

GMI Cloud es una plataforma de inferencia alojada para modelos de frontera y de pesos abiertos
detrás de una API compatible con OpenAI. En OpenClaw es un plugin de proveedor externo
oficial: instálalo una vez, almacena las credenciales mediante la autenticación de modelos normal y usa
refs de modelo como `gmi/google/gemini-3.1-flash-lite`.

Usa GMI cuando quieras una clave de API para varias familias de modelos alojados, incluidas
las rutas de Anthropic, DeepSeek, Google, Moonshot, OpenAI y Z.AI expuestas por el
catálogo de GMI. Funciona como proveedor secundario para fallback de modelos, para comparar
rutas alojadas entre vendors o cuando GMI tiene un modelo disponible antes que tu
proveedor principal. OpenClaw posee el id de proveedor, el perfil de autenticación, los alias,
la semilla del catálogo de modelos y la URL base; GMI posee la disponibilidad de modelos en vivo, la facturación,
los límites de tasa y cualquier política de enrutamiento del lado del proveedor.

| Propiedad                         | Valor                                    |
| --------------------------------- | ---------------------------------------- |
| Id de proveedor                   | `gmi` (alias: `gmi-cloud`, `gmicloud`)   |
| Paquete                           | `@openclaw/gmi-provider`                 |
| Variable de entorno de auth       | `GMI_API_KEY`                            |
| API                               | compatible con OpenAI (`openai-completions`) |
| URL base                          | `https://api.gmi-serving.com/v1`         |
| Modelo predeterminado             | `gmi/google/gemini-3.1-flash-lite`       |

## Configuración

Instala el plugin, reinicia el Gateway y luego crea una clave de API en GMI Cloud
(`https://www.gmicloud.ai/`):

```bash
openclaw plugins install @openclaw/gmi-provider
openclaw gateway restart
```

Luego ejecuta:

```bash
openclaw onboard --auth-choice gmi-api-key
```

Las configuraciones no interactivas pueden pasar `--gmi-api-key <key>` o establecer:

```bash
export GMI_API_KEY="<your-gmi-api-key>" # pragma: allowlist secret
```

## Cuándo elegir GMI

- Quieres un endpoint alojado compatible con OpenAI en lugar de un servidor de modelos local.
- Quieres probar varias familias de modelos comerciales y de pesos abiertos mediante una sola
  cuenta de proveedor.
- Quieres un proveedor de fallback con enrutamiento upstream diferente al de DeepInfra,
  OpenRouter, Together o las API directas de los vendors.
- Necesitas ids de modelo, precios o controles de cuenta específicos de GMI.

Elige el proveedor directo del vendor cuando necesites funciones nativas del vendor
que GMI no expone mediante su ruta compatible con OpenAI. Elige un proveedor local
como LM Studio, Ollama, SGLang o vLLM cuando la localidad de datos o el control local
de GPU importen más que la comodidad alojada.

## Modelos

El catálogo del plugin siembra ids de ruta de GMI Cloud disponibles habitualmente:

| Ref de modelo                      | Entrada      | Contexto  | Salida máxima |
| ---------------------------------- | ------------ | --------- | ------------- |
| `gmi/anthropic/claude-sonnet-4.6`  | texto + imagen | 200,000   | 64,000        |
| `gmi/deepseek-ai/DeepSeek-V3.2`    | texto        | 163,840   | 65,536        |
| `gmi/google/gemini-3.1-flash-lite` | texto + imagen | 1,048,576 | 65,536        |
| `gmi/moonshotai/Kimi-K2.5`         | texto + imagen | 262,144   | 65,536        |
| `gmi/openai/gpt-5.4`               | texto + imagen | 400,000   | 128,000       |
| `gmi/zai-org/GLM-5.1-FP8`          | texto        | 202,752   | 65,536        |

El catálogo es una semilla, no una promesa de que todas las cuentas puedan llamar a todos los modelos en
todo momento. Lista lo que el proveedor configurado informa en tu entorno:

```bash
openclaw models list --provider gmi
```

## Solución de problemas

- `401` o `403`: comprueba que `GMI_API_KEY` esté establecido para el proceso que ejecuta
  OpenClaw, o vuelve a ejecutar la incorporación para almacenar la clave en el perfil de autenticación del proveedor.
- Errores de modelo desconocido: confirma que el modelo exista en tu cuenta de GMI y usa la
  ref completa `gmi/<route-id>` mostrada por `openclaw models list --provider gmi`.
- Errores intermitentes del proveedor: prueba una ruta de GMI diferente o configura GMI como
  fallback en lugar de como único proveedor de modelos principal.

## Relacionado

- [Proveedores de modelos](/es/concepts/model-providers)
- [Todos los proveedores](/es/providers/index)
