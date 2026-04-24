---
read_when:
    - '`openclaw browser` kullanıyorsunuz ve yaygın görevler için örnekler istiyorsunuz'
    - Bir tarayıcıyı başka bir makinede bir düğüm ana makinesi üzerinden denetlemek istiyorsunuz
    - Yerel oturum açılmış Chrome'unuza Chrome MCP aracılığıyla bağlanmak istiyorsunuz
summary: '`openclaw browser` için CLI başvurusu (yaşam döngüsü, profiller, sekmeler, eylemler, durum ve hata ayıklama)'
title: Tarayıcı
x-i18n:
    generated_at: "2026-04-24T09:01:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1b93ea053b7fc047fad79397e0298cc530673a64d5873d98be9f910df1ea2fde
    source_path: cli/browser.md
    workflow: 15
---

# `openclaw browser`

OpenClaw’ın tarayıcı denetim yüzeyini yönetin ve tarayıcı eylemlerini çalıştırın (yaşam döngüsü, profiller, sekmeler, anlık görüntüler, ekran görüntüleri, gezinme, giriş, durum öykünmesi ve hata ayıklama).

İlgili:

- Tarayıcı aracı + API: [Tarayıcı aracı](/tr/tools/browser)

## Yaygın bayraklar

- `--url <gatewayWsUrl>`: Gateway WebSocket URL’si (varsayılan olarak yapılandırmadan alınır).
- `--token <token>`: Gateway belirteci (gerekiyorsa).
- `--timeout <ms>`: istek zaman aşımı (ms).
- `--expect-final`: son bir Gateway yanıtı bekleyin.
- `--browser-profile <name>`: bir tarayıcı profili seçin (varsayılan yapılandırmadan alınır).
- `--json`: makine tarafından okunabilir çıktı (desteklendiği yerlerde).

## Hızlı başlangıç (yerel)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

## Hızlı sorun giderme

`start`, `not reachable after start` ile başarısız olursa önce CDP hazır olma durumunu giderin. `start` ve `tabs` başarılı olup `open` veya `navigate` başarısız olursa, tarayıcı denetim düzlemi sağlıklıdır ve hata genellikle gezinme SSRF ilkesidir.

Asgari sıra:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Ayrıntılı kılavuz: [Tarayıcı sorun giderme](/tr/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

## Yaşam döngüsü

```bash
openclaw browser status
openclaw browser start
openclaw browser stop
openclaw browser --browser-profile openclaw reset-profile
```

Notlar:

- `attachOnly` ve uzak CDP profilleri için `openclaw browser stop`, OpenClaw tarayıcı sürecini kendisi başlatmamış olsa bile etkin denetim oturumunu kapatır ve geçici öykünme geçersiz kılmalarını temizler.
- Yerel yönetilen profiller için `openclaw browser stop`, oluşturulan tarayıcı sürecini durdurur.

## Komut eksikse

`openclaw browser` bilinmeyen bir komutsa `~/.openclaw/openclaw.json` içindeki `plugins.allow` değerini kontrol edin.

`plugins.allow` mevcut olduğunda, paketle gelen tarayıcı Plugin'i açıkça listelenmelidir:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Plugin izin listesi `browser` öğesini dışlıyorsa `browser.enabled=true`, CLI alt komutunu geri getirmez.

İlgili: [Tarayıcı aracı](/tr/tools/browser#missing-browser-command-or-tool)

## Profiller

Profiller, adlandırılmış tarayıcı yönlendirme yapılandırmalarıdır. Uygulamada:

- `openclaw`: özel bir OpenClaw tarafından yönetilen Chrome örneğini başlatır veya buna bağlanır (yalıtılmış kullanıcı veri dizini).
- `user`: mevcut oturum açılmış Chrome oturumunuzu Chrome DevTools MCP aracılığıyla denetler.
- özel CDP profilleri: yerel veya uzak bir CDP uç noktasına yönelir.

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
openclaw browser tab new
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://docs.openclaw.ai
openclaw browser focus <targetId>
openclaw browser close <targetId>
```

## Anlık görüntü / ekran görüntüsü / eylemler

Anlık görüntü:

```bash
openclaw browser snapshot
```

Ekran görüntüsü:

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref e12
```

Notlar:

- `--full-page` yalnızca sayfa yakalamaları içindir; `--ref` veya `--element` ile birleştirilemez.
- `existing-session` / `user` profilleri sayfa ekran görüntülerini ve anlık görüntü çıktısından `--ref` ekran görüntülerini destekler, ancak CSS `--element` ekran görüntülerini desteklemez.

Gezinme/tıklama/yazma (ref tabanlı UI otomasyonu):

```bash
openclaw browser navigate https://example.com
openclaw browser click <ref>
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

Dosya + iletişim kutusu yardımcıları:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
```

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

Bu yol yalnızca ana makine içindir. Docker, başsız sunucular, Browserless veya diğer uzak kurulumlar için bunun yerine bir CDP profili kullanın.

Geçerli existing-session sınırları:

- anlık görüntü güdümlü eylemler CSS seçicileri değil, ref'leri kullanır
- `click` yalnızca sol tıklamadır
- `type`, `slowly=true` desteğine sahip değildir
- `press`, `delayMs` desteğine sahip değildir
- `hover`, `scrollintoview`, `drag`, `select`, `fill` ve `evaluate`, çağrı başına zaman aşımı geçersiz kılmalarını reddeder
- `select` yalnızca tek bir değeri destekler
- `wait --load networkidle` desteklenmez
- dosya yüklemeleri `--ref` / `--input-ref` gerektirir, CSS `--element` desteği yoktur ve şu anda bir seferde yalnızca tek dosyayı destekler
- iletişim kutusu kancaları `--timeout` desteğine sahip değildir
- ekran görüntüleri sayfa yakalamalarını ve `--ref` değerini destekler, ancak CSS `--element` desteği yoktur
- `responsebody`, indirme yakalama, PDF dışa aktarma ve toplu eylemler hâlâ yönetilen bir tarayıcı veya ham CDP profili gerektirir

## Uzak tarayıcı denetimi (düğüm ana makinesi proxy'si)

Gateway, tarayıcıyla aynı makinede çalışmıyorsa Chrome/Brave/Edge/Chromium bulunan makinede bir **düğüm ana makinesi** çalıştırın. Gateway, tarayıcı eylemlerini o düğüme proxy eder (ayrı bir tarayıcı denetim sunucusu gerekmez).

Otomatik yönlendirmeyi denetlemek için `gateway.nodes.browser.mode`, birden fazla düğüm bağlıysa belirli bir düğümü sabitlemek için `gateway.nodes.browser.node` kullanın.

Güvenlik + uzak kurulum: [Tarayıcı aracı](/tr/tools/browser), [Uzak erişim](/tr/gateway/remote), [Tailscale](/tr/gateway/tailscale), [Güvenlik](/tr/gateway/security)

## İlgili

- [CLI başvurusu](/tr/cli)
- [Tarayıcı](/tr/tools/browser)
