---
read_when:
    - Medya işlem hattını veya ekleri değiştirme
summary: Gönderim, Gateway ve ajan yanıtları için görüntü ve medya işleme kuralları
title: Görsel ve medya desteği
x-i18n:
    generated_at: "2026-05-06T09:20:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: a38224fdf42f32fe206ad8cf3fcc3b06a078b1978d447adeb671fdb3ff4e4b32
    source_path: nodes/images.md
    workflow: 16
---

# Görüntü ve Medya Desteği (2025-12-05)

WhatsApp kanalı **Baileys Web** üzerinden çalışır. Bu belge, gönderme, Gateway ve ajan yanıtları için geçerli medya işleme kurallarını kapsar.

## Hedefler

- `openclaw message send --media` ile isteğe bağlı açıklamalı medya gönderin.
- Web gelen kutusundan otomatik yanıtların metnin yanında medya içermesine izin verin.
- Tür başına sınırları makul ve öngörülebilir tutun.

## CLI Yüzeyi

- `openclaw message send --media <path-or-url> [--message <caption>]`
  - `--media` isteğe bağlıdır; yalnızca medya gönderimleri için açıklama boş olabilir.
  - `--dry-run` çözümlenen yükü yazdırır; `--json` `{ channel, to, messageId, mediaUrl, caption }` çıktısı üretir.

## WhatsApp Web kanalı davranışı

- Girdi: yerel dosya yolu **veya** HTTP(S) URL'si.
- Akış: Bir Buffer'a yükle, medya türünü algıla ve doğru yükü oluştur:
  - **Görüntüler:** `channels.whatsapp.mediaMaxMb` hedeflenerek (varsayılan: 50 MB) JPEG'e yeniden boyutlandırılır ve yeniden sıkıştırılır (en uzun kenar en fazla 2048px).
  - **Ses/Sesli/Video:** 16 MB'a kadar doğrudan geçirilir; ses, sesli not (`ptt: true`) olarak gönderilir.
  - **Belgeler:** diğer her şey, mümkün olduğunda dosya adı korunarak 100 MB'a kadar.
- WhatsApp GIF tarzı oynatma: mobil istemcilerin satır içinde döngüye alması için `gifPlayback: true` ile bir MP4 gönderin (CLI: `--gif-playback`).
- MIME algılama önce sihirli baytları, sonra üst bilgileri, sonra dosya uzantısını tercih eder.
- Açıklama `--message` veya `reply.text` değerinden gelir; boş açıklamaya izin verilir.
- Günlükleme: ayrıntılı olmayan mod `↩️`/`✅` gösterir; ayrıntılı mod boyutu ve kaynak yolu/URL'sini içerir.

## Otomatik Yanıt İşlem Hattı

- `getReplyFromConfig`, `{ text?, mediaUrl?, mediaUrls? }` döndürür.
- Medya mevcut olduğunda web göndericisi, `openclaw message send` ile aynı işlem hattını kullanarak yerel yolları veya URL'leri çözümler.
- Sağlanırsa birden fazla medya girdisi sırayla gönderilir.

## Komutlara gelen medya (Pi)

- Gelen web mesajları medya içerdiğinde OpenClaw bunu geçici bir dosyaya indirir ve şablonlama değişkenlerini kullanıma sunar:
  - Gelen medya için `{{MediaUrl}}` sözde URL'si.
  - Komut çalıştırılmadan önce yazılan yerel geçici yol `{{MediaPath}}`.
- Oturum başına Docker korumalı alanı etkinleştirildiğinde, gelen medya korumalı alan çalışma alanına kopyalanır ve `MediaPath`/`MediaUrl`, `media/inbound/<filename>` gibi göreli bir yola yeniden yazılır.
- Medya anlama (`tools.media.*` veya paylaşılan `tools.media.models` üzerinden yapılandırılmışsa) şablonlamadan önce çalışır ve `Body` içine `[Image]`, `[Audio]` ve `[Video]` blokları ekleyebilir.
  - Ses, `{{Transcript}}` değerini ayarlar ve komut ayrıştırma için transkripti kullanır; böylece eğik çizgi komutları çalışmaya devam eder.
  - Video ve görüntü açıklamaları, komut ayrıştırma için varsa açıklama metnini korur.
  - Etkin birincil görüntü modeli görmeyi yerel olarak zaten destekliyorsa OpenClaw, `[Image]` özet bloğunu atlar ve bunun yerine özgün görüntüyü modele iletir.
- Varsayılan olarak yalnızca ilk eşleşen görüntü/ses/video eki işlenir; birden fazla eki işlemek için `tools.media.<cap>.attachments` değerini ayarlayın.

## Sınırlar ve hatalar

**Giden gönderim sınırları (WhatsApp web gönderimi)**

- Görüntüler: yeniden sıkıştırmadan sonra `channels.whatsapp.mediaMaxMb` değerine kadar (varsayılan: 50 MB).
- Ses/sesli/video: 16 MB sınırı; belgeler: 100 MB sınırı.
- Aşırı büyük veya okunamayan medya → günlüklerde açık hata ve yanıt atlanır.

**Medya anlama sınırları (transkripsiyon/açıklama)**

- Varsayılan görüntü: 10 MB (`tools.media.image.maxBytes`).
- Varsayılan ses: 20 MB (`tools.media.audio.maxBytes`).
- Varsayılan video: 50 MB (`tools.media.video.maxBytes`).
- Aşırı büyük medya anlamayı atlar, ancak yanıtlar özgün gövdeyle yine de ilerler.

## Testler İçin Notlar

- Görüntü/ses/belge durumları için gönderim + yanıt akışlarını kapsayın.
- Görüntüler için yeniden sıkıştırmayı (boyut sınırı) ve ses için sesli not bayrağını doğrulayın.
- Çoklu medya yanıtlarının sıralı gönderimler olarak yayıldığından emin olun.

## İlgili

- [Kamera yakalama](/tr/nodes/camera)
- [Medya anlama](/tr/nodes/media-understanding)
- [Ses ve sesli notlar](/tr/nodes/audio)
