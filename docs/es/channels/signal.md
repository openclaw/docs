---
read_when:
    - Configurar la compatibilidad con Signal
    - Depuración de envío/recepción en Signal
summary: Compatibilidad de Signal mediante signal-cli (JSON-RPC + SSE), rutas de configuración y modelo de números
title: Signal
x-i18n:
    generated_at: "2026-04-30T16:27:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 111b6ebe3bde4e03c7ed432f52d663f0b471f0fc4a4bf835c1ac1972467e0b96
    source_path: channels/signal.md
    workflow: 16
---

Estado: integración externa con CLI. Gateway se comunica con `signal-cli` mediante HTTP JSON-RPC + SSE.

## Requisitos previos

- OpenClaw instalado en tu servidor (el flujo de Linux de abajo se probó en Ubuntu 24).
- `signal-cli` disponible en el host donde se ejecuta el gateway.
- Un número de teléfono que pueda recibir un SMS de verificación (para la ruta de registro por SMS).
- Acceso a un navegador para el captcha de Signal (`signalcaptchas.org`) durante el registro.

## Configuración rápida (principiante)

1. Usa un **número de Signal separado** para el bot (recomendado).
2. Instala `signal-cli` (Java es obligatorio si usas la compilación JVM).
3. Elige una ruta de configuración:
   - **Ruta A (enlace QR):** `signal-cli link -n "OpenClaw"` y escanéalo con Signal.
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

| Campo       | Descripción                                      |
| ----------- | ------------------------------------------------ |
| `account`   | Número de teléfono del bot en formato E.164 (`+15551234567`) |
| `cliPath`   | Ruta a `signal-cli` (`signal-cli` si está en `PATH`) |
| `dmPolicy`  | Política de acceso de DM (`pairing` recomendado) |
| `allowFrom` | Números de teléfono o valores `uuid:<id>` con permiso para enviar DM |

## Qué es

- Canal de Signal mediante `signal-cli` (no libsignal incrustado).
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

- El gateway se conecta a un **dispositivo Signal** (la cuenta de `signal-cli`).
- Si ejecutas el bot en **tu cuenta personal de Signal**, ignorará tus propios mensajes (protección contra bucles).
- Para “yo escribo al bot y responde”, usa un **número de bot separado**.

## Ruta de configuración A: enlazar cuenta de Signal existente (QR)

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

Usa esto cuando quieras un número de bot dedicado en vez de enlazar una cuenta existente de la app Signal.

1. Obtén un número que pueda recibir SMS (o verificación de voz para líneas fijas).
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
Mantén `signal-cli` actualizado; upstream indica que las versiones antiguas pueden romperse cuando cambian las API del servidor de Signal.

3. Registra y verifica el número:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Si se requiere captcha:

1. Abre `https://signalcaptchas.org/registration/generate.html`.
2. Completa el captcha, copia el destino del enlace `signalcaptcha://...` desde "Open Signal".
3. Cuando sea posible, ejecútalo desde la misma IP externa que la sesión del navegador.
4. Ejecuta el registro otra vez de inmediato (los tokens de captcha expiran rápido):

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
   - Guarda el número del bot como contacto en tu teléfono para evitar “Contacto desconocido”.

<Warning>
Registrar una cuenta de número de teléfono con `signal-cli` puede desautenticar la sesión principal de la app Signal para ese número. Prefiere un número de bot dedicado, o usa el modo de enlace QR si necesitas mantener tu configuración actual de la app del teléfono.
</Warning>

Referencias upstream:

- README de `signal-cli`: `https://github.com/AsamK/signal-cli`
- Flujo de captcha: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Flujo de enlace: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Modo de daemon externo (httpUrl)

Si quieres gestionar `signal-cli` tú mismo (arranques en frío lentos de JVM, inicialización de contenedores o CPU compartidas), ejecuta el daemon por separado y apunta OpenClaw a él:

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

## Control de acceso (DM + grupos)

DM:

- Predeterminado: `channels.signal.dmPolicy = "pairing"`.
- Los remitentes desconocidos reciben un código de emparejamiento; los mensajes se ignoran hasta que se aprueben (los códigos expiran después de 1 hora).
- Aprueba mediante:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- El emparejamiento es el intercambio de tokens predeterminado para los DM de Signal. Detalles: [Emparejamiento](/es/channels/pairing)
- Los remitentes solo con UUID (desde `sourceUuid`) se almacenan como `uuid:<id>` en `channels.signal.allowFrom`.

Grupos:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` controla qué grupos o remitentes pueden activar respuestas de grupo cuando `allowlist` está configurado; las entradas pueden ser ID de grupo de Signal (sin procesar, `group:<id>` o `signal:group:<id>`), números de teléfono de remitente, valores `uuid:<id>` o `*`.
- `channels.signal.groups["<group-id>" | "*"]` puede sobrescribir el comportamiento de grupo con `requireMention`, `tools` y `toolsBySender`.
- Usa `channels.signal.accounts.<id>.groups` para sobrescrituras por cuenta en configuraciones de varias cuentas.
- Permitir un grupo de Signal mediante `groupAllowFrom` no desactiva por sí mismo la compuerta por mención. Una entrada configurada específicamente en `channels.signal.groups["<group-id>"]` procesa todos los mensajes del grupo a menos que `requireMention=true` esté configurado.
- Nota de runtime: si falta completamente `channels.signal`, el runtime recurre a `groupPolicy="allowlist"` para las comprobaciones de grupo (incluso si `channels.defaults.groupPolicy` está configurado).

## Cómo funciona (comportamiento)

- `signal-cli` se ejecuta como daemon; el gateway lee eventos mediante SSE.
- Los mensajes entrantes se normalizan en el sobre de canal compartido.
- Las respuestas siempre se enrutan de vuelta al mismo número o grupo.

## Medios + límites

- El texto saliente se divide en fragmentos según `channels.signal.textChunkLimit` (predeterminado 4000).
- División opcional por saltos de línea: configura `channels.signal.chunkMode="newline"` para dividir por líneas en blanco (límites de párrafo) antes de dividir por longitud.
- Adjuntos compatibles (base64 obtenido desde `signal-cli`).
- Los adjuntos de nota de voz usan el nombre de archivo de `signal-cli` como fallback MIME cuando falta `contentType`, para que la transcripción de audio aún pueda clasificar notas de voz AAC.
- Límite de medios predeterminado: `channels.signal.mediaMaxMb` (predeterminado 8).
- Usa `channels.signal.ignoreAttachments` para omitir la descarga de medios.
- El contexto de historial de grupo usa `channels.signal.historyLimit` (o `channels.signal.accounts.*.historyLimit`), con fallback a `messages.groupChat.historyLimit`. Configura `0` para desactivarlo (predeterminado 50).

## Indicadores de escritura + confirmaciones de lectura

- **Indicadores de escritura**: OpenClaw envía señales de escritura mediante `signal-cli sendTyping` y las actualiza mientras se está generando una respuesta.
- **Confirmaciones de lectura**: cuando `channels.signal.sendReadReceipts` es true, OpenClaw reenvía confirmaciones de lectura para DM permitidos.
- Signal-cli no expone confirmaciones de lectura para grupos.

## Reacciones (herramienta de mensaje)

- Usa `message action=react` con `channel=signal`.
- Destinos: remitente E.164 o UUID (usa `uuid:<id>` desde la salida de emparejamiento; UUID sin prefijo también funciona).
- `messageId` es la marca de tiempo de Signal para el mensaje al que estás reaccionando.
- Las reacciones de grupo requieren `targetAuthor` o `targetAuthorUuid`.

Ejemplos:

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

Configuración:

- `channels.signal.actions.reactions`: activa/desactiva las acciones de reacción (predeterminado true).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`.
  - `off`/`ack` desactiva las reacciones del agente (la herramienta de mensaje `react` generará error).
  - `minimal`/`extensive` activa las reacciones del agente y establece el nivel de orientación.
- Sobrescrituras por cuenta: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Destinos de entrega (CLI/cron)

- DM: `signal:+15551234567` (o E.164 simple).
- DM por UUID: `uuid:<id>` (o UUID sin prefijo).
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
- Mensajes de grupo ignorados: la compuerta de remitente/mención de grupo bloquea la entrega.
- Errores de validación de configuración después de editar: ejecuta `openclaw doctor --fix`.
- Signal no aparece en diagnósticos: confirma `channels.signal.enabled: true`.

Comprobaciones extra:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

Para el flujo de triaje: [/channels/troubleshooting](/es/channels/troubleshooting).

## Notas de seguridad

- `signal-cli` almacena claves de cuenta localmente (normalmente `~/.local/share/signal-cli/data/`).
- Haz una copia de seguridad del estado de la cuenta de Signal antes de migrar o reconstruir el servidor.
- Mantén `channels.signal.dmPolicy: "pairing"` a menos que quieras explícitamente un acceso de DM más amplio.
- La verificación por SMS solo se necesita para flujos de registro o recuperación, pero perder el control del número/cuenta puede complicar volver a registrarse.

## Referencia de configuración (Signal)

Configuración completa: [Configuración](/es/gateway/configuration)

Opciones del proveedor:

- `channels.signal.enabled`: habilita/deshabilita el inicio del canal.
- `channels.signal.account`: E.164 para la cuenta del bot.
- `channels.signal.cliPath`: ruta a `signal-cli`.
- `channels.signal.httpUrl`: URL completa del daemon (anula host/puerto).
- `channels.signal.httpHost`, `channels.signal.httpPort`: enlace del daemon (predeterminado 127.0.0.1:8080).
- `channels.signal.autoStart`: inicia automáticamente el daemon (predeterminado true si `httpUrl` no está definido).
- `channels.signal.startupTimeoutMs`: tiempo de espera de inicio en ms (límite 120000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: omite las descargas de adjuntos.
- `channels.signal.ignoreStories`: ignora las historias del daemon.
- `channels.signal.sendReadReceipts`: reenvía confirmaciones de lectura.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (predeterminado: pairing).
- `channels.signal.allowFrom`: lista de permitidos de DM (E.164 o `uuid:<id>`). `open` requiere `"*"`. Signal no tiene nombres de usuario; usa identificadores de teléfono/UUID.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (predeterminado: allowlist).
- `channels.signal.groupAllowFrom`: lista de permitidos de grupos; acepta ID de grupo de Signal (sin procesar, `group:<id>` o `signal:group:<id>`), números E.164 de remitentes o valores `uuid:<id>`.
- `channels.signal.groups`: anulaciones por grupo con clave de ID de grupo de Signal (o `"*"`). Campos admitidos: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: versión por cuenta de `channels.signal.groups` para configuraciones con varias cuentas.
- `channels.signal.historyLimit`: máximo de mensajes de grupo que se incluirán como contexto (0 deshabilita).
- `channels.signal.dmHistoryLimit`: límite de historial de DM en turnos de usuario. Anulaciones por usuario: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: tamaño de fragmento saliente (caracteres).
- `channels.signal.chunkMode`: `length` (predeterminado) o `newline` para dividir por líneas en blanco (límites de párrafo) antes de fragmentar por longitud.
- `channels.signal.mediaMaxMb`: límite de medios entrantes/salientes (MB).

Opciones globales relacionadas:

- `agents.list[].groupChat.mentionPatterns` (Signal no admite menciones nativas).
- `messages.groupChat.mentionPatterns` (reserva global).
- `messages.responsePrefix`.

## Relacionado

- [Resumen de canales](/es/channels) — todos los canales admitidos
- [Emparejamiento](/es/channels/pairing) — autenticación de DM y flujo de emparejamiento
- [Grupos](/es/channels/groups) — comportamiento del chat grupal y control por mención
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesión para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y refuerzo
