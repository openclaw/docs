---
read_when:
    - Medya ardışık düzenini veya ekleri değiştirme
summary: Gönderme, Gateway ve ajan yanıtları için görsel ve medya işleme kuralları
title: Görsel ve medya desteği
x-i18n:
    generated_at: "2026-04-24T09:17:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 26fa460f7dcdac9f15c9d79c3c3370adbce526da5cfa9a6825a8ed20b41e0a29
    source_path: nodes/images.md
    workflow: 15
---

# Görsel ve Medya Desteği (2025-12-05)

WhatsApp kanalı **Baileys Web** üzerinden çalışır. Bu belge, gönderme, Gateway ve ajan yanıtları için geçerli medya işleme kurallarını kapsar.

## Hedefler

- `openclaw message send --media` ile isteğe bağlı açıklama metniyle medya gönderin.
- Web gelen kutusundan otomatik yanıtların metnin yanında medya da içermesine izin verin.
- Tür başına sınırları makul ve öngörülebilir tutun.

## CLI yüzeyi

- `openclaw message send --media <path-or-url> [--message <caption>]`
  - `--media` isteğe bağlıdır; yalnızca medya gönderimleri için açıklama metni boş olabilir.
  - `--dry-run` çözümlenmiş yükü yazdırır; `--json` ise `{ channel, to, messageId, mediaUrl, caption }` üretir.

## WhatsApp Web kanalı davranışı

- Girdi: yerel dosya yolu **veya** HTTP(S) URL'si.
- Akış: bir Buffer içine yükle, medya türünü algıla ve doğru yükü oluştur:
  - **Görseller:** JPEG'e yeniden boyutlandır ve yeniden sıkıştır (en uzun kenar 2048px) ve `channels.whatsapp.mediaMaxMb` değerini hedefle (varsayılan: 50 MB).
  - **Ses/Sesli not/Video:** 16 MB'ye kadar doğrudan geçiş; ses, sesli not olarak gönderilir (`ptt: true`).
  - **Belgeler:** mevcutsa dosya adı korunarak, diğer her şey 100 MB'ye kadar.
- WhatsApp GIF tarzı oynatma: mobil istemcilerde satır içinde döngü yapması için `gifPlayback: true` ile bir MP4 gönderin (CLI: `--gif-playback`).
- MIME algılama öncelikle magic bytes, sonra üstbilgiler, sonra dosya uzantısını kullanır.
- Açıklama metni `--message` veya `reply.text` içinden gelir; boş açıklama metnine izin verilir.
- Günlükleme: ayrıntılı olmayan mod `↩️`/`✅` gösterir; ayrıntılı mod boyut ve kaynak yol/URL bilgisini içerir.

## Otomatik Yanıt Ardışık Düzeni

- `getReplyFromConfig`, `{ text?, mediaUrl?, mediaUrls? }` döndürür.
- Medya mevcut olduğunda web göndericisi, yerel yolları veya URL'leri `openclaw message send` ile aynı ardışık düzeni kullanarak çözümler.
- Birden çok medya girdisi sağlanmışsa bunlar sıralı olarak gönderilir.

## Komutlara Gelen Medya (Pi)

- Gelen web mesajları medya içerdiğinde OpenClaw bunu geçici bir dosyaya indirir ve şu şablon değişkenlerini açığa çıkarır:
  - Gelen medya için sahte URL olan `{{MediaUrl}}`.
  - Komut çalıştırılmadan önce yazılan yerel geçici yol olan `{{MediaPath}}`.
- Oturum başına Docker sandbox etkinse, gelen medya sandbox çalışma alanına kopyalanır ve `MediaPath`/`MediaUrl`, `media/inbound/<filename>` gibi göreli bir yola yeniden yazılır.
- Medya anlama (`tools.media.*` veya paylaşılan `tools.media.models` ile yapılandırılmışsa) şablonlamadan önce çalışır ve `Body` içine `[Image]`, `[Audio]` ve `[Video]` blokları ekleyebilir.
  - Ses, `{{Transcript}}` ayarlar ve komut ayrıştırma için transkripti kullanır; böylece slash komutları çalışmaya devam eder.
  - Video ve görsel açıklamaları, komut ayrıştırma için açıklama metnini korur.
  - Etkin birincil görsel model zaten yerel olarak vision destekliyorsa OpenClaw `[Image]` özet bloğunu atlar ve özgün görseli doğrudan modele geçirir.
- Varsayılan olarak yalnızca eşleşen ilk görsel/ses/video eki işlenir; birden çok eki işlemek için `tools.media.<cap>.attachments` ayarlayın.

## Sınırlar ve Hatalar

**Giden gönderim sınırları (WhatsApp web send)**

- Görseller: yeniden sıkıştırmadan sonra `channels.whatsapp.mediaMaxMb` değerine kadar (varsayılan: 50 MB).
- Ses/sesli not/video: 16 MB sınırı; belgeler: 100 MB sınırı.
- Aşırı büyük veya okunamayan medya → günlüklerde açık hata ve yanıt atlanır.

**Medya anlama sınırları (transkripsiyon/açıklama)**

- Görsel varsayılanı: 10 MB (`tools.media.image.maxBytes`).
- Ses varsayılanı: 20 MB (`tools.media.audio.maxBytes`).
- Video varsayılanı: 50 MB (`tools.media.video.maxBytes`).
- Aşırı büyük medya anlama aşamasını atlar, ancak yanıtlar özgün gövdeyle yine de devam eder.

## Testler için notlar

- Görsel/ses/belge durumları için gönderme + yanıt akışlarını kapsayın.
- Görseller için yeniden sıkıştırmayı (boyut sınırı) ve ses için sesli not bayrağını doğrulayın.
- Çoklu medya yanıtlarının sıralı gönderimler olarak dağıldığından emin olun.

## İlgili

- [Kamera yakalama](/tr/nodes/camera)
- [Medya anlama](/tr/nodes/media-understanding)
- [Ses ve sesli notlar](/tr/nodes/audio)
