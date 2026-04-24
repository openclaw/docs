---
read_when:
    - Günlük çıktısını veya biçimlerini değiştirme
    - CLI veya Gateway çıktısında hata ayıklama
summary: Günlükleme yüzeyleri, dosya günlükleri, WS günlük stilleri ve konsol biçimlendirmesi
title: Gateway günlükleme
x-i18n:
    generated_at: "2026-04-24T09:10:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 17ecbb9b781734727fc7aa8e3b0a59bc7ea22b455affd02fbc2db924c144b9f3
    source_path: gateway/logging.md
    workflow: 15
---

# Günlükleme

Kullanıcıya yönelik genel bakış için (CLI + Control UI + yapılandırma), bkz. [/logging](/tr/logging).

OpenClaw'ın iki günlükleme “yüzeyi” vardır:

- **Konsol çıktısı** (terminalde / Debug UI'da gördüğünüz şey).
- Gateway günlükleyicisi tarafından yazılan **dosya günlükleri** (JSON satırları).

## Dosya tabanlı günlükleyici

- Varsayılan dönen günlük dosyası `/tmp/openclaw/` altındadır (günde bir dosya): `openclaw-YYYY-MM-DD.log`
  - Tarih, Gateway ana makinesinin yerel saat dilimini kullanır.
- Günlük dosyası yolu ve düzeyi `~/.openclaw/openclaw.json` ile yapılandırılabilir:
  - `logging.file`
  - `logging.level`

Dosya biçimi satır başına bir JSON nesnesidir.

Control UI Logs sekmesi bu dosyayı Gateway üzerinden tail eder (`logs.tail`).
CLI da aynısını yapabilir:

```bash
openclaw logs --follow
```

**Ayrıntılı mod ve günlük düzeyleri**

- **Dosya günlükleri** yalnızca `logging.level` ile kontrol edilir.
- `--verbose` yalnızca **konsol ayrıntı düzeyini** (ve WS günlük stilini) etkiler; dosya günlük düzeyini **yükseltmez**.
- Yalnızca ayrıntılı modda görülen ayrıntıları dosya günlüklerinde yakalamak için `logging.level` değerini `debug` veya `trace` olarak ayarlayın.

## Konsol yakalama

CLI, `console.log/info/warn/error/debug/trace` çıktılarını yakalar ve bunları dosya günlüklerine yazar,
aynı zamanda stdout/stderr'e yazdırmaya devam eder.

Konsol ayrıntı düzeyini bağımsız olarak şu ayarlarla ince ayar yapabilirsiniz:

- `logging.consoleLevel` (varsayılan `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Araç özeti redaksiyonu

Ayrıntılı araç özetleri (ör. `🛠️ Exec: ...`), hassas token'ları konsol
akışına ulaşmadan önce maskeleyebilir. Bu **yalnızca araçlar** içindir ve dosya günlüklerini değiştirmez.

- `logging.redactSensitive`: `off` | `tools` (varsayılan: `tools`)
- `logging.redactPatterns`: regex dizgeleri dizisi (varsayılanları geçersiz kılar)
  - Ham regex dizgeleri kullanın (otomatik `gi`) veya özel bayraklara ihtiyacınız varsa `/pattern/flags`.
  - Eşleşmeler, ilk 6 + son 4 karakter korunarak maskelenir (uzunluk >= 18), aksi halde `***`.
  - Varsayılanlar yaygın anahtar atamalarını, CLI bayraklarını, JSON alanlarını, bearer üst bilgilerini, PEM bloklarını ve popüler token öneklerini kapsar.

## Gateway WebSocket günlükleri

Gateway, WebSocket protokol günlüklerini iki modda yazdırır:

- **Normal mod (`--verbose` yok)**: yalnızca “ilginç” RPC sonuçları yazdırılır:
  - hatalar (`ok=false`)
  - yavaş çağrılar (varsayılan eşik: `>= 50ms`)
  - ayrıştırma hataları
- **Ayrıntılı mod (`--verbose`)**: tüm WS istek/yanıt trafiğini yazdırır.

### WS günlük stili

`openclaw gateway`, Gateway başına stil geçişi destekler:

- `--ws-log auto` (varsayılan): normal mod optimize edilmiştir; ayrıntılı mod kompakt çıktı kullanır
- `--ws-log compact`: ayrıntılı modda kompakt çıktı (eşleştirilmiş istek/yanıt)
- `--ws-log full`: ayrıntılı modda tam kare başına çıktı
- `--compact`: `--ws-log compact` için takma ad

Örnekler:

```bash
# optimize edilmiş (yalnızca hata/yavaş)
openclaw gateway

# tüm WS trafiğini göster (eşleştirilmiş)
openclaw gateway --verbose --ws-log compact

# tüm WS trafiğini göster (tam meta veri)
openclaw gateway --verbose --ws-log full
```

## Konsol biçimlendirmesi (alt sistem günlükleme)

Konsol biçimlendirici **TTY farkındadır** ve tutarlı, önekli satırlar yazdırır.
Alt sistem günlükleyicileri çıktıyı gruplanmış ve taranabilir tutar.

Davranış:

- Her satırda **alt sistem önekleri** (ör. `[gateway]`, `[canvas]`, `[tailscale]`)
- **Alt sistem renkleri** (alt sistem başına sabit) ve düzey renklendirmesi
- **Çıktı bir TTY ise veya ortam zengin bir terminal gibi görünüyorsa renk kullanır** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), `NO_COLOR` ayarına saygı gösterir
- **Kısaltılmış alt sistem önekleri**: baştaki `gateway/` + `channels/` kaldırılır, son 2 segment korunur (ör. `whatsapp/outbound`)
- **Alt sistem bazlı alt günlükleyiciler** (otomatik önek + yapılandırılmış `{ subsystem }` alanı)
- QR/UX çıktısı için **`logRaw()`** (önek yok, biçimlendirme yok)
- **Konsol stilleri** (ör. `pretty | compact | json`)
- **Konsol günlük düzeyi**, dosya günlük düzeyinden ayrıdır (dosya, `logging.level` `debug`/`trace` olarak ayarlandığında tam ayrıntıyı korur)
- **WhatsApp mesaj gövdeleri** `debug` düzeyinde günlüğe yazılır (görmek için `--verbose` kullanın)

Bu, mevcut dosya günlüklerini kararlı tutarken etkileşimli çıktıyı taranabilir hâle getirir.

## İlgili

- [Günlüklemeye genel bakış](/tr/logging)
- [Tanılama dışa aktarımı](/tr/gateway/diagnostics)
