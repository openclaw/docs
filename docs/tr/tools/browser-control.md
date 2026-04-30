---
read_when:
    - Yerel kontrol API'si aracılığıyla aracı tarayıcısını betikleme veya hata ayıklama
    - '`openclaw browser` CLI referansını mı arıyorsunuz'
    - Anlık görüntüler ve referanslarla özel tarayıcı otomasyonu ekleme
summary: OpenClaw tarayıcı denetimi API'si, CLI referansı ve betik eylemleri
title: Tarayıcı kontrol API'si
x-i18n:
    generated_at: "2026-04-30T09:47:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8bd0c0e5a5be9a8ec865c932d28456ace6a047d15a534a79c0b81a5e8904736f
    source_path: tools/browser-control.md
    workflow: 16
---

Kurulum, yapılandırma ve sorun giderme için bkz. [Tarayıcı](/tr/tools/browser).
Bu sayfa, yerel kontrol HTTP API'si, `openclaw browser` CLI ve betik yazma kalıpları (anlık görüntüler, referanslar, beklemeler, hata ayıklama akışları) için referanstır.

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
headless başlatma ister; attach-only, uzak CDP ve mevcut oturum profilleri, OpenClaw bu tarayıcı süreçlerini başlatmadığı için
bu geçersiz kılmayı reddeder.

Paylaşılan gizli anahtarlı gateway kimlik doğrulaması yapılandırılmışsa, tarayıcı HTTP rotaları da kimlik doğrulaması gerektirir:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` veya bu parolayla HTTP Basic kimlik doğrulaması

Notlar:

- Bu bağımsız loopback tarayıcı API'si **trusted-proxy** veya
  Tailscale Serve kimlik başlıklarını kullanmaz.
- `gateway.auth.mode` `none` veya `trusted-proxy` ise, bu loopback tarayıcı
  rotaları kimlik taşıyan bu modları devralmaz; bunları yalnızca loopback olarak tutun.

### `/act` hata sözleşmesi

`POST /act`, rota düzeyinde doğrulama ve ilke hataları için yapılandırılmış bir
hata yanıtı kullanır:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Geçerli `code` değerleri:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` eksik veya tanınmıyor.
- `ACT_INVALID_REQUEST` (HTTP 400): eylem yükü normalleştirme veya doğrulamadan geçemedi.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector`, desteklenmeyen bir eylem türüyle kullanıldı.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (veya `wait --fn`) yapılandırma tarafından devre dışı bırakıldı.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): üst düzey veya toplu `targetId`, istek hedefiyle çakışıyor.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): eylem, existing-session profilleri için desteklenmiyor.

Diğer çalışma zamanı hataları yine de `code` alanı olmadan
`{ "error": "<message>" }` döndürebilir.

### Playwright gereksinimi

Bazı özellikler (navigate/act/AI anlık görüntüsü/rol anlık görüntüsü, öğe ekran görüntüleri,
PDF) Playwright gerektirir. Playwright yüklü değilse, bu uç noktalar
açık bir 501 hatası döndürür.

Playwright olmadan hâlâ çalışanlar:

- ARIA anlık görüntüleri
- Sekme başına CDP WebSocket kullanılabilir olduğunda rol tarzı erişilebilirlik anlık görüntüleri (`--interactive`, `--compact`,
  `--depth`, `--efficient`). Bu, inceleme ve referans keşfi için
  bir yedektir; Playwright birincil eylem motoru olmaya devam eder.
- Sekme başına CDP
  WebSocket kullanılabilir olduğunda yönetilen `openclaw` tarayıcısı için sayfa ekran görüntüleri
- `existing-session` / Chrome MCP profilleri için sayfa ekran görüntüleri
- Anlık görüntü çıktısından `existing-session` referans tabanlı ekran görüntüleri (`--ref`)

Hâlâ Playwright gerektirenler:

- `navigate`
- `act`
- Playwright'ın yerel AI anlık görüntüsü biçimine bağlı AI anlık görüntüleri
- CSS seçici öğe ekran görüntüleri (`--element`)
- tam tarayıcı PDF dışa aktarma

Öğe ekran görüntüleri ayrıca `--full-page` değerini reddeder; rota `fullPage is
not supported for element screenshots` döndürür.

`Playwright is not available in this gateway build` görürseniz,
`playwright-core` yüklenecek şekilde paketlenmiş tarayıcı Plugin çalışma zamanı bağımlılıklarını onarın,
ardından gateway'i yeniden başlatın. Paketlenmiş kurulumlar için `openclaw doctor --fix` çalıştırın.
Docker için Chromium tarayıcı ikili dosyalarını da aşağıda gösterildiği gibi yükleyin.

#### Docker Playwright kurulumu

Gateway'iniz Docker içinde çalışıyorsa, `npx playwright` kullanmayın (npm override çakışmaları).
Bunun yerine paketlenmiş CLI'yi kullanın:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Tarayıcı indirmelerini kalıcı hale getirmek için `PLAYWRIGHT_BROWSERS_PATH` değerini ayarlayın (örneğin,
`/home/node/.cache/ms-playwright`) ve `/home/node` yolunun
`OPENCLAW_HOME_VOLUME` veya bir bind mount aracılığıyla kalıcı olduğundan emin olun. Bkz. [Docker](/tr/install/docker).

## Nasıl çalışır (dahili)

Küçük bir loopback denetim sunucusu HTTP isteklerini kabul eder ve CDP aracılığıyla Chromium tabanlı tarayıcılara bağlanır. Gelişmiş eylemler (tıklama/yazma/anlık görüntü/PDF), CDP üzerinde Playwright üzerinden ilerler; Playwright eksik olduğunda yalnızca Playwright dışı işlemler kullanılabilir. Ajan, yerel/uzak tarayıcılar ve profiller altta serbestçe değişirken tek bir kararlı arayüz görür.

## CLI hızlı başvuru

Tüm komutlar belirli bir profili hedeflemek için `--browser-profile <name>` seçeneğini, makine tarafından okunabilir çıktı için de `--json` seçeneğini kabul eder.

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

<Accordion title="Eylemler: gezin, tıkla, yaz, sürükle, bekle, değerlendir">

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

<Accordion title="Durum: çerezler, depolama, çevrimdışı, üst bilgiler, coğrafi konum, cihaz">

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

- `upload` ve `dialog` **hazırlama** çağrılarıdır; bunları, seçiciyi/iletişim kutusunu tetikleyen tıklama/tuş basımından önce çalıştırın.
- `click`/`type`/vb. `snapshot` kaynağından gelen bir `ref` gerektirir (sayısal `12`, rol başvurusu `e12` veya eyleme geçirilebilir ARIA başvurusu `ax12`). CSS seçicileri eylemler için bilerek desteklenmez. Görünür görüntü alanı konumu tek güvenilir hedef olduğunda `click-coords` kullanın.
- İndirme, izleme ve yükleme yolları OpenClaw geçici kökleriyle sınırlandırılır: `/tmp/openclaw{,/downloads,/uploads}` (geri dönüş: `${os.tmpdir()}/openclaw/...`).
- `upload`, `--input-ref` veya `--element` aracılığıyla dosya girdilerini doğrudan da ayarlayabilir.

OpenClaw, aynı URL ya da form gönderiminden sonra tek bir eski sekmenin tek bir yeni sekmeye dönüşmesi gibi değiştirme sekmesini kanıtlayabildiğinde, kararlı sekme kimlikleri ve etiketleri Chromium ham hedef değiştirmesinden sağ çıkar. Ham hedef kimlikleri hâlâ oynaktır; betiklerde `tabs` içindeki `suggestedTargetId` değerini tercih edin.

Anlık görüntü bayraklarına hızlı bakış:

- `--format ai` (Playwright ile varsayılan): Sayısal başvurulara sahip AI anlık görüntüsü (`aria-ref="<n>"`).
- `--format aria`: `axN` başvurularına sahip erişilebilirlik ağacı. Playwright kullanılabilir olduğunda OpenClaw, takip eylemlerinin bunları kullanabilmesi için başvuruları arka uç DOM kimlikleriyle canlı sayfaya bağlar; aksi halde çıktıyı yalnızca inceleme amaçlı kabul edin.
- `--efficient` (veya `--mode efficient`): Kompakt rol anlık görüntüsü ön ayarı. Bunu varsayılan yapmak için `browser.snapshotDefaults.mode: "efficient"` ayarlayın (bkz. [Gateway yapılandırması](/tr/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector`, `ref=e12` başvurularıyla bir rol anlık görüntüsünü zorlar. `--frame "<iframe>"`, rol anlık görüntülerini bir iframe ile sınırlar.
- `--labels`, üzerine başvuru etiketleri bindirilmiş yalnızca görüntü alanı ekran görüntüsü ekler (`MEDIA:<path>` yazdırır).
- `--urls`, keşfedilen bağlantı hedeflerini AI anlık görüntülerine ekler.

## Anlık görüntüler ve başvurular

OpenClaw iki “anlık görüntü” stilini destekler:

- **AI anlık görüntüsü (sayısal başvurular)**: `openclaw browser snapshot` (varsayılan; `--format ai`)
  - Çıktı: sayısal başvurular içeren bir metin anlık görüntüsü.
  - Eylemler: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Dahili olarak başvuru Playwright’ın `aria-ref` değeri üzerinden çözümlenir.

- **Rol anlık görüntüsü (`e12` gibi rol başvuruları)**: `openclaw browser snapshot --interactive` (veya `--compact`, `--depth`, `--selector`, `--frame`)
  - Çıktı: `[ref=e12]` (ve isteğe bağlı `[nth=1]`) içeren rol tabanlı bir liste/ağaç.
  - Eylemler: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Dahili olarak başvuru `getByRole(...)` (yinelenenler için ayrıca `nth()`) üzerinden çözümlenir.
  - Üzerine bindirilmiş `e12` etiketleriyle bir görüntü alanı ekran görüntüsü eklemek için `--labels` ekleyin.
  - Bağlantı metni belirsiz olduğunda ve ajanın somut gezinme hedeflerine ihtiyacı olduğunda `--urls` ekleyin.

- **ARIA anlık görüntüsü (`ax12` gibi ARIA başvuruları)**: `openclaw browser snapshot --format aria`
  - Çıktı: yapılandırılmış düğümler olarak erişilebilirlik ağacı.
  - Eylemler: Anlık görüntü yolu başvuruyu Playwright ve Chrome arka uç DOM kimlikleri üzerinden bağlayabildiğinde `openclaw browser click ax12` çalışır.
- Playwright kullanılamıyorsa ARIA anlık görüntüleri inceleme için yine de yararlı olabilir, ancak başvurular eyleme geçirilebilir olmayabilir. Eylem başvurularına ihtiyaç duyduğunuzda `--format ai` veya `--interactive` ile yeniden anlık görüntü alın.
- Ham CDP geri dönüş yolu için Docker kanıtı: `pnpm test:docker:browser-cdp-snapshot`, Chromium’u CDP ile başlatır, `browser doctor --deep` çalıştırır ve rol anlık görüntülerinin bağlantı URL’lerini, imleçle yükseltilmiş tıklanabilir öğeleri ve iframe meta verilerini içerdiğini doğrular.

Başvuru davranışı:

- Referanslar **gezinmeler arasında kararlı değildir**; bir şey başarısız olursa `snapshot` komutunu yeniden çalıştırın ve yeni bir ref kullanın.
- `/act`, değiştirilen sekmeyi kanıtlayabildiğinde eylemle tetiklenen değiştirmeden sonra mevcut ham `targetId` değerini döndürür.
  Takip komutları için kararlı sekme kimliklerini/etiketlerini kullanmaya devam edin.
- Rol snapshot'ı `--frame` ile alındıysa, rol ref'leri bir sonraki rol snapshot'ına kadar o iframe kapsamındadır.
- Bilinmeyen veya eski `axN` ref'leri, Playwright'ın `aria-ref` seçicisine düşmek yerine hızlıca başarısız olur.
  Bu olduğunda aynı sekmede yeni bir snapshot çalıştırın.

## Bekleme güçlendirmeleri

Yalnızca zaman/metin dışında daha fazlasını bekleyebilirsiniz:

- URL bekleme (Playwright tarafından glob'lar desteklenir):
  - `openclaw browser wait --url "**/dash"`
- Yükleme durumunu bekleme:
  - `openclaw browser wait --load networkidle`
- JS koşulunu bekleme:
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

Bir eylem başarısız olduğunda (ör. “görünür değil”, “strict mode ihlali”, “covered”):

1. `openclaw browser snapshot --interactive`
2. `click <ref>` / `type <ref>` kullanın (etkileşimli modda rol ref'lerini tercih edin)
3. Hala başarısız olursa: Playwright'ın neyi hedeflediğini görmek için `openclaw browser highlight <ref>`
4. Sayfa garip davranıyorsa:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Derin hata ayıklama için: bir trace kaydedin:
   - `openclaw browser trace start`
   - sorunu yeniden üretin
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

JSON'daki rol snapshot'ları, araçların payload boyutu ve yoğunluğu hakkında akıl yürütebilmesi için `refs` ile birlikte küçük bir `stats` bloğu (satırlar/karakterler/ref'ler/etkileşimli) içerir.

## Durum ve ortam ayar düğmeleri

Bunlar “site X gibi davransın” iş akışları için kullanışlıdır:

- Çerezler: `cookies`, `cookies set`, `cookies clear`
- Depolama: `storage local|session get|set|clear`
- Çevrimdışı: `set offline on|off`
- Başlıklar: `set headers --headers-json '{"X-Debug":"1"}'` (eski `set headers --json '{"X-Debug":"1"}'` desteklenmeye devam eder)
- HTTP basic auth: `set credentials user pass` (veya `--clear`)
- Coğrafi konum: `set geo <lat> <lon> --origin "https://example.com"` (veya `--clear`)
- Medya: `set media dark|light|no-preference|none`
- Saat dilimi / yerel ayar: `set timezone ...`, `set locale ...`
- Cihaz / viewport:
  - `set device "iPhone 14"` (Playwright cihaz ön ayarları)
  - `set viewport 1280 720`

## Güvenlik ve gizlilik

- openclaw tarayıcı profili oturum açılmış oturumlar içerebilir; hassas kabul edin.
- `browser act kind=evaluate` / `openclaw browser evaluate` ve `wait --fn`
  sayfa bağlamında rastgele JavaScript çalıştırır. İstem enjeksiyonu bunu yönlendirebilir.
  İhtiyacınız yoksa `browser.evaluateEnabled=false` ile devre dışı bırakın.
- Oturum açma ve bot karşıtı notlar (X/Twitter vb.) için bkz. [Tarayıcı oturumu + X/Twitter paylaşımı](/tr/tools/browser-login).
- Gateway/node ana makinesini özel tutun (loopback veya yalnızca tailnet).
- Uzak CDP uç noktaları güçlüdür; bunları tünelleyin ve koruyun.

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

- [Tarayıcı](/tr/tools/browser) — genel bakış, yapılandırma, profiller, güvenlik
- [Tarayıcı oturumu](/tr/tools/browser-login) — sitelerde oturum açma
- [Tarayıcı Linux sorun giderme](/tr/tools/browser-linux-troubleshooting)
- [Tarayıcı WSL2 sorun giderme](/tr/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
