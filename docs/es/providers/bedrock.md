---
read_when:
    - Quieres usar modelos de Amazon Bedrock con OpenClaw
    - Necesitas configurar las credenciales y la región de AWS para las llamadas al modelo
summary: Usa modelos de Amazon Bedrock (Converse API) con OpenClaw
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-06-27T12:34:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3947ad565f3a0adcd62d4ce47c6ed760f73c77ba3f4bd43b0754a412511063f2
    source_path: providers/bedrock.md
    workflow: 16
---

OpenClaw puede usar modelos de **Amazon Bedrock** mediante su proveedor de streaming **Bedrock Converse**. La autenticación de Bedrock usa la **cadena de credenciales predeterminada del AWS SDK**, no una clave de API.

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
    **Recomendado para:** máquinas de desarrollo, CI o hosts donde gestionas directamente las credenciales de AWS.

    <Steps>
      <Step title="Configurar credenciales de AWS en el host del Gateway">
        ```bash
        export AWS_ACCESS_KEY_ID="EXAMPLE_AWS_ACCESS_KEY_ID"
        export AWS_SECRET_ACCESS_KEY="..."
        export AWS_REGION="us-east-1"
        # Optional:
        export AWS_SESSION_TOKEN="..."
        export AWS_PROFILE="your-profile"
        # Optional (Bedrock API key/bearer token):
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```
      </Step>
      <Step title="Agregar un proveedor y un modelo de Bedrock a tu configuración">
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
      <Step title="Verificar que los modelos estén disponibles">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Tip>
    Con autenticación por marcador de entorno (`AWS_ACCESS_KEY_ID`, `AWS_PROFILE` o `AWS_BEARER_TOKEN_BEDROCK`), OpenClaw habilita automáticamente el proveedor implícito de Bedrock para la detección de modelos sin configuración adicional.
    </Tip>

  </Tab>

  <Tab title="Roles de instancia EC2 (IMDS)">
    **Recomendado para:** instancias EC2 con un rol de IAM asociado, usando el servicio de metadatos de instancia para la autenticación.

    <Steps>
      <Step title="Habilitar la detección explícitamente">
        Al usar IMDS, OpenClaw no puede detectar la autenticación de AWS solo a partir de marcadores de entorno, así que debes habilitarla explícitamente:

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="Agregar opcionalmente un marcador de entorno para el modo automático">
        Si también quieres que funcione la ruta de detección automática por marcador de entorno (por ejemplo, para superficies de `openclaw status`):

        ```bash
        export AWS_PROFILE=default
        export AWS_REGION=us-east-1
        ```

        **No** necesitas una clave de API falsa.
      </Step>
      <Step title="Verificar que se detecten los modelos">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Warning>
    El rol de IAM asociado a tu instancia EC2 debe tener los siguientes permisos:

    - `bedrock:InvokeModel`
    - `bedrock:InvokeModelWithResponseStream`
    - `bedrock:ListFoundationModels` (para detección automática)
    - `bedrock:ListInferenceProfiles` (para detección de perfiles de inferencia)

    O adjunta la política administrada `AmazonBedrockFullAccess`.
    </Warning>

    <Note>
    Solo necesitas `AWS_PROFILE=default` si específicamente quieres un marcador de entorno para el modo automático o las superficies de estado. La ruta real de autenticación del runtime de Bedrock usa la cadena predeterminada del AWS SDK, así que la autenticación por rol de instancia de IMDS funciona incluso sin marcadores de entorno.
    </Note>

  </Tab>
</Tabs>

## Detección automática de modelos

OpenClaw puede detectar automáticamente modelos de Bedrock que admiten **streaming**
y **salida de texto**. La detección usa `bedrock:ListFoundationModels` y
`bedrock:ListInferenceProfiles`, y los resultados se almacenan en caché (predeterminado: 1 hora).

Cómo se habilita el proveedor implícito:

- Si `plugins.entries.amazon-bedrock.config.discovery.enabled` es `true`,
  OpenClaw intentará la detección aunque no haya ningún marcador de entorno de AWS.
- Si `plugins.entries.amazon-bedrock.config.discovery.enabled` no está definido,
  OpenClaw solo agrega automáticamente el
  proveedor implícito de Bedrock cuando ve uno de estos marcadores de autenticación de AWS:
  `AWS_BEARER_TOKEN_BEDROCK`, `AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY` o `AWS_PROFILE`.
- La ruta real de autenticación del runtime de Bedrock sigue usando la cadena predeterminada del AWS SDK, así que
  la configuración compartida, SSO y la autenticación por rol de instancia de IMDS pueden funcionar incluso cuando la detección
  necesitó `enabled: true` para habilitarse explícitamente.

<Note>
Para entradas explícitas de `models.providers["amazon-bedrock"]`, OpenClaw aún puede resolver temprano la autenticación por marcador de entorno de Bedrock desde marcadores de entorno de AWS como `AWS_BEARER_TOKEN_BEDROCK`, sin forzar la carga completa de la autenticación del runtime. La ruta real de autenticación de llamadas al modelo sigue usando la cadena predeterminada del AWS SDK.
</Note>

<AccordionGroup>
  <Accordion title="Opciones de configuración de detección">
    Las opciones de configuración están bajo `plugins.entries.amazon-bedrock.config.discovery`:

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
    | `enabled` | auto | En modo automático, OpenClaw solo habilita el proveedor implícito de Bedrock cuando ve un marcador de entorno de AWS compatible. Usa `true` para forzar la detección. |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | Región de AWS usada para llamadas a la API de detección. |
    | `providerFilter` | (todos) | Coincide con nombres de proveedores de Bedrock (por ejemplo, `anthropic`, `amazon`). |
    | `refreshInterval` | `3600` | Duración de la caché en segundos. Establécelo en `0` para deshabilitar el almacenamiento en caché. |
    | `defaultContextWindow` | `32000` | Ventana de contexto usada para modelos detectados (sobrescríbela si conoces los límites de tu modelo). |
    | `defaultMaxTokens` | `4096` | Tokens máximos de salida usados para modelos detectados (sobrescríbelo si conoces los límites de tu modelo). |

  </Accordion>
</AccordionGroup>

## Configuración rápida (ruta de AWS)

Este recorrido crea un rol de IAM, adjunta permisos de Bedrock, asocia
el perfil de instancia y habilita la detección de OpenClaw en el host EC2.

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
    OpenClaw detecta **perfiles de inferencia regionales y globales** junto con
    modelos fundacionales. Cuando un perfil se asigna a un modelo fundacional conocido, el
    perfil hereda las capacidades de ese modelo (ventana de contexto, tokens máximos,
    razonamiento, visión) y la región correcta de solicitud de Bedrock se inyecta
    automáticamente. Esto significa que los perfiles de Claude entre regiones funcionan sin
    sobrescrituras manuales del proveedor.

    Los ID de perfil de inferencia se ven como `us.anthropic.claude-opus-4-6-v1:0` (regional)
    o `anthropic.claude-opus-4-6-v1:0` (global). Si el modelo subyacente ya está
    en los resultados de detección, el perfil hereda todo su conjunto de capacidades;
    de lo contrario, se aplican valores predeterminados seguros.

    No se necesita configuración adicional. Siempre que la detección esté habilitada y el principal de IAM
    tenga `bedrock:ListInferenceProfiles`, los perfiles aparecen junto con
    los modelos fundacionales en `openclaw models list`.

  </Accordion>

  <Accordion title="Nivel de servicio">
    Algunos modelos de Bedrock admiten un parámetro `service_tier` para optimizar el costo
    o la latencia. Los siguientes niveles están disponibles:

    | Nivel | Descripción |
    |------|-------------|
    | `default` | Nivel estándar de Bedrock |
    | `flex` | Procesamiento con descuento para cargas de trabajo que pueden tolerar mayor latencia |
    | `priority` | Procesamiento priorizado para cargas de trabajo sensibles a la latencia |
    | `reserved` | Capacidad reservada para cargas de trabajo de estado estable |

    Define `serviceTier` (o `service_tier`) mediante `agents.defaults.params` para
    solicitudes de modelos de Bedrock, o por modelo en
    `agents.defaults.models["<model-key>"].params`:

    ```json5
    {
      agents: {
        defaults: {
          params: {
            serviceTier: "flex", // applies to all models
          },
          models: {
            "amazon-bedrock/mistral.mistral-large-3-675b-instruct": {
              params: {
                serviceTier: "priority", // per-model override
              },
            },
          },
        },
      },
    }
    ```

    Los valores válidos son `default`, `flex`, `priority` y `reserved`. No todos
    los modelos admiten todos los niveles; si se solicita un nivel no compatible, Bedrock
    devolverá un error de validación. Nota: el mensaje de error es algo engañoso;
    puede decir "The provided model identifier is invalid" en lugar de indicar
    un nivel de servicio no compatible. Si ves este error, comprueba si el modelo
    admite el nivel solicitado.

  </Accordion>

  <Accordion title="Temperatura de Claude Opus 4.7">
    Bedrock rechaza el parámetro `temperature` para Claude Opus 4.7. OpenClaw
    omite `temperature` automáticamente para cualquier referencia de Opus 4.7 de Bedrock, incluidos
    los ID de modelos fundacionales, perfiles de inferencia con nombre, perfiles de inferencia
    de aplicación cuyo modelo subyacente se resuelve como Opus 4.7 mediante
    `bedrock:GetInferenceProfile`, y variantes punteadas de `opus-4.7` con
    prefijos de región opcionales (`us.`, `eu.`, `ap.`, `apac.`, `au.`, `jp.`,
    `global.`). No se requiere ningún ajuste de configuración, y la omisión se aplica tanto al
    objeto de opciones de solicitud como al campo de carga útil `inferenceConfig`.
  </Accordion>

  <Accordion title="Claude Fable 5">
    Usa `amazon-bedrock/anthropic.claude-fable-5` en `us-east-1`, o los
    identificadores de inferencia regionales como `us.anthropic.claude-fable-5`.
    OpenClaw aplica la ventana de contexto de 1M de Fable, el límite de salida de
    128K, el razonamiento adaptativo siempre activo y el mapeo de esfuerzo
    compatible. `/think off` y `/think minimal` se asignan a `low`; se omiten los
    controles no compatibles de temperatura y elección forzada de herramienta. La
    salida en streaming se retiene hasta que Bedrock devuelve un estado terminal
    para que los rechazos durante el streaming no expongan texto parcial. Fable
    solo admite el nivel de servicio estándar; OpenClaw ignora los niveles
    `flex`, `priority` y `reserved` configurados para este modelo.

    AWS requiere una aceptación explícita de retención de datos
    `provider_data_share` antes de que Fable esté disponible. Los prompts y las
    finalizaciones se comparten con Anthropic y se retienen hasta 30 días para
    confianza y seguridad. Revisa y configura la
    [retención de datos de Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/data-retention.html)
    antes de habilitar el modelo.

  </Accordion>

  <Accordion title="Guardrails">
    Puedes aplicar [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
    a todas las invocaciones de modelos de Bedrock agregando un objeto `guardrail`
    a la configuración del Plugin `amazon-bedrock`. Las barreras de protección te
    permiten aplicar filtrado de contenido, denegación de temas, filtros de
    palabras, filtros de información sensible y comprobaciones de fundamentación
    contextual.

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

    | Opción | Requerido | Descripción |
    | ------ | -------- | ----------- |
    | `guardrailIdentifier` | Sí | ID de barrera de protección (por ejemplo, `abc123`) o ARN completo (por ejemplo, `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`). |
    | `guardrailVersion` | Sí | Número de versión publicada, o `"DRAFT"` para el borrador de trabajo. |
    | `streamProcessingMode` | No | `"sync"` o `"async"` para la evaluación de barreras de protección durante el streaming. Si se omite, Bedrock usa su valor predeterminado. |
    | `trace` | No | `"enabled"` o `"enabled_full"` para depuración; omítelo o configúralo como `"disabled"` para producción. |

    <Warning>
    El principal IAM usado por el Gateway debe tener el permiso `bedrock:ApplyGuardrail` además de los permisos de invocación estándar.
    </Warning>

  </Accordion>

  <Accordion title="Embeddings for memory search">
    Bedrock también puede servir como proveedor de embeddings para la
    [búsqueda en memoria](/es/concepts/memory-search). Esto se configura por separado
    del proveedor de inferencia: establece `agents.defaults.memorySearch.provider`
    en `"bedrock"`:

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

    Los embeddings de Bedrock usan la misma cadena de credenciales del SDK de AWS
    que la inferencia (roles de instancia, SSO, claves de acceso, configuración
    compartida e identidad web). No se necesita ninguna clave de API. Establece
    `memorySearch.provider: "bedrock"` explícitamente para usar embeddings de
    Bedrock.

    Los modelos de embedding compatibles incluyen Amazon Titan Embed (v1, v2),
    Amazon Nova Embed, Cohere Embed (v3, v4) y TwelveLabs Marengo. Consulta la
    [referencia de configuración de memoria: Bedrock](/es/reference/memory-config#bedrock-embedding-config)
    para ver la lista completa de modelos y las opciones de dimensión.

  </Accordion>

  <Accordion title="Notes and caveats">
    - Bedrock requiere que el **acceso al modelo** esté habilitado en tu cuenta/región de AWS.
    - La detección automática necesita los permisos `bedrock:ListFoundationModels` y
      `bedrock:ListInferenceProfiles`.
    - Si dependes del modo automático, establece uno de los marcadores de entorno de autenticación de AWS compatibles en el
      host del Gateway. Si prefieres autenticación IMDS/configuración compartida sin marcadores de entorno, establece
      `plugins.entries.amazon-bedrock.config.discovery.enabled: true`.
    - OpenClaw muestra la fuente de credenciales en este orden: `AWS_BEARER_TOKEN_BEDROCK`,
      luego `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`, luego `AWS_PROFILE`, luego la
      cadena predeterminada del SDK de AWS.
    - La compatibilidad con razonamiento depende del modelo; consulta la ficha del modelo de Bedrock para conocer las
      capacidades actuales.
    - Si prefieres un flujo de claves administrado, también puedes colocar un proxy compatible con OpenAI
      delante de Bedrock y configurarlo como proveedor de OpenAI en su lugar.
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Model selection" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelo y comportamiento de conmutación por error.
  </Card>
  <Card title="Memory search" href="/es/concepts/memory-search" icon="magnifying-glass">
    Embeddings de Bedrock para la configuración de búsqueda en memoria.
  </Card>
  <Card title="Memory config reference" href="/es/reference/memory-config#bedrock-embedding-config" icon="database">
    Lista completa de modelos de embedding de Bedrock y opciones de dimensión.
  </Card>
  <Card title="Troubleshooting" href="/es/help/troubleshooting" icon="wrench">
    Solución general de problemas y preguntas frecuentes.
  </Card>
</CardGroup>
