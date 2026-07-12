---
read_when:
    - Medya işlem hattını veya ekleri değiştirme
summary: Gönderim, Gateway ve ajan yanıtları için görsel ve medya işleme kuralları
title: Görüntü ve medya desteği
x-i18n:
    generated_at: "2026-07-12T12:26:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 41d5bbd174b4fb35b616a9e90930485fd76dc8cfbad2e178f0823e6fb40c36f8
    source_path: nodes/images.md
    workflow: 16
---

WhatsApp kanalı Baileys Web üzerinde çalışır. Bu sayfa; gönderim, Gateway ve ajan yanıtları için medya işleme kurallarını kapsar.

## Hedefler

- `openclaw message send --media` aracılığıyla isteğe bağlı bir açıklamayla medya gönderin.
- Web gelen kutusundaki otomatik yanıtların metnin yanında medya da içermesine izin verin.
- Tür başına sınırları makul ve öngörülebilir tutun.

## CLI Yüzeyi

`openclaw message send --target <dest> --media <path-or-url> [--message <caption>]`

- `--media <path-or-url>` — medya (görüntü/ses/video/belge) ekler; yerel yolları veya URL'leri kabul eder. İsteğe bağlıdır; yalnızca medya içeren gönderimlerde açıklama boş olabilir.
- `--gif-playback` — video medyasını GIF oynatımı olarak işler (yalnızca WhatsApp).
- `--force-document` — kanal sıkıştırmasını önlemek için medyayı belge olarak gönderir (Telegram, WhatsApp); görüntülere, GIF'lere ve videolara uygulanır.
- `--reply-to <id>`, `--thread-id <id>`, `--pin`, `--silent` — yalnızca metin içeren gönderimlerle paylaşılan teslimat/ileti dizisi seçenekleri.
- `--dry-run` — çözümlenen yükü yazdırır ve gönderimi atlar.
- `--json` — sonucu JSON olarak yazdırır: `{ action, channel, dryRun, handledBy, messageId?, payload }` (`payload`, herhangi bir medya referansı dâhil olmak üzere kanala özgü gönderim sonucunu taşır).

## WhatsApp Web kanalı davranışı

- Girdi: yerel dosya yolu **veya** HTTP(S) URL'si.
- Akış: bir arabelleğe yükler, medya türünü algılar, ardından türe göre giden yükü oluşturur:
  - **Görüntüler:** `channels.whatsapp.mediaMaxMb` sınırının (varsayılan 50 MB) altında kalacak şekilde optimize edilir. Opak görüntüler yeniden JPEG olarak sıkıştırılır (varsayılan kenar basamakları 2048 pikselden başlar ve boyut sınırı tekrar tekrar aşıldığında azalır); saydamlık içeren görüntüler PNG olarak korunur. Kaynak zaten boyut ve kenar uzunluğu bütçesi içinde kabul edilebilir bir JPEG/PNG/WebP ise yeniden sıkıştırılmak yerine özgün baytlar değiştirilmeden korunur. Animasyonlu GIF'ler hiçbir zaman yeniden kodlanmaz, yalnızca boyutları denetlenir.
  - **Ses/sesli mesaj:** zaten yerel sesli mesaj biçiminde (`.ogg`/`.opus` veya `audio/ogg`/`audio/opus`) değilse giden ses, sesli not (`ptt: true`) olarak gönderilmeden önce `ffmpeg` aracılığıyla Opus/OGG biçimine dönüştürülür (48 kHz mono, 64 kbps, en fazla 20 dakika).
  - **Video:** 16 MB'a kadar doğrudan geçirilir.
  - **Belgeler:** diğer her şey, 100 MB'a kadar; varsa dosya adı korunur.
- WhatsApp GIF tarzı oynatımı: mobil istemcilerin videoyu satır içinde döngüye alması için `gifPlayback: true` ile bir MP4 gönderin (CLI: `--gif-playback`).
- MIME algılama önce sihirli bayt incelemesini, ardından dosya uzantısını ve son olarak yanıt üstbilgilerini tercih eder; genel olarak algılanan bir kapsayıcı (`application/octet-stream`, `zip`), daha özel bir uzantı eşlemesini hiçbir zaman geçersiz kılmaz (örneğin XLSX ile ZIP).
- Açıklama `--message` veya `reply.text` değerinden gelir; boş açıklamaya izin verilir.
- Günlük kaydı: ayrıntısız modda `↩️`/`✅` gösterilir; ayrıntılı mod boyutu ve kaynak yolunu/URL'sini içerir.

<Note>
Yukarıdaki 16 MB ses/video ve 100 MB belge değerleri, açık bir bayt üst sınırı geçirilmediğinde kullanılan, türe göre paylaşılan varsayılan medya sınırlarıdır. WhatsApp gönderimleri, `channels.whatsapp.mediaMaxMb` ayarından açık bir sınır belirler (varsayılan 50 MB); bu sınır ilgili hesap için tüm türlere aynı şekilde uygulanır.
</Note>

## Otomatik Yanıt İşlem Hattı

- `getReplyFromConfig`, diğer alanların yanı sıra `text?`, `mediaUrl?` ve `mediaUrls?` içeren bir yanıt yükü (veya yük dizisi) döndürür.
- Medya bulunduğunda web göndericisi, `openclaw message send` ile aynı işlem hattını kullanarak yerel yolları veya URL'leri çözümler.
- Birden fazla medya girdisi sağlanırsa sırayla gönderilir.

## Gelen Medyadan Komutlara

- Gelen web iletileri medya içerdiğinde OpenClaw bunu geçici bir dosyaya indirir ve şablon değişkenlerini kullanıma sunar:
  - `{{MediaUrl}}` — gelen medyanın sözde URL'si.
  - `{{MediaPath}}` — komut çalıştırılmadan önce yazılan yerel geçici yol.
- Oturum başına Docker korumalı alanı etkinleştirildiğinde gelen medya, korumalı alan çalışma alanına kopyalanır ve `MediaPath`/`MediaUrl`, `media/inbound/<filename>` gibi korumalı alana göreli bir yol olarak yeniden yazılır.
- Medya anlama (`tools.media.*` veya paylaşılan `tools.media.models` aracılığıyla yapılandırılır), şablonlama öncesinde çalışır ve `Body` içine `[Image]`, `[Audio]` ve `[Video]` blokları ekleyebilir.
  - Ses, `{{Transcript}}` değerini ayarlar ve eğik çizgi komutlarının çalışmaya devam etmesi için komut ayrıştırmada dökümü kullanır.
  - Video ve görüntü açıklamaları, komut ayrıştırma için açıklama metnini korur.
  - Etkin birincil model görüntüyü zaten yerel olarak destekliyorsa OpenClaw, `[Image]` özet bloğunu atlar ve bunun yerine özgün görüntüyü modele iletir.
- Varsayılan olarak yalnızca eşleşen ilk görüntü/ses/video eki işlenir; birden fazla eki işlemek için `tools.media.<capability>.attachments` ayarını kullanın.

## Sınırlar ve hatalar

**Giden gönderim üst sınırları (WhatsApp web gönderimi)**

- Görüntüler: optimizasyondan sonra en fazla `channels.whatsapp.mediaMaxMb` (varsayılan 50 MB).
- Ses/video: 16 MB üst sınırı (paylaşılan varsayılan; WhatsApp üzerinden gönderilirken `mediaMaxMb` tarafından geçersiz kılınır).
- Belgeler: 100 MB üst sınırı (paylaşılan varsayılan; WhatsApp üzerinden gönderilirken `mediaMaxMb` tarafından geçersiz kılınır).
- Fazla büyük veya okunamayan medya günlüklerde açık bir hata oluşturur ve yanıt atlanır.

**Medya anlama üst sınırları (döküm/açıklama)**

- Varsayılan görüntü sınırı: 10 MB (`tools.media.image.maxBytes`).
- Varsayılan ses sınırı: 20 MB (`tools.media.audio.maxBytes`).
- Varsayılan video sınırı: 50 MB (`tools.media.video.maxBytes`).
- Fazla büyük medyada anlama atlanır ancak yanıt özgün gövdeyle gönderilmeye devam eder.

## Testlere İlişkin Notlar

- Görüntü/ses/belge durumlarında gönderim ve yanıt akışlarını kapsayın.
- Görüntü optimizasyonundan sonra boyut sınırlarını ve ses için sesli not bayrağını doğrulayın.
- Birden fazla medya içeren yanıtların ayrı ve sıralı gönderimler olarak dağıtıldığından emin olun.

## İlgili Konular

- [Kamera yakalama](/tr/nodes/camera)
- [Medya anlama](/tr/nodes/media-understanding)
- [Ses ve sesli notlar](/tr/nodes/audio)
