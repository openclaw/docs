---
read_when:
    - Günlük çıktısını veya biçimlerini değiştirme
    - CLI veya Gateway çıktısında hata ayıklama
summary: Günlükleme yüzeyleri, dosya günlükleri, WS günlük stilleri ve konsol biçimlendirmesi
title: Gateway günlük kaydı
x-i18n:
    generated_at: "2026-04-30T09:22:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9ce9c78201d2e26760282b08eacb17826b1eac84e80b99d3a9d5cbff4078b5b3
    source_path: gateway/logging.md
    workflow: 16
---

# Günlükleme

Kullanıcıya yönelik genel bakış (CLI + Control UI + yapılandırma) için bkz. [/logging](/tr/logging).

OpenClaw’ın iki günlük “yüzeyi” vardır:

- **Konsol çıktısı** (terminalde / Debug UI’da gördüğünüz).
- Gateway günlükleyicisi tarafından yazılan **dosya günlükleri** (JSON satırları).

## Dosya tabanlı günlükleyici

- Varsayılan dönen günlük dosyası `/tmp/openclaw/` altındadır (günde bir dosya): `openclaw-YYYY-MM-DD.log`
  - Tarih, Gateway ana makinesinin yerel saat dilimini kullanır.
- Etkin günlük dosyaları `logging.maxFileBytes` değerinde döndürülür (varsayılan: 100 MB); en fazla beş numaralı arşiv tutulur ve yeni bir etkin dosyaya yazmaya devam edilir.
- Günlük dosyası yolu ve seviyesi `~/.openclaw/openclaw.json` üzerinden yapılandırılabilir:
  - `logging.file`
  - `logging.level`

Dosya biçimi, satır başına bir JSON nesnesidir.

Control UI Günlükler sekmesi bu dosyayı Gateway üzerinden takip eder (`logs.tail`).
CLI da aynısını yapabilir:

```bash
openclaw logs --follow
```

**Ayrıntılı çıktı ve günlük seviyeleri**

- **Dosya günlükleri** yalnızca `logging.level` tarafından denetlenir.
- `--verbose` yalnızca **konsol ayrıntı düzeyini** (ve WS günlük stilini) etkiler; dosya günlük seviyesini **yükseltmez**.
- Yalnızca ayrıntılı çıktıda görünen ayrıntıları dosya günlüklerinde yakalamak için `logging.level` değerini `debug` veya `trace` olarak ayarlayın.

## Konsol yakalama

CLI, `console.log/info/warn/error/debug/trace` çağrılarını yakalayıp dosya günlüklerine yazar, stdout/stderr’e yazdırmaya devam eder.

Konsol ayrıntı düzeyini bağımsız olarak şu seçeneklerle ayarlayabilirsiniz:

- `logging.consoleLevel` (varsayılan `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Redaksiyon

OpenClaw, günlük veya oturum dökümü çıktısı süreçten ayrılmadan önce hassas belirteçleri maskeleyebilir. Bu günlük redaksiyon ilkesi konsol, dosya günlüğü, OTLP günlük kaydı ve oturum dökümü metin hedeflerinde uygulanır; böylece eşleşen gizli değerler JSONL satırları veya iletiler diske yazılmadan önce maskelenir.

- `logging.redactSensitive`: `off` | `tools` (varsayılan: `tools`)
- `logging.redactPatterns`: regex dizeleri dizisi (varsayılanları geçersiz kılar)
  - Ham regex dizeleri (otomatik `gi`) kullanın veya özel bayraklara ihtiyacınız varsa `/pattern/flags` kullanın.
  - Eşleşmeler, ilk 6 + son 4 karakter korunarak maskelenir (uzunluk >= 18); aksi durumda `***`.
  - Varsayılanlar yaygın anahtar atamalarını, CLI bayraklarını, JSON alanlarını, bearer başlıklarını, PEM bloklarını ve popüler belirteç öneklerini kapsar.

Bazı güvenlik sınırları `logging.redactSensitive` değerinden bağımsız olarak her zaman redaksiyon uygular. Buna Control UI araç çağrısı olayları, `sessions_history` araç çıktısı, tanılama destek dışa aktarımları, sağlayıcı hata gözlemleri, exec onay komutu gösterimi ve Gateway WebSocket protokol günlükleri dahildir. Bu yüzeyler ek desenler olarak yine `logging.redactPatterns` kullanabilir, ancak `redactSensitive: "off"` ham gizli değerler yayımlamalarını sağlamaz.

## Gateway WebSocket günlükleri

Gateway, WebSocket protokol günlüklerini iki modda yazdırır:

- **Normal mod (`--verbose` yok)**: yalnızca “ilginç” RPC sonuçları yazdırılır:
  - hatalar (`ok=false`)
  - yavaş çağrılar (varsayılan eşik: `>= 50ms`)
  - ayrıştırma hataları
- **Ayrıntılı mod (`--verbose`)**: tüm WS istek/yanıt trafiğini yazdırır.

### WS günlük stili

`openclaw gateway`, Gateway başına bir stil anahtarını destekler:

- `--ws-log auto` (varsayılan): normal mod iyileştirilmiştir; ayrıntılı mod kompakt çıktı kullanır
- `--ws-log compact`: ayrıntılı modda kompakt çıktı (eşleştirilmiş istek/yanıt)
- `--ws-log full`: ayrıntılı modda kare başına tam çıktı
- `--compact`: `--ws-log compact` için takma ad

Örnekler:

```bash
# optimized (only errors/slow)
openclaw gateway

# show all WS traffic (paired)
openclaw gateway --verbose --ws-log compact

# show all WS traffic (full meta)
openclaw gateway --verbose --ws-log full
```

## Konsol biçimlendirme (alt sistem günlükleme)

Konsol biçimlendirici **TTY duyarlıdır** ve tutarlı, önekli satırlar yazdırır. Alt sistem günlükleyicileri çıktıyı gruplanmış ve taranabilir tutar.

Davranış:

- Her satırda **alt sistem önekleri** (örn. `[gateway]`, `[canvas]`, `[tailscale]`)
- **Alt sistem renkleri** (alt sistem başına kararlı) ve seviye renklendirmesi
- **Çıktı TTY olduğunda veya ortam zengin terminal gibi göründüğünde renk** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), `NO_COLOR` değerine uyar
- **Kısaltılmış alt sistem önekleri**: baştaki `gateway/` + `channels/` bölümlerini düşürür, son 2 segmenti tutar (örn. `whatsapp/outbound`)
- **Alt sisteme göre alt günlükleyiciler** (otomatik önek + yapılandırılmış alan `{ subsystem }`)
- QR/UX çıktısı için **`logRaw()`** (önek yok, biçimlendirme yok)
- **Konsol stilleri** (örn. `pretty | compact | json`)
- Dosya günlük seviyesinden ayrı **konsol günlük seviyesi** (`logging.level` `debug`/`trace` olarak ayarlandığında dosya tam ayrıntıyı korur)
- **WhatsApp ileti gövdeleri** `debug` seviyesinde günlüğe kaydedilir (görmek için `--verbose` kullanın)

Bu, etkileşimli çıktıyı taranabilir hale getirirken mevcut dosya günlüklerini kararlı tutar.

## İlgili

- [Günlükleme](/tr/logging)
- [OpenTelemetry dışa aktarımı](/tr/gateway/opentelemetry)
- [Tanılama dışa aktarımı](/tr/gateway/diagnostics)
