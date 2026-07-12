---
read_when:
    - Quieres conectar OpenClaw con LINE
    - Necesitas configurar el Webhook y las credenciales de LINE
    - Quieres opciones de mensajes específicas de LINE
summary: Configuración, ajustes y uso del Plugin de LINE Messaging API
title: LINE
x-i18n:
    generated_at: "2026-07-11T22:53:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ee5931c2bfca4a67a8b390f300907cd31a074988b10c6c0540444cff0bfde334
    source_path: channels/line.md
    workflow: 16
---

LINE se conecta a OpenClaw mediante la API de mensajería de LINE. El plugin funciona como receptor de Webhooks en el Gateway y utiliza el token de acceso del canal y el secreto del canal para la autenticación.

Estado: plugin oficial, instalado por separado. Se admiten mensajes directos, chats grupales, contenido multimedia, ubicaciones, mensajes Flex, mensajes de plantilla y respuestas rápidas.
No se admiten reacciones ni hilos.

## Instalación

Instala LINE antes de configurar el canal:

```bash
openclaw plugins install @openclaw/line
```

Copia de trabajo local (cuando se ejecuta desde un repositorio git):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Configuración inicial

1. Crea una cuenta de LINE Developers y abre la consola:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Crea (o elige) un proveedor y añade un canal de **Messaging API**.
3. Copia **Channel access token** y **Channel secret** desde la configuración del canal.
4. Activa **Use webhook** en la configuración de Messaging API.
5. Establece la URL del Webhook en el endpoint de tu Gateway (se requiere HTTPS):

```text
https://gateway-host/line/webhook
```

El Gateway responde a la verificación del Webhook de LINE (GET) y confirma los eventos entrantes firmados (POST) inmediatamente después de validar la firma y la carga útil; el procesamiento del agente continúa de forma asíncrona.
Si necesitas una ruta personalizada, establece `channels.line.webhookPath` o
`channels.line.accounts.<id>.webhookPath` y actualiza la URL según corresponda.

Notas de seguridad:

- La verificación de firmas de LINE depende del cuerpo (HMAC sobre el cuerpo sin procesar), por lo que OpenClaw aplica un límite estricto al cuerpo antes de la autenticación (64 KB) y un tiempo de espera de lectura antes de verificarlo.
- OpenClaw procesa los eventos de Webhook a partir de los bytes verificados de la solicitud sin procesar. Los valores de `req.body` transformados por middleware anterior se ignoran para proteger la integridad de la firma.

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

Configuración de mensajes directos públicos:

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

Variables de entorno (solo para la cuenta predeterminada):

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

Archivos de token y secreto:

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
Los valores de configuración en línea tienen prioridad sobre los archivos; las variables de entorno son el último recurso para la cuenta predeterminada.

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

De forma predeterminada, los mensajes directos requieren emparejamiento. Los remitentes desconocidos reciben un código de emparejamiento y sus mensajes se ignoran hasta que sean aprobados:

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Listas de permitidos y políticas:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled` (valor predeterminado: `pairing`)
- `channels.line.allowFrom`: identificadores de usuario de LINE permitidos para mensajes directos; `dmPolicy: "open"` requiere `["*"]`
- `channels.line.groupPolicy`: `allowlist | open | disabled` (valor predeterminado: `allowlist`)
- `channels.line.groupAllowFrom`: identificadores de usuario de LINE permitidos para grupos
- Sustituciones por grupo: `channels.line.groups.<groupId>.allowFrom` (además de `enabled`, `requireMention`, `systemPrompt`, `skills`)
- Los grupos estáticos de acceso de remitentes pueden referenciarse desde `allowFrom`, `groupAllowFrom` y el valor `allowFrom` de cada grupo mediante `accessGroup:<name>`; consulta [Grupos de acceso](/es/channels/access-groups).
- Nota sobre el entorno de ejecución: si falta por completo `channels.line`, el entorno de ejecución usa `groupPolicy="allowlist"` como alternativa para las comprobaciones de grupos (incluso si se ha establecido `channels.defaults.groupPolicy`).

Los identificadores de LINE distinguen entre mayúsculas y minúsculas. Los identificadores válidos tienen este aspecto:

- Usuario: `U` + 32 caracteres hexadecimales
- Grupo: `C` + 32 caracteres hexadecimales
- Sala: `R` + 32 caracteres hexadecimales

## Comportamiento de los mensajes

- El texto se divide en fragmentos de 5000 caracteres.
- Se elimina el formato Markdown; los bloques de código y las tablas se convierten en tarjetas Flex cuando es posible.
- Las respuestas en streaming se almacenan en búfer; LINE recibe fragmentos completos con una animación de carga mientras el agente trabaja.
- Las descargas de contenido multimedia están limitadas por `channels.line.mediaMaxMb` (valor predeterminado: 10).
- El contenido multimedia entrante se guarda en `~/.openclaw/media/inbound/` antes de pasarlo al agente, de acuerdo con el almacenamiento multimedia compartido que utilizan otros plugins de canales.

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
        contents: {/* Flex payload */},
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

El plugin de LINE también incluye un comando `/card` para ajustes preestablecidos de mensajes Flex:

```text
/card info "Welcome" "Thanks for joining!"
```

## Compatibilidad con ACP

LINE admite vinculaciones de conversaciones de ACP (Protocolo de comunicación entre agentes):

- `/acp spawn <agent> --bind here` vincula el chat actual de LINE a una sesión de ACP sin crear un hilo secundario.
- Las vinculaciones de ACP configuradas y las sesiones de ACP activas vinculadas a conversaciones funcionan en LINE igual que en otros canales de conversación.

Consulta [Agentes de ACP](/es/tools/acp-agents) para obtener más información.

## Contenido multimedia saliente

El plugin de LINE envía imágenes, vídeos y audio mediante la herramienta de mensajes del agente:

- **Imágenes**: se envían como mensajes de imagen de LINE; la imagen de vista previa usa de forma predeterminada la URL del contenido multimedia.
- **Vídeos**: requieren una imagen de vista previa; establece `channelData.line.previewImageUrl` en la URL de una imagen.
- **Audio**: se envía como mensajes de audio de LINE; la duración predeterminada es de 60 segundos, salvo que se establezca `channelData.line.durationMs`.

El tipo de contenido multimedia se obtiene de `channelData.line.mediaKind` cuando está establecido; de lo contrario, se deduce de las demás opciones de LINE o del sufijo de archivo de la URL, y se utiliza imagen como alternativa predeterminada.

Las URL de contenido multimedia saliente deben ser URL HTTPS públicas de un máximo de 2000 caracteres. OpenClaw valida el nombre de host de destino antes de proporcionar la URL a LINE y rechaza destinos de local loopback, vínculo local y redes privadas.

Los envíos genéricos de contenido multimedia sin opciones específicas de LINE utilizan la ruta de imágenes.

## Solución de problemas

- **La verificación del Webhook falla:** asegúrate de que la URL del Webhook use HTTPS y de que `channelSecret` coincida con el de la consola de LINE.
- **No hay eventos entrantes:** confirma que la ruta del Webhook coincida con `channels.line.webhookPath` y que LINE pueda acceder al Gateway.
- **Errores al descargar contenido multimedia:** aumenta `channels.line.mediaMaxMb` si el contenido multimedia supera el límite predeterminado.

## Temas relacionados

- [Descripción general de los canales](/es/channels) — todos los canales compatibles
- [Emparejamiento](/es/channels/pairing) — autenticación de mensajes directos y flujo de emparejamiento
- [Grupos](/es/channels/groups) — comportamiento de los chats grupales y control por menciones
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y refuerzo de seguridad
