---
read_when:
    - OpenClaw günlükleme konusunda başlangıç seviyesine uygun bir genel bakışa ihtiyacınız var
    - Günlük düzeylerini, biçimlerini veya gizlemeyi yapılandırmak istiyorsunuz
    - Sorun gideriyorsunuz ve günlükleri hızlıca bulmanız gerekiyor
summary: Dosya günlükleri, konsol çıktısı, CLI ile günlük takibi ve Control UI Günlükler sekmesi
title: Günlük kaydı
x-i18n:
    generated_at: "2026-05-11T20:33:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49b28755998bbe667dd986ae8440d9006d03b0704679bb6d64b5a148a25fc50e
    source_path: logging.md
    workflow: 16
---

OpenClaw'ın iki ana günlük yüzeyi vardır:

- Gateway tarafından yazılan **dosya günlükleri** (JSON satırları).
- Terminallerde ve Gateway Debug UI içinde gösterilen **konsol çıktısı**.

Control UI **Logs** sekmesi, gateway dosya günlüğünü takip eder. Bu sayfa,
günlüklerin nerede bulunduğunu, nasıl okunacağını ve günlük düzeyleri ile biçimlerinin
nasıl yapılandırılacağını açıklar.

## Günlüklerin bulunduğu yer

Varsayılan olarak Gateway, dönen bir günlük dosyasını şu konumun altına yazar:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

Tarih, gateway ana makinesinin yerel saat dilimini kullanır.

Her dosya `logging.maxFileBytes` değerine ulaştığında döndürülür (varsayılan: 100 MB).
OpenClaw, etkin dosyanın yanında en fazla beş numaralı arşiv tutar; örneğin
`openclaw-YYYY-MM-DD.1.log`, ve tanılamaları bastırmak yerine yeni bir etkin günlüğe
yazmaya devam eder.

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

Gateway günlük dosyasını RPC üzerinden takip etmek için CLI kullanın:

```bash
openclaw logs --follow
```

Kullanışlı mevcut seçenekler:

- `--local-time`: zaman damgalarını yerel saat diliminizde işler
- `--url <url>` / `--token <token>` / `--timeout <ms>`: standart Gateway RPC bayrakları
- `--expect-final`: aracı destekli RPC son yanıt bekleme bayrağı (paylaşılan istemci katmanı üzerinden burada kabul edilir)

Çıktı modları:

- **TTY oturumları**: düzenli, renklendirilmiş, yapılandırılmış günlük satırları.
- **TTY olmayan oturumlar**: düz metin.
- `--json`: satırla ayrılmış JSON (satır başına bir günlük olayı).
- `--plain`: TTY oturumlarında düz metni zorlar.
- `--no-color`: ANSI renklerini devre dışı bırakır.

Açık bir `--url` verdiğinizde CLI, yapılandırma veya ortam kimlik bilgilerini
otomatik uygulamaz; hedef Gateway kimlik doğrulama gerektiriyorsa `--token`
değerini kendiniz ekleyin.

JSON modunda CLI, `type` etiketli nesneler üretir:

- `meta`: akış meta verileri (dosya, imleç, boyut)
- `log`: ayrıştırılmış günlük girişi
- `notice`: kısaltma / döndürme ipuçları
- `raw`: ayrıştırılmamış günlük satırı

Örtük local loopback Gateway eşleştirme isterse, bağlanma sırasında kapanırsa
veya `logs.tail` yanıtlamadan önce zaman aşımına uğrarsa, `openclaw logs`
otomatik olarak yapılandırılmış Gateway dosya günlüğüne geri döner. Açık `--url`
hedefleri bu geri dönüşü kullanmaz.

Gateway erişilemezse CLI şu komutu çalıştırmanız için kısa bir ipucu yazdırır:

```bash
openclaw doctor
```

### Control UI (web)

Control UI'nin **Logs** sekmesi, aynı dosyayı `logs.tail` kullanarak takip eder.
Nasıl açılacağını görmek için [Control UI](/tr/web/control-ui) sayfasına bakın.

### Yalnızca kanal günlükleri

Kanal etkinliğini (WhatsApp/Telegram/vb.) filtrelemek için şunu kullanın:

```bash
openclaw channels logs --channel whatsapp
```

## Günlük biçimleri

### Dosya günlükleri (JSONL)

Günlük dosyasındaki her satır bir JSON nesnesidir. CLI ve Control UI, yapılandırılmış
çıktıyı (zaman, düzey, alt sistem, ileti) işlemek için bu girişleri ayrıştırır.

Dosya günlüğü JSONL kayıtları, mevcut olduğunda makineyle filtrelenebilir üst düzey
alanlar da içerir:

- `hostname`: gateway ana makine adı.
- `message`: tam metin araması için düzleştirilmiş günlük ileti metni.
- `agent_id`: günlük çağrısı aracı bağlamı taşıdığında etkin aracı kimliği.
- `session_id`: günlük çağrısı oturum bağlamı taşıdığında etkin oturum kimliği/anahtarı.
- `channel`: günlük çağrısı kanal bağlamı taşıdığında etkin kanal.

OpenClaw, mevcut ayrıştırıcıların numaralı tslog bağımsız değişken anahtarlarını
okumaya devam edebilmesi için özgün yapılandırılmış günlük bağımsız değişkenlerini
bu alanların yanında korur.

Konuşma, gerçek zamanlı ses ve yönetilen oda etkinliği, bu aynı dosya günlüğü
işlem hattı üzerinden sınırlı yaşam döngüsü günlük kayıtları üretir. Bu kayıtlar
mevcut olduğunda olay türü, mod, aktarım, sağlayıcı ve boyut/zamanlama ölçümlerini
içerir; ancak transkript metnini, ses yüklerini, tur kimliklerini, çağrı kimliklerini
ve sağlayıcı öğe kimliklerini atlar.

### Konsol çıktısı

Konsol günlükleri **TTY duyarlıdır** ve okunabilirlik için biçimlendirilir:

- Alt sistem önekleri (örn. `gateway/channels/whatsapp`)
- Düzey renklendirme (info/warn/error)
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

Her ikisini de **`OPENCLAW_LOG_LEVEL`** ortam değişkeniyle geçersiz kılabilirsiniz (örn. `OPENCLAW_LOG_LEVEL=debug`). Ortam değişkeni yapılandırma dosyasına göre önceliklidir, böylece `openclaw.json` dosyasını düzenlemeden tek bir çalıştırma için ayrıntı düzeyini artırabilirsiniz. Ayrıca genel CLI seçeneği olan **`--log-level <level>`** değerini de geçebilirsiniz (örneğin `openclaw --log-level debug gateway run`); bu, ilgili komut için ortam değişkenini geçersiz kılar.

`--verbose` yalnızca konsol çıktısını ve WS günlük ayrıntı düzeyini etkiler; dosya
günlüğü düzeylerini değiştirmez.

### Hedefli model aktarımı tanılamaları

Sağlayıcı çağrılarında hata ayıklarken tüm günlükleri `debug` düzeyine yükseltmek
yerine hedefli ortam bayrakları kullanın:

```bash
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 openclaw gateway
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools OPENCLAW_DEBUG_SSE=events openclaw gateway
```

Kullanılabilir bayraklar:

- `OPENCLAW_DEBUG_MODEL_TRANSPORT=1`: istek başlangıcını, fetch yanıtını, SDK
  başlıklarını, ilk akış olayını, akış tamamlanmasını ve aktarım hatalarını
  `info` düzeyinde üretir.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=summary`: model istek günlüklerine sınırlı bir
  istek yükü özeti ekler.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=tools`: yük özetine modele dönük tüm araç adlarını
  ekler.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`: düzeltilmiş, sınırlandırılmış bir JSON
  yük anlık görüntüsü ekler. Yalnızca hata ayıklarken kullanın; gizli değerler
  düzeltilir, ancak istemler ve ileti metni hâlâ mevcut olabilir.
- `OPENCLAW_DEBUG_SSE=events`: ilk olay ve akış tamamlanma zamanlamasını üretir.
- `OPENCLAW_DEBUG_SSE=peek`: ayrıca ilk beş düzeltilmiş SSE olay yükünü üretir;
  her olay için sınırlandırılır.
- `OPENCLAW_DEBUG_CODE_MODE=1`: kod modu araç yüzeyine sahip olduğu için yerel
  sağlayıcı araçlarının gizlendiği durumlar dahil, kod modu model yüzeyi
  tanılamalarını üretir.

Bu bayraklar normal OpenClaw günlüklemesi üzerinden günlük yazar, bu nedenle
`openclaw logs --follow` ve Control UI Logs sekmesi bunları gösterir. Bayraklar
olmadan aynı tanılamalar `debug` düzeyinde kullanılabilir kalır.

### İz korelasyonu

Dosya günlükleri JSONL'dir. Bir günlük çağrısı geçerli bir tanılama iz bağlamı
taşıdığında OpenClaw, dış günlük işlemcilerinin satırı OTEL span'leri ve sağlayıcı
`traceparent` yayılımı ile ilişkilendirebilmesi için iz alanlarını üst düzey JSON
anahtarları (`traceId`, `spanId`, `parentSpanId`, `traceFlags`) olarak yazar.

Gateway HTTP istekleri ve Gateway WebSocket çerçeveleri, dahili bir istek iz kapsamı
oluşturur. Bu eşzamansız kapsam içinde üretilen günlükler ve tanılama olayları,
açık bir iz bağlamı geçmediklerinde istek izini devralır. Aracı çalıştırma ve
model çağrısı izleri etkin istek izinin alt öğeleri haline gelir; böylece yerel
günlükler, tanılama anlık görüntüleri, OTEL span'leri ve güvenilen sağlayıcı
`traceparent` başlıkları ham istek veya model içeriği günlüğe yazılmadan `traceId`
ile birleştirilebilir.

Konuşma yaşam döngüsü günlük kayıtları da OpenTelemetry günlük dışa aktarımı
etkinleştirildiğinde dosya günlükleriyle aynı sınırlı öznitelikleri kullanarak
OTLP günlüklerine akar.

### Model çağrısı boyutu ve zamanlaması

Model çağrısı tanılamaları, ham istem veya yanıt içeriğini yakalamadan sınırlı
istek/yanıt ölçümlerini kaydeder:

- `requestPayloadBytes`: son model istek yükünün UTF-8 bayt boyutu
- `responseStreamBytes`: akışla gelen model yanıt olaylarının UTF-8 bayt boyutu
- `timeToFirstByteMs`: ilk akış yanıt olayından önce geçen süre
- `durationMs`: toplam model çağrısı süresi

Bu alanlar, tanılama dışa aktarımı etkinleştirildiğinde tanılama anlık görüntüleri,
model çağrısı Plugin kancaları ve OTEL model çağrısı span'leri/metrikleri için kullanılabilir.

### Konsol stilleri

`logging.consoleStyle`:

- `pretty`: insan dostu, renkli, zaman damgalı.
- `compact`: daha sıkı çıktı (uzun oturumlar için en iyisi).
- `json`: satır başına JSON (günlük işlemcileri için).

### Düzeltme

OpenClaw, hassas token'ları konsol çıktısına, dosya günlüklerine, OTLP günlük
kayıtlarına, kalıcı oturum transkript metnine veya Control UI araç olay yüklerine
(araç başlangıç bağımsız değişkenleri, kısmi/sonuç yükleri, türetilmiş exec çıktısı
ve yama özetleri) ulaşmadan önce düzeltebilir:

- `logging.redactSensitive`: `off` | `tools` (varsayılan: `tools`)
- `logging.redactPatterns`: varsayılan kümeyi geçersiz kılmak için regex dizeleri listesi. Özel desenler, Control UI araç yükleri için yerleşik varsayılanların üzerine uygulanır; bu nedenle bir desen eklemek, varsayılanlar tarafından zaten yakalanan değerlerin düzeltilmesini asla zayıflatmaz.

Dosya günlükleri ve oturum transkriptleri JSONL olarak kalır, ancak eşleşen gizli
değerler satır veya ileti diske yazılmadan önce maskelenir. Düzeltme en iyi çaba
esasına dayanır: metin taşıyan ileti içeriğine ve günlük dizelerine uygulanır,
her tanımlayıcıya veya ikili yük alanına değil.

Yerleşik varsayılanlar, JSON alanları, URL parametreleri, CLI bayrakları veya
atamalar olarak göründüklerinde kart numarası, CVC/CVV, paylaşılan ödeme token'ı
ve ödeme kimlik bilgisi gibi yaygın API kimlik bilgilerini ve ödeme kimlik bilgisi
alan adlarını kapsar.

`logging.redactSensitive: "off"` yalnızca bu genel günlük/transkript politikasını
devre dışı bırakır. OpenClaw, UI istemcilerine, destek paketlerine, tanılama
gözlemcilerine, onay istemlerine veya aracı araçlarına gösterilebilecek güvenlik
sınırı yüklerini hâlâ düzeltir. Örnekler arasında Control UI araç çağrısı olayları,
`sessions_history` çıktısı, tanılama destek dışa aktarımları, sağlayıcı hata
gözlemleri, exec onay komutu gösterimi ve Gateway WebSocket protokol günlükleri
bulunur. Özel `logging.redactPatterns` bu yüzeylere proje özelinde desenler
eklemeye devam edebilir.

## Tanılamalar ve OpenTelemetry

Tanılamalar, model çalıştırmaları ve ileti akışı telemetrisi (webhook'lar,
kuyruklama, oturum durumu) için yapılandırılmış, makine tarafından okunabilir
olaylardır. Günlüklerin yerini **almazlar** — metrikleri, izleri ve dışa aktarıcıları
beslerler. Olaylar dışa aktarılsın veya aktarılmasın süreç içinde üretilir.

İki bitişik yüzey:

- **OpenTelemetry dışa aktarımı** — metrikleri, izleri ve günlükleri OTLP/HTTP üzerinden
  herhangi bir OpenTelemetry uyumlu toplayıcıya veya arka uca (Grafana, Datadog,
  Honeycomb, New Relic, Tempo, vb.) gönderir. Tam yapılandırma, sinyal kataloğu,
  metrik/span adları, ortam değişkenleri ve gizlilik modeli özel bir sayfada bulunur:
  [OpenTelemetry dışa aktarımı](/tr/gateway/opentelemetry).
- **Tanılama bayrakları** — `logging.level` yükseltilmeden ek günlükleri
  `logging.file` konumuna yönlendiren hedefli hata ayıklama günlüğü bayrakları.
  Bayraklar büyük/küçük harfe duyarsızdır ve joker karakterleri (`telegram.*`, `*`)
  destekler. `diagnostics.flags` altında veya `OPENCLAW_DIAGNOSTICS=...` ortam
  geçersiz kılmasıyla yapılandırın. Tam kılavuz:
  [Tanılama bayrakları](/tr/diagnostics/flags).

OTLP dışa aktarımı olmadan Plugin'ler veya özel alıcılar için tanılama olaylarını etkinleştirmek üzere:

```json5
{
  diagnostics: { enabled: true },
}
```

Bir toplayıcıya OTLP dışa aktarımı için [OpenTelemetry dışa aktarımı](/tr/gateway/opentelemetry) sayfasına bakın.

## Sorun giderme ipuçları

- **Gateway erişilemiyor mu?** Önce `openclaw doctor` çalıştırın.
- **Günlükler boş mu?** Gateway'in çalıştığını ve `logging.file` içindeki dosya yoluna
  yazdığını kontrol edin.
- **Daha fazla ayrıntı mı gerekiyor?** `logging.level` değerini `debug` veya `trace` yapın ve yeniden deneyin.

## İlgili

- [OpenTelemetry dışa aktarımı](/tr/gateway/opentelemetry) — OTLP/HTTP dışa aktarımı, metrik/span kataloğu, gizlilik modeli
- [Tanılama bayrakları](/tr/diagnostics/flags) — hedefli hata ayıklama günlüğü bayrakları
- [Gateway günlükleme iç yapısı](/tr/gateway/logging) — WS günlük stilleri, alt sistem önekleri ve konsol yakalama
- [Yapılandırma başvurusu](/tr/gateway/configuration-reference#diagnostics) — tam `diagnostics.*` alan başvurusu
