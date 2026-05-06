---
read_when:
    - Günlükleme çıktısını veya biçimlerini değiştirme
    - CLI veya Gateway çıktısında hata ayıklama
summary: Günlükleme yüzeyleri, dosya günlükleri, WS günlük stilleri ve konsol biçimlendirmesi
title: Gateway günlük kaydı
x-i18n:
    generated_at: "2026-05-06T17:55:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 16bce5763754d13f855a46777b4c3cc7a7c966e35e0cd08a15f359fd22623bcb
    source_path: gateway/logging.md
    workflow: 16
---

# Günlükleme

Kullanıcıya yönelik genel bakış için (CLI + Control UI + yapılandırma), bkz. [/logging](/tr/logging).

OpenClaw iki günlük "yüzeyine" sahiptir:

- **Konsol çıktısı** (terminalde / Debug UI'da gördüğünüz şey).
- Gateway günlükleyicisi tarafından yazılan **dosya günlükleri** (JSON satırları).

Başlatma sırasında Gateway, çözümlenen varsayılan aracı modelini yeni oturumları
etkileyen mod varsayılanlarıyla birlikte günlüğe yazar, örneğin:

```text
agent model: openai-codex/gpt-5.5 (thinking=medium, fast=on)
```

`thinking` varsayılan aracıdan, model parametrelerinden veya genel aracı varsayılanından gelir;
ayarlanmamışsa başlatma özeti `medium` gösterir. `fast`, varsayılan aracıdan
veya model `fastMode` parametrelerinden gelir.

## Dosya tabanlı günlükleyici

- Varsayılan dönen günlük dosyası `/tmp/openclaw/` altındadır (günde bir dosya): `openclaw-YYYY-MM-DD.log`
  - Tarih, gateway ana makinesinin yerel saat dilimini kullanır.
- Etkin günlük dosyaları `logging.maxFileBytes` değerinde döndürülür (varsayılan: 100 MB);
  en fazla beş numaralı arşiv tutulur ve yeni bir etkin dosyaya yazmaya devam edilir.
- Günlük dosyası yolu ve düzeyi `~/.openclaw/openclaw.json` üzerinden yapılandırılabilir:
  - `logging.file`
  - `logging.level`

Dosya biçimi, satır başına bir JSON nesnesidir.

Konuşma, gerçek zamanlı ses ve yönetilen oda kod yolları, sınırlı yaşam döngüsü
kayıtları için paylaşılan dosya günlükleyicisini kullanır. Bu kayıtlar operasyonel hata ayıklama
ve OTLP günlük dışa aktarımı için tasarlanmıştır; transkript metni, ses yükleri, tur kimlikleri, çağrı kimlikleri ve
sağlayıcı öğe kimlikleri günlük kaydına kopyalanmaz.

Control UI Günlükler sekmesi bu dosyayı gateway üzerinden izler (`logs.tail`).
CLI aynı şeyi yapabilir:

```bash
openclaw logs --follow
```

**Ayrıntılılık ve günlük düzeyleri**

- **Dosya günlükleri** yalnızca `logging.level` tarafından denetlenir.
- `--verbose` yalnızca **konsol ayrıntılılığını** (ve WS günlük stilini) etkiler; dosya günlük düzeyini
  **yükseltmez**.
- Dosya günlüklerinde yalnızca ayrıntılı modda görünen ayrıntıları yakalamak için `logging.level` değerini `debug` veya
  `trace` olarak ayarlayın.
- Trace günlükleme, Plugin araç fabrikası hazırlığı gibi seçili sıcak yollar için tanılama zamanlama özetlerini de içerir.
  Bkz. [/tools/plugin#slow-plugin-tool-setup](/tr/tools/plugin#slow-plugin-tool-setup).

## Konsol yakalama

CLI, `console.log/info/warn/error/debug/trace` çıktısını yakalar ve stdout/stderr'ye yazdırmaya devam ederken
bunları dosya günlüklerine yazar.

Konsol ayrıntılılığını bağımsız olarak şu seçeneklerle ayarlayabilirsiniz:

- `logging.consoleLevel` (varsayılan `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Redaksiyon

OpenClaw, günlük veya transkript çıktısı süreçten ayrılmadan önce hassas token'ları maskeleyebilir.
Bu günlük redaksiyon politikası konsol, dosya günlüğü, OTLP günlük kaydı ve oturum transkripti metin hedeflerinde uygulanır;
böylece eşleşen gizli değerler JSONL satırları veya iletiler diske yazılmadan önce maskelenir.

- `logging.redactSensitive`: `off` | `tools` (varsayılan: `tools`)
- `logging.redactPatterns`: regex dizeleri dizisi (varsayılanları geçersiz kılar)
  - Ham regex dizeleri (otomatik `gi`) veya özel bayraklara ihtiyacınız varsa `/pattern/flags` kullanın.
  - Eşleşmeler ilk 6 + son 4 karakter korunarak maskelenir (uzunluk >= 18), aksi halde `***`.
  - Varsayılanlar yaygın anahtar atamalarını, CLI bayraklarını, JSON alanlarını, bearer başlıklarını, PEM bloklarını, popüler token öneklerini ve kart numarası, CVC/CVV, paylaşılan ödeme token'ı ve ödeme kimlik bilgisi gibi ödeme kimlik bilgisi alan adlarını kapsar.

Bazı güvenlik sınırları `logging.redactSensitive` değerinden bağımsız olarak her zaman redaksiyon uygular.
Buna Control UI araç çağrısı olayları, `sessions_history` araç çıktısı,
tanılama destek dışa aktarımları, sağlayıcı hata gözlemleri, exec onay komutu
görüntüsü ve Gateway WebSocket protokol günlükleri dahildir. Bu yüzeyler ek desenler olarak
`logging.redactPatterns` kullanmaya devam edebilir, ancak `redactSensitive: "off"`
bunların ham sırlar yaymasını sağlamaz.

## Gateway WebSocket günlükleri

Gateway, WebSocket protokol günlüklerini iki modda yazdırır:

- **Normal mod (`--verbose` yok)**: yalnızca "ilginç" RPC sonuçları yazdırılır:
  - hatalar (`ok=false`)
  - yavaş çağrılar (varsayılan eşik: `>= 50ms`)
  - ayrıştırma hataları
- **Ayrıntılı mod (`--verbose`)**: tüm WS istek/yanıt trafiğini yazdırır.

### WS günlük stili

`openclaw gateway`, gateway başına bir stil anahtarını destekler:

- `--ws-log auto` (varsayılan): normal mod optimize edilir; ayrıntılı mod kompakt çıktı kullanır
- `--ws-log compact`: ayrıntılıyken kompakt çıktı (eşleştirilmiş istek/yanıt)
- `--ws-log full`: ayrıntılıyken kare başına tam çıktı
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

Konsol biçimlendirici **TTY duyarlıdır** ve tutarlı, önekli satırlar yazdırır.
Alt sistem günlükleyicileri çıktıyı gruplu ve taranabilir tutar.

Davranış:

- Her satırda **alt sistem önekleri** (örn. `[gateway]`, `[canvas]`, `[tailscale]`)
- **Alt sistem renkleri** (alt sistem başına kararlı) ve düzey renklendirmesi
- **Çıktı bir TTY olduğunda veya ortam zengin bir terminal gibi göründüğünde renk** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), `NO_COLOR` değerine uyar
- **Kısaltılmış alt sistem önekleri**: baştaki `gateway/` + `channels/` öğelerini düşürür, son 2 segmenti tutar (örn. `whatsapp/outbound`)
- **Alt sisteme göre alt günlükleyiciler** (otomatik önek + yapılandırılmış alan `{ subsystem }`)
- QR/UX çıktısı için **`logRaw()`** (önek yok, biçimlendirme yok)
- **Konsol stilleri** (örn. `pretty | compact | json`)
- Dosya günlük düzeyinden ayrı **konsol günlük düzeyi** (`logging.level` `debug`/`trace` olarak ayarlandığında dosya tam ayrıntıyı korur)
- **WhatsApp ileti gövdeleri** `debug` düzeyinde günlüğe yazılır (bunları görmek için `--verbose` kullanın)

Bu, mevcut dosya günlüklerini kararlı tutarken etkileşimli çıktıyı taranabilir hale getirir.

## İlgili

- [Günlükleme](/tr/logging)
- [OpenTelemetry dışa aktarma](/tr/gateway/opentelemetry)
- [Tanılama dışa aktarma](/tr/gateway/diagnostics)
