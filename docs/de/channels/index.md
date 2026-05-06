---
read_when:
    - Sie möchten einen Chat-Kanal für OpenClaw auswählen
    - Sie benötigen einen schnellen Überblick über unterstützte Messaging-Plattformen
summary: Messaging-Plattformen, mit denen sich OpenClaw verbinden kann
title: Chat-Kanäle
x-i18n:
    generated_at: "2026-05-06T06:40:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: c357a9dfabf12329954f30084fe9abfad9aa96f62bcd72b3d0802819d5979d7b
    source_path: channels/index.md
    workflow: 16
---

OpenClaw kann Sie in jeder Chat-App erreichen, die Sie bereits verwenden. Jeder Kanal verbindet sich über den Gateway.
Text wird überall unterstützt; Medien und Reaktionen variieren je nach Kanal.

## Hinweise zur Zustellung

- Telegram-Antworten, die Markdown-Bildsyntax enthalten, wie `![alt](url)`,
  werden, sofern möglich, auf dem finalen ausgehenden Pfad in Medienantworten umgewandelt.
- Slack-Multi-Person-DMs werden als Gruppenchats geroutet, daher gelten Gruppenrichtlinien, Erwähnungs-
  verhalten und Regeln für Gruppensitzungen auch für MPIM-Unterhaltungen.
- Die WhatsApp-Einrichtung erfolgt bei Bedarf: Das Onboarding kann den Einrichtungsablauf anzeigen, bevor
  das Plugin-Paket installiert ist, und der Gateway lädt die WhatsApp-Laufzeit
  nur, wenn der Kanal tatsächlich aktiv ist.

## Unterstützte Kanäle

- [BlueBubbles](/de/channels/bluebubbles) - **Empfohlen für iMessage**; verwendet die REST-API des BlueBubbles-macOS-Servers mit vollständiger Funktionsunterstützung (mitgeliefertes Plugin; Bearbeiten, Zurückziehen, Effekte, Reaktionen, Gruppenverwaltung - Bearbeiten ist derzeit unter macOS 26 Tahoe defekt).
- [Discord](/de/channels/discord) - Discord Bot API + Gateway; unterstützt Server, Kanäle und DMs.
- [Feishu](/de/channels/feishu) - Feishu/Lark-Bot über WebSocket (mitgeliefertes Plugin).
- [Google Chat](/de/channels/googlechat) - Google Chat API-App über HTTP-Webhook (herunterladbares Plugin).
- [iMessage (veraltet)](/de/channels/imessage) - Veraltete macOS-Integration über imsg CLI (veraltet, verwenden Sie BlueBubbles für neue Einrichtungen).
- [IRC](/de/channels/irc) - Klassische IRC-Server; Kanäle + DMs mit Kopplungs-/Allowlist-Kontrollen.
- [LINE](/de/channels/line) - LINE Messaging API-Bot (herunterladbares Plugin).
- [Matrix](/de/channels/matrix) - Matrix-Protokoll (herunterladbares Plugin).
- [Mattermost](/de/channels/mattermost) - Bot API + WebSocket; Kanäle, Gruppen, DMs (herunterladbares Plugin).
- [Microsoft Teams](/de/channels/msteams) - Bot Framework; Unternehmensunterstützung (mitgeliefertes Plugin).
- [Nextcloud Talk](/de/channels/nextcloud-talk) - Selbstgehosteter Chat über Nextcloud Talk (mitgeliefertes Plugin).
- [Nostr](/de/channels/nostr) - Dezentrale DMs über NIP-04 (mitgeliefertes Plugin).
- [QQ Bot](/de/channels/qqbot) - QQ Bot API; privater Chat, Gruppenchat und Rich Media (mitgeliefertes Plugin).
- [Signal](/de/channels/signal) - signal-cli; datenschutzorientiert.
- [Slack](/de/channels/slack) - Bolt SDK; Workspace-Apps.
- [Synology Chat](/de/channels/synology-chat) - Synology NAS Chat über ausgehende+eingehende Webhooks (mitgeliefertes Plugin).
- [Telegram](/de/channels/telegram) - Bot API über grammY; unterstützt Gruppen.
- [Tlon](/de/channels/tlon) - Urbit-basierter Messenger (mitgeliefertes Plugin).
- [Twitch](/de/channels/twitch) - Twitch-Chat über IRC-Verbindung (mitgeliefertes Plugin).
- [Voice Call](/de/plugins/voice-call) - Telefonie über Plivo oder Twilio (Plugin, separat installiert).
- [WebChat](/de/web/webchat) - Gateway WebChat-UI über WebSocket.
- [WeChat](/de/channels/wechat) - Tencent iLink Bot-Plugin über QR-Anmeldung; nur private Chats (externes Plugin).
- [WhatsApp](/de/channels/whatsapp) - Am beliebtesten; verwendet Baileys und erfordert QR-Kopplung.
- [Yuanbao](/de/channels/yuanbao) - Tencent Yuanbao-Bot (externes Plugin).
- [Zalo](/de/channels/zalo) - Zalo Bot API; Vietnams beliebter Messenger (mitgeliefertes Plugin).
- [Zalo Personal](/de/channels/zalouser) - Persönliches Zalo-Konto über QR-Anmeldung (mitgeliefertes Plugin).

## Hinweise

- Kanäle können gleichzeitig laufen; konfigurieren Sie mehrere, und OpenClaw routet pro Chat.
- Die schnellste Einrichtung ist in der Regel **Telegram** (einfaches Bot-Token). WhatsApp erfordert QR-Kopplung und
  speichert mehr Zustand auf der Festplatte.
- Das Gruppenverhalten variiert je nach Kanal; siehe [Gruppen](/de/channels/groups).
- DM-Kopplung und Allowlists werden aus Sicherheitsgründen erzwungen; siehe [Sicherheit](/de/gateway/security).
- Fehlerbehebung: [Kanal-Fehlerbehebung](/de/channels/troubleshooting).
- Modell-Provider sind separat dokumentiert; siehe [Modell-Provider](/de/providers/models).
