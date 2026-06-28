---
read_when:
    - Quieres conectar OpenClaw con LINE
    - Necesitas configurar el Webhook de LINE y las credenciales
    - Quieres opciones de mensaje específicas de LINE
summary: Instalación, configuración y uso del Plugin de LINE Messaging API
title: LINE
x-i18n:
    generated_at: "2026-06-28T20:43:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d54b6740c3403d8fb2e815d969d891973d88c2e2ff43e9de7642c1c81d36e090
    source_path: hi/channels/line.md
    workflow: 16
---

LINE se conecta a OpenClaw mediante LINE Messaging API. El Plugin se ejecuta como receptor de Webhook en el Gateway y usa tu channel access token + channel secret para la autenticación.

Estado: Plugin descargable. Se admiten mensajes directos, chats grupales, medios, ubicaciones, mensajes Flex, mensajes de plantilla y respuestas rápidas. Las reacciones y los hilos no son compatibles.

## Instalar

Instala LINE antes de configurar el canal:

```bash
openclaw plugins install @openclaw/line
```

Checkout local (cuando se ejecuta desde un repositorio git):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Configuración

1. Crea una cuenta de LINE Developers y abre la Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Crea (o selecciona) un Provider y añade un canal de **Messaging API**.
3. Copia el **Channel access token** y el **Channel secret** desde la configuración del canal.
4. En la configuración de Messaging API, habilita **Use webhook**.
5. Establece la URL del Webhook en tu endpoint del Gateway (se requiere HTTPS):

```
https://gateway-host/line/webhook
```

El Gateway responde a la verificación de Webhook (GET) de LINE y acepta eventos entrantes firmados (POST) inmediatamente después de validar la firma y la carga útil; el procesamiento del agente continúa de forma asíncrona.
Si necesitas una ruta personalizada, configura `channels.line.webhookPath` o
`channels.line.accounts.<id>.webhookPath` y actualiza la URL según corresponda.

Nota de seguridad:

- La verificación de firma de LINE depende del cuerpo (HMAC sobre el cuerpo sin procesar), por lo que OpenClaw aplica límites estrictos de cuerpo previos a la autenticación y tiempos de espera antes de la verificación.
- OpenClaw procesa los eventos de Webhook a partir de los bytes de solicitud sin procesar verificados. Los valores `req.body` transformados por middleware ascendente se ignoran para mantener la seguridad de integridad de la firma.

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

Configuración de DM público:

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

`tokenFile` y `secretFile` deben apuntar a archivos regulares. Los enlaces simbólicos se rechazan.

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

Los mensajes directos usan pairing de forma predeterminada. Los remitentes desconocidos reciben un código de pairing y sus mensajes se ignoran hasta que se aprueben.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Listas de permitidos y políticas:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: IDs de usuario LINE permitidos para DMs; se requiere `["*"]` para `dmPolicy: "open"`
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: IDs de usuario LINE permitidos para grupos
- Sobrescrituras por grupo: `channels.line.groups.<groupId>.allowFrom`
- Los grupos de acceso de remitente estáticos se pueden referenciar desde `allowFrom`, `groupAllowFrom` y `allowFrom` por grupo con `accessGroup:<name>`.
- Nota de tiempo de ejecución: si falta `channels.line` por completo, el runtime recurre a `groupPolicy="allowlist"` para las comprobaciones de grupo (aunque `channels.defaults.groupPolicy` esté configurado).

Los IDs de LINE distinguen mayúsculas y minúsculas. Los IDs válidos se ven así:

- Usuario: `U` + 32 caracteres hexadecimales
- Grupo: `C` + 32 caracteres hexadecimales
- Sala: `R` + 32 caracteres hexadecimales

## Comportamiento de los mensajes

- El texto se divide en fragmentos de 5000 caracteres.
- El formato Markdown se elimina; los bloques de código y las tablas se convierten en tarjetas Flex cuando es posible.
- Las respuestas en streaming se almacenan en búfer; LINE recibe fragmentos completos con animación de carga mientras el agente trabaja.
- Las descargas de medios están limitadas por `channels.line.mediaMaxMb` (predeterminado 10).
- Los medios entrantes se guardan en `~/.openclaw/media/inbound/` antes de pasarse al agente, lo que coincide con el almacén de medios compartido que usan otros Plugins de canal incluidos.

## Datos de canal (mensajes enriquecidos)

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

El LINE Plugin también incluye el comando `/card` para presets de mensajes Flex:

```
/card info "Welcome" "Thanks for joining!"
```

## Compatibilidad con ACP

LINE admite bindings de conversación de ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` vincula el chat actual de LINE a la sesión ACP sin crear un hilo hijo.
- Los bindings ACP configurados y las sesiones ACP activas vinculadas a conversaciones funcionan en LINE igual que en otros canales de conversación.

Consulta [agentes ACP](/es/tools/acp-agents) para obtener detalles.

## Medios salientes

El LINE Plugin admite el envío de imágenes, videos y archivos de audio mediante la herramienta de mensajes del agente. Los medios se envían a través de la ruta de entrega específica de LINE con el manejo adecuado de vista previa y seguimiento:

- **Imágenes**: se envían como mensajes de imagen de LINE con generación automática de vista previa.
- **Videos**: se envían con manejo explícito de vista previa y tipo de contenido.
- **Audio**: se envía como mensajes de audio de LINE.

Las URLs de medios salientes deben ser URLs HTTPS públicas. OpenClaw valida el nombre de host de destino antes de entregar la URL a LINE y rechaza destinos de bucle local, link-local y redes privadas.

Los envíos de medios genéricos recurren a la ruta existente solo para imágenes cuando la ruta específica de LINE no está disponible.

## Solución de problemas

- **La verificación del Webhook falla:** asegúrate de que la URL del Webhook sea HTTPS y de que `channelSecret` coincida con la consola de LINE.
- **No hay eventos entrantes:** confirma que la ruta del Webhook coincida con `channels.line.webhookPath` y que el Gateway sea accesible desde LINE.
- **Errores de descarga de medios:** si los medios superan el límite predeterminado, aumenta `channels.line.mediaMaxMb`.

## Relacionado

- [Resumen de canales](/es/channels) — todos los canales compatibles
- [Pairing](/es/channels/pairing) — autenticación de DM y flujo de pairing
- [Grupos](/es/channels/groups) — comportamiento del chat grupal y control por menciones
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesión para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y hardening
