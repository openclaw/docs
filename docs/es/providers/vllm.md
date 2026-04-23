---
read_when:
    - Quieres ejecutar OpenClaw contra un servidor local de vLLM
    - Quieres endpoints `/v1` compatibles con OpenAI con tus propios modelos
summary: Ejecutar OpenClaw con vLLM (servidor local compatible con OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-04-23T05:19:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: c6c4ceeb59cc10079630e45263485747eadfc66a66267d27579f466d0c0a91a1
    source_path: providers/vllm.md
    workflow: 15
---

# vLLM

vLLM puede servir modelos de código abierto (y algunos modelos personalizados) mediante una API HTTP **compatible con OpenAI**. OpenClaw se conecta a vLLM usando la API `openai-completions`.

OpenClaw también puede **detectar automáticamente** los modelos disponibles desde vLLM cuando optas por usar `VLLM_API_KEY` (cualquier valor funciona si tu servidor no exige autenticación) y no defines una entrada explícita `models.providers.vllm`.

OpenClaw trata `vllm` como un proveedor local compatible con OpenAI que admite
contabilidad de uso transmitida, por lo que los recuentos de tokens de estado/contexto pueden actualizarse a partir de
respuestas `stream_options.include_usage`.

| Propiedad       | Valor                                    |
| ---------------- | ---------------------------------------- |
| ID del proveedor | `vllm`                                   |
| API              | `openai-completions` (compatible con OpenAI) |
| Autenticación    | Variable de entorno `VLLM_API_KEY`       |
| URL base predeterminada | `http://127.0.0.1:8000/v1`         |

## Primeros pasos

<Steps>
  <Step title="Iniciar vLLM con un servidor compatible con OpenAI">
    Tu URL base debe exponer endpoints `/v1` (por ejemplo, `/v1/models`, `/v1/chat/completions`). vLLM suele ejecutarse en:

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="Establecer la variable de entorno de la clave API">
    Cualquier valor funciona si tu servidor no exige autenticación:

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="Seleccionar un modelo">
    Reemplaza por uno de tus ID de modelo de vLLM:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "vllm/your-model-id" },
        },
      },
    }
    ```

  </Step>
  <Step title="Verificar que el modelo esté disponible">
    ```bash
    openclaw models list --provider vllm
    ```
  </Step>
</Steps>

## Detección de modelos (proveedor implícito)

Cuando `VLLM_API_KEY` está configurado (o existe un perfil de autenticación) y **no** defines `models.providers.vllm`, OpenClaw consulta:

```
GET http://127.0.0.1:8000/v1/models
```

y convierte los ID devueltos en entradas de modelo.

<Note>
Si configuras `models.providers.vllm` explícitamente, la detección automática se omite y debes definir los modelos manualmente.
</Note>

## Configuración explícita (modelos manuales)

Usa configuración explícita cuando:

- vLLM se ejecuta en un host o puerto diferente
- Quieres fijar valores `contextWindow` o `maxTokens`
- Tu servidor requiere una clave API real (o quieres controlar los encabezados)

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "Local vLLM Model",
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

## Notas avanzadas

<AccordionGroup>
  <Accordion title="Comportamiento de estilo proxy">
    vLLM se trata como un backend `/v1` compatible con OpenAI de estilo proxy, no como un endpoint nativo
    de OpenAI. Esto significa:

    | Comportamiento | ¿Se aplica? |
    |----------|----------|
    | Modelado nativo de solicitudes de OpenAI | No |
    | `service_tier` | No se envía |
    | Responses `store` | No se envía |
    | Sugerencias de caché de prompt | No se envían |
    | Modelado de carga de compatibilidad de razonamiento de OpenAI | No se aplica |
    | Encabezados ocultos de atribución de OpenClaw | No se inyectan en URL base personalizadas |

  </Accordion>

  <Accordion title="URL base personalizada">
    Si tu servidor vLLM se ejecuta en un host o puerto no predeterminado, configura `baseUrl` en la configuración explícita del proveedor:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:9000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            models: [
              {
                id: "my-custom-model",
                name: "Remote vLLM Model",
                reasoning: false,
                input: ["text"],
                contextWindow: 64000,
                maxTokens: 4096,
              },
            ],
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## Solución de problemas

<AccordionGroup>
  <Accordion title="No se puede acceder al servidor">
    Verifica que el servidor vLLM esté en ejecución y sea accesible:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    Si ves un error de conexión, verifica el host, el puerto y que vLLM se haya iniciado en modo de servidor compatible con OpenAI.

  </Accordion>

  <Accordion title="Errores de autenticación en las solicitudes">
    Si las solicitudes fallan con errores de autenticación, configura un `VLLM_API_KEY` real que coincida con la configuración de tu servidor, o configura el proveedor explícitamente en `models.providers.vllm`.

    <Tip>
    Si tu servidor vLLM no exige autenticación, cualquier valor no vacío para `VLLM_API_KEY` funciona como señal de opt-in para OpenClaw.
    </Tip>

  </Accordion>

  <Accordion title="No se detectan modelos">
    La detección automática requiere que `VLLM_API_KEY` esté configurado **y** que no exista una entrada de configuración explícita `models.providers.vllm`. Si has definido el proveedor manualmente, OpenClaw omite la detección y usa solo los modelos que declaraste.
  </Accordion>
</AccordionGroup>

<Warning>
Más ayuda: [Solución de problemas](/es/help/troubleshooting) y [FAQ](/es/help/faq).
</Warning>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelo y comportamiento de conmutación por error.
  </Card>
  <Card title="OpenAI" href="/es/providers/openai" icon="bolt">
    Proveedor nativo de OpenAI y comportamiento de rutas compatibles con OpenAI.
  </Card>
  <Card title="OAuth y autenticación" href="/es/gateway/authentication" icon="key">
    Detalles de autenticación y reglas de reutilización de credenciales.
  </Card>
  <Card title="Solución de problemas" href="/es/help/troubleshooting" icon="wrench">
    Problemas comunes y cómo resolverlos.
  </Card>
</CardGroup>
