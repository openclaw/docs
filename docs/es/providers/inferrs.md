---
read_when:
    - Quieres ejecutar OpenClaw con un servidor local de inferrs
    - Estás sirviendo Gemma u otro modelo mediante inferrs
    - Necesitas las marcas de compatibilidad exactas de OpenClaw para inferrs
summary: Ejecuta OpenClaw mediante inferrs (servidor local compatible con OpenAI)
title: Inferrs
x-i18n:
    generated_at: "2026-07-05T11:37:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8b9b6fe337a2ec6536332dd62840052fd802fad0a5f3d885ce137523266ff3c9
    source_path: providers/inferrs.md
    workflow: 16
---

[inferrs](https://github.com/ericcurtin/inferrs) sirve modelos locales detrás de una API `/v1` compatible con OpenAI. OpenClaw se comunica con él mediante el adaptador genérico `openai-completions`.

| Propiedad              | Valor                                                                                  |
| ---------------------- | -------------------------------------------------------------------------------------- |
| Id. de proveedor       | `inferrs` (personalizado; configúralo en `models.providers.inferrs`)                  |
| Plugin                 | ninguno — no es un plugin de proveedor de OpenClaw incluido                            |
| Variable de entorno de auth | no se requiere ninguna; cualquier valor funciona si tu servidor inferrs no tiene auth |
| API                    | compatible con OpenAI (`openai-completions`)                                           |
| URL base sugerida      | `http://127.0.0.1:8080/v1` (o donde escuche tu servidor inferrs)                       |

<Note>
  `inferrs` es un backend autoalojado personalizado compatible con OpenAI, no un Plugin de proveedor dedicado de OpenClaw: lo configuras en `models.providers.inferrs` en lugar de elegir una opción de auth durante la incorporación. Para un Plugin incluido con detección automática, consulta [SGLang](/es/providers/sglang) o [vLLM](/es/providers/vllm).
</Note>

## Primeros pasos

<Steps>
  <Step title="Iniciar inferrs con un modelo">
    ```bash
    inferrs serve google/gemma-4-E2B-it \
      --host 127.0.0.1 \
      --port 8080 \
      --device metal
    ```
  </Step>
  <Step title="Verificar que el servidor sea accesible">
    ```bash
    curl http://127.0.0.1:8080/health
    curl http://127.0.0.1:8080/v1/models
    ```
  </Step>
  <Step title="Agregar una entrada de proveedor de OpenClaw">
    Agrega una entrada explícita de proveedor y apunta tu modelo predeterminado a ella. Consulta el ejemplo de configuración a continuación.
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

OpenClaw puede iniciar `inferrs` por sí mismo solo cuando se selecciona un modelo `inferrs/...`. Agrega `localService` a la misma entrada de proveedor:

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

`command` debe ser una ruta absoluta. Ejecuta `which inferrs` en el host del Gateway y usa esa ruta. Referencia completa de campos: [Servicios de modelos locales](/es/gateway/local-model-services).

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Por qué requiresStringContent importa">
    Algunas rutas de Chat Completions de `inferrs` solo aceptan `messages[].content` como cadena, no arrays estructurados de partes de contenido.

    <Warning>
    Si las ejecuciones de OpenClaw fallan con:

    ```text
    messages[1].content: invalid type: sequence, expected a string
    ```

    define `compat.requiresStringContent: true` en la entrada del modelo. OpenClaw entonces aplana las partes de contenido de texto puro en cadenas simples antes de enviar la solicitud.
    </Warning>

  </Accordion>

  <Accordion title="Advertencia sobre Gemma y el esquema de herramientas">
    Algunas combinaciones de `inferrs` + Gemma aceptan solicitudes directas pequeñas a `/v1/chat/completions`, pero fallan en turnos completos del runtime de agente de OpenClaw. Prueba primero deshabilitar la superficie del esquema de herramientas:

    ```json5
    compat: {
      requiresStringContent: true,
      supportsTools: false
    }
    ```

    Eso reduce la presión del prompt en backends locales más estrictos. Si las solicitudes directas diminutas siguen funcionando pero los turnos normales de agente de OpenClaw continúan fallando dentro de `inferrs`, trátalo como una limitación del modelo o servidor upstream en lugar de un problema de transporte de OpenClaw.

  </Accordion>

  <Accordion title="Prueba de humo manual">
    Prueba ambas capas una vez configuradas:

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

    Si el primer comando funciona pero el segundo falla, consulta Solución de problemas a continuación.

  </Accordion>

  <Accordion title="Comportamiento de estilo proxy">
    Como `inferrs` usa el adaptador genérico `openai-completions` (no `openai-responses`), nunca se aplica el moldeado de solicitudes exclusivo de OpenAI nativo: no se envía `service_tier`, ni `store` de Responses, ni pistas de caché de prompt, ni moldeado de payload de compatibilidad de razonamiento de OpenAI.
  </Accordion>
</AccordionGroup>

## Solución de problemas

<AccordionGroup>
  <Accordion title="curl /v1/models falla">
    `inferrs` no está en ejecución, no es accesible o no está enlazado al host/puerto que configuraste. Confirma que el servidor esté iniciado y escuchando en esa dirección.
  </Accordion>

  <Accordion title="messages[].content expected a string">
    Define `compat.requiresStringContent: true` en la entrada del modelo (consulta arriba).
  </Accordion>

  <Accordion title="Las llamadas directas a /v1/chat/completions pasan, pero openclaw infer model run falla">
    Define `compat.supportsTools: false` para deshabilitar la superficie del esquema de herramientas (consulta la advertencia de Gemma anterior).
  </Accordion>

  <Accordion title="inferrs todavía falla en turnos de agente más grandes">
    Si los errores de esquema desaparecieron pero `inferrs` todavía falla en turnos de agente más grandes, trátalo como una limitación upstream de `inferrs` o del modelo. Reduce la presión del prompt o cambia de backend/modelo.
  </Accordion>
</AccordionGroup>

<Tip>
Para ayuda general, consulta [Solución de problemas](/es/help/troubleshooting) y [Preguntas frecuentes](/es/help/faq).
</Tip>

## Relacionado

<CardGroup cols={2}>
  <Card title="Modelos locales" href="/es/gateway/local-models" icon="server">
    Ejecutar OpenClaw contra servidores de modelos locales.
  </Card>
  <Card title="Servicios de modelos locales" href="/es/gateway/local-model-services" icon="play">
    Iniciar servidores de modelos locales bajo demanda para proveedores configurados.
  </Card>
  <Card title="Solución de problemas de Gateway" href="/es/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail" icon="wrench">
    Depurar backends locales compatibles con OpenAI que pasan las pruebas pero fallan en ejecuciones de agentes.
  </Card>
  <Card title="Selección de modelo" href="/es/concepts/model-providers" icon="layers">
    Descripción general de todos los proveedores, refs de modelo y comportamiento de conmutación por error.
  </Card>
</CardGroup>
