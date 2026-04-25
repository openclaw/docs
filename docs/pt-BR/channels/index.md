---
read_when:
    - Você quer escolher um canal de chat para o OpenClaw
    - Você precisa de uma visão geral rápida das plataformas de mensagens compatíveis
summary: Plataformas de mensagens às quais o OpenClaw pode se conectar
title: Canais de chat
x-i18n:
    generated_at: "2026-04-25T13:41:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: e97818dce89ea06a60f2cccd0cc8a78cba48d66ea39e4769f2b583690a4f75d0
    source_path: channels/index.md
    workflow: 15
---

O OpenClaw pode falar com você em qualquer aplicativo de chat que você já usa. Cada canal se conecta por meio do Gateway.
Texto é compatível em todos eles; mídia e reações variam conforme o canal.

## Notas de entrega

- Respostas do Telegram que contêm sintaxe markdown de imagem, como `![alt](url)`,
  são convertidas em respostas com mídia no caminho final de saída quando possível.
- DMs com várias pessoas no Slack são roteadas como chats em grupo, então a política de grupo, o comportamento de menção
  e as regras de sessão em grupo se aplicam às conversas MPIM.
- A configuração do WhatsApp é sob demanda na instalação: o onboarding pode mostrar o fluxo de configuração antes
  de as dependências de runtime do Baileys serem preparadas, e o Gateway carrega o runtime do WhatsApp
  somente quando o canal está realmente ativo.

## Canais compatíveis

- [BlueBubbles](/pt-BR/channels/bluebubbles) — **Recomendado para iMessage**; usa a API REST do servidor macOS BlueBubbles com suporte completo a recursos (Plugin incluído; editar, cancelar envio, efeitos, reações, gerenciamento de grupos — edição atualmente quebrada no macOS 26 Tahoe).
- [Discord](/pt-BR/channels/discord) — API de Bot do Discord + Gateway; oferece suporte a servidores, canais e DMs.
- [Feishu](/pt-BR/channels/feishu) — Bot Feishu/Lark via WebSocket (Plugin incluído).
- [Google Chat](/pt-BR/channels/googlechat) — aplicativo da API do Google Chat via Webhook HTTP.
- [iMessage (legacy)](/pt-BR/channels/imessage) — integração legada com macOS via CLI imsg (obsoleta, use BlueBubbles em novas configurações).
- [IRC](/pt-BR/channels/irc) — servidores IRC clássicos; canais + DMs com controles de pareamento/lista de permissões.
- [LINE](/pt-BR/channels/line) — bot da API de Mensagens do LINE (Plugin incluído).
- [Matrix](/pt-BR/channels/matrix) — protocolo Matrix (Plugin incluído).
- [Mattermost](/pt-BR/channels/mattermost) — API de Bot + WebSocket; canais, grupos, DMs (Plugin incluído).
- [Microsoft Teams](/pt-BR/channels/msteams) — Bot Framework; suporte empresarial (Plugin incluído).
- [Nextcloud Talk](/pt-BR/channels/nextcloud-talk) — chat auto-hospedado via Nextcloud Talk (Plugin incluído).
- [Nostr](/pt-BR/channels/nostr) — DMs descentralizadas via NIP-04 (Plugin incluído).
- [QQ Bot](/pt-BR/channels/qqbot) — API do QQ Bot; chat privado, chat em grupo e mídia avançada (Plugin incluído).
- [Signal](/pt-BR/channels/signal) — signal-cli; foco em privacidade.
- [Slack](/pt-BR/channels/slack) — SDK Bolt; aplicativos de workspace.
- [Synology Chat](/pt-BR/channels/synology-chat) — Synology NAS Chat via Webhooks de saída + entrada (Plugin incluído).
- [Telegram](/pt-BR/channels/telegram) — API de Bot via grammY; oferece suporte a grupos.
- [Tlon](/pt-BR/channels/tlon) — mensageiro baseado em Urbit (Plugin incluído).
- [Twitch](/pt-BR/channels/twitch) — chat da Twitch via conexão IRC (Plugin incluído).
- [Voice Call](/pt-BR/plugins/voice-call) — telefonia via Plivo ou Twilio (plugin, instalado separadamente).
- [WebChat](/pt-BR/web/webchat) — interface WebChat do Gateway via WebSocket.
- [WeChat](/pt-BR/channels/wechat) — plugin Tencent iLink Bot via login por QR; somente chats privados (plugin externo).
- [WhatsApp](/pt-BR/channels/whatsapp) — mais popular; usa Baileys e requer pareamento por QR.
- [Zalo](/pt-BR/channels/zalo) — API do Zalo Bot; mensageiro popular no Vietnã (Plugin incluído).
- [Zalo Personal](/pt-BR/channels/zalouser) — conta pessoal do Zalo via login por QR (Plugin incluído).

## Notas

- Os canais podem ser executados simultaneamente; configure vários e o OpenClaw fará o roteamento por chat.
- A configuração mais rápida geralmente é o **Telegram** (token de bot simples). O WhatsApp requer pareamento por QR e
  armazena mais estado em disco.
- O comportamento em grupo varia conforme o canal; consulte [Groups](/pt-BR/channels/groups).
- Pareamento de DM e listas de permissões são aplicados por segurança; consulte [Security](/pt-BR/gateway/security).
- Solução de problemas: [Channel troubleshooting](/pt-BR/channels/troubleshooting).
- Os provedores de modelo são documentados separadamente; consulte [Model Providers](/pt-BR/providers/models).
