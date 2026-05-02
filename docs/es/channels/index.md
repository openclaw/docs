---
read_when:
    - Quieres elegir un canal de chat para OpenClaw
    - Necesitas una visión general rápida de las plataformas de mensajería compatibles
summary: Plataformas de mensajería a las que OpenClaw puede conectarse
title: Canales de chat
x-i18n:
    generated_at: "2026-05-02T05:20:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5937761c0aebc17e8633449d467219ea564b8b00a4a99f327aba7d73afe0c810
    source_path: channels/index.md
    workflow: 16
---

OpenClaw puede hablar contigo en cualquier aplicación de chat que ya uses. Cada canal se conecta mediante el Gateway.
El texto es compatible en todas partes; los medios y las reacciones varían según el canal.

## Notas de entrega

- Las respuestas de Telegram que contienen sintaxis markdown de imagen, como `![alt](url)`,
  se convierten en respuestas multimedia en la ruta de salida final cuando es posible.
- Los MD de varias personas de Slack se enrutan como chats grupales, por lo que la política de grupo, el comportamiento de
  menciones y las reglas de sesión grupal se aplican a las conversaciones MPIM.
- La configuración de WhatsApp se instala bajo demanda: la incorporación puede mostrar el flujo de configuración antes
  de que el paquete del Plugin esté instalado, y el Gateway carga el runtime de WhatsApp
  solo cuando el canal está realmente activo.

## Canales compatibles

- [BlueBubbles](/es/channels/bluebubbles) — **Recomendado para iMessage**; usa la API REST del servidor macOS de BlueBubbles con compatibilidad completa de funciones (Plugin incluido; editar, deshacer envío, efectos, reacciones, gestión de grupos; editar está roto actualmente en macOS 26 Tahoe).
- [Discord](/es/channels/discord) — API de Bot de Discord + Gateway; admite servidores, canales y MD.
- [Feishu](/es/channels/feishu) — bot de Feishu/Lark mediante WebSocket (Plugin incluido).
- [Google Chat](/es/channels/googlechat) — aplicación de la API de Google Chat mediante Webhook HTTP.
- [iMessage (heredado)](/es/channels/imessage) — Integración heredada de macOS mediante imsg CLI (obsoleta, usa BlueBubbles para configuraciones nuevas).
- [IRC](/es/channels/irc) — Servidores IRC clásicos; canales + MD con controles de emparejamiento/lista de permitidos.
- [LINE](/es/channels/line) — bot de LINE Messaging API (Plugin incluido).
- [Matrix](/es/channels/matrix) — protocolo Matrix (Plugin incluido).
- [Mattermost](/es/channels/mattermost) — API de Bot + WebSocket; canales, grupos, MD (Plugin incluido).
- [Microsoft Teams](/es/channels/msteams) — Bot Framework; compatibilidad empresarial (Plugin incluido).
- [Nextcloud Talk](/es/channels/nextcloud-talk) — Chat autohospedado mediante Nextcloud Talk (Plugin incluido).
- [Nostr](/es/channels/nostr) — MD descentralizados mediante NIP-04 (Plugin incluido).
- [QQ Bot](/es/channels/qqbot) — API de QQ Bot; chat privado, chat grupal y medios enriquecidos (Plugin incluido).
- [Signal](/es/channels/signal) — signal-cli; centrado en la privacidad.
- [Slack](/es/channels/slack) — Bolt SDK; aplicaciones de espacio de trabajo.
- [Synology Chat](/es/channels/synology-chat) — Synology NAS Chat mediante Webhooks salientes+entrantes (Plugin incluido).
- [Telegram](/es/channels/telegram) — API de Bot mediante grammY; admite grupos.
- [Tlon](/es/channels/tlon) — mensajería basada en Urbit (Plugin incluido).
- [Twitch](/es/channels/twitch) — chat de Twitch mediante conexión IRC (Plugin incluido).
- [Voice Call](/es/plugins/voice-call) — Telefonía mediante Plivo o Twilio (Plugin, instalado por separado).
- [WebChat](/es/web/webchat) — IU de Gateway WebChat sobre WebSocket.
- [WeChat](/es/channels/wechat) — Plugin Tencent iLink Bot mediante inicio de sesión con QR; solo chats privados (Plugin externo).
- [WhatsApp](/es/channels/whatsapp) — El más popular; usa Baileys y requiere emparejamiento QR.
- [Yuanbao](/es/channels/yuanbao) — bot de Tencent Yuanbao (Plugin externo).
- [Zalo](/es/channels/zalo) — Zalo Bot API; mensajería popular de Vietnam (Plugin incluido).
- [Zalo Personal](/es/channels/zalouser) — cuenta personal de Zalo mediante inicio de sesión con QR (Plugin incluido).

## Notas

- Los canales pueden ejecutarse simultáneamente; configura varios y OpenClaw enrutará por chat.
- La configuración más rápida suele ser **Telegram** (token de bot simple). WhatsApp requiere emparejamiento QR y
  almacena más estado en disco.
- El comportamiento de grupo varía según el canal; consulta [Grupos](/es/channels/groups).
- El emparejamiento de MD y las listas de permitidos se aplican por seguridad; consulta [Seguridad](/es/gateway/security).
- Solución de problemas: [Solución de problemas de canales](/es/channels/troubleshooting).
- Los proveedores de modelos se documentan por separado; consulta [Proveedores de modelos](/es/providers/models).
