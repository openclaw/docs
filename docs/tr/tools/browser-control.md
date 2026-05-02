---
read_when:
    - Yerel kontrol API'si aracılığıyla ajan tarayıcısını betikleme veya hata ayıklama
    - '`openclaw browser` CLI referansını mı arıyorsunuz'
    - Özel tarayıcı otomasyonunu anlık görüntüler ve referanslarla ekleme
summary: OpenClaw tarayıcı denetimi API'si, CLI referansı ve betik eylemleri
title: Tarayıcı kontrol API'si
x-i18n:
    generated_at: "2026-05-02T09:07:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef996319c09bfa8de9b5c3a340c68496ac3698295b62f4f07c79f3e233eda2a2
    source_path: tools/browser-control.md
    workflow: 16
---

Kurulum, yapılandırma ve sorun giderme için bkz. [Browser](/tr/tools/browser).
Bu sayfa yerel kontrol HTTP API'si, `openclaw browser` CLI ve betik oluşturma kalıpları (anlık görüntüler, ref'ler, beklemeler, hata ayıklama akışları) için başvuru kaynağıdır.

## Kontrol API'si (isteğe bağlı)

Yalnızca yerel entegrasyonlar için Gateway küçük bir loopback HTTP API'si sunar:

- Durum/başlat/durdur: `GET /`, `POST /start`, `POST /stop`
- Sekmeler: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Anlık görüntü/ekran görüntüsü: `GET /snapshot`, `POST /screenshot`
- Eylemler: `POST /navigate`, `POST /act`
- Hook'lar: `POST /hooks/file-chooser`, `POST /hooks/dialog`
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
başsız başlatma ister; OpenClaw bu tarayıcı süreçlerini başlatmadığı için yalnızca
ekleme, uzak CDP ve mevcut oturum profilleri bu geçersiz kılmayı reddeder.

Paylaşılan gizli anahtarlı gateway kimlik doğrulaması yapılandırılmışsa, tarayıcı HTTP rotaları da kimlik doğrulaması gerektirir:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` veya bu parolayla HTTP Basic kimlik doğrulaması

Notlar:

- Bu bağımsız loopback tarayıcı API'si güvenilir proxy veya
  Tailscale Serve kimlik başlıklarını **kullanmaz**.
- `gateway.auth.mode` `none` veya `trusted-proxy` ise, bu loopback tarayıcı
  rotaları kimlik taşıyan bu modları devralmaz; bunları yalnızca loopback olarak tutun.

### `/act` hata sözleşmesi

`POST /act`, rota düzeyi doğrulama ve ilke hataları için yapılandırılmış bir
hata yanıtı kullanır:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Geçerli `code` değerleri:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` eksik veya tanınmıyor.
- `ACT_INVALID_REQUEST` (HTTP 400): eylem yükü normalleştirme veya doğrulamadan geçemedi.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector`, desteklenmeyen bir eylem türüyle kullanıldı.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (veya `wait --fn`) yapılandırma tarafından devre dışı bırakılmıştır.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): üst düzey veya toplu `targetId`, istek hedefiyle çakışıyor.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): eylem, mevcut oturum profilleri için desteklenmiyor.

Diğer çalışma zamanı hataları, `code` alanı olmadan yine de
`{ "error": "<message>" }` döndürebilir.

### Playwright gereksinimi

Bazı özellikler (navigate/act/AI snapshot/role snapshot, öğe ekran görüntüleri,
PDF) Playwright gerektirir. Playwright yüklü değilse, bu uç noktalar
açık bir 501 hatası döndürür.

Playwright olmadan hâlâ çalışanlar:

- ARIA anlık görüntüleri
- Sekme başına CDP WebSocket kullanılabilir olduğunda rol tarzı erişilebilirlik
  anlık görüntüleri (`--interactive`, `--compact`,
  `--depth`, `--efficient`). Bu, inceleme ve ref keşfi için
  bir geri dönüş yoludur; Playwright birincil eylem motoru olmaya devam eder.
- Sekme başına CDP WebSocket kullanılabilir olduğunda yönetilen `openclaw`
  tarayıcısı için sayfa ekran görüntüleri
- `existing-session` / Chrome MCP profilleri için sayfa ekran görüntüleri
- Anlık görüntü çıktısından `existing-session` ref tabanlı ekran görüntüleri (`--ref`)

Hâlâ Playwright gerektirenler:

- `navigate`
- `act`
- Playwright'ın yerel AI snapshot biçimine bağlı olan AI anlık görüntüleri
- CSS seçici öğe ekran görüntüleri (`--element`)
- tam tarayıcı PDF dışa aktarımı

Öğe ekran görüntüleri ayrıca `--full-page` seçeneğini reddeder; rota
`fullPage is not supported for element screenshots` döndürür.

`Playwright is not available in this gateway build` görürseniz, paketlenmiş
Gateway temel tarayıcı çalışma zamanı bağımlılığından yoksundur. OpenClaw'u
yeniden yükleyin veya güncelleyin, ardından gateway'i yeniden başlatın. Docker için,
aşağıda gösterildiği gibi Chromium tarayıcı ikili dosyalarını da yükleyin.

#### Docker Playwright kurulumu

Gateway'iniz Docker içinde çalışıyorsa, `npx playwright` kullanmaktan kaçının (npm override çakışmaları).
Bunun yerine paketlenmiş CLI'ı kullanın:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Tarayıcı indirmelerini kalıcı hale getirmek için `PLAYWRIGHT_BROWSERS_PATH` ayarlayın (örneğin,
`/home/node/.cache/ms-playwright`) ve `/home/node` dizininin
`OPENCLAW_HOME_VOLUME` veya bir bind mount aracılığıyla kalıcı olduğundan emin olun. Bkz. [Docker](/tr/install/docker).

## Nasıl çalışır (dahili)

Küçük bir loopback kontrol sunucusu HTTP isteklerini kabul eder ve CDP aracılığıyla Chromium tabanlı tarayıcılara bağlanır. Gelişmiş eylemler (click/type/snapshot/PDF), CDP üzerinde Playwright üzerinden geçer; Playwright eksik olduğunda yalnızca Playwright dışı işlemler kullanılabilir. Aracı, yerel/uzak tarayıcılar ve profiller altta serbestçe değişirken tek bir kararlı arayüz görür.

## CLI hızlı başvurusu

Tüm komutlar belirli bir profili hedeflemek için `--browser-profile <name>` ve makine tarafından okunabilir çıktı için `--json` kabul eder.

<AccordionGroup>

<Accordion title="Temel bilgiler: durum, sekmeler, aç/odaklan/kapat">

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

- `upload` ve `dialog` **hazırlama** çağrılarıdır; seçiciyi/diyaloğu tetikleyen click/press öncesinde çalıştırın.
- `click`/`type`/vb. `snapshot` kaynağından bir `ref` gerektirir (sayısal `12`, rol ref'i `e12` veya eyleme dönüştürülebilir ARIA ref'i `ax12`). CSS seçiciler eylemler için bilinçli olarak desteklenmez. Görünür viewport konumu tek güvenilir hedef olduğunda `click-coords` kullanın.
- İndirme, trace ve upload yolları OpenClaw geçici kökleriyle sınırlıdır: `/tmp/openclaw{,/downloads,/uploads}` (geri dönüş: `${os.tmpdir()}/openclaw/...`).
- `upload`, dosya girişlerini `--input-ref` veya `--element` aracılığıyla doğrudan da ayarlayabilir.

Kararlı sekme kimlikleri ve etiketleri, OpenClaw aynı URL gibi değiştirme sekmesini
kanıtlayabildiğinde veya form gönderiminden sonra tek bir eski sekme tek bir
yeni sekmeye dönüştüğünde Chromium ham hedef değişimini atlatır. Ham hedef kimlikleri
hâlâ değişkendir; betiklerde `tabs` çıktısından `suggestedTargetId` tercih edin.

Bir bakışta anlık görüntü bayrakları:

- `--format ai` (Playwright ile varsayılan): sayısal ref'ler içeren AI snapshot (`aria-ref="<n>"`).
- `--format aria`: `axN` ref'leriyle erişilebilirlik ağacı. Playwright kullanılabilir olduğunda OpenClaw, ref'leri canlı sayfaya backend DOM kimlikleriyle bağlar; böylece takip eylemleri bunları kullanabilir; aksi halde çıktıyı yalnızca inceleme amaçlı kabul edin.
- `--efficient` (veya `--mode efficient`): kompakt rol anlık görüntüsü ön ayarı. Bunu varsayılan yapmak için `browser.snapshotDefaults.mode: "efficient"` ayarlayın (bkz. [Gateway yapılandırması](/tr/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector`, `ref=e12` ref'leriyle bir rol anlık görüntüsünü zorlar. `--frame "<iframe>"`, rol anlık görüntülerini bir iframe ile sınırlar.
- `--labels`, üstüne ref etiketleri yerleştirilmiş yalnızca viewport ekran görüntüsü ekler (`MEDIA:<path>` yazdırır).
- `--urls`, AI anlık görüntülerine keşfedilen bağlantı hedeflerini ekler.

## Anlık görüntüler ve ref'ler

OpenClaw iki “anlık görüntü” stilini destekler:

- **AI snapshot (sayısal ref'ler)**: `openclaw browser snapshot` (varsayılan; `--format ai`)
  - Çıktı: sayısal ref'ler içeren bir metin anlık görüntüsü.
  - Eylemler: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Dahili olarak ref, Playwright'ın `aria-ref` mekanizmasıyla çözümlenir.

- **Rol anlık görüntüsü (`e12` gibi rol ref'leri)**: `openclaw browser snapshot --interactive` (veya `--compact`, `--depth`, `--selector`, `--frame`)
  - Çıktı: `[ref=e12]` (ve isteğe bağlı `[nth=1]`) içeren rol tabanlı bir liste/ağaç.
  - Eylemler: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Dahili olarak ref, `getByRole(...)` aracılığıyla çözümlenir (yinelenenler için ayrıca `nth()`).
  - Üstüne `e12` etiketleri yerleştirilmiş bir viewport ekran görüntüsü eklemek için `--labels` ekleyin.
  - Bağlantı metni belirsiz olduğunda ve aracının somut
    gezinme hedeflerine ihtiyacı olduğunda `--urls` ekleyin.

- **ARIA anlık görüntüsü (`ax12` gibi ARIA ref'leri)**: `openclaw browser snapshot --format aria`
  - Çıktı: yapılandırılmış düğümler olarak erişilebilirlik ağacı.
  - Eylemler: anlık görüntü yolu ref'i Playwright ve Chrome backend DOM kimlikleri
    üzerinden bağlayabildiğinde `openclaw browser click ax12` çalışır.
- Playwright kullanılamıyorsa, ARIA anlık görüntüleri inceleme için yine de
  yararlı olabilir, ancak ref'ler eyleme dönüştürülebilir olmayabilir. Eylem ref'lerine
  ihtiyacınız olduğunda `--format ai` veya `--interactive` ile yeniden anlık görüntü alın.
- Ham CDP geri dönüş yolu için Docker kanıtı: `pnpm test:docker:browser-cdp-snapshot`
  Chromium'u CDP ile başlatır, `browser doctor --deep` çalıştırır ve rol
  anlık görüntülerinin bağlantı URL'lerini, imleçle yükseltilmiş tıklanabilirleri ve iframe metadata'sını içerdiğini doğrular.

Ref davranışı:

- Ref'ler **gezinmeler arasında kararlı değildir**; bir şey başarısız olursa `snapshot` komutunu yeniden çalıştırın ve yeni bir ref kullanın.
- `/act`, değiştirme sekmesini kanıtlayabildiğinde eylemle tetiklenen değiştirmeden sonra geçerli ham `targetId` değerini döndürür. Takip komutları için kararlı sekme kimliklerini/etiketlerini kullanmaya devam edin.
- Rol snapshot'ı `--frame` ile alındıysa, rol ref'leri bir sonraki rol snapshot'ına kadar o iframe ile sınırlıdır.
- Bilinmeyen veya eski `axN` ref'leri, Playwright'ın `aria-ref` seçicisine geçmek yerine hızla başarısız olur. Bu olduğunda aynı sekmede yeni bir snapshot çalıştırın.

## Bekleme güçlendirmeleri

Yalnızca zaman/metinden fazlasını bekleyebilirsiniz:

- URL'yi bekleme (Playwright tarafından glob'lar desteklenir):
  - `openclaw browser wait --url "**/dash"`
- Yükleme durumunu bekleme:
  - `openclaw browser wait --load networkidle`
- Bir JS koşulunu bekleme:
  - `openclaw browser wait --fn "window.ready===true"`
- Bir seçicinin görünür olmasını bekleme:
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

Bir eylem başarısız olduğunda (örn. “görünür değil”, “strict mode ihlali”, “örtülü”):

1. `openclaw browser snapshot --interactive`
2. `click <ref>` / `type <ref>` kullanın (etkileşimli modda rol ref'lerini tercih edin)
3. Hala başarısız olursa: Playwright'ın neyi hedeflediğini görmek için `openclaw browser highlight <ref>`
4. Sayfa tuhaf davranıyorsa:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Derin hata ayıklama için bir trace kaydedin:
   - `openclaw browser trace start`
   - sorunu yeniden oluşturun
   - `openclaw browser trace stop` (`TRACE:<path>` yazdırır)

## JSON çıktısı

`--json`, betik yazımı ve yapılandırılmış araçlar içindir.

Örnekler:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

JSON'daki rol snapshot'ları, araçların yük boyutu ve yoğunluğu hakkında akıl yürütebilmesi için `refs` ile birlikte küçük bir `stats` bloğu (lines/chars/refs/interactive) içerir.

## Durum ve ortam ayarları

Bunlar “site X gibi davransın” iş akışları için kullanışlıdır:

- Çerezler: `cookies`, `cookies set`, `cookies clear`
- Depolama: `storage local|session get|set|clear`
- Çevrimdışı: `set offline on|off`
- Başlıklar: `set headers --headers-json '{"X-Debug":"1"}'` (eski `set headers --json '{"X-Debug":"1"}'` desteği sürer)
- HTTP basic auth: `set credentials user pass` (veya `--clear`)
- Coğrafi konum: `set geo <lat> <lon> --origin "https://example.com"` (veya `--clear`)
- Medya: `set media dark|light|no-preference|none`
- Saat dilimi / yerel ayar: `set timezone ...`, `set locale ...`
- Cihaz / viewport:
  - `set device "iPhone 14"` (Playwright cihaz ön ayarları)
  - `set viewport 1280 720`

## Güvenlik ve gizlilik

- openclaw tarayıcı profili oturum açılmış oturumlar içerebilir; bunu hassas kabul edin.
- `browser act kind=evaluate` / `openclaw browser evaluate` ve `wait --fn`, sayfa bağlamında rastgele JavaScript yürütür. Prompt enjeksiyonu bunu yönlendirebilir. Buna ihtiyacınız yoksa `browser.evaluateEnabled=false` ile devre dışı bırakın.
- Oturum açma ve bot karşıtı notlar (X/Twitter vb.) için bkz. [Tarayıcı girişi + X/Twitter gönderimi](/tr/tools/browser-login).
- Gateway/node ana makinesini özel tutun (loopback veya yalnızca tailnet).
- Uzak CDP uç noktaları güçlüdür; bunları tünelleyin ve koruyun.

Strict-mode örneği (özel/dahili hedefleri varsayılan olarak engelleyin):

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

- [Tarayıcı](/tr/tools/browser) — genel bakış, yapılandırma, profiller, güvenlik
- [Tarayıcı girişi](/tr/tools/browser-login) — sitelerde oturum açma
- [Tarayıcı Linux sorun giderme](/tr/tools/browser-linux-troubleshooting)
- [Tarayıcı WSL2 sorun giderme](/tr/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
