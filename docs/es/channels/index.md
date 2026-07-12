---
read_when:
    - Quieres elegir un canal de chat para OpenClaw
    - Necesitas una descripción general rápida de las plataformas de mensajería compatibles
summary: Plataformas de mensajería a las que OpenClaw puede conectarse
title: Canales de chat
x-i18n:
    generated_at: "2026-07-11T22:54:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 411b011a8e5dd83d3f30a672c0e8a56251ee8c6ca7cdf3e7dc5c2b1f1b31d73d
    source_path: channels/index.md
    workflow: 16
---

OpenClaw puede comunicarse contigo en cualquier aplicación de chat que ya uses. Cada canal se conecta mediante el Gateway.
El texto es compatible en todas partes; el contenido multimedia y las reacciones varían según el canal.

iMessage, Telegram y la interfaz de WebChat se incluyen con la instalación principal. Los canales marcados como
«Plugin oficial» se instalan con un comando (`openclaw plugins install @openclaw/<id>`)
o bajo demanda durante `openclaw onboard` / `openclaw channels add`, y después requieren reiniciar el Gateway.
Los canales marcados como «Plugin externo» se mantienen fuera del repositorio de OpenClaw.

## Canales compatibles

- [Discord](/es/channels/discord) - API de bots de Discord + Gateway; admite servidores, canales y mensajes directos (Plugin oficial).
- [Feishu](/es/channels/feishu) - Bot de Feishu/Lark mediante WebSocket (Plugin oficial).
- [Google Chat](/es/channels/googlechat) - Aplicación de la API de Google Chat mediante Webhook HTTP (Plugin oficial).
- [iMessage](/es/channels/imessage) - Incluido en el núcleo. Integración nativa con macOS mediante el puente `imsg` en un Mac con una sesión iniciada (o mediante un contenedor SSH cuando el Gateway se ejecuta en otro lugar), incluidas acciones de API privadas para respuestas, reacciones rápidas, efectos, archivos adjuntos y gestión de grupos.
- [IRC](/es/channels/irc) - Servidores IRC clásicos; canales y mensajes directos con controles de emparejamiento y listas de permitidos (Plugin oficial).
- [LINE](/es/channels/line) - Bot de la API de mensajería de LINE (Plugin oficial).
- [Matrix](/es/channels/matrix) - Protocolo Matrix (Plugin oficial).
- [Mattermost](/es/channels/mattermost) - API de bots + WebSocket; canales, grupos y mensajes directos (Plugin oficial).
- [Microsoft Teams](/es/channels/msteams) - Bot Framework; compatibilidad empresarial (Plugin oficial).
- [Nextcloud Talk](/es/channels/nextcloud-talk) - Chat autoalojado mediante Nextcloud Talk (Plugin oficial).
- [Nostr](/es/channels/nostr) - Mensajes directos descentralizados mediante NIP-04 (Plugin oficial).
- [QQ Bot](/es/channels/qqbot) - API de QQ Bot; chats privados, chats grupales y contenido multimedia enriquecido (Plugin oficial).
- [Raft](/es/channels/raft) - Puente de activación de la CLI de Raft para la colaboración entre personas y agentes (Plugin oficial).
- [Signal](/es/channels/signal) - signal-cli; centrado en la privacidad (Plugin oficial).
- [Slack](/es/channels/slack) - SDK de Bolt; aplicaciones para espacios de trabajo (Plugin oficial).
- [SMS](/es/channels/sms) - SMS respaldados por Twilio mediante el Webhook del Gateway (Plugin oficial).
- [Synology Chat](/es/channels/synology-chat) - Chat de Synology NAS mediante webhooks salientes y entrantes (Plugin oficial).
- [Telegram](/es/channels/telegram) - Incluido en el núcleo. API de bots mediante grammY; admite grupos.
- [Tlon](/es/channels/tlon) - Servicio de mensajería basado en Urbit (Plugin oficial).
- [Twitch](/es/channels/twitch) - Chat de Twitch mediante una conexión IRC (Plugin oficial).
- [Llamadas de voz](/es/plugins/voice-call) - Telefonía mediante Plivo, Telnyx o Twilio (Plugin oficial).
- [WebChat](/es/web/webchat) - Incluido en el núcleo. Interfaz WebChat del Gateway mediante WebSocket.
- [WeChat](/es/channels/wechat) - Bot iLink de Tencent mediante inicio de sesión con código QR; solo chats privados (Plugin externo).
- [WhatsApp](/es/channels/whatsapp) - El más popular; usa Baileys y requiere emparejamiento mediante código QR (Plugin oficial).
- [Yuanbao](/es/channels/yuanbao) - Bot Yuanbao de Tencent (Plugin externo).
- [Zalo](/es/channels/zalo) - API de bots de Zalo; popular servicio de mensajería de Vietnam (Plugin oficial).
- [Zalo ClawBot](/es/channels/zaloclawbot) - Asistente personal de Zalo mediante inicio de sesión con código QR; vinculado al propietario (Plugin externo).
- [Zalo Personal](/es/channels/zalouser) - Cuenta personal de Zalo mediante inicio de sesión con código QR (Plugin oficial).

## Notas sobre la entrega

- Las respuestas de Telegram que contienen sintaxis Markdown de imagen, como `![alt](url)`,
  se convierten en respuestas multimedia en la ruta de salida final cuando es posible.
- Los mensajes directos de Slack con varias personas se enrutan como chats grupales, por lo que las
  políticas de grupo, el comportamiento de las menciones y las reglas de las sesiones grupales se aplican a las conversaciones MPIM.
- La configuración de WhatsApp se instala bajo demanda: la incorporación puede mostrar el flujo de configuración antes
  de que se instale el paquete del Plugin, y el Gateway carga el Plugin externo de
  ClawHub/npm únicamente cuando el canal está realmente activo.
- Los canales que aceptan mensajes entrantes escritos por bots pueden usar la
  [protección compartida contra bucles de bots](/es/channels/bot-loop-protection) para evitar que las parejas de bots
  se respondan entre sí indefinidamente.
- Las salas permanentes compatibles pueden usar [eventos ambientales de sala](/es/channels/ambient-room-events)
  para que la conversación de la sala que no mencione al agente se convierta en contexto silencioso, salvo que el agente envíe un mensaje con
  la herramienta `message`.

## Notas

- Los canales pueden ejecutarse simultáneamente; configura varios y OpenClaw dirigirá los mensajes según el chat.
- La configuración más rápida suele ser **Telegram** (un token de bot sencillo y sin instalar ningún Plugin). WhatsApp
  requiere emparejamiento mediante código QR y almacena más estado en el disco.
- El comportamiento de los grupos varía según el canal; consulta [Grupos](/es/channels/groups).
- El emparejamiento de mensajes directos y las listas de permitidos se aplican por seguridad; consulta [Seguridad](/es/gateway/security).
- Solución de problemas: [Solución de problemas de los canales](/es/channels/troubleshooting).
- Los proveedores de modelos se documentan por separado; consulta [Proveedores de modelos](/es/providers/models).
