---
read_when:
    - Agent tarayıcısını yerel kontrol API'si üzerinden betikleme veya hata ayıklama
    - '`openclaw browser` CLI başvurus'
    - Anlık görüntüler ve ref'lerle özel tarayıcı otomasyonu ekleme
summary: OpenClaw tarayıcı denetimi API'si, CLI başvurusu ve betikleme eylemleri
title: Tarayıcı denetimi API'si
x-i18n:
    generated_at: "2026-04-24T09:33:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: e29ad295085e2c36a6c2ce01366a4186e45a7ecfe1d3c3072353c55794b05b5f
    source_path: tools/browser-control.md
    workflow: 15
---

Kurulum, yapılandırma ve sorun giderme için bkz. [Browser](/tr/tools/browser).
Bu sayfa, yerel kontrol HTTP API'si, `openclaw browser`
CLI ve betikleme kalıpları (anlık görüntüler, ref'ler, beklemeler, hata ayıklama akışları) için başvurudur.

## Control API (isteğe bağlı)

Yalnızca yerel entegrasyonlar için Gateway küçük bir loopback HTTP API açığa çıkarır:

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

Tüm uç noktalar `?profile=<name>` kabul eder.

Paylaşılan gizli anahtar Gateway kimlik doğrulaması yapılandırılmışsa, tarayıcı HTTP yolları da kimlik doğrulama gerektirir:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` veya bu parolayla HTTP Basic auth

Notlar:

- Bu bağımsız loopback tarayıcı API'si **trusted-proxy** veya
  Tailscale Serve kimlik başlıklarını tüketmez.
- `gateway.auth.mode` değeri `none` veya `trusted-proxy` ise, bu loopback tarayıcı
  yolları bu kimlik taşıyan modları miras almaz; bunları yalnızca loopback olarak tutun.

### `/act` hata sözleşmesi

`POST /act`, rota düzeyi doğrulama ve
ilke hataları için yapılandırılmış bir hata yanıtı kullanır:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Geçerli `code` değerleri:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` eksik veya tanınmıyor.
- `ACT_INVALID_REQUEST` (HTTP 400): eylem payload'ı normalizasyon veya doğrulamadan geçemedi.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector`, desteklenmeyen bir eylem türüyle kullanıldı.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (veya `wait --fn`) yapılandırma tarafından devre dışı bırakıldı.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): üst düzey veya toplu `targetId`, istek hedefiyle çakışıyor.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): eylem, mevcut oturum profilleri için desteklenmiyor.

Diğer çalışma zamanı hataları yine de `code`
alanı olmadan `{ "error": "<message>" }` döndürebilir.

### Playwright gereksinimi

Bazı özellikler (`navigate`/`act`/AI snapshot/role snapshot, öğe ekran görüntüleri,
PDF) Playwright gerektirir. Playwright kurulu değilse bu uç noktalar
açık bir 501 hatası döndürür.

Playwright olmadan hâlâ çalışanlar:

- ARIA anlık görüntüleri
- Sekme başına CDP
  WebSocket mevcut olduğunda yönetilen `openclaw` tarayıcısı için sayfa ekran görüntüleri
- `existing-session` / Chrome MCP profilleri için sayfa ekran görüntüleri
- Anlık görüntü çıktısından `existing-session` ref tabanlı ekran görüntüleri (`--ref`)

Hâlâ Playwright gerektirenler:

- `navigate`
- `act`
- AI anlık görüntüleri / role snapshot'lar
- CSS selector tabanlı öğe ekran görüntüleri (`--element`)
- tam tarayıcı PDF dışa aktarma

Öğe ekran görüntüleri ayrıca `--full-page` seçeneğini de reddeder; rota `fullPage is
not supported for element screenshots` döndürür.

`Playwright is not available in this gateway build` görürseniz `playwright-core` kurulu olacak şekilde paketlenmiş tarayıcı Plugin çalışma zamanı bağımlılıklarını onarın,
ardından Gateway'i yeniden başlatın. Paketlenmiş kurulumlar için `openclaw doctor --fix` çalıştırın.
Docker için, aşağıda gösterildiği gibi Chromium tarayıcı ikili dosyalarını da kurun.

#### Docker Playwright kurulumu

Gateway'iniz Docker içinde çalışıyorsa `npx playwright` kullanmaktan kaçının (npm override çakışmaları).
Bunun yerine paketlenmiş CLI'yi kullanın:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Tarayıcı indirmelerini kalıcı yapmak için `PLAYWRIGHT_BROWSERS_PATH` ayarlayın (örneğin,
`/home/node/.cache/ms-playwright`) ve `/home/node` yolunun
`OPENCLAW_HOME_VOLUME` veya bir bind mount üzerinden kalıcı olduğundan emin olun. Bkz. [Docker](/tr/install/docker).

## Nasıl çalışır (iç yapı)

Küçük bir loopback kontrol sunucusu HTTP isteklerini kabul eder ve Chromium tabanlı tarayıcılara CDP üzerinden bağlanır. Gelişmiş eylemler (tıklama/yazma/anlık görüntü/PDF), CDP üzerinde Playwright üzerinden gider; Playwright eksik olduğunda yalnızca Playwright gerektirmeyen işlemler kullanılabilir. Agent, yerel/uzak tarayıcılar ve profiller altta serbestçe değişirken tek bir kararlı arayüz görür.

## CLI hızlı başvuru

Tüm komutlar belirli bir profili hedeflemek için `--browser-profile <name>` ve makine tarafından okunabilir çıktı için `--json` kabul eder.

<AccordionGroup>

<Accordion title="Temeller: durum, sekmeler, aç/odaklan/kapat">

```bash
openclaw browser status
openclaw browser start
openclaw browser stop            # ayrıca yalnızca-ekli/uzak CDP'de emülasyonu temizler
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
openclaw browser screenshot --ref 12        # veya role ref'ler için --ref e12
openclaw browser snapshot
openclaw browser snapshot --format aria --limit 200
openclaw browser snapshot --interactive --compact --depth 6
openclaw browser snapshot --efficient
openclaw browser snapshot --labels
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
openclaw browser click 12 --double           # veya role ref'ler için e12
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

- `upload` ve `dialog` **hazırlama** çağrılarıdır; dosya seçici/diyaloğu tetikleyen tıklama/basma işleminden önce bunları çalıştırın.
- `click`/`type`/vb. `snapshot` çıktısından bir `ref` gerektirir (sayısal `12` veya role ref `e12`). Eylemler için CSS selector'lar bilerek desteklenmez.
- İndirme, izleme ve yükleme yolları OpenClaw geçici kökleriyle sınırlandırılmıştır: `/tmp/openclaw{,/downloads,/uploads}` (geri dönüş: `${os.tmpdir()}/openclaw/...`).
- `upload`, dosya girdilerini doğrudan `--input-ref` veya `--element` ile de ayarlayabilir.

Anlık görüntü bayraklarına hızlı bakış:

- `--format ai` (Playwright ile varsayılan): sayısal ref'li AI anlık görüntüsü (`aria-ref="<n>"`).
- `--format aria`: erişilebilirlik ağacı, ref yok; yalnızca inceleme için.
- `--efficient` (veya `--mode efficient`): compact role snapshot ön ayarı. Bunu varsayılan yapmak için `browser.snapshotDefaults.mode: "efficient"` ayarlayın (bkz. [Gateway yapılandırması](/tr/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector` role snapshot'ı `ref=e12` ref'leriyle zorlar. `--frame "<iframe>"`, role snapshot'ları bir iframe ile sınırlar.
- `--labels`, üstüne ref etiketleri bindirilmiş yalnızca görünüm alanı ekran görüntüsü ekler (`MEDIA:<path>` yazdırır).

## Anlık görüntüler ve ref'ler

OpenClaw iki “anlık görüntü” stilini destekler:

- **AI anlık görüntüsü (sayısal ref'ler)**: `openclaw browser snapshot` (varsayılan; `--format ai`)
  - Çıktı: sayısal ref'ler içeren metin anlık görüntüsü.
  - Eylemler: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - İçte, ref Playwright'ın `aria-ref` özelliğiyle çözülür.

- **Role snapshot (ör. `e12` gibi role ref'ler)**: `openclaw browser snapshot --interactive` (veya `--compact`, `--depth`, `--selector`, `--frame`)
  - Çıktı: `[ref=e12]` (ve isteğe bağlı `[nth=1]`) içeren role tabanlı liste/ağaç.
  - Eylemler: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - İçte, ref `getByRole(...)` ile çözülür (yinelenenler için `nth()` ile birlikte).
  - Üstüne bindirilmiş `e12` etiketli görünüm alanı ekran görüntüsü eklemek için `--labels` kullanın.

Ref davranışı:

- Ref'ler **gezinmeler arasında kararlı değildir**; bir şey başarısız olursa `snapshot` komutunu yeniden çalıştırın ve yeni bir ref kullanın.
- Role snapshot `--frame` ile alındıysa role ref'leri bir sonraki role snapshot'a kadar o iframe ile sınırlıdır.

## Bekleme güçlendirmeleri

Yalnızca zaman/metin üzerinde beklemek zorunda değilsiniz:

- URL bekleyin (Playwright tarafından globs desteklenir):
  - `openclaw browser wait --url "**/dash"`
- Yük durumu bekleyin:
  - `openclaw browser wait --load networkidle`
- Bir JS predicate bekleyin:
  - `openclaw browser wait --fn "window.ready===true"`
- Bir selector görünür olana kadar bekleyin:
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
2. `click <ref>` / `type <ref>` kullanın (etkileşimli modda role ref'leri tercih edin)
3. Hâlâ başarısız olursa: Playwright'ın neyi hedeflediğini görmek için `openclaw browser highlight <ref>`
4. Sayfa garip davranıyorsa:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Derin hata ayıklama için bir iz kaydedin:
   - `openclaw browser trace start`
   - sorunu yeniden üretin
   - `openclaw browser trace stop` (`TRACE:<path>` yazdırır)

## JSON çıktısı

`--json`, betikleme ve yapılandırılmış araç kullanımı içindir.

Örnekler:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

JSON içindeki role snapshot'lar, araçların payload boyutu ve yoğunluğu hakkında akıl yürütebilmesi için `refs` ile birlikte küçük bir `stats` bloğu (satırlar/karakterler/ref'ler/interactive) içerir.

## Durum ve ortam düğmeleri

Bunlar “siteyi X gibi davranmaya zorla” iş akışları için yararlıdır:

- Çerezler: `cookies`, `cookies set`, `cookies clear`
- Depolama: `storage local|session get|set|clear`
- Çevrimdışı: `set offline on|off`
- Başlıklar: `set headers --headers-json '{"X-Debug":"1"}'` (eski `set headers --json '{"X-Debug":"1"}'` hâlâ desteklenir)
- HTTP basic auth: `set credentials user pass` (veya `--clear`)
- Coğrafi konum: `set geo <lat> <lon> --origin "https://example.com"` (veya `--clear`)
- Medya: `set media dark|light|no-preference|none`
- Saat dilimi / yerel ayar: `set timezone ...`, `set locale ...`
- Cihaz / görünüm alanı:
  - `set device "iPhone 14"` (Playwright cihaz ön ayarları)
  - `set viewport 1280 720`

## Güvenlik ve gizlilik

- openclaw tarayıcı profili oturum açılmış oturumlar içerebilir; bunu hassas kabul edin.
- `browser act kind=evaluate` / `openclaw browser evaluate` ve `wait --fn`,
  sayfa bağlamında rastgele JavaScript çalıştırır. Prompt injection bunu yönlendirebilir.
  Buna ihtiyacınız yoksa `browser.evaluateEnabled=false` ile devre dışı bırakın.
- Girişler ve anti-bot notları (X/Twitter vb.) için bkz. [Browser login + X/Twitter posting](/tr/tools/browser-login).
- Gateway/node ana makinesini özel tutun (yalnızca loopback veya tailnet).
- Uzak CDP uç noktaları güçlüdür; onları tünelleyin ve koruyun.

Katı mod örneği (özel/iç hedefleri varsayılan olarak engelle):

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
- [Browser login](/tr/tools/browser-login) — sitelerde oturum açma
- [Browser Linux troubleshooting](/tr/tools/browser-linux-troubleshooting)
- [Browser WSL2 troubleshooting](/tr/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
