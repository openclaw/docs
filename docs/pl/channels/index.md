---
read_when:
    - Chcesz wybrać kanał czatu dla OpenClaw
    - Potrzebujesz szybkiego przeglądu obsługiwanych platform komunikacyjnych
summary: Platformy komunikacyjne, z którymi OpenClaw może się połączyć
title: Kanały czatu
x-i18n:
    generated_at: "2026-06-27T17:11:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3ff3e59df21d71f0d80eff2a6299169bfeb15964834a552f3c4c1d5b7c144b8d
    source_path: channels/index.md
    workflow: 16
---

OpenClaw może rozmawiać z Tobą w dowolnej aplikacji czatu, której już używasz. Każdy kanał łączy się przez Gateway.
Tekst jest obsługiwany wszędzie; multimedia i reakcje różnią się zależnie od kanału.

## Uwagi dotyczące dostarczania

- Odpowiedzi Telegram zawierające składnię obrazów Markdown, takie jak `![alt](url)`,
  są w miarę możliwości konwertowane na odpowiedzi multimedialne na końcowej ścieżce wychodzącej.
- Wieloosobowe wiadomości bezpośrednie Slack są kierowane jako czaty grupowe, więc do rozmów MPIM mają zastosowanie zasady grup,
  zachowanie wzmianek i reguły sesji grupowych.
- Konfiguracja WhatsApp działa jako instalacja na żądanie: wdrażanie może pokazać przepływ konfiguracji, zanim
  pakiet Plugin zostanie zainstalowany, a Gateway ładuje zewnętrzny
  Plugin ClawHub/npm dopiero wtedy, gdy kanał jest faktycznie aktywny.
- Kanały, które akceptują wiadomości przychodzące tworzone przez boty, mogą używać współdzielonej
  [ochrony przed pętlą botów](/pl/channels/bot-loop-protection), aby zapobiec sytuacji, w której pary botów
  odpowiadają sobie nawzajem bez końca.
- Obsługiwane pokoje działające stale mogą używać [zdarzeń otoczenia pokoju](/pl/channels/ambient-room-events),
  dzięki czemu niewzmiankowana rozmowa w pokoju staje się cichym kontekstem, chyba że agent wyśle wiadomość za pomocą
  narzędzia `message`.

## Obsługiwane kanały

- [Discord](/pl/channels/discord) - Discord Bot API + Gateway; obsługuje serwery, kanały i wiadomości bezpośrednie.
- [Feishu](/pl/channels/feishu) - bot Feishu/Lark przez WebSocket (dołączony Plugin).
- [Google Chat](/pl/channels/googlechat) - aplikacja Google Chat API przez Webhook HTTP (Plugin do pobrania).
- [iMessage](/pl/channels/imessage) - natywna integracja z macOS przez most `imsg` na zalogowanym Macu (albo wrapper SSH, gdy Gateway działa gdzie indziej), w tym akcje prywatnego API dla odpowiedzi, tapbacków, efektów, załączników i zarządzania grupami. Preferowane dla nowych konfiguracji OpenClaw iMessage, gdy uprawnienia hosta i dostęp do Wiadomości są odpowiednie.
- [IRC](/pl/channels/irc) - klasyczne serwery IRC; kanały i wiadomości bezpośrednie z kontrolą parowania/listy dozwolonych.
- [LINE](/pl/channels/line) - bot LINE Messaging API (Plugin do pobrania).
- [Matrix](/pl/channels/matrix) - protokół Matrix (Plugin do pobrania).
- [Mattermost](/pl/channels/mattermost) - Bot API + WebSocket; kanały, grupy, wiadomości bezpośrednie (Plugin do pobrania).
- [Microsoft Teams](/pl/channels/msteams) - Bot Framework; obsługa dla przedsiębiorstw (dołączony Plugin).
- [Nextcloud Talk](/pl/channels/nextcloud-talk) - samodzielnie hostowany czat przez Nextcloud Talk (dołączony Plugin).
- [Nostr](/pl/channels/nostr) - zdecentralizowane wiadomości bezpośrednie przez NIP-04 (dołączony Plugin).
- [QQ Bot](/pl/channels/qqbot) - QQ Bot API; czat prywatny, czat grupowy i multimedia rozszerzone (dołączony Plugin).
- [Raft](/pl/channels/raft) - most wybudzania Raft CLI do współpracy człowieka i agenta (zewnętrzny Plugin).
- [Signal](/pl/channels/signal) - signal-cli; ukierunkowany na prywatność.
- [Slack](/pl/channels/slack) - Bolt SDK; aplikacje obszaru roboczego.
- [SMS](/pl/channels/sms) - SMS oparty na Twilio przez Gateway Webhook (oficjalny Plugin).
- [Synology Chat](/pl/channels/synology-chat) - Synology NAS Chat przez Webhooki wychodzące i przychodzące (dołączony Plugin).
- [Telegram](/pl/channels/telegram) - Bot API przez grammY; obsługuje grupy.
- [Tlon](/pl/channels/tlon) - komunikator oparty na Urbit (dołączony Plugin).
- [Twitch](/pl/channels/twitch) - czat Twitch przez połączenie IRC (dołączony Plugin).
- [Voice Call](/pl/plugins/voice-call) - telefonia przez Plivo lub Twilio (Plugin, instalowany osobno).
- [WebChat](/pl/web/webchat) - interfejs Gateway WebChat przez WebSocket.
- [WeChat](/pl/channels/wechat) - Tencent iLink Bot Plugin przez logowanie QR; tylko czaty prywatne (zewnętrzny Plugin).
- [WhatsApp](/pl/channels/whatsapp) - najpopularniejszy; używa Baileys i wymaga parowania QR.
- [Yuanbao](/pl/channels/yuanbao) - bot Tencent Yuanbao (zewnętrzny Plugin).
- [Zalo](/pl/channels/zalo) - Zalo Bot API; popularny komunikator w Wietnamie (dołączony Plugin).
- [Zalo ClawBot](/pl/channels/zaloclawbot) - osobisty asystent Zalo przez logowanie QR; powiązany z właścicielem (zewnętrzny Plugin).
- [Zalo Personal](/pl/channels/zalouser) - osobiste konto Zalo przez logowanie QR (dołączony Plugin).

## Uwagi

- Kanały mogą działać jednocześnie; skonfiguruj kilka, a OpenClaw będzie kierować ruch według czatu.
- Najszybsza konfiguracja to zwykle **Telegram** (prosty token bota). WhatsApp wymaga parowania QR i
  przechowuje więcej stanu na dysku.
- Zachowanie grup różni się zależnie od kanału; zobacz [Grupy](/pl/channels/groups).
- Parowanie wiadomości bezpośrednich i listy dozwolonych są egzekwowane ze względów bezpieczeństwa; zobacz [Zabezpieczenia](/pl/gateway/security).
- Rozwiązywanie problemów: [rozwiązywanie problemów z kanałami](/pl/channels/troubleshooting).
- Dostawcy modeli są udokumentowani osobno; zobacz [Dostawcy modeli](/pl/providers/models).
