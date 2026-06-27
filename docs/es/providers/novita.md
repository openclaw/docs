---
read_when:
    - Quiere ejecutar OpenClaw con modelos de NovitaAI
    - Necesitas el id, la clave o el endpoint del proveedor Novita
summary: Usa la API compatible con OpenAI de NovitaAI con OpenClaw
title: NovitaAI
x-i18n:
    generated_at: "2026-06-27T12:39:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 602df700662dbf2176acabcad7d23950e8240158f58d115f8e56bf1fb9f43bcb
    source_path: providers/novita.md
    workflow: 16
---

NovitaAI es un proveedor alojado de infraestructura de IA con una API de modelos compatible con OpenAI. En OpenClaw es un proveedor de modelos incluido, por lo que el id del proveedor es `novita`, las credenciales pasan por el flujo normal de autenticación de modelos y las referencias de modelo tienen este aspecto: `novita/deepseek/deepseek-v3-0324`.

Usa Novita cuando quieras acceso alojado a rutas de modelos de pesos abiertos y de terceros sin ejecutar tu propio servidor de inferencia. El catálogo incluido se centra en modelos de chat prácticos para turnos de agente, incluidas rutas de DeepSeek, Moonshot, MiniMax, GLM y Qwen expuestas por Novita.

Este proveedor usa el endpoint compatible con OpenAI de Novita. OpenClaw gestiona el registro del proveedor, la autenticación, los alias, la normalización de referencias de modelo y la selección de URL base; Novita controla la disponibilidad en vivo de los modelos, los permisos de la cuenta, los precios y los límites de tasa.

## Configuración

Crea una clave de API en [novita.ai/settings/key-management](https://novita.ai/settings/key-management) y luego ejecuta:

```bash
openclaw onboard --auth-choice novita-api-key
```

O define:

```bash
export NOVITA_API_KEY="<your-novita-api-key>" # pragma: allowlist secret
```

## Valores predeterminados

- Proveedor: `novita`
- Alias: `novita-ai`, `novitaai`
- URL base: `https://api.novita.ai/openai/v1`
- Variable de entorno: `NOVITA_API_KEY`
- Modelo predeterminado: `novita/deepseek/deepseek-v3-0324`

## Cuándo elegir Novita

- Quieres acceso alojado a modelos de pesos abiertos con una API compatible con OpenAI.
- Quieres rutas de DeepSeek, Kimi, MiniMax, GLM o de la familia Qwen mediante una sola cuenta de proveedor.
- Quieres otra ruta alternativa alojada además de OpenRouter, GMI, DeepInfra o las API directas de proveedores.
- Prefieres el alojamiento de modelos del lado del proveedor en lugar de mantener infraestructura de vLLM, SGLang, LM Studio u Ollama.

Elige un proveedor directo del fabricante cuando necesites parámetros de solicitud nativos del fabricante o contratos de soporte. Elige un proveedor local cuando el modelo deba ejecutarse en tu propio hardware o detrás del límite de tu propia red.

## Modelos

El catálogo incluido inicializa ids de ruta de NovitaAI disponibles habitualmente, incluidos:

- `novita/moonshotai/kimi-k2.5`
- `novita/minimax/minimax-m2.7`
- `novita/zai-org/glm-5`
- `novita/deepseek/deepseek-v3-0324`
- `novita/deepseek/deepseek-r1-0528`
- `novita/qwen/qwen3-235b-a22b-fp8`

El catálogo es un punto de partida para la selección de modelos de OpenClaw. Tu cuenta, región o el catálogo actual de Novita pueden añadir, eliminar o restringir rutas. Comprueba el proveedor desde la CLI antes de definir un valor predeterminado de larga duración:

```bash
openclaw models list --provider novita
```

## Solución de problemas

- `401` o `403`: verifica la clave en la página de administración de claves de Novita y vuelve a ejecutar `openclaw onboard --auth-choice novita-api-key` si el perfil almacenado está obsoleto.
- Errores de modelo desconocido: usa el `novita/<route-id>` exacto devuelto por `openclaw models list --provider novita`.
- Rutas lentas o fallidas: prueba otra ruta de modelo de Novita o configura Novita como proveedor alternativo para cargas de trabajo que puedan tolerar variaciones específicas del proveedor.

## Relacionado

- [Proveedores de modelos](/es/concepts/model-providers)
- [Todos los proveedores](/es/providers/index)
