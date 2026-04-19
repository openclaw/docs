---
read_when:
    - Sie möchten einen Chat-Kanal für OpenClaw auswählen
    - Sie benötigen einen schnellen Überblick über unterstützte Messaging-Plattformen
summary: Messaging-Plattformen, mit denen OpenClaw sich verbinden kann
title: Chat-Kanäle
x-i18n:
    generated_at: "2026-04-19T01:11:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: d41c3a37d91c07f15afd8e199a289297772331c70e38697346a373595eb2d993
    source_path: channels/index.md
    workflow: 15
---

# Chat-Kanäle

OpenClaw kann mit Ihnen in jeder Chat-App sprechen, die Sie bereits verwenden. Jeder Kanal verbindet sich über das Gateway.
Text wird überall unterstützt; Medien und Reaktionen variieren je nach Kanal.

## Unterstützte Kanäle

- [BlueBubbles](/de/channels/bluebubbles) — **Empfohlen für iMessage**; verwendet die BlueBubbles-macOS-Server-REST-API mit vollständiger Funktionsunterstützung (gebündeltes Plugin; Bearbeiten, Zurückziehen, Effekte, Reaktionen, Gruppenverwaltung — Bearbeiten ist derzeit unter macOS 26 Tahoe defekt).
- [Discord](/de/channels/discord) — Discord Bot API + Gateway; unterstützt Server, Kanäle und DMs.
- [Feishu](/de/channels/feishu) — Feishu/Lark-Bot über WebSocket (gebündeltes Plugin).
- [Google Chat](/de/channels/googlechat) — Google Chat API-App über HTTP-Webhook.
- [iMessage (legacy)](/de/channels/imessage) — Legacy-macOS-Integration über imsg CLI (veraltet, verwenden Sie für neue Setups BlueBubbles).
- [IRC](/de/channels/irc) — Klassische IRC-Server; Kanäle + DMs mit Pairing-/Allowlist-Kontrollen.
- [LINE](/de/channels/line) — LINE Messaging API-Bot (gebündeltes Plugin).
- [Matrix](/de/channels/matrix) — Matrix-Protokoll (gebündeltes Plugin).
- [Mattermost](/de/channels/mattermost) — Bot API + WebSocket; Kanäle, Gruppen, DMs (gebündeltes Plugin).
- [Microsoft Teams](/de/channels/msteams) — Bot Framework; Enterprise-Unterstützung (gebündeltes Plugin).
- [Nextcloud Talk](/de/channels/nextcloud-talk) — Selbst gehosteter Chat über Nextcloud Talk (gebündeltes Plugin).
- [Nostr](/de/channels/nostr) — Dezentrale DMs über NIP-04 (gebündeltes Plugin).
- [QQ Bot](/de/channels/qqbot) — QQ Bot API; privater Chat, Gruppenchat und Rich Media (gebündeltes Plugin).
- [Signal](/de/channels/signal) — signal-cli; datenschutzorientiert.
- [Slack](/de/channels/slack) — Bolt SDK; Workspace-Apps.
- [Synology Chat](/de/channels/synology-chat) — Synology NAS Chat über ausgehende + eingehende Webhooks (gebündeltes Plugin).
- [Telegram](/de/channels/telegram) — Bot API über grammY; unterstützt Gruppen.
- [Tlon](/de/channels/tlon) — Urbit-basierter Messenger (gebündeltes Plugin).
- [Twitch](/de/channels/twitch) — Twitch-Chat über IRC-Verbindung (gebündeltes Plugin).
- [Voice Call](/de/plugins/voice-call) — Telefonie über Plivo oder Twilio (Plugin, separat installiert).
- [WebChat](/web/webchat) — Gateway-WebChat-Benutzeroberfläche über WebSocket.
- [WeChat](/de/channels/wechat) — Tencent iLink Bot-Plugin über QR-Login; nur private Chats (externes Plugin).
- [WhatsApp](/de/channels/whatsapp) — Am beliebtesten; verwendet Baileys und erfordert QR-Pairing.
- [Zalo](/de/channels/zalo) — Zalo Bot API; Vietnams beliebter Messenger (gebündeltes Plugin).
- [Zalo Personal](/de/channels/zalouser) — Persönliches Zalo-Konto über QR-Login (gebündeltes Plugin).

## Hinweise

- Kanäle können gleichzeitig ausgeführt werden; konfigurieren Sie mehrere, und OpenClaw leitet pro Chat weiter.
- Die schnellste Einrichtung ist normalerweise **Telegram** (einfaches Bot-Token). WhatsApp erfordert QR-Pairing und
  speichert mehr Status auf der Festplatte.
- Das Gruppenverhalten variiert je nach Kanal; siehe [Groups](/de/channels/groups).
- DM-Pairing und Allowlists werden aus Sicherheitsgründen durchgesetzt; siehe [Security](/de/gateway/security).
- Fehlerbehebung: [Fehlerbehebung für Kanäle](/de/channels/troubleshooting).
- Modellanbieter werden separat dokumentiert; siehe [Model Providers](/de/providers/models).
