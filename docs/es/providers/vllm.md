---
read_when:
    - Quieres ejecutar OpenClaw con un servidor vLLM local
    - Quieres endpoints `/v1` compatibles con OpenAI con tus propios modelos
summary: Ejecuta OpenClaw con vLLM (servidor local compatible con OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-07-05T11:38:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 98d1044c0a82efb6c9937e961d765d0cfcea8664cbaa043168921b457756512c
    source_path: providers/vllm.md
    workflow: 16
---

vLLM sirve modelos de código abierto (y algunos personalizados) mediante una API HTTP **compatible con OpenAI**. OpenClaw se conecta usando la API `openai-completions` y puede **descubrir automáticamente** modelos cuando lo habilitas con `VLLM_API_KEY`.

| Propiedad        | Valor                                      |
| ---------------- | ------------------------------------------ |
| ID de proveedor  | `vllm`                                     |
| API              | `openai-completions` (compatible con OpenAI) |
| Autenticación    | variable de entorno `VLLM_API_KEY`         |
| URL base predeterminada | `http://127.0.0.1:8000/v1`          |
| Uso en streaming | Compatible (`stream_options.include_usage`) |

## Primeros pasos

<Steps>
  <Step title="Iniciar vLLM con un servidor compatible con OpenAI">
    Tu URL base debe exponer endpoints `/v1` (`/v1/models`, `/v1/chat/completions`). vLLM suele ejecutarse en:

    ```text
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="Configurar la variable de entorno de clave de API">
    Cualquier valor no vacío funciona si tu servidor no exige autenticación:

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="Seleccionar un modelo">
    Sustitúyelo por uno de tus IDs de modelo de vLLM:

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

<Tip>
Para una configuración no interactiva (CI, scripts), pasa la URL base, la clave y el modelo directamente:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice vllm \
  --custom-base-url "http://127.0.0.1:8000/v1" \
  --custom-api-key "vllm-local" \
  --custom-model-id "your-model-id"
```

</Tip>

## Descubrimiento de modelos (proveedor implícito)

Cuando `VLLM_API_KEY` está configurado (o existe un perfil de autenticación) y `models.providers.vllm` **no** está definido, OpenClaw consulta `GET http://127.0.0.1:8000/v1/models` y convierte los IDs devueltos en entradas de modelo.

<Note>
Si configuras `models.providers.vllm` explícitamente, OpenClaw usa solo los modelos que declaraste. Agrega `"vllm/*": {}` a `agents.defaults.models` para hacer que OpenClaw también consulte el endpoint `/models` de ese proveedor configurado e incluya todos los modelos vLLM anunciados.
</Note>

## Configuración explícita

Configura explícitamente cuando vLLM se ejecute en otro host o puerto, quieras fijar `contextWindow`/`maxTokens`, tu servidor requiera una clave de API real, o te conectes a un endpoint de loopback, LAN o Tailscale de confianza:

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        timeoutSeconds: 300, // Optional: extend request timeout for slow local models
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

Para mantener el proveedor dinámico sin listar todos los modelos, agrega un comodín al catálogo de modelos visible:

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
    vLLM se trata como un backend `/v1` compatible con OpenAI de estilo proxy, no como un endpoint nativo de OpenAI:

    | Comportamiento                         | ¿Aplicado?                       |
    | --------------------------------------- | -------------------------------- |
    | Formato nativo de solicitudes de OpenAI | No                               |
    | `service_tier`                          | No se envía                      |
    | `store` de Responses                    | No se envía                      |
    | Sugerencias de caché de prompts         | No se envía                      |
    | Formato de payload compatible con razonamiento de OpenAI | No se aplica |
    | Encabezados ocultos de atribución de OpenClaw | No se inyectan en URLs base personalizadas |

  </Accordion>

  <Accordion title="Controles de pensamiento de Qwen">
    Para modelos Qwen, configura `compat.thinkingFormat: "qwen-chat-template"` en la fila del modelo cuando el servidor espere kwargs de plantilla de chat de Qwen. Estos modelos exponen un perfil binario `/think` (`off`, `on`) porque el pensamiento de plantilla de chat de Qwen es un interruptor activado/desactivado, no una escala de esfuerzo al estilo OpenAI.

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

    Los niveles de pensamiento que no son `off` envían `enable_thinking: true`. Si tu endpoint espera en cambio flags de nivel superior al estilo DashScope, usa `compat.thinkingFormat: "qwen"` para enviar `enable_thinking` en la raíz de la solicitud.

  </Accordion>

  <Accordion title="Controles de pensamiento de Nemotron 3">
    Para modelos `vllm/nemotron-3-*` con el pensamiento desactivado, el Plugin incluido envía:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "force_nonempty_content": true
      }
    }
    ```

    Para personalizar estos valores, configura `chat_template_kwargs` bajo los parámetros del modelo. Si también configuras `params.extra_body.chat_template_kwargs`, ese valor prevalece porque `extra_body` es la última sobrescritura del cuerpo de la solicitud.

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
    Primero confirma que vLLM se haya iniciado con el parser de llamadas a herramientas y la plantilla de chat correctos para el modelo. La documentación de vLLM indica `hermes` para modelos Qwen2.5 y `qwen3_xml` para modelos Qwen3-Coder.

    Síntomas: las Skills/herramientas nunca se ejecutan, el asistente imprime JSON/XML sin procesar como `{"name":"read","arguments":...}`, o vLLM devuelve un array `tool_calls` vacío cuando OpenClaw envía `tool_choice: "auto"`.

    Algunas combinaciones de Qwen/vLLM devuelven llamadas a herramientas estructuradas solo cuando la solicitud usa `tool_choice: "required"`. Fuerza esto por modelo con `params.extra_body`:

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

    Sustituye el ID del modelo por el ID exacto de `openclaw models list --provider vllm`, o aplica la misma sobrescritura desde la CLI:

    ```bash
    openclaw config set agents.defaults.models '{"vllm/Qwen-Qwen2.5-Coder-32B-Instruct":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
    ```

    Esta es una solución alternativa opcional: obliga a cada turno con herramientas a hacer una llamada a herramienta, así que úsala solo para una entrada de modelo dedicada donde eso sea aceptable. No la configures como valor predeterminado global para todos los modelos vLLM, y no la combines con un proxy que convierta texto arbitrario del asistente en llamadas a herramientas ejecutables.

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
    Para modelos locales grandes, hosts LAN remotos o enlaces de tailnet, configura un timeout de solicitud con alcance de proveedor:

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

    `timeoutSeconds` se aplica solo a las solicitudes HTTP de modelos vLLM: establecimiento de conexión, encabezados de respuesta, streaming del cuerpo y cancelación total de la obtención protegida. También eleva el límite del watchdog de inactividad/streaming de LLM por encima del valor predeterminado implícito de ~120 s para este proveedor. Prefiere esto antes que aumentar `agents.defaults.timeoutSeconds`, que controla toda la ejecución del agente.

  </Accordion>

  <Accordion title="Servidor no accesible">
    Comprueba que el servidor vLLM esté ejecutándose y sea accesible:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    Si ves un error de conexión, verifica el host, el puerto y que vLLM se haya iniciado en modo servidor compatible con OpenAI. OpenClaw confía en el origen exacto configurado en `models.providers.vllm.baseUrl` para solicitudes de modelo protegidas en endpoints de loopback, LAN y Tailscale. Los orígenes metadata/link-local permanecen bloqueados sin habilitación explícita. Configura `models.providers.vllm.request.allowPrivateNetwork: true` solo cuando las solicitudes de vLLM deban llegar a otro origen privado, o `false` para deshabilitar la confianza en el origen exacto.

  </Accordion>

  <Accordion title="Errores de autenticación en solicitudes">
    Si las solicitudes fallan con errores de autenticación, configura una `VLLM_API_KEY` real que coincida con la configuración de tu servidor, o configura el proveedor explícitamente bajo `models.providers.vllm`.

    <Tip>
    Si tu servidor vLLM no exige autenticación, cualquier valor no vacío para `VLLM_API_KEY` funciona como señal de habilitación para OpenClaw.
    </Tip>

  </Accordion>

  <Accordion title="No se descubren modelos">
    El descubrimiento automático requiere que `VLLM_API_KEY` esté configurado. Si has definido `models.providers.vllm`, OpenClaw usa solo los modelos que declaraste, salvo que `agents.defaults.models` incluya `"vllm/*": {}`.
  </Accordion>

  <Accordion title="Las herramientas se renderizan como texto sin procesar">
    Si un modelo Qwen imprime sintaxis de herramienta JSON/XML en lugar de ejecutar una Skill:

    - Inicia vLLM con el parser/plantilla correctos para ese modelo.
    - Confirma el ID exacto del modelo con `openclaw models list --provider vllm`.
    - Agrega una sobrescritura dedicada por modelo `params.extra_body.tool_choice: "required"` solo si `tool_choice: "auto"` aún devuelve llamadas a herramientas vacías o solo texto.

  </Accordion>
</AccordionGroup>

<Warning>
Más ayuda: [Solución de problemas](/es/help/troubleshooting) y [Preguntas frecuentes](/es/help/faq).
</Warning>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelo" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, referencias de modelo y comportamiento de failover.
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
