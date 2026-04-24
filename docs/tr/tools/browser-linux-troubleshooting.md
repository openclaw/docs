---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: Linux’ta OpenClaw tarayıcı denetimi için Chrome/Brave/Edge/Chromium CDP başlatma sorunlarını düzeltme
title: Tarayıcı sorun giderme
x-i18n:
    generated_at: "2026-04-24T09:33:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: e6f59048d6a5b587b8d6c9ac0d32b3215f68a7e39192256b28f22936cab752e1
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 15
---

## Sorun: "Failed to start Chrome CDP on port 18800"

OpenClaw’ın tarayıcı denetim sunucusu, Chrome/Brave/Edge/Chromium’u şu hatayla başlatamıyor:

```
{"error":"Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"."}
```

### Kök Neden

Ubuntu’da (ve birçok Linux dağıtımında), varsayılan Chromium kurulumu bir **snap paketi**dir. Snap’in AppArmor yalıtımı, OpenClaw’ın tarayıcı sürecini başlatma ve izleme biçimine müdahale eder.

`apt install chromium` komutu, snap’e yönlendiren bir stub paketi kurar:

```
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

Bu gerçek bir tarayıcı DEĞİLDİR — yalnızca bir sarmalayıcıdır.

### Çözüm 1: Google Chrome’u kurun (Önerilen)

Snap tarafından yalıtılmayan resmi Google Chrome `.deb` paketini kurun:

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

### Çözüm 2: Attach-Only Moduyla Snap Chromium kullanın

Snap Chromium kullanmanız gerekiyorsa, OpenClaw’ı elle başlatılmış bir tarayıcıya bağlanacak şekilde yapılandırın:

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

2. Chromium’u elle başlatın:

```bash
chromium-browser --headless --no-sandbox --disable-gpu \
  --remote-debugging-port=18800 \
  --user-data-dir=$HOME/.openclaw/browser/openclaw/user-data \
  about:blank &
```

3. İsteğe bağlı olarak Chrome’u otomatik başlatmak için bir systemd kullanıcı servisi oluşturun:

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

Durumu denetleyin:

```bash
curl -s http://127.0.0.1:18791/ | jq '{running, pid, chosenBrowser}'
```

Gezinmeyi test edin:

```bash
curl -s -X POST http://127.0.0.1:18791/start
curl -s http://127.0.0.1:18791/tabs
```

### Yapılandırma Referansı

| Seçenek                  | Açıklama                                                             | Varsayılan                                                  |
| ------------------------ | -------------------------------------------------------------------- | ----------------------------------------------------------- |
| `browser.enabled`        | Tarayıcı denetimini etkinleştir                                      | `true`                                                      |
| `browser.executablePath` | Chromium tabanlı bir tarayıcı ikilisine giden yol (Chrome/Brave/Edge/Chromium) | otomatik algılanır (Chromium tabanlıysa varsayılan tarayıcıyı tercih eder) |
| `browser.headless`       | GUI olmadan çalıştır                                                 | `false`                                                     |
| `browser.noSandbox`      | `--no-sandbox` bayrağını ekle (bazı Linux kurulumları için gereklidir) | `false`                                                     |
| `browser.attachOnly`     | Tarayıcıyı başlatma, yalnızca mevcut olana bağlan                    | `false`                                                     |
| `browser.cdpPort`        | Chrome DevTools Protocol portu                                       | `18800`                                                     |

### Sorun: "No Chrome tabs found for profile=\"user\""

Bir `existing-session` / Chrome MCP profili kullanıyorsunuz. OpenClaw yerel Chrome’u görebiliyor,
ancak bağlanılabilecek açık sekme yok.

Düzeltme seçenekleri:

1. **Yönetilen tarayıcıyı kullanın:** `openclaw browser start --browser-profile openclaw`
   (veya `browser.defaultProfile: "openclaw"` ayarlayın).
2. **Chrome MCP kullanın:** yerel Chrome’un en az bir açık sekmeyle çalıştığından emin olun, ardından `--browser-profile user` ile yeniden deneyin.

Notlar:

- `user` yalnızca ana makine içindir. Linux sunucuları, container’lar veya uzak ana makineler için CDP profillerini tercih edin.
- `user` / diğer `existing-session` profilleri mevcut Chrome MCP sınırlarını korur:
  ref güdümlü eylemler, tek dosya yükleme kancaları, ileti kutusu zaman aşımı geçersiz kılmaları yok, no
  `wait --load networkidle`, ayrıca `responsebody`, PDF dışa aktarma, indirme
  yakalama veya toplu eylemler yok.
- Yerel `openclaw` profilleri `cdpPort`/`cdpUrl` değerlerini otomatik atar; bunları yalnızca uzak CDP için ayarlayın.
- Uzak CDP profilleri `http://`, `https://`, `ws://` ve `wss://` kabul eder.
  `/json/version` keşfi için HTTP(S), tarayıcı hizmetiniz size doğrudan
  DevTools soket URL’si verdiğinde ise WS(S) kullanın.

## İlgili

- [Tarayıcı](/tr/tools/browser)
- [Tarayıcı girişi](/tr/tools/browser-login)
- [Tarayıcı WSL2 sorun giderme](/tr/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
