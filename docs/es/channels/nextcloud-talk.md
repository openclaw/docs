---
read_when:
    - Trabajando en funciones del canal Nextcloud Talk
summary: Estado de soporte, capacidades y configuración de Nextcloud Talk
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-07-05T11:02:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 234981d21df12eafabfef60822f2a145d37257689511efc6104451a735346d09
    source_path: channels/nextcloud-talk.md
    workflow: 16
---

Nextcloud Talk es un plugin de canal descargable (`@openclaw/nextcloud-talk`) que conecta OpenClaw con una instancia de Nextcloud autoalojada mediante un bot de webhook de Talk. Se admiten mensajes directos, salas, reacciones y mensajes markdown; los medios se envían como URL.

## Instalación

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

Usa la especificación de paquete básica para seguir la etiqueta de versión oficial actual. Fija una versión exacta solo cuando necesites una instalación reproducible.

Desde un checkout local (flujos de trabajo de desarrollo):

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

Reinicia el gateway después de la instalación. Detalles: [Plugins](/es/tools/plugin)

## Configuración rápida (principiantes)

1. Instala el plugin (arriba).
2. En tu servidor Nextcloud, crea un bot:

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature webhook --feature response --feature reaction
   ```

   Mantén `--feature response`: sin eso, las respuestas salientes fallan con 401. Repara un bot existente con `./occ talk:bot:state --feature webhook --feature response --feature reaction <botId> 1`.

3. Habilita el bot en la configuración de la sala de destino.
4. Configura OpenClaw:
   - Configuración: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - O env: `NEXTCLOUD_TALK_BOT_SECRET` (solo cuenta predeterminada)

   Configuración por CLI (`--url`/`--token` son alias de los campos explícitos; `nc-talk` y `nc` funcionan como alias de canal):

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

   Secreto respaldado por archivo:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret-file /path/to/nextcloud-talk-secret
   ```

5. Reinicia el gateway (o finaliza la configuración).

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

- Los bots no pueden iniciar MD. El usuario debe enviar primero un mensaje al bot.
- La URL del webhook debe ser accesible desde el servidor Nextcloud; configura `webhookPublicUrl` cuando el gateway esté detrás de un proxy. Las solicitudes de Webhook se firman con HMAC-SHA256 usando el secreto del bot; las firmas no válidas se rechazan y se limitan por tasa.
- La API del bot no admite cargas de medios; los medios salientes se agregan como una línea `Attachment: <url>`.
- La carga útil del webhook no distingue los MD de las salas; configura `apiUser` + `apiPassword` para habilitar búsquedas de tipo de sala (almacenadas en caché unos 5 minutos). Sin ellos, cada conversación se trata como una sala.
- Las solicitudes salientes pasan por la protección SSRF. Para un host Nextcloud en una red privada/interna de confianza, actívalo con `channels.nextcloud-talk.network.dangerouslyAllowPrivateNetwork: true`.
- Con `apiUser`/`apiPassword` y `webhookPublicUrl` configurados, `openclaw channels status` comprueba el bot y advierte cuando falta la característica `response`.

## Control de acceso (MD)

- Predeterminado: `channels.nextcloud-talk.dmPolicy = "pairing"`. Los remitentes desconocidos reciben un código de emparejamiento.
- Aprobar mediante:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- MD públicos: `channels.nextcloud-talk.dmPolicy="open"` más `channels.nextcloud-talk.allowFrom=["*"]`.
- `allowFrom` coincide solo con los ID de usuario de Nextcloud (en minúsculas); los nombres para mostrar se ignoran.

## Salas (grupos)

- Predeterminado: `channels.nextcloud-talk.groupPolicy = "allowlist"` (protegido por menciones).
- Permite salas con `channels.nextcloud-talk.rooms`, indexadas por token de sala; `"*"` establece un valor predeterminado comodín:

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

- Claves por sala: `requireMention` (predeterminado true), `enabled` (false deshabilita la sala), `allowFrom` (lista de permitidos de remitentes por sala), `tools` (anulaciones para permitir/denegar herramientas), `skills` (limita las Skills cargadas), `systemPrompt`.
- Para no permitir ninguna sala, mantén la lista de permitidos vacía o configura `channels.nextcloud-talk.groupPolicy="disabled"`.

## Capacidades

| Característica   | Estado         |
| --------------- | ------------- |
| Mensajes directos | Admitido       |
| Salas           | Admitido       |
| Hilos           | No admitido    |
| Medios          | Solo URL       |
| Reacciones      | Admitido       |
| Comandos nativos | No admitido    |

## Referencia de configuración (Nextcloud Talk)

Configuración completa: [Configuración](/es/gateway/configuration)

Opciones del proveedor:

- `channels.nextcloud-talk.enabled`: habilita/deshabilita el inicio del canal.
- `channels.nextcloud-talk.baseUrl`: URL de la instancia de Nextcloud.
- `channels.nextcloud-talk.botSecret`: secreto compartido del bot (cadena o referencia secreta).
- `channels.nextcloud-talk.botSecretFile`: ruta de secreto de archivo regular. Los enlaces simbólicos se rechazan.
- `channels.nextcloud-talk.apiUser`: usuario de API para búsquedas de salas (detección de MD) y la comprobación de estado.
- `channels.nextcloud-talk.apiPassword`: contraseña de API/app para búsquedas de salas.
- `channels.nextcloud-talk.apiPasswordFile`: ruta del archivo de contraseña de API.
- `channels.nextcloud-talk.webhookPort`: puerto del listener de webhook (predeterminado: 8788).
- `channels.nextcloud-talk.webhookHost`: host del webhook (predeterminado: 0.0.0.0).
- `channels.nextcloud-talk.webhookPath`: ruta del webhook (predeterminado: /nextcloud-talk-webhook).
- `channels.nextcloud-talk.webhookPublicUrl`: URL de webhook accesible externamente.
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled` (predeterminado: pairing). `open` requiere `allowFrom=["*"]`.
- `channels.nextcloud-talk.allowFrom`: lista de permitidos de MD (ID de usuario).
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled` (predeterminado: allowlist).
- `channels.nextcloud-talk.groupAllowFrom`: lista de permitidos de remitentes de sala (ID de usuario); recurre a `allowFrom` cuando no está configurado.
- `channels.nextcloud-talk.rooms`: configuración por sala y lista de permitidos (ver arriba).
- Los grupos de acceso de remitentes estáticos se pueden referenciar desde `allowFrom` y `groupAllowFrom` con `accessGroup:<name>`.
- `channels.nextcloud-talk.historyLimit`: límite de historial de grupo (0 lo deshabilita).
- `channels.nextcloud-talk.dmHistoryLimit`: límite de historial de MD (0 lo deshabilita).
- `channels.nextcloud-talk.dms`: anulaciones por MD indexadas por ID de usuario (`historyLimit`).
- `channels.nextcloud-talk.textChunkLimit`: tamaño del fragmento de texto saliente en caracteres (predeterminado: 4000).
- `channels.nextcloud-talk.chunkMode`: `length` (predeterminado) o `newline` para dividir por líneas en blanco (límites de párrafo) antes de fragmentar por longitud.
- `channels.nextcloud-talk.blockStreaming`: deshabilita el streaming por bloques para este canal.
- `channels.nextcloud-talk.blockStreamingCoalesce`: ajuste de coalescencia del streaming por bloques.
- `channels.nextcloud-talk.responsePrefix`: prefijo de respuesta saliente.
- `channels.nextcloud-talk.markdown.tables`: modo de renderizado de tablas markdown (`off | bullets | code | block`).
- `channels.nextcloud-talk.mediaMaxMb`: límite de medios entrantes (MB).
- `channels.nextcloud-talk.network.dangerouslyAllowPrivateNetwork`: permite que hosts Nextcloud privados/internos pasen la protección SSRF.
- `channels.nextcloud-talk.accounts.<id>`: anulaciones por cuenta (mismas claves); `defaultAccount` elige la predeterminada. Las variables de entorno `NEXTCLOUD_TALK_BOT_SECRET` / `NEXTCLOUD_TALK_API_PASSWORD` se aplican solo a la cuenta predeterminada.

## Relacionado

- [Descripción general de canales](/es/channels) — todos los canales admitidos
- [Emparejamiento](/es/channels/pairing) — autenticación de MD y flujo de emparejamiento
- [Grupos](/es/channels/groups) — comportamiento del chat grupal y control por menciones
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesión para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y endurecimiento
