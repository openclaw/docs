---
read_when:
    - Quieres conectar OpenClaw a QQ
    - Necesitas configurar las credenciales de QQ Bot
    - Quieres soporte de QQ Bot para grupos o chats privados
summary: Configuración, ajuste y uso del bot de QQ
title: bot de QQ
x-i18n:
    generated_at: "2026-07-05T11:04:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a63f31014c376573456157d5268b9828ce4c0ae8337e4f6428bb57322dd10916
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot se conecta a OpenClaw mediante la API oficial de QQ Bot (Gateway WebSocket).
El chat privado C2C y las `@`-menciones de grupo son los tipos de chat principales, con contenido multimedia enriquecido
(imágenes, voz, video, archivos). Los mensajes de canales de guild son compatibles solo con
texto e imágenes de URL remota; voz, video, cargas de archivos e imágenes locales/Base64
no están disponibles en canales de guild. Las reacciones y los hilos no son
compatibles en ningún lugar.

Estado: Plugin descargable oficial.

## Instalar

```bash
openclaw plugins install @openclaw/qqbot
```

## Configuración

1. Ve a [QQ Open Platform](https://q.qq.com/) y escanea el código QR con tu
   QQ del teléfono para registrarte / iniciar sesión.
2. Haz clic en **Create Bot** para crear un nuevo bot de QQ.
3. Busca **AppID** y **AppSecret** en la página de configuración del bot y cópialos.

<Note>
AppSecret no se almacena en texto plano. Si sales de la página sin guardarlo, tendrás que regenerar uno nuevo.
</Note>

4. Agrega el canal:

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. Reinicia el Gateway.

Configuración interactiva:

```bash
openclaw channels add
```

El asistente también ofrece la vinculación mediante código QR como alternativa a escribir AppID/AppSecret
manualmente: escanea el código con la aplicación del teléfono vinculada al QQ Bot de destino para completar
la vinculación. OpenClaw conserva las credenciales devueltas dentro del alcance de configuración
de la cuenta.

## Configurar

Configuración mínima:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecret: "YOUR_APP_SECRET",
    },
  },
}
```

Variables de entorno de la cuenta predeterminada (solo cuenta de nivel superior):

- `QQBOT_APP_ID`
- `QQBOT_CLIENT_SECRET`

AppSecret respaldado por archivo:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecretFile: "/path/to/qqbot-secret.txt",
    },
  },
}
```

AppSecret SecretRef de entorno:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecret: { source: "env", provider: "default", id: "QQBOT_CLIENT_SECRET" },
    },
  },
}
```

Notas:

- `openclaw channels add --channel qqbot --token-file ...` establece solo el AppSecret;
  `appId` ya debe estar establecido en la configuración o en `QQBOT_APP_ID`.
- `clientSecret` acepta una cadena de texto plano, una ruta de archivo (`clientSecretFile`)
  o un objeto SecretRef estructurado.
- Las cadenas de marcador heredadas `secretref:...` / `secretref-env:...` se rechazan para
  `clientSecret`; usa en su lugar un objeto SecretRef estructurado.

### Política de acceso

- `allowFrom` / `groupAllowFrom` controlan quién puede chatear con el bot en contextos C2C /
  de grupo. `dmPolicy` / `groupPolicy` (`open` | `allowlist` | `disabled`)
  controlan el modo de aplicación. `dmPolicy` toma como valor predeterminado `allowlist` cuando
  `allowFrom` tiene una entrada concreta (sin comodín); de lo contrario, `open`.
  `groupPolicy` toma como valor predeterminado `allowlist` cuando `groupAllowFrom` o
  `allowFrom` tiene una entrada concreta; de lo contrario, `open`.
- Los comandos slash "Auth: allowlist" requieren una entrada explícita sin comodín en
  `allowFrom` (o `groupAllowFrom` para invocaciones de grupo) independientemente de
  `dmPolicy` / `groupPolicy`; consulta [Comandos slash](#slash-commands).

### Configuración de múltiples cuentas

Ejecuta varios bots de QQ en una sola instancia de OpenClaw:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "111111111",
      clientSecret: "secret-of-bot-1",
      accounts: {
        bot2: {
          enabled: true,
          appId: "222222222",
          clientSecret: "secret-of-bot-2",
        },
      },
    },
  },
}
```

Cada cuenta posee una conexión WebSocket, un cliente de API y una caché de tokens aislados, identificados por `appId`. Las líneas de registro se etiquetan con el id de la cuenta propietaria para que los diagnósticos sigan separados cuando ejecutes varios bots bajo un Gateway.

Añade un segundo bot mediante la CLI:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Chats de grupo

La compatibilidad con grupos usa OpenIDs de grupos de QQ, no nombres visibles. Añade el bot a un grupo y luego menciónalo o configura el grupo para ejecutarse sin mención.

```json5
{
  channels: {
    qqbot: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["member_openid"],
      groups: {
        "*": {
          requireMention: true,
          commandLevel: "all",
          historyLimit: 50,
          tools: { deny: ["exec", "read", "write"] },
        },
        GROUP_OPENID: {
          name: "Sala de lanzamientos",
          requireMention: false,
          ignoreOtherMentions: true,
          commandLevel: "safety",
          historyLimit: 20,
          prompt: "Mantén las respuestas breves y operativas.",
        },
      },
    },
  },
}
```

`groups["*"]` establece valores predeterminados para todos los grupos; una entrada concreta `groups.GROUP_OPENID` anula esos valores predeterminados para un grupo. Configuración de grupo:

| Campo                 | Valor predeterminado       | Descripción                                                                                                     |
| --------------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `requireMention`      | `true`                     | Requiere una mención con `@` antes de que el bot responda.                                                       |
| `commandLevel`        | `all`                      | Qué comandos de barra integrados pueden ejecutarse en el grupo (consulta abajo).                                 |
| `ignoreOtherMentions` | `false`                    | Descarta mensajes que mencionan a otra persona, pero no al bot.                                                  |
| `historyLimit`        | `50`                       | Mensajes recientes sin mención conservados como contexto para el siguiente turno mencionado. `0` desactiva el historial. |
| `tools`               | —                          | Permitir/denegar herramientas para todo el grupo.                                                               |
| `toolsBySender`       | —                          | Anulaciones de herramientas por remitente; consulta [Grupos](/es/channels/groups#groupchannel-tool-restrictions-optional). |
| `name`                | prefijo de openid          | Etiqueta descriptiva usada en registros y contexto de grupo.                                                     |
| `prompt`              | valor predeterminado integrado | Prompt de comportamiento por grupo añadido al contexto del agente.                                               |

`commandLevel` acepta:

| Nivel    | Comportamiento                                                                                                                                 |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `all`    | Los comandos integrados existentes siguen disponibles. Algunos permanecen ocultos en los menús, pero los usuarios autorizados aún pueden ejecutarlos en el grupo. |
| `safety` | `/help`, `/btw`, `/stop` siguen visibles en el grupo; los comandos sensibles (`/config`, `/tools`, `/bash`, etc.) deben ejecutarse en chat privado. |
| `strict` | Solo se permiten los controles de sesión de grupo necesarios para el funcionamiento estricto. `/stop` aún funciona para que un remitente autorizado pueda interrumpir una ejecución activa. |

Las entradas antiguas `toolPolicy` de QQBot están retiradas. Ejecuta `openclaw doctor --fix` para migrarlas a `tools`.

Los modos de activación son `mention` y `always`. `requireMention: true` se asigna a `mention`; `requireMention: false` se asigna a `always`. Una anulación de activación a nivel de sesión, cuando existe, prevalece sobre la configuración.

La cola de entrada es por par. Los pares de grupo tienen un límite de cola mayor (50 frente a 20 para pares directos), expulsan mensajes escritos por el bot antes que los de humanos cuando está llena y fusionan ráfagas de mensajes normales de grupo en un único turno atribuido. Los comandos de barra se ejecutan uno por uno, independientemente de cualquier lote fusionado.

### Voz (STT / TTS)

La compatibilidad con STT y TTS usa configuración de dos niveles con reserva por prioridad:

| Ajuste | Específico del Plugin                                    | Reserva del framework         |
| ------ | -------------------------------------------------------- | ----------------------------- |
| STT    | `channels.qqbot.stt`                                     | `tools.media.audio.models[0]` |
| TTS    | `channels.qqbot.tts`, `channels.qqbot.accounts.<id>.tts` | `messages.tts`                |

```json5
{
  channels: {
    qqbot: {
      stt: {
        provider: "your-provider",
        model: "your-stt-model",
      },
      tts: {
        provider: "your-provider",
        model: "your-tts-model",
        voice: "your-voice",
      },
      accounts: {
        "qq-main": {
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
        },
      },
    },
  },
}
```

Establece `enabled: false` en cualquiera de los dos para desactivarlo. Las anulaciones de TTS a nivel de cuenta usan la misma forma que `messages.tts` y se fusionan en profundidad sobre la configuración de TTS de canal/global.

Los adjuntos de voz entrantes de QQ se exponen a los agentes como metadatos de medios de audio, manteniendo los archivos de voz sin procesar fuera de los `MediaPaths` genéricos. `[[audio_as_voice]]` en una respuesta de texto sin formato sintetiza TTS y envía un mensaje de voz nativo de QQ cuando TTS está configurado.

El comportamiento de subida/transcodificación de audio saliente también puede ajustarse con `channels.qqbot.audioFormatPolicy`:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Formatos de destino

| Formato                    | Descripción        |
| -------------------------- | ------------------ |
| `qqbot:c2c:OPENID`         | Chat privado (C2C) |
| `qqbot:group:GROUP_OPENID` | Chat de grupo      |
| `qqbot:channel:CHANNEL_ID` | Canal de gremio    |

<Note>
Cada bot tiene su propio conjunto de OpenIDs de usuario. Un OpenID recibido por el Bot A **no puede** usarse para enviar mensajes mediante el Bot B.
</Note>

## Comandos de barra

Comandos integrados interceptados antes de la cola de IA:

| Comando              | Autorización | Alcance          | Descripción                                                                 |
| -------------------- | ------------ | ---------------- | --------------------------------------------------------------------------- |
| `/bot-ping`          | —            | cualquiera       | Prueba de latencia                                                          |
| `/bot-help`          | —            | cualquiera       | Enumera todos los comandos                                                  |
| `/bot-me`            | —            | solo privado     | Muestra el ID de usuario QQ (openid) del remitente para configurar `allowFrom` / `groupAllowFrom` |
| `/bot-version`       | —            | solo privado     | Muestra la versión del framework OpenClaw y la versión del plugin           |
| `/bot-upgrade`       | —            | solo privado     | Muestra el enlace a la guía de actualización de QQBot                       |
| `/bot-approve`       | allowlist    | solo privado     | Gestiona la configuración de aprobación de ejecución de comandos (on / off / always / reset / status) |
| `/bot-logs`          | allowlist    | solo privado     | Exporta los registros recientes del Gateway como archivo                    |
| `/bot-clear-storage` | allowlist    | solo privado     | Elimina descargas en caché bajo el directorio de medios de QQBot            |
| `/bot-streaming`     | allowlist    | solo privado     | Alterna las respuestas en streaming de C2C                                  |
| `/bot-group-allways` | allowlist    | solo privado     | Alterna el modo predeterminado de activación de grupo (requiere mención vs. siempre activo) |

Añade `?` a cualquier comando para obtener ayuda de uso (por ejemplo, `/bot-upgrade ?`).

Los comandos con "Autorización: allowlist" requieren además el openid del remitente en una lista explícita no comodín `allowFrom` (`groupAllowFrom` tiene prioridad para comandos emitidos desde grupos, con reserva en `allowFrom`). Un comodín `allowFrom: ["*"]` permite chatear, pero no estos comandos. Ejecutar uno de ellos fuera del chat privado, o sin autorización, devuelve una sugerencia en lugar de descartar silenciosamente el mensaje.

`/bot-me`, `/bot-version` y `/bot-upgrade` son exclusivos de chat privado, pero no requieren allowlist: cualquier remitente C2C puede ejecutarlos.

Cuando las aprobaciones de exec de QQ Bot usan la reserva predeterminada del mismo chat, los clics en botones de aprobación nativos siguen la misma lista explícita de comandos permitidos sin comodines. Para conceder acceso solo de aprobación sin un acceso más amplio a comandos, configura `channels.qqbot.execApprovals.approvers`. Las aprobaciones de exec nativas están habilitadas de forma predeterminada.

## Medios y almacenamiento

- Los medios entrantes, salientes y del puente de Gateway comparten una única raíz de carga útil en
  `~/.openclaw/media/qqbot` (respetando `OPENCLAW_HOME` cuando está configurado), de modo que las cargas,
  descargas y cachés de transcodificación permanecen bajo un único directorio protegido.
- La entrega de medios enriquecidos para destinos C2C y de grupo pasa por una única ruta `sendMedia`.
  Los archivos locales y los búferes en memoria de 5&nbsp;MiB o más usan los endpoints de carga fragmentada de QQ; las cargas útiles más pequeñas y las fuentes de URL remota/Base64 usan la API de carga de una sola vez.
- Si una actualización en caliente interrumpe el Gateway antes de que termine de escribir
  `openclaw.json`, el Plugin restaura el último `appId` / `clientSecret`
  conocido para esa cuenta desde una instantánea interna en el siguiente inicio (sin
  sobrescribir nunca un cambio intencional de configuración), por lo que no es
  necesario volver a escanear el código QR.

## Solución de problemas

- **El Gateway no inicia / no hay mensajes entrantes:** verifica que `appId` y
  `clientSecret` sean correctos y que el bot esté habilitado en QQ Open Platform.
  Una credencial faltante aparece como "QQBot no configurado (falta appId o
  clientSecret)".
- **La configuración con `--token-file` sigue apareciendo como no configurada:** `--token-file` solo
  establece AppSecret. `appId` aún debe estar configurado en la configuración o en `QQBOT_APP_ID`.
- **Las respuestas de grupo en ráfaga colisionan:** la cola entrante expulsa los
  mensajes escritos por el bot antes que los humanos cuando se llena la cola de un par, y fusiona
  ráfagas de mensajes de grupo normales (no comandos) en un único turno atribuido, por lo que
  una avalancha de charla del bot no debería privar de atención a los mensajes humanos.
- **No llegan los mensajes proactivos:** QQ puede bloquear los mensajes iniciados por el bot si
  el usuario no ha interactuado recientemente.
- **La voz no se transcribe:** asegúrate de que STT esté configurado y de que el proveedor sea
  accesible.

## Relacionado

- [Emparejamiento](/es/channels/pairing)
- [Grupos](/es/channels/groups)
- [Solución de problemas de canales](/es/channels/troubleshooting)
