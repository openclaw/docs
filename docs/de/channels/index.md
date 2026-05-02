---
read_when:
    - Sie möchten einen Chat-Kanal für OpenClaw auswählen
    - Sie benötigen einen schnellen Überblick über die unterstützten Messaging-Plattformen
summary: Messaging-Plattformen, mit denen sich OpenClaw verbinden kann
title: Chatkanäle
x-i18n:
    generated_at: "2026-05-02T06:26:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5937761c0aebc17e8633449d467219ea564b8b00a4a99f327aba7d73afe0c810
    source_path: channels/index.md
    workflow: 16
---

OpenClaw kann in jeder Chat-App mit Ihnen sprechen, die Sie bereits nutzen. Jeder Kanal verbindet sich über den Gateway.
Text wird überall unterstützt; Medien und Reaktionen variieren je nach Kanal.

## Hinweise zur Zustellung

- Telegram-Antworten, die Markdown-Bildsyntax enthalten, wie `![alt](url)`,
  werden nach Möglichkeit auf dem finalen ausgehenden Pfad in Medienantworten umgewandelt.
- Slack-Mehrpersonen-DMs werden als Gruppenchats geroutet, daher gelten Gruppenrichtlinien, Erwähnungsverhalten
  und Gruppen-Sitzungsregeln für MPIM-Unterhaltungen.
- WhatsApp-Einrichtung erfolgt bei Bedarf: Das Onboarding kann den Einrichtungsablauf anzeigen, bevor
  das Plugin-Paket installiert ist, und der Gateway lädt die WhatsApp-Runtime
  nur, wenn der Kanal tatsächlich aktiv ist.

## Unterstützte Kanäle

- [BlueBubbles](/de/channels/bluebubbles) — **Empfohlen für iMessage**; verwendet die REST API des BlueBubbles-macOS-Servers mit vollständiger Funktionsunterstützung (gebündeltes Plugin; Bearbeiten, Zurücknehmen des Sendens, Effekte, Reaktionen, Gruppenverwaltung — Bearbeiten ist derzeit unter macOS 26 Tahoe defekt).
- [Discord](/de/channels/discord) — Discord Bot API + Gateway; unterstützt Server, Kanäle und DMs.
- [Feishu](/de/channels/feishu) — Feishu/Lark-Bot über WebSocket (gebündeltes Plugin).
- [Google Chat](/de/channels/googlechat) — Google Chat API-App über HTTP-Webhook.
- [iMessage (legacy)](/de/channels/imessage) — Legacy-macOS-Integration über imsg CLI (veraltet, verwenden Sie BlueBubbles für neue Einrichtungen).
- [IRC](/de/channels/irc) — Klassische IRC-Server; Kanäle + DMs mit Pairing-/Allowlist-Steuerung.
- [LINE](/de/channels/line) — LINE Messaging API-Bot (gebündeltes Plugin).
- [Matrix](/de/channels/matrix) — Matrix-Protokoll (gebündeltes Plugin).
- [Mattermost](/de/channels/mattermost) — Bot API + WebSocket; Kanäle, Gruppen, DMs (gebündeltes Plugin).
- [Microsoft Teams](/de/channels/msteams) — Bot Framework; Enterprise-Unterstützung (gebündeltes Plugin).
- [Nextcloud Talk](/de/channels/nextcloud-talk) — Selbst gehosteter Chat über Nextcloud Talk (gebündeltes Plugin).
- [Nostr](/de/channels/nostr) — Dezentrale DMs über NIP-04 (gebündeltes Plugin).
- [QQ Bot](/de/channels/qqbot) — QQ Bot API; privater Chat, Gruppenchat und Rich Media (gebündeltes Plugin).
- [Signal](/de/channels/signal) — signal-cli; datenschutzorientiert.
- [Slack](/de/channels/slack) — Bolt SDK; Workspace-Apps.
- [Synology Chat](/de/channels/synology-chat) — Synology NAS Chat über ausgehende+eingehende Webhooks (gebündeltes Plugin).
- [Telegram](/de/channels/telegram) — Bot API über grammY; unterstützt Gruppen.
- [Tlon](/de/channels/tlon) — Urbit-basierter Messenger (gebündeltes Plugin).
- [Twitch](/de/channels/twitch) — Twitch-Chat über IRC-Verbindung (gebündeltes Plugin).
- [Voice Call](/de/plugins/voice-call) — Telefonie über Plivo oder Twilio (Plugin, separat installiert).
- [WebChat](/de/web/webchat) — Gateway WebChat UI über WebSocket.
- [WeChat](/de/channels/wechat) — Tencent iLink Bot-Plugin über QR-Login; nur private Chats (externes Plugin).
- [WhatsApp](/de/channels/whatsapp) — Am beliebtesten; verwendet Baileys und erfordert QR-Pairing.
- [Yuanbao](/de/channels/yuanbao) — Tencent Yuanbao-Bot (externes Plugin).
- [Zalo](/de/channels/zalo) — Zalo Bot API; Vietnams beliebter Messenger (gebündeltes Plugin).
- [Zalo Personal](/de/channels/zalouser) — Persönliches Zalo-Konto über QR-Login (gebündeltes Plugin).

## Hinweise

- Kanäle können gleichzeitig laufen; konfigurieren Sie mehrere, und OpenClaw routet pro Chat.
- Die schnellste Einrichtung ist in der Regel **Telegram** (einfaches Bot-Token). WhatsApp erfordert QR-Pairing und
  speichert mehr Zustand auf der Festplatte.
- Gruppenverhalten variiert je nach Kanal; siehe [Gruppen](/de/channels/groups).
- DM-Pairing und Allowlists werden aus Sicherheitsgründen erzwungen; siehe [Sicherheit](/de/gateway/security).
- Fehlerbehebung: [Kanal-Fehlerbehebung](/de/channels/troubleshooting).
- Model Provider sind separat dokumentiert; siehe [Model Provider](/de/providers/models).
