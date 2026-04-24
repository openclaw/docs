---
read_when:
    - Configurar Mattermost
    - Depurar el enrutamiento de Mattermost
summary: Configuración del bot de Mattermost y configuración de OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-04-24T05:19:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 09c91790a2ea0149c179031b6c08e06358cb4efa5a027778cec87b38444d7718
    source_path: channels/mattermost.md
    workflow: 15
---

Estado: Plugin incluido (token de bot + eventos WebSocket). Se admiten canales, grupos y mensajes directos.
Mattermost es una plataforma de mensajería de equipo autoalojable; consulta el sitio oficial en
[mattermost.com](https://mattermost.com) para obtener detalles del producto y descargas.

## Plugin incluido

Mattermost se incluye como Plugin incluido en las versiones actuales de OpenClaw, por lo que las compilaciones
empaquetadas normales no necesitan una instalación separada.

Si usas una compilación anterior o una instalación personalizada que excluye Mattermost,
instálalo manualmente:

Instalar mediante CLI (registro npm):

```bash
openclaw plugins install @openclaw/mattermost
```

Checkout local (al ejecutar desde un repositorio git):

```bash
openclaw plugins install ./path/to/local/mattermost-plugin
```

Detalles: [Plugins](/es/tools/plugin)

## Configuración rápida

1. Asegúrate de que el Plugin de Mattermost esté disponible.
   - Las versiones empaquetadas actuales de OpenClaw ya lo incluyen.
   - Las instalaciones antiguas/personalizadas pueden agregarlo manualmente con los comandos anteriores.
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

## Comandos slash nativos

Los comandos slash nativos son opcionales. Cuando se habilitan, OpenClaw registra comandos slash `oc_*` mediante
la API de Mattermost y recibe POST de callback en el servidor HTTP del Gateway.

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

- `native: "auto"` está deshabilitado de forma predeterminada para Mattermost. Establece `native: true` para habilitarlo.
- Si se omite `callbackUrl`, OpenClaw deriva uno a partir del host/puerto del Gateway + `callbackPath`.
- Para configuraciones con varias cuentas, `commands` se puede establecer en el nivel superior o en
  `channels.mattermost.accounts.<id>.commands` (los valores de la cuenta sobrescriben los campos del nivel superior).
- Los callbacks de comandos se validan con los tokens por comando que devuelve
  Mattermost cuando OpenClaw registra comandos `oc_*`.
- Los callbacks slash fallan en modo cerrado cuando falla el registro, el inicio es parcial o
  el token del callback no coincide con uno de los comandos registrados.
- Requisito de accesibilidad: el endpoint de callback debe ser accesible desde el servidor Mattermost.
  - No establezcas `callbackUrl` en `localhost` a menos que Mattermost se ejecute en el mismo host/namespace de red que OpenClaw.
  - No establezcas `callbackUrl` en tu URL base de Mattermost a menos que esa URL haga proxy inverso de `/api/channels/mattermost/command` hacia OpenClaw.
  - Una comprobación rápida es `curl https://<gateway-host>/api/channels/mattermost/command`; un GET debe devolver `405 Method Not Allowed` desde OpenClaw, no `404`.
- Requisito de lista de permitidos de salida de Mattermost:
  - Si tu callback apunta a direcciones privadas/tailnet/internas, configura Mattermost
    `ServiceSettings.AllowedUntrustedInternalConnections` para incluir el host/dominio del callback.
  - Usa entradas de host/dominio, no URL completas.
    - Correcto: `gateway.tailnet-name.ts.net`
    - Incorrecto: `https://gateway.tailnet-name.ts.net`

## Variables de entorno (cuenta predeterminada)

Configúralas en el host del Gateway si prefieres variables de entorno:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

Las variables de entorno se aplican solo a la cuenta **predeterminada** (`default`). Las demás cuentas deben usar valores de configuración.

`MATTERMOST_URL` no puede establecerse desde un `.env` del espacio de trabajo; consulta [Archivos `.env` del espacio de trabajo](/es/gateway/security).

## Modos de chat

Mattermost responde automáticamente a los mensajes directos. El comportamiento en canales se controla con `chatmode`:

- `oncall` (predeterminado): responde solo cuando se le menciona con @ en canales.
- `onmessage`: responde a cada mensaje del canal.
- `onchar`: responde cuando un mensaje comienza con un prefijo de activación.

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
- `channels.mattermost.requireMention` se respeta para configuraciones heredadas, pero se prefiere `chatmode`.

## Hilos y sesiones

Usa `channels.mattermost.replyToMode` para controlar si las respuestas en canales y grupos permanecen en el
canal principal o inician un hilo bajo la publicación que las activó.

- `off` (predeterminado): solo responde en un hilo cuando la publicación entrante ya está en uno.
- `first`: para publicaciones de nivel superior en canales/grupos, inicia un hilo bajo esa publicación y enruta la
  conversación a una sesión con alcance de hilo.
- `all`: hoy en Mattermost tiene el mismo comportamiento que `first`.
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

- Las sesiones con alcance de hilo usan el id de la publicación que activó la acción como raíz del hilo.
- `first` y `all` son actualmente equivalentes porque, una vez que Mattermost tiene una raíz de hilo,
  los fragmentos de seguimiento y los medios continúan en ese mismo hilo.

## Control de acceso (mensajes directos)

- Predeterminado: `channels.mattermost.dmPolicy = "pairing"` (los remitentes desconocidos reciben un código de emparejamiento).
- Aprobar mediante:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- Mensajes directos públicos: `channels.mattermost.dmPolicy="open"` más `channels.mattermost.allowFrom=["*"]`.

## Canales (grupos)

- Predeterminado: `channels.mattermost.groupPolicy = "allowlist"` (restringido por mención).
- Agrega remitentes a la lista de permitidos con `channels.mattermost.groupAllowFrom` (se recomiendan ids de usuario).
- Las sobrescrituras de mención por canal están en `channels.mattermost.groups.<channelId>.requireMention`
  o `channels.mattermost.groups["*"].requireMention` como valor predeterminado.
- La coincidencia de `@username` es mutable y solo está habilitada cuando `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Canales abiertos: `channels.mattermost.groupPolicy="open"` (restringido por mención).
- Nota de tiempo de ejecución: si falta por completo `channels.mattermost`, el tiempo de ejecución vuelve a `groupPolicy="allowlist"` para las comprobaciones de grupo (incluso si `channels.defaults.groupPolicy` está configurado).

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

Usa estos formatos de destino con `openclaw message send` o Cron/Webhooks:

- `channel:<id>` para un canal
- `user:<id>` para un mensaje directo
- `@username` para un mensaje directo (resuelto mediante la API de Mattermost)

Los ids opacos sin prefijo (como `64ifufp...`) son **ambiguos** en Mattermost (id de usuario vs id de canal).

OpenClaw los resuelve **priorizando usuario**:

- Si el id existe como usuario (`GET /api/v4/users/<id>` tiene éxito), OpenClaw envía un **mensaje directo** resolviendo el canal directo mediante `/api/v4/channels/direct`.
- En caso contrario, el id se trata como un **id de canal**.

Si necesitas un comportamiento determinista, usa siempre los prefijos explícitos (`user:<id>` / `channel:<id>`).

## Reintento de canal de mensaje directo

Cuando OpenClaw envía a un destino de mensaje directo de Mattermost y primero necesita resolver el canal directo,
reintenta de forma predeterminada los fallos transitorios de creación del canal directo.

Usa `channels.mattermost.dmChannelRetry` para ajustar ese comportamiento globalmente para el Plugin de Mattermost,
o `channels.mattermost.accounts.<id>.dmChannelRetry` para una sola cuenta.

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

- Esto se aplica solo a la creación de canales de mensajes directos (`/api/v4/channels/direct`), no a todas las llamadas API de Mattermost.
- Los reintentos se aplican a fallos transitorios como límites de velocidad, respuestas 5xx y errores de red o timeout.
- Los errores de cliente 4xx distintos de `429` se tratan como permanentes y no se reintentan.

## Vista previa de streaming

Mattermost transmite el pensamiento, la actividad de herramientas y el texto parcial de la respuesta en una sola **publicación de borrador de vista previa** que se finaliza en su lugar cuando la respuesta final es segura para enviarse. La vista previa se actualiza en el mismo id de publicación en lugar de saturar el canal con mensajes por fragmento. Los finales de medios/error cancelan las ediciones pendientes de la vista previa y usan la entrega normal en lugar de vaciar una publicación de vista previa descartable.

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
- `block` usa fragmentos de borrador de estilo append dentro de la publicación de vista previa.
- `progress` muestra una vista previa de estado durante la generación y solo publica la respuesta final al completarse.
- `off` deshabilita la vista previa de streaming.
- Si el flujo no puede finalizarse en su lugar (por ejemplo, si la publicación se eliminó a mitad del flujo), OpenClaw vuelve a enviar una publicación final nueva para que la respuesta nunca se pierda.
- Las cargas de solo razonamiento se suprimen en las publicaciones del canal, incluido el texto que llega como bloque citado `> Reasoning:`. Configura `/reasoning on` para ver el pensamiento en otras superficies; la publicación final de Mattermost conserva solo la respuesta.
- Consulta [Streaming](/es/concepts/streaming#preview-streaming-modes) para la matriz de asignación de canales.

## Reacciones (herramienta de mensajes)

- Usa `message action=react` con `channel=mattermost`.
- `messageId` es el id de publicación de Mattermost.
- `emoji` acepta nombres como `thumbsup` o `:+1:` (los dos puntos son opcionales).
- Establece `remove=true` (booleano) para eliminar una reacción.
- Los eventos de agregar/eliminar reacciones se reenvían como eventos del sistema a la sesión del agente enrutada.

Ejemplos:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Configuración:

- `channels.mattermost.actions.reactions`: habilita/deshabilita acciones de reacción (predeterminado: true).
- Sobrescritura por cuenta: `channels.mattermost.accounts.<id>.actions.reactions`.

## Botones interactivos (herramienta de mensajes)

Envía mensajes con botones en los que se puede hacer clic. Cuando un usuario hace clic en un botón, el agente recibe la
selección y puede responder.

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

Campos de los botones:

- `text` (obligatorio): etiqueta visible.
- `callback_data` (obligatorio): valor que se devuelve al hacer clic (se usa como id de acción).
- `style` (opcional): `"default"`, `"primary"` o `"danger"`.

Cuando un usuario hace clic en un botón:

1. Todos los botones se reemplazan por una línea de confirmación (por ejemplo, "✓ **Yes** selected by @user").
2. El agente recibe la selección como un mensaje entrante y responde.

Notas:

- Los callbacks de botones usan verificación HMAC-SHA256 (automática, sin configuración necesaria).
- Mattermost elimina los datos de callback de sus respuestas API (función de seguridad), por lo que todos los botones
  se eliminan al hacer clic; no es posible una eliminación parcial.
- Los ids de acción que contienen guiones o guiones bajos se sanean automáticamente
  (limitación de enrutamiento de Mattermost).

Configuración:

- `channels.mattermost.capabilities`: arreglo de cadenas de capacidades. Agrega `"inlineButtons"` para
  habilitar la descripción de la herramienta de botones en el prompt del sistema del agente.
- `channels.mattermost.interactions.callbackBaseUrl`: URL base externa opcional para los
  callbacks de botones (por ejemplo, `https://gateway.example.com`). Úsala cuando Mattermost no pueda
  llegar directamente al Gateway en su host de enlace.
- En configuraciones con varias cuentas, también puedes establecer el mismo campo en
  `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
- Si se omite `interactions.callbackBaseUrl`, OpenClaw deriva la URL de callback a partir de
  `gateway.customBindHost` + `gateway.port`, y luego recurre a `http://localhost:<port>`.
- Regla de accesibilidad: la URL de callback de botones debe ser accesible desde el servidor Mattermost.
  `localhost` solo funciona cuando Mattermost y OpenClaw se ejecutan en el mismo host/namespace de red.
- Si el destino de tu callback es privado/tailnet/interno, agrega su host/dominio a
  `ServiceSettings.AllowedUntrustedInternalConnections` de Mattermost.

### Integración directa con API (scripts externos)

Los scripts externos y los Webhooks pueden publicar botones directamente mediante la API REST de Mattermost
en lugar de pasar por la herramienta `message` del agente. Usa `buildButtonAttachments()` del
Plugin cuando sea posible; si publicas JSON sin procesar, sigue estas reglas:

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
            id: "mybutton01", // solo alfanumérico — ver abajo
            type: "button", // obligatorio, o los clics se ignoran silenciosamente
            name: "Approve", // etiqueta visible
            style: "primary", // opcional: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // debe coincidir con el id del botón (para buscar el nombre)
                action: "approve",
                // ... cualquier campo personalizado ...
                _token: "<hmac>", // consulta la sección HMAC a continuación
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

1. Los attachments van en `props.attachments`, no en `attachments` de nivel superior (se ignoran silenciosamente).
2. Cada acción necesita `type: "button"` — sin esto, los clics se absorben silenciosamente.
3. Cada acción necesita un campo `id` — Mattermost ignora acciones sin ids.
4. El `id` de la acción debe ser **solo alfanumérico** (`[a-zA-Z0-9]`). Los guiones y guiones bajos rompen
   el enrutamiento de acciones del lado del servidor de Mattermost (devuelve 404). Elimínalos antes de usarlo.
5. `context.action_id` debe coincidir con el `id` del botón para que el mensaje de confirmación muestre el
   nombre del botón (por ejemplo, "Approve") en lugar de un id sin procesar.
6. `context.action_id` es obligatorio — el controlador de interacciones devuelve 400 sin él.

**Generación de token HMAC:**

El Gateway verifica los clics en botones con HMAC-SHA256. Los scripts externos deben generar tokens
que coincidan con la lógica de verificación del Gateway:

1. Deriva el secreto a partir del token del bot:
   `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
2. Construye el objeto de contexto con todos los campos **excepto** `_token`.
3. Serializa con **claves ordenadas** y **sin espacios** (el Gateway usa `JSON.stringify`
   con claves ordenadas, lo que produce salida compacta).
4. Firma: `HMAC-SHA256(key=secret, data=serializedContext)`
5. Agrega el resumen hexadecimal resultante como `_token` en el contexto.

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

Errores comunes de HMAC:

- `json.dumps` de Python agrega espacios de forma predeterminada (`{"key": "val"}`). Usa
  `separators=(",", ":")` para coincidir con la salida compacta de JavaScript (`{"key":"val"}`).
- Firma siempre **todos** los campos del contexto (menos `_token`). El Gateway elimina `_token` y luego
  firma todo lo que queda. Firmar un subconjunto provoca un fallo silencioso de verificación.
- Usa `sort_keys=True` — el Gateway ordena las claves antes de firmar, y Mattermost puede
  reordenar los campos de contexto al almacenar la carga.
- Deriva el secreto a partir del token del bot (determinista), no de bytes aleatorios. El secreto
  debe ser el mismo en el proceso que crea los botones y en el Gateway que verifica.

## Adaptador de directorio

El Plugin de Mattermost incluye un adaptador de directorio que resuelve nombres de canales y usuarios
mediante la API de Mattermost. Esto habilita destinos `#channel-name` y `@username` en
`openclaw message send` y en entregas de Cron/Webhooks.

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

- No hay respuestas en canales: asegúrate de que el bot esté en el canal y menciónalo (oncall), usa un prefijo de activación (onchar) o establece `chatmode: "onmessage"`.
- Errores de autenticación: revisa el token del bot, la URL base y si la cuenta está habilitada.
- Problemas con varias cuentas: las variables de entorno solo se aplican a la cuenta `default`.
- Los comandos slash nativos devuelven `Unauthorized: invalid command token.`: OpenClaw
  no aceptó el token del callback. Causas típicas:
  - el registro del comando slash falló o solo se completó parcialmente al iniciar
  - el callback está llegando al Gateway/cuenta incorrectos
  - Mattermost todavía tiene comandos antiguos que apuntan a un destino de callback anterior
  - el Gateway se reinició sin reactivar los comandos slash
- Si los comandos slash nativos dejan de funcionar, revisa los registros para ver
  `mattermost: failed to register slash commands` o
  `mattermost: native slash commands enabled but no commands could be registered`.
- Si se omite `callbackUrl` y los registros advierten que el callback se resolvió a
  `http://127.0.0.1:18789/...`, esa URL probablemente solo sea accesible cuando
  Mattermost se ejecuta en el mismo host/namespace de red que OpenClaw. Configura
  en su lugar un `commands.callbackUrl` explícito y accesible externamente.
- Los botones aparecen como cuadros blancos: el agente puede estar enviando datos de botones mal formados. Verifica que cada botón tenga los campos `text` y `callback_data`.
- Los botones se renderizan, pero los clics no hacen nada: verifica que `AllowedUntrustedInternalConnections` en la configuración del servidor Mattermost incluya `127.0.0.1 localhost`, y que `EnablePostActionIntegration` sea `true` en ServiceSettings.
- Los botones devuelven 404 al hacer clic: el `id` del botón probablemente contiene guiones o guiones bajos. El enrutador de acciones de Mattermost falla con ids no alfanuméricos. Usa solo `[a-zA-Z0-9]`.
- Los registros del Gateway muestran `invalid _token`: no coincide el HMAC. Verifica que firmes todos los campos del contexto (no un subconjunto), uses claves ordenadas y JSON compacto (sin espacios). Consulta la sección HMAC anterior.
- Los registros del Gateway muestran `missing _token in context`: el campo `_token` no está en el contexto del botón. Asegúrate de incluirlo al construir la carga de integración.
- La confirmación muestra el id sin procesar en lugar del nombre del botón: `context.action_id` no coincide con el `id` del botón. Establece ambos con el mismo valor saneado.
- El agente no conoce los botones: agrega `capabilities: ["inlineButtons"]` a la configuración del canal Mattermost.

## Relacionado

- [Resumen de canales](/es/channels) — todos los canales compatibles
- [Emparejamiento](/es/channels/pairing) — autenticación de mensajes directos y flujo de emparejamiento
- [Grupos](/es/channels/groups) — comportamiento de chat grupal y restricción por mención
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y endurecimiento
