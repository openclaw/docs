---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: Linux üzerinde OpenClaw tarayıcı denetimi için Chrome/Brave/Edge/Chromium CDP başlatma sorunlarını düzeltin
title: Tarayıcı Sorun Giderme
x-i18n:
    generated_at: "2026-04-05T14:10:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9ff8e6741558c1b5db86826c5e1cbafe35e35afe5cb2a53296c16653da59e516
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 15
---

# Tarayıcı Sorun Giderme (Linux)

## Sorun: "Failed to start Chrome CDP on port 18800"

OpenClaw’un tarayıcı denetim sunucusu, şu hatayla Chrome/Brave/Edge/Chromium başlatamıyor:

```
{"error":"Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"."}
```

### Kök Neden

Ubuntu’da (ve birçok Linux dağıtımında), varsayılan Chromium kurulumu bir **snap paketi**dir. Snap’in AppArmor kısıtlaması, OpenClaw’un tarayıcı işlemini başlatma ve izleme biçimine müdahale eder.

`apt install chromium` komutu, snap’e yönlendiren bir saplama paket kurar:

```
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

Bu gerçek bir tarayıcı DEĞİLDİR - yalnızca bir sarmalayıcıdır.

### Çözüm 1: Google Chrome yükleyin (önerilir)

Snap tarafından sandbox içine alınmamış resmi Google Chrome `.deb` paketini yükleyin:

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

### Çözüm 2: Snap Chromium’u Yalnızca-Bağlan Moduyla Kullanma

Snap Chromium kullanmak zorundaysanız, OpenClaw’u el ile başlatılmış bir tarayıcıya bağlanacak şekilde yapılandırın:

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

2. Chromium’u el ile başlatın:

```bash
chromium-browser --headless --no-sandbox --disable-gpu \
  --remote-debugging-port=18800 \
  --user-data-dir=$HOME/.openclaw/browser/openclaw/user-data \
  about:blank &
```

3. İsteğe bağlı olarak Chrome’u otomatik başlatmak için bir systemd kullanıcı hizmeti oluşturun:

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

Durumu kontrol edin:

```bash
curl -s http://127.0.0.1:18791/ | jq '{running, pid, chosenBrowser}'
```

Gezinmeyi test edin:

```bash
curl -s -X POST http://127.0.0.1:18791/start
curl -s http://127.0.0.1:18791/tabs
```

### Yapılandırma Başvurusu

| Seçenek                  | Açıklama                                                             | Varsayılan                                                  |
| ------------------------ | -------------------------------------------------------------------- | ----------------------------------------------------------- |
| `browser.enabled`        | Tarayıcı denetimini etkinleştirir                                    | `true`                                                      |
| `browser.executablePath` | Chromium tabanlı tarayıcı ikilisinin yolu (Chrome/Brave/Edge/Chromium) | otomatik algılanır (Chromium tabanlıysa varsayılan tarayıcıyı tercih eder) |
| `browser.headless`       | GUI olmadan çalıştırır                                               | `false`                                                     |
| `browser.noSandbox`      | `--no-sandbox` bayrağını ekler (bazı Linux kurulumları için gerekir) | `false`                                                     |
| `browser.attachOnly`     | Tarayıcıyı başlatmaz, yalnızca mevcut olana bağlanır                 | `false`                                                     |
| `browser.cdpPort`        | Chrome DevTools Protocol portu                                       | `18800`                                                     |

### Sorun: "No Chrome tabs found for profile=\"user\""

Bir `existing-session` / Chrome MCP profili kullanıyorsunuz. OpenClaw yerel Chrome’u görebiliyor,
ancak bağlanılabilecek açık sekme yok.

Düzeltme seçenekleri:

1. **Yönetilen tarayıcıyı kullanın:** `openclaw browser start --browser-profile openclaw`
   (veya `browser.defaultProfile: "openclaw"` ayarlayın).
2. **Chrome MCP kullanın:** yerel Chrome’un en az bir açık sekmeyle çalıştığından emin olun, sonra `--browser-profile user` ile yeniden deneyin.

Notlar:

- `user` yalnızca ana makine içindir. Linux sunucuları, kapsayıcılar veya uzak ana makineler için CDP profillerini tercih edin.
- `user` / diğer `existing-session` profilleri, mevcut Chrome MCP sınırlarını korur:
  ref tabanlı eylemler, tek dosya yükleme kancaları, iletişim kutusu zaman aşımı geçersiz kılmaları yok,
  `wait --load networkidle` yok ve `responsebody`, PDF dışa aktarma, indirme
  yakalama veya toplu eylemler yok.
- Yerel `openclaw` profilleri `cdpPort`/`cdpUrl` değerlerini otomatik atar; bunları yalnızca uzak CDP için ayarlayın.
- Uzak CDP profilleri `http://`, `https://`, `ws://` ve `wss://` kabul eder.
  `/json/version` keşfi için HTTP(S) kullanın veya tarayıcı hizmetiniz
  size doğrudan bir DevTools soket URL’si veriyorsa WS(S) kullanın.
