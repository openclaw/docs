---
read_when:
    - Eski BlueBubbles kanalını kullandınız ve iMessage'a geçmeniz gerekiyor
    - Desteklenen OpenClaw iMessage kurulumunu seçiyorsunuz
    - BlueBubbles'ın kaldırılmasıyla ilgili kısa bir açıklamaya ihtiyacınız var
summary: BlueBubbles desteği OpenClaw'dan kaldırıldı. Yeni ve taşınmış iMessage kurulumları için imsg ile birlikte gelen iMessage pluginini kullanın.
title: BlueBubbles'ın kaldırılması ve imsg iMessage yolu
x-i18n:
    generated_at: "2026-07-12T11:27:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7dec7d3f27e0df6431494d864b0c7ae7457574797e199f9a2cb6931d28feacd0
    source_path: announcements/bluebubbles-imessage.md
    workflow: 16
---

# BlueBubbles'ın kaldırılması ve imsg iMessage yolu

OpenClaw artık BlueBubbles kanalını sunmuyor. iMessage desteği, paketle birlikte gelen `imessage` Plugin'i üzerinden çalışır: Gateway, [`imsg`](https://github.com/steipete/imsg) aracını yerel olarak veya bir SSH sarmalayıcısı üzerinden alt süreç olarak başlatır ve stdin/stdout üzerinden JSON-RPC ile iletişim kurar. Sunucu, Webhook veya bağlantı noktası yoktur.

Yapılandırmanız hâlâ `channels.bluebubbles` içeriyorsa bunu `channels.imessage` biçimine geçirin. Eski `/channels/bluebubbles` dokümantasyon URL'si, eksiksiz yapılandırma dönüştürme tablosunu ve geçiş kontrol listesini içeren [BlueBubbles'dan geçiş](/tr/channels/imessage-from-bluebubbles) sayfasına yönlendirir.

## Neler değişti?

- Desteklenen iMessage yolunda BlueBubbles HTTP sunucusu, Webhook rotası, REST parolası veya BlueBubbles Plugin çalışma zamanı yoktur.
- OpenClaw, Messages.app oturumunun açık olduğu Mac'te `imsg` üzerinden Mesajlar'ı okur ve izler.
- Temel gönderme, alma, geçmiş ve medya işlevleri, standart `imsg` yüzeylerini ve macOS izinlerini kullanır.
- Gelişmiş eylemler (ileti dizili yanıtlar, tapback'ler, düzenleme, göndermeyi geri alma, efektler, okundu bilgileri, yazma göstergeleri ve grup yönetimi) özel API köprüsünü gerektirir: SIP'nin devre dışı bırakılmasını gerektiren `imsg launch` komutunu çalıştırın.
- Linux ve Windows Gateway'leri, `channels.imessage.cliPath` değerini oturumun açık olduğu Mac'te `imsg` çalıştıran bir SSH sarmalayıcısına yönlendirerek iMessage'ı kullanmaya devam edebilir.

## Yapılması gerekenler

1. Messages'ın bulunduğu Mac'e `imsg` yükleyin ve doğrulayın:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   imsg rpc --help
   ```

2. `imsg` ve OpenClaw'ı çalıştıran süreç bağlamına Tam Disk Erişimi ve Otomasyon izinlerini verin.

3. Eski yapılandırmayı dönüştürün:

   ```json5
   {
     channels: {
       imessage: {
         enabled: true,
         cliPath: "/opt/homebrew/bin/imsg",
         dmPolicy: "pairing",
         allowFrom: ["+15555550123"],
         groupPolicy: "allowlist",
         groupAllowFrom: ["+15555550123"],
         groups: {
           "*": { requireMention: true },
         },
         includeAttachments: true,
       },
     },
   }
   ```

4. Gateway'i yeniden başlatın ve doğrulayın:

   ```bash
   openclaw channels status --probe
   ```

5. Eski BlueBubbles sunucunuzu silmeden önce doğrudan mesajları, grupları, ekleri ve kullandığınız tüm özel API eylemlerini test edin.

## Geçiş notları

- `channels.bluebubbles.serverUrl` ve `channels.bluebubbles.password` için iMessage eşdeğeri yoktur; erişilecek veya kimlik doğrulaması yapılacak bir sunucu bulunmaz.
- `allowFrom`, `groupAllowFrom`, `groups`, `includeAttachments`, `attachmentRoots`, `mediaMaxMb`, `textChunkLimit` ve `actions.*`, `channels.imessage` altında aynı anlamı korur.
- `channels.imessage.includeAttachments` varsayılan olarak hâlâ kapalıdır. Gelen fotoğrafların, sesli notların, videoların veya dosyaların ajana ulaşmasını bekliyorsanız bunu açıkça ayarlayın.
- `groupPolicy: "allowlist"` kullanırken, tüm `"*"` joker karakterli girdiler dâhil olmak üzere eski `groups` bloğunu kopyalayın. Grup gönderen izin listeleri ile grup kayıt defteri ayrı denetim noktalarıdır; girdileri bulunan ancak eşleşen bir `chat_id` değeri (veya `"*"`) bulunmayan `groups` bloğu, çalışma zamanında mesajı düşürür. Boş bir `groups` bloğu ise gönderen filtrelemesi mesajların geçmesine izin vermeye devam etse bile başlangıçta bir uyarı kaydeder.
- `match.channel: "bluebubbles"` içeren ACP bağlamaları `"imessage"` olarak değiştirilmelidir.
- Eski BlueBubbles oturum anahtarları iMessage oturum anahtarlarına dönüşmez. Eşleştirme onayları gönderen tanıtıcılarını temel aldığından, kopyalanan `allowFrom` girdileri çalışmaya devam eder; ancak BlueBubbles oturum anahtarları altındaki konuşma geçmişi aktarılmaz.

## Ayrıca bkz.

- [BlueBubbles'dan geçiş](/tr/channels/imessage-from-bluebubbles)
- [iMessage](/tr/channels/imessage)
- [Yapılandırma referansı - iMessage](/tr/gateway/config-channels#imessage)
