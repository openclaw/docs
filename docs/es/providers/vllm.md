---
read_when:
    - Quieres ejecutar OpenClaw contra un servidor vLLM local
    - Quieres endpoints `/v1` compatibles con OpenAI con tus propios modelos
summary: Ejecuta OpenClaw con vLLM (servidor local compatible con OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-04-12T23:33:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: a43be9ae879158fcd69d50fb3a47616fd560e3c6fe4ecb3a109bdda6a63a6a80
    source_path: providers/vllm.md
    workflow: 15
---

# vLLM

vLLM puede servir modelos de código abierto (y algunos modelos personalizados) mediante una API HTTP **compatible con OpenAI**. OpenClaw se conecta a vLLM usando la API `openai-completions`.

OpenClaw también puede **descubrir automáticamente** los modelos disponibles desde vLLM cuando activas esta opción con `VLLM_API_KEY` (cualquier valor funciona si tu servidor no exige autenticación) y no defines una entrada explícita `models.providers.vllm`.

| Propiedad       | Valor                                    |
| --------------- | ---------------------------------------- |
| ID del proveedor | `vllm`                                  |
| API             | `openai-completions` (compatible con OpenAI) |
| Autenticación   | Variable de entorno `VLLM_API_KEY`       |
| Base URL predeterminada | `http://127.0.0.1:8000/v1`        |

## Primeros pasos

<Steps>
  <Step title="Start vLLM with an OpenAI-compatible server">
    Tu base URL debe exponer endpoints `/v1` (por ejemplo, `/v1/models`, `/v1/chat/completions`). vLLM suele ejecutarse en:

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
    Sustitúyelo por uno de los IDs de modelo de tu vLLM:

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

## Descubrimiento de modelos (proveedor implícito)

Cuando `VLLM_API_KEY` está configurado (o existe un perfil de autenticación) y **no** defines `models.providers.vllm`, OpenClaw consulta:

```
GET http://127.0.0.1:8000/v1/models
```

y convierte los IDs devueltos en entradas de modelo.

<Note>
Si configuras explícitamente `models.providers.vllm`, se omite el descubrimiento automático y debes definir los modelos manualmente.
</Note>

## Configuración explícita (modelos manuales)

Usa configuración explícita cuando:

- vLLM se ejecuta en otro host o puerto
- Quieres fijar los valores de `contextWindow` o `maxTokens`
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
            name: "Modelo vLLM local",
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
  <Accordion title="Proxy-style behavior">
    vLLM se trata como un backend `/v1` compatible con OpenAI de estilo proxy, no como un endpoint
    nativo de OpenAI. Esto significa:

    | Comportamiento | ¿Se aplica? |
    |---------------|-------------|
    | Modelado nativo de solicitudes de OpenAI | No |
    | `service_tier` | No se envía |
    | Responses `store` | No se envía |
    | Sugerencias de caché de prompt | No se envían |
    | Modelado de payload de compatibilidad de razonamiento de OpenAI | No se aplica |
    | Encabezados ocultos de atribución de OpenClaw | No se inyectan en base URLs personalizadas |

  </Accordion>

  <Accordion title="Custom base URL">
    Si tu servidor vLLM se ejecuta en un host o puerto no predeterminado, establece `baseUrl` en la configuración explícita del proveedor:

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
                name: "Modelo vLLM remoto",
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
  <Accordion title="Server not reachable">
    Comprueba que el servidor vLLM esté en ejecución y sea accesible:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    Si ves un error de conexión, verifica el host, el puerto y que vLLM se haya iniciado en modo de servidor compatible con OpenAI.

  </Accordion>

  <Accordion title="Auth errors on requests">
    Si las solicitudes fallan con errores de autenticación, establece un `VLLM_API_KEY` real que coincida con la configuración de tu servidor, o configura explícitamente el proveedor en `models.providers.vllm`.

    <Tip>
    Si tu servidor vLLM no exige autenticación, cualquier valor no vacío para `VLLM_API_KEY` funciona como señal de activación para OpenClaw.
    </Tip>

  </Accordion>

  <Accordion title="No models discovered">
    El descubrimiento automático requiere que `VLLM_API_KEY` esté configurado **y** que no exista una entrada explícita de configuración `models.providers.vllm`. Si has definido manualmente el proveedor, OpenClaw omite el descubrimiento y usa solo los modelos declarados.
  </Accordion>
</AccordionGroup>

<Warning>
Más ayuda: [Solución de problemas](/es/help/troubleshooting) y [FAQ](/es/help/faq).
</Warning>

## Relacionado

<CardGroup cols={2}>
  <Card title="Model selection" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelos y comportamiento de failover.
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
