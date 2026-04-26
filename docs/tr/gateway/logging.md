---
read_when:
    - Günlük çıktısını veya biçimlerini değiştirme
    - CLI veya Gateway çıktısında hata ayıklama
summary: Günlükleme yüzeyleri, dosya günlükleri, WS günlük stilleri ve konsol biçimlendirmesi
title: Gateway günlükleme
x-i18n:
    generated_at: "2026-04-26T11:29:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: c005cfc4cfe456b3734d3928a16c9cd131a2b465d46f2aba9c9c61db22dcc399
    source_path: gateway/logging.md
    workflow: 15
---

# Günlükleme

Kullanıcıya dönük genel bakış için (CLI + Control UI + config), bkz. [/logging](/tr/logging).

OpenClaw’ın iki günlükleme “yüzeyi” vardır:

- **Konsol çıktısı** (terminalde / Debug UI’da gördüğünüz şey).
- Gateway logger tarafından yazılan **dosya günlükleri** (JSON satırları).

## Dosya tabanlı logger

- Varsayılan dönen günlük dosyası `/tmp/openclaw/` altındadır (günde bir dosya): `openclaw-YYYY-MM-DD.log`
  - Tarih, Gateway ana makinesinin yerel saat dilimini kullanır.
- Etkin günlük dosyaları `logging.maxFileBytes` değerinde döner (varsayılan: 100 MB); en fazla beş numaralı arşiv tutulur ve yazma işlemi yeni bir etkin dosyada devam eder.
- Günlük dosyası yolu ve seviye `~/.openclaw/openclaw.json` üzerinden yapılandırılabilir:
  - `logging.file`
  - `logging.level`

Dosya biçimi satır başına bir JSON nesnesidir.

Control UI Logs sekmesi bu dosyayı Gateway üzerinden tail eder (`logs.tail`).
CLI da aynısını yapabilir:

```bash
openclaw logs --follow
```

**Verbose ve günlük seviyeleri**

- **Dosya günlükleri** yalnızca `logging.level` ile denetlenir.
- `--verbose` yalnızca **konsol ayrıntı düzeyini** (ve WS günlük stilini) etkiler; dosya günlük seviyesini **yükseltmez**.
- Yalnızca verbose modda görülen ayrıntıları dosya günlüklerinde yakalamak için `logging.level` değerini `debug` veya `trace` olarak ayarlayın.

## Konsol yakalama

CLI, `console.log/info/warn/error/debug/trace` çağrılarını yakalar ve bunları dosya günlüklerine yazar; aynı zamanda stdout/stderr çıktısını sürdürür.

Konsol ayrıntı düzeyini bağımsız olarak şu ayarlarla düzenleyebilirsiniz:

- `logging.consoleLevel` (varsayılan `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Araç özeti sansürleme

Ayrıntılı araç özetleri (ör. `🛠️ Exec: ...`), konsol akışına ulaşmadan önce hassas token’ları maskeleyebilir. Bu özellik **yalnızca araçlar** içindir ve dosya günlüklerini değiştirmez.

- `logging.redactSensitive`: `off` | `tools` (varsayılan: `tools`)
- `logging.redactPatterns`: regex dizgesi dizisi (varsayılanları geçersiz kılar)
  - Ham regex dizgeleri kullanın (otomatik `gi`) veya özel bayraklara ihtiyacınız varsa `/pattern/flags` kullanın.
  - Eşleşmeler, ilk 6 + son 4 karakter korunarak maskelenir (uzunluk >= 18); aksi halde `***`.
  - Varsayılanlar yaygın anahtar atamalarını, CLI bayraklarını, JSON alanlarını, bearer başlıklarını, PEM bloklarını ve popüler token öneklerini kapsar.

## Gateway WebSocket günlükleri

Gateway, WebSocket protokol günlüklerini iki modda yazdırır:

- **Normal mod (`--verbose` yok)**: yalnızca “ilginç” RPC sonuçları yazdırılır:
  - hatalar (`ok=false`)
  - yavaş çağrılar (varsayılan eşik: `>= 50ms`)
  - ayrıştırma hataları
- **Verbose mod (`--verbose`)**: tüm WS istek/yanıt trafiğini yazdırır.

### WS günlük stili

`openclaw gateway`, Gateway başına bir stil anahtarı destekler:

- `--ws-log auto` (varsayılan): normal mod optimize edilmiştir; verbose mod compact çıktı kullanır
- `--ws-log compact`: verbose modda compact çıktı (eşleştirilmiş istek/yanıt)
- `--ws-log full`: verbose modda tam çerçeve başına çıktı
- `--compact`: `--ws-log compact` için takma ad

Örnekler:

```bash
# optimize edilmiş (yalnızca hata/yavaş çağrılar)
openclaw gateway

# tüm WS trafiğini göster (eşleştirilmiş)
openclaw gateway --verbose --ws-log compact

# tüm WS trafiğini göster (tam meta)
openclaw gateway --verbose --ws-log full
```

## Konsol biçimlendirmesi (alt sistem günlükleme)

Konsol biçimlendirici **TTY farkındadır** ve tutarlı, önekli satırlar yazdırır.
Alt sistem logger’ları çıktının gruplanmış ve taranabilir kalmasını sağlar.

Davranış:

- Her satırda **alt sistem önekleri** (ör. `[gateway]`, `[canvas]`, `[tailscale]`)
- **Alt sistem renkleri** (alt sistem başına sabit) ve seviye renklendirmesi
- **Çıktı bir TTY olduğunda veya ortam zengin bir terminal gibi göründüğünde renk kullanır** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), `NO_COLOR` ayarına saygı gösterir
- **Kısaltılmış alt sistem önekleri**: baştaki `gateway/` + `channels/` kaldırılır, son 2 segment korunur (ör. `whatsapp/outbound`)
- **Alt sisteme göre alt logger’lar** (otomatik önek + yapılandırılmış `{ subsystem }` alanı)
- QR/UX çıktısı için **`logRaw()`** (önek yok, biçimlendirme yok)
- **Konsol stilleri** (ör. `pretty | compact | json`)
- Dosya günlük seviyesinden ayrı **konsol günlük seviyesi** (`logging.level` `debug`/`trace` olarak ayarlandığında dosya tam ayrıntıyı korur)
- **WhatsApp mesaj gövdeleri** `debug` seviyesinde günlüğe alınır (görmek için `--verbose` kullanın)

Bu, etkileşimli çıktıyı daha taranabilir hâle getirirken mevcut dosya günlüklerini kararlı tutar.

## İlgili

- [Logging](/tr/logging)
- [OpenTelemetry export](/tr/gateway/opentelemetry)
- [Diagnostics export](/tr/gateway/diagnostics)
