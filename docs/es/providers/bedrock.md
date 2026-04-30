---
read_when:
    - Quieres usar modelos de Amazon Bedrock con OpenClaw
    - Necesita configurar las credenciales y la región de AWS para las llamadas al modelo
summary: Usar modelos de Amazon Bedrock (Converse API) con OpenClaw
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-04-30T05:56:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: d6c08ab141423a70e5283ddaf72bf6396bcef411dfa36e1c4b5632377f8ea2d8
    source_path: providers/bedrock.md
    workflow: 16
---

OpenClaw puede usar modelos de **Amazon Bedrock** mediante el proveedor de transmisión **Bedrock Converse**
de pi-ai. La autenticación de Bedrock usa la **cadena de credenciales predeterminada del AWS SDK**,
no una clave de API.

| Propiedad | Valor                                                       |
| -------- | ----------------------------------------------------------- |
| Proveedor | `amazon-bedrock`                                            |
| API      | `bedrock-converse-stream`                                   |
| Autenticación     | Credenciales de AWS (variables de entorno, configuración compartida o rol de instancia) |
| Región   | `AWS_REGION` o `AWS_DEFAULT_REGION` (predeterminado: `us-east-1`) |

## Primeros pasos

Elige tu método de autenticación preferido y sigue los pasos de configuración.

<Tabs>
  <Tab title="Claves de acceso / variables de entorno">
    **Recomendado para:** máquinas de desarrollo, CI u hosts donde administras directamente las credenciales de AWS.

    <Steps>
      <Step title="Establece las credenciales de AWS en el host del Gateway">
        ```bash
        export AWS_ACCESS_KEY_ID="AKIA..."
        export AWS_SECRET_ACCESS_KEY="..."
        export AWS_REGION="us-east-1"
        # Optional:
        export AWS_SESSION_TOKEN="..."
        export AWS_PROFILE="your-profile"
        # Optional (Bedrock API key/bearer token):
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```
      </Step>
      <Step title="Agrega un proveedor y un modelo de Bedrock a tu configuración">
        No se requiere `apiKey`. Configura el proveedor con `auth: "aws-sdk"`:

        ```json5
        {
          models: {
            providers: {
              "amazon-bedrock": {
                baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
                api: "bedrock-converse-stream",
                auth: "aws-sdk",
                models: [
                  {
                    id: "us.anthropic.claude-opus-4-6-v1:0",
                    name: "Claude Opus 4.6 (Bedrock)",
                    reasoning: true,
                    input: ["text", "image"],
                    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                    contextWindow: 200000,
                    maxTokens: 8192,
                  },
                ],
              },
            },
          },
          agents: {
            defaults: {
              model: { primary: "amazon-bedrock/us.anthropic.claude-opus-4-6-v1:0" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verifica que los modelos estén disponibles">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Tip>
    Con la autenticación mediante marcadores de entorno (`AWS_ACCESS_KEY_ID`, `AWS_PROFILE` o `AWS_BEARER_TOKEN_BEDROCK`), OpenClaw habilita automáticamente el proveedor implícito de Bedrock para el descubrimiento de modelos sin configuración adicional.
    </Tip>

  </Tab>

  <Tab title="Roles de instancia EC2 (IMDS)">
    **Recomendado para:** instancias EC2 con un rol de IAM adjunto, usando el servicio de metadatos de instancia para la autenticación.

    <Steps>
      <Step title="Habilita el descubrimiento explícitamente">
        Al usar IMDS, OpenClaw no puede detectar la autenticación de AWS solo a partir de marcadores de entorno, por lo que debes habilitarla:

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="Opcionalmente, agrega un marcador de entorno para el modo automático">
        Si también quieres que funcione la ruta de detección automática mediante marcadores de entorno (por ejemplo, para superficies de `openclaw status`):

        ```bash
        export AWS_PROFILE=default
        export AWS_REGION=us-east-1
        ```

        **No** necesitas una clave de API falsa.
      </Step>
      <Step title="Verifica que se descubran los modelos">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Warning>
    El rol de IAM adjunto a tu instancia EC2 debe tener los siguientes permisos:

    - `bedrock:InvokeModel`
    - `bedrock:InvokeModelWithResponseStream`
    - `bedrock:ListFoundationModels` (para el descubrimiento automático)
    - `bedrock:ListInferenceProfiles` (para el descubrimiento de perfiles de inferencia)

    O adjunta la política administrada `AmazonBedrockFullAccess`.
    </Warning>

    <Note>
    Solo necesitas `AWS_PROFILE=default` si quieres específicamente un marcador de entorno para el modo automático o las superficies de estado. La ruta real de autenticación en tiempo de ejecución de Bedrock usa la cadena predeterminada del AWS SDK, por lo que la autenticación con rol de instancia IMDS funciona incluso sin marcadores de entorno.
    </Note>

  </Tab>
</Tabs>

## Descubrimiento automático de modelos

OpenClaw puede descubrir automáticamente modelos de Bedrock que admiten **transmisión**
y **salida de texto**. El descubrimiento usa `bedrock:ListFoundationModels` y
`bedrock:ListInferenceProfiles`, y los resultados se almacenan en caché (predeterminado: 1 hora).

Cómo se habilita el proveedor implícito:

- Si `plugins.entries.amazon-bedrock.config.discovery.enabled` es `true`,
  OpenClaw intentará el descubrimiento incluso cuando no haya ningún marcador de entorno de AWS.
- Si `plugins.entries.amazon-bedrock.config.discovery.enabled` no está definido,
  OpenClaw solo agrega automáticamente el
  proveedor implícito de Bedrock cuando ve uno de estos marcadores de autenticación de AWS:
  `AWS_BEARER_TOKEN_BEDROCK`, `AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY` o `AWS_PROFILE`.
- La ruta real de autenticación en tiempo de ejecución de Bedrock sigue usando la cadena predeterminada del AWS SDK, por lo que
  la configuración compartida, SSO y la autenticación con rol de instancia IMDS pueden funcionar incluso cuando el descubrimiento
  necesitó `enabled: true` para habilitarse.

<Note>
Para entradas explícitas de `models.providers["amazon-bedrock"]`, OpenClaw todavía puede resolver temprano la autenticación de Bedrock mediante marcadores de entorno a partir de marcadores de entorno de AWS como `AWS_BEARER_TOKEN_BEDROCK` sin forzar la carga completa de la autenticación en tiempo de ejecución. La ruta real de autenticación para llamadas a modelos sigue usando la cadena predeterminada del AWS SDK.
</Note>

<AccordionGroup>
  <Accordion title="Opciones de configuración de descubrimiento">
    Las opciones de configuración se encuentran bajo `plugins.entries.amazon-bedrock.config.discovery`:

    ```json5
    {
      plugins: {
        entries: {
          "amazon-bedrock": {
            config: {
              discovery: {
                enabled: true,
                region: "us-east-1",
                providerFilter: ["anthropic", "amazon"],
                refreshInterval: 3600,
                defaultContextWindow: 32000,
                defaultMaxTokens: 4096,
              },
            },
          },
        },
      },
    }
    ```

    | Opción | Predeterminado | Descripción |
    | ------ | ------- | ----------- |
    | `enabled` | auto | En modo automático, OpenClaw solo habilita el proveedor implícito de Bedrock cuando ve un marcador de entorno de AWS compatible. Establécelo en `true` para forzar el descubrimiento. |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | Región de AWS usada para llamadas a la API de descubrimiento. |
    | `providerFilter` | (todos) | Coincide con nombres de proveedores de Bedrock (por ejemplo, `anthropic`, `amazon`). |
    | `refreshInterval` | `3600` | Duración de la caché en segundos. Establécelo en `0` para deshabilitar el almacenamiento en caché. |
    | `defaultContextWindow` | `32000` | Ventana de contexto usada para los modelos descubiertos (sobrescríbela si conoces los límites de tu modelo). |
    | `defaultMaxTokens` | `4096` | Tokens máximos de salida usados para los modelos descubiertos (sobrescríbelos si conoces los límites de tu modelo). |

  </Accordion>
</AccordionGroup>

## Configuración rápida (ruta de AWS)

Este recorrido crea un rol de IAM, adjunta permisos de Bedrock, asocia
el perfil de instancia y habilita el descubrimiento de OpenClaw en el host EC2.

```bash
# 1. Create IAM role and instance profile
aws iam create-role --role-name EC2-Bedrock-Access \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "ec2.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

aws iam attach-role-policy --role-name EC2-Bedrock-Access \
  --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess

aws iam create-instance-profile --instance-profile-name EC2-Bedrock-Access
aws iam add-role-to-instance-profile \
  --instance-profile-name EC2-Bedrock-Access \
  --role-name EC2-Bedrock-Access

# 2. Attach to your EC2 instance
aws ec2 associate-iam-instance-profile \
  --instance-id i-xxxxx \
  --iam-instance-profile Name=EC2-Bedrock-Access

# 3. On the EC2 instance, enable discovery explicitly
openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1

# 4. Optional: add an env marker if you want auto mode without explicit enable
echo 'export AWS_PROFILE=default' >> ~/.bashrc
echo 'export AWS_REGION=us-east-1' >> ~/.bashrc
source ~/.bashrc

# 5. Verify models are discovered
openclaw models list
```

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Perfiles de inferencia">
    OpenClaw descubre **perfiles de inferencia regionales y globales** junto con
    modelos fundacionales. Cuando un perfil se asigna a un modelo fundacional conocido, el
    perfil hereda las capacidades de ese modelo (ventana de contexto, tokens máximos,
    razonamiento, visión) y la región correcta de solicitud de Bedrock se inyecta
    automáticamente. Esto significa que los perfiles de Claude entre regiones funcionan sin sobrescrituras manuales
    del proveedor.

    Los ID de perfiles de inferencia se parecen a `us.anthropic.claude-opus-4-6-v1:0` (regional)
    o `anthropic.claude-opus-4-6-v1:0` (global). Si el modelo subyacente ya está
    en los resultados de descubrimiento, el perfil hereda su conjunto completo de capacidades;
    de lo contrario, se aplican valores predeterminados seguros.

    No se necesita configuración adicional. Mientras el descubrimiento esté habilitado y el principal de IAM
    tenga `bedrock:ListInferenceProfiles`, los perfiles aparecen junto con los
    modelos fundacionales en `openclaw models list`.

  </Accordion>

  <Accordion title="Temperatura de Claude Opus 4.7">
    Bedrock rechaza el parámetro `temperature` para Claude Opus 4.7. OpenClaw
    omite `temperature` automáticamente para cualquier referencia de Bedrock a Opus 4.7, incluidos
    ID de modelos fundacionales, perfiles de inferencia con nombre, perfiles de inferencia
    de aplicación cuyo modelo subyacente se resuelve como Opus 4.7 mediante
    `bedrock:GetInferenceProfile`, y variantes con punto `opus-4.7` con
    prefijos de región opcionales (`us.`, `eu.`, `ap.`, `apac.`, `au.`, `jp.`,
    `global.`). No se requiere ningún ajuste de configuración, y la omisión se aplica tanto al
    objeto de opciones de solicitud como al campo de carga útil `inferenceConfig`.
  </Accordion>

  <Accordion title="Guardrails">
    Puedes aplicar [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
    a todas las invocaciones de modelos de Bedrock agregando un objeto `guardrail` a la
    configuración del Plugin `amazon-bedrock`. Guardrails te permite aplicar filtrado de contenido,
    denegación de temas, filtros de palabras, filtros de información sensible y comprobaciones
    de fundamentación contextual.

    ```json5
    {
      plugins: {
        entries: {
          "amazon-bedrock": {
            config: {
              guardrail: {
                guardrailIdentifier: "abc123", // guardrail ID or full ARN
                guardrailVersion: "1", // version number or "DRAFT"
                streamProcessingMode: "sync", // optional: "sync" or "async"
                trace: "enabled", // optional: "enabled", "disabled", or "enabled_full"
              },
            },
          },
        },
      },
    }
    ```

    | Opción | Obligatorio | Descripción |
    | ------ | -------- | ----------- |
    | `guardrailIdentifier` | Sí | ID de Guardrail (p. ej., `abc123`) o ARN completo (p. ej., `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`). |
    | `guardrailVersion` | Sí | Número de versión publicado, o `"DRAFT"` para el borrador de trabajo. |
    | `streamProcessingMode` | No | `"sync"` o `"async"` para la evaluación de Guardrail durante la transmisión. Si se omite, Bedrock usa su valor predeterminado. |
    | `trace` | No | `"enabled"` o `"enabled_full"` para depuración; omítelo o establece `"disabled"` para producción. |

    <Warning>
    El principal de IAM usado por el Gateway debe tener el permiso `bedrock:ApplyGuardrail` además de los permisos de invocación estándar.
    </Warning>

  </Accordion>

  <Accordion title="Incrustaciones para búsqueda en memoria">
    Bedrock también puede servir como proveedor de incrustaciones para la
    [búsqueda en memoria](/es/concepts/memory-search). Esto se configura por separado del
    proveedor de inferencia: establece `agents.defaults.memorySearch.provider` en `"bedrock"`:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "bedrock",
            model: "amazon.titan-embed-text-v2:0", // default
          },
        },
      },
    }
    ```

    Las incrustaciones de Bedrock usan la misma cadena de credenciales del AWS SDK que la inferencia
    (roles de instancia, SSO, claves de acceso, configuración compartida e identidad web). No se
    necesita ninguna clave de API. Cuando `provider` es `"auto"`, Bedrock se detecta automáticamente si esa
    cadena de credenciales se resuelve correctamente.

    Los modelos de incrustación compatibles incluyen Amazon Titan Embed (v1, v2), Amazon Nova
    Embed, Cohere Embed (v3, v4) y TwelveLabs Marengo. Consulta la
    [referencia de configuración de memoria: Bedrock](/es/reference/memory-config#bedrock-embedding-config)
    para ver la lista completa de modelos y las opciones de dimensiones.

  </Accordion>

  <Accordion title="Notas y advertencias">
    - Bedrock requiere **acceso al modelo** habilitado en tu cuenta/región de AWS.
    - La detección automática necesita los permisos `bedrock:ListFoundationModels` y
      `bedrock:ListInferenceProfiles`.
    - Si dependes del modo automático, establece uno de los marcadores de entorno de autenticación de AWS compatibles en el
      host del gateway. Si prefieres autenticación IMDS/configuración compartida sin marcadores de entorno, establece
      `plugins.entries.amazon-bedrock.config.discovery.enabled: true`.
    - OpenClaw muestra la fuente de credenciales en este orden: `AWS_BEARER_TOKEN_BEDROCK`,
      luego `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`, luego `AWS_PROFILE` y luego la
      cadena predeterminada del AWS SDK.
    - La compatibilidad con razonamiento depende del modelo; consulta la tarjeta del modelo de Bedrock para ver las
      capacidades actuales.
    - Si prefieres un flujo de claves administradas, también puedes colocar un proxy compatible con OpenAI
      delante de Bedrock y configurarlo como proveedor de OpenAI en su lugar.
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, referencias de modelos y comportamiento de conmutación por error.
  </Card>
  <Card title="Búsqueda en memoria" href="/es/concepts/memory-search" icon="magnifying-glass">
    Incrustaciones de Bedrock para la configuración de búsqueda en memoria.
  </Card>
  <Card title="Referencia de configuración de memoria" href="/es/reference/memory-config#bedrock-embedding-config" icon="database">
    Lista completa de modelos de incrustación de Bedrock y opciones de dimensiones.
  </Card>
  <Card title="Solución de problemas" href="/es/help/troubleshooting" icon="wrench">
    Solución general de problemas y preguntas frecuentes.
  </Card>
</CardGroup>
