---
read_when:
    - Günlük kaydı çıktısını veya biçimlerini değiştirme
    - CLI veya Gateway çıktısında hata ayıklama
summary: Günlükleme yüzeyleri, dosya günlükleri, WS günlük stilleri ve konsol biçimlendirmesi
title: Gateway günlük kaydı
x-i18n:
    generated_at: "2026-05-05T01:46:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: d49ca112d3cc4ec76ecfc8b14d16dae64f74ca1f761fdb2b7bb470f73b66a246
    source_path: gateway/logging.md
    workflow: 16
---

# Günlükleme

Kullanıcıya yönelik bir genel bakış (CLI + Denetim UI + yapılandırma) için bkz. [/logging](/tr/logging).

OpenClaw iki günlük “yüzeyine” sahiptir:

- **Konsol çıktısı** (terminalde / Hata Ayıklama UI'da gördüğünüz).
- Gateway günlükleyicisi tarafından yazılan **dosya günlükleri** (JSON satırları).

Başlangıçta Gateway, çözümlenen varsayılan aracı modelini yeni oturumları
etkileyen mod varsayılanlarıyla birlikte günlüğe yazar, örneğin:

```text
agent model: openai-codex/gpt-5.5 (thinking=medium, fast=on)
```

`thinking`, varsayılan aracıdan, model parametrelerinden veya genel aracı varsayılanından gelir;
ayarlanmamışsa başlangıç özeti `medium` gösterir. `fast`, varsayılan aracıdan veya model
`fastMode` parametrelerinden gelir.

## Dosya tabanlı günlükleyici

- Varsayılan dönen günlük dosyası `/tmp/openclaw/` altındadır (günde bir dosya): `openclaw-YYYY-MM-DD.log`
  - Tarih, Gateway ana makinesinin yerel saat dilimini kullanır.
- Etkin günlük dosyaları `logging.maxFileBytes` değerinde döner (varsayılan: 100 MB);
  en fazla beş numaralı arşivi tutar ve yeni bir etkin dosyaya yazmaya devam eder.
- Günlük dosyası yolu ve düzeyi `~/.openclaw/openclaw.json` üzerinden yapılandırılabilir:
  - `logging.file`
  - `logging.level`

Dosya biçimi satır başına bir JSON nesnesidir.

Denetim UI Günlükler sekmesi bu dosyayı Gateway üzerinden izler (`logs.tail`).
CLI da aynısını yapabilir:

```bash
openclaw logs --follow
```

**Ayrıntılılık ve günlük düzeyleri**

- **Dosya günlükleri** yalnızca `logging.level` tarafından denetlenir.
- `--verbose` yalnızca **konsol ayrıntılılığını** (ve WS günlük stilini) etkiler; dosya günlük düzeyini
  yükseltmez.
- Yalnızca ayrıntılı modda görülen ayrıntıları dosya günlüklerinde yakalamak için `logging.level` değerini `debug` veya
  `trace` olarak ayarlayın.
- İzleme günlüklemesi, Plugin aracı fabrikası hazırlığı gibi seçili sıcak yollar için tanılama zamanlama özetlerini de içerir. Bkz.
  [/tools/plugin#slow-plugin-tool-setup](/tr/tools/plugin#slow-plugin-tool-setup).

## Konsol yakalama

CLI, `console.log/info/warn/error/debug/trace` çağrılarını yakalar ve stdout/stderr'e yazdırmaya devam ederken
bunları dosya günlüklerine yazar.

Konsol ayrıntılılığını bağımsız olarak şu seçeneklerle ayarlayabilirsiniz:

- `logging.consoleLevel` (varsayılan `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Redaksiyon

OpenClaw, günlük veya transcript çıktısı süreçten ayrılmadan önce hassas tokenları maskeleyebilir.
Bu günlükleme redaksiyon politikası konsol, dosya günlüğü, OTLP günlük kaydı ve oturum transcript metin hedeflerine uygulanır;
böylece eşleşen gizli değerler JSONL satırları veya iletiler diske yazılmadan önce maskelenir.

- `logging.redactSensitive`: `off` | `tools` (varsayılan: `tools`)
- `logging.redactPatterns`: regex dizesi dizisi (varsayılanları geçersiz kılar)
  - Ham regex dizeleri kullanın (otomatik `gi`) veya özel bayraklar gerekiyorsa `/pattern/flags` kullanın.
  - Eşleşmeler ilk 6 + son 4 karakter korunarak maskelenir (uzunluk >= 18), aksi takdirde `***`.
  - Varsayılanlar yaygın anahtar atamalarını, CLI bayraklarını, JSON alanlarını, bearer başlıklarını, PEM bloklarını, popüler token öneklerini ve kart numarası, CVC/CVV, paylaşılan ödeme tokenı ve ödeme kimlik bilgisi gibi ödeme kimlik bilgisi alan adlarını kapsar.

Bazı güvenlik sınırları, `logging.redactSensitive` değerinden bağımsız olarak her zaman redaksiyon uygular.
Buna Denetim UI araç çağrısı olayları, `sessions_history` araç çıktısı,
tanılama destek dışa aktarımları, sağlayıcı hata gözlemleri, exec onay komutu
gösterimi ve Gateway WebSocket protokol günlükleri dahildir. Bu yüzeyler ek desenler olarak
`logging.redactPatterns` kullanmaya devam edebilir, ancak `redactSensitive: "off"`
bunların ham gizli değerler yaymasına neden olmaz.

## Gateway WebSocket günlükleri

Gateway, WebSocket protokol günlüklerini iki modda yazdırır:

- **Normal mod (`--verbose` yok)**: yalnızca “ilginç” RPC sonuçları yazdırılır:
  - hatalar (`ok=false`)
  - yavaş çağrılar (varsayılan eşik: `>= 50ms`)
  - ayrıştırma hataları
- **Ayrıntılı mod (`--verbose`)**: tüm WS istek/yanıt trafiğini yazdırır.

### WS günlük stili

`openclaw gateway`, Gateway başına bir stil anahtarını destekler:

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

## Konsol biçimlendirme (alt sistem günlüklemesi)

Konsol biçimlendirici **TTY farkındadır** ve tutarlı, önekli satırlar yazdırır.
Alt sistem günlükleyicileri çıktıyı gruplanmış ve taranabilir tutar.

Davranış:

- Her satırda **alt sistem önekleri** (örn. `[gateway]`, `[canvas]`, `[tailscale]`)
- **Alt sistem renkleri** (alt sistem başına sabit) artı düzey renklendirmesi
- **Çıktı bir TTY olduğunda veya ortam zengin bir terminal gibi göründüğünde renk** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), `NO_COLOR` değerine uyar
- **Kısaltılmış alt sistem önekleri**: baştaki `gateway/` + `channels/` bölümlerini düşürür, son 2 segmenti tutar (örn. `whatsapp/outbound`)
- **Alt sisteme göre alt günlükleyiciler** (otomatik önek + yapılandırılmış alan `{ subsystem }`)
- QR/UX çıktısı için **`logRaw()`** (önek yok, biçimlendirme yok)
- **Konsol stilleri** (örn. `pretty | compact | json`)
- Dosya günlük düzeyinden ayrı **konsol günlük düzeyi** (`logging.level` `debug`/`trace` olarak ayarlandığında dosya tam ayrıntıyı korur)
- **WhatsApp ileti gövdeleri** `debug` düzeyinde günlüğe yazılır (bunları görmek için `--verbose` kullanın)

Bu, etkileşimli çıktıyı taranabilir hale getirirken mevcut dosya günlüklerini kararlı tutar.

## İlgili

- [Günlükleme](/tr/logging)
- [OpenTelemetry dışa aktarma](/tr/gateway/opentelemetry)
- [Tanılama dışa aktarma](/tr/gateway/diagnostics)
