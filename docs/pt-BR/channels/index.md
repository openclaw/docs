---
read_when:
    - Você quer escolher um canal de chat para o OpenClaw
    - Você precisa de uma visão geral rápida das plataformas de mensagens compatíveis
summary: Plataformas de mensagens às quais o OpenClaw pode se conectar
title: Canais de chat
x-i18n:
    generated_at: "2026-06-27T17:10:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3ff3e59df21d71f0d80eff2a6299169bfeb15964834a552f3c4c1d5b7c144b8d
    source_path: channels/index.md
    workflow: 16
---

OpenClaw pode falar com você em qualquer aplicativo de chat que você já usa. Cada canal se conecta via Gateway.
Texto é compatível em todos os lugares; mídia e reações variam por canal.

## Notas de entrega

- Respostas do Telegram que contêm sintaxe de imagem em markdown, como `![alt](url)`,
  são convertidas em respostas de mídia no caminho final de saída quando possível.
- DMs com várias pessoas no Slack são roteadas como chats em grupo, portanto a política de grupo, o comportamento de menções
  e as regras de sessão em grupo se aplicam a conversas MPIM.
- A configuração do WhatsApp é instalada sob demanda: a integração inicial pode mostrar o fluxo de configuração antes
  que o pacote do Plugin seja instalado, e o Gateway carrega o Plugin externo
  do ClawHub/npm somente quando o canal está realmente ativo.
- Canais que aceitam mensagens de entrada criadas por bots podem usar a
  [proteção contra loop de bots](/pt-BR/channels/bot-loop-protection) compartilhada para impedir que pares de bots
  respondam um ao outro indefinidamente.
- Salas sempre ativas compatíveis podem usar [eventos de sala ambiente](/pt-BR/channels/ambient-room-events)
  para que conversas de sala sem menção virem contexto silencioso, a menos que o agente envie com
  a ferramenta `message`.

## Canais compatíveis

- [Discord](/pt-BR/channels/discord) - API do Discord Bot + Gateway; oferece suporte a servidores, canais e DMs.
- [Feishu](/pt-BR/channels/feishu) - Bot do Feishu/Lark via WebSocket (Plugin incluído).
- [Google Chat](/pt-BR/channels/googlechat) - Aplicativo da API do Google Chat via Webhook HTTP (Plugin baixável).
- [iMessage](/pt-BR/channels/imessage) - Integração nativa do macOS via ponte `imsg` em um Mac com sessão iniciada (ou wrapper SSH quando o Gateway é executado em outro lugar), incluindo ações de API privada para respostas, tapbacks, efeitos, anexos e gerenciamento de grupos. Preferencial para novas configurações de iMessage no OpenClaw quando as permissões do host e o acesso ao Mensagens se ajustam.
- [IRC](/pt-BR/channels/irc) - Servidores IRC clássicos; canais + DMs com controles de pareamento/lista de permissões.
- [LINE](/pt-BR/channels/line) - Bot da LINE Messaging API (Plugin baixável).
- [Matrix](/pt-BR/channels/matrix) - Protocolo Matrix (Plugin baixável).
- [Mattermost](/pt-BR/channels/mattermost) - API de Bot + WebSocket; canais, grupos, DMs (Plugin baixável).
- [Microsoft Teams](/pt-BR/channels/msteams) - Bot Framework; suporte empresarial (Plugin incluído).
- [Nextcloud Talk](/pt-BR/channels/nextcloud-talk) - Chat auto-hospedado via Nextcloud Talk (Plugin incluído).
- [Nostr](/pt-BR/channels/nostr) - DMs descentralizadas via NIP-04 (Plugin incluído).
- [QQ Bot](/pt-BR/channels/qqbot) - API do QQ Bot; chat privado, chat em grupo e mídia avançada (Plugin incluído).
- [Raft](/pt-BR/channels/raft) - Ponte de ativação da CLI do Raft para colaboração entre humanos e agentes (Plugin externo).
- [Signal](/pt-BR/channels/signal) - signal-cli; focado em privacidade.
- [Slack](/pt-BR/channels/slack) - Bolt SDK; aplicativos de workspace.
- [SMS](/pt-BR/channels/sms) - SMS com suporte do Twilio por meio do Webhook do Gateway (Plugin oficial).
- [Synology Chat](/pt-BR/channels/synology-chat) - Synology NAS Chat via Webhooks de saída+entrada (Plugin incluído).
- [Telegram](/pt-BR/channels/telegram) - API de Bot via grammY; oferece suporte a grupos.
- [Tlon](/pt-BR/channels/tlon) - Mensageiro baseado em Urbit (Plugin incluído).
- [Twitch](/pt-BR/channels/twitch) - Chat da Twitch via conexão IRC (Plugin incluído).
- [Voice Call](/pt-BR/plugins/voice-call) - Telefonia via Plivo ou Twilio (Plugin, instalado separadamente).
- [WebChat](/pt-BR/web/webchat) - Interface de WebChat do Gateway sobre WebSocket.
- [WeChat](/pt-BR/channels/wechat) - Plugin Tencent iLink Bot via login por QR; somente chats privados (Plugin externo).
- [WhatsApp](/pt-BR/channels/whatsapp) - Mais popular; usa Baileys e exige pareamento por QR.
- [Yuanbao](/pt-BR/channels/yuanbao) - Bot Tencent Yuanbao (Plugin externo).
- [Zalo](/pt-BR/channels/zalo) - API do Zalo Bot; mensageiro popular do Vietnã (Plugin incluído).
- [Zalo ClawBot](/pt-BR/channels/zaloclawbot) - Assistente pessoal do Zalo via login por QR; vinculado ao proprietário (Plugin externo).
- [Zalo Personal](/pt-BR/channels/zalouser) - Conta pessoal do Zalo via login por QR (Plugin incluído).

## Observações

- Canais podem ser executados simultaneamente; configure vários e o OpenClaw roteará por chat.
- A configuração mais rápida geralmente é **Telegram** (token de bot simples). WhatsApp exige pareamento por QR e
  armazena mais estado em disco.
- O comportamento de grupo varia por canal; consulte [Grupos](/pt-BR/channels/groups).
- Pareamento de DMs e listas de permissões são aplicados por segurança; consulte [Segurança](/pt-BR/gateway/security).
- Solução de problemas: [Solução de problemas de canais](/pt-BR/channels/troubleshooting).
- Provedores de modelos são documentados separadamente; consulte [Provedores de modelos](/pt-BR/providers/models).
