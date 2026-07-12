---
read_when:
    - Quieres usar modelos OSS alojados en Bedrock Mantle con OpenClaw
    - Necesitas el endpoint de Mantle compatible con OpenAI para GPT-OSS, Qwen, Kimi o GLM
    - Quieres usar Claude Sonnet 5 o Mythos 5 a través de Amazon Bedrock Mantle
summary: Usa los modelos de Amazon Bedrock Mantle compatibles con OpenAI y Claude Messages con OpenClaw
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-07-11T23:25:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 107ffdc76e3971a085f7d64d8d766f6cd8706ce882d8bab80d27c72ab545eec1
    source_path: providers/bedrock-mantle.md
    workflow: 16
---

OpenClaw incluye un proveedor **Amazon Bedrock Mantle** integrado que se conecta al
endpoint de Mantle compatible con OpenAI. Mantle aloja modelos de código abierto y
de terceros (GPT-OSS, Qwen, Kimi, GLM y similares) mediante una interfaz estándar
`/v1/chat/completions` respaldada por la infraestructura de Bedrock. Mantle también
expone modelos Anthropic Claude mediante una ruta de Anthropic Messages.

| Propiedad      | Valor                                                                                                     |
| -------------- | --------------------------------------------------------------------------------------------------------- |
| ID del proveedor | `amazon-bedrock-mantle`                                                                                 |
| API            | `openai-completions` para los modelos OSS detectados, `anthropic-messages` para los modelos Claude        |
| Autenticación  | `AWS_BEARER_TOKEN_BEDROCK` explícito o generación de tokens de portador mediante la cadena de credenciales de IAM |
| Región predeterminada | `us-east-1` (se puede sobrescribir con `AWS_REGION` o `AWS_DEFAULT_REGION`)                         |

## Primeros pasos

Elige el método de autenticación que prefieras y sigue los pasos de configuración.

<Tabs>
  <Tab title="Explicit bearer token">
    **Recomendado para:** entornos donde ya dispones de un token de portador de Mantle.

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

        Los modelos detectados aparecen bajo el proveedor `amazon-bedrock-mantle`. No
        se requiere ninguna configuración adicional, salvo que quieras sobrescribir
        los valores predeterminados.
      </Step>
    </Steps>

  </Tab>

  <Tab title="IAM credentials">
    **Recomendado para:** usar credenciales compatibles con AWS SDK (configuración compartida, SSO, identidad web y roles de instancia o tarea).

    <Steps>
      <Step title="Configure AWS credentials on the gateway host">
        Se puede usar cualquier origen de autenticación compatible con AWS SDK:

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
    Cuando `AWS_BEARER_TOKEN_BEDROCK` no está definido, OpenClaw genera el token de portador a partir de la cadena de credenciales predeterminada de AWS, incluidas las credenciales y los perfiles de configuración compartidos, SSO, la identidad web y los roles de instancia o tarea.
    </Tip>

  </Tab>
</Tabs>

## Detección automática de modelos

Cuando `AWS_BEARER_TOKEN_BEDROCK` está definido, OpenClaw lo usa directamente. De lo
contrario, OpenClaw intenta generar un token de portador de Mantle a partir de la
cadena de credenciales predeterminada de AWS. A continuación, detecta los modelos de
Mantle disponibles consultando el endpoint `/v1/models` de la región.

| Comportamiento            | Detalle                                                                                              |
| ------------------------- | ---------------------------------------------------------------------------------------------------- |
| Caché de detección        | Los resultados se almacenan en caché durante 1 hora por región; si falla la obtención, se devuelve el último resultado almacenado |
| Renovación del token IAM  | Cada 2 horas, almacenado en caché por región                                                         |

Para mantener habilitado el Plugin de Mantle, pero desactivar la detección automática
y la generación de tokens de portador de IAM, deshabilita la opción de detección
gestionada por el Plugin:

```bash
openclaw config set plugins.entries.amazon-bedrock-mantle.config.discovery.enabled false
```

<Note>
El token de portador es el mismo `AWS_BEARER_TOKEN_BEDROCK` que utiliza el proveedor estándar [Amazon Bedrock](/es/providers/bedrock).
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

Una lista `models` explícita y no vacía tiene prioridad y sustituye todas las
entradas detectadas, incluidas las entradas de Claude que se muestran a continuación.
Omite `models` para conservar el catálogo automático de Mantle o incluye las entradas
completas de los modelos Claude que quieras usar.

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Reasoning support">
    La compatibilidad con el razonamiento se deduce de los ID de modelo que contienen
    patrones como `thinking`, `reasoner`, `reasoning`, `deepseek.r`, `gpt-oss-120b` o
    `gpt-oss-safeguard-120b`. OpenClaw establece automáticamente `reasoning: true`
    para los modelos coincidentes durante la detección.
  </Accordion>

  <Accordion title="Endpoint unavailability">
    Si el endpoint de Mantle no está disponible, no devuelve modelos o falla la
    resolución del token de portador, la detección devuelve un resultado vacío y se
    omite el proveedor implícito. OpenClaw no genera ningún error; los demás
    proveedores configurados siguen funcionando con normalidad.
  </Accordion>

  <Accordion title="Claude via the Anthropic Messages route">
    Cuando la detección automática gestiona la lista de modelos, OpenClaw añade cuatro
    modelos Claude después de una consulta correcta, independientemente de lo que
    devuelva `/v1/models`:
    `amazon-bedrock-mantle/anthropic.claude-sonnet-5` (Claude Sonnet 5),
    `amazon-bedrock-mantle/anthropic.claude-opus-4-7` (Claude Opus 4.7) y
    `amazon-bedrock-mantle/anthropic.claude-mythos-5` (Claude Mythos 5), además de
    `amazon-bedrock-mantle/anthropic.claude-mythos-preview` (Claude Mythos
    Preview). Utilizan la interfaz de API `anthropic-messages` y transmiten mediante
    el mismo endpoint compatible con Anthropic y autenticado con un token de portador
    (`<mantle-base>/anthropic`), por lo que el token de portador de AWS no se trata
    como una clave de API de Anthropic.

    Claude Sonnet 5 siempre utiliza pensamiento adaptativo y el esfuerzo
    predeterminado es `high`. `/think off` y `/think minimal` se asignan a `low`
    porque la ruta de Mantle no permite desactivar el pensamiento. OpenClaw también
    omite la temperatura personalizada en las solicitudes de Sonnet 5.

    Claude Mythos 5 tiene acceso limitado. Publica una ventana de contexto de
    1 000 000 de tokens y un límite de salida de 128 000 tokens, siempre utiliza
    pensamiento adaptativo, asigna `/think off` y `/think minimal` a `low` y omite
    los parámetros de muestreo seleccionados por el invocador.

    Claude Mythos Preview siempre solicita razonamiento y usa de forma predeterminada
    un esfuerzo `high` cuando no se establece ningún nivel de `/think` (`xhigh`/`max`
    se reducen a `high` y `minimal` se eleva a `low`). Opus 4.7 en Mantle transmite
    sin razonamiento proporcionado por el modelo, y OpenClaw omite su parámetro
    `temperature`, ya que Opus 4.7 no acepta sobrescrituras de muestreo en esta ruta;
    Mythos Preview acepta con normalidad una sobrescritura de `temperature`.

    Una lista explícita y no vacía
    `models.providers["amazon-bedrock-mantle"].models` sustituye todo el catálogo
    detectado. Omite esa lista cuando quieras usar estas entradas integradas de
    Claude.

  </Accordion>

  <Accordion title="Relationship to Amazon Bedrock provider">
    Bedrock Mantle es un proveedor independiente del proveedor estándar
    [Amazon Bedrock](/es/providers/bedrock). Mantle utiliza una interfaz `/v1`
    compatible con OpenAI para su catálogo OSS, mientras que el proveedor estándar
    de Bedrock utiliza la API nativa Bedrock Converse.

    Ambos proveedores comparten la misma credencial `AWS_BEARER_TOKEN_BEDROCK`
    cuando está disponible.

  </Accordion>
</AccordionGroup>

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/es/providers/bedrock" icon="cloud">
    Proveedor nativo de Bedrock para Anthropic Claude, Titan y otros modelos.
  </Card>
  <Card title="Model selection" href="/es/concepts/model-providers" icon="layers">
    Selección de proveedores, referencias de modelos y comportamiento de conmutación por error.
  </Card>
  <Card title="OAuth and auth" href="/es/gateway/authentication" icon="key">
    Detalles de autenticación y reglas de reutilización de credenciales.
  </Card>
  <Card title="Troubleshooting" href="/es/help/troubleshooting" icon="wrench">
    Problemas habituales y cómo resolverlos.
  </Card>
</CardGroup>
