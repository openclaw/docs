---
read_when:
    - Quieres ejecutar OpenClaw con un servidor vLLM local
    - Quieres endpoints `/v1` compatibles con OpenAI y tus propios modelos
summary: Ejecutar OpenClaw con vLLM (servidor local compatible con OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-07-11T23:28:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 98d1044c0a82efb6c9937e961d765d0cfcea8664cbaa043168921b457756512c
    source_path: providers/vllm.md
    workflow: 16
---

vLLM sirve modelos de código abierto (y algunos personalizados) mediante una API HTTP **compatible con OpenAI**. OpenClaw se conecta mediante la API `openai-completions` y puede **detectar automáticamente** los modelos cuando habilitas esta opción con `VLLM_API_KEY`.

| Propiedad          | Valor                                      |
| ------------------ | ------------------------------------------ |
| ID del proveedor   | `vllm`                                     |
| API                | `openai-completions` (compatible con OpenAI) |
| Autenticación      | Variable de entorno `VLLM_API_KEY`         |
| URL base predeterminada | `http://127.0.0.1:8000/v1`            |
| Uso en transmisión | Compatible (`stream_options.include_usage`) |

## Primeros pasos

<Steps>
  <Step title="Inicia vLLM con un servidor compatible con OpenAI">
    Tu URL base debe exponer puntos de conexión `/v1` (`/v1/models`, `/v1/chat/completions`). vLLM suele ejecutarse en:

    ```text
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="Establece la variable de entorno de la clave de API">
    Cualquier valor no vacío funciona si tu servidor no exige autenticación:

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="Selecciona un modelo">
    Sustitúyelo por uno de los ID de modelo de vLLM:

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

<Tip>
Para una configuración no interactiva (CI, automatización mediante scripts), proporciona directamente la URL base, la clave y el modelo:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice vllm \
  --custom-base-url "http://127.0.0.1:8000/v1" \
  --custom-api-key "vllm-local" \
  --custom-model-id "your-model-id"
```

</Tip>

## Detección de modelos (proveedor implícito)

Cuando se establece `VLLM_API_KEY` (o existe un perfil de autenticación) y **no** se define `models.providers.vllm`, OpenClaw consulta `GET http://127.0.0.1:8000/v1/models` y convierte los ID devueltos en entradas de modelos.

<Note>
Si estableces `models.providers.vllm` explícitamente, OpenClaw utiliza únicamente los modelos que hayas declarado. Añade `"vllm/*": {}` a `agents.defaults.models` para que OpenClaw también consulte el punto de conexión `/models` de ese proveedor configurado e incluya todos los modelos de vLLM anunciados.
</Note>

## Configuración explícita

Configúralo explícitamente cuando vLLM se ejecute en otro host o puerto, quieras fijar `contextWindow`/`maxTokens`, el servidor requiera una clave de API real o te conectes a un punto de conexión local loopback, de LAN o de Tailscale de confianza:

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

Para mantener el proveedor dinámico sin enumerar todos los modelos, añade un comodín al catálogo de modelos visible:

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
  <Accordion title="Comportamiento de tipo proxy">
    vLLM se trata como un backend `/v1` de tipo proxy compatible con OpenAI, no como un punto de conexión nativo de OpenAI:

    | Comportamiento                                | ¿Se aplica?                         |
    | --------------------------------------------- | ----------------------------------- |
    | Estructuración nativa de solicitudes de OpenAI | No                                |
    | `service_tier`                                | No se envía                         |
    | `store` de Responses                          | No se envía                         |
    | Indicaciones para la caché de prompts         | No se envían                        |
    | Estructuración de la carga útil de compatibilidad con el razonamiento de OpenAI | No se aplica |
    | Encabezados ocultos de atribución de OpenClaw | No se inyectan en URL base personalizadas |

  </Accordion>

  <Accordion title="Controles de pensamiento de Qwen">
    Para los modelos Qwen, establece `compat.thinkingFormat: "qwen-chat-template"` en la fila del modelo cuando el servidor espere argumentos de palabra clave de la plantilla de chat de Qwen. Estos modelos exponen un perfil binario `/think` (`off`, `on`) porque el pensamiento de la plantilla de chat de Qwen es una opción de activación o desactivación, no una escala de esfuerzo al estilo de OpenAI.

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

    Los niveles de pensamiento distintos de `off` envían `enable_thinking: true`. Si tu punto de conexión espera en su lugar indicadores de nivel superior al estilo de DashScope, usa `compat.thinkingFormat: "qwen"` para enviar `enable_thinking` en la raíz de la solicitud.

  </Accordion>

  <Accordion title="Controles de pensamiento de Nemotron 3">
    Para los modelos `vllm/nemotron-3-*` con el pensamiento desactivado, el Plugin incluido envía:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "force_nonempty_content": true
      }
    }
    ```

    Para personalizar estos valores, establece `chat_template_kwargs` en los parámetros del modelo. Si también estableces `params.extra_body.chat_template_kwargs`, ese valor prevalece porque `extra_body` es la última sobrescritura del cuerpo de la solicitud.

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
    Primero, confirma que vLLM se haya iniciado con el analizador de llamadas a herramientas y la plantilla de chat correctos para el modelo. La documentación de vLLM especifica `hermes` para los modelos Qwen2.5 y `qwen3_xml` para los modelos Qwen3-Coder.

    Síntomas: las Skills o herramientas nunca se ejecutan, el asistente imprime JSON/XML sin procesar, como `{"name":"read","arguments":...}`, o vLLM devuelve una matriz `tool_calls` vacía cuando OpenClaw envía `tool_choice: "auto"`.

    Algunas combinaciones de Qwen y vLLM solo devuelven llamadas a herramientas estructuradas cuando la solicitud utiliza `tool_choice: "required"`. Fuérzalo para cada modelo mediante `params.extra_body`:

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

    Sustituye el ID del modelo por el ID exacto que muestra `openclaw models list --provider vllm`, o aplica la misma sobrescritura desde la CLI:

    ```bash
    openclaw config set agents.defaults.models '{"vllm/Qwen-Qwen2.5-Coder-32B-Instruct":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
    ```

    Esta es una solución alternativa opcional: obliga a que cada turno con herramientas realice una llamada a una herramienta, por lo que debes usarla únicamente en una entrada de modelo dedicada donde ese comportamiento sea aceptable. No la establezcas como valor predeterminado global para todos los modelos de vLLM ni la combines con un proxy que convierta texto arbitrario del asistente en llamadas ejecutables a herramientas.

  </Accordion>

  <Accordion title="URL base personalizada">
    Si tu servidor vLLM se ejecuta en un host o puerto distinto del predeterminado, establece `baseUrl` en la configuración explícita del proveedor:

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
  <Accordion title="Primera respuesta lenta o tiempo de espera agotado del servidor remoto">
    Para modelos locales grandes, hosts remotos de la LAN o enlaces de la red de Tailscale, establece un tiempo de espera para las solicitudes limitado al proveedor:

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

    `timeoutSeconds` se aplica únicamente a las solicitudes HTTP de modelos vLLM: establecimiento de la conexión, encabezados de respuesta, transmisión del cuerpo y cancelación total de la solicitud protegida. También eleva el límite del supervisor de inactividad o transmisión del LLM por encima del valor predeterminado implícito de unos 120 segundos para este proveedor. Es preferible usar esta opción en lugar de aumentar `agents.defaults.timeoutSeconds`, que controla toda la ejecución del agente.

  </Accordion>

  <Accordion title="No se puede acceder al servidor">
    Comprueba que el servidor vLLM esté en ejecución y sea accesible:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    Si aparece un error de conexión, verifica el host, el puerto y que vLLM se haya iniciado en modo de servidor compatible con OpenAI. OpenClaw confía en el origen exacto configurado en `models.providers.vllm.baseUrl` para las solicitudes protegidas de modelos en puntos de conexión local loopback, de LAN y de Tailscale. Los orígenes de metadatos o de vínculo local permanecen bloqueados sin una habilitación explícita. Establece `models.providers.vllm.request.allowPrivateNetwork: true` únicamente cuando las solicitudes de vLLM deban llegar a otro origen privado, o `false` para desactivar la confianza en el origen exacto.

  </Accordion>

  <Accordion title="Errores de autenticación en las solicitudes">
    Si las solicitudes fallan con errores de autenticación, establece una `VLLM_API_KEY` real que coincida con la configuración del servidor o configura el proveedor explícitamente en `models.providers.vllm`.

    <Tip>
    Si tu servidor vLLM no exige autenticación, cualquier valor no vacío de `VLLM_API_KEY` funciona como señal de habilitación para OpenClaw.
    </Tip>

  </Accordion>

  <Accordion title="No se detectan modelos">
    La detección automática requiere que se establezca `VLLM_API_KEY`. Si has definido `models.providers.vllm`, OpenClaw utiliza únicamente los modelos que hayas declarado, salvo que `agents.defaults.models` incluya `"vllm/*": {}`.
  </Accordion>

  <Accordion title="Las herramientas se muestran como texto sin procesar">
    Si un modelo Qwen imprime sintaxis JSON/XML de herramientas en lugar de ejecutar una Skill:

    - Inicia vLLM con el analizador y la plantilla correctos para ese modelo.
    - Confirma el ID exacto del modelo con `openclaw models list --provider vllm`.
    - Añade una sobrescritura dedicada por modelo `params.extra_body.tool_choice: "required"` únicamente si `tool_choice: "auto"` sigue devolviendo llamadas a herramientas vacías o solo como texto.

  </Accordion>
</AccordionGroup>

<Warning>
Más ayuda: [Solución de problemas](/es/help/troubleshooting) y [Preguntas frecuentes](/es/help/faq).
</Warning>

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, referencias de modelos y comportamiento de conmutación por error.
  </Card>
  <Card title="OpenAI" href="/es/providers/openai" icon="bolt">
    Proveedor nativo de OpenAI y comportamiento de rutas compatibles con OpenAI.
  </Card>
  <Card title="OAuth y autenticación" href="/es/gateway/authentication" icon="key">
    Detalles de autenticación y reglas de reutilización de credenciales.
  </Card>
  <Card title="Solución de problemas" href="/es/help/troubleshooting" icon="wrench">
    Problemas habituales y cómo resolverlos.
  </Card>
</CardGroup>
