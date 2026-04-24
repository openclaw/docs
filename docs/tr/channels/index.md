---
read_when:
    - OpenClaw için bir sohbet kanalı seçmek istiyorsunuz
    - Desteklenen mesajlaşma platformlarına dair hızlı bir genel bakışa ihtiyacınız var
summary: OpenClaw'ın bağlanabildiği mesajlaşma platformları
title: Sohbet kanalları
x-i18n:
    generated_at: "2026-04-24T08:58:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: c016b78b16724e73b21946d6bed0009f4cbebd1f887620431b9b4bff70f2b1ff
    source_path: channels/index.md
    workflow: 15
---

OpenClaw, zaten kullandığınız herhangi bir sohbet uygulamasında sizinle konuşabilir. Her kanal Gateway üzerinden bağlanır.
Metin her yerde desteklenir; medya ve tepkiler kanala göre değişir.

## Desteklenen kanallar

- [BlueBubbles](/tr/channels/bluebubbles) — **iMessage için önerilir**; BlueBubbles macOS sunucu REST API'sini tam özellik desteğiyle kullanır (paketli plugin; düzenleme, geri alma, efektler, tepkiler, grup yönetimi — düzenleme şu anda macOS 26 Tahoe'da bozuk).
- [Discord](/tr/channels/discord) — Discord Bot API + Gateway; sunucuları, kanalları ve DM'leri destekler.
- [Feishu](/tr/channels/feishu) — WebSocket üzerinden Feishu/Lark botu (paketli plugin).
- [Google Chat](/tr/channels/googlechat) — HTTP Webhook üzerinden Google Chat API uygulaması.
- [iMessage (legacy)](/tr/channels/imessage) — `imsg` CLI üzerinden eski macOS entegrasyonu (kullanımdan kaldırıldı, yeni kurulumlar için BlueBubbles kullanın).
- [IRC](/tr/channels/irc) — Klasik IRC sunucuları; eşleştirme/izin listesi denetimleriyle kanallar + DM'ler.
- [LINE](/tr/channels/line) — LINE Messaging API botu (paketli plugin).
- [Matrix](/tr/channels/matrix) — Matrix protokolü (paketli plugin).
- [Mattermost](/tr/channels/mattermost) — Bot API + WebSocket; kanallar, gruplar, DM'ler (paketli plugin).
- [Microsoft Teams](/tr/channels/msteams) — Bot Framework; kurumsal destek (paketli plugin).
- [Nextcloud Talk](/tr/channels/nextcloud-talk) — Nextcloud Talk üzerinden self-hosted sohbet (paketli plugin).
- [Nostr](/tr/channels/nostr) — NIP-04 üzerinden merkeziyetsiz DM'ler (paketli plugin).
- [QQ Bot](/tr/channels/qqbot) — QQ Bot API; özel sohbet, grup sohbeti ve zengin medya (paketli plugin).
- [Signal](/tr/channels/signal) — `signal-cli`; gizlilik odaklı.
- [Slack](/tr/channels/slack) — Bolt SDK; çalışma alanı uygulamaları.
- [Synology Chat](/tr/channels/synology-chat) — giden+gelen webhook'lar üzerinden Synology NAS Chat (paketli plugin).
- [Telegram](/tr/channels/telegram) — `grammY` üzerinden Bot API; grupları destekler.
- [Tlon](/tr/channels/tlon) — Urbit tabanlı mesajlaşma uygulaması (paketli plugin).
- [Twitch](/tr/channels/twitch) — IRC bağlantısı üzerinden Twitch sohbeti (paketli plugin).
- [Voice Call](/tr/plugins/voice-call) — Plivo veya Twilio üzerinden telefon hizmeti (plugin, ayrı kurulur).
- [WebChat](/tr/web/webchat) — WebSocket üzerinden Gateway WebChat arayüzü.
- [WeChat](/tr/channels/wechat) — QR oturumu açma üzerinden Tencent iLink Bot plugin'i; yalnızca özel sohbetler (harici plugin).
- [WhatsApp](/tr/channels/whatsapp) — En popüler; Baileys kullanır ve QR eşleştirmesi gerektirir.
- [Zalo](/tr/channels/zalo) — Zalo Bot API; Vietnam'ın popüler mesajlaşma uygulaması (paketli plugin).
- [Zalo Personal](/tr/channels/zalouser) — QR oturumu açma üzerinden kişisel Zalo hesabı (paketli plugin).

## Notlar

- Kanallar aynı anda çalışabilir; birden fazlasını yapılandırın, OpenClaw sohbet başına yönlendirme yapacaktır.
- En hızlı kurulum genellikle **Telegram**'dır (basit bot token'ı). WhatsApp QR eşleştirmesi gerektirir ve
  diskte daha fazla durum saklar.
- Grup davranışı kanala göre değişir; bkz. [Groups](/tr/channels/groups).
- DM eşleştirme ve izin listeleri güvenlik için zorunlu tutulur; bkz. [Security](/tr/gateway/security).
- Sorun giderme: [Channel troubleshooting](/tr/channels/troubleshooting).
- Model sağlayıcıları ayrı olarak belgelenmiştir; bkz. [Model Providers](/tr/providers/models).
