---
read_when:
    - Quieres conectar OpenClaw a LINE
    - Necesitas configurar el Webhook y las credenciales de LINE
    - Quieres opciones de mensaje específicas de LINE
summary: Preparación, configuración y uso del Plugin de LINE Messaging API
title: LÍNEA
x-i18n:
    generated_at: "2026-05-06T09:02:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: d9d2880bd27e11b72b51ad8a1e8c9e9d41adb51622edf890554594b90d24cd8d
    source_path: channels/line.md
    workflow: 16
---

LINE se conecta a OpenClaw mediante la API de mensajería de LINE. El Plugin se ejecuta como receptor de Webhook
en el Gateway y usa tu token de acceso del canal + secreto del canal para
la autenticación.

Estado: Plugin descargable. Se admiten mensajes directos, chats de grupo, medios, ubicaciones, mensajes Flex,
mensajes de plantilla y respuestas rápidas. No se admiten reacciones ni hilos.

## Instalar

Instala LINE antes de configurar el canal:

```bash
openclaw plugins install @openclaw/line
```

Checkout local (al ejecutar desde un repositorio git):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Configuración

1. Crea una cuenta de LINE Developers y abre la consola:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Crea (o elige) un proveedor y añade un canal de **Messaging API**.
3. Copia el **token de acceso del canal** y el **secreto del canal** desde la configuración del canal.
4. Activa **Usar webhook** en la configuración de Messaging API.
5. Establece la URL del Webhook en tu endpoint del Gateway (se requiere HTTPS):

```
https://gateway-host/line/webhook
```

El Gateway responde a la verificación del Webhook de LINE (GET) y a los eventos entrantes (POST).
Si necesitas una ruta personalizada, establece `channels.line.webhookPath` o
`channels.line.accounts.<id>.webhookPath` y actualiza la URL según corresponda.

Nota de seguridad:

- La verificación de firma de LINE depende del cuerpo (HMAC sobre el cuerpo sin procesar), por lo que OpenClaw aplica límites estrictos del cuerpo previos a la autenticación y tiempo de espera antes de la verificación.
- OpenClaw procesa los eventos de Webhook a partir de los bytes sin procesar verificados de la solicitud. Los valores de `req.body` transformados por middleware anterior se ignoran para proteger la integridad de la firma.

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

Configuración de DM pública:

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

Los mensajes directos usan emparejamiento de forma predeterminada. Los remitentes desconocidos reciben un código de emparejamiento y sus
mensajes se ignoran hasta que se aprueban.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Listas de permitidos y políticas:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: IDs de usuario de LINE permitidos para DM; `dmPolicy: "open"` requiere `["*"]`
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: IDs de usuario de LINE permitidos para grupos
- Sobrescrituras por grupo: `channels.line.groups.<groupId>.allowFrom`
- Nota de ejecución: si falta por completo `channels.line`, el runtime recurre a `groupPolicy="allowlist"` para las comprobaciones de grupo (aunque `channels.defaults.groupPolicy` esté establecido).

Los IDs de LINE distinguen mayúsculas y minúsculas. Los IDs válidos tienen este aspecto:

- Usuario: `U` + 32 caracteres hexadecimales
- Grupo: `C` + 32 caracteres hexadecimales
- Sala: `R` + 32 caracteres hexadecimales

## Comportamiento de los mensajes

- El texto se divide en fragmentos de 5000 caracteres.
- Se elimina el formato Markdown; los bloques de código y las tablas se convierten en tarjetas Flex
  cuando es posible.
- Las respuestas en streaming se almacenan en búfer; LINE recibe fragmentos completos con una animación de carga
  mientras el agente trabaja.
- Las descargas de medios tienen un límite definido por `channels.line.mediaMaxMb` (predeterminado 10).
- Los medios entrantes se guardan en `~/.openclaw/media/inbound/` antes de pasarse
  al agente, coincidiendo con el almacén de medios compartido que usan otros plugins de canal
  incluidos.

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

El Plugin de LINE también incluye un comando `/card` para preajustes de mensajes Flex:

```
/card info "Welcome" "Thanks for joining!"
```

## Compatibilidad con ACP

LINE admite vinculaciones de conversación de ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` vincula el chat actual de LINE a una sesión de ACP sin crear un hilo secundario.
- Las vinculaciones de ACP configuradas y las sesiones de ACP activas vinculadas a conversaciones funcionan en LINE igual que en otros canales de conversación.

Consulta [agentes de ACP](/es/tools/acp-agents) para más detalles.

## Medios salientes

El Plugin de LINE admite enviar imágenes, videos y archivos de audio mediante la herramienta de mensajes del agente. Los medios se envían a través de la ruta de entrega específica de LINE con la gestión adecuada de vista previa y seguimiento:

- **Imágenes**: se envían como mensajes de imagen de LINE con generación automática de vista previa.
- **Videos**: se envían con gestión explícita de vista previa y tipo de contenido.
- **Audio**: se envía como mensajes de audio de LINE.

Las URL de medios salientes deben ser URL HTTPS públicas. OpenClaw valida el nombre de host de destino antes de entregar la URL a LINE y rechaza objetivos de loopback, link-local y redes privadas.

Los envíos de medios genéricos recurren a la ruta existente solo para imágenes cuando no hay una ruta específica de LINE disponible.

## Solución de problemas

- **La verificación del Webhook falla:** asegúrate de que la URL del Webhook use HTTPS y que
  `channelSecret` coincida con la consola de LINE.
- **No hay eventos entrantes:** confirma que la ruta del Webhook coincida con `channels.line.webhookPath`
  y que LINE pueda acceder al Gateway.
- **Errores de descarga de medios:** aumenta `channels.line.mediaMaxMb` si los medios superan el
  límite predeterminado.

## Relacionado

- [Resumen de canales](/es/channels) — todos los canales admitidos
- [Emparejamiento](/es/channels/pairing) — autenticación de DM y flujo de emparejamiento
- [Grupos](/es/channels/groups) — comportamiento de chats de grupo y control por menciones
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y endurecimiento
