---
read_when:
    - Você quer escolher um canal de chat para OpenClaw
    - Você precisa de uma visão geral rápida das plataformas de mensagens compatíveis
summary: Plataformas de mensagens às quais o OpenClaw pode se conectar
title: Canais de chat
x-i18n:
    generated_at: "2026-05-07T01:50:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: ff6875f4ae86b341b6a82e13f022266461bc102ee03074a8c352eea2203d657a
    source_path: channels/index.md
    workflow: 16
---

O OpenClaw pode falar com você em qualquer aplicativo de chat que você já usa. Cada canal se conecta por meio do Gateway.
Texto é compatível em todos os lugares; mídias e reações variam conforme o canal.

## Observações de entrega

- Respostas do Telegram que contêm sintaxe de imagem em markdown, como `![alt](url)`,
  são convertidas em respostas de mídia no caminho final de saída quando possível.
- DMs com várias pessoas no Slack são roteadas como chats em grupo, portanto a política de grupo, o comportamento de menção
  e as regras de sessão de grupo se aplicam a conversas MPIM.
- A configuração do WhatsApp é instalada sob demanda: a integração pode mostrar o fluxo de configuração antes
  que o pacote do Plugin seja instalado, e o Gateway carrega o runtime do WhatsApp
  somente quando o canal está realmente ativo.

## Canais compatíveis

- [BlueBubbles](/pt-BR/channels/bluebubbles) - Ponte legada para iMessage via API REST do servidor macOS BlueBubbles; obsoleta para novas configurações do OpenClaw, mas ainda compatível com configurações existentes e ações de API privada mais avançadas.
- [Discord](/pt-BR/channels/discord) - Discord Bot API + Gateway; oferece suporte a servidores, canais e DMs.
- [Feishu](/pt-BR/channels/feishu) - Bot Feishu/Lark via WebSocket (Plugin incluído).
- [Google Chat](/pt-BR/channels/googlechat) - App Google Chat API via Webhook HTTP (Plugin baixável).
- [iMessage](/pt-BR/channels/imessage) - Integração nativa do macOS via CLI imsg; preferida para novas configurações de iMessage no OpenClaw quando as permissões do host e o acesso ao Messages forem adequados.
- [IRC](/pt-BR/channels/irc) - Servidores IRC clássicos; canais + DMs com controles de pareamento/lista de permissões.
- [LINE](/pt-BR/channels/line) - Bot LINE Messaging API (Plugin baixável).
- [Matrix](/pt-BR/channels/matrix) - Protocolo Matrix (Plugin baixável).
- [Mattermost](/pt-BR/channels/mattermost) - Bot API + WebSocket; canais, grupos, DMs (Plugin baixável).
- [Microsoft Teams](/pt-BR/channels/msteams) - Bot Framework; suporte empresarial (Plugin incluído).
- [Nextcloud Talk](/pt-BR/channels/nextcloud-talk) - Chat auto-hospedado via Nextcloud Talk (Plugin incluído).
- [Nostr](/pt-BR/channels/nostr) - DMs descentralizadas via NIP-04 (Plugin incluído).
- [QQ Bot](/pt-BR/channels/qqbot) - QQ Bot API; chat privado, chat em grupo e mídia avançada (Plugin incluído).
- [Signal](/pt-BR/channels/signal) - signal-cli; focado em privacidade.
- [Slack](/pt-BR/channels/slack) - Bolt SDK; apps de workspace.
- [Synology Chat](/pt-BR/channels/synology-chat) - Synology NAS Chat via Webhooks de saída+entrada (Plugin incluído).
- [Telegram](/pt-BR/channels/telegram) - Bot API via grammY; oferece suporte a grupos.
- [Tlon](/pt-BR/channels/tlon) - Mensageiro baseado em Urbit (Plugin incluído).
- [Twitch](/pt-BR/channels/twitch) - Chat da Twitch via conexão IRC (Plugin incluído).
- [Voice Call](/pt-BR/plugins/voice-call) - Telefonia via Plivo ou Twilio (Plugin, instalado separadamente).
- [WebChat](/pt-BR/web/webchat) - Interface WebChat do Gateway sobre WebSocket.
- [WeChat](/pt-BR/channels/wechat) - Plugin Tencent iLink Bot via login por QR; somente chats privados (Plugin externo).
- [WhatsApp](/pt-BR/channels/whatsapp) - Mais popular; usa Baileys e exige pareamento por QR.
- [Yuanbao](/pt-BR/channels/yuanbao) - Bot Tencent Yuanbao (Plugin externo).
- [Zalo](/pt-BR/channels/zalo) - Zalo Bot API; mensageiro popular do Vietnã (Plugin incluído).
- [Zalo Personal](/pt-BR/channels/zalouser) - Conta pessoal Zalo via login por QR (Plugin incluído).

## Observações

- Canais podem ser executados simultaneamente; configure vários e o OpenClaw roteará por chat.
- A configuração mais rápida geralmente é o **Telegram** (token de bot simples). O WhatsApp exige pareamento por QR e
  armazena mais estado em disco.
- O comportamento de grupo varia conforme o canal; consulte [Grupos](/pt-BR/channels/groups).
- O pareamento de DMs e as listas de permissões são aplicados por segurança; consulte [Segurança](/pt-BR/gateway/security).
- Solução de problemas: [Solução de problemas de canais](/pt-BR/channels/troubleshooting).
- Provedores de modelo são documentados separadamente; consulte [Provedores de modelo](/pt-BR/providers/models).
