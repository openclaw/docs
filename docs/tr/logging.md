---
read_when:
    - OpenClaw günlük kaydı hakkında başlangıç düzeyine uygun bir genel bakışa ihtiyacınız var
    - Günlük seviyelerini, biçimlerini veya gizlemeyi yapılandırmak istiyorsunuz
    - Sorun gideriyorsunuz ve günlükleri hızlıca bulmanız gerekiyor
summary: Dosya günlükleri, konsol çıktısı, CLI ile günlük izleme ve Control UI Günlükler sekmesi
title: Günlükleme
x-i18n:
    generated_at: "2026-05-01T09:01:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: d41ce5b1ae30fe1ca65577abe387fc266bd281686acb10098f82b8e78dfaa357
    source_path: logging.md
    workflow: 16
---

OpenClaw’ın iki ana günlük yüzeyi vardır:

- Gateway tarafından yazılan **dosya günlükleri** (JSON satırları).
- Terminallerde ve Gateway Hata Ayıklama Kullanıcı Arayüzü’nde gösterilen **konsol çıktısı**.

Kontrol Kullanıcı Arayüzü’nün **Günlükler** sekmesi gateway dosya günlüğünü canlı izler. Bu sayfa günlüklerin nerede bulunduğunu, nasıl okunacağını ve günlük düzeyleri ile biçimlerinin nasıl yapılandırılacağını açıklar.

## Günlüklerin bulunduğu yer

Varsayılan olarak Gateway, şunun altında dönen bir günlük dosyası yazar:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

Tarih, gateway ana makinesinin yerel saat dilimini kullanır.

Her dosya `logging.maxFileBytes` değerine ulaştığında döndürülür (varsayılan: 100 MB). OpenClaw etkin dosyanın yanında `openclaw-YYYY-MM-DD.1.log` gibi en fazla beş numaralı arşiv tutar ve tanılamaları bastırmak yerine yeni bir etkin günlüğe yazmaya devam eder.

Bunu `~/.openclaw/openclaw.json` içinde geçersiz kılabilirsiniz:

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## Günlükler nasıl okunur

### CLI: canlı izleme (önerilir)

Gateway günlük dosyasını RPC üzerinden canlı izlemek için CLI’yi kullanın:

```bash
openclaw logs --follow
```

Yararlı güncel seçenekler:

- `--local-time`: zaman damgalarını yerel saat diliminizde işler
- `--url <url>` / `--token <token>` / `--timeout <ms>`: standart Gateway RPC bayrakları
- `--expect-final`: ajan destekli RPC son yanıt bekleme bayrağı (paylaşılan istemci katmanı üzerinden burada kabul edilir)

Çıktı modları:

- **TTY oturumları**: okunaklı, renklendirilmiş, yapılandırılmış günlük satırları.
- **TTY olmayan oturumlar**: düz metin.
- `--json`: satırlarla ayrılmış JSON (satır başına bir günlük olayı).
- `--plain`: TTY oturumlarında düz metni zorla.
- `--no-color`: ANSI renklerini devre dışı bırak.

Açık bir `--url` verdiğinizde CLI yapılandırma veya ortam kimlik bilgilerini otomatik uygulamaz; hedef Gateway kimlik doğrulaması gerektiriyorsa `--token` seçeneğini kendiniz ekleyin.

JSON modunda CLI, `type` etiketi taşıyan nesneler yayar:

- `meta`: akış meta verileri (dosya, imleç, boyut)
- `log`: ayrıştırılmış günlük girdisi
- `notice`: kısaltma / döndürme ipuçları
- `raw`: ayrıştırılmamış günlük satırı

Örtük local loopback Gateway eşleştirme isterse, bağlantı sırasında kapanırsa veya `logs.tail` yanıt vermeden önce zaman aşımına uğrarsa, `openclaw logs` otomatik olarak yapılandırılmış Gateway dosya günlüğüne geri döner. Açık `--url` hedefleri bu geri dönüşü kullanmaz.

Gateway’e ulaşılamıyorsa CLI şu komutu çalıştırmanız için kısa bir ipucu yazdırır:

```bash
openclaw doctor
```

### Kontrol Kullanıcı Arayüzü (web)

Kontrol Kullanıcı Arayüzü’nün **Günlükler** sekmesi aynı dosyayı `logs.tail` kullanarak canlı izler. Nasıl açılacağını görmek için [/web/control-ui](/tr/web/control-ui) bölümüne bakın.

### Yalnızca kanal günlükleri

Kanal etkinliğini (WhatsApp/Telegram/vb.) filtrelemek için şunu kullanın:

```bash
openclaw channels logs --channel whatsapp
```

## Günlük biçimleri

### Dosya günlükleri (JSONL)

Günlük dosyasındaki her satır bir JSON nesnesidir. CLI ve Kontrol Kullanıcı Arayüzü bu girdileri ayrıştırarak yapılandırılmış çıktı (zaman, düzey, alt sistem, ileti) işler.

Dosya günlüğü JSONL kayıtları, kullanılabildiğinde makine tarafından filtrelenebilir üst düzey alanlar da içerir:

- `hostname`: gateway ana makine adı.
- `message`: tam metin araması için düzleştirilmiş günlük iletisi metni.
- `agent_id`: günlük çağrısı ajan bağlamı taşıdığında etkin ajan kimliği.
- `session_id`: günlük çağrısı oturum bağlamı taşıdığında etkin oturum kimliği/anahtarı.
- `channel`: günlük çağrısı kanal bağlamı taşıdığında etkin kanal.

OpenClaw, bu alanların yanında özgün yapılandırılmış günlük argümanlarını korur; böylece numaralı tslog argüman anahtarlarını okuyan mevcut ayrıştırıcılar çalışmaya devam eder.

### Konsol çıktısı

Konsol günlükleri **TTY’ye duyarlıdır** ve okunabilirlik için biçimlendirilir:

- Alt sistem önekleri (örn. `gateway/channels/whatsapp`)
- Düzey renklendirmesi (info/warn/error)
- İsteğe bağlı kompakt veya JSON modu

Konsol biçimlendirmesi `logging.consoleStyle` tarafından denetlenir.

### Gateway WebSocket günlükleri

`openclaw gateway`, RPC trafiği için WebSocket protokol günlüğü de tutar:

- normal mod: yalnızca ilginç sonuçlar (hatalar, ayrıştırma hataları, yavaş çağrılar)
- `--verbose`: tüm istek/yanıt trafiği
- `--ws-log auto|compact|full`: ayrıntılı gösterim stilini seçer
- `--compact`: `--ws-log compact` için diğer ad

Örnekler:

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## Günlük kaydını yapılandırma

Tüm günlük yapılandırması, `~/.openclaw/openclaw.json` içindeki `logging` altında bulunur.

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

Her ikisini de **`OPENCLAW_LOG_LEVEL`** ortam değişkeniyle geçersiz kılabilirsiniz (örn. `OPENCLAW_LOG_LEVEL=debug`). Ortam değişkeni yapılandırma dosyasına göre önceliklidir; böylece `openclaw.json` dosyasını düzenlemeden tek bir çalıştırma için ayrıntı düzeyini artırabilirsiniz. Ayrıca genel CLI seçeneği **`--log-level <level>`** değerini de geçirebilirsiniz (örneğin, `openclaw --log-level debug gateway run`); bu, ilgili komut için ortam değişkenini geçersiz kılar.

`--verbose` yalnızca konsol çıktısını ve WS günlük ayrıntı düzeyini etkiler; dosya
günlük düzeylerini değiştirmez.

### İz korelasyonu

Dosya günlükleri JSONL biçimindedir. Bir günlük çağrısı geçerli bir tanılama iz bağlamı taşıdığında,
OpenClaw iz alanlarını üst düzey JSON anahtarları (`traceId`, `spanId`,
`parentSpanId`, `traceFlags`) olarak yazar; böylece harici günlük işleyiciler satırı
OTEL span'leri ve sağlayıcı `traceparent` yayılımıyla ilişkilendirebilir.

Gateway HTTP istekleri ve Gateway WebSocket çerçeveleri dahili bir istek
iz kapsamı oluşturur. Bu async kapsam içinde yayımlanan günlükler ve tanılama olayları,
açık bir iz bağlamı geçirmediklerinde istek izini devralır. Ajan çalıştırma ve
model çağrısı izleri etkin istek izinin alt öğeleri haline gelir; böylece yerel günlükler,
tanılama anlık görüntüleri, OTEL span'leri ve güvenilir sağlayıcı `traceparent` başlıkları,
ham istek veya model içeriğini günlüğe yazmadan `traceId` ile birleştirilebilir.

### Model çağrısı boyutu ve zamanlaması

Model çağrısı tanılamaları, ham prompt veya yanıt içeriğini yakalamadan
sınırlı istek/yanıt ölçümlerini kaydeder:

- `requestPayloadBytes`: son model istek yükünün UTF-8 bayt boyutu
- `responseStreamBytes`: akışla gelen model yanıt olaylarının UTF-8 bayt boyutu
- `timeToFirstByteMs`: akışla gelen ilk yanıt olayından önce geçen süre
- `durationMs`: toplam model çağrısı süresi

Bu alanlar, tanılama dışa aktarımı etkinleştirildiğinde tanılama anlık görüntüleri,
model çağrısı Plugin hook'ları ve OTEL model çağrısı span'leri/metrikleri için kullanılabilir.

### Konsol stilleri

`logging.consoleStyle`:

- `pretty`: insan dostu, renkli, zaman damgalı.
- `compact`: daha sıkı çıktı (uzun oturumlar için en iyisi).
- `json`: satır başına JSON (günlük işleyiciler için).

### Redaksiyon

OpenClaw, hassas belirteçler konsol çıktısına, dosya günlüklerine,
OTLP günlük kayıtlarına, kalıcı oturum transkript metnine veya Control UI araç
olay yüklerine (araç başlangıç argümanları, kısmi/nihai sonuç yükleri, türetilmiş
exec çıktısı ve yama özetleri) ulaşmadan önce bunları redakte edebilir:

- `logging.redactSensitive`: `off` | `tools` (varsayılan: `tools`)
- `logging.redactPatterns`: varsayılan kümeyi geçersiz kılacak regex dizeleri listesi. Özel desenler, Control UI araç yükleri için yerleşik varsayılanların üzerine uygulanır; bu nedenle bir desen eklemek, varsayılanlar tarafından zaten yakalanan değerlerin redaksiyonunu asla zayıflatmaz.

Dosya günlükleri ve oturum transkriptleri JSONL olarak kalır, ancak eşleşen gizli değerler
satır veya ileti diske yazılmadan önce maskelenir. Redaksiyon en iyi çaba esasına dayanır:
her tanımlayıcıya veya ikili yük alanına değil, metin taşıyan ileti içeriğine ve günlük dizelerine
uygulanır.

Yerleşik varsayılanlar; kart numarası, CVC/CVV, paylaşılan ödeme belirteci ve ödeme kimlik bilgisi
gibi yaygın API kimlik bilgilerini ve ödeme kimlik bilgisi alan adlarını,
JSON alanları, URL parametreleri, CLI bayrakları veya atamalar olarak göründüklerinde kapsar.

`logging.redactSensitive: "off"` yalnızca bu genel günlük/transkript
ilkesini devre dışı bırakır. OpenClaw, UI istemcilerine, destek paketlerine, tanılama gözlemcilerine,
onay istemlerine veya ajan araçlarına gösterilebilecek güvenlik sınırı yüklerini
redakte etmeye devam eder. Örnekler arasında Control UI araç çağrısı olayları, `sessions_history` çıktısı,
tanılama destek dışa aktarımları, sağlayıcı hata gözlemleri, exec onay komutu
gösterimi ve Gateway WebSocket protokol günlükleri bulunur. Özel `logging.redactPatterns`
bu yüzeylere proje özelinde desenler eklemeye devam edebilir.

## Tanılamalar ve OpenTelemetry

Tanılamalar; model çalıştırmaları ve ileti akışı telemetrisi (Webhook'lar, kuyruğa alma, oturum durumu) için
yapılandırılmış, makine tarafından okunabilir olaylardır. Günlüklerin yerini **almazlar** —
metrikleri, izleri ve dışa aktarıcıları beslerler. Olaylar, dışa aktarılıp aktarılmadıklarından bağımsız olarak
süreç içinde yayımlanır.

İki bitişik yüzey:

- **OpenTelemetry dışa aktarımı** — metrikleri, izleri ve günlükleri OTLP/HTTP üzerinden
  herhangi bir OpenTelemetry uyumlu toplayıcıya veya arka uca (Grafana, Datadog,
  Honeycomb, New Relic, Tempo vb.) gönderin. Tam yapılandırma, sinyal kataloğu,
  metrik/span adları, ortam değişkenleri ve gizlilik modeli özel bir sayfada bulunur:
  [OpenTelemetry dışa aktarımı](/tr/gateway/opentelemetry).
- **Tanılama bayrakları** — `logging.level` değerini yükseltmeden ek günlükleri
  `logging.file` konumuna yönlendiren hedefli hata ayıklama günlüğü bayrakları. Bayraklar büyük/küçük harfe duyarsızdır
  ve joker karakterleri (`telegram.*`, `*`) destekler. `diagnostics.flags` altında
  veya `OPENCLAW_DIAGNOSTICS=...` ortam geçersiz kılmasıyla yapılandırın. Tam kılavuz:
  [Tanılama bayrakları](/tr/diagnostics/flags).

OTLP dışa aktarımı olmadan Plugin'ler veya özel alıcılar için tanılama olaylarını etkinleştirmek için:

```json5
{
  diagnostics: { enabled: true },
}
```

Bir toplayıcıya OTLP dışa aktarımı için bkz. [OpenTelemetry dışa aktarımı](/tr/gateway/opentelemetry).

## Sorun giderme ipuçları

- **Gateway erişilebilir değil mi?** Önce `openclaw doctor` çalıştırın.
- **Günlükler boş mu?** Gateway'in çalıştığını ve `logging.file` içindeki dosya yoluna
  yazdığını kontrol edin.
- **Daha fazla ayrıntı mı gerekiyor?** `logging.level` değerini `debug` veya `trace` olarak ayarlayın ve yeniden deneyin.

## İlgili

- [OpenTelemetry dışa aktarımı](/tr/gateway/opentelemetry) — OTLP/HTTP dışa aktarımı, metrik/span kataloğu, gizlilik modeli
- [Tanılama bayrakları](/tr/diagnostics/flags) — hedefli hata ayıklama günlüğü bayrakları
- [Gateway günlük kaydı iç ayrıntıları](/tr/gateway/logging) — WS günlük stilleri, alt sistem önekleri ve konsol yakalama
- [Yapılandırma referansı](/tr/gateway/configuration-reference#diagnostics) — tam `diagnostics.*` alan referansı
