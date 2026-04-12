---
read_when:
    - Quieres ejecutar OpenClaw contra un servidor SGLang local
    - Quieres endpoints `/v1` compatibles con OpenAI con tus propios modelos
summary: Ejecuta OpenClaw con SGLang (servidor autoalojado compatible con OpenAI)
title: SGLang
x-i18n:
    generated_at: "2026-04-12T23:32:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: e0a2e50a499c3d25dcdc3af425fb023c6e3f19ed88f533ecf0eb8a2cb7ec8b0d
    source_path: providers/sglang.md
    workflow: 15
---

# SGLang

SGLang puede servir modelos de código abierto mediante una API HTTP **compatible con OpenAI**.
OpenClaw puede conectarse a SGLang usando la API `openai-completions`.

OpenClaw también puede **descubrir automáticamente** los modelos disponibles de SGLang cuando activas
esta opción con `SGLANG_API_KEY` (cualquier valor sirve si tu servidor no aplica autenticación)
y no defines una entrada explícita `models.providers.sglang`.

## Primeros pasos

<Steps>
  <Step title="Start SGLang">
    Inicia SGLang con un servidor compatible con OpenAI. Tu URL base debe exponer
    endpoints `/v1` (por ejemplo `/v1/models`, `/v1/chat/completions`). SGLang
    suele ejecutarse en:

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="Set an API key">
    Cualquier valor sirve si no hay autenticación configurada en tu servidor:

    ```bash
    export SGLANG_API_KEY="sglang-local"
    ```

  </Step>
  <Step title="Run onboarding or set a model directly">
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

## Descubrimiento de modelos (proveedor implícito)

Cuando `SGLANG_API_KEY` está establecido (o existe un perfil de autenticación) y **no**
defines `models.providers.sglang`, OpenClaw consultará:

- `GET http://127.0.0.1:30000/v1/models`

y convertirá los ids devueltos en entradas de modelo.

<Note>
Si estableces explícitamente `models.providers.sglang`, se omite el descubrimiento automático y
debes definir los modelos manualmente.
</Note>

## Configuración explícita (modelos manuales)

Usa una configuración explícita cuando:

- SGLang se ejecute en otro host/puerto.
- Quieras fijar valores de `contextWindow`/`maxTokens`.
- Tu servidor requiera una clave de API real (o quieras controlar los encabezados).

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
            name: "Modelo SGLang local",
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

    | Behavior | SGLang |
    |----------|--------|
    | Modelado de solicitudes solo para OpenAI | No se aplica |
    | `service_tier`, `store` de Responses, indicios de caché de prompt | No se envían |
    | Modelado de payload compatible con razonamiento | No se aplica |
    | Encabezados ocultos de atribución (`originator`, `version`, `User-Agent`) | No se inyectan en URLs base personalizadas de SGLang |

  </Accordion>

  <Accordion title="Solución de problemas">
    **Servidor no accesible**

    Verifica que el servidor esté en ejecución y responda:

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **Errores de autenticación**

    Si las solicitudes fallan con errores de autenticación, establece un `SGLANG_API_KEY` real que coincida
    con la configuración de tu servidor, o configura el proveedor explícitamente en
    `models.providers.sglang`.

    <Tip>
    Si ejecutas SGLang sin autenticación, cualquier valor no vacío para
    `SGLANG_API_KEY` es suficiente para activar el descubrimiento de modelos.
    </Tip>

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelos y comportamiento de failover.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration-reference" icon="gear">
    Esquema completo de configuración, incluidas las entradas de proveedor.
  </Card>
</CardGroup>
