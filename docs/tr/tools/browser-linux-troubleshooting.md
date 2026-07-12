---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: Linux'te OpenClaw tarayıcı denetimi için Chrome/Brave/Edge/Chromium CDP başlatma sorunlarını düzeltme
title: Tarayıcı sorunlarını giderme
x-i18n:
    generated_at: "2026-07-12T12:46:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e0256e8ee441802086cd486923060be54f8966b423e5dcb71fc8961bbab5d729
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 16
---

## Sorun: 18800 numaralı bağlantı noktasında Chrome CDP başlatılamadı

```json
{ "error": "Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"." }
```

### Temel neden

Ubuntu'da ve çoğu Linux dağıtımında `apt install chromium`, gerçek bir tarayıcı
yerine bir snap sarmalayıcısı yükler:

```text
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

Snap'in AppArmor kısıtlaması, OpenClaw'un tarayıcı işlemini başlatma ve izleme
biçimini engeller.

Diğer yaygın Linux başlatma hataları:

- `The profile appears to be in use by another Chromium process`: yönetilen
  profil dizinindeki eski `Singleton*` kilit dosyaları. Kilit, artık çalışmayan
  veya farklı bir ana makinedeki işleme işaret ettiğinde OpenClaw bu kilitleri
  kaldırır ve bir kez yeniden dener.
- `Missing X server or $DISPLAY`: masaüstü oturumu bulunmayan bir ana makinede
  görünür bir tarayıcı açıkça istenmiştir. Hem `DISPLAY` hem de
  `WAYLAND_DISPLAY` ayarlanmamışsa yerel yönetilen profiller Linux'ta başsız
  moda geri döner. `OPENCLAW_BROWSER_HEADLESS=0`, `browser.headless: false`
  veya `browser.profiles.<name>.headless: false` ayarladıysanız bu görünür mod
  geçersiz kılmasını kaldırın, `OPENCLAW_BROWSER_HEADLESS=1` ayarlayın,
  `Xvfb` başlatın, tek seferlik yönetilen başlatma için
  `openclaw browser start --headless` komutunu çalıştırın veya OpenClaw'u
  gerçek bir masaüstü oturumunda çalıştırın.

### Çözüm 1: Google Chrome'u yükleyin (önerilen)

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # bağımlılık hataları varsa
```

`~/.openclaw/openclaw.json` dosyasını güncelleyin:

```json
{
  "browser": {
    "enabled": true,
    "executablePath": "/usr/bin/google-chrome-stable",
    "headless": true,
    "noSandbox": true
  }
}
```

### Çözüm 2: snap Chromium'u yalnızca bağlanma modunda kullanın

Snap Chromium'u kullanmaya devam etmeniz gerekiyorsa OpenClaw'u tarayıcıyı
başlatmak yerine elle başlatılan bir tarayıcıya bağlanacak şekilde yapılandırın:

```json
{
  "browser": {
    "enabled": true,
    "attachOnly": true,
    "headless": true,
    "noSandbox": true
  }
}
```

Chromium'u elle başlatın:

```bash
chromium-browser --headless --no-sandbox --disable-gpu \
  --remote-debugging-port=18800 \
  --user-data-dir=$HOME/.openclaw/browser/openclaw/user-data \
  about:blank &
```

İsteğe bağlı olarak bir systemd kullanıcı hizmetiyle otomatik başlatın:

```ini
# ~/.config/systemd/user/openclaw-browser.service
[Unit]
Description=OpenClaw Tarayıcısı (Chrome CDP)
After=network.target

[Service]
ExecStart=/snap/bin/chromium --headless --no-sandbox --disable-gpu --remote-debugging-port=18800 --user-data-dir=%h/.openclaw/browser/openclaw/user-data about:blank
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
```

```bash
systemctl --user enable --now openclaw-browser.service
```

### Tarayıcının çalıştığını doğrulayın

```bash
curl -s http://127.0.0.1:18791/ | jq '{running, pid, chosenBrowser}'
curl -s -X POST http://127.0.0.1:18791/start
curl -s http://127.0.0.1:18791/tabs
```

### Yapılandırma başvurusu

| Seçenek                          | Açıklama                                                                 | Varsayılan                                                                 |
| -------------------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| `browser.enabled`                | Tarayıcı denetimini etkinleştirir                                        | `true`                                                                     |
| `browser.executablePath`         | Chromium tabanlı tarayıcı ikili dosyasının yolu (Chrome/Brave/Edge/Chromium) | otomatik algılanır (Chromium tabanlıysa işletim sisteminin varsayılan tarayıcısı tercih edilir) |
| `browser.headless`               | Grafiksel kullanıcı arayüzü olmadan çalıştırır                           | `false`                                                                    |
| `OPENCLAW_BROWSER_HEADLESS`      | Yerel yönetilen tarayıcının başsız modu için işlem bazında geçersiz kılma | ayarlanmamış                                                               |
| `browser.noSandbox`              | `--no-sandbox` bayrağını ekler (bazı Linux kurulumları için gereklidir)  | `false`                                                                    |
| `browser.attachOnly`             | Tarayıcı başlatmaz; yalnızca mevcut bir tarayıcıya bağlanır               | `false`                                                                    |
| `browser.cdpPortRangeStart`      | Otomatik atanan profiller için başlangıç yerel CDP bağlantı noktası       | `18800` (Gateway bağlantı noktasından türetilir)                            |
| `browser.localLaunchTimeoutMs`   | Yerel yönetilen Chrome keşif zaman aşımı, en fazla `120000`               | `15000`                                                                    |
| `browser.localCdpReadyTimeoutMs` | Yerel yönetilen tarayıcı başlatıldıktan sonraki CDP hazır olma zaman aşımı, en fazla `120000` | `8000`                                                                     |

Her iki zaman aşımı değeri de `120000` ms'ye kadar pozitif tam sayı olmalıdır;
diğer değerler yapılandırma yüklenirken reddedilir. Raspberry Pi, eski VPS ana
makineleri veya yavaş depolama birimlerinde Chrome'un CDP HTTP uç noktasını
kullanıma sunması daha uzun sürüyorsa `browser.localLaunchTimeoutMs` değerini
artırın. Başlatma başarılı olduğu hâlde `openclaw browser start` komutu hâlâ
`not reachable after start` bildiriyorsa `browser.localCdpReadyTimeoutMs`
değerini artırın.

### Sorun: profile="user" için Chrome sekmesi bulunamadı

`user` (`existing-session` / Chrome MCP) profilini kullanıyorsunuz ve
bağlanılabilecek açık sekme yok.

Düzeltme seçenekleri:

1. Bunun yerine yönetilen tarayıcıyı kullanın:
   `openclaw browser --browser-profile openclaw start` (veya
   `browser.defaultProfile: "openclaw"` ayarlayın).
2. Yerel Chrome'u en az bir açık sekmeyle çalışır durumda tutun, ardından
   `--browser-profile user` ile yeniden deneyin.

Notlar:

- `user` yalnızca ana makinede kullanılabilir. Linux sunucularında,
  konteynerlerde veya uzak ana makinelerde bunun yerine CDP profillerini
  tercih edin.
- `user` ve diğer `existing-session` profilleri mevcut Chrome MCP
  sınırlamalarını paylaşır: yalnızca referans odaklı eylemler, yükleme başına
  bir dosya, iletişim kutularında `timeoutMs` geçersiz kılması yok,
  `wait --load networkidle` yok ve yanıt gövdesi, PDF dışa aktarma, indirme
  yakalama veya toplu eylemler yoktur.
- Yerel `openclaw` sürücüsü profilleri `cdpPort`/`cdpUrl` değerlerini otomatik
  olarak atar; bunları yalnızca uzak CDP için elle ayarlayın.
- Uzak CDP profilleri `http://`, `https://`, `ws://` ve `wss://` protokollerini
  kabul eder. `/json/version` keşfi için HTTP(S), tarayıcı hizmetiniz doğrudan
  bir DevTools soket URL'si sağlıyorsa WS(S) kullanın.

## İlgili

- [Tarayıcı](/tr/tools/browser)
- [Tarayıcıda oturum açma](/tr/tools/browser-login)
- [Tarayıcı WSL2 sorunlarını giderme](/tr/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
