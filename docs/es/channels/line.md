---
read_when:
    - Quieres conectar OpenClaw a LINE
    - Necesitas configurar Webhook + credenciales de LINE
    - Quieres opciones de mensajes específicas de LINE
summary: Configuración, ajustes y uso del Plugin de LINE Messaging API
title: LINE
x-i18n:
    generated_at: "2026-04-24T05:19:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: a8c3187486033ab01c243f1d44518cad2b28f744a9d0cde1de9117bd26452ed4
    source_path: channels/line.md
    workflow: 15
---

LINE se conecta a OpenClaw mediante la LINE Messaging API. El Plugin se ejecuta como
receptor de Webhook en el gateway y usa tu token de acceso del canal y el secreto del canal para
autenticación.

Estado: Plugin incluido. Se admiten mensajes directos, chats grupales, medios, ubicaciones, mensajes Flex,
mensajes de plantilla y respuestas rápidas. No se admiten reacciones ni hilos.

## Plugin incluido

LINE se distribuye como un Plugin incluido en las versiones actuales de OpenClaw, por lo que las compilaciones
empaquetadas normales no necesitan una instalación separada.

Si usas una compilación antigua o una instalación personalizada que excluye LINE, instálalo
manualmente:

```bash
openclaw plugins install @openclaw/line
```

Checkout local (al ejecutarlo desde un repositorio git):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Configuración

1. Crea una cuenta de LINE Developers y abre la consola:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Crea (o elige) un proveedor y agrega un canal de **Messaging API**.
3. Copia el **Channel access token** y el **Channel secret** desde la configuración del canal.
4. Habilita **Use webhook** en la configuración de Messaging API.
5. Establece la URL del Webhook en tu endpoint del gateway (se requiere HTTPS):

```
https://gateway-host/line/webhook
```

El gateway responde a la verificación del Webhook de LINE (GET) y a los eventos entrantes (POST).
Si necesitas una ruta personalizada, establece `channels.line.webhookPath` o
`channels.line.accounts.<id>.webhookPath` y actualiza la URL en consecuencia.

Nota de seguridad:

- La verificación de firma de LINE depende del cuerpo (HMAC sobre el cuerpo sin procesar), por lo que OpenClaw aplica límites estrictos de tamaño del cuerpo y tiempo de espera antes de la verificación.
- OpenClaw procesa los eventos del Webhook a partir de los bytes sin procesar de la solicitud verificada. Los valores `req.body` transformados por middleware ascendente se ignoran para proteger la integridad de la firma.

## Configurar

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

`tokenFile` y `secretFile` deben apuntar a archivos normales. Se rechazan los enlaces simbólicos.

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

Los mensajes directos usan pairing de forma predeterminada. Los remitentes desconocidos reciben un
código de pairing y sus mensajes se ignoran hasta ser aprobados.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Listas de permitidos y políticas:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: IDs de usuario de LINE permitidos para mensajes directos
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: IDs de usuario de LINE permitidos para grupos
- Sobrescrituras por grupo: `channels.line.groups.<groupId>.allowFrom`
- Nota de tiempo de ejecución: si `channels.line` falta por completo, el tiempo de ejecución usa `groupPolicy="allowlist"` para las comprobaciones de grupo (incluso si `channels.defaults.groupPolicy` está establecido).

Los IDs de LINE distinguen entre mayúsculas y minúsculas. Los IDs válidos tienen este formato:

- Usuario: `U` + 32 caracteres hexadecimales
- Grupo: `C` + 32 caracteres hexadecimales
- Sala: `R` + 32 caracteres hexadecimales

## Comportamiento de los mensajes

- El texto se divide en fragmentos de 5000 caracteres.
- Se elimina el formato Markdown; los bloques de código y las tablas se convierten en tarjetas Flex
  cuando es posible.
- Las respuestas en streaming se almacenan en búfer; LINE recibe fragmentos completos con una animación de carga
  mientras el agente trabaja.
- Las descargas de medios están limitadas por `channels.line.mediaMaxMb` (10 por defecto).

## Datos del canal (mensajes enriquecidos)

Usa `channelData.line` para enviar respuestas rápidas, ubicaciones, tarjetas Flex o mensajes
de plantilla.

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

El Plugin de LINE también incluye un comando `/card` para preajustes de mensajes Flex:

```
/card info "Welcome" "Thanks for joining!"
```

## Compatibilidad con ACP

LINE admite enlaces de conversación de ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` enlaza el chat actual de LINE a una sesión ACP sin crear un hilo hijo.
- Los enlaces de ACP configurados y las sesiones ACP activas enlazadas a conversaciones funcionan en LINE como en otros canales de conversación.

Consulta [ACP agents](/es/tools/acp-agents) para más detalles.

## Medios salientes

El Plugin de LINE admite el envío de imágenes, videos y archivos de audio mediante la herramienta de mensajes del agente. Los medios se envían mediante la ruta de entrega específica de LINE con el manejo apropiado de vista previa y seguimiento:

- **Imágenes**: se envían como mensajes de imagen de LINE con generación automática de vista previa.
- **Videos**: se envían con manejo explícito de vista previa y tipo de contenido.
- **Audio**: se envían como mensajes de audio de LINE.

Las URL de medios salientes deben ser URL HTTPS públicas. OpenClaw valida el nombre de host de destino antes de entregar la URL a LINE y rechaza destinos de loopback, link-local y red privada.

Los envíos de medios genéricos recurren a la ruta existente solo para imágenes cuando no hay una ruta específica de LINE disponible.

## Solución de problemas

- **La verificación del Webhook falla:** asegúrate de que la URL del Webhook use HTTPS y que
  `channelSecret` coincida con la consola de LINE.
- **No hay eventos entrantes:** confirma que la ruta del Webhook coincide con `channels.line.webhookPath`
  y que LINE puede alcanzar el gateway.
- **Errores al descargar medios:** aumenta `channels.line.mediaMaxMb` si los medios superan el
  límite predeterminado.

## Relacionado

- [Resumen de canales](/es/channels) — todos los canales compatibles
- [Pairing](/es/channels/pairing) — autenticación de DM y flujo de pairing
- [Groups](/es/channels/groups) — comportamiento de chats grupales y restricción por mención
- [Channel Routing](/es/channels/channel-routing) — enrutamiento de sesión para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y endurecimiento
