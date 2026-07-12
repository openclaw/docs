---
read_when:
    - OpenClaw günlük kaydına ilişkin başlangıç seviyesine uygun bir genel bakışa ihtiyacınız var
    - Günlük düzeylerini, biçimlerini veya gizlemeyi yapılandırmak istiyorsunuz
    - Sorun gideriyorsunuz ve günlükleri hızlıca bulmanız gerekiyor
summary: Dosya günlükleri, konsol çıktısı, CLI ile günlük takibi ve Kontrol Arayüzü Günlükler sekmesi
title: Günlükleme
x-i18n:
    generated_at: "2026-07-12T11:55:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: add41e125c22ca1b2343a3a1fb1e88e94ef9c81a07c48b9eb67f4d4b2510dd08
    source_path: logging.md
    workflow: 16
---

OpenClaw'ın iki ana günlük yüzeyi vardır:

- Gateway tarafından yazılan **dosya günlükleri** (JSON satırları).
- Gateway'in çalıştığı terminaldeki **konsol çıktısı**.

Control UI'daki **Günlükler** sekmesi, Gateway dosya günlüğünü anlık olarak izler. Bu sayfa günlüklerin
nerede bulunduğunu, nasıl okunacağını ve günlük düzeyleri ile biçimlerinin nasıl yapılandırılacağını açıklar.

## Günlüklerin bulunduğu yer

Gateway, varsayılan olarak her gün için dönüşümlü bir günlük dosyası yazar:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

Tarih, Gateway ana makinesinin yerel saat dilimini kullanır. `/tmp/openclaw` güvenli
veya kullanılabilir olmadığında (ve Windows'ta her zaman), OpenClaw bunun yerine işletim sistemi geçici
dizini altında kullanıcı kapsamlı bir `openclaw-<uid>` dizini kullanır. Tarihli günlük dosyaları
24 saat sonra temizlenir.

Bir sonraki yazma işlemi `logging.maxFileBytes` değerini
(varsayılan: 100 MB) aşacaksa dosya döndürülür. OpenClaw, etkin dosyanın yanında
`openclaw-YYYY-MM-DD.1.log` gibi en fazla beş numaralı arşiv tutar ve tanılama
kayıtlarını engellemek yerine yeni bir etkin günlüğe yazmaya devam eder.

Yolu `~/.openclaw/openclaw.json` içinde geçersiz kılabilirsiniz:

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## Günlükleri okuma

### CLI: canlı izleme (önerilen)

Gateway günlük dosyasını RPC üzerinden izleyin:

```bash
openclaw logs --follow
```

Seçenekler:

| Bayrak              | Varsayılan | Davranış                                                                                          |
| ------------------- | ---------- | ------------------------------------------------------------------------------------------------- |
| `--follow`          | kapalı     | İzlemeyi sürdürür; bağlantı kesildiğinde artan bekleme süreleriyle yeniden bağlanır               |
| `--limit <n>`       | `200`      | Her getirmede en fazla satır sayısı                                                               |
| `--max-bytes <n>`   | `250000`   | Her getirmede okunacak en fazla bayt                                                              |
| `--interval <ms>`   | `1000`     | İzleme sırasında yoklama aralığı                                                                  |
| `--json`            | kapalı     | Satırla ayrılmış JSON (satır başına bir olay)                                                     |
| `--plain`           | kapalı     | TTY oturumlarında düz metni zorunlu kılar                                                         |
| `--no-color`        | —          | ANSI renklerini devre dışı bırakır                                                                |
| `--utc`             | kapalı     | Zaman damgalarını UTC olarak gösterir (varsayılan yerel saattir)                                  |
| `--local-time`      | kapalı     | Yerel saat varsayılanı için kabul edilen uyumluluk yazımıdır; bunun dışında etkisi yoktur          |
| `--url` / `--token` | —          | Standart Gateway RPC bayrakları                                                                   |
| `--timeout <ms>`    | `30000`    | Gateway RPC zaman aşımı                                                                           |
| `--expect-final`    | kapalı     | Aracı destekli RPC son yanıt bekleme bayrağı (burada paylaşılan istemci katmanı üzerinden kabul edilir) |

Çıktı kipleri:

- **TTY oturumları**: düzenli, renkli ve yapılandırılmış günlük satırları.
- **TTY olmayan oturumlar**: düz metin.

Açıkça bir `--url` ilettiğinizde CLI, yapılandırma veya ortam
kimlik bilgilerini otomatik olarak uygulamaz; `--token` değerini kendiniz ekleyin, aksi takdirde çağrı
`gateway url override requires explicit credentials` hatasıyla başarısız olur.

JSON kipinde CLI, `type` etiketi taşıyan nesneler üretir:

- `meta`: akış meta verileri (dosya, kaynak, kaynak türü, hizmet, imleç, boyut)
- `log`: ayrıştırılmış günlük girdisi
- `notice`: kesilme / döndürme ipuçları
- `raw`: ayrıştırılmamış günlük satırı
- `error`: Gateway bağlantı hataları (stderr'e yazılır)

Örtük local loopback Gateway eşleştirme isterse, bağlantı sırasında kapanırsa
veya `logs.tail` yanıt vermeden zaman aşımına uğrarsa `openclaw logs`, otomatik olarak
yapılandırılmış Gateway dosya günlüğüne geri döner. Açık `--url` hedefleri bu
geri dönüşü kullanmaz. `openclaw logs --follow` daha katıdır: Linux'ta kullanılabiliyorsa
PID'ye göre etkin kullanıcı systemd Gateway günlüğünü kullanır; aksi takdirde güncelliğini yitirmiş olabilecek
yan yana dosyayı izlemek yerine canlı Gateway'e artan bekleme süreleriyle yeniden bağlanmayı dener.

Gateway'e erişilemiyorsa CLI şu komutu çalıştırmanız için kısa bir ipucu yazdırır:

```bash
openclaw doctor
```

### Control UI (web)

Control UI'daki **Günlükler** sekmesi, `logs.tail` kullanarak aynı dosyayı izler.
Nasıl açılacağını öğrenmek için [Control UI](/tr/web/control-ui) bölümüne bakın.

### Yalnızca kanal günlükleri

Kanal etkinliğini (WhatsApp/Telegram/vb.) filtrelemek için şunu kullanın:

```bash
openclaw channels logs --channel whatsapp
```

`--channel` varsayılan olarak `all` değerini kullanır; `--lines <n>` (varsayılan 200) ve `--json` da
kullanılabilir.

## Günlük biçimleri

### Dosya günlükleri (JSONL)

Günlük dosyasındaki her satır bir JSON nesnesidir. CLI ve Control UI, yapılandırılmış
çıktıyı (zaman, düzey, alt sistem, ileti) görüntülemek için bu girdileri ayrıştırır.

Dosya günlüğü JSONL kayıtları, kullanılabilir olduğunda makine tarafından filtrelenebilen
üst düzey alanları da içerir:

- `hostname`: Gateway ana makine adı.
- `message`: tam metin araması için düzleştirilmiş günlük iletisi metni.
- `agent_id`: günlük çağrısı aracı bağlamı taşıdığında etkin aracı kimliği.
- `session_id`: günlük çağrısı oturum bağlamı taşıdığında etkin oturum kimliği/anahtarı.
- `channel`: günlük çağrısı kanal bağlamı taşıdığında etkin kanal.

OpenClaw, numaralı tslog bağımsız değişken anahtarlarını okuyan mevcut ayrıştırıcıların
çalışmaya devam etmesi için özgün yapılandırılmış günlük bağımsız değişkenlerini bu alanlarla birlikte korur.

Konuşma, gerçek zamanlı ses ve yönetilen oda etkinliği, aynı dosya günlüğü
işlem hattı üzerinden sınırlandırılmış yaşam döngüsü günlük kayıtları üretir. Bu kayıtlar kullanılabilir olduğunda olay türünü,
kipi, aktarımı, sağlayıcıyı ve boyut/zamanlama ölçümlerini içerir; ancak
transkript metnini, ses yüklerini, tur kimliklerini, çağrı kimliklerini ve sağlayıcı öğe kimliklerini dışarıda bırakır.

### Konsol çıktısı

Konsol günlükleri **TTY farkındalığına sahiptir** ve okunabilirlik için biçimlendirilir:

- Alt sistem önekleri (ör. `gateway/channels/whatsapp`)
- Düzey renklendirmesi (bilgi/uyarı/hata)
- İsteğe bağlı sıkıştırılmış veya JSON kipi

Konsol biçimlendirmesi `logging.consoleStyle` tarafından denetlenir.

### Gateway WebSocket günlükleri

`openclaw gateway`, RPC trafiği için WebSocket protokol günlüklerine de sahiptir:

- normal kip: yalnızca dikkat çekici sonuçlar (hatalar, ayrıştırma hataları, yavaş çağrılar)
- `--verbose`: tüm istek/yanıt trafiği
- `--ws-log auto|compact|full`: ayrıntılı görüntüleme biçimini seçer
- `--compact`: `--ws-log compact` için diğer ad

Örnekler:

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## Günlük kaydını yapılandırma

Tüm günlük yapılandırması `~/.openclaw/openclaw.json` içindeki `logging` altında bulunur.

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

Düzeyler: `silent`, `fatal`, `error`, `warn`, `info`, `debug`, `trace`.

- `logging.level`: **dosya günlükleri** (JSONL) düzeyi (varsayılan: `info`).
- `logging.consoleLevel`: **konsol** ayrıntı düzeyi.

Her ikisini de **`OPENCLAW_LOG_LEVEL`** ortam değişkeniyle geçersiz kılabilirsiniz (ör. `OPENCLAW_LOG_LEVEL=debug`). Ortam değişkeni yapılandırma dosyasına göre önceliklidir; böylece `openclaw.json` dosyasını düzenlemeden tek bir çalıştırma için ayrıntı düzeyini artırabilirsiniz. Ayrıca global CLI seçeneği **`--log-level <level>`** değerini de iletebilirsiniz (örneğin `openclaw --log-level debug gateway run`); bu seçenek ilgili komut için ortam değişkenini geçersiz kılar.

`--verbose` yalnızca konsol çıktısını ve WS günlük ayrıntısını etkiler; dosya
günlük düzeylerini değiştirmez.

### Hedefli model aktarımı tanılaması

Sağlayıcı çağrılarında hata ayıklarken tüm günlükleri `debug` düzeyine yükseltmek yerine
hedefli ortam bayraklarını kullanın:

```bash
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 openclaw gateway
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools OPENCLAW_DEBUG_SSE=events openclaw gateway
```

Kullanılabilir bayraklar:

- `OPENCLAW_DEBUG_MODEL_TRANSPORT=1`: istek başlangıcını, getirme yanıtını, SDK
  üst bilgilerini, ilk akış olayını, akış tamamlanmasını ve aktarım hatalarını
  `info` düzeyinde üretir.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=summary`: model istek günlüklerine sınırlandırılmış bir istek yükü
  özeti ekler.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=tools`: yük özetine modelin gördüğü tüm araç adlarını
  ekler.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`: hassas verileri gizlenmiş, boyutu sınırlandırılmış bir JSON
  yükü anlık görüntüsü ekler. Yalnızca hata ayıklama sırasında kullanın; gizli bilgiler gizlenir ancak istemler
  ve ileti metinleri yine de bulunabilir.
- `OPENCLAW_DEBUG_SSE=events`: ilk olay ve akış tamamlanması zamanlamasını üretir.
- `OPENCLAW_DEBUG_SSE=peek`: ayrıca olay başına boyutu sınırlandırılmış, hassas verileri gizlenmiş ilk beş SSE olay
  yükünü üretir.
- `OPENCLAW_DEBUG_CODE_MODE=1`: kod kipi araç yüzeyine sahip olduğu için yerel sağlayıcı araçlarının
  gizlendiği durumlar dahil olmak üzere kod kipi model yüzeyi tanılamasını
  üretir.

Bu bayraklar normal OpenClaw günlük sistemi üzerinden kayıt oluşturur; dolayısıyla `openclaw logs --follow`
ve Control UI'daki Günlükler sekmesi bunları gösterir. Bayraklar olmadan aynı tanılama kayıtları
`debug` düzeyinde kullanılabilir olmaya devam eder.

`[model-fetch]` başlangıç ve yanıt meta verileri (sağlayıcı, API, model, durum,
gecikme ve yöntem, URL, zaman aşımı, proxy ve ilke gibi istek alanları),
`OPENCLAW_DEBUG_MODEL_TRANSPORT` değerinden bağımsız olarak her zaman
`info` düzeyinde üretilir; böylece temel model aktarımı düzeni, hata ayıklama
bayrakları olmadan görünür olur.

### İz ilişkilendirmesi

Dosya günlükleri JSONL biçimindedir. Bir günlük çağrısı geçerli bir tanılama iz bağlamı taşıdığında,
OpenClaw iz alanlarını üst düzey JSON anahtarları (`traceId`, `spanId`,
`parentSpanId`, `traceFlags`) olarak yazar; böylece harici günlük işleyicileri satırı
OTEL yayılımları ve sağlayıcı `traceparent` iletimiyle ilişkilendirebilir.

Gateway HTTP istekleri ve Gateway WebSocket çerçeveleri dahili bir istek
iz kapsamı oluşturur. Bu eşzamansız kapsam içinde üretilen günlükler ve tanılama olayları,
açık bir iz bağlamı iletmediklerinde istek izini devralır. Aracı çalıştırma ve
model çağrısı izleri etkin istek izinin alt öğeleri olur; böylece yerel günlükler,
tanılama anlık görüntüleri, OTEL yayılımları ve güvenilir sağlayıcı `traceparent` üst bilgileri,
ham istek veya model içeriği günlüğe kaydedilmeden `traceId` ile birleştirilebilir.

Konuşma yaşam döngüsü günlük kayıtları da OpenTelemetry günlük dışa aktarımı
etkinleştirildiğinde, dosya günlükleriyle aynı sınırlandırılmış öznitelikleri kullanarak diagnostics-otel günlük dışa aktarımına gönderilir.
OTLP, stdout JSONL veya her iki hedefi seçmek için `diagnostics.otel.logsExporter` yapılandırmasını kullanın.

### Model çağrısı boyutu ve zamanlaması

Model çağrısı tanılaması, ham istem veya yanıt içeriğini yakalamadan
sınırlandırılmış istek/yanıt ölçümlerini kaydeder:

- `requestPayloadBytes`: son model istek yükünün UTF-8 bayt boyutu
- `responseStreamBytes`: akışla iletilen model yanıtı parçası
  yüklerinin UTF-8 bayt boyutu. Yüksek frekanslı metin, düşünme ve araç çağrısı fark olayları,
  tam `partial` anlık görüntüleri yerine yalnızca artımlı `delta` baytlarını sayar.
- `timeToFirstByteMs`: akışla iletilen ilk yanıt olayından önce geçen süre
- `durationMs`: toplam model çağrısı süresi

Tanılama dışa aktarımı etkinleştirildiğinde bu alanlar tanılama anlık görüntüleri, model çağrısı Plugin kancaları ve
OTEL model çağrısı yayılımları/ölçümleri tarafından kullanılabilir.

### Konsol biçimleri

`logging.consoleStyle`:

- `pretty`: insan dostu, renkli ve zaman damgalı.
- `compact`: daha sıkı çıktı (uzun oturumlar için en iyisi).
- `json`: satır başına JSON (günlük işleyicileri için).

### Hassas verileri gizleme

OpenClaw; hassas belirteçleri konsol çıktısına, dosya günlüklerine,
OTLP günlük kayıtlarına, kalıcı oturum transkripti metnine veya Control UI araç
olayı yüklerine (araç başlangıç bağımsız değişkenleri, kısmi/sonuç yükleri, türetilmiş
çalıştırma çıktısı ve yama özetleri) ulaşmadan önce gizleyebilir:

- `logging.redactSensitive`: `off` | `tools` (varsayılan: `tools`)
- `logging.redactPatterns`: günlük/transkript çıktısı için varsayılan kümeyi değiştiren regex dizeleri listesi. Control UI araç yüklerinde özel desenler yerleşik varsayılanlara ek olarak uygulanır; dolayısıyla bir desen eklemek, varsayılanların zaten yakaladığı değerlerin gizlenmesini hiçbir zaman zayıflatmaz.

Dosya günlükleri ve oturum transkriptleri JSONL olarak kalır; ancak eşleşen gizli değerler
satır veya ileti diske yazılmadan önce maskelenir. Gizleme, mümkün olan en iyi çabayla uygulanır:
metin taşıyan ileti içeriğine ve günlük dizelerine uygulanır; her
tanımlayıcıya veya ikili yük alanına uygulanmaz.

Yerleşik varsayılanlar, kart numarası, CVC/CVV, paylaşılan ödeme belirteci ve ödeme kimlik bilgisi gibi yaygın API kimlik bilgilerini ve ödeme kimlik bilgisi alan adlarını; bunlar JSON alanları, URL parametreleri, CLI bayrakları veya atamalar olarak göründüğünde kapsar.

`logging.redactSensitive: "off"` yalnızca bu genel günlük/transkript politikasını devre dışı bırakır. OpenClaw; kullanıcı arayüzü istemcilerine, destek paketlerine, tanılama gözlemcilerine, onay istemlerine veya aracı araçlarına gösterilebilen güvenlik sınırı yüklerindeki hassas bilgileri yine de gizler. Örnekler arasında Control UI araç çağrısı olayları, `sessions_history` çıktısı, tanılama destek dışa aktarımları, sağlayıcı hata gözlemleri, çalıştırma onayı komut gösterimi ve Gateway WebSocket protokolü günlükleri bulunur. Özel `logging.redactPatterns`, bu yüzeylere projeye özgü kalıplar eklemeye devam edebilir.

## Tanılama ve OpenTelemetry

Tanılamalar, model çalıştırmaları ve mesaj akışı telemetrisi (Webhook'lar, kuyruğa alma, oturum durumu) için yapılandırılmış, makinece okunabilir olaylardır. Günlüklerin yerini **almazlar**; metrikleri, izleri ve dışa aktarıcıları beslerler. Olaylar varsayılan olarak süreç içinde yayımlanır (kapatmak için `diagnostics.enabled: false` ayarını kullanın); bunların dışa aktarılması ayrı bir işlemdir.

Birbiriyle ilişkili iki yüzey:

- **OpenTelemetry dışa aktarımı** — metrikleri, izleri ve günlükleri OTLP/HTTP üzerinden OpenTelemetry uyumlu herhangi bir toplayıcıya veya arka uca (Datadog, Grafana, Honeycomb, New Relic, Tempo vb.) gönderir. Tam yapılandırma, sinyal kataloğu, metrik/yayılım adları, ortam değişkenleri ve gizlilik modeli özel bir sayfada yer alır:
  [OpenTelemetry dışa aktarımı](/tr/gateway/opentelemetry).
- **Tanılama bayrakları** — `logging.level` değerini yükseltmeden ek günlükleri `logging.file` konumuna yönlendiren hedefli hata ayıklama günlüğü bayraklarıdır. Bayraklar büyük/küçük harfe duyarsızdır ve joker karakterleri (`telegram.*`, `*`) destekler. `diagnostics.flags` altında veya `OPENCLAW_DIAGNOSTICS=...` ortam değişkeni geçersiz kılmasıyla yapılandırın. Tam kılavuz:
  [Tanılama bayrakları](/tr/diagnostics/flags).

Bir toplayıcıya OTLP dışa aktarımı için [OpenTelemetry dışa aktarımı](/tr/gateway/opentelemetry) sayfasına bakın.

## Sorun giderme ipuçları

- **Gateway'e erişilemiyor mu?** Önce `openclaw doctor` komutunu çalıştırın.
- **Günlükler boş mu?** Gateway'in çalıştığını ve `logging.file` içindeki dosya yoluna yazdığını doğrulayın.
- **Daha fazla ayrıntı mı gerekiyor?** `logging.level` değerini `debug` veya `trace` olarak ayarlayıp yeniden deneyin.

## İlgili

- [OpenTelemetry dışa aktarımı](/tr/gateway/opentelemetry) — OTLP/HTTP dışa aktarımı, metrik/yayılım kataloğu, gizlilik modeli
- [Tanılama bayrakları](/tr/diagnostics/flags) — hedefli hata ayıklama günlüğü bayrakları
- [Gateway günlük kaydı iç işleyişi](/tr/gateway/logging) — WS günlük stilleri, alt sistem önekleri ve konsol yakalama
- [Yapılandırma başvurusu](/tr/gateway/configuration-reference#diagnostics) — tam `diagnostics.*` alan başvurusu
