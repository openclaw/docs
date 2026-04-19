---
read_when:
    - Quieres elegir un canal de chat para OpenClaw
    - Necesitas una vista general rápida de las plataformas de mensajería compatibles
summary: Plataformas de mensajería a las que OpenClaw puede conectarse
title: Canales de chat
x-i18n:
    generated_at: "2026-04-19T01:11:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: d41c3a37d91c07f15afd8e199a289297772331c70e38697346a373595eb2d993
    source_path: channels/index.md
    workflow: 15
---

# Canales de chat

OpenClaw puede hablar contigo en cualquier aplicación de chat que ya uses. Cada canal se conecta a través del Gateway.
El texto es compatible en todas partes; los medios y las reacciones varían según el canal.

## Canales compatibles

- [BlueBubbles](/es/channels/bluebubbles) — **Recomendado para iMessage**; usa la API REST del servidor BlueBubbles en macOS con compatibilidad total de funciones (Plugin incluido; editar, deshacer envío, efectos, reacciones, gestión de grupos — la edición está rota actualmente en macOS 26 Tahoe).
- [Discord](/es/channels/discord) — API de bots de Discord + Gateway; compatible con servidores, canales y mensajes directos.
- [Feishu](/es/channels/feishu) — bot de Feishu/Lark mediante WebSocket (Plugin incluido).
- [Google Chat](/es/channels/googlechat) — aplicación de la API de Google Chat mediante Webhook HTTP.
- [iMessage (legacy)](/es/channels/imessage) — integración heredada de macOS mediante CLI imsg (obsoleta, usa BlueBubbles para nuevas configuraciones).
- [IRC](/es/channels/irc) — servidores IRC clásicos; canales + mensajes directos con controles de emparejamiento/lista de permitidos.
- [LINE](/es/channels/line) — bot de la API de mensajería de LINE (Plugin incluido).
- [Matrix](/es/channels/matrix) — protocolo Matrix (Plugin incluido).
- [Mattermost](/es/channels/mattermost) — API de bots + WebSocket; canales, grupos, mensajes directos (Plugin incluido).
- [Microsoft Teams](/es/channels/msteams) — Bot Framework; compatibilidad empresarial (Plugin incluido).
- [Nextcloud Talk](/es/channels/nextcloud-talk) — chat autoalojado mediante Nextcloud Talk (Plugin incluido).
- [Nostr](/es/channels/nostr) — mensajes directos descentralizados mediante NIP-04 (Plugin incluido).
- [QQ Bot](/es/channels/qqbot) — API de QQ Bot; chat privado, chat grupal y medios enriquecidos (Plugin incluido).
- [Signal](/es/channels/signal) — signal-cli; centrado en la privacidad.
- [Slack](/es/channels/slack) — SDK Bolt; aplicaciones de espacio de trabajo.
- [Synology Chat](/es/channels/synology-chat) — Chat de Synology NAS mediante Webhooks salientes+entrantes (Plugin incluido).
- [Telegram](/es/channels/telegram) — API de bots mediante grammY; compatible con grupos.
- [Tlon](/es/channels/tlon) — mensajero basado en Urbit (Plugin incluido).
- [Twitch](/es/channels/twitch) — chat de Twitch mediante conexión IRC (Plugin incluido).
- [Voice Call](/es/plugins/voice-call) — telefonía mediante Plivo o Twilio (plugin, se instala por separado).
- [WebChat](/web/webchat) — interfaz de usuario de WebChat del Gateway mediante WebSocket.
- [WeChat](/es/channels/wechat) — plugin Tencent iLink Bot mediante inicio de sesión con código QR; solo chats privados (plugin externo).
- [WhatsApp](/es/channels/whatsapp) — El más popular; usa Baileys y requiere emparejamiento por código QR.
- [Zalo](/es/channels/zalo) — API de Zalo Bot; el mensajero popular de Vietnam (Plugin incluido).
- [Zalo Personal](/es/channels/zalouser) — cuenta personal de Zalo mediante inicio de sesión con código QR (Plugin incluido).

## Notas

- Los canales pueden ejecutarse simultáneamente; configura varios y OpenClaw enrutará por chat.
- La configuración más rápida suele ser **Telegram** (token de bot simple). WhatsApp requiere emparejamiento por código QR y
  almacena más estado en disco.
- El comportamiento en grupos varía según el canal; consulta [Groups](/es/channels/groups).
- El emparejamiento de mensajes directos y las listas de permitidos se aplican por seguridad; consulta [Security](/es/gateway/security).
- Solución de problemas: [Solución de problemas de canales](/es/channels/troubleshooting).
- Los proveedores de modelos se documentan por separado; consulta [Proveedores de modelos](/es/providers/models).
