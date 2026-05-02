---
read_when:
    - Sie möchten einen Chat-Kanal für OpenClaw auswählen
    - Sie benötigen einen schnellen Überblick über unterstützte Messaging-Plattformen
summary: Messaging-Plattformen, mit denen OpenClaw eine Verbindung herstellen kann
title: Chat-Kanäle
x-i18n:
    generated_at: "2026-05-02T20:41:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 785af727e9491914f5a9459672d47c2cfde3319b318c698051cd7e89d023d4b9
    source_path: channels/index.md
    workflow: 16
---

OpenClaw kann mit Ihnen in jeder Chat-App sprechen, die Sie bereits verwenden. Jeder Kanal verbindet sich über den Gateway.
Text wird überall unterstützt; Medien und Reaktionen variieren je nach Kanal.

## Hinweise zur Zustellung

- Telegram-Antworten, die Markdown-Bildsyntax enthalten, z. B. `![alt](url)`,
  werden auf dem finalen ausgehenden Pfad nach Möglichkeit in Medienantworten umgewandelt.
- Slack-Mehrpersonen-DMs werden als Gruppenchats weitergeleitet, daher gelten Gruppenrichtlinien,
  Erwähnungsverhalten und Regeln für Gruppensitzungen für MPIM-Unterhaltungen.
- Die WhatsApp-Einrichtung erfolgt bei Bedarf: Das Onboarding kann den Einrichtungsablauf anzeigen, bevor
  das Plugin-Paket installiert ist, und der Gateway lädt die WhatsApp-Laufzeit
  erst, wenn der Kanal tatsächlich aktiv ist.

## Unterstützte Kanäle

- [BlueBubbles](/de/channels/bluebubbles) — **Empfohlen für iMessage**; verwendet die BlueBubbles-macOS-Server-REST-API mit vollständiger Funktionsunterstützung (gebündeltes Plugin; Bearbeiten, Zurückrufen, Effekte, Reaktionen, Gruppenverwaltung — Bearbeiten ist derzeit unter macOS 26 Tahoe defekt).
- [Discord](/de/channels/discord) — Discord Bot API + Gateway; unterstützt Server, Kanäle und DMs.
- [Feishu](/de/channels/feishu) — Feishu/Lark-Bot über WebSocket (gebündeltes Plugin).
- [Google Chat](/de/channels/googlechat) — Google Chat API-App über HTTP-Webhook (herunterladbares Plugin).
- [iMessage (legacy)](/de/channels/imessage) — Legacy-macOS-Integration über imsg CLI (veraltet, verwenden Sie BlueBubbles für neue Setups).
- [IRC](/de/channels/irc) — Klassische IRC-Server; Kanäle + DMs mit Pairing-/Allowlist-Steuerung.
- [LINE](/de/channels/line) — LINE Messaging API-Bot (herunterladbares Plugin).
- [Matrix](/de/channels/matrix) — Matrix-Protokoll (herunterladbares Plugin).
- [Mattermost](/de/channels/mattermost) — Bot API + WebSocket; Kanäle, Gruppen, DMs (herunterladbares Plugin).
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
- [WebChat](/de/web/webchat) — Gateway-WebChat-UI über WebSocket.
- [WeChat](/de/channels/wechat) — Tencent iLink Bot-Plugin über QR-Anmeldung; nur private Chats (externes Plugin).
- [WhatsApp](/de/channels/whatsapp) — Am beliebtesten; verwendet Baileys und erfordert QR-Pairing.
- [Yuanbao](/de/channels/yuanbao) — Tencent Yuanbao-Bot (externes Plugin).
- [Zalo](/de/channels/zalo) — Zalo Bot API; Vietnams beliebter Messenger (gebündeltes Plugin).
- [Zalo Personal](/de/channels/zalouser) — Persönliches Zalo-Konto über QR-Anmeldung (gebündeltes Plugin).

## Hinweise

- Kanäle können gleichzeitig ausgeführt werden; konfigurieren Sie mehrere, und OpenClaw leitet pro Chat weiter.
- Die schnellste Einrichtung ist in der Regel **Telegram** (einfaches Bot-Token). WhatsApp erfordert QR-Pairing und
  speichert mehr Zustand auf der Festplatte.
- Das Gruppenverhalten variiert je nach Kanal; siehe [Gruppen](/de/channels/groups).
- DM-Pairing und Allowlists werden aus Sicherheitsgründen erzwungen; siehe [Sicherheit](/de/gateway/security).
- Fehlerbehebung: [Fehlerbehebung für Kanäle](/de/channels/troubleshooting).
- Modell-Provider sind separat dokumentiert; siehe [Modell-Provider](/de/providers/models).
