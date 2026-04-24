---
read_when:
    - Quieres usar modelos OSS alojados en Bedrock Mantle con OpenClaw
    - Necesitas el endpoint compatible con OpenAI de Mantle para GPT-OSS, Qwen, Kimi o GLM
summary: Usa modelos Amazon Bedrock Mantle (compatibles con OpenAI) con OpenClaw
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-04-24T05:43:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: c5e9fb65cd5f5151470f0d8eeb9edceb9b035863dcd863d2bcabe233c1cfce41
    source_path: providers/bedrock-mantle.md
    workflow: 15
---

OpenClaw incluye un proveedor integrado de **Amazon Bedrock Mantle** que se conecta al
endpoint compatible con OpenAI de Mantle. Mantle aloja modelos de código abierto y
de terceros (GPT-OSS, Qwen, Kimi, GLM y similares) a través de una superficie estándar
`/v1/chat/completions` respaldada por infraestructura de Bedrock.

| Propiedad      | Valor                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------ |
| ID del proveedor | `amazon-bedrock-mantle`                                                                  |
| API            | `openai-completions` (compatible con OpenAI) o `anthropic-messages` (ruta Anthropic Messages) |
| Autenticación  | `AWS_BEARER_TOKEN_BEDROCK` explícito o generación de bearer token mediante la cadena de credenciales IAM |
| Región predeterminada | `us-east-1` (sobrescríbela con `AWS_REGION` o `AWS_DEFAULT_REGION`)               |

## Primeros pasos

Elige tu método de autenticación preferido y sigue los pasos de configuración.

<Tabs>
  <Tab title="Bearer token explícito">
    **Ideal para:** entornos donde ya tienes un bearer token de Mantle.

    <Steps>
      <Step title="Configura el bearer token en el host del gateway">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        Configura opcionalmente una región (predeterminada: `us-east-1`):

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Verifica que se detectan los modelos">
        ```bash
        openclaw models list
        ```

        Los modelos detectados aparecen bajo el proveedor `amazon-bedrock-mantle`. No
        se requiere configuración adicional salvo que quieras sobrescribir los valores predeterminados.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Credenciales IAM">
    **Ideal para:** usar credenciales compatibles con AWS SDK (configuración compartida, SSO, identidad web, roles de instancia o de tarea).

    <Steps>
      <Step title="Configura credenciales AWS en el host del gateway">
        Cualquier origen de autenticación compatible con AWS SDK funciona:

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Verifica que se detectan los modelos">
        ```bash
        openclaw models list
        ```

        OpenClaw genera automáticamente un bearer token de Mantle a partir de la cadena de credenciales.
      </Step>
    </Steps>

    <Tip>
    Cuando `AWS_BEARER_TOKEN_BEDROCK` no está configurado, OpenClaw genera el bearer token por ti a partir de la cadena de credenciales predeterminada de AWS, incluidas credenciales/perfiles de configuración compartidos, SSO, identidad web y roles de instancia o tarea.
    </Tip>

  </Tab>
</Tabs>

## Detección automática de modelos

Cuando `AWS_BEARER_TOKEN_BEDROCK` está configurado, OpenClaw lo usa directamente. En caso contrario,
OpenClaw intenta generar un bearer token de Mantle a partir de la cadena predeterminada
de credenciales de AWS. Luego detecta los modelos Mantle disponibles consultando el
endpoint `/v1/models` de la región.

| Comportamiento      | Detalle                   |
| ------------------- | ------------------------- |
| Caché de detección  | Resultados en caché durante 1 hora |
| Actualización de token IAM | Cada hora           |

<Note>
El bearer token es el mismo `AWS_BEARER_TOKEN_BEDROCK` usado por el proveedor estándar de [Amazon Bedrock](/es/providers/bedrock).
</Note>

### Regiones compatibles

`us-east-1`, `us-east-2`, `us-west-2`, `ap-northeast-1`,
`ap-south-1`, `ap-southeast-3`, `eu-central-1`, `eu-west-1`, `eu-west-2`,
`eu-south-1`, `eu-north-1`, `sa-east-1`.

## Configuración manual

Si prefieres configuración explícita en lugar de detección automática:

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
  <Accordion title="Soporte de reasoning">
    El soporte de reasoning se infiere a partir de identificadores de modelo que contienen patrones como
    `thinking`, `reasoner` o `gpt-oss-120b`. OpenClaw configura `reasoning: true`
    automáticamente para los modelos coincidentes durante la detección.
  </Accordion>

  <Accordion title="Indisponibilidad del endpoint">
    Si el endpoint de Mantle no está disponible o no devuelve modelos, el proveedor se
    omite silenciosamente. OpenClaw no lanza error; los demás proveedores configurados
    siguen funcionando normalmente.
  </Accordion>

  <Accordion title="Claude Opus 4.7 mediante la ruta Anthropic Messages">
    Mantle también expone una ruta Anthropic Messages que transporta modelos Claude a través de la misma ruta de streaming autenticada con bearer. Claude Opus 4.7 (`amazon-bedrock-mantle/claude-opus-4.7`) puede llamarse mediante esta ruta con streaming propiedad del proveedor, por lo que los bearer tokens de AWS no se tratan como API keys de Anthropic.

    Cuando fijas un modelo Anthropic Messages en el proveedor Mantle, OpenClaw usa la superficie de API `anthropic-messages` en lugar de `openai-completions` para ese modelo. La autenticación sigue viniendo de `AWS_BEARER_TOKEN_BEDROCK` (o del bearer token IAM generado).

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

  <Accordion title="Relación con el proveedor Amazon Bedrock">
    Bedrock Mantle es un proveedor independiente del proveedor estándar
    de [Amazon Bedrock](/es/providers/bedrock). Mantle usa una superficie
    compatible con OpenAI en `/v1`, mientras que el proveedor Bedrock estándar usa
    la API nativa de Bedrock.

    Ambos proveedores comparten la misma credencial `AWS_BEARER_TOKEN_BEDROCK` cuando
    está presente.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/es/providers/bedrock" icon="cloud">
    Proveedor Bedrock nativo para Anthropic Claude, Titan y otros modelos.
  </Card>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, refs de modelo y comportamiento de failover.
  </Card>
  <Card title="OAuth y autenticación" href="/es/gateway/authentication" icon="key">
    Detalles de autenticación y reglas de reutilización de credenciales.
  </Card>
  <Card title="Solución de problemas" href="/es/help/troubleshooting" icon="wrench">
    Problemas comunes y cómo resolverlos.
  </Card>
</CardGroup>
