---
read_when:
    - Quieres usar modelos OSS alojados en Bedrock Mantle con OpenClaw
    - Necesitas el endpoint de Mantle compatible con OpenAI para GPT-OSS, Qwen, Kimi o GLM
    - Quieres usar Claude Sonnet 5 o Mythos 5 mediante Amazon Bedrock Mantle
summary: Usa los modelos compatibles con OpenAI y Claude Messages de Amazon Bedrock Mantle con OpenClaw
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-07-12T14:46:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 107ffdc76e3971a085f7d64d8d766f6cd8706ce882d8bab80d27c72ab545eec1
    source_path: providers/bedrock-mantle.md
    workflow: 16
---

OpenClaw incluye un proveedor de **Amazon Bedrock Mantle** integrado que se conecta al
endpoint de Mantle compatible con OpenAI. Mantle aloja modelos de código abierto y
de terceros (GPT-OSS, Qwen, Kimi, GLM y similares) mediante una interfaz estándar
`/v1/chat/completions` respaldada por la infraestructura de Bedrock. Mantle también
expone modelos Anthropic Claude mediante una ruta de Anthropic Messages.

| Propiedad      | Valor                                                                                                      |
| -------------- | ---------------------------------------------------------------------------------------------------------- |
| ID del proveedor | `amazon-bedrock-mantle`                                                                                  |
| API            | `openai-completions` para los modelos OSS detectados, `anthropic-messages` para los modelos Claude         |
| Autenticación  | `AWS_BEARER_TOKEN_BEDROCK` explícito o generación de un token de portador mediante la cadena de credenciales de IAM |
| Región predeterminada | `us-east-1` (se puede reemplazar con `AWS_REGION` o `AWS_DEFAULT_REGION`)                            |

## Primeros pasos

Elija el método de autenticación que prefiera y siga los pasos de configuración.

<Tabs>
  <Tab title="Token de portador explícito">
    **Ideal para:** entornos en los que ya se dispone de un token de portador de Mantle.

    <Steps>
      <Step title="Establecer el token de portador en el host del Gateway">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        Opcionalmente, establezca una región (el valor predeterminado es `us-east-1`):

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Verificar que se detecten los modelos">
        ```bash
        openclaw models list
        ```

        Los modelos detectados aparecen bajo el proveedor `amazon-bedrock-mantle`. No
        se requiere configuración adicional, salvo que se desee reemplazar la configuración predeterminada.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Credenciales de IAM">
    **Ideal para:** usar credenciales compatibles con el SDK de AWS (configuración compartida, SSO, identidad web y roles de instancia o tarea).

    <Steps>
      <Step title="Configurar las credenciales de AWS en el host del Gateway">
        Se puede usar cualquier fuente de autenticación compatible con el SDK de AWS:

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Verificar que se detecten los modelos">
        ```bash
        openclaw models list
        ```

        OpenClaw genera automáticamente un token de portador de Mantle a partir de la cadena de credenciales.
      </Step>
    </Steps>

    <Tip>
    Cuando `AWS_BEARER_TOKEN_BEDROCK` no está establecido, OpenClaw genera el token de portador a partir de la cadena de credenciales predeterminada de AWS, incluidas las credenciales y los perfiles de configuración compartidos, SSO, la identidad web y los roles de instancia o tarea.
    </Tip>

  </Tab>
</Tabs>

## Detección automática de modelos

Cuando `AWS_BEARER_TOKEN_BEDROCK` está establecido, OpenClaw lo usa directamente. De lo contrario,
OpenClaw intenta generar un token de portador de Mantle a partir de la cadena de
credenciales predeterminada de AWS. A continuación, detecta los modelos disponibles de Mantle consultando el
endpoint `/v1/models` de la región.

| Comportamiento               | Detalle                                                                                                  |
| ---------------------------- | -------------------------------------------------------------------------------------------------------- |
| Caché de detección           | Los resultados se almacenan en caché durante 1 hora por región; un error de consulta devuelve el último resultado almacenado en caché |
| Actualización del token de IAM | Cada 2 horas, almacenado en caché por región                                                           |

Para mantener habilitado el Plugin de Mantle, pero suprimir la detección automática y la
generación de tokens de portador de IAM, deshabilite la opción de detección propiedad del Plugin:

```bash
openclaw config set plugins.entries.amazon-bedrock-mantle.config.discovery.enabled false
```

<Note>
El token de portador es el mismo `AWS_BEARER_TOKEN_BEDROCK` que utiliza el proveedor estándar de [Amazon Bedrock](/es/providers/bedrock).
</Note>

### Regiones compatibles

`us-east-1`, `us-east-2`, `us-west-2`, `ap-northeast-1`,
`ap-south-1`, `ap-southeast-3`, `eu-central-1`, `eu-west-1`, `eu-west-2`,
`eu-south-1`, `eu-north-1`, `sa-east-1`.

## Configuración manual

Si se prefiere una configuración explícita en lugar de la detección automática:

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

Una lista explícita no vacía de `models` es la fuente autoritativa y reemplaza todas las
filas detectadas, incluidas las filas de Claude que aparecen a continuación. Omita `models` para conservar el
catálogo automático de Mantle o incluya las entradas completas de los modelos Claude que
se desee usar.

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Compatibilidad con el razonamiento">
    La compatibilidad con el razonamiento se infiere de los ID de modelo que contienen patrones como
    `thinking`, `reasoner`, `reasoning`, `deepseek.r`, `gpt-oss-120b` o
    `gpt-oss-safeguard-120b`. OpenClaw establece `reasoning: true` automáticamente para
    los modelos coincidentes durante la detección.
  </Accordion>

  <Accordion title="Endpoint no disponible">
    Si el endpoint de Mantle no está disponible, no devuelve modelos o falla la
    resolución del token de portador, la detección devuelve un resultado vacío y se omite el
    proveedor implícito. OpenClaw no genera ningún error; los demás proveedores configurados
    siguen funcionando con normalidad.
  </Accordion>

  <Accordion title="Claude mediante la ruta de Anthropic Messages">
    Cuando la detección automática controla la lista de modelos, OpenClaw añade cuatro modelos
    Claude después de una consulta correcta, independientemente de lo que devuelva `/v1/models`:
    `amazon-bedrock-mantle/anthropic.claude-sonnet-5` (Claude Sonnet 5),
    `amazon-bedrock-mantle/anthropic.claude-opus-4-7` (Claude Opus 4.7) y
    `amazon-bedrock-mantle/anthropic.claude-mythos-5` (Claude Mythos 5), además de
    `amazon-bedrock-mantle/anthropic.claude-mythos-preview` (vista previa de Claude Mythos).
    Utilizan la interfaz de API `anthropic-messages` y transmiten mediante
    el mismo endpoint compatible con Anthropic autenticado mediante un token de portador
    (`<mantle-base>/anthropic`), por lo que el token de portador de AWS no se trata como una
    clave de API de Anthropic.

    Claude Sonnet 5 siempre utiliza pensamiento adaptativo y el esfuerzo predeterminado es `high`.
    `/think off` y `/think minimal` se asignan a `low` porque la ruta de Mantle
    no puede deshabilitar el pensamiento. OpenClaw también omite la temperatura personalizada en
    las solicitudes de Sonnet 5.

    Claude Mythos 5 tiene acceso limitado. Ofrece una ventana de contexto de
    1,000,000 tokens y un límite de salida de 128,000 tokens, siempre utiliza pensamiento adaptativo, asigna
    `/think off` y `/think minimal` a `low` y omite los parámetros de
    muestreo seleccionados por el invocador.

    Claude Mythos Preview siempre solicita razonamiento, con un esfuerzo predeterminado de `high`
    cuando no se establece ningún nivel de `/think` (`xhigh`/`max` se reducen a
    `high` y `minimal` se eleva a `low`). Opus 4.7 en Mantle transmite sin
    razonamiento proporcionado por el modelo, y OpenClaw omite su parámetro `temperature`,
    ya que Opus 4.7 no acepta modificaciones del muestreo en esta ruta; Mythos
    Preview acepta una modificación de `temperature` con normalidad.

    Una lista explícita no vacía de `models.providers["amazon-bedrock-mantle"].models`
    reemplaza el catálogo detectado completo. Omita esa lista cuando se
    deseen estas filas integradas de Claude.

  </Accordion>

  <Accordion title="Relación con el proveedor Amazon Bedrock">
    Bedrock Mantle es un proveedor independiente del proveedor estándar
    [Amazon Bedrock](/es/providers/bedrock). Mantle utiliza una
    interfaz `/v1` compatible con OpenAI para su catálogo OSS, mientras que el proveedor estándar
    de Bedrock utiliza la API nativa Bedrock Converse.

    Ambos proveedores comparten la misma credencial `AWS_BEARER_TOKEN_BEDROCK` cuando
    está presente.

  </Accordion>
</AccordionGroup>

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/es/providers/bedrock" icon="cloud">
    Proveedor nativo de Bedrock para Anthropic Claude, Titan y otros modelos.
  </Card>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, referencias de modelos y comportamiento de conmutación por error.
  </Card>
  <Card title="OAuth y autenticación" href="/es/gateway/authentication" icon="key">
    Detalles de autenticación y reglas de reutilización de credenciales.
  </Card>
  <Card title="Solución de problemas" href="/es/help/troubleshooting" icon="wrench">
    Problemas comunes y cómo resolverlos.
  </Card>
</CardGroup>
