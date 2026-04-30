---
read_when:
    - Chcesz wybrać kanał czatu dla OpenClaw
    - Potrzebujesz szybkiego przeglądu obsługiwanych platform komunikacyjnych
summary: Platformy komunikacyjne, z którymi OpenClaw może się łączyć
title: Kanały czatu
x-i18n:
    generated_at: "2026-04-30T09:37:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: b58a1f1a0500419015985500a301d9f8ee4fa3a67b11e30561cabe2dc57b5049
    source_path: channels/index.md
    workflow: 16
---

OpenClaw może rozmawiać z Tobą w dowolnej aplikacji czatu, której już używasz. Każdy kanał łączy się przez Gateway.
Tekst jest obsługiwany wszędzie; media i reakcje różnią się w zależności od kanału.

## Uwagi dotyczące dostarczania

- Odpowiedzi Telegram zawierające składnię obrazów Markdown, taką jak `![alt](url)`,
  są w miarę możliwości konwertowane na odpowiedzi multimedialne na końcowej ścieżce wychodzącej.
- Wieloosobowe wiadomości bezpośrednie Slack są routowane jako czaty grupowe, więc do rozmów MPIM mają zastosowanie zasady grup, zachowanie wzmianek
  i reguły sesji grupowych.
- Konfiguracja WhatsApp odbywa się na żądanie: onboarding może pokazać przepływ konfiguracji, zanim
  zależności środowiska uruchomieniowego Baileys zostaną przygotowane, a Gateway ładuje środowisko uruchomieniowe WhatsApp
  tylko wtedy, gdy kanał jest faktycznie aktywny.

## Obsługiwane kanały

- [BlueBubbles](/pl/channels/bluebubbles) — **Zalecane dla iMessage**; używa interfejsu BlueBubbles macOS server REST API z pełną obsługą funkcji (dołączony plugin; edycja, cofanie wysłania, efekty, reakcje, zarządzanie grupami — edycja jest obecnie uszkodzona w macOS 26 Tahoe).
- [Discord](/pl/channels/discord) — Discord Bot API + Gateway; obsługuje serwery, kanały i wiadomości bezpośrednie.
- [Feishu](/pl/channels/feishu) — bot Feishu/Lark przez WebSocket (dołączony plugin).
- [Google Chat](/pl/channels/googlechat) — aplikacja Google Chat API przez HTTP Webhook.
- [iMessage (starsza wersja)](/pl/channels/imessage) — starsza integracja z macOS przez imsg CLI (przestarzała, w nowych konfiguracjach używaj BlueBubbles).
- [IRC](/pl/channels/irc) — klasyczne serwery IRC; kanały i wiadomości bezpośrednie z kontrolami parowania/listy dozwolonych.
- [LINE](/pl/channels/line) — bot LINE Messaging API (dołączony plugin).
- [Matrix](/pl/channels/matrix) — protokół Matrix (dołączony plugin).
- [Mattermost](/pl/channels/mattermost) — Bot API + WebSocket; kanały, grupy, wiadomości bezpośrednie (dołączony plugin).
- [Microsoft Teams](/pl/channels/msteams) — Bot Framework; obsługa dla firm (dołączony plugin).
- [Nextcloud Talk](/pl/channels/nextcloud-talk) — samodzielnie hostowany czat przez Nextcloud Talk (dołączony plugin).
- [Nostr](/pl/channels/nostr) — zdecentralizowane wiadomości bezpośrednie przez NIP-04 (dołączony plugin).
- [QQ Bot](/pl/channels/qqbot) — QQ Bot API; czat prywatny, czat grupowy i bogate media (dołączony plugin).
- [Signal](/pl/channels/signal) — signal-cli; z naciskiem na prywatność.
- [Slack](/pl/channels/slack) — Bolt SDK; aplikacje obszaru roboczego.
- [Synology Chat](/pl/channels/synology-chat) — Synology NAS Chat przez wychodzące i przychodzące Webhooki (dołączony plugin).
- [Telegram](/pl/channels/telegram) — Bot API przez grammY; obsługuje grupy.
- [Tlon](/pl/channels/tlon) — komunikator oparty na Urbit (dołączony plugin).
- [Twitch](/pl/channels/twitch) — czat Twitch przez połączenie IRC (dołączony plugin).
- [Voice Call](/pl/plugins/voice-call) — telefonia przez Plivo lub Twilio (plugin, instalowany osobno).
- [WebChat](/pl/web/webchat) — interfejs Gateway WebChat przez WebSocket.
- [WeChat](/pl/channels/wechat) — plugin Tencent iLink Bot przez logowanie QR; tylko czaty prywatne (zewnętrzny plugin).
- [WhatsApp](/pl/channels/whatsapp) — najpopularniejszy; używa Baileys i wymaga parowania QR.
- [Yuanbao](/pl/channels/yuanbao) — bot Tencent Yuanbao (zewnętrzny plugin).
- [Zalo](/pl/channels/zalo) — Zalo Bot API; popularny komunikator w Wietnamie (dołączony plugin).
- [Zalo Personal](/pl/channels/zalouser) — konto osobiste Zalo przez logowanie QR (dołączony plugin).

## Uwagi

- Kanały mogą działać jednocześnie; skonfiguruj kilka, a OpenClaw będzie routować według czatu.
- Najszybsza konfiguracja to zwykle **Telegram** (prosty token bota). WhatsApp wymaga parowania QR i
  przechowuje więcej stanu na dysku.
- Zachowanie grup różni się w zależności od kanału; zobacz [Grupy](/pl/channels/groups).
- Parowanie wiadomości bezpośrednich i listy dozwolonych są egzekwowane dla bezpieczeństwa; zobacz [Bezpieczeństwo](/pl/gateway/security).
- Rozwiązywanie problemów: [Rozwiązywanie problemów z kanałami](/pl/channels/troubleshooting).
- Dostawcy modeli są udokumentowani osobno; zobacz [Dostawcy modeli](/pl/providers/models).
