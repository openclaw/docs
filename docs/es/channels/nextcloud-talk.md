---
read_when:
    - Trabajando en las funciones del canal de Nextcloud Talk
summary: Estado de compatibilidad, capacidades y configuración de Nextcloud Talk
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-05-02T22:16:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4956586ae8622118dcf136f4279c6ed1c2895fd4bb4576a7f5799de600a95740
    source_path: channels/nextcloud-talk.md
    workflow: 16
---

Estado: Plugin incluido (bot de Webhook). Se admiten mensajes directos, salas, reacciones y mensajes Markdown.

## Plugin incluido

Nextcloud Talk se distribuye como Plugin incluido en las versiones actuales de OpenClaw, por lo que las compilaciones empaquetadas normales no necesitan una instalación separada.

Si usas una compilación anterior o una instalación personalizada que excluye Nextcloud Talk, instala el paquete npm directamente:

Instala mediante CLI (registro npm):

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

Usa el paquete sin versión para seguir la etiqueta de versión oficial actual. Fija una versión exacta solo cuando necesites una instalación reproducible.

Checkout local (al ejecutar desde un repositorio git):

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

Detalles: [Plugins](/es/tools/plugin)

## Configuración rápida (principiante)

1. Asegúrate de que el Plugin de Nextcloud Talk esté disponible.
   - Las versiones empaquetadas actuales de OpenClaw ya lo incluyen.
   - Las instalaciones anteriores/personalizadas pueden añadirlo manualmente con los comandos anteriores.
2. En tu servidor Nextcloud, crea un bot:

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature reaction
   ```

3. Habilita el bot en la configuración de la sala de destino.
4. Configura OpenClaw:
   - Configuración: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - O variable de entorno: `NEXTCLOUD_TALK_BOT_SECRET` (solo cuenta predeterminada)

   Configuración mediante CLI:

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
- La URL del Webhook debe ser accesible para el Gateway; define `webhookPublicUrl` si está detrás de un proxy.
- La API del bot no admite cargas de medios; los medios se envían como URL.
- La carga útil del Webhook no distingue mensajes directos de salas; define `apiUser` + `apiPassword` para habilitar consultas de tipo de sala (de lo contrario, los mensajes directos se tratan como salas).

## Control de acceso (mensajes directos)

- Predeterminado: `channels.nextcloud-talk.dmPolicy = "pairing"`. Los remitentes desconocidos reciben un código de emparejamiento.
- Aprobar mediante:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- Mensajes directos públicos: `channels.nextcloud-talk.dmPolicy="open"` más `channels.nextcloud-talk.allowFrom=["*"]`.
- `allowFrom` solo coincide con los ID de usuario de Nextcloud; los nombres visibles se ignoran.

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

- Para no permitir ninguna sala, mantén vacía la lista de permitidos o define `channels.nextcloud-talk.groupPolicy="disabled"`.

## Capacidades

| Función          | Estado          |
| --------------- | ------------- |
| Mensajes directos | Admitido      |
| Salas           | Admitido        |
| Hilos           | No admitido     |
| Medios          | Solo URL        |
| Reacciones      | Admitido        |
| Comandos nativos | No admitido    |

## Referencia de configuración (Nextcloud Talk)

Configuración completa: [Configuración](/es/gateway/configuration)

Opciones del proveedor:

- `channels.nextcloud-talk.enabled`: habilita/deshabilita el inicio del canal.
- `channels.nextcloud-talk.baseUrl`: URL de la instancia de Nextcloud.
- `channels.nextcloud-talk.botSecret`: secreto compartido del bot.
- `channels.nextcloud-talk.botSecretFile`: ruta de secreto en archivo regular. Se rechazan los enlaces simbólicos.
- `channels.nextcloud-talk.apiUser`: usuario de API para consultas de sala (detección de mensajes directos).
- `channels.nextcloud-talk.apiPassword`: contraseña de API/aplicación para consultas de sala.
- `channels.nextcloud-talk.apiPasswordFile`: ruta del archivo de contraseña de API.
- `channels.nextcloud-talk.webhookPort`: puerto del listener de Webhook (predeterminado: 8788).
- `channels.nextcloud-talk.webhookHost`: host del Webhook (predeterminado: 0.0.0.0).
- `channels.nextcloud-talk.webhookPath`: ruta del Webhook (predeterminado: /nextcloud-talk-webhook).
- `channels.nextcloud-talk.webhookPublicUrl`: URL del Webhook accesible externamente.
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled`.
- `channels.nextcloud-talk.allowFrom`: lista de permitidos para mensajes directos (ID de usuario). `open` requiere `"*"`.
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled`.
- `channels.nextcloud-talk.groupAllowFrom`: lista de permitidos para grupos (ID de usuario).
- `channels.nextcloud-talk.rooms`: configuración por sala y lista de permitidos.
- `channels.nextcloud-talk.historyLimit`: límite de historial de grupo (0 deshabilita).
- `channels.nextcloud-talk.dmHistoryLimit`: límite de historial de mensajes directos (0 deshabilita).
- `channels.nextcloud-talk.dms`: anulaciones por mensaje directo (historyLimit).
- `channels.nextcloud-talk.textChunkLimit`: tamaño de fragmento de texto saliente (caracteres).
- `channels.nextcloud-talk.chunkMode`: `length` (predeterminado) o `newline` para dividir por líneas en blanco (límites de párrafo) antes de fragmentar por longitud.
- `channels.nextcloud-talk.blockStreaming`: deshabilita el streaming de bloques para este canal.
- `channels.nextcloud-talk.blockStreamingCoalesce`: ajuste de coalescencia del streaming de bloques.
- `channels.nextcloud-talk.mediaMaxMb`: límite de medios entrantes (MB).

## Relacionado

- [Resumen de canales](/es/channels) — todos los canales admitidos
- [Emparejamiento](/es/channels/pairing) — autenticación de mensajes directos y flujo de emparejamiento
- [Grupos](/es/channels/groups) — comportamiento del chat grupal y restricción por mención
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y endurecimiento
