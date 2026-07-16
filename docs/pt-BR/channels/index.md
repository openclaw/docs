---
read_when:
    - Você quer escolher um canal de chat para o OpenClaw
    - Você precisa de uma visão geral rápida das plataformas de mensagens compatíveis
summary: Plataformas de mensagens às quais o OpenClaw pode se conectar
title: Canais de chat
x-i18n:
    generated_at: "2026-07-16T12:11:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 102ad190f5bdb61fb3610985948e022f03fd54598ed4889da7a443ec0a2bdef3
    source_path: channels/index.md
    workflow: 16
---

O OpenClaw pode conversar com você em qualquer aplicativo de chat que você já usa. Cada canal se conecta por meio do Gateway.
Há suporte a texto em todos os canais; mídia e reações variam conforme o canal.

O iMessage, o Telegram e a interface do WebChat vêm com a instalação principal. Os canais marcados como
"plugin oficial" são instalados com um comando (`openclaw plugins install @openclaw/<id>`)
ou sob demanda durante `openclaw onboard` / `openclaw channels add` e, em seguida, exigem a reinicialização do Gateway.
Os canais de "plugin externo" são mantidos fora do repositório do OpenClaw.

## Canais compatíveis

- [Discord](/pt-BR/channels/discord) - API de bot do Discord + Gateway; compatível com servidores, canais e mensagens diretas (plugin oficial).
- [Feishu](/pt-BR/channels/feishu) - Bot do Feishu/Lark via WebSocket (plugin oficial).
- [Google Chat](/pt-BR/channels/googlechat) - Aplicativo da API do Google Chat via Webhook HTTP (plugin oficial).
- [iMessage](/pt-BR/channels/imessage) - Incluído no núcleo. Integração nativa com o macOS por meio da ponte `imsg` em um Mac com sessão iniciada (ou um wrapper SSH quando o Gateway é executado em outro lugar), incluindo ações de API privada para respostas, tapbacks, efeitos, anexos e gerenciamento de grupos.
- [IRC](/pt-BR/channels/irc) - Servidores IRC clássicos; canais + mensagens diretas com controles de pareamento/lista de permissões (plugin oficial).
- [LINE](/pt-BR/channels/line) - Bot da LINE Messaging API (plugin oficial).
- [Matrix](/pt-BR/channels/matrix) - Protocolo Matrix (plugin oficial).
- [Mattermost](/pt-BR/channels/mattermost) - API de bot + WebSocket; canais, grupos e mensagens diretas (plugin oficial).
- [Microsoft Teams](/pt-BR/channels/msteams) - Bot Framework; suporte empresarial (plugin oficial).
- [Nextcloud Talk](/pt-BR/channels/nextcloud-talk) - Chat auto-hospedado via Nextcloud Talk (plugin oficial).
- [Nostr](/pt-BR/channels/nostr) - Mensagens diretas descentralizadas via NIP-04 (plugin oficial).
- [QQ Bot](/pt-BR/channels/qqbot) - API do QQ Bot; chat privado, chat em grupo e mídia avançada (plugin oficial).
- [Reef](/channels/reef) - Mensagens protegidas e criptografadas de ponta a ponta entre agentes OpenClaw de pessoas diferentes (plugin incluído).
- [Raft](/pt-BR/channels/raft) - Ponte de ativação da CLI do Raft para colaboração entre pessoas e agentes (plugin oficial).
- [Signal](/pt-BR/channels/signal) - signal-cli; com foco em privacidade (plugin oficial).
- [Slack](/pt-BR/channels/slack) - Bolt SDK; aplicativos de workspace (plugin oficial).
- [SMS](/pt-BR/channels/sms) - SMS fornecido pelo Twilio por meio do Webhook do Gateway (plugin oficial).
- [Synology Chat](/pt-BR/channels/synology-chat) - Chat do Synology NAS via Webhooks de saída e entrada (plugin oficial).
- [Telegram](/pt-BR/channels/telegram) - Incluído no núcleo. API de bot via grammY; compatível com grupos.
- [Tlon](/pt-BR/channels/tlon) - Mensageiro baseado no Urbit (plugin oficial).
- [Twitch](/pt-BR/channels/twitch) - Chat da Twitch via conexão IRC (plugin oficial).
- [Chamada de voz](/pt-BR/plugins/voice-call) - Telefonia via Plivo, Telnyx ou Twilio (plugin oficial).
- [WebChat](/pt-BR/web/webchat) - Incluído no núcleo. Interface do WebChat do Gateway via WebSocket.
- [WeChat](/pt-BR/channels/wechat) - Bot Tencent iLink via login por código QR; somente chats privados (plugin externo).
- [WhatsApp](/pt-BR/channels/whatsapp) - O mais popular; usa Baileys e exige pareamento por código QR (plugin oficial).
- [Yuanbao](/pt-BR/channels/yuanbao) - Bot Tencent Yuanbao (plugin externo).
- [Zalo](/pt-BR/channels/zalo) - API do Zalo Bot; mensageiro popular no Vietnã (plugin oficial).
- [Zalo ClawBot](/pt-BR/channels/zaloclawbot) - Assistente pessoal do Zalo via login por código QR; vinculado ao proprietário (plugin externo).
- [Zalo Personal](/pt-BR/channels/zalouser) - Conta pessoal do Zalo via login por código QR (plugin oficial).

## Observações sobre entrega

- As respostas do Telegram que contêm sintaxe Markdown de imagem, como `![alt](url)`,
  são convertidas em respostas de mídia no caminho final de saída quando possível.
- As mensagens diretas do Slack com várias pessoas são encaminhadas como chats em grupo; portanto, a política de grupos, o comportamento
  de menções e as regras de sessão de grupo se aplicam às conversas MPIM.
- A configuração do WhatsApp ocorre por instalação sob demanda: a integração inicial pode exibir o fluxo de configuração antes
  da instalação do pacote do plugin, e o Gateway carrega o plugin externo
  do ClawHub/npm somente quando o canal está realmente ativo.
- Os canais que aceitam mensagens recebidas criadas por bots podem usar a
  [proteção contra loops de bots](/pt-BR/channels/bot-loop-protection) compartilhada para impedir que pares de bots
  respondam um ao outro indefinidamente.
- As salas permanentemente ativas compatíveis podem usar [eventos ambientes de sala](/pt-BR/channels/ambient-room-events)
  para que conversas na sala sem menções se tornem contexto silencioso, a menos que o agente envie uma mensagem com
  a ferramenta `message`.

## Observações

- Os canais podem ser executados simultaneamente; configure vários e o OpenClaw fará o encaminhamento por chat.
- A configuração mais rápida geralmente é a do **Telegram** (token de bot simples, sem instalação de plugin). O WhatsApp
  exige pareamento por código QR e armazena mais estado em disco.
- O comportamento dos grupos varia conforme o canal; consulte [Grupos](/pt-BR/channels/groups).
- O pareamento de mensagens diretas e as listas de permissões são aplicados por segurança; consulte [Segurança](/pt-BR/gateway/security).
- Solução de problemas: [Solução de problemas de canais](/pt-BR/channels/troubleshooting).
- Os provedores de modelos são documentados separadamente; consulte [Provedores de modelos](/pt-BR/providers/models).
