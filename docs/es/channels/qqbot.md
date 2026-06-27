---
read_when:
    - Quieres conectar OpenClaw a QQ
    - Necesitas configurar las credenciales de QQ Bot
    - Quieres soporte para chat privado o grupo de QQ Bot
summary: Instalación, configuración y uso de QQ Bot
title: Bot de QQ
x-i18n:
    generated_at: "2026-06-27T10:43:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb452e331ce196d1517af2f87a5187cb4b2cb53aee2bbff47cbdf73e2b3e7dee
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot conecta QQ con OpenClaw mediante la API oficial de QQ Bot (Gateway WebSocket). El
Plugin admite chat privado C2C, @mensajes de grupo y mensajes de canales de guild con
medios enriquecidos (imágenes, voz, video, archivos).

Estado: Plugin descargable. Se admiten mensajes directos, chats de grupo, canales de guild y
medios. No se admiten reacciones ni hilos.

## Instalar

Instala QQ Bot antes de la configuración:

```bash
openclaw plugins install @openclaw/qqbot
```

## Configuración

1. Ve a la [QQ Open Platform](https://q.qq.com/) y escanea el código QR con tu
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

Variables de entorno de cuenta predeterminada:

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

- La reserva de entorno se aplica solo a la cuenta predeterminada de QQ Bot.
- `openclaw channels add --channel qqbot --token-file ...` proporciona solo el
  AppSecret; el AppID ya debe estar definido en la configuración o en `QQBOT_APP_ID`.
- `clientSecret` también acepta entrada SecretRef, no solo una cadena de texto sin formato.
- Las cadenas de marcador heredadas `secretref:/...` no son valores válidos de `clientSecret`;
  usa objetos SecretRef estructurados como en el ejemplo anterior.

### Configuración de varias cuentas

Ejecuta varios bots de QQ bajo una sola instancia de OpenClaw:

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

Cada cuenta inicia su propia conexión WebSocket y mantiene una caché de token independiente
(aislada por `appId`).

Añade un segundo bot mediante la CLI:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Chats de grupo

El soporte de chat de grupo de QQ Bot usa OpenIDs de grupos QQ, no nombres visibles. Añade el bot
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

`groups["*"]` establece valores predeterminados para cada grupo, y una entrada concreta
`groups.GROUP_OPENID` anula esos valores predeterminados para un grupo. La configuración de grupo
incluye:

- `requireMention`: requiere una @mención antes de que el bot responda. Predeterminado: `true`.
- `commandLevel`: controla qué comandos slash integrados pueden ejecutarse en grupos.
  Predeterminado: `all`, que conserva el comportamiento de grupo preexistente de QQBot cuando se
  omite el ajuste.
- `ignoreOtherMentions`: descarta mensajes que mencionan a otra persona pero no al bot.
- `historyLimit`: conserva los mensajes recientes de grupo sin mención como contexto para el siguiente turno mencionado. Usa `0` para deshabilitarlo.
- `tools`: permite/deniega herramientas para todo el grupo.
- `toolsBySender`: anulaciones de herramientas de grupo por remitente; consulta [Grupos](/es/channels/groups#groupchannel-tool-restrictions-optional).
- `name`: etiqueta descriptiva usada en los registros y en el contexto de grupo.
- `prompt`: prompt de comportamiento por grupo añadido al contexto del agente.

`commandLevel` acepta:

- `all`: mantiene disponibles los comandos integrados reconocidos como antes. Algunos comandos pueden
  permanecer ocultos en los menús, pero los usuarios autorizados aún pueden ejecutarlos en el grupo.
- `safety`: permite comandos comunes de colaboración como `/help`, `/btw` y
  `/stop`; pide a los usuarios que ejecuten comandos sensibles como `/config`, `/tools` y
  `/bash` en chat privado.
- `strict`: solo permite los controles de sesión de grupo necesarios para una operación estricta de grupo.
  `/stop` sigue siendo urgente para que un remitente autorizado pueda interrumpir una
  ejecución activa.

Las entradas antiguas `toolPolicy` de QQBot están retiradas. Ejecuta `openclaw doctor --fix` para migrarlas a `tools`.

Los modos de activación son `mention` y `always`. `requireMention: true` se asigna a
`mention`; `requireMention: false` se asigna a `always`. Una anulación de activación
a nivel de sesión, cuando existe, prevalece sobre la configuración.

La cola entrante es por par. Los pares de grupo reciben un límite de cola mayor, mantienen los
mensajes humanos por delante de la conversación generada por bots cuando se llena, y fusionan ráfagas de mensajes
normales de grupo en un solo turno atribuido. Los comandos slash siguen ejecutándose uno por uno.

### Voz (STT / TTS)

El soporte de STT y TTS usa configuración de dos niveles con reserva por prioridad:

| Ajuste | Específico del Plugin                                    | Reserva del framework         |
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

Establece `enabled: false` en cualquiera de los dos para deshabilitarlo.
Las anulaciones de TTS a nivel de cuenta usan la misma forma que `messages.tts` y se fusionan en profundidad
sobre la configuración TTS del canal/global.

Los adjuntos de voz entrantes de QQ se exponen a los agentes como metadatos de medios de audio mientras
se mantienen los archivos de voz sin procesar fuera de los `MediaPaths` genéricos. Las respuestas de texto sin formato
`[[audio_as_voice]]` sintetizan TTS y envían un mensaje de voz nativo de QQ cuando TTS está
configurado.

El comportamiento de carga/transcodificación de audio saliente también puede ajustarse con
`channels.qqbot.audioFormatPolicy`:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Formatos de destino

| Formato                    | Descripción        |
| -------------------------- | ------------------ |
| `qqbot:c2c:OPENID`         | Chat privado (C2C) |
| `qqbot:group:GROUP_OPENID` | Chat de grupo      |
| `qqbot:channel:CHANNEL_ID` | Canal de guild     |

> Cada bot tiene su propio conjunto de OpenIDs de usuario. Un OpenID recibido por el Bot A **no puede**
> usarse para enviar mensajes mediante el Bot B.

## Comandos slash

Comandos integrados interceptados antes de la cola de IA:

| Comando        | Descripción                                                                                              |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | Prueba de latencia                                                                                       |
| `/bot-version` | Muestra la versión del framework de OpenClaw                                                             |
| `/bot-help`    | Lista todos los comandos                                                                                 |
| `/bot-me`      | Muestra el ID de usuario QQ (openid) del remitente para configurar `allowFrom`/`groupAllowFrom`          |
| `/bot-upgrade` | Muestra el enlace a la guía de actualización de QQBot                                                    |
| `/bot-logs`    | Exporta los registros recientes del Gateway como archivo                                                 |
| `/bot-approve` | Aprueba una acción pendiente de QQ Bot (por ejemplo, confirmar una carga C2C o de grupo) mediante el flujo nativo. |

Añade `?` a cualquier comando para obtener ayuda de uso (por ejemplo `/bot-upgrade ?`).

Los comandos de administrador (`/bot-me`, `/bot-upgrade`, `/bot-logs`, `/bot-clear-storage`, `/bot-streaming`, `/bot-approve`) son solo para mensajes directos y requieren el openid del remitente en una lista explícita `allowFrom` sin comodines. Un comodín `allowFrom: ["*"]` permite el chat pero no concede acceso a comandos de administrador. Los mensajes de grupo se comparan primero con `groupAllowFrom` y recurren a `allowFrom`. Ejecutar un comando de administrador en un grupo devuelve una sugerencia en lugar de descartarlo silenciosamente.

Cuando las aprobaciones de ejecución de QQ Bot usan la reserva predeterminada del mismo chat, los clics en botones
de aprobación nativos siguen la misma lista explícita de comandos permitidos sin comodines. Para conceder
acceso solo a aprobaciones sin acceso más amplio a comandos, configura
`channels.qqbot.execApprovals.approvers`.

## Arquitectura del motor

QQ Bot se entrega como un motor autónomo dentro del Plugin:

- Cada cuenta posee una pila de recursos aislada (conexión WebSocket, cliente de API, caché de token, raíz de almacenamiento de medios) indexada por `appId`. Las cuentas nunca comparten estado entrante/saliente.
- El registrador de varias cuentas etiqueta las líneas de registro con la cuenta propietaria para que los diagnósticos sigan siendo separables cuando ejecutas varios bots bajo un Gateway.
- Las rutas entrantes, salientes y de puente del Gateway comparten una sola raíz de carga útil de medios bajo `~/.openclaw/media`, por lo que las cargas, descargas y cachés de transcodificación se ubican bajo un único directorio protegido en lugar de un árbol por subsistema.
- La entrega de medios enriquecidos pasa por una sola ruta `sendMedia` para destinos C2C y de grupo. Los archivos locales y búferes por encima del umbral de archivo grande usan los endpoints de carga fragmentada de QQ, mientras que las cargas útiles más pequeñas usan la API de medios de una sola operación.
- Las credenciales pueden respaldarse y restaurarse como parte de las instantáneas de credenciales estándar de OpenClaw; el motor vuelve a adjuntar la pila de recursos de cada cuenta al restaurar sin requerir un nuevo par de código QR.

## Incorporación con código QR

Como alternativa a pegar `AppID:AppSecret` manualmente, el motor admite un flujo de incorporación con código QR para vincular un QQ Bot con OpenClaw:

1. Ejecuta la ruta de configuración de QQ Bot (por ejemplo `openclaw channels add --channel qqbot`) y elige el flujo de código QR cuando se te solicite.
2. Escanea el código QR generado con la aplicación del teléfono asociada al QQ Bot de destino.
3. Aprueba el emparejamiento en el teléfono. OpenClaw conserva las credenciales devueltas en `credentials/` bajo el ámbito de cuenta correcto.

Los prompts de aprobación generados por el propio bot (por ejemplo, flujos de "¿permitir esta acción?" expuestos por la API de QQ Bot) aparecen como prompts nativos de OpenClaw que puedes aceptar con `/bot-approve` en lugar de responder mediante el cliente QQ sin procesar.

## Solución de problemas

- **El bot responde "gone to Mars":** las credenciales no están configuradas o el Gateway no se ha iniciado.
- **No hay mensajes entrantes:** verifica que `appId` y `clientSecret` sean correctos, y que el
  bot esté habilitado en QQ Open Platform.
- **Respuestas repetidas a sí mismo:** OpenClaw registra los índices de referencia salientes de QQ como
  creados por el bot e ignora los eventos entrantes cuyo `msgIdx` actual coincide con esa
  misma cuenta del bot. Esto evita bucles de eco de la plataforma y, al mismo tiempo, permite que los usuarios
  citen o respondan a mensajes anteriores del bot.
- **La configuración con `--token-file` aún aparece como no configurada:** `--token-file` solo establece
  el AppSecret. Todavía necesitas `appId` en la configuración o `QQBOT_APP_ID`.
- **Los mensajes proactivos no llegan:** QQ puede interceptar mensajes iniciados por el bot si
  el usuario no ha interactuado recientemente.
- **La voz no se transcribe:** asegúrate de que STT esté configurado y de que se pueda acceder al proveedor.

## Relacionado

- [Emparejamiento](/es/channels/pairing)
- [Grupos](/es/channels/groups)
- [Solución de problemas de canales](/es/channels/troubleshooting)
