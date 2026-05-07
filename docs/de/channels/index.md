---
read_when:
    - Sie möchten einen Chat-Kanal für OpenClaw auswählen
    - Sie benötigen einen schnellen Überblick über unterstützte Nachrichtenplattformen
summary: Messaging-Plattformen, mit denen OpenClaw eine Verbindung herstellen kann
title: Chat-Kanäle
x-i18n:
    generated_at: "2026-05-07T01:50:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: ff6875f4ae86b341b6a82e13f022266461bc102ee03074a8c352eea2203d657a
    source_path: channels/index.md
    workflow: 16
---

OpenClaw kann in jeder Chat-App mit Ihnen kommunizieren, die Sie bereits nutzen. Jeder Kanal verbindet sich über das Gateway.
Text wird überall unterstützt; Medien und Reaktionen variieren je nach Kanal.

## Hinweise zur Zustellung

- Telegram-Antworten, die Markdown-Bildsyntax enthalten, etwa `![alt](url)`,
  werden auf dem finalen ausgehenden Pfad nach Möglichkeit in Medienantworten umgewandelt.
- Slack-DMs mit mehreren Personen werden als Gruppenchats weitergeleitet, daher gelten Gruppenrichtlinien, Erwähnungsverhalten
  und Regeln für Gruppensitzungen für MPIM-Unterhaltungen.
- Die Einrichtung von WhatsApp erfolgt bei Bedarf: Das Onboarding kann den Einrichtungsablauf anzeigen, bevor
  das Plugin-Paket installiert ist, und das Gateway lädt die WhatsApp-Runtime
  nur, wenn der Kanal tatsächlich aktiv ist.

## Unterstützte Kanäle

- [BlueBubbles](/de/channels/bluebubbles) - Legacy-iMessage-Brücke über die REST-API des BlueBubbles-macOS-Servers; für neue OpenClaw-Einrichtungen veraltet, aber weiterhin für bestehende Konfigurationen und umfangreichere Private-API-Aktionen unterstützt.
- [Discord](/de/channels/discord) - Discord Bot API + Gateway; unterstützt Server, Kanäle und DMs.
- [Feishu](/de/channels/feishu) - Feishu/Lark-Bot über WebSocket (gebündeltes Plugin).
- [Google Chat](/de/channels/googlechat) - Google Chat API-App über HTTP-Webhook (herunterladbares Plugin).
- [iMessage](/de/channels/imessage) - Native macOS-Integration über die imsg-CLI; bevorzugt für neue OpenClaw-iMessage-Einrichtungen, wenn Host-Berechtigungen und Messages-Zugriff passen.
- [IRC](/de/channels/irc) - Klassische IRC-Server; Kanäle + DMs mit Pairing-/Allowlist-Steuerungen.
- [LINE](/de/channels/line) - LINE Messaging API-Bot (herunterladbares Plugin).
- [Matrix](/de/channels/matrix) - Matrix-Protokoll (herunterladbares Plugin).
- [Mattermost](/de/channels/mattermost) - Bot API + WebSocket; Kanäle, Gruppen, DMs (herunterladbares Plugin).
- [Microsoft Teams](/de/channels/msteams) - Bot Framework; Enterprise-Support (gebündeltes Plugin).
- [Nextcloud Talk](/de/channels/nextcloud-talk) - Selbst gehosteter Chat über Nextcloud Talk (gebündeltes Plugin).
- [Nostr](/de/channels/nostr) - Dezentrale DMs über NIP-04 (gebündeltes Plugin).
- [QQ Bot](/de/channels/qqbot) - QQ Bot API; privater Chat, Gruppenchat und Rich Media (gebündeltes Plugin).
- [Signal](/de/channels/signal) - signal-cli; datenschutzorientiert.
- [Slack](/de/channels/slack) - Bolt SDK; Workspace-Apps.
- [Synology Chat](/de/channels/synology-chat) - Synology NAS Chat über ausgehende+eingehende Webhooks (gebündeltes Plugin).
- [Telegram](/de/channels/telegram) - Bot API über grammY; unterstützt Gruppen.
- [Tlon](/de/channels/tlon) - Urbit-basierter Messenger (gebündeltes Plugin).
- [Twitch](/de/channels/twitch) - Twitch-Chat über IRC-Verbindung (gebündeltes Plugin).
- [Voice Call](/de/plugins/voice-call) - Telefonie über Plivo oder Twilio (Plugin, separat installiert).
- [WebChat](/de/web/webchat) - Gateway WebChat UI über WebSocket.
- [WeChat](/de/channels/wechat) - Tencent iLink Bot-Plugin über QR-Login; nur private Chats (externes Plugin).
- [WhatsApp](/de/channels/whatsapp) - Am beliebtesten; verwendet Baileys und erfordert QR-Pairing.
- [Yuanbao](/de/channels/yuanbao) - Tencent Yuanbao-Bot (externes Plugin).
- [Zalo](/de/channels/zalo) - Zalo Bot API; Vietnams beliebter Messenger (gebündeltes Plugin).
- [Zalo Personal](/de/channels/zalouser) - Persönliches Zalo-Konto über QR-Login (gebündeltes Plugin).

## Hinweise

- Kanäle können gleichzeitig ausgeführt werden; konfigurieren Sie mehrere, und OpenClaw leitet pro Chat weiter.
- Die schnellste Einrichtung ist in der Regel **Telegram** (einfaches Bot-Token). WhatsApp erfordert QR-Pairing und
  speichert mehr Status auf der Festplatte.
- Das Gruppenverhalten variiert je nach Kanal; siehe [Gruppen](/de/channels/groups).
- DM-Pairing und Allowlists werden zur Sicherheit erzwungen; siehe [Sicherheit](/de/gateway/security).
- Fehlerbehebung: [Kanal-Fehlerbehebung](/de/channels/troubleshooting).
- Modell-Provider sind separat dokumentiert; siehe [Modell-Provider](/de/providers/models).
