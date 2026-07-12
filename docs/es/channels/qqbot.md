---
read_when:
    - Quieres conectar OpenClaw con QQ
    - Necesitas configurar las credenciales de QQ Bot
    - Quieres compatibilidad con chats grupales o privados de QQ Bot
summary: Configuración, ajustes y uso del bot de QQ
title: Bot de QQ
x-i18n:
    generated_at: "2026-07-11T22:55:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e654d1a3e501ef825e857cf0fdd780401c6dc0012d729db0aa1ae72a8a6871ed
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot se conecta a OpenClaw mediante la API oficial de QQ Bot (Gateway WebSocket).
El chat privado C2C y las menciones `@` en grupos son los principales tipos de chat, con contenido
multimedia enriquecido (imágenes, voz, vídeo y archivos). Los mensajes de canales de gremio solo admiten
texto e imágenes mediante URL remotas; la voz, el vídeo, la carga de archivos y las imágenes
locales/Base64 no están disponibles en los canales de gremio. Las reacciones y los hilos no se
admiten en ningún lugar.

Estado: plugin oficial descargable.

## Instalación

```bash
openclaw plugins install @openclaw/qqbot
```

## Configuración inicial

1. Ve a la [Plataforma abierta de QQ](https://q.qq.com/) y escanea el código QR con QQ
   en tu teléfono para registrarte o iniciar sesión.
2. Haz clic en **Create Bot** para crear un nuevo bot de QQ.
3. Busca **AppID** y **AppSecret** en la página de configuración del bot y cópialos.

<Note>
AppSecret no se almacena como texto sin formato. Si abandonas la página sin guardarlo, tendrás que generar uno nuevo.
</Note>

4. Añade el canal:

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. Reinicia el Gateway.

Configuración interactiva:

```bash
openclaw channels add
```

El asistente también ofrece la vinculación mediante código QR como alternativa a introducir AppID/AppSecret
manualmente: escanea el código con la aplicación del teléfono asociada al QQ Bot de destino para completar
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

- `openclaw channels add --channel qqbot --token-file ...` establece únicamente el AppSecret;
  `appId` ya debe estar definido en la configuración o en `QQBOT_APP_ID`.
- `clientSecret` acepta una cadena de texto sin formato, una ruta de archivo (`clientSecretFile`)
  o un objeto SecretRef estructurado.
- Las cadenas de marcador heredadas `secretref:...` / `secretref-env:...` se rechazan para
  `clientSecret`; utiliza en su lugar un objeto SecretRef estructurado.

### Política de acceso

- `allowFrom` / `groupAllowFrom` determinan quién puede chatear con el bot en contextos C2C /
  de grupo. `dmPolicy` / `groupPolicy` (`open` | `allowlist` | `disabled`)
  controlan el modo de aplicación. El valor predeterminado de `dmPolicy` pasa a ser `allowlist` cuando
  `allowFrom` contiene una entrada concreta (que no sea un comodín); de lo contrario, es `open`.
  El valor predeterminado de `groupPolicy` pasa a ser `allowlist` cuando `groupAllowFrom` o
  `allowFrom` contienen una entrada concreta; de lo contrario, es `open`.
- Los comandos de barra «Autorización: lista de permitidos» requieren una entrada explícita sin comodines en
  `allowFrom` (o en `groupAllowFrom` para invocaciones de grupo), independientemente de
  `dmPolicy` / `groupPolicy`; consulta [Comandos de barra](#slash-commands).

### Configuración de varias cuentas

Ejecuta varios bots de QQ en una única instancia de OpenClaw:

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
aislados, identificados mediante `appId`. Las líneas del registro se etiquetan con el identificador de la cuenta propietaria para que
los diagnósticos permanezcan separados cuando se ejecutan varios bots en un mismo Gateway.

Añade un segundo bot mediante la CLI:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Chats de grupo

La compatibilidad con grupos utiliza los OpenID de los grupos de QQ, no los nombres para mostrar. Añade el bot a un
grupo y, después, menciónalo o configura el grupo para que funcione sin menciones.

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

`groups["*"]` establece los valores predeterminados para todos los grupos; una entrada concreta
`groups.GROUP_OPENID` sustituye esos valores predeterminados para un grupo. Configuración de grupos:

| Campo                 | Valor predeterminado       | Descripción                                                                                              |
| --------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------- |
| `requireMention`      | `true`                     | Requiere una mención `@` antes de que el bot responda.                                                   |
| `commandLevel`        | `all`                      | Determina qué comandos de barra integrados pueden ejecutarse en el grupo (consulta más abajo).           |
| `ignoreOtherMentions` | `false`                    | Descarta los mensajes que mencionen a otra persona, pero no al bot.                                      |
| `historyLimit`        | `50`                       | Conserva mensajes recientes sin mención como contexto para el siguiente turno con mención. `0` desactiva el historial. |
| `tools`               | —                          | Permite o deniega herramientas para todo el grupo.                                                       |
| `toolsBySender`       | —                          | Sustituciones de herramientas por remitente; consulta [Grupos](/es/channels/groups#groupchannel-tool-restrictions-optional). |
| `name`                | prefijo del openid         | Etiqueta descriptiva utilizada en los registros y el contexto del grupo.                                |
| `prompt`              | valor integrado predeterminado | Instrucciones de comportamiento por grupo añadidas al contexto del agente.                           |

`commandLevel` acepta:

| Nivel    | Comportamiento                                                                                                                                             |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `all`    | Los comandos integrados existentes siguen disponibles. Algunos permanecen ocultos en los menús, pero los usuarios autorizados aún pueden ejecutarlos en el grupo. |
| `safety` | `/help`, `/btw` y `/stop` siguen visibles en el grupo; los comandos sensibles (`/config`, `/tools`, `/bash`, etc.) deben ejecutarse en un chat privado.     |
| `strict` | Solo se permiten los controles de sesión de grupo necesarios para un funcionamiento estricto. `/stop` continúa disponible para que un remitente autorizado pueda interrumpir una ejecución activa. |

Las entradas antiguas `toolPolicy` de QQBot se han retirado. Ejecuta `openclaw doctor --fix` para migrarlas a `tools`.

Los modos de activación son `mention` y `always`. `requireMention: true` corresponde a
`mention`; `requireMention: false` corresponde a `always`. Si existe una sustitución del modo de activación
a nivel de sesión, esta prevalece sobre la configuración.

La cola de entrada es independiente para cada interlocutor. Los interlocutores de grupo tienen un límite de cola mayor (50 frente a 20
para los interlocutores directos), expulsan los mensajes escritos por el bot antes que los humanos cuando se llena
y combinan las ráfagas de mensajes normales del grupo en un único turno con atribución. Los comandos de barra
se ejecutan uno por uno, independientemente de cualquier lote combinado.

### Voz (STT/TTS)

STT y TTS admiten una configuración de dos niveles con prioridad y mecanismo alternativo:

| Ajuste | Específico del plugin                                    | Alternativa del framework      |
| ------ | -------------------------------------------------------- | ------------------------------ |
| STT    | `channels.qqbot.stt`                                     | `tools.media.audio.models[0]`  |
| TTS    | `channels.qqbot.tts`, `channels.qqbot.accounts.<id>.tts` | `messages.tts`                 |

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

Establece `enabled: false` en cualquiera de ellos para desactivarlo. Las sustituciones de TTS a nivel de cuenta utilizan la
misma estructura que `messages.tts` y se combinan recursivamente sobre la configuración de TTS del canal/global.

Las solicitudes STT agotan el tiempo de espera tras 60 segundos de forma predeterminada. El STT específico del plugin utiliza la
sustitución `models.providers.<id>.timeoutSeconds` seleccionada. El STT de audio del framework
utiliza `tools.media.audio.models[0].timeoutSeconds`, después
`tools.media.audio.timeoutSeconds` y, por último, la sustitución del proveedor seleccionado.

Los archivos adjuntos de voz entrantes de QQ se exponen a los agentes como metadatos multimedia de audio,
mientras que los archivos de voz sin procesar se mantienen fuera de `MediaPaths` genérico. `[[audio_as_voice]]`
en una respuesta de texto sin formato sintetiza TTS y envía un mensaje de voz nativo de QQ cuando
TTS está configurado.

El comportamiento de carga/transcodificación del audio saliente también puede ajustarse mediante
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

<Note>
Cada bot tiene su propio conjunto de OpenID de usuario. Un OpenID recibido por el Bot A **no puede** utilizarse para enviar mensajes mediante el Bot B.
</Note>

## Comandos de barra

Comandos integrados interceptados antes de la cola de IA:

| Comando              | Autorización       | Ámbito         | Descripción                                                                                          |
| -------------------- | ------------------ | -------------- | ---------------------------------------------------------------------------------------------------- |
| `/bot-ping`          | —                  | cualquiera     | Prueba de latencia                                                                                   |
| `/bot-help`          | —                  | cualquiera     | Enumera todos los comandos                                                                           |
| `/bot-me`            | —                  | solo privado   | Muestra el identificador de usuario de QQ (openid) del remitente para configurar `allowFrom` / `groupAllowFrom` |
| `/bot-version`       | —                  | solo privado   | Muestra la versión del framework OpenClaw y la versión del plugin                                    |
| `/bot-upgrade`       | —                  | solo privado   | Muestra el enlace a la guía de actualización de QQBot                                                |
| `/bot-approve`       | lista de permitidos | solo privado  | Administra la configuración de aprobación de ejecución de comandos (activar/desactivar/siempre/restablecer/estado) |
| `/bot-logs`          | lista de permitidos | solo privado  | Exporta los registros recientes del Gateway como archivo                                             |
| `/bot-clear-storage` | lista de permitidos | solo privado  | Elimina las descargas almacenadas en caché del directorio multimedia de QQBot                         |
| `/bot-streaming`     | lista de permitidos | solo privado  | Activa o desactiva las respuestas en streaming de C2C                                                |
| `/bot-group-allways` | lista de permitidos | solo privado  | Alterna el modo de activación predeterminado del grupo (mención obligatoria frente a siempre activo) |

Añade `?` a cualquier comando para obtener ayuda de uso (por ejemplo, `/bot-upgrade ?`).

Los comandos «Autorización: lista de permitidos» también requieren que el openid del remitente figure en una
lista explícita `allowFrom` sin comodines (`groupAllowFrom` tiene prioridad para los
comandos emitidos desde grupos y recurre a `allowFrom` como alternativa). Un comodín
`allowFrom: ["*"]` permite chatear, pero no utilizar estos comandos. Al ejecutar uno de ellos
fuera de un chat privado o sin autorización, se devuelve una indicación en lugar de
descartar el mensaje silenciosamente.

`/bot-me`, `/bot-version` y `/bot-upgrade` solo están disponibles en chats privados, pero no
requieren la lista de permitidos: cualquier remitente C2C puede ejecutarlos.

Cuando las aprobaciones de ejecución de QQ Bot usan la alternativa predeterminada del mismo chat, los clics
en los botones nativos de aprobación siguen la misma lista explícita de comandos permitidos sin
comodines. Para conceder acceso solo a las aprobaciones sin proporcionar un acceso más amplio a los comandos, configure
`channels.qqbot.execApprovals.approvers`. Las aprobaciones nativas de ejecución están habilitadas de
forma predeterminada.

## Contenido multimedia y almacenamiento

- El contenido multimedia entrante, saliente y del puente del Gateway comparte una única raíz de carga útil en
  `~/.openclaw/media/qqbot` (respetando `OPENCLAW_HOME` cuando está definido), de modo que las cargas,
  descargas y cachés de transcodificación permanezcan en un único directorio protegido.
- La entrega de contenido multimedia enriquecido a destinos C2C y de grupo pasa por una única ruta `sendMedia`.
  Los archivos locales y los búferes en memoria de 5&nbsp;MiB o más usan los
  endpoints de carga fragmentada de QQ; las cargas útiles más pequeñas y las fuentes de URL remota/Base64 usan
  la API de carga en una sola operación.
- Si una actualización en caliente interrumpe el Gateway antes de que termine de escribir
  `openclaw.json`, el Plugin restaura los últimos valores conocidos de `appId` / `clientSecret`
  de esa cuenta desde una instantánea interna en el siguiente inicio (sin
  sobrescribir nunca un cambio de configuración intencional), por lo que no es necesario
  volver a escanear el código QR.

## Solución de problemas

- **El Gateway no se inicia / no hay mensajes entrantes:** compruebe que `appId` y
  `clientSecret` sean correctos y que el bot esté habilitado en QQ Open Platform.
  Si falta una credencial, aparece el mensaje "QQBot no está configurado (falta appId o
  clientSecret)".
- **La configuración con `--token-file` sigue apareciendo como no configurada:** `--token-file` solo
  establece AppSecret. `appId` debe seguir definiéndose en la configuración o en `QQBOT_APP_ID`.
- **Las respuestas de grupo en ráfagas colisionan:** cuando se llena la cola de un interlocutor, la cola de entrada descarta
  los mensajes generados por bots antes que los mensajes humanos y combina
  las ráfagas de mensajes de grupo normales (que no son comandos) en un único turno con atribución, por lo que
  una avalancha de conversaciones de bots no debería privar de procesamiento a los mensajes humanos.
- **No llegan los mensajes proactivos:** QQ puede bloquear los mensajes iniciados por el bot si
  el usuario no ha interactuado recientemente.
- **La voz no se transcribe:** asegúrese de que STT esté configurado y de que se pueda
  acceder al proveedor.

## Temas relacionados

- [Emparejamiento](/es/channels/pairing)
- [Grupos](/es/channels/groups)
- [Solución de problemas de canales](/es/channels/troubleshooting)
