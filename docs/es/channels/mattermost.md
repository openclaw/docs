---
read_when:
    - Configuración de Mattermost
    - Depuración del enrutamiento de Mattermost
summary: Configuración del bot de Mattermost y de OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-04-23T13:58:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: d9421ae903caed5c9dc3b19ca8558725f11bbe553a20bd4d3f0fb6e7eecccd92
    source_path: channels/mattermost.md
    workflow: 15
---

# Mattermost

Estado: Plugin incluido (token de bot + eventos de WebSocket). Se admiten canales, grupos y MD.
Mattermost es una plataforma de mensajería para equipos autoalojable; consulta el sitio oficial en
[mattermost.com](https://mattermost.com) para obtener detalles del producto y descargas.

## Plugin incluido

Mattermost se incluye como un Plugin incluido en las versiones actuales de OpenClaw, por lo que las compilaciones empaquetadas normales no necesitan una instalación aparte.

Si estás en una compilación más antigua o en una instalación personalizada que excluye Mattermost,
instálalo manualmente:

Instalar mediante CLI (registro de npm):

```bash
openclaw plugins install @openclaw/mattermost
```

Pago local (cuando se ejecuta desde un repositorio git):

```bash
openclaw plugins install ./path/to/local/mattermost-plugin
```

Detalles: [Plugins](/es/tools/plugin)

## Configuración rápida

1. Asegúrate de que el Plugin de Mattermost esté disponible.
   - Las versiones empaquetadas actuales de OpenClaw ya lo incluyen.
   - Las instalaciones antiguas/personalizadas pueden añadirlo manualmente con los comandos anteriores.
2. Crea una cuenta de bot de Mattermost y copia el **token del bot**.
3. Copia la **URL base** de Mattermost (por ejemplo, `https://chat.example.com`).
4. Configura OpenClaw e inicia el Gateway.

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

## Comandos nativos con barra

Los comandos nativos con barra son opcionales. Cuando están habilitados, OpenClaw registra comandos con barra `oc_*` mediante
la API de Mattermost y recibe POST de devolución de llamada en el servidor HTTP del Gateway.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Úsalo cuando Mattermost no pueda llegar al Gateway directamente (proxy inverso/URL pública).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

Notas:

- `native: "auto"` usa deshabilitado como valor predeterminado para Mattermost. Establece `native: true` para habilitarlo.
- Si se omite `callbackUrl`, OpenClaw deriva una a partir del host/puerto del Gateway + `callbackPath`.
- Para configuraciones de varias cuentas, `commands` se puede establecer en el nivel superior o en
  `channels.mattermost.accounts.<id>.commands` (los valores de la cuenta reemplazan los campos del nivel superior).
- Las devoluciones de llamada de comandos se validan con los tokens por comando devueltos por
  Mattermost cuando OpenClaw registra comandos `oc_*`.
- Las devoluciones de llamada de barra fallan en cerrado cuando falla el registro, el inicio fue parcial o
  el token de devolución de llamada no coincide con uno de los comandos registrados.
- Requisito de accesibilidad: el endpoint de devolución de llamada debe ser accesible desde el servidor de Mattermost.
  - No establezcas `callbackUrl` en `localhost` a menos que Mattermost se ejecute en el mismo host/espacio de nombres de red que OpenClaw.
  - No establezcas `callbackUrl` en tu URL base de Mattermost a menos que esa URL haga proxy inverso de `/api/channels/mattermost/command` hacia OpenClaw.
  - Una comprobación rápida es `curl https://<gateway-host>/api/channels/mattermost/command`; un GET debería devolver `405 Method Not Allowed` desde OpenClaw, no `404`.
- Requisito de lista de permitidos de salida de Mattermost:
  - Si tu devolución de llamada apunta a direcciones privadas/tailnet/internas, establece
    `ServiceSettings.AllowedUntrustedInternalConnections` de Mattermost para incluir el host/dominio de la devolución de llamada.
  - Usa entradas de host/dominio, no URL completas.
    - Correcto: `gateway.tailnet-name.ts.net`
    - Incorrecto: `https://gateway.tailnet-name.ts.net`

## Variables de entorno (cuenta predeterminada)

Establece estas variables en el host del Gateway si prefieres variables de entorno:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

Las variables de entorno se aplican solo a la cuenta **predeterminada** (`default`). Las demás cuentas deben usar valores de configuración.

`MATTERMOST_URL` no puede establecerse desde un `.env` del espacio de trabajo; consulta [Archivos `.env` del espacio de trabajo](/es/gateway/security).

## Modos de chat

Mattermost responde a los MD automáticamente. El comportamiento en canales está controlado por `chatmode`:

- `oncall` (predeterminado): responder solo cuando se le menciona con @ en canales.
- `onmessage`: responder a cada mensaje del canal.
- `onchar`: responder cuando un mensaje comienza con un prefijo desencadenante.

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

- `onchar` sigue respondiendo a las menciones explícitas con @.
- `channels.mattermost.requireMention` se respeta en configuraciones heredadas, pero se prefiere `chatmode`.

## Hilos y sesiones

Usa `channels.mattermost.replyToMode` para controlar si las respuestas en canales y grupos permanecen en el
canal principal o inician un hilo bajo la publicación que las desencadena.

- `off` (predeterminado): responder en un hilo solo cuando la publicación entrante ya esté en uno.
- `first`: para publicaciones de nivel superior en canales/grupos, iniciar un hilo bajo esa publicación y dirigir la
  conversación a una sesión con ámbito de hilo.
- `all`: hoy tiene el mismo comportamiento que `first` para Mattermost.
- Los mensajes directos ignoran esta configuración y permanecen sin hilos.

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

- Las sesiones con ámbito de hilo usan el id de la publicación desencadenante como raíz del hilo.
- `first` y `all` son actualmente equivalentes porque, una vez que Mattermost tiene una raíz de hilo,
  los fragmentos de seguimiento y los medios continúan en ese mismo hilo.

## Control de acceso (MD)

- Predeterminado: `channels.mattermost.dmPolicy = "pairing"` (los remitentes desconocidos reciben un código de vinculación).
- Aprobar mediante:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- MD públicos: `channels.mattermost.dmPolicy="open"` más `channels.mattermost.allowFrom=["*"]`.

## Canales (grupos)

- Predeterminado: `channels.mattermost.groupPolicy = "allowlist"` (restringido por menciones).
- Añade remitentes a la lista de permitidos con `channels.mattermost.groupAllowFrom` (se recomiendan IDs de usuario).
- Las anulaciones de menciones por canal se encuentran en `channels.mattermost.groups.<channelId>.requireMention`
  o en `channels.mattermost.groups["*"].requireMention` como valor predeterminado.
- La coincidencia de `@username` es mutable y solo está habilitada cuando `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Canales abiertos: `channels.mattermost.groupPolicy="open"` (restringido por menciones).
- Nota de ejecución: si falta por completo `channels.mattermost`, el tiempo de ejecución usa `groupPolicy="allowlist"` como valor de reserva para las comprobaciones de grupo (incluso si `channels.defaults.groupPolicy` está establecido).

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

Usa estos formatos de destino con `openclaw message send` o Cron/Webhooks:

- `channel:<id>` para un canal
- `user:<id>` para un MD
- `@username` para un MD (resuelto mediante la API de Mattermost)

Los IDs opacos sin prefijo (como `64ifufp...`) son **ambiguos** en Mattermost (ID de usuario frente a ID de canal).

OpenClaw los resuelve **primero como usuario**:

- Si el ID existe como usuario (`GET /api/v4/users/<id>` se completa correctamente), OpenClaw envía un **MD** resolviendo el canal directo mediante `/api/v4/channels/direct`.
- En caso contrario, el ID se trata como un **ID de canal**.

Si necesitas un comportamiento determinista, usa siempre los prefijos explícitos (`user:<id>` / `channel:<id>`).

## Reintento del canal MD

Cuando OpenClaw envía a un destino MD de Mattermost y primero necesita resolver el canal directo,
reintenta de forma predeterminada los fallos transitorios de creación del canal directo.

Usa `channels.mattermost.dmChannelRetry` para ajustar ese comportamiento globalmente para el Plugin de Mattermost,
o `channels.mattermost.accounts.<id>.dmChannelRetry` para una cuenta.

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

- Esto se aplica solo a la creación del canal MD (`/api/v4/channels/direct`), no a todas las llamadas a la API de Mattermost.
- Los reintentos se aplican a fallos transitorios, como límites de tasa, respuestas 5xx y errores de red o de tiempo de espera.
- Los errores de cliente 4xx distintos de `429` se tratan como permanentes y no se reintentan.

## Streaming de vista previa

Mattermost transmite el razonamiento, la actividad de herramientas y el texto parcial de respuesta en una sola **publicación de vista previa en borrador** que se finaliza en el mismo lugar cuando la respuesta final es segura para enviarse. La vista previa se actualiza en el mismo id de publicación en lugar de saturar el canal con mensajes por fragmento. Los finales de medios/error cancelan las ediciones pendientes de la vista previa y usan la entrega normal en lugar de vaciar una publicación de vista previa descartable.

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

Notas:

- `partial` es la opción habitual: una publicación de vista previa que se edita a medida que crece la respuesta y luego se finaliza con la respuesta completa.
- `block` usa fragmentos de borrador de estilo anexado dentro de la publicación de vista previa.
- `progress` muestra una vista previa de estado mientras se genera y solo publica la respuesta final al completarse.
- `off` deshabilita el streaming de vista previa.
- Si el stream no puede finalizarse en el mismo lugar (por ejemplo, si la publicación se eliminó a mitad del stream), OpenClaw recurre a enviar una nueva publicación final para que la respuesta nunca se pierda.
- Las cargas solo de razonamiento se suprimen en las publicaciones del canal, incluido el texto que llega como bloque citado `> Reasoning:`. Establece `/reasoning on` para ver el razonamiento en otras superficies; la publicación final de Mattermost mantiene solo la respuesta.
- Consulta [Streaming](/es/concepts/streaming#preview-streaming-modes) para la matriz de asignación de canales.

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

- `channels.mattermost.actions.reactions`: habilitar/deshabilitar acciones de reacción (predeterminado: true).
- Anulación por cuenta: `channels.mattermost.accounts.<id>.actions.reactions`.

## Botones interactivos (herramienta de mensajes)

Envía mensajes con botones en los que se puede hacer clic. Cuando un usuario hace clic en un botón, el agente recibe la
selección y puede responder.

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

Campos de los botones:

- `text` (obligatorio): etiqueta visible.
- `callback_data` (obligatorio): valor enviado de vuelta al hacer clic (se usa como ID de acción).
- `style` (opcional): `"default"`, `"primary"` o `"danger"`.

Cuando un usuario hace clic en un botón:

1. Todos los botones se sustituyen por una línea de confirmación (por ejemplo, "✓ **Yes** selected by @user").
2. El agente recibe la selección como un mensaje entrante y responde.

Notas:

- Las devoluciones de llamada de botones usan verificación HMAC-SHA256 (automática, no requiere configuración).
- Mattermost elimina los datos de devolución de llamada de sus respuestas de API (función de seguridad), por lo que todos los botones
  se eliminan al hacer clic; no es posible una eliminación parcial.
- Los IDs de acción que contienen guiones o guiones bajos se sanean automáticamente
  (limitación del enrutamiento de Mattermost).

Configuración:

- `channels.mattermost.capabilities`: matriz de cadenas de capacidades. Añade `"inlineButtons"` para
  habilitar la descripción de la herramienta de botones en el prompt del sistema del agente.
- `channels.mattermost.interactions.callbackBaseUrl`: URL base externa opcional para las devoluciones de llamada
  de botones (por ejemplo, `https://gateway.example.com`). Usa esto cuando Mattermost no pueda
  llegar al Gateway directamente en su host de enlace.
- En configuraciones de varias cuentas, también puedes establecer el mismo campo en
  `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
- Si se omite `interactions.callbackBaseUrl`, OpenClaw deriva la URL de devolución de llamada a partir de
  `gateway.customBindHost` + `gateway.port`, y luego recurre a `http://localhost:<port>`.
- Regla de accesibilidad: la URL de devolución de llamada del botón debe ser accesible desde el servidor de Mattermost.
  `localhost` solo funciona cuando Mattermost y OpenClaw se ejecutan en el mismo host/espacio de nombres de red.
- Si tu destino de devolución de llamada es privado/tailnet/interno, añade su host/dominio a
  `ServiceSettings.AllowedUntrustedInternalConnections` de Mattermost.

### Integración directa con la API (scripts externos)

Los scripts externos y Webhooks pueden publicar botones directamente mediante la API REST de Mattermost
en lugar de pasar por la herramienta `message` del agente. Usa `buildButtonAttachments()` del
Plugin cuando sea posible; si publicas JSON sin procesar, sigue estas reglas:

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

**Reglas críticas:**

1. Los adjuntos van en `props.attachments`, no en `attachments` de nivel superior (se ignoran silenciosamente).
2. Cada acción necesita `type: "button"` — sin esto, los clics se descartan silenciosamente.
3. Cada acción necesita un campo `id` — Mattermost ignora las acciones sin IDs.
4. El `id` de la acción debe ser **solo alfanumérico** (`[a-zA-Z0-9]`). Los guiones y guiones bajos rompen
   el enrutamiento de acciones del lado del servidor de Mattermost (devuelve 404). Elimínalos antes de usarlo.
5. `context.action_id` debe coincidir con el `id` del botón para que el mensaje de confirmación muestre el
   nombre del botón (por ejemplo, "Approve") en lugar de un ID sin procesar.
6. `context.action_id` es obligatorio — el controlador de interacción devuelve 400 sin él.

**Generación de token HMAC:**

El Gateway verifica los clics en botones con HMAC-SHA256. Los scripts externos deben generar tokens
que coincidan con la lógica de verificación del Gateway:

1. Deriva el secreto a partir del token del bot:
   `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
2. Construye el objeto de contexto con todos los campos **excepto** `_token`.
3. Serializa con **claves ordenadas** y **sin espacios** (el Gateway usa `JSON.stringify`
   con claves ordenadas, lo que produce una salida compacta).
4. Firma: `HMAC-SHA256(key=secret, data=serializedContext)`
5. Añade el resumen hexadecimal resultante como `_token` en el contexto.

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

Problemas comunes con HMAC:

- `json.dumps` de Python añade espacios de forma predeterminada (`{"key": "val"}`). Usa
  `separators=(",", ":")` para que coincida con la salida compacta de JavaScript (`{"key":"val"}`).
- Firma siempre **todos** los campos del contexto (menos `_token`). El Gateway elimina `_token` y luego
  firma todo lo demás que queda. Firmar un subconjunto provoca un fallo silencioso de verificación.
- Usa `sort_keys=True` — el Gateway ordena las claves antes de firmar, y Mattermost puede
  reordenar los campos de contexto al almacenar la carga útil.
- Deriva el secreto a partir del token del bot (determinista), no de bytes aleatorios. El secreto
  debe ser el mismo en el proceso que crea botones y en el Gateway que verifica.

## Adaptador de directorio

El Plugin de Mattermost incluye un adaptador de directorio que resuelve nombres de canales y usuarios
mediante la API de Mattermost. Esto permite usar destinos `#channel-name` y `@username` en
`openclaw message send` y en entregas de Cron/Webhook.

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

- No hay respuestas en los canales: asegúrate de que el bot esté en el canal y menciónalo (oncall), usa un prefijo desencadenante (onchar) o establece `chatmode: "onmessage"`.
- Errores de autenticación: comprueba el token del bot, la URL base y si la cuenta está habilitada.
- Problemas con varias cuentas: las variables de entorno solo se aplican a la cuenta `default`.
- Los comandos nativos con barra devuelven `Unauthorized: invalid command token.`: OpenClaw
  no aceptó el token de devolución de llamada. Causas típicas:
  - el registro del comando con barra falló o solo se completó parcialmente al inicio
  - la devolución de llamada está llegando al Gateway/cuenta equivocados
  - Mattermost todavía tiene comandos antiguos que apuntan a un destino de devolución de llamada anterior
  - el Gateway se reinició sin reactivar los comandos con barra
- Si los comandos nativos con barra dejan de funcionar, revisa los registros en busca de
  `mattermost: failed to register slash commands` o
  `mattermost: native slash commands enabled but no commands could be registered`.
- Si se omite `callbackUrl` y los registros advierten que la devolución de llamada se resolvió como
  `http://127.0.0.1:18789/...`, esa URL probablemente solo sea accesible cuando
  Mattermost se ejecuta en el mismo host/espacio de nombres de red que OpenClaw. Establece en su lugar una
  `commands.callbackUrl` explícita y accesible externamente.
- Los botones aparecen como cuadros blancos: es posible que el agente esté enviando datos de botones con formato incorrecto. Comprueba que cada botón tenga los campos `text` y `callback_data`.
- Los botones se muestran, pero los clics no hacen nada: verifica que `AllowedUntrustedInternalConnections` en la configuración del servidor Mattermost incluya `127.0.0.1 localhost`, y que `EnablePostActionIntegration` sea `true` en ServiceSettings.
- Los botones devuelven 404 al hacer clic: el `id` del botón probablemente contiene guiones o guiones bajos. El enrutador de acciones de Mattermost falla con IDs no alfanuméricos. Usa solo `[a-zA-Z0-9]`.
- El Gateway registra `invalid _token`: no coincide el HMAC. Comprueba que firmas todos los campos del contexto (no un subconjunto), usas claves ordenadas y usas JSON compacto (sin espacios). Consulta la sección HMAC anterior.
- El Gateway registra `missing _token in context`: el campo `_token` no está en el contexto del botón. Asegúrate de incluirlo al construir la carga útil de integración.
- La confirmación muestra el ID sin procesar en lugar del nombre del botón: `context.action_id` no coincide con el `id` del botón. Establece ambos con el mismo valor saneado.
- El agente no conoce los botones: añade `capabilities: ["inlineButtons"]` a la configuración del canal de Mattermost.

## Relacionado

- [Resumen de canales](/es/channels) — todos los canales compatibles
- [Vinculación](/es/channels/pairing) — autenticación por MD y flujo de vinculación
- [Grupos](/es/channels/groups) — comportamiento del chat grupal y restricción por menciones
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y refuerzo de seguridad
