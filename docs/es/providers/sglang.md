---
read_when:
    - Quieres ejecutar OpenClaw contra un servidor local de SGLang
    - Quieres endpoints `/v1` compatibles con OpenAI con tus propios modelos
summary: Ejecuta OpenClaw con SGLang (servidor autoalojado compatible con OpenAI)
title: SGLang
x-i18n:
    generated_at: "2026-04-24T05:46:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8ed6767f85bcf099fb25dfe72a48b8a09e04ba13212125651616d2d93607beba
    source_path: providers/sglang.md
    workflow: 15
---

SGLang puede servir modelos de código abierto mediante una API HTTP **compatible con OpenAI**.
OpenClaw puede conectarse a SGLang usando la API `openai-completions`.

OpenClaw también puede **detectar automáticamente** los modelos disponibles desde SGLang cuando activas
esa opción con `SGLANG_API_KEY` (cualquier valor funciona si tu servidor no exige autenticación)
y no defines una entrada explícita `models.providers.sglang`.

OpenClaw trata `sglang` como un proveedor local compatible con OpenAI que admite
contabilidad de uso en streaming, por lo que los recuentos de estado/contexto de tokens pueden actualizarse a partir de respuestas `stream_options.include_usage`.

## Primeros pasos

<Steps>
  <Step title="Inicia SGLang">
    Inicia SGLang con un servidor compatible con OpenAI. Tu `baseUrl` debe exponer
    endpoints `/v1` (por ejemplo `/v1/models`, `/v1/chat/completions`). SGLang
    suele ejecutarse en:

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="Establece una clave API">
    Cualquier valor funciona si no hay autenticación configurada en tu servidor:

    ```bash
    export SGLANG_API_KEY="sglang-local"
    ```

  </Step>
  <Step title="Ejecuta la incorporación o establece un modelo directamente">
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

Cuando `SGLANG_API_KEY` está configurado (o existe un perfil de autenticación) y **no**
defines `models.providers.sglang`, OpenClaw consultará:

- `GET http://127.0.0.1:30000/v1/models`

y convertirá los ID devueltos en entradas de modelo.

<Note>
Si configuras explícitamente `models.providers.sglang`, la detección automática se omite y
debes definir los modelos manualmente.
</Note>

## Configuración explícita (modelos manuales)

Usa configuración explícita cuando:

- SGLang se ejecuta en otro host/puerto.
- Quieres fijar los valores de `contextWindow`/`maxTokens`.
- Tu servidor requiere una clave API real (o quieres controlar los encabezados).

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
  <Accordion title="Comportamiento estilo proxy">
    SGLang se trata como un backend `/v1` compatible con OpenAI estilo proxy, no como
    un endpoint nativo de OpenAI.

    | Behavior | SGLang |
    |----------|--------|
    | Conformación de solicitudes exclusiva de OpenAI | No se aplica |
    | `service_tier`, `store` de Responses, sugerencias de caché de prompt | No se envían |
    | Conformación de carga útil de compatibilidad de razonamiento | No se aplica |
    | Encabezados ocultos de atribución (`originator`, `version`, `User-Agent`) | No se inyectan en `baseUrl` personalizadas de SGLang |

  </Accordion>

  <Accordion title="Solución de problemas">
    **No se puede acceder al servidor**

    Verifica que el servidor esté en ejecución y respondiendo:

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **Errores de autenticación**

    Si las solicitudes fallan con errores de autenticación, establece un `SGLANG_API_KEY` real que coincida
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
    Elegir proveedores, referencias de modelos y comportamiento de conmutación por error.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration-reference" icon="gear">
    Esquema completo de configuración, incluidas las entradas de proveedor.
  </Card>
</CardGroup>
