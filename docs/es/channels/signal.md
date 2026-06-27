---
read_when:
    - Configurar la compatibilidad con Signal
    - Depuración del envío/recepción de Signal
summary: Compatibilidad con Signal mediante signal-cli (demonio nativo o contenedor bbernhard), rutas de configuración y modelo de números
title: Signal
x-i18n:
    generated_at: "2026-06-27T10:44:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7f4d82f43a11494d371a9af9a8e55b227364594a5a144b5a4d8690e865d9ade8
    source_path: channels/signal.md
    workflow: 16
---

Estado: integración de CLI externa. Gateway se comunica con `signal-cli` por HTTP, ya sea con daemon nativo (JSON-RPC + SSE) o con el contenedor bbernhard/signal-cli-rest-api (REST + WebSocket).

## Requisitos previos

- OpenClaw instalado en tu servidor (el flujo de Linux siguiente se probó en Ubuntu 24).
- Una de estas opciones:
  - `signal-cli` disponible en el host (modo nativo), **o**
  - contenedor Docker `bbernhard/signal-cli-rest-api` (modo contenedor).
- Un número de teléfono que pueda recibir un SMS de verificación (para la ruta de registro por SMS).
- Acceso al navegador para el captcha de Signal (`signalcaptchas.org`) durante el registro.

## Configuración rápida (principiante)

1. Usa un **número de Signal separado** para el bot (recomendado).
2. Instala el Plugin de OpenClaw:

```bash
openclaw plugins install @openclaw/signal
```

3. Instala `signal-cli` (se requiere Java si usas la compilación JVM).
4. Elige una ruta de configuración:
   - **Ruta A (vinculación por QR):** `signal-cli link -n "OpenClaw"` y escanea con Signal.
   - **Ruta B (registro por SMS):** registra un número dedicado con captcha + verificación por SMS.
5. Configura OpenClaw y reinicia el gateway.
6. Envía un primer mensaje directo y aprueba el emparejamiento (`openclaw pairing approve signal <CODE>`).

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

| Campo        | Descripción                                       |
| ------------ | ------------------------------------------------- |
| `account`    | Número de teléfono del bot en formato E.164 (`+15551234567`) |
| `cliPath`    | Ruta a `signal-cli` (`signal-cli` si está en `PATH`)  |
| `configPath` | Directorio de configuración de signal-cli pasado como `--config`        |
| `dmPolicy`   | Política de acceso de mensajes directos (`pairing` recomendado)          |
| `allowFrom`  | Números de teléfono o valores `uuid:<id>` autorizados para enviar mensajes directos |

## Qué es

- Canal de Signal mediante `signal-cli` (no libsignal embebido).
- Enrutamiento determinista: las respuestas siempre vuelven a Signal.
- Los mensajes directos comparten la sesión principal del agente; los grupos están aislados (`agent:<agentId>:signal:group:<groupId>`).

## Escrituras de configuración

De forma predeterminada, Signal puede escribir actualizaciones de configuración activadas por `/config set|unset` (requiere `commands.config: true`).

Desactívalo con:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## El modelo de número (importante)

- El gateway se conecta a un **dispositivo de Signal** (la cuenta de `signal-cli`).
- Si ejecutas el bot en **tu cuenta personal de Signal**, ignorará tus propios mensajes (protección contra bucles).
- Para "envío un mensaje al bot y responde", usa un **número de bot separado**.

## Ruta de configuración A: vincular una cuenta de Signal existente (QR)

1. Instala `signal-cli` (compilación JVM o nativa).
2. Vincula una cuenta de bot:
   - `signal-cli link -n "OpenClaw"` y luego escanea el QR en Signal.
3. Configura Signal e inicia el gateway.

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

Usa esto cuando quieras un número de bot dedicado en lugar de vincular una cuenta existente de la app de Signal.

1. Obtén un número que pueda recibir SMS (o verificación por voz para líneas fijas).
   - Usa un número de bot dedicado para evitar conflictos de cuenta/sesión.
2. Instala `signal-cli` en el host del gateway:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

Si usas la compilación JVM (`signal-cli-${VERSION}.tar.gz`), instala primero JRE 25+.
Mantén `signal-cli` actualizado; el proyecto upstream indica que las versiones antiguas pueden dejar de funcionar cuando cambian las API del servidor de Signal.

3. Registra y verifica el número:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Si se requiere captcha:

1. Abre `https://signalcaptchas.org/registration/generate.html`.
2. Completa el captcha, copia el destino del enlace `signalcaptcha://...` desde "Open Signal".
3. Ejecuta desde la misma IP externa que la sesión del navegador cuando sea posible.
4. Ejecuta el registro de nuevo inmediatamente (los tokens captcha caducan rápido):

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. Configura OpenClaw, reinicia el gateway y verifica el canal:

```bash
# If you run the gateway as a user systemd service:
systemctl --user restart openclaw-gateway.service

# Then verify:
openclaw doctor
openclaw channels status --probe
```

5. Empareja el remitente de tu mensaje directo:
   - Envía cualquier mensaje al número del bot.
   - Aprueba el código en el servidor: `openclaw pairing approve signal <PAIRING_CODE>`.
   - Guarda el número del bot como contacto en tu teléfono para evitar "Unknown contact".

<Warning>
Registrar una cuenta de número de teléfono con `signal-cli` puede desautenticar la sesión principal de la app de Signal para ese número. Prefiere un número de bot dedicado, o usa el modo de vinculación por QR si necesitas conservar la configuración de tu app telefónica existente.
</Warning>

Referencias upstream:

- README de `signal-cli`: `https://github.com/AsamK/signal-cli`
- Flujo de captcha: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Flujo de vinculación: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Modo de daemon externo (httpUrl)

Si quieres gestionar `signal-cli` por tu cuenta (arranques en frío lentos de JVM, inicialización de contenedor o CPU compartidas), ejecuta el daemon por separado y apunta OpenClaw hacia él:

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

Esto omite el inicio automático y la espera de arranque dentro de OpenClaw. Para arranques lentos al iniciar automáticamente, configura `channels.signal.startupTimeoutMs`.

## Modo contenedor (bbernhard/signal-cli-rest-api)

En lugar de ejecutar `signal-cli` de forma nativa, puedes usar el contenedor Docker [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api). Este envuelve `signal-cli` detrás de una API REST y una interfaz WebSocket.

Requisitos:

- El contenedor **debe** ejecutarse con `MODE=json-rpc` para recibir mensajes en tiempo real.
- Registra o vincula tu cuenta de Signal dentro del contenedor antes de conectar OpenClaw.

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

| Valor         | Comportamiento                                                                             |
| ------------- | ------------------------------------------------------------------------------------ |
| `"auto"`      | (Predeterminado) Prueba ambos transportes; el streaming valida la recepción por WebSocket del contenedor    |
| `"native"`    | Fuerza signal-cli nativo (JSON-RPC en `/api/v1/rpc`, SSE en `/api/v1/events`)         |
| `"container"` | Fuerza el contenedor bbernhard (REST en `/v2/send`, WebSocket en `/v1/receive/{account}`) |

Cuando `apiMode` es `"auto"`, OpenClaw almacena en caché el modo detectado durante 30 segundos para evitar pruebas repetidas. La recepción del contenedor solo se selecciona para streaming después de que `/v1/receive/{account}` actualiza a WebSocket, lo que requiere `MODE=json-rpc`.

El modo contenedor admite las mismas operaciones del canal de Signal que el modo nativo cuando el contenedor expone API equivalentes: envíos, recepciones, adjuntos, indicadores de escritura, confirmaciones de leído/visto, reacciones, grupos y texto con estilo. OpenClaw traduce sus llamadas RPC nativas de Signal a las cargas REST del contenedor, incluidos los ID de grupo `group.{base64(internal_id)}` y `text_mode: "styled"` para texto con formato.

Notas operativas:

- Usa `autoStart: false` con el modo contenedor. OpenClaw no debe iniciar un daemon nativo cuando se selecciona `apiMode: "container"`.
- Usa `MODE=json-rpc` para recibir. `MODE=normal` puede hacer que `/v1/about` parezca correcto, pero `/v1/receive/{account}` no actualiza a WebSocket, por lo que OpenClaw no seleccionará el streaming de recepción del contenedor en modo `auto`.
- Configura `apiMode: "container"` cuando sepas que `httpUrl` apunta a la API REST de bbernhard. Configura `apiMode: "native"` cuando sepas que apunta a JSON-RPC/SSE nativo de `signal-cli`. Usa `"auto"` cuando el despliegue pueda variar.
- Las descargas de adjuntos del contenedor respetan los mismos límites de bytes de medios que el modo nativo. Las respuestas sobredimensionadas se rechazan antes de almacenarse completamente en búfer cuando el servidor envía `Content-Length`, y durante el streaming en caso contrario.

## Control de acceso (mensajes directos + grupos)

Mensajes directos:

- Predeterminado: `channels.signal.dmPolicy = "pairing"`.
- Los remitentes desconocidos reciben un código de emparejamiento; los mensajes se ignoran hasta que se aprueben (los códigos caducan después de 1 hora).
- Aprueba mediante:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- El emparejamiento es el intercambio de tokens predeterminado para los mensajes directos de Signal. Detalles: [Emparejamiento](/es/channels/pairing)
- Los remitentes solo con UUID (desde `sourceUuid`) se almacenan como `uuid:<id>` en `channels.signal.allowFrom`.

Grupos:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` controla qué grupos o remitentes pueden activar respuestas de grupo cuando se configura `allowlist`; las entradas pueden ser ID de grupo de Signal (sin procesar, `group:<id>` o `signal:group:<id>`), números de teléfono de remitentes, valores `uuid:<id>` o `*`.
- `channels.signal.groups["<group-id>" | "*"]` puede sobrescribir el comportamiento de grupo con `requireMention`, `tools` y `toolsBySender`.
- Usa `channels.signal.accounts.<id>.groups` para sobrescrituras por cuenta en configuraciones con varias cuentas.
- Incluir un grupo de Signal en la lista permitida mediante `groupAllowFrom` no desactiva por sí solo la compuerta de mención. Una entrada `channels.signal.groups["<group-id>"]` configurada específicamente procesa todos los mensajes del grupo a menos que se configure `requireMention=true`.
- Nota de tiempo de ejecución: si falta completamente `channels.signal`, el tiempo de ejecución recurre a `groupPolicy="allowlist"` para las comprobaciones de grupo (incluso si `channels.defaults.groupPolicy` está configurado).

## Cómo funciona (comportamiento)

- Modo nativo: `signal-cli` se ejecuta como daemon; el gateway lee eventos mediante SSE.
- Modo contenedor: el gateway envía mediante API REST y recibe mediante WebSocket.
- Los mensajes entrantes se normalizan en el sobre de canal compartido.
- Las respuestas siempre se enrutan de vuelta al mismo número o grupo.

## Medios + límites

- El texto saliente se divide en fragmentos según `channels.signal.textChunkLimit` (predeterminado 4000).
- Fragmentación opcional por saltos de línea: configura `channels.signal.chunkMode="newline"` para dividir por líneas en blanco (límites de párrafo) antes de fragmentar por longitud.
- Adjuntos compatibles (base64 obtenido desde `signal-cli`).
- Los adjuntos de notas de voz usan el nombre de archivo de `signal-cli` como alternativa MIME cuando falta `contentType`, por lo que la transcripción de audio aún puede clasificar memorandos de voz AAC.
- Límite de medios predeterminado: `channels.signal.mediaMaxMb` (predeterminado 8).
- Usa `channels.signal.ignoreAttachments` para omitir la descarga de medios.
- El contexto de historial de grupo usa `channels.signal.historyLimit` (o `channels.signal.accounts.*.historyLimit`), con reserva a `messages.groupChat.historyLimit`. Configura `0` para desactivar (predeterminado 50).

## Escritura + confirmaciones de lectura

- **Indicadores de escritura**: OpenClaw envía señales de escritura mediante `signal-cli sendTyping` y las actualiza mientras se está generando una respuesta.
- **Confirmaciones de lectura**: cuando `channels.signal.sendReadReceipts` es true, OpenClaw reenvía confirmaciones de lectura para mensajes directos permitidos.
- Signal-cli no expone confirmaciones de lectura para grupos.

## Reacciones (herramienta de mensajes)

- Usa `message action=react` con `channel=signal`.
- Destinos: E.164 o UUID del remitente (usa `uuid:<id>` de la salida de emparejamiento; un UUID sin prefijo también funciona).
- `messageId` es la marca de tiempo de Signal para el mensaje al que estás reaccionando.
- Las reacciones en grupos requieren `targetAuthor` o `targetAuthorUuid`.

Ejemplos:

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

Configuración:

- `channels.signal.actions.reactions`: habilita/deshabilita las acciones de reacción (valor predeterminado: true).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`.
  - `off`/`ack` deshabilita las reacciones del agente (la herramienta de mensajes `react` producirá un error).
  - `minimal`/`extensive` habilita las reacciones del agente y establece el nivel de orientación.
- Sobrescrituras por cuenta: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Reacciones de aprobación

Las solicitudes de aprobación de ejecución de Signal y de plugins usan los bloques de enrutamiento de nivel superior `approvals.exec` y
`approvals.plugin`. Signal no tiene un bloque
`channels.signal.execApprovals`.

- `👍` aprueba una vez.
- `👎` deniega.
- Usa `/approve <id> allow-always` cuando una solicitud ofrece aprobación persistente.

La resolución de reacciones de aprobación requiere aprobadores explícitos de Signal desde
`channels.signal.allowFrom`, `channels.signal.defaultTo` o los campos equivalentes de nivel de cuenta.
Las solicitudes de aprobación de ejecución directas en el mismo chat aún pueden suprimir la alternativa local duplicada `/approve`
sin aprobadores explícitos; las aprobaciones de grupo sin aprobadores mantienen visible la alternativa local.

## Destinos de entrega (CLI/cron)

- Mensajes directos: `signal:+15551234567` (o E.164 sin prefijo).
- Mensajes directos por UUID: `uuid:<id>` (o UUID sin prefijo).
- Grupos: `signal:group:<groupId>`.
- Nombres de usuario: `username:<name>` (si tu cuenta de Signal lo admite).

## Solución de problemas

Ejecuta primero esta secuencia:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Luego confirma el estado de emparejamiento de mensajes directos si es necesario:

```bash
openclaw pairing list signal
```

Fallos comunes:

- El demonio es accesible, pero no hay respuestas: verifica la configuración de la cuenta/demonio (`httpUrl`, `account`) y el modo de recepción.
- Mensajes directos ignorados: el remitente tiene pendiente la aprobación de emparejamiento.
- Mensajes de grupo ignorados: la puerta por remitente/mención del grupo bloquea la entrega.
- Errores de validación de configuración después de editar: ejecuta `openclaw doctor --fix`.
- Signal no aparece en los diagnósticos: confirma `channels.signal.enabled: true`.

Comprobaciones adicionales:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

Para el flujo de triaje: [/channels/troubleshooting](/es/channels/troubleshooting).

## Notas de seguridad

- `signal-cli` almacena las claves de cuenta localmente (normalmente en `~/.local/share/signal-cli/data/`).
- Haz una copia de seguridad del estado de la cuenta de Signal antes de una migración o reconstrucción del servidor.
- Mantén `channels.signal.dmPolicy: "pairing"` salvo que quieras explícitamente un acceso más amplio a mensajes directos.
- La verificación por SMS solo es necesaria para flujos de registro o recuperación, pero perder el control del número/cuenta puede complicar el nuevo registro.

## Referencia de configuración (Signal)

Configuración completa: [Configuración](/es/gateway/configuration)

Opciones del proveedor:

- `channels.signal.enabled`: habilita/deshabilita el inicio del canal.
- `channels.signal.apiMode`: `auto | native | container` (valor predeterminado: auto). Consulta [Modo contenedor](#container-mode-bbernhardsignal-cli-rest-api).
- `channels.signal.account`: E.164 de la cuenta del bot.
- `channels.signal.cliPath`: ruta a `signal-cli`.
- `channels.signal.configPath`: directorio opcional de `signal-cli --config`.
- `channels.signal.httpUrl`: URL completa del demonio (sobrescribe host/puerto).
- `channels.signal.httpHost`, `channels.signal.httpPort`: enlace del demonio (valor predeterminado: 127.0.0.1:8080).
- `channels.signal.autoStart`: genera automáticamente el demonio (valor predeterminado: true si `httpUrl` no está definido).
- `channels.signal.startupTimeoutMs`: tiempo de espera de inicio en ms (límite 120000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: omite descargas de adjuntos.
- `channels.signal.ignoreStories`: ignora historias del demonio.
- `channels.signal.sendReadReceipts`: reenvía confirmaciones de lectura.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (valor predeterminado: pairing).
- `channels.signal.allowFrom`: lista de permitidos de mensajes directos (E.164 o `uuid:<id>`). `open` requiere `"*"`. Signal no tiene nombres de usuario; usa identificadores de teléfono/UUID.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (valor predeterminado: allowlist).
- `channels.signal.groupAllowFrom`: lista de permitidos de grupos; acepta IDs de grupo de Signal (sin procesar, `group:<id>` o `signal:group:<id>`), números E.164 de remitentes o valores `uuid:<id>`.
- `channels.signal.groups`: sobrescrituras por grupo indexadas por id de grupo de Signal (o `"*"`). Campos compatibles: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: versión por cuenta de `channels.signal.groups` para configuraciones con varias cuentas.
- `channels.signal.historyLimit`: número máximo de mensajes de grupo que se incluyen como contexto (0 deshabilita).
- `channels.signal.dmHistoryLimit`: límite de historial de mensajes directos en turnos de usuario. Sobrescrituras por usuario: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: tamaño de fragmento saliente (caracteres).
- `channels.signal.chunkMode`: `length` (valor predeterminado) o `newline` para dividir por líneas en blanco (límites de párrafo) antes de fragmentar por longitud.
- `channels.signal.mediaMaxMb`: límite de medios entrantes/salientes (MB).

Opciones globales relacionadas:

- `agents.list[].groupChat.mentionPatterns` (Signal no admite menciones nativas).
- `messages.groupChat.mentionPatterns` (alternativa global).
- `messages.responsePrefix`.

## Relacionado

- [Descripción general de canales](/es/channels) — todos los canales compatibles
- [Emparejamiento](/es/channels/pairing) — autenticación de mensajes directos y flujo de emparejamiento
- [Grupos](/es/channels/groups) — comportamiento del chat de grupo y puerta por mención
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y endurecimiento
