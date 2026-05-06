---
read_when:
    - OpenClaw günlükleme hakkında yeni başlayanlara uygun bir genel bakışa ihtiyacınız var
    - Günlük seviyelerini, biçimlerini veya gizlemeyi yapılandırmak istiyorsunuz
    - Sorun gideriyorsunuz ve günlükleri hızlıca bulmanız gerekiyor
summary: Dosya günlükleri, konsol çıktısı, CLI ile takip ve Kontrol kullanıcı arayüzünün Günlükler sekmesi
title: Günlükleme
x-i18n:
    generated_at: "2026-05-06T17:58:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 218f68c5111b6de01dc14707dad132d15d5e78c8e906af8a5416e618807663ac
    source_path: logging.md
    workflow: 16
---

OpenClaw'ın iki ana günlük yüzeyi vardır:

- Gateway tarafından yazılan **dosya günlükleri** (JSON satırları).
- Terminallerde ve Gateway Hata Ayıklama UI'sinde gösterilen **konsol çıktısı**.

Control UI **Günlükler** sekmesi, gateway dosya günlüğünü takip eder. Bu sayfa
günlüklerin nerede bulunduğunu, nasıl okunacağını ve günlük düzeyleri ile biçimlerinin nasıl yapılandırılacağını açıklar.

## Günlüklerin bulunduğu yer

Varsayılan olarak Gateway, şurada dönen bir günlük dosyası yazar:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

Tarih, gateway ana makinesinin yerel saat dilimini kullanır.

Her dosya `logging.maxFileBytes` değerine ulaştığında döndürülür (varsayılan: 100 MB).
OpenClaw etkin dosyanın yanında en fazla beş numaralı arşiv tutar; örneğin
`openclaw-YYYY-MM-DD.1.log`, ve tanılamaları bastırmak yerine yeni bir etkin günlüğe yazmaya devam eder.

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

Gateway günlük dosyasını RPC üzerinden takip etmek için CLI'yi kullanın:

```bash
openclaw logs --follow
```

Güncel kullanışlı seçenekler:

- `--local-time`: zaman damgalarını yerel saat diliminizde işler
- `--url <url>` / `--token <token>` / `--timeout <ms>`: standart Gateway RPC bayrakları
- `--expect-final`: ajan destekli RPC son yanıt bekleme bayrağı (burada paylaşılan istemci katmanı üzerinden kabul edilir)

Çıktı modları:

- **TTY oturumları**: düzenli, renklendirilmiş, yapılandırılmış günlük satırları.
- **TTY olmayan oturumlar**: düz metin.
- `--json`: satırla ayrılmış JSON (satır başına bir günlük olayı).
- `--plain`: TTY oturumlarında düz metni zorlar.
- `--no-color`: ANSI renklerini devre dışı bırakır.

Açık bir `--url` verdiğinizde CLI, yapılandırma veya ortam kimlik bilgilerini otomatik uygulamaz; hedef Gateway kimlik doğrulama gerektiriyorsa `--token` değerini kendiniz ekleyin.

JSON modunda CLI, `type` etiketli nesneler yayar:

- `meta`: akış meta verileri (dosya, imleç, boyut)
- `log`: ayrıştırılmış günlük girdisi
- `notice`: kesme / döndürme ipuçları
- `raw`: ayrıştırılmamış günlük satırı

Örtük local loopback Gateway eşleştirme isterse, bağlantı sırasında kapanırsa
veya `logs.tail` yanıtlamadan önce zaman aşımına uğrarsa, `openclaw logs`
otomatik olarak yapılandırılmış Gateway dosya günlüğüne geri döner. Açık `--url`
hedefleri bu geri dönüşü kullanmaz.

Gateway'e ulaşılamıyorsa CLI, şunu çalıştırmanız için kısa bir ipucu yazdırır:

```bash
openclaw doctor
```

### Control UI (web)

Control UI'nin **Günlükler** sekmesi aynı dosyayı `logs.tail` kullanarak takip eder.
Nasıl açılacağını öğrenmek için [Control UI](/tr/web/control-ui) bölümüne bakın.

### Yalnızca kanal günlükleri

Kanal etkinliğini (WhatsApp/Telegram/vb.) filtrelemek için şunu kullanın:

```bash
openclaw channels logs --channel whatsapp
```

## Günlük biçimleri

### Dosya günlükleri (JSONL)

Günlük dosyasındaki her satır bir JSON nesnesidir. CLI ve Control UI, yapılandırılmış çıktı (zaman, düzey, alt sistem, ileti) oluşturmak için bu girdileri ayrıştırır.

Dosya günlüğü JSONL kayıtları, kullanılabilir olduğunda makineyle filtrelenebilir üst düzey alanları da içerir:

- `hostname`: gateway ana makine adı.
- `message`: tam metin araması için düzleştirilmiş günlük ileti metni.
- `agent_id`: günlük çağrısı ajan bağlamı taşıdığında etkin ajan kimliği.
- `session_id`: günlük çağrısı oturum bağlamı taşıdığında etkin oturum kimliği/anahtarı.
- `channel`: günlük çağrısı kanal bağlamı taşıdığında etkin kanal.

OpenClaw, numaralı tslog argüman anahtarlarını okuyan mevcut ayrıştırıcıların çalışmaya devam etmesi için özgün yapılandırılmış günlük argümanlarını bu alanların yanında korur.

Konuşma, gerçek zamanlı ses ve yönetilen oda etkinliği, aynı dosya günlüğü hattı üzerinden sınırlı yaşam döngüsü günlük kayıtları yayar. Bu kayıtlar, kullanılabilir olduğunda olay türü, mod, taşıma, sağlayıcı ve boyut/zamanlama ölçümlerini içerir; ancak döküm metnini, ses yüklerini, sıra kimliklerini, çağrı kimliklerini ve sağlayıcı öğe kimliklerini çıkarır.

### Konsol çıktısı

Konsol günlükleri **TTY farkındadır** ve okunabilirlik için biçimlendirilir:

- Alt sistem önekleri (örn. `gateway/channels/whatsapp`)
- Düzey renklendirmesi (info/warn/error)
- İsteğe bağlı kompakt veya JSON modu

Konsol biçimlendirmesi `logging.consoleStyle` tarafından denetlenir.

### Gateway WebSocket günlükleri

`openclaw gateway` ayrıca RPC trafiği için WebSocket protokol günlüklemesine sahiptir:

- normal mod: yalnızca ilginç sonuçlar (hatalar, ayrıştırma hataları, yavaş çağrılar)
- `--verbose`: tüm istek/yanıt trafiği
- `--ws-log auto|compact|full`: ayrıntılı işleme stilini seçer
- `--compact`: `--ws-log compact` için takma ad

Örnekler:

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## Günlüklemeyi yapılandırma

Tüm günlükleme yapılandırması `~/.openclaw/openclaw.json` içinde `logging` altında bulunur.

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

İkisini de **`OPENCLAW_LOG_LEVEL`** ortam değişkeniyle geçersiz kılabilirsiniz (örn. `OPENCLAW_LOG_LEVEL=debug`). Ortam değişkeni yapılandırma dosyasına göre önceliklidir; böylece `openclaw.json` dosyasını düzenlemeden tek bir çalıştırma için ayrıntı düzeyini artırabilirsiniz. Ayrıca global CLI seçeneği **`--log-level <level>`** de verilebilir (örneğin, `openclaw --log-level debug gateway run`); bu seçenek ilgili komut için ortam değişkenini geçersiz kılar.

`--verbose` yalnızca konsol çıktısını ve WS günlük ayrıntı düzeyini etkiler; dosya günlük düzeylerini değiştirmez.

### İz bağıntısı

Dosya günlükleri JSONL'dir. Bir günlük çağrısı geçerli bir tanılama iz bağlamı taşıdığında OpenClaw, dış günlük işleyicilerin satırı OTEL span'leri ve sağlayıcı `traceparent` yayılımıyla ilişkilendirebilmesi için iz alanlarını üst düzey JSON anahtarları (`traceId`, `spanId`, `parentSpanId`, `traceFlags`) olarak yazar.

Gateway HTTP istekleri ve Gateway WebSocket çerçeveleri dahili bir istek iz kapsamı oluşturur. Bu async kapsam içinde yayılan günlükler ve tanılama olayları, açık bir iz bağlamı geçirmediklerinde istek izini devralır. Ajan çalıştırma ve model çağrısı izleri etkin istek izinin alt öğeleri olur; böylece yerel günlükler, tanılama anlık görüntüleri, OTEL span'leri ve güvenilir sağlayıcı `traceparent` başlıkları, ham istek veya model içeriği günlüğe alınmadan `traceId` ile birleştirilebilir.

Konuşma yaşam döngüsü günlük kayıtları da OpenTelemetry günlük dışa aktarımı etkinleştirildiğinde, dosya günlükleriyle aynı sınırlı öznitelikler kullanılarak OTLP günlüklerine akar.

### Model çağrısı boyutu ve zamanlaması

Model çağrısı tanılamaları, ham istem veya yanıt içeriğini yakalamadan sınırlı istek/yanıt ölçümleri kaydeder:

- `requestPayloadBytes`: son model istek yükünün UTF-8 bayt boyutu
- `responseStreamBytes`: akışa alınan model yanıt olaylarının UTF-8 bayt boyutu
- `timeToFirstByteMs`: ilk akış yanıt olayı öncesinde geçen süre
- `durationMs`: toplam model çağrısı süresi

Bu alanlar, tanılama dışa aktarımı etkinleştirildiğinde tanılama anlık görüntüleri, model çağrısı Plugin hook'ları ve OTEL model çağrısı span/metrikleri tarafından kullanılabilir.

### Konsol stilleri

`logging.consoleStyle`:

- `pretty`: insan dostu, renkli, zaman damgalı.
- `compact`: daha sıkı çıktı (uzun oturumlar için en iyisi).
- `json`: satır başına JSON (günlük işleyicileri için).

### Redaksiyon

OpenClaw, hassas belirteçleri konsol çıktısına, dosya günlüklerine,
OTLP günlük kayıtlarına, kalıcı oturum dökümü metnine veya Control UI araç
olay yüklerine (araç başlangıç argümanları, kısmi/son sonuç yükleri, türetilmiş
exec çıktısı ve patch özetleri) ulaşmadan önce redakte edebilir:

- `logging.redactSensitive`: `off` | `tools` (varsayılan: `tools`)
- `logging.redactPatterns`: varsayılan kümenin yerini alacak regex dizeleri listesi. Özel desenler, Control UI araç yükleri için yerleşik varsayılanların üstüne uygulanır; bu nedenle bir desen eklemek, varsayılanların zaten yakaladığı değerlerin redaksiyonunu asla zayıflatmaz.

Dosya günlükleri ve oturum dökümleri JSONL olarak kalır, ancak eşleşen gizli değerler satır veya ileti diske yazılmadan önce maskelenir. Redaksiyon en iyi çaba esasına dayanır: metin taşıyan ileti içeriğine ve günlük dizelerine uygulanır; her tanımlayıcıya veya ikili yük alanına uygulanmaz.

Yerleşik varsayılanlar, kart numarası, CVC/CVV, paylaşılan ödeme belirteci ve ödeme kimlik bilgisi gibi yaygın API kimlik bilgilerini ve ödeme kimlik bilgisi alan adlarını JSON alanları, URL parametreleri, CLI bayrakları veya atamalar olarak göründüklerinde kapsar.

`logging.redactSensitive: "off"` yalnızca bu genel günlük/döküm politikasını devre dışı bırakır. OpenClaw, UI istemcilerine, destek paketlerine, tanılama gözlemcilerine, onay istemlerine veya ajan araçlarına gösterilebilecek güvenlik sınırı yüklerini yine de redakte eder. Örnekler arasında Control UI araç çağrısı olayları, `sessions_history` çıktısı, tanılama destek dışa aktarımları, sağlayıcı hata gözlemleri, exec onay komutu gösterimi ve Gateway WebSocket protokol günlükleri bulunur. Özel `logging.redactPatterns` bu yüzeylere proje özelinde desenler eklemeye devam edebilir.

## Tanılamalar ve OpenTelemetry

Tanılamalar, model çalıştırmaları ve ileti akışı telemetrisi (webhook'lar, kuyruğa alma, oturum durumu) için yapılandırılmış, makine tarafından okunabilir olaylardır. Günlüklerin yerini **almazlar**; metrikleri, izleri ve dışa aktarıcıları beslerler. Olaylar, dışa aktarsanız da aktarmasanız da işlem içinde yayılır.

İki bitişik yüzey:

- **OpenTelemetry dışa aktarımı** — metrikleri, izleri ve günlükleri OTLP/HTTP üzerinden herhangi bir OpenTelemetry uyumlu toplayıcıya veya arka uca (Grafana, Datadog, Honeycomb, New Relic, Tempo, vb.) gönderir. Tam yapılandırma, sinyal kataloğu, metrik/span adları, ortam değişkenleri ve gizlilik modeli özel bir sayfada bulunur:
  [OpenTelemetry dışa aktarımı](/tr/gateway/opentelemetry).
- **Tanılama bayrakları** — ekstra günlükleri `logging.level` değerini yükseltmeden `logging.file` hedefine yönlendiren hedefli hata ayıklama günlüğü bayrakları. Bayraklar büyük/küçük harfe duyarsızdır ve joker karakterleri (`telegram.*`, `*`) destekler. `diagnostics.flags` altında veya `OPENCLAW_DIAGNOSTICS=...` ortam geçersiz kılmasıyla yapılandırın. Tam kılavuz:
  [Tanılama bayrakları](/tr/diagnostics/flags).

OTLP dışa aktarımı olmadan Plugin'ler veya özel alıcılar için tanılama olaylarını etkinleştirmek üzere:

```json5
{
  diagnostics: { enabled: true },
}
```

Bir toplayıcıya OTLP dışa aktarımı için [OpenTelemetry dışa aktarımı](/tr/gateway/opentelemetry) bölümüne bakın.

## Sorun giderme ipuçları

- **Gateway erişilemiyor mu?** Önce `openclaw doctor` çalıştırın.
- **Günlükler boş mu?** Gateway'in çalıştığını ve `logging.file` içindeki dosya yoluna yazdığını denetleyin.
- **Daha fazla ayrıntı mı gerekiyor?** `logging.level` değerini `debug` veya `trace` olarak ayarlayıp yeniden deneyin.

## İlgili

- [OpenTelemetry dışa aktarımı](/tr/gateway/opentelemetry) — OTLP/HTTP dışa aktarımı, metrik/span kataloğu, gizlilik modeli
- [Tanılama bayrakları](/tr/diagnostics/flags) — hedefli hata ayıklama günlüğü bayrakları
- [Gateway günlükleme iç yapısı](/tr/gateway/logging) — WS günlük stilleri, alt sistem önekleri ve konsol yakalama
- [Yapılandırma başvurusu](/tr/gateway/configuration-reference#diagnostics) — tam `diagnostics.*` alan başvurusu
