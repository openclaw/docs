---
read_when:
    - Você quer escolher um canal de chat para o OpenClaw
    - Você precisa de uma visão geral rápida das plataformas de mensagens compatíveis
summary: Plataformas de mensagens às quais o OpenClaw pode se conectar
title: Canais de chat
x-i18n:
    generated_at: "2026-05-10T19:21:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 57ae81a99d265abbf3f9f016506e787d66b4f6984d833e43e7a8554e157a3c17
    source_path: channels/index.md
    workflow: 16
---

O OpenClaw pode falar com você em qualquer aplicativo de chat que você já usa. Cada canal se conecta por meio do Gateway.
Texto é compatível em todos os lugares; mídia e reações variam conforme o canal.

## Observações de entrega

- Respostas do Telegram que contêm sintaxe de imagem em Markdown, como `![alt](url)`,
  são convertidas em respostas de mídia no caminho final de saída quando possível.
- DMs com várias pessoas no Slack são roteadas como chats em grupo, portanto a política de grupo, o comportamento
  de menções e as regras de sessão em grupo se aplicam a conversas MPIM.
- A configuração do WhatsApp é instalada sob demanda: o onboarding pode mostrar o fluxo de configuração antes
  que o pacote do Plugin seja instalado, e o Gateway carrega o runtime do WhatsApp
  somente quando o canal está realmente ativo.

## Canais compatíveis

- [Discord](/pt-BR/channels/discord) - API de Bot do Discord + Gateway; compatível com servidores, canais e DMs.
- [Feishu](/pt-BR/channels/feishu) - Bot do Feishu/Lark via WebSocket (Plugin incluído).
- [Google Chat](/pt-BR/channels/googlechat) - Aplicativo da API do Google Chat via Webhook HTTP (Plugin baixável).
- [iMessage](/pt-BR/channels/imessage) - Integração nativa com macOS via ponte `imsg` em um Mac com sessão iniciada (ou wrapper SSH quando o Gateway é executado em outro lugar), incluindo ações de API privada para respostas, tapbacks, efeitos, anexos e gerenciamento de grupos. Preferido para novas configurações do iMessage no OpenClaw quando as permissões do host e o acesso ao Mensagens são adequados.
- [IRC](/pt-BR/channels/irc) - Servidores IRC clássicos; canais + DMs com controles de pareamento/lista de permissões.
- [LINE](/pt-BR/channels/line) - Bot da API de Mensagens do LINE (Plugin baixável).
- [Matrix](/pt-BR/channels/matrix) - Protocolo Matrix (Plugin baixável).
- [Mattermost](/pt-BR/channels/mattermost) - API de Bot + WebSocket; canais, grupos, DMs (Plugin baixável).
- [Microsoft Teams](/pt-BR/channels/msteams) - Bot Framework; suporte empresarial (Plugin incluído).
- [Nextcloud Talk](/pt-BR/channels/nextcloud-talk) - Chat auto-hospedado via Nextcloud Talk (Plugin incluído).
- [Nostr](/pt-BR/channels/nostr) - DMs descentralizadas via NIP-04 (Plugin incluído).
- [QQ Bot](/pt-BR/channels/qqbot) - API do QQ Bot; chat privado, chat em grupo e mídia avançada (Plugin incluído).
- [Signal](/pt-BR/channels/signal) - signal-cli; com foco em privacidade.
- [Slack](/pt-BR/channels/slack) - Bolt SDK; aplicativos de workspace.
- [Synology Chat](/pt-BR/channels/synology-chat) - Synology NAS Chat via Webhooks de saída+entrada (Plugin incluído).
- [Telegram](/pt-BR/channels/telegram) - API de Bot via grammY; compatível com grupos.
- [Tlon](/pt-BR/channels/tlon) - Mensageiro baseado em Urbit (Plugin incluído).
- [Twitch](/pt-BR/channels/twitch) - Chat da Twitch via conexão IRC (Plugin incluído).
- [Voice Call](/pt-BR/plugins/voice-call) - Telefonia via Plivo ou Twilio (Plugin, instalado separadamente).
- [WebChat](/pt-BR/web/webchat) - Interface do WebChat do Gateway por WebSocket.
- [WeChat](/pt-BR/channels/wechat) - Plugin Tencent iLink Bot via login por QR; somente chats privados (Plugin externo).
- [WhatsApp](/pt-BR/channels/whatsapp) - Mais popular; usa Baileys e requer pareamento por QR.
- [Yuanbao](/pt-BR/channels/yuanbao) - Bot Tencent Yuanbao (Plugin externo).
- [Zalo](/pt-BR/channels/zalo) - API do Zalo Bot; mensageiro popular do Vietnã (Plugin incluído).
- [Zalo Personal](/pt-BR/channels/zalouser) - Conta pessoal do Zalo via login por QR (Plugin incluído).

## Observações

- Os canais podem ser executados simultaneamente; configure vários e o OpenClaw roteará por chat.
- A configuração mais rápida geralmente é o **Telegram** (token de bot simples). O WhatsApp requer pareamento por QR e
  armazena mais estado em disco.
- O comportamento em grupo varia conforme o canal; consulte [Grupos](/pt-BR/channels/groups).
- O pareamento de DMs e as listas de permissões são aplicados por segurança; consulte [Segurança](/pt-BR/gateway/security).
- Solução de problemas: [Solução de problemas de canais](/pt-BR/channels/troubleshooting).
- Provedores de modelo são documentados separadamente; consulte [Provedores de modelo](/pt-BR/providers/models).
