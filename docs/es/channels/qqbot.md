---
read_when:
    - Quieres conectar OpenClaw a QQ
    - Necesitas configurar las credenciales del bot de QQ
    - Quieres compatibilidad del bot de QQ con grupos o chats privados
summary: Configuración, ajustes y uso del bot de QQ
title: bot de QQ
x-i18n:
    generated_at: "2026-04-24T05:20:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8127ec59d3a17222e7fe883e77aa1c7d384b231b7d479385421df51c995f7dc2
    source_path: channels/qqbot.md
    workflow: 15
---

El bot de QQ se conecta a OpenClaw mediante la API oficial de QQ Bot (gateway WebSocket). El
Plugin admite chat privado C2C, mensajes con @ en grupos y mensajes en canales de guild con
medios enriquecidos (imágenes, voz, video, archivos).

Estado: Plugin incluido. Se admiten mensajes directos, chats grupales, canales de guild y
medios. No se admiten reacciones ni hilos.

## Plugin incluido

Las versiones actuales de OpenClaw incluyen QQ Bot, por lo que las compilaciones empaquetadas normales no necesitan
un paso separado de `openclaw plugins install`.

## Configuración

1. Ve a la [QQ Open Platform](https://q.qq.com/) y escanea el código QR con tu
   QQ del teléfono para registrarte / iniciar sesión.
2. Haz clic en **Create Bot** para crear un nuevo bot de QQ.
3. Busca **AppID** y **AppSecret** en la página de configuración del bot y cópialos.

> AppSecret no se almacena en texto sin formato: si sales de la página sin guardarlo,
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

- La alternativa mediante variables de entorno se aplica solo a la cuenta predeterminada de QQ Bot.
- `openclaw channels add --channel qqbot --token-file ...` proporciona
  solo AppSecret; AppID ya debe estar configurado en la configuración o en `QQBOT_APP_ID`.
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

Cada cuenta inicia su propia conexión WebSocket y mantiene una caché de token independiente
(aislada por `appId`).

Agrega un segundo bot mediante la CLI:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Voz (STT / TTS)

La compatibilidad con STT y TTS usa una configuración de dos niveles con alternativa por prioridad:

| Configuración | Específica del Plugin | Alternativa del framework     |
| ------------- | --------------------- | ----------------------------- |
| STT           | `channels.qqbot.stt`  | `tools.media.audio.models[0]` |
| TTS           | `channels.qqbot.tts`  | `messages.tts`                |

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
    },
  },
}
```

Establece `enabled: false` en cualquiera de ellos para deshabilitarlo.

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
| `qqbot:channel:CHANNEL_ID` | Canal de guild     |

> Cada bot tiene su propio conjunto de OpenID de usuario. Un OpenID recibido por el bot A **no puede**
> usarse para enviar mensajes mediante el bot B.

## Comandos con barra diagonal

Comandos integrados interceptados antes de la cola de IA:

| Comando        | Descripción                                                                                              |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | Prueba de latencia                                                                                       |
| `/bot-version` | Muestra la versión del framework de OpenClaw                                                             |
| `/bot-help`    | Lista todos los comandos                                                                                 |
| `/bot-upgrade` | Muestra el enlace a la guía de actualización de QQBot                                                    |
| `/bot-logs`    | Exporta los registros recientes del gateway como archivo                                                 |
| `/bot-approve` | Aprueba una acción pendiente de QQ Bot (por ejemplo, confirmar una carga C2C o de grupo) mediante el flujo nativo. |

Agrega `?` a cualquier comando para ver ayuda de uso (por ejemplo, `/bot-upgrade ?`).

## Arquitectura del motor

QQ Bot se distribuye como un motor autónomo dentro del Plugin:

- Cada cuenta posee una pila de recursos aislada (conexión WebSocket, cliente API, caché de token, raíz de almacenamiento de medios) indexada por `appId`. Las cuentas nunca comparten estado entrante/saliente.
- El registrador de varias cuentas etiqueta las líneas de registro con la cuenta propietaria para que el diagnóstico siga siendo separable cuando ejecutas varios bots en un mismo gateway.
- Las rutas de entrada, salida y puente del gateway comparten una única raíz de carga útil de medios en `~/.openclaw/media`, de modo que las cargas, descargas y cachés de transcodificación terminan en un único directorio protegido en lugar de un árbol por subsistema.
- Las credenciales se pueden respaldar y restaurar como parte de las instantáneas estándar de credenciales de OpenClaw; el motor vuelve a adjuntar la pila de recursos de cada cuenta al restaurar sin requerir un nuevo emparejamiento por código QR.

## Incorporación mediante código QR

Como alternativa a pegar `AppID:AppSecret` manualmente, el motor admite un flujo de incorporación mediante código QR para vincular un QQ Bot a OpenClaw:

1. Ejecuta la ruta de configuración de QQ Bot (por ejemplo, `openclaw channels add --channel qqbot`) y elige el flujo de código QR cuando se te solicite.
2. Escanea el código QR generado con la app del teléfono vinculada al QQ Bot de destino.
3. Aprueba el emparejamiento en el teléfono. OpenClaw conserva las credenciales devueltas en `credentials/` dentro del ámbito correcto de la cuenta.

Las solicitudes de aprobación generadas por el propio bot (por ejemplo, flujos de "¿permitir esta acción?" expuestos por la API de QQ Bot) aparecen como prompts nativos de OpenClaw que puedes aceptar con `/bot-approve` en lugar de responder desde el cliente QQ sin procesar.

## Solución de problemas

- **El bot responde "gone to Mars":** las credenciales no están configuradas o el Gateway no se ha iniciado.
- **No hay mensajes entrantes:** verifica que `appId` y `clientSecret` sean correctos, y que el
  bot esté habilitado en la QQ Open Platform.
- **La configuración con `--token-file` sigue apareciendo como no configurada:** `--token-file` solo establece
  AppSecret. Aún necesitas `appId` en la configuración o `QQBOT_APP_ID`.
- **Los mensajes proactivos no llegan:** QQ puede interceptar mensajes iniciados por el bot si
  el usuario no ha interactuado recientemente.
- **La voz no se transcribe:** asegúrate de que STT esté configurado y que el proveedor sea accesible.

## Relacionado

- [Pairing](/es/channels/pairing)
- [Groups](/es/channels/groups)
- [Solución de problemas de canales](/es/channels/troubleshooting)
