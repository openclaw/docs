---
read_when:
    - Quiere conectar OpenClaw a QQ
    - Necesita configurar las credenciales de QQ Bot
    - Se necesita compatibilidad con chats grupales o privados de QQ Bot
summary: Configuración y uso de QQ Bot
title: bot de QQ
x-i18n:
    generated_at: "2026-07-19T01:47:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0bc41f915707f1367e69eaae86ade03c742fbc8fdf6855d2b6094ce05009a903
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot se conecta a OpenClaw mediante la API oficial de QQ Bot (Gateway WebSocket).
El chat privado C2C y las menciones `@` en grupos son los principales tipos de chat, con contenido
multimedia enriquecido (imágenes, voz, vídeo y archivos). Los mensajes de canales de gremio solo admiten
texto e imágenes mediante URL remotas; la voz, el vídeo, las cargas de archivos y las imágenes
locales/Base64 no están disponibles en los canales de gremio. Las reacciones y los hilos no
se admiten en ningún lugar.

Estado: Plugin oficial descargable.

## Instalación

```bash
openclaw plugins install @openclaw/qqbot
```

## Configuración inicial

1. Vaya a la [plataforma abierta de QQ](https://q.qq.com/) y escanee el código QR con QQ en su
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

Para los eventos de turno del Gateway de QQ, OpenClaw conserva el evento sin procesar antes de avanzar la secuencia de reanudación guardada del Gateway. Los turnos pendientes o reintentables sobreviven al reinicio del Gateway, permanecen serializados por conversación y usan el ID de evento del proveedor para impedir entradas duplicadas en la cola mientras exista el registro de finalización activo o retenido.

Si falla la admisión duradera, OpenClaw cierra el socket actual del Gateway sin avanzar la secuencia. La ruta de reconexión/reanudación puede entonces volver a solicitar el evento no confirmado. La entrega sigue siendo al menos una vez en el límite entre la cola y el agente, por lo que un fallo durante la transferencia puede reproducir un turno.

Configuración interactiva:

```bash
openclaw channels add
```

El asistente también ofrece la vinculación mediante código QR como alternativa a escribir AppID/AppSecret
manualmente: escanee el código con la aplicación del teléfono asociada al QQ Bot de destino para completar
la vinculación. OpenClaw conserva las credenciales devueltas dentro del ámbito de configuración
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

- `openclaw channels add --channel qqbot --token-file ...` establece solo AppSecret;
  `appId` ya debe estar definido en la configuración o en `QQBOT_APP_ID`.
- `clientSecret` acepta una cadena de texto sin formato, una ruta de archivo (`clientSecretFile`)
  o un objeto SecretRef estructurado.
- Las cadenas de marcador heredadas `secretref:...` / `secretref-env:...` se rechazan para
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
- Los valores escalares heredados `streaming: true|false` y la clave `streaming.c2cStreamApi`
  migran a esta estructura mediante `openclaw doctor --fix`.
- `/bot-streaming on|off` alterna la misma configuración desde un mensaje directo.

### Política de acceso

- `allowFrom` / `groupAllowFrom` determinan quién puede chatear con el bot en contextos
  C2C/de grupo. `dmPolicy` / `groupPolicy` (`open` | `allowlist` | `disabled`)
  controlan el modo de aplicación. `dmPolicy` adopta de forma predeterminada `allowlist` cuando
  `allowFrom` tiene una entrada concreta (sin comodines); de lo contrario, adopta `open`.
  `groupPolicy` adopta de forma predeterminada `allowlist` cuando `groupAllowFrom` o
  `allowFrom` tiene una entrada concreta; de lo contrario, adopta `open`.
- Los comandos de barra de «Auth: allowlist» requieren una entrada explícita sin comodines en
  `allowFrom` (o en `groupAllowFrom` para invocaciones de grupo), independientemente de
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

Cada cuenta posee una conexión WebSocket, un cliente de API y una caché de tokens
aislados, identificados por `appId`. Las líneas del registro se etiquetan con el ID de la cuenta propietaria para que
los diagnósticos permanezcan separados al ejecutar varios bots en un Gateway.

Añada un segundo bot mediante la CLI:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Chats de grupo

La compatibilidad con grupos usa OpenID de grupos de QQ, no nombres para mostrar. Añada el bot a un
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
sustituye esos valores predeterminados para un grupo. Configuración de los grupos:

| Campo                 | Valor predeterminado          | Descripción                                                                                        |
| --------------------- | ---------------- | -------------------------------------------------------------------------------------------------- |
| `requireMention`      | `true`           | Requiere una mención `@` antes de que el bot responda.                                                     |
| `commandLevel`        | `all`            | Qué comandos de barra integrados pueden ejecutarse en el grupo (consulte más adelante).                                    |
| `ignoreOtherMentions` | `false`          | Descarta los mensajes que mencionen a otra persona, pero no al bot.                                           |
| `historyLimit`        | `50`             | Mensajes recientes sin menciones conservados como contexto para el siguiente turno con mención. `0` desactiva el historial.     |
| `tools`               | —                | Permite o deniega herramientas para todo el grupo.                                                              |
| `toolsBySender`       | —                | Sustituciones de herramientas por remitente; consulte [Grupos](/es/channels/groups#groupchannel-tool-restrictions-optional). |
| `name`                | prefijo de openid    | Etiqueta descriptiva usada en los registros y el contexto del grupo.                                                     |
| `prompt`              | valor predeterminado integrado | Instrucción de comportamiento por grupo añadida al contexto del agente.                                           |

`commandLevel` acepta:

| Nivel    | Comportamiento                                                                                                                                      |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `all`    | Los comandos integrados existentes siguen disponibles. Algunos permanecen ocultos en los menús, pero los usuarios autorizados aún pueden ejecutarlos en el grupo.                  |
| `safety` | `/help`, `/btw`, `/stop` siguen visibles en el grupo; los comandos confidenciales (`/config`, `/tools`, `/bash`, etc.) deben ejecutarse en un chat privado.      |
| `strict` | Solo se permiten los controles de sesión de grupo necesarios para un funcionamiento estricto. `/stop` sigue funcionando para que un remitente autorizado pueda interrumpir una ejecución activa. |

Las entradas heredadas `toolPolicy` de QQBot están retiradas. Ejecute `openclaw doctor --fix` para migrarlas a `tools`.

Los modos de activación son `mention` y `always`. `requireMention: true` se asigna a
`mention`; `requireMention: false` se asigna a `always`. Una sustitución de activación
a nivel de sesión, cuando existe, tiene prioridad sobre la configuración.

La cola de entrada es por interlocutor. Los interlocutores de grupo tienen un límite de cola mayor (50 frente a 20
para los interlocutores directos), expulsan los mensajes creados por el bot antes que los humanos cuando está llena
y combinan las ráfagas de mensajes de grupo normales en un turno con atribución. Los comandos de barra
se ejecutan uno por uno, independientemente de cualquier lote combinado.

### Voz (STT/TTS)

STT y TTS admiten una configuración de dos niveles con prioridad de reserva:

| Ajuste | Específico del Plugin                                          | Reserva del framework            |
| ------- | -------------------------------------------------------- | ----------------------------- |
| STT     | `channels.qqbot.stt`                                     | `tools.media.audio.models[0]` |
| TTS     | `channels.qqbot.tts`, `channels.qqbot.accounts.<id>.tts` | `messages.tts`                |

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

Defina `enabled: false` en cualquiera de los dos para desactivarlo. Las sustituciones de TTS a nivel de cuenta usan la
misma estructura que `messages.tts` y se combinan en profundidad con la configuración de TTS del canal/global.

Las solicitudes STT agotan el tiempo de espera después de 60 segundos de forma predeterminada. El STT específico del Plugin usa la
sustitución `models.providers.<id>.timeoutSeconds` seleccionada. El STT de audio del framework
usa `tools.media.audio.models[0].timeoutSeconds`, después
`tools.media.audio.timeoutSeconds` y, a continuación, la sustitución del proveedor seleccionado.

Los archivos adjuntos de voz entrantes de QQ se exponen a los agentes como metadatos multimedia de audio,
mientras se mantienen los archivos de voz sin procesar fuera de `MediaPaths` genérico. `[[audio_as_voice]]`
en una respuesta de texto sin formato sintetiza TTS y envía un mensaje de voz nativo de QQ cuando
TTS está configurado.

El comportamiento de carga/transcodificación del audio saliente también puede ajustarse mediante
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
Cada bot tiene su propio conjunto de OpenID de usuario. Un OpenID recibido por el Bot A **no se puede** usar para enviar mensajes mediante el Bot B.
</Note>

## Comandos de barra

Comandos integrados interceptados antes de la cola de IA:

| Comando              | Autenticación | Ámbito       | Descripción                                                                    |
| -------------------- | ------------- | ------------ | ------------------------------------------------------------------------------ |
| `/bot-ping`          | —         | cualquiera   | Prueba de latencia                                                             |
| `/bot-help`          | —         | cualquiera   | Enumera todos los comandos                                                     |
| `/bot-me`            | —         | solo privado | Muestra el ID de usuario de QQ (openid) del remitente para configurar `allowFrom` / `groupAllowFrom` |
| `/bot-version`       | —         | solo privado | Muestra la versión del framework OpenClaw y la versión del plugin              |
| `/bot-upgrade`       | —         | solo privado | Muestra el enlace a la guía de actualización de QQBot                          |
| `/bot-approve`       | lista de permitidos | solo privado | Gestiona la configuración de aprobación de ejecución de comandos (on / off / always / reset / status) |
| `/bot-logs`          | lista de permitidos | solo privado | Exporta los registros recientes del Gateway como archivo                       |
| `/bot-clear-storage` | lista de permitidos | solo privado | Elimina las descargas almacenadas en caché del directorio multimedia de QQBot  |
| `/bot-streaming`     | lista de permitidos | solo privado | Activa o desactiva las respuestas en streaming de C2C                          |
| `/bot-group-allways` | lista de permitidos | solo privado | Alterna el modo predeterminado de activación de grupos (requiere mención o siempre activo) |

Añada `?` a cualquier comando para obtener ayuda sobre su uso (por ejemplo, `/bot-upgrade ?`).

Los comandos con «Autenticación: lista de permitidos» requieren además que el openid del remitente figure en una lista `allowFrom` explícita sin comodines (`groupAllowFrom` tiene prioridad para los comandos emitidos desde grupos y, si no está disponible, se usa `allowFrom`). El comodín `allowFrom: ["*"]` permite chatear, pero no ejecutar estos comandos. Si se ejecuta uno de ellos fuera de un chat privado o sin autorización, se devuelve una indicación en lugar de descartar el mensaje silenciosamente.

`/bot-me`, `/bot-version` y `/bot-upgrade` solo están disponibles en chats privados, pero no requieren la lista de permitidos: cualquier remitente C2C puede ejecutarlos.

Cuando las aprobaciones de ejecución de QQ Bot usan el mecanismo alternativo predeterminado del mismo chat, los clics en los botones nativos de aprobación siguen la misma lista explícita de comandos permitidos sin comodines. Para conceder acceso solo a las aprobaciones sin dar un acceso más amplio a los comandos, configure `channels.qqbot.execApprovals.approvers`. Las aprobaciones nativas de ejecución están habilitadas de forma predeterminada.

## Contenido multimedia y almacenamiento

- El contenido multimedia entrante, saliente y del puente del Gateway comparte una única raíz de cargas útiles en
  `~/.openclaw/media/qqbot` (respetando `OPENCLAW_HOME` cuando está definido), por lo que las cargas,
  las descargas y las cachés de transcodificación permanecen en un único directorio protegido.
- La entrega de contenido multimedia enriquecido a destinos C2C y de grupo utiliza una única ruta `sendMedia`.
  Los archivos locales y los búferes en memoria de 5&nbsp;MiB o más utilizan los
  puntos de conexión de carga fragmentada de QQ; las cargas útiles más pequeñas y las fuentes
  de URL remotas o Base64 utilizan la API de carga en una sola operación.
- Si una actualización en caliente interrumpe el Gateway antes de que termine de escribir
  `openclaw.json`, el plugin restaura los últimos `appId` / `clientSecret`
  conocidos de esa cuenta a partir de una instantánea interna en el siguiente inicio (sin
  sobrescribir nunca un cambio de configuración intencionado), por lo que no es
  necesario volver a escanear el código QR.

## Solución de problemas

- **El Gateway no se inicia o no hay mensajes entrantes:** compruebe que `appId` y
  `clientSecret` sean correctos y que el bot esté habilitado en QQ Open Platform.
  Si falta una credencial, se muestra «QQBot no está configurado (falta appId o
  clientSecret)».
- **La configuración con `--token-file` sigue apareciendo como no configurada:** `--token-file` solo
  establece AppSecret. `appId` también debe estar definido en la configuración o en `QQBOT_APP_ID`.
- **Las ráfagas de respuestas de grupo colisionan:** cuando la cola de un interlocutor se llena, la cola de entrada
  expulsa los mensajes escritos por bots antes que los escritos por personas y combina
  las ráfagas de mensajes de grupo normales (que no son comandos) en un único turno con atribución, por lo que
  una avalancha de mensajes de bots no debería privar de procesamiento a los mensajes humanos.
- **Los mensajes proactivos no llegan:** QQ puede bloquear los mensajes iniciados por el bot si
  el usuario no ha interactuado recientemente.
- **La voz no se transcribe:** asegúrese de que STT esté configurado y de que se pueda
  acceder al proveedor.

## Contenido relacionado

- [Emparejamiento](/es/channels/pairing)
- [Grupos](/es/channels/groups)
- [Solución de problemas de canales](/es/channels/troubleshooting)
