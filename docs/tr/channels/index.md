---
read_when:
    - OpenClaw için bir sohbet kanalı seçmek istiyorsunuz
    - Desteklenen mesajlaşma platformlarına hızlı bir genel bakışa ihtiyacınız var
summary: OpenClaw'ın bağlanabileceği mesajlaşma platformları
title: Sohbet Kanalları
x-i18n:
    generated_at: "2026-04-19T01:11:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: d41c3a37d91c07f15afd8e199a289297772331c70e38697346a373595eb2d993
    source_path: channels/index.md
    workflow: 15
---

# Sohbet Kanalları

OpenClaw, zaten kullandığınız herhangi bir sohbet uygulamasında sizinle konuşabilir. Her kanal Gateway üzerinden bağlanır.
Metin her yerde desteklenir; medya ve tepkiler kanala göre değişir.

## Desteklenen kanallar

- [BlueBubbles](/tr/channels/bluebubbles) — **iMessage için önerilir**; tam özellik desteğiyle BlueBubbles macOS sunucusu REST API'sini kullanır (paketle gelen plugin; düzenleme, göndermeyi geri alma, efektler, tepkiler, grup yönetimi — düzenleme şu anda macOS 26 Tahoe'da bozuk).
- [Discord](/tr/channels/discord) — Discord Bot API + Gateway; sunucuları, kanalları ve DM'leri destekler.
- [Feishu](/tr/channels/feishu) — WebSocket üzerinden Feishu/Lark botu (paketle gelen plugin).
- [Google Chat](/tr/channels/googlechat) — HTTP Webhook üzerinden Google Chat API uygulaması.
- [iMessage (legacy)](/tr/channels/imessage) — `imsg` CLI üzerinden eski macOS entegrasyonu (kullanımdan kaldırılmıştır, yeni kurulumlar için BlueBubbles kullanın).
- [IRC](/tr/channels/irc) — Klasik IRC sunucuları; eşleştirme/izin listesi kontrolleriyle kanallar + DM'ler.
- [LINE](/tr/channels/line) — LINE Messaging API botu (paketle gelen plugin).
- [Matrix](/tr/channels/matrix) — Matrix protokolü (paketle gelen plugin).
- [Mattermost](/tr/channels/mattermost) — Bot API + WebSocket; kanallar, gruplar, DM'ler (paketle gelen plugin).
- [Microsoft Teams](/tr/channels/msteams) — Bot Framework; kurumsal destek (paketle gelen plugin).
- [Nextcloud Talk](/tr/channels/nextcloud-talk) — Nextcloud Talk üzerinden self-hosted sohbet (paketle gelen plugin).
- [Nostr](/tr/channels/nostr) — NIP-04 üzerinden merkeziyetsiz DM'ler (paketle gelen plugin).
- [QQ Bot](/tr/channels/qqbot) — QQ Bot API; özel sohbet, grup sohbeti ve zengin medya (paketle gelen plugin).
- [Signal](/tr/channels/signal) — `signal-cli`; gizliliğe odaklı.
- [Slack](/tr/channels/slack) — Bolt SDK; çalışma alanı uygulamaları.
- [Synology Chat](/tr/channels/synology-chat) — giden+gelen Webhook'lar üzerinden Synology NAS Chat (paketle gelen plugin).
- [Telegram](/tr/channels/telegram) — grammY üzerinden Bot API; grupları destekler.
- [Tlon](/tr/channels/tlon) — Urbit tabanlı mesajlaşma uygulaması (paketle gelen plugin).
- [Twitch](/tr/channels/twitch) — IRC bağlantısı üzerinden Twitch sohbeti (paketle gelen plugin).
- [Voice Call](/tr/plugins/voice-call) — Plivo veya Twilio üzerinden telefon hizmeti (plugin, ayrı olarak yüklenir).
- [WebChat](/web/webchat) — WebSocket üzerinden Gateway WebChat kullanıcı arayüzü.
- [WeChat](/tr/channels/wechat) — QR girişi üzerinden Tencent iLink Bot plugin'i; yalnızca özel sohbetler (harici plugin).
- [WhatsApp](/tr/channels/whatsapp) — En popüler; Baileys kullanır ve QR eşleştirmesi gerektirir.
- [Zalo](/tr/channels/zalo) — Zalo Bot API; Vietnam'ın popüler mesajlaşma uygulaması (paketle gelen plugin).
- [Zalo Personal](/tr/channels/zalouser) — QR girişi üzerinden kişisel Zalo hesabı (paketle gelen plugin).

## Notlar

- Kanallar aynı anda çalışabilir; birden fazlasını yapılandırın, OpenClaw sohbet başına yönlendirme yapacaktır.
- En hızlı kurulum genellikle **Telegram**'dır (basit bot token'ı). WhatsApp QR eşleştirmesi gerektirir ve
  diskte daha fazla durum verisi depolar.
- Grup davranışı kanala göre değişir; bkz. [Groups](/tr/channels/groups).
- Güvenlik için DM eşleştirmesi ve izin listeleri zorunlu tutulur; bkz. [Security](/tr/gateway/security).
- Sorun giderme: [Kanal sorun giderme](/tr/channels/troubleshooting).
- Model sağlayıcıları ayrı olarak belgelenmiştir; bkz. [Model Sağlayıcıları](/tr/providers/models).
