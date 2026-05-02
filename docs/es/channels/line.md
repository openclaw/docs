---
read_when:
    - Quieres conectar OpenClaw con LINE
    - Necesitas configurar el Webhook de LINE y las credenciales
    - Quieres opciones de mensaje específicas de LINE
summary: Configuración, ajuste y uso del Plugin de LINE Messaging API
title: LÍNEA
x-i18n:
    generated_at: "2026-05-02T20:41:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7a42afc437140185415347f66a8c0b8eaf7d623a6cc08aedf274121e89cdc3b7
    source_path: channels/line.md
    workflow: 16
---

LINE se conecta a OpenClaw mediante la LINE Messaging API. El Plugin se ejecuta como receptor de webhook en el gateway y usa tu token de acceso de canal + secreto de canal para la autenticación.

Estado: Plugin descargable. Se admiten mensajes directos, chats grupales, archivos multimedia, ubicaciones, mensajes Flex, mensajes de plantilla y respuestas rápidas. No se admiten reacciones ni hilos.

## Instalación

Instala LINE antes de configurar el canal:

```bash
openclaw plugins install @openclaw/line
```

Checkout local (cuando se ejecuta desde un repositorio git):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Configuración inicial

1. Crea una cuenta de LINE Developers y abre la consola:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Crea (o elige) un proveedor y añade un canal de **Messaging API**.
3. Copia el **Channel access token** y el **Channel secret** desde la configuración del canal.
4. Activa **Use webhook** en la configuración de Messaging API.
5. Establece la URL del webhook en tu endpoint de gateway (se requiere HTTPS):

```
https://gateway-host/line/webhook
```

El gateway responde a la verificación de webhook de LINE (GET) y a los eventos entrantes (POST).
Si necesitas una ruta personalizada, define `channels.line.webhookPath` o
`channels.line.accounts.<id>.webhookPath` y actualiza la URL según corresponda.

Nota de seguridad:

- La verificación de firma de LINE depende del cuerpo (HMAC sobre el cuerpo sin procesar), por lo que OpenClaw aplica límites estrictos de cuerpo previos a la autenticación y un tiempo de espera antes de la verificación.
- OpenClaw procesa los eventos de webhook a partir de los bytes sin procesar verificados de la solicitud. Los valores `req.body` transformados por middleware upstream se ignoran para preservar la integridad de la firma.

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

`tokenFile` y `secretFile` deben apuntar a archivos regulares. Se rechazan los enlaces simbólicos.

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

Los mensajes directos usan emparejamiento de forma predeterminada. Los remitentes desconocidos reciben un código de emparejamiento y sus mensajes se ignoran hasta que se aprueban.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Listas de permitidos y políticas:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: IDs de usuario de LINE permitidos para DMs
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: IDs de usuario de LINE permitidos para grupos
- Anulaciones por grupo: `channels.line.groups.<groupId>.allowFrom`
- Nota de runtime: si `channels.line` falta por completo, el runtime recurre a `groupPolicy="allowlist"` para las comprobaciones de grupo (incluso si `channels.defaults.groupPolicy` está definido).

Los IDs de LINE distinguen mayúsculas y minúsculas. Los IDs válidos tienen este aspecto:

- Usuario: `U` + 32 caracteres hexadecimales
- Grupo: `C` + 32 caracteres hexadecimales
- Sala: `R` + 32 caracteres hexadecimales

## Comportamiento de los mensajes

- El texto se divide en fragmentos de 5000 caracteres.
- Se elimina el formato Markdown; los bloques de código y las tablas se convierten en tarjetas Flex cuando es posible.
- Las respuestas en streaming se almacenan en búfer; LINE recibe fragmentos completos con una animación de carga mientras el agente trabaja.
- Las descargas multimedia están limitadas por `channels.line.mediaMaxMb` (valor predeterminado 10).
- Los archivos multimedia entrantes se guardan en `~/.openclaw/media/inbound/` antes de pasarlos al agente, coincidiendo con el almacén multimedia compartido que usan otros plugins de canal incluidos.

## Datos del canal (mensajes enriquecidos)

Usa `channelData.line` para enviar respuestas rápidas, ubicaciones, tarjetas Flex o mensajes de plantilla.

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

- `/acp spawn <agent> --bind here` enlaza el chat actual de LINE a una sesión ACP sin crear un hilo secundario.
- Los enlaces ACP configurados y las sesiones ACP activas vinculadas a conversaciones funcionan en LINE igual que en otros canales de conversación.

Consulta [Agentes ACP](/es/tools/acp-agents) para obtener detalles.

## Multimedia saliente

El Plugin de LINE admite el envío de imágenes, videos y archivos de audio mediante la herramienta de mensajes del agente. Los archivos multimedia se envían mediante la ruta de entrega específica de LINE, con manejo adecuado de vista previa y seguimiento:

- **Imágenes**: se envían como mensajes de imagen de LINE con generación automática de vista previa.
- **Videos**: se envían con manejo explícito de vista previa y tipo de contenido.
- **Audio**: se envían como mensajes de audio de LINE.

Las URL de multimedia saliente deben ser URL HTTPS públicas. OpenClaw valida el nombre de host de destino antes de entregar la URL a LINE y rechaza destinos loopback, link-local y de redes privadas.

Los envíos multimedia genéricos recurren a la ruta existente solo para imágenes cuando no hay una ruta específica de LINE disponible.

## Solución de problemas

- **La verificación de webhook falla:** asegúrate de que la URL del webhook sea HTTPS y de que `channelSecret` coincida con la consola de LINE.
- **No hay eventos entrantes:** confirma que la ruta del webhook coincida con `channels.line.webhookPath` y que LINE pueda acceder al gateway.
- **Errores de descarga multimedia:** aumenta `channels.line.mediaMaxMb` si el archivo multimedia supera el límite predeterminado.

## Relacionado

- [Resumen de canales](/es/channels) — todos los canales admitidos
- [Emparejamiento](/es/channels/pairing) — autenticación por DM y flujo de emparejamiento
- [Grupos](/es/channels/groups) — comportamiento del chat grupal y control de menciones
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y endurecimiento
