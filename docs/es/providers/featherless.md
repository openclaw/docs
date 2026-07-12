---
read_when:
    - Quieres usar Featherless AI con OpenClaw
    - Necesitas la variable de entorno de la clave de API de Featherless o el formato de referencia del modelo
summary: Configuración de Featherless AI, selección de modelos y llamadas a herramientas
title: Featherless AI
x-i18n:
    generated_at: "2026-07-11T23:26:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9112f7e65b4089bf96933c632d0b62f7fb87d42998d985ca85eb92dc392636b6
    source_path: providers/featherless.md
    workflow: 16
---

[Featherless AI](https://featherless.ai) ofrece modelos abiertos mediante una
API compatible con OpenAI. OpenClaw instala Featherless como un Plugin de proveedor
externo oficial y mantiene pequeño el catálogo integrado, a la vez que acepta
identificadores exactos de modelos de Featherless durante la ejecución.

| Propiedad                         | Valor                                    |
| --------------------------------- | ---------------------------------------- |
| Identificador del proveedor       | `featherless`                            |
| Paquete                           | `@openclaw/featherless-provider`         |
| Variable de entorno de autenticación | `FEATHERLESS_API_KEY`                 |
| Opción de incorporación           | `--auth-choice featherless-api-key`      |
| Opción directa de la CLI          | `--featherless-api-key <key>`            |
| API                               | Compatible con OpenAI (`openai-completions`) |
| URL base                          | `https://api.featherless.ai/v1`          |
| Modelo predeterminado             | `featherless/Qwen/Qwen3-32B`             |

## Configuración

Instale el Plugin y reinicie el Gateway:

```bash
openclaw plugins install @openclaw/featherless-provider
openclaw gateway restart
```

Ejecute la incorporación:

```bash
openclaw onboard --auth-choice featherless-api-key
```

Para una configuración no interactiva:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice featherless-api-key \
  --featherless-api-key "$FEATHERLESS_API_KEY"
```

O exponga la clave al proceso del Gateway:

```bash
export FEATHERLESS_API_KEY="<your-featherless-api-key>" # pragma: allowlist secret
```

Verifique el proveedor:

```bash
openclaw models list --provider featherless
```

## Modelo predeterminado

El Plugin utiliza `Qwen/Qwen3-32B` como valor predeterminado de configuración porque Featherless
documenta llamadas nativas a herramientas para la familia Qwen 3. OpenClaw configura su
ventana de contexto de 32 768 tokens, un límite de salida conservador de 4096 tokens y
los controles de razonamiento de la plantilla de chat de Qwen.

Los campos de costo del catálogo son cero porque Featherless admite varios modos
de facturación y OpenClaw no incorpora tarifas de planes o precios por solicitud
específicas de cada cuenta.

## Otros modelos de Featherless

Utilice el identificador exacto del modelo de Featherless después del prefijo de proveedor `featherless/`:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "featherless/moonshotai/Kimi-K2-Instruct",
      },
    },
  },
}
```

OpenClaw no copia deliberadamente el índice público completo de modelos de Featherless
en el selector. El índice es grande y no proporciona suficientes metadatos estructurados
de capacidades para clasificar de forma segura cada modelo de texto, visión, incrustaciones
y razonamiento. Por lo tanto, los identificadores desconocidos se resuelven con valores
predeterminados conservadores de solo texto y sin razonamiento: una ventana de contexto
de 4096 tokens y un límite de salida de 1024 tokens.

Añada una entrada explícita de modelo del proveedor cuando un modelo necesite metadatos diferentes:

```json5
{
  models: {
    mode: "merge",
    providers: {
      featherless: {
        baseUrl: "https://api.featherless.ai/v1",
        apiKey: "${FEATHERLESS_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "google/gemma-3-27b-it",
            name: "Gemma 3 27B",
            input: ["text", "image"],
            reasoning: false,
            contextWindow: 32768,
            maxTokens: 4096,
          },
        ],
      },
    },
  },
}
```

Consulte el catálogo de modelos de Featherless para conocer la disponibilidad actual
de los modelos y las etiquetas de capacidades antes de añadir metadatos personalizados.

## Solución de problemas

- `401` o `403`: confirme que `FEATHERLESS_API_KEY` sea visible para el proceso
  del Gateway o vuelva a ejecutar la incorporación.
- Modelo desconocido: utilice el identificador exacto, respetando mayúsculas y minúsculas,
  de Featherless después del prefijo `featherless/`.
- Las llamadas a herramientas se devuelven como texto: elija una familia de modelos
  para la que Featherless documente llamadas nativas a funciones, como Qwen 3.
- El Gateway administrado no puede acceder a la clave: colóquela en `~/.openclaw/.env`
  o en otra fuente de entorno cargada por el servicio y, después, reinicie el Gateway.

## Contenido relacionado

- [Proveedores de modelos](/es/concepts/model-providers)
- [Todos los proveedores](/es/providers/index)
- [Modos de razonamiento](/es/tools/thinking)
