---
read_when:
    - Quieres usar modelos OSS alojados en Bedrock Mantle con OpenClaw
    - Necesitas el punto de conexión compatible con OpenAI de Mantle para GPT-OSS, Qwen, Kimi o GLM
summary: Usar modelos de Amazon Bedrock Mantle (compatibles con OpenAI) con OpenClaw
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-06-27T12:34:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5e14026e4fb25b13994061f2aaa5294df44ce8fe1ba99e031b8c92a41a4a9b49
    source_path: providers/bedrock-mantle.md
    workflow: 16
---

OpenClaw incluye un proveedor **Amazon Bedrock Mantle** integrado que se conecta al
endpoint compatible con OpenAI de Mantle. Mantle aloja modelos de código abierto y
de terceros (GPT-OSS, Qwen, Kimi, GLM y similares) mediante una superficie estándar
`/v1/chat/completions` respaldada por la infraestructura de Bedrock.

| Propiedad              | Valor                                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------------------ |
| ID del proveedor       | `amazon-bedrock-mantle`                                                                                      |
| API                    | `openai-completions` (compatible con OpenAI) o `anthropic-messages` (ruta de Anthropic Messages)             |
| Autenticación          | `AWS_BEARER_TOKEN_BEDROCK` explícito o generación de bearer token mediante la cadena de credenciales de IAM  |
| Región predeterminada  | `us-east-1` (sobrescribir con `AWS_REGION` o `AWS_DEFAULT_REGION`)                                           |

## Primeros pasos

Elige tu método de autenticación preferido y sigue los pasos de configuración.

<Tabs>
  <Tab title="Explicit bearer token">
    **Ideal para:** entornos donde ya tienes un bearer token de Mantle.

    <Steps>
      <Step title="Set the bearer token on the gateway host">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        Opcionalmente, define una región (el valor predeterminado es `us-east-1`):

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Opt in to provider data sharing for Claude Fable 5">
        Claude Fable 5 y los modelos Bedrock de clase Claude Mythos requieren el modo `provider_data_share` de la API Mantle Data Retention antes de la invocación. Esta adhesión permite que Bedrock comparta prompts y completions con Anthropic y los conserve hasta 30 días para revisión de confianza y seguridad.

        ```bash
        AWS_REGION="${AWS_REGION:-us-east-1}"
        curl -X PUT "https://bedrock-mantle.${AWS_REGION}.api.aws/v1/data_retention" \
          -H "Authorization: Bearer $AWS_BEARER_TOKEN_BEDROCK" \
          -H "Content-Type: application/json" \
          -d '{ "mode": "provider_data_share" }'
        ```

        Usa otro modelo de Bedrock en la configuración si no puedes aceptar ese modo de retención.
      </Step>
      <Step title="Verify models are discovered">
        ```bash
        openclaw models list
        ```

        Los modelos descubiertos aparecen bajo el proveedor `amazon-bedrock-mantle`. No se requiere
        configuración adicional salvo que quieras sobrescribir los valores predeterminados.
      </Step>
    </Steps>

  </Tab>

  <Tab title="IAM credentials">
    **Ideal para:** usar credenciales compatibles con AWS SDK (configuración compartida, SSO, identidad web, roles de instancia o de tarea).

    <Steps>
      <Step title="Configure AWS credentials on the gateway host">
        Cualquier fuente de autenticación compatible con AWS SDK funciona:

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Verify models are discovered">
        ```bash
        openclaw models list
        ```

        OpenClaw genera automáticamente un bearer token de Mantle a partir de la cadena de credenciales.
      </Step>
    </Steps>

    <Tip>
    Cuando `AWS_BEARER_TOKEN_BEDROCK` no está definido, OpenClaw crea el bearer token por ti a partir de la cadena de credenciales predeterminada de AWS, incluidos perfiles de credenciales/configuración compartidas, SSO, identidad web y roles de instancia o de tarea.
    </Tip>

  </Tab>
</Tabs>

## Descubrimiento automático de modelos

Cuando `AWS_BEARER_TOKEN_BEDROCK` está definido, OpenClaw lo usa directamente. En caso contrario,
OpenClaw intenta generar un bearer token de Mantle a partir de la cadena de
credenciales predeterminada de AWS. Luego descubre los modelos de Mantle disponibles consultando el
endpoint `/v1/models` de la región.

| Comportamiento          | Detalle                         |
| ----------------------- | ------------------------------- |
| Caché de descubrimiento | Resultados en caché durante 1 hora |
| Actualización de token IAM | Cada hora                    |

Para mantener habilitado el Plugin de Mantle pero suprimir el descubrimiento automático y la generación de
bearer tokens de IAM, deshabilita el selector de descubrimiento propiedad del Plugin:

```bash
openclaw config set plugins.entries.amazon-bedrock-mantle.config.discovery.enabled false
```

<Note>
El bearer token es el mismo `AWS_BEARER_TOKEN_BEDROCK` que usa el proveedor estándar [Amazon Bedrock](/es/providers/bedrock).
</Note>

### Regiones compatibles

`us-east-1`, `us-east-2`, `us-west-2`, `ap-northeast-1`,
`ap-south-1`, `ap-southeast-3`, `eu-central-1`, `eu-west-1`, `eu-west-2`,
`eu-south-1`, `eu-north-1`, `sa-east-1`.

## Configuración manual

Si prefieres una configuración explícita en lugar del descubrimiento automático:

```json5
{
  models: {
    providers: {
      "amazon-bedrock-mantle": {
        baseUrl: "https://bedrock-mantle.us-east-1.api.aws/v1",
        api: "openai-completions",
        auth: "api-key",
        apiKey: "env:AWS_BEARER_TOKEN_BEDROCK",
        models: [
          {
            id: "gpt-oss-120b",
            name: "GPT-OSS 120B",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 32000,
            maxTokens: 4096,
          },
        ],
      },
    },
  },
}
```

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Reasoning support">
    El soporte de razonamiento se infiere a partir de IDs de modelo que contienen patrones como
    `thinking`, `reasoner` o `gpt-oss-120b`. OpenClaw define `reasoning: true`
    automáticamente para los modelos coincidentes durante el descubrimiento.
  </Accordion>

  <Accordion title="Endpoint unavailability">
    Si el endpoint de Mantle no está disponible o no devuelve modelos, el proveedor se
    omite silenciosamente. OpenClaw no genera un error; otros proveedores configurados
    continúan funcionando normalmente.
  </Accordion>

  <Accordion title="Claude Opus 4.7 via the Anthropic Messages route">
    Mantle también expone una ruta de Anthropic Messages que transporta modelos Claude mediante la misma ruta de streaming autenticada con bearer token. Claude Opus 4.7 (`amazon-bedrock-mantle/claude-opus-4.7`) se puede invocar mediante esta ruta con streaming propiedad del proveedor, por lo que los bearer tokens de AWS no se tratan como claves de API de Anthropic.

    Cuando fijas un modelo de Anthropic Messages en el proveedor Mantle, OpenClaw usa la superficie de API `anthropic-messages` en lugar de `openai-completions` para ese modelo. La autenticación sigue viniendo de `AWS_BEARER_TOKEN_BEDROCK` (o del bearer token de IAM creado).

    ```json5
    {
      models: {
        providers: {
          "amazon-bedrock-mantle": {
            models: [
              {
                id: "claude-opus-4.7",
                name: "Claude Opus 4.7",
                api: "anthropic-messages",
                reasoning: true,
                input: ["text", "image"],
                contextWindow: 1000000,
                maxTokens: 32000,
              },
            ],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Relationship to Amazon Bedrock provider">
    Bedrock Mantle es un proveedor separado del proveedor estándar
    [Amazon Bedrock](/es/providers/bedrock). Mantle usa una superficie `/v1`
    compatible con OpenAI, mientras que el proveedor estándar de Bedrock usa
    la API nativa de Bedrock.

    Ambos proveedores comparten la misma credencial `AWS_BEARER_TOKEN_BEDROCK` cuando
    está presente.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/es/providers/bedrock" icon="cloud">
    Proveedor nativo de Bedrock para Anthropic Claude, Titan y otros modelos.
  </Card>
  <Card title="Model selection" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelo y comportamiento de conmutación por error.
  </Card>
  <Card title="OAuth and auth" href="/es/gateway/authentication" icon="key">
    Detalles de autenticación y reglas de reutilización de credenciales.
  </Card>
  <Card title="Troubleshooting" href="/es/help/troubleshooting" icon="wrench">
    Problemas comunes y cómo resolverlos.
  </Card>
</CardGroup>
