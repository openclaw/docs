---
read_when:
    - OpenClaw için bir sohbet kanalı seçmek istiyorsunuz
    - Desteklenen mesajlaşma platformlarına hızlı bir genel bakışa ihtiyacınız var
summary: OpenClaw'ın bağlanabileceği mesajlaşma platformları
title: Sohbet kanalları
x-i18n:
    generated_at: "2026-05-06T09:02:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: c357a9dfabf12329954f30084fe9abfad9aa96f62bcd72b3d0802819d5979d7b
    source_path: channels/index.md
    workflow: 16
---

OpenClaw, zaten kullandığınız herhangi bir sohbet uygulamasında sizinle konuşabilir. Her kanal Gateway üzerinden bağlanır.
Metin her yerde desteklenir; medya ve tepkiler kanala göre değişir.

## Teslim notları

- `![alt](url)` gibi markdown görsel söz dizimi içeren Telegram yanıtları,
  mümkün olduğunda son giden yolda medya yanıtlarına dönüştürülür.
- Slack çok kişili DM'leri grup sohbetleri olarak yönlendirilir; bu nedenle grup ilkesi, bahsetme
  davranışı ve grup oturumu kuralları MPIM konuşmalarına uygulanır.
- WhatsApp kurulumu isteğe bağlı yükleme şeklindedir: onboarding, plugin paketi
  kurulmadan önce kurulum akışını gösterebilir ve Gateway, WhatsApp runtime'ını
  yalnızca kanal gerçekten etkin olduğunda yükler.

## Desteklenen kanallar

- [BlueBubbles](/tr/channels/bluebubbles) - **iMessage için önerilir**; tam özellik desteğiyle BlueBubbles macOS sunucusu REST API'sini kullanır (paketle gelen plugin; düzenleme, göndermeyi geri alma, efektler, tepkiler, grup yönetimi - düzenleme şu anda macOS 26 Tahoe'da bozuk).
- [Discord](/tr/channels/discord) - Discord Bot API + Gateway; sunucuları, kanalları ve DM'leri destekler.
- [Feishu](/tr/channels/feishu) - WebSocket üzerinden Feishu/Lark botu (paketle gelen plugin).
- [Google Chat](/tr/channels/googlechat) - HTTP Webhook üzerinden Google Chat API uygulaması (indirilebilir plugin).
- [iMessage (legacy)](/tr/channels/imessage) - imsg CLI üzerinden eski macOS entegrasyonu (kullanımdan kaldırıldı, yeni kurulumlar için BlueBubbles kullanın).
- [IRC](/tr/channels/irc) - Klasik IRC sunucuları; eşleştirme/izin listesi kontrolleriyle kanallar + DM'ler.
- [LINE](/tr/channels/line) - LINE Messaging API botu (indirilebilir plugin).
- [Matrix](/tr/channels/matrix) - Matrix protokolü (indirilebilir plugin).
- [Mattermost](/tr/channels/mattermost) - Bot API + WebSocket; kanallar, gruplar, DM'ler (indirilebilir plugin).
- [Microsoft Teams](/tr/channels/msteams) - Bot Framework; kurumsal destek (paketle gelen plugin).
- [Nextcloud Talk](/tr/channels/nextcloud-talk) - Nextcloud Talk üzerinden kendi barındırdığınız sohbet (paketle gelen plugin).
- [Nostr](/tr/channels/nostr) - NIP-04 üzerinden merkeziyetsiz DM'ler (paketle gelen plugin).
- [QQ Bot](/tr/channels/qqbot) - QQ Bot API; özel sohbet, grup sohbeti ve zengin medya (paketle gelen plugin).
- [Signal](/tr/channels/signal) - signal-cli; gizlilik odaklı.
- [Slack](/tr/channels/slack) - Bolt SDK; çalışma alanı uygulamaları.
- [Synology Chat](/tr/channels/synology-chat) - Giden+gelen Webhook'lar üzerinden Synology NAS Chat (paketle gelen plugin).
- [Telegram](/tr/channels/telegram) - grammY üzerinden Bot API; grupları destekler.
- [Tlon](/tr/channels/tlon) - Urbit tabanlı mesajlaşma uygulaması (paketle gelen plugin).
- [Twitch](/tr/channels/twitch) - IRC bağlantısı üzerinden Twitch sohbeti (paketle gelen plugin).
- [Voice Call](/tr/plugins/voice-call) - Plivo veya Twilio üzerinden telefon hizmeti (plugin, ayrı kurulur).
- [WebChat](/tr/web/webchat) - WebSocket üzerinden Gateway WebChat kullanıcı arayüzü.
- [WeChat](/tr/channels/wechat) - QR girişi üzerinden Tencent iLink Bot plugin'i; yalnızca özel sohbetler (harici plugin).
- [WhatsApp](/tr/channels/whatsapp) - En popüler; Baileys kullanır ve QR eşleştirmesi gerektirir.
- [Yuanbao](/tr/channels/yuanbao) - Tencent Yuanbao botu (harici plugin).
- [Zalo](/tr/channels/zalo) - Zalo Bot API; Vietnam'ın popüler mesajlaşma uygulaması (paketle gelen plugin).
- [Zalo Personal](/tr/channels/zalouser) - QR girişi üzerinden Zalo kişisel hesabı (paketle gelen plugin).

## Notlar

- Kanallar aynı anda çalışabilir; birden çok kanal yapılandırın, OpenClaw sohbet bazında yönlendirme yapar.
- En hızlı kurulum genellikle **Telegram**'dır (basit bot token'ı). WhatsApp QR eşleştirmesi gerektirir ve
  diskte daha fazla durum saklar.
- Grup davranışı kanala göre değişir; bkz. [Gruplar](/tr/channels/groups).
- DM eşleştirmesi ve izin listeleri güvenlik için uygulanır; bkz. [Güvenlik](/tr/gateway/security).
- Sorun giderme: [Kanal sorun giderme](/tr/channels/troubleshooting).
- Model sağlayıcıları ayrı olarak belgelenmiştir; bkz. [Model Sağlayıcıları](/tr/providers/models).
