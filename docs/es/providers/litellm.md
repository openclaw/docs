---
read_when:
    - Quieres enrutar OpenClaw a través de un proxy de LiteLLM
    - Necesitas seguimiento de costos, registro o enrutamiento de modelos mediante LiteLLM
summary: Ejecuta OpenClaw a través de LiteLLM Proxy para acceso unificado a modelos y seguimiento de costos
title: LiteLLM
x-i18n:
    generated_at: "2026-04-24T05:44:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9da14e6ded4c9e0b54989898a982987c0a60f6f6170d10b6cd2eddcd5106630f
    source_path: providers/litellm.md
    workflow: 15
---

[LiteLLM](https://litellm.ai) es una puerta de enlace de LLM de código abierto que ofrece una API unificada para más de 100 proveedores de modelos. Enruta OpenClaw a través de LiteLLM para obtener seguimiento centralizado de costos, registro y la flexibilidad de cambiar de backend sin modificar tu configuración de OpenClaw.

<Tip>
**¿Por qué usar LiteLLM con OpenClaw?**

- **Seguimiento de costos** — Ve exactamente cuánto gasta OpenClaw en todos los modelos
- **Enrutamiento de modelos** — Cambia entre Claude, GPT-4, Gemini, Bedrock sin cambios de configuración
- **Claves virtuales** — Crea claves con límites de gasto para OpenClaw
- **Registro** — Registros completos de solicitud/respuesta para depuración
- **Reservas** — Conmutación por error automática si tu proveedor principal no está disponible

</Tip>

## Inicio rápido

<Tabs>
  <Tab title="Incorporación (recomendado)">
    **Ideal para:** la forma más rápida de tener LiteLLM funcionando.

    <Steps>
      <Step title="Ejecuta la incorporación">
        ```bash
        openclaw onboard --auth-choice litellm-api-key
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Configuración manual">
    **Ideal para:** control total sobre la instalación y la configuración.

    <Steps>
      <Step title="Inicia LiteLLM Proxy">
        ```bash
        pip install 'litellm[proxy]'
        litellm --model claude-opus-4-6
        ```
      </Step>
      <Step title="Haz que OpenClaw apunte a LiteLLM">
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
    LiteLLM puede enrutar solicitudes de modelo a distintos backends. Configúralo en tu `config.yaml` de LiteLLM:

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
    - OpenClaw se conecta a través del endpoint `/v1` compatible con OpenAI estilo proxy de LiteLLM
    - La conformación nativa de solicitudes exclusiva de OpenAI no se aplica a través de LiteLLM:
      sin `service_tier`, sin `store` de Responses, sin sugerencias de caché de prompt ni
      sin conformación de carga útil de compatibilidad de razonamiento de OpenAI
    - Los encabezados ocultos de atribución de OpenClaw (`originator`, `version`, `User-Agent`)
      no se inyectan en `baseUrl` personalizadas de LiteLLM
  </Accordion>
</AccordionGroup>

<Note>
Para la configuración general del proveedor y el comportamiento de conmutación por error, consulta [Proveedores de modelos](/es/concepts/model-providers).
</Note>

## Relacionado

<CardGroup cols={2}>
  <Card title="Documentación de LiteLLM" href="https://docs.litellm.ai" icon="book">
    Documentación oficial de LiteLLM y referencia de la API.
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
