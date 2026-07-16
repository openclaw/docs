---
read_when:
    - Configuración de Mattermost
    - Depuración del enrutamiento de Mattermost
sidebarTitle: Mattermost
summary: Configuración del bot de Mattermost y de OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-07-16T11:26:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e7d2233e26c6c0a510a264001a1e0d3e528d8645ffbe2affa3f1672304185ef5
    source_path: channels/mattermost.md
    workflow: 16
---

Estado: Plugin descargable (token de bot + eventos WebSocket). Se admiten canales, canales privados, mensajes directos grupales y mensajes directos. Mattermost es una plataforma de mensajería de equipo que puede alojarse en infraestructura propia ([mattermost.com](https://mattermost.com)).

## Instalación

<Tabs>
  <Tab title="Registro npm">
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
  <Step title="Asegurar que el Plugin esté disponible">
    Instale `@openclaw/mattermost` con el comando anterior y, a continuación, reinicie el Gateway si ya está en ejecución.
  </Step>
  <Step title="Crear un bot de Mattermost">
    Cree una cuenta de bot de Mattermost, copie el **token del bot** y añada el bot a los equipos y canales que deba leer.
  </Step>
  <Step title="Copiar la URL base">
    Copie la **URL base** de Mattermost (p. ej., `https://chat.example.com`). La barra `/api/v4` final se elimina automáticamente.
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
Mattermost alojado en infraestructura propia con una dirección privada/LAN/tailnet: las solicitudes salientes a la API de Mattermost pasan por una protección contra SSRF que bloquea de forma predeterminada las IP privadas e internas. Habilítelas con `channels.mattermost.network.dangerouslyAllowPrivateNetwork: true` (por cuenta: `channels.mattermost.accounts.<id>.network.dangerouslyAllowPrivateNetwork`).
</Note>

## Comandos de barra nativos

Los comandos de barra nativos son opcionales. Cuando se habilitan, OpenClaw registra comandos de barra `oc_*` en todos los equipos a los que pertenece el bot y recibe solicitudes POST de devolución de llamada en el servidor HTTP del Gateway.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Utilícelo cuando Mattermost no pueda acceder directamente al Gateway (proxy inverso/URL pública).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

Comandos registrados: `/oc_status`, `/oc_model`, `/oc_models`, `/oc_new`, `/oc_help`, `/oc_think`, `/oc_reasoning`, `/oc_verbose`, `/oc_queue`. Con `nativeSkills: true`, los comandos de Skills también se registran como `/oc_<skill>`.

<AccordionGroup>
  <Accordion title="Notas de comportamiento">
    - `native` y `nativeSkills` tienen como valor predeterminado `"auto"`, que se resuelve como deshabilitado para Mattermost. Establézcalos explícitamente en `true`.
    - `callbackPath` tiene como valor predeterminado `/api/channels/mattermost/command`.
    - Si se omite `callbackUrl`, OpenClaw deriva `http://<gateway.customBindHost or localhost>:<gateway.port, default 18789><callbackPath>`. Los hosts de enlace comodín (`0.0.0.0`, `::`) recurren a `localhost`.
    - En configuraciones con varias cuentas, `commands` puede establecerse en el nivel superior o dentro de `channels.mattermost.accounts.<id>.commands` (los valores de cuenta prevalecen sobre los campos del nivel superior).
    - Los comandos de barra existentes con el mismo activador que hayan creado otras integraciones no se modifican (se omite su registro); los comandos creados por el bot se actualizan o se vuelven a crear cuando cambia la URL de devolución de llamada.
    - Las devoluciones de llamada de los comandos se validan con los tokens específicos de cada comando que devuelve Mattermost cuando OpenClaw registra comandos `oc_*`.
    - OpenClaw actualiza el registro actual de comandos de Mattermost antes de aceptar cada devolución de llamada, por lo que los tokens obsoletos de comandos de barra eliminados o regenerados dejan de aceptarse sin reiniciar el Gateway.
    - La validación de devoluciones de llamada falla de forma cerrada si la API de Mattermost no puede confirmar que el comando sigue vigente; las validaciones fallidas se almacenan brevemente en caché, las consultas simultáneas se agrupan y el inicio de nuevas consultas se limita por comando para acotar la presión de repetición.
    - Las devoluciones de llamada de barra fallan de forma cerrada cuando el registro ha fallado, el inicio ha sido parcial o el token de devolución de llamada no coincide con el token registrado del comando resuelto (un token válido para un comando no puede llegar a la validación ascendente de otro comando).
    - Las devoluciones de llamada aceptadas se confirman con una respuesta efímera «Procesando...»; la respuesta real llega como un mensaje normal.

  </Accordion>
  <Accordion title="Requisito de accesibilidad">
    El servidor de Mattermost debe poder acceder al punto de conexión de devolución de llamada.

    - No establezca `callbackUrl` en `localhost` salvo que Mattermost se ejecute en el mismo host o espacio de nombres de red que OpenClaw.
    - No establezca `callbackUrl` en la URL base de Mattermost salvo que esa URL actúe como proxy inverso de `/api/channels/mattermost/command` hacia OpenClaw.
    - Una comprobación rápida es `curl https://<gateway-host>/api/channels/mattermost/command`; una solicitud GET debe devolver `405 Method Not Allowed` desde OpenClaw, no `404`.

  </Accordion>
  <Accordion title="Lista de permitidos de salida de Mattermost">
    Si el destino de la devolución de llamada utiliza direcciones privadas/tailnet/internas, configure `ServiceSettings.AllowedUntrustedInternalConnections` de Mattermost para incluir el host o dominio de devolución de llamada.

    Utilice entradas de host o dominio, no URL completas.

    - Correcto: `gateway.tailnet-name.ts.net`
    - Incorrecto: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## Variables de entorno (cuenta predeterminada)

Configure estas variables en el host del Gateway si prefiere usar variables de entorno:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
Las variables de entorno se aplican únicamente a la cuenta **predeterminada** (`default`). Las demás cuentas deben usar valores de configuración.

`MATTERMOST_URL` no se puede establecer desde un archivo `.env` del espacio de trabajo; consulte [Archivos .env del espacio de trabajo](/es/gateway/security).
</Note>

## Modos de chat

Mattermost responde automáticamente a los mensajes directos. El comportamiento de los canales se controla mediante `chatmode`:

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

- `onchar` sigue respondiendo a las menciones explícitas con @.
- `channels.mattermost.requireMention` se sigue respetando, pero se prefiere `chatmode`. La configuración `groups.<channelId>.requireMention` de cada canal prevalece sobre ambas.
- Después de que el bot envíe una respuesta visible en un hilo de canal, los mensajes posteriores de ese mismo hilo se responden sin una nueva mención con @ ni un prefijo `onchar`, por lo que las conversaciones de varios turnos en el hilo continúan sin interrupción. La participación se recuerda durante 7 días desde la última respuesta del bot en ese hilo y se conserva tras reiniciar el Gateway. Los hilos que el bot solo haya observado no se ven afectados; inicie un nuevo mensaje de nivel superior para volver a exigir una mención explícita.

## Hilos y sesiones

Utilice `channels.mattermost.replyToMode` para controlar si las respuestas de canales y grupos permanecen en el canal principal o inician un hilo bajo la publicación que las activa.

- `off` (predeterminado): solo responde en un hilo cuando la publicación entrante ya está en uno.
- `first`: para las publicaciones de nivel superior de canales o grupos, inicia un hilo bajo esa publicación y dirige la conversación a una sesión específica del hilo.
- `all` y `batched`: actualmente tienen el mismo comportamiento que `first` para Mattermost, porque una vez que Mattermost tiene una raíz de hilo, los fragmentos y archivos multimedia posteriores continúan en ese mismo hilo.
- Los mensajes directos usan de forma predeterminada `off`, incluso cuando se establece `replyToMode`.

Utilice `channels.mattermost.replyToModeByChatType` para sustituir el modo de los chats `direct`, `group` o `channel`. Establezca `direct` para habilitar los hilos en los mensajes directos:

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

- Las sesiones específicas de un hilo utilizan el identificador de la publicación activadora como raíz del hilo.
- `first` y `all` son equivalentes actualmente porque, una vez que Mattermost tiene una raíz de hilo, los fragmentos y archivos multimedia posteriores continúan en ese mismo hilo.
- Las sustituciones por tipo de chat prevalecen sobre `replyToMode`. Sin una sustitución `direct`, las implementaciones existentes mantienen los mensajes directos planos y sin hilos.

## Control de acceso (mensajes directos)

- Valor predeterminado: `channels.mattermost.dmPolicy = "pairing"` (los remitentes desconocidos reciben un código de emparejamiento). Otros valores: `allowlist`, `open`, `disabled`.
- Aprobación mediante:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- Mensajes directos públicos: `channels.mattermost.dmPolicy="open"` junto con `channels.mattermost.allowFrom=["*"]` (el esquema de configuración exige el comodín).
- `channels.mattermost.allowFrom` acepta identificadores de usuario (recomendado) y entradas `accessGroup:<name>`. Consulte [Grupos de acceso](/es/channels/access-groups).

## Canales (grupos)

- Valor predeterminado: `channels.mattermost.groupPolicy = "allowlist"` (requiere mención).
- Incluya remitentes en la lista de permitidos con `channels.mattermost.groupAllowFrom` (se recomiendan los identificadores de usuario).
- `channels.mattermost.groupAllowFrom` acepta entradas `accessGroup:<name>`. Consulte [Grupos de acceso](/es/channels/access-groups).
- Las sustituciones de menciones por canal se encuentran en `channels.mattermost.groups.<channelId>.requireMention`, o en `channels.mattermost.groups["*"].requireMention` para establecer un valor predeterminado.
- La coincidencia de `@username` es mutable y solo se habilita cuando `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Canales abiertos: `channels.mattermost.groupPolicy="open"` (requieren mención).
- Orden de resolución: `channels.mattermost.groupPolicy`, después `channels.defaults.groupPolicy` y, por último, `"allowlist"`.
- Nota sobre el entorno de ejecución: si falta por completo la sección `channels.mattermost`, el entorno de ejecución falla de forma cerrada y usa `groupPolicy="allowlist"` para las comprobaciones de grupos (incluso si se establece `channels.defaults.groupPolicy`) y registra una advertencia una sola vez.

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

## Destinos para entregas salientes

Utilice estos formatos de destino con `openclaw message send` o con cron/webhooks:

| Destino                              | Entrega en                                                       |
| ------------------------------------ | ---------------------------------------------------------------- |
| `channel:<id>`                   | Canal por identificador                                          |
| `channel:<name>` o `#channel-name` | Canal por nombre, buscado en los equipos a los que pertenece el bot |
| `user:<id>` o `mattermost:<id>` | Mensaje directo con ese usuario                                  |
| `@username`                   | Mensaje directo (nombre de usuario resuelto mediante la API de Mattermost) |

Los envíos salientes admiten como máximo un archivo adjunto por mensaje; divida varios archivos en envíos separados.

<Warning>
Los identificadores opacos sin prefijo (como `64ifufp...`) son **ambiguos** en Mattermost (identificador de usuario frente a identificador de canal).

OpenClaw los resuelve **primero como usuario**:

- Si el identificador existe como usuario (`GET /api/v4/users/<id>` tiene éxito), OpenClaw envía un **mensaje directo** resolviendo el canal directo mediante `/api/v4/channels/direct`.
- En caso contrario, el identificador se trata como un **identificador de canal**.

Si necesita un comportamiento determinista, utilice siempre los prefijos explícitos (`user:<id>` / `channel:<id>`).
</Warning>

## Reintento del canal de mensajes directos

Cuando OpenClaw envía a un destino de mensaje directo de Mattermost y primero necesita resolver el canal directo, de forma predeterminada reintenta los fallos transitorios de creación del canal directo.

Use `channels.mattermost.dmChannelRetry` para ajustar este comportamiento globalmente para el plugin de Mattermost, o `channels.mattermost.accounts.<id>.dmChannelRetry` para una cuenta. Valores predeterminados:

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
- Los reintentos usan retroceso exponencial con variación aleatoria y se aplican a fallos transitorios, como límites de frecuencia, respuestas 5xx y errores de red o de tiempo de espera.
- Los errores de cliente 4xx distintos de `429` se consideran permanentes y no se reintentan.

## Transmisión de vista previa

Mattermost transmite el razonamiento, la actividad de las herramientas y el texto parcial de la respuesta en una **publicación de vista previa en borrador** que se finaliza en el mismo lugar cuando es seguro enviar la respuesta final. En el modo `partial`, la vista previa se actualiza con el mismo identificador de publicación, en lugar de saturar el canal con mensajes por cada fragmento. En el modo `block`, la vista previa alterna entre bloques de texto completado y de actividad de las herramientas, por lo que los bloques anteriores permanecen visibles como publicaciones independientes en vez de que el siguiente los sobrescriba. Los resultados finales con contenido multimedia o errores cancelan las ediciones pendientes de la vista previa y usan la entrega normal, en lugar de publicar una vista previa desechable.

La transmisión de vista previa está **activada de forma predeterminada** en el modo `partial`. Se configura mediante `channels.mattermost.streaming.mode` (los valores escalares o booleanos heredados de `streaming` se migran mediante `openclaw doctor --fix`):

```json5
{
  channels: {
    mattermost: {
      streaming: { mode: "partial" }, // off | partial | block | progress
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Modos de transmisión">
    - `partial` (predeterminado): una publicación de vista previa que se edita a medida que aumenta la respuesta y después se finaliza con la respuesta completa.
    - `block` alterna la vista previa entre bloques de texto completado y de actividad de las herramientas, por lo que cada bloque permanece visible como una publicación independiente en vez de sobrescribirse en el mismo lugar. Las actualizaciones paralelas y consecutivas de herramientas comparten la publicación actual de actividad de las herramientas.
    - `progress` muestra una vista previa del estado durante la generación y solo publica la respuesta final al terminar.
    - `off` desactiva la transmisión de vista previa. Con `streaming.block.enabled: true`, los bloques completados del asistente se siguen entregando como respuestas de bloque normales (publicaciones separadas), en lugar de como una única publicación final combinada.

  </Accordion>
  <Accordion title="Notas sobre el comportamiento de la transmisión">
    - Si la transmisión no puede finalizarse en el mismo lugar (por ejemplo, si la publicación se eliminó durante la transmisión), OpenClaw recurre al envío de una nueva publicación final para que la respuesta nunca se pierda.
    - Las cargas que solo contienen razonamiento se omiten de las publicaciones del canal, incluido el texto que llega como una cita en bloque `> Thinking`. Establezca `/reasoning on` para ver el razonamiento en otras superficies; la publicación final de Mattermost conserva únicamente la respuesta.
    - Consulte [Transmisión](/es/concepts/streaming#preview-streaming-modes) para ver la matriz de correspondencia de canales.

  </Accordion>
</AccordionGroup>

## Reacciones (herramienta de mensajes)

- Use `message action=react` con `channel=mattermost`.
- `messageId` es el identificador de la publicación de Mattermost.
- `emoji` acepta nombres como `thumbsup` o `:+1:` (los dos puntos son opcionales).
- Establezca `remove=true` (booleano) para eliminar una reacción.
- Los eventos de adición y eliminación de reacciones se reenvían como eventos del sistema a la sesión del agente correspondiente, sujetos a las mismas comprobaciones de políticas de mensajes directos y grupos que los mensajes.

Ejemplos:

```text
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Configuración:

- `channels.mattermost.actions.reactions`: activa o desactiva las acciones de reacción (valor predeterminado: true).
- Sustitución por cuenta: `channels.mattermost.accounts.<id>.actions.reactions`.

## Botones interactivos (herramienta de mensajes)

Envíe mensajes con botones en los que se pueda hacer clic. Cuando una persona hace clic en un botón, el agente recibe la selección y puede responder.

Los botones proceden de la carga semántica `presentation` (en las respuestas normales del agente y en `message action=send`). OpenClaw representa los botones de valor como botones interactivos de Mattermost, mantiene visibles los botones de URL en el texto del mensaje y convierte los menús de selección en texto legible.

```text
message action=send channel=mattermost target=channel:<channelId> presentation={"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"yes"},{"label":"No","value":"no"}]}]}
```

Campos de los botones de presentación:

<ParamField path="label" type="string" required>
  Etiqueta mostrada (alias: `text`).
</ParamField>
<ParamField path="value" type="string">
  Valor devuelto al hacer clic, utilizado como identificador de la acción (alias: `callback_data`, `callbackData`). Es obligatorio para un botón en el que se pueda hacer clic, salvo que se establezca `url`.
</ParamField>
<ParamField path="url" type="string">
  Botón de enlace; se representa como texto `label: url` en el cuerpo del mensaje, en lugar de como un botón interactivo.
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

Cuando una persona hace clic en un botón:

<Steps>
  <Step title="Comprobación de acceso">
    Quien haga clic debe superar las mismas comprobaciones de políticas de mensajes directos y grupos que quien envía un mensaje; los clics no autorizados reciben un aviso efímero y se ignoran.
  </Step>
  <Step title="Sustitución de los botones por una confirmación">
    Todos los botones se sustituyen por una línea de confirmación (por ejemplo, "✓ **Sí** seleccionado por @user").
  </Step>
  <Step title="El agente recibe la selección">
    El agente recibe la selección como un mensaje entrante (además de un evento del sistema) y responde.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Notas de implementación">
    - Las devoluciones de llamada de los botones usan verificación HMAC-SHA256 (automática, no requiere configuración).
    - Todo el bloque de archivos adjuntos se sustituye al hacer clic, por lo que todos los botones se eliminan a la vez; no es posible eliminarlos parcialmente.
    - Los identificadores de acción que contienen guiones o guiones bajos se depuran automáticamente (limitación del enrutamiento de Mattermost).
    - Los clics cuyo `action_id` no coincide con una acción de la publicación original se rechazan con `403` ("Acción desconocida").

  </Accordion>
  <Accordion title="Configuración y accesibilidad">
    - `channels.mattermost.capabilities`: matriz de cadenas de capacidades. Añada `"inlineButtons"` para activar la descripción de la herramienta de botones en el prompt del sistema del agente.
    - `channels.mattermost.interactions.callbackBaseUrl`: URL base externa opcional para las devoluciones de llamada de los botones (por ejemplo, `https://gateway.example.com`). Úsela cuando Mattermost no pueda acceder directamente al Gateway en su host de enlace.
    - En configuraciones con varias cuentas, también se puede establecer el mismo campo en `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
    - Si se omite `interactions.callbackBaseUrl`, OpenClaw obtiene la URL de devolución de llamada a partir de `gateway.customBindHost` + `gateway.port` (valor predeterminado: 18789) y después recurre a `http://localhost:<port>`. La ruta de devolución de llamada es `/mattermost/interactions/<accountId>`.
    - Regla de accesibilidad: el servidor de Mattermost debe poder acceder a la URL de devolución de llamada del botón. `localhost` solo funciona cuando Mattermost y OpenClaw se ejecutan en el mismo espacio de nombres de host o red.
    - `channels.mattermost.interactions.allowedSourceIps`: lista de direcciones IP de origen permitidas para las devoluciones de llamada de los botones. Sin ella, solo se aceptan orígenes de bucle invertido (`127.0.0.1`, `::1`), por lo que un servidor remoto de Mattermost debe incluirse aquí en la lista de permitidos; de lo contrario, sus clics se rechazan con `403`. Si se encuentra detrás de un proxy inverso, establezca también `gateway.trustedProxies` para obtener la dirección IP real del cliente a partir de los encabezados reenviados.
    - Si el destino de la devolución de llamada es privado, pertenece a una tailnet o es interno, añada su host o dominio a `ServiceSettings.AllowedUntrustedInternalConnections` de Mattermost.

  </Accordion>
</AccordionGroup>

### Integración directa con la API (scripts externos)

Los scripts externos y Webhooks pueden publicar botones directamente mediante la API REST de Mattermost, en lugar de usar la herramienta `message` del agente. Se recomienda usar la herramienta `message` de OpenClaw. Para integraciones directas, importe `buildButtonAttachments` desde `@openclaw/mattermost/api.js`; si publica JSON sin procesar, siga estas reglas:

**Estructura de la carga:**

```json5
{
  channel_id: "<channelId>",
  message: "Choose an option:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // alphanumeric only - see below
            type: "button", // required, or clicks are silently ignored
            name: "Approve", // display label
            style: "primary", // optional: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // must match button id
                action: "approve",
                // ... any custom fields ...
                _token: "<hmac>", // see HMAC section below
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

1. Los archivos adjuntos se incluyen en `props.attachments`, no en el nivel superior `attachments` (se ignoran silenciosamente).
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
  <Step title="Obtenga el secreto a partir del token del bot">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`, codificado en hexadecimal.
  </Step>
  <Step title="Cree el objeto de contexto">
    Cree el objeto de contexto con todos los campos **excepto** `_token`.
  </Step>
  <Step title="Serialice con las claves ordenadas">
    Serialice con las **claves ordenadas recursivamente** y **sin espacios** (el Gateway también canoniza los objetos anidados y produce JSON compacto).
  </Step>
  <Step title="Firme la carga">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="Añada el token">
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
  <Accordion title="Errores comunes de HMAC">
    - El `json.dumps` de Python añade espacios de forma predeterminada (`{"key": "val"}`). Use `separators=(",", ":")` para que coincida con la salida compacta de JavaScript (`{"key":"val"}`).
    - Firme siempre **todos** los campos de contexto (excepto `_token`). El Gateway elimina `_token` y luego firma todo lo restante. Firmar un subconjunto provoca un fallo de verificación silencioso.
    - Use `sort_keys=True`: el Gateway ordena las claves antes de firmar y Mattermost puede reordenar los campos de contexto al almacenar la carga útil.
    - Derive el secreto del token del bot (de forma determinista), no de bytes aleatorios. El secreto debe ser el mismo en el proceso que crea los botones y en el Gateway que realiza la verificación.

  </Accordion>
</AccordionGroup>

## Adaptador de directorio

El plugin de Mattermost incluye un adaptador de directorio que resuelve los nombres de canales y usuarios mediante la API de Mattermost. Esto permite usar destinos `#channel-name` y `@username` en `openclaw message send` y en las entregas de Cron/Webhook.

No se necesita ninguna configuración: el adaptador usa el token del bot de la configuración de la cuenta.

## Varias cuentas

Mattermost admite varias cuentas en `channels.mattermost.accounts`:

```json5
{
  channels: {
    mattermost: {
      accounts: {
        default: { name: "Primary", botToken: "mm-token", baseUrl: "https://chat.example.com" },
        alerts: { name: "Alerts", botToken: "mm-token-2", baseUrl: "https://alerts.example.com" },
      },
    },
  },
}
```

Los valores de la cuenta prevalecen sobre los campos de nivel superior; `channels.mattermost.defaultAccount` selecciona la cuenta que se usa cuando no se especifica ninguna.

## Solución de problemas

<AccordionGroup>
  <Accordion title="No hay respuestas en los canales">
    Asegúrese de que el bot esté en el canal y menciónelo (oncall), use un prefijo de activación (onchar) o establezca `chatmode: "onmessage"`.
  </Accordion>
  <Accordion title="Errores de autenticación o de varias cuentas">
    - Compruebe el token del bot, la URL base y si la cuenta está habilitada.
    - Problemas con varias cuentas: las variables de entorno solo se aplican a la cuenta `default`.
    - Los hosts privados o de LAN de Mattermost necesitan `network.dangerouslyAllowPrivateNetwork: true` (la protección contra SSRF bloquea de forma predeterminada las IP privadas).

  </Accordion>
  <Accordion title="Fallan los comandos de barra nativos">
    - `Unauthorized: invalid command token.`: OpenClaw no aceptó el token de devolución de llamada. Causas habituales:
      - el registro del comando de barra falló o solo se completó parcialmente durante el inicio
      - la devolución de llamada llega al Gateway o a la cuenta incorrectos
      - Mattermost aún tiene comandos antiguos que apuntan a un destino de devolución de llamada anterior
      - el Gateway se reinició sin reactivar los comandos de barra
    - Si los comandos de barra nativos dejan de funcionar, busque `mattermost: failed to register slash commands` o `mattermost: native slash commands enabled but no commands could be registered` en los registros.
    - Si se omite `callbackUrl` y los registros advierten que la devolución de llamada se resolvió como una URL de bucle invertido, como `http://localhost:18789/...`, probablemente solo se pueda acceder a esa URL cuando Mattermost se ejecute en el mismo host o espacio de nombres de red que OpenClaw. En su lugar, establezca un `commands.callbackUrl` explícito al que se pueda acceder externamente.

  </Accordion>
  <Accordion title="Problemas con los botones">
    - Los botones aparecen como cuadros blancos o no aparecen: los datos del botón tienen un formato incorrecto. Cada botón de presentación necesita un `label` y un `value` (se descartan los botones a los que les falte cualquiera de ellos).
    - Los botones se muestran, pero al hacer clic no ocurre nada: compruebe que se pueda acceder al Gateway desde el servidor de Mattermost, que la IP del servidor de Mattermost esté incluida en `channels.mattermost.interactions.allowedSourceIps` (sin esta opción, solo se acepta la interfaz de bucle invertido) y que `ServiceSettings.AllowedUntrustedInternalConnections` incluya el host de devolución de llamada para destinos privados.
    - Los botones devuelven un error 404 al hacer clic: probablemente el `id` del botón contenga guiones o guiones bajos. El enrutador de acciones de Mattermost falla con los identificadores no alfanuméricos. Use solo `[a-zA-Z0-9]`.
    - El Gateway registra `rejected callback source`: el clic procedía de una IP fuera de `interactions.allowedSourceIps`. Añada el servidor de Mattermost o la entrada de red a la lista de permitidos y establezca `gateway.trustedProxies` si se encuentra detrás de un proxy inverso.
    - El Gateway registra `invalid _token`: discrepancia de HMAC. Compruebe que firme todos los campos de contexto (no un subconjunto), use claves ordenadas y JSON compacto (sin espacios). Consulte la sección sobre HMAC anterior.
    - El Gateway registra `missing _token in context`: el campo `_token` no está en el contexto del botón. Asegúrese de incluirlo al crear la carga útil de integración.
    - El Gateway rechaza el clic con `Unknown action`: `context.action_id` no coincide con ningún `id` de acción de la publicación. Establezca ambos con el mismo valor depurado.
    - El agente no ofrece botones: añada `capabilities: ["inlineButtons"]` a la configuración del canal de Mattermost.

  </Accordion>
</AccordionGroup>

## Contenido relacionado

- [Enrutamiento de canales](/es/channels/channel-routing): enrutamiento de sesiones para mensajes
- [Descripción general de los canales](/es/channels): todos los canales compatibles
- [Grupos](/es/channels/groups): comportamiento del chat grupal y control mediante menciones
- [Emparejamiento](/es/channels/pairing): autenticación de mensajes directos y flujo de emparejamiento
- [Seguridad](/es/gateway/security): modelo de acceso y protección
