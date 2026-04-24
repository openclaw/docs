---
read_when:
    - Você quer escolher um canal de chat para o OpenClaw
    - Você precisa de uma visão geral rápida das plataformas de mensagens compatíveis
summary: Plataformas de mensagens às quais o OpenClaw pode se conectar
title: Canais de chat
x-i18n:
    generated_at: "2026-04-24T05:41:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: c016b78b16724e73b21946d6bed0009f4cbebd1f887620431b9b4bff70f2b1ff
    source_path: channels/index.md
    workflow: 15
---

O OpenClaw pode falar com você em qualquer aplicativo de chat que você já usa. Cada canal se conecta via Gateway.
Texto é compatível em todos; mídia e reações variam por canal.

## Canais compatíveis

- [BlueBubbles](/pt-BR/channels/bluebubbles) — **Recomendado para iMessage**; usa a API REST do servidor BlueBubbles no macOS com suporte completo a recursos (Plugin integrado; editar, cancelar envio, efeitos, reações, gerenciamento de grupos — edição atualmente quebrada no macOS 26 Tahoe).
- [Discord](/pt-BR/channels/discord) — API de Bot do Discord + Gateway; oferece suporte a servidores, canais e DMs.
- [Feishu](/pt-BR/channels/feishu) — Bot Feishu/Lark via WebSocket (Plugin integrado).
- [Google Chat](/pt-BR/channels/googlechat) — aplicativo da API do Google Chat via Webhook HTTP.
- [iMessage (legado)](/pt-BR/channels/imessage) — Integração legada com macOS via CLI imsg (obsoleto, use BlueBubbles em novas configurações).
- [IRC](/pt-BR/channels/irc) — Servidores IRC clássicos; canais + DMs com controles de pareamento/lista de permissões.
- [LINE](/pt-BR/channels/line) — Bot da API de mensagens do LINE (Plugin integrado).
- [Matrix](/pt-BR/channels/matrix) — Protocolo Matrix (Plugin integrado).
- [Mattermost](/pt-BR/channels/mattermost) — API de Bot + WebSocket; canais, grupos, DMs (Plugin integrado).
- [Microsoft Teams](/pt-BR/channels/msteams) — Bot Framework; suporte empresarial (Plugin integrado).
- [Nextcloud Talk](/pt-BR/channels/nextcloud-talk) — Chat auto-hospedado via Nextcloud Talk (Plugin integrado).
- [Nostr](/pt-BR/channels/nostr) — DMs descentralizadas via NIP-04 (Plugin integrado).
- [QQ Bot](/pt-BR/channels/qqbot) — API do QQ Bot; chat privado, chat em grupo e mídia avançada (Plugin integrado).
- [Signal](/pt-BR/channels/signal) — signal-cli; foco em privacidade.
- [Slack](/pt-BR/channels/slack) — SDK Bolt; aplicativos de workspace.
- [Synology Chat](/pt-BR/channels/synology-chat) — Chat da Synology NAS via webhooks de saída + entrada (Plugin integrado).
- [Telegram](/pt-BR/channels/telegram) — API de Bot via grammY; oferece suporte a grupos.
- [Tlon](/pt-BR/channels/tlon) — Mensageiro baseado em Urbit (Plugin integrado).
- [Twitch](/pt-BR/channels/twitch) — Chat da Twitch via conexão IRC (Plugin integrado).
- [Voice Call](/pt-BR/plugins/voice-call) — Telefonia via Plivo ou Twilio (plugin, instalado separadamente).
- [WebChat](/pt-BR/web/webchat) — UI do Gateway WebChat via WebSocket.
- [WeChat](/pt-BR/channels/wechat) — Plugin de Bot Tencent iLink via login por QR; apenas chats privados (plugin externo).
- [WhatsApp](/pt-BR/channels/whatsapp) — O mais popular; usa Baileys e exige pareamento por QR.
- [Zalo](/pt-BR/channels/zalo) — API de Bot do Zalo; mensageiro popular do Vietnã (Plugin integrado).
- [Zalo Personal](/pt-BR/channels/zalouser) — Conta pessoal do Zalo via login por QR (Plugin integrado).

## Observações

- Os canais podem ser executados simultaneamente; configure vários e o OpenClaw fará o roteamento por chat.
- A configuração mais rápida geralmente é o **Telegram** (token de bot simples). O WhatsApp exige pareamento por QR e armazena mais estado em disco.
- O comportamento em grupos varia por canal; consulte [Grupos](/pt-BR/channels/groups).
- Pareamento de DMs e listas de permissões são aplicados por segurança; consulte [Segurança](/pt-BR/gateway/security).
- Solução de problemas: [Solução de problemas de canais](/pt-BR/channels/troubleshooting).
- Os providers de modelo são documentados separadamente; consulte [Providers de modelos](/pt-BR/providers/models).
