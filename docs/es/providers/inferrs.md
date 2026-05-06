---
read_when:
    - Quieres ejecutar OpenClaw con un servidor inferrs local
    - Estás sirviendo Gemma u otro modelo mediante inferrs
    - Necesitas las opciones de compatibilidad exactas de OpenClaw para inferrs
summary: Ejecuta OpenClaw mediante inferrs (servidor local compatible con OpenAI)
title: Infiere
x-i18n:
    generated_at: "2026-05-06T05:46:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 216783689527229835acf4f0fb6d2981d1915bd5df28e631b5384c4cbb9ee158
    source_path: providers/inferrs.md
    workflow: 16
---

[inferrs](https://github.com/ericcurtin/inferrs) puede servir modelos locales detrás de una API `/v1` compatible con OpenAI. OpenClaw funciona con `inferrs` mediante la ruta genérica `openai-completions`.

| Propiedad             | Valor                                                                      |
| --------------------- | -------------------------------------------------------------------------- |
| Id. de proveedor      | `inferrs` (personalizado; configúralo en `models.providers.inferrs`)       |
| Plugin                | ninguno — `inferrs` no es un Plugin de proveedor incluido con OpenClaw     |
| Variable de entorno de autenticación | Opcional. Cualquier valor funciona si tu servidor inferrs no tiene autenticación |
| API                   | compatible con OpenAI (`openai-completions`)                               |
| URL base sugerida     | `http://127.0.0.1:8080/v1` (o dondequiera que esté tu servidor inferrs)    |

<Note>
  Actualmente conviene tratar `inferrs` como un backend personalizado autoalojado compatible con OpenAI, no como un Plugin de proveedor dedicado de OpenClaw. Lo configuras mediante `models.providers.inferrs` en lugar de una marca de elección de incorporación. Si necesitas un Plugin incluido real con detección automática, consulta [SGLang](/es/providers/sglang) o [vLLM](/es/providers/vllm).
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
    Agrega una entrada de proveedor explícita y apunta tu modelo predeterminado a ella. Consulta el ejemplo de configuración completo a continuación.
  </Step>
</Steps>

## Ejemplo de configuración completo

Este ejemplo usa Gemma 4 en un servidor local `inferrs`.

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

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Por qué requiresStringContent importa">
    Algunas rutas Chat Completions de `inferrs` solo aceptan
    `messages[].content` de cadena, no arreglos estructurados de partes de contenido.

    <Warning>
    Si las ejecuciones de OpenClaw fallan con un error como:

    ```text
    messages[1].content: invalid type: sequence, expected a string
    ```

    configura `compat.requiresStringContent: true` en la entrada de tu modelo.
    </Warning>

    ```json5
    compat: {
      requiresStringContent: true
    }
    ```

    OpenClaw convertirá las partes de contenido de texto puro en cadenas simples antes de enviar
    la solicitud.

  </Accordion>

  <Accordion title="Advertencia sobre Gemma y el esquema de herramientas">
    Algunas combinaciones actuales de `inferrs` + Gemma aceptan solicitudes directas pequeñas a
    `/v1/chat/completions`, pero aun así fallan en turnos completos del runtime de agentes de OpenClaw.

    Si eso ocurre, prueba primero esto:

    ```json5
    compat: {
      requiresStringContent: true,
      supportsTools: false
    }
    ```

    Eso desactiva la superficie de esquema de herramientas de OpenClaw para el modelo y puede reducir la presión del prompt
    en backends locales más estrictos.

    Si las solicitudes directas mínimas siguen funcionando, pero los turnos normales de agentes de OpenClaw continúan
    fallando dentro de `inferrs`, el problema restante suele estar en el comportamiento del modelo/servidor
    upstream y no en la capa de transporte de OpenClaw.

  </Accordion>

  <Accordion title="Prueba rápida manual">
    Una vez configurado, prueba ambas capas:

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

    Si el primer comando funciona pero el segundo falla, revisa la sección de solución de problemas a continuación.

  </Accordion>

  <Accordion title="Comportamiento de estilo proxy">
    `inferrs` se trata como un backend `/v1` de estilo proxy compatible con OpenAI, no como un
    endpoint nativo de OpenAI.

    - El moldeado de solicitudes exclusivo de OpenAI nativo no se aplica aquí
    - Sin `service_tier`, sin Responses `store`, sin indicios de caché de prompt y sin
      moldeado de payload de compatibilidad de razonamiento de OpenAI
    - Los encabezados ocultos de atribución de OpenClaw (`originator`, `version`, `User-Agent`)
      no se inyectan en URL base personalizadas de `inferrs`

  </Accordion>
</AccordionGroup>

## Solución de problemas

<AccordionGroup>
  <Accordion title="curl /v1/models falla">
    `inferrs` no se está ejecutando, no es accesible o no está enlazado al
    host/puerto esperado. Asegúrate de que el servidor esté iniciado y escuchando en la dirección que
    configuraste.
  </Accordion>

  <Accordion title="messages[].content esperaba una cadena">
    Configura `compat.requiresStringContent: true` en la entrada del modelo. Consulta la
    sección `requiresStringContent` anterior para obtener detalles.
  </Accordion>

  <Accordion title="Las llamadas directas a /v1/chat/completions pasan, pero openclaw infer model run falla">
    Prueba configurar `compat.supportsTools: false` para desactivar la superficie de esquema de herramientas.
    Consulta la advertencia sobre el esquema de herramientas de Gemma anterior.
  </Accordion>

  <Accordion title="inferrs sigue fallando en turnos de agente más grandes">
    Si OpenClaw ya no obtiene errores de esquema, pero `inferrs` sigue fallando en turnos de agente más grandes,
    trátalo como una limitación upstream de `inferrs` o del modelo. Reduce
    la presión del prompt o cambia a otro backend local o modelo.
  </Accordion>
</AccordionGroup>

<Tip>
Para obtener ayuda general, consulta [Solución de problemas](/es/help/troubleshooting) y [Preguntas frecuentes](/es/help/faq).
</Tip>

## Relacionado

<CardGroup cols={2}>
  <Card title="Modelos locales" href="/es/gateway/local-models" icon="server">
    Ejecutar OpenClaw contra servidores de modelos locales.
  </Card>
  <Card title="Solución de problemas de Gateway" href="/es/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail" icon="wrench">
    Depurar backends locales compatibles con OpenAI que pasan las pruebas, pero fallan en ejecuciones de agentes.
  </Card>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Resumen de todos los proveedores, referencias de modelos y comportamiento de conmutación por error.
  </Card>
</CardGroup>
