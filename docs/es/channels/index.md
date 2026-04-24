---
read_when:
    - Quieres elegir un canal de chat para OpenClaw
    - Necesitas una vista general rápida de las plataformas de mensajería compatibles
summary: Plataformas de mensajería a las que OpenClaw puede conectarse
title: Canales de chat
x-i18n:
    generated_at: "2026-04-24T05:19:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: c016b78b16724e73b21946d6bed0009f4cbebd1f887620431b9b4bff70f2b1ff
    source_path: channels/index.md
    workflow: 15
---

OpenClaw puede hablar contigo en cualquier app de chat que ya uses. Cada canal se conecta mediante el Gateway.
El texto es compatible en todas partes; los medios y las reacciones varían según el canal.

## Canales compatibles

- [BlueBubbles](/es/channels/bluebubbles) — **Recomendado para iMessage**; usa la API REST del servidor BlueBubbles para macOS con compatibilidad completa de funciones (Plugin incluido; editar, deshacer envío, efectos, reacciones, gestión de grupos; editar está roto actualmente en macOS 26 Tahoe).
- [Discord](/es/channels/discord) — API de bots de Discord + Gateway; admite servidores, canales y mensajes directos.
- [Feishu](/es/channels/feishu) — bot de Feishu/Lark mediante WebSocket (Plugin incluido).
- [Google Chat](/es/channels/googlechat) — aplicación de Google Chat API mediante Webhook HTTP.
- [iMessage (legado)](/es/channels/imessage) — integración heredada de macOS mediante CLI `imsg` (obsoleto, usa BlueBubbles para configuraciones nuevas).
- [IRC](/es/channels/irc) — servidores IRC clásicos; canales + mensajes directos con controles de emparejamiento/lista de permitidos.
- [LINE](/es/channels/line) — bot de LINE Messaging API (Plugin incluido).
- [Matrix](/es/channels/matrix) — protocolo Matrix (Plugin incluido).
- [Mattermost](/es/channels/mattermost) — API de bots + WebSocket; canales, grupos, mensajes directos (Plugin incluido).
- [Microsoft Teams](/es/channels/msteams) — Bot Framework; soporte empresarial (Plugin incluido).
- [Nextcloud Talk](/es/channels/nextcloud-talk) — chat autoalojado mediante Nextcloud Talk (Plugin incluido).
- [Nostr](/es/channels/nostr) — mensajes directos descentralizados mediante NIP-04 (Plugin incluido).
- [QQ Bot](/es/channels/qqbot) — API de QQ Bot; chat privado, chat grupal y multimedia enriquecido (Plugin incluido).
- [Signal](/es/channels/signal) — `signal-cli`; centrado en la privacidad.
- [Slack](/es/channels/slack) — SDK Bolt; aplicaciones para espacios de trabajo.
- [Synology Chat](/es/channels/synology-chat) — chat de Synology NAS mediante Webhooks salientes+entrantes (Plugin incluido).
- [Telegram](/es/channels/telegram) — Bot API mediante grammY; admite grupos.
- [Tlon](/es/channels/tlon) — mensajería basada en Urbit (Plugin incluido).
- [Twitch](/es/channels/twitch) — chat de Twitch mediante conexión IRC (Plugin incluido).
- [Voice Call](/es/plugins/voice-call) — telefonía mediante Plivo o Twilio (Plugin, se instala por separado).
- [WebChat](/es/web/webchat) — interfaz de usuario WebChat del Gateway mediante WebSocket.
- [WeChat](/es/channels/wechat) — Plugin de bot Tencent iLink mediante inicio de sesión con QR; solo chats privados (Plugin externo).
- [WhatsApp](/es/channels/whatsapp) — el más popular; usa Baileys y requiere emparejamiento por QR.
- [Zalo](/es/channels/zalo) — API de Zalo Bot; el servicio de mensajería popular de Vietnam (Plugin incluido).
- [Zalo Personal](/es/channels/zalouser) — cuenta personal de Zalo mediante inicio de sesión con QR (Plugin incluido).

## Notas

- Los canales pueden ejecutarse simultáneamente; configura varios y OpenClaw enruta por chat.
- La configuración más rápida suele ser **Telegram** (token de bot simple). WhatsApp requiere emparejamiento por QR y
  almacena más estado en disco.
- El comportamiento de grupos varía según el canal; consulta [Grupos](/es/channels/groups).
- El emparejamiento de mensajes directos y las listas de permitidos se aplican por seguridad; consulta [Seguridad](/es/gateway/security).
- Solución de problemas: [Solución de problemas de canales](/es/channels/troubleshooting).
- Los proveedores de modelos se documentan por separado; consulta [Proveedores de modelos](/es/providers/models).
