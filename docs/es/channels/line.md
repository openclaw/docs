---
read_when:
    - Quieres conectar OpenClaw con LINE
    - Necesitas configurar el Webhook de LINE y las credenciales
    - Quieres opciones de mensaje específicas de LINE
summary: Instalación, configuración y uso del Plugin de LINE Messaging API
title: LÍNEA
x-i18n:
    generated_at: "2026-05-10T19:22:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7a11edbadda1ec99452eadc19a4557bb594f8b69ebb92314e2c3a0be325ab89d
    source_path: channels/line.md
    workflow: 16
---

LINE se conecta a OpenClaw mediante la LINE Messaging API. El plugin se ejecuta como receptor de Webhook
en el Gateway y usa tu token de acceso del canal + secreto del canal para la
autenticación.

Estado: plugin descargable. Se admiten mensajes directos, chats grupales, medios, ubicaciones, mensajes Flex,
mensajes de plantilla y respuestas rápidas. No se admiten reacciones ni hilos.

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

1. Crea una cuenta de LINE Developers y abre la consola:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Crea (o elige) un proveedor y agrega un canal de **Messaging API**.
3. Copia el **Token de acceso del canal** y el **Secreto del canal** desde la configuración del canal.
4. Habilita **Usar Webhook** en la configuración de Messaging API.
5. Establece la URL del Webhook en el endpoint de tu Gateway (se requiere HTTPS):

```
https://gateway-host/line/webhook
```

El Gateway responde a la verificación del Webhook de LINE (GET) y a los eventos entrantes (POST).
Si necesitas una ruta personalizada, establece `channels.line.webhookPath` o
`channels.line.accounts.<id>.webhookPath` y actualiza la URL según corresponda.

Nota de seguridad:

- La verificación de firma de LINE depende del cuerpo (HMAC sobre el cuerpo sin procesar), por lo que OpenClaw aplica límites estrictos de cuerpo previos a la autenticación y tiempo de espera antes de la verificación.
- OpenClaw procesa los eventos de Webhook desde los bytes sin procesar verificados de la solicitud. Los valores `req.body` transformados por middleware ascendente se ignoran por seguridad de integridad de firma.

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

Configuración de DM públicos:

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

Los mensajes directos usan pairing de forma predeterminada. Los remitentes desconocidos reciben un código de pairing y sus
mensajes se ignoran hasta que se aprueben.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Listas de permitidos y políticas:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: IDs de usuario de LINE permitidos para DM; `dmPolicy: "open"` requiere `["*"]`
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: IDs de usuario de LINE permitidos para grupos
- Overrides por grupo: `channels.line.groups.<groupId>.allowFrom`
- Se puede hacer referencia a grupos estáticos de acceso de remitentes desde `allowFrom`, `groupAllowFrom` y `allowFrom` por grupo con `accessGroup:<name>`.
- Nota de tiempo de ejecución: si `channels.line` falta por completo, el tiempo de ejecución recurre a `groupPolicy="allowlist"` para las comprobaciones de grupo (aunque `channels.defaults.groupPolicy` esté establecido).

Los IDs de LINE distinguen mayúsculas y minúsculas. Los IDs válidos se ven así:

- Usuario: `U` + 32 caracteres hexadecimales
- Grupo: `C` + 32 caracteres hexadecimales
- Sala: `R` + 32 caracteres hexadecimales

## Comportamiento de los mensajes

- El texto se divide en fragmentos de 5000 caracteres.
- Se elimina el formato Markdown; los bloques de código y las tablas se convierten en tarjetas Flex
  cuando es posible.
- Las respuestas en streaming se almacenan en búfer; LINE recibe fragmentos completos con una animación
  de carga mientras el agente trabaja.
- Las descargas de medios están limitadas por `channels.line.mediaMaxMb` (predeterminado 10).
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

El plugin de LINE también incluye un comando `/card` para presets de mensajes Flex:

```
/card info "Welcome" "Thanks for joining!"
```

## Compatibilidad con ACP

LINE admite enlaces de conversación de ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` enlaza el chat actual de LINE a una sesión de ACP sin crear un hilo secundario.
- Los enlaces de ACP configurados y las sesiones de ACP activas enlazadas a conversaciones funcionan en LINE como en otros canales de conversación.

Consulta [Agentes ACP](/es/tools/acp-agents) para obtener más detalles.

## Medios salientes

El plugin de LINE admite el envío de imágenes, videos y archivos de audio mediante la herramienta de mensajes del agente. Los medios se envían mediante la ruta de entrega específica de LINE con el manejo adecuado de vista previa y seguimiento:

- **Imágenes**: se envían como mensajes de imagen de LINE con generación automática de vista previa.
- **Videos**: se envían con manejo explícito de vista previa y tipo de contenido.
- **Audio**: se envían como mensajes de audio de LINE.

Las URL de medios salientes deben ser URL HTTPS públicas. OpenClaw valida el nombre de host de destino antes de entregar la URL a LINE y rechaza destinos de loopback, link-local y redes privadas.

Los envíos de medios genéricos recurren a la ruta existente solo para imágenes cuando no hay una ruta específica de LINE disponible.

## Solución de problemas

- **La verificación del Webhook falla:** asegúrate de que la URL del Webhook use HTTPS y que
  `channelSecret` coincida con la consola de LINE.
- **No hay eventos entrantes:** confirma que la ruta del Webhook coincida con `channels.line.webhookPath`
  y que LINE pueda alcanzar el Gateway.
- **Errores de descarga de medios:** aumenta `channels.line.mediaMaxMb` si los medios superan el
  límite predeterminado.

## Relacionado

- [Descripción general de canales](/es/channels) — todos los canales admitidos
- [Pairing](/es/channels/pairing) — autenticación de DM y flujo de pairing
- [Grupos](/es/channels/groups) — comportamiento de chat grupal y control de menciones
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y hardening
