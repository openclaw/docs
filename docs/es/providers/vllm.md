---
read_when:
    - Quieres ejecutar OpenClaw con un servidor vLLM local
    - Quieres endpoints /v1 compatibles con OpenAI con tus propios modelos
summary: Ejecutar OpenClaw con vLLM (servidor local compatible con OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-06-27T12:45:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a3a5da5ce359bf62c44cddd0c97d2852d98c996ad6d44552a68d4aeb4d1d2893
    source_path: providers/vllm.md
    workflow: 16
---

vLLM puede servir modelos de código abierto (y algunos personalizados) mediante una API HTTP **compatible con OpenAI**. OpenClaw se conecta a vLLM usando la API `openai-completions`.

OpenClaw también puede **descubrir automáticamente** los modelos disponibles desde vLLM cuando lo activas con `VLLM_API_KEY` (cualquier valor funciona si tu servidor no exige autenticación). Usa `vllm/*` en `agents.defaults.models` para mantener el descubrimiento dinámico cuando también configuras una URL base personalizada de vLLM.

OpenClaw trata `vllm` como un proveedor local compatible con OpenAI que admite
contabilidad de uso en streaming, por lo que los recuentos de tokens de estado/contexto pueden actualizarse desde
respuestas `stream_options.include_usage`.

| Propiedad        | Valor                                    |
| ---------------- | ---------------------------------------- |
| ID de proveedor  | `vllm`                                   |
| API              | `openai-completions` (compatible con OpenAI) |
| Autenticación    | variable de entorno `VLLM_API_KEY`       |
| URL base predeterminada | `http://127.0.0.1:8000/v1`         |

## Primeros pasos

<Steps>
  <Step title="Inicia vLLM con un servidor compatible con OpenAI">
    Tu URL base debe exponer endpoints `/v1` (por ejemplo, `/v1/models`, `/v1/chat/completions`). vLLM suele ejecutarse en:

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="Configura la variable de entorno de la clave de API">
    Cualquier valor funciona si tu servidor no exige autenticación:

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="Selecciona un modelo">
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
Si configuras `models.providers.vllm` explícitamente, OpenClaw usa de forma predeterminada los modelos que declaraste. Añade `"vllm/*": {}` a `agents.defaults.models` cuando quieras que OpenClaw consulte el endpoint `/models` de ese proveedor configurado e incluya todos los modelos vLLM anunciados.
</Note>

## Configuración explícita (modelos manuales)

Usa una configuración explícita cuando:

- vLLM se ejecute en otro host o puerto
- Quieras fijar valores de `contextWindow` o `maxTokens`
- Tu servidor requiera una clave de API real (o quieras controlar encabezados)
- Te conectes a un endpoint vLLM de loopback, LAN o Tailscale de confianza

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
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

Para mantener este proveedor dinámico sin enumerar manualmente cada modelo, añade un
comodín de proveedor al catálogo de modelos visible:

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
  <Accordion title="Comportamiento de estilo proxy">
    vLLM se trata como un backend `/v1` compatible con OpenAI de estilo proxy, no como un endpoint
    nativo de OpenAI. Esto significa:

    | Comportamiento | ¿Se aplica? |
    |----------|----------|
    | Conformación de solicitudes nativas de OpenAI | No |
    | `service_tier` | No se envía |
    | `store` de Responses | No se envía |
    | Sugerencias de caché de prompts | No se envían |
    | Conformación de payloads de compatibilidad de razonamiento de OpenAI | No se aplica |
    | Encabezados ocultos de atribución de OpenClaw | No se inyectan en URL base personalizadas |

  </Accordion>

  <Accordion title="Controles de pensamiento de Qwen">
    Para modelos Qwen servidos mediante vLLM, configura
    `compat.thinkingFormat: "qwen-chat-template"` en la fila del modelo del proveedor configurado
    cuando el servidor espere kwargs de plantilla de chat de Qwen. Los modelos
    configurados de esta forma exponen un perfil binario `/think` (`off`, `on`) porque
    el pensamiento de la plantilla de Qwen es una marca de solicitud activado/desactivado, no una
    escala de esfuerzo al estilo OpenAI.

    ```json5
    {
      models: {
        providers: {
          vllm: {
            models: [
              {
                id: "Qwen/Qwen3-8B",
                name: "Qwen3 8B",
                reasoning: true,
                compat: { thinkingFormat: "qwen-chat-template" },
              },
            ],
          },
        },
      },
    }
    ```

    OpenClaw asigna `/think off` a:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "preserve_thinking": true
      }
    }
    ```

    Los niveles de pensamiento distintos de `off` envían `enable_thinking: true`. Si tu endpoint
    espera en cambio marcas de nivel superior al estilo DashScope, usa
    `compat.thinkingFormat: "qwen"` para enviar `enable_thinking` en la raíz de la
    solicitud.

  </Accordion>

  <Accordion title="Controles de pensamiento de Nemotron 3">
    vLLM/Nemotron 3 puede usar kwargs de plantilla de chat para controlar si el razonamiento se
    devuelve como razonamiento oculto o como texto de respuesta visible. Cuando una sesión de OpenClaw
    usa `vllm/nemotron-3-*` con el pensamiento desactivado, el Plugin vLLM incluido envía:

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
    Primero asegúrate de que vLLM se haya iniciado con el analizador de llamadas a herramientas y la
    plantilla de chat correctos para el modelo. Por ejemplo, vLLM documenta `hermes` para modelos
    Qwen2.5 y `qwen3_xml` para modelos Qwen3-Coder.

    Síntomas:

    - Skills o herramientas nunca se ejecutan
    - el asistente imprime JSON/XML sin procesar como `{"name":"read","arguments":...}`
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

    Sustituye `Qwen-Qwen2.5-Coder-32B-Instruct` por el ID exacto devuelto por:

    ```bash
    openclaw models list --provider vllm
    ```

    Puedes aplicar la misma sobrescritura desde la CLI:

    ```bash
    openclaw config set agents.defaults.models '{"vllm/Qwen-Qwen2.5-Coder-32B-Instruct":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
    ```

    Esta es una solución alternativa de compatibilidad opt-in. Hace que cada turno de modelo con
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
    Para modelos locales grandes, hosts de LAN remotos o enlaces de tailnet, configura un
    timeout de solicitud con alcance de proveedor:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:8000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            timeoutSeconds: 300,
            models: [{ id: "your-model-id", name: "Local vLLM Model" }],
          },
        },
      },
    }
    ```

    `timeoutSeconds` se aplica solo a las solicitudes HTTP de modelos vLLM, incluidos
    la configuración de conexión, los encabezados de respuesta, el streaming del cuerpo y la cancelación
    total de guarded-fetch. Prefiere esto antes de aumentar
    `agents.defaults.timeoutSeconds`, que controla toda la ejecución del agente.

  </Accordion>

  <Accordion title="Servidor no accesible">
    Comprueba que el servidor vLLM esté en ejecución y sea accesible:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    Si ves un error de conexión, verifica el host, el puerto y que vLLM se haya iniciado con el modo de servidor compatible con OpenAI.
    Para endpoints explícitos de loopback, LAN o Tailscale, OpenClaw confía en el
    origen exacto configurado en `models.providers.vllm.baseUrl` para solicitudes de modelo
    protegidas. Los orígenes de metadatos/link-local siguen bloqueados sin
    activación explícita. Configura `models.providers.vllm.request.allowPrivateNetwork: true` solo
    cuando las solicitudes de vLLM deban llegar a otro origen privado, y configúralo en `false`
    para optar por salir de la confianza en el origen exacto.

  </Accordion>

  <Accordion title="Errores de autenticación en solicitudes">
    Si las solicitudes fallan con errores de autenticación, configura una `VLLM_API_KEY` real que coincida con la configuración de tu servidor, o configura el proveedor explícitamente bajo `models.providers.vllm`.

    <Tip>
    Si tu servidor vLLM no exige autenticación, cualquier valor no vacío para `VLLM_API_KEY` funciona como señal opt-in para OpenClaw.
    </Tip>

  </Accordion>

  <Accordion title="No se descubren modelos">
    El descubrimiento automático requiere que `VLLM_API_KEY` esté configurada. Si has definido `models.providers.vllm`, OpenClaw usa solo tus modelos declarados a menos que `agents.defaults.models` incluya `"vllm/*": {}`.
  </Accordion>

  <Accordion title="Las herramientas se renderizan como texto sin procesar">
    Si un modelo Qwen imprime sintaxis de herramientas JSON/XML en lugar de ejecutar una skill,
    revisa la guía de Qwen en la Configuración avanzada anterior. La solución habitual es:

    - iniciar vLLM con el analizador/plantilla correctos para ese modelo
    - confirmar el ID exacto del modelo con `openclaw models list --provider vllm`
    - añadir una sobrescritura dedicada por modelo `params.extra_body.tool_choice: "required"`
      solo si `tool_choice: "auto"` todavía devuelve llamadas a herramientas vacías o solo texto

  </Accordion>
</AccordionGroup>

<Warning>
Más ayuda: [Solución de problemas](/es/help/troubleshooting) y [FAQ](/es/help/faq).
</Warning>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelo" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, referencias de modelo y comportamiento de conmutación por error.
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
