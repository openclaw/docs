---
read_when:
    - Je wilt een chatkanaal voor OpenClaw kiezen
    - U hebt een snel overzicht nodig van ondersteunde berichtenplatforms
summary: Berichtenplatforms waarmee OpenClaw verbinding kan maken
title: Chatkanalen
x-i18n:
    generated_at: "2026-07-12T08:35:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 411b011a8e5dd83d3f30a672c0e8a56251ee8c6ca7cdf3e7dc5c2b1f1b31d73d
    source_path: channels/index.md
    workflow: 16
---

OpenClaw kan met je praten via elke chat-app die je al gebruikt. Elk kanaal maakt verbinding via de Gateway.
Tekst wordt overal ondersteund; media en reacties verschillen per kanaal.

iMessage, Telegram en de WebChat-UI worden meegeleverd met de kerninstallatie. Kanalen met de aanduiding
"officiële plugin" installeer je met één opdracht (`openclaw plugins install @openclaw/<id>`)
of op aanvraag tijdens `openclaw onboard` / `openclaw channels add`; daarna moet de Gateway
opnieuw worden gestart. Kanalen met de aanduiding "externe plugin" worden buiten de OpenClaw-repository onderhouden.

## Ondersteunde kanalen

- [Discord](/nl/channels/discord) - Discord Bot API + Gateway; ondersteunt servers, kanalen en privéberichten (officiële plugin).
- [Feishu](/nl/channels/feishu) - Feishu/Lark-bot via WebSocket (officiële plugin).
- [Google Chat](/nl/channels/googlechat) - Google Chat API-app via HTTP-webhook (officiële plugin).
- [iMessage](/nl/channels/imessage) - Opgenomen in de kern. Native macOS-integratie via de `imsg`-bridge op een aangemelde Mac (of een SSH-wrapper wanneer de Gateway elders draait), inclusief privé-API-acties voor antwoorden, tapbacks, effecten, bijlagen en groepsbeheer.
- [IRC](/nl/channels/irc) - Klassieke IRC-servers; kanalen en privéberichten met koppelings- en toelatingslijstbeheer (officiële plugin).
- [LINE](/nl/channels/line) - LINE Messaging API-bot (officiële plugin).
- [Matrix](/nl/channels/matrix) - Matrix-protocol (officiële plugin).
- [Mattermost](/nl/channels/mattermost) - Bot API + WebSocket; kanalen, groepen en privéberichten (officiële plugin).
- [Microsoft Teams](/nl/channels/msteams) - Bot Framework; ondersteuning voor ondernemingen (officiële plugin).
- [Nextcloud Talk](/nl/channels/nextcloud-talk) - Zelfgehoste chat via Nextcloud Talk (officiële plugin).
- [Nostr](/nl/channels/nostr) - Gedecentraliseerde privéberichten via NIP-04 (officiële plugin).
- [QQ Bot](/nl/channels/qqbot) - QQ Bot API; privéchats, groepschats en rijke media (officiële plugin).
- [Raft](/nl/channels/raft) - Raft CLI-wakeupbridge voor samenwerking tussen mensen en agents (officiële plugin).
- [Signal](/nl/channels/signal) - signal-cli; gericht op privacy (officiële plugin).
- [Slack](/nl/channels/slack) - Bolt SDK; werkruimte-apps (officiële plugin).
- [SMS](/nl/channels/sms) - Door Twilio ondersteunde sms via de Gateway-webhook (officiële plugin).
- [Synology Chat](/nl/channels/synology-chat) - Synology NAS Chat via uitgaande en inkomende webhooks (officiële plugin).
- [Telegram](/nl/channels/telegram) - Opgenomen in de kern. Bot API via grammY; ondersteunt groepen.
- [Tlon](/nl/channels/tlon) - Op Urbit gebaseerde berichtenapp (officiële plugin).
- [Twitch](/nl/channels/twitch) - Twitch-chat via een IRC-verbinding (officiële plugin).
- [Spraakoproep](/nl/plugins/voice-call) - Telefonie via Plivo, Telnyx of Twilio (officiële plugin).
- [WebChat](/nl/web/webchat) - Opgenomen in de kern. Gateway WebChat-UI via WebSocket.
- [WeChat](/nl/channels/wechat) - Tencent iLink-bot via QR-aanmelding; alleen privéchats (externe plugin).
- [WhatsApp](/nl/channels/whatsapp) - Het populairst; gebruikt Baileys en vereist QR-koppeling (officiële plugin).
- [Yuanbao](/nl/channels/yuanbao) - Tencent Yuanbao-bot (externe plugin).
- [Zalo](/nl/channels/zalo) - Zalo Bot API; de populaire berichtenapp van Vietnam (officiële plugin).
- [Zalo ClawBot](/nl/channels/zaloclawbot) - Persoonlijke Zalo-assistent via QR-aanmelding; aan de eigenaar gebonden (externe plugin).
- [Zalo Personal](/nl/channels/zalouser) - Persoonlijk Zalo-account via QR-aanmelding (officiële plugin).

## Opmerkingen over aflevering

- Telegram-antwoorden die Markdown-afbeeldingssyntaxis bevatten, zoals `![alt](url)`,
  worden waar mogelijk in het laatste uitgaande traject omgezet in media-antwoorden.
- Slack-privéberichten met meerdere personen worden als groepschats gerouteerd, zodat het groepsbeleid, het
  vermeldingsgedrag en de regels voor groepssessies van toepassing zijn op MPIM-gesprekken.
- De installatie van WhatsApp gebeurt op aanvraag: tijdens de onboarding kan de configuratieprocedure worden weergegeven voordat
  het pluginpakket is geïnstalleerd, en de Gateway laadt de externe
  ClawHub/npm-plugin alleen wanneer het kanaal daadwerkelijk actief is.
- Kanalen die door bots geschreven inkomende berichten accepteren, kunnen gedeelde
  [bescherming tegen botlussen](/nl/channels/bot-loop-protection) gebruiken om te voorkomen dat botparen
  elkaar eindeloos blijven beantwoorden.
- Ondersteunde permanent actieve ruimtes kunnen [omgevingsgebeurtenissen voor ruimtes](/nl/channels/ambient-room-events)
  gebruiken, zodat niet aan de agent gerichte gesprekken in de ruimte stille context worden, tenzij de agent berichten verzendt met
  de tool `message`.

## Opmerkingen

- Kanalen kunnen gelijktijdig actief zijn; configureer er meerdere en OpenClaw routeert per chat.
- De snelste configuratie is doorgaans **Telegram** (eenvoudig bottoken, geen plugininstallatie). WhatsApp
  vereist QR-koppeling en slaat meer status op schijf op.
- Groepsgedrag verschilt per kanaal; zie [Groepen](/nl/channels/groups).
- Koppeling van privéberichten en toelatingslijsten worden voor de veiligheid afgedwongen; zie [Beveiliging](/nl/gateway/security).
- Probleemoplossing: [Problemen met kanalen oplossen](/nl/channels/troubleshooting).
- Modelproviders worden afzonderlijk gedocumenteerd; zie [Modelproviders](/nl/providers/models).
