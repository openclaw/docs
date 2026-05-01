---
read_when:
    - Günlükleme çıktısını veya biçimlerini değiştirme
    - CLI veya Gateway çıktısında hata ayıklama
summary: Günlükleme yüzeyleri, dosya günlükleri, WS günlük stilleri ve konsol biçimlendirmesi
title: Gateway günlük kaydı
x-i18n:
    generated_at: "2026-05-01T09:00:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: f843812a41c25f9ca1884543ad3a5663c8e0bc327027cbd2b58ea6557c466aa9
    source_path: gateway/logging.md
    workflow: 16
---

# Günlükleme

Kullanıcıya yönelik genel bakış (CLI + Control UI + yapılandırma) için bkz. [/logging](/tr/logging).

OpenClaw'ın iki günlük “yüzeyi” vardır:

- **Konsol çıktısı** (terminalde / Debug UI'de gördüğünüz).
- **Dosya günlükleri** (JSON satırları), Gateway günlükleyicisi tarafından yazılır.

## Dosya tabanlı günlükleyici

- Varsayılan dönen günlük dosyası `/tmp/openclaw/` altında bulunur (günde bir dosya): `openclaw-YYYY-MM-DD.log`
  - Tarih, Gateway ana makinesinin yerel saat dilimini kullanır.
- Etkin günlük dosyaları `logging.maxFileBytes` değerinde döner (varsayılan: 100 MB); en fazla beş numaralı arşiv tutulur ve yeni bir etkin dosyaya yazmaya devam edilir.
- Günlük dosyası yolu ve seviyesi `~/.openclaw/openclaw.json` üzerinden yapılandırılabilir:
  - `logging.file`
  - `logging.level`

Dosya biçimi, satır başına bir JSON nesnesidir.

Control UI Günlükler sekmesi bu dosyayı Gateway üzerinden takip eder (`logs.tail`).
CLI da aynısını yapabilir:

```bash
openclaw logs --follow
```

**Ayrıntılı ve günlük seviyeleri**

- **Dosya günlükleri** yalnızca `logging.level` tarafından denetlenir.
- `--verbose` yalnızca **konsol ayrıntı düzeyini** (ve WS günlük stilini) etkiler; dosya günlük seviyesini **yükseltmez**.
- Yalnızca ayrıntılı modda görünen ayrıntıları dosya günlüklerinde yakalamak için `logging.level` değerini `debug` veya `trace` olarak ayarlayın.

## Konsol yakalama

CLI, `console.log/info/warn/error/debug/trace` çağrılarını yakalar ve stdout/stderr'ye yazdırmaya devam ederken bunları dosya günlüklerine yazar.

Konsol ayrıntı düzeyini bağımsız olarak şu ayarlarla düzenleyebilirsiniz:

- `logging.consoleLevel` (varsayılan `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Gizleme

OpenClaw, günlük veya transcript çıktısı süreçten ayrılmadan önce hassas token'ları maskeleyebilir. Bu günlük gizleme ilkesi konsol, dosya günlüğü, OTLP günlük kaydı ve oturum transcript metin çıkışlarına uygulanır; böylece eşleşen gizli değerler JSONL satırları veya iletiler diske yazılmadan önce maskelenir.

- `logging.redactSensitive`: `off` | `tools` (varsayılan: `tools`)
- `logging.redactPatterns`: regex dizelerinden oluşan dizi (varsayılanları geçersiz kılar)
  - Ham regex dizeleri (otomatik `gi`) kullanın veya özel bayraklara ihtiyacınız varsa `/pattern/flags` kullanın.
  - Eşleşmeler, ilk 6 + son 4 karakter korunarak maskelenir (uzunluk >= 18); aksi halde `***`.
  - Varsayılanlar yaygın anahtar atamalarını, CLI bayraklarını, JSON alanlarını, bearer üstbilgilerini, PEM bloklarını, popüler token öneklerini ve kart numarası, CVC/CVV, paylaşılan ödeme token'ı ve ödeme kimlik bilgisi gibi ödeme kimlik bilgisi alan adlarını kapsar.

Bazı güvenlik sınırları, `logging.redactSensitive` değerinden bağımsız olarak her zaman gizleme uygular. Buna Control UI araç çağrısı olayları, `sessions_history` araç çıktısı, tanılama destek dışa aktarımları, sağlayıcı hata gözlemleri, exec onay komutu gösterimi ve Gateway WebSocket protokol günlükleri dahildir. Bu yüzeyler ek desenler olarak yine `logging.redactPatterns` kullanabilir, ancak `redactSensitive: "off"` bunların ham gizli değerleri yaymasına neden olmaz.

## Gateway WebSocket günlükleri

Gateway, WebSocket protokol günlüklerini iki modda yazdırır:

- **Normal mod (`--verbose` yok)**: yalnızca “ilginç” RPC sonuçları yazdırılır:
  - hatalar (`ok=false`)
  - yavaş çağrılar (varsayılan eşik: `>= 50ms`)
  - ayrıştırma hataları
- **Ayrıntılı mod (`--verbose`)**: tüm WS istek/yanıt trafiğini yazdırır.

### WS günlük stili

`openclaw gateway`, Gateway başına stil anahtarını destekler:

- `--ws-log auto` (varsayılan): normal mod optimize edilmiştir; ayrıntılı mod kompakt çıktı kullanır
- `--ws-log compact`: ayrıntılı modda kompakt çıktı (eşleştirilmiş istek/yanıt)
- `--ws-log full`: ayrıntılı modda tam kare başına çıktı
- `--compact`: `--ws-log compact` için alias

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

Konsol biçimlendiricisi **TTY-aware** çalışır ve tutarlı, önekli satırlar yazdırır. Alt sistem günlükleyicileri çıktıyı gruplanmış ve kolay taranabilir tutar.

Davranış:

- Her satırda **alt sistem önekleri** (örn. `[gateway]`, `[canvas]`, `[tailscale]`)
- **Alt sistem renkleri** (alt sistem başına kararlı) ve seviye renklendirmesi
- **Çıktı bir TTY olduğunda veya ortam zengin terminal gibi göründüğünde renk** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), `NO_COLOR` değerine uyar
- **Kısaltılmış alt sistem önekleri**: baştaki `gateway/` + `channels/` bölümlerini düşürür, son 2 segmenti tutar (örn. `whatsapp/outbound`)
- **Alt sisteme göre alt günlükleyiciler** (otomatik önek + yapılandırılmış alan `{ subsystem }`)
- QR/UX çıktısı için **`logRaw()`** (önek yok, biçimlendirme yok)
- **Konsol stilleri** (örn. `pretty | compact | json`)
- Dosya günlük seviyesinden ayrı **konsol günlük seviyesi** (`logging.level`, `debug`/`trace` olarak ayarlandığında dosya tam ayrıntıyı korur)
- **WhatsApp ileti gövdeleri** `debug` seviyesinde günlüğe yazılır (görmek için `--verbose` kullanın)

Bu, etkileşimli çıktıyı kolay taranabilir hale getirirken mevcut dosya günlüklerini kararlı tutar.

## İlgili

- [Günlükleme](/tr/logging)
- [OpenTelemetry dışa aktarma](/tr/gateway/opentelemetry)
- [Tanılama dışa aktarma](/tr/gateway/diagnostics)
