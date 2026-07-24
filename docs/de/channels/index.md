---
read_when:
    - Sie möchten einen Chatkanal für OpenClaw auswählen
    - Sie benötigen einen schnellen Überblick über die unterstützten Messaging-Plattformen
summary: Messaging-Plattformen, mit denen OpenClaw eine Verbindung herstellen kann
title: Chat-Kanäle
x-i18n:
    generated_at: "2026-07-24T04:21:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 102ad190f5bdb61fb3610985948e022f03fd54598ed4889da7a443ec0a2bdef3
    source_path: channels/index.md
    workflow: 16
---

OpenClaw kann über jede bereits verwendete Chat-App mit Ihnen kommunizieren. Jeder Kanal stellt die Verbindung über das Gateway her.
Text wird überall unterstützt; Medien und Reaktionen variieren je nach Kanal.

iMessage, Telegram und die WebChat-Benutzeroberfläche sind in der Kerninstallation enthalten. Als
„offizielles Plugin“ gekennzeichnete Kanäle werden mit einem Befehl installiert (`openclaw plugins install @openclaw/<id>`)
oder bei Bedarf während `openclaw onboard` / `openclaw channels add` und erfordern anschließend einen Neustart des
Gateways. Kanäle mit „externem Plugin“ werden außerhalb des OpenClaw-Repositorys gepflegt.

## Unterstützte Kanäle

- [Discord](/de/channels/discord) – Discord Bot API + Gateway; unterstützt Server, Kanäle und DMs (offizielles Plugin).
- [Feishu](/de/channels/feishu) – Feishu/Lark-Bot über WebSocket (offizielles Plugin).
- [Google Chat](/de/channels/googlechat) – Google Chat API-App über HTTP-Webhook (offizielles Plugin).
- [iMessage](/de/channels/imessage) – Im Kern enthalten. Native macOS-Integration über die `imsg`-Bridge auf einem angemeldeten Mac (oder über einen SSH-Wrapper, wenn das Gateway an anderer Stelle ausgeführt wird), einschließlich privater API-Aktionen für Antworten, Tapbacks, Effekte, Anhänge und Gruppenverwaltung.
- [IRC](/de/channels/irc) – Klassische IRC-Server; Kanäle und DMs mit Kopplungs-/Zulassungslisten-Steuerung (offizielles Plugin).
- [LINE](/de/channels/line) – Bot für die LINE Messaging API (offizielles Plugin).
- [Matrix](/de/channels/matrix) – Matrix-Protokoll (offizielles Plugin).
- [Mattermost](/de/channels/mattermost) – Bot API + WebSocket; Kanäle, Gruppen, DMs (offizielles Plugin).
- [Microsoft Teams](/de/channels/msteams) – Bot Framework; Unterstützung für Unternehmen (offizielles Plugin).
- [Nextcloud Talk](/de/channels/nextcloud-talk) – Selbst gehosteter Chat über Nextcloud Talk (offizielles Plugin).
- [Nostr](/de/channels/nostr) – Dezentrale DMs über NIP-04 (offizielles Plugin).
- [QQ Bot](/de/channels/qqbot) – QQ Bot API; private Chats, Gruppenchats und Rich Media (offizielles Plugin).
- [Reef](/channels/reef) – Abgesicherte Ende-zu-Ende-verschlüsselte Claw-zu-Claw-Kommunikation zwischen OpenClaw-Agenten verschiedener Personen (mitgeliefertes Plugin).
- [Raft](/de/channels/raft) – Raft CLI-Aktivierungs-Bridge für die Zusammenarbeit zwischen Menschen und Agenten (offizielles Plugin).
- [Signal](/de/channels/signal) – signal-cli; datenschutzorientiert (offizielles Plugin).
- [Slack](/de/channels/slack) – Bolt SDK; Workspace-Apps (offizielles Plugin).
- [SMS](/de/channels/sms) – Von Twilio unterstützte SMS über den Gateway-Webhook (offizielles Plugin).
- [Synology Chat](/de/channels/synology-chat) – Synology NAS Chat über ausgehende und eingehende Webhooks (offizielles Plugin).
- [Telegram](/de/channels/telegram) – Im Kern enthalten. Bot API über grammY; unterstützt Gruppen.
- [Tlon](/de/channels/tlon) – Urbit-basierter Messenger (offizielles Plugin).
- [Twitch](/de/channels/twitch) – Twitch-Chat über eine IRC-Verbindung (offizielles Plugin).
- [Sprachanruf](/de/plugins/voice-call) – Telefonie über Plivo, Telnyx oder Twilio (offizielles Plugin).
- [WebChat](/de/web/webchat) – Im Kern enthalten. Gateway-WebChat-Benutzeroberfläche über WebSocket.
- [WeChat](/de/channels/wechat) – Tencent-iLink-Bot mit QR-Anmeldung; nur private Chats (externes Plugin).
- [WhatsApp](/de/channels/whatsapp) – Am beliebtesten; verwendet Baileys und erfordert eine QR-Kopplung (offizielles Plugin).
- [Yuanbao](/de/channels/yuanbao) – Tencent-Yuanbao-Bot (externes Plugin).
- [Zalo](/de/channels/zalo) – Zalo Bot API; beliebter Messenger in Vietnam (offizielles Plugin).
- [Zalo ClawBot](/de/channels/zaloclawbot) – Persönlicher Zalo-Assistent mit QR-Anmeldung; an den Besitzer gebunden (externes Plugin).
- [Zalo Personal](/de/channels/zalouser) – Persönliches Zalo-Konto mit QR-Anmeldung (offizielles Plugin).

## Hinweise zur Zustellung

- Telegram-Antworten, die Markdown-Bildsyntax wie `![alt](url)` enthalten,
  werden nach Möglichkeit im abschließenden ausgehenden Pfad in Medienantworten umgewandelt.
- Slack-DMs mit mehreren Personen werden als Gruppenchats weitergeleitet, daher gelten für MPIM-Unterhaltungen die Gruppenrichtlinie, das
  Erwähnungsverhalten und die Regeln für Gruppensitzungen.
- Die WhatsApp-Einrichtung erfolgt bei Bedarf: Das Onboarding kann den Einrichtungsablauf anzeigen, bevor
  das Plugin-Paket installiert ist, und das Gateway lädt das externe
  ClawHub-/npm-Plugin nur, wenn der Kanal tatsächlich aktiv ist.
- Kanäle, die von Bots verfasste eingehende Nachrichten akzeptieren, können den gemeinsamen
  [Bot-Schleifenschutz](/de/channels/bot-loop-protection) verwenden, um zu verhindern, dass Bot-Paare
  einander unbegrenzt antworten.
- Unterstützte dauerhaft aktive Räume können [Umgebungsraumereignisse](/de/channels/ambient-room-events)
  verwenden, sodass nicht an den Agenten gerichtete Raumunterhaltungen zu stillem Kontext werden, sofern der Agent nicht mit dem
  Tool `message` sendet.

## Hinweise

- Kanäle können gleichzeitig ausgeführt werden; konfigurieren Sie mehrere, und OpenClaw leitet Nachrichten nach Chat weiter.
- Die schnellste Einrichtung bietet normalerweise **Telegram** (einfaches Bot-Token, keine Plugin-Installation). WhatsApp
  erfordert eine QR-Kopplung und speichert mehr Statusdaten auf dem Datenträger.
- Das Gruppenverhalten variiert je nach Kanal; siehe [Gruppen](/de/channels/groups).
- DM-Kopplung und Zulassungslisten werden aus Sicherheitsgründen erzwungen; siehe [Sicherheit](/de/gateway/security).
- Fehlerbehebung: [Fehlerbehebung für Kanäle](/de/channels/troubleshooting).
- Modell-Provider werden separat dokumentiert; siehe [Modell-Provider](/de/providers/models).
