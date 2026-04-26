---
read_when:
    - Yerel kontrol API'si üzerinden agent tarayıcısını betiklemek veya hata ayıklamak
    - '`openclaw browser` CLI referansını arıyorsunuz'
    - Anlık görüntüler ve ref'lerle özel tarayıcı otomasyonu ekliyorsunuz
summary: OpenClaw tarayıcı kontrol API'si, CLI referansı ve betik eylemleri
title: Tarayıcı kontrol API'si
x-i18n:
    generated_at: "2026-04-26T11:41:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: bdaaff3d218aeee4c9a01478b3a3380b813ad4578d7eb74120e0745c87af66f6
    source_path: tools/browser-control.md
    workflow: 15
---

Kurulum, yapılandırma ve sorun giderme için bkz. [Browser](/tr/tools/browser).
Bu sayfa, yerel kontrol HTTP API'si, `openclaw browser`
CLI'si ve betik kalıpları (anlık görüntüler, ref'ler, beklemeler, hata ayıklama akışları) için referanstır.

## Kontrol API'si (isteğe bağlı)

Yalnızca yerel entegrasyonlar için Gateway küçük bir loopback HTTP API'si sunar:

- Durum/başlat/durdur: `GET /`, `POST /start`, `POST /stop`
- Sekmeler: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Anlık görüntü/ekran görüntüsü: `GET /snapshot`, `POST /screenshot`
- Eylemler: `POST /navigate`, `POST /act`
- Kancalar: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- İndirmeler: `POST /download`, `POST /wait/download`
- Hata ayıklama: `GET /console`, `POST /pdf`
- Hata ayıklama: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Ağ: `POST /response/body`
- Durum: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- Durum: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Ayarlar: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

Tüm uç noktalar `?profile=<name>` kabul eder. `POST /start?headless=true`,
kalıcı tarayıcı yapılandırmasını değiştirmeden yerel yönetilen profiller için
tek seferlik headless başlatma ister; ekleme-only, uzak CDP ve mevcut-oturum profilleri
bu geçersiz kılmayı reddeder çünkü OpenClaw bu tarayıcı süreçlerini başlatmaz.

Paylaşılan gizli anahtar gateway kimlik doğrulaması yapılandırıldıysa, tarayıcı HTTP rotaları da kimlik doğrulama gerektirir:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` veya bu parola ile HTTP Basic auth

Notlar:

- Bu bağımsız loopback tarayıcı API'si trusted-proxy veya
  Tailscale Serve kimlik başlıklarını **kullanmaz**.
- `gateway.auth.mode` değeri `none` veya `trusted-proxy` ise, bu loopback tarayıcı
  rotaları bu kimlik taşıyan modları devralmaz; bunları yalnızca loopback olarak tutun.

### `/act` hata sözleşmesi

`POST /act`, rota düzeyinde doğrulama ve
politika hataları için yapılandırılmış bir hata yanıtı kullanır:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Geçerli `code` değerleri:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` eksik veya tanınmıyor.
- `ACT_INVALID_REQUEST` (HTTP 400): eylem yükü normalize etme veya doğrulamadan geçemedi.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector`, desteklenmeyen bir eylem türü ile kullanıldı.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (veya `wait --fn`) yapılandırma tarafından devre dışı bırakıldı.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): üst düzey veya toplu `targetId`, istek hedefiyle çakışıyor.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): eylem, mevcut-oturum profilleri için desteklenmiyor.

Diğer çalışma zamanı hataları yine de `code`
alanı olmadan `{ "error": "<message>" }` döndürebilir.

### Playwright gereksinimi

Bazı özellikler (navigate/act/AI snapshot/role snapshot, öğe ekran görüntüleri,
PDF) Playwright gerektirir. Playwright yüklü değilse bu uç noktalar
açık bir 501 hatası döndürür.

Playwright olmadan yine de çalışanlar:

- ARIA anlık görüntüleri
- Sekme başına bir CDP WebSocket mevcut olduğunda rol tarzı erişilebilirlik anlık görüntüleri (`--interactive`, `--compact`,
  `--depth`, `--efficient`). Bu,
  inceleme ve ref bulma için bir geri dönüş yoludur; birincil eylem motoru yine Playwright'tır.
- Sekme başına bir CDP
  WebSocket mevcut olduğunda yönetilen `openclaw` tarayıcısı için sayfa ekran görüntüleri
- `existing-session` / Chrome MCP profilleri için sayfa ekran görüntüleri
- Anlık görüntü çıktısından `existing-session` ref tabanlı ekran görüntüleri (`--ref`)

Hâlâ Playwright gerektirenler:

- `navigate`
- `act`
- Playwright'ın doğal AI anlık görüntü biçimine bağlı AI anlık görüntüleri
- CSS seçici tabanlı öğe ekran görüntüleri (`--element`)
- tam tarayıcı PDF dışa aktarma

Öğe ekran görüntüleri ayrıca `--full-page` seçeneğini reddeder; rota
`fullPage is not supported for element screenshots` döndürür.

`Playwright is not available in this gateway build` görürseniz,
`playwright-core` yüklenecek şekilde paketlenmiş tarayıcı Plugin çalışma zamanı bağımlılıklarını onarın,
ardından gateway'i yeniden başlatın. Paketlenmiş kurulumlar için `openclaw doctor --fix` çalıştırın.
Docker için, aşağıda gösterildiği gibi Chromium tarayıcı ikili dosyalarını da kurun.

#### Docker Playwright kurulumu

Gateway'iniz Docker içinde çalışıyorsa `npx playwright` kullanmaktan kaçının (npm override çakışmaları).
Bunun yerine paketlenmiş CLI'yi kullanın:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Tarayıcı indirmelerini kalıcı hale getirmek için `PLAYWRIGHT_BROWSERS_PATH` ayarlayın (örneğin
`/home/node/.cache/ms-playwright`) ve `/home/node` yolunun
`OPENCLAW_HOME_VOLUME` veya bir bind mount ile kalıcı olduğundan emin olun. Bkz. [Docker](/tr/install/docker).

## Nasıl çalışır (iç)

Küçük bir loopback kontrol sunucusu HTTP isteklerini kabul eder ve CDP üzerinden Chromium tabanlı tarayıcılara bağlanır. Gelişmiş eylemler (click/type/snapshot/PDF) CDP üzerinde Playwright üzerinden gider; Playwright eksik olduğunda yalnızca Playwright gerektirmeyen işlemler kullanılabilir. Yerel/uzak tarayıcılar ve profiller altta serbestçe değişse de agent tek bir kararlı arayüz görür.

## CLI hızlı referansı

Tüm komutlar belirli bir profili hedeflemek için `--browser-profile <name>` ve makine tarafından okunabilir çıktı için `--json` kabul eder.

<AccordionGroup>

<Accordion title="Temeller: durum, sekmeler, aç/odakla/kapat">

```bash
openclaw browser status
openclaw browser start
openclaw browser start --headless # tek seferlik yerel yönetilen headless başlatma
openclaw browser stop            # ayrıca attach-only/uzak CDP'de emülasyonu temizler
openclaw browser tabs
openclaw browser tab             # geçerli sekme için kısayol
openclaw browser tab new
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://example.com
openclaw browser focus abcd1234
openclaw browser close abcd1234
```

</Accordion>

<Accordion title="İnceleme: ekran görüntüsü, anlık görüntü, konsol, hatalar, istekler">

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref 12        # veya --ref e12
openclaw browser screenshot --labels
openclaw browser snapshot
openclaw browser snapshot --format aria --limit 200
openclaw browser snapshot --interactive --compact --depth 6
openclaw browser snapshot --efficient
openclaw browser snapshot --labels
openclaw browser snapshot --urls
openclaw browser snapshot --selector "#main" --interactive
openclaw browser snapshot --frame "iframe#main" --interactive
openclaw browser console --level error
openclaw browser errors --clear
openclaw browser requests --filter api --clear
openclaw browser pdf
openclaw browser responsebody "**/api" --max-chars 5000
```

</Accordion>

<Accordion title="Eylemler: navigate, click, type, drag, wait, evaluate">

```bash
openclaw browser navigate https://example.com
openclaw browser resize 1280 720
openclaw browser click 12 --double           # veya rol ref'leri için e12
openclaw browser click-coords 120 340        # görünüm alanı koordinatları
openclaw browser type 23 "hello" --submit
openclaw browser press Enter
openclaw browser hover 44
openclaw browser scrollintoview e12
openclaw browser drag 10 11
openclaw browser select 9 OptionA OptionB
openclaw browser download e12 report.pdf
openclaw browser waitfordownload report.pdf
openclaw browser upload /tmp/openclaw/uploads/file.pdf
openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'
openclaw browser dialog --accept
openclaw browser wait --text "Done"
openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"
openclaw browser evaluate --fn '(el) => el.textContent' --ref 7
openclaw browser highlight e12
openclaw browser trace start
openclaw browser trace stop
```

</Accordion>

<Accordion title="Durum: çerezler, depolama, çevrimdışı, başlıklar, coğrafi konum, cihaz">

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url "https://example.com"
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set theme dark
openclaw browser storage session clear
openclaw browser set offline on
openclaw browser set headers --headers-json '{"X-Debug":"1"}'
openclaw browser set credentials user pass            # kaldırmak için --clear
openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"
openclaw browser set media dark
openclaw browser set timezone America/New_York
openclaw browser set locale en-US
openclaw browser set device "iPhone 14"
```

</Accordion>

</AccordionGroup>

Notlar:

- `upload` ve `dialog` **hazırlama** çağrılarıdır; dosya seçiciyi/dialog'u tetikleyen click/press işleminden önce bunları çalıştırın.
- `click`/`type`/vb. `snapshot` çıktısından bir `ref` gerektirir (sayısal `12`, rol ref'i `e12` veya eyleme dönüştürülebilir ARIA ref'i `ax12`). CSS seçicileri eylemler için bilerek desteklenmez. Görünür viewport konumu tek güvenilir hedef olduğunda `click-coords` kullanın.
- İndirme, trace ve upload yolları OpenClaw geçici kökleri ile sınırlıdır: `/tmp/openclaw{,/downloads,/uploads}` (geri dönüş: `${os.tmpdir()}/openclaw/...`).
- `upload`, dosya girişlerini `--input-ref` veya `--element` ile de doğrudan ayarlayabilir.

Kararlı sekme kimlikleri ve etiketleri, OpenClaw değiştirme sekmesini
kanıtlayabildiğinde Chromium ham hedef değiştirmesinden sonra da korunur; örneğin aynı URL veya form gönderiminden sonra tek eski sekmenin tek yeni sekmeye dönüşmesi gibi. Ham hedef kimlikleri yine de değişkendir; betiklerde `tabs` çıktısındaki `suggestedTargetId` değerini tercih edin.

Anlık görüntü bayrakları özetle:

- `--format ai` (Playwright ile varsayılan): sayısal ref'li AI anlık görüntüsü (`aria-ref="<n>"`).
- `--format aria`: `axN` ref'li erişilebilirlik ağacı. Playwright mevcut olduğunda OpenClaw, takip eylemlerinin bunları kullanabilmesi için ref'leri backend DOM kimlikleriyle canlı sayfaya bağlar; aksi halde çıktıyı yalnızca inceleme amaçlı değerlendirin.
- `--efficient` (veya `--mode efficient`): kompakt rol anlık görüntüsü ön ayarı. Bunu varsayılan yapmak için `browser.snapshotDefaults.mode: "efficient"` ayarlayın (bkz. [Gateway yapılandırması](/tr/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector` bir rol anlık görüntüsünü `ref=e12` ref'leriyle zorlar. `--frame "<iframe>"` rol anlık görüntülerini bir iframe ile sınırlar.
- `--labels`, üstüne ref etiketleri bindirilmiş yalnızca viewport ekran görüntüsü ekler (`MEDIA:<path>` yazdırır).
- `--urls`, AI anlık görüntülerine keşfedilen bağlantı hedeflerini ekler.

## Anlık görüntüler ve ref'ler

OpenClaw iki “anlık görüntü” stilini destekler:

- **AI anlık görüntüsü (sayısal ref'ler)**: `openclaw browser snapshot` (varsayılan; `--format ai`)
  - Çıktı: sayısal ref'ler içeren bir metin anlık görüntüsü.
  - Eylemler: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - İçeride ref, Playwright'ın `aria-ref` özelliği üzerinden çözümlenir.

- **Rol anlık görüntüsü (`e12` gibi rol ref'leri)**: `openclaw browser snapshot --interactive` (`--compact`, `--depth`, `--selector`, `--frame` da olur)
  - Çıktı: `[ref=e12]` (ve isteğe bağlı `[nth=1]`) içeren rol tabanlı bir liste/ağaç.
  - Eylemler: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - İçeride ref, `getByRole(...)` üzerinden çözülür (yinelenenler için `nth()` ile birlikte).
  - Üzerine bindirilmiş `e12` etiketli bir viewport ekran görüntüsü eklemek için `--labels` kullanın.
  - Bağlantı metni belirsiz olduğunda ve agent'ın somut
    gezinme hedeflerine ihtiyacı olduğunda `--urls` ekleyin.

- **ARIA anlık görüntüsü (`ax12` gibi ARIA ref'leri)**: `openclaw browser snapshot --format aria`
  - Çıktı: yapılandırılmış düğümler olarak erişilebilirlik ağacı.
  - Eylemler: anlık görüntü yolu
    Playwright ve Chrome backend DOM kimlikleri üzerinden ref'i bağlayabildiğinde `openclaw browser click ax12` çalışır.
- Playwright mevcut değilse ARIA anlık görüntüleri yine de
  inceleme için yararlı olabilir, ancak ref'ler eyleme dönüştürülemeyebilir. Eylem ref'lerine ihtiyacınız olduğunda `--format ai`
  veya `--interactive` ile yeniden anlık görüntü alın.
- Ham CDP geri dönüş yolu için Docker kanıtı: `pnpm test:docker:browser-cdp-snapshot`
  Chromium'u CDP ile başlatır, `browser doctor --deep` çalıştırır ve rol
  anlık görüntülerinin bağlantı URL'leri, imleçle öne çıkarılmış tıklanabilirler ve iframe meta verileri içerdiğini doğrular.

Ref davranışı:

- Ref'ler **gezinmeler arasında kararlı değildir**; bir şey başarısız olursa `snapshot` komutunu yeniden çalıştırın ve yeni bir ref kullanın.
- `/act`, değiştirme sekmesini kanıtlayabildiğinde eylem kaynaklı değiştirmeden sonra
  geçerli ham `targetId` değerini döndürür. Takip komutları için
  kararlı sekme kimliklerini/etiketlerini kullanmaya devam edin.
- Rol anlık görüntüsü `--frame` ile alındıysa, rol ref'leri bir sonraki rol anlık görüntüsüne kadar o iframe ile sınırlanır.
- Bilinmeyen veya bayat `axN` ref'leri, Playwright'ın `aria-ref` seçicisine
  düşmek yerine hızlıca başarısız olur. Bu olduğunda aynı sekmede yeni bir
  anlık görüntü alın.

## Bekleme güçlendirmeleri

Yalnızca zaman/metin için değil, daha fazlası için de bekleyebilirsiniz:

- URL için bekleme (Playwright tarafından glob desteklenir):
  - `openclaw browser wait --url "**/dash"`
- Yükleme durumu için bekleme:
  - `openclaw browser wait --load networkidle`
- Bir JS koşulu için bekleme:
  - `openclaw browser wait --fn "window.ready===true"`
- Bir seçicinin görünür hale gelmesini bekleme:
  - `openclaw browser wait "#main"`

Bunlar birleştirilebilir:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## Hata ayıklama iş akışları

Bir eylem başarısız olduğunda (ör. “not visible”, “strict mode violation”, “covered”):

1. `openclaw browser snapshot --interactive`
2. `click <ref>` / `type <ref>` kullanın (etkileşimli modda rol ref'lerini tercih edin)
3. Hâlâ başarısız olursa: Playwright'ın neyi hedeflediğini görmek için `openclaw browser highlight <ref>`
4. Sayfa garip davranıyorsa:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Derin hata ayıklama için bir trace kaydedin:
   - `openclaw browser trace start`
   - sorunu yeniden oluşturun
   - `openclaw browser trace stop` (`TRACE:<path>` yazdırır)

## JSON çıktısı

`--json`, betikleme ve yapılandırılmış araçlar içindir.

Örnekler:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

JSON içindeki rol anlık görüntüleri, araçların yük boyutunu ve yoğunluğunu değerlendirebilmesi için `refs` ile birlikte küçük bir `stats` bloğu (satırlar/karakterler/ref'ler/interactive) içerir.

## Durum ve ortam düğmeleri

Bunlar “siteyi X gibi davranmaya zorla” iş akışları için kullanışlıdır:

- Çerezler: `cookies`, `cookies set`, `cookies clear`
- Depolama: `storage local|session get|set|clear`
- Çevrimdışı: `set offline on|off`
- Başlıklar: `set headers --headers-json '{"X-Debug":"1"}'` (eski `set headers --json '{"X-Debug":"1"}'` kullanımı da desteklenmeye devam eder)
- HTTP basic auth: `set credentials user pass` (veya `--clear`)
- Coğrafi konum: `set geo <lat> <lon> --origin "https://example.com"` (veya `--clear`)
- Medya: `set media dark|light|no-preference|none`
- Saat dilimi / yerel ayar: `set timezone ...`, `set locale ...`
- Cihaz / viewport:
  - `set device "iPhone 14"` (Playwright cihaz ön ayarları)
  - `set viewport 1280 720`

## Güvenlik ve gizlilik

- `openclaw` tarayıcı profili oturum açılmış oturumlar içerebilir; bunu hassas kabul edin.
- `browser act kind=evaluate` / `openclaw browser evaluate` ve `wait --fn`
  sayfa bağlamında rastgele JavaScript çalıştırır. Prompt injection bunu
  yönlendirebilir. Buna ihtiyacınız yoksa `browser.evaluateEnabled=false` ile devre dışı bırakın.
- Girişler ve anti-bot notları için (X/Twitter vb.) bkz. [Tarayıcı girişi + X/Twitter gönderimi](/tr/tools/browser-login).
- Gateway/node ana makinesini özel tutun (yalnızca loopback veya tailnet).
- Uzak CDP uç noktaları güçlüdür; tünelleyin ve koruyun.

Katı mod örneği (varsayılan olarak özel/iç hedefleri engelle):

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // isteğe bağlı tam izin
    },
  },
}
```

## İlgili

- [Browser](/tr/tools/browser) — genel bakış, yapılandırma, profiller, güvenlik
- [Tarayıcı girişi](/tr/tools/browser-login) — sitelerde oturum açma
- [Browser Linux sorun giderme](/tr/tools/browser-linux-troubleshooting)
- [Browser WSL2 sorun giderme](/tr/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
