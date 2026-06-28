---
read_when:
    - OpenClaw için bir sohbet kanalı seçmek istiyorsunuz
    - Desteklenen mesajlaşma platformlarına hızlı bir genel bakışa ihtiyacınız var
summary: OpenClaw'un bağlanabileceği mesajlaşma platformları
title: Sohbet kanalları
x-i18n:
    generated_at: "2026-06-28T00:12:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3ff3e59df21d71f0d80eff2a6299169bfeb15964834a552f3c4c1d5b7c144b8d
    source_path: channels/index.md
    workflow: 16
---

OpenClaw, zaten kullandığınız herhangi bir sohbet uygulamasında sizinle konuşabilir. Her kanal Gateway üzerinden bağlanır.
Metin her yerde desteklenir; medya ve tepkiler kanala göre değişir.

## Teslim notları

- `![alt](url)` gibi markdown görüntü söz dizimi içeren Telegram yanıtları,
  mümkün olduğunda son giden yolda medya yanıtlarına dönüştürülür.
- Slack çok kişili DM'leri grup sohbetleri olarak yönlendirilir; bu nedenle grup politikası, bahsetme
  davranışı ve grup oturumu kuralları MPIM konuşmaları için geçerlidir.
- WhatsApp kurulumu isteğe bağlı yükleme şeklindedir: ilk katılım, Plugin paketi yüklenmeden önce
  kurulum akışını gösterebilir ve Gateway, dış
  ClawHub/npm Plugin'ini yalnızca kanal gerçekten etkinken yükler.
- Bot tarafından yazılmış gelen iletileri kabul eden kanallar, bot çiftlerinin
  süresiz olarak birbirine yanıt vermesini önlemek için paylaşılan
  [bot döngüsü korumasını](/tr/channels/bot-loop-protection) kullanabilir.
- Desteklenen her zaman açık odalar, bahsedilmeyen oda konuşmalarının, ajan
  `message` aracıyla göndermedikçe sessiz bağlama dönüşmesi için
  [ortam odası olaylarını](/tr/channels/ambient-room-events) kullanabilir.

## Desteklenen kanallar

- [Discord](/tr/channels/discord) - Discord Bot API + Gateway; sunucuları, kanalları ve DM'leri destekler.
- [Feishu](/tr/channels/feishu) - WebSocket üzerinden Feishu/Lark botu (paketli Plugin).
- [Google Chat](/tr/channels/googlechat) - HTTP webhook üzerinden Google Chat API uygulaması (indirilebilir Plugin).
- [iMessage](/tr/channels/imessage) - Oturum açılmış bir Mac'te `imsg` köprüsü üzerinden yerel macOS entegrasyonu (veya Gateway başka yerde çalıştığında SSH sarmalayıcısı); yanıtlar, tapback'ler, efektler, ekler ve grup yönetimi için özel API eylemleri dahildir. Ana makine izinleri ve Messages erişimi uygunsa yeni OpenClaw iMessage kurulumları için tercih edilir.
- [IRC](/tr/channels/irc) - Klasik IRC sunucuları; eşleştirme/izin listesi kontrolleriyle kanallar + DM'ler.
- [LINE](/tr/channels/line) - LINE Messaging API botu (indirilebilir Plugin).
- [Matrix](/tr/channels/matrix) - Matrix protokolü (indirilebilir Plugin).
- [Mattermost](/tr/channels/mattermost) - Bot API + WebSocket; kanallar, gruplar, DM'ler (indirilebilir Plugin).
- [Microsoft Teams](/tr/channels/msteams) - Bot Framework; kurumsal destek (paketli Plugin).
- [Nextcloud Talk](/tr/channels/nextcloud-talk) - Nextcloud Talk üzerinden kendi barındırılan sohbet (paketli Plugin).
- [Nostr](/tr/channels/nostr) - NIP-04 üzerinden merkeziyetsiz DM'ler (paketli Plugin).
- [QQ Bot](/tr/channels/qqbot) - QQ Bot API; özel sohbet, grup sohbeti ve zengin medya (paketli Plugin).
- [Raft](/tr/channels/raft) - İnsan ve ajan iş birliği için Raft CLI uyandırma köprüsü (dış Plugin).
- [Signal](/tr/channels/signal) - signal-cli; gizlilik odaklı.
- [Slack](/tr/channels/slack) - Bolt SDK; çalışma alanı uygulamaları.
- [SMS](/tr/channels/sms) - Gateway webhook üzerinden Twilio destekli SMS (resmi Plugin).
- [Synology Chat](/tr/channels/synology-chat) - Giden+gelen webhook'lar üzerinden Synology NAS Chat (paketli Plugin).
- [Telegram](/tr/channels/telegram) - grammY üzerinden Bot API; grupları destekler.
- [Tlon](/tr/channels/tlon) - Urbit tabanlı mesajlaşma uygulaması (paketli Plugin).
- [Twitch](/tr/channels/twitch) - IRC bağlantısı üzerinden Twitch sohbeti (paketli Plugin).
- [Voice Call](/tr/plugins/voice-call) - Plivo veya Twilio üzerinden telefon görüşmesi (Plugin, ayrı yüklenir).
- [WebChat](/tr/web/webchat) - WebSocket üzerinden Gateway WebChat kullanıcı arayüzü.
- [WeChat](/tr/channels/wechat) - QR oturum açma ile Tencent iLink Bot Plugin'i; yalnızca özel sohbetler (dış Plugin).
- [WhatsApp](/tr/channels/whatsapp) - En popüler; Baileys kullanır ve QR eşleştirmesi gerektirir.
- [Yuanbao](/tr/channels/yuanbao) - Tencent Yuanbao botu (dış Plugin).
- [Zalo](/tr/channels/zalo) - Zalo Bot API; Vietnam'ın popüler mesajlaşma uygulaması (paketli Plugin).
- [Zalo ClawBot](/tr/channels/zaloclawbot) - QR oturum açma ile kişisel Zalo asistanı; sahibe bağlı (dış Plugin).
- [Zalo Personal](/tr/channels/zalouser) - QR oturum açma ile Zalo kişisel hesabı (paketli Plugin).

## Notlar

- Kanallar aynı anda çalışabilir; birden fazlasını yapılandırın, OpenClaw sohbet başına yönlendirme yapar.
- En hızlı kurulum genellikle **Telegram**'dır (basit bot belirteci). WhatsApp QR eşleştirmesi gerektirir ve
  diskte daha fazla durum depolar.
- Grup davranışı kanala göre değişir; bkz. [Gruplar](/tr/channels/groups).
- Güvenlik için DM eşleştirmesi ve izin listeleri zorunlu tutulur; bkz. [Güvenlik](/tr/gateway/security).
- Sorun giderme: [Kanal sorun giderme](/tr/channels/troubleshooting).
- Model sağlayıcıları ayrı olarak belgelenmiştir; bkz. [Model Sağlayıcıları](/tr/providers/models).
