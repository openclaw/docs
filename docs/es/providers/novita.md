---
read_when:
    - Quieres ejecutar OpenClaw con modelos de NovitaAI
    - Necesitas el ID, la clave o el punto de conexión del proveedor Novita
summary: Usa la API compatible con OpenAI de NovitaAI con OpenClaw
title: NovitaAI
x-i18n:
    generated_at: "2026-07-05T11:38:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 83e0e43e68d85d73e790023858a49f971b683129dbbdf6092fbd8bba4d8da331
    source_path: providers/novita.md
    workflow: 16
---

NovitaAI es un proveedor de infraestructura de IA alojada con una API compatible con OpenAI.
Se distribuye como proveedor incluido de OpenClaw (sin instalación de plugin aparte), por lo que
las credenciales pasan por el flujo normal de autenticación de modelos y las referencias de modelo se ven como
`novita/deepseek/deepseek-v3-0324`.

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

| Configuración        | Valor                              |
| -------------------- | ---------------------------------- |
| ID de proveedor      | `novita`                           |
| Alias                | `novita-ai`, `novitaai`            |
| URL base             | `https://api.novita.ai/openai/v1`  |
| Variable de entorno  | `NOVITA_API_KEY`                   |
| Modelo predeterminado | `novita/deepseek/deepseek-v3-0324` |

## Catálogo de modelos incluido

- `novita/moonshotai/kimi-k2.5`
- `novita/minimax/minimax-m2.7`
- `novita/zai-org/glm-5`
- `novita/deepseek/deepseek-v3-0324`
- `novita/deepseek/deepseek-r1-0528`
- `novita/qwen/qwen3-235b-a22b-fp8`

Este es un punto de partida, no un catálogo en vivo. Tu cuenta, región o
la oferta actual de Novita pueden agregar, eliminar o restringir rutas. Compruébalo antes de
establecer un valor predeterminado de larga duración:

```bash
openclaw models list --provider novita
```

## Cuándo elegir Novita

- Acceso alojado a modelos de pesos abiertos con una API compatible con OpenAI.
- Rutas de las familias DeepSeek, Kimi, MiniMax, GLM o Qwen mediante una sola cuenta
  de proveedor.
- Otra ruta de respaldo alojada junto a DeepInfra, GMI, OpenRouter o API directas
  de proveedores.
- Alojamiento de modelos del lado del proveedor en lugar de mantener infraestructura
  de LM Studio, Ollama, SGLang o vLLM.

Elige un proveedor directo del fabricante cuando necesites parámetros de solicitud
nativos del fabricante o contratos de soporte. Elige un proveedor local cuando el modelo deba
ejecutarse en tu propio hardware o límite de red.

## Solución de problemas

- `401`/`403`: verifica la clave en la página de administración de claves de Novita y vuelve a ejecutar
  `openclaw onboard --auth-choice novita-api-key` si el perfil almacenado está
  obsoleto.
- Errores de modelo desconocido: usa el `novita/<route-id>` exacto devuelto por
  `openclaw models list --provider novita`.
- Rutas lentas o con errores: prueba otra ruta de modelo de Novita o configura Novita como
  proveedor de respaldo para cargas de trabajo que puedan tolerar variación
  específica del proveedor.

## Relacionado

- [Proveedores de modelos](/es/concepts/model-providers)
- [Directorio de proveedores](/es/providers/index)
