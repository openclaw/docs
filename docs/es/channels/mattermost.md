---
read_when:
    - Configuración de Mattermost
    - Depurar el enrutamiento de Mattermost
sidebarTitle: Mattermost
summary: Configuración del bot de Mattermost y configuración de OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-07-05T11:03:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7a1e8c4688bcddbee15d64b388b24bfb03a3890fe05f98fbb47bb904f4a0bc29
    source_path: channels/mattermost.md
    workflow: 16
---

Estado: Plugin descargable (token de bot + eventos WebSocket). Se admiten canales, canales privados, DM de grupo y DM. Mattermost es una plataforma de mensajería de equipos autoalojable ([mattermost.com](https://mattermost.com)).

## Instalación

<Tabs>
  <Tab title="registro npm">
    ```bash
    openclaw plugins install @openclaw/mattermost
    ```
  </Tab>
  <Tab title="Checkout local">
    ```bash
    openclaw plugins install ./path/to/local/mattermost-plugin
    ```
  </Tab>
</Tabs>

Detalles: [Plugins](/es/tools/plugin)

## Configuración rápida

<Steps>
  <Step title="Asegúrate de que el Plugin esté disponible">
    Instala `@openclaw/mattermost` con el comando anterior y luego reinicia el Gateway si ya está en ejecución.
  </Step>
  <Step title="Crea un bot de Mattermost">
    Crea una cuenta de bot de Mattermost, copia el **token del bot** y añade el bot a los equipos y canales que deba leer.
  </Step>
  <Step title="Copia la URL base">
    Copia la **URL base** de Mattermost (por ejemplo, `https://chat.example.com`). Un `/api/v4` final se elimina automáticamente.
  </Step>
  <Step title="Configura OpenClaw e inicia el Gateway">
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
Mattermost autoalojado en una dirección privada/LAN/tailnet: las solicitudes salientes a la API de Mattermost pasan por una protección SSRF que bloquea IP privadas e internas de forma predeterminada. Habilítalo explícitamente con `channels.mattermost.network.dangerouslyAllowPrivateNetwork: true` (por cuenta: `channels.mattermost.accounts.<id>.network.dangerouslyAllowPrivateNetwork`).
</Note>

## Comandos slash nativos

Los comandos slash nativos son opcionales. Cuando están habilitados, OpenClaw registra comandos slash `oc_*` en cada equipo del que el bot es miembro y recibe POST de callback en el servidor HTTP del Gateway.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Use when Mattermost cannot reach the gateway directly (reverse proxy/public URL).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

Comandos registrados: `/oc_status`, `/oc_model`, `/oc_models`, `/oc_new`, `/oc_help`, `/oc_think`, `/oc_reasoning`, `/oc_verbose`, `/oc_queue`. Con `nativeSkills: true`, los comandos de Skills también se registran como `/oc_<skill>`.

<AccordionGroup>
  <Accordion title="Notas de comportamiento">
    - `native` y `nativeSkills` tienen el valor predeterminado `"auto"`, que se resuelve como deshabilitado para Mattermost. Configúralos explícitamente como `true`.
    - `callbackPath` tiene el valor predeterminado `/api/channels/mattermost/command`.
    - Si se omite `callbackUrl`, OpenClaw deriva `http://<gateway.customBindHost or localhost>:<gateway.port, default 18789><callbackPath>`. Los hosts de vinculación comodín (`0.0.0.0`, `::`) recurren a `localhost`.
    - Para configuraciones de varias cuentas, `commands` se puede definir en el nivel superior o bajo `channels.mattermost.accounts.<id>.commands` (los valores de cuenta sobrescriben los campos de nivel superior).
    - Los comandos slash existentes con el mismo disparador creados por otras integraciones se dejan intactos (el registro los omite); los comandos creados por el bot se actualizan o recrean cuando la URL de callback deriva.
    - Los callbacks de comandos se validan con los tokens por comando devueltos por Mattermost cuando OpenClaw registra comandos `oc_*`.
    - OpenClaw actualiza el registro actual de comandos de Mattermost antes de aceptar cada callback, por lo que los tokens obsoletos de comandos slash eliminados o regenerados dejan de aceptarse sin reiniciar el Gateway.
    - La validación de callback falla cerrada si la API de Mattermost no puede confirmar que el comando sigue vigente; las validaciones fallidas se almacenan brevemente en caché, las búsquedas concurrentes se fusionan y los inicios de búsquedas nuevas se limitan por frecuencia por comando para acotar la presión de reproducción.
    - Los callbacks slash fallan cerrados cuando el registro falló, el inicio fue parcial o el token de callback no coincide con el token registrado del comando resuelto (un token válido para un comando no puede alcanzar la validación upstream para otro comando).
    - Los callbacks aceptados se confirman con una respuesta efímera "Processing..."; la respuesta real llega como un mensaje normal.

  </Accordion>
  <Accordion title="Requisito de accesibilidad">
    El endpoint de callback debe ser accesible desde el servidor Mattermost.

    - No configures `callbackUrl` como `localhost` a menos que Mattermost se ejecute en el mismo host/espacio de nombres de red que OpenClaw.
    - No configures `callbackUrl` como tu URL base de Mattermost a menos que esa URL haga reverse proxy de `/api/channels/mattermost/command` hacia OpenClaw.
    - Una comprobación rápida es `curl https://<gateway-host>/api/channels/mattermost/command`; un GET debería devolver `405 Method Not Allowed` desde OpenClaw, no `404`.

  </Accordion>
  <Accordion title="Lista de permitidos de salida de Mattermost">
    Si tu callback apunta a direcciones privadas/tailnet/internas, configura `ServiceSettings.AllowedUntrustedInternalConnections` de Mattermost para incluir el host/dominio del callback.

    Usa entradas de host/dominio, no URL completas.

    - Correcto: `gateway.tailnet-name.ts.net`
    - Incorrecto: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## Variables de entorno (cuenta predeterminada)

Configúralas en el host del Gateway si prefieres variables de entorno:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
Las variables de entorno se aplican solo a la cuenta **predeterminada** (`default`). Otras cuentas deben usar valores de configuración.

`MATTERMOST_URL` no se puede definir desde un `.env` del workspace; consulta [Archivos .env de workspace](/es/gateway/security).
</Note>

## Modos de chat

Mattermost responde automáticamente a los DM. El comportamiento en canales se controla con `chatmode`:

<Tabs>
  <Tab title="oncall (predeterminado)">
    Responde solo cuando se le @menciona en canales.
  </Tab>
  <Tab title="onmessage">
    Responde a cada mensaje de canal.
  </Tab>
  <Tab title="onchar">
    Responde cuando un mensaje empieza con un prefijo disparador.
  </Tab>
</Tabs>

Ejemplo de configuración:

```json5
{
  channels: {
    mattermost: {
      chatmode: "onchar",
      oncharPrefixes: [">", "!"], // default
    },
  },
}
```

Notas:

- `onchar` sigue respondiendo a @menciones explícitas.
- `channels.mattermost.requireMention` se sigue respetando, pero se prefiere `chatmode`. Las opciones por canal `groups.<channelId>.requireMention` prevalecen sobre ambas.
- Después de que el bot envía una respuesta visible en un hilo de canal, los mensajes posteriores en ese mismo hilo se responden sin una nueva @mención ni prefijo `onchar`, por lo que las conversaciones de hilo de varios turnos siguen fluyendo. La participación se recuerda durante 7 días después de la última respuesta del bot en ese hilo y persiste entre reinicios del Gateway. Los hilos que el bot solo ha observado no se ven afectados; inicia un nuevo mensaje de nivel superior para exigir de nuevo una mención explícita.

## Hilos y sesiones

Usa `channels.mattermost.replyToMode` para controlar si las respuestas de canales y grupos permanecen en el canal principal o inician un hilo bajo la publicación disparadora.

- `off` (predeterminado): solo responde en un hilo cuando la publicación entrante ya está en uno.
- `first`: para publicaciones de canal/grupo de nivel superior, inicia un hilo bajo esa publicación y enruta la conversación a una sesión con alcance de hilo.
- `all` y `batched`: el mismo comportamiento que `first` para Mattermost hoy, porque una vez que Mattermost tiene una raíz de hilo, los fragmentos y medios posteriores continúan en ese mismo hilo.
- Los mensajes directos ignoran esta opción y permanecen sin hilos.

```json5
{
  channels: {
    mattermost: {
      replyToMode: "all",
    },
  },
}
```

Las sesiones con alcance de hilo usan el id de la publicación disparadora como raíz del hilo.

## Control de acceso (DM)

- Predeterminado: `channels.mattermost.dmPolicy = "pairing"` (los remitentes desconocidos reciben un código de vinculación). Otros valores: `allowlist`, `open`, `disabled`.
- Aprueba con:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- DM públicos: `channels.mattermost.dmPolicy="open"` más `channels.mattermost.allowFrom=["*"]` (el esquema de configuración exige el comodín).
- `channels.mattermost.allowFrom` acepta ids de usuario (recomendado) y entradas `accessGroup:<name>`. Consulta [Grupos de acceso](/es/channels/access-groups).

## Canales (grupos)

- Predeterminado: `channels.mattermost.groupPolicy = "allowlist"` (restringido por mención).
- Permite remitentes con `channels.mattermost.groupAllowFrom` (se recomiendan IDs de usuario).
- `channels.mattermost.groupAllowFrom` acepta entradas `accessGroup:<name>`. Consulta [Grupos de acceso](/es/channels/access-groups).
- Las sobrescrituras de mención por canal viven bajo `channels.mattermost.groups.<channelId>.requireMention` o `channels.mattermost.groups["*"].requireMention` para un valor predeterminado.
- La coincidencia de `@username` es mutable y solo está habilitada cuando `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Canales abiertos: `channels.mattermost.groupPolicy="open"` (restringido por mención).
- Orden de resolución: `channels.mattermost.groupPolicy`, luego `channels.defaults.groupPolicy`, luego `"allowlist"`.
- Nota de runtime: si falta por completo la sección `channels.mattermost`, el runtime falla cerrado a `groupPolicy="allowlist"` para comprobaciones de grupo (incluso si `channels.defaults.groupPolicy` está definido) y registra una advertencia única.

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

## Destinos para entrega saliente

Usa estos formatos de destino con `openclaw message send` o cron/webhooks:

| Destino                             | Entrega a                                                       |
| ----------------------------------- | --------------------------------------------------------------- |
| `channel:<id>`                      | Canal por id                                                    |
| `channel:<name>` o `#channel-name`  | Canal por nombre, buscado entre los equipos a los que pertenece el bot |
| `user:<id>` o `mattermost:<id>`     | DM con ese usuario                                              |
| `@username`                         | DM (nombre de usuario resuelto mediante la API de Mattermost)   |

Los envíos salientes admiten como máximo un adjunto por mensaje; divide varios archivos en envíos separados.

<Warning>
Los IDs opacos sin prefijo (como `64ifufp...`) son **ambiguos** en Mattermost (ID de usuario frente a ID de canal).

OpenClaw los resuelve **primero como usuario**:

- Si el ID existe como usuario (`GET /api/v4/users/<id>` funciona), OpenClaw envía un **DM** resolviendo el canal directo mediante `/api/v4/channels/direct`.
- De lo contrario, el ID se trata como un **ID de canal**.

Si necesitas un comportamiento determinista, usa siempre los prefijos explícitos (`user:<id>` / `channel:<id>`).
</Warning>

## Reintento de canal de DM

Cuando OpenClaw envía a un destino de DM de Mattermost y necesita resolver primero el canal directo, reintenta de forma predeterminada los fallos transitorios de creación de canal directo.

Usa `channels.mattermost.dmChannelRetry` para ajustar ese comportamiento globalmente para el Plugin de Mattermost, o `channels.mattermost.accounts.<id>.dmChannelRetry` para una cuenta. Valores predeterminados:

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

- Esto se aplica solo a la creación de canal de DM (`/api/v4/channels/direct`), no a cada llamada a la API de Mattermost.
- Los reintentos usan backoff exponencial con jitter y se aplican a fallos transitorios como límites de frecuencia, respuestas 5xx y errores de red o timeout.
- Los errores de cliente 4xx distintos de `429` se tratan como permanentes y no se reintentan.

## Streaming de vista previa

Mattermost transmite el razonamiento, la actividad de herramientas y el texto parcial de respuesta en una única **publicación de vista previa de borrador** que se finaliza en el mismo lugar cuando la respuesta final es segura para enviarse. La vista previa se actualiza en el mismo id de publicación en lugar de saturar el canal con mensajes por fragmento. Las respuestas finales de medios/errores cancelan las ediciones pendientes de la vista previa y usan la entrega normal en lugar de vaciar una publicación de vista previa descartable.

La transmisión de vista previa está **activada de forma predeterminada** en modo `partial`. Configúrala mediante `channels.mattermost.streaming` (una cadena de modo, un booleano o un objeto como `{ mode: "progress" }`):

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
    - `partial` (predeterminado): una publicación de vista previa que se edita a medida que crece la respuesta y luego se finaliza con la respuesta completa.
    - `block` usa fragmentos de borrador de estilo anexado dentro de la publicación de vista previa.
    - `progress` muestra una vista previa de estado mientras se genera y solo publica la respuesta final al completarse.
    - `off` desactiva la transmisión de vista previa.

  </Accordion>
  <Accordion title="Notas sobre el comportamiento de transmisión">
    - Si la transmisión no se puede finalizar en el mismo lugar (por ejemplo, si la publicación se eliminó a mitad de transmisión), OpenClaw vuelve a enviar una publicación final nueva para que la respuesta nunca se pierda.
    - Las cargas útiles solo de razonamiento se suprimen de las publicaciones del canal, incluido el texto que llega como una cita en bloque `> Thinking`. Configura `/reasoning on` para ver el razonamiento en otras superficies; la publicación final de Mattermost conserva solo la respuesta.
    - Consulta [Transmisión](/es/concepts/streaming#preview-streaming-modes) para ver la matriz de asignación de canales.

  </Accordion>
</AccordionGroup>

## Reacciones (herramienta de mensajes)

- Usa `message action=react` con `channel=mattermost`.
- `messageId` es el id de publicación de Mattermost.
- `emoji` acepta nombres como `thumbsup` o `:+1:` (los dos puntos son opcionales).
- Configura `remove=true` (booleano) para eliminar una reacción.
- Los eventos de agregar/eliminar reacción se reenvían como eventos del sistema a la sesión de agente enrutada, sujetos a las mismas comprobaciones de política de DM/grupo que los mensajes.

Ejemplos:

```text
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Configuración:

- `channels.mattermost.actions.reactions`: activa/desactiva acciones de reacción (predeterminado true).
- Anulación por cuenta: `channels.mattermost.accounts.<id>.actions.reactions`.

## Botones interactivos (herramienta de mensajes)

Envía mensajes con botones clicables. Cuando un usuario hace clic en un botón, el agente recibe la selección y puede responder.

Los botones provienen de la carga útil semántica `presentation` (en respuestas normales del agente y en `message action=send`). OpenClaw renderiza los botones de valor como botones interactivos de Mattermost, mantiene visibles los botones de URL en el texto del mensaje y degrada los menús de selección a texto legible.

```text
message action=send channel=mattermost target=channel:<channelId> presentation={"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"yes"},{"label":"No","value":"no"}]}]}
```

Campos de botones de presentación:

<ParamField path="label" type="string" required>
  Etiqueta visible (alias: `text`).
</ParamField>
<ParamField path="value" type="string">
  Valor enviado de vuelta al hacer clic, usado como ID de acción (alias: `callback_data`, `callbackData`). Obligatorio para un botón clicable salvo que `url` esté configurado.
</ParamField>
<ParamField path="url" type="string">
  Botón de enlace; se renderiza como texto `label: url` en el cuerpo del mensaje en lugar de como botón interactivo.
</ParamField>
<ParamField path="style" type='"primary" | "secondary" | "success" | "danger"'>
  Estilo del botón. Mattermost aplica el estilo predeterminado a los valores que no admite.
</ParamField>

Para anunciar la compatibilidad con botones en el prompt del sistema del agente, agrega `inlineButtons` a las capacidades del canal:

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
    Quien hace clic debe pasar las mismas comprobaciones de política de DM/grupo que quien envía un mensaje; los clics no autorizados reciben un aviso efímero y se ignoran.
  </Step>
  <Step title="Botones reemplazados por confirmación">
    Todos los botones se reemplazan por una línea de confirmación (por ejemplo, "✓ **Yes** selected by @user").
  </Step>
  <Step title="El agente recibe la selección">
    El agente recibe la selección como mensaje entrante (más un evento del sistema) y responde.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Notas de implementación">
    - Las devoluciones de llamada de botones usan verificación HMAC-SHA256 (automática, sin configuración necesaria).
    - Todo el bloque de adjunto se reemplaza al hacer clic, por lo que todos los botones se eliminan juntos; no es posible la eliminación parcial.
    - Los ID de acción que contienen guiones o guiones bajos se sanea automáticamente (limitación de enrutamiento de Mattermost).
    - Los clics cuyo `action_id` no coincide con una acción de la publicación original se rechazan con `403` ("Unknown action").

  </Accordion>
  <Accordion title="Configuración y accesibilidad">
    - `channels.mattermost.capabilities`: arreglo de cadenas de capacidad. Agrega `"inlineButtons"` para activar la descripción de la herramienta de botones en el prompt del sistema del agente.
    - `channels.mattermost.interactions.callbackBaseUrl`: URL base externa opcional para devoluciones de llamada de botones (por ejemplo, `https://gateway.example.com`). Úsala cuando Mattermost no pueda alcanzar el Gateway directamente en su host de enlace.
    - En configuraciones con varias cuentas, también puedes establecer el mismo campo en `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
    - Si se omite `interactions.callbackBaseUrl`, OpenClaw deriva la URL de devolución de llamada de `gateway.customBindHost` + `gateway.port` (predeterminado 18789) y luego recurre a `http://localhost:<port>`. La ruta de devolución de llamada es `/mattermost/interactions/<accountId>`.
    - Regla de accesibilidad: la URL de devolución de llamada del botón debe ser accesible desde el servidor Mattermost. `localhost` solo funciona cuando Mattermost y OpenClaw se ejecutan en el mismo host/espacio de nombres de red.
    - `channels.mattermost.interactions.allowedSourceIps`: lista de IP de origen permitidas para devoluciones de llamada de botones. Sin ella, solo se aceptan orígenes de loopback (`127.0.0.1`, `::1`), por lo que un servidor Mattermost remoto debe estar permitido aquí o sus clics se rechazan con `403`. Detrás de un proxy inverso, configura también `gateway.trustedProxies` para que la IP real del cliente se derive de los encabezados reenviados.
    - Si tu destino de devolución de llamada es privado/tailnet/interno, agrega su host/dominio a `ServiceSettings.AllowedUntrustedInternalConnections` de Mattermost.

  </Accordion>
</AccordionGroup>

### Integración directa con API (scripts externos)

Los scripts externos y webhooks pueden publicar botones directamente mediante la API REST de Mattermost en lugar de pasar por la herramienta `message` del agente. Usa `buildButtonAttachments()` del plugin cuando sea posible; si publicas JSON sin procesar, sigue estas reglas:

**Estructura de la carga útil:**

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

1. Los adjuntos van en `props.attachments`, no en `attachments` de nivel superior (se ignoran silenciosamente).
2. Cada acción necesita `type: "button"`; sin él, los clics se descartan silenciosamente.
3. Cada acción necesita un campo `id`; Mattermost ignora acciones sin ID.
4. El `id` de acción debe ser **solo alfanumérico** (`[a-zA-Z0-9]`). Los guiones y guiones bajos rompen el enrutamiento de acciones del lado del servidor de Mattermost (devuelve 404). Elimínalos antes de usarlo.
5. `context.action_id` debe coincidir con el `id` del botón; el gateway rechaza clics cuyo `action_id` no existe en la publicación.
6. `context.action_id` es obligatorio; el manejador de interacción devuelve 400 sin él.
7. La IP de origen de la devolución de llamada debe estar permitida (consulta `interactions.allowedSourceIps` arriba).

</Warning>

**Generación de token HMAC**

El gateway verifica los clics en botones con HMAC-SHA256. Los scripts externos deben generar tokens que coincidan con la lógica de verificación del gateway:

<Steps>
  <Step title="Derivar el secreto del token del bot">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`, codificado en hexadecimal.
  </Step>
  <Step title="Construir el objeto de contexto">
    Construye el objeto de contexto con todos los campos **excepto** `_token`.
  </Step>
  <Step title="Serializar con claves ordenadas">
    Serializa con **claves ordenadas recursivamente** y **sin espacios** (el gateway también canonicaliza objetos anidados y produce JSON compacto).
  </Step>
  <Step title="Firmar la carga útil">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="Agregar el token">
    Agrega el resumen hexadecimal resultante como `_token` en el contexto.
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
  <Accordion title="Problemas comunes con HMAC">
    - `json.dumps` de Python agrega espacios de forma predeterminada (`{"key": "val"}`). Usa `separators=(",", ":")` para coincidir con la salida compacta de JavaScript (`{"key":"val"}`).
    - Firma siempre **todos** los campos de contexto (menos `_token`). El gateway elimina `_token` y luego firma todo lo restante. Firmar un subconjunto causa un fallo de verificación silencioso.
    - Usa `sort_keys=True`; el gateway ordena las claves antes de firmar y Mattermost puede reordenar los campos de contexto al almacenar la carga útil.
    - Deriva el secreto del token del bot (determinista), no de bytes aleatorios. El secreto debe ser el mismo en el proceso que crea los botones y en el gateway que verifica.

  </Accordion>
</AccordionGroup>

## Adaptador de directorio

El plugin de Mattermost incluye un adaptador de directorio que resuelve nombres de canales y usuarios mediante la API de Mattermost. Esto habilita destinos `#channel-name` y `@username` en `openclaw message send` y entregas de cron/webhook.

No se necesita configuración; el adaptador usa el token del bot de la configuración de la cuenta.

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

Los valores de cuenta anulan los campos de nivel superior; `channels.mattermost.defaultAccount` elige qué cuenta se usa cuando no se especifica ninguna.

## Solución de problemas

<AccordionGroup>
  <Accordion title="No hay respuestas en canales">
    Asegúrate de que el bot esté en el canal y menciónalo (oncall), usa un prefijo disparador (onchar) o configura `chatmode: "onmessage"`.
  </Accordion>
  <Accordion title="Errores de autenticación o de varias cuentas">
    - Comprueba el token del bot, la URL base y si la cuenta está activada.
    - Problemas de varias cuentas: las variables de entorno solo se aplican a la cuenta `default`.
    - Los hosts privados/LAN de Mattermost necesitan `network.dangerouslyAllowPrivateNetwork: true` (la protección SSRF bloquea las IP privadas de forma predeterminada).

  </Accordion>
  <Accordion title="Los comandos slash nativos fallan">
    - `Unauthorized: invalid command token.`: OpenClaw no aceptó el token de callback. Causas típicas:
      - el registro del comando slash falló o solo se completó parcialmente al inicio
      - el callback está llegando al gateway o la cuenta equivocados
      - Mattermost todavía tiene comandos antiguos que apuntan a un destino de callback anterior
      - el gateway se reinició sin reactivar los comandos slash
    - Si los comandos slash nativos dejan de funcionar, revisa los registros para `mattermost: failed to register slash commands` o `mattermost: native slash commands enabled but no commands could be registered`.
    - Si se omite `callbackUrl` y los registros advierten que el callback se resolvió a una URL de loopback como `http://localhost:18789/...`, probablemente esa URL solo sea accesible cuando Mattermost se ejecuta en el mismo host/espacio de nombres de red que OpenClaw. En su lugar, define explícitamente `commands.callbackUrl` como una URL accesible externamente.

  </Accordion>
  <Accordion title="Problemas con botones">
    - Los botones aparecen como cuadros blancos o no aparecen: los datos del botón están mal formados. Cada botón de presentación necesita un `label` y un `value` (los botones a los que les falte cualquiera de los dos se descartan).
    - Los botones se renderizan, pero los clics no hacen nada: verifica que se pueda acceder al gateway desde el servidor Mattermost, que la IP del servidor Mattermost esté incluida en `channels.mattermost.interactions.allowedSourceIps` (sin ello, solo se acepta loopback) y que `ServiceSettings.AllowedUntrustedInternalConnections` incluya el host de callback para destinos privados.
    - Los botones devuelven 404 al hacer clic: es probable que el `id` del botón contenga guiones o guiones bajos. El enrutador de acciones de Mattermost falla con ID no alfanuméricos. Usa solo `[a-zA-Z0-9]`.
    - Los registros del Gateway muestran `rejected callback source`: el clic provino de una IP fuera de `interactions.allowedSourceIps`. Agrega a la lista de permitidos el servidor Mattermost o tu entrada, y configura `gateway.trustedProxies` detrás de un proxy inverso.
    - Los registros del Gateway muestran `invalid _token`: discrepancia de HMAC. Comprueba que firmes todos los campos de contexto (no un subconjunto), que uses claves ordenadas y JSON compacto (sin espacios). Consulta la sección de HMAC anterior.
    - Los registros del Gateway muestran `missing _token in context`: el campo `_token` no está en el contexto del botón. Asegúrate de incluirlo al construir la carga útil de integración.
    - El Gateway rechaza el clic con `Unknown action`: `context.action_id` no coincide con ningún `id` de acción en la publicación. Configura ambos con el mismo valor saneado.
    - El agente no ofrece botones: añade `capabilities: ["inlineButtons"]` a la configuración del canal Mattermost.

  </Accordion>
</AccordionGroup>

## Relacionado

- [Enrutamiento de canales](/es/channels/channel-routing) - enrutamiento de sesiones para mensajes
- [Resumen de canales](/es/channels) - todos los canales admitidos
- [Grupos](/es/channels/groups) - comportamiento del chat grupal y control de menciones
- [Emparejamiento](/es/channels/pairing) - autenticación por DM y flujo de emparejamiento
- [Seguridad](/es/gateway/security) - modelo de acceso y endurecimiento
