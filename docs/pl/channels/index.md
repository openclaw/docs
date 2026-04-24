---
read_when:
    - Chcesz wybrać kanał czatu dla OpenClaw
    - Potrzebujesz szybkiego przeglądu obsługiwanych platform komunikacyjnych
summary: Platformy komunikacyjne, z którymi może łączyć się OpenClaw
title: Kanały czatu
x-i18n:
    generated_at: "2026-04-24T08:58:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: c016b78b16724e73b21946d6bed0009f4cbebd1f887620431b9b4bff70f2b1ff
    source_path: channels/index.md
    workflow: 15
---

OpenClaw może rozmawiać z Tobą w każdej aplikacji czatowej, z której już korzystasz. Każdy kanał łączy się przez Gateway.
Tekst jest obsługiwany wszędzie; multimedia i reakcje różnią się w zależności od kanału.

## Obsługiwane kanały

- [BlueBubbles](/pl/channels/bluebubbles) — **Zalecane dla iMessage**; używa REST API serwera BlueBubbles na macOS z pełną obsługą funkcji (dołączony Plugin; edycja, cofanie wysłania, efekty, reakcje, zarządzanie grupami — edycja jest obecnie uszkodzona w macOS 26 Tahoe).
- [Discord](/pl/channels/discord) — Discord Bot API + Gateway; obsługuje serwery, kanały i wiadomości prywatne.
- [Feishu](/pl/channels/feishu) — bot Feishu/Lark przez WebSocket (dołączony Plugin).
- [Google Chat](/pl/channels/googlechat) — aplikacja Google Chat API przez Webhook HTTP.
- [iMessage (legacy)](/pl/channels/imessage) — starsza integracja z macOS przez CLI `imsg` (przestarzałe, w nowych konfiguracjach używaj BlueBubbles).
- [IRC](/pl/channels/irc) — klasyczne serwery IRC; kanały + wiadomości prywatne z kontrolą parowania/listy dozwolonych.
- [LINE](/pl/channels/line) — bot LINE Messaging API (dołączony Plugin).
- [Matrix](/pl/channels/matrix) — protokół Matrix (dołączony Plugin).
- [Mattermost](/pl/channels/mattermost) — Bot API + WebSocket; kanały, grupy, wiadomości prywatne (dołączony Plugin).
- [Microsoft Teams](/pl/channels/msteams) — Bot Framework; obsługa środowisk korporacyjnych (dołączony Plugin).
- [Nextcloud Talk](/pl/channels/nextcloud-talk) — samodzielnie hostowany czat przez Nextcloud Talk (dołączony Plugin).
- [Nostr](/pl/channels/nostr) — zdecentralizowane wiadomości prywatne przez NIP-04 (dołączony Plugin).
- [QQ Bot](/pl/channels/qqbot) — QQ Bot API; czat prywatny, czat grupowy i bogate multimedia (dołączony Plugin).
- [Signal](/pl/channels/signal) — `signal-cli`; rozwiązanie nastawione na prywatność.
- [Slack](/pl/channels/slack) — SDK Bolt; aplikacje dla obszarów roboczych.
- [Synology Chat](/pl/channels/synology-chat) — Synology NAS Chat przez wychodzące i przychodzące Webhooki (dołączony Plugin).
- [Telegram](/pl/channels/telegram) — Bot API przez grammY; obsługuje grupy.
- [Tlon](/pl/channels/tlon) — komunikator oparty na Urbit (dołączony Plugin).
- [Twitch](/pl/channels/twitch) — czat Twitch przez połączenie IRC (dołączony Plugin).
- [Voice Call](/pl/plugins/voice-call) — telefonia przez Plivo lub Twilio (Plugin, instalowany osobno).
- [WebChat](/pl/web/webchat) — interfejs Gateway WebChat przez WebSocket.
- [WeChat](/pl/channels/wechat) — Plugin bota Tencent iLink przez logowanie QR; tylko czaty prywatne (zewnętrzny Plugin).
- [WhatsApp](/pl/channels/whatsapp) — najpopularniejszy; używa Baileys i wymaga parowania kodem QR.
- [Zalo](/pl/channels/zalo) — Zalo Bot API; popularny komunikator w Wietnamie (dołączony Plugin).
- [Zalo Personal](/pl/channels/zalouser) — konto osobiste Zalo przez logowanie QR (dołączony Plugin).

## Uwagi

- Kanały mogą działać jednocześnie; skonfiguruj wiele kanałów, a OpenClaw będzie kierować ruch według czatu.
- Najszybsza konfiguracja to zwykle **Telegram** (prosty token bota). WhatsApp wymaga parowania kodem QR i przechowuje więcej stanu na dysku.
- Zachowanie grup różni się zależnie od kanału; zobacz [Grupy](/pl/channels/groups).
- Parowanie wiadomości prywatnych i listy dozwolonych są wymuszane ze względów bezpieczeństwa; zobacz [Bezpieczeństwo](/pl/gateway/security).
- Rozwiązywanie problemów: [Rozwiązywanie problemów z kanałami](/pl/channels/troubleshooting).
- Dostawcy modeli są opisani osobno; zobacz [Dostawcy modeli](/pl/providers/models).
