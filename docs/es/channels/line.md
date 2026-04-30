---
read_when:
    - Desea conectar OpenClaw a LINE
    - Necesitas configurar el Webhook y las credenciales de LINE
    - Quieres opciones de mensaje específicas de LINE
summary: Instalación, configuración y uso del Plugin de LINE Messaging API
title: LÍNEA
x-i18n:
    generated_at: "2026-04-30T05:28:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: e9f06d882f1e8d2a758e50459fadefd77796a68c28f63bef5790eb1b540c17d1
    source_path: channels/line.md
    workflow: 16
---

LINE se conecta a OpenClaw mediante la API de mensajería de LINE. El Plugin se ejecuta como receptor de Webhook
en el Gateway y usa tu token de acceso de canal + secreto de canal para
la autenticación.

Estado: Plugin incluido. Se admiten mensajes directos, chats grupales, medios, ubicaciones, mensajes Flex,
mensajes de plantilla y respuestas rápidas. No se admiten reacciones ni hilos.

## Plugin incluido

LINE se distribuye como Plugin incluido en las versiones actuales de OpenClaw, por lo que las compilaciones
empaquetadas normales no necesitan una instalación aparte.

Si estás en una compilación anterior o en una instalación personalizada que excluye LINE, instala un
paquete npm actual cuando se publique uno:

```bash
openclaw plugins install @openclaw/line
```

Si npm informa que el paquete propiedad de OpenClaw está obsoleto o falta, usa una
compilación empaquetada actual de OpenClaw o un checkout local hasta que la serie de paquetes npm
se ponga al día.

Checkout local (cuando se ejecuta desde un repositorio git):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Configuración

1. Crea una cuenta de LINE Developers y abre la consola:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Crea (o elige) un proveedor y añade un canal de **API de mensajería**.
3. Copia el **token de acceso del canal** y el **secreto del canal** desde la configuración del canal.
4. Activa **Usar Webhook** en la configuración de la API de mensajería.
5. Configura la URL del Webhook como el endpoint de tu Gateway (se requiere HTTPS):

```
https://gateway-host/line/webhook
```

El Gateway responde a la verificación de Webhook de LINE (GET) y a los eventos entrantes (POST).
Si necesitas una ruta personalizada, configura `channels.line.webhookPath` o
`channels.line.accounts.<id>.webhookPath` y actualiza la URL según corresponda.

Nota de seguridad:

- La verificación de firma de LINE depende del cuerpo (HMAC sobre el cuerpo sin procesar), por lo que OpenClaw aplica límites estrictos del cuerpo antes de la autenticación y un tiempo de espera antes de la verificación.
- OpenClaw procesa los eventos de Webhook desde los bytes sin procesar verificados de la solicitud. Los valores `req.body` transformados por middleware ascendente se ignoran para proteger la integridad de la firma.

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
mensajes se ignoran hasta que se aprueben.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Listas de permitidos y políticas:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: IDs de usuario de LINE permitidos para MD
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: IDs de usuario de LINE permitidos para grupos
- Anulaciones por grupo: `channels.line.groups.<groupId>.allowFrom`
- Nota de tiempo de ejecución: si `channels.line` falta por completo, el tiempo de ejecución recurre a `groupPolicy="allowlist"` para las comprobaciones de grupo (incluso si `channels.defaults.groupPolicy` está configurado).

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
- Las descargas de medios están limitadas por `channels.line.mediaMaxMb` (predeterminado 10).
- Los medios entrantes se guardan en `~/.openclaw/media/inbound/` antes de pasarse
  al agente, de forma coherente con el almacén compartido de medios que usan otros Plugins de canales
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

LINE admite vinculaciones de conversaciones de ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` vincula el chat actual de LINE a una sesión de ACP sin crear un hilo secundario.
- Las vinculaciones de ACP configuradas y las sesiones activas de ACP vinculadas a conversaciones funcionan en LINE igual que en otros canales de conversación.

Consulta [agentes ACP](/es/tools/acp-agents) para obtener más detalles.

## Medios salientes

El Plugin de LINE admite el envío de imágenes, videos y archivos de audio mediante la herramienta de mensajes del agente. Los medios se envían mediante la ruta de entrega específica de LINE con gestión adecuada de vista previa y seguimiento:

- **Imágenes**: se envían como mensajes de imagen de LINE con generación automática de vista previa.
- **Videos**: se envían con gestión explícita de vista previa y tipo de contenido.
- **Audio**: se envían como mensajes de audio de LINE.

Las URL de medios salientes deben ser URL HTTPS públicas. OpenClaw valida el nombre de host de destino antes de entregar la URL a LINE y rechaza destinos local loopback, link-local y de redes privadas.

Los envíos genéricos de medios recurren a la ruta existente solo para imágenes cuando no hay una ruta específica de LINE disponible.

## Solución de problemas

- **Falla la verificación del Webhook:** asegúrate de que la URL del Webhook use HTTPS y que el
  `channelSecret` coincida con la consola de LINE.
- **No hay eventos entrantes:** confirma que la ruta del Webhook coincida con `channels.line.webhookPath`
  y que LINE pueda alcanzar el Gateway.
- **Errores de descarga de medios:** aumenta `channels.line.mediaMaxMb` si los medios superan el
  límite predeterminado.

## Relacionado

- [Resumen de canales](/es/channels) — todos los canales admitidos
- [Emparejamiento](/es/channels/pairing) — autenticación de MD y flujo de emparejamiento
- [Grupos](/es/channels/groups) — comportamiento de chats grupales y control de menciones
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y endurecimiento
