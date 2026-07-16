---
read_when:
    - Yerel denetim API'si üzerinden agent tarayıcısında betik çalıştırma veya hata ayıklama
    - '`openclaw browser` CLI referansını mı arıyorsunuz?'
    - Anlık görüntüler ve referanslarla özel tarayıcı otomasyonu ekleme
summary: OpenClaw tarayıcı denetim API'si, CLI referansı ve betik oluşturma eylemleri
title: Tarayıcı denetimi API'si
x-i18n:
    generated_at: "2026-07-16T17:40:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8063f55c9881e45e65492dc40e2902bf05feb08ae9a74986ba2d7621e0dbe71a
    source_path: tools/browser-control.md
    workflow: 16
---

Kurulum, yapılandırma ve sorun giderme için [Tarayıcı](/tr/tools/browser) sayfasına bakın.
Bu sayfa, yerel denetim HTTP API'si, `openclaw browser`
CLI ve betik oluşturma kalıpları (anlık görüntüler, referanslar, beklemeler, hata ayıklama akışları) için başvuru kaynağıdır.

## Denetim API'si (isteğe bağlı)

Yalnızca yerel entegrasyonlar için Gateway, küçük bir geri döngü HTTP API'si sunar.
Bu bağımsız sunucu isteğe bağlıdır — gateway hizmeti ortamında
`OPENCLAW_EAGER_BROWSER_CONTROL_SERVER=1` ortam değişkenini ayarlayın
ve HTTP uç noktaları kullanılabilir hâle gelmeden önce gateway'i yeniden başlatın. Bu
değişken olmadan tarayıcı denetim çalışma zamanı CLI ve
ajan araçları üzerinden çalışmaya devam eder, ancak geri döngü denetim portunda hiçbir şey dinlemez.

- Durum/başlatma/durdurma: `GET /`, `GET /doctor`, `POST /start`, `POST /stop`, `POST /reset-profile`
- Profiller: `GET /profiles`, `POST /profiles/create`, `DELETE /profiles/:name`
- Sekmeler: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`, `POST /tabs/action`
- Anlık görüntü/ekran görüntüsü: `GET /snapshot`, `POST /screenshot`
- Eylemler: `POST /navigate`, `POST /act`
- Kancalar: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- İndirmeler: `POST /download`, `POST /wait/download`
- İzinler: `POST /permissions/grant`
- Hata ayıklama: `GET /console`, `POST /pdf`
- Hata ayıklama: `GET /errors`, `GET /requests`, `GET /dialogs`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Ağ: `POST /response/body`
- Durum: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- Durum: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Ayarlar: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

`POST /tabs/action`, CLI'ın dahili olarak `browser tab` alt komutları
(`{"action":"new"|"label"|"select"|"close"|"list", ...}`) için kullandığı toplu biçimdir;
doğrudan betik oluştururken yukarıdaki tek amaçlı sekme rotalarını tercih edin.

Tüm uç noktalar `?profile=<name>` kabul eder. `POST /start?headless=true`, kalıcı
tarayıcı yapılandırmasını değiştirmeden yerel yönetilen profiller için
tek seferlik başsız başlatma isteğinde bulunur; yalnızca bağlanma, uzak CDP ve mevcut oturum
profilleri bu geçersiz kılmayı reddeder çünkü OpenClaw bu tarayıcı işlemlerini başlatmaz.

Sekme uç noktalarında `targetId` uyumluluk alanının adıdır. `GET /tabs` veya
`POST /tabs/open` içindeki `suggestedTargetId` değerini geçirmeyi tercih edin; etiketler ve `t1`
gibi `tabId` tanıtıcıları da kabul edilir. Ham CDP hedef kimlikleri ve benzersiz ham
hedef kimliği önekleri çalışmaya devam eder, ancak bunlar geçici tanılama tanıtıcılarıdır.

Paylaşılan gizli anahtarlı gateway kimlik doğrulaması yapılandırılmışsa tarayıcı HTTP rotaları da kimlik doğrulaması gerektirir:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` veya bu parolayla HTTP Basic kimlik doğrulaması

Notlar:

- Bu bağımsız geri döngü tarayıcı API'si, güvenilir proxy veya
  Tailscale Serve kimlik başlıklarını **kullanmaz**.
- `gateway.auth.mode`, `none` veya `trusted-proxy` ise bu geri döngü tarayıcı
  rotaları kimlik taşıyan bu modları devralmaz; bunları yalnızca geri döngüde tutun.

### `/act` hata sözleşmesi

`POST /act`, rota düzeyindeki doğrulama ve
politika hataları için yapılandırılmış bir hata yanıtı kullanır:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Geçerli `code` değerleri:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` eksik veya tanınmıyor.
- `ACT_INVALID_REQUEST` (HTTP 400): eylem yükü normalleştirme veya doğrulamadan geçemedi.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` desteklenmeyen bir eylem türüyle kullanıldı.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (veya `wait --fn`) yapılandırma tarafından devre dışı bırakılmıştır.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): üst düzey veya toplu `targetId`, istek hedefiyle çakışıyor.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): eylem, mevcut oturum profilleri için desteklenmiyor.

Diğer çalışma zamanı hataları, `code` alanı olmadan da
`{ "error": "<message>" }` döndürebilir.

### Playwright gereksinimi

Bazı özellikler (gezinme/eylem/AI anlık görüntüsü/rol anlık görüntüsü, öğe ekran görüntüleri,
PDF) Playwright gerektirir. Playwright yüklü değilse bu uç noktalar
açık bir 501 hatası döndürür.

Playwright olmadan çalışmaya devam edenler:

- ARIA anlık görüntüleri
- Sekme başına CDP WebSocket kullanılabildiğinde rol tarzı erişilebilirlik anlık görüntüleri
  (`--interactive`, `--compact`, `--depth`, `--efficient`). Bu,
  inceleme ve referans keşfi için bir geri dönüş seçeneğidir; birincil eylem motoru
  Playwright olmaya devam eder.
- Sekme başına CDP WebSocket kullanılabildiğinde yönetilen `openclaw`
  tarayıcısı için sayfa ekran görüntüleri
- `existing-session` / Chrome MCP profilleri için sayfa ekran görüntüleri
- Anlık görüntü çıktısından `existing-session` referans tabanlı ekran görüntüleri (`--ref`)

Playwright gerektirmeye devam edenler:

- `navigate`
- `act`
- Playwright'ın yerel AI anlık görüntü biçimine bağlı AI anlık görüntüleri
- CSS seçicili öğe ekran görüntüleri (`--element`)
- tam tarayıcı PDF dışa aktarımı

Öğe ekran görüntüleri ayrıca `--full-page` değerini reddeder; rota `fullPage is
not supported for element screenshots` döndürür.

`Playwright is not available in this gateway build` görürseniz paketlenmiş
Gateway'de temel tarayıcı çalışma zamanı bağımlılığı eksiktir. OpenClaw'ı yeniden yükleyin veya güncelleyin,
ardından gateway'i yeniden başlatın. Docker için ayrıca aşağıda gösterildiği gibi Chromium
tarayıcı ikili dosyalarını yükleyin.

#### Docker Playwright kurulumu

Gateway'iniz Docker'da çalışıyorsa `npx playwright` kullanmaktan kaçının (npm geçersiz kılma çakışmaları).
Özel imajlarda Chromium'u imajın içine dahil edin:

```bash
OPENCLAW_INSTALL_BROWSER=1 ./scripts/docker/setup.sh
```

Mevcut bir imaj için bunun yerine paketle gelen CLI üzerinden yükleyin:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Tarayıcı indirmelerini kalıcı hâle getirmek için `PLAYWRIGHT_BROWSERS_PATH` değerini (örneğin,
`/home/node/.cache/ms-playwright`) ayarlayın ve `/home/node` öğesinin
`OPENCLAW_HOME_VOLUME` veya bir bağlama noktası aracılığıyla kalıcılaştırıldığından emin olun. OpenClaw, Linux'ta
kalıcılaştırılmış Chromium'u otomatik olarak algılar. [Docker](/tr/install/docker) sayfasına bakın.

## Nasıl çalışır (dahili)

Küçük bir geri döngü denetim sunucusu HTTP isteklerini kabul eder ve CDP üzerinden Chromium tabanlı tarayıcılara bağlanır. Gelişmiş eylemler (tıklama/yazma/anlık görüntü/PDF), CDP üzerinde Playwright aracılığıyla gerçekleştirilir; Playwright eksik olduğunda yalnızca Playwright gerektirmeyen işlemler kullanılabilir. Yerel/uzak tarayıcılar ve profiller altta serbestçe değişirken ajan tek bir kararlı arayüz görür.

## CLI hızlı başvuru

Tüm komutlar belirli bir profili hedeflemek için `--browser-profile <name>`, makine tarafından okunabilir çıktı için ise `--json` kabul eder.

<AccordionGroup>

<Accordion title="Temel işlemler: durum, sekmeler, açma/odaklama/kapatma">

```bash
openclaw browser status
openclaw browser doctor
openclaw browser doctor --deep    # canlı anlık görüntü yoklaması ekle
openclaw browser start
openclaw browser start --headless # tek seferlik yerel yönetilen başsız başlatma
openclaw browser stop            # ayrıca yalnızca bağlanma/uzak CDP üzerinde öykünmeyi temizler
openclaw browser reset-profile   # profilin tarayıcı verilerini Çöp Kutusu'na taşır
openclaw browser tabs
openclaw browser tab             # geçerli sekmenin kısayolu
openclaw browser tab new
openclaw browser tab new --label research
openclaw browser tab label abcd1234 research
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://example.com
openclaw browser focus abcd1234
openclaw browser close abcd1234
```

</Accordion>

<Accordion title="Profiller: listeleme, oluşturma, silme">

```bash
openclaw browser profiles
openclaw browser create-profile --name research --color "#0066CC"
openclaw browser create-profile --name attach --driver existing-session --cdp-url http://127.0.0.1:9222
openclaw browser delete-profile --name research
```

</Accordion>

<Accordion title="İnceleme: ekran görüntüsü, anlık görüntü, konsol, hatalar, istekler">

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref 12        # veya rol referansları için --ref e12
openclaw browser screenshot --labels
openclaw browser snapshot
openclaw browser snapshot --format aria --limit 200
openclaw browser snapshot --interactive --compact --depth 6
openclaw browser snapshot --efficient
openclaw browser snapshot --labels
openclaw browser snapshot --urls
openclaw browser snapshot --selector "#main" --interactive
openclaw browser snapshot --frame "iframe#main" --interactive
openclaw browser snapshot --out snapshot.txt
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
openclaw browser click 12 --double           # veya rol referansları için e12
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
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref e12
openclaw browser upload media://inbound/file.pdf
openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'
openclaw browser dialog --accept
openclaw browser dialog --dismiss --dialog-id d1
openclaw browser wait --text "Done"
openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"
openclaw browser evaluate --fn '(el) => el.textContent' --ref 7
openclaw browser evaluate --fn 'const title = document.title; return title;'
openclaw browser evaluate --timeout-ms 30000 --fn 'async () => { await window.ready; return true; }'
openclaw browser highlight e12
openclaw browser trace start
openclaw browser trace stop
```

</Accordion>

<Accordion title="Durum: çerezler, depolama, çevrimdışı mod, başlıklar, coğrafi konum, cihaz">

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

- Aracıya yönelik `browser` aracı, `action=download` (zorunlu `ref` ve
  `path`) ile `action=waitfordownload` (isteğe bağlı `path`) özelliklerini sunar. Her ikisi de kaydedilen
  indirme URL'sini, önerilen dosya adını ve korumalı yerel yolu döndürür. Yönetilen Playwright profilleri için açık indirme
  yakalama kullanılabilir; mevcut oturum profilleri desteklenmeyen işlem hatası
  döndürür.
- Atomik seçici yüklemelerini tercih edin: OpenClaw'ın tek bir istekte hazırlanıp tıklaması için yüklemeyle birlikte `--ref` tetikleyicisini iletin. Daha sonraki bir tetikleyici bilinçli olarak kullanılacaksa yalnızca yolları içeren `upload` desteklenmeye devam eder. Bir dosya girişini doğrudan ayarlamak için `--input-ref` veya `--element` kullanın. `dialog` bir hazırlama çağrısıdır; iletişim kutusunu tetikleyen tıklama/tuş basma işleminden önce çalıştırın. Bir eylem modal pencere açarsa eylem yanıtı `blockedByDialog` ve `browserState.dialogs.pending` içerir; doğrudan yanıt vermek için bu `dialogId` değerini iletin. OpenClaw dışında işlenen iletişim kutuları `browserState.dialogs.recent` altında görünür.
- `click`/`type`/vb. için `snapshot` kaynağından bir `ref` gerekir (sayısal `12`, rol referansı `e12` veya eyleme geçirilebilir ARIA referansı `ax12`). Eylemler için CSS seçicileri bilinçli olarak desteklenmez. Görünür görüntü alanındaki konum tek güvenilir hedef olduğunda `click-coords` kullanın.
- İndirme ve iz yolları OpenClaw geçici kökleriyle sınırlandırılmıştır: `/tmp/openclaw{,/downloads}` (geri dönüş: `${os.tmpdir()}/openclaw/...`).
- `upload`, OpenClaw geçici yüklemeler kökünden ve
  OpenClaw tarafından yönetilen gelen medyadan dosya kabul eder. Yönetilen gelen medyaya
  `media://inbound/<id>`, korumalı alana göreli `media/inbound/<id>` veya yönetilen
  gelen medya dizini içindeki çözümlenmiş bir yol olarak başvurulabilir. İç içe medya referansları,
  dizin geçişi, sembolik bağlantılar, sabit bağlantılar ve rastgele yerel yollar yine reddedilir.
- `upload`, dosya girişlerini `--input-ref` veya `--element` aracılığıyla doğrudan da ayarlayabilir.

OpenClaw, aynı URL için benzersiz bir eski/yeni çifti veya form gönderiminden
sonra tek bir eski sekmenin tek bir yeni sekmeye dönüşmesi gibi durumlarda
değiştirilen sekmeyi doğrulayabildiğinde, kararlı sekme kimlikleri ve etiketleri
Chromium ham hedef değişiminden etkilenmez. Aynı URL'yi içeren belirsiz
değişimler yeni tanıtıcılar alır. Ham hedef kimlikleri yine
geçicidir; betiklerde `tabs` kaynağından `suggestedTargetId` değerini tercih edin.

Anlık görüntü bayraklarına genel bakış:

- `--format ai` (Playwright ile varsayılan): sayısal referanslara sahip yapay zekâ anlık görüntüsü (`aria-ref="<n>"`).
- `--format aria`: `axN` referanslarına sahip erişilebilirlik ağacı. Playwright kullanılabildiğinde OpenClaw, sonraki eylemlerde kullanılabilmeleri için referansları arka uç DOM kimlikleriyle canlı sayfaya bağlar; aksi takdirde çıktıyı yalnızca inceleme amaçlı kabul edin.
- `--efficient` (veya `--mode efficient`): kompakt rol anlık görüntüsü önayarı. Bunu varsayılan yapmak için `browser.snapshotDefaults.mode: "efficient"` değerini ayarlayın (bkz. [Gateway yapılandırması](/tr/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector`, `ref=e12` referanslarına sahip bir rol anlık görüntüsünü zorunlu kılar. `--frame "<iframe>"`, rol anlık görüntülerinin kapsamını bir iframe ile sınırlar.
- Playwright ile `--labels`, üzerine referans etiketleri yerleştirilmiş bir ekran görüntüsünün
  (çıktıda `MEDIA:<path>` gösterilir) yanı sıra her referansın sınırlayıcı kutusunu içeren bir
  `annotations` dizisi ekler. `screenshot` üzerinde Playwright destekli etiketler `--full-page`,
  `--ref` ve `--element` ile çalışır; `snapshot` üzerinde eşlik eden ekran görüntüsü
  yalnızca görüntü alanını kapsamaya devam eder. Mevcut oturum/chrome-mcp profilleri sayfa ekran
  görüntülerinde katman etiketlerini oluşturur ancak `annotations` döndürmez veya Playwright'ın
  tam sayfa/referans/öğe yansıtma yardımcısını kullanmaz. Playwright veya chrome-mcp olmadan
  etiketli ekran görüntüleri kullanılamaz.
- `--urls`, keşfedilen bağlantı hedeflerini yapay zekâ anlık görüntülerine ekler.

## Anlık görüntüler ve referanslar

OpenClaw iki "anlık görüntü" biçimini destekler:

- **Yapay zekâ anlık görüntüsü (sayısal referanslar)**: `openclaw browser snapshot` (varsayılan; `--format ai`)
  - Çıktı: sayısal referanslar içeren bir metin anlık görüntüsü.
  - Eylemler: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Dahili olarak referans, Playwright'ın `aria-ref` özelliği aracılığıyla çözümlenir.

- **Rol anlık görüntüsü (`e12` gibi rol referansları)**: `openclaw browser snapshot --interactive` (veya `--compact`, `--depth`, `--selector`, `--frame`)
  - Çıktı: `[ref=e12]` (ve isteğe bağlı `[nth=1]`) içeren rol tabanlı bir liste/ağaç.
  - Eylemler: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Dahili olarak referans, `getByRole(...)` (yinelenenler için ayrıca `nth()`) aracılığıyla çözümlenir.
  - Üzerine `e12` etiketleri yerleştirilmiş bir ekran görüntüsü eklemek için `--labels` ekleyin. Playwright
    destekli profillerde bu işlem, referans başına sınırlayıcı kutu meta verilerini de
    (`annotations[]`) döndürür.
  - Bağlantı metni belirsiz olduğunda ve aracının somut gezinme hedeflerine
    ihtiyacı olduğunda `--urls` ekleyin.

- **ARIA anlık görüntüsü (`ax12` gibi ARIA referansları)**: `openclaw browser snapshot --format aria`
  - Çıktı: yapılandırılmış düğümler olarak erişilebilirlik ağacı.
  - Eylemler: anlık görüntü yolu, referansı Playwright ve Chrome arka uç DOM
    kimlikleri aracılığıyla bağlayabildiğinde `openclaw browser click ax12` çalışır.
- Playwright kullanılamıyorsa ARIA anlık görüntüleri yine inceleme için
  yararlı olabilir ancak referanslar eyleme geçirilemeyebilir. Eylem referanslarına ihtiyaç duyduğunuzda
  `--format ai` veya `--interactive` ile yeniden anlık görüntü alın.
- Ham CDP geri dönüş yolu için Docker doğrulaması: `pnpm test:docker:browser-cdp-snapshot`,
  Chromium'u CDP ile başlatır, `browser doctor --deep` komutunu çalıştırır ve rol
  anlık görüntülerinin bağlantı URL'lerini, imleç aracılığıyla tıklanabilir olarak yükseltilen öğeleri ve iframe meta verilerini içerdiğini doğrular.

Referans davranışı:

- Referanslar **gezinmeler arasında kararlı değildir**; bir işlem başarısız olursa `snapshot` komutunu yeniden çalıştırın ve yeni bir referans kullanın.
- `/act`, değiştirilen sekmeyi doğrulayabildiğinde eylemle tetiklenen değişimden
  sonra geçerli ham `targetId` değerini döndürür. Sonraki komutlar için
  kararlı sekme kimliklerini/etiketlerini kullanmaya devam edin.
- Rol anlık görüntüsü `--frame` ile alındıysa rol referanslarının kapsamı bir sonraki rol anlık görüntüsüne kadar bu iframe ile sınırlıdır.
- Bilinmeyen veya eski `axN` referansları, Playwright'ın `aria-ref` seçicisine
  geçmek yerine hızla başarısız olur. Bu durumda aynı sekmede yeni bir anlık görüntü
  alın.

## Gelişmiş bekleme seçenekleri

Yalnızca süreyi/metni değil, daha fazlasını bekleyebilirsiniz:

- URL'yi bekleyin (Playwright glob kalıplarını destekler):
  - `openclaw browser wait --url "**/dash"`
- Yükleme durumunu bekleyin:
  - `openclaw browser wait --load networkidle`
  - Yönetilen `openclaw` ve ham/uzak CDP profillerinde desteklenir. `existing-session` sürücüsünü kullanan profiller (varsayılan `user` profili dahil) `networkidle` değerini reddeder; bu profillerde `--url`, `--text`, bir seçici veya `--fn` beklemelerini kullanın.
- Bir JS koşulunu bekleyin:
  - `openclaw browser wait --fn "window.ready===true"`
- Bir seçicinin görünür olmasını bekleyin:
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

Bir eylem başarısız olduğunda (ör. "görünür değil", "katı mod ihlali", "üzeri kapalı"):

1. `openclaw browser snapshot --interactive`
2. `click <ref>` / `type <ref>` kullanın (etkileşimli modda rol referanslarını tercih edin)
3. Yine başarısız olursa Playwright'ın neyi hedeflediğini görmek için `openclaw browser highlight <ref>` kullanın
4. Sayfa olağandışı davranıyorsa:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Ayrıntılı hata ayıklama için bir iz kaydedin:
   - `openclaw browser trace start`
   - sorunu yeniden oluşturun
   - `openclaw browser trace stop` (çıktıda `TRACE:<path>` gösterilir)

## JSON çıktısı

`--json`, betik oluşturma ve yapılandırılmış araçlar içindir.

Örnekler:

```bash
openclaw browser --json status
openclaw browser --json snapshot --interactive
openclaw browser --json requests --filter api
openclaw browser --json cookies
```

JSON biçimindeki rol anlık görüntüleri, `refs` ile birlikte küçük bir `stats` bloğu (satırlar/karakterler/referanslar/etkileşimli) içerir; böylece araçlar yük boyutu ve yoğunluğu hakkında çıkarım yapabilir.

## Durum ve ortam ayarları

Bunlar "sitenin X gibi davranmasını sağlama" iş akışları için kullanışlıdır:

- Çerezler: `cookies`, `cookies set`, `cookies clear`
- Depolama: `storage local|session get|set|clear`
- Çevrimdışı: `set offline on|off`
- Üstbilgiler: `set headers --headers-json '{"X-Debug":"1"}'` (veya konumsal biçim `set headers '{"X-Debug":"1"}'`)
- HTTP temel kimlik doğrulaması: `set credentials user pass` (veya `--clear`)
- Coğrafi konum: `set geo <lat> <lon> --origin "https://example.com"` (veya `--clear`)
- Medya: `set media dark|light|no-preference|none`
- Saat dilimi / yerel ayar: `set timezone ...`, `set locale ...`
- Cihaz / görüntü alanı:
  - `set device "iPhone 14"` (Playwright cihaz önayarları)
  - `set viewport 1280 720`

## Güvenlik ve gizlilik

- openclaw tarayıcı profili oturum açılmış oturumlar içerebilir; bunu hassas veri olarak değerlendirin.
- `browser act kind=evaluate` / `openclaw browser evaluate` ve `wait --fn`,
  sayfa bağlamında rastgele JavaScript çalıştırır. İstem enjeksiyonu bunu
  yönlendirebilir. İhtiyacınız yoksa `browser.evaluateEnabled=false` ile devre dışı bırakın.
- `openclaw browser evaluate --fn` bir işlev kaynağını, ifadeyi veya
  deyim gövdesini kabul eder. Deyim gövdeleri eşzamansız işlevler olarak sarmalanır; bu nedenle
  geri almak istediğiniz değer için `return` kullanın. Sayfa tarafındaki işlevin
  varsayılan değerlendirme zaman aşımından daha uzun sürmesi gerekebilecek durumlarda `--timeout-ms <ms>` kullanın.
- Oturum açma ve bot karşıtı önlemlere ilişkin notlar (X/Twitter vb.) için [Tarayıcıda oturum açma + X/Twitter'da gönderi yayımlama](/tr/tools/browser-login) bölümüne bakın.
- Gateway/Node ana makinesini gizli tutun (yalnızca geri döngü veya tailnet).
- Uzak CDP uç noktaları güçlüdür; tünel kullanın ve bunları koruyun.

Katı mod örneği (özel/dahili hedefleri varsayılan olarak engelleyin):

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

- [Tarayıcı](/tr/tools/browser) - genel bakış, yapılandırma, profiller, güvenlik
- [Tarayıcıda oturum açma](/tr/tools/browser-login) - sitelerde oturum açma
- [Tarayıcı Linux sorunlarını giderme](/tr/tools/browser-linux-troubleshooting)
- [Tarayıcı WSL2 sorunlarını giderme](/tr/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
