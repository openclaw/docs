---
read_when:
    - Yerel denetim API’si aracılığıyla aracı tarayıcısını betiklerle çalıştırma veya hata ayıklama
    - '`openclaw browser` CLI başvurusunu arıyorsunuz'
    - Özel tarayıcı otomasyonunu anlık görüntüler ve ref'lerle ekleme
summary: OpenClaw tarayıcı kontrol API’si, CLI referansı ve betik oluşturma eylemleri
title: Tarayıcı kontrol API'si
x-i18n:
    generated_at: "2026-06-28T01:20:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ccfd1ec996b0fc211e2aefa0554e0fa5c7b0899ca981836134a3741b38bf7600
    source_path: tools/browser-control.md
    workflow: 16
---

Kurulum, yapılandırma ve sorun giderme için bkz. [Tarayıcı](/tr/tools/browser).
Bu sayfa yerel denetim HTTP API'si, `openclaw browser` CLI'si ve betik yazma desenleri (anlık görüntüler, ref'ler, beklemeler, hata ayıklama akışları) için başvuru kaynağıdır.

## Denetim API'si (isteğe bağlı)

Yalnızca yerel entegrasyonlar için Gateway küçük bir loopback HTTP API'si sunar.
Bu bağımsız sunucu isteğe bağlıdır; HTTP uç noktaları kullanılabilir hale gelmeden önce gateway hizmet ortamında `OPENCLAW_EAGER_BROWSER_CONTROL_SERVER=1` ortam değişkenini ayarlayın ve gateway'i yeniden başlatın. Bu değişken olmadan tarayıcı denetim çalışma zamanı CLI ve ajan araçları üzerinden çalışmaya devam eder, ancak loopback denetim bağlantı noktasında hiçbir şey dinlemez.

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

Tüm uç noktalar `?profile=<name>` kabul eder. `POST /start?headless=true`, kalıcı tarayıcı yapılandırmasını değiştirmeden yerel yönetilen profiller için tek seferlik headless başlatma ister; OpenClaw bu tarayıcı işlemlerini başlatmadığı için yalnızca bağlanma, uzak CDP ve mevcut oturum profilleri bu geçersiz kılmayı reddeder.

Sekme uç noktaları için `targetId` uyumluluk alan adıdır. `GET /tabs` veya `POST /tabs/open` üzerinden gelen `suggestedTargetId` değerini geçirmeyi tercih edin; etiketler ve `t1` gibi `tabId` tutamaçları da kabul edilir. Ham CDP hedef kimlikleri ve benzersiz ham hedef kimliği önekleri hâlâ çalışır, ancak bunlar geçici tanılama tutamaçlarıdır.

Paylaşılan gizli anahtarlı gateway kimlik doğrulaması yapılandırılmışsa, tarayıcı HTTP rotaları da kimlik doğrulaması gerektirir:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` veya bu parolayla HTTP Basic kimlik doğrulaması

Notlar:

- Bu bağımsız loopback tarayıcı API'si güvenilen proxy veya Tailscale Serve kimlik başlıklarını **tüketmez**.
- `gateway.auth.mode` değeri `none` veya `trusted-proxy` ise, bu loopback tarayıcı rotaları kimlik taşıyan bu modları devralmaz; bunları yalnızca loopback olarak tutun.

### `/act` hata sözleşmesi

`POST /act`, rota düzeyinde doğrulama ve ilke hataları için yapılandırılmış bir hata yanıtı kullanır:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Geçerli `code` değerleri:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` eksik veya tanınmıyor.
- `ACT_INVALID_REQUEST` (HTTP 400): eylem yükü normalleştirme veya doğrulamadan geçemedi.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector`, desteklenmeyen bir eylem türüyle kullanıldı.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (veya `wait --fn`) yapılandırma tarafından devre dışı bırakıldı.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): üst düzey veya toplu `targetId`, istek hedefiyle çakışıyor.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): eylem mevcut oturum profilleri için desteklenmiyor.

Diğer çalışma zamanı hataları, `code` alanı olmadan hâlâ `{ "error": "<message>" }` döndürebilir.

### Playwright gereksinimi

Bazı özellikler (navigate/act/AI anlık görüntüsü/rol anlık görüntüsü, öğe ekran görüntüleri, PDF) Playwright gerektirir. Playwright yüklü değilse, bu uç noktalar açık bir 501 hatası döndürür.

Playwright olmadan hâlâ çalışanlar:

- ARIA anlık görüntüleri
- Sekme başına CDP WebSocket kullanılabilir olduğunda rol tarzı erişilebilirlik anlık görüntüleri (`--interactive`, `--compact`, `--depth`, `--efficient`). Bu, inceleme ve ref keşfi için bir geri dönüş yoludur; Playwright birincil eylem motoru olmaya devam eder.
- Sekme başına CDP WebSocket kullanılabilir olduğunda yönetilen `openclaw` tarayıcısı için sayfa ekran görüntüleri
- `existing-session` / Chrome MCP profilleri için sayfa ekran görüntüleri
- Anlık görüntü çıktısından `existing-session` ref tabanlı ekran görüntüleri (`--ref`)

Hâlâ Playwright gerektirenler:

- `navigate`
- `act`
- Playwright'ın yerel AI anlık görüntü biçimine bağlı AI anlık görüntüleri
- CSS seçici öğe ekran görüntüleri (`--element`)
- tam tarayıcı PDF dışa aktarımı

Öğe ekran görüntüleri `--full-page` seçeneğini de reddeder; rota `fullPage is
not supported for element screenshots` döndürür.

`Playwright is not available in this gateway build` görürseniz, paketlenmiş Gateway çekirdek tarayıcı çalışma zamanı bağımlılığından yoksundur. OpenClaw'ı yeniden yükleyin veya güncelleyin, ardından gateway'i yeniden başlatın. Docker için Chromium tarayıcı ikili dosyalarını da aşağıda gösterildiği gibi yükleyin.

#### Docker Playwright kurulumu

Gateway'iniz Docker içinde çalışıyorsa `npx playwright` kullanmaktan kaçının (npm geçersiz kılma çakışmaları). Özel imajlar için Chromium'u imajın içine dahil edin:

```bash
OPENCLAW_INSTALL_BROWSER=1 ./scripts/docker/setup.sh
```

Mevcut bir imaj için bunun yerine paketlenmiş CLI üzerinden yükleyin:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Tarayıcı indirmelerini kalıcı hale getirmek için `PLAYWRIGHT_BROWSERS_PATH` ayarlayın (örneğin `/home/node/.cache/ms-playwright`) ve `/home/node` yolunun `OPENCLAW_HOME_VOLUME` veya bir bind mount üzerinden kalıcı olduğundan emin olun. OpenClaw, Linux üzerinde kalıcı Chromium'u otomatik algılar. Bkz. [Docker](/tr/install/docker).

## Nasıl çalışır (dahili)

Küçük bir loopback denetim sunucusu HTTP isteklerini kabul eder ve CDP üzerinden Chromium tabanlı tarayıcılara bağlanır. Gelişmiş eylemler (click/type/snapshot/PDF), CDP üzerinde Playwright üzerinden geçer; Playwright eksik olduğunda yalnızca Playwright dışı işlemler kullanılabilir. Ajan, yerel/uzak tarayıcılar ve profiller altta serbestçe değişirken tek bir kararlı arayüz görür.

## CLI hızlı başvuru

Tüm komutlar belirli bir profili hedeflemek için `--browser-profile <name>`, makine tarafından okunabilir çıktı için `--json` kabul eder.

<AccordionGroup>

<Accordion title="Basics: status, tabs, open/focus/close">

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

<Accordion title="Inspection: screenshot, snapshot, console, errors, requests">

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

<Accordion title="Actions: navigate, click, type, drag, wait, evaluate">

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

<Accordion title="State: cookies, storage, offline, headers, geo, device">

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

- `upload` ve `dialog` **hazırlama** çağrılarıdır; bunları seçiciyi/iletişim kutusunu tetikleyen click/press işleminden önce çalıştırın. Bir eylem modal açarsa, eylem yanıtı `blockedByDialog` ve `browserState.dialogs.pending` içerir; doğrudan yanıt vermek için bu `dialogId` değerini geçirin. OpenClaw dışında işlenen iletişim kutuları `browserState.dialogs.recent` altında görünür.
- `click`/`type`/vb. `snapshot` çıktısından bir `ref` gerektirir (sayısal `12`, rol ref'i `e12` veya eyleme geçirilebilir ARIA ref'i `ax12`). CSS seçiciler eylemler için özellikle desteklenmez. Görünür viewport konumu tek güvenilir hedef olduğunda `click-coords` kullanın.
- İndirme ve trace yolları OpenClaw geçici kökleriyle sınırlandırılmıştır: `/tmp/openclaw{,/downloads}` (geri dönüş: `${os.tmpdir()}/openclaw/...`).
- `upload`, OpenClaw geçici yükleme kökünden ve OpenClaw tarafından yönetilen gelen medyadan dosya kabul eder. Yönetilen gelen medya `media://inbound/<id>`, sandbox'a göreli `media/inbound/<id>` veya yönetilen gelen medya dizini içindeki çözümlenmiş bir yol olarak başvurulabilir. İç içe medya ref'leri, dizin dışına çıkma, sembolik bağlantılar, hardlink'ler ve rastgele yerel yollar hâlâ reddedilir.
- `upload`, dosya girdilerini `--input-ref` veya `--element` üzerinden doğrudan da ayarlayabilir.

OpenClaw yedek sekmeyi kanıtlayabildiğinde, örneğin aynı URL veya form gönderiminden sonra tek bir eski sekmenin tek bir yeni sekmeye dönüşmesi gibi durumlarda, kararlı sekme kimlikleri ve etiketleri Chromium ham hedef değişiminden sağ çıkar. Ham hedef kimlikleri hâlâ geçicidir; betiklerde `tabs` çıktısından `suggestedTargetId` kullanmayı tercih edin.

Anlık görüntü bayraklarına hızlı bakış:

- `--format ai` (Playwright ile varsayılan): sayısal referanslara sahip YZ anlık görüntüsü (`aria-ref="<n>"`).
- `--format aria`: `axN` referanslarına sahip erişilebilirlik ağacı. Playwright kullanılabilir olduğunda OpenClaw, takip eylemlerinin bunları kullanabilmesi için canlı sayfaya backend DOM kimlikleriyle referanslar bağlar; aksi halde çıktıyı yalnızca inceleme amaçlı kabul edin.
- `--efficient` (veya `--mode efficient`): kompakt rol anlık görüntüsü ön ayarı. Bunu varsayılan yapmak için `browser.snapshotDefaults.mode: "efficient"` ayarını yapın (bkz. [Gateway yapılandırması](/tr/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector`, `ref=e12` referanslarıyla bir rol anlık görüntüsünü zorlar. `--frame "<iframe>"`, rol anlık görüntülerini bir iframe ile sınırlar.
- Playwright ile `--labels`, üst üste bindirilmiş referans etiketleri olan bir ekran görüntüsü
  (`MEDIA:<path>` yazdırır) ve her referansın sınırlayıcı kutusunu içeren bir
  `annotations` dizisi ekler. `screenshot` üzerinde Playwright destekli etiketler
  `--full-page`, `--ref` ve `--element` ile çalışır; `snapshot` üzerinde eşlik eden
  ekran görüntüsü yalnızca viewport ile sınırlı kalır. Existing-session/chrome-mcp
  profilleri, sayfa ekran görüntülerinde üst üste bindirilmiş etiketleri işler
  ancak `annotations` döndürmez veya Playwright tam sayfa/referans/öğe projeksiyon
  yardımcısını kullanmaz. Playwright veya chrome-mcp olmadan etiketli ekran
  görüntüleri kullanılamaz.
- `--urls`, keşfedilen bağlantı hedeflerini YZ anlık görüntülerine ekler.

## Anlık görüntüler ve referanslar

OpenClaw iki "anlık görüntü" stilini destekler:

- **YZ anlık görüntüsü (sayısal referanslar)**: `openclaw browser snapshot` (varsayılan; `--format ai`)
  - Çıktı: sayısal referanslar içeren bir metin anlık görüntüsü.
  - Eylemler: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Dahili olarak referans, Playwright'ın `aria-ref` değeri üzerinden çözümlenir.

- **Rol anlık görüntüsü (`e12` gibi rol referansları)**: `openclaw browser snapshot --interactive` (veya `--compact`, `--depth`, `--selector`, `--frame`)
  - Çıktı: `[ref=e12]` (ve isteğe bağlı `[nth=1]`) içeren rol tabanlı bir liste/ağaç.
  - Eylemler: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Dahili olarak referans, `getByRole(...)` üzerinden çözümlenir (yinelenenler için ek olarak `nth()`).
  - Üst üste bindirilmiş `e12` etiketleri olan bir ekran görüntüsü eklemek için
    `--labels` ekleyin. Playwright destekli profillerde bu, referans başına
    sınırlayıcı kutu meta verilerini de döndürür (`annotations[]`).
  - Bağlantı metni belirsiz olduğunda ve ajanın somut gezinme hedeflerine
    ihtiyacı olduğunda `--urls` ekleyin.

- **ARIA anlık görüntüsü (`ax12` gibi ARIA referansları)**: `openclaw browser snapshot --format aria`
  - Çıktı: yapılandırılmış düğümler olarak erişilebilirlik ağacı.
  - Eylemler: Anlık görüntü yolu referansı Playwright ve Chrome backend DOM
    kimlikleri üzerinden bağlayabildiğinde `openclaw browser click ax12` çalışır.
- Playwright kullanılamıyorsa ARIA anlık görüntüleri inceleme için yine de yararlı
  olabilir, ancak referanslar eyleme geçirilebilir olmayabilir. Eylem referanslarına
  ihtiyacınız olduğunda `--format ai` veya `--interactive` ile yeniden anlık
  görüntü alın.
- Ham-CDP yedek yolu için Docker kanıtı: `pnpm test:docker:browser-cdp-snapshot`,
  Chromium'u CDP ile başlatır, `browser doctor --deep` çalıştırır ve rol
  anlık görüntülerinin bağlantı URL'lerini, imleçle yükseltilmiş tıklanabilirleri
  ve iframe meta verilerini içerdiğini doğrular.

Referans davranışı:

- Referanslar **gezinmeler arasında kararlı değildir**; bir şey başarısız olursa `snapshot` komutunu yeniden çalıştırın ve yeni bir referans kullanın.
- `/act`, değiştirme eylem tarafından tetiklendikten sonra yerine geçen sekmeyi
  kanıtlayabildiğinde geçerli ham `targetId` değerini döndürür. Takip komutları
  için kararlı sekme kimliklerini/etiketlerini kullanmaya devam edin.
- Rol anlık görüntüsü `--frame` ile alındıysa rol referansları bir sonraki rol anlık görüntüsüne kadar o iframe ile sınırlıdır.
- Bilinmeyen veya bayat `axN` referansları, Playwright'ın `aria-ref` seçicisine
  düşmek yerine hızlıca başarısız olur. Bu olduğunda aynı sekmede yeni bir anlık
  görüntü çalıştırın.

## Bekleme ek yetenekleri

Yalnızca zaman/metin dışında daha fazlasını bekleyebilirsiniz:

- URL bekleme (Playwright tarafından glob desteklenir):
  - `openclaw browser wait --url "**/dash"`
- Yükleme durumunu bekleme:
  - `openclaw browser wait --load networkidle`
  - Yönetilen `openclaw` ve ham/uzak CDP profillerinde desteklenir. `user` ve `existing-session` profilleri `networkidle` değerini reddeder; orada `--url`, `--text`, bir seçici veya `--fn` beklemelerini kullanın.
- JS koşulu bekleme:
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

Bir eylem başarısız olduğunda (örn. "not visible", "strict mode violation", "covered"):

1. `openclaw browser snapshot --interactive`
2. `click <ref>` / `type <ref>` kullanın (etkileşimli modda rol referanslarını tercih edin)
3. Hâlâ başarısız olursa: Playwright'ın neyi hedeflediğini görmek için `openclaw browser highlight <ref>`
4. Sayfa tuhaf davranıyorsa:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Derin hata ayıklama için bir iz kaydedin:
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

JSON içindeki rol anlık görüntüleri, araçların yük boyutu ve yoğunluğu hakkında akıl yürütebilmesi için `refs` ve küçük bir `stats` bloğu (satırlar/karakterler/referanslar/etkileşimli) içerir.

## Durum ve ortam ayarları

Bunlar "sitenin X gibi davranmasını sağlama" iş akışları için yararlıdır:

- Çerezler: `cookies`, `cookies set`, `cookies clear`
- Depolama: `storage local|session get|set|clear`
- Çevrimdışı: `set offline on|off`
- Üst bilgiler: `set headers --headers-json '{"X-Debug":"1"}'` (eski `set headers --json '{"X-Debug":"1"}'` desteklenmeye devam eder)
- HTTP temel kimlik doğrulaması: `set credentials user pass` (veya `--clear`)
- Coğrafi konum: `set geo <lat> <lon> --origin "https://example.com"` (veya `--clear`)
- Medya: `set media dark|light|no-preference|none`
- Saat dilimi / yerel ayar: `set timezone ...`, `set locale ...`
- Cihaz / viewport:
  - `set device "iPhone 14"` (Playwright cihaz ön ayarları)
  - `set viewport 1280 720`

## Güvenlik ve gizlilik

- openclaw tarayıcı profili oturum açılmış oturumlar içerebilir; bunu hassas kabul edin.
- `browser act kind=evaluate` / `openclaw browser evaluate` ve `wait --fn`,
  sayfa bağlamında rastgele JavaScript çalıştırır. Prompt injection bunu
  yönlendirebilir. İhtiyacınız yoksa `browser.evaluateEnabled=false` ile devre
  dışı bırakın.
- `openclaw browser evaluate --fn` bir işlev kaynağı, bir ifade veya bir deyim
  gövdesi kabul eder. Deyim gövdeleri async işlevler olarak sarılır, bu nedenle
  geri istediğiniz değer için `return` kullanın. Sayfa tarafındaki işlev varsayılan
  evaluate zaman aşımından daha uzun sürebilecekse `--timeout-ms <ms>` kullanın.
- Oturum açma ve bot karşıtı notlar (X/Twitter vb.) için bkz. [Tarayıcı oturumu açma + X/Twitter gönderisi](/tr/tools/browser-login).
- Gateway/Node ana makinesini özel tutun (local loopback veya yalnızca tailnet).
- Uzak CDP uç noktaları güçlüdür; bunları tünelleyin ve koruyun.

Katı mod örneği (özel/dahili hedefleri varsayılan olarak engelleyin):

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
- [Tarayıcı oturumu açma](/tr/tools/browser-login) - sitelerde oturum açma
- [Tarayıcı Linux sorun giderme](/tr/tools/browser-linux-troubleshooting)
- [Tarayıcı WSL2 sorun giderme](/tr/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
