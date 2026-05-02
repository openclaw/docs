---
read_when:
    - Você quer escolher um canal de chat para o OpenClaw
    - Você precisa de uma visão geral rápida das plataformas de mensagens compatíveis
summary: Plataformas de mensagens às quais o OpenClaw pode se conectar
title: Canais de chat
x-i18n:
    generated_at: "2026-05-02T05:41:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5937761c0aebc17e8633449d467219ea564b8b00a4a99f327aba7d73afe0c810
    source_path: channels/index.md
    workflow: 16
---

OpenClaw pode falar com você em qualquer aplicativo de chat que você já usa. Cada canal se conecta por meio do Gateway.
Texto é suportado em todos os lugares; mídia e reações variam conforme o canal.

## Observações de entrega

- Respostas do Telegram que contêm sintaxe de imagem em markdown, como `![alt](url)`,
  são convertidas em respostas de mídia no caminho final de saída quando possível.
- DMs com várias pessoas no Slack são roteadas como chats em grupo, portanto a política de grupo, o comportamento de menção
  e as regras de sessão de grupo se aplicam às conversas MPIM.
- A configuração do WhatsApp é instalação sob demanda: o onboarding pode mostrar o fluxo de configuração antes
  que o pacote do Plugin seja instalado, e o Gateway carrega o runtime do WhatsApp
  somente quando o canal está realmente ativo.

## Canais suportados

- [BlueBubbles](/pt-BR/channels/bluebubbles) — **Recomendado para iMessage**; usa a API REST do servidor macOS BlueBubbles com suporte completo a recursos (Plugin incluído; editar, desfazer envio, efeitos, reações, gerenciamento de grupos — a edição está atualmente quebrada no macOS 26 Tahoe).
- [Discord](/pt-BR/channels/discord) — API de Bot do Discord + Gateway; suporta servidores, canais e DMs.
- [Feishu](/pt-BR/channels/feishu) — bot Feishu/Lark via WebSocket (Plugin incluído).
- [Google Chat](/pt-BR/channels/googlechat) — aplicativo da API Google Chat via Webhook HTTP.
- [iMessage (legado)](/pt-BR/channels/imessage) — integração legada com macOS via CLI imsg (obsoleta, use BlueBubbles para novas configurações).
- [IRC](/pt-BR/channels/irc) — servidores IRC clássicos; canais + DMs com controles de pareamento/lista de permissões.
- [LINE](/pt-BR/channels/line) — bot da API LINE Messaging (Plugin incluído).
- [Matrix](/pt-BR/channels/matrix) — protocolo Matrix (Plugin incluído).
- [Mattermost](/pt-BR/channels/mattermost) — API de Bot + WebSocket; canais, grupos, DMs (Plugin incluído).
- [Microsoft Teams](/pt-BR/channels/msteams) — Bot Framework; suporte corporativo (Plugin incluído).
- [Nextcloud Talk](/pt-BR/channels/nextcloud-talk) — chat auto-hospedado via Nextcloud Talk (Plugin incluído).
- [Nostr](/pt-BR/channels/nostr) — DMs descentralizadas via NIP-04 (Plugin incluído).
- [QQ Bot](/pt-BR/channels/qqbot) — API QQ Bot; chat privado, chat em grupo e mídia rica (Plugin incluído).
- [Signal](/pt-BR/channels/signal) — signal-cli; focado em privacidade.
- [Slack](/pt-BR/channels/slack) — Bolt SDK; aplicativos de workspace.
- [Synology Chat](/pt-BR/channels/synology-chat) — Synology NAS Chat via Webhooks de saída+entrada (Plugin incluído).
- [Telegram](/pt-BR/channels/telegram) — API de Bot via grammY; suporta grupos.
- [Tlon](/pt-BR/channels/tlon) — mensageiro baseado em Urbit (Plugin incluído).
- [Twitch](/pt-BR/channels/twitch) — chat da Twitch via conexão IRC (Plugin incluído).
- [Chamada de voz](/pt-BR/plugins/voice-call) — telefonia via Plivo ou Twilio (Plugin, instalado separadamente).
- [WebChat](/pt-BR/web/webchat) — interface WebChat do Gateway por WebSocket.
- [WeChat](/pt-BR/channels/wechat) — Plugin Tencent iLink Bot via login por QR; somente chats privados (Plugin externo).
- [WhatsApp](/pt-BR/channels/whatsapp) — mais popular; usa Baileys e exige pareamento por QR.
- [Yuanbao](/pt-BR/channels/yuanbao) — bot Tencent Yuanbao (Plugin externo).
- [Zalo](/pt-BR/channels/zalo) — API Zalo Bot; mensageiro popular do Vietnã (Plugin incluído).
- [Zalo Personal](/pt-BR/channels/zalouser) — conta pessoal do Zalo via login por QR (Plugin incluído).

## Observações

- Os canais podem ser executados simultaneamente; configure vários e o OpenClaw roteará por chat.
- A configuração mais rápida geralmente é **Telegram** (token de bot simples). O WhatsApp exige pareamento por QR e
  armazena mais estado em disco.
- O comportamento em grupo varia conforme o canal; consulte [Grupos](/pt-BR/channels/groups).
- O pareamento de DM e as listas de permissões são aplicados por segurança; consulte [Segurança](/pt-BR/gateway/security).
- Solução de problemas: [Solução de problemas de canais](/pt-BR/channels/troubleshooting).
- Provedores de modelo são documentados separadamente; consulte [Provedores de modelo](/pt-BR/providers/models).
