---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: Linux'ta OpenClaw tarayıcı kontrolü için Chrome/Brave/Edge/Chromium CDP başlatma sorunlarını giderin
title: Tarayıcı sorunlarını giderme
x-i18n:
    generated_at: "2026-04-30T09:46:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: d9a91ea42a8a600163bcf66ad398677175bd0c5186d3e1dddb629a55c2ea66ed
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 16
---

## Sorun: "Failed to start Chrome CDP on port 18800"

OpenClaw'ın tarayıcı denetim sunucusu Chrome/Brave/Edge/Chromium başlatırken şu hatayla başarısız olur:

```
{"error":"Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"."}
```

### Kök neden

Ubuntu'da (ve birçok Linux dağıtımında), varsayılan Chromium kurulumu bir **snap paketi**dir. Snap'in AppArmor kısıtlaması, OpenClaw'ın tarayıcı sürecini başlatma ve izleme biçimiyle çakışır.

`apt install chromium` komutu, snap'e yönlendiren bir stub paket kurar:

```
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

Bu gerçek bir tarayıcı DEĞİLDİR - yalnızca bir sarmalayıcıdır.

Diğer yaygın Linux başlatma hataları:

- `The profile appears to be in use by another Chromium process`, Chrome'un
  yönetilen profil dizininde eski `Singleton*` kilit dosyaları bulduğu anlamına gelir. OpenClaw,
  kilit ölü veya farklı bir ana makine sürecini gösterdiğinde bu kilitleri
  kaldırır ve bir kez yeniden dener.
- `Missing X server or $DISPLAY`, masaüstü oturumu olmayan bir ana makinede görünür bir tarayıcının açıkça
  istendiği anlamına gelir. Varsayılan olarak, yerel yönetilen
  profiller artık Linux'ta hem `DISPLAY` hem de
  `WAYLAND_DISPLAY` ayarlı olmadığında headless moda geri döner. `OPENCLAW_BROWSER_HEADLESS=0`,
  `browser.headless: false` veya `browser.profiles.<name>.headless: false` ayarladıysanız,
  bu headed geçersiz kılmasını kaldırın, `OPENCLAW_BROWSER_HEADLESS=1` ayarlayın, `Xvfb` başlatın,
  tek seferlik yönetilen başlatma için `openclaw browser start --headless` çalıştırın ya da
  OpenClaw'ı gerçek bir masaüstü oturumunda çalıştırın.

### Çözüm 1: Google Chrome Kurun (Önerilir)

Snap tarafından sandbox'a alınmayan resmi Google Chrome `.deb` paketini kurun:

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # if there are dependency errors
```

Ardından OpenClaw yapılandırmanızı (`~/.openclaw/openclaw.json`) güncelleyin:

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

### Çözüm 2: Snap Chromium'u Yalnızca Bağlanma Moduyla Kullanın

Snap Chromium kullanmak zorundaysanız, OpenClaw'ı elle başlatılmış bir tarayıcıya bağlanacak şekilde yapılandırın:

1. Yapılandırmayı güncelleyin:

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

2. Chromium'u elle başlatın:

```bash
chromium-browser --headless --no-sandbox --disable-gpu \
  --remote-debugging-port=18800 \
  --user-data-dir=$HOME/.openclaw/browser/openclaw/user-data \
  about:blank &
```

3. İsteğe bağlı olarak Chrome'u otomatik başlatmak için bir systemd kullanıcı servisi oluşturun:

```ini
# ~/.config/systemd/user/openclaw-browser.service
[Unit]
Description=OpenClaw Browser (Chrome CDP)
After=network.target

[Service]
ExecStart=/snap/bin/chromium --headless --no-sandbox --disable-gpu --remote-debugging-port=18800 --user-data-dir=%h/.openclaw/browser/openclaw/user-data about:blank
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
```

Şununla etkinleştirin: `systemctl --user enable --now openclaw-browser.service`

### Tarayıcının Çalıştığını Doğrulama

Durumu denetleyin:

```bash
curl -s http://127.0.0.1:18791/ | jq '{running, pid, chosenBrowser}'
```

Gezinmeyi test edin:

```bash
curl -s -X POST http://127.0.0.1:18791/start
curl -s http://127.0.0.1:18791/tabs
```

### Yapılandırma başvurusu

| Seçenek                          | Açıklama                                                            | Varsayılan                                                  |
| -------------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------- |
| `browser.enabled`                | Tarayıcı denetimini etkinleştir                                     | `true`                                                      |
| `browser.executablePath`         | Chromium tabanlı tarayıcı ikili dosyasının yolu (Chrome/Brave/Edge/Chromium) | otomatik algılanır (Chromium tabanlıysa varsayılan tarayıcı tercih edilir) |
| `browser.headless`               | GUI olmadan çalıştır                                                | `false`                                                     |
| `OPENCLAW_BROWSER_HEADLESS`      | Yerel yönetilen tarayıcı headless modu için süreç başına geçersiz kılma | ayarlı değil                                                |
| `browser.noSandbox`              | `--no-sandbox` bayrağını ekle (bazı Linux kurulumları için gereklidir) | `false`                                                     |
| `browser.attachOnly`             | Tarayıcı başlatma, yalnızca mevcut olana bağlan                     | `false`                                                     |
| `browser.cdpPort`                | Chrome DevTools Protocol bağlantı noktası                           | `18800`                                                     |
| `browser.localLaunchTimeoutMs`   | Yerel yönetilen Chrome keşif zaman aşımı                            | `15000`                                                     |
| `browser.localCdpReadyTimeoutMs` | Yerel yönetilen başlatma sonrası CDP hazır olma zaman aşımı         | `8000`                                                      |

Raspberry Pi, eski VPS ana makineleri veya yavaş depolama üzerinde, Chrome'un CDP HTTP
uç noktasını sunmak için daha fazla zamana ihtiyacı olduğunda
`browser.localLaunchTimeoutMs` değerini artırın. Başlatma başarılı olduğu halde
`openclaw browser start` hâlâ `not reachable after start` bildiriyorsa `browser.localCdpReadyTimeoutMs`
değerini artırın. Değerler `120000` ms'ye kadar pozitif tam sayılar olmalıdır;
geçersiz yapılandırma değerleri reddedilir.

### Sorun: "No Chrome tabs found for profile=\"user\""

Bir `existing-session` / Chrome MCP profili kullanıyorsunuz. OpenClaw yerel Chrome'u görebiliyor,
ancak bağlanılabilecek açık sekme yok.

Düzeltme seçenekleri:

1. **Yönetilen tarayıcıyı kullanın:** `openclaw browser start --browser-profile openclaw`
   (veya `browser.defaultProfile: "openclaw"` ayarlayın).
2. **Chrome MCP kullanın:** yerel Chrome'un en az bir açık sekmeyle çalıştığından emin olun, ardından `--browser-profile user` ile yeniden deneyin.

Notlar:

- `user` yalnızca ana makineye özgüdür. Linux sunucuları, container'lar veya uzak ana makineler için CDP profillerini tercih edin.
- `user` / diğer `existing-session` profilleri mevcut Chrome MCP sınırlarını korur:
  ref odaklı eylemler, tek dosya yükleme hook'ları, dialog zaman aşımı geçersiz kılmaları yok,
  `wait --load networkidle` yok ve `responsebody`, PDF dışa aktarma, indirme
  yakalama veya toplu eylemler yok.
- Yerel `openclaw` profilleri `cdpPort`/`cdpUrl` değerlerini otomatik atar; bunları yalnızca uzak CDP için ayarlayın.
- Uzak CDP profilleri `http://`, `https://`, `ws://` ve `wss://` kabul eder.
  `/json/version` keşfi için HTTP(S), tarayıcı
  servisiniz doğrudan bir DevTools soket URL'si veriyorsa WS(S) kullanın.

## İlgili

- [Tarayıcı](/tr/tools/browser)
- [Tarayıcı oturum açma](/tr/tools/browser-login)
- [Tarayıcı WSL2 sorun giderme](/tr/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
