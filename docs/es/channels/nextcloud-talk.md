---
read_when:
    - Trabajo en las funciones del canal Nextcloud Talk
summary: Estado de compatibilidad, capacidades y configuración de Nextcloud Talk
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-07-14T13:27:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 59f4fe51555bcb13d630140866307b1a49ba077059818ec116ee50ef0c877b2b
    source_path: channels/nextcloud-talk.md
    workflow: 16
---

Nextcloud Talk es un plugin de canal descargable (`@openclaw/nextcloud-talk`) que conecta OpenClaw con una instancia de Nextcloud autoalojada mediante un bot Webhook de Talk. Se admiten mensajes directos, salas, reacciones y mensajes en Markdown; los archivos multimedia se envían como URL.

## Instalación

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

Use la especificación simple del paquete para seguir la etiqueta de la versión oficial actual. Fije una versión exacta solo cuando necesite una instalación reproducible.

Desde una copia de trabajo local (flujos de desarrollo):

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

Reinicie el Gateway después de la instalación. Detalles: [Plugins](/es/tools/plugin)

## Configuración rápida (principiantes)

1. Instale el plugin (como se indicó anteriormente).
2. En el servidor de Nextcloud, cree un bot:

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature webhook --feature response --feature reaction
   ```

   Mantenga `--feature response`: sin esta opción, las respuestas salientes fallan con un error 401. Repare un bot existente con `./occ talk:bot:state --feature webhook --feature response --feature reaction <botId> 1`.

3. Active el bot en la configuración de la sala de destino.
4. Configure OpenClaw:
   - Configuración: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - O mediante variables de entorno: `NEXTCLOUD_TALK_BOT_SECRET` (solo para la cuenta predeterminada)

   Configuración mediante la CLI (`--url`/`--token` son alias de los campos explícitos; `nc-talk` y `nc` funcionan como alias del canal):

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --url https://cloud.example.com \
     --token "<shared-secret>"
   ```

   Campos explícitos equivalentes:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret "<shared-secret>"
   ```

   Secreto almacenado en un archivo:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret-file /path/to/nextcloud-talk-secret
   ```

5. Reinicie el Gateway (o finalice la configuración).

Configuración mínima:

```json5
{
  channels: {
    "nextcloud-talk": {
      enabled: true,
      baseUrl: "https://cloud.example.com",
      botSecret: "shared-secret",
      dmPolicy: "pairing",
    },
  },
}
```

## Notas

- Los bots no pueden iniciar mensajes directos. El usuario debe enviar primero un mensaje al bot.
- La URL del Webhook debe ser accesible desde el servidor de Nextcloud; establezca `webhookPublicUrl` cuando el Gateway esté detrás de un proxy. Las solicitudes del Webhook se firman mediante HMAC-SHA256 con el secreto del bot; las firmas no válidas se rechazan y se someten a limitación de frecuencia.
- La API del bot no admite la carga de archivos multimedia; los archivos multimedia salientes se añaden como una línea `Attachment: <url>`.
- La carga útil del Webhook no distingue los mensajes directos de las salas; establezca `apiUser` + `apiPassword` para activar las consultas del tipo de sala (almacenadas en caché durante unos 5 minutos). Sin estas opciones, todas las conversaciones se tratan como salas.
- Las solicitudes salientes pasan por la protección contra SSRF. Para un host de Nextcloud en una red privada/interna de confianza, habilite esta opción con `channels.nextcloud-talk.network.dangerouslyAllowPrivateNetwork: true`.
- Con `apiUser`/`apiPassword` y `webhookPublicUrl` configurados, `openclaw channels status` sondea el bot y muestra una advertencia cuando falta la función `response`.

## Control de acceso (mensajes directos)

- Valor predeterminado: `channels.nextcloud-talk.dmPolicy = "pairing"`. Los remitentes desconocidos reciben un código de emparejamiento.
- Apruebe mediante:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- Mensajes directos públicos: `channels.nextcloud-talk.dmPolicy="open"` junto con `channels.nextcloud-talk.allowFrom=["*"]`.
- `allowFrom` solo coincide con los ID de usuario de Nextcloud (en minúsculas); los nombres para mostrar se ignoran.

## Salas (grupos)

- Valor predeterminado: `channels.nextcloud-talk.groupPolicy = "allowlist"` (requiere una mención).
- Añada salas a la lista de permitidas con `channels.nextcloud-talk.rooms`, usando el token de la sala como clave; `"*"` establece un valor predeterminado comodín:

```json5
{
  channels: {
    "nextcloud-talk": {
      rooms: {
        "room-token": { requireMention: true },
      },
    },
  },
}
```

- Claves por sala: `requireMention` (true de forma predeterminada), `enabled` (false desactiva la sala), `allowFrom` (lista de remitentes permitidos por sala), `tools` (anulaciones de herramientas permitidas/denegadas), `skills` (limita las Skills cargadas), `systemPrompt`.
- Para no permitir ninguna sala, mantenga vacía la lista de permitidas o establezca `channels.nextcloud-talk.groupPolicy="disabled"`.

## Capacidades

| Función           | Estado       |
| ----------------- | ------------ |
| Mensajes directos | Compatible   |
| Salas             | Compatible   |
| Hilos             | No compatible |
| Archivos multimedia | Solo mediante URL |
| Reacciones        | Compatible   |
| Comandos nativos  | No compatible |

## Referencia de configuración (Nextcloud Talk)

Configuración completa: [Configuración](/es/gateway/configuration)

Opciones del proveedor:

- `channels.nextcloud-talk.enabled`: activa o desactiva el inicio del canal.
- `channels.nextcloud-talk.baseUrl`: URL de la instancia de Nextcloud.
- `channels.nextcloud-talk.botSecret`: secreto compartido del bot (cadena o referencia a un secreto).
- `channels.nextcloud-talk.botSecretFile`: ruta del secreto en un archivo normal. Se rechazan los enlaces simbólicos.
- `channels.nextcloud-talk.apiUser`: usuario de la API para las consultas de salas (detección de mensajes directos) y el sondeo de estado.
- `channels.nextcloud-talk.apiPassword`: contraseña de la API/aplicación para las consultas de salas.
- `channels.nextcloud-talk.apiPasswordFile`: ruta del archivo de contraseña de la API.
- `channels.nextcloud-talk.webhookPort`: puerto del receptor del Webhook (valor predeterminado: 8788).
- `channels.nextcloud-talk.webhookHost`: host del Webhook (valor predeterminado: 0.0.0.0).
- `channels.nextcloud-talk.webhookPath`: ruta del Webhook (valor predeterminado: /nextcloud-talk-webhook).
- `channels.nextcloud-talk.webhookPublicUrl`: URL del Webhook accesible externamente.
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled` (valor predeterminado: pairing). `open` requiere `allowFrom=["*"]`.
- `channels.nextcloud-talk.allowFrom`: lista de mensajes directos permitidos (ID de usuario).
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled` (valor predeterminado: allowlist).
- `channels.nextcloud-talk.groupAllowFrom`: lista de remitentes permitidos en salas (ID de usuario); utiliza `allowFrom` como alternativa cuando no se establece.
- `channels.nextcloud-talk.rooms`: configuración y lista de permitidos por sala (consulte la sección anterior).
- Se puede hacer referencia a grupos estáticos de acceso de remitentes desde `allowFrom` y `groupAllowFrom` mediante `accessGroup:<name>`.
- `channels.nextcloud-talk.historyLimit`: límite del historial del grupo (0 lo desactiva).
- `channels.nextcloud-talk.dmHistoryLimit`: límite del historial de mensajes directos (0 lo desactiva).
- `channels.nextcloud-talk.dms`: anulaciones por mensaje directo, indexadas por ID de usuario (`historyLimit`).
- `channels.nextcloud-talk.textChunkLimit`: tamaño de los fragmentos de texto saliente en caracteres (valor predeterminado: 4000).
- `channels.nextcloud-talk.streaming.chunkMode`: `length` (valor predeterminado) o `newline` para dividir por líneas en blanco (límites de párrafo) antes de fragmentar por longitud.
- `channels.nextcloud-talk.streaming.block.enabled`: activa o desactiva la transmisión por bloques para este canal.
- `channels.nextcloud-talk.streaming.block.coalesce`: ajuste de combinación de la transmisión por bloques.
- `channels.nextcloud-talk.responsePrefix`: prefijo de las respuestas salientes.
- `channels.nextcloud-talk.markdown.tables`: modo de representación de tablas de Markdown (`off | bullets | code | block`).
- `channels.nextcloud-talk.mediaMaxMb`: límite de archivos multimedia entrantes (MB).
- `channels.nextcloud-talk.network.dangerouslyAllowPrivateNetwork`: permite que los hosts privados/internos de Nextcloud superen la protección contra SSRF.
- `channels.nextcloud-talk.accounts.<id>`: anulaciones por cuenta (las mismas claves); `defaultAccount` selecciona el valor predeterminado. Las variables de entorno `NEXTCLOUD_TALK_BOT_SECRET` / `NEXTCLOUD_TALK_API_PASSWORD` solo se aplican a la cuenta predeterminada.

## Recursos relacionados

- [Descripción general de los canales](/es/channels) — todos los canales compatibles
- [Emparejamiento](/es/channels/pairing) — autenticación de mensajes directos y flujo de emparejamiento
- [Grupos](/es/channels/groups) — comportamiento de los chats grupales y requisito de menciones
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y refuerzo de la seguridad
