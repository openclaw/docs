---
read_when:
    - Günlükleme hakkında yeni başlayanlar için uygun bir genel bakışa ihtiyacınız var
    - Günlük düzeylerini veya biçimlerini yapılandırmak istiyorsunuz
    - Sorun gideriyorsunuz ve günlükleri hızlıca bulmanız gerekiyor
summary: 'Günlüklemeye genel bakış: dosya günlükleri, konsol çıktısı, CLI ile izleme ve Control UI'
title: Günlüklemeye genel bakış
x-i18n:
    generated_at: "2026-04-24T09:17:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9b6f274600bcb9f5597c91aa6c30512871105a3e0de446773394abbe27276058
    source_path: logging.md
    workflow: 15
---

# Günlükleme

OpenClaw'ın iki ana günlük yüzeyi vardır:

- Gateway tarafından yazılan **dosya günlükleri** (JSON satırları).
- Terminallerde ve Gateway Debug UI içinde gösterilen **konsol çıktısı**.

Control UI içindeki **Logs** sekmesi Gateway dosya günlüğünü izler. Bu sayfa,
günlüklerin nerede bulunduğunu, nasıl okunacağını ve günlük düzeyleri ile biçimlerinin nasıl yapılandırılacağını açıklar.

## Günlükler nerede bulunur

Varsayılan olarak Gateway, şu konum altında dönen bir günlük dosyası yazar:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

Tarih, gateway ana makinesinin yerel saat dilimini kullanır.

Bunu `~/.openclaw/openclaw.json` içinde geçersiz kılabilirsiniz:

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## Günlükler nasıl okunur

### CLI: canlı izleme önerilir

Gateway günlük dosyasını RPC üzerinden izlemek için CLI kullanın:

```bash
openclaw logs --follow
```

Yararlı mevcut seçenekler:

- `--local-time`: zaman damgalarını yerel saat diliminizde gösterir
- `--url <url>` / `--token <token>` / `--timeout <ms>`: standart Gateway RPC bayrakları
- `--expect-final`: agent destekli RPC son yanıt bekleme bayrağıdır (paylaşılan istemci katmanı üzerinden burada kabul edilir)

Çıktı modları:

- **TTY oturumları**: güzel, renkli, yapılandırılmış günlük satırları.
- **TTY olmayan oturumlar**: düz metin.
- `--json`: satır sınırlı JSON (satır başına bir günlük olayı).
- `--plain`: TTY oturumlarında düz metni zorlar.
- `--no-color`: ANSI renklerini devre dışı bırakır.

Açık bir `--url` verdiğinizde CLI, yapılandırma veya
ortam kimlik bilgilerini otomatik uygulamaz; hedef Gateway
kimlik doğrulama gerektiriyorsa `--token` değerini kendiniz ekleyin.

JSON modunda CLI, `type` etiketli nesneler üretir:

- `meta`: akış meta verileri (dosya, imleç, boyut)
- `log`: ayrıştırılmış günlük girdisi
- `notice`: kesilme / döndürme ipuçları
- `raw`: ayrıştırılmamış günlük satırı

Yerel local loopback Gateway eşleme isterse `openclaw logs`,
yapılandırılmış yerel günlük dosyasına otomatik olarak geri döner. Açık `--url` hedefleri bu geri dönüşü kullanmaz.

Gateway'e ulaşılamıyorsa CLI, şu komutun çalıştırılması için kısa bir ipucu yazdırır:

```bash
openclaw doctor
```

### Control UI web

Control UI içindeki **Logs** sekmesi, aynı dosyayı `logs.tail` kullanarak izler.
Nasıl açılacağı için bkz. [/web/control-ui](/tr/web/control-ui).

### Yalnızca kanal günlükleri

Kanal etkinliğini filtrelemek için (WhatsApp/Telegram/vb.) şunu kullanın:

```bash
openclaw channels logs --channel whatsapp
```

## Günlük biçimleri

### Dosya günlükleri JSONL

Günlük dosyasındaki her satır bir JSON nesnesidir. CLI ve Control UI bu
girdileri ayrıştırarak yapılandırılmış çıktı oluşturur (zaman, düzey, alt sistem, ileti).

### Konsol çıktısı

Konsol günlükleri **TTY farkındadır** ve okunabilirlik için biçimlendirilir:

- Alt sistem önekleri (ör. `gateway/channels/whatsapp`)
- Düzey renklendirmesi (`info`/`warn`/`error`)
- İsteğe bağlı compact veya JSON modu

Konsol biçimlendirmesi `logging.consoleStyle` tarafından denetlenir.

### Gateway WebSocket günlükleri

`openclaw gateway`, RPC trafiği için WebSocket protokol günlüklemesine de sahiptir:

- normal mod: yalnızca önemli sonuçlar (hatalar, ayrıştırma hataları, yavaş çağrılar)
- `--verbose`: tüm istek/yanıt trafiği
- `--ws-log auto|compact|full`: ayrıntılı gösterim stilini seçer
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

Her ikisini de **`OPENCLAW_LOG_LEVEL`** ortam değişkeniyle geçersiz kılabilirsiniz (ör. `OPENCLAW_LOG_LEVEL=debug`). Ortam değişkeni yapılandırma dosyasından daha önceliklidir; böylece `openclaw.json` dosyasını düzenlemeden tek bir çalıştırma için ayrıntı düzeyini artırabilirsiniz. Ayrıca genel CLI seçeneği **`--log-level <level>`** de verebilirsiniz (örneğin `openclaw --log-level debug gateway run`); bu, o komut için ortam değişkenini geçersiz kılar.

`--verbose` yalnızca konsol çıktısını ve WS günlük ayrıntı düzeyini etkiler; dosya günlük düzeylerini değiştirmez.

### Konsol stilleri

`logging.consoleStyle`:

- `pretty`: insan dostu, renkli ve zaman damgalı.
- `compact`: daha sıkı çıktı (uzun oturumlar için en iyisi).
- `json`: satır başına JSON (günlük işlemcileri için).

### Gizleme

Araç özetleri, konsola ulaşmadan önce hassas token'ları gizleyebilir:

- `logging.redactSensitive`: `off` | `tools` (varsayılan: `tools`)
- `logging.redactPatterns`: varsayılan kümenin yerine geçecek regex dizesi listesi

Gizleme yalnızca **konsol çıktısını** etkiler ve dosya günlüklerini değiştirmez.

## Tanılama + OpenTelemetry

Tanılama, model çalıştırmaları **ve**
ileti akışı telemetrisi (Webhook'lar, kuyruklama, oturum durumu) için yapılandırılmış, makine tarafından okunabilir olaylardır. Günlüklerin **yerini almazlar**; metrikleri, izleri ve diğer dışa aktarıcıları beslemek için vardırlar.

Tanılama olayları işlem içinde üretilir, ancak dışa aktarıcılar yalnızca
tanılama + dışa aktarıcı Plugin'i etkin olduğunda bağlanır.

### OpenTelemetry ve OTLP

- **OpenTelemetry (OTel)**: izler, metrikler ve günlükler için veri modeli + SDK'lar.
- **OTLP**: OTel verilerini bir toplayıcı/arka uca aktarmak için kullanılan kablo protokolü.
- OpenClaw bugün dışa aktarmayı **OTLP/HTTP (protobuf)** üzerinden yapar.

### Dışa aktarılan sinyaller

- **Metrikler**: sayaçlar + histogramlar (token kullanımı, ileti akışı, kuyruklama).
- **İzler**: model kullanımı + Webhook/ileti işleme için span'ler.
- **Günlükler**: `diagnostics.otel.logs` etkinleştirildiğinde OTLP üzerinden dışa aktarılır. Günlük
  hacmi yüksek olabilir; `logging.level` ve dışa aktarıcı filtrelerini göz önünde bulundurun.

### Tanılama olay kataloğu

Model kullanımı:

- `model.usage`: token'lar, maliyet, süre, bağlam, sağlayıcı/model/kanal, oturum kimlikleri.

İleti akışı:

- `webhook.received`: kanal başına Webhook girişi.
- `webhook.processed`: işlenmiş Webhook + süre.
- `webhook.error`: Webhook işleyici hataları.
- `message.queued`: işlenmek üzere kuyruğa alınan ileti.
- `message.processed`: sonuç + süre + isteğe bağlı hata.

Kuyruk + oturum:

- `queue.lane.enqueue`: komut kuyruğu hattına ekleme + derinlik.
- `queue.lane.dequeue`: komut kuyruğu hattından çıkarma + bekleme süresi.
- `session.state`: oturum durum geçişi + neden.
- `session.stuck`: oturum takıldı uyarısı + yaş.
- `run.attempt`: çalıştırma yeniden deneme/deneme meta verileri.
- `diagnostic.heartbeat`: toplu sayaçlar (Webhook'lar/kuyruk/oturum).

### Tanılamayı etkinleştirme dışa aktarıcı olmadan

Tanılama olaylarının Plugin'lere veya özel havuzlara sunulmasını istiyorsanız bunu kullanın:

```json
{
  "diagnostics": {
    "enabled": true
  }
}
```

### Tanılama bayrakları hedeflenmiş günlükler

`logging.level` değerini artırmadan ek, hedeflenmiş hata ayıklama günlüklerini açmak için bayrakları kullanın.
Bayraklar büyük/küçük harfe duyarsızdır ve joker karakterleri destekler (ör. `telegram.*` veya `*`).

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

Ortam değişkeniyle geçersiz kılma tek seferlik:

```
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

Notlar:

- Bayrak günlükleri standart günlük dosyasına gider (`logging.file` ile aynı).
- Çıktı yine de `logging.redactSensitive` uyarınca gizlenir.
- Tam kılavuz: [/diagnostics/flags](/tr/diagnostics/flags).

### OpenTelemetry'ye dışa aktarma

Tanılama, `diagnostics-otel` Plugin'i aracılığıyla (OTLP/HTTP) dışa aktarılabilir. Bu,
OTLP/HTTP kabul eden herhangi bir OpenTelemetry toplayıcısı/arka ucuyla çalışır.

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

- Plugin'i `openclaw plugins enable diagnostics-otel` ile de etkinleştirebilirsiniz.
- `protocol` şu anda yalnızca `http/protobuf` destekler. `grpc` yok sayılır.
- Metrikler; token kullanımı, maliyet, bağlam boyutu, çalıştırma süresi ve ileti akışı
  sayaçları/histogramlarını (Webhook'lar, kuyruklama, oturum durumu, kuyruk derinliği/bekleme) içerir.
- İzler/metrikler `traces` / `metrics` ile açılıp kapatılabilir (varsayılan: açık). İzler,
  etkinleştirildiğinde model kullanım span'lerinin yanı sıra Webhook/ileti işleme span'lerini içerir.
- Toplayıcınız kimlik doğrulama gerektiriyorsa `headers` ayarlayın.
- Desteklenen ortam değişkenleri: `OTEL_EXPORTER_OTLP_ENDPOINT`,
  `OTEL_SERVICE_NAME`, `OTEL_EXPORTER_OTLP_PROTOCOL`.

### Dışa aktarılan metrikler adlar + türler

Model kullanımı:

- `openclaw.tokens` (sayaç, öznitelikler: `openclaw.token`, `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`)
- `openclaw.cost.usd` (sayaç, öznitelikler: `openclaw.channel`, `openclaw.provider`,
  `openclaw.model`)
- `openclaw.run.duration_ms` (histogram, öznitelikler: `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram, öznitelikler: `openclaw.context`,
  `openclaw.channel`, `openclaw.provider`, `openclaw.model`)

İleti akışı:

- `openclaw.webhook.received` (sayaç, öznitelikler: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.webhook.error` (sayaç, öznitelikler: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (histogram, öznitelikler: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.message.queued` (sayaç, öznitelikler: `openclaw.channel`,
  `openclaw.source`)
- `openclaw.message.processed` (sayaç, öznitelikler: `openclaw.channel`,
  `openclaw.outcome`)
- `openclaw.message.duration_ms` (histogram, öznitelikler: `openclaw.channel`,
  `openclaw.outcome`)

Kuyruklar + oturumlar:

- `openclaw.queue.lane.enqueue` (sayaç, öznitelikler: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (sayaç, öznitelikler: `openclaw.lane`)
- `openclaw.queue.depth` (histogram, öznitelikler: `openclaw.lane` veya
  `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histogram, öznitelikler: `openclaw.lane`)
- `openclaw.session.state` (sayaç, öznitelikler: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (sayaç, öznitelikler: `openclaw.state`)
- `openclaw.session.stuck_age_ms` (histogram, öznitelikler: `openclaw.state`)
- `openclaw.run.attempt` (sayaç, öznitelikler: `openclaw.attempt`)

### Dışa aktarılan span'ler adlar + temel öznitelikler

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.sessionKey`, `openclaw.sessionId`
  - `openclaw.tokens.*` (`input`/`output`/`cache_read`/`cache_write`/`total`)
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

- İz örnekleme: `diagnostics.otel.sampleRate` (0.0–1.0, yalnızca kök span'ler).
- Metrik dışa aktarma aralığı: `diagnostics.otel.flushIntervalMs` (en az 1000ms).

### Protokol notları

- OTLP/HTTP uç noktaları `diagnostics.otel.endpoint` veya
  `OTEL_EXPORTER_OTLP_ENDPOINT` ile ayarlanabilir.
- Uç nokta zaten `/v1/traces` veya `/v1/metrics` içeriyorsa olduğu gibi kullanılır.
- Uç nokta zaten `/v1/logs` içeriyorsa günlükler için olduğu gibi kullanılır.
- `diagnostics.otel.logs`, ana günlükleyici çıktısı için OTLP günlük dışa aktarmasını etkinleştirir.

### Günlük dışa aktarma davranışı

- OTLP günlükleri, `logging.file` içine yazılan aynı yapılandırılmış kayıtları kullanır.
- `logging.level` değerine uyar (dosya günlük düzeyi). Konsol gizleme işlemi OTLP günlüklerine **uygulanmaz**.
- Yüksek hacimli kurulumlarda OTLP toplayıcı örnekleme/filtreleme tercih edilmelidir.

## Sorun giderme ipuçları

- **Gateway'e ulaşılamıyor mu?** Önce `openclaw doctor` çalıştırın.
- **Günlükler boş mu?** Gateway'in çalıştığını ve `logging.file`
  içindeki dosya yoluna yazdığını denetleyin.
- **Daha fazla ayrıntı mı gerekiyor?** `logging.level` değerini `debug` veya `trace` olarak ayarlayın ve yeniden deneyin.

## İlgili

- [Gateway günlükleme iç yapısı](/tr/gateway/logging) — WS günlük stilleri, alt sistem önekleri ve konsol yakalama
- [Tanılama](/tr/gateway/configuration-reference#diagnostics) — OpenTelemetry dışa aktarma ve önbellek izleme yapılandırması
