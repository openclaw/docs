---
read_when:
    - Quieres conectar OpenClaw a LINE
    - Necesita configurar el Webhook de LINE y las credenciales
    - Quieres opciones de mensajes específicas de LINE
summary: Configuración, ajustes y uso del Plugin de la API de mensajería de LINE
title: LINE
x-i18n:
    generated_at: "2026-07-19T01:47:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: aa160970278e0899637307136139f7d2fc83bf57defc30771d77649060f77274
    source_path: channels/line.md
    workflow: 16
---

LINE se conecta a OpenClaw mediante la API de mensajería de LINE. El plugin se ejecuta como receptor de Webhook
en el Gateway y utiliza el token de acceso al canal y el secreto del canal para la
autenticación.

Estado: plugin oficial, instalado por separado. Se admiten mensajes directos, chats grupales, contenido multimedia,
ubicaciones, mensajes Flex, mensajes de plantilla y respuestas rápidas.
No se admiten reacciones ni hilos.

## Instalación

Instale LINE antes de configurar el canal:

```bash
openclaw plugins install @openclaw/line
```

Checkout local (cuando se ejecuta desde un repositorio git):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Configuración inicial

1. Cree una cuenta de LINE Developers y abra la Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Cree (o seleccione) un Provider y añada un canal de **Messaging API**.
3. Copie el **Channel access token** y el **Channel secret** desde la configuración del canal.
4. Active **Use webhook** en la configuración de Messaging API.
5. Establezca como URL del Webhook el endpoint del Gateway (se requiere HTTPS):

```text
https://gateway-host/line/webhook
```

El Gateway responde a la verificación del Webhook de LINE (GET). Para los eventos entrantes firmados
(POST), escribe cada evento en la cola de entrada duradera antes de devolver `200`;
el procesamiento del agente continúa de forma asíncrona. Los envíos fallidos se reintentan desde la
cola, incluso después de reiniciar el Gateway, y los eventos problemáticos se convierten en registros
de cola fallidos tras un número limitado de reintentos. Si falla la persistencia duradera, la solicitud devuelve
`500` en lugar de confirmar un evento que podría perderse.
La entrega se realiza al menos una vez en el límite entre la cola y el agente: si el Gateway se apaga o
falla durante una entrega activa, el turno puede volver a procesarse. Los eventos de mensaje se deduplican por
el ID de mensaje de LINE; otros tipos de eventos utilizan `webhookEventId`. Los registros de finalización conservados
suprimen los Webhooks duplicados normales, pero los controladores que realizan efectos secundarios externos
deben seguir siendo idempotentes.
Si se necesita una ruta personalizada, configure `channels.line.webhookPath` o
`channels.line.accounts.<id>.webhookPath` y actualice la URL en consecuencia.

Notas de seguridad:

- La verificación de firmas de LINE depende del cuerpo (HMAC sobre el cuerpo sin procesar), por lo que OpenClaw aplica un límite estricto del cuerpo previo a la autenticación (64 KB) y un tiempo de espera de lectura antes de la verificación.
- OpenClaw procesa los eventos del Webhook a partir de los bytes verificados de la solicitud sin procesar. Los valores `req.body` transformados por middleware ascendente se ignoran para proteger la integridad de la firma.

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

Configuración pública de mensajes directos:

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

`tokenFile` y `secretFile` deben apuntar a archivos normales. Los enlaces simbólicos se rechazan.
Los valores de configuración insertados directamente tienen prioridad sobre los archivos; las variables de entorno son el último recurso para la cuenta predeterminada.

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

Los mensajes directos utilizan el emparejamiento de forma predeterminada. Los remitentes desconocidos reciben un código de emparejamiento y sus
mensajes se ignoran hasta que sean aprobados:

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Listas de permitidos y políticas:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled` (valor predeterminado: `pairing`)
- `channels.line.allowFrom`: ID de usuario de LINE permitidos para mensajes directos; `dmPolicy: "open"` requiere `["*"]`
- `channels.line.groupPolicy`: `allowlist | open | disabled` (valor predeterminado: `allowlist`)
- `channels.line.groupAllowFrom`: ID de usuario de LINE permitidos para grupos; las entradas `allowFrom` de mensajes directos no admiten remitentes de grupos
- Anulaciones por grupo: `channels.line.groups.<groupId>.allowFrom` (además de `enabled`, `requireMention`, `systemPrompt`, `skills`). Con
  `groupPolicy: "allowlist"`, configure `groupAllowFrom` o el valor `allowFrom` por grupo; una lista de permitidos del grupo vacía bloquea los mensajes grupales incluso cuando los mensajes directos están abiertos.
- Se puede hacer referencia a grupos estáticos de acceso de remitentes desde `allowFrom`, `groupAllowFrom` y el valor `allowFrom` por grupo mediante `accessGroup:<name>`; consulte [Grupos de acceso](/es/channels/access-groups).
- Nota de ejecución: si `channels.line` no está presente en absoluto, durante la ejecución se recurre a `groupPolicy="allowlist"` para las comprobaciones de grupos (incluso si se ha configurado `channels.defaults.groupPolicy`).

Los ID de LINE distinguen entre mayúsculas y minúsculas. Los ID válidos tienen este aspecto:

- Usuario: `U` + 32 caracteres hexadecimales
- Grupo: `C` + 32 caracteres hexadecimales
- Sala: `R` + 32 caracteres hexadecimales

## Comportamiento de los mensajes

- El texto se divide en fragmentos de 5000 caracteres.
- Se elimina el formato Markdown; los bloques de código y las tablas se convierten en tarjetas Flex
  cuando es posible.
- Las respuestas en streaming se almacenan en búfer; LINE recibe fragmentos completos con una animación
  de carga mientras el agente trabaja.
- Las descargas de contenido multimedia están limitadas por `channels.line.mediaMaxMb` (valor predeterminado: 10).
- El contenido multimedia entrante se guarda en `~/.openclaw/media/inbound/` antes de transferirse
  al agente, de acuerdo con el almacén multimedia compartido que utilizan otros plugins de canales.

## Datos del canal (mensajes enriquecidos)

Utilice `channelData.line` para enviar respuestas rápidas, ubicaciones, tarjetas Flex o mensajes
de plantilla.

```json5
{
  text: "Aquí tiene",
  channelData: {
    line: {
      quickReplies: ["Estado", "Ayuda"],
      location: {
        title: "Oficina",
        address: "123 Main St",
        latitude: 35.681236,
        longitude: 139.767125,
      },
      flexMessage: {
        altText: "Tarjeta de estado",
        contents: {/* Carga útil Flex */},
      },
      templateMessage: {
        type: "confirm",
        text: "¿Desea continuar?",
        confirmLabel: "Sí",
        confirmData: "yes",
        cancelLabel: "No",
        cancelData: "no",
      },
    },
  },
}
```

El plugin de LINE también incluye un comando `/card` para valores preestablecidos de mensajes Flex:

```text
/card info "Bienvenido" "¡Gracias por unirse!"
```

## Compatibilidad con ACP

LINE admite vinculaciones de conversaciones de ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` vincula el chat actual de LINE con una sesión de ACP sin crear un hilo secundario.
- Las vinculaciones de ACP configuradas y las sesiones de ACP activas vinculadas a conversaciones funcionan en LINE igual que en otros canales de conversación.

Consulte [Agentes ACP](/es/tools/acp-agents) para obtener más información.

## Contenido multimedia saliente

El plugin de LINE envía imágenes, vídeos y audio mediante la herramienta de mensajes del agente:

- **Imágenes**: se envían como mensajes de imagen de LINE; la imagen de vista previa utiliza de forma predeterminada la URL del contenido multimedia.
- **Vídeos**: requieren una imagen de vista previa; configure `channelData.line.previewImageUrl` con la URL de una imagen.
- **Audio**: se envía como mensajes de audio de LINE; la duración predeterminada es de 60 segundos, a menos que se configure `channelData.line.durationMs`.

El tipo de contenido multimedia se obtiene de `channelData.line.mediaKind` cuando está configurado; de lo contrario, se infiere
a partir de las demás opciones de LINE o del sufijo de archivo de la URL, con imagen como opción alternativa.

Las URL de contenido multimedia saliente deben ser URL HTTPS públicas de como máximo 2000 caracteres. OpenClaw
valida el nombre de host de destino antes de entregar la URL a LINE y rechaza los destinos de bucle local,
enlace local y redes privadas.

Los envíos genéricos de contenido multimedia sin opciones específicas de LINE utilizan la ruta de imágenes.

## Solución de problemas

- **Falla la verificación del Webhook:** asegúrese de que la URL del Webhook use HTTPS y de que
  `channelSecret` coincida con la consola de LINE.
- **No hay eventos entrantes:** confirme que la ruta del Webhook coincida con `channels.line.webhookPath`
  y que LINE pueda acceder al Gateway.
- **Errores de descarga de contenido multimedia:** aumente `channels.line.mediaMaxMb` si el contenido multimedia supera el
  límite predeterminado.

## Temas relacionados

- [Descripción general de los canales](/es/channels) — todos los canales admitidos
- [Emparejamiento](/es/channels/pairing) — autenticación de mensajes directos y flujo de emparejamiento
- [Grupos](/es/channels/groups) — comportamiento de los chats grupales y control mediante menciones
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y protección
