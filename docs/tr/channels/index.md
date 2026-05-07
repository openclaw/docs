---
read_when:
    - OpenClaw için bir sohbet kanalı seçmek istiyorsunuz
    - Desteklenen mesajlaşma platformlarına hızlı bir genel bakışa ihtiyacınız var
summary: OpenClaw'ın bağlanabileceği mesajlaşma platformları
title: Sohbet kanalları
x-i18n:
    generated_at: "2026-05-07T01:50:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: ff6875f4ae86b341b6a82e13f022266461bc102ee03074a8c352eea2203d657a
    source_path: channels/index.md
    workflow: 16
---

OpenClaw, halihazırda kullandığınız herhangi bir sohbet uygulamasında sizinle konuşabilir. Her kanal Gateway üzerinden bağlanır.
Metin her yerde desteklenir; medya ve tepkiler kanala göre değişir.

## Teslimat notları

- `![alt](url)` gibi markdown resim söz dizimi içeren Telegram yanıtları,
  mümkün olduğunda son giden yolda medya yanıtlarına dönüştürülür.
- Slack çok kişili doğrudan mesajları grup sohbetleri olarak yönlendirilir; bu nedenle grup politikası, bahsetme
  davranışı ve grup oturumu kuralları MPIM konuşmaları için geçerlidir.
- WhatsApp kurulumu isteğe bağlı kurulumdur: katılım akışı, Plugin paketi yüklenmeden önce
  kurulum akışını gösterebilir ve Gateway, WhatsApp çalışma zamanını
  yalnızca kanal gerçekten etkin olduğunda yükler.

## Desteklenen kanallar

- [BlueBubbles](/tr/channels/bluebubbles) - BlueBubbles macOS sunucusu REST API'si üzerinden eski iMessage köprüsü; yeni OpenClaw kurulumları için kullanımdan kaldırılmıştır ancak mevcut yapılandırmalar ve daha zengin özel API eylemleri için hâlâ desteklenir.
- [Discord](/tr/channels/discord) - Discord Bot API + Gateway; sunucuları, kanalları ve doğrudan mesajları destekler.
- [Feishu](/tr/channels/feishu) - WebSocket üzerinden Feishu/Lark botu (birlikte gelen Plugin).
- [Google Chat](/tr/channels/googlechat) - HTTP Webhook üzerinden Google Chat API uygulaması (indirilebilir Plugin).
- [iMessage](/tr/channels/imessage) - imsg CLI üzerinden yerel macOS entegrasyonu; ana makine izinleri ve Mesajlar erişimi uygun olduğunda yeni OpenClaw iMessage kurulumları için tercih edilir.
- [IRC](/tr/channels/irc) - Klasik IRC sunucuları; eşleştirme/izin listesi kontrolleriyle kanallar + doğrudan mesajlar.
- [LINE](/tr/channels/line) - LINE Messaging API botu (indirilebilir Plugin).
- [Matrix](/tr/channels/matrix) - Matrix protokolü (indirilebilir Plugin).
- [Mattermost](/tr/channels/mattermost) - Bot API + WebSocket; kanallar, gruplar, doğrudan mesajlar (indirilebilir Plugin).
- [Microsoft Teams](/tr/channels/msteams) - Bot Framework; kurumsal destek (birlikte gelen Plugin).
- [Nextcloud Talk](/tr/channels/nextcloud-talk) - Nextcloud Talk üzerinden kendi barındırdığınız sohbet (birlikte gelen Plugin).
- [Nostr](/tr/channels/nostr) - NIP-04 üzerinden merkeziyetsiz doğrudan mesajlar (birlikte gelen Plugin).
- [QQ Bot](/tr/channels/qqbot) - QQ Bot API; özel sohbet, grup sohbeti ve zengin medya (birlikte gelen Plugin).
- [Signal](/tr/channels/signal) - signal-cli; gizlilik odaklı.
- [Slack](/tr/channels/slack) - Bolt SDK; çalışma alanı uygulamaları.
- [Synology Chat](/tr/channels/synology-chat) - Giden+gelen Webhook'lar üzerinden Synology NAS Chat (birlikte gelen Plugin).
- [Telegram](/tr/channels/telegram) - grammY üzerinden Bot API; grupları destekler.
- [Tlon](/tr/channels/tlon) - Urbit tabanlı mesajlaşma uygulaması (birlikte gelen Plugin).
- [Twitch](/tr/channels/twitch) - IRC bağlantısı üzerinden Twitch sohbeti (birlikte gelen Plugin).
- [Voice Call](/tr/plugins/voice-call) - Plivo veya Twilio üzerinden telefon hizmeti (Plugin, ayrı yüklenir).
- [WebChat](/tr/web/webchat) - WebSocket üzerinden Gateway WebChat kullanıcı arayüzü.
- [WeChat](/tr/channels/wechat) - QR girişi üzerinden Tencent iLink Bot Plugin'i; yalnızca özel sohbetler (harici Plugin).
- [WhatsApp](/tr/channels/whatsapp) - En popüler olanı; Baileys kullanır ve QR eşleştirmesi gerektirir.
- [Yuanbao](/tr/channels/yuanbao) - Tencent Yuanbao botu (harici Plugin).
- [Zalo](/tr/channels/zalo) - Zalo Bot API; Vietnam'ın popüler mesajlaşma uygulaması (birlikte gelen Plugin).
- [Zalo Personal](/tr/channels/zalouser) - QR girişi üzerinden Zalo kişisel hesabı (birlikte gelen Plugin).

## Notlar

- Kanallar aynı anda çalışabilir; birden fazlasını yapılandırın, OpenClaw sohbet başına yönlendirme yapar.
- En hızlı kurulum genellikle **Telegram**'dır (basit bot token'ı). WhatsApp QR eşleştirmesi gerektirir ve
  diskte daha fazla durum saklar.
- Grup davranışı kanala göre değişir; bkz. [Gruplar](/tr/channels/groups).
- Doğrudan mesaj eşleştirmesi ve izin listeleri güvenlik için zorunlu tutulur; bkz. [Güvenlik](/tr/gateway/security).
- Sorun giderme: [Kanal sorunlarını giderme](/tr/channels/troubleshooting).
- Model sağlayıcıları ayrı olarak belgelenmiştir; bkz. [Model Sağlayıcıları](/tr/providers/models).
