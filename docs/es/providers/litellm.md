---
read_when:
    - Quieres enrutar OpenClaw a través de un proxy LiteLLM
    - Necesitas seguimiento de costes, registro o enrutamiento de modelos mediante LiteLLM
summary: Ejecuta OpenClaw mediante LiteLLM Proxy para unificar el acceso a los modelos y realizar un seguimiento de los costes
title: LiteLLM
x-i18n:
    generated_at: "2026-07-11T23:26:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 797b7d02a80a4cd37b92553665e260532af49e011398202d3504a28c511cee2f
    source_path: providers/litellm.md
    workflow: 16
---

[LiteLLM](https://litellm.ai) es un gateway de LLM de código abierto con una API unificada para más de 100
proveedores de modelos. Enrute OpenClaw a través de LiteLLM para centralizar el seguimiento de costos, el registro, las claves virtuales con
límites de gasto y la conmutación por error entre backends sin cambiar la configuración de OpenClaw.

## Inicio rápido

<Tabs>
  <Tab title="Incorporación (recomendado)">
    ```bash
    openclaw onboard --auth-choice litellm-api-key
    ```

    Para realizar una configuración no interactiva con un proxy remoto, pase explícitamente la URL del proxy:

    ```bash
    openclaw onboard --non-interactive --accept-risk --auth-choice litellm-api-key \
      --litellm-api-key "$LITELLM_API_KEY" --custom-base-url "https://litellm.example/v1"
    ```

  </Tab>

  <Tab title="Configuración manual">
    <Steps>
      <Step title="Iniciar el proxy de LiteLLM">
        ```bash
        pip install 'litellm[proxy]'
        litellm --model claude-opus-4-6
        ```
      </Step>
      <Step title="Conectar OpenClaw a LiteLLM">
        ```bash
        export LITELLM_API_KEY="your-litellm-key"
        openclaw
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

## Configuración

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

El modelo predeterminado que escribe el proceso de incorporación es `litellm/claude-opus-4-6`.

## Generación de imágenes

LiteLLM puede servir de backend para la herramienta `image_generate` mediante las rutas compatibles con OpenAI `/images/generations` y
`/images/edits`. El modelo de imágenes predeterminado es `gpt-image-2`; configure otro en
`agents.defaults.imageGenerationModel`:

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

Las URL de LiteLLM en local loopback (`http://localhost:4000`, `127.0.0.1`, `::1`, `host.docker.internal`) funcionan
sin una anulación global de la red privada. Para un proxy alojado en la LAN, establezca
`models.providers.litellm.request.allowPrivateNetwork: true`, ya que la clave de API se envía a ese host.

## Opciones avanzadas

<AccordionGroup>
  <Accordion title="Claves virtuales">
    Cree una clave específica para OpenClaw con límites de gasto:

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

    Use la clave generada como `LITELLM_API_KEY`.

  </Accordion>

  <Accordion title="Enrutamiento de modelos">
    LiteLLM puede enrutar las solicitudes de modelos a distintos backends. Configúrelo en el archivo `config.yaml` de LiteLLM:

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

  <Accordion title="Consultar el uso">
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
    - LiteLLM se ejecuta de forma predeterminada en `http://localhost:4000`.
    - OpenClaw se conecta a través del endpoint `/v1` compatible con OpenAI y de tipo proxy de LiteLLM.
    - La adaptación de solicitudes exclusiva de OpenAI nativo no se aplica a través de una URL base de LiteLLM configurada:
      sin `service_tier`, sin `store` de Responses, sin indicaciones para la caché de prompts y sin adaptación de la carga útil
      del esfuerzo de razonamiento de OpenAI.
    - Los encabezados ocultos de atribución de OpenClaw (`originator`, `version`, `User-Agent`) solo se envían a
      endpoints nativos de OpenAI verificados, por lo que no se insertan al usar una URL base personalizada de LiteLLM.
  </Accordion>
</AccordionGroup>

<Note>
Para obtener información general sobre la configuración de proveedores y el comportamiento de conmutación por error, consulte [Proveedores de modelos](/es/concepts/model-providers).
</Note>

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="Documentación de LiteLLM" href="https://docs.litellm.ai" icon="book">
    Documentación oficial de LiteLLM y referencia de la API.
  </Card>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Descripción general de todos los proveedores, las referencias de modelos y el comportamiento de conmutación por error.
  </Card>
  <Card title="Configuración" href="/es/gateway/configuration" icon="gear">
    Referencia completa de configuración.
  </Card>
  <Card title="Modelos" href="/es/concepts/models" icon="brain">
    Cómo elegir y configurar modelos.
  </Card>
</CardGroup>
