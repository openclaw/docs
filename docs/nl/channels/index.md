---
read_when:
    - Je wilt een chatkanaal kiezen voor OpenClaw
    - Je hebt snel een overzicht nodig van ondersteunde berichtenplatforms
summary: Berichtenplatforms waarmee OpenClaw verbinding kan maken
title: Chatkanalen
x-i18n:
    generated_at: "2026-05-06T09:02:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: c357a9dfabf12329954f30084fe9abfad9aa96f62bcd72b3d0802819d5979d7b
    source_path: channels/index.md
    workflow: 16
---

OpenClaw kan met je praten via elke chat-app die je al gebruikt. Elk kanaal verbindt via de Gateway.
Tekst wordt overal ondersteund; media en reacties verschillen per kanaal.

## Leveringsnotities

- Telegram-antwoorden die markdown-afbeeldingssyntaxis bevatten, zoals `![alt](url)`,
  worden waar mogelijk op het laatste uitgaande pad omgezet naar media-antwoorden.
- Slack-DM's met meerdere personen worden als groepschats gerouteerd, dus groepsbeleid, vermeldingsgedrag
  en regels voor groepssessies zijn van toepassing op MPIM-gesprekken.
- WhatsApp-installatie is installatie op aanvraag: onboarding kan de installatiestroom tonen voordat
  het Plugin-pakket is geïnstalleerd, en de Gateway laadt de WhatsApp-runtime
  alleen wanneer het kanaal daadwerkelijk actief is.

## Ondersteunde kanalen

- [BlueBubbles](/nl/channels/bluebubbles) - **Aanbevolen voor iMessage**; gebruikt de REST API van de BlueBubbles macOS-server met volledige functieondersteuning (gebundelde Plugin; bewerken, verzending ongedaan maken, effecten, reacties, groepsbeheer - bewerken is momenteel stuk op macOS 26 Tahoe).
- [Discord](/nl/channels/discord) - Discord Bot API + Gateway; ondersteunt servers, kanalen en DM's.
- [Feishu](/nl/channels/feishu) - Feishu/Lark-bot via WebSocket (gebundelde Plugin).
- [Google Chat](/nl/channels/googlechat) - Google Chat API-app via HTTP-webhook (downloadbare Plugin).
- [iMessage (legacy)](/nl/channels/imessage) - Verouderde macOS-integratie via imsg CLI (verouderd, gebruik BlueBubbles voor nieuwe installaties).
- [IRC](/nl/channels/irc) - Klassieke IRC-servers; kanalen + DM's met koppelings-/allowlist-regelaars.
- [LINE](/nl/channels/line) - LINE Messaging API-bot (downloadbare Plugin).
- [Matrix](/nl/channels/matrix) - Matrix-protocol (downloadbare Plugin).
- [Mattermost](/nl/channels/mattermost) - Bot API + WebSocket; kanalen, groepen, DM's (downloadbare Plugin).
- [Microsoft Teams](/nl/channels/msteams) - Bot Framework; ondersteuning voor ondernemingen (gebundelde Plugin).
- [Nextcloud Talk](/nl/channels/nextcloud-talk) - Zelfgehoste chat via Nextcloud Talk (gebundelde Plugin).
- [Nostr](/nl/channels/nostr) - Gedecentraliseerde DM's via NIP-04 (gebundelde Plugin).
- [QQ Bot](/nl/channels/qqbot) - QQ Bot API; privéchat, groepschat en rich media (gebundelde Plugin).
- [Signal](/nl/channels/signal) - signal-cli; gericht op privacy.
- [Slack](/nl/channels/slack) - Bolt SDK; werkruimte-apps.
- [Synology Chat](/nl/channels/synology-chat) - Synology NAS Chat via uitgaande+inkomende webhooks (gebundelde Plugin).
- [Telegram](/nl/channels/telegram) - Bot API via grammY; ondersteunt groepen.
- [Tlon](/nl/channels/tlon) - Op Urbit gebaseerde messenger (gebundelde Plugin).
- [Twitch](/nl/channels/twitch) - Twitch-chat via IRC-verbinding (gebundelde Plugin).
- [Voice Call](/nl/plugins/voice-call) - Telefonie via Plivo of Twilio (Plugin, afzonderlijk geïnstalleerd).
- [WebChat](/nl/web/webchat) - Gateway WebChat-UI via WebSocket.
- [WeChat](/nl/channels/wechat) - Tencent iLink Bot-Plugin via QR-login; alleen privéchats (externe Plugin).
- [WhatsApp](/nl/channels/whatsapp) - Populairst; gebruikt Baileys en vereist QR-koppeling.
- [Yuanbao](/nl/channels/yuanbao) - Tencent Yuanbao-bot (externe Plugin).
- [Zalo](/nl/channels/zalo) - Zalo Bot API; populaire messenger in Vietnam (gebundelde Plugin).
- [Zalo Personal](/nl/channels/zalouser) - Persoonlijk Zalo-account via QR-login (gebundelde Plugin).

## Opmerkingen

- Kanalen kunnen gelijktijdig draaien; configureer er meerdere en OpenClaw routeert per chat.
- De snelste installatie is meestal **Telegram** (eenvoudig bottoken). WhatsApp vereist QR-koppeling en
  slaat meer status op schijf op.
- Groepsgedrag verschilt per kanaal; zie [Groepen](/nl/channels/groups).
- DM-koppeling en allowlists worden afgedwongen voor veiligheid; zie [Beveiliging](/nl/gateway/security).
- Probleemoplossing: [Kanaalprobleemoplossing](/nl/channels/troubleshooting).
- Modelproviders worden afzonderlijk gedocumenteerd; zie [Modelproviders](/nl/providers/models).
