---
read_when:
    - Quieres ejecutar OpenClaw contra un servidor local de vLLM
    - Quieres endpoints `/v1` compatibles con OpenAI con tus propios modelos
summary: Ejecuta OpenClaw con vLLM (servidor local compatible con OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-04-26T11:37:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: fbf424cb532f2b3e188c39545b187e5db6274ff2fadc01c9e4cb0901dbe9824c
    source_path: providers/vllm.md
    workflow: 15
---

vLLM puede servir modelos de código abierto (y algunos personalizados) mediante una API HTTP **compatible con OpenAI**. OpenClaw se conecta a vLLM usando la API `openai-completions`.

OpenClaw también puede **descubrir automáticamente** los modelos disponibles desde vLLM cuando optas por ello con `VLLM_API_KEY` (cualquier valor funciona si tu servidor no exige autenticación) y no defines una entrada explícita `models.providers.vllm`.

OpenClaw trata `vllm` como un proveedor local compatible con OpenAI que admite
contabilidad de uso en streaming, por lo que los recuentos de tokens de estado/contexto pueden actualizarse a partir de
las respuestas de `stream_options.include_usage`.

| Propiedad        | Valor                                    |
| ---------------- | ---------------------------------------- |
| ID del proveedor | `vllm`                                   |
| API              | `openai-completions` (compatible con OpenAI) |
| Autenticación    | Variable de entorno `VLLM_API_KEY`       |
| URL base predeterminada | `http://127.0.0.1:8000/v1`         |

## Primeros pasos

<Steps>
  <Step title="Inicia vLLM con un servidor compatible con OpenAI">
    Tu URL base debe exponer endpoints `/v1` (por ejemplo, `/v1/models`, `/v1/chat/completions`). vLLM suele ejecutarse en:

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="Establece la variable de entorno de la clave API">
    Cualquier valor funciona si tu servidor no exige autenticación:

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="Selecciona un modelo">
    Sustitúyelo por uno de los ID de modelo de tu vLLM:

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
  <Step title="Verifica que el modelo esté disponible">
    ```bash
    openclaw models list --provider vllm
    ```
  </Step>
</Steps>

## Descubrimiento de modelos (proveedor implícito)

Cuando `VLLM_API_KEY` está configurada (o existe un perfil de autenticación) y **no** defines `models.providers.vllm`, OpenClaw consulta:

```
GET http://127.0.0.1:8000/v1/models
```

y convierte los ID devueltos en entradas de modelo.

<Note>
Si configuras `models.providers.vllm` explícitamente, se omite el descubrimiento automático y debes definir los modelos manualmente.
</Note>

## Configuración explícita (modelos manuales)

Usa configuración explícita cuando:

- vLLM se ejecuta en un host o puerto diferente
- Quieres fijar los valores de `contextWindow` o `maxTokens`
- Tu servidor requiere una clave API real (o quieres controlar los encabezados)
- Te conectas a un endpoint de vLLM confiable de loopback, LAN o Tailscale

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        request: { allowPrivateNetwork: true },
        models: [
          {
            id: "your-model-id",
            name: "Modelo local de vLLM",
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
  <Accordion title="Comportamiento de tipo proxy">
    vLLM se trata como un backend `/v1` compatible con OpenAI de tipo proxy, no como un endpoint nativo de
    OpenAI. Esto significa:

    | Comportamiento | ¿Se aplica? |
    |----------|----------|
    | Formato nativo de solicitudes de OpenAI | No |
    | `service_tier` | No se envía |
    | `store` en las respuestas | No se envía |
    | Sugerencias de caché de prompts | No se envían |
    | Formato de carga útil de compatibilidad con reasoning de OpenAI | No se aplica |
    | Encabezados ocultos de atribución de OpenClaw | No se inyectan en URLs base personalizadas |

  </Accordion>

  <Accordion title="Controles de pensamiento de Nemotron 3">
    vLLM/Nemotron 3 puede usar kwargs de plantillas de chat para controlar si el reasoning se
    devuelve como reasoning oculto o como texto visible de respuesta. Cuando una sesión de OpenClaw
    usa `vllm/nemotron-3-*` con thinking desactivado, OpenClaw envía:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "force_nonempty_content": true
      }
    }
    ```

    Para personalizar estos valores, configura `chat_template_kwargs` en los parámetros del modelo.
    Si también configuras `params.extra_body.chat_template_kwargs`, ese valor tiene
    precedencia final porque `extra_body` es la última sobrescritura del cuerpo de la solicitud.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "vllm/nemotron-3-super": {
              params: {
                chat_template_kwargs: {
                  enable_thinking: false,
                  force_nonempty_content: true,
                },
              },
            },
          },
        },
      },
    }
    ```

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
            request: { allowPrivateNetwork: true },
            models: [
              {
                id: "my-custom-model",
                name: "Modelo remoto de vLLM",
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

## Resolución de problemas

<AccordionGroup>
  <Accordion title="No se puede acceder al servidor">
    Comprueba que el servidor vLLM esté en ejecución y accesible:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    Si ves un error de conexión, verifica el host, el puerto y que vLLM se haya iniciado en modo de servidor compatible con OpenAI.
    Para endpoints explícitos de loopback, LAN o Tailscale, configura también
    `models.providers.vllm.request.allowPrivateNetwork: true`; las solicitudes del proveedor
    bloquean las URL de red privada de forma predeterminada a menos que el proveedor sea
    explícitamente confiable.

  </Accordion>

  <Accordion title="Errores de autenticación en las solicitudes">
    Si las solicitudes fallan con errores de autenticación, configura una `VLLM_API_KEY` real que coincida con la configuración de tu servidor, o configura el proveedor explícitamente en `models.providers.vllm`.

    <Tip>
    Si tu servidor vLLM no exige autenticación, cualquier valor no vacío para `VLLM_API_KEY` funciona como señal de activación para OpenClaw.
    </Tip>

  </Accordion>

  <Accordion title="No se descubrieron modelos">
    El descubrimiento automático requiere que `VLLM_API_KEY` esté configurada **y** que no exista una entrada de configuración explícita `models.providers.vllm`. Si has definido el proveedor manualmente, OpenClaw omite el descubrimiento y usa solo los modelos que has declarado.
  </Accordion>
</AccordionGroup>

<Warning>
Más ayuda: [Resolución de problemas](/es/help/troubleshooting) y [Preguntas frecuentes](/es/help/faq).
</Warning>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelo" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelo y comportamiento de conmutación por error.
  </Card>
  <Card title="OpenAI" href="/es/providers/openai" icon="bolt">
    Proveedor nativo de OpenAI y comportamiento de la ruta compatible con OpenAI.
  </Card>
  <Card title="OAuth y autenticación" href="/es/gateway/authentication" icon="key">
    Detalles de autenticación y reglas de reutilización de credenciales.
  </Card>
  <Card title="Resolución de problemas" href="/es/help/troubleshooting" icon="wrench">
    Problemas habituales y cómo resolverlos.
  </Card>
</CardGroup>
