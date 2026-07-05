---
read_when:
    - Quieres elegir un canal de chat para OpenClaw
    - Necesitas una descripción general rápida de las plataformas de mensajería compatibles
summary: Plataformas de mensajería a las que OpenClaw puede conectarse
title: Canales de chat
x-i18n:
    generated_at: "2026-07-05T11:02:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 411b011a8e5dd83d3f30a672c0e8a56251ee8c6ca7cdf3e7dc5c2b1f1b31d73d
    source_path: channels/index.md
    workflow: 16
---

OpenClaw puede hablar contigo en cualquier aplicación de chat que ya uses. Cada canal se conecta mediante el Gateway.
El texto se admite en todas partes; los medios y las reacciones varían según el canal.

iMessage, Telegram y la interfaz WebChat se incluyen con la instalación principal. Los canales marcados como
"Plugin oficial" se instalan con un comando (`openclaw plugins install @openclaw/<id>`)
o bajo demanda durante `openclaw onboard` / `openclaw channels add`, y luego requieren un reinicio del Gateway. Los canales de "Plugin externo" se mantienen fuera del repositorio de OpenClaw.

## Canales admitidos

- [Discord](/es/channels/discord) - Discord Bot API + Gateway; admite servidores, canales y MD (Plugin oficial).
- [Feishu](/es/channels/feishu) - Bot de Feishu/Lark mediante WebSocket (Plugin oficial).
- [Google Chat](/es/channels/googlechat) - Aplicación de Google Chat API mediante webhook HTTP (Plugin oficial).
- [iMessage](/es/channels/imessage) - Incluido en el núcleo. Integración nativa con macOS mediante el puente `imsg` en un Mac con sesión iniciada (o envoltorio SSH cuando el Gateway se ejecuta en otro lugar), incluidas acciones de API privada para respuestas, tapbacks, efectos, adjuntos y gestión de grupos.
- [IRC](/es/channels/irc) - Servidores IRC clásicos; canales + MD con controles de emparejamiento/listas de permitidos (Plugin oficial).
- [LINE](/es/channels/line) - Bot de LINE Messaging API (Plugin oficial).
- [Matrix](/es/channels/matrix) - Protocolo Matrix (Plugin oficial).
- [Mattermost](/es/channels/mattermost) - Bot API + WebSocket; canales, grupos, MD (Plugin oficial).
- [Microsoft Teams](/es/channels/msteams) - Bot Framework; soporte empresarial (Plugin oficial).
- [Nextcloud Talk](/es/channels/nextcloud-talk) - Chat autohospedado mediante Nextcloud Talk (Plugin oficial).
- [Nostr](/es/channels/nostr) - MD descentralizados mediante NIP-04 (Plugin oficial).
- [QQ Bot](/es/channels/qqbot) - QQ Bot API; chat privado, chat grupal y medios enriquecidos (Plugin oficial).
- [Raft](/es/channels/raft) - Puente de activación de Raft CLI para colaboración entre personas y agentes (Plugin oficial).
- [Signal](/es/channels/signal) - signal-cli; centrado en la privacidad (Plugin oficial).
- [Slack](/es/channels/slack) - Bolt SDK; aplicaciones de espacio de trabajo (Plugin oficial).
- [SMS](/es/channels/sms) - SMS respaldado por Twilio mediante el webhook del Gateway (Plugin oficial).
- [Synology Chat](/es/channels/synology-chat) - Synology NAS Chat mediante webhooks salientes+entrantes (Plugin oficial).
- [Telegram](/es/channels/telegram) - Incluido en el núcleo. Bot API mediante grammY; admite grupos.
- [Tlon](/es/channels/tlon) - Mensajero basado en Urbit (Plugin oficial).
- [Twitch](/es/channels/twitch) - Chat de Twitch mediante conexión IRC (Plugin oficial).
- [Voice Call](/es/plugins/voice-call) - Telefonía mediante Plivo, Telnyx o Twilio (Plugin oficial).
- [WebChat](/es/web/webchat) - Incluido en el núcleo. Interfaz WebChat del Gateway sobre WebSocket.
- [WeChat](/es/channels/wechat) - Bot Tencent iLink mediante inicio de sesión con QR; solo chats privados (Plugin externo).
- [WhatsApp](/es/channels/whatsapp) - El más popular; usa Baileys y requiere emparejamiento con QR (Plugin oficial).
- [Yuanbao](/es/channels/yuanbao) - Bot Tencent Yuanbao (Plugin externo).
- [Zalo](/es/channels/zalo) - Zalo Bot API; mensajería popular de Vietnam (Plugin oficial).
- [Zalo ClawBot](/es/channels/zaloclawbot) - Asistente personal de Zalo mediante inicio de sesión con QR; vinculado al propietario (Plugin externo).
- [Zalo Personal](/es/channels/zalouser) - Cuenta personal de Zalo mediante inicio de sesión con QR (Plugin oficial).

## Notas de entrega

- Las respuestas de Telegram que contienen sintaxis de imagen Markdown, como `![alt](url)`,
  se convierten en respuestas multimedia en la ruta de salida final cuando es posible.
- Los MD de varias personas de Slack se enrutan como chats grupales, por lo que la política de grupos, el comportamiento de menciones y las reglas de sesión grupal se aplican a las conversaciones MPIM.
- La configuración de WhatsApp se instala bajo demanda: la incorporación puede mostrar el flujo de configuración antes de que se instale el paquete del plugin, y el Gateway carga el plugin externo de ClawHub/npm solo cuando el canal está realmente activo.
- Los canales que aceptan mensajes entrantes escritos por bots pueden usar la
  [protección contra bucles de bots](/es/channels/bot-loop-protection) compartida para evitar que pares de bots se respondan entre sí indefinidamente.
- Las salas siempre activas compatibles pueden usar [eventos de sala ambiental](/es/channels/ambient-room-events)
  para que la charla de sala no mencionada se convierta en contexto silencioso, salvo que el agente envíe con la herramienta `message`.

## Notas

- Los canales pueden ejecutarse simultáneamente; configura varios y OpenClaw enrutará por chat.
- La configuración más rápida suele ser **Telegram** (token de bot simple, sin instalación de plugin). WhatsApp requiere emparejamiento con QR y almacena más estado en disco.
- El comportamiento grupal varía según el canal; consulta [Grupos](/es/channels/groups).
- El emparejamiento de MD y las listas de permitidos se aplican por seguridad; consulta [Seguridad](/es/gateway/security).
- Solución de problemas: [Solución de problemas de canales](/es/channels/troubleshooting).
- Los proveedores de modelos se documentan por separado; consulta [Proveedores de modelos](/es/providers/models).
