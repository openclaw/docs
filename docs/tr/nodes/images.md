---
read_when:
    - Medya işlem hattını veya ekleri değiştirme
summary: Gönderim, Gateway ve ajan yanıtları için görüntü ve medya işleme kuralları
title: Görsel ve medya desteği
x-i18n:
    generated_at: "2026-04-30T09:30:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1eb07bc638a755be5597e78c07041a52cfc0297b00d70c5adbfe5f3ad8c1a372
    source_path: nodes/images.md
    workflow: 16
---

# Görsel ve Medya Desteği (2025-12-05)

WhatsApp kanalı **Baileys Web** üzerinden çalışır. Bu belge, gönderim, Gateway ve ajan yanıtları için geçerli medya işleme kurallarını özetler.

## Hedefler

- `openclaw message send --media` ile isteğe bağlı açıklamalı medya gönderin.
- Web gelen kutusundan gelen otomatik yanıtların metnin yanında medya içermesine izin verin.
- Tür başına sınırları makul ve öngörülebilir tutun.

## CLI Yüzeyi

- `openclaw message send --media <path-or-url> [--message <caption>]`
  - `--media` isteğe bağlıdır; yalnızca medya gönderimleri için açıklama boş olabilir.
  - `--dry-run` çözümlenen yükü yazdırır; `--json`, `{ channel, to, messageId, mediaUrl, caption }` çıktısı verir.

## WhatsApp Web kanalı davranışı

- Girdi: yerel dosya yolu **veya** HTTP(S) URL'si.
- Akış: bir Buffer'a yükle, medya türünü algıla ve doğru yükü oluştur:
  - **Görseller:** `channels.whatsapp.mediaMaxMb` hedeflenerek (varsayılan: 50 MB) JPEG'e yeniden boyutlandırılır ve yeniden sıkıştırılır (en uzun kenar en fazla 2048px).
  - **Ses/Sesli/Video:** 16 MB'a kadar olduğu gibi aktarılır; ses, sesli not olarak gönderilir (`ptt: true`).
  - **Belgeler:** diğer her şey, 100 MB'a kadar, varsa dosya adı korunarak.
- WhatsApp GIF tarzı oynatma: mobil istemcilerin satır içinde döngüye alması için `gifPlayback: true` ile bir MP4 gönderin (CLI: `--gif-playback`).
- MIME algılama önce sihirli baytları, ardından başlıkları, ardından dosya uzantısını tercih eder.
- Açıklama `--message` veya `reply.text` üzerinden gelir; boş açıklamaya izin verilir.
- Günlükleme: ayrıntılı olmayan mod `↩️`/`✅` gösterir; ayrıntılı mod boyutu ve kaynak yolu/URL'sini içerir.

## Otomatik Yanıt İş Hattı

- `getReplyFromConfig`, `{ text?, mediaUrl?, mediaUrls? }` döndürür.
- Medya mevcut olduğunda web göndericisi, yerel yolları veya URL'leri `openclaw message send` ile aynı iş hattını kullanarak çözümler.
- Sağlanırsa birden çok medya girdisi sırayla gönderilir.

## Komutlara gelen medya (Pi)

- Gelen web mesajları medya içerdiğinde OpenClaw bir geçici dosyaya indirir ve şablon değişkenlerini kullanıma açar:
  - Gelen medya için `{{MediaUrl}}` sözde URL'si.
  - Komutu çalıştırmadan önce yazılan yerel geçici yol `{{MediaPath}}`.
- Oturum başına Docker korumalı alanı etkinleştirildiğinde, gelen medya korumalı alan çalışma alanına kopyalanır ve `MediaPath`/`MediaUrl`, `media/inbound/<filename>` gibi göreli bir yola yeniden yazılır.
- Medya anlama (`tools.media.*` veya paylaşılan `tools.media.models` üzerinden yapılandırıldıysa) şablonlamadan önce çalışır ve `Body` içine `[Image]`, `[Audio]` ve `[Video]` blokları ekleyebilir.
  - Ses, `{{Transcript}}` değerini ayarlar ve eğik çizgi komutlarının çalışmaya devam etmesi için komut ayrıştırmada transkripti kullanır.
  - Video ve görsel açıklamaları, komut ayrıştırma için varsa açıklama metnini korur.
  - Etkin birincil görsel modeli zaten yerel olarak görmeyi destekliyorsa OpenClaw, `[Image]` özet bloğunu atlar ve bunun yerine özgün görseli modele geçirir.
- Varsayılan olarak yalnızca ilk eşleşen görsel/ses/video eki işlenir; birden çok eki işlemek için `tools.media.<cap>.attachments` ayarlayın.

## Sınırlar ve Hatalar

**Giden gönderim sınırları (WhatsApp web gönderimi)**

- Görseller: yeniden sıkıştırmadan sonra `channels.whatsapp.mediaMaxMb` değerine kadar (varsayılan: 50 MB).
- Ses/sesli/video: 16 MB sınırı; belgeler: 100 MB sınırı.
- Aşırı büyük veya okunamayan medya → günlüklerde açık hata ve yanıt atlanır.

**Medya anlama sınırları (transkripsiyon/açıklama)**

- Görsel varsayılanı: 10 MB (`tools.media.image.maxBytes`).
- Ses varsayılanı: 20 MB (`tools.media.audio.maxBytes`).
- Video varsayılanı: 50 MB (`tools.media.video.maxBytes`).
- Aşırı büyük medya anlamayı atlar, ancak yanıtlar özgün gövdeyle yine de gönderilir.

## Testler İçin Notlar

- Görsel/ses/belge durumları için gönderim + yanıt akışlarını kapsayın.
- Görseller için yeniden sıkıştırmayı (boyut sınırı) ve ses için sesli not bayrağını doğrulayın.
- Çoklu medya yanıtlarının sıralı gönderimler olarak yayıldığından emin olun.

## İlgili

- [Kamera yakalama](/tr/nodes/camera)
- [Medya anlama](/tr/nodes/media-understanding)
- [Ses ve sesli notlar](/tr/nodes/audio)
