---
read_when:
    - Você quer escolher um canal de chat para o OpenClaw
    - Você precisa de uma visão geral rápida das plataformas de mensagens compatíveis
summary: Plataformas de mensagens às quais o OpenClaw pode se conectar
title: Canais de chat
x-i18n:
    generated_at: "2026-05-02T20:41:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 785af727e9491914f5a9459672d47c2cfde3319b318c698051cd7e89d023d4b9
    source_path: channels/index.md
    workflow: 16
---

OpenClaw pode falar com você em qualquer app de chat que você já usa. Cada canal se conecta via Gateway.
Texto é compatível em todos os lugares; mídia e reações variam por canal.

## Notas de entrega

- Respostas do Telegram que contêm sintaxe de imagem em markdown, como `![alt](url)`,
  são convertidas em respostas de mídia no caminho final de saída quando possível.
- DMs com várias pessoas no Slack são roteadas como chats em grupo, portanto a política de grupo, o comportamento de menções
  e as regras de sessão em grupo se aplicam a conversas MPIM.
- A configuração do WhatsApp é instalada sob demanda: a integração inicial pode mostrar o fluxo de configuração antes
  de o pacote do plugin ser instalado, e o Gateway carrega o runtime do WhatsApp
  somente quando o canal está realmente ativo.

## Canais compatíveis

- [BlueBubbles](/pt-BR/channels/bluebubbles) — **Recomendado para iMessage**; usa a API REST do servidor macOS BlueBubbles com suporte completo a recursos (plugin incluído; editar, desfazer envio, efeitos, reações, gerenciamento de grupos — a edição está atualmente quebrada no macOS 26 Tahoe).
- [Discord](/pt-BR/channels/discord) — API de Bot do Discord + Gateway; oferece suporte a servidores, canais e DMs.
- [Feishu](/pt-BR/channels/feishu) — bot Feishu/Lark via WebSocket (plugin incluído).
- [Google Chat](/pt-BR/channels/googlechat) — app da API Google Chat via webhook HTTP (plugin baixável).
- [iMessage (legado)](/pt-BR/channels/imessage) — Integração legada do macOS via CLI imsg (obsoleta; use BlueBubbles para novas configurações).
- [IRC](/pt-BR/channels/irc) — Servidores IRC clássicos; canais + DMs com controles de pareamento/lista de permissões.
- [LINE](/pt-BR/channels/line) — bot da API LINE Messaging (plugin baixável).
- [Matrix](/pt-BR/channels/matrix) — protocolo Matrix (plugin baixável).
- [Mattermost](/pt-BR/channels/mattermost) — API de Bot + WebSocket; canais, grupos, DMs (plugin baixável).
- [Microsoft Teams](/pt-BR/channels/msteams) — Bot Framework; suporte corporativo (plugin incluído).
- [Nextcloud Talk](/pt-BR/channels/nextcloud-talk) — Chat auto-hospedado via Nextcloud Talk (plugin incluído).
- [Nostr](/pt-BR/channels/nostr) — DMs descentralizadas via NIP-04 (plugin incluído).
- [QQ Bot](/pt-BR/channels/qqbot) — API QQ Bot; chat privado, chat em grupo e mídia avançada (plugin incluído).
- [Signal](/pt-BR/channels/signal) — signal-cli; focado em privacidade.
- [Slack](/pt-BR/channels/slack) — Bolt SDK; apps de workspace.
- [Synology Chat](/pt-BR/channels/synology-chat) — Synology NAS Chat via webhooks de saída+entrada (plugin incluído).
- [Telegram](/pt-BR/channels/telegram) — API de Bot via grammY; oferece suporte a grupos.
- [Tlon](/pt-BR/channels/tlon) — mensageiro baseado em Urbit (plugin incluído).
- [Twitch](/pt-BR/channels/twitch) — chat da Twitch via conexão IRC (plugin incluído).
- [Voice Call](/pt-BR/plugins/voice-call) — Telefonia via Plivo ou Twilio (plugin, instalado separadamente).
- [WebChat](/pt-BR/web/webchat) — IU WebChat do Gateway via WebSocket.
- [WeChat](/pt-BR/channels/wechat) — plugin Tencent iLink Bot via login por QR; apenas chats privados (plugin externo).
- [WhatsApp](/pt-BR/channels/whatsapp) — Mais popular; usa Baileys e exige pareamento por QR.
- [Yuanbao](/pt-BR/channels/yuanbao) — bot Tencent Yuanbao (plugin externo).
- [Zalo](/pt-BR/channels/zalo) — API Zalo Bot; mensageiro popular do Vietnã (plugin incluído).
- [Zalo Personal](/pt-BR/channels/zalouser) — conta pessoal do Zalo via login por QR (plugin incluído).

## Observações

- Os canais podem ser executados simultaneamente; configure vários e o OpenClaw roteará por chat.
- A configuração mais rápida geralmente é **Telegram** (token de bot simples). O WhatsApp exige pareamento por QR e
  armazena mais estado em disco.
- O comportamento em grupo varia por canal; consulte [Grupos](/pt-BR/channels/groups).
- Pareamento de DMs e listas de permissões são aplicados por segurança; consulte [Segurança](/pt-BR/gateway/security).
- Solução de problemas: [Solução de problemas de canais](/pt-BR/channels/troubleshooting).
- Provedores de modelos são documentados separadamente; consulte [Provedores de modelos](/pt-BR/providers/models).
