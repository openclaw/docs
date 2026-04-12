---
read_when:
    - Quieres usar modelos OSS alojados en Bedrock Mantle con OpenClaw
    - Necesitas el endpoint compatible con OpenAI de Mantle para GPT-OSS, Qwen, Kimi o GLM
summary: Usa modelos de Amazon Bedrock Mantle (compatibles con OpenAI) con OpenClaw
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-04-12T23:29:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 27e602b6f6a3ae92427de135cb9df6356e0daaea6b6fe54723a7542dd0d5d21e
    source_path: providers/bedrock-mantle.md
    workflow: 15
---

# Amazon Bedrock Mantle

OpenClaw incluye un proveedor integrado de **Amazon Bedrock Mantle** que se conecta al endpoint compatible con OpenAI de Mantle. Mantle aloja modelos de código abierto y de terceros (GPT-OSS, Qwen, Kimi, GLM y similares) a través de una superficie estándar de `/v1/chat/completions` respaldada por la infraestructura de Bedrock.

| Propiedad      | Valor                                                                               |
| -------------- | ----------------------------------------------------------------------------------- |
| ID del proveedor | `amazon-bedrock-mantle`                                                             |
| API            | `openai-completions` (compatible con OpenAI)                                        |
| Autenticación  | `AWS_BEARER_TOKEN_BEDROCK` explícito o generación de bearer token mediante la cadena de credenciales de IAM |
| Región predeterminada | `us-east-1` (sustituible con `AWS_REGION` o `AWS_DEFAULT_REGION`)                    |

## Primeros pasos

Elige tu método de autenticación preferido y sigue los pasos de configuración.

<Tabs>
  <Tab title="Explicit bearer token">
    **Ideal para:** entornos en los que ya tienes un bearer token de Mantle.

    <Steps>
      <Step title="Set the bearer token on the gateway host">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        Opcionalmente, establece una región (el valor predeterminado es `us-east-1`):

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Verify models are discovered">
        ```bash
        openclaw models list
        ```

        Los modelos detectados aparecen bajo el proveedor `amazon-bedrock-mantle`. No se requiere configuración adicional a menos que quieras sustituir los valores predeterminados.
      </Step>
    </Steps>

  </Tab>

  <Tab title="IAM credentials">
    **Ideal para:** usar credenciales compatibles con AWS SDK (configuración compartida, SSO, web identity, roles de instancia o de tarea).

    <Steps>
      <Step title="Configure AWS credentials on the gateway host">
        Cualquier origen de autenticación compatible con AWS SDK funciona:

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
    Cuando `AWS_BEARER_TOKEN_BEDROCK` no está establecido, OpenClaw genera el bearer token por ti a partir de la cadena de credenciales predeterminada de AWS, incluidos perfiles compartidos de credenciales/configuración, SSO, web identity y roles de instancia o de tarea.
    </Tip>

  </Tab>
</Tabs>

## Detección automática de modelos

Cuando `AWS_BEARER_TOKEN_BEDROCK` está establecido, OpenClaw lo usa directamente. En caso contrario, OpenClaw intenta generar un bearer token de Mantle a partir de la cadena de credenciales predeterminada de AWS. Luego detecta los modelos de Mantle disponibles consultando el endpoint regional `/v1/models`.

| Comportamiento    | Detalle                  |
| ----------------- | ------------------------ |
| Caché de detección | Resultados en caché durante 1 hora |
| Renovación del token de IAM | Cada hora                    |

<Note>
El bearer token es el mismo `AWS_BEARER_TOKEN_BEDROCK` que usa el proveedor estándar de [Amazon Bedrock](/es/providers/bedrock).
</Note>

### Regiones compatibles

`us-east-1`, `us-east-2`, `us-west-2`, `ap-northeast-1`,
`ap-south-1`, `ap-southeast-3`, `eu-central-1`, `eu-west-1`, `eu-west-2`,
`eu-south-1`, `eu-north-1`, `sa-east-1`.

## Configuración manual

Si prefieres una configuración explícita en lugar de la detección automática:

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

## Notas avanzadas

<AccordionGroup>
  <Accordion title="Reasoning support">
    La compatibilidad con reasoning se infiere a partir de IDs de modelo que contienen patrones como `thinking`, `reasoner` o `gpt-oss-120b`. OpenClaw establece `reasoning: true` automáticamente para los modelos coincidentes durante la detección.
  </Accordion>

  <Accordion title="Endpoint unavailability">
    Si el endpoint de Mantle no está disponible o no devuelve modelos, el proveedor se omite silenciosamente. OpenClaw no produce un error; otros proveedores configurados siguen funcionando con normalidad.
  </Accordion>

  <Accordion title="Relationship to Amazon Bedrock provider">
    Bedrock Mantle es un proveedor independiente del proveedor estándar de [Amazon Bedrock](/es/providers/bedrock). Mantle usa una superficie `/v1` compatible con OpenAI, mientras que el proveedor estándar de Bedrock usa la API nativa de Bedrock.

    Ambos proveedores comparten la misma credencial `AWS_BEARER_TOKEN_BEDROCK` cuando está presente.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/es/providers/bedrock" icon="cloud">
    Proveedor nativo de Bedrock para Anthropic Claude, Titan y otros modelos.
  </Card>
  <Card title="Model selection" href="/es/concepts/model-providers" icon="layers">
    Cómo elegir proveedores, refs de modelos y comportamiento de failover.
  </Card>
  <Card title="OAuth and auth" href="/es/gateway/authentication" icon="key">
    Detalles de autenticación y reglas de reutilización de credenciales.
  </Card>
  <Card title="Troubleshooting" href="/es/help/troubleshooting" icon="wrench">
    Problemas comunes y cómo resolverlos.
  </Card>
</CardGroup>
