---
read_when:
    - Configuración de la compatibilidad con Signal
    - Depuración del envío y la recepción de Signal
summary: Compatibilidad con Signal mediante signal-cli (demonio nativo o contenedor de bbernhard), rutas de configuración y modelo de números
title: Signal
x-i18n:
    generated_at: "2026-07-22T13:19:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 81fa1a57a928a4de13d162e8174d28eba432eac234b1f3c718de6cf2dfaf7895
    source_path: channels/signal.md
    workflow: 16
---

Signal es un plugin de canal descargable (`@openclaw/signal`). El Gateway se comunica con `signal-cli` mediante HTTP: ya sea el daemon nativo (JSON-RPC + SSE) o el contenedor [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) (REST + WebSocket). OpenClaw no incorpora libsignal.

## El modelo de número (lea esto primero)

- El Gateway se conecta a un **dispositivo Signal**: la cuenta `signal-cli`.
- Ejecutar el bot en **su cuenta personal de Signal** hace que ignore sus propios mensajes (protección contra bucles).
- Para «envío un mensaje al bot y este responde», use un **número distinto para el bot**.

## Instalación

```bash
openclaw plugins install @openclaw/signal
```

Las especificaciones de plugins sin calificar prueban primero ClawHub y, después, recurren a npm. Fuerce una fuente con `openclaw plugins install clawhub:@openclaw/signal` o `npm:@openclaw/signal`. `plugins install` registra y habilita el plugin; no se necesita un paso `enable` independiente. Consulte [Plugins](/es/tools/plugin) para conocer las reglas generales de instalación.

## Configuración rápida

<Steps>
  <Step title="Elija un número">
    Use un **número de Signal distinto** para el bot (recomendado).
  </Step>
  <Step title="Instale el plugin">
    ```bash
    openclaw plugins install @openclaw/signal
    ```
  </Step>
  <Step title="Ejecute la configuración guiada">
    ```bash
    openclaw channels add
    ```
    El asistente detecta si `signal-cli` está en `PATH` y, si falta, ofrece instalarlo: descarga la compilación nativa oficial de GraalVM en Linux x86-64 o lo instala mediante Homebrew en macOS y otras arquitecturas. Después, solicita el número del bot y la ruta `signal-cli`.

    Para la configuración no interactiva, `openclaw channels add --channel signal` también acepta `--signal-number <e164>` para el número de teléfono del bot, además de `--http-host <host>` y `--http-port <port>` para el endpoint del daemon de Signal (valor predeterminado: `127.0.0.1:8080`).

  </Step>
  <Step title="Vincule o registre la cuenta">
    - **Vinculación mediante QR (la más rápida):** `signal-cli link -n "OpenClaw"`; después, escanee el código con Signal. Consulte la [ruta A](#setup-path-a-link-existing-signal-account-qr).
    - **Registro mediante SMS:** número dedicado con captcha y verificación por SMS. Consulte la [ruta B](#setup-path-b-register-dedicated-bot-number-sms-linux).

  </Step>
  <Step title="Verifique y empareje">
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

| Campo        | Descripción                                       |
| ------------ | ------------------------------------------------- |
| `account`    | Número de teléfono del bot en formato E.164 (`+15551234567`) |
| `cliPath`    | Ruta a `signal-cli` (`signal-cli` si está en `PATH`)  |
| `configPath` | Directorio de configuración de signal-cli pasado como `--config`        |
| `dmPolicy`   | Política de acceso a mensajes directos (se recomienda `pairing`)          |
| `allowFrom`  | Números de teléfono o valores `uuid:<id>` autorizados para enviar mensajes directos |

Compatibilidad con varias cuentas: use `channels.signal.accounts` con configuración por cuenta y `name` opcional. Consulte [Canales con varias cuentas](/es/gateway/config-channels#multi-account-all-channels) para conocer el patrón compartido.

## Qué es

- Enrutamiento determinista: las respuestas siempre regresan a Signal.
- Los mensajes directos comparten la sesión principal del agente; los grupos están aislados (`agent:<agentId>:signal:group:<groupId>`).
- De forma predeterminada, Signal puede escribir actualizaciones de configuración activadas por `/config set|unset` (requiere `commands.config: true`). Deshabilítelo con `channels.signal.configWrites: false`.

## Ruta de configuración A: vincular una cuenta de Signal existente (QR)

1. Instale `signal-cli` (compilación para JVM o nativa), o deje que `openclaw channels add` lo instale.
2. Vincule una cuenta de bot: `signal-cli link -n "OpenClaw"`; después, escanee el código QR en Signal.
3. Configure Signal e inicie el Gateway.

## Ruta de configuración B: registrar un número dedicado para el bot (SMS, Linux)

Use esta opción para un número dedicado al bot en lugar de vincular una cuenta existente de la aplicación Signal. El flujo siguiente se ha probado en Ubuntu 24.

1. Obtenga un número que pueda recibir SMS (o verificación por voz en el caso de líneas fijas). Un número dedicado al bot evita conflictos de cuenta o sesión.
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
# Si ejecuta el Gateway como servicio systemd de usuario:
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
Registrar una cuenta de número de teléfono con `signal-cli` puede cerrar la sesión de la aplicación principal de Signal para ese número. Es preferible usar un número dedicado al bot o el modo de vinculación mediante QR para conservar la configuración existente de la aplicación del teléfono.
</Warning>

Referencias del proyecto original:

- README de `signal-cli`: `https://github.com/AsamK/signal-cli`
- Flujo de captcha: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Flujo de vinculación: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Modo de daemon externo (httpUrl)

Para gestionar `signal-cli` por su cuenta (inicios en frío lentos de JVM, inicialización del contenedor, CPU compartidas), ejecute el daemon por separado y configure OpenClaw para que se conecte a él:

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

Esto omite el inicio automático y la espera de inicio de OpenClaw. Para inicios automáticos lentos, establezca `channels.signal.startupTimeoutMs`.

## Modo de contenedor (bbernhard/signal-cli-rest-api)

En lugar de ejecutar `signal-cli` de forma nativa, use el contenedor Docker [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api), que encapsula `signal-cli` detrás de una interfaz REST + WebSocket.

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

| Valor         | Comportamiento                                                                             |
| ------------- | ------------------------------------------------------------------------------------ |
| `"auto"`      | (Predeterminado) Prueba ambos transportes; la transmisión valida la recepción mediante WebSocket del contenedor    |
| `"native"`    | Fuerza signal-cli nativo (JSON-RPC en `/api/v1/rpc`, SSE en `/api/v1/events`)         |
| `"container"` | Fuerza el contenedor bbernhard (REST en `/v2/send`, WebSocket en `/v1/receive/{account}`) |

Cuando `apiMode` es `"auto"`, OpenClaw almacena en caché el modo detectado durante 30 segundos por URL de daemon para evitar pruebas repetidas (el modo nativo prevalece cuando ambos transportes funcionan correctamente). La recepción mediante contenedor solo se selecciona para la transmisión después de que `/v1/receive/{account}` se actualice a WebSocket, lo que requiere `MODE=json-rpc`.

El modo de contenedor admite las mismas operaciones de Signal que el modo nativo cuando el contenedor expone API equivalentes: envío, recepción, archivos adjuntos, indicadores de escritura, confirmaciones de lectura y visualización, reacciones, grupos y texto con estilo. OpenClaw traduce las llamadas RPC nativas de Signal a las cargas REST del contenedor, incluidos los identificadores de grupo `group.{base64(internal_id)}` y `text_mode: "styled"` para el texto con formato.

Notas operativas:

- Use `autoStart: false` con el modo de contenedor; OpenClaw no debe iniciar un daemon nativo cuando se seleccione `apiMode: "container"`.
- Use `MODE=json-rpc` para la recepción. `MODE=normal` puede hacer que `/v1/about` parezca funcionar correctamente, pero `/v1/receive/{account}` no se actualizará a WebSocket, por lo que OpenClaw no seleccionará la recepción continua mediante contenedor en el modo `auto`.
- Establezca `apiMode: "container"` cuando `httpUrl` apunte a la API REST de bbernhard, `"native"` cuando apunte a JSON-RPC/SSE de `signal-cli` nativo y `"auto"` cuando la implementación pueda variar.
- Las descargas de archivos adjuntos del contenedor respetan los mismos límites de bytes multimedia que el modo nativo. Las respuestas que superan el tamaño permitido se rechazan antes de almacenarse por completo en el búfer cuando el servidor envía `Content-Length`, y durante la transmisión en caso contrario.

## Control de acceso (mensajes directos + grupos)

Mensajes directos:

- Valor predeterminado: `channels.signal.dmPolicy = "pairing"`.
- Los remitentes desconocidos reciben un código de emparejamiento; los mensajes se ignoran hasta que se aprueba (los códigos caducan después de 1 hora).
- Apruebe mediante `openclaw pairing list signal` y `openclaw pairing approve signal <CODE>`.
- El emparejamiento es el intercambio de tokens predeterminado para los mensajes directos de Signal. Detalles: [Emparejamiento](/es/channels/pairing)
- Los remitentes que solo tienen UUID (procedentes de `sourceUuid`) se almacenan como `uuid:<id>` en `channels.signal.allowFrom`.

Grupos:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` controla qué grupos o remitentes pueden activar respuestas de grupo cuando se establece `allowlist`; las entradas pueden ser identificadores de grupo de Signal (sin procesar, `group:<id>` o `signal:group:<id>`), números de teléfono de remitentes, valores `uuid:<id>` o `*`.
- `channels.signal.groups["<group-id>" | "*"]` puede sustituir el comportamiento del grupo mediante `requireMention`, `tools` y `toolsBySender`.
- Use `channels.signal.accounts.<id>.groups` para anulaciones por cuenta en configuraciones con varias cuentas.
- Añadir un grupo de Signal a la lista de permitidos mediante `groupAllowFrom` no deshabilita por sí solo el requisito de mención. Una entrada `channels.signal.groups["<group-id>"]` configurada específicamente procesa todos los mensajes del grupo, salvo que se establezca `requireMention=true`.
- Con `requireMention=true`, las @menciones nativas de Signal se cotejan, a partir de los metadatos estructurados de mención, con el teléfono o `accountUuid` de la cuenta del bot. Los `mentionPatterns` configurados siguen funcionando como alternativa de texto sin formato.
- Nota sobre la ejecución: si `channels.signal` falta por completo, la ejecución recurre a `groupPolicy="allowlist"` para las comprobaciones de grupos (incluso si se establece `channels.defaults.groupPolicy`).

Grupo con requisito de mención y contexto limitado:

```json5
{
  channels: {
    signal: {
      account: "+15551234567",
      accountUuid: "bot-signal-uuid",
      groupPolicy: "allowlist",
      groupAllowFrom: ["group:<signal-group-id>"],
      historyLimit: 8,
      groups: {
        "<signal-group-id>": { requireMention: true },
      },
    },
  },
  messages: {
    groupChat: {
      mentionPatterns: ["\\bopenclaw\\b"],
    },
  },
}
```

Los mensajes de grupo permitidos que no mencionan al bot permanecen sin respuesta y se conservan únicamente en la ventana limitada del historial pendiente. Cuando una @mención nativa posterior o una mención de texto alternativa activa el bot, OpenClaw incluye ese contexto reciente y responde al mismo grupo. Los cuerpos de los archivos adjuntos omitidos no se descargan; pueden aparecer únicamente como marcadores de posición multimedia compactos en el contexto pendiente.

## Cómo funciona (comportamiento)

- Modo nativo: `signal-cli` se ejecuta como daemon; el Gateway lee los eventos mediante SSE.
- Modo contenedor: el Gateway envía mediante la API REST y recibe mediante WebSocket.
- Los mensajes entrantes se normalizan en el sobre de canal compartido.
- Las respuestas siempre se enrutan al mismo número o grupo.
- Las respuestas a mensajes entrantes incluyen metadatos de cita nativos de Signal cuando el backend acepta la marca de tiempo y el autor del mensaje entrante; si faltan los metadatos de cita o se rechazan, OpenClaw envía la respuesta como un mensaje normal.
- Configure el uso de citas nativas con `channels.signal.replyToMode = off | first | all | batched`, o con `channels.signal.replyToModeByChatType.direct/group` para anulaciones por tipo de chat. Los valores de nivel de cuenta en `channels.signal.accounts.<id>` tienen prioridad.

## Contenido multimedia + límites

- El texto saliente se divide en fragmentos según `channels.signal.textChunkLimit` (valor predeterminado: 4000).
- División opcional por saltos de línea: establezca `channels.signal.streaming.chunkMode="newline"` para dividir por líneas en blanco (límites de párrafo) antes de dividir por longitud.
- Se admiten archivos adjuntos (obtenidos en base64 desde `signal-cli`).
- Los archivos adjuntos de notas de voz usan el nombre de archivo `signal-cli` como alternativa de MIME cuando falta `contentType`, para que la transcripción de audio pueda seguir clasificando las notas de voz AAC.
- Límite multimedia predeterminado: `channels.signal.mediaMaxMb` (valor predeterminado: 8).
- Use `channels.signal.ignoreAttachments` para omitir la descarga de contenido multimedia.
- El contexto del historial de grupo usa `channels.signal.historyLimit` (o `channels.signal.accounts.*.historyLimit`) y, como alternativa, `messages.groupChat.historyLimit`. Establezca `0` para desactivarlo (valor predeterminado: 50).

## Indicadores de escritura + confirmaciones de lectura

- **Indicadores de escritura**: OpenClaw envía señales de escritura mediante `signal-cli sendTyping` y las actualiza mientras se genera una respuesta.
- **Confirmaciones de lectura**: cuando `channels.signal.sendReadReceipts` es true, OpenClaw reenvía las confirmaciones de lectura de los mensajes directos permitidos.
- `signal-cli` no expone confirmaciones de lectura para los grupos.

## Reacciones de estado del ciclo de vida

Establezca `messages.statusReactions.enabled: true` para permitir que Signal muestre el ciclo de reacciones compartido de en cola/pensando/herramienta/Compaction/completado/error en los turnos entrantes. Signal usa la marca de tiempo del mensaje entrante como destino de la reacción; las reacciones de grupo se envían con el ID de grupo de Signal y el remitente original como autor de destino.

Las reacciones de estado también requieren una reacción de confirmación y un `messages.ackReactionScope` coincidente (`direct`, `group-all`, `group-mentions` o `all`). Establezca `channels.signal.reactionLevel: "off"` para desactivar las reacciones de estado de Signal.

Signal restaura la reacción de confirmación inicial después del estado final de completado/error.

## Reacciones (herramienta de mensajes)

Use `message action=react` con `channel=signal`.

- Destinos: E.164 o UUID del remitente (use `uuid:<id>` de la salida del emparejamiento; un UUID sin prefijo también funciona).
- `messageId` es la marca de tiempo de Signal del mensaje al que se reacciona.
- Las reacciones de grupo requieren `targetAuthor` o `targetAuthorUuid`.

```text
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

Configuración:

- `channels.signal.actions.reactions`: activa/desactiva las acciones de reacción (valor predeterminado: true).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive` (valor predeterminado: `minimal`).
  - `off`/`ack` desactiva las reacciones del agente (la herramienta de mensajes `react` produce errores).
  - `minimal`/`extensive` activa las reacciones del agente y establece el nivel de orientación.
- Anulaciones por cuenta: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Reacciones de aprobación

Las solicitudes de aprobación de ejecución y plugins de Signal usan los bloques de enrutamiento de nivel superior `approvals.exec` y `approvals.plugin`. Signal no tiene ningún bloque `channels.signal.execApprovals`.

- `👍` aprueba una vez.
- `👎` rechaza.
- Use `/approve <id> allow-always` cuando una solicitud ofrezca aprobación persistente.

La resolución de reacciones de aprobación requiere aprobadores explícitos de Signal procedentes de `channels.signal.allowFrom`, `channels.signal.defaultTo` o los campos coincidentes de nivel de cuenta. Las solicitudes directas de aprobación de ejecución en el mismo chat aún pueden ocultar la alternativa local duplicada `/approve` sin aprobadores explícitos; las aprobaciones de grupo sin aprobadores mantienen visible la alternativa local.

## Reacciones a preguntas

Para una solicitud `ask_user` con una pregunta no secreta de selección única y entre una y cuatro opciones, Signal muestra de `1️⃣` a `4️⃣` junto a las etiquetas de las opciones. Reaccione a la solicitud entregada con el número correspondiente para responderla. OpenClaw verifica que la reacción tenga como destino el mensaje creado por el bot y, a continuación, asigna el número a la opción canónica mediante el Gateway. Las pulsaciones obsoletas o duplicadas se ignoran. Las solicitudes con varias preguntas, selección múltiple o texto libre siguen admitiendo únicamente respuestas de texto; las reglas normales de admisión de mensajes directos/grupos de Signal autorizan al remitente.

## Destinos de entrega (CLI/cron)

- Mensajes directos: `signal:+15551234567` (o E.164 sin prefijo).
- Mensajes directos mediante UUID: `uuid:<id>` (o UUID sin prefijo).
- Grupos: `signal:group:<groupId>`.
- Nombres de usuario: `username:<name>` (si la cuenta de Signal los admite).

## Alias

Configure alias para disponer de nombres estables en destinos recurrentes de Signal. Los alias son únicamente configuración del lado de OpenClaw; no crean ni editan contactos de Signal.

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

Use alias en cualquier lugar donde se acepten destinos de entrega de Signal:

```bash
openclaw message send --channel signal --target signal:ops --message "El despliegue se ha completado"
```

Los alias por cuenta heredan los alias de nivel superior y pueden añadir o anular nombres:

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

`openclaw directory peers list --channel signal` y `openclaw directory groups list --channel signal` enumeran los alias configurados. El directorio de Signal está respaldado por la configuración; no consulta en tiempo real los contactos de Signal ni modifica la cuenta de Signal.

## Solución de problemas

Ejecute primero esta secuencia:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Después, confirme el estado del emparejamiento de mensajes directos si es necesario:

```bash
openclaw pairing list signal
```

Fallos comunes:

- Se puede acceder al daemon, pero no hay respuestas: verifique la configuración de la cuenta/del daemon (`httpUrl`, `account`) y el modo de recepción.
- Se ignoran los mensajes directos: el remitente tiene pendiente la aprobación del emparejamiento.
- Se ignoran los mensajes de grupo: las restricciones de remitente/mención del grupo bloquean la entrega.
- Errores de validación de la configuración después de editarla: ejecute `openclaw doctor --fix`.
- Signal no aparece en los diagnósticos: confirme `channels.signal.enabled: true`.

Comprobaciones adicionales:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

Para consultar el flujo de triaje: [Solución de problemas de canales](/es/channels/troubleshooting).

## Notas de seguridad

- `signal-cli` almacena localmente las claves de la cuenta (normalmente en `~/.local/share/signal-cli/data/`).
- Realice una copia de seguridad del estado de la cuenta de Signal antes de migrar o reconstruir el servidor.
- Mantenga `channels.signal.dmPolicy: "pairing"` salvo que desee explícitamente un acceso más amplio a los mensajes directos.
- La verificación por SMS solo es necesaria para los flujos de registro o recuperación, pero perder el control del número o de la cuenta puede complicar un nuevo registro.

## Referencia de configuración (Signal)

Configuración completa: [Configuración](/es/gateway/configuration)

Opciones del proveedor:

- `channels.signal.enabled`: activar/desactivar el inicio del canal.
- `channels.signal.apiMode`: `auto | native | container` (valor predeterminado: automático). Consulte [Modo contenedor](#container-mode-bbernhardsignal-cli-rest-api).
- `channels.signal.account`: E.164 de la cuenta del bot.
- `channels.signal.accountUuid`: UUID opcional de la cuenta del bot para la detección nativa de @menciones y la protección contra bucles.
- `channels.signal.cliPath`: ruta a `signal-cli`.
- `channels.signal.configPath`: directorio `signal-cli --config` opcional.
- `channels.signal.httpUrl`: URL completa del daemon y enlace canónico del daemon (valor predeterminado: `http://127.0.0.1:8080`).
- `channels.signal.autoStart`: iniciar automáticamente el daemon (valor predeterminado: verdadero si `httpUrl` no está definido).
- `channels.signal.startupTimeoutMs`: tiempo de espera al inicio en ms (mín. 1000, máx. 120000; valor predeterminado: 30000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: omitir las descargas de archivos adjuntos.
- `channels.signal.ignoreStories`: ignorar las historias del daemon.
- `channels.signal.sendReadReceipts`: reenviar las confirmaciones de lectura.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (valor predeterminado: emparejamiento).
- `channels.signal.allowFrom`: lista de permitidos de mensajes directos (E.164 o `uuid:<id>`). `open` requiere `"*"`. Signal no tiene nombres de usuario; utilice identificadores de teléfono/UUID.
- `channels.signal.aliases`: alias del lado de OpenClaw para destinos de entrega de mensajes directos o grupos.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (valor predeterminado: lista de permitidos).
- `channels.signal.groupAllowFrom`: lista de permitidos de grupos; acepta identificadores de grupo de Signal (sin procesar, `group:<id>` o `signal:group:<id>`), números E.164 del remitente o valores `uuid:<id>`.
- `channels.signal.groups`: anulaciones por grupo cuya clave es el identificador de grupo de Signal (o `"*"`). Campos admitidos: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: versión por cuenta de `channels.signal.groups` para configuraciones con varias cuentas.
- `channels.signal.accounts.<id>.aliases`: alias por cuenta, combinados con los alias de nivel superior.
- `channels.signal.replyToMode`: modo nativo de cita de respuesta, `off | first | all | batched` (valor predeterminado: `all`).
- `channels.signal.replyToModeByChatType.direct`, `channels.signal.replyToModeByChatType.group`: anulaciones de citas de respuesta nativas por tipo de chat.
- `channels.signal.accounts.<id>.replyToMode`, `channels.signal.accounts.<id>.replyToModeByChatType.direct`, `channels.signal.accounts.<id>.replyToModeByChatType.group`: anulaciones de citas de respuesta por cuenta.
- `channels.signal.historyLimit`: número máximo de mensajes de grupo que se incluirán como contexto (0 lo desactiva).
- `channels.signal.dmHistoryLimit`: límite del historial de mensajes directos en turnos del usuario. Anulaciones por usuario: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: tamaño de los fragmentos salientes en caracteres (valor predeterminado: 4000).
- `channels.signal.streaming.chunkMode`: `length` (valor predeterminado) o `newline` para dividir por líneas en blanco (límites de párrafo) antes de fragmentar por longitud.
- `channels.signal.mediaMaxMb`: límite de contenido multimedia entrante/saliente en MB (valor predeterminado: 8).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive` (valor predeterminado: `minimal`). Consulte [Reacciones](#reactions-message-tool).
- `channels.signal.reactionNotifications`: `off | own | all | allowlist` (valor predeterminado: `own`) - cuándo se notifica al agente sobre las reacciones entrantes de otras personas.
- `channels.signal.reactionAllowlist`: remitentes cuyas reacciones notifican al agente cuando `reactionNotifications: "allowlist"`.
- `channels.signal.streaming.block.enabled`, `channels.signal.streaming.block.coalesce`: controles de streaming en modo de bloques compartidos entre canales. Consulte [Streaming](/es/concepts/streaming).

Opciones globales relacionadas:

- `agents.entries.*.groupChat.mentionPatterns` (alternativa de texto sin formato; las @menciones nativas de Signal se detectan a partir de metadatos estructurados cuando se configura la identidad de la cuenta del bot).
- `messages.groupChat.mentionPatterns` (alternativa global).
- `channels.signal.responsePrefix` o un `responsePrefix` a nivel de cuenta.

## Contenido relacionado

- [Descripción general de los canales](/es/channels) - todos los canales compatibles
- [Emparejamiento](/es/channels/pairing) - flujo de autenticación y emparejamiento de mensajes directos
- [Grupos](/es/channels/groups) - comportamiento del chat grupal y control mediante menciones
- [Enrutamiento de canales](/es/channels/channel-routing) - enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) - modelo de acceso y refuerzo de la seguridad
