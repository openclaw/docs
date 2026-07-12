---
read_when:
    - Sie möchten einen Chatkanal für OpenClaw auswählen
    - Sie benötigen einen schnellen Überblick über die unterstützten Messaging-Plattformen
summary: Messaging-Plattformen, mit denen OpenClaw eine Verbindung herstellen kann
title: Chatkanäle
x-i18n:
    generated_at: "2026-07-12T15:00:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 411b011a8e5dd83d3f30a672c0e8a56251ee8c6ca7cdf3e7dc5c2b1f1b31d73d
    source_path: channels/index.md
    workflow: 16
---

OpenClaw kann über jede Chat-App, die Sie bereits verwenden, mit Ihnen kommunizieren. Jeder Kanal stellt über das Gateway eine Verbindung her.
Text wird überall unterstützt; Medien und Reaktionen variieren je nach Kanal.

iMessage, Telegram und die WebChat-Benutzeroberfläche sind in der Kerninstallation enthalten. Als
„offizielles Plugin“ gekennzeichnete Kanäle werden mit einem Befehl (`openclaw plugins install @openclaw/<id>`)
oder bei Bedarf während `openclaw onboard` / `openclaw channels add` installiert und erfordern anschließend einen Neustart des Gateway.
Kanäle mit „externem Plugin“ werden außerhalb des OpenClaw-Repositorys gepflegt.

## Unterstützte Kanäle

- [Discord](/de/channels/discord) – Discord Bot API + Gateway; unterstützt Server, Kanäle und Direktnachrichten (offizielles Plugin).
- [Feishu](/de/channels/feishu) – Feishu-/Lark-Bot über WebSocket (offizielles Plugin).
- [Google Chat](/de/channels/googlechat) – Google Chat API-App über HTTP-Webhook (offizielles Plugin).
- [iMessage](/de/channels/imessage) – Im Kern enthalten. Native macOS-Integration über die `imsg`-Bridge auf einem angemeldeten Mac (oder über einen SSH-Wrapper, wenn das Gateway an anderer Stelle ausgeführt wird), einschließlich privater API-Aktionen für Antworten, Tapbacks, Effekte, Anhänge und Gruppenverwaltung.
- [IRC](/de/channels/irc) – Klassische IRC-Server; Kanäle und Direktnachrichten mit Kopplungs- und Positivlistensteuerung (offizielles Plugin).
- [LINE](/de/channels/line) – LINE Messaging API-Bot (offizielles Plugin).
- [Matrix](/de/channels/matrix) – Matrix-Protokoll (offizielles Plugin).
- [Mattermost](/de/channels/mattermost) – Bot API + WebSocket; Kanäle, Gruppen und Direktnachrichten (offizielles Plugin).
- [Microsoft Teams](/de/channels/msteams) – Bot Framework; Unterstützung für Unternehmen (offizielles Plugin).
- [Nextcloud Talk](/de/channels/nextcloud-talk) – Selbst gehosteter Chat über Nextcloud Talk (offizielles Plugin).
- [Nostr](/de/channels/nostr) – Dezentrale Direktnachrichten über NIP-04 (offizielles Plugin).
- [QQ Bot](/de/channels/qqbot) – QQ Bot API; private Chats, Gruppenchats und Rich Media (offizielles Plugin).
- [Raft](/de/channels/raft) – Raft-CLI-Aktivierungs-Bridge für die Zusammenarbeit von Menschen und Agenten (offizielles Plugin).
- [Signal](/de/channels/signal) – signal-cli; datenschutzorientiert (offizielles Plugin).
- [Slack](/de/channels/slack) – Bolt SDK; Workspace-Apps (offizielles Plugin).
- [SMS](/de/channels/sms) – Von Twilio bereitgestellte SMS über den Gateway-Webhook (offizielles Plugin).
- [Synology Chat](/de/channels/synology-chat) – Synology NAS Chat über ausgehende und eingehende Webhooks (offizielles Plugin).
- [Telegram](/de/channels/telegram) – Im Kern enthalten. Bot API über grammY; unterstützt Gruppen.
- [Tlon](/de/channels/tlon) – Urbit-basierter Messenger (offizielles Plugin).
- [Twitch](/de/channels/twitch) – Twitch-Chat über eine IRC-Verbindung (offizielles Plugin).
- [Sprachanruf](/de/plugins/voice-call) – Telefonie über Plivo, Telnyx oder Twilio (offizielles Plugin).
- [WebChat](/de/web/webchat) – Im Kern enthalten. Gateway-WebChat-Benutzeroberfläche über WebSocket.
- [WeChat](/de/channels/wechat) – Tencent-iLink-Bot mit Anmeldung per QR-Code; nur private Chats (externes Plugin).
- [WhatsApp](/de/channels/whatsapp) – Am beliebtesten; verwendet Baileys und erfordert eine Kopplung per QR-Code (offizielles Plugin).
- [Yuanbao](/de/channels/yuanbao) – Tencent-Yuanbao-Bot (externes Plugin).
- [Zalo](/de/channels/zalo) – Zalo Bot API; beliebter Messenger in Vietnam (offizielles Plugin).
- [Zalo ClawBot](/de/channels/zaloclawbot) – Persönlicher Zalo-Assistent mit Anmeldung per QR-Code; an den Eigentümer gebunden (externes Plugin).
- [Zalo Personal](/de/channels/zalouser) – Persönliches Zalo-Konto mit Anmeldung per QR-Code (offizielles Plugin).

## Hinweise zur Zustellung

- Telegram-Antworten, die Markdown-Bildsyntax wie `![alt](url)` enthalten,
  werden nach Möglichkeit im abschließenden ausgehenden Verarbeitungspfad in Medienantworten umgewandelt.
- Slack-Direktnachrichten mit mehreren Personen werden als Gruppenchats weitergeleitet, sodass Gruppenrichtlinien, das Verhalten bei Erwähnungen
  und Regeln für Gruppensitzungen auf MPIM-Unterhaltungen angewendet werden.
- Die Einrichtung von WhatsApp erfolgt bei Bedarf: Das Onboarding kann den Einrichtungsablauf anzeigen, bevor
  das Plugin-Paket installiert ist, und das Gateway lädt das externe
  ClawHub-/npm-Plugin erst, wenn der Kanal tatsächlich aktiv ist.
- Kanäle, die von Bots verfasste eingehende Nachrichten akzeptieren, können den gemeinsamen
  [Schutz vor Bot-Schleifen](/de/channels/bot-loop-protection) verwenden, um zu verhindern, dass Bot-Paare
  sich unbegrenzt gegenseitig antworten.
- Unterstützte dauerhaft aktive Räume können [Ereignisse in Umgebungsräumen](/de/channels/ambient-room-events)
  verwenden, damit nicht an den Agenten gerichtete Raumunterhaltungen zu stillem Kontext werden, sofern der Agent nicht mit
  dem `message`-Tool sendet.

## Hinweise

- Kanäle können gleichzeitig ausgeführt werden; konfigurieren Sie mehrere, und OpenClaw leitet Nachrichten je nach Chat weiter.
- Die schnellste Einrichtung bietet normalerweise **Telegram** (einfaches Bot-Token, keine Plugin-Installation). WhatsApp
  erfordert eine Kopplung per QR-Code und speichert mehr Statusdaten auf dem Datenträger.
- Das Gruppenverhalten variiert je nach Kanal; siehe [Gruppen](/de/channels/groups).
- Die Kopplung von Direktnachrichten und Positivlisten werden aus Sicherheitsgründen erzwungen; siehe [Sicherheit](/de/gateway/security).
- Fehlerbehebung: [Fehlerbehebung für Kanäle](/de/channels/troubleshooting).
- Modell-Provider werden separat dokumentiert; siehe [Modell-Provider](/de/providers/models).
