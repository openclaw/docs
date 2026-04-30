---
read_when:
    - Quieres enrutar OpenClaw a través de un proxy LiteLLM
    - Necesitas seguimiento de costos, registro o enrutamiento de modelos a través de LiteLLM
summary: Ejecuta OpenClaw a través de LiteLLM Proxy para un acceso unificado a modelos y seguimiento de costos
title: LiteLLM
x-i18n:
    generated_at: "2026-04-30T05:57:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 26b5150cfca92c9cd425c864c711efb3ab62ef94377b9d1e5d6476b07bf4c800
    source_path: providers/litellm.md
    workflow: 16
---

[LiteLLM](https://litellm.ai) es un Gateway LLM de código abierto que proporciona una API unificada para más de 100 proveedores de modelos. Enruta OpenClaw a través de LiteLLM para obtener seguimiento centralizado de costos, registros y la flexibilidad de cambiar de backends sin modificar tu configuración de OpenClaw.

<Tip>
**¿Por qué usar LiteLLM con OpenClaw?**

- **Seguimiento de costos** — Ve exactamente cuánto gasta OpenClaw en todos los modelos
- **Enrutamiento de modelos** — Cambia entre Claude, GPT-4, Gemini y Bedrock sin cambios de configuración
- **Claves virtuales** — Crea claves con límites de gasto para OpenClaw
- **Registros** — Registros completos de solicitudes/respuestas para depuración
- **Conmutación por error** — Conmutación automática por error si tu proveedor principal no está disponible

</Tip>

## Inicio rápido

<Tabs>
  <Tab title="Incorporación (recomendado)">
    **Ideal para:** la ruta más rápida hacia una configuración funcional de LiteLLM.

    <Steps>
      <Step title="Ejecutar la incorporación">
        ```bash
        openclaw onboard --auth-choice litellm-api-key
        ```

        Para una configuración no interactiva contra un proxy remoto, pasa explícitamente la URL del proxy:

        ```bash
        openclaw onboard --non-interactive --auth-choice litellm-api-key --litellm-api-key "$LITELLM_API_KEY" --custom-base-url "https://litellm.example/v1"
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Configuración manual">
    **Ideal para:** control total sobre la instalación y la configuración.

    <Steps>
      <Step title="Iniciar el proxy de LiteLLM">
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

        Eso es todo. OpenClaw ahora se enruta a través de LiteLLM.
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

LiteLLM también puede respaldar la herramienta `image_generate` mediante rutas
compatibles con OpenAI `/images/generations` y `/images/edits`. Configura un modelo
de imagen de LiteLLM en `agents.defaults.imageGenerationModel`:

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

Las URL de LiteLLM de local loopback como `http://localhost:4000` funcionan sin una
anulación global de red privada. Para un proxy alojado en LAN, establece
`models.providers.litellm.request.allowPrivateNetwork: true` porque la clave de API
se enviará al host de proxy configurado.

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
    LiteLLM puede enrutar solicitudes de modelos a distintos backends. Configúralo en tu `config.yaml` de LiteLLM:

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

    OpenClaw sigue solicitando `claude-opus-4-6`; LiteLLM se encarga del enrutamiento.

  </Accordion>

  <Accordion title="Ver uso">
    Consulta el panel o la API de LiteLLM:

    ```bash
    # Key info
    curl "http://localhost:4000/key/info" \
      -H "Authorization: Bearer sk-litellm-key"

    # Spend logs
    curl "http://localhost:4000/spend/logs" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY"
    ```

  </Accordion>

  <Accordion title="Notas sobre el comportamiento del proxy">
    - LiteLLM se ejecuta en `http://localhost:4000` de forma predeterminada
    - OpenClaw se conecta a través del endpoint `/v1` compatible con OpenAI
      de estilo proxy de LiteLLM
    - La conformación de solicitudes exclusiva de OpenAI nativa no se aplica a través de LiteLLM:
      sin `service_tier`, sin `store` de Responses, sin indicaciones de caché de prompts y sin
      conformación de payload de compatibilidad con razonamiento de OpenAI
    - Los encabezados de atribución ocultos de OpenClaw (`originator`, `version`, `User-Agent`)
      no se inyectan en URL base personalizadas de LiteLLM
  </Accordion>
</AccordionGroup>

<Note>
Para la configuración general de proveedores y el comportamiento de conmutación por error, consulta [Proveedores de modelos](/es/concepts/model-providers).
</Note>

## Relacionado

<CardGroup cols={2}>
  <Card title="Documentación de LiteLLM" href="https://docs.litellm.ai" icon="book">
    Documentación oficial y referencia de API de LiteLLM.
  </Card>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Resumen de todos los proveedores, referencias de modelos y comportamiento de conmutación por error.
  </Card>
  <Card title="Configuración" href="/es/gateway/configuration" icon="gear">
    Referencia completa de configuración.
  </Card>
  <Card title="Selección de modelos" href="/es/concepts/models" icon="brain">
    Cómo elegir y configurar modelos.
  </Card>
</CardGroup>
