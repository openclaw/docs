---
read_when:
    - Quieres conectar OpenClaw a LINE
    - Necesitas configurar el Webhook de LINE y las credenciales
    - Quieres opciones de mensaje específicas de LINE
summary: Configuración, ajustes y uso del plugin LINE Messaging API
title: LINE
x-i18n:
    generated_at: "2026-07-05T11:02:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: abad928180a8b5590ab32a28688531214b78eaee104e6b82f068ae48e2e930f0
    source_path: channels/line.md
    workflow: 16
---

LINE se conecta a OpenClaw mediante la LINE Messaging API. El plugin se ejecuta como
receptor de Webhook en el Gateway y usa tu token de acceso de canal + secreto de canal para
la autenticación.

Estado: plugin oficial, instalado por separado. Se admiten mensajes directos, chats de grupo, medios,
ubicaciones, mensajes Flex, mensajes de plantilla y respuestas rápidas.
No se admiten reacciones ni hilos.

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
2. Crea (o elige) un proveedor y añade un canal de **Messaging API**.
3. Copia el **Channel access token** y el **Channel secret** desde la configuración del canal.
4. Activa **Use webhook** en la configuración de Messaging API.
5. Establece la URL del Webhook en tu endpoint del Gateway (requiere HTTPS):

```text
https://gateway-host/line/webhook
```

El Gateway responde a la verificación de Webhook de LINE (GET) y reconoce los eventos
entrantes firmados (POST) inmediatamente después de validar la firma y la carga útil; el
procesamiento del agente continúa de forma asíncrona.
Si necesitas una ruta personalizada, establece `channels.line.webhookPath` o
`channels.line.accounts.<id>.webhookPath` y actualiza la URL en consecuencia.

Notas de seguridad:

- La verificación de firma de LINE depende del cuerpo (HMAC sobre el cuerpo sin procesar), por lo que OpenClaw aplica un límite estricto de cuerpo previo a la autenticación (64 KB) y un tiempo de espera de lectura antes de la verificación.
- OpenClaw procesa eventos de Webhook desde los bytes sin procesar verificados de la solicitud. Los valores de `req.body` transformados por middleware ascendente se ignoran para proteger la integridad de la firma.

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

Configuración de MD públicos:

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
Los valores de configuración en línea tienen prioridad sobre los archivos; las variables de entorno son el último respaldo para la cuenta predeterminada.

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
mensajes se ignoran hasta que se aprueben:

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Listas de permitidos y políticas:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled` (predeterminado `pairing`)
- `channels.line.allowFrom`: IDs de usuario de LINE permitidos para MD; `dmPolicy: "open"` requiere `["*"]`
- `channels.line.groupPolicy`: `allowlist | open | disabled` (predeterminado `allowlist`)
- `channels.line.groupAllowFrom`: IDs de usuario de LINE permitidos para grupos
- Sustituciones por grupo: `channels.line.groups.<groupId>.allowFrom` (más `enabled`, `requireMention`, `systemPrompt`, `skills`)
- Los grupos estáticos de acceso de remitente pueden referenciarse desde `allowFrom`, `groupAllowFrom` y `allowFrom` por grupo con `accessGroup:<name>`; consulta [Grupos de acceso](/es/channels/access-groups).
- Nota de runtime: si `channels.line` falta por completo, el runtime recurre a `groupPolicy="allowlist"` para las comprobaciones de grupo (incluso si `channels.defaults.groupPolicy` está establecido).

Los IDs de LINE distinguen mayúsculas y minúsculas. Los IDs válidos tienen este aspecto:

- Usuario: `U` + 32 caracteres hexadecimales
- Grupo: `C` + 32 caracteres hexadecimales
- Sala: `R` + 32 caracteres hexadecimales

## Comportamiento de mensajes

- El texto se divide en fragmentos de 5000 caracteres.
- Se elimina el formato Markdown; los bloques de código y las tablas se convierten en tarjetas Flex
  cuando es posible.
- Las respuestas en streaming se almacenan en búfer; LINE recibe fragmentos completos con una animación
  de carga mientras el agente trabaja.
- Las descargas de medios están limitadas por `channels.line.mediaMaxMb` (predeterminado 10).
- Los medios entrantes se guardan en `~/.openclaw/media/inbound/` antes de pasarse
  al agente, coincidiendo con el almacén de medios compartido que usan otros plugins de canal.

## Datos de canal (mensajes enriquecidos)

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

El plugin de LINE también incluye un comando `/card` para preajustes de mensajes Flex:

```text
/card info "Welcome" "Thanks for joining!"
```

## Compatibilidad con ACP

LINE admite vinculaciones de conversación de ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` vincula el chat actual de LINE a una sesión de ACP sin crear un hilo hijo.
- Las vinculaciones de ACP configuradas y las sesiones de ACP activas vinculadas a conversación funcionan en LINE como en otros canales de conversación.

Consulta [Agentes ACP](/es/tools/acp-agents) para obtener más detalles.

## Medios salientes

El plugin de LINE envía imágenes, videos y audio mediante la herramienta de mensajes del agente:

- **Imágenes**: se envían como mensajes de imagen de LINE; la imagen de vista previa usa de forma predeterminada la URL del medio.
- **Videos**: requieren una imagen de vista previa; establece `channelData.line.previewImageUrl` en una URL de imagen.
- **Audio**: se envía como mensajes de audio de LINE; la duración predeterminada es de 60 segundos salvo que `channelData.line.durationMs` esté establecido.

El tipo de medio se toma de `channelData.line.mediaKind` cuando está establecido; de lo contrario, se infiere
a partir de las demás opciones de LINE o del sufijo de archivo de la URL, con imagen como respaldo.

Las URL de medios salientes deben ser URL HTTPS públicas de 2000 caracteres como máximo. OpenClaw
valida el nombre de host de destino antes de entregar la URL a LINE y rechaza destinos loopback,
link-local y de redes privadas.

Los envíos de medios genéricos sin opciones específicas de LINE usan la ruta de imagen.

## Solución de problemas

- **Falla la verificación de Webhook:** asegúrate de que la URL del Webhook use HTTPS y de que
  `channelSecret` coincida con la consola de LINE.
- **No hay eventos entrantes:** confirma que la ruta del Webhook coincida con `channels.line.webhookPath`
  y que LINE pueda acceder al Gateway.
- **Errores de descarga de medios:** aumenta `channels.line.mediaMaxMb` si los medios superan el
  límite predeterminado.

## Relacionado

- [Resumen de canales](/es/channels) — todos los canales admitidos
- [Emparejamiento](/es/channels/pairing) — autenticación de MD y flujo de emparejamiento
- [Grupos](/es/channels/groups) — comportamiento de chat de grupo y control por menciones
- [Enrutamiento de canal](/es/channels/channel-routing) — enrutamiento de sesión para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y endurecimiento
