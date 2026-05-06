---
read_when:
    - OpenClaw günlük kaydı hakkında başlangıç seviyesine uygun bir genel bakışa ihtiyacınız var
    - Günlük düzeylerini, biçimlerini veya maskelemeyi yapılandırmak istiyorsunuz
    - Sorun gideriyorsunuz ve günlükleri hızlıca bulmanız gerekiyor
summary: Dosya günlükleri, konsol çıktısı, CLI ile günlük izleme ve Control UI Günlükler sekmesi
title: Günlükleme
x-i18n:
    generated_at: "2026-05-06T09:20:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: abcdfeb0f9fbd13715762a1829198d0285738855c50f2ee531cab1e989d936b1
    source_path: logging.md
    workflow: 16
---

OpenClaw'ın iki ana günlük yüzeyi vardır:

- Gateway tarafından yazılan **dosya günlükleri** (JSON satırları).
- Terminallerde ve Gateway Debug UI'de gösterilen **konsol çıktısı**.

Control UI **Logs** sekmesi, gateway dosya günlüğünü canlı takip eder. Bu sayfa günlüklerin nerede bulunduğunu, nasıl okunacağını ve günlük düzeyleri ile biçimlerinin nasıl yapılandırılacağını açıklar.

## Günlüklerin bulunduğu yer

Varsayılan olarak Gateway, şunun altında dönen bir günlük dosyası yazar:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

Tarih, gateway ana makinesinin yerel saat dilimini kullanır.

Her dosya `logging.maxFileBytes` değerine ulaştığında döndürülür (varsayılan: 100 MB). OpenClaw, etkin dosyanın yanında `openclaw-YYYY-MM-DD.1.log` gibi en fazla beş numaralı arşiv tutar ve tanılama çıktısını bastırmak yerine yeni bir etkin günlüğe yazmaya devam eder.

Bunu `~/.openclaw/openclaw.json` içinde geçersiz kılabilirsiniz:

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## Günlükleri okuma

### CLI: canlı takip (önerilir)

RPC üzerinden gateway günlük dosyasını takip etmek için CLI'yi kullanın:

```bash
openclaw logs --follow
```

Güncel yararlı seçenekler:

- `--local-time`: zaman damgalarını yerel saat diliminizde gösterir
- `--url <url>` / `--token <token>` / `--timeout <ms>`: standart Gateway RPC bayrakları
- `--expect-final`: agent destekli RPC son yanıt bekleme bayrağı (paylaşılan istemci katmanı üzerinden burada kabul edilir)

Çıktı modları:

- **TTY oturumları**: hoş biçimli, renklendirilmiş, yapılandırılmış günlük satırları.
- **TTY olmayan oturumlar**: düz metin.
- `--json`: satırla ayrılmış JSON (satır başına bir günlük olayı).
- `--plain`: TTY oturumlarında düz metni zorla.
- `--no-color`: ANSI renklerini devre dışı bırak.

Açık bir `--url` verdiğinizde CLI yapılandırmayı veya ortam kimlik bilgilerini otomatik uygulamaz; hedef Gateway kimlik doğrulama gerektiriyorsa `--token` değerini kendiniz ekleyin.

JSON modunda CLI, `type` etiketli nesneler üretir:

- `meta`: akış meta verileri (dosya, imleç, boyut)
- `log`: ayrıştırılmış günlük girdisi
- `notice`: kırpma / döndürme ipuçları
- `raw`: ayrıştırılmamış günlük satırı

Örtük local loopback Gateway eşleştirme isterse, bağlantı sırasında kapanırsa veya `logs.tail` yanıtlamadan önce zaman aşımına uğrarsa `openclaw logs` otomatik olarak yapılandırılmış Gateway dosya günlüğüne geri döner. Açık `--url` hedefleri bu geri dönüşü kullanmaz.

Gateway erişilemez durumdaysa CLI şunu çalıştırmanız için kısa bir ipucu yazdırır:

```bash
openclaw doctor
```

### Control UI (web)

Control UI'nin **Logs** sekmesi, `logs.tail` kullanarak aynı dosyayı takip eder. Nasıl açılacağını öğrenmek için [Control UI](/tr/web/control-ui) sayfasına bakın.

### Yalnızca kanal günlükleri

Kanal etkinliğini (WhatsApp/Telegram/vb.) filtrelemek için şunu kullanın:

```bash
openclaw channels logs --channel whatsapp
```

## Günlük biçimleri

### Dosya günlükleri (JSONL)

Günlük dosyasındaki her satır bir JSON nesnesidir. CLI ve Control UI bu girdileri ayrıştırarak yapılandırılmış çıktı (zaman, düzey, alt sistem, ileti) oluşturur.

Dosya günlüğü JSONL kayıtları, mevcut olduğunda makine tarafından filtrelenebilir üst düzey alanlar da içerir:

- `hostname`: gateway ana makine adı.
- `message`: tam metin arama için düzleştirilmiş günlük ileti metni.
- `agent_id`: günlük çağrısı agent bağlamı taşıdığında etkin agent kimliği.
- `session_id`: günlük çağrısı oturum bağlamı taşıdığında etkin oturum kimliği/anahtarı.
- `channel`: günlük çağrısı kanal bağlamı taşıdığında etkin kanal.

OpenClaw, var olan numaralı tslog argüman anahtarlarını okuyan ayrıştırıcıların çalışmaya devam etmesi için özgün yapılandırılmış günlük argümanlarını bu alanların yanında korur.

### Konsol çıktısı

Konsol günlükleri **TTY farkındadır** ve okunabilirlik için biçimlendirilir:

- Alt sistem önekleri (örn. `gateway/channels/whatsapp`)
- Düzey renklendirmesi (info/warn/error)
- İsteğe bağlı kompakt veya JSON modu

Konsol biçimlendirmesi `logging.consoleStyle` ile denetlenir.

### Gateway WebSocket günlükleri

`openclaw gateway`, RPC trafiği için WebSocket protokol günlüğüne de sahiptir:

- normal mod: yalnızca ilginç sonuçlar (hatalar, ayrıştırma hataları, yavaş çağrılar)
- `--verbose`: tüm istek/yanıt trafiği
- `--ws-log auto|compact|full`: ayrıntılı gösterim stilini seçer
- `--compact`: `--ws-log compact` için takma ad

Örnekler:

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## Günlüklemeyi yapılandırma

Tüm günlükleme yapılandırması `~/.openclaw/openclaw.json` içindeki `logging` altında bulunur.

```json
{
  "logging": {
    "level": "info",
    "file": "/tmp/openclaw/openclaw-YYYY-MM-DD.log",
    "consoleLevel": "info",
    "consoleStyle": "pretty",
    "redactSensitive": "tools",
    "redactPatterns": ["sk-.*"]
  }
}
```

### Günlük düzeyleri

- `logging.level`: **dosya günlükleri** (JSONL) düzeyi.
- `logging.consoleLevel`: **konsol** ayrıntı düzeyi.

İkisini de **`OPENCLAW_LOG_LEVEL`** ortam değişkeniyle geçersiz kılabilirsiniz (örn. `OPENCLAW_LOG_LEVEL=debug`). Ortam değişkeni yapılandırma dosyasına göre önceliklidir; böylece `openclaw.json` dosyasını düzenlemeden tek bir çalıştırma için ayrıntı düzeyini yükseltebilirsiniz. Ayrıca global CLI seçeneği **`--log-level <level>`** değerini de geçebilirsiniz (örneğin, `openclaw --log-level debug gateway run`); bu, söz konusu komut için ortam değişkenini geçersiz kılar.

`--verbose` yalnızca konsol çıktısını ve WS günlük ayrıntı düzeyini etkiler; dosya günlük düzeylerini değiştirmez.

### İz korelasyonu

Dosya günlükleri JSONL biçimindedir. Bir günlük çağrısı geçerli bir tanılama iz bağlamı taşıdığında OpenClaw, dış günlük işleyicilerinin satırı OTEL span'leri ve sağlayıcı `traceparent` yayılımı ile ilişkilendirebilmesi için iz alanlarını üst düzey JSON anahtarları (`traceId`, `spanId`, `parentSpanId`, `traceFlags`) olarak yazar.

Gateway HTTP istekleri ve Gateway WebSocket çerçeveleri dahili bir istek iz kapsamı oluşturur. Bu async kapsam içinde üretilen günlükler ve tanılama olayları, açık bir iz bağlamı geçirilmediğinde istek izini devralır. Agent çalıştırma ve model çağrısı izleri etkin istek izinin çocukları olur; böylece yerel günlükler, tanılama anlık görüntüleri, OTEL span'leri ve güvenilen sağlayıcı `traceparent` başlıkları, ham istek veya model içeriği günlüğe yazılmadan `traceId` ile birleştirilebilir.

### Model çağrısı boyutu ve zamanlaması

Model çağrısı tanılamaları, ham prompt veya yanıt içeriğini yakalamadan sınırlı istek/yanıt ölçümleri kaydeder:

- `requestPayloadBytes`: son model istek yükünün UTF-8 bayt boyutu
- `responseStreamBytes`: akış olarak gelen model yanıt olaylarının UTF-8 bayt boyutu
- `timeToFirstByteMs`: ilk akış yanıt olayı öncesinde geçen süre
- `durationMs`: toplam model çağrısı süresi

Tanılama dışa aktarımı etkinleştirildiğinde bu alanlar tanılama anlık görüntüleri, model çağrısı Plugin hook'ları ve OTEL model çağrısı span/metrikleri için kullanılabilir.

### Konsol stilleri

`logging.consoleStyle`:

- `pretty`: insan dostu, renkli, zaman damgalı.
- `compact`: daha sıkı çıktı (uzun oturumlar için en iyisi).
- `json`: satır başına JSON (günlük işleyicileri için).

### Redaksiyon

OpenClaw; hassas token'ları konsol çıktısına, dosya günlüklerine, OTLP günlük kayıtlarına, kalıcı oturum transcript metnine veya Control UI araç olayı yüklerine (araç başlatma argümanları, kısmi/sonuç yükleri, türetilmiş exec çıktısı ve patch özetleri) ulaşmadan önce redakte edebilir:

- `logging.redactSensitive`: `off` | `tools` (varsayılan: `tools`)
- `logging.redactPatterns`: varsayılan kümeyi geçersiz kılmak için regex dizeleri listesi. Özel desenler, Control UI araç yükleri için yerleşik varsayılanların üstüne uygulanır; bu nedenle bir desen eklemek, varsayılanlar tarafından zaten yakalanan değerlerin redaksiyonunu asla zayıflatmaz.

Dosya günlükleri ve oturum transcript'leri JSONL olarak kalır, ancak eşleşen gizli değerler satır veya ileti diske yazılmadan önce maskelenir. Redaksiyon en iyi çaba esasına dayanır: metin taşıyan ileti içeriğine ve günlük dizelerine uygulanır; her tanımlayıcıya veya ikili yük alanına uygulanmaz.

Yerleşik varsayılanlar, JSON alanları, URL parametreleri, CLI bayrakları veya atamalar olarak göründüklerinde kart numarası, CVC/CVV, paylaşılan ödeme token'ı ve ödeme kimlik bilgisi gibi yaygın API kimlik bilgilerini ve ödeme kimlik bilgisi alan adlarını kapsar.

`logging.redactSensitive: "off"` yalnızca bu genel günlük/transcript politikasını devre dışı bırakır. OpenClaw, UI istemcilerine, destek paketlerine, tanılama gözlemcilerine, onay istemlerine veya agent araçlarına gösterilebilecek güvenlik sınırı yüklerini yine de redakte eder. Örnekler arasında Control UI araç çağrısı olayları, `sessions_history` çıktısı, tanılama destek dışa aktarımları, sağlayıcı hata gözlemleri, exec onay komutu gösterimi ve Gateway WebSocket protokol günlükleri yer alır. Özel `logging.redactPatterns` bu yüzeylere projeye özgü desenler eklemeye devam edebilir.

## Tanılamalar ve OpenTelemetry

Tanılamalar, model çalıştırmaları ve ileti akışı telemetrisi (webhook'lar, kuyruğa alma, oturum durumu) için yapılandırılmış, makine tarafından okunabilir olaylardır. Günlüklerin yerini **almazlar**; metrikleri, izleri ve dışa aktarıcıları beslerler. Olaylar, dışa aktarılıp aktarılmadıklarından bağımsız olarak süreç içinde üretilir.

İki bitişik yüzey:

- **OpenTelemetry dışa aktarımı** — metrikleri, izleri ve günlükleri OTLP/HTTP üzerinden herhangi bir OpenTelemetry uyumlu collector veya backend'e (Grafana, Datadog, Honeycomb, New Relic, Tempo vb.) gönderir. Tam yapılandırma, sinyal kataloğu, metrik/span adları, ortam değişkenleri ve gizlilik modeli özel bir sayfada bulunur: [OpenTelemetry dışa aktarımı](/tr/gateway/opentelemetry).
- **Tanılama bayrakları** — `logging.level` değerini yükseltmeden ek günlükleri `logging.file` konumuna yönlendiren hedefli hata ayıklama günlüğü bayrakları. Bayraklar büyük/küçük harfe duyarlı değildir ve joker karakterleri (`telegram.*`, `*`) destekler. `diagnostics.flags` altında veya `OPENCLAW_DIAGNOSTICS=...` ortam geçersiz kılmasıyla yapılandırın. Tam kılavuz: [Tanılama bayrakları](/tr/diagnostics/flags).

Plugin'ler veya özel sink'ler için OTLP dışa aktarımı olmadan tanılama olaylarını etkinleştirmek için:

```json5
{
  diagnostics: { enabled: true },
}
```

Bir collector'a OTLP dışa aktarımı için [OpenTelemetry dışa aktarımı](/tr/gateway/opentelemetry) sayfasına bakın.

## Sorun giderme ipuçları

- **Gateway erişilemiyor mu?** Önce `openclaw doctor` komutunu çalıştırın.
- **Günlükler boş mu?** Gateway'in çalıştığını ve `logging.file` içindeki dosya yoluna yazdığını kontrol edin.
- **Daha fazla ayrıntı mı gerekiyor?** `logging.level` değerini `debug` veya `trace` olarak ayarlayın ve yeniden deneyin.

## İlgili

- [OpenTelemetry dışa aktarımı](/tr/gateway/opentelemetry) — OTLP/HTTP dışa aktarımı, metrik/span kataloğu, gizlilik modeli
- [Tanılama bayrakları](/tr/diagnostics/flags) — hedefli hata ayıklama günlüğü bayrakları
- [Gateway günlükleme iç yapısı](/tr/gateway/logging) — WS günlük stilleri, alt sistem önekleri ve konsol yakalama
- [Yapılandırma referansı](/tr/gateway/configuration-reference#diagnostics) — tam `diagnostics.*` alan referansı
