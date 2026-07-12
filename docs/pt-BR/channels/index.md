---
read_when:
    - Você quer escolher um canal de chat para o OpenClaw
    - Você precisa de uma visão geral rápida das plataformas de mensagens compatíveis
summary: Plataformas de mensagens às quais o OpenClaw pode se conectar
title: Canais de chat
x-i18n:
    generated_at: "2026-07-11T23:43:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 411b011a8e5dd83d3f30a672c0e8a56251ee8c6ca7cdf3e7dc5c2b1f1b31d73d
    source_path: channels/index.md
    workflow: 16
---

O OpenClaw pode conversar com você em qualquer aplicativo de mensagens que você já usa. Cada canal se conecta por meio do Gateway.
Há suporte a texto em todos os canais; mídias e reações variam conforme o canal.

O iMessage, o Telegram e a interface WebChat vêm com a instalação principal. Os canais marcados como
"plugin oficial" são instalados com um comando (`openclaw plugins install @openclaw/<id>`)
ou sob demanda durante `openclaw onboard` / `openclaw channels add` e, em seguida, exigem a reinicialização
do Gateway. Os canais marcados como "plugin externo" são mantidos fora do repositório do OpenClaw.

## Canais compatíveis

- [Discord](/pt-BR/channels/discord) - API de Bot do Discord + Gateway; compatível com servidores, canais e mensagens diretas (plugin oficial).
- [Feishu](/pt-BR/channels/feishu) - Bot do Feishu/Lark via WebSocket (plugin oficial).
- [Google Chat](/pt-BR/channels/googlechat) - Aplicativo da API do Google Chat via Webhook HTTP (plugin oficial).
- [iMessage](/pt-BR/channels/imessage) - Incluído no núcleo. Integração nativa com o macOS por meio da ponte `imsg` em um Mac com sessão iniciada (ou um invólucro SSH quando o Gateway é executado em outro lugar), incluindo ações de API privada para respostas, tapbacks, efeitos, anexos e gerenciamento de grupos.
- [IRC](/pt-BR/channels/irc) - Servidores IRC clássicos; canais e mensagens diretas com controles de pareamento/lista de permissões (plugin oficial).
- [LINE](/pt-BR/channels/line) - Bot da API de Mensagens do LINE (plugin oficial).
- [Matrix](/pt-BR/channels/matrix) - Protocolo Matrix (plugin oficial).
- [Mattermost](/pt-BR/channels/mattermost) - API de Bot + WebSocket; canais, grupos e mensagens diretas (plugin oficial).
- [Microsoft Teams](/pt-BR/channels/msteams) - Bot Framework; suporte empresarial (plugin oficial).
- [Nextcloud Talk](/pt-BR/channels/nextcloud-talk) - Chat auto-hospedado por meio do Nextcloud Talk (plugin oficial).
- [Nostr](/pt-BR/channels/nostr) - Mensagens diretas descentralizadas via NIP-04 (plugin oficial).
- [QQ Bot](/pt-BR/channels/qqbot) - API do QQ Bot; conversas privadas, conversas em grupo e conteúdo multimídia avançado (plugin oficial).
- [Raft](/pt-BR/channels/raft) - Ponte de ativação da CLI do Raft para colaboração entre pessoas e agentes (plugin oficial).
- [Signal](/pt-BR/channels/signal) - signal-cli; voltado à privacidade (plugin oficial).
- [Slack](/pt-BR/channels/slack) - SDK Bolt; aplicativos de espaço de trabalho (plugin oficial).
- [SMS](/pt-BR/channels/sms) - SMS com suporte do Twilio por meio do Webhook do Gateway (plugin oficial).
- [Synology Chat](/pt-BR/channels/synology-chat) - Synology NAS Chat por meio de webhooks de saída e entrada (plugin oficial).
- [Telegram](/pt-BR/channels/telegram) - Incluído no núcleo. API de Bot via grammY; compatível com grupos.
- [Tlon](/pt-BR/channels/tlon) - Mensageiro baseado em Urbit (plugin oficial).
- [Twitch](/pt-BR/channels/twitch) - Chat da Twitch via conexão IRC (plugin oficial).
- [Chamada de voz](/pt-BR/plugins/voice-call) - Telefonia via Plivo, Telnyx ou Twilio (plugin oficial).
- [WebChat](/pt-BR/web/webchat) - Incluído no núcleo. Interface WebChat do Gateway por WebSocket.
- [WeChat](/pt-BR/channels/wechat) - Bot Tencent iLink com login por código QR; somente conversas privadas (plugin externo).
- [WhatsApp](/pt-BR/channels/whatsapp) - O mais popular; usa o Baileys e exige pareamento por código QR (plugin oficial).
- [Yuanbao](/pt-BR/channels/yuanbao) - Bot Tencent Yuanbao (plugin externo).
- [Zalo](/pt-BR/channels/zalo) - API de Bot do Zalo; mensageiro popular no Vietnã (plugin oficial).
- [Zalo ClawBot](/pt-BR/channels/zaloclawbot) - Assistente pessoal do Zalo com login por código QR; vinculado ao proprietário (plugin externo).
- [Zalo Personal](/pt-BR/channels/zalouser) - Conta pessoal do Zalo com login por código QR (plugin oficial).

## Observações sobre a entrega

- As respostas do Telegram que contêm sintaxe Markdown de imagem, como `![alt](url)`,
  são convertidas em respostas com mídia no caminho final de saída quando possível.
- As mensagens diretas do Slack com várias pessoas são encaminhadas como conversas em grupo; portanto, a política de grupos, o comportamento
  de menções e as regras de sessão de grupo se aplicam às conversas MPIM.
- A configuração do WhatsApp ocorre por instalação sob demanda: a integração inicial pode exibir o fluxo de configuração antes
  da instalação do pacote do plugin, e o Gateway carrega o plugin externo
  do ClawHub/npm somente quando o canal está realmente ativo.
- Os canais que aceitam mensagens de entrada produzidas por bots podem usar a
  [proteção compartilhada contra loops de bots](/pt-BR/channels/bot-loop-protection) para evitar que pares de bots
  respondam um ao outro indefinidamente.
- As salas sempre ativas compatíveis podem usar [eventos de sala em segundo plano](/pt-BR/channels/ambient-room-events)
  para que as conversas da sala sem menções se tornem um contexto discreto, a menos que o agente envie uma mensagem com
  a ferramenta `message`.

## Observações

- Os canais podem ser executados simultaneamente; configure vários deles e o OpenClaw fará o encaminhamento de acordo com cada conversa.
- A configuração mais rápida geralmente é a do **Telegram** (token de bot simples, sem instalação de plugin). O WhatsApp
  exige pareamento por código QR e armazena mais estados no disco.
- O comportamento em grupos varia conforme o canal; consulte [Grupos](/pt-BR/channels/groups).
- O pareamento de mensagens diretas e as listas de permissões são aplicados por segurança; consulte [Segurança](/pt-BR/gateway/security).
- Solução de problemas: [Solução de problemas de canais](/pt-BR/channels/troubleshooting).
- Os provedores de modelos são documentados separadamente; consulte [Provedores de modelos](/pt-BR/providers/models).
