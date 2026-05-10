---
read_when:
    - Desea elegir un canal de chat para OpenClaw
    - Necesitas un resumen rápido de las plataformas de mensajería compatibles
summary: Plataformas de mensajería a las que OpenClaw puede conectarse
title: Canales de chat
x-i18n:
    generated_at: "2026-05-10T19:21:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 57ae81a99d265abbf3f9f016506e787d66b4f6984d833e43e7a8554e157a3c17
    source_path: channels/index.md
    workflow: 16
---

OpenClaw puede hablar contigo en cualquier aplicación de chat que ya uses. Cada canal se conecta mediante el Gateway.
El texto es compatible en todas partes; los medios y las reacciones varían según el canal.

## Notas de entrega

- Las respuestas de Telegram que contienen sintaxis de imagen de Markdown, como `![alt](url)`,
  se convierten en respuestas multimedia en la ruta de salida final cuando es posible.
- Los MD de varias personas en Slack se enrutan como chats grupales, por lo que la política de grupos, el comportamiento de menciones
  y las reglas de sesión grupal se aplican a las conversaciones MPIM.
- La configuración de WhatsApp es de instalación bajo demanda: la incorporación puede mostrar el flujo de configuración antes de
  que se instale el paquete del Plugin, y el Gateway carga el runtime de WhatsApp
  solo cuando el canal está realmente activo.

## Canales compatibles

- [Discord](/es/channels/discord) - API de bot de Discord + Gateway; admite servidores, canales y MD.
- [Feishu](/es/channels/feishu) - Bot de Feishu/Lark mediante WebSocket (Plugin incluido).
- [Google Chat](/es/channels/googlechat) - Aplicación de Google Chat API mediante webhook HTTP (Plugin descargable).
- [iMessage](/es/channels/imessage) - Integración nativa con macOS mediante el puente `imsg` en una Mac con sesión iniciada (o contenedor SSH cuando el Gateway se ejecuta en otro lugar), incluidas acciones de API privada para respuestas, tapbacks, efectos, adjuntos y administración de grupos. Recomendado para nuevas configuraciones de iMessage en OpenClaw cuando los permisos del host y el acceso a Messages encajan.
- [IRC](/es/channels/irc) - Servidores IRC clásicos; canales + MD con controles de emparejamiento/lista de permitidos.
- [LINE](/es/channels/line) - Bot de LINE Messaging API (Plugin descargable).
- [Matrix](/es/channels/matrix) - Protocolo Matrix (Plugin descargable).
- [Mattermost](/es/channels/mattermost) - API de bot + WebSocket; canales, grupos, MD (Plugin descargable).
- [Microsoft Teams](/es/channels/msteams) - Bot Framework; soporte empresarial (Plugin incluido).
- [Nextcloud Talk](/es/channels/nextcloud-talk) - Chat autohospedado mediante Nextcloud Talk (Plugin incluido).
- [Nostr](/es/channels/nostr) - MD descentralizados mediante NIP-04 (Plugin incluido).
- [QQ Bot](/es/channels/qqbot) - QQ Bot API; chat privado, chat grupal y medios enriquecidos (Plugin incluido).
- [Signal](/es/channels/signal) - signal-cli; centrado en la privacidad.
- [Slack](/es/channels/slack) - Bolt SDK; aplicaciones de espacio de trabajo.
- [Synology Chat](/es/channels/synology-chat) - Synology NAS Chat mediante webhooks salientes+entrantes (Plugin incluido).
- [Telegram](/es/channels/telegram) - Bot API mediante grammY; admite grupos.
- [Tlon](/es/channels/tlon) - Mensajero basado en Urbit (Plugin incluido).
- [Twitch](/es/channels/twitch) - Chat de Twitch mediante conexión IRC (Plugin incluido).
- [Voice Call](/es/plugins/voice-call) - Telefonía mediante Plivo o Twilio (Plugin, instalado por separado).
- [WebChat](/es/web/webchat) - IU de WebChat del Gateway sobre WebSocket.
- [WeChat](/es/channels/wechat) - Plugin Tencent iLink Bot mediante inicio de sesión con QR; solo chats privados (Plugin externo).
- [WhatsApp](/es/channels/whatsapp) - El más popular; usa Baileys y requiere emparejamiento con QR.
- [Yuanbao](/es/channels/yuanbao) - Bot Tencent Yuanbao (Plugin externo).
- [Zalo](/es/channels/zalo) - Zalo Bot API; mensajero popular de Vietnam (Plugin incluido).
- [Zalo Personal](/es/channels/zalouser) - Cuenta personal de Zalo mediante inicio de sesión con QR (Plugin incluido).

## Notas

- Los canales pueden ejecutarse simultáneamente; configura varios y OpenClaw enrutará por chat.
- La configuración más rápida suele ser **Telegram** (token de bot simple). WhatsApp requiere emparejamiento con QR y
  almacena más estado en disco.
- El comportamiento grupal varía según el canal; consulta [Grupos](/es/channels/groups).
- El emparejamiento de MD y las listas de permitidos se aplican por seguridad; consulta [Seguridad](/es/gateway/security).
- Solución de problemas: [Solución de problemas de canales](/es/channels/troubleshooting).
- Los proveedores de modelos se documentan por separado; consulta [Proveedores de modelos](/es/providers/models).
