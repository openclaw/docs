---
read_when:
    - U wilt een chatkanaal voor OpenClaw kiezen
    - Je hebt een snel overzicht nodig van ondersteunde berichtenplatforms
summary: Berichtenplatforms waarmee OpenClaw verbinding kan maken
title: Chatkanalen
x-i18n:
    generated_at: "2026-05-07T01:50:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: ff6875f4ae86b341b6a82e13f022266461bc102ee03074a8c352eea2203d657a
    source_path: channels/index.md
    workflow: 16
---

OpenClaw kan met je praten in elke chat-app die je al gebruikt. Elk kanaal maakt verbinding via de Gateway.
Tekst wordt overal ondersteund; media en reacties verschillen per kanaal.

## Opmerkingen over levering

- Telegram-antwoorden die Markdown-afbeeldingssyntaxis bevatten, zoals `![alt](url)`,
  worden waar mogelijk omgezet naar media-antwoorden op het uiteindelijke uitgaande pad.
- Slack-DM's met meerdere personen worden gerouteerd als groepschats, dus groepsbeleid, vermeldingsgedrag
  en regels voor groepssessies zijn van toepassing op MPIM-gesprekken.
- WhatsApp-installatie gebeurt op aanvraag: onboarding kan de installatiestroom tonen voordat
  het pluginpakket is geïnstalleerd, en de Gateway laadt de WhatsApp-runtime
  alleen wanneer het kanaal daadwerkelijk actief is.

## Ondersteunde kanalen

- [BlueBubbles](/nl/channels/bluebubbles) - Verouderde iMessage-bridge via de REST-API van de BlueBubbles macOS-server; afgeraden voor nieuwe OpenClaw-installaties, maar nog steeds ondersteund voor bestaande configuraties en uitgebreidere private-API-acties.
- [Discord](/nl/channels/discord) - Discord Bot API + Gateway; ondersteunt servers, kanalen en DM's.
- [Feishu](/nl/channels/feishu) - Feishu/Lark-bot via WebSocket (meegeleverde Plugin).
- [Google Chat](/nl/channels/googlechat) - Google Chat API-app via HTTP-Webhook (downloadbare Plugin).
- [iMessage](/nl/channels/imessage) - Native macOS-integratie via de imsg CLI; aanbevolen voor nieuwe OpenClaw iMessage-installaties wanneer hostrechten en toegang tot Berichten geschikt zijn.
- [IRC](/nl/channels/irc) - Klassieke IRC-servers; kanalen + DM's met koppelings- en allowlist-controles.
- [LINE](/nl/channels/line) - LINE Messaging API-bot (downloadbare Plugin).
- [Matrix](/nl/channels/matrix) - Matrix-protocol (downloadbare Plugin).
- [Mattermost](/nl/channels/mattermost) - Bot API + WebSocket; kanalen, groepen, DM's (downloadbare Plugin).
- [Microsoft Teams](/nl/channels/msteams) - Bot Framework; ondersteuning voor ondernemingen (meegeleverde Plugin).
- [Nextcloud Talk](/nl/channels/nextcloud-talk) - Zelfgehoste chat via Nextcloud Talk (meegeleverde Plugin).
- [Nostr](/nl/channels/nostr) - Gedecentraliseerde DM's via NIP-04 (meegeleverde Plugin).
- [QQ Bot](/nl/channels/qqbot) - QQ Bot API; privéchat, groepschat en rich media (meegeleverde Plugin).
- [Signal](/nl/channels/signal) - signal-cli; gericht op privacy.
- [Slack](/nl/channels/slack) - Bolt SDK; workspace-apps.
- [Synology Chat](/nl/channels/synology-chat) - Synology NAS Chat via uitgaande+inkomende Webhooks (meegeleverde Plugin).
- [Telegram](/nl/channels/telegram) - Bot API via grammY; ondersteunt groepen.
- [Tlon](/nl/channels/tlon) - Op Urbit gebaseerde messenger (meegeleverde Plugin).
- [Twitch](/nl/channels/twitch) - Twitch-chat via IRC-verbinding (meegeleverde Plugin).
- [Voice Call](/nl/plugins/voice-call) - Telefonie via Plivo of Twilio (Plugin, afzonderlijk geïnstalleerd).
- [WebChat](/nl/web/webchat) - Gateway WebChat-UI via WebSocket.
- [WeChat](/nl/channels/wechat) - Tencent iLink Bot-Plugin via QR-login; alleen privéchats (externe Plugin).
- [WhatsApp](/nl/channels/whatsapp) - Populairst; gebruikt Baileys en vereist QR-koppeling.
- [Yuanbao](/nl/channels/yuanbao) - Tencent Yuanbao-bot (externe Plugin).
- [Zalo](/nl/channels/zalo) - Zalo Bot API; populaire messenger in Vietnam (meegeleverde Plugin).
- [Zalo Personal](/nl/channels/zalouser) - Persoonlijk Zalo-account via QR-login (meegeleverde Plugin).

## Opmerkingen

- Kanalen kunnen gelijktijdig actief zijn; configureer er meerdere en OpenClaw routeert per chat.
- De snelste installatie is meestal **Telegram** (eenvoudig bottoken). WhatsApp vereist QR-koppeling en
  slaat meer status op schijf op.
- Groepsgedrag verschilt per kanaal; zie [Groepen](/nl/channels/groups).
- DM-koppeling en allowlists worden om veiligheidsredenen afgedwongen; zie [Beveiliging](/nl/gateway/security).
- Probleemoplossing: [Probleemoplossing voor kanalen](/nl/channels/troubleshooting).
- Modelproviders worden apart gedocumenteerd; zie [Modelproviders](/nl/providers/models).
