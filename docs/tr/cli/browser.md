---
read_when:
    - '`openclaw browser` kullanıyorsunuz ve yaygın görevler için örnekler istiyorsunuz'
    - Bir Node ana bilgisayarı üzerinden başka bir makinede çalışan bir Browser’ı denetlemek istiyorsunuz
    - Chrome MCP aracılığıyla yerel olarak oturum açılmış Chrome’unuza bağlanmak istiyorsunuz
summary: '`openclaw browser` için CLI başvurusu (yaşam döngüsü, profiller, sekmeler, eylemler, durum ve hata ayıklama)'
title: Browser
x-i18n:
    generated_at: "2026-04-26T11:25:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: b42511e841e768bfa4031463f213d78c67d5c63efb655a90f65c7e8c71da9881
    source_path: cli/browser.md
    workflow: 15
---

# `openclaw browser`

OpenClaw'ın Browser kontrol yüzeyini yönetin ve Browser eylemlerini çalıştırın (yaşam döngüsü, profiller, sekmeler, anlık görüntüler, ekran görüntüleri, gezinme, giriş, durum öykünmesi ve hata ayıklama).

İlgili:

- Browser aracı + API: [Browser aracı](/tr/tools/browser)

## Yaygın bayraklar

- `--url <gatewayWsUrl>`: Gateway WebSocket URL'si (varsayılan olarak yapılandırmadan alınır).
- `--token <token>`: Gateway token'ı (gerekiyorsa).
- `--timeout <ms>`: istek zaman aşımı (ms).
- `--expect-final`: son Gateway yanıtını bekle.
- `--browser-profile <name>`: bir Browser profili seçin (varsayılan yapılandırmadan alınır).
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

`start`, `not reachable after start` hatasıyla başarısız olursa önce CDP hazır olma durumunu giderin. `start` ve `tabs` başarılıysa ama `open` veya `navigate` başarısız oluyorsa, Browser kontrol düzlemi sağlıklıdır ve hata genellikle gezinme SSRF ilkesiyle ilgilidir.

Minimum sıra:

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Ayrıntılı rehber: [Browser sorun giderme](/tr/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

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

- `doctor --deep`, canlı bir anlık görüntü yoklaması ekler. Temel CDP hazır olma durumu yeşil olduğunda ancak mevcut sekmenin incelenebildiğine dair kanıt istediğinizde yararlıdır.
- `attachOnly` ve uzak CDP profilleri için `openclaw browser stop`, OpenClaw Browser sürecini kendisi başlatmamış olsa bile etkin kontrol oturumunu kapatır ve geçici öykünme geçersiz kılmalarını temizler.
- Yerel yönetilen profiller için `openclaw browser stop`, oluşturulan Browser sürecini durdurur.
- `openclaw browser start --headless` yalnızca o başlatma isteğine uygulanır ve yalnızca OpenClaw yerel olarak yönetilen bir Browser başlattığında etkilidir. `browser.headless` veya profil yapılandırmasını yeniden yazmaz ve zaten çalışan bir Browser için etkisizdir.
- `DISPLAY` veya `WAYLAND_DISPLAY` olmayan Linux ana bilgisayarlarında, `OPENCLAW_BROWSER_HEADLESS=0`, `browser.headless=false` veya `browser.profiles.<name>.headless=false` görünür bir Browser açıkça istemediği sürece yerel yönetilen profiller otomatik olarak headless çalışır.

## Komut eksikse

`openclaw browser` bilinmeyen bir komutsa, `~/.openclaw/openclaw.json` içindeki `plugins.allow` değerini kontrol edin.

`plugins.allow` mevcut olduğunda, paketle gelen browser Plugin açıkça listelenmelidir:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Plugin izin listesi `browser` öğesini dışlıyorsa `browser.enabled=true`, CLI alt komutunu geri getirmez.

İlgili: [Browser aracı](/tr/tools/browser#missing-browser-command-or-tool)

## Profiller

Profiller, adlandırılmış Browser yönlendirme yapılandırmalarıdır. Pratikte:

- `openclaw`: özel bir OpenClaw tarafından yönetilen Chrome örneğini başlatır veya ona bağlanır (yalıtılmış kullanıcı veri dizini).
- `user`: Chrome DevTools MCP üzerinden mevcut oturum açılmış Chrome oturumunuzu denetler.
- özel CDP profilleri: yerel veya uzak bir CDP uç noktasını işaret eder.

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

`tabs`, önce `suggestedTargetId`, ardından `t1` gibi kararlı `tabId`, isteğe bağlı etiket ve ham `targetId` döndürür. Ajanlar `focus`, `close`, anlık görüntüler ve eylemler için `suggestedTargetId` değerini geri iletmelidir. `open --label`, `tab new --label` veya `tab label` ile bir etiket atayabilirsiniz; etiketler, sekme kimlikleri, ham hedef kimlikleri ve benzersiz hedef kimliği önekleri kabul edilir. Chromium, bir gezinme veya form gönderimi sırasında alttaki ham hedefi değiştirdiğinde, OpenClaw eşleşmeyi kanıtlayabildiğinde kararlı `tabId`/etiketi yeni sekmeye bağlı tutar. Ham hedef kimlikleri değişkendir; `suggestedTargetId` tercih edin.

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

- `--full-page` yalnızca sayfa yakalamaları içindir; `--ref` veya `--element` ile birleştirilemez.
- `existing-session` / `user` profilleri, sayfa ekran görüntülerini ve anlık görüntü çıktısından `--ref` ekran görüntülerini destekler, ancak CSS `--element` ekran görüntülerini desteklemez.
- `--labels`, mevcut anlık görüntü referanslarını ekran görüntüsünün üzerine bindirir.
- `snapshot --urls`, keşfedilen bağlantı hedeflerini AI anlık görüntülerine ekler; böylece ajanlar yalnızca bağlantı metninden tahmin etmek yerine doğrudan gezinme hedefleri seçebilir.

Gezinme/tıklama/yazma (ref tabanlı UI otomasyonu):

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

Eylem yanıtları, OpenClaw değiştirme sekmesini kanıtlayabildiğinde, eylem kaynaklı sayfa değişiminden sonra mevcut ham `targetId` değerini döndürür. Betikler yine de uzun ömürlü iş akışları için `suggestedTargetId`/etiketleri saklamalı ve kullanmalıdır.

Dosya + iletişim kutusu yardımcıları:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
```

Yönetilen Chrome profilleri, normal tıklamayla tetiklenen indirmeleri OpenClaw indirmeler dizinine kaydeder (varsayılan olarak `/tmp/openclaw/downloads` veya yapılandırılmış geçici kök). Ajanın belirli bir dosyayı bekleyip yolunu döndürmesi gerektiğinde `waitfordownload` veya `download` kullanın; bu açık bekleyiciler bir sonraki indirmenin sahibi olur.

## Durum ve depolama

Görüntü alanı + öykünme:

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

Bu yol yalnızca host içindir. Docker, headless sunucular, Browserless veya diğer uzak kurulumlar için bunun yerine bir CDP profili kullanın.

Geçerli existing-session sınırlamaları:

- anlık görüntü tabanlı eylemler CSS seçicileri değil, ref kullanır
- `browser.actionTimeoutMs`, çağıranlar `timeoutMs` belirtmediğinde desteklenen `act` istekleri için varsayılan olarak 60000 ms kullanır; çağrı başına `timeoutMs` yine önceliklidir.
- `click` yalnızca sol tıklamadır
- `type`, `slowly=true` desteği sunmaz
- `press`, `delayMs` desteği sunmaz
- `hover`, `scrollintoview`, `drag`, `select`, `fill` ve `evaluate`, çağrı başına zaman aşımı geçersiz kılmalarını reddeder
- `select` yalnızca tek bir değeri destekler
- `wait --load networkidle` desteklenmez
- dosya yüklemeleri `--ref` / `--input-ref` gerektirir, CSS `--element` desteği yoktur ve şu anda aynı anda tek dosya desteklenir
- iletişim kutusu kancaları `--timeout` desteği sunmaz
- ekran görüntüleri sayfa yakalamalarını ve `--ref` desteğini sunar, ancak CSS `--element` desteği sunmaz
- `responsebody`, indirme yakalama, PDF dışa aktarma ve toplu eylemler hâlâ yönetilen bir Browser veya ham CDP profili gerektirir

## Uzak Browser denetimi (Node ana bilgisayar proxy'si)

Gateway, Browser'dan farklı bir makinede çalışıyorsa Chrome/Brave/Edge/Chromium bulunan makinede bir **Node ana bilgisayarı** çalıştırın. Gateway, Browser eylemlerini o node'a proxy'ler (ayrı bir Browser kontrol sunucusu gerekmez).

Otomatik yönlendirmeyi denetlemek için `gateway.nodes.browser.mode`, birden fazla node bağlıysa belirli bir node'u sabitlemek için `gateway.nodes.browser.node` kullanın.

Güvenlik + uzak kurulum: [Browser aracı](/tr/tools/browser), [Uzak erişim](/tr/gateway/remote), [Tailscale](/tr/gateway/tailscale), [Güvenlik](/tr/gateway/security)

## İlgili

- [CLI başvurusu](/tr/cli)
- [Browser](/tr/tools/browser)
