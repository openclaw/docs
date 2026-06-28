---
read_when:
    - '`openclaw browser` kullanıyorsunuz ve yaygın görevler için örnekler istiyorsunuz'
    - Başka bir makinede çalışan bir tarayıcıyı bir node ana makinesi üzerinden kontrol etmek istiyorsunuz
    - Yerel olarak oturum açmış Chrome’unuza Chrome MCP aracılığıyla bağlanmak istiyorsunuz
summary: '`openclaw browser` için CLI başvurusu (yaşam döngüsü, profiller, sekmeler, eylemler, durum ve hata ayıklama)'
title: Tarayıcı
x-i18n:
    generated_at: "2026-06-28T00:21:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d9e45a6b89f23623c25b61d41273151b60da1fc415b5d3c901d8c555d8244f7a
    source_path: cli/browser.md
    workflow: 16
---

# `openclaw browser`

OpenClaw'ın tarayıcı denetim yüzeyini yönetin ve tarayıcı eylemleri çalıştırın (yaşam döngüsü, profiller, sekmeler, anlık görüntüler, ekran görüntüleri, gezinme, giriş, durum emülasyonu ve hata ayıklama).

İlgili:

- Tarayıcı aracı + API: [Tarayıcı aracı](/tr/tools/browser)

## Yaygın bayraklar

- `--url <gatewayWsUrl>`: Gateway WebSocket URL'si (varsayılan olarak yapılandırmadan alınır).
- `--token <token>`: Gateway belirteci (gerekliyse).
- `--timeout <ms>`: istek zaman aşımı (ms).
- `--expect-final`: nihai bir Gateway yanıtını bekler.
- `--browser-profile <name>`: bir tarayıcı profili seçer (varsayılan yapılandırmadan alınır).
- `--json`: makine tarafından okunabilir çıktı (desteklendiği yerlerde).

## Hızlı başlangıç (yerel)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Aracılar aynı hazır olma denetimini `browser({ action: "doctor" })` ile çalıştırabilir.

## Hızlı sorun giderme

`start`, `not reachable after start` ile başarısız olursa önce CDP hazır olma durumunu sorun giderin. `start` ve `tabs` başarılı olup `open` veya `navigate` başarısız olursa tarayıcı denetim düzlemi sağlıklıdır ve hata genellikle gezinme SSRF politikasıdır.

En küçük sıra:

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Ayrıntılı kılavuz: [Tarayıcı sorun giderme](/tr/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

## Yaşam döngüsü

```bash
openclaw browser status
openclaw browser doctor
openclaw browser doctor --deep
openclaw browser start
openclaw browser start --headless
openclaw browser stop
openclaw browser --browser-profile openclaw reset-profile
```

Notlar:

- `doctor --deep` canlı bir anlık görüntü sondası ekler. Temel CDP
  hazır olma durumu yeşilken mevcut sekmenin incelenebildiğine dair kanıt
  istediğinizde kullanışlıdır.
- `attachOnly` ve uzak CDP profilleri için `openclaw browser stop`, OpenClaw
  tarayıcı sürecini kendisi başlatmamış olsa bile etkin denetim oturumunu kapatır
  ve geçici emülasyon geçersiz kılmalarını temizler.
- Yerel yönetilen profiller için `openclaw browser stop`, oluşturulan tarayıcı
  sürecini durdurur.
- `openclaw browser start --headless` yalnızca o başlatma isteğine ve yalnızca
  OpenClaw yerel yönetilen bir tarayıcı başlattığında uygulanır. `browser.headless`
  veya profil yapılandırmasını yeniden yazmaz ve zaten çalışan bir tarayıcı için
  işlem yapmaz.
- `DISPLAY` veya `WAYLAND_DISPLAY` olmayan Linux ana makinelerinde, yerel yönetilen
  profiller `OPENCLAW_BROWSER_HEADLESS=0`, `browser.headless=false` veya
  `browser.profiles.<name>.headless=false` görünür bir tarayıcıyı açıkça istemediği
  sürece otomatik olarak headless çalışır.

## Komut eksikse

`openclaw browser` bilinmeyen bir komutsa
`~/.openclaw/openclaw.json` içindeki `plugins.allow` değerini kontrol edin.

`plugins.allow` mevcut olduğunda, yapılandırmada zaten kök bir `browser` bloğu
yoksa paketli tarayıcı Plugin'ini açıkça listeleyin:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Açık bir kök `browser` bloğu, örneğin `browser.enabled=true` veya
`browser.profiles.<name>`, kısıtlayıcı bir Plugin izin listesi altında paketli
tarayıcı Plugin'ini de etkinleştirir.

İlgili: [Tarayıcı aracı](/tr/tools/browser#missing-browser-command-or-tool)

## Profiller

Profiller, adlandırılmış tarayıcı yönlendirme yapılandırmalarıdır. Pratikte:

- `openclaw`: ayrılmış, OpenClaw tarafından yönetilen bir Chrome örneğini başlatır veya ona bağlanır (yalıtılmış kullanıcı veri dizini).
- `user`: Chrome DevTools MCP aracılığıyla mevcut oturum açılmış Chrome oturumunuzu denetler.
- özel CDP profilleri: yerel veya uzak bir CDP uç noktasını gösterir.

```bash
openclaw browser profiles
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name remote --cdp-url https://browser-host.example.com
openclaw browser delete-profile --name work
```

Belirli bir profili kullanın:

```bash
openclaw browser --browser-profile work tabs
```

## Sekmeler

```bash
openclaw browser tabs
openclaw browser tab new --label docs
openclaw browser tab label t1 docs
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://docs.openclaw.ai --label docs
openclaw browser focus docs
openclaw browser close t1
```

`tabs` önce `suggestedTargetId` değerini, ardından `t1` gibi kararlı `tabId`
değerini, isteğe bağlı etiketi ve ham `targetId` değerini döndürür. Aracılar
`suggestedTargetId` değerini `focus`, `close`, anlık görüntüler ve eylemlere geri
geçirmelidir. `open --label`, `tab new --label` veya `tab label` ile bir etiket
atayabilirsiniz; etiketler, sekme kimlikleri, ham hedef kimlikleri ve benzersiz
hedef kimliği öneklerinin tümü kabul edilir.
İstek alanı uyumluluk için hâlâ `targetId` olarak adlandırılır, ancak bu sekme
başvurularını kabul eder. Ham hedef kimliklerini kalıcı aracı belleği değil,
tanılama tutamaçları olarak değerlendirin.
Chromium, gezinme veya form gönderimi sırasında alttaki ham hedefi değiştirdiğinde,
OpenClaw eşleşmeyi kanıtlayabildiği durumlarda kararlı `tabId`/etiket değerini
yedek sekmeye bağlı tutar. Ham hedef kimlikleri değişken kalır; `suggestedTargetId`
tercih edin.

## Anlık görüntü / ekran görüntüsü / eylemler

Anlık görüntü:

```bash
openclaw browser snapshot
openclaw browser snapshot --urls
```

Ekran görüntüsü:

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref e12
openclaw browser screenshot --labels
```

Notlar:

- `--full-page` yalnızca sayfa yakalamaları içindir; `--ref` veya `--element`
  ile birlikte kullanılamaz.
- `existing-session` / `user` profilleri sayfa ekran görüntülerini ve anlık
  görüntü çıktısından `--ref` ekran görüntülerini destekler, ancak CSS
  `--element` ekran görüntülerini desteklemez.
- `--labels`, ekran görüntüsü üzerine mevcut anlık görüntü başvurularını bindirir.
  Playwright destekli profillerde `--full-page` (tam sayfa etiket bindirmesi),
  `--ref` (ARIA ref ile öğe kırpma etiketi bindirmesi) ve `--element` (CSS seçici
  ile öğe kırpma etiketi bindirmesi) ile çalışır; öğe kırpma modlarında etiketler
  öğeye göre yansıtılır. Yanıt ayrıca her ref'in sınırlayıcı kutusunu içeren bir
  `annotations` dizisi de içerir. Her öğede `ref`, `number`, `role`, isteğe bağlı
  `name` ve `box: {x, y, width, height}` bulunur; koordinatlar yakalanan görüntünün
  uzayındadır (görüntü alanı / tam sayfa / öğeye göre). Alan boş olduğunda atlanır.
  `existing-session` profilleri sayfa ekran görüntülerinde bir chrome-mcp bindirmesi
  işler, ancak Playwright yansıtma yardımcısını kullanmaz ve `annotations` içermez;
  CSS `--element` ekran görüntüleri burada desteklenmez. Playwright veya chrome-mcp
  olmadan etiketli ekran görüntüleri kullanılamaz. Önceki sürümler etiketli
  Playwright ekran görüntülerinde `--full-page`, `--ref` ve `--element` değerlerini
  yok sayar ve her zaman bir görüntü alanı yakalaması döndürürdü; etiketli ekran
  görüntüleri artık bu kapsamları uygular.
- `snapshot --urls`, keşfedilen bağlantı hedeflerini AI anlık görüntülerine ekler;
  böylece aracılar yalnızca bağlantı metninden tahmin etmek yerine doğrudan gezinme
  hedefleri seçebilir.

Gezin/tıkla/yaz (ref tabanlı UI otomasyonu):

```bash
openclaw browser navigate https://example.com
openclaw browser click <ref>
openclaw browser click-coords 120 340
openclaw browser type <ref> "hello"
openclaw browser press Enter
openclaw browser hover <ref>
openclaw browser scrollintoview <ref>
openclaw browser drag <startRef> <endRef>
openclaw browser select <ref> OptionA OptionB
openclaw browser fill --fields '[{"ref":"1","value":"Ada"}]'
openclaw browser wait --text "Done"
openclaw browser evaluate --fn '(el) => el.textContent' --ref <ref>
openclaw browser evaluate --fn 'const title = document.title; return title;'
openclaw browser evaluate --timeout-ms 30000 --fn 'async () => { await window.ready; return true; }'
```

`evaluate --fn` bir işlev kaynağı, bir ifade veya bir deyim gövdesi kabul eder.
Deyim gövdeleri async işlevler olarak sarılır, bu yüzden geri almak istediğiniz
değer için `return` kullanın. Sayfa tarafındaki işlev varsayılan değerlendirme
zaman aşımından daha uzun süreye ihtiyaç duyabilecekse `evaluate --timeout-ms <ms>`
kullanın.

Eylem yanıtları, OpenClaw yedek sekmeyi kanıtlayabildiğinde eylemle tetiklenen
sayfa değişiminden sonra mevcut ham `targetId` değerini döndürür. Betikler, uzun
ömürlü iş akışları için yine de `suggestedTargetId`/etiketleri saklamalı ve
geçirmelidir.

Dosya + iletişim kutusu yardımcıları:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser upload media://inbound/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
openclaw browser dialog --dismiss --dialog-id d1
```

Yönetilen Chrome profilleri, sıradan tıklama tetiklemeli indirmeleri OpenClaw
indirmeler dizinine kaydeder (varsayılan olarak `/tmp/openclaw/downloads` veya
yapılandırılmış geçici kök). Aracının belirli bir dosyayı beklemesi ve yolunu
döndürmesi gerektiğinde `waitfordownload` veya `download` kullanın; bu açık
bekleyiciler bir sonraki indirmenin sahibidir.
Yüklemeler, OpenClaw geçici yükleme kökünden ve OpenClaw tarafından yönetilen
gelen medyadan dosyaları kabul eder; buna `media://inbound/<id>` ve sandbox'a göre
`media/inbound/<id>` başvuruları dahildir. İç içe medya ref'leri, dizin aşımı ve
rastgele yerel yollar reddedilmeye devam eder.
Bir eylem modal iletişim kutusu açtığında, eylem yanıtı
`browserState.dialogs.pending` ile `blockedByDialog` döndürür; doğrudan yanıtlamak
için `--dialog-id` geçirin. OpenClaw dışında işlenen iletişim kutuları
`browserState.dialogs.recent` altında görünür.

## Durum ve depolama

Görüntü alanı + emülasyon:

```bash
openclaw browser resize 1280 720
openclaw browser set viewport 1280 720
openclaw browser set offline on
openclaw browser set media dark
openclaw browser set timezone Europe/London
openclaw browser set locale en-GB
openclaw browser set geo 51.5074 -0.1278 --accuracy 25
openclaw browser set device "iPhone 14"
openclaw browser set headers '{"x-test":"1"}'
openclaw browser set credentials myuser mypass
```

Çerezler + depolama:

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url https://example.com
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set token abc123
openclaw browser storage session clear
```

## Hata ayıklama

```bash
openclaw browser console --level error
openclaw browser pdf
openclaw browser responsebody "**/api"
openclaw browser highlight <ref>
openclaw browser errors --clear
openclaw browser requests --filter api
openclaw browser trace start
openclaw browser trace stop --out trace.zip
```

## MCP üzerinden mevcut Chrome

Yerleşik `user` profilini kullanın veya kendi `existing-session` profilinizi oluşturun:

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser create-profile --name chrome-port --driver existing-session --cdp-url http://127.0.0.1:9222
openclaw browser --browser-profile chrome-live tabs
```

Varsayılan existing-session yolu yalnızca ana makinede Chrome MCP otomatik bağlantısıdır. Tarayıcı zaten
bir DevTools uç noktasıyla çalışıyorsa, Chrome MCP'nin bunun yerine o uç noktaya bağlanması için `--cdp-url` geçirin.
Docker, Browserless veya Chrome MCP semantiğinin gerekmediği diğer uzak kurulumlar için
bir CDP profili kullanın.

Mevcut existing-session sınırları:

- anlık görüntü odaklı eylemler CSS seçicileri değil, ref’leri kullanır
- `browser.actionTimeoutMs`, çağıranlar `timeoutMs` belirtmediğinde desteklenen `act` istekleri için varsayılanı 60000 ms olarak ayarlar; çağrı başına `timeoutMs` yine de önceliklidir.
- `click` yalnızca sol tıklamadır
- `type`, `slowly=true` desteklemez
- `press`, `delayMs` desteklemez
- `hover`, `scrollintoview`, `drag`, `select`, `fill` ve `evaluate` çağrı başına zaman aşımı geçersiz kılmalarını reddeder
- `select` yalnızca bir değeri destekler
- `wait --load networkidle`, mevcut oturum profillerinde desteklenmez (yönetilen ve ham/uzak CDP üzerinde çalışır)
- dosya yüklemeleri `--ref` / `--input-ref` gerektirir, CSS `--element` desteklemez ve şu anda aynı anda tek dosyayı destekler
- iletişim kutusu kancaları `--timeout` desteklemez
- ekran görüntüleri sayfa yakalamalarını ve `--ref` destekler, ancak CSS `--element` desteklemez
- `responsebody`, indirme yakalama, PDF dışa aktarma ve toplu eylemler hâlâ yönetilen bir tarayıcı veya ham CDP profili gerektirir

## Uzak tarayıcı denetimi (node ana makine proxy’si)

Gateway, tarayıcıdan farklı bir makinede çalışıyorsa Chrome/Brave/Edge/Chromium bulunan makinede bir **node ana makinesi** çalıştırın. Gateway, tarayıcı eylemlerini o node’a proxy’ler (ayrı bir tarayıcı denetim sunucusu gerekmez).

Otomatik yönlendirmeyi denetlemek için `gateway.nodes.browser.mode`, birden fazla node bağlıysa belirli bir node’a sabitlemek için `gateway.nodes.browser.node` kullanın.

Güvenlik + uzak kurulum: [Tarayıcı aracı](/tr/tools/browser), [Uzak erişim](/tr/gateway/remote), [Tailscale](/tr/gateway/tailscale), [Güvenlik](/tr/gateway/security)

## İlgili

- [CLI başvurusu](/tr/cli)
- [Tarayıcı](/tr/tools/browser)
