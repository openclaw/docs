---
read_when:
    - '`openclaw browser` kullanıyorsunuz ve yaygın görevler için örnekler istiyorsunuz'
    - Başka bir makinede çalışan bir tarayıcıyı bir Node ana makinesi üzerinden kontrol etmek istiyorsunuz
    - Chrome MCP aracılığıyla yerel olarak oturum açtığınız Chrome'a bağlanmak istiyorsunuz
summary: '`openclaw browser` için CLI başvurusu (yaşam döngüsü, profiller, sekmeler, eylemler, durum ve hata ayıklama)'
title: Tarayıcı
x-i18n:
    generated_at: "2026-04-30T09:11:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7b5112c61e8289ab6a02bc30c9aefe640c053271f82197c0ee810b4a5efa580
    source_path: cli/browser.md
    workflow: 16
---

# `openclaw browser`

OpenClaw'ın tarayıcı kontrol yüzeyini yönetin ve tarayıcı eylemlerini çalıştırın (yaşam döngüsü, profiller, sekmeler, anlık görüntüler, ekran görüntüleri, gezinme, giriş, durum emülasyonu ve hata ayıklama).

İlgili:

- Tarayıcı aracı + API: [Tarayıcı aracı](/tr/tools/browser)

## Yaygın bayraklar

- `--url <gatewayWsUrl>`: Gateway WebSocket URL'si (varsayılan olarak yapılandırmadan alınır).
- `--token <token>`: Gateway belirteci (gerekliyse).
- `--timeout <ms>`: istek zaman aşımı (ms).
- `--expect-final`: nihai bir Gateway yanıtını bekle.
- `--browser-profile <name>`: bir tarayıcı profili seç (varsayılan yapılandırmadan alınır).
- `--json`: makine tarafından okunabilir çıktı (desteklendiği yerlerde).

## Hızlı başlangıç (yerel)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Ajanlar aynı hazır olma denetimini `browser({ action: "doctor" })` ile çalıştırabilir.

## Hızlı sorun giderme

`start`, `not reachable after start` ile başarısız olursa önce CDP hazır olma durumunu giderin. `start` ve `tabs` başarılı oluyor ancak `open` veya `navigate` başarısız oluyorsa, tarayıcı kontrol düzlemi sağlıklıdır ve hata genellikle gezinme SSRF ilkesinden kaynaklanır.

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

- `doctor --deep` canlı bir anlık görüntü yoklaması ekler. Temel CDP
  hazır olma durumu yeşilken ancak geçerli sekmenin incelenebildiğine dair kanıt istediğinizde kullanışlıdır.
- `attachOnly` ve uzak CDP profilleri için `openclaw browser stop`, OpenClaw
  tarayıcı sürecini kendisi başlatmamış olsa bile etkin kontrol oturumunu kapatır ve geçici emülasyon geçersiz kılmalarını temizler.
- Yerel yönetilen profiller için `openclaw browser stop`, oluşturulan tarayıcı
  sürecini durdurur.
- `openclaw browser start --headless` yalnızca o başlatma isteğine ve
  yalnızca OpenClaw yerel yönetilen bir tarayıcı başlattığında uygulanır. `browser.headless` ya da profil yapılandırmasını yeniden yazmaz ve zaten çalışan bir tarayıcı için etkisizdir.
- `DISPLAY` veya `WAYLAND_DISPLAY` olmayan Linux ana makinelerinde, yerel yönetilen profiller
  `OPENCLAW_BROWSER_HEADLESS=0`,
  `browser.headless=false` veya `browser.profiles.<name>.headless=false`
  görünür bir tarayıcıyı açıkça istemediği sürece otomatik olarak başsız çalışır.

## Komut eksikse

`openclaw browser` bilinmeyen bir komutsa,
`~/.openclaw/openclaw.json` içindeki `plugins.allow` ayarını kontrol edin.

`plugins.allow` mevcut olduğunda, yapılandırmada zaten kök düzeyinde bir `browser` bloğu yoksa paketlenmiş tarayıcı Plugin'ini açıkça listeleyin:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Örneğin `browser.enabled=true` veya
`browser.profiles.<name>` gibi açık bir kök `browser` bloğu da kısıtlayıcı bir Plugin izin listesi altında paketlenmiş tarayıcı Plugin'ini etkinleştirir.

İlgili: [Tarayıcı aracı](/tr/tools/browser#missing-browser-command-or-tool)

## Profiller

Profiller adlandırılmış tarayıcı yönlendirme yapılandırmalarıdır. Pratikte:

- `openclaw`: özel bir OpenClaw tarafından yönetilen Chrome örneği başlatır veya ona bağlanır (yalıtılmış kullanıcı veri dizini).
- `user`: Chrome DevTools MCP aracılığıyla mevcut oturum açılmış Chrome oturumunuzu kontrol eder.
- özel CDP profilleri: yerel veya uzak bir CDP uç noktasını gösterir.

```bash
openclaw browser profiles
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name remote --cdp-url https://browser-host.example.com
openclaw browser delete-profile --name work
```

Belirli bir profil kullanın:

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

`tabs` önce `suggestedTargetId` değerini, ardından `t1` gibi kararlı `tabId` değerini,
isteğe bağlı etiketi ve ham `targetId` değerini döndürür. Ajanlar
`suggestedTargetId` değerini `focus`, `close`, anlık görüntüler ve eylemlere geri iletmelidir. `open --label`, `tab new --label` veya `tab label` ile bir etiket atayabilirsiniz; etiketler,
sekme kimlikleri, ham hedef kimlikleri ve benzersiz hedef kimliği öneklerinin tümü kabul edilir.
Chromium, gezinme veya form gönderimi sırasında alttaki ham hedefi değiştirdiğinde, OpenClaw eşleşmeyi kanıtlayabildiğinde kararlı `tabId`/etiket değerini yedek sekmeye bağlı tutar. Ham hedef kimlikleri değişkendir; `suggestedTargetId` tercih edin.

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

- `--full-page` yalnızca sayfa yakalamaları içindir; `--ref`
  veya `--element` ile birleştirilemez.
- `existing-session` / `user` profilleri sayfa ekran görüntülerini ve anlık görüntü çıktısından `--ref`
  ekran görüntülerini destekler, ancak CSS `--element` ekran görüntülerini desteklemez.
- `--labels`, geçerli anlık görüntü başvurularını ekran görüntüsünün üzerine yerleştirir.
- `snapshot --urls`, keşfedilen bağlantı hedeflerini AI anlık görüntülerine ekler; böylece
  ajanlar yalnızca bağlantı metninden tahmin etmek yerine doğrudan gezinme hedefleri seçebilir.

Gezinme/tıklama/yazma (başvuru tabanlı UI otomasyonu):

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
```

Eylem yanıtları, OpenClaw yedek sekmeyi kanıtlayabildiğinde eylemle tetiklenen sayfa
değişiminden sonra geçerli ham `targetId` değerini döndürür. Betikler yine de uzun ömürlü iş akışları için `suggestedTargetId`/etiket değerlerini saklayıp iletmelidir.

Dosya + iletişim kutusu yardımcıları:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
```

Yönetilen Chrome profilleri, sıradan tıklamayla tetiklenen indirmeleri OpenClaw
indirmeler dizinine kaydeder (varsayılan olarak `/tmp/openclaw/downloads` veya yapılandırılmış geçici
kök). Ajanın belirli bir dosyayı bekleyip yolunu döndürmesi gerektiğinde `waitfordownload` veya `download` kullanın; bu açık bekleyiciler bir sonraki indirmeyi sahiplenir.

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
openclaw browser --browser-profile chrome-live tabs
```

Bu yol yalnızca ana makine içindir. Docker, başsız sunucular, Browserless veya diğer uzak kurulumlar için bunun yerine bir CDP profili kullanın.

Geçerli existing-session sınırları:

- anlık görüntü odaklı eylemler CSS seçicileri değil, başvurular kullanır
- çağıranlar `timeoutMs` atladığında `browser.actionTimeoutMs`, desteklenen `act` istekleri için varsayılan olarak 60000 ms kullanır; çağrı başına `timeoutMs` yine önceliklidir.
- `click` yalnızca sol tıklamadır
- `type`, `slowly=true` desteklemez
- `press`, `delayMs` desteklemez
- `hover`, `scrollintoview`, `drag`, `select`, `fill` ve `evaluate`
  çağrı başına zaman aşımı geçersiz kılmalarını reddeder
- `select` yalnızca bir değeri destekler
- `wait --load networkidle` desteklenmez
- dosya yüklemeleri `--ref` / `--input-ref` gerektirir, CSS
  `--element` desteklemez ve şu anda aynı anda bir dosyayı destekler
- iletişim kutusu kancaları `--timeout` desteklemez
- ekran görüntüleri sayfa yakalamalarını ve `--ref` değerini destekler, ancak CSS `--element` desteklemez
- `responsebody`, indirme yakalama, PDF dışa aktarma ve toplu eylemler hâlâ
  yönetilen bir tarayıcı veya ham CDP profili gerektirir

## Uzak tarayıcı kontrolü (node ana makine vekili)

Gateway tarayıcıdan farklı bir makinede çalışıyorsa, Chrome/Brave/Edge/Chromium bulunan makinede bir **node ana makinesi** çalıştırın. Gateway, tarayıcı eylemlerini o node'a vekil olarak iletir (ayrı bir tarayıcı kontrol sunucusu gerekmez).

Otomatik yönlendirmeyi kontrol etmek için `gateway.nodes.browser.mode`, birden fazla node bağlıysa belirli bir node'u sabitlemek için `gateway.nodes.browser.node` kullanın.

Güvenlik + uzak kurulum: [Tarayıcı aracı](/tr/tools/browser), [Uzak erişim](/tr/gateway/remote), [Tailscale](/tr/gateway/tailscale), [Güvenlik](/tr/gateway/security)

## İlgili

- [CLI başvurusu](/tr/cli)
- [Tarayıcı](/tr/tools/browser)
