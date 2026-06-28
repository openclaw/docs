---
read_when:
    - Medya işlem hattını veya ekleri değiştirme
summary: Gönderim, Gateway ve ajan yanıtları için görüntü ve medya işleme kuralları
title: Görsel ve medya desteği
x-i18n:
    generated_at: "2026-06-28T00:46:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eeee181cae2798b7d0f5dbe0331c6b09612755b4d796d98baaeaf6989955def5
    source_path: nodes/images.md
    workflow: 16
---

WhatsApp kanalı **Baileys Web** üzerinden çalışır. Bu belge, gönderme, gateway ve agent yanıtları için geçerli medya işleme kurallarını kaydeder.

## Hedefler

- `openclaw message send --media` ile isteğe bağlı altyazılarla medya gönderin.
- Web gelen kutusundan otomatik yanıtların metnin yanında medya içermesine izin verin.
- Tür başına sınırları makul ve öngörülebilir tutun.

## CLI Yüzeyi

- `openclaw message send --media <path-or-url> [--message <caption>]`
  - `--media` isteğe bağlıdır; yalnızca medya gönderimleri için altyazı boş olabilir.
  - `--dry-run` çözümlenen yükü yazdırır; `--json` `{ channel, to, messageId, mediaUrl, caption }` üretir.

## WhatsApp Web kanal davranışı

- Girdi: yerel dosya yolu **veya** HTTP(S) URL'si.
- Akış: bir Buffer içine yükleyin, medya türünü algılayın ve doğru yükü oluşturun:
  - **Görüntüler:** `channels.whatsapp.mediaMaxMb` hedeflenerek (varsayılan: 50 MB) JPEG olarak yeniden boyutlandırılır ve yeniden sıkıştırılır (en uzun kenar 2048 px).
  - **Ses/Sesli mesaj/Video:** 16 MB'a kadar doğrudan geçirilir; ses, sesli not olarak gönderilir (`ptt: true`).
  - **Belgeler:** diğer her şey, mevcut olduğunda dosya adı korunarak 100 MB'a kadar.
- WhatsApp GIF tarzı oynatma: mobil istemcilerin satır içinde döngüye alması için `gifPlayback: true` ile bir MP4 gönderin (CLI: `--gif-playback`).
- MIME algılama önce magic byte'ları, ardından başlıkları, ardından dosya uzantısını tercih eder.
- Altyazı `--message` veya `reply.text` içinden gelir; boş altyazıya izin verilir.
- Günlükleme: ayrıntısız mod `↩️`/`✅` gösterir; ayrıntılı mod boyut ve kaynak yolu/URL'sini içerir.

## Otomatik Yanıt İşlem Hattı

- `getReplyFromConfig`, `{ text?, mediaUrl?, mediaUrls? }` döndürür.
- Medya mevcut olduğunda web göndericisi, `openclaw message send` ile aynı işlem hattını kullanarak yerel yolları veya URL'leri çözümler.
- Sağlanırsa birden fazla medya girişi sırayla gönderilir.

## Gelen Medyadan Komutlara

- Gelen web mesajları medya içerdiğinde, OpenClaw geçici bir dosyaya indirir ve şablon değişkenlerini sunar:
  - Gelen medya için `{{MediaUrl}}` sözde URL'si.
  - Komutu çalıştırmadan önce yazılan yerel geçici yol `{{MediaPath}}`.
- Oturum başına Docker korumalı alanı etkinleştirildiğinde, gelen medya korumalı alan çalışma alanına kopyalanır ve `MediaPath`/`MediaUrl`, `media/inbound/<filename>` gibi göreli bir yola yeniden yazılır.
- Medya anlama (`tools.media.*` veya paylaşılan `tools.media.models` aracılığıyla yapılandırıldıysa) şablonlamadan önce çalışır ve `Body` içine `[Image]`, `[Audio]` ve `[Video]` blokları ekleyebilir.
  - Ses, `{{Transcript}}` değerini ayarlar ve eğik çizgi komutlarının çalışmaya devam etmesi için komut ayrıştırmada dökümü kullanır.
  - Video ve görüntü açıklamaları, komut ayrıştırma için varsa altyazı metnini korur.
  - Etkin birincil görüntü modeli zaten doğal olarak görmeyi destekliyorsa OpenClaw `[Image]` özet bloğunu atlar ve bunun yerine özgün görüntüyü modele geçirir.
- Varsayılan olarak yalnızca eşleşen ilk görüntü/ses/video eki işlenir; birden fazla eki işlemek için `tools.media.<cap>.attachments` ayarlayın.

## Sınırlar ve hatalar

**Giden gönderim sınırları (WhatsApp web gönderimi)**

- Görüntüler: yeniden sıkıştırmadan sonra `channels.whatsapp.mediaMaxMb` değerine kadar (varsayılan: 50 MB).
- Ses/sesli mesaj/video: 16 MB sınırı; belgeler: 100 MB sınırı.
- Aşırı büyük veya okunamayan medya → günlüklerde açık hata ve yanıt atlanır.

**Medya anlama sınırları (döküm/açıklama)**

- Görüntü varsayılanı: 10 MB (`tools.media.image.maxBytes`).
- Ses varsayılanı: 20 MB (`tools.media.audio.maxBytes`).
- Video varsayılanı: 50 MB (`tools.media.video.maxBytes`).
- Aşırı büyük medya anlamayı atlar, ancak yanıtlar özgün gövdeyle yine de ilerler.

## Testler İçin Notlar

- Görüntü/ses/belge durumları için gönderme + yanıt akışlarını kapsayın.
- Görüntüler için yeniden sıkıştırmayı (boyut sınırı) ve ses için sesli not bayrağını doğrulayın.
- Çok medyalı yanıtların sırayla gönderimler olarak yayıldığından emin olun.

## İlgili

- [Kamera yakalama](/tr/nodes/camera)
- [Medya anlama](/tr/nodes/media-understanding)
- [Ses ve sesli notlar](/tr/nodes/audio)
