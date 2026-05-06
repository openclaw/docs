---
read_when:
    - Chcesz wybrać kanał czatu dla OpenClaw
    - Potrzebujesz szybkiego przeglądu obsługiwanych platform komunikacyjnych
summary: Platformy komunikacyjne, z którymi OpenClaw może się łączyć
title: Kanały czatu
x-i18n:
    generated_at: "2026-05-06T09:02:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: c357a9dfabf12329954f30084fe9abfad9aa96f62bcd72b3d0802819d5979d7b
    source_path: channels/index.md
    workflow: 16
---

OpenClaw może rozmawiać z Tobą w dowolnej aplikacji czatu, której już używasz. Każdy kanał łączy się przez Gateway.
Tekst jest obsługiwany wszędzie; media i reakcje różnią się zależnie od kanału.

## Uwagi dotyczące dostarczania

- Odpowiedzi Telegram zawierające składnię obrazów markdown, takie jak `![alt](url)`,
  są konwertowane na odpowiedzi multimedialne na końcowej ścieżce wychodzącej, gdy jest to możliwe.
- Wieloosobowe wiadomości prywatne Slack są kierowane jako czaty grupowe, więc zasady grup, zachowanie
  wzmianek i reguły sesji grupowych mają zastosowanie do rozmów MPIM.
- Konfiguracja WhatsApp działa w trybie instalacji na żądanie: onboarding może pokazać przepływ konfiguracji przed
  zainstalowaniem pakietu Plugin, a Gateway ładuje środowisko uruchomieniowe WhatsApp
  tylko wtedy, gdy kanał jest faktycznie aktywny.

## Obsługiwane kanały

- [BlueBubbles](/pl/channels/bluebubbles) - **Zalecane dla iMessage**; używa REST API serwera BlueBubbles dla macOS z pełną obsługą funkcji (dołączony Plugin; edycja, cofanie wysłania, efekty, reakcje, zarządzanie grupami - edycja obecnie nie działa w macOS 26 Tahoe).
- [Discord](/pl/channels/discord) - Discord Bot API + Gateway; obsługuje serwery, kanały i wiadomości prywatne.
- [Feishu](/pl/channels/feishu) - bot Feishu/Lark przez WebSocket (dołączony Plugin).
- [Google Chat](/pl/channels/googlechat) - aplikacja Google Chat API przez Webhook HTTP (Plugin do pobrania).
- [iMessage (legacy)](/pl/channels/imessage) - starsza integracja z macOS przez imsg CLI (przestarzała, w nowych konfiguracjach użyj BlueBubbles).
- [IRC](/pl/channels/irc) - klasyczne serwery IRC; kanały + wiadomości prywatne z kontrolą parowania/listy dozwolonych.
- [LINE](/pl/channels/line) - bot LINE Messaging API (Plugin do pobrania).
- [Matrix](/pl/channels/matrix) - protokół Matrix (Plugin do pobrania).
- [Mattermost](/pl/channels/mattermost) - Bot API + WebSocket; kanały, grupy, wiadomości prywatne (Plugin do pobrania).
- [Microsoft Teams](/pl/channels/msteams) - Bot Framework; obsługa dla przedsiębiorstw (dołączony Plugin).
- [Nextcloud Talk](/pl/channels/nextcloud-talk) - samodzielnie hostowany czat przez Nextcloud Talk (dołączony Plugin).
- [Nostr](/pl/channels/nostr) - zdecentralizowane wiadomości prywatne przez NIP-04 (dołączony Plugin).
- [QQ Bot](/pl/channels/qqbot) - QQ Bot API; czat prywatny, czat grupowy i multimedia rozszerzone (dołączony Plugin).
- [Signal](/pl/channels/signal) - signal-cli; ukierunkowany na prywatność.
- [Slack](/pl/channels/slack) - Bolt SDK; aplikacje obszaru roboczego.
- [Synology Chat](/pl/channels/synology-chat) - Synology NAS Chat przez wychodzące i przychodzące Webhooki (dołączony Plugin).
- [Telegram](/pl/channels/telegram) - Bot API przez grammY; obsługuje grupy.
- [Tlon](/pl/channels/tlon) - komunikator oparty na Urbit (dołączony Plugin).
- [Twitch](/pl/channels/twitch) - czat Twitch przez połączenie IRC (dołączony Plugin).
- [Voice Call](/pl/plugins/voice-call) - telefonia przez Plivo lub Twilio (Plugin, instalowany osobno).
- [WebChat](/pl/web/webchat) - interfejs WebChat Gateway przez WebSocket.
- [WeChat](/pl/channels/wechat) - Plugin Tencent iLink Bot przez logowanie QR; tylko czaty prywatne (zewnętrzny Plugin).
- [WhatsApp](/pl/channels/whatsapp) - najpopularniejszy; używa Baileys i wymaga parowania QR.
- [Yuanbao](/pl/channels/yuanbao) - bot Tencent Yuanbao (zewnętrzny Plugin).
- [Zalo](/pl/channels/zalo) - Zalo Bot API; popularny komunikator w Wietnamie (dołączony Plugin).
- [Zalo Personal](/pl/channels/zalouser) - konto osobiste Zalo przez logowanie QR (dołączony Plugin).

## Uwagi

- Kanały mogą działać równocześnie; skonfiguruj wiele, a OpenClaw będzie kierować wiadomości według czatu.
- Najszybsza konfiguracja to zwykle **Telegram** (prosty token bota). WhatsApp wymaga parowania QR i
  przechowuje więcej stanu na dysku.
- Zachowanie grup różni się zależnie od kanału; zobacz [Grupy](/pl/channels/groups).
- Parowanie wiadomości prywatnych i listy dozwolonych są egzekwowane dla bezpieczeństwa; zobacz [Bezpieczeństwo](/pl/gateway/security).
- Rozwiązywanie problemów: [Rozwiązywanie problemów z kanałami](/pl/channels/troubleshooting).
- Dostawcy modeli są udokumentowani osobno; zobacz [Dostawcy modeli](/pl/providers/models).
