---
read_when:
    - Quieres ejecutar OpenClaw con un servidor local de SGLang
    - Quieres endpoints `/v1` compatibles con OpenAI con tus propios modelos
summary: Ejecuta OpenClaw con SGLang (servidor autohospedado compatible con OpenAI)
title: SGLang
x-i18n:
    generated_at: "2026-04-23T05:19:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 96f243c6028d9de104c96c8e921e5bec1a685db06b80465617f33fe29d5c472d
    source_path: providers/sglang.md
    workflow: 15
---

# SGLang

SGLang puede servir modelos de código abierto mediante una API HTTP **compatible con OpenAI**.
OpenClaw puede conectarse a SGLang usando la API `openai-completions`.

OpenClaw también puede **detectar automáticamente** los modelos disponibles en SGLang cuando activas
la función con `SGLANG_API_KEY` (cualquier valor funciona si tu servidor no exige autenticación)
y no defines una entrada explícita `models.providers.sglang`.

OpenClaw trata `sglang` como un proveedor local compatible con OpenAI que admite
contabilidad de uso en streaming, por lo que los recuentos de tokens de estado/contexto pueden actualizarse a partir de las
respuestas de `stream_options.include_usage`.

## Primeros pasos

<Steps>
  <Step title="Inicia SGLang">
    Inicia SGLang con un servidor compatible con OpenAI. Tu URL base debe exponer
    endpoints `/v1` (por ejemplo `/v1/models`, `/v1/chat/completions`). SGLang
    suele ejecutarse en:

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="Configura una API key">
    Cualquier valor funciona si no hay autenticación configurada en tu servidor:

    ```bash
    export SGLANG_API_KEY="sglang-local"
    ```

  </Step>
  <Step title="Ejecuta la incorporación o configura un modelo directamente">
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

Cuando `SGLANG_API_KEY` está configurada (o existe un perfil de autenticación) y **no**
defines `models.providers.sglang`, OpenClaw consultará:

- `GET http://127.0.0.1:30000/v1/models`

y convertirá los ID devueltos en entradas de modelos.

<Note>
Si configuras `models.providers.sglang` explícitamente, la detección automática se omite y
debes definir los modelos manualmente.
</Note>

## Configuración explícita (modelos manuales)

Usa configuración explícita cuando:

- SGLang se ejecuta en otro host/puerto.
- Quieres fijar valores de `contextWindow`/`maxTokens`.
- Tu servidor requiere una API key real (o quieres controlar los encabezados).

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
  <Accordion title="Comportamiento tipo proxy">
    SGLang se trata como un backend `/v1` compatible con OpenAI de tipo proxy, no como un
    endpoint nativo de OpenAI.

    | Comportamiento | SGLang |
    |----------|--------|
    | Modelado de solicitudes solo para OpenAI | No se aplica |
    | `service_tier`, `store` de Responses, sugerencias de caché de prompt | No se envían |
    | Modelado de cargas útiles compatible con razonamiento | No se aplica |
    | Encabezados ocultos de atribución (`originator`, `version`, `User-Agent`) | No se inyectan en URLs base personalizadas de SGLang |

  </Accordion>

  <Accordion title="Solución de problemas">
    **No se puede acceder al servidor**

    Verifica que el servidor esté en ejecución y responda:

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **Errores de autenticación**

    Si las solicitudes fallan con errores de autenticación, configura una `SGLANG_API_KEY` real que coincida
    con la configuración de tu servidor, o configura el proveedor explícitamente en
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
    Elegir proveedores, referencias de modelos y comportamiento de failover.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration-reference" icon="gear">
    Esquema completo de configuración, incluidas las entradas de proveedores.
  </Card>
</CardGroup>
