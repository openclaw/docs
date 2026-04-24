---
read_when:
    - Trabajando en funciones del canal de Nextcloud Talk
summary: Estado de compatibilidad, capacidades y configuración de Nextcloud Talk
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-04-24T05:19:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2eebd6cfd013d3a6e1cf03e2a2167d0657e688c5989f179bb0fec39f866586cb
    source_path: channels/nextcloud-talk.md
    workflow: 15
---

Estado: Plugin incluido (bot de Webhook). Se admiten mensajes directos, salas, reacciones y mensajes Markdown.

## Plugin incluido

Nextcloud Talk se distribuye como un Plugin incluido en las versiones actuales de OpenClaw, por lo que
las compilaciones empaquetadas normales no necesitan una instalación separada.

Si usas una compilación antigua o una instalación personalizada que excluye Nextcloud Talk,
instálalo manualmente:

Instalación mediante CLI (registro npm):

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

Checkout local (al ejecutarlo desde un repositorio git):

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

Detalles: [Plugins](/es/tools/plugin)

## Configuración rápida (principiante)

1. Asegúrate de que el Plugin de Nextcloud Talk esté disponible.
   - Las versiones empaquetadas actuales de OpenClaw ya lo incluyen.
   - Las instalaciones antiguas o personalizadas pueden agregarlo manualmente con los comandos anteriores.
2. En tu servidor de Nextcloud, crea un bot:

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature reaction
   ```

3. Habilita el bot en la configuración de la sala de destino.
4. Configura OpenClaw:
   - Configuración: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - O variable de entorno: `NEXTCLOUD_TALK_BOT_SECRET` (solo cuenta predeterminada)
5. Reinicia el gateway (o termina la configuración).

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
- La URL del Webhook debe ser accesible por el Gateway; establece `webhookPublicUrl` si estás detrás de un proxy.
- La API del bot no admite subidas de medios; los medios se envían como URL.
- La carga útil del Webhook no distingue entre mensajes directos y salas; establece `apiUser` + `apiPassword` para habilitar búsquedas de tipo de sala (de lo contrario, los mensajes directos se tratan como salas).

## Control de acceso (mensajes directos)

- Predeterminado: `channels.nextcloud-talk.dmPolicy = "pairing"`. Los remitentes desconocidos reciben un código de pairing.
- Aprobar mediante:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- Mensajes directos públicos: `channels.nextcloud-talk.dmPolicy="open"` más `channels.nextcloud-talk.allowFrom=["*"]`.
- `allowFrom` coincide solo con IDs de usuario de Nextcloud; los nombres para mostrar se ignoran.

## Salas (grupos)

- Predeterminado: `channels.nextcloud-talk.groupPolicy = "allowlist"` (restringido por mención).
- Incluye salas en la lista de permitidos con `channels.nextcloud-talk.rooms`:

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

- Para no permitir ninguna sala, deja vacía la lista de permitidos o establece `channels.nextcloud-talk.groupPolicy="disabled"`.

## Capacidades

| Función          | Estado         |
| ---------------- | -------------- |
| Mensajes directos | Compatible    |
| Salas            | Compatible     |
| Hilos            | No compatible  |
| Medios           | Solo URL       |
| Reacciones       | Compatible     |
| Comandos nativos | No compatible  |

## Referencia de configuración (Nextcloud Talk)

Configuración completa: [Configuración](/es/gateway/configuration)

Opciones del proveedor:

- `channels.nextcloud-talk.enabled`: habilitar/deshabilitar el inicio del canal.
- `channels.nextcloud-talk.baseUrl`: URL de la instancia de Nextcloud.
- `channels.nextcloud-talk.botSecret`: secreto compartido del bot.
- `channels.nextcloud-talk.botSecretFile`: ruta del secreto en archivo normal. Se rechazan enlaces simbólicos.
- `channels.nextcloud-talk.apiUser`: usuario de API para búsquedas de salas (detección de DM).
- `channels.nextcloud-talk.apiPassword`: contraseña de API/aplicación para búsquedas de salas.
- `channels.nextcloud-talk.apiPasswordFile`: ruta del archivo de contraseña de API.
- `channels.nextcloud-talk.webhookPort`: puerto del listener del Webhook (predeterminado: 8788).
- `channels.nextcloud-talk.webhookHost`: host del Webhook (predeterminado: 0.0.0.0).
- `channels.nextcloud-talk.webhookPath`: ruta del Webhook (predeterminado: /nextcloud-talk-webhook).
- `channels.nextcloud-talk.webhookPublicUrl`: URL del Webhook accesible externamente.
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled`.
- `channels.nextcloud-talk.allowFrom`: lista de permitidos de DM (IDs de usuario). `open` requiere `"*"`.
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled`.
- `channels.nextcloud-talk.groupAllowFrom`: lista de permitidos de grupo (IDs de usuario).
- `channels.nextcloud-talk.rooms`: configuración por sala y lista de permitidos.
- `channels.nextcloud-talk.historyLimit`: límite del historial de grupo (0 lo desactiva).
- `channels.nextcloud-talk.dmHistoryLimit`: límite del historial de DM (0 lo desactiva).
- `channels.nextcloud-talk.dms`: sobrescrituras por DM (`historyLimit`).
- `channels.nextcloud-talk.textChunkLimit`: tamaño de fragmento de texto saliente (caracteres).
- `channels.nextcloud-talk.chunkMode`: `length` (predeterminado) o `newline` para dividir por líneas en blanco (límites de párrafo) antes de fragmentar por longitud.
- `channels.nextcloud-talk.blockStreaming`: deshabilita el streaming por bloques para este canal.
- `channels.nextcloud-talk.blockStreamingCoalesce`: ajuste de agrupación para streaming por bloques.
- `channels.nextcloud-talk.mediaMaxMb`: límite de medios entrantes (MB).

## Relacionado

- [Resumen de canales](/es/channels) — todos los canales compatibles
- [Pairing](/es/channels/pairing) — autenticación de DM y flujo de pairing
- [Groups](/es/channels/groups) — comportamiento de chats grupales y restricción por mención
- [Channel Routing](/es/channels/channel-routing) — enrutamiento de sesión para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y endurecimiento
