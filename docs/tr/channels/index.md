---
read_when:
    - OpenClaw için bir sohbet kanalı seçmek istiyorsunuz
    - Desteklenen mesajlaşma platformları hakkında hızlı bir genel bakışa ihtiyacınız var
summary: OpenClaw'ın bağlanabileceği mesajlaşma platformları
title: Sohbet kanalları
x-i18n:
    generated_at: "2026-04-30T09:06:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: b58a1f1a0500419015985500a301d9f8ee4fa3a67b11e30561cabe2dc57b5049
    source_path: channels/index.md
    workflow: 16
---

OpenClaw, halihazırda kullandığınız herhangi bir sohbet uygulamasında sizinle konuşabilir. Her kanal Gateway üzerinden bağlanır.
Metin her yerde desteklenir; medya ve tepkiler kanala göre değişir.

## İletim notları

- `![alt](url)` gibi markdown görüntü söz dizimi içeren Telegram yanıtları,
  mümkün olduğunda son giden yolda medya yanıtlarına dönüştürülür.
- Slack çok kişili DM'leri grup sohbetleri olarak yönlendirilir; bu nedenle grup ilkesi, bahsetme
  davranışı ve grup oturumu kuralları MPIM konuşmaları için geçerlidir.
- WhatsApp kurulumu isteğe bağlı kurulumdur: başlangıç süreci, Baileys çalışma zamanı bağımlılıkları
  hazırlanmış olmadan önce kurulum akışını gösterebilir ve Gateway, WhatsApp
  çalışma zamanını yalnızca kanal gerçekten etkin olduğunda yükler.

## Desteklenen kanallar

- [BlueBubbles](/tr/channels/bluebubbles) — **iMessage için önerilir**; tam özellik desteğiyle BlueBubbles macOS sunucusu REST API'sini kullanır (birlikte gelen Plugin; düzenleme, göndermeyi geri alma, efektler, tepkiler, grup yönetimi — düzenleme şu anda macOS 26 Tahoe'da bozuk).
- [Discord](/tr/channels/discord) — Discord Bot API + Gateway; sunucuları, kanalları ve DM'leri destekler.
- [Feishu](/tr/channels/feishu) — WebSocket üzerinden Feishu/Lark botu (birlikte gelen Plugin).
- [Google Chat](/tr/channels/googlechat) — HTTP Webhook üzerinden Google Chat API uygulaması.
- [iMessage (eski)](/tr/channels/imessage) — imsg CLI üzerinden eski macOS entegrasyonu (kullanımdan kaldırıldı, yeni kurulumlar için BlueBubbles kullanın).
- [IRC](/tr/channels/irc) — Klasik IRC sunucuları; eşleştirme/izin listesi denetimleriyle kanallar + DM'ler.
- [LINE](/tr/channels/line) — LINE Messaging API botu (birlikte gelen Plugin).
- [Matrix](/tr/channels/matrix) — Matrix protokolü (birlikte gelen Plugin).
- [Mattermost](/tr/channels/mattermost) — Bot API + WebSocket; kanallar, gruplar, DM'ler (birlikte gelen Plugin).
- [Microsoft Teams](/tr/channels/msteams) — Bot Framework; kurumsal destek (birlikte gelen Plugin).
- [Nextcloud Talk](/tr/channels/nextcloud-talk) — Nextcloud Talk üzerinden kendi sunucunuzda barındırılan sohbet (birlikte gelen Plugin).
- [Nostr](/tr/channels/nostr) — NIP-04 üzerinden merkeziyetsiz DM'ler (birlikte gelen Plugin).
- [QQ Bot](/tr/channels/qqbot) — QQ Bot API; özel sohbet, grup sohbeti ve zengin medya (birlikte gelen Plugin).
- [Signal](/tr/channels/signal) — signal-cli; gizlilik odaklı.
- [Slack](/tr/channels/slack) — Bolt SDK; çalışma alanı uygulamaları.
- [Synology Chat](/tr/channels/synology-chat) — Giden+gelen Webhook'lar üzerinden Synology NAS Chat (birlikte gelen Plugin).
- [Telegram](/tr/channels/telegram) — grammY üzerinden Bot API; grupları destekler.
- [Tlon](/tr/channels/tlon) — Urbit tabanlı mesajlaşma uygulaması (birlikte gelen Plugin).
- [Twitch](/tr/channels/twitch) — IRC bağlantısı üzerinden Twitch sohbeti (birlikte gelen Plugin).
- [Voice Call](/tr/plugins/voice-call) — Plivo veya Twilio üzerinden telefon görüşmesi (Plugin, ayrıca kurulur).
- [WebChat](/tr/web/webchat) — WebSocket üzerinden Gateway WebChat kullanıcı arayüzü.
- [WeChat](/tr/channels/wechat) — QR oturum açma üzerinden Tencent iLink Bot Plugin'i; yalnızca özel sohbetler (harici Plugin).
- [WhatsApp](/tr/channels/whatsapp) — En popüler; Baileys kullanır ve QR eşleştirme gerektirir.
- [Yuanbao](/tr/channels/yuanbao) — Tencent Yuanbao botu (harici Plugin).
- [Zalo](/tr/channels/zalo) — Zalo Bot API; Vietnam'ın popüler mesajlaşma uygulaması (birlikte gelen Plugin).
- [Zalo Personal](/tr/channels/zalouser) — QR oturum açma üzerinden Zalo kişisel hesabı (birlikte gelen Plugin).

## Notlar

- Kanallar aynı anda çalışabilir; birden fazlasını yapılandırdığınızda OpenClaw sohbet başına yönlendirme yapar.
- En hızlı kurulum genellikle **Telegram**'dır (basit bot belirteci). WhatsApp QR eşleştirme gerektirir ve
  diskte daha fazla durum saklar.
- Grup davranışı kanala göre değişir; bkz. [Gruplar](/tr/channels/groups).
- DM eşleştirme ve izin listeleri güvenlik için uygulanır; bkz. [Güvenlik](/tr/gateway/security).
- Sorun giderme: [Kanal sorun giderme](/tr/channels/troubleshooting).
- Model sağlayıcıları ayrı olarak belgelenmiştir; bkz. [Model Sağlayıcıları](/tr/providers/models).
