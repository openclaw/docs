---
read_when:
    - Desea ejecutar OpenClaw con un servidor vLLM local
    - Quieres puntos de conexión /v1 compatibles con OpenAI con tus propios modelos
summary: Ejecutar OpenClaw con vLLM (servidor local compatible con OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-04-30T05:59:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: b638341b5138d085ed3fa781300216d5bae58b9d7e3a9edfe6cbdcdbc379c2ce
    source_path: providers/vllm.md
    workflow: 16
---

vLLM puede servir modelos de código abierto (y algunos personalizados) mediante una API HTTP **compatible con OpenAI**. OpenClaw se conecta a vLLM usando la API `openai-completions`.

OpenClaw también puede **detectar automáticamente** los modelos disponibles de vLLM cuando lo habilitas con `VLLM_API_KEY` (cualquier valor funciona si tu servidor no exige autenticación) y no defines una entrada explícita `models.providers.vllm`.

OpenClaw trata `vllm` como un proveedor local compatible con OpenAI que admite
cómputo de uso en streaming, por lo que los conteos de tokens de estado/contexto pueden actualizarse a partir de
respuestas `stream_options.include_usage`.

| Propiedad                | Valor                                           |
| ------------------------ | ----------------------------------------------- |
| ID del proveedor         | `vllm`                                          |
| API                      | `openai-completions` (compatible con OpenAI)    |
| Autenticación            | variable de entorno `VLLM_API_KEY`              |
| URL base predeterminada  | `http://127.0.0.1:8000/v1`                      |

## Primeros pasos

<Steps>
  <Step title="Iniciar vLLM con un servidor compatible con OpenAI">
    Tu URL base debe exponer endpoints `/v1` (por ejemplo, `/v1/models`, `/v1/chat/completions`). vLLM suele ejecutarse en:

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="Configurar la variable de entorno de la clave de API">
    Cualquier valor funciona si tu servidor no exige autenticación:

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="Seleccionar un modelo">
    Sustitúyelo por uno de tus ID de modelo de vLLM:

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

Cuando `VLLM_API_KEY` está configurada (o existe un perfil de autenticación) y **no** defines `models.providers.vllm`, OpenClaw consulta:

```
GET http://127.0.0.1:8000/v1/models
```

y convierte los ID devueltos en entradas de modelo.

<Note>
Si configuras `models.providers.vllm` explícitamente, se omite la detección automática y debes definir los modelos manualmente.
</Note>

## Configuración explícita (modelos manuales)

Usa una configuración explícita cuando:

- vLLM se ejecute en otro host o puerto
- Quieras fijar valores de `contextWindow` o `maxTokens`
- Tu servidor requiera una clave de API real (o quieras controlar los encabezados)
- Te conectes a un endpoint de vLLM de confianza mediante loopback, LAN o Tailscale

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        request: { allowPrivateNetwork: true },
        timeoutSeconds: 300, // Optional: extend connect/header/body/request timeout for slow local models
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

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Comportamiento de estilo proxy">
    vLLM se trata como un backend `/v1` compatible con OpenAI de estilo proxy, no como un endpoint
    nativo de OpenAI. Esto significa:

    | Comportamiento | ¿Se aplica? |
    |----------|----------|
    | Modelado de solicitud nativo de OpenAI | No |
    | `service_tier` | No se envía |
    | `store` de Responses | No se envía |
    | Sugerencias de caché de prompts | No se envían |
    | Modelado de payload compatible con reasoning de OpenAI | No se aplica |
    | Encabezados ocultos de atribución de OpenClaw | No se inyectan en URL base personalizadas |

  </Accordion>

  <Accordion title="Controles de pensamiento de Qwen">
    Para modelos Qwen servidos mediante vLLM, configura
    `params.qwenThinkingFormat: "chat-template"` en la entrada del modelo cuando el
    servidor espere kwargs de plantilla de chat de Qwen. OpenClaw asigna `/think off` a:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "preserve_thinking": true
      }
    }
    ```

    Los niveles de pensamiento distintos de `off` envían `enable_thinking: true`. Si tu endpoint
    espera en su lugar flags de nivel superior de estilo DashScope, usa
    `params.qwenThinkingFormat: "top-level"` para enviar `enable_thinking` en la
    raíz de la solicitud. También se acepta `params.qwen_thinking_format` en snake case.

  </Accordion>

  <Accordion title="Controles de pensamiento de Nemotron 3">
    vLLM/Nemotron 3 puede usar kwargs de plantilla de chat para controlar si el reasoning se
    devuelve como reasoning oculto o como texto de respuesta visible. Cuando una sesión de OpenClaw
    usa `vllm/nemotron-3-*` con el pensamiento desactivado, el Plugin de vLLM incluido envía:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "force_nonempty_content": true
      }
    }
    ```

    Para personalizar estos valores, configura `chat_template_kwargs` bajo los parámetros del modelo.
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

  <Accordion title="Las llamadas a herramientas de Qwen aparecen como texto">
    Primero asegúrate de que vLLM se haya iniciado con el parser de llamadas a herramientas y la
    plantilla de chat correctos para el modelo. Por ejemplo, vLLM documenta `hermes` para modelos
    Qwen2.5 y `qwen3_xml` para modelos Qwen3-Coder.

    Síntomas:

    - las skills o herramientas nunca se ejecutan
    - el asistente imprime JSON/XML sin procesar, como `{"name":"read","arguments":...}`
    - vLLM devuelve un array `tool_calls` vacío cuando OpenClaw envía
      `tool_choice: "auto"`

    Algunas combinaciones de Qwen/vLLM devuelven llamadas a herramientas estructuradas solo cuando la
    solicitud usa `tool_choice: "required"`. Para esas entradas de modelo, fuerza el
    campo de solicitud compatible con OpenAI con `params.extra_body`:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "vllm/Qwen-Qwen2.5-Coder-32B-Instruct": {
              params: {
                extra_body: {
                  tool_choice: "required",
                },
              },
            },
          },
        },
      },
    }
    ```

    Sustituye `Qwen-Qwen2.5-Coder-32B-Instruct` por el id exacto devuelto por:

    ```bash
    openclaw models list --provider vllm
    ```

    Puedes aplicar la misma sobrescritura desde la CLI:

    ```bash
    openclaw config set agents.defaults.models '{"vllm/Qwen-Qwen2.5-Coder-32B-Instruct":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
    ```

    Esta es una solución de compatibilidad opcional. Hace que cada turno del modelo con
    herramientas requiera una llamada a herramienta, así que úsala solo para una entrada de modelo local dedicada
    donde ese comportamiento sea aceptable. No la uses como valor predeterminado global para todos los
    modelos vLLM, y no uses un proxy que convierta a ciegas texto arbitrario del
    asistente en llamadas a herramientas ejecutables.

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
            timeoutSeconds: 300,
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
  <Accordion title="Primera respuesta lenta o timeout del servidor remoto">
    Para modelos locales grandes, hosts LAN remotos o enlaces tailnet, configura un
    timeout de solicitud con alcance de proveedor:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:8000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            request: { allowPrivateNetwork: true },
            timeoutSeconds: 300,
            models: [{ id: "your-model-id", name: "Local vLLM Model" }],
          },
        },
      },
    }
    ```

    `timeoutSeconds` se aplica solo a las solicitudes HTTP de modelos vLLM, incluido el
    establecimiento de conexión, los encabezados de respuesta, el streaming del cuerpo y la cancelación total
    de guarded-fetch. Prefiere esto antes de aumentar
    `agents.defaults.timeoutSeconds`, que controla toda la ejecución del agente.

  </Accordion>

  <Accordion title="No se puede acceder al servidor">
    Comprueba que el servidor vLLM esté en ejecución y accesible:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    Si ves un error de conexión, verifica el host, el puerto y que vLLM se haya iniciado con el modo de servidor compatible con OpenAI.
    Para endpoints explícitos de loopback, LAN o Tailscale, configura también
    `models.providers.vllm.request.allowPrivateNetwork: true`; las solicitudes del proveedor
    bloquean las URL de red privada de forma predeterminada a menos que el proveedor sea
    explícitamente de confianza.

  </Accordion>

  <Accordion title="Errores de autenticación en solicitudes">
    Si las solicitudes fallan con errores de autenticación, configura una `VLLM_API_KEY` real que coincida con la configuración de tu servidor, o configura el proveedor explícitamente bajo `models.providers.vllm`.

    <Tip>
    Si tu servidor vLLM no exige autenticación, cualquier valor no vacío para `VLLM_API_KEY` funciona como señal de activación para OpenClaw.
    </Tip>

  </Accordion>

  <Accordion title="No se detectan modelos">
    La detección automática requiere que `VLLM_API_KEY` esté configurada **y** que no haya una entrada de configuración explícita `models.providers.vllm`. Si has definido el proveedor manualmente, OpenClaw omite la detección y usa solo los modelos declarados.
  </Accordion>

  <Accordion title="Las herramientas se representan como texto sin procesar">
    Si un modelo Qwen imprime sintaxis de herramientas JSON/XML en lugar de ejecutar una skill,
    consulta la guía de Qwen en Configuración avanzada más arriba. La corrección habitual es:

    - iniciar vLLM con el parser/plantilla correctos para ese modelo
    - confirmar el id exacto del modelo con `openclaw models list --provider vllm`
    - añadir una sobrescritura dedicada por modelo `params.extra_body.tool_choice: "required"`
      solo si `tool_choice: "auto"` sigue devolviendo llamadas a herramientas vacías o solo como texto

  </Accordion>
</AccordionGroup>

<Warning>
Más ayuda: [Solución de problemas](/es/help/troubleshooting) y [FAQ](/es/help/faq).
</Warning>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelo" href="/es/concepts/model-providers" icon="layers">
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
