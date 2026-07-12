---
read_when:
    - Quieres usar modelos de Amazon Bedrock con OpenClaw
    - Necesitas configurar las credenciales y la región de AWS para las llamadas al modelo.
summary: Usa modelos de Amazon Bedrock (API Converse) con OpenClaw
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-07-11T23:28:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fda4f5ab8ffcd68012cf78fbedb9fabec36d9742f16518ea4dd38418b2220b7b
    source_path: providers/bedrock.md
    workflow: 16
---

OpenClaw puede usar modelos de **Amazon Bedrock** mediante su proveedor de transmisión **Bedrock Converse**. La autenticación de Bedrock usa la **cadena de credenciales predeterminada del AWS SDK**, no una clave de API.

| Propiedad | Valor                                                               |
| --------- | ------------------------------------------------------------------- |
| Proveedor | `amazon-bedrock`                                                    |
| API       | `bedrock-converse-stream`                                           |
| Autenticación | Credenciales de AWS (variables de entorno, configuración compartida o rol de instancia) |
| Región    | `AWS_REGION` o `AWS_DEFAULT_REGION` (valor predeterminado: `us-east-1`) |

## Primeros pasos

Elija su método de autenticación preferido y siga los pasos de configuración.

<Tabs>
  <Tab title="Claves de acceso / variables de entorno">
    **Ideal para:** equipos de desarrollo, CI o hosts donde gestione directamente las credenciales de AWS.

    <Steps>
      <Step title="Establecer las credenciales de AWS en el host del Gateway">
        ```bash
        export AWS_ACCESS_KEY_ID="EXAMPLE_AWS_ACCESS_KEY_ID"
        export AWS_SECRET_ACCESS_KEY="..."
        export AWS_REGION="us-east-1"
        # Opcional:
        export AWS_SESSION_TOKEN="..."
        export AWS_PROFILE="your-profile"
        # Opcional (clave de API/token de portador de Bedrock):
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```
      </Step>
      <Step title="Añadir un proveedor y un modelo de Bedrock a la configuración">
        No se requiere `apiKey`. Configure el proveedor con `auth: "aws-sdk"`:

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
    Con la autenticación mediante marcadores de entorno (`AWS_ACCESS_KEY_ID`, `AWS_PROFILE` o `AWS_BEARER_TOKEN_BEDROCK`), OpenClaw habilita automáticamente el proveedor implícito de Bedrock para descubrir modelos sin configuración adicional.
    </Tip>

  </Tab>

  <Tab title="Roles de instancia de EC2 (IMDS)">
    **Ideal para:** instancias de EC2 con un rol de IAM asociado que usan el servicio de metadatos de instancia para la autenticación.

    <Steps>
      <Step title="Habilitar explícitamente el descubrimiento">
        Al usar IMDS, OpenClaw no puede detectar la autenticación de AWS únicamente mediante marcadores de entorno, por lo que debe habilitarla explícitamente:

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="Añadir opcionalmente un marcador de entorno para el modo automático">
        Si también quiere que funcione la ruta de detección automática mediante marcadores de entorno (por ejemplo, para las superficies de `openclaw status`):

        ```bash
        export AWS_PROFILE=default
        export AWS_REGION=us-east-1
        ```

        **No** necesita una clave de API ficticia.
      </Step>
      <Step title="Verificar que se descubran los modelos">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Warning>
    El rol de IAM asociado a su instancia de EC2 debe tener los siguientes permisos:

    - `bedrock:InvokeModel`
    - `bedrock:InvokeModelWithResponseStream`
    - `bedrock:ListFoundationModels` (para el descubrimiento automático)
    - `bedrock:ListInferenceProfiles` (para descubrir perfiles de inferencia)

    También puede asociar la política administrada `AmazonBedrockFullAccess`.
    </Warning>

    <Note>
    Solo necesita `AWS_PROFILE=default` si quiere específicamente un marcador de entorno para el modo automático o las superficies de estado. La ruta real de autenticación del entorno de ejecución de Bedrock usa la cadena predeterminada del AWS SDK, por lo que la autenticación mediante el rol de instancia de IMDS funciona incluso sin marcadores de entorno.
    </Note>

  </Tab>
</Tabs>

## Descubrimiento automático de modelos

OpenClaw puede descubrir automáticamente modelos de Bedrock que admitan **transmisión**
y **salida de texto**. El descubrimiento usa `bedrock:ListFoundationModels` y
`bedrock:ListInferenceProfiles`, y los resultados se almacenan en caché (valor predeterminado: 1 hora).

Cómo se habilita el proveedor implícito:

- Si `plugins.entries.amazon-bedrock.config.discovery.enabled` es `true`,
  OpenClaw intentará realizar el descubrimiento incluso si no hay ningún marcador de entorno de AWS.
- Si `plugins.entries.amazon-bedrock.config.discovery.enabled` no está definido,
  OpenClaw solo añade automáticamente el
  proveedor implícito de Bedrock cuando detecta uno de estos marcadores de autenticación de AWS:
  `AWS_BEARER_TOKEN_BEDROCK`, `AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY` o `AWS_PROFILE`.
- La ruta real de autenticación del entorno de ejecución de Bedrock sigue usando la cadena predeterminada del AWS SDK, por lo que
  la configuración compartida, SSO y la autenticación mediante el rol de instancia de IMDS pueden funcionar incluso cuando el descubrimiento
  necesitó `enabled: true` para habilitarse.

<Note>
Para las entradas explícitas de `models.providers["amazon-bedrock"]`, OpenClaw puede seguir resolviendo anticipadamente la autenticación mediante marcadores de entorno de Bedrock a partir de marcadores de entorno de AWS como `AWS_BEARER_TOKEN_BEDROCK`, sin forzar la carga completa de la autenticación del entorno de ejecución. La ruta real de autenticación de las llamadas al modelo sigue usando la cadena predeterminada del AWS SDK.
</Note>

<AccordionGroup>
  <Accordion title="Opciones de configuración del descubrimiento">
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

    | Opción | Valor predeterminado | Descripción |
    | ------ | -------------------- | ----------- |
    | `enabled` | automático | En el modo automático, OpenClaw solo habilita el proveedor implícito de Bedrock cuando detecta un marcador de entorno de AWS compatible. Establézcalo en `true` para forzar el descubrimiento. |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | Región de AWS usada para las llamadas a la API de descubrimiento. |
    | `providerFilter` | (todos) | Busca coincidencias con los nombres de proveedores de Bedrock (por ejemplo, `anthropic` y `amazon`). |
    | `refreshInterval` | `3600` | Duración de la caché en segundos. Establézcalo en `0` para deshabilitar el almacenamiento en caché. |
    | `defaultContextWindow` | `32000` | Ventana de contexto usada para los modelos descubiertos cuyos límites de tokens se desconocen (sobrescriba este valor si conoce los límites de su modelo). |
    | `defaultMaxTokens` | `4096` | Cantidad máxima de tokens de salida usada para los modelos descubiertos cuyos límites de tokens se desconocen (sobrescriba este valor si conoce los límites de su modelo). |

  </Accordion>

  <Accordion title="Ventana de contexto y límites máximos de tokens">
    Las API `ListFoundationModels` y `GetFoundationModel` de Bedrock no devuelven
    metadatos de límites de tokens, sino únicamente el identificador y el nombre del modelo, las modalidades y el estado
    del ciclo de vida. OpenClaw incluye una tabla de consulta con las ventanas de contexto y los límites
    de salida conocidos para modelos populares de Bedrock (Claude, Nova, Llama, Mistral, DeepSeek
    y otros), de modo que la gestión de sesiones, los umbrales de Compaction y
    la detección de desbordamiento del contexto funcionen correctamente para esos modelos.

    Los modelos descubiertos que no se encuentren en la tabla recurren a `defaultContextWindow`
    y `defaultMaxTokens`. Si un modelo que usa no tiene límites precisos,
    sobrescríbalos mediante una entrada explícita de
    `models.providers["amazon-bedrock"].models`.

  </Accordion>
</AccordionGroup>

## Configuración rápida (ruta de AWS)

Este procedimiento crea un rol de IAM, asocia los permisos de Bedrock, vincula
el perfil de instancia y habilita el descubrimiento de OpenClaw en el host de EC2.

```bash
# 1. Crear el rol de IAM y el perfil de instancia
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

# 2. Asociarlo a la instancia de EC2
aws ec2 associate-iam-instance-profile \
  --instance-id i-xxxxx \
  --iam-instance-profile Name=EC2-Bedrock-Access

# 3. En la instancia de EC2, habilitar explícitamente el descubrimiento
openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1

# 4. Opcional: añadir un marcador de entorno si desea usar el modo automático sin habilitarlo explícitamente
echo 'export AWS_PROFILE=default' >> ~/.bashrc
echo 'export AWS_REGION=us-east-1' >> ~/.bashrc
source ~/.bashrc

# 5. Verificar que se descubran los modelos
openclaw models list
```

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Perfiles de inferencia">
    OpenClaw descubre **perfiles de inferencia regionales y globales** junto con
    los modelos fundacionales. Cuando un perfil se corresponde con un modelo fundacional conocido, el
    perfil hereda las capacidades de ese modelo (ventana de contexto, cantidad máxima de tokens,
    razonamiento y visión), y la región correcta de la solicitud de Bedrock se inserta
    automáticamente. Esto significa que los perfiles de Claude entre regiones funcionan sin
    sobrescrituras manuales del proveedor. Los perfiles globales entre regiones (`global.*`) aparecen
    primero en `openclaw models list`, ya que generalmente ofrecen mayor capacidad
    y conmutación por error automática.

    Los identificadores de los perfiles de inferencia tienen un aspecto como `us.anthropic.claude-opus-4-6-v1:0` (regional)
    o `anthropic.claude-opus-4-6-v1:0` (global). Si el modelo subyacente ya se encuentra
    en los resultados del descubrimiento, el perfil hereda todas sus capacidades;
    de lo contrario, se aplican valores predeterminados seguros.

    No se necesita configuración adicional. Siempre que el descubrimiento esté habilitado y la identidad de IAM
    tenga `bedrock:ListInferenceProfiles`, los perfiles aparecerán junto con
    los modelos fundacionales en `openclaw models list`.

  </Accordion>

  <Accordion title="Nivel de servicio">
    Algunos modelos de Bedrock admiten un parámetro `service_tier` para optimizar el coste
    o la latencia. Están disponibles los siguientes niveles:

    | Nivel | Descripción |
    |------|-------------|
    | `default` | Nivel estándar de Bedrock |
    | `flex` | Procesamiento con descuento para cargas de trabajo que pueden tolerar una latencia mayor |
    | `priority` | Procesamiento prioritario para cargas de trabajo sensibles a la latencia |
    | `reserved` | Capacidad reservada para cargas de trabajo en estado estable |

    Establezca `serviceTier` (o `service_tier`) mediante `agents.defaults.params` para
    las solicitudes de modelos de Bedrock, o por modelo en
    `agents.defaults.models["<model-key>"].params`:

    ```json5
    {
      agents: {
        defaults: {
          params: {
            serviceTier: "flex", // se aplica a todos los modelos
          },
          models: {
            "amazon-bedrock/mistral.mistral-large-3-675b-instruct": {
              params: {
                serviceTier: "priority", // sobrescritura por modelo
              },
            },
          },
        },
      },
    }
    ```

    Los valores válidos son `default`, `flex`, `priority` y `reserved`. Claude
    Fable 5 y Sonnet 5 solo admiten el nivel `default`; OpenClaw muestra una
    advertencia e ignora `flex`, `priority` o `reserved` cuando se solicitan para
    esos modelos. En otros modelos, no todos admiten todos los niveles: un nivel
    no compatible devuelve un error de validación de Bedrock, y el mensaje de
    error puede ser engañoso (por ejemplo, "El identificador de modelo
    proporcionado no es válido" en lugar de indicar que el nivel es el
    problema). Si ve este error, compruebe si el modelo admite el nivel
    solicitado.

  </Accordion>

  <Accordion title="Claude Opus 4.7 and 4.8 temperature">
    Bedrock rechaza el parámetro `temperature` para Claude Opus 4.7 y Opus
    4.8. OpenClaw omite automáticamente `temperature` para cualquier referencia
    de Bedrock coincidente, incluidos los identificadores de modelos fundacionales,
    los perfiles de inferencia con nombre, los perfiles de inferencia de aplicaciones
    cuyo modelo subyacente se resuelve como Opus 4.7/4.8 mediante
    `bedrock:GetInferenceProfile` y las variantes con puntos `opus-4.7`/`opus-4.8`
    con prefijos de región opcionales (`us.`, `eu.`, `ap.`, `apac.`, `au.`, `jp.`,
    `global.`). No se requiere ninguna opción de configuración, y la omisión se
    aplica tanto al objeto de opciones de la solicitud como al campo
    `inferenceConfig` de la carga útil.
  </Accordion>

  <Accordion title="Claude Fable 5">
    Use `amazon-bedrock/anthropic.claude-fable-5` en `us-east-1` o los
    identificadores de inferencia regionales, como `us.anthropic.claude-fable-5`.
    OpenClaw aplica la ventana de contexto de 1 millón de Fable, el límite de
    salida de 128 000, el razonamiento adaptativo siempre activo y la asignación
    de esfuerzo compatible. `/think off` y `/think minimal` se asignan a `low`;
    se omiten la temperatura y los controles de selección forzada de herramientas,
    como en la ruta de Opus 4.7/4.8. La salida en transmisión se retiene hasta
    que Bedrock devuelve un estado terminal, para que los rechazos durante la
    transmisión no expongan texto parcial.

    AWS requiere una aceptación explícita de retención de datos mediante
    `provider_data_share` antes de que Fable esté disponible. Los prompts y las
    respuestas se comparten con Anthropic y se conservan durante un máximo de
    30 días con fines de confianza y seguridad. Revise y configure la
    [retención de datos de Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/data-retention.html)
    antes de habilitar el modelo.

  </Accordion>

  <Accordion title="Claude Mythos 5">
    Claude Mythos 5 está disponible mediante Bedrock únicamente para las cuentas
    que cuentan con la aprobación de acceso limitado requerida. OpenClaw reconoce
    el modelo fundacional `anthropic.claude-mythos-5` y los perfiles de inferencia
    regionales o globales, como `us.anthropic.claude-mythos-5`.

    OpenClaw aplica la ventana de contexto de 1 000 000 de tokens, el límite de
    salida de 128 000 tokens, la entrada de imágenes, el almacenamiento en caché
    de prompts, la transmisión segura ante rechazos y los niveles de esfuerzo
    nativos. El razonamiento adaptativo siempre está habilitado: `/think off` y
    `/think minimal` se asignan a `low`, mientras que `xhigh` y `max` permanecen
    disponibles. Se omiten los valores personalizados de muestreo y selección
    forzada de herramientas.

  </Accordion>

  <Accordion title="Claude Sonnet 5">
    AWS documenta Sonnet 5 tanto para los endpoints
    [`bedrock-runtime` como `bedrock-mantle`](https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-anthropic-claude-sonnet-5.html).
    OpenClaw reconoce el modelo fundacional de Bedrock
    `anthropic.claude-sonnet-5` y los perfiles de inferencia regionales o globales,
    como `us.anthropic.claude-sonnet-5`. Aplica la ventana de contexto de
    1 000 000 de tokens, el límite de salida de 128 000 tokens, la entrada de
    imágenes, los niveles de esfuerzo nativos, el almacenamiento en caché de
    prompts y la transmisión segura ante rechazos.

    Bedrock mantiene habilitado el razonamiento adaptativo para Sonnet 5. El valor
    predeterminado de OpenClaw es `high`; `/think off` y `/think minimal` se
    asignan a `low` porque esta ruta no puede deshabilitar el razonamiento. Los
    valores personalizados de temperatura y selección forzada de herramientas
    se omiten mientras el razonamiento adaptativo está activo.

  </Accordion>

  <Accordion title="Guardrails">
    Puede aplicar las [medidas de protección de Amazon Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
    a todas las invocaciones de modelos de Bedrock añadiendo un objeto `guardrail`
    a la configuración del Plugin `amazon-bedrock`. Las medidas de protección
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

    `guardrailIdentifier` y `guardrailVersion` son obligatorios.

    | Opción | Descripción |
    | ------ | ----------- |
    | `guardrailIdentifier` | Identificador de la medida de protección (p. ej., `abc123`) o ARN completo (p. ej., `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`). |
    | `guardrailVersion` | Número de versión publicada o `"DRAFT"` para el borrador de trabajo. |
    | `streamProcessingMode` | `"sync"` o `"async"` para evaluar la medida de protección durante la transmisión. Si se omite, Bedrock utiliza su valor predeterminado. |
    | `trace` | `"enabled"` o `"enabled_full"` para la depuración; omítalo o establézcalo en `"disabled"` para producción. |

    <Warning>
    La entidad principal de IAM utilizada por el Gateway debe tener el permiso `bedrock:ApplyGuardrail`, además de los permisos de invocación estándar.
    </Warning>

  </Accordion>

  <Accordion title="Embeddings for memory search">
    Bedrock también puede funcionar como proveedor de representaciones vectoriales
    para la [búsqueda en memoria](/es/concepts/memory-search). Esto se configura por
    separado del proveedor de inferencia: establezca
    `agents.defaults.memorySearch.provider` en `"bedrock"`:

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

    Las representaciones vectoriales de Bedrock utilizan la misma cadena de
    credenciales del SDK de AWS que la inferencia (roles de instancia, SSO,
    claves de acceso, configuración compartida e identidad web). No se necesita
    ninguna clave de API.

    Los modelos de representaciones vectoriales compatibles incluyen Amazon Titan
    Embed (v1, v2), Amazon Nova Embed, Cohere Embed (v3, v4) y TwelveLabs Marengo.
    Consulte la
    [referencia de configuración de memoria de Bedrock](/es/reference/memory-config#bedrock-embedding-config)
    para ver la lista completa de modelos y las opciones de dimensiones.

  </Accordion>

  <Accordion title="Notes and caveats">
    - Bedrock requiere que el **acceso al modelo** esté habilitado en su cuenta
      y región de AWS.
    - La detección automática necesita los permisos `bedrock:ListFoundationModels`
      y `bedrock:ListInferenceProfiles`.
    - Si utiliza el modo automático, configure uno de los marcadores de entorno
      de autenticación de AWS compatibles en el host del Gateway. Si prefiere
      la autenticación mediante IMDS o configuración compartida sin marcadores
      de entorno, establezca
      `plugins.entries.amazon-bedrock.config.discovery.enabled: true`.
    - OpenClaw muestra el origen de las credenciales en este orden:
      `AWS_BEARER_TOKEN_BEDROCK`, después `AWS_ACCESS_KEY_ID` +
      `AWS_SECRET_ACCESS_KEY`, después `AWS_PROFILE` y, por último, la cadena
      predeterminada del SDK de AWS.
    - La compatibilidad con el razonamiento depende del modelo; consulte la
      ficha del modelo de Bedrock para conocer las capacidades actuales.
    - Si prefiere un flujo administrado de claves, también puede colocar un
      proxy compatible con OpenAI delante de Bedrock y configurarlo como
      proveedor de OpenAI.
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Model selection" href="/es/concepts/model-providers" icon="layers">
    Selección de proveedores, referencias de modelos y comportamiento de
    conmutación por error.
  </Card>
  <Card title="Memory search" href="/es/concepts/memory-search" icon="magnifying-glass">
    Representaciones vectoriales de Bedrock para configurar la búsqueda en
    memoria.
  </Card>
  <Card title="Memory config reference" href="/es/reference/memory-config#bedrock-embedding-config" icon="database">
    Lista completa de modelos de representaciones vectoriales de Bedrock y
    opciones de dimensiones.
  </Card>
  <Card title="Troubleshooting" href="/es/help/troubleshooting" icon="wrench">
    Solución general de problemas y preguntas frecuentes.
  </Card>
</CardGroup>
