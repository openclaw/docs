---
read_when:
    - Günlük çıktısını veya biçimlerini değiştirirken
    - CLI veya gateway çıktısında hata ayıklarken
summary: Günlük yüzeyleri, dosya günlükleri, WS günlük stilleri ve konsol biçimlendirmesi
title: Gateway Günlükleme
x-i18n:
    generated_at: "2026-04-05T13:53:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 465fe66ae6a3bc844e75d3898aed15b3371481c4fe89ede40e5a9377e19bb74c
    source_path: gateway/logging.md
    workflow: 15
---

# Günlükleme

Kullanıcıya yönelik genel bakış için (CLI + Control UI + config), bkz. [/logging](/logging).

OpenClaw'ın iki günlük “yüzeyi” vardır:

- **Konsol çıktısı** (terminalde / Debug UI'de gördüğünüz).
- Gateway günlükleyicisi tarafından yazılan **dosya günlükleri** (JSON satırları).

## Dosya tabanlı günlükleyici

- Varsayılan dönen günlük dosyası `/tmp/openclaw/` altındadır (günde bir dosya): `openclaw-YYYY-MM-DD.log`
  - Tarih, gateway ana makinesinin yerel saat dilimini kullanır.
- Günlük dosyası yolu ve düzeyi `~/.openclaw/openclaw.json` üzerinden yapılandırılabilir:
  - `logging.file`
  - `logging.level`

Dosya biçimi, satır başına bir JSON nesnesidir.

Control UI Logs sekmesi bu dosyayı gateway üzerinden izler (`logs.tail`).
CLI de aynısını yapabilir:

```bash
openclaw logs --follow
```

**Verbose ve günlük düzeyleri**

- **Dosya günlükleri** yalnızca `logging.level` tarafından kontrol edilir.
- `--verbose` yalnızca **konsol ayrıntı düzeyini** etkiler (ve WS günlük stilini); dosya günlük düzeyini **yükseltmez**.
- Yalnızca verbose düzeyindeki ayrıntıları dosya günlüklerine almak için `logging.level` değerini `debug` veya
  `trace` olarak ayarlayın.

## Konsol yakalama

CLI, `console.log/info/warn/error/debug/trace` çıktısını yakalar ve bunu dosya günlüklerine yazar,
aynı zamanda stdout/stderr'ye yazdırmaya devam eder.

Konsol ayrıntı düzeyini bağımsız olarak şu yollarla ayarlayabilirsiniz:

- `logging.consoleLevel` (varsayılan `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Araç özeti sansürleme

Ayrıntılı araç özetleri (ör. `🛠️ Exec: ...`), konsol akışına ulaşmadan önce hassas token'ları maskeleyebilir.
Bu **yalnızca araçlar** içindir ve dosya günlüklerini değiştirmez.

- `logging.redactSensitive`: `off` | `tools` (varsayılan: `tools`)
- `logging.redactPatterns`: regex dizesi dizisi (varsayılanları geçersiz kılar)
  - Ham regex dizeleri kullanın (otomatik `gi`) veya özel bayraklara ihtiyacınız varsa `/pattern/flags` kullanın.
  - Eşleşmeler, ilk 6 + son 4 karakter korunarak maskelenir (uzunluk >= 18); aksi halde `***`.
  - Varsayılanlar yaygın anahtar atamalarını, CLI bayraklarını, JSON alanlarını, bearer başlıklarını, PEM bloklarını ve popüler token öneklerini kapsar.

## Gateway WebSocket günlükleri

Gateway, WebSocket protokol günlüklerini iki modda yazdırır:

- **Normal mod (`--verbose` yok)**: yalnızca “ilgi çekici” RPC sonuçları yazdırılır:
  - hatalar (`ok=false`)
  - yavaş çağrılar (varsayılan eşik: `>= 50ms`)
  - ayrıştırma hataları
- **Verbose modu (`--verbose`)**: tüm WS istek/yanıt trafiğini yazdırır.

### WS günlük stili

`openclaw gateway`, gateway başına bir stil anahtarı destekler:

- `--ws-log auto` (varsayılan): normal mod optimize edilmiştir; verbose modu kompakt çıktı kullanır
- `--ws-log compact`: verbose iken kompakt çıktı (eşleştirilmiş istek/yanıt)
- `--ws-log full`: verbose iken kare başına tam çıktı
- `--compact`: `--ws-log compact` için takma ad

Örnekler:

```bash
# optimize edilmiş (yalnızca hata/yavaş)
openclaw gateway

# tüm WS trafiğini göster (eşleştirilmiş)
openclaw gateway --verbose --ws-log compact

# tüm WS trafiğini göster (tam meta)
openclaw gateway --verbose --ws-log full
```

## Konsol biçimlendirmesi (alt sistem günlükleme)

Konsol biçimlendiricisi **TTY farkındadır** ve tutarlı, önekli satırlar yazdırır.
Alt sistem günlükleyicileri çıktıyı gruplanmış ve taranabilir tutar.

Davranış:

- Her satırda **alt sistem önekleri** (ör. `[gateway]`, `[canvas]`, `[tailscale]`)
- **Alt sistem renkleri** (alt sistem başına sabit) ve düzey renklendirmesi
- **Çıktı bir TTY olduğunda veya ortam zengin bir terminal gibi göründüğünde renk** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), `NO_COLOR` değerine saygı gösterir
- **Kısaltılmış alt sistem önekleri**: baştaki `gateway/` + `channels/` kaldırılır, son 2 segment korunur (ör. `whatsapp/outbound`)
- **Alt sistem bazlı alt günlükleyiciler** (otomatik önek + yapılandırılmış `{ subsystem }` alanı)
- QR/UX çıktısı için **`logRaw()`** (önek yok, biçimlendirme yok)
- **Konsol stilleri** (ör. `pretty | compact | json`)
- Dosya günlük düzeyinden ayrı **konsol günlük düzeyi** (dosya, `logging.level` değeri `debug`/`trace` olarak ayarlandığında tam ayrıntıyı korur)
- **WhatsApp mesaj gövdeleri** `debug` düzeyinde günlüğe kaydedilir (bunları görmek için `--verbose` kullanın)

Bu, etkileşimli çıktıyı taranabilir hale getirirken mevcut dosya günlüklerini kararlı tutar.
