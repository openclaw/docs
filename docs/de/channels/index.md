---
read_when:
    - Sie möchten einen Chatkanal für OpenClaw auswählen
    - Sie benötigen einen schnellen Überblick über unterstützte Messaging-Plattformen
summary: Messaging-Plattformen, mit denen sich OpenClaw verbinden kann
title: Chatkanäle
x-i18n:
    generated_at: "2026-04-30T06:39:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: b58a1f1a0500419015985500a301d9f8ee4fa3a67b11e30561cabe2dc57b5049
    source_path: channels/index.md
    workflow: 16
---

OpenClaw kann über jede Chat-App mit Ihnen sprechen, die Sie bereits verwenden. Jeder Kanal verbindet sich über das Gateway.
Text wird überall unterstützt; Medien und Reaktionen variieren je nach Kanal.

## Hinweise zur Zustellung

- Telegram-Antworten, die Markdown-Bildsyntax enthalten, etwa `![alt](url)`,
  werden auf dem finalen ausgehenden Pfad nach Möglichkeit in Medienantworten umgewandelt.
- Slack-DMs mit mehreren Personen werden als Gruppenchats geroutet, daher gelten Gruppenrichtlinien, Erwähnungsverhalten
  und Regeln für Gruppensitzungen für MPIM-Unterhaltungen.
- Die WhatsApp-Einrichtung erfolgt bei Bedarf: Das Onboarding kann den Einrichtungsablauf anzeigen, bevor
  Baileys-Laufzeitabhängigkeiten bereitgestellt sind, und das Gateway lädt die WhatsApp-Laufzeit
  nur, wenn der Kanal tatsächlich aktiv ist.

## Unterstützte Kanäle

- [BlueBubbles](/de/channels/bluebubbles) — **Empfohlen für iMessage**; nutzt die REST API des BlueBubbles-macOS-Servers mit vollständiger Funktionsunterstützung (gebündeltes Plugin; Bearbeiten, Zurücknehmen, Effekte, Reaktionen, Gruppenverwaltung — Bearbeiten ist derzeit unter macOS 26 Tahoe defekt).
- [Discord](/de/channels/discord) — Discord Bot API + Gateway; unterstützt Server, Kanäle und DMs.
- [Feishu](/de/channels/feishu) — Feishu/Lark-Bot über WebSocket (gebündeltes Plugin).
- [Google Chat](/de/channels/googlechat) — Google Chat API-App über HTTP-Webhook.
- [iMessage (legacy)](/de/channels/imessage) — Legacy-macOS-Integration über imsg CLI (veraltet, verwenden Sie BlueBubbles für neue Einrichtungen).
- [IRC](/de/channels/irc) — Klassische IRC-Server; Kanäle + DMs mit Kopplungs- und Allowlist-Steuerung.
- [LINE](/de/channels/line) — LINE Messaging API-Bot (gebündeltes Plugin).
- [Matrix](/de/channels/matrix) — Matrix-Protokoll (gebündeltes Plugin).
- [Mattermost](/de/channels/mattermost) — Bot API + WebSocket; Kanäle, Gruppen, DMs (gebündeltes Plugin).
- [Microsoft Teams](/de/channels/msteams) — Bot Framework; Unternehmensunterstützung (gebündeltes Plugin).
- [Nextcloud Talk](/de/channels/nextcloud-talk) — Selbstgehosteter Chat über Nextcloud Talk (gebündeltes Plugin).
- [Nostr](/de/channels/nostr) — Dezentrale DMs über NIP-04 (gebündeltes Plugin).
- [QQ Bot](/de/channels/qqbot) — QQ Bot API; private Chats, Gruppenchats und Rich Media (gebündeltes Plugin).
- [Signal](/de/channels/signal) — signal-cli; datenschutzorientiert.
- [Slack](/de/channels/slack) — Bolt SDK; Workspace-Apps.
- [Synology Chat](/de/channels/synology-chat) — Synology NAS Chat über ausgehende+eingehende Webhooks (gebündeltes Plugin).
- [Telegram](/de/channels/telegram) — Bot API über grammY; unterstützt Gruppen.
- [Tlon](/de/channels/tlon) — Urbit-basierter Messenger (gebündeltes Plugin).
- [Twitch](/de/channels/twitch) — Twitch-Chat über IRC-Verbindung (gebündeltes Plugin).
- [Voice Call](/de/plugins/voice-call) — Telefonie über Plivo oder Twilio (Plugin, separat installiert).
- [WebChat](/de/web/webchat) — Gateway-WebChat-UI über WebSocket.
- [WeChat](/de/channels/wechat) — Tencent iLink Bot-Plugin über QR-Anmeldung; nur private Chats (externes Plugin).
- [WhatsApp](/de/channels/whatsapp) — Am beliebtesten; nutzt Baileys und erfordert QR-Kopplung.
- [Yuanbao](/de/channels/yuanbao) — Tencent Yuanbao-Bot (externes Plugin).
- [Zalo](/de/channels/zalo) — Zalo Bot API; beliebter Messenger in Vietnam (gebündeltes Plugin).
- [Zalo Personal](/de/channels/zalouser) — Persönliches Zalo-Konto über QR-Anmeldung (gebündeltes Plugin).

## Hinweise

- Kanäle können gleichzeitig ausgeführt werden; konfigurieren Sie mehrere, und OpenClaw routet pro Chat.
- Die schnellste Einrichtung ist normalerweise **Telegram** (einfaches Bot-Token). WhatsApp erfordert QR-Kopplung und
  speichert mehr Zustand auf der Festplatte.
- Das Gruppenverhalten variiert je nach Kanal; siehe [Gruppen](/de/channels/groups).
- DM-Kopplung und Allowlists werden aus Sicherheitsgründen erzwungen; siehe [Sicherheit](/de/gateway/security).
- Fehlerbehebung: [Kanal-Fehlerbehebung](/de/channels/troubleshooting).
- Modell-Provider sind separat dokumentiert; siehe [Modell-Provider](/de/providers/models).
