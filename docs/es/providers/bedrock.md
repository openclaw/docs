---
read_when:
    - Quieres usar modelos de Amazon Bedrock con OpenClaw
    - Necesitas configurar credenciales/región de AWS para llamadas a modelos
summary: Usa modelos de Amazon Bedrock (Converse API) con OpenClaw
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-04-12T23:30:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 88e7e24907ec26af098b648e2eeca32add090a9e381c818693169ab80aeccc47
    source_path: providers/bedrock.md
    workflow: 15
---

# Amazon Bedrock

OpenClaw puede usar modelos de **Amazon Bedrock** a través del proveedor de streaming **Bedrock Converse** de pi-ai. La autenticación de Bedrock usa la **cadena de credenciales predeterminada del AWS SDK**, no una clave de API.

| Property | Value                                                       |
| -------- | ----------------------------------------------------------- |
| Provider | `amazon-bedrock`                                            |
| API      | `bedrock-converse-stream`                                   |
| Auth     | Credenciales de AWS (variables de entorno, configuración compartida o rol de instancia) |
| Region   | `AWS_REGION` o `AWS_DEFAULT_REGION` (predeterminado: `us-east-1`) |

## Primeros pasos

Elige tu método de autenticación preferido y sigue los pasos de configuración.

<Tabs>
  <Tab title="Access keys / env vars">
    **Ideal para:** máquinas de desarrollo, CI o hosts donde administras directamente las credenciales de AWS.

    <Steps>
      <Step title="Set AWS credentials on the gateway host">
        ```bash
        export AWS_ACCESS_KEY_ID="AKIA..."
        export AWS_SECRET_ACCESS_KEY="..."
        export AWS_REGION="us-east-1"
        # Opcional:
        export AWS_SESSION_TOKEN="..."
        export AWS_PROFILE="your-profile"
        # Opcional (clave de API/token bearer de Bedrock):
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```
      </Step>
      <Step title="Add a Bedrock provider and model to your config">
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
      <Step title="Verify models are available">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Tip>
    Con autenticación mediante marcadores de entorno (`AWS_ACCESS_KEY_ID`, `AWS_PROFILE` o `AWS_BEARER_TOKEN_BEDROCK`), OpenClaw activa automáticamente el proveedor implícito de Bedrock para el descubrimiento de modelos sin configuración adicional.
    </Tip>

  </Tab>

  <Tab title="EC2 instance roles (IMDS)">
    **Ideal para:** instancias de EC2 con un rol de IAM adjunto, usando el servicio de metadatos de la instancia para autenticación.

    <Steps>
      <Step title="Enable discovery explicitly">
        Al usar IMDS, OpenClaw no puede detectar la autenticación de AWS solo a partir de marcadores de entorno, así que debes habilitarla explícitamente:

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="Optionally add an env marker for auto mode">
        Si además quieres que funcione la ruta de detección automática basada en marcadores de entorno (por ejemplo, para superficies de `openclaw status`):

        ```bash
        export AWS_PROFILE=default
        export AWS_REGION=us-east-1
        ```

        **No** necesitas una clave de API falsa.
      </Step>
      <Step title="Verify models are discovered">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Warning>
    El rol de IAM adjunto a tu instancia de EC2 debe tener los siguientes permisos:

    - `bedrock:InvokeModel`
    - `bedrock:InvokeModelWithResponseStream`
    - `bedrock:ListFoundationModels` (para descubrimiento automático)
    - `bedrock:ListInferenceProfiles` (para descubrimiento de perfiles de inferencia)

    O adjunta la política administrada `AmazonBedrockFullAccess`.
    </Warning>

    <Note>
    Solo necesitas `AWS_PROFILE=default` si específicamente quieres un marcador de entorno para el modo automático o para superficies de estado. La ruta real de autenticación del runtime de Bedrock usa la cadena predeterminada del AWS SDK, por lo que la autenticación de rol de instancia IMDS funciona incluso sin marcadores de entorno.
    </Note>

  </Tab>
</Tabs>

## Descubrimiento automático de modelos

OpenClaw puede descubrir automáticamente modelos de Bedrock que admiten **streaming**
y **salida de texto**. El descubrimiento usa `bedrock:ListFoundationModels` y
`bedrock:ListInferenceProfiles`, y los resultados se almacenan en caché (predeterminado: 1 hora).

Cómo se habilita el proveedor implícito:

- Si `plugins.entries.amazon-bedrock.config.discovery.enabled` es `true`,
  OpenClaw intentará el descubrimiento incluso cuando no haya ningún marcador de entorno de AWS presente.
- Si `plugins.entries.amazon-bedrock.config.discovery.enabled` no está establecido,
  OpenClaw solo agrega automáticamente el
  proveedor implícito de Bedrock cuando ve uno de estos marcadores de autenticación de AWS:
  `AWS_BEARER_TOKEN_BEDROCK`, `AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY`, o `AWS_PROFILE`.
- La ruta real de autenticación del runtime de Bedrock sigue usando la cadena predeterminada del AWS SDK, por lo que
  la configuración compartida, SSO y la autenticación de rol de instancia IMDS pueden funcionar incluso cuando el descubrimiento
  necesitó `enabled: true` para activarse.

<Note>
Para entradas explícitas `models.providers["amazon-bedrock"]`, OpenClaw aún puede resolver anticipadamente la autenticación de Bedrock basada en marcadores de entorno a partir de variables de entorno de AWS como `AWS_BEARER_TOKEN_BEDROCK` sin forzar la carga completa de autenticación del runtime. La ruta real de autenticación de llamadas al modelo sigue usando la cadena predeterminada del AWS SDK.
</Note>

<AccordionGroup>
  <Accordion title="Discovery config options">
    Las opciones de configuración se encuentran en `plugins.entries.amazon-bedrock.config.discovery`:

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

    | Option | Default | Description |
    | ------ | ------- | ----------- |
    | `enabled` | auto | En modo automático, OpenClaw solo habilita el proveedor implícito de Bedrock cuando ve un marcador de entorno de AWS compatible. Establece `true` para forzar el descubrimiento. |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | Región de AWS usada para las llamadas a la API de descubrimiento. |
    | `providerFilter` | (all) | Coincide con nombres de proveedores de Bedrock (por ejemplo `anthropic`, `amazon`). |
    | `refreshInterval` | `3600` | Duración de la caché en segundos. Establece `0` para desactivar la caché. |
    | `defaultContextWindow` | `32000` | Ventana de contexto usada para modelos descubiertos (anúlala si conoces los límites de tu modelo). |
    | `defaultMaxTokens` | `4096` | Máximo de tokens de salida usado para modelos descubiertos (anúlalo si conoces los límites de tu modelo). |

  </Accordion>
</AccordionGroup>

## Configuración rápida (ruta de AWS)

Este recorrido crea un rol de IAM, adjunta permisos de Bedrock, asocia
el perfil de instancia y habilita el descubrimiento de OpenClaw en el host EC2.

```bash
# 1. Crea el rol de IAM y el perfil de instancia
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

# 2. Adjunta el perfil a tu instancia de EC2
aws ec2 associate-iam-instance-profile \
  --instance-id i-xxxxx \
  --iam-instance-profile Name=EC2-Bedrock-Access

# 3. En la instancia EC2, habilita explícitamente el descubrimiento
openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1

# 4. Opcional: agrega un marcador de entorno si quieres modo automático sin habilitación explícita
echo 'export AWS_PROFILE=default' >> ~/.bashrc
echo 'export AWS_REGION=us-east-1' >> ~/.bashrc
source ~/.bashrc

# 5. Verifica que los modelos se descubren
openclaw models list
```

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Inference profiles">
    OpenClaw descubre **perfiles de inferencia regionales y globales** junto con
    los modelos base. Cuando un perfil se asigna a un modelo base conocido, el
    perfil hereda las capacidades de ese modelo (ventana de contexto, máximo de tokens,
    razonamiento, visión) y se inyecta automáticamente la región correcta de solicitud de Bedrock.
    Esto significa que los perfiles de Claude entre regiones funcionan sin anulaciones manuales
    del proveedor.

    Los ids de perfil de inferencia tienen un formato como `us.anthropic.claude-opus-4-6-v1:0` (regional)
    o `anthropic.claude-opus-4-6-v1:0` (global). Si el modelo subyacente ya está
    en los resultados del descubrimiento, el perfil hereda su conjunto completo de capacidades;
    de lo contrario, se aplican valores predeterminados seguros.

    No se necesita configuración adicional. Siempre que el descubrimiento esté habilitado y el principal de IAM
    tenga `bedrock:ListInferenceProfiles`, los perfiles aparecerán junto a
    los modelos base en `openclaw models list`.

  </Accordion>

  <Accordion title="Guardrails">
    Puedes aplicar [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
    a todas las invocaciones de modelos de Bedrock agregando un objeto `guardrail` a la
    configuración del plugin `amazon-bedrock`. Guardrails te permite aplicar filtrado de contenido,
    denegación de temas, filtros de palabras, filtros de información sensible y comprobaciones
    de grounding contextual.

    ```json5
    {
      plugins: {
        entries: {
          "amazon-bedrock": {
            config: {
              guardrail: {
                guardrailIdentifier: "abc123", // ID de guardrail o ARN completo
                guardrailVersion: "1", // número de versión o "DRAFT"
                streamProcessingMode: "sync", // opcional: "sync" o "async"
                trace: "enabled", // opcional: "enabled", "disabled" o "enabled_full"
              },
            },
          },
        },
      },
    }
    ```

    | Option | Required | Description |
    | ------ | -------- | ----------- |
    | `guardrailIdentifier` | Yes | ID del guardrail (por ejemplo `abc123`) o ARN completo (por ejemplo `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`). |
    | `guardrailVersion` | Yes | Número de versión publicada, o `"DRAFT"` para el borrador de trabajo. |
    | `streamProcessingMode` | No | `"sync"` o `"async"` para la evaluación de guardrails durante el streaming. Si se omite, Bedrock usa su valor predeterminado. |
    | `trace` | No | `"enabled"` o `"enabled_full"` para depuración; omítelo o establece `"disabled"` para producción. |

    <Warning>
    El principal de IAM usado por el Gateway debe tener el permiso `bedrock:ApplyGuardrail` además de los permisos estándar de invocación.
    </Warning>

  </Accordion>

  <Accordion title="Embeddings for memory search">
    Bedrock también puede servir como proveedor de embeddings para
    [búsqueda de memoria](/es/concepts/memory-search). Esto se configura por separado del
    proveedor de inferencia: establece `agents.defaults.memorySearch.provider` en `"bedrock"`:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "bedrock",
            model: "amazon.titan-embed-text-v2:0", // predeterminado
          },
        },
      },
    }
    ```

    Los embeddings de Bedrock usan la misma cadena de credenciales del AWS SDK que la inferencia (roles de instancia, SSO, claves de acceso, configuración compartida y web identity). No se necesita clave de API. Cuando `provider` es `"auto"`, Bedrock se detecta automáticamente si esa cadena de credenciales se resuelve correctamente.

    Los modelos de embeddings compatibles incluyen Amazon Titan Embed (v1, v2), Amazon Nova
    Embed, Cohere Embed (v3, v4) y TwelveLabs Marengo. Consulta
    la [referencia de configuración de memoria -- Bedrock](/es/reference/memory-config#bedrock-embedding-config)
    para ver la lista completa de modelos y las opciones de dimensiones.

  </Accordion>

  <Accordion title="Notas y consideraciones">
    - Bedrock requiere que el **acceso al modelo** esté habilitado en tu cuenta/región de AWS.
    - El descubrimiento automático necesita los permisos `bedrock:ListFoundationModels` y
      `bedrock:ListInferenceProfiles`.
    - Si dependes del modo automático, establece uno de los marcadores de entorno de autenticación de AWS compatibles en el
      host del Gateway. Si prefieres autenticación IMDS/shared-config sin marcadores de entorno, establece
      `plugins.entries.amazon-bedrock.config.discovery.enabled: true`.
    - OpenClaw muestra el origen de credenciales en este orden: `AWS_BEARER_TOKEN_BEDROCK`,
      luego `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`, luego `AWS_PROFILE`, y después la
      cadena predeterminada del AWS SDK.
    - La compatibilidad con razonamiento depende del modelo; consulta la ficha del modelo de Bedrock para
      ver las capacidades actuales.
    - Si prefieres un flujo de claves administrado, también puedes colocar un
      proxy compatible con OpenAI delante de Bedrock y configurarlo en su lugar como proveedor OpenAI.
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelos y comportamiento de failover.
  </Card>
  <Card title="Búsqueda de memoria" href="/es/concepts/memory-search" icon="magnifying-glass">
    Configuración de embeddings de Bedrock para búsqueda de memoria.
  </Card>
  <Card title="Referencia de configuración de memoria" href="/es/reference/memory-config#bedrock-embedding-config" icon="database">
    Lista completa de modelos de embeddings de Bedrock y opciones de dimensiones.
  </Card>
  <Card title="Solución de problemas" href="/es/help/troubleshooting" icon="wrench">
    Solución general de problemas y preguntas frecuentes.
  </Card>
</CardGroup>
