---
read_when:
    - Configuración de Mattermost
    - Depuración del enrutamiento de Mattermost
sidebarTitle: Mattermost
summary: Configuración del bot de Mattermost y configuración de OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-04-30T05:29:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1926a1d7347ff35ed60f8d5c3e0b26a064863ada213ad0e171776af5a84d8475
    source_path: channels/mattermost.md
    workflow: 16
---

Estado: Plugin incluido (token de bot + eventos WebSocket). Se admiten canales, grupos y MD. Mattermost es una plataforma de mensajería de equipo autohospedable; consulta el sitio oficial en [mattermost.com](https://mattermost.com) para ver detalles del producto y descargas.

## Plugin incluido

<Note>
Mattermost se distribuye como un Plugin incluido en las versiones actuales de OpenClaw, por lo que las compilaciones empaquetadas normales no necesitan una instalación aparte.
</Note>

Si usas una compilación anterior o una instalación personalizada que excluye Mattermost, instala un paquete npm actual cuando se publique uno:

<Tabs>
  <Tab title="Registro npm">
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

Si npm informa que el paquete propiedad de OpenClaw está obsoleto, usa una compilación
empaquetada actual de OpenClaw o la ruta de checkout local hasta que se
publique un paquete npm más reciente.

Detalles: [Plugins](/es/tools/plugin)

## Configuración rápida

<Steps>
  <Step title="Asegura que el Plugin esté disponible">
    Las versiones empaquetadas actuales de OpenClaw ya lo incluyen. Las instalaciones anteriores o personalizadas pueden añadirlo manualmente con los comandos anteriores.
  </Step>
  <Step title="Crea un bot de Mattermost">
    Crea una cuenta de bot de Mattermost y copia el **token del bot**.
  </Step>
  <Step title="Copia la URL base">
    Copia la **URL base** de Mattermost (por ejemplo, `https://chat.example.com`).
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
  <Accordion title="Notas de comportamiento">
    - `native: "auto"` está deshabilitado de forma predeterminada para Mattermost. Define `native: true` para habilitarlo.
    - Si se omite `callbackUrl`, OpenClaw deriva una a partir del host/puerto del Gateway + `callbackPath`.
    - Para configuraciones con varias cuentas, `commands` puede definirse en el nivel superior o bajo `channels.mattermost.accounts.<id>.commands` (los valores de la cuenta anulan los campos del nivel superior).
    - Los callbacks de comandos se validan con los tokens por comando devueltos por Mattermost cuando OpenClaw registra comandos `oc_*`.
    - Los callbacks slash fallan de forma cerrada cuando el registro falló, el arranque fue parcial o el token de callback no coincide con uno de los comandos registrados.

  </Accordion>
  <Accordion title="Requisito de accesibilidad">
    El endpoint de callback debe ser accesible desde el servidor de Mattermost.

    - No establezcas `callbackUrl` en `localhost` a menos que Mattermost se ejecute en el mismo host/espacio de nombres de red que OpenClaw.
    - No establezcas `callbackUrl` en tu URL base de Mattermost a menos que esa URL haga proxy inverso de `/api/channels/mattermost/command` hacia OpenClaw.
    - Una comprobación rápida es `curl https://<gateway-host>/api/channels/mattermost/command`; un GET debe devolver `405 Method Not Allowed` desde OpenClaw, no `404`.

  </Accordion>
  <Accordion title="Lista de permitidos de salida de Mattermost">
    Si tu callback apunta a direcciones privadas/tailnet/internas, establece `ServiceSettings.AllowedUntrustedInternalConnections` de Mattermost para incluir el host/dominio del callback.

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

`MATTERMOST_URL` no puede definirse desde un `.env` del espacio de trabajo; consulta [Archivos `.env` del espacio de trabajo](/es/gateway/security).
</Note>

## Modos de chat

Mattermost responde automáticamente a los MD. El comportamiento de los canales se controla con `chatmode`:

<Tabs>
  <Tab title="oncall (predeterminado)">
    Responder solo cuando se mencione con @ en canales.
  </Tab>
  <Tab title="onmessage">
    Responder a cada mensaje del canal.
  </Tab>
  <Tab title="onchar">
    Responder cuando un mensaje empieza con un prefijo disparador.
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

## Hilos y sesiones

Usa `channels.mattermost.replyToMode` para controlar si las respuestas de canales y grupos permanecen en el canal principal o inician un hilo bajo la publicación que las dispara.

- `off` (predeterminado): responder en un hilo solo cuando la publicación entrante ya está en uno.
- `first`: para publicaciones de canal/grupo de nivel superior, iniciar un hilo bajo esa publicación y enrutar la conversación a una sesión con ámbito de hilo.
- `all`: el mismo comportamiento que `first` para Mattermost hoy.
- Los mensajes directos ignoran esta opción y permanecen sin hilo.

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

- Las sesiones con ámbito de hilo usan el id de la publicación disparadora como raíz del hilo.
- `first` y `all` son actualmente equivalentes porque, una vez que Mattermost tiene una raíz de hilo, los fragmentos y medios posteriores continúan en ese mismo hilo.

## Control de acceso (MD)

- Predeterminado: `channels.mattermost.dmPolicy = "pairing"` (los remitentes desconocidos reciben un código de emparejamiento).
- Aprobar mediante:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- MD públicos: `channels.mattermost.dmPolicy="open"` más `channels.mattermost.allowFrom=["*"]`.

## Canales (grupos)

- Predeterminado: `channels.mattermost.groupPolicy = "allowlist"` (requiere mención).
- Permite remitentes con `channels.mattermost.groupAllowFrom` (se recomiendan ID de usuario).
- Las anulaciones de mención por canal están bajo `channels.mattermost.groups.<channelId>.requireMention` o `channels.mattermost.groups["*"].requireMention` para un valor predeterminado.
- La coincidencia de `@username` es mutable y solo se habilita cuando `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Canales abiertos: `channels.mattermost.groupPolicy="open"` (requiere mención).
- Nota de runtime: si falta por completo `channels.mattermost`, el runtime recurre a `groupPolicy="allowlist"` para comprobaciones de grupo (incluso si `channels.defaults.groupPolicy` está definido).

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
- `user:<id>` para un MD
- `@username` para un MD (resuelto mediante la API de Mattermost)

<Warning>
Los ID opacos sin prefijo (como `64ifufp...`) son **ambiguos** en Mattermost (ID de usuario frente a ID de canal).

OpenClaw los resuelve **primero como usuario**:

- Si el ID existe como usuario (`GET /api/v4/users/<id>` se completa correctamente), OpenClaw envía un **MD** resolviendo el canal directo mediante `/api/v4/channels/direct`.
- De lo contrario, el ID se trata como un **ID de canal**.

Si necesitas un comportamiento determinista, usa siempre los prefijos explícitos (`user:<id>` / `channel:<id>`).
</Warning>

## Reintento de canal de MD

Cuando OpenClaw envía a un destino de MD de Mattermost y necesita resolver primero el canal directo, reintenta de forma predeterminada los fallos transitorios de creación de canal directo.

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

- Esto se aplica solo a la creación de canales de MD (`/api/v4/channels/direct`), no a todas las llamadas a la API de Mattermost.
- Los reintentos se aplican a fallos transitorios como límites de tasa, respuestas 5xx y errores de red o de tiempo de espera.
- Los errores de cliente 4xx distintos de `429` se tratan como permanentes y no se reintentan.

## Streaming de vista previa

Mattermost transmite el razonamiento, la actividad de herramientas y el texto parcial de respuesta en una única **publicación de vista previa en borrador** que se finaliza en el mismo lugar cuando la respuesta final es segura para enviar. La vista previa se actualiza en el mismo id de publicación en lugar de saturar el canal con mensajes por fragmento. Los finales con medios/errores cancelan las ediciones de vista previa pendientes y usan la entrega normal en lugar de publicar una vista previa descartable.

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
    - `block` usa fragmentos de borrador de estilo anexado dentro de la publicación de vista previa.
    - `progress` muestra una vista previa de estado mientras se genera y solo publica la respuesta final al completarse.
    - `off` deshabilita el streaming de vista previa.

  </Accordion>
  <Accordion title="Notas de comportamiento del streaming">
    - Si el stream no puede finalizarse en el mismo lugar (por ejemplo, si la publicación se eliminó durante el stream), OpenClaw recurre a enviar una nueva publicación final para que la respuesta nunca se pierda.
    - Las cargas útiles solo de razonamiento se suprimen de las publicaciones del canal, incluido el texto que llega como una cita en bloque `> Reasoning:`. Define `/reasoning on` para ver el razonamiento en otras superficies; la publicación final de Mattermost conserva solo la respuesta.
    - Consulta [Streaming](/es/concepts/streaming#preview-streaming-modes) para ver la matriz de asignación de canales.

  </Accordion>
</AccordionGroup>

## Reacciones (herramienta de mensajes)

- Usa `message action=react` con `channel=mattermost`.
- `messageId` es el id de publicación de Mattermost.
- `emoji` acepta nombres como `thumbsup` o `:+1:` (los dos puntos son opcionales).
- Define `remove=true` (booleano) para eliminar una reacción.
- Los eventos de añadir/eliminar reacción se reenvían como eventos del sistema a la sesión del agente enrutada.

Ejemplos:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Configuración:

- `channels.mattermost.actions.reactions`: habilita/deshabilita acciones de reacción (valor predeterminado true).
- Anulación por cuenta: `channels.mattermost.accounts.<id>.actions.reactions`.

## Botones interactivos (herramienta de mensajes)

Envía mensajes con botones clicables. Cuando un usuario hace clic en un botón, el agente recibe la selección y puede responder.

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

Usa `message action=send` con un parámetro `buttons`. Los botones son una matriz 2D (filas de botones):

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

Campos de botón:

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
  <Step title="Botones reemplazados por confirmación">
    Todos los botones se reemplazan por una línea de confirmación (por ejemplo, "✓ **Yes** selected by @user").
  </Step>
  <Step title="El agente recibe la selección">
    El agente recibe la selección como un mensaje entrante y responde.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Notas de implementación">
    - Las devoluciones de llamada de los botones usan verificación HMAC-SHA256 (automática, no se necesita configuración).
    - Mattermost elimina los datos de devolución de llamada de sus respuestas de API (función de seguridad), por lo que todos los botones se eliminan al hacer clic; la eliminación parcial no es posible.
    - Los ID de acción que contienen guiones o guiones bajos se sanea automáticamente (limitación de enrutamiento de Mattermost).

  </Accordion>
  <Accordion title="Configuración y accesibilidad">
    - `channels.mattermost.capabilities`: arreglo de cadenas de capacidades. Añade `"inlineButtons"` para habilitar la descripción de la herramienta de botones en el prompt del sistema del agente.
    - `channels.mattermost.interactions.callbackBaseUrl`: URL base externa opcional para devoluciones de llamada de botones (por ejemplo `https://gateway.example.com`). Usa esto cuando Mattermost no pueda alcanzar el Gateway directamente en su host de enlace.
    - En configuraciones con varias cuentas, también puedes establecer el mismo campo en `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
    - Si se omite `interactions.callbackBaseUrl`, OpenClaw deriva la URL de devolución de llamada de `gateway.customBindHost` + `gateway.port`, y luego recurre a `http://localhost:<port>`.
    - Regla de accesibilidad: la URL de devolución de llamada del botón debe ser accesible desde el servidor de Mattermost. `localhost` solo funciona cuando Mattermost y OpenClaw se ejecutan en el mismo host/espacio de nombres de red.
    - Si tu destino de devolución de llamada es privado/tailnet/interno, añade su host/dominio a `ServiceSettings.AllowedUntrustedInternalConnections` de Mattermost.

  </Accordion>
</AccordionGroup>

### Integración directa con API (scripts externos)

Los scripts externos y Webhooks pueden publicar botones directamente mediante la API REST de Mattermost en lugar de pasar por la herramienta `message` del agente. Usa `buildButtonAttachments()` desde el Plugin cuando sea posible; si publicas JSON sin procesar, sigue estas reglas:

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
2. Cada acción necesita `type: "button"`; sin esto, los clics se descartan silenciosamente.
3. Cada acción necesita un campo `id`; Mattermost ignora las acciones sin ID.
4. El `id` de la acción debe ser **solo alfanumérico** (`[a-zA-Z0-9]`). Los guiones y guiones bajos rompen el enrutamiento de acciones del lado del servidor de Mattermost (devuelve 404). Elimínalos antes de usarlo.
5. `context.action_id` debe coincidir con el `id` del botón para que el mensaje de confirmación muestre el nombre del botón (por ejemplo, "Approve") en lugar de un ID sin procesar.
6. `context.action_id` es obligatorio; el controlador de interacción devuelve 400 sin él.

</Warning>

**Generación de token HMAC**

El Gateway verifica los clics en botones con HMAC-SHA256. Los scripts externos deben generar tokens que coincidan con la lógica de verificación del Gateway:

<Steps>
  <Step title="Deriva el secreto desde el token del bot">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
  </Step>
  <Step title="Construye el objeto de contexto">
    Construye el objeto de contexto con todos los campos **excepto** `_token`.
  </Step>
  <Step title="Serializa con claves ordenadas">
    Serializa con **claves ordenadas** y **sin espacios** (el Gateway usa `JSON.stringify` con claves ordenadas, lo que produce una salida compacta).
  </Step>
  <Step title="Firma la carga útil">
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
  <Accordion title="Errores comunes con HMAC">
    - `json.dumps` de Python añade espacios de forma predeterminada (`{"key": "val"}`). Usa `separators=(",", ":")` para coincidir con la salida compacta de JavaScript (`{"key":"val"}`).
    - Firma siempre **todos** los campos de contexto (menos `_token`). El Gateway elimina `_token` y luego firma todo lo restante. Firmar un subconjunto provoca un fallo de verificación silencioso.
    - Usa `sort_keys=True`; el Gateway ordena las claves antes de firmar, y Mattermost puede reordenar los campos de contexto al almacenar la carga útil.
    - Deriva el secreto desde el token del bot (determinista), no desde bytes aleatorios. El secreto debe ser el mismo en el proceso que crea los botones y en el Gateway que verifica.

  </Accordion>
</AccordionGroup>

## Adaptador de directorio

El Plugin de Mattermost incluye un adaptador de directorio que resuelve nombres de canales y usuarios mediante la API de Mattermost. Esto habilita destinos `#channel-name` y `@username` en `openclaw message send` y entregas de cron/webhook.

No se necesita configuración: el adaptador usa el token del bot desde la configuración de la cuenta.

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
  <Accordion title="Errores de autenticación o varias cuentas">
    - Comprueba el token del bot, la URL base y si la cuenta está habilitada.
    - Problemas con varias cuentas: las variables de entorno solo se aplican a la cuenta `default`.

  </Accordion>
  <Accordion title="Fallan los comandos slash nativos">
    - `Unauthorized: invalid command token.`: OpenClaw no aceptó el token de devolución de llamada. Causas habituales:
      - el registro del comando slash falló o solo se completó parcialmente al iniciar
      - la devolución de llamada está llegando al Gateway/cuenta equivocado
      - Mattermost aún tiene comandos antiguos que apuntan a un destino de devolución de llamada anterior
      - el Gateway se reinició sin reactivar los comandos slash
    - Si los comandos slash nativos dejan de funcionar, revisa los registros en busca de `mattermost: failed to register slash commands` o `mattermost: native slash commands enabled but no commands could be registered`.
    - Si se omite `callbackUrl` y los registros advierten que la devolución de llamada se resolvió como `http://127.0.0.1:18789/...`, es probable que esa URL solo sea accesible cuando Mattermost se ejecuta en el mismo host/espacio de nombres de red que OpenClaw. En su lugar, establece un `commands.callbackUrl` explícito y accesible externamente.

  </Accordion>
  <Accordion title="Problemas con botones">
    - Los botones aparecen como cuadros blancos: el agente puede estar enviando datos de botón con formato incorrecto. Comprueba que cada botón tenga los campos `text` y `callback_data`.
    - Los botones se renderizan, pero los clics no hacen nada: verifica que `AllowedUntrustedInternalConnections` en la configuración del servidor de Mattermost incluya `127.0.0.1 localhost`, y que `EnablePostActionIntegration` sea `true` en ServiceSettings.
    - Los botones devuelven 404 al hacer clic: es probable que el `id` del botón contenga guiones o guiones bajos. El enrutador de acciones de Mattermost se rompe con ID no alfanuméricos. Usa solo `[a-zA-Z0-9]`.
    - Los registros del Gateway muestran `invalid _token`: discrepancia de HMAC. Comprueba que firmes todos los campos de contexto (no un subconjunto), uses claves ordenadas y uses JSON compacto (sin espacios). Consulta la sección HMAC anterior.
    - Los registros del Gateway muestran `missing _token in context`: el campo `_token` no está en el contexto del botón. Asegúrate de incluirlo al crear la carga útil de integración.
    - La confirmación muestra un ID sin procesar en lugar del nombre del botón: `context.action_id` no coincide con el `id` del botón. Establece ambos en el mismo valor saneado.
    - El agente no sabe sobre los botones: añade `capabilities: ["inlineButtons"]` a la configuración del canal de Mattermost.

  </Accordion>
</AccordionGroup>

## Relacionado

- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesión para mensajes
- [Resumen de canales](/es/channels) — todos los canales compatibles
- [Grupos](/es/channels/groups) — comportamiento de chats grupales y control por menciones
- [Emparejamiento](/es/channels/pairing) — autenticación por DM y flujo de emparejamiento
- [Seguridad](/es/gateway/security) — modelo de acceso y endurecimiento
