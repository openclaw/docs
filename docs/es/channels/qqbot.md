---
read_when:
    - Quieres conectar OpenClaw con QQ
    - Necesitas configurar las credenciales del bot de QQ
    - Quieres compatibilidad del bot de QQ con chats grupales o privados
summary: Configuración, ajustes y uso del bot de QQ
title: bot de QQ
x-i18n:
    generated_at: "2026-04-26T11:24:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: bd899d9556ab418bbb3d7dc368e6f6e1eca96828cbcc87b4147ccad362f1918e
    source_path: channels/qqbot.md
    workflow: 15
---

QQ Bot se conecta a OpenClaw mediante la API oficial de QQ Bot (gateway WebSocket). El
Plugin admite chat privado C2C, @mensajes de grupo y mensajes de canal de guild con
multimedia enriquecido (imágenes, voz, video, archivos).

Estado: Plugin incluido. Se admiten mensajes directos, chats grupales, canales de
guild y contenido multimedia. No se admiten reacciones ni hilos.

## Plugin incluido

Las versiones actuales de OpenClaw incluyen QQ Bot, por lo que las compilaciones empaquetadas normales no necesitan
un paso separado de `openclaw plugins install`.

## Configuración

1. Ve a la [QQ Open Platform](https://q.qq.com/) y escanea el código QR con tu
   QQ del teléfono para registrarte / iniciar sesión.
2. Haz clic en **Create Bot** para crear un nuevo bot de QQ.
3. Busca **AppID** y **AppSecret** en la página de configuración del bot y cópialos.

> AppSecret no se almacena en texto sin formato: si abandonas la página sin guardarlo,
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

- La reserva desde variables de entorno se aplica solo a la cuenta predeterminada de QQ Bot.
- `openclaw channels add --channel qqbot --token-file ...` proporciona solo el
  AppSecret; el AppID ya debe estar configurado en la configuración o en `QQBOT_APP_ID`.
- `clientSecret` también acepta entrada SecretRef, no solo una cadena en texto sin formato.

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

Agrega un segundo bot mediante CLI:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Voz (STT / TTS)

La compatibilidad con STT y TTS tiene una configuración de dos niveles con reserva por prioridad:

| Configuración | Específica del Plugin                                  | Reserva del framework          |
| ------------- | ------------------------------------------------------ | ------------------------------ |
| STT           | `channels.qqbot.stt`                                   | `tools.media.audio.models[0]` |
| TTS           | `channels.qqbot.tts`, `channels.qqbot.accounts.<id>.tts` | `messages.tts`                |

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
sobre la configuración global/del canal de TTS.

Los adjuntos de voz entrantes de QQ se exponen a los agentes como metadatos de audio
mientras se mantienen los archivos de voz sin procesar fuera de `MediaPaths` genérico. Las
respuestas de texto sin formato `[[audio_as_voice]]` sintetizan TTS y envían un mensaje de voz nativo de QQ cuando TTS está
configurado.

El comportamiento de carga/transcodificación de audio saliente también puede ajustarse con
`channels.qqbot.audioFormatPolicy`:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Formatos de destino

| Formato                    | Descripción         |
| -------------------------- | ------------------- |
| `qqbot:c2c:OPENID`         | Chat privado (C2C)  |
| `qqbot:group:GROUP_OPENID` | Chat grupal         |
| `qqbot:channel:CHANNEL_ID` | Canal de guild      |

> Cada bot tiene su propio conjunto de OpenID de usuarios. Un OpenID recibido por el Bot A **no puede**
> usarse para enviar mensajes mediante el Bot B.

## Comandos de barra

Comandos integrados interceptados antes de la cola de IA:

| Comando        | Descripción                                                                                                 |
| -------------- | ----------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | Prueba de latencia                                                                                          |
| `/bot-version` | Muestra la versión del framework OpenClaw                                                                   |
| `/bot-help`    | Enumera todos los comandos                                                                                  |
| `/bot-upgrade` | Muestra el enlace a la guía de actualización de QQBot                                                       |
| `/bot-logs`    | Exporta los registros recientes del gateway como un archivo                                                 |
| `/bot-approve` | Aprueba una acción pendiente de QQ Bot (por ejemplo, confirmar una carga C2C o de grupo) mediante el flujo nativo. |

Agrega `?` a cualquier comando para obtener ayuda de uso (por ejemplo, `/bot-upgrade ?`).

## Arquitectura del motor

QQ Bot se entrega como un motor autocontenido dentro del Plugin:

- Cada cuenta posee una pila de recursos aislada (conexión WebSocket, cliente de API, caché de tokens, raíz de almacenamiento multimedia) identificada por `appId`. Las cuentas nunca comparten estado entrante/saliente.
- El registrador de varias cuentas etiqueta las líneas de registro con la cuenta propietaria para que el diagnóstico siga siendo separable cuando ejecutas varios bots en un solo gateway.
- Las rutas de entrada, salida y puente de gateway comparten una sola raíz de carga útil multimedia en `~/.openclaw/media`, por lo que las cargas, descargas y cachés de transcodificación terminan en un único directorio protegido en lugar de en un árbol por subsistema.
- Las credenciales pueden respaldarse y restaurarse como parte de las instantáneas de credenciales estándar de OpenClaw; el motor vuelve a adjuntar la pila de recursos de cada cuenta al restaurar sin requerir un nuevo emparejamiento por código QR.

## Incorporación mediante código QR

Como alternativa a pegar manualmente `AppID:AppSecret`, el motor admite un flujo de incorporación por código QR para vincular un QQ Bot con OpenClaw:

1. Ejecuta la ruta de configuración de QQ Bot (por ejemplo `openclaw channels add --channel qqbot`) y elige el flujo de código QR cuando se te indique.
2. Escanea el código QR generado con la aplicación del teléfono vinculada al QQ Bot de destino.
3. Aprueba el emparejamiento en el teléfono. OpenClaw conserva las credenciales devueltas en `credentials/` bajo el ámbito correcto de la cuenta.

Las solicitudes de aprobación generadas por el propio bot (por ejemplo, flujos de "allow this action?" expuestos por la API de QQ Bot) aparecen como solicitudes nativas de OpenClaw que puedes aceptar con `/bot-approve` en lugar de responder mediante el cliente sin procesar de QQ.

## Solución de problemas

- **El bot responde "gone to Mars":** las credenciales no están configuradas o el Gateway no se ha iniciado.
- **No hay mensajes entrantes:** verifica que `appId` y `clientSecret` sean correctos, y que el
  bot esté habilitado en la QQ Open Platform.
- **Respuestas automáticas repetidas:** OpenClaw registra los índices de referencia salientes de QQ como
  creados por el bot e ignora los eventos entrantes cuyo `msgIdx` actual coincide con esa
  misma cuenta del bot. Esto evita bucles de eco de la plataforma y sigue permitiendo que los usuarios
  citen o respondan a mensajes anteriores del bot.
- **La configuración con `--token-file` sigue apareciendo como no configurada:** `--token-file` solo establece
  el AppSecret. Aún necesitas `appId` en la configuración o `QQBOT_APP_ID`.
- **Los mensajes proactivos no llegan:** QQ puede interceptar mensajes iniciados por el bot si
  la persona usuaria no ha interactuado recientemente.
- **La voz no se transcribe:** asegúrate de que STT esté configurado y de que el proveedor sea accesible.

## Relacionado

- [Emparejamiento](/es/channels/pairing)
- [Grupos](/es/channels/groups)
- [Solución de problemas de canales](/es/channels/troubleshooting)
