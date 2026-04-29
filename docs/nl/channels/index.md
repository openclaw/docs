---
read_when:
    - Je wilt een chatkanaal kiezen voor OpenClaw
    - Je hebt een snel overzicht nodig van ondersteunde berichtenplatforms
summary: Berichtenplatforms waarmee OpenClaw verbinding kan maken
title: Chatkanalen
x-i18n:
    generated_at: "2026-04-29T22:25:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: b58a1f1a0500419015985500a301d9f8ee4fa3a67b11e30561cabe2dc57b5049
    source_path: channels/index.md
    workflow: 16
---

OpenClaw kan met je praten in elke chatapp die je al gebruikt. Elk kanaal maakt verbinding via de Gateway.
Tekst wordt overal ondersteund; media en reacties verschillen per kanaal.

## Bezorgingsnotities

- Telegram-antwoorden die markdown-afbeeldingssyntaxis bevatten, zoals `![alt](url)`,
  worden waar mogelijk omgezet naar media-antwoorden in het laatste uitgaande pad.
- Slack-DM's met meerdere personen worden als groepschats gerouteerd, dus groepsbeleid, vermeldingsgedrag
  en groepssessieregels zijn van toepassing op MPIM-gesprekken.
- WhatsApp-installatie gebeurt op aanvraag: onboarding kan de installatiestroom tonen voordat
  Baileys-runtimeafhankelijkheden zijn voorbereid, en de Gateway laadt de WhatsApp-runtime
  alleen wanneer het kanaal daadwerkelijk actief is.

## Ondersteunde kanalen

- [BlueBubbles](/nl/channels/bluebubbles) — **Aanbevolen voor iMessage**; gebruikt de REST API van de BlueBubbles macOS-server met volledige functieondersteuning (meegeleverde Plugin; bewerken, verzenden ongedaan maken, effecten, reacties, groepsbeheer — bewerken is momenteel defect op macOS 26 Tahoe).
- [Discord](/nl/channels/discord) — Discord Bot API + Gateway; ondersteunt servers, kanalen en DM's.
- [Feishu](/nl/channels/feishu) — Feishu/Lark-bot via WebSocket (meegeleverde Plugin).
- [Google Chat](/nl/channels/googlechat) — Google Chat API-app via HTTP-webhook.
- [iMessage (legacy)](/nl/channels/imessage) — Verouderde macOS-integratie via imsg CLI (verouderd, gebruik BlueBubbles voor nieuwe installaties).
- [IRC](/nl/channels/irc) — Klassieke IRC-servers; kanalen + DM's met koppelings-/toelatingslijstcontroles.
- [LINE](/nl/channels/line) — LINE Messaging API-bot (meegeleverde Plugin).
- [Matrix](/nl/channels/matrix) — Matrix-protocol (meegeleverde Plugin).
- [Mattermost](/nl/channels/mattermost) — Bot API + WebSocket; kanalen, groepen, DM's (meegeleverde Plugin).
- [Microsoft Teams](/nl/channels/msteams) — Bot Framework; ondersteuning voor ondernemingen (meegeleverde Plugin).
- [Nextcloud Talk](/nl/channels/nextcloud-talk) — Zelfgehoste chat via Nextcloud Talk (meegeleverde Plugin).
- [Nostr](/nl/channels/nostr) — Gedecentraliseerde DM's via NIP-04 (meegeleverde Plugin).
- [QQ Bot](/nl/channels/qqbot) — QQ Bot API; privéchat, groepschat en rich media (meegeleverde Plugin).
- [Signal](/nl/channels/signal) — signal-cli; privacygericht.
- [Slack](/nl/channels/slack) — Bolt SDK; workspace-apps.
- [Synology Chat](/nl/channels/synology-chat) — Synology NAS Chat via uitgaande+inkomende webhooks (meegeleverde Plugin).
- [Telegram](/nl/channels/telegram) — Bot API via grammY; ondersteunt groepen.
- [Tlon](/nl/channels/tlon) — Op Urbit gebaseerde messenger (meegeleverde Plugin).
- [Twitch](/nl/channels/twitch) — Twitch-chat via IRC-verbinding (meegeleverde Plugin).
- [Voice Call](/nl/plugins/voice-call) — Telefonie via Plivo of Twilio (Plugin, afzonderlijk geïnstalleerd).
- [WebChat](/nl/web/webchat) — Gateway WebChat-UI via WebSocket.
- [WeChat](/nl/channels/wechat) — Tencent iLink Bot-Plugin via QR-login; alleen privéchats (externe Plugin).
- [WhatsApp](/nl/channels/whatsapp) — Populairst; gebruikt Baileys en vereist QR-koppeling.
- [Yuanbao](/nl/channels/yuanbao) — Tencent Yuanbao-bot (externe Plugin).
- [Zalo](/nl/channels/zalo) — Zalo Bot API; de populaire messenger van Vietnam (meegeleverde Plugin).
- [Zalo Personal](/nl/channels/zalouser) — Persoonlijk Zalo-account via QR-login (meegeleverde Plugin).

## Notities

- Kanalen kunnen gelijktijdig draaien; configureer er meerdere en OpenClaw routeert per chat.
- De snelste installatie is meestal **Telegram** (eenvoudig bottoken). WhatsApp vereist QR-koppeling en
  slaat meer status op schijf op.
- Groepsgedrag verschilt per kanaal; zie [Groepen](/nl/channels/groups).
- DM-koppeling en toelatingslijsten worden afgedwongen voor veiligheid; zie [Beveiliging](/nl/gateway/security).
- Probleemoplossing: [Kanaalprobleemoplossing](/nl/channels/troubleshooting).
- Modelproviders worden afzonderlijk gedocumenteerd; zie [Modelproviders](/nl/providers/models).
