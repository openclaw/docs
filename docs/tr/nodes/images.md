---
read_when:
    - Medya işlem hattını veya ekleri değiştirirken
summary: Gönderme, gateway ve agent yanıtları için görüntü ve medya işleme kuralları
title: Görüntü ve Medya Desteği
x-i18n:
    generated_at: "2026-04-05T13:58:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: c3bb372b45a3bae51eae03b41cb22c4cde144675a54ddfd12e01a96132e48a8a
    source_path: nodes/images.md
    workflow: 15
---

# Görüntü ve Medya Desteği (2025-12-05)

WhatsApp kanalı **Baileys Web** üzerinden çalışır. Bu belge, gönderme, gateway ve agent yanıtları için mevcut medya işleme kurallarını açıklar.

## Hedefler

- `openclaw message send --media` ile isteğe bağlı açıklama metniyle medya göndermek.
- Web gelen kutusundan gelen otomatik yanıtların metnin yanında medya da içerebilmesini sağlamak.
- Tür başına sınırları makul ve öngörülebilir tutmak.

## CLI yüzeyi

- `openclaw message send --media <path-or-url> [--message <caption>]`
  - `--media` isteğe bağlıdır; yalnızca medya gönderimleri için açıklama metni boş olabilir.
  - `--dry-run` çözümlenmiş yükü yazdırır; `--json` şu çıktıyı verir: `{ channel, to, messageId, mediaUrl, caption }`.

## WhatsApp Web kanal davranışı

- Girdi: yerel dosya yolu **veya** HTTP(S) URL'si.
- Akış: bir Buffer içine yüklenir, medya türü algılanır ve doğru yük oluşturulur:
  - **Görüntüler:** `channels.whatsapp.mediaMaxMb` hedeflenerek JPEG'e yeniden boyutlandırılır ve yeniden sıkıştırılır (maksimum kenar 2048 px, varsayılan: 50 MB).
  - **Ses/Sesli not/Video:** 16 MB'ye kadar doğrudan geçirilir; ses, sesli not olarak gönderilir (`ptt: true`).
  - **Belgeler:** diğer her şey, 100 MB'ye kadar; mümkün olduğunda dosya adı korunur.
- WhatsApp GIF tarzı oynatma: mobil istemcilerin satır içinde döngüye alması için `gifPlayback: true` ile bir MP4 gönderin (CLI: `--gif-playback`).
- MIME algılama önce magic bytes, sonra başlıklar, sonra dosya uzantısını tercih eder.
- Açıklama metni `--message` veya `reply.text` içinden gelir; boş açıklama metnine izin verilir.
- Günlükleme: verbose olmadığında `↩️`/`✅` gösterilir; verbose modunda boyut ve kaynak yol/URL de eklenir.

## Otomatik yanıt işlem hattı

- `getReplyFromConfig`, `{ text?, mediaUrl?, mediaUrls? }` döndürür.
- Medya mevcut olduğunda, web göndericisi yerel yolları veya URL'leri `openclaw message send` ile aynı işlem hattını kullanarak çözümler.
- Birden fazla medya girdisi verilirse sıralı olarak gönderilir.

## Komutlara gelen medya (Pi)

- Gelen web mesajları medya içerdiğinde, OpenClaw bunu geçici bir dosyaya indirir ve şu şablon değişkenlerini açığa çıkarır:
  - Gelen medya için sözde URL olan `{{MediaUrl}}`.
  - Komut çalıştırılmadan önce yazılan yerel geçici yol olan `{{MediaPath}}`.
- Oturum başına bir Docker sandbox etkinse, gelen medya sandbox çalışma alanına kopyalanır ve `MediaPath`/`MediaUrl`, `media/inbound/<filename>` gibi göreli bir yola yeniden yazılır.
- Medya anlama (`tools.media.*` veya paylaşılan `tools.media.models` ile yapılandırılmışsa) şablonlamadan önce çalışır ve `Body` içine `[Image]`, `[Audio]` ve `[Video]` blokları ekleyebilir.
  - Ses, `{{Transcript}}` ayarlar ve komut ayrıştırma için transkripti kullanır; böylece slash komutları çalışmaya devam eder.
  - Video ve görüntü açıklamaları, komut ayrıştırma için her türlü açıklama metnini korur.
  - Etkin birincil görüntü modeli zaten yerel olarak vision desteği sunuyorsa, OpenClaw `[Image]` özet bloğunu atlar ve bunun yerine özgün görüntüyü modele geçirir.
- Varsayılan olarak yalnızca ilk eşleşen görüntü/ses/video eki işlenir; birden fazla eki işlemek için `tools.media.<cap>.attachments` ayarlayın.

## Sınırlar ve hatalar

**Giden gönderim sınırları (WhatsApp web gönderimi)**

- Görüntüler: yeniden sıkıştırmadan sonra `channels.whatsapp.mediaMaxMb` değerine kadar (varsayılan: 50 MB).
- Ses/sesli not/video: 16 MB sınırı; belgeler: 100 MB sınırı.
- Aşırı büyük veya okunamayan medya → günlüklerde açık hata ve yanıt atlanır.

**Medya anlama sınırları (transkripsiyon/açıklama)**

- Görüntü varsayılanı: 10 MB (`tools.media.image.maxBytes`).
- Ses varsayılanı: 20 MB (`tools.media.audio.maxBytes`).
- Video varsayılanı: 50 MB (`tools.media.video.maxBytes`).
- Aşırı büyük medya anlamayı atlar, ancak yanıtlar özgün gövdeyle yine de devam eder.

## Testler için notlar

- Görüntü/ses/belge durumları için gönderim + yanıt akışlarını kapsayın.
- Görüntüler için yeniden sıkıştırmayı (boyut sınırı) ve ses için sesli not bayrağını doğrulayın.
- Çoklu medya yanıtlarının sıralı gönderimlere ayrıldığından emin olun.
