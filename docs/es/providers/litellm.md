---
read_when:
    - Quieres enrutar OpenClaw a través de un proxy de LiteLLM
    - Necesitas seguimiento de costos, registro o enrutamiento de modelos a través de LiteLLM
summary: Ejecutar OpenClaw a través de LiteLLM Proxy para un acceso unificado a los modelos y seguimiento de costos
title: LiteLLM
x-i18n:
    generated_at: "2026-04-25T18:20:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: f4e2cdddff8dd953b989beb4f2ed1c31dae09298dacd0cf809ef07b41358623b
    source_path: providers/litellm.md
    workflow: 15
---

[LiteLLM](https://litellm.ai) es una puerta de enlace LLM de código abierto que proporciona una API unificada para más de 100 proveedores de modelos. Enruta OpenClaw a través de LiteLLM para obtener seguimiento centralizado de costos, registros y la flexibilidad de cambiar backends sin modificar tu configuración de OpenClaw.

<Tip>
**¿Por qué usar LiteLLM con OpenClaw?**

- **Seguimiento de costos** — Ve exactamente lo que OpenClaw gasta en todos los modelos
- **Enrutamiento de modelos** — Cambia entre Claude, GPT-4, Gemini y Bedrock sin cambios de configuración
- **Claves virtuales** — Crea claves con límites de gasto para OpenClaw
- **Registros** — Registros completos de solicitud/respuesta para depuración
- **Respaldos** — Respaldo automático si tu proveedor principal no está disponible

</Tip>

## Inicio rápido

<Tabs>
  <Tab title="Incorporación (recomendado)">
    **Mejor para:** la vía más rápida hacia una configuración funcional de LiteLLM.

    <Steps>
      <Step title="Ejecutar la incorporación">
        ```bash
        openclaw onboard --auth-choice litellm-api-key
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Configuración manual">
    **Mejor para:** control total sobre la instalación y la configuración.

    <Steps>
      <Step title="Iniciar LiteLLM Proxy">
        ```bash
        pip install 'litellm[proxy]'
        litellm --model claude-opus-4-6
        ```
      </Step>
      <Step title="Apuntar OpenClaw a LiteLLM">
        ```bash
        export LITELLM_API_KEY="your-litellm-key"

        openclaw
        ```

        Eso es todo. OpenClaw ahora enruta a través de LiteLLM.
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Configuración

### Variables de entorno

```bash
export LITELLM_API_KEY="sk-litellm-key"
```

### Archivo de configuración

```json5
{
  models: {
    providers: {
      litellm: {
        baseUrl: "http://localhost:4000",
        apiKey: "${LITELLM_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "claude-opus-4-6",
            name: "Claude Opus 4.6",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 200000,
            maxTokens: 64000,
          },
          {
            id: "gpt-4o",
            name: "GPT-4o",
            reasoning: false,
            input: ["text", "image"],
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "litellm/claude-opus-4-6" },
    },
  },
}
```

## Configuración avanzada

### Generación de imágenes

LiteLLM también puede respaldar la herramienta `image_generate` a través de rutas
compatibles con OpenAI `/images/generations` y `/images/edits`. Configura un
modelo de imágenes de LiteLLM en `agents.defaults.imageGenerationModel`:

```json5
{
  models: {
    providers: {
      litellm: {
        baseUrl: "http://localhost:4000",
        apiKey: "${LITELLM_API_KEY}",
      },
    },
  },
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "litellm/gpt-image-2",
        timeoutMs: 180_000,
      },
    },
  },
}
```

Las URL de LiteLLM de local loopback, como `http://localhost:4000`, funcionan sin una
anulación global de red privada. Para un proxy alojado en la LAN, establece
`models.providers.litellm.request.allowPrivateNetwork: true` porque la clave de API
se enviará al host proxy configurado.

<AccordionGroup>
  <Accordion title="Claves virtuales">
    Crea una clave dedicada para OpenClaw con límites de gasto:

    ```bash
    curl -X POST "http://localhost:4000/key/generate" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
      -H "Content-Type: application/json" \
      -d '{
        "key_alias": "openclaw",
        "max_budget": 50.00,
        "budget_duration": "monthly"
      }'
    ```

    Usa la clave generada como `LITELLM_API_KEY`.

  </Accordion>

  <Accordion title="Enrutamiento de modelos">
    LiteLLM puede enrutar solicitudes de modelo a diferentes backends. Configúralo en tu `config.yaml` de LiteLLM:

    ```yaml
    model_list:
      - model_name: claude-opus-4-6
        litellm_params:
          model: claude-opus-4-6
          api_key: os.environ/ANTHROPIC_API_KEY

      - model_name: gpt-4o
        litellm_params:
          model: gpt-4o
          api_key: os.environ/OPENAI_API_KEY
    ```

    OpenClaw sigue solicitando `claude-opus-4-6` — LiteLLM se encarga del enrutamiento.

  </Accordion>

  <Accordion title="Ver el uso">
    Consulta el panel o la API de LiteLLM:

    ```bash
    # Información de la clave
    curl "http://localhost:4000/key/info" \
      -H "Authorization: Bearer sk-litellm-key"

    # Registros de gasto
    curl "http://localhost:4000/spend/logs" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY"
    ```

  </Accordion>

  <Accordion title="Notas sobre el comportamiento del proxy">
    - LiteLLM se ejecuta en `http://localhost:4000` de forma predeterminada
    - OpenClaw se conecta a través del endpoint `/v1` compatible con OpenAI
      de estilo proxy de LiteLLM
    - El formateo nativo de solicitudes solo de OpenAI no se aplica a través de LiteLLM:
      no hay `service_tier`, no hay `store` de Responses, no hay pistas de caché de prompt, ni
      formateo de carga compatible con reasoning de OpenAI
    - Los encabezados de atribución ocultos de OpenClaw (`originator`, `version`, `User-Agent`)
      no se inyectan en URL base personalizadas de LiteLLM
  </Accordion>
</AccordionGroup>

<Note>
Para la configuración general de proveedores y el comportamiento de respaldo, consulta [Proveedores de modelos](/es/concepts/model-providers).
</Note>

## Relacionado

<CardGroup cols={2}>
  <Card title="Documentación de LiteLLM" href="https://docs.litellm.ai" icon="book">
    Documentación oficial de LiteLLM y referencia de la API.
  </Card>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Visión general de todos los proveedores, referencias de modelos y comportamiento de respaldo.
  </Card>
  <Card title="Configuración" href="/es/gateway/configuration" icon="gear">
    Referencia completa de configuración.
  </Card>
  <Card title="Selección de modelos" href="/es/concepts/models" icon="brain">
    Cómo elegir y configurar modelos.
  </Card>
</CardGroup>
