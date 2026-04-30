---
read_when:
    - Trabajando en funcionalidades del canal de Nextcloud Talk
summary: Estado de compatibilidad, capacidades y configuración de Nextcloud Talk
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-04-30T05:29:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: fcbe8a65adfddc95d2b4944af88f9982e23a1676752efec2bbf40cfc4dd846d2
    source_path: channels/nextcloud-talk.md
    workflow: 16
---

Estado: Plugin incluido (bot de Webhook). Se admiten mensajes directos, salas, reacciones y mensajes markdown.

## Plugin incluido

Nextcloud Talk se distribuye como Plugin incluido en las versiones actuales de OpenClaw, por lo que
las compilaciones empaquetadas normales no necesitan una instalación separada.

Si usas una compilación anterior o una instalación personalizada que excluye Nextcloud Talk,
instala un paquete npm actual cuando se publique uno:

Instalar mediante CLI (registro npm, cuando exista un paquete actual):

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

Si npm informa que el paquete propiedad de OpenClaw está obsoleto, usa una compilación
empaquetada actual de OpenClaw o la ruta de checkout local hasta que se publique
un paquete npm más reciente.

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
   - O env: `NEXTCLOUD_TALK_BOT_SECRET` (solo cuenta predeterminada)

   Configuración con CLI:

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

5. Reinicia el Gateway (o finaliza la configuración).

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
- La URL de Webhook debe ser accesible para el Gateway; define `webhookPublicUrl` si está detrás de un proxy.
- La API del bot no admite subidas de medios; los medios se envían como URL.
- La carga útil del Webhook no distingue entre MD y salas; define `apiUser` + `apiPassword` para habilitar búsquedas de tipo de sala (de lo contrario, los MD se tratan como salas).

## Control de acceso (MD)

- Predeterminado: `channels.nextcloud-talk.dmPolicy = "pairing"`. Los remitentes desconocidos reciben un código de emparejamiento.
- Aprobar mediante:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- MD públicos: `channels.nextcloud-talk.dmPolicy="open"` más `channels.nextcloud-talk.allowFrom=["*"]`.
- `allowFrom` coincide solo con IDs de usuario de Nextcloud; los nombres para mostrar se ignoran.

## Salas (grupos)

- Predeterminado: `channels.nextcloud-talk.groupPolicy = "allowlist"` (controlado por menciones).
- Añade salas a la lista de permitidos con `channels.nextcloud-talk.rooms`:

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

| Función          | Estado             |
| ---------------- | ------------------ |
| Mensajes directos | Compatible         |
| Salas            | Compatible         |
| Hilos            | No compatible      |
| Medios           | Solo URL           |
| Reacciones       | Compatible         |
| Comandos nativos | No compatible      |

## Referencia de configuración (Nextcloud Talk)

Configuración completa: [Configuración](/es/gateway/configuration)

Opciones del proveedor:

- `channels.nextcloud-talk.enabled`: habilita/deshabilita el inicio del canal.
- `channels.nextcloud-talk.baseUrl`: URL de la instancia de Nextcloud.
- `channels.nextcloud-talk.botSecret`: secreto compartido del bot.
- `channels.nextcloud-talk.botSecretFile`: ruta de secreto en archivo regular. Se rechazan los enlaces simbólicos.
- `channels.nextcloud-talk.apiUser`: usuario de API para búsquedas de salas (detección de MD).
- `channels.nextcloud-talk.apiPassword`: contraseña de API/app para búsquedas de salas.
- `channels.nextcloud-talk.apiPasswordFile`: ruta del archivo de contraseña de API.
- `channels.nextcloud-talk.webhookPort`: puerto del listener de Webhook (predeterminado: 8788).
- `channels.nextcloud-talk.webhookHost`: host del Webhook (predeterminado: 0.0.0.0).
- `channels.nextcloud-talk.webhookPath`: ruta del Webhook (predeterminado: /nextcloud-talk-webhook).
- `channels.nextcloud-talk.webhookPublicUrl`: URL de Webhook accesible externamente.
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled`.
- `channels.nextcloud-talk.allowFrom`: lista de permitidos de MD (IDs de usuario). `open` requiere `"*"`.
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled`.
- `channels.nextcloud-talk.groupAllowFrom`: lista de permitidos de grupo (IDs de usuario).
- `channels.nextcloud-talk.rooms`: configuración por sala y lista de permitidos.
- `channels.nextcloud-talk.historyLimit`: límite de historial de grupo (0 deshabilita).
- `channels.nextcloud-talk.dmHistoryLimit`: límite de historial de MD (0 deshabilita).
- `channels.nextcloud-talk.dms`: anulaciones por MD (historyLimit).
- `channels.nextcloud-talk.textChunkLimit`: tamaño de fragmento de texto saliente (caracteres).
- `channels.nextcloud-talk.chunkMode`: `length` (predeterminado) o `newline` para dividir por líneas en blanco (límites de párrafo) antes de fragmentar por longitud.
- `channels.nextcloud-talk.blockStreaming`: deshabilita el streaming de bloques para este canal.
- `channels.nextcloud-talk.blockStreamingCoalesce`: ajuste de combinación del streaming de bloques.
- `channels.nextcloud-talk.mediaMaxMb`: límite de medios entrantes (MB).

## Relacionado

- [Resumen de canales](/es/channels) — todos los canales compatibles
- [Emparejamiento](/es/channels/pairing) — autenticación de MD y flujo de emparejamiento
- [Grupos](/es/channels/groups) — comportamiento de chat grupal y control por menciones
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y refuerzo de seguridad
