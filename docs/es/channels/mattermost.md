---
read_when:
    - Configurar Mattermost
    - Depuración del enrutamiento de Mattermost
sidebarTitle: Mattermost
summary: Configuración del bot de Mattermost y configuración de OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-06-27T10:41:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31ed1c6aaffc4b7a61a06c81a516c2dba6c31ebf31e0e922bbba884f8bf2b661
    source_path: channels/mattermost.md
    workflow: 16
---

Estado: Plugin descargable (token de bot + eventos WebSocket). Se admiten canales, grupos y DMs. Mattermost es una plataforma de mensajería de equipo autohospedable; consulta el sitio oficial en [mattermost.com](https://mattermost.com) para ver detalles del producto y descargas.

## Instalación

Instala Mattermost antes de configurar el canal:

<Tabs>
  <Tab title="npm registry">
    ```bash
    openclaw plugins install @openclaw/mattermost
    ```
  </Tab>
  <Tab title="Local checkout">
    ```bash
    openclaw plugins install ./path/to/local/mattermost-plugin
    ```
  </Tab>
</Tabs>

Detalles: [Plugins](/es/tools/plugin)

## Configuración rápida

<Steps>
  <Step title="Ensure plugin is available">
    Instala `@openclaw/mattermost` con el comando anterior y luego reinicia el Gateway si ya se está ejecutando.
  </Step>
  <Step title="Create a Mattermost bot">
    Crea una cuenta de bot de Mattermost y copia el **token del bot**.
  </Step>
  <Step title="Copy the base URL">
    Copia la **URL base** de Mattermost (por ejemplo, `https://chat.example.com`).
  </Step>
  <Step title="Configure OpenClaw and start the gateway">
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

  </Step>
</Steps>

## Comandos slash nativos

Los comandos slash nativos son opcionales. Cuando están habilitados, OpenClaw registra comandos slash `oc_*` mediante la API de Mattermost y recibe POST de callback en el servidor HTTP del Gateway.

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

<AccordionGroup>
  <Accordion title="Behavior notes">
    - `native: "auto"` está deshabilitado de forma predeterminada para Mattermost. Define `native: true` para habilitarlo.
    - Si se omite `callbackUrl`, OpenClaw deriva una a partir del host/puerto del Gateway + `callbackPath`.
    - Para configuraciones con varias cuentas, `commands` se puede definir en el nivel superior o bajo `channels.mattermost.accounts.<id>.commands` (los valores de cuenta reemplazan los campos de nivel superior).
    - Los callbacks de comandos se validan con los tokens por comando devueltos por Mattermost cuando OpenClaw registra comandos `oc_*`.
    - OpenClaw actualiza el registro actual de comandos de Mattermost antes de aceptar cada callback para que los tokens obsoletos de comandos slash eliminados o regenerados dejen de aceptarse sin reiniciar el Gateway.
    - La validación de callbacks falla de forma cerrada si la API de Mattermost no puede confirmar que el comando sigue siendo actual; las validaciones fallidas se almacenan brevemente en caché, las búsquedas concurrentes se fusionan y los inicios de búsquedas nuevas se limitan por frecuencia por comando para acotar la presión de reproducción.
    - Los callbacks slash fallan de forma cerrada cuando el registro falló, el inicio fue parcial o el token del callback no coincide con el token registrado del comando resuelto (un token válido para un comando no puede llegar a la validación upstream de un comando diferente).

  </Accordion>
  <Accordion title="Reachability requirement">
    El endpoint de callback debe ser accesible desde el servidor de Mattermost.

    - No establezcas `callbackUrl` en `localhost` a menos que Mattermost se ejecute en el mismo host/espacio de nombres de red que OpenClaw.
    - No establezcas `callbackUrl` en tu URL base de Mattermost a menos que esa URL haga proxy inverso de `/api/channels/mattermost/command` hacia OpenClaw.
    - Una comprobación rápida es `curl https://<gateway-host>/api/channels/mattermost/command`; un GET debe devolver `405 Method Not Allowed` desde OpenClaw, no `404`.

  </Accordion>
  <Accordion title="Mattermost egress allowlist">
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

`MATTERMOST_URL` no se puede definir desde un `.env` de espacio de trabajo; consulta [Archivos `.env` de espacio de trabajo](/es/gateway/security).
</Note>

## Modos de chat

Mattermost responde automáticamente a los DMs. El comportamiento en canales se controla con `chatmode`:

<Tabs>
  <Tab title="oncall (default)">
    Responde solo cuando se menciona con @ en canales.
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
      oncharPrefixes: [">", "!"],
    },
  },
}
```

Notas:

- `onchar` sigue respondiendo a menciones @ explícitas.
- `channels.mattermost.requireMention` se respeta para configuraciones heredadas, pero se prefiere `chatmode`.
- Después de que el bot envía una respuesta visible en un hilo de canal, los mensajes posteriores en ese mismo hilo se responden sin una nueva mención @ ni prefijo `onchar`, para que las conversaciones de hilo de varios turnos sigan fluyendo. La participación se recuerda durante 7 días de inactividad del hilo (se actualiza con cada respuesta) y persiste entre reinicios del Gateway. Los hilos que el bot solo ha observado no se ven afectados; inicia un nuevo mensaje de nivel superior para volver a requerir una mención explícita.

## Hilos y sesiones

Usa `channels.mattermost.replyToMode` para controlar si las respuestas de canales y grupos permanecen en el canal principal o inician un hilo bajo la publicación que las activó.

- `off` (predeterminado): responde en un hilo solo cuando la publicación entrante ya está en uno.
- `first`: para publicaciones de canal/grupo de nivel superior, inicia un hilo bajo esa publicación y enruta la conversación a una sesión con alcance de hilo.
- `all`: el mismo comportamiento que `first` para Mattermost hoy.
- Los mensajes directos ignoran esta opción y permanecen sin hilos.

Ejemplo de configuración:

```json5
{
  channels: {
    mattermost: {
      replyToMode: "all",
    },
  },
}
```

Notas:

- Las sesiones con alcance de hilo usan el id de la publicación disparadora como raíz del hilo.
- `first` y `all` son actualmente equivalentes porque, una vez que Mattermost tiene una raíz de hilo, los fragmentos y medios de seguimiento continúan en ese mismo hilo.

## Control de acceso (DMs)

- Predeterminado: `channels.mattermost.dmPolicy = "pairing"` (los remitentes desconocidos reciben un código de emparejamiento).
- Aprobar mediante:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- DMs públicos: `channels.mattermost.dmPolicy="open"` más `channels.mattermost.allowFrom=["*"]`.
- `channels.mattermost.allowFrom` acepta entradas `accessGroup:<name>`. Consulta [Grupos de acceso](/es/channels/access-groups).

## Canales (grupos)

- Predeterminado: `channels.mattermost.groupPolicy = "allowlist"` (con puerta de mención).
- Permite remitentes con `channels.mattermost.groupAllowFrom` (se recomiendan IDs de usuario).
- `channels.mattermost.groupAllowFrom` acepta entradas `accessGroup:<name>`. Consulta [Grupos de acceso](/es/channels/access-groups).
- Las anulaciones de mención por canal están en `channels.mattermost.groups.<channelId>.requireMention` o `channels.mattermost.groups["*"].requireMention` para un valor predeterminado.
- La coincidencia de `@username` es mutable y solo se habilita cuando `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Canales abiertos: `channels.mattermost.groupPolicy="open"` (con puerta de mención).
- Nota de runtime: si `channels.mattermost` falta por completo, el runtime recurre a `groupPolicy="allowlist"` para comprobaciones de grupo (incluso si `channels.defaults.groupPolicy` está definido).

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

- `channel:<id>` para un canal
- `user:<id>` para un DM
- `@username` para un DM (resuelto mediante la API de Mattermost)

<Warning>
Los IDs opacos sin prefijo (como `64ifufp...`) son **ambiguos** en Mattermost (ID de usuario frente a ID de canal).

OpenClaw los resuelve **primero como usuario**:

- Si el ID existe como usuario (`GET /api/v4/users/<id>` tiene éxito), OpenClaw envía un **DM** resolviendo el canal directo mediante `/api/v4/channels/direct`.
- De lo contrario, el ID se trata como un **ID de canal**.

Si necesitas un comportamiento determinista, usa siempre los prefijos explícitos (`user:<id>` / `channel:<id>`).
</Warning>

## Reintento de canal de DM

Cuando OpenClaw envía a un destino DM de Mattermost y primero necesita resolver el canal directo, reintenta de forma predeterminada los fallos transitorios de creación del canal directo.

Usa `channels.mattermost.dmChannelRetry` para ajustar ese comportamiento globalmente para el Plugin de Mattermost, o `channels.mattermost.accounts.<id>.dmChannelRetry` para una cuenta.

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

- Esto se aplica solo a la creación de canales de DM (`/api/v4/channels/direct`), no a cada llamada a la API de Mattermost.
- Los reintentos se aplican a fallos transitorios como límites de frecuencia, respuestas 5xx y errores de red o de timeout.
- Los errores de cliente 4xx distintos de `429` se tratan como permanentes y no se reintentan.

## Streaming de vista previa

Mattermost transmite el razonamiento, la actividad de herramientas y el texto parcial de respuesta en una única **publicación de vista previa de borrador** que se finaliza en el mismo lugar cuando la respuesta final es segura para enviar. La vista previa se actualiza en el mismo id de publicación en lugar de saturar el canal con mensajes por fragmento. Los finales de medios/error cancelan las ediciones pendientes de la vista previa y usan la entrega normal en lugar de enviar una publicación de vista previa desechable.

Habilítalo mediante `channels.mattermost.streaming`:

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
  <Accordion title="Streaming modes">
    - `partial` es la opción habitual: una publicación de vista previa que se edita a medida que crece la respuesta y luego se finaliza con la respuesta completa.
    - `block` usa fragmentos de borrador de estilo anexado dentro de la publicación de vista previa.
    - `progress` muestra una vista previa de estado mientras se genera y solo publica la respuesta final al completarse.
    - `off` deshabilita el streaming de vista previa.

  </Accordion>
  <Accordion title="Streaming behavior notes">
    - Si el stream no se puede finalizar en el mismo lugar (por ejemplo, la publicación se eliminó a mitad del stream), OpenClaw recurre a enviar una nueva publicación final para que la respuesta nunca se pierda.
    - Las cargas útiles solo de razonamiento se suprimen de las publicaciones de canal, incluido el texto que llega como una cita en bloque `> Thinking`. Define `/reasoning on` para ver el razonamiento en otras superficies; la publicación final de Mattermost conserva solo la respuesta.
    - Consulta [Streaming](/es/concepts/streaming#preview-streaming-modes) para ver la matriz de mapeo de canales.

  </Accordion>
</AccordionGroup>

## Reacciones (herramienta de mensajes)

- Usa `message action=react` con `channel=mattermost`.
- `messageId` es el id de publicación de Mattermost.
- `emoji` acepta nombres como `thumbsup` o `:+1:` (los dos puntos son opcionales).
- Define `remove=true` (booleano) para eliminar una reacción.
- Los eventos de añadir/eliminar reacción se reenvían como eventos de sistema a la sesión de agente enrutada.

Ejemplos:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Configuración:

- `channels.mattermost.actions.reactions`: habilita/deshabilita acciones de reacción (predeterminado true).
- Anulación por cuenta: `channels.mattermost.accounts.<id>.actions.reactions`.

## Botones interactivos (herramienta de mensajes)

Envía mensajes con botones en los que se puede hacer clic. Cuando un usuario hace clic en un botón, el agente recibe la selección y puede responder.

Las respuestas normales del agente también pueden incluir cargas semánticas de `presentation`. OpenClaw renderiza los botones de valor como botones interactivos de Mattermost, mantiene los botones de URL visibles en el texto del mensaje y degrada los menús de selección a texto legible.

Habilita los botones agregando `inlineButtons` a las capacidades del canal:

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

Usa `message action=send` con un parámetro `buttons`. Los botones son un arreglo 2D (filas de botones):

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

Campos del botón:

<ParamField path="text" type="string" required>
  Etiqueta visible.
</ParamField>
<ParamField path="callback_data" type="string" required>
  Valor enviado de vuelta al hacer clic (usado como ID de acción).
</ParamField>
<ParamField path="style" type='"default" | "primary" | "danger"'>
  Estilo del botón.
</ParamField>

Cuando un usuario hace clic en un botón:

<Steps>
  <Step title="Botones reemplazados con confirmación">
    Todos los botones se reemplazan por una línea de confirmación (por ejemplo, "✓ **Yes** selected by @user").
  </Step>
  <Step title="El agente recibe la selección">
    El agente recibe la selección como un mensaje entrante y responde.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Notas de implementación">
    - Las devoluciones de llamada de los botones usan verificación HMAC-SHA256 (automática, sin configuración necesaria).
    - Mattermost elimina los datos de devolución de llamada de sus respuestas de API (función de seguridad), por lo que todos los botones se eliminan al hacer clic; la eliminación parcial no es posible.
    - Los ID de acción que contienen guiones o guiones bajos se saneean automáticamente (limitación de enrutamiento de Mattermost).

  </Accordion>
  <Accordion title="Configuración y alcanzabilidad">
    - `channels.mattermost.capabilities`: arreglo de cadenas de capacidades. Agrega `"inlineButtons"` para habilitar la descripción de la herramienta de botones en el prompt del sistema del agente.
    - `channels.mattermost.interactions.callbackBaseUrl`: URL base externa opcional para devoluciones de llamada de botones (por ejemplo, `https://gateway.example.com`). Úsala cuando Mattermost no pueda alcanzar el Gateway directamente en su host de enlace.
    - En configuraciones multicuenta, también puedes establecer el mismo campo en `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
    - Si se omite `interactions.callbackBaseUrl`, OpenClaw deriva la URL de devolución de llamada de `gateway.customBindHost` + `gateway.port` y luego recurre a `http://localhost:<port>`.
    - Regla de alcanzabilidad: la URL de devolución de llamada del botón debe ser alcanzable desde el servidor de Mattermost. `localhost` solo funciona cuando Mattermost y OpenClaw se ejecutan en el mismo host/espacio de nombres de red.
    - Si tu destino de devolución de llamada es privado/tailnet/interno, agrega su host/dominio a `ServiceSettings.AllowedUntrustedInternalConnections` de Mattermost.

  </Accordion>
</AccordionGroup>

### Integración directa con API (scripts externos)

Los scripts externos y los Webhooks pueden publicar botones directamente mediante la API REST de Mattermost en lugar de pasar por la herramienta `message` del agente. Usa `buildButtonAttachments()` desde el Plugin cuando sea posible; si publicas JSON sin procesar, sigue estas reglas:

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
                action_id: "mybutton01", // must match button id (for name lookup)
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
2. Cada acción necesita `type: "button"`; sin ello, los clics se descartan silenciosamente.
3. Cada acción necesita un campo `id`; Mattermost ignora las acciones sin ID.
4. El `id` de la acción debe ser **solo alfanumérico** (`[a-zA-Z0-9]`). Los guiones y guiones bajos rompen el enrutamiento de acciones del lado servidor de Mattermost (devuelve 404). Elimínalos antes de usarlo.
5. `context.action_id` debe coincidir con el `id` del botón para que el mensaje de confirmación muestre el nombre del botón (por ejemplo, "Approve") en lugar de un ID sin procesar.
6. `context.action_id` es obligatorio; el manejador de interacción devuelve 400 sin él.

</Warning>

**Generación de token HMAC**

El Gateway verifica los clics de botones con HMAC-SHA256. Los scripts externos deben generar tokens que coincidan con la lógica de verificación del Gateway:

<Steps>
  <Step title="Deriva el secreto del token del bot">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
  </Step>
  <Step title="Construye el objeto de contexto">
    Construye el objeto de contexto con todos los campos **excepto** `_token`.
  </Step>
  <Step title="Serializa con claves ordenadas">
    Serializa con **claves ordenadas** y **sin espacios** (el Gateway usa `JSON.stringify` con claves ordenadas, lo que produce una salida compacta).
  </Step>
  <Step title="Firma la carga">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="Agrega el token">
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
    - Firma siempre **todos** los campos de contexto (menos `_token`). El Gateway elimina `_token` y luego firma todo lo restante. Firmar un subconjunto causa un fallo de verificación silencioso.
    - Usa `sort_keys=True`; el Gateway ordena las claves antes de firmar, y Mattermost puede reordenar los campos de contexto al almacenar la carga.
    - Deriva el secreto del token del bot (determinista), no de bytes aleatorios. El secreto debe ser el mismo en el proceso que crea los botones y en el Gateway que los verifica.

  </Accordion>
</AccordionGroup>

## Adaptador de directorio

El Plugin de Mattermost incluye un adaptador de directorio que resuelve nombres de canales y usuarios mediante la API de Mattermost. Esto habilita destinos `#channel-name` y `@username` en `openclaw message send` y entregas de Cron/Webhook.

No se necesita configuración: el adaptador usa el token del bot de la configuración de la cuenta.

## Multicuenta

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

## Solución de problemas

<AccordionGroup>
  <Accordion title="No hay respuestas en los canales">
    Asegúrate de que el bot esté en el canal y menciónalo (oncall), usa un prefijo disparador (onchar) o establece `chatmode: "onmessage"`.
  </Accordion>
  <Accordion title="Errores de autenticación o multicuenta">
    - Revisa el token del bot, la URL base y si la cuenta está habilitada.
    - Problemas multicuenta: las variables de entorno solo se aplican a la cuenta `default`.

  </Accordion>
  <Accordion title="Los comandos slash nativos fallan">
    - `Unauthorized: invalid command token.`: OpenClaw no aceptó el token de devolución de llamada. Causas típicas:
      - el registro del comando slash falló o solo se completó parcialmente al inicio
      - la devolución de llamada está llegando al Gateway/cuenta incorrectos
      - Mattermost aún tiene comandos antiguos que apuntan a un destino de devolución de llamada anterior
      - el Gateway se reinició sin reactivar los comandos slash
    - Si los comandos slash nativos dejan de funcionar, revisa los logs para `mattermost: failed to register slash commands` o `mattermost: native slash commands enabled but no commands could be registered`.
    - Si se omite `callbackUrl` y los logs advierten que la devolución de llamada se resolvió como `http://127.0.0.1:18789/...`, esa URL probablemente solo sea alcanzable cuando Mattermost se ejecuta en el mismo host/espacio de nombres de red que OpenClaw. En su lugar, establece un `commands.callbackUrl` explícito y alcanzable externamente.

  </Accordion>
  <Accordion title="Problemas con botones">
    - Los botones aparecen como cuadros blancos: el agente puede estar enviando datos de botón mal formados. Comprueba que cada botón tenga los campos `text` y `callback_data`.
    - Los botones se renderizan, pero los clics no hacen nada: verifica que `AllowedUntrustedInternalConnections` en la configuración del servidor Mattermost incluya `127.0.0.1 localhost` y que `EnablePostActionIntegration` sea `true` en ServiceSettings.
    - Los botones devuelven 404 al hacer clic: probablemente el `id` del botón contiene guiones o guiones bajos. El enrutador de acciones de Mattermost falla con ID no alfanuméricos. Usa solo `[a-zA-Z0-9]`.
    - Los logs del Gateway muestran `invalid _token`: discrepancia HMAC. Comprueba que firmas todos los campos de contexto (no un subconjunto), usas claves ordenadas y usas JSON compacto (sin espacios). Consulta la sección HMAC anterior.
    - Los logs del Gateway muestran `missing _token in context`: el campo `_token` no está en el contexto del botón. Asegúrate de incluirlo al construir la carga de integración.
    - La confirmación muestra un ID sin procesar en lugar del nombre del botón: `context.action_id` no coincide con el `id` del botón. Establece ambos con el mismo valor saneado.
    - El agente no sabe sobre los botones: agrega `capabilities: ["inlineButtons"]` a la configuración del canal Mattermost.

  </Accordion>
</AccordionGroup>

## Relacionado

- [Enrutamiento de canales](/es/channels/channel-routing) - enrutamiento de sesión para mensajes
- [Resumen de canales](/es/channels) - todos los canales compatibles
- [Grupos](/es/channels/groups) - comportamiento de chat grupal y control de menciones
- [Emparejamiento](/es/channels/pairing) - autenticación por DM y flujo de emparejamiento
- [Seguridad](/es/gateway/security) - modelo de acceso y endurecimiento
