---
read_when:
    - Configuración de la compatibilidad con Signal
    - Depuración del envío/recepción de Signal
summary: Soporte de Signal mediante signal-cli (daemon nativo o contenedor bbernhard), rutas de configuración y modelo de número
title: Signal
x-i18n:
    generated_at: "2026-07-03T15:19:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 862afe3764e89aa026d245f57134b8e8e157539f24975ca341d67296fb8852d0
    source_path: channels/signal.md
    workflow: 16
---

Estado: integración de CLI externa. Gateway se comunica con `signal-cli` por HTTP, ya sea mediante un daemon nativo (JSON-RPC + SSE) o el contenedor bbernhard/signal-cli-rest-api (REST + WebSocket).

## Requisitos previos

- OpenClaw instalado en tu servidor (el flujo de Linux de abajo se probó en Ubuntu 24).
- Uno de los siguientes:
  - `signal-cli` disponible en el host (modo nativo), **o**
  - contenedor Docker `bbernhard/signal-cli-rest-api` (modo contenedor).
- Un número de teléfono que pueda recibir un SMS de verificación (para la ruta de registro por SMS).
- Acceso de navegador para el captcha de Signal (`signalcaptchas.org`) durante el registro.

## Configuración rápida (principiantes)

1. Usa un **número de Signal separado** para el bot (recomendado).
2. Instala el Plugin de OpenClaw:

```bash
openclaw plugins install @openclaw/signal
```

3. Instala `signal-cli` (se requiere Java si usas la compilación JVM).
4. Elige una ruta de configuración:
   - **Ruta A (enlace QR):** `signal-cli link -n "OpenClaw"` y escanéalo con Signal.
   - **Ruta B (registro por SMS):** registra un número dedicado con captcha + verificación por SMS.
5. Configura OpenClaw y reinicia el Gateway.
6. Envía un primer DM y aprueba el emparejamiento (`openclaw pairing approve signal <CODE>`).

Configuración mínima:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      cliPath: "signal-cli",
      dmPolicy: "pairing",
      allowFrom: ["+15557654321"],
    },
  },
}
```

Referencia de campos:

| Campo        | Descripción                                                   |
| ------------ | ------------------------------------------------------------- |
| `account`    | Número de teléfono del bot en formato E.164 (`+15551234567`) |
| `cliPath`    | Ruta a `signal-cli` (`signal-cli` si está en `PATH`)          |
| `configPath` | Directorio de configuración de signal-cli pasado como `--config` |
| `dmPolicy`   | Política de acceso a DM (`pairing` recomendado)               |
| `allowFrom`  | Números de teléfono o valores `uuid:<id>` autorizados para DM |

## Qué es

- Canal de Signal mediante `signal-cli` (no libsignal integrado).
- Enrutamiento determinista: las respuestas siempre vuelven a Signal.
- Los DM comparten la sesión principal del agente; los grupos están aislados (`agent:<agentId>:signal:group:<groupId>`).

## Escrituras de configuración

De forma predeterminada, Signal puede escribir actualizaciones de configuración activadas por `/config set|unset` (requiere `commands.config: true`).

Desactívalo con:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## El modelo de número (importante)

- El Gateway se conecta a un **dispositivo Signal** (la cuenta de `signal-cli`).
- Si ejecutas el bot en **tu cuenta personal de Signal**, ignorará tus propios mensajes (protección contra bucles).
- Para "envío un mensaje al bot y responde", usa un **número de bot separado**.

## Ruta de configuración A: enlazar una cuenta de Signal existente (QR)

1. Instala `signal-cli` (compilación JVM o nativa).
2. Enlaza una cuenta de bot:
   - `signal-cli link -n "OpenClaw"` y luego escanea el QR en Signal.
3. Configura Signal e inicia el Gateway.

Ejemplo:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      cliPath: "signal-cli",
      dmPolicy: "pairing",
      allowFrom: ["+15557654321"],
    },
  },
}
```

Compatibilidad con varias cuentas: usa `channels.signal.accounts` con configuración por cuenta y `name` opcional. Consulta [`gateway/configuration`](/es/gateway/config-channels#multi-account-all-channels) para ver el patrón compartido.

## Ruta de configuración B: registrar un número de bot dedicado (SMS, Linux)

Usa esto cuando quieras un número de bot dedicado en lugar de enlazar una cuenta existente de la app Signal.

1. Obtén un número que pueda recibir SMS (o verificación por voz para líneas fijas).
   - Usa un número de bot dedicado para evitar conflictos de cuenta/sesión.
2. Instala `signal-cli` en el host del Gateway:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

Si usas la compilación JVM (`signal-cli-${VERSION}.tar.gz`), instala primero JRE 25+.
Mantén `signal-cli` actualizado; el proyecto upstream señala que las versiones antiguas pueden dejar de funcionar a medida que cambian las API del servidor de Signal.

3. Registra y verifica el número:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Si se requiere captcha:

1. Abre `https://signalcaptchas.org/registration/generate.html`.
2. Completa el captcha, copia el destino del enlace `signalcaptcha://...` desde "Open Signal".
3. Ejecuta desde la misma IP externa que la sesión del navegador cuando sea posible.
4. Ejecuta el registro de nuevo inmediatamente (los tokens de captcha caducan rápido):

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. Configura OpenClaw, reinicia el Gateway y verifica el canal:

```bash
# If you run the gateway as a user systemd service:
systemctl --user restart openclaw-gateway.service

# Then verify:
openclaw doctor
openclaw channels status --probe
```

5. Empareja tu remitente de DM:
   - Envía cualquier mensaje al número del bot.
   - Aprueba el código en el servidor: `openclaw pairing approve signal <PAIRING_CODE>`.
   - Guarda el número del bot como contacto en tu teléfono para evitar "Contacto desconocido".

<Warning>
Registrar una cuenta de número de teléfono con `signal-cli` puede desautenticar la sesión principal de la app Signal para ese número. Prefiere un número de bot dedicado, o usa el modo de enlace QR si necesitas conservar la configuración existente de la app de tu teléfono.
</Warning>

Referencias upstream:

- README de `signal-cli`: `https://github.com/AsamK/signal-cli`
- Flujo de captcha: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Flujo de enlace: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Modo daemon externo (httpUrl)

Si quieres administrar `signal-cli` por tu cuenta (arranques en frío lentos de JVM, inicialización de contenedor o CPU compartidas), ejecuta el daemon por separado y apunta OpenClaw a él:

```json5
{
  channels: {
    signal: {
      httpUrl: "http://127.0.0.1:8080",
      autoStart: false,
    },
  },
}
```

Esto omite el autoarranque y la espera de inicio dentro de OpenClaw. Para arranques lentos al autoarrancar, define `channels.signal.startupTimeoutMs`.

## Modo contenedor (bbernhard/signal-cli-rest-api)

En lugar de ejecutar `signal-cli` de forma nativa, puedes usar el contenedor Docker [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api). Este envuelve `signal-cli` detrás de una API REST y una interfaz WebSocket.

Requisitos:

- El contenedor **debe** ejecutarse con `MODE=json-rpc` para recibir mensajes en tiempo real.
- Registra o enlaza tu cuenta de Signal dentro del contenedor antes de conectar OpenClaw.

Servicio `docker-compose.yml` de ejemplo:

```yaml
signal-cli:
  image: bbernhard/signal-cli-rest-api:latest
  environment:
    MODE: json-rpc
  ports:
    - "8080:8080"
  volumes:
    - signal-cli-data:/home/.local/share/signal-cli
```

Configuración de OpenClaw:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      httpUrl: "http://signal-cli:8080",
      autoStart: false,
      apiMode: "container", // or "auto" to detect automatically
    },
  },
}
```

El campo `apiMode` controla qué protocolo usa OpenClaw:

| Valor         | Comportamiento                                                                     |
| ------------- | ---------------------------------------------------------------------------------- |
| `"auto"`      | (Predeterminado) Sondea ambos transportes; el streaming valida la recepción WebSocket del contenedor |
| `"native"`    | Fuerza signal-cli nativo (JSON-RPC en `/api/v1/rpc`, SSE en `/api/v1/events`)      |
| `"container"` | Fuerza el contenedor bbernhard (REST en `/v2/send`, WebSocket en `/v1/receive/{account}`) |

Cuando `apiMode` es `"auto"`, OpenClaw almacena en caché el modo detectado durante 30 segundos para evitar sondeos repetidos. La recepción del contenedor solo se selecciona para streaming después de que `/v1/receive/{account}` actualiza a WebSocket, lo que requiere `MODE=json-rpc`.

El modo contenedor admite las mismas operaciones del canal Signal que el modo nativo cuando el contenedor expone API equivalentes: envíos, recepciones, adjuntos, indicadores de escritura, confirmaciones de lectura/visto, reacciones, grupos y texto con estilo. OpenClaw traduce sus llamadas RPC nativas de Signal a las cargas REST del contenedor, incluidos los ID de grupo `group.{base64(internal_id)}` y `text_mode: "styled"` para texto con formato.

Notas operativas:

- Usa `autoStart: false` con el modo contenedor. OpenClaw no debe iniciar un daemon nativo cuando `apiMode: "container"` está seleccionado.
- Usa `MODE=json-rpc` para recibir. `MODE=normal` puede hacer que `/v1/about` parezca saludable, pero `/v1/receive/{account}` no actualiza a WebSocket, por lo que OpenClaw no seleccionará streaming de recepción del contenedor en modo `auto`.
- Define `apiMode: "container"` cuando sepas que `httpUrl` apunta a la API REST de bbernhard. Define `apiMode: "native"` cuando sepas que apunta a JSON-RPC/SSE nativo de `signal-cli`. Usa `"auto"` cuando el despliegue pueda variar.
- Las descargas de adjuntos del contenedor respetan los mismos límites de bytes de medios que el modo nativo. Las respuestas demasiado grandes se rechazan antes de almacenarse completamente en búfer cuando el servidor envía `Content-Length`, y durante el streaming en caso contrario.

## Control de acceso (DM + grupos)

DM:

- Predeterminado: `channels.signal.dmPolicy = "pairing"`.
- Los remitentes desconocidos reciben un código de emparejamiento; los mensajes se ignoran hasta que se aprueben (los códigos caducan después de 1 hora).
- Aprueba mediante:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- El emparejamiento es el intercambio de tokens predeterminado para los DM de Signal. Detalles: [Emparejamiento](/es/channels/pairing)
- Los remitentes solo con UUID (desde `sourceUuid`) se almacenan como `uuid:<id>` en `channels.signal.allowFrom`.

Grupos:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` controla qué grupos o remitentes pueden activar respuestas de grupo cuando `allowlist` está definido; las entradas pueden ser ID de grupo de Signal (sin procesar, `group:<id>` o `signal:group:<id>`), números de teléfono de remitentes, valores `uuid:<id>` o `*`.
- `channels.signal.groups["<group-id>" | "*"]` puede sobrescribir el comportamiento de grupo con `requireMention`, `tools` y `toolsBySender`.
- Usa `channels.signal.accounts.<id>.groups` para sobrescrituras por cuenta en configuraciones de varias cuentas.
- Incluir un grupo de Signal en la lista de permitidos mediante `groupAllowFrom` no desactiva por sí solo la compuerta de menciones. Una entrada `channels.signal.groups["<group-id>"]` configurada específicamente procesa cada mensaje de grupo a menos que `requireMention=true` esté definido.
- Nota de runtime: si `channels.signal` falta por completo, el runtime recurre a `groupPolicy="allowlist"` para las comprobaciones de grupo (incluso si `channels.defaults.groupPolicy` está definido).

## Cómo funciona (comportamiento)

- Modo nativo: `signal-cli` se ejecuta como daemon; el Gateway lee eventos mediante SSE.
- Modo contenedor: el Gateway envía mediante API REST y recibe mediante WebSocket.
- Los mensajes entrantes se normalizan en el sobre de canal compartido.
- Las respuestas siempre se enrutan de vuelta al mismo número o grupo.

## Medios + límites

- El texto saliente se divide en fragmentos según `channels.signal.textChunkLimit` (predeterminado 4000).
- Fragmentación opcional por saltos de línea: define `channels.signal.chunkMode="newline"` para dividir por líneas en blanco (límites de párrafo) antes de fragmentar por longitud.
- Adjuntos compatibles (base64 obtenido desde `signal-cli`).
- Los adjuntos de nota de voz usan el nombre de archivo de `signal-cli` como alternativa MIME cuando falta `contentType`, por lo que la transcripción de audio todavía puede clasificar notas de voz AAC.
- Límite de medios predeterminado: `channels.signal.mediaMaxMb` (predeterminado 8).
- Usa `channels.signal.ignoreAttachments` para omitir la descarga de medios.
- El contexto del historial de grupo usa `channels.signal.historyLimit` (o `channels.signal.accounts.*.historyLimit`), con reserva a `messages.groupChat.historyLimit`. Define `0` para desactivarlo (predeterminado 50).

## Escritura + confirmaciones de lectura

- **Indicadores de escritura**: OpenClaw envía señales de escritura mediante `signal-cli sendTyping` y las actualiza mientras se está generando una respuesta.
- **Confirmaciones de lectura**: cuando `channels.signal.sendReadReceipts` es true, OpenClaw reenvía confirmaciones de lectura para los DM permitidos.
- Signal-cli no expone confirmaciones de lectura para grupos.

## Reacciones de estado del ciclo de vida

Establece `messages.statusReactions.enabled: true` para permitir que Signal muestre el ciclo de vida compartido de reacciones queued/thinking/tool/compaction/done/error en turnos entrantes.
Signal usa la marca de tiempo del mensaje entrante como destino de la reacción; las reacciones de grupo se envían con el id de grupo de Signal más el remitente original como autor de destino.

Las reacciones de estado también requieren una reacción de confirmación y un
`messages.ackReactionScope` coincidente (`direct`, `group-all`, `group-mentions` o `all`).
Establece `channels.signal.reactionLevel: "off"` para desactivar las reacciones de estado de Signal.
La acción `react` de la herramienta de mensajes sigue siendo más estricta: requiere
`reactionLevel: "minimal"` o `"extensive"`.

`messages.removeAckAfterReply: true` borra la reacción de estado final después del
tiempo de retención configurado. De lo contrario, Signal restaura la reacción de confirmación inicial después
del estado final done/error.

## Reacciones (herramienta de mensajes)

- Usa `message action=react` con `channel=signal`.
- Destinos: E.164 o UUID del remitente (usa `uuid:<id>` de la salida de emparejamiento; el UUID sin prefijo también funciona).
- `messageId` es la marca de tiempo de Signal del mensaje al que estás reaccionando.
- Las reacciones de grupo requieren `targetAuthor` o `targetAuthorUuid`.

Ejemplos:

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

Configuración:

- `channels.signal.actions.reactions`: activa/desactiva acciones de reacción (valor predeterminado true).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`.
  - `off`/`ack` desactiva las reacciones del agente (la herramienta de mensajes `react` generará un error).
  - `minimal`/`extensive` activa las reacciones del agente y establece el nivel de orientación.
- Sobrescrituras por cuenta: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Reacciones de aprobación

Los avisos de aprobación de ejecución de Signal y de Plugin usan los bloques de enrutamiento de nivel superior `approvals.exec` y
`approvals.plugin`. Signal no tiene un bloque
`channels.signal.execApprovals`.

- `👍` aprueba una vez.
- `👎` deniega.
- Usa `/approve <id> allow-always` cuando una solicitud ofrece aprobación persistente.

La resolución de reacciones de aprobación requiere aprobadores explícitos de Signal de
`channels.signal.allowFrom`, `channels.signal.defaultTo` o los campos coincidentes de nivel de cuenta.
Los avisos de aprobación de ejecución directa en el mismo chat aún pueden suprimir el duplicado de la alternativa local `/approve`
sin aprobadores explícitos; las aprobaciones de grupo sin aprobador mantienen visible la alternativa local.

## Destinos de entrega (CLI/Cron)

- DM: `signal:+15551234567` (o E.164 simple).
- DM por UUID: `uuid:<id>` (o UUID sin prefijo).
- Grupos: `signal:group:<groupId>`.
- Nombres de usuario: `username:<name>` (si tu cuenta de Signal lo admite).

## Alias

Configura alias cuando quieras nombres estables para destinos recurrentes de Signal.
Los alias son solo configuración del lado de OpenClaw; no crean ni editan contactos de Signal.

```json5
{
  channels: {
    signal: {
      aliases: {
        me: "+15557654321",
        jane: "uuid:123e4567-e89b-12d3-a456-426614174000",
        ops: "group:<groupId>",
      },
      defaultTo: "signal:me",
    },
  },
}
```

Usa alias en cualquier lugar donde se acepten destinos de entrega de Signal:

```bash
openclaw message send --channel signal --target signal:ops --message "Deployment is complete"
```

Los alias por cuenta heredan los alias de nivel superior y pueden agregar o sobrescribir nombres:

```json5
{
  channels: {
    signal: {
      aliases: {
        me: "+15557654321",
      },
      accounts: {
        work: {
          aliases: {
            ops: "group:<workGroupId>",
          },
        },
      },
    },
  },
}
```

`openclaw directory peers list --channel signal` y
`openclaw directory groups list --channel signal` muestran los alias configurados. El
directorio de Signal está respaldado por configuración; no consulta en vivo los contactos de Signal ni
modifica la cuenta de Signal.

## Solución de problemas

Ejecuta primero esta secuencia:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Luego confirma el estado de emparejamiento de DM si es necesario:

```bash
openclaw pairing list signal
```

Errores comunes:

- Daemon accesible pero sin respuestas: verifica la configuración de cuenta/daemon (`httpUrl`, `account`) y el modo de recepción.
- DM ignorados: el remitente tiene pendiente la aprobación de emparejamiento.
- Mensajes de grupo ignorados: el filtrado por remitente/mención de grupo bloquea la entrega.
- Errores de validación de configuración después de editar: ejecuta `openclaw doctor --fix`.
- Signal ausente en los diagnósticos: confirma `channels.signal.enabled: true`.

Comprobaciones adicionales:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

Para el flujo de triaje: [/channels/troubleshooting](/es/channels/troubleshooting).

## Notas de seguridad

- `signal-cli` almacena claves de cuenta localmente (normalmente en `~/.local/share/signal-cli/data/`).
- Haz una copia de seguridad del estado de la cuenta de Signal antes de una migración o reconstrucción del servidor.
- Mantén `channels.signal.dmPolicy: "pairing"` salvo que quieras explícitamente un acceso a DM más amplio.
- La verificación por SMS solo es necesaria para flujos de registro o recuperación, pero perder el control del número/cuenta puede complicar el nuevo registro.

## Referencia de configuración (Signal)

Configuración completa: [Configuración](/es/gateway/configuration)

Opciones del proveedor:

- `channels.signal.enabled`: activa/desactiva el inicio del canal.
- `channels.signal.apiMode`: `auto | native | container` (valor predeterminado: auto). Consulta [Modo contenedor](#container-mode-bbernhardsignal-cli-rest-api).
- `channels.signal.account`: E.164 de la cuenta del bot.
- `channels.signal.cliPath`: ruta a `signal-cli`.
- `channels.signal.configPath`: directorio opcional de `signal-cli --config`.
- `channels.signal.httpUrl`: URL completa del daemon (sobrescribe host/puerto).
- `channels.signal.httpHost`, `channels.signal.httpPort`: enlace del daemon (valor predeterminado 127.0.0.1:8080).
- `channels.signal.autoStart`: genera automáticamente el daemon (valor predeterminado true si `httpUrl` no está definido).
- `channels.signal.startupTimeoutMs`: tiempo de espera de inicio en ms (límite 120000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: omite descargas de adjuntos.
- `channels.signal.ignoreStories`: ignora historias del daemon.
- `channels.signal.sendReadReceipts`: reenvía confirmaciones de lectura.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (valor predeterminado: pairing).
- `channels.signal.allowFrom`: lista de permitidos para DM (E.164 o `uuid:<id>`). `open` requiere `"*"`. Signal no tiene nombres de usuario; usa identificadores de teléfono/UUID.
- `channels.signal.aliases`: alias del lado de OpenClaw para destinos de entrega de DM o grupo.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (valor predeterminado: allowlist).
- `channels.signal.groupAllowFrom`: lista de permitidos de grupo; acepta IDs de grupo de Signal (sin formato, `group:<id>` o `signal:group:<id>`), números E.164 de remitente o valores `uuid:<id>`.
- `channels.signal.groups`: sobrescrituras por grupo indexadas por id de grupo de Signal (o `"*"`). Campos admitidos: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: versión por cuenta de `channels.signal.groups` para configuraciones de varias cuentas.
- `channels.signal.accounts.<id>.aliases`: alias por cuenta, fusionados con alias de nivel superior.
- `channels.signal.historyLimit`: máximo de mensajes de grupo que se incluirán como contexto (0 lo desactiva).
- `channels.signal.dmHistoryLimit`: límite de historial de DM en turnos de usuario. Sobrescrituras por usuario: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: tamaño de fragmento saliente (caracteres).
- `channels.signal.chunkMode`: `length` (valor predeterminado) o `newline` para dividir por líneas en blanco (límites de párrafo) antes de fragmentar por longitud.
- `channels.signal.mediaMaxMb`: límite de medios entrantes/salientes (MB).

Opciones globales relacionadas:

- `agents.list[].groupChat.mentionPatterns` (Signal no admite menciones nativas).
- `messages.groupChat.mentionPatterns` (alternativa global).
- `messages.responsePrefix`.

## Relacionado

- [Información general de canales](/es/channels) — todos los canales admitidos
- [Emparejamiento](/es/channels/pairing) — autenticación de DM y flujo de emparejamiento
- [Grupos](/es/channels/groups) — comportamiento de chat grupal y filtrado por mención
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y endurecimiento
