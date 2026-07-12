---
read_when:
    - Configuración de Mattermost
    - Depuración del enrutamiento de Mattermost
sidebarTitle: Mattermost
summary: Configuración del bot de Mattermost y de OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-07-12T14:18:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 246535ff433a678624d997db640d2531d6ce434ea064a23b98abe8a9e7e6a117
    source_path: channels/mattermost.md
    workflow: 16
---

Estado: plugin descargable (token de bot + eventos de WebSocket). Se admiten canales, canales privados, MD de grupo y MD. Mattermost es una plataforma autoalojable de mensajería para equipos ([mattermost.com](https://mattermost.com)).

## Instalación

<Tabs>
  <Tab title="Registro de npm">
    ```bash
    openclaw plugins install @openclaw/mattermost
    ```
  </Tab>
  <Tab title="Copia de trabajo local">
    ```bash
    openclaw plugins install ./path/to/local/mattermost-plugin
    ```
  </Tab>
</Tabs>

Detalles: [Plugins](/es/tools/plugin)

## Configuración rápida

<Steps>
  <Step title="Asegurarse de que el plugin esté disponible">
    Instale `@openclaw/mattermost` con el comando anterior y, si el Gateway ya está en ejecución, reinícielo.
  </Step>
  <Step title="Crear un bot de Mattermost">
    Cree una cuenta de bot de Mattermost, copie el **token del bot** y añada el bot a los equipos y canales que deba leer.
  </Step>
  <Step title="Copiar la URL base">
    Copie la **URL base** de Mattermost (por ejemplo, `https://chat.example.com`). El sufijo `/api/v4` se elimina automáticamente.
  </Step>
  <Step title="Configurar OpenClaw e iniciar el Gateway">
    Configuración mínima:

    ```json5
    {
      channels: {
        mattermost: {
          enabled: true,
          botToken: "mm-token",
          baseUrl: "https://chat.example.com",
          dmPolicy: "pairing",
        },
      },
    }
    ```

    Alternativa no interactiva:

    ```bash
    openclaw channels add --channel mattermost --bot-token <token> --http-url https://chat.example.com
    ```

  </Step>
</Steps>

<Note>
Mattermost autoalojado en una dirección privada, de LAN o de tailnet: las solicitudes salientes a la API de Mattermost pasan por una protección contra SSRF que bloquea de forma predeterminada las IP privadas e internas. Habilítelo con `channels.mattermost.network.dangerouslyAllowPrivateNetwork: true` (por cuenta: `channels.mattermost.accounts.<id>.network.dangerouslyAllowPrivateNetwork`).
</Note>

## Comandos de barra nativos

Los comandos de barra nativos son opcionales. Cuando están habilitados, OpenClaw registra comandos de barra `oc_*` en todos los equipos de los que el bot sea miembro y recibe solicitudes POST de devolución de llamada en el servidor HTTP del Gateway.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Úselo cuando Mattermost no pueda acceder directamente al Gateway (proxy inverso/URL pública).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

Comandos registrados: `/oc_status`, `/oc_model`, `/oc_models`, `/oc_new`, `/oc_help`, `/oc_think`, `/oc_reasoning`, `/oc_verbose`, `/oc_queue`. Con `nativeSkills: true`, los comandos de Skills también se registran como `/oc_<skill>`.

<AccordionGroup>
  <Accordion title="Notas de comportamiento">
    - El valor predeterminado de `native` y `nativeSkills` es `"auto"`, que en Mattermost se resuelve como deshabilitado. Establézcalos explícitamente en `true`.
    - El valor predeterminado de `callbackPath` es `/api/channels/mattermost/command`.
    - Si se omite `callbackUrl`, OpenClaw deriva `http://<gateway.customBindHost or localhost>:<gateway.port, default 18789><callbackPath>`. Los hosts de enlace comodín (`0.0.0.0`, `::`) recurren a `localhost`.
    - En configuraciones con varias cuentas, `commands` puede establecerse en el nivel superior o en `channels.mattermost.accounts.<id>.commands` (los valores de la cuenta prevalecen sobre los campos del nivel superior).
    - Los comandos de barra existentes con el mismo activador creados por otras integraciones se dejan intactos (el registro los omite); los comandos creados por el bot se actualizan o se vuelven a crear cuando cambia la URL de devolución de llamada.
    - Las devoluciones de llamada de los comandos se validan con los tokens específicos de cada comando que Mattermost devuelve cuando OpenClaw registra los comandos `oc_*`.
    - OpenClaw actualiza el registro actual de comandos de Mattermost antes de aceptar cada devolución de llamada, por lo que los tokens obsoletos de comandos de barra eliminados o regenerados dejan de aceptarse sin reiniciar el Gateway.
    - La validación de la devolución de llamada se cierra de forma segura si la API de Mattermost no puede confirmar que el comando siga vigente; las validaciones fallidas se almacenan brevemente en caché, las consultas simultáneas se agrupan y el inicio de nuevas consultas se limita por comando para acotar la presión de repetición.
    - Las devoluciones de llamada de comandos de barra se cierran de forma segura cuando el registro falla, el inicio fue parcial o el token de devolución de llamada no coincide con el token registrado del comando resuelto (un token válido para un comando no puede alcanzar la validación ascendente de otro comando).
    - Las devoluciones de llamada aceptadas se confirman con una respuesta efímera "Procesando..."; la respuesta real llega como un mensaje normal.

  </Accordion>
  <Accordion title="Requisito de accesibilidad">
    El endpoint de devolución de llamada debe ser accesible desde el servidor de Mattermost.

    - No establezca `callbackUrl` en `localhost` a menos que Mattermost se ejecute en el mismo host o espacio de nombres de red que OpenClaw.
    - No establezca `callbackUrl` en la URL base de Mattermost a menos que esa URL actúe como proxy inverso de `/api/channels/mattermost/command` hacia OpenClaw.
    - Una comprobación rápida es `curl https://<gateway-host>/api/channels/mattermost/command`; una solicitud GET debe devolver `405 Method Not Allowed` de OpenClaw, no `404`.

  </Accordion>
  <Accordion title="Lista de permitidos de salida de Mattermost">
    Si el destino de la devolución de llamada usa direcciones privadas, de tailnet o internas, establezca `ServiceSettings.AllowedUntrustedInternalConnections` de Mattermost para que incluya el host o dominio de devolución de llamada.

    Use entradas de host o dominio, no URL completas.

    - Correcto: `gateway.tailnet-name.ts.net`
    - Incorrecto: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## Variables de entorno (cuenta predeterminada)

Si prefiere variables de entorno, establézcalas en el host del Gateway:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
Las variables de entorno se aplican únicamente a la cuenta **predeterminada** (`default`). Las demás cuentas deben usar valores de configuración.

`MATTERMOST_URL` no puede establecerse desde un archivo `.env` del espacio de trabajo; consulte [Archivos .env del espacio de trabajo](/es/gateway/security).
</Note>

## Modos de chat

Mattermost responde automáticamente a los MD. El comportamiento en los canales se controla mediante `chatmode`:

<Tabs>
  <Tab title="oncall (predeterminado)">
    Responder únicamente cuando se mencione al bot con @ en los canales.
  </Tab>
  <Tab title="onmessage">
    Responder a todos los mensajes del canal.
  </Tab>
  <Tab title="onchar">
    Responder cuando un mensaje comience con un prefijo activador.
  </Tab>
</Tabs>

Ejemplo de configuración:

```json5
{
  channels: {
    mattermost: {
      chatmode: "onchar",
      oncharPrefixes: [">", "!"], // predeterminado
    },
  },
}
```

Notas:

- `onchar` también responde a las menciones explícitas con @.
- `channels.mattermost.requireMention` sigue respetándose, pero se prefiere `chatmode`. La configuración `groups.<channelId>.requireMention` de cada canal prevalece sobre ambas.
- Después de que el bot envíe una respuesta visible en un hilo de canal, los mensajes posteriores del mismo hilo se responden sin una nueva mención con @ ni un prefijo `onchar`, de modo que las conversaciones de varios turnos en el hilo continúan fluyendo. La participación se recuerda durante 7 días después de la última respuesta del bot en ese hilo y persiste tras los reinicios del Gateway. Los hilos que el bot solo haya observado no se ven afectados; inicie un nuevo mensaje de nivel superior para volver a requerir una mención explícita.

## Hilos y sesiones

Use `channels.mattermost.replyToMode` para controlar si las respuestas de canales y grupos permanecen en el canal principal o inician un hilo bajo la publicación activadora.

- `off` (predeterminado): solo se responde en un hilo cuando la publicación entrante ya pertenece a uno.
- `first`: para publicaciones de nivel superior en canales o grupos, se inicia un hilo bajo esa publicación y la conversación se dirige a una sesión limitada al hilo.
- `all` y `batched`: actualmente tienen el mismo comportamiento que `first` en Mattermost porque, una vez que Mattermost tiene una publicación raíz del hilo, los fragmentos y archivos multimedia posteriores continúan en ese mismo hilo.
- El valor predeterminado de los mensajes directos es `off`, incluso cuando se establece `replyToMode`.

Use `channels.mattermost.replyToModeByChatType` para sobrescribir el modo de los chats `direct`, `group` o `channel`. Establezca `direct` para habilitar los hilos en los mensajes directos:

- `off` (predeterminado): los mensajes directos permanecen sin hilos en una única sesión continua.
- `first`, `all` o `batched`: cada mensaje directo de nivel superior inicia un hilo de Mattermost respaldado por una sesión nueva e independiente.

```json5
{
  channels: {
    mattermost: {
      replyToMode: "all",
      replyToModeByChatType: {
        direct: "first",
      },
    },
  },
}
```

Notas:

- Las sesiones limitadas al hilo usan el identificador de la publicación activadora como raíz del hilo.
- `first` y `all` son equivalentes actualmente porque, una vez que Mattermost tiene una raíz de hilo, los fragmentos y archivos multimedia posteriores continúan en ese mismo hilo.
- Las sobrescrituras por tipo de chat tienen prioridad sobre `replyToMode`. Sin una sobrescritura de `direct`, las implementaciones existentes mantienen los MD planos y sin hilos.

## Control de acceso (MD)

- Valor predeterminado: `channels.mattermost.dmPolicy = "pairing"` (los remitentes desconocidos reciben un código de emparejamiento). Otros valores: `allowlist`, `open`, `disabled`.
- Apruebe mediante:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- MD públicos: `channels.mattermost.dmPolicy="open"` junto con `channels.mattermost.allowFrom=["*"]` (el esquema de configuración exige el comodín).
- `channels.mattermost.allowFrom` acepta identificadores de usuario (recomendado) y entradas `accessGroup:<name>`. Consulte [Grupos de acceso](/es/channels/access-groups).

## Canales (grupos)

- Valor predeterminado: `channels.mattermost.groupPolicy = "allowlist"` (requiere mención).
- Incluya remitentes en la lista de permitidos mediante `channels.mattermost.groupAllowFrom` (se recomiendan identificadores de usuario).
- `channels.mattermost.groupAllowFrom` acepta entradas `accessGroup:<name>`. Consulte [Grupos de acceso](/es/channels/access-groups).
- Las sobrescrituras de menciones por canal se encuentran en `channels.mattermost.groups.<channelId>.requireMention` o, como valor predeterminado, en `channels.mattermost.groups["*"].requireMention`.
- La coincidencia de `@username` es mutable y solo se habilita cuando `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Canales abiertos: `channels.mattermost.groupPolicy="open"` (requiere mención).
- Orden de resolución: `channels.mattermost.groupPolicy`, después `channels.defaults.groupPolicy` y, por último, `"allowlist"`.
- Nota sobre el entorno de ejecución: si falta por completo la sección `channels.mattermost`, el entorno de ejecución se cierra de forma segura con `groupPolicy="allowlist"` para las comprobaciones de grupos (aunque se haya establecido `channels.defaults.groupPolicy`) y registra una advertencia una sola vez.

Ejemplo:

```json5
{
  channels: {
    mattermost: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: true },
        "team-channel-id": { requireMention: false },
      },
    },
  },
}
```

## Destinos para la entrega saliente

Use estos formatos de destino con `openclaw message send` o Cron/Webhooks:

| Destino                             | Entrega en                                                                 |
| ----------------------------------- | -------------------------------------------------------------------------- |
| `channel:<id>`                      | Canal por identificador                                                    |
| `channel:<name>` o `#channel-name`  | Canal por nombre, buscado entre los equipos a los que pertenece el bot     |
| `user:<id>` o `mattermost:<id>`     | MD con ese usuario                                                         |
| `@username`                         | MD (el nombre de usuario se resuelve mediante la API de Mattermost)        |

Los envíos salientes admiten como máximo un archivo adjunto por mensaje; divida varios archivos en envíos separados.

<Warning>
Los identificadores opacos sin prefijo (como `64ifufp...`) son **ambiguos** en Mattermost (identificador de usuario frente a identificador de canal).

OpenClaw los resuelve **priorizando al usuario**:

- Si el identificador existe como usuario (`GET /api/v4/users/<id>` se completa correctamente), OpenClaw envía un **MD** resolviendo el canal directo mediante `/api/v4/channels/direct`.
- De lo contrario, el identificador se trata como un **identificador de canal**.

Si necesita un comportamiento determinista, use siempre los prefijos explícitos (`user:<id>` / `channel:<id>`).
</Warning>

## Reintentos del canal de MD

Cuando OpenClaw envía a un destino de MD de Mattermost y primero necesita resolver el canal directo, vuelve a intentar de forma predeterminada los fallos transitorios de creación del canal directo.

Use `channels.mattermost.dmChannelRetry` para ajustar ese comportamiento globalmente para el plugin de Mattermost, o `channels.mattermost.accounts.<id>.dmChannelRetry` para una cuenta. Valores predeterminados:

```json5
{
  channels: {
    mattermost: {
      dmChannelRetry: {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
        timeoutMs: 30000,
      },
    },
  },
}
```

Notas:

- Esto se aplica únicamente a la creación de canales de mensajes directos (`/api/v4/channels/direct`), no a todas las llamadas a la API de Mattermost.
- Los reintentos usan una espera exponencial con fluctuación aleatoria y se aplican a fallos transitorios, como límites de frecuencia, respuestas 5xx y errores de red o de tiempo de espera.
- Los errores de cliente 4xx distintos de `429` se consideran permanentes y no se reintentan.

## Transmisión de vista previa

Mattermost transmite el razonamiento, la actividad de las herramientas y el texto parcial de la respuesta a una **publicación de vista previa en borrador**, que se finaliza en el mismo lugar cuando es seguro enviar la respuesta final. En el modo `partial`, la vista previa se actualiza en la misma publicación, en lugar de saturar el canal con mensajes por cada fragmento. En el modo `block`, la vista previa alterna entre bloques de texto completado y de actividad de herramientas, por lo que los bloques anteriores permanecen visibles como publicaciones independientes en lugar de ser sobrescritos por el siguiente. Las respuestas finales con contenido multimedia o errores cancelan las ediciones pendientes de la vista previa y usan la entrega normal, en lugar de publicar una vista previa descartable.

La transmisión de vista previa está **activada de forma predeterminada** en el modo `partial`. Se configura mediante `channels.mattermost.streaming` (una cadena de modo, un valor booleano o un objeto como `{ mode: "progress" }`):

```json5
{
  channels: {
    mattermost: {
      streaming: "partial", // off | partial | block | progress
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Modos de transmisión">
    - `partial` (predeterminado): una publicación de vista previa que se edita a medida que crece la respuesta y, después, se finaliza con la respuesta completa.
    - `block` alterna la vista previa entre bloques de texto completado y de actividad de herramientas, por lo que cada bloque permanece visible como una publicación independiente en lugar de ser sobrescrito en el mismo lugar. Las actualizaciones paralelas y consecutivas de herramientas comparten la publicación actual de actividad de herramientas.
    - `progress` muestra una vista previa del estado durante la generación y solo publica la respuesta final al terminar.
    - `off` desactiva la transmisión de vista previa. Con `blockStreaming: true`, los bloques completados del asistente se siguen entregando como respuestas normales en bloques (publicaciones separadas), en lugar de como una única publicación final combinada.

  </Accordion>
  <Accordion title="Notas sobre el comportamiento de la transmisión">
    - Si la transmisión no puede finalizarse en el mismo lugar (por ejemplo, si la publicación se eliminó durante la transmisión), OpenClaw recurre al envío de una nueva publicación final para que la respuesta nunca se pierda.
    - Las cargas que solo contienen razonamiento se omiten de las publicaciones del canal, incluido el texto que llega como una cita en bloque `> Thinking`. Configure `/reasoning on` para ver el razonamiento en otras superficies; la publicación final de Mattermost solo conserva la respuesta.
    - Consulte [Transmisión](/es/concepts/streaming#preview-streaming-modes) para ver la matriz de correspondencias de canales.

  </Accordion>
</AccordionGroup>

## Reacciones (herramienta de mensajes)

- Use `message action=react` con `channel=mattermost`.
- `messageId` es el identificador de la publicación de Mattermost.
- `emoji` acepta nombres como `thumbsup` o `:+1:` (los dos puntos son opcionales).
- Establezca `remove=true` (booleano) para eliminar una reacción.
- Los eventos de adición y eliminación de reacciones se reenvían como eventos del sistema a la sesión de agente enrutada, sujetos a las mismas comprobaciones de políticas de mensajes directos y grupos que los mensajes.

Ejemplos:

```text
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Configuración:

- `channels.mattermost.actions.reactions`: activa o desactiva las acciones de reacción (valor predeterminado: true).
- Anulación por cuenta: `channels.mattermost.accounts.<id>.actions.reactions`.

## Botones interactivos (herramienta de mensajes)

Envíe mensajes con botones en los que se pueda hacer clic. Cuando un usuario hace clic en un botón, el agente recibe la selección y puede responder.

Los botones proceden de la carga semántica `presentation` (en las respuestas normales del agente y en `message action=send`). OpenClaw representa los botones de valor como botones interactivos de Mattermost, mantiene visibles los botones de URL en el texto del mensaje y convierte los menús de selección en texto legible.

```text
message action=send channel=mattermost target=channel:<channelId> presentation={"blocks":[{"type":"buttons","buttons":[{"label":"Sí","value":"yes"},{"label":"No","value":"no"}]}]}
```

Campos de los botones de presentación:

<ParamField path="label" type="string" required>
  Etiqueta visible (alias: `text`).
</ParamField>
<ParamField path="value" type="string">
  Valor devuelto al hacer clic, utilizado como identificador de la acción (alias: `callback_data`, `callbackData`). Es obligatorio para un botón en el que se pueda hacer clic, salvo que se establezca `url`.
</ParamField>
<ParamField path="url" type="string">
  Botón de enlace; se representa como texto `label: url` en el cuerpo del mensaje, en lugar de como botón interactivo.
</ParamField>
<ParamField path="style" type='"primary" | "secondary" | "success" | "danger"'>
  Estilo del botón. Mattermost aplica el estilo predeterminado a los valores que no admite.
</ParamField>

Para anunciar la compatibilidad con botones en el prompt del sistema del agente, añada `inlineButtons` a las capacidades del canal:

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

Cuando un usuario hace clic en un botón:

<Steps>
  <Step title="Comprobación de acceso">
    La persona que hace clic debe superar las mismas comprobaciones de políticas de mensajes directos y grupos que quien envía un mensaje; los clics no autorizados reciben un aviso efímero y se ignoran.
  </Step>
  <Step title="Sustitución de los botones por una confirmación">
    Todos los botones se sustituyen por una línea de confirmación (por ejemplo, «✓ **Sí** seleccionado por @user»).
  </Step>
  <Step title="El agente recibe la selección">
    El agente recibe la selección como mensaje entrante (además de un evento del sistema) y responde.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Notas de implementación">
    - Las devoluciones de llamada de los botones usan verificación HMAC-SHA256 (automática; no requiere configuración).
    - Al hacer clic, se sustituye todo el bloque de datos adjuntos, por lo que todos los botones se eliminan juntos; no es posible eliminarlos parcialmente.
    - Los identificadores de acción que contienen guiones o guiones bajos se depuran automáticamente (limitación del enrutamiento de Mattermost).
    - Los clics cuyo `action_id` no coincide con una acción de la publicación original se rechazan con `403` («Acción desconocida»).

  </Accordion>
  <Accordion title="Configuración y accesibilidad">
    - `channels.mattermost.capabilities`: matriz de cadenas de capacidades. Añada `"inlineButtons"` para activar la descripción de la herramienta de botones en el prompt del sistema del agente.
    - `channels.mattermost.interactions.callbackBaseUrl`: URL base externa opcional para las devoluciones de llamada de los botones (por ejemplo, `https://gateway.example.com`). Úsela cuando Mattermost no pueda acceder directamente al Gateway en su host de enlace.
    - En configuraciones con varias cuentas, también puede establecer el mismo campo en `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
    - Si se omite `interactions.callbackBaseUrl`, OpenClaw deriva la URL de devolución de llamada a partir de `gateway.customBindHost` + `gateway.port` (valor predeterminado: 18789) y, a continuación, recurre a `http://localhost:<port>`. La ruta de devolución de llamada es `/mattermost/interactions/<accountId>`.
    - Regla de accesibilidad: el servidor de Mattermost debe poder acceder a la URL de devolución de llamada de los botones. `localhost` solo funciona cuando Mattermost y OpenClaw se ejecutan en el mismo host o espacio de nombres de red.
    - `channels.mattermost.interactions.allowedSourceIps`: lista de direcciones IP de origen permitidas para las devoluciones de llamada de los botones. Sin ella, solo se aceptan orígenes de bucle invertido (`127.0.0.1`, `::1`), por lo que un servidor Mattermost remoto debe incluirse aquí o sus clics se rechazarán con `403`. Si hay un proxy inverso, configure también `gateway.trustedProxies` para que la dirección IP real del cliente se obtenga de los encabezados reenviados.
    - Si el destino de la devolución de llamada es privado, pertenece a una tailnet o es interno, añada su host o dominio a `ServiceSettings.AllowedUntrustedInternalConnections` de Mattermost.

  </Accordion>
</AccordionGroup>

### Integración directa con la API (scripts externos)

Los scripts externos y los Webhooks pueden publicar botones directamente mediante la API REST de Mattermost, en lugar de utilizar la herramienta `message` del agente. Use `buildButtonAttachments()` del Plugin cuando sea posible; si publica JSON sin procesar, siga estas reglas:

**Estructura de la carga:**

```json5
{
  channel_id: "<channelId>",
  message: "Elija una opción:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // solo alfanumérico; consulte más abajo
            type: "button", // obligatorio; de lo contrario, los clics se ignoran silenciosamente
            name: "Aprobar", // etiqueta visible
            style: "primary", // opcional: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // debe coincidir con el identificador del botón
                action: "approve",
                // ... cualquier campo personalizado ...
                _token: "<hmac>", // consulte la sección sobre HMAC más abajo
              },
            },
          },
        ],
      },
    ],
  },
}
```

<Warning>
**Reglas críticas**

1. Los datos adjuntos se incluyen en `props.attachments`, no en `attachments` en el nivel superior (se ignoran silenciosamente).
2. Cada acción necesita `type: "button"`; sin él, los clics se descartan silenciosamente.
3. Cada acción necesita un campo `id`; Mattermost ignora las acciones sin identificadores.
4. El `id` de la acción debe contener **solo caracteres alfanuméricos** (`[a-zA-Z0-9]`). Los guiones y guiones bajos interrumpen el enrutamiento de acciones del servidor de Mattermost (devuelve 404). Elimínelos antes de usarlo.
5. `context.action_id` debe coincidir con el `id` del botón; el Gateway rechaza los clics cuyo `action_id` no existe en la publicación.
6. `context.action_id` es obligatorio; el controlador de interacciones devuelve 400 sin él.
7. La dirección IP de origen de la devolución de llamada debe estar permitida (consulte `interactions.allowedSourceIps` más arriba).

</Warning>

**Generación del token HMAC**

El Gateway verifica los clics en los botones mediante HMAC-SHA256. Los scripts externos deben generar tokens que coincidan con la lógica de verificación del Gateway:

<Steps>
  <Step title="Derivar el secreto del token del bot">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`, codificado en hexadecimal.
  </Step>
  <Step title="Crear el objeto de contexto">
    Cree el objeto de contexto con todos los campos **excepto** `_token`.
  </Step>
  <Step title="Serializar con las claves ordenadas">
    Serialice con las **claves ordenadas de forma recursiva** y **sin espacios** (el Gateway también normaliza los objetos anidados y produce JSON compacto).
  </Step>
  <Step title="Firmar la carga">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="Añadir el token">
    Añada el resumen hexadecimal resultante como `_token` en el contexto.
  </Step>
</Steps>

Ejemplo en Python:

```python
import hmac, hashlib, json

secret = hmac.new(
    b"openclaw-mattermost-interactions",
    bot_token.encode(), hashlib.sha256
).hexdigest()

ctx = {"action_id": "mybutton01", "action": "approve"}
payload = json.dumps(ctx, sort_keys=True, separators=(",", ":"))
token = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()

context = {**ctx, "_token": token}
```

<AccordionGroup>
  <Accordion title="Errores habituales con HMAC">
    - `json.dumps` de Python añade espacios de forma predeterminada (`{"key": "val"}`). Use `separators=(",", ":")` para que coincida con la salida compacta de JavaScript (`{"key":"val"}`).
    - Firme siempre **todos** los campos del contexto (excepto `_token`). El Gateway elimina `_token` y, después, firma todo lo restante. Firmar un subconjunto provoca un fallo silencioso de verificación.
    - Use `sort_keys=True`: el Gateway ordena las claves antes de firmar y Mattermost puede reordenar los campos del contexto al almacenar la carga.
    - Derive el secreto del token del bot (de forma determinista), no de bytes aleatorios. El secreto debe ser el mismo en el proceso que crea los botones y en el Gateway que los verifica.

  </Accordion>
</AccordionGroup>

## Adaptador de directorio

El Plugin de Mattermost incluye un adaptador de directorio que resuelve los nombres de canales y usuarios mediante la API de Mattermost. Esto permite usar destinos `#channel-name` y `@username` en `openclaw message send` y en las entregas mediante Cron o Webhook.

No se necesita configuración: el adaptador usa el token del bot de la configuración de la cuenta.

## Varias cuentas

Mattermost admite varias cuentas en `channels.mattermost.accounts`:

```json5
{
  channels: {
    mattermost: {
      accounts: {
        default: { name: "Principal", botToken: "mm-token", baseUrl: "https://chat.example.com" },
        alerts: { name: "Alertas", botToken: "mm-token-2", baseUrl: "https://alerts.example.com" },
      },
    },
  },
}
```

Los valores de la cuenta sobrescriben los campos de nivel superior; `channels.mattermost.defaultAccount` selecciona qué cuenta se utiliza cuando no se especifica ninguna.

## Solución de problemas

<AccordionGroup>
  <Accordion title="No hay respuestas en los canales">
    Asegúrese de que el bot esté en el canal y menciónelo (oncall), use un prefijo de activación (onchar) o establezca `chatmode: "onmessage"`.
  </Accordion>
  <Accordion title="Errores de autenticación o de varias cuentas">
    - Compruebe el token del bot, la URL base y si la cuenta está habilitada.
    - Problemas con varias cuentas: las variables de entorno solo se aplican a la cuenta `default`.
    - Los hosts de Mattermost privados o de la LAN necesitan `network.dangerouslyAllowPrivateNetwork: true` (la protección contra SSRF bloquea las IP privadas de forma predeterminada).

  </Accordion>
  <Accordion title="Los comandos de barra nativos fallan">
    - `Unauthorized: invalid command token.`: OpenClaw no aceptó el token de devolución de llamada. Causas habituales:
      - el registro de los comandos de barra falló o solo se completó parcialmente durante el inicio
      - la devolución de llamada llega al Gateway o a la cuenta incorrectos
      - Mattermost aún tiene comandos antiguos que apuntan a un destino de devolución de llamada anterior
      - el Gateway se reinició sin reactivar los comandos de barra
    - Si los comandos de barra nativos dejan de funcionar, revise los registros para buscar `mattermost: failed to register slash commands` o `mattermost: native slash commands enabled but no commands could be registered`.
    - Si se omite `callbackUrl` y los registros advierten que la devolución de llamada se resolvió como una URL de bucle invertido, como `http://localhost:18789/...`, probablemente esa URL solo sea accesible cuando Mattermost se ejecute en el mismo host o espacio de nombres de red que OpenClaw. En su lugar, establezca un `commands.callbackUrl` explícito y accesible externamente.

  </Accordion>
  <Accordion title="Problemas con los botones">
    - Los botones aparecen como cuadros blancos o no aparecen: los datos del botón tienen un formato incorrecto. Cada botón de presentación necesita un `label` y un `value` (los botones que carecen de cualquiera de ellos se descartan).
    - Los botones se muestran, pero los clics no hacen nada: compruebe que se pueda acceder al Gateway desde el servidor de Mattermost, que la IP del servidor de Mattermost esté incluida en `channels.mattermost.interactions.allowedSourceIps` (sin esta opción, solo se acepta la dirección de bucle invertido) y que `ServiceSettings.AllowedUntrustedInternalConnections` incluya el host de devolución de llamada para los destinos privados.
    - Los botones devuelven un error 404 al hacer clic: es probable que el `id` del botón contenga guiones o guiones bajos. El enrutador de acciones de Mattermost falla con los identificadores no alfanuméricos. Use solo `[a-zA-Z0-9]`.
    - El Gateway registra `rejected callback source`: el clic provino de una IP que no está en `interactions.allowedSourceIps`. Añada el servidor de Mattermost o su entrada a la lista de permitidos y establezca `gateway.trustedProxies` si está detrás de un proxy inverso.
    - El Gateway registra `invalid _token`: discrepancia de HMAC. Compruebe que firme todos los campos del contexto (no solo un subconjunto), use claves ordenadas y JSON compacto (sin espacios). Consulte la sección sobre HMAC anterior.
    - El Gateway registra `missing _token in context`: el campo `_token` no está en el contexto del botón. Asegúrese de incluirlo al crear la carga útil de la integración.
    - El Gateway rechaza el clic con `Unknown action`: `context.action_id` no coincide con el `id` de ninguna acción de la publicación. Establezca ambos con el mismo valor depurado.
    - El agente no ofrece botones: añada `capabilities: ["inlineButtons"]` a la configuración del canal de Mattermost.

  </Accordion>
</AccordionGroup>

## Temas relacionados

- [Enrutamiento de canales](/es/channels/channel-routing) - enrutamiento de sesiones para mensajes
- [Descripción general de los canales](/es/channels) - todos los canales compatibles
- [Grupos](/es/channels/groups) - comportamiento del chat grupal y control mediante menciones
- [Emparejamiento](/es/channels/pairing) - autenticación por mensaje directo y flujo de emparejamiento
- [Seguridad](/es/gateway/security) - modelo de acceso y refuerzo de la seguridad
