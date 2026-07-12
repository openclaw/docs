---
read_when:
    - Chcesz wybrać kanał czatu dla OpenClaw
    - Potrzebujesz krótkiego przeglądu obsługiwanych platform komunikacyjnych
summary: Platformy komunikacyjne, z którymi OpenClaw może się połączyć
title: Kanały czatu
x-i18n:
    generated_at: "2026-07-12T14:53:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 411b011a8e5dd83d3f30a672c0e8a56251ee8c6ca7cdf3e7dc5c2b1f1b31d73d
    source_path: channels/index.md
    workflow: 16
---

OpenClaw może komunikować się z Tobą w dowolnej aplikacji czatu, której już używasz. Każdy kanał łączy się przez Gateway.
Tekst jest obsługiwany wszędzie; obsługa multimediów i reakcji zależy od kanału.

iMessage, Telegram i interfejs WebChat są dostarczane z podstawową instalacją. Kanały oznaczone jako
„oficjalny plugin” można zainstalować jednym poleceniem (`openclaw plugins install @openclaw/<id>`)
lub na żądanie podczas `openclaw onboard` / `openclaw channels add`, po czym wymagają ponownego
uruchomienia Gateway. Kanały oznaczone jako „zewnętrzny plugin” są utrzymywane poza repozytorium OpenClaw.

## Obsługiwane kanały

- [Discord](/pl/channels/discord) — Discord Bot API + Gateway; obsługuje serwery, kanały i wiadomości prywatne (oficjalny plugin).
- [Feishu](/pl/channels/feishu) — bot Feishu/Lark przez WebSocket (oficjalny plugin).
- [Google Chat](/pl/channels/googlechat) — aplikacja Google Chat API przez webhook HTTP (oficjalny plugin).
- [iMessage](/pl/channels/imessage) — zawarty w podstawowej instalacji. Natywna integracja z macOS za pośrednictwem mostu `imsg` na zalogowanym komputerze Mac (lub nakładki SSH, gdy Gateway działa gdzie indziej), w tym prywatne akcje API dotyczące odpowiedzi, reakcji Tapback, efektów, załączników i zarządzania grupami.
- [IRC](/pl/channels/irc) — klasyczne serwery IRC; kanały i wiadomości prywatne z kontrolą parowania i listy dozwolonych (oficjalny plugin).
- [LINE](/pl/channels/line) — bot LINE Messaging API (oficjalny plugin).
- [Matrix](/pl/channels/matrix) — protokół Matrix (oficjalny plugin).
- [Mattermost](/pl/channels/mattermost) — Bot API + WebSocket; kanały, grupy i wiadomości prywatne (oficjalny plugin).
- [Microsoft Teams](/pl/channels/msteams) — Bot Framework; obsługa zastosowań korporacyjnych (oficjalny plugin).
- [Nextcloud Talk](/pl/channels/nextcloud-talk) — samodzielnie hostowany czat za pośrednictwem Nextcloud Talk (oficjalny plugin).
- [Nostr](/pl/channels/nostr) — zdecentralizowane wiadomości prywatne przez NIP-04 (oficjalny plugin).
- [QQ Bot](/pl/channels/qqbot) — QQ Bot API; czaty prywatne, czaty grupowe i rozbudowane multimedia (oficjalny plugin).
- [Raft](/pl/channels/raft) — most wybudzający Raft CLI do współpracy ludzi i agentów (oficjalny plugin).
- [Signal](/pl/channels/signal) — signal-cli; ukierunkowany na prywatność (oficjalny plugin).
- [Slack](/pl/channels/slack) — Bolt SDK; aplikacje obszarów roboczych (oficjalny plugin).
- [SMS](/pl/channels/sms) — wiadomości SMS obsługiwane przez Twilio za pośrednictwem webhooka Gateway (oficjalny plugin).
- [Synology Chat](/pl/channels/synology-chat) — Synology NAS Chat przez wychodzące i przychodzące webhooki (oficjalny plugin).
- [Telegram](/pl/channels/telegram) — zawarty w podstawowej instalacji. Bot API przez grammY; obsługuje grupy.
- [Tlon](/pl/channels/tlon) — komunikator oparty na Urbit (oficjalny plugin).
- [Twitch](/pl/channels/twitch) — czat Twitch przez połączenie IRC (oficjalny plugin).
- [Połączenia głosowe](/pl/plugins/voice-call) — telefonia za pośrednictwem Plivo, Telnyx lub Twilio (oficjalny plugin).
- [WebChat](/pl/web/webchat) — zawarty w podstawowej instalacji. Interfejs WebChat Gateway działający przez WebSocket.
- [WeChat](/pl/channels/wechat) — bot Tencent iLink z logowaniem za pomocą kodu QR; tylko czaty prywatne (zewnętrzny plugin).
- [WhatsApp](/pl/channels/whatsapp) — najpopularniejszy; używa Baileys i wymaga parowania za pomocą kodu QR (oficjalny plugin).
- [Yuanbao](/pl/channels/yuanbao) — bot Tencent Yuanbao (zewnętrzny plugin).
- [Zalo](/pl/channels/zalo) — Zalo Bot API; popularny komunikator w Wietnamie (oficjalny plugin).
- [Zalo ClawBot](/pl/channels/zaloclawbot) — osobisty asystent Zalo z logowaniem za pomocą kodu QR; powiązany z właścicielem (zewnętrzny plugin).
- [Zalo Personal](/pl/channels/zalouser) — osobiste konto Zalo z logowaniem za pomocą kodu QR (oficjalny plugin).

## Uwagi dotyczące dostarczania

- Odpowiedzi Telegram zawierające składnię obrazu Markdown, taką jak `![alt](url)`,
  są w miarę możliwości przekształcane w odpowiedzi multimedialne na końcowym etapie wysyłania.
- Wieloosobowe wiadomości prywatne w Slack są kierowane jako czaty grupowe, dlatego do rozmów MPIM
  mają zastosowanie zasady grup, obsługa wzmianek i reguły sesji grupowych.
- Konfiguracja WhatsApp odbywa się przez instalację na żądanie: proces wdrażania może wyświetlić
  procedurę konfiguracji przed zainstalowaniem pakietu pluginu, a Gateway ładuje zewnętrzny
  plugin ClawHub/npm dopiero wtedy, gdy kanał jest faktycznie aktywny.
- Kanały akceptujące wiadomości przychodzące utworzone przez boty mogą korzystać ze wspólnej
  [ochrony przed pętlami botów](/pl/channels/bot-loop-protection), aby zapobiec
  odpowiadaniu sobie nawzajem przez pary botów w nieskończoność.
- Obsługiwane stale aktywne pokoje mogą korzystać ze [zdarzeń otoczenia pokoju](/pl/channels/ambient-room-events),
  dzięki czemu rozmowy w pokoju bez wzmianki stają się cichym kontekstem, chyba że agent wysyła wiadomość
  za pomocą narzędzia `message`.

## Uwagi

- Kanały mogą działać jednocześnie; skonfiguruj kilka, a OpenClaw będzie kierować wiadomości według czatu.
- Najszybsza konfiguracja to zwykle **Telegram** (prosty token bota, bez instalacji pluginu). WhatsApp
  wymaga parowania za pomocą kodu QR i przechowuje więcej stanu na dysku.
- Zachowanie grup zależy od kanału; zobacz [Grupy](/pl/channels/groups).
- Ze względów bezpieczeństwa wymuszane są parowanie wiadomości prywatnych i listy dozwolonych; zobacz [Bezpieczeństwo](/pl/gateway/security).
- Rozwiązywanie problemów: [Rozwiązywanie problemów z kanałami](/pl/channels/troubleshooting).
- Dostawcy modeli są opisani osobno; zobacz [Dostawcy modeli](/pl/providers/models).
