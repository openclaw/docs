---
read_when:
    - Trabajando en funcionalidades del canal de Nextcloud Talk
summary: Estado de soporte, capacidades y configuración de Nextcloud Talk
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-05-10T19:22:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: e4b3b2d074cc8d3c19223dbb0c306c6861717d0f35e638e3aab04b03647fd248
    source_path: channels/nextcloud-talk.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Estado: Plugin incluido (bot de Webhook). Se admiten mensajes directos, salas, reacciones y mensajes Markdown.

## Plugin incluido

Nextcloud Talk se distribuye como Plugin incluido en las versiones actuales de OpenClaw, por lo que
las compilaciones empaquetadas normales no necesitan una instalación aparte.

Si usas una compilación más antigua o una instalación personalizada que excluye Nextcloud Talk,
instala el paquete npm directamente:

Instalar mediante CLI (registro npm):

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

Usa el paquete básico para seguir la etiqueta de versión oficial actual. Fija una
versión exacta solo cuando necesites una instalación reproducible.

Checkout local (al ejecutar desde un repositorio git):

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

Detalles: [Plugins](/es/tools/plugin)

## Configuración rápida (principiante)

1. Asegúrate de que el Plugin de Nextcloud Talk esté disponible.
   - Las versiones empaquetadas actuales de OpenClaw ya lo incluyen.
   - Las instalaciones antiguas/personalizadas pueden añadirlo manualmente con los comandos anteriores.
2. En tu servidor Nextcloud, crea un bot:

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature webhook --feature response --feature reaction
   ```

3. Habilita el bot en la configuración de la sala de destino.
4. Configura OpenClaw:
   - Configuración: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - O variable de entorno: `NEXTCLOUD_TALK_BOT_SECRET` (solo cuenta predeterminada)

   Configuración por CLI:

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

5. Reinicia el Gateway (o termina la configuración).

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
- La URL del Webhook debe ser accesible por el Gateway; configura `webhookPublicUrl` si está detrás de un proxy.
- Las cargas de medios no son compatibles con la API del bot; los medios se envían como URL.
- La carga útil del Webhook no distingue entre mensajes directos y salas; configura `apiUser` + `apiPassword` para habilitar búsquedas de tipo de sala (de lo contrario, los mensajes directos se tratan como salas).

## Control de acceso (mensajes directos)

- Predeterminado: `channels.nextcloud-talk.dmPolicy = "pairing"`. Los remitentes desconocidos reciben un código de emparejamiento.
- Aprobar mediante:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- Mensajes directos públicos: `channels.nextcloud-talk.dmPolicy="open"` más `channels.nextcloud-talk.allowFrom=["*"]`.
- `allowFrom` coincide únicamente con los ID de usuario de Nextcloud; los nombres para mostrar se ignoran.

## Salas (grupos)

- Predeterminado: `channels.nextcloud-talk.groupPolicy = "allowlist"` (controlado por menciones).
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

- Para no permitir ninguna sala, mantén vacía la lista de permitidos o establece `channels.nextcloud-talk.groupPolicy="disabled"`.

## Capacidades

| Función          | Estado            |
| ---------------- | ----------------- |
| Mensajes directos | Compatible        |
| Salas            | Compatible        |
| Hilos            | No compatible     |
| Medios           | Solo URL          |
| Reacciones       | Compatible        |
| Comandos nativos | No compatible     |

## Referencia de configuración (Nextcloud Talk)

Configuración completa: [Configuración](/es/gateway/configuration)

Opciones del proveedor:

- `channels.nextcloud-talk.enabled`: habilitar/deshabilitar el inicio del canal.
- `channels.nextcloud-talk.baseUrl`: URL de la instancia de Nextcloud.
- `channels.nextcloud-talk.botSecret`: secreto compartido del bot.
- `channels.nextcloud-talk.botSecretFile`: ruta de secreto en archivo normal. Los enlaces simbólicos se rechazan.
- `channels.nextcloud-talk.apiUser`: usuario de API para búsquedas de salas (detección de mensajes directos).
- `channels.nextcloud-talk.apiPassword`: contraseña de API/app para búsquedas de salas.
- `channels.nextcloud-talk.apiPasswordFile`: ruta del archivo de contraseña de API.
- `channels.nextcloud-talk.webhookPort`: puerto del listener de Webhook (predeterminado: 8788).
- `channels.nextcloud-talk.webhookHost`: host del Webhook (predeterminado: 0.0.0.0).
- `channels.nextcloud-talk.webhookPath`: ruta del Webhook (predeterminado: /nextcloud-talk-webhook).
- `channels.nextcloud-talk.webhookPublicUrl`: URL de Webhook accesible externamente.
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled`.
- `channels.nextcloud-talk.allowFrom`: lista de permitidos de mensajes directos (ID de usuario). `open` requiere `"*"`.
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled`.
- `channels.nextcloud-talk.groupAllowFrom`: lista de permitidos de grupos (ID de usuario).
- `channels.nextcloud-talk.rooms`: configuración por sala y lista de permitidos.
- Los grupos estáticos de acceso de remitentes pueden referenciarse desde `allowFrom` y `groupAllowFrom` con `accessGroup:<name>`.
- `channels.nextcloud-talk.historyLimit`: límite de historial de grupo (0 deshabilita).
- `channels.nextcloud-talk.dmHistoryLimit`: límite de historial de mensajes directos (0 deshabilita).
- `channels.nextcloud-talk.dms`: anulaciones por mensaje directo (historyLimit).
- `channels.nextcloud-talk.textChunkLimit`: tamaño de fragmento de texto saliente (caracteres).
- `channels.nextcloud-talk.chunkMode`: `length` (predeterminado) o `newline` para dividir por líneas en blanco (límites de párrafo) antes de fragmentar por longitud.
- `channels.nextcloud-talk.blockStreaming`: deshabilitar la transmisión por bloques para este canal.
- `channels.nextcloud-talk.blockStreamingCoalesce`: ajuste de coalescencia de transmisión por bloques.
- `channels.nextcloud-talk.mediaMaxMb`: límite de medios entrantes (MB).

## Relacionado

- [Resumen de canales](/es/channels) — todos los canales compatibles
- [Emparejamiento](/es/channels/pairing) — autenticación de mensajes directos y flujo de emparejamiento
- [Grupos](/es/channels/groups) — comportamiento del chat grupal y control por menciones
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y refuerzo de seguridad
