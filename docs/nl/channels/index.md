---
read_when:
    - Je wilt een chatkanaal voor OpenClaw kiezen
    - Je hebt een kort overzicht van ondersteunde berichtenplatforms nodig
summary: Berichtenplatforms waarmee OpenClaw verbinding kan maken
title: Chatkanalen
x-i18n:
    generated_at: "2026-07-16T15:11:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 102ad190f5bdb61fb3610985948e022f03fd54598ed4889da7a443ec0a2bdef3
    source_path: channels/index.md
    workflow: 16
---

OpenClaw kan met je praten via elke chat-app die je al gebruikt. Elk kanaal maakt verbinding via de Gateway.
Tekst wordt overal ondersteund; media en reacties verschillen per kanaal.

iMessage, Telegram en de WebChat-UI worden meegeleverd met de kerninstallatie. Kanalen met de aanduiding
"officiële plugin" installeer je met één opdracht (`openclaw plugins install @openclaw/<id>`)
of naar behoefte tijdens `openclaw onboard` / `openclaw channels add`; daarna moet de Gateway
opnieuw worden gestart. Kanalen met de aanduiding "externe plugin" worden buiten de OpenClaw-repository onderhouden.

## Ondersteunde kanalen

- [Discord](/nl/channels/discord) - Discord Bot API + Gateway; ondersteunt servers, kanalen en DM's (officiële plugin).
- [Feishu](/nl/channels/feishu) - Feishu/Lark-bot via WebSocket (officiële plugin).
- [Google Chat](/nl/channels/googlechat) - Google Chat API-app via HTTP-webhook (officiële plugin).
- [iMessage](/nl/channels/imessage) - Opgenomen in de kern. Native macOS-integratie via de `imsg`-bridge op een aangemelde Mac (of SSH-wrapper wanneer de Gateway elders draait), inclusief acties via de privé-API voor antwoorden, tapbacks, effecten, bijlagen en groepsbeheer.
- [IRC](/nl/channels/irc) - Klassieke IRC-servers; kanalen + DM's met besturing voor koppeling/toelatingslijsten (officiële plugin).
- [LINE](/nl/channels/line) - LINE Messaging API-bot (officiële plugin).
- [Matrix](/nl/channels/matrix) - Matrix-protocol (officiële plugin).
- [Mattermost](/nl/channels/mattermost) - Bot API + WebSocket; kanalen, groepen, DM's (officiële plugin).
- [Microsoft Teams](/nl/channels/msteams) - Bot Framework; ondersteuning voor ondernemingen (officiële plugin).
- [Nextcloud Talk](/nl/channels/nextcloud-talk) - Zelfgehoste chat via Nextcloud Talk (officiële plugin).
- [Nostr](/nl/channels/nostr) - Gedecentraliseerde DM's via NIP-04 (officiële plugin).
- [QQ Bot](/nl/channels/qqbot) - QQ Bot API; privéchats, groepschats en rijke media (officiële plugin).
- [Reef](/nl/channels/reef) - Beveiligde, end-to-end versleutelde claw-naar-claw-berichtenuitwisseling tussen OpenClaw-agents van verschillende mensen (meegeleverde plugin).
- [Raft](/nl/channels/raft) - Raft CLI-wake-bridge voor samenwerking tussen mensen en agents (officiële plugin).
- [Signal](/nl/channels/signal) - signal-cli; gericht op privacy (officiële plugin).
- [Slack](/nl/channels/slack) - Bolt SDK; workspace-apps (officiële plugin).
- [SMS](/nl/channels/sms) - Door Twilio ondersteunde sms via de Gateway-webhook (officiële plugin).
- [Synology Chat](/nl/channels/synology-chat) - Synology NAS Chat via uitgaande+inkomende webhooks (officiële plugin).
- [Telegram](/nl/channels/telegram) - Opgenomen in de kern. Bot API via grammY; ondersteunt groepen.
- [Tlon](/nl/channels/tlon) - Op Urbit gebaseerde berichtenapp (officiële plugin).
- [Twitch](/nl/channels/twitch) - Twitch-chat via een IRC-verbinding (officiële plugin).
- [Spraakoproep](/nl/plugins/voice-call) - Telefonie via Plivo, Telnyx of Twilio (officiële plugin).
- [WebChat](/nl/web/webchat) - Opgenomen in de kern. Gateway WebChat-UI via WebSocket.
- [WeChat](/nl/channels/wechat) - Tencent iLink-bot via QR-aanmelding; alleen privéchats (externe plugin).
- [WhatsApp](/nl/channels/whatsapp) - Populairst; gebruikt Baileys en vereist QR-koppeling (officiële plugin).
- [Yuanbao](/nl/channels/yuanbao) - Tencent Yuanbao-bot (externe plugin).
- [Zalo](/nl/channels/zalo) - Zalo Bot API; populaire berichtenapp van Vietnam (officiële plugin).
- [Zalo ClawBot](/nl/channels/zaloclawbot) - Persoonlijke Zalo-assistent via QR-aanmelding; aan de eigenaar gebonden (externe plugin).
- [Zalo Personal](/nl/channels/zalouser) - Persoonlijk Zalo-account via QR-aanmelding (officiële plugin).

## Opmerkingen over bezorging

- Telegram-antwoorden die Markdown-afbeeldingssyntaxis bevatten, zoals `![alt](url)`,
  worden waar mogelijk in het uiteindelijke uitgaande pad omgezet in media-antwoorden.
- Slack-DM's met meerdere personen worden als groepschats gerouteerd, zodat groepsbeleid, gedrag
  voor vermeldingen en regels voor groepssessies van toepassing zijn op MPIM-gesprekken.
- De installatie van WhatsApp gebeurt naar behoefte: onboarding kan de installatieprocedure tonen voordat
  het pluginpakket is geïnstalleerd, en de Gateway laadt de externe
  ClawHub/npm-plugin alleen wanneer het kanaal daadwerkelijk actief is.
- Kanalen die door bots geschreven inkomende berichten accepteren, kunnen gedeelde
  [bescherming tegen botlussen](/nl/channels/bot-loop-protection) gebruiken om te voorkomen dat botparen
  elkaar eindeloos blijven beantwoorden.
- Ondersteunde ruimtes die altijd actief zijn, kunnen [omgevingsgebeurtenissen voor ruimtes](/nl/channels/ambient-room-events)
  gebruiken, zodat niet-vermelde gesprekken in de ruimte stille context worden, tenzij de agent berichten verzendt met
  de tool `message`.

## Opmerkingen

- Kanalen kunnen gelijktijdig actief zijn; configureer er meerdere en OpenClaw routeert per chat.
- De snelste installatie is meestal **Telegram** (eenvoudig bottoken, geen plugininstallatie). WhatsApp
  vereist QR-koppeling en slaat meer status op schijf op.
- Groepsgedrag verschilt per kanaal; zie [Groepen](/nl/channels/groups).
- DM-koppeling en toelatingslijsten worden voor de veiligheid afgedwongen; zie [Beveiliging](/nl/gateway/security).
- Problemen oplossen: [Problemen met kanalen oplossen](/nl/channels/troubleshooting).
- Modelproviders worden afzonderlijk gedocumenteerd; zie [Modelproviders](/nl/providers/models).
