---
read_when:
    - Desea elegir un canal de chat para OpenClaw
    - Necesitas una descripción general rápida de las plataformas de mensajería compatibles
summary: Plataformas de mensajería a las que OpenClaw puede conectarse
title: Canales de chat
x-i18n:
    generated_at: "2026-06-27T10:39:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3ff3e59df21d71f0d80eff2a6299169bfeb15964834a552f3c4c1d5b7c144b8d
    source_path: channels/index.md
    workflow: 16
---

OpenClaw puede hablar contigo en cualquier aplicación de chat que ya uses. Cada canal se conecta mediante el Gateway.
El texto se admite en todas partes; los medios y las reacciones varían según el canal.

## Notas de entrega

- Las respuestas de Telegram que contienen sintaxis de imagen de markdown, como `![alt](url)`,
  se convierten en respuestas multimedia en la ruta final de salida cuando es posible.
- Los DM de varias personas de Slack se enrutan como chats grupales, por lo que la política de grupos, el comportamiento de menciones
  y las reglas de sesión grupal se aplican a las conversaciones MPIM.
- La configuración de WhatsApp se instala bajo demanda: la incorporación puede mostrar el flujo de configuración antes
  de que el paquete del Plugin esté instalado, y el Gateway carga el Plugin externo de
  ClawHub/npm solo cuando el canal está realmente activo.
- Los canales que aceptan mensajes entrantes escritos por bots pueden usar la
  [protección contra bucles de bots](/es/channels/bot-loop-protection) compartida para evitar que pares de bots se
  respondan indefinidamente.
- Las salas siempre activas admitidas pueden usar [eventos de sala ambiental](/es/channels/ambient-room-events)
  para que la conversación de sala sin menciones se convierta en contexto silencioso a menos que el agente envíe con
  la herramienta `message`.

## Canales admitidos

- [Discord](/es/channels/discord) - Discord Bot API + Gateway; admite servidores, canales y DM.
- [Feishu](/es/channels/feishu) - Bot de Feishu/Lark mediante WebSocket (Plugin incluido).
- [Google Chat](/es/channels/googlechat) - Aplicación de Google Chat API mediante Webhook HTTP (Plugin descargable).
- [iMessage](/es/channels/imessage) - Integración nativa de macOS mediante el puente `imsg` en un Mac con sesión iniciada (o envoltorio SSH cuando el Gateway se ejecuta en otro lugar), incluidas acciones de API privada para respuestas, tapbacks, efectos, adjuntos y gestión de grupos. Preferido para nuevas configuraciones de iMessage de OpenClaw cuando los permisos del host y el acceso a Messages encajan.
- [IRC](/es/channels/irc) - Servidores IRC clásicos; canales + DM con controles de emparejamiento/lista de permitidos.
- [LINE](/es/channels/line) - Bot de LINE Messaging API (Plugin descargable).
- [Matrix](/es/channels/matrix) - Protocolo Matrix (Plugin descargable).
- [Mattermost](/es/channels/mattermost) - Bot API + WebSocket; canales, grupos, DM (Plugin descargable).
- [Microsoft Teams](/es/channels/msteams) - Bot Framework; soporte empresarial (Plugin incluido).
- [Nextcloud Talk](/es/channels/nextcloud-talk) - Chat autoalojado mediante Nextcloud Talk (Plugin incluido).
- [Nostr](/es/channels/nostr) - DM descentralizados mediante NIP-04 (Plugin incluido).
- [QQ Bot](/es/channels/qqbot) - QQ Bot API; chat privado, chat grupal y medios enriquecidos (Plugin incluido).
- [Raft](/es/channels/raft) - Puente de activación de Raft CLI para colaboración entre humanos y agentes (Plugin externo).
- [Signal](/es/channels/signal) - signal-cli; centrado en la privacidad.
- [Slack](/es/channels/slack) - Bolt SDK; aplicaciones de espacio de trabajo.
- [SMS](/es/channels/sms) - SMS respaldados por Twilio mediante el Webhook del Gateway (Plugin oficial).
- [Synology Chat](/es/channels/synology-chat) - Synology NAS Chat mediante Webhooks salientes+entrantes (Plugin incluido).
- [Telegram](/es/channels/telegram) - Bot API mediante grammY; admite grupos.
- [Tlon](/es/channels/tlon) - Mensajero basado en Urbit (Plugin incluido).
- [Twitch](/es/channels/twitch) - Chat de Twitch mediante conexión IRC (Plugin incluido).
- [Voice Call](/es/plugins/voice-call) - Telefonía mediante Plivo o Twilio (Plugin, instalado por separado).
- [WebChat](/es/web/webchat) - Interfaz de WebChat del Gateway sobre WebSocket.
- [WeChat](/es/channels/wechat) - Plugin de Tencent iLink Bot mediante inicio de sesión por QR; solo chats privados (Plugin externo).
- [WhatsApp](/es/channels/whatsapp) - El más popular; usa Baileys y requiere emparejamiento por QR.
- [Yuanbao](/es/channels/yuanbao) - Bot de Tencent Yuanbao (Plugin externo).
- [Zalo](/es/channels/zalo) - Zalo Bot API; mensajero popular de Vietnam (Plugin incluido).
- [Zalo ClawBot](/es/channels/zaloclawbot) - Asistente personal de Zalo mediante inicio de sesión por QR; vinculado al propietario (Plugin externo).
- [Zalo Personal](/es/channels/zalouser) - Cuenta personal de Zalo mediante inicio de sesión por QR (Plugin incluido).

## Notas

- Los canales pueden ejecutarse simultáneamente; configura varios y OpenClaw enrutará por chat.
- La configuración más rápida suele ser **Telegram** (token de bot simple). WhatsApp requiere emparejamiento por QR y
  almacena más estado en disco.
- El comportamiento de grupos varía según el canal; consulta [Grupos](/es/channels/groups).
- El emparejamiento de DM y las listas de permitidos se aplican por seguridad; consulta [Seguridad](/es/gateway/security).
- Solución de problemas: [Solución de problemas de canales](/es/channels/troubleshooting).
- Los proveedores de modelos se documentan por separado; consulta [Proveedores de modelos](/es/providers/models).
