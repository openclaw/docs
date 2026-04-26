---
read_when:
    - OpenClaw günlüklemesine yeni başlayanlar için uygun bir genel bakışa ihtiyacınız var
    - Günlük düzeylerini, biçimlerini veya redaksiyonu yapılandırmak istiyorsunuz
    - Sorun gideriyorsunuz ve günlükleri hızlıca bulmanız gerekiyor
summary: Dosya günlükleri, konsol çıktısı, CLI tailing ve Control UI Günlükler sekmesi
title: Günlükleme
x-i18n:
    generated_at: "2026-04-26T11:34:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6fa55caa65a2a06a757e37ad64c5fd030f958cf6827596db5c183c6c6db2ed9b
    source_path: logging.md
    workflow: 15
---

OpenClaw'un iki ana günlük yüzeyi vardır:

- Gateway tarafından yazılan **dosya günlükleri** (JSON satırları).
- Terminallerde ve Gateway Debug UI'da gösterilen **konsol çıktısı**.

Control UI içindeki **Logs** sekmesi gateway dosya günlüğünü tail eder. Bu sayfa
günlüklerin nerede bulunduğunu, nasıl okunacağını ve günlük düzeyleri ile biçimlerinin nasıl yapılandırılacağını açıklar.

## Günlükler nerede bulunur

Varsayılan olarak Gateway, aşağıdaki konum altında dönen bir günlük dosyası yazar:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

Tarih, gateway ana makinesinin yerel saat dilimini kullanır.

Her dosya `logging.maxFileBytes` değerine ulaştığında döner (varsayılan: 100 MB).
OpenClaw etkin dosyanın yanında `openclaw-YYYY-MM-DD.1.log` gibi beşe kadar numaralı arşiv tutar
ve tanılamayı bastırmak yerine yeni bir etkin günlük dosyasına yazmaya devam eder.

Bunu `~/.openclaw/openclaw.json` içinde geçersiz kılabilirsiniz:

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## Günlükler nasıl okunur

### CLI: canlı tail (önerilir)

Gateway günlük dosyasını RPC üzerinden tail etmek için CLI kullanın:

```bash
openclaw logs --follow
```

Kullanışlı mevcut seçenekler:

- `--local-time`: zaman damgalarını yerel saat diliminizde gösterir
- `--url <url>` / `--token <token>` / `--timeout <ms>`: standart Gateway RPC bayrakları
- `--expect-final`: ajan destekli RPC nihai yanıt bekleme bayrağı (paylaşılan istemci katmanı üzerinden burada kabul edilir)

Çıktı modları:

- **TTY oturumları**: güzel, renkli, yapılandırılmış günlük satırları.
- **TTY olmayan oturumlar**: düz metin.
- `--json`: satır sınırlı JSON (satır başına bir günlük olayı).
- `--plain`: TTY oturumlarında düz metni zorlar.
- `--no-color`: ANSI renklerini devre dışı bırakır.

Açık bir `--url` verdiğinizde CLI, yapılandırma veya
ortam kimlik bilgilerini otomatik uygulamaz; hedef Gateway
auth gerektiriyorsa `--token` değerini kendiniz ekleyin.

JSON modunda CLI, `type` etiketli nesneler üretir:

- `meta`: akış metadata'sı (dosya, imleç, boyut)
- `log`: ayrıştırılmış günlük girdisi
- `notice`: kırpma / döndürme ipuçları
- `raw`: ayrıştırılmamış günlük satırı

Yerel loopback Gateway eşleştirme isterse `openclaw logs`,
yapılandırılmış yerel günlük dosyasına otomatik geri düşer. Açık `--url` hedefleri bu fallback'i kullanmaz.

Gateway'e ulaşılamıyorsa CLI, şunu çalıştırmanız için kısa bir ipucu yazdırır:

```bash
openclaw doctor
```

### Control UI (web)

Control UI'nin **Logs** sekmesi aynı dosyayı `logs.tail` kullanarak tail eder.
Nasıl açılacağı için bkz. [/web/control-ui](/tr/web/control-ui).

### Yalnızca kanal günlükleri

Kanal etkinliğini (WhatsApp/Telegram/vb.) filtrelemek için şunu kullanın:

```bash
openclaw channels logs --channel whatsapp
```

## Günlük biçimleri

### Dosya günlükleri (JSONL)

Günlük dosyasındaki her satır bir JSON nesnesidir. CLI ve Control UI bu
girdileri ayrıştırarak yapılandırılmış çıktı (zaman, düzey, alt sistem, mesaj) gösterir.

### Konsol çıktısı

Konsol günlükleri **TTY farkındadır** ve okunabilirlik için biçimlendirilir:

- Alt sistem önekleri (ör. `gateway/channels/whatsapp`)
- Düzey renklendirmesi (`info`/`warn`/`error`)
- İsteğe bağlı kompakt veya JSON modu

Konsol biçimlendirmesi `logging.consoleStyle` tarafından denetlenir.

### Gateway WebSocket günlükleri

`openclaw gateway`, RPC trafiği için WebSocket protokol günlüklemesine de sahiptir:

- normal mod: yalnızca ilginç sonuçlar (hatalar, ayrıştırma hataları, yavaş çağrılar)
- `--verbose`: tüm istek/yanıt trafiği
- `--ws-log auto|compact|full`: ayrıntılı gösterim stilini seçin
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

İkisini de **`OPENCLAW_LOG_LEVEL`** ortam değişkeni ile geçersiz kılabilirsiniz (ör. `OPENCLAW_LOG_LEVEL=debug`). Ortam değişkeni yapılandırma dosyasından önceliklidir, böylece `openclaw.json` dosyasını düzenlemeden tek bir çalıştırma için ayrıntıyı artırabilirsiniz. Ayrıca genel CLI seçeneği **`--log-level <level>`** da verebilirsiniz (örneğin `openclaw --log-level debug gateway run`); bu seçenek o komut için ortam değişkenini geçersiz kılar.

`--verbose` yalnızca konsol çıktısını ve WS günlük ayrıntısını etkiler; dosya günlük düzeylerini değiştirmez.

### Konsol stilleri

`logging.consoleStyle`:

- `pretty`: kullanıcı dostu, renkli, zaman damgalı.
- `compact`: daha sıkı çıktı (uzun oturumlar için en iyisi).
- `json`: satır başına JSON (günlük işleyicileri için).

### Redaksiyon

Araç özetleri, konsola ulaşmadan önce hassas token'ları redakte edebilir:

- `logging.redactSensitive`: `off` | `tools` (varsayılan: `tools`)
- `logging.redactPatterns`: varsayılan kümenin yerine geçecek regex dizeleri listesi

Redaksiyon, **konsol çıktısı**, **stderr yönlendirmeli
konsol tanılaması** ve **dosya günlükleri** için günlükleme sink'lerinde uygulanır. Dosya günlükleri JSONL olarak kalır, ancak eşleşen
gizli değerler satır diske yazılmadan önce maskelenir.

## Tanılama ve OpenTelemetry

Tanılama, model çalıştırmaları ve
mesaj akışı telemetrisi (Webhooks, kuyruklama, oturum durumu) için yapılandırılmış, makine tarafından okunabilir olaylardır. Günlüklerin **yerine geçmezler** — metrikleri, izleri ve export'ları beslerler. Olaylar siz export etseniz de etmeseniz de süreç içinde üretilir.

Birbirine bitişik iki yüzey:

- **OpenTelemetry export** — metrikleri, izleri ve günlükleri OTLP/HTTP üzerinden
  herhangi bir OpenTelemetry uyumlu collector veya arka uca gönderin (Grafana, Datadog,
  Honeycomb, New Relic, Tempo vb.). Tam yapılandırma, sinyal kataloğu,
  metric/span adları, ortam değişkenleri ve gizlilik modeli ayrı bir sayfada bulunur:
  [OpenTelemetry export](/tr/gateway/opentelemetry).
- **Tanılama bayrakları** — `logging.level` düzeyini yükseltmeden ek günlükleri
  `logging.file` içine yönlendiren hedefli hata ayıklama günlüğü bayraklarıdır. Bayraklar büyük/küçük harfe duyarsızdır
  ve joker karakterleri destekler (`telegram.*`, `*`). `diagnostics.flags`
  altında veya `OPENCLAW_DIAGNOSTICS=...` env geçersiz kılması ile yapılandırın. Tam kılavuz:
  [Diagnostics flags](/tr/diagnostics/flags).

Plugin'ler veya özel sink'ler için OTLP export olmadan tanılama olaylarını etkinleştirmek için:

```json5
{
  diagnostics: { enabled: true },
}
```

Bir collector'a OTLP export için bkz. [OpenTelemetry export](/tr/gateway/opentelemetry).

## Sorun giderme ipuçları

- **Gateway'e ulaşılamıyor mu?** Önce `openclaw doctor` çalıştırın.
- **Günlükler boş mu?** Gateway'in çalıştığını ve
  `logging.file` içindeki dosya yoluna yazdığını kontrol edin.
- **Daha fazla ayrıntı mı gerekiyor?** `logging.level` değerini `debug` veya `trace` yapın ve yeniden deneyin.

## İlgili

- [OpenTelemetry export](/tr/gateway/opentelemetry) — OTLP/HTTP export, metric/span kataloğu, gizlilik modeli
- [Diagnostics flags](/tr/diagnostics/flags) — hedefli hata ayıklama günlüğü bayrakları
- [Gateway logging internals](/tr/gateway/logging) — WS günlük stilleri, alt sistem önekleri ve konsol yakalama
- [Configuration reference](/tr/gateway/configuration-reference#diagnostics) — tam `diagnostics.*` alan başvurusu
