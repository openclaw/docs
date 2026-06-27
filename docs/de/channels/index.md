---
read_when:
    - Sie möchten einen Chat-Kanal für OpenClaw auswählen
    - Sie benötigen einen schnellen Überblick über unterstützte Messaging-Plattformen
summary: Messaging-Plattformen, mit denen OpenClaw verbunden werden kann
title: Chat-Kanäle
x-i18n:
    generated_at: "2026-06-27T17:10:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3ff3e59df21d71f0d80eff2a6299169bfeb15964834a552f3c4c1d5b7c144b8d
    source_path: channels/index.md
    workflow: 16
---

OpenClaw kann über jede Chat-App mit Ihnen sprechen, die Sie bereits verwenden. Jeder Kanal verbindet sich über den Gateway.
Text wird überall unterstützt; Medien und Reaktionen variieren je nach Kanal.

## Hinweise zur Zustellung

- Telegram-Antworten, die Markdown-Bildsyntax enthalten, wie `![alt](url)`,
  werden nach Möglichkeit auf dem finalen ausgehenden Pfad in Medienantworten umgewandelt.
- Slack-Multi-Person-DMs werden als Gruppenchats geroutet, daher gelten Gruppenrichtlinien, Erwähnungsverhalten
  und Gruppensitzungsregeln für MPIM-Unterhaltungen.
- Die WhatsApp-Einrichtung erfolgt bei Bedarf: Das Onboarding kann den Einrichtungsablauf anzeigen, bevor
  das Plugin-Paket installiert ist, und der Gateway lädt das externe
  ClawHub/npm-Plugin erst, wenn der Kanal tatsächlich aktiv ist.
- Kanäle, die von Bots verfasste eingehende Nachrichten akzeptieren, können den gemeinsamen
  [Bot-Loop-Schutz](/de/channels/bot-loop-protection) verwenden, um zu verhindern, dass Bot-Paare
  unbegrenzt aufeinander antworten.
- Unterstützte Always-on-Räume können [Ambient-Raumereignisse](/de/channels/ambient-room-events)
  verwenden, sodass nicht erwähnte Raumunterhaltungen zu stillem Kontext werden, sofern der Agent nicht mit
  dem `message`-Tool sendet.

## Unterstützte Kanäle

- [Discord](/de/channels/discord) - Discord Bot API + Gateway; unterstützt Server, Kanäle und DMs.
- [Feishu](/de/channels/feishu) - Feishu/Lark-Bot über WebSocket (gebündeltes Plugin).
- [Google Chat](/de/channels/googlechat) - Google Chat API-App über HTTP-Webhook (herunterladbares Plugin).
- [iMessage](/de/channels/imessage) - Native macOS-Integration über die `imsg`-Bridge auf einem angemeldeten Mac (oder SSH-Wrapper, wenn der Gateway anderswo ausgeführt wird), einschließlich privater API-Aktionen für Antworten, Tapbacks, Effekte, Anhänge und Gruppenverwaltung. Bevorzugt für neue OpenClaw iMessage-Einrichtungen, wenn Host-Berechtigungen und Messages-Zugriff passen.
- [IRC](/de/channels/irc) - Klassische IRC-Server; Kanäle + DMs mit Kopplungs-/Allowlist-Steuerungen.
- [LINE](/de/channels/line) - LINE Messaging API-Bot (herunterladbares Plugin).
- [Matrix](/de/channels/matrix) - Matrix-Protokoll (herunterladbares Plugin).
- [Mattermost](/de/channels/mattermost) - Bot API + WebSocket; Kanäle, Gruppen, DMs (herunterladbares Plugin).
- [Microsoft Teams](/de/channels/msteams) - Bot Framework; Enterprise-Support (gebündeltes Plugin).
- [Nextcloud Talk](/de/channels/nextcloud-talk) - Selbst gehosteter Chat über Nextcloud Talk (gebündeltes Plugin).
- [Nostr](/de/channels/nostr) - Dezentrale DMs über NIP-04 (gebündeltes Plugin).
- [QQ Bot](/de/channels/qqbot) - QQ Bot API; private Chats, Gruppenchats und Rich Media (gebündeltes Plugin).
- [Raft](/de/channels/raft) - Raft CLI-Wake-Bridge für Zusammenarbeit zwischen Menschen und Agenten (externes Plugin).
- [Signal](/de/channels/signal) - signal-cli; datenschutzorientiert.
- [Slack](/de/channels/slack) - Bolt SDK; Workspace-Apps.
- [SMS](/de/channels/sms) - Twilio-gestütztes SMS über den Gateway-Webhook (offizielles Plugin).
- [Synology Chat](/de/channels/synology-chat) - Synology NAS Chat über ausgehende+eingehende Webhooks (gebündeltes Plugin).
- [Telegram](/de/channels/telegram) - Bot API über grammY; unterstützt Gruppen.
- [Tlon](/de/channels/tlon) - Urbit-basierter Messenger (gebündeltes Plugin).
- [Twitch](/de/channels/twitch) - Twitch-Chat über IRC-Verbindung (gebündeltes Plugin).
- [Sprachanruf](/de/plugins/voice-call) - Telefonie über Plivo oder Twilio (Plugin, separat installiert).
- [WebChat](/de/web/webchat) - Gateway-WebChat-UI über WebSocket.
- [WeChat](/de/channels/wechat) - Tencent iLink Bot-Plugin über QR-Login; nur private Chats (externes Plugin).
- [WhatsApp](/de/channels/whatsapp) - Am beliebtesten; verwendet Baileys und erfordert QR-Kopplung.
- [Yuanbao](/de/channels/yuanbao) - Tencent Yuanbao-Bot (externes Plugin).
- [Zalo](/de/channels/zalo) - Zalo Bot API; Vietnams beliebter Messenger (gebündeltes Plugin).
- [Zalo ClawBot](/de/channels/zaloclawbot) - Persönlicher Zalo-Assistent über QR-Login; eigentümergebunden (externes Plugin).
- [Zalo Personal](/de/channels/zalouser) - Persönliches Zalo-Konto über QR-Login (gebündeltes Plugin).

## Hinweise

- Kanäle können gleichzeitig laufen; konfigurieren Sie mehrere, und OpenClaw routet pro Chat.
- Die schnellste Einrichtung ist in der Regel **Telegram** (einfaches Bot-Token). WhatsApp erfordert QR-Kopplung und
  speichert mehr Zustand auf der Festplatte.
- Das Gruppenverhalten variiert je nach Kanal; siehe [Gruppen](/de/channels/groups).
- DM-Kopplung und Allowlists werden aus Sicherheitsgründen erzwungen; siehe [Sicherheit](/de/gateway/security).
- Fehlerbehebung: [Kanal-Fehlerbehebung](/de/channels/troubleshooting).
- Modell-Provider sind separat dokumentiert; siehe [Modell-Provider](/de/providers/models).
