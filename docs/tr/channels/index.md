---
read_when:
    - OpenClaw için bir sohbet kanalı seçmek istiyorsunuz
    - Desteklenen mesajlaşma platformlarına hızlı bir genel bakışa ihtiyacınız var
summary: OpenClaw'ın bağlanabileceği mesajlaşma platformları
title: Sohbet Kanalları
x-i18n:
    generated_at: "2026-04-05T13:43:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 246ee6f16aebe751241f00102bb435978ed21f6158385aff5d8e222e30567416
    source_path: channels/index.md
    workflow: 15
---

# Sohbet Kanalları

OpenClaw, zaten kullandığınız herhangi bir sohbet uygulamasında sizinle konuşabilir. Her kanal Gateway üzerinden bağlanır.
Metin her yerde desteklenir; medya ve tepkiler kanala göre değişir.

## Desteklenen kanallar

- [BlueBubbles](/channels/bluebubbles) — **iMessage için önerilir**; tam özellik desteğiyle BlueBubbles macOS sunucusu REST API'sini kullanır (paketlenmiş eklenti; düzenleme, geri gönderme iptali, efektler, tepkiler, grup yönetimi — düzenleme şu anda macOS 26 Tahoe'da bozuk).
- [Discord](/channels/discord) — Discord Bot API + Gateway; sunucuları, kanalları ve DM'leri destekler.
- [Feishu](/channels/feishu) — WebSocket üzerinden Feishu/Lark botu (paketlenmiş eklenti).
- [Google Chat](/channels/googlechat) — HTTP webhook üzerinden Google Chat API uygulaması.
- [iMessage (legacy)](/channels/imessage) — imsg CLI üzerinden eski macOS entegrasyonu (kullanımdan kaldırıldı, yeni kurulumlar için BlueBubbles kullanın).
- [IRC](/channels/irc) — Klasik IRC sunucuları; eşleştirme/izin listesi denetimleriyle kanallar + DM'ler.
- [LINE](/channels/line) — LINE Messaging API botu (paketlenmiş eklenti).
- [Matrix](/channels/matrix) — Matrix protokolü (paketlenmiş eklenti).
- [Mattermost](/channels/mattermost) — Bot API + WebSocket; kanallar, gruplar, DM'ler (paketlenmiş eklenti).
- [Microsoft Teams](/channels/msteams) — Bot Framework; kurumsal destek (paketlenmiş eklenti).
- [Nextcloud Talk](/channels/nextcloud-talk) — Nextcloud Talk üzerinden self-hosted sohbet (paketlenmiş eklenti).
- [Nostr](/channels/nostr) — NIP-04 üzerinden merkeziyetsiz DM'ler (paketlenmiş eklenti).
- [QQ Bot](/channels/qqbot) — QQ Bot API; özel sohbet, grup sohbeti ve zengin medya (paketlenmiş eklenti).
- [Signal](/channels/signal) — signal-cli; gizlilik odaklı.
- [Slack](/channels/slack) — Bolt SDK; çalışma alanı uygulamaları.
- [Synology Chat](/channels/synology-chat) — giden+gelen webhook'lar üzerinden Synology NAS Chat (paketlenmiş eklenti).
- [Telegram](/channels/telegram) — grammY üzerinden Bot API; grupları destekler.
- [Tlon](/channels/tlon) — Urbit tabanlı mesajlaşma uygulaması (paketlenmiş eklenti).
- [Twitch](/channels/twitch) — IRC bağlantısı üzerinden Twitch sohbeti (paketlenmiş eklenti).
- [Voice Call](/plugins/voice-call) — Plivo veya Twilio üzerinden telefon görüşmesi (eklenti, ayrı olarak yüklenir).
- [WebChat](/web/webchat) — WebSocket üzerinden Gateway WebChat kullanıcı arayüzü.
- [WeChat](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin) — QR oturumu açma üzerinden Tencent iLink Bot eklentisi; yalnızca özel sohbetler.
- [WhatsApp](/channels/whatsapp) — En popüler; Baileys kullanır ve QR eşleştirmesi gerektirir.
- [Zalo](/channels/zalo) — Zalo Bot API; Vietnam'ın popüler mesajlaşma uygulaması (paketlenmiş eklenti).
- [Zalo Personal](/channels/zalouser) — QR oturumu açma üzerinden kişisel Zalo hesabı (paketlenmiş eklenti).

## Notlar

- Kanallar eşzamanlı olarak çalışabilir; birden fazlasını yapılandırın, OpenClaw sohbet başına yönlendirme yapacaktır.
- En hızlı kurulum genellikle **Telegram**'dır (basit bot belirteci). WhatsApp, QR eşleştirmesi gerektirir ve
  diskte daha fazla durum depolar.
- Grup davranışı kanala göre değişir; bkz. [Gruplar](/channels/groups).
- DM eşleştirmesi ve izin listeleri güvenlik için zorunlu kılınır; bkz. [Güvenlik](/gateway/security).
- Sorun giderme: [Kanal sorun giderme](/channels/troubleshooting).
- Model sağlayıcıları ayrı olarak belgelenmiştir; bkz. [Model Sağlayıcıları](/providers/models).
