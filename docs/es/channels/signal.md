---
read_when:
    - Configuración de la compatibilidad con Signal
    - Depuración del envío/recepción de Signal
summary: Compatibilidad de Signal mediante signal-cli (JSON-RPC + SSE), rutas de configuración y modelo de números
title: Signal
x-i18n:
    generated_at: "2026-04-30T05:30:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: d450454550a86cbf0e2b7231bb149f78275a756517db1f20d7a07e3d298febee
    source_path: channels/signal.md
    workflow: 16
---

Estado: integración de CLI externa. Gateway se comunica con `signal-cli` mediante HTTP JSON-RPC + SSE.

## Requisitos previos

- OpenClaw instalado en tu servidor (el flujo de Linux a continuación se probó en Ubuntu 24).
- `signal-cli` disponible en el host donde se ejecuta el gateway.
- Un número de teléfono que pueda recibir un SMS de verificación (para la ruta de registro por SMS).
- Acceso al navegador para el captcha de Signal (`signalcaptchas.org`) durante el registro.

## Configuración rápida (principiante)

1. Usa un **número de Signal separado** para el bot (recomendado).
2. Instala `signal-cli` (se requiere Java si usas la compilación JVM).
3. Elige una ruta de configuración:
   - **Ruta A (enlace QR):** `signal-cli link -n "OpenClaw"` y escanea con Signal.
   - **Ruta B (registro por SMS):** registra un número dedicado con captcha + verificación por SMS.
4. Configura OpenClaw y reinicia el gateway.
5. Envía un primer DM y aprueba el emparejamiento (`openclaw pairing approve signal <CODE>`).

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

| Campo       | Descripción                                       |
| ----------- | ------------------------------------------------- |
| `account`   | Número de teléfono del bot en formato E.164 (`+15551234567`) |
| `cliPath`   | Ruta a `signal-cli` (`signal-cli` si está en `PATH`)  |
| `dmPolicy`  | Política de acceso a DM (`pairing` recomendado)          |
| `allowFrom` | Números de teléfono o valores `uuid:<id>` con permiso para enviar DM |

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

- El gateway se conecta a un **dispositivo de Signal** (la cuenta de `signal-cli`).
- Si ejecutas el bot en **tu cuenta personal de Signal**, ignorará tus propios mensajes (protección de bucle).
- Para “yo escribo al bot y responde”, usa un **número de bot separado**.

## Ruta de configuración A: enlazar una cuenta de Signal existente (QR)

1. Instala `signal-cli` (compilación JVM o nativa).
2. Enlaza una cuenta de bot:
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

Compatibilidad con varias cuentas: usa `channels.signal.accounts` con configuración por cuenta y `name` opcional. Consulta [`gateway/configuration`](/es/gateway/config-channels#multi-account-all-channels) para el patrón compartido.

## Ruta de configuración B: registrar un número de bot dedicado (SMS, Linux)

Usa esto cuando quieras un número de bot dedicado en lugar de enlazar una cuenta existente de la aplicación Signal.

1. Obtén un número que pueda recibir SMS (o verificación por voz para teléfonos fijos).
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
Mantén `signal-cli` actualizado; upstream indica que las versiones antiguas pueden dejar de funcionar cuando cambian las API del servidor de Signal.

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

4. Configura OpenClaw, reinicia el gateway y verifica el canal:

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
   - Guarda el número del bot como contacto en tu teléfono para evitar "Unknown contact".

<Warning>
Registrar una cuenta de número de teléfono con `signal-cli` puede desautenticar la sesión principal de la aplicación Signal para ese número. Prefiere un número de bot dedicado, o usa el modo de enlace QR si necesitas conservar la configuración de tu aplicación de teléfono existente.
</Warning>

Referencias upstream:

- README de `signal-cli`: `https://github.com/AsamK/signal-cli`
- Flujo de captcha: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Flujo de enlace: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Modo de daemon externo (httpUrl)

Si quieres gestionar `signal-cli` tú mismo (arranques en frío lentos de JVM, inicialización de contenedor o CPU compartidas), ejecuta el daemon por separado y apunta OpenClaw a él:

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

Esto omite el inicio automático y la espera de arranque dentro de OpenClaw. Para arranques lentos al iniciar automáticamente, establece `channels.signal.startupTimeoutMs`.

## Control de acceso (DM + grupos)

DM:

- Predeterminado: `channels.signal.dmPolicy = "pairing"`.
- Los remitentes desconocidos reciben un código de emparejamiento; los mensajes se ignoran hasta que se aprueban (los códigos caducan después de 1 hora).
- Aprueba mediante:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- El emparejamiento es el intercambio de tokens predeterminado para los DM de Signal. Detalles: [Emparejamiento](/es/channels/pairing)
- Los remitentes solo UUID (desde `sourceUuid`) se almacenan como `uuid:<id>` en `channels.signal.allowFrom`.

Grupos:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` controla quién puede activar en grupos cuando `allowlist` está establecido.
- `channels.signal.groups["<group-id>" | "*"]` puede anular el comportamiento de grupo con `requireMention`, `tools` y `toolsBySender`.
- Usa `channels.signal.accounts.<id>.groups` para anulaciones por cuenta en configuraciones de varias cuentas.
- Nota de runtime: si falta por completo `channels.signal`, el runtime recurre a `groupPolicy="allowlist"` para las comprobaciones de grupo (incluso si `channels.defaults.groupPolicy` está establecido).

## Cómo funciona (comportamiento)

- `signal-cli` se ejecuta como daemon; el gateway lee eventos mediante SSE.
- Los mensajes entrantes se normalizan en el sobre de canal compartido.
- Las respuestas siempre se enrutan de vuelta al mismo número o grupo.

## Medios + límites

- El texto saliente se fragmenta según `channels.signal.textChunkLimit` (predeterminado 4000).
- Fragmentación opcional por saltos de línea: establece `channels.signal.chunkMode="newline"` para dividir por líneas en blanco (límites de párrafo) antes de la fragmentación por longitud.
- Adjuntos compatibles (base64 obtenido desde `signal-cli`).
- Los adjuntos de nota de voz usan el nombre de archivo de `signal-cli` como respaldo MIME cuando falta `contentType`, para que la transcripción de audio aún pueda clasificar notas de voz AAC.
- Límite predeterminado de medios: `channels.signal.mediaMaxMb` (predeterminado 8).
- Usa `channels.signal.ignoreAttachments` para omitir la descarga de medios.
- El contexto de historial de grupo usa `channels.signal.historyLimit` (o `channels.signal.accounts.*.historyLimit`), con respaldo en `messages.groupChat.historyLimit`. Establece `0` para desactivarlo (predeterminado 50).

## Indicadores de escritura + confirmaciones de lectura

- **Indicadores de escritura**: OpenClaw envía señales de escritura mediante `signal-cli sendTyping` y las actualiza mientras se ejecuta una respuesta.
- **Confirmaciones de lectura**: cuando `channels.signal.sendReadReceipts` es true, OpenClaw reenvía confirmaciones de lectura para los DM permitidos.
- Signal-cli no expone confirmaciones de lectura para grupos.

## Reacciones (herramienta de mensaje)

- Usa `message action=react` con `channel=signal`.
- Destinos: E.164 del remitente o UUID (usa `uuid:<id>` de la salida de emparejamiento; UUID sin prefijo también funciona).
- `messageId` es la marca de tiempo de Signal del mensaje al que reaccionas.
- Las reacciones de grupo requieren `targetAuthor` o `targetAuthorUuid`.

Ejemplos:

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

Configuración:

- `channels.signal.actions.reactions`: activa/desactiva acciones de reacción (predeterminado true).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`.
  - `off`/`ack` desactiva las reacciones del agente (la herramienta de mensaje `react` dará error).
  - `minimal`/`extensive` activa las reacciones del agente y establece el nivel de guía.
- Anulaciones por cuenta: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Destinos de entrega (CLI/cron)

- DM: `signal:+15551234567` (o E.164 simple).
- DM UUID: `uuid:<id>` (o UUID sin prefijo).
- Grupos: `signal:group:<groupId>`.
- Nombres de usuario: `username:<name>` (si tu cuenta de Signal lo admite).

## Solución de problemas

Ejecuta primero esta escalera:

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

Fallos comunes:

- Daemon accesible pero sin respuestas: verifica la configuración de cuenta/daemon (`httpUrl`, `account`) y el modo de recepción.
- DM ignorados: el remitente está pendiente de aprobación de emparejamiento.
- Mensajes de grupo ignorados: la compuerta de remitente/mención del grupo bloquea la entrega.
- Errores de validación de configuración después de editar: ejecuta `openclaw doctor --fix`.
- Signal no aparece en los diagnósticos: confirma `channels.signal.enabled: true`.

Comprobaciones adicionales:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

Para el flujo de clasificación: [/channels/troubleshooting](/es/channels/troubleshooting).

## Notas de seguridad

- `signal-cli` almacena claves de cuenta localmente (normalmente `~/.local/share/signal-cli/data/`).
- Haz una copia de seguridad del estado de la cuenta de Signal antes de una migración o reconstrucción del servidor.
- Mantén `channels.signal.dmPolicy: "pairing"` salvo que quieras explícitamente un acceso más amplio a DM.
- La verificación por SMS solo es necesaria para flujos de registro o recuperación, pero perder el control del número/cuenta puede complicar el nuevo registro.

## Referencia de configuración (Signal)

Configuración completa: [Configuración](/es/gateway/configuration)

Opciones del proveedor:

- `channels.signal.enabled`: habilita/deshabilita el inicio del canal.
- `channels.signal.account`: E.164 para la cuenta del bot.
- `channels.signal.cliPath`: ruta a `signal-cli`.
- `channels.signal.httpUrl`: URL completa del demonio (sobrescribe host/puerto).
- `channels.signal.httpHost`, `channels.signal.httpPort`: enlace del demonio (predeterminado 127.0.0.1:8080).
- `channels.signal.autoStart`: inicia automáticamente el demonio (predeterminado true si `httpUrl` no está definido).
- `channels.signal.startupTimeoutMs`: tiempo de espera de inicio en ms (límite 120000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: omite las descargas de adjuntos.
- `channels.signal.ignoreStories`: ignora las historias del demonio.
- `channels.signal.sendReadReceipts`: reenvía confirmaciones de lectura.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (predeterminado: pairing).
- `channels.signal.allowFrom`: lista de permitidos para mensajes directos (E.164 o `uuid:<id>`). `open` requiere `"*"`. Signal no tiene nombres de usuario; usa identificadores de teléfono/UUID.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (predeterminado: allowlist).
- `channels.signal.groupAllowFrom`: lista de permitidos de remitentes de grupo.
- `channels.signal.groups`: sobrescrituras por grupo indexadas por id de grupo de Signal (o `"*"`). Campos admitidos: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: versión por cuenta de `channels.signal.groups` para configuraciones multicuenta.
- `channels.signal.historyLimit`: mensajes de grupo máximos para incluir como contexto (0 deshabilita).
- `channels.signal.dmHistoryLimit`: límite de historial de mensajes directos en turnos de usuario. Sobrescrituras por usuario: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: tamaño de fragmento saliente (caracteres).
- `channels.signal.chunkMode`: `length` (predeterminado) o `newline` para dividir por líneas en blanco (límites de párrafo) antes de la fragmentación por longitud.
- `channels.signal.mediaMaxMb`: límite de medios entrantes/salientes (MB).

Opciones globales relacionadas:

- `agents.list[].groupChat.mentionPatterns` (Signal no admite menciones nativas).
- `messages.groupChat.mentionPatterns` (respaldo global).
- `messages.responsePrefix`.

## Relacionado

- [Descripción general de canales](/es/channels) — todos los canales admitidos
- [Emparejamiento](/es/channels/pairing) — autenticación de mensajes directos y flujo de emparejamiento
- [Grupos](/es/channels/groups) — comportamiento de chat grupal y control por menciones
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y endurecimiento
