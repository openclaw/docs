---
read_when:
    - Quieres ejecutar OpenClaw contra un servidor local de inferrs
    - Estás sirviendo Gemma u otro modelo mediante inferrs
    - Necesitas las flags exactas de compatibilidad de OpenClaw para inferrs
summary: Ejecuta OpenClaw mediante inferrs (servidor local compatible con OpenAI)
title: Inferrs
x-i18n:
    generated_at: "2026-04-24T05:44:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 53547c48febe584cf818507b0bf879db0471c575fa8a3ebfec64c658a7090675
    source_path: providers/inferrs.md
    workflow: 15
---

[inferrs](https://github.com/ericcurtin/inferrs) puede servir modelos locales detrás de
una API `/v1` compatible con OpenAI. OpenClaw funciona con `inferrs` mediante la
ruta genérica `openai-completions`.

Actualmente, `inferrs` es mejor tratarlo como un backend personalizado autohospedado
compatible con OpenAI, no como un Plugin de proveedor dedicado de OpenClaw.

## Primeros pasos

<Steps>
  <Step title="Inicia inferrs con un modelo">
    ```bash
    inferrs serve google/gemma-4-E2B-it \
      --host 127.0.0.1 \
      --port 8080 \
      --device metal
    ```
  </Step>
  <Step title="Verifica que el servidor es accesible">
    ```bash
    curl http://127.0.0.1:8080/health
    curl http://127.0.0.1:8080/v1/models
    ```
  </Step>
  <Step title="Añade una entrada de proveedor de OpenClaw">
    Añade una entrada explícita de proveedor y dirige a ella tu modelo predeterminado. Consulta el ejemplo completo de configuración más abajo.
  </Step>
</Steps>

## Ejemplo completo de configuración

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
  <Accordion title="Por qué importa requiresStringContent">
    Algunas rutas de Chat Completions de `inferrs` aceptan solo
    `messages[].content` como cadena, no arreglos estructurados de partes de contenido.

    <Warning>
    Si las ejecuciones de OpenClaw fallan con un error como:

    ```text
    messages[1].content: invalid type: sequence, expected a string
    ```

    configura `compat.requiresStringContent: true` en tu entrada de modelo.
    </Warning>

    ```json5
    compat: {
      requiresStringContent: true
    }
    ```

    OpenClaw aplanará las partes de contenido puramente de texto en cadenas simples antes de enviar
    la solicitud.

  </Accordion>

  <Accordion title="Advertencia sobre Gemma y el esquema de herramientas">
    Algunas combinaciones actuales de `inferrs` + Gemma aceptan solicitudes pequeñas directas de
    `/v1/chat/completions`, pero aun así fallan en turnos completos del runtime de agente de OpenClaw.

    Si eso ocurre, prueba primero esto:

    ```json5
    compat: {
      requiresStringContent: true,
      supportsTools: false
    }
    ```

    Eso desactiva la superficie de esquema de herramientas de OpenClaw para el modelo y puede reducir la presión del prompt en backends locales más estrictos.

    Si las solicitudes directas pequeñas siguen funcionando pero los turnos normales de agente de OpenClaw continúan fallando dentro de `inferrs`, el problema restante suele estar en el comportamiento ascendente del modelo/servidor y no en la capa de transporte de OpenClaw.

  </Accordion>

  <Accordion title="Prueba manual rápida">
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

    Si el primer comando funciona pero el segundo falla, consulta la sección de solución de problemas más abajo.

  </Accordion>

  <Accordion title="Comportamiento tipo proxy">
    `inferrs` se trata como un backend `/v1` tipo proxy compatible con OpenAI, no como un
    endpoint OpenAI nativo.

    - La conformación de solicitudes exclusiva de OpenAI nativo no se aplica aquí
    - No hay `service_tier`, ni `store` de Responses, ni pistas de caché de prompt, ni conformación de carga útil de compatibilidad de reasoning de OpenAI
    - Las cabeceras ocultas de atribución de OpenClaw (`originator`, `version`, `User-Agent`) no se inyectan en URLs base personalizadas de `inferrs`

  </Accordion>
</AccordionGroup>

## Solución de problemas

<AccordionGroup>
  <Accordion title="curl /v1/models falla">
    `inferrs` no se está ejecutando, no es accesible o no está enlazado al
    host/puerto esperado. Asegúrate de que el servidor se haya iniciado y esté escuchando en la dirección que configuraste.
  </Accordion>

  <Accordion title="messages[].content expected a string">
    Configura `compat.requiresStringContent: true` en la entrada del modelo. Consulta arriba la
    sección `requiresStringContent` para más detalles.
  </Accordion>

  <Accordion title="Las llamadas directas a /v1/chat/completions funcionan, pero openclaw infer model run falla">
    Prueba a configurar `compat.supportsTools: false` para desactivar la superficie de esquema de herramientas.
    Consulta arriba la advertencia sobre el esquema de herramientas de Gemma.
  </Accordion>

  <Accordion title="inferrs sigue fallando en turnos de agente más grandes">
    Si OpenClaw ya no recibe errores de esquema pero `inferrs` sigue fallando en turnos de agente más grandes, trátalo como una limitación ascendente de `inferrs` o del modelo. Reduce
    la presión del prompt o cambia a otro backend o modelo local.
  </Accordion>
</AccordionGroup>

<Tip>
Para ayuda general, consulta [Solución de problemas](/es/help/troubleshooting) y [FAQ](/es/help/faq).
</Tip>

## Relacionado

<CardGroup cols={2}>
  <Card title="Modelos locales" href="/es/gateway/local-models" icon="server">
    Ejecutar OpenClaw contra servidores de modelos locales.
  </Card>
  <Card title="Solución de problemas del Gateway" href="/es/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail" icon="wrench">
    Depurar backends locales compatibles con OpenAI que superan las sondas pero fallan en ejecuciones de agente.
  </Card>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Resumen de todos los proveedores, refs de modelo y comportamiento de failover.
  </Card>
</CardGroup>
