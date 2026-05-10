---
read_when:
    - OpenClaw için bir sohbet kanalı seçmek istiyorsunuz
    - Desteklenen mesajlaşma platformlarına hızlı bir genel bakışa ihtiyacınız var
summary: OpenClaw'ın bağlanabileceği mesajlaşma platformları
title: Sohbet kanalları
x-i18n:
    generated_at: "2026-05-10T19:22:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 57ae81a99d265abbf3f9f016506e787d66b4f6984d833e43e7a8554e157a3c17
    source_path: channels/index.md
    workflow: 16
---

OpenClaw, zaten kullandığınız herhangi bir sohbet uygulamasında sizinle konuşabilir. Her kanal Gateway üzerinden bağlanır.
Metin her yerde desteklenir; medya ve tepkiler kanala göre değişir.

## Teslim notları

- `![alt](url)` gibi markdown görsel söz dizimi içeren Telegram yanıtları,
  mümkün olduğunda son giden yolda medya yanıtlarına dönüştürülür.
- Slack çok kişili DM'leri grup sohbetleri olarak yönlendirilir; bu nedenle grup ilkesi, bahsetme
  davranışı ve grup oturumu kuralları MPIM konuşmaları için geçerlidir.
- WhatsApp kurulumu isteğe bağlı yüklemedir: katılım akışı, Plugin paketi yüklenmeden önce
  kurulum akışını gösterebilir ve Gateway, WhatsApp runtime'ını
  yalnızca kanal gerçekten etkin olduğunda yükler.

## Desteklenen kanallar

- [Discord](/tr/channels/discord) - Discord Bot API + Gateway; sunucuları, kanalları ve DM'leri destekler.
- [Feishu](/tr/channels/feishu) - WebSocket üzerinden Feishu/Lark botu (paketlenmiş Plugin).
- [Google Chat](/tr/channels/googlechat) - HTTP Webhook üzerinden Google Chat API uygulaması (indirilebilir Plugin).
- [iMessage](/tr/channels/imessage) - Oturum açılmış bir Mac'te `imsg` köprüsü üzerinden yerel macOS entegrasyonu (veya Gateway başka yerde çalışıyorsa SSH sarmalayıcısı); yanıtlar, tapback'ler, efektler, ekler ve grup yönetimi için özel API eylemleri dahil. Ana makine izinleri ve Messages erişimi uygun olduğunda yeni OpenClaw iMessage kurulumları için tercih edilir.
- [IRC](/tr/channels/irc) - Klasik IRC sunucuları; eşleştirme/izin listesi kontrolleriyle kanallar + DM'ler.
- [LINE](/tr/channels/line) - LINE Messaging API botu (indirilebilir Plugin).
- [Matrix](/tr/channels/matrix) - Matrix protokolü (indirilebilir Plugin).
- [Mattermost](/tr/channels/mattermost) - Bot API + WebSocket; kanallar, gruplar, DM'ler (indirilebilir Plugin).
- [Microsoft Teams](/tr/channels/msteams) - Bot Framework; kurumsal destek (paketlenmiş Plugin).
- [Nextcloud Talk](/tr/channels/nextcloud-talk) - Nextcloud Talk üzerinden kendi barındırdığınız sohbet (paketlenmiş Plugin).
- [Nostr](/tr/channels/nostr) - NIP-04 üzerinden merkeziyetsiz DM'ler (paketlenmiş Plugin).
- [QQ Bot](/tr/channels/qqbot) - QQ Bot API; özel sohbet, grup sohbeti ve zengin medya (paketlenmiş Plugin).
- [Signal](/tr/channels/signal) - signal-cli; gizlilik odaklı.
- [Slack](/tr/channels/slack) - Bolt SDK; çalışma alanı uygulamaları.
- [Synology Chat](/tr/channels/synology-chat) - Giden+gelen Webhook'lar üzerinden Synology NAS Chat (paketlenmiş Plugin).
- [Telegram](/tr/channels/telegram) - grammY üzerinden Bot API; grupları destekler.
- [Tlon](/tr/channels/tlon) - Urbit tabanlı mesajlaşma uygulaması (paketlenmiş Plugin).
- [Twitch](/tr/channels/twitch) - IRC bağlantısı üzerinden Twitch sohbeti (paketlenmiş Plugin).
- [Voice Call](/tr/plugins/voice-call) - Plivo veya Twilio üzerinden telefon hizmeti (Plugin, ayrıca yüklenir).
- [WebChat](/tr/web/webchat) - WebSocket üzerinden Gateway WebChat kullanıcı arayüzü.
- [WeChat](/tr/channels/wechat) - QR ile oturum açma üzerinden Tencent iLink Bot Plugin'i; yalnızca özel sohbetler (harici Plugin).
- [WhatsApp](/tr/channels/whatsapp) - En popüler olanı; Baileys kullanır ve QR eşleştirmesi gerektirir.
- [Yuanbao](/tr/channels/yuanbao) - Tencent Yuanbao botu (harici Plugin).
- [Zalo](/tr/channels/zalo) - Zalo Bot API; Vietnam'ın popüler mesajlaşma uygulaması (paketlenmiş Plugin).
- [Zalo Personal](/tr/channels/zalouser) - QR ile oturum açma üzerinden Zalo kişisel hesabı (paketlenmiş Plugin).

## Notlar

- Kanallar aynı anda çalışabilir; birden çok kanal yapılandırın, OpenClaw sohbet başına yönlendirme yapar.
- En hızlı kurulum genellikle **Telegram**'dır (basit bot token'ı). WhatsApp QR eşleştirmesi gerektirir ve
  diskte daha fazla durum saklar.
- Grup davranışı kanala göre değişir; bkz. [Gruplar](/tr/channels/groups).
- Güvenlik için DM eşleştirmesi ve izin listeleri uygulanır; bkz. [Güvenlik](/tr/gateway/security).
- Sorun giderme: [Kanal sorunlarını giderme](/tr/channels/troubleshooting).
- Model sağlayıcıları ayrı olarak belgelenmiştir; bkz. [Model Sağlayıcıları](/tr/providers/models).
