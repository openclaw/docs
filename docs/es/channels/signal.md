---
read_when:
    - Configuración de la compatibilidad con Signal
    - Depuración del envío y la recepción de Signal
summary: Compatibilidad con Signal mediante signal-cli (demonio nativo o contenedor de bbernhard), rutas de configuración y modelo de número
title: Signal
x-i18n:
    generated_at: "2026-05-10T19:23:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d92f94f6c1363a795366501bb5c6d5f09756c03f156b482d17021c276e3577c
    source_path: channels/signal.md
    workflow: 16
---

Estado: integración de CLI externa. Gateway se comunica con `signal-cli` por HTTP, ya sea con un demonio nativo (JSON-RPC + SSE) o con el contenedor bbernhard/signal-cli-rest-api (REST + WebSocket).

## Requisitos previos

- OpenClaw instalado en tu servidor (el flujo de Linux siguiente se probó en Ubuntu 24).
- Uno de estos:
  - `signal-cli` disponible en el host (modo nativo), **o**
  - contenedor Docker `bbernhard/signal-cli-rest-api` (modo contenedor).
- Un número de teléfono que pueda recibir un SMS de verificación (para la ruta de registro por SMS).
- Acceso de navegador para el captcha de Signal (`signalcaptchas.org`) durante el registro.

## Configuración rápida (principiante)

1. Usa un **número de Signal separado** para el bot (recomendado).
2. Instala `signal-cli` (se requiere Java si usas la compilación JVM).
3. Elige una ruta de configuración:
   - **Ruta A (enlace por QR):** `signal-cli link -n "OpenClaw"` y escanea con Signal.
   - **Ruta B (registro por SMS):** registra un número dedicado con captcha + verificación por SMS.
4. Configura OpenClaw y reinicia el Gateway.
5. Envía un primer mensaje directo y aprueba el emparejamiento (`openclaw pairing approve signal <CODE>`).

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
| `dmPolicy`  | Política de acceso de mensajes directos (`pairing` recomendado)          |
| `allowFrom` | Números de teléfono o valores `uuid:<id>` autorizados para enviar mensajes directos |

## Qué es

- Canal de Signal mediante `signal-cli` (no libsignal integrado).
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

- El Gateway se conecta a un **dispositivo Signal** (la cuenta de `signal-cli`).
- Si ejecutas el bot en **tu cuenta personal de Signal**, ignorará tus propios mensajes (protección contra bucles).
- Para "escribo al bot y responde", usa un **número de bot separado**.

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
Mantén `signal-cli` actualizado; el proyecto original indica que las versiones antiguas pueden romperse cuando cambian las API del servidor de Signal.

3. Registra y verifica el número:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Si se requiere captcha:

1. Abre `https://signalcaptchas.org/registration/generate.html`.
2. Completa el captcha, copia el destino del enlace `signalcaptcha://...` desde "Open Signal".
3. Ejecuta desde la misma IP externa que la sesión del navegador cuando sea posible.
4. Ejecuta el registro de nuevo de inmediato (los tokens de captcha caducan rápidamente):

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

5. Empareja tu remitente de mensajes directos:
   - Envía cualquier mensaje al número del bot.
   - Aprueba el código en el servidor: `openclaw pairing approve signal <PAIRING_CODE>`.
   - Guarda el número del bot como contacto en tu teléfono para evitar "Unknown contact".

<Warning>
Registrar una cuenta de número de teléfono con `signal-cli` puede desautenticar la sesión principal de la app Signal para ese número. Prefiere un número de bot dedicado, o usa el modo de enlace por QR si necesitas mantener tu configuración existente de la app del teléfono.
</Warning>

Referencias originales:

- README de `signal-cli`: `https://github.com/AsamK/signal-cli`
- Flujo de captcha: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Flujo de enlace: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Modo de demonio externo (httpUrl)

Si quieres administrar `signal-cli` tú mismo (arranques en frío lentos de JVM, inicialización de contenedor o CPU compartidas), ejecuta el demonio por separado y apunta OpenClaw a él:

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

Esto omite el inicio automático y la espera de arranque dentro de OpenClaw. Para arranques lentos con inicio automático, configura `channels.signal.startupTimeoutMs`.

## Modo contenedor (bbernhard/signal-cli-rest-api)

En lugar de ejecutar `signal-cli` de forma nativa, puedes usar el contenedor Docker [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api). Esto envuelve `signal-cli` detrás de una API REST y una interfaz WebSocket.

Requisitos:

- El contenedor **debe** ejecutarse con `MODE=json-rpc` para la recepción de mensajes en tiempo real.
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

| Valor         | Comportamiento                                                                             |
| ------------- | ------------------------------------------------------------------------------------ |
| `"auto"`      | (Predeterminado) Prueba ambos transportes; el streaming valida la recepción por WebSocket del contenedor    |
| `"native"`    | Fuerza `signal-cli` nativo (JSON-RPC en `/api/v1/rpc`, SSE en `/api/v1/events`)         |
| `"container"` | Fuerza el contenedor bbernhard (REST en `/v2/send`, WebSocket en `/v1/receive/{account}`) |

Cuando `apiMode` es `"auto"`, OpenClaw almacena en caché el modo detectado durante 30 segundos para evitar pruebas repetidas. La recepción del contenedor solo se selecciona para streaming después de que `/v1/receive/{account}` actualice a WebSocket, lo que requiere `MODE=json-rpc`.

El modo contenedor admite las mismas operaciones del canal de Signal que el modo nativo cuando el contenedor expone API equivalentes: envíos, recepciones, adjuntos, indicadores de escritura, recibos de lectura/visto, reacciones, grupos y texto con estilo. OpenClaw traduce sus llamadas RPC nativas de Signal a las cargas REST del contenedor, incluidos los ID de grupo `group.{base64(internal_id)}` y `text_mode: "styled"` para texto con formato.

Notas operativas:

- Usa `autoStart: false` con el modo contenedor. OpenClaw no debe iniciar un demonio nativo cuando `apiMode: "container"` está seleccionado.
- Usa `MODE=json-rpc` para recibir. `MODE=normal` puede hacer que `/v1/about` parezca correcto, pero `/v1/receive/{account}` no actualiza a WebSocket, por lo que OpenClaw no seleccionará streaming de recepción del contenedor en modo `auto`.
- Configura `apiMode: "container"` cuando sepas que `httpUrl` apunta a la API REST de bbernhard. Configura `apiMode: "native"` cuando sepas que apunta al JSON-RPC/SSE nativo de `signal-cli`. Usa `"auto"` cuando el despliegue pueda variar.
- Las descargas de adjuntos del contenedor respetan los mismos límites de bytes de medios que el modo nativo. Las respuestas demasiado grandes se rechazan antes de almacenarse por completo en búfer cuando el servidor envía `Content-Length`, y durante el streaming en caso contrario.

## Control de acceso (mensajes directos + grupos)

Mensajes directos:

- Predeterminado: `channels.signal.dmPolicy = "pairing"`.
- Los remitentes desconocidos reciben un código de emparejamiento; los mensajes se ignoran hasta aprobarse (los códigos caducan después de 1 hora).
- Aprueba mediante:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- El emparejamiento es el intercambio de tokens predeterminado para los mensajes directos de Signal. Detalles: [Emparejamiento](/es/channels/pairing)
- Los remitentes solo con UUID (desde `sourceUuid`) se almacenan como `uuid:<id>` en `channels.signal.allowFrom`.

Grupos:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` controla qué grupos o remitentes pueden activar respuestas de grupo cuando `allowlist` está configurado; las entradas pueden ser ID de grupo de Signal (sin procesar, `group:<id>` o `signal:group:<id>`), números de teléfono de remitentes, valores `uuid:<id>` o `*`.
- `channels.signal.groups["<group-id>" | "*"]` puede sobrescribir el comportamiento de grupo con `requireMention`, `tools` y `toolsBySender`.
- Usa `channels.signal.accounts.<id>.groups` para sobrescrituras por cuenta en configuraciones de varias cuentas.
- Incluir un grupo de Signal en la lista de permitidos mediante `groupAllowFrom` no desactiva por sí solo el filtrado por mención. Una entrada `channels.signal.groups["<group-id>"]` configurada específicamente procesa cada mensaje de grupo a menos que `requireMention=true` esté configurado.
- Nota de ejecución: si falta por completo `channels.signal`, el runtime recurre a `groupPolicy="allowlist"` para las comprobaciones de grupo (aunque `channels.defaults.groupPolicy` esté configurado).

## Cómo funciona (comportamiento)

- Modo nativo: `signal-cli` se ejecuta como un demonio; el Gateway lee eventos mediante SSE.
- Modo contenedor: el Gateway envía mediante API REST y recibe mediante WebSocket.
- Los mensajes entrantes se normalizan en el sobre de canal compartido.
- Las respuestas siempre se enrutan de vuelta al mismo número o grupo.

## Medios + límites

- El texto saliente se divide en fragmentos hasta `channels.signal.textChunkLimit` (predeterminado 4000).
- División opcional por saltos de línea: configura `channels.signal.chunkMode="newline"` para dividir por líneas en blanco (límites de párrafo) antes de dividir por longitud.
- Adjuntos admitidos (base64 obtenido desde `signal-cli`).
- Los adjuntos de notas de voz usan el nombre de archivo de `signal-cli` como respaldo MIME cuando falta `contentType`, por lo que la transcripción de audio aún puede clasificar memorandos de voz AAC.
- Límite de medios predeterminado: `channels.signal.mediaMaxMb` (predeterminado 8).
- Usa `channels.signal.ignoreAttachments` para omitir la descarga de medios.
- El contexto de historial de grupo usa `channels.signal.historyLimit` (o `channels.signal.accounts.*.historyLimit`), con fallback a `messages.groupChat.historyLimit`. Configura `0` para desactivarlo (predeterminado 50).

## Escritura + recibos de lectura

- **Indicadores de escritura**: OpenClaw envía señales de escritura mediante `signal-cli sendTyping` y las actualiza mientras se ejecuta una respuesta.
- **Recibos de lectura**: cuando `channels.signal.sendReadReceipts` es true, OpenClaw reenvía recibos de lectura para mensajes directos permitidos.
- Signal-cli no expone recibos de lectura para grupos.

## Reacciones (herramienta de mensajes)

- Usa `message action=react` con `channel=signal`.
- Destinos: remitente E.164 o UUID (usa `uuid:<id>` de la salida de emparejamiento; el UUID sin prefijo también funciona).
- `messageId` es la marca de tiempo de Signal para el mensaje al que estás reaccionando.
- Las reacciones de grupo requieren `targetAuthor` o `targetAuthorUuid`.

Ejemplos:

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

Configuración:

- `channels.signal.actions.reactions`: habilita/deshabilita las acciones de reacción (valor predeterminado true).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`.
  - `off`/`ack` deshabilita las reacciones del agente (la herramienta de mensaje `react` dará error).
  - `minimal`/`extensive` habilita las reacciones del agente y establece el nivel de orientación.
- Sobrescrituras por cuenta: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Destinos de entrega (CLI/cron)

- MD: `signal:+15551234567` (o E.164 simple).
- MD con UUID: `uuid:<id>` (o UUID sin prefijo).
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

Luego confirma el estado de emparejamiento de MD si es necesario:

```bash
openclaw pairing list signal
```

Fallos comunes:

- Daemon accesible pero sin respuestas: verifica la configuración de cuenta/daemon (`httpUrl`, `account`) y el modo de recepción.
- MD ignorados: el remitente tiene pendiente la aprobación de emparejamiento.
- Mensajes de grupo ignorados: el filtro de remitente/mención del grupo bloquea la entrega.
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
- Mantén `channels.signal.dmPolicy: "pairing"` salvo que quieras explícitamente un acceso de MD más amplio.
- La verificación por SMS solo es necesaria para flujos de registro o recuperación, pero perder el control del número/cuenta puede complicar el nuevo registro.

## Referencia de configuración (Signal)

Configuración completa: [Configuración](/es/gateway/configuration)

Opciones del proveedor:

- `channels.signal.enabled`: habilita/deshabilita el inicio del canal.
- `channels.signal.apiMode`: `auto | native | container` (valor predeterminado: auto). Consulta [Modo contenedor](#container-mode-bbernhardsignal-cli-rest-api).
- `channels.signal.account`: E.164 para la cuenta del bot.
- `channels.signal.cliPath`: ruta a `signal-cli`.
- `channels.signal.httpUrl`: URL completa del daemon (anula host/puerto).
- `channels.signal.httpHost`, `channels.signal.httpPort`: enlace del daemon (valor predeterminado 127.0.0.1:8080).
- `channels.signal.autoStart`: inicia automáticamente el daemon (valor predeterminado true si `httpUrl` no está definido).
- `channels.signal.startupTimeoutMs`: tiempo de espera de inicio en ms (límite 120000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: omite las descargas de archivos adjuntos.
- `channels.signal.ignoreStories`: ignora las historias del daemon.
- `channels.signal.sendReadReceipts`: reenvía confirmaciones de lectura.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (valor predeterminado: pairing).
- `channels.signal.allowFrom`: lista de permitidos de MD (E.164 o `uuid:<id>`). `open` requiere `"*"`. Signal no tiene nombres de usuario; usa identificadores de teléfono/UUID.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (valor predeterminado: allowlist).
- `channels.signal.groupAllowFrom`: lista de permitidos de grupo; acepta ID de grupo de Signal (sin formato, `group:<id>` o `signal:group:<id>`), números E.164 de remitente o valores `uuid:<id>`.
- `channels.signal.groups`: sobrescrituras por grupo con clave por id de grupo de Signal (o `"*"`). Campos admitidos: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: versión por cuenta de `channels.signal.groups` para configuraciones con varias cuentas.
- `channels.signal.historyLimit`: máximo de mensajes de grupo que se incluirán como contexto (0 deshabilita).
- `channels.signal.dmHistoryLimit`: límite de historial de MD en turnos de usuario. Sobrescrituras por usuario: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: tamaño de fragmento saliente (caracteres).
- `channels.signal.chunkMode`: `length` (valor predeterminado) o `newline` para dividir en líneas en blanco (límites de párrafo) antes de fragmentar por longitud.
- `channels.signal.mediaMaxMb`: límite de medios entrantes/salientes (MB).

Opciones globales relacionadas:

- `agents.list[].groupChat.mentionPatterns` (Signal no admite menciones nativas).
- `messages.groupChat.mentionPatterns` (respaldo global).
- `messages.responsePrefix`.

## Relacionado

- [Resumen de canales](/es/channels) — todos los canales admitidos
- [Emparejamiento](/es/channels/pairing) — autenticación de MD y flujo de emparejamiento
- [Grupos](/es/channels/groups) — comportamiento del chat grupal y filtro de menciones
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesión para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y endurecimiento
