---
read_when:
    - Sie möchten einen Chat-Channel für OpenClaw auswählen.
    - Sie benötigen einen schnellen Überblick über unterstützte Messaging-Plattformen.
summary: Messaging-Plattformen, mit denen OpenClaw verbunden werden kann
title: Chat-Channels
x-i18n:
    generated_at: "2026-04-25T13:41:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: e97818dce89ea06a60f2cccd0cc8a78cba48d66ea39e4769f2b583690a4f75d0
    source_path: channels/index.md
    workflow: 15
---

OpenClaw kann mit Ihnen in jeder Chat-App sprechen, die Sie bereits verwenden. Jeder Channel wird über das Gateway verbunden.
Text wird überall unterstützt; Medien und Reaktionen variieren je nach Channel.

## Hinweise zur Zustellung

- Telegram-Antworten, die Markdown-Bildsyntax enthalten, etwa `![alt](url)`,
  werden nach Möglichkeit im letzten ausgehenden Schritt in Medienantworten umgewandelt.
- Slack-DMs mit mehreren Personen werden als Gruppenchats geleitet, daher gelten Gruppenrichtlinien, Mention-Verhalten
  und Regeln für Gruppen-Sessions auch für MPIM-Unterhaltungen.
- Die WhatsApp-Einrichtung erfolgt bei Bedarf: Das Onboarding kann den Einrichtungsablauf anzeigen, bevor
  Baileys-Laufzeitabhängigkeiten bereitgestellt werden, und das Gateway lädt die WhatsApp-Laufzeit nur,
  wenn der Channel tatsächlich aktiv ist.

## Unterstützte Channels

- [BlueBubbles](/de/channels/bluebubbles) — **Empfohlen für iMessage**; verwendet die REST-API des BlueBubbles-macOS-Servers mit vollständiger Funktionsunterstützung (gebündeltes Plugin; bearbeiten, zurückziehen, Effekte, Reaktionen, Gruppenverwaltung — Bearbeiten ist derzeit unter macOS 26 Tahoe defekt).
- [Discord](/de/channels/discord) — Discord Bot API + Gateway; unterstützt Server, Channels und DMs.
- [Feishu](/de/channels/feishu) — Feishu/Lark-Bot über WebSocket (gebündeltes Plugin).
- [Google Chat](/de/channels/googlechat) — Google Chat API-App über HTTP-Webhook.
- [iMessage (legacy)](/de/channels/imessage) — Alte macOS-Integration über imsg CLI (veraltet, verwenden Sie BlueBubbles für neue Setups).
- [IRC](/de/channels/irc) — Klassische IRC-Server; Channels + DMs mit Pairing-/Allowlist-Kontrollen.
- [LINE](/de/channels/line) — LINE Messaging API-Bot (gebündeltes Plugin).
- [Matrix](/de/channels/matrix) — Matrix-Protokoll (gebündeltes Plugin).
- [Mattermost](/de/channels/mattermost) — Bot API + WebSocket; Channels, Gruppen, DMs (gebündeltes Plugin).
- [Microsoft Teams](/de/channels/msteams) — Bot Framework; Unterstützung für Unternehmen (gebündeltes Plugin).
- [Nextcloud Talk](/de/channels/nextcloud-talk) — Selbst gehosteter Chat über Nextcloud Talk (gebündeltes Plugin).
- [Nostr](/de/channels/nostr) — Dezentrale DMs über NIP-04 (gebündeltes Plugin).
- [QQ Bot](/de/channels/qqbot) — QQ Bot API; privater Chat, Gruppenchat und Rich Media (gebündeltes Plugin).
- [Signal](/de/channels/signal) — signal-cli; auf Datenschutz ausgerichtet.
- [Slack](/de/channels/slack) — Bolt SDK; Workspace-Apps.
- [Synology Chat](/de/channels/synology-chat) — Synology NAS Chat über ausgehende + eingehende Webhooks (gebündeltes Plugin).
- [Telegram](/de/channels/telegram) — Bot API über grammY; unterstützt Gruppen.
- [Tlon](/de/channels/tlon) — Urbit-basierter Messenger (gebündeltes Plugin).
- [Twitch](/de/channels/twitch) — Twitch-Chat über IRC-Verbindung (gebündeltes Plugin).
- [Voice Call](/de/plugins/voice-call) — Telefonie über Plivo oder Twilio (Plugin, separat installiert).
- [WebChat](/de/web/webchat) — Gateway-WebChat-UI über WebSocket.
- [WeChat](/de/channels/wechat) — Tencent-iLink-Bot-Plugin über QR-Login; nur private Chats (externes Plugin).
- [WhatsApp](/de/channels/whatsapp) — Am weitesten verbreitet; verwendet Baileys und erfordert QR-Pairing.
- [Zalo](/de/channels/zalo) — Zalo Bot API; Vietnams beliebter Messenger (gebündeltes Plugin).
- [Zalo Personal](/de/channels/zalouser) — Persönliches Zalo-Konto über QR-Login (gebündeltes Plugin).

## Hinweise

- Channels können gleichzeitig laufen; konfigurieren Sie mehrere, und OpenClaw leitet pro Chat weiter.
- Die schnellste Einrichtung ist in der Regel **Telegram** (einfaches Bot-Token). WhatsApp erfordert QR-Pairing und
  speichert mehr Status auf der Festplatte.
- Das Gruppenverhalten variiert je nach Channel; siehe [Groups](/de/channels/groups).
- DM-Pairing und Allowlists werden aus Sicherheitsgründen erzwungen; siehe [Security](/de/gateway/security).
- Fehlerbehebung: [Channel-Fehlerbehebung](/de/channels/troubleshooting).
- Modellanbieter sind separat dokumentiert; siehe [Model Providers](/de/providers/models).
