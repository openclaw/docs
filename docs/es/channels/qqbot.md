---
read_when:
    - Quieres conectar OpenClaw con QQ
    - Necesitas configurar las credenciales de QQ Bot
    - Quieres compatibilidad con chats grupales o privados de QQ Bot
summary: Configuración, ajustes y uso de QQ Bot
title: bot de QQ
x-i18n:
    generated_at: "2026-04-30T09:34:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 964a92021acc534b7ec2749670fedd0e8caa47d5edf67ced80f0a8fb3eda7600
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot se conecta a OpenClaw mediante la API oficial de QQ Bot (Gateway WebSocket). El
Plugin admite chat privado C2C, @mensajes de grupo y mensajes de canales de gremio con
medios enriquecidos (imágenes, voz, video, archivos).

Estado: Plugin incluido. Se admiten mensajes directos, chats de grupo, canales de gremio y
medios. No se admiten reacciones ni hilos.

## Plugin incluido

Las versiones actuales de OpenClaw incluyen QQ Bot, por lo que las compilaciones empaquetadas normales no necesitan
un paso separado de `openclaw plugins install`.

## Configuración

1. Ve a [QQ Open Platform](https://q.qq.com/) y escanea el código QR con tu
   QQ del teléfono para registrarte / iniciar sesión.
2. Haz clic en **Crear bot** para crear un nuevo bot de QQ.
3. Busca **AppID** y **AppSecret** en la página de configuración del bot y cópialos.

> AppSecret no se almacena en texto sin formato; si sales de la página sin guardarlo,
> tendrás que regenerar uno nuevo.

4. Agrega el canal:

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. Reinicia el Gateway.

Rutas de configuración interactiva:

```bash
openclaw channels add
openclaw configure --section channels
```

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

Variables de entorno de la cuenta predeterminada:

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

Notas:

- La reserva de entorno se aplica solo a la cuenta predeterminada de QQ Bot.
- `openclaw channels add --channel qqbot --token-file ...` proporciona solo el
  AppSecret; el AppID ya debe estar establecido en la configuración o en `QQBOT_APP_ID`.
- `clientSecret` también acepta entrada SecretRef, no solo una cadena de texto sin formato.

### Configuración de varias cuentas

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

Cada cuenta inicia su propia conexión WebSocket y mantiene una caché de tokens independiente
(aislada por `appId`).

Agrega un segundo bot mediante la CLI:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Chats de grupo

La compatibilidad de QQ Bot con chats de grupo usa OpenIDs de grupos de QQ, no nombres para mostrar. Agrega el bot
a un grupo y luego menciónalo o configura el grupo para ejecutarse sin mención.

```json5
{
  channels: {
    qqbot: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["member_openid"],
      groups: {
        "*": {
          requireMention: true,
          historyLimit: 50,
          toolPolicy: "restricted",
        },
        GROUP_OPENID: {
          name: "Release room",
          requireMention: false,
          ignoreOtherMentions: true,
          historyLimit: 20,
          prompt: "Keep replies short and operational.",
        },
      },
    },
  },
}
```

`groups["*"]` establece valores predeterminados para cada grupo, y una entrada concreta
`groups.GROUP_OPENID` anula esos valores predeterminados para un grupo. La configuración de grupo
incluye:

- `requireMention`: requiere una @mención antes de que el bot responda. Predeterminado: `true`.
- `ignoreOtherMentions`: descarta mensajes que mencionan a otra persona pero no al bot.
- `historyLimit`: conserva los mensajes recientes de grupo sin mención como contexto para el siguiente turno mencionado. Establece `0` para desactivarlo.
- `toolPolicy`: `full`, `restricted` o `none` para herramientas con alcance de grupo.
- `name`: etiqueta descriptiva usada en registros y contexto de grupo.
- `prompt`: indicación de comportamiento por grupo agregada al contexto del agente.

Los modos de activación son `mention` y `always`. `requireMention: true` se asigna a
`mention`; `requireMention: false` se asigna a `always`. Una anulación de activación a nivel de sesión,
cuando existe, prevalece sobre la configuración.

La cola entrante es por par. Los pares de grupo tienen un límite de cola mayor, mantienen los
mensajes humanos por delante de la conversación generada por bots cuando está llena, y fusionan ráfagas de mensajes normales
de grupo en un turno atribuido. Los comandos de barra siguen ejecutándose uno por uno.

### Voz (STT / TTS)

La compatibilidad con STT y TTS admite configuración de dos niveles con reserva por prioridad:

| Configuración | Específica del Plugin                                     | Reserva del framework         |
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
        qq-main: {
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

Establece `enabled: false` en cualquiera de los dos para desactivarlo.
Las anulaciones de TTS a nivel de cuenta usan la misma forma que `messages.tts` y se fusionan en profundidad
sobre la configuración de TTS del canal/global.

Los archivos adjuntos de voz entrantes de QQ se exponen a los agentes como metadatos de medios de audio mientras
se mantienen los archivos de voz sin procesar fuera de los `MediaPaths` genéricos. Las respuestas de texto sin formato
`[[audio_as_voice]]` sintetizan TTS y envían un mensaje de voz nativo de QQ cuando TTS está
configurado.

El comportamiento de carga/transcodificación de audio saliente también se puede ajustar con
`channels.qqbot.audioFormatPolicy`:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Formatos de destino

| Formato                    | Descripción        |
| -------------------------- | ------------------ |
| `qqbot:c2c:OPENID`         | Chat privado (C2C) |
| `qqbot:group:GROUP_OPENID` | Chat de grupo      |
| `qqbot:channel:CHANNEL_ID` | Canal de gremio    |

> Cada bot tiene su propio conjunto de OpenIDs de usuario. Un OpenID recibido por el bot A **no puede**
> usarse para enviar mensajes mediante el bot B.

## Comandos de barra

Comandos integrados interceptados antes de la cola de IA:

| Comando        | Descripción                                                                                              |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | Prueba de latencia                                                                                       |
| `/bot-version` | Muestra la versión del framework de OpenClaw                                                              |
| `/bot-help`    | Lista todos los comandos                                                                                 |
| `/bot-me`      | Muestra el ID de usuario de QQ del remitente (openid) para configurar `allowFrom`/`groupAllowFrom`       |
| `/bot-upgrade` | Muestra el enlace de la guía de actualización de QQBot                                                   |
| `/bot-logs`    | Exporta los registros recientes del gateway como archivo                                                 |
| `/bot-approve` | Aprueba una acción pendiente de QQ Bot (por ejemplo, confirmar una carga C2C o de grupo) mediante el flujo nativo. |

Agrega `?` a cualquier comando para obtener ayuda de uso (por ejemplo `/bot-upgrade ?`).

Los comandos de administrador (`/bot-me`, `/bot-upgrade`, `/bot-logs`, `/bot-clear-storage`, `/bot-streaming`, `/bot-approve`) son solo para mensajes directos y requieren que el openid del remitente esté en una lista `allowFrom` explícita y sin comodines. Un comodín `allowFrom: ["*"]` permite chatear, pero no concede acceso a comandos de administrador. Los mensajes de grupo se comparan primero con `groupAllowFrom` y recurren a `allowFrom`. Ejecutar un comando de administrador en un grupo devuelve una sugerencia en lugar de descartarlo silenciosamente.

## Arquitectura del motor

QQ Bot se distribuye como un motor autónomo dentro del Plugin:

- Cada cuenta posee una pila de recursos aislada (conexión WebSocket, cliente de API, caché de tokens, raíz de almacenamiento de medios) identificada por `appId`. Las cuentas nunca comparten estado entrante/saliente.
- El registrador de varias cuentas etiqueta las líneas de registro con la cuenta propietaria para que los diagnósticos sigan siendo separables cuando ejecutas varios bots bajo un Gateway.
- Las rutas entrantes, salientes y del puente del Gateway comparten una sola raíz de carga útil de medios bajo `~/.openclaw/media`, por lo que cargas, descargas y cachés de transcodificación quedan bajo un directorio protegido en lugar de un árbol por subsistema.
- La entrega de medios enriquecidos pasa por una sola ruta `sendMedia` para destinos C2C y de grupo. Los archivos locales y búferes por encima del umbral de archivos grandes usan los endpoints de carga fragmentada de QQ, mientras que las cargas útiles más pequeñas usan la API de medios de una sola operación.
- Las credenciales pueden respaldarse y restaurarse como parte de las instantáneas estándar de credenciales de OpenClaw; el motor vuelve a adjuntar la pila de recursos de cada cuenta al restaurar sin requerir un nuevo emparejamiento por código QR.

## Incorporación con código QR

Como alternativa a pegar `AppID:AppSecret` manualmente, el motor admite un flujo de incorporación con código QR para vincular un QQ Bot a OpenClaw:

1. Ejecuta la ruta de configuración de QQ Bot (por ejemplo `openclaw channels add --channel qqbot`) y elige el flujo de código QR cuando se te solicite.
2. Escanea el código QR generado con la app del teléfono vinculada al QQ Bot de destino.
3. Aprueba el emparejamiento en el teléfono. OpenClaw conserva las credenciales devueltas en `credentials/` bajo el alcance de cuenta correcto.

Las solicitudes de aprobación generadas por el propio bot (por ejemplo, flujos de "¿permitir esta acción?" expuestos por la API de QQ Bot) aparecen como solicitudes nativas de OpenClaw que puedes aceptar con `/bot-approve` en lugar de responder mediante el cliente sin procesar de QQ.

## Solución de problemas

- **El bot responde "gone to Mars":** credenciales no configuradas o Gateway no iniciado.
- **No hay mensajes entrantes:** verifica que `appId` y `clientSecret` sean correctos, y que el
  bot esté habilitado en QQ Open Platform.
- **Autorrespuestas repetidas:** OpenClaw registra los índices de referencia salientes de QQ como
  generados por bot e ignora eventos entrantes cuyo `msgIdx` actual coincida con esa
  misma cuenta de bot. Esto evita bucles de eco de la plataforma y aun así permite a los usuarios
  citar o responder a mensajes anteriores del bot.
- **La configuración con `--token-file` sigue mostrándose sin configurar:** `--token-file` solo establece
  el AppSecret. Aún necesitas `appId` en la configuración o `QQBOT_APP_ID`.
- **No llegan mensajes proactivos:** QQ puede interceptar mensajes iniciados por el bot si
  el usuario no ha interactuado recientemente.
- **La voz no se transcribe:** asegúrate de que STT esté configurado y de que el proveedor sea accesible.

## Relacionado

- [Emparejamiento](/es/channels/pairing)
- [Grupos](/es/channels/groups)
- [Solución de problemas de canales](/es/channels/troubleshooting)
