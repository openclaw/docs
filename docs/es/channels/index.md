---
read_when:
    - Desea elegir un canal de chat para OpenClaw
    - Necesitas una descripción general rápida de las plataformas de mensajería compatibles
summary: Plataformas de mensajería a las que OpenClaw puede conectarse
title: Canales de chat
x-i18n:
    generated_at: "2026-05-06T05:26:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: c357a9dfabf12329954f30084fe9abfad9aa96f62bcd72b3d0802819d5979d7b
    source_path: channels/index.md
    workflow: 16
---

OpenClaw puede hablar contigo en cualquier aplicación de chat que ya uses. Cada canal se conecta mediante el Gateway.
El texto es compatible en todas partes; los medios y las reacciones varían según el canal.

## Notas de entrega

- Las respuestas de Telegram que contienen sintaxis de imagen de markdown, como `![alt](url)`,
  se convierten en respuestas multimedia en la ruta saliente final cuando es posible.
- Los DM de Slack con varias personas se enrutan como chats grupales, por lo que la política de grupo, el comportamiento de las menciones
  y las reglas de sesión grupal se aplican a las conversaciones MPIM.
- La configuración de WhatsApp se instala bajo demanda: la incorporación puede mostrar el flujo de configuración antes
  de que se instale el paquete Plugin, y el Gateway carga el runtime de WhatsApp
  solo cuando el canal está realmente activo.

## Canales compatibles

- [BlueBubbles](/es/channels/bluebubbles) - **Recomendado para iMessage**; usa la API REST del servidor macOS de BlueBubbles con compatibilidad completa de funciones (Plugin incluido; editar, anular envío, efectos, reacciones, gestión de grupos; la edición está rota actualmente en macOS 26 Tahoe).
- [Discord](/es/channels/discord) - API de Discord Bot + Gateway; compatible con servidores, canales y DM.
- [Feishu](/es/channels/feishu) - Bot de Feishu/Lark mediante WebSocket (Plugin incluido).
- [Google Chat](/es/channels/googlechat) - Aplicación de API de Google Chat mediante Webhook HTTP (Plugin descargable).
- [iMessage (heredado)](/es/channels/imessage) - Integración heredada de macOS mediante la CLI imsg (obsoleto, usa BlueBubbles para nuevas configuraciones).
- [IRC](/es/channels/irc) - Servidores IRC clásicos; canales + DM con controles de emparejamiento/lista de permitidos.
- [LINE](/es/channels/line) - Bot de LINE Messaging API (Plugin descargable).
- [Matrix](/es/channels/matrix) - Protocolo Matrix (Plugin descargable).
- [Mattermost](/es/channels/mattermost) - API de bot + WebSocket; canales, grupos, DM (Plugin descargable).
- [Microsoft Teams](/es/channels/msteams) - Bot Framework; soporte empresarial (Plugin incluido).
- [Nextcloud Talk](/es/channels/nextcloud-talk) - Chat autoalojado mediante Nextcloud Talk (Plugin incluido).
- [Nostr](/es/channels/nostr) - DM descentralizados mediante NIP-04 (Plugin incluido).
- [QQ Bot](/es/channels/qqbot) - API de QQ Bot; chat privado, chat grupal y medios enriquecidos (Plugin incluido).
- [Signal](/es/channels/signal) - signal-cli; centrado en la privacidad.
- [Slack](/es/channels/slack) - Bolt SDK; aplicaciones de espacio de trabajo.
- [Synology Chat](/es/channels/synology-chat) - Synology NAS Chat mediante Webhooks salientes+entrantes (Plugin incluido).
- [Telegram](/es/channels/telegram) - API de bot mediante grammY; compatible con grupos.
- [Tlon](/es/channels/tlon) - Mensajero basado en Urbit (Plugin incluido).
- [Twitch](/es/channels/twitch) - Chat de Twitch mediante conexión IRC (Plugin incluido).
- [Voice Call](/es/plugins/voice-call) - Telefonía mediante Plivo o Twilio (Plugin, instalado por separado).
- [WebChat](/es/web/webchat) - Interfaz WebChat del Gateway sobre WebSocket.
- [WeChat](/es/channels/wechat) - Plugin de Tencent iLink Bot mediante inicio de sesión con QR; solo chats privados (Plugin externo).
- [WhatsApp](/es/channels/whatsapp) - El más popular; usa Baileys y requiere emparejamiento QR.
- [Yuanbao](/es/channels/yuanbao) - Bot de Tencent Yuanbao (Plugin externo).
- [Zalo](/es/channels/zalo) - API de Zalo Bot; mensajero popular de Vietnam (Plugin incluido).
- [Zalo Personal](/es/channels/zalouser) - Cuenta personal de Zalo mediante inicio de sesión con QR (Plugin incluido).

## Notas

- Los canales pueden ejecutarse simultáneamente; configura varios y OpenClaw enrutará por chat.
- La configuración más rápida suele ser **Telegram** (token de bot simple). WhatsApp requiere emparejamiento QR y
  almacena más estado en disco.
- El comportamiento de grupo varía según el canal; consulta [Grupos](/es/channels/groups).
- El emparejamiento de DM y las listas de permitidos se aplican por seguridad; consulta [Seguridad](/es/gateway/security).
- Solución de problemas: [Solución de problemas de canales](/es/channels/troubleshooting).
- Los proveedores de modelos se documentan por separado; consulta [Proveedores de modelos](/es/providers/models).
