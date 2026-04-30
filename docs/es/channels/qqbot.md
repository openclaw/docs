---
read_when:
    - Quieres conectar OpenClaw con QQ
    - Debe configurar las credenciales de QQ Bot
    - Quieres soporte para chats grupales o privados de QQ Bot
summary: Instalación, configuración y uso de QQ Bot
title: bot de QQ
x-i18n:
    generated_at: "2026-04-30T05:30:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: aefece6b05bb16d5c4f588bf7af4fd710b5f98aab0dbed8221490c46bf3f379c
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot se conecta a OpenClaw mediante la API oficial de QQ Bot (Gateway WebSocket). El
Plugin admite chat privado C2C, @mensajes de grupo y mensajes de canal de gremio con
medios enriquecidos (imágenes, voz, video, archivos).

Estado: Plugin incluido. Se admiten mensajes directos, chats grupales, canales de gremio y
medios. No se admiten reacciones ni hilos.

## Plugin incluido

Las versiones actuales de OpenClaw incluyen QQ Bot, por lo que las compilaciones empaquetadas normales no necesitan
un paso separado de `openclaw plugins install`.

## Configuración inicial

1. Ve a [QQ Open Platform](https://q.qq.com/) y escanea el código QR con tu
   QQ del teléfono para registrarte / iniciar sesión.
2. Haz clic en **Create Bot** para crear un nuevo bot de QQ.
3. Busca **AppID** y **AppSecret** en la página de configuración del bot y cópialos.

> AppSecret no se almacena en texto sin formato; si sales de la página sin guardarlo,
> tendrás que regenerar uno nuevo.

4. Añade el canal:

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

- La reserva por entorno se aplica solo a la cuenta predeterminada de QQ Bot.
- `openclaw channels add --channel qqbot --token-file ...` proporciona solo el
  AppSecret; el AppID ya debe estar definido en la configuración o en `QQBOT_APP_ID`.
- `clientSecret` también acepta entrada SecretRef, no solo una cadena en texto sin formato.

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

Cada cuenta inicia su propia conexión WebSocket y mantiene una caché de tokens independiente
(aislada por `appId`).

Añade un segundo bot mediante CLI:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Chats grupales

La compatibilidad de QQ Bot con chats grupales usa OpenIDs de grupos de QQ, no nombres visibles. Añade el bot
a un grupo y luego menciónalo o configura el grupo para que se ejecute sin mención.

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

`groups["*"]` define los valores predeterminados para cada grupo, y una entrada concreta
`groups.GROUP_OPENID` anula esos valores para un grupo. La configuración de grupo
incluye:

- `requireMention`: requiere una @mención antes de que el bot responda. Predeterminado: `true`.
- `ignoreOtherMentions`: descarta mensajes que mencionen a otra persona pero no al bot.
- `historyLimit`: conserva mensajes grupales recientes sin mención como contexto para el siguiente turno mencionado. Establece `0` para desactivar.
- `toolPolicy`: `full`, `restricted` o `none` para herramientas con alcance de grupo.
- `name`: etiqueta legible usada en registros y contexto de grupo.
- `prompt`: indicación de comportamiento por grupo añadida al contexto del agente.

Los modos de activación son `mention` y `always`. `requireMention: true` se asigna a
`mention`; `requireMention: false` se asigna a `always`. Una anulación de activación a nivel de sesión,
cuando está presente, prevalece sobre la configuración.

La cola entrante es por par. Los pares de grupo tienen un límite de cola mayor, mantienen los mensajes
humanos por delante de la conversación generada por el bot cuando está llena, y fusionan ráfagas de mensajes
grupales normales en un solo turno atribuido. Los comandos de barra siguen ejecutándose uno por uno.

### Voz (STT / TTS)

La compatibilidad con STT y TTS usa configuración de dos niveles con reserva por prioridad:

| Ajuste | Específico del Plugin                                      | Reserva del framework         |
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

Establece `enabled: false` en cualquiera de los dos para desactivar.
Las anulaciones de TTS a nivel de cuenta usan la misma forma que `messages.tts` y se fusionan en profundidad
sobre la configuración TTS del canal/global.

Los adjuntos de voz entrantes de QQ se exponen a los agentes como metadatos de medios de audio, mientras
mantienen los archivos de voz sin procesar fuera de los `MediaPaths` genéricos. Las respuestas de texto sin formato
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
| `qqbot:group:GROUP_OPENID` | Chat grupal        |
| `qqbot:channel:CHANNEL_ID` | Canal de gremio    |

> Cada bot tiene su propio conjunto de OpenIDs de usuario. Un OpenID recibido por el Bot A **no puede**
> usarse para enviar mensajes mediante el Bot B.

## Comandos de barra

Comandos integrados interceptados antes de la cola de IA:

| Comando        | Descripción                                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | Prueba de latencia                                                                                             |
| `/bot-version` | Muestra la versión del framework de OpenClaw                                                                    |
| `/bot-help`    | Enumera todos los comandos                                                                                     |
| `/bot-upgrade` | Muestra el enlace a la guía de actualización de QQBot                                                          |
| `/bot-logs`    | Exporta registros recientes del Gateway como archivo                                                           |
| `/bot-approve` | Aprueba una acción pendiente de QQ Bot (por ejemplo, confirmar una carga C2C o de grupo) mediante el flujo nativo. |

Añade `?` a cualquier comando para obtener ayuda de uso (por ejemplo, `/bot-upgrade ?`).

## Arquitectura del motor

QQ Bot se distribuye como un motor autocontenido dentro del Plugin:

- Cada cuenta posee una pila de recursos aislada (conexión WebSocket, cliente de API, caché de tokens, raíz de almacenamiento de medios) con clave por `appId`. Las cuentas nunca comparten estado entrante/saliente.
- El registrador de múltiples cuentas etiqueta las líneas de registro con la cuenta propietaria para que los diagnósticos sigan siendo separables cuando ejecutas varios bots bajo un Gateway.
- Las rutas de entrada, salida y puente del Gateway comparten una única raíz de carga útil de medios bajo `~/.openclaw/media`, de modo que las cargas, descargas y cachés de transcodificación se ubican bajo un directorio protegido en lugar de un árbol por subsistema.
- La entrega de medios enriquecidos pasa por una única ruta `sendMedia` para destinos C2C y de grupo. Los archivos locales y búferes por encima del umbral de archivos grandes usan los endpoints de carga por fragmentos de QQ, mientras que las cargas útiles más pequeñas usan la API de medios de una sola operación.
- Las credenciales pueden incluirse en copias de seguridad y restaurarse como parte de las instantáneas estándar de credenciales de OpenClaw; el motor vuelve a adjuntar la pila de recursos de cada cuenta al restaurar sin requerir un nuevo par por código QR.

## Vinculación con código QR

Como alternativa a pegar `AppID:AppSecret` manualmente, el motor admite un flujo de vinculación con código QR para conectar un QQ Bot a OpenClaw:

1. Ejecuta la ruta de configuración de QQ Bot (por ejemplo `openclaw channels add --channel qqbot`) y elige el flujo de código QR cuando se te solicite.
2. Escanea el código QR generado con la app del teléfono asociada al QQ Bot de destino.
3. Aprueba el emparejamiento en el teléfono. OpenClaw conserva las credenciales devueltas en `credentials/` bajo el alcance de cuenta correcto.

Las solicitudes de aprobación generadas por el propio bot (por ejemplo, flujos de "¿permitir esta acción?" expuestos por la API de QQ Bot) aparecen como solicitudes nativas de OpenClaw que puedes aceptar con `/bot-approve` en lugar de responder mediante el cliente QQ sin procesar.

## Solución de problemas

- **El bot responde "se fue a Marte":** las credenciales no están configuradas o el Gateway no se inició.
- **No hay mensajes entrantes:** verifica que `appId` y `clientSecret` sean correctos, y que el
  bot esté activado en QQ Open Platform.
- **Autorespuestas repetidas:** OpenClaw registra los índices de referencia salientes de QQ como
  generados por el bot e ignora los eventos entrantes cuyo `msgIdx` actual coincide con esa
  misma cuenta de bot. Esto evita bucles de eco de la plataforma y permite a la vez que los usuarios
  citen o respondan a mensajes anteriores del bot.
- **La configuración con `--token-file` sigue mostrándose como sin configurar:** `--token-file` solo define
  el AppSecret. Aún necesitas `appId` en la configuración o `QQBOT_APP_ID`.
- **Los mensajes proactivos no llegan:** QQ puede interceptar mensajes iniciados por el bot si
  el usuario no ha interactuado recientemente.
- **La voz no se transcribe:** asegúrate de que STT esté configurado y de que el proveedor esté accesible.

## Relacionado

- [Emparejamiento](/es/channels/pairing)
- [Grupos](/es/channels/groups)
- [Solución de problemas de canales](/es/channels/troubleshooting)
