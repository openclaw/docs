---
read_when:
    - Configuración de la compatibilidad con Signal
    - Depuración del envío y la recepción de Signal
summary: Compatibilidad con Signal mediante signal-cli (demonio nativo o contenedor de bbernhard), rutas de configuración y modelo de numeración
title: Signal
x-i18n:
    generated_at: "2026-07-12T14:19:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: db2497d0d6dcdc61cf9f7388929f9ee107602c9ed97bd248e20e67519e878b8b
    source_path: channels/signal.md
    workflow: 16
---

Signal es un plugin de canal descargable (`@openclaw/signal`). El Gateway se comunica con `signal-cli` mediante HTTP: ya sea con el daemon nativo (JSON-RPC + SSE) o con el contenedor [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) (REST + WebSocket). OpenClaw no incorpora libsignal.

## El modelo de números (lea esto primero)

- El Gateway se conecta a un **dispositivo Signal**: la cuenta de `signal-cli`.
- Ejecutar el bot en **su cuenta personal de Signal** hace que ignore sus propios mensajes (protección contra bucles).
- Para que «yo escriba al bot y este responda», use un **número distinto para el bot**.

## Instalación

```bash
openclaw plugins install @openclaw/signal
```

Las especificaciones de plugins sin prefijo prueban primero ClawHub y, después, recurren a npm. Fuerce un origen con `openclaw plugins install clawhub:@openclaw/signal` o `npm:@openclaw/signal`. `plugins install` registra y habilita el plugin; no se necesita un paso `enable` independiente. Consulte [Plugins](/es/tools/plugin) para conocer las reglas generales de instalación.

## Configuración rápida

<Steps>
  <Step title="Elegir un número">
    Use un **número de Signal distinto** para el bot (recomendado).
  </Step>
  <Step title="Instalar el plugin">
    ```bash
    openclaw plugins install @openclaw/signal
    ```
  </Step>
  <Step title="Ejecutar la configuración guiada">
    ```bash
    openclaw channels add
    ```
    El asistente detecta si `signal-cli` está en `PATH` y, si falta, ofrece instalarlo: descarga la compilación nativa oficial de GraalVM en Linux x86-64 o lo instala mediante Homebrew en macOS y otras arquitecturas. Después, solicita el número del bot y la ruta de `signal-cli`.
  </Step>
  <Step title="Vincular o registrar la cuenta">
    - **Vinculación mediante QR (la más rápida):** `signal-cli link -n "OpenClaw"` y, después, escanee el código con Signal. Consulte la [Ruta A](#setup-path-a-link-existing-signal-account-qr).
    - **Registro mediante SMS:** número dedicado con captcha + verificación por SMS. Consulte la [Ruta B](#setup-path-b-register-dedicated-bot-number-sms-linux).

  </Step>
  <Step title="Verificar y emparejar">
    ```bash
    openclaw gateway call channels.status --params '{"probe":true}'
    ```
    Envíe un primer mensaje directo y apruebe el emparejamiento: `openclaw pairing approve signal <CODE>`.
  </Step>
</Steps>

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

| Campo        | Descripción                                                     |
| ------------ | --------------------------------------------------------------- |
| `account`    | Número de teléfono del bot en formato E.164 (`+15551234567`)     |
| `cliPath`    | Ruta a `signal-cli` (`signal-cli` si está en `PATH`)             |
| `configPath` | Directorio de configuración de signal-cli pasado como `--config` |
| `dmPolicy`   | Política de acceso a mensajes directos (se recomienda `pairing`) |
| `allowFrom`  | Números de teléfono o valores `uuid:<id>` autorizados para enviar mensajes directos |

Compatibilidad con varias cuentas: use `channels.signal.accounts` con configuración por cuenta y un `name` opcional. Consulte [Canales con varias cuentas](/es/gateway/config-channels#multi-account-all-channels) para conocer el patrón compartido.

## Qué es

- Enrutamiento determinista: las respuestas siempre regresan a Signal.
- Los mensajes directos comparten la sesión principal del agente; los grupos están aislados (`agent:<agentId>:signal:group:<groupId>`).
- De forma predeterminada, Signal puede escribir actualizaciones de configuración activadas mediante `/config set|unset` (requiere `commands.config: true`). Deshabilítelo con `channels.signal.configWrites: false`.

## Ruta de configuración A: vincular una cuenta de Signal existente (QR)

1. Instale `signal-cli` (compilación para JVM o nativa), o permita que `openclaw channels add` lo instale.
2. Vincule una cuenta de bot: `signal-cli link -n "OpenClaw"` y, después, escanee el código QR en Signal.
3. Configure Signal e inicie el Gateway.

## Ruta de configuración B: registrar un número dedicado para el bot (SMS, Linux)

Use esta opción para un número dedicado al bot en lugar de vincular una cuenta existente de la aplicación Signal. El siguiente flujo se ha probado en Ubuntu 24.

1. Obtenga un número que pueda recibir SMS (o una verificación por voz para líneas fijas). Un número dedicado al bot evita conflictos de cuenta o sesión.
2. Instale `signal-cli` en el host del Gateway:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

Si usa la compilación para JVM (`signal-cli-${VERSION}.tar.gz`), instale primero un JRE. Mantenga `signal-cli` actualizado; el proyecto original advierte que las versiones antiguas pueden dejar de funcionar cuando cambian las API del servidor de Signal.

3. Registre y verifique el número:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Si se requiere un captcha (se necesita acceso a un navegador para completar este paso):

1. Abra `https://signalcaptchas.org/registration/generate.html`.
2. Complete el captcha y copie el destino del enlace `signalcaptcha://...` de "Open Signal".
3. Cuando sea posible, ejecute el comando desde la misma IP externa que la sesión del navegador (los tokens de captcha caducan rápidamente).
4. Registre y verifique de inmediato:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. Configure OpenClaw, reinicie el Gateway y verifique el canal:

```bash
# Si ejecuta el gateway como un servicio systemd de usuario:
systemctl --user restart openclaw-gateway.service

# Después, verifique:
openclaw doctor
openclaw channels status --probe
```

5. Empareje el remitente de sus mensajes directos:
   - Envíe cualquier mensaje al número del bot.
   - Apruébelo en el servidor: `openclaw pairing approve signal <PAIRING_CODE>`.
   - Guarde el número del bot como contacto en su teléfono para evitar "Unknown contact".

<Warning>
Registrar una cuenta de número de teléfono con `signal-cli` puede quitar la autenticación de la sesión principal de la aplicación Signal correspondiente a ese número. Es preferible usar un número dedicado al bot o el modo de vinculación mediante QR para conservar la configuración existente de la aplicación del teléfono.
</Warning>

Referencias del proyecto original:

- README de `signal-cli`: `https://github.com/AsamK/signal-cli`
- Flujo de captcha: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Flujo de vinculación: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Modo de daemon externo (httpUrl)

Para administrar `signal-cli` por su cuenta (arranques en frío lentos de la JVM, inicialización del contenedor o CPU compartidas), ejecute el daemon por separado y dirija OpenClaw a él:

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

Esto omite la creación automática del proceso y la espera de inicio de OpenClaw. Para inicios lentos creados automáticamente, establezca `channels.signal.startupTimeoutMs`.

## Modo de contenedor (bbernhard/signal-cli-rest-api)

En lugar de ejecutar `signal-cli` de forma nativa, use el contenedor Docker [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api), que encapsula `signal-cli` tras una interfaz REST + WebSocket.

Requisitos:

- El contenedor **debe** ejecutarse con `MODE=json-rpc` para recibir mensajes en tiempo real.
- Registre o vincule su cuenta de Signal dentro del contenedor antes de conectar OpenClaw.

Ejemplo de servicio `docker-compose.yml`:

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
      apiMode: "container", // o "auto" para detectarlo automáticamente
    },
  },
}
```

`apiMode` controla qué protocolo usa OpenClaw:

| Valor         | Comportamiento                                                                                  |
| ------------- | ----------------------------------------------------------------------------------------------- |
| `"auto"`      | (Predeterminado) Comprueba ambos transportes; el streaming valida la recepción por WebSocket del contenedor |
| `"native"`    | Fuerza signal-cli nativo (JSON-RPC en `/api/v1/rpc`, SSE en `/api/v1/events`)                   |
| `"container"` | Fuerza el contenedor bbernhard (REST en `/v2/send`, WebSocket en `/v1/receive/{account}`)        |

Cuando `apiMode` es `"auto"`, OpenClaw almacena en caché el modo detectado durante 30 segundos por URL de daemon para evitar comprobaciones repetidas (el modo nativo tiene prioridad cuando ambos transportes funcionan correctamente). La recepción del contenedor solo se selecciona para streaming después de que `/v1/receive/{account}` cambie a WebSocket, lo que requiere `MODE=json-rpc`.

El modo de contenedor admite las mismas operaciones de Signal que el modo nativo cuando el contenedor expone API equivalentes: envíos, recepciones, archivos adjuntos, indicadores de escritura, confirmaciones de lectura/visualización, reacciones, grupos y texto con estilo. OpenClaw convierte las llamadas RPC nativas de Signal en cargas REST del contenedor, incluidos los identificadores de grupo `group.{base64(internal_id)}` y `text_mode: "styled"` para texto con formato.

Notas operativas:

- Use `autoStart: false` con el modo de contenedor; OpenClaw no debe iniciar un daemon nativo cuando se selecciona `apiMode: "container"`.
- Use `MODE=json-rpc` para la recepción. `MODE=normal` puede hacer que `/v1/about` parezca funcionar correctamente, pero `/v1/receive/{account}` no cambiará a WebSocket, por lo que OpenClaw no seleccionará el streaming de recepción del contenedor en modo `auto`.
- Establezca `apiMode: "container"` cuando `httpUrl` apunte a la API REST de bbernhard, `"native"` cuando apunte a JSON-RPC/SSE de `signal-cli` nativo y `"auto"` cuando el despliegue pueda variar.
- Las descargas de archivos adjuntos del contenedor respetan los mismos límites de bytes multimedia que el modo nativo. Las respuestas demasiado grandes se rechazan antes de almacenarse por completo en el búfer cuando el servidor envía `Content-Length` y, de lo contrario, durante el streaming.

## Control de acceso (mensajes directos + grupos)

Mensajes directos:

- Valor predeterminado: `channels.signal.dmPolicy = "pairing"`.
- Los remitentes desconocidos reciben un código de emparejamiento; los mensajes se ignoran hasta que se aprueban (los códigos caducan después de 1 hora).
- Apruebe mediante `openclaw pairing list signal` y `openclaw pairing approve signal <CODE>`.
- El emparejamiento es el intercambio de tokens predeterminado para los mensajes directos de Signal. Detalles: [Emparejamiento](/es/channels/pairing)
- Los remitentes que solo tienen UUID (procedente de `sourceUuid`) se almacenan como `uuid:<id>` en `channels.signal.allowFrom`.

Grupos:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` controla qué grupos o remitentes pueden activar respuestas de grupo cuando se establece `allowlist`; las entradas pueden ser identificadores de grupo de Signal (sin modificar, `group:<id>` o `signal:group:<id>`), números de teléfono de remitentes, valores `uuid:<id>` o `*`.
- `channels.signal.groups["<group-id>" | "*"]` puede anular el comportamiento del grupo mediante `requireMention`, `tools` y `toolsBySender`.
- Use `channels.signal.accounts.<id>.groups` para anulaciones por cuenta en configuraciones con varias cuentas.
- Incluir un grupo en la lista de permitidos mediante `groupAllowFrom` no deshabilita por sí solo el requisito de mención. Una entrada `channels.signal.groups["<group-id>"]` configurada específicamente procesa todos los mensajes del grupo, a menos que se establezca explícitamente `requireMention: true`.
- Nota sobre el entorno de ejecución: si falta por completo `channels.signal`, el entorno de ejecución recurre a `groupPolicy="allowlist"` para las comprobaciones de grupos (aunque se haya establecido `channels.defaults.groupPolicy`).

## Cómo funciona (comportamiento)

- Modo nativo: `signal-cli` se ejecuta como daemon; el Gateway lee los eventos mediante SSE.
- Modo de contenedor: el Gateway envía mediante la API REST y recibe mediante WebSocket.
- Los mensajes entrantes se normalizan en el sobre de canal compartido.
- Las respuestas siempre se enrutan al mismo número o grupo.
- Las respuestas a mensajes entrantes incluyen metadatos nativos de cita de Signal cuando el backend acepta la marca de tiempo y el autor del mensaje entrante; si faltan los metadatos de cita o se rechazan, OpenClaw envía la respuesta como un mensaje normal.
- Configure el uso de citas nativas mediante `channels.signal.replyToMode = off | first | all | batched` o `channels.signal.replyToModeByChatType.direct/group` para anulaciones por tipo de chat. Los valores de cuenta en `channels.signal.accounts.<id>` tienen prioridad.

## Multimedia + límites

- El texto saliente se divide en fragmentos según `channels.signal.textChunkLimit` (valor predeterminado: 4000).
- División opcional por saltos de línea: establezca `channels.signal.chunkMode="newline"` para dividir por líneas en blanco (límites de párrafo) antes de dividir por longitud.
- Se admiten archivos adjuntos (obtenidos de `signal-cli` en base64).
- Los archivos adjuntos de notas de voz utilizan el nombre de archivo de `signal-cli` como alternativa para determinar el tipo MIME cuando falta `contentType`, de modo que la transcripción de audio aún pueda clasificar las notas de voz AAC.
- Límite predeterminado de contenido multimedia: `channels.signal.mediaMaxMb` (valor predeterminado: 8).
- Utilice `channels.signal.ignoreAttachments` para omitir la descarga de contenido multimedia.
- El contexto del historial de grupos utiliza `channels.signal.historyLimit` (o `channels.signal.accounts.*.historyLimit`) y, como alternativa, `messages.groupChat.historyLimit`. Establezca `0` para desactivarlo (valor predeterminado: 50).

## Indicadores de escritura y confirmaciones de lectura

- **Indicadores de escritura**: OpenClaw envía señales de escritura mediante `signal-cli sendTyping` y las actualiza mientras se genera una respuesta.
- **Confirmaciones de lectura**: cuando `channels.signal.sendReadReceipts` es true, OpenClaw reenvía las confirmaciones de lectura de los mensajes directos permitidos.
- `signal-cli` no proporciona confirmaciones de lectura para grupos.

## Reacciones de estado del ciclo de vida

Establezca `messages.statusReactions.enabled: true` para permitir que Signal muestre el ciclo compartido de reacciones de en cola/pensando/herramienta/compaction/finalizado/error en los turnos entrantes. Signal utiliza la marca de tiempo del mensaje entrante como destino de la reacción; las reacciones de grupo se envían con el ID de grupo de Signal y el remitente original como autor de destino.

Las reacciones de estado también requieren una reacción de confirmación y un valor coincidente de `messages.ackReactionScope` (`direct`, `group-all`, `group-mentions` o `all`). Establezca `channels.signal.reactionLevel: "off"` para desactivar las reacciones de estado de Signal.

`messages.removeAckAfterReply: true` elimina la reacción de estado final una vez transcurrido el tiempo de permanencia configurado. De lo contrario, Signal restaura la reacción de confirmación inicial después del estado final de finalización/error.

## Reacciones (herramienta de mensajes)

Utilice `message action=react` con `channel=signal`.

- Destinos: número E.164 o UUID del remitente (utilice `uuid:<id>` de la salida de vinculación; también funciona un UUID sin prefijo).
- `messageId` es la marca de tiempo de Signal del mensaje al que se reacciona.
- Las reacciones de grupo requieren `targetAuthor` o `targetAuthorUuid`.

```text
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

Configuración:

- `channels.signal.actions.reactions`: activa o desactiva las acciones de reacción (valor predeterminado: true).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive` (valor predeterminado: `minimal`).
  - `off`/`ack` desactiva las reacciones del agente (la acción `react` de la herramienta de mensajes produce un error).
  - `minimal`/`extensive` activa las reacciones del agente y establece el nivel de orientación.
- Sustituciones por cuenta: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Reacciones de aprobación

Las solicitudes de aprobación de ejecución y Plugin de Signal utilizan los bloques de enrutamiento de nivel superior `approvals.exec` y `approvals.plugin`. Signal no tiene ningún bloque `channels.signal.execApprovals`.

- `👍` aprueba una vez.
- `👎` rechaza.
- Utilice `/approve <id> allow-always` cuando una solicitud ofrezca aprobación persistente.

La resolución de reacciones de aprobación requiere aprobadores explícitos de Signal en `channels.signal.allowFrom`, `channels.signal.defaultTo` o los campos correspondientes de nivel de cuenta. Las solicitudes de aprobación de ejecución directa en el mismo chat aún pueden ocultar la alternativa local duplicada `/approve` sin aprobadores explícitos; las aprobaciones de grupo sin aprobadores mantienen visible la alternativa local.

## Destinos de entrega (CLI/Cron)

- Mensajes directos: `signal:+15551234567` (o un número E.164 sin prefijo).
- Mensajes directos por UUID: `uuid:<id>` (o un UUID sin prefijo).
- Grupos: `signal:group:<groupId>`.
- Nombres de usuario: `username:<name>` (si la cuenta de Signal los admite).

## Alias

Configure alias para asignar nombres estables a destinos recurrentes de Signal. Los alias solo forman parte de la configuración de OpenClaw; no crean ni editan contactos de Signal.

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

Utilice alias en cualquier lugar donde se acepten destinos de entrega de Signal:

```bash
openclaw message send --channel signal --target signal:ops --message "La implementación ha finalizado"
```

Los alias por cuenta heredan los alias de nivel superior y pueden añadir o sustituir nombres:

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

`openclaw directory peers list --channel signal` y `openclaw directory groups list --channel signal` muestran los alias configurados. El directorio de Signal se basa en la configuración; no consulta en tiempo real los contactos de Signal ni modifica la cuenta de Signal.

## Solución de problemas

Ejecute primero esta secuencia:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Después, confirme el estado de vinculación de los mensajes directos si es necesario:

```bash
openclaw pairing list signal
```

Errores habituales:

- El daemon está disponible, pero no hay respuestas: compruebe la configuración de la cuenta y del daemon (`httpUrl`, `account`), así como el modo de recepción.
- Se ignoran los mensajes directos: el remitente tiene pendiente la aprobación de vinculación.
- Se ignoran los mensajes de grupo: las restricciones por remitente o mención del grupo bloquean la entrega.
- Errores de validación de la configuración después de editarla: ejecute `openclaw doctor --fix`.
- Signal no aparece en los diagnósticos: confirme que `channels.signal.enabled: true`.

Comprobaciones adicionales:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

Para consultar el flujo de diagnóstico: [Solución de problemas de canales](/es/channels/troubleshooting).

## Notas de seguridad

- `signal-cli` almacena localmente las claves de la cuenta (normalmente en `~/.local/share/signal-cli/data/`).
- Haga una copia de seguridad del estado de la cuenta de Signal antes de migrar o reconstruir el servidor.
- Mantenga `channels.signal.dmPolicy: "pairing"` salvo que se desee explícitamente un acceso más amplio a los mensajes directos.
- La verificación por SMS solo es necesaria para los flujos de registro o recuperación, pero perder el control del número o de la cuenta puede complicar un nuevo registro.

## Referencia de configuración (Signal)

Configuración completa: [Configuración](/es/gateway/configuration)

Opciones del proveedor:

- `channels.signal.enabled`: activa o desactiva el inicio del canal.
- `channels.signal.apiMode`: `auto | native | container` (valor predeterminado: auto). Consulte [Modo de contenedor](#container-mode-bbernhardsignal-cli-rest-api).
- `channels.signal.account`: número E.164 de la cuenta del bot.
- `channels.signal.cliPath`: ruta a `signal-cli`.
- `channels.signal.configPath`: directorio opcional para `signal-cli --config`.
- `channels.signal.httpUrl`: URL completa del daemon (sustituye al host y al puerto).
- `channels.signal.httpHost`, `channels.signal.httpPort`: dirección y puerto de escucha del daemon (valor predeterminado: `127.0.0.1:8080`).
- `channels.signal.autoStart`: inicia automáticamente el daemon (valor predeterminado: true si `httpUrl` no está establecido).
- `channels.signal.startupTimeoutMs`: tiempo de espera de inicio en ms (mínimo 1000, límite 120000; valor predeterminado: 30000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: omite las descargas de archivos adjuntos.
- `channels.signal.ignoreStories`: ignora las historias del daemon.
- `channels.signal.sendReadReceipts`: reenvía las confirmaciones de lectura.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (valor predeterminado: pairing).
- `channels.signal.allowFrom`: lista de permitidos para mensajes directos (E.164 o `uuid:<id>`). `open` requiere `"*"`. Signal no tiene nombres de usuario; utilice identificadores de teléfono o UUID.
- `channels.signal.aliases`: alias de OpenClaw para destinos de entrega de mensajes directos o de grupo.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (valor predeterminado: allowlist).
- `channels.signal.groupAllowFrom`: lista de permitidos del grupo; acepta identificadores de grupo de Signal (sin prefijo, `group:<id>` o `signal:group:<id>`), números E.164 de remitentes o valores `uuid:<id>`.
- `channels.signal.groups`: sustituciones por grupo indexadas por el ID de grupo de Signal (o `"*"`). Campos admitidos: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: versión por cuenta de `channels.signal.groups` para configuraciones con varias cuentas.
- `channels.signal.accounts.<id>.aliases`: alias por cuenta, combinados con los alias de nivel superior.
- `channels.signal.replyToMode`: modo de cita de respuesta nativa, `off | first | all | batched` (valor predeterminado: `all`).
- `channels.signal.replyToModeByChatType.direct`, `channels.signal.replyToModeByChatType.group`: sustituciones de citas de respuesta nativa por tipo de chat.
- `channels.signal.accounts.<id>.replyToMode`, `channels.signal.accounts.<id>.replyToModeByChatType.direct`, `channels.signal.accounts.<id>.replyToModeByChatType.group`: sustituciones de citas de respuesta por cuenta.
- `channels.signal.historyLimit`: número máximo de mensajes de grupo que se incluyen como contexto (0 lo desactiva).
- `channels.signal.dmHistoryLimit`: límite del historial de mensajes directos en turnos del usuario. Sustituciones por usuario: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: tamaño de los fragmentos salientes en caracteres (valor predeterminado: 4000).
- `channels.signal.chunkMode`: `length` (valor predeterminado) o `newline` para dividir por líneas en blanco (límites de párrafo) antes de dividir por longitud.
- `channels.signal.mediaMaxMb`: límite de contenido multimedia entrante y saliente en MB (valor predeterminado: 8).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive` (valor predeterminado: `minimal`). Consulte [Reacciones](#reactions-message-tool).
- `channels.signal.reactionNotifications`: `off | own | all | allowlist` (valor predeterminado: `own`): determina cuándo se notifica al agente sobre las reacciones entrantes de otras personas.
- `channels.signal.reactionAllowlist`: remitentes cuyas reacciones notifican al agente cuando `reactionNotifications: "allowlist"`.
- `channels.signal.blockStreaming`, `channels.signal.blockStreamingCoalesce`: controles de transmisión en modo de bloques compartidos entre canales. Consulte [Transmisión](/es/concepts/streaming).

Opciones globales relacionadas:

- `agents.list[].groupChat.mentionPatterns` (Signal no admite menciones nativas).
- `messages.groupChat.mentionPatterns` (alternativa global).
- `messages.responsePrefix`.

## Contenido relacionado

- [Descripción general de los canales](/es/channels): todos los canales admitidos
- [Vinculación](/es/channels/pairing): autenticación de mensajes directos y flujo de vinculación
- [Grupos](/es/channels/groups): comportamiento de los chats de grupo y restricciones de menciones
- [Enrutamiento de canales](/es/channels/channel-routing): enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security): modelo de acceso y protección
