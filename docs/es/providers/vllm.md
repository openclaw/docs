---
read_when:
    - Desea ejecutar OpenClaw con un servidor vLLM local
    - Quieres endpoints /v1 compatibles con OpenAI con tus propios modelos
summary: Ejecuta OpenClaw con vLLM (servidor local compatible con OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-05-13T05:33:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3b58fc0694fa9629ae87b6958d1ab39e484d468e6f92346f39f55316dbc09a04
    source_path: providers/vllm.md
    workflow: 16
---

vLLM puede servir modelos de código abierto (y algunos personalizados) mediante una API HTTP **compatible con OpenAI**. OpenClaw se conecta a vLLM usando la API `openai-completions`.

OpenClaw también puede **detectar automáticamente** los modelos disponibles de vLLM cuando lo habilitas con `VLLM_API_KEY` (cualquier valor funciona si tu servidor no exige autenticación). Usa `vllm/*` en `agents.defaults.models` para mantener la detección dinámica cuando también configures una URL base personalizada de vLLM.

OpenClaw trata `vllm` como un proveedor local compatible con OpenAI que admite
contabilidad de uso en streaming, por lo que los recuentos de tokens de estado/contexto pueden actualizarse a partir de
respuestas `stream_options.include_usage`.

| Propiedad        | Valor                                    |
| ---------------- | ---------------------------------------- |
| ID del proveedor | `vllm`                                   |
| API              | `openai-completions` (compatible con OpenAI) |
| Autenticación    | variable de entorno `VLLM_API_KEY`       |
| URL base predeterminada | `http://127.0.0.1:8000/v1`        |

## Primeros pasos

<Steps>
  <Step title="Start vLLM with an OpenAI-compatible server">
    Tu URL base debe exponer endpoints `/v1` (por ejemplo, `/v1/models`, `/v1/chat/completions`). vLLM se ejecuta comúnmente en:

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="Set the API key environment variable">
    Cualquier valor funciona si tu servidor no exige autenticación:

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="Select a model">
    Reemplázalo por uno de tus IDs de modelo de vLLM:

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
  <Step title="Verify the model is available">
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

y convierte los IDs devueltos en entradas de modelo.

<Note>
Si configuras `models.providers.vllm` explícitamente, OpenClaw usa tus modelos declarados de forma predeterminada. Añade `"vllm/*": {}` a `agents.defaults.models` cuando quieras que OpenClaw consulte el endpoint `/models` de ese proveedor configurado e incluya todos los modelos de vLLM anunciados.
</Note>

## Configuración explícita (modelos manuales)

Usa configuración explícita cuando:

- vLLM se ejecute en un host o puerto diferente
- Quieras fijar valores de `contextWindow` o `maxTokens`
- Tu servidor requiera una clave de API real (o quieras controlar los encabezados)
- Te conectes a un endpoint de vLLM de loopback de confianza, LAN o Tailscale

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

Para mantener este proveedor dinámico sin listar manualmente cada modelo, añade un comodín de proveedor
al catálogo de modelos visible:

```json5
{
  agents: {
    defaults: {
      models: {
        "vllm/*": {},
      },
    },
  },
}
```

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Proxy-style behavior">
    vLLM se trata como un backend `/v1` compatible con OpenAI de estilo proxy, no como un endpoint
    nativo de OpenAI. Esto significa:

    | Comportamiento | ¿Aplicado? |
    |----------|----------|
    | Conformación de solicitudes nativas de OpenAI | No |
    | `service_tier` | No se envía |
    | `store` de Responses | No se envía |
    | Sugerencias de caché de prompts | No se envían |
    | Conformación de payload de compatibilidad con razonamiento de OpenAI | No se aplica |
    | Encabezados ocultos de atribución de OpenClaw | No se inyectan en URL base personalizadas |

  </Accordion>

  <Accordion title="Qwen thinking controls">
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
    espera flags de nivel superior al estilo DashScope en su lugar, usa
    `params.qwenThinkingFormat: "top-level"` para enviar `enable_thinking` en la
    raíz de la solicitud. También se acepta `params.qwen_thinking_format` en snake-case.

  </Accordion>

  <Accordion title="Nemotron 3 thinking controls">
    vLLM/Nemotron 3 puede usar kwargs de plantilla de chat para controlar si el razonamiento se
    devuelve como razonamiento oculto o como texto de respuesta visible. Cuando una sesión de OpenClaw
    usa `vllm/nemotron-3-*` con pensamiento desactivado, el Plugin de vLLM incluido envía:

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
    precedencia final porque `extra_body` es la última anulación del cuerpo de la solicitud.

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

  <Accordion title="Qwen tool calls appear as text">
    Primero asegúrate de que vLLM se haya iniciado con el analizador de llamadas a herramientas y la plantilla de chat
    correctos para el modelo. Por ejemplo, vLLM documenta `hermes` para modelos Qwen2.5
    y `qwen3_xml` para modelos Qwen3-Coder.

    Síntomas:

    - las Skills o herramientas nunca se ejecutan
    - el asistente imprime JSON/XML sin procesar, como `{"name":"read","arguments":...}`
    - vLLM devuelve un arreglo `tool_calls` vacío cuando OpenClaw envía
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

    Reemplaza `Qwen-Qwen2.5-Coder-32B-Instruct` por el id exacto devuelto por:

    ```bash
    openclaw models list --provider vllm
    ```

    Puedes aplicar la misma anulación desde la CLI:

    ```bash
    openclaw config set agents.defaults.models '{"vllm/Qwen-Qwen2.5-Coder-32B-Instruct":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
    ```

    Esta es una solución de compatibilidad opcional. Hace que cada turno de modelo con
    herramientas requiera una llamada a herramienta, así que úsala solo para una entrada de modelo local dedicada
    donde ese comportamiento sea aceptable. No la uses como valor predeterminado global para todos los
    modelos de vLLM, y no uses un proxy que convierta a ciegas texto arbitrario del
    asistente en llamadas a herramientas ejecutables.

  </Accordion>

  <Accordion title="Custom base URL">
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
  <Accordion title="Slow first response or remote server timeout">
    Para modelos locales grandes, hosts LAN remotos o enlaces tailnet, configura un
    tiempo de espera de solicitud con alcance de proveedor:

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

    `timeoutSeconds` se aplica solo a las solicitudes HTTP de modelos de vLLM, incluida la
    configuración de la conexión, los encabezados de respuesta, el streaming del cuerpo y la cancelación total
    de guarded-fetch. Prefiere esto antes de aumentar
    `agents.defaults.timeoutSeconds`, que controla toda la ejecución del agente.

  </Accordion>

  <Accordion title="Server not reachable">
    Comprueba que el servidor vLLM se esté ejecutando y sea accesible:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    Si ves un error de conexión, verifica el host, el puerto y que vLLM se haya iniciado con el modo de servidor compatible con OpenAI.
    Para endpoints explícitos de loopback, LAN o Tailscale, configura también
    `models.providers.vllm.request.allowPrivateNetwork: true`; las solicitudes del proveedor
    bloquean las URL de red privada de forma predeterminada a menos que el proveedor sea
    explícitamente de confianza.

  </Accordion>

  <Accordion title="Auth errors on requests">
    Si las solicitudes fallan con errores de autenticación, configura un `VLLM_API_KEY` real que coincida con la configuración de tu servidor, o configura el proveedor explícitamente en `models.providers.vllm`.

    <Tip>
    Si tu servidor vLLM no exige autenticación, cualquier valor no vacío para `VLLM_API_KEY` funciona como señal de habilitación para OpenClaw.
    </Tip>

  </Accordion>

  <Accordion title="No models discovered">
    La detección automática requiere que `VLLM_API_KEY` esté configurado. Si has definido `models.providers.vllm`, OpenClaw usa solo tus modelos declarados a menos que `agents.defaults.models` incluya `"vllm/*": {}`.
  </Accordion>

  <Accordion title="Tools render as raw text">
    Si un modelo Qwen imprime sintaxis de herramientas JSON/XML en lugar de ejecutar una skill,
    revisa la guía de Qwen en Configuración avanzada arriba. La solución habitual es:

    - iniciar vLLM con el analizador/plantilla correctos para ese modelo
    - confirmar el id exacto del modelo con `openclaw models list --provider vllm`
    - añadir una anulación dedicada por modelo `params.extra_body.tool_choice: "required"`
      solo si `tool_choice: "auto"` todavía devuelve llamadas a herramientas vacías o solo texto

  </Accordion>
</AccordionGroup>

<Warning>
Más ayuda: [Solución de problemas](/es/help/troubleshooting) y [Preguntas frecuentes](/es/help/faq).
</Warning>

## Relacionado

<CardGroup cols={2}>
  <Card title="Model selection" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, refs de modelo y comportamiento de conmutación por error.
  </Card>
  <Card title="OpenAI" href="/es/providers/openai" icon="bolt">
    Proveedor nativo de OpenAI y comportamiento de rutas compatibles con OpenAI.
  </Card>
  <Card title="OAuth and auth" href="/es/gateway/authentication" icon="key">
    Detalles de autenticación y reglas de reutilización de credenciales.
  </Card>
  <Card title="Troubleshooting" href="/es/help/troubleshooting" icon="wrench">
    Problemas comunes y cómo resolverlos.
  </Card>
</CardGroup>
