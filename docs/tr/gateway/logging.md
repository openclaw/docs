---
read_when:
    - Günlükleme çıktısını veya biçimlerini değiştirme
    - CLI veya Gateway çıktısında hata ayıklama
summary: Günlükleme yüzeyleri, dosya günlükleri, WS günlük stilleri ve konsol biçimlendirmesi
title: Gateway günlük kaydı
x-i18n:
    generated_at: "2026-07-12T12:19:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6717be5eac3dfc1acf36b2f21b049d46c7fc3678945295b10ae69781d89d35ad
    source_path: gateway/logging.md
    workflow: 16
---

# Günlükleme

Kullanıcıya yönelik genel bakış (CLI + Denetim Arayüzü + yapılandırma) için [/logging](/tr/logging) sayfasına bakın.

OpenClaw iki günlük yüzeyine sahiptir:

- **Konsol çıktısı** - terminalde / Hata Ayıklama Arayüzünde gördükleriniz.
- **Dosya günlükleri** - Gateway günlükleyicisi tarafından yazılan JSON satırları.

Başlangıçta Gateway, çözümlenen varsayılan aracı modelini ve yeni oturumları etkileyen mod varsayılanlarını günlüğe kaydeder:

```text
agent model: openai/gpt-5.6-sol (thinking=medium, fast=on)
```

`thinking`, varsayılan aracıdan, model parametrelerinden veya genel aracı varsayılanından gelir; ayarlanmadığında `medium` gösterilir. `fast`, varsayılan aracıdan veya modelin `fastMode` parametrelerinden gelir.

## Dosya tabanlı günlükleyici

- Varsayılan dönüşümlü günlük dosyası `/tmp/openclaw/` altındadır (günde bir dosya): Gateway ana makinesinin yerel saat dilimine göre tarihlendirilen `openclaw-YYYY-MM-DD.log`. Bu dizin güvenli değilse veya yazılamıyorsa (yanlış sahip, herkesçe yazılabilir ya da sembolik bağlantıysa), OpenClaw bunun yerine kullanıcı kapsamlı bir `os.tmpdir()/openclaw-<uid>` yoluna geri döner; Windows'ta her zaman bu işletim sistemi geçici dizini geri dönüşünü kullanır.
- Etkin günlük dosyaları `logging.maxFileBytes` değerinde (varsayılan: 100 MB) döndürülür; en fazla beş numaralı arşiv (`.1` ile `.5` arası) tutulur ve yeni bir etkin dosyaya yazılmaya devam edilir.
- Günlük dosyası yolunu ve düzeyini `~/.openclaw/openclaw.json` üzerinden yapılandırın: `logging.file`, `logging.level`.
- Dosya biçimi, satır başına bir JSON nesnesidir.

Konuşma, gerçek zamanlı ses ve yönetilen oda kod yolları; operasyonel hata ayıklama ve OTLP günlük dışa aktarımı için tasarlanmış, sınırlandırılmış yaşam döngüsü kayıtlarında ortak dosya günlükleyicisini kullanır. Döküm metni, ses yükleri, tur kimlikleri, çağrı kimlikleri ve sağlayıcı öğesi kimlikleri hiçbir zaman günlük kaydına kopyalanmaz.

Denetim Arayüzünün Günlükler sekmesi, Gateway (`logs.tail`) aracılığıyla bu dosyanın sonunu takip eder. CLI da aynısını yapar:

```bash
openclaw logs --follow
```

### Ayrıntılı mod ve günlük düzeyleri

- **Dosya günlükleri** yalnızca `logging.level` tarafından denetlenir.
- `--verbose` yalnızca **konsol ayrıntı düzeyini** (ve WS günlük stilini) etkiler; dosya günlük düzeyini **yükseltmez**.
- Yalnızca ayrıntılı modda bulunan ayrıntıları dosya günlüklerine kaydetmek için `logging.level` değerini `debug` veya `trace` olarak ayarlayın.
- İzleme günlüğü, Plugin araç fabrikası hazırlığı gibi seçili yoğun kod yollarına yönelik tanılama zamanlama özetlerini de içerir. [/tools/plugin#slow-plugin-tool-setup](/tr/tools/plugin#slow-plugin-tool-setup) sayfasına bakın.

## Konsol yakalama

CLI, `console.log/info/warn/error/debug/trace` çağrılarını yakalar, bunları dosya günlüklerine yazar ve yine de stdout/stderr'e yazdırır.

Konsol ayrıntı düzeyini bağımsız olarak ayarlayın:

- `logging.consoleLevel` (varsayılan `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`; TTY üzerinde varsayılan olarak `pretty`, aksi durumda `compact`)

## Gizleme

OpenClaw, günlük veya döküm çıktısı süreçten ayrılmadan önce hassas belirteçleri maskeler. Bu gizleme politikası konsol, dosya günlüğü, OTLP günlük kaydı ve oturum dökümü metni hedeflerinde geçerlidir; böylece eşleşen gizli değerler, JSONL satırları veya iletiler diske yazılmadan önce maskelenir.

- `logging.redactSensitive`: `off` | `tools` (varsayılan: `tools`)
- `logging.redactPatterns`: düzenli ifade dizgileri dizisi (varsayılanları geçersiz kılar)
  - Ham düzenli ifade dizgileri (otomatik `gi`) veya özel bayraklar için `/pattern/flags` kullanın.
  - Eşleşmeler, ilk 6 ve son 4 karakter korunarak maskelenir (18 veya daha fazla karakterli değerler); daha kısa değerler `***` olur.
  - Varsayılanlar; yaygın anahtar atamalarını, CLI bayraklarını, JSON alanlarını, bearer başlıklarını, PEM bloklarını, popüler tedarikçi belirteci öneklerini ve ödeme kimlik bilgisi alan adlarını (kart numarası, CVC/CVV, paylaşılan ödeme belirteci, ödeme kimlik bilgisi) kapsar.

Bazı güvenlik sınırları, `logging.redactSensitive` ayarından bağımsız olarak her zaman gizleme uygular: Denetim Arayüzü araç çağrısı olayları, `sessions_history` araç çıktısı, tanılama destek dışa aktarımları, sağlayıcı hata gözlemleri, exec onay komutu gösterimi ve Gateway WebSocket protokol günlükleri. Bu yüzeyler, ek kalıplar olarak `logging.redactPatterns` değerine yine uyar; ancak `redactSensitive: "off"` ham gizli değerler yayınlamalarını sağlamaz.

## Gateway WebSocket günlükleri

Gateway, WebSocket protokol günlüklerini iki modda yazdırır:

- **Normal mod (`--verbose` olmadan)**: yalnızca "dikkate değer" RPC sonuçları yazdırılır; hatalar (`ok=false`), yavaş çağrılar (varsayılan eşik: `>= 50ms`) ve ayrıştırma hataları.
- **Ayrıntılı mod (`--verbose`)**: tüm WS istek/yanıt trafiğini yazdırır.

### WS günlük stili

`openclaw gateway`, Gateway başına bir stil anahtarını destekler:

- `--ws-log auto` (varsayılan): normal mod optimize edilmiştir; ayrıntılı mod sıkıştırılmış çıktı kullanır.
- `--ws-log compact`: ayrıntılı modda sıkıştırılmış çıktı (eşleştirilmiş istek/yanıt).
- `--ws-log full`: ayrıntılı modda kare başına tam çıktı.
- `--compact`: `--ws-log compact` için takma ad.

```bash
# optimize edilmiş (yalnızca hatalar/yavaş çağrılar)
openclaw gateway

# tüm WS trafiğini göster (eşleştirilmiş)
openclaw gateway --verbose --ws-log compact

# tüm WS trafiğini göster (tam meta veriler)
openclaw gateway --verbose --ws-log full
```

## Konsol biçimlendirmesi (alt sistem günlükleme)

Konsol biçimlendiricisi **TTY'ye duyarlıdır** ve tutarlı, önekli satırlar yazdırır. Alt sistem günlükleyicileri çıktıyı gruplandırılmış ve kolayca taranabilir tutar:

- Her satırda **alt sistem önekleri** (ör. `[gateway]`, `[canvas]`, `[tailscale]`).
- **Alt sistem renkleri** (alt sistem başına kararlı, addan karma oluşturularak belirlenir) ve düzey renklendirmesi.
- Çıktı bir TTY olduğunda veya ortam zengin bir terminal gibi göründüğünde (`TERM`/`COLORTERM`/`TERM_PROGRAM`) **renk kullanımı**; `NO_COLOR` ve `FORCE_COLOR` ayarlarına uyar.
- **Kısaltılmış alt sistem önekleri**: baştaki `gateway/`, `channels/` veya `providers/` bölümünü kaldırır, ardından kalan bölümlerin en fazla son 2 tanesini tutar (ör. `channels/turn/kernel`, `turn/kernel` olarak görüntülenir). Bilinen kanal alt sistemleri (`telegram`, `whatsapp`, `slack` vb.) her zaman yalnızca kanal adına indirgenir.
- **Alt sisteme göre alt günlükleyiciler** (otomatik önek + yapılandırılmış `{ subsystem }` alanı).
- QR/UX çıktısı için **`logRaw()`** (önek yok, biçimlendirme yok).
- **Konsol stilleri**: `pretty` | `compact` | `json`.
- **Konsol günlük düzeyi**, dosya günlük düzeyinden ayrıdır (`logging.level`, `debug`/`trace` olduğunda dosya tüm ayrıntıları korur).
- **WhatsApp ileti gövdeleri** `debug` düzeyinde günlüğe kaydedilir (bunları görmek için `--verbose` kullanın).

Bu, etkileşimli çıktıyı kolayca taranabilir hâle getirirken dosya günlüklerini kararlı tutar.

## İlgili konular

- [Günlükleme](/tr/logging)
- [OpenTelemetry dışa aktarımı](/tr/gateway/opentelemetry)
- [Tanılama dışa aktarımı](/tr/gateway/diagnostics)
