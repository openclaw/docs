---
read_when:
    - Chcesz wybrać kanał czatu dla OpenClaw
    - Potrzebujesz szybkiego przeglądu obsługiwanych platform do komunikacji
summary: Platformy do komunikacji, z którymi OpenClaw może się połączyć
title: Kanały czatu
x-i18n:
    generated_at: "2026-04-05T13:43:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 246ee6f16aebe751241f00102bb435978ed21f6158385aff5d8e222e30567416
    source_path: channels/index.md
    workflow: 15
---

# Kanały czatu

OpenClaw może rozmawiać z Tobą w dowolnej aplikacji czatu, z której już korzystasz. Każdy kanał łączy się przez Gateway.
Tekst jest obsługiwany wszędzie; multimedia i reakcje różnią się w zależności od kanału.

## Obsługiwane kanały

- [BlueBubbles](/channels/bluebubbles) — **Polecane dla iMessage**; używa interfejsu API REST serwera BlueBubbles dla macOS z pełną obsługą funkcji (dołączona wtyczka; edycja, cofanie wysłania, efekty, reakcje, zarządzanie grupą — edycja jest obecnie uszkodzona w macOS 26 Tahoe).
- [Discord](/channels/discord) — Discord Bot API + Gateway; obsługuje serwery, kanały i rozmowy DM.
- [Feishu](/channels/feishu) — bot Feishu/Lark przez WebSocket (dołączona wtyczka).
- [Google Chat](/channels/googlechat) — aplikacja Google Chat API przez webhook HTTP.
- [iMessage (legacy)](/channels/imessage) — starsza integracja z macOS przez CLI imsg (przestarzałe, w nowych konfiguracjach używaj BlueBubbles).
- [IRC](/channels/irc) — klasyczne serwery IRC; kanały i rozmowy DM z kontrolą parowania/list dozwolonych.
- [LINE](/channels/line) — bot LINE Messaging API (dołączona wtyczka).
- [Matrix](/channels/matrix) — protokół Matrix (dołączona wtyczka).
- [Mattermost](/channels/mattermost) — Bot API + WebSocket; kanały, grupy, rozmowy DM (dołączona wtyczka).
- [Microsoft Teams](/channels/msteams) — Bot Framework; obsługa środowisk enterprise (dołączona wtyczka).
- [Nextcloud Talk](/channels/nextcloud-talk) — samoobsługowy czat przez Nextcloud Talk (dołączona wtyczka).
- [Nostr](/channels/nostr) — zdecentralizowane rozmowy DM przez NIP-04 (dołączona wtyczka).
- [QQ Bot](/channels/qqbot) — QQ Bot API; czat prywatny, czat grupowy i rozbudowane multimedia (dołączona wtyczka).
- [Signal](/channels/signal) — signal-cli; nacisk na prywatność.
- [Slack](/channels/slack) — Bolt SDK; aplikacje workspace.
- [Synology Chat](/channels/synology-chat) — Synology NAS Chat przez webhooki wychodzące i przychodzące (dołączona wtyczka).
- [Telegram](/channels/telegram) — Bot API przez grammY; obsługuje grupy.
- [Tlon](/channels/tlon) — komunikator oparty na Urbit (dołączona wtyczka).
- [Twitch](/channels/twitch) — czat Twitch przez połączenie IRC (dołączona wtyczka).
- [Voice Call](/plugins/voice-call) — telefonia przez Plivo lub Twilio (wtyczka instalowana osobno).
- [WebChat](/web/webchat) — interfejs Gateway WebChat przez WebSocket.
- [WeChat](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin) — wtyczka Tencent iLink Bot przez logowanie kodem QR; tylko czaty prywatne.
- [WhatsApp](/channels/whatsapp) — najpopularniejszy; używa Baileys i wymaga parowania kodem QR.
- [Zalo](/channels/zalo) — Zalo Bot API; popularny komunikator w Wietnamie (dołączona wtyczka).
- [Zalo Personal](/channels/zalouser) — konto osobiste Zalo przez logowanie kodem QR (dołączona wtyczka).

## Uwagi

- Kanały mogą działać jednocześnie; skonfiguruj wiele z nich, a OpenClaw będzie routować według czatu.
- Najszybsza konfiguracja to zwykle **Telegram** (prosty token bota). WhatsApp wymaga parowania kodem QR i
  przechowuje więcej stanu na dysku.
- Zachowanie grup różni się w zależności od kanału; zobacz [Grupy](/channels/groups).
- Parowanie rozmów DM i listy dozwolonych są egzekwowane dla bezpieczeństwa; zobacz [Bezpieczeństwo](/gateway/security).
- Rozwiązywanie problemów: [Rozwiązywanie problemów z kanałami](/channels/troubleshooting).
- Dostawcy modeli są opisani osobno; zobacz [Dostawcy modeli](/providers/models).
