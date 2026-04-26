---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: Linux'ta OpenClaw tarayıcı denetimi için Chrome/Brave/Edge/Chromium CDP başlatma sorunlarını düzeltin
title: Tarayıcı sorun giderme
x-i18n:
    generated_at: "2026-04-26T11:41:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 69e5b42532af002af3d6a3ab21df7f82d2d62ce9f23b57a94cdb97e8ac65df3b
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 15
---

## Sorun: "Chrome CDP 18800 portunda başlatılamadı"

OpenClaw'ın tarayıcı denetim sunucusu, Chrome/Brave/Edge/Chromium'u şu hatayla başlatamıyor:

```
{"error":"Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"."}
```

### Temel neden

Ubuntu'da (ve birçok Linux dağıtımında), varsayılan Chromium kurulumu bir **snap paketi**dir. Snap'in AppArmor yalıtımı, OpenClaw'ın tarayıcı sürecini başlatma ve izleme biçimine müdahale eder.

`apt install chromium` komutu, snap'e yönlendiren bir sahte paket kurar:

```
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

Bu, gerçek bir tarayıcı DEĞİLDİR — yalnızca bir sarmalayıcıdır.

Diğer yaygın Linux başlatma hataları:

- `The profile appears to be in use by another Chromium process`, yönetilen profil dizininde eski `Singleton*` kilit dosyaları bulunduğu anlamına gelir. OpenClaw, kilit ölü bir süreci veya farklı bir ana makine sürecini işaret ediyorsa bu kilitleri kaldırır ve bir kez daha dener.
- `Missing X server or $DISPLAY`, masaüstü oturumu olmayan bir ana makinede görünür bir tarayıcının açıkça istendiği anlamına gelir. Varsayılan olarak, yerel yönetilen profiller artık Linux'ta `DISPLAY` ve `WAYLAND_DISPLAY` ikisi de ayarlanmamışsa başsız moda geri döner. `OPENCLAW_BROWSER_HEADLESS=0`, `browser.headless: false` veya `browser.profiles.<name>.headless: false` ayarladıysanız, bu görünür mod geçersiz kılmasını kaldırın, `OPENCLAW_BROWSER_HEADLESS=1` ayarlayın, `Xvfb` başlatın, tek seferlik yönetilen bir başlatma için `openclaw browser start --headless` çalıştırın veya OpenClaw'ı gerçek bir masaüstü oturumunda çalıştırın.

### Çözüm 1: Google Chrome kurun (önerilen)

Snap ile yalıtılmamış resmi Google Chrome `.deb` paketini kurun:

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # bağımlılık hataları varsa
```

Ardından OpenClaw yapılandırmanızı güncelleyin (`~/.openclaw/openclaw.json`):

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

### Çözüm 2: Snap Chromium'u yalnızca bağlanma moduyla kullanın

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

3. İsteğe bağlı olarak Chrome'u otomatik başlatmak için bir systemd kullanıcı hizmeti oluşturun:

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

### Tarayıcının çalıştığını doğrulama

Durumu kontrol edin:

```bash
curl -s http://127.0.0.1:18791/ | jq '{running, pid, chosenBrowser}'
```

Gezinmeyi test edin:

```bash
curl -s -X POST http://127.0.0.1:18791/start
curl -s http://127.0.0.1:18791/tabs
```

### Yapılandırma başvurusu

| Seçenek                          | Açıklama                                                             | Varsayılan                                                  |
| -------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------- |
| `browser.enabled`                | Tarayıcı denetimini etkinleştirir                                    | `true`                                                      |
| `browser.executablePath`         | Chromium tabanlı tarayıcı ikilisinin yolu (Chrome/Brave/Edge/Chromium) | otomatik algılanır (Chromium tabanlıysa varsayılan tarayıcı tercih edilir) |
| `browser.headless`               | GUI olmadan çalıştırır                                                | `false`                                                     |
| `OPENCLAW_BROWSER_HEADLESS`      | Yerel yönetilen tarayıcı başsız modu için süreç başına geçersiz kılma | ayarlanmamış                                                |
| `browser.noSandbox`              | `--no-sandbox` bayrağını ekler (bazı Linux kurulumları için gereklidir) | `false`                                                  |
| `browser.attachOnly`             | Tarayıcıyı başlatmaz, yalnızca var olana bağlanır                     | `false`                                                     |
| `browser.cdpPort`                | Chrome DevTools Protocol portu                                       | `18800`                                                     |
| `browser.localLaunchTimeoutMs`   | Yerel yönetilen Chrome keşif zaman aşımı                            | `15000`                                                     |
| `browser.localCdpReadyTimeoutMs` | Yerel yönetilen başlatma sonrası CDP hazır olma zaman aşımı         | `8000`                                                      |

Raspberry Pi, eski VPS ana makineleri veya yavaş depolamada, Chrome'un CDP HTTP uç noktasını gösterebilmesi için daha fazla zamana ihtiyacı varsa `browser.localLaunchTimeoutMs` değerini artırın. Başlatma başarılı olduğu hâlde `openclaw browser start` hâlâ `not reachable after start` bildiriyorsa `browser.localCdpReadyTimeoutMs` değerini artırın. Değerler `120000` ms'ye kadar pozitif tamsayılar olmalıdır; geçersiz yapılandırma değerleri reddedilir.

### Sorun: "No Chrome tabs found for profile=\"user\""

Bir `existing-session` / Chrome MCP profili kullanıyorsunuz. OpenClaw yerel Chrome'u görebiliyor, ancak bağlanmak için açık sekme yok.

Düzeltme seçenekleri:

1. **Yönetilen tarayıcıyı kullanın:** `openclaw browser start --browser-profile openclaw` (veya `browser.defaultProfile: "openclaw"` ayarlayın).
2. **Chrome MCP kullanın:** yerel Chrome'un en az bir açık sekmeyle çalıştığından emin olun, ardından `--browser-profile user` ile yeniden deneyin.

Notlar:

- `user` yalnızca ana makine içindir. Linux sunucuları, kapsayıcılar veya uzak ana makineler için CDP profillerini tercih edin.
- `user` / diğer `existing-session` profilleri mevcut Chrome MCP sınırlarını korur: başvuru odaklı eylemler, tek dosya yükleme kancaları, iletişim kutusu zaman aşımı geçersiz kılmaları yok, `wait --load networkidle` yok ve `responsebody`, PDF dışa aktarma, indirme yakalama veya toplu eylemler yok.
- Yerel `openclaw` profilleri `cdpPort`/`cdpUrl` değerlerini otomatik atar; bunları yalnızca uzak CDP için ayarlayın.
- Uzak CDP profilleri `http://`, `https://`, `ws://` ve `wss://` kabul eder. `/json/version` keşfi için HTTP(S), tarayıcı hizmetiniz size doğrudan bir DevTools soket URL'si veriyorsa WS(S) kullanın.

## İlgili

- [Tarayıcı](/tr/tools/browser)
- [Tarayıcı girişi](/tr/tools/browser-login)
- [Tarayıcı WSL2 sorun giderme](/tr/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
