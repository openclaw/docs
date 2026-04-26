---
read_when:
    - Configurar Mattermost
    - Depurar el enrutamiento de Mattermost
sidebarTitle: Mattermost
summary: Configuración del bot de Mattermost y configuración de OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-04-26T11:23:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 22916fcff2eeccf53055f2ebf60fc621d595991d0ca4cd148015b61cce09c52f
    source_path: channels/mattermost.md
    workflow: 15
---

Estado: Plugin incluido (token de bot + eventos WebSocket). Se admiten canales, grupos y DMs. Mattermost es una plataforma de mensajería para equipos autohospedable; consulta el sitio oficial en [mattermost.com](https://mattermost.com) para obtener detalles del producto y descargas.

## Plugin incluido

<Note>
Mattermost se incluye como Plugin incluido en las versiones actuales de OpenClaw, por lo que las compilaciones empaquetadas normales no necesitan una instalación aparte.
</Note>

Si usas una compilación antigua o una instalación personalizada que excluye Mattermost, instálalo manualmente:

<Tabs>
  <Tab title="registro npm">
    ```bash
    openclaw plugins install @openclaw/mattermost
    ```
  </Tab>
  <Tab title="copia local">
    ```bash
    openclaw plugins install ./path/to/local/mattermost-plugin
    ```
  </Tab>
</Tabs>

Detalles: [Plugins](/es/tools/plugin)

## Configuración rápida

<Steps>
  <Step title="Asegúrate de que el Plugin esté disponible">
    Las versiones empaquetadas actuales de OpenClaw ya lo incluyen. Las instalaciones antiguas o personalizadas pueden añadirlo manualmente con los comandos anteriores.
  </Step>
  <Step title="Crea un bot de Mattermost">
    Crea una cuenta de bot de Mattermost y copia el **token del bot**.
  </Step>
  <Step title="Copia la URL base">
    Copia la **URL base** de Mattermost (p. ej., `https://chat.example.com`).
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

  </Step>
</Steps>

## Comandos slash nativos

Los comandos slash nativos son de activación opcional. Cuando se habilitan, OpenClaw registra comandos slash `oc_*` mediante la API de Mattermost y recibe callbacks POST en el servidor HTTP del Gateway.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Úsalo cuando Mattermost no pueda alcanzar el Gateway directamente (proxy inverso/URL pública).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Notas de comportamiento">
    - `native: "auto"` está deshabilitado de forma predeterminada para Mattermost. Establece `native: true` para habilitarlo.
    - Si se omite `callbackUrl`, OpenClaw deriva una a partir del host/puerto del Gateway + `callbackPath`.
    - Para configuraciones con varias cuentas, `commands` puede establecerse en el nivel superior o en `channels.mattermost.accounts.<id>.commands` (los valores de la cuenta sustituyen los campos de nivel superior).
    - Los callbacks de comandos se validan con los tokens por comando que Mattermost devuelve cuando OpenClaw registra comandos `oc_*`.
    - Los callbacks slash fallan de forma cerrada cuando el registro falló, el inicio fue parcial o el token del callback no coincide con uno de los comandos registrados.
  </Accordion>
  <Accordion title="Requisito de accesibilidad">
    El endpoint de callback debe ser accesible desde el servidor de Mattermost.

    - No establezcas `callbackUrl` en `localhost` a menos que Mattermost se ejecute en el mismo host o espacio de nombres de red que OpenClaw.
    - No establezcas `callbackUrl` en la URL base de tu Mattermost a menos que esa URL haga proxy inverso de `/api/channels/mattermost/command` hacia OpenClaw.
    - Una comprobación rápida es `curl https://<gateway-host>/api/channels/mattermost/command`; una solicitud GET debería devolver `405 Method Not Allowed` desde OpenClaw, no `404`.

  </Accordion>
  <Accordion title="Lista de permitidos de salida de Mattermost">
    Si tu callback apunta a direcciones privadas, de tailnet o internas, configura `ServiceSettings.AllowedUntrustedInternalConnections` de Mattermost para que incluya el host/dominio del callback.

    Usa entradas de host/dominio, no URLs completas.

    - Bien: `gateway.tailnet-name.ts.net`
    - Mal: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## Variables de entorno (cuenta predeterminada)

Configúralas en el host del Gateway si prefieres variables de entorno:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
Las variables de entorno se aplican solo a la cuenta **predeterminada** (`default`). Otras cuentas deben usar valores de configuración.

`MATTERMOST_URL` no puede establecerse desde un `.env` del workspace; consulta [archivos `.env` del workspace](/es/gateway/security).
</Note>

## Modos de chat

Mattermost responde automáticamente a los DMs. El comportamiento en canales está controlado por `chatmode`:

<Tabs>
  <Tab title="oncall (predeterminado)">
    Responde solo cuando recibe una @mención en canales.
  </Tab>
  <Tab title="onmessage">
    Responde a cada mensaje del canal.
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

- `onchar` sigue respondiendo a @menciones explícitas.
- `channels.mattermost.requireMention` se respeta para configuraciones heredadas, pero se prefiere `chatmode`.

## Hilos y sesiones

Usa `channels.mattermost.replyToMode` para controlar si las respuestas en canales y grupos se mantienen en el canal principal o inician un hilo bajo la publicación que las activó.

- `off` (predeterminado): solo responde en un hilo cuando la publicación entrante ya está en uno.
- `first`: para publicaciones de nivel superior en canal/grupo, inicia un hilo bajo esa publicación y enruta la conversación a una sesión con alcance de hilo.
- `all`: hoy en Mattermost tiene el mismo comportamiento que `first`.
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
- `first` y `all` son actualmente equivalentes porque, una vez que Mattermost tiene una raíz de hilo, los fragmentos y medios posteriores continúan en ese mismo hilo.

## Control de acceso (DMs)

- Predeterminado: `channels.mattermost.dmPolicy = "pairing"` (los remitentes desconocidos reciben un código de emparejamiento).
- Aprobar mediante:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- DMs públicos: `channels.mattermost.dmPolicy="open"` más `channels.mattermost.allowFrom=["*"]`.

## Canales (grupos)

- Predeterminado: `channels.mattermost.groupPolicy = "allowlist"` (controlado por mención).
- Incluye remitentes en la lista de permitidos con `channels.mattermost.groupAllowFrom` (se recomiendan IDs de usuario).
- Las sustituciones de mención por canal están en `channels.mattermost.groups.<channelId>.requireMention` o `channels.mattermost.groups["*"].requireMention` para un valor predeterminado.
- La coincidencia `@username` es mutable y solo está habilitada cuando `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Canales abiertos: `channels.mattermost.groupPolicy="open"` (controlado por mención).
- Nota de ejecución: si `channels.mattermost` falta por completo, la ejecución vuelve a `groupPolicy="allowlist"` para comprobaciones de grupo (incluso si `channels.defaults.groupPolicy` está establecido).

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

Usa estos formatos de destino con `openclaw message send` o con Cron/Webhooks:

- `channel:<id>` para un canal
- `user:<id>` para un DM
- `@username` para un DM (resuelto mediante la API de Mattermost)

<Warning>
Los IDs opacos sin prefijo (como `64ifufp...`) son **ambiguos** en Mattermost (ID de usuario frente a ID de canal).

OpenClaw los resuelve **primero como usuario**:

- Si el ID existe como usuario (`GET /api/v4/users/<id>` tiene éxito), OpenClaw envía un **DM** resolviendo el canal directo mediante `/api/v4/channels/direct`.
- En caso contrario, el ID se trata como un **ID de canal**.

Si necesitas un comportamiento determinista, usa siempre los prefijos explícitos (`user:<id>` / `channel:<id>`).
</Warning>

## Reintento de canal DM

Cuando OpenClaw envía a un destino DM de Mattermost y primero necesita resolver el canal directo, reintenta por defecto los fallos transitorios de creación del canal directo.

Usa `channels.mattermost.dmChannelRetry` para ajustar globalmente ese comportamiento para el Plugin de Mattermost, o `channels.mattermost.accounts.<id>.dmChannelRetry` para una cuenta concreta.

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

- Esto se aplica solo a la creación de canales DM (`/api/v4/channels/direct`), no a todas las llamadas a la API de Mattermost.
- Los reintentos se aplican a fallos transitorios como límites de tasa, respuestas 5xx y errores de red o de tiempo de espera.
- Los errores de cliente 4xx distintos de `429` se tratan como permanentes y no se reintentan.

## Streaming de vista previa

Mattermost transmite el razonamiento, la actividad de herramientas y el texto parcial de respuesta en una sola **publicación de vista previa de borrador** que se finaliza en su lugar cuando la respuesta final es segura para enviarse. La vista previa se actualiza en el mismo id de publicación en lugar de saturar el canal con mensajes por fragmento. Los finales con medios o error cancelan las ediciones pendientes de la vista previa y usan la entrega normal en lugar de vaciar una publicación de vista previa desechable.

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
  <Accordion title="Modos de streaming">
    - `partial` es la opción habitual: una publicación de vista previa que se edita a medida que crece la respuesta y luego se finaliza con la respuesta completa.
    - `block` usa fragmentos de borrador de estilo añadido dentro de la publicación de vista previa.
    - `progress` muestra una vista previa de estado mientras genera y solo publica la respuesta final al completarse.
    - `off` deshabilita el streaming de vista previa.
  </Accordion>
  <Accordion title="Notas de comportamiento del streaming">
    - Si el stream no puede finalizarse en su lugar (por ejemplo, si la publicación se eliminó a mitad del stream), OpenClaw recurre a enviar una nueva publicación final para que la respuesta nunca se pierda.
    - Las cargas solo de razonamiento se suprimen de las publicaciones del canal, incluido el texto que llega como cita en bloque `> Reasoning:`. Establece `/reasoning on` para ver el razonamiento en otras superficies; la publicación final de Mattermost mantiene solo la respuesta.
    - Consulta [Streaming](/es/concepts/streaming#preview-streaming-modes) para la matriz de mapeo de canales.
  </Accordion>
</AccordionGroup>

## Reacciones (herramienta de mensajes)

- Usa `message action=react` con `channel=mattermost`.
- `messageId` es el id de la publicación de Mattermost.
- `emoji` acepta nombres como `thumbsup` o `:+1:` (los dos puntos son opcionales).
- Establece `remove=true` (booleano) para eliminar una reacción.
- Los eventos de añadir/eliminar reacción se reenvían como eventos del sistema a la sesión del agente enrutada.

Ejemplos:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Configuración:

- `channels.mattermost.actions.reactions`: habilita/deshabilita acciones de reacción (predeterminado: true).
- Sustitución por cuenta: `channels.mattermost.accounts.<id>.actions.reactions`.

## Botones interactivos (herramienta de mensajes)

Envía mensajes con botones en los que se puede hacer clic. Cuando un usuario hace clic en un botón, el agente recibe la selección y puede responder.

Habilita los botones añadiendo `inlineButtons` a las capacidades del canal:

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

Usa `message action=send` con un parámetro `buttons`. Los botones son un array 2D (filas de botones):

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

Campos de botón:

<ParamField path="text" type="string" required>
  Etiqueta visible.
</ParamField>
<ParamField path="callback_data" type="string" required>
  Valor enviado de vuelta al hacer clic (usado como ID de la acción).
</ParamField>
<ParamField path="style" type='"default" | "primary" | "danger"'>
  Estilo del botón.
</ParamField>

Cuando un usuario hace clic en un botón:

<Steps>
  <Step title="Los botones se sustituyen por una confirmación">
    Todos los botones se sustituyen por una línea de confirmación (p. ej., "✓ **Yes** selected by @user").
  </Step>
  <Step title="El agente recibe la selección">
    El agente recibe la selección como un mensaje entrante y responde.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Notas de implementación">
    - Los callbacks de botones usan verificación HMAC-SHA256 (automática, no requiere configuración).
    - Mattermost elimina los datos de callback de sus respuestas de API (función de seguridad), por lo que todos los botones se eliminan al hacer clic; no es posible una eliminación parcial.
    - Los ID de acciones que contienen guiones o guiones bajos se sanean automáticamente (limitación de enrutamiento de Mattermost).
  </Accordion>
  <Accordion title="Configuración y accesibilidad">
    - `channels.mattermost.capabilities`: array de cadenas de capacidad. Añade `"inlineButtons"` para habilitar la descripción de la herramienta de botones en el prompt del sistema del agente.
    - `channels.mattermost.interactions.callbackBaseUrl`: URL base externa opcional para callbacks de botones (por ejemplo, `https://gateway.example.com`). Úsala cuando Mattermost no pueda alcanzar el Gateway directamente en su host de enlace.
    - En configuraciones con varias cuentas, también puedes establecer el mismo campo en `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
    - Si se omite `interactions.callbackBaseUrl`, OpenClaw deriva la URL de callback a partir de `gateway.customBindHost` + `gateway.port`, y luego recurre a `http://localhost:<port>`.
    - Regla de accesibilidad: la URL de callback del botón debe ser accesible desde el servidor de Mattermost. `localhost` solo funciona cuando Mattermost y OpenClaw se ejecutan en el mismo host o espacio de nombres de red.
    - Si tu destino de callback es privado, de tailnet o interno, añade su host/dominio a `ServiceSettings.AllowedUntrustedInternalConnections` de Mattermost.
  </Accordion>
</AccordionGroup>

### Integración directa con la API (scripts externos)

Los scripts externos y Webhooks pueden publicar botones directamente mediante la API REST de Mattermost en lugar de pasar por la herramienta `message` del agente. Usa `buildButtonAttachments()` del Plugin cuando sea posible; si publicas JSON sin procesar, sigue estas reglas:

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
            id: "mybutton01", // alphanumeric only — see below
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
2. Toda acción necesita `type: "button"`; sin él, los clics se descartan silenciosamente.
3. Toda acción necesita un campo `id`; Mattermost ignora las acciones sin ID.
4. El `id` de la acción debe ser **solo alfanumérico** (`[a-zA-Z0-9]`). Los guiones y guiones bajos rompen el enrutamiento de acciones del lado del servidor de Mattermost (devuelve 404). Elimínalos antes de usarlo.
5. `context.action_id` debe coincidir con el `id` del botón para que el mensaje de confirmación muestre el nombre del botón (p. ej., "Approve") en lugar de un ID sin procesar.
6. `context.action_id` es obligatorio; el controlador de interacciones devuelve 400 sin él.
   </Warning>

**Generación de token HMAC**

El Gateway verifica los clics de botones con HMAC-SHA256. Los scripts externos deben generar tokens que coincidan con la lógica de verificación del Gateway:

<Steps>
  <Step title="Deriva el secreto a partir del token del bot">
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
  <Step title="Añade el token">
    Añade el resumen hexadecimal resultante como `_token` en el contexto.
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
  <Accordion title="Errores habituales de HMAC">
    - `json.dumps` de Python añade espacios de forma predeterminada (`{"key": "val"}`). Usa `separators=(",", ":")` para que coincida con la salida compacta de JavaScript (`{"key":"val"}`).
    - Firma siempre **todos** los campos del contexto (menos `_token`). El Gateway elimina `_token` y luego firma todo lo que queda. Firmar un subconjunto provoca un fallo silencioso de verificación.
    - Usa `sort_keys=True`; el Gateway ordena las claves antes de firmar, y Mattermost puede reordenar los campos del contexto al almacenar la carga.
    - Deriva el secreto a partir del token del bot (determinista), no de bytes aleatorios. El secreto debe ser el mismo en el proceso que crea los botones y en el Gateway que verifica.
  </Accordion>
</AccordionGroup>

## Adaptador de directorio

El Plugin de Mattermost incluye un adaptador de directorio que resuelve nombres de canal y de usuario mediante la API de Mattermost. Esto habilita destinos `#channel-name` y `@username` en entregas de `openclaw message send` y Cron/Webhook.

No se necesita configuración: el adaptador usa el token del bot de la configuración de la cuenta.

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

## Solución de problemas

<AccordionGroup>
  <Accordion title="No hay respuestas en canales">
    Asegúrate de que el bot esté en el canal y menciónalo (oncall), usa un prefijo disparador (onchar) o establece `chatmode: "onmessage"`.
  </Accordion>
  <Accordion title="Errores de autenticación o de varias cuentas">
    - Comprueba el token del bot, la URL base y si la cuenta está habilitada.
    - Problemas con varias cuentas: las variables de entorno solo se aplican a la cuenta `default`.
  </Accordion>
  <Accordion title="Fallan los comandos slash nativos">
    - `Unauthorized: invalid command token.`: OpenClaw no aceptó el token del callback. Causas típicas:
      - el registro del comando slash falló o solo se completó parcialmente al inicio
      - el callback está llegando al Gateway o cuenta equivocados
      - Mattermost todavía tiene comandos antiguos que apuntan a un destino de callback anterior
      - el Gateway se reinició sin reactivar los comandos slash
    - Si los comandos slash nativos dejan de funcionar, revisa los logs en busca de `mattermost: failed to register slash commands` o `mattermost: native slash commands enabled but no commands could be registered`.
    - Si se omite `callbackUrl` y los logs advierten que el callback se resolvió a `http://127.0.0.1:18789/...`, probablemente esa URL solo sea accesible cuando Mattermost se ejecuta en el mismo host o espacio de nombres de red que OpenClaw. En su lugar, establece un `commands.callbackUrl` explícito y accesible externamente.
  </Accordion>
  <Accordion title="Problemas con botones">
    - Los botones aparecen como cuadros blancos: el agente puede estar enviando datos de botones mal formados. Comprueba que cada botón tenga los campos `text` y `callback_data`.
    - Los botones se renderizan pero los clics no hacen nada: verifica que `AllowedUntrustedInternalConnections` en la configuración del servidor Mattermost incluya `127.0.0.1 localhost`, y que `EnablePostActionIntegration` sea `true` en ServiceSettings.
    - Los botones devuelven 404 al hacer clic: probablemente el `id` del botón contiene guiones o guiones bajos. El enrutador de acciones de Mattermost se rompe con IDs no alfanuméricos. Usa solo `[a-zA-Z0-9]`.
    - El Gateway registra `invalid _token`: no hay coincidencia de HMAC. Comprueba que firmas todos los campos del contexto (no un subconjunto), usas claves ordenadas y JSON compacto (sin espacios). Consulta la sección de HMAC anterior.
    - El Gateway registra `missing _token in context`: el campo `_token` no está en el contexto del botón. Asegúrate de incluirlo al construir la carga de integración.
    - La confirmación muestra un ID sin procesar en lugar del nombre del botón: `context.action_id` no coincide con el `id` del botón. Establece ambos con el mismo valor saneado.
    - El agente no conoce los botones: añade `capabilities: ["inlineButtons"]` a la configuración del canal Mattermost.
  </Accordion>
</AccordionGroup>

## Relacionado

- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Descripción general de los canales](/es/channels) — todos los canales compatibles
- [Grupos](/es/channels/groups) — comportamiento del chat grupal y control por mención
- [Emparejamiento](/es/channels/pairing) — autenticación DM y flujo de emparejamiento
- [Seguridad](/es/gateway/security) — modelo de acceso y refuerzo
