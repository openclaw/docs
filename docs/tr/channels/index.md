---
read_when:
    - OpenClaw için bir sohbet kanalı seçmek istiyorsunuz
    - Desteklenen mesajlaşma platformlarına hızlı bir genel bakışa ihtiyacınız var
summary: OpenClaw'un bağlanabildiği mesajlaşma platformları
title: Sohbet kanalları
x-i18n:
    generated_at: "2026-07-16T16:49:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 102ad190f5bdb61fb3610985948e022f03fd54598ed4889da7a443ec0a2bdef3
    source_path: channels/index.md
    workflow: 16
---

OpenClaw, hâlihazırda kullandığınız herhangi bir sohbet uygulamasında sizinle iletişim kurabilir. Her kanal Gateway üzerinden bağlanır.
Metin her yerde desteklenir; medya ve tepkiler kanala göre değişir.

iMessage, Telegram ve WebChat kullanıcı arayüzü çekirdek kurulumla birlikte gelir. "Resmî plugin" olarak işaretlenen kanallar
tek bir komutla (`openclaw plugins install @openclaw/<id>`)
veya `openclaw onboard` / `openclaw channels add` sırasında isteğe bağlı olarak kurulur, ardından Gateway'in
yeniden başlatılması gerekir. "Harici plugin" kanalları OpenClaw deposunun dışında sürdürülür.

## Desteklenen kanallar

- [Discord](/tr/channels/discord) - Discord Bot API + Gateway; sunucuları, kanalları ve DM'leri destekler (resmî plugin).
- [Feishu](/tr/channels/feishu) - WebSocket üzerinden Feishu/Lark botu (resmî plugin).
- [Google Chat](/tr/channels/googlechat) - HTTP webhook üzerinden Google Chat API uygulaması (resmî plugin).
- [iMessage](/tr/channels/imessage) - Çekirdeğe dahildir. Oturum açılmış bir Mac'te `imsg` köprüsü (veya Gateway başka bir yerde çalıştığında SSH sarmalayıcısı) üzerinden yerel macOS entegrasyonu; yanıtlar, tapback'ler, efektler, ekler ve grup yönetimi için özel API eylemlerini de içerir.
- [IRC](/tr/channels/irc) - Klasik IRC sunucuları; eşleştirme/izin verilenler listesi denetimleriyle kanallar + DM'ler (resmî plugin).
- [LINE](/tr/channels/line) - LINE Messaging API botu (resmî plugin).
- [Matrix](/tr/channels/matrix) - Matrix protokolü (resmî plugin).
- [Mattermost](/tr/channels/mattermost) - Bot API + WebSocket; kanallar, gruplar, DM'ler (resmî plugin).
- [Microsoft Teams](/tr/channels/msteams) - Bot Framework; kurumsal destek (resmî plugin).
- [Nextcloud Talk](/tr/channels/nextcloud-talk) - Nextcloud Talk üzerinden kendi sunucunuzda barındırılan sohbet (resmî plugin).
- [Nostr](/tr/channels/nostr) - NIP-04 üzerinden merkeziyetsiz DM'ler (resmî plugin).
- [QQ Bot](/tr/channels/qqbot) - QQ Bot API; özel sohbet, grup sohbeti ve zengin medya (resmî plugin).
- [Reef](/tr/channels/reef) - Farklı kişilere ait OpenClaw ajanları arasında korumalı, uçtan uca şifrelenmiş, claw'dan claw'a mesajlaşma (paketle gelen plugin).
- [Raft](/tr/channels/raft) - İnsan ve ajan iş birliği için Raft CLI uyandırma köprüsü (resmî plugin).
- [Signal](/tr/channels/signal) - signal-cli; gizlilik odaklı (resmî plugin).
- [Slack](/tr/channels/slack) - Bolt SDK; çalışma alanı uygulamaları (resmî plugin).
- [SMS](/tr/channels/sms) - Gateway webhook üzerinden Twilio destekli SMS (resmî plugin).
- [Synology Chat](/tr/channels/synology-chat) - Giden+gelen webhook'lar üzerinden Synology NAS Chat (resmî plugin).
- [Telegram](/tr/channels/telegram) - Çekirdeğe dahildir. grammY üzerinden Bot API; grupları destekler.
- [Tlon](/tr/channels/tlon) - Urbit tabanlı mesajlaşma uygulaması (resmî plugin).
- [Twitch](/tr/channels/twitch) - IRC bağlantısı üzerinden Twitch sohbeti (resmî plugin).
- [Sesli Arama](/tr/plugins/voice-call) - Plivo, Telnyx veya Twilio üzerinden telefon hizmeti (resmî plugin).
- [WebChat](/tr/web/webchat) - Çekirdeğe dahildir. WebSocket üzerinden Gateway WebChat kullanıcı arayüzü.
- [WeChat](/tr/channels/wechat) - QR ile oturum açma üzerinden Tencent iLink botu; yalnızca özel sohbetler (harici plugin).
- [WhatsApp](/tr/channels/whatsapp) - En popüler seçenek; Baileys kullanır ve QR eşleştirmesi gerektirir (resmî plugin).
- [Yuanbao](/tr/channels/yuanbao) - Tencent Yuanbao botu (harici plugin).
- [Zalo](/tr/channels/zalo) - Zalo Bot API; Vietnam'ın popüler mesajlaşma uygulaması (resmî plugin).
- [Zalo ClawBot](/tr/channels/zaloclawbot) - QR ile oturum açma üzerinden kişisel Zalo asistanı; sahibine bağlıdır (harici plugin).
- [Zalo Personal](/tr/channels/zalouser) - QR ile oturum açma üzerinden kişisel Zalo hesabı (resmî plugin).

## Teslimat notları

- `![alt](url)` gibi markdown görsel söz dizimi içeren Telegram yanıtları,
  mümkün olduğunda son giden ileti yolunda medya yanıtlarına dönüştürülür.
- Slack çok kişili DM'leri grup sohbetleri olarak yönlendirilir; bu nedenle grup politikası, bahsetme
  davranışı ve grup oturumu kuralları MPIM konuşmalarına uygulanır.
- WhatsApp kurulumu isteğe bağlı kurulum şeklindedir: ilk katılım, plugin paketi
  kurulmadan önce kurulum akışını gösterebilir ve Gateway, harici
  ClawHub/npm plugin'ini yalnızca kanal gerçekten etkin olduğunda yükler.
- Bot tarafından oluşturulan gelen mesajları kabul eden kanallar, bot çiftlerinin
  birbirlerine süresiz olarak yanıt vermesini önlemek için paylaşılan
  [bot döngüsü korumasını](/tr/channels/bot-loop-protection) kullanabilir.
- Desteklenen sürekli etkin odalar, ajandan bahsedilmeyen oda sohbetlerinin, ajan
  `message` aracıyla gönderim yapmadığı sürece sessiz bağlama dönüşmesi için
  [ortam odası olaylarını](/tr/channels/ambient-room-events) kullanabilir.

## Notlar

- Kanallar aynı anda çalışabilir; birden fazla kanal yapılandırıldığında OpenClaw her sohbet için uygun yönlendirmeyi yapar.
- En hızlı kurulum genellikle **Telegram**'dır (basit bot token'ı, plugin kurulumu yoktur). WhatsApp
  QR eşleştirmesi gerektirir ve diskte daha fazla durum saklar.
- Grup davranışı kanala göre değişir; bkz. [Gruplar](/tr/channels/groups).
- Güvenlik için DM eşleştirmesi ve izin verilenler listeleri zorunlu tutulur; bkz. [Güvenlik](/tr/gateway/security).
- Sorun giderme: [Kanal sorunlarını giderme](/tr/channels/troubleshooting).
- Model sağlayıcıları ayrı olarak belgelenmiştir; bkz. [Model Sağlayıcıları](/tr/providers/models).
