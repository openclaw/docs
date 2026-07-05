---
read_when:
    - Quieres usar modelos OSS alojados en Bedrock Mantle con OpenClaw
    - Necesitas el endpoint compatible con OpenAI de Mantle para GPT-OSS, Qwen, Kimi o GLM
summary: Usa modelos de Amazon Bedrock Mantle (compatibles con OpenAI) con OpenClaw
title: Mantle de Amazon Bedrock
x-i18n:
    generated_at: "2026-07-05T11:34:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7c1c930ee91661df184de159cc9d0430b5e4f31a0b6b2f0664894901e0d018a3
    source_path: providers/bedrock-mantle.md
    workflow: 16
---

OpenClaw incluye un proveedor **Amazon Bedrock Mantle** integrado que se conecta al
punto de conexión compatible con OpenAI de Mantle. Mantle aloja modelos de código
abierto y de terceros (GPT-OSS, Qwen, Kimi, GLM y similares) mediante una
superficie estándar `/v1/chat/completions` respaldada por la infraestructura de Bedrock. Mantle también
expone dos modelos Anthropic Claude mediante una ruta Anthropic Messages.

| Propiedad             | Valor                                                                                                      |
| --------------------- | ---------------------------------------------------------------------------------------------------------- |
| ID de proveedor       | `amazon-bedrock-mantle`                                                                                    |
| API                   | `openai-completions` para modelos OSS descubiertos, `anthropic-messages` para los dos modelos Claude       |
| Autenticación         | `AWS_BEARER_TOKEN_BEDROCK` explícito o generación de token de portador mediante cadena de credenciales IAM |
| Región predeterminada | `us-east-1` (sobrescribir con `AWS_REGION` o `AWS_DEFAULT_REGION`)                                         |

## Primeros pasos

Elige tu método de autenticación preferido y sigue los pasos de configuración.

<Tabs>
  <Tab title="Explicit bearer token">
    **Mejor para:** entornos donde ya tienes un token de portador de Mantle.

    <Steps>
      <Step title="Set the bearer token on the gateway host">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        Opcionalmente, configura una región (el valor predeterminado es `us-east-1`):

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Verify models are discovered">
        ```bash
        openclaw models list
        ```

        Los modelos descubiertos aparecen bajo el proveedor `amazon-bedrock-mantle`. No se
        requiere configuración adicional, salvo que quieras sobrescribir los valores predeterminados.
      </Step>
    </Steps>

  </Tab>

  <Tab title="IAM credentials">
    **Mejor para:** usar credenciales compatibles con AWS SDK (configuración compartida, SSO, identidad web, roles de instancia o de tarea).

    <Steps>
      <Step title="Configure AWS credentials on the gateway host">
        Funciona cualquier origen de autenticación compatible con AWS SDK:

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Verify models are discovered">
        ```bash
        openclaw models list
        ```

        OpenClaw genera automáticamente un token de portador de Mantle a partir de la cadena de credenciales.
      </Step>
    </Steps>

    <Tip>
    Cuando `AWS_BEARER_TOKEN_BEDROCK` no está configurado, OpenClaw crea el token de portador por ti a partir de la cadena de credenciales predeterminada de AWS, incluidas las credenciales compartidas, los perfiles de configuración, SSO, identidad web y roles de instancia o de tarea.
    </Tip>

  </Tab>
</Tabs>

## Descubrimiento automático de modelos

Cuando `AWS_BEARER_TOKEN_BEDROCK` está configurado, OpenClaw lo usa directamente. De lo contrario,
OpenClaw intenta generar un token de portador de Mantle a partir de la cadena de
credenciales predeterminada de AWS. Luego descubre los modelos de Mantle disponibles consultando el
punto de conexión `/v1/models` de la región.

| Comportamiento           | Detalle                                                                                       |
| ------------------------ | --------------------------------------------------------------------------------------------- |
| Caché de descubrimiento  | Resultados almacenados en caché durante 1 hora por región; un fallo de obtención devuelve el último resultado almacenado en caché |
| Actualización de token IAM | Cada 2 horas, almacenado en caché por región                                                 |

Para mantener el Plugin de Mantle habilitado pero suprimir el descubrimiento automático y la generación
del token de portador IAM, deshabilita el conmutador de descubrimiento propiedad del Plugin:

```bash
openclaw config set plugins.entries.amazon-bedrock-mantle.config.discovery.enabled false
```

<Note>
El token de portador es el mismo `AWS_BEARER_TOKEN_BEDROCK` que usa el proveedor estándar [Amazon Bedrock](/es/providers/bedrock).
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
    La compatibilidad con razonamiento se infiere de los ID de modelo que contienen patrones como
    `thinking`, `reasoner`, `reasoning`, `deepseek.r`, `gpt-oss-120b` o
    `gpt-oss-safeguard-120b`. OpenClaw establece `reasoning: true` automáticamente para
    los modelos coincidentes durante el descubrimiento.
  </Accordion>

  <Accordion title="Endpoint unavailability">
    Si el punto de conexión de Mantle no está disponible, no devuelve modelos o falla la
    resolución del token de portador, el descubrimiento devuelve un resultado vacío y se omite el
    proveedor implícito. OpenClaw no genera un error; los demás proveedores configurados
    siguen funcionando con normalidad.
  </Accordion>

  <Accordion title="Claude Opus 4.7 and Claude Mythos Preview via the Anthropic Messages route">
    OpenClaw siempre agrega dos modelos Claude al catálogo de Mantle después de un
    descubrimiento correcto, independientemente de lo que devuelva `/v1/models`:
    `amazon-bedrock-mantle/anthropic.claude-opus-4-7` (Claude Opus 4.7) y
    `amazon-bedrock-mantle/anthropic.claude-mythos-preview` (Claude Mythos
    Preview). Ambos usan la superficie de API `anthropic-messages` y transmiten mediante
    el mismo punto de conexión compatible con Anthropic autenticado con token de portador
    (`<mantle-base>/anthropic`), por lo que el token de portador de AWS no se trata como una
    clave de API de Anthropic.

    Claude Mythos Preview siempre solicita razonamiento, con un valor predeterminado de esfuerzo `high`
    cuando no se establece ningún nivel `/think` (mapeado desde `xhigh`/`max` hacia
    `high`, y desde `minimal` hacia `low`). Opus 4.7 en Mantle transmite sin
    razonamiento proporcionado por el modelo, y OpenClaw omite su parámetro `temperature`
    porque Opus 4.7 no acepta sobrescrituras de muestreo en esta ruta; Mythos
    Preview acepta normalmente una sobrescritura de `temperature`.

    Estos dos modelos no se pueden configurar mediante entradas `models.providers["amazon-bedrock-mantle"].models`
    — siempre los agrega el descubrimiento cuando se completa correctamente, y solo se
    eliminan deshabilitando el descubrimiento por completo.

  </Accordion>

  <Accordion title="Relationship to Amazon Bedrock provider">
    Bedrock Mantle es un proveedor independiente del proveedor estándar
    [Amazon Bedrock](/es/providers/bedrock). Mantle usa una superficie `/v1`
    compatible con OpenAI para su catálogo OSS, mientras que el proveedor estándar
    Bedrock usa la API nativa Bedrock Converse.

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
