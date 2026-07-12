---
read_when:
    - Quieres conectar OpenClaw a LINE
    - Necesita configurar el Webhook y las credenciales de LINE
    - Quieres opciones de mensajes específicas de LINE
summary: Configuración, ajustes y uso del plugin de LINE Messaging API
title: LINE
x-i18n:
    generated_at: "2026-07-12T14:18:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: ee5931c2bfca4a67a8b390f300907cd31a074988b10c6c0540444cff0bfde334
    source_path: channels/line.md
    workflow: 16
---

LINE se conecta a OpenClaw mediante la API de mensajería de LINE. El plugin se ejecuta como receptor de Webhook en el Gateway y utiliza el token de acceso al canal y el secreto del canal para la autenticación.

Estado: plugin oficial, instalado por separado. Se admiten mensajes directos, chats grupales, contenido multimedia, ubicaciones, mensajes Flex, mensajes de plantilla y respuestas rápidas. No se admiten reacciones ni hilos.

## Instalación

Instale LINE antes de configurar el canal:

```bash
openclaw plugins install @openclaw/line
```

Copia de trabajo local (cuando se ejecuta desde un repositorio git):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Configuración inicial

1. Cree una cuenta de LINE Developers y abra la consola:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Cree (o seleccione) un Provider y añada un canal de **Messaging API**.
3. Copie **Channel access token** y **Channel secret** desde la configuración del canal.
4. Active **Use webhook** en la configuración de Messaging API.
5. Establezca la URL del Webhook en el punto de conexión de su Gateway (se requiere HTTPS):

```text
https://gateway-host/line/webhook
```

El Gateway responde a la verificación del Webhook de LINE (GET) y confirma los eventos entrantes firmados (POST) inmediatamente después de validar la firma y la carga útil; el procesamiento del agente continúa de forma asíncrona.
Si necesita una ruta personalizada, establezca `channels.line.webhookPath` o
`channels.line.accounts.<id>.webhookPath` y actualice la URL en consecuencia.

Notas de seguridad:

- La verificación de firmas de LINE depende del cuerpo (HMAC sobre el cuerpo sin procesar), por lo que OpenClaw aplica un límite estricto de 64 KB al cuerpo antes de la autenticación y un tiempo de espera de lectura antes de verificarlo.
- OpenClaw procesa los eventos del Webhook a partir de los bytes verificados de la solicitud sin procesar. Los valores de `req.body` transformados por middleware anterior se ignoran para proteger la integridad de la firma.

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
Los valores insertados directamente en la configuración tienen prioridad sobre los archivos; las variables de entorno son el último recurso para la cuenta predeterminada.

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

De forma predeterminada, los mensajes directos requieren emparejamiento. Los remitentes desconocidos reciben un código de emparejamiento y sus mensajes se ignoran hasta que se aprueben:

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Listas de permitidos y políticas:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled` (valor predeterminado: `pairing`)
- `channels.line.allowFrom`: identificadores de usuario de LINE incluidos en la lista de permitidos para mensajes directos; `dmPolicy: "open"` requiere `["*"]`
- `channels.line.groupPolicy`: `allowlist | open | disabled` (valor predeterminado: `allowlist`)
- `channels.line.groupAllowFrom`: identificadores de usuario de LINE incluidos en la lista de permitidos para grupos
- Anulaciones por grupo: `channels.line.groups.<groupId>.allowFrom` (además de `enabled`, `requireMention`, `systemPrompt`, `skills`)
- Se puede hacer referencia a grupos estáticos de acceso de remitentes desde `allowFrom`, `groupAllowFrom` y el valor `allowFrom` por grupo mediante `accessGroup:<name>`; consulte [Grupos de acceso](/es/channels/access-groups).
- Nota de ejecución: si falta por completo `channels.line`, durante la ejecución se utiliza `groupPolicy="allowlist"` como alternativa para las comprobaciones de grupos (aunque se haya establecido `channels.defaults.groupPolicy`).

Los identificadores de LINE distinguen entre mayúsculas y minúsculas. Los identificadores válidos tienen este aspecto:

- Usuario: `U` + 32 caracteres hexadecimales
- Grupo: `C` + 32 caracteres hexadecimales
- Sala: `R` + 32 caracteres hexadecimales

## Comportamiento de los mensajes

- El texto se divide en fragmentos de 5000 caracteres.
- Se elimina el formato Markdown; los bloques de código y las tablas se convierten en tarjetas Flex cuando es posible.
- Las respuestas transmitidas se almacenan en búfer; LINE recibe fragmentos completos con una animación de carga mientras el agente trabaja.
- Las descargas de contenido multimedia están limitadas por `channels.line.mediaMaxMb` (valor predeterminado: 10).
- El contenido multimedia entrante se guarda en `~/.openclaw/media/inbound/` antes de pasarlo al agente, de acuerdo con el almacén multimedia compartido que utilizan otros plugins de canales.

## Datos del canal (mensajes enriquecidos)

Utilice `channelData.line` para enviar respuestas rápidas, ubicaciones, tarjetas Flex o mensajes de plantilla.

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
/card info "Bienvenido" "¡Gracias por unirse!"
```

## Compatibilidad con ACP

LINE admite vinculaciones de conversaciones de ACP (protocolo de comunicación de agentes):

- `/acp spawn <agent> --bind here` vincula el chat actual de LINE a una sesión de ACP sin crear un hilo secundario.
- Las vinculaciones de ACP configuradas y las sesiones activas de ACP vinculadas a conversaciones funcionan en LINE como en otros canales de conversación.

Consulte [Agentes de ACP](/es/tools/acp-agents) para obtener más información.

## Contenido multimedia saliente

El plugin de LINE envía imágenes, vídeos y audio mediante la herramienta de mensajes del agente:

- **Imágenes**: se envían como mensajes de imagen de LINE; la imagen de vista previa utiliza de forma predeterminada la URL del contenido multimedia.
- **Vídeos**: requieren una imagen de vista previa; establezca `channelData.line.previewImageUrl` en una URL de imagen.
- **Audio**: se envía como mensajes de audio de LINE; la duración predeterminada es de 60 segundos, salvo que se establezca `channelData.line.durationMs`.

El tipo de contenido multimedia se obtiene de `channelData.line.mediaKind` cuando está establecido; de lo contrario, se infiere a partir de las demás opciones de LINE o del sufijo de archivo de la URL, utilizando imagen como alternativa.

Las URL de contenido multimedia saliente deben ser URL HTTPS públicas de como máximo 2000 caracteres. OpenClaw valida el nombre de host de destino antes de entregar la URL a LINE y rechaza los destinos de bucle invertido, locales de enlace y de redes privadas.

Los envíos genéricos de contenido multimedia sin opciones específicas de LINE utilizan la ruta de imágenes.

## Solución de problemas

- **Falla la verificación del Webhook:** asegúrese de que la URL del Webhook utilice HTTPS y de que `channelSecret` coincida con la consola de LINE.
- **No hay eventos entrantes:** confirme que la ruta del Webhook coincida con `channels.line.webhookPath` y que LINE pueda acceder al Gateway.
- **Errores al descargar contenido multimedia:** aumente `channels.line.mediaMaxMb` si el contenido multimedia supera el límite predeterminado.

## Temas relacionados

- [Descripción general de los canales](/es/channels) — todos los canales compatibles
- [Emparejamiento](/es/channels/pairing) — autenticación de mensajes directos y flujo de emparejamiento
- [Grupos](/es/channels/groups) — comportamiento de los chats grupales y control mediante menciones
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y refuerzo de seguridad
