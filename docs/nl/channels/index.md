---
read_when:
    - U wilt een chatkanaal voor OpenClaw kiezen
    - Je hebt een snel overzicht nodig van ondersteunde berichtenplatforms
summary: Berichtenplatforms waarmee OpenClaw verbinding kan maken
title: Chatkanalen
x-i18n:
    generated_at: "2026-05-10T19:21:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 57ae81a99d265abbf3f9f016506e787d66b4f6984d833e43e7a8554e157a3c17
    source_path: channels/index.md
    workflow: 16
---

OpenClaw kan met je praten via elke chatapp die je al gebruikt. Elk kanaal maakt verbinding via de Gateway.
Tekst wordt overal ondersteund; media en reacties verschillen per kanaal.

## Opmerkingen over aflevering

- Telegram-antwoorden die markdown-afbeeldingssyntaxis bevatten, zoals `![alt](url)`,
  worden waar mogelijk omgezet naar media-antwoorden op het definitieve uitgaande pad.
- Slack-DM's met meerdere personen worden als groepschats gerouteerd, dus groepsbeleid, vermeldingsgedrag
  en regels voor groepssessies zijn van toepassing op MPIM-gesprekken.
- WhatsApp-installatie gebeurt op aanvraag: onboarding kan de installatiestroom tonen voordat
  het pluginpakket is geïnstalleerd, en de Gateway laadt de WhatsApp-runtime
  alleen wanneer het kanaal daadwerkelijk actief is.

## Ondersteunde kanalen

- [Discord](/nl/channels/discord) - Discord Bot API + Gateway; ondersteunt servers, kanalen en DM's.
- [Feishu](/nl/channels/feishu) - Feishu/Lark-bot via WebSocket (gebundelde plugin).
- [Google Chat](/nl/channels/googlechat) - Google Chat API-app via HTTP-webhook (downloadbare plugin).
- [iMessage](/nl/channels/imessage) - Native macOS-integratie via de `imsg`-bridge op een ingelogde Mac (of SSH-wrapper wanneer de Gateway elders draait), inclusief privé-API-acties voor antwoorden, tapbacks, effecten, bijlagen en groepsbeheer. Aanbevolen voor nieuwe OpenClaw iMessage-installaties wanneer hostmachtigingen en toegang tot Berichten passen.
- [IRC](/nl/channels/irc) - Klassieke IRC-servers; kanalen + DM's met koppelings- en allowlist-controles.
- [LINE](/nl/channels/line) - LINE Messaging API-bot (downloadbare plugin).
- [Matrix](/nl/channels/matrix) - Matrix-protocol (downloadbare plugin).
- [Mattermost](/nl/channels/mattermost) - Bot API + WebSocket; kanalen, groepen, DM's (downloadbare plugin).
- [Microsoft Teams](/nl/channels/msteams) - Bot Framework; ondersteuning voor ondernemingen (gebundelde plugin).
- [Nextcloud Talk](/nl/channels/nextcloud-talk) - Zelfgehoste chat via Nextcloud Talk (gebundelde plugin).
- [Nostr](/nl/channels/nostr) - Gedecentraliseerde DM's via NIP-04 (gebundelde plugin).
- [QQ Bot](/nl/channels/qqbot) - QQ Bot API; privéchat, groepschat en rich media (gebundelde plugin).
- [Signal](/nl/channels/signal) - signal-cli; gericht op privacy.
- [Slack](/nl/channels/slack) - Bolt SDK; workspace-apps.
- [Synology Chat](/nl/channels/synology-chat) - Synology NAS Chat via uitgaande+inkomende webhooks (gebundelde plugin).
- [Telegram](/nl/channels/telegram) - Bot API via grammY; ondersteunt groepen.
- [Tlon](/nl/channels/tlon) - Urbit-gebaseerde messenger (gebundelde plugin).
- [Twitch](/nl/channels/twitch) - Twitch-chat via IRC-verbinding (gebundelde plugin).
- [Spraakoproep](/nl/plugins/voice-call) - Telefonie via Plivo of Twilio (plugin, afzonderlijk geïnstalleerd).
- [WebChat](/nl/web/webchat) - Gateway WebChat-UI via WebSocket.
- [WeChat](/nl/channels/wechat) - Tencent iLink Bot-plugin via QR-login; alleen privéchats (externe plugin).
- [WhatsApp](/nl/channels/whatsapp) - Meest populair; gebruikt Baileys en vereist QR-koppeling.
- [Yuanbao](/nl/channels/yuanbao) - Tencent Yuanbao-bot (externe plugin).
- [Zalo](/nl/channels/zalo) - Zalo Bot API; populaire messenger in Vietnam (gebundelde plugin).
- [Zalo Personal](/nl/channels/zalouser) - Persoonlijk Zalo-account via QR-login (gebundelde plugin).

## Opmerkingen

- Kanalen kunnen gelijktijdig draaien; configureer er meerdere en OpenClaw routeert per chat.
- De snelste installatie is meestal **Telegram** (eenvoudige bottoken). WhatsApp vereist QR-koppeling en
  slaat meer status op schijf op.
- Groepsgedrag verschilt per kanaal; zie [Groepen](/nl/channels/groups).
- DM-koppeling en allowlists worden afgedwongen voor veiligheid; zie [Beveiliging](/nl/gateway/security).
- Probleemoplossing: [Probleemoplossing voor kanalen](/nl/channels/troubleshooting).
- Modelproviders worden afzonderlijk gedocumenteerd; zie [Modelproviders](/nl/providers/models).
