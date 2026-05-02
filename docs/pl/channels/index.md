---
read_when:
    - Chcesz wybrać kanał czatu dla OpenClaw
    - Potrzebujesz szybkiego przeglądu obsługiwanych platform komunikacyjnych
summary: Platformy komunikacyjne, z którymi OpenClaw może się łączyć
title: Kanały czatu
x-i18n:
    generated_at: "2026-05-02T09:42:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 785af727e9491914f5a9459672d47c2cfde3319b318c698051cd7e89d023d4b9
    source_path: channels/index.md
    workflow: 16
---

OpenClaw może rozmawiać z Tobą w dowolnej aplikacji czatu, której już używasz. Każdy kanał łączy się przez Gateway.
Tekst jest obsługiwany wszędzie; obsługa multimediów i reakcji różni się w zależności od kanału.

## Uwagi dotyczące dostarczania

- Odpowiedzi Telegram zawierające składnię obrazów markdown, taką jak `![alt](url)`,
  są konwertowane na odpowiedzi multimedialne na końcowej ścieżce wychodzącej, gdy jest to możliwe.
- Wieloosobowe wiadomości prywatne w Slack są trasowane jako czaty grupowe, więc zasady grup,
  zachowanie wzmianek i reguły sesji grupowych mają zastosowanie do rozmów MPIM.
- Konfiguracja WhatsApp działa w trybie instalacji na żądanie: onboarding może pokazać przepływ konfiguracji, zanim
  pakiet pluginu zostanie zainstalowany, a Gateway ładuje runtime WhatsApp
  tylko wtedy, gdy kanał jest faktycznie aktywny.

## Obsługiwane kanały

- [BlueBubbles](/pl/channels/bluebubbles) — **Zalecane dla iMessage**; używa REST API serwera BlueBubbles macOS z pełną obsługą funkcji (dołączony plugin; edycja, cofanie wysyłki, efekty, reakcje, zarządzanie grupami — edycja jest obecnie zepsuta w macOS 26 Tahoe).
- [Discord](/pl/channels/discord) — Discord Bot API + Gateway; obsługuje serwery, kanały i wiadomości prywatne.
- [Feishu](/pl/channels/feishu) — bot Feishu/Lark przez WebSocket (dołączony plugin).
- [Google Chat](/pl/channels/googlechat) — aplikacja Google Chat API przez Webhook HTTP (plugin do pobrania).
- [iMessage (legacy)](/pl/channels/imessage) — starsza integracja z macOS przez imsg CLI (przestarzała, do nowych konfiguracji użyj BlueBubbles).
- [IRC](/pl/channels/irc) — klasyczne serwery IRC; kanały + wiadomości prywatne z kontrolą parowania/listy dozwolonych.
- [LINE](/pl/channels/line) — bot LINE Messaging API (plugin do pobrania).
- [Matrix](/pl/channels/matrix) — protokół Matrix (plugin do pobrania).
- [Mattermost](/pl/channels/mattermost) — Bot API + WebSocket; kanały, grupy, wiadomości prywatne (plugin do pobrania).
- [Microsoft Teams](/pl/channels/msteams) — Bot Framework; obsługa korporacyjna (dołączony plugin).
- [Nextcloud Talk](/pl/channels/nextcloud-talk) — samodzielnie hostowany czat przez Nextcloud Talk (dołączony plugin).
- [Nostr](/pl/channels/nostr) — zdecentralizowane wiadomości prywatne przez NIP-04 (dołączony plugin).
- [QQ Bot](/pl/channels/qqbot) — QQ Bot API; czat prywatny, czat grupowy i multimedia rozszerzone (dołączony plugin).
- [Signal](/pl/channels/signal) — signal-cli; ukierunkowany na prywatność.
- [Slack](/pl/channels/slack) — Bolt SDK; aplikacje obszaru roboczego.
- [Synology Chat](/pl/channels/synology-chat) — Synology NAS Chat przez wychodzące i przychodzące Webhooki (dołączony plugin).
- [Telegram](/pl/channels/telegram) — Bot API przez grammY; obsługuje grupy.
- [Tlon](/pl/channels/tlon) — komunikator oparty na Urbit (dołączony plugin).
- [Twitch](/pl/channels/twitch) — czat Twitch przez połączenie IRC (dołączony plugin).
- [Voice Call](/pl/plugins/voice-call) — telefonia przez Plivo lub Twilio (plugin, instalowany osobno).
- [WebChat](/pl/web/webchat) — interfejs WebChat Gateway przez WebSocket.
- [WeChat](/pl/channels/wechat) — plugin Tencent iLink Bot przez logowanie QR; tylko czaty prywatne (zewnętrzny plugin).
- [WhatsApp](/pl/channels/whatsapp) — najpopularniejszy; używa Baileys i wymaga parowania QR.
- [Yuanbao](/pl/channels/yuanbao) — bot Tencent Yuanbao (zewnętrzny plugin).
- [Zalo](/pl/channels/zalo) — Zalo Bot API; popularny komunikator w Wietnamie (dołączony plugin).
- [Zalo Personal](/pl/channels/zalouser) — konto osobiste Zalo przez logowanie QR (dołączony plugin).

## Uwagi

- Kanały mogą działać równocześnie; skonfiguruj kilka, a OpenClaw będzie trasować według czatu.
- Najszybsza konfiguracja to zwykle **Telegram** (prosty token bota). WhatsApp wymaga parowania QR i
  przechowuje więcej stanu na dysku.
- Zachowanie grup różni się w zależności od kanału; zobacz [Grupy](/pl/channels/groups).
- Parowanie wiadomości prywatnych i listy dozwolonych są egzekwowane ze względów bezpieczeństwa; zobacz [Bezpieczeństwo](/pl/gateway/security).
- Rozwiązywanie problemów: [Rozwiązywanie problemów z kanałami](/pl/channels/troubleshooting).
- Dostawcy modeli są udokumentowani osobno; zobacz [Dostawcy modeli](/pl/providers/models).
