---
read_when:
    - Günlükleme hakkında başlangıç düzeyinde anlaşılır bir genel bakışa ihtiyacınız var
    - Günlük düzeylerini veya biçimlerini yapılandırmak istiyorsunuz
    - Sorun gideriyorsunuz ve günlükleri hızlıca bulmanız gerekiyor
summary: 'Günlükleme genel bakışı: dosya günlükleri, konsol çıktısı, CLI ile izleme ve Kontrol UI'
title: Logging Overview
x-i18n:
    generated_at: "2026-04-05T13:59:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3a5e3800b7c5128602d05d5a35df4f88c373cfbe9397cca7e7154fff56a7f7ef
    source_path: logging.md
    workflow: 15
---

# Logging

OpenClaw'ın iki ana günlük yüzeyi vardır:

- Gateway tarafından yazılan **dosya günlükleri** (JSON satırları).
- Terminallerde ve Gateway Debug UI'da gösterilen **konsol çıktısı**.

Kontrol UI içindeki **Logs** sekmesi gateway dosya günlüğünü izler. Bu sayfa,
günlüklerin nerede bulunduğunu, nasıl okunacağını ve günlük düzeyleriyle biçimlerinin nasıl yapılandırılacağını açıklar.

## Günlükler nerede bulunur

Varsayılan olarak Gateway, aşağıdaki konumda dönen bir günlük dosyası yazar:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

Tarih, gateway host'unun yerel saat dilimini kullanır.

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

Gateway günlük dosyasını RPC üzerinden izlemek için CLI kullanın:

```bash
openclaw logs --follow
```

Şu anda kullanışlı seçenekler:

- `--local-time`: zaman damgalarını yerel saat diliminizde gösterir
- `--url <url>` / `--token <token>` / `--timeout <ms>`: standart Gateway RPC bayrakları
- `--expect-final`: ajan destekli RPC son yanıt bekleme bayrağı (paylaşılan istemci katmanı üzerinden burada kabul edilir)

Çıkış modları:

- **TTY oturumları**: güzel biçimlendirilmiş, renkli, yapılandırılmış günlük satırları.
- **TTY olmayan oturumlar**: düz metin.
- `--json`: satır ayrımlı JSON (satır başına bir günlük olayı).
- `--plain`: TTY oturumlarında düz metni zorlar.
- `--no-color`: ANSI renklerini devre dışı bırakır.

Açık bir `--url` geçirdiğinizde CLI, yapılandırma veya
ortam kimlik bilgilerini otomatik uygulamaz; hedef Gateway
kimlik doğrulaması gerektiriyorsa `--token` değerini kendiniz ekleyin.

JSON modunda CLI, `type` etiketli nesneler üretir:

- `meta`: akış meta verileri (dosya, imleç, boyut)
- `log`: ayrıştırılmış günlük girdisi
- `notice`: kısaltma / döndürme ipuçları
- `raw`: ayrıştırılmamış günlük satırı

Yerel loopback Gateway eşleme isterse `openclaw logs`,
yapılandırılmış yerel günlük dosyasına otomatik olarak geri döner. Açık `--url`
hedefleri bu geri dönüşü kullanmaz.

Gateway'e ulaşılamıyorsa CLI, şunu çalıştırmanız için kısa bir ipucu yazdırır:

```bash
openclaw doctor
```

### Kontrol UI (web)

Kontrol UI içindeki **Logs** sekmesi aynı dosyayı `logs.tail` kullanarak izler.
Nasıl açılacağını görmek için [/web/control-ui](/web/control-ui) bölümüne bakın.

### Yalnızca kanal günlükleri

Kanal etkinliğini (WhatsApp/Telegram/vb.) filtrelemek için şunu kullanın:

```bash
openclaw channels logs --channel whatsapp
```

## Günlük biçimleri

### Dosya günlükleri (JSONL)

Günlük dosyasındaki her satır bir JSON nesnesidir. CLI ve Kontrol UI bu
girdileri ayrıştırarak yapılandırılmış çıktı oluşturur (zaman, düzey, alt sistem, mesaj).

### Konsol çıktısı

Konsol günlükleri **TTY farkındadır** ve okunabilirlik için biçimlendirilir:

- Alt sistem önekleri (örn. `gateway/channels/whatsapp`)
- Düzey renklendirmesi (info/warn/error)
- İsteğe bağlı compact veya JSON modu

Konsol biçimlendirmesi `logging.consoleStyle` ile denetlenir.

### Gateway WebSocket günlükleri

`openclaw gateway`, RPC trafiği için WebSocket protokol günlüklemesine de sahiptir:

- normal mod: yalnızca önemli sonuçlar (hatalar, ayrıştırma hataları, yavaş çağrılar)
- `--verbose`: tüm istek/yanıt trafiği
- `--ws-log auto|compact|full`: ayrıntılı oluşturma stilini seçer
- `--compact`: `--ws-log compact` için takma addır

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

Her ikisini de **`OPENCLAW_LOG_LEVEL`** ortam değişkeniyle geçersiz kılabilirsiniz (örn. `OPENCLAW_LOG_LEVEL=debug`). Ortam değişkeni yapılandırma dosyasına göre önceliklidir; böylece `openclaw.json` düzenlemeden tek bir çalıştırma için ayrıntı düzeyini artırabilirsiniz. Ayrıca genel CLI seçeneği **`--log-level <level>`** de geçebilirsiniz (örneğin `openclaw --log-level debug gateway run`); bu, o komut için ortam değişkenini geçersiz kılar.

`--verbose` yalnızca konsol çıktısını ve WS günlük ayrıntı düzeyini etkiler; dosya günlük düzeylerini değiştirmez.

### Konsol stilleri

`logging.consoleStyle`:

- `pretty`: insan dostu, renkli, zaman damgalı.
- `compact`: daha sıkı çıktı (uzun oturumlar için en iyisi).
- `json`: satır başına JSON (günlük işlemcileri için).

### Redaksiyon

Araç özetleri, hassas token'ları konsola ulaşmadan önce redakte edebilir:

- `logging.redactSensitive`: `off` | `tools` (varsayılan: `tools`)
- `logging.redactPatterns`: varsayılan kümenin yerine geçecek regex dizgeleri listesi

Redaksiyon **yalnızca konsol çıktısını** etkiler ve dosya günlüklerini değiştirmez.

## Tanılama + OpenTelemetry

Tanılama, model çalıştırmaları **ve**
mesaj akışı telemetrisi (webhook'lar, kuyruklama, oturum durumu) için yapılandırılmış, makine tarafından okunabilir olaylardır. Günlüklerin
yerine geçmezler; metrikleri, izleri ve diğer dışa aktarıcıları beslemek için vardırlar.

Tanılama olayları süreç içinde üretilir, ancak dışa aktarıcılar yalnızca
tanılama + dışa aktarıcı eklentisi etkin olduğunda bağlanır.

### OpenTelemetry ve OTLP

- **OpenTelemetry (OTel)**: izler, metrikler ve günlükler için veri modeli + SDK'ler.
- **OTLP**: OTel verilerini bir toplayıcıya/arka uca aktarmak için kullanılan tel protokolü.
- OpenClaw bugün **OTLP/HTTP (protobuf)** üzerinden dışa aktarır.

### Dışa aktarılan sinyaller

- **Metrikler**: sayaçlar + histogramlar (token kullanımı, mesaj akışı, kuyruklama).
- **İzler**: model kullanımı + webhook/mesaj işleme için span'lar.
- **Günlükler**: `diagnostics.otel.logs` etkin olduğunda OTLP üzerinden dışa aktarılır. Günlük
  hacmi yüksek olabilir; `logging.level` ve dışa aktarıcı filtrelerini göz önünde bulundurun.

### Tanılama olay kataloğu

Model kullanımı:

- `model.usage`: token'lar, maliyet, süre, bağlam, sağlayıcı/model/kanal, oturum kimlikleri.

Mesaj akışı:

- `webhook.received`: kanal başına webhook girişi.
- `webhook.processed`: işlenen webhook + süre.
- `webhook.error`: webhook işleyici hataları.
- `message.queued`: işlenmek üzere kuyruğa alınan mesaj.
- `message.processed`: sonuç + süre + isteğe bağlı hata.

Kuyruk + oturum:

- `queue.lane.enqueue`: komut kuyruğu hattına ekleme + derinlik.
- `queue.lane.dequeue`: komut kuyruğu hattından çıkarma + bekleme süresi.
- `session.state`: oturum durumu geçişi + neden.
- `session.stuck`: oturum takılı kaldı uyarısı + yaş.
- `run.attempt`: çalışma yeniden deneme/girişim meta verileri.
- `diagnostic.heartbeat`: toplu sayaçlar (webhook'lar/kuyruk/oturum).

### Tanılamayı etkinleştirme (dışa aktarıcı yok)

Tanılama olaylarının eklentiler veya özel hedefler için kullanılabilir olmasını istiyorsanız bunu kullanın:

```json
{
  "diagnostics": {
    "enabled": true
  }
}
```

### Tanılama bayrakları (hedefli günlükler)

`logging.level` değerini yükseltmeden ek, hedefli hata ayıklama günlüklerini açmak için bayraklar kullanın.
Bayraklar büyük/küçük harf duyarsızdır ve joker karakterleri destekler (örn. `telegram.*` veya `*`).

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

Ortam değişkeni geçersiz kılması (tek seferlik):

```
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

Notlar:

- Bayrak günlükleri standart günlük dosyasına gider (`logging.file` ile aynı).
- Çıktı yine de `logging.redactSensitive` uyarınca redakte edilir.
- Tam kılavuz: [/diagnostics/flags](/diagnostics/flags).

### OpenTelemetry'e dışa aktarma

Tanılama, `diagnostics-otel` eklentisi (OTLP/HTTP) üzerinden dışa aktarılabilir. Bu,
OTLP/HTTP kabul eden tüm OpenTelemetry toplayıcıları/arka uçlarıyla çalışır.

```json
{
  "plugins": {
    "allow": ["diagnostics-otel"],
    "entries": {
      "diagnostics-otel": {
        "enabled": true
      }
    }
  },
  "diagnostics": {
    "enabled": true,
    "otel": {
      "enabled": true,
      "endpoint": "http://otel-collector:4318",
      "protocol": "http/protobuf",
      "serviceName": "openclaw-gateway",
      "traces": true,
      "metrics": true,
      "logs": true,
      "sampleRate": 0.2,
      "flushIntervalMs": 60000
    }
  }
}
```

Notlar:

- Eklentiyi `openclaw plugins enable diagnostics-otel` ile de etkinleştirebilirsiniz.
- `protocol` şu anda yalnızca `http/protobuf` destekler. `grpc` yok sayılır.
- Metrikler; token kullanımı, maliyet, bağlam boyutu, çalışma süresi ve mesaj akışı
  sayaçları/histogramlarını içerir (webhook'lar, kuyruklama, oturum durumu, kuyruk derinliği/bekleme).
- İzler/metrikler `traces` / `metrics` ile açılıp kapatılabilir (varsayılan: açık). İzler,
  etkinleştirildiğinde model kullanımı span'larının yanı sıra webhook/mesaj işleme span'larını da içerir.
- Toplayıcınız kimlik doğrulaması gerektiriyorsa `headers` ayarlayın.
- Desteklenen ortam değişkenleri: `OTEL_EXPORTER_OTLP_ENDPOINT`,
  `OTEL_SERVICE_NAME`, `OTEL_EXPORTER_OTLP_PROTOCOL`.

### Dışa aktarılan metrikler (adlar + türler)

Model kullanımı:

- `openclaw.tokens` (counter, öznitelikler: `openclaw.token`, `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`)
- `openclaw.cost.usd` (counter, öznitelikler: `openclaw.channel`, `openclaw.provider`,
  `openclaw.model`)
- `openclaw.run.duration_ms` (histogram, öznitelikler: `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram, öznitelikler: `openclaw.context`,
  `openclaw.channel`, `openclaw.provider`, `openclaw.model`)

Mesaj akışı:

- `openclaw.webhook.received` (counter, öznitelikler: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.webhook.error` (counter, öznitelikler: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (histogram, öznitelikler: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.message.queued` (counter, öznitelikler: `openclaw.channel`,
  `openclaw.source`)
- `openclaw.message.processed` (counter, öznitelikler: `openclaw.channel`,
  `openclaw.outcome`)
- `openclaw.message.duration_ms` (histogram, öznitelikler: `openclaw.channel`,
  `openclaw.outcome`)

Kuyruklar + oturumlar:

- `openclaw.queue.lane.enqueue` (counter, öznitelikler: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (counter, öznitelikler: `openclaw.lane`)
- `openclaw.queue.depth` (histogram, öznitelikler: `openclaw.lane` veya
  `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histogram, öznitelikler: `openclaw.lane`)
- `openclaw.session.state` (counter, öznitelikler: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (counter, öznitelikler: `openclaw.state`)
- `openclaw.session.stuck_age_ms` (histogram, öznitelikler: `openclaw.state`)
- `openclaw.run.attempt` (counter, öznitelikler: `openclaw.attempt`)

### Dışa aktarılan span'lar (adlar + temel öznitelikler)

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.sessionKey`, `openclaw.sessionId`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
- `openclaw.webhook.processed`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`
- `openclaw.webhook.error`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`,
    `openclaw.error`
- `openclaw.message.processed`
  - `openclaw.channel`, `openclaw.outcome`, `openclaw.chatId`,
    `openclaw.messageId`, `openclaw.sessionKey`, `openclaw.sessionId`,
    `openclaw.reason`
- `openclaw.session.stuck`
  - `openclaw.state`, `openclaw.ageMs`, `openclaw.queueDepth`,
    `openclaw.sessionKey`, `openclaw.sessionId`

### Örnekleme + boşaltma

- İz örnekleme: `diagnostics.otel.sampleRate` (0.0–1.0, yalnızca kök span'lar).
- Metrik dışa aktarma aralığı: `diagnostics.otel.flushIntervalMs` (en az 1000ms).

### Protokol notları

- OTLP/HTTP uç noktaları `diagnostics.otel.endpoint` veya
  `OTEL_EXPORTER_OTLP_ENDPOINT` üzerinden ayarlanabilir.
- Uç nokta zaten `/v1/traces` veya `/v1/metrics` içeriyorsa olduğu gibi kullanılır.
- Uç nokta zaten `/v1/logs` içeriyorsa günlükler için olduğu gibi kullanılır.
- `diagnostics.otel.logs`, ana günlükleyici çıktısı için OTLP günlük dışa aktarmayı etkinleştirir.

### Günlük dışa aktarma davranışı

- OTLP günlükleri, `logging.file` içine yazılan aynı yapılandırılmış kayıtları kullanır.
- `logging.level` değerine uyar (dosya günlük düzeyi). Konsol redaksiyonu OTLP günlüklerine **uygulanmaz**.
- Yüksek hacimli kurulumlar OTLP toplayıcı örnekleme/filtrelemeyi tercih etmelidir.

## Sorun giderme ipuçları

- **Gateway'e ulaşılamıyor mu?** Önce `openclaw doctor` çalıştırın.
- **Günlükler boş mu?** Gateway'in çalıştığını ve
  `logging.file` içindeki dosya yoluna yazdığını denetleyin.
- **Daha fazla ayrıntı mı gerekiyor?** `logging.level` değerini `debug` veya `trace` olarak ayarlayın ve tekrar deneyin.

## İlgili

- [Gateway Logging Internals](/gateway/logging) — WS günlük stilleri, alt sistem önekleri ve konsol yakalama
- [Diagnostics](/gateway/configuration-reference#diagnostics) — OpenTelemetry dışa aktarma ve önbellek iz yapılandırması
