---
read_when:
    - Quiere elegir un canal de chat para OpenClaw
    - Necesita una descripción general rápida de las plataformas de mensajería compatibles.
summary: Plataformas de mensajería a las que OpenClaw puede conectarse
title: Canales de chat
x-i18n:
    generated_at: "2026-07-14T13:27:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 102ad190f5bdb61fb3610985948e022f03fd54598ed4889da7a443ec0a2bdef3
    source_path: channels/index.md
    workflow: 16
---

OpenClaw puede comunicarse contigo en cualquier aplicación de chat que ya utilices. Cada canal se conecta mediante el Gateway.
El texto es compatible en todas partes; el contenido multimedia y las reacciones varían según el canal.

iMessage, Telegram y la interfaz de WebChat se incluyen con la instalación del núcleo. Los canales marcados como
«plugin oficial» se instalan con un solo comando (`openclaw plugins install @openclaw/<id>`)
o bajo demanda durante `openclaw onboard` / `openclaw channels add`, y después requieren reiniciar el Gateway.
Los canales de «plugin externo» se mantienen fuera del repositorio de OpenClaw.

## Canales compatibles

- [Discord](/es/channels/discord) - API de bots de Discord + Gateway; admite servidores, canales y mensajes directos (plugin oficial).
- [Feishu](/es/channels/feishu) - Bot de Feishu/Lark mediante WebSocket (plugin oficial).
- [Google Chat](/es/channels/googlechat) - Aplicación de la API de Google Chat mediante Webhook HTTP (plugin oficial).
- [iMessage](/es/channels/imessage) - Incluido en el núcleo. Integración nativa con macOS mediante el puente `imsg` en un Mac con una sesión iniciada (o un contenedor SSH cuando el Gateway se ejecuta en otro lugar), incluidas acciones de API privada para respuestas, tapbacks, efectos, archivos adjuntos y gestión de grupos.
- [IRC](/es/channels/irc) - Servidores IRC clásicos; canales y mensajes directos con controles de emparejamiento/listas de permitidos (plugin oficial).
- [LINE](/es/channels/line) - Bot de la API de mensajería de LINE (plugin oficial).
- [Matrix](/es/channels/matrix) - Protocolo Matrix (plugin oficial).
- [Mattermost](/es/channels/mattermost) - API de bots + WebSocket; canales, grupos y mensajes directos (plugin oficial).
- [Microsoft Teams](/es/channels/msteams) - Bot Framework; compatibilidad empresarial (plugin oficial).
- [Nextcloud Talk](/es/channels/nextcloud-talk) - Chat autoalojado mediante Nextcloud Talk (plugin oficial).
- [Nostr](/es/channels/nostr) - Mensajes directos descentralizados mediante NIP-04 (plugin oficial).
- [QQ Bot](/es/channels/qqbot) - API de QQ Bot; chat privado, chat grupal y contenido multimedia enriquecido (plugin oficial).
- [Reef](/channels/reef) - Mensajería protegida y cifrada de extremo a extremo entre agentes de OpenClaw de distintas personas (plugin incluido).
- [Raft](/es/channels/raft) - Puente de activación de la CLI de Raft para la colaboración entre personas y agentes (plugin oficial).
- [Signal](/es/channels/signal) - signal-cli; centrado en la privacidad (plugin oficial).
- [Slack](/es/channels/slack) - SDK de Bolt; aplicaciones para espacios de trabajo (plugin oficial).
- [SMS](/es/channels/sms) - SMS respaldados por Twilio mediante el Webhook del Gateway (plugin oficial).
- [Synology Chat](/es/channels/synology-chat) - Chat de Synology NAS mediante webhooks salientes y entrantes (plugin oficial).
- [Telegram](/es/channels/telegram) - Incluido en el núcleo. API de bots mediante grammY; admite grupos.
- [Tlon](/es/channels/tlon) - Servicio de mensajería basado en Urbit (plugin oficial).
- [Twitch](/es/channels/twitch) - Chat de Twitch mediante una conexión IRC (plugin oficial).
- [Llamada de voz](/es/plugins/voice-call) - Telefonía mediante Plivo, Telnyx o Twilio (plugin oficial).
- [WebChat](/es/web/webchat) - Incluido en el núcleo. Interfaz de WebChat del Gateway mediante WebSocket.
- [WeChat](/es/channels/wechat) - Bot iLink de Tencent mediante inicio de sesión con QR; solo chats privados (plugin externo).
- [WhatsApp](/es/channels/whatsapp) - El más popular; utiliza Baileys y requiere emparejamiento mediante QR (plugin oficial).
- [Yuanbao](/es/channels/yuanbao) - Bot Yuanbao de Tencent (plugin externo).
- [Zalo](/es/channels/zalo) - API de bots de Zalo; popular servicio de mensajería de Vietnam (plugin oficial).
- [Zalo ClawBot](/es/channels/zaloclawbot) - Asistente personal de Zalo mediante inicio de sesión con QR; vinculado al propietario (plugin externo).
- [Zalo Personal](/es/channels/zalouser) - Cuenta personal de Zalo mediante inicio de sesión con QR (plugin oficial).

## Notas de entrega

- Las respuestas de Telegram que contienen sintaxis Markdown de imagen, como `![alt](url)`,
  se convierten en respuestas multimedia en la ruta de salida final cuando es posible.
- Los mensajes directos de varias personas en Slack se enrutan como chats grupales, por lo que las políticas de grupo, el comportamiento
  de las menciones y las reglas de las sesiones grupales se aplican a las conversaciones MPIM.
- La configuración de WhatsApp se instala bajo demanda: la incorporación puede mostrar el flujo de configuración antes
  de que se instale el paquete del plugin, y el Gateway carga el plugin externo
  de ClawHub/npm solo cuando el canal está realmente activo.
- Los canales que aceptan mensajes entrantes generados por bots pueden utilizar la
  [protección contra bucles de bots](/es/channels/bot-loop-protection) compartida para evitar que parejas de bots
  se respondan entre sí indefinidamente.
- Las salas permanentes compatibles pueden utilizar [eventos ambientales de sala](/es/channels/ambient-room-events)
  para que la conversación de la sala sin menciones se convierta en contexto silencioso, salvo que el agente envíe mediante
  la herramienta `message`.

## Notas

- Los canales pueden ejecutarse simultáneamente; configura varios y OpenClaw realizará el enrutamiento según el chat.
- La configuración más rápida suele ser **Telegram** (token de bot sencillo, sin instalar ningún plugin). WhatsApp
  requiere emparejamiento mediante QR y almacena más estado en el disco.
- El comportamiento de los grupos varía según el canal; consulta [Grupos](/es/channels/groups).
- El emparejamiento de mensajes directos y las listas de permitidos se aplican por seguridad; consulta [Seguridad](/es/gateway/security).
- Solución de problemas: [Solución de problemas de canales](/es/channels/troubleshooting).
- Los proveedores de modelos se documentan por separado; consulta [Proveedores de modelos](/es/providers/models).
