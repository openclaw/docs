---
read_when:
    - OpenClaw günlükleme hakkında başlangıç seviyesindekiler için anlaşılır bir genel bakışa ihtiyacınız var
    - Günlük düzeylerini, biçimlerini veya maskelemeyi yapılandırmak istiyorsunuz
    - Sorun gideriyorsunuz ve günlükleri hızlıca bulmanız gerekiyor
summary: Dosya günlükleri, konsol çıktısı, CLI kuyruk takibi ve Control UI Günlükler sekmesi
title: Günlükleme
x-i18n:
    generated_at: "2026-04-30T09:31:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 916fb03219d571f0302560a4cb6755940575c92fff0b4eab024b9dad53f841ce
    source_path: logging.md
    workflow: 16
---

OpenClaw'ın iki ana günlük yüzeyi vardır:

- Gateway tarafından yazılan **dosya günlükleri** (JSON satırları).
- Terminallerde ve Gateway Debug UI'da gösterilen **konsol çıktısı**.

Control UI **Logs** sekmesi gateway dosya günlüğünü takip eder. Bu sayfa günlüklerin nerede bulunduğunu, nasıl okunacağını ve günlük seviyeleri ile biçimlerinin nasıl yapılandırılacağını açıklar.

## Günlüklerin bulunduğu yer

Varsayılan olarak Gateway, dönen bir günlük dosyasını şuraya yazar:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

Tarih, gateway ana makinesinin yerel saat dilimini kullanır.

Her dosya `logging.maxFileBytes` değerine ulaştığında döner (varsayılan: 100 MB). OpenClaw, etkin dosyanın yanında en fazla beş numaralı arşiv tutar, örneğin `openclaw-YYYY-MM-DD.1.log`, ve tanılamaları bastırmak yerine yeni bir etkin günlüğe yazmaya devam eder.

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

Gateway günlük dosyasını RPC üzerinden takip etmek için CLI'ı kullanın:

```bash
openclaw logs --follow
```

Kullanışlı mevcut seçenekler:

- `--local-time`: zaman damgalarını yerel saat diliminizde işler
- `--url <url>` / `--token <token>` / `--timeout <ms>`: standart Gateway RPC bayrakları
- `--expect-final`: agent destekli RPC son yanıt bekleme bayrağı (paylaşılan istemci katmanı üzerinden burada kabul edilir)

Çıktı modları:

- **TTY oturumları**: güzel biçimlendirilmiş, renklendirilmiş, yapılandırılmış günlük satırları.
- **TTY olmayan oturumlar**: düz metin.
- `--json`: satırla ayrılmış JSON (satır başına bir günlük olayı).
- `--plain`: TTY oturumlarında düz metni zorunlu kılar.
- `--no-color`: ANSI renklerini devre dışı bırakır.

Açık bir `--url` ilettiğinizde CLI, yapılandırma veya ortam kimlik bilgilerini otomatik olarak uygulamaz; hedef Gateway kimlik doğrulaması gerektiriyorsa `--token` değerini kendiniz ekleyin.

JSON modunda CLI, `type` etiketli nesneler üretir:

- `meta`: akış meta verileri (dosya, imleç, boyut)
- `log`: ayrıştırılmış günlük girdisi
- `notice`: kesilme / döndürme ipuçları
- `raw`: ayrıştırılmamış günlük satırı

Örtük local loopback Gateway eşleştirme isterse, bağlantı sırasında kapanırsa veya `logs.tail` yanıt vermeden önce zaman aşımına uğrarsa `openclaw logs`, yapılandırılmış Gateway dosya günlüğüne otomatik olarak geri döner. Açık `--url` hedefleri bu geri dönüşü kullanmaz.

Gateway erişilemezse CLI, şunu çalıştırmak için kısa bir ipucu yazdırır:

```bash
openclaw doctor
```

### Control UI (web)

Control UI'nin **Logs** sekmesi aynı dosyayı `logs.tail` kullanarak takip eder. Nasıl açılacağını görmek için [/web/control-ui](/tr/web/control-ui) sayfasına bakın.

### Yalnızca kanal günlükleri

Kanal etkinliğini filtrelemek için (WhatsApp/Telegram/vb) şunu kullanın:

```bash
openclaw channels logs --channel whatsapp
```

## Günlük biçimleri

### Dosya günlükleri (JSONL)

Günlük dosyasındaki her satır bir JSON nesnesidir. CLI ve Control UI, yapılandırılmış çıktıyı (saat, seviye, alt sistem, ileti) işlemek için bu girdileri ayrıştırır.

Dosya günlüğü JSONL kayıtları, kullanılabilir olduğunda makine tarafından filtrelenebilir üst düzey alanlar da içerir:

- `hostname`: gateway ana makine adı.
- `message`: tam metin arama için düzleştirilmiş günlük iletisi metni.
- `agent_id`: günlük çağrısı agent bağlamı taşıdığında etkin agent kimliği.
- `session_id`: günlük çağrısı oturum bağlamı taşıdığında etkin oturum kimliği/anahtarı.
- `channel`: günlük çağrısı kanal bağlamı taşıdığında etkin kanal.

OpenClaw, özgün yapılandırılmış günlük argümanlarını bu alanların yanında korur; böylece numaralı tslog argüman anahtarlarını okuyan mevcut ayrıştırıcılar çalışmaya devam eder.

### Konsol çıktısı

Konsol günlükleri **TTY uyumludur** ve okunabilirlik için biçimlendirilir:

- Alt sistem önekleri (ör. `gateway/channels/whatsapp`)
- Seviye renklendirme (info/warn/error)
- İsteğe bağlı kompakt veya JSON modu

Konsol biçimlendirmesi `logging.consoleStyle` tarafından denetlenir.

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

## Günlüğe kaydetmeyi yapılandırma

Tüm günlük yapılandırması `~/.openclaw/openclaw.json` içinde `logging` altında bulunur.

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

### Günlük seviyeleri

- `logging.level`: **dosya günlükleri** (JSONL) seviyesi.
- `logging.consoleLevel`: **konsol** ayrıntı seviyesi.

İkisini de **`OPENCLAW_LOG_LEVEL`** ortam değişkeniyle geçersiz kılabilirsiniz (ör. `OPENCLAW_LOG_LEVEL=debug`). Ortam değişkeni yapılandırma dosyasına göre önceliklidir, böylece `openclaw.json` dosyasını düzenlemeden tek bir çalıştırma için ayrıntı seviyesini artırabilirsiniz. Ayrıca genel CLI seçeneği **`--log-level <level>`** değerini de iletebilirsiniz (örneğin, `openclaw --log-level debug gateway run`); bu, ilgili komut için ortam değişkenini geçersiz kılar.

`--verbose` yalnızca konsol çıktısını ve WS günlük ayrıntı düzeyini etkiler; dosya günlük seviyelerini değiştirmez.

### İz korelasyonu

Dosya günlükleri JSONL'dir. Bir günlük çağrısı geçerli bir tanılama iz bağlamı taşıdığında OpenClaw, iz alanlarını üst düzey JSON anahtarları olarak yazar (`traceId`, `spanId`, `parentSpanId`, `traceFlags`); böylece harici günlük işleyiciler satırı OTEL span'leri ve sağlayıcı `traceparent` yayılımıyla ilişkilendirebilir.

Gateway HTTP istekleri ve Gateway WebSocket çerçeveleri dahili bir istek iz kapsamı oluşturur. Bu async kapsam içinde yayımlanan günlükler ve tanılama olayları, açık bir iz bağlamı iletmediklerinde istek izini devralır. Agent çalıştırma ve model çağrısı izleri etkin istek izinin çocukları olur; böylece yerel günlükler, tanılama anlık görüntüleri, OTEL span'leri ve güvenilir sağlayıcı `traceparent` başlıkları ham istek veya model içeriği günlüğe kaydedilmeden `traceId` ile birleştirilebilir.

### Model çağrısı boyutu ve zamanlaması

Model çağrısı tanılamaları, ham istem veya yanıt içeriğini yakalamadan sınırlı istek/yanıt ölçümleri kaydeder:

- `requestPayloadBytes`: son model istek yükünün UTF-8 bayt boyutu
- `responseStreamBytes`: akışa alınan model yanıt olaylarının UTF-8 bayt boyutu
- `timeToFirstByteMs`: ilk akışa alınan yanıt olayından önce geçen süre
- `durationMs`: toplam model çağrısı süresi

Tanılama dışa aktarımı etkinleştirildiğinde bu alanlar tanılama anlık görüntüleri, model çağrısı Plugin kancaları ve OTEL model çağrısı span'leri/metrikleri için kullanılabilir.

### Konsol stilleri

`logging.consoleStyle`:

- `pretty`: insan dostu, renkli, zaman damgalı.
- `compact`: daha sıkı çıktı (uzun oturumlar için en iyisi).
- `json`: satır başına JSON (günlük işleyiciler için).

### Redaksiyon

OpenClaw, hassas token'ları konsol çıktısına, dosya günlüklerine, OTLP günlük kayıtlarına, kalıcı oturum transkript metnine veya Control UI araç olayı yüklerine (araç başlangıç argümanları, kısmi/son sonuç yükleri, türetilmiş exec çıktısı ve yama özetleri) ulaşmadan önce redakte edebilir:

- `logging.redactSensitive`: `off` | `tools` (varsayılan: `tools`)
- `logging.redactPatterns`: varsayılan kümeyi geçersiz kılacak regex dizeleri listesi. Özel desenler, Control UI araç yükleri için yerleşik varsayılanların üzerine uygulanır; bu nedenle desen eklemek, varsayılanların zaten yakaladığı değerlerin redaksiyonunu asla zayıflatmaz.

Dosya günlükleri ve oturum transkriptleri JSONL olarak kalır, ancak eşleşen gizli değerler satır veya ileti diske yazılmadan önce maskelenir. Redaksiyon en iyi çaba ilkesine dayanır: metin içeren ileti içeriğine ve günlük dizelerine uygulanır, her tanımlayıcıya veya ikili yük alanına değil.

`logging.redactSensitive: "off"` yalnızca bu genel günlük/transkript politikasını devre dışı bırakır. OpenClaw, UI istemcilerine, destek paketlerine, tanılama gözlemcilerine, onay istemlerine veya agent araçlarına gösterilebilecek güvenlik sınırı yüklerini yine de redakte eder. Örnekler arasında Control UI araç çağrısı olayları, `sessions_history` çıktısı, tanılama destek dışa aktarımları, sağlayıcı hata gözlemleri, exec onay komutu gösterimi ve Gateway WebSocket protokol günlükleri bulunur. Özel `logging.redactPatterns`, bu yüzeylerde projeye özgü desenler eklemeye devam edebilir.

## Tanılamalar ve OpenTelemetry

Tanılamalar, model çalıştırmaları ve ileti akışı telemetrisi (Webhook'lar, kuyruğa alma, oturum durumu) için yapılandırılmış, makine tarafından okunabilir olaylardır. Günlüklerin yerini **almazlar**; metrikleri, izleri ve dışa aktarıcıları beslerler. Olaylar, dışa aktarılıp aktarılmadıklarına bakılmaksızın işlem içinde yayımlanır.

İki bitişik yüzey:

- **OpenTelemetry dışa aktarımı** — metrikleri, izleri ve günlükleri OTLP/HTTP üzerinden herhangi bir OpenTelemetry uyumlu toplayıcıya veya arka uca (Grafana, Datadog, Honeycomb, New Relic, Tempo, vb.) gönderin. Tam yapılandırma, sinyal kataloğu, metrik/span adları, ortam değişkenleri ve gizlilik modeli ayrılmış bir sayfada bulunur: [OpenTelemetry dışa aktarımı](/tr/gateway/opentelemetry).
- **Tanılama bayrakları** — `logging.level` yükseltilmeden ek günlükleri `logging.file` konumuna yönlendiren hedefli debug günlük bayrakları. Bayraklar büyük/küçük harfe duyarsızdır ve joker karakterleri destekler (`telegram.*`, `*`). `diagnostics.flags` altında veya `OPENCLAW_DIAGNOSTICS=...` ortam geçersiz kılmasıyla yapılandırın. Tam kılavuz: [Tanılama bayrakları](/tr/diagnostics/flags).

OTLP dışa aktarımı olmadan Plugin'ler veya özel hedefler için tanılama olaylarını etkinleştirmek üzere:

```json5
{
  diagnostics: { enabled: true },
}
```

Bir toplayıcıya OTLP dışa aktarımı için [OpenTelemetry dışa aktarımı](/tr/gateway/opentelemetry) sayfasına bakın.

## Sorun giderme ipuçları

- **Gateway erişilebilir değil mi?** Önce `openclaw doctor` çalıştırın.
- **Günlükler boş mu?** Gateway'in çalıştığını ve `logging.file` içindeki dosya yoluna yazdığını kontrol edin.
- **Daha fazla ayrıntı mı gerekiyor?** `logging.level` değerini `debug` veya `trace` olarak ayarlayın ve yeniden deneyin.

## İlgili

- [OpenTelemetry dışa aktarımı](/tr/gateway/opentelemetry) — OTLP/HTTP dışa aktarımı, metrik/span kataloğu, gizlilik modeli
- [Tanılama bayrakları](/tr/diagnostics/flags) — hedefli debug günlük bayrakları
- [Gateway günlükleme iç yapısı](/tr/gateway/logging) — WS günlük stilleri, alt sistem önekleri ve konsol yakalama
- [Yapılandırma referansı](/tr/gateway/configuration-reference#diagnostics) — tam `diagnostics.*` alan referansı
