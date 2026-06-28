---
read_when:
    - Quiere conectar OpenClaw a LINE
    - Debe configurar el Webhook de LINE y las credenciales
    - Necesita parámetros de mensaje específicos de LINE
summary: Instalación, configuración y uso del Plugin LINE Messaging API
title: LINE
x-i18n:
    generated_at: "2026-06-28T20:45:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9a6c76ea64b92b76dd2f6ab0d9fff7eb316e1940ba660d65262307796b5a6abc
    source_path: ru/channels/line.md
    workflow: 16
---

LINE se conecta a OpenClaw mediante LINE Messaging API. Plugin funciona como receptor de Webhook
en Gateway y usa tu channel access token + channel secret para la
autenticación.

Estado: Plugin cargable. Se admiten mensajes directos, chats grupales, medios, ubicaciones, mensajes Flex,
mensajes de plantilla y respuestas rápidas. Las reacciones y los hilos
no son compatibles.

## Instalación

Instala LINE antes de configurar el canal:

```bash
openclaw plugins install @openclaw/line
```

Copia de trabajo local (al ejecutarse desde un repositorio git):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Configuración

1. Crea una cuenta de LINE Developers y abre la Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Crea (o selecciona) un Provider y agrega un canal **Messaging API**.
3. Copia **Channel access token** y **Channel secret** desde la configuración del canal.
4. Activa **Use webhook** en la configuración de Messaging API.
5. Define la URL de Webhook para tu endpoint de Gateway (requiere HTTPS):

```
https://gateway-host/line/webhook
```

Gateway responde a la verificación de Webhook de LINE (GET) y confirma los eventos entrantes
firmados (POST) inmediatamente después de validar la firma y la carga útil; el procesamiento
del agente continúa de forma asíncrona.
Si necesitas una ruta personalizada, define `channels.line.webhookPath` o
`channels.line.accounts.<id>.webhookPath` y actualiza la URL en consecuencia.

Nota de seguridad:

- La verificación de firma de LINE depende del cuerpo de la solicitud (HMAC sobre el cuerpo sin procesar), por lo que OpenClaw aplica límites estrictos de tamaño de cuerpo y un tiempo de espera previo a la autenticación antes de la verificación.
- OpenClaw procesa eventos de Webhook a partir de los bytes sin procesar verificados de la solicitud. Los valores de `req.body` transformados por middleware anterior en la cadena se ignoran para preservar la integridad de la firma.

## Configuración

Configuración mínima:

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",
      channelSecret: "LINE_CHANNEL_SECRET",
      dmPolicy: "pairing",
    },
  },
}
```

Configuración de mensajes directos abiertos:

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",
      channelSecret: "LINE_CHANNEL_SECRET",
      dmPolicy: "open",
      allowFrom: ["*"],
    },
  },
}
```

Variables de entorno (solo cuenta predeterminada):

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

Archivos de token/secreto:

```json5
{
  channels: {
    line: {
      tokenFile: "/path/to/line-token.txt",
      secretFile: "/path/to/line-secret.txt",
    },
  },
}
```

`tokenFile` y `secretFile` deben apuntar a archivos normales. Los enlaces simbólicos se rechazan.

Varias cuentas:

```json5
{
  channels: {
    line: {
      accounts: {
        marketing: {
          channelAccessToken: "...",
          channelSecret: "...",
          webhookPath: "/line/marketing",
        },
      },
    },
  },
}
```

## Control de acceso

Los mensajes directos requieren emparejamiento de forma predeterminada. Los remitentes desconocidos reciben un código de emparejamiento y sus
mensajes se ignoran hasta su aprobación.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Listas de permitidos y políticas:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: ID de usuario de LINE permitidos para mensajes directos; `dmPolicy: "open"` requiere `["*"]`
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: ID de usuario de LINE permitidos para grupos
- Sobrescrituras por grupo individual: `channels.line.groups.<groupId>.allowFrom`
- Los grupos estáticos de acceso de remitentes se pueden referenciar desde `allowFrom`, `groupAllowFrom` y el `allowFrom` de grupo mediante `accessGroup:<name>`.
- Nota sobre runtime: si `channels.line` está ausente por completo, runtime vuelve a `groupPolicy="allowlist"` para las comprobaciones de grupos (aunque `channels.defaults.groupPolicy` esté definido).

Los ID de LINE distinguen mayúsculas y minúsculas. Los ID válidos tienen este aspecto:

- Usuario: `U` + 32 caracteres hexadecimales
- Grupo: `C` + 32 caracteres hexadecimales
- Sala: `R` + 32 caracteres hexadecimales

## Comportamiento de los mensajes

- El texto se divide en fragmentos de 5000 caracteres.
- El formato Markdown se elimina; los bloques de código y las tablas se convierten en Flex
  cards cuando es posible.
- Las respuestas en streaming se almacenan en búfer; LINE recibe fragmentos completos con animación de carga
  mientras el agente trabaja.
- La descarga de medios está limitada por `channels.line.mediaMaxMb` (10 de forma predeterminada).
- Los medios entrantes se guardan en `~/.openclaw/media/inbound/` antes de pasarse
  al agente, de acuerdo con el almacenamiento de medios compartido usado por otros Plugin
  de canales integrados.

## Datos de canal (mensajes avanzados)

Usa `channelData.line` para enviar respuestas rápidas, ubicaciones, Flex cards o mensajes de plantilla.

```json5
{
  text: "Here you go",
  channelData: {
    line: {
      quickReplies: ["Status", "Help"],
      location: {
        title: "Office",
        address: "123 Main St",
        latitude: 35.681236,
        longitude: 139.767125,
      },
      flexMessage: {
        altText: "Status card",
        contents: {
          /* Flex payload */
        },
      },
      templateMessage: {
        type: "confirm",
        text: "Proceed?",
        confirmLabel: "Yes",
        confirmData: "yes",
        cancelLabel: "No",
        cancelData: "no",
      },
    },
  },
}
```

El Plugin LINE también incluye el comando `/card` para preajustes de mensajes Flex:

```
/card info "Welcome" "Thanks for joining!"
```

## Compatibilidad con ACP

LINE admite enlaces de conversación ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` vincula el chat LINE actual a una sesión ACP sin crear un hilo secundario.
- Los enlaces ACP configurados y las sesiones ACP activas vinculadas a una conversación funcionan en LINE igual que en otros canales de conversación.

Consulta [agentes ACP](/es/tools/acp-agents) para más detalles.

## Medios salientes

El Plugin LINE admite el envío de imágenes, videos y archivos de audio mediante la herramienta de mensajes del agente. Los medios se envían a través de una ruta de entrega específica de LINE con el manejo correspondiente de vista previa y seguimiento:

- **Imágenes**: se envían como mensajes de imagen de LINE con generación automática de vista previa.
- **Videos**: se envían con manejo explícito de vista previa y tipo de contenido.
- **Audio**: se envía como mensajes de audio de LINE.

Las URL de medios salientes deben ser URL HTTPS públicas. OpenClaw valida el nombre de host de destino antes de pasar la URL a LINE y rechaza local loopback, link-local y destinos en redes privadas.

Los envíos de medios genéricos recurren a la ruta existente solo para imágenes cuando la ruta específica de LINE no está disponible.

## Solución de problemas

- **La verificación de Webhook falla:** asegúrate de que la URL de Webhook use HTTPS y
  que `channelSecret` coincida con LINE console.
- **No hay eventos entrantes:** confirma que la ruta de Webhook coincida con `channels.line.webhookPath`
  y que Gateway sea accesible desde LINE.
- **Errores de descarga de medios:** aumenta `channels.line.mediaMaxMb` si los medios superan
  el límite predeterminado.

## Véase también

- [Descripción general de canales](/es/channels) — todos los canales compatibles
- [Emparejamiento](/es/channels/pairing) — autenticación de mensajes directos y flujo de emparejamiento
- [Grupos](/es/channels/groups) — comportamiento de chats grupales y restricción por menciones
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y refuerzo de seguridad
