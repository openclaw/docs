---
read_when:
    - '`openclaw browser` kullanıyor ve yaygın görevler için örnekler istiyorsanız'
    - Bir düğüm ana makinesi üzerinden başka bir makinede çalışan tarayıcıyı kontrol etmek istiyorsanız
    - Chrome MCP üzerinden yerel oturum açılmış Chrome'unuza bağlanmak istiyorsanız
summary: '`openclaw browser` için CLI başvurusu (yaşam döngüsü, profiller, sekmeler, eylemler, durum, ve hata ayıklama)'
title: browser
x-i18n:
    generated_at: "2026-04-05T13:48:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: c89a7483dd733863dd8ebd47a14fbb411808ad07daaed515c1270978de9157e7
    source_path: cli/browser.md
    workflow: 15
---

# `openclaw browser`

OpenClaw'ın tarayıcı kontrol yüzeyini yönetin ve tarayıcı eylemlerini çalıştırın (yaşam döngüsü, profiller, sekmeler, anlık görüntüler, ekran görüntüleri, gezinme, giriş, durum öykünmesi ve hata ayıklama).

İlgili:

- Tarayıcı aracı + API: [Tarayıcı aracı](/tools/browser)

## Yaygın bayraklar

- `--url <gatewayWsUrl>`: Ağ geçidi WebSocket URL'si (varsayılan olarak yapılandırmadan alınır).
- `--token <token>`: Ağ geçidi token'ı (gerekiyorsa).
- `--timeout <ms>`: istek zaman aşımı (ms).
- `--expect-final`: son bir ağ geçidi yanıtını bekleyin.
- `--browser-profile <name>`: bir tarayıcı profili seçin (varsayılan yapılandırmadan alınır).
- `--json`: makine tarafından okunabilir çıktı (desteklenen yerlerde).

## Hızlı başlangıç (yerel)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

## Yaşam döngüsü

```bash
openclaw browser status
openclaw browser start
openclaw browser stop
openclaw browser --browser-profile openclaw reset-profile
```

Notlar:

- `attachOnly` ve uzak CDP profilleri için `openclaw browser stop`, OpenClaw
  tarayıcı sürecini kendisi başlatmamış olsa bile etkin kontrol oturumunu kapatır
  ve geçici öykünme geçersiz kılmalarını temizler.
- Yerel yönetilen profiller için `openclaw browser stop`, oluşturulan tarayıcı
  sürecini durdurur.

## Komut eksikse

`openclaw browser` bilinmeyen bir komutsa `~/.openclaw/openclaw.json`
içindeki `plugins.allow` değerini kontrol edin.

`plugins.allow` mevcut olduğunda, paketlenmiş tarayıcı eklentisinin
açıkça listelenmesi gerekir:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Eklenti allowlist'i `browser` öğesini dışlıyorsa `browser.enabled=true`,
CLI alt komutunu geri getirmez.

İlgili: [Tarayıcı aracı](/tools/browser#missing-browser-command-or-tool)

## Profiller

Profiller, adlandırılmış tarayıcı yönlendirme yapılandırmalarıdır. Pratikte:

- `openclaw`: OpenClaw tarafından yönetilen özel bir Chrome örneğini başlatır veya ona bağlanır (yalıtılmış kullanıcı veri dizini).
- `user`: Chrome DevTools MCP üzerinden mevcut oturum açılmış Chrome oturumunuzu kontrol eder.
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

- `--full-page` yalnızca sayfa yakalamaları içindir; `--ref`
  veya `--element` ile birleştirilemez.
- `existing-session` / `user` profilleri sayfa ekran görüntülerini ve anlık görüntü çıktısından
  `--ref` ekran görüntülerini destekler, ancak CSS `--element` ekran görüntülerini desteklemez.

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

Bu yol yalnızca ana makine içindir. Docker, headless sunucular, Browserless veya diğer uzak kurulumlar için bunun yerine bir CDP profili kullanın.

Mevcut existing-session sınırları:

- anlık görüntü odaklı eylemler CSS seçicileri değil, ref'leri kullanır
- `click` yalnızca sol tıklamayı destekler
- `type`, `slowly=true` desteği sunmaz
- `press`, `delayMs` desteği sunmaz
- `hover`, `scrollintoview`, `drag`, `select`, `fill` ve `evaluate`,
  çağrı başına zaman aşımı geçersiz kılmalarını reddeder
- `select` yalnızca tek bir değeri destekler
- `wait --load networkidle` desteklenmez
- dosya yüklemeleri `--ref` / `--input-ref` gerektirir, CSS
  `--element` desteği sunmaz ve şu anda aynı anda tek dosyayı destekler
- iletişim kutusu kancaları `--timeout` desteği sunmaz
- ekran görüntüleri sayfa yakalamalarını ve `--ref` değerini destekler, ancak CSS `--element` desteği sunmaz
- `responsebody`, indirme yakalama, PDF dışa aktarma ve toplu eylemler hâlâ
  yönetilen bir tarayıcı veya ham CDP profili gerektirir

## Uzak tarayıcı denetimi (düğüm ana makinesi proxy'si)

Ağ geçidi tarayıcıdan farklı bir makinede çalışıyorsa Chrome/Brave/Edge/Chromium bulunan makinede bir **düğüm ana makinesi** çalıştırın. Ağ geçidi, tarayıcı eylemlerini o düğüme proxy'ler (ayrı bir tarayıcı kontrol sunucusu gerekmez).

Otomatik yönlendirmeyi denetlemek için `gateway.nodes.browser.mode`, birden fazla düğüm bağlıysa belirli bir düğümü sabitlemek için `gateway.nodes.browser.node` kullanın.

Güvenlik + uzak kurulum: [Tarayıcı aracı](/tools/browser), [Uzaktan erişim](/gateway/remote), [Tailscale](/gateway/tailscale), [Güvenlik](/gateway/security)
