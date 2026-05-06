---
read_when:
    - Medya işlem hattını veya ekleri değiştirme
summary: send, Gateway ve ajan yanıtları için görüntü ve medya işleme kuralları
title: Görsel ve medya desteği
x-i18n:
    generated_at: "2026-05-06T17:58:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 069140a3ad3bade166d4576ead604b4675006a01e546672872379ce83291471c
    source_path: nodes/images.md
    workflow: 16
---

WhatsApp kanalı **Baileys Web** üzerinden çalışır. Bu belge, gönderim, Gateway ve aracı yanıtları için geçerli medya işleme kurallarını kaydeder.

## Hedefler

- `openclaw message send --media` ile isteğe bağlı başlıklar eşliğinde medya gönderin.
- Web gelen kutusundan otomatik yanıtların metnin yanında medya da içermesine izin verin.
- Tür başına sınırları makul ve öngörülebilir tutun.

## CLI Yüzeyi

- `openclaw message send --media <path-or-url> [--message <caption>]`
  - `--media` isteğe bağlıdır; yalnızca medya gönderimleri için başlık boş olabilir.
  - `--dry-run` çözümlenmiş yükü yazdırır; `--json`, `{ channel, to, messageId, mediaUrl, caption }` üretir.

## WhatsApp Web kanal davranışı

- Girdi: yerel dosya yolu **veya** HTTP(S) URL'si.
- Akış: bir Buffer içine yükleyin, medya türünü algılayın ve doğru yükü oluşturun:
  - **Görüntüler:** `channels.whatsapp.mediaMaxMb` hedeflenerek (varsayılan: 50 MB) JPEG olarak yeniden boyutlandırılır ve yeniden sıkıştırılır (maksimum kenar 2048px).
  - **Ses/Sesli/Video:** 16 MB'a kadar doğrudan geçirilir; ses, sesli not olarak gönderilir (`ptt: true`).
  - **Belgeler:** diğer her şey, mümkün olduğunda dosya adı korunarak 100 MB'a kadar.
- WhatsApp GIF tarzı oynatma: mobil istemcilerin satır içinde döngüye alması için `gifPlayback: true` ile bir MP4 gönderin (CLI: `--gif-playback`).
- MIME algılama önce sihirli baytları, sonra başlıkları, ardından dosya uzantısını tercih eder.
- Başlık `--message` veya `reply.text` içinden gelir; boş başlığa izin verilir.
- Günlükleme: ayrıntısız mod `↩️`/`✅` gösterir; ayrıntılı mod boyutu ve kaynak yolunu/URL'sini içerir.

## Otomatik Yanıt İş Hattı

- `getReplyFromConfig`, `{ text?, mediaUrl?, mediaUrls? }` döndürür.
- Medya mevcut olduğunda web göndericisi, yerel yolları veya URL'leri `openclaw message send` ile aynı iş hattını kullanarak çözümler.
- Sağlanırsa birden çok medya girdisi sırayla gönderilir.

## Komutlara gelen medya (Pi)

- Gelen web iletileri medya içerdiğinde OpenClaw geçici bir dosyaya indirir ve şablonlama değişkenlerini sunar:
  - Gelen medya için `{{MediaUrl}}` sözde URL'si.
  - Komutu çalıştırmadan önce yazılan yerel geçici yol `{{MediaPath}}`.
- Oturum başına Docker sandbox etkinleştirildiğinde, gelen medya sandbox çalışma alanına kopyalanır ve `MediaPath`/`MediaUrl`, `media/inbound/<filename>` gibi göreli bir yola yeniden yazılır.
- Medya anlama (`tools.media.*` veya paylaşılan `tools.media.models` üzerinden yapılandırıldıysa) şablonlamadan önce çalışır ve `Body` içine `[Image]`, `[Audio]` ve `[Video]` blokları ekleyebilir.
  - Ses, `{{Transcript}}` değerini ayarlar ve komut ayrıştırma için transkripti kullanır; böylece eğik çizgi komutları çalışmaya devam eder.
  - Video ve görüntü açıklamaları, komut ayrıştırma için varsa başlık metnini korur.
  - Etkin birincil görüntü modeli zaten yerel olarak görmeyi destekliyorsa OpenClaw `[Image]` özet bloğunu atlar ve bunun yerine özgün görüntüyü modele geçirir.
- Varsayılan olarak yalnızca ilk eşleşen görüntü/ses/video eki işlenir; birden çok eki işlemek için `tools.media.<cap>.attachments` ayarını belirleyin.

## Sınırlar ve hatalar

**Giden gönderim üst sınırları (WhatsApp web gönderimi)**

- Görüntüler: yeniden sıkıştırmadan sonra `channels.whatsapp.mediaMaxMb` değerine kadar (varsayılan: 50 MB).
- Ses/sesli/video: 16 MB üst sınırı; belgeler: 100 MB üst sınırı.
- Fazla büyük veya okunamayan medya → günlüklerde açık hata ve yanıt atlanır.

**Medya anlama üst sınırları (transkripsiyon/açıklama)**

- Görüntü varsayılanı: 10 MB (`tools.media.image.maxBytes`).
- Ses varsayılanı: 20 MB (`tools.media.audio.maxBytes`).
- Video varsayılanı: 50 MB (`tools.media.video.maxBytes`).
- Fazla büyük medya anlamayı atlar, ancak yanıtlar özgün gövdeyle devam eder.

## Testler İçin Notlar

- Görüntü/ses/belge durumları için gönderim + yanıt akışlarını kapsayın.
- Görüntüler için yeniden sıkıştırmayı (boyut sınırı) ve ses için sesli not bayrağını doğrulayın.
- Çoklu medya yanıtlarının ardışık gönderimler olarak yayıldığından emin olun.

## İlgili

- [Kamera yakalama](/tr/nodes/camera)
- [Medya anlama](/tr/nodes/media-understanding)
- [Ses ve sesli notlar](/tr/nodes/audio)
