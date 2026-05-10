---
read_when:
    - Yerel denetim API'si aracılığıyla ajan tarayıcısını betiklerle denetleme veya hata ayıklama
    - '`openclaw browser` CLI referansını mı arıyorsunuz'
    - Anlık görüntüler ve referanslarla özel tarayıcı otomasyonu ekleme
summary: OpenClaw tarayıcı denetimi API'si, CLI referansı ve betik oluşturma eylemleri
title: Tarayıcı denetimi API'si
x-i18n:
    generated_at: "2026-05-10T19:56:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: eec952e6befed8911b83fc554b1c08cc5f20d3deff9c6cc791cb8a009bb9e7f3
    source_path: tools/browser-control.md
    workflow: 16
---

Kurulum, yapılandırma ve sorun giderme için bkz. [Tarayıcı](/tr/tools/browser).
Bu sayfa, yerel denetim HTTP API'si, `openclaw browser`
CLI'si ve betik desenleri (anlık görüntüler, ref'ler, beklemeler, hata ayıklama akışları) için başvuru kaynağıdır.

## Kontrol API'si (isteğe bağlı)

Yalnızca yerel entegrasyonlar için Gateway küçük bir loopback HTTP API'si sunar:

- Durum/başlat/durdur: `GET /`, `POST /start`, `POST /stop`
- Sekmeler: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Anlık görüntü/ekran görüntüsü: `GET /snapshot`, `POST /screenshot`
- Eylemler: `POST /navigate`, `POST /act`
- Kancalar: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- İndirmeler: `POST /download`, `POST /wait/download`
- İzinler: `POST /permissions/grant`
- Hata ayıklama: `GET /console`, `POST /pdf`
- Hata ayıklama: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Ağ: `POST /response/body`
- Durum: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- Durum: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Ayarlar: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

Tüm uç noktalar `?profile=<name>` kabul eder. `POST /start?headless=true`, kalıcı
tarayıcı yapılandırmasını değiştirmeden yerel yönetilen profiller için tek seferlik
başsız başlatma ister; OpenClaw bu tarayıcı süreçlerini başlatmadığı için yalnızca ekleme, uzak CDP ve mevcut oturum profilleri
bu geçersiz kılmayı reddeder.

Paylaşılan gizli anahtarlı gateway kimlik doğrulaması yapılandırılmışsa tarayıcı HTTP rotaları da kimlik doğrulaması gerektirir:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` veya bu parolayla HTTP Basic auth

Notlar:

- Bu bağımsız loopback tarayıcı API'si güvenilen proxy veya
  Tailscale Serve kimlik başlıklarını kullanmaz.
- `gateway.auth.mode`, `none` veya `trusted-proxy` ise bu loopback tarayıcı
  rotaları bu kimlik taşıyan modları devralmaz; bunları yalnızca loopback olarak tutun.

### `/act` hata sözleşmesi

`POST /act`, rota düzeyi doğrulama ve ilke hataları için yapılandırılmış bir hata yanıtı kullanır:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Geçerli `code` değerleri:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` eksik veya tanınmıyor.
- `ACT_INVALID_REQUEST` (HTTP 400): eylem yükü normalleştirme veya doğrulamadan geçemedi.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` desteklenmeyen bir eylem türüyle kullanıldı.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (veya `wait --fn`) yapılandırma tarafından devre dışı bırakılmış.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): üst düzey veya toplu `targetId`, istek hedefiyle çakışıyor.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): eylem mevcut oturum profilleri için desteklenmiyor.

Diğer çalışma zamanı hataları hâlâ `code` alanı olmadan
`{ "error": "<message>" }` döndürebilir.

### Playwright gereksinimi

Bazı özellikler (gezinme/eylem/AI anlık görüntüsü/rol anlık görüntüsü, öğe ekran görüntüleri,
PDF) Playwright gerektirir. Playwright yüklü değilse bu uç noktalar
açık bir 501 hatası döndürür.

Playwright olmadan hâlâ çalışanlar:

- ARIA anlık görüntüleri
- Sekme başına CDP WebSocket kullanılabilir olduğunda rol tarzı erişilebilirlik anlık görüntüleri (`--interactive`, `--compact`,
  `--depth`, `--efficient`). Bu, inceleme ve ref keşfi için
  bir yedektir; Playwright birincil eylem motoru olarak kalır.
- Sekme başına CDP
  WebSocket kullanılabilir olduğunda yönetilen `openclaw` tarayıcısı için sayfa ekran görüntüleri
- `existing-session` / Chrome MCP profilleri için sayfa ekran görüntüleri
- Anlık görüntü çıktısından `existing-session` ref tabanlı ekran görüntüleri (`--ref`)

Hâlâ Playwright gerektirenler:

- `navigate`
- `act`
- Playwright'ın yerel AI anlık görüntü biçimine bağlı AI anlık görüntüleri
- CSS seçici öğe ekran görüntüleri (`--element`)
- tam tarayıcı PDF dışa aktarımı

Öğe ekran görüntüleri ayrıca `--full-page` seçeneğini reddeder; rota `fullPage is
not supported for element screenshots` döndürür.

`Playwright is not available in this gateway build` görürseniz paketlenmiş
Gateway temel tarayıcı çalışma zamanı bağımlılığından yoksundur. OpenClaw'ı yeniden yükleyin veya güncelleyin,
sonra gateway'i yeniden başlatın. Docker için ayrıca aşağıda gösterildiği gibi Chromium
tarayıcı ikili dosyalarını yükleyin.

#### Docker Playwright kurulumu

Gateway'iniz Docker içinde çalışıyorsa `npx playwright` kullanmaktan kaçının (npm geçersiz kılma çakışmaları).
Bunun yerine paketlenmiş CLI'yi kullanın:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Tarayıcı indirmelerini kalıcı yapmak için `PLAYWRIGHT_BROWSERS_PATH` ayarlayın (örneğin,
`/home/node/.cache/ms-playwright`) ve `/home/node` dizininin
`OPENCLAW_HOME_VOLUME` veya bir bind mount üzerinden kalıcı olduğundan emin olun. OpenClaw, Linux'ta kalıcı
Chromium'u otomatik algılar. Bkz. [Docker](/tr/install/docker).

## Nasıl çalışır (dahili)

Küçük bir loopback denetim sunucusu HTTP isteklerini kabul eder ve Chromium tabanlı tarayıcılara CDP üzerinden bağlanır. Gelişmiş eylemler (tıklama/yazma/anlık görüntü/PDF), CDP üzerinde Playwright üzerinden geçer; Playwright eksik olduğunda yalnızca Playwright dışı işlemler kullanılabilir. Aracı, yerel/uzak tarayıcılar ve profiller altta serbestçe değişirken tek bir kararlı arayüz görür.

## CLI hızlı başvuru

Tüm komutlar belirli bir profili hedeflemek için `--browser-profile <name>`, makine tarafından okunabilir çıktı için de `--json` kabul eder.

<AccordionGroup>

<Accordion title="Temeller: durum, sekmeler, aç/odaklan/kapat">

```bash
openclaw browser status
openclaw browser start
openclaw browser start --headless # one-shot local managed headless launch
openclaw browser stop            # also clears emulation on attach-only/remote CDP
openclaw browser tabs
openclaw browser tab             # shortcut for current tab
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
openclaw browser screenshot --ref 12        # or --ref e12
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

<Accordion title="Eylemler: gezinme, tıklama, yazma, sürükleme, bekleme, değerlendirme">

```bash
openclaw browser navigate https://example.com
openclaw browser resize 1280 720
openclaw browser click 12 --double           # or e12 for role refs
openclaw browser click-coords 120 340        # viewport coordinates
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
openclaw browser set credentials user pass            # --clear to remove
openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"
openclaw browser set media dark
openclaw browser set timezone America/New_York
openclaw browser set locale en-US
openclaw browser set device "iPhone 14"
```

</Accordion>

</AccordionGroup>

Notlar:

- `upload` ve `dialog` **hazırlama** çağrılarıdır; bunları seçiciyi/iletişim kutusunu tetikleyen tıklama/tuşa basmadan önce çalıştırın.
- `click`/`type`/vb. `snapshot` kaynağından bir `ref` gerektirir (sayısal `12`, rol ref'i `e12` veya eyleme geçirilebilir ARIA ref'i `ax12`). CSS seçicileri eylemler için bilerek desteklenmez. Görünür viewport konumu tek güvenilir hedef olduğunda `click-coords` kullanın.
- İndirme, iz ve yükleme yolları OpenClaw geçici kökleriyle sınırlıdır: `/tmp/openclaw{,/downloads,/uploads}` (yedek: `${os.tmpdir()}/openclaw/...`).
- `upload`, dosya girişlerini `--input-ref` veya `--element` aracılığıyla doğrudan da ayarlayabilir.

OpenClaw, aynı URL veya form gönderiminden sonra tek bir eski sekmenin
tek bir yeni sekmeye dönüşmesi gibi durumlarda yedek sekmeyi kanıtlayabildiğinde kararlı sekme kimlikleri ve etiketleri Chromium ham hedef değişiminden sonra da korunur.
Ham hedef kimlikleri yine de değişkendir; betiklerde
`tabs` çıktısındaki `suggestedTargetId` değerini tercih edin.

Bir bakışta anlık görüntü bayrakları:

- `--format ai` (Playwright ile varsayılan): sayısal ref'ler içeren AI anlık görüntüsü (`aria-ref="<n>"`).
- `--format aria`: `axN` ref'leriyle erişilebilirlik ağacı. Playwright kullanılabilir olduğunda OpenClaw, takip eylemlerinin bunları kullanabilmesi için ref'leri arka uç DOM kimlikleriyle canlı sayfaya bağlar; aksi halde çıktıyı yalnızca inceleme amaçlı kabul edin.
- `--efficient` (veya `--mode efficient`): kompakt rol anlık görüntüsü ön ayarı. Bunu varsayılan yapmak için `browser.snapshotDefaults.mode: "efficient"` ayarlayın (bkz. [Gateway yapılandırması](/tr/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector`, `ref=e12` ref'leriyle rol anlık görüntüsünü zorlar. `--frame "<iframe>"`, rol anlık görüntülerini bir iframe ile sınırlar.
- `--labels`, üzerine ref etiketleri bindirilmiş yalnızca viewport ekran görüntüsü ekler (`MEDIA:<path>` yazdırır).
- `--urls`, keşfedilen bağlantı hedeflerini AI anlık görüntülerine ekler.

## Anlık görüntüler ve ref'ler

OpenClaw iki "anlık görüntü" stilini destekler:

- **AI anlık görüntüsü (sayısal ref'ler)**: `openclaw browser snapshot` (varsayılan; `--format ai`)
  - Çıktı: sayısal ref'ler içeren metin anlık görüntüsü.
  - Eylemler: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Dahili olarak ref, Playwright'ın `aria-ref` değeri üzerinden çözümlenir.

- **Rol anlık görüntüsü (`e12` gibi rol ref'leri)**: `openclaw browser snapshot --interactive` (veya `--compact`, `--depth`, `--selector`, `--frame`)
  - Çıktı: `[ref=e12]` (ve isteğe bağlı `[nth=1]`) içeren rol tabanlı liste/ağaç.
  - Eylemler: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Dahili olarak ref, `getByRole(...)` (yinelenenler için ayrıca `nth()`) üzerinden çözümlenir.
  - Üzerine bindirilmiş `e12` etiketleriyle bir viewport ekran görüntüsü eklemek için `--labels` ekleyin.
  - Bağlantı metni belirsiz olduğunda ve aracının somut
    gezinme hedeflerine ihtiyacı olduğunda `--urls` ekleyin.

- **ARIA anlık görüntüsü (`ax12` gibi ARIA ref'leri)**: `openclaw browser snapshot --format aria`
  - Çıktı: yapılandırılmış düğümler olarak erişilebilirlik ağacı.
  - Eylemler: Anlık görüntü yolu ref'i Playwright ve Chrome arka uç DOM kimlikleri üzerinden bağlayabildiğinde
    `openclaw browser click ax12` çalışır.
- Playwright kullanılamıyorsa ARIA anlık görüntüleri inceleme için hâlâ yararlı olabilir,
  ancak ref'ler eyleme geçirilebilir olmayabilir. Eylem ref'lerine ihtiyacınız olduğunda `--format ai`
  veya `--interactive` ile yeniden anlık görüntü alın.
- Ham CDP yedek yolu için Docker kanıtı: `pnpm test:docker:browser-cdp-snapshot`,
  Chromium'u CDP ile başlatır, `browser doctor --deep` çalıştırır ve rol
  anlık görüntülerinin bağlantı URL'lerini, imleçle öne çıkarılan tıklanabilirleri ve iframe meta verilerini içerdiğini doğrular.

Ref davranışı:

- Referanslar **gezinmeler arasında kararlı değildir**; bir şey başarısız olursa `snapshot` komutunu yeniden çalıştırın ve yeni bir ref kullanın.
- `/act`, değişimi tetikleyen eylemden sonra mevcut ham `targetId` değerini döndürür
  ve bunu yedek sekmeyi kanıtlayabildiğinde yapar. Takip komutları için
  kararlı sekme id'lerini/etiketlerini kullanmaya devam edin.
- Rol anlık görüntüsü `--frame` ile alındıysa, rol referansları bir sonraki rol anlık görüntüsüne kadar o iframe ile sınırlıdır.
- Bilinmeyen veya eski `axN` referansları, Playwright'ın `aria-ref` seçicisine
  düşmek yerine hızlıca başarısız olur. Bu olduğunda aynı sekmede yeni bir
  anlık görüntü çalıştırın.

## Bekleme yetenekleri

Zaman/metinden daha fazlasını bekleyebilirsiniz:

- URL bekle (glob'lar Playwright tarafından desteklenir):
  - `openclaw browser wait --url "**/dash"`
- Yükleme durumunu bekle:
  - `openclaw browser wait --load networkidle`
- Bir JS koşulunu bekle:
  - `openclaw browser wait --fn "window.ready===true"`
- Bir seçicinin görünür olmasını bekle:
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

Bir eylem başarısız olduğunda (ör. "not visible", "strict mode violation", "covered"):

1. `openclaw browser snapshot --interactive`
2. `click <ref>` / `type <ref>` kullanın (etkileşimli modda rol referanslarını tercih edin)
3. Hala başarısız olursa: Playwright'ın neyi hedeflediğini görmek için `openclaw browser highlight <ref>`
4. Sayfa garip davranıyorsa:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Derin hata ayıklama için: bir iz kaydedin:
   - `openclaw browser trace start`
   - sorunu yeniden üretin
   - `openclaw browser trace stop` (`TRACE:<path>` yazdırır)

## JSON çıktısı

`--json`, betik oluşturma ve yapılandırılmış araçlar içindir.

Örnekler:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

JSON içindeki rol anlık görüntüleri, araçların yük boyutu ve yoğunluğu hakkında akıl yürütebilmesi için `refs` ile birlikte küçük bir `stats` bloğu (satırlar/karakterler/referanslar/etkileşimli) içerir.

## Durum ve ortam düğmeleri

Bunlar "site X gibi davransın" iş akışları için kullanışlıdır:

- Çerezler: `cookies`, `cookies set`, `cookies clear`
- Depolama: `storage local|session get|set|clear`
- Çevrimdışı: `set offline on|off`
- Başlıklar: `set headers --headers-json '{"X-Debug":"1"}'` (eski `set headers --json '{"X-Debug":"1"}'` desteklenmeye devam eder)
- HTTP temel kimlik doğrulama: `set credentials user pass` (veya `--clear`)
- Coğrafi konum: `set geo <lat> <lon> --origin "https://example.com"` (veya `--clear`)
- Medya: `set media dark|light|no-preference|none`
- Saat dilimi / yerel ayar: `set timezone ...`, `set locale ...`
- Cihaz / görüntü alanı:
  - `set device "iPhone 14"` (Playwright cihaz hazır ayarları)
  - `set viewport 1280 720`

## Güvenlik ve gizlilik

- openclaw tarayıcı profili oturum açılmış oturumlar içerebilir; hassas kabul edin.
- `browser act kind=evaluate` / `openclaw browser evaluate` ve `wait --fn`,
  sayfa bağlamında rastgele JavaScript yürütür. Prompt enjeksiyonu bunu
  yönlendirebilir. İhtiyacınız yoksa `browser.evaluateEnabled=false` ile devre dışı bırakın.
- Oturum açma ve bot karşıtı notlar (X/Twitter vb.) için bkz. [Tarayıcı oturum açma + X/Twitter gönderimi](/tr/tools/browser-login).
- Gateway/Node ana makinesini özel tutun (loopback veya yalnızca tailnet).
- Uzak CDP uç noktaları güçlüdür; tünelleyin ve koruyun.

Strict-mode örneği (özel/dahili hedefleri varsayılan olarak engelle):

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // optional exact allow
    },
  },
}
```

## İlgili

- [Tarayıcı](/tr/tools/browser) - genel bakış, yapılandırma, profiller, güvenlik
- [Tarayıcı oturum açma](/tr/tools/browser-login) - sitelerde oturum açma
- [Tarayıcı Linux sorun giderme](/tr/tools/browser-linux-troubleshooting)
- [Tarayıcı WSL2 sorun giderme](/tr/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
