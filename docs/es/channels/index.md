---
read_when:
    - Quieres elegir un canal de chat para OpenClaw
    - Necesitas una descripción general rápida de las plataformas de mensajería compatibles
summary: Plataformas de mensajería a las que OpenClaw puede conectarse
title: Canales de chat
x-i18n:
    generated_at: "2026-05-02T20:41:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 785af727e9491914f5a9459672d47c2cfde3319b318c698051cd7e89d023d4b9
    source_path: channels/index.md
    workflow: 16
---

OpenClaw puede hablar contigo en cualquier aplicación de chat que ya uses. Cada canal se conecta mediante el Gateway.
El texto es compatible en todas partes; el contenido multimedia y las reacciones varían según el canal.

## Notas de entrega

- Las respuestas de Telegram que contienen sintaxis de imagen de markdown, como `![alt](url)`,
  se convierten en respuestas multimedia en la ruta de salida final cuando es posible.
- Los DM multipersona de Slack se enrutan como chats grupales, por lo que la política de grupo, el comportamiento
  de menciones y las reglas de sesión grupal se aplican a las conversaciones MPIM.
- La configuración de WhatsApp se instala bajo demanda: la incorporación puede mostrar el flujo de configuración antes
  de que se instale el paquete del plugin, y el Gateway carga el runtime de WhatsApp
  solo cuando el canal está realmente activo.

## Canales compatibles

- [BlueBubbles](/es/channels/bluebubbles) — **Recomendado para iMessage**; usa la API REST del servidor BlueBubbles de macOS con soporte completo de funciones (plugin incluido; editar, deshacer envío, efectos, reacciones, administración de grupos — la edición está rota actualmente en macOS 26 Tahoe).
- [Discord](/es/channels/discord) — API de Bot de Discord + Gateway; admite servidores, canales y DM.
- [Feishu](/es/channels/feishu) — Bot de Feishu/Lark mediante WebSocket (plugin incluido).
- [Google Chat](/es/channels/googlechat) — Aplicación de Google Chat API mediante webhook HTTP (plugin descargable).
- [iMessage (heredado)](/es/channels/imessage) — Integración heredada de macOS mediante la CLI imsg (obsoleta, usa BlueBubbles para configuraciones nuevas).
- [IRC](/es/channels/irc) — Servidores IRC clásicos; canales + DM con controles de emparejamiento/lista de permitidos.
- [LINE](/es/channels/line) — Bot de LINE Messaging API (plugin descargable).
- [Matrix](/es/channels/matrix) — Protocolo Matrix (plugin descargable).
- [Mattermost](/es/channels/mattermost) — API de Bot + WebSocket; canales, grupos, DM (plugin descargable).
- [Microsoft Teams](/es/channels/msteams) — Bot Framework; soporte empresarial (plugin incluido).
- [Nextcloud Talk](/es/channels/nextcloud-talk) — Chat autoalojado mediante Nextcloud Talk (plugin incluido).
- [Nostr](/es/channels/nostr) — DM descentralizados mediante NIP-04 (plugin incluido).
- [QQ Bot](/es/channels/qqbot) — QQ Bot API; chat privado, chat grupal y multimedia enriquecida (plugin incluido).
- [Signal](/es/channels/signal) — signal-cli; centrado en la privacidad.
- [Slack](/es/channels/slack) — Bolt SDK; aplicaciones de workspace.
- [Synology Chat](/es/channels/synology-chat) — Synology NAS Chat mediante webhooks salientes+entrantes (plugin incluido).
- [Telegram](/es/channels/telegram) — Bot API mediante grammY; admite grupos.
- [Tlon](/es/channels/tlon) — Mensajero basado en Urbit (plugin incluido).
- [Twitch](/es/channels/twitch) — Chat de Twitch mediante conexión IRC (plugin incluido).
- [Llamada de voz](/es/plugins/voice-call) — Telefonía mediante Plivo o Twilio (plugin, instalado por separado).
- [WebChat](/es/web/webchat) — IU WebChat del Gateway sobre WebSocket.
- [WeChat](/es/channels/wechat) — Plugin Tencent iLink Bot mediante inicio de sesión con QR; solo chats privados (plugin externo).
- [WhatsApp](/es/channels/whatsapp) — El más popular; usa Baileys y requiere emparejamiento con QR.
- [Yuanbao](/es/channels/yuanbao) — Bot Tencent Yuanbao (plugin externo).
- [Zalo](/es/channels/zalo) — Zalo Bot API; mensajero popular de Vietnam (plugin incluido).
- [Zalo Personal](/es/channels/zalouser) — Cuenta personal de Zalo mediante inicio de sesión con QR (plugin incluido).

## Notas

- Los canales pueden ejecutarse simultáneamente; configura varios y OpenClaw enrutará por chat.
- La configuración más rápida suele ser **Telegram** (token de bot simple). WhatsApp requiere emparejamiento con QR y
  almacena más estado en disco.
- El comportamiento de grupo varía según el canal; consulta [Grupos](/es/channels/groups).
- El emparejamiento de DM y las listas de permitidos se aplican por seguridad; consulta [Seguridad](/es/gateway/security).
- Solución de problemas: [Solución de problemas de canales](/es/channels/troubleshooting).
- Los proveedores de modelos se documentan por separado; consulta [Proveedores de modelos](/es/providers/models).
