---
read_when:
    - Quieres ejecutar OpenClaw con un servidor local de inferrs
    - Estás ofreciendo Gemma u otro modelo mediante inferrs
    - Necesitas las marcas de compatibilidad exactas de OpenClaw para inferrs
summary: Ejecuta OpenClaw mediante inferrs (servidor local compatible con OpenAI)
title: Infiere
x-i18n:
    generated_at: "2026-07-11T23:26:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8b9b6fe337a2ec6536332dd62840052fd802fad0a5f3d885ce137523266ff3c9
    source_path: providers/inferrs.md
    workflow: 16
---

[inferrs](https://github.com/ericcurtin/inferrs) sirve modelos locales mediante una API `/v1` compatible con OpenAI. OpenClaw se comunica con ella a través del adaptador genérico `openai-completions`.

| Propiedad          | Valor                                                                      |
| ------------------ | -------------------------------------------------------------------------- |
| Id. del proveedor  | `inferrs` (personalizado; configúrelo en `models.providers.inferrs`)        |
| Plugin             | ninguno; no es un plugin de proveedor incluido con OpenClaw                |
| Variable de entorno de autenticación | no se requiere ninguna; cualquier valor funciona si su servidor inferrs no tiene autenticación |
| API                | compatible con OpenAI (`openai-completions`)                               |
| URL base sugerida  | `http://127.0.0.1:8080/v1` (o donde esté escuchando su servidor inferrs)    |

<Note>
  `inferrs` es un backend personalizado, autoalojado y compatible con OpenAI, no un plugin de proveedor específico de OpenClaw: se configura en `models.providers.inferrs` en lugar de elegir una opción de autenticación durante la incorporación. Para usar un plugin incluido con detección automática, consulte [SGLang](/es/providers/sglang) o [vLLM](/es/providers/vllm).
</Note>

## Primeros pasos

<Steps>
  <Step title="Start inferrs with a model">
    ```bash
    inferrs serve google/gemma-4-E2B-it \
      --host 127.0.0.1 \
      --port 8080 \
      --device metal
    ```
  </Step>
  <Step title="Verify the server is reachable">
    ```bash
    curl http://127.0.0.1:8080/health
    curl http://127.0.0.1:8080/v1/models
    ```
  </Step>
  <Step title="Add an OpenClaw provider entry">
    Añada una entrada explícita de proveedor y configure el modelo predeterminado para que la use. Consulte el ejemplo de configuración siguiente.
  </Step>
</Steps>

## Ejemplo de configuración completa

Gemma 4 en un servidor `inferrs` local:

```json5
{
  agents: {
    defaults: {
      model: { primary: "inferrs/google/gemma-4-E2B-it" },
      models: {
        "inferrs/google/gemma-4-E2B-it": {
          alias: "Gemma 4 (inferrs)",
        },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      inferrs: {
        baseUrl: "http://127.0.0.1:8080/v1",
        apiKey: "inferrs-local",
        api: "openai-completions",
        models: [
          {
            id: "google/gemma-4-E2B-it",
            name: "Gemma 4 E2B (inferrs)",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 4096,
            compat: {
              requiresStringContent: true,
            },
          },
        ],
      },
    },
  },
}
```

## Inicio bajo demanda

OpenClaw puede iniciar `inferrs` por sí mismo únicamente cuando se selecciona un modelo `inferrs/...`. Añada `localService` a la misma entrada de proveedor:

```json5
{
  models: {
    providers: {
      inferrs: {
        baseUrl: "http://127.0.0.1:8080/v1",
        apiKey: "inferrs-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "/opt/homebrew/bin/inferrs",
          args: [
            "serve",
            "google/gemma-4-E2B-it",
            "--host",
            "127.0.0.1",
            "--port",
            "8080",
            "--device",
            "metal",
          ],
          healthUrl: "http://127.0.0.1:8080/v1/models",
          readyTimeoutMs: 180000,
          idleStopMs: 0,
        },
        models: [
          {
            id: "google/gemma-4-E2B-it",
            name: "Gemma 4 E2B (inferrs)",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 4096,
            compat: {
              requiresStringContent: true,
            },
          },
        ],
      },
    },
  },
}
```

`command` debe ser una ruta absoluta. Ejecute `which inferrs` en el host del Gateway y use esa ruta. Referencia completa de los campos: [Servicios de modelos locales](/es/gateway/local-model-services).

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Why requiresStringContent matters">
    Algunas rutas de finalización de chat de `inferrs` solo aceptan cadenas en `messages[].content`, no matrices estructuradas de partes de contenido.

    <Warning>
    Si las ejecuciones de OpenClaw fallan con:

    ```text
    messages[1].content: invalid type: sequence, expected a string
    ```

    establezca `compat.requiresStringContent: true` en la entrada del modelo. OpenClaw convertirá entonces las partes que contengan únicamente texto en cadenas simples antes de enviar la solicitud.
    </Warning>

  </Accordion>

  <Accordion title="Gemma and tool-schema caveat">
    Algunas combinaciones de `inferrs` y Gemma aceptan solicitudes directas pequeñas a `/v1/chat/completions`, pero fallan en turnos completos del entorno de ejecución del agente de OpenClaw. Primero, pruebe a desactivar la superficie del esquema de herramientas:

    ```json5
    compat: {
      requiresStringContent: true,
      supportsTools: false
    }
    ```

    Esto reduce la carga del prompt en los backends locales más estrictos. Si las solicitudes directas pequeñas siguen funcionando, pero los turnos normales del agente de OpenClaw continúan provocando errores en `inferrs`, considérelo una limitación del modelo o servidor de origen, no un problema de transporte de OpenClaw.

  </Accordion>

  <Accordion title="Manual smoke test">
    Pruebe ambas capas una vez configuradas:

    ```bash
    curl http://127.0.0.1:8080/v1/chat/completions \
      -H 'content-type: application/json' \
      -d '{"model":"google/gemma-4-E2B-it","messages":[{"role":"user","content":"What is 2 + 2?"}],"stream":false}'
    ```

    ```bash
    openclaw infer model run \
      --model inferrs/google/gemma-4-E2B-it \
      --prompt "What is 2 + 2? Reply with one short sentence." \
      --json
    ```

    Si el primer comando funciona, pero el segundo falla, consulte la sección Solución de problemas siguiente.

  </Accordion>

  <Accordion title="Proxy-style behavior">
    Dado que `inferrs` usa el adaptador genérico `openai-completions` (no `openai-responses`), nunca se aplica la preparación de solicitudes exclusiva de OpenAI nativo: no se envían `service_tier`, el campo `store` de Responses, indicaciones de caché del prompt ni cargas útiles de compatibilidad con el razonamiento de OpenAI.
  </Accordion>
</AccordionGroup>

## Solución de problemas

<AccordionGroup>
  <Accordion title="curl /v1/models fails">
    `inferrs` no se está ejecutando, no es accesible o no está vinculado al host o puerto que configuró. Confirme que el servidor esté iniciado y escuchando en esa dirección.
  </Accordion>

  <Accordion title="messages[].content expected a string">
    Establezca `compat.requiresStringContent: true` en la entrada del modelo (consulte la sección anterior).
  </Accordion>

  <Accordion title="Direct /v1/chat/completions calls pass but openclaw infer model run fails">
    Establezca `compat.supportsTools: false` para desactivar la superficie del esquema de herramientas (consulte la advertencia sobre Gemma anterior).
  </Accordion>

  <Accordion title="inferrs still crashes on larger agent turns">
    Si los errores de esquema han desaparecido, pero `inferrs` sigue fallando en turnos de agente más grandes, considérelo una limitación de `inferrs` o del modelo de origen. Reduzca la carga del prompt o cambie de backend o modelo.
  </Accordion>
</AccordionGroup>

<Tip>
Para obtener ayuda general, consulte [Solución de problemas](/es/help/troubleshooting) y [Preguntas frecuentes](/es/help/faq).
</Tip>

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="Local models" href="/es/gateway/local-models" icon="server">
    Ejecución de OpenClaw con servidores de modelos locales.
  </Card>
  <Card title="Local model services" href="/es/gateway/local-model-services" icon="play">
    Inicio bajo demanda de servidores de modelos locales para proveedores configurados.
  </Card>
  <Card title="Gateway troubleshooting" href="/es/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail" icon="wrench">
    Depuración de backends locales compatibles con OpenAI que superan las comprobaciones, pero fallan en las ejecuciones del agente.
  </Card>
  <Card title="Model selection" href="/es/concepts/model-providers" icon="layers">
    Descripción general de todos los proveedores, las referencias de modelos y el comportamiento de conmutación por error.
  </Card>
</CardGroup>
