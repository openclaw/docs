---
read_when:
    - Quieres ejecutar OpenClaw contra un servidor local de inferrs
    - Estás sirviendo Gemma u otro modelo a través de inferrs
    - Necesitas las flags exactas de compatibilidad de OpenClaw para inferrs
summary: Ejecuta OpenClaw a través de inferrs (servidor local compatible con OpenAI)
title: inferrs
x-i18n:
    generated_at: "2026-04-12T23:31:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 847dcc131fe51dfe163dcd60075dbfaa664662ea2a5c3986ccb08ddd37e8c31f
    source_path: providers/inferrs.md
    workflow: 15
---

# inferrs

[inferrs](https://github.com/ericcurtin/inferrs) puede servir modelos locales detrás de una API `/v1` compatible con OpenAI. OpenClaw funciona con `inferrs` mediante la ruta genérica `openai-completions`.

Actualmente, es mejor tratar `inferrs` como un backend personalizado autoalojado compatible con OpenAI, no como un Plugin de proveedor dedicado de OpenClaw.

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
    Agrega una entrada de proveedor explícita y apunta tu modelo predeterminado hacia ella. Consulta el ejemplo completo de configuración a continuación.
  </Step>
</Steps>

## Ejemplo completo de configuración

Este ejemplo usa Gemma 4 en un servidor local de `inferrs`.

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

## Avanzado

<AccordionGroup>
  <Accordion title="Why requiresStringContent matters">
    Algunas rutas de Chat Completions de `inferrs` aceptan solo `messages[].content` de tipo string, no arreglos estructurados de partes de contenido.

    <Warning>
    Si las ejecuciones de OpenClaw fallan con un error como:

    ```text
    messages[1].content: invalid type: sequence, expected a string
    ```

    establece `compat.requiresStringContent: true` en tu entrada de modelo.
    </Warning>

    ```json5
    compat: {
      requiresStringContent: true
    }
    ```

    OpenClaw aplanará las partes de contenido de texto puro en strings simples antes de enviar la solicitud.

  </Accordion>

  <Accordion title="Gemma and tool-schema caveat">
    Algunas combinaciones actuales de `inferrs` + Gemma aceptan solicitudes directas pequeñas a `/v1/chat/completions` pero aun así fallan en turnos completos del runtime de agente de OpenClaw.

    Si eso ocurre, prueba primero esto:

    ```json5
    compat: {
      requiresStringContent: true,
      supportsTools: false
    }
    ```

    Eso desactiva la superficie de esquema de herramientas de OpenClaw para el modelo y puede reducir la presión del prompt sobre backends locales más estrictos.

    Si las solicitudes directas pequeñas siguen funcionando pero los turnos normales del agente de OpenClaw continúan fallando dentro de `inferrs`, el problema restante suele estar en el comportamiento del modelo/servidor aguas arriba, más que en la capa de transporte de OpenClaw.

  </Accordion>

  <Accordion title="Manual smoke test">
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

    Si el primer comando funciona pero el segundo falla, consulta la sección de solución de problemas a continuación.

  </Accordion>

  <Accordion title="Proxy-style behavior">
    `inferrs` se trata como un backend `/v1` compatible con OpenAI de estilo proxy, no como un endpoint nativo de OpenAI.

    - Aquí no se aplica la conformación nativa de solicitudes solo para OpenAI
    - No hay `service_tier`, no hay `store` de Responses, no hay pistas de caché de prompt ni conformación de payload compatible con reasoning de OpenAI
    - Los encabezados ocultos de atribución de OpenClaw (`originator`, `version`, `User-Agent`) no se inyectan en URLs base personalizadas de `inferrs`

  </Accordion>
</AccordionGroup>

## Solución de problemas

<AccordionGroup>
  <Accordion title="curl /v1/models fails">
    `inferrs` no se está ejecutando, no es accesible o no está enlazado al host/puerto esperado. Asegúrate de que el servidor esté iniciado y escuchando en la dirección que configuraste.
  </Accordion>

  <Accordion title="messages[].content expected a string">
    Establece `compat.requiresStringContent: true` en la entrada del modelo. Consulta la sección `requiresStringContent` anterior para más detalles.
  </Accordion>

  <Accordion title="Direct /v1/chat/completions calls pass but openclaw infer model run fails">
    Intenta establecer `compat.supportsTools: false` para desactivar la superficie de esquema de herramientas. Consulta la advertencia sobre el esquema de herramientas de Gemma arriba.
  </Accordion>

  <Accordion title="inferrs still crashes on larger agent turns">
    Si OpenClaw ya no recibe errores de esquema pero `inferrs` sigue fallando en turnos de agente más grandes, trátalo como una limitación aguas arriba de `inferrs` o del modelo. Reduce la presión del prompt o cambia a otro backend local o modelo.
  </Accordion>
</AccordionGroup>

<Tip>
Para ayuda general, consulta [Troubleshooting](/es/help/troubleshooting) y [FAQ](/es/help/faq).
</Tip>

## Ver también

<CardGroup cols={2}>
  <Card title="Local models" href="/es/gateway/local-models" icon="server">
    Ejecutar OpenClaw con servidores de modelos locales.
  </Card>
  <Card title="Gateway troubleshooting" href="/es/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail" icon="wrench">
    Depuración de backends locales compatibles con OpenAI que superan las comprobaciones directas pero fallan en las ejecuciones del agente.
  </Card>
  <Card title="Model providers" href="/es/concepts/model-providers" icon="layers">
    Resumen de todos los proveedores, refs de modelos y comportamiento de failover.
  </Card>
</CardGroup>
