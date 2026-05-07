---
read_when:
    - Chcesz wybrać kanał czatu dla OpenClaw
    - Potrzebujesz szybkiego przeglądu obsługiwanych platform komunikacyjnych
summary: Platformy komunikacyjne, z którymi OpenClaw może się łączyć
title: Kanały czatu
x-i18n:
    generated_at: "2026-05-07T01:50:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: ff6875f4ae86b341b6a82e13f022266461bc102ee03074a8c352eea2203d657a
    source_path: channels/index.md
    workflow: 16
---

OpenClaw może rozmawiać z Tobą w dowolnej aplikacji czatu, której już używasz. Każdy kanał łączy się przez Gateway.
Tekst jest obsługiwany wszędzie; multimedia i reakcje różnią się w zależności od kanału.

## Uwagi dotyczące dostarczania

- Odpowiedzi Telegram, które zawierają składnię obrazów Markdown, taką jak `![alt](url)`,
  są w miarę możliwości konwertowane na odpowiedzi multimedialne na końcowej ścieżce wychodzącej.
- Wieloosobowe wiadomości prywatne Slack są kierowane jako czaty grupowe, więc zasady grup,
  zachowanie wzmianek i reguły sesji grupowych mają zastosowanie do rozmów MPIM.
- Konfiguracja WhatsApp działa na zasadzie instalacji na żądanie: onboarding może pokazać przepływ konfiguracji przed
  zainstalowaniem pakietu pluginu, a Gateway ładuje środowisko uruchomieniowe WhatsApp
  dopiero wtedy, gdy kanał jest faktycznie aktywny.

## Obsługiwane kanały

- [BlueBubbles](/pl/channels/bluebubbles) - Starszy most iMessage przez REST API serwera BlueBubbles dla macOS; przestarzały dla nowych konfiguracji OpenClaw, ale nadal obsługiwany dla istniejących konfiguracji i bogatszych akcji prywatnego API.
- [Discord](/pl/channels/discord) - Discord Bot API + Gateway; obsługuje serwery, kanały i wiadomości prywatne.
- [Feishu](/pl/channels/feishu) - Bot Feishu/Lark przez WebSocket (dołączony plugin).
- [Google Chat](/pl/channels/googlechat) - Aplikacja Google Chat API przez webhook HTTP (plugin do pobrania).
- [iMessage](/pl/channels/imessage) - Natywna integracja z macOS przez CLI imsg; preferowana dla nowych konfiguracji OpenClaw iMessage, gdy uprawnienia hosta i dostęp do Wiadomości są odpowiednie.
- [IRC](/pl/channels/irc) - Klasyczne serwery IRC; kanały + wiadomości prywatne z kontrolami parowania/listy dozwolonych.
- [LINE](/pl/channels/line) - Bot LINE Messaging API (plugin do pobrania).
- [Matrix](/pl/channels/matrix) - Protokół Matrix (plugin do pobrania).
- [Mattermost](/pl/channels/mattermost) - Bot API + WebSocket; kanały, grupy, wiadomości prywatne (plugin do pobrania).
- [Microsoft Teams](/pl/channels/msteams) - Bot Framework; obsługa dla przedsiębiorstw (dołączony plugin).
- [Nextcloud Talk](/pl/channels/nextcloud-talk) - Samodzielnie hostowany czat przez Nextcloud Talk (dołączony plugin).
- [Nostr](/pl/channels/nostr) - Zdecentralizowane wiadomości prywatne przez NIP-04 (dołączony plugin).
- [QQ Bot](/pl/channels/qqbot) - QQ Bot API; czat prywatny, czat grupowy i bogate multimedia (dołączony plugin).
- [Signal](/pl/channels/signal) - signal-cli; ukierunkowany na prywatność.
- [Slack](/pl/channels/slack) - Bolt SDK; aplikacje obszarów roboczych.
- [Synology Chat](/pl/channels/synology-chat) - Synology NAS Chat przez wychodzące+przychodzące webhooki (dołączony plugin).
- [Telegram](/pl/channels/telegram) - Bot API przez grammY; obsługuje grupy.
- [Tlon](/pl/channels/tlon) - Komunikator oparty na Urbit (dołączony plugin).
- [Twitch](/pl/channels/twitch) - Czat Twitch przez połączenie IRC (dołączony plugin).
- [Połączenie głosowe](/pl/plugins/voice-call) - Telefonia przez Plivo lub Twilio (plugin, instalowany osobno).
- [WebChat](/pl/web/webchat) - Interfejs Gateway WebChat przez WebSocket.
- [WeChat](/pl/channels/wechat) - Plugin Tencent iLink Bot przez logowanie QR; tylko czaty prywatne (zewnętrzny plugin).
- [WhatsApp](/pl/channels/whatsapp) - Najpopularniejszy; używa Baileys i wymaga parowania QR.
- [Yuanbao](/pl/channels/yuanbao) - Bot Tencent Yuanbao (zewnętrzny plugin).
- [Zalo](/pl/channels/zalo) - Zalo Bot API; popularny komunikator w Wietnamie (dołączony plugin).
- [Zalo Personal](/pl/channels/zalouser) - Osobiste konto Zalo przez logowanie QR (dołączony plugin).

## Uwagi

- Kanały mogą działać jednocześnie; skonfiguruj kilka, a OpenClaw będzie kierować wiadomości według czatu.
- Najszybsza konfiguracja to zwykle **Telegram** (prosty token bota). WhatsApp wymaga parowania QR i
  przechowuje więcej stanu na dysku.
- Zachowanie grup różni się w zależności od kanału; zobacz [Grupy](/pl/channels/groups).
- Parowanie wiadomości prywatnych i listy dozwolonych są egzekwowane dla bezpieczeństwa; zobacz [Bezpieczeństwo](/pl/gateway/security).
- Rozwiązywanie problemów: [Rozwiązywanie problemów z kanałami](/pl/channels/troubleshooting).
- Dostawcy modeli są udokumentowani osobno; zobacz [Dostawcy modeli](/pl/providers/models).
