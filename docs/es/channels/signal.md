---
read_when:
    - Configuración del soporte para Signal
    - Depurar el envío y la recepción de Signal
summary: Compatibilidad con Signal mediante signal-cli (daemon nativo o contenedor bbernhard), rutas de configuración y modelo de número
title: Signal
x-i18n:
    generated_at: "2026-07-05T11:03:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 95e1095c142a1d5137676f803430826f1b45a70ed41dabf8b17dcdca1605ad2f
    source_path: channels/signal.md
    workflow: 16
---

Signal es un Plugin de canal descargable (`@openclaw/signal`). El Gateway se comunica con `signal-cli` por HTTP: ya sea el daemon nativo (JSON-RPC + SSE) o el contenedor [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) (REST + WebSocket). OpenClaw no incorpora libsignal.

## El modelo de número (lee esto primero)

- El Gateway se conecta a un **dispositivo de Signal**: la cuenta de `signal-cli`.
- Ejecutar el bot en **tu cuenta personal de Signal** hace que ignore tus propios mensajes (protección contra bucles).
- Para "le escribo al bot y responde", usa un **número de bot separado**.

## Instalación

```bash
openclaw plugins install @openclaw/signal
```

Las especificaciones de Plugin sin prefijo prueban primero ClawHub y luego recurren a npm. Fuerza un origen con `openclaw plugins install clawhub:@openclaw/signal` o `npm:@openclaw/signal`. `plugins install` registra y habilita el Plugin; no hace falta un paso `enable` separado. Consulta [Plugins](/es/tools/plugin) para las reglas generales de instalación.

## Configuración rápida

<Steps>
  <Step title="Elegir un número">
    Usa un **número de Signal separado** para el bot (recomendado).
  </Step>
  <Step title="Instalar el Plugin">
    ```bash
    openclaw plugins install @openclaw/signal
    ```
  </Step>
  <Step title="Ejecutar la configuración guiada">
    ```bash
    openclaw channels add
    ```
    El asistente detecta si `signal-cli` está en `PATH` y, si falta, ofrece instalarlo: descarga la compilación nativa oficial de GraalVM en Linux x86-64, o lo instala mediante Homebrew en macOS y otras arquitecturas. Luego solicita el número del bot y la ruta de `signal-cli`.
  </Step>
  <Step title="Vincular o registrar la cuenta">
    - **Vinculación por QR (la más rápida):** `signal-cli link -n "OpenClaw"`, luego escanea con Signal. Consulta [Ruta A](#setup-path-a-link-existing-signal-account-qr).
    - **Registro por SMS:** número dedicado con captcha + verificación por SMS. Consulta [Ruta B](#setup-path-b-register-dedicated-bot-number-sms-linux).

  </Step>
  <Step title="Verificar y emparejar">
    ```bash
    openclaw gateway call channels.status --params '{"probe":true}'
    ```
    Envía un primer MD y aprueba el emparejamiento: `openclaw pairing approve signal <CODE>`.
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

| Campo        | Descripción                                                       |
| ------------ | ----------------------------------------------------------------- |
| `account`    | Número de teléfono del bot en formato E.164 (`+15551234567`)      |
| `cliPath`    | Ruta a `signal-cli` (`signal-cli` si está en `PATH`)              |
| `configPath` | Directorio de configuración de signal-cli pasado como `--config`  |
| `dmPolicy`   | Política de acceso a MD (`pairing` recomendado)                   |
| `allowFrom`  | Números de teléfono o valores `uuid:<id>` autorizados a enviar MD |

Compatibilidad con varias cuentas: usa `channels.signal.accounts` con configuración por cuenta y `name` opcional. Consulta [Canales multicuenta](/es/gateway/config-channels#multi-account-all-channels) para el patrón compartido.

## Qué es

- Enrutamiento determinista: las respuestas siempre vuelven a Signal.
- Los MD comparten la sesión principal del agente; los grupos están aislados (`agent:<agentId>:signal:group:<groupId>`).
- De forma predeterminada, Signal puede escribir actualizaciones de configuración activadas por `/config set|unset` (requiere `commands.config: true`). Desactívalo con `channels.signal.configWrites: false`.

## Ruta de configuración A: vincular una cuenta existente de Signal (QR)

1. Instala `signal-cli` (JVM o compilación nativa), o deja que `openclaw channels add` lo instale por ti.
2. Vincula una cuenta de bot: `signal-cli link -n "OpenClaw"`, luego escanea el QR en Signal.
3. Configura Signal e inicia el Gateway.

## Ruta de configuración B: registrar un número dedicado de bot (SMS, Linux)

Usa esto para un número dedicado de bot en lugar de vincular una cuenta existente de la aplicación Signal. El flujo siguiente está probado en Ubuntu 24.

1. Obtén un número que pueda recibir SMS (o verificación por voz para líneas fijas). Un número dedicado de bot evita conflictos de cuenta/sesión.
2. Instala `signal-cli` en el host del Gateway:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

Si usas la compilación JVM (`signal-cli-${VERSION}.tar.gz`), instala primero un JRE. Mantén `signal-cli` actualizado; el proyecto upstream advierte que las versiones antiguas pueden romperse cuando cambian las API del servidor de Signal.

3. Registra y verifica el número:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Si se requiere captcha (se necesita acceso al navegador para completar este paso):

1. Abre `https://signalcaptchas.org/registration/generate.html`.
2. Completa el captcha, copia el destino del enlace `signalcaptcha://...` desde "Open Signal".
3. Ejecuta desde la misma IP externa que la sesión del navegador cuando sea posible (los tokens de captcha caducan rápidamente).
4. Registra y verifica de inmediato:

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

5. Empareja tu remitente de MD:
   - Envía cualquier mensaje al número del bot.
   - Aprueba en el servidor: `openclaw pairing approve signal <PAIRING_CODE>`.
   - Guarda el número del bot como contacto en tu teléfono para evitar "Unknown contact".

<Warning>
Registrar una cuenta de número de teléfono con `signal-cli` puede desautenticar la sesión principal de la aplicación Signal para ese número. Prefiere un número dedicado de bot, o usa el modo de vinculación por QR para conservar la configuración de tu aplicación telefónica existente.
</Warning>

Referencias upstream:

- README de `signal-cli`: `https://github.com/AsamK/signal-cli`
- Flujo de captcha: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Flujo de vinculación: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Modo de daemon externo (httpUrl)

Para gestionar `signal-cli` tú mismo (arranques en frío lentos de JVM, inicialización de contenedor, CPU compartidas), ejecuta el daemon por separado y apunta OpenClaw a él:

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

Esto omite el inicio automático y la espera de arranque de OpenClaw. Para inicios lentos con arranque automático, establece `channels.signal.startupTimeoutMs`.

## Modo de contenedor (bbernhard/signal-cli-rest-api)

En lugar de ejecutar `signal-cli` de forma nativa, usa el contenedor Docker [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api), que envuelve `signal-cli` detrás de una interfaz REST + WebSocket.

Requisitos:

- El contenedor **debe** ejecutarse con `MODE=json-rpc` para recibir mensajes en tiempo real.
- Registra o vincula tu cuenta de Signal dentro del contenedor antes de conectar OpenClaw.

Servicio de ejemplo `docker-compose.yml`:

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

`apiMode` controla qué protocolo usa OpenClaw:

| Valor         | Comportamiento                                                                              |
| ------------- | ------------------------------------------------------------------------------------------- |
| `"auto"`      | (Predeterminado) Prueba ambos transportes; el streaming valida la recepción por WebSocket del contenedor |
| `"native"`    | Fuerza signal-cli nativo (JSON-RPC en `/api/v1/rpc`, SSE en `/api/v1/events`)               |
| `"container"` | Fuerza el contenedor bbernhard (REST en `/v2/send`, WebSocket en `/v1/receive/{account}`)   |

Cuando `apiMode` es `"auto"`, OpenClaw almacena en caché el modo detectado durante 30 segundos por URL de daemon para evitar sondeos repetidos (nativo gana cuando ambos transportes están sanos). La recepción por contenedor solo se selecciona para streaming después de que `/v1/receive/{account}` se actualiza a WebSocket, lo que requiere `MODE=json-rpc`.

El modo de contenedor admite las mismas operaciones de Signal que el modo nativo cuando el contenedor expone API equivalentes: envíos, recepciones, adjuntos, indicadores de escritura, confirmaciones de lectura/visto, reacciones, grupos y texto con estilo. OpenClaw traduce llamadas RPC nativas de Signal a cargas REST del contenedor, incluidos los ID de grupo `group.{base64(internal_id)}` y `text_mode: "styled"` para texto con formato.

Notas operativas:

- Usa `autoStart: false` con el modo de contenedor; OpenClaw no debería iniciar un daemon nativo cuando se selecciona `apiMode: "container"`.
- Usa `MODE=json-rpc` para recibir. `MODE=normal` puede hacer que `/v1/about` parezca sano, pero `/v1/receive/{account}` no se actualizará a WebSocket, por lo que OpenClaw no seleccionará el streaming de recepción por contenedor en modo `auto`.
- Establece `apiMode: "container"` cuando `httpUrl` apunta a la API REST de bbernhard, `"native"` cuando apunta a JSON-RPC/SSE nativos de `signal-cli`, y `"auto"` cuando el despliegue pueda variar.
- Las descargas de adjuntos del contenedor respetan los mismos límites de bytes de medios que el modo nativo. Las respuestas sobredimensionadas se rechazan antes de almacenarse completamente en búfer cuando el servidor envía `Content-Length`, y durante el streaming en caso contrario.

## Control de acceso (MD + grupos)

MD:

- Predeterminado: `channels.signal.dmPolicy = "pairing"`.
- Los remitentes desconocidos reciben un código de emparejamiento; los mensajes se ignoran hasta que se aprueban (los códigos caducan después de 1 hora).
- Aprueba mediante `openclaw pairing list signal` y `openclaw pairing approve signal <CODE>`.
- El emparejamiento es el intercambio de tokens predeterminado para los MD de Signal. Detalles: [Emparejamiento](/es/channels/pairing)
- Los remitentes solo con UUID (desde `sourceUuid`) se almacenan como `uuid:<id>` en `channels.signal.allowFrom`.

Grupos:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` controla qué grupos o remitentes pueden activar respuestas de grupo cuando se establece `allowlist`; las entradas pueden ser ID de grupo de Signal (sin procesar, `group:<id>` o `signal:group:<id>`), números de teléfono de remitente, valores `uuid:<id>` o `*`.
- `channels.signal.groups["<group-id>" | "*"]` puede sobrescribir el comportamiento de grupo con `requireMention`, `tools` y `toolsBySender`.
- Usa `channels.signal.accounts.<id>.groups` para sobrescrituras por cuenta en configuraciones multicuenta.
- Incluir un grupo en la lista de permitidos mediante `groupAllowFrom` no desactiva por sí solo el requisito de mención. Una entrada específicamente configurada de `channels.signal.groups["<group-id>"]` procesa cada mensaje de grupo salvo que `requireMention: true` se establezca explícitamente.
- Nota de runtime: si `channels.signal` falta por completo, el runtime recurre a `groupPolicy="allowlist"` para las comprobaciones de grupo (aunque `channels.defaults.groupPolicy` esté establecido).

## Cómo funciona (comportamiento)

- Modo nativo: `signal-cli` se ejecuta como daemon; el Gateway lee eventos mediante SSE.
- Modo de contenedor: el Gateway envía mediante la API REST y recibe mediante WebSocket.
- Los mensajes entrantes se normalizan en el sobre de canal compartido.
- Las respuestas siempre se enrutan de vuelta al mismo número o grupo.

## Medios + límites

- El texto saliente se divide en fragmentos según `channels.signal.textChunkLimit` (predeterminado 4000).
- División opcional por saltos de línea: define `channels.signal.chunkMode="newline"` para dividir por líneas en blanco (límites de párrafo) antes de dividir por longitud.
- Los adjuntos son compatibles (base64 obtenido desde `signal-cli`).
- Los adjuntos de notas de voz usan el nombre de archivo de `signal-cli` como reserva MIME cuando falta `contentType`, para que la transcripción de audio aún pueda clasificar notas de voz AAC.
- Límite de medios predeterminado: `channels.signal.mediaMaxMb` (predeterminado 8).
- Usa `channels.signal.ignoreAttachments` para omitir la descarga de medios.
- El contexto de historial de grupo usa `channels.signal.historyLimit` (o `channels.signal.accounts.*.historyLimit`), con reserva en `messages.groupChat.historyLimit`. Define `0` para desactivarlo (predeterminado 50).

## Indicadores de escritura + confirmaciones de lectura

- **Indicadores de escritura**: OpenClaw envía señales de escritura mediante `signal-cli sendTyping` y las actualiza mientras se genera una respuesta.
- **Confirmaciones de lectura**: cuando `channels.signal.sendReadReceipts` es true, OpenClaw reenvía confirmaciones de lectura para MD permitidos.
- `signal-cli` no expone confirmaciones de lectura para grupos.

## Reacciones de estado del ciclo de vida

Define `messages.statusReactions.enabled: true` para permitir que Signal muestre el ciclo de vida compartido de reacciones en turnos entrantes: en cola/pensando/herramienta/compaction/hecho/error. Signal usa la marca de tiempo del mensaje entrante como objetivo de la reacción; las reacciones de grupo se envían con el ID de grupo de Signal más el remitente original como autor objetivo.

Las reacciones de estado también requieren una reacción de confirmación y un `messages.ackReactionScope` coincidente (`direct`, `group-all`, `group-mentions` o `all`). Define `channels.signal.reactionLevel: "off"` para desactivar las reacciones de estado de Signal.

`messages.removeAckAfterReply: true` borra la reacción de estado final después del tiempo de retención configurado. De lo contrario, Signal restaura la reacción de confirmación inicial después del estado final hecho/error.

## Reacciones (herramienta de mensajes)

Usa `message action=react` con `channel=signal`.

- Objetivos: E.164 o UUID del remitente (usa `uuid:<id>` de la salida de emparejamiento; un UUID sin prefijo también funciona).
- `messageId` es la marca de tiempo de Signal del mensaje al que reaccionas.
- Las reacciones de grupo requieren `targetAuthor` o `targetAuthorUuid`.

```text
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

Configuración:

- `channels.signal.actions.reactions`: activa/desactiva acciones de reacción (predeterminado true).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive` (predeterminado `minimal`).
  - `off`/`ack` desactiva las reacciones del agente (la herramienta de mensajes `react` genera errores).
  - `minimal`/`extensive` activa las reacciones del agente y define el nivel de orientación.
- Sobrescrituras por cuenta: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Reacciones de aprobación

Las solicitudes de aprobación de exec y Plugin de Signal usan los bloques de enrutamiento de nivel superior `approvals.exec` y `approvals.plugin`. Signal no tiene un bloque `channels.signal.execApprovals`.

- `👍` aprueba una vez.
- `👎` deniega.
- Usa `/approve <id> allow-always` cuando una solicitud ofrece aprobación persistente.

La resolución de reacciones de aprobación requiere aprobadores explícitos de Signal desde `channels.signal.allowFrom`, `channels.signal.defaultTo` o los campos coincidentes a nivel de cuenta. Las solicitudes de aprobación exec directas en el mismo chat todavía pueden suprimir la reserva local duplicada `/approve` sin aprobadores explícitos; las aprobaciones de grupo sin aprobador mantienen visible la reserva local.

## Destinos de entrega (CLI/cron)

- MD: `signal:+15551234567` (o E.164 simple).
- MD por UUID: `uuid:<id>` (o UUID sin prefijo).
- Grupos: `signal:group:<groupId>`.
- Nombres de usuario: `username:<name>` (si tu cuenta de Signal lo admite).

## Alias

Configura alias para nombres estables en destinos recurrentes de Signal. Los alias son solo configuración del lado de OpenClaw; no crean ni editan contactos de Signal.

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

`openclaw directory peers list --channel signal` y `openclaw directory groups list --channel signal` listan los alias configurados. El directorio de Signal está respaldado por configuración; no consulta en vivo los contactos de Signal ni modifica la cuenta de Signal.

## Solución de problemas

Ejecuta primero esta escalera:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Luego confirma el estado de emparejamiento de MD si es necesario:

```bash
openclaw pairing list signal
```

Fallos comunes:

- Demonio accesible pero sin respuestas: verifica la configuración de cuenta/demonio (`httpUrl`, `account`) y el modo de recepción.
- MD ignorados: el remitente tiene aprobación de emparejamiento pendiente.
- Mensajes de grupo ignorados: el filtrado por remitente/mención de grupo bloquea la entrega.
- Errores de validación de configuración después de ediciones: ejecuta `openclaw doctor --fix`.
- Signal falta en los diagnósticos: confirma `channels.signal.enabled: true`.

Comprobaciones adicionales:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

Para el flujo de triaje: [Solución de problemas de canales](/es/channels/troubleshooting).

## Notas de seguridad

- `signal-cli` almacena claves de cuenta localmente (normalmente en `~/.local/share/signal-cli/data/`).
- Haz una copia de seguridad del estado de la cuenta de Signal antes de una migración o reconstrucción del servidor.
- Mantén `channels.signal.dmPolicy: "pairing"` salvo que quieras explícitamente un acceso más amplio a MD.
- La verificación por SMS solo es necesaria para flujos de registro o recuperación, pero perder el control del número/la cuenta puede complicar el nuevo registro.

## Referencia de configuración (Signal)

Configuración completa: [Configuración](/es/gateway/configuration)

Opciones del proveedor:

- `channels.signal.enabled`: activa/desactiva el inicio del canal.
- `channels.signal.apiMode`: `auto | native | container` (predeterminado: auto). Consulta [Modo contenedor](#container-mode-bbernhardsignal-cli-rest-api).
- `channels.signal.account`: E.164 para la cuenta del bot.
- `channels.signal.cliPath`: ruta a `signal-cli`.
- `channels.signal.configPath`: directorio opcional de `signal-cli --config`.
- `channels.signal.httpUrl`: URL completa del demonio (sobrescribe host/puerto).
- `channels.signal.httpHost`, `channels.signal.httpPort`: enlace del demonio (predeterminado `127.0.0.1:8080`).
- `channels.signal.autoStart`: inicia automáticamente el demonio (predeterminado true si `httpUrl` no está definido).
- `channels.signal.startupTimeoutMs`: tiempo de espera de inicio en ms (mín. 1000, límite 120000; predeterminado 30000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: omite descargas de adjuntos.
- `channels.signal.ignoreStories`: ignora historias del demonio.
- `channels.signal.sendReadReceipts`: reenvía confirmaciones de lectura.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (predeterminado: pairing).
- `channels.signal.allowFrom`: lista de permitidos para MD (E.164 o `uuid:<id>`). `open` requiere `"*"`. Signal no tiene nombres de usuario; usa IDs de teléfono/UUID.
- `channels.signal.aliases`: alias del lado de OpenClaw para destinos de entrega de MD o grupo.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (predeterminado: allowlist).
- `channels.signal.groupAllowFrom`: lista de permitidos de grupo; acepta IDs de grupo de Signal (sin procesar, `group:<id>` o `signal:group:<id>`), números E.164 de remitente o valores `uuid:<id>`.
- `channels.signal.groups`: sobrescrituras por grupo indexadas por ID de grupo de Signal (o `"*"`). Campos compatibles: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: versión por cuenta de `channels.signal.groups` para configuraciones con varias cuentas.
- `channels.signal.accounts.<id>.aliases`: alias por cuenta, fusionados con los alias de nivel superior.
- `channels.signal.historyLimit`: máximo de mensajes de grupo que se incluirán como contexto (0 desactiva).
- `channels.signal.dmHistoryLimit`: límite de historial de MD en turnos de usuario. Sobrescrituras por usuario: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: tamaño de fragmento saliente en caracteres (predeterminado 4000).
- `channels.signal.chunkMode`: `length` (predeterminado) o `newline` para dividir por líneas en blanco (límites de párrafo) antes de dividir por longitud.
- `channels.signal.mediaMaxMb`: límite de medios entrantes/salientes en MB (predeterminado 8).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive` (predeterminado `minimal`). Consulta [Reacciones](#reactions-message-tool).
- `channels.signal.reactionNotifications`: `off | own | all | allowlist` (predeterminado `own`) - cuándo se notifica al agente sobre reacciones entrantes de otras personas.
- `channels.signal.reactionAllowlist`: remitentes cuyas reacciones notifican al agente cuando `reactionNotifications: "allowlist"`.
- `channels.signal.blockStreaming`, `channels.signal.blockStreamingCoalesce`: controles de streaming en modo bloque compartidos entre canales. Consulta [Streaming](/es/concepts/streaming).

Opciones globales relacionadas:

- `agents.list[].groupChat.mentionPatterns` (Signal no admite menciones nativas).
- `messages.groupChat.mentionPatterns` (reserva global).
- `messages.responsePrefix`.

## Relacionado

- [Resumen de canales](/es/channels) - todos los canales compatibles
- [Emparejamiento](/es/channels/pairing) - autenticación de MD y flujo de emparejamiento
- [Grupos](/es/channels/groups) - comportamiento del chat de grupo y filtrado por mención
- [Enrutamiento de canales](/es/channels/channel-routing) - enrutamiento de sesión para mensajes
- [Seguridad](/es/gateway/security) - modelo de acceso y endurecimiento
