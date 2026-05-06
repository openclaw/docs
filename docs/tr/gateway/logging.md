---
read_when:
    - Günlük çıktısını veya biçimlerini değiştirme
    - CLI veya Gateway çıktısında hata ayıklama
summary: Günlükleme yüzeyleri, dosya günlükleri, WS günlük stilleri ve konsol biçimlendirmesi
title: Gateway günlük kaydı
x-i18n:
    generated_at: "2026-05-06T09:13:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 078b4196ef1c5af5f7f0a4253f704d90d474a3ff668ec555559cab56cbcb15c6
    source_path: gateway/logging.md
    workflow: 16
---

# Günlükleme

Kullanıcıya yönelik genel bakış (CLI + Denetim Arayüzü + yapılandırma) için bkz. [/logging](/tr/logging).

OpenClaw'ın iki günlük "yüzeyi" vardır:

- **Konsol çıktısı** (terminalde / Hata Ayıklama Arayüzü'nde gördüğünüz).
- Gateway günlükleyicisi tarafından yazılan **dosya günlükleri** (JSON satırları).

Başlangıçta Gateway, çözümlenmiş varsayılan ajan modelini yeni oturumları etkileyen
mod varsayılanlarıyla birlikte günlüğe yazar, örneğin:

```text
agent model: openai-codex/gpt-5.5 (thinking=medium, fast=on)
```

`thinking` varsayılan ajandan, model parametrelerinden veya genel ajan varsayılanından gelir;
ayarlanmamışsa başlangıç özeti `medium` gösterir. `fast`, varsayılan ajandan veya model
`fastMode` parametrelerinden gelir.

## Dosya tabanlı günlükleyici

- Varsayılan dönen günlük dosyası `/tmp/openclaw/` altındadır (günde bir dosya): `openclaw-YYYY-MM-DD.log`
  - Tarih, Gateway ana makinesinin yerel saat dilimini kullanır.
- Etkin günlük dosyaları `logging.maxFileBytes` değerinde döndürülür (varsayılan: 100 MB);
  en fazla beş numaralı arşiv tutulur ve yeni bir etkin dosyaya yazmaya devam edilir.
- Günlük dosyası yolu ve düzeyi `~/.openclaw/openclaw.json` üzerinden yapılandırılabilir:
  - `logging.file`
  - `logging.level`

Dosya biçimi, satır başına bir JSON nesnesidir.

Denetim Arayüzü Günlükler sekmesi bu dosyayı Gateway üzerinden izler (`logs.tail`).
CLI da aynısını yapabilir:

```bash
openclaw logs --follow
```

**Ayrıntılı çıktı ve günlük düzeyleri**

- **Dosya günlükleri** yalnızca `logging.level` tarafından denetlenir.
- `--verbose` yalnızca **konsol ayrıntı düzeyini** (ve WS günlük stilini) etkiler; dosya günlük düzeyini
  yükseltmez.
- Dosya günlüklerinde yalnızca ayrıntılı çıktıda görünen ayrıntıları yakalamak için `logging.level` değerini `debug` veya
  `trace` olarak ayarlayın.
- İzleme günlükleri, Plugin araç fabrikası hazırlığı gibi seçili sıcak yollar için tanılama zamanlama özetlerini de içerir.
  Bkz. [/tools/plugin#slow-plugin-tool-setup](/tr/tools/plugin#slow-plugin-tool-setup).

## Konsol yakalama

CLI, `console.log/info/warn/error/debug/trace` çıktısını yakalar ve bunları dosya günlüklerine yazar;
stdout/stderr'e yazdırmaya da devam eder.

Konsol ayrıntı düzeyini bağımsız olarak şunlarla ayarlayabilirsiniz:

- `logging.consoleLevel` (varsayılan `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Redaksiyon

OpenClaw, günlük veya transkript çıktısı süreçten ayrılmadan önce hassas belirteçleri maskeleyebilir.
Bu günlük redaksiyon ilkesi konsol, dosya günlüğü, OTLP günlük kaydı ve oturum transkripti metin çıkışlarına uygulanır;
böylece eşleşen gizli değerler JSONL satırları veya iletileri diske yazılmadan önce maskelenir.

- `logging.redactSensitive`: `off` | `tools` (varsayılan: `tools`)
- `logging.redactPatterns`: regex dizelerinden oluşan dizi (varsayılanları geçersiz kılar)
  - Ham regex dizeleri (otomatik `gi`) veya özel bayraklar gerekiyorsa `/pattern/flags` kullanın.
  - Eşleşmeler, ilk 6 + son 4 karakter korunarak maskelenir (uzunluk >= 18); aksi halde `***`.
  - Varsayılanlar yaygın anahtar atamalarını, CLI bayraklarını, JSON alanlarını, bearer başlıklarını, PEM bloklarını, popüler belirteç öneklerini ve kart numarası, CVC/CVV, paylaşılan ödeme belirteci ve ödeme kimlik bilgisi gibi ödeme kimlik bilgisi alan adlarını kapsar.

Bazı güvenlik sınırları `logging.redactSensitive` değerinden bağımsız olarak her zaman redaksiyon uygular.
Buna Denetim Arayüzü araç çağrısı olayları, `sessions_history` araç çıktısı,
tanılama destek dışa aktarımları, sağlayıcı hata gözlemleri, exec onay komutu
gösterimi ve Gateway WebSocket protokol günlükleri dahildir. Bu yüzeyler ek desenler olarak
`logging.redactPatterns` kullanmaya devam edebilir, ancak `redactSensitive: "off"`
bunların ham gizli değerler yaymasına neden olmaz.

## Gateway WebSocket günlükleri

Gateway, WebSocket protokol günlüklerini iki modda yazdırır:

- **Normal mod (`--verbose` yok)**: yalnızca "ilginç" RPC sonuçları yazdırılır:
  - hatalar (`ok=false`)
  - yavaş çağrılar (varsayılan eşik: `>= 50ms`)
  - ayrıştırma hataları
- **Ayrıntılı mod (`--verbose`)**: tüm WS istek/yanıt trafiğini yazdırır.

### WS günlük stili

`openclaw gateway`, Gateway başına stil anahtarını destekler:

- `--ws-log auto` (varsayılan): normal mod optimize edilmiştir; ayrıntılı mod kompakt çıktı kullanır
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

## Konsol biçimlendirmesi (alt sistem günlükleme)

Konsol biçimleyici **TTY farkındadır** ve tutarlı, önekli satırlar yazdırır.
Alt sistem günlükleyicileri çıktıyı gruplanmış ve taranabilir tutar.

Davranış:

- Her satırda **alt sistem önekleri** (örn. `[gateway]`, `[canvas]`, `[tailscale]`)
- **Alt sistem renkleri** (alt sistem başına kararlı) ve düzey renklendirmesi
- **Çıktı bir TTY olduğunda veya ortam zengin terminale benziyorsa renk** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), `NO_COLOR` değerine uyar
- **Kısaltılmış alt sistem önekleri**: baştaki `gateway/` + `channels/` bölümlerini düşürür, son 2 segmenti tutar (örn. `whatsapp/outbound`)
- **Alt sisteme göre alt günlükleyiciler** (otomatik önek + yapılandırılmış alan `{ subsystem }`)
- QR/UX çıktısı için **`logRaw()`** (önek yok, biçimlendirme yok)
- **Konsol stilleri** (örn. `pretty | compact | json`)
- **Konsol günlük düzeyi**, dosya günlük düzeyinden ayrıdır (dosya, `logging.level` `debug`/`trace` olarak ayarlandığında tüm ayrıntıları tutar)
- **WhatsApp ileti gövdeleri** `debug` düzeyinde günlüğe yazılır (bunları görmek için `--verbose` kullanın)

Bu, etkileşimli çıktıyı taranabilir hale getirirken mevcut dosya günlüklerini kararlı tutar.

## İlgili

- [Günlükleme](/tr/logging)
- [OpenTelemetry dışa aktarma](/tr/gateway/opentelemetry)
- [Tanılama dışa aktarma](/tr/gateway/diagnostics)
