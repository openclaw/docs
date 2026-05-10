---
read_when:
    - Chcesz wybrać kanał czatu dla OpenClaw
    - Potrzebujesz szybkiego przeglądu obsługiwanych platform komunikacyjnych
summary: Platformy komunikacyjne, z którymi OpenClaw może się łączyć
title: Kanały czatu
x-i18n:
    generated_at: "2026-05-10T19:22:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 57ae81a99d265abbf3f9f016506e787d66b4f6984d833e43e7a8554e157a3c17
    source_path: channels/index.md
    workflow: 16
---

OpenClaw może rozmawiać z Tobą w dowolnej aplikacji czatu, której już używasz. Każdy kanał łączy się przez Gateway.
Tekst jest obsługiwany wszędzie; multimedia i reakcje różnią się w zależności od kanału.

## Uwagi dotyczące dostarczania

- Odpowiedzi Telegram zawierające składnię obrazów Markdown, taką jak `![alt](url)`,
  są konwertowane na odpowiedzi multimedialne na końcowej ścieżce wychodzącej, gdy jest to możliwe.
- Wieloosobowe wiadomości bezpośrednie Slack są kierowane jako czaty grupowe, więc zasady grup,
  zachowanie wzmianek i reguły sesji grupowych mają zastosowanie do konwersacji MPIM.
- Konfiguracja WhatsApp odbywa się na żądanie: onboarding może pokazać przepływ konfiguracji przed
  zainstalowaniem pakietu pluginu, a Gateway ładuje runtime WhatsApp
  tylko wtedy, gdy kanał jest rzeczywiście aktywny.

## Obsługiwane kanały

- [Discord](/pl/channels/discord) - Discord Bot API + Gateway; obsługuje serwery, kanały i wiadomości bezpośrednie.
- [Feishu](/pl/channels/feishu) - bot Feishu/Lark przez WebSocket (wbudowany plugin).
- [Google Chat](/pl/channels/googlechat) - aplikacja Google Chat API przez Webhook HTTP (plugin do pobrania).
- [iMessage](/pl/channels/imessage) - natywna integracja z macOS przez most `imsg` na zalogowanym Macu (lub wrapper SSH, gdy Gateway działa gdzie indziej), w tym akcje prywatnego API dla odpowiedzi, tapbacków, efektów, załączników i zarządzania grupami. Zalecane dla nowych konfiguracji OpenClaw iMessage, gdy uprawnienia hosta i dostęp do Wiadomości są odpowiednie.
- [IRC](/pl/channels/irc) - klasyczne serwery IRC; kanały i wiadomości bezpośrednie z kontrolami parowania/listy dozwolonych.
- [LINE](/pl/channels/line) - bot LINE Messaging API (plugin do pobrania).
- [Matrix](/pl/channels/matrix) - protokół Matrix (plugin do pobrania).
- [Mattermost](/pl/channels/mattermost) - Bot API + WebSocket; kanały, grupy, wiadomości bezpośrednie (plugin do pobrania).
- [Microsoft Teams](/pl/channels/msteams) - Bot Framework; wsparcie dla przedsiębiorstw (wbudowany plugin).
- [Nextcloud Talk](/pl/channels/nextcloud-talk) - samoobsługowy czat przez Nextcloud Talk (wbudowany plugin).
- [Nostr](/pl/channels/nostr) - zdecentralizowane wiadomości bezpośrednie przez NIP-04 (wbudowany plugin).
- [QQ Bot](/pl/channels/qqbot) - QQ Bot API; czat prywatny, czat grupowy i bogate multimedia (wbudowany plugin).
- [Signal](/pl/channels/signal) - signal-cli; skoncentrowany na prywatności.
- [Slack](/pl/channels/slack) - Bolt SDK; aplikacje obszaru roboczego.
- [Synology Chat](/pl/channels/synology-chat) - Synology NAS Chat przez wychodzące i przychodzące Webhooki (wbudowany plugin).
- [Telegram](/pl/channels/telegram) - Bot API przez grammY; obsługuje grupy.
- [Tlon](/pl/channels/tlon) - komunikator oparty na Urbit (wbudowany plugin).
- [Twitch](/pl/channels/twitch) - czat Twitch przez połączenie IRC (wbudowany plugin).
- [Voice Call](/pl/plugins/voice-call) - telefonia przez Plivo lub Twilio (plugin, instalowany osobno).
- [WebChat](/pl/web/webchat) - interfejs Gateway WebChat przez WebSocket.
- [WeChat](/pl/channels/wechat) - plugin Tencent iLink Bot przez logowanie QR; tylko czaty prywatne (zewnętrzny plugin).
- [WhatsApp](/pl/channels/whatsapp) - najpopularniejszy; używa Baileys i wymaga parowania QR.
- [Yuanbao](/pl/channels/yuanbao) - bot Tencent Yuanbao (zewnętrzny plugin).
- [Zalo](/pl/channels/zalo) - Zalo Bot API; popularny komunikator w Wietnamie (wbudowany plugin).
- [Zalo Personal](/pl/channels/zalouser) - osobiste konto Zalo przez logowanie QR (wbudowany plugin).

## Uwagi

- Kanały mogą działać jednocześnie; skonfiguruj wiele, a OpenClaw będzie kierować wiadomości według czatu.
- Najszybsza konfiguracja to zwykle **Telegram** (prosty token bota). WhatsApp wymaga parowania QR i
  przechowuje więcej stanu na dysku.
- Zachowanie grup różni się w zależności od kanału; zobacz [Grupy](/pl/channels/groups).
- Parowanie wiadomości bezpośrednich i listy dozwolonych są egzekwowane dla bezpieczeństwa; zobacz [Bezpieczeństwo](/pl/gateway/security).
- Rozwiązywanie problemów: [Rozwiązywanie problemów z kanałami](/pl/channels/troubleshooting).
- Dostawcy modeli są udokumentowani osobno; zobacz [Dostawcy modeli](/pl/providers/models).
