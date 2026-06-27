---
read_when:
    - Desea ejecutar OpenClaw con un servidor SGLang local
    - Quieres puntos de conexión /v1 compatibles con OpenAI con tus propios modelos
summary: Ejecutar OpenClaw con SGLang (servidor autohospedado compatible con OpenAI)
title: SGLang
x-i18n:
    generated_at: "2026-05-13T05:33:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: bd1a5954e3994e3640ee17c62acedc314716c3ed5e52528da436c36c077ebead
    source_path: providers/sglang.md
    workflow: 16
    postprocess_version: locale-links-v1
---

SGLang sirve modelos de pesos abiertos mediante una API HTTP compatible con OpenAI. OpenClaw se conecta a SGLang usando la familia de proveedores `openai-completions` con detección automática de los modelos disponibles.

| Propiedad                 | Valor                                                        |
| ------------------------- | ------------------------------------------------------------ |
| ID del proveedor          | `sglang`                                                     |
| Plugin                    | incluido, `enabledByDefault: true`                           |
| Variable de entorno de autenticación | `SGLANG_API_KEY` (cualquier valor no vacío si el servidor no tiene autenticación) |
| Marca de configuración inicial | `--auth-choice sglang`                                  |
| API                       | compatible con OpenAI (`openai-completions`)                 |
| URL base predeterminada   | `http://127.0.0.1:30000/v1`                                  |
| Marcador de posición del modelo predeterminado | `sglang/Qwen/Qwen3-8B`                    |
| Uso de streaming          | Sí (`supportsStreamingUsage: true`)                          |
| Precios                   | Marcado como gratuito externo (`modelPricing.external: false`) |

OpenClaw también **detecta automáticamente** los modelos disponibles de SGLang cuando lo activas con `SGLANG_API_KEY`. Usa `sglang/*` en `agents.defaults.models` para mantener la detección dinámica cuando también configures una URL base personalizada de SGLang. Consulta [Detección de modelos (proveedor implícito)](#model-discovery-implicit-provider) abajo.

## Primeros pasos

<Steps>
  <Step title="Iniciar SGLang">
    Inicia SGLang con un servidor compatible con OpenAI. Tu URL base debe exponer
    endpoints `/v1` (por ejemplo, `/v1/models`, `/v1/chat/completions`). SGLang
    suele ejecutarse en:

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="Establecer una clave de API">
    Cualquier valor funciona si no hay autenticación configurada en tu servidor:

    ```bash
    export SGLANG_API_KEY="sglang-local"
    ```

  </Step>
  <Step title="Ejecutar la configuración inicial o establecer un modelo directamente">
    ```bash
    openclaw onboard
    ```

    O configura el modelo manualmente:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "sglang/your-model-id" },
        },
      },
    }
    ```

  </Step>
</Steps>

## Detección de modelos (proveedor implícito)

Cuando `SGLANG_API_KEY` está establecido (o existe un perfil de autenticación) y **no**
defines `models.providers.sglang`, OpenClaw consultará:

- `GET http://127.0.0.1:30000/v1/models`

y convertirá los ID devueltos en entradas de modelo.

<Note>
Si estableces `models.providers.sglang` explícitamente, OpenClaw usa tus modelos
declarados de forma predeterminada. Añade `"sglang/*": {}` a `agents.defaults.models` cuando
quieras que OpenClaw consulte el endpoint `/models` de ese proveedor configurado e incluya
todos los modelos de SGLang anunciados.
</Note>

## Configuración explícita (modelos manuales)

Usa configuración explícita cuando:

- SGLang se ejecuta en otro host/puerto.
- Quieres fijar los valores de `contextWindow`/`maxTokens`.
- Tu servidor requiere una clave de API real (o quieres controlar las cabeceras).

```json5
{
  models: {
    providers: {
      sglang: {
        baseUrl: "http://127.0.0.1:30000/v1",
        apiKey: "${SGLANG_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "Local SGLang Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Comportamiento de estilo proxy">
    SGLang se trata como un backend `/v1` compatible con OpenAI de estilo proxy, no como un
    endpoint nativo de OpenAI.

    | Comportamiento | SGLang |
    |----------|--------|
    | Adaptación de solicitudes solo para OpenAI | No se aplica |
    | `service_tier`, `store` de Responses, indicaciones de caché de prompts | No se envían |
    | Adaptación de payload compatible con razonamiento | No se aplica |
    | Cabeceras de atribución ocultas (`originator`, `version`, `User-Agent`) | No se inyectan en URL base personalizadas de SGLang |

  </Accordion>

  <Accordion title="Solución de problemas">
    **No se puede acceder al servidor**

    Verifica que el servidor esté en ejecución y responda:

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **Errores de autenticación**

    Si las solicitudes fallan con errores de autenticación, establece una `SGLANG_API_KEY` real que coincida
    con la configuración de tu servidor, o configura el proveedor explícitamente bajo
    `models.providers.sglang`.

    <Tip>
    Si ejecutas SGLang sin autenticación, cualquier valor no vacío para
    `SGLANG_API_KEY` es suficiente para activar la detección de modelos.
    </Tip>

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelos y comportamiento de conmutación por error.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration-reference" icon="gear">
    Esquema de configuración completo, incluidas las entradas de proveedores.
  </Card>
</CardGroup>
