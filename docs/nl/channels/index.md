---
read_when:
    - Je wilt een chatkanaal kiezen voor OpenClaw
    - Je hebt een snel overzicht nodig van ondersteunde berichtenplatforms
summary: Berichtenplatforms waarmee OpenClaw verbinding kan maken
title: Chatkanalen
x-i18n:
    generated_at: "2026-06-27T17:10:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3ff3e59df21d71f0d80eff2a6299169bfeb15964834a552f3c4c1d5b7c144b8d
    source_path: channels/index.md
    workflow: 16
---

OpenClaw kan met je praten in elke chat-app die je al gebruikt. Elk kanaal maakt verbinding via de Gateway.
Tekst wordt overal ondersteund; media en reacties verschillen per kanaal.

## Bezorgnotities

- Telegram-antwoorden die markdown-afbeeldingssyntaxis bevatten, zoals `![alt](url)`,
  worden waar mogelijk omgezet in media-antwoorden op het laatste uitgaande pad.
- Slack-DM's met meerdere personen worden gerouteerd als groepschats, dus groepsbeleid, vermeldingsgedrag
  en regels voor groepssessies zijn van toepassing op MPIM-gesprekken.
- WhatsApp-installatie is installeren op aanvraag: onboarding kan de installatiestroom tonen voordat
  het pluginpakket is geïnstalleerd, en de Gateway laadt de externe
  ClawHub/npm-plugin alleen wanneer het kanaal daadwerkelijk actief is.
- Kanalen die door bots geschreven inkomende berichten accepteren, kunnen gedeelde
  [bot-lusbeveiliging](/nl/channels/bot-loop-protection) gebruiken om te voorkomen dat botparen
  eindeloos op elkaar blijven reageren.
- Ondersteunde altijd-aan-ruimtes kunnen [omgevingsruimtegebeurtenissen](/nl/channels/ambient-room-events)
  gebruiken zodat onvermelde kamerchatter stille context wordt, tenzij de agent verzendt met
  de `message`-tool.

## Ondersteunde kanalen

- [Discord](/nl/channels/discord) - Discord Bot API + Gateway; ondersteunt servers, kanalen en DM's.
- [Feishu](/nl/channels/feishu) - Feishu/Lark-bot via WebSocket (gebundelde plugin).
- [Google Chat](/nl/channels/googlechat) - Google Chat API-app via HTTP-webhook (downloadbare plugin).
- [iMessage](/nl/channels/imessage) - Native macOS-integratie via de `imsg`-bridge op een ingelogde Mac (of SSH-wrapper wanneer de Gateway elders draait), inclusief private API-acties voor antwoorden, tapbacks, effecten, bijlagen en groepsbeheer. Aanbevolen voor nieuwe OpenClaw iMessage-installaties wanneer hostmachtigingen en toegang tot Berichten passen.
- [IRC](/nl/channels/irc) - Klassieke IRC-servers; kanalen + DM's met koppelings-/allowlistcontroles.
- [LINE](/nl/channels/line) - LINE Messaging API-bot (downloadbare plugin).
- [Matrix](/nl/channels/matrix) - Matrix-protocol (downloadbare plugin).
- [Mattermost](/nl/channels/mattermost) - Bot API + WebSocket; kanalen, groepen, DM's (downloadbare plugin).
- [Microsoft Teams](/nl/channels/msteams) - Bot Framework; enterprise-ondersteuning (gebundelde plugin).
- [Nextcloud Talk](/nl/channels/nextcloud-talk) - Zelfgehoste chat via Nextcloud Talk (gebundelde plugin).
- [Nostr](/nl/channels/nostr) - Gedecentraliseerde DM's via NIP-04 (gebundelde plugin).
- [QQ Bot](/nl/channels/qqbot) - QQ Bot API; privéchat, groepschat en rich media (gebundelde plugin).
- [Raft](/nl/channels/raft) - Raft CLI-wakebridge voor samenwerking tussen mens en agent (externe plugin).
- [Signal](/nl/channels/signal) - signal-cli; privacygericht.
- [Slack](/nl/channels/slack) - Bolt SDK; workspace-apps.
- [SMS](/nl/channels/sms) - Door Twilio ondersteunde SMS via de Gateway-webhook (officiële plugin).
- [Synology Chat](/nl/channels/synology-chat) - Synology NAS Chat via uitgaande+inkomende webhooks (gebundelde plugin).
- [Telegram](/nl/channels/telegram) - Bot API via grammY; ondersteunt groepen.
- [Tlon](/nl/channels/tlon) - Op Urbit gebaseerde messenger (gebundelde plugin).
- [Twitch](/nl/channels/twitch) - Twitch-chat via IRC-verbinding (gebundelde plugin).
- [Voice Call](/nl/plugins/voice-call) - Telefonie via Plivo of Twilio (plugin, apart geïnstalleerd).
- [WebChat](/nl/web/webchat) - Gateway WebChat-UI via WebSocket.
- [WeChat](/nl/channels/wechat) - Tencent iLink Bot-plugin via QR-login; alleen privéchats (externe plugin).
- [WhatsApp](/nl/channels/whatsapp) - Populairst; gebruikt Baileys en vereist QR-koppeling.
- [Yuanbao](/nl/channels/yuanbao) - Tencent Yuanbao-bot (externe plugin).
- [Zalo](/nl/channels/zalo) - Zalo Bot API; populaire messenger in Vietnam (gebundelde plugin).
- [Zalo ClawBot](/nl/channels/zaloclawbot) - Persoonlijke Zalo-assistent via QR-login; eigenaargebonden (externe plugin).
- [Zalo Personal](/nl/channels/zalouser) - Persoonlijk Zalo-account via QR-login (gebundelde plugin).

## Notities

- Kanalen kunnen gelijktijdig draaien; configureer er meerdere en OpenClaw routeert per chat.
- De snelste installatie is meestal **Telegram** (eenvoudig bottoken). WhatsApp vereist QR-koppeling en
  slaat meer status op schijf op.
- Groepsgedrag verschilt per kanaal; zie [Groepen](/nl/channels/groups).
- DM-koppeling en allowlists worden voor veiligheid afgedwongen; zie [Beveiliging](/nl/gateway/security).
- Probleemoplossing: [Kanaalprobleemoplossing](/nl/channels/troubleshooting).
- Modelproviders worden apart gedocumenteerd; zie [Modelproviders](/nl/providers/models).
