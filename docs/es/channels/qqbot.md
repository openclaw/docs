---
read_when:
    - Quieres conectar OpenClaw con QQ
    - Necesita configurar las credenciales de QQ Bot
    - Quieres compatibilidad con chats grupales o privados de QQ Bot
summary: Configuración y uso del bot de QQ
title: Bot de QQ
x-i18n:
    generated_at: "2026-07-22T10:25:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b185a2b1182471bbec3688b40fb72b671bdf3a2e8351aa6e2f7918f4f5936825
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot se conecta a OpenClaw mediante la API oficial de QQ Bot (Gateway WebSocket).
El chat privado C2C y las menciones `@` en grupos son los principales tipos de chat, con contenido
multimedia enriquecido (imágenes, voz, vídeo, archivos). Los mensajes de canales de gremio solo admiten
texto e imágenes mediante URL remotas; la voz, el vídeo, la carga de archivos y las imágenes
locales/Base64 no están disponibles en los canales de gremio. Las reacciones y los hilos no se
admiten en ningún lugar.

Estado: plugin oficial descargable.

## Instalación

```bash
openclaw plugins install @openclaw/qqbot
```

## Configuración inicial

1. Vaya a la [Plataforma Abierta de QQ](https://q.qq.com/) y escanee el código QR con QQ en su
   teléfono para registrarse o iniciar sesión.
2. Haga clic en **Create Bot** para crear un nuevo bot de QQ.
3. Busque **AppID** y **AppSecret** en la página de configuración del bot y cópielos.

<Note>
AppSecret no se almacena como texto sin formato. Si abandona la página sin guardarlo, tendrá que generar uno nuevo.
</Note>

4. Añada el canal:

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. Reinicie el Gateway.

## Durabilidad de la entrada

Para los eventos de turno del gateway de QQ, OpenClaw conserva el evento sin procesar antes de avanzar la secuencia de reanudación guardada del gateway. Los turnos pendientes o reintentables sobreviven a un reinicio del Gateway, permanecen serializados por conversación y utilizan el ID de evento del proveedor para evitar entradas duplicadas en la cola mientras exista el registro de finalización activo o retenido.

Si falla la admisión duradera, OpenClaw cierra el socket actual del gateway sin avanzar la secuencia. La ruta de reconexión/reanudación puede solicitar de nuevo el evento no confirmado. La entrega sigue siendo al menos una vez entre la cola y el agente, por lo que un fallo durante la transferencia puede reproducir un turno.

Configuración interactiva:

```bash
openclaw channels add
```

El asistente también ofrece la vinculación mediante código QR como alternativa a introducir AppID/AppSecret
manualmente: escanee el código con la aplicación del teléfono vinculada al QQ Bot de destino para completar
la vinculación. OpenClaw conserva las credenciales devueltas en el ámbito de configuración
de la cuenta.

## Configuración

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

Variables de entorno de la cuenta predeterminada (solo la cuenta de nivel superior):

- `QQBOT_APP_ID`
- `QQBOT_CLIENT_SECRET`

AppSecret respaldado por un archivo:

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

AppSecret mediante SecretRef de entorno:

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

- `openclaw channels add --channel qqbot --token-file ...` establece únicamente AppSecret;
  `appId` ya debe estar definido en la configuración o en `QQBOT_APP_ID`.
- `clientSecret` acepta una cadena de texto sin formato, una ruta de archivo (`clientSecretFile`)
  o un objeto SecretRef estructurado.
- Las cadenas de marcadores heredadas `secretref:...` / `secretref-env:...` se rechazan para
  `clientSecret`; utilice en su lugar un objeto SecretRef estructurado.

### Transmisión

```json5
{
  channels: {
    qqbot: {
      streaming: {
        mode: "partial", // transmisión por bloques: "partial" (predeterminado) u "off"
        nativeTransport: true, // usar la API oficial stream_messages de QQ para mensajes directos C2C
      },
    },
  },
}
```

- `streaming.mode: "off"` desactiva la transmisión por bloques para la cuenta.
- `streaming.nativeTransport: true` transmite las respuestas C2C (mensajes directos) mediante la
  API oficial `stream_messages` de QQ; los destinos de grupo/canal no se ven afectados.
- Los escalares heredados `streaming: true|false` y la clave `streaming.c2cStreamApi`
  se migran a esta estructura mediante `openclaw doctor --fix`.
- `/bot-streaming on|off` alterna la misma configuración desde un mensaje directo.

### Política de acceso

- `allowFrom` / `groupAllowFrom` controlan quién puede chatear con el bot en contextos C2C /
  de grupo. `dmPolicy` / `groupPolicy` (`open` | `allowlist` | `disabled`)
  controlan el modo de aplicación. `dmPolicy` adopta de forma predeterminada `allowlist` cuando
  `allowFrom` tiene una entrada concreta (sin comodines); de lo contrario, adopta `open`.
  `groupPolicy` adopta de forma predeterminada `allowlist` cuando `groupAllowFrom` o
  `allowFrom` tiene una entrada concreta; de lo contrario, adopta `open`.
- Los comandos de barra «Autenticación: lista de permitidos» requieren una entrada explícita sin comodines en
  `allowFrom` (o `groupAllowFrom` para invocaciones de grupo), independientemente de
  `dmPolicy` / `groupPolicy`; consulte [Comandos de barra](#slash-commands).

### Configuración de varias cuentas

Ejecute varios bots de QQ en una única instancia de OpenClaw:

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

Cada cuenta dispone de una conexión WebSocket, un cliente de API y una caché de tokens
aislados, identificados por `appId`. Las líneas de registro se etiquetan con el ID de la cuenta propietaria para que
los diagnósticos permanezcan separados al ejecutar varios bots en un mismo Gateway.

Añada un segundo bot mediante la CLI:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Chats de grupo

La compatibilidad con grupos utiliza los OpenID de grupos de QQ, no los nombres para mostrar. Añada el bot a un
grupo y, a continuación, menciónelo o configure el grupo para que funcione sin menciones.

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
          name: "Release room",
          requireMention: false,
          ignoreOtherMentions: true,
          commandLevel: "safety",
          historyLimit: 20,
          prompt: "Keep replies short and operational.",
        },
      },
    },
  },
}
```

`groups["*"]` establece los valores predeterminados para todos los grupos; una entrada concreta `groups.GROUP_OPENID`
sobrescribe esos valores predeterminados para un grupo. Configuración de grupos:

| Campo                 | Valor predeterminado          | Descripción                                                                                        |
| --------------------- | ---------------- | -------------------------------------------------------------------------------------------------- |
| `requireMention`      | `true`           | Requiere una mención `@` antes de que el bot responda.                                                     |
| `commandLevel`        | `all`            | Qué comandos de barra integrados pueden ejecutarse en el grupo (véase más adelante).                                    |
| `ignoreOtherMentions` | `false`          | Descarta los mensajes que mencionan a otra persona, pero no al bot.                                           |
| `historyLimit`        | `50`             | Mensajes recientes sin menciones que se conservan como contexto para el siguiente turno con mención. `0` desactiva el historial.     |
| `tools`               | —                | Permite o deniega herramientas para todo el grupo.                                                              |
| `toolsBySender`       | —                | Modificaciones de herramientas por remitente; consulte [Grupos](/es/channels/groups#groupchannel-tool-restrictions-optional). |
| `name`                | prefijo openid    | Etiqueta descriptiva utilizada en los registros y el contexto del grupo.                                                     |
| `prompt`              | valor predeterminado integrado | Instrucción de comportamiento por grupo que se añade al contexto del agente.                                           |

`commandLevel` acepta:

| Nivel    | Comportamiento                                                                                                                                      |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `all`    | Los comandos integrados existentes siguen disponibles. Algunos permanecen ocultos en los menús, pero los usuarios autorizados aún pueden ejecutarlos en el grupo.                  |
| `safety` | `/help`, `/btw`, `/stop` permanecen visibles en el grupo; los comandos sensibles (`/config`, `/tools`, `/bash`, etc.) deben ejecutarse en un chat privado.      |
| `strict` | Solo se permiten los controles de sesión de grupo necesarios para un funcionamiento estricto. `/stop` sigue funcionando para que un remitente autorizado pueda interrumpir una ejecución activa. |

Las entradas antiguas `toolPolicy` de QQBot están retiradas. Ejecute `openclaw doctor --fix` para migrarlas a `tools`.

Los modos de activación son `mention` y `always`. `requireMention: true` se asigna a
`mention`; `requireMention: false` se asigna a `always`. Una modificación de activación
a nivel de sesión, si existe, prevalece sobre la configuración.

La cola de entrada es por interlocutor. Los interlocutores de grupo tienen un límite de cola mayor (50 frente a 20
para los interlocutores directos), desalojan los mensajes creados por el bot antes que los humanos cuando se llena
y combinan las ráfagas de mensajes normales del grupo en un único turno atribuido. Los comandos de barra
se ejecutan uno a uno, independientemente de cualquier lote combinado.

### Voz (STT/TTS)

STT y TTS admiten una configuración de dos niveles con reserva por prioridad:

| Configuración | Específica del plugin                                          | Reserva del framework                               |
| ------- | -------------------------------------------------------- | ------------------------------------------------ |
| STT     | `channels.qqbot.stt`                                     | primera entrada `tools.media.models[]` compatible con audio |
| TTS     | `channels.qqbot.tts`, `channels.qqbot.accounts.<id>.tts` | `tts`                                            |

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

Establezca `enabled: false` en cualquiera de los dos para desactivarlo. Las modificaciones de TTS a nivel de cuenta utilizan la
misma estructura que `tts` y se combinan en profundidad sobre la configuración de TTS del canal/global.

Las solicitudes STT agotan el tiempo de espera después de 60 segundos de forma predeterminada. El STT específico del plugin utiliza la
modificación seleccionada `models.providers.<id>.timeoutSeconds`. El STT de audio del framework
utiliza `timeoutSeconds` de la entrada seleccionada `tools.media.models[]` compatible con audio y, a continuación, la modificación del proveedor seleccionado.

Los adjuntos de voz entrantes de QQ se exponen a los agentes como metadatos de contenido de audio,
a la vez que se mantienen los archivos de voz sin procesar fuera de `MediaPaths` genérico. `[[audio_as_voice]]`
en una respuesta de texto sin formato sintetiza TTS y envía un mensaje de voz nativo de QQ cuando
TTS está configurado.

El comportamiento de carga/transcodificación de audio saliente también puede ajustarse con
`channels.qqbot.audioFormatPolicy`:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Formatos de destino

| Formato                     | Descripción        |
| -------------------------- | ------------------ |
| `qqbot:c2c:OPENID`         | Chat privado (C2C) |
| `qqbot:group:GROUP_OPENID` | Chat de grupo         |
| `qqbot:channel:CHANNEL_ID` | Canal de gremio      |

<Note>
Cada bot tiene su propio conjunto de OpenID de usuario. Un OpenID recibido por el bot A **no puede** utilizarse para enviar mensajes mediante el bot B.
</Note>

## Comandos de barra

Comandos integrados interceptados antes de la cola de IA:

| Comando              | Autorización      | Ámbito        | Descripción                                                                    |
| -------------------- | --------- | ------------ | ------------------------------------------------------------------------------ |
| `/bot-ping`          | —         | cualquiera          | Prueba de latencia                                                                   |
| `/bot-help`          | —         | cualquiera          | Enumerar todos los comandos                                                              |
| `/bot-me`            | —         | solo privado | Mostrar el ID de usuario de QQ (openid) del remitente para configurar `allowFrom` / `groupAllowFrom` |
| `/bot-version`       | —         | solo privado | Mostrar la versión del framework OpenClaw y la versión del plugin                         |
| `/bot-upgrade`       | —         | solo privado | Mostrar el enlace a la guía de actualización de QQBot                                              |
| `/bot-approve`       | lista de permitidos | solo privado | Gestionar la configuración de aprobación de ejecución de comandos (on / off / always / reset / status)  |
| `/bot-logs`          | lista de permitidos | solo privado | Exportar los registros recientes del Gateway como archivo                                           |
| `/bot-clear-storage` | lista de permitidos | solo privado | Eliminar las descargas almacenadas en caché del directorio multimedia de QQBot                        |
| `/bot-streaming`     | lista de permitidos | solo privado | Activar o desactivar las respuestas de transmisión C2C                                                   |
| `/bot-group-allways` | lista de permitidos | solo privado | Alternar el modo de activación predeterminado de los grupos (mención obligatoria frente a siempre activo)      |

Añada `?` a cualquier comando para obtener ayuda sobre su uso (por ejemplo, `/bot-upgrade ?`).

Los comandos con «Autorización: lista de permitidos» requieren además que el openid del remitente figure en una
lista `allowFrom` explícita sin comodines (`groupAllowFrom` tiene prioridad para los
comandos emitidos desde grupos y, si no está disponible, se usa `allowFrom`). El comodín
`allowFrom: ["*"]` permite chatear, pero no ejecutar estos comandos. Al ejecutar uno de ellos
fuera de un chat privado o sin autorización, se devuelve una indicación en lugar de
descartar silenciosamente el mensaje.

`/bot-me`, `/bot-version` y `/bot-upgrade` solo están disponibles en chats privados, pero no
requieren la lista de permitidos: cualquier remitente C2C puede ejecutarlos.

Cuando las aprobaciones de ejecución de QQ Bot usan el mecanismo alternativo predeterminado del mismo chat, los clics en los
botones de aprobación nativos siguen la misma lista explícita de comandos permitidos sin comodines. Para
conceder acceso solo a las aprobaciones sin un acceso más amplio a los comandos, configure
`channels.qqbot.execApprovals.approvers`. Las aprobaciones de ejecución nativas están habilitadas de forma
predeterminada.

## Contenido multimedia y almacenamiento

- El contenido multimedia entrante, saliente y del puente del Gateway comparte una única raíz de cargas útiles en
  `~/.openclaw/media/qqbot` (respetando `OPENCLAW_HOME` cuando está definido), por lo que las cargas,
  las descargas y las cachés de transcodificación permanecen en un único directorio protegido.
- La entrega de contenido multimedia enriquecido a destinos C2C y de grupo pasa por una única ruta `sendMedia`.
  Los archivos locales y los búferes en memoria de 5&nbsp;MiB o más utilizan los
  endpoints de carga por fragmentos de QQ; las cargas útiles más pequeñas y las fuentes de URL remota/Base64 utilizan
  la API de carga en una sola operación.
- Si una actualización en caliente interrumpe el Gateway antes de que termine de escribir
  `openclaw.json`, el plugin restaura los últimos `appId` / `clientSecret` conocidos
  de esa cuenta a partir de una instantánea interna en el siguiente inicio (sin
  sobrescribir nunca un cambio de configuración intencionado), por lo que no es
  necesario volver a escanear el código QR.

## Solución de problemas

- **El Gateway no se inicia o no llegan mensajes entrantes:** verifique que `appId` y
  `clientSecret` sean correctos y que el bot esté habilitado en QQ Open Platform.
  Si falta una credencial, aparece «QQBot no está configurado (falta appId o
  clientSecret)».
- **La configuración con `--token-file` sigue apareciendo como no configurada:** `--token-file` solo
  establece AppSecret. `appId` debe seguir definido en la configuración o en `QQBOT_APP_ID`.
- **Las respuestas grupales en ráfagas colisionan:** cuando se llena la cola de un interlocutor, la cola de entrada expulsa
  los mensajes escritos por bots antes que los escritos por personas y combina
  las ráfagas de mensajes grupales normales (que no son comandos) en un único turno atribuido, por lo que
  una avalancha de mensajes de bots no debería privar de procesamiento a los mensajes humanos.
- **Los mensajes proactivos no llegan:** QQ puede bloquear los mensajes iniciados por el bot si
  el usuario no ha interactuado recientemente.
- **La voz no se transcribe:** asegúrese de que STT esté configurado y de que se pueda
  acceder al proveedor.

## Relacionado

- [Emparejamiento](/es/channels/pairing)
- [Grupos](/es/channels/groups)
- [Solución de problemas de canales](/es/channels/troubleshooting)
