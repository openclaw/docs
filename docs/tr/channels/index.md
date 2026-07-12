---
read_when:
    - OpenClaw için bir sohbet kanalı seçmek istiyorsunuz
    - Desteklenen mesajlaşma platformlarına hızlı bir genel bakışa ihtiyacınız var
summary: OpenClaw'un bağlanabildiği mesajlaşma platformları
title: Sohbet kanalları
x-i18n:
    generated_at: "2026-07-12T12:03:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 411b011a8e5dd83d3f30a672c0e8a56251ee8c6ca7cdf3e7dc5c2b1f1b31d73d
    source_path: channels/index.md
    workflow: 16
---

OpenClaw, hâlihazırda kullandığınız herhangi bir sohbet uygulamasında sizinle iletişim kurabilir. Her kanal Gateway üzerinden bağlanır.
Metin her yerde desteklenir; medya ve tepkiler kanala göre değişir.

iMessage, Telegram ve WebChat kullanıcı arayüzü temel kurulumla birlikte gelir. "Resmî plugin" olarak işaretlenen kanallar tek bir komutla (`openclaw plugins install @openclaw/<id>`)
veya `openclaw onboard` / `openclaw channels add` sırasında gerektiğinde kurulur ve ardından Gateway'in
yeniden başlatılması gerekir. "Harici plugin" kanallarının bakımı OpenClaw deposunun dışında yapılır.

## Desteklenen kanallar

- [Discord](/tr/channels/discord) - Discord Bot API + Gateway; sunucuları, kanalları ve doğrudan mesajları destekler (resmî plugin).
- [Feishu](/tr/channels/feishu) - WebSocket üzerinden Feishu/Lark botu (resmî plugin).
- [Google Chat](/tr/channels/googlechat) - HTTP Webhook üzerinden Google Chat API uygulaması (resmî plugin).
- [iMessage](/tr/channels/imessage) - Temel bileşenlere dahildir. Oturum açılmış bir Mac'te `imsg` köprüsü (veya Gateway başka bir yerde çalışıyorsa SSH sarmalayıcısı) üzerinden yerel macOS entegrasyonu; yanıtlar, tapback'ler, efektler, ekler ve grup yönetimi için özel API eylemlerini de içerir.
- [IRC](/tr/channels/irc) - Klasik IRC sunucuları; eşleştirme/izin listesi denetimleriyle kanallar ve doğrudan mesajlar (resmî plugin).
- [LINE](/tr/channels/line) - LINE Messaging API botu (resmî plugin).
- [Matrix](/tr/channels/matrix) - Matrix protokolü (resmî plugin).
- [Mattermost](/tr/channels/mattermost) - Bot API + WebSocket; kanallar, gruplar ve doğrudan mesajlar (resmî plugin).
- [Microsoft Teams](/tr/channels/msteams) - Bot Framework; kurumsal destek (resmî plugin).
- [Nextcloud Talk](/tr/channels/nextcloud-talk) - Nextcloud Talk üzerinden kendi sunucunuzda barındırılan sohbet (resmî plugin).
- [Nostr](/tr/channels/nostr) - NIP-04 üzerinden merkeziyetsiz doğrudan mesajlar (resmî plugin).
- [QQ Bot](/tr/channels/qqbot) - QQ Bot API; özel sohbet, grup sohbeti ve zengin medya (resmî plugin).
- [Raft](/tr/channels/raft) - İnsan ve ajan iş birliği için Raft CLI uyandırma köprüsü (resmî plugin).
- [Signal](/tr/channels/signal) - signal-cli; gizlilik odaklı (resmî plugin).
- [Slack](/tr/channels/slack) - Bolt SDK; çalışma alanı uygulamaları (resmî plugin).
- [SMS](/tr/channels/sms) - Gateway Webhook'u üzerinden Twilio destekli SMS (resmî plugin).
- [Synology Chat](/tr/channels/synology-chat) - Giden ve gelen Webhook'lar üzerinden Synology NAS Chat (resmî plugin).
- [Telegram](/tr/channels/telegram) - Temel bileşenlere dahildir. grammY üzerinden Bot API; grupları destekler.
- [Tlon](/tr/channels/tlon) - Urbit tabanlı mesajlaşma uygulaması (resmî plugin).
- [Twitch](/tr/channels/twitch) - IRC bağlantısı üzerinden Twitch sohbeti (resmî plugin).
- [Sesli Arama](/tr/plugins/voice-call) - Plivo, Telnyx veya Twilio üzerinden telefon görüşmesi (resmî plugin).
- [WebChat](/tr/web/webchat) - Temel bileşenlere dahildir. WebSocket üzerinden Gateway WebChat kullanıcı arayüzü.
- [WeChat](/tr/channels/wechat) - QR ile oturum açma üzerinden Tencent iLink botu; yalnızca özel sohbetler (harici plugin).
- [WhatsApp](/tr/channels/whatsapp) - En popüler seçenek; Baileys kullanır ve QR eşleştirmesi gerektirir (resmî plugin).
- [Yuanbao](/tr/channels/yuanbao) - Tencent Yuanbao botu (harici plugin).
- [Zalo](/tr/channels/zalo) - Zalo Bot API; Vietnam'ın popüler mesajlaşma uygulaması (resmî plugin).
- [Zalo ClawBot](/tr/channels/zaloclawbot) - QR ile oturum açma üzerinden kişisel Zalo asistanı; sahibine bağlıdır (harici plugin).
- [Zalo Personal](/tr/channels/zalouser) - QR ile oturum açma üzerinden kişisel Zalo hesabı (resmî plugin).

## İletim notları

- `![alt](url)` gibi Markdown resim söz dizimi içeren Telegram yanıtları,
  mümkün olduğunda son giden iletim yolunda medya yanıtlarına dönüştürülür.
- Slack'teki çok kişili doğrudan mesajlar grup sohbetleri olarak yönlendirilir; bu nedenle grup ilkeleri, bahsetme
  davranışı ve grup oturumu kuralları MPIM görüşmeleri için geçerlidir.
- WhatsApp kurulumu gerektiğinde yapılır: ilk yapılandırma, plugin paketi
  kurulmadan önce kurulum akışını gösterebilir ve Gateway, harici
  ClawHub/npm plugin'ini yalnızca kanal gerçekten etkin olduğunda yükler.
- Bot tarafından oluşturulan gelen mesajları kabul eden kanallar, bot çiftlerinin
  birbirlerine süresiz olarak yanıt vermesini önlemek için paylaşılan
  [bot döngüsü korumasını](/tr/channels/bot-loop-protection) kullanabilir.
- Desteklenen sürekli etkin odalar, bahsedilmeden gerçekleşen oda sohbetlerinin,
  ajan `message` aracıyla gönderim yapmadığı sürece sessiz bağlama dönüşmesi için
  [ortam oda olaylarını](/tr/channels/ambient-room-events) kullanabilir.

## Notlar

- Kanallar aynı anda çalışabilir; birden fazla kanal yapılandırdığınızda OpenClaw her sohbeti uygun şekilde yönlendirir.
- En hızlı kurulum genellikle **Telegram**'dır (basit bot belirteci, plugin kurulumu gerekmez). WhatsApp
  QR eşleştirmesi gerektirir ve diskte daha fazla durum bilgisi depolar.
- Grup davranışı kanala göre değişir; bkz. [Gruplar](/tr/channels/groups).
- Güvenlik için doğrudan mesaj eşleştirmesi ve izin listeleri uygulanır; bkz. [Güvenlik](/tr/gateway/security).
- Sorun giderme: [Kanal sorunlarını giderme](/tr/channels/troubleshooting).
- Model sağlayıcıları ayrı olarak belgelenmiştir; bkz. [Model Sağlayıcıları](/tr/providers/models).
