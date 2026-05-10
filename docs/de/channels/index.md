---
read_when:
    - Sie möchten einen Chat-Kanal für OpenClaw auswählen
    - Sie benötigen einen schnellen Überblick über die unterstützten Messaging-Plattformen
summary: Messaging-Plattformen, mit denen sich OpenClaw verbinden kann
title: Chat-Kanäle
x-i18n:
    generated_at: "2026-05-10T19:21:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 57ae81a99d265abbf3f9f016506e787d66b4f6984d833e43e7a8554e157a3c17
    source_path: channels/index.md
    workflow: 16
---

OpenClaw kann über jede Chat-App mit Ihnen kommunizieren, die Sie bereits verwenden. Jeder Kanal verbindet sich über das Gateway.
Text wird überall unterstützt; Medien und Reaktionen variieren je nach Kanal.

## Hinweise zur Zustellung

- Telegram-Antworten, die Markdown-Bildsyntax enthalten, wie etwa `![alt](url)`,
  werden, wenn möglich, auf dem abschließenden ausgehenden Pfad in Medienantworten umgewandelt.
- Slack-Direktnachrichten mit mehreren Personen werden als Gruppenchats geroutet, daher gelten Gruppenrichtlinien,
  Erwähnungsverhalten und Regeln für Gruppensitzungen für MPIM-Unterhaltungen.
- Die WhatsApp-Einrichtung erfolgt bei Bedarf: Das Onboarding kann den Einrichtungsablauf anzeigen, bevor
  das Plugin-Paket installiert ist, und das Gateway lädt die WhatsApp-Laufzeitumgebung
  nur, wenn der Kanal tatsächlich aktiv ist.

## Unterstützte Kanäle

- [Discord](/de/channels/discord) - Discord Bot API + Gateway; unterstützt Server, Kanäle und Direktnachrichten.
- [Feishu](/de/channels/feishu) - Feishu/Lark-Bot über WebSocket (gebündeltes Plugin).
- [Google Chat](/de/channels/googlechat) - Google Chat API-App über HTTP-Webhook (herunterladbares Plugin).
- [iMessage](/de/channels/imessage) - Native macOS-Integration über die `imsg`-Bridge auf einem angemeldeten Mac (oder SSH-Wrapper, wenn das Gateway anderswo läuft), einschließlich privater API-Aktionen für Antworten, Tapbacks, Effekte, Anhänge und Gruppenverwaltung. Bevorzugt für neue OpenClaw iMessage-Einrichtungen, wenn Host-Berechtigungen und Zugriff auf Nachrichten passen.
- [IRC](/de/channels/irc) - Klassische IRC-Server; Kanäle + Direktnachrichten mit Kopplungs- und Allowlist-Steuerungen.
- [LINE](/de/channels/line) - LINE Messaging API-Bot (herunterladbares Plugin).
- [Matrix](/de/channels/matrix) - Matrix-Protokoll (herunterladbares Plugin).
- [Mattermost](/de/channels/mattermost) - Bot API + WebSocket; Kanäle, Gruppen, Direktnachrichten (herunterladbares Plugin).
- [Microsoft Teams](/de/channels/msteams) - Bot Framework; Enterprise-Unterstützung (gebündeltes Plugin).
- [Nextcloud Talk](/de/channels/nextcloud-talk) - Selbst gehosteter Chat über Nextcloud Talk (gebündeltes Plugin).
- [Nostr](/de/channels/nostr) - Dezentralisierte Direktnachrichten über NIP-04 (gebündeltes Plugin).
- [QQ Bot](/de/channels/qqbot) - QQ Bot API; privater Chat, Gruppenchat und Rich Media (gebündeltes Plugin).
- [Signal](/de/channels/signal) - signal-cli; datenschutzorientiert.
- [Slack](/de/channels/slack) - Bolt SDK; Workspace-Apps.
- [Synology Chat](/de/channels/synology-chat) - Synology NAS Chat über ausgehende+eingehende Webhooks (gebündeltes Plugin).
- [Telegram](/de/channels/telegram) - Bot API über grammY; unterstützt Gruppen.
- [Tlon](/de/channels/tlon) - Urbit-basierter Messenger (gebündeltes Plugin).
- [Twitch](/de/channels/twitch) - Twitch-Chat über IRC-Verbindung (gebündeltes Plugin).
- [Voice Call](/de/plugins/voice-call) - Telefonie über Plivo oder Twilio (Plugin, separat installiert).
- [WebChat](/de/web/webchat) - Gateway-WebChat-UI über WebSocket.
- [WeChat](/de/channels/wechat) - Tencent iLink Bot-Plugin über QR-Anmeldung; nur private Chats (externes Plugin).
- [WhatsApp](/de/channels/whatsapp) - Am beliebtesten; verwendet Baileys und erfordert QR-Kopplung.
- [Yuanbao](/de/channels/yuanbao) - Tencent Yuanbao-Bot (externes Plugin).
- [Zalo](/de/channels/zalo) - Zalo Bot API; Vietnams beliebter Messenger (gebündeltes Plugin).
- [Zalo Personal](/de/channels/zalouser) - Persönliches Zalo-Konto über QR-Anmeldung (gebündeltes Plugin).

## Hinweise

- Kanäle können gleichzeitig laufen; konfigurieren Sie mehrere, und OpenClaw routet pro Chat.
- Die schnellste Einrichtung ist normalerweise **Telegram** (einfaches Bot-Token). WhatsApp erfordert QR-Kopplung und
  speichert mehr Zustand auf der Festplatte.
- Gruppenverhalten variiert je nach Kanal; siehe [Gruppen](/de/channels/groups).
- Kopplung für Direktnachrichten und Allowlists werden aus Sicherheitsgründen durchgesetzt; siehe [Sicherheit](/de/gateway/security).
- Fehlerbehebung: [Fehlerbehebung für Kanäle](/de/channels/troubleshooting).
- Modell-Provider werden separat dokumentiert; siehe [Modell-Provider](/de/providers/models).
