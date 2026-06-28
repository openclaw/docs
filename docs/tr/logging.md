---
read_when:
    - OpenClaw günlük kaydı hakkında yeni başlayanlara uygun bir genel bakışa ihtiyacınız var
    - Günlük seviyelerini, biçimlerini veya maskelemeyi yapılandırmak istiyorsunuz
    - Sorun gideriyorsunuz ve günlükleri hızlıca bulmanız gerekiyor
summary: Dosya günlükleri, konsol çıktısı, CLI kuyruk izleme ve Control UI Günlükler sekmesi
title: Günlükleme
x-i18n:
    generated_at: "2026-06-28T00:45:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: caf2780dfeeaf29f4ee94429894a03422b211a4414e63062642d1134f38b6b3f
    source_path: logging.md
    workflow: 16
---

OpenClaw'ın iki ana günlük yüzeyi vardır:

- Gateway tarafından yazılan **dosya günlükleri** (JSON satırları).
- Terminallerde ve Gateway Hata Ayıklama UI'de gösterilen **konsol çıktısı**.

Control UI **Günlükler** sekmesi gateway dosya günlüğünü canlı izler. Bu sayfa günlüklerin nerede bulunduğunu, nasıl okunacağını ve günlük düzeyleri ile biçimlerinin nasıl yapılandırılacağını açıklar.

## Günlüklerin bulunduğu yer

Varsayılan olarak Gateway, şu konumun altında dönen bir günlük dosyası yazar:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

Tarih, gateway ana makinesinin yerel saat dilimini kullanır.

Her dosya `logging.maxFileBytes` değerine ulaştığında döner (varsayılan: 100 MB).
OpenClaw, etkin dosyanın yanında en fazla beş numaralı arşiv tutar; örneğin `openclaw-YYYY-MM-DD.1.log` ve tanılamaları bastırmak yerine yeni bir etkin günlüğe yazmaya devam eder.

Bunu `~/.openclaw/openclaw.json` içinde geçersiz kılabilirsiniz:

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## Günlükler nasıl okunur

### CLI: canlı takip (önerilir)

Gateway günlük dosyasını RPC üzerinden takip etmek için CLI'yi kullanın:

```bash
openclaw logs --follow
```

Kullanışlı geçerli seçenekler:

- `--local-time`: zaman damgalarını yerel saat diliminizde işler
- `--url <url>` / `--token <token>` / `--timeout <ms>`: standart Gateway RPC bayrakları
- `--expect-final`: ajan destekli RPC nihai yanıt bekleme bayrağı (burada paylaşılan istemci katmanı üzerinden kabul edilir)

Çıktı modları:

- **TTY oturumları**: güzel biçimlendirilmiş, renklendirilmiş, yapılandırılmış günlük satırları.
- **TTY olmayan oturumlar**: düz metin.
- `--json`: satırla ayrılmış JSON (satır başına bir günlük olayı).
- `--plain`: TTY oturumlarında düz metni zorunlu kılar.
- `--no-color`: ANSI renklerini devre dışı bırakır.

Açık bir `--url` verdiğinizde CLI yapılandırma veya ortam kimlik bilgilerini otomatik uygulamaz; hedef Gateway kimlik doğrulama gerektiriyorsa `--token` değerini kendiniz ekleyin.

JSON modunda CLI, `type` etiketli nesneler yayar:

- `meta`: akış meta verileri (dosya, imleç, boyut)
- `log`: ayrıştırılmış günlük girdisi
- `notice`: kesme / döndürme ipuçları
- `raw`: ayrıştırılmamış günlük satırı

Örtük local loopback Gateway eşleştirme isterse, bağlantı sırasında kapanırsa veya `logs.tail` yanıtlamadan önce zaman aşımına uğrarsa, `openclaw logs` otomatik olarak yapılandırılmış Gateway dosya günlüğüne geri döner. Açık `--url` hedefleri bu geri dönüşü kullanmaz. `openclaw logs --follow` daha katıdır: Linux üzerinde kullanılabiliyorsa PID'ye göre etkin kullanıcı-systemd Gateway günlüğünü kullanır; aksi halde potansiyel olarak eski kalmış yan yana bir dosyayı takip etmek yerine canlı Gateway'i yeniden denemeyi sürdürür.

Gateway'e erişilemiyorsa CLI şunu çalıştırmanız için kısa bir ipucu yazdırır:

```bash
openclaw doctor
```

### Control UI (web)

Control UI'nin **Günlükler** sekmesi aynı dosyayı `logs.tail` kullanarak takip eder.
Nasıl açılacağını öğrenmek için [Control UI](/tr/web/control-ui) sayfasına bakın.

### Yalnızca kanal günlükleri

Kanal etkinliğini (WhatsApp/Telegram/vb.) filtrelemek için şunu kullanın:

```bash
openclaw channels logs --channel whatsapp
```

## Günlük biçimleri

### Dosya günlükleri (JSONL)

Günlük dosyasındaki her satır bir JSON nesnesidir. CLI ve Control UI, yapılandırılmış çıktıyı (zaman, düzey, alt sistem, ileti) işlemek için bu girdileri ayrıştırır.

Dosya günlüğü JSONL kayıtları, kullanılabilir olduğunda makine tarafından filtrelenebilir üst düzey alanları da içerir:

- `hostname`: gateway ana makine adı.
- `message`: tam metin araması için düzleştirilmiş günlük iletisi metni.
- `agent_id`: günlük çağrısı ajan bağlamı taşıdığında etkin ajan kimliği.
- `session_id`: günlük çağrısı oturum bağlamı taşıdığında etkin oturum kimliği/anahtarı.
- `channel`: günlük çağrısı kanal bağlamı taşıdığında etkin kanal.

OpenClaw, numaralı tslog bağımsız değişken anahtarlarını okuyan mevcut ayrıştırıcıların çalışmayı sürdürmesi için özgün yapılandırılmış günlük bağımsız değişkenlerini bu alanların yanında korur.

Talk, gerçek zamanlı ses ve yönetilen oda etkinliği, aynı dosya günlüğü hattı üzerinden sınırlı yaşam döngüsü günlük kayıtları yayar. Bu kayıtlar, kullanılabilir olduğunda olay türü, mod, aktarım, sağlayıcı ve boyut/zamanlama ölçümlerini içerir; ancak transkript metni, ses yükleri, tur kimlikleri, çağrı kimlikleri ve sağlayıcı öğe kimliklerini atlar.

### Konsol çıktısı

Konsol günlükleri **TTY farkındadır** ve okunabilirlik için biçimlendirilir:

- Alt sistem önekleri (örn. `gateway/channels/whatsapp`)
- Düzey renklendirmesi (info/warn/error)
- İsteğe bağlı kompakt veya JSON modu

Konsol biçimlendirmesi `logging.consoleStyle` tarafından kontrol edilir.

### Gateway WebSocket günlükleri

`openclaw gateway`, RPC trafiği için WebSocket protokol günlüğüne de sahiptir:

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

Her ikisini de **`OPENCLAW_LOG_LEVEL`** ortam değişkeni üzerinden geçersiz kılabilirsiniz (örn. `OPENCLAW_LOG_LEVEL=debug`). Ortam değişkeni yapılandırma dosyasına göre önceliklidir; böylece `openclaw.json` dosyasını düzenlemeden tek bir çalıştırma için ayrıntı düzeyini artırabilirsiniz. Ayrıca genel CLI seçeneği **`--log-level <level>`** değerini de verebilirsiniz (örneğin, `openclaw --log-level debug gateway run`); bu, ilgili komut için ortam değişkenini geçersiz kılar.

`--verbose` yalnızca konsol çıktısını ve WS günlük ayrıntı düzeyini etkiler; dosya günlük düzeylerini değiştirmez.

### Hedeflenmiş model aktarım tanılamaları

Sağlayıcı çağrılarını hata ayıklarken tüm günlükleri `debug` düzeyine çıkarmak yerine hedeflenmiş ortam bayraklarını kullanın:

```bash
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 openclaw gateway
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools OPENCLAW_DEBUG_SSE=events openclaw gateway
```

Kullanılabilir bayraklar:

- `OPENCLAW_DEBUG_MODEL_TRANSPORT=1`: istek başlangıcını, fetch yanıtını, SDK başlıklarını, ilk akış olayını, akış tamamlanmasını ve aktarım hatalarını `info` düzeyinde yayar.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=summary`: model istek günlüklerine sınırlı bir istek yükü özeti ekler.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=tools`: yük özetine modele gösterilen tüm araç adlarını ekler.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`: redakte edilmiş ve sınırlandırılmış bir JSON yük anlık görüntüsü ekler. Yalnızca hata ayıklarken kullanın; gizli bilgiler redakte edilir ancak istemler ve ileti metni hâlâ mevcut olabilir.
- `OPENCLAW_DEBUG_SSE=events`: ilk olay ve akış tamamlanma zamanlamasını yayar.
- `OPENCLAW_DEBUG_SSE=peek`: ayrıca ilk beş redakte edilmiş SSE olay yükünü, olay başına sınırlandırılmış olarak yayar.
- `OPENCLAW_DEBUG_CODE_MODE=1`: kod modu araç yüzeyine sahip olduğu için yerel sağlayıcı araçlarının gizlendiği durumlar dahil olmak üzere kod modu model yüzeyi tanılamalarını yayar.

Bu bayraklar normal OpenClaw günlüklemesi üzerinden günlük yazar; bu nedenle `openclaw logs --follow` ve Control UI Günlükler sekmesi bunları gösterir. Bayraklar olmadan aynı tanılamalar `debug` düzeyinde kullanılabilir kalır.

`[model-fetch]` başlangıç ve yanıt meta verileri (sağlayıcı, API, model, durum, gecikme ve yöntem, URL, zaman aşımı, proxy ve ilke gibi istek alanları), `OPENCLAW_DEBUG_MODEL_TRANSPORT` değerinden bağımsız olarak her zaman `info` düzeyinde yayılır; böylece temel model aktarım düzeni hata ayıklama bayrakları olmadan görünür olur.

### İz korelasyonu

Dosya günlükleri JSONL'dir. Bir günlük çağrısı geçerli bir tanılama iz bağlamı taşıdığında OpenClaw, harici günlük işleyicilerin satırı OTEL span'ları ve sağlayıcı `traceparent` yayılımı ile ilişkilendirebilmesi için iz alanlarını üst düzey JSON anahtarları (`traceId`, `spanId`, `parentSpanId`, `traceFlags`) olarak yazar.

Gateway HTTP istekleri ve Gateway WebSocket çerçeveleri dahili bir istek iz kapsamı oluşturur. Bu async kapsam içinde yayılan günlükler ve tanılama olayları, açık bir iz bağlamı geçirmediklerinde istek izini devralır. Ajan çalıştırma ve model çağrısı izleri etkin istek izinin çocukları olur; böylece yerel günlükler, tanılama anlık görüntüleri, OTEL span'ları ve güvenilir sağlayıcı `traceparent` başlıkları ham istek veya model içeriği günlüğe yazılmadan `traceId` ile birleştirilebilir.

Talk yaşam döngüsü günlük kayıtları, OpenTelemetry günlük dışa aktarımı etkinleştirildiğinde dosya günlükleriyle aynı sınırlı öznitelikleri kullanarak diagnostics-otel günlük dışa aktarımına da akar. OTLP, stdout JSONL veya her iki hedefi seçmek için `diagnostics.otel.logsExporter` değerini yapılandırın.

### Model çağrısı boyutu ve zamanlaması

Model çağrısı tanılamaları, ham istem veya yanıt içeriğini yakalamadan sınırlı istek/yanıt ölçümlerini kaydeder:

- `requestPayloadBytes`: nihai model istek yükünün UTF-8 bayt boyutu
- `responseStreamBytes`: akışla gelen model yanıt parçası yüklerinin UTF-8 bayt boyutu. Yüksek frekanslı metin, düşünme ve araç çağrısı delta olayları, tam `partial` anlık görüntüleri yerine yalnızca artımlı `delta` baytlarını sayar.
- `timeToFirstByteMs`: ilk akış yanıt olayından önce geçen süre
- `durationMs`: toplam model çağrısı süresi

Bu alanlar, tanılama dışa aktarımı etkinleştirildiğinde tanılama anlık görüntülerinde, model çağrısı Plugin kancalarında ve OTEL model çağrısı span/metriklerinde kullanılabilir.

### Konsol stilleri

`logging.consoleStyle`:

- `pretty`: insan dostu, renkli, zaman damgalı.
- `compact`: daha sıkı çıktı (uzun oturumlar için en iyisi).
- `json`: satır başına JSON (günlük işleyicileri için).

### Redaksiyon

OpenClaw, hassas belirteçleri konsol çıktısına, dosya günlüklerine, OTLP günlük kayıtlarına, kalıcı oturum transkript metnine veya Control UI araç olay yüklerine (araç başlangıç bağımsız değişkenleri, kısmi/nihai sonuç yükleri, türetilmiş exec çıktısı ve yama özetleri) ulaşmadan önce redakte edebilir:

- `logging.redactSensitive`: `off` | `tools` (varsayılan: `tools`)
- `logging.redactPatterns`: varsayılan kümeyi geçersiz kılmak için regex dizeleri listesi. Özel desenler, Control UI araç yükleri için yerleşik varsayılanların üzerine uygulanır; bu nedenle bir desen eklemek, varsayılanlar tarafından zaten yakalanan değerlerin redaksiyonunu asla zayıflatmaz.

Dosya günlükleri ve oturum transkriptleri JSONL olarak kalır; ancak eşleşen gizli değerler satır veya ileti diske yazılmadan önce maskelenir. Redaksiyon en iyi çaba esaslıdır: metin taşıyan ileti içeriğine ve günlük dizelerine uygulanır, her tanımlayıcıya veya ikili yük alanına değil.

Yerleşik varsayılanlar, JSON alanları, URL parametreleri, CLI bayrakları veya atamalar olarak göründüklerinde kart numarası, CVC/CVV, paylaşılan ödeme belirteci ve ödeme kimlik bilgisi gibi yaygın API kimlik bilgilerini ve ödeme kimlik bilgisi alan adlarını kapsar.

`logging.redactSensitive: "off"` yalnızca bu genel günlük/transkript ilkesini devre dışı bırakır. OpenClaw, UI istemcilerine, destek paketlerine, tanılama gözlemcilerine, onay istemlerine veya ajan araçlarına gösterilebilen güvenlik sınırı yüklerini yine de redakte eder. Örnekler arasında Control UI araç çağrısı olayları, `sessions_history` çıktısı, tanılama destek dışa aktarımları, sağlayıcı hata gözlemleri, exec onay komutu gösterimi ve Gateway WebSocket protokol günlükleri bulunur. Özel `logging.redactPatterns` bu yüzeylere proje özelinde desenler eklemeye devam edebilir.

## Tanılamalar ve OpenTelemetry

Tanılamalar, model çalıştırmaları ve ileti akışı telemetrisi (Webhook'lar, kuyruğa alma, oturum durumu) için yapılandırılmış, makine tarafından okunabilir olaylardır. Günlüklerin yerini **almazlar** — metrikleri, izleri ve dışa aktarıcıları beslerler. Olaylar, dışa aktarsanız da aktarmasanız da süreç içinde yayılır.

İki bitişik yüzey:

- **OpenTelemetry dışa aktarımı** — metrikleri, izleri ve günlükleri OTLP/HTTP üzerinden OpenTelemetry uyumlu herhangi bir toplayıcıya veya arka uca gönderin (Grafana, Datadog, Honeycomb, New Relic, Tempo vb.). Tam yapılandırma, sinyal kataloğu, metrik/span adları, ortam değişkenleri ve gizlilik modeli ayrı bir sayfada bulunur:
  [OpenTelemetry dışa aktarımı](/tr/gateway/opentelemetry).
- **Tanılama bayrakları** — ekstra günlükleri `logging.level` değerini yükseltmeden `logging.file` hedefine yönlendiren hedeflenmiş hata ayıklama günlüğü bayrakları. Bayraklar büyük/küçük harfe duyarsızdır ve joker karakterleri (`telegram.*`, `*`) destekler. `diagnostics.flags` altında veya `OPENCLAW_DIAGNOSTICS=...` ortam geçersiz kılması üzerinden yapılandırın. Tam kılavuz:
  [Tanılama bayrakları](/tr/diagnostics/flags).

OTLP dışa aktarımı olmadan Plugin'ler veya özel hedefler için tanılama olaylarını etkinleştirmek üzere:

```json5
{
  diagnostics: { enabled: true },
}
```

OTLP’yi bir toplayıcıya dışa aktarmak için bkz. [OpenTelemetry dışa aktarma](/tr/gateway/opentelemetry).

## Sorun giderme ipuçları

- **Gateway erişilebilir değil mi?** Önce `openclaw doctor` çalıştırın.
- **Günlükler boş mu?** Gateway’in çalıştığını ve `logging.file` içindeki dosya yoluna
  yazdığını kontrol edin.
- **Daha fazla ayrıntı mı gerekiyor?** `logging.level` değerini `debug` veya `trace` olarak ayarlayıp yeniden deneyin.

## İlgili

- [OpenTelemetry dışa aktarma](/tr/gateway/opentelemetry) — OTLP/HTTP dışa aktarma, metrik/span kataloğu, gizlilik modeli
- [Tanılama bayrakları](/tr/diagnostics/flags) — hedefli hata ayıklama günlüğü bayrakları
- [Gateway günlükleme iç işleyişi](/tr/gateway/logging) — WS günlük stilleri, alt sistem ön ekleri ve konsol yakalama
- [Yapılandırma başvurusu](/tr/gateway/configuration-reference#diagnostics) — tam `diagnostics.*` alan başvurusu
